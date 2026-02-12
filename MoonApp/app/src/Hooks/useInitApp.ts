import { useLayoutEffect } from "react";
import { Sound, Tool, TTS } from "react-native-nitro-moon";
import { SettingActions, SettingState } from "@/Store";

export function useInitApp() {
    const { 
        voiceId, voiceRate, volume, soundOutput,
    } = SettingState;

    /** 屏幕捕获状态 */
    useLayoutEffect(() => {
        Tool.setIdleTimeDisabled(true) // 屏幕常亮

        Tool.getScreenCaptureStatus().then(SettingActions.setScreenCaptureState)
        const removeScreenCaptureListener = Tool.onScreenCaptureStateChange(SettingActions.setScreenCaptureState)

        Tool.getBattery().then(SettingActions.setBattery)
        const removeBatteryListener = Tool.onBatteryChange(SettingActions.setBattery)
        
        /** 音频 */
        Sound.setOutputDevice(soundOutput) 
        Sound.setVolume(volume)
        TTS.setVoice(voiceId)
        TTS.setRate(voiceRate)

        return () => {
            removeScreenCaptureListener()
            removeBatteryListener()
        }
    }, [])



}