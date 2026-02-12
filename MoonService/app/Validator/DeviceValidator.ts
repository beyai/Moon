import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { DeviceActiveLevel, DeviceStatus } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class DeviceValidator extends AbstractValidator {

    private readonly RULES = {

        deviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },

        activeId: { 
            type: 'string', 
            message: '激活记录ID不能为空' 
        },
      
        userId: {
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '用户不能为空',
                format: '用户ID格式不正确'
            }
        },
        adminId: {
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '代理用户不能为空',
                uuid: '代理用户ID格式不正确'
            }
        },
        status: {
            type: 'enum',
            values: DeviceStatus.values(),
            message: {
                required: '设备状态不能为空',
                enum: '设备状态填写错误'
            }
        }
    }

    setStatus(data:unknown) {
        const { deviceCode, status } = this.RULES
        this.validate(data, { deviceCode, status })
    }

    setUser(data:unknown) {
        const { deviceCode, userId } = this.RULES
        this.validate(data, { deviceCode, userId })
    }

    remove(data: unknown) {
        const { deviceCode } = this.RULES
        this.validate(data, { deviceCode })
    }

}