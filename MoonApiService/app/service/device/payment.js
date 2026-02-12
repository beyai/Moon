'use strict';
const _ = require('lodash')
const dayjs = require('dayjs')
const Service = require('egg').Service;
const { PAYMENT_STATUS, DEVICE_ACTIVE_LEVELS, PAYMENT_TYPES } = require('../../enum');

class PaymentService extends Service {
    
    /** 结算模型 */
    get PaymentModel() {
        return this.app.model.DevicePayment
    }

    get ActiveModel() {
        return this.app.model.DeviceActive
    }

    /** 移机模型 */
    get MoveModel() {
        return this.app.model.DeviceMove
    }

    /**
     * 结算激活记录
     * @param {object} data 查询条件
     * @param {uuid} data.adminId 代理ID
     * @param {date} data.endTime 截止日期
     * @param {Transaction} transaction 事务
     */
    async #paymentActive(data, transaction) {
        const Op = this.app.Sequelize.Op
        const where = {
            payment: PAYMENT_STATUS.UNPAYMENT,
            adminId: data.adminId,
            createdAt: {
                [Op.lte]: dayjs(data.endTime).toDate()
            }
        }

        const updateData = {
            payment: PAYMENT_STATUS.PAYMENTED,
            paymentAt: new Date()
        }

        const result = {
            total: 0,
            count: 0,
            payload: {}
        }

        for (const [_, level ] of Object.entries(DEVICE_ACTIVE_LEVELS)) {
            const [ currentCount ] = await this.ActiveModel.update(updateData, {
                where: {
                    ...where,
                    level,
                },
                transaction
            });
            result.payload[level] = currentCount;
            result['count'] += currentCount
        }

        result['total'] = await this.ActiveModel.count({ 
            where: {
                adminId: where.adminId,
                payment: PAYMENT_STATUS.PAYMENTED,
            }, 
            transaction 
        })
        return result;
    }

    /**
     * 结算移机记录
     * @param {object} data 查询条件
     * @param {uuid} data.adminId 代理ID
     * @param {date} data.endTime 截止日期
     * @param {Transaction} transaction 事务
     */
    async #paymentMove(data, transaction) {
        const Op = this.app.Sequelize.Op
        const where = {
            payment: PAYMENT_STATUS.UNPAYMENT,
            adminId: data.adminId,
            createdAt: {
                [Op.lte]: dayjs(data.endTime).toDate()
            }
        }

        const result = {
            total: 0,
            count: 0,
        }
        const [ currentCount ] = await this.MoveModel.update({
            payment: PAYMENT_STATUS.PAYMENTED,
            paymentAt: new Date()
        }, {
            where,
            transaction
        });

        result.count = currentCount;
        result['total'] = await this.MoveModel.count({
            where: {
                adminId: where.adminId,
                payment: PAYMENT_STATUS.PAYMENTED,
            }, 
            transaction 
        })
        return result;
    }

    /**
     * 结算
     * @param {object} data
     * @param {string} data.type 结算类型
     * @param {uuid} data.adminId 代理商ID
     * @param {Date} data.endTime 截止日期
     */
    async payment(data) {

        if (_.isEmpty(data.type)) {
            this.ctx.throw(412, 'type 不能为空')
        }
        if (_.isEmpty(data.adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        if (_.isEmpty(data.endTime)) {
            this.ctx.throw(412, 'endTime 不能为空')
        }

        if (!Object.values(PAYMENT_TYPES).includes(data.type)) {
            this.ctx.throw(412, 'type 填写不正确')
        }
        
        let t = await this.app.model.transaction();

        let result;
        try {
            // 结算
            if (data.type == PAYMENT_TYPES.ACTIVE) {
                result = await this.#paymentActive(data, t)
            } else if (data.type == PAYMENT_TYPES.MOVE) {
                result = await this.#paymentMove(data, t)
            }

            // 保存结算记录
            await this.PaymentModel.create({
                ...result,
                type: data.type,
                adminId: data.adminId,
                endTime: dayjs(data.endTime).toDate(),
                paymentAt: new Date(),
            }, {
                transaction: t
            })
            await t.commit();
            return true;
        } catch (err) {
            await t.rollback()
            this.ctx.throw(400, `结算失败，请稍后再试`, err)
        }
    }

    /**
     * 结算记录
     * @param {object} data 查询条件
     * @param {string?} data.type 结算类型
     * @param {uuid?} data.adminId 代理商ID
     * @param {number} [page=1] 分页
     * @param {number} [limit=10] 每页记录条数
     */
    async findList(data, page=1, limit=10) {
        const where = _.pick(data, ['type', 'adminId'])
        const { count, rows } = await this.PaymentModel.findAndCountAll({
            where,
            order: [[ 'paymentId', 'DESC' ]],
            offset: ( page - 1 ) * limit,
            limit
        })
        return {
            page, limit, count, rows
        }
    }
}

module.exports = PaymentService;
