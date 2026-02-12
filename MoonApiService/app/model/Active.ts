import dayjs from "dayjs";
import { AllowNull, BelongsTo, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";
import { DeviceActiveLevel, PaymentStatus } from "app/Enum";
import { Device, Admin } from "./";

@Table({
    modelName: 'device_active',
    indexes: [
        { fields: [ 'deviceCode' ] },
        { fields: [ 'adminId' ] },
        { fields: [ 'payment' ] },
        { fields: [ 'level' ] },
    ]
})
export class Active extends Model {
    @PrimaryKey
    @Column({
        type: DataType.STRING(32),
        defaultValue(): string {
            return dayjs().format('YYMMDDHHmmssSSS')
        },
        comment: '激活ID',
    })
    activeId: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '设备码',
    })
    deviceCode: string;

    @AllowNull(false)
    @Column({
        type: DataType.DATE,
        comment: '激活时间',
    })
    activeAt: Date

    @AllowNull(false)
    @Default(DeviceActiveLevel.MEDIUM)
    @Column({
        type: DataType.STRING(10),
        comment: '激活级别 low:低 medium:中 high:高',
    })
    level: string

    @AllowNull(false)
    @Column({
        type: DataType.DATE,
        comment: '过期时间',
    })
    expiredAt: Date

    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        comment: '激活人ID'
    })
    adminId: string;

    @Default(PaymentStatus.UNPAYMENT)
    @Column({
        type: DataType.TINYINT,
        comment: '结算状态 1:已结算 0:未结算',
    })
    payment: number

    @Column({
        type: DataType.DATE,
        comment: '结算时间',
    })
    paymentAt: Date

    /** 表关联 */

    @BelongsTo(() => Device, {
        as: 'device',
        targetKey: 'deviceCode',
        foreignKey: 'deviceCode',
        constraints: false,
    })
    device: Device

    @BelongsTo(() => Admin, {
        as: 'admin',
        targetKey: 'adminId',
        foreignKey: 'adminId',
        constraints: false,
    })
    admin: Admin

    static associate() {
        // this.sync({})
        // this.sync({ force: true })
    }
}

export default () => Active