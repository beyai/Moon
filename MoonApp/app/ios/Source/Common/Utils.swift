import Foundation
import WebRTC
import SwiftyJSON
import CryptoKit
import AVFoundation

enum Utils {
    
    // 发行版本号
    static let version: String? = {
        return Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
    }()
    
    // 构建版本号
    static let buildVersion: String? = {
        return Bundle.main.infoDictionary?["CFBundleVersion"] as? String
    }()
    
    // 构建名
    static let bundleName: String? = {
        return Bundle.main.infoDictionary?["CFBundleName"] as? String
    }()
    
    // 设备型号
    static let deviceModel: String? = {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }()
    
    // 生成随机UUID
    static func randomUUID() -> String {
        if #available(iOS 6.0, *) {
            return UUID().uuidString
        } else {
            let uuidRef = CFUUIDCreate(kCFAllocatorDefault)
            let cfuuid = CFUUIDCreateString(kCFAllocatorDefault, uuidRef)
            let uuid = cfuuid! as String
            return uuid
        }
    }
    
    // 生成随机密钥
    static func randomSecretKey() -> String {
        let keyData =  SymmetricKey(size: .bits256)
        let base64 = keyData.withUnsafeBytes { Data($0).base64EncodedString() }
        return base64
    }
    
    // 生成设备码
    static func generateDeviceCode(deviceUID: String) -> String {
        let md5Data = Insecure.MD5.hash(data: Data(deviceUID.utf8))
        let md5Hex = md5Data.map { String(format: "%02X", $0) }.joined()
        let subHex = md5Hex.dropFirst(5).prefix(7)
        let intValue = UInt64(subHex, radix: 16) ?? 0
        let deviceCode = String(format: "%010llu", intValue)
        return deviceCode
    }
    
    
    // 锁定相机配置
    static func withLockedConfiguration(_ device: AVCaptureDevice, _ actions: () throws -> Void) {
        do {
            try device.lockForConfiguration()
            try actions()
            device.unlockForConfiguration()
        } catch {
            print("Configuration lock failed: \(error)")
        }
    }

    // 获取相机设备
    static func getCaptureDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        switch position {
        case .front:
            return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                ?? AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
        case .back:
            return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
                ?? AVCaptureDevice.default(.builtInDualCamera, for: .video, position: .back)
        default:
            return nil
        }
    }
    
    // 生成URL地址
    static func buildURL(baseURL: String, path: String? = nil) -> URL? {
        guard let path = path, !path.isEmpty else {
            return URL(string: baseURL)
        }
        
        let pattern = #"^(https?|wss?)://.+"#
        if let _ = path.range(of: pattern, options: .regularExpression) {
            return URL(string: path)
        }
        
        guard var url = URL(string: baseURL) else {
            return nil
        }
        
        let trimmedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        
        url.appendPathComponent(trimmedPath)
        
        return url
    }
    
    // 转换 IceServers
    static func buildIceServers(iceServers: [JSON] ) -> [RTCIceServer] {
        var servers: [RTCIceServer] = []
        for server in iceServers {
            let urls = server["urls"].arrayValue
            if !urls.isEmpty {
                servers.append(
                    RTCIceServer(
                        urlStrings: server["urls"].arrayValue.map { $0.stringValue },
                        username: server["username"].string,
                        credential: server["credential"].string
                    )
                )
            }
        }
        return servers
    }
    
}


