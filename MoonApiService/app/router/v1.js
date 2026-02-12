/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    const { handlerCryptoRequest, verifyToken } = app.middleware

    const Controller = controller.v1
    const V1 = router.namespace('/api/v1')
    
    V1.post('/device/challenge', Controller.device.challenge)
    V1.post('/device/checkIn', Controller.device.checkIn)
    V1.post('/device/negotiate', Controller.device.negotiate)



}