import Foundation
import SwiftyJSON

class SessionRequest {
    
    static let shared = SessionRequest()
    
    private init() {}

    /// 请求实例
    private let axios: Axios = {
        let instance = Axios(baseURL: SecurityConst.Request.BaseURL)
        
        instance.defaultHeaders = [
            "Content-Type"  : "application/json",
            "Accept"        : "application/json"
        ]
        
        return instance
    }()
    
    // MARK: - 内部请求
    
    /// 获取服务器时间
    @inline(__always)
    func getServerTime() async throws -> Int64 {
        let req = axios.post( SecurityConst.Request.SyncTime )
        
        let response = try await req.execute()
        
        guard let timestamp = response.data.int64 else {
            throw CreateError(message: "同步服务器时间失败")
        }
        
        return timestamp
    }
    
    /// 获取挑战因子
    @inline(__always)
    func getChallenge() async throws -> String {
        let req = axios.post( SecurityConst.Request.Challenge )
        let response = try await req.execute()
        
        guard let challenge = response.data.string else {
            throw CreateError(message: "请求失败")
        }
        
        return challenge
    }
    
    /// 登记设备+协商密钥
    @inline(__always)
    func checkIn(_ sessionBody: SessionBody) async throws -> SessionBody {
        let req = axios.post( SecurityConst.Request.CheckIn )
        try req.setBody(sessionBody )
        
        let response = try await req.execute()
        
        guard let sessionBody = SessionBody.fromJSON(response.data) else {
            throw CreateError(message: "请求失败，SessionBody 创建失败")
        }
        
        return sessionBody
    }
    
    /// 协商密钥
    @inline(__always)
    func negotiate(_ sessionBody: SessionBody) async throws -> SessionBody {
        let req = axios.post( SecurityConst.Request.Negotiate )
        try req.setBody(sessionBody)
        
        let response = try await req.execute()
        
        guard let sessionBody = SessionBody.fromJSON(response.data) else {
            throw CreateError(message: "请求失败，SessionBody 创建失败")
        }
        return sessionBody
    }
}
