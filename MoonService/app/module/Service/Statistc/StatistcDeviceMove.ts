import { AbstractService } from "app/Common";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { PaymentStatus } from "app/InterFace";
import { FindOptions } from "sequelize/types/model";
import { col, fn, literal, Op } from "sequelize";
import dayjs from "dayjs";


interface StatistcMoveData {
    total: number;
    payment: number;
    unpayment: number;
}

interface StatistcMoveDayData {
    date: string;
    count: number
}

@SingletonProto({
    accessLevel: AccessLevel.PRIVATE
})
export class StatistcDeviceMove extends AbstractService {

    /**
     * 激活记录数
     * @param adminId 代理用户ID
     * @param payment 结算状态
     */
    async count(
        adminId?: string,
        payment?: PaymentStatus
    ): Promise<StatistcMoveData> {
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
                [ fn('COUNT', col('moveId')), 'total'],
                [ fn('COUNT', literal(`CASE WHEN payment = ${ PaymentStatus.PAYMENTED } THEN 1 END`)), 'payment'],
                [ fn('COUNT', literal(`CASE WHEN payment = ${ PaymentStatus.UNPAYMENT } THEN 1 END`)), 'unpayment']
            ],
            raw: true
        }
        
        const [ result ] = await this.model.DeviceMove.findAll(options) as unknown as StatistcMoveData[]

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
            createdAt: {
                [Op.between]: [ start.toDate(), end.toDate() ]
            }
        }
        if (adminId) {
            where['adminId'] = adminId
        }

        const result = await this.model.DeviceMove.findAll({
            where,
            attributes: [
                [ fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'), 'date' ],
                [ fn('COUNT', col('moveId')), 'count' ]
            ],
            group: 'date',
            raw: true
        }) as unknown as StatistcMoveDayData[]

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