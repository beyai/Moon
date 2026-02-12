import Foundation

final class TimerManager {
    /// 单例
    static let shared = TimerManager()
    /// 日志
    private var logger: MLogger = { MLogger("TimerManager") }()
    /// 标记是否已校准
    private(set) var isCalibrated: Bool = false
    /// 服务器时间(秒)
    private var serverBaseline: Int64 = 0
    /// 同步时的App运行时间(秒)
    private var uptimeBaseline: TimeInterval = 0
    /// 访问锁
    private var accessLock = UnfairLock()
    /// 上次同步时间
    private var lastSyncTime: Date?
    
    private init() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAppDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }
    
    @objc
    private func handleAppDidBecomeActive() {
        accessLock.lock()
        let now = Date()
        let isSync = isCalibrated
        let lastSync = lastSyncTime
        accessLock.unlock()
        if !isSync {
            return
        }
        if let last = lastSync, now.timeIntervalSince(last) < 10 {
            return
        }
        logger.debug("handleAppDidBecomeActive")
        Task { await self.sync() }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    
    /// 当前时间
    func now() -> Int64 {
        accessLock.lock()
        defer { accessLock.unlock() }
        guard isCalibrated else {
            return Int64( Date().timeIntervalSince1970 )
        }
        
        let currentUptime = ProcessInfo.processInfo.systemUptime
        return self.serverBaseline + Int64(currentUptime - self.uptimeBaseline)
        
    }
    
    /// 同步服务器时间
    func sync() async {
        do {
            let timestamp = try await SessionRequest.shared.getServerTime()
            accessLock.execute {
                self.serverBaseline = timestamp
                self.uptimeBaseline = ProcessInfo.processInfo.systemUptime
                self.lastSyncTime   = Date()
                self.isCalibrated   = true
                logger.info("时间同步完成。Server: \(timestamp)")
            }
        } catch {
            logger.error(error.localizedDescription)
        }
    }
    
    
    
}
