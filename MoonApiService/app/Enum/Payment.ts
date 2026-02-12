/**
 * 结算状态
 * - UNPAYMENT 未结算
 * - PAYMENTED 已结算
 */
export enum PaymentStatus {
    UNPAYMENT   = 0,
    PAYMENTED   = 1
}

/**
 * 结算类型
 * - ACTIVE 激活
 * - MOVE 移机
 */
export enum PaymentType {
    ACTIVE = 'active',
    MOVE = "move"
}