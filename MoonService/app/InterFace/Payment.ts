import { FindQuery } from "./Common";

/**
 * 结算状态
 */
export enum PaymentStatus {
    UNPAYMENT = 0, // 未结算
    PAYMENTED = 1, // 已结算
}
export namespace PaymentStatus {
    export function values(): PaymentStatus[] {
        return Object.values(PaymentStatus).filter(v => typeof v === 'number') as PaymentStatus[]
    }
}


/**
 * 结算类型
 */
export enum PaymentType {
    ACTIVE = 'active',
    MOVE = "move"
}

export namespace PaymentType {
    export function values(): PaymentType[] {
        return Object.values(PaymentType).filter(v => typeof v === 'string') as PaymentType[]
    }
}

/**
 * 结算数据
 */
export interface PaymentData {
    paymentId?: number;
    type?: PaymentType;
    total?: number;
    count?: number;
    payload?: Record<string, number>;
    adminId?: string;
    endTime?: Date;
    paymentAt?: Date;
}

/**
 * 查询结算
 */
export interface PaymentQuery extends FindQuery {
    type?: PaymentType;
    adminId?: string
}