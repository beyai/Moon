
module.exports = (app) => {
    const { router, controller } = app;
    router.post('/checkIn', controller.home.index)

    const CommonRouter = router.namespace('/api/common');

    const CaptchaController = controller.common.captcha;
    CommonRouter.post('/captcha', CaptchaController.track);

}