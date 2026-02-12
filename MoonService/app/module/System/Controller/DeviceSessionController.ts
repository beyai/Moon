import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { DeviceSessionService } from "@/module/Service";
import { AdminType } from "app/InterFace";
import { DeviceSessionValidator } from "app/Validator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/session' })
@Middleware(AdminTypeMiddleware([ AdminType.SYSTEM ]))
@Middleware(AdminAuthMiddleware)
export class DeviceSessionController extends AbstractSystemController {
    
    @Inject()
    DeviceSession: DeviceSessionService
    @Inject()
    DeviceSessionValidator: DeviceSessionValidator

    // 查询会话列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async list(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const result = await this.DeviceSession.findList(ctx, query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    // 重置会话状态
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/reset' })
    async reset(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.DeviceSessionValidator.checkDeviceCode(data)

        const result = await this.DeviceSession.resetStatus(ctx, data.deviceCode )
        ctx.success(result, '设备会话重置成功')
    }

    // 删除设备会话
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' }) 
    async remove(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.DeviceSessionValidator.checkId(data)

        const result = await this.DeviceSession.resetStatus(ctx, data.id )
        if (result) {
            ctx.success(result, '设备会话删除成功')
        } else {
            ctx.throw(400, '设备会话删除失败')
        }
    }

}