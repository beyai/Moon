import Foundation
import os

enum LogLevel {
    case debug
    case info
    case warn
    case error
}

final class MLogger {

    private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier ?? "Moon.app", category: "AppLog")

    private var ModuleName: String = "App"
    
    // 只有在 DEBUG 模式下才初始化日期格式化器，进一步节省 Release 内存
    #if DEBUG
    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }()
    #endif

    init(_ name: String) {
        ModuleName = name
    }
    
    // 将底层的 log 设为私有
    private func _log(_ message: Any, level: LogLevel) {
        #if DEBUG
        let timestamp = dateFormatter.string(from: Date())
        let logMessage = "\(timestamp) [\( ModuleName )] - \(message)"
        switch level {
        case .debug:
            MLogger.logger.debug("🚧 \(logMessage)")
        case .info:
            MLogger.logger.info("🟢 \(logMessage)")
        case .warn:
            MLogger.logger.warning("🟡 \(logMessage)")
        case .error:
            MLogger.logger.error("🔴 \(logMessage)")
        }
        #endif
    }

    // MARK: - 暴露给外部的方法
        
    /// 使用 @autoclosure 的关键点：
    /// 1. 在 Release 模式下，闭包内部的代码根本不会被执行
    /// 2. 编译器会发现 #if DEBUG 为假，从而将整个函数调用直接从二进制中剔除
    
    @inline(__always)
    func info(_ message: @autoclosure () -> String) {
        #if DEBUG
        _log(message(), level: .info)
        #endif
    }

    @inline(__always)
    func warn(_ message: @autoclosure () -> String) {
        #if DEBUG
        _log(message(), level: .warn)
        #endif
    }

    @inline(__always)
    func error(_ message: @autoclosure () -> String) {
        #if DEBUG
        _log(message(), level: .error)
        #endif
    }

    @inline(__always)
    func debug(_ message: @autoclosure () -> String) {
        #if DEBUG
        _log(message(), level: .debug)
        #endif
    }

}
