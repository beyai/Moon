import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { DeviceStatus } from "app/InterFace";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class ClientDeviceService extends AbstractService {

    // 设备列表
    async findDeviceList(ctx: EggContext, userId: string) {
        if (typeof userId !== 'string') {
            ctx.throw(400, '用户ID不能为空')
        }
        const list = await this.model.Device.findAll({
            where: { userId },
            include: [
                {
                    as: 'active',
                    model: this.model.DeviceActive
                }
            ],
            order: [
                ['activeId', "DESC"],
                ['deviceId', "DESC"],
                ['isOnline', "DESC"],
            ]
        })
        return list
    }

    // 设备信息
    async getDeviceInfo(
        ctx: EggContext, 
        data: {
            deviceCode: string;
            userId: string
        }
    ) {
        if (typeof data.deviceCode !== 'string') {
            ctx.throw(400, '设备码不能为空')
        }
        if (typeof data.userId !== 'string') {
            ctx.throw(400, '用户ID不能为空')
        }
        const device = await this.model.Device.findOne({
            where: data,
            include: [
                {
                    as: 'active',
                    model: this.model.DeviceActive
                }
            ]
        })

        if (!device) {
            ctx.throw(404, '设备不存在')
        }

        if (device.status === DeviceStatus.DISABLE) {
            ctx.throw(404, '设备已禁用')
        }
        // 检测客户端版本号

        return {
            deviceCode: device.deviceCode,
            isActive: device.isActive,
        }
    }

    // 解绑设备
    async unbindDevice(
        ctx: EggContext, 
        data: {
            deviceCode: string;
            userId: string
        }
    ) {
        if (typeof data.deviceCode !== 'string') {
            ctx.throw(400, '设备码不能为空')
        }
        if (typeof data.userId !== 'string') {
            ctx.throw(400, '用户ID不能为空')
        }

        const device = await this.model.Device.findOne({
            where: data,
        })

        if (!device) {
            ctx.throw(404, '设备不存在')
        }

        if (!device.activeId) {
            ctx.throw(400, '设备已激活，不可解绑')
        }

        if (device.status === DeviceStatus.DISABLE) {
            ctx.throw(404, '设备已禁用，不可解绑')
        }

        device.set("userId", null)
        await device.save()

        return true
    }

}