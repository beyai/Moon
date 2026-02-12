import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { UserStatus } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class UserValidator extends AbstractValidator {

    private readonly RULES = {

        userId: { 
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
            max: 18,
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

        status: {
            type: 'enum',
            values: [ UserStatus.NORMAL, UserStatus.DISABLE ],
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
     * 注册
     */
    register(data: unknown) {
        const { username, password } = this.RULES
        this.validate(data, { username, password })
    }

     /**
     * 修改密码
     */
    updatePassword(data) {
        const { password } = this.RULES
        this.validate(data, {
            oldPassword: { type: "string", message: '旧密码不能为空' },
            newPassword: password
        })
    }

    /**
     * 创建用户
     * @param data 
     */
    createUser(data: unknown) {
        const { username, password } = this.RULES
        this.validate(data, { username, password })
    }

    /**
     * 设置密码
     */
    setPassword(data: unknown) {
        const { userId, password } = this.RULES
        this.validate(data, { userId, password })
    }

    /**
     * 设备状态
     */
    setStatus(data: unknown) {
        const { userId, status } = this.RULES
        this.validate(data, { userId, status })
    }
}