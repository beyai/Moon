import Foundation

enum Utils {
    
    /// 设备型号
    static let deviceModel: String = {
        var systemInfo = utsname()
        uname(&systemInfo)
        let machineMirror = Mirror(reflecting: systemInfo.machine)
        let identifier = machineMirror.children.reduce("") { identifier, element in
            guard let value = element.value as? Int8, value != 0 else { return identifier }
            return identifier + String(UnicodeScalar(UInt8(value)))
        }
        return identifier
    }()
    
    /// 生成URL地址
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
}


