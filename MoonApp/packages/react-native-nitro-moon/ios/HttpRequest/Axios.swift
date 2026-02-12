import Foundation
import TrustKit
import SwiftyJSON




final class Axios: NSObject, URLSessionDelegate {
    
    private let baseURL: String
    private var session: URLSession!
    var defaultHeaders: [String: String] = [:]
    
    func urlSession(
        _ session: URLSession,
        didReceive challenge: URLAuthenticationChallenge,
        completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void
    ) {
        let pinningValidator = TrustKit.sharedInstance().pinningValidator
        if !pinningValidator.handle(challenge, completionHandler: completionHandler) {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
    
    private func setupTrustKit() {
        let trustKitConfig: [String: Any] = [
            kTSKSwizzleNetworkDelegates: false,
            kTSKPinnedDomains: [
                SecurityConst.Trust.Domain: [
                    kTSKEnforcePinning: true,
                    kTSKIncludeSubdomains: true,
                    kTSKPublicKeyHashes: [
                        SecurityConst.Trust.MainPin, // 主 pin
                        SecurityConst.Trust.BackPin// 备用 pin
                    ]
                ]
            ]
        ]
        TrustKit.initSharedInstance(withConfiguration: trustKitConfig)
    }
    
    // MARK: - 初始化
    init(baseURL: String) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        super.init()
        setupTrustKit()
        self.session = URLSession(configuration: config, delegate: self, delegateQueue: nil)
    }
    
    // Get
    func get(_ path: String) -> AxiosRequest {
        return AxiosRequest(baseURL: baseURL, session: session, defaultHeaders: defaultHeaders, method: "GET", path: path)
    }
    
    // Post
    func post(_ path: String) -> AxiosRequest {
        return AxiosRequest(baseURL: baseURL, session: session, defaultHeaders: defaultHeaders, method: "POST", path: path)
    }
}


// MARK: - AxiosRequest: 链式调用
final class AxiosRequest {
    
    private let baseURL: String
    private let path: String?
    private let method: String
    private let session: URLSession
    private var defaultHeaders: [String: String]
    private var headers: [String: String] = [:]
    private var bodyData: Data?
    
    private var logger: MLogger = { MLogger("AxiosRequest") }()
    
    init(baseURL: String?, session: URLSession, defaultHeaders: [String: String], method: String, path: String) {
        self.baseURL = baseURL ?? ""
        self.session = session
        self.method = method
        self.path = path
        self.defaultHeaders = defaultHeaders
    }
    
    private func buildURL() -> URL? {
        return Utils.buildURL(baseURL: baseURL , path: path)
    }
    
    /// 解析响应结果
    private func parseResponse(_ rawData: Data, response: URLResponse? ) throws -> AxiosResponse {
        do {
            let result = try AxiosResponse.decode(rawData)
            if result.code != 0 {
                throw CreateError(code: result.code, message: result.message)
            }
            return result
        } catch let err as NSError {
            throw err
        } catch {
            if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
                let code = http.statusCode
                let message = HTTPURLResponse.localizedString(forStatusCode: http.statusCode)
                throw CreateError(code: code, message: message)
            } else {
                throw CreateError(code: 400, message: "请求失败，数据格式不正确")
            }
        }
    }
    

    // 设置Header
    @discardableResult
    func setHeaders(_ headers: [String: String]) -> AxiosRequest {
        self.headers.merge(headers) { $1 }
        return self
    }
    
    // 设置Body
    @discardableResult
    func setBody(_ body: SessionBody) throws -> AxiosRequest {
        self.bodyData = try JSONEncoder().encode(body)
        return self
    }
    
    
    // 执行请求
    func execute() async throws -> AxiosResponse {
        
        guard let url = buildURL() else {
            throw CreateError(code: 500, message: SecurityConst.AxiosError.InvalidURL )
        }
        
        logger.debug("\( url )")
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        let finalHeaders = defaultHeaders.merging(headers) { $1 }
        
        if method == "POST", finalHeaders["Content-Type"] == nil {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        
        finalHeaders.forEach {
            request.setValue($0.value, forHTTPHeaderField: $0.key)
        }
        
        if method == "POST" {
            if finalHeaders["Content-Type"] == "application/json" {
                request.httpBody = bodyData
            }
        }
        
        do {
            let ( data, response ) =  try await session.data(for: request)
            return try parseResponse(data, response: response)
        } catch let urlError as URLError {
            let message: String
            switch urlError.code {
                // 无法连接到网络
                case .notConnectedToInternet:
                message = SecurityConst.AxiosError.NoNetwork
                // 连接超时
                case .timedOut:
                message = SecurityConst.AxiosError.Timeout
                // 无法连接到服务器
                case .cannotFindHost:
                message = SecurityConst.AxiosError.CanNotConnection
                // 网络连接丢失
                case .networkConnectionLost:
                message = SecurityConst.AxiosError.ConnectionLost
                // 连接失败
                default:
                message = SecurityConst.AxiosError.ConnectionFail
            }
            throw CreateError(code: 400, message: message)
        } catch let resError as NSError {
            throw CreateError(code: resError.code, message: resError.localizedDescription )
        }
        catch {
            throw CreateError(code: 400, message: SecurityConst.AxiosError.ConnectionFail )
        }
    }
}
