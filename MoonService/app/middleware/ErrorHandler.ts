import { EggContext, Next } from "@eggjs/tegg";

export async function ErrorHandler(ctx: EggContext, next: Next) {
    try {
        await next()
        ctx.logger.debug(ctx.url)
    } catch (err: any) {
        ctx.logger.warn("请求失败，参数：", err.message, JSON.stringify(ctx.request.body))
        ctx.status = err.statusCode || 500
        ctx.body = {
            code: err.statusCode ?? 500,
            message: err.message ?? '请求失败'
        }
    }
}

export default () => ErrorHandler