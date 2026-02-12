import { AccessLevel, ContextProto, EggContext, Inject, SingletonProto } from "@eggjs/tegg";
import { AbstractService, SessionBody, SessionContext } from "app/Common";
import { SessionCacheService } from "app/module/Service/Session";


// 客户端元数据
interface ClientMeta {
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

// 客户端协商完成响应信息
interface DeviceResponseData {
    // App 版本号
    version: string;
    // App 下载地址
    downloadURL: string;
}

const CLIENT_SESSION_CONTEXT_DEVICE_UID = Symbol('ClientContextService.deviceUID')
const CLIENT_SESSION_CONTEXT_BODY       = Symbol('ClientContextService.body')

@ContextProto({ accessLevel: AccessLevel.PRIVATE })
export class ClientContextService extends AbstractService {

    @Inject()
    private readonly sessionCache: SessionCacheService
    private readonly sessionContext = new SessionContext()

    // 客户端包配置
    private get desktopClient() {
        return this.config.desktopClient
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
        return this[CLIENT_SESSION_CONTEXT_DEVICE_UID]
    }
    set deviceUID(value: string) {
        this[CLIENT_SESSION_CONTEXT_DEVICE_UID] = value
    }

    // 请求 body 数据
    get body() {
        return this[CLIENT_SESSION_CONTEXT_BODY]
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

        this[CLIENT_SESSION_CONTEXT_BODY] = value
    }

    /**
     * 挑战因子
     */
    async generateChallenge() {
        return await this.sessionCache.generateChallenge()
    }

     /**
     * 获取客户端元数据
     * @param sessionBody 当前请求会话数据
     * @param remotePublicKey 远端公钥
     */
    async getClientMeta( sessionBody: SessionBody, remotePublicKey: Buffer ): Promise<ClientMeta> {
        
        this.sessionContext.importLocalKey(this.desktopClient.privateKey)
        this.sessionContext.importRemoteKey(remotePublicKey)
        const clientMeta: ClientMeta = await this.sessionContext.decode(sessionBody)
        if (clientMeta.bundleIdentifier !== this.desktopClient.bundleIdentifier )  {
            throw new Error('应用唯一标识不一致')
        }
        if (clientMeta.bundleName !== this.desktopClient.bundleName )  {
            throw new Error('App项目名称不一致')
        }
        if (!clientMeta.challenge) {
            throw new Error("挑战因子不存在")
        }
        await this.sessionCache.verifyChallenge(clientMeta.challenge)
        return clientMeta
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
     * 协商临时密钥
     */
    async negotiate(ctx: EggContext) {
        try {
            const sessionBody = SessionBody.fromJSON(ctx.request.body)
            const payload = sessionBody.getPayload()
            if (!payload) {
                throw new Error(`无效的负载数据`)
            }
            if (!Buffer.isBuffer(payload.EK)) {
                throw new Error(`负载数据格式无效`)
            }
            this.deviceUID = sessionBody.deviceUID
            // 获取元数据
            const clientMeta = await this.getClientMeta(sessionBody, payload.EK )

            const result = await this.createSession(payload.EK, {
                version: clientMeta.version,
                downloadURL: "https://"
            })
            return result
        } catch(err: any) {
            this.logger.error(err.message, ctx.request.body)
            ctx.throw(400, '客户端异常，请与我们联系')
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
            ctx.throw(400, `服务端数据格式不正确`)
        }
    }
}