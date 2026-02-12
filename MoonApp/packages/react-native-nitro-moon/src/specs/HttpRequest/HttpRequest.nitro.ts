import type { AnyMap, HybridObject } from 'react-native-nitro-modules'


/** 请求响应 */
export interface ResponseResult {
    body?: AnyMap,
    error?: AnyMap
}

/** 发送请求 */
export interface RequestOptions {
    header?: Record<string, string>;
    body?: AnyMap;
}

export interface HttpRequest extends HybridObject<{ ios: 'swift' }> {
    send(url: string, options?: RequestOptions): Promise<ResponseResult>;
}