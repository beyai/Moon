import 'egg'

declare module 'egg' {

    interface EggAppConfig {
        /**
         * 系统设置文件路径
         * - 文件类型： TOML 
         * - setting.toml
         */
        settingFile: string,
        /**
         * IP归属地数据库路径
         * - 数据库类型：MMDB, 
         * - GeoLite2-City.mmdb
         */
        geoipDB: string;
        /**
         * 账号黑名单
         */
        accountBlackList: string[];

        /**
         * WebHook 验证
         */
        webHookApiKey: string;

        /**
         * 设备移机配置
         * @protected unit 单位
         * @protected min <= 不保存移机记录
         * @protected max > 禁止移机
         */
        moveExpired: {
            unit: 'day' | 'month' | 'year',
            min: number;
            max: number;
        };

        /**
         * 设备激活配置
         * @protected unit 单位
         * @protected value 值
         */
        activeExpired: {
            unit: 'day' | 'month' | 'year';
            value: number;
        }

        /**
         * 设备使用时长限制
         */
        deviceUsageTimeLimit: number

        /**
         * API 防重放时间窗口, 单位秒
         * @protected pastWin 过去时
         * @protected futureWin 未来时间
         */
        replayTimeWin: {
            pastWin: number;
            futureWin: number;
        };

        /**
         * App 应用包配置
         * @protected teamIdentifier 团队唯一标识
         * @protected bundleIdentifier 应用唯一标识
         * @protected bundleName 应用包名
         * @protected appStoreURL 应用商店下载地址
         * @protected privateKey 应用 Root 私钥
         */
        appBundle: {
            teamIdentifier: string;
            bundleIdentifier: string;
            bundleName: string;
            appStoreURL: string;
            privateKey: Buffer;
        };

        /**
         * 客户端应用包配置
         * @protected bundleIdentifier 应用唯一标识
         * @protected bundleName 应用包名
         * @protected privateKey 应用 Root 私钥
         * @protected version 版本号
         */
        clientBundle: {
            bundleIdentifier: string;
            bundleName: string;
            version: string;
            privateKey: Buffer;
            downloadURL: string;
        }

        /**
         * Token 配置
         * @protected secretKey 密钥, 64位 hex 字符
         * @protected accessTTL 访问 Token 过期时间，单位秒
         * @protected refreshTTL 刷新 Token 过期时间，单位秒
         */
        token: {
            secretKey: string;
            accessTTL: number;
            refreshTTL: number;
        },
        
        /**
         * Redis 缓存
         * @protected prefix: 主键前缀
         * @protected host: 主机 = 127.0.0.1
         * @protected port: 端口 = 3306
         * @protected db: 数据库索引 = 0
         * @protected password 密码
         */
        cache: {
            host: string;
            port: number;
            prefix?: string;
            db?: number
            password?: string;
        }

        /**
         * Cludflare Turn Api配置
         * @protected enable 是否开启
         * @protected appId 应用ID
         * @protected secretKey 应用密钥
         * @protected ttl 过期时间, 秒
         * @protected threshold 过期刷新阈值，秒
         * @protected regionBlackList 地区黑名单
         * @protected timeout 请求超时
         */
        cloudflare: {
            enable: boolean;
            appId: string;
            secretKey: string;
            ttl: number;
            threshold: number;
            regionBlackList: string[],
            timeout: number;
        }
    }


    interface Context {
        /**
         * 页码
         * - 默认值：1
         */
        readonly page: number;
        /**
         * 分页长度
         * - 默认值：10
         */
        readonly limit: number;
        /**
         * Token
         * - Headers['Token'] || Headers['Authorization']
         */
        readonly token?: string | null;
        /**
         * 过滤空值
         * - 去除对象中的: null, undefind, 空字符串，空对象，空数组，无效数值
         * @param obj 对象
         */
        filterEmpty(obj: Record<string, any>): Record<string, any>
        /**
         * 响应成功
         * @param data 数据
         * @param message 消息
         */
        success(data?: unknown, message?: string | Record<string, unknown>, options?: Record<string, unknown>): void
    }
}