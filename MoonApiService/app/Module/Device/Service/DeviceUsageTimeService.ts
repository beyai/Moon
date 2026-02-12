import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { CacheService } from "app/Core";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class DeviceUsageTimeService extends BaseService {
    @Inject()
    cacheService: CacheService

    /**
     * 设备未激活每小时，允许可使用时长
     */
    get deviceUsageTimeLimit() {
        return this.config.deviceUsageTimeLimit || 1500
    }

    /**
     * 获取等待时间
     * @param deviceCode 
     */
    async getWaitTime(deviceCode: string) {
        const key = `use:${ deviceCode }`
        // 已使用时间
        const count = await this.cacheService.get(key)
        // 等待时长
        if (count && count >= this.deviceUsageTimeLimit) {
            return await this.cacheService.ttl(key)
        }
        return 0
    }
    
}