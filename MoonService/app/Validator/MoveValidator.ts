import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class MoveValidator extends AbstractValidator {

    private readonly RULES = {
        moveId: { 
            type: 'string', 
            message: '激活记录ID不能为空' 
        },
        oldDeviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
            }
        },
        newDeviceCode: { 
            type: 'string',
            message: {
                required: '设备码不能为空',
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

    move(data: unknown) {
        const { oldDeviceCode, newDeviceCode } = this.RULES
        this.validate(data, { oldDeviceCode, newDeviceCode })
    }

    undo(data: unknown) {
        const { moveId } = this.RULES
        this.validate(data, { moveId })
    }
}