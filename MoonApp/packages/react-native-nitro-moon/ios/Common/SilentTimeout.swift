import UIKit

final class SilentTimeout {

    static let shared = SilentTimeout()

    private var timer: DispatchSourceTimer?
    
    private var isRuning = false
    
    private init() {}
    
    // 开始
    @inline(__always)
    func start() {
        guard isRuning == false else {
            return
        }
        
        isRuning = true
        let t = DispatchSource.makeTimerSource(queue: .main)
        t.schedule(deadline: .now() + 300 )
        t.setEventHandler { [weak self] in
            self?.exec()
        }
        timer = t
        t.resume()
    }

    // 取消
    @inline(__always)
    func cancel() {
        timer?.cancel()
        timer = nil
        isRuning = false
    }
    
    // 执行
    @inline(__always)
    private func exec() {
        MainThreadRun.async {
            // 3秒后强制退出
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                NitroMoonBridge.silentQuit()
            }
            
            let confirmBtn = AlertButton(
                title: "确定",
                style: .default,
                handler: {
                    NitroMoonBridge.silentQuit()
                }
            )
            
            Alert(
                message: SecurityConst.SilentTips,
                buttons: [
                    confirmBtn
                ]
            )
        }
    }
}
