'use strict';
const _ = require('lodash')
const crypto = require('crypto');
const cbor = require('cbor')
const Service = require('egg').Service;

const EPHEMERAL_ECDH = Symbol('EphemeralSession.ECDH')
const EPHEMERAL_DEVICE_UID = Symbol('EphemeralSession.deviceUID')
const EPHEMERAL_DEVICE_PUBLIC_KEY = Symbol('EphemeralSession.devicePublicKey')

class EphemeralSession extends Service {

    /** 缓存服务 */
    get CacheService() {
        return this.app.cache
    }
    
    /** 当前设备码 */
    get deviceUID() {
        return this[EPHEMERAL_DEVICE_UID] || null
    }

    /**
     * 服务端临时证书
     * @returns {crypto.ECDH}
     */
    get ECDH() {
        if (!this[EPHEMERAL_ECDH]) {
            const ecdh = crypto.createECDH('prime256v1');
            this[EPHEMERAL_ECDH] = ecdh
        }
        return this[EPHEMERAL_ECDH]
    }

    /** 设备公钥 */
    get devicePublicKey() {
        return this[EPHEMERAL_DEVICE_PUBLIC_KEY] || null
    }

    /**
     * 设置设备公钥
     * @param {Buffer} buffer 
     */
    setDevicePublicKey(buffer) {
        this[EPHEMERAL_DEVICE_PUBLIC_KEY] = buffer
    }

    /**
     * 生成服务端临时私钥
     */
    generatePrivateKey() {
        this.ECDH.generateKeys();
    }

    /**
     * 获取服务端临时公钥
     */
    getServicePublicKey() {
        return this.ECDH.getPublicKey(null, 'uncompressed')
    }

    /**
     * 获取共享密钥
     * @param {Buffer} salt 共享密钥盐 
     */
    getSharedKey(salt) {
        try {
            let secret = this.ECDH.computeSecret(this.devicePublicKey)
            return crypto.hkdfSync('sha256', secret, salt, '', 32);
        } catch(error) {
            this.ctx.throw('设备共享密钥生成失败')
        }
    }

    /**
     * 保存
     * @param {string} deviceUID 设备唯一标识
     */
    async save(deviceUID) {
        const key = `ecdh:${ deviceUID }`
        const data = cbor.encode({
            privateKey: this.ECDH.getPrivateKey(),
            publicKey: this.devicePublicKey
        }).toString('base64')
        await this.CacheService.set(key, data)
    }

    /**
     * 加载
     * @param {string} deviceUID 设备唯一标识
     */
    async load(deviceUID) {
        const key = `ecdh:${ deviceUID }`
        const data = await this.CacheService.get(key)
        if (!data) {
            this.ctx.throw(412, `Ephemeral Session Expired.`)
        }
        const { privateKey, publicKey } = cbor.decode( Buffer.from( data, 'base64' ) )
        this.ECDH.setPrivateKey(privateKey)
        this[EPHEMERAL_DEVICE_UID] = deviceUID
        this[EPHEMERAL_DEVICE_PUBLIC_KEY] = publicKey
    }

}

module.exports = EphemeralSession;
