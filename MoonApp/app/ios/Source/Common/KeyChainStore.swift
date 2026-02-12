import Foundation
import Security
import ObfuscateMacro

// 过期数据
struct ExpirableItem<T: Codable>: Codable {
    let value: T
    let expirationDate: Date
    
    var isExpired: Bool {
        return Date() > expirationDate
    }
    
    init(value: T, expiresIn seconds: Int32) {
        self.value = value
        self.expirationDate = Date().addingTimeInterval(TimeInterval(seconds))
    }
}



enum KeyChainStore {
    
    private static let service = #ObfuscatedString("deviceUID") // 如要 兼容react-native-device-info中获取设备码，必须是 deviceUID
    
    // 生成随机UUID
    static func randomUUID() -> String {
        if #available(iOS 6.0, *) {
            return UUID().uuidString
        } else {
            let uuidRef = CFUUIDCreate(kCFAllocatorDefault)
            let cfuuid = CFUUIDCreateString(kCFAllocatorDefault, uuidRef)
            let uuid = cfuuid! as String
            return uuid
        }
    }
    
    private static func keychainQuery(forKey key: String) -> [CFString: Any] {
        return [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: service,
            kSecAttrAccount: key,
        ]
    }
    
    /// 获取二进制数据
    private static func getData(forKey key: String) -> Data? {
        var query = keychainQuery(forKey: key)
        query[kSecReturnData] = kCFBooleanTrue
        query[kSecMatchLimit] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else { return nil }
        
        return result as? Data
    }
    
    /// 保存二进制数据
    private static func saveData(_ data: Data, forkey key: String ) -> Bool {
        
        let query = keychainQuery(forKey: key)
        let attributesToUpdate: [CFString: Any] = [kSecValueData: data]
        
        let updateStatus = SecItemUpdate(query as CFDictionary, attributesToUpdate as CFDictionary)
        if updateStatus == errSecSuccess {
            return true
        }
        
        if updateStatus == errSecItemNotFound {
            var newItemQuery = query
            newItemQuery[kSecValueData] = data
            newItemQuery[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            
            let addStatus = SecItemAdd(newItemQuery as CFDictionary, nil)
            return addStatus == errSecSuccess
        }
        
        return false
    }
    
    /// 获取值
    static func get(forKey key: String) -> String? {
        guard let data = getData(forKey: key) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
    
    /// 获取有过期时间数据
    static func getExp<T: Codable>(forKey key: String) -> T? {
        guard let data = getData(forKey: key) else {
            return nil
        }
        guard let item = try? JSONDecoder().decode(ExpirableItem<T>.self, from: data) else {
            return nil
        }
        if item.isExpired {
            _ = delete(forKey: key)
            return nil
        }
        return item.value
    }
    
    /// 保存
    static func save(value: String, forKey key: String) -> Bool {
        if let data = value.data(using: .utf8) {
            return saveData(data, forkey: key)
        }
        return false
    }
    
    /// 保存有过期时间数据
    static func saveExp<T: Codable>(value: T, forKey key: String, ttl seconds: Int32) -> Bool {
        let item = ExpirableItem( value: value, expiresIn: seconds )
        guard let data = try? JSONEncoder().encode(item) else {
            return false
        }
        return saveData(data, forkey: key)
    }
    
    
    /// 删除值
    static func delete(forKey key: String) -> Bool {
        let query = keychainQuery(forKey: key)
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    
}
