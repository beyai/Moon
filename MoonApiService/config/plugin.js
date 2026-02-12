'use strict';
const path = require('path');
module.exports = {
    session: false,
    i18n: false,
    multipart: false,
    static: false,
    jsonp: false,
    view: false,
    schedule: true,
    
    routerPlus: {
        enable: true,
        package: 'egg-router-plus'
    },
    websocket: {
        enable: true,
        package: 'egg-websocket-plugin',
    },
    sequelize: {
        enable: true,
        package: 'egg-sequelize',
    },

    redisCache: {
        enable: true,
        path: path.resolve(__dirname, '../lib/plugins/cache'),
    },
    validator: {
        enable: true,
        path: path.resolve(__dirname, '../lib/plugins/validator'),
    },
    geoip: {
        enable: true,
        path: path.resolve(__dirname, '../lib/plugins/geoip'),
    },
};
