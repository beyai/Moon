import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { AdminStatus, AdminType, ApplicationStatus, EnumUtils } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class ApplicationValidator extends BaseValidator {

    private readonly RULES = {

        id: { 
            type: 'id',
            message: {
                required: 'App版本ID不能为空',
                id: 'App版本ID格式不正确'
            }
        },

        status: {
            type: 'enum',
            values: EnumUtils.values(ApplicationStatus),
            message: {
                required: '状态不能为空',
                enum: '状态值填写错误'
            }
        }
    }

    setStatus(data: unknown) {
        const { id, status } = this.RULES
        this.validate(data, { id, status })
    }

    checkId(data: unknown) {
        const { id } = this.RULES
        this.validate(data, { id })
    }
}