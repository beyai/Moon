'use strict';
const _ = require('lodash');
const Validator = require('egg').Validator;
const { STATUS_TYPES } = require('../enum');

class DeviceValidator extends Validator {

    get rules() {
        return {
            deviceCode: { 
                type: 'string', 
                message: '请填写设备码' 
            },
            activeId: { 
                type: 'string', 
                message: '请填写用户账号ID' 
            },
            userId: {
                type: 'uuid',
                message: {
                    required: '请填写用户账号ID',
                    uuid: '用户ID填写错误'
                }
            },
            adminId: {
                type: 'uuid',
                message: {
                    required: '请填写作员账号ID',
                    uuid: '操作员ID填写错误'
                }
            },
            status: {
                type: 'enum',
                values: Object.values(STATUS_TYPES),
                message: {
                    required: '请填写状态值',
                    enum: '状态值填写错误'
                }
            }
        }
    }

    bindUser(data) {
        const rules = _.pick(this.rules, ['deviceCode', 'userId'])
        this.validate(data, rules)
    }

    setStatus(data) {
        const rules = _.pick(this.rules, ['deviceCode', 'status'])
        this.validate(data, rules)
    }

    setUser(data) {
        const rules = _.pick(this.rules, ['deviceCode', 'userId'])
        this.validate(data, rules)
    }

    remove(data) {
        const rules = _.pick(this.rules, ['deviceCode'])
        this.validate(data, rules)
    }
}

module.exports = DeviceValidator;