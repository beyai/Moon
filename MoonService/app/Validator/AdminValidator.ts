import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { AdminStatus, AdminType } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class AdminValidator extends AbstractValidator {

    private readonly RULES = {

        adminId: { 
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '请填写用户ID',
                uuid: '用户ID填写错误'
            }
        },

        username: {
            type: 'string',
            min: 5,
            max: 10,
            trim: true,
            format: this.FORMAT_RE.USERNAME,
            message: {
                equired: '请填写登录账号',
                format: '账号必须为字母、数字或下划线',
                min: '账号长度必须是 5~18 个字符',
                max: '账号长度必须是 5~18 个字符',
            }
        },

        password: {
            type: 'string',
            min: 5,
            max: 18,
            format: this.FORMAT_RE.PASSWORD,
            message: {
                required: '请填写用户登录密码',
                format: '密码必须为字母、数字或特殊字符',
                min: '密码长度必须是 5~18 个字符',
                max: '密码长度必须是 5~18 个字符',
            }
        },

        type: {
            type: 'enum',
            values: [ AdminType.SYSTEM, AdminType.AGENT ],
            message: {
                required: '请填写账号类型',
                enum: '账号类型值填写错误'
            }
        },

        status: {
            type: 'enum',
            values: [ AdminStatus.NORMAL, AdminStatus.DISABLE ],
            message: {
                required: '请填写状态值',
                enum: '状态值填写错误'
            }
        }
    }

    /**
     * 登录
     */
    login(data: unknown) {
        const { username, password } = this.RULES
        this.validate(data, { username, password })
    }

    /**
     * 创建用户
     */
    createAdmin(data: unknown) {
        const { username, password, type } = this.RULES
        this.validate(data, { username, password, type })
    }

    /**
     * 设置密码
     */
    setPassword(data: unknown) {
        const { adminId, password } = this.RULES
        this.validate(data, { adminId, password })
    }

    /**
     * 设备状态
     */
    setStatus(data: unknown) {
        const { adminId, status } = this.RULES
        this.validate(data, { adminId, status })
    }

    /**
     * 修改密码
     */
    updatePassword(data) {
        const { password } = this.RULES
        this.validate(data, {
            oldPassword: { type: "string", message: '请填写旧密码' },
            newPassword: password
        })
    }
}