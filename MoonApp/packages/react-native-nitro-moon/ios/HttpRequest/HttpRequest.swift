import Foundation
import NitroModules
import SwiftyJSON

final class HttpRequest : HybridHttpRequestSpec {
    
    private static var reloadTask: Task<Void, Error>?
    
    private var logger: MLogger = { MLogger("HttpRequest") }()
    
    /// 请求实例
    private let axios: Axios = {
        let instance = Axios(baseURL: SecurityConst.Request.BaseURL)
        instance.defaultHeaders = [
            "Content-Type"  : "application/json",
            "Accept"        : "application/json"
        ]
        return instance
    }()
    
    /// 会话上下文
    private var ctx: SessionContext {
        SessionContext.shared
    }
    
    /// 重新加载临时会话
    private func refreshSession() async throws {
        
        if let task = HttpRequest.reloadTask {
            try await task.value
            return
        }

        let task = Task {
            try await SessionService.shared.refresh()
        }

        HttpRequest.reloadTask = task

        do {
            try await task.value
            HttpRequest.reloadTask = nil
        } catch {
            HttpRequest.reloadTask = nil
            self.logger.debug(error.localizedDescription)
            throw error
        }
    }
    
    /// 402 错误重新协商临时密钥
    private func withRetry( _ block: @escaping () async throws -> ResponseResult ) async throws -> ResponseResult {
        do {
            return try await block()
        } catch let err as NSError where err.code == 402 {
            try await refreshSession()
            return try await block()
        } catch {
            throw error
        }
    }
    
    /// 统一错误出口
    private func wrapError(_ err: Error) -> ResponseResult {
        let nsError = err as NSError
        let code = nsError.code == 0 ? 400 : nsError.code
        
        let errorBody = try? AnyMap.fromDictionary([
            "code": code,
            "message": nsError.localizedDescription
        ])
        
        return ResponseResult(body: nil, error: errorBody)
    }
    
    /// 执行请求
    private func performRequest(url: String, options: RequestOptions?) async throws -> ResponseResult {
        
        // 创建请求
        let request = axios.post(url)
        
        // 设置请求头
        if let headers = options?.header {
            request.setHeaders(headers)
        }
        
        // 构建请求内容
        let bodyData = options?.body?.toDictionary() ?? [:]
        let encodedBody  = try ctx.encode( bodyData )
        try request.setBody( encodedBody )
        
        // 发送请求
        let response = try await request.execute()
        
        // 解码数据
        guard let sessionBody = SessionBody.fromJSON(response.data) else {
            throw CreateError(message: "响应数据解析失败")
        }
        
        let decryptedData = try ctx.decode(sessionBody)
        
        // 创建响应结果
        let bodyMap = try AnyMap.fromDictionary([
            "code"      : response.code,
            "message"   : response.message,
            "data"      : decryptedData
        ])
        
        return ResponseResult(body: bodyMap, error: nil )
    }
    
    
    // 发送请求
    func send(url: String, options: RequestOptions?) -> Promise<ResponseResult> {
        return Promise.async { [self] in
            do {
                return try await self.withRetry {
                    try await self.performRequest(url: url, options: options)
                }
            } catch {
                self.logger.debug(error.localizedDescription)
                return self.wrapError(error)
            }
        }
    }
    
}
