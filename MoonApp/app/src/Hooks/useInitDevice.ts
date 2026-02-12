import { useToast } from "@/Components/Toast";
import { DeviceActions } from "@/Store";
import { useLayoutEffect } from "react";
import { Tool } from "react-native-nitro-moon";


export function useInitDevice() {
    const toast = useToast()

    useLayoutEffect(() => {
        
        // 初始化音频配置
        DeviceActions.initSoundAndTTS()

        // 监听 App 是否录屏
        Tool.getScreenCaptureStatus().then(
            DeviceActions.setScreenCaptureState
        )
        const removeScreenCaptureListener = Tool.onScreenCaptureStateChange(
            DeviceActions.setScreenCaptureState
        )
        
        // 监听电量变化
        Tool.getBattery().then(
            DeviceActions.setBattery
        )
        const removeBatteryListener = Tool.onBatteryChange(
            DeviceActions.setBattery
        )

        return () => {
            removeScreenCaptureListener()
            removeBatteryListener()
        }
    }, [])

    useLayoutEffect(() => {
        // 初始化设备
        DeviceActions.initDevice().catch(error => {
            console.log(error)
            toast.error(error.message, { duration: 3000 })
        })
        // 加载游戏配置
        console.log('初始化设备')
    }, [])
}