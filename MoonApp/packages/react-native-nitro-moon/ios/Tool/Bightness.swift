import Foundation
import UIKit


final class ToolBightness {
    
    static let shared = ToolBightness()

    // 初始屏幕亮度
    static var originalBrightness: CGFloat = {
        var value: CGFloat = 0;
        MainThreadRun.sync {
            value = UIScreen.main.brightness
        }
        return value
    }()

    private init() {}

    // 获取屏幕亮度
    public func getBrightness() -> Double {
        MainThreadRun.sync {
            Double(UIScreen.main.brightness)
        }
    }
    
    // 恢复屏幕亮度
    public func restoreBrightness() {
        let restoreValue = ToolBightness.originalBrightness
        MainThreadRun.sync {
            UIScreen.main.brightness = restoreValue
        }
    }
    
    // 设置屏幕亮度
    public func setBrightness(_ value: Double) {
        let safeValue = min(max(value, 0.0), 1.0)
        guard safeValue.isFinite else { return }
        MainThreadRun.sync {
            UIScreen.main.brightness = CGFloat(safeValue)
        }
    }
    
    // 开启或关闭熄屏
    public func setIdleTimeDisabled(_ value: Bool) {
        MainThreadRun.sync {
            UIApplication.shared.isIdleTimerDisabled = value
        }   
    }
    
}
