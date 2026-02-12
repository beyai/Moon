import Foundation
import AVFoundation
import React

@objc(CoreModule)
class CoreModule: RCTEventEmitter {
    
    // MARK: - 事件
    
    // 是否有监听器
    private var hasListeners = false
    
    // 是否需要在主线程中初始化
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // 当监听器添加时调用
    override func startObserving() {
        hasListeners = true
    }
    
    // 当监听器移除时调用
    override func stopObserving() {
        hasListeners = false
    }
    
    // 支持的事件列表
    override func supportedEvents() -> [String]! {
        return [
            "onScreenCaptureState", "onBattery"
        ]
    }

    // 发送事件
    override func sendEvent(withName name: String, body: Any?) {
        if hasListeners {
            DispatchQueue.main.async {
                super.sendEvent(withName: name, body: body)
            }
        }
    }
    
    // MARK: - 方法
    
    // 获取设备吗
    @objc
    public func getDeviceCode() -> String? {
        return DeviceManager.shared.deviceCode
    }
    
    // 获取相机权限状态
    @objc
    public func getCameraPermissionStatus() -> String {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        switch status {
            case .notDetermined: return "notDetermined"
            case .restricted: return "restricted"
            case .denied: return "denied"
            case .authorized: return "authorized"
            default: return "unknow"
        }
    }

    // 请求相机权限
    @objc
    public func requestCameraPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject _: @escaping RCTPromiseRejectBlock ) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            let result: AVAuthorizationStatus = granted ? .authorized : .denied
            switch result {
                case .denied: resolve("denied")
                case .authorized: resolve("authorized")
                default: resolve("unknow")
            }
        }
    }
    
    
    // MARK: - 初始化
    
    // 初始化
    override init() {
        super.init()
        self.initOriginalBrightness()
        self.onBatteryLevel()
        self.onScreenCapture()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }

}
