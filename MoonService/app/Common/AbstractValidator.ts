import { EggContext, EggQualifier, EggType, InitTypeQualifier, Inject, ObjectInitType } from '@eggjs/tegg'
import Parameter from 'parameter'

export abstract class AbstractValidator {


    @Inject()
    @EggQualifier(EggType.CONTEXT)
    private readonly throw: EggContext['throw']

    // 验证实例
    private readonly parameter: Parameter

    constructor() {
        this.parameter = new Parameter({
            validateRoot: true,
            convert: true,
            widelyUndefined: false
        })
    }

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
    protected  validate(
        data: unknown, 
        rules: Parameter.ParameterRules
    ) {
        const errors = this.parameter.validate(rules, data)
        if (errors) {
            const { message } = errors[0]
            this.throw(412, message, { data, errors })
        }
    }
}