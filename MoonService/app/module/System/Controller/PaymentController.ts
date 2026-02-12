import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { AbstractSystemController } from "../Common/AbstractSystemController";
import { PaymentService } from "@/module/Service";
import { AdminType } from "app/InterFace";
import { PaymentValidator } from "app/Validator";
import { AdminAuthMiddleware, AdminTypeMiddleware } from "../Middleware";

@HTTPController({ path: '/system/payment' })
@Middleware(AdminAuthMiddleware)
export class PaymentController extends AbstractSystemController {

    @Inject()
    Payment: PaymentService

    @Inject()
    PaymentValidator: PaymentValidator

    // 结算列表
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM, AdminType.AGENT ]))
    async list(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const { isSystem, payload } = this.session
        if (!isSystem) {
            query.adminId = payload.adminId
        }

        const result = isSystem 
            ? await this.Payment.findList(ctx, query, ctx.page, ctx.limit) 
            : await this.Payment.findLastRecord(ctx, query)

        ctx.success(result)
    }

    // 结算
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/payment' })
    @Middleware(AdminTypeMiddleware([ AdminType.SYSTEM ]))
    async payment(
        @Context() ctx: EggContext
    ) {
        const data = ctx.request.body
        this.PaymentValidator.create(data)

        const result = await this.Payment.payment(ctx, data.type, data.adminId, data.endTime)
        ctx.success(result, '结算完成')
    }

}