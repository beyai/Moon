'use strict';
const _ = require('lodash');
const dayjs = require('dayjs')
const Controller = require('egg').Controller;
const { ADMIN_TYPES, PAYMENT_STATUS } = require('../../enum');

class MoveController extends Controller {

    get MoveService() {
        return this.service.device.move
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
        const result = await this.MoveService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 移机 */
    async move() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['oldDeviceCode', 'newDeviceCode']);
        ctx.validator.Move.move(data)
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);

        const result = await this.MoveService.move(data)
        ctx.success(result, '移机成功')
    }

    /** 撤销 */
    async unmove() {
        const ctx = this.ctx;
        !ctx.isSuper && ctx.throw(400, '没有操作权限')

        const data = _.pick(ctx.all, ['moveId']);
        ctx.validator.Move.unmove(data)
        
        const result = await this.MoveService.unmove(data.moveId)
        ctx.success(result, '移机撤销成功')
    }
}

module.exports = MoveController;
