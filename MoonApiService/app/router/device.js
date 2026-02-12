/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    const { handlerCryptoRequest, verifyToken } = app.middleware

    const Device = controller.device
    const DeviceRouter = router.namespace('/api/device')
    DeviceRouter.post('/challenge', Device.auth.challenge)
    DeviceRouter.post('/checkin', Device.auth.checkin)
    DeviceRouter.post('/negotiate', Device.auth.negotiate)

    DeviceRouter.post('/register', handlerCryptoRequest, Device.auth.register)
    DeviceRouter.post('/version', handlerCryptoRequest, Device.auth.version)
    DeviceRouter.post('/init', handlerCryptoRequest, Device.auth.init)

    DeviceRouter.post('/bind', verifyToken, handlerCryptoRequest, Device.auth.bind)

}