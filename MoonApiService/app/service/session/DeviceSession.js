'use strict';

const _ = require('lodash')
const cbor = require('cbor')
const crypto = require('crypto');
const Service = require('egg').Service;

class DeviceSessionService extends Service {

    /**
     * 长期会话
     */
    get PersistentSession() {
        return this.service.session.persistentSession
    }

    /**
     * 临时会话
     */
    get EphemeralSession() {
        return this.service.session.ephemeralSession
    }

    /**
     * 会话加解密
     */
    get CryptSession() {
        return this.service.session.cryptSession
    }
    
    /**
     * 设备会话信息
     */
    get DeviceSessionModel() {
        return this.app.model.DeviceSession
    }

    /**
     * 应用服务
     */
    get AppService() {
        return this.service.application
    }

    /** 缓存服务 */
    get CacheService() {
        return this.app.cache
    }

    /** iOS App 信息 */
    get appBundle() {
        return this.config.appBundle
    }


    /**
     * 获取请求参数
     * @returns {
     *      deviceUID: string;
     *      nonce: Buffer;
     *      tag: Buffer;
     *      body: Buffer;
     * }
     */
    getRequestParams() {
        const params = this.ctx.request.body
        for (const key of ['deviceUID', 'nonce', 'tag', 'body']) {
            if (_.isEmpty(params[key])) {
                this.ctx.throw(412, '参数错误')
            }
        }
        for (const key of ['nonce', 'tag', 'body']) {
            try {
                params[key] = Buffer.from(params[key], 'base64')
            } catch {
                this.ctx.throw(412, '参数错误')
            }
        }
        return params
    }

    /**
     * 获取请求负载
     * @returns 
     */
    getRequestPayload() {
        const params = this.ctx.request.body
        if (_.isEmpty(params.payload)) {
            throw new Error('负载数据不存在')
        }
        let payload = cbor.decode( Buffer.from(params.payload, 'base64') )
        if (payload == undefined || payload == null) {
            throw new Error('负载不能为空')
        }
        return payload
    }

    /**
     * 是否已存在
     * @param {string} deviceUID 设备唯一标识
     */
    async isExisted(deviceUID) {
        const count = await this.DeviceSessionModel.count({
            where: { deviceUID },
        })
        return count > 0
    }

    /**
     * 创建长期会话
     * @param {object} data 
     * @param {string} data.deviceUID 设备唯一标识
     * @param {Buffer} data.publicKey 设备公钥
     * @param {string} data.model 设备型号
     * @returns {{
     *  deviceUID: string;
     *  deviceCode: string;
     * }}
     */
    async createSession(data) {
        const isExisted = await this.isExisted(data.deviceUID)
        if (isExisted) {
            return this.updateSession(data)
            // throw new Error(`${ data.deviceUID } already exists.`)
        }
        let session = await this.DeviceSessionModel.create({
            deviceUID: data.deviceUID,
            publicKey: data.publicKey.toString('base64'),
            model: data.model
        })
        return session
    }

    /**
     * 更新设备长期会话
     * @param {string} data.deviceUID 设备唯一标识
     * @param {Buffer} data.publicKey 设备公钥
     * @param {string} data.model 
     * @returns {{
     *  deviceUID: string;
     *  deviceCode: string;
     * }}
     */
    async updateSession(data) {
        const session = await this.DeviceSessionModel.findOne({
            where: { deviceUID: data.deviceUID }
        })
        if (!session) {
            throw new Error(`${ data.deviceUID } not found.`)
        }
        session.set('publicKey', data.publicKey.toString('base64'),)
        session.set('model', data.model)
        await session.save()
        return session
    }

    /**
     * 获取设备长期会话
     * @param {string} deviceUID 设备唯一标识
     * @returns {{
     *      deviceUID: string;
     *      deviceCode: string;
     *      publicKey: Buffer
     * }}
     */
    async getSession(deviceUID) {
        const session = await this.DeviceSessionModel.findOne({
            where: { deviceUID: deviceUID }
        })
        if (!session) {
            throw new Error(`${ deviceUID } not found.`)
        }
        return {
            deviceUID: session.deviceUID,
            deviceCode: session.deviceCode,
            publicKey: Buffer.from(session.publicKey, 'base64')
        }
    }

    /**
     * 生成挑战因子
     * @returns {Promise<string>}
     */
    async generateChallenge() {
        const challenge = crypto.randomBytes(16).toString('hex')
        await this.CacheService.set(challenge, 1, 60)
        return challenge
    }

    /**
     * 验证挑战因子
     * @param {string} challenge
     */
    async verifyChallenge(challenge) {
        let hasChallenge = await this.CacheService.has(challenge)
        if (!hasChallenge) {
            this.ctx.throw(400, 'challenge 已失效')
        }
        // 删除挑战因子
        await this.CacheService.del(challenge)
        return true
    }

    /**
     * 验证设备
     * @param {object} params 请求参数
     * @param {string} params.teamIdentifier
     * @param {string} params.bundleIdentifier
     * @param {string} params.bundleName
     */
    async verifyDevice(params) {
        const appBundle = this.appBundle
        if (params.bundleIdentifier != appBundle.bundleIdentifier) {
            this.ctx.throw(400, 'bundleIdentifier 不正确')
        }
        if (params.teamIdentifier != appBundle.teamIdentifier) {
            this.ctx.throw(400, 'teamIdentifier 不正确')
        }
        if (params.bundleName != appBundle.bundleName) {
            this.ctx.throw(400, 'bundleName 不正确')
        }
        if (_.isEmpty(params.challenge)) {
            this.ctx.throw(400, 'challenge 无效')
        }
        await this.verifyChallenge(params.challenge)
    }

    /**
     * 生成临时会话
     * @param {object} data 请求参数
     * @param {string} data.version app版本号
     * @param {object} session 设备会话
     * @param {string} session.deviceUID 设备唯一标识
     * @param {string} session.deviceCode 设备码
     * @param {Buffer} deviceSessionPublicKey 设备临时会话公钥
     * @returns {{
     *      deviceUID: string;
     *      nonce: Base64URLString;
     *      tag: Base64URLString;
     *      body: Base64URLString;
     *      payload: Base64URLString;
     * }}
     */
    async generateSession(data, session, deviceSessionPublicKey) {
        // 生成临时密钥
        this.EphemeralSession.generatePrivateKey()
        // 设置设备临时公钥
        this.EphemeralSession.setDevicePublicKey(deviceSessionPublicKey)
        // 保存临时会话信息
        await this.EphemeralSession.save(session.deviceUID);
        // 密钥盐、加密随机字符 12bit
        const nonce         = this.CryptSession.randomNonce();
        // 获取共享密钥
        const sharedKey     = this.EphemeralSession.getSharedKey(nonce)
        // 获取App版本信息
        const versionData   = await this.AppService.findOne(data.version)
        // 待加密数据
        const body = {
            deviceCode: session.deviceCode,
            version: versionData.version,
            status: !!versionData.status,
            secretKey: versionData.secretKey,
            downloadURL: this.appBundle.appStoreURL,
        }
        
        const result        = this.CryptSession.encrype(body, sharedKey, nonce)
        result.deviceUID    = session.deviceUID
        result.payload      = cbor.encode({
            EK: this.EphemeralSession.getServicePublicKey()
        }).toString('base64')

        return result
    }

    /**
     * 登录设备
     * @returns {{
     *      deviceUID: string;
     *      nonce: Base64URLString;
     *      tag: Base64URLString;
     *      body: Base64URLString;
     *      payload: Base64URLString;
     * }}
     */
    async checkIn() {
        const params = this.getRequestParams()
        const { 
            PK: devicePublicKey, 
            EK: deviceSessionPublicKey 
        } = this.getRequestPayload()

        // 设置设备公钥
        this.PersistentSession.setDevicePublicKey(devicePublicKey)
        // 密钥盐、加密随机字符 12bit
        let sharedKey = this.PersistentSession.getSharedKey(params.nonce)
        // 解密数据
        let data = this.CryptSession.decrypt(params.body, sharedKey, params.nonce, params.tag)
        // 验证请求设备信息
        await this.verifyDevice(data)

        // 创建新设备会话
        const session = await this.createSession({
            deviceUID: params.deviceUID,
            publicKey: devicePublicKey,
            model: data.model
        })

        return this.generateSession(data, session, deviceSessionPublicKey)
    }

    /**
     * 会话协商
     * @returns {{
     *      deviceUID: string;
     *      nonce: Base64URLString;
     *      tag: Base64URLString;
     *      body: Base64URLString;
     *      payload: Base64URLString;
     * }}
     */
    async negotiate() {
        const params = this.getRequestParams()
        const { 
            EK: deviceSessionPublicKey 
        } = this.getRequestPayload()

        // 获取设备长期会话
        const session = await this.getSession(params.deviceUID)
        // 设置设备公钥
        this.PersistentSession.setDevicePublicKey(session.publicKey)
        // 获取共享密钥
        let sharedKey = this.PersistentSession.getSharedKey(params.nonce)
        // 解密数据
        let data = this.CryptSession.decrypt(params.body, sharedKey, params.nonce, params.tag)
        // 验证请求设备信息
        await this.verifyDevice(data)

        return this.generateSession(data, session, deviceSessionPublicKey)
    }

    /**
     * 验证会话
     * @returns {Record<string, any>}
     */
    async verifySession() {
        const params = this.getRequestParams()
        // 加载临时会话
        await this.EphemeralSession.load(params.deviceUID)
        // 密钥盐、加密随机字符 12bit
        let sharedKey = this.EphemeralSession.getSharedKey(params.nonce)
        // 解密数据
        let data = this.CryptSession.decrypt(params.body, sharedKey, params.nonce, params.tag)

        return data
    }

    /**
     * 构建响应结果
     * @param {Record<string, any>} data
     * @returns {{
     *      deviceUID: string;
     *      nonce: Base64URLString;
     *      tag: Base64URLString;
     *      body: Base64URLString;
     * }}
     */
    buildBody(data) {
        // 密钥盐、加密随机字符 12bit
        const nonce         = this.CryptSession.randomNonce();
        // 获取共享密钥
        const sharedKey     = this.EphemeralSession.getSharedKey(nonce)
        // 加密数据
        let result          = this.CryptSession.encode(data, sharedKey, nonce)
        // 当前设备唯一标识
        result.deviceUID    = this.EphemeralSession.deviceUID

        return result
    }

}

module.exports = DeviceSessionService;
