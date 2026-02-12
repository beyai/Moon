'use strict';

const _ = require('lodash');
const Service = require('egg').Service;
const { STATUS_TYPES } = require('../../enum');

class UserAuthService extends Service {

    /** 用户账号服务 */
    get AccountService() {
        return this.service.user.account;
    }

    /**
     * Token 服务
     */
    get TokenService() {
        return this.service.auth.token
    }

    /**
     * 登录
     * @param {object} data 登录信息
     * @param {string} data.username 用户名
     * @param {string} data.password 密码
     * @returns {Promise<{accessToken: string, refreshToken: string}>}
     */
    async login(data) { 
        if (_.isEmpty(data.username)) {
            this.ctx.throw(412, '用户名不能为空')
        }
        if (_.isEmpty(data.password)) {
            this.ctx.throw(412, '密码不能为空')
        }
        const account = await this.AccountService.findByUsername(data.username);
        if (!await this.ctx.comparePassword(data.password, account.password)) {
            this.ctx.throw(400, '账号或密码不正确', data);
        }
        if (account.status == STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, `账号 ${ account.username  } 已禁用，请与管理员联系`, data)
        }

        account.set('loginIp', this.ctx.ip)
        account.set('loginAt', new Date())
        await account.save();
        
        const payload = { userId: account.userId }
        const result = await this.TokenService.generateTokens(payload)
        return result
    }

    /**
     * 退出登录，删除当前用户token
     * @param {Base64URLString} refreshToken 
     */
    async logout(refreshToken) {
        const TokenService = this.TokenService;
        await TokenService.removeRefreshToken(refreshToken)
    }

    /**
     * 注册账号
     * @param {object} data
     * @param {string} data.username 用户名
     * @param {string} data.password 密码
     */
    async register(data) {
        if (_.isEmpty(data.username)) {
            this.ctx.throw(412, '用户名不能为空')
        }
        if (_.isEmpty(data.password)) {
            this.ctx.throw(412, '密码不能为空')
        }
        const user = await this.AccountService.create(data)
        return _.omit(user.toJSON(), ['password'])
    }

    /**
     * 获取账号详情
     * @param {string} userId 用户ID
     */
    async detail(userId) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        const account = await this.AccountService.findByUserId(userId)
        if (account.status === STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, '账号已禁用，请与管理员联系')
        }
        
        if (this.ctx.ip != account.loginIp ) {
            account.set('loginIp', this.ctx.ip)
            account.set('loginAt', new Date())
            await account.save();
        }

        return _.omit(account.toJSON(), ['password'])
    }

    /**
     * 修改密码
     * @param {string} userId 管理员ID
     * @param {object} data 修改密码信息
     * @param {string} data.oldPassword 旧密码
     * @param {string} data.newPassword 新密码
     * @returns {Promise<boolean>}
     */
    async updatePassword(userId, data) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        if (_.isEmpty(data.oldPassword)) {
            this.ctx.throw(412, 'oldPassword 不能为空')
        }
        if (_.isEmpty(data.newPassword)) {
            this.ctx.throw(412, 'newPassword 不能为空')
        }
        if (data.oldPassword == data.newPassword) {
            this.ctx.throw(412, '新密码不能与旧密码相同')
        }
        const account = await this.AccountService.findByUserId(userId)
        if (!await this.ctx.comparePassword(data.oldPassword, account.password)) {
            this.ctx.throw(412, '旧密码不正确');
        }
        const result = await  this.AccountService.setPassword(account.userId, data.newPassword);
        if (!result) {
            this.ctx.throw(400, '修改密码失败', { userId });
        }
        return true
    }

    /**
     * 刷新访问 token
     * @param {Base64URLString} refreshToken 
     */
    async refreshToken(refreshToken) { 
        const TokenService = this.TokenService;
        let payload = await TokenService.verifyRefreshToken(refreshToken)
        if (!payload) {
            this.ctx.throw(403, 'Token 已过期');
        }
        try {
            const account = await this.AccountService.findByUserId(payload.userId)
            if (account.status == STATUS_TYPES.DISABLE) {
                throw new Error(`账号 ${ account.username  } 已禁用，请与管理员联系`)
            }
            // 重新生成
            const result = await TokenService.generateTokens({ 
                userId: account.userId, 
            })
            // 删除旧刷新 token
            await TokenService.removeRefreshToken(refreshToken)

            return result
        } catch (error) {
            this.ctx.throw(403, error.message)
        }
    }
}

module.exports = UserAuthService;
