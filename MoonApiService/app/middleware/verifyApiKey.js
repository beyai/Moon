'use strict';
module.exports = async function verifyToken(ctx, next) {
    const key = ctx.get('x-api-key')
    if (ctx.app.config.keys !== key) {
        ctx.throw(403, '无效请求')
    }
    await next()
}