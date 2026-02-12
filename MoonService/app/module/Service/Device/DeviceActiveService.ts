import _ from 'lodash'
import { Op, WhereOptions } from 'sequelize'
import { AbstractService } from "app/Common";
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { DeviceActiveData, DeviceActiveLevel, DeviceActiveQuery, DeviceStatus, FindList, PaymentStatus } from 'app/InterFace';
import { Device } from 'app/model/Device';
import dayjs from 'dayjs';
import { DeviceActive } from 'app/model/DeviceActive';

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class DeviceActiveService extends AbstractService {

    /**
     * 查询列表
     * @param ctx 请求上下文
     * @param query 查询条件
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        ctx: EggContext,
        query: DeviceActiveQuery,
        page: number = 1,
        limit: number = 10
    ): Promise<FindList<DeviceActive>> {

        const where = _.pick(query, ['adminId', 'level', 'payment' ]) as WhereOptions

        // 设备查询
        if (query.deviceCode  && !_.isEmpty(query.deviceCode)) {
            where['deviceCode'] = {
                [Op.like] : `%${ query.deviceCode }%`
            }
        }

        // 激活时间 范围查询
        if (_.isString(query.startTime) && _.isString(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where['activeAt'] = {
                [Op.between]: [ startTime, endTime ]
            }
        }
        
        const { count, rows } = await this.model.DeviceActive.findAndCountAll({
            where,
            include: [
                { as: 'admin', model: this.model.Admin }
            ],
            order: [[ 'activeId', 'DESC' ]],
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
    ): Promise<Device> {
        if (!deviceCode) {
            ctx.throw(412, '设备码不能为空')
        }
        const device = await this.model.Device.findOne({ 
            where: { deviceCode },
            include: [
                {
                    as: 'active',
                    model: this.model.DeviceActive
                }
            ]
        })
        if (!device) {
            ctx.throw(400, '设备不存在')
        }
        return device
    }

    /**
     * 激活
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param data 激活信息
     */
    async active(
        ctx: EggContext,
        deviceCode: string,
        data: Pick<DeviceActiveData, 'level' | 'activeAt' | 'expiredAt' | 'adminId'>
    ): Promise<boolean> {
        const { level, activeAt, expiredAt, adminId } = data

        if (level === undefined  || !DeviceActiveLevel.values().includes(level) ) {
            ctx.throw(412, '激活级别不能为空或填写错误')
        }
        if (activeAt === undefined || !_.isDate(activeAt)) {
            ctx.throw(412, '激活时间不能为空或格式不正确')
        }
        if (expiredAt === undefined || !_.isDate(expiredAt)) {
            ctx.throw(412, '过期时间不能为空或格式不正确')
        }
        if (adminId === undefined || !_.isString(adminId)) {
            ctx.throw(412, '激活人ID不能为空或格式不正确')
        }
        
        const device = await this.findByDeviceCode(ctx, deviceCode)

        if (device.status === DeviceStatus.DISABLE) {
            ctx.throw(400, '设备已禁用')
        }
        if (!device.userId) {
            ctx.throw(400, '请先绑定用户账号')
        }
        if (device.isActive) {
            ctx.throw(400, '设备不可重复激活')
        }

        try {
            return await this.model.transaction(async (t) => {
                // 创建激活记录
                const active = await this.model.DeviceActive.create({
                    deviceCode, level, activeAt, expiredAt, adminId
                }, {
                    transaction: t
                })

                // 更新设备激活信息
                device.set('activeId', active.activeId )
                device.set('adminId', adminId )
                await device.save({ transaction: t })
                return true
            })
        } catch(error) {
            this.logger.error(error)
            ctx.throw(400, '激活失败，请重试')
        }
    }

    /**
     * 取消激活
     * - 不删除激活记录
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     * @param adminId 激活人ID
     */
    async unactive(
        ctx: EggContext,
        deviceCode: string,
        adminId?: string
    ): Promise<boolean> {
        const device = await this.findByDeviceCode(ctx, deviceCode)
        if (!device.isActive) {
            ctx.throw(400, '该设备当前未处于激活状态')
        }
        if (adminId && adminId !== device.adminId) {
            ctx.throw(400, '无权取消激活')
        }
        try {
            device.set('activeId', null)
            device.set('adminId', null)
            await device.save()
            return true
        } catch (error) {
            this.logger.error(`取消激活失败`, error)
            ctx.throw(400, '取消激活失败')
        }
    }

    /**
     * 撤销激活
     * - 删除激活记录
     * @param ctx 请求上下文
     * @param activeId 激活记录ID
     */
    async undo(
        ctx: EggContext,
        activeId: string
    ): Promise<boolean> {
        if (!activeId) {
            ctx.throw(412, '激活记录ID不能为空')
        }
        const active = await this.model.DeviceActive.findByPk(activeId, {
            include: [
                { as: 'device', model: this.model.Device }
            ]
        })

        if (!active) {
            ctx.throw(400, '激活记录不存在')
        }
        if (active.payment == PaymentStatus.PAYMENTED) {
            ctx.throw(400, '激活记录不可撤销')
        }

        try {
            return await this.model.transaction(async (t) => {
                // 删除设备上的激活信息
                const device = active.device
                if (device && device.activeId === active.activeId) {
                    device.set('activeId', null)
                    device.set('adminId', null)
                    await device.save({ transaction: t })
                }
                // 删除激活记录
                await active.destroy({ transaction: t })
                return true
            })
        } catch(error) {
            this.logger.error(`撤销激活失败`, error)
            ctx.throw(400, '撤销激活失败，请重试')
        }
    }
}