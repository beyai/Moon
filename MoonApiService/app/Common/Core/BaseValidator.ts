import Parameter from 'parameter'
import type { ParameterRules } from 'parameter'
import { CoreBase } from "./CoreBase";

export { ParameterRules }

export abstract class BaseValidator extends CoreBase {
    
    // 验证实例
    private readonly parameter: Parameter

    constructor() {
        super()
        this.parameter = new Parameter({
            validateRoot: true,
            convert: true,
            widelyUndefined: false
        })
    }

    // 自定义格式正则
    protected readonly FORMAT_RE = {
        UUID        : /^[a-f\d]{8}(-[a-f\d]{4}){4}[a-f\d]{8}$/i,
        PASSWORD    : /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/,
        USERNAME    : /^\w+$/,
    }

    /**
     * 验证
     * @param data 验证参数
     * @param rules 验证规则
     */
    protected  validate(data: unknown, rules: ParameterRules ) {
        const errors = this.parameter.validate(rules, data)
        if (errors) {
            const { message } = errors[0]
            this.throw(412, message, { data, errors })
        }
    }

}