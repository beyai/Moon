import { NitroModules } from 'react-native-nitro-modules'
import type { SoundManager, SoundOutputDevice as SoundOutputDeviceType } from '../specs/Sound/SoundManager.nitro'
import type { SoundPlayer as SoundPlayerType } from '../specs/Sound/SoundPlayer.nitro'
import type { SoundTTS } from '../specs/Sound/SoundTTS.nitro'

export type SoundOutputDevice = SoundOutputDeviceType
export type SoundOutputDeviceItem = {
    value: SoundOutputDevice;
    label: string;
}
export const SoundOutputDeviceData = [
    { value: "System", label: '默认' },
    { value: "Speaker", label: '扬声器' },
    { value: "Bluetooth", label: '蓝牙耳机' },
    { value: "Receiver", label: '听筒' },
] as SoundOutputDeviceItem[]

export function getOutputDeviceLabel(device: SoundOutputDevice) {
    const item = SoundOutputDeviceData.find(item => item.value === device)
    return item?.label || device
}

/** 音频管理器 */
export const Sound  = NitroModules.createHybridObject<SoundManager>('SoundManager')
/** 文本转语音 */
export const TTS    = NitroModules.createHybridObject<SoundTTS>('SoundTTS')

/** 音频播放器 */
export function SoundPlayer(filename: string) {
    const instance = NitroModules.createHybridObject<SoundPlayerType>('SoundPlayer')
    try {
        instance.setup(filename)
        return {
            filename,
            play: () => instance.play(),
            stop: () => instance.stop(),
        }
    } catch (error) {
        instance.dispose()
        throw new Error('SoundPlayer createInstance error')
    }
}


