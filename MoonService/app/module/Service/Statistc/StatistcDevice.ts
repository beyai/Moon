import { AbstractService } from "app/Common";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { col, FindOptions, fn, literal, WhereOptions } from "sequelize";
import { PaymentStatus } from "app/InterFace";

interface StatistcDeviceData {
    total: number;
    active: number;
    unactive: number;
    online: number;
    clientOnline: number;
}

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class StatistcDevice extends AbstractService {
    
    /**
     * 统计总数
     * @param adminId 代理用户ID
     * @returns 
     */
    async count(
        adminId?: string | null
    ): Promise<StatistcDeviceData> {
        const options = {
            attributes: [
                [ fn('COUNT', col('deviceId')), 'total' ],
                [ fn('COUNT', literal('CASE WHEN activeId IS NOT NULL THEN 1 END')), 'active' ],
                [ fn('COUNT', literal('CASE WHEN activeId IS NULL THEN 1 END')), 'unactive' ],
                [ fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online' ],
                [ fn('COUNT', literal('CASE WHEN clientIsOnline THEN 1 END')), 'clientOnline' ],
            ],
            raw: true
        } as FindOptions

        // 统计指定代理用户名下的设备
        if (adminId) {
            options.where = { adminId }
        }

        const [ result ] = await this.model.Device.findAll(options) as unknown as StatistcDeviceData[]
        return result
    }

    


}