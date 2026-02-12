import UIKit


extension UIApplication {
    var firstKeyWindow: UIWindow? {
      connectedScenes.compactMap { $0 as? UIWindowScene }.first?.keyWindow
    }
}

extension UIViewController {
    func topMostViewController() -> UIViewController {
        if let presented = self.presentedViewController {
            return presented.topMostViewController()
        }
        if let nav = self as? UINavigationController, let visible = nav.visibleViewController {
            return visible.topMostViewController()
        }
        if let tab = self as? UITabBarController, let selected = tab.selectedViewController {
            return selected.topMostViewController()
        }
        return self
    }
}


@available(iOS 17, *)
extension UIWindow {
    
    func registerForSceneCaptureStateChanges(completion: @escaping @MainActor (UISceneCaptureState) -> Void) {
        registerForTraitChanges([UITraitSceneCaptureState.self]) { (self: Self, _) in
            completion(self.traitCollection.sceneCaptureState)
        }
    }
    
    func getCaptureState() -> UISceneCaptureState {
        return self.traitCollection.sceneCaptureState
    }
}
