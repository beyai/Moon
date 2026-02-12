'use strict';
module.exports = async function verifyToken(ctx, next) {
    // 验证访问令牌
    const TokenService = ctx.service.auth.token;
    const payload = TokenService.verifyAccessToken(ctx.token)
    ctx.accountInfo = payload
    await next()
}