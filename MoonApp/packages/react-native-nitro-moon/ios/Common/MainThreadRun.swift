struct MainThreadRun {
    
    
    /// 同步执行主线程任务
    static func sync(_ block: () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.sync { block() }
        }
    }
    
    static func sync<T>(_ block: () throws -> T) rethrows -> T {
        if Thread.isMainThread {
            return try block()
        } else {
            return try DispatchQueue.main.sync {
                try block()
            }
        }
    }
    
    /// 异步执行主线程任务
    static func async(_ block: @escaping () -> Void) {
        if Thread.isMainThread {
            block()
        } else {
            DispatchQueue.main.async { block() }
        }
    }
}
