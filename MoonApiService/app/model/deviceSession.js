'use strict';
const Sequelize         = require('sequelize')
const { STATUS_TYPES }  = require('../enum')

const MODULUS = 1_000_000_000; // 模数：10的9次方 (9位数的上限)
const ULTIPLIER = 381_956_737; // 乘数：必须是大质数，且与 MODULUS 互质, 随便找个大的，只要不被 2 和 5 整除即可
const INCREMENT = 567_891; // 增量：任意数字，用于偏移结果，避免 1 对应太小的数字

/**
 * 生成设备码
 * @param {number} sequenceId 自增ID
 */
function generateDeviceCode(sequenceId) {
    const id = sequenceId;
    if (id >= MODULUS) {
        throw new Error('ID pool exhausted (max 1 billion)');
    }
    const shuffledId = (id * ULTIPLIER + INCREMENT) % MODULUS;
    console.log(id * ULTIPLIER + INCREMENT)
    return '6' + shuffledId.toString().padStart(9, '0');
}


/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
    
    const { STRING, UUID, INTEGER, TINYINT  } =Sequelize

    const DeviceSession = app.model.define('deviceSession', {

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
        
        deviceCode: {
            type: STRING(18),
            allowNull: true,
            unique: true,
            comment: '设备码'
        },

        publicKey: {
            type: STRING(255),
            allowNull: false,
            comment: '设备公钥'
        },

        model: {
            type: STRING(32),
            comment: '设备型号',
        },

        status: {
            type: TINYINT.UNSIGNED,
            allowNull: false,
            defaultValue: STATUS_TYPES.NORMAL,
            comment: '状态 1:正常 0:禁用'
        },
    }, {
        comment: '设备验证',
        updatedAt: false,
        indexes: [
            {
                fields: [ 'deviceUID']
            },
        ]
    })

    DeviceSession.afterCreate('generateDeviceCode', async (model, options) => {
        let deviceCode = generateDeviceCode(model.id)
        model.set('deviceCode', deviceCode)
        await model.save()
    })

    DeviceSession.sync({
        force: false
    })

    return DeviceSession
}