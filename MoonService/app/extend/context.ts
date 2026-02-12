import { EggContext } from '@eggjs/tegg';
import bcryptjs from 'bcryptjs'

export default {

    /**
     * 获取全部请求数据
     */
    get all(): Record<string, any> {
        const self = this as EggContext
        return {
            ...self.query,
            ...self.params,
            ...self.request.body
        }
    },

    /**
     * 当前页码
     */
    get page(): number {
        const page = Number(this.all.page);
        return Number.isNaN(page) ? 1 : page;
    },

    /**
     * 每页显示条数
     */
    get limit(): number {
        const limit = Number(this.all.limit);
        return Number.isNaN(limit) ? 10 : limit;
    },

    /**
     * 访问令牌
     */
    get token(): string | null {
        const self = this as EggContext
        return self.get('token') 
            || self.get('authorization') 
            // || this.get('Sec-WebSocket-Protocol') 
            || self.all.token 
            || null;
    },

    /**
     * 过滤空数据
     * @param obj 对你
     */
    filterEmpty(obj: Record<string, any>) {
        let newObj: Record<string, any> = {}
        for (const k in obj) {
            const value = obj[k];
            if (value === null || value === undefined) continue;
            if (typeof value === 'string' && value.trim() !== "") {
                newObj[k] = value
            }
            else if (typeof value === 'number' && Number.isFinite(value)) {
                newObj[k] = value
            }
            else if (typeof value === 'boolean') {
                newObj[k] = value
            }
            else if (Array.isArray(value) && value.length > 0) {
                newObj[k] = value
            }
            else if (typeof value === 'object' && Object.keys(value).length > 0) {
                newObj[k] = value
            }
        }
        return newObj
    },

    /**
     * 请求成功
     * @param data 响应结果
     * @param message 响应消息
     */
    success<T>(this: EggContext, data: T, message: string = 'success' ) {
        this.status = 200
        this.body = {
            code: 0,
            message,
            data
        }
    },

    /**
     * 加密
     * @param password 密码
     */
    async encryptPassword(password): Promise<string> {
        return bcryptjs.hash(password, 10)
    },

    /**
     * 验证密码
     * @param  password 密码
     * @param hash 加密后的密码
     */
    async comparePassword(password, hash): Promise<boolean> {
        return bcryptjs.compare(password, hash)
    },

} 

