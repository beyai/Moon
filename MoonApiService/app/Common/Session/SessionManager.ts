import { decode, encode } from "cbor";
import { createCipheriv, createDecipheriv, createECDH, hkdf, randomBytes } from "node:crypto";
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

export class SessionManager {
    
    /**
     * 本地密钥
     */
    private localKey = createECDH('prime256v1')

    /**
     * 远端密钥
     */
    private remoteKey?: Uint8Array

     /**
     * 生成随机盐
     * @returns 
     */
    private generateRandomNonce(): Buffer {
        return randomBytes(12)
    }

    /**
     * 生成共享密钥
     * @param salt 加盐
     */
    private async getSharedKey(salt: Buffer) {
        const { localKey, remoteKey } = this;
        if (!remoteKey) {
            throw new Error(`The remote key does not exist.`)
        }
        const secret = localKey.computeSecret(remoteKey)
        return await createHKDF(secret, salt)
    }

    /**
     * 生成本地私钥
     */
    generateLocalKey() {
        this.localKey.generateKeys()
    }

    /**
     * 导出本地私钥
     */
    exportLocalPrivateKey(): Buffer {
        return this.localKey.getPrivateKey()
    }

    /**
     * 导出本地公钥
     */
    exportLocalPublicKey(): Buffer {
        return this.localKey.getPublicKey(null, 'uncompressed')
    }

    /**
     * 导入本地私钥
     * @param privateKey 本地私钥
     */
    importLocalKey(privateKey: Buffer) {
        this.localKey.setPrivateKey(privateKey)
    }

    /**
     * 导入远端公钥
     * @param publicKey 远端公钥
     */
    importRemoteKey(publicKey: Buffer) {
        this.remoteKey = publicKey
    }

    /**
     * 加密
     * @param data 待加密数据
     */
    async encode(data: any) {
        try {
            const nonce = this.generateRandomNonce()
            const key = await this.getSharedKey(nonce)
            const bodyData = encode(data)
            const cipher = createCipheriv('aes-256-gcm', key, nonce)
            const encrypted = Buffer.concat([ cipher.update(bodyData), cipher.final() ]);
            const tag = cipher.getAuthTag()
            return {
                tag: tag,
                nonce: nonce,
                body: encrypted,
            }
        } catch {
            throw new Error(`Data encoding failure.`)
        }
    }

    /**
     * 解密
     * @param data 待解密数据
     */
    async decode(data: SessionBody) {
        if (!data || Array.isArray(data) || typeof data != 'object') {
            throw new TypeError(`The data to be decrypted must be an object.`)
        }
        const { nonce, tag, body } = data
        for (const [key, val] of Object.entries({ nonce, tag, body })) {
            if (!Buffer.isBuffer(val)) {
                throw new Error(`Invalid ${key}, must be buffer.`)
            }
        }
        
        try {
            const key = await this.getSharedKey(nonce)
            const decipher = createDecipheriv('aes-256-gcm', key, nonce);
            decipher.setAuthTag(tag)
            const decrypted = Buffer.concat([ decipher.update(body), decipher.final() ]);
            return decode(decrypted)
        } catch {
            throw new Error(`Data decoding failed.`)
        }
    }
}

