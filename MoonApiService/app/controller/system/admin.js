'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;
const { ADMIN_TYPES } = require('../../enum');

class AdminController extends Controller {

    get AccountService() {
        return this.service.admin.account
    }

    /** 全部代理商 */
    async agent() {
        const ctx = this.ctx;
        const result = await this.AccountService.agentAllList()
        ctx.success(result)
    }

    /** 代理商列表 */
    async list() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        query.type = ADMIN_TYPES.AGENT;
        const result = await this.AccountService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 创建账号 */
    async create() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['username', 'password']);
        ctx.validator.Admin.create(data)
        data.type = ADMIN_TYPES.AGENT; 

        const result = await this.AccountService.create(data)
        ctx.success(result, '创建成功')
    }

    /** 重置密码 */
    async setPassword() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['adminId', 'password']);
        ctx.validator.Admin.setPassword(data)
        const result = await this.AccountService.setPassword(data.adminId, data.password)
        ctx.success(result, '重置密码成功')
    }

    /** 设置状态 */
    async setStatus() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['adminId', 'status']);
        ctx.validator.Admin.setStatus(data)
        const result = await this.AccountService.setStatus(data.adminId, data.status)
        ctx.success(result, '更新状态成功')
    }
}

module.exports = AdminController;
