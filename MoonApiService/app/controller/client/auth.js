'use strict';

const _ = require('lodash');
const Controller = require('egg').Controller;
const { STATUS_TYPES } = require('../../enum');
const semver = require('semver')


class ClientAuthController extends Controller {
    get CaptchaSerice() {
        return this.service.auth.mouseTrack
    }

    /** 设备服务 */
    get DeviceService() {
        return this.service.device.device
    }
    
    /** 加密服务 */
    get CryptoService() {
        return this.service.security.crypto
    }

    /** 用户验证 */
    get UserAuthService() {
        return this.service.user.auth
    }

    /**
     * 协商公钥
     */
    async negotiate() {
        const ctx = this.ctx
        const body = ctx.all
        if (_.isEmpty(body.deviceUID)) {
            ctx.throw(412, '缺少 deviceUID 参数')
        }
        if (_.isEmpty(body.data)) {
            ctx.throw(400, '协商失败')
        }
        try {
            const { serverPrivateKey, serverPublicKey } = this.CryptoService.generateServerCert()
            await this.CryptoService.saveCert(body.deviceUID, {
                devicePublicKey: body.data,
                serverPrivateKey: serverPrivateKey
            })
            ctx.success(serverPublicKey)
        } catch(err) {
            ctx.throw(400, '协商失败')
        }
    }

    /** 鼠标轨迹验证  */
    async captcha() {
        const { ctx } = this;
        const tracks = ctx.request.body.tracks;
        if (_.isEmpty(tracks)) {
            ctx.throw(412, '参数错误');
        }
        if (this.CaptchaSerice.check(tracks)) {
            const result = this.CaptchaSerice.generateKey();
            ctx.success(result, '验证通过');
        } else {
            ctx.throw(412, '验证失败');
        }
    }

    /** 注册 */
    async register() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['username', 'password', 'key'])
        ctx.validator.User.register(data)
        this.CaptchaSerice.verify(data.key)
        await this.UserAuthService.register(data)
        ctx.success({}, '注册成功')
    }

    /** 登录 */
    async login() {
        const { ctx } = this
        const data = _.pick(ctx.all, ['username', 'password', 'key' ])
        ctx.validator.User.login(data)
        this.CaptchaSerice.verify(data.key)
        const result = await this.UserAuthService.login(data)
        ctx.success(result, '登录成功')
    }

    /** 退出登录 */
    async logout() {
        const ctx = this.ctx;
        if (_.isEmpty(ctx.token)) {
            ctx.throw(412, 'token 不能为空')
        }
        await this.UserAuthService.logout(ctx.token)
        ctx.success({}, '刷新成功')
    }

    /**
     * 初始化账号
     */
    async initAccount() {
        const ctx = this.ctx
        const { userId } = ctx.accountInfo
        try {
            const result = await this.UserAuthService.detail(userId)
            ctx.success(result, '初始化成功')
        } catch(err) {
            ctx.throw(403, err.message)
        }
    }

    /** 修改密码 */
    async updatePassword() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['oldPassword', 'newPassword'])
        ctx.validator.User.updatePassword(data)
        const { userId } = ctx.accountInfo
        await this.UserAuthService.updatePassword(userId, data)
        ctx.success({}, '修改成功')
    }

    /** 刷新 Token */
    async refreshToken() {
        const ctx = this.ctx;
        const refreshToken = ctx.all.token
        if (_.isEmpty(refreshToken)) {
            ctx.throw(412, 'token 不能为空')
        }
        const result = await this.UserAuthService.refreshToken(refreshToken)
        ctx.success(result, '刷新成功')
    }

    /** 设备列表 */
    async deviceList() {
        const ctx = this.ctx;
        const { userId } = ctx.accountInfo
        const result = await this.DeviceService.findList({ userId})
        result.rows = result.rows.map(item => item.toJSON())
        ctx.success(result, '获取成功')
    }

    /** 设备初始化 */
    async initDevice() {
        const ctx = this.ctx;
        const { deviceCode, clientVersion } = ctx.all
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, '设备码不能为空')
        }
        const device = await this.DeviceService.findDetail(deviceCode)

        if (!device) {
            this.ctx.throw(400, '设备不存在')
        }

        if (!device.userId) {
            this.ctx.throw(400, '设备未绑定账号')
        }

        if (device.status == STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, '设备已禁用')
        }

        // 检测 App 版本号是否小于允许的量小版本
        if (!device.version || semver.lt(device.version, this.config.appMinVersion)) {
            // this.ctx.throw(400, `
            //     <b>【混沌之眼】</b>App已更新至最强版本，请先在手机上删除 App，
            //     再打开<b>【App Store】</b>搜索并找到<b>【混沌之眼】</b>，
            //     点击<b>【获取】</b>按键安装最新版本。`)
                this.ctx.throw(400, `【混沌之眼】App已更新至最强版本，请先在手机上删除 App，再打开【App Store】搜索并找到【混沌之眼】，点击【获取】按键安装最新版本。`)
        }

        // 更新客户端版本号
        if (device.clientVersion !== clientVersion) {
            device.set('clientVersion', clientVersion)
            await device.save();
        }
        
        // 检测试用时间限制
        if (!device.isActive) {
            await this.DeviceService.checkUseTime(deviceCode);
        }

        const result = {
            isActive: device.isActive,
            level: device.activeLevel,
        }
        ctx.success(result)
    }

    /** 解绑设备 */
    async unbindDevice() {
        const ctx = this.ctx;
        const { deviceCode } = ctx.all;
        await this.DeviceService.unbind(deviceCode)
        ctx.success({})
    }

}

module.exports = ClientAuthController;
