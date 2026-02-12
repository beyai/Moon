import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractClientController } from "../Common/AbstractClientController";
import { UserValidator } from "app/Validator";
import { UserAuthMiddleware, ClientAuthMiddleware } from "../Middleware";
import { MouseTrackService } from "@/module/Service/MouseTrack";

@HTTPController({ path: '/client/auth'})
export class ClientUserController extends AbstractClientController {

    @Inject()
    UserValidator: UserValidator
    @Inject()
    private readonly MouseTrackService: MouseTrackService

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/captcha' })
    @Middleware(ClientAuthMiddleware)
    async captcha(
        @Context() ctx: EggContext
    ) {
        const data = this.clientCtx.body
        if (!data.tracks) {
            ctx.throw(412, '参数错误')
        }
        try {
            const isChecked = this.MouseTrackService.checkTrack(ctx, data.tracks)
            if (!isChecked) {
                throw new Error('通过不通过')
            }
            const result = this.MouseTrackService.generateKey()
            const body  = await this.clientCtx.buildResponseData(ctx, result)
            ctx.success(body, '验证通过')
        } catch {
            ctx.throw(400, '验证失败')
        }
    }

    // 登录
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/login' })
    @Middleware(ClientAuthMiddleware)
    async login(
        @Context() ctx: EggContext
    ) {
        const data = this.clientCtx.body
        this.MouseTrackService.verify(ctx, data.key)
        this.UserValidator.login(data)
        const result = await this.session.login(ctx, data.username, data.password)
        const body  = await this.clientCtx.buildResponseData(ctx, result)
        ctx.success(body, '登录成功')
    }

    // 注册
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/register' })
    @Middleware(ClientAuthMiddleware)
    async register(
        @Context() ctx: EggContext
    ) {
        const data = this.clientCtx.body
        this.MouseTrackService.verify(ctx, data.key)
        this.UserValidator.register(data)
        await this.session.register(ctx, data.username, data.password)
        const body = await this.clientCtx.buildResponseData(ctx, true)
        ctx.success(body, '注册成功')
    }

    // 刷新访问 Token
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/refresh' })
    @Middleware(ClientAuthMiddleware)
    async refresh(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.verifyAndRefresh(ctx)
        const body = await this.clientCtx.buildResponseData(ctx, result)
        ctx.success(body)
    }

    // 登出
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/logout' })
    @Middleware(ClientAuthMiddleware)
    async logout(
        @Context() ctx: EggContext
    ) {
        const token = ctx.token
        if (token) {
            await this.session.logout(ctx, token)
        }
        const body = await this.clientCtx.buildResponseData(ctx, true)
        ctx.success(body, '退出成功')
    }

    // 获取账号信息
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    @Middleware(UserAuthMiddleware, ClientAuthMiddleware)
    async getProfile(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.getProfile(ctx)
        const body = await this.clientCtx.buildResponseData(ctx, result.toJSON())
        ctx.success(body)
    }

    // 修改密码
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/updatePassword' })
    @Middleware(UserAuthMiddleware, ClientAuthMiddleware)
    async updatePassword(
        @Context() ctx: EggContext
     ) {
        const data = this.clientCtx.body
        this.UserValidator.updatePassword(data)
        const result = await this.session.updatePassword(ctx, data.oldPassword, data.newPassword)
        ctx.success(result, '密码修改成功')
    }
    
}