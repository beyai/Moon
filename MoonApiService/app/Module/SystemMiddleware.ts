import { EggContext, Next } from "@eggjs/tegg";
import { AdminType } from "app/Enum";
import { AdminSessionService } from "./Admin";

/**
 * 登录授权
 */
export async function AdminAuthMiddleware(ctx: EggContext, next: Next) {
    if (!ctx.token) {
        ctx.throw(401, '授权失败')
    }
    const session = await ctx.getEggObject(AdminSessionService)
    if (!session.verify(ctx.token)) {
        ctx.throw(401, '令牌已过期')
    }
    await next()
}

/**
 * 操作授权
 * @param types 管理员账号类型
 * @returns 
 */
export function AdminTypeMiddleware(...types: AdminType[] ) {
    if (types.length === 0) {
        throw new Error('权限类型列表不能为空, 请配置有效的AdminType');
    }
    return async (ctx: EggContext, next: Next) => {
        const session = await ctx.getEggObject(AdminSessionService)
        if (!types.includes(session.type) ) {
            ctx.throw(400, `没有操作权限`);
        }

        await next()
    }
}