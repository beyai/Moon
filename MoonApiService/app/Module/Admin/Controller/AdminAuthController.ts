import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { AdminAuthMiddleware } from "app/Module/SystemMiddleware";
import { isEmpty } from "lodash";
import { AdminValidator } from "../Validator/AdminValidator";
import { MouseTrackService } from "app/Module/MouseTrack";

@HTTPController({ path: '/system/auth' })
export class AdminAuthController extends SystemBaseController {

    @Inject()
    private readonly validator: AdminValidator
    @Inject()
    private readonly mouseTrackService: MouseTrackService

    /** 账号信息 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/init' })
    @Middleware(AdminAuthMiddleware)
    async getInfo(
        @Context() ctx: EggContext
    ) {
        const result = await this.session.getInfo()
        ctx.success(result)
    }

    /** 更新密码 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/password' })
    @Middleware(AdminAuthMiddleware)
    async updatePassword(
        @Context() ctx: EggContext
    ) {
        this.validator.updatePassword(ctx.request.body)
        const { newPassword, oldPassword } = ctx.request.body
        if (newPassword === oldPassword) {
            ctx.throw(400, '新密码与旧密码相同，无需修改')
        }
        const result  = await this.session.updatePassword(oldPassword, newPassword)
        if (result) {
            ctx.success(true, '密码更新成功')
        } else {
            ctx.throw(400, '密码更新失败')
        }
    }

    /** 登录 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/login' })
    async login(
        @Context() ctx: EggContext
    ) {
        const { username, password, key } = ctx.request.body
        this.mouseTrackService.verify(key)
        if (isEmpty(username) || isEmpty(password)) {
            ctx.throw(400, '用户名或密码不能为空')
        }

        const result = await this.session.login(username, password)
        ctx.success(result, '登录成功')
    }

    /** 刷新 Token */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/refresh' })
    async refresh(
        @Context() ctx: EggContext
    ) {
        const refreshToken = ctx.token
        if (!refreshToken) {
            ctx.throw(403, '无法获取令牌')
        }
        const result = await this.session.refresh(refreshToken)
        ctx.success(result, '刷新成功')
    }

    /** 登出 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/logout' })
    async logout(
        @Context() ctx: EggContext
    ) {
        ctx.success(true, '登出成功')
        const refreshToken = ctx.token

        // 后台删除刷新 Token
        this.backgroundTask.run(async () => {
            if (refreshToken) {
                await this.session.logout(refreshToken)
            }
        })
    }

}