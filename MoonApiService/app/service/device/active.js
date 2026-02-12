'use strict';

const _ = require('lodash')
const dayjs = require('dayjs');
const Service = require('egg').Service;
const { STATUS_TYPES, PAYMENT_STATUS, DEVICE_ACTIVE_LEVELS } = require('../../enum');

class ActiveService extends Service {

    /** 激活模型 */
    get ActiveModel() {
        return this.app.model.DeviceActive
    }

    /** 设备模型 */
    get DeviceModel() {
        return this.app.model.Device
    }

    /** 激活有效时长 */
    get activeExpired() {
        return Object.assign({
            value: 1,
            uint: 'year',
        }, this.config.activeExpired)
    }

    /**
     * 激活设备
     * @param {object} data 
     * @param {string} data.deviceCode 设备编码
     * @param {string} data.level 等级
     * @param {number?} data.days 天数
     * @param {string} data.adminId 管理员ID
     * @returns {Promise<boolean>}
     */
    async active(data) {
        if (_.isEmpty(data.deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (_.isEmpty(data.adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        if (!Object.values(DEVICE_ACTIVE_LEVELS).includes(data.level)) {
            this.ctx.throw(412, 'level 填写错误')
        }

        const device = await this.DeviceModel.findOne({
            where: {
                deviceCode: data.deviceCode
            }
        })

        if (!device) {
            this.ctx.throw(400, '设备不存在', data)
        }
        if (device.status !== STATUS_TYPES.NORMAL) {
            this.ctx.throw(400, '设备已被禁用', data)
        }
        if (!device.userId) {
            this.ctx.throw(400, '请先绑定账号', data)
        }
        if (device.activeId) {
            this.ctx.throw(400, '设备已激活', data)
        }

        const t = await this.app.model.transaction();
        try {
            // 激活记录信息
            const activeData = {
                deviceCode: data.deviceCode,
                level: data.level,
                adminId: data.adminId,
                activeAt: dayjs().toDate(), // 激活时间
                expiredAt: null
            }

            // 自己定义天数
            if (_.isNumber(data.days) && data.days > 0) {
                activeData.expiredAt = dayjs().add(data.days, 'day').toDate()
            } else {
                let { value, uint } = this.activeExpired
                activeData.expiredAt = dayjs().add(value, uint).toDate() // 过期时间
            }

            const active = await this.ActiveModel.create(activeData, { transaction: t })

            device.set({
                activeId: active.activeId,
                adminId: active.adminId,
            })
            await device.save({ transaction: t })
            await t.commit()
            return true
        } catch(err) {
            await t.rollback()
            this.ctx.throw(400, '激活失败', { err })
        }


    }

    /**
     * 取消激活
     * - 只从设备中删除 activeId、adminId
     * - 不删除激活记录
     * @param {object} data 
     * @param {string} data.activeId 激活ID
     * @param {string?} data.adminId 管理员ID
     * @returns {Promise<boolean>}
     */
    async unactive(data) {
        if (_.isEmpty(data.activeId)) {
            this.ctx.throw(412, 'activeId 不能为空')
        }
        const device = await this.DeviceModel.findOne({
            where: _.pick(data, ['activeId', 'adminId'])
        })
        if (!device) {
            this.ctx.throw(400, '设备不存在', data)
        }
        if (!device.activeId) {
            this.ctx.throw(400, '设备未激活', data)
        }
        device.set({ activeId: null, adminId: null })
        await device.save()
        return true
    }

    /**
     * 删除激活记录
     * - 仅限超级管理员操作
     * @param {string} activeId 激活ID
     */
    async remove(activeId) {
        if (_.isEmpty(activeId)) {
            this.ctx.throw(412, 'activeId 不能为空')
        }

        const active = await this.ActiveModel.findOne({
            where: { activeId },
            include: [
                {
                    model: this.DeviceModel,
                    as: 'device',
                }
            ]
        })

        if (!active) {
            this.ctx.throw(400, '激活记录不存在', { activeId })
        }
        if (active.payment == PAYMENT_STATUS.PAYMENTED) {
            this.ctx.throw(400, '激活记录不可删除', { activeId })
        }
        const t = await this.app.model.transaction();
        try {
            const device = active.device;
            // 设备activeId 与当前记录相同时，重置设备 activeId, adminId
            if (device && device.activeId == active.activeId) {
                device.set({ activeId: null, adminId: null })
                await device.save({ transaction: t })
            }
            // 删除激活记录
            await active.destroy({ transaction: t })

            await t.commit()
            return true
        } catch(err) {
            await t.rollback()
            this.ctx.throw(400, '删除失败', err)
        }
    }

    /**
     * 列表查询
     * @param {object} data 查询参数
     * @param {string} data.deviceCode 设备编码
     * @param {string} data.adminId 管理员ID
     * @param {string} data.level 等级
     * @param {string} data.status 状态
     * @param {string} data.startTime 开始时间
     * @param {string} data.endTime 结束时间
     * @param {number?} data.payment 结算状态
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @returns {Promise<ActiveModel[]>}
     */
    async findList(data, page = 1, limit = 10) {
        const where = _.pick(data, ['level', 'payment', 'adminId'])
        const Op = this.app.Sequelize.Op
        
        // 设备查询
        if (!_.isEmpty(data.deviceCode)) {
            where.deviceCode = {
                [Op.like]: `%${data.deviceCode}%`
            }
        }
        
        // 激活时间筛选
        if (!_.isEmpty(data.startTime) && !_.isEmpty(data.endTime)) {
            const startTime = dayjs(data.startTime).startOf('day').toDate()
            const endTime = dayjs(data.endTime).endOf('day').toDate()
            where.activeAt = {
                [Op.between]: [ startTime, endTime ]
            }
        }
        console.log(where)
        const { count, rows } = await this.ActiveModel.findAndCountAll({
            where,
            order: [['activeId', 'DESC']],
            offset: (page - 1) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }

}

module.exports = ActiveService;
