/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../../util/ng_dev_mode';
import { getLContext } from '../context_discovery';
import { HEADER_OFFSET, HOST } from '../interfaces/view';
import { getTNode } from '../util';
import { CorePlayerHandler } from './core_player_handler';
/** @type {?} */
export const ANIMATION_PROP_PREFIX = '@';
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStyles
 * @param {?=} initialClasses
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStyles, initialClasses) {
    /** @type {?} */
    const context = [
        0,
        (/** @type {?} */ ([])),
        initialStyles || [null, null],
        initialClasses || [null, null],
        [0, 0],
        element || null,
        [0],
        [0],
        null,
    ];
    allocateDirectiveIntoContext(context, null);
    return context;
}
/**
 * @param {?} context
 * @param {?} directiveRef
 * @return {?}
 */
export function allocateDirectiveIntoContext(context, directiveRef) {
    // this is a new directive which we have not seen yet.
    context[1 /* DirectiveRegistryPosition */].push(directiveRef, -1, false, null);
}
/**
 * Used clone a copy of a pre-computed template of a styling context.
 *
 * A pre-computed template is designed to be computed once for a given element
 * (instructions.ts has logic for caching this).
 * @param {?} element
 * @param {?} templateStyleContext
 * @return {?}
 */
export function allocStylingContext(element, templateStyleContext) {
    // each instance gets a copy
    /** @type {?} */
    const context = (/** @type {?} */ ((/** @type {?} */ (templateStyleContext.slice()))));
    // the HEADER values contain arrays which also need
    // to be copied over into the new context
    for (let i = 0; i < 9 /* SingleStylesStartPosition */; i++) {
        /** @type {?} */
        const value = templateStyleContext[i];
        if (Array.isArray(value)) {
            context[i] = value.slice();
        }
    }
    context[5 /* ElementPosition */] = element;
    // this will prevent any other directives from extending the context
    context[0 /* MasterFlagPosition */] |= 16 /* BindingAllocationLocked */;
    return context;
}
/**
 * Retrieve the `StylingContext` at a given index.
 *
 * This method lazily creates the `StylingContext`. This is because in most cases
 * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
 * every style declaration such as `<div style="color: red">` would result `StyleContext`
 * which would create unnecessary memory pressure.
 *
 * @param {?} index Index of the style allocation. See: `elementStyling`.
 * @param {?} viewData The view to search for the styling context
 * @return {?}
 */
export function getStylingContext(index, viewData) {
    /** @type {?} */
    let storageIndex = index;
    /** @type {?} */
    let slotValue = viewData[storageIndex];
    /** @type {?} */
    let wrapper = viewData;
    while (Array.isArray(slotValue)) {
        wrapper = slotValue;
        slotValue = (/** @type {?} */ (slotValue[HOST]));
    }
    if (isStylingContext(wrapper)) {
        return (/** @type {?} */ (wrapper));
    }
    else {
        // This is an LView or an LContainer
        /** @type {?} */
        const stylingTemplate = getTNode(index - HEADER_OFFSET, viewData).stylingTemplate;
        if (wrapper !== viewData) {
            storageIndex = HOST;
        }
        return wrapper[storageIndex] = stylingTemplate ?
            allocStylingContext(slotValue, stylingTemplate) :
            createEmptyStylingContext(slotValue);
    }
}
/**
 * @param {?} value
 * @return {?}
 */
export function isStylingContext(value) {
    // Not an LView or an LContainer
    if (Array.isArray(value) && value.length >= 9 /* SingleStylesStartPosition */) {
        return typeof value[0 /* MasterFlagPosition */] === 'number' &&
            value[3 /* InitialClassValuesPosition */][0 /* DefaultNullValuePosition */] === null;
    }
    return false;
}
/**
 * @param {?} name
 * @return {?}
 */
export function isAnimationProp(name) {
    return name[0] === ANIMATION_PROP_PREFIX;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasClassInput(tNode) {
    return (tNode.flags & 8 /* hasClassInput */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasStyleInput(tNode) {
    return (tNode.flags & 16 /* hasStyleInput */) !== 0;
}
/**
 * @param {?} classes
 * @return {?}
 */
export function forceClassesAsString(classes) {
    if (classes && typeof classes !== 'string') {
        classes = Object.keys(classes).join(' ');
    }
    return ((/** @type {?} */ (classes))) || '';
}
/**
 * @param {?} styles
 * @return {?}
 */
export function forceStylesAsString(styles) {
    /** @type {?} */
    let str = '';
    if (styles) {
        /** @type {?} */
        const props = Object.keys(styles);
        for (let i = 0; i < props.length; i++) {
            /** @type {?} */
            const prop = props[i];
            str += (i ? ';' : '') + `${prop}:${styles[prop]}`;
        }
    }
    return str;
}
/**
 * @param {?} playerContext
 * @param {?} rootContext
 * @param {?} element
 * @param {?} player
 * @param {?} playerContextIndex
 * @param {?=} ref
 * @return {?}
 */
export function addPlayerInternal(playerContext, rootContext, element, player, playerContextIndex, ref) {
    ref = ref || element;
    if (playerContextIndex) {
        playerContext[playerContextIndex] = player;
    }
    else {
        playerContext.push(player);
    }
    if (player) {
        player.addEventListener(200 /* Destroyed */, () => {
            /** @type {?} */
            const index = playerContext.indexOf(player);
            /** @type {?} */
            const nonFactoryPlayerIndex = playerContext[0 /* NonBuilderPlayersStart */];
            // if the player is being removed from the factory side of the context
            // (which is where the [style] and [class] bindings do their thing) then
            // that side of the array cannot be resized since the respective bindings
            // have pointer index values that point to the associated factory instance
            if (index) {
                if (index < nonFactoryPlayerIndex) {
                    playerContext[index] = null;
                }
                else {
                    playerContext.splice(index, 1);
                }
            }
            player.destroy();
        });
        /** @type {?} */
        const playerHandler = rootContext.playerHandler || (rootContext.playerHandler = new CorePlayerHandler());
        playerHandler.queuePlayer(player, ref);
        return true;
    }
    return false;
}
/**
 * @param {?} playerContext
 * @return {?}
 */
export function getPlayersInternal(playerContext) {
    /** @type {?} */
    const players = [];
    /** @type {?} */
    const nonFactoryPlayersStart = playerContext[0 /* NonBuilderPlayersStart */];
    // add all factory-based players (which are apart of [style] and [class] bindings)
    for (let i = 1 /* PlayerBuildersStartPosition */ + 1 /* PlayerOffsetPosition */; i < nonFactoryPlayersStart; i += 2 /* PlayerAndPlayerBuildersTupleSize */) {
        /** @type {?} */
        const player = (/** @type {?} */ (playerContext[i]));
        if (player) {
            players.push(player);
        }
    }
    // add all custom players (not apart of [style] and [class] bindings)
    for (let i = nonFactoryPlayersStart; i < playerContext.length; i++) {
        players.push((/** @type {?} */ (playerContext[i])));
    }
    return players;
}
/**
 * @param {?} target
 * @param {?=} context
 * @return {?}
 */
export function getOrCreatePlayerContext(target, context) {
    context = context || (/** @type {?} */ (getLContext(target)));
    if (!context) {
        ngDevMode && throwInvalidRefError();
        return null;
    }
    const { lView, nodeIndex } = context;
    /** @type {?} */
    const stylingContext = getStylingContext(nodeIndex, lView);
    return getPlayerContext(stylingContext) || allocPlayerContext(stylingContext);
}
/**
 * @param {?} stylingContext
 * @return {?}
 */
export function getPlayerContext(stylingContext) {
    return stylingContext[8 /* PlayerContext */];
}
/**
 * @param {?} data
 * @return {?}
 */
export function allocPlayerContext(data) {
    return data[8 /* PlayerContext */] =
        [5 /* SinglePlayerBuildersStartPosition */, null, null, null, null];
}
/**
 * @return {?}
 */
export function throwInvalidRefError() {
    throw new Error('Only elements that exist in an Angular application can be used for animations');
}
/**
 * @param {?} attrs
 * @return {?}
 */
export function hasStyling(attrs) {
    for (let i = 0; i < attrs.length; i++) {
        /** @type {?} */
        const attr = attrs[i];
        if (attr == 1 /* Classes */ || attr == 2 /* Styles */)
            return true;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyx3QkFBd0IsQ0FBQztBQUdoQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFPakQsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQXFCLE1BQU0sb0JBQW9CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVqQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7QUFFeEQsTUFBTSxPQUFPLHFCQUFxQixHQUFHLEdBQUc7Ozs7Ozs7O0FBRXhDLE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsT0FBeUIsRUFBRSxTQUFrQyxFQUM3RCxhQUEyQyxFQUMzQyxjQUE0Qzs7VUFDeEMsT0FBTyxHQUFtQjtRQUM5QixDQUFDO1FBQ0QsbUJBQUEsRUFBRSxFQUFPO1FBQ1QsYUFBYSxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQztRQUM3QixjQUFjLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO1FBQzlCLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNOLE9BQU8sSUFBSSxJQUFJO1FBQ2YsQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUk7S0FDTDtJQUNELDRCQUE0QixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1QyxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsNEJBQTRCLENBQUMsT0FBdUIsRUFBRSxZQUF3QjtJQUM1RixzREFBc0Q7SUFDdEQsT0FBTyxtQ0FBd0MsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FB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QkFBMEI7WUFBRSxPQUFPLElBQUksQ0FBQztLQUNwRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7TENPTlRBSU5FUl9MRU5HVEgsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVEF0dHJpYnV0ZXMsIFROb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5U3RhdGUsIFBsYXllciwgUGxheWVyQ29udGV4dCwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtJbml0aWFsU3R5bGluZ1ZhbHVlcywgSW5pdGlhbFN0eWxpbmdWYWx1ZXNJbmRleCwgU3R5bGluZ0NvbnRleHQsIFN0eWxpbmdGbGFncywgU3R5bGluZ0luZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUm9vdENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtDb3JlUGxheWVySGFuZGxlcn0gZnJvbSAnLi9jb3JlX3BsYXllcl9oYW5kbGVyJztcblxuZXhwb3J0IGNvbnN0IEFOSU1BVElPTl9QUk9QX1BSRUZJWCA9ICdAJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudD86IFJFbGVtZW50IHwgbnVsbCwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBpbml0aWFsU3R5bGVzPzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgfCBudWxsLFxuICAgIGluaXRpYWxDbGFzc2VzPzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgfCBudWxsKTogU3R5bGluZ0NvbnRleHQge1xuICBjb25zdCBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCA9IFtcbiAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXN0ZXJGbGFnc1xuICAgIFtdIGFzIGFueSwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpcmVjdGl2ZVJlZnMgKHRoaXMgZ2V0cyBmaWxsZWQgYmVsb3cpXG4gICAgaW5pdGlhbFN0eWxlcyB8fCBbbnVsbCwgbnVsbF0sICAgLy8gSW5pdGlhbFN0eWxlc1xuICAgIGluaXRpYWxDbGFzc2VzIHx8IFtudWxsLCBudWxsXSwgIC8vIEluaXRpYWxDbGFzc2VzXG4gICAgWzAsIDBdLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luZ2xlUHJvcE9mZnNldHNcbiAgICBlbGVtZW50IHx8IG51bGwsICAgICAgICAgICAgICAgICAvLyBFbGVtZW50XG4gICAgWzBdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FjaGVkTXVsdGlDbGFzc1ZhbHVlXG4gICAgWzBdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2FjaGVkTXVsdGlTdHlsZVZhbHVlXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGxheWVyQ29udGV4dFxuICBdO1xuICBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0KGNvbnRleHQsIG51bGwpO1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jYXRlRGlyZWN0aXZlSW50b0NvbnRleHQoY29udGV4dDogU3R5bGluZ0NvbnRleHQsIGRpcmVjdGl2ZVJlZjogYW55IHwgbnVsbCkge1xuICAvLyB0aGlzIGlzIGEgbmV3IGRpcmVjdGl2ZSB3aGljaCB3ZSBoYXZlIG5vdCBzZWVuIHlldC5cbiAgY29udGV4dFtTdHlsaW5nSW5kZXguRGlyZWN0aXZlUmVnaXN0cnlQb3NpdGlvbl0ucHVzaChkaXJlY3RpdmVSZWYsIC0xLCBmYWxzZSwgbnVsbCk7XG59XG5cbi8qKlxuICogVXNlZCBjbG9uZSBhIGNvcHkgb2YgYSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgb2YgYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogQSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgaXMgZGVzaWduZWQgdG8gYmUgY29tcHV0ZWQgb25jZSBmb3IgYSBnaXZlbiBlbGVtZW50XG4gKiAoaW5zdHJ1Y3Rpb25zLnRzIGhhcyBsb2dpYyBmb3IgY2FjaGluZyB0aGlzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jU3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudDogUkVsZW1lbnQgfCBudWxsLCB0ZW1wbGF0ZVN0eWxlQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIGVhY2ggaW5zdGFuY2UgZ2V0cyBhIGNvcHlcbiAgY29uc3QgY29udGV4dCA9IHRlbXBsYXRlU3R5bGVDb250ZXh0LnNsaWNlKCkgYXMgYW55IGFzIFN0eWxpbmdDb250ZXh0O1xuXG4gIC8vIHRoZSBIRUFERVIgdmFsdWVzIGNvbnRhaW4gYXJyYXlzIHdoaWNoIGFsc28gbmVlZFxuICAvLyB0byBiZSBjb3BpZWQgb3ZlciBpbnRvIHRoZSBuZXcgY29udGV4dFxuICBmb3IgKGxldCBpID0gMDsgaSA8IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uOyBpKyspIHtcbiAgICBjb25zdCB2YWx1ZSA9IHRlbXBsYXRlU3R5bGVDb250ZXh0W2ldO1xuICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgY29udGV4dFtpXSA9IHZhbHVlLnNsaWNlKCk7XG4gICAgfVxuICB9XG5cbiAgY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSA9IGVsZW1lbnQ7XG5cbiAgLy8gdGhpcyB3aWxsIHByZXZlbnQgYW55IG90aGVyIGRpcmVjdGl2ZXMgZnJvbSBleHRlbmRpbmcgdGhlIGNvbnRleHRcbiAgY29udGV4dFtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSB8PSBTdHlsaW5nRmxhZ3MuQmluZGluZ0FsbG9jYXRpb25Mb2NrZWQ7XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgU3R5bGluZ0NvbnRleHRgIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKlxuICogVGhpcyBtZXRob2QgbGF6aWx5IGNyZWF0ZXMgdGhlIGBTdHlsaW5nQ29udGV4dGAuIFRoaXMgaXMgYmVjYXVzZSBpbiBtb3N0IGNhc2VzXG4gKiB3ZSBoYXZlIHN0eWxpbmcgd2l0aG91dCBhbnkgYmluZGluZ3MuIENyZWF0aW5nIGBTdHlsaW5nQ29udGV4dGAgZWFnZXJseSB3b3VsZCBtZWFuIHRoYXRcbiAqIGV2ZXJ5IHN0eWxlIGRlY2xhcmF0aW9uIHN1Y2ggYXMgYDxkaXYgc3R5bGU9XCJjb2xvcjogcmVkXCI+YCB3b3VsZCByZXN1bHQgYFN0eWxlQ29udGV4dGBcbiAqIHdoaWNoIHdvdWxkIGNyZWF0ZSB1bm5lY2Vzc2FyeSBtZW1vcnkgcHJlc3N1cmUuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBhbGxvY2F0aW9uLiBTZWU6IGBlbGVtZW50U3R5bGluZ2AuXG4gKiBAcGFyYW0gdmlld0RhdGEgVGhlIHZpZXcgdG8gc2VhcmNoIGZvciB0aGUgc3R5bGluZyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcpOiBTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBzdG9yYWdlSW5kZXggPSBpbmRleDtcbiAgbGV0IHNsb3RWYWx1ZTogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dHxSRWxlbWVudCA9IHZpZXdEYXRhW3N0b3JhZ2VJbmRleF07XG4gIGxldCB3cmFwcGVyOiBMQ29udGFpbmVyfExWaWV3fFN0eWxpbmdDb250ZXh0ID0gdmlld0RhdGE7XG5cbiAgd2hpbGUgKEFycmF5LmlzQXJyYXkoc2xvdFZhbHVlKSkge1xuICAgIHdyYXBwZXIgPSBzbG90VmFsdWU7XG4gICAgc2xvdFZhbHVlID0gc2xvdFZhbHVlW0hPU1RdIGFzIExWaWV3IHwgU3R5bGluZ0NvbnRleHQgfCBSRWxlbWVudDtcbiAgfVxuXG4gIGlmIChpc1N0eWxpbmdDb250ZXh0KHdyYXBwZXIpKSB7XG4gICAgcmV0dXJuIHdyYXBwZXIgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhpcyBpcyBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyXG4gICAgY29uc3Qgc3R5bGluZ1RlbXBsYXRlID0gZ2V0VE5vZGUoaW5kZXggLSBIRUFERVJfT0ZGU0VULCB2aWV3RGF0YSkuc3R5bGluZ1RlbXBsYXRlO1xuXG4gICAgaWYgKHdyYXBwZXIgIT09IHZpZXdEYXRhKSB7XG4gICAgICBzdG9yYWdlSW5kZXggPSBIT1NUO1xuICAgIH1cblxuICAgIHJldHVybiB3cmFwcGVyW3N0b3JhZ2VJbmRleF0gPSBzdHlsaW5nVGVtcGxhdGUgP1xuICAgICAgICBhbGxvY1N0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSwgc3R5bGluZ1RlbXBsYXRlKSA6XG4gICAgICAgIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoc2xvdFZhbHVlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNTdHlsaW5nQ29udGV4dCh2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIC8vIE5vdCBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyXG4gIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPj0gU3R5bGluZ0luZGV4LlNpbmdsZVN0eWxlc1N0YXJ0UG9zaXRpb24pIHtcbiAgICByZXR1cm4gdHlwZW9mIHZhbHVlW1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dID09PSAnbnVtYmVyJyAmJlxuICAgICAgICB2YWx1ZVtTdHlsaW5nSW5kZXguSW5pdGlhbENsYXNzVmFsdWVzUG9zaXRpb25dXG4gICAgICAgICAgICAgW0luaXRpYWxTdHlsaW5nVmFsdWVzSW5kZXguRGVmYXVsdE51bGxWYWx1ZVBvc2l0aW9uXSA9PT0gbnVsbDtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FuaW1hdGlvblByb3AobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lWzBdID09PSBBTklNQVRJT05fUFJPUF9QUkVGSVg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxlSW5wdXQodE5vZGU6IFROb2RlKSB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQpICE9PSAwO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VDbGFzc2VzQXNTdHJpbmcoY2xhc3Nlczogc3RyaW5nIHwge1trZXk6IHN0cmluZ106IGFueX0gfCBudWxsIHwgdW5kZWZpbmVkKTpcbiAgICBzdHJpbmcge1xuICBpZiAoY2xhc3NlcyAmJiB0eXBlb2YgY2xhc3NlcyAhPT0gJ3N0cmluZycpIHtcbiAgICBjbGFzc2VzID0gT2JqZWN0LmtleXMoY2xhc3Nlcykuam9pbignICcpO1xuICB9XG4gIHJldHVybiAoY2xhc3NlcyBhcyBzdHJpbmcpIHx8ICcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yY2VTdHlsZXNBc1N0cmluZyhzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6IHN0cmluZyB7XG4gIGxldCBzdHIgPSAnJztcbiAgaWYgKHN0eWxlcykge1xuICAgIGNvbnN0IHByb3BzID0gT2JqZWN0LmtleXMoc3R5bGVzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHByb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBwcm9wID0gcHJvcHNbaV07XG4gICAgICBzdHIgKz0gKGkgPyAnOycgOiAnJykgKyBgJHtwcm9wfToke3N0eWxlc1twcm9wXX1gO1xuICAgIH1cbiAgfVxuICByZXR1cm4gc3RyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgcGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBwbGF5ZXI6IFBsYXllciB8IG51bGwsIHBsYXllckNvbnRleHRJbmRleDogbnVtYmVyLCByZWY/OiBhbnkpOiBib29sZWFuIHtcbiAgcmVmID0gcmVmIHx8IGVsZW1lbnQ7XG4gIGlmIChwbGF5ZXJDb250ZXh0SW5kZXgpIHtcbiAgICBwbGF5ZXJDb250ZXh0W3BsYXllckNvbnRleHRJbmRleF0gPSBwbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgcGxheWVyQ29udGV4dC5wdXNoKHBsYXllcik7XG4gIH1cblxuICBpZiAocGxheWVyKSB7XG4gICAgcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoUGxheVN0YXRlLkRlc3Ryb3llZCwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwbGF5ZXJDb250ZXh0LmluZGV4T2YocGxheWVyKTtcbiAgICAgIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYmVpbmcgcmVtb3ZlZCBmcm9tIHRoZSBmYWN0b3J5IHNpZGUgb2YgdGhlIGNvbnRleHRcbiAgICAgIC8vICh3aGljaCBpcyB3aGVyZSB0aGUgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyB0aGVpciB0aGluZykgdGhlblxuICAgICAgLy8gdGhhdCBzaWRlIG9mIHRoZSBhcnJheSBjYW5ub3QgYmUgcmVzaXplZCBzaW5jZSB0aGUgcmVzcGVjdGl2ZSBiaW5kaW5nc1xuICAgICAgLy8gaGF2ZSBwb2ludGVyIGluZGV4IHZhbHVlcyB0aGF0IHBvaW50IHRvIHRoZSBhc3NvY2lhdGVkIGZhY3RvcnkgaW5zdGFuY2VcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPCBub25GYWN0b3J5UGxheWVySW5kZXgpIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0W2luZGV4XSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVySGFuZGxlciA9XG4gICAgICAgIHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgfHwgKHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgPSBuZXcgQ29yZVBsYXllckhhbmRsZXIoKSk7XG4gICAgcGxheWVySGFuZGxlci5xdWV1ZVBsYXllcihwbGF5ZXIsIHJlZik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJzSW50ZXJuYWwocGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCk6IFBsYXllcltdIHtcbiAgY29uc3QgcGxheWVyczogUGxheWVyW10gPSBbXTtcbiAgY29uc3Qgbm9uRmFjdG9yeVBsYXllcnNTdGFydCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgLy8gYWRkIGFsbCBmYWN0b3J5LWJhc2VkIHBsYXllcnMgKHdoaWNoIGFyZSBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgaSA8IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllciB8IG51bGw7XG4gICAgaWYgKHBsYXllcikge1xuICAgICAgcGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIGFsbCBjdXN0b20gcGxheWVycyAobm90IGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpIDwgcGxheWVyQ29udGV4dC5sZW5ndGg7IGkrKykge1xuICAgIHBsYXllcnMucHVzaChwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllcik7XG4gIH1cblxuICByZXR1cm4gcGxheWVycztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0KHRhcmdldDoge30sIGNvbnRleHQ/OiBMQ29udGV4dCB8IG51bGwpOiBQbGF5ZXJDb250ZXh0fFxuICAgIG51bGwge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRMQ29udGV4dCh0YXJnZXQpICE7XG4gIGlmICghY29udGV4dCkge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0ludmFsaWRSZWZFcnJvcigpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qge2xWaWV3LCBub2RlSW5kZXh9ID0gY29udGV4dDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChub2RlSW5kZXgsIGxWaWV3KTtcbiAgcmV0dXJuIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpIHx8IGFsbG9jUGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHR8bnVsbCB7XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1BsYXllckNvbnRleHQoZGF0YTogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0IHtcbiAgcmV0dXJuIGRhdGFbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdID1cbiAgICAgICAgICAgICBbUGxheWVySW5kZXguU2luZ2xlUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93SW52YWxpZFJlZkVycm9yKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBhbmltYXRpb25zJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nKGF0dHJzOiBUQXR0cmlidXRlcyk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IGF0dHIgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19