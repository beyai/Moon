public final class VideoFrameHub {
    
    public typealias Receiver = (VideoFrame) -> Void

    private static var receivers: [ObjectIdentifier: AnyObjectReceiver] = [:]
    private static let lock = UnfairLock()

    /// 订阅
    public static func subscribe<Object: AnyObject>(_ object: Object, handler: @escaping (VideoFrame) -> Void) {
        let id = ObjectIdentifier(object)
        lock.execute {
            receivers[id] = AnyObjectReceiver(object: object, handler: handler)
        }
    }

    /// 取消订阅
    public static func unsubscribe<Object: AnyObject>(_ object: Object) {
        let id = ObjectIdentifier(object)
        lock.execute { receivers.removeValue(forKey: id) }
    }

    /// 取消全部订阅
    public static func unsubscribeAll() {
        lock.execute { receivers.removeAll() }
    }

    /// 发布
    public static func publish(_ frame: VideoFrame) {
        let snapshot = lock.execute { receivers.values.compactMap { $0.object != nil ? $0 : nil } }
        for receiver in snapshot {
            receiver.handler(frame)
        }
    }

    private final class AnyObjectReceiver {
        weak var object: AnyObject?
        let handler: (VideoFrame) -> Void
        init(object: AnyObject, handler: @escaping (VideoFrame) -> Void) {
            self.object = object
            self.handler = handler
        }
    }
}
