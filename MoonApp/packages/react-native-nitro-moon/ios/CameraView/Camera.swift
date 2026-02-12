import Foundation
import UIKit
import AVFoundation
import NitroModules


final class Camera : HybridCameraSpec {
    
    // MARK: - 私有属性
    /// 相机控制
    private let controller = CameraController.shared
    /// 是否已初始化
    private var isInitialized = false
    /// 更新的属性
    private var changedProps: [String] = []
    /// 访问锁
    private let accessLock = UnfairLock()
    /// 渲染视图
    private var mtkView = CameraView()
    /// 切换相机工作项
    private var pendingSwitchWorkItem: DispatchWorkItem?
    /// 切换相机延迟时间
    private let switchDelay: TimeInterval = 0.2
    /// 日志
    private var logger = MLogger("Camera")

    // MARK: - 初始化
    var view: UIView { mtkView }
    
    // MARK: - 属性
    
    /// 是否激活
    var isActive: Bool = false {
        didSet {
            if isActive != true { return }
            changedProps.append("isActive")
        }
    }
    
    /// 相机格式筛选
    var filter: CameraFilter = CameraFilter( width: 1920.0, height: 1080.0, maxFps: 30.0, position: .back ) {
        didSet {
            guard filter != oldValue else { return }
            changedProps.append("filter")
        }
    }
    
    /// 当前帧率
    var fps: Double = 30.0 {
        didSet {
            guard fps != oldValue else { return }
            changedProps.append("fps")
        }
    }
    
    /// 画面缩放
    var zoom: Double = 1.0 {
        didSet {
            guard zoom != oldValue else { return }
            changedProps.append("zoom")
        }
    }
    
    /// 对焦
    var focus: Double = 0.35 {
        didSet {
            guard focus != oldValue else { return }
            changedProps.append("focus")
        }
    }
    
    /// 曝光度
    var exposure: Double = 1.0 {
        didSet {
            guard exposure != oldValue else { return }
            changedProps.append("exposure")
        }
    }
    
    /// 亮度
    var brightness: Double = 1.0 {
        didSet {
            guard brightness != oldValue else { return }
            changedProps.append("brightness")
        }
    }
    
    /// 画面方向
    var orientation: CameraOrientation = .up {
        didSet {
            guard orientation != oldValue else { return }
            changedProps.append("orientation")
        }
    }
    
    /// 预览
    var preview: Bool = false {
        didSet {
            guard preview != oldValue else { return }
            mtkView.setPreview(preview)
        }
    }
    
    /// 初始化完成回调
    var onInitialized: (() -> Void)?
    
    /// 切换相机回调
    var onChangeDevice: ((_ format: CameraFormat) -> Void)?
        
    // MARK: - 方法

    /// 初始化设备
    private func initialize() {
        let setting = CameraConfiguration(
            filter      : self.filter,
            fps         : self.fps,
            zoom        : self.zoom,
            focus       : self.focus,
            exposure    : self.exposure,
            brightness  : self.brightness,
            orientation : self.orientation.videoOrientation
        )
        
        controller.startCapture(setting: setting) { [weak self] error in
            guard let self = self else { return }
            if let error = error {
                self.logger.error(error.localizedDescription)
                return
            }
            MainThreadRun.async {
                if !self.isInitialized {
                    self.isInitialized = true
                    self.onInitialized?()
                }
                guard let onChangeDevice = self.onChangeDevice, let format = self.controller.getFormatInfo() else { return }
                onChangeDevice(format)
            }
        }
            
    }

    /// 调度初始化
    private func scheduleInitialize() {
        // 取消之前的切换相机工作项
        pendingSwitchWorkItem?.cancel()
        // 创建新的切换相机工作项
        let workItem = DispatchWorkItem { [weak self] in
            self?.initialize()
        }
        // 保存新的切换相机工作项
        pendingSwitchWorkItem = workItem
        // 延迟执行
        DispatchQueue.main.asyncAfter(deadline: .now() + switchDelay, execute: workItem)
    }
    
    /// 属性更新
    func afterUpdate() {
        guard isActive, !changedProps.isEmpty else { return }

        let props = changedProps
        changedProps.removeAll()

        // 激活/切换相机: 重新初始化
        if props.contains("isActive") || props.contains("filter") {
            scheduleInitialize()
            return;
        }
        
        // 已初始: 仅更新参数
        guard isInitialized else { return }

        let fpsValue            = props.contains("fps")         ? self.fps          : nil
        let zoomValue           = props.contains("zoom")        ? self.zoom         : nil
        let focusValue          = props.contains("focus")       ? self.focus        : nil
        let exposureValue       = props.contains("exposure")    ? self.exposure     : nil
        let brightnessValue     = props.contains("brightness")  ? self.brightness   : nil
        let orientationValue    = props.contains("orientation") ? self.orientation.videoOrientation  : nil
        
        let setting = CameraConfiguration(
            filter      : nil,
            fps         : fpsValue,
            zoom        : zoomValue,
            focus       : focusValue,
            exposure    : exposureValue,
            brightness  : brightnessValue,
            orientation : orientationValue
        )
        
        controller.updateConfiguration(setting: setting)
    }
    
    // MARK: - 释放资源
    
    func dispose() {
        isActive        = false
        isInitialized   = false
        preview         = false
        controller.stopCapture()
    }
    
    deinit {
        dispose()
    }
    
}
