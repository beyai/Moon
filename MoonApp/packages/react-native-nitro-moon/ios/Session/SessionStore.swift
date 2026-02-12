import Foundation
import CryptoKit
import Security

final class SessionStore {
    
    static let shared = SessionStore()
   
    /// 日志
    private lazy var logger: MLogger = {
        MLogger("DeviceSession")
    }()
    
    /// 通用查询属性
    private func keychainQuery(_ keyTag: String) -> [CFString: Any] {
        return [
            kSecClass               : kSecClassKey,
            kSecAttrApplicationTag  : keyTag.data(using: .utf8)!,
            kSecAttrKeyType         : kSecAttrKeyTypeECSECPrimeRandom
        ]
    }
  
    /// 创建
    func create(_ keyTag: String) throws -> P256.KeyAgreement.PrivateKey {
        self.remove(keyTag)
        
        let privateKey = P256.KeyAgreement.PrivateKey()
        var attributes = keychainQuery(keyTag)
        
        attributes[kSecValueData]           = privateKey.x963Representation
        attributes[kSecAttrKeySizeInBits]   = 256
        attributes[kSecAttrAccessible]      = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        attributes[kSecAttrSynchronizable]  = false
        
        let status = SecItemAdd(attributes as CFDictionary, nil)
        guard status == errSecSuccess else {
            logger.error("设备身份验证密钥存储失败：\( status )")
            throw CreateError(message: "设备密钥保存失败")
        }
        
        return privateKey
    }
    
    /// 读取
    func read(_ keyTag: String) throws -> P256.KeyAgreement.PrivateKey {
        
        var query = keychainQuery(keyTag)
        query[kSecReturnData]  = kCFBooleanTrue!
        query[kSecMatchLimit]  = kSecMatchLimitOne
    
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess, let keyData = result as? Data else {
            throw CreateError(message: "设备密钥加载失败")
        }
        
        let privateKey = try P256.KeyAgreement.PrivateKey(x963Representation: keyData)
        return privateKey
    }
    
    /// 移除
    func remove(_ keyTag: String) {
        let query = keychainQuery(keyTag)
        SecItemDelete(query as CFDictionary)
    }
    
}
