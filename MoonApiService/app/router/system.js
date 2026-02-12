const { ADMIN_TYPES } = require("../enum");

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    const { operationAuth, verifyToken } = app.middleware

    const System = controller.system

    router.post('/api/system/auth/login', System.auth.login)
    router.post('/api/system/auth/refreshToken', System.auth.refreshToken)

    const Auth = router.namespace('/api/system/auth', verifyToken, operationAuth())
    Auth.post('/init', System.auth.init)
    Auth.post('/updatePassword', System.auth.updatePassword)

    /** 用户管理 */
    const UserRouter = router.namespace('/api/system/user', verifyToken)
    UserRouter.post('/search', operationAuth(), System.user.search)
    UserRouter.post('/create', operationAuth(), System.user.create)
    UserRouter.post('/password', operationAuth(), System.user.setPassword)
    UserRouter.post('/status', operationAuth(ADMIN_TYPES.SYSTEM), System.user.setStatus)
    UserRouter.post('/list', operationAuth(ADMIN_TYPES.SYSTEM), System.user.list)

    /** 管理员 */
    const AdminRouter = router.namespace('/api/system/admin', verifyToken, operationAuth(ADMIN_TYPES.SYSTEM), )
    AdminRouter.post('/create', System.admin.create)
    AdminRouter.post('/password', System.admin.setPassword)
    AdminRouter.post('/status', System.admin.setStatus)
    AdminRouter.post('/list', System.admin.list)
    AdminRouter.post('/agent', System.admin.agent)

    /** 设备 */
    const DeviceRouter = router.namespace('/api/system/device', verifyToken)
    DeviceRouter.post('/list', operationAuth(), System.device.list)
    DeviceRouter.post('/status', operationAuth(), System.device.setStatus)
    DeviceRouter.post('/user', operationAuth(), System.device.setUser)
    DeviceRouter.post('/remove', operationAuth(ADMIN_TYPES.SYSTEM), System.device.remove)

    /** 激活 */
    const ActiveRouter = router.namespace('/api/system/active', verifyToken)
    ActiveRouter.post('/list', operationAuth(), System.active.list)
    ActiveRouter.post('/active', operationAuth(), System.active.active)
    ActiveRouter.post('/unactive', operationAuth(), System.active.unactive)
    ActiveRouter.post('/remove', operationAuth(ADMIN_TYPES.SYSTEM), System.active.remove)

    /** 移机 */
    const MoveRouter = router.namespace('/api/system/move', verifyToken)
    MoveRouter.post('/list', operationAuth(), System.move.list)
    MoveRouter.post('/move', operationAuth(), System.move.move)
    MoveRouter.post('/unmove', operationAuth(ADMIN_TYPES.SYSTEM), System.move.unmove)

    /** 结算 */
    const PaymentRouter = router.namespace('/api/system/payment', verifyToken)
    PaymentRouter.post('/list', operationAuth(), System.payment.list)
    PaymentRouter.post('/payment', operationAuth(ADMIN_TYPES.SYSTEM), System.payment.payment)

    /** 统计 */
    const StatistcRouter = router.namespace('/api/system/statistc', verifyToken, operationAuth())
    StatistcRouter.post('/all', System.statistc.all);
    StatistcRouter.post('/active', System.statistc.active);
    StatistcRouter.post('/move', System.statistc.move);


    /** 应用版本管理 */
    const AppRouter = router.namespace('/api/system/app', verifyToken, operationAuth(ADMIN_TYPES.SYSTEM))
    AppRouter.post('/list', System.application.findAll);
    AppRouter.post('/create', System.application.create);
    AppRouter.post('/remove', System.application.remove);
    AppRouter.post('/setStatus', System.application.setStatus);
}