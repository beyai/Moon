import { EggContext, EggQualifier, EggType, Inject } from "@eggjs/tegg";
import { CoreBase } from "./CoreBase";
import { EggHttpClient } from "egg";


export abstract class BaseService extends CoreBase {

    /**
     * 网络请求客户端
     */
    @Inject()
    protected readonly httpclient: EggHttpClient;

    /**
     * 数据模型
     */
    @Inject()
    @EggQualifier(EggType.CONTEXT)
    protected readonly model: EggContext['model']
    

    
}