import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { col, fn, literal } from "sequelize";

interface UserCount {
    total: number;
    online: number;
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class StatistcUserService extends BaseService {
    async count() {
        const [ result ] = await this.model.User.findAll({
            attributes: [
                [ fn('COUNT', literal('CASE WHEN isOnline THEN 1 END')), 'online' ],
                [ fn('COUNT', col('userId')), 'total']
            ],
            raw: true
        }) as unknown as UserCount[]

        return result
    }
}