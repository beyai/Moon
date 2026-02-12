
import AVFoundation
import Foundation
import Accelerate

class Resizer {
    
    // MARK: - 配置
    private let size: CGSize
    private let targetWidth: Int
    private let targetHeight: Int
    private let pixelFormat: OSType = kCVPixelFormatType_32BGRA
    private let poolSize: Int = 3 // 增加池大小以避免阻塞
    private var outputPool: CVPixelBufferPool?
    
    // 填充用的一行数据（按像素 BGRA）
    private let fillColorPixel: [UInt8] // [B,G,R,A]
    private var fillLine: UnsafeMutableRawPointer? = nil
    private var fillLineBytes: Int = 0
    
    // vImage 临时 buffer（按需分配并复用）
    private var scaleTempBuffer: UnsafeMutableRawPointer? = nil
    private var scaleTempBufferSize: Int = 0
    
    // 紧凑临时 buffer（用于把缩放结果放到紧凑行再 memcpy 回大 stride）
    private var compactTempBuffer: UnsafeMutableRawPointer? = nil
    private var compactTempBufferSize: Int = 0
    private var compactTempRowBytes: Int = 0
    private var compactTempWidth: Int = 0
    private var compactTempHeight: Int = 0
    
    // MARK: - 初始化
    init?(size: CGSize, fill: UInt8 = 114) {
        self.size = size
        self.targetWidth = Int(size.width)
        self.targetHeight = Int(size.height)
        // BGRA 顺序（kCVPixelFormatType_32BGRA）
        self.fillColorPixel = [fill, fill, fill, 255]
        
        if createPixelBufferPool() != kCVReturnSuccess {
            return nil
        }
        
        // 预构建一行填充数据（按像素）
        self.fillLineBytes = targetWidth * 4
        self.fillLine = malloc(self.fillLineBytes)
        if let fillLine = self.fillLine {
            let ptr = fillLine.bindMemory(to: UInt8.self, capacity: self.fillLineBytes)
            // 构造一行像素（BGRA）
            for i in 0..<targetWidth {
                ptr[i*4 + 0] = fillColorPixel[0] // B
                ptr[i*4 + 1] = fillColorPixel[1] // G
                ptr[i*4 + 2] = fillColorPixel[2] // R
                ptr[i*4 + 3] = fillColorPixel[3] // A
            }
        }
    }
    
    deinit {
        if let ptr = scaleTempBuffer { free(ptr) }
        if let ptr = compactTempBuffer { free(ptr) }
        if let ptr = fillLine { free(ptr) }
        outputPool = nil
    }
    
    // MARK: - PixelBuffer Pool
    private func createPixelBufferPool() -> CVReturn {
        let poolAttrs: [String: Any] = [
            kCVPixelBufferPoolMinimumBufferCountKey as String: poolSize
        ]
        
        let pixelBufAttrs: [String: Any] = [
            kCVPixelBufferPixelFormatTypeKey as String: pixelFormat,
            kCVPixelBufferWidthKey as String: targetWidth,
            kCVPixelBufferHeightKey as String: targetHeight,
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:]
        ]
        
        return CVPixelBufferPoolCreate(
            kCFAllocatorDefault,
            poolAttrs as CFDictionary,
            pixelBufAttrs as CFDictionary,
            &outputPool
        )
    }
    
    private func createPixelBufferFromPool() -> CVPixelBuffer? {
        if let pool = outputPool {
            var buffer: CVPixelBuffer?
            let status = CVPixelBufferPoolCreatePixelBuffer(nil, pool, &buffer)
            if status == kCVReturnSuccess {
                return buffer
            } else {
                // 尝试直接创建（兜底）
                var pb: CVPixelBuffer?
                let attrs: [String: Any] = [
                    kCVPixelBufferPixelFormatTypeKey as String: pixelFormat,
                    kCVPixelBufferWidthKey as String: targetWidth,
                    kCVPixelBufferHeightKey as String: targetHeight,
                    kCVPixelBufferMetalCompatibilityKey as String: true,
                    kCVPixelBufferIOSurfacePropertiesKey as String: [:]
                ]
                let ret = CVPixelBufferCreate(kCFAllocatorDefault, targetWidth, targetHeight, pixelFormat, attrs as CFDictionary, &pb)
                if ret == kCVReturnSuccess {
                    return pb
                } else {
                    return nil
                }
            }
        }
        return nil
    }
    
    // MARK: - 主功能：缩放
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
        
        let srcWidth = CVPixelBufferGetWidth(videoFrame.pixelBuffer)
        let srcHeight = CVPixelBufferGetHeight(videoFrame.pixelBuffer)
        let srcRowBytes = CVPixelBufferGetBytesPerRow(videoFrame.pixelBuffer)
        let destRowBytes = CVPixelBufferGetBytesPerRow(destPixelBuffer)
        
        // 准备 vImage srcBuffer（注意：假设 src 是 BGRA）
        var srcBuffer = vImage_Buffer(
            data: srcBaseAddress,
            height: vImagePixelCount(srcHeight),
            width: vImagePixelCount(srcWidth),
            rowBytes: srcRowBytes
        )
        
        // 先用按行 memcpy 填充背景（比 vImageFill 快）
        if let fillLine = self.fillLine {
            let dstPtr = destBaseAddress.bindMemory(to: UInt8.self, capacity: destRowBytes * targetHeight)
            for y in 0..<targetHeight {
                let rowPtr = dstPtr.advanced(by: y * destRowBytes)
                memcpy(rowPtr, fillLine, fillLineBytes)
            }
        } else {
            // 兜底：如果 fillLine 为 nil，使用 memset（会使 alpha 也变）
            memset(destBaseAddress, Int32(fillColorPixel[0]), destRowBytes * targetHeight)
        }
        
        // 计算缩放目标尺寸（等比缩放并居中）
        let scale = min(Float(targetWidth) / Float(srcWidth), Float(targetHeight) / Float(srcHeight))
        let scaledWidth = Int(round(Float(srcWidth) * scale))
        let scaledHeight = Int(round(Float(srcHeight) * scale))
        let padX = (targetWidth - scaledWidth) / 2
        let padY = (targetHeight - scaledHeight) / 2
        
        // 如果缩放后大小为目标大小，直接在 dest 上缩放（但注意 rowBytes 可能很大）
        // 为避免在大 stride 上被 vImage 扫描过多，使用紧凑临时 buffer：先缩放到紧凑buffer，再 memcpy 回 ROI
        ensureCompactTempBuffer(width: scaledWidth, height: scaledHeight)
        
        // 准备紧凑 dest buffer
        guard let compactPtr = compactTempBuffer else {
            return nil
        }
        var compactBuffer = vImage_Buffer(
            data: compactPtr,
            height: vImagePixelCount(compactTempHeight),
            width: vImagePixelCount(compactTempWidth),
            rowBytes: compactTempRowBytes
        )
        
        // 计算并分配 temp buffer 给 vImage（按需）
        ensureScaleTempBuffer(src: &srcBuffer, dest: &compactBuffer)
        
        // 缩放标志：避免 tile 会在小图时更快，同时允许 kvImageNoFlags 或 kvImageDoNotTile 根据情况
        let flags = vImage_Flags(kvImageDoNotTile)
        
        // 执行缩放：src -> compactTempBuffer（紧凑行）
        let scaleErr = vImageScale_ARGB8888(&srcBuffer, &compactBuffer, scaleTempBuffer, flags)
        guard scaleErr == kvImageNoError else {
            // 缩放失败（返回 nil）
            return nil
        }
        
        // 将紧凑 buffer 拷贝回 dest 的 ROI（按行 memcpy）
        let destBase = destBaseAddress.bindMemory(to: UInt8.self, capacity: destRowBytes * targetHeight)
        let srcCompactBase = compactPtr.bindMemory(to: UInt8.self, capacity: compactTempRowBytes * compactTempHeight)
        
        for row in 0..<scaledHeight {
            let destRowPtr = destBase.advanced(by: (padY + row) * destRowBytes + padX * 4)
            let srcRowPtr = srcCompactBase.advanced(by: row * compactTempRowBytes)
            memcpy(destRowPtr, srcRowPtr, compactTempRowBytes)
        }
        
        // 返回 VideoFrame，使用 destPixelBuffer
        return VideoFrame(
            width: targetWidth,
            height: targetHeight,
            timestamp: videoFrame.timestamp,
            pixelBuffer: destPixelBuffer
        )
    }
    
    // MARK: - Helpers: compact temp buffer（按需分配/扩展）
    private func ensureCompactTempBuffer(width: Int, height: Int) {
        // 如果已分配且尺寸足够则直接返回
        if let _ = compactTempBuffer,
           width <= compactTempWidth,
           height <= compactTempHeight {
            return
        }
        // 释放旧的
        if let ptr = compactTempBuffer {
            free(ptr)
            compactTempBuffer = nil
            compactTempBufferSize = 0
        }
        // 按紧凑行计算 rowBytes（宽度 * 4）
        let rowBytes = width * 4
        let bufSize = rowBytes * height
        compactTempBuffer = malloc(bufSize)
        compactTempBufferSize = bufSize
        compactTempRowBytes = rowBytes
        compactTempWidth = width
        compactTempHeight = height
    }
    
    // MARK: - Helpers: scale temp buffer（vImage 的 temp buffer）
    private func ensureScaleTempBuffer(src: inout vImage_Buffer, dest: inout vImage_Buffer) {
        // 如果已分配且大小足够，直接返回
        if let _ = scaleTempBuffer, scaleTempBufferSize > 0 {
            return
        }
        // 请求需要的 temp 大小：通过 vImageScale_ARGB8888 询问
        let needed = vImageScale_ARGB8888(&src, &dest, nil, vImage_Flags(kvImageGetTempBufferSize))
        if needed > 0 {
            scaleTempBuffer = malloc(needed)
            scaleTempBufferSize = needed
        } else {
            // 如果返回 0（极少见），尝试使用一个保守的 size（紧凑 buffer 大小）
            let fallback = max(dest.rowBytes * Int(dest.height) / 8, 1024)
            scaleTempBuffer = malloc(fallback)
            scaleTempBufferSize = fallback
        }
    }
}
