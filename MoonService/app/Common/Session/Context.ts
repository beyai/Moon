import { createCipheriv, createDecipheriv, createECDH, ECDH, hkdf, randomBytes } from "crypto"
import { encode, decode } from 'cbor'
import { SessionBody } from "./Body"

const SESSION_LOCAL_PRIVATE_KEY = Symbol("SessionKeyPair.localKey")
const SESSION_REMOTE_PUBLIC_KEY = Symbol("SessionKeyPair.remoteKey")

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

export class SessionContext {

    // 本地密钥
    private [SESSION_LOCAL_PRIVATE_KEY]:  ECDH
    get localKey() {
        if (!this[SESSION_LOCAL_PRIVATE_KEY]) {
            this[SESSION_LOCAL_PRIVATE_KEY] = createECDH('prime256v1')
        }
        return this[SESSION_LOCAL_PRIVATE_KEY]
    }

    // 远端公钥
    private [SESSION_REMOTE_PUBLIC_KEY]: Uint8Array
    get remoteKey() {
        return this[SESSION_REMOTE_PUBLIC_KEY]
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
        this[SESSION_REMOTE_PUBLIC_KEY] = publicKey
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
     * @param salt 加盐
     */
    private async getSharedKey(salt: Buffer) {
        const { localKey, remoteKey } = this;
        if (!remoteKey) {
            throw new Error(`The remote key does not exist.`)
        }
        const secret    = localKey.computeSecret(remoteKey)
        return await createHKDF(secret, salt)
    }

    /**
     * 加密
     * @param data 待加密数据
     */
    async encode(data: any) {
        try {
            const nonce             = this.generateRandomNonce()
            const key               = await this.getSharedKey(nonce)
            const bodyData          = encode(data)
            const cipher            = createCipheriv('aes-256-gcm', key, nonce )
            const encrypted         = Buffer.concat([ cipher.update(bodyData), cipher.final() ]);
            const tag               = cipher.getAuthTag()
            return {
                tag: tag,
                nonce: nonce,
                body: encrypted,
            }
        } catch {
            throw new Error(`数据编码失败`)
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
            if (val === undefined) {
                throw new Error(`The ${key} is undefined.`)
            }
            if (!Buffer.isBuffer(val)) {
                throw new Error(`Invalid ${key}, must be Uint8Array.`)
            }
        }
        
        try {
            const key               = await this.getSharedKey(nonce)
            const decipher          = createDecipheriv('aes-256-gcm', key, nonce);

            decipher.setAuthTag(tag)
            const decrypted         = Buffer.concat([ decipher.update(body), decipher.final() ]);

            return decode(decrypted)
        } catch {
            throw new Error(`数据解码失败`)
        }
    }

}

