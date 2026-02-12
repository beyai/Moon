import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { EnumUtils, GameStatus, GameType } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GameValidator extends BaseValidator {
    private readonly RULES = {

        gameId: {
            type: 'int',
            message: {
                required: '游戏ID不能为空',
                int: '游戏ID填写错误',
            }
        },

        name: {
            type: 'string',
            max: 16,
            message: {
                required: '游戏名称不能为空',
                max: '游戏名称最多 16 个字符',
            }
        },

        type: {
            type: 'enum',
            values: EnumUtils.values<string>(GameType),
            message: {
                required: '游戏类型不能为空',
                enum: '游戏类型填写错误'
            }
        },

        handCards: {
            type: 'int',
            min: 2,
            message: {
                required: '手牌数量不能为空',
                int: '手牌数量不能小于 2'
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

        icon: {
            type: 'string',
            required: true,
            allowEmpty: true,
        },

        status: {
            type: 'enum',
            values: EnumUtils.values(GameStatus),
            message: {
                required: '游戏状态不能为空',
                enum: '游戏状态填写错误'
            }
        }
        
    }

    createGame(data: unknown) {
        const { name, type, handCards, useCards, icon } = this.RULES
        this.validate(data, { name, type, handCards, useCards, icon })
    }

    updateGame(data: unknown) {
        const { gameId, name, type, handCards, useCards, icon } = this.RULES
        this.validate(data, { gameId, name, type, handCards, useCards, icon })
    }

    setStatus(data: unknown) {
        const { gameId, status } = this.RULES
        this.validate(data, { gameId, status })
    }

    removeGame(data: unknown) {
        const { gameId } = this.RULES
        this.validate(data, { gameId })
    }

}