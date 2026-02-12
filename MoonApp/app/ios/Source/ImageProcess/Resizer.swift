
import AVFoundation
import Foundation
import Accelerate

class Resizer {
    
    // 画面大小
    private let size: CGSize
    // 填充颜色
    private let fillColor: [UInt8]
    // 像素格式
    private let pixelFormat: OSType = kCVPixelFormatType_32BGRA
    // 池大小
    private let poolSize: Int = 1
    // 池
    private var outputPool: CVPixelBufferPool?
    // 目标宽度
    private var targetWidth: Int {
        return Int(size.width)
    }
    // 目标高度
    private var targetHeight: Int {
        return Int(size.height)
    }
    
    // 创建池
    private func createPixelBufferPool() -> CVReturn {
        let poolAttrs: [String: Any] = [
            kCVPixelBufferPoolMinimumBufferCountKey as String: poolSize
        ]
        
        let pixelBufAttrs: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: pixelFormat,
            kCVPixelBufferWidthKey as String: targetWidth,
            kCVPixelBufferHeightKey as String: targetHeight,
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferOpenGLCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:],
        ]
        
        return CVPixelBufferPoolCreate(
            kCFAllocatorDefault,
            poolAttrs as CFDictionary,
            pixelBufAttrs as CFDictionary,
            &outputPool
        )
    }
    
    // 从池中获取内存
    private func createPixelBufferFromPool() -> CVPixelBuffer? {
        guard let pool = outputPool else { return nil }
        var buffer: CVPixelBuffer?
        CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
        return buffer
    }
    
    // 初始化
    init?(size: CGSize, fill: UInt8 = 114) {
        self.size = size
        self.fillColor = [fill, fill, fill, 255]
        if createPixelBufferPool() != kCVReturnSuccess {
            return nil
        }
    }
    
    // 缩放画面
    func resize(videoFrame: VideoFrame) -> VideoFrame? {
        
        guard let destPixelBuffer = createPixelBufferFromPool() else {
            return nil
        }
        
        // 锁定内存
        CVPixelBufferLockBaseAddress(videoFrame.pixelBuffer, .readOnly)
        CVPixelBufferLockBaseAddress(destPixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(videoFrame.pixelBuffer, .readOnly)
            CVPixelBufferUnlockBaseAddress(destPixelBuffer, [])
        }
        
        guard let srcBaseAddress = CVPixelBufferGetBaseAddress(videoFrame.pixelBuffer),
              let destBaseAddress = CVPixelBufferGetBaseAddress(destPixelBuffer)
        else {
            return nil
        }
        
        var srcBuffer = vImage_Buffer(
            data: srcBaseAddress,
            height: vImagePixelCount(videoFrame.height),
            width: vImagePixelCount(videoFrame.width),
            rowBytes: CVPixelBufferGetBytesPerRow(videoFrame.pixelBuffer)
        )
        
        var destBuffer = vImage_Buffer(
            data: destBaseAddress,
            height: vImagePixelCount(targetHeight),
            width: vImagePixelCount(targetWidth),
            rowBytes: CVPixelBufferGetBytesPerRow(destPixelBuffer)
        )
        
        // 填充背景色
        vImageBufferFill_ARGB8888(&destBuffer, fillColor, vImage_Flags(kvImageNoFlags))
        
        // 计算缩放和定位参数
        let scale = min(
            Float(targetWidth) / Float(srcBuffer.width),
            Float(targetHeight) / Float(srcBuffer.height)
        )
        
        let scaledWidth = Int(round(Float(srcBuffer.width) * scale))
        let scaledHeight = Int(round(Float(srcBuffer.height) * scale))
        let padX = (targetWidth - scaledWidth) / 2
        let padY = (targetHeight - scaledHeight) / 2
        
        // 创建指向目标区域的 vImage_Buffer
        let destRoiAddress = destBuffer.data.advanced(by: padY * destBuffer.rowBytes + padX * 4 )
        var destRoiBuffer = vImage_Buffer(
            data: destRoiAddress,
            height: vImagePixelCount(scaledHeight),
            width: vImagePixelCount(scaledWidth),
            rowBytes: destBuffer.rowBytes
        )
        
        let scaleError = vImageScale_ARGB8888(&srcBuffer, &destRoiBuffer, nil, vImage_Flags(kvImageNoFlags))
        guard scaleError == kvImageNoError else {
            return nil
        }
        
        return VideoFrame(
            width: targetWidth,
            height: targetHeight,
            timestamp: videoFrame.timestamp,
            pixelBuffer: destPixelBuffer
        )
    }
    
    
}
