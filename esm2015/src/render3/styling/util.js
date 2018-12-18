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
import '../ng_dev_mode';
import { getLContext } from '../context_discovery';
import { ACTIVE_INDEX } from '../interfaces/container';
import { FLAGS, HEADER_OFFSET, HOST } from '../interfaces/view';
import { getTNode } from '../util';
import { CorePlayerHandler } from './core_player_handler';
/** @type {?} */
const ANIMATION_PROP_PREFIX = '@';
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStylingValues
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStylingValues) {
    return [
        null,
        sanitizer || null,
        initialStylingValues || [null],
        0,
        0,
        element || null,
        null,
        null // PreviousMultiStyleValue
    ];
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
    context[5 /* ElementPosition */] = element;
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
    return Array.isArray(value) && typeof value[FLAGS] !== 'number' &&
        typeof value[ACTIVE_INDEX] !== 'number';
}
/**
 * @param {?} name
 * @return {?}
 */
export function isAnimationProp(name) {
    return name[0] === ANIMATION_PROP_PREFIX;
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
    return stylingContext[0 /* PlayerContext */];
}
/**
 * @param {?} data
 * @return {?}
 */
export function allocPlayerContext(data) {
    return data[0 /* PlayerContext */] =
        [5 /* SinglePlayerBuildersStartPosition */, null, null, null, null];
}
/**
 * @return {?}
 */
export function throwInvalidRefError() {
    throw new Error('Only elements that exist in an Angular application can be used for animations');
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyxnQkFBZ0IsQ0FBQztBQUd4QixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxFQUFDLFlBQVksRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBS2pFLE9BQU8sRUFBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBcUIsTUFBTSxvQkFBb0IsQ0FBQztBQUNsRixPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRWpDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztNQUVsRCxxQkFBcUIsR0FBRyxHQUFHOzs7Ozs7O0FBRWpDLE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsT0FBeUIsRUFBRSxTQUFrQyxFQUM3RCxvQkFBb0M7SUFDdEMsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTLElBQUksSUFBSTtRQUNqQixvQkFBb0IsSUFBSSxDQUFDLElBQUksQ0FBQztRQUM5QixDQUFDO1FBQ0QsQ0FBQztRQUNELE9BQU8sSUFBSSxJQUFJO1FBQ2YsSUFBSTtRQUNKLElBQUksQ0FBNkIsMEJBQTBCO0tBQzVELENBQUM7QUFDSixDQUFDOzs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixPQUF3QixFQUFFLG9CQUFvQzs7O1VBRTFELE9BQU8sR0FBRyxtQkFBQSxtQkFBQSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsRUFBTyxFQUFrQjtJQUNyRSxPQUFPLHlCQUE4QixHQUFHLE9BQU8sQ0FBQztJQUNoRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxVQUFVLGlCQUFpQixDQUFDLEtBQWEsRUFBRSxRQUFlOztRQUMx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QUE0QjtRQUM1Qiw0Q0FBZ0QsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDckYsQ0FBQzs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0FBQ25HLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgJy4uL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyLCBQbGF5ZXJDb250ZXh0LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUm9vdENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtDb3JlUGxheWVySGFuZGxlcn0gZnJvbSAnLi9jb3JlX3BsYXllcl9oYW5kbGVyJztcblxuY29uc3QgQU5JTUFUSU9OX1BST1BfUFJFRklYID0gJ0AnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50PzogUkVsZW1lbnQgfCBudWxsLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIGluaXRpYWxTdHlsaW5nVmFsdWVzPzogSW5pdGlhbFN0eWxlcyk6IFN0eWxpbmdDb250ZXh0IHtcbiAgcmV0dXJuIFtcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5ZXJDb250ZXh0XG4gICAgc2FuaXRpemVyIHx8IG51bGwsICAgICAgICAgICAgICAgLy8gU3R5bGVTYW5pdGl6ZXJcbiAgICBpbml0aWFsU3R5bGluZ1ZhbHVlcyB8fCBbbnVsbF0sICAvLyBJbml0aWFsU3R5bGVzXG4gICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzdGVyRmxhZ3NcbiAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDbGFzc09mZnNldFxuICAgIGVsZW1lbnQgfHwgbnVsbCwgICAgICAgICAgICAgICAgIC8vIEVsZW1lbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2aW91c011bHRpQ2xhc3NWYWx1ZVxuICAgIG51bGwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXZpb3VzTXVsdGlTdHlsZVZhbHVlXG4gIF07XG59XG5cbi8qKlxuICogVXNlZCBjbG9uZSBhIGNvcHkgb2YgYSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgb2YgYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogQSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgaXMgZGVzaWduZWQgdG8gYmUgY29tcHV0ZWQgb25jZSBmb3IgYSBnaXZlbiBlbGVtZW50XG4gKiAoaW5zdHJ1Y3Rpb25zLnRzIGhhcyBsb2dpYyBmb3IgY2FjaGluZyB0aGlzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jU3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudDogUkVsZW1lbnQgfCBudWxsLCB0ZW1wbGF0ZVN0eWxlQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIGVhY2ggaW5zdGFuY2UgZ2V0cyBhIGNvcHlcbiAgY29uc3QgY29udGV4dCA9IHRlbXBsYXRlU3R5bGVDb250ZXh0LnNsaWNlKCkgYXMgYW55IGFzIFN0eWxpbmdDb250ZXh0O1xuICBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dID0gZWxlbWVudDtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGBTdHlsaW5nQ29udGV4dGAgYXQgYSBnaXZlbiBpbmRleC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBsYXppbHkgY3JlYXRlcyB0aGUgYFN0eWxpbmdDb250ZXh0YC4gVGhpcyBpcyBiZWNhdXNlIGluIG1vc3QgY2FzZXNcbiAqIHdlIGhhdmUgc3R5bGluZyB3aXRob3V0IGFueSBiaW5kaW5ncy4gQ3JlYXRpbmcgYFN0eWxpbmdDb250ZXh0YCBlYWdlcmx5IHdvdWxkIG1lYW4gdGhhdFxuICogZXZlcnkgc3R5bGUgZGVjbGFyYXRpb24gc3VjaCBhcyBgPGRpdiBzdHlsZT1cImNvbG9yOiByZWRcIj5gIHdvdWxkIHJlc3VsdCBgU3R5bGVDb250ZXh0YFxuICogd2hpY2ggd291bGQgY3JlYXRlIHVubmVjZXNzYXJ5IG1lbW9yeSBwcmVzc3VyZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIGFsbG9jYXRpb24uIFNlZTogYGVsZW1lbnRTdHlsaW5nYC5cbiAqIEBwYXJhbSB2aWV3RGF0YSBUaGUgdmlldyB0byBzZWFyY2ggZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldyk6IFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IHN0b3JhZ2VJbmRleCA9IGluZGV4O1xuICBsZXQgc2xvdFZhbHVlOiBMQ29udGFpbmVyfExWaWV3fFN0eWxpbmdDb250ZXh0fFJFbGVtZW50ID0gdmlld0RhdGFbc3RvcmFnZUluZGV4XTtcbiAgbGV0IHdyYXBwZXI6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcblxuICB3aGlsZSAoQXJyYXkuaXNBcnJheShzbG90VmFsdWUpKSB7XG4gICAgd3JhcHBlciA9IHNsb3RWYWx1ZTtcbiAgICBzbG90VmFsdWUgPSBzbG90VmFsdWVbSE9TVF0gYXMgTFZpZXcgfCBTdHlsaW5nQ29udGV4dCB8IFJFbGVtZW50O1xuICB9XG5cbiAgaWYgKGlzU3R5bGluZ0NvbnRleHQod3JhcHBlcikpIHtcbiAgICByZXR1cm4gd3JhcHBlciBhcyBTdHlsaW5nQ29udGV4dDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGFuIExWaWV3IG9yIGFuIExDb250YWluZXJcbiAgICBjb25zdCBzdHlsaW5nVGVtcGxhdGUgPSBnZXRUTm9kZShpbmRleCAtIEhFQURFUl9PRkZTRVQsIHZpZXdEYXRhKS5zdHlsaW5nVGVtcGxhdGU7XG5cbiAgICBpZiAod3JhcHBlciAhPT0gdmlld0RhdGEpIHtcbiAgICAgIHN0b3JhZ2VJbmRleCA9IEhPU1Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdyYXBwZXJbc3RvcmFnZUluZGV4XSA9IHN0eWxpbmdUZW1wbGF0ZSA/XG4gICAgICAgIGFsbG9jU3R5bGluZ0NvbnRleHQoc2xvdFZhbHVlLCBzdHlsaW5nVGVtcGxhdGUpIDpcbiAgICAgICAgY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dChzbG90VmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIE5vdCBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWVbRkxBR1NdICE9PSAnbnVtYmVyJyAmJlxuICAgICAgdHlwZW9mIHZhbHVlW0FDVElWRV9JTkRFWF0gIT09ICdudW1iZXInO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBbmltYXRpb25Qcm9wKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZVswXSA9PT0gQU5JTUFUSU9OX1BST1BfUFJFRklYO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgcGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBwbGF5ZXI6IFBsYXllciB8IG51bGwsIHBsYXllckNvbnRleHRJbmRleDogbnVtYmVyLCByZWY/OiBhbnkpOiBib29sZWFuIHtcbiAgcmVmID0gcmVmIHx8IGVsZW1lbnQ7XG4gIGlmIChwbGF5ZXJDb250ZXh0SW5kZXgpIHtcbiAgICBwbGF5ZXJDb250ZXh0W3BsYXllckNvbnRleHRJbmRleF0gPSBwbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgcGxheWVyQ29udGV4dC5wdXNoKHBsYXllcik7XG4gIH1cblxuICBpZiAocGxheWVyKSB7XG4gICAgcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoUGxheVN0YXRlLkRlc3Ryb3llZCwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwbGF5ZXJDb250ZXh0LmluZGV4T2YocGxheWVyKTtcbiAgICAgIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYmVpbmcgcmVtb3ZlZCBmcm9tIHRoZSBmYWN0b3J5IHNpZGUgb2YgdGhlIGNvbnRleHRcbiAgICAgIC8vICh3aGljaCBpcyB3aGVyZSB0aGUgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyB0aGVpciB0aGluZykgdGhlblxuICAgICAgLy8gdGhhdCBzaWRlIG9mIHRoZSBhcnJheSBjYW5ub3QgYmUgcmVzaXplZCBzaW5jZSB0aGUgcmVzcGVjdGl2ZSBiaW5kaW5nc1xuICAgICAgLy8gaGF2ZSBwb2ludGVyIGluZGV4IHZhbHVlcyB0aGF0IHBvaW50IHRvIHRoZSBhc3NvY2lhdGVkIGZhY3RvcnkgaW5zdGFuY2VcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPCBub25GYWN0b3J5UGxheWVySW5kZXgpIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0W2luZGV4XSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVySGFuZGxlciA9XG4gICAgICAgIHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgfHwgKHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgPSBuZXcgQ29yZVBsYXllckhhbmRsZXIoKSk7XG4gICAgcGxheWVySGFuZGxlci5xdWV1ZVBsYXllcihwbGF5ZXIsIHJlZik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJzSW50ZXJuYWwocGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCk6IFBsYXllcltdIHtcbiAgY29uc3QgcGxheWVyczogUGxheWVyW10gPSBbXTtcbiAgY29uc3Qgbm9uRmFjdG9yeVBsYXllcnNTdGFydCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgLy8gYWRkIGFsbCBmYWN0b3J5LWJhc2VkIHBsYXllcnMgKHdoaWNoIGFyZSBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgaSA8IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllciB8IG51bGw7XG4gICAgaWYgKHBsYXllcikge1xuICAgICAgcGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIGFsbCBjdXN0b20gcGxheWVycyAobm90IGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpIDwgcGxheWVyQ29udGV4dC5sZW5ndGg7IGkrKykge1xuICAgIHBsYXllcnMucHVzaChwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllcik7XG4gIH1cblxuICByZXR1cm4gcGxheWVycztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0KHRhcmdldDoge30sIGNvbnRleHQ/OiBMQ29udGV4dCB8IG51bGwpOiBQbGF5ZXJDb250ZXh0fFxuICAgIG51bGwge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRMQ29udGV4dCh0YXJnZXQpICE7XG4gIGlmICghY29udGV4dCkge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0ludmFsaWRSZWZFcnJvcigpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qge2xWaWV3LCBub2RlSW5kZXh9ID0gY29udGV4dDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChub2RlSW5kZXgsIGxWaWV3KTtcbiAgcmV0dXJuIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpIHx8IGFsbG9jUGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHR8bnVsbCB7XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1BsYXllckNvbnRleHQoZGF0YTogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0IHtcbiAgcmV0dXJuIGRhdGFbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdID1cbiAgICAgICAgICAgICBbUGxheWVySW5kZXguU2luZ2xlUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93SW52YWxpZFJlZkVycm9yKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBhbmltYXRpb25zJyk7XG59XG4iXX0=