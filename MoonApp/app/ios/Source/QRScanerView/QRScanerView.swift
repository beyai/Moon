import UIKit
import AVFoundation
import React

@objc(QRScannerView)
class QRScannerView: UIView, AVCaptureMetadataOutputObjectsDelegate {

    private var captureSession: AVCaptureSession?
    private var previewLayer: AVCaptureVideoPreviewLayer?
    private var isScanningPaused = false
    private let sessionQueue = DispatchQueue(label: "QRScannerQueue")
    
    @objc var paused: Bool = false
    @objc var onQRScan: RCTDirectEventBlock?
    
    
    override init(frame: CGRect) {
        super.init(frame: frame)
        sessionQueue.async { [weak self] in
            self?.setupCamera()
        }
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
    }

    private func setupCamera() {
        let session = AVCaptureSession()

        guard let videoCaptureDevice = AVCaptureDevice.default(for: .video) else { return }
        guard let videoInput = try? AVCaptureDeviceInput(device: videoCaptureDevice) else { return }

        if session.canAddInput(videoInput) {
            session.addInput(videoInput)
        }

        let metadataOutput = AVCaptureMetadataOutput()
        if session.canAddOutput(metadataOutput) {
            session.addOutput(metadataOutput)
            metadataOutput.setMetadataObjectsDelegate(self, queue: self.sessionQueue)
            metadataOutput.metadataObjectTypes = [.qr]
        }
        
        DispatchQueue.main.async {
            self.previewLayer = AVCaptureVideoPreviewLayer(session: session)
            self.previewLayer?.videoGravity = .resizeAspectFill
            self.previewLayer?.frame = self.layer.bounds
            if let layer = self.previewLayer {
                self.layer.addSublayer(layer)
            }
        }

        self.captureSession = session
        session.startRunning()
    }

    func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard !paused else { return }
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject, let stringValue = metadataObject.stringValue else {
            return
        }
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            let result: [String: String] = [ "data": stringValue ]
            self.onQRScan?(result)
        }
    }
    
    override func willMove(toSuperview newSuperview: UIView?) {
        if newSuperview == nil {
            sessionQueue.async { [weak self] in
                self?.captureSession?.stopRunning()
            }
        }
    }

}
