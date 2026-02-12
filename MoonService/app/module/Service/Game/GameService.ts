import { AccessLevel, EggContext, SingletonProto } from "@eggjs/tegg";
import { AbstractService } from "app/Common";
import { Game } from "app/model/Game";

@SingletonProto({ accessLevel: AccessLevel.PUBLIC })
export class GameService extends AbstractService {

    async create(
        ctx: EggContext, 
        params: Pick<Game, 'name' | 'alias' | 'icon'> 
    ) {
    }

    async update(
        ctx: EggContext,
        gameId: string,
        params: Pick<Game, 'name' | 'alias' | 'icon'> 
    ) {
    }

    

}