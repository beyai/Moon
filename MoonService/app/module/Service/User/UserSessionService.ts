import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { Token, TokenService, UserTokenPayload } from "../Token";
import { User } from "app/model/User";
import { UserStatus } from "app/InterFace";
import { UserService } from "./UserService";

const USER_SESSION_PAYLOAD = Symbol('UserSessionService.payload')

@ContextProto({
    accessLevel: AccessLevel.PUBLIC
})
export class UserSessionService extends AbstractService {
    @Inject()
    private readonly Token: TokenService
    @Inject()
    private readonly UserService: UserService

    private [USER_SESSION_PAYLOAD]: UserTokenPayload

    /**
     * 当前账号负载信息
     */
    get payload(): UserTokenPayload  {
        return this[USER_SESSION_PAYLOAD]
    }

    /**
     * 获取当前账号详细
     */
    private async findUser(ctx: EggContext, exclude: string[] = [] ): Promise<User> {
        if (!this.payload) {
            ctx.throw(403, '无法获取用户信息，请重新登录')
        }
        const { userId } = this.payload

        let options: any
        if (exclude && exclude.length) {
            options = {
                attributes: { exclude }
            }
        }

        const user = await this.model.User.findByPk(userId, options)
        if (!user) {
            ctx.throw(403, '账号不存在')
        }
        if (user.status === UserStatus.DISABLE) {
            ctx.throw(403, '账号已禁用')
        }
        return user
    }

    /**
     * 注册账号
     * @param ctx 请求上下文
     * @param username 用户名
     * @param password 密码
     * @returns 
     */
    async register(ctx: EggContext, username: string, password: string) {
        return this.UserService.create(ctx, { username, password })
    }


    /**
     * 登录账号
     * @param ctx 请求上下文件
     * @param username 用户名
     * @param password 密码
     */
    async login( ctx: EggContext, username: string, password: string ): Promise<Token> {
        const user = await this.model.User.findOne({
            where: { username }
        })
        if (!user) {
            ctx.throw(400, '账号或密码不正确')
        }
        const isPass = await ctx.comparePassword(password, user.password) 
        if (!isPass) {
            ctx.throw(400, '账号或密码不正确')
        }
        if (user.status === UserStatus.DISABLE) {
            ctx.throw(400, '账号已禁用')
        }

        // 负载数据
        const payload = {
            userId: user.userId,
            version: user.passwordCount
        } as UserTokenPayload
        
        // 生成 token
        const token = await this.Token.generateToken(payload)
        this[USER_SESSION_PAYLOAD] = payload

        // 保存登录时间与登录IP
        ctx.app.runInBackground(async () => {
            try {
                const { ip, regionName } = this.geoip.get(ctx.ip)
                user.set('loginAt', new Date())
                user.set('loginIp', `${ regionName }(${ ip })`)
                await user.save()
            } catch(err) {
                this.logger.error(err)
            }
        })
        return token;
    }

    /**
     * 登出
     */
    async logout( ctx: EggContext, refreshToken: string ): Promise<boolean> {
        if (!refreshToken) return true;
        await this.Token.removeRefreshToken(refreshToken)
        return true
    }

    /**
     * 获取账号详情
     */
    async getProfile( ctx: EggContext ): Promise< Omit<User, 'password' > > {
        const user = await this.findUser(ctx, ['password'])
        // 验证密码版本
        if (user.passwordCount !== this.payload?.version ) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        try {
            const { ip, regionName } = this.geoip.get(ctx.ip)
            let loginIp = `${ regionName }(${ ip })`
            if (user.loginIp !== loginIp) {
                user.set('loginAt', new Date().toISOString())
                user.set('loginIp', loginIp)
                await user.save()
            }
            return user
        } catch(err) {
            ctx.throw(400, '请求失败，请稍后再试')
        }
    }

    /**
     * 修改密码
     * @param ctx 请求上下文
     * @param oldPassword 旧密码
     * @param newPassword 新密码
     */
    async updatePassword(ctx: EggContext, oldPassword: string, newPassword: string) {
        if (oldPassword == newPassword) {
            ctx.throw(400, '新密码不能与旧密码相同')
        }
        const user = await this.findUser(ctx)
        // 验证密码版本
        if (user.passwordCount !== this.payload?.version ) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        const isOldPass = await ctx.comparePassword(oldPassword, user.password)
        if (!isOldPass) {
            ctx.throw(400, '旧密码不正确')
        }
        try {
            const password = await ctx.encryptPassword(newPassword)
            user.set('password', password)
            user.set('passwordCount', user.passwordCount + 1)
            await user.save();
            return true
        } catch (err) {
            ctx.throw(400, '密码修改失败')
        }
    }

    /**
     * 验证访问 Token
     * @param ctx 请求上下文
     */
    verify( ctx: EggContext ) {
        const token = ctx.token // accessToken
        if (!token) ctx.throw(401, '非正常访问，缺少必要参数');
        let payload = this.Token.verifyAccessToken<UserTokenPayload>(ctx, token)
        this[USER_SESSION_PAYLOAD] = payload
    }

    /**
     * 验证与刷新访问 Token
     * @param ctx 请求上下文
     * @returns 当前用户授权 Tokens
     */
    async verifyAndRefresh(ctx: EggContext): Promise<Token> {
        const token = ctx.token
        if (!token) {
            ctx.throw(403, '非正常访问，缺少必要参数');
        }
        // 验证
        let oldPayload = await this.Token.verifyRefreshToken<UserTokenPayload>(token)
        if (!oldPayload) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        this[USER_SESSION_PAYLOAD] = oldPayload
        // 重新获取用户信息
        const user = await this.findUser(ctx, ['password'])
        if (user.passwordCount !== oldPayload.version) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }

        // 新的负载数据
        const newPayload = {
            userId: user.userId,
            version: user.passwordCount
        } as UserTokenPayload

        // 重新生成 Token
        const newToken = await this.Token.generateToken(newPayload)
        // 删除旧的刷新 Token
        await this.Token.removeRefreshToken(token)
            
        return newToken
    }

}