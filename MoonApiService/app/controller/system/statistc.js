'use strict';

const _ = require('lodash')
const Controller = require('egg').Controller;
const { ADMIN_TYPES, PAYMENT_STATUS } = require('../../enum');

class StatistcController extends Controller {

    get StatistcService() {
        return this.service.statistc
    }

    async all() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        const { adminId, type } = ctx.accountInfo;
        if (type == ADMIN_TYPES.AGENT) {
            query.adminId = adminId;
            query.payment = PAYMENT_STATUS.UNPAYMENT
        }
        const result = {
            active: await  this.StatistcService.activeCount(query),
            move: await  this.StatistcService.moveCount(query),
        }
        if (type == ADMIN_TYPES.SYSTEM) {
            result.device = await this.StatistcService.deviceCount(query),
            result.user = await this.StatistcService.userCount()
        }
        ctx.success(result)
    }

    async active() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        const { adminId, type } = ctx.accountInfo;
        if (type == ADMIN_TYPES.AGENT) {
            query.adminId = adminId;
            query.payment = PAYMENT_STATUS.UNPAYMENT
        }
        const result = await this.StatistcService.activeByDay(query)
        ctx.success(result)
    }

    async move() {
        const ctx = this.ctx;
        const query = ctx.filterEmpty(ctx.all);
        const { adminId, type } = ctx.accountInfo;
        if (type == ADMIN_TYPES.AGENT) {
            query.adminId = adminId;
            query.payment = PAYMENT_STATUS.UNPAYMENT
        }
        const result = await this.StatistcService.moveByDay(query)
        ctx.success(result)
    }
}

module.exports = StatistcController;
