import { GeoIP } from "app/Common";
import type { PowerPartial, Context } from "egg";

export default {

    get page(): number {
        const body = this.request?.body
        const query = this.query
        const page = Number( body.page ?? query?.page )
        return Number.isNaN(page) ? 1 : page
    },

    get limit(): number {
        const body = this.request?.body
        const query = this.query
        const limit = Number( body.limit ?? query?.limit )
        return Number.isNaN(limit) ? 10 : limit
    },

    get token(): string | null {
        return (this as Context).get('token') ||  (this as Context).get('authorization')  || null
    },
    
    get geoip() {
        if (this.app?.config?.geoipDB) {
            const geoip = GeoIP.getInstance(this.app.config.geoipDB)
            return geoip.get(this.ip ?? '127.0.0.1')
        }
        return this.ip
    },

    get ipAddr() {
        if (this.app?.config?.geoipDB) {
            const geoip = GeoIP.getInstance(this.app.config.geoipDB)
            return geoip.getText(this.ip ?? '127.0.0.1')
        }
        return this.ip
    },

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

    success(data?: unknown, message?: string | Record<string, unknown>, options?: Record<string, unknown>) {
        message = message ?? 'success'
        options = options ?? {}

        if (typeof message == "object" && message !== null ) {
            if (Array.isArray(message)) {
                message = 'success'
            } else {
                options = message
                message = 'success'
            }
        } else if (typeof message != 'string') {
            message = 'success'
        }
        
        this.status = 200
        this.body = {
            code: 0,
            message: message as string,
            data,
            ...options
        }
    }

} as PowerPartial<Context>