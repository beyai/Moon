'use strict';
const _ = require('lodash')
const Controller = require('egg').Controller;

class UserController extends Controller {

    get AccountService() {
        return this.service.user.account
    }

    /** 搜索账号 */
    async search() {
        const ctx = this.ctx;
        const { username } = ctx.all;
        let result = await this.AccountService.search(username)
        ctx.success(result)
    }

    /** 创建账号 */
    async create() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['username', 'password']);
        ctx.validator.User.create(data)
        const result = await this.AccountService.create(data)
        ctx.success(result, '创建成功')
    }

    /** 列表 */
    async list() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        const result = await this.AccountService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 重置密码 */
    async setPassword() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['userId', 'password']);
        ctx.validator.User.setPassword(data)
        const result = await this.AccountService.setPassword(data.userId, data.password)
        ctx.success(result, '重置密码成功')
    }

    /** 设置状态 */
    async setStatus() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['userId', 'status']);
        ctx.validator.User.setStatus(data)
        
        const result = await this.AccountService.setStatus(data.userId, data.status)
        ctx.success(result, '更新状态成功')
    }
}

module.exports = UserController;
