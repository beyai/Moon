import Foundation
import UIKit

protocol ToolScreenCaptureDelegate: AnyObject {
    func onScreenCapture(state: Bool)
}

final class ToolScreenCapture {
    
    static let shared = ToolScreenCapture()
    
    weak var delegate: ToolScreenCaptureDelegate?
    
    // 主窗口
    static var mainWin: UIWindow? = {
        var window: UIWindow?
        MainThreadRun.sync {
            window = UIApplication.shared.firstKeyWindow
        }
        return window
    }()
    
    // 屏幕是否捕获中
    static var isScreenCaptured = false
    
    private init() {
       setupScreenCaptureObserver()
    }
    
    // 监听屏幕捕获状态
    func setupScreenCaptureObserver() {
        if #available(iOS 17, *) {
            ToolScreenCapture.mainWin?.registerForSceneCaptureStateChanges { [weak self] state in
                guard let self = self else { return }
                let isCaptured = state == .active;
                if isCaptured != ToolScreenCapture.isScreenCaptured {
                    ToolScreenCapture.isScreenCaptured = isCaptured
                    self.triggerStateChange(isCaptured)
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
        let isCaptured = getScreenIsCaptured()
        if isCaptured != ToolScreenCapture.isScreenCaptured {
            ToolScreenCapture.isScreenCaptured = isCaptured
            triggerStateChange(isCaptured)
        }
    }
    
    // 获取屏幕捕获状态
    public func getScreenIsCaptured() -> Bool {
        MainThreadRun.sync {
            if #available(iOS 17, *), let window = ToolScreenCapture.mainWin {
               return window.getCaptureState() == .active
            } else {
                return UIScreen.main.isCaptured
            }
        }
    }
    
    // 触发状态改变化
    public func triggerStateChange(_ state: Bool) {
        delegate?.onScreenCapture(state: state)
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
}
