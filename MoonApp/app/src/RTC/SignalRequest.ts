import { CreateError } from 'react-native-nitro-moon/src/module/CreateError';

export class SignalRequest {
    private requestMap = new Map()

    // 生成随机请求ID
    private randomRequestId() {
        return Math.random().toString(36).slice(2, 16)
    }

    // 创建请求
    request<T>(timeout = 10000 ) {
        const requestId = this.randomRequestId()
        
        const promise = new Promise<T>((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.requestMap.delete(requestId)
                reject(new CreateError(400, '请求超时'))
            }, timeout)
            this.requestMap.set(requestId, { resolve, reject, timeoutId  })
        })

        return {
            requestId,
            promise
        }
    }

    // 取消请求
    cancel(requestId?: string) {
        if (requestId === undefined) {
            this.requestMap.forEach((request) => {
                clearTimeout(request.timeoutId)
            })
            this.requestMap.clear()
        } else if (this.requestMap.has(requestId)) {
            const request = this.requestMap.get(requestId)
            this.requestMap.delete(requestId)
            clearTimeout(request.timeoutId)
        }
    }

    // 响应结果
    response(requestId: string, body: any) {
        if (this.requestMap.has(requestId)) {
            const request = this.requestMap.get(requestId)
            this.requestMap.delete(requestId)
            clearTimeout(request.timeoutId)
            if (body.code === 0) {
                request.resolve(body)
            } else {
                request.reject(body)
            }
        }
    }

    // 清空
    clear() {
        this.cancel()
    }

}