import _ from 'lodash'
import { AccessLevel,  EggContext, SingletonProto } from "@eggjs/tegg";
import { FindList, AdminData, AdminStatus, FindQuery, AdminType } from "app/InterFace";
import { Op, WhereOptions } from "sequelize";
import { AbstractService } from "app/Common";
import { Admin } from "app/model/Admin";

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class AdminService extends AbstractService {

    // 账号黑名单
    private get blackList(): string[] {
        return this.config.accountBlackList
    }

    /**
     * 用户名是否存在
     * @param username 用户名
     */
    private async hasUsername(username: string): Promise<boolean> {
        if (this.blackList.includes(username)) return true
        const count = await this.model.Admin.count({
            where: { username }
        })
        return count > 0
    }

    /**
     * 创建管理员
     * @param ctx 请求上下文 
     * @param data 账号信息
     * @returns 
     */
    async create(
        ctx: EggContext, 
        data: Pick<AdminData, 'username' | 'password' | 'type' | 'mark'>
    ): Promise<Admin> {
        const { username, password, type, mark  } = data;
        if (!username) {
            ctx.throw(412, '账号不能为空')
        }
        if (!password) {
            ctx.throw(412, '密码不能为空')
        }
        if (!type) {
            ctx.throw(412, '角色类型不能为')
        }

        const hasUsername = await this.hasUsername(username)
        if (hasUsername) {
            ctx.throw(412, '账号不可使用')
        }

        try {
            const { ip, regionName } = this.geoip.get(ctx.ip)
            const user = await this.model.Admin.create({
                username    : username,
                password    : await ctx.encryptPassword(password),
                type        : type,
                mark        : mark ?? '',
                loginIp     : `${ regionName }(${ ip })`,
                isOnline    : false,
                status      : AdminStatus.NORMAL
            })
            return user
        } catch(error) {
            throw error
        }
    }

    /**
     * 查询管理员
     * @param ctx 请求上下文 
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     * @returns 
     */
    async findList(
        ctx: EggContext, 
        query?: AdminData & FindQuery, 
        page: number = 1, 
        limit: number = 10 
    ): Promise<FindList<Admin>> {
        const where = _.pick(query, [
            'username', 'type', 'status'
        ]) as WhereOptions
        // 模糊查询管理员
        if (!_.isEmpty(where['username'])) {
            where['username'] = { [Op.like] : `%${ where['username'] }%` }
        }
        const { count, rows } = await this.model.Admin.findAndCountAll({
            where:  where,
            attributes: { exclude: ['password'] },
            order: [[ 'createdAt', 'DESC' ]],
            offset: (page - 1) * limit,
            limit,
        })
        return { count, page, limit, rows }
    }

    /**
     * 根据ID查询管理员信息
     * @param ctx 请求上下文 
     * @param adminId 管理员用户ID 
     */
    async findById(
        ctx: EggContext, 
        adminId: string
    ): Promise<Admin> {
        if (_.isEmpty(adminId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const user = await this.model.Admin.findByPk(adminId, {
            attributes: { exclude: ['password'] }
        })
        if (!user) {
            throw new Error(`用户不存在`)
        }
        return user
    }

    /**
     * 根据 username 查询管理员信息
     * @param ctx 请求上下文 
     * @param username 用户名
     */
    async findByUsername(
        ctx: EggContext, 
        username: string
    ): Promise<Admin> {
        if (_.isEmpty(username)) {
            ctx.throw(412, '用户名不能为空')
        }
        const user = await this.model.Admin.findOne({
            where: { username },
            attributes: { exclude: ['password'] }
        })
        if (!user) {
            throw new Error(`用户不存在`)
        }
        return user
    }

    /**
     * 根据 type 查询全部管理员
     * @param ctx 请求上下文 
     * @param type 管理员账号类型
     */
    async findAllByType(
        ctx: EggContext,
        type?: AdminType
    ): Promise<Pick<Admin, "adminId" | "username">[]> {
        const where = {}
        if (type) {
            where['type'] = type
        }
        return await this.model.Admin.findAll({
            where,
            attributes: ['adminId', 'username'],
            raw: true,
        })
    }

    /**
     * 设置密码
     * @param ctx 请求上下文 
     * @param adminId 管理员用户ID 
     * @param password 密码
     */
    async setPassword(
        ctx: EggContext,
        adminId: string,
        password: string
    ): Promise<boolean> {
        if (_.isEmpty(adminId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        if (_.isEmpty(password)) {
            ctx.throw(412, '密码不能为空')
        }
        password = await ctx.encryptPassword(password)
        const [ count ] = await this.model.Admin.update({ password }, {
            where: { adminId }
        })
        return count > 0
    }

    /**
     * 设置状态
     * @param ctx 请求上下文 
     * @param adminId 管理员用户ID 
     * @param status 账号状态
     */
    async setStatus(
        ctx: EggContext,
        adminId: string,
        status: AdminStatus
    ): Promise<boolean> {
        if (_.isEmpty(adminId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const [ count ] = await this.model.Admin.update({ status }, {
            where: { adminId }
        })
        return count > 0
    }

    /**
     * 删除账号
     * @param ctx 请求上下文 
     * @param adminId 管理员用户ID 
     */
    async remove(
        ctx: EggContext,
        adminId: string
    ): Promise<boolean> {
        if (_.isEmpty(adminId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const count = await this.model.Admin.destroy({
            where: { adminId }
        })
        return count > 0
    }
    

}