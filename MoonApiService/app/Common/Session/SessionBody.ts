import { encode, decode } from 'cbor'

export interface SessionBodyData {
    deviceUID: string;
    nonce: Buffer;
    tag: Buffer;
    body: Buffer;
    payload?: Buffer
}

export interface SessionBody extends SessionBodyData {
    getPayload(): Record<string, any> | null;
    setPayload(payload: Record<string, unknown>): void;
    toJSON(): Record<string, unknown>
}

export namespace SessionBody {

    export function create(data: SessionBodyData): SessionBody {

        return {
            
            ...data,

            /**
             * 获取负载数据
             */
            getPayload() {
                const { payload } = this
                if (payload && Buffer.isBuffer(payload)) {
                    return decode(payload)
                }
                return null
            },

            /**
             * 设置负载数据
             */
            setPayload(payload: Record<string, unknown>) {
                if (!payload || Array.isArray(payload) || typeof payload !== 'object') {
                    throw new Error('payload must be a valid JSON object.')
                }
                if (Object.getPrototypeOf(payload) !== Object.prototype) {
                    throw new Error('payload must be a plain object')
                }
                this.payload = encode(payload)
            },
            
            /**
             * 转换为 JSON 对象
             */
            toJSON(): Record<string, any> {
                const { deviceUID, nonce, tag, body, payload } = this
                if (typeof deviceUID !== 'string') {
                    throw new Error('Invalid deviceUID.')
                }

                for (const [key, val] of Object.entries({ nonce, tag, body })) {
                    if (!Buffer.isBuffer(val)) {
                        throw new Error(`Invalid ${key}.`)
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
     * 从 JSON 格式创建 SessionBody 
     */
    export function fromJSON(data: unknown) {

        if (!data || Array.isArray(data) || typeof data !== 'object') {
            throw new Error('data must be a valid JSON object.')
        }

        let { deviceUID, nonce, tag, body, payload } = data as Record<string, any>

        if (typeof deviceUID !== 'string') {
            throw new Error('Invalid deviceUID')
        }

        const bodyData: SessionBodyData = {
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

function parseBuffer(value: any) {
    if (Buffer.isBuffer(value)) {
        return value
    }
    try {
        return Buffer.from(value, 'base64')
    } catch {
        throw new TypeError(`Invalid base64String or Buffer format`)
    }
}