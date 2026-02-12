'use strict';
const _ = require('lodash')
const dayjs = require('dayjs')
const Controller = require('egg').Controller;
const { ADMIN_TYPES, PAYMENT_STATUS } = require('../../enum');

class ActiveController extends Controller {

   get ActiveService() {
        return this.service.device.active
    }

    /** 列表查询 */
    async list() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        
        if (!ctx.isSuper) {
            query.adminId = ctx.accountInfo.adminId
            query.startTime = dayjs().subtract(30, 'day').startOf('day').format('YYYY-MM-DD')
            query.endTime = dayjs().endOf('day').format('YYYY-MM-DD')
        }

        const result = await this.ActiveService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 激活 */
    async active() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['deviceCode', 'level', 'adminId', 'days']);
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);
        ctx.validator.Active.active(data)
        
        const result = await this.ActiveService.active(data)
        ctx.success(result, '移机成功')
    }

    /** 取消激活 */
    async unactive() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['activeId']);
        ctx.validator.Active.unactive(data)
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);

        const result = await this.ActiveService.unactive(data)
        ctx.success(result, '取消激活成功')
    }

    /** 删除记录 */
    async remove() {
        const ctx = this.ctx;
        !ctx.isSuper && ctx.throw(400, '没有操作权限')

        const data = _.pick(ctx.all, ['activeId']);
        ctx.validator.Active.remove(data)
        
        const result = await this.ActiveService.remove(data.activeId)
        ctx.success(result, '激活记录删除成功')
    }


}

module.exports = ActiveController;
