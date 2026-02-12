import Foundation
import CryptoKit
import Security
import SwiftCBOR

final class SessionContext {
    
    static var shared = SessionContext()
    private init() {}
    /// 日志
    private lazy var logger: MLogger = { MLogger("SessionContext") }()
    /// 私钥
    private(set) var key: P256.KeyAgreement.PrivateKey?
    // 密钥
    private(set) var secretKey: SharedSecret?
    /// 访问锁
    private let sessionLock =  UnfairLock()
    
    /// 导入本地长期密钥
    func importPK(_ privateKey: P256.KeyAgreement.PrivateKey) {
        sessionLock.execute {
            self.key = privateKey
        }
    }
    
    /// 导入服务端密钥
    func importSK(_ publicKey: P256.KeyAgreement.PublicKey) throws {
        return try sessionLock.execute {
            guard let key = self.key else {
                throw CreateError(message: "本地密钥不存在")
            }
            self.secretKey = try key.sharedSecretFromKeyAgreement(with: publicKey)
        }
    }
    
    /// 导出公钥
    func exportKey() throws -> Data {
        return try sessionLock.execute {
            guard let key = self.key else {
                throw CreateError(message: "本地密钥不存在")
            }
            return key.publicKey.x963Representation
        }
    }
    
    /// 生成本地临时密钥
    func generateEK() {
        sessionLock.execute {
            self.key = P256.KeyAgreement.PrivateKey()
        }
    }
    
    /// 生成随机盐
    private func randomNonce() -> Data {
        return AES.GCM.Nonce().withUnsafeBytes { Data($0) }
    }
    
    /// 生成共享密钥
    private func getSharedKey(salt: Data) throws -> SymmetricKey {
        guard let secretKey = secretKey else {
            logger.error("获取设备身份验证共享密钥：服务端公钥不存在")
            throw CreateError(code: 500, message: SecurityConst.PersistentError.ServerKeyLost )
        }
        
        let key     = secretKey.hkdfDerivedSymmetricKey(
            using           : SHA256.self,
            salt            : salt,
            sharedInfo      : Data(),
            outputByteCount : 32
        )
        
        return key
    }
    
    /// 编码数据
    func encode(_ body: [String: Any?]) throws -> SessionBody {
        do {
            var bodyData = body
            // 注入时间戳
            bodyData["timestamp"] = TimerManager.shared.now()
            
            let cborData    = CBOR.encodeData(bodyData)
            let nonce       = randomNonce()
            let sharedKey   = try getSharedKey(salt: nonce)
            let nonceData   = try AES.GCM.Nonce(data: nonce)
            let sealedBox   = try AES.GCM.seal(cborData, using: sharedKey, nonce: nonceData)
            
            return SessionBody(
                deviceUID   : SessionService.shared.deviceUID,
                tag         : sealedBox.tag,
                nonce       : nonce,
                body        : sealedBox.ciphertext
            )
        } catch {
            logger.error(error.localizedDescription)
            throw CreateError(message: "数据编码失败" )
        }
    }
    
    /// 解码数据
    func decode(_ sessionBody: SessionBody) throws -> Any? {
        do {
            let sharedKey   = try getSharedKey(salt: sessionBody.nonce)
            let nonce       = try AES.GCM.Nonce(data: sessionBody.nonce)
            let sealedBox   = try AES.GCM.SealedBox(nonce: nonce, ciphertext: sessionBody.body, tag: sessionBody.tag)
            let decrypted   = try AES.GCM.open(sealedBox, using: sharedKey)
            let result      = CBOR.decodeData(decrypted)
            return result
        } catch {
            logger.error(error.localizedDescription)
            throw CreateError(message: "数据解码失败" )
        }
    }
    
}
