import Foundation
import AVFoundation
import NitroModules

final class Tool : HybridToolSpec {
    
    override init() {
        super.init()
        ToolBattery.shared.delegate = self
        ToolScreenCapture.shared.delegate = self
    }
    
    deinit {
        ToolBattery.shared.delegate = nil
        ToolScreenCapture.shared.delegate = nil
    }
    
    
    // MARK: 导出方法
    
    // 获取设备唯一标识
    func getDeviceUID() -> String {
        SessionService.shared.deviceUID
    }
    
    // 获取设备码
    func getDeviceCode() -> String {
        SessionService.shared.deviceCode
    }
    
    // 设置激活状态
    func setDeviceStatus(state: Bool) {
        if (state) {
            SilentTimeout.shared.cancel()
        } else {
            SilentTimeout.shared.start()
        }
        
    }
    
    // 版本号
    func getVersion() -> String {
        return NitroMoonBridge.getVersion()
    }

    // 获取相机权限状态
    func getCameraPermissionStatus() -> CameraPermissionStatus {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        var stateValue = CameraPermissionStatus.unknown
        switch status {
            case .notDetermined:
            stateValue = CameraPermissionStatus.notdetermined
            case .restricted:
            stateValue = CameraPermissionStatus.restricted
            case .denied:
            stateValue = CameraPermissionStatus.denied
            case .authorized:
            stateValue = CameraPermissionStatus.authorized
            default:
            stateValue = CameraPermissionStatus.unknown
        }
        
        return stateValue
    }
    
    // 请求相机权限
    func requestCameraPermission() -> Promise<CameraPermissionStatus> {
        return Promise.async(.userInitiated) {
            let granted = await AVCaptureDevice.requestAccess(for: .video)
            return granted ? .authorized : .denied
        }
    }
    
    // 获取电量
    func getBattery() -> Promise<Double> {
        return Promise.async(.userInitiated) {
            let value = ToolBattery.shared.getBatteryValue()
            return value
        }
    }

    // 获取屏幕捕获状态
    func getScreenCaptureStatus() -> Promise<Bool> {
        return Promise.async {
            let state = ToolScreenCapture.shared.getScreenIsCaptured()
            return state
        }
    }
    
    // 获取屏幕亮度
    func getBrightness() -> Promise<Double> {
        return Promise.async(.userInitiated) {
            let value = ToolBightness.shared.getBrightness()
            return value
        }
    }
    
    // 设置屏幕亮度
    func setBrightness(brightness: Double) -> Void {
        MainThreadRun.async {
            ToolBightness.shared.setBrightness(brightness)
        }
    }
    
    // 重置屏幕亮度
    func restoreBrightness() -> Void {
        MainThreadRun.async {
            ToolBightness.shared.restoreBrightness()
        }
    }

    // 设置自动熄屏
    func setIdleTimeDisabled(disabled: Bool) -> Void {
        MainThreadRun.async {
            ToolBightness.shared.setIdleTimeDisabled(disabled)
        }
    }
    
    // MARK: 回调
    
    typealias BatteryListener = (_ value: Double) -> Void
    typealias ScreenCaptureListener = (_ state: Bool) -> Void
    typealias RemoveListener = () -> Void
    
    // 电量回调
    var batteryListener: BatteryListener?
    func onBatteryChange(listener: @escaping BatteryListener ) throws -> RemoveListener {
        batteryListener = listener
        return { [weak self] in
            self?.batteryListener = nil
        }
    }
    
    // 屏幕捕获状态
    var screenCaptureListener: ScreenCaptureListener?
    func onScreenCaptureStateChange(listener: @escaping ScreenCaptureListener ) throws -> RemoveListener {
        screenCaptureListener = listener
        return { [weak self] in
            self?.screenCaptureListener = nil
        }
    }
}


// MARK: - 接收回调消息
extension Tool: ToolBetteryDelegate, ToolScreenCaptureDelegate {
    
    func onBattery(value: Double) {
        MainThreadRun.async { [weak self] in
            self?.batteryListener?(value)
        }
    }
    
    func onScreenCapture(state: Bool) {
        MainThreadRun.async { [weak self] in
            self?.screenCaptureListener?(state)
        }
    }
}
