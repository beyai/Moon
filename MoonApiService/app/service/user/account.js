'use strict';
const _ = require('lodash');
const Service = require('egg').Service;
const { STATUS_TYPES } = require('../../enum');


class UserService extends Service {

    /** 用户账号模型 */
    get AccountModel() {
        return this.app.model.User
    }

    /**
     * 账号是否已存在
     */
    async hasUsername(username) {
        if (_.isEmpty(username)) {
            this.ctx.throw(412, '账号不能为空')
        }
        const { accountBlacklist } = this.config
        if (accountBlacklist.includes(username)) {
            return true;
        }
        const count = await this.AccountModel.count({
            where: { username }
        })
        return count > 0
    }

    /**
     * 创建账号
     * @param {object} data 账号信息
     * @param {string} data.username 账号
     * @param {string} data.password 密码
     * @returns {Promise<UserModel>}
     */
    async create(data) { 
        if (_.isEmpty(data.username)) {
            this.ctx.throw(412, '账号不能为空')
        }
        if (_.isEmpty(data.password)) {
            this.ctx.throw(412, '密码不能为空')
        }
        if (await this.hasUsername(data.username)) {
            this.ctx.throw(412, `账号 ${ data.username } 不可使用`)
        }
        const userData = _.pick(data, ['username', 'password'])
        userData.password = await this.ctx.encryptPassword(data.password)
        userData.loginIp = this.ctx.ip;
        const user = await this.AccountModel.create(userData)
        return user
    }

    /**
     * 设置在线状态
     * @param {string} userId 账号ID
     * @param {boolean} isOnline 在线状态
     */
    async setOnline(userId, isOnline) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        const [ count ] = await this.AccountModel.update({
            isOnline: isOnline ? true : false,
        }, {
            where: { userId },
        })
        return count > 0
    }

    /**
     * 设置状态
     * - 推荐先使用先通过 findByUserId 查询账号信息
     * @param {string} userId 账号ID
     * @param {number} status 状态, 1=正常，2=禁用
     * @returns {Promise<boolean>}
     */
    async setStatus(userId, status) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        if (!Object.values(STATUS_TYPES).includes(status)) {
            this.ctx.throw(412, 'status 填写错误')
        }
        const [ count ] = await this.AccountModel.update({
            status
        }, {
            where: { userId }
        })
        return count > 0
    }
    /**
     * 设置密码
     * @param {string} userId 账号ID
     * @param {string} password 密码
     * @returns {Promise<boolean>}
     */
    async setPassword(userId, password) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        if (_.isEmpty(password)) {
            this.ctx.throw(412, 'password 不能为空')
        }
        let newPassword = await this.ctx.encryptPassword(password)
        const [ count ] = await this.AccountModel.update({
            password: newPassword
        }, {
            where: { userId }
        })
        return count > 0
    }
    
    /**
     * 通过账号ID查询账号信息
     * @param {string} userId 账号ID
     * @returns {Promise<UserModel>}
     */
    async findByUserId(userId) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        const user = await this.AccountModel.findOne({
            where: { userId }
        })
        if (!user) {
            this.ctx.throw(400, '账号不存在', { userId })
        }
        return user
    }

    /**
     * 通过账号查询账号信息
     * @param {string} username 账号
     * @returns {Promise<UserModel>}
     */
    async findByUsername(username) {
        if (_.isEmpty(username)) {
            this.ctx.throw(412, 'username 不能为空')
        }
        const user = await this.AccountModel.findOne({
            where: { username }
        })
        if (!user) {
            this.ctx.throw(400, '账号不存在', { username })
        }
        return user
    }

    /**
     * 账号列表
     * @param {object} data 查询参数
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @returns {Promise<Array>}
     */
    async findList(data, page = 1, limit = 10) {
        const Op = this.app.Sequelize.Op
        const where = _.pick(data, ['isOnline', 'status'])
        if (!_.isEmpty(data.username)) {
            where.username = {
                [Op.like]: `%${data.username}%`
            }
        }
        const { count, rows } = await this.AccountModel.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']],
            offset: (page - 1) * limit,
            limit
        })
        return {
            page, limit, count, rows
        }
    }

    /**
     * 搜索账号
     * @param {string} username 账号
     * @returns {Promise<Array>}
     */
    async search(username) {
        if (_.isEmpty(username)) return [];
        const Op = this.app.Sequelize.Op;
        return await this.AccountModel.findAll({
            where: {
                username: {
                    [Op.like]: `%${username}%`
                }
            },
            attributes: ['userId', 'username'],
            raw: true
        })
    }

    /**
     * 删除账号
     * @param {string} userId 账号ID
     * @returns {Promise<boolean>}
     */
    async remove(userId) {
        if (_.isEmpty(userId)) {
            this.ctx.throw(412, 'userId 不能为空')
        }
        await this.AccountModel.destroy({
            where: { userId }
        })
        return true
    }


}

module.exports = UserService;
