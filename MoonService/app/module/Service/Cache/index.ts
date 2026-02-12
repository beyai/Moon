import _ from 'lodash'
import { Redis } from "ioredis";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { CacheOptions } from "app/InterFace";

const CACHE_SERVICE_CLIENT = Symbol('CacheService.client')

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class CacheService extends AbstractService {

    private [CACHE_SERVICE_CLIENT]?: Redis

    /**
     * 配置选项
     */
    private get options(): CacheOptions {
        return this.config.cache ?? {
            prefix: '',
            host: '127.0.0.1',
            port: 6379,
            db: 0
        } as CacheOptions
    }

    /**
     * 客户端
     */
    private get client(): Redis {
        if (!this[CACHE_SERVICE_CLIENT]) {
            this[CACHE_SERVICE_CLIENT] = this.createClient()
        }
        return this[CACHE_SERVICE_CLIENT]
    }

    /**
     * 创建客户端
     */
    private createClient(): Redis {
        const client = new Redis(this.options)
        client.once('ready', () => {
            this.logger.info('[CacheService] client ready.');
        })
        client.on('connect', () => {
            this.logger.info(`[CacheService] client connect success.`)
        })
        client.on('error', err => {
            this.logger.error('[CacheService] client error: %s', err);
        })
        return client
    }

    /**
     * 获取缓存主键
     * @param key 主键
     */
    private getKey(key: string): string {
        const { prefix } = this.options;
        return (prefix ? `${ prefix }:${ key }` : key).toLocaleLowerCase()
    }

    /**
     * 获取
     * @param key 主键
     */
    async get<T = any>(key: string): Promise<T | null> {
        key = this.getKey(key)
        const value = await this.client.get(key)
        if (!value) return null
        try {
            return JSON.parse(value)
        } catch(err) {
            this.logger.warn('[CacheService] JSON parse failed: %s', key);
            return null
        }
    }

    /**
     * 设置
     * @param key 主键
     * @param value 值
     * @param ttl 过期时间(秒)
     */
    async set<T = any>(key: string, value: T, ttl?: number): Promise<T> {
        if (_.isEmpty(key)) {
            throw new TypeError(`set: "key" must be a string.`)
        }
        key = this.getKey(key)
        const payload = JSON.stringify(value);
        if (typeof ttl === 'number' && ttl > 0) {
            await this.client.set(key, payload, "EX", ttl)
        } else {
            await this.client.set(key, payload)
        }
        return value
    }

    /**
     * 是否存在
     * @param key 主键
     */
    async has(key: string): Promise<boolean> {
        if (_.isEmpty(key)) {
            throw new TypeError(`has: "key" must be a string.`)
        }
        key = this.getKey(key)
        const count = await this.client.exists(key)
        return count > 0
    }

    /**
     * 获取过期剩余时长
     * @param key 主键
     */
    async ttl(key: string): Promise<number>{
        if (_.isEmpty(key)) {
            throw new TypeError(`ttl: "key" must be a string.`)
        }
        key = this.getKey(key)
        const ttl = await this.client.ttl(key)
        if (ttl == -2 ) return 0
        return ttl
    }

    /**
     * 删除
     * @param key 主键
     */
    async del(key: string): Promise<boolean> {
        if (_.isEmpty(key)) {
            throw new TypeError(`del: "key" must be a string.`)
        }
        key = this.getKey(key)
        const count = await this.client.del(key)
        return count > 0
    }

    /**
     * 累加
     * @param key 主键
     * @param value 值
     * @param ttl 过期时间(秒)
     * @returns 累加值
     */
    async increment(key: string, value: number, ttl?: number): Promise<number> {
        if (_.isEmpty(key)) {
            throw new TypeError(`increment: "key" must be a string.`)
        }
        key = this.getKey(key)
        try {
            const result = await this.client.incrby(key, value);
            if (result === value && ttl && ttl > 0) {
                await this.client.expire(key, ttl);
            }
            return result
        } catch(error) {
            throw new Error(`The value of "${ key }" is not an integer or exceeds the range.`)
        }
    }

    /**
     * 尝试加锁（原子操作）
     * @param key 主键
     * @param ttl 过期时间(秒)
     */
    async acquireLock(key: string, ttl: number): Promise<boolean> {
        if (_.isEmpty(key)) {
            throw new TypeError(`acquireLock: "key" must be a string.`)
        }
        key = this.getKey(key)
        const result = await this.client.set(key, '1', "EX", ttl, 'NX')
        return result === 'OK'
    }
}


