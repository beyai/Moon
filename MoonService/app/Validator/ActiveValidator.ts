import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { DeviceActiveLevel } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class ActiveValidator extends AbstractValidator {

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
            values: DeviceActiveLevel.values(),
            message: {
                required: '激活级别不能为空',
                enum: '激活级别填写错误'
            }
        },
        adminId: {
            type: 'string',
            format: this.FORMAT_RE.UUID,
            message: {
                required: '激活人ID不能为空',
                uuid: '激活人ID填写错误'
            }
        },
    }

    active(data: unknown) {
        const { deviceCode, level, adminId } = this.RULES
        this.validate(data, { deviceCode, level, adminId })
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