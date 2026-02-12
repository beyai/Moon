import Foundation
import AVFoundation
import React

@objc(SoundModule)
class SoundModule: RCTEventEmitter {
    
    // MARK: - 属性
    
    let audioQueue = DispatchQueue(label: "AudioManagerQueue")
    
    let audioSession = AVAudioSession.sharedInstance()
    
    private lazy var synthesizer: AVSpeechSynthesizer = {
       let synth = AVSpeechSynthesizer()
        synth.delegate = self;
        return synth
    }()
    
    // 语音
    var defaultVoice: AVSpeechSynthesisVoice?
    
    // 语速
    var defaultRate: Float = 0.5
    
    // 音量
    var defaultVolume: Float = 0.5
    
    // 音频播放器字典
    var audioPlayersDict: [String: AVAudioPlayer] = [:]
    
    // MARK: - 事件
    
    // 是否有监听器
    private var hasListeners = false
    
    // 是否需要在主线程中初始化
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // 当监听器添加时调用
    override func startObserving() {
        hasListeners = true
    }
    
    // 当监听器移除时调用
    override func stopObserving() {
        hasListeners = false
    }
    
    // 支持的事件列表
    override func supportedEvents() -> [String]! {
        return ["onVoiceState", "onAudioState" ]
    }
    
    // 发送事件
    override func sendEvent(withName name: String, body: Any?) {
        if hasListeners {
            super.sendEvent(withName: name, body: body)
        }
    }
    
    // 发送朗读事件
    private func sendVoiceEvent(_ body: [String: Any]) {
        DispatchQueue.main.async {
            self.sendEvent(withName: "onVoiceState", body: body )
        }
    }
    
    // 发送音频状态事件
    private func sendAudioStateEvent(_ body: [String: Any]) {
        DispatchQueue.main.async {
            self.sendEvent(withName: "onAudioState", body: body )
        }
    }
    
    
    // MARK: - 音频会话管理, 中断处理
    
    // 监听中断通知消息
    private func setupInterruptionObserver() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: nil
        )
    }
    
    // 移除中断通知消息
    private func removeInterruptionObserver() {
        NotificationCenter.default.removeObserver(self)
    }
    
    // 处理中断通知消息
    @objc
    private func handleInterruption(notification: Notification) {
        guard let info = notification.userInfo,
              let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }
        
        // 电话进来，暂停播放
        if type == .began {
            sendAudioStateEvent([
                "type": "interruption",
                "status": "began"
            ])
        }
        // 电话结束
        else if type == .ended {
            sendAudioStateEvent([
                "type": "interruption",
                "status": "ended"
            ])
        }
    }
    
    // 释放资源
    private func release() {
        // 清理所有音频播放器
        for (_, player) in audioPlayersDict {
            if player.isPlaying {
                player.stop()
            }
            player.delegate = nil // 防止回调野指针
        }
        audioPlayersDict.removeAll()
        
        // 停止 TTS
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        synthesizer.delegate = nil
        
        try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
    }
    
    // MARK: 初始化
    
    override init() {
        super.init()
        setupInterruptionObserver()
    }
    
    deinit {
        removeInterruptionObserver()
        release()
    }
        
    // MARK: 导出方法
    
    // 同步获取所有支持的语音
    @objc
    func voicesSync() -> [[String:Any]] {
        let voicesData = AVSpeechSynthesisVoice.speechVoices()
        .filter { voice in
            return voice.language.hasPrefix("zh") || voice.language.hasPrefix("yue")
        }
        .map { voice -> [String: Any] in
            return [
                "id": voice.identifier,
                "name": voice.name,
                "language": voice.language,
                "quality": voice.quality == .enhanced ? 500 : 300
            ]
        }
        return voicesData
    }
    
    // 获取所有支持的语音
    @objc
    func voices(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        audioQueue.async {
            let voicesData = self.voicesSync()
            resolve(voicesData)
        }
    }
    
    // 设置音量
    @objc
    func setVolume(_ volume: Float, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        defaultVolume = min( max(volume, 0.0), 1.0)
        resolve(true)
    }
    
    // 设置语音
    @objc
    func setVoice(_ voiceId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        if let defaultVoice = AVSpeechSynthesisVoice(identifier: voiceId) {
            self.defaultVoice = defaultVoice
        }
        resolve(true)
    }
    
    // 设置语音速度
    @objc
    func setVoiceRate(_ rate: Float, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        defaultRate = min( max(rate, AVSpeechUtteranceMinimumSpeechRate), AVSpeechUtteranceMaximumSpeechRate)
        resolve(true)
    }

    // 初始化配置
    @objc
    func initConfig(_ config: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        audioQueue.async { [weak self] in
            guard let self = self else { return }
            
            do {
                let categoryName    = config["categoryName"] as? String ?? "Playback"
                let options         = config["categoryOptions"] as? [String] ?? ["MixWithOthers"]
                let modeName        = config["modeName"] as? String ?? "Default"
                
                
                let category        = self.audioSession.mapCategory(categoryName)
                let categoryOptions = self.audioSession.mapCategoryOptions(options)
                let mode            = self.audioSession.mapMode(modeName)
                
                try self.audioSession.setCategory(category, options: categoryOptions)
                try self.audioSession.setMode(mode)
                try self.audioSession.setActive(true)
                
                // 音量
                if let volume = config["volume"] as? Float {
                    defaultVolume   = volume
                }
                
                // 语音
                if let voiceId = config["voiceId"] as? String {
                    if let defaultVoice = AVSpeechSynthesisVoice(identifier: voiceId) {
                        self.defaultVoice = defaultVoice
                    }
                }
                
                // 语速
                if let rate = config["voiceRate"] as? Float {
                    self.defaultRate = min( max(rate, AVSpeechUtteranceMinimumSpeechRate), AVSpeechUtteranceMaximumSpeechRate)
                }
                
                resolve(true)
            } catch {
                reject("INIT_AUDIO_SESSION_ERROR", "Failed to initialize audio session: \(error.localizedDescription)", error)
            }
        }
    }
    
    // 加载音频文件
    @objc
    func loadAudioFile(_ fileName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        audioQueue.async { [weak self] in
            guard let self = self else { return }
            if self.audioPlayersDict[fileName] != nil {
                resolve(true)
                return
            }
            
            guard let path = Bundle.main.path(forResource: fileName, ofType: nil) else {
                reject("AUDIO_NOT_FOUND", "Audio file not found: \(fileName)", nil)
                return
            }
            
            do {
                let player = try AVAudioPlayer(contentsOf: URL(fileURLWithPath: path))
                player.prepareToPlay()
                self.audioPlayersDict[fileName] = player
                resolve(true)
            } catch {
                reject("AUDIO_LOAD_ERROR", "Failed to load audio file: \(error.localizedDescription)", error)
            }
        }
        
    }
    
    
    // MARK: - 音频播放
    
    // 播放
    @objc
    func playAudio(_ fileName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let player = self.audioPlayersDict[fileName] else {
            reject("AUDIO_NOT_LOADED", "Audio file not loaded yet", nil)
            return
        }
        player.currentTime  = 0
        player.volume       = self.defaultVolume
        DispatchQueue.main.async {
            player.play()
        }
        resolve(true)
    }
    
    // 停止
    @objc
    func stopAudio(_ fileName: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        audioQueue.async { [weak self] in
            guard let self = self, let player = self.audioPlayersDict[fileName] else {
                reject("AUDIO_NOT_LOADED", "Audio file not loaded yet", nil)
                return
            }
            
            player.stop()
            player.currentTime = 0
            resolve(true)
        }
    }
    
    // MARK: 文本朗读
    
    // 朗读
    @objc
    func speakVoice(_ text: String?, voiceId: String?,  resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        guard let text = text?.trimmingCharacters(in: .whitespacesAndNewlines), !text.isEmpty else {
            reject("EMPTY_TEXT", "Text is empty", nil)
            return
        }
        let utterance = AVSpeechUtterance(string: text)
        
        if let voiceId = voiceId, let voice = AVSpeechSynthesisVoice(identifier: voiceId) {
            utterance.voice = voice
        } else {
            utterance.voice = self.defaultVoice
        }
        
        utterance.rate      = self.defaultRate
        utterance.volume    = self.defaultVolume
        
        DispatchQueue.main.async {
            if self.synthesizer.isSpeaking {
                self.synthesizer.stopSpeaking(at: .immediate)
            }
            self.synthesizer.speak(utterance)
        }
        resolve(true)
    }
    
    
    // 停止朗读
    @objc
    func stopVoice(_ onWordBoundary: Bool = false, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        audioQueue.async { [weak self] in
            guard let self = self else { return }
            let boundary: AVSpeechBoundary = onWordBoundary ? .word : .immediate
            self.synthesizer.stopSpeaking(at: boundary)
            resolve(true)
        }
    }
}

// MARK: - TTS 状态回调
extension SoundModule: AVSpeechSynthesizerDelegate {
    
    // 开始
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didStart utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "start",
        ]
        sendVoiceEvent(body)
    }
    
    // 结束
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "finish",
        ]
        sendVoiceEvent(body)
    }
    
    // 暂停
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didPause utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "pause",
        ]
        sendVoiceEvent(body)
    }
    
    // 继续
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didContinue utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "continue",
        ]
        sendVoiceEvent(body)
    }
    
    //取消
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didCancel utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "cancel",
        ]
        sendVoiceEvent(body)
    }
    
    // 进度更新（当前正在朗读的范围）
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, willSpeakRangeOfSpeechString characterRange: NSRange, utterance: AVSpeechUtterance) {
        let body: [String: Any] = [
            "utteranceId": utterance.hash,
            "state": "speaking",
            "startIndex": characterRange.location,
            "length": characterRange.length
        ]
        sendVoiceEvent(body)
    }
    
}
