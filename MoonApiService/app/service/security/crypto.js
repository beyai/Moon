'use strict';
const _ = require('lodash');
const cbor = require('cbor')
const crypto = require('crypto');
const Service = require('egg').Service;

const CRYPTO_SERVICE_CERT = Symbol('CRYPTO_SERVICE_CERT')

class CryptoService extends Service {

    /** 证书有效时长 */
    get certTTL() {
        return 12 * 60 * 60
    }

    /** 签名有效时间 */
    get signTTL() {
        return 60
    }

    /**
     * 当前上下文证书
     * @returns {{
     *  deviceUID: string;
     *  sharedKey: string;
     *  serverPrivateKey: string;
     *  devicePublicKey: string;
     * }}
     */
    get cert() {
        if (!this[CRYPTO_SERVICE_CERT]) {
            throw new Error('证书未加载')
        }
        return this[CRYPTO_SERVICE_CERT]
    }

    /**
     * 生成服务端证书
     * @returns {{
     *  serverPrivateKey: string;
     *  serverPublishKey: string;
     * }}
     */
    generateServerCert() {
        const ecdh = crypto.createECDH('prime256v1');
        ecdh.generateKeys();
        return {
            serverPrivateKey: ecdh.getPrivateKey("base64"),
            serverPublicKey: ecdh.getPublicKey(null, 'uncompressed').toString('base64')
        }
    }
    
    /**
     * 加载证书
     * @param {string} deviceUID 设备唯一标识
     * @returns {{
     *  deviceUID: string;
     *  serverPrivateKey: Buffer;
     *  devicePublicKey: Buffer;
     * }}
     */
    async loadCert(deviceUID) {
        const cert = await this.app.cache.get(`ec:${ deviceUID }`)
        if (cert) {
            cert.deviceUID          = deviceUID
            cert.devicePublicKey    = Buffer.from(cert.devicePublicKey, 'base64')
            cert.serverPrivateKey   = Buffer.from(cert.serverPrivateKey, 'base64')
            this[CRYPTO_SERVICE_CERT] = cert
        } else {
            this.ctx.throw(402, '密钥已过期')
        }
    }

    /**
     * 获取共享密钥
     * @param {Buffer} salt 随机密钥盐
     */
    getSharedKey(salt) {
        const { serverPrivateKey, devicePublicKey } = this.cert
        const ecdh = crypto.createECDH('prime256v1');
        ecdh.setPrivateKey(serverPrivateKey);
        const rawSharedSecret = ecdh.computeSecret( devicePublicKey );
        const derivedKey = crypto.hkdfSync('sha256', rawSharedSecret, salt, '', 32);
        return Buffer.from(derivedKey)
    }

    /**
     * 保存设备对应用公钥与服务端私钥，级共享密钥
     * @param {string} deviceUID 设备唯一标识
     * @param {object} params 参数
     * @param {string} params.devicePublicKey 设备公钥
     * @param {string} params.serverPrivateKey 服务端私钥
     * @returns {{
     *  deviceUID: string;
     *  devicePublicKey: string;
     *  serverPrivateKey: string;
     * }}
     */
    async saveCert(deviceUID, params) {
        const data = {
            serverPrivateKey: params.serverPrivateKey,
            devicePublicKey: params.devicePublicKey,
        }
        await this.app.cache.set(`ec:${ deviceUID }`, data, this.certTTL)
        this[CRYPTO_SERVICE_CERT] = {
            deviceUID,
            serverPrivateKey: Buffer.from(data.serverPrivateKey, 'base64'),
            devicePublicKey: Buffer.from(data.devicePublicKey, 'base64'),
        };
        return data
    }

    /**
     * 验证时间
     * @param {number} timestamp 时间戳,秒
     */
    verifyTimestamp(timestamp) {
        const now = Math.floor(Date.now() / 1000)
        const half = this.signTTL / 2;
        return now > timestamp - half && now <= timestamp + half
    }

    /**
     * 验证数据
     * @param {{ timestamp: number, deviceUID: String, [key: string]: any }} data 待验证数据
     */
    verify(data) {
        if (!data || !data.timestamp) {
            this.ctx.throw(400, '数据无效')
        }
        if (!this.verifyTimestamp(data.timestamp)) {
            this.ctx.throw(400, '数据已过期')
        }
        return true;
    }

    /**
     * 加密数据
     * @param {{
     *  timestamp: number,
     *  [key: string]: any;
     * }} data 待签名数据
     * @param {string} salt 共享密钥盐
     * @returns {string} 加密后的 base64 字符串
     */
    encrypt(data, salt) {
        try {
            const sharedKey = this.getSharedKey(salt)
            const dataBuffer = cbor.encode(data)
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv('aes-256-gcm', sharedKey, iv);
            const encrypted = Buffer.concat([ cipher.update(dataBuffer), cipher.final() ]);
            const tag = cipher.getAuthTag()
            return Buffer.concat([ iv, tag, encrypted ]).toString('base64');
        } catch(error) {
            this.ctx.throw(400, '数据编码失败', { error })
        }
    }

    /**
     * 解密数据
     * @param {string} ciphertext 密文
     * @param {string} salt 共享密钥盐
     * @returns {{
     *  timestamp: number;
     *  [key: string]: any;
     * }}
     */
    decrypt(ciphertext, salt) {
        try {
            salt = Buffer.isBuffer(salt) ? salt : Buffer.from(salt, 'base64')
            const sharedKey = this.getSharedKey(salt)
            const buffer = Buffer.from(ciphertext, 'base64')
            const iv = buffer.subarray(0, 12)
            const tag = buffer.subarray(12, 28)
            const encrypted = buffer.subarray(28)
            const decipher = crypto.createDecipheriv('aes-256-gcm', sharedKey, iv);
            decipher.setAuthTag(tag);
            const decrypted = Buffer.concat([ decipher.update(encrypted), decipher.final() ]);
            return cbor.decode(decrypted)
        } catch (error) {
            this.ctx.throw(400, '数据解码失败', { error })
        }
    }

    /**
     * 生成并保存一对一密钥对
     * @param {object} data 请求数据
     * @param {string} data.deviceUID 设备唯一标识
     * @param {string} data.devicePublicKey 设备公钥
     * @returns {{
     *  deviceUID: string;
     *  serverPublicKey: string;
     * }}
     */
    async generateAndSaveKeyPair(data) {
        if (_.isEmpty(data.deviceUID)) {
            this.ctx.throw(412, '缺少 deviceUID 参数')
        }
        if (_.isEmpty(data.devicePublicKey)) {
            this.ctx.throw(412, '缺少 devicePublicKey 参数')
        }
        // 生成服务端密钥
        const { serverPrivateKey, serverPublicKey } = this.generateServerCert()
        // 保存密钥
        await this.saveCert(data.deviceUID, { 
            serverPrivateKey: serverPrivateKey, 
            devicePublicKey: data.devicePublicKey 
        })
        return {
            deviceUID: data.deviceUID,
            data: serverPublicKey
        }
    }

    /**
     * 加密请求数据
     * @param {Record<string, any>} data 响应数据
     * @returns {{ salt: string; data: string; }}
     */
    async encryptResponseData(data) {
        if (_.isArray(data) || !_.isObject(data)) {
            this.ctx.throw(412, '参数格式不正确')
        }
        // 添加时间戳
        data.timestamp = Math.floor( Date.now() / 1000)
        data.deviceUID = this.cert.deviceUID
        // 共享密钥盐
        const salt = crypto.randomBytes(32)
        // 加载数据
        const ciphertext = this.encrypt(data, salt)
        return {
            salt: salt.toString('base64'),
            data: ciphertext
        }
    }

    /**
     * 解密请求灵气
     * @param {object} body 请求数据
     * @param {string} body.deviceUID 设备唯一标识
     * @param {Buffer | string} body.data 待解密数据
     * @returns {Record<string, any>}
     */
    async decryptRequestBody(body) {
        if (_.isEmpty(body.deviceUID)) {
            this.ctx.throw(412, '缺少 deviceUID 参数')
        }
        if (_.isEmpty(body.salt)) {
            this.ctx.throw(412, '缺少 salt 参数')
        }
        if (_.isEmpty(body.data)) {
            this.ctx.throw(412, '缺少 data 参数')
        }
        // 加载证书
        await this.loadCert(body.deviceUID)
        // 解密数据
        return this.decrypt(body.data, body.salt)
    }

}

module.exports = CryptoService;
