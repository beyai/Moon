import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { AdminAuthMiddleware } from "app/Module/SystemMiddleware";
import { GameService } from "../";
import { GameValidator } from "../Validator/GameValidator";


@HTTPController({ path: '/system/game' })
@Middleware( AdminAuthMiddleware )
export class GameController extends SystemBaseController {
    @Inject()
    private readonly gameService: GameService
    @Inject()
    private readonly validator: GameValidator

    /** 字典配置 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/dict' })
    async getDict(
        @Context() ctx: EggContext
    ) {
        const result = this.gameService.getDictData()
        ctx.success(result)
    }

    /** 游戏配置 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/all' })
    async findAll(
        @Context() ctx: EggContext
    ) {
        const result = await this.gameService.findAll()
        ctx.success(result)
    }

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const result = await this.gameService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 创建 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/create' })
    async create(
        @Context() ctx: EggContext
    ) {
        this.validator.createGame(ctx.request.body)
        const { name, type, handCards, useCards, icon } = ctx.request.body
        await this.gameService.create({ name, type, handCards, useCards, icon })
        ctx.success(true, '创建成功')
    }

    /** 更新配置 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/update' })
    async update(
        @Context() ctx: EggContext
    ) {
        this.validator.updateGame(ctx.request.body)
        const { gameId, name, type, handCards, useCards, icon } = ctx.request.body
        const result = await this.gameService.update(gameId, { name, type, handCards, useCards, icon })
        if (result) {
            ctx.success(true, '游戏更新成功')
        } else {
            ctx.throw(400, '游戏更新失败')
        }
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/setStatus' })
    async setStatus(
        @Context() ctx: EggContext
    ) {
        this.validator.setStatus(ctx.request.body)
        const { gameId, status } = ctx.request.body
        const result = await this.gameService.setStatus(gameId, status)
        if (result) {
            ctx.success(true, '游戏状态更新成功')
        } else {
            ctx.throw(400, '游戏状态更新失败')
        }
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        this.validator.removeGame(ctx.request.body)
        const { gameId } = ctx.request.body
        const result = await this.gameService.remove(gameId)
        if (result) {
            ctx.success(true, '游戏删除成功')
        } else {
            ctx.throw(400, '游戏删除失败')
        }
    }


}