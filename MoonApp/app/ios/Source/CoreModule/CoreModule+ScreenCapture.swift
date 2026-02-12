import Foundation
import React
import UIKit

extension CoreModule {
    
    // 主窗口
    static var keyWindow = {
        return UIApplication.shared.firstKeyWindow
    }()
    
    // 屏幕是否捕获中
    static var isScreenCaptured = false
    
    // 监听屏幕捕获状态
    func onScreenCapture() {
        if #available(iOS 17, *) {
            Self.keyWindow?.registerForSceneCaptureStateChanges { [weak self] state in
                guard let self = self else { return }
                let isCaptured = state == .active;
                if isCaptured != Self.isScreenCaptured {
                    Self.isScreenCaptured = isCaptured
                    sendEvent(withName: "onScreenCaptureState", body: isCaptured )
                }
            }
        } else {
            NotificationCenter.default.addObserver(
                self,
                selector: #selector(self.screenCaptureStateDidChange),
                name: UIScreen.capturedDidChangeNotification,
                object: nil
            )
        }
    }
    
    // 监听屏幕捕获状态变化
    @objc
    private func screenCaptureStateDidChange(notification: Notification) {
        let isCaptured = self.getScreenIsCaptured()
        if isCaptured != Self.isScreenCaptured {
            Self.isScreenCaptured = isCaptured
            sendEvent(withName: "onScreenCaptureState", body: isCaptured )
        }
    }
    
    // 获取屏幕捕获状态
    private func getScreenIsCaptured() -> Bool {
        var isCaptured = UIScreen.main.isCaptured
        if #available(iOS 17, *) {
           isCaptured = Self.keyWindow?.getCaptureState() == .active
        }
        return isCaptured
    }
    
    @objc
    public func getScreenCaptureState(_ resolve: @escaping RCTPromiseResolveBlock, rejecter _: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            resolve(self.getScreenIsCaptured())
        }
    }
}
