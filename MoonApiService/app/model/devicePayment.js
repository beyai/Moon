const { PAYMENT_TYPES } = require("../enum")
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, INTEGER, DATE, JSON } = app.Sequelize

    const DevicePaymentModel = app.model.define('device_payment', {

        paymentId: {
            type: INTEGER,
            primaryKey: true,
            autoIncrement: true,
            comment: '结算记录id'
        },

        type: {
            type: STRING(10),
            allowNull: false,
            defaultValue: PAYMENT_TYPES.ACTIVE,
            comment: '结算类型 active:激活 move:移机'
        },

        total: {
            type: INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '总结算数量'
        },

        count: {
            type: INTEGER,
            allowNull: false,
            defaultValue: 0,
            comment: '当前结算数量'
        },

        payload: {
            type: JSON,
            allowNull: true,
            comment: '结算数据'
        },
       
        adminId: {
            type: UUID,
            allowNull: true,
            comment: '操作员id'
        },

        endTime: {
            type: DATE,
            allowNull: false,
            comment: '结算截止日期'
        },

        paymentAt: {
            type: DATE,
            allowNull: true,
            comment: '结算时间'
        }

    }, {
        comment: '激活记录表',
        timestamps: false,
        indexes: [
            {
                fields: [ 'type']
            },
            {
                fields: [ 'adminId']
            }
        ]
    })

    DevicePaymentModel.associate = function () {
        const { Admin } = app.model

        DevicePaymentModel.belongsTo(Admin, {
            as: 'admin',
            targetKey: 'adminId',
            foreignKey: 'adminId',
            constraints: false,
        })
    }

    return DevicePaymentModel
}