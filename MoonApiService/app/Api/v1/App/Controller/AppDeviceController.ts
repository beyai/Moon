import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { BaseDeviceController } from "../BaseDeviceController";
import { DeviceService } from "app/Module/Device";
import { UserAuthMiddleware } from "../../Middleware/UserAuthMiddleware";
import { AppMiddleware } from "../Middleware/AppMiddleware";
import { isEmpty } from "lodash";
import { TurnService } from "app/Module/Turn";
import { SettingService } from "app/Module/Setting";

@HTTPController({ path: '/v1/device' })
@Middleware( UserAuthMiddleware, AppMiddleware )
export class AppDeviceController extends BaseDeviceController {

    @Inject()
    private readonly deviceService: DeviceService
    @Inject()
    private readonly turnService: TurnService
    @Inject()
    private readonly settingService: SettingService

    /** 初始化设备 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    async initDevice(
        @Context() ctx: EggContext
    ) {
        const { deviceCode, version } = this.deviceCtx.body
        if (isEmpty(deviceCode)) ctx.throw(400, `设备码不能为空`);
        
        const device = await this.deviceService.findOrCreate(
            deviceCode, 
            this.deviceCtx.deviceUID!, 
            this.session.userId, 
            version ?? '0.0.0' 
        )
        
        const { deviceFormat, liveStream } = this.settingService
        const iceServers = await this.turnService.getIceServers(deviceCode)

        return {
            isActive: device.isActive,
            activeLevel: device.activeLevel,
            countDays: device.countDays,
            deviceFormat,
            liveStream,
            iceServers
        }
    }
}