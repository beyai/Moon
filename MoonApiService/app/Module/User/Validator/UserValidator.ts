import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { EnumUtils, UserStatus } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class UserValidator extends BaseValidator {

    private readonly RULES = {

        userId: { 
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '用户账号ID不能为空',
                uuid: '用户账号ID格式不正确'
            }
        },

        username: {
            type: 'string',
            min: 5,
            max: 18,
            trim: true,
            format: this.FORMAT_RE.USERNAME,
            message: {
                equired: '用户名不能为空',
                format: '用户名必须为字母、数字或下划线',
                min: '用户名长度必须是 5~18 个字符',
                max: '用户名长度必须是 5~18 个字符',
            }
        },

        password: {
            type: 'string',
            min: 5,
            max: 18,
            format: this.FORMAT_RE.PASSWORD,
            message: {
                required: '密码不能为空',
                format: '密码必须为字母、数字或特殊字符',
                min: '密码长度必须是 5~18 个字符',
                max: '密码长度必须是 5~18 个字符',
            }
        },

        status: {
            type: 'enum',
            values: EnumUtils.values(UserStatus),
            message: {
                required: '状态不能为空',
                enum: '状态值填写错误'
            }
        }
    }

    create(data: unknown) {
        const { username, password } = this.RULES
        this.validate(data, { username, password })
    }

    setStatus(data: unknown) {
        const { userId, status } = this.RULES
        this.validate(data, { userId, status })
    }

    setPassword(data: unknown) {
        const { userId, password } = this.RULES
        this.validate(data, { userId, password })
    }
}