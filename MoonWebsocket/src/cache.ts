import { RedisClient } from "bun";
import type { RedisCacheOptions } from "./config";


class RedisCache {
    
    private client: RedisClient;
    /**
     * 获取缓存主键
     * @param key 主键
     */
    private getKey(key: string): string {
        const { prefix } = this.options;
        return (prefix ? `${ prefix }:${ key }` : key).toLocaleLowerCase()
    }

    private options: RedisCacheOptions
    
    constructor(options: RedisCacheOptions) {
        this.client = new RedisClient(options.uri ?? "redis://127.0.0.1:6379/0")
        this.options = options
    }

    /**
     * 连接
     * @param key 主键
     */
    async connect(): Promise<void> {
        await this.client.connect()
    }

    /**
     * 获取
     * @param key 主键
     * @returns 
     */
    async get(key: string): Promise<string | null> {
        key = this.getKey(key)
        return this.client.get(key)
    }

    /**
     * 设置
     * @param key 主键
     * @param value 值
     * @param ttl 过期时间(秒)
     * @returns 
     */
    async set(key: string, value: string, ttl: number = -1): Promise<string> {
        key = this.getKey(key)
        if (typeof ttl == 'number' && ttl > 1) {
            await this.client.set(key, value, "EX", ttl)
        } else {
            await this.client.set(key, value)
        }
        return value
    }

    /**
     * 是否存在
     * @param key 主键
     */
    async has(key: string): Promise<boolean> {
        key = this.getKey(key)
        return this.client.exists(key)
    }

    /** 获取过期剩余时长 */
    async ttl(key: string): Promise<number>{
        key = this.getKey(key)
        return this.client.ttl(key)
    }

    /**
     * 删除
     * @param key 主键
     * @returns 
     */
    async del(key: string): Promise<number> {
        key = this.getKey(key)
        return this.client.del(key)
    }

    /**
     * 累加
     * @param key 主键
     * @param value 值
     * @param ttl 过期时间(秒)
     * @returns 累加值
     */
    async increment(key: string, value: number, ttl: number = -1): Promise<number> {
        key = this.getKey(key)
        if (typeof value != 'number') {
            throw new Error(`"value" must be a number.`)
        }
        if (!await this.client.exists(key)) {
            if (typeof ttl == 'number' && ttl > 1) {
                // @ts-ignore
                await this.client.set(key, value, "EX", ttl)
            } else {
                // @ts-ignore
                await this.client.set(key, value)
            }
            return value
        }
        
        return this.client.incrby(key, value);
    }

}

export default RedisCache