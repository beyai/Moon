'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;
const { ADMIN_TYPES, PAYMENT_STATUS } = require('../../enum');

class DeviceController extends Controller {

    get DeviceService() {
        return this.service.device.device
    }

    /** 列表 */
    async list() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);

        if (ctx.isSuper) {
            !_.isEmpty(query.adminId) && (query.isActive = true)
        } else {
            // query.adminId = ctx.accountInfo.adminId
            query.payment = PAYMENT_STATUS.UNPAYMENT
        }

        const result = await this.DeviceService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 删除设备 */
    async remove() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['deviceCode'])
        ctx.validator.Device.remove(data)
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);

        const result = await this.DeviceService.remove(data)
        ctx.success(result, '删除成功')
    }

    /** 设置状态 */
    async setStatus() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['deviceCode', 'status']);
        ctx.validator.Device.setStatus(data)
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);

        const result = await this.DeviceService.setStatus(data)
        ctx.success(result, '更新状态成功')
    }

    /** 设置用户 */
    async setUser() {
        const ctx = this.ctx;
        const data = _.pick(ctx.all, ['deviceCode', 'userId']);
        ctx.validator.Device.setUser(data)
        !ctx.isSuper && (data.adminId = ctx.accountInfo.adminId);

        const result = await this.DeviceService.setUser(data)
        ctx.success(result, '过户成功')
    }

}

module.exports = DeviceController;
