import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { BaseService, Token } from "app/Common";
import { CacheService } from "./CacheService";
import {  randomBytes } from "crypto";
import { AdminType } from "app/Enum";


export interface AdminTokenPayload {
    adminId: string;
    type: AdminType;
    version: number;
}

export interface UserTokenPayload {
    userId: string;
    version: number;
}

export interface TokenResult {
    accessToken: string;
    refreshToken: string;
}

type TokenPayload = AdminTokenPayload | UserTokenPayload

const TOKEN_SERVICE = Symbol('TokenService.Token')

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class TokenService extends BaseService {
    
    @Inject()
    private readonly cacheService: CacheService

    /**
     * 配置选项
     */
    private get options() {
        return this.config.token ?? {
            secretKey: '',
            accessTTL: 3600 * 2,
            refreshTTL: 3600 * 24 * 7
        }
    }

    private [TOKEN_SERVICE]: Token
    private get Token() {
        if (!this[TOKEN_SERVICE]) {
            this[TOKEN_SERVICE] = new Token(this.options)
        }
        return this[TOKEN_SERVICE]
    }

    /**
     * 验证访问 Token
     * @param token 用户访问 token
     */
    verifyAccessToken<T extends TokenPayload>(token: string): T {
        try {
            return this.Token.verify<T>(token)
        } catch(error: any) {
            this.throw(401, `令牌验证失败`)
        }
    }

    /**
     * 生成刷新 Token
     * @param payload 负载数据 
     */
    private async generateRefreshToken<T extends TokenPayload>(payload: T) {
        const { refreshTTL } = this.options
        const refreshToken = randomBytes(16).toString('hex')
        const success = await this.cacheService.set(`tk:${refreshToken}`, payload, refreshTTL)
        if (success) {
            return refreshToken
        }
        this.throw(400, '令牌创建失败')
    }

    /**
     * 验证刷新 Token
     * @param token 用户访问 token
     */
    async verifyRefreshToken<T extends TokenPayload>(refreshToken: string) {
        const payload: T = await this.cacheService.get(`tk:${refreshToken}`)
        if (!payload) {
            this.throw(403, '令牌已过期')
        }
        return payload
    }

    /**
     * 删除刷新 Token
     */
    async removeRefreshToken(refreshToken: string): Promise<boolean> {
        return await this.cacheService.del(`tk:${refreshToken}`)
    }

    /**
     * 生成 Token
     * @param payload 负载数据 
     */
    async generateToken<T extends TokenPayload>(payload: T) {
        return {
            accessToken: this.Token.generate<T>(payload),
            refreshToken: await this.generateRefreshToken<T>(payload)
        }
    }
}