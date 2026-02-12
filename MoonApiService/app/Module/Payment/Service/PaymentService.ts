import dayjs from "dayjs";
import { isEmpty, pick } from "lodash";
import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { EnumUtils, PaymentType } from "app/Enum";
import { PaymentActiveService } from "./PaymentActiveService";
import { PaymentMoveService } from "./PaymentMoveService";
import { Op, WhereAttributeHash } from "sequelize";
import { Payment } from "app/model";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class PaymentService extends BaseService {

    @Inject()
    private readonly paymentActive: PaymentActiveService
    @Inject()
    private readonly paymentMove: PaymentMoveService

    /**
     * 结算
     * @param type 结算类型
     * @param adminId 代理用户ID
     * @param endTime 结算截止时间
     */
    async payment(
        type: PaymentType,
        adminId: string,
        endTime: string
    ) {
        if (!EnumUtils.includes(PaymentType, type)) {
            this.throw(400, `不支持的结算类型`)
        }
        if (isEmpty(adminId)) {
            this.throw(400, `代理账号ID不能为空`)
        }
        if (isEmpty(endTime)) {
            this.throw(400, `结算截止时间不能为空`)
        }
        let paymentTime = dayjs(endTime)
        if (!paymentTime.isValid()) {
            this.throw(400, `结算截止时间无效`)
        }
        try {
            await this.model.transaction(async (t) => {
                let payment: Record<string, any> = {}
                if (type === PaymentType.ACTIVE) {
                    payment = await this.paymentActive.payment(adminId, paymentTime.toDate(), t) 
                } else if (type === PaymentType.MOVE) {
                    payment = await this.paymentMove.payment(adminId, paymentTime.toDate(), t) 
                } else {
                    this.throw(400, `不支持的结算类型`)
                }
                payment.type = type
                payment.adminId = adminId
                payment.endTime = paymentTime.toDate()
                payment.paymentAt = new Date()

                await this.model.Payment.create(payment, {
                    transaction: t
                })
            })
        } catch(err: any) {
            this.throw(400, err.message || '结算失败')
        }
    }

    /**
     * 列表查询
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        query: {
            type?: PaymentType;
            adminId?: string;
        },
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, ['type', 'adminId']) as WhereAttributeHash<Payment>
        const { count, rows } = await this.model.Payment.findAndCountAll({
            where,
            order: [ ['paymentId', 'DESC'] ],
            offset: ( page - 1 ) * limit,
            limit
        })
        return {
            page, limit, count, rows
        }
    }

    /**
     * 代理查询最后一次结算日期的数据
     */
    async findLastRecord(
        adminId: string,
        page: number = 1,
        limit: number = 10
    ) {
        if (isEmpty(adminId)) {
            this.throw(400, `代理用户ID不能为空`)
        }
        
        const where = {
            adminId
        } as WhereAttributeHash<Payment>

        const lastRow = await this.model.Payment.findOne({
            where,
            order: [ ['paymentAt', 'DESC' ]],
            attributes: ['paymentAt'],
            raw: true
        })

        if (!lastRow) {
            return {
                page, limit, count: 0, rows: []
            }
        }
        const paymentAt = lastRow.paymentAt
        const startTime = dayjs(paymentAt).startOf('day').toDate()
        const endTime = dayjs(paymentAt).endOf('day').toDate()
        where.paymentAt = {
            [Op.between]: [ startTime, endTime ]
        }

        const { count, rows } = await this.model.Payment.findAndCountAll({
            where,
            order: [ ['paymentAt', 'DESC' ]],
        })

        return {
            page, limit, count, rows
        }
    }


}