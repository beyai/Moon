'use strict';

const _ = require('lodash');
const Service = require('egg').Service;
const { ADMIN_TYPES, STATUS_TYPES } = require('../../enum');

class AdminService extends Service {

    /** 
     * 管理员账号模型
     */
    get AccountModel() {
        return this.app.model.Admin;
    }

    /**
     * 账号是否已存在
     */
    async hasUsername(username) {
        if (_.isEmpty(username)) {
            this.ctx.throw(412, 'username 不能为空')
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
     * @param {string} data.type 账号类型， system=超级管理员，agent=代理
     * @param {string} data.username 账号
     * @param {string} data.password 密码
     * @param {string} data.mark 备注
     * @returns {Promise<UserModel>}
     */
    async create(data) { 
        if (_.isEmpty(data.username)) {
            this.ctx.throw(412, 'username 不能为空')
        }
        if (_.isEmpty(data.password)) {
            this.ctx.throw(412, 'password 不能为空')
        }
        if (_.isEmpty(data.type) || Object.values(ADMIN_TYPES).includes(data.type)) {
            this.ctx.throw(412, 'type 不能为空或填写错误')
        }
        if (await this.hasUsername(data.username)) {
            this.ctx.throw(412, `账号 ${ data.username } 不可使用`)
        }
        const userData = _.pick(data, ['username', 'password', 'type', 'mark'])
        userData.password = await this.ctx.encryptPassword(data.password)
        await this.AccountModel.create(userData)
        return true
    }


    /**
     * 设置状态
     * - 推荐先使用先通过 findByUserId 查询账号信息
     * @param {string} adminId 账号ID
     * @param {number} status 状态, 1=正常，2=禁用
     * @returns {Promise<boolean>}
     */
    async setStatus(adminId, status) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        if (!Object.values(STATUS_TYPES).includes(status)) {
            this.ctx.throw(412, 'status 值填写错误')
        }
        const [ count ] = await this.AccountModel.update({
            status
        }, {
            where: { adminId }
        })
        return count > 0
    }
    
    /**
     * 设置密码
     * @param {string} adminId 账号ID
     * @param {string} password 密码
     * @returns {Promise<boolean>}
     */
    async setPassword(adminId, password) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        if (_.isEmpty(password)) {
            this.ctx.throw(412, 'password 不能为空')
        }
        let newPassword = await this.ctx.encryptPassword(password)
        const [ count ] = await this.AccountModel.update({
            password: newPassword
        }, {
            where: { adminId }
        })
        return count > 0
    }
    
    /**
     * 通过账号ID查询账号信息
     * @param {string} adminId 账号ID
     * @returns {Promise<UserModel>}
     */
    async findByAdminId(adminId) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        const user = await this.AccountModel.findOne({
            where: { adminId }
        })
        if (!user) {
            this.ctx.throw(400, '账号不存在', { adminId })
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
            this.ctx.throw(400, `${ username  } 账号不存在`, { username })
        }
        return user
    }

    /**
     * 账号列表
     * @param {object} data 查询参数
     * @param {string?} data.type 账号类型
     * @param {string?} data.username 账号
     * @param {number?} data.status 状态
     * @param {number} page 页码
     * @param {number} limit 每页数量
     * @returns {Promise<Array>}
     */
    async findList(data, page = 1, limit = 10) {
        const Op = this.app.Sequelize.Op
        const where = _.pick(data, ['status', 'type'])
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
     * 代理列表
     * @returns {Promise<Array>}
     */
    async agentAllList() {
        return await this.AccountModel.findAll({
            where: { type: ADMIN_TYPES.AGENT },
            attributes: ['adminId', 'username'],
            raw: true
        })
    }

    /**
     * 删除账号
     * @param {string} adminId 账号ID
     * @returns {Promise<boolean>}
     */
    async remove(adminId) {
        if (_.isEmpty(adminId)) {
            this.ctx.throw(412, 'adminId 不能为空')
        }
        await this.AccountModel.destroy({
            where: { adminId }
        })
        return true
    }
}

module.exports = AdminService;
