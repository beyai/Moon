import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject } from "@eggjs/tegg";
import { BaseClientController } from "../BaseClientController";

@HTTPController({ path: '/v1/client' })
export class ContextContextController extends BaseClientController {

    /** 协商密钥 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/negotiate' })
    async deviceNegotiate(
        @Context() ctx: EggContext
    ) {
        try {
            const result = await this.clientCtx.negotiate(ctx.request.body)
            ctx.success(result, `设备验证成功`)
        } catch(error: any) {
            ctx.throw(400, `客户端验证失败`)
        }
    }

}