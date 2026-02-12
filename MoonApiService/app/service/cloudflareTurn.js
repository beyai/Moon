'use strict';
const Service = require('egg').Service;
const dayjs = require('dayjs');

class CloudflareTurnService extends Service {

    get #cloudflareConfig() {
        return Object.assign({
            enable: false,
            appId: '',
            secretKey: "",
            ttl: 8 * 60 * 60,
            blackList: []
        }, this.app.config.cloudflare)
    }

    /** 是否启用 */
    get enable() {
        return this.#cloudflareConfig.enable
    }

    /** 缓存 */
    get Cache() {
        return this.app.cache
    }
    
    /**
     * 是否为可接受区域
     */
    isAcceptRegion(countryCode) {
        if (countryCode && this.enable) {
            return !this.#cloudflareConfig.blackList.includes(countryCode)
        }
        return false
    }

    /**
     * 请求 TURN 凭证
     * @param {string} customIdentifier 自定义标识符
     * @returns {Promise<{ username: string, password: string }>} TURN 凭证
     */
    async #requestTurnCredentials(customIdentifier) {
        const { appId, secretKey, ttl } = this.#cloudflareConfig;
        const ret = await this.ctx.curl(`https://rtc.live.cloudflare.com/v1/turn/keys/${ appId }/credentials/generate`, {
            method: 'POST',
            timeout: 10000,
            dataType: 'json',
            contentType: 'json',
            headers: {
                'Authorization': `Bearer ${ secretKey }`,
            },
            data: {
                ttl, 
                customIdentifier 
            }
        })
        if (ret.status > 300) {
            this.ctx.throw(400, 'CloudflareTurn 服务异常')
        }
        let { iceServers } = ret.data;
        return {
            urls: iceServers.urls.filter(url => !url.includes(":80")),
            username: iceServers.username,
            credential: iceServers.credential,
        }
    }

    /**
     * 获取 TURN 凭证
     * @param {string} customIdentifier 自定义标识符
     * @returns {Promise<{ urls: string[], username: string, credential: string }>} TURN 凭证
     */
    async getTurnCredentials(customIdentifier) {
        const cacheKey = `cf:${ customIdentifier }`;
        let cached = await this.Cache.get(cacheKey);
        const { ttl } = this.#cloudflareConfig;
        
        // 如果缓存存在，检查是否快过期（不足 ttl 的一半时长）
        if (cached && cached.credential && cached.expires) {
            const expiresTime = dayjs(cached.expires);
            const now = dayjs();
            const minUntilExpire = expiresTime.diff(now, 'second');
            const minExpire = ttl / 2;
            // 如果缓存未过期且剩余时间大于 ttl 的一半时长，直接返回
            if (minUntilExpire > minExpire) {
                return cached.credential;
            }
        }

        const newCredentials = await this.#requestTurnCredentials(customIdentifier);
        const expires = dayjs().add(ttl, 'second');
        await this.Cache.set(cacheKey, { credential: newCredentials, expires }, ttl);
        return newCredentials;
    }
}

module.exports = CloudflareTurnService;
