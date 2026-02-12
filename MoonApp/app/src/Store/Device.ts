import { Service } from "@/Service";
import { createStore } from "./BaseStore";
import { MRTC, Sound, Tool, TTS } from "react-native-nitro-moon";
import type {  CameraFilter, CameraOrientation, CameraPosition, MRTCIceServer, MRTCLiveStream, SoundOutputDevice  } from 'react-native-nitro-moon'
import { DeviceFormat } from "@/Service/interface";
import { ThemeMode } from "@/Constraint";
import { UnistylesRuntime } from "react-native-unistyles";
import { Appearance } from "react-native";

// 下一次画面旋转方向
const NextOrientationMap: Record<CameraOrientation, CameraOrientation> = {
    up      : 'left',
    left    : 'down',
    down    : 'right',
    right   : 'up'
}

// 相机位置文本
const PositionTextMap: Record<CameraPosition, string> = {
    'back': '后置',
    'front': '前置'
}

// 画面旋转方向文本
const OrientationTextMap: Record<CameraOrientation, string> = {
    up      : '竖屏',
    left    : '左横屏',
    down    : '竖屏倒',
    right   : '右横屏'
}

export const {
    state: DeviceState,
    actions: DeviceActions,
    useStore: useDeviceStore,
    useSnapshot: useDeviceSnapshot,
} = createStore({
    
    name: 'deviceStore',

    persistKeys: [
        'theme',
        'focus', 'zoom', 'exposure', 'orientation', 'position',
        'soundOutput', 'volume', 'voiceId', 'voiceRate', 'isRequestCamera'
    ],

    state: {
        // 设备唯一标识
        deviceUID   : Tool.getDeviceUID(),
        // 设备码
        deviceCode  : Tool.getDeviceCode(),
        // App 版本号
        version     : Tool.getVersion(),
        // 主题模式
        theme       : 'system' as ThemeMode,
        // 当前颜色模式
        colorScheme : 'light',
        // 是否请求相机权限
        isRequestCamera: false,


        // 音频输出设备
        soundOutput : "System" as SoundOutputDevice,
        // 音量
        volume      : 1.0,
        // 语音ID
        voiceId     : 'com.apple.voice.compact.zh-CN.Tingting',
        // 语速
        voiceRate   : 0.5,
        // 电量
        battery     : 100,
        // 屏幕捕获状态
        screenCaptureState: false,
        // 曝光度
        exposure    : 1,
        // 焦距
        focus       : 0.5,
        // 放大
        zoom        : 1,
        // 帧率
        fps         : 60,
        // 亮度
        brightness  : 1,
        // 旋转画面
        orientation : 'up' as CameraOrientation,
        // 相机位置
        position    : 'back' as CameraPosition,

        //是否激活
        isActive    : false,
        // 激活级别
        activeLeavel: 'high',
        // 激活剩余天数
        countDays   : 0,
        // TURN 服务器
        iceServers  : [] as MRTCIceServer[],
        // 直播流配置
        liveStream  : null as MRTCLiveStream | null,
        // 相机筛选画面大小
        deviceFormat: { width: 1280, height: 1080, maxFps: 240 } as DeviceFormat,

    },

    getters: {

        // 当前相机筛选格式
        deviceFilter(): CameraFilter {
            const { deviceFormat, position } = this;
            return {
                position,
                width: deviceFormat.width,
                height: deviceFormat.height,
                maxFps: position == 'front' ? 120 : 240
            }
        },

        // 相机方向提示文本
        orientationText() {
            const { position, orientation } = this
            return PositionTextMap[position] + OrientationTextMap[orientation]
        }
    },

    actions: {

        // 设备初始化
        async initDevice() {
            // 初始化设备状态
            Tool.setDeviceStatus(false)

            // 加载设备配置
            const { data }      = await Service.deviceInit()
            this.isActive       = data.isActive
            this.activeLeavel   = data.activeLevel
            this.countDays      = data.countDays
            this.iceServers     = data.iceServers
            this.liveStream     = data.liveStream
            this.deviceFormat   = data.deviceFormat
            
            // 设备设备状态
            Tool.setDeviceStatus(data.isActive)
            // 设置STUN//TURN服务器信息
            MRTC.setIceServers(data.iceServers)
            // 设置直播流信息
            MRTC.setLiveStream(data.liveStream)
        },

        // 设置主题模式
        setThemeMode(mode: ThemeMode) {
            this.theme = mode
        },

        // 翻转相机
        filpCamera() {
            const { position } = this
            if (position == 'back') {
                this.position = 'front'
            } else {
                this.position = 'back'
            }
        },

        // 设置画面方向
        rotateOrientation() {
            const { orientation } = this
            this.orientation = NextOrientationMap[orientation]
        },

        // 设置相机
        setCamera(
            key: 'exposure' | 'focus' | 'zoom' | 'fps' | 'brightness', 
            value: number
        ) {
            this[key] = value
        },

        // 初始化音频输出与播报
        initSoundAndTTS() {
            const { soundOutput, volume, voiceId, voiceRate } = this
            Sound.setOutputDevice(soundOutput)
            Sound.setVolume(volume)
            TTS.setVoice(voiceId)
            TTS.setRate(voiceRate)
        },

        // 设置音频输出设备
        setSoundOutput(device: SoundOutputDevice) {
            this.soundOutput = device;
            Sound.setOutputDevice(device)
        },
        // 设置音量
        setVolume(value: number) {
            this.volume = value
            Sound.setVolume(value)
        },
        // 设置语音
        setVoice(value: string) {
            this.voiceId = value;
            TTS.setVoice(value)
        },
        // 设置语速
        setVoiceRate(value: number) {
            this.voiceRate = value
            TTS.setRate(value)
        },
        // 设置电量
        setBattery(value: number) {
            this.battery = value
        },
        // 设置屏幕捕获状态
        setScreenCaptureState(state: boolean) {
            this.screenCaptureState = state
        }
    }
})


