import Foundation
import NitroModules
import AVFoundation


class SoundTTS: HybridSoundTTSSpec {
    
    private let logger: MLogger = { MLogger("SoundTTS") }()

    // MARK: - 私有属性
    private var synthesizer: AVSpeechSynthesizer?
    private var deviceVoice         = Voice( identifier: "com.apple.voice.compact.zh-CN.Tingting", name: "Tingting", language: "zh-CN" )
    private var identifier          = "com.apple.voice.compact.zh-CN.Tingting"
    
    private var _voices: [Voice]    = []
    private var rate: Double        = 0.5
    private var pitch: Double       = 1.0
    
    // MARK: - 只读属性
    
    var voices: [Voice] { _voices }
    var voice: Voice {
        self.voices.first { $0.identifier == identifier } ?? self.deviceVoice
    }
    /// 语音速率最小值
    var rateMinValue: Double { Double(AVSpeechUtteranceMinimumSpeechRate) }
    /// 语音速率最大值
    var rateMaxValue: Double { Double(AVSpeechUtteranceMaximumSpeechRate) }
    /// 语音音调最小值
    var pitchMinValue: Double { 0.5 }
    /// 语音音调最大值
    var pitchMaxValue: Double { 1.5 }
    
    
    override init() {
        super.init()
        setupSynthesizer()
        initLoadVoiceList()
    }

    // MARK: - 方法
    
    private func getVoice(identifier: String) -> AVSpeechSynthesisVoice? {
        if let voice = AVSpeechSynthesisVoice(identifier: identifier) {
            return voice
        } else {
            return AVSpeechSynthesisVoice(language: "zh-CN")
        }
    }
    
    private func setupSynthesizer() {
        MainThreadRun.async { [weak self] in
            guard let self = self else { return }
            
            let synthesizer = AVSpeechSynthesizer()
            synthesizer.usesApplicationAudioSession = true
            self.synthesizer = synthesizer
            
            let utterance = AVSpeechUtterance(string: "preload")
            
            utterance.voice              = self.getVoice(identifier: self.identifier)
            utterance.rate               = 1.0
            utterance.pitchMultiplier    = 1.0
            utterance.volume             = 0
            utterance.preUtteranceDelay  = TimeInterval(0)
            utterance.postUtteranceDelay = TimeInterval(0)
            
            synthesizer.speak(utterance)
            
            self.logger.debug("初始化+预加载")
        }
    }
    
    /// 初始化语音
    private func initLoadVoiceList() {
        MainThreadRun.async { [weak self] in
            guard let self = self else { return }
            let voices = AVSpeechSynthesisVoice.speechVoices()
                .filter { voice in
                    ( voice.language.hasPrefix("zh") || voice.language.hasPrefix("yue") )
                    && voice.identifier.contains(".voice.")
                }
                .map { voice -> Voice in
                    Voice(
                        identifier: voice.identifier,
                        name: voice.name,
                        language: voice.language
                    )
                }
            self._voices = voices
            self.logger.debug("初始化语音")
        }
    }
    
    /// 设置语音
    func setVoice(identifier: String) {
        self.identifier = identifier;
    }
    
    /// 设置语速
    func setRate(rate: Double) {
        
        let minVal = Double(AVSpeechUtteranceMinimumSpeechRate)
        let maxVal = Double(AVSpeechUtteranceMaximumSpeechRate)
        
        self.rate = rate.clamped(to: minVal...maxVal)
    }
    
    /// 设置音调
    func setPitch(pitch: Double) {
        self.pitch = pitch.clamped(to: 0.5...1.5)
    }
    
    // 朗读文本
    func speak(text: String, options: SpeakOptions?) {
        
        MainThreadRun.async { [weak self] in
            guard let self = self, let sound = SoundManager.shared else { return }
            if sound.isMuted == true {
                self.logger.debug("静音状态，跳过朗读: \(text)")
                return
            }
            
            guard let synthesizer = self.synthesizer else { return }
            if synthesizer.isSpeaking {
                synthesizer.stopSpeaking(at: .immediate)
            }
            
            let utterance   = AVSpeechUtterance(string: text)
            
            let identifier  = options?.identifier ?? self.identifier
            let rate        = options?.rate ?? self.rate
            let pitch       = options?.pitch ??  self.pitch
     
            utterance.voice                 = self.getVoice(identifier: identifier)
            utterance.rate                  = Float(rate)
            utterance.pitchMultiplier       = Float(pitch)
            utterance.volume                = Float(sound.volume)
            utterance.preUtteranceDelay     = TimeInterval(0)
            utterance.postUtteranceDelay    = TimeInterval(0)
            
            synthesizer.speak(utterance)
            self.logger.debug("朗读: \( text )")
        }
    }
    
    /// 停止朗读
    func stop(onWordBoundary: Bool?)  {
        MainThreadRun.async { [weak self] in
            guard let self = self, let synthesizer = self.synthesizer else { return }
            if synthesizer.isSpeaking {
                synthesizer.stopSpeaking(at: onWordBoundary == true ? .word : .immediate)
            }
        }
    }

}
