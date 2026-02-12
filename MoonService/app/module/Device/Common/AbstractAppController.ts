import { Inject } from "@eggjs/tegg";
import { AbstractController } from "app/Common";
import { UserSessionService } from "@/module/Service";
import { DeviceContextService } from "../Service/DeviceContextService";

export abstract class AbstractAppController extends AbstractController {
    @Inject()
    protected session: UserSessionService
    @Inject()
    protected deviceCtx: DeviceContextService
}