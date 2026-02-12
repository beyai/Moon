import UIKit
import React
import ReactAppDependencyProvider
import React_RCTAppDelegate

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    var reactNativeDelegate: ReactNativeDelegate?
    var reactNativeFactory: RCTReactNativeFactory?

    func scene( _ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions ) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        
        let bootVC = BootViewController()
        bootVC.delegate = self
        
        window?.rootViewController = bootVC
        window?.makeKeyAndVisible()
        
        if let appDelegate = UIApplication.shared.delegate as? AppDelegate {
            appDelegate.window = self.window
        }
    }

    func sceneDidDisconnect(_ scene: UIScene) {
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
    }

    func sceneWillResignActive(_ scene: UIScene) {
    }

    func sceneWillEnterForeground(_ scene: UIScene) {
    }

    func sceneDidEnterBackground(_ scene: UIScene) {
    }
}


extension SceneDelegate: BootViewControllerDelegate {
    
    func bootTaskDidFinish(url: URL) {
        let delegate = ReactNativeDelegate(launchURL: url)
        let factory = RCTReactNativeFactory(delegate: delegate)
        delegate.dependencyProvider = RCTAppDependencyProvider()
        
        self.reactNativeDelegate = delegate
        self.reactNativeFactory = factory
        
        factory.startReactNative( withModuleName: "Moon", in: window )
    }
}
