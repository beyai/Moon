import AVFoundation
import Foundation
import React

@objc(CameraViewManager)
class CameraViewManager: RCTViewManager {
    
    override static func moduleName() -> String! {
        return "CameraView"
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }

    override func view() -> UIView {
        return CameraView()
    }
}
