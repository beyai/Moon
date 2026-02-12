import Foundation
import AVFoundation
import NitroModules

final class SoundPlayer : HybridSoundPlayerSpec {
    
    // MARK: - 私有属性
    private var player: AVAudioPlayer?
    
    // MARK: - 方法
    
    /// 创建实例
    func setup(filename: String) throws {
        guard let path = Bundle.main.path(forResource: filename, ofType: nil) else {
            throw CreateError(message: "file not found: \( filename )")
        }
        do {
            try setupPlayer(URL(fileURLWithPath: path))
        } catch {
            throw CreateError(message: error.localizedDescription)
        }
    }
    
    /// 创建播放器
    private func setupPlayer(_ fileURL: URL) throws {
        let player = try AVAudioPlayer(contentsOf: fileURL)
        player.prepareToPlay()
        self.player = player
    }
    
    /// 播放
    func play() throws {
        guard let player = player else {
            throw CreateError(message: "SoundPlayer has not been created.")
        }
        
        MainThreadRun.async {
            guard let sound = SoundManager.shared else { return }
            if sound.isMuted == true { return }
            
            if player.isPlaying { player.stop() }
            player.volume = Float(sound.volume)
            player.currentTime = 0
            player.play()
        }
    }
    
    /// 停止
    func stop() throws {
        guard let player = player else {
            throw CreateError(message: "SoundPlayer has not been created.")
        }
        player.stop()
    }
    
    deinit {
        if let player = player {
            player.stop()
        }
        player = nil
    }
    
}
