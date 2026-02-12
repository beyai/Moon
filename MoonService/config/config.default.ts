import { AppBundleConfig } from 'app/InterFace';
import { EggAppConfig, EggAppInfo, PowerPartial } from 'egg';
import { RedisOptions } from 'ioredis';
import path from 'path';

export default (appInfo: EggAppInfo) => {
    
    const config = {} as PowerPartial<EggAppConfig>;

    config.keys = appInfo.name + '_1767292924126_1973';

    config.middleware = [
        'errorHandler'
    ];

    config.proxy = true

    config.security = {
        csrf: {
            enable: false
        },
    }

    config.logger = {
        level: "WARN",
        consoleLevel: 'DEBUG',
        // enableFastContextLogger: true,
    }

    // 设备未激活每最小可累计使用时长
    config.unActiveMaxUseSec = 1500

    // 设备移机配置
    config.moveExpired = {
        unit: 'day',
        min: 3,
        max: 30
    }

    // 设备激活配置
    config.activeExpired = {
        unit: 'year',
        value: 1,
    }

    // 账号登录 JWT
    config.token = {
        secretKey: 'K9mP2vX8qL7nR4wE6tY3uI0oA5sD1fG9',
        accessTTL: 3600 * 24,
        refreshTTL: 3600 * 24 * 7,
    }

    // IP 归属地查询数据库
    config.geoip = {
        db: path.resolve(appInfo.baseDir, __dirname, './GeoLite2-City.mmdb')
    }

    // 账号黑名单
    config.accountBlackList = [
        'admin', 'administrator', 'root', 'super', 'superadmin', 'superuser', 
        'guest', 'test', 'webmaster', 'master', 'system', '123456'
    ]

    // 设置文件
    config.settingFile = path.resolve(appInfo.baseDir, './setting.toml')

    // 缓存
    config.cache = {
        prefix: '',
        host: '192.168.5.219',
        port: 6379,
        db: 3,
    }

    /** API防重放 */
    config.replayTimeWin = {
        pastWin: 5 * 60,
        futureWin: 60
    }

    // App 客户端配置
    config.appBundle = {
        teamIdentifier: 'CWBDA27TQ2',
        bundleIdentifier: 'com.chandre.moon',
        bundleName: 'Moon',
        appStoreURL: 'https://apps.apple.com/hk/app/%E6%B7%B7%E6%B2%8C%E4%B9%8B%E7%9C%BC/id6502680584',
        privateKey: Buffer.from('Uezb0c6K7vSqf4YAbroWsPvO5yWWiAnEpP+xf9iJbmQ=', 'base64')
    }

    // PC 客户端配置
    config.desktopClient = {
        bundleName: 'PokerVisionPro',
        bundleIdentifier: 'com.pokervisionpro.app',
        version: '1.0.0',
        privateKey: Buffer.from('Gmx1Ixpgr/IY2dWaDmwHH2COBdVcFQ4rtu6HlCkMrHE=', 'base64')
    }

    // Cludflare Turn Api配置
    config.cloudflare = {
        enable: true,
        appId: '9dc1f91f193e52268958b259c93e4b6f',
        secretKey: '7c6f60fb5b9ceeb8baa7d8058ca586a82cb6d0db5a2c989c4e41396ff67da2a8',
        ttl: 3600 * 8,
        ttlThreshold: 3600 * 4,
        blackList: [ "CN" ],
        timeout: 15000
    }

    // ORM 数据库
    config.sequelize = {
        dialect: 'mysql',
        host: "192.168.5.219",
        port: 3306,
        database: "moon",
        username: "moon",
        password: "LcPzTZETx8n8PL6A",
        
        timezone: '+08:00',

        logging(...args) {
            const used = typeof args[1] === 'number' ? `(${args[1]}ms)` : '';
            console.info('\u001b[38;2;255;0;255m🚧 %s %s', used, args[0])
        },
            
        pool: {
            max: 20
        },

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
        },
        options: {

        }
    }

    return config
};
