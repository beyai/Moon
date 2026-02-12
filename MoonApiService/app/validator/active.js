'use strict';
const _ = require('lodash');
const Validator = require('egg').Validator;
const { DEVICE_ACTIVE_LEVELS } = require('../enum');

class ActiveValidator extends Validator {

    get rules() {
        return {
            activeId: { 
                type: 'string', 
                message: '请填写激活记录ID' 
            },
            deviceCode: { 
                type: 'string', 
                message: '请填写设备码' 
            },
            level: {
                type: 'enum',
                values: Object.values(DEVICE_ACTIVE_LEVELS),
                message: {
                    required: '请填写激活级别',
                    enum: '激活级别填写错误'
                }
            },
            adminId: {
                type: 'uuid',
                message: {
                    required: '请填写作员账号ID',
                    uuid: '操作员ID填写错误'
                }
            },
        }
    }

    active(data) {
        const rules = _.pick(this.rules, ['deviceCode', 'level', 'adminId'])
        this.validate(data, rules)
    }

    unactive(data) {
        const rules = _.pick(this.rules, ['activeId'])
        this.validate(data, rules)
    }

    remove(data) {
        const rules = _.pick(this.rules, ['activeId'])
        this.validate(data, rules)
    }
}

module.exports = ActiveValidator;