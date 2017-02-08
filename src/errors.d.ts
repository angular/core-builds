/// <reference types="node" />
import { DebugContext } from './view';
export declare const ERROR_TYPE: string;
export declare const ERROR_COMPONENT_TYPE: string;
export declare const ERROR_DEBUG_CONTEXT: string;
export declare const ERROR_ORIGINAL_ERROR: string;
export declare function getType(error: Error): Function;
export declare function getDebugContext(error: Error): DebugContext;
export declare function getOriginalError(error: Error): Error;
