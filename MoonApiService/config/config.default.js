const { access } = require("fs");
const { resolve } = require("path");

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};
    
    /** 应用密钥 */
    config.keys = '5a8a1b2c-3d4e-4f5a-6b7c-8d9e0f1a2b3c';

    /** 前置代理 */
    config.proxy = true;

    config.security = {
        csrf: {
            enable: false,
        },
    };

    /** 用户账号黑名单 */
    config.accountBlacklist = [
        'admin', 'administrator', 'root', 'super', 'superadmin', 'superuser', 
        'guest', 'test', 'webmaster', 'master', 'system'
    ]

    /** 全局中间件 */
    config.middleware = [
        'throwApiError',
    ];

    /** 日志 */
    config.logger = {
        dir: resolve(appInfo.baseDir, 'logs'),
        consoleLevel: "DEBUG"
    }

    /** 日志分割 */
    config.logrotator = {
        maxDays: 3
    }
    
    
    /** 验证器 */
    config.validator = {
        validateRoot: true,
        convert: true,
        widelyUndefined: false
    }

    /**
     * 激活过期时长
     * @param {string} uint - 时间计算单位, 可选值: year, month, day
     * @param {number} value - 时长
     */
    config.activeExpired = {
        uint: 'year',
        value: 1,
    }

    /**
     * 设备可移机时间范围
     * @param {number} min - 小于当前值时不保存记录
     * @param {number} max - 小于等于当前值时允许移机
     * @param {string} uint - 时间计算单位, 可选值: year, month, day
     */
    config.moveExpired = {
        min: 3,
        max: 30,
        uint: 'day',
    }

    /** Cloudflare Realtime */
    config.cloudflare = {
        // 是否开启
        enable: true,
        // 应用 ID
        appId: "9dc1f91f193e52268958b259c93e4b6f",
        // 应用密钥
        secretKey: "7c6f60fb5b9ceeb8baa7d8058ca586a82cb6d0db5a2c989c4e41396ff67da2a8",
        // 有效期, 单位(秒)
        ttl:  86400,
        // 黑名单
        blackList: [ 'CN', 'HK', 'TW', 'MO' ]
    }

    /**
     * Token 配置
     * @param {string} secretKey - 密钥
     * @param {number} accessTTL - 访问令牌有效期, 单位秒
     * @param {number} refreshTTL - 刷新令牌有效期, 单位秒
     */
    config.token = {
        secretKey: 'K9mP2vX8qL7nR4wE6tY3uI0oA5sD1fG9',
        accessTTL: 3600 * 24,
        refreshTTL: 3600 * 24 * 30,
    };

    /**
     * ECDH 密钥对
     */
    config.ecdhCert = {
        privateKey  : "Uezb0c6K7vSqf4YAbroWsPvO5yWWiAnEpP+xf9iJbmQ=",
        publicKey   : "BKd/ymBZkiKJtWTETIvWzqOsURqDWWkFx5qqcULW+7GcgX0vRSbpaTK4I8cbDthzN0oTmlgV6yV1bY8NL8OLuT0="
    }

    /** 
     * App 未激活设备每小时最大累计可用时长（秒)
     */
    config.unActiveMaxUseSec = 1500

    /** App最小版本 */
    config.appMinVersion = "2.0.9"

    /**
     * attest App授权
     * @param {string} teamIdentifier - App团队ID
     * @param {string} bundleIdentifier - App包名
     * @param {boolean} allowDevelopmentEnvironment - 是否允许开发环境验证
     */
    config.attest = {
        teamIdentifier: 'CWBDA27TQ2',
        bundleIdentifier: 'com.chandre.moon',
        bundleName: '',
        allowDevelopmentEnvironment: true,
        appStoreURL: 'https://apps.apple.com/hk/app/%E6%B7%B7%E6%B2%8C%E4%B9%8B%E7%9C%BC/id6502680584',
    }

    config.appBundle = {
        teamIdentifier: 'CWBDA27TQ2',
        bundleIdentifier: 'com.chandre.moon',
        bundleName: 'Moon',
        allowDevelopmentEnvironment: true,
        appStoreURL: 'https://apps.apple.com/hk/app/%E6%B7%B7%E6%B2%8C%E4%B9%8B%E7%9C%BC/id6502680584',
    }

    /**
     * 缓存配置
     */
    config.cache = {
        client: {
            prefix: 'hd',
            db: 1,
        },
        default: {
            host: '192.168.5.219',
            port: 6379,
            password: 'webmaster'
        }
    }

    /** 数据库配置 */
    config.sequelize = {
        dialect: "mysql",
        host: "192.168.5.219",
        port: 3306,
        database: "moon",
        username: "moon",
        password: "LcPzTZETx8n8PL6A",
        timezone: '+08:00',
        //logging: false,
        dialectOptions: {
            charset: 'utf8mb4',
            dateStrings: true,
            typeCast: true,
        },
        define: {
            underscored: false,
            timestamps: true,
            freezeTableName: false,
            
            defaultScope: {
                attributes: {
                    exclude: ['deletedAt']
                }
            }
        }
    }

    return config
};
