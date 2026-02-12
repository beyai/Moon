import { HttpRequest, ResponseResult } from "react-native-nitro-moon";
import { AuthState, AuthActions, DeviceState } from "@/Store";
import { CreateError } from "@/Common/CreateError";
import { DeviceInfo, GameData, GameDictMap, GamePlayData, LoginRequest, RegisterRequest, TokenResponse, UpdatePasswordRequest, UserInfo } from "./interface";

interface RequestOptions {
    header?: Record<string, string>;
    body?: Record<string, any>;
    retry?: boolean
}

// 请求成功响应内容
interface ResponseBody<T> {
    code: number;
    message: string;
    data: T
}

export class Service {
    
    // 处理刷新访问 Token 重试 Promise
    private static retryPromise: Promise<ResponseResult> | null = null;

    // 发送请求
    private static async handlerRequest<T>(url: string, options?: RequestOptions): Promise<T> {
        const { error, body } = await HttpRequest.send(url, options)
        if (!error) {
            return body as T;
        }
        
        let code    = error.code as number ?? 400
        let message = error.message as string ?? "请求失败"

        const isRetry = options?.retry ?? false
        if (isRetry) {
            throw new CreateError(code, message)
        }

        // 401 刷新令牌
        if (error.code === 401) {
            return await this.handlerRefreshToken<T>(url, options)
        }
        else if (error.code === 403 ) {
            AuthActions.clearTokens()
        }
        throw new CreateError(code, message)
    }

    // 处理刷新访问 Token 
    private static async handlerRefreshToken<T>(url: string, options?: RequestOptions): Promise<T> {
        if (!this.retryPromise) {
            this.retryPromise = HttpRequest.send("/device/refresh", {
                header: {
                    'Authorization': AuthState.refreshToken
                }
            })
        }

        const { error, body } = await this.retryPromise

        // 刷新令牌失败
        if (error) {
            AuthActions.clearTokens() // 清空登录令牌
            this.retryPromise = null
            throw new CreateError(403, "刷新令牌失败")
        }

        const { data: tokens }: ResponseBody<TokenResponse> = { ...body as any }
        AuthActions.setTokens(tokens)

        const retryOptions: RequestOptions = {
            ...options,
            retry: true,
            header: {
                ...(options?.header ?? {}),
                'Authorization': tokens.accessToken
            }
        }

        try {
           return await this.handlerRequest<T>(url, retryOptions)
        } finally {
            this.retryPromise = null
        }
    }

    /** 直接刷新访问 Token */
    static async refreshToken(): Promise<TokenResponse> {
        const { error, body } = await HttpRequest.send('/device/refresh', {
            header: {
                'Authorization': AuthState.refreshToken
            }
        })
        if (error) {
            AuthActions.clearTokens()
            throw new CreateError(403, "刷新令牌失败")
        }
        // 更新访问tokens
        const { data: tokens }: ResponseBody<TokenResponse> = { ...body as any }
        AuthActions.setTokens(tokens)
        return tokens
    }

    /** 登录 */
    static async userLogin(data: LoginRequest) {
        return await this.handlerRequest<ResponseBody<TokenResponse>>('/device/login', {
            body: data
        })
    }

    /** 注册 */
    static async userRegister(data: RegisterRequest) {
        return await this.handlerRequest<ResponseBody<boolean>>('/device/register', {
            body: data
        })
    }

    /** 退出登录 */
    static async userLogout() {
        return await this.handlerRequest<ResponseBody<boolean>>('/device/logout', {
            header: {
                'Authorization': AuthState.refreshToken
            }
        })
    }

    /** 获取用户信息 */
    static async userInit() {
        return await this.handlerRequest<ResponseBody<UserInfo>>('/device/userInfo', {
            header: {
                'Authorization': AuthState.accessToken
            }
        })
    }

    /** 修改密码 */
    static async updatePassword(data: UpdatePasswordRequest) {
        return await this.handlerRequest<ResponseBody<UserInfo>>('/device/password', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: data
        })
    }

    /** 设备初始化 */
    static async deviceInit() {
        return await this.handlerRequest<ResponseBody<DeviceInfo>>('/device/init', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: {
                deviceUID: DeviceState.deviceUID,
                deviceCode: DeviceState.deviceCode,
                version: DeviceState.version,
            }
        })
    }

    /** 游戏字典 */
    static async gameDict() {
        return await this.handlerRequest<ResponseBody<GameDictMap>>('/game/dict', {
            header: {
                'Authorization': AuthState.accessToken
            },
        })
    }

    /** 游戏基本配置 */
    static async gameAllList() {
        return await this.handlerRequest<ResponseBody<GameData[]>>('/game/all', {
            header: {
                'Authorization': AuthState.accessToken
            },
        })
    }

    /** 游戏玩法列表 */
    static async gamePlayList() {
        return await this.handlerRequest<ResponseBody<GamePlayData[]>>('/game/list', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: {
                deviceCode: DeviceState.deviceCode
            }
        })
    }

    /** 添加游戏玩法 */
    static async createGamePlay(data: GamePlayData) {
        return await this.handlerRequest<ResponseBody<GamePlayData>>('/game/create', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: {
                ...data,
                deviceCode: DeviceState.deviceCode,
            }
        })
    }

    /** 更新游戏玩法 */
    static async updateGamePlay(data: GamePlayData) {
        return await this.handlerRequest<ResponseBody<GamePlayData>>('/game/update', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: {
                ...data,
                deviceCode: DeviceState.deviceCode,
            }
        })
    }
    
    /** 删除游戏玩法 */
    static async removeGamePlay(playId: string) {
        return await this.handlerRequest<ResponseBody<GamePlayData>>('/game/remove', {
            header: {
                'Authorization': AuthState.accessToken
            },
            body: {
                playId,
                deviceCode: DeviceState.deviceCode,
            }
        })
    }
    


}