import _ from 'lodash'
import { Op, Transaction, WhereOptions } from 'sequelize'
import { AbstractService } from "app/Common";
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { Device } from 'app/model/Device';
import dayjs from 'dayjs';
import { DeviceMoveQuery, FindList, PaymentStatus } from 'app/InterFace';
import { DeviceMove } from 'app/model/DeviceMove';

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class DeviceMoveService extends AbstractService {

    get moveExpired() {
        return this.config.moveExpired ?? {
            unit: 'day',
            min: 3,
            max: 30
        }
    }

    async findList(
        ctx: EggContext,
        query: DeviceMoveQuery,
        page: number = 1,
        limit: number = 10,
    ): Promise<FindList<DeviceMove>> {
        const where = _.pick(query, ['adminId', 'payment']) as WhereOptions
        const andConditions: any[] = []

        if (query.deviceCode) {
            andConditions.push({
                [Op.or]: [
                    { oldDeviceCode: { [Op.like]: `%${ query.deviceCode }%`} },
                    { newDeviceCode: { [Op.like]: `%${ query.deviceCode }%`} },
                ]
            })
        }

        if (query.username) {
            andConditions.push({
                [Op.or]: [
                    { newUsername: { [Op.like]: `%${ query.username }%`} },
                    { oldUsername: { [Op.like]: `%${ query.username }%`} },
                ]
            })
        }

        if (andConditions.length > 0) {
            where[Op.and] = andConditions
        }

        // 激活时间 范围查询
        if (_.isString(query.startTime) && _.isString(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where['createdAt'] = {
                [Op.between]: [ startTime, endTime ]
            }
        }
        
        const { count, rows } = await this.model.DeviceMove.findAndCountAll({
            where,
            order: [[ 'createdAt', 'DESC' ]],
            offset: (page - 1) * limit,
            limit
        })

        return {
            count, page, limit, rows
        }
    }

    /**
     * 根据设备码查询设备
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param deepQuery 是否深度查询，包含激活、用户信息
     */
    async findByDeviceCode(
        ctx: EggContext, 
        deviceCode: string,
        transaction?: Transaction
    ): Promise<Device> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }

        const options = {
            where: { deviceCode },
            include: [
                {
                    as: 'active',
                    model: this.model.DeviceActive
                },
                {
                    as: 'user',
                    model: this.model.User
                }
            ]
        }

        if (transaction) {
            options['transaction'] = transaction
            options['lock'] = transaction.LOCK.UPDATE
        }

        const device = await this.model.Device.findOne(options)
        if (!device) {
            ctx.throw(400, '设备不存在')
        }
        return device
    }
    
    /**
     * 激活状态迁移
     * @param ctx 请求上下文
     * @param fromDeviceCode 源设备码
     * @param toDeviceCode 目标设备码
     * @param adminId 代理ID, 限制只允许操作该代理名下的设备
     */
    async move(
        ctx: EggContext,
        fromDeviceCode: string,
        toDeviceCode: string,
        adminId?: string
    ): Promise<boolean> {
        if (!fromDeviceCode) {
            ctx.throw(412, '原设备码不能为空')
        }
        if (!toDeviceCode) {
            ctx.throw(412, '目标设备码不能为空')
        }
        if (fromDeviceCode == toDeviceCode) {
            ctx.throw(412, '设备码不能相同')
        }
        try {
            return await this.model.transaction(async (t) => {
                const fromDevice = await this.findByDeviceCode(ctx, fromDeviceCode, t)
                if (!fromDevice.active) {
                    ctx.throw(400, '未找到该设备激活信息')
                }
                if (!fromDevice.user) {
                    ctx.throw(400, `移机失败，原设备未绑定用户账号`)
                }

                const active = fromDevice.active;
                if (adminId && active.adminId !== adminId ) {
                    ctx.throw(400, '无权限对该设备进行操作')
                }

                const { min, max, unit } = this.moveExpired
                const activeAt      = dayjs(active.activeAt)
                const diff          = dayjs().diff(activeAt, unit)
                const isSaveRecord  = diff > min
                const isTimeout     = diff > max

                // 代理移机超时
                if (adminId && isTimeout) {
                    ctx.throw(400, `移机失败，设备 ${ fromDeviceCode } 超出 ${ max + unit } 移机限制`)
                }

                const toDevice = await this.findByDeviceCode(ctx, toDeviceCode, t)
                if (toDevice.active) {
                    ctx.throw(400, '移机失败，目标设备已激活')
                }
                if (!toDevice.user) {
                    ctx.throw(400, `移机失败，目标设备未绑定用户账号`)
                }

                // 保存移机记录
                if (isSaveRecord) {
                    await this.model.DeviceMove.create({
                        activeId: active.activeId,
                        oldDeviceCode: fromDevice.deviceCode,
                        newDeviceCode: toDevice.deviceCode,
                        oldUsername: fromDevice.user?.username,
                        newUsername: toDevice.user?.username,
                        adminId: active.adminId
                    }, { transaction: t, raw: true })
                }

                // 更新激活信息
                active.set('deviceCode', toDevice.deviceCode)
                await active.save({ transaction: t })

                // 更新新设备信息
                toDevice.set('activeId', active.activeId)
                toDevice.set('adminId', active.adminId)
                await toDevice.save({ transaction: t })

                // 删除旧设备激活信息
                fromDevice.set('activeId', null)
                fromDevice.set('adminId', null)
                await fromDevice.save({ transaction: t })

                return true
            })
        } catch (error) {
            this.logger.error(error)
            ctx.throw(400, (error as Error).message )
        }
    }

    /**
     * 撤销移机
     * @param ctx 请求上下文
     * @param moveId 移机记录ID
     */
    async undo(
        ctx: EggContext,
        moveId: string
    ) {
        if (!moveId) {
            ctx.throw(412, "移机记录ID不能为空")
        }
        try {
            return await this.model.transaction(async (t) => {
                const move = await this.model.DeviceMove.findByPk(moveId, {
                    include: [
                        { 
                            as: 'oldDevice', 
                            model: this.model.Device,
                            attributes: [ 'deviceId', 'deviceCode', 'activeId', 'adminId'],
                        },
                        { 
                            as: 'newDevice', 
                            model: this.model.Device,
                            attributes: [ 'deviceId', 'deviceCode', 'activeId', 'adminId'],
                        },
                        { 
                            as: 'active', 
                            model: this.model.DeviceActive,
                            attributes: [ 'activeId', 'deviceCode', 'adminId'],
                        },
                    ],
                    transaction: t,
                    lock: t.LOCK.UPDATE
                })

                if (!move) {
                    ctx.throw(400, '移机记录不存在')
                }
                if (move.payment === PaymentStatus.PAYMENTED) {
                    ctx.throw(400, '移机记录不可撤销')
                }

                const active        = move.active;
                const fromDevice    = move.oldDevice
                const toDevice      = move.newDevice

                if (!active) {
                    ctx.throw(400, '撤销失败，激活记录不存在')
                }

                if (!fromDevice) {
                    ctx.throw(400, '撤销失败，原设备不存在')
                }
                if (fromDevice.activeId) {
                    ctx.throw(400, "撤销失败，原设备已激活")
                }

                if (!toDevice) {
                    ctx.throw(400, '撤销失败，目标设备不存在')
                }
                if (toDevice.activeId !== active.activeId) {
                    ctx.throw(400, '撤销失败，目标设备与记录的激活信息不匹配')
                }

        
                // 更新激活信息
                active.set('deviceCode', fromDevice.deviceCode)
                await active.save({ transaction: t })

                // 更新原设备
                fromDevice.set("activeId", active.activeId )
                fromDevice.set("adminId", active.adminId )
                await fromDevice.save({ transaction: t })

                // 删除目标设备信息
                toDevice.set("activeId", null )
                toDevice.set("adminId", null )
                await toDevice.save({ transaction: t })
                
                // 删除记录
                await move.destroy({ transaction: t })

                return true
            })
        } catch(error) {
            this.logger.error(error)
            ctx.throw(400, (error as Error).message )
        }


    }
}