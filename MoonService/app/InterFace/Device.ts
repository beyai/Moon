import { FindQuery } from "./Common";
import { PaymentStatus } from "./Payment";

/**
 * 设备状态
 */
export enum DeviceStatus {
    NORMAL = 1, // 正常
    DISABLE = 0, // 禁用
}
export namespace DeviceStatus {
    export function values(): DeviceStatus[] {
        return Object.values(DeviceStatus).filter(v => typeof v === 'number') as DeviceStatus[]
    }
}

/**
 * 激活级别
 */
export enum DeviceActiveLevel {
    LOW     = 'low', // 低
    MEDIUM  = 'medium', // 中
    HIGH    = 'high', // 高
}
export namespace DeviceActiveLevel {
    export function values(): DeviceActiveLevel[] {
        return Object.values(DeviceActiveLevel).filter(v => typeof v === 'string') as DeviceActiveLevel[]
    }
}

/**
 * 设备风控状态
 */
export enum DeviceRiskStatus {
    DELETE  = 0, // 删除
    NORMAL  = 1, // 正常
    REVIEW  = 2, // 风控中
    BLOCKED = 3, // 风控拦截
}
export namespace DeviceRiskStatus {
    export function values(): DeviceRiskStatus[] {
        return Object.values(DeviceRiskStatus).filter(v => typeof v === 'number') as DeviceRiskStatus[]
    }
}

/**
 * 风控阈值
 */
export enum DeviceRiskThreshold {
    MIN = 3, // >= MIN，风控中
    MAX = 5, // >= MAX, 风控拦截
}
export namespace DeviceRiskThreshold {
    export function values(): DeviceRiskThreshold[] {
        return Object.values(DeviceRiskThreshold).filter(v => typeof v === 'number') as DeviceRiskThreshold[]
    }
}


/**
 * 设备数据
 */
export interface DeviceData {
    deviceId?: string;
    deviceUID?: string;
    deviceCode?: string;
    version?: string;
    clientVersion?: string;
    activeId?: string;
    isOnline?: boolean;
    clientIsOnline?: boolean;
    connectedAt?: Date | null;
    disconnectedAt?: Date | null;
    connectedIp?: string;
    status?: DeviceStatus;
    userId?: string;
    adminId?: string;
}

/**
 * 设备查询参数
 */
export interface DeviceQuery extends FindQuery, DeviceData {
    keyword?: string;
    isActive?: boolean;
    payment?: PaymentStatus;
    level?: DeviceActiveLevel;
    startTime?: string;
    endTime?: string
}

/**
 * 设备激活数据
 */
export interface DeviceActiveData {
    activeId?: string;
    deviceCode?: string;
    level?: DeviceActiveLevel;
    activeAt?: Date;
    expiredAt?: Date;
    adminId?: string;
    payment?: PaymentStatus;
    paymentAt?: Date;
}

/**
 * 设备激活查询参数
 */
export interface DeviceActiveQuery extends FindQuery {
    deviceCode?: string;
    level?: DeviceActiveLevel;
    adminId?: string;
    startTime?: string;
    endTime?: string
    payment?: PaymentStatus;
}

/**
 * 移机数据
 */
export interface DeviceMoveData {
    moveId?: string;
    activeId?: string;
    newDeviceCode?: string;
    oldDeviceCode?: string;
    newUsername?: string;
    oldUsername?: string;
    adminId?: string;
    payment?: PaymentStatus;
    paymentAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * 移机数据查询参数
 */
export interface DeviceMoveQuery extends FindQuery {
    deviceCode?: string;
    username?: string;
    adminId?: string;
    startTime?: string;
    endTime?: string;
    payment?: PaymentStatus;
}

export interface DeviceSessionQuery extends FindQuery {
    deviceCode?: string;
    status?: DeviceRiskStatus;
    model?: string;
}