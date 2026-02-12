import type { HybridObject } from 'react-native-nitro-modules'
/** 音频输出设备 */
export type SoundOutputDevice = 'System' | 'Speaker' | 'Receiver' | 'Bluetooth'
/**
 * 音频模块
 */
export interface SoundManager extends HybridObject<{ ios: 'swift'}> {
    /** 输出设备 */
    readonly outputDevice: SoundOutputDevice;
    /** 音量 */
    readonly volume: number;
    /** 是否静音 */
    readonly isMuted: boolean;
    /** 设置音频输出设备 */
    setOutputDevice(device: SoundOutputDevice): void;
    /** 设置音量 */
    setVolume(volume: number): void;
}
