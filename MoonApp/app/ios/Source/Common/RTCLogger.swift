import Foundation
import os

enum LogLevel {
    case debug
    case info
    case warn
    case error
}

class RTCLogger {

    private static let logger = Logger(subsystem: Bundle.main.bundleIdentifier!, category: "AppLog")

    private var ModuleName: String = "App"

    private let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd HH:mm:ss"
        return formatter
    }()

    init(_ name: String) {
        ModuleName = name
    }

    private func log(_ message: Any, level: LogLevel) {
        let timestamp = dateFormatter.string(from: Date())
        let logMessage = "\(timestamp) [\( ModuleName )] - \(message)"
        switch level {
        case .debug:
            RTCLogger.logger.debug("🚧 \(logMessage)")
        case .info:
            RTCLogger.logger.info("🟢 \(logMessage)")
        case .warn:
            RTCLogger.logger.warning("🟡 \(logMessage)")
        case .error:
            RTCLogger.logger.error("🔴 \(logMessage)")
        }
    }

    func info(_ message: String) {
        log(message, level: .info)
    }

    func warn(_ message: String) {
        log(message, level: .warn)
    }

    func error(_ message: String) {
        log(message, level: .error)
    }

    func debug(_ message: String) {
        log(message, level: .debug)
    }

}
