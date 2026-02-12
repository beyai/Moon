import dayjs from "dayjs";
import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { ActiveValidator } from "app/Validator";
import { DeviceActiveService } from "@/module/Service";
import { AdminType } from "app/InterFace";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";


@HTTPController({ path: '/system/active' })
@Middleware(AdminAuthMiddleware)
export class DeviceActiveController extends AbstractSystemController {
    @Inject()
    private readonly ActiveService: DeviceActiveService
    @Inject()
    private readonly ActiveValidator: ActiveValidator

    // 激活默认配置
    private get activeConfig() {
        return this.config.activeExpired ?? {
            unit: 'year',
            value: 1
        }
    }

    // 激活
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/active' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async active(
        @Context() ctx: EggContext
    ) {

        let { deviceCode, level, adminId, days = 0 } = ctx.request.body

        // 代理账号
        if (!this.session.isSystem) {
            if (!this.session.payload) ctx.throw(403, '激活失败')
            adminId = this.session.payload.adminId
        }

        this.ActiveValidator.active({ deviceCode, level, adminId })

        // 过期时间
        const { unit, value } = this.activeConfig
        let expiredAt = dayjs().add(value, unit)
        
        // 系统管理员可以自定义激活天数
        const customDays = parseInt(days);
        if (this.session.isSystem && !isNaN(customDays) && customDays > 0 ) {
            expiredAt = dayjs().add( customDays , 'day')
        }

        const result = await this.ActiveService.active(ctx, deviceCode, {
            level: level,
            activeAt: new Date(),
            expiredAt: expiredAt.toDate(),
            adminId: adminId,
        })

        ctx.success(result, '激活成功')
    }

    // 取消激活
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/unactive' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async unactive(
        @Context() ctx: EggContext
    ) {
        const params = ctx.request.body
        this.ActiveValidator.unactive(params)
        
        if (!this.session.isSystem) {
            if (!this.session.payload) ctx.throw(403, '取消激活失败')
            params.adminId = this.session.payload.adminId
        }

        const result = await this.ActiveService.unactive(ctx, params.deviceCode, params.adminId)
        ctx.success(result, '已成功取消激活')
    }

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
        const result = await this.ActiveService.findList(ctx, query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    // 撤销
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/undo' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM ]))
    async undo(
        @Context() ctx: EggContext
    ) {
        const params = ctx.request.body
        this.ActiveValidator.undo(params)

        if (!this.session.isSystem) {
            ctx.throw(400, '没有操作权限')
        }
        const result = await this.ActiveService.undo(ctx, params.activeId) 
        ctx.success(result, '成功撤销激活')
    }

}