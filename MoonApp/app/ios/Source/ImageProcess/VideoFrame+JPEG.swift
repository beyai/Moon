import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {
    
    /// 图片质量
    static private let compressionQuality: CGFloat = 0.7
    
    /// 转换为JPEG
    func toJPEG() -> Data? {
        
        CVPixelBufferLockBaseAddress(self.pixelBuffer, .readOnly)
        defer {
            CVPixelBufferUnlockBaseAddress(self.pixelBuffer, .readOnly)
        }
        
        var cgImage: CGImage?
        let status = VTCreateCGImageFromCVPixelBuffer(
            pixelBuffer,
            options: nil as CFDictionary? ,
            imageOut: &cgImage
        )
        
        guard status == kCVReturnSuccess, let image = cgImage else {
            return nil
        }
        
        let data = NSMutableData()
        guard let destination = CGImageDestinationCreateWithData(data, "public.jpeg" as CFString, 1, nil) else {
            return nil
        }
        
        let options: [CFString: Any] = [
            kCGImageDestinationLossyCompressionQuality: VideoFrame.compressionQuality
        ]
        
        CGImageDestinationAddImage(destination, image, options as CFDictionary)
        
        return CGImageDestinationFinalize(destination) ? data as Data : nil
    }
}
