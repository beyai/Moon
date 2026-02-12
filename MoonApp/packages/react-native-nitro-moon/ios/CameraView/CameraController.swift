import Foundation
import AVFoundation
import VideoToolbox


/// 相机配置参数
struct CameraConfiguration {
    let filter: CameraFilter?
    let fps: Double?
    let zoom: Double?
    let focus: Double?
    let exposure: Double?
    let brightness: Double?
    let orientation: AVCaptureVideoOrientation?
}

final class CameraController: NSObject {
    
    /// 单例
    static let shared: CameraController = {
       let instance = CameraController()
        return instance
    }()
    
    // MARK: - 队列
    
    /// 采样队列
    private let sampleQueue     = DispatchQueue(label: "CameraManager.SampleQueue", qos: .userInitiated )
    /// session 队列
    private let sessionQueue    = DispatchQueue(label: "CameraController.SessionQueue", qos: .userInteractive)
    
    // MARK: - 属性
    
    /// 日志
    private var logger = MLogger("CameraController")
    /// 采集会话
    private let captureSession = AVCaptureSession()
    /////采样像素格式
    private let pixelFormat: OSType = kCVPixelFormatType_32BGRA
    /// 当前捕获设备
    private weak var captureDevice: AVCaptureDevice?
    /// 视频输入
    private var videoInput: AVCaptureDeviceInput?
    /// 视输输出
    private var videoOutput: AVCaptureVideoDataOutput?
    /// 亮度
    private var brightness: Double = 1.0

    // MARK: - 设置属性
    
    /// 帧率
    private func setFps(device: AVCaptureDevice, fps: Double) {
        let format      = device.currentFormatDescription()
        let timescale   = fps.clamped(to: format.minFps...format.maxFps)
        let duration    = CMTimeMake(value: 1, timescale: Int32(timescale))
        device.activeVideoMinFrameDuration = duration
        device.activeVideoMaxFrameDuration = duration
        logger.debug("帧率：\( fps )")
    }
    
    /// 放大
    private func setZoom(device: AVCaptureDevice, zoom: Double) {
        let min = device.minZoom
        let zoom = zoom.clamped(to: 1...3)
        device.videoZoomFactor = CGFloat(zoom)
    }
    
    /// 对焦
    private func setFocus(device: AVCaptureDevice, focus: Double) {
        guard device.isFocusModeSupported(.locked), device.isLockingFocusWithCustomLensPositionSupported else { return }
        let lensPosition = focus.clamped(to: 0...1)
        
        device.setFocusModeLocked(lensPosition: Float(lensPosition), completionHandler: nil)
    }
    
    /// 曝光
    private func setExposure(device: AVCaptureDevice, exposure: Double) {
        guard device.isExposureModeSupported(.continuousAutoExposure) else { return }
        device.exposureMode = .continuousAutoExposure
        
        let format          = device.currentFormatDescription()
        let exposure        = exposure.clamped(to: 0...1)
        let baseExposure    = format.minExposureDuration
        let minExposure     = baseExposure * 5
        let timescale       = exposure * ( baseExposure - minExposure ) + minExposure
        
        device.activeMaxExposureDuration = CMTimeMake(value: 1, timescale: Int32(timescale) )
        
        logger.debug("曝光：\( exposure )")
    }
    
    /// 调节亮度
    private func setBrightness(brightness: Double ) {
        self.brightness = brightness.clamped(to: 1...3)
    }
    
    // 旋转画面
    private func setOrientation(orientation: AVCaptureVideoOrientation) {
        guard let output = videoOutput, let connection = output.connection(with: .video), connection.isVideoOrientationSupported  else { return }
        connection.videoOrientation = orientation
    }
    
    
    // MARK: - 辅助方法
    
    /// 锁定相机配置
    private func withLockedConfiguration(on device: AVCaptureDevice, _ actions: () throws -> Void) throws  {
        try device.lockForConfiguration()
        defer { device.unlockForConfiguration() }
        try actions()
    }
    
    // MARK: - 相机配置

    /// 配置 session
    private func setupSessionOutput() throws {
        if self.videoOutput != nil { return }

        captureSession.outputs.forEach { output in
            if output is AVCaptureVideoDataOutput {
                captureSession.removeOutput(output)
            }
        }

        let settings: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: NSNumber(value: self.pixelFormat),
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:]
        ]
        
        let output = AVCaptureVideoDataOutput()
        output.videoSettings = settings
        output.alwaysDiscardsLateVideoFrames = false /// 不丢弃帧
        output.setSampleBufferDelegate(self, queue: self.sampleQueue)

        guard captureSession.canAddOutput(output) else {
            throw CreateError(message: "Failed to add video output to session")
        }
        self.captureSession.addOutput(output)
        self.videoOutput = output
    }

    /// 设置设备属性
    private func settingDevice(setting: CameraConfiguration) throws {
        guard let device = self.captureDevice else { return }
        try self.withLockedConfiguration(on: device) {
            if let fps = setting.fps {
                self.setFps(device: device, fps: fps)
            }
            if let focus = setting.focus {
                self.setFocus(device: device, focus: focus)
            }
            if let zoom = setting.zoom {
                self.setZoom(device: device, zoom: zoom)
            }
            if let exposure = setting.exposure {
                self.setExposure(device: device, exposure: exposure)
            }
        }
    }

    /// 设置画面方向
    private func settingSample(setting: CameraConfiguration) {
        sampleQueue.async { [weak self] in
            guard let self = self else { return }
            if let brightness = setting.brightness {    
                self.setBrightness(brightness: brightness)
            }
            if let orientation = setting.orientation {
                self.setOrientation(orientation: orientation)
            }
        }
    }
    
    /// 切换相机
    private func switchDevice(setting: CameraConfiguration) throws {
        guard let filter = setting.filter else {
            throw CreateError(message: "Missing the filter parameter")
        }

        self.captureSession.beginConfiguration()
        defer { self.captureSession.commitConfiguration() }
        
        // 移除旧的输入
        self.captureSession.inputs.forEach { input in
            if input is AVCaptureDeviceInput {
                self.captureSession.removeInput(input)
            }
        }

        // 相机位置
        let position: AVCaptureDevice.Position = filter.position != .back ? .front : .back
        
        // 设备
        guard let device      = AVCaptureDevice.findDevice(for: position),
            let currentInput  = try? AVCaptureDeviceInput(device: device),
            let format        = device.filterFormat(filter)
        else {
            throw CreateError(message: "Failed to find device for position: \(position.rawValue)")
        }

        guard self.captureSession.canAddInput(currentInput) else {
            throw CreateError(message: "Failed to add input device.")
        }
        // 注意：添加输入源必须放在会话配置前，否则在更新画面旋转方向时有黑屏闪烁
        self.captureSession.addInput(currentInput)
        
        // 相机配置
        try self.withLockedConfiguration(on: device) {
            device.activeFormat = format
            if device.isWhiteBalanceModeSupported( .continuousAutoWhiteBalance) {
                device.whiteBalanceMode = .continuousAutoWhiteBalance
            }
            if device.isLowLightBoostSupported {
                device.automaticallyEnablesLowLightBoostWhenAvailable = false
            }
        }

        self.captureDevice  = device
        self.videoInput     = currentInput
    }

    /// 获取当前相机的格式信息
    func getFormatInfo() -> CameraFormat? {
        return captureDevice?.currentFormatDescription()
    }

    /// 开始捕获
    func startCapture(setting: CameraConfiguration, completion: @escaping (Error?) -> Void) {
        sessionQueue.async { [weak self] in
            guard let self = self else {
                completion(CreateError(message: "Failed to start capture session."))
                return
            }
            do {
                /*
                注意：
                - 在切换相机前，需要先停止会话，否则会导致画面闪烁（画面方向不一致）
                - 切换后需要重新启动会话
                */
                if self.captureSession.isRunning {
                    self.captureSession.stopRunning()
                }

                try self.setupSessionOutput()
                try self.switchDevice(setting: setting)
                try self.settingDevice(setting: setting)
                self.settingSample(setting: setting)

                if !self.captureSession.isRunning {
                    self.captureSession.startRunning()
                }
                self.logger.debug("开始捕获")
                completion(nil)
            } catch {
                self.logger.error("开始捕获失败: \(error.localizedDescription)")
                completion(error)
            }
            
        }
    }

    /// 停止捕获
    func stopCapture() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            if self.captureSession.isRunning {
                self.captureSession.stopRunning()
            }
            self.logger.debug("停止捕获")
        }
    }

    /// 更新相机配置
    func updateConfiguration(setting: CameraConfiguration) {
        let needsConfigDevice = setting.fps != nil || setting.focus != nil || setting.zoom != nil || setting.exposure != nil
        if needsConfigDevice {
            sessionQueue.async { [weak self] in
                guard let self = self else { return }
                do {
                    try self.settingDevice(setting: setting)
                } catch {
                    self.logger.error("更新相机配置失败: \(error.localizedDescription)")
                }
            }
        }
        let needsConfigSample = setting.brightness != nil || setting.orientation != nil
        if needsConfigSample {
            self.settingSample(setting: setting)
        }
    }    
}


// MARK: - 接收采样
extension CameraController: AVCaptureVideoDataOutputSampleBufferDelegate {
    
    /// 捕获输出
    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        autoreleasepool {
            guard var videoFrame = VideoFrame.from(sampleBuffer: sampleBuffer) else { return }
            // 画面方向
            videoFrame.orientation = connection.videoOrientation
            // 相机位置
            if let port = connection.inputPorts.first, let deviceInput = port.input as? AVCaptureDeviceInput {
                videoFrame.positon = deviceInput.device.position
            }
            videoFrame.applyBrightness(factor: brightness)
            // 分发
            VideoFrameHub.publish(videoFrame)
        }
    }
}
