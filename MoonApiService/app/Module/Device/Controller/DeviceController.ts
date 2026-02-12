import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { DeviceService } from "../Service/DeviceService";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType, PaymentStatus } from "app/Enum";
import { DeviceValidator } from "../Validator/DeviceValidator";
import dayjs from "dayjs";
import { isEmpty } from "lodash";

@HTTPController({ path: '/system/device' })
@Middleware( AdminAuthMiddleware )
export class DeviceController extends SystemBaseController {

    @Inject()
    private readonly deviceService: DeviceService
    @Inject()
    private readonly validator: DeviceValidator

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, adminId } = this.session

        // 非代理默认查询已激活且未结算的
        if (!isSystem && isEmpty(query.keyword)) {
            query.isActive = true
            query.payment = PaymentStatus.UNPAYMENT
        }

        const result = await this.deviceService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 设置用户（过户） */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setUser' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async setUser(
        @Context() ctx: EggContext
    ) {
        this.validator.setUser(ctx.request.body)
        const { deviceCode, userId } = ctx.request.body
        const result = await this.deviceService.setUserId(deviceCode, userId)
        if (result) {
            ctx.success(result, '用户设置成功')
        } else {
            ctx.throw(400, '用户设置失败')
        }
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async setStatus(
        @Context() ctx: EggContext
    ) {
        this.validator.setStatus(ctx.request.body)
        const { deviceCode, status } = ctx.request.body
        const result = await this.deviceService.setStatus(deviceCode, status)
        if (result) {
            ctx.success(result, '设备状态设置成功')
        } else {
            ctx.success(result, '设备状态设置失败')
        }
    }

    /** 删除 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async remove(
        @Context() ctx: EggContext
    ) {
        this.validator.deviceCode(ctx.request.body)
        const { deviceCode } = ctx.request.body
        const result = await this.deviceService.remove(deviceCode)
        if (result) {
            ctx.success(result, '设备删除成功')
        } else {
            ctx.success(result, '设备删除失败')
        }
    }

}