import Foundation
import WebRTC
import NitroModules



final class MRTCPeerDeleateHandler: NSObject {
    override init() {
        super.init()
    }
    /// 对端配置
    var peerConfigListener          : ((_ config: MRTCPeerConfig ) -> Void)?
    /// 监听本地会话
    var localDescriptionListener    : ((_ message: MRTCSessionDescription ) -> Void)?
    /// 监听连接状态
    var peerStateListener           : ((_ state: MRTCPeerState ) -> Void)?
    /// 监听本地候选
    var localCandidateListener      : ((_ message: MRTCIceCandidate ) -> Void)?
    /// 监听数据通道状态
    var dataChannelStateListener    : ((_ message: MRTCDataChannelState ) -> Void)?
    /// 监听数据通道消息    
    var dataChannelMessageListener  : ((_ message: MRTCDataChannelMessage ) -> Void)?
}


// MARK: - 接收连接消息
extension MRTCPeerDeleateHandler:  RTCPeerConnectionDelegate {
    
    // 连接状态
    func peerConnection(_ peerConnection: RTCPeerConnection, didChange newState: RTCPeerConnectionState) {
        guard let listener = peerStateListener else { return }
        listener(newState.mrtcValue)
    }
    
    // 监听 ICE 生成协商地址
    func peerConnection(_ peerConnection: RTCPeerConnection, didGenerate candidate: RTCIceCandidate) {
        guard let listener = localCandidateListener else { return }
        listener(candidate.mrtcValue)
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
extension MRTCPeerDeleateHandler : RTCDataChannelDelegate {
    
    // 连接状态
    func dataChannelDidChangeState(_ dataChannel: RTCDataChannel) {
        guard let listener = dataChannelStateListener else { return }
        listener(dataChannel.readyState.mrtcValue)
    }
    
    // 接收消息
    func dataChannel(_ dataChannel: RTCDataChannel, didReceiveMessageWith buffer: RTCDataBuffer) {
        guard let listener = dataChannelMessageListener else { return }
        do {
            guard let dict = buffer.toDict(),
                  let currentAction = dict["action"] as? String,
                  let currentData = dict["data"] as? [String: Any],
                  let action = MRTCActionTypes(fromString: currentAction),
                  let data = try? AnyMap.fromDictionary(currentData)
            else {
                throw CreateError(message: "Invalid format by ActionData")
            }
            
            let message = MRTCDataChannelMessage(
                action: action,
                data: data
            )
            listener(message)
        } catch {
            print(error.localizedDescription)
        }
        
    }
    
    
}
