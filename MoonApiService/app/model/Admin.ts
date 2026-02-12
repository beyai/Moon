import { AdminStatus, AdminType } from 'app/Enum';
import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Unique, Default } from 'sequelize-typescript'

@Table({
    modelName: 'admin',
    indexes: [
        { fields: ['username'] }
    ]
})
export class Admin extends Model {
    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        comment: '管理员ID',
    })
    adminId: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(10),
        defaultValue: AdminType.AGENT,
        comment: '管理员类型 system:系统管理员 agent:普通管理员',
    })
    type: string;

    @Unique
    @AllowNull(false)
    @Column({
        type: DataType.STRING(30),
        comment: '用户名',
    })
    username: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(128),
        comment: '密码',
    })
    password: string;

    @Column({
        type: DataType.STRING(255),
        defaultValue: '',
        comment: '备注'
    })
    mark: string

    @Column({
        type: DataType.DATE,
        comment: '登录时间'
    })
    loginAt: Date | null

    @Default('')
    @Column({
        type: DataType.STRING(255),
        comment: '登录IP'
    })
    loginIp: string

    @AllowNull(false)
    @Column({
        type: DataType.TINYINT,
        defaultValue: AdminStatus.NORMAL,
        comment: '状态 1:正常 0:禁用'
    })
    status: AdminStatus

    @AllowNull(false)
    @Default(1)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        comment: '密码修改统计'
    })
    version: number;

    static associate() {
        this.sync({})
    }
}

export default () => Admin
