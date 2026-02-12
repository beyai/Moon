import Vision
import Accelerate // 必须导入这个库

private let DetectionLabelNames: [String] = [
    "AS", "2S", "3S", "4S", "5S", "6S", "7S", "8S", "9S", "10S", "JS", "QS", "KS",
    "AH", "2H", "3H", "4H", "5H", "6H", "7H", "8H", "9H", "10H", "JH", "QH", "KH",
    "AC", "2C", "3C", "4C", "5C", "6C", "7C", "8C", "9C", "10C", "JC", "QC", "KC",
    "AD", "2D", "3D", "4D", "5D", "6D", "7D", "8D", "9D", "10D", "JD", "QD", "KD",
    "LittleJoker", "BigJoker"
]


extension Detection {
    
    // 检测结果结构体
    struct DetectionBBox {
        let id = UUID()
        let label: String
        let confidence: Float
        let boundingBox: CGRect
    }
    
    // 计算两个边界框的IoU（交并比）
    private func calculateIoU(box1: CGRect, box2: CGRect) -> Float {
        let intersection = box1.intersection(box2)
        
        // 如果没有交集，IoU为0
        guard !intersection.isNull else { return 0.0 }
        
        let intersectionArea = intersection.width * intersection.height
        let unionArea = box1.width * box1.height + box2.width * box2.height - intersectionArea
        
        return Float(intersectionArea / unionArea)
    }
    
    // NMS（非极大值抑制）后处理
    private func applyNMS(to detections: [DetectionBBox]) -> [DetectionBBox] {
       guard !detections.isEmpty else { return [] }
       
       // 按置信度降序排序
       let sortedDetections = detections.sorted { $0.confidence > $1.confidence }
       var selectedDetections: [DetectionBBox] = []
        
        let threshold = Float(iouThreshold)
       
       for detection in sortedDetections {
           var shouldKeep = true
           
           // 检查与已选择的检测结果的IoU
           for selectedDetection in selectedDetections {
               let iou = calculateIoU(box1: detection.boundingBox, box2: selectedDetection.boundingBox)
               
               // 如果IoU超过阈值且是同一类别，则抑制当前检测
               if iou > threshold && detection.label == selectedDetection.label {
                   shouldKeep = false
                   break
               }
           }
           
           if shouldKeep {
               selectedDetections.append(detection)
           }
       }
       
       return selectedDetections
   }
   
    
    /// 解析输出结果
    func parseOutput(multiArray: MLMultiArray) -> [ DetectionBBox ] {
        
        let numClasses = multiArray.shape[1].intValue - 4 // 54
        let numDetections = multiArray.shape[2].intValue // 5376
        let threshold = Float(self.confidenceThreshold)
        let topN = 30
        
        // 预分配检测结果数组容量以减少重分配
        var detections: [DetectionBBox] = []
        detections.reserveCapacity(topN)  // 预期最多50个有效检测

        // 获取原始指针
        let dataPointer = multiArray.dataPointer.bindMemory(to: Float.self, capacity: multiArray.count)
        
        // 获取步长 (Strides)
        let strideFeature = multiArray.strides[1].intValue  // 对于 (1, 58, 5376) 这是 5376
        let strideBox = multiArray.strides[2].intValue  // 1
        
        
        // 类别得分开始的指针偏移量 (跳过 x, y, w, h)
        let scoresBasePtr = dataPointer.advanced(by: 4 * strideFeature)
        
        for i in 0..<numDetections {
            
            // 指向当前 box 的第一类分数
            let currentBoxScoresPtr = scoresBasePtr.advanced(by: i * strideBox)
            
            // 查找最高置信度的类别
            var maxClassScore: Float = 0
            var maxClassIndex: vDSP_Length = 0
            
            // vDSP 处理跨度访问：在 row-major 数据中查找特定列的最大值
            // 这里 stride 是 strideFeature (即 numDetections)
            vDSP_maxvi(currentBoxScoresPtr, vDSP_Stride(strideFeature), &maxClassScore, &maxClassIndex, vDSP_Length(numClasses) )
            
            // 过滤低置信度检测 - 早期退出优化
            if maxClassScore >= threshold {
                
                // 获取坐标 (x, y, w, h 是中心点格式)
                let x = dataPointer[0 * strideFeature + i * strideBox]
                let y = dataPointer[1 * strideFeature + i * strideBox]
                let w = dataPointer[2 * strideFeature + i * strideBox]
                let h = dataPointer[3 * strideFeature + i * strideBox]

                // 过滤明显无效的边界框
                guard w > 1 && h > 1 else { continue }
                
                let boundingBox = CGRect(
                    x:      CGFloat(x - w / 2),
                    y:      CGFloat(y - h / 2),
                    width:  CGFloat(w),
                    height: CGFloat(h)
                )
                
                // 获取类别标签
                let labelIndex = Int(maxClassIndex) / strideFeature  // 除以步长得到 0...53 的索引
                let classLabel = labelIndex < DetectionLabelNames.count ? DetectionLabelNames[labelIndex] : "unknown"
                
                detections.append(DetectionBBox(
                    label: classLabel,
                    confidence: maxClassScore,
                    boundingBox: boundingBox
                ))
                
                // 限制检测结果数量以控制内存使用
                if detections.count >= topN { break }
            }
        }
        
        detections.reserveCapacity(detections.count)
        
        return applyNMS(to: detections)
    }
   
}


