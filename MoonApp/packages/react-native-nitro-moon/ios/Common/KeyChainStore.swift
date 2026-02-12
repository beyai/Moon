import Foundation
import Security

enum KeyChainStore {
    
    /// 构建基础查询字典
    @inline(__always)
    private static func keychainQuery(forKey key: String) -> [CFString: Any] {
        return [
            kSecClass: kSecClassGenericPassword,
            kSecAttrService: SecurityConst.StoreKey.ServiceName,
            kSecAttrAccount: key,
        ]
    }
    
    /// 获取二进制数据
    @inline(__always)
    static func getData(forKey key: String) -> Data? {
        var query = keychainQuery(forKey: key)
        query[kSecReturnData] = kCFBooleanTrue
        query[kSecMatchLimit] = kSecMatchLimitOne

        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else { return nil }
        
        return result as? Data
    }
    
    /// 保存二进制数据
    @discardableResult
    @inline(__always)
    static func saveData(_ data: Data, forkey key: String ) -> Bool {
        
        let query = keychainQuery(forKey: key)
        
        let attributesToUpdate: [String: Any] = [
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        
        // 更新
        let updateStatus = SecItemUpdate(query as CFDictionary, attributesToUpdate as CFDictionary)
        if updateStatus == errSecSuccess {
            return true
        }
        
        // 新增新数据
        if updateStatus == errSecItemNotFound {
            var newItemQuery = query
            newItemQuery[kSecValueData] = data
            newItemQuery[kSecAttrAccessible] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
            
            let addStatus = SecItemAdd(newItemQuery as CFDictionary, nil)
            return addStatus == errSecSuccess
        }
        
        return false
    }
    
    /// 是否存在
    @inline(__always)
    static func has(forKey key: String) -> Bool {
        let query = keychainQuery(forKey: key)
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    /// 获取值
    @inline(__always)
    static func get(forKey key: String) -> String? {
        guard let data = getData(forKey: key) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
    
    /// 保存
    @discardableResult
    @inline(__always)
    static func save(value: String, forKey key: String) -> Bool {
        if let data = value.data(using: .utf8) {
            return saveData(data, forkey: key)
        }
        return false
    }
    
    
    /// 删除值
    @discardableResult
    @inline(__always)
    static func delete(forKey key: String) -> Bool {
        let query = keychainQuery(forKey: key)
        let status = SecItemDelete(query as CFDictionary)
        return status == errSecSuccess || status == errSecItemNotFound
    }

    
}
