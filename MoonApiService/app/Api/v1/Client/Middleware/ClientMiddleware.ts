import { EggContext, Next } from "@eggjs/tegg";
import { ClientContextService } from "../Service/ClientContextService";

export async function ClientMiddleware(ctx: EggContext, next: Next) {
    const clientCtx = await ctx.getEggObject(ClientContextService)
    if (!await clientCtx.verifyRequest(ctx.request.body)) {
        ctx.throw(402, '会话已过期')
    }
    ctx.logger.debug(`客户端会话验证通过`)
    await next()
    try {
        const data = await clientCtx.buildResponse(ctx.body)
        ctx.success(data)
    } catch {
        ctx.throw(400, '请求失败')
    }
}
