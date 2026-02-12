import { AccessLevel, Inject, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { CacheService } from "../Cache";

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class DeviceUseTimeService extends AbstractService {
    @Inject()
    Cache: CacheService

    // 设备未激活每最小可累计使用时长
    get unActiveMaxUseSec() {
        return this.config.unActiveMaxUseSec || 1500
    }

    // 获取使用时长
    async getUsedTime(deviceCode: string) {
        const key = `use:${ deviceCode }`
        const count = await this.Cache.get(key)
        
        if (count && count >= this.unActiveMaxUseSec) {
            // 获取等待时长
            const ttl = await this.Cache.ttl(key)
            let errorMsg = ttl <= 0 ? "该设备已被禁止试用！" : `已累计达到最大试用时长限制, 请等待 ${ Math.ceil(ttl / 60) }分钟，欢迎再次试用！`
            throw new Error(errorMsg)
        }
    }
    
}