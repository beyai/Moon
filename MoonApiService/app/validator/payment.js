'use strict';
const _ = require('lodash');
const { PAYMENT_TYPES } = require('../enum');
const Validator = require('egg').Validator;

class PaymentValidator extends Validator {

    get rules() {
        return {
            type: {
                type: 'enum',
                values: Object.values(PAYMENT_TYPES),
                message: {
                    required: '请填写结算类型',
                    enum: '结算类型填写错误'
                }
            },
            adminId: {
                type: 'uuid',
                message: {
                    required: '请填写作员账号ID',
                    uuid: '操作员ID填写错误'
                }
            },
            endTime: {
                type: 'string',
                message: {
                    required: '请填写结算截止日期',
                }
            }
        }
    }

    payment(data) {
        const rules = _.pick(this.rules, ['type', 'adminId', 'endTime'])
        this.validate(data, rules)
    }
}

module.exports = PaymentValidator;