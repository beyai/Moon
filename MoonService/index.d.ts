import type { AppBundleConfig, DesktopClient, CacheOptions, GeoIP, TokenConfig, ReplayTimeWin, DeviceActiveExpired, DeviceMoveExpired, CloudFlare }  from './app/InterFace/Config'

declare module 'egg' {
    interface EggAppConfig {
        // 账号黑名单
        accountBlackList: string[];
        // App客户端配置
        appBundle: AppBundleConfig;
        // 桌面客户端
        desktopClient: DesktopClient;
        // 缓存
        cache: CacheOptions;
        // IP 归属地查询
        geoip: GeoIP;
        // TOKEN 配置
        token: TokenConfig;
        // 防重放时间窗口, 单位秒
        replayTimeWin: ReplayTimeWin;
        // 设备激活默认时长
        activeExpired: DeviceActiveExpired;
        // 移机过期时长
        moveExpired: DeviceMoveExpired;
        // Cludflare Turn Api配置
        cloudflare: CloudFlare;
        // 设置文件路径
        settingFile: string;
        // 设备未激活每最小可累计使用时长
        unActiveMaxUseSec: number;
    }
}