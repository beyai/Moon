
import Foundation
import TrustKit

protocol SignalSocketDelegate : AnyObject {
    func didStatus(state: SignalState)
    func didMessage()
}

final class SignalSocket: NSObject {
    
    /// 代理声明
    weak var delegate: SignalSocketDelegate?
    
    /// 日志
    private lazy var logger: MLogger = { MLogger("SignalSocket") }()
    
    /// 当前状态
    private(set) var state: SignalState = .disconnected
    
    /// 最大重试次数
    private let maxRetry = 5
    
    /// 重试统计
    private var retryCount = 0
    
    /// 重试计时器
    private var retryTimter: Timer?
    
    /// 手动关闭
    private var manualClose = false
    
    /// 请求地址
    private let baseURL = URL(string: SecurityConst.Signal.BaseURL)
    
    /// WebSocket 任务
    private var websocketTask: URLSessionWebSocketTask?
    
    /// WebSocket 请求会话
    private lazy var websocketSession: URLSession = {
        return URLSession(
            configuration: .default,
            delegate: self,
            delegateQueue: nil
        )
    }()
    
    /// 创建请求
    private func createRequest() throws -> URLRequest {
        guard let url = baseURL else {
            throw CreateError(message: "Signal URL undefined.")
        }
        
        var request = URLRequest(url: url)
        
        request.timeoutInterval = 15
        request.networkServiceType = .callSignaling
        
        request.setValue( NitroMoonBridge.getBundleName(), forHTTPHeaderField: "User-Agent" )
        request.setValue( SessionService.shared.deviceUID, forHTTPHeaderField: "Sec-Websocket-Protocol" )
        
        return request
    }
    
    /// 接收内容
    private func receive() async {
        logger.debug("连接状态4 \( websocketTask?.state.rawValue  )")
        guard let task = websocketTask else { return }
        do {
            let message = try await task.receive()
            /// 二进制消息
            if case .data(let data) = message {
                self.didReceiveBinaryMessage(data: data)
            }
            // 继续接收
            await receive()
        } catch {
            logger.error(error.localizedDescription)
        }
    }
    
    
    /// 连接
    func connect() throws {
        let request = try createRequest()
        
        websocketTask = websocketSession.webSocketTask(with: request)
        
        websocketTask?.resume()
        Task { await receive() }
    }
    
    /// 发送二进制数据
    func send(data: Data) {
    }
    
    /// 关闭
    func close() {
        websocketTask?.cancel(with: .normalClosure, reason: nil)
        websocketTask = nil
    }
    
    /// 接收二进制消息
    func didReceiveBinaryMessage(data: Data) {
        logger.debug("\( data )")
    }
    
    func didDisconnect(error: Error?) {
    }
    
}


extension SignalSocket: URLSessionWebSocketDelegate {
    
    /// SSL 证书验证
    func urlSession( _ session: URLSession, didReceive challenge: URLAuthenticationChallenge, completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void ) {
        logger.info("验证连接")
        let pinningValidator = TrustKit.sharedInstance().pinningValidator
        if !pinningValidator.handle(challenge, completionHandler: completionHandler) {
            completionHandler(.cancelAuthenticationChallenge, nil)
        }
    }
    
    /// 连接成功
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        logger.info("connected")
    }
    
    /// 连接关闭
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        var message = ""
        if let reason = reason {
            message = String(data: reason, encoding: .utf8) ?? ""
        }
        let code = closeCode.rawValue
        logger.info("disconnected: \( code ) \( message )")
    }
    
    /// 连接错误
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        let nsError = error as NSError?
        logger.info("error \( nsError )")
    }

}
