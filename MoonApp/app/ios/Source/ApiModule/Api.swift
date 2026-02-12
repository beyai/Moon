import Foundation
import SwiftyJSON
import SwiftCBOR



enum ApiService {
    
    // 加解密管理
    private static let cryptoManager = CryptoManager.shared
    // 设备管理
    private static let deviceManager = DeviceManager.shared
    // 单例刷新任务
    private static var retryGroup: DispatchGroup?
    private static let retryLock = NSLock()
    
    // 请求实例
    private static let axios: Axios = {
        let instance = Axios(baseURL: Config.API_BASE_URL)
        instance.defaultHeaders = [
            "Content-Type"  : "application/json",
            "Accept"        : "application/json"
        ]
        return instance
    }()
    
    
    
    // 解析响应结果
    @discardableResult
    private static func parseResponse(_ rawData: Data, urlResponse: URLResponse?) throws -> JSON {
        
        // 尝试解析为 JSON
        guard let json = try? JSON(data: rawData) else {
            throw CreateError(code: 400 ,message: "请求失败，数据格式不正确")
        }
        
        // 检查 HTTP 状态码
        if let http = urlResponse as? HTTPURLResponse {
            if http.statusCode >= 400 {
                let code = json["code"].int ?? 400
                let message = json["message"].string ?? "请求失败"
                throw CreateError(code: code ,message: message)
            }
        }

        // 检查业务 code
        guard let code = json["code"].int else {
            throw CreateError(code: 400 ,message: "请求失败")
        }

        if code != 0 {
            let message = json["message"].string ??  "请求失败"
            throw CreateError(code: code ,message: message)
        }
        
        return json
    }
    
    // 重新协商密钥
    private static func retryNegotiatePubKey() throws {
        retryLock.lock()
        if let group = retryGroup {
            retryLock.unlock()
            group.wait()
            return
        }
        
        let group = DispatchGroup()
        retryGroup = group
        group.enter()
        retryLock.unlock()
        
        var refreshError: Error?
        let semaphore = DispatchSemaphore(value: 0)
        Task {
            do {
                try await deviceManager.negotiatePubKey()
            } catch {
                refreshError = error
            }
            semaphore.signal()   // 通知完成
        }
        
        semaphore.wait()
        
        retryLock.lock()
        group.leave()
        retryGroup = nil
        retryLock.unlock()
        
        if let error = refreshError {
            throw error
        }
    }
    
    // 解密 JSON.data 数据
    @discardableResult
    private static func decryptJsonData(_ data: JSON) throws -> JSON {
        var json = data;
        
        guard let salt = json["data"]["salt"].string, let saltData = Data(base64Encoded: salt) else {
            throw CreateError(code: 400, message: "数据格式不正确")
        }
        
        guard let base64 = json["data"]["data"].string, let base64Data = Data(base64Encoded: base64) else {
            throw CreateError(code: 400, message: "数据格式不正确")
        }
        
        // 解密数据
        let dict = try cryptoManager.decrypt(data: base64Data, salt: saltData)
        // 验证数据
        try cryptoManager.verify(dict)
        
        json["data"] = dict.toSwiftyJSON()
        
        return json
    }
    
    // 处理请求
    @discardableResult
    private static func handlerRequest(path: String, params: [String: Any] = [:], headers: [String: String]? = nil, retry: Bool = true ) throws -> JSON {
        do {
            let bodyData = try cryptoManager.encrypt(body: params)
            
            let body = [
                "deviceUID": deviceManager.deviceUID,
                "salt": bodyData.salt.base64EncodedString(),
                "data": bodyData.data.base64EncodedString()
            ]
            
            let req = axios.post(path)
            req.setBody(body)
            
            // 设置headers
            if let headers = headers { req.setHeaders(headers) }
            
            let ( data, response ) = try req.execute()
            let jsonData = try parseResponse(data, urlResponse: response)
            
            return try decryptJsonData(jsonData)
            
        } catch let error as NSError {
            // 密钥过期，重新协商
            if retry && error.code == 402 {
                try retryNegotiatePubKey()
                return try handlerRequest(path: path, params: params, headers: headers, retry: false)
            }
            throw error
        } catch {
            throw error
        }
    }
}


extension ApiService {
    
    // 获取App注册验证码
    static func challenge() throws -> String {
        let req = axios.post("/device/challenge")
        
        let ( data, response ) = try req.execute()
        let jsonData = try parseResponse(data, urlResponse: response)
        return jsonData["data"].stringValue
    }
    
    // 验证App
    static func checkin(_ params: [String: Any] ) throws {
        let req = axios.post("/device/checkin")
        req.setBody(params)
        
        let ( data, response ) = try req.execute()
        try parseResponse(data, urlResponse: response)
    }
    
    
    // 协商公钥
    static func negotiate(_ params: [String: Any] ) throws -> [String: Any] {
        let req = axios.post("/device/negotiate")
        req.setBody(params)
        
        let ( data, response ) = try req.execute()
        let jsonData = try parseResponse(data, urlResponse: response)
        guard let result = jsonData["data"].dictionaryObject else {
            throw CreateError(code: 400, message: "数据解析失败")
        }
        return result
    }
    
    // 注册设备
    static func registerDevice(_ params: [String: Any]) throws -> JSON  {
        return try handlerRequest(path: "/device/register", params: params)
    }

    // 验证版本号
    static func checkVersion(_ params: [String: Any] ) throws -> JSON {
        return try handlerRequest(path: "/device/version", params: params)
    }
    
    // 初始化设备配置
    static func initDevice() throws -> JSON {
        guard let deviceCode = deviceManager.deviceCode else {
            throw CreateError(code: 400, message: "无法获取设备码")
        }
        let params = [
            "deviceCode": deviceCode,
            "version": Utils.version ?? "0.0.0"
        ]
        return try handlerRequest(path: "/device/init", params: params)
    }
    
    // 绑定账号
    static func bindDevice(_ token: String) throws -> JSON {
        guard let deviceCode = DeviceManager.shared.deviceCode else {
            throw CreateError(code: 400, message: "无法获取设备码")
        }
        // 请求参数
        let params = [
            "deviceCode": deviceCode,
            "version": Utils.version ?? "0.0.0"
        ]
        // 用户登录 TOKEN
        let headers = [ "Authorization": token ]
        return try handlerRequest(path: "/device/bind", params: params, headers: headers)
    }

}




