import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { StatistcActiveService } from "../Service/StatistcActiveService";
import { StatistcMoveService } from "../Service/StatistcMoveService";
import { StatistcDeviceService } from "../Service/StatistcDeviceService";
import { StatistcUserService } from "../Service/StatistcUserService";
import { AdminType, PaymentStatus } from "app/Enum";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";


@HTTPController({ path: '/system/statistc' })
@Middleware( AdminAuthMiddleware, AdminTypeMiddleware( AdminType.AGENT, AdminType.SYSTEM ))
export class StatistcController extends SystemBaseController {
    @Inject()
    private readonly statistcActive: StatistcActiveService
    @Inject()
    private readonly statistcMove: StatistcMoveService
    @Inject()
    private readonly statistcDevice: StatistcDeviceService
    @Inject()
    private readonly statistcUser: StatistcUserService

    /** 查询全部 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/all' })
    async countAll(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)

        const { isSystem, adminId } = this.session
        if (isSystem) {
            const result = {
                user: await this.statistcUser.count(),
                device: await this.statistcDevice.count(query.adminId),
                active: await this.statistcActive.count(query.adminId),
                move: await this.statistcActive.count(query.adminId)
            }

            ctx.success(result)
        } else {
            const result = {
                active: await this.statistcActive.count(adminId, PaymentStatus.UNPAYMENT),
                move: await this.statistcActive.count(adminId, PaymentStatus.UNPAYMENT)
            }
            ctx.success(result)
        }
    }

    /** 激活 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/active' })
    async activeCount(
        @Context() ctx: EggContext
    ) {
        let { days = 7, adminId } = ctx.filterEmpty(ctx.request.body)
        const { isSystem } = this.session
        if (!isSystem) {
            adminId = this.session.adminId
        }
        days = Number(days)
        if (!Number.isFinite(days)) {
            days = 7
        }
        const result = await this.statistcActive.days(days, adminId)
        ctx.success(result)
    }

    /** 移机 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/move' })
    async moveCount(
        @Context() ctx: EggContext
    ) {
        let { days = 7, adminId } = ctx.filterEmpty(ctx.request.body)
        const { isSystem } = this.session
        if (!isSystem) {
            adminId = this.session.adminId
        }
        days = Number(days)
        if (!Number.isFinite(days)) {
            days = 7
        }
        const result = await this.statistcMove.days(days, adminId)
        ctx.success(result)
    }
}