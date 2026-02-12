import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { SessionCacheService } from "../Service/SessionCacheService";

@HTTPController({ path: '/v1' })
export class CommonController extends BaseController {

    @Inject()
    private readonly sessionCache: SessionCacheService

    /** 获取时间 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/time' })
    async getTimestamp(
        @Context() ctx: EggContext
    ) {
        ctx.success(this.sessionCache.getTimestamp())
    }

    /** 获取挑战因子 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/challenge' })
    async getChallenge(
        @Context() ctx: EggContext
    ) {
        const result = await this.sessionCache.generateChallenge()
        ctx.success(result)
    }
}