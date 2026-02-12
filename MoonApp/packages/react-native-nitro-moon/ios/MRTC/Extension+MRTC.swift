import WebRTC

extension MRTCIceServer {
    var rtcValue: RTCIceServer {
        return RTCIceServer(
            urlStrings: self.urls,
            username: self.username,
            credential: self.credential
        )
    }
}


extension MRTCIceCandidate {
    var rtcValue: RTCIceCandidate {
        return RTCIceCandidate(
            sdp: self.candidate,
            sdpMLineIndex: Int32(sdpMLineIndex),
            sdpMid: sdpMid
        )
    }
}

extension MRTCSdpType {
    var rtcValue: RTCSdpType {
        switch self {
        case .answer:
            return .answer
        case .offer:
            return .offer
        }
    }
}

extension MRTCSessionDescription {
    var rtcValue: RTCSessionDescription {
        return RTCSessionDescription(
            type: self.type.rtcValue,
            sdp: self.sdp
        )
    }
}

extension MRTCNetworkPriority {
    var rtcValue: RTCPriority {
        switch self {
        case .high:
            return .high
        case .medium:
            return .medium
        case .low:
            return .low
        }
    }
}

extension MRTCPreference {
    var rtcValue: RTCDegradationPreference {
        switch self {
        case .balanced:
            return .balanced
        case .maintainframerate:
            return .maintainFramerate
        case .maintainresolution:
            return .maintainResolution
        case .disabled:
            return .disabled
        }
    }
}

extension MRTCDataChannelMessage {
    func toDict() -> [String: Any] {
        return [
            "action": action.stringValue,
            "data": data.toDictionary()
        ]
    }
}
