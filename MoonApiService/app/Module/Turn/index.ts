import { AccessLevel, EggContext, Inject, SingletonProto } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { CacheService } from "app/Core";
import {  SettingService } from "../Setting";
import { IceServer } from "../Setting/interface";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class TurnService extends BaseService {

    @Inject()
    cacheService: CacheService
    @Inject()
    settingService: SettingService

    //  Cludflare Turn Api配置
    private get cloudflare() {
        return this.config.cloudflare ?? {
            enable: false,
            ttl: 3600 * 8,
            threshold: 3600 * 4,
            regionBlackList: ['CN'],
            timeout: 15000
        }
    }

    /**
     * 获取缓存
     * @param deviceCode 设备码
     */
    private async getCache(deviceCode: string) {
        return await this.cacheService.get(`turn:${ deviceCode }`)
    }

    /**
     * 设置缓存
     * @param deviceCode 设备码
     * @param iceServer Turn服务器信息
     */
    private async setCache(deviceCode: string, iceServer: IceServer ) {
        const { ttl } = this.cloudflare
        return await this.cacheService.set(`turn:${ deviceCode }`, iceServer, ttl)
    }
    
    /**
     * 剩余时长
     * @param deviceCode 设备码
     */
    private async getCacheTTL(deviceCode: string) {
        return await this.cacheService.ttl(`turn:${ deviceCode }`)
    }

    /**
     * 远程获取
     * @param deviceCode 设备码
     */
    private async getCloudflare(
        deviceCode: string
    ): Promise<IceServer> {
        const { appId, secretKey, ttl, timeout } = this.cloudflare
        try {
            const req = await this.httpclient.request(`https://rtc.live.cloudflare.com/v1/turn/keys/${ appId }/credentials/generate`, {
                method: 'POST',
                dataType: 'json',
                contentType: 'json',
                timeout: timeout,
                retry: 1,
                retryDelay: 100,
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
                urls: iceServers.urls.filter((( item: string ) => !item.includes(":80"))),
                username: iceServers.username,
                credential: iceServers.credential
            } as IceServer
        } catch (error: any) {
            this.logger.error(`CloudflareTurn Error: %s`, error.message)
            this.throw(400, `CloudflareTurn 服务异常`)
        }
    }
    
    /**
     * 获取 IceServicers 服务
     * @param deviceCode 设备码
     * @returns 
     */
    async getIceServers(
        deviceCode: string
    ): Promise<IceServer[]> {
        const { enable, regionBlackList, threshold } = this.cloudflare;
        let iceServers: IceServer[] = this.settingService.iceServers

        if (enable) {
            const { countryCode } = this.geoip
            if (!countryCode || countryCode == "NONE" ||  regionBlackList.includes(countryCode)) {
                return iceServers
            }
            try {
                const ttl = await this.getCacheTTL(deviceCode)
                if (ttl > threshold) {
                    const iceServer = await this.getCache(deviceCode)
                    if (iceServer) {
                        return [ iceServer ]
                    }
                }
                
                // 加载或刷新
                const result = await this.getCloudflare(deviceCode)
                await this.setCache(deviceCode, result)
                return [ result ]
            } catch(error: any) {
            }
        }
        return iceServers
    }

}