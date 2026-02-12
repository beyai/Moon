async function handlerCryptoRequest(ctx, next) {
    const body = ctx.request.body;
    const CryptoService = ctx.service.security.crypto
    const requestData = await CryptoService.decryptRequestBody(body)
    requestData.deviceUID = body.deviceUID
    // CryptoService.verify(requestData)
    ctx.request.body = requestData
    await next()
    ctx.body.data = await CryptoService.encryptResponseData(ctx.body.data)
}

module.exports = handlerCryptoRequest