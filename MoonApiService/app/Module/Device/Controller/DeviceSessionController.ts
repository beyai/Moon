import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { DeviceSessionService } from "../Service/DeviceSessionService";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType } from "app/Enum";
import { isEmpty } from "lodash";

@HTTPController({ path: '/system/session' })
@Middleware( AdminAuthMiddleware, AdminTypeMiddleware( AdminType.SYSTEM ) )
export class DeviceSessionController extends SystemBaseController {

    @Inject()
    private readonly deviceSessionService: DeviceSessionService

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const result = await this.deviceSessionService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 重置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/resetStatus' })
    async resetStatus(
        @Context() ctx: EggContext
    ) {
        const { deviceUID } = ctx.request.body
        if (isEmpty(deviceUID)) {
            ctx.throw(412, '设备唯一标识不能空')
        }
        const result = await this.deviceSessionService.resetStatus(deviceUID)
        if (result) {
            ctx.success(true, '设备会话状态重置成功')
        } else {
            ctx.throw(400, '设备状态重置失败')
        }
    }

    /** 删除 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        const { deviceUID } = ctx.request.body
        if (isEmpty(deviceUID)) {
            ctx.throw(412, '设备唯一标识不能空')
        }
        const result = await this.deviceSessionService.remove(deviceUID)
        if (result) {
            ctx.success(result, '设备会话删除成功')
        } else {
            ctx.throw(400, '设备会话删除失败')
        }
    }
}