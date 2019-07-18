/**
* @license
* Copyright Google Inc. All Rights Reserved.
*
* Use of this source code is governed by an MIT-style license that can be
* found in the LICENSE file at https://angular.io/license
*/
import { StylingContext } from '../interfaces/styling';
export declare function registerHostDirective(context: StylingContext, directiveIndex: number): void;
/**
 * Queues a styling instruction to be run just before `renderStyling()` is executed.
 */
export declare function enqueueHostInstruction<T extends Function>(context: StylingContext, priority: number, instructionFn: T, instructionFnArgs: ParamsOf<T>): void;
/**
 * Iterates through the host instructions queue (if present within the provided
 * context) and executes each queued instruction entry.
 */
export declare function flushQueue(this: unknown, context: StylingContext): void;
/**
 * Determines whether or not to allow the host instructions queue to be flushed or not.
 *
 * Because the hostBindings function code is unaware of the presence of other host bindings
 * (as well as the template function) then styling is evaluated multiple times per element.
 * To prevent style and class values from being applied to the element multiple times, a
 * flush is only allowed when the last directive (the directive that was registered into
 * the styling context) attempts to render its styling.
 */
export declare function allowFlush(context: StylingContext, directiveIndex: number): boolean;
/**
 * Infers the parameters of a given function into a typed array.
 */
export declare type ParamsOf<T> = T extends (...args: infer T) => any ? T : never;
