import {  Op, Transaction } from "sequelize";
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { ApplicationStatus, DeviceRiskStatus, DeviceRiskThreshold, DeviceSessionQuery } from "app/InterFace";
import { DeviceSession } from "app/model/DeviceSession";

@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class DeviceSessionService extends AbstractService {

    /**
     * 创建或更新
     * @param data 设备长期会话数据
     * @param transaction 事务
     */
    async createOrUpdate(
        data: Pick<DeviceSession, 'deviceUID' | 'publicKey' | 'model'>,
        transaction: Transaction

    ): Promise<DeviceSession> {
        // 查询会话
        let session = await this.model.DeviceSession.findOne({
            where: {
                deviceUID: data.deviceUID
            }
        })
        // 创建会话
        if (!session) {
            return await this.model.DeviceSession.create(data, {
                transaction
            })
        } 

        // 更新
        session.set("publicKey", data.publicKey)
        session.set('model', data.model)

        let updatedCount = session.updatedCount + 1
        session.set('updatedCount', updatedCount)
        if (updatedCount > DeviceRiskThreshold.MAX) {
            session.set('status', DeviceRiskStatus.BLOCKED)
        } else if (updatedCount >= DeviceRiskThreshold.MIN) {
            session.set('status', DeviceRiskStatus.REVIEW)
        }

        await session.save({ transaction })

        return session
    }

    /**
     * 获取当前会话
     * @param ctx 请求上下文
     * @param deviceUID 设备唯一标识
     */
    async findSession(ctx: EggContext, deviceUID: string) {
        const session = await this.model.DeviceSession.findOne({
            where: { deviceUID }
        })

        if (!session || session.status === DeviceRiskStatus.DELETE) {
            ctx.throw(404, '设备未注册')
        }

        if (session.status >= DeviceRiskStatus.BLOCKED) {
            ctx.throw(400, '设备已禁用，请与我们联系')
        }

        return {
            deviceCode: session.deviceCode,
            deviceUID: session.deviceUID,
            publicKey: Buffer.from(session.publicKey, 'base64')
        }
    }

    /**
     * 查询设备会话列表
     * @param ctx 请求上下文
     * @param query 查询参数
     * @param page 
     * @param limit 
     * @returns 
     */
    async findList(
        ctx: EggContext,
        query: DeviceSessionQuery,
        page: number = 1,
        limit: number = 10
    ) {
        let where = {}

        if (query) {
            const { deviceCode, status, model } = query
            if (deviceCode) {
                where['deviceCode'] = { [Op.like]: `%${ deviceCode }%` }
            }
            if (model) {
                where['model'] = { [Op.like]: `${ model }%` }
            }
            if ( typeof status === 'number' && DeviceRiskStatus.values().includes(status)) {
                where['status'] = status
            }
        }
        
        const { count, rows } = await this.model.DeviceSession.findAndCountAll({
            where: where,
            attributes: { exclude: ['publicKey'] },
            order: [['id', 'DESC']],
            offset: ( page - 1 ) * limit,
            limit
        })
        return {
            count, page, limit, rows
        }
    }

    /**
     * 重置状态
     * @param ctx 请求上下文
     * @param deviceCode 设备码
     */
    async resetStatus(
        ctx: EggContext,
        deviceCode: string
    ) {
        const session = await this.model.DeviceSession.findOne({
            where: { deviceCode }
        })
        if (!session) {
            ctx.throw(400, '设备会话记录不存在')
        }
        session.set('status', ApplicationStatus.NORMAL)
        session.set('updatedCount', 1)
        await session.save()
        return true
    }

    /**
     * 删除会话
     */
    async remove(
        ctx: EggContext,
        id: number
    ) {
        const [ count ] = await this.model.DeviceSession.update({
            status: DeviceRiskStatus.DELETE
        }, {
            where: { id }
        })
        return count > 0
    }
    

}