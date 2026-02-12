import { AccessLevel, ContextProto, Inject } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { SessionCacheService } from "../../Service/SessionCacheService";
import { SessionBody, SessionManager } from "app/Common/Session";
import { ClientMeta, ClientSessionResponseData, SessionRequestBody } from "../../interface";
import { isEmpty } from "lodash";


const CLIENT_CONTEXT_BODY = Symbol('ClientContextService.body')

@ContextProto({ accessLevel: AccessLevel.PRIVATE })
export class ClientContextService extends BaseService {
    
    @Inject()
    private readonly sessionCache: SessionCacheService
    /** 设备加解密会话管理 */
    private readonly sessionManager = new SessionManager()

    /** 客户端应用包配置 */
    get clientBundle() {
        return this.config.clientBundle
    }
    
    /** 设备唯一标识 */
    deviceUID?: string

    private [CLIENT_CONTEXT_BODY]: Record<string, any>
    get body() {
        return this[CLIENT_CONTEXT_BODY]
    }

    private set body(data: Record<string, any>) {
        try {
            this.sessionCache.verifyTimestmap(data.timestamp)
        } catch(error: any) {
            this.logger.error(`数据已过期：%s`, error.message)
            this.throw(400, '无效请求')
        }
        this[CLIENT_CONTEXT_BODY] = data
    }

    /**
     * 获取客户端元数据
     * @param sessionBody 会话原始数据
     * @param remotePublicKey 远端公钥
     */
    private async getClientMeta( sessionBody: SessionBody, remotePublicKey: Buffer ) {
        this.sessionManager.importLocalKey(this.clientBundle.privateKey)
        this.sessionManager.importRemoteKey(remotePublicKey)
        
        let clientMeta: ClientMeta
        try {
            clientMeta = await this.sessionManager.decode(sessionBody)
        } catch (error: any) {
            this.logger.error("客户端元数据解码失败：%s", error.message )
            this.throw(400, `客户端元数据解码失败`)
        }

        if (isEmpty(clientMeta.challenge)) {
            this.throw(400, `挑战因子不存在`)
        }
        try {
            await this.sessionCache.verifyChallenge(clientMeta.challenge)
        } catch {
            this.throw(400, `挑战因子验证失败`)
        }

        const { bundleIdentifier, bundleName } = this.clientBundle
        if (clientMeta.bundleIdentifier !== bundleIdentifier) {
            this.throw(400, `客户端唯一标识错误`)
        }
        if (clientMeta.bundleName !== bundleName) {
            this.throw(400, `客户端包名错误`)
        }

        return clientMeta
    }

    /**
     * 创建会话
     * @param remotePublicKey 远端临时公钥
     * @param responseData 响应明文数据
     */
    private async createSession(remotePublicKey: Buffer, responseData: ClientSessionResponseData) {
        if (!this.deviceUID) {
            this.throw(400, '客户端唯一标识未定义')
        }

        let body: SessionBody
        try {
            this.sessionManager.generateLocalKey()
            this.sessionManager.importRemoteKey(remotePublicKey)
            const encodeData = await this.sessionManager.encode(responseData)
            body = SessionBody.create({
                deviceUID: this.deviceUID,
                tag: encodeData.tag,
                nonce: encodeData.nonce,
                body: encodeData.body
            })
            body.setPayload({
                "EK": this.sessionManager.exportLocalPublicKey()
            })
        } catch(error: any) {
            this.logger.error("客户端会话响应数据编码失败：%s", error.message)
            this.throw(400, '客户端会话响应数据编码失败')
        }

        // 缓存临时会话数据
        try {
            await this.sessionCache.set(this.deviceUID, {
                privateKey: this.sessionManager.exportLocalPrivateKey(),
                publicKey: remotePublicKey
            })
            return body.toJSON()
        } catch (error: any) {
            this.logger.error("客户端会话密钥缓存失败：%s", error.message)
            this.throw(400, `客户端会话密钥缓存失败`)
        }
    }

    /**
     * 协商临时密钥
     * @param requestBody 请求原始数据
     */
    async negotiate(requestBody: SessionRequestBody) {
        let sessionBody: SessionBody
        try {
            sessionBody = SessionBody.fromJSON(requestBody)
        } catch(error: any) {
            this.logger.error(`数据格式不正确：%s`, error.message)
            this.throw(400, `数据格式不正确`)
        }

        const payload = sessionBody.getPayload()
        if (!payload || !Buffer.isBuffer(payload.EK )) {
            this.throw(400, `缺少必要参数`)
        }

        this.deviceUID = sessionBody.deviceUID
        const clientMeta = await this.getClientMeta(sessionBody, payload.EK)

        return await this.createSession(payload.EK, {
            version: clientMeta.version,
            downloadURL: this.clientBundle.downloadURL
        })
    }

    /**
     * 验证请求
     */
    async verifyRequest(requestBody: SessionRequestBody) {
        try {
            const sessionBody = SessionBody.fromJSON(requestBody)
            const { publicKey, privateKey } = await this.sessionCache.get(sessionBody.deviceUID)
            this.deviceUID = sessionBody.deviceUID;
            this.sessionManager.importLocalKey(privateKey)
            this.sessionManager.importRemoteKey(publicKey)
            this.body = await this.sessionManager.decode(sessionBody)
            return true
        } catch(error: any) {
            this.logger.error("客户端请求验证失败：%s", error.message)
            return false
        }
    }

    /**
     * 响应数据
     */
    async buildResponse(data: any) {
        try {
            if (!this.deviceUID) {
                this.throw(400, '客户端唯一标识未定义')
            }
            const encodeData = await this.sessionManager.encode(data)
            const sessionBody = SessionBody.create({
                deviceUID: this.deviceUID,
                nonce: encodeData.nonce,
                tag: encodeData.tag,
                body: encodeData.body
            })
            return sessionBody.toJSON()
        } catch(error: any) {
            this.logger.error("客户端响应数据构建失败：%s", error.message)
            this.throw(400, `客户端响应数据构建失败`)
        }
    }

}