import Foundation
import SwiftCBOR
import SwiftyJSON

struct SessionBody: Codable {
    // 设备唯一标识
    let deviceUID   : String
    // AES-GCM 验证标签
    let tag: Data
    // 共享密钥盐，AES-GCM随机值
    let nonce: Data
    // 密文数据
    let body: Data
    // 附加数据
    var payload: Data?
    
    /// 获取负载数据
    func getPayload() -> [String: Any]? {
        guard let payload = payload else { return nil }
        return CBOR.decodeData(payload) as? [String: Any]
    }
    
    /// 设置负载数据
    mutating func setPayload(_ payload: [String: Any]) {
        self.payload = CBOR.encodeData(payload)
    }
    
    /// 转换成字典数据
    func toDict() -> [String: Any] {
        var dict: [String: Any] = [:]
        dict["deviceUID"]   = deviceUID
        dict["tag"]         = tag
        dict["nonce"]       = nonce
        dict["body"]        = body
        
        if let payloadData = payload {
            dict["payload"] = payloadData
        }
        
        return dict
    }
    
    /// 转换成 JSON
    func toJSON() -> JSON {
        let dict = toDict()
        return JSON(dict)
    }
    
    /// 转换成 CBOR
    func toCBORData() -> Data {
        let dict = toDict()
        return CBOR.encodeData(dict)
    }
    
    /// 从 Dict 创建
    static func fromDict(_ dict: [String: Any]) -> SessionBody? {
        guard let deviceUID = dict["deviceUID"] as? String,
              let tagBase64 = dict["tag"] as? String,
              let tag = Data(base64Encoded: tagBase64),
              let nonceBase64 = dict["nonce"] as? String,
              let nonce = Data(base64Encoded: nonceBase64),
              let bodyBase64 = dict["body"] as? String,
              let body = Data(base64Encoded: bodyBase64)
        else {
            return nil
        }
        
        var sessionBody = SessionBody(
            deviceUID: deviceUID, tag: tag, nonce: nonce, body: body
        )
            
        if let payloadBase64 = dict["payload"] as? String,
           let payload = Data(base64Encoded: payloadBase64) {
            sessionBody.payload = payload
        }
        
        return sessionBody
        
    }
    
    /// 从 JSON 创建
    static func fromJSON(_ data: JSON) -> SessionBody? {
        guard let deviceUID = data["deviceUID"].string,
              let tagBase64 = data["tag"].string,
              let tag = Data(base64Encoded: tagBase64),
              let nonceBase64 = data["nonce"].string,
              let nonce = Data(base64Encoded: nonceBase64),
              let bodyBase64 = data["body"].string,
              let body = Data(base64Encoded: bodyBase64)
        else {
            return nil
        }
        
        var sessionBody = SessionBody(
            deviceUID: deviceUID, tag: tag, nonce: nonce, body: body
        )
        
        if let payloadBase64 = data["payload"].string, let payload = Data(base64Encoded: payloadBase64) {
            sessionBody.payload = payload
        }
        
        return sessionBody
    }
    
    /// 从 CBOR 创建
    static func fromCBOR(_ data: Data) -> SessionBody? {
        guard let body = CBOR.decodeData(data), let dict = body as? [String: Any] else {
            return nil
        }
        
        guard let deviceUID = dict["deviceUID"] as? String,
              let tag       = dict["tag"] as? Data,
              let nonce     = dict["nonce"] as? Data,
              let body      = dict["body"] as? Data
        else {
            return nil
        }
        
        var sessionBody = SessionBody(
            deviceUID: deviceUID, tag: tag, nonce: nonce, body: body
        )
            
        if let payload = dict["payload"] as? Data {
            sessionBody.payload = payload
        }
        
        return sessionBody
        
    }
    
}
