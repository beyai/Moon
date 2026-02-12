'use strict';
const Subscription = require('egg').Subscription;

class DeviceSubscription extends Subscription {
    static get schedule() {
        return {
            cron: '0 0 */6 * * *', // 每6小时执行一次
            type: 'worker',  // 仅一个worker进程执行
            disable: false, // 禁用
            immediate: true, // App启动时执行一次
        };
    }

    async subscribe() {
        const Op = this.app.Sequelize.Op
        const { Device, DeviceActive } = this.app.model;
        try {
            // 查找过期设备
            const expired = await Device.findAll({
                attributes: ['deviceCode', 'activeId'],
                where: {
                    activeId: {
                        [Op.not]: null
                    }
                },
                include: [{
                    as: 'active',
                    model: DeviceActive,
                    attributes: [],
                    where: {
                        expiredAt: {
                            [Op.lt]: new Date()
                        }
                    }
                }],
                raw: true
            })
            if (!expired.length) return
            const deviceCodes = expired.map(item => item.deviceCode)
            // 解除设备绑定
            await Device.update({
                activeId: null
            }, {
                where: {
                    deviceCode: {
                        [Op.in]: deviceCodes
                    }
                }
            })
            this.logger.info(`过期设备: ${ deviceCodes } 共 ${ expired.length } 条`)
        } catch(err) {
            this.logger.error(err)
        }
    }
}

module.exports = DeviceSubscription;
