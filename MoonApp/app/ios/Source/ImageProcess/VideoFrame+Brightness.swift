import Accelerate
import AVFoundation

extension VideoFrame {
    
    // 缓存的查找表
    
    private static var exposureLUTCache: [UInt8]?
    private static var lastExposureFactor: Float = 1.0
    
    // 亮度
    func applyBrightness(factor: Float = 1.0) {
        guard factor > 1.0 else { return }
        
        if factor != VideoFrame.lastExposureFactor {
            VideoFrame.exposureLUTCache = (0...255).map { value -> UInt8 in
                let scaled = Float(value) * factor
                return UInt8(max(min(round(scaled), 255.0), 0.0))
            }
            VideoFrame.lastExposureFactor = factor
        }
        guard let lookupTable = Self.exposureLUTCache else {
            return
        }
        
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, []) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return }
        
        var buffer = vImage_Buffer(
            data: baseAddress,
            height: vImagePixelCount(height),
            width: vImagePixelCount(width),
            rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer)
        )

        _ = lookupTable.withUnsafeBufferPointer { ptr in
            vImageTableLookUp_ARGB8888(
                &buffer,
                &buffer,
                ptr.baseAddress,
                ptr.baseAddress,
                ptr.baseAddress,
                nil,
                vImage_Flags(kvImageNoFlags)
            )
        }
    }
}
