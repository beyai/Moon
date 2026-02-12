import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { AdminService } from "../Service/AdminService";
import { AdminValidator } from "../Validator/AdminValidator";
import { AdminType } from "app/Enum";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";

@HTTPController({ path: '/system/admin' })
@Middleware(AdminAuthMiddleware)
export class AdminController extends SystemBaseController {

    @Inject()
    private readonly adminService: AdminService
    @Inject()
    private readonly validator: AdminValidator

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        query.type = AdminType.AGENT
        const result = await this.adminService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 下拉列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/all' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async findAll(
        @Context() ctx: EggContext
    ) {
        const result = await this.adminService.findAll(AdminType.AGENT)
        ctx.success(result)
    }

    /** 创建 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async create(
        @Context() ctx: EggContext
    ) {
        this.validator.create(ctx.request.body)
        const { username, password, mark = '' } = ctx.request.body
        await this.adminService.create({
            type: AdminType.AGENT, 
            username, 
            password,
            mark
        })
        ctx.success(true, '账号创建成功')
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async setStatus(
        @Context() ctx: EggContext
    ) {
        this.validator.setStatus(ctx.request.body)
        const { adminId, status } = ctx.request.body
        const result = await this.adminService.setStatus(adminId, status)
        if (result) {
            ctx.success(true, '状态更新成功')
        } else {
            ctx.throw(400, '状态更新失败')
        }
    }

    /** 设置密码 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setPassword' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async setPassword(
        @Context() ctx: EggContext
    ) {
        this.validator.setPassword(ctx.request.body)
        const { adminId, password } = ctx.request.body
        const result = await this.adminService.setPassword(adminId, password)
        if (result) {
            ctx.success(true, '密码重置成功')
        } else {
            ctx.throw(400, '密码重置失败')
        }
    }

}