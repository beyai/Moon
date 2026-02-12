/**
 * 管理员账号类型
 * - SYSTEM 系统账号
 * - AGENT 销售账号
 */
export enum AdminType {
    SYSTEM = 'system',
    AGENT = 'agent',
}

/**
 * 管理员账号状态
 * - NORMAL 正常
 * - DISABLED 禁用
 */
export enum AdminStatus {
    NORMAL      = 1,
    DISABLED    = 0
}

