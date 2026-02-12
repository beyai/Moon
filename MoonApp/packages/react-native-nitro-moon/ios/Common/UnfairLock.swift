import os

public final class UnfairLock {
    // MARK: Private

    private let pointer: os_unfair_lock_t
    
    // MARK: Lifecycle

    public init() {
        self.pointer = .allocate(capacity: 1)
        self.pointer.initialize(to: os_unfair_lock())
    }

    deinit {
        self.pointer.deinitialize(count: 1)
        self.pointer.deallocate()
    }

    // MARK: Public
    @inline(__always)
    func lock() {
        os_unfair_lock_lock(self.pointer)
    }
    
    @inline(__always)
   func unlock() {
        os_unfair_lock_unlock(self.pointer)
    }
    
    @inline(__always)
    func tryLock() -> Bool {
        os_unfair_lock_trylock(self.pointer)
    }

    @discardableResult
    @inline(__always)
    func execute<T>(_ action: () -> T) -> T {
        self.lock()
        defer { self.unlock() }
        return action()
    }

    @discardableResult
    @inline(__always)
    func execute<T>(_ action: () throws -> T) rethrows -> T {
        self.lock()
        defer { self.unlock() }
        return try action()
    }
    
}
