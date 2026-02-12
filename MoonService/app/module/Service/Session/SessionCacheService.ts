import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { CacheService } from "../Cache";
import { randomBytes } from "crypto";
import { decode, encode } from "cbor";

interface SessionCacheData {
    privateKey: Buffer,
    publicKey: Buffer,
}

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class SessionCacheService extends AbstractService {
    @Inject()
    Cache: CacheService

    // 挑战因子过期时间（60秒）
    private readonly challengeTTL = 60
    // 会话过期时间(6小时)
    private readonly sessionTTL = 3600 * 6

    /**
     * 生成挑战因子
     */
    async generateChallenge(): Promise<string> {
        const challenge = randomBytes(16).toString('hex')
        await this.Cache.set(challenge, 1, this.challengeTTL)
        return challenge
    }

    /**
     * 验证挑战因子
     */
    async verifyChallenge(challenge: string): Promise<boolean> {
        let hasChallenge = await this.Cache.has(challenge)
        if (!hasChallenge) {
            throw new Error(`挑战因子不存在或已过期`)
        }
        await this.Cache.del(challenge)
        return true
    }

    /**
     * 缓存临时会话信息
     */
    async save(key: string, data: SessionCacheData ) {
        if (typeof key !== 'string') {
            throw new Error(`无效的会话缓存 key`)
        }
        if (!data) {
            throw new Error(`无效的会话缓存数据`)
        }
        if (!Buffer.isBuffer(data.privateKey) || !Buffer.isBuffer(data.publicKey)) {
            throw new Error(`会话缓存数据格式错误`)
        }
        const base64 = encode(data).toString('base64')
        await this.Cache.set(`sess:${ key }`, base64, this.sessionTTL)
    }


    /**
     * 加载临时会话信息
     */
    async load(key: string): Promise<SessionCacheData> {
        if (typeof key !== 'string') {
            throw new Error(`无效的会话缓存 key`)
        }
        const value = await this.Cache.get(`sess:${ key }`)
        if (!value) {
            throw new Error(`会话缓存不存在`)
        }
        return decode(Buffer.from(value, 'base64'))
    }
}