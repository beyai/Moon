const { STATUS_TYPES } = require("../enum")
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = (app) => {
    
    const { STRING, UUID, UUIDV4, TINYINT, DATE, BOOLEAN } = app.Sequelize

    const UserModel = app.model.define('user', {

        userId: {
            type: UUID,
            primaryKey: true,
            defaultValue: UUIDV4,
            comment: '用户id'
        },

        username: {
            type: STRING(30),
            allowNull: false,
            unique: true,
            comment: '用户名'
        },

        password: {
            type: STRING(128),
            allowNull: false,
            comment: '密码'
        },

        isOnline: {
            type: BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否在线'
        },

        loginAt: {
            type: DATE,
            allowNull: true,
            comment: '登录时间'
        },

        loginIp: {
            type: STRING(16),
            allowNull: true,
            comment: '登录ip'
        },

        status: {
            type: TINYINT,
            allowNull: false,
            defaultValue: STATUS_TYPES.NORMAL,
            comment: '状态 1:正常 0:禁用'
        }
    }, {
        comment: '用户表',
    })


    
    return UserModel
}