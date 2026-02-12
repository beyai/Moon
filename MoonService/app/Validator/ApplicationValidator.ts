import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractValidator } from "../Common";
import { ApplicationStatus, DeviceActiveLevel } from "app/InterFace";
    
@SingletonProto({ 
    accessLevel: AccessLevel.PUBLIC 
})
export class ApplicationValidator extends AbstractValidator {

    private readonly RULES = {
        id: {
            type: 'id',
            message: {
                required: 'App版本号ID不能为空',
                id: "App版本号ID格式不正确"
            }
        },
        version: { 
            type: 'string', 
            message: '激活记录ID不能为空' 
        },
        status: {
            type: 'enum',
            values:ApplicationStatus.values(),
            message: {
                required: 'App版本号状态不能为空',
                enum: 'App版本号状态填写错误'
            }
        },
    }

    create(data: unknown) {
        const { version } = this.RULES
        this.validate(data, { version })
    }

    remove(data: unknown) {
        const { id } = this.RULES
        this.validate(data, { id })
    }

    setStatus(data: unknown) {
        const { id, status } = this.RULES
        this.validate(data, { id, status })
    }
}