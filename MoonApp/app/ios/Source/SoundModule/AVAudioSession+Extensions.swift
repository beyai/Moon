import AVFoundation

extension AVAudioSession {
    
    // Mode 映射
    func mapMode(_ name: String) -> AVAudioSession.Mode {
        switch name {
            // 适用: VoIP 应用 (如微信语音)。
            // 必须配合: Category .playAndRecord
            // 副作用:
            //   - 自动开启 .allowBluetoothHFP (电话音质)。
            //   - 只有配合 VoiceProcessingIO 单元 (WebRTC通常会做) 才能获得回声消除 (AEC) 和自动增益 (AGC)。
            //   - 如果不做处理，音量可能会变小。
            case "VoiceChat": return .voiceChat
            // 适用: 视频通话。
            // 必须配合: Category .playAndRecord
            // 副作用:
            //   - 自动开启 .allowBluetoothHFP。
            //   - 自动开启 .defaultToSpeaker (默认免提)。
            //   - 同样需要 VoiceProcessingIO 支持回声消除。
            case "VideoChat": return .videoChat
            // 注意: 文档建议不要直接设置此模式，而是使用 VoiceChat。
            // 这里为了灵活性保留映射，但在控制台输出警告。
            case "GameChat": return .gameChat
            
            // 适用: 拍摄视频时录音。
            // 必须配合: Category .playAndRecord 或 .record
            case "VideoRecording": return .videoRecording
            // 适用: 测分贝、调音器。
            // 特点: 最小化系统信号处理 (关闭增益、EQ)，获取“原声”。
            case "Measurement": return .measurement
            // 适用: 播放长视频/电影。
            // 必须配合: Category .playback
            // 特点: 增强人声对白 (Enhance Dialogue)。
            case "MoviePlayback": return .moviePlayback
            // 适用: 播客 (Podcast)、有声书。
            // 特点: 当被导航语音打断时，会暂停 (Pause) 而不是降低音量 (Duck)。
            case "SpokenAudio": return .spokenAudio
            
            // 默认
            default: return .default
        }
    }
    
    // Category 映射
    func mapCategory(_ name: String) -> AVAudioSession.Category {
        switch name {
            // 场景: 游戏背景音、雨声、模拟器音效。
            // 特点: 服从静音键。默认与 Apple Music 等后台音乐“混音” (Mixes with other music)。
            case "Ambient": return .ambient
            // 场景: 也是背景音，但你希望它开始播放时，把后台的 Apple Music 暂停。
            // 特点: 服从静音键。
            case "SoloAmbient": return .soloAmbient
            // 场景: 音乐播放器、视频 App、TTS 朗读。
            // 特点: **不**服从静音键（静音模式下依然有声）。默认会打断后台音乐。
            case "Playback": return .playback
            // 场景: 录音笔应用。
            // 特点: 只能录，不能播（或者播放时声音很怪）。会自动停止后台音乐。
            case "Record": return .record
            // 场景: VoIP 通话 (微信语音)、即时语音聊天、卡拉OK。
            // 特点: 允许同时输入和输出。音量默认变小（听筒模式），需要配合 defaultToSpeaker 选项切回扬声器。
            case "PlayAndRecord": return .playAndRecord
            // 场景: 专业音频应用 (DJ 软件)。
            // 特点: 允许同时从 USB 声卡和耳机输出不同的音频流。
            // 注意: 这是一个高级选项，需要精细管理 input/output ports。
            case "MultiRoute": return .multiRoute
            //  默认回退到 Playback，保证有声音
            default: return .playback
        }
    }
    
    // CategoryOptions 映射
    func mapCategoryOptions(_ options: [String]) -> AVAudioSession.CategoryOptions {
        var result: AVAudioSession.CategoryOptions = []
        
        // 混音与压低声音
        if options.contains("MixWithOthers") {
            result.insert(.mixWithOthers)
        }
        
        if options.contains("DuckOthers") {
            result.insert(.duckOthers)
        }
        
        // 默认输出到扬声器
        if options.contains("DefaultToSpeaker") {
            result.insert(.defaultToSpeaker)
        }
        
        // 场景: VoIP 通话、低音质录音
        if options.contains("AllowBluetooth") {
            result.insert(.allowBluetoothHFP)
        }
        
        // 场景: 高音质播放 (音乐/TTS)
        if options.contains("AllowBluetoothA2DP") {
            result.insert(.allowBluetoothA2DP)
        }
        
        // 打断语音并混音 (例如导航语音播放时，打断播客)
        if options.contains("InterruptSpokenAudioAndMixWithOthers") {
            result.insert(.interruptSpokenAudioAndMixWithOthers)
        }
        
        return result
   }
}
