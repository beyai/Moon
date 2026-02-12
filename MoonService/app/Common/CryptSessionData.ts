import {  createCipheriv, createDecipheriv, randomBytes } from "crypto"
import { encode, decode } from 'cbor'

export class CryptSessionData {

    static readonly algorithm = 'aes-256-gcm'

    /**
     * 密钥盐、加密随机字符 12bit
     * @returns 
     */
    static randomNoce(): Buffer {
        return randomBytes(12)
    }

    /**
     * 加密
     * @param data 明文数据
     * @param sharedKey 共享密钥
     * @returns 加密数据
     */
    static encrypt<T>(
        data: T,
        sharedKey: SharedKey
    ): CryptedData {
        const bodyData = encode(data)
        const cipher = createCipheriv(this.algorithm, sharedKey.key, sharedKey.nonce )
        const encrypted = Buffer.concat([ cipher.update(bodyData), cipher.final() ]);
        const tag = cipher.getAuthTag()
        return CreateCryptedData({
            tag: tag,
            nonce: sharedKey.nonce,
            body: encrypted,
        })
    }

    /**
     * 解密
     * @param crytpoData 加密数据
     * @param sharedKey 共享密钥
     * @returns 明文数据
     */
    static decrypt<T>(
        crytpoData: CryptedData,
        sharedKey: SharedKey
    ): T {
        try {
            const decipher = createDecipheriv(this.algorithm, sharedKey.key, crytpoData.nonce);
            decipher.setAuthTag(crytpoData.tag);
            const decrypted = Buffer.concat([ decipher.update(crytpoData.body), decipher.final() ]);
            return decode(decrypted)
        } catch {
            throw new Error('数据解密失败')
        }
    }
}

/**
 * 共享密钥
 */
export interface SharedKey {
    // 共享密钥
    key: Buffer,
    // 共享密钥盐，AES-GCM随机值
    nonce: Buffer
}

/**
 * 加密的数据信息
 */
export interface CryptedData {
    tag: Buffer;
    body: Buffer;
    nonce: Buffer;
    deviceUID?: string;
    payload?: Buffer;

    toJSON(): Record<string, any>;
    getPayload(): Record<string, any> | null
    setPayload(data: Record<string, any>): void
}

export namespace CryptedData {

    export function fromJSON(data: Record<string, any>): CryptedData {
        const encrypted = CreateCryptedData({
            nonce   : Buffer.from(data.nonce, 'base64'),
            tag     : Buffer.from(data.tag, 'base64'),
            body    : Buffer.from(data.body, 'base64')
        })
        if (data.deviceUID) {
            encrypted.deviceUID = data.deviceUID
        }
        if (data.payload) {
            encrypted.payload = Buffer.from(data.payload, 'base64')
        }
        return encrypted
    }

}

export function CreateCryptedData(
    data: {
        nonce: Buffer,
        tag: Buffer,
        body: Buffer,
    }
): CryptedData {
    return {
        ...data,

        // 获取负载数据
        getPayload(): Record<string, any> | null {
            return this.payload ? decode(this.payload) : null
        },

        // 设置负载数据
        setPayload(payload: Record<string, any>) {
            if (!payload) return
            this.payload = encode(payload)
        },

        // 转换成 JSON 格式 
        toJSON(): Record<string, any> {
            if (!this.deviceUID) {
                throw new Error('deviceUID is undefined.')
            }
            let jsonData = {
                deviceUID: this.deviceUID,
                nonce: this.nonce.toString('base64'),
                tag: this.tag.toString('base64'),
                body: this.body.toString('base64'),
            }

            if (this.payload) {
                jsonData['payload'] = this.payload.toString('base64')
            }
            return jsonData
        }
    }
}