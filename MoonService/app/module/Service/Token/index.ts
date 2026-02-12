import JWT from 'jsonwebtoken'
import { randomBytes } from "node:crypto";
import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg";
import { AbstractService } from "app/Common"
import { AdminType } from "app/InterFace";
import { CacheService } from "../Cache";

export interface Token {
    accessToken: string;
    refreshToken: string;
}

export interface AdminTokenPayload {
    adminId: string;
    type: AdminType;
    version: number
}

export interface UserTokenPayload {
    userId: string;
    version: number;
}

@ContextProto({
    accessLevel: AccessLevel.PUBLIC
})
export class TokenService extends AbstractService {

    // 缓存
    @Inject()
    Cache: CacheService
    
    /**
     * token 配置
     */
    get TokenConfig() {
        return this.config.token ?? {
            secretKey: 'K9mP2vX8qL7nR4wE6tY3uI0oA5sD1fG9',
            accessTTL: 3600 * 24,
            refreshTTL: 3600 * 24 * 30,
        }
    }

    /**
     * 生成访问 TOKEN
     * @param payload 负载数据
     */
    private generateAccessToken<T>(payload: T): string {
        const { secretKey, accessTTL } = this.TokenConfig
        return JWT.sign({ payload }, secretKey, { expiresIn: accessTTL } )
    }

    /**
     * 生成刷新 TOKEN
     * @param payload 负载数据
     */
    private async generateRefreshToken(payload): Promise<string> {
        const token = randomBytes(16).toString('hex')
        const { refreshTTL } = this.TokenConfig
        await this.Cache.set(`tk:${ token }`, payload, refreshTTL )
        return token
    }

    /**
     * 验证访问 Token
     */
    verifyAccessToken<T>( ctx: EggContext, token: string ): T {
        try {
            const { secretKey } = this.TokenConfig
            const { payload } = JWT.verify(token, secretKey ) as JWT.JwtPayload
            return payload as T
        } catch(error) {
            if (error instanceof JWT.TokenExpiredError) {
                ctx.throw(401, 'Token 已过期')
            } else {
                ctx.throw(401, "Token 无效")
            }
        }
    }

    /**
     * 验证刷新 Token
     */
    async verifyRefreshToken<T>(token: string): Promise<T | null> {
        const result = await this.Cache.get<T>(`tk:${token }`)
        return result
    }

    /**
     * 删除刷新 Token
     */
    async removeRefreshToken(token): Promise<boolean> {
        return await this.Cache.del(`tk:${token }`)
    }

    /**
     * 生成 Token
     */
    async generateToken<T>(payload: T): Promise<Token> {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: await this.generateRefreshToken(payload)
        } as Token
    }
    
}

