import Foundation
import React
import SwiftyJSON


@objc(SignalModule)
final class SignalModule: RCTEventEmitter {
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // 信令实例
    private var signal: Signal?
   
    
    private var hasListeners = false
    
    override func startObserving() {
        hasListeners = true
    }
    
    override func stopObserving() {
        hasListeners = false
    }
    
    // 支持的事件
    override func supportedEvents() -> [String]! {
        return [ "onSignalMessage", "onSignalStatus", "onSignalError" ]
    }
    
    // 发送事件
    override func sendEvent(withName name: String, body: Any?) {
        if hasListeners {
            DispatchQueue.main.async {
                super.sendEvent(withName: name, body: body)
            }
        }
    }

    // 连接
    @objc
    func connect() {
        // 关闭旧连接
        if let oldSignal = signal {
            oldSignal.close()
            signal = nil
        }
        
        let url = Utils.buildURL(baseURL: Config.SIGNAL_URL)
        let signal = Signal(url: url!)
        self.signal = signal
        
        // 监听状态
        signal.onStatus = { [weak self] status in
            guard let self = self else { return }
            self.sendEvent(withName: "onSignalStatus", body:status )
        }
        
        // 监听消息
        signal.onMessage = { [weak self] message in
            guard let self = self else { return }
            self.sendEvent(withName: "onSignalMessage", body: message )
        }
        
        signal.connect()
    }
    
    // 发送消息
    @objc
    func send(_ message: [String: Any]) {
        signal?.send(message)
    }

    // 关闭
    @objc
    func close() {
        signal?.close()
        signal = nil
    }
    
   
}
