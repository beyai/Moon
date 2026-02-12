'use strict';
const _         = require('lodash');
const Redis     = require('ioredis')
const assert    = require('assert');

class RedisCache {

    constructor(config, app) {
        this.app = app;
        this.config = config;
    }

    // 连接
    start() {
        let { app, config } = this;
        const Logger = app.logger;
        
        let client = null;
        assert(config.prefix, `[redisCache] prefix is required on config`);

        if (config.cluster === true) {
            assert(
                _.has(config, 'nodes') && _.isArray(config.nodes) && _.size(config.nodes) > 0,
                `[redisCache] cluster nodes configuration is required when use cluster redis`
            );
            
            config.nodes = config.nodes.map(node => {
                assert(node.host, node.port, `[redisCache] host, port are required on node config`);
                return Object.assign({ db: 0, password: '' }, node);
            })
            
            Logger.info('[redisCache] cluster connecting');
            client = new Redis.Cluster(config.nodes, config);
        } else {
            assert(config.host, config.port, `[redisCache] host, port are required on config`);
            config = Object.assign({ db: 0, password: '' }, config);
            Logger.info('[redisCache] cluster connecting redis://%s:%s/%s', config.host, config.port, config.db);
            client = new Redis(config);
        }

        client.on('connect', () => {
            Logger.info('[redisCache] client connect success');
        })
        client.on('error', err => {
            Logger.error('[redisCache] client error: %s', err);
        })

        // 等待连接成功
        return new Promise((resolve, reject) => {
            client.once('ready', () => {
                this.client = client;
                resolve();
            });
            client.once('error', reject)
        });
    }
    
    // 缓存前缀
    get prefix() {
        return this.config.prefix || 'cache'
    }

    // 处理触发
    throwError(message) {
        const err = new Error(`app.Cache.${ message }`);
        throw err;
    }

    /**
     * ======================= hash 类型缓存 =======================
     */

    /**
     * 获取缓存key
     * @param {String} key 缓存名称
     * @returns {String}
     */
    getCacheKey(key) {
        if (!this.prefix) return key;
        return `${ this.prefix }:${ key }`
    }

    /**
     * 设置hash缓存
     * @param {String} name 缓存名称
     * @param {Object} data Hash列表
     * @param {Integer} [ttl] 过期时间(秒)，默认不过期
     */
    async setMap(name, data, ttl = -1) {
        if (_.isEmpty(name)) {
            this.throwError(`setMap: "name" must be a string.`)
        }
        if (!_.isObject(data)) {
            this.throwError(`setMap: "data" must be a object.`)
        }

        // 转转数据
        const obj = {};
        for (const [key, value] of Object.entries(data)) {
            obj[key]    = _.isObject(value) ? JSON.stringify(value) : value;
        }
        const cacheKey = this.getCacheKey(name);
        await this.client.hset(cacheKey, obj);
        // 过期时间
        if (ttl > -1)  {
            await this.client.expire(cacheKey, ttl);
        }
        return data
    }

    /**
     * 获取hash缓存中列表
     * @param {String} name 缓存名称
     */
    async getMap(name) {
        if (_.isEmpty(name)) {
            this.throwError(`getMap: "name" must be a string.`);
        }
        const cacheKey = this.getCacheKey(name);
        let result = await this.client.hgetall(cacheKey);
        if (!result) return null;
        // 还原数据
        for (const k in result) {
            let item = result[k];
            try {
                result[k] = JSON.parse(item);
            } catch (err) {
                result[k] = item;
            }
        }
        return result
    }

    /**
     * 删除hash
     * @param {String} name 缓存名称
     */
    async delMap(name) {
        if (_.isEmpty(name)) {
            this.throwError(`delMap: "name" must be a string.`);
        }
        const cacheKey = this.getCacheKey(name);
        return await this.client.del(cacheKey);
    }

    /**
     * hash缓存中是否存在key
     * @param {String} name 缓存名称
     * @param {String} key Hash列表主键key
     */
    async mapHasKey(name, key) {
        if (_.isEmpty(name) || _.isEmpty(String(key))) {
            this.throwError(`mapHasKey: "name" and "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(name);
        const result = await this.client.hexists(cacheKey, key);
        return !!result;
    }

    /**
     * 获取hash缓存中的key的值
     * @param {String} name 缓存名称
     * @param {String} key Hash列表主键key
     */
    async getMapKey(name, key) {
        if (_.isEmpty(name) || _.isEmpty(String(key))) {
            this.throwError(`getMapKey: "name" and "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(name);
        const result = await this.client.hget(cacheKey, key);
        if (!result) return null;
        try {
            return JSON.parse(result);
        } catch (err) {
            return result;
        }
    }

    /**
     * 删除hash缓存中的key
     * @param {String} name 缓存名称
     * @param {String|Array} key Hash列表主键key
     */
    async delMapKey(name, key) {
        if ( _.isEmpty(name) || (_.isArray(key) && _.isEmpty(key)) || _.isEmpty(String(key)) ) {
            this.throwError(`delMapKey: "name" and "key" must be a string or array.`);
        }
        const cacheKey = this.getCacheKey(name);
        return await this.client.hdel(cacheKey, key);
    }

    /**
     * ======================= key->value 类型缓存 =======================
     */

    /**
     * 设置 key->value 缓存
     * @param {String} key 缓存主键名
     * @param {any} data 数据
     * @param {Integer} [ttl=-1] 过期时间(秒)，默认=-1(秒)
     */
    async set(key, data, ttl = -1) {
        if (_.isEmpty(key)) {
            this.throwError(`set: "key" must be a string.`);
        }
        if (_.isNaN(parseInt(ttl))) {
            this.throwError(`set: "ttl" must be a integer.`);
        }

        const cacheKey = this.getCacheKey(key);
        let cacheData = null;
        try {
            cacheData = JSON.stringify(data);
        } catch (err) {
            cacheData = data;
        }
        
        if (ttl > 0)  {
            await this.client.set(cacheKey, cacheData, "EX", ttl);
        } else {
            await this.client.set(cacheKey, cacheData);
        }

        return data;
    }

    /**
     * 获取 key->value 缓存
     * @param {String} key 缓存主键名
     */
    async get(key) {
        if (_.isEmpty(key)) {
            this.throwError(`get: "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(key);
        let cacheData = await this.client.get(cacheKey);
        try {
            return JSON.parse(cacheData);
        } catch (err) {
            return cacheData;
        }
    }

    /**
     * 是否存在 key->value 缓存
     * @param {String} key 缓存主键名
     */
    async has( key) {
        if (_.isEmpty(key)) {
            this.throwError(`has: "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(key);
        return await this.client.exists(cacheKey)
    }

    /**
     * 删除 key->value 缓存
     * @param {String} key 
     */
    async del(key) {
        if (_.isEmpty(key)) {
            this.throwError(`del: "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(key);
        const keys = await this.client.keys(cacheKey);
        if (keys.length > 0) {
            return await this.client.del(keys);
        } else {
            return 0
        }
    }

    /**
     * 设置过期时间
     * @param {String} key 
     * @param {Integer} [ttl=0] 过期时间(秒)：默认立即过期，0=立即过期，-1=永不过期
     */
    async ttl(key, ttl = 0) {
        if (_.isEmpty(key)) {
            this.throwError(`ttl: "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(key);
        return await this.client.expire(cacheKey, ttl)
    }

    /**
     * 设置剩余时间
     * @param {String} key 
     */
    async getTTL(key) {
        if (_.isEmpty(key)) {
            this.throwError(`ttl: "key" must be a string.`);
        }
        const cacheKey = this.getCacheKey(key);
        return await this.client.ttl(cacheKey)
    }


    /**
     * 设置一个累加值，值不存在时添加，否则累加
     * @param {*} key 
     * @param {*} value 
     * @param {*} ttl 
     * @returns 
     */
    async increment(key, value, ttl = -1) {
        if (_.isEmpty(key)) {
            this.throwError(`incrby: "key" must be a string.`);
        }
        if (!_.isNumber(value)) {
            this.throwError(`incrby: "value" must be a number.`);
        }
        const client = this.client;
        const cacheKey = this.getCacheKey(key);
        if (!await client.exists(cacheKey)) {
            if (ttl > 0) {
                await client.set(cacheKey, value, "EX", ttl);
            } else {
                await client.set(cacheKey, value)
            }
            return value
        } else {
            return await client.incrby(cacheKey, value);
        }
    }
}

function createRedisCache(config, app) {
    const cache = new RedisCache(Object.assign({
        host: '127.0.0.1',
        port: 6379,
        db: 0,
        prefix: 'cache',
        timeout: 10000,
    }, config), app)
    app.beforeStart(async ()=> {
        await cache.start();
    })
    return cache
}


module.exports = (app) => {
    app.addSingleton('cache', createRedisCache);
    // app.beforeStart( async () => {
    //     const cache = new RedisCache(app.config.redisCache || {
    //         host: '127.0.0.1',
    //         port: 6379,
    //         password: '',
    //         db: 0,
    //         prefix: 'cache',
    //         timeout: 10000,
    //     }, app);
    //     await cache.start();
    //     app.Cache = cache;
    // })
};
