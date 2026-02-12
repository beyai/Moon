import {  DeviceRiskStatus } from 'app/InterFace';
import { SaveOptions } from 'sequelize';
import { Column, Table, DataType, Model, PrimaryKey, AllowNull, Unique, Default, AutoIncrement, AfterCreate } from 'sequelize-typescript'

@Table({
    modelName: 'device_session',
})
export class DeviceSession extends Model {

    @PrimaryKey
    @AutoIncrement
    @Column({
        type: DataType.INTEGER.UNSIGNED,
        comment: '记录ID',
    })
    id: number;

    @Unique
    @AllowNull(false)
    @Column({
        type: DataType.UUID,
        comment: '设备唯一标识',
        set: function(value: string) {
            this.setDataValue("deviceUID", value.toUpperCase())
        }
    })
    deviceUID: string;

    @AllowNull(true)
    @Unique
    @Column({
        type: DataType.STRING(32),
        comment: '设备码',
    })
    deviceCode: string;

    @AllowNull(false)
    @Column({
        type: DataType.STRING(255),
        comment: '设备公钥',
    })
    publicKey: string;

    @Column({
        type: DataType.STRING(32),
        comment: '设备型号',
    })
    model: string;

    @AllowNull(false)
    @Default(1)
    @Column({
        type: DataType.TINYINT.UNSIGNED,
        comment: '密钥更新次数',
    })
    updatedCount: number

    @AllowNull(false)
    @Default(DeviceRiskStatus.NORMAL)
    @Column({
        type: DataType.TINYINT.UNSIGNED,
        comment: '风控状态 0: 删除 1:正常 2:风控中 3:风控栏截',
    })
    status: DeviceRiskStatus

    @AfterCreate
    static async generateDeviceCode(model: DeviceSession, options: SaveOptions ) {
        model.set('deviceCode', generateDeviceCode(model.id))
        await model.save({
            transaction: options.transaction
        })
    }

    static associate() {
        this.sync({})
    }
}

// 模数：10的9次方 (9位数的上限)
const MODULUS = 1_000_000_000; 
// 乘数：必须是大质数，且与 MODULUS 互质, 随便找个大的，只要不被 2 和 5 整除即可
const ULTIPLIER = 381_956_737; 
// 增量：任意数字，用于偏移结果，避免 1 对应太小的数字
const INCREMENT = 567_891; 

/**
 * 生成设备码
 * @param {number} sequenceId 自增ID
 */
function generateDeviceCode(sequenceId: number): string {
    const id = sequenceId;
    if (id >= MODULUS) {
        throw new Error('ID pool exhausted (max 1 billion)');
    }
    const shuffledId = (id * ULTIPLIER + INCREMENT) % MODULUS;
    console.log(id * ULTIPLIER + INCREMENT)
    return '6' + shuffledId.toString().padStart(9, '0');
}



export default () => DeviceSession
