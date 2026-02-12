'use strict';

const _ = require('lodash')
const { randomBytes }  = require("crypto")
const dayjs = require('dayjs');
const Service = require('egg').Service;
const { STATUS_TYPES } = require('../../enum');

class DeviceService extends Service {

    /** 设备模型 */
    get DeviceModel() {
        return this.app.model.Device
    }

    /** 激活模型 */
    get DeviceActiveModel() {
        return this.app.model.DeviceActive
    }

    /** 使用记录 */
    get DeviceUseModel() {
        return this.app.model.DeviceUseRecord
    }

    /** 用户模型 */
    get UserModel() {
        return this.app.model.User
    }

    /**
     * 随机生成一组随机设备码
     * @param {number} size = 5 数量
     * @param {number} len = 9 长度
     * @returns {string[]}
     */
    generateCodes(size = 5, len = 9) {
        let ids = []
        while(size) {
            let bytes = randomBytes(len)
            let id = '0'; // 前导 0
            for (let i = 0; i < len; i++) {
                id += (bytes[i] % 10).toString();
            }
            ids.push(id)
            size--
        }
        return ids
    }

    /**
     * 生成一个唯一设备码
     * @param {number} maxRetries 最大重次次数
     */
    async generateDeviceCode(maxRetries = 5) {
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const codes = this.generateCodes(5)
            const rows = await this.DeviceModel.findAll({
                attributes: [ 'deviceCode' ],
                where: { deviceCode: codes }
            })
            const existingCodes = rows.map(e => e.deviceCode)
            const available = codes.find(code => !existingCodes.includes(code));
            if (available) {
                return available
            }
        }
        this.ctx.throw(400, '设备码生成失败')
    }
    
    /**
     * 注册设备
     * - 不保存设备信息
     * - 老用户保存 deviceUID
     * - 新用户生成唯一 deviceCode
     * @param {object} data
     * @param {string} data.deviceUID
     * @param {string} data.deviceCode
     */
    async register(data) {
        if (_.isEmpty(data.deviceUID)) {
            this.ctx.throw(400, '设备注册失败')
        }

        if (_.isEmpty(data.deviceCode)) {
            return this.generateDeviceCode()
        }

        const device = await this.DeviceModel.findOne({
            attributes: [ 'deviceId', 'deviceUID', 'deviceCode'],
            where: {
                deviceCode: data.deviceCode
            }
        })
        if (!device) {
            return this.generateDeviceCode()
        }
        if (!device.deviceUID) {
            device.set('deviceUID', data.deviceUID)
            await device.save()
        } else if (data.deviceUID != device.deviceUID) {
            this.ctx.throw(400, '设备注册失败')
        }
        return device.deviceCode
    }

    /**
     * 查询或创建设备
     * @param {object} data 设备信息
     * @param {string} data.deviceCode 设备码
     * @param {string} data.userId 用户ID
     * @param {string} data.deviceUID 设备唯一标识
     * @param {string?} data.version App版本号
     * @returns {Promise<DeviceModel>}
     */
    async findOrCreate(data) {
        if (_.isEmpty(data.deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (_.isEmpty(data.userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }

        let transaction = await this.app.model.transaction();
        try {
            // 查询或创建设备
            const [ device ] = await this.DeviceModel.findOrCreate({
                where: { deviceCode: data.deviceCode },
                include: [
                    {
                        as: 'active',
                        model: this.DeviceActiveModel,
                    },
                    {
                        as: 'user',
                        model: this.UserModel,
                        attributes: ['userId', 'username'],
                    },
                ],
                defaults: _.pick(data, ["deviceCode", "deviceUID", 'userId', 'version']),
                transaction,
            })

            // 已激活，且用户ID不匹配
            if (device.activeId && device.userId !== data.userId) {
                this.ctx.throw(400, `设备 ${ data.deviceCode } 不可重复绑定`, data)
            }

            // 更新的App版本号
            if (!_.isEmpty(data.version) && device.version !== data.version) {
                device.set('version', data.version)
            }
            
            // 保存设备唯一标识
            if (!device.deviceUID) {
                device.set('deviceUID', data.deviceUID)
            }

            // 未激活，且用户ID不匹配，设置为新的用户ID
            if (!device.activeId && device.userId != data.userId) {
                device.set('userId', data.userId)
            }

            // 保存更改
            await device.save({ transaction })

            await transaction.commit();
            return device
        } catch (error) {
            await transaction.rollback();
            this.ctx.throw(400, error.message)
        }
    }

    /**
     * 根据设备码查询设备基本信息
     * @param {string} deviceCode 设备码
     * @returns {Promise<DeviceModel>}
     */
    async findByDeviceCode(deviceCode) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        const device = await this.DeviceModel.findOne({
            where: { deviceCode },
        })
        if (!device) {
            this.ctx.throw(400, '设备不存在', { deviceCode })
        }
        return device
    }

    /**
     * 根据设备码查询设备详细信息
     * - 包含：设备基本信息、激活信息、用户信息
     * @param {string} deviceCode 设备码
     * @returns {Promise<DeviceModel>}
     */
    async findDetail(deviceCode) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, '设备码不能为空')
        }
        const device = await this.DeviceModel.findOne({
            where: { deviceCode },
            include: [
                {
                    as: 'active',
                    model: this.DeviceActiveModel,
                },
                {
                    as: 'user',
                    model: this.UserModel,
                    attributes: ['userId', 'username'],
                },
            ],
        })
        return device
    }

    /**
     * 批量查询设备详细
     * @param {string[]} deviceCodes 设备码列表
     */
    async bulkFindDetail(deviceCodes) {
        if (_.isEmpty(deviceCodes)) {
            this.ctx.throw(412, '设备码不能为空')
        }

        const devices = await this.DeviceModel.findAll({
            where: {
                deviceCode: deviceCodes
            },
            include: [
                {
                    as: 'active',
                    model: this.DeviceActiveModel,
                },
                {
                    as: 'useTotal',
                    model: this.DeviceUseModel,
                    required: false,
                    where: {
                        date: dayjs().format('YYYY-MM-DD')
                    }
                }
            ]
        })
        if (_.isEmpty(devices)) {
            this.ctx.throw(400, '设备不存在')
        }
        return devices
    }

    /**
     * 更新设备版本号
     * @param {string} deviceCode 设备码
     * @param {string} version 设备版本号
     */
    async updateVersion(deviceCode, version) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (_.isEmpty(version)) {
            this.ctx.throw(412, 'version 不能为空')
        }
        const [ count ] = await this.DeviceModel.update({ version }, {
            where: { deviceCode },
        })
        return count > 0
    }

    /**
     * 更新客户端版本号
     * @param {string} deviceCode 设备码
     * @param {string} clientVersion 客户端版本号
     */
    async updateClientVersion(deviceCode, clientVersion) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (_.isEmpty(clientVersion)) {
            this.ctx.throw(412, 'clientVersion 不能为空')
        }
        const [ count ] = await this.DeviceModel.update({ clientVersion }, {
            where: { deviceCode },
        })
        return count > 0
    }

    /**
     * 设置在线状态
     * @param {string} deviceCode 设备码
     * @param {object} data 数据
     * @param {boolean} data.isOnline 在线状态
     * @param {string?} data.connectedIp 连接IP
     * @param {number?} data.connectedAt 连接时间
     * @param {number?} data.disconnectedAt 断开时间
     */
    async setDeviceOnline(deviceCode, data) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        // 在线状态数据
        const updateData = _.pick(data, [
            'isOnline', 'connectedIp', 'connectedAt', 'disconnectedAt'
        ])

        const t = await this.app.model.transaction();
        try {
            const [ count ] = await this.DeviceModel.update(updateData, {
                where: { deviceCode },
                lock: t.LOCK.UPDATE,
                transaction: t
            })
            await t.commit();
            return count > 0
        } catch (error) {
            await t.rollback();
            this.ctx.throw(400, error.message)
        }
    }

    /**
     * 设置客户端在线状态
     */
    async setClientOnline(deviceCode, isOnline) {
        if (_.isEmpty(deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        const t = await this.app.model.transaction();
        try {
            const [ count ] = await this.DeviceModel.update({ 
                clientIsOnline: isOnline 
            }, {
                where: { deviceCode },
                lock: t.LOCK.UPDATE,
                transaction: t
            })
            await t.commit();
            return count > 0
        } catch (error) {
            await t.rollback();
            this.ctx.throw(400, error.message)
        }
    }

    /**
     * 设置状态
     * - 代理账号操作时， adminId 不能为空
     * @param {object} data
     * @param {string} data.deviceCode 设备码
     * @param {number} data.status 状态
     * @param {string?} data.adminId 管理员ID
     */
    async setStatus(data) {
        if (_.isEmpty(data.deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (!Object.values(STATUS_TYPES).includes(data.status)) {
            this.ctx.throw(412, 'status 填写错误')
        }

        const [ count ] = await this.DeviceModel.update({ status: data.status }, {
            where: _.pick(data, ['deviceCode', 'adminId']),
        })
        return count > 0
    }
    
    /**
     * 设置用户
     * - 代理账号操作时， adminId 不能为空
     * @param {object} data 
     * @param {string} data.deviceCode 设备码
     * @param {string} data.userId 用户ID
     * @param {string?} data.adminId 管理员ID
     */
    async setUser(data) {
        if (_.isEmpty(data.deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        if (_.isEmpty(data.userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        const [ count ] = await this.DeviceModel.update({ userId: data.userId }, {
            where: _.pick(data, ['deviceCode', 'adminId']),
        })
        return count > 0
    }

    /**
     * 删除设备
     * - 代理账号操作时， adminId 不能为空
     * - 用户账号操作时， userId 不能为空
     * @param {object} data
     * @param {string} data.deviceCode 设备码
     * @param {string?} data.adminId 管理员ID
     * @param {string?} data.userId 用户ID
     */
    async remove(data) {
        if (_.isEmpty(data.deviceCode)) {
            this.ctx.throw(412, 'deviceCode 不能为空')
        }
        const device = await this.DeviceModel.findOne({
            where: _.pick(data, ['deviceCode', 'adminId', 'userId']),
        })
        if (!device) {
            this.ctx.throw(400, '设备不存在', data)
        }
        if (device.activeId) {
            this.ctx.throw(400, '设备已激活，不可删除', data)
        }
        if (device.status == STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, '设备已禁用，不可删除', data)
        }
        await device.destroy()
        return true
    }

    /**
     * 列表查询
     * - 代理账号操作时， adminId 不能为空
     * @param {object} data 
     * @param {uuid?} data.adminId 管理员账号ID
     * @param {uuid?} data.keyword 模糊查询：设备码、用户名
     * @param {uuid?} data.connectedIp 连接IP
     * @param {string?} data.level 激活级别
     * @param {boolean?} data.isActive 是否激活
     * @param {boolean?} data.isOnline 是否在线
     * @param {number?} data.status 状态
     * @param {Date?} data.startTime 激活时间：开始时间
     * @param {Date?} data.endTime 激活时间：结束时间
     * @param {uuid?} data.userId 用户Id
     * @param {number} [page=1] 分页
     * @param {number} [limit=10] 每页记录条数
     */
    async findList(data, page = 1, limit = 10) {
        const Op = this.app.Sequelize.Op
        const deviceWhere = _.pick(data, ['isOnline', 'adminId', 'userId', 'status'])

        // 代理商
        if (!_.isEmpty(data.adminId)) {
            deviceWhere.adminId = {
                [Op.or]: [ data.adminId, null ]
            }
        }

        // 连接IP查询
        if (!_.isEmpty(data.connectedIp)) {
            deviceWhere.connectedIp = { [Op.like]: `%${data.connectedIp}%` }
        }

        // 模糊查询设备码、用户
        if (!_.isEmpty(data.keyword)) {
            deviceWhere[Op.or] = {
                deviceCode: { [Op.like]: `%${data.keyword}%` },
                '$user.username$': { [Op.like]: `%${data.keyword}%` }
            }
        }

        // 是否激活
        if (_.isBoolean(data.isActive)) {
            deviceWhere.activeId = data.isActive ? { [Op.ne]: null } : { [Op.is]: null }
        }

        // 查询激活状态
        if (_.isEmpty(data.keyword) && _.isNumber(data.payment)) {
            deviceWhere['$active.payment$'] =  data.payment
        }

        // 激活级别
        if (!_.isEmpty(data.level)) {
            deviceWhere['$active.level$'] = data.level
        }

        // 激活时间 范围查询
        if (!_.isEmpty(data.startTime) && !_.isEmpty(data.endTime)) {
            const startTime = dayjs(data.startTime).startOf('day').toDate()
            const endTime = dayjs(data.endTime).endOf('day').toDate()
            deviceWhere['$active.activeAt$'] = {
                [Op.between]: [ startTime, endTime ]
            }
        }
        

        const { count, rows } = await this.DeviceModel.findAndCountAll({
            where: deviceWhere,
            include: [
                {
                    as: 'active',
                    model: this.DeviceActiveModel,
                },
                {
                    as: 'user',
                    model: this.UserModel,
                    attributes: ['userId', 'username'],
                }
            ],
            offset: (page - 1) * limit,
            limit,
            order: [ ['createdAt', 'DESC'] ],
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 取消绑定
     * @param {string} deviceCode 设备码
     */
    async unbind(deviceCode) {
        const device = await this.findDetail(deviceCode)
        if (!device) {
            this.ctx.throw(400, '设备不存在')
        }
        if (!device.userId) {
            this.ctx.throw(400, '设备未绑定账号')
        }
        if (device.isActive || device.status == STATUS_TYPES.DISABLE) {
            this.ctx.throw(400, '解绑失败')
        }
        device.set('userId', null)
        await device.save();
        return true;
    }

    /**
     * 检查试用时长限制
     * @param {string} deviceCode 设备码
     */
    async checkUseTime(deviceCode) {
        const key = `use:${ deviceCode }`
        const count = await this.app.cache.get(key)
        const unActiveMaxUseSec = this.config.unActiveMaxUseSec || 1500
        if (count && count >= unActiveMaxUseSec ) {
            const ttl = await this.app.cache.getTTL(key)
            this.ctx.throw(400, ttl <= 0 ? `该设备已被禁止试用！` : `已累计达到最大试用时长限制, 请等待 ${ Math.ceil(ttl / 60) }分钟，欢迎再次试用！`)
        }
    }

    /**
     * 重置全部在线状态
     */
    async resetOnlineStatus() {
        const Op = this.app.Sequelize.Op
        const where = {
            [Op.or]: {
                isOnline: true,
                clientIsOnline: true
            }
        }
        const [count] = await this.DeviceModel.update({
            isOnline: false,
            clientIsOnline: false
        }, {
            where
        })
        return count
    }

    /**
     * 根据deviceUID禁用设备
     */
    async disabledByDeviceUID(deviceUID) {
        const [ count ] = await this.DeviceModel.update({
            status: STATUS_TYPES.DISABLE,
        }, {
            where: { deviceUID }
        })
        return count > 0
    }

}

module.exports = DeviceService;
