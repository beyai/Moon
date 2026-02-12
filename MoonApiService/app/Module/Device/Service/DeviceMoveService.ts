import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { DeviceStatus, PaymentStatus } from "app/Enum";
import { Device, Move } from "app/model";
import dayjs from "dayjs";
import { isEmpty, pick } from "lodash";
import { Op, WhereAttributeHash } from "sequelize";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class DeviceMoveService extends BaseService {

    /**
     * 移机过期时间配置
     */
    get moveExpired() {
        return this.config.moveExpired ?? {
            unit: 'day',
            min: 3,
            max: 30,
        }
    }

    /**
     * 查询设备
     * @param deviceCode 设备码
     */
    private async findDeviceCode(deviceCode: string, adminId?: string ) {
        const where = { deviceCode } as WhereAttributeHash<Device>
        if (!isEmpty(adminId)) {
            where.adminId = adminId
        }

        const device = await this.model.Device.findOne({
            where,
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
            ]
        })

        return device
    }

    /**
     * 列表
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     * @returns 
     */
    async findList(
        query: {
            deviceCode?: string;
            username?: string;
            payment?: PaymentStatus;
            adminId?: string;
            startTime?: string;
            endTime?: string;
        } = {},
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, [ 'payment', 'adminId']) as WhereAttributeHash<Move>
        const andConditions: any[] = []

        if (!isEmpty(query.deviceCode)) {
            andConditions.push({
                [Op.or]: [
                    { newDeviceCode: { [Op.like]: `%${ query.deviceCode }%` } },
                    { oldDeviceCode: { [Op.like]: `%${ query.deviceCode }%` } },
                ]
            })
        }

        if (!isEmpty(query.username)) {
            andConditions.push({
                [Op.or]: [
                    { newUsername: { [Op.like]: `%${ query.username }%` } },
                    { oldUsername: { [Op.like]: `%${ query.username }%` } },
                ]
            })
        }
        if (andConditions.length > 0) {
            where[Op.and] = andConditions
        }

        if (!isEmpty(query.startTime) && !isEmpty(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where.createdAt = {
                [Op.between]: [ startTime, endTime ]
            }
        }

        const { count, rows } = await this.model.Move.findAndCountAll({
            where,
            include: [
                {
                    as: 'admin',
                    model: this.model.Admin,
                    attributes: ['adminId', 'username']
                }
            ],
            order: [ [ 'moveId', 'DESC' ] ],
            offset: (page - 1) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 移机
     * @param fromDeviceCode 旧设备码
     * @param toDeviceCode 新设备码
     * @param adminId 激活人ID
     */
    async move(
        fromDeviceCode: string,
        toDeviceCode: string,
        adminId?: string,
    ) {

        if (isEmpty(fromDeviceCode)) {
            this.throw(400, '旧设备码不能为空')
        }

        if (isEmpty(toDeviceCode)) {
            this.throw(400, '新设备码不能为空')
        }

        if (fromDeviceCode === toDeviceCode) {
            this.throw(400, `新旧设备码 ${ toDeviceCode } 不能相同`)
        }
        
        // 旧设备
        const oldDevice = await this.findDeviceCode(fromDeviceCode, adminId);
        this.validateDevice('旧设备', fromDeviceCode, oldDevice)
        if (!oldDevice || !oldDevice.isActive) {
            this.throw(400, `旧设备 ${ fromDeviceCode } 未激活`)
        }

        // 激活记录
        const active = oldDevice.active;
        if (active.adminId !== oldDevice.adminId) {
            this.throw(400, `设备 ${ fromDeviceCode } 没有操作权限`)
        }

        const { unit, min, max } = this.moveExpired
        const activeAt      = dayjs(active.activeAt)
        const diff          = dayjs().diff(activeAt, unit)
        const isSaveRecord  = diff > min
        const isTimeout     = diff > max
        
        // 移机超时
        if (!isEmpty(adminId) && isTimeout) {
            this.throw(400, `设备 ${ fromDeviceCode } 超出 ${max}${unit} 移机限制`)
        }

        // 新设备
        const newDevice = await this.findDeviceCode(toDeviceCode)
        this.validateDevice('新设备', toDeviceCode, newDevice)
        if (!newDevice || newDevice.isActive) {
            this.throw(400, `新设备 ${ toDeviceCode } 已激活`)
        }

        try {
            await this.model.transaction(async (t) => {
                
                // 保存移机记录
                if (isSaveRecord) {
                    await this.model.Move.create({
                        activeId: active.activeId,
                        oldDeviceCode: oldDevice.deviceCode,
                        newDeviceCode: newDevice.deviceCode,
                        oldUsername: oldDevice.user.username,
                        newUsername: newDevice.user.username,
                        adminId: active.adminId
                    }, { transaction: t })
                }

                // 更新激活记录
                active.set('deviceCode', newDevice.deviceCode)
                await active.save({ transaction: t, silent: true })

                // 设置新设备
                newDevice.set('activeId', active.activeId)
                newDevice.set('adminId', active.adminId)
                await newDevice.save({ transaction: t, silent: true })

                // 设置旧设备
                oldDevice.set('activeId', null)
                oldDevice.set('adminId', null)
                await oldDevice.save({ transaction: t, silent: true })

            })
        } catch(err: any) {
            const errMsg = `从 ${fromDeviceCode} 移至 ${toDeviceCode}, 移机失败`
            this.logger.error(errMsg, err.message)
            this.throw(400, errMsg)
        }
    }

    /**
     * 撤销移机
     * @param moveId 移机记录ID
     */
    async undo(
        moveId: string
    ) {
        if (isEmpty(moveId)) {
            this.throw(400, '移机记录ID不能为空')
        }

        const move = await this.model.Move.findByPk(moveId, {
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
                    model: this.model.Active,
                    attributes: [ 'activeId', 'deviceCode', 'adminId'],
                },
            ],
        })

        if (!move) {
            this.throw(400, '移机记录不存在')
        }
        if (move.payment === PaymentStatus.PAYMENTED) {
            this.throw(400, '移机记录不可撤销')
        }

        const active        = move.active;
        const fromDevice    = move.oldDevice
        const toDevice      = move.newDevice

        if (!active) {
            this.throw(400, '设备激活记录不存在')
        }

        if (!fromDevice) {
            this.throw(400, `旧设备 ${ move.oldDeviceCode } 不存在`)
        }
        if (fromDevice.activeId) {
            this.throw(400, `旧设备 ${ move.oldDeviceCode } 已激活`)
        }

        if (!toDevice) {
            this.throw(400, `新设备 ${ move.newDeviceCode } 不存在`)
        }

        if (toDevice.activeId !== active.activeId) {
            this.throw(400, `新设备 ${ move.newDeviceCode } 激活记录信息不匹配`)
        }

        if (toDevice.adminId !== active.adminId) {
            this.throw(400, `新设备 ${ move.newDeviceCode } 操作人不匹配`)
        }
        
        try {
            return await this.model.transaction(async (t) => {
                // 设置激活信息
                active.set('deviceCode', fromDevice.deviceCode)
                await active.save({ transaction: t, silent: true })

                // 设置旧设备
                fromDevice.set('activeId', active.activeId )
                fromDevice.set('adminId', active.adminId )
                await fromDevice.save({ transaction: t, silent: true })

                // 设置新设备
                toDevice.set('activeId', null )
                toDevice.set('adminId', null )
                await toDevice.save({ transaction: t, silent: true })
                
                // 删除记录
                await move.destroy({ transaction: t })
            })
        } catch(error: any) {
            this.throw(400, `移机记录撤销失败`)
        }
    }
    
    /**
     * 验证设备
     * - 验证：是否存在，状态，绑定用户
     */
    private validateDevice(
        type: '旧设备' | '新设备' | '设备',
        deviceCode: string,
        device: Device | null,
    ) {
        if (!device) {
            this.throw(400, `${type} ${ deviceCode } 不存在`)
        }
        if (device.status === DeviceStatus.DISABLED) {
            this.throw(400, `${type} ${ deviceCode } 已禁用`)
        }
        if (!device.user) {
            this.throw(400, `${type} ${ deviceCode } 未绑定用户账号`)
        }
    }
}