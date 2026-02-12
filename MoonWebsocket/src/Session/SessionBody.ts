import { decode, encode } from "cbor";
import { createError, parseBuffer  } from "../utils";
/**
 * 会话加密内容
 */
export interface SessionBody {
    // 设备或客户端唯一标识
    deviceUID: string;
    // 随机盐
    nonce: Buffer;
    // AES-GCM 验证标签
    tag: Buffer;
    // 加密内容
    body: Buffer;
    // 负载数据
    payload?: Buffer
}


interface SessionBodyMixin extends SessionBody {
    getPayload(): Record<string, any> | null;
    // 设置负载数据
    setPayload(payload: Record<string, any>): void;
    // 转换成 JSON
    toJSON(): Record<string, any>
}


export namespace SessionBody {
    
    /**
     * 创建会话数据
     * @param data 
     */
    export function create(data: SessionBody): SessionBodyMixin {
        return {
            ...data,
            // 获取负载数据
            getPayload() {
                const { payload } = this
                if (payload && Buffer.isBuffer(payload)) {
                    return decode(payload)
                }
                return null
            },

            // 设置负载数据
            setPayload(payload: Record<string, any>) {
                if ( payload === null || typeof payload !== 'object' || Array.isArray(payload) ) {
                    throw new TypeError('Payload must be a plain object')
                }
                if (Object.getPrototypeOf(payload) !== Object.prototype) {
                    throw new Error('Payload must be a plain object')
                }
                this.payload = encode(payload)
            },

            // 转换成 JSON
            toJSON(): Record<string, any> {
                const { deviceUID, nonce, tag, body, payload } = this

                if (typeof deviceUID !== 'string') {
                    throw new Error('Invalid deviceUID.')
                }

                for (const [key, val] of Object.entries({ nonce, tag, body })) {
                    if (!Buffer.isBuffer(val)) {
                        throw new Error(`Invalid ${key}, must be buffer.`)
                    }
                }

                const json: Record<string, any> = {
                    deviceUID,
                    nonce   : nonce.toString('base64'),
                    tag     : tag.toString('base64'),
                    body    : body.toString('base64'),
                }

                if (payload != undefined) {
                    if (!Buffer.isBuffer(payload)) {
                        throw new Error('Invalid payload, must be Buffer')
                    }
                    json.payload = payload.toString('base64')
                }
                return json
            }
        }
    }

    /**
     * 从 JSON 创建会话数据
     * @param data 
     */
    export function fromJSON(data: unknown) {
        if (!data || typeof data !== 'object' || Array.isArray(data)) {
            throw new createError(412, '数据格式不正确')
        }
        let { deviceUID, nonce, tag, body, payload } = data as Record<string, any>

        if (typeof deviceUID !== 'string') {
            throw new createError(412, 'deviceUID 格式不正确')
        }
   
        const bodyData: SessionBody = {
            deviceUID   : deviceUID,
            nonce       : parseBuffer(nonce),
            tag         : parseBuffer(tag),
            body        : parseBuffer(body)
        }

        if (payload != undefined) {
            bodyData.payload = parseBuffer(payload)
        }

        return SessionBody.create(bodyData)
    }
}