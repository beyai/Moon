import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg";
import { AbstractService, SharedKey } from "app/Common";
import { CacheService } from "app/module/Service/Cache";
import { createECDH, ECDH, hkdf } from "crypto";
import { encode, decode } from "cbor";

const CLIENT_SESSION_ECDH = Symbol('ClientSesson.ECDH')

@ContextProto({
    accessLevel: AccessLevel.PRIVATE
})
export class ClientSession extends AbstractService {
    @Inject()
    cacheService: CacheService

    // 桌面客户端配置
    private get desktopClient() {
        return this.config.desktopClient
    }

    get ECDH() {
        if (!this[CLIENT_SESSION_ECDH]) {
            const ecdh = createECDH('prime256v1');
            this[CLIENT_SESSION_ECDH] = ecdh
        }
        return this[CLIENT_SESSION_ECDH]
    }
    
    
   


}