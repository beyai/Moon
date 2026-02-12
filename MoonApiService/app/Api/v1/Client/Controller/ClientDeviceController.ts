import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { DeviceService, DeviceUsageTimeService } from "app/Module/Device";
import { UserAuthMiddleware } from "../../Middleware/UserAuthMiddleware";
import { isEmpty } from "lodash";
import { SettingService } from "app/Module/Setting";
import { ClientMiddleware } from "../Middleware/ClientMiddleware";
import { BaseClientController } from "../BaseClientController";
import semver from 'semver'

@HTTPController({ path: '/v1/client/device' })
@Middleware( UserAuthMiddleware, ClientMiddleware )
export class ClientDeviceController extends BaseClientController {

    @Inject()
    private readonly deviceService: DeviceService
    @Inject()
    private readonly deviceUsageTime: DeviceUsageTimeService;
    @Inject()
    private readonly settingService: SettingService

    /** 初始化设备 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    async initDevice(
        @Context() ctx: EggContext
    ) {
        const { deviceCode, version: ClientVersion = '0.0.0' } = this.clientCtx.body
        if (isEmpty(deviceCode)) ctx.throw(400, `设备码不能为空`);
        const device = await this.deviceService.findDeviceCode(deviceCode)

        // 检测 App 版本号，提示用户强制升级
        const { appMinVersion = '1.0.0', updateNotification } = this.settingService.client
        if (semver.gt(device.version, appMinVersion)) {
            ctx.throw(400, updateNotification ?? 'App版本过低, 请升级到最新版本')
        }

        // 检测试用时限
        if (!device.isActive) {
            const count = await this.deviceUsageTime.getWaitTime(deviceCode)
            if (count > 0) {
                ctx.throw(400, `已累计达到最大试用时长限制, 请等待 ${ Math.ceil(count / 60) }分钟！`)
            }
        }

        // 更新客户端版本
        if (semver.valid(ClientVersion) && device.clientVersion !== ClientVersion) {
            this.backgroundTask.run(async () => {
                await this.deviceService.setClientVersion(deviceCode, ClientVersion)
            })
        }

        return {
            deviceCode: device.deviceCode,
            isActive: device.isActive,
        }
    }

    /** 用户设备列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' }) 
    async findList(
        @Context() ctx: EggContext
    ) {
        const userId = this.session.userId
        const { rows } = await this.deviceService.findList({ userId }, ctx.page, 50)
        return rows.map(item => {
            return {
                deviceCode: item.deviceCode,
                isActive: item.isActive,
                isOnline: item.isOnline,
                countDays: item.countDays,
                status: item.status,
            }
        })
    }

    /** 解绑 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/unbind' }) 
    async unbind(
        @Context() ctx: EggContext
    ) {
        const { deviceCode } = this.clientCtx.body
        if (isEmpty(deviceCode)) {
            ctx.throw(400, '设备码不能为空')
        }
        const userId = this.session.userId
        await this.deviceService.unbind(deviceCode, userId)
        return true
    }

    
}