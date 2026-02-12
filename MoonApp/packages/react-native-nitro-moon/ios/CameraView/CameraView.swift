import UIKit
import MetalKit
import Foundation
import AVFoundation


private struct VertexUniforms {
    var orientation     : Int32
    var isFrontCamera   : Int32
}


final class CameraView: MTKView {
    
    // MARK: - 属性
    /// 命令队列
    private var commandQueue: MTLCommandQueue?
    /// 管道状态
    private var pipelineState: MTLRenderPipelineState?
    /// 纹理缓存
    private var textureCache: CVMetalTextureCache?
    /// 帧数据访问锁
    private let accessLock = UnfairLock()
    /// 视频帧接收队列
    private let videoFrameQueue = DispatchQueue(label: "CameraView.DataQueue", qos: .default)
    /// 视频帧
    private var videoFrame: VideoFrame?
    /// 渲染帧率
    private var targetFPS: Double { 30.0 }
    
    /// 上次渲染时间戳
    private var lastRenderTime: TimeInterval = 0
    
    /// 最小持续时长
    private var minInterval: Double { 1.0 / targetFPS }
    
    // MARK: - 初始化
    override init(frame: CGRect, device: MTLDevice?) {
        let targetDevice = device ?? MTLCreateSystemDefaultDevice()
        super.init(frame: frame, device: targetDevice)
        setupMetal()
    }
    
    required init(coder: NSCoder) {
        super.init(coder: coder)
        if self.device == nil {
            self.device = MTLCreateSystemDefaultDevice()
        }
        setupMetal()
    }
    
    // MARK: - 安装
    
    /// 初始化
    private func setupMetal() {
        guard let device = device else {
            print("❌ Failed to setup metal")
            return
        }
        
        
        self.colorPixelFormat           = .bgra8Unorm
        self.framebufferOnly            = true
        self.delegate                   = self
        
        self.isPaused                   = false
        self.enableSetNeedsDisplay      = false
        self.preferredFramesPerSecond   = Int(targetFPS)
        
        self.autoresizingMask           = [.flexibleWidth, .flexibleHeight]
        self.clearColor                 = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        
        var textureCache: CVMetalTextureCache?
        if CVMetalTextureCacheCreate(kCFAllocatorDefault, nil,device, nil, &textureCache) != kCVReturnSuccess {
            print("❌ Failed to create texture cache")
        }
        
        self.textureCache = textureCache
        commandQueue = device.makeCommandQueue()
        commandQueue?.label = "CameraMTKView"
        
        setupRenderPipeline()
        receiveVideoFrame()
    }
    

    /// 设置渲染管道
    private func setupRenderPipeline() {
        guard let device = device, let library = device.makeDefaultLibrary() else {
            print("❌ Failed to compile metal library")
            return
        }
        guard let vertexFunc = library.makeFunction(name: "vertexShaderWithRotation"),
              let fragmentFunc = library.makeFunction(name: "fragmentShaderPassthrough")
        else {
            print("❌ Shader functions not found")
            return
        }
        
        let pipelineDesc = MTLRenderPipelineDescriptor()
        pipelineDesc.vertexFunction = vertexFunc
        pipelineDesc.fragmentFunction = fragmentFunc
        pipelineDesc.colorAttachments[0].pixelFormat = self.colorPixelFormat
        
        do {
            pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDesc)
        } catch {
            print("❌ Failed to create pipeline state: \(error)")
        }
    }
    
    /// 接收画面
    private func receiveVideoFrame() {
        VideoFrameHub.subscribe(self) { [weak self] videoFrame in
            guard let self = self else { return }
            
            if self.isPaused { return }
            let currentTime = CACurrentMediaTime()
            guard currentTime - self.lastRenderTime >= self.minInterval else { return }
            self.lastRenderTime = currentTime
            self.accessLock.execute {
                self.videoFrame = videoFrame
            }
        }
    }
    
    /// 创建纹理
    private func makeTexture(from videoFrame: VideoFrame) -> MTLTexture? {
        guard let textureCache = textureCache else { return nil }
        
        guard videoFrame.pixelFormat == kCVPixelFormatType_32BGRA else {
            return nil
        }
        
        var cvTexture: CVMetalTexture?
        let result = CVMetalTextureCacheCreateTextureFromImage(
            kCFAllocatorDefault,
            textureCache,
            videoFrame.pixelBuffer,
            nil,
            self.colorPixelFormat,
            videoFrame.width,
            videoFrame.height,
            0,
            &cvTexture
        )
        
        guard result == kCVReturnSuccess,
              let unwrapped = cvTexture
        else {
            return nil
        }
        
        return CVMetalTextureGetTexture(unwrapped)
    }
    
    /// 获取视频方向
    private func getMetalOrientation(_ orientation: AVCaptureVideoOrientation) -> Int32 {
        switch orientation {
        case .portraitUpsideDown:
            return 1
        case .landscapeRight:
            return 2
        case .landscapeLeft:
            return 3
        default:
            return 0
        }
    }
    
    /// 设置预览
    public func setPreview(_ preview: Bool) {
        MainThreadRun.async { [weak self] in
            guard let self = self else { return }
            if preview {
                self.isPaused = false
            } else {
                self.isPaused = true
                accessLock.execute {
                    self.videoFrame = nil
                }
                self.draw()
            }
        }
    }
    
    deinit {
        VideoFrameHub.unsubscribe(self)
        
        accessLock.execute {
            videoFrame = nil
        }
        if let cache = textureCache {
            CVMetalTextureCacheFlush(cache, 0)
        }
        textureCache = nil
        commandQueue = nil
        pipelineState = nil
    }
    
}

// MARK: - 绘制
extension CameraView: MTKViewDelegate {
    
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {}
    
    func draw(in view: MTKView) {
        
        autoreleasepool {
            var currentFrame: VideoFrame?
            accessLock.execute {
                currentFrame = self.videoFrame
            }
            
            guard let drawable          = view.currentDrawable,
                  let renderPassDesc    = view.currentRenderPassDescriptor,
                  let commandBuffer     = commandQueue?.makeCommandBuffer(),
                  let encoder           = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDesc)
            else {
                return
            }
            
            
            if let frame            = currentFrame,
               let inputTexture     = self.makeTexture(from: frame),
               let pipelineState    = self.pipelineState
            {
                encoder.setRenderPipelineState(pipelineState)
                encoder.setCullMode(.none)
                
                let metalOrientation    = getMetalOrientation(frame.orientation)
                let isFront             = frame.positon == .front ? 1 : 0
                var uniforms            = VertexUniforms( orientation: Int32(metalOrientation), isFrontCamera: Int32(isFront) )
                
                encoder.setVertexBytes(&uniforms, length: MemoryLayout<VertexUniforms>.stride, index: 1)
                encoder.setFragmentTexture(inputTexture, index: 0)
                encoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 6)
            } 
            
            encoder.endEncoding()
            commandBuffer.present(drawable)
            commandBuffer.commit()
        }
    }
}
