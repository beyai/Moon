import Foundation
import CryptoKit
import Security
import SwiftCBOR

final class CryptoManager {
    
    static let shared = CryptoManager()

    // 加密随机密钥长度
    let nonceLen: Int = 12
    // 加密标签长度
    let tagLen: Int = 16
    // 有效时间窗口大小
    let timeWin: Int = 30
    // 设备私钥
    let devicePrivateKey: P256.KeyAgreement.PrivateKey
    // 设备公私
    let devicePublicKey: P256.KeyAgreement.PublicKey
    // 服务端公私
    var serverPublicKey: P256.KeyAgreement.PublicKey?
    
    init() {
        devicePrivateKey = P256.KeyAgreement.PrivateKey()
        devicePublicKey = devicePrivateKey.publicKey
    }
    
    /// 生成盐
    private func randomSalt(_ count: Int = 32) -> Data {
        var data = Data(count: count)
        _ = data.withUnsafeMutableBytes {
            SecRandomCopyBytes(kSecRandomDefault, count, $0.baseAddress!)
        }
        return data
    }
    
    /// 获取共享密钥
    private func getSharedKey(salt: Data) throws -> SymmetricKey {
        guard let serverPublicKey = serverPublicKey else {
            throw CreateError(code: 500, message: "服务端密钥错误")
        }
        let secret = try devicePrivateKey.sharedSecretFromKeyAgreement( with: serverPublicKey )
        let key = secret.hkdfDerivedSymmetricKey(using: SHA256.self, salt: salt, sharedInfo: Data(), outputByteCount: 32 )
        let sharedKey = key.withUnsafeBytes { Data($0) }
        return SymmetricKey(data: sharedKey)
    }
    
    /// 导出公钥
    func exportPublicKey() -> String {
        let rawPublicKey = devicePublicKey.x963Representation
        return rawPublicKey.base64EncodedString()
    }

    /// 设置服务端公钥
    func setServerPublicKey(serverPublicKey: String) throws {
        guard let serverPubkeyData = Data(base64Encoded: serverPublicKey) else {
            throw CreateError(code: 500, message: "服务端密钥错误")
        }
        do {
            let serverPublicKey = try P256.KeyAgreement.PublicKey( x963Representation: serverPubkeyData )
            self.serverPublicKey = serverPublicKey
        } catch {
            throw CreateError(code: 500, message: error.localizedDescription)
        }
    }
    
    /// 加密
    /// - 共享密钥 AES-256-GCM 加密数据
    func encrypt(body: [String: Any]) throws -> ( salt: Data, data: Data ) {
        
        // 共享密钥
        let salt = randomSalt()
        let sharedKey = try getSharedKey(salt: salt)
        
        // 注入当前时间戳（秒）
        var bodyDict = body
        bodyDict["timestamp"] = Int(Date().timeIntervalSince1970)
        let bodyData = CBOR.encodeData(bodyDict)
        
        // 加密数据
        do {
            let nonce = AES.GCM.Nonce()
            let sealedBox = try AES.GCM.seal(bodyData, using: sharedKey, nonce: nonce)
            let nonceData = nonce.withUnsafeBytes { Data($0) }
            let combined = nonceData + sealedBox.tag + sealedBox.ciphertext
            
            return (
                salt: salt,
                data: combined
            )
            
        } catch {
            throw CreateError(code: 500, message: error.localizedDescription)
        }
    }
    
    // 验证时间窗口
    private func verifyTimestamp(_ timestamp: Int) -> Bool {
        let now = Int(Date().timeIntervalSince1970)
        let half:Int = timeWin / 2;
        return now > timestamp - half && now <= timestamp + half
    }
    
    // 验证数据
    func verify(_ data: [String: Any] ) throws {
        guard let timestamp = data["timestamp"] as? Int,
              let deviceUID = data["deviceUID"] as? String
        else  {
            throw CreateError(code: 500, message: "数据格式不正确")
        }
        
        guard verifyTimestamp(timestamp) else {
            throw CreateError(code: 500, message: "数据已过期")
        }
        
        guard deviceUID == DeviceManager.shared.deviceUID else {
            throw CreateError(code: 500, message: "数据无效")
        }
    }
    
    
    /// 解密
    /// - 共享密钥 AES-256-GCM 解密数据
    func decrypt(data: Data, salt: Data) throws -> [String: Any] {
        let sharedKey = try getSharedKey(salt: salt)
        
        let nonce = data.prefix(nonceLen)
        let tag = data.dropFirst(nonceLen).prefix(tagLen)
        let ciphertextData = data.dropFirst(nonceLen + tagLen)
        
        do {
            let sealedBox = try AES.GCM.SealedBox(
                nonce: try AES.GCM.Nonce(data: nonce),
                ciphertext: ciphertextData,
                tag: tag
            )
            let decrypted = try AES.GCM.open(sealedBox, using: sharedKey)
            
            guard let dict = CBOR.decodeData(decrypted) as? [String: Any] else {
                throw CreateError(code: 400, message: "数据格式不正确")
            }
            return dict
        } catch {
            throw CreateError(code: 400, message: error.localizedDescription)
        }
    }
    
}
