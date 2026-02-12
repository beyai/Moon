import type { HybridObject } from 'react-native-nitro-modules'

/** 语音 */
export interface Voice {
    readonly identifier: string;
    readonly name: string;
    readonly language: string;
}

export interface SpeakOptions  {
    /** 语音标识符 */
    identifier?: string;
    /** 语音速率 */
    rate?: number;
    /** 语音音调 */
    pitch?: number;
}

/**
 * 文本转语音模块
 */
export interface SoundTTS extends HybridObject<{ ios: 'swift'}> {
    /** 语音列表 */
    readonly voices: Voice[];
    /** 获取当前语音 */
    readonly voice: Voice;
    /** 语音速率最小值 */
    readonly rateMinValue: number;
    /** 语音速率最大值 */
    readonly rateMaxValue: number;
    /** 语音音调最小值 */
    readonly pitchMinValue: number;
    /** 语音音调最大值 */
    readonly pitchMaxValue: number;
    
    /** 设置语音 */
    setVoice(identifier: string): void;

    /** 设置语音速率 */
    setRate(rate: number): void;

    /** 设置语音音调 */
    setPitch(pitch: number): void;

    /** 朗读 */
    speak(text: string, options?: SpeakOptions): void;

    /** 停止 */
    stop(onWordBoundary?: boolean): void;

}
