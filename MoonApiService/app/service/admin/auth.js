'use strict';

const _ = require('lodash');
const Service = require('egg').Service;
const { STATUS_TYPES } = require('../../enum');

class AdminAuthService extends Service {

    /** 管理员账号服务 */
    get AccountService() {
        return this.service.admin.account;
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
     */
    async login(data) { 
        const account = await this.AccountService.findByUsername(data.username);
        if (!await this.ctx.comparePassword(data.password, account.password)) {
            this.ctx.throw(400, '账号或密码不正确', data);
        }

        if (account.status == STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, `账号 ${ account.username  } 已禁用，请与管理员联系`, data)
        }

        const payload = { 
            adminId: account.adminId, 
            type: account.type 
        }
        const result = await this.TokenService.generateTokens(payload)
        return result
    }


    /**
     * 获取账号详情
     * @param {string} adminId 管理员ID
     */
    async detail(adminId) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        const account = await this.AccountService.findByAdminId(adminId)
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
     * @param {string} adminId 管理员ID
     * @param {object} data 修改密码信息
     * @param {string} data.oldPassword 旧密码
     * @param {string} data.newPassword 新密码
     * @returns {Promise<boolean>}
     */
    async updatePassword(adminId, data) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
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
        const account = await this.AccountService.findByAdminId(adminId)
        if (!await this.ctx.comparePassword(data.oldPassword, account.password)) {
            this.ctx.throw(412, '旧密码不正确');
        }
        const result = await  this.AccountService.setPassword(account.adminId, data.newPassword);
        if (!result) {
            this.ctx.throw(400, '修改密码失败', { adminId });
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
        
        // 删除旧刷新 token
        await TokenService.removeRefreshToken(refreshToken)
        try {
            const account = await this.AccountService.findByAdminId(payload.adminId)
            if (account.status == STATUS_TYPES.DISABLE) {
                throw new Error(`账号 ${ account.username  } 已禁用，请与管理员联系`)
            }
            // 重新生成
            const result = await TokenService.generateTokens({ 
                adminId: account.adminId, 
                type: account.type 
            })
            return result
        } catch (error) {
            this.ctx.throw(403, error.message)
        }
    }

    
}

module.exports = AdminAuthService;
