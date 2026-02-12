import { EggContext, Next } from "@eggjs/tegg";

export default function() {
    return async function ErrorHandler(ctx: EggContext, next: Next) {
        try {
            await next()
        } catch(err: any) {
            if (ctx.app.env == 'local') {
                ctx.logger.error(err)
            }
            ctx.status = err.statusCode || 500
            ctx.body = {
                code: ctx.status,
                message: err.message ?? '请求失败'
            }
        }
    }
}