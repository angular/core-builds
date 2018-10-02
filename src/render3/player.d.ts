import { ComponentInstance, DirectiveInstance, Player } from './interfaces/player';
export declare function addPlayer(ref: ComponentInstance | DirectiveInstance | HTMLElement, player: Player): void;
export declare function getPlayers(ref: ComponentInstance | DirectiveInstance | HTMLElement): Player[];
