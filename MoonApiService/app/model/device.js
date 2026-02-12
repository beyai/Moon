const dayjs = require('dayjs')
const { STATUS_TYPES, DEVICE_ACTIVE_LEVELS } = require('../enum')

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, TINYINT, DATE, BOOLEAN, VIRTUAL } = app.Sequelize

    const DeviceModel = app.model.define('device', {

        deviceId: {
            type: STRING(32),
            primaryKey: true,
            defaultValue() {
                return dayjs().format('YYMMDDHHmmssSSS')
            },
            comment: '设备id'
        },

        deviceUID: {
            type: UUID,
            allowNull: true,
            unique: true,
            comment: '唯一标识'
        },

        deviceCode: {
            type: STRING(32),
            allowNull: false,
            unique: true,
            comment: '设备编号'
        },

        version: {
            type: STRING(32),
            defaultValue: '',
            comment: 'App版本号'
        },
        
        clientVersion: {
            type: STRING(32),
            defaultValue: '',
            comment: '客户端版本号'
        },

        activeId: {
            type: STRING(32),
            allowNull: true,
            comment: '激活id'
        },

        isOnline: {
            type: BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '是否在线'
        },

        clientIsOnline: {
            type: BOOLEAN,
            allowNull: false,
            defaultValue: false,
            comment: '客户端是否在线'
        },

        connectedAt: {
            type: DATE,
            allowNull: true,
            comment: '连接时间'
        },

        disconnectedAt: {
            type: DATE,
            allowNull: true,
            comment: '断开时间'
        },

        connectedIp: {
            type: STRING(16),
            allowNull: true,
            comment: '连接ip'
        },

        status: {
            type: TINYINT,
            allowNull: false,
            defaultValue: STATUS_TYPES.NORMAL,
            comment: '状态 1:正常 0:禁用'
        },

        userId: {
            type: UUID,
            allowNull: true,
            comment: '用户id'
        },

        adminId: {
            type: UUID,
            allowNull: true,
            comment: '管理员id'
        },

        isActive: {
            type: VIRTUAL,
            comment: '是否激活',
            get() {
                const active = this.getDataValue('active')
                if (!active) return false;
                const expiredAt = dayjs(active.expiredAt)
                return dayjs().isBefore(expiredAt);
            }
        },

        activeLevel: {
            type: VIRTUAL,
            comment: '激活等级',
            get() {
                const active = this.getDataValue('active')
                return active ? active.level : DEVICE_ACTIVE_LEVELS.HIGH
            }
        },

        activeAt: {
            type: VIRTUAL,
            comment: '激活时间',
            get() {
                const active = this.getDataValue('active')
                return active ? active.activeAt : null
            }
        },
        
        countDays: {
            type: VIRTUAL,
            comment: '激活剩余天数',
            get() {
                const active = this.getDataValue('active')
                if (!active) return 0;
                const expiredAt = dayjs(active.expiredAt)
                const now = dayjs()
                if (now.isAfter(expiredAt)) {
                    return 0
                }
                return expiredAt.diff(now, 'day')
            }
        },

        todayUseTotal: {
            type: VIRTUAL,
            comment: '今日使用时长',
            get() {
                const record = this.getDataValue('useTotal')
                return record ? record.total : 0
            }
        },


    }, {
        comment: '设备表',
        indexes: [
            {
                fields: [ 'userId']
            },
            {
                fields: [ 'adminId']
            },
            {
                fields: [ 'deviceCode']
            }
        ]
    })

    DeviceModel.associate = function () {
        const { User, Admin, DeviceActive } = app.model

        DeviceModel.belongsTo(User, {
            as: 'user',
            targetKey: 'userId',
            foreignKey: 'userId',
            constraints: false,
        })

        DeviceModel.belongsTo(Admin, {
            as: 'admin',
            targetKey: 'adminId',
            foreignKey: 'adminId',
            constraints: false,
        })

        DeviceModel.belongsTo(DeviceActive, {
            as: 'active',
            targetKey: 'activeId',
            foreignKey: 'activeId',
            constraints: false,
        })

    }

    
    return DeviceModel
}