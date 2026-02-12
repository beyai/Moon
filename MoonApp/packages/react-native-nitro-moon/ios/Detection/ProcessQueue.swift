import Foundation
import AVFoundation

final class ProcessQueue {

    ///  丢帧策略
    enum DropPolicy {
        case dropOldest
        case dropNewest
        case none
    }

    // MARK: - 配置
    private let maxQueueSize: Int?
    private let dropPolicy: DropPolicy
    private let concurrentWorkers: Int
    private var isInvalidated = false
    private var queue: [VideoFrame] = []
    private let lock = UnfairLock()
    private let workerSemaphore: DispatchSemaphore
    private let processingQueue: DispatchQueue
    private let processFrame: (VideoFrame) -> Void

    // 初始化
    init(
        maxQueueSize: Int = 10,
        concurrentWorkers: Int = 1,
        dropPolicy: DropPolicy = .dropOldest,
        processingQueue: DispatchQueue,
        processFrame: @escaping (VideoFrame) -> Void
    ) {
        self.maxQueueSize       = dropPolicy == .none ? nil : maxQueueSize
        self.concurrentWorkers  = concurrentWorkers
        self.dropPolicy         = dropPolicy
        self.processingQueue    = processingQueue
        self.processFrame       = processFrame
        self.workerSemaphore    = DispatchSemaphore(value: concurrentWorkers)
    }

    // 入队
    @inline(__always)
    func enqueue(_ frame: VideoFrame) {
        lock.execute {
            guard !isInvalidated else { return }
            
            if let maxSize = maxQueueSize, queue.count >= maxSize {
                switch dropPolicy {
                case .dropOldest:
                    // 策略：丢弃旧帧，保证实时性
                    if !queue.isEmpty { queue.removeFirst() }
                    queue.append(frame)
                    
                case .dropNewest:
                    // 保持当前队列不变
                    return
                case .none:
                    queue.append(frame)
                }
            } else {
                queue.append(frame)
            }
        }
        scheduleWorkerIfNeeded()
    }

    // 调度
    @inline(__always)
    private func scheduleWorkerIfNeeded() {
        
        let shouldCancel = lock.execute { isInvalidated }
        if shouldCancel { return }
        
        // 非阻塞式尝试获取信号量
        guard workerSemaphore.wait(timeout: .now()) == .success else { return }
        
        processingQueue.async { [weak self] in
            guard let self = self else { return }
            
            let frame: VideoFrame? = self.lock.execute {
                return (self.isInvalidated || self.queue.isEmpty) ? nil : self.queue.removeFirst()
            }

            guard let frame else {
                self.workerSemaphore.signal()
                return
            }
            
            // 处理前再次检查，防止在排队期间队列被销毁
            let stillValid = self.lock.execute { !self.isInvalidated }
            
            if stillValid {
                self.processFrame(frame)
            }
            // 释放信号量
            self.workerSemaphore.signal()
            // 递归检查是否有新任务入队
            self.scheduleWorkerIfNeeded()
        }
    }
    
    // 清空队列
    @inline(__always)
    func clear() {
        lock.execute {
            queue.removeAll()
        }
    }
    
    // 释放
    @inline(__always)
    func invalidate() {
        lock.execute {
            isInvalidated = true
            queue.removeAll()
        }
    }
}
