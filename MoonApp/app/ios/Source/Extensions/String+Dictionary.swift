import Foundation
import SwiftyJSON
import SwiftCBOR

private enum JsonError: Error {
    case convertFailed(String)
    var errorDescription: String? {
        switch self {
        case .convertFailed(let errMsg):
            return errMsg
        }
    }
}


extension String {
    
    // JSON 字符串 → SwiftyJSON.JSON
    func toSwiftyJSON() throws -> JSON {
        guard let data = self.data(using: .utf8) else {
            throw JsonError.convertFailed("无法转换为 Data")
        }
        guard let json = try? JSON(data: data) else {
            throw JsonError.convertFailed("无法转换为 SwiftyJSON")
        }
        return json
    }
    
    // JSON 字符串解码到 Dictionary
    func decodeJSON() throws -> [String: Any] {
        let json = try toSwiftyJSON()
        guard let dict = json.dictionaryObject else {
            throw JsonError.convertFailed("JSON 不是字典")
        }
        return dict
    }
        
    
    // Base64 编码
    func encodeBase64() -> String {
        return Data(self.utf8).base64EncodedString()
    }
    
    // Base64 解码
    func decodeBase64() -> String? {
        guard let data = Data(base64Encoded: self) else {
            return nil
        }
        return String(data: data, encoding: .utf8)
    }
    
    // 转 Data
    func toData() -> Data? {
        return self.data(using: .utf8)
    }
}

extension Dictionary {
    
    // 转 JSON 字符串
    func encodeJSON(prettyPrinted: Bool = false) throws -> String {
        guard JSONSerialization.isValidJSONObject(self) else {
            throw JsonError.convertFailed("无法转换为 JSON")
        }
        let options: JSONSerialization.WritingOptions = prettyPrinted ? [.prettyPrinted] : []
        let data = try JSONSerialization.data(withJSONObject: self, options: options)
        guard let jsonString = String(data: data, encoding: .utf8) else {
            throw JsonError.convertFailed("JSON 编码失败")
        }
        return jsonString
    }
    
    // 转 SwiftyJSON
    func toSwiftyJSON() -> JSON {
        return JSON(self)
    }
    
  
}
