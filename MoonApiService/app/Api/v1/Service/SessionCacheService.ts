import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { CacheService } from "app/Core";
import { decode, encode } from "cbor";
import { randomBytes } from "crypto";
import { isBuffer, isEmpty } from "lodash";

type SessioCacheData = {
    privateKey: Buffer;
    publicKey: Buffer;
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class SessionCacheService extends BaseService {

    @Inject()
    private readonly cache: CacheService

    // 挑战因子过期时间（60秒）
    private readonly challengeTTL = 60

    // 会话过期时间(6小时)
    private readonly sessionTTL = 3600 * 6

    // 防重放配置
    private get replayTimeWin() {
        return this.config.replayTimeWin ?? {
            pastWin: 30,
            futureWin: 30
        }
    }

    /**
     * 获取时间戳
     */
    getTimestamp() {
        return Math.ceil(Date.now() / 1000)
    }

    /**
     * 验证时间戳
     */
    verifyTimestmap(timestamp: number) {
        if (!Number.isFinite(timestamp)) {
            this.throw(400, `无效的时间`)
        }
        const now = this.getTimestamp()
        const { pastWin, futureWin } = this.replayTimeWin
        if (now - timestamp > pastWin) {
            this.throw(400, `时间已过期`)
        }
        if (timestamp - now > futureWin) {
            this.throw(400, `时间异常`)
        }
    }

    /**
     * 生成挑战因子
     */
    async generateChallenge(): Promise<string> {
        const challenge = randomBytes(16).toString('hex')
        await this.cache.set(challenge, 1, this.challengeTTL)
        return challenge
    }

    /**
     * 验证挑战因子
     */
    async verifyChallenge(challenge: string) {
        if (!await this.cache.has(challenge)) {
            this.throw(400, '挑战因子不存在或已过期')
        }
        this.backgroundTask.run(async () => {
            await this.cache.del(challenge)
        })
    }

    /**
     * 设置会话数据
     */
    async set(deviceUID: string, data: SessioCacheData ) {
        if (isEmpty(deviceUID)) {
            this.throw(400, `缓存：设备唯一标识不能为空`)
        }
        if (isEmpty(data)) {
            this.throw(400, '缓存：会话数据不能为空')
        }
        if (!isBuffer(data.privateKey) || !isBuffer(data.publicKey)) {
            this.throw(400, '缓存：会话数据无效')
        }
        const base64 = encode(data).toString('base64')
        return await this.cache.set(`sess:${ deviceUID }`, base64, this.sessionTTL)
    }

    /**
     * 获取会话数据
     */
    async get(deviceUID: string): Promise<SessioCacheData> {
        if (isEmpty(deviceUID)) {
            this.throw(400, `缓存：设备唯一标识不能为空`)
        }
        const base64 = await this.cache.get(`sess:${ deviceUID }`)
        if (!base64) {
            this.throw(400, `缓存：数据已过期`)
        }
        return decode(Buffer.from(base64, 'base64'))
    }



}