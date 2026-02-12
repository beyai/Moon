import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { DeviceActiveLevel, EnumUtils, PaymentStatus } from "app/Enum";
import { Active } from "app/model";
import dayjs from "dayjs";
import { isEmpty } from "lodash";
import { col, FindOptions, fn, literal, Op, WhereAttributeHash } from "sequelize";

interface ActiveCount {
    total: number;
    payment: number;
    unpayment: number;
    low: number;
    medium: number;
    high: number;
}

interface ActiveDayCount {
    date: string;
    count: number
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class StatistcActiveService extends BaseService {
    
    /**
     * 统计总数
     * @param adminId 代理用户ID
     * @param payment 结算类型
     */
    async count(
        adminId?: string,
        payment?: PaymentStatus
    ) {
        const where = {} as WhereAttributeHash<Active>
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
                [ fn('COUNT', literal(`CASE WHEN level = "${ DeviceActiveLevel.LOW }" THEN 1 END`)), DeviceActiveLevel.LOW ],
                [ fn('COUNT', literal(`CASE WHEN level = "${ DeviceActiveLevel.HIGH }" THEN 1 END`)), DeviceActiveLevel.HIGH ],
                [ fn('COUNT', literal(`CASE WHEN level = "${ DeviceActiveLevel.MEDIUM }" THEN 1 END`)), DeviceActiveLevel.MEDIUM ],
            ],
            raw: true
        }
        const [ result ] = await this.model.Active.findAll(options) as unknown as ActiveCount[]
        return result
    }

    /**
     * 日激活数量
     * @param days 天数
     * @param adminId 代理用户ID
     */
    async days(
        days: number = 7,
        adminId?: string
    ) {
        const where = {} as WhereAttributeHash<Active>
        const now = dayjs()
        let start = now.subtract(days - 1, 'day').startOf('day')
        let end = now.endOf('day')
        
        where.activeAt = {
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
        }) as unknown as ActiveDayCount[]

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