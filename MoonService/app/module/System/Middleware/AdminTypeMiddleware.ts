import { AdminSessionService } from "@/module/Service";
import { EggContext, Next } from "@eggjs/tegg";
import { AdminType } from "app/InterFace";

export function AdminTypeMiddleware(types?: AdminType | AdminType[]) {
    return async function (
        ctx: EggContext, 
        next: Next
    ) {
        if (!types) ctx.throw(400, '未配置管理员授权类型');

        const adminSession = await ctx.getEggObject(AdminSessionService)
        if (!adminSession.payload) {
            return ctx.throw(400, '没有访问权限');
        }
        const { type } = adminSession.payload
        // 非系统管理员
        const allowTypes = Array.isArray(types) ? types : [types];
        if (!allowTypes.includes(type)) {
            ctx.throw(400, '没有访问权限');
        }
        
        await next()
    }
}