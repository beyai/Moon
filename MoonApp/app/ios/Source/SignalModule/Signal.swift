import Foundation
import Starscream
import SwiftyJSON
import SwiftCBOR
import TrustKit

enum SignalStatusType: Int {
    case connecting = 1
    case open = 2
    case reconnecting = 3
    case close = 4
    case unauthorized = 5
    case error = -1
}

class Signal {
    // 日志
    static let logger = RTCLogger("Signal")
    // 加解密管理
    private let cryptoManager = CryptoManager.shared
    // 设备管理
    private let deviceManager = DeviceManager.shared
    
    // 连接套接字
    private var socket: WebSocket?
    // 连接地址
    private var url: URL?
    // 自定义请求头
    private var headers: [String: String]
    // 重连最大次数
    private var retryMax = 10
    // 重连次数
    private var retryCount = 0
    // 重连延迟时长
    private var retryWait: TimeInterval = 3.0
    // 是否已连接
    private var isConnected = false
    // 是否登录
    private var isLogin = false
    // 是否重新连接中
    private var isReconnecting = false
    // 是否需要重新连接
    private var isNeedReconnect = true
    // 重试计时器
    private var retryTimer: DispatchWorkItem?
    
    // 消息回调
    var onMessage: ( ([String: Any]?) -> Void )?
    // 状态消息
    var onStatus: ( ([String: Any] ) -> Void )?
    // 错误回调
    var onError: (([String: Any]) -> Void )?

    // 初始化
    init(url: URL, headers: [String: String] = [:]) {
        self.url = url
        self.headers = headers
        Signal.logger.debug("初始化: \(url.absoluteString)")
    }

    // 创建连接
    private func createSocket() -> WebSocket? {
        guard let url = url else {
            return nil
        }
        
        var request = URLRequest(url: url)
        request.timeoutInterval = 15
        
        request.setValue(deviceManager.deviceUID, forHTTPHeaderField: "Sec-Websocket-Protocol")
        
        // 设置默认 User-Agent
        if let userAgent = Utils.bundleName {
            request.setValue(userAgent, forHTTPHeaderField: "User-Agent")
        }
        
        // 自定义 Headers
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }
        
        let socket = WebSocket(request: request, certPinner: self)
        socket.delegate = self
        return socket
    }
    
    // 连接
    func connect() {
        
        if socket != nil {
            triggerStatus(status: .error, message: "不可重复连接" )
            return
        }
        
        guard let socket = createSocket() else {
            triggerStatus(status: .error, message: "连接失败，url 不能为空" )
            return
        }
        
        self.socket = socket
        socket.connect()
        
        if !isReconnecting {
            triggerStatus( status: .connecting, message: "连接中..." )
        }
    }

    // 发送文本消息
    func send(_ message: [String: Any]) {
        guard let socket = socket else {
            Signal.logger.error("未连接到服务器")
            return
        }
        
        guard let body = try? cryptoManager.encrypt(body: message) else {
            Signal.logger.error("消息加密失败")
            return
        }
        
        let messageData: [String: Any] = [
            "salt": body.salt,
            "data": body.data
        ]
        
        socket.write( data: CBOR.encodeData(messageData) )
    }
    
    // 处理收到的消息
    private func handlerReceiveMessage(_ baseString: String) {
    }
    
    // 处理收到二进制消息
    private func handlerBinaryMessage(_ data: Data) {
        
        guard let message = CBOR.decodeData(data) as? [String: Any] else {
            Signal.logger.error("消息解析失败")
            return
        }
        
        guard let salt = message["salt"] as? Data, let payload = message["data"] as? Data else {
            Signal.logger.error("消息格式不正确")
            return
        }
        
        guard let message = try? cryptoManager.decrypt(data: payload, salt: salt) else {
            Signal.logger.error("消息解密失败")
            return
        }
        
        do {
            try cryptoManager.verify(message)
            self.onMessage?(message)
        } catch {
            Signal.logger.error(error.localizedDescription)
        }
    }
    

    // 关闭
    func close() {
        retryTimer?.cancel() // 取消重新连接
        isReconnecting = false
        isNeedReconnect = false
        isLogin = false
        retryCount = 0
        socket?.disconnect()
    }
    
    
    // 清理 socket
    func clearSocket() {
        socket?.delegate = nil
        isConnected = false
        isLogin     = false
        socket      = nil
    }
    
    // 消息处理
    private func handleMessage(_ text: String) {
        guard let data = text.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              json["from"] as? String == "client" else { return }

    }

    // 处理重连
    private func handleReconnect() {
        if isNeedReconnect == false {
            return
        }
        guard retryCount < retryMax else {
            isNeedReconnect     = false
            isReconnecting      = false
            isConnected         = false
            triggerStatus(status: .close,  message: "重新连接失败")
            return
        }
        
        retryTimer?.cancel()
        
        retryTimer = DispatchWorkItem { [weak self] in
            guard let self = self else { return }
            
            self.retryCount += 1
            if !self.isReconnecting {
                self.isReconnecting = true
                self.triggerStatus(status: .reconnecting, message: "重新连接中...")
            }
            self.connect()
        }
        
        DispatchQueue.global().asyncAfter(deadline: .now() + retryWait, execute: retryTimer!)
    }

    // 事件触发
    private func triggerStatus(status: SignalStatusType, message: String? = nil) {
        let payload: [String: Any] = ["status": status.rawValue, "message": message ?? ""]
        onStatus?(payload)
    }
    
    deinit {
        socket?.delegate = nil
        socket = nil
        onStatus = nil
        onMessage = nil
    }
    
}


/// 接收消息
extension Signal: WebSocketDelegate {
    
    func didReceive(event: WebSocketEvent, client: WebSocketClient) {
        switch event {
            // 文本消息
            case .text(let text):
                handlerReceiveMessage(text)
                break;
            
            // 二进制消息
            case .binary(let data):
                handlerBinaryMessage(data)
                break;
            
            // 连接成功
            case .connected(_):
                retryCount = 0
                isNeedReconnect = true
                isConnected     = true
                isReconnecting  = false
                isLogin         = false
            
                triggerStatus(status: .open, message: "连接成功" )
                break
            
            // 服务端主动断开连接
            case .disconnected(let reason, _):
                isNeedReconnect = false
                triggerStatus(status: .close, message: reason )
                break

            // 服务器能连接，但连接失败
            case .error(let error):
                if let error = error as? HTTPUpgradeError {
                    switch(error) {
                        case .notAnUpgrade(let statusCode, _):
                            Signal.logger.debug("连接失败 statusCode = \( statusCode )")
                            if statusCode == 502 {
                                isNeedReconnect = true
                                triggerStatus(status: .close, message: "连接失败, 即将尝试重新连接" )
                            }
                            if statusCode == 402 {
                                isNeedReconnect = false
                                triggerStatus(status: .unauthorized, message: "授权失败" )
                            }
                            else {
                                isNeedReconnect = false
                            }
                        case .invalidData: break
                    }
                }
            
            // 服务器无法访问或服务器断开连接
            case .peerClosed:
                
                clearSocket()
                if isNeedReconnect {
                    handleReconnect()
                } else {
                    triggerStatus(status: .close, message: "连接已关闭" )
                }
            
            default:
                break
        }
    }
}


extension Signal: CertificatePinning {
    
    func evaluateTrust(trust: SecTrust, domain: String?, completion: ((PinningState) -> ())) {
        guard let domain = domain else {
            completion(.success)
            return
        }
        
        let validator = TrustKit.sharedInstance().pinningValidator
        let trustDecision = validator.evaluateTrust(trust, forHostname: domain)
        
        switch trustDecision {
            case .domainNotPinned:
                completion(.success)
                
            case .shouldAllowConnection:
                completion(.success)
                
            case .shouldBlockConnection:
                let errMsg = "SSL Pinning failed for \(domain)"
                let error = CFErrorCreate(kCFAllocatorDefault, domain as CFString, -1, [kCFErrorLocalizedDescriptionKey as String: errMsg ] as CFDictionary)
                completion(.failed(error))
            
                triggerStatus(status: .error, message: "不安全的连接" )
            @unknown default:
                completion(.success)
        }
    }
}
