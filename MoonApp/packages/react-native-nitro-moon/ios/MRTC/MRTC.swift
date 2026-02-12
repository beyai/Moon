import Foundation
import NitroModules
import WebRTC


final class MRTC : HybridMRTCSpec {
    
    // 直播流画面
    static var liveStream: MRTCLiveStream = MRTCLiveStream(
        width: 1280,
        height: 720,
        framerate: 15,
        bitrate: 800_00,
        scalabilityMode: nil,
        bitratePriority: nil,
        networkPriority: nil,
        preference: nil
    )
    
    // TURN 服务器
    static var iceServers: [ RTCIceServer ] = []
    
    // 设置直播流画面
    func setLiveStream(stream: MRTCLiveStream) {
        print(stream)
        MRTC.liveStream = stream
    }
    
    // 设置 TURN 服务器
    func setIceServers(servers: [ MRTCIceServer ]) {
        MRTC.iceServers = servers.map { $0.rtcValue }
    }
    
    // 创建 WebRTC 连接
    func createPeer() -> any HybridMRTCPeerSpec {
        return MRTCPeer()
    }
}
