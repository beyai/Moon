import { EggContext, EggQualifier, EggType, Inject } from "@eggjs/tegg";
import { EggAppConfig, EggLogger } from "egg";

export abstract class AbstractController {

    @Inject()
    protected logger: EggLogger

    // 配置
    @Inject()
    protected config: EggAppConfig
    
    // 注入错误
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly throw: EggContext['throw']
}