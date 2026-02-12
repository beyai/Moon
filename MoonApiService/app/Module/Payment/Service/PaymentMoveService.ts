import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { PaymentStatus } from "app/Enum";
import { isDate, isEmpty } from "lodash";
import { Op, Transaction } from "sequelize";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class PaymentMoveService extends BaseService {
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
    
            // 结算
            const [ count ] = await this.model.Move.update({
                payment: PaymentStatus.PAYMENTED,
                paymentAt: new Date()
            }, {
                where,
                transaction: transaction
            })

            // 已结算总数
            const total = await this.model.Move.count({
                where: {
                    adminId,
                    payment: PaymentStatus.PAYMENTED
                },
                transaction
            })
    
            return {
                total, count
            }
        }
}