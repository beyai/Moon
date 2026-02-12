import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { GameMode } from "app/model/GameMode";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GameModeService extends AbstractService {

    async create(
        ctx: EggContext, 
        params: Pick<GameMode, 'gameId' | 'name' | 'config'> 
    ) {
    }

    async update(
        ctx: EggContext,
        modeId: string,
        params: Pick<GameMode, 'gameId' | 'name' | 'config' | 'status'> 
    ) {
    }

    

}