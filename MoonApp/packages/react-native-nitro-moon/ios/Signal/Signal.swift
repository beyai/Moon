import Foundation
import NitroModules

final class Signal : HybridSignalSpec {
    
    /// 连接
    private var socket: WebSocket?
    /// 日志
    private lazy var logger: MLogger = { MLogger("Signal") }()
    /// 请求地址
    private let baseURL = URL(string: SecurityConst.Signal.BaseURL)
    
    /// 全局会话上下文
    private var ctx: SessionContext {
        SessionContext.shared
    }
   
    /// 打开连接
    func open() throws -> Promise<Void> {
        return Promise.async { [weak self] in
            guard let weakself = self else {
                throw RuntimeError.error(withMessage: "Signal 实例已销毁")
            }
            guard let url = weakself.baseURL else {
                throw RuntimeError.error(withMessage: "Signal URL 地址不正确")
            }
            if weakself.socket != nil  {
                throw RuntimeError.error(withMessage: "不可重复连接")
            }
            let socket = WebSocket(url: url, headers: [
                "User-Agent": NitroMoonBridge.getBundleName(),
                "Sec-Websocket-Protocol": SessionService.shared.deviceUID
            ])
            
            socket.delegate = self;
            weakself.socket = socket
            
            try socket.connect()
        }
    }
    
    /// 关闭信令连接
    func close() {
        socket?.close()
        socket = nil
    }
    
    /// 发送信令请求
    func send(message: SignalRequest) throws -> Promise<Void> {
        return Promise.async { [weak self] in
            guard let weakself = self else {
                throw RuntimeError.error(withMessage: "Signal 实例已销毁")
            }
            // 编码消息体
            let sessionBody = try weakself.ctx.encode([
                "requestId": message.requestId,
                "body": message.body.toDictionary()
            ])
            
            try weakself.socket?.send(data: sessionBody.toCBORData())
        }
    }
    
    // MARK: 消息回调
    
    typealias StatusListener        = (_ state: SignalState) -> Void
    typealias ResponseListener      = (_ data: SignalResponse) -> Void
    typealias ErrorListener         = (_ error: String) -> Void
    typealias RemoveListener        = () -> Void
    
    private var statusListener      : StatusListener?
    private var responseListener    : ResponseListener?
    private var errorListener       : ErrorListener?
    
    /// 状态监听
    func onStatus(listener: @escaping StatusListener) -> RemoveListener {
        statusListener = listener
        return {[weak self] in
            self?.statusListener = nil
        }
    }
    
    /// 响应监听
    func onResponse(listener: @escaping ResponseListener) -> RemoveListener {
        responseListener = listener
        return {[weak self] in
            self?.responseListener = nil
        }
    }
    
    /// 错误监听
    func onError(listener: @escaping ErrorListener) -> RemoveListener {
        errorListener = listener
        return { [weak self] in
            self?.errorListener = nil
        }
    }
    
}


extension Signal: WebSocketDelegate {
    
    func didMessage(data: Data) {
        guard let sessionBody = SessionBody.fromCBOR(data) else {
            logger.error("接收到的数据无法转换成 SessionBody")
            return;
        }
        do {
            let decodedData = try ctx.decode(sessionBody)
            
            guard let dict = decodedData as? [String: Any],
                  let bodyDict = dict["body"] as? [String: Any]
            else {
                throw CreateError(message: "消息格式错误")
            }
            
            let requestId   = dict["requestId"] as? String
            let room        = dict["room"] as? String
            let body        = try AnyMap.fromDictionary(bodyDict)
            
            let response = SignalResponse(
                requestId: requestId,
                room: room,
                body: body
            )
            
            responseListener?(response)
        } catch {
            logger.error(error.localizedDescription)
        }
        
    }
    
    func didMessage(text: String) {
        
    }
    
    func didStatus(state: WebSocket.State) {
        logger.debug("state: \( state )")
        if state == .connecting {
            statusListener?(.connecting)
        }
    }
    
    func didOpen() {
        logger.info("open")
        statusListener?(.connected)
    }
    
    func didClose(code: Int, message: String) {
        logger.warn("close: \( code ) \( message )")
        statusListener?(.disconnected)
    }
    
    func didError(_ error: NSError) {
        logger.error("error: \( error )")
        errorListener?(error.localizedDescription)
    }
}
