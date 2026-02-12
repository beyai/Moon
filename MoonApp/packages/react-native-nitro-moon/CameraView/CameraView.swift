import Foundation
import UIKit
import AVFoundation
import NitroModules


extension CameraFilterFormat: Equatable {
    public static func == (lhs: CameraFilterFormat, rhs: CameraFilterFormat) -> Bool {
        return lhs.width == rhs.width &&
               lhs.height == rhs.height &&
               lhs.maxFps == rhs.maxFps &&
               lhs.position == rhs.position
    }
}


final class CameraView : HybridCameraViewSpec {
    
    var view: UIView { mtkView }
    
    private var mtkView: CameraMTKView
    
    private var controller: CameraController!
    
    // 更新的属性
    private var changedProps: [String] = []
    
    // 是否已初始化
    private var isInitialized = false
    
    // 是否初始化中
    private var isInitializing = false
    
    // 相机设置队列
    private let cameraQueue = DispatchQueue( label: "RTCView.CameraQueue", qos: .userInteractive )
    
    override init() {
        mtkView = CameraMTKView()
        super.init()
        self.controller = CameraController.shared
    }
    
    
    // MARK: - 属性
    
    // 是否激活
    var isActive: Bool? = false {
        didSet {
            if isActive == true {
                changedProps.append("isActive")
            }
        }
    }
    
    // 相机格式筛选
    var filter: CameraFilterFormat? = CameraFilterFormat( width: 1920.0, height: 1080.0, maxFps: 30.0, position: .back ) {
        didSet {
            if filter != oldValue {
                changedProps.append("filter")
            }
        }
    }
    
    // 预览
    var preview: Bool? = false {
        didSet {
            preview == true ? mtkView.setPreview(true) : mtkView.setPreview(false)
        }
    }
    
    // 当前帧率
    var fps: Double? = 30.0 {
        didSet {
            if fps != oldValue {
                changedProps.append("fps")
            }
        }
    }
    
    // 画面缩放
    var zoom: Double? = 1.0 {
        didSet {
            if zoom != oldValue {
                changedProps.append("zoom")
            }
        }
    }
    
    // 对焦
    var focus: Double? = 0.0 {
        didSet {
            if focus != oldValue {
                changedProps.append("focus")
            }
        }
    }
    
    // 曝光度
    var exposure: Double? = 1.0 {
        didSet {
            if exposure != oldValue {
                changedProps.append("exposure")
            }
        }
    }
    
    // 亮度
    var brightness: Double? = 1.0 {
        didSet {
            if brightness != oldValue, let value = brightness {
                controller.setBrightness(brightness: value)
            }
        }
    }
    
    // 画面方向
    var orientation: CameraOrientation? = .up {
        didSet {
            if orientation != oldValue {
                controller.setOrientation(orientation: videoOrientation)
            }
        }
    }
    
    // 初始化完成回调
    var onInitialized: (() -> Void)?
    
    // 切换相机回调
    var onChangeDevice: ((_ format: CameraFormat) -> Void)?
    
    // 视频方向
    private var videoOrientation: AVCaptureVideoOrientation {
        switch (orientation) {
        case .up:
            return .portrait
        case .down:
            return .portraitUpsideDown
        case .left:
            return .landscapeLeft
        case .right:
            return .landscapeRight
        default:
            return .portrait
        }
    }
    
    // 初始化设备
    private func initialize() {
        cameraQueue.async { [weak self] in
            guard let self = self, !self.isInitializing else { return }
            
            self.isInitializing = true
            defer {
                self.isInitializing = false
            }
            
            guard let filterFormat = self.filter else { return }
            
            // 安装设备
            guard self.controller.setupDevice( filterFormat: filterFormat ) else { return }
            
            // 设置视频输出方向
            self.controller.setOrientation(orientation: self.videoOrientation)
            
            // 应用设置
            self.controller.updateConfiguration(
                fps         : self.fps,
                zoom        : self.zoom,
                focus       : self.focus,
                exposure    : self.exposure
            )
            
            // 开始捕获
            self.controller.start()
            
            // 回调: 初始化
            if !self.isInitialized {
                self.isInitialized = true
                self.onInitialized?()
            }
            
            // 回调: 发送当前相机格式
            guard let onChangeDevice = self.onChangeDevice, let format = self.controller.getFormatInfo() else { return }
            onChangeDevice(format)
        }
    }
    
    // 属性更新
    func afterUpdate() {
        defer { changedProps = [] }
        guard isActive == true, !changedProps.isEmpty else { return }
        
        // 激活时与切换相机时重新初始化设备
        if changedProps.contains("isActive") || changedProps.contains("filter") {
            initialize()
            return;
        }
        
        // 已初始化执行更新配置
        guard isInitialized else { return }
        
        let fps      = changedProps.contains("fps")      ? self.fps      : nil
        let zoom     = changedProps.contains("zoom")     ? self.zoom     : nil
        let focus    = changedProps.contains("focus")    ? self.focus    : nil
        let exposure = changedProps.contains("exposure") ? self.exposure : nil
        
        cameraQueue.async { [weak self] in
            guard let self = self else { return }
            guard fps != nil || zoom != nil || focus != nil || exposure != nil else {
                return
            }
            self.controller.updateConfiguration(
                fps     : fps,
                zoom    : zoom,
                focus   : focus,
                exposure: exposure
            )
        }
    }
    
    // MARK: - 释放
    
    // 释放
    func release() {
        
        cameraQueue.async { [weak self] in
            guard let self = self else { return }
            self.controller.stop()
            self.isInitialized = false
        }
        
        MainThreadRun.async { [weak self] in
            self?.preview = false
            self?.isActive = false
        }
    }
    
    
    deinit {
        mtkView.removeFromSuperview()
        release()
    }
    
    
}
