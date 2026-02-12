import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject, Middleware } from "@eggjs/tegg";
import { SystemBaseController } from "app/Module/SystemBaseController";
import { AdminAuthMiddleware } from "app/Module/SystemMiddleware";
import { GamePlayService } from "../";
import { GamePlayValidator } from "../Validator/GamePlayValidator";


@HTTPController({ path: '/system/game/play' })
@Middleware( AdminAuthMiddleware )
export class GamePlayController extends SystemBaseController {
    @Inject()
    private readonly gamePlayService: GamePlayService
    @Inject()
    private readonly validator: GamePlayValidator

    /** 列表 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/list' })
    async findList(
        @Context() ctx: EggContext
    ) {
        const query = ctx.filterEmpty(ctx.request.body)
        const result = await this.gamePlayService.findList(query, ctx.page, ctx.limit)
        ctx.success(result)
    }

    /** 设置状态 */
    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/remove' })
    async remove(
        @Context() ctx: EggContext
    ) {
        this.validator.removeGamePlay(ctx.request.body)
        const { playId } = ctx.request.body
        const result = await this.gamePlayService.remove(playId)
        if (result) {
            ctx.success(true, '游戏玩法删除成功')
        } else {
            ctx.throw(400, '游戏玩法删除失败')
        }
    }


}