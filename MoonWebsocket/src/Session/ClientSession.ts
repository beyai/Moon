import { decode, encode } from "cbor";
import { createCipheriv, createDecipheriv, createECDH, hkdf, randomBytes } from "node:crypto";
import { createError } from "../utils";
import type Application from "../application";
import type { SessionBody } from "./SessionBody";

function createHKDF(secret: Buffer, salt: Buffer, info: string = '', keylen: number = 32 ) {
    return new Promise<Buffer>((resolve, reject) => {
        hkdf('sha256', secret, salt, info, keylen, (err, key) => {
            if (err) {
                reject(err)
            } else {
                const buffer = key  as unknown as Buffer
                resolve(buffer)
            }
        })
    })
}

export class ClientSession {

    private readonly deviceUID: string;
    private secretKey?: Buffer

    // 防重放时间窗口
    private get timeWin() {
        return {
            pastWin: 5 * 60,
            futureWin: 60
        }
    }

    constructor(deviceUID: string) {
        this.deviceUID = deviceUID
    }

     /**
     * 生成随机盐
     * @returns 
     */
    private generateRandomNonce(): Buffer {
        return randomBytes(12)
    }

    /**
     * 生成共享密钥
     * @param salt 
     */
    private async getSharedKey(salt: Buffer) {
        if (!this.secretKey) {
            throw new createError(402, '密钥不存在')
        }
        if (!Buffer.isBuffer(salt)) {
            throw new createError(402, '随机字符串格式不正确')
        }
        return createHKDF(this.secretKey, salt)
    }

    // 加载
    async load(app: Application) {
        const data = await app.cache.get(`sess:${ this.deviceUID }`)
        if (!data) {
            throw new createError(402, '密钥已过期')
        }
        try {
            const buffer = Buffer.from(data, 'base64')
            const { privateKey, publicKey } = decode(buffer)
            const ecdh = createECDH('prime256v1');
            ecdh.setPrivateKey(privateKey);
            this.secretKey  = ecdh.computeSecret( publicKey );
        } catch(error) {
            throw new createError(402, '密钥解析失败')
        }
    }

    // 编码
    async encode(data: any) {
        const nonce             = this.generateRandomNonce()
        const key               = await this.getSharedKey(nonce)
        const bodyData          = encode(data)
        const cipher            = createCipheriv('aes-256-gcm', key, nonce )
        const encrypted         = Buffer.concat([ cipher.update(bodyData), cipher.final() ]);
        const tag               = cipher.getAuthTag()
        return {
            deviceUID   : this.deviceUID,
            tag         : tag,
            nonce       : nonce,
            body        : encrypted,
        }
    }

    // 解码
    async decode(data: SessionBody) : Promise<Record<string, any>> {
        const { nonce, tag, body } = data
        
        for (const [_, val] of Object.entries({ nonce, tag, body })) {
            if (val === undefined) {
                throw new createError(400, `消息格式错误`)
            }
            if (!Buffer.isBuffer(val)) {
                throw new createError(400, `消息格式错误`)
            }
        }

        let decrypted: any
        try {
            const key = await this.getSharedKey(nonce)
            const decipher = createDecipheriv('aes-256-gcm', key, nonce);
            decipher.setAuthTag(tag)
            decrypted = Buffer.concat([ decipher.update(body), decipher.final() ]);
        } catch(error) {
            throw new createError(402, '会话已过期')
        }

        try {
            return decode(decrypted)
        } catch {
            throw new createError(400, '消息解码失败')
        }
    }

    // 验证消息是否合法
    verify(data: Record<string, any>) {
         const { timestamp } = data;
        if (typeof timestamp !== 'number') {
            throw new createError(400, '请求无效')
        }
        const now = Math.round(Date.now() / 1000)
        const { pastWin, futureWin } = this.timeWin
        if (now - timestamp > pastWin) {
            throw new createError(400, '请求已过期')
        }
        if (timestamp - now > futureWin) {
            throw new createError(400, '时间异常')
        }
    }


}