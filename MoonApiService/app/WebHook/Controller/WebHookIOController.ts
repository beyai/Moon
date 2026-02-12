import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { DeviceStatus } from "app/Enum";
import { DeviceService, DeviceUsageTimeService } from "app/Module/Device";
import dayjs from "dayjs";
import { HookMiddleware } from "../Middleware/HookMiddleware";
import { isEmpty } from "lodash";
import { TokenService } from "app/Core";

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
@Middleware( HookMiddleware )
export class WebHookController extends BaseController {
    @Inject()
    private readonly deviceService: DeviceService
    @Inject()
    private readonly deviceUsageTime: DeviceUsageTimeService;
    @Inject()
    private readonly tokenService: TokenService

    // 启动
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: 'launch' })
    async onLauch(
        @Context() ctx: EggContext
    ) {
        await this.deviceService.resetAllOnlineStatus()
        ctx.success(true, '重置成功')
    }

    // 验证
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: 'auth' })
    async onAuth(
        @Context() ctx: EggContext
    ) {
        const { token } = ctx.request.body;
        if (isEmpty(token)) {
            ctx.throw(401, '验证失败')
        }
        try {
            this.tokenService.verifyAccessToken(token)
            ctx.success(true, '验证成功')
        } catch {
            ctx.throw(401, '登录已过期，请重新登录')
        }
    }

    // 加入房间
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/join' })
    async onJoin(
        @Context() ctx: EggContext
    ) {
        const { room: deviceCode, from, timestamp } = ctx.request.body
        // 查询设备
        const device = await this.deviceService.findDeviceCode(deviceCode)
        if (device.status == DeviceStatus.DISABLED) {
            ctx.throw(400, '设备已禁用')
        }
        if (!device.userId) {
            ctx.throw(400, '设备未绑定用户账号')
        }
        // 查询使用时长限制
        if (!device.isActive) {
            const count = await this.deviceUsageTime.getWaitTime(deviceCode)
            if (count > 0) {
                ctx.throw(400, `已累计达到最大试用时长限制, 请等待 ${ Math.ceil(count / 60) }分钟！`)
            }
        }

        ctx.logger.debug(`%s 加入房间，来源 %s`, deviceCode, from)
        // 更新在线状态
        this.backgroundTask.run( async () => {
            try {
                if (from == IOFrom.CLIENT) {
                    await this.deviceService.setClientOnlineStatus(deviceCode, true)
                    return;
                }
                await this.deviceService.setOnlineStatus(deviceCode, {
                    isOnline: true,
                    connectedAt: dayjs(timestamp).toDate(),
                    connectedIp: this.ipAddr,
                    disconnectedAt: null
                })
            } catch(error: any) {
                this.logger.error(error)
            }
        })
        
        ctx.success({
            isActive: device.isActive 
        })
    }

    // 离开房间
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/leave' })
    async onLeave(
        @Context() ctx: EggContext
    ) {
        const { room: deviceCode, from, timestamp  } = ctx.request.body
        ctx.logger.debug(`%s 离开房间，来源 %s`, deviceCode, from)

        this.backgroundTask.run( async () => {
            try {
                if (from == IOFrom.CLIENT) {
                    await this.deviceService.setClientOnlineStatus(deviceCode, false)
                    return;
                } 
                await this.deviceService.setOnlineStatus(deviceCode, {
                    isOnline: false,
                    disconnectedAt: dayjs(timestamp).toDate()
                })
            } catch(error: any) {
                this.logger.error(error)
            }
        })
        ctx.success(true)
    }

}