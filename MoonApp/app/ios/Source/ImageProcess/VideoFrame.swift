import Accelerate
import AVFoundation

struct VideoFrame {
    let width: Int
    let height: Int
    let timestamp: Int
    let pixelBuffer: CVPixelBuffer
    let pixelFormat: OSType
    var orientation: AVCaptureVideoOrientation
    var positon: AVCaptureDevice.Position
    // 检测结果
    var detectionResult: DetectionResult?
    
    init?(width: Int, height: Int, timestamp: Int, pixelBuffer: CVPixelBuffer, pixelFormat: OSType = kCVPixelFormatType_32BGRA) {
        // 验证像素格式
        guard pixelFormat == CVPixelBufferGetPixelFormatType(pixelBuffer) else {
            return nil
        }
        self.width = width
        self.height = height
        self.timestamp = timestamp
        self.pixelBuffer = pixelBuffer
        self.pixelFormat = pixelFormat
        self.orientation = .portrait
        self.positon = .back
    }
    
    /// 转换为帧
    static func from(sampleBuffer: CMSampleBuffer) -> VideoFrame? {
        
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer),
              CVPixelBufferGetPixelFormatType(pixelBuffer) == kCVPixelFormatType_32BGRA
        else {
            return nil
        }
        
        // 采集时间
        let sampleTime = CMSampleBufferGetPresentationTimeStamp(sampleBuffer)
        return VideoFrame(
            width: CVPixelBufferGetWidth(pixelBuffer),
            height: CVPixelBufferGetHeight(pixelBuffer),
            timestamp: Int( CMTimeGetSeconds(sampleTime) * 1000 ),
            pixelBuffer: pixelBuffer
        )
    }
    
    /// 创建指定尺寸和格式的 CVPixelBuffer
    static func createTargetPixelBuffer(width: Int, height: Int, pixelFormat: OSType) -> CVPixelBuffer? {
        let attributes: [String: Any] = [
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true,
            kCVPixelBufferMetalCompatibilityKey as String: true,
            kCVPixelBufferOpenGLCompatibilityKey as String: true,
            kCVPixelBufferIOSurfacePropertiesKey as String: [:],
        ]
        
        var targetPixelBuffer: CVPixelBuffer?
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            pixelFormat,
            attributes as CFDictionary,
            &targetPixelBuffer
        )

        guard status == kCVReturnSuccess, let unwrapped = targetPixelBuffer else {
            return nil
        }
        return unwrapped
    }
    
    
}

