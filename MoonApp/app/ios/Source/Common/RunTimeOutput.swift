import UIKit
import ObfuscateMacro

final class RunTimeOutput {

    static let shared = RunTimeOutput()

    private var killTimer: DispatchSourceTimer?
    
    private var isRuning = false
    
    private let message = #ObfuscatedString("5分钟试用已结束, 请重新启动！")
    
    // 终止
    static func terminate()  {
        exit(0)
    }

    // 开始
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
        killTimer = t
        t.resume()
    }

    // 取消
    func cancel() {
        killTimer?.cancel()
        killTimer = nil
        isRuning = false
    }
    
    // 执行
    private func exec() {
        DispatchQueue.main.async {
            // 3秒后强制退出
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                RunTimeOutput.terminate()
            }
            
            Alert( message: self.message, buttons: [ ( title: "确定", style: .default, handler: { RunTimeOutput.terminate() } )] )
        }
    }
}
