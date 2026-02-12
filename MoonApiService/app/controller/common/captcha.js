'use strict';

const _ = require('lodash');
const Controller = require('egg').Controller;

class CaptchaController extends Controller {

    /** 鼠标轨迹验证服务 */
    get MouseTrackService() {
        return this.service.auth.mouseTrack;
    }

    /** 鼠标轨迹验证  */
    async track() {
        const { ctx } = this;
        const tracks = ctx.request.body.tracks;
        if (_.isEmpty(tracks)) {
            ctx.throw(412, '参数错误');
        }
        if (this.MouseTrackService.check(tracks)) {
            const result = this.MouseTrackService.generateKey();
            ctx.success(result, '验证通过');
        } else {
            ctx.throw(412, '验证失败');
        }
    }
}

module.exports = CaptchaController;
