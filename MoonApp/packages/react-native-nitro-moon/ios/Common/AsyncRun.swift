import Foundation

struct AsyncRun {
    /// 执行异步任务
    /// - Parameters:
    ///   - queue: 运行队列，默认主队列
    ///   - task: 异步闭包
    /// - Returns: 异步返回结果
    static func run<T>(
        on queue: DispatchQueue = .main,
        _ task: @escaping () async throws -> T
    ) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                Task {
                    do {
                        let result = try await task()
                        continuation.resume(returning: result)
                    } catch {
                        continuation.resume(throwing: error)
                    }
                }
            }
        }
    }
    
    /// 执行异步任务，不抛异常
    /// - Parameters:
    ///   - queue: 运行队列
    ///   - task: 异步闭包
    /// - Returns: 异步返回结果，错误会被捕获并返回 nil
    static func runSafe<T>(
        on queue: DispatchQueue = .main,
        _ task: @escaping () async throws -> T
    ) async -> T? {
        await withCheckedContinuation { continuation in
            queue.async {
                Task {
                    do {
                        let result = try await task()
                        continuation.resume(returning: result)
                    } catch {
                        continuation.resume(returning: nil)
                    }
                }
            }
        }
    }
    
    /// 执行同步任务，并包装为 async/await
    static func runSync<T>(
        on queue: DispatchQueue = .main,
        _ task: @escaping () throws -> T
    ) async throws -> T {
        try await withCheckedThrowingContinuation { continuation in
            queue.async {
                do {
                    let result = try task()
                    continuation.resume(returning: result)
                } catch {
                    continuation.resume(throwing: error)
                }
            }
        }
    }
    
    /// 执行同步任务，不抛异常
    static func runSyncSafe<T>(
        on queue: DispatchQueue = .main,
        _ task: @escaping () throws -> T
    ) async -> T? {
        await withCheckedContinuation { continuation in
            queue.async {
                do {
                    let result = try task()
                    continuation.resume(returning: result)
                } catch {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
}
