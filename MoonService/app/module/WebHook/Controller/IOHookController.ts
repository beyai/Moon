import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject } from "@eggjs/tegg";
import { AbstractHookController } from "../Common/AbstractSystemController";
import { DeviceService, DeviceUseTimeService } from "@/module/Service";
import dayjs from "dayjs";
import { DeviceStatus } from "app/InterFace";

// 端类型
enum IOFrom {
    DEVICE = "device",
    CLIENT = "client"
}

// 角色
enum IORole {
    ANCHOR = "anchor",
    AUDIENCE = "audience"
}

@HTTPController({ path: '/hooks/io' })
export class IOHookController extends AbstractHookController {

    @Inject()
    private readonly deviceService: DeviceService

    @Inject()   
    private readonly deviceUseTimeService: DeviceUseTimeService

    // 启动成功
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/launch' })
    async onLaunch(
        @Context() ctx: EggContext
    ) {
        await this.deviceService.resetAllOnlineStatus(ctx)
        ctx.success(true)
    }

    // 加入房间
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/join' })
    async onJoin(
        @Context() ctx: EggContext
    ) {
        const { 
            room: deviceCode, 
            from, 
            ip, 
            timestamp 
        } = ctx.request.body

        // 查询设备
        const device = await this.deviceService.findByDeviceCode(ctx, deviceCode, true)
        if (device.status == DeviceStatus.DISABLE) {
            ctx.throw(400, '设备已禁用')
        }
        if (!device.userId) {
            ctx.throw(400, '设备未绑定用户账号')
        }
        // 查询使用时长限制
        if (!device.isActive) {
            try {
                await this.deviceUseTimeService.getUsedTime(deviceCode)
            } catch(error: any){
                ctx.throw(400, error.message)
            }
        }
        ctx.success({ isActive: device.isActive })
        // 更新在线状态
        ctx.app.runInBackground( async () => {
            try {
                if (from == IOFrom.CLIENT) {
                    await this.deviceService.setClinetOnlineStatus(ctx, deviceCode, true)
                    return;
                }
                await this.deviceService.setOnlineStatus(ctx, deviceCode, {
                    isOnline: true,
                    connectedAt: dayjs(timestamp).toDate(),
                    connectedIp: ip,
                    disconnectedAt: null
                })
            } catch(error: any) {
                this.logger.error(error)
            }
        })

        
    }

    // 离开房间
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/leave' })
    async onLeave(
        @Context() ctx: EggContext
    ) {
        ctx.success(true)
        ctx.app.runInBackground( async () => {
            const { 
                room: deviceCode, 
                from, 
                timestamp 
            } = ctx.request.body
            try {
                if (from == IOFrom.CLIENT) {
                    await this.deviceService.setClinetOnlineStatus(ctx, deviceCode, false)
                    return;
                } 
                await this.deviceService.setOnlineStatus(ctx, deviceCode, {
                    isOnline: false,
                    disconnectedAt: dayjs(timestamp).toDate()
                })
            } catch(error: any) {
                this.logger.error(error)
            }
        })
    }

}