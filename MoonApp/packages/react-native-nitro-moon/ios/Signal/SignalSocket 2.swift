//import Foundation
//import Starscream
//import SwiftyJSON
//import SwiftCBOR
//import NitroModules
/////
///// Starscream 原始连接断开
///// - API 服务器异常断开：peerClosed -> 等待1分钟后 -> error( POSIXError 54 ) -> cancelled
///// - API 服务没有启动：peerClosed
///// - API 反向代理: error（HTTPUpgradeError, WSError) -> 等待1分钟后 -> peerClosed
/////
/////
/////
/////
//
//protocol SignalSocketDelegate : AnyObject {
//    func didStatus(status: SignalStatusType, message: String? )
//    func didMessage()
//}
//
//
//final class SignalSocket : WebSocketDelegate {
//    
//    weak var delegate: SignalSocketDelegate?
//    
//    /// 日志
//    private lazy var logger: MLogger = { MLogger("SignalSocket") }()
//    /// 请求地址
//    private let baseURL = URL(string: SecurityConst.Signal.BaseURL)
//    /// 会话
//    private var session: SessionService { SessionService.shared }
//    /// 会话上下文
//    private var ctx: SessionContext { SessionContext.shared }
//    
//    /// 连接
//    private var socket: WebSocket?
//    /// 是否连接
//    private var isConnected = false
//    /// 是否连接中
//    private var isConnecting = false
//    /// 是否需要重新连接
//    private var isNeedReconnect = false
//    
//    /// 重试时间间隔
//    private let retryWait: TimeInterval = 3.0
//    /// 最大重试次数
//    private let maxRetry = 10
//    /// 重试次数
//    private var retryCount = 0
//    /// 重试计时器
//    private var retryTimer: Timer?
//    
//    /// 连接异步处理
//    private var promise: Promise<SignalStatusType>?
//    
//    /// 创建连接
//    private func initSocket() throws -> WebSocket {
//        guard let url = baseURL else {
//            throw CreateError(message: "Signal URL undefined.")
//        }
//        
//        var request = URLRequest(url: url)
//        request.timeoutInterval = 15
//        request.setValue( NitroMoonBridge.getBundleName(), forHTTPHeaderField: "User-Agent" )
//        request.setValue( session.deviceUID, forHTTPHeaderField: "Sec-Websocket-Protocol" )
//        
//        let socket = WebSocket(request: request, certPinner: self)
//        socket.delegate = self
//        return socket
//    }
//    
//    /// 事件监听
//    func didReceive( event: WebSocketEvent, client: WebSocketClient ) {
//        
//        logger.debug("websocket is \( event )")
//        
//        switch event {
//            
//        case .connected(_):
//            webSocketDidOpen()
//            
//        case .binary(let data):
//            webSocketDidReceiveBinaryMessage(data)
//            
//        case .disconnected(let reason, let code):
//            webSocketDidDisconnected(code: Int(code), reason: reason)
//            
//        case .error(let error):
//            webSocketDidError(error)
//            // socket?.forceDisconnect()
//        
//        case .peerClosed:
//            webSocketDidClose()
//            // socket?.forceDisconnect()
//        
//        case .cancelled:
//            webSocketDidReconnect()
//            
//        default:
//            break
//        }
//    }
//    
//    /// 更新状态
//    func changeStatus(status: SignalStatusType, message: String? = nil) {
//        delegate?.didStatus(status: status, message: message)
//    }
//    
//    /// 连接成功
//    private func webSocketDidOpen() {
//        isConnected     = true
//        isNeedReconnect = false
//        isConnecting    = false
//        retryCount      = 0
//        
//        self.changeStatus(status: .open, message: "连接成功")
//        
//        promise?.resolve(withResult: .open)
//        promise = nil
//    }
//    
//    /// 断开连接
//    private func webSocketDidDisconnected(code: Int, reason: String) {
//        if code == 1006 {
//            isNeedReconnect = true
//        } else {
//            isNeedReconnect = false
//        }
//        changeStatus(status: .close, message: reason.isEmpty ? "连接已断开" : reason)
//    }
//    
//    /// 接收消息
//    private func webSocketDidReceiveBinaryMessage(_ data: Data) {
//        if socket == nil { return }
//        // CBOR 解码数据
//        
//        // 解密数据内容
//    }
//    
//    /// 连接关闭
//    private func webSocketDidClose() {
//        
//        // 已连接、连接中，需要重新连接
//        if isConnected || isConnecting {
//            isConnected     = false
//            isNeedReconnect = true
//        }
//        
//        // 不再需要重新连接
//        if !isNeedReconnect {
//            promise?.reject(withError: RuntimeError.error(withMessage: "无法连接到服务器"))
//            promise = nil
//        }
//    }
//    
//    /// 连接错误
//    private func webSocketDidError(_ error: Error?) {
//        // 重新连接失败不处理错误
//        guard !isNeedReconnect else { return }
//        
//        // 升级请求错误
//        if let error = error as? HTTPUpgradeError {
//            switch(error) {
//            case .invalidData:
//                break
//            
//            case .notAnUpgrade(let statusCode, _):
//                logger.debug("连接失败 statusCode = \( statusCode )")
//                
//                // 网关错误
//                if statusCode == 502 {
//                    isNeedReconnect = true
//                    changeStatus(status: .failed, message: "连接失败, 即将尝试重新连接" )
//                    return
//                }
//                
//                // 证书错误
//                if statusCode == 402 {
//                    changeStatus(status: .unauthorized, message: "授权失败" )
//                }
//                
//                isNeedReconnect = false
//                isConnecting    = false
//            }
//        }
//        // WebSocket 错误
//         else if let error = error as? WSError {
//            /// 1002 = 协议错误
//            logger.error("Websocket 连接错误: code = \( error.code ) message = \( error.message )")
//        }
//        
//    }
//    
//    /// 处理自动重连
//    private func webSocketDidReconnect() {
//        logger.debug("当前数据状态：isNeedReconnect = \( isNeedReconnect ) isConnecting = \( isConnecting ) isConnected = \( isConnected )")
//        
//        // 卸载 websocket 实例
//        socket?.delegate = nil
//        socket = nil
//        
//        // 取消计时器
//        self.retryTimer?.invalidate()
//        self.retryTimer = nil
//        
//        guard isNeedReconnect else { return }
//        
//        // 检测是否需要重连
//        if retryCount > maxRetry {
//            isConnecting = false
//            isNeedReconnect = false
//            
//            let errMsg = "连接失败"
//            promise?.reject(withError: RuntimeError.error(withMessage: errMsg))
//            promise = nil
//            
//            changeStatus(status: .failed, message: errMsg)
//            return
//        }
//        
//        // 延迟重连
//        let retryTimer = Timer.scheduledTimer(withTimeInterval: retryWait, repeats: false, block: { [weak self] _ in
//            guard let self = self else { return }
//            self.retryTimer?.invalidate()
//            self.retryTimer = nil
//            
//            self.retryCount += 1
//            // 首次重连
//            if !self.isConnecting {
//                self.isConnecting = true
//                self.changeStatus(status: .reconnecting, message: "重新连接中...")
//            }
//            
//            do {
//                try self.connect()
//            } catch {
//                logger.error("\( error.localizedDescription )")
//            }
//        })
//        
//        self.retryTimer = retryTimer
//    }
//    
//    /// 连接
//    private func connect() throws {
//        if socket != nil {
//            throw RuntimeError.error(withMessage: "不可重复连接")
//        }
//
//        self.socket = try initSocket();
//        self.socket?.connect()
//        
//        // 首次连接
//        if !isConnecting {
//            changeStatus( status: .connecting, message: "连接中..." )
//            isConnecting = true
//        }
//    }
//    
//    deinit {
//        self.close()
//    }
//
//}
//
//
//
//extension SignalSocket {
//    /// 打开连接
////    func open() -> Promise<SignalStatusType>  {
////
////        if isConnected {
////            return Promise.resolved(withResult: .open)
////        }
////
////        if let promise = self.promise {
////            return promise
////        }
////
////        let promise = Promise<SignalStatusType>()
////        self.promise = promise
////
////        do {
////            try connect()
////        } catch {
////            self.promise = nil;
////            promise.reject(withError: error)
////        }
////
////        return promise
////    }
//    
//    /// 打开连接
//    func open() throws  {
//        if isConnected {
//            throw CreateError(message: "Weboskcet 已连接")
//        }
//        try connect()
//    }
//    
//    
//    
//    /// 发送数据
//    func send() {
//    }
//    
//    
//    /// 关闭
//    func close() {
//        logger.warn("关闭")
//        delegate        = nil
//        isConnected     = false
//        isConnecting    = false
//        isNeedReconnect = false
//        
//        if let socket = self.socket {
//            socket.delegate = nil
//            // socket.forceDisconnect()
//        }
//        socket          = nil
//        
//        retryTimer?.cancel()
//        retryTimer      = nil
//        retryCount      = 0
//
//    }
//}
