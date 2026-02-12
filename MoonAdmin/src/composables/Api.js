export default {
    Common: {
        /** 操作验证 */
        captchaTeack(body) {
            return Http.post('/captcha', { body })
        },

        /** 管理员登录 */
        login(body) {
            return Http.post('/auth/login', { body })
        },

        /** 退出登录 */
        logout(options) {
            return Http.post('/auth/logout', options)
        },

        /** 刷新访问 token */
        refreshToken(options) {
            return Http.post('/auth/refresh', options)
        },

        /** 修改密码 */
        updatePassword(body) {
            return Http.post('/auth/password', { body })
        },

        /** 初始化加载当前登录账号信息 */
        init() {
            return Http.post('/auth/init')
        }
    },

    /** 管理员 */
    Admin: {
       list(body) {
            return Http.post('/admin/list', { body })
        },
        create(body) {
            return Http.post('/admin/create', { body })
        },
        agent() {
            return Http.post('/admin/all')
        },
        setStatus(body) {
            return Http.post('/admin/setStatus', { body })
        },
        setPassword(body) {
            return Http.post('/admin/setPassword', { body })
        }
    },

    /** 用户 */
    User: {
        list(body) {
            return Http.post('/user/list', { body })
        },
        create(body) {
            return Http.post('/user/create', { body })
        },
        search(body) {
            return Http.post('/user/search', { body })
        },
        setStatus(body) {
            return Http.post('/user/setStatus', { body })
        },
        setPassword(body) {
            return Http.post('/user/setPassword', { body })
        }
    },

    /** 设备 */
    Device: {
        list(body) {
            return Http.post('/device/list', { body })
        },
        setStatus(body) {
            return Http.post('/device/setStatus', { body })
        },
        setUser(body) {
            return Http.post('/device/setUser', { body })
        },
        remove(body) {
            return Http.post('/device/remove', { body })
        }
    },

    /** 激活 */
    Active: {
        list(body) {
            return Http.post('/active/list', { body })
        },
        active(body) {
            return Http.post('/active/active', { body })
        },
        unActive(body) {
            return Http.post('/active/unactive', { body })
        },
        remove(body) {
            return Http.post('/active/undo', { body })
        }
    },

    /** 移机 */
    Move: {
        list(body) {
            return Http.post('/move/list', { body })
        },
        move(body) {
            return Http.post('/move/move', { body })
        },
        unMove(body) {
            return Http.post('/move/undo', { body })
        }
    },

    /** 结算 */
    Payment: {
        list(body) {
            return Http.post('/payment/list', { body })
        },
        payment(body) {
            return Http.post('/payment/payment', { body })
        }
    },

    /** 统计 */
    Statistc: {
        all(body) {
            return Http.post('/statistc/all', { body })
        },
        active(body) {
            return Http.post('/statistc/active', { body })
        },
        move(body) {
            return Http.post('/statistc/move', { body })
        }
    },

    /** 应用版本管理 */
    App: {
        list() {
            return Http.post('/application/list')
        },
        create(body) {
            return Http.post('/application/create', { body })
        },
        remove(body) {
            return Http.post('/application/remove', { body })
        },
        setStatus(body) {
            return Http.post('/application/setStatus', { body })
        },
    },

    /** App客户端 */
    Session: {
        list(body) {
            return Http.post('/session/list', { body })
        },
        reset(body) {
            return Http.post('/session/resetStatus', { body })
        },
        remove(body) {
            return Http.post('/session/remove', { body })
        }
    },

    /** 游戏 */
    Game: {
        dict() {
            return Http.post("/game/dict")
        },
        all() {
            return Http.post('/game/all')
        },
        list(body) {
            return Http.post('/game/list', { body })
        },
        create(body) {
            return Http.post('/game/create', { body })
        },
        update(body) {
            return Http.post('/game/update', { body })
        },
        setStatus(body) {
            return Http.post('/game/setStatus', { body })
        },
        remove(body) {
            return Http.post('/game/remove', { body })
        },
    },

    /** 游戏玩法 */
    GamePlay: {
        list(body) {
            return Http.post('/game/play/list', { body })
        },
        remove(body) {
            return Http.post('/game/play/remove', { body })
        },
    }
}