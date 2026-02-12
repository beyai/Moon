import Foundation
import AVFoundation
import VideoToolbox


protocol VideoFrameDelegate: AnyObject {
    var callbackQueue: DispatchQueue { get }
    func onVideoFrame(_ videoFrame: VideoFrame)
}

final class WeakVideoFrameDelegate {
    weak var value: (any VideoFrameDelegate)?
    init(_ value: any VideoFrameDelegate) {
        self.value = value
    }
}

final class CameraController: NSObject {
    
    // 单例
    static let shared = CameraController()
    
    // MARK: - 多播代理管理 (Multicast Delegate)
    
    private let delegateQueue = DispatchQueue( label: "CameraController.DelegateQueue", attributes: .concurrent )
    
    private let sessionQueue = DispatchQueue(label: "CameraController.SessionQueue")
    
    // 代理
    private var delegates = [ WeakVideoFrameDelegate ]()
    
    // 添加代理
    func addDelegate(_ delegate: VideoFrameDelegate) {
        delegateQueue.async(flags: .barrier) {
            self.delegates.removeAll { $0.value == nil }
            if !self.delegates.contains(where: { $0.value === delegate }) {
                self.delegates.append(WeakVideoFrameDelegate(delegate))
            }
        }
    }
    
    // 删除代理
    func removeDelegate(_ delegate: VideoFrameDelegate) {
        delegateQueue.async(flags: .barrier) {
            self.delegates.removeAll { $0.value === delegate || $0.value == nil }
        }
    }
    
    // 分发视频帧
    private func dispatchVideoFrame(_ frame: VideoFrame) {
        delegateQueue.async { [weak self] in
            guard let self = self else { return }
            
            self.delegates.removeAll { $0.value == nil }
            let activeDelegates = self.delegates.compactMap { $0.value }
            
            for delegate in activeDelegates {
                delegate.callbackQueue.async {
                    delegate.onVideoFrame(frame)
                }
            }
        }
    }
    
    
    // MARK: - 属性
    
    // 日志
    private var logger = MLogger("CameraController")
    
    // 采集会话
    private let captureSession = AVCaptureSession()
    
    // 视频输出方向
    public var videoOrientation: AVCaptureVideoOrientation = .portrait

    // 采样像素格式
    private let pixelFormat: OSType = kCVPixelFormatType_32BGRA

    // 当前捕获设备
    private var captureDevice: AVCaptureDevice?

    // 采集输出
    private var sampleOuput: AVCaptureVideoDataOutput?

    // 视频输出
    private var videoInput: AVCaptureDeviceInput?
    
    // 亮度
    private var brightness: Double = 1.0
    
    // 采样队列
    private let sampleQueue = DispatchQueue(label: "CameraManager.SampleQueue", qos: .userInitiated )

    override init() {
        super.init()
    }
    
    // MARK: - 安装
    
    // 锁定相机配置
    private func withLockedConfiguration(_ actions: () -> Void) {
       guard let device = captureDevice else { return }
       do {
           try device.lockForConfiguration()
           actions()
           device.unlockForConfiguration()
       } catch {
           logger.error(error.localizedDescription)
       }
    }
    
    
    // MARK: 获取相机设备
    public func getCaptureDevice(for position: AVCaptureDevice.Position) -> AVCaptureDevice? {
        if position == .front {
            return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
                ?? AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
        } else {
            return AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
                ?? AVCaptureDevice.default(.builtInUltraWideCamera, for: .video, position: .back)
        }

        // 优先使用三摄/双摄，降级到广角
        //if position == .front {
        //    return AVCaptureDevice.default(.builtInTrueDepthCamera, for: .video, position: .front)
        //        ?? AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .front)
        //} else {
        //    return AVCaptureDevice.default(.builtInTripleCamera, for: .video, position: .back)
        //        ?? AVCaptureDevice.default(.builtInDualCamera, for: .video, position: .back)
        //        ?? AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back)
        //}
    }

    // 安装相机
    public func setupDevice(filterFormat: CameraFilterFormat) -> Bool {
        
        // 如果运行中先停止
        if self.captureSession.isRunning {
            self.captureSession.stopRunning()
        }
        
        captureSession.beginConfiguration()
        defer { captureSession.commitConfiguration() }
        
        // 移除旧的输入
        if let oldInput = videoInput {
            captureSession.removeInput(oldInput)
        }
        
        // 移除旧的输出 (可选，通常 Output 可以复用，但为了稳健重建)
        if let oldOutput = sampleOuput {
            captureSession.removeOutput(oldOutput)
        }
        
        var position: AVCaptureDevice.Position = .back
        if  filterFormat.position != .back {
            position = .front
        }
        
        // 设备
        guard let device = getCaptureDevice(for: position),
              let currentInput  = try? AVCaptureDeviceInput(device: device),
              let format        = device.filterFormat(filterFormat)
        else {
            return false
        }
        
        self.captureDevice = device
    
        // 添加输入设备
        if captureSession.canAddInput(currentInput) {
            captureSession.addInput(currentInput)
        }
        
        withLockedConfiguration {
            device.activeFormat = format
            // 自动白平衡
            if device.isWhiteBalanceModeSupported( .continuousAutoWhiteBalance) {
                device.whiteBalanceMode = .continuousAutoWhiteBalance
            }
            // 低光增强
            if device.isLowLightBoostSupported {
                device.automaticallyEnablesLowLightBoostWhenAvailable = false
            }
        }
        
        // 采样
        let sampleOuput = AVCaptureVideoDataOutput()
        let settings: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: NSNumber(value: pixelFormat),
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:]
        ]
        sampleOuput.videoSettings = settings
        sampleOuput.alwaysDiscardsLateVideoFrames = false /// 不丢弃帧
        sampleOuput.setSampleBufferDelegate(self, queue: sampleQueue)
        
        if captureSession.canAddOutput(sampleOuput) {
            captureSession.addOutput(sampleOuput)
        }
        
        if let connection = sampleOuput.connection(with: .video) {
            if connection.isVideoOrientationSupported {
                connection.videoOrientation = videoOrientation
            }
        }
        
        self.videoInput     = currentInput
        self.sampleOuput    = sampleOuput
        

        return true
    }
    
    
    // MARK: - 设置属性
    
    // 更新配置
    public func updateConfiguration( fps: Double?, zoom: Double?, focus: Double?, exposure: Double? ) {
        guard let deivce = captureDevice else { return }
        withLockedConfiguration {
            if let fps = fps {
                setFps(device: deivce, fps: fps)
            }
            
            if let focus = focus {
                setFocus(device: deivce, focus: focus)
            }
            
            if let zoom = zoom {
                setZoom(device: deivce, zoom: zoom)
            }
            
            if let exposure = exposure {
                setExposure(device: deivce, exposure: exposure)
            }
        }
    }
    
    // 帧率
    private func setFps(device: AVCaptureDevice, fps: Double) {
        let format      = device.currentFormatDescription()
        let timescale   = max(format.minFps, min(fps, format.maxFps))
        let duration    = CMTimeMake(value: 1, timescale: Int32(timescale))
        
        device.activeVideoMinFrameDuration = duration
        device.activeVideoMaxFrameDuration = duration
    }
    
    // 放大
    private func setZoom(device: AVCaptureDevice, zoom: Double) {
        let zoom = max(0, min(zoom, 3))
        device.videoZoomFactor = CGFloat(zoom)
    }
    
    // 对焦
    private func setFocus(device: AVCaptureDevice, focus: Double) {
        guard device.isFocusModeSupported(.locked), device.isLockingFocusWithCustomLensPositionSupported else { return }
        let lensPosition = max(0, min(focus, 1))
        
        device.setFocusModeLocked(lensPosition: Float(lensPosition), completionHandler: nil)
    }
    
    // 曝光
    private func setExposure(device: AVCaptureDevice, exposure: Double) {
        guard device.isExposureModeSupported(.continuousAutoExposure) else { return }
        device.exposureMode = .continuousAutoExposure
        
        let format          = device.currentFormatDescription()
        let exposure        = max(0, min(exposure, 1))
        let baseExposure    = format.minExposureDuration
        let minExposure     = baseExposure * 10
        let timescale       = exposure * ( baseExposure - minExposure ) + minExposure
        
        device.activeMaxExposureDuration = CMTimeMake(value: 1, timescale: Int32(timescale) )
    }
    
    // 调节亮度
    public func setBrightness(brightness: Double ) {
        sampleQueue.async {
            self.brightness = max(1, min(brightness, 3))
        }
    }
    
    // 旋转画面
    public func setOrientation(orientation: AVCaptureVideoOrientation) {
        guard let output = sampleOuput else { return }
        sampleQueue.async { [weak self] in
            guard let self = self, let connection = output.connection(with: .video), connection.isVideoOrientationSupported else {
                return
            }
            connection.videoOrientation = orientation
            self.videoOrientation = orientation
        }
    }
    
    // 获取当前相机的格式信息
    public func getFormatInfo() -> CameraFormat? {
        guard let deivce = captureDevice else {
            return nil
        }
        return deivce.currentFormatDescription()
    }
    
    // 开始
    public func start() {
        if !self.captureSession.isRunning {
            self.captureSession.startRunning()
        }
    }
    
    // 停止
    public func stop() {
        if self.captureSession.isRunning {
            self.captureSession.stopRunning()
        }
    }
}


// MARK: - 接收采样
extension CameraController: AVCaptureVideoDataOutputSampleBufferDelegate {
    
    // 捕获输出
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        guard var videoFrame = VideoFrame.from(sampleBuffer: sampleBuffer) else { return }
        
        // 画面方向
        videoFrame.orientation = connection.videoOrientation
        
        // 相机位置
        if let port = connection.inputPorts.first, let deviceInput = port.input as? AVCaptureDeviceInput {
            videoFrame.positon = deviceInput.device.position
        }
        
        videoFrame.applyBrightness(factor: brightness)
        
        // 分发
        dispatchVideoFrame(videoFrame)
    }
}
