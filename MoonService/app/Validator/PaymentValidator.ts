import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import {  PaymentType } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class PaymentValidator extends AbstractValidator {

    private readonly RULES = {
        
        type: {
            type: 'enum',
            values: PaymentType.values(),
            message: {
                enum: '结算状态类型错误'
            }
        },

        adminId: {
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '代理用户ID不能为空',
                uuid: '代理用户ID填写错误'
            }
        },
        endTime: {
            type: 'string',
            message: {
                required: '请填写结算截止日期',
            }
        }
    }

    create(data: unknown) {
        const { type, endTime, adminId } = this.RULES
        this.validate(data, { type, endTime, adminId })
    }

    checkType(data: unknown) {
        const { type } = this.RULES
        this.validate(data, { type })
    }
}