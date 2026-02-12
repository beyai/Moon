import Foundation
import TrustKit

final class Axios: NSObject, URLSessionDelegate {
    
    private let baseURL: String
    private var session: URLSession!
    var defaultHeaders: [String: String] = [:]
    
    func urlSession(_ session: URLSession,
                    didReceive challenge: URLAuthenticationChallenge,
                    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
        let pinningValidator = TrustKit.sharedInstance().pinningValidator
        if !pinningValidator.handle(challenge, completionHandler: completionHandler) {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
    
    // MARK: - 初始化
    init(baseURL: String) {
        self.baseURL = baseURL
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        super.init()
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
    private var body: [String: Any] = [:]
    
    static let logger = RTCLogger("AxiosRequest")
    
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
    

    // 设置Header
    func setHeaders(_ headers: [String: String]) {
        self.headers.merge(headers) { $1 }
    }
    
    // 设置Body
    func setBody(_ body: [String: Any]) {
        self.body = body
    }
    
    // 设置Body
    func setBody<T: Codable>(_ body: T) {
        if let dict = try? JSONEncoder().encode(body),
           let jsonObject = try? JSONSerialization.jsonObject(with: dict),
           let dictionary = jsonObject as? [String: Any] {
            self.body = dictionary
        } else {
            self.body = [:]  // 编码失败时清空
        }
    }
    
    // async/await 执行请求
    func execute() throws -> (Data, URLResponse) {
        guard let url = buildURL() else {
            throw NSError(domain: "Invalid URL", code: 400)
        }
        
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
                request.httpBody = try JSONSerialization.data(withJSONObject: body)
            }
            else if finalHeaders["Content-Type"] == "application/x-www-form-urlencoded" {
                let query = body.map { key, value in
                    let k = key.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? key
                    let v = "\(value)".addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? "\(value)"
                    return "\(k)=\(v)"
                }.joined(separator: "&")
                request.httpBody = query.data(using: .utf8)
            }
        }
        
        var resultData: Data?
        var resultResponse: URLResponse?
        var resultError: Error?
        let semaphore = DispatchSemaphore(value: 0)
        
        let task = session.dataTask(with: request) { data, response, error in
            resultData = data
            resultResponse = response
            resultError = error
            semaphore.signal()
        }

        task.resume()
        semaphore.wait() // 阻塞当前线程，等待请求完成
        
        if let error = resultError {
            if let urlError = error as? URLError {
                switch urlError.code {
                    case .notConnectedToInternet:
                        throw CreateError(code: 400, message: "没有网络连接")
                    case .timedOut:
                        throw CreateError(code: 400, message: "服务器请求超时")
                    case .cannotFindHost:
                        throw CreateError(code: 400, message: "无法连接到服务器")
                    case .networkConnectionLost:
                        throw CreateError(code: 400, message: "网络连接丢失")
                    default:
                        throw CreateError(code: 400, message: "网络连接失败，请稍后再试")
                }
            } else {
                throw CreateError(code: 400, message: "网络连接失败，请稍后再试")
            }
        }

        guard let data = resultData, let response = resultResponse else {
            throw CreateError(code: 400, message: "服务器连接失败，请稍后再试")
        }

        AxiosRequest.logger.debug("\(method) \(url)")
        return (data, response)
    }
}
