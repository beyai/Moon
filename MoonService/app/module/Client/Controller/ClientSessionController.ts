import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Middleware } from "@eggjs/tegg";
import { AbstractClientController } from "../Common/AbstractClientController";

@HTTPController({ path: '/client/session'})
export class ClientSessionController extends AbstractClientController {
    // 服务器时间
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/time' })
    async getTimestamp(
        @Context() ctx: EggContext
    ) {
        const time = Math.ceil(Date.now() / 1000)
        ctx.success(time)
    }

    // 获取挑战因子
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/challenge' })
    async getChallenge(
        @Context() ctx: EggContext
    ) {
        let challenge = await this.clientCtx.generateChallenge()
        ctx.success(challenge)
    }

    // 协商密钥
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/negotiate' })
    async negotiate(
        @Context() ctx: EggContext
    ) {
        const body = await this.clientCtx.negotiate(ctx)
        ctx.success(body, "协商成功")
    }

}