import Foundation
import Vision
import AVFoundation
import NitroModules


final class Detection: HybridDetectionSpec {
    
    /// 日志
    static  let logger: MLogger = { MLogger("Detection") }()
    private var logger: MLogger { Detection.logger }
    
    // MARK: - 私有属性
    
    /// 是否加载
    private var isLoad: Bool = false
    /// 输入图片尺寸
    public let imageSize = CGSize(width: 512, height: 512)
    /// 背景填充颜色
    private let fillColor: UInt8 = 114
    /// 最大检测框数
    private let topN: Int = 10
    /// 模型
    private var model: VNCoreMLModel?
    /// 画面缩放
    private var imageResizer: Resizer?
    /// 置信度
    private var _confidenceThreshold: Double = 0.8
    /// 交并比
    private var _iouThreshold: Double = 0.45
    /// 缓存视频帧
    private var cacheVideoFrame: ProcessQueue?
    /// 缓存队列
    private lazy var cacheQueue: DispatchQueue = {
        DispatchQueue( label: "Detection.CacheQueue", qos: .userInitiated, attributes: .concurrent )
    }()
    /// 模型队列
    private lazy var modelQueue: DispatchQueue = {
        DispatchQueue( label: "Detection.ModelQueue", qos: .userInitiated, attributes: .concurrent )
    }()
    
    override init() {
        super.init()
        imageResizer = Resizer(size: self.imageSize, fill: self.fillColor)
        cacheVideoFrame = createProcessQueue()
    }

    // MARK: - 暴露属性
    
    /// 模型名称
    var modelName: String?
    
    /// 置信度阈值
    var confidenceThreshold: Double {
        get { _confidenceThreshold }
        set {
            let clamped = newValue.clamped(to: 0...1)
            guard clamped != _confidenceThreshold else { return }
            _confidenceThreshold = clamped
        }
    }
    
    /// 交并比阈值
    var iouThreshold: Double {
        get { _iouThreshold }
        set {
            let clamped = newValue.clamped(to: 0...1)
            guard clamped != _iouThreshold else { return }
            _iouThreshold = clamped
        }
    }
    
    /// 是否模糊检测
    var enableBlurDetection: Bool = false
    
    /// 模糊检测置信度阈值
    /// - 值范围：0.5 ~ 1
    /// - 小于等于该置信度标签，参与模糊检测
    var blurConfidenceThreshold: Double {
        get { BlurDetector.confidenceThreshold }
        set {
            BlurDetector.confidenceThreshold = newValue.clamped(to: 0.5...1)
        }
    }
    
    /// 模糊检测分数阈值
    /// - 值范围：0 ~ 1
    /// - 小于该分数则认为是模糊
    var blurScoreThreshold: Double {
        get { BlurDetector.scoreThreshold }
        set {
            BlurDetector.scoreThreshold = newValue.clamped(to: 0...1)
        }
    }
    
    
    // MARK: - 暴露方法
    
    /// 加载模型
    func load(model: String) -> Promise<Void> {
        return Promise.async {  [weak self] in
            guard let self = self else {
                self?.logger.error("加载失败：\( model )")
                throw CreateError(message: "Instance is not initialized")
            }
            await self.unloadModel()
            self.model = try await self.loadModel(name: model)
            
            self.modelName = model
            self.receiveVideoFrame()
            self.logger.debug("加载完成：\( model )")
        }
    }
    
    /// 监听检测结果
    private var detectResultListener: ( (_ results: DetectionResult ) -> Void )?
    typealias RemoveListener = () -> Void
    func onDetectResult(listener: @escaping (_ results: DetectionResult ) -> Void) throws -> RemoveListener {
        detectResultListener = listener
        return { [weak self] in
            self?.detectResultListener = nil
        }
    }
    
    // MARK: - 方法
    
    /// 加载模型文件
    private func loadModel(name: String) async throws -> VNCoreMLModel {
        return try await AsyncRun.runSync(on: modelQueue) {
            guard let modelURL = Bundle.main.url(forResource: name, withExtension: "mlmodelc") else {
                throw CreateError(message: "The model file does not exist.")
            }
            let configuration = MLModelConfiguration()
            
            configuration.computeUnits = .all
            let mlmodel = try MLModel(contentsOf: modelURL, configuration: configuration)
            
            print(mlmodel.modelDescription)
            
            let model = try VNCoreMLModel(for: mlmodel)
            return model
        }
    }
    
    /// 卸载模型
    private func unloadModel() async {
        await AsyncRun.runSyncSafe(on: modelQueue) { [weak self] in
            guard let self = self, let model = self.model else { return }
            VideoFrameHub.unsubscribe(self)
            model.featureProvider = nil
            self.model = nil
        }
    }
    
    /// 处理请求
    private func processRequest(_ videoFrame: VideoFrame ) throws {
        
        guard let model = self.model else {
            throw CreateError(message: "Model not loaded")
        }
        
        
        // 创建请求
        let request = VNCoreMLRequest(model: model) { [weak self] (request, error) in
            guard let self = self else { return }
            if let error = error {
                self.logger.error("processRequest: \(error.localizedDescription)")
            } else {
                self.handlerDetectionResult(request, videoFrame: videoFrame)
            }
        }
        
        // 发起请求
        let requestHandler = VNImageRequestHandler(cvPixelBuffer: videoFrame.pixelBuffer)
        try requestHandler.perform([request])
    }
    

    /// 处理请求结果
    private func handlerDetectionResult(_ request: VNRequest, videoFrame: VideoFrame) {

        guard let observations = request.results as? [VNCoreMLFeatureValueObservation],
              let outputArray = observations.first?.featureValue.multiArrayValue
        else { return }
        
        let labels = parseOutput(multiArray: outputArray)
        
        var detectResult = DetectionResult(
            timestamp: Double(videoFrame.timestamp),
            data: labels.map {
                return DetectLabel(
                    label: $0.label,
                    confidence: Double($0.confidence).toFixed(4),
                    rect: [
                        Double($0.boundingBox.origin.x).toFixed(2),
                        Double($0.boundingBox.origin.y).toFixed(2),
                        Double($0.boundingBox.width).toFixed(2),
                        Double($0.boundingBox.height).toFixed(2)
                    ]
                )
            }
        )

        /// 模糊检测
        if enableBlurDetection {
             detectResult = BlurDetector.detection(videoFrame, detectResult: detectResult)
        }

        // 返回结果
        self.detectResultListener?(detectResult)
        
    }
    
    // MARK: - 生命周期
    
    /// 卸载模型
    func unload() {
        
        // 取消订阅视频画面
        VideoFrameHub.unsubscribe(self)
        // 清空队列
        cacheVideoFrame?.clear()
        
        Task { [weak self] in
            guard let self = self else { return }
            await self.unloadModel()
            self.model = nil
            self.logger.debug("卸载模型")
        }
    }
    
    func dispose() {
        detectResultListener = nil
        cacheVideoFrame?.invalidate()
        cacheVideoFrame = nil
        imageResizer = nil
        unload()
    }
    
}


// MARK: - 画面处理

extension Detection {
    
    /// 创建视频帧处理队列
    private func createProcessQueue() -> ProcessQueue {
        return ProcessQueue(
            maxQueueSize: 100,
            concurrentWorkers: 1,
            dropPolicy: .dropOldest,
            processingQueue: cacheQueue,
        ) { [weak self] videoFrame in
            guard let self = self else { return }
            modelQueue.async {
                do {
                    try self.processRequest(videoFrame)
                } catch {
                    self.logger.error("createProcessQueue: \(error.localizedDescription)")
                }
            }
        }
    }
    
    /// 接收视频帧
    private func receiveVideoFrame() {
        VideoFrameHub.subscribe(self) { [weak self] videoFrame in
            guard let self = self,
                  let imageResizer = self.imageResizer,
                  let cacheVideoFrame = self.cacheVideoFrame
            else { return }
            autoreleasepool {
                // 画面缩放
                guard let resizedVideoFrame = imageResizer.resize(videoFrame: videoFrame) else { return }
                // 添加到处理队列
                cacheVideoFrame.enqueue(resizedVideoFrame)
            }
        }
        
        self.logger.debug("接收视频帧")
    }
}
