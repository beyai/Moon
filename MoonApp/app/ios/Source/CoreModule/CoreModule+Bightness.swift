import UIKit
import React

extension CoreModule {
    
    static var originalBrightness:CGFloat = UIScreen.main.brightness
    
    // 初始化屏幕亮度
    func initOriginalBrightness() {
        CoreModule.originalBrightness = UIScreen.main.brightness
    }
    
    // 获取屏幕亮度
    @objc
    public func getBrightness(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock) {
        let value = Double(UIScreen.main.brightness)
        resolve(value)
    }
    
    // 恢复屏幕亮度
    @objc
    public func restoreBrightness() {
        let restoreValue = CoreModule.originalBrightness
        let restoreAction = {
            UIScreen.main.brightness = restoreValue
        }
        
        if Thread.isMainThread {
            restoreAction()
        } else {
            DispatchQueue.main.async {
                restoreAction()
            }
        }
    }
    
    // 设置屏幕亮度
    @objc
    public func setBrightness(_ value: NSNumber) {
        let safeValue = min(max(value.doubleValue, 0.0), 1.0)
        guard safeValue.isFinite else { return }
        if Thread.isMainThread {
            UIScreen.main.brightness = CGFloat(safeValue)
        } else {
            DispatchQueue.main.async {
                UIScreen.main.brightness = CGFloat(safeValue)
            }
        }
    }
    
    // 开启或关闭熄屏
    @objc
    public func setIdleTimeDisabled(_ value: Bool) {
        let action = {
            UIApplication.shared.isIdleTimerDisabled = value
        }
        if Thread.isMainThread {
            action()
        } else {
            DispatchQueue.main.async {
                action()
            }
        }
    }
    
}
