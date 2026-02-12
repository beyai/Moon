import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { DeviceActiveLevel, PaymentStatus } from "app/Enum";
import { isDate, isEmpty } from "lodash";
import { col, fn, Op, Transaction } from "sequelize";


type LevelCount = {
    count: number;
    level: DeviceActiveLevel
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class PaymentActiveService extends BaseService {
    
    async payment(
        adminId: string,
        paymentTime: Date,
        transaction: Transaction
    ) {
        if (isEmpty(adminId)) {
            this.throw(400, `代理用户ID不能为空`)
        }
        if (!isDate(paymentTime)) {
            this.throw(400, '结算截止时间不能为空')
        }

        const where = {
            adminId,
            payment: PaymentStatus.UNPAYMENT,
            createdAt: {
                [Op.lte]: paymentTime
            }
        }

        const levelCounts = await this.model.Active.findAll({
            where,
            attributes: [
                'level',
                [ fn('COUNT', col('activeId')), 'count' ]
            ],
            group: ['level'],
            transaction,
            raw: true
        }) as unknown as LevelCount[]

        let count = 0;
        let payload: Record<string, number> = {}
        for (const item of levelCounts ) {
            const levelCount =  Number(item.count)
            payload[item.level] = levelCount
            count += levelCount
        }

        // 结算
        const [ affectedRows ] = await this.model.Active.update({
            payment: PaymentStatus.PAYMENTED,
            paymentAt: new Date()
        }, {
            where,
            transaction: transaction
        })

        if (affectedRows !== count ) {
            this.throw(400, `结算失败，请重试`)
        }

        // 已结算总数
        const total = await this.model.Active.count({
            where: {
                adminId,
                payment: PaymentStatus.PAYMENTED
            },
            transaction
        })

        return {
            total, count, payload
        }
    }
}