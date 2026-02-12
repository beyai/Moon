import _ from 'lodash'
import { Op, WhereOptions } from 'sequelize'
import dayjs from 'dayjs';
import { AbstractService } from "app/Common";
import { Device } from 'app/model/Device';
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { DeviceData, DeviceQuery, DeviceStatus, FindList, PaymentStatus } from 'app/InterFace';

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class DeviceService extends AbstractService {

    /**
     * 包含激活信息与用户信息
     */
    private get includeActiveAndUser() {
        return [
            {
                as: 'active',
                model: this.model.DeviceActive
            },
            {
                as: 'user',
                model: this.model.User,
                attributes: ['userId', 'username']
            }
        ]
    }

    /**
     * 根据设备码查询设备基本信息
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param deepQuery 是否深度查询，包含激活、用户信息
     */
    async findByDeviceCode(
        ctx: EggContext, 
        deviceCode: string, 
        deepQuery: boolean = false 
    ): Promise<Device> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        const device = await this.model.Device.findOne({ 
            where: { deviceCode },
            include: deepQuery ? this.includeActiveAndUser : undefined
        })
        if (!device) {
            ctx.throw(400, '设备不存在')
        }
        return device
    }

    /**
     * 查询列表
     * @param ctx 请求上下文
     * @param query 查询条件
     * @param page 页码
     * @param limit 分页长度
     * @returns 设备列表
     */
    async findList(
        ctx: EggContext,
        query: DeviceQuery,
        page: number = 1,
        limit: number = 10
    ): Promise<FindList<Device>> {
        const where = _.pick(query, [
            'isOnline', 'clientIsOnline', 'adminId', 'userId', 'status'
        ]) as WhereOptions
        
        // 模糊查询设备码与用户名
        if (_.isString(query.keyword) && !_.isEmpty(query.keyword)) {
            where[Op.or] = [
                { deviceCode: { [Op.like]: `%${ query.keyword }%` } },
                { "$user.username$": { [Op.like]: `%${ query.keyword }%` } }
            ]
        }

        // 代理
        if (_.isString(query.adminId) && !_.isEmpty(query.adminId)) {
            where['adminId'] = {
                [Op.or]: [ query.adminId, null ]
            }
        }
        // 连接IP
        if (_.isString(query.connectedIp) && !_.isEmpty(query.connectedIp)) {
            where['connectedIp'] = {
                [Op.like]: `%${ query.connectedIp }%`
            }
        }

        // 是否激活
        if (query.isActive !== undefined && _.isBoolean(query.isActive)) {
            where['activeId'] = { 
                [ query.isActive ? Op.ne : Op.is ]: null 
            }
        }

        // 激活级别
        if (query.level != undefined && _.isString(query.level)) {
            where['$active.level$'] = query.level
        }

        // 是否结算
        if (query.payment !== undefined && PaymentStatus.values().includes(query.payment)) {
            where['$active.payment$'] = query.payment
        }

        // 激活时间 范围查询
        if (_.isString(query.startTime) && _.isString(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where['$active.activeAt$'] = {
                [Op.between]: [ startTime, endTime ]
            }
        }

        const { count, rows } = await this.model.Device.findAndCountAll({
            where,
            include: this.includeActiveAndUser,
            order: [ ['createdAt', 'DESC'] ],
            offset: ( page - 1 ) * limit,
            limit,
        })

        return {
            count,
            page,
            limit,
            rows
        }
    }

    /**
     * 绑定设备
     * @param ctx 请求上下文
     * @param data 设备数据
     */
    async bind(
        ctx: EggContext, 
        data: Pick<DeviceData, 'deviceCode' | 'deviceUID' | 'userId' | 'version'>
    ): Promise<Device> {
        const { deviceCode, deviceUID, userId, version = '0.0.0' } = data
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (!deviceUID) {
            ctx.throw(412, '设备唯一标识不能为空')
        }
        if (!userId) {
            ctx.throw(412, '用户ID不能为空')
        }
        let transaction = await this.model.transaction()

        try {
            const  [ device, isNew ] = await this.model.Device.findOrCreate({
                where: { deviceCode },
                include: this.includeActiveAndUser,
                defaults: { deviceCode, deviceUID, userId, version  },
                transaction: transaction
            })

            if (!isNew) {

                if (device.status === DeviceStatus.DISABLE) {
                    throw new Error(`手机已禁用，请与我们联系`)
                }

                // 设备已激活，且 userId 不一致
                if (device.isActive && device.userId != userId ) {
                    throw new Error(`手机已绑定到其他账号`)
                }
                // 更新App版本号
                device.version !== version && device.set('version', version)
                // 保存设备唯一标识
                !device.deviceUID && device.set('deviceUID', deviceUID)
                // 绑定到新的用户
                device.userId !== userId && device.set('userId', userId) 

                // 更新设置
                await device.save({ transaction: transaction })
            }

            await transaction.commit()
            return device
        } catch(error) {
            console.log(error)
            await transaction.rollback()
            ctx.throw(400, (error as Error).message)
        }
    }

    /**
     * 取消绑定
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     */
    async unbind(
        ctx: EggContext,
        deviceCode: string
    ): Promise<boolean> {
        const device = await this.findByDeviceCode(ctx, deviceCode)
        if (device.activeId) {
            ctx.throw(400, '设备已激活，不可解绑')
        }
        if (device.status === DeviceStatus.DISABLE) {
            ctx.throw(400, '设备已禁用，不可解绑')
        }
        device.set('userId', null)
        await device.save()
        return true
    }

    /**
     * 设置用户ID
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param userId 用户ID
     */
    async setUserId(
        ctx: EggContext, 
        deviceCode: string, 
        userId: string
    ): Promise<boolean> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (!userId) {
            ctx.throw(412, '用户ID不能空')
        }
        const [ count ] = await this.model.Device.update({ userId }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置版本号
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param version App版本号
     */
    async setVersion(
        ctx: EggContext, 
        deviceCode: string, 
        version: string
    ): Promise<boolean> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (!version) {
            ctx.throw(412, 'App版本号不能为空')
        }
        const [ count ] = await this.model.Device.update({ version }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置客户端版本号
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param clientVersion 客户端版本号
     */
    async setClientVersion(
        ctx: EggContext, 
        deviceCode: string, 
        clientVersion: string
    ): Promise<boolean> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (!clientVersion) {
            ctx.throw(412, '客户端版本号不能为空')
        }
        const [ count ] = await this.model.Device.update({ clientVersion }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置状态
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param status 状态码
     */
    async setStatus(
        ctx: EggContext, 
        deviceCode: string, 
        status: DeviceStatus
    ): Promise<boolean> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if ( [ DeviceStatus.NORMAL, DeviceStatus.DISABLE ].includes(status) === false ) {
            ctx.throw(412, '设备状态码不正确')
        }
        const [ count ] = await this.model.Device.update({ status }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 设置在线状态
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param data 在线状态数据
     */
    async setOnlineStatus(
        ctx: EggContext, 
        deviceCode: string, 
        data: Pick<DeviceData, 'connectedAt' | 'disconnectedAt' | 'isOnline' | 'connectedIp'> 
    ) {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (!data) {
            ctx.throw(412, '在线状态不能为空')
        }
        if (typeof data.isOnline !== 'boolean') {
            ctx.throw(412, '在线状态值错误')
        }
        const [ count ] = await this.model.Device.update(data, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 重置所有在线状态
     * @param ctx 请求上下文
     */
    async resetAllOnlineStatus(
        ctx: EggContext
    ): Promise<boolean> {
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
     * 设置客户端在线状态
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param data 在线状态数据
     */
    async setClinetOnlineStatus(
        ctx: EggContext, 
        deviceCode: string, 
        isOnline: boolean
    ): Promise<boolean> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        if (typeof isOnline !== 'boolean') {
            ctx.throw(412, '在线状态值错误')
        }
        const [ count ] = await this.model.Device.update({
            clientIsOnline: isOnline
        }, {
            where: { deviceCode }
        })
        return count > 0
    }

    /**
     * 删除设备
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     */
    async remove(
        ctx: EggContext,
        deviceCode: string
    ): Promise<boolean> {
        const device = await this.findByDeviceCode(ctx, deviceCode)
        if (device.activeId) {
            ctx.throw(400, '设备已激活，不可删除')
        }
        if (device.status === DeviceStatus.DISABLE) {
            ctx.throw(400, '设备已禁用，不可删除')
        }
        await device.destroy()
        return true
    }

}