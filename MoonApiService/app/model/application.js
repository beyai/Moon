'use strict';
const { STATUS_TYPES } = require('../enum')
const Sequelize = require('sequelize')

/**
 * @param {Egg.Application} app - egg application
 */

module.exports = app => {
    
    const { STRING, INTEGER, TINYINT  } = Sequelize

    const AppModel = app.model.define('application', {

        id: {
            type: INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            comment: '记录id'
        },

        version: {
            type: STRING(20),
            allowNull: false,
            unique: true,
            comment: '版本号'
        },

        secretKey: {
            type: STRING(255),
            allowNull: false,
            comment: '密钥'
        },

        status: {
            type: TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: STATUS_TYPES.NORMAL,
            comment: '状态 1:正常 0:禁用'
        },
    }, {
        comment: '应用管理',
        updatedAt: false,
        indexes: [
            {
                fields: [ 'version']
            },
        ]
    })

    // AppModel.sync({
    //     force: true
    // })
    return AppModel
}