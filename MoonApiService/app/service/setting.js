'use strict';

const path = require('path')
const fs = require('fs-extra')
const TOML = require('smol-toml')
const Service = require('egg').Service;

class SettingService extends Service {

    get CloudflareTurn() {
        return this.service.cloudflareTurn
    }

    /** 文件路径 */
    get #filePath() {
        return path.join(this.config.baseDir, 'config/setting.toml')
    }

    /** 读取配置 */
    async #read() {
        let defaultData = {
            iceServers: [
                { urls: ['stun:stun2.l.google.com:19302'] }
            ]
        }
        try {
            const data = await fs.readFile(this.#filePath, 'utf8')
            return TOML.parse(data)
        } catch (error) {
            this.logger.error(error)
            return defaultData
        }
    }

    /** 
     * 获取数据
     * @param {string} deviceCode 设备编码
     */
    async getData(deviceCode) {
        const ctx = this.ctx
        const setting = await this.#read()
        // 非中国IP，使用 CF TURN 服务
        try {
            const { countryCode } = this.app.GeoIP.get(ctx.ip)
            if (this.CloudflareTurn.isAcceptRegion(countryCode)) {
                const iceServer = await this.CloudflareTurn.getTurnCredentials(deviceCode)
                setting.iceServers = [ iceServer ]
            }
        } catch (error) {
            this.logger.error(error)
        }
        return setting
    }
    
}

module.exports = SettingService;
