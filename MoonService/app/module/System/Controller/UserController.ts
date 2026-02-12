import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { UserService } from "@/module/Service";
import { UserValidator } from "app/Validator";
import { AdminType } from "app/InterFace";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/user' })
@Middleware(AdminAuthMiddleware)
export class UserController extends AbstractSystemController {

    @Inject()
    private readonly UserService: UserService
    @Inject()
    private readonly UserValidator: UserValidator

    // 用户列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware(AdminTypeMiddleware(AdminType.SYSTEM))
    async list( @Context() ctx: EggContext) {
        const result = await this.UserService.findList(ctx, ctx.request.body, ctx.page, ctx.limit)
        ctx.success(result, '请求成功')
    }

    // 搜索用户
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/search' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async search( @Context() ctx: EggContext) {
        const data = ctx.request.body
        const result = await this.UserService.search(ctx, data.username ?? '')
        ctx.success(result)
    }

    // 创建用户
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    @Middleware(AdminTypeMiddleware(AdminType.SYSTEM))
    async create( @Context() ctx: EggContext ) {
        const data = ctx.request.body
        this.UserValidator.createUser(data)

        await this.UserService.create(ctx, data)
        ctx.success(true, '用户创建成功')
    }

    // 重置密码
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setPassword' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async setPassword( @Context() ctx: EggContext ) {
        const data = ctx.request.body
        this.UserValidator.setPassword(data)

        const result = await this.UserService.setPassword(ctx, data.userId, data.password)
        if (result) {
            ctx.success(result, '密码重置成功')
        } else {
            ctx.throw(400, '密码重置失败')
        }
    }

    // 更新状态
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    @Middleware(AdminTypeMiddleware(AdminType.SYSTEM))
    async setStatus( @Context() ctx: EggContext ) {
        const data = ctx.request.body
        this.UserValidator.setStatus(data)

        const result = await this.UserService.setStatus(ctx, data.userId, data.status)
        if (result) {
            ctx.success(result, '状态更新成功')
        } else {
            ctx.throw(400, '状态更新失败')
        }
    }

}