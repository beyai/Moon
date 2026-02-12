import { Cut } from "./Cut";
import { Game } from "./Game";
import { Trick } from "./Trick";

export type PlayInfoConfig = {
    category: Game;
    cutCard: Cut;
    cards: number[];
    trick: Trick;
    isShuffleFull: boolean;
}

export type PlayInfo = {
    playId: string;
    gameId: string;
    deviceCode: string;
    name: string;
    config: PlayInfoConfig
}

export type GameInfo = {
    gameId: string;
    name: string;
    alias: string;
    icon: string;
}