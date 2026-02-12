import { AbstractService } from "app/Common";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { col, fn, literal } from "sequelize";

interface StatistcUserData {
    // 总数
    total: number;
    // 在线人数
    online: number;
}

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class StatistcUser extends AbstractService {
    async count(): Promise<StatistcUserData> {
        const [ result ] = await this.model.User.findAll({
            attributes: [
                [ fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online' ],
                [ fn('COUNT', col('userId')), 'total']
            ],
            raw: true
        }) as unknown as StatistcUserData[]

        return result
    }
}

