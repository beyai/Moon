import { col, fn, Op, Transaction } from 'sequelize'
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { DeviceActiveLevel, PaymentStatus } from 'app/InterFace';

interface LevelCount {
    level: DeviceActiveLevel,
    count: string
}

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class PaymentActive extends AbstractService {

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

        // 结算前统计，按 level 分组
        const levelStats = await this.model.DeviceActive.findAll({
            where,
            attributes: [
                'level',
                [ fn("COUNT", col('activeId')), 'count' ]
            ],
            group: ['level'],
            transaction: transaction,
            raw: true
        }) as unknown as LevelCount[]

        // 统计总数
        let count = 0;
        let payload: Record<string, number> = {}
        for (const item of levelStats ) {
            const levelCount =  Number(item.count)
            payload[item.level] = levelCount
            count += levelCount
        }

        // 结算
        const [ affectedRows ] = await this.model.DeviceActive.update({
            payment: PaymentStatus.PAYMENTED,
            paymentAt: new Date()
        }, {
            where,
            transaction: transaction
        })

        if (affectedRows !== count ) {
            ctx.throw(400, '结算失败，请重试')
        }

        // 总结算
        const total = await this.model.DeviceActive.count({
            where: {
                adminId: adminId,
                payment: PaymentStatus.PAYMENTED,
            },
            transaction: transaction
        })
        
        
        return {
            total,
            count,
            payload,
        }
        
    }
}