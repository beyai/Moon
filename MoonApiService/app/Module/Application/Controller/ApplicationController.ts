import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { ApplicationService } from "../Service/ApplicationService";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType } from "app/Enum";
import { isEmpty } from "lodash";
import { ApplicationValidator } from "../Validator/ApplicationValidator";

@HTTPController({ path: '/system/application' })
@Middleware( AdminAuthMiddleware, AdminTypeMiddleware( AdminType.SYSTEM ))
export class ApplicationController extends SystemBaseController {

    @Inject()
    private readonly applicationService: ApplicationService
    @Inject()
    private readonly validator: ApplicationValidator
    
    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async findList(
        @Context() ctx: EggContext
    ) {
        const result = await this.applicationService.findList(ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 创建 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    async create(
        @Context() ctx: EggContext
    ) {
        const { version } = ctx.request.body
        if (isEmpty(version)) {
            ctx.throw(412, 'App版本号不能为空')
        }
        await this.applicationService.create(version)
        ctx.success(true, 'App版本创建成功')
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    async setStatus(
        @Context() ctx: EggContext
    ) {
        this.validator.setStatus(ctx.request.body)
        const { id, status } = ctx.request.body
        const result = await this.applicationService.setStatus(id, status)
        if (result) {
            ctx.success(true, 'App版本状态更新成功')
        } else {
            ctx.throw(400, 'App版本状态更新失败')
        }
    }

    /** 删除 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        this.validator.checkId(ctx.request.body)
        const { id } = ctx.request.body
        const result = await this.applicationService.remove(id)
        if (result) {
            ctx.success(true, 'App版本删除成功')
        } else {
            ctx.throw(400, 'App版本删除失败')
        }
    }

}