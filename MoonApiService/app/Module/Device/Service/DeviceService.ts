import dayjs from "dayjs";
import { Op, WhereAttributeHash } from "sequelize";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { DeviceActiveLevel, DeviceStatus, EnumUtils, PaymentStatus } from "app/Enum";
import { has, isBoolean, isDate, isEmpty, isNull, isUndefined, pick } from "lodash";
import { BaseService } from "app/Common";
import { Device } from "app/model";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class DeviceService extends BaseService {

    /**
     * 查询或创建设备
     * @param deviceCode 设备码
     * @param deviceUID 设备唯一标识
     * @param userId 用户ID
     * @param version App版本号
     */
    async findOrCreate(
        deviceCode: string,
        deviceUID: string,
        userId: string,
        version: string = '0.0.0',
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(deviceUID)) {
            this.throw(400, '设备唯一标识不能为空')
        }
        if (isEmpty(userId)) {
            this.throw(400, '设备用户ID不能为空')
        }
        if (isEmpty(version)) {
            version = '0.0.0'
        }

        return await this.model.transaction(async (t) => {
            const [ device, isNew ] = await this.model.Device.findOrCreate({
                where: { deviceCode },
                include: [
                    {
                        as: 'active',
                        model: this.model.Active
                    },
                    {
                        as: 'user',
                        model: this.model.User,
                        attributes: ['userId', 'username']
                    }
                ],
                defaults: { deviceCode, deviceUID, userId, version },
                transaction: t
            })

            if (isNew) {
                return device
            }

            if (device.status === DeviceStatus.DISABLED) {
                this.throw(400, '设备已禁用')
            }
            
            if (device.isActive && device.userId !== userId ) {
                this.throw(400, '设备已绑定其他账号，请使用对应账号登录设备')
            }

            // 更新 App 版本号
            if (device.version !== version) {
                device.set('version', version)
            }
            // 更新设备唯一标识
            if (device.deviceUID !== deviceUID) {
                device.set('deviceUID', deviceUID)
            }
            // 绑定到新账号
            if (device.userId !== userId) {
                device.set('userId', userId)
            }

            await device.save({ transaction: t, silent: true })

            return device
        })
    }

    /**
     * 查询设备详情
     * @param deviceCode 设备码
     */
    async findDeviceCode(
        deviceCode: string
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        const device = await this.model.Device.findOne({
            where: { deviceCode },
            include: [
                {
                    as: 'active',
                    model: this.model.Active
                },
                {
                    as: 'user',
                    model: this.model.User,
                    attributes: ['userId', 'username']
                }
            ],
        })
        if (!device) {
            this.throw(400, `设备 ${ deviceCode } 不存在`)
        }
        if (device.status === DeviceStatus.DISABLED) {
            this.throw(400, `设备 ${ deviceCode } 已禁用`)
        }
        return device
    }

    /**
     * 列表查询
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        query: {
            keyword?: string;
            status?: DeviceStatus;
            level?: DeviceActiveLevel;
            userId?: string;
            adminId?: string;
            isActive?: boolean;
            isOnline?: boolean;
            clientIsOnline?: boolean;
            connectedIp?: string;
            payment?: PaymentStatus;
            startTime?: string;
            endTime?: string;
        },
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, [ 'adminId', 'userId', 'status', 'isOnline', 'clientIsOnline' ]) as WhereAttributeHash<Device>

        // 模糊查询设备码与用户名
        if (!isEmpty(query.keyword)) {
            where[Op.or] = [
                { deviceCode: { [Op.like]: `%${ query.keyword }%` }},
                { "$user.username$": { [Op.like]: `%${ query.keyword }%` }},
            ]
        }

        if (!isEmpty(query.connectedIp)) {
            where.connectedIp = { [Op.like]: `%${ query.connectedIp }%`}
        }

        if (isBoolean(query.isActive)) {
            where.activeId = { 
                [ query.isActive ? Op.ne : Op.is ]: null 
            }
        }

        if (!isUndefined(query.level) && EnumUtils.includes(DeviceActiveLevel, query.level)) {
            where['$active.level$'] = query.level
        }

        if (!isUndefined(query.payment) && EnumUtils.includes(PaymentStatus, query.payment)) {
            where['$active.payment$'] = query.payment
        }
        
        if (!isEmpty(query.startTime) && !isEmpty(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where['$active.activeAt$'] = {
                [Op.between]: [ startTime, endTime ]
            }
        }

        const { count, rows } = await this.model.Device.findAndCountAll({
            where,
            include: [
                {
                    as: 'active',
                    model: this.model.Active,
                    attributes: ['activeId', 'deviceCode', 'level', 'activeAt', 'expiredAt', 'payment' ]
                },
                {
                    as: 'user',
                    model: this.model.User,
                    attributes: ['userId', 'username']
                }
            ],
            order: [ ['createdAt', 'DESC'] ],
            offset: ( page - 1 ) * limit,
            limit,
        })

        return {
            page, limit, count, rows
        }

    }

    /**
     * 设置状态
     * @param deviceCode 设备码
     * @param status 状态值
     */
    async setStatus(
        deviceCode: string,
        status: DeviceStatus
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (!EnumUtils.includes(DeviceStatus, status)) {
            this.throw(400, '不支持的状态值')
        }
        const [ count ] = await this.model.Device.update({ status }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置用户
     * @param deviceCode 设备码
     * @param userId 用户账号ID
     */
    async setUserId(
        deviceCode: string,
        userId: string,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(userId)) {
            this.throw(400, '用户账号ID不能为空')
        }
        const [ count ] = await this.model.Device.update({ userId }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置设置端版本
     * @param deviceCode 设备码
     * @param version App版本号
     */
    async setVersion(
        deviceCode: string,
        version: string,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(version)) {
            this.throw(400, 'App 版本号不能为空')
        }
        const [ count ] = await this.model.Device.update({ version }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置客户端版本号
     * @param deviceCode 设备码
     * @param version 版本号
     */
    async setClientVersion(
        deviceCode: string,
        version: string,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(version)) {
            this.throw(400, '客户端版本号不能为空')
        }
        const [ count ] = await this.model.Device.update({
            clientVersion: version
        }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置设备在线状太
     * @param deviceCode 设备码
     * @param onlineStatus 在线状态数据
     */
    async setOnlineStatus(
        deviceCode: string,
        onlineStatus: {
            isOnline: boolean;
            connectedAt?: Date;
            disconnectedAt?: Date | null;
            connectedIp?: string;
        } 
    ) {

        const onlineData = pick(onlineStatus, [
            'isOnline', 'connectedAt', 'disconnectedAt', 'connectedIp'
        ])

        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(onlineData)) {
            this.throw(400, '在线状态数据不能为空')
        }
        if (!isBoolean(onlineData.isOnline)) {
            this.throw(400, '在线状态值错误')
        }
        
        if (onlineData.isOnline) {
            if (!isDate(onlineData.connectedAt)) {
                this.throw(400, '连接时间格式错误')
            }
            if (isEmpty(onlineData.connectedIp)) {
                this.throw(400, '连接IP格式错误')
            }
            onlineData.disconnectedAt = null
        } else {
            if (!isDate(onlineData.disconnectedAt)) {
                this.throw(400, '断开时间格式错误')
            }
            delete onlineData.connectedAt
            delete onlineData.connectedIp
        }

        const [ count ] = await this.model.Device.update(onlineData, {
            where: { deviceCode }
        })

        return count > 0
    }

    /**
     * 设置客户端在线状态
     * @param deviceCode 设备码
     * @param isOnline 是否在线
     */
    async setClientOnlineStatus(
        deviceCode: string,
        isOnline: boolean,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (!isBoolean(isOnline)) {
            this.throw(400, '在线状态不能为空')
        }
        const [ count ] = await this.model.Device.update({
            clientIsOnline: isOnline
        }, {
            where: { deviceCode }
        })
        return count > 0
    }
    
    /**
     * 重置全部在线状态
     */
    async resetAllOnlineStatus() {
        const [ count ] = await this.model.Device.update({
            isOnline: false,
            clientIsOnline: false
        }, {
            where: {
                [Op.or]: [
                    { isOnline: true },
                    { clientIsOnline: true }
                ]
            }
        })
        return count > 0
    }

    /**
     * 解绑用户
     * @param deviceCode 设备码
     * @param adminId 激活人账号ID
     */
    async unbind(
        deviceCode: string,
        userId?: string,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }

        const where = { deviceCode } as WhereAttributeHash<Device>
        if (!isEmpty(userId)) {
            where.userId = userId
        }
        const device = await this.model.Device.findOne({
            where,
            attributes: [ 'deviceCode', 'status' ],
            include: [
                {
                    as: 'active',
                    model: this.model.Active,
                    attributes: ['activeId', 'deviceCode', 'expiredAt' ]
                }
            ]
        })

        if (!device) {
            this.throw(400, `设备 ${deviceCode} 不存在`)
        }
        if (device.isActive) {
            this.throw(400, `设备 ${deviceCode} 已激活`)
        }
        if (device.status === DeviceStatus.DISABLED) {
            this.throw(400, `设备 ${deviceCode} 已禁用`)
        }
        device.set('userId', null)
        await device.save({ silent: true })
    }

    /**
     * 删除
     * @param deviceCode 设备码
     */
    async remove(
        deviceCode: string,
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }

        const device = await this.model.Device.findOne({
            where: { deviceCode },
            attributes: [ 'deviceCode', 'status' ],
            include: [
                {
                    as: 'active',
                    model: this.model.Active,
                    attributes: ['activeId', 'deviceCode', 'expiredAt' ]
                }
            ]
        })
        if (!device) {
            this.throw(400, `设备 ${deviceCode} 不存在`)
        }
        if (device.isActive) {
            this.throw(400, `设备 ${deviceCode} 已激活`)
        }
        if (device.status === DeviceStatus.DISABLED) {
            this.throw(400, `设备 ${deviceCode} 已禁用`)
        }
        await device.destroy()
        return true
    }

}