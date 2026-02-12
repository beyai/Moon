import { UserStatus } from 'app/Enum';
import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Unique, Default } from 'sequelize-typescript'


@Table({ modelName: 'user' })
export class User extends Model {

    @PrimaryKey
    @Column({
        type: DataType.UUID,
        defaultValue: DataType.UUIDV4,
        comment: '用户ID',
    })
    userId: string;

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

    @AllowNull(false)
    @Default(false)
    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        comment: '在线状态'
    })
    isOnline: boolean

    @Column({
        type: DataType.DATE,
        comment: '登录时间'
    })
    loginAt: Date | null

    @Default("")
    @Column({
        type: DataType.STRING(255),
        comment: '登录IP'
    })
    loginIp: string

    @AllowNull(false)
    @Default(UserStatus.NORMAL)
    @Column({
        type: DataType.TINYINT,
        comment: '状态 1:正常 0:禁用'
    })
    status: UserStatus

    @AllowNull(false)
    @Default(1)
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        comment: '密码修改统计'
    })
    version: number;

    static associate() {
        // this.sync({
        //     force: true
        // })
    }
}

export default () => User
