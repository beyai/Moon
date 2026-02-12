import 'egg';
import { Redis, RedisOptions } from "ioredis";

interface ConfigOptions extends RedisOptions {
    prefix?: string;
}

interface RedisCacheConfig {
    default?: object;
    app?: boolean;
    agent?: boolean;
    client?: ConfigOptions;
    clients?: Record<string, ConfigOptions>;
}

interface RedisCache {
    /**
     * 设置hash缓存
     * @param {String} name 缓存名称
     * @param {Object} data Hash列表
     * @param {Integer} [ttl] 过期时间(秒)，默认不过期
     */
    setMap(name: string, data: any, ttl: integer): Primise<T>;

    /**
     * 获取hash缓存
     * @param {String} name 缓存名称
     */
    getMap(name: string): Primise<T>;

    /**
     * 删除 hash 缓存
     * @param {String} name 缓存名称
     */
    delMap(name: string): Primise<T>;

    /**
     * hash缓存中是否存在key
     * @param {String} name 缓存名称
     * @param {String} key Hash列表主键key
     */
    mapHasKey(name: string, key: string): Primise<T>;

    /**
     * 获取hash缓存中的key的值
     * @param {String} name 缓存名称
     * @param {String} key Hash列表主键key
     */
    getMapKey(name: string, key: string): Primise<T>;

    /**
     * 删除hash缓存中的key
     * @param {String} name 缓存名称
     * @param {String|Array} key Hash列表主键key
     */
    delMapKey(name: string, key: string|string[]): Primise<T>;

    /**
     * 设置 key->value 缓存
     * @param {String} key 缓存主键名
     * @param {any} data 数据
     * @param {Integer} [ttl=600] 过期时间(秒)，默认=600(秒)
     */
    set(key: string, data: any, ttl: integer): Primise<T>;
    
    /**
     * 获取 key->value 缓存
     * @param {String} key 缓存主键名
     */
    get(key: string): Primise<T>;

    /**
     * 是否存在 key->value 缓存
     * @param {String} key 缓存主键名
     */
    has(key: string): Primise<T>;

    /**
     * 删除 key->value 缓存
     * @param {String} key 缓存主键名
     */
    del(key: string): Primise<T>;

    /**
     * 设置过期时间
     * @param {String} key 
     * @param {Integer} [ttl=0] 过期时间(秒)：默认立即过期，0=立即过期，-1=永不过期
     */
    ttl(key: string, ttl: integer): Primise<T>;

    /**
     * 获取过期剩余时长
     */
    getTTL(key: string): Promise<number>

    /**
     * 累加
     * @param {String} key 缓存主键名
     * @param {any} data 数据
     * @param {Integer} [ttl=-1] 过期时间(秒)
     */
    increment(key: string, value: number, ttl?: number): Promise<T>
}

declare module 'egg' {

    interface Application {
        cache: Singleton<RedisCache>;
    }

    interface EggAppConfig {
        cache: RedisCacheConfig;
    }
    
}
