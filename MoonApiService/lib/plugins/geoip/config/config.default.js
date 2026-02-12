'use strict';
const { join } = require('path');
/**
 * default config
 * @member Config#geoip
 * @property {String} SOME_KEY - some description
 */
exports.geoip = {
    dbPath: join(__dirname, './GeoLite2-City.mmdb'),
};