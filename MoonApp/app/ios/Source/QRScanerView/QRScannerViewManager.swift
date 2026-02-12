import Foundation
import React

@objc(QRScannerViewManager)
class QRScannerViewManager: RCTViewManager {
    
    override static func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    override func view() -> UIView! {
        return QRScannerView()
    }
}
