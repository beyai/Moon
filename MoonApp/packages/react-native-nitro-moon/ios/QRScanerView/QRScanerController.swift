import AVFoundation

protocol QRScanerControllerDelegate: AnyObject {
    func scanResult(_ result: String)
}


final class QRScanerController: NSObject {
    weak var delegate: QRScanerControllerDelegate?
    
    private let session = AVCaptureSession()
    private let sessionQueue = DispatchQueue(label: "QRScanerView.Queue")
    private weak var previewView: QRScanerView?
    
    
    init(previewView: QRScanerView) {
        self.previewView = previewView
        super.init()
        configureSession()
    }

    /// 安装相机设备
    private func configureSession() {
        guard let device   = AVCaptureDevice.default(for: .video) else {
            return
        }
        do {
            let input = try AVCaptureDeviceInput(device: device)
            if session.canAddInput(input) {
                session.addInput(input)
            }
            
            let output = AVCaptureMetadataOutput()
            if session.canAddOutput(output) {
                session.addOutput(output)
                output.setMetadataObjectsDelegate(self, queue: sessionQueue )
                output.metadataObjectTypes = [ .qr ]
            }
            
            let previewLayer = AVCaptureVideoPreviewLayer(session: session)
            
            DispatchQueue.main.async {
                self.previewView?.previewLayer = previewLayer
            }
        } catch {
            print(error.localizedDescription)
        }
    }
    
    /// 启动
    func start() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if !self.session.isRunning {
                self.session.startRunning()
            }
        }
    }
    
    /// 停止
    func stop() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if self.session.isRunning {
                self.session.stopRunning()
            }
        }
    }
}


extension QRScanerController: AVCaptureMetadataOutputObjectsDelegate {
    /// 接收检测结果
    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let stringValue = metadataObject.stringValue
        else { return }
        delegate?.scanResult(stringValue)
    }
}
