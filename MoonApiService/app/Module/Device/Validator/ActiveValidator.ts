import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseValidator } from "app/Common";
import { AdminStatus, AdminType, DeviceActiveLevel, EnumUtils } from "app/Enum";

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class ActiveValidator extends BaseValidator {

    private readonly RULES = {

        activeId: { 
            type: 'string', 
            message: '激活记录ID不能为空' 
        },

        deviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },

        level: {
            type: 'enum',
            values: EnumUtils.values(DeviceActiveLevel),
            message: {
                required: '激活级别不能为空',
                enum: '激活级别填写错误'
            }
        },
    }

    active(data: unknown) {
        const { deviceCode, level } = this.RULES
        this.validate(data, { deviceCode, level })
    }

    unactive(data: unknown) {
        const { deviceCode } = this.RULES
        this.validate(data, { deviceCode })
    }

    undo(data: unknown) {
        const { activeId } = this.RULES
        this.validate(data, { activeId })
    }
}