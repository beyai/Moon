import TrustKit
import WebRTC
import SwiftyJSON
import ObfuscateMacro

enum Config {
    #if DEBUG
    static let isDev = true
    #else
    static let isDev = false
    #endif
    
    // WebRTC IceServers
    static var ICE_SERVERS: [RTCIceServer] = [ RTCIceServer(urlStrings: ["stun:stun2.l.google.com:19302"]) ]
    
    // API 请求地址
    static let API_BASE_URL: String = {
        if isDev {
            return "http://192.168.5.4:7001/api"
        } else {
            return #ObfuscatedString("https://api.fireeyecam.com/api")
        }
    }()
    
    // WS 请求地址
    static let SIGNAL_URL: String =  {
        if isDev {
            return "ws://192.168.5.4:3001/io"
        } else {
            return #ObfuscatedString("wss://api.fireeyecam.com/io")
        }
    }()
    
    // 全局安装 TrustKit SSL Pinning
    static func setupTrustKit() {
        let trustKitConfig: [String: Any] = [
            kTSKSwizzleNetworkDelegates: false,
            kTSKPinnedDomains: [
                #ObfuscatedString("api.fireeyecam.com"): [
                    kTSKEnforcePinning: true,
                    kTSKIncludeSubdomains: true,
                    kTSKPublicKeyHashes: [
                        #ObfuscatedString("1YtW3Sb/T5HqzVatBczhR6dCcXcZRzGgTAtTaxXWfOE="), // 主 pin
                        #ObfuscatedString("92oK29/qv5N8xocT/H9kxxVqihg3OD2rlooJW9f7L3Y=") // 备用 pin
                    ]
                ]
            ]
        ]
        TrustKit.initSharedInstance(withConfiguration: trustKitConfig)
    }
    
}
