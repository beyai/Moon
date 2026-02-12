class Debouncer {
    private var workItem: DispatchWorkItem?
    private let queue: DispatchQueue
    private let delay: TimeInterval

    init(queue: DispatchQueue = .main, delay: TimeInterval) {
        self.queue = queue
        self.delay = delay
    }

    func call(_ block: @escaping () -> Void) {
        // 取消上一次的任务
        workItem?.cancel()
        // 创建新的任务
        workItem = DispatchWorkItem(block: block)
        // 延迟执行
        if let workItem = workItem {
            queue.asyncAfter(deadline: .now() + delay, execute: workItem)
        }
    }
}
