import dayjs from "dayjs";
import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { DeviceMoveService } from "@/module/Service";
import { AdminType } from "app/InterFace";
import { MoveValidator } from "app/Validator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/move' })
@Middleware(AdminAuthMiddleware)
export class DeviceMoveController extends AbstractSystemController {
    
    @Inject()
    DeviceMove: DeviceMoveService
    @Inject()
    MoveValidator: MoveValidator

    // 列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async list(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session

        // 限制代理用户只允许查看近 30天 记录
        if (!isSystem) {
            query.adminId   = payload.adminId
            query.startTime = dayjs().subtract(15, 'day').startOf('day').format('YYYY-MM-DD')
            query.endTime   = dayjs().endOf('day').format('YYYY-MM-DD')
        }
        const result = await this.DeviceMove.findList(ctx, query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    // 移机
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/move' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async move(
        @Context() ctx: EggContext
    ) {
        const { oldDeviceCode, newDeviceCode } = ctx.request.body
        this.MoveValidator.move({ oldDeviceCode, newDeviceCode })

        const { isSystem, payload } = this.session
        if (!isSystem && !payload?.adminId ) {
            ctx.throw(403, '操作失败，请重新登录')
        }
        const adminId = isSystem ? undefined : payload?.adminId
        const result = await this.DeviceMove.move(ctx, oldDeviceCode, newDeviceCode, adminId)
        ctx.success(result, '移机成功')
    }

    // 撤销
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/undo' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM ]))
    async undo(
        @Context() ctx: EggContext
    ) {
        const { moveId } = ctx.request.body
        this.MoveValidator.undo({ moveId })
        const result = await this.DeviceMove.undo(ctx, moveId)
        ctx.success(result, '撤销移机成功')
    }

}