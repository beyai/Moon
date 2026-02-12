import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractAppController } from "../Common/AbstractAppController";
import { UserValidator } from "app/Validator";
import { UserAuthMiddleware, DeviceAuthMiddleware } from "../Middleware";


@HTTPController({ path: '/device/user'})
export class AppUserController extends AbstractAppController {

    @Inject()
    UserValidator: UserValidator

    // 登录
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/login' })
    @Middleware(DeviceAuthMiddleware)
    async login(
        @Context() ctx: EggContext
    ) {
        const data = this.deviceCtx.body
        this.UserValidator.login(data)
        const result = await this.session.login(ctx, data.username, data.password)
        ctx.success(result, '登录成功')
    }

    // 注册
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/register' })
    @Middleware(DeviceAuthMiddleware)
    async register(
        @Context() ctx: EggContext
    ) {
        const data = this.deviceCtx.body
        this.UserValidator.register(data)
        await this.session.register(ctx, data.username, data.password)
        ctx.success(true, '注册成功')
    }

    // 刷新访问 Token
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/refresh' })
    @Middleware(DeviceAuthMiddleware)
    async refresh(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.verifyAndRefresh(ctx)
        ctx.success(result)
    }

    // 登出
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/logout' })
    @Middleware(DeviceAuthMiddleware)
    async logout(
        @Context() ctx: EggContext
    ) {
        const token = ctx.token
        if (token) {
            await this.session.logout(ctx, token)
        }
        ctx.success(true, '登出成功')
    }

    // 获取账号信息
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    @Middleware(UserAuthMiddleware, DeviceAuthMiddleware)
    async getProfile(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.getProfile(ctx)
        ctx.success(result.toJSON())
    }

    // 修改密码
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/updatePassword' })
    @Middleware(UserAuthMiddleware, DeviceAuthMiddleware)
    async updatePassword(
        @Context() ctx: EggContext
     ) {
        const data = this.deviceCtx.body
        this.UserValidator.updatePassword(data)
        await this.session.updatePassword(ctx, data.oldPassword, data.newPassword)
        ctx.success(true, '密码修改成功')
    }
    
}