'use strict';

const { randomBytes } = require('crypto')
const _ = require('lodash')
const Controller = require('egg').Controller;

class ApplicationController extends Controller {

    get AppService() {
        return this.service.application
    }

    /** 列表 */
    async findAll() {
        const result = await this.AppService.findAll()
        this.ctx.success(result)
    }

    /** 创建新版本 */
    async create() {
        const ctx = this.ctx
        const data = ctx.all;
        if (_.isEmpty(data.version)) {
            ctx.throw(412, '版号不能为空')
        }
        const result = await this.AppService.create({
            version: data.version,
            secretKey: randomBytes(32).toString('base64')
        })
        ctx.success(result)
    }

    /** 删除 */
    async remove() {
        const ctx = this.ctx
        const data = ctx.all;
        if (!_.isNumber(data.id)) {
            ctx.throw(412, '参数错误')
        }
        await this.AppService.remove(data.id)
        ctx.success(true)
    }

    /** 更新状态 */
    async setStatus() {
        const ctx = this.ctx
        const data = ctx.all;
        if (!_.isNumber(data.id) && !_.isNumber(data.status)) {
            ctx.throw(412, '参数错误')
        }
        await this.AppService.setStatus(data.id, data.status)
        ctx.success(true)
    }
}

module.exports = ApplicationController;
