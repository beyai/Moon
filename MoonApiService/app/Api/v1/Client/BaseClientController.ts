import { Inject } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { UserSessionService } from "app/Module/User";
import { ClientContextService } from "./Service/ClientContextService";

export abstract class BaseClientController extends BaseController {
    @Inject()
    protected readonly clientCtx: ClientContextService

    @Inject()
    protected readonly session: UserSessionService
}