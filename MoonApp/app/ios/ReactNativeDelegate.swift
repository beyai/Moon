import React

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    
    private let launchURL: URL?

    init(launchURL: URL) {
        self.launchURL = launchURL
        super.init()
    }
    
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        self.bundleURL()
    }

    override func bundleURL() -> URL? {
        #if DEBUG
        return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
        #else
        return launchURL
        #endif
    }
}
