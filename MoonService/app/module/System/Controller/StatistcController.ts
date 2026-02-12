import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { StatistcService } from "@/module/Service";
import { AdminType, PaymentStatus } from "app/InterFace";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/statistc' })
@Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
@Middleware(AdminAuthMiddleware)
export class StatistcController extends AbstractSystemController {

    @Inject()
    StatistcService: StatistcService

    // 统计全部总数
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/all' })
    async statistcAll(
        @Context() ctx: EggContext
    ) {
        let query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session
        query.isSystem = isSystem

        if (!isSystem) {
            query.adminId = payload.adminId
            query.payment =  PaymentStatus.UNPAYMENT
        }

        const result = await this.StatistcService.all(ctx, query)
        ctx.success(result)
    }


    // 统计激活记录
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/active' })
    async active(
        @Context() ctx: EggContext
    ) {
        let body = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session

        if (typeof body.dayjs !== 'number') {
            body.dayjs = 7
        }
        if (isSystem && body.adminId) {
            body.adminId = body.adminId
        } else if (!isSystem) {
            body.adminId = payload.adminId
        }

        const result = await this.StatistcService.activeByDays(ctx, body.days, body.adminId )
        ctx.success(result)
    }

    // 统计移机记录
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/move' })
    async move(
        @Context() ctx: EggContext
    ) {
        let body = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session

        if (typeof body.dayjs !== 'number') {
            body.dayjs = 7
        }
        if (isSystem && body.adminId) {
            body.adminId = body.adminId
        } else if (!isSystem) {
            body.adminId = payload.adminId
        }

        const result = await this.StatistcService.moveByDays(ctx, body.days, body.adminId )
        ctx.success(result)
    }
}