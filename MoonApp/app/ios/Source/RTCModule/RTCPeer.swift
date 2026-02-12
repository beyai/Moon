import Foundation
import SwiftyJSON
import WebRTC


class RTCPeer: NSObject {
    
    // MARK: - 属性
    
    // 全局队列
    static let queue = DispatchQueue(label: "RTCModuleQueue")
    
    private var delegate: RTCModule?
    
    // 当前连接
    private var peerConnection: RTCPeerConnection?
    
    // 控制动作消息通道
    private var actionChannel: RTCDataChannel?
    
    // 视频发送器
    private var videoSender: RTCRtpSender?
    
    // 上一帧时间
    private var lastFrameTime: TimeInterval = 0
    
    // 帧最小持续时长
    private var minFrameDuration: TimeInterval {
        let liveStream = RTCModule.RTC_LIVE_STREEAM
        return 1.0 / Double(liveStream.framerate)
    }
    
    // 连接特征
    private let factory: RTCPeerConnectionFactory = {
        let fieldTrials: [String: String] = [
            kRTCFieldTrialUseNWPathMonitor: kRTCFieldTrialEnabledValue
        ]
        RTCInitFieldTrialDictionary(fieldTrials)
        RTCInitializeSSL()
        let encoderFactory = RTCDefaultVideoEncoderFactory()
        
        return RTCPeerConnectionFactory(encoderFactory: encoderFactory, decoderFactory: nil)
    }()
    
    // 媒体约束
    private let mediaConstraints: RTCMediaConstraints = {
        return RTCMediaConstraints(
            mandatoryConstraints: [
                "IceGatheringPolicy": "complete",
                "VoiceActivityDetection": "false",         // 关闭语音检测（无音频）
                "googCpuOveruseDetection": "false",        // 禁用 CPU 过载自动降质量
                "googCpuOveruseEncodeUsage": "false",      // 禁用 CPU 过载自动降质量
                "googSuspendBelowMinBitrate": "false"
            ],
            optionalConstraints: nil
        )
    }()
    
    // 连接配置
    private var configuration: RTCConfiguration {
        let conf = RTCConfiguration()
        conf.iceCandidatePoolSize = 5
        conf.bundlePolicy = .maxBundle
        conf.rtcpMuxPolicy = .require
        conf.iceTransportPolicy = .all
        conf.enableDscp = true
        conf.sdpSemantics = .unifiedPlan
        conf.continualGatheringPolicy = .gatherOnce
        
        conf.iceServers = RTCModule.RTC_ICE_SERVERS
        
        return conf
    }
    
    // 编码参数
    private var encoding: RTCRtpEncodingParameters {
        let liveStream = RTCModule.RTC_LIVE_STREEAM
        
        let encodec = RTCRtpEncodingParameters()
        encodec.minBitrateBps = NSNumber(value: Double(liveStream.bitrate) * 0.15 )
        encodec.maxBitrateBps = NSNumber(value: liveStream.bitrate)
        encodec.maxFramerate  = NSNumber(value: liveStream.framerate)
        encodec.scaleResolutionDownBy = NSNumber(value: 1.0)
        encodec.isActive = true
        encodec.rid = "f"
        
        return encodec
    }
    
    // 传输器
    private var transceiver: RTCRtpTransceiverInit {
        let transceiver = RTCRtpTransceiverInit()
        transceiver.direction = .sendOnly
        transceiver.streamIds = [ UUID().uuidString ]
        transceiver.sendEncodings = [ encoding ]
        return transceiver
    }
    
    // 视频源
    private lazy var videoSource: RTCVideoSource = {
        let videoSource = factory.videoSource()
        videoSource.adaptOutputFormat(toWidth: 1080, height: 720, fps: 30)
        return videoSource
    }()
    
    // 视源捕获
    private lazy var videoCapture: RTCCameraVideoCapturer = {
        return RTCCameraVideoCapturer(delegate: videoSource)
    }()
    
    // MARK: - 初始化
    
    init(_ delegate: RTCModule) {
        super.init()
        self.delegate = delegate
        setup()
    }
    
    
    // MARK: - 私有方法
    
    // 初始化 RTC 连接
    private func setup() {
        RTCPeer.queue.async { [weak self] in
            guard let self = self else { return }
            self.peerConnection = self.createPeerConnection()
            self.videoSender = self.createVideoTrack()
            self.actionChannel = self.createDataChannel(label: RtcChannelLabel.action.rawValue )
            
            self.sendRtcIceServerConfig()
            self.createOffer()
            
            // 添加到相机采集代理
            CameraManager.shared.addDelegate(self)
        }
    }
    
    // 发送 RTC STUN/TURN 服务器配置
    private func sendRtcIceServerConfig() {
        let iceServersConfig: [String: Any] = [
            "type": "config",
            "iceServers": RTCModule.RTC_ICE_SERVERS.map { $0.toDict() }
        ]
        self.delegate?.sendRtcSignalEvent(iceServersConfig)
    }
    
    // 创建连接
    private func createPeerConnection() -> RTCPeerConnection? {
        guard let peerConnection = factory.peerConnection(with: configuration, constraints: mediaConstraints, delegate: self ) else {
            return nil
        }
        return peerConnection
    }
    
    // 创建视频轨道
    private func createVideoTrack() -> RTCRtpSender? {
        guard let peerConnection = peerConnection else { return nil }
        let videoTrack = factory.videoTrack(with: videoSource, trackId: UUID().uuidString)
        guard let trans = peerConnection.addTransceiver(with: videoTrack, init: transceiver ) else {
            return nil
        }
        
        let sender = trans.sender
        let params = sender.parameters
        params.encodings = [encoding]
        sender.parameters = params
        return sender
        
    }
    
    // 创建数据通道
    private func createDataChannel(label: String) -> RTCDataChannel? {
        guard let peerConnection = peerConnection else { return nil }
        let conf = RTCDataChannelConfiguration()
        conf.isOrdered = true
        conf.maxPacketLifeTime = -1
        guard let channel = peerConnection.dataChannel(forLabel: label, configuration: conf) else {
            return nil
        }
        channel.delegate = self;
        return channel
    }
    
    // 创建 Offer
    private func createOffer() {
        guard let peerConnection = peerConnection else { return }
        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                kRTCMediaConstraintsOfferToReceiveAudio: kRTCMediaConstraintsValueFalse,
                kRTCMediaConstraintsOfferToReceiveVideo: kRTCMediaConstraintsValueFalse
            ],
            optionalConstraints: nil
        )
        
        peerConnection.offer(for: constraints) { [weak self] (offer, error) in
            guard let self = self, let description = offer else {
                if let err = error {
                    print(err.localizedDescription)
                }
                return
            }
            setLocalDescription(description)
        }
    }
    
    // 创建 Answer
    private func createAnswer() {
        guard let peerConnection = peerConnection else { return }
        
        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                kRTCMediaConstraintsOfferToReceiveAudio: kRTCMediaConstraintsValueFalse,
                kRTCMediaConstraintsOfferToReceiveVideo: kRTCMediaConstraintsValueFalse
            ],
            optionalConstraints: nil
        )
        peerConnection.answer(for: constraints) { [weak self] (offer, error) in
            guard let self = self, let description = offer else {
                if let err = error {
                    print(err.localizedDescription)
                }
                return
            }
            setLocalDescription(description)
        }
    }
    
    // 设置本地会话协议
    private func setLocalDescription(_ description: RTCSessionDescription) {
        guard let peerConnection = peerConnection else { return }
        
        peerConnection.setLocalDescription( description ) { [weak self] (error) in
            guard let self = self else { return }
            if let err = error {
                print(err.localizedDescription)
            } else {
                self.delegate?.sendRtcSignalEvent( description.toDict() )
            }
        }
    }
    
    // MARK: - 共公方法
    
    // 添加远程会话协议
    func addRemoteDescription(_ description: RTCSessionDescription) {
        guard let peerConnection = peerConnection else { return }
        peerConnection.setRemoteDescription(description) { [weak self] (error) in
            guard let self = self else { return }
            if let err = error {
                print(err.localizedDescription)
            } else if description.type == .offer {
                self.createAnswer()
            }
        }
    }
    
    // 添加 ICE 候选者
    func addIceCandidate(_ iceCandidate: RTCIceCandidate) {
        guard let peerConnection = peerConnection else { return }
        peerConnection.add(iceCandidate) { (error) in
            if let err = error {
                print(err.localizedDescription)
            }
        }
    }
    
    // 发送控制动作消息
    func sendActionData(_ data: Data) {
        guard let actionChannel = actionChannel else { return }
        let dataBuffer = RTCDataBuffer(data: data, isBinary: true)
        actionChannel.sendData(dataBuffer)
    }
    
    // 关闭
    func close() {
        
        RTCPeer.queue.async { [weak self] in
            guard let self = self, let peerConnection = self.peerConnection else { return }
            
            // 从相机采集代理移除
            CameraManager.shared.removeDelegate(self)
            
            if let videoSender = self.videoSender {
                peerConnection.removeTrack(videoSender)
                self.videoSender = nil
            }
                
            if let actionChannel = self.actionChannel {
                actionChannel.close()
                self.actionChannel = nil
            }
            
            peerConnection.close()
            self.peerConnection = nil
        }
    }
}


// MARK: - 接收相机画面
extension RTCPeer : CameraVideoFrameDelegate {
    
    func onVideoFrame(_ videoFrame: VideoFrame) {
        let currentTime = CACurrentMediaTime()
        if (currentTime - lastFrameTime) < minFrameDuration {
            return
        }
        
        lastFrameTime = currentTime
        
        let timeStampNs = Int64(CACurrentMediaTime() * Double(NSEC_PER_SEC))
        let buffer = RTCCVPixelBuffer(pixelBuffer: videoFrame.pixelBuffer)
        let rtcFrame = RTCVideoFrame(buffer: buffer, rotation: ._0, timeStampNs: timeStampNs )
        
        videoSource.capturer(videoCapture, didCapture: rtcFrame)
    }
    
}

// MARK: - 接收连接消息
extension RTCPeer : RTCPeerConnectionDelegate {
    
    // 连接状态
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCPeerConnectionState) {
        let state: String;
        switch newState {
            case .new: state = "new"
            case .connecting: state = "connecting"
            case .connected: state = "connected"
            case .disconnected: state = "disconnected"
            case .failed: state = "failed"
            case .closed: state = "closed"
            default: return
        }
        let message: [String: Any] = [ "type": "peer", "state": state ]
        self.delegate?.sendRtcStatusEvent(message)
    }
    
    // 监听 ICE 生成协商地址
    func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        delegate?.sendRtcSignalEvent(candidate.toDict())
    }
    
    func peerConnectionShouldNegotiate(_ peerConnection: RTCPeerConnection) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceGatheringState) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange stateChanged: RTCSignalingState) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didAdd stream: RTCMediaStream) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove stream: RTCMediaStream) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCIceConnectionState) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didRemove candidates: [RTCIceCandidate]) {}
    func peerConnection(_ peerConnection: RTCPeerConnection, didOpen dataChannel: RTCDataChannel) {}
}

// MARK: - 接收数据通道状态
extension RTCPeer : RTCDataChannelDelegate {
    
    // 连接状态
    func dataChannelDidChangeState(_ dataChannel: RTCDataChannel) {
        guard dataChannel.label == RtcChannelLabel.action.rawValue else { return }
        
        let state: String;
        switch dataChannel.readyState {
            case .open: state = "open"
            case .closed: state = "closed"
            default: return
        }
        
        let message: [String: Any] = [
            "type": "data-channel",
            "label": dataChannel.label,
            "state": state
        ]
        
        self.delegate?.sendRtcStatusEvent(message)
    }
    
    // 接收消息
    func dataChannel(_ dataChannel: RTCDataChannel, didReceiveMessageWith buffer: RTCDataBuffer) {
        guard dataChannel.label == RtcChannelLabel.action.rawValue else { return }
        guard let jsonData = try? JSON(data: buffer.data),
              let actionMessage = jsonData.rawValue as? [String: Any]
        else { return }
        
        self.delegate?.sendRtcActionEvent(actionMessage)
        
    }
    
    
}
