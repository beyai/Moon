import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {

    /// 模糊度评分
    func blureScore(lapThreshold: Float = 1.0, sobelThreshold: Float = 5.0) -> Double? {
        
        let currentFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
        guard currentFormat == kCVPixelFormatType_OneComponent8 else {
            print("模糊度评分仅支持 8位灰度图格式")
            return nil
        }

        return performOnFloatBuffer { floatBuffer, vdspLength in
            guard let lapVar    = computeLaplacianVariance(source: floatBuffer, length: vdspLength),
                  let sobelVar  = computeSobelVariance(source: floatBuffer, length: vdspLength)
            else { return nil }

            return calculateFinalScore(
                lapVar: lapVar,
                sobelVar: sobelVar,
                lapThresh: lapThreshold,
                sobelThresh: sobelThreshold
            )
        }
    }
    
    /// 模糊度评分
    /// - 自适应评分
    /// - 取值范围 0~1
    func blurScoreForSmallROI() -> Double? {
        let format = CVPixelBufferGetPixelFormatType(pixelBuffer)
        guard format == kCVPixelFormatType_OneComponent8 else {
            return nil
        }

        return performOnFloatBuffer { floatBuffer, length in
            guard let lapVar    = computeLaplacianVariance(source: floatBuffer, length: length),
                  let sobelVar  = computeSobelVariance(source: floatBuffer, length: length)
            else { return nil }
            
            return calculateAdaptiveScore(lapVar: lapVar, sobelVar: sobelVar)
        }
    }
    
    /// 针对小图的自适应评分
    private func calculateAdaptiveScore(lapVar: Float, sobelVar: Float) -> Double {
        let lapScore    = log1p(Double(lapVar * 1000))
        let sobelScore  = log1p(Double(sobelVar * 1000))
        let combined    = 0.7 * lapScore + 0.3 * sobelScore
        let normalized  = min(max(combined / 2.5, 0), 1.0)
        return Double(normalized).toFixed(2)
    }
    
    /// 计算拉普拉斯卷积后的图像方差
    private func computeLaplacianVariance(source: vImage_Buffer, length: vDSP_Length) -> Float? {
        let laplacianKernel: [Float] = [
            0,  1, 0,
            1, -4, 1,
            0,  1, 0
        ]

        var source = source

        let bufferSize = Int(source.width * source.height)
        let ptr = UnsafeMutablePointer<Float>.allocate(capacity: bufferSize)
        defer { ptr.deallocate() }

        var destBuffer = vImage_Buffer(
            data: ptr,
            height: source.height,
            width: source.width,
            rowBytes: Int(source.width) * MemoryLayout<Float>.size
        )

        let error = vImageConvolve_PlanarF(
            &source, &destBuffer, nil,
            0, 0, laplacianKernel, 3, 3, 0.0,
            vImage_Flags(kvImageEdgeExtend)
        )

        guard error == kvImageNoError else { return nil }

        return calculateVariance(of: destBuffer.data.assumingMemoryBound(to: Float.self), length: length)
    }
    
    /// 计算图像 Sobel 梯度幅度的方差
    private func computeSobelVariance(source: vImage_Buffer, length: vDSP_Length) -> Float? {
        var source = source
        let count = Int(length)
        let gxPtr = UnsafeMutablePointer<Float>.allocate(capacity: count)
        let gyPtr = UnsafeMutablePointer<Float>.allocate(capacity: count)
        defer {
            gxPtr.deallocate()
            gyPtr.deallocate()
        }

        var gxBuffer = vImage_Buffer(
            data: gxPtr,
            height: source.height,
            width: source.width,
            rowBytes: Int(source.width) * MemoryLayout<Float>.size
        )
        var gyBuffer = vImage_Buffer(
            data: gyPtr,
            height: source.height,
            width: source.width,
            rowBytes: Int(source.width) * MemoryLayout<Float>.size
        )

        // Sobel卷积核
        let kX_y: [Float] = [ 1, 2, 1], kX_x: [Float] = [-1, 0, 1]
        let kY_y: [Float] = [-1, 0, 1], kY_x: [Float] = [ 1, 2, 1]

        vImageSepConvolve_PlanarF(&source, &gxBuffer, nil, 0, 0, kX_x, 3, kX_y, 3, 0, 0, vImage_Flags(kvImageEdgeExtend))
        vImageSepConvolve_PlanarF(&source, &gyBuffer, nil, 0, 0, kY_x, 3, kY_y, 3, 0, 0, vImage_Flags(kvImageEdgeExtend))

        // 计算梯度幅值
        let gxData = gxBuffer.data.assumingMemoryBound(to: Float.self)
        let gyData = gyBuffer.data.assumingMemoryBound(to: Float.self)

        vDSP_vsq(gxData, 1, gxData, 1, length)
        vDSP_vma(gyData, 1, gyData, 1, gxData, 1, gxData, 1, length)
        
        var n = Int32(count)
        vvsqrtf(gxData, gxData, &n)

        return calculateVariance(of: gxData, length: length)
    }

    /// 方差计算
    private func calculateVariance(of ptr: UnsafePointer<Float>, length: vDSP_Length) -> Float {
        var mean: Float = 0
        var meanSquare: Float = 0
        
        vDSP_meanv(ptr, 1, &mean, length)
        vDSP_measqv(ptr, 1, &meanSquare, length)
        
        return meanSquare - (mean * mean)
    }
    
    /// 根据拉普拉斯和 Sobel 方差计算最终模糊度评分
    private func calculateFinalScore(lapVar: Float, sobelVar: Float, lapThresh: Float, sobelThresh: Float) -> Double {
        let lapNorm     = min(lapVar / lapThresh, 1.0)
        let sobelNorm   = min(sobelVar / sobelThresh, 1.0)
        let score       = (0.5 * lapNorm + 0.5 * sobelNorm)
        
        return Double( score * 100 ).toFixed(2)
    }
    
    /// 处理 CVPixelBuffer 转为浮点 Planar 缓冲区
    private func performOnFloatBuffer<T>(action: (vImage_Buffer, vDSP_Length) -> T?) -> T? {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return nil }

        let bufferSize  = width * height
        let vdspLength  = vDSP_Length(bufferSize)

        var srcBuffer   = vImage_Buffer(
            data        : baseAddress,
            height      : vImagePixelCount(height),
            width       : vImagePixelCount(width),
            rowBytes    : CVPixelBufferGetBytesPerRow(pixelBuffer)
        )

        let floatPtr    = UnsafeMutablePointer<Float>.allocate(capacity: bufferSize)
        defer { floatPtr.deallocate() }

        var floatBuffer = vImage_Buffer(
            data        : floatPtr,
            height      : vImagePixelCount(height),
            width       : vImagePixelCount(width),
            rowBytes    : width * MemoryLayout<Float>.size
        )

        guard vImageConvert_Planar8toPlanarF(&srcBuffer, &floatBuffer, 0, 1, vImage_Flags(kvImageNoFlags)) == kvImageNoError else {
            return nil
        }

        return action(floatBuffer, vdspLength)
    }
}
