const { STATUS_TYPES, ADMIN_TYPES } = require("../enum")

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, UUIDV4, TINYINT, DATE } = app.Sequelize

    const AdminModel = app.model.define('admin', {

        adminId: {
            type: UUID,
            primaryKey: true,
            defaultValue: UUIDV4,
            comment: '管理员id'
        },

        type: {
            type: STRING(10),
            allowNull: false,
            defaultValue: ADMIN_TYPES.AGENT,
            comment: '管理员类型 system:系统管理员 agent:普通管理员'
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
        
        mark: {
            type: STRING(255),
            defaultValue: '',
            comment: '备注'
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
        comment: '管理员表',
        indexes: [
            {
                fields: [ 'username']
            }
        ],
    })

    return AdminModel
}