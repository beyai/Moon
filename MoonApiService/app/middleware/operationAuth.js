'use strict';

const { ADMIN_TYPES } = require("../enum");

module.exports = function(...types) {
    return async function(ctx, next) {
        types = (types.length != 0) ? types : Object.values(ADMIN_TYPES)
        const { type } = ctx.accountInfo;
        if (!types.includes(type)) {
            ctx.throw(400, '没有操作权限')
        }
        await next()
    }
}