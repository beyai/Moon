import Foundation
import AVFoundation

class ProcessQueue {
    
    /// 队列满时的丢帧策略
    enum DropPolicy {
        case dropOldest  // 队列满时丢掉最老帧
        case dropNewest  // 队列满时丢掉最新帧
        case none        // 队列无限增长
    }
    
    // MARK: - 属性
    
    /// 队列最大缓存帧数
    private let maxQueueSize: Int?
    
    /// 同时处理帧的数量
    private let concurrentWorkers: Int
    
    /// 队列满时的策略
    private let dropPolicy: DropPolicy
    
    /// 内部缓存帧队列
    private var queue = [VideoFrame]()
    
    /// 访问队列锁（线程安全）
    private let queueLock = DispatchSemaphore(value: 1)
    
    /// 控制队列容量的信号量（用于阻塞 enqueue）
    private let semaphore: DispatchSemaphore
    
    /// 并发处理队列
    private let processingQueue: DispatchQueue
    
    /// 模型处理闭包，每帧入队后执行
    private let processFrame: (VideoFrame) -> Void
    
    // MARK: - 初始化
        
    /// 初始化队列
    /// - Parameters:
    ///   - maxQueueSize: 队列最大缓存帧数
    ///   - concurrentWorkers: 同时处理帧的数量
    ///   - dropPolicy: 队列满时的策略
    ///   - queue: 处理队列
    ///   - processFrame: 模型处理闭包
    init(
        maxQueueSize: Int = 10,
        concurrentWorkers: Int = 1,
        dropPolicy: DropPolicy = .dropOldest,
        queue: DispatchQueue,
        processFrame: @escaping (VideoFrame) -> Void
    ) {
        self.maxQueueSize = dropPolicy == .none ? nil : maxQueueSize
        self.concurrentWorkers = concurrentWorkers
        self.dropPolicy = dropPolicy
        self.semaphore = DispatchSemaphore(value: maxQueueSize)
        self.processingQueue = queue
        self.processFrame = processFrame
    }
    
    // MARK: - 入队方法
    
    /// 将一帧视频加入队列
    /// - Parameter frame: 缩放后的 VideoFrame
    /// - 注意：
    ///   - 队列满时，根据 dropPolicy 决定丢弃或阻塞
    func enqueue(_ frame: VideoFrame) {
        queueLock.wait()
        defer { queueLock.signal() }
        
        if let maxSize = maxQueueSize, queue.count >= maxSize {
            // 队列满了，按照策略处理
            switch dropPolicy {
                case .dropOldest:
                    print("队列满了，丢弃旧数据")
                    queue.removeFirst()
                    queue.append(frame)
                case .dropNewest:
                    return // 丢掉当前帧
                case .none:
                    break // 永远不会进入这里
            }
        } else {
            queue.append(frame)
        }
        
        // 异步处理任务
        for _ in 0..<concurrentWorkers {
            processNext()
        }
    }
    
    // MARK: - 异步处理方法
    
    /// 异步处理队列中的下一帧
    /// 会调用 processFrame 闭包
    private func processNext() {
        processingQueue.async { [weak self] in
            guard let self = self else { return }
            self.queueLock.wait()
            
            guard !self.queue.isEmpty else {
                self.queueLock.signal()
                return
            }
            
            let frame = self.queue.removeFirst()
            self.queueLock.signal()
            
            // 调用模型处理闭包
            self.processFrame(frame)
            
            // 处理完成，释放信号量（若 enqueue 阻塞等待）
            self.semaphore.signal()
        }
    }
    
}
