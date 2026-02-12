import { EggContext, Next } from "@eggjs/tegg";
import { ClientContextService } from "../Service/ClientContextService";

export async function ClientAuthMiddleware(ctx: EggContext, next: Next) {
    const clientCtx = await ctx.getEggObject(ClientContextService)
    await clientCtx.verify(ctx)
    ctx.logger.warn("解码成功", JSON.stringify(clientCtx.body))
    await next()
}