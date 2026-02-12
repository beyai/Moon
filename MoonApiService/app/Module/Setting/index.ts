import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { BaseService, Toml } from "app/Common";
import { DeviceActiveLevel } from "app/Enum";
import { DeviceFormat, IceServer, LiveStream, LiveStreamLevels } from "./interface";

const SETTING_SERVICE_INSTANCE = Symbol("SettingService.instance")
@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class SettingService extends BaseService {

    private [SETTING_SERVICE_INSTANCE]: Toml

    /**
     * Toml 文件实例
     */
    get instance() {
        if (!this[SETTING_SERVICE_INSTANCE]) {
            this[SETTING_SERVICE_INSTANCE] = new Toml(this.config.settingFile)
        }
        return this[SETTING_SERVICE_INSTANCE]
    }

    /**
     * 实例数据
     */
    get raw() {
        return this.instance.data as Record<string, any>
    }

    // 视频采集设置配置
    get deviceFormat(): DeviceFormat {
        return this.raw.deviceFormat ?? {
            width: 1920,
            height: 1080,
            maxFps: 30
        }
    }

    // WebRTC 配置
    get liveStream(): LiveStream {
        return this.raw.liveStream ?? {
            width: 1920,
            height: 1080,
            framerate: 30,
            bitrate: 1000000,
        }
    }

    // 级别帧率与码率配置
    get liveStreamLevels(): LiveStreamLevels {
        return this.raw.liveStreamLevels ?? {
            [DeviceActiveLevel.LOW]: { framerate: 30, bitrate: 2500000 },
            [DeviceActiveLevel.MEDIUM]: { framerate: 40, bitrate: 2800000 },
            [DeviceActiveLevel.HIGH]: { framerate: 50, bitrate: 3500000 },

        }
    }

    // TURN 服务器配置
    get iceServers(): IceServer[] {
        return this.raw.iceServers ?? [
            {
                urls: ['stun:stun2.l.google.com:19302']
            }
        ]
    }

    // 客户端 配置
    get client() {
        return this.raw.client ?? {
            appMinVersion: '1.0.0'
        }
    }


}