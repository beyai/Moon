import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractClientController } from "../Common/AbstractClientController";
import { ClientAuthMiddleware, UserAuthMiddleware } from "../Middleware";
import { ClientDeviceService } from "../Service/ClientDeviceService";

@HTTPController({ path: '/client/device' })
@Middleware(UserAuthMiddleware, ClientAuthMiddleware)
export class ClientDeviceController extends AbstractClientController {

    @Inject()
    deviceService: ClientDeviceService

    // 我的设备列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' }) 
    async findList(
        @Context() ctx: EggContext
    ) {
        const { userId } = this.session.payload
        const result = await this.deviceService.findDeviceList(ctx, userId)
        const body = await this.clientCtx.buildResponseData(ctx, result.map(item => ({
            deviceCode: item.deviceCode,
            isActive: item.isActive,
            isOnline: item.isOnline,
            countDays: item.countDays,
            status: item.status,
        })) )
        ctx.success(body)
    }

    // 设备信息
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    async initDevice(
        @Context() ctx: EggContext
    ) {
        const { deviceCode } = this.clientCtx.body
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        const { userId } = this.session.payload
        if (!userId) {
            ctx.throw(412, '用户ID不能为空')
        }
        const result    = await this.deviceService.getDeviceInfo(ctx, { deviceCode, userId })
        const body      = await this.clientCtx.buildResponseData(ctx, result )
        ctx.success(body)
    }

    // 解绑设备
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/unbind' })
    async unbindDevice(
        @Context() ctx: EggContext
    ) {
        const { deviceCode } = this.clientCtx.body
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        const { userId } = this.session.payload
        if (!userId) {
            ctx.throw(412, '用户ID不能为空')
        }
        await this.deviceService.getDeviceInfo(ctx, { deviceCode, userId })
        ctx.success(true, '解绑成功')
    }

}