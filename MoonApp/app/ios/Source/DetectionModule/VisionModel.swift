// Yolo 模型
import Foundation
import CoreML
import Vision


func VisionModelError(_ error: String) -> NSError {
    return NSError(
        domain: "VisionModel",
        code: 0,
        userInfo: [
            NSLocalizedDescriptionKey: error
        ]
    )
}


final class VisionModel: NSObject {
    
    // 日志
    static let logger = RTCLogger("VisionModel")
    
    // 输入图片尺寸
    static let imageSize = CGSize(width: 512, height: 512)
    
    // 图片背景填充颜色
    static let fillColor: UInt8 = 114
    
    // 模型名
    private var modelName: String?
    
    // 检测框数
    private let topBox: Int = 10
    
    // 模型
    private var model: VNCoreMLModel?
    
    // 检测框重叠阈值
    public var iouThreshold: Double = 0.4 {
        didSet {
            setThresholdProvider()
        }
    }
    
    // 置信度阈值
    public var confidenceThreshold: Double = 0.8{
        didSet {
            setThresholdProvider()
        }
    }
    
    // 初始化实例
    init(_ modelName: String, iouThreshold: Double = 0.4, confidenceThreshold: Double = 0.8) {
        super.init()
        self.modelName = modelName;
        self.iouThreshold = iouThreshold
        self.confidenceThreshold = confidenceThreshold
    }
    
    // 设置阈值
    private func setThresholdProvider() {
        model?.featureProvider = ThresholdProvider(
            iouThreshold: iouThreshold,
            confidenceThreshold: confidenceThreshold
        )
    }
    
    // 加载模型文件
    public func loadModel(completion: @escaping (Result<Bool, Error>) -> Void ) {
        do {
            guard let modelURL = Bundle.main.url(forResource: modelName, withExtension: "mlmodelc" ) else {
                let err = VisionModelError("The model file does not exist.")
                completion(.failure(err))
                return
            }
            
            let conf = MLModelConfiguration()
            conf.computeUnits = .all
            let mlmodel = try MLModel(contentsOf: modelURL, configuration: conf)
            let model = try VNCoreMLModel(for: mlmodel)
            self.model = model
            
            setThresholdProvider()
            completion(.success(true))
        } catch {
            completion(.failure(error))
        }
    }
    
    
    // 处理
    public func process(pixelBuffer: CVPixelBuffer, completion: @escaping (DetectionResult?) -> Void) {
        
        guard let model = model else {
            print("Model is not loaded.")
            completion(nil)
            return
        }
        
        // 创建请求
        // let startTime = Int(Date().timeIntervalSince1970 * 1000 )
        
        let request = VNCoreMLRequest(model: model) { (request, error) in
            // let endTime = Int(Date().timeIntervalSince1970 * 1000)
            // print("处理时长: \( endTime - startTime )ms")
            
            // 请求失败
            if error != nil {
                print("Vision request failed: \(error!.localizedDescription)")
                completion(nil)
                return
            }
            // 获取请求结果
            guard let result = self.handlerResults(request) else {
                print("Failed to parse detection results.")
                completion(nil)
                return
            }
            completion(result)
        }
        
        // 发起请求
        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer)
        do {
            try handler.perform([request])
        } catch {
            print(error.localizedDescription)
            completion(nil)
        }
    }
    
    
    // 处理检测结果
    private func handlerResults(_ request: VNRequest) -> DetectionResult? {
        guard let results = request.results as? [VNRecognizedObjectObservation] else {
            return nil
        }
        // 前10个检测结果
        let topResults = results.prefix(topBox)
        var detections: [DetectionLabel] = []
        
        for observation in topResults {
            guard let topLabelObservation = observation.labels.first else {
              continue
            }
            let label       = topLabelObservation.identifier.uppercased()
            let confidence  = Float(round(observation.confidence * 1000) / 1000)
            let rect        = convertToImageRect(from: observation.boundingBox)
            
            let result = DetectionLabel( label: label, confidence: confidence, rect: rect )
            detections.append(result)
        }
        
        return DetectionResult(data: detections, timestamp: nil)
    }
    
    // 将 Vision 框架返回的归一化坐标（左下角原点）转换为 UIKit 坐标（左上角原点）
    private func convertToImageRect(from normalizedRect: CGRect) -> CGRect {
        let imgSize = VisionModel.imageSize;
        
        let transform = CGAffineTransform(scaleX: 1, y: -1).translatedBy(x: 0, y: -imgSize.height)
        let scaledRect = normalizedRect.applying(CGAffineTransform(scaleX: imgSize.width, y: imgSize.height))
        let finalRect = scaledRect.applying(transform)
        return finalRect
    }
    
    // 释放
    public func release() {
        model = nil
    }
    
}
