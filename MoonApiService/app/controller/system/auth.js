'use strict';

const _ = require('lodash');
const Controller = require('egg').Controller;

class AuthController extends Controller {

    get CaptchaSerice() {
        return this.service.auth.mouseTrack
    }

    get AuthService() {
        return this.service.admin.auth
    }

    /** 登录 */
    async login() {
        const { ctx } = this
        const data = _.pick(ctx.all, ['username', 'password', 'key' ])
        ctx.validator.Admin.login(data)
        this.CaptchaSerice.verify(data.key)
        const result = await this.AuthService.login(data)
        ctx.success(result, '登录成功')
    }

    /** 退出 */
    async logout() {
        
    }

    /** 初始化获取账号信息 */
    async init() {
        const { ctx } = this
        const { adminId } = ctx.accountInfo
        try {
            const result = await this.AuthService.detail(adminId)
            ctx.success(result, '初始化成功')
        } catch(err) {
            ctx.throw(403, err.message)
        }
        
    }

    /** 修改密码 */
    async updatePassword() {
        const { ctx } = this
        const data = _.pick(ctx.all, ['oldPassword', 'newPassword'])
        ctx.validator.Admin.updatePassword(data)
        const { adminId } = ctx.accountInfo
        await this.AuthService.updatePassword(adminId, data)
        ctx.success(true, '修改成功')
    }

    /** 刷新 token */
    async refreshToken() {
        const { ctx } = this
        if (_.isEmpty(ctx.token)) {
            ctx.throw(412, 'token 不能为空')
        }
        const result = await this.AuthService.refreshToken(ctx.token)
        ctx.success(result, '刷新成功')
    }

}

module.exports = AuthController;
