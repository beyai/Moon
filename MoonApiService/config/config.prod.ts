import { EggAppConfig, EggAppInfo, PowerPartial } from "egg";
import { resolve } from "path";

export default function(appInfo: EggAppInfo) {
    const config = {} as PowerPartial<EggAppConfig>;

    // Token 配置
    config.token = {
        secretKey: '49213ed00b519ace3c8b43eee38583faa689372f625c714c3289ebc05ee9c014',
        accessTTL: 3600 * 24,
        refreshTTL: 3600 * 24 * 7,
    }

    // Redis 缓存
    config.cache = {
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        password: '',
        prefix: '',
    }

    // ORM
    config.sequelize = {
        dialect: 'mysql',
        host: "127.0.0.1",
        port: 3306,
        database: "moon",
        username: "moon",
        password: "LcPzTZETx8n8PL6A",
        logging: null
    }

    return config
}