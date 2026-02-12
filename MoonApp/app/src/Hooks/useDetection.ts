import { DeviceActions } from "@/Store";
import { useEffect } from "react";
import { Detection, SoundPlayer, TTS } from "react-native-nitro-moon";
import Detecter, { DetecterEventType, DetecterState } from '../Detecter'

// 初始化加载音频播放器
const startAudio    = SoundPlayer('start.mp3')
const errorAudio    = SoundPlayer('error.mp3')
const endAudio      = SoundPlayer('end.mp3')

export function useDetection() {
    // 加载模型
    useEffect(() => {
        Detection.confidenceThreshold = 0.75
        Detection.iouThreshold = 0.45
        Detection.load('general').catch(err => {
            console.log("加载失败")
        })
        return () => Detection.unload()
    }, [])

    // 监听检测结果
    useEffect(() => {

        let detecter = new Detecter()

        // 监听状态
        const removeStateListener = detecter.addListener(DetecterEventType.STATUS, (state) => {
            // 设置运行帧率
            DeviceActions.setCamera('fps', state == DetecterState.RUNING ? 240 : 60)

            switch (state) {
                case DetecterState.IDLE:
                    break;
                case DetecterState.FOCUS:
                    break;
                case DetecterState.RUNING:
                    startAudio.play()
                    break;
                case DetecterState.ANALYZE:
                    break;
                case DetecterState.CUTING:
                    TTS.speak('准备切牌')
                    break;
                case DetecterState.END:
                    endAudio.play()
                    break;
                case DetecterState.FAILURE:
                    errorAudio.play()
                    break
            }
        })

        // 监听切牌次数
        const removeCutingListener = detecter.addListener(DetecterEventType.CUT, (total) => {
            let text = `第 ${ total }次 切牌`
            TTS.speak(text)
        })

        const removeDetectListener = Detection.onDetectResult((result) => {
            detecter.processFrame(result)
        })
        
        return () => {
            removeStateListener()
            removeCutingListener()
            removeDetectListener()
            detecter.destroy()
        }
    }, [])


} 