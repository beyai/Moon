import dayjs from "dayjs";
import { AllowNull, BelongsTo, Column, DataType, Default, Model, PrimaryKey, Table, Unique } from "sequelize-typescript";
import { DeviceActive } from "./DeviceActive";
import { User } from "./User";
import { Admin } from "./Admin";
import { DeviceActiveLevel, DeviceStatus } from "app/InterFace";

@Table({
    modelName: 'device',
    indexes: [
        { fields: [ 'userId' ] },
        { fields: [ 'adminId' ] },
        { fields: [ 'activeId' ] },
        { fields: [ 'deviceCode' ] },
    ]
})
export class Device extends Model {

    @PrimaryKey
    @Column({
        type: DataType.STRING(32),
        defaultValue(): string {
            return dayjs().format('YYMMDDHHmmssSSS')
        },
        comment: '设备ID',
    })
    deviceId: string;

    @Unique
    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        comment: '设备唯一标识',
    })
    deviceUID: string;

    @Unique
    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '设备码',
    })
    deviceCode: string;

    @Column({
        type: DataType.STRING(32),
        comment: '激活ID'
    })
    activeId: string;

    @Default('0.0.0')
    @Column({
        type: DataType.STRING(32),
        comment: 'App版本号',
    })
    declare version: string;

    @Default('0.0.0')
    @Column({
        type: DataType.STRING(32),
        comment: '客户端版本号',
    })
    clientVersion: string;
    
    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        comment: '设备是否在线'
    })
    isOnline: boolean;
    
    @Default(false)
    @AllowNull(false)
    @Column({
        type: DataType.BOOLEAN,
        comment: '客户端是否在线'
    })
    clientIsOnline: boolean;

    @Column({
        type: DataType.DATE,
        comment: '连接时间'
    })
    connectedAt: Date | null;

    @Column({
        type: DataType.DATE,
        comment: '断开时间'
    })
    disconnectedAt: Date | null;

    @Default('')
    @Column({
        type: DataType.STRING(255),
        comment: '连接IP'
    })
    connectedIp: string;

    @AllowNull(false)
    @Column({
        type: DataType.TINYINT,
        defaultValue: DeviceStatus.NORMAL,
        comment: '状态 1:正常 0:禁用'
    })
    status: number;

    @Column({
        type: DataType.UUID,
        comment: '用户ID'
    })
    userId: string | null;

    @Column({
        type: DataType.UUID,
        comment: '管理员ID'
    })
    adminId: string | null;

    @Column({
        type: DataType.VIRTUAL,
        comment: '是否激活',
        get: function(this: Device): boolean {
            const active = this.getDataValue('active') as DeviceActive
            if (!active) return false;
            const expiredAt = dayjs(active.expiredAt)
            return dayjs().isBefore(expiredAt)
        }
    })
    isActive: boolean;

    @Column({
        type: DataType.VIRTUAL,
        comment: '激活等级',
        get: function(this: Device): string {
            const active = this.getDataValue('active') as DeviceActive
            return active ? active.level : DeviceActiveLevel.HIGH
        }
    })
    activeLevel: string;

    @Column({
        type: DataType.VIRTUAL,
        comment: '激活时间',
        get: function(this: Device): Date | null {
            const active = this.getDataValue('active') as DeviceActive
            return active ? active.activeAt : null
        }
    })
    activeAt: Date | null;

    @Column({
        type: DataType.VIRTUAL,
        comment: '激活剩余天数',
        get: function(this: Device): number {
            const active = this.getDataValue('active') as DeviceActive
            if (!active) return 0
            const now = dayjs()
            const expiredAt = dayjs(active.expiredAt)
            return expiredAt.diff(now, 'day')
        }
    })
    countDays: number;

    /** 表关联 */

    @BelongsTo(() => DeviceActive, {
        as: 'active',
        targetKey: 'activeId',
        foreignKey: 'activeId',
        constraints: false,
    })
    active: DeviceActive | null

    @BelongsTo(() => User, {
        as: 'user',
        targetKey: 'userId',
        foreignKey: 'userId',
        constraints: false,
    })
    user: User | null

    @BelongsTo(() => Admin, {
        as: 'admin',
        targetKey: 'adminId',
        foreignKey: 'adminId',
        constraints: false,
    })
    admin: Admin | null

    static associate() {
        this.sync({})
    }
}

export default () => Device