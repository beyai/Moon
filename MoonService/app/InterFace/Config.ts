import "egg"
import { RedisOptions } from "ioredis";

/** App 应用包配置 */
export interface AppBundleConfig {
    // 团队唯一标识
    teamIdentifier: string;
    // 应用唯一标识
    bundleIdentifier: string;
    // 应用包名
    bundleName: string;
    // 应用商店下载地址
    appStoreURL: string;
    // 应用 Root 私钥
    privateKey: Buffer;
}

/** 桌面客户端配置 */
export interface DesktopClient {
    bundleName: string;
    bundleIdentifier: string;
    version: string;
    privateKey: Buffer
}

/** Redis缓存配置选项 */
export interface CacheOptions extends RedisOptions {
    prefix?: string;
}

/** IP 归属地查询 */
export interface GeoIP {
    // 数据库文件数据
    db: string
}

 /** token */
export interface TokenConfig {
    // JWT加密密钥
    secretKey: string;
    // 访问 Token 有效时长：单位秒
    accessTTL: number;
    // 刷新 Token 有效时长：单位秒
    refreshTTL: number;
}

/**
 * API 防重放时间窗口, 单位秒
 */
export interface ReplayTimeWin {
    // 过去
    pastWin: number;
    // 未来
    futureWin: number;
}

/**
 * 设备默认激活有效时长
 */
export interface DeviceActiveExpired {
    unit: 'year' | 'day',
    value: number
}

/**
 * 设备移机记录
 */
export interface DeviceMoveExpired {
    unit: 'day',
    // >= min 保存记录
    min: number, 
    // > max 非管理员禁止移机
    max: number
}

/**
 * Cludflare Turn Api配置
 */
export interface CloudFlare {
    enable: boolean;
    appId: string;
    secretKey: string;
    ttl: number;
    ttlThreshold: number;
    blackList: string[],
    timeout: number;
}



