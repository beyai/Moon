import _ from 'lodash'
import { AccessLevel,  EggContext, SingletonProto } from "@eggjs/tegg";
import { FindList, UserData, UserQuery, UserStatus } from "app/InterFace";
import { Op, WhereOptions } from "sequelize";
import { User } from "app/model/User";
import { AbstractService } from "app/Common";

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class UserService extends AbstractService {

    // 账号黑名单
    private get blackList(): string[] {
        return this.config.accountBlackList
    }

    /**
     * 用户名是否存在
     * @param ctx 请求上下文 
     * @param username 用户名 
     */
    async hasUsername(username: string): Promise<boolean> {
        if (this.blackList.includes(username)) return true
        const count = await this.model.User.count({
            where: { username }
        })
        return count > 0
    }

    /**
     * 创建用户
     * @param ctx 请求上下文 
     * @param data 账号信息
     */
    async create(
        ctx: EggContext, 
        data: Pick<UserData, 'username' | 'password'>
    ): Promise<Omit<User, 'password'>> {
        const { username, password } = data
        if (!username) {
            ctx.throw(412, '账号不能为空')
        }
        if (!password) {
            ctx.throw(412, '密码不能为空')
        }
        const hasUsername = await this.hasUsername(username)
        if (hasUsername) {
            ctx.throw(412, '账号不可使用')
        }
        
        try {
            const { ip, regionName } = this.geoip.get(ctx.ip)
            const user = await this.model.User.create({
                username    : username,
                password    : await ctx.encryptPassword(password),
                loginIp     : `${ regionName }(${ ip })`,
                isOnline    : false,
            })
            return user
        } catch(error) {
            throw error
        }
    }

    /**
     * 查询用户
     * @param ctx 请求上下文 
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        ctx: EggContext, 
        query?: UserQuery, 
        page: number = 1, 
        limit: number = 10 
    ): Promise<FindList<User>> {
        const where = _.pick(query, ['username', 'isOnline', 'status' ]) as WhereOptions

        // 模糊查询用户名
        if (!_.isEmpty(where['username'])) {
            where['username'] = { [Op.like] : `%${ where['username'] }%` }
        }
        const { count, rows } = await this.model.User.findAndCountAll({
            where:  where,
            attributes: { exclude: ['password'] },
            order: [[ 'createdAt', 'DESC' ]],
            offset: (page - 1) * limit,
            limit,
        })
        return { count, page, limit, rows }
    }

    /**
     * 根据ID查询用户信息
     * @param ctx 请求上下文 
     * @param userId 用户ID
     */
    async findById(
        ctx: EggContext, 
        userId: string
    ): Promise<User> {
        if (_.isEmpty(userId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const user = await this.model.User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        })
        if (!user) {
            throw new Error(`用户不存在`)
        }
        return user
    }

    /**
     * 根据 username 查询用户信息
     * @param ctx 请求上下文 
     * @param username 用户名
     */
    async findByUsername(
        ctx: EggContext, 
        username: string
    ): Promise<User> {
        if (_.isEmpty(username)) {
            ctx.throw(412, '用户名不能为空')
        }
        const user = await this.model.User.findOne({
            where: { username },
            attributes: { exclude: ['password'] }
        })
        if (!user) {
            throw new Error(`用户不存在`)
        }
        return user
    }

    /**
     * 搜索
     * @param ctx 请求上下文 
     * @param username 用户名
     */
    async search(
        ctx: EggContext,
        username: string
    ): Promise< Pick<User, "userId" | "username">[] > {
        if (_.isEmpty(username)) return [];
        return await this.model.User.findAll({
            where: {
                username: { [Op.like]: `%${ username }%` }
            },
            attributes: ['userId', 'username'],
            limit: 10,
            raw: true,
        })
    }

    /**
     * 设置在线状态
     * @param ctx 请求上下文 
     * @param userId 用户ID
     * @param isOnline 是否在线
     */
    async setOnline(
        ctx: EggContext,
        userId: string,
        isOnline: boolean = false
    ): Promise<boolean> {
        if (_.isEmpty(userId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const [ count ] = await this.model.User.update({ isOnline }, {
            where: { userId }
        })
        return count > 0
    }

    /**
     * 设置密码
     * @param ctx 请求上下文 
     * @param userId 用户ID
     * @param password 密码
     */
    async setPassword(
        ctx: EggContext,
        userId: string,
        password: string
    ): Promise<boolean> {
        if (_.isEmpty(userId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        if (_.isEmpty(password)) {
            ctx.throw(412, '密码不能为空')
        }
        password = await ctx.encryptPassword(password)
        const [ count ] = await this.model.User.update({ password }, {
            where: { userId }
        })
        return count > 0
    }

    /**
     * 设置状态
     * @param ctx 请求上下文 
     * @param userId 用户ID
     * @param status 用户账号状态
     */
    async setStatus(
        ctx: EggContext,
        userId: string,
        status: UserStatus
    ): Promise<boolean> {
        if (_.isEmpty(userId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const [ count ] = await this.model.User.update({ status }, {
            where: { userId }
        })
        return count > 0
    }

    /**
     * 删除账号
     * @param ctx 请求上下文 
     * @param userId 用户ID
     */
    async remove(
        ctx: EggContext,
        userId: string
    ): Promise<boolean> {
        if (_.isEmpty(userId)) {
            ctx.throw(412, '用户ID不能为空')
        }
        const count = await this.model.User.destroy({
            where: { userId }
        })
        return count > 0
    }
}