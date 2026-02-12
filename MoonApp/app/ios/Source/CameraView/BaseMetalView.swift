import Foundation
import AVFoundation
import CoreMedia
import MetalKit

private struct VertexUniforms {
    var orientation: Int32
    var isFrontCamera: Bool
}

class BaseMetalView: MTKView {
    // 命令队列
    private var commandQueue: MTLCommandQueue?
    // 管道状态
    private var pipelineState: MTLRenderPipelineState?
    // 纹理缓存
    private var textureCache: CVMetalTextureCache?
    // 帧数据访问锁
    private let accessLock = NSLock()
    // 视频帧
    private var videoFrame: VideoFrame?
    
    override init(frame: CGRect, device: MTLDevice?) {
        super.init(frame: frame, device: device ?? MTLCreateSystemDefaultDevice())
        commonInit()
    }
    
    required init(coder: NSCoder) {
        super.init(coder: coder)
        device = MTLCreateSystemDefaultDevice()
        commonInit()
    }
    
    
    
    // 初始化命令
    private func commonInit() {
        
        guard let device = device else {
            fatalError("Metal设备初始化失败")
        }
        
        self.colorPixelFormat           = .bgra8Unorm
        self.framebufferOnly            = true
        self.delegate                   = self
        
        self.isPaused                   = false
        self.enableSetNeedsDisplay      = false
        self.preferredFramesPerSecond   = 30
        
        self.autoresizingMask           = [.flexibleWidth, .flexibleHeight]
        self.clearColor                 = MTLClearColor(red: 0, green: 0, blue: 0, alpha: 1)
        
        var textureCache: CVMetalTextureCache?
        if CVMetalTextureCacheCreate(kCFAllocatorDefault, nil,device, nil, &textureCache) != kCVReturnSuccess {
            fatalError("Metal纹理缓存创建失败")
        }
        
        self.textureCache = textureCache
        commandQueue = device.makeCommandQueue()
        setupRenderPipeline()
    }
    
    // 设置渲染管道
    private func setupRenderPipeline() {
        
        guard let device = device,
              let library = device.makeDefaultLibrary(),
              let vertexFunc = library.makeFunction(name: "vertexShaderWithRotation"),
              let fragmentFunc = library.makeFunction(name: "fragmentShaderPassthrough")
        else {
            fatalError("无法加载着色器库或显示着色器函数")
        }
        
        let pipelineDesc = MTLRenderPipelineDescriptor()
        pipelineDesc.vertexFunction = vertexFunc
        pipelineDesc.fragmentFunction = fragmentFunc
        pipelineDesc.colorAttachments[0].pixelFormat = self.colorPixelFormat
        
        do {
            pipelineState = try device.makeRenderPipelineState(descriptor: pipelineDesc)
        } catch {
            fatalError("创建显示渲染管道失败: \(error)")
        }
    }
    
    // 创建纹理
    private func makeTexture(from pixelBuffer: CVPixelBuffer) -> MTLTexture? {
        guard let textureCache = textureCache else { return nil }
        
        let width       = CVPixelBufferGetWidth(pixelBuffer)
        let height      = CVPixelBufferGetHeight(pixelBuffer)
        
        guard CVPixelBufferGetPixelFormatType(pixelBuffer) == kCVPixelFormatType_32BGRA else {
            return nil
        }
        
        var cvTexture: CVMetalTexture?
        let result = CVMetalTextureCacheCreateTextureFromImage(
            kCFAllocatorDefault,
            textureCache,
            pixelBuffer,
            nil,
            self.colorPixelFormat,
            width,
            height,
            0,
            &cvTexture
        )
        
        guard result == kCVReturnSuccess, let unwrapped = cvTexture else {
            return nil
        }
        
        return CVMetalTextureGetTexture(unwrapped)
    }
    
    // 获取视频方向
    private func getMetalOrientation(_ orientation: AVCaptureVideoOrientation) -> Int32 {
        switch orientation {
            case .portraitUpsideDown: return 1
            case .landscapeRight: return 2
            case .landscapeLeft: return 3
            default: return 0
        }
    }
        
    // 释放资源
    deinit {
        self.isPaused = true
        self.delegate = nil
        accessLock.lock()
        videoFrame = nil
        accessLock.unlock()
        
        commandQueue = nil
        pipelineState = nil
        
        if let cache = textureCache {
            CVMetalTextureCacheFlush(cache, 0)
            textureCache = nil
        }
    }
    
}

extension BaseMetalView: MTKViewDelegate {
    
    func mtkView(_ view: MTKView, drawableSizeWillChange size: CGSize) {
    }
    
    // 渲染画面
    func render(videoFrame: VideoFrame) {
        accessLock.lock()
        self.videoFrame = videoFrame
        accessLock.unlock()
    }

    /// 绘制画面
    func draw(in view: MTKView) {
        accessLock.lock()
        guard let videoFrame = videoFrame else {
            accessLock.unlock()
            return
        }
        accessLock.unlock()
        
        guard let inputTexture = self.makeTexture(from: videoFrame.pixelBuffer) else {
            return
        }
        
        guard let commandQueue      = self.commandQueue,
              let pipelineState     = self.pipelineState,
              let renderPassDesc    = view.currentRenderPassDescriptor,
              let drawable          = view.currentDrawable,
              let commandBuffer     = commandQueue.makeCommandBuffer(),
              let encoder           = commandBuffer.makeRenderCommandEncoder(descriptor: renderPassDesc)
        else {
            return
        }
        
        encoder.setRenderPipelineState(pipelineState)
        
        let metalOrientation    = getMetalOrientation(videoFrame.orientation)
        let isFrontCamera       = videoFrame.positon == .front
        var uniforms            = VertexUniforms( orientation: metalOrientation, isFrontCamera: isFrontCamera )
        
        encoder.setVertexBytes(&uniforms, length: MemoryLayout<VertexUniforms>.stride, index: 1)
        
        encoder.setFragmentTexture(inputTexture, index: 0)
        encoder.drawPrimitives(type: .triangleStrip, vertexStart: 0, vertexCount: 6)
        
        encoder.endEncoding()
        commandBuffer.present(drawable)
        commandBuffer.commit()
        
        if let textureCache = textureCache {
            CVMetalTextureCacheFlush(textureCache, 0)
        }
    }
}
