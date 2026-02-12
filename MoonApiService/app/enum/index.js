
/**
 * 管理员类型
 * @property {string} SYSTEM 系统管理员
 * @property {string} AGENT 代理管理员
 */
exports.ADMIN_TYPES = Object.freeze({
    SYSTEM: 'system',
    AGENT: 'agent',
})

/**
 * 状态
 * @property {number} ENABLE 启用
 * @property {number} DISABLE 禁用
 */ 
exports.STATUS_TYPES = Object.freeze({
    NORMAL: 1,
    DISABLE: 0
})

/**
 * 设备激活等级
 * @property {string} LOW 低   
 * @property {string} MEDIUM 中
 * @property {string} HIGH 高
 */
exports.DEVICE_ACTIVE_LEVELS = Object.freeze({
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
})


/**
 * 结算状态
 * @property {number} UNSETTLED 未结算
 * @property {number} SETTLED 已结算
 */
exports.PAYMENT_STATUS = Object.freeze({
    UNPAYMENT: 0,
    PAYMENTED: 1
})

/**
 * 结算类型
 * @property {string} ACTIVE 激活记录
 * @property {string} MOVE 移机记录
 */
exports.PAYMENT_TYPES = Object.freeze({
    ACTIVE: 'active',
    MOVE: 'move',
})

/**
 * Socket消息来源
 * @property {string} CLIENT 客户端
 * @property {string} DEVICE 设备
 * @property {string} SYSTEM 系统
 */
exports.SOCKET_MESSAGE_FROMS = Object.freeze({
    CLIENT: 'client',
    DEVICE: 'device',
    SYSTEM: 'system'
})

/**
 * Socket消息类型
 * @property {string} ONLINE 在线
 * @property {string} OFFLINE 离线
 */
exports.SOCKET_MESSAGE_TYPES = Object.freeze({
    ONLINE: 'online',
    OFFLINE: 'offline'
})