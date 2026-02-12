'use strict';

const {  randomBytes } = require('crypto')
const Service = require('egg').Service;

class DeviceAuthService extends Service {
    /**
     * 生成随机验证
     */
    async challenge() {
        const challenge = randomBytes(32).toString('base64')
        return challenge
    }

    /**
     * 设备注册
     */
    async register(data) {
        console.log(data)
    }


}

module.exports = DeviceAuthService;
