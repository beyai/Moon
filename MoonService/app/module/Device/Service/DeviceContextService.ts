import { SessionCacheService } from "@/module/Service/Session/SessionCacheService"
import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg"
import { AbstractService } from "app/Common"
import { SessionContext, SessionBody } from "app/Common"
import { ApplicationService, DeviceSessionService } from "app/module/Service"

// 设备元数据
interface DeviceMeta {
    // 团队唯一标识
    teamIdentifier: string;
    // 应用唯一标识
    bundleIdentifier: string;
    // 应用包名
    bundleName: string;
    // 型号
    model: string;
    // 挑战因子
    challenge: string;
    // App版本号
    version: string;
}

// 设备协商完成响应信息
interface DeviceResponseData {
    // 设备码
    deviceCode: string;
    // App 版本号
    version: string;
    // 版本号状态
    status: boolean;
    // App 下载地址
    downloadURL: string;
    // JSBundle 解码密钥
    secretKey: string;
}

const DEVICE_SESSION_CONTEXT_DEVICE_UID = Symbol('DeviceContextService.deviceUID')
const DEVICE_SESSION_CONTEXT_BODY       = Symbol('DeviceContextService.body')

@ContextProto({ accessLevel: AccessLevel.PRIVATE })
export class DeviceContextService extends AbstractService {

    @Inject()
    private readonly sessionService: DeviceSessionService
    @Inject()
    private readonly sessionCache: SessionCacheService
    @Inject()
    private readonly appService: ApplicationService

    private [DEVICE_SESSION_CONTEXT_DEVICE_UID]: string;
    private [DEVICE_SESSION_CONTEXT_BODY]: Record<string, any>;
    private readonly sessionContext = new SessionContext()

    // APP 包配置
    private get appBundle() {
        return this.config.appBundle
    }

    // 防重放时间窗口
    private get timeWin() {
        return this.config.replayTimeWin ?? {
            pastWin: 5 * 60,
            futureWin: 60
        }
    }

    // 设置唯一标识
    get deviceUID() {
        return this[DEVICE_SESSION_CONTEXT_DEVICE_UID]
    }
    set deviceUID(value: string) {
        this[DEVICE_SESSION_CONTEXT_DEVICE_UID] = value
    }

    // 请求 body 数据
    get body() {
        return this[DEVICE_SESSION_CONTEXT_BODY]
    }
    set body(value: Record<string, any>) {
        const { timestamp } = value;
        if (typeof timestamp !== 'number') {
            throw new TypeError(`请求无效`)
        }
        const now = Math.round(Date.now() / 1000)
        const { pastWin, futureWin } = this.timeWin
        if (now - timestamp > pastWin) {
            throw new Error(`请求已过期`)
        }
        if (timestamp - now > futureWin) {
            throw new Error(`时间异常`)
        }
        this[DEVICE_SESSION_CONTEXT_BODY] = value
    }
   
    /**
     * 挑战因子
     */
    async generateChallenge() {
        return await this.sessionCache.generateChallenge()
    }

    /**
     * 获取设备元数据
     * @param sessionBody 当前请求会话数据
     * @param remotePublicKey 远端公钥
     */
    async getDeviceMeta( sessionBody: SessionBody, remotePublicKey: Buffer ): Promise<DeviceMeta> {
        
        this.sessionContext.importLocalKey(this.appBundle.privateKey)
        this.sessionContext.importRemoteKey(remotePublicKey)

        const deviceMeta: DeviceMeta = await this.sessionContext.decode(sessionBody)
        if (deviceMeta.teamIdentifier !== this.appBundle.teamIdentifier )  {
            throw new Error('开发者团队唯一标识不一致')
        }
        if (deviceMeta.bundleIdentifier !== this.appBundle.bundleIdentifier )  {
            throw new Error('应用唯一标识不一致')
        }
        if (deviceMeta.bundleName !== this.appBundle.bundleName )  {
            throw new Error('App项目名称不一致')
        }
        if (!deviceMeta.challenge) {
            throw new Error("挑战因子不存在")
        }

        await this.sessionCache.verifyChallenge(deviceMeta.challenge)

        return deviceMeta
    }

    /**
     * 创建会话
     * @param remotePublicKey 设备临时公钥
     * @param data 协商响应数据
     */
    private async createSession(remotePublicKey: Buffer, data: DeviceResponseData ) {
        this.sessionContext.generateLocalKey()
        this.sessionContext.importRemoteKey(remotePublicKey)

        const encodeData = await this.sessionContext.encode(data)
        const body = SessionBody.create({
            deviceUID: this.deviceUID, 
            tag: encodeData.tag,
            nonce: encodeData.nonce,
            body: encodeData.body
        })

        body.setPayload({
            "EK": this.sessionContext.exportLocalPublicKey() 
        })

        // 缓存当前临时会话数据
        await this.sessionCache.save(this.deviceUID, {
            privateKey: this.sessionContext.exportLocalPrivateKey(),
            publicKey: remotePublicKey
        })

        return body.toJSON()
    }

    /**
     * 登记设备
     */
    async checkIn(ctx: EggContext) {
        let sessionBody: ReturnType<typeof SessionBody.fromJSON>
        let payload: Record<string,any> 

        try {
            sessionBody = SessionBody.fromJSON(ctx.request.body)
            payload = sessionBody.getPayload()
            if (!payload || !Buffer.isBuffer(payload.EK)) {
                throw new Error('负载数据无效')
            }
        } catch {
            ctx.throw(400, '请求无效')
        }

        try {
            // 获取设备元数据
            const deviceMeta = await this.getDeviceMeta(sessionBody, payload.PK)
            this.deviceUID = sessionBody.deviceUID

            // 加载 App 版本信息
            const versionInfo = await this.appService.findByVersion(deviceMeta.version)

            return await this.model.transaction(async (transaction) => {

                // 保存设备长期密钥
                const publicKey = payload.PK.toString('base64');
                const { deviceCode } = await this.sessionService.createOrUpdate({
                    deviceUID: sessionBody.deviceUID,
                    model: deviceMeta.version,
                    publicKey: publicKey
                }, transaction )
                
                // 应用协商成功数据
                const data = {
                    deviceCode,
                    version: versionInfo.version,
                    status: !!versionInfo.status,
                    secretKey   : versionInfo.secretKey,
                    downloadURL: this.appBundle.appStoreURL
                }

                const result = await this.createSession(payload.EK, data)

                return result
            })
        } catch(err: any) {
            this.logger.error(err.message, ctx.request.body)
            ctx.throw(400, '设备异常，请与我们联系')
        }
    }

    /**
     * 协商
     */
    async negotiate(ctx: EggContext) {
        let sessionBody: ReturnType<typeof SessionBody.fromJSON>
        let payload: Record<string,any> 

        try {
            sessionBody = SessionBody.fromJSON(ctx.request.body)
            payload = sessionBody.getPayload()
            if (!payload || !Buffer.isBuffer(payload.EK)) {
                throw new Error('负载数据无效')
            }
        } catch {
            ctx.throw(400, '请求无效')
        }
        
        this.deviceUID = sessionBody.deviceUID
        const { publicKey, deviceCode } = await this.sessionService.findSession(ctx, this.deviceUID)
           
        try {
            // 获取设备元数据
            const deviceMeta = await this.getDeviceMeta(sessionBody, publicKey)
            // 加载 App 版本信息
            const versionInfo = await this.appService.findByVersion(deviceMeta.version)

            // 应用协商成功数据
            const data = {
                deviceCode,
                version: versionInfo.version,
                status: !!versionInfo.status,
                secretKey   : versionInfo.secretKey,
                downloadURL: this.appBundle.appStoreURL
            }

            const result = await this.createSession(payload.EK, data)
            return result
        } catch(err: any) {
            this.logger.error(err)
            ctx.throw(400, '设备异常，请与我们联系')
        }
    }

    /**
     * 验证会话
     */
    async verify(ctx: EggContext) {
        try {
            const sessionBody = SessionBody.fromJSON(ctx.request.body)
            this.deviceUID = sessionBody.deviceUID;
            const { publicKey, privateKey } = await this.sessionCache.load(this.deviceUID)
            this.sessionContext.importLocalKey(privateKey)
            this.sessionContext.importRemoteKey(publicKey)
            this.body = await this.sessionContext.decode(sessionBody)
        } catch(err: any) {
            ctx.throw(402, `会话验证失败`)
        }
    }

    /**
     * 构建响应数据
     */
    async buildResponseData(ctx: EggContext, data: any) {
        try {
            const encodeData = await this.sessionContext.encode(data)
            const sessionBody = SessionBody.create({
                deviceUID: this.deviceUID,
                nonce: encodeData.nonce,
                tag: encodeData.tag,
                body: encodeData.body
            })
            return sessionBody.toJSON()
        } catch(err: any) {
            this.logger.error(err.message, data)
            ctx.throw(400, `请求失败`)
        }
    }

}