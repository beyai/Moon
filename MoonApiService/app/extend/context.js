'use strict';
const { createHash, randomBytes, createCipheriv, createDecipheriv } = require('crypto')
const cbor = require('cbor-x')
const bcryptjs = require('bcryptjs')
const { ADMIN_TYPES } = require('../enum');

const CONTEXT_ACCOUNT_INFO  = Symbol('accountInfo');
const CONTEXT_APP_SECRET    = Symbol('appSecret');
const CONTEXT_SECRET_KEY    = Symbol('secretKey');

/**
 * 全局辅助函数
 */
module.exports = {

    /** 当前登录账号信息 */
    get accountInfo() {
        return this[CONTEXT_ACCOUNT_INFO] || {};
    },

    set accountInfo(data) {
        this[CONTEXT_ACCOUNT_INFO] = data;
    },

    /** 应用密钥 */
    get appSecret() {
        if (!this[CONTEXT_APP_SECRET]) {
            this[CONTEXT_APP_SECRET] = this.md5(this.app.config.keys)
        }
        return this[CONTEXT_APP_SECRET]
    },

    /** 是否为系统账号 */
    get isSuper() {
        return this.accountInfo?.type == ADMIN_TYPES.SYSTEM || false;
    },

    /** 是否为代理商 */
    get isAgent() {
        return this.accountInfo?.type == ADMIN_TYPES.AGENT || false;
    },

    /** 所有参数 */
    get all() {
        return {
            ...this.request.body,
            ...this.query,
            ...this.params,
        }
    },

    /** 访问令牌 */
    get token() {
        return this.get('token') || this.get('authorization') || this.get('Sec-WebSocket-Protocol') || this.query.token || this.request.body.token;
    },

    /** 当前页码 */
    get page() {
        return parseInt(this.all.page) || 1;
    },

    /** 每页显示条数 */
    get limit() {
        return parseInt(this.all.limit) || 10;
    },

    /** 
     * 字符串md5加密
     * @param {string} str 字符串
     * @returns {string} md5加密后的字符串
     */
    md5(str) {
        return createHash('md5').update(str).digest('hex')
    },

    /**
     * 获取密钥
     * @param {string} key
     * @returns {Buffer}
     */
    async getSecretKey(key) {
        if (!this[CONTEXT_SECRET_KEY]) {
            const secretKey = await this.app.cache.get(`ck:${key}`)
            if (!secretKey) {
                this.throw(415, '密钥已失效')
            }
            this[CONTEXT_SECRET_KEY] = Buffer.from(secretKey, 'base64')
        }
        return this[CONTEXT_SECRET_KEY]
    },

    /**
     * 设置密钥
     * @param {string} key
     * @param {string} value
     * @param {number} [ttl=3600]
     */
    async setSecretKey(key, value, ttl = 3600) {
        await this.app.cache.set(`ck:${key}`, value, ttl);
        this[CONTEXT_SECRET_KEY] = Buffer.from(value, 'base64')
        return 
    },

    /**
     * 加密
     * @param {string} password 密码
     * @returns {Promise<string>} 加密后的密码
     */
    async encryptPassword(password) {
        return bcryptjs.hash(password, 10)
    },

    /**
     * 验证密码
     * @param {string} password 密码
     * @param {string} hash 加密后的密码
     * @returns {Promise<boolean>} 是否匹配
     */
    async comparePassword(password, hash) {
        return bcryptjs.compare(password, hash)
    },

    /**
     * 版本号转数值
     * @param {string} version 版本号
     * @returns {number} 数值
     */
    versionToNumber(version) {
        return Number(version.replace('.', ''))
    },
    
    /**
     * 加密
     * @param {string} str 待加密字符串
     * @returns {base64}
     */
    encrypt(str) {
        const cipher = createCipheriv('aes-256-ecb', this.appSecret, null);
        let enc = cipher.update(String(str), 'utf8', 'base64');
        enc += cipher.final('base64');
        return enc;
    },

    /**
     * 解密
     * @param {base64} str 待解密 base64 字符串
     * @returns {string}
     */
    decrypt(str) {
        const cipher = createDecipheriv('aes-256-ecb', this.appSecret, null);
        let dnc = cipher.update(String(str), 'base64', 'utf8');
        dnc += cipher.final('utf8');
        return dnc;
    },

    /**
     * 数据加密
     * @param {any} data 数据
     * @returns {Buffer} 加密后的数据
     */
    encryptData(data) {
        data = cbor.encode(data)
        const iv = randomBytes(16);
        const key = randomBytes(32);
        const cipher = createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([ cipher.update(data), cipher.final() ]);
        return Buffer.concat([iv, key, encrypted]);
    },

    /**
     * 数据解密
     * @param {Buffer} data 加密后的数据
     * @returns {any} 解密后的数据
     */
    decryptData(data) {
        const iv = data.subarray(0, 16);
        const key = data.subarray(16, 48)
        const encrypted = data.subarray(48, data.length);
        const decipher = createDecipheriv('aes-256-cbc', key, iv);    
        const decrypted = Buffer.concat([ decipher.update(encrypted), decipher.final() ]);
        return decrypted;
    },

    /**
     * 过滤空值
     * @param {object} data 数据
     * @returns {object} 过滤后的对象
     */
    filterEmpty(data) {
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            if (value !== undefined && value !== null && value !== '') {
                result[key] = value;
            }
        }
        return result;
    },

    /**
     * 请求成功
     * @param {object?} data 响应数据
     * @param {string?} message 消息
     * @param {object?} options 其他数据
     */
    success(data, message = 'success', options = {}) {
        this.body = {
            ...options,
            code: 0,
            message,
            data,
        }
    },

    

}
