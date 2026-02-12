import { EggContext, Next } from "@eggjs/tegg";
import { UserSessionService } from "app/Module/User";

export async function UserAuthMiddleware(ctx: EggContext, next: Next) {
    if (!ctx.token) {
        ctx.throw(401, '授权失败')
    }
    const session = await ctx.getEggObject(UserSessionService)
    if (!session.verify(ctx.token)) {
        ctx.throw(401, '登录已过期，请重新登录')
    }
    await next()
}
