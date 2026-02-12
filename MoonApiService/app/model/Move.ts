import dayjs from "dayjs";
import { AllowNull, BelongsTo, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";
import { PaymentStatus } from "app/Enum";
import { Admin, Device, Active } from "./";

@Table({
    modelName: 'device_move',
    indexes: [
        { fields: [ 'adminId' ] },
    ]
})
export class Move extends Model {
    @PrimaryKey
    @Column({
        type: DataType.STRING(32),
        defaultValue(): string {
            return dayjs().format('YYMMDDHHmmssSSS')
        },
        comment: '移机记录ID',
    })
    moveId: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '激活ID',
    })
    activeId: string

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '旧设备码',
    })
    oldDeviceCode: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '新设备码',
    })
    newDeviceCode: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(30),
        comment: '旧用户名',
    })
    oldUsername: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(30),
        comment: '新用户名',
    })
    newUsername: string;

    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        comment: '移机人ID'
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
    paymentAt: Date | null

    /** 表关联 */

    @BelongsTo(() => Active, {
        as: 'active',
        targetKey: 'activeId',
        foreignKey: 'activeId',
        constraints: false,
    })
    active: Active

    @BelongsTo(() => Device, {
        as: 'oldDevice',
        targetKey: 'deviceCode',
        foreignKey: 'oldDeviceCode',
        constraints: false,
    })
    oldDevice: Device | null

    @BelongsTo(() => Device, {
        as: 'newDevice',
        targetKey: 'deviceCode',
        foreignKey: 'newDeviceCode',
        constraints: false,
    })
    newDevice: Device | null

    @BelongsTo(() => Admin, {
        as: 'admin',
        targetKey: 'adminId',
        foreignKey: 'adminId',
        constraints: false,
    })
    admin: Admin | null

    static associate() {
        // this.sync({ force: true })
    }
}

export default () => Move