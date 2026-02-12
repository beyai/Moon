import Foundation

protocol ToolBetteryDelegate: AnyObject {
    func onBattery(value: Double)
}

final class ToolBattery {
    
    static let shared = ToolBattery()
    
    weak var delegate: ToolBetteryDelegate?
    
    init() {
        setupBatteryLevelObserver()
    }
    
    // 监听电量变化
    func setupBatteryLevelObserver() {
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
        delegate?.onBattery(value: getBatteryValue())
    }
    
    // 获取电量值
    public func getBatteryValue() -> Double {
        let value = UIDevice.current.batteryLevel
        guard value >= 0 else { return 0 }
        return Double( Int( value * 100) )
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
}
