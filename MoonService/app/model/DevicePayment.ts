import { AllowNull, AutoIncrement, BelongsTo, Column, DataType, Default, Model, PrimaryKey, Table } from "sequelize-typescript";
import { Admin } from './Admin'
import {  PaymentType } from "app/InterFace";

@Table({
    comment: '激活记录表',
    modelName: 'device_payment',
    timestamps: false,
    indexes: [
        { fields: [ 'type' ] },
        { fields: [ 'adminId' ] },
    ]
})
export class DevicePayment extends Model {
    
    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        comment: '记录ID',
    })
    paymentId: string;

    @AllowNull(false)
    @Default(PaymentType.ACTIVE)
    @Column({
        type: DataType.STRING(10),
        comment: '结算类型'
    })
    type: string

    @AllowNull(false)
    @Default(0)
    @Column({
        type: DataType.INTEGER,
        comment: '总结算数量',
    })
    total: string

    @AllowNull(false)
    @Default(0)
    @Column({
        type: DataType.INTEGER,
        comment: '当前结算数量',
    })
    count: string

    @Column({
        type: DataType.JSON,
        comment: '结算数据',
    })
    payload: Record<string, number>
   

    @AllowNull(false)
    @Column({
        type: DataType.DATE,
        comment: '结算截止日期',
    })
    endTime: Date | null

    @Column({
        type: DataType.DATE,
        comment: '结算时间',
    })
    paymentAt: Date

    /** 表关联 */
    @BelongsTo(() => Admin, {
        as: 'admin',
        targetKey: 'adminId',
        foreignKey: 'adminId',
        constraints: false,
    })
    admin: Admin

    static associate() {
        this.sync({})
    }
}

export default () => DevicePayment