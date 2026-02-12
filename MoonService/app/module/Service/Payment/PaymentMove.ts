import {  Op, Transaction } from 'sequelize'
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { PaymentStatus } from 'app/InterFace';

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class PaymentMove extends AbstractService {

    async payment(
        ctx: EggContext,
        adminId: string,
        endTime: Date,
        transaction: Transaction
    ) {

        const where = {
            adminId,
            payment: PaymentStatus.UNPAYMENT,
            createdAt: { [Op.lte]: endTime }
        }

        // 结算
        const [ count ] = await this.model.DeviceMove.update({
            payment: PaymentStatus.PAYMENTED,
            paymentAt: new Date()
        }, {
            where,
            transaction: transaction
        })

        // 总结算
        const total = await this.model.DeviceMove.count({
            where: {
                adminId: adminId,
                payment: PaymentStatus.PAYMENTED,
            },
            transaction: transaction
        })

        // 统计总数
        let payload: Record<string, number> = {}

        return {
            total,
            count,
            payload,
        }
        
    }
}