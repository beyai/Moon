'use strict';

module.exports = function throwApiError() {
    return async function(ctx, next) {
        try {
            await next()
        } catch(err) {
            ctx.status = err.statusCode || 500
            ctx.body = {
                code: err.statusCode || 500,
                message: err.message,
            }
            // 开发环境，打印错误信息
            if (ctx.app.config.env == 'local') {
                ctx.logger.error(err)
            }
            // 400 错误，打印参数
            else if ( [ 400, 500 ].includes(ctx.status) ) {
                ctx.logger.error(JSON.stringify(err))
            } 
        }
    }
}