import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { EnumUtils, PaymentType } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class PaymentValidator extends BaseValidator {

    private readonly RULES = {

        adminId: { 
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '账号ID不能为空',
                uuid: '账号ID格式不正确'
            }
        },

        endTime: {
            type: 'string',
            message: {
                required: '结算截止时间不能为空',
            }
        },

        type: {
            type: 'enum',
            values: EnumUtils.values(PaymentType),
            message: {
                enum: '结算类型填写错误'
            }
        },
    }

    payment(data: unknown) {
        const { adminId, endTime, type } = this.RULES
        this.validate(data, { adminId, endTime, type })
    }


}