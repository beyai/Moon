import { Context, EggContext, HTTPController, HTTPMethod, HTTPMethodEnum, Inject } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { MouseTrackService } from "../Service";
import { isEmpty } from "lodash";

@HTTPController({ path: '/system'})
export class MouseTrackController extends BaseController {
    @Inject()
    private readonly mouseTrackService: MouseTrackService

    @HTTPMethod({ method: HTTPMethodEnum.POST, path: '/captcha' })
    async captcha(
        @Context() ctx: EggContext
    ) {
        const { tracks } = ctx.request.body;
        if (isEmpty(tracks)) {
            ctx.throw(400, '操作验证失败')
        }
        const isChecked = this.mouseTrackService.checkTrack(tracks)
        if (!isChecked) {
            ctx.throw(400, '操作验证失败')
        }
        const result = this.mouseTrackService.generateKey()
        ctx.success(result, '验证成功')
    }
}