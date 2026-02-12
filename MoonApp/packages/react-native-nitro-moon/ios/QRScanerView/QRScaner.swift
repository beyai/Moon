import Foundation
import UIKit
import AVFoundation

final class QRScaner : HybridQRScanerSpec, QRScanerControllerDelegate {
    
    private let scanerView = QRScanerView()
    private var controller: QRScanerController!
    
    override init() {
        super.init()
        controller = QRScanerController(previewView: scanerView)
        controller.delegate = self
    }
    
    /// 视图
    var view        : UIView { scanerView }
    
    /// 是否暂停接收扫码结果
    var paused      : Bool = false
    
    /// 是否激活相机
    var isActive    : Bool = false {
        didSet {
            isActive == true ? controller.start() : controller.stop()
        }
    }
    
    /// 扫码结果回调
    var onScan      : ((String) -> Void)?
    
    func afterUpdate() {
        print("paused   = \( paused )")
        print("isActive = \( isActive )")
    }
    
    /// 销毁
    func dispose() {
        self.isActive   = false
        self.onScan     = nil
    }
    
    /// 扫码结果
    func scanResult(_ result: String) {
        guard !paused else { return }
        MainThreadRun.async { [weak self] in
            guard let self = self else { return }
            self.onScan?(result)
        }
    }
}

