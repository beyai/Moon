import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { DeviceActiveLevel, DeviceRiskStatus, DeviceStatus } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class DeviceSessionValidator extends AbstractValidator {

    private readonly RULES = {
        id: {
            type: 'id',
            message: {
                required: 'App版本号ID不能为空',
                id: "App版本号ID格式不正确"
            }
        },
        deviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },
        status: {
            type: 'enum',
            values: DeviceRiskStatus.values(),
            message: {
                required: '设备会话状态不能为空',
                enum: '设备会话状态填写错误'
            }
        }
    }

    checkDeviceCode(data: Record<string, any>) {
        const { deviceCode } = this.RULES
        this.validate(data, { deviceCode })
    }

    checkId(data: Record<string, any>) {
        const { id } = this.RULES
        this.validate(data, { id })
    }

    setStatus(data: Record<string, any>) {
        const { deviceCode, status } = this.RULES
        this.validate(data, { deviceCode, status })
    }

   

}