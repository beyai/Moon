import { GameCutCard, GameTrick } from 'app/Enum';
import { Column, Table, DataType, Model, BelongsTo } from 'sequelize-typescript'
import { randomUUID } from 'crypto';
import { Game } from '.';

@Table({
    modelName: 'game_play',
    comment: '游戏玩法',
    indexes: [
        { fields: [ 'gameId' ]},
        { fields: [ 'deviceCode' ]},
    ]
})
export class GamePlay extends Model {

    @Column({
        primaryKey: true,
        autoIncrement: true,
        type: DataType.INTEGER.UNSIGNED,
        comment: '记录ID',
    })
    id: number
    
    @Column({
        type: DataType.STRING(32),
        unique: true,
        defaultValue: () => randomUUID().replace(/-/g,''),
        comment: '玩法ID',
    })
    playId: string;

    @Column({
        type: DataType.INTEGER.UNSIGNED,
        allowNull: false,
        comment: '游戏ID',
    })
    gameId: number;

    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        comment: '设备码',
    })
    deviceCode: string;

    /**
     * 玩法名称
     * - 自定义名称
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        comment: '玩法名称',
    })
    name: string;

    /**
     * 切牌方式
     * - 不切牌，检测完成后立即分析
     * - 连续切牌，首次等待时间长，后续等待时间短
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: GameCutCard.not,
        comment: '切牌方式',
    })
    cutCard: GameCutCard;

    /**
     * 手法
     * - 目标检测时的手法
     * - 对牌需要根据手法来识别牌的张数
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: GameTrick.shuffle,
        comment: '手法',
    })
    trick: GameTrick;

    /**
     * 是否洗全
     * - 是否需要验证检测结果包含所有用牌
     * - 不开启时，使用最小检测张数验证
     */
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '是否洗全'
    })
    isShuffleFull: boolean;

    /**
     * 用牌定制
     * - 7 bit 二进制数据
     * - 使用 hex 字符串存储
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: "",
        comment: '用牌定制(hex编码)',
        get(this: GamePlay) {
            const value = this.getDataValue('useCards')
            if (!value) return [];
            return Array.from(Buffer.from(value, 'hex'))
        },
        set(this: GamePlay, value: number[]) {
            if (!Array.isArray(value)) {
                this.setDataValue('useCards', '')
                return
            }
            const newValue = Buffer.from(value)
            this.setDataValue('useCards', newValue.toString('hex'))
        }
    })
    useCards: number[];

    /**
     * 玩家人数
     * - 参与游戏的人数
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 2,
        comment: '玩家人数',
    })
    people: number

    /**
     * 手牌数
     * - 每位玩家手上的牌张数
     */
    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        defaultValue: 3,
        comment: '手牌数',
    })
    handCards: number;

    /**
     * 点数设置
     */
    @Column({
        type: DataType.STRING(32),
        allowNull: false,
        defaultValue: "",
        comment: '牌面点数(hex编码)',
        get(this: GamePlay) {
            const value = this.getDataValue('score')
            if (!value) return [];
            return Array.from(Buffer.from(value, 'hex'))
        },
        set(this: GamePlay, value: number[]) {
            if (!Array.isArray(value)) {
                this.setDataValue('score', '')
                return
            }
            const newValue = Buffer.from(value)
            this.setDataValue('score', newValue.toString('hex'))
        }
    })
    score: number[]

    /**
     * 最小检测张数
     * - 目标检测最少需要识别 n 张牌
     * - 人数 * 手牌
     */
    @Column({
        type: DataType.VIRTUAL,
        comment: '最小检测张数',
        get(this: GamePlay) {
            const people = this.getDataValue('people')
            const handCards = this.getDataValue('handCards')
            return handCards * people
        }
    })
    minCards: number

    /**
     * 对牌张数
     * - 根据不同手法动态调整
     */
    @Column({
        type: DataType.VIRTUAL,
        comment: '对牌张数',
        get(this: GamePlay) {
            const trick = this.getDataValue('trick')
            switch (trick) {
                case GameTrick.shuffle:
                    return 2
                default:
                    return 1
            }
        }
    })
    focusNum: number

    @BelongsTo(() => Game, {
        as: 'game',
        targetKey: 'gameId',
        foreignKey: 'gameId',
        constraints: false,
    })
    game: Game

    static associate() {
        // this.sync({ force: true })
    }

}

export default () => GamePlay
