import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { Device } from "app/model";
import { isEmpty } from "lodash";
import { col, FindOptions, fn, literal, WhereAttributeHash } from "sequelize";


interface DeviceCount {
    total: number;
    active: number;
    unactive: number;
    online: number;
    clientOnline: number;
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class StatistcDeviceService extends BaseService {
    /**
     * 统计总数
     * @param adminId 代理用户ID
     * @returns 
     */
    async count(
        adminId?: string | null
    ){
        const options: FindOptions = {
            where: isEmpty(adminId) ? undefined : { adminId },
            attributes: [
                [ fn('COUNT', col('deviceId')), 'total' ],
                [ fn('COUNT', literal('CASE WHEN activeId IS NOT NULL THEN 1 END')), 'active' ],
                [ fn('COUNT', literal('CASE WHEN activeId IS NULL THEN 1 END')), 'unactive' ],
                [ fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online' ],
                [ fn('COUNT', literal('CASE WHEN clientIsOnline THEN 1 END')), 'clientOnline' ],
            ],
            raw: true
        }
        const [ result ] = await this.model.Device.findAll(options) as unknown as DeviceCount[]
        return result
    }
}