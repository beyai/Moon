import Foundation
import React

extension CoreModule {
    
    // 监听电量变化
    func onBatteryLevel() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(self.batteryLevelDidChange),
            name: UIDevice.batteryLevelDidChangeNotification,
            object: nil
        )
    }
    
    // 监听电量变化
    @objc
    private func batteryLevelDidChange(notification: Notification) {
        sendEvent(withName: "onBattery", body: getBatteryValue() )
    }
    
    // 获取电量值
    private func getBatteryValue() -> Int {
        let batteryLevel = UIDevice.current.batteryLevel
        var level: Int = Int(batteryLevel * 100)
        level = level <= 0 ? 0 : level
        return level
    }
    
    @objc
    public func getBattery(_ resolve: @escaping RCTPromiseResolveBlock, rejecter _: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            resolve(self.getBatteryValue())
        }
    }
    
}
