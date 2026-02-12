import { Inject } from "@eggjs/tegg";
import { AdminSessionService } from "@/module/Service";
import { AbstractController } from "app/Common";

export abstract class AbstractSystemController extends AbstractController {
    @Inject()
    protected session: AdminSessionService
}