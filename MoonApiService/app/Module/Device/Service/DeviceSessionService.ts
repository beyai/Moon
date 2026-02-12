import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { DeviceSessionStatus, DeviceSessionUpdateCountThreshold } from "app/Enum";
import { DeviceSession } from "app/model";
import { isBuffer, isEmpty, pick } from "lodash";
import { Op, WhereAttributeHash } from "sequelize";


@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class DeviceSessionService extends BaseService {

    /**
     * 查询或创建
     * @param sessionData 
     */
    async createOrUpdate(
        deviceUID: string,
        publicKey: Buffer,
        model: string,
    ) {
        if (isEmpty(deviceUID)) {
            this.throw(400, '设备唯一标识不能为空')
        }
        if (isEmpty(model)) {
            this.throw(400, '设备型号不能为空')
        }
        if (isEmpty(publicKey)) {
            this.throw(400, '设备密钥不能为空')
        }
        if (!isBuffer(publicKey)) {
            this.throw(400, '设备密钥格式不正确')
        }

        let session = await this.model.DeviceSession.findOne({
            where: { deviceUID }
        })

        // 创建会话
        if (!session) {
            session = await this.model.DeviceSession.create({
                deviceUID, 
                model,
                publicKey: publicKey.toString('base64')
            })
            return session
        }
        
        // 更新
        session.set('publicKey', publicKey.toString('base64'))
        session.set('model', model)
        session.set('updatedCount', session.updatedCount + 1)

        const { MIN, MAX } = DeviceSessionUpdateCountThreshold
        if (session.updatedCount === MAX) {
            session.set('status', DeviceSessionStatus.LOCKED)
        }
        else if (session.updatedCount === MIN ) {
            session.set('status', DeviceSessionStatus.REVIEW)
        }

        if (session.status === DeviceSessionStatus.LOCKED) {
            this.throw(400, '设备已禁用， 请与我们联系')
        }

        await session.save({ silent: true})

        return session
    }

    /**
     * 列表
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        query: {
            deviceCode?: string;
            status?: DeviceSessionStatus;
            model?: string
        },
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, ['status']) as WhereAttributeHash<DeviceSession>
        if (!isEmpty(query.deviceCode)) {
            where.deviceCode = {
                [Op.like]: `%${ query.deviceCode }%`
            }
        }
        if (!isEmpty(query.model)) {
            where.model = {
                [Op.like]: `%${ query.model }%`
            }
        }
        const { count, rows } = await this.model.DeviceSession.findAndCountAll({
            where,
            attributes: { exclude: ['publicKey'] },
            order: [[ 'id', 'DESC' ] ],
            offset: ( page - 1 ) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 查询设备会话信息
     * @param deviceUID 设备唯一标识
     */
    async findSession(
        deviceUID: string
    ) {
        if (isEmpty(deviceUID)) {
            this.throw(400, '设备唯一标识不能为空')
        }
        const session = await this.model.DeviceSession.findOne({
            where: { deviceUID }
        })
        if (!session || session.status === DeviceSessionStatus.DELETE) {
            this.throw(404, '设备未注册')
        }
        if (session.status === DeviceSessionStatus.LOCKED) {
            this.throw(400, '设备已禁用， 请与我们联系')
        }
        return {
            deviceUID: session.deviceUID,
            deviceCode: session.deviceCode,
            publicKey: Buffer.from(session.publicKey, 'base64')
        }
    }

    /**
     * 重置会话状态
     * @param deviceUID 设备唯一标识
     */
    async resetStatus(
        deviceUID: string,
    ) {
        if (isEmpty(deviceUID)) {
            this.throw(400, '设备唯一标识不能为空')
        }
        const [ count ] = await this.model.DeviceSession.update({
            status: DeviceSessionStatus.NORMAL,
            updatedCount: 1
        },{
            where: { deviceUID }
        })
        return count > 0
    }

    /**
     * 删除
     * @param deviceUID 设备唯一标识
     */
    async remove(
        deviceUID: string
    ) {
        if (isEmpty(deviceUID)) {
            this.throw(400, '设备唯一标识不能为空')
        }
        const [ count ] = await this.model.DeviceSession.update({
            status: DeviceSessionStatus.DELETE,
        },{
            where: { deviceUID }
        })
        return count > 0
    }


}