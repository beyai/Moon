import fs from 'fs'
import chokidar from 'chokidar'
import { parse as parseToml } from 'smol-toml'
import { AccessLevel, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { DeviceActiveLevel, DeviceFormat, IceServer, LiveStream, LiveStreamLevels } from 'app/InterFace';

const SETTING_SERVICE_FILEDATA = Symbol("SETTING_SERVICE_DATA.fileData")

@SingletonProto({
    accessLevel: AccessLevel.PUBLIC
})
export class SettingService extends AbstractService {

    // 设置文件路径
    get filePath() {
        return this.config.settingFile
    }
    
    // 配置缓存
    private [SETTING_SERVICE_FILEDATA]: Record<string, any>
    // 全部设置
    private get fileData() {
        if (!this[SETTING_SERVICE_FILEDATA]) {
            // 监听文件变化，重新加载
            chokidar.watch(this.filePath).on('change', (filePath) => {
                this.logger.info(`修改配置文件`, filePath)
                this[SETTING_SERVICE_FILEDATA] = this.load()
            })
            this[SETTING_SERVICE_FILEDATA] = this.load()
        }
        return this[SETTING_SERVICE_FILEDATA]
    }

    /**
     * 加载
     */
    private load() {
        try {
            const content = fs.readFileSync(this.filePath, 'utf8')
            return parseToml(content)
        } catch(error: any) {
            this.logger.error(error.message)
            throw error
        }
    }

    // 视频采集设置配置
    get deviceFormat(): DeviceFormat {
        return this.fileData.deviceFormat ?? {
            width: 1920,
            height: 1080,
            maxFps: 30
        }
    }

    // WebRTC 配置
    get liveStream(): LiveStream {
        return this.fileData.liveStream ?? {
            width: 1920,
            height: 1080,
            framerate: 30,
            bitrate: 1000000,
        }
    }

    // 级别帧率与码率配置
    get liveStreamLevels(): LiveStreamLevels {
        return this.fileData.liveStreamLevels ?? {
            [DeviceActiveLevel.LOW]: { framerate: 30, bitrate: 2500000 },
            [DeviceActiveLevel.MEDIUM]: { framerate: 40, bitrate: 2800000 },
            [DeviceActiveLevel.HIGH]: { framerate: 50, bitrate: 3500000 },

        }
    }

    // TURN 服务器配置
    get iceServers(): IceServer[] {
        return this.fileData.iceServers ?? [
            {
                urls: ['stun:stun2.l.google.com:19302']
            }
        ]
    }
    

}