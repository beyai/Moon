import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { EnumUtils, GameCutCard, GameStatus, GameTrick } from "app/Enum";
import { GamePlay } from "app/model";
import { isBoolean, isEmpty, pick } from "lodash";
import { Op, WhereAttributeHash } from "sequelize";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GamePlayService extends BaseService {

    /**
     * 查询玩法配置
     * @param query 查询参数 
     * @param page 页码
     * @param limit 分页长度
     * @returns 
     */
    async findList(
        query: {
            keyword?: string;
            gameId?: number;
            type?: string;
            deviceCode?: string;
        },
        page: number = 1,
        limit: number = 10
    ) {
        const where: WhereAttributeHash<GamePlay> = pick(query, ['gameId'])
        const { keyword, type, deviceCode } = query

        if (!isEmpty(deviceCode)) {
            where.deviceCode = { [Op.like]: `%${ deviceCode }%`}
        }

        if (!isEmpty(keyword)) {
            where[Op.or] = [
                { 'name': { [Op.like]: `%${ keyword }%`} },
                { '$game.name$': { [Op.like]: `%${ keyword }%`} },
                { '$game.type$': { [Op.like]: `%${ keyword }%`} }
            ]
        } else if (!isEmpty(type)) {
            where['$game.type$'] = { [Op.like]: `%${ type }%`}
        }

        const { count, rows } = await this.model.GamePlay.findAndCountAll({
            where,
            include: [
                {
                    as: 'game',
                    model: this.model.Game,
                    attributes: [ 'gameId', 'name', 'type', 'icon' ],
                    required: true,
                }
            ],
            order: [['id', 'DESC']],
            offset: ( page - 1 ) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 查询设备玩法配置列表
     * @param deviceCode 设备码
     * @returns 
     */
    async findByDeviceCode(
        deviceCode: string
    ) {
        if (isEmpty(deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        return await this.model.GamePlay.findAll({
            where: { deviceCode },
            attributes: { exclude: ['id'] },
            order: [ ['createdAt', 'Desc'] ],
            include: [
                {
                    as: 'game',
                    model: this.model.Game,
                    attributes: [ 'gameId', 'name', 'type', 'icon' ],
                    required: true,
                    where: {
                        status: GameStatus.NORMAL
                    }
                }
            ]
        })
    }

    /**
     * 加载玩法详情
     */
    async findByPlayId(
        playId: string
    ) {
        if (isEmpty(playId)) {
            this.throw(400, '玩法ID不能为空')
        }
        return await this.model.GamePlay.findOne({
            where: { playId },
            attributes: { exclude: ['id'] },
            order: [ ['createdAt', 'Desc'] ],
            include: [
                {
                    as: 'game',
                    model: this.model.Game,
                    attributes: [ 'gameId', 'name', 'type', 'icon' ],
                    required: true,
                    where: {
                        status: GameStatus.NORMAL
                    }
                }
            ]
        })
    }

    /**
     * 玩法创建或更新
     * @param data 配置数据
     */
    async createOrUpdate(
        params: {
            playId?: string;
            gameId: number;
            deviceCode: string,
            name: string;
            cutCard: GameCutCard;
            trick: GameTrick;
            isShuffleFull: boolean;
            useCards: number[];
            score: number[];
            people: number;
            handCards: number;
        }
    ) {

        const data = pick(params, [
            'gameId', 'deviceCode', 'name', 'cutCard', 
            'trick', 'isShuffleFull', 'useCards', 'score', 'people', 'handCards'
        ])
        if (!isFinite(data.gameId)) {
            this.throw(400, '游戏ID填写错误')
        }
        if (isEmpty(data.deviceCode)) {
            this.throw(400, '设备码不能为空')
        }
        if (isEmpty(data.name)) {
            this.throw(400, '玩法名称不能为空')
        }
        if (!EnumUtils.includes(GameCutCard, data.cutCard)) {
            this.throw(400, '切牌类型填写错误')
        }
        if (!EnumUtils.includes(GameTrick, data.trick)) {
            this.throw(400, '手法类型填写错误')
        }
        if (!isBoolean(data.isShuffleFull)) {
            this.throw(400, '洗牌是否需要完整填写错误')
        }
        if (!Array.isArray(data.useCards) || data.useCards.length !== 7 ) {
            this.throw(400, '用牌定制格式错误')
        }
        for (const value of data.useCards) {
            if (!Number.isFinite(value) || value < 0 || value > 255) {
                this.throw(400, '用牌定制值填写错误')
            }
        }
        if (!Array.isArray(data.score) ) {
            this.throw(400, '牌面点数格式错误')
        }
        for (const value of data.score) {
            if (!Number.isFinite(value)) {
                this.throw(400, '牌面点数值填写错误')
            }
        }
        if (!Number.isFinite(data.people) || data.people < 1) {
            this.throw(400, '玩家人数填写错误')
        }

        if (!Number.isFinite(data.handCards) || data.handCards < 1 ) {
            this.throw(400, '手牌数量填写错误')
        }

        let playId:string
        if (!params.playId) {
            const result = await this.model.GamePlay.create(data)
            playId = result.playId
        } else {
            playId = params.playId
            const [count] = await this.model.GamePlay.update(data, {
                where: { playId }
            })
            if ( count === 0 ) {
                this.throw(400, '更新失败或记录不存在')
            }
        }

        return await this.findByPlayId(playId)
    }

    /**
     * 删除
     * @param playId 玩法ID
     */
    async remove( playId: string ) {
        if (isEmpty(playId)) {
            this.throw(400, '玩法ID不能为空')
        }

        const count = await this.model.GamePlay.destroy({
            where: { playId }
        })

        return count > 0
    }
}