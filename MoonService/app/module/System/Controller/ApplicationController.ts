import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { AdminType } from "app/InterFace";
import { ApplicationService } from "@/module/Service";
import { ApplicationValidator } from "app/Validator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/app' })
@Middleware(AdminTypeMiddleware([ AdminType.SYSTEM ]))
@Middleware(AdminAuthMiddleware)
export class ApplicationController extends AbstractSystemController {
    
    @Inject()
    Application: ApplicationService
    @Inject()
    ApplicationValidator: ApplicationValidator

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async list(
        @Context() ctx: EggContext
    ) {
        const result = await this.Application.findList(ctx)
        ctx.success(result)
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    async create(
        @Context() ctx: EggContext
    ) { 
        const data = ctx.request.body;
        this.ApplicationValidator.create(data)
        const result = await this.Application.create(ctx, data.version)
        ctx.success(result, '创建成功')
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body;
        this.ApplicationValidator.remove(data)
        const result = await this.Application.remove(ctx, data.id)
        ctx.success(result, 'App版本删除成功')
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    async setStatus(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body;
        this.ApplicationValidator.setStatus(data)
        const result = await this.Application.setStatus(ctx, data.id, data.status)
        ctx.success(result, 'App版本状态更新成功')
    }
}