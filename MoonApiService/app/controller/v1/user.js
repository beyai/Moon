'use strict';

const Controller = require('egg').Controller;

class UserController extends Controller {

    get AuthService() {
        return this.service.user.auth
    }

    get AccountService() {
        return this.service.user.account
    }

    /**
     * 用户登录
     */
    async login() {
        const ctx = this.ctx;
        const { username, password } = ctx.all
        const authInfo = await this.AuthService.login({ username, password })
        ctx.success(authInfo, '登录成功')
    }

    /**
     * 注册账号
     */
    async register() {
        const ctx = this.ctx
        const { username, password } = ctx.all
        await this.AuthService.register({ username, password })
        ctx.success({ username }, '注册成功')
    }

    /**
     * 注销账号
     */
    async unregister() {
        const ctx = this.ctx;
    }

    /**
     * 修改密码
     */
    async changePassword() {
        const ctx = this.ctx
    }

    /**
     * 刷新访问token
     */
    async refreshToken() {
        const ctx = this.ctx
    }

    /**
     * 账号信息
     */
    async init() {
        const ctx = this.ctx
    }

    /**
     * 激活账号功能
     */
    async active() {
        const ctx = this.ctx
    }

}

module.exports = UserController;
