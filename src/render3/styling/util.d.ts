/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import { StyleSanitizeFn } from '../../sanitization/style_sanitizer';
import { LContainer } from '../interfaces/container';
import { LContext } from '../interfaces/context';
import { TNode } from '../interfaces/node';
import { Player, PlayerContext } from '../interfaces/player';
import { RElement } from '../interfaces/renderer';
import { InitialStylingValues, StylingContext } from '../interfaces/styling';
import { LView, RootContext } from '../interfaces/view';
export declare const ANIMATION_PROP_PREFIX = "@";
export declare function createEmptyStylingContext(wrappedElement?: LContainer | LView | RElement | null, sanitizer?: StyleSanitizeFn | null, initialStyles?: InitialStylingValues | null, initialClasses?: InitialStylingValues | null): StylingContext;
/**
 * Allocates (registers) a directive into the directive registry within the provided styling
 * context.
 *
 * For each and every `[style]`, `[style.prop]`, `[class]`, `[class.name]` binding
 * (as well as static style and class attributes) a directive, component or template
 * is marked as the owner. When an owner is determined (this happens when the template
 * is first passed over) the directive owner is allocated into the styling context. When
 * this happens, each owner gets its own index value. This then ensures that once any
 * style and/or class binding are assigned into the context then they are marked to
 * that directive's index value.
 *
 * @param context the target StylingContext
 * @param directiveRef the directive that will be allocated into the context
 * @returns the index where the directive was inserted into
 */
export declare function allocateDirectiveIntoContext(context: StylingContext, directiveRef: any | null): number;
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 */
export declare function allocStylingContext(element: RElement | null, templateStyleContext: StylingContext): StylingContext;
/**
 * Retrieve the `StylingContext` at a given index.
 *
 * This method lazily creates the `StylingContext`. This is because in most cases
 * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
 * every style declaration such as `<div style="color: red">` would result `StyleContext`
 * which would create unnecessary memory pressure.
 *
 * @param index Index of the style allocation. See: `elementStyling`.
 * @param viewData The view to search for the styling context
 */
export declare function getStylingContext(index: number, viewData: LView): StylingContext;
export declare function isAnimationProp(name: string): boolean;
export declare function hasClassInput(tNode: TNode): boolean;
export declare function hasStyleInput(tNode: TNode): boolean;
export declare function forceClassesAsString(classes: string | {
    [key: string]: any;
} | null | undefined): string;
export declare function forceStylesAsString(styles: {
    [key: string]: any;
} | null | undefined): string;
export declare function addPlayerInternal(playerContext: PlayerContext, rootContext: RootContext, element: HTMLElement, player: Player | null, playerContextIndex: number, ref?: any): boolean;
export declare function getPlayersInternal(playerContext: PlayerContext): Player[];
export declare function getOrCreatePlayerContext(target: {}, context?: LContext | null): PlayerContext | null;
export declare function getPlayerContext(stylingContext: StylingContext): PlayerContext | null;
export declare function allocPlayerContext(data: StylingContext): PlayerContext;
export declare function throwInvalidRefError(): void;
