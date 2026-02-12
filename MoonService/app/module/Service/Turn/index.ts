import { AccessLevel, EggContext, Inject, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { SettingService } from "../Setting";
import { CacheService } from "../Cache";
import { IceServer } from "app/InterFace";


@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class TurnService extends AbstractService {

    @Inject()
    Cache: CacheService
    @Inject()
    Setting: SettingService

    //  Cludflare Turn Api配置
    get cloudflare() {
        return this.config.cloudflare ?? {
            enable: false,
            ttl: 3600 * 8,
            ttlThreshold: 3600 * 4,
            blackList: ['CN'],
            timeout: 15000
        }
    }

    /**
     * 获取缓存
     * @param deviceCode 设备码
     */
    private async getCache(deviceCode: string) {
        return await this.Cache.get<IceServer>(`cf:${ deviceCode }`)
    }

    /**
     * 设置缓存
     * @param deviceCode 设备码
     * @param iceServer Turn服务器信息
     */
    private async setCache(deviceCode: string, iceServer: IceServer ) {
        const { ttl } = this.cloudflare
        return await this.Cache.set(`cf:${ deviceCode }`, iceServer, ttl)
    }
    
    /**
     * 剩余时长
     * @param deviceCode 设备码
     */
    private async getCacheTTL(deviceCode: string) {
        return await this.Cache.ttl(`cf:${ deviceCode }`)
    }

    /**
     * 加载服务器
     * @param deviceCode 设备码
     */
    private async fetch(
        ctx: EggContext,
        deviceCode: string
    ): Promise<IceServer> {
        const { appId, secretKey, ttl, timeout } = this.cloudflare
        const url = `https://rtc.live.cloudflare.com/v1/turn/keys/${ appId }/credentials/generate`
        try {
            const req = await ctx.curl(url, {
                method: 'POST',
                timeout: timeout,
                dataType: 'json',
                contentType: 'json',
                headers: {
                    "Authorization": `Bearer ${ secretKey }`
                },
                data: { 
                    ttl, 
                    customIdentifier: deviceCode 
                }
            })
            if (req.status > 300) {
                throw new Error(`CloudflareTurn 服务异常`)
            }
            let { iceServers } = req.data
            return {
                urls: iceServers.urls.filter((item => !item.includes(":80"))),
                username: iceServers.username,
                credential: iceServers.credential
            } as IceServer
        } catch (error: any) {
            this.logger.error(error.message)
            ctx.throw(500, `CloudflareTurn 服务异常`)
        }
    }

    async getIceServices(
        ctx: EggContext,
        deviceCode: string
    ): Promise<IceServer[]> {
        const { enable, blackList, ttlThreshold } = this.cloudflare;
        let iceServers: IceServer[] = this.Setting.iceServers

        if (enable) {
            const { countryCode } = this.geoip.get(ctx.ip)
            if (!countryCode || countryCode == "NONE" ||  blackList.includes(countryCode)) {
                return iceServers
            }
            try {
                const ttl = await this.getCacheTTL(deviceCode)
                console.log(ttl)
                if (ttl > ttlThreshold) {
                    const iceServer = await this.getCache(deviceCode)
                    if (iceServer) {
                        return [ iceServer ]
                    }
                }
                const result = await this.fetch(ctx, deviceCode)
                await this.setCache(deviceCode, result)
                return [ result ]
            } catch(error: any) {
            }
        }
        return iceServers
    }

}