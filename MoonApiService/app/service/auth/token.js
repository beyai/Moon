'use strict';
const dayjs = require('dayjs')
const JWT = require('jsonwebtoken');
const { randomBytes } = require('crypto')
const Service = require('egg').Service;

class TokenService extends Service {

    // 密钥
    get #secretKey() {
        return this.config.token.secretKey
    }

    // 访问令牌有效时长
    get #accessTTL() {
        return this.config.token.accessTTL
    }

    // 刷新令牌有效时长
    get #refreshTTL() {
        return this.config.token.refreshTTL
    }

    /**
     * 生成访问令牌
     * @param {*} data 
     * @returns {string}
     */
    #generateAccessToken(payload) {
        return JWT.sign({ payload }, this.#secretKey, { expiresIn: this.#accessTTL } )
    }

    /**
     * 验证访问 token
     * @param {string} token
     * @returns {*}
     */
    verifyAccessToken(token) {
        try {
            const { payload } = JWT.verify(token, this.#secretKey)
            return payload
        } catch (error) {
            if (error instanceof JWT.TokenExpiredError) {
                this.ctx.throw(401, 'token 已过期');
            } else {
                this.ctx.throw(401, 'token 无效');
            }
        }
    }

    /**
     * 生成刷新 Token
     * @param {Object} payload
     * @returns {Promise<string>}
    */
    async #generateRefreshToken(payload) {
        let token = randomBytes(16).toString('hex')
        await this.app.cache.set(`token:${ token }`, payload, this.#refreshTTL)
        return token
    }

    /**
     * 验证刷新 Token
     * @param {string} token
     * @returns {Promise<*>}
     */
    async verifyRefreshToken(token) {
        return await this.app.cache.get(`token:${ token }`)
    }

    /**
     * 重置刷新 Token
     * @param {string} token
     */
    async removeRefreshToken(token) {
        await this.app.cache.del(`token:${ token }`)
    }

    /**
     * 生成 Token
     * @param {*} payload 
     * @returns {Promise<{accessToken: string, refreshToken: string}>}
     */
    async generateTokens(payload) {
        return {
            accessToken: this.#generateAccessToken(payload),
            refreshToken: await this.#generateRefreshToken(payload)
        }
    }
}

module.exports = TokenService;
