import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { EnumUtils, GameCutCard, GameTrick } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GamePlayValidator extends BaseValidator {

    private readonly RULES = {

        playId: {
            type: 'string',
            message: {
                required: '玩法ID不能为空',
            }
        },

        gameId: {
            type: 'id',
            message: {
                required: '游戏ID不能为空',
                id: '游戏ID填写错误',
            }
        },

        deviceCode: {
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },

        name: {
            type: 'string',
            max: 16,
            message: {
                required: '玩法名称不能为空',
                max: '玩法名称最多 16 个字符',
            }
        },

        cutCard: {
            type: 'enum',
            values: EnumUtils.values(GameCutCard),
            message: {
                required: '切牌类型不能为空',
                enum: '切牌类型填写错误'
            }
        },

        trick: {
            type: 'enum',
            values: EnumUtils.values(GameTrick),
            message: {
                required: '手法类型不能为空',
                enum: '手法类型填写错误'
            }
        },

        isShuffleFull: {
            type: 'boolean',
            message: {
                required: '洗牌是否需要洗全不能为空',
                boolean: '洗牌是否需要洗全填写错误'
            }
        },

        useCards: {
            type: 'array',
            itemType: 'int',
            min: 7,
            max: 7,
            rule: {
                min: 0,
                max: 255,
            },
            message: {
                required: '用牌设置不能为空',
                array: '用牌设置错误',
                item: '用牌设置数值范围错误(0~255)',
            }
        },

        score: {
            type: 'array',
            itemType: 'int',
            min: 0,
            message: {
                item: '牌面分数填写错误'
            }
        },

        people: {
            type: 'int',
            min: 1,
            message: {
                required: '玩家人数不能为空',
                int: '玩家人数最少 1 人'
            }
        },

        handCards: {
            type: 'int',
            min: 2,
            message: {
                required: '手牌数量不能为空',
                int: '手牌数量最少 2 张'
            }
            
        },
    }

    createGamePlay(data: unknown) {
        const { 
            gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards 
        } = this.RULES
        this.validate(data, {
            gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards
        })
    }

    updateGamePlay(data: unknown) {
        const { 
            playId, gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards 
        } = this.RULES
        this.validate(data, {
            playId, gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards 
        })
    }

    removeGamePlay(data: unknown) {
        const { playId } = this.RULES
        this.validate(data, { playId })
    }


}


