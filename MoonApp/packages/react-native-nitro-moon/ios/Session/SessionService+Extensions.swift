import Foundation
import SwiftyJSON
import CryptoKit


struct AppVersionInfo {
    let version: String;
    let downloadURL: String;
    let status: Bool;
    let secretKey: Data?;
}

extension SessionService {
    
    /// 会话上下文
    private var ctx: SessionContext {
        SessionContext.shared
    }
    /// 请求服务
    private var service: SessionRequest {
        SessionRequest.shared
    }
    // 会话存储
    private var store: SessionStore {
        SessionStore.shared
    }
    
    /// 读取默认密钥
    @inline(__always)
    private func getDefaultKey() throws -> P256.KeyAgreement.PublicKey {
        guard let data = NitroMoonBridge.getServerIdentityKey() else {
            throw CreateError(message: "无法读取服务端公钥")
        }
        let publicKey = try P256.KeyAgreement.PublicKey( x963Representation: data )
        return publicKey
    }
    
    /// 获取设备码
    private func getDeviceCode() -> String? {
        return KeyChainStore.get(forKey: SecurityConst.StoreKey.DeviceCode)
    }
    
    /// 设置设备码
    private func setDeviceCode(_ deviceCode: String) throws {
        guard KeyChainStore.save(
            value: deviceCode,
            forKey: SecurityConst.StoreKey.DeviceCode
        ) else {
            throw CreateError(message: "设备码保存失败")
        }
    }
    
    /// 登记
    private func checkIn(_ checkInBody: SessionBody) async throws -> SessionBody {
        
        logger.debug("初始化注册设备")
        
        let PK = try ctx.exportKey()
        ctx.generateEK()
        let EK = try ctx.exportKey()
        var requestBody = checkInBody;
        requestBody.setPayload([ "PK": PK, "EK": EK ])
        
        return try await service.checkIn(requestBody)
    }
    
    /// 协商
    private func negotiate(_ negotiateBody: SessionBody) async throws -> SessionBody {
        logger.debug("协商会话密钥")
        
        ctx.generateEK()
        let EK = try ctx.exportKey()
        
        var requestBody = negotiateBody;
        requestBody.setPayload([ "EK": EK ])
        
        return try await service.negotiate(requestBody)
    }
    
    /// 构建注册/协商请求
    @discardableResult
    private func make() async throws -> AppVersionInfo {
        
        // 导入密钥
        do {
            let privateKey = try store.read(deviceUID)
            ctx.importPK(privateKey)
        } catch {
            logger.warn("设备密钥读取失败，已重置注册状态：\(error.localizedDescription)")
            self.state = .unregistered
            
            let privateKey = try store.create(deviceUID)
            ctx.importPK(privateKey)
        }
      
        // 服务端密钥
        let publicKey = try getDefaultKey()
        try ctx.importSK(publicKey)
        
        //  获取服务器挑战因子
        let challenge = try await service.getChallenge()
        
        // 请求数据
        let bodyData: [ String: Any ] = [
            "challenge"         : challenge,
            "model"             : Utils.deviceModel,
            "bundleName"        : NitroMoonBridge.getBundleName(),
            "bundleIdentifier"  : NitroMoonBridge.getBundleIdentifier(),
            "teamIdentifier"    : NitroMoonBridge.getTeamIdentifier(),
            "version"           : NitroMoonBridge.getVersion()
        ]
        
        let requestBody = try ctx.encode(bodyData)
        let responseBody: SessionBody
        
        do {
            if state == .registered {
                responseBody = try await negotiate(requestBody)
            } else {
                responseBody = try await checkIn(requestBody)
            }
        } catch let error as NSError {
            logger.error("code=\(error.code) message=\(error.localizedDescription)")
            // 设备删除，重置设备
            if error.code == 404 {
                self.reset()
            }
            throw error
        }
       
        // 获取负载数据，服务端临时公钥
        guard let payload = responseBody.getPayload(),
              let EK = payload["EK"] as? Data
        else {
            throw CreateError(message: "设备注册失败")
        }
        
        // 导入新的服务端公钥
        let pubKey = try P256.KeyAgreement.PublicKey(x963Representation: EK)
        try ctx.importSK(pubKey)
        
        // 解密数据
        guard let data          = try ctx.decode(responseBody) as? [String: Any],
              let deviceCode    = data["deviceCode"] as? String,
              let version       = data["version"] as? String,
              let secretKey     = data["secretKey"] as? String,
              let downloadURL   = data["downloadURL"] as? String,
              let status        = data["status"] as? Bool
        else {
            throw CreateError(message: "数据解码失败")
        }
        
        self.deviceCode = deviceCode
        self.state      = .registered
        
        return AppVersionInfo(
            version: version,
            downloadURL: downloadURL,
            status: status,
            secretKey: Data(base64Encoded: secretKey),
        )
    }
    
    /// 刷新
    @inline(__always)
    func refresh() async throws {
        try await make()
    }
    
    /// 初始化
    @inline(__always)
    func initialize() async throws -> AppVersionInfo {
        await TimerManager.shared.sync()
        return try await make()
    }
}
