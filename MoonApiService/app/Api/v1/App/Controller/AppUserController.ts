import { isEmpty } from "lodash";
import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { BaseDeviceController } from "../BaseDeviceController";
import { AppMiddleware } from "../Middleware/AppMiddleware";
import { UserAuthMiddleware } from "../../Middleware/UserAuthMiddleware";
import { UserValidator } from "../../Validator/UserValidator";
import { MouseTrackService } from "app/Module/MouseTrack";

@HTTPController({ path: '/v1/device' })
export class AppUserController extends BaseDeviceController {

    @Inject()
    private readonly validator: UserValidator

    @Inject()
    private readonly mouseTrackService: MouseTrackService

    /** 操作验证 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/captcha' })
    @Middleware( AppMiddleware )
    async captcha(
        @Context() ctx: EggContext
    ) {
        const { tracks } = ctx.request.body;
        if (isEmpty(tracks)) {
            ctx.throw(400, '操作验证失败')
        }
        const isChecked = this.mouseTrackService.checkTrack(tracks)
        if (!isChecked) {
            ctx.throw(400, '操作验证失败')
        }
        return this.mouseTrackService.generateKey()
    }

    /** 登录 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/login' })
    @Middleware( AppMiddleware )
    async login() {
        const { username, password } = this.deviceCtx.body
        if (isEmpty(username) || isEmpty(password)) {
            this.throw(400, `用户名或密码不能为空`)
        }
        const result = await this.session.login(username, password )
        return result;
    }

    /** 注册 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/register' })
    @Middleware( AppMiddleware )
    async register() {
        const { username, password } = this.deviceCtx.body
        if (isEmpty(username) || isEmpty(password)) {
            this.throw(400, `用户名或密码不能为空`)
        }
        await this.session.register(username, password )
        return true;
    }

    /** 登出 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/logout' })
    @Middleware( AppMiddleware )
    async logout(
        @Context() ctx: EggContext
    ) {
        if (ctx.token) {
            this.backgroundTask.run(async () => {
                const refreshToken = ctx.token!
                this.session.logout(refreshToken)
            })
        }
        return true
    }

    /** 刷新 Token */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/refresh' })
    @Middleware( AppMiddleware )
    async refresh(
        @Context() ctx: EggContext
    ) {
        const refreshToken = ctx.token
        if (!refreshToken) {
            this.throw(403, `登录已过期，请重新登录`)
        }
        return this.session.refresh(refreshToken)
    }

    /** 获取用户信息 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/userInfo' })
    @Middleware( UserAuthMiddleware, AppMiddleware )
    async userInfo() {
        return this.session.getInfo()
    }

    /** 修改密码 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/password' })
    @Middleware( UserAuthMiddleware, AppMiddleware )
    async updatePassword(
        @Context() ctx: EggContext
    ) {
        this.validator.updatePassword(this.deviceCtx.body)
        const { oldPassword, newPassword } = this.deviceCtx.body
        if (newPassword === oldPassword) {
            ctx.throw(400, '新密码与旧密码相同，无需修改')
        }
        const result = await this.session.updatePassword(oldPassword, newPassword)
        if (result) {
            return true
        } else {
            ctx.throw(400, `密码修改失败`)
        }
    }



}