import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import {  EnumUtils, UserStatus } from "app/Enum";
import { User } from "app/model";
import { isEmpty, pick } from "lodash";
import { literal, Op } from "sequelize";

import type { WhereAttributeHash } from 'sequelize'


interface UserQuery {
    keyword?: string;
    username?: string;
    status?: UserStatus;
}

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class UserService extends BaseService {

    /**
     * 用户名是否存在
     * @param username 
     */
    async usenameIsExist(
        username: string
    ) {
        const blackList = this.config.accountBlackList ?? []
        if (blackList.includes(username)) return true
        const count = await this.model.User.count({
            where: { username }
        })
        return count > 0
    }

    /**
     * 用户列表查询
     * @param query 查询参数
     * @param page 页码
     * @param limit 分页长度
     */
    async findList(
        query: UserQuery = {},
        page: number = 1,
        limit: number = 10
    ) {
        const where: WhereAttributeHash<User> = pick(query, ['status'])

        if (!isEmpty(query.username)) {
            where.username = {
                [Op.like]: `%${ query.keyword }%`
            }
        }
        else if (!isEmpty(query.keyword)) {
            where[Op.or] = {
                username: { [Op.like]: `%${ query.keyword }%`},
                loginIp: { [Op.like]: `%${ query.keyword }%`},
            }
        }

        const { count, rows } = await this.model.User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [
                ['createdAt', 'DESC']
            ],
            offset: (page - 1) * limit,
            limit,
            
        })

        return {
            page, limit, count, rows
        }
    }

    /**
     * 搜索账号
     * @param username 用户名
     */
    async search(
        username: string,
        limit: number = 10
    ) {
        if (isEmpty(username)) {
            return []
        }
        const rows = await this.model.User.findAll({
            where: {
                username: { [Op.like]: `${ username }%`}
            },
            order: [
                ['createdAt', 'DESC']
            ],
            limit
        })
        return rows
    }

    /**
     * 创建管理员账号
     * @param username 用户名
     * @param password 密钥
     */
    async create(
        username: string,
        password: string
    ) {
        if (isEmpty(username) || isEmpty(password)) {
            this.throw(400, '用户名或密码不能为空')
        }
        if (await this.usenameIsExist(username)) {
            this.throw(400, '账号已存在')
        }

        await this.model.User.create({
            username,
            password: await this.encryptPassword(password),
            loginIp: this.ipAddr,
        })
        return true;
    }

    /**
     * 设备状态
     * @param userId 管理员账号ID
     * @param status 账号状态
     */
    async setStatus(
        userId: string,
        status: UserStatus
    ) {
        if (isEmpty(userId)) {
            this.throw(400, '账号ID不能为空')
        }
        if (!EnumUtils.includes(UserStatus, status)) {
            this.throw(400, '账号状态值不正确')
        }
        const [ count ] = await this.model.User.update({ status }, {
            where: { userId}
        })
        return count > 0
    }

    /**
     * 设备密码
     * @param userId 管理员账号ID
     * @param password 密钥
     */
    async setPassword(
        userId: string, 
        password: string
    ) {
        if (isEmpty(userId)) {
            this.throw(400, '账号ID不能为空')
        }
        if (isEmpty(password)) {
            this.throw(400, '密码不能为空')
        }
        const [ count ] = await this.model.User.update({
            password: await this.encryptPassword(password),
            version: literal(`version + 1`)
        }, {
            where: { userId}
        })
        return count > 0
    }

}