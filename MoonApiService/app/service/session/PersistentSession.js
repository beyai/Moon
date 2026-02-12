'use strict';

const crypto = require('crypto');
const Service = require('egg').Service;

const PERSISTENT_ECDH = Symbol('PersistentSession.ECDH')
const PERSISTENT_DEVICE_PUBLIC_KEY = Symbol('PersistentSession.devicePublicKey')

class PersistentSession extends Service {

    /** 缓存服务 */
    get CacheService() {
        return this.app.cache
    }

    /**
     * 服务端私钥
     */
    get privateKey() {
        return Buffer.from('Uezb0c6K7vSqf4YAbroWsPvO5yWWiAnEpP+xf9iJbmQ=', 'base64')
    }
    
    get ECDH() {
        if (!this[PERSISTENT_ECDH]) {
            const ecdh = crypto.createECDH('prime256v1');
            ecdh.setPrivateKey(this.privateKey)
            this[PERSISTENT_ECDH] = ecdh
        }
        return this[PERSISTENT_ECDH]
    }


    /** 设备公钥 */
    get devicePublicKey() {
        return this[PERSISTENT_DEVICE_PUBLIC_KEY] || null
    }
    
    /**
     * 设置设备公钥
     * @param {Buffer} buffer 
     */
    setDevicePublicKey(buffer) {
        this[PERSISTENT_DEVICE_PUBLIC_KEY] = buffer
    }

    /**
     * 获取共享密钥
     * @param {Buffer} salt 共享密钥盐 
     */
    getSharedKey(salt) {
        try {
            let secret = this.ECDH.computeSecret(this.devicePublicKey)
            return crypto.hkdfSync('sha256', secret, salt, '', 32);
        } catch(error) {
            this.ctx.throw('设备共享密钥生成失败')
        }
    }

    

}

module.exports = PersistentSession;
