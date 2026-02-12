import _ from 'lodash'
import dayjs from "dayjs";
import { Op, WhereOptions } from "sequelize";
import { AccessLevel, EggContext, Inject, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { PaymentActive } from "./PaymentActive";
import { PaymentMove } from "./PaymentMove";
import { FindList, PaymentData, PaymentQuery, PaymentType } from "app/InterFace";
import { EggError } from 'egg-errors'
import { DevicePayment } from 'app/model/DevicePayment';

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class PaymentService extends AbstractService {
    @Inject()
    PaymentActive: PaymentActive
    @Inject()
    PaymentMove: PaymentMove

    /**
     * 分页查询记录
     * @param ctx 请求上下文
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        ctx: EggContext,
        query: PaymentQuery,
        page: number = 1,
        limit: number = 10
    ): Promise<FindList<DevicePayment>> {
        const where = {}
        if (query.adminId) {
            where['adminId'] = query.adminId
        }
        if (query.type) {
            where['type'] = query.type
        }

        const { count, rows } = await this.model.DevicePayment.findAndCountAll({
            where,
            order: [[ 'paymentId', 'DESC' ]],
            offset: ( page - 1 ) * limit,
            limit
        })
        return {
            count, page, limit, rows
        }
    }

    /**
     * 查询最后一次结算记录
     * @param ctx 请求上下文
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findLastRecord(
        ctx: EggContext,
        query: PaymentQuery,
        page: number = 1,
        limit: number = 10
    ): Promise<FindList<DevicePayment>>  {
        const where = {}
        if (query.adminId) {
            where['adminId'] = query.adminId
        }
        if (query.type) {
            where['type'] = query.type
        }

        // 查询最新一条记录的时间
        const lastRecord = await this.model.DevicePayment.findOne({
            where,
            order: [[ 'paymentId', 'DESC' ]],
            attributes: ['paymentAt'],
            raw: true
        })

        if (lastRecord) {
            const paymentAt = lastRecord['paymentAt']
            const start = dayjs(paymentAt).startOf('day').toDate()
            const end = dayjs(paymentAt).endOf('day').toDate()
            where['paymentAt'] = {
                [Op.between]: [ start, end ]
            }
        }

        const { count, rows } = await this.model.DevicePayment.findAndCountAll({
            where,
            order: [[ 'paymentId', 'DESC' ]],
        })
        return {
            page, limit, count, rows 
        }
    }

    /**
     * 结算
     * @param ctx 请求上下文
     * @param type 结算类型
     * @param adminId 代理用户ID
     * @param endTime 结算截止日期
     */
    async payment(
        ctx: EggContext,
        type: PaymentType,
        adminId: string,
        endTime: string
    ) {
        if (!type || !PaymentType.values().includes(type)) {
            ctx.throw(412, '结算类型不能为空或填写错误')
        }
        if (!adminId) {
            ctx.throw(412, '结算代理账号ID不能为空')
        }
        if (!endTime) {
            ctx.throw(412, '结算截止日期不能为空')
        }
        
        const endDate = dayjs(endTime)
        if (!endDate.isValid()) {
            ctx.throw(412, '结算截止日期格式不正确')
        }

        try {
            return await this.model.transaction(async (t) => {
                const endTime = endDate.toDate()
                let paymentData: PaymentData
                if (type === PaymentType.ACTIVE) {
                    paymentData = await this.PaymentActive.payment(ctx, adminId, endTime, t)
                } else if (type === PaymentType.MOVE ) {
                    paymentData = await this.PaymentMove.payment(ctx, adminId, endTime, t)
                } else {
                    ctx.throw(400, '结算失败，未知的结算类型')
                }
                if (!paymentData) {
                    ctx.throw(400, '结算失败，请重试')
                }
                paymentData.adminId = adminId;
                paymentData.endTime = endTime;
                paymentData.paymentAt = new Date();

                await this.model.DevicePayment.create(paymentData as any, {
                    transaction: t
                })
            })
        } catch (error) {
            this.logger.error(error)
            let err = error as EggError
            ctx.throw(err.code || 500, err.message)
        }
    }

}