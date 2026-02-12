import { EggAppConfig, EggAppInfo, PowerPartial } from "egg";
import { resolve } from "path";

export default function(appInfo: EggAppInfo) {
    
    const config = {
        
        // 应用唯一标识
        keys: `Dy8ImxLt65AjRYoXNg7COQazfTSbq0GB`,

        // 读取代理IP
        proxy: true,
        
        // 全局中间件
        middleware: ['errorHandler'],

        // 安全配置
        security: {
            csrf: false
        },

        // 日志
        logger: {
            level: 'WARN',
            consoleLevel: 'DEBUG'
        },

    } as PowerPartial<EggAppConfig>;
    
    // 系统配置文件
    config.settingFile = resolve(appInfo.baseDir, './setting/AppSetting.toml'),

    // IP 归属地数据库文件
    config.geoipDB = resolve(appInfo.baseDir, './config/GeoLite2-City.mmdb'),

    // 用户账号黑名单
    config.accountBlackList = [
        'admin', 'administrator', 'root', 'super', 'superadmin', 'superuser', 
        'guest', 'test', 'webmaster', 'master', 'system', '123456'
    ]

    // WebHook Api Key
    config.webHookApiKey = `5a8a1b2c-3d4e-4f5a-6b7c-8d9e0f1a2b3c`

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

    // API 防重放时间窗口, 单位秒
    config.replayTimeWin = {
        pastWin: 60,
        futureWin: 60
    }

    // App 包信息
    config.appBundle =  {
        teamIdentifier: 'CWBDA27TQ2',
        bundleIdentifier: 'com.chandre.moon',
        bundleName: 'Moon',
        appStoreURL: 'https://apps.apple.com/hk/app/%E6%B7%B7%E6%B2%8C%E4%B9%8B%E7%9C%BC/id6502680584',
        privateKey: Buffer.from('Uezb0c6K7vSqf4YAbroWsPvO5yWWiAnEpP+xf9iJbmQ=', 'base64'),
    }

    // 客户端 应用包配置
    config.clientBundle = {
        bundleIdentifier: 'com.pokervisionpro.app',
        bundleName: 'PokerVisionPro',
        version: '1.0.0',
        downloadURL: 'http://www.baidu.com',
        privateKey: Buffer.from('Gmx1Ixpgr/IY2dWaDmwHH2COBdVcFQ4rtu6HlCkMrHE=', 'base64')
    }

    // Token 配置
    config.token = {
        secretKey: '49213ed00b519ace3c8b43eee38583faa689372f625c714c3289ebc05ee9c014',
        accessTTL: 3600 * 24,
        refreshTTL: 3600 * 24 * 7,
    }

    // 未激活设备使用时长限制
    config.deviceUsageTimeLimit = 1500

    // Cludflare Turn Api配置
    config.cloudflare = {
        enable: true,
        appId: '9dc1f91f193e52268958b259c93e4b6f',
        secretKey: '7c6f60fb5b9ceeb8baa7d8058ca586a82cb6d0db5a2c989c4e41396ff67da2a8',
        ttl: 3600 * 8,
        threshold: 3600 * 4,
        regionBlackList: [ "CN" ],
        timeout: 15000
    }

    // Redis 缓存
    config.cache = {
        host: '192.168.5.219',
        port: 6379,
        password: 'webmaster',
        db: 0,
        prefix: '',
    }

    // ORM
    config.sequelize = {
        dialect: 'mysql',
        host: "192.168.5.219",
        port: 3306,
        database: "moon",
        username: "moon",
        password: "LcPzTZETx8n8PL6A",
        
        timezone: '+08:00',
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

        logging(...args: any[]) {
            const used = typeof args[1] === 'number' ? `(${args[1]}ms)` : '';
            console.info('\u001b[38;2;255;0;255m🚧 %s %s', used, args[0])
        },
    }

    return config
}