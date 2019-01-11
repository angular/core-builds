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
const ANIMATION_PROP_PREFIX = '@';
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStyles
 * @param {?=} initialClasses
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStyles, initialClasses) {
    return [
        0,
        [null, -1, false, sanitizer || null],
        initialStyles || [null],
        initialClasses || [null],
        [0, 0],
        element || null,
        null,
        null,
        null,
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
    // this will prevent any other directives from extending the context
    context[0 /* MasterFlagPosition */] |= 32 /* BindingAllocationLocked */;
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
    return Array.isArray(value) && typeof value[0 /* MasterFlagPosition */] === 'number' &&
        Array.isArray(value[2 /* InitialStyleValuesPosition */]);
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
/**
 * @param {?} tNode
 * @return {?}
 */
export function hasClassInput(tNode) {
    return tNode.flags & 8 /* hasClassInput */ ? true : false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIuLi8uLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyx3QkFBd0IsQ0FBQztBQUdoQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFPakQsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQXFCLE1BQU0sb0JBQW9CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVqQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7TUFFbEQscUJBQXFCLEdBQUcsR0FBRzs7Ozs7Ozs7QUFFakMsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF5QixFQUFFLFNBQWtDLEVBQzdELGFBQTJDLEVBQzNDLGNBQTRDO0lBQzlDLE9BQU87UUFDTCxDQUFDO1FBQ0QsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLFNBQVMsSUFBSSxJQUFJLENBQUM7UUFDcEMsYUFBYSxJQUFJLENBQUMsSUFBSSxDQUFDO1FBQ3ZCLGNBQWMsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN4QixDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDTixPQUFPLElBQUksSUFBSTtRQUNmLElBQUk7UUFDSixJQUFJO1FBQ0osSUFBSTtLQUNMLENBQUM7QUFDSixDQUFDOzs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLG1CQUFtQixDQUMvQixPQUF3QixFQUFFLG9CQUFvQzs7O1VBRTFELE9BQU8sR0FBRyxtQkFBQSxtQkFBQSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsRUFBTyxFQUFrQjtJQUNyRSxPQUFPLHlCQUE4QixHQUFHLE9BQU8sQ0FBQztJQUVoRCxvRUFBb0U7SUFDcEUsT0FBTyw0QkFBaUMsb0NBQXdDLENBQUM7SUFDakYsT0FB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QUE0QixDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQW9CO0lBQ3JELE9BQU8sSUFBSSx1QkFBNEI7UUFDNUIsNENBQWdELElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JGLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztBQUNuRyxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBa0I7SUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQy9CLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksSUFBSSxtQkFBMkIsSUFBSSxJQUFJLGtCQUEwQjtZQUFFLE9BQU8sSUFBSSxDQUFDO0tBQ3BGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLEtBQUssQ0FBQyxLQUFLLHdCQUEyQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUMvRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheVN0YXRlLCBQbGF5ZXIsIFBsYXllckNvbnRleHQsIFBsYXllckluZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge1JFbGVtZW50fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7SW5pdGlhbFN0eWxpbmdWYWx1ZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nRmxhZ3MsIFN0eWxpbmdJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7SEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7Q29yZVBsYXllckhhbmRsZXJ9IGZyb20gJy4vY29yZV9wbGF5ZXJfaGFuZGxlcic7XG5cbmNvbnN0IEFOSU1BVElPTl9QUk9QX1BSRUZJWCA9ICdAJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudD86IFJFbGVtZW50IHwgbnVsbCwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBpbml0aWFsU3R5bGVzPzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgfCBudWxsLFxuICAgIGluaXRpYWxDbGFzc2VzPzogSW5pdGlhbFN0eWxpbmdWYWx1ZXMgfCBudWxsKTogU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gW1xuICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3RlckZsYWdzXG4gICAgW251bGwsIC0xLCBmYWxzZSwgc2FuaXRpemVyIHx8IG51bGxdLCAgLy8gRGlyZWN0aXZlUmVmc1xuICAgIGluaXRpYWxTdHlsZXMgfHwgW251bGxdLCAgICAgICAgICAgICAgIC8vIEluaXRpYWxTdHlsZXNcbiAgICBpbml0aWFsQ2xhc3NlcyB8fCBbbnVsbF0sICAgICAgICAgICAgICAvLyBJbml0aWFsQ2xhc3Nlc1xuICAgIFswLCAwXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbmdsZVByb3BPZmZzZXRzXG4gICAgZWxlbWVudCB8fCBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgLy8gRWxlbWVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXZpb3VzTXVsdGlDbGFzc1ZhbHVlXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmlvdXNNdWx0aVN0eWxlVmFsdWVcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5ZXJDb250ZXh0XG4gIF07XG59XG5cbi8qKlxuICogVXNlZCBjbG9uZSBhIGNvcHkgb2YgYSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgb2YgYSBzdHlsaW5nIGNvbnRleHQuXG4gKlxuICogQSBwcmUtY29tcHV0ZWQgdGVtcGxhdGUgaXMgZGVzaWduZWQgdG8gYmUgY29tcHV0ZWQgb25jZSBmb3IgYSBnaXZlbiBlbGVtZW50XG4gKiAoaW5zdHJ1Y3Rpb25zLnRzIGhhcyBsb2dpYyBmb3IgY2FjaGluZyB0aGlzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jU3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudDogUkVsZW1lbnQgfCBudWxsLCB0ZW1wbGF0ZVN0eWxlQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIGVhY2ggaW5zdGFuY2UgZ2V0cyBhIGNvcHlcbiAgY29uc3QgY29udGV4dCA9IHRlbXBsYXRlU3R5bGVDb250ZXh0LnNsaWNlKCkgYXMgYW55IGFzIFN0eWxpbmdDb250ZXh0O1xuICBjb250ZXh0W1N0eWxpbmdJbmRleC5FbGVtZW50UG9zaXRpb25dID0gZWxlbWVudDtcblxuICAvLyB0aGlzIHdpbGwgcHJldmVudCBhbnkgb3RoZXIgZGlyZWN0aXZlcyBmcm9tIGV4dGVuZGluZyB0aGUgY29udGV4dFxuICBjb250ZXh0W1N0eWxpbmdJbmRleC5NYXN0ZXJGbGFnUG9zaXRpb25dIHw9IFN0eWxpbmdGbGFncy5CaW5kaW5nQWxsb2NhdGlvbkxvY2tlZDtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGBTdHlsaW5nQ29udGV4dGAgYXQgYSBnaXZlbiBpbmRleC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBsYXppbHkgY3JlYXRlcyB0aGUgYFN0eWxpbmdDb250ZXh0YC4gVGhpcyBpcyBiZWNhdXNlIGluIG1vc3QgY2FzZXNcbiAqIHdlIGhhdmUgc3R5bGluZyB3aXRob3V0IGFueSBiaW5kaW5ncy4gQ3JlYXRpbmcgYFN0eWxpbmdDb250ZXh0YCBlYWdlcmx5IHdvdWxkIG1lYW4gdGhhdFxuICogZXZlcnkgc3R5bGUgZGVjbGFyYXRpb24gc3VjaCBhcyBgPGRpdiBzdHlsZT1cImNvbG9yOiByZWRcIj5gIHdvdWxkIHJlc3VsdCBgU3R5bGVDb250ZXh0YFxuICogd2hpY2ggd291bGQgY3JlYXRlIHVubmVjZXNzYXJ5IG1lbW9yeSBwcmVzc3VyZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIGFsbG9jYXRpb24uIFNlZTogYGVsZW1lbnRTdHlsaW5nYC5cbiAqIEBwYXJhbSB2aWV3RGF0YSBUaGUgdmlldyB0byBzZWFyY2ggZm9yIHRoZSBzdHlsaW5nIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIsIHZpZXdEYXRhOiBMVmlldyk6IFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IHN0b3JhZ2VJbmRleCA9IGluZGV4O1xuICBsZXQgc2xvdFZhbHVlOiBMQ29udGFpbmVyfExWaWV3fFN0eWxpbmdDb250ZXh0fFJFbGVtZW50ID0gdmlld0RhdGFbc3RvcmFnZUluZGV4XTtcbiAgbGV0IHdyYXBwZXI6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YTtcblxuICB3aGlsZSAoQXJyYXkuaXNBcnJheShzbG90VmFsdWUpKSB7XG4gICAgd3JhcHBlciA9IHNsb3RWYWx1ZTtcbiAgICBzbG90VmFsdWUgPSBzbG90VmFsdWVbSE9TVF0gYXMgTFZpZXcgfCBTdHlsaW5nQ29udGV4dCB8IFJFbGVtZW50O1xuICB9XG5cbiAgaWYgKGlzU3R5bGluZ0NvbnRleHQod3JhcHBlcikpIHtcbiAgICByZXR1cm4gd3JhcHBlciBhcyBTdHlsaW5nQ29udGV4dDtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGFuIExWaWV3IG9yIGFuIExDb250YWluZXJcbiAgICBjb25zdCBzdHlsaW5nVGVtcGxhdGUgPSBnZXRUTm9kZShpbmRleCAtIEhFQURFUl9PRkZTRVQsIHZpZXdEYXRhKS5zdHlsaW5nVGVtcGxhdGU7XG5cbiAgICBpZiAod3JhcHBlciAhPT0gdmlld0RhdGEpIHtcbiAgICAgIHN0b3JhZ2VJbmRleCA9IEhPU1Q7XG4gICAgfVxuXG4gICAgcmV0dXJuIHdyYXBwZXJbc3RvcmFnZUluZGV4XSA9IHN0eWxpbmdUZW1wbGF0ZSA/XG4gICAgICAgIGFsbG9jU3R5bGluZ0NvbnRleHQoc2xvdFZhbHVlLCBzdHlsaW5nVGVtcGxhdGUpIDpcbiAgICAgICAgY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dChzbG90VmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBhbnkpOiB2YWx1ZSBpcyBTdHlsaW5nQ29udGV4dCB7XG4gIC8vIE5vdCBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyXG4gIHJldHVybiBBcnJheS5pc0FycmF5KHZhbHVlKSAmJiB0eXBlb2YgdmFsdWVbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gPT09ICdudW1iZXInICYmXG4gICAgICBBcnJheS5pc0FycmF5KHZhbHVlW1N0eWxpbmdJbmRleC5Jbml0aWFsU3R5bGVWYWx1ZXNQb3NpdGlvbl0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBbmltYXRpb25Qcm9wKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZVswXSA9PT0gQU5JTUFUSU9OX1BST1BfUFJFRklYO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgcGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBwbGF5ZXI6IFBsYXllciB8IG51bGwsIHBsYXllckNvbnRleHRJbmRleDogbnVtYmVyLCByZWY/OiBhbnkpOiBib29sZWFuIHtcbiAgcmVmID0gcmVmIHx8IGVsZW1lbnQ7XG4gIGlmIChwbGF5ZXJDb250ZXh0SW5kZXgpIHtcbiAgICBwbGF5ZXJDb250ZXh0W3BsYXllckNvbnRleHRJbmRleF0gPSBwbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgcGxheWVyQ29udGV4dC5wdXNoKHBsYXllcik7XG4gIH1cblxuICBpZiAocGxheWVyKSB7XG4gICAgcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoUGxheVN0YXRlLkRlc3Ryb3llZCwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwbGF5ZXJDb250ZXh0LmluZGV4T2YocGxheWVyKTtcbiAgICAgIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYmVpbmcgcmVtb3ZlZCBmcm9tIHRoZSBmYWN0b3J5IHNpZGUgb2YgdGhlIGNvbnRleHRcbiAgICAgIC8vICh3aGljaCBpcyB3aGVyZSB0aGUgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyB0aGVpciB0aGluZykgdGhlblxuICAgICAgLy8gdGhhdCBzaWRlIG9mIHRoZSBhcnJheSBjYW5ub3QgYmUgcmVzaXplZCBzaW5jZSB0aGUgcmVzcGVjdGl2ZSBiaW5kaW5nc1xuICAgICAgLy8gaGF2ZSBwb2ludGVyIGluZGV4IHZhbHVlcyB0aGF0IHBvaW50IHRvIHRoZSBhc3NvY2lhdGVkIGZhY3RvcnkgaW5zdGFuY2VcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPCBub25GYWN0b3J5UGxheWVySW5kZXgpIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0W2luZGV4XSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVySGFuZGxlciA9XG4gICAgICAgIHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgfHwgKHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgPSBuZXcgQ29yZVBsYXllckhhbmRsZXIoKSk7XG4gICAgcGxheWVySGFuZGxlci5xdWV1ZVBsYXllcihwbGF5ZXIsIHJlZik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJzSW50ZXJuYWwocGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCk6IFBsYXllcltdIHtcbiAgY29uc3QgcGxheWVyczogUGxheWVyW10gPSBbXTtcbiAgY29uc3Qgbm9uRmFjdG9yeVBsYXllcnNTdGFydCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgLy8gYWRkIGFsbCBmYWN0b3J5LWJhc2VkIHBsYXllcnMgKHdoaWNoIGFyZSBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgaSA8IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllciB8IG51bGw7XG4gICAgaWYgKHBsYXllcikge1xuICAgICAgcGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIGFsbCBjdXN0b20gcGxheWVycyAobm90IGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpIDwgcGxheWVyQ29udGV4dC5sZW5ndGg7IGkrKykge1xuICAgIHBsYXllcnMucHVzaChwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllcik7XG4gIH1cblxuICByZXR1cm4gcGxheWVycztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0KHRhcmdldDoge30sIGNvbnRleHQ/OiBMQ29udGV4dCB8IG51bGwpOiBQbGF5ZXJDb250ZXh0fFxuICAgIG51bGwge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRMQ29udGV4dCh0YXJnZXQpICE7XG4gIGlmICghY29udGV4dCkge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0ludmFsaWRSZWZFcnJvcigpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3Qge2xWaWV3LCBub2RlSW5kZXh9ID0gY29udGV4dDtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChub2RlSW5kZXgsIGxWaWV3KTtcbiAgcmV0dXJuIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpIHx8IGFsbG9jUGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHR8bnVsbCB7XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1BsYXllckNvbnRleHQoZGF0YTogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0IHtcbiAgcmV0dXJuIGRhdGFbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdID1cbiAgICAgICAgICAgICBbUGxheWVySW5kZXguU2luZ2xlUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93SW52YWxpZFJlZkVycm9yKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBhbmltYXRpb25zJyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsaW5nKGF0dHJzOiBUQXR0cmlidXRlcyk6IGJvb2xlYW4ge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgYXR0ciA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyID09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8IGF0dHIgPT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcykgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0ID8gdHJ1ZSA6IGZhbHNlO1xufVxuIl19