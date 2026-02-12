import Foundation
import ObfuscateMacro

enum FirstLaunchManager {
    
    // 定义一个固定的 Key
    private static let hasLaunchedKey = #ObfuscatedString("isFirstLaunch")
    
    /// 检查App是否是全新安装后的首次启动
    static func isFirstLaunch() -> Bool {
        let defaults = UserDefaults.standard
        if defaults.bool(forKey: hasLaunchedKey) {
            return false
        } else {
            defaults.set(true, forKey: hasLaunchedKey)
            defaults.synchronize()
            return true
        }
    }
    
    /// 调试用：重置状态
    static func reset() {
        UserDefaults.standard.removeObject(forKey: hasLaunchedKey)
    }
}
