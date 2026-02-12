import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { BaseDeviceController } from "../BaseDeviceController";
import { GamePlayService, GamePlayValidator, GameService } from "app/Module/Game";
import { isEmpty } from "lodash";
import { UserAuthMiddleware } from "../../Middleware/UserAuthMiddleware";
import { AppMiddleware } from "../Middleware/AppMiddleware";

@HTTPController({ path: '/v1/game' })
@Middleware( UserAuthMiddleware, AppMiddleware )
export class AppGameController extends BaseDeviceController {

    @Inject()
    private readonly gameService: GameService
    @Inject()
    private readonly playService: GamePlayService
    @Inject()
    private readonly validator: GamePlayValidator

    /** 字典配置 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/dict' })
    async getDict(
        @Context() ctx: EggContext
    ) {
        return this.gameService.getDictData()
    }

    /** 游戏 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/all' })
    async findAll(
        @Context() ctx: EggContext
    ) {
        const result = await this.gameService.findAll()
        return result.map(item => item.toJSON() )
    }

    /** 玩法详情 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/detail' })
    async findDetail(
        @Context() ctx: EggContext
    ) {
        const { playId } = this.deviceCtx.body
        if (isEmpty(playId)) {
            ctx.throw(400, '玩法ID不能为空')
        }
        const result = await this.playService.findByPlayId(playId)
        if (!result) {
            ctx.throw(400, '玩法不存在')
        }
        return result.toJSON()
    }

    /** 玩法列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async findList(
        @Context() ctx: EggContext
    ) {
        const { deviceCode } = this.deviceCtx.body
        if (isEmpty(deviceCode)) {
            ctx.throw(400, '设备码不能为空')
        }
        const result = await this.playService.findByDeviceCode(deviceCode)
        return result.map(item => item.toJSON())
    }

    /** 创建玩法 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    async create(
        @Context() ctx: EggContext
    ) {
        this.validator.createGamePlay(this.deviceCtx.body)
        const { 
            gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards  
        } = this.deviceCtx.body
        const result = await this.playService.createOrUpdate({ 
            gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards  
        })
        if (!result) {
            ctx.throw(400, '创建失败')
        }
        return result?.toJSON()
    }

    /** 更新玩法 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/update' })
    async update(
        @Context() ctx: EggContext
    ) {
        this.validator.updateGamePlay(this.deviceCtx.body)
        const { 
            playId, gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards  
        } = this.deviceCtx.body
        const result = await this.playService.createOrUpdate({ 
            playId, gameId, deviceCode, name, cutCard, trick, isShuffleFull, 
            useCards, score, people, handCards  
        })
        if (!result) {
            ctx.throw(400, '保存失败')
        }
        return result?.toJSON()
    }

    /** 删除玩法 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        const { playId } = this.deviceCtx.body
        if (isEmpty(playId)) {
            ctx.throw(400, '玩法ID不能为空')
        }
        const result = await this.playService.remove(playId)
        if (!result) {
            ctx.throw(400, '删除失败')
        }
        return true
    }

}