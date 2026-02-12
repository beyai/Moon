import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { EnumUtils, GameCutCard, GameType, GameStatus, GameTrick } from "app/Enum";
import { Game } from "app/model";
import { isEmpty, pick } from "lodash";
import { Op, WhereAttributeHash } from "sequelize";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GameService extends BaseService {

    /**
     * 游戏字典配置
     */
    getDictData() {
        return {
            // 游戏类型
            type: GameType.getDict(),
            // 手法
            trick: GameTrick.getDict(),
            // 切牌
            cutCard: GameCutCard.getDict()
        }
    }

    /**
     * 查询所有正常状态游戏配置
     */
    async findAll() {
        const games = await this.model.Game.findAll({
            attributes: ['gameId', 'name', 'type', 'handCards', 'useCards' ],
            where: {
                status: GameStatus.NORMAL
            },
        })
        return games
    }

    /**
     * 列表查询
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     * @returns 
     */
    async findList(
        query: {
            keyword?: string;
            type?: string;
            status?: GameStatus;
        },
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, ['type', 'status']) as WhereAttributeHash<Game>
        
        if (!isEmpty(query.keyword)) {
            where[Op.or] = [
                { name: { [Op.like]: `%${ query.keyword }%` } },
                { type: { [Op.like]: `%${ query.keyword }%` } }
            ]
        }
        const { count, rows } = await this.model.Game.findAndCountAll({
            where,
            order: [ ['gameId', 'ASC'] ],
            offset: ( page - 1 ) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }


    /**
     * 创建游戏
     * @param data 游戏配置
     */
    async create(
        data: {
            name: string;
            type: GameType;
            handCards: number;
            useCards: number[];
            icon?: string;
        }
    ) {
        const { name, type, handCards, useCards, icon } = data;
        if (isEmpty(name)) {
            this.throw(400, '游戏名称不能为空')
        }
        if (isEmpty(type)) {
            this.throw(400, '游戏别名不能为空')
        }
        if (!Number.isFinite(handCards) || handCards <= 1 ) {
            this.throw(400, '手牌数不能为空，且必须大于 1')
        }
        if (!Array.isArray(useCards) || useCards.length !== 7 ) {
            this.throw(400, '用牌设置错误，且必须是 0~255 的正整数 7 位长度数组')
        }
        console.log(data)
        const game = await this.model.Game.create({
            name, type, handCards, useCards, icon
        })
        return game
    }

    /**
     * 设置状态
     * @param gameId 游戏ID
     * @param status 状态值
     * @returns 
     */
    async setStatus(
        gameId: number, 
        status: GameStatus
    ) {
        if (!Number.isFinite(gameId)) {
            this.throw(400, '游戏ID填写错误')
        }
        if (!EnumUtils.includes(GameStatus, status)) {
            this.throw(400, '游戏状态填写错误')
        }
        const game = await this.model.Game.findByPk(gameId)
        if (!game) {
            this.throw(404, '游戏不存在')
        }
        game.set('status', status)
        await game.save()
        return true
    }

    /**
     * 更新设置
     * @param gameId 游戏ID
     * @param data 游戏配置
     */
    async update(
        gameId: number, 
        data: {
            name: string;
            type: GameType;
            handCards: number;
            useCards: number[];
            icon?: string;
        }
    ) {
        if (!Number.isFinite(gameId)) {
            this.throw(400, '游戏ID填写错误')
        }
        const { name, type, handCards, useCards, icon } = data;
        if (isEmpty(name)) {
            this.throw(400, '游戏名称不能为空')
        }
        if (isEmpty(type)) {
            this.throw(400, '游戏别名不能为空')
        }
        if (!Number.isFinite(handCards) || handCards <= 1 ) {
            this.throw(400, '手牌数不能为空，且必须大于 1')
        }
        if (!Array.isArray(useCards) || useCards.length !== 7 ) {
            this.throw(400, '用牌设置错误，且必须是 0~255 的正整数 7 位长度数组')
        }

        const game = await this.model.Game.findByPk(gameId)
        if (!game) {
            this.throw(404, '游戏不存在')
        }
        game.set(data)
        await game.save()
        return true
    }

    /**
     * 
     * @param gameId 游戏ID
     */
    async remove(
        gameId: number, 
    ) {
        if (!Number.isFinite(gameId)) {
            this.throw(400, '游戏ID填写错误')
        }
        const count = await this.model.Game.destroy({
            where: { gameId }
        })
        return count > 0
    }


}