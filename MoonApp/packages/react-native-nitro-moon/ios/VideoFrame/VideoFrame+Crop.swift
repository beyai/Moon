import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {
    
    /// 裁剪图片指定区域
    func crop(to rect: CGRect) -> VideoFrame? {
        let validRect = rect.intersection(CGRect(x: 0, y: 0, width: width, height: height))
        guard validRect.width > 0, validRect.height > 0 else { return nil }


        let outputWidth = Int(validRect.width)
        let outputHeight = Int(validRect.height)
        
        guard let destPixelBuffer = VideoFrame.createTargetPixelBuffer(
            width: outputWidth,
            height: outputHeight,
            pixelFormat: pixelFormat
        ) else {
            return nil
        }

        // 锁定内存
        CVPixelBufferLockBaseAddress(self.pixelBuffer, .readOnly)
        CVPixelBufferLockBaseAddress(destPixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(self.pixelBuffer, .readOnly)
            CVPixelBufferUnlockBaseAddress(destPixelBuffer, [])
        }
        
        let srcBuffer = vImage_Buffer(
            data: CVPixelBufferGetBaseAddress(pixelBuffer),
            height: vImagePixelCount(height),
            width: vImagePixelCount(width),
            rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer)
        )

        var destBuffer = vImage_Buffer(
            data: CVPixelBufferGetBaseAddress(destPixelBuffer),
            height: vImagePixelCount(outputHeight),
            width: vImagePixelCount(outputWidth),
            rowBytes: CVPixelBufferGetBytesPerRow(destPixelBuffer)
        )
        
        // 计算偏移
        let bytesPerPixel = 4
        let startX = Int(validRect.origin.x)
        let startY = Int(validRect.origin.y)

        // 计算源起点指针
        let srcRowBytes = srcBuffer.rowBytes
        let offset = startY * srcRowBytes + startX * bytesPerPixel

        guard let srcStart = srcBuffer.data?.advanced(by: offset) else { return nil }

        // 裁剪区域缓冲
        var cropRegion = vImage_Buffer(
            data: srcStart,
            height: vImagePixelCount(outputHeight),
            width: vImagePixelCount(outputWidth),
            rowBytes: srcRowBytes
        )

        // 拷贝数据
        let error = vImageCopyBuffer(
            &cropRegion,
            &destBuffer,
            bytesPerPixel,
            vImage_Flags(kvImageNoFlags)
        )

        guard error == kvImageNoError else {
            return nil
        }

        return VideoFrame(
            width: outputWidth,
            height: outputHeight,
            timestamp: timestamp,
            pixelBuffer: destPixelBuffer
        )
    }
}
