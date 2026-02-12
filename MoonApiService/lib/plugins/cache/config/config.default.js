'use strict';

/**
 * egg-redis-cache default config
 * @member Config#redisCache
 * @property {String} SOME_KEY - some description
 */
exports.cache = {
    app: true,
    agent: false,
    default: {
        prefix: 'egg',
        host: '127.0.0.1',
        port: 6379,
        db: 0,
    }
};