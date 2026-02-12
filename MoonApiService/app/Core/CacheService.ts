import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { Redis, RedisOptions } from 'ioredis'
import { isEmpty, isNumber, values } from 'lodash'

export interface CacheOptions extends RedisOptions {
    prefix?: string
}

const CACHE_SERVICE_REDIS_CLIENT = Symbol('CacheService.client')

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class CacheService extends BaseService {
    
    private [CACHE_SERVICE_REDIS_CLIENT]?: Redis

    /**
     * 配置选项
     */
    private get options(): CacheOptions {
        return this.config.cache ?? {
            prefix: '',
            host: '127.0.0.1',
            port: 6379,
            db: 0
        }
    }


    /**
     * Redis 连接客户端
     */
    private get client(): Redis {
        if (!this[CACHE_SERVICE_REDIS_CLIENT]) {
            const client = new Redis(this.options)

            client.once('ready', () => {
                this.logger.info(`[CacheService] ready!`)
            })
            
            client.once('connect', () => {
                this.logger.info(`[CacheService] redis client connect success!`)
            })

            const handlerError = (err: Error) => {
                client.removeAllListeners()
                client.disconnect()
                this[CACHE_SERVICE_REDIS_CLIENT] = undefined
                this.logger.error(`[CacheService] %s`, err)
            }
            client.on('error', handlerError)

            this[CACHE_SERVICE_REDIS_CLIENT] = client
        }
        return this[CACHE_SERVICE_REDIS_CLIENT]
    }

    /**
     * 生成主键
     * @param key 主键
     * @returns 
     */
    private getKey(key: string): string {
        if (isEmpty(key)) {
            this.throw(`cache key cannot be empty.`)
        }
        const { prefix } = this.options
        if (!prefix) {
            return key.toLocaleLowerCase()
        } else {
            return (prefix + ':' + key).toLocaleLowerCase()
        }
    }
    
    /**
     * 获取缓存值
     * @param key 主键
     */
    async get(key: string) {
        key = this.getKey(key)
        const value = await this.client.get(key)
        if (!value) return null
        try {
            return JSON.parse(value)
        } catch(err: any) {
            this.logger.error(`[CacheService] JSON parse failed.`, err)
            return null
        }
    }

    /**
     * 设置缓存值
     * @param key 主键
     * @param value 值
     */
    async set(key: string, value: unknown, ttl?: number) {
        key = this.getKey(key)
        const paylaod = JSON.stringify(value)
        let result: string
        if (isNumber(ttl) && Number.isFinite(ttl) && ttl > 0) {
            result = await this.client.set(key, paylaod, 'EX', ttl)
        } else {
            result = await this.client.set(key, paylaod)
        }
        return result == 'OK'
    }

    /**
     * 缓存是否存在
     * @param key 主键
     */
    async has(key: string) {
        key = this.getKey(key)
        const count = await this.client.exists(key)
        return count > 0
    }

    /**
     * 获取剩余时长
     * @param key 主键
     */
    async ttl(key: string) {
        key = this.getKey(key)
        const ttl = await this.client.ttl(key)
        if (ttl === -2) return 0
        return ttl
    }

    /**
     * 删除缓存
     * @param key 主键
     */
    async del(key: string) {
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
    async increment(key: string, value: number, ttl?: number) {
        key = this.getKey(key)
        try {
            const result = await this.client.incrby(key, value);
            if (result === value && ttl && ttl > 0) {
                await this.client.expire(key, ttl);
            }
            return result
        } catch(error: any) {
            this.throw(`[CacheService] increment value must be a positive integer.`, error)
        }
    }

    /**
     * 尝试加锁（原子操作）
     * @param key 主键
     * @param ttl 过期时间(秒)
     */
    async acquireLock(key: string, ttl: number) {
        key = this.getKey(key)
        const result = await this.client.set(key, '1', "EX", ttl, 'NX')
        return result === 'OK'
    }

}