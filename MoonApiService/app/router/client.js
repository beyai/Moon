/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    const { router, controller } = app;
    const { handlerCryptoRequest, verifyToken } = app.middleware

    const Client = controller.client
    const CleintRouter = router.namespace('/api/client')
    
    // 协商密钥
    CleintRouter.post('/negotiate', Client.auth.negotiate)
    
    // 验证码
    CleintRouter.post('/captcha', handlerCryptoRequest, Client.auth.captcha)
    // 登录
    CleintRouter.post('/login', handlerCryptoRequest, Client.auth.login)
    // 退出登录
    CleintRouter.post('/logout', handlerCryptoRequest, Client.auth.logout)
    // 刷新Token
    CleintRouter.post('/refreshToken', handlerCryptoRequest, Client.auth.refreshToken)
    // 注册
    CleintRouter.post('/register', handlerCryptoRequest, Client.auth.register)
    
    // 初始化账号
    CleintRouter.post('/initAccount', verifyToken, handlerCryptoRequest, Client.auth.initAccount)
    
    // 修改密码
    CleintRouter.post('/updatePassword', verifyToken, handlerCryptoRequest, Client.auth.updatePassword)

    // 设备列表
    CleintRouter.post('/deviceList', verifyToken, handlerCryptoRequest, Client.auth.deviceList)

    // 删除设备
    CleintRouter.post('/unbindDevice', verifyToken, handlerCryptoRequest, Client.auth.unbindDevice)

    // 初始化设备
    CleintRouter.post('/initDevice', verifyToken, handlerCryptoRequest, Client.auth.initDevice)

}