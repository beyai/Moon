import Accelerate
import AVFoundation
import VideoToolbox

extension VideoFrame {
    
    /// 计算并返回 Sobel 梯度幅度的方差
    private func _computeSobelMagnitudeVariance() -> Float? {
        guard width > 0 && height > 0 else {
            return nil
        }
        
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        }
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            return nil
        }
        
        let vImageWidth     = vImagePixelCount(width)
        let vImageHeight    = vImagePixelCount(height)
        let vImageRowBytes  = width * MemoryLayout<Float>.size
        let bufferSize      = width * height
        let vdspLength      = vDSP_Length(bufferSize)

        var sourceBuffer = vImage_Buffer(
            data: baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer)
        )


        let floatBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer { floatBufferPtr.deallocate() }
        
        var floatBuffer = vImage_Buffer(
            data: floatBufferPtr.baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: vImageRowBytes
        )

        guard vImageConvert_Planar8toPlanarF(&sourceBuffer, &floatBuffer, 0, 1, vImage_Flags(kvImageNoFlags)) == kvImageNoError else {
            return nil
        }

        // 定义 Sobel 的可分离核
        let kernelX_y: [Float] = [1, 2, 1]
        let kernelX_x: [Float] = [-1, 0, 1]

        let kernelY_y: [Float] = [-1, 0, 1]
        let kernelY_x: [Float] = [1, 2, 1]

        // 创建 Gx 和 Gy 结果缓冲区
        let gxBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        let gyBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer {
            gxBufferPtr.deallocate()
            gyBufferPtr.deallocate()
        }
        
        var gxBuffer = vImage_Buffer(
            data: gxBufferPtr.baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: vImageRowBytes
        )
        
        var gyBuffer = vImage_Buffer(
            data: gyBufferPtr.baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: vImageRowBytes
        )

        // 计算 Gx
        var error = vImageSepConvolve_PlanarF(
            &floatBuffer, &gxBuffer,
            nil, 0, 0, kernelX_x, 3, kernelX_y, 3, 0, 0,
            vImage_Flags(kvImageEdgeExtend)
        )
        guard error == kvImageNoError else {
            return nil
        }

        //  计算 Gy
        error = vImageSepConvolve_PlanarF(
            &floatBuffer, &gyBuffer,
            nil, 0, 0, kernelY_x, 3, kernelY_y, 3, 0, 0,
            vImage_Flags(kvImageEdgeExtend)
        )

        guard error == kvImageNoError else {
            return nil
        }

        // 计算梯度幅度
        let magnitudeBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer { magnitudeBufferPtr.deallocate() }

        /// 使用 vDSP 来计算 sqrt(gx^2 + gy^2)
        // gx^2 -> mag
        vDSP_vsq(gxBufferPtr.baseAddress!, 1, magnitudeBufferPtr.baseAddress!, 1, vdspLength)
        
        // gy^2 + (gx^2) -> mag
        vDSP_vma(
            gyBufferPtr.baseAddress!, 1, gyBufferPtr.baseAddress!, 1,
            magnitudeBufferPtr.baseAddress!, 1, magnitudeBufferPtr.baseAddress!, 1, vdspLength
        )
        
        // sqrt(mag) -> mag
        vvsqrtf(
            magnitudeBufferPtr.baseAddress!, magnitudeBufferPtr.baseAddress!, [Int32(bufferSize)]
        )

        // 计算平方根
        let magnitudePtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer { magnitudePtr.deallocate() }
        vvsqrtf( magnitudePtr.baseAddress!, magnitudeBufferPtr.baseAddress!, [ Int32(bufferSize) ] )

        // 计算方差
        var mean: Float = 0
        var meanSquare: Float = 0
        vDSP_meanv(magnitudeBufferPtr.baseAddress!, 1, &mean, vdspLength)
        vDSP_measqv(magnitudeBufferPtr.baseAddress!, 1, &meanSquare, vdspLength)

        let variance = meanSquare - (mean * mean)
        return variance
    }

    /// 计算拉普拉斯方差
    private func _computeLaplacianVariance() -> Float? {
        guard width > 0 && height > 0 else {
            return nil
        }
        
        let vImageWidth     = vImagePixelCount(width)
        let vImageHeight    = vImagePixelCount(height)
        let vImageRowBytes  = width * MemoryLayout<Float>.size
        let bufferSize      = width * height
        let vdspLength      = vDSP_Length(bufferSize)
        
        CVPixelBufferLockBaseAddress(pixelBuffer, [])
        defer {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, [])
        }
        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else {
            return nil
        }

        // 准备浮点缓冲区
        var sourceBuffer = vImage_Buffer(
            data: baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: CVPixelBufferGetBytesPerRow(pixelBuffer)
        )

        let floatBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer {
            floatBufferPtr.deallocate()
        }
        
        var floatBuffer = vImage_Buffer(
            data: floatBufferPtr.baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: vImageRowBytes
        )

        // 转换为浮点格式
        guard vImageConvert_Planar8toPlanarF(&sourceBuffer, &floatBuffer, 0, 1, vImage_Flags(kvImageNoFlags)) == kvImageNoError else {
            return nil
        }

        // 应用拉普拉斯卷积
        let laplacianKernel: [Float] = [ 0, 1, 0, 1, -4, 1, 0, 1, 0 ]
        let convolvedBufferPtr = UnsafeMutableBufferPointer<Float>.allocate(capacity: bufferSize)
        defer { convolvedBufferPtr.deallocate() }
        var convolvedBuffer = vImage_Buffer(
            data: convolvedBufferPtr.baseAddress,
            height: vImageHeight,
            width: vImageWidth,
            rowBytes: vImageRowBytes
        )

        let error = vImageConvolve_PlanarF( &floatBuffer, &convolvedBuffer, nil, 0, 0, laplacianKernel, 3, 3, 0.0, vImage_Flags(kvImageEdgeExtend) )
        guard error == kvImageNoError else {
            return nil
        }

        // 计算方差
        guard let convolvedDataPtr = convolvedBuffer.data?.assumingMemoryBound(to: Float.self) else {
            return nil
        }

        var mean: Float = 0
        var meanSquare: Float = 0
        vDSP_meanv(convolvedDataPtr, 1, &mean, vdspLength)
        vDSP_measqv(convolvedDataPtr, 1, &meanSquare, vdspLength)

        let variance = meanSquare - (mean * mean)
        return variance
    }

    private func _calculateFinalScore( lapVar: Float, sobelVar: Float, lapThresh: Float, sobelThresh: Float ) -> Double {
        let lapNorm = min(lapVar / lapThresh, 1.0)
        let sobelNorm = min(sobelVar / sobelThresh, 1.0)
        let score = (0.5 * lapNorm + 0.5 * sobelNorm)
        return Double(score * 10000).rounded() / 100.0
    }

    // MARK: - 判断图像是否模糊
    func blureScore(lapThreshold: Float = 1.0, sobelThreshold: Float = 5.0) -> Double? {
        let currentFormat = CVPixelBufferGetPixelFormatType(pixelBuffer)
        
        guard currentFormat == kCVPixelFormatType_OneComponent8 else {
            print("模糊度评分仅支持 8位灰度图格式，当前格式：\(currentFormat)")
            return nil
        }

        // 计算两个核心方差指标
        guard let lapVar = _computeLaplacianVariance(), let sobelVar = _computeSobelMagnitudeVariance() else {
            print("计算拉普拉斯或 Sobel 方差失败。")
            return nil
        }

        // 计算最终得分
        let lapNorm = min(lapVar / lapThreshold, 1.0)
        let sobelNorm = min(sobelVar / sobelThreshold, 1.0)
        let score = (0.5 * lapNorm + 0.5 * sobelNorm)
        return Double(score * 10000).rounded() / 100.0
    }
}
