import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { PaymentService } from "../Service/PaymentService";
import { PaymentValidator } from "../Validator/PaymentValidator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "app/Module/SystemMiddleware";
import { AdminType } from "app/Enum";

@HTTPController({ path: '/system/payment' })
@Middleware( AdminAuthMiddleware )
export class PaymentController extends SystemBaseController {
    @Inject()
    private readonly paymentService: PaymentService
    @Inject()
    private readonly validator: PaymentValidator

    /** 结算 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/payment' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM) )
    async payment(
        @Context() ctx: EggContext
    ) {
        this.validator.payment(ctx.request.body)
        const { adminId, type, endTime } = ctx.request.body
        await this.paymentService.payment(type, adminId, endTime)
        ctx.success(true, '结算成功')
    }

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware( AdminTypeMiddleware(AdminType.SYSTEM, AdminType.AGENT) )
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, adminId } = this.session
        if (isSystem) {
            const result = await this.paymentService.findList(query, ctx.page, ctx.limit )
            ctx.success(result)
        } else {
            const result = await this.paymentService.findLastRecord(adminId, ctx.page, ctx.limit )
            ctx.success(result)
        }

    }

}