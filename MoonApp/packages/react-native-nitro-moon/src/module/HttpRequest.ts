import { NitroModules } from 'react-native-nitro-modules'
import type { HttpRequest as HttpRequestType } from '../specs/HttpRequest/HttpRequest.nitro'
export type { RequestOptions, ResponseResult } from '../specs/HttpRequest/HttpRequest.nitro'
export const HttpRequest = NitroModules.createHybridObject<HttpRequestType>('HttpRequest')
