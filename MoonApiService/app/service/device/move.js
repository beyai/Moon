'use strict';
const _ = require('lodash')
const dayjs = require('dayjs');
const Service = require('egg').Service;
const { STATUS_TYPES, PAYMENT_STATUS, DEVICE_ACTIVE_LEVELS } = require('../../enum');

class MoveService extends Service {

    /** 设备移机模型 */
    get MoveModel() {
        return this.app.model.DeviceMove
    }

    /** 设备模型 */
    get DeviceModel() {
        return this.app.model.Device
    }

    /** 设备激活模型 */
    get DeviceActiveModel() {
        return this.app.model.DeviceActive
    }

    /** 用户模型 */
    get UserModel() {
        return this.app.model.User
    }

    /** 设备移机过期时间 */
    get moveExpired() {
        return Object.assign({
            min: 3,
            max: 30,
            uint: 'day',
        }, this.config.moveExpired)
    }

    /**
     * 设备移机
     * @param {object} data 
     * @param {string} data.oldDeviceCode 旧设备码
     * @param {string} data.newDeviceCode 新设备码
     * @param {string?} data.adminId 管理员ID
     * @returns {Promise<boolean>}
     */
    async move(data) {
        if (_.isEmpty(data.oldDeviceCode)) {
            this.ctx.throw(412, '旧设备码不能为空')
        }
        if (_.isEmpty(data.newDeviceCode)) {
            this.ctx.throw(412, '新设备码不能为空')
        }
        if (data.oldDeviceCode === data.newDeviceCode) {
            this.ctx.throw(412, '旧设备码和新设备码不能相同')
        }

        const oldDevice = await this.DeviceModel.findOne({
            where: {
                deviceCode: data.oldDeviceCode,
            },
            include: [
                {
                    model: this.DeviceActiveModel,
                    as: 'active',
                },
                {
                    as: 'user',
                    model: this.UserModel,
                    attributes: ['userId', 'username'],
                    required: true
                }
            ],
        })
        if (!oldDevice) {
            this.ctx.throw(400, `旧设备 ${ data.oldDeviceCode } 不存在`, data)
        }
        if (!oldDevice.active) {
            this.ctx.throw(400, `旧设备 ${ data.oldDeviceCode } 未激活`, data)
        }

        // 判断是否为管理员
        if (!_.isEmpty(data.adminId) && oldDevice.active.adminId !== data.adminId) {
            this.ctx.throw(400, `该设备 ${ data.oldDeviceCode } 您不可以操作`, data)
        }

        const newDevice = await this.DeviceModel.findOne({
            where: { deviceCode: data.newDeviceCode },
            include: [
                {
                    as: 'user',
                    model: this.UserModel,
                    attributes: ['userId', 'username'],
                    required: true
                }
            ],
        })
        if (!newDevice) {
            this.ctx.throw(400, `新设备 ${ data.newDeviceCode } 不存在`, data)
        }
        if (newDevice.activeId) {
            this.ctx.throw(400, `新设备 ${ data.newDeviceCode } 已激活`, data)
        }

        // 激活信息
        const active = oldDevice.active
        const { min, max, uint } = this.moveExpired
        const activeAt = dayjs(active.activeAt) // 激活时间
        const diff = dayjs().diff(activeAt, uint) // 激活时间与当前时间的差值

        // 非超级用户操作时，限制移机时间
        if (!_.isEmpty(data.adminId) && diff > max) {
            this.ctx.throw(400, `该设备 ${ data.oldDeviceCode } 超出 ${ max + uint } 移机限制`, data)
        }

        const t = await this.app.model.transaction();

        try {
            // 1. 移机信息
            if (diff > min ) {
                const moveData = {
                    activeId: active.activeId,
                    oldDeviceCode: oldDevice.deviceCode,
                    newDeviceCode: newDevice.deviceCode,
                    oldUsername: oldDevice.user.username,
                    newUsername: newDevice.user.username,
                    adminId: active.adminId
                }
                await this.MoveModel.create(moveData, { transaction: t })
            }
            
            // 2. 更新激活信息
            active.set('deviceCode', newDevice.deviceCode)
            await active.save({ transaction: t })

            // 3. 删除旧设备激活信息
            oldDevice.set({ activeId: null, adminId: null })
            await oldDevice.save({ transaction: t })

            // 4. 更新新设备激活信息
            newDevice.set({ activeId: active.activeId, adminId: active.adminId })
            await newDevice.save({ transaction: t })

            await t.commit();
            return true
        } catch (error) {
            await t.rollback();
            this.ctx.throw(400, '移机失败', error)
        }
    }

    /**
     * 取消移机
     * - 仅支持未支付的移机记录
     * - 仅限超级管理员操作
     * @param {string} moveId 
     */
    async unmove(moveId) {
        if (_.isEmpty(moveId)) {
            this.ctx.throw(412, 'moveId 不能为空')
        }

        const move = await this.MoveModel.findOne({
            where: { moveId },
            include: [
                {
                    as: 'oldDevice',
                    model: this.DeviceModel,
                    attributes: [ 'deviceId', 'deviceCode', 'activeId', 'adminId'],
                    required: true
                },
                {
                    as: 'newDevice',
                    model: this.DeviceModel,
                    attributes: [ 'deviceId', 'deviceCode', 'activeId', 'adminId'],
                    required: true
                },
                {
                    as: 'active',
                    model: this.DeviceActiveModel,
                    attributes: [ 'activeId', 'deviceCode', 'adminId'],
                    required: true
                }
            ],
        })

        if (!move) {
            this.ctx.throw(400, `移机记录 ${ moveId } 不存在`)
        }
        if (move.payment == PAYMENT_STATUS.PAYMENTED) {
            this.ctx.throw(400, `移机记录 ${ moveId } 不可撤销`)
        }

        const oldDevice = move.oldDevice
        const newDevice = move.newDevice
        const active = move.active

        if (oldDevice.activeId) {
            this.ctx.throw(400, `旧设备 ${ oldDevice.deviceCode } 已激活`)
        }
        if (newDevice.activeId !== active.activeId ) {
            this.ctx.throw(400, `设备 ${ newDevice.deviceCode } 激活信息与移机记录${ moveId }不匹配`)
        }

        const t = await this.app.model.transaction();
        try {
            // 1. 更新激活信息
            active.set('deviceCode', oldDevice.deviceCode)
            await active.save({ transaction: t })

            // 2. 撤销新设备激活信息
            newDevice.set({ activeId: null, adminId: null })
            await newDevice.save({ transaction: t })    

            // 3. 更新旧设备激活信息
            oldDevice.set({ activeId: active.activeId, adminId: active.adminId })
            await oldDevice.save({ transaction: t })

            // 4. 删除移机记录
            await move.destroy({ transaction: t })

            await t.commit();
            return true
        } catch (error) {
            await t.rollback();
            this.ctx.throw(400, '撤销移机失败', error)
        }
    }
    
    /**
     * 移机记录列表
     * @param {*} data 搜索条件
     * @param {string} data.deviceCode 设备编码
     * @param {string} data.username 旧设备用户名
     * @param {string} data.adminId 管理员ID
     * @param {number?} data.payment 结算状态
     * @param {Date?} data.startTime 移机时间：开始时间
     * @param {Date?} data.endTime 移机时间：结束时间
     * @param {number} page 页码
     * @param {number} limit 每页数量
     */
    async findList(data, page = 1, limit = 10) {
        const Op = this.app.Sequelize.Op
        const where = _.pick(data, [ 'payment', 'adminId' ])
        const $or = {}

        // 模糊查询设备码
        if (!_.isEmpty(data.deviceCode)) {
            $or['oldDeviceCode'] = $or['newDeviceCode'] = { [Op.like]: `%${ data.deviceCode }%` }
        }
        // 模糊查询用户名
        if (!_.isEmpty(data.username)) {
            $or['oldUsername'] = $or['newUsername'] = { [Op.like]: `%${ data.username }%` }
        }
        if (!_.isEmpty($or)) {
            where[Op.or] = $or
        }

        // 移机时间筛选
        if (!_.isEmpty(data.startTime) && !_.isEmpty(data.endTime)) {
            const startTime = dayjs(data.startTime).startOf('day').toDate()
            const endTime = dayjs(data.endTime).endOf('day').toDate()
            where.createdAt = {
                [Op.between]: [ startTime, endTime ]
            }
        }

        const { count, rows } = await this.MoveModel.findAndCountAll({
            where: where,
            order: [['moveId', 'DESC']],
            offset: ( page - 1 ) * limit,
            limit,
        })

        return {
            page, limit, count, rows
        }
    }
}

module.exports = MoveService;
