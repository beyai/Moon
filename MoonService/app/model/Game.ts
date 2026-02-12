import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Default } from 'sequelize-typescript'

@Table({
    modelName: 'game',
    comment: '游戏',
    indexes: [
    ]
})
export class Game extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({
        type: DataType.UUID,
        comment: '游戏ID',
    })
    gameId: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '游戏名称',
    })
    name: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '游戏别名',
    })
    alias: string;

    @Column({
        type: DataType.STRING(255),
        comment: '游戏图标',
    })
    icon: string;

    static associate() {
        this.sync({})
    }

}

export default () => Game
