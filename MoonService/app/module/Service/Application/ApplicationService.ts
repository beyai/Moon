import { AbstractService } from "app/Common";
import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { randomBytes } from "crypto";
import { ApplicationStatus } from "app/InterFace";

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class ApplicationService extends AbstractService {

    /**
     * 创建App版本信息
     * @param ctx 请求上下文
     * @param version 版本号
     * @returns 
     */
    async create(
        ctx: EggContext,
        version: string
    ) {
        if (!version) {
            ctx.throw(412, '应用版本号不能为空')
        }
        const secretKey = randomBytes(32).toString('base64')
        return await this.model.Application.create({ version, secretKey })
    }

    /**
     * 删除
     * @param ctx 请求上下文
     * @param id 版本号ID
     * @returns 
     */
    async remove(
        ctx:EggContext,
        id: number
    ) {
        if (id === undefined) {
            ctx.throw(412, '应用版本号ID不能为空')
        }
        const count = await this.model.Application.destroy({
            where: { id }
        })
        return count > 0
    }

    /**
     * 更新版本状态
     * @param ctx 请求上下文
     * @param id 版本号ID
     * @param status 可用状态
     */
    async setStatus(
        ctx:EggContext,
        id: number,
        status: ApplicationStatus
    ) {
        if (id === undefined) {
            ctx.throw(412, '应用版本号ID不能为空')
        }
        if (status === undefined || !ApplicationStatus.values().includes(status)) {
            ctx.throw(412, '应用版本状态不能为空或填写错误')
        }
        const [ count ] = await this.model.Application.update({ status },{
            where: { id }
        })
        return count > 0
    }


    /**
     * 查询 App 版本号信息
     * @param version 版本号
     * @returns 
     */
    async findByVersion( version: string ) {
        const row =  await this.model.Application.findOne({
            where: { version }
        })
        if (!row) {
            throw new Error("当前App版本不存在")
        }
        return row
    }

    /**
     * 列表查询
     * @param ctx 请求上下文
     */
    async findList(ctx: EggContext) {
        const result = await this.model.Application.findAll({
            order: [["id", 'DESC']]
        })
        return result
    }
}