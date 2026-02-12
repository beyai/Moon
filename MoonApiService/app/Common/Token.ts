import dayjs from "dayjs";
import { decode, encode } from "cbor";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const AES_ALGORITHM = 'aes-256-gcm'
const AES_256_KEY_LENGTH = 32
const IV_LENGTH = 12
const TAG_LENGTH = 16


export interface TokenOptions {
    secretKey: string;
    accessTTL: number;
    refreshTTL: number;
}

export class Token {

    private options: TokenOptions

    constructor(options: TokenOptions) {
        this.options = options
    }

    /**
     * 生成
     */
    generate<T>(payload:T) {
        const { secretKey, accessTTL } = this.options
        // 加密
        const key = Buffer.from(secretKey, 'hex')
        if (key.length != AES_256_KEY_LENGTH) {
            throw new Error(`The key length must be 32 bits.`)
        }
        // 添加过期时间
        const finalPayload = encode({
            ...payload,
            expiredAt: dayjs().add(accessTTL, 'seconds').toDate()
        })

        const iv = randomBytes(IV_LENGTH)
        const cipher = createCipheriv(AES_ALGORITHM, key, iv, {
            authTagLength: TAG_LENGTH
        })

        const encrypted = Buffer.concat([ cipher.update(finalPayload), cipher.final() ]);
        const tag = cipher.getAuthTag()

        return Buffer.concat([ iv, encrypted, tag ]).toString('base64')
    }

    /**
     * 验证
     */
    verify<T>(token: string): T {
        const { secretKey } = this.options
        const buf = Buffer.from(token, 'base64')

        // 解密
        const key = Buffer.from(secretKey, 'hex')
        if (key.length != AES_256_KEY_LENGTH) {
            throw new Error(`The key length must be 32 bits.`)
        }

        const iv            = buf.subarray(0, IV_LENGTH)
        const tag           = buf.subarray(-TAG_LENGTH)
        const payloadData   = buf.subarray(IV_LENGTH, -TAG_LENGTH)

        const decipher     = createDecipheriv('aes-256-gcm', key, iv, {
            authTagLength: TAG_LENGTH
        });
        decipher.setAuthTag(tag)

        const decrypted         = Buffer.concat([ decipher.update(payloadData), decipher.final() ]);
        const payload           = decode(decrypted)

        if (!payload.expiredAt || dayjs().isAfter(payload.expiredAt, 'seconds')) {
            throw new Error('令牌已过期或无效')
        }
        
        return payload
    }
}