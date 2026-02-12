import Foundation
import React
import SwiftyJSON
import WebRTC

@objc(RTCModule)
class RTCModule: RCTEventEmitter  {
    
    // MARK: - 事件
    
    // 是否有监听器
    private var hasListeners = false
    
    // 是否需要在主线程中初始化
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    // 当监听器添加时调用
    override func startObserving() {
        hasListeners = true
    }
    
    // 当监听器移除时调用
    override func stopObserving() {
        hasListeners = false
    }
    
    // 支持的事件列表
    override func supportedEvents() -> [String]! {
        return ["onRtcSignalMessage", "onRtcActionMessage", "onRtcStatusMessage"]
    }
    
    // 发送事件
    override func sendEvent(withName name: String, body: Any?) {
        if hasListeners {
            super.sendEvent(withName: name, body: body)
        }
    }
    
    // 发送 RTC 信令消息事件
    func sendRtcSignalEvent(_ message: [String: Any]) {
        sendEvent(withName: "onRtcSignalMessage", body: message)
    }
    
    // 发送 RTC 动作控制事件
    func sendRtcActionEvent(_ message: [String: Any]) {
        sendEvent(withName: "onRtcActionMessage", body: message)
    }
    
    // 发送 RTC 状态事件
    func sendRtcStatusEvent(_ message: [String: Any]) {
        sendEvent(withName: "onRtcStatusMessage", body: message)
    }
    
    // MARK: - 属性
    
    // WebRTC 直播流配置
    static var RTC_LIVE_STREEAM: RtcLiveStream = RtcLiveStream(
        framerate: 15,
        bitrate: 800_000
    )
    
    // WebRTC STUN/TURN 服务器
    static var RTC_ICE_SERVERS: [RTCIceServer] = [
        RTCIceServer(urlStrings: ["stun:stun2.l.google.com:19302"])
    ]
    
    // MARK: 初始化
    override init() {
        super.init()
    }
    
    
    // MARK: 方法
    
    // 当前连接实例
    private var peer: RTCPeer?
    
    // 设置直播流
    @objc
    func setLiveStream(_ liveStream: [String: Int32] ) {
        guard let framerate = liveStream["framerate"],
              let bitrate = liveStream["bitrate"]
        else { return }
        
        RTCModule.RTC_LIVE_STREEAM = RtcLiveStream(
            framerate: framerate,
            bitrate: bitrate
        )
    }
    
    // 设置 STUN/TURN 服务器
    @objc
    func setIceServers(_ iceServers: [[String: Any]] ) {
        var servers: [RTCIceServer] = []
        
        for server in iceServers {
            guard let iceServer = RTCIceServer(server) else {
                continue
            }
            servers.append(iceServer)
        }
        
        if !servers.isEmpty {
            RTCModule.RTC_ICE_SERVERS = servers
        }
        
    }
    
    
    // MARK: RTC Peer
    
    // 创建连接
    @objc
    func createPeerConnection() {
        if let peer = peer {
            peer.close()
            self.peer = nil
        }
        
        self.peer = RTCPeer(self)
    }
    
    // 关闭连接
    @objc
    func closePeerConnection() {
        if let peer = peer {
            peer.close()
            self.peer = nil
        }
    }
    
    // 添加远程会话协议
    @objc
    func addRemoteDescription(_ desc: [String: Any]) {
        guard let peer = peer,
              let desc = RTCSessionDescription(desc)
        else { return }
        peer.addRemoteDescription(desc)
    }
    
    // 添加 Ice 候选者
    @objc
    func addIceCandidate(_ candidate: [String: Any]) {
        guard let peer = peer,
              let iceCandidate = RTCIceCandidate(candidate)
        else { return }
        peer.addIceCandidate(iceCandidate)
    }
    
    // 发送消息
    @objc
    func sendActionMessage(_ message: [String: Any]) {
        guard let peer = peer,
              let data = try? JSON(message).rawData()
        else { return }
        peer.sendActionData(data)
    }
}
