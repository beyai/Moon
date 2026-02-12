'use strict';

const APPLICATION_GEOIP = Symbol('application#geoip');
const GeoIP = require('../../lib/geoip');

module.exports = {
    /**
     * IP归属地获取
     */
    get GeoIP() {
        if (!this[APPLICATION_GEOIP]) {
            this[APPLICATION_GEOIP] = new GeoIP(this.config.geoip?.dbPath);
        }
        return this[APPLICATION_GEOIP];
    }
}
