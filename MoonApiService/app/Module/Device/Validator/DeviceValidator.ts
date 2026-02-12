import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { DeviceStatus, EnumUtils } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class DeviceValidator extends BaseValidator {

    private readonly RULES = {

        deviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },

        userId: {
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '账号ID不能为空',
                uuid: '账号ID格式不正确'
            }
        },

        status: {
            type: 'enum',
            values: EnumUtils.values(DeviceStatus),
            message: {
                required: '设备状态不能为空',
                enum: '设备状态填写错误'
            }
        }
    }

    deviceCode(data: unknown) {
        const { deviceCode } = this.RULES
        this.validate(data, {  deviceCode })
    }

    setUser(data: unknown) {
        const { deviceCode, userId } = this.RULES
        this.validate(data, {  deviceCode, userId })
    }

    setStatus(data: unknown) {
        const { deviceCode, status } = this.RULES
        this.validate(data, {  deviceCode, status })
    }

    
}