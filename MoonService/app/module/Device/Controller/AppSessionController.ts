import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractAppController } from "../Common/AbstractAppController";

@HTTPController({ path: '/device/session'})
export class AppSessionController extends AbstractAppController {

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
        let challenge = await this.deviceCtx.generateChallenge()
        ctx.success(challenge)
    }
    
    // 注册设备
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/checkIn' })
    async checkIn(
        @Context() ctx: EggContext
    ) {
        const result = await this.deviceCtx.checkIn(ctx)
        ctx.success(result, "注册成功")
    }

    // 协商密钥
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/negotiate' })
    async negotiate(
        @Context() ctx: EggContext
    ) {
        const result = await this.deviceCtx.negotiate(ctx)
        ctx.success(result, "协商成功")
    }


}