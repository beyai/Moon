import { BaseService } from "app/Common";
import { isEmpty } from "lodash";
import { randomBytes } from "crypto";
import { ApplicationStatus, EnumUtils } from "app/Enum";
import { AccessLevel, SingletonProto } from "@eggjs/tegg";


@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class ApplicationService extends BaseService {

    /**
     * 版本号是否存在
     * @param version 版本号
     */
    private async versionIsExist(
        version: string
    ) {
        const count = await this.model.Application.count({ where: { version }})
        return count > 0
    }

    /**
     * 创建App版本
     * @param version 版本号
     */
    async create(
        version: string
    ) {
        if (isEmpty(version)) {
            this.throw(400, 'App版本号不能为空')
        }
        if (await this.versionIsExist(version)) {
            this.throw(400, 'App版本号已存在')
        }
        const application = await this.model.Application.create({
            version,
            secretKey: randomBytes(32).toString('base64')
        })
        return application
    }

    /**
     * 删除
     * @param id App版本号ID
     */
    async remove(
        id: number
    ) {
        if (!id || !/^\d+$/.test(String(id))) {
            this.throw(400, 'App版本ID不能为空')
        }
        const count = await this.model.Application.destroy({ where: { id }})
        return count > 0
    }

    /**
     * 设置状态
     */
    async setStatus(
        id: number,
        status: ApplicationStatus
    ) {
        if (!id || !/^\d+$/.test(String(id))) {
            this.throw(400, 'App版本ID填写错误')
        }
        if (!EnumUtils.includes(ApplicationStatus, status)) {
            this.throw(400, 'App版本状态填写错误')
        }

        const [ count ] = await this.model.Application.update({ status }, {
            where: { id }
        })
        return count > 0
    }

    /**
     * 查询 App 版本号
     * @param version 版本号
     * @returns 
     */
    async findVersion(
        version: string
    ) {
        if (isEmpty(version)) {
            this.throw(400, 'App版本号不能为空')
        }
        const application = await this.model.Application.findOne({
            where: { version }
        })
        if (!application) {
            this.throw(400, `App版本 ${ version } 不支持`)
        }
        return application
    }

    /**
     * 列表
     */
    async findList(
        page: number = 1,
        limit: number = 10
    ) {
        const { count, rows } = await this.model.Application.findAndCountAll({
            order: [['id', 'DESC']],
            offset: ( page - 1 ) * limit,
            limit
        })
        return {
            page, limit, count, rows
        }
    }

}