/**
 * 非对称加密
 */
'use strict';
module.exports = async function cryptionRSA(ctx, next) {
    const { data } = ctx.request.body
    if (typeof data != 'string') {
        ctx.throw(400, '数据无效')
    }
    const key = ctx.get("client-key")
    const SecurityService = ctx.service.security
    ctx.request.body = await SecurityService.privateKeyDecrypt(data)
    await next()
    ctx.body.data = await SecurityService.encryptData(key, ctx.body.data)
}