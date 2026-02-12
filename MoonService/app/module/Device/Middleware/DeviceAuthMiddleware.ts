import { EggContext, Next } from "@eggjs/tegg";
import { DeviceContextService } from "../Service/DeviceContextService";

export async function DeviceAuthMiddleware(ctx: EggContext, next: Next) {
    const deviceCtx = await ctx.getEggObject(DeviceContextService)
    await deviceCtx.verify(ctx)
    await next()
    ctx.body.data = await deviceCtx.buildResponseData(ctx, ctx.body.data ?? null)
}