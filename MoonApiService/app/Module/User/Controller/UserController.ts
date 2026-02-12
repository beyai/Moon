import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { UserService } from "../Service/UserService";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType } from "app/Enum";
import { UserValidator } from "../Validator/UserValidator";
import { isEmpty } from "lodash";

@HTTPController({ path: '/system/user' })
@Middleware( AdminAuthMiddleware )
export class UserController extends SystemBaseController {
    @Inject()
    private readonly userService: UserService
    @Inject()
    private readonly validator: UserValidator

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware( AdminTypeMiddleware( AdminType.SYSTEM ) )
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const result = await this.userService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 搜索 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/search' })
    @Middleware( AdminTypeMiddleware( AdminType.SYSTEM,  AdminType.AGENT ) )
    async search(
        @Context() ctx: EggContext
    ) {
        const { username } = ctx.request.body
        if (isEmpty(username)) {
            ctx.success([])
        } else {
            const result = await this.userService.search(username, 10)
            ctx.success(result)
        }
    }

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    @Middleware( AdminTypeMiddleware( AdminType.SYSTEM ) )
    async create(
        @Context() ctx: EggContext
    ) {
        this.validator.create(ctx.request.body)
        const { username, password } = ctx.request.body;
        const result = await this.userService.create(username, password)
        ctx.success(result)
    }

    /** 设置密码 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setPassword' })
    @Middleware( AdminTypeMiddleware( AdminType.SYSTEM, AdminType.AGENT ) )
    async setPassword(
        @Context() ctx: EggContext
    ) {
        this.validator.setPassword(ctx.request.body)
        const { userId, password } = ctx.request.body
        const result = await this.userService.setPassword(userId, password)
        if (result) {
            ctx.success(result, '密码重置成功')
        } else {
            ctx.throw(400, '密码重置失败')
        }
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    @Middleware( AdminTypeMiddleware( AdminType.SYSTEM ) )
    async setStatus(
        @Context() ctx: EggContext
    ) {
        this.validator.setStatus(ctx.request.body)
        const { userId, status } = ctx.request.body
        const result = await this.userService.setStatus(userId, status)
        if (result) {
            ctx.success(result, '用户状态更新成功')
        } else {
            ctx.throw(400, '用户状态更新失败')
        }
    }

}