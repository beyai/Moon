'use strict';
const crypto    = require('crypto');
const cbor      = require('cbor')
const Service   = require('egg').Service;

class CryptSessionService extends Service {

    /**
     * 密钥盐、加密随机字符 12bit
     * @returns {Buffer}
     */
    randomNonce() {
        return crypto.randomBytes(12)
    }

    /**
     * 加密数据
     * @param {object} body 待加密明文数据
     * @param {Buffer} key 解密密钥
     * @param {Buffer} nonce 随机字符串
     * @returns {{
     *      tag: string;
     *      body: string;
     *      nonce: string;
     * }}
     */
    encrype(body, key, nonce) {
        const bodyData  = cbor.encode(body)
        const cipher    = crypto.createCipheriv('aes-256-gcm', key, nonce);
        const encrypted = Buffer.concat([ cipher.update(bodyData), cipher.final() ]);
        const tag = cipher.getAuthTag()
        return {
            tag: tag.toString('base64'),
            body: encrypted.toString('base64'),
            nonce: nonce.toString('base64')
        };
    }

    /**
     * 解密数据
     * @param {Buffer} encrypted 密文数据
     * @param {Buffer} key 解密密钥
     * @param {Buffer} nonce 随机字符串
     * @param {Buffer} tag 验证标签
     * @returns {object}
     */
    decrypt(encrypted, key, nonce, tag) {
        try {
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
            decipher.setAuthTag(tag);
            const decrypted = Buffer.concat([ decipher.update(encrypted), decipher.final() ]);
            return cbor.decode(decrypted)
        } catch(error) {
            this.ctx.throw(400, '数据解密失败')
        }
    }
}

module.exports = CryptSessionService;
