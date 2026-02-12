'use strict';
const _ = require('lodash');
const Validator = require('egg').Validator;

class MoveValidator extends Validator {

    get rules() {
        return {
            moveId: { 
                type: 'string', 
                message: '请填写激活记录ID'
            },
            oldDeviceCode: { 
                type: 'string', 
                message: '请填写旧设备码' 
            },
            newDeviceCode: { 
                type: 'string', 
                message: '请填写新设备码' 
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

    move(data) {
        const rules = _.pick(this.rules, ['oldDeviceCode', 'newDeviceCode'])
        this.validate(data, rules)
    }

    unmove(data) {
        const rules = _.pick(this.rules, ['moveId'])
        this.validate(data, rules)
    }
}

module.exports = MoveValidator;