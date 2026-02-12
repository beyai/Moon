import Foundation
import NitroModules
import AVFoundation


final class SoundManager: HybridSoundManagerSpec {

    static var shared: SoundManager?
    

    override init() {
        super.init()
        SoundManager.shared = self
        audioRouteObserver()
    }
    
    deinit {
        NotificationCenter.default.removeObserver(self)
    }
    

    // MARK: - 私有属性
    private var logger: MLogger = { MLogger("SoundManager") }()
    private let session         = AVAudioSession.sharedInstance()
    private let sessionQueue    = DispatchQueue(label: "SoundManager.Queue")
    private var _outputDevice   = SoundOutputDevice.system
    private var _isMuted:Bool   = false
    private var _volume:Double  = 1
    
    // MARK: - 私有方法
    @inline(__always)
    private func audioRouteObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioRouteChanged(_:)),
            name: AVAudioSession.routeChangeNotification,
            object: nil
        )
    }
    
    @objc func audioRouteChanged(_ notification: Notification) {
        guard _outputDevice == .bluetooth else { return }
        
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue)
        else { return }
        
        self._isMuted = !self.hasBluetoothOutput()
        switch reason {
            case .newDeviceAvailable:
                logger.debug("新的音频设备可用")
                // changeOutputDevice()
            case .oldDeviceUnavailable:
                logger.debug("音频设备断开")
            default: break
        }
    }
    
    /// 是否连接蓝牙设备
    @inline(__always)
    private func hasBluetoothOutput() -> Bool {
        return session.currentRoute.outputs.contains { [.bluetoothA2DP, .bluetoothHFP, .bluetoothLE].contains($0.portType) }
    }
    
    /// 更新音频输出设备
    @inline(__always)
    private func changeOutputDevice() {
        sessionQueue.async { [weak self] in
            guard let self = self else { return }
            do {
                var category: AVAudioSession.Category = .playback
                var options: AVAudioSession.CategoryOptions = []
                var mode: AVAudioSession.Mode = .default
                var port: AVAudioSession.PortOverride = .none
                
                switch self._outputDevice {
                    case .system:
                        break
                    case .speaker:
                        category    = .playAndRecord
                        mode        = .spokenAudio
                        options     = [ .defaultToSpeaker ]
                        port        = .speaker
                    case .receiver:
                        category    = .playAndRecord
                        mode        = .voiceChat
                        port        = .none
                    case .bluetooth:
                        category    = .playAndRecord
                        mode        = .voiceChat
                        options     = [ .allowBluetoothA2DP, .allowBluetoothHFP ]
                        port        = .none
                }
                
                self._isMuted = (self._outputDevice == .bluetooth) ? !self.hasBluetoothOutput() : false
                
                try session.setCategory(category, mode: mode, options: options)
                try session.setActive(true)
                try session.overrideOutputAudioPort(port)
            } catch {
                logger.error(error.localizedDescription)
            }
        }
    }
    
    
    // MARK: 暴露属性、方法
    
    /// 输出设备
    @inline(__always)
    var outputDevice: SoundOutputDevice { _outputDevice }
    
    /// 音量
    @inline(__always)
    var volume: Double { _volume }
    
    /// 是否静音
    @inline(__always)
    var isMuted: Bool { _isMuted }

    /// 设置输出设备
    @inline(__always)
    func setOutputDevice(device: SoundOutputDevice) {
        self._outputDevice = device;
        self.changeOutputDevice()
    }
    
    /// 设置音量
    @inline(__always)
    func setVolume(volume: Double)  {
        _volume = volume.clamped(to: 0...1)
    }

  
}

