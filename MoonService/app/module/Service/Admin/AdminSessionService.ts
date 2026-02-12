import _ from 'lodash'
import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { AdminTokenPayload, Token, TokenService } from "../Token";
import { AdminStatus, AdminType } from "app/InterFace";
import { Admin } from 'app/model/Admin';

const ADMIN_SESSION_PAYLOAD = Symbol('AdminSessionService.payload')

@ContextProto({
    accessLevel: AccessLevel.PUBLIC
})
export class AdminSessionService extends AbstractService {
    
    @Inject()
    private readonly Token: TokenService

    private [ADMIN_SESSION_PAYLOAD]: AdminTokenPayload

    /**
     * 当前账号负载信息
     */
    get payload(): AdminTokenPayload {
        return this[ADMIN_SESSION_PAYLOAD]
    }

    /**
     * 是否为系统管理员
     */
    get isSystem(): boolean {
        if (!this.payload) return false
        const { type } = this.payload
        return type === AdminType.SYSTEM
    }

    /**
     * 获取当前账号详细
     */
    private async findAdmin(ctx: EggContext, exclude: string[] = [] ): Promise<Admin> {
        if (!this.payload) {
            ctx.throw(403, '无法获取用户信息，请重新登录')
        }
        const { adminId } = this.payload

        let options: any
        if (exclude && exclude.length) {
            options = {
                attributes: { exclude }
            }
        }

        const admin = await this.model.Admin.findByPk(adminId, options)
        if (!admin) {
            ctx.throw(403, '账号不存在')
        }
        if (admin.status === AdminStatus.DISABLE) {
            ctx.throw(403, '账号已禁用')
        }
        return admin
    }

    /**
     * 登录账号
     * @param ctx 请求上下文件
     * @param username 用户名
     * @param password 密码
     */
    async login( ctx: EggContext, username: string, password: string ): Promise<Token> {
        const admin = await this.model.Admin.findOne({
            where: { username }
        })
        if (!admin) {
            ctx.throw(400, '账号或密码不正确')
        }
        const isPass = await ctx.comparePassword(password, admin.password) 
        if (!isPass) {
            ctx.throw(400, '账号或密码不正确')
        }
        if (admin.status === AdminStatus.DISABLE) {
            ctx.throw(400, '账号已禁用')
        }

        // 负载数据
        const payload = {
            adminId: admin.adminId,
            type: admin.type,
            version: admin.passwordCount
        } as AdminTokenPayload
        
        // 生成 token
        const token = await this.Token.generateToken(payload)
        this[ADMIN_SESSION_PAYLOAD] = payload

        // 保存登录时间与登录IP
        ctx.app.runInBackground(async () => {
            try {
                const { ip, regionName } = this.geoip.get(ctx.ip)
                admin.set('loginAt', new Date())
                admin.set('loginIp', `${ regionName }(${ ip })`)
                await admin.save()
            } catch(err) {
                this.logger.error(err)
            }
        })
        
        return token;
    }

    /**
     * 登出
     */
    async logout( ctx: EggContext, refreshToken: string ) {
        await this.Token.removeRefreshToken(refreshToken)
    }

    /**
     * 获取账号详情
     */
    async getProfile( ctx: EggContext ): Promise< Omit<Admin, 'password' > > {
        const admin = await this.findAdmin(ctx, ['password'])
        // 验证密码版本
        if (admin.passwordCount !== this.payload?.version ) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        try {
            ctx.app.runInBackground(async () => {
                const { ip, regionName } = this.geoip.get(ctx.ip)
                let loginIp = `${ regionName }(${ ip })`
                if (admin.loginIp !== loginIp) {
                    admin.set('loginAt', new Date().toISOString())
                    admin.set('loginIp', loginIp)
                    await admin.save()
                }
            })
            return admin
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
        const admin = await this.findAdmin(ctx)
        // 验证密码版本
        if (admin.passwordCount !== this.payload?.version ) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        const isOldPass = await ctx.comparePassword(oldPassword, admin.password)
        if (!isOldPass) {
            ctx.throw(400, '旧密码不正确')
        }
        try {
            const password = await ctx.encryptPassword(newPassword)
            admin.set('password', password)
            admin.set('passwordCount', admin.passwordCount + 1)
            await admin.save();
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
        let payload = this.Token.verifyAccessToken<AdminTokenPayload>(ctx, token)
        this[ADMIN_SESSION_PAYLOAD] = payload
    }

    /**
     * 验证与刷新访问 Token
     * @param ctx 请求上下文
     * @returns 当前用户授权 Tokens
     */
    async verifyAndRefresh(ctx: EggContext): Promise<Token> {
        const token = ctx.token // refreshToekn
        if (!token) {
            ctx.throw(403, '非正常访问，缺少必要参数');
        }

        // 验证
        let oldPayload = await this.Token.verifyRefreshToken<AdminTokenPayload>(token)
        if (!oldPayload) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }
        this[ADMIN_SESSION_PAYLOAD] = oldPayload
        // 重新获取用户信息
        const admin = await this.findAdmin(ctx, ['password'])
        if (admin.passwordCount !== oldPayload.version) {
            ctx.throw(403, 'Token 已过期，请重新登录')
        }

        // 新的负载数据
        const newPayload = {
            adminId: admin.adminId,
            type: admin.type,
            version: admin.passwordCount
        } as AdminTokenPayload

        // 重新生成 Token
        const newToken = await this.Token.generateToken(newPayload)
        // 删除旧的刷新 Token
        await this.Token.removeRefreshToken(token)
            
        return newToken
    }


}