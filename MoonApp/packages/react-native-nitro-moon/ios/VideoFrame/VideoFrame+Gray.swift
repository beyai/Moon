import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {
    
    func toGray() -> VideoFrame? {
        let targetPixelFormat: OSType = kCVPixelFormatType_OneComponent8  // 目标：8位单通道灰度
        
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly)
        }
        
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            return nil
        }
  
        // 创建临时灰度缓冲区（目标格式：OneComponent8）
        guard let grayPixelBuffer = VideoFrame.createTargetPixelBuffer( width: width, height: height, pixelFormat: targetPixelFormat ) else {
            return nil
        }
        
        CVPixelBufferLockBaseAddress(grayPixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(grayPixelBuffer, [])
        }
        guard let grayBaseAddress = CVPixelBufferGetBaseAddress(grayPixelBuffer) else {
            return nil
        }
        
        let vImageWidth     = vImagePixelCount(width)
        let vImageHeight    = vImagePixelCount(height)

        // 封装 vImage 缓冲区
        var srcBGRABuffer = vImage_Buffer(
            data: baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer)
        )

        // 临时灰度缓冲区（8位，1通道）
        var dstGrayBuffer = vImage_Buffer(
            data: grayBaseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: CVPixelBufferGetBytesPerRow(grayPixelBuffer)
        )

        // BGRA 转换为 8位灰度（复用 Rec. 601 标准）
        var bgrToLumaMatrix: [Int16] = [29, 150, 77, 0]
        let divisor: Int32 = 256

        let convertToGrayError = vImageMatrixMultiply_ARGB8888ToPlanar8(
            &srcBGRABuffer,
            &dstGrayBuffer,
            &bgrToLumaMatrix,
            divisor,
            nil,
            0,
            vImage_Flags(kvImageNoFlags)
        )

        guard convertToGrayError == kvImageNoError else {
            print("BGRA 转灰度失败，错误码：\(convertToGrayError)")
            return nil
        }
        
        return VideoFrame(
            width: width,
            height: height,
            timestamp: timestamp,
            pixelBuffer: grayPixelBuffer,
            pixelFormat: targetPixelFormat,
        )
        
    }
}
