import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Unique, Default } from 'sequelize-typescript'

@Table({
    modelName: 'game_mode',
    comment: '游戏默认玩法',
    indexes: [
        { fields: ['gameId' ]}
    ]
})
export class GameMode extends Model {
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column({
        type: DataType.UUID,
        comment: '玩法ID',
    })
    modeId: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(32),
        comment: '玩法名称',
    })
    name: string;

    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        comment: '游戏ID',
    })
    gameId: string;

    @AllowNull(false)
    @Column({
        type: DataType.JSON,
        comment: '玩法配置',
    })
    config: Record<string, any>

    @Column({
        type: DataType.TINYINT.UNSIGNED,
        comment: '玩法状态'
    })
    status: number

    static associate() {
        this.sync({})
    }
}

export default () => GameMode
