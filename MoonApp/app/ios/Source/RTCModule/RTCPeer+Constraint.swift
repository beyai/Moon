import WebRTC
import SwiftyJSON

enum RtcChannelLabel: String {
    // 录像
    case video
    // 动作
    case action
}

enum RtcMessageType: String {
    // 连接状态
    case peer_state
    // 信令
    case signal
    // 数据通道
    case channel_state
    // 消息
    case message
}

enum RtcState: String {
    // 创建
    case new
    // 连接中
    case connecting
    // 连接成功
    case connected
    // 断开连接
    case disconnected
    // 连接失败
    case failed
    // 已关闭
    case closed
    // 需要协商
    case negotiate
}

struct RtcLiveStream {
    // 最大帧率
    let framerate: Int32
    // 最大码率
    let bitrate: Int32
}

// RTC 状态消息
struct RtcStateMessage {
    let type: RtcMessageType
    let state: RtcState
    
    func toDict() -> [String: Any] {
        return [
            "type": type.rawValue,
            "state": state.rawValue
        ]
    }
}

// RTC 信令消息
struct RtcSignalMessage {
    let type: RtcMessageType
    let data: [String: Any]
    
    func toDict() -> [String: Any] {
        return [
            "type": type.rawValue,
            "data": data,
        ]
    }
}


// RTC 通道消息
struct RtcChannelMessage {
    
    let type: RtcMessageType
    let label: RtcChannelLabel
    let data: [String: Any]
    
    func toDict() -> [String: Any] {
        return [
            "type": type.rawValue,
            "label": label.rawValue,
            "data": data,
        ]
    }
}

// MARK: - RTC 扩展

extension RTCSessionDescription {
    func toDict() -> [String: Any] {
        return [
            "type": RTCSessionDescription.string(for: type),
            "sdp": sdp
        ]
    }
    
    convenience init?(_ desc: [String: Any ] ) {
        guard let sdp = desc["sdp"] as? String, let type = desc["type"] as? String
        else { return nil }
        
        let rtcType: RTCSdpType
        switch type {
            case "offer": rtcType = .offer
            case "answer": rtcType = .answer
            default: return nil
        }
        self.init(
            type: rtcType,
            sdp: sdp
        )
    }
   
}

extension RTCIceCandidate {
    
    func toDict() -> [String: Any] {
        return [
            "type": "candidate",
            "sdpMid": sdpMid ?? "0",
            "sdpMLineIndex": sdpMLineIndex,
            "candidate": sdp
        ]
    }
    
    convenience init?(_ iceCandidate: [String: Any ] ) {
        guard let type = iceCandidate["type"] as? String,
              let sdp = iceCandidate["candidate"] as? String,
              let sdpMLineIndex = iceCandidate["sdpMLineIndex"] as? Int32
        else {
            return nil
        }
        
        if type != "candidate" {
            return nil
        }
        
        self.init(
            sdp: sdp,
            sdpMLineIndex: sdpMLineIndex,
            sdpMid: iceCandidate["sdpMid"] as? String
        )
    }
}


extension RTCIceServer {
    
    func toDict() -> [String: Any] {
        var iceServer: [String: Any] = [:]
        iceServer["urls"] = self.urlStrings
        if let username = self.username {
            iceServer["username"] = username
        }
        if let credential = self.credential {
            iceServer["credential"] = credential
        }
        return iceServer
    }
    
    convenience init?(_ iceServer: [String: Any ] ) {
        guard let urls = iceServer["urls"] as? [String: String] else {
            return nil
        }
        
        var urlStrings:[String] = []
        
        for url in urls.values {
            urlStrings.append(url)
        }
        
        if urlStrings.isEmpty {
            return nil
        }
        
        self.init(
            urlStrings: urlStrings,
            username: iceServer["username"] as? String,
            credential: iceServer["credential"] as? String
        )
    }
    
    
}
