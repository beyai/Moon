import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractAppController } from "../Common/AbstractAppController";
import { TurnService, SettingService, DeviceService } from "@/module/Service";
import { UserAuthMiddleware, DeviceAuthMiddleware } from "../Middleware";

@HTTPController({ path: '/device'})
@Middleware(UserAuthMiddleware, DeviceAuthMiddleware)
export class AppDeviceController extends AbstractAppController {

    @Inject()
    turnService: TurnService
    @Inject()
    settingService: SettingService
    @Inject()
    deviceService: DeviceService

    // 绑定设备
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/bind' })
    async bindDevice(
        @Context() ctx: EggContext
    ) {
    }

    // 初始化获取设备信息
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    async initDevice(
        @Context() ctx: EggContext
    ) {
        const { deviceUID, deviceCode, version } = this.deviceCtx.body
        const { userId } = this.session.payload

        const data = {
            userId,
            deviceUID,
            deviceCode,
            version
        }

        // 查询设备
        const device = await this.deviceService.bind(ctx, data)
        // 配置
        const iceServers = await this.turnService.getIceServices(ctx, deviceCode)
        const { deviceFormat, liveStream } = this.settingService
        
        ctx.success({
            isActive: device.isActive,
            activeLevel: device.activeLevel,
            countDays: device.countDays,
            liveStream,
            iceServers,
            deviceFormat
        })
    }



}