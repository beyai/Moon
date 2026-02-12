import Foundation

extension DetectLabel {
    var toCGRect: CGRect? {
        guard rect.count == 4 else { return nil }
        return CGRect(
            x: rect[0],
            y: rect[1],
            width: rect[2],
            height: rect[3]
        )
    }
}


struct BlurDetector {
    
    /// 模糊检测置信度阈值
    /// - 小于等于该置信度标签，参与模糊检测
    static var confidenceThreshold: Double = 0.85
    
    /// 模糊分数阈值
    /// - 小于该分数则认为是模糊
    static var scoreThreshold: Double = 100
    
    /// 检测
    static func detection(_ videoFrame: VideoFrame, detectResult: DetectionResult ) -> DetectionResult {
        if detectResult.data.isEmpty {
            return detectResult
        }
        var results = detectResult;
        
        for index in (0..<results.data.count).reversed() {
            let item = results.data[index]
            
            if item.confidence <= confidenceThreshold {
                
                guard let cropRect      = item.toCGRect,
                      let cropedFrame   = videoFrame.cropAndGray(to: cropRect),
                      let blueScore     = cropedFrame.blurScoreForSmallROI()
                else { continue }
                
                // 移除模糊标签
                if blueScore < scoreThreshold {
                    results.data.remove(at: index)
                }
            }
        }
        
        return results
    }
    
}
