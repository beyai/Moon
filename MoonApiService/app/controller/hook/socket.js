'use strict';

const dayjs = require('dayjs');
const Controller = require('egg').Controller;
const { STATUS_TYPES } = require('../../enum');

class SocketHookController extends Controller {


    get DeviceService() {
        return this.service.device.device
    }
    /**
     * 服务启动
     * - 重置所有设备在线状态
     */
    async launch() {
        const ctx = this.ctx;
        await this.DeviceService.resetOnlineStatus();
        ctx.success(true)
    }

    /**
     * 加入房间
     */
    async join() {
        const ctx = this.ctx;
        const { from, room, ip } = ctx.all;
        const device = await this.DeviceService.findDetail( room )
        if (!device) {
            this.ctx.throw(400, '设备不存在')
        }
        if (!device.userId) {
            this.ctx.throw(400, '请先绑定账号')
        }
        if (device.status == STATUS_TYPES.DISABLE) {
            ctx.throw(401, '设备已禁用')
        }

        // 检测试用时间限制
        if (!device.isActive) {
            await this.DeviceService.checkUseTime(device.deviceCode);
        }

        if (from == 'device') {
            const data = {
                isOnline: true,
                connectedAt: new Date(),
                disconnectedAt: null,
                connectedIp: ip
            }
            await this.DeviceService.setDeviceOnline(room, data)
        } else {
            await this.DeviceService.setClientOnline(room, true)
        }

        ctx.success({
            isActive: device.isActive
        })
    }

    /**
     * 离开房间
     */
    async leave() {
        const ctx = this.ctx;
        const { from, room, ip } = ctx.all;
        if (from == 'device') {
            const data = {
                isOnline: false,
                disconnectedAt: new Date(),
            }
            await this.DeviceService.setDeviceOnline(room, data)
        } else {
            await this.DeviceService.setClientOnline(room, false)
        }
        ctx.success(true)
    }
}

module.exports = SocketHookController;
