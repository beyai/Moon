import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { EnumUtils, PaymentStatus } from "app/Enum";
import { Move } from "app/model";
import dayjs from "dayjs";
import { isEmpty } from "lodash";
import { col, FindOptions, fn, literal, Op, WhereAttributeHash } from "sequelize";

type MoveCount = {
    total: number;
    payment: number;
    unpayment: number;
}

type MoveDayCount = {
    date: string;
    count: number
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class StatistcMoveService extends BaseService {
    
    /**
     * 统计总数
     * @param adminId 代理用户ID
     * @param payment 结算类型
     */
    async count(
        adminId?: string,
        payment?: PaymentStatus
    ) {
        const where = {} as WhereAttributeHash<Move>
        if (!isEmpty(adminId)) {
            where.adminId = adminId
        }
        if (EnumUtils.includes(PaymentStatus, payment)) {
            where.payment = payment
        }

        const options: FindOptions = {
            where,
            attributes: [
                [ fn('COUNT', col('activeId')), 'total'],
                [ fn('COUNT', literal(`CASE WHEN payment = ${ PaymentStatus.PAYMENTED } THEN 1 END`)), 'payment'],
                [ fn('COUNT', literal(`CASE WHEN payment = ${ PaymentStatus.UNPAYMENT } THEN 1 END`)), 'unpayment'],
            ],
            raw: true
        }
        const [ result ] = await this.model.Active.findAll(options) as unknown as MoveCount[]
        return result
    }

    /**
     * 日移机数量
     * @param days 天数
     * @param adminId 代理用户ID
     */
    async days(
        days: number = 7,
        adminId?: string
    ) {
        const where = {} as WhereAttributeHash<Move>
        const now = dayjs()
        let start = now.subtract(days - 1, 'day').startOf('day')
        let end = now.endOf('day')
        
        where.createdAt = {
            [Op.between]: [ start.toDate(), end.toDate() ]
        }
        if (!isEmpty(adminId)) {
            where.adminId = adminId
        }

        const result = await this.model.Active.findAll({
            where,
            attributes: [
                [ fn('DATE_FORMAT', col('activeAt'), '%Y-%m-%d'), 'date' ],
                [ fn('COUNT', col('activeId')), 'count' ]
            ],
            group: 'date',
            raw: true
        }) as unknown as MoveDayCount[]

        const obj = result.reduce((tmp, item) => {
            tmp[item.date!] = item.count
            return tmp
        }, {})

        const data = {}
        while (start.valueOf() <= end.valueOf() ) {
            const date = start.format('YYYY-MM-DD')
            data[date] = obj[date] ?? 0
            start = start.add(1, 'day')
        }

        return data
    }
}