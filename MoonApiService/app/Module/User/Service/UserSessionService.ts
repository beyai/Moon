import { AccessLevel, ContextProto, Inject } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { UserStatus } from "app/Enum";
import { TokenResult, TokenService, UserTokenPayload } from "app/Core";
import { isEmpty } from "lodash";
import { UserService } from "./UserService";

const USER_SESSION_PAYLOAD = Symbol('UserSessionService.payload')

@ContextProto({ accessLevel: AccessLevel.PUBLIC })
export class UserSessionService extends BaseService {

    @Inject()
    private readonly userService: UserService
    @Inject()
    private readonly tokenService: TokenService

    /**
     * 会话负载数据
     */
    private [USER_SESSION_PAYLOAD]?: UserTokenPayload
    private get payload() {
        if (!this[USER_SESSION_PAYLOAD]) {
            this.throw(403, '授权失败');
        }
        return this[USER_SESSION_PAYLOAD]
    }

    /**
     * 用户账号ID
     */
    get userId() {
        return this.payload.userId
    }

    /**
     * 密码版本
     */
    get version() {
        return this.payload.version
    }

    /**
     * 根据 username 查询
     * @param username 用户名
     */
    private async findByUsername(
        username: string
    ) {
        return await this.model.User.findOne({
            where: { username }
        })
    }

    /**
     * 根据 userId 查询
     * @param userId 用户账号ID
     */
    private async findByUserId(
        userId: string
    ) {
        return await this.model.User.findByPk(userId)
    }

    /**
     * 注册账号
     * @param username 用户名
     * @param password 密码
     */
    async register(
        username: string,
        password: string
    ) {
        await this.userService.create(username, password)
    }

    /**
     * 登录
     * @param username 用户名
     * @param password 密码
     */
    async login(
        username: string,
        password: string
    ): Promise<TokenResult> {

        if (isEmpty(username) || isEmpty(password)) {
            this.throw(400, '用户名或密码不能为空')
        }

        const user = await this.findByUsername(username)
        if (!user || !(await this.comparePassword(password, user.password))) {
            this.throw(400, '用户名或密码不正确')
        }
        if (user.status === UserStatus.DISABLED) {
            this.throw(400, '账号已禁用')
        }

        // 生成 Token 
        const token = await this.tokenService.generateToken<UserTokenPayload>({
            userId: user.userId,
            version: user.version
        })

        // 更新登录信息
        user.set({ loginIp: this.ipAddr, loginAt: new Date() })
        await user.save({ silent: true })

        return token
    }

    /**
     * 验证访问令牌
     */
    verify(accessToken: string) {
        try {
            const payload = this.tokenService.verifyAccessToken<UserTokenPayload>(accessToken)
            this[USER_SESSION_PAYLOAD] = payload
            return true
        } catch {
            return false
        }
    }
    
    /**
     * 刷新 token
     */
    async refresh(refreshToken: string) {
        const payload = await this.tokenService.verifyRefreshToken<UserTokenPayload>(refreshToken)
        // 查询详情
        const user = await this.findByUserId(payload.userId)
        
        // 验证状态
        if (!user || user.status === UserStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        
        // 验证密码版本
        if (user.version > payload.version) {
            this.throw(403, '登录已过期，请重新登录')
        }
        
        // 生成 Token 
        const token = await this.tokenService.generateToken<UserTokenPayload>({
            userId: user.userId,
            version: user.version
        })

        // 删除缓存
        await this.tokenService.removeRefreshToken(refreshToken)
        return token
    }
    
    /**
     * 获取当前账号详情
     */
    async getInfo() {
        // 查询详情
        const user = await this.findByUserId(this.userId)
        // 验证状态
        if (!user || user.status === UserStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        // 验证密码版本
        if (user.version > this.version) {
            this.throw(403, '登录已过期，请重新登录')
        }

        // 更新登录信息
        const ip = this.ipAddr
        if (ip && ip !== user.loginIp) {
            user.set({ loginIp: ip, loginAt: new Date() })
            await user.save({ silent: true })
        }
        
        return {
            userId: user.userId,
            username: user.username,
            loginAt: user.loginAt,
            loginIp: user.loginIp,
            createdAt: user.createdAt
        }
    }

    /**
     * 更新密码
     */
    async updatePassword(
        oldPassword: string,
        newPassword: string,
    ) {
        // 查询详情
        const user = await this.findByUserId(this.userId)
        // 验证状态
        if (!user || user.status === UserStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        // 验证旧密码
        if (!await this.comparePassword(oldPassword, user.password)) {
            this.throw(400, '旧密码不正确')
        }

        // 设置新密码
        try {
            return await this.model.transaction(async (t) => {
                user.set({ password: await this.encryptPassword(newPassword) })
                await user.increment('version', { transaction: t })
                await user.save({ silent: true, transaction: t })
                return true
            })
        } catch(err) {
            this.logger.error(`密码更新失败`, err)
            return false
        }
    }

    /**
     * 退出登录
     * - 删除刷新 Token
     */
    async logout(refreshToken: string) {
        await this.tokenService.removeRefreshToken(refreshToken)
    }

    

}