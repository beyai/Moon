/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    const { verifyApiKey } = app.middleware
    const Hook = controller.hook
    const HookRouter = router.namespace('/api/hooks/io', verifyApiKey)
    HookRouter.post('/launch', Hook.socket.launch)
    HookRouter.post('/join', Hook.socket.join)
    HookRouter.post('/leave', Hook.socket.leave)
}