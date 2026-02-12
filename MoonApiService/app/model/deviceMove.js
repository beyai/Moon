const dayjs = require('dayjs')
const { PAYMENT_STATUS } = require('../enum')
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, TINYINT, DATE } = app.Sequelize

    const DeviceMoveModel = app.model.define('device_move', {

        moveId: {
            type: STRING(32),
            primaryKey: true,
            defaultValue() {
                return dayjs().format('YYMMDDHHmmssSSS')
            },
            comment: '移机记录id'
        },

        activeId: {
            type: STRING(32),
            allowNull: false,
            comment: '激活记录id'
        },

        oldDeviceCode: {
            type: STRING(32),
            allowNull: false,
            comment: '旧设备编号'
        },

        newDeviceCode: {
            type: STRING(32),
            allowNull: false,
            comment: '新设备编号'
        },

        oldUsername: {
            type: STRING(30),
            allowNull: false,
            comment: '旧用户名'
        },

        newUsername: {
            type: STRING(30),
            allowNull: false,
            comment: '新用户名'
        },

        adminId: {
            type: UUID,
            allowNull: false,
            comment: '操作员id'
        },

        payment: {
            type: TINYINT,
            allowNull: false,
            defaultValue: PAYMENT_STATUS.UNPAYMENT,
            comment: '结算状态 1:已结算 0:未结算'
        },

        paymentAt: {
            type: DATE,
            allowNull: true,
            comment: '结算时间'
        }

    }, {
        comment: '移机记录表',
        indexes: [
            {
                fields: [ 'adminId']
            }
        ]
    })

    DeviceMoveModel.associate = function () {
        const { Device, Admin, DeviceActive } = app.model
        
        DeviceMoveModel.belongsTo(Device, {
            as: 'oldDevice',
            targetKey: 'deviceCode',
            foreignKey: 'oldDeviceCode',
            constraints: false,
        })

        DeviceMoveModel.belongsTo(Device, {
            as: 'newDevice',
            targetKey: 'deviceCode',
            foreignKey: 'newDeviceCode',
            constraints: false,
        })

        DeviceMoveModel.belongsTo(DeviceActive, {
            as: 'active',
            targetKey: 'activeId',
            foreignKey: 'activeId',
            constraints: false,
        })

        DeviceMoveModel.belongsTo(Admin, {
            as: 'admin',
            targetKey: 'adminId',
            foreignKey: 'adminId',
            constraints: false,
        })
    }

    
    return DeviceMoveModel
}