import { AbstractService } from "app/Common";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { Op, col, FindOptions, fn, literal } from "sequelize";
import { DeviceActiveLevel, PaymentStatus } from "app/InterFace";
import dayjs from "dayjs";

interface StatistcActiveData {
    total: number;
    payment: number;
    unpayment: number;
    low: number;
    medium: number;
    high: number;
}

interface StatistcActiveDayData {
    date: string;
    count: number
}

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class StatistcDeviceActive extends AbstractService {

    /**
     * 激活记录数
     * @param adminId 代理用户ID
     * @param payment 结算状态
     */
    async count(
        adminId?: string,
        payment?: PaymentStatus
    ): Promise<StatistcActiveData> {
        let where = {}
        if (adminId != undefined ) {
            where['adminId'] = adminId
        }
        if (payment !== undefined && PaymentStatus.values().includes(payment)) {
            where['payment'] = payment
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

        const [ result ] = await this.model.DeviceActive.findAll(options) as unknown as StatistcActiveData[]
        return result
    }

    /**
     * 按天统计
     * @param days 统计天数
     * @param adminId 代理用户ID
     */
    async countByDays(
        days: number = 7,
        adminId?: string
    ): Promise<Record<string, any>> {
        const now = dayjs()
        let start = now.subtract(days - 1, 'day').startOf('day')
        let end = now.endOf('day')

        const where = {
            activeAt: {
                [Op.between]: [ start.toDate(), end.toDate() ]
            }
        }
        if (adminId) {
            where['adminId'] = adminId
        }

        const result = await this.model.DeviceActive.findAll({
            where,
            attributes: [
                [ fn('DATE_FORMAT', col('activeAt'), '%Y-%m-%d'), 'date' ],
                [ fn('COUNT', col('activeId')), 'count' ]
            ],
            group: 'date',
            raw: true
        }) as unknown as StatistcActiveDayData[]

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