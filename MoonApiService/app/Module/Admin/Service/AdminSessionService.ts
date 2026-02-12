import { AccessLevel, ContextProto, Inject } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { AdminStatus, AdminType } from "app/Enum";
import { AdminTokenPayload, TokenResult, TokenService } from "app/Core";
import { isEmpty } from "lodash";


const ADMIN_SESSION_PAYLOAD = Symbol('AdminSessionService.payload')

@ContextProto({ accessLevel: AccessLevel.PUBLIC })
export class AdminSessionService extends BaseService {


    @Inject()
    private readonly tokenService: TokenService

    /**
     * 会话负载数据
     */
    private [ADMIN_SESSION_PAYLOAD]?: AdminTokenPayload
    private get payload() {
        if (!this[ADMIN_SESSION_PAYLOAD]) {
            this.throw(403, '授权失败');
        }
        return this[ADMIN_SESSION_PAYLOAD]
    }

    /**
     * 管理员账号ID
     */
    get adminId() {
        return this.payload.adminId
    }

    /**
     * 密码版本
     */
    get version() {
        return this.payload.version
    }

    /**
     * 账号类型
     */
    get type(): AdminType {
        return this.payload.type
    }

    /**
     * 是否为系统账号
     */
    get isSystem() {
        return (this.payload.type == AdminType.SYSTEM)
    }

    /**
     * 根据 username 查询
     * @param username 用户名
     */
    private async findByUsername(
        username: string
    ) {
        return await this.model.Admin.findOne({
            where: { username }
        })
    }

    /**
     * 根据 adminId 查询
     * @param adminId 管理员账号ID
     */
    private async findByAdminId(
        adminId: string
    ) {
        return await this.model.Admin.findByPk(adminId)
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

        const admin = await this.findByUsername(username)
        if (!admin || !(await this.comparePassword(password, admin.password))) {
            this.throw(400, '用户名或密码不正确')
        }
        if (admin.status === AdminStatus.DISABLED) {
            this.throw(400, '用户账号已禁用')
        }

        // 生成 Token 
        const token = await this.tokenService.generateToken<AdminTokenPayload>({
            adminId: admin.adminId,
            type: admin.type as AdminType,
            version: admin.version
        })

        // 更新登录信息
        admin.set({ loginIp: this.ipAddr, loginAt: new Date() })
        await admin.save({ silent: true })

        return token
    }

    /**
     * 验证访问令牌
     */
    verify(accessToken: string) {
        try {
            const payload = this.tokenService.verifyAccessToken<AdminTokenPayload>(accessToken)
            this[ADMIN_SESSION_PAYLOAD] = payload
            return true
        } catch {
            return false
        }
    }
    
    /**
     * 刷新 token
     */
    async refresh(refreshToken: string) {
        const payload = await this.tokenService.verifyRefreshToken<AdminTokenPayload>(refreshToken)
        // 查询详情
        const admin = await this.findByAdminId(payload.adminId)
        
        // 验证状态
        if (!admin || admin.status === AdminStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        
        // 验证密码版本
        if (admin.version > payload.version) {
            this.throw(403, '登录已过期，请重新登录')
        }
        
        // 生成 Token 
        const token = await this.tokenService.generateToken<AdminTokenPayload>({
            adminId: admin.adminId,
            type: admin.type as AdminType,
            version: admin.version
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
        const admin = await this.findByAdminId(this.adminId)
        // 验证状态
        if (!admin || admin.status === AdminStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        // 验证密码版本
        if (admin.version > this.version) {
            this.throw(403, '登录已过期，请重新登录')
        }

        // 更新登录信息
        const loginIp = this.ipAddr
        if (loginIp && loginIp !== admin.loginIp) {
            admin.set({ loginIp: loginIp, loginAt: new Date() })
            await admin.save({ silent: true })
        }
        
        return {
            adminId: admin.adminId,
            type: admin.type,
            username: admin.username,
            loginAt: admin.loginAt,
            loginIp: admin.loginIp
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
        const admin = await this.findByAdminId(this.adminId)
        // 验证状态
        if (!admin || admin.status === AdminStatus.DISABLED) {
            this.throw(403, '账号已禁用')
        }
        // 验证旧密码
        if (!await this.comparePassword(oldPassword, admin.password)) {
            this.throw(400, '旧密码不正确')
        }

        // 设置新密码
        try {
            return await this.model.transaction(async (t) => {
                admin.set({ password: await this.encryptPassword(newPassword) })
                await admin.increment('version', { transaction: t })
                await admin.save({ silent: true, transaction: t })
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