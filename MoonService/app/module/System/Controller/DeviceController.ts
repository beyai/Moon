import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { DeviceService } from "@/module/Service";
import { AdminType, PaymentStatus } from "app/InterFace";
import { DeviceValidator } from "app/Validator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/device' })
@Middleware(AdminAuthMiddleware)
export class SystemDeviceController extends AbstractSystemController {
    
    @Inject()
    Device: DeviceService
    @Inject()
    DeviceValidator: DeviceValidator

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async list(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session
        
        // 非系统用户未模糊查询时强制查询已激活且未结算的设备
        if (!isSystem && !query.keyword) {
            query.isActive = true
            query.payment = PaymentStatus.UNPAYMENT
        }

        const result = await this.Device.findList(ctx, query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM  ]))
    async setStatus(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body;
        this.DeviceValidator.setStatus(data)
        const result = await this.Device.setStatus(ctx, data.deviceCode, data.status )
        ctx.success(result, '设备状态更新成功')
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setUser' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async setUser(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body;
        this.DeviceValidator.setUser(data)
        const result = await this.Device.setUserId(ctx, data.deviceCode, data.userId )
        ctx.success(result, '设备过户成功')
    }

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM  ]))
    async remove(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body;
        this.DeviceValidator.remove(data)
        const result = await this.Device.remove(ctx, data.deviceCode)
        ctx.success(result, '设备删除成功')
    }

}