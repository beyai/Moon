'use strict';
const _ = require('lodash');
const Validator = require('egg').Validator;
const { STATUS_TYPES } = require('../enum');

class UserValidator extends Validator {
    get rules() {
        return {
            userId: { 
                type: 'uuid',
                message: {
                    required: '请填写账号ID',
                    uuid: '账号ID填写错误'
                }
            },
            username: {
                type: "username",
                min: 5,
                max: 18,
                message: {
                    required: '请填写账号',
                    username: '账号必须为字母、数字或下划线',
                    min: '账号长度必须是 5~18 个字符',
                    max: '账号长度必须是 5~18 个字符',
                }
            },
            password: {
                type: 'password',
                min: 5,
                max: 18,
                message: {
                    required: '请填写密码',
                    password: '密码必须为字母、数字或特殊字符',
                    min: '密码长度必须是 5~18 个字符',
                    max: '密码长度必须是 5~18 个字符',
                }
            },
            key: {
                type: 'string',
                message: {
                    required: '请拖动滑块到最右边'
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

    register(data) {
        const rules = _.pick(this.rules, ['username', 'password', 'key'])
        this.validate(data, rules)
    }

    login(data) {
        const rules = _.pick(this.rules, ['username', 'password', 'key'])
        this.validate(data, rules)
    }

    deviceLogin(data) {
        const rules = _.pick(this.rules, ['username', 'password'])
        this.validate(data, rules)
    }

    updatePassword(data) {
        const rules = {
            oldPassword: { type: 'string', message: '请填写密码' },
            newPassword: this.rules.password
        }
        this.validate(data, rules)
    }

    create(data) {
        const rules = _.pick(this.rules, ['username', 'password'])
        this.validate(data, rules)
    }

    setPassword(data) {
        const rules = _.pick(this.rules, ['userId', 'password'])
        this.validate(data, rules)
    }

    setStatus(data) {
        const rules = _.pick(this.rules, ['userId', 'status'])
        this.validate(data, rules)
    }

}

module.exports = UserValidator;
