import { GameStatus, GameType } from 'app/Enum';
import { Column, Table, DataType, Model, AllowNull } from 'sequelize-typescript'

@Table({
    modelName: 'game',
    comment: '游戏',
    indexes: [
        { fields: ['type'] }
    ]
})
export class Game extends Model {
    
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
        comment: '游戏ID',
    })
    gameId: string;

    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: GameType.getLabel(GameType.dezhou),
        comment: '游戏名称',
    })
    name: string;

    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: GameType.dezhou,
        comment: '游戏类型',
    })
    type: string;

    @Column({
        type: DataType.STRING(255),
        allowNull: true,
        comment: '游戏图标',
    })
    icon: string;

    /**
     * 手牌数
     * - 当前游戏手牌数量
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: '手牌数',
    })
    handCards: number;

    /**
     * 用牌定制
     * - 当前游戏默认用牌
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        comment: '用牌定制',
        get() {
            const value = this.getDataValue('useCards')
            return Array.from(Buffer.from(value, 'hex'))
        },
        set(this: Game, value: number[]) {
            this.setDataValue('useCards', value)
            const newValue = Buffer.from(value)
            this.setDataValue('useCards', newValue.toString('hex'))
        }
    })
    useCards: number[];

    /**
     * 状态
     */
    @Column({
        type: DataType.TINYINT.UNSIGNED,
        allowNull: false,
        defaultValue: GameStatus.NORMAL,
        comment: '状态',
    })
    status: GameStatus

    static associate() {
        this.sync({
            force: false
        })
    }
}

export default () => Game
