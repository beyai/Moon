import {  Inject } from "@eggjs/tegg";
import { BaseController } from "app/Common";
import { AdminSessionService } from "./Admin";

export abstract class SystemBaseController extends BaseController {
    
    @Inject()
    protected readonly session: AdminSessionService

    

}