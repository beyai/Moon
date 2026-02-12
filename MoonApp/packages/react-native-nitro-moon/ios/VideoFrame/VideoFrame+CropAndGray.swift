import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {
    
    /// 裁剪并转换为灰度
    func cropAndGray(to rect: CGRect) -> VideoFrame? {
        
        let validRect = rect.intersection(CGRect(x: 0, y: 0, width: width, height: height))
        guard validRect.width > 0, validRect.height > 0 else { return nil }

        let outputWidth     = Int(validRect.width)
        let outputHeight    = Int(validRect.height)
        let bytesPerPixel   = 4  // 原始 BGRA
        
        // 创建目标灰度缓冲区
        guard let grayPixelBuffer = VideoFrame.createTargetPixelBuffer(
            width: outputWidth,
            height: outputHeight,
            pixelFormat: kCVPixelFormatType_OneComponent8
        ) else { return nil }
        
        // 锁定源和目标缓冲区
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        CVPixelBufferLockBaseAddress(grayPixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
            CVPixelBufferUnlockBaseAddress(grayPixelBuffer, [])
        }
        
        guard let srcBase   = CVPixelBufferGetBaseAddress(pixelBuffer),
              let grayBase  = CVPixelBufferGetBaseAddress(grayPixelBuffer)
        else { return nil }

        let srcRowBytes = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let startX      = Int(validRect.origin.x)
        let startY      = Int(validRect.origin.y)
        let offset      = startY * srcRowBytes + startX * bytesPerPixel
        
        let srcStart    = srcBase.advanced(by: offset)
        
        // vImage 源缓冲区
        var srcBuffer = vImage_Buffer(
            data        : srcStart,
            height      : vImagePixelCount(outputHeight),
            width       : vImagePixelCount(outputWidth),
            rowBytes    : srcRowBytes
        )
        
        // vImage 目标灰度缓冲区
        var grayBuffer = vImage_Buffer(
            data        : grayBase,
            height      : vImagePixelCount(outputHeight),
            width       : vImagePixelCount(outputWidth),
            rowBytes    : CVPixelBufferGetBytesPerRow(grayPixelBuffer)
        )
        
        // BGRA 转灰度，Rec. 601 权重
        var bgrToLumaMatrix: [Int16] = [77, 150, 29, 0]
        let divisor: Int32 = 256
        
        let error = vImageMatrixMultiply_ARGB8888ToPlanar8(
            &srcBuffer,
            &grayBuffer,
            &bgrToLumaMatrix,
            divisor,
            nil,
            0,
            vImage_Flags(kvImageNoFlags)
        )
        
        guard error == kvImageNoError else { return nil }
        
        return VideoFrame(
            width: outputWidth,
            height: outputHeight,
            timestamp: timestamp,
            pixelBuffer: grayPixelBuffer,
            pixelFormat: kCVPixelFormatType_OneComponent8
        )
    }
}
