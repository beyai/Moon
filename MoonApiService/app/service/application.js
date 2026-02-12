'use strict';

const _ = require('lodash');
const { STATUS_TYPES } = require('../enum');
const Service = require('egg').Service;

class ApplicationService extends Service {

    /** 应用模型 */
    get AppModel() {
        return this.app.model.Application
    }

    /**
     * 创建
     * @param {object} data 
     * @param {string} data.version 版本号
     * @param {string} data.secretKey 密钥
     * @returns {AppModel}
     */
    async create(data) {
        const res = await this.AppModel.create(_.pick(data, [
            'version', 'secretKey'
        ]))
        console.log(res)
        return res
    }

    /**
     * 删除
     * @param {number} id 
     * @returns {Boolean}
     */
    async remove(id) {
        await this.AppModel.destroy({
            where: { id }
        })
        return true
    }

    /**
     * 列表
     * @returns {AppModel[]}
     */
    async findAll() {
        return await this.AppModel.findAll({
            order: [ ['id', 'DESC'] ],
        })
    }

    /**
     * 查询版本
     * @param {string} version 版本号
     */
    async findOne(version) {
        const row = await this.AppModel.findOne({
            where: { version },
            attributes: ['version', 'secretKey', 'status'],
            raw: true
        })
        if (!row) {
            this.ctx.throw(404, '当前版本不存在')
        }
        return row
    }

    /**
     * 设置状态
     * @param {number} id 
     * @param {number} status 
     */
    async setStatus(id, status) {
        const row = await this.AppModel.findByPk(id)
        if (!row) {
            this.ctx.throw(404, '当前版本不存在')
        }
        row.set("status", status > 0 ? STATUS_TYPES.NORMAL : STATUS_TYPES.DISABLE)
        await row.save();
        return row
    }
}

module.exports = ApplicationService;
