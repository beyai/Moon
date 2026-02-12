import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { DeviceActiveLevel, EnumUtils, PaymentStatus } from "app/Enum";
import { Active, Device } from "app/model";
import dayjs from "dayjs";
import { isDate, isEmpty, pick } from "lodash";
import { Op, WhereAttributeHash } from "sequelize";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class DeviceActiveService extends BaseService {

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
            level?: DeviceActiveLevel;
            payment?: PaymentStatus;
            adminId?: string;
            startTime?: string;
            endTime?: string;
        } = {},
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, [ 'payment', 'level', 'adminId']) as WhereAttributeHash<Active>

        if (!isEmpty(query.deviceCode)) {
            where.deviceCode = { [Op.like]: `%${ query.deviceCode }%` }
        }

        if (!isEmpty(query.startTime) && !isEmpty(query.endTime)) {
            const startTime = dayjs( query.startTime ).startOf('day').toDate()
            const endTime   = dayjs( query.endTime ).endOf('day').toDate()
            where.activeAt = {
                [Op.between]: [ startTime, endTime ]
            }
        }

        const { count, rows } = await this.model.Active.findAndCountAll({
            where,
            include: [
                {
                    as: 'admin',
                    model: this.model.Admin,
                    attributes: ['adminId', 'username']
                }
            ],
            order: [ [ 'activeId', 'DESC' ] ],
            offset: (page - 1) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }

    }

    /**
     * 激活设备
     * @param params 参数
     * @param params.deviceCode 设备码
     * @param params.level 级别
     * @param params.adminId 激活人账号ID
     * @param params.expiredAt 到期日期
     * @returns 
     */
    async active(params: {
        deviceCode: string, 
        level: DeviceActiveLevel,
        adminId: string,
        expiredAt: Date,
    }) {

        if (isEmpty(params.deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (!EnumUtils.includes(DeviceActiveLevel, params.level)) {
            this.throw(400, '不支持激活级别')
        }
        if (isEmpty(params.adminId)) {
            this.throw(400, '激活人账号ID不能为空')
        }
        if (!params.expiredAt || !isDate(params.expiredAt)) {
            this.throw(400, '到期日期格式不正确')
        }

        const device = await this.findDeviceCode(params.deviceCode)
        if (!device) {
            this.throw(400, `设备${ params.deviceCode }不存在`)
        }
        if (device.isActive) {
            this.throw(400, `设备 ${ params.deviceCode } 已激活`)
        }
        if (!device.user) {
            this.throw(400, `设备 ${ params.deviceCode } 未绑定用户账号`)
        }

        try {
            await this.model.transaction(async (t) => {
                // 保存激活记录
                const active = await this.model.Active.create({
                    deviceCode: params.deviceCode,
                    level: params.level,
                    adminId: params.adminId,
                    expiredAt: params.expiredAt,
                    activeAt: new Date(),
                    payment: PaymentStatus.UNPAYMENT
                }, { transaction: t })

                // 关联激活ID
                device.set('activeId', active.activeId)
                device.set('adminId', active.adminId)
                await device.save({ silent: true, transaction: t })
            })
        } catch(err: any) {
            this.logger.error(`设备 %s 激活失败：`, params.deviceCode, err)
            this.throw(400, `设备 ${ params.deviceCode } 激活失败`)
        }
    }

    /**
     * 设备取消激活
     * @param deviceCode 设备码
     * @param adminId 激活人
     */
    async unactive(
        deviceCode: string,
        adminId?: string
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        const device = await this.findDeviceCode(deviceCode, adminId)
        if (!device) {
            this.throw(400, `设备 ${ deviceCode} 不存在`)
        }
        if (!device.isActive) {
            this.throw(400, `设备 ${ deviceCode} 未激活或已到期`)
        }
        
        device.set('activeId', null)
        device.set('adminId', null)
        await device.save({ silent: true })
    }

    /**
     * 撤销激活
     * @param activeId 激活记录ID
     */
    async undo(
        activeId: string
    ) {
        if (isEmpty(activeId)) {
            this.throw(400, '激活记录不能为空')
        }

        const active = await this.model.Active.findByPk(activeId, {
            include: [
                {
                    as: 'device',
                    model: this.model.Device
                }
            ]
        })

        if (!active) {
            this.throw(400, '激活记录不存在')
        }

        if (active.payment === PaymentStatus.PAYMENTED) {
            this.throw(400, '激活记录不可撤销')
        }
        
        try {
            await this.model.transaction(async (t) => {
                const device = active.device
                if (device) {
                    device.set('activeId', null)
                    device.set('adminId', null)
                    await device.save({ silent: true, transaction: t })
                }

                await active.destroy({ transaction: t })
            })
        } catch (err: any) {
            this.logger.error(`撤销激活失败`)
            this.throw(400, '撤销激活失败')
        }
    }
}