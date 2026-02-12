import { EggContext, Next } from "@eggjs/tegg";
import { DeviceContextService } from "../Service/DeviceContextService";

export async function AppMiddleware(ctx: EggContext, next: Next) {
    const deviceCtx = await ctx.getEggObject(DeviceContextService)
    if (!await deviceCtx.verifyRequest(ctx.request.body)) {
        ctx.throw(402, '会话已过期')
    }
    await next()
    try {
        const data = await deviceCtx.buildResponse(ctx.body)
        ctx.success(data)
    } catch {
        ctx.throw(400, '请求失败')
    }
}
