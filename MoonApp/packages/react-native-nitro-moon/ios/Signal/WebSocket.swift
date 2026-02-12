
import Foundation
import TrustKit

protocol WebSocketDelegate: AnyObject {
    func didMessage(data: Data)
    func didMessage(text: String)
    
    func didStatus(state: WebSocket.State)
    func didOpen()
    func didError(_ error: NSError)
    func didClose(code: Int, message: String)
}

final class WebSocket: NSObject {
    
    enum State {
        case ready
        case connecting
        case connected
        case disconnected
    }
    
    /// 代理声明
    weak var delegate: WebSocketDelegate?
    /// 日志
    private lazy var logger: MLogger = { MLogger("WebSocket") }()
    /// 当前状态
    private(set) var state: WebSocket.State = .ready
    /// 请求
    private var request: URLRequest
    
    /// 重连延迟
    private let retryInterval: TimeInterval = 3
    /// 最大重试次数
    private let maxRetry = 10
    /// 重试次数
    private var retryCount = 0
    /// 重连计时器
    private var retryTimer: DispatchWorkItem?
    
    // 是否为正常关闭
    private var isNormalClose = false
    
    // 关闭防抖动
    private var closeDebounceWorkItem: DispatchWorkItem?
    // 防抖时间 100ms
    private let closeDebounceInterval: TimeInterval = 0.1
    
    /// WebSocket 连接会话
    private lazy var socketSession: URLSession = {
        URLSession(configuration: .default, delegate: self, delegateQueue: nil)
    }()
    
    /// WebSocket 任务
    private var socketTask: URLSessionWebSocketTask?
    
    /// 初始化
    init(url: URL, headers: [String: String] = [:] ) {
        request = URLRequest(url: url)
        request.timeoutInterval     = 15
        request.networkServiceType  = .callSignaling
        super.init()
        
        headers.forEach {
            self.request.setValue($0.value, forHTTPHeaderField: $0.key)
        }
    }
    
    /// 接收内容
    private func didReceive() {
        guard let task = socketTask else { return }
        
        task.receive { [weak self] (result) in
            guard let self = self else { return }
            
            switch result {
                /// 接收数据
                case .success(let message):
                    // 二进制消息
                    if case .data(let data) = message {
                        self.delegate?.didMessage(data: data)
                    }
                    // 文本消息
                    if case .string(let text) = message {
                        self.delegate?.didMessage(text: text)
                    }
                
                    self.didReceive()
                break
                
                /// 失败
                case .failure(let error as NSError):
                    handleError(error: error)
                break
            }
        }
    }
    
    
    /// 尝试重新连接
    private func scheduleReconnect() -> Bool {
        guard !isNormalClose, retryCount < maxRetry else {
            return false
        }
        
        retryCount += 1
        retryTimer?.cancel()
        logger.warn("等待重连")
        
        let retryItem = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            do {
                try self.connect()
            } catch {
                updateWebSocketState(.disconnected)
                self.delegate?.didError(CreateError(message: "重新连接失败"))
            }
        }
        
        retryTimer = retryItem
        DispatchQueue.main.asyncAfter(deadline: .now() + retryInterval, execute: retryItem)
        
        return true
    }
    
    /// 处理错误
    private func handleError(error: NSError? = nil) {
        guard state != .disconnected else { return }
        
        if state == .connected {
            handleDisconnected(closeCode: 1011, reason: "Server   disconnected.")
            return
        }
        
        if state == .connecting {
            updateWebSocketState(.disconnected)
            if self.scheduleReconnect() {
                return
            }
        }
        
        // 错误消息
        if let err = error {
            delegate?.didError(err)
        }
    }
    
    /// 处理连接断开
    private func handleDisconnected(closeCode: Int? = nil , reason: String? = nil) {
        guard state == .connected else { return }
        
        closeDebounceWorkItem?.cancel()
        let closeWorkItem = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            updateWebSocketState(.disconnected)
            
            let code    = closeCode ?? 1000
            let message = reason ?? "WebSocket closed"
            
            if code == 1000 || !self.scheduleReconnect() {
                self.delegate?.didClose(code: code, message: message)
            }
        }
        
        closeDebounceWorkItem = closeWorkItem
        DispatchQueue.main.asyncAfter(deadline: .now() + closeDebounceInterval, execute: closeWorkItem)
    }
    

    /// 更新状态
    private func updateWebSocketState(_ state: WebSocket.State ) {
        
        // 连接成功重置状态
        if state == .connected {
            retryCount      = 0
            isNormalClose   = false
        }
        
        self.state = state
        delegate?.didStatus(state: state)
    }
    
    /// 连接
    func connect() throws {
        guard state == .ready || state == .disconnected else {
            throw CreateError(message: "WebSocket not ready.")
        }
        
        updateWebSocketState(.connecting)
        socketTask = socketSession.webSocketTask(with: request)
        socketTask?.resume()
        didReceive()
    }
    
    /// 发送二进制数据
    func send(data: Data) throws {
        guard state == .connected else {
            throw CreateError(message: "WebSocket not connected.")
        }
        socketTask?.send(.data(data), completionHandler: { [weak self] (error) in
            if let err = error {
                self?.logger.error("发送失败")
                return
            }
            self?.logger.debug("发送成功")
        })
    }
    
    /// 关闭
    func close() {
        isNormalClose = true
        retryTimer?.cancel()
        updateWebSocketState(.disconnected)
        socketTask?.cancel(with: .normalClosure, reason: String("close").data(using: .utf8))
        socketTask  = nil
        delegate    = nil
    }
    
    deinit {
        self.close()
    }
   
}


extension WebSocket: URLSessionWebSocketDelegate {
    
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
    
    /// 连接成功
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol protocol: String?) {
        updateWebSocketState(.connected)
        delegate?.didOpen()
    }
    
    /// 连接关闭
    func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
        let message = reason.flatMap { String(data: $0, encoding: .utf8) }
        handleDisconnected(closeCode: closeCode.rawValue, reason: message )
    }

}
