import Foundation
import CoreMedia
import CoreML
import Vision

@objc(DetectionModule)
class DetectionModule: NSObject {
    
    // 日志
    static var logger: RTCLogger = RTCLogger("DetectionModule")
    
    // 画面缩放器
    private var resizer: Resizer?
    
    // 是否开启模糊检测
    private var enableBlurDetector: Bool = false
    
    // 模糊检测阈值
    private var blurConfidenceThreshold: Float = 0.8
    
    // 模糊检测阈值
    private var blurScoreThreshold: Double = 0.2
    
    // 模型
    private var Model: VisionModel?
    
    // 是否高速检测中
    private var isDetection: Bool = false
    
    // 运行状态
    private var isRunning: Bool = false
    
    // 检测队列
    private var detecterQueue: ProcessQueue?
    
    // 初始化
    @objc
    override init() {
        super.init();
        resizer = Resizer( size: VisionModel.imageSize, fill: VisionModel.fillColor )
        installQueue()
    }

    // 安装模型
    @objc
    public func setupModel(_ options: [String: Any], resolver resolve: @escaping RCTPromiseResolveBlock, rejecter reject: @escaping RCTPromiseRejectBlock) {
        
        if isRunning {
            reject("ERROR", "模型正在运行中，请先停止", nil)
            return;
        }
        
        guard let modelName = options["model"] as? String else {
            reject("ERROR", "模型名不能为空", nil)
            return
        }
        
        // 检测框重叠阈值
        let iouThreshold =  options["iouThreshold"] as? Double ?? 0.4
        // 置信度阈值
        let confidenceThreshold =  options["confidenceThreshold"] as? Double ?? 0.8
        
        let model = VisionModel(
            modelName,
            iouThreshold: iouThreshold,
            confidenceThreshold: confidenceThreshold
        )
        
        model.loadModel { [weak self] result in
            guard let self = self else {
                reject("ERROR", "模型加载失败", nil)
                return
            }
            
            switch result {
                
                // 加载成功
                case .success(let state):
                    self.Model?.release()
                    self.Model = model
                    resolve(state)
                    Self.logger.info("模型加载成功：\( modelName )")
                
                // 加载失败
                case .failure(let error):
                    reject("ERROR", error.localizedDescription, nil)
                    Self.logger.warn("模型加载失败：\( modelName )")
            }
        }
    }
    
    // 设置置信度阈值
    @objc
    public func setConfidenceThreshold(_ value: NSNumber) {
        Model?.confidenceThreshold = value.doubleValue
    }
    
    // 设置重叠阈值
    @objc
    public func setIouThreshold(_ value: NSNumber) {
        Model?.iouThreshold = value.doubleValue
    }
    
    // 设置模型检测
    @objc
    public func setBlurDetector(_ options: [String: Any ] ) {
        enableBlurDetector = options["enable"] as? Bool ?? false
        blurConfidenceThreshold = options["confidence"] as? Float ?? 0.8
        blurScoreThreshold = options["score"] as? Double ?? 0.1
    }
    
    // 设置是否高速处理中
    @objc
    public func setIsDetection(_ value: Bool){
        isDetection = value
    }
    
    // 开始
    @objc
    public func start() {
        isRunning = true;
    }
    
    // 停止
    @objc
    public func stop() {
        isRunning = false;
    }
    
    // 安装队列
    private func installQueue() {
        
        // 目标检测队列
        let processQueqe = DispatchQueue(label: "DetectorQueue", qos: .userInitiated, attributes: .concurrent)
        detecterQueue = ProcessQueue(maxQueueSize: 200, concurrentWorkers: 2, dropPolicy: .dropOldest, queue: processQueqe ) { [weak self] frame in
            guard let self = self, let model = self.Model else { return }
            // 检测目标
            model.process(pixelBuffer: frame.pixelBuffer) { result in
                guard var detectionResult = result else {
                    return
                }
                detectionResult.timestamp = frame.timestamp
                
                var videoFrame = frame
                videoFrame.detectionResult = detectionResult
                
                self.handlerDetectionResult(videoFrame)
            }
        }
        
    }

    // 处理视频帧
    public func processFrame(_ videoFrame: VideoFrame) {
        guard isRunning, let resizer = resizer else {
            return
        }
        // 缩放图片
        guard let resizeFrame = resizer.resize(videoFrame: videoFrame) else {
            return;
        }
        detecterQueue?.enqueue(resizeFrame)
    }
    
    // 处理结果
    private func handlerDetectionResult(_ videoFrame: VideoFrame ) {
        
        var frame   = videoFrame;
        var result  = frame.detectionResult
        
        // 模糊检测
        if enableBlurDetector {
            if let filtered = self.filterBlurLebels(videoFrame) {
                result = filtered
                frame.detectionResult = filtered
            }
        }
        
        // 发送事件到前端
        DispatchQueue.main.async {
            // self.sendEvent(withName: "onObjectDetection", body: result?.toDict() )
        }
        
    }
    
    // 过滤模糊检测结果
    private func filterBlurLebels(_ videoFrame: VideoFrame ) -> DetectionResult? {
        guard var result = videoFrame.detectionResult, !result.data.isEmpty else {
            return nil
        }
        
        for index in (0..<result.data.count).reversed() {
            
            let item = result.data[index]
            if (item.confidence < blurConfidenceThreshold) {
                
                // 截取检测区域、转换成灰度图
                guard let croped = videoFrame.crop(to: item.rect), let grayed = croped.toGray() else {
                    continue
                }
                
                // 是否模糊
                guard let score = grayed.blureScore(lapThreshold: 1.0, sobelThreshold: 5.0 ) else {
                    continue
                }
                
                // 删除模糊结果
                if (score < blurScoreThreshold ) {
                    result.data.remove(at: index)
                    Self.logger.debug("label = \( item.label ) confidence = \( item.confidence ) score = \(score)")
                }
            }
        }
        
        return result
    }
}


extension DetectionModule: CameraVideoFrameDelegate {
    func onVideoFrame(_ videoFrame: VideoFrame) {
    }
}
