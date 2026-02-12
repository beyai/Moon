const dayjs = require('dayjs')
const { PAYMENT_STATUS, DEVICE_ACTIVE_LEVELS } = require('../enum')
/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, TINYINT, DATE } = app.Sequelize

    const DeviceActiveModel = app.model.define('device_active', {

        activeId: {
            type: STRING(32),
            primaryKey: true,
            defaultValue() {
                return dayjs().format('YYMMDDHHmmssSSS')
            },
            comment: '激活记录id'
        },

        deviceCode: {
            type: STRING(32),
            allowNull: false,
            comment: '设备编号'
        },

        activeAt: {
            type: DATE,
            allowNull: true,
            comment: '激活时间'
        },

        level: {
            type: STRING(10),
            allowNull: false,
            defaultValue: DEVICE_ACTIVE_LEVELS.MEDIUM,
            comment: '激活级别 low:低 medium:中 high:高'
        },

        expiredAt: {
            type: DATE,
            allowNull: true,
            comment: '过期时间'
        },
        
        adminId: {
            type: UUID,
            allowNull: true,
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
        comment: '激活记录表',
        indexes: [
            {
                fields: [ 'deviceCode']
            },
            {
                fields: [ 'adminId']
            }
        ]
    })

    DeviceActiveModel.associate = function () {
        const { Device, Admin } = app.model
        
        DeviceActiveModel.belongsTo(Device, {
            as: 'device',
            targetKey: 'deviceCode',
            foreignKey: 'deviceCode',
            constraints: false,
        })

        DeviceActiveModel.belongsTo(Admin, {
            as: 'admin',
            targetKey: 'adminId',
            foreignKey: 'adminId',
            constraints: false,
        })
    }

    
    return DeviceActiveModel
}