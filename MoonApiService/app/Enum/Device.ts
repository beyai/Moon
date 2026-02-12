/**
 * 设备状态
 * - NORMAL 正常
 * - DISABLED 禁用
 */
export enum DeviceStatus {
    NORMAL      = 1,
    DISABLED    = 0
}

/**
 * 设备激活级别
 * - LOW 低
 * - MEDIUM 中
 * - HIGH 高
 */
export enum DeviceActiveLevel {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'hight',
}

/**
 * 风控状态
 * - DELETE 删除
 * - NORMAL 正常
 * - REVIEW 风控中
 * - LOCKED 栏截
 */
export enum DeviceSessionStatus {
    DELETE = 0,
    NORMAL = 1,
    REVIEW = 2,
    LOCKED = 3,
}

/**
 * 设备会话更新统计阈值, 动态变更新风控状态
 * - MIN: >= 风控中 
 * - MAX: >= 栏截
 */
export enum DeviceSessionUpdateCountThreshold {
    MIN = 3,
    MAX = 5,
}