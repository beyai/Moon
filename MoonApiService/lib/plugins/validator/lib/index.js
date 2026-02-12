'use strict';
const path = require('path')
const egg = require('egg')
const Parameter = require('parameter')

class Validator extends egg.BaseContextClass {
    /**
     * 文件加载器
     */
    static loader(app) {
        // 加载自定义验证
        const rules = {};
        app.loader.loadExtend('validator', rules);
        for (const [ruleType, func] of Object.entries(rules)) {
            if (typeof func == 'function') {
                Parameter.addRule(ruleType, func, true);
            };
        }
        // 加载验证类
        const filePaths = app.loader.getLoadUnits().map(unit => path.join(unit.path, 'app/validator'));
        app.loader.loadToContext(filePaths, 'validator', {
            call: true,
            caseStyle: "upper",
            fieldClass: 'ValidatorClass'
        })
    }

    constructor(...args) {
        super(...args);
        const options = Object.assign({
            validateRoot: true,
            convert: true,
            widelyUndefined: false
        }, this.config.validator)
        // 初始化实例
        this._parameter = new Parameter(options);
    }

    /**
     * 验证
     */
    validate(data, rules) {
        const errors = this._parameter.validate(rules, data);
        if (errors) {
            const error = errors[0]
            this.ctx.throw(412, `${ error.field }: ${ error.message }`)
        }
    }
}

egg.Validator = Validator;
module.exports = Validator;
