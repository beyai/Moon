import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { AdminType } from "app/InterFace";
import { AdminService } from "@/module/Service";
import { AdminValidator } from "app/Validator/AdminValidator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";


@HTTPController({ path: '/system/admin' })
@Middleware(AdminTypeMiddleware( AdminType.SYSTEM ))
@Middleware(AdminAuthMiddleware)
export class AdminController extends AbstractSystemController {

    @Inject()
    private readonly AdminService: AdminService
    @Inject()
    private readonly AdminValidator: AdminValidator

    // 代理用户列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async list(
        @Context() ctx: EggContext
    ) {
        const query = ctx.request.body
        query.type = AdminType.AGENT
        
        const result = await this.AdminService.findList(ctx, query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    // 全部代理
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/agent' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async agent( @Context() ctx: EggContext) {
        const result = await this.AdminService.findAllByType(ctx, AdminType.AGENT)
        ctx.success(result)
    }

    // 创建代理
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    async create(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        data.type = AdminType.AGENT
        this.AdminValidator.createAdmin(data)

        await this.AdminService.create(ctx, data)
        ctx.success(true, '代理添加成功')
    }

    // 设置状态
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    async setStatus(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.AdminValidator.setStatus(data)

        const result = await this.AdminService.setStatus(ctx, data.adminId, data.status)
        if (result) {
            ctx.success(result, '状态更新成功')
        } else {
            ctx.throw(400, '状态更新失败')
        }
    }

    // 重置密码
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setPassword' })
    async setPassword(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.AdminValidator.setPassword(data)

        const result = await this.AdminService.setPassword(ctx, data.adminId, data.password)
        if (result) {
            ctx.success(result, '密码重置成功')
        } else {
            ctx.throw(400, '密码重置失败')
        }
        
    }



}