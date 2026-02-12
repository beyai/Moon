'use strict';

const _ = require('lodash')
const dayjs = require('dayjs');
const Service = require('egg').Service;
const { PAYMENT_STATUS } = require('../enum');

class StatistcService extends Service {

    get UserModel() {
        return this.app.model.User
    }

    get DeviceModel() {
        return this.app.model.Device
    }

    get ActiveModel() {
        return this.app.model.DeviceActive
    }

    get MoveModel() {
        return this.app.model.DeviceMove
    }

    /**
     * 用户统计
     */
    async userCount() {
        const { literal, fn, col  } = this.app.Sequelize;
        const [ result ] = await this.UserModel.findAll({
            attributes: [
                [fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online'],
                [fn('COUNT', col('userId')), 'total'],
            ],
            raw: true
        })
        return result;
    }

    /**
     * 设备统计：设备总数，当前激活
      * @param {object} query
     * @param {uuid} query.adminId 代理ID
     */
    async deviceCount(query) {
        const { literal, fn, col } = this.app.Sequelize;
        const where = _.pick(query, ['adminId']);
        let [ result ] = await this.DeviceModel.findAll({
            where,
            attributes: [
                [fn('COUNT', col('deviceId')), 'total'],
                [fn('COUNT', literal('CASE WHEN activeId IS NULL THEN 1 END')), 'unactive'],
                [fn('COUNT', literal('CASE WHEN activeId IS NOT NULL THEN 1 END')), 'active'],
                [fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online'],
            ],
            raw: true
        })
        return result;
    }

    /**
     * 激活记录统计：总激活、已结算、激活级别
     * @param {object} query
     * @param {uuid} query.adminId 代理ID
     * @param {number} query.payment 结算状态
     */
    async activeCount(query) {
        const { literal, fn, col } = this.app.Sequelize;
         const where = _.pick(query, ['adminId', 'payment'])
        let [ result ] = await this.ActiveModel.findAll({
            where,
            attributes: [
                [fn('COUNT', col('activeId')), 'total'],
                [fn('COUNT', literal(`CASE WHEN payment = ${ PAYMENT_STATUS.PAYMENTED } THEN 1 END`)), 'payment'],
                [fn('COUNT', literal(`CASE WHEN payment = ${ PAYMENT_STATUS.UNPAYMENT } THEN 1 END`)), 'unpayment']
            ],
            raw: true
        })
        return result;
    }

    /**
     * 移机记录统计：总移机，已结算
     * @param {object} query
     * @param {uuid} query.adminId 代理ID
     * @param {number} query.payment 结算状态
     */
    async moveCount(query) {
        const { literal, fn, col } = this.app.Sequelize;
         const where = _.pick(query, ['adminId', 'payment'])
        let [ result ] = await this.MoveModel.findAll({
            where,
            attributes: [
                [fn('COUNT', col('moveId')), 'total'],
                [fn('COUNT', literal(`CASE WHEN payment = ${ PAYMENT_STATUS.PAYMENTED } THEN 1 END`)), 'payment'],
                [fn('COUNT', literal(`CASE WHEN payment = ${ PAYMENT_STATUS.UNPAYMENT } THEN 1 END`)), 'unpayment']
            ],
            raw: true
        })
        return result;
    }

    /**
     * 激活记录按天统计
     * @param {object} data
     * @param {number} data.days 天数
     * @param {uuid} data.adminId 代理ID
     */
    async activeByDay(data={}) {
        const { Op, literal, fn, col } = this.app.Sequelize;

        const now = dayjs()
        const days = data.days || 7;
        let startDay = now.subtract(days - 1, 'day').startOf('day')
        let endDay = now.endOf('day')
        
        const where = _.pick(data, ['adminId'])
        where.activeAt = {
            [Op.between]: [ startDay.toDate(), endDay.toDate() ]
        }

        let result = await this.ActiveModel.findAll({
            where,
            attributes: [
                [fn('DATE_FORMAT',col('activeAt'), '%Y-%m-%d'), 'date'],
                [fn('COUNT', col('activeId')), 'count']
            ],
            group: 'date',
            raw: true
        })

        result = result.reduce((tmp, item) => {
            tmp[item.date] = item.count;
            return tmp;
        }, {})

        const countData = {}
        while (startDay.valueOf() <= endDay.valueOf() ) {
            const dateStr = startDay.format('YYYY-MM-DD');
            countData[dateStr] = result[dateStr] ?? 0
            startDay = startDay.add(1, 'day'); // 移动到下一天
        }
        return countData

    }

    /**
     * 移机记录按天统计
     * @param {object} data
     * @param {number} data.days 天数
     * @param {uuid} data.adminId 代理ID
     */
    async moveByDay(data={}) {
        const { Op, literal, fn, col } = this.app.Sequelize;

        const now = dayjs()
        const days = data.days || 7;
        let startDay = now.subtract(days - 1, 'day').startOf('day')
        let endDay = now.endOf('day')
        const where = _.pick(data, ['adminId'])
        where.createdAt = {
            [Op.between]: [ startDay.toDate(), endDay.toDate() ]
        }
       

        let result = await this.MoveModel.findAll({
            where,
            attributes: [
                [fn('DATE_FORMAT',col('createdAt'), '%Y-%m-%d'), 'date'],
                [fn('COUNT', col('moveId') ), 'count']
            ],
            group: 'date',
            raw: true
        })

        result = result.reduce((tmp, item) => {
            tmp[item.date] = item.count;
            return tmp;
        }, {})

        const countData = {}
        while (startDay.valueOf() <= endDay.valueOf() ) {
            const dateStr = startDay.format('YYYY-MM-DD');
            countData[dateStr] = result[dateStr] ?? 0
            startDay = startDay.add(1, 'day'); // 移动到下一天
        }

        return countData
    }

}

module.exports = StatistcService;
