import { EggContext, Next } from "@eggjs/tegg";

export  async function HookMiddleware(ctx: EggContext, next: Next) {
    if (ctx.get('x-api-key') !== ctx.app.config.webHookApiKey) {
        ctx.throw(403, '未授权')
    }
    await next()
}