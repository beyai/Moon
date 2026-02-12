import { AccessLevel, ContextProto, Inject } from "@eggjs/tegg";
import { BaseService } from "app/Common";
import { SessionBody, SessionManager } from "app/Common/Session";
import { ApplicationService } from "app/Module/Application";
import { DeviceSessionService } from "app/Module/Device";
import { SessionCacheService } from "../../Service/SessionCacheService";
import { ApplicationStatus } from "app/Enum";
import type { DeviceMeta, DeviceSessionResponseData, SessionRequestBody } from "../../interface";
import { isEmpty } from "lodash";

const DEVICE_CONTEXT_BODY = Symbol('DeviceContextService.body')

@ContextProto({ accessLevel: AccessLevel.PRIVATE })
export class DeviceContextService extends BaseService {

    @Inject()
    private readonly applicationService: ApplicationService
    @Inject()
    private readonly sessionService: DeviceSessionService
    @Inject()
    private readonly sessionCache: SessionCacheService
    /** 设备加解密会话管理 */
    private readonly sessionManager = new SessionManager()
    

    /** App 应用包信息 */
    private get appBundle() {
        return this.config.appBundle
    }

    /** 设备唯一标识 */
    deviceUID?: string

    /** 请求内容 */
    private [DEVICE_CONTEXT_BODY]: Record<string, any>
    get body() {
        return this[DEVICE_CONTEXT_BODY]
    }
    private set body(data: Record<string, any>) {
        try {
            this.sessionCache.verifyTimestmap(data.timestamp)
        } catch(error: any) {
            this.logger.error(`数据已过期：%s`, error.message)
            this.throw(400, '无效请求')
        }
        this[DEVICE_CONTEXT_BODY] = data
    }
    
    /**
     * 获取设备元数据
     * @param sessionBody 会话原始数据
     * @param remotePublicKey 远端公钥
     */
    private async getDeviceMeta(sessionBody: SessionBody, remotePublicKey: Buffer ) {
        this.sessionManager.importLocalKey(this.appBundle.privateKey)
        this.sessionManager.importRemoteKey(remotePublicKey)
        
        let deviceMeta: DeviceMeta
        try {
            deviceMeta = await this.sessionManager.decode(sessionBody)
        } catch (error: any) {
            this.logger.error("设备元数据解码失败：%s", error.message )
            this.throw(400, `设备元数据解码失败`)
        }

        if (isEmpty(deviceMeta.challenge)) {
            this.throw(400, `挑战因子不存在`)
        }
        try {
            await this.sessionCache.verifyChallenge(deviceMeta.challenge)
        } catch {
            this.throw(400, `挑战因子验证失败`)
        }

        const { teamIdentifier, bundleIdentifier, bundleName } = this.appBundle
        if (deviceMeta.teamIdentifier !== teamIdentifier) {
            this.throw(400, `开发者团队唯一标识错误`)
        }
        if (deviceMeta.bundleIdentifier !== bundleIdentifier) {
            this.throw(400, `应用唯一标识错误`)
        }
        if (deviceMeta.bundleName !== bundleName) {
            this.throw(400, `App包名错误`)
        }
        
        return deviceMeta
    }

    /**
     * 创建会话
     * @param remotePublicKey 远端临时公钥
     * @param responseData 响应明文数据
     */
    private async createSession(remotePublicKey: Buffer, responseData: DeviceSessionResponseData) {
        if (!this.deviceUID) {
            this.throw(400, '设备唯一标识未定义')
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
            this.logger.error("设备会话响应数据编码失败：%s", error.message)
            this.throw(400, '设备会话响应数据编码失败')
        }

        // 缓存临时会话数据
        try {
            await this.sessionCache.set(this.deviceUID, {
                privateKey: this.sessionManager.exportLocalPrivateKey(),
                publicKey: remotePublicKey
            })
            return body.toJSON()
        } catch (error: any) {
            this.logger.error("设备会话密钥缓存失败：%s", error.message)
            this.throw(400, `设备会话密钥缓存失败`)
        }
    }

    /**
     * 登记设备
     * @param requestBody 请求原始数据
     */
    async checkIn( requestBody: SessionRequestBody ) {
        let sessionBody: SessionBody
        try {
            sessionBody = SessionBody.fromJSON(requestBody)
        } catch(error: any) {
            this.logger.error(`数据格式不正确：%s`, error.message)
            this.throw(400, `数据格式不正确`)
        }

        const payload = sessionBody.getPayload()
        if (!payload || !Buffer.isBuffer(payload.PK) || !Buffer.isBuffer(payload.EK )) {
            this.throw(400, `缺少必要参数`)
        }

        this.deviceUID = sessionBody.deviceUID
        const deviceMeta = await this.getDeviceMeta(sessionBody, payload.PK)
        const { deviceCode } = await this.sessionService.createOrUpdate(this.deviceUID, payload.PK, deviceMeta.model)
        const versionData = await this.applicationService.findVersion(deviceMeta.version)
        
        return await this.createSession(payload.EK, {
            deviceCode,
            version: versionData.version,
            status: versionData.status === ApplicationStatus.NORMAL,
            secretKey: versionData.secretKey,
            downloadURL: this.appBundle.appStoreURL
        })
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

        const { deviceCode, publicKey } = await this.sessionService.findSession(sessionBody.deviceUID)
        const deviceMeta = await this.getDeviceMeta(sessionBody, publicKey)
        const versionData = await this.applicationService.findVersion(deviceMeta.version)
        return await this.createSession(payload.EK, {
            deviceCode,
            version: versionData.version,
            status: versionData.status === ApplicationStatus.NORMAL,
            secretKey: versionData.secretKey,
            downloadURL: this.appBundle.appStoreURL
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
            this.logger.error("请求验证失败：%s", error.message)
            return false
        }
    }

    /**
     * 响应数据
     */
    async buildResponse(data: any) {
        try {
            if (!this.deviceUID) {
                this.throw(400, '设备唯一标识未定义')
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
            this.logger.error("响应数据构建失败：%s", error.message)
            this.throw(400, `响应数据构建失败`)
        }
    }

}