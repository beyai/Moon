import _ from 'lodash'
import { AbstractService, CryptedData } from "app/Common";
import { AccessLevel, ContextProto, EggContext, Inject } from "@eggjs/tegg";
import { CacheService } from "../Cache";
import { randomBytes } from 'crypto';
import { ClientSession } from './ClientSession';

interface ClientNegotiateBody {
    deviceUID: string;
    nocne: string;
    tag: string;
    body: string;
    payload: string;
}



@ContextProto({
    accessLevel: AccessLevel.PUBLIC
})
export class ClientSessionService extends AbstractService {
    @Inject()
    private readonly Cache: CacheService
    @Inject()
    private readonly ClientSession: ClientSession
    
    // 桌面客户端配置
    private get desktopClient() {
        return this.config.desktopClient
    }

    // 挑战因子过期时间
    private get challengeTTL() {
        return 60
    }

    // 防重放时间窗口
    private get timeWin() {
        return this.config.replayTimeWin ?? {
            pastWin: 5 * 60,
            futureWin: 60
        }
    }

    /**
     * 验证挑战因子
     */
    private async verifyChallenge(challenge: string): Promise<boolean> {
        let hasChallenge = await this.Cache.has(challenge)
        if (!hasChallenge) return false;
        await this.Cache.del(challenge)
        return true
    }

    /**
     * 生成挑战因子
     */
    async generateChallenge(): Promise<string> {
        const challenge = randomBytes(16).toString('hex')
        await this.Cache.set(challenge, 1, this.challengeTTL)
        return challenge
    }

    /**
     * 验证时间戳
     * @param timestamp 客户端请求时间, 单位秒
     */
    private async validateTimestamp(timestamp: number) {
        const now = Math.ceil(Date.now() / 1000)
        const { pastWin, futureWin } = this.timeWin
        if (now - timestamp > pastWin) {
            throw new Error(`请求已过期`)
        }
        if (timestamp - now > futureWin) {
            throw new Error(`时间异常`)
        }
        return true
    }

    /**
     * 协商
     * @param ctx 请求上下文
     */
    async negotiate( ctx: EggContext ) {
        const body = CryptedData.fromJSON(ctx.request.body)
        
        console.log(body)
    }
   
    
}