import { AbstractService } from "app/Common";
import { AccessLevel, EggContext, Inject, SingletonProto } from "@eggjs/tegg";
import { StatistcDevice } from "./StatistcDevice";
import { StatistcDeviceActive } from "./StatistcDeviceActive";
import { StatistcDeviceMove } from "./StatistcDeviceMove";
import { StatistcUser } from "./StatistcUser";
import { PaymentStatus } from "app/InterFace";

interface StatistcAll {
    isSystem?: boolean,
    adminId?: string,
    payment?: PaymentStatus
}

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class StatistcService extends AbstractService {
    @Inject()
    private readonly User: StatistcUser
    @Inject()
    private readonly Device: StatistcDevice
    @Inject()
    private readonly Active: StatistcDeviceActive
    @Inject()
    private readonly Move: StatistcDeviceMove


    /**
     * 统计全部数据
     * @param ctx 请求上下文
     * @param options 查询配置选项
     */
    async all(
        ctx: EggContext,
        query: StatistcAll
    ) {
        if (query.isSystem) {
            return {
                user: await this.User.count(),
                device: await this.Device.count(query.adminId),
                active: await this.Active.count(query.adminId, query.payment),
                move: await this.Move.count(query.adminId, query.payment),
            }
        } else {
            return {
                active: await this.Active.count(query.adminId, query.payment),
                move: await this.Move.count(query.adminId, query.payment),
            }
        }
    }

    /**
     * 按日统计激活记录
     * @param ctx 请求上下文
     * @param days 天数
     * @param adminId 代理用户ID
     */
    async activeByDays(
        ctx: EggContext,
        days?: number,
        adminId?: string,
    ) {
        return await this.Active.countByDays(days, adminId)
    }

    /**
     * 按日统计移机记录
     * @param ctx 请求上下文
     * @param days 天数
     * @param adminId 代理用户ID
     */
    async moveByDays(
        ctx: EggContext,
        days?: number,
        adminId?: string,
    ) {
        return await this.Move.countByDays(days, adminId)
    }

    

}