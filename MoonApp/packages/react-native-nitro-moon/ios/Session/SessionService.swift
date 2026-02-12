import Foundation
import SwiftyJSON

enum RegisterState: UInt8 {
    case unregistered   = 0
    case registered     = 1
}


final class SessionService {
    
    static let shared = SessionService()
    
    var logger: MLogger = {  MLogger("SessionService") }()
    
    /// 设备码
    var deviceCode: String = ""
    
    /// 设备唯一标识
    var deviceUID: String = ""
    
    private init() {
        deviceUID = getDeviceUID()
    }

    /// 设备唯一标识
    private func getDeviceUID() -> String {
        if let deviceUID = KeyChainStore.get(forKey: SecurityConst.StoreKey.DeviceKey) {
            return deviceUID
        }
        
        let deviceUID = UUID().uuidString
        KeyChainStore.save(value: deviceUID, forKey: SecurityConst.StoreKey.DeviceKey)
        
        self.state = .unregistered
        return deviceUID
    }
    
    // 获取状态
    var state: RegisterState {
        get {
            guard let data = KeyChainStore.getData(forKey: SecurityConst.StoreKey.RegisterStatusKey ),
                  let raw = data.first,
                  let state = RegisterState(rawValue: raw)
            else {
                return .unregistered
            }
            return state
        }
        set {
            let data = Data([ newValue.rawValue ])
            let success = KeyChainStore.saveData(data, forkey: SecurityConst.StoreKey.RegisterStatusKey)
            if !success {
                logger.warn("注册状态写入 Keychain 失败")
            }
        }
    }
    
    // 重置
    func reset() {
        let deviceUID = UUID().uuidString
        KeyChainStore.save(value: deviceUID, forKey: SecurityConst.StoreKey.DeviceKey)
        self.deviceUID = deviceUID
        self.state = .unregistered
    }
    
}
