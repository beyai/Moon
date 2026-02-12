'use strict';

const _ = require('lodash')
const Controller = require('egg').Controller;

class DeviceController extends Controller {
    
    /**
     * 设备会话
     */
    get DeviceSession() {
        return this.service.session.deviceSession
    }

    /**
     * 获取挑战因子
     */
    async challenge() {
        const ctx = this.ctx;
        try {
            const challenge = await this.DeviceSession.generateChallenge()
            ctx.success(challenge, '请求成功')
        } catch(err) {
            this.logger.error(err)
            ctx.throw(400, '设备验证失败')
        }
    }

    /**
     * 登记设备
     */
    async checkIn() {
        const ctx = this.ctx;
        try {
            const result = await this.DeviceSession.checkIn()
            console.log("checkIn", result)
            ctx.success(result)
        } catch(err) {
            this.logger.error(err)
            ctx.throw(400, '设备验证失败')
        }
    }

    /**
     * 协商会话
     */
    async negotiate() {
        const ctx = this.ctx;
        try {
            const result = await this.DeviceSession.negotiate()
            console.log("negotiate", result)
            ctx.success(result)
        } catch(err) {
            this.logger.error(err)
            ctx.throw(400, '设备验证失败')
        }
    }

   
    async initDevice() {
        const ctx = this.ctx
    }

}

module.exports = DeviceController;
