import AVFoundation
import Foundation
import VideoToolbox
import React
import MetalKit

@objc(CameraView)
class CameraView: BaseMetalView {
    
    // MARK: - 属性
    
    // 预览
    @objc var preview = true
    
    // 相机格式筛选
    @objc var filter: NSDictionary = [ "position": "back", "width": 1920, "height": 1080, "maxFps": 60 ]
    
    // 当前帧率
    @objc var fps: NSNumber = 30.0
    
    // 画面缩放
    @objc var zoom: NSNumber = 1.0
    
    // 对焦
    @objc var focus: NSNumber = 0.0
    
    // 曝光度
    @objc var exposure: NSNumber = 0.5
    
    // 亮度
    @objc var brightness: NSNumber = 1.0
    
    // 画面方向
    @objc var orientation: String = "up"
    
    // 初始化完成回调
    @objc var onInitialized: RCTDirectEventBlock?
    
    // 切换相机回调
    @objc var onChangeDevice: RCTDirectEventBlock?
    
    // 是否已初始化
    private var isInitialized = false
    
    // 相机设置队列
    private let cameraQueue = DispatchQueue( label: "RTCView.CameraQueue", qos: .userInteractive )
    
    // 视频方向
    private var videoOrientation: AVCaptureVideoOrientation {
        switch (orientation) {
            case "up": return .portrait
            case "down": return .portraitUpsideDown
            case "left": return .landscapeLeft
            case "right": return .landscapeRight
            default: return .portrait
        }
    }
    
    // 相机筛选
    private var filterFormat: FilterFormat {
        return FilterFormat(
            position: filter["position"] as? String ?? "back",
            width: filter["width"] as? Int32 ?? 1920,
            height: filter["height"] as? Int32 ?? 1080,
            maxFps: filter["maxFps"] as? Int32 ?? 60,
        )
    }
    
    // 监听属性变化
    override func didSetProps(_ changedProps: [String]!) {
        cameraQueue.async { [weak self] in
            guard let self = self else { return }
            
            if self.isInitialized == false || changedProps.contains("filter") {
                self.initDevice()
                return
            }
            
            let camera = CameraManager.shared
            
            // 动态修改硬件参数
            var fps: Int32? = nil
            var zoom: Float? = nil
            var focus: Float? = nil
            var exposure: Double? = nil
            
            if changedProps.contains("fps") {
                fps = self.fps.int32Value
            }
            
            if changedProps.contains("zoom") {
                zoom = self.zoom.floatValue
            }
            
            if changedProps.contains("focus") {
                focus = self.focus.floatValue
            }
            
            if changedProps.contains("exposure") {
                exposure = self.exposure.doubleValue
            }
            
            // 更新硬件参数
            if fps != nil || zoom != nil || focus != nil || exposure != nil  {
                camera.updateConfiguration(
                    fps: fps,
                    zoom: zoom,
                    focus: focus,
                    exposure: exposure
                )
            }
            
            // 如果方向被修改
            if changedProps.contains("orientation") {
                camera.setVideoOrientation(self.videoOrientation)
            }
            
            // 设置亮度
            if changedProps.contains("brightness") {
                let brightness = Helper.valueInRange( value: self.brightness.floatValue, minValue: 1, maxValue: 3.0 )
                camera.setBrightness(brightness)
            }
            
        }
    }
    
    // MARK: - 初始化
    required init(coder: NSCoder) {
        super.init(coder: coder)
    }
    
    override init(frame: CGRect, device: MTLDevice?) {
        super.init(frame: frame, device: device)
        CameraManager.shared.addDelegate(self)
    }
    
    // 初始化相机
    private func initDevice() {
        cameraQueue.async { [weak self] in
            guard let self = self else { return }
            
            let camera = CameraManager.shared
            camera.stopCapture()
            
            guard let device =  camera.setupDevice(filterFormat: filterFormat) else {
                return
            }
            
            camera.updateConfiguration(
                fps: self.fps.int32Value,
                zoom: self.zoom.floatValue,
                focus: self.focus.floatValue,
                exposure: self.exposure.doubleValue
            )
            
            if self.isInitialized == false {
                self.isInitialized = true
                
                DispatchQueue.main.async { [weak self] in
                    self?.onInitialized?([:])
                }
            }
            
            DispatchQueue.main.async { [weak self] in
                let format = device.currentFormatDescription()
                self?.onChangeDevice?(format.toDictionary())
            }
            
            camera.setVideoOrientation(self.videoOrientation)
            camera.startCapture()
        }
    }

    // MARK: - 视图销毁
    override func willMove(toSuperview newSuperview: UIView?) {
        if newSuperview == nil {
            cameraQueue.async {
                CameraManager.shared.removeDelegate(self)
                CameraManager.shared.stopCapture()
            }
        }
    }
}

// MARK: - 接收画面
extension CameraView: CameraVideoFrameDelegate {
    func onVideoFrame(_ videoFrame: VideoFrame) {
        if self.preview {
            self.render(videoFrame: videoFrame)
        }
    }
}
