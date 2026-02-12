/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
    /**
     * built-in config
     * @type {Egg.EggAppConfig}
     **/
    const config = exports = {};
   
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

    /** 
     * App 未激活设备每小时最大累计可用时长（秒)
     */
    config.unActiveMaxUseSec = 1500

    /** App最小版本 */
    config.appMinVersion = "2.0.9"

    /** Cloudflare Realtime */
    config.cloudflare = {
        enable: true,
        appId: "9dc1f91f193e52268958b259c93e4b6f",
        secretKey: "7c6f60fb5b9ceeb8baa7d8058ca586a82cb6d0db5a2c989c4e41396ff67da2a8",
        ttl:  86400,
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
     * attest App授权
     * @param {string} teamIdentifier - App团队ID
     * @param {string} bundleIdentifier - App包名
     * @param {boolean} allowDevelopmentEnvironment - 是否允许开发环境验证
     * @param {boolean} appStoreURL - App官方下载地址
     */
    config.attest = {
        teamIdentifier: '9NX3SQ5347',
        bundleIdentifier: 'com.fireeyecam.cam',
        allowDevelopmentEnvironment: false,
        appStoreURL: 'https://apps.apple.com/cn/app/%E6%B7%B7%E6%B2%8C%E4%B9%8B%E7%9C%BC/id6502680584',
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
            host: '127.0.0.1',
            port: 6379,
        }
    }

    /** 数据库配置 */
    config.sequelize = {
        dialect: "mysql",
        host: "127.0.0.1",
        port: 3306,
        database: "egg",
        username: "egg",
        password: "ycRkrYsGpmBtmPSz",
        timezone: '+08:00',
        logging: false,
    }

    return config

};
