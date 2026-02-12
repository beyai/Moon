import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AdminType } from "app/Enum";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { DeviceActiveService } from "../Service/DeviceActiveService";
import { ActiveValidator } from "../Validator/ActiveValidator";
import dayjs from "dayjs";

@HTTPController({ path: '/system/active' })
@Middleware( AdminAuthMiddleware )
export class DeviceActiveController extends SystemBaseController {

    @Inject()
    private readonly activeService: DeviceActiveService
    @Inject()
    private readonly validator: ActiveValidator

    // 激活默认配置
    private get activeExpired() {
        return this.config.activeExpired ?? {
            unit: 'year',
            value: 1
        }
    }

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
        
        const result = await this.activeService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 激活 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/active' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async activeDevice(
        @Context() ctx: EggContext
    ) {
        this.validator.active(ctx.request.body)
        let { deviceCode, level, adminId, days = 0 } = ctx.request.body
        const { isSystem, adminId: currentAdminId  } = this.session
        if (!isSystem) {
            adminId = currentAdminId
        }

        // 过期时间
        const { unit, value } = this.activeExpired
        let expiredAt = dayjs().add(value, unit)

        // 自定义天数
        const customDays = parseInt(days);
        if (isSystem && Number.isFinite(customDays) && customDays > 0 ) {
            expiredAt = dayjs().add( customDays , 'day')
        }
        
        await this.activeService.active({
            deviceCode,
            level,
            expiredAt: expiredAt.toDate(),
            adminId: adminId,
        })

        ctx.success(true, `设备 ${deviceCode} 激活成功`)
    }

    /** 取消激活 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/unactive' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async unactiveDevice(
        @Context() ctx: EggContext
    ) {
        this.validator.unactive(ctx.request.body)
        const { isSystem, adminId } = this.session
        let { deviceCode } = ctx.request.body
        await this.activeService.unactive(deviceCode, isSystem ? undefined : adminId)
        ctx.success(true, `设备 ${deviceCode} 取消激活成功`)
    }

    /** 撤销 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/undo' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async undoActive(
        @Context() ctx: EggContext
    ) {
        this.validator.undo(ctx.request.body)
        const { activeId } = ctx.request.body
        await this.activeService.undo(activeId)
        ctx.success(true, `成功撤销激活`)
    }
}