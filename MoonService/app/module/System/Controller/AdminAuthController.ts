import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { AdminType } from "app/InterFace";
import { AdminValidator } from "app/Validator";
import { MouseTrackService } from "@/module/Service/MouseTrack";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/auth' })
export class AdminAuthController extends AbstractSystemController {

    @Inject()
    private readonly AdminValidator: AdminValidator
    @Inject()
    private readonly MouseTrackService: MouseTrackService

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/captcha' })
    async captcha(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        if (!data.tracks) {
            ctx.throw(412, '参数数据')
        }
        try {
            const isChecked = this.MouseTrackService.checkTrack(ctx, data.tracks)
            if (!isChecked) {
                throw new Error('通过不通过')
            }
            const result = this.MouseTrackService.generateKey()
            ctx.success(result, '验证通过')
        } catch {
            ctx.throw(400, '验证失败')
        }
    }

    // 登录
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/login' })
    async login(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.AdminValidator.login(data)
        // 验证操作
        this.MouseTrackService.verify(ctx, data.key)
        
        const result = await this.session.login(ctx, data.username, data.password)
        ctx.success(result, '登录成功')
    }

    // 刷新访问 Token
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/refresh' })
    async refresh(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.verifyAndRefresh(ctx)
        ctx.success(result, 'Token刷新成功')
    }

    // 登出
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/logout' })
    @Middleware(AdminAuthMiddleware)
    async logout(
        @Context() ctx: EggContext
    ) {
        const { refreshToken } = ctx.request.body
        if (refreshToken) {
            await this.session.logout(ctx, refreshToken )
        }
        ctx.success(true, "已成功退出登录")
    }

    // 账号信息
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    @Middleware(AdminAuthMiddleware)
    async getProfile(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.getProfile(ctx)
        ctx.success(result)
    }

    // 修改密码
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/password' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    @Middleware(AdminAuthMiddleware)
    async updatePassword(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.AdminValidator.updatePassword(data)

        const result = await this.session.updatePassword(ctx, data.oldPassword, data.newPassword )
        ctx.success(result, '密码修改成功，请重新登录')
    }
}