'use strict';
const Sequelize         = require('sequelize')
const { STATUS_TYPES }  = require('../enum')

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, INTEGER, TINYINT  } =Sequelize

    const AttestModel = app.model.define('attest', {

        id: {
            type: INTEGER.UNSIGNED,
            primaryKey: true,
            autoIncrement: true,
            comment: '记录id'
        },

        deviceUID: {
            type: UUID,
            unique: true,
            allowNull: false,
            comment: '设备唯一标识'
        },

        publicKey: {
            type: STRING(255),
            allowNull: false,
            comment: '公钥'
        },

        signCount: {
            type: INTEGER.UNSIGNED,
            allowNull: false,
            defaultValue: 0,
            comment: '签名统计'
        },

        status: {
            type: TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: STATUS_TYPES.NORMAL,
            comment: '状态 1:正常 0:禁用'
        },
    }, {
        comment: 'APP验证',
        updatedAt: false,
        indexes: [
            {
                fields: [ 'deviceUID']
            },
        ]
    })

    // AttestModel.sync({
    //     force: true
    // })

    return AttestModel
}