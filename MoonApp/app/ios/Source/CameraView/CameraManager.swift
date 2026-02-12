import Foundation
import AVFoundation
import VideoToolbox


protocol CameraVideoFrameDelegate: AnyObject {
    func onVideoFrame(_ videoFrame: VideoFrame)
}

struct WeakCameraDelegate {
    weak var value: CameraVideoFrameDelegate?
}

class CameraManager: NSObject, AVCaptureVideoDataOutputSampleBufferDelegate {
    // 单例
    static let shared = CameraManager()
    
    // MARK: - 多播代理管理 (Multicast Delegate)
    
    // 代理
    private var delegates = [ WeakCameraDelegate ]()
    
    // 代理锁
    private let delegateLock = NSLock()
    
    // 添加代理
    func addDelegate(_ delegate: CameraVideoFrameDelegate ) {
        delegateLock.lock()
        defer { delegateLock.unlock() }
        // 清理由于对象销毁留下的 nil
        delegates = delegates.filter { $0.value != nil }
        // 避免重复添加
        if !delegates.contains(where: { $0.value === delegate }) {
            delegates.append(WeakCameraDelegate(value: delegate))
        }
    }
    
    // 删除代理
    func removeDelegate(_ delegate: CameraVideoFrameDelegate ) {
        delegateLock.lock()
        defer { delegateLock.unlock() }
        delegates = delegates.filter { $0.value != nil && $0.value !== delegate }
    }
    
    // 分发视频帧
    private func dispatchVideoFrame(_ videoFrame: VideoFrame ) {
        delegateLock.lock()
        let currentDelegates = delegates.filter { $0.value != nil }
        delegateLock.unlock()
        
        for wrapper in currentDelegates {
            wrapper.value?.onVideoFrame(videoFrame)
        }
    }
    
    // MARK: - 属性
    
    // 日志
    private var logger = RTCLogger("CameraManager")
    
    // 渲染代理
    public weak var previewDelegate: CameraVideoFrameDelegate?
        
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
    private var brightness: Float = 1.0
    
    // 采样队列
    private let sampleQueue = DispatchQueue(label: "CameraManager.SampleQueue", qos: .userInteractive )
    
    // MARK: - 初始化
    private override init() {
        super.init()
    }
    
    // MARK: - 配置与控制
    
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
    
    // 安装设备
    func setupDevice(filterFormat: FilterFormat) -> AVCaptureDevice? {
        captureSession.beginConfiguration()
        defer { captureSession.commitConfiguration() }
        
        captureSession.sessionPreset = .inputPriority
        
        // 当前视频输入
        var position: AVCaptureDevice.Position = .back
        if  (filterFormat.position.lowercased()) != "back" {
            position = .front
        }
        
        guard let device = Helper.getCaptureDevice(for: position),
              let currentInput = try? AVCaptureDeviceInput(device: device)
        else {
            return nil
        }
        
        // 相机格式格式
        guard let format = device.filterFormat(filterFormat) else {
            return nil
        }
        
        captureDevice = device
        
        // 添加输入
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
        
        // 设置采样输出
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
                connection.videoOrientation = .portrait
            }
        }

        self.videoInput = currentInput
        self.sampleOuput = sampleOuput
        
        return device
    }
    
    // 开始捕获
    func startCapture() {
        guard !captureSession.isRunning else { return }
        DispatchQueue.global().async {
            self.captureSession.startRunning()
        }
    }
    
    // 停止捕获
    func stopCapture() {
        guard captureSession.isRunning else { return }
        captureSession.stopRunning()
        
        // 移除输入输出
        if let videoInput = videoInput {
            captureSession.removeInput(videoInput)
            self.videoInput      = nil
        }
        
        // 移除采样
        if let sampleOuput = sampleOuput {
            sampleOuput.setSampleBufferDelegate(nil, queue: nil)
            captureSession.removeOutput(sampleOuput)
            self.sampleOuput = nil
        }
        captureDevice   = nil
        usleep(200)
    }
    
    // 设置视频输出方向
    func setVideoOrientation(_ videoOrientation: AVCaptureVideoOrientation ) {
        guard let sampleOuput = sampleOuput else {
            return
        }
        sampleQueue.async { [weak self] in
            guard let self = self, let connection = sampleOuput.connection(with: .video), connection.isVideoOrientationSupported else {
                return
            }
            connection.videoOrientation = videoOrientation
            self.videoOrientation       = videoOrientation
        }
        
    }
    
    // 更新相机配置参数
    func updateConfiguration(fps: Int32?, zoom: Float?, focus: Float?, exposure: Double? ) {
        captureSession.beginConfiguration()
        defer { captureSession.commitConfiguration() }
        withLockedConfiguration {
            if let fps = fps {
                setFps(fps)
            }
            if let zoom = zoom {
                setZoom(zoom)
            }
            if let focus = focus {
                setFocusDepth(focus)
            }
            if let exposure = exposure {
                setExposure(exposure)
            }
        }
    }
    
    // 设置亮度
    func setBrightness(_ brightness: Float) {
        self.brightness = brightness
    }
    
    // 设置帧率
    private func setFps(_ fps: Int32) {
        guard let device = captureDevice else { return }
        let format = device.currentFormatDescription()
        let timescale = Helper.valueInRange( value: fps, minValue: format.minFps, maxValue: format.maxFps )
        let duration = CMTimeMake(value: 1, timescale: timescale )
        device.activeVideoMinFrameDuration = duration
        device.activeVideoMaxFrameDuration = duration
    }
    
    // 焦距
    private func setZoom(_ zoom: Float) {
        guard let device = captureDevice else { return }
        let zoom = Helper.valueInRange( value: zoom, minValue: 1.0, maxValue: 3.0 )
        device.videoZoomFactor = CGFloat(zoom)
    }
    
    // 对焦
    private func setFocusDepth(_ focus: Float) {
        guard let device = captureDevice,
            device.isFocusModeSupported(.locked),
            device.isLockingFocusWithCustomLensPositionSupported
        else { return }
        
        let depth = Helper.valueInRange( value: focus, minValue: 0.0, maxValue: 1.0 )
        device.setFocusModeLocked(lensPosition: depth, completionHandler: nil)
    }
    
    // 曝光补偿
    private func setExposureBias(_ exposure: Double) {
        guard let device = captureDevice else { return }
        guard device.isExposureModeSupported(.continuousAutoExposure) else { return }
        device.exposureMode = .continuousAutoExposure
        
        let format      = device.currentFormatDescription()
        let minBias     = format.minExposureTargetBias
        let maxBias     = format.maxExposureTargetBias
        let exposure    = Helper.valueInRange( value: exposure, minValue: 0.0, maxValue: 1.0 )
        let targetBias  = Helper.denormalize( value: Float(exposure), minValue: minBias, maxValue: maxBias )
        device.setExposureTargetBias(targetBias)
    }
    
    // 曝光
    private func setExposure(_ exposure: Double) {
        guard let device = captureDevice else { return }
        guard device.isExposureModeSupported(.continuousAutoExposure) else { return }
        device.exposureMode = .continuousAutoExposure
        
        let format      = device.currentFormatDescription()
        let exposure    = Helper.valueInRange( value: exposure, minValue: 0.0, maxValue: 1.0 )
        let minExposure = Double(format.minExposureDuration)
        let timescale   = Helper.denormalize( value: exposure, minValue: minExposure * 10, maxValue: minExposure )
        device.activeMaxExposureDuration = CMTimeMake(value: 1, timescale: Int32(timescale) )
    }
    
    //  画面捕获输出
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection ) {
        guard var videoFrame = VideoFrame.from(sampleBuffer: sampleBuffer) else {
            return
        }
        
        if let port = connection.inputPorts.first, let deviceInput = port.input as? AVCaptureDeviceInput {
            let device = deviceInput.device
            videoFrame.positon = device.position
        }
        
        videoFrame.orientation = connection.videoOrientation
        
        // 后期：亮度调节
        videoFrame.applyBrightness(factor: brightness)
        
        // 分发视频帧
        dispatchVideoFrame(videoFrame)
    }
    
    
    
    
}
