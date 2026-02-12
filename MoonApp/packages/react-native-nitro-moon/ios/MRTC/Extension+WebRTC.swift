import Foundation
import WebRTC
import NitroModules
import SwiftCBOR

extension RTCIceServer {
    var mrtcValue: MRTCIceServer {
        return MRTCIceServer(
            urls: self.urlStrings,
            username: self.username,
            credential: self.credential
        )
    }
}


extension RTCIceCandidate {
    var mrtcValue: MRTCIceCandidate {
        return MRTCIceCandidate(
            type: .candidate,
            candidate: sdp,
            sdpMid: sdpMid ?? "",
            sdpMLineIndex: Double(sdpMLineIndex),
        )
    }
}

extension RTCSdpType {
    var mrtcValue: MRTCSdpType {
        switch self {
            case .answer: return .answer
            case .offer: return .offer
            default: return .answer
        }
    }
}

extension RTCSessionDescription {
    var mrtcValue: MRTCSessionDescription {
        return MRTCSessionDescription(
            type: type.mrtcValue,
            sdp: sdp
        )
    }
}


extension RTCPeerConnectionState {
    var mrtcValue: MRTCPeerState {
        switch self {
        case .new: return .new
        case .connecting: return .connecting
        case .connected: return .connected
        case .disconnected: return .disconnected
        case .failed: return .failed
        default: return .closed
        }
    }
}

extension RTCDataChannelState {
    var mrtcValue: MRTCDataChannelState {
        switch self {
        case .connecting: return .connecting
        case .open: return .open
        case .closing: return .closing
        default: return .closed
        }
    }
}


extension RTCDataBuffer {
    

    func toDict() -> [String: Any]? {
        let buffer = self.data as Data
        guard let sourceData = CBOR.decodeData(buffer),
              let dict = sourceData as? [String: Any]
        else { return nil }
        return dict
    }
    
    static func fromDict(dict: [String: Any]) -> RTCDataBuffer {
        let buf = CBOR.encodeData(dict)
        return RTCDataBuffer(data: buf, isBinary: true)
    }
    
}
