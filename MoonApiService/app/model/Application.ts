import { ApplicationStatus } from 'app/Enum';
import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Unique, Default, AutoIncrement, UpdatedAt } from 'sequelize-typescript'

@Table({
    modelName: 'application',
    updatedAt: false,
})
export class Application extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        comment: '记录ID',
    })
    id: number;

    @AllowNull(false)
    @Unique
    @Column({
        type: DataType.STRING(20),
        comment: '版本号',
    })
    version: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(255),
        comment: '密钥',
    })
    secretKey: string;

    @AllowNull(false)
    @Default(ApplicationStatus.NORMAL)
    @Column({
        type: DataType.TINYINT.UNSIGNED,
        comment: '状态 1:正常 0:禁用'
    })
    status: ApplicationStatus

    static associate() {
        this.sync({})
    }
}

export default () => Application
