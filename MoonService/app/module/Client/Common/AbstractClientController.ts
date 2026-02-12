import { Inject } from "@eggjs/tegg";
import { AbstractController } from "app/Common";
import { UserSessionService } from "@/module/Service";
import { ClientContextService } from "../Service/ClientContextService";

export abstract class AbstractClientController extends AbstractController {
    // 用户会话
    @Inject()
    protected session: UserSessionService
    // 客户端会话
    @Inject()
    protected clientCtx: ClientContextService
    
}