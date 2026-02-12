import { createCipheriv, createDecipheriv, createHash } from "crypto"
import { AbstractService } from "app/Common"
import { AccessLevel, EggContext, Inject, SingletonProto } from "@eggjs/tegg"
import { CacheService } from "../Cache"
import { checkTrack } from "./Track"
import dayjs from "dayjs"


const EGG_APP_KEYS = Symbol('MouseTrackService.keys')

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class MouseTrackService extends AbstractService {
    @Inject()
    Cache: CacheService

    // key 过期时间
    private readonly ttl = 180

    // 应用密钥
    private [EGG_APP_KEYS]?: Buffer
    private get secretKey() {
        if (!this[EGG_APP_KEYS]) {
            const keys = this.config.keys
            const buf = createHash('sha256').update(keys).digest()
            this[EGG_APP_KEYS] = buf
        }
        return this[EGG_APP_KEYS]
    }

    /**
     * 数据加密
     * @param str 数据
     * @return 加密后的数据
     */
    private encrypt(str: string) {
        const cipher = createCipheriv('aes-256-ecb', this.secretKey, null);
        let enc = cipher.update(String(str), 'utf8', 'base64');
        enc += cipher.final('base64');
        return enc;
    }

    /**
     * 数据解密
     * @param str 加密后的数据
     */
    private decrypt(str: string) {
        const cipher = createDecipheriv('aes-256-ecb', this.secretKey, null);
        let dnc = cipher.update(String(str), 'base64', 'utf8');
        dnc += cipher.final('utf8');
        return dnc;
    }

    // 生成 key
    generateKey() {
        const exp = dayjs().add(this.ttl, 'second').valueOf()
        const key = this.encrypt( String(exp) )
        return {
            key,
            ttl: this.ttl
        }
    }

    // 操作验证
    checkTrack(ctx: EggContext, encryptedStr: string) {
        if (!encryptedStr) {
            ctx.throw(400, '操作验证失败')
        }
        return checkTrack(encryptedStr)
    }

    // 验证 key
    verify(ctx: EggContext, key: string) {
        try {
            if (!key || typeof key !== 'string') {
                throw new Error('验证失败')
            }
            const decrypted = this.decrypt(key)
            if (Number(decrypted) < Date.now()) {
                throw new Error('验证码已过期')
            }
            return true
        } catch(err) {
            ctx.throw(400, (err as Error).message)
        }
    }
    
}