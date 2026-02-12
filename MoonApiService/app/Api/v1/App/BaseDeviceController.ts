import { Inject } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { UserSessionService } from "app/Module/User";
import { DeviceContextService } from "./Service/DeviceContextService";

export abstract class BaseDeviceController extends BaseController {
    @Inject()
    protected readonly deviceCtx: DeviceContextService
    @Inject()
    protected readonly session: UserSessionService
}