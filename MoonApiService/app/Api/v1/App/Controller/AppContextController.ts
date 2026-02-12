import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject } from "@eggjs/tegg";
import { BaseDeviceController } from "../BaseDeviceController";

@HTTPController({ path: '/v1/device' })
export class DeviceContextController extends BaseDeviceController {

    /** 登记设备 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/checkIn' })
    async deviceCheckIn(
        @Context() ctx: EggContext
    ) {
        try {
            const result = await this.deviceCtx.checkIn(ctx.request.body)
            ctx.success(result, `设备注册成功`)
        } catch(error: any) {
            ctx.throw(400, `设备注册失败, 请与我们联系`)
        }
    }

    /** 协商密钥 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/negotiate' })
    async deviceNegotiate(
        @Context() ctx: EggContext
    ) {
        try {
            const result = await this.deviceCtx.negotiate(ctx.request.body)
            ctx.success(result, `设备验证成功`)
        } catch(error: any) {
            ctx.throw(error.statusCode || 400, `设备验证失败, 请与我们联系`)
        }
    }

}