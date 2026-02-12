'use strict';

const _ = require('lodash');
const Controller = require('egg').Controller;
const { STATUS_TYPES, DEVICE_ACTIVE_LEVELS } = require('../../enum');

class DeviceAuthController extends Controller {

    /** 设备服务 */
    get DeviceService() {
        return this.service.device.device
    }
    
    /** app正版服务 */
    get AttestService() {
        return this.service.security.attest
    }
    
    /** 加密服务 */
    get CryptoService() {
        return this.service.security.crypto
    }

    /** 应用服务 */
    get AppService() {
        return this.service.application
    }

    /** 设置 */
    get SettingService() {
        return this.service.setting
    }

    /**
     * 配置
     */
    get attestConf() {
        return this.config.attest
    }

    get deviceUID() {
        return this.ctx.get('client-key')
    }

    /**
     * 生成 App 验证码
     */
    async challenge() {
        const ctx = this.ctx
        const challenge = this.AttestService.generateChallenge();
        ctx.success(challenge)
    }

    /**
     * 登记设备
     * @param {object} ctx.all
     * @param {object} ctx.all.keyId 设备密钥id
     * @param {string} ctx.all.challenge 随机码
     * @param {string} ctx.all.attestation 认证数据
     */
    async checkin() {
        const ctx = this.ctx;
        try {
            await this.AttestService.create(ctx.all)
            ctx.success(true, '验证成功')
        } catch(err) {
            this.logger.debug(err)
            ctx.throw(400, '设备注册失败')
        }
    }

    /**
     * 协商公钥
     * @param {object} ctx.all
     * @param {string} ctx.all.keyId 设备密钥id
     * @param {string} ctx.all.deviceUID 设备唯一标识
     * @param {string} ctx.all.assertion 设备码
     * @param {string} ctx.all.payload 负载数据
     */
    async negotiate() {
        const ctx = this.ctx
        const data = ctx.all

        try {
            const payload = await this.AttestService.verifySign(data)
            const result = await this.CryptoService.generateAndSaveKeyPair(payload)
            ctx.success(result, '协商成功')
        } catch(err) {
            this.logger.info(data)
            // 自动禁用设备
            // this.DeviceService.disabledByDeviceUID(data.deviceUID).catch(err => {
            //     this.logger.error(err.message)
            // })
            ctx.throw(400, '设备验证失败')
        }
    }

    /**
     * 注册设备
     * - 需要使用协商密钥验签与加解密数据
     * @param {object} ctx.all
     * @param {string} ctx.all.deviceUID 设备唯一标识
     * @param {string} ctx.all.deviceCode 设备码
     */
    async register() {
        const ctx = this.ctx
        if (_.isEmpty(ctx.all.deviceUID)) {
            ctx.throw(400, '设备唯一标识不能为空')
        }
        try {
            const deviceCode = await this.DeviceService.register(ctx.all)
            ctx.success({ deviceCode })
        } catch(err) {
            this.logger.debug(err)
            ctx.throw(400, '注册失败')
        }
    }

    /**
     * App 版本检测
     * - 需要使用协商密钥验签与加解密数据
     */
    async version() {
        const ctx = this.ctx
        const version = ctx.all.version
        if (_.isEmpty(version)) {
            ctx.throw(400, 'App版本号不能为空')
        }
        try {
            const result = await this.AppService.findOne(version)
            result.downloadURL = this.attestConf.appStoreURL
            ctx.success(result)
        } catch(err) {
            this.logger.debug(err)
            ctx.throw(400, 'App 当前版本已过期')
        }
    }

    /**
     * 设备绑定
     * - 需要使用协商密钥验签与加解密数据
     * - 需要验证用户登录 Token
     */
    async bind() {
        const ctx = this.ctx;
        const { deviceUID, deviceCode, version } = ctx.all
        if (_.isEmpty(ctx.accountInfo)) {
            this.ctx.throw(403, '没有权限')
        }
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, '设备码不能为空')
        }
        // 查询或创建
        await this.DeviceService.findOrCreate({
            deviceUID,
            deviceCode, 
            version,
            userId: ctx.accountInfo.userId
        })

        ctx.success({ deviceCode })
    }

    /**
     * 设备初始化
     * - 需要使用协商密钥验签与加解密数据
     */
    async init() {
        const ctx = this.ctx;
        const { deviceUID, deviceCode, version } = ctx.all
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, '设备码不能为空')
        }
        
        const device = await this.DeviceService.findDetail(deviceCode)
        const result = {
            isBind: false,
            isActive: false,
            isDisabled: false,
        }

        if (!device || !device.userId) {
            return ctx.success(result)
        }

        if (device.status == STATUS_TYPES.DISABLE) {
            result.isDisabled = true;
            return ctx.success(result)
        }

        // 保存设备唯一标识
        if (!device.deviceUID) {
            device.set('deviceUID', deviceUID)
            await device.save()
        }

        // 更新版本号
        if (!_.isEmpty(version) && device.version !== version) {
            device.set('version', version)
            await device.save()
        }

        // 获取设置
        const setting = await this.SettingService.getData(deviceCode)
        result.isBind = true;
        result.isActive = device.isActive;
        result.level = device.activeLevel;
        result.iceServers = setting.iceServers,
        result.settings = setting.settings;
        result.rtc = setting.rtc;
        result.deviceFormat =  setting.deviceFormat;
        return ctx.success(result)
    }

}

module.exports = DeviceAuthController;
