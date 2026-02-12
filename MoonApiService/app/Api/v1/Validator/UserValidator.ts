import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class UserValidator extends BaseValidator {
    private readonly RULES = {
        oldPassword: {
            type: 'string',
            message: {
                required: '旧密码不能为空',
            }
        },

        newPassword: {
            type: 'string',
            min: 5,
            max: 18,
            format: this.FORMAT_RE.PASSWORD,
            message: {
                required: '新密码不能为空',
                format: '新密码必须为字母、数字或特殊字符',
                min: '新密码长度必须是 5~18 个字符',
                max: '新密码长度必须是 5~18 个字符',
            }
        },
    }

    updatePassword(data: unknown) {
        const { oldPassword, newPassword } = this.RULES
        this.validate(data, { oldPassword, newPassword })
    }
}