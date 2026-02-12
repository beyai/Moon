'use strict';
const { readFileSync } = require('fs')
const { Reader } = require('mmdb-lib')
const { geoip: geoipConfig } = require('../config/config.default');

const GEOIP_DB_PATH = Symbol('GeoIP#DB_PATH');
const GEOIP_DB = Symbol('GeoIP#DB');

class GeoIP {

    constructor(dbPath) {
        this[GEOIP_DB_PATH] = dbPath ?? geoipConfig.dbPath;
    }

    /** 配置 */
    get #dbPath() {
        return this[GEOIP_DB_PATH]
    }


    get #db() {
        if (!this[GEOIP_DB]) {
            const db = readFileSync(this.#dbPath);
            this[GEOIP_DB] = new Reader(db);
        }
        return this[GEOIP_DB];
    }

    /**
     * 获取IP归属地
     * @param {string} ip IP地址
     * @returns {{
     *     ip: string,
     *     countryCode: string,
     *     countryName: string,
     *     cityName: string,
     * }} IP信息
     */
    get(ip) {
        const result = this.#db.get(ip)
        const data = {
            ip: ip,
            countryCode: '',
            countryName: '',
            cityName: '',
        }
        if (result) {
            if (result.country) {
                data.countryCode = result.country.iso_code
                data.countryName = result.country.names['zh-CN']
            }
            if (result.city) {
                data.cityName = result.city.names['zh-CN']
            }
        }
        return data;
    }

}

module.exports = GeoIP;
