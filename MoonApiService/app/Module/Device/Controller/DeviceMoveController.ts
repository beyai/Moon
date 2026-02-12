import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { DeviceMoveService } from "../Service/DeviceMoveService";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType } from "app/Enum";
import { isEmpty } from "lodash";
import dayjs from "dayjs";

@HTTPController({ path: '/system/move' })
@Middleware( AdminAuthMiddleware )
export class DeviceMoveController extends SystemBaseController {

    @Inject()
    private readonly moveService: DeviceMoveService

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, adminId } = this.session
        
        // 代理公显示近15天数据
        if (!isSystem) {
            query.adminId = adminId
            query.startTime = dayjs().subtract(15, 'day').format('YYYY-MM-DD')
            query.endTime   = dayjs().endOf('day').format('YYYY-MM-DD')
        }

        const result = await this.moveService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 移机 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/move' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async moveDevice(
        @Context() ctx: EggContext
    ) {
        const { oldDeviceCode, newDeviceCode  } = ctx.request.body
        if (isEmpty(oldDeviceCode) || isEmpty(newDeviceCode)) {
            ctx.throw(412, `旧设备码或新设备码不能为空`)
        }
        const { isSystem, adminId } = this.session
        await this.moveService.move(oldDeviceCode, newDeviceCode, isSystem ? undefined : adminId)
        ctx.success(true, `成功从 ${ oldDeviceCode } 移至 ${ newDeviceCode }`)
    }

    /** 撤销 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/undo' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async undoMove(
        @Context() ctx: EggContext
    ) {
        const { moveId  } = ctx.request.body
        if (isEmpty(moveId)) {
            ctx.throw(412, `移机记录ID不能为空`)
        }
        await this.moveService.undo(moveId)
        ctx.success(true, `撤销成功`)
    }

}