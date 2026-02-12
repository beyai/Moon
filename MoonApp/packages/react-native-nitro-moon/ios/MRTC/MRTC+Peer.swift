import Foundation
import NitroModules
import WebRTC

final class MRTCPeer: HybridMRTCPeerSpec {
    
    static let logger: MLogger = { MLogger("MRTCPeer") }()

    private let queue = DispatchQueue(label: "MRTCPeer.Queue")
    
    private let videoFrameQueue = DispatchQueue( label: "MRTCPeer.VideoFrame.Queue" )
    
    private let delegateHandler: MRTCPeerDeleateHandler = { MRTCPeerDeleateHandler() }()
    
    private var peer: RTCPeerConnection?
    
    private var dataChannel: RTCDataChannel?
    
    private var videoSender: RTCRtpSender?
    
    private var frameIndex: Int64 = 0
    
    private var lastSendVideoFrameTime: TimeInterval = 0
    
    private var peerConfigListener          : ((_ state: MRTCPeerConfig ) -> Void)?
    
    
    private lazy var frameDurationNs: Int64 = {
        Int64(1_000_000_000 / MRTC.liveStream.framerate)
    }()
    
    private lazy var minInterval: Double = {
        1 / MRTC.liveStream.framerate
    }()
    
    /// 视频源
    private lazy var videoSource: RTCVideoSource = {
        let videoSource = factory.videoSource()
        videoSource.adaptOutputFormat(
            toWidth : Int32( MRTC.liveStream.width ),
            height  : Int32( MRTC.liveStream.height ),
            fps     : Int32( MRTC.liveStream.framerate )
        )
        return videoSource
    }()
    
    /// 视频捕获器
    private lazy var videoCapturer: RTCCameraVideoCapturer = {
       return RTCCameraVideoCapturer(delegate: videoSource)
    }()
    
    /// 连接工厂
    private lazy var factory: RTCPeerConnectionFactory = {
        let fieldTrials: [String: String] = [
            kRTCFieldTrialUseNWPathMonitor: kRTCFieldTrialEnabledValue
        ]
        RTCInitFieldTrialDictionary(fieldTrials)
        RTCInitializeSSL()
        let encoderFactory = RTCDefaultVideoEncoderFactory()
        return RTCPeerConnectionFactory(encoderFactory: encoderFactory, decoderFactory: nil)
    }()
    
    /// 连接约束
    private lazy var constraints: RTCMediaConstraints = {
        return RTCMediaConstraints(
            mandatoryConstraints: [:],
            optionalConstraints: [
                "googImprovedWifiBwe"       : "true",
                "googCpuOveruseDetection"   : "false",
                "googSuspendBelowMinBitrate": "false",
            ]
        )
    }()
    
    /// 连接配置
    private lazy var configuration: RTCConfiguration = {
       let config = RTCConfiguration()
        config.bundlePolicy          = .maxBundle
        config.rtcpMuxPolicy         = .require
        config.sdpSemantics          = .unifiedPlan
        config.iceTransportPolicy    = .all
        config.enableDscp            = true
        config.iceServers            = MRTC.iceServers
        config.offerExtmapAllowMixed = true
        return config
    }()
    
    /// 创建发起连接会话描述
    private func createOffer() {
        guard let peer = peer else { return }
        
        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                kRTCMediaConstraintsOfferToReceiveAudio: kRTCMediaConstraintsValueFalse,
                kRTCMediaConstraintsOfferToReceiveVideo: kRTCMediaConstraintsValueFalse
            ],
            optionalConstraints: nil
        )
        
        peer.offer(for: constraints) { [weak self] (offer, error) in
            guard let self = self, let desc = offer else {
                if let error = error {
                    MRTCPeer.logger.error(error.localizedDescription)
                }
                return
            }
            setLocalDescription(desc)
        }
    }
    
    /// 创建连接回复会话描述
    private func createAnswer() {
        guard let peer = peer else { return }
        let constraints = RTCMediaConstraints(
            mandatoryConstraints: [
                kRTCMediaConstraintsOfferToReceiveAudio: kRTCMediaConstraintsValueFalse,
                kRTCMediaConstraintsOfferToReceiveVideo: kRTCMediaConstraintsValueFalse
            ],
            optionalConstraints: nil
        )
        
        peer.answer(for: constraints) { [weak self] (answer, error) in
            guard let self = self, let desc = answer else {
                if let error = error {
                    MRTCPeer.logger.error(error.localizedDescription)
                }
                return
            }
            setLocalDescription(desc)
        }
    }
    
    /// 设置本地会话描述
    private func setLocalDescription(_ desc: RTCSessionDescription) {
        guard let peer = peer else { return }
        peer.setLocalDescription(desc) { [weak self] (error) in
            guard let self = self else { return }
            if let error = error {
                MRTCPeer.logger.error(error.localizedDescription)
                return
            }
            self.delegateHandler.localDescriptionListener?(desc.mrtcValue)
        }
    }
    
    /// 创建数据消息通道
    private func createDataChannel(label: String) -> RTCDataChannel? {
        guard let peer = peer else { return nil }
        
        let configuration = RTCDataChannelConfiguration()
        configuration.isOrdered = true
        configuration.maxPacketLifeTime = -1
        
        guard let channdle = peer.dataChannel(forLabel: label, configuration: configuration) else {
            return nil
        }
        channdle.delegate = delegateHandler
        
        return channdle
    }
    
    /// 创建 RTP 发送器
    private func createSender(videoTrack: RTCVideoTrack) -> RTCRtpSender? {
        guard let peer = peer else { return nil }
        
        let initTransceiver = RTCRtpTransceiverInit()
        initTransceiver.direction       = .sendOnly
        initTransceiver.streamIds       = [ UUID().uuidString ]
        initTransceiver.sendEncodings   = []
        
        guard let transceiver = peer.addTransceiver(with: videoTrack, init: initTransceiver ) else {
            return nil
        }
        
        return transceiver.sender
    }
    
    /// 创建视频轨道
    private func createVideoTrack() -> RTCVideoTrack {
        return factory.videoTrack( with: videoSource, trackId: "video" )
    }
    
    /// 更新编码参数
    private func updateParameters(sender: RTCRtpSender) {
        let parameters      = sender.parameters
        let encoding        = RTCRtpEncodingParameters()
        
        encoding.maxBitrateBps          = NSNumber(value: MRTC.liveStream.bitrate)
        encoding.maxFramerate           = NSNumber(value: MRTC.liveStream.framerate)
        encoding.isActive               = true
        
        // 层级
        if let scalabilityMode = MRTC.liveStream.scalabilityMode {
            encoding.scalabilityMode    = scalabilityMode
        }
        
        // 码率优先级
        if let bitratePriority = MRTC.liveStream.bitratePriority {
            encoding.bitratePriority    = bitratePriority
        }
        
        // 网络优先级
        if let networkPriority = MRTC.liveStream.networkPriority {
            encoding.networkPriority    = networkPriority.rtcValue
        }
        
        // 画质退化策略
        if let preference = MRTC.liveStream.preference {
            parameters.degradationPreference    = NSNumber(value: preference.rtcValue.rawValue)
        }
        
        // 应用编码参数
        parameters.encodings    = [ encoding ]
        sender.parameters       = parameters
    }
    
    /// 创建连接
    func createPeerConnection() throws -> RTCPeerConnection {
        guard let peer = factory.peerConnection(
            with        : configuration,
            constraints : constraints,
            delegate    : delegateHandler
        ) else {
            throw CreateError(message: "MRTC Create Error")
        }
        
        return peer
    }
    
    /// 添加远端会话描述
    func addRemoteDescription(desc: MRTCSessionDescription) {
        guard let peer = peer else { return }
        let desc = desc.rtcValue
        peer.setRemoteDescription(desc) { [weak self] (error) in
            guard let self = self else { return }
            if let error = error {
                MRTCPeer.logger.error(error.localizedDescription)
                return
            }
            if desc.type == .offer {
                self.createAnswer()
            }
        }
    }
    
    /// 添加远端连接侯选
    func addIceCandidate(candidate: MRTCIceCandidate) {
        guard let peer = peer else { return }
        peer.add(candidate.rtcValue) { (error) in
            if let error = error {
                MRTCPeer.logger.error(error.localizedDescription)
            }
        }
    }
    
    /// 发送控制动作消息
    /// 本地前端的，相机控制动作、系统状态、配置信息 发送到对端
    func sendDataChannelMessage(message: MRTCDataChannelMessage) {
        queue.async { [weak self] in
            guard let self = self else { return }
            do {
                
                guard let channel = self.dataChannel else {
                    throw CreateError(message: "dataChannel is not create")
                }
                
                guard channel.readyState == .open else {
                    throw CreateError(message: "dataChannel is not open")
                }
                
                let dataBuffer = RTCDataBuffer.fromDict(
                    dict: message.toDict()
                )
                
                channel.sendData(dataBuffer)
            } catch {
                MRTCPeer.logger.error(error.localizedDescription)
            }
        }
    }
    
    
    // MARK: - 回调
    
    /// 事件移除
    typealias RemoveListener = () -> Void
    
    /// 监听配置
    func onPeerConfig(listener: @escaping (_ config: MRTCPeerConfig) -> Void) throws -> RemoveListener {
        delegateHandler.peerConfigListener = listener
        return { [weak self] in
            self?.delegateHandler.peerConfigListener = nil
        }
    }
    
    /// 监听 Peer 状态
    func onPeerStateChange(listener: @escaping (_ state: MRTCPeerState ) -> Void) throws -> RemoveListener {
        delegateHandler.peerStateListener = listener
        return { [weak self] in
            self?.delegateHandler.peerStateListener = nil
        }
    }
    
    /// 监听本地会话 offer/answer
    func onLocalDescription(listener: @escaping (_ state: MRTCSessionDescription ) -> Void) throws -> RemoveListener {
        delegateHandler.localDescriptionListener = listener
        return { [weak self] in
            self?.delegateHandler.localDescriptionListener = nil
        }
    }
    
    /// 监听本地连接候选者
    func onLocalCandidate(listener: @escaping (_ state: MRTCIceCandidate ) -> Void) throws -> RemoveListener {
        delegateHandler.localCandidateListener = listener
        return { [weak self] in
            self?.delegateHandler.localCandidateListener = nil
        }
    }
    
    /// 监听 DataChannel 状态
    func onDataChannelStateChange(listener: @escaping (_ message: MRTCDataChannelState ) -> Void) throws -> RemoveListener {
        delegateHandler.dataChannelStateListener = listener
        return { [weak self] in
            self?.delegateHandler.dataChannelStateListener = nil
        }
    }
    
    /// 监听 DataChannel 消息
    /// - 对端使用 dataChannel 发送来的消息，转发到前端
    func onDataChannelMessage(listener: @escaping (_ message: MRTCDataChannelMessage ) -> Void) throws -> RemoveListener {
        delegateHandler.dataChannelMessageListener = listener
        return { [weak self] in
            self?.delegateHandler.dataChannelMessageListener = nil
        }
    }
    
    
    // MARK: - 接收画面
    private func receiveVideoFrame() {
        VideoFrameHub.subscribe(self) { [weak self] videoFrame in
            guard let self = self else { return }
            
            let currentTime = CACurrentMediaTime()
            guard currentTime - self.lastSendVideoFrameTime >= self.minInterval else { return }
            self.lastSendVideoFrameTime += self.minInterval
            
            self.frameIndex += 1
            let timeStampNs = self.frameIndex * self.frameDurationNs
            let buffer      = RTCCVPixelBuffer( pixelBuffer: videoFrame.pixelBuffer)
            let rtcFrame    = RTCVideoFrame( buffer: buffer, rotation: ._0, timeStampNs: timeStampNs )

            self.videoSource.capturer(self.videoCapturer, didCapture: rtcFrame)
        }
    }
    
    /// 开始
    func start() -> Promise<Void> {
        
        let promise = Promise<Void>()
        
        queue.async { [weak self] in
            guard let self = self else { return }
            
            do {
                
                let config = MRTCPeerConfig(
                    type: .config,
                    iceServers: MRTC.iceServers.map { $0.mrtcValue }
                )
                self.delegateHandler.peerConfigListener?(config)
                
                let peer = try self.createPeerConnection()
                self.peer = peer
                
                let videoTrack = self.createVideoTrack()
                
                guard let videoSender = self.createSender(videoTrack: videoTrack) else {
                    throw CreateError(message: "Create Video Sender Error")
                }
                
                self.updateParameters(sender: videoSender)
                
                guard let actionChanndel = self.createDataChannel(label: "action") else {
                    throw CreateError(message: "Create DataChannel Error")
                }
                
                
                
                self.videoSender = videoSender
                
                self.dataChannel = actionChanndel
                
                self.createOffer()
                
                self.receiveVideoFrame()
                
                promise.resolve()
                
            } catch {
                self.peer           = nil
                self.videoSender    = nil
                self.dataChannel  = nil
                
                promise.reject(withError: error)
                MRTCPeer.logger.error(error.localizedDescription)
            }
        }
        
        return promise
    }
    
    /// 关闭
    func close() -> Promise<Void>  {
        let promise = Promise<Void>()
        
        queue.async {
            VideoFrameHub.unsubscribe(self)
            
            self.dataChannel?.delegate = nil
            self.dataChannel?.close()
            self.dataChannel = nil

            self.videoSender = nil
            
            self.peer?.delegate = nil
            self.peer?.close()
            self.peer = nil

            self.frameIndex = 0
            self.lastSendVideoFrameTime = 0
            
            promise.resolve()
        }
        return promise
    }
    
    /// 销毁
    func dispose() {
        
    }
    
    deinit {
    }
}

