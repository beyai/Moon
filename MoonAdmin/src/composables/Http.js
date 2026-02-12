import { ofetch } from 'ofetch';

/** 监听请求 */
function onRequest({ options }) {
    const store = useStore()
    if (store.accessToken && !options.headers.has('Authorization')) {
        options.headers.append('Authorization', store.accessToken)
    }
}


/** 监听响应 */
async function onResponse({ response, options }) {
    let code = response.status
    let message = response.statusText
    const body = response._data;
    if (typeof body == 'object') {
        code = body.code ?? code;
        message = body.message ?? message;
    }

    // 请求成功
    if (code === 0) {
        return body;
    }
    // 重试失败
    if (options.retried) {
        throw new CreateError(code, message);
    }

    const store = useStore()

    if (code === 401 ) {
        options.retried = true
        await store.refreshAccessToken()
        options.headers.delete("Authorization")
        return options
    } else if (code === 403) {
        store.Reset()
    }
    
    throw new CreateError(code, message)
}

/** 监听请求错误 */
function onRequestError(error) {
    throw new CreateError(400, "服务器无法访问")
}

const $http = ofetch.create({
    baseURL: '/api/system',
    responseType: 'json',
    headers: {
        Accept: 'application/json'
    },
    timeout: 10000,
    retry: 1, 
    retryDelay: 300,
    retryStatusCodes: [401],
    onRequest,
    onRequestError,
    onResponse
})

export default {
    
    get(url, options) {
        return $http(url, { method: "GET", ...options });
    },

    post(url, options) {
        return $http(url, { method: "POST", ...options })
    }
}