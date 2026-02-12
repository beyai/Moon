'use strict';
const _ = require('lodash');
const Controller = require('egg').Controller;

class PaymentController extends Controller {
    get PaymentService() {
        return this.service.device.payment
    }

    async list() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        !ctx.isSuper && (query.adminId = ctx.accountInfo.adminId);
        const result = await this.PaymentService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    async payment() {
        const ctx = this.ctx;
        !ctx.isSuper && ctx.throw(400, '没有操作权限')
        
        const data = _.pick(ctx.all, ['type', 'adminId', 'endTime']);
        ctx.validator.Payment.payment(data)
        const result = await this.PaymentService.payment(data)
        ctx.success(result)
    }

}

module.exports = PaymentController;
