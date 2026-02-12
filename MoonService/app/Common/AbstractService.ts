import { EggContext, EggQualifier, EggType, InitTypeQualifier, Inject, ObjectInitType } from "@eggjs/tegg";
import { EggAppConfig, EggLogger } from "egg";
import { GeoIP } from "./Utils";

const ABSTRACT_SERVICE_GEOIP = Symbol('ABSTRACT_SERVICE_GEOIP.geoip')

export abstract class AbstractService {

    @Inject()
    protected logger: EggLogger

    // 配置
    @Inject()
    protected config: EggAppConfig

    // 注入模型
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly model: EggContext['model']
    
    // 注入错误
    // @Inject()
    // @EggQualifier(EggType.CONTEXT)
    // protected readonly throw: EggContext['throw']

    /**
     * 获取IP归属地
     */
    protected get geoip(): GeoIP {
        if (!this[ABSTRACT_SERVICE_GEOIP]) {
            const { db } = this.config.geoip
            this[ABSTRACT_SERVICE_GEOIP] = GeoIP.getInstance(db)
        }
        return this[ABSTRACT_SERVICE_GEOIP]
    }

}