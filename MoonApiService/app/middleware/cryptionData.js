/**
 * 对称加解密数据
 */
'use strict';
module.exports = async function cryptionData(ctx, next) {
    const key = ctx.get("client-key")
    if (!key) {
        ctx.throw(403, '请求无效')
    }
    const { data } = ctx.request.body
    if (typeof data != 'string') {
        ctx.throw(400, '数据无效')
    }
    const SecurityService = ctx.service.security
    ctx.request.body = await SecurityService.decryptData(key, data)
    await next()
    ctx.body.data = await SecurityService.encryptData(key, ctx.body.data)
}