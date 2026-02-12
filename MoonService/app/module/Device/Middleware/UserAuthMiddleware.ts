import { EggContext, Next } from "@eggjs/tegg";
import { UserSessionService } from "@/module/Service";

export async function UserAuthMiddleware(ctx: EggContext, next: Next) {
    const userSession = await ctx.getEggObject(UserSessionService)
    userSession.verify(ctx)
    ctx.logger.debug('UserAuth')
    await next()
}