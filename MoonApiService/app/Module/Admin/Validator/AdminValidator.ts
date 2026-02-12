import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { AdminStatus, AdminType, EnumUtils } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class AdminValidator extends BaseValidator {

    private readonly RULES = {

        adminId: { 
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '账号ID不能为空',
                uuid: '账号ID格式不正确'
            }
        },

        username: {
            type: 'string',
            min: 5,
            max: 18,
            trim: true,
            format: this.FORMAT_RE.USERNAME,
            message: {
                required: '用户名不能为空',
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

        type: {
            type: 'enum',
            values: EnumUtils.values(AdminType),
            message: {
                required: '账号类型不能为空',
                enum: '账号类型填写错误'
            }
        },

        status: {
            type: 'enum',
            values: EnumUtils.values(AdminStatus),
            message: {
                required: '状态不能为空',
                enum: '状态值填写错误'
            }
        },

        oldPassword: {
            type: 'string',
            message: {
                required: '旧密码不能为空',
            }
        },
    }

    create(data: unknown) {
        const { username, password } = this.RULES
        this.validate(data, { username, password })
    }

    setStatus(data: unknown) {
        const { adminId, status } = this.RULES
        this.validate(data, { adminId, status })
    }

    setPassword(data: unknown) {
        const { adminId, password } = this.RULES
        this.validate(data, { adminId, password })
    }

    updatePassword(data: unknown) {
        const { oldPassword, password: newPassword } = this.RULES
        this.validate(data, { oldPassword, newPassword })
    }
}