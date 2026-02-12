import type { HybridObject } from 'react-native-nitro-modules'
/**
 * 音频播放器
 */
export interface SoundPlayer extends HybridObject<{ ios: 'swift'}> {
    /** 创建实例 */
    setup(filename: string): void;
    /** 播放 */
    play(): void;
    /** 停止 */
    stop(): void;
}


