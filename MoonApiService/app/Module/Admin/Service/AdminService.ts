import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { AdminStatus, AdminType, EnumUtils } from "app/Enum";
import { Admin } from "app/model";
import { isEmpty, pick } from "lodash";
import { literal, Op, WhereAttributeHash } from "sequelize";

interface AdminQuery {
    username?: string;
    status?: AdminStatus;
    type?: AdminType
}

@SingletonProto({ accessLevel: AccessLevel.PRIVATE })
export class AdminService extends BaseService {

    /**
     * 用户名是否存在
     * @param username 
     */
    async usenameIsExist(
        username: string
    ) {
        const count = await this.model.Admin.count({ where: { username }})
        return count > 0
    }

    /**
     * 用户列表查询
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        query: AdminQuery = {},
        page: number = 1,
        limit: number = 10
    ) {
        const where = pick(query, ['status', 'type']) as WhereAttributeHash<Admin>
        if (!isEmpty(query.username)) {
            where[Op.like] = {
                username: `%${ query.username }%`
            }
        }

        const { count, rows } = await this.model.Admin.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [
                [ 'createdAt', 'DESC' ]
            ],
            offset: ( page - 1 ) * limit,
            limit
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 全部账号
     */
    async findAll(type: AdminType) {
        const result = await this.model.Admin.findAll({
            where: { type },
            attributes: ['adminId', 'username', 'status', 'createdAt'],
            order: [
                ['status', "DESC"],
                ['createdAt', 'DESC']
            ]
        })
        return result
    }

    /**
     * 创建管理员账号
     * @param params.type 账号类型
     * @param params.username 用户名
     * @param params.password 密钥
     * @param params.mark 备注
     */
    async create(params: {
        type: AdminType,
        username: string,
        password: string,
        mark?: string,
    }) {
        if (isEmpty(params.username) || isEmpty(params.password)) {
            this.throw(400, '用户名或密码不能为空')
        }
        if (!EnumUtils.includes(AdminType, params.type)) {
            this.throw(400, '账号类型不支持')
        }
        if (await this.usenameIsExist(params.username)) {
            this.throw(400, '账号已存在')
        }
        return await this.model.Admin.create({
            type: params.type,
            username: params.username,
            password: await this.encryptPassword(params.password),
            mark: params.mark ?? '',
            loginIp: this.ipAddr,
        })
    }

    /**
     * 设备状态
     * @param adminId 管理员账号ID
     * @param status 账号状态
     */
    async setStatus(
        adminId: string,
        status: AdminStatus
    ) {
        if (isEmpty(adminId)) {
            this.throw(400, '账号ID不能为空')
        }
        if (!EnumUtils.includes(AdminStatus, status)) {
            this.throw(400, '账号状态值不正确')
        }
        const [ count ] = await this.model.Admin.update({ status }, {
            where: { adminId }
        })
        return count > 0
    }

    /**
     * 设备密码
     * @param adminId 管理员账号ID
     * @param password 密钥
     */
    async setPassword(
        adminId: string, 
        password: string
    ) {
        if (isEmpty(adminId)) {
            this.throw(400, '账号ID不能为空')
        }
        if (isEmpty(password)) {
            this.throw(400, '密码不能为空')
        }
        const [ count ] = await this.model.Admin.update({
            password: await this.encryptPassword(password),
            version: literal(`version + 1`)
        }, {
            where: { adminId }
        })
        return count > 0
    }

}