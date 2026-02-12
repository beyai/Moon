import { AdminSessionService } from "@/module/Service";
import { EggContext, Next } from "@eggjs/tegg";
export async function AdminAuthMiddleware(ctx: EggContext, next: Next) {
    const adminSession = await ctx.getEggObject(AdminSessionService)
    adminSession.verify(ctx)
    await next()
}