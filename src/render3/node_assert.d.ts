import { LNode, TNodeType } from './interfaces/node';
export declare function assertNodeType(node: LNode, type: TNodeType): void;
export declare function assertNodeOfPossibleTypes(node: LNode, ...types: TNodeType[]): void;
