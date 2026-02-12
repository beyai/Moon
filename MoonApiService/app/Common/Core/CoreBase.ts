import bcryptjs from 'bcryptjs'
import { BackgroundTaskHelper, EggContext, EggQualifier, EggType, Inject } from "@eggjs/tegg";
import { EggAppConfig, EggLogger } from "egg";


export abstract class CoreBase {

    /**
     * 应用配置
     */
    @Inject()
    protected config: EggAppConfig;

    /**
     * 后台任务
     */
    @Inject()
    protected readonly backgroundTask: BackgroundTaskHelper

    /**
     * IP归属地详情
     */
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly geoip: EggContext['geoip']
    
    /**
     * IP归属地
     */
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly ipAddr: EggContext['ipAddr']

    /**
     * 错误
     */
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly throw: EggContext['throw']

    /**
     * 日志
     */
    @Inject()
    protected logger: EggLogger

    /**
     * 加密
     * @param password 密码
     */
    async encryptPassword(password: string): Promise<string> {
        return bcryptjs.hash(password, 10)
    }

    /**
     * 验证密码
     * @param  password 密码
     * @param hash 加密后的密码
     */
    async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcryptjs.compare(password, hash)
    }
    
}