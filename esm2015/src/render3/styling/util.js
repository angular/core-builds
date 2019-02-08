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
import { LCONTAINER_LENGTH } from '../interfaces/container';
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
        value.length !== LCONTAINER_LENGTH;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyx3QkFBd0IsQ0FBQztBQUdoQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakQsT0FBTyxFQUFDLGlCQUFpQixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFNdEUsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQXFCLE1BQU0sb0JBQW9CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVqQyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQzs7QUFFeEQsTUFBTSxPQUFPLHFCQUFxQixHQUFHLEdBQUc7Ozs7Ozs7O0FBRXhDLE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsT0FBeUIsRUFBRSxTQUFrQyxFQUM3RCxhQUEyQyxFQUMzQyxjQUE0QztJQUM5QyxPQUFPO1FBQ0wsQ0FBQztRQUNELENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLEtBQUssRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDO1FBQ3BDLGFBQWEsSUFBSSxDQUFDLElBQUksQ0FBQztRQUN2QixjQUFjLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDeEIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ04sT0FBTyxJQUFJLElBQUk7UUFDZixJQUFJO1FBQ0osSUFBSTtRQUNKLElBQUk7S0FDTCxDQUFDO0FBQ0osQ0FBQzs7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsT0FBd0IsRUFBRSxvQkFBb0M7OztVQUUxRCxPQUFPLEdBQUcsbUJBQUEsbUJBQUEsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEVBQU8sRUFBa0I7SUFDckUsT0FBTyx5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aEYsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsY0FBOEI7SUFDN0QsT0FBTyxjQUFjLHVCQUE0QixDQUFDO0FBQ3BELENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLGtCQUFrQixDQUFDLElBQW9CO0lBQ3JELE9BQU8sSUFBSSx1QkFBNEI7UUFDNUIsNENBQWdELElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3JGLENBQUM7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CO0lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztBQUNuRyxDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxVQUFVLENBQUMsS0FBa0I7SUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQy9CLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksSUFBSSxtQkFBMkIsSUFBSSxJQUFJLGtCQUEwQjtZQUFFLE9BQU8sSUFBSSxDQUFDO0tBQ3BGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsS0FBWTtJQUN4QyxPQUFPLEtBQUssQ0FBQyxLQUFLLHdCQUEyQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztBQUMvRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ09OVEFJTkVSX0xFTkdUSCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyLCBQbGF5ZXJDb250ZXh0LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsaW5nVmFsdWVzLCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0VE5vZGV9IGZyb20gJy4uL3V0aWwnO1xuXG5pbXBvcnQge0NvcmVQbGF5ZXJIYW5kbGVyfSBmcm9tICcuL2NvcmVfcGxheWVyX2hhbmRsZXInO1xuXG5leHBvcnQgY29uc3QgQU5JTUFUSU9OX1BST1BfUFJFRklYID0gJ0AnO1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50PzogUkVsZW1lbnQgfCBudWxsLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIGluaXRpYWxTdHlsZXM/OiBJbml0aWFsU3R5bGluZ1ZhbHVlcyB8IG51bGwsXG4gICAgaW5pdGlhbENsYXNzZXM/OiBJbml0aWFsU3R5bGluZ1ZhbHVlcyB8IG51bGwpOiBTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBbXG4gICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzdGVyRmxhZ3NcbiAgICBbbnVsbCwgLTEsIGZhbHNlLCBzYW5pdGl6ZXIgfHwgbnVsbF0sICAvLyBEaXJlY3RpdmVSZWZzXG4gICAgaW5pdGlhbFN0eWxlcyB8fCBbbnVsbF0sICAgICAgICAgICAgICAgLy8gSW5pdGlhbFN0eWxlc1xuICAgIGluaXRpYWxDbGFzc2VzIHx8IFtudWxsXSwgICAgICAgICAgICAgIC8vIEluaXRpYWxDbGFzc2VzXG4gICAgWzAsIDBdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luZ2xlUHJvcE9mZnNldHNcbiAgICBlbGVtZW50IHx8IG51bGwsICAgICAgICAgICAgICAgICAgICAgICAvLyBFbGVtZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmlvdXNNdWx0aUNsYXNzVmFsdWVcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2aW91c011bHRpU3R5bGVWYWx1ZVxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYXllckNvbnRleHRcbiAgXTtcbn1cblxuLyoqXG4gKiBVc2VkIGNsb25lIGEgY29weSBvZiBhIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBvZiBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBBIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBpcyBkZXNpZ25lZCB0byBiZSBjb21wdXRlZCBvbmNlIGZvciBhIGdpdmVuIGVsZW1lbnRcbiAqIChpbnN0cnVjdGlvbnMudHMgaGFzIGxvZ2ljIGZvciBjYWNoaW5nIHRoaXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50OiBSRWxlbWVudCB8IG51bGwsIHRlbXBsYXRlU3R5bGVDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gZWFjaCBpbnN0YW5jZSBnZXRzIGEgY29weVxuICBjb25zdCBjb250ZXh0ID0gdGVtcGxhdGVTdHlsZUNvbnRleHQuc2xpY2UoKSBhcyBhbnkgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gPSBlbGVtZW50O1xuXG4gIC8vIHRoaXMgd2lsbCBwcmV2ZW50IGFueSBvdGhlciBkaXJlY3RpdmVzIGZyb20gZXh0ZW5kaW5nIHRoZSBjb250ZXh0XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gfD0gU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkO1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZpZXdEYXRhIFRoZSB2aWV3IHRvIHNlYXJjaCBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXg7XG4gIGxldCBzbG90VmFsdWU6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhO1xuXG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cblxuICBpZiAoaXNTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyIGFzIFN0eWxpbmdDb250ZXh0O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4IC0gSEVBREVSX09GRlNFVCwgdmlld0RhdGEpLnN0eWxpbmdUZW1wbGF0ZTtcblxuICAgIGlmICh3cmFwcGVyICE9PSB2aWV3RGF0YSkge1xuICAgICAgc3RvcmFnZUluZGV4ID0gSE9TVDtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcHBlcltzdG9yYWdlSW5kZXhdID0gc3R5bGluZ1RlbXBsYXRlID9cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChzbG90VmFsdWUsIHN0eWxpbmdUZW1wbGF0ZSkgOlxuICAgICAgICBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ0NvbnRleHQodmFsdWU6IGFueSk6IHZhbHVlIGlzIFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gTm90IGFuIExWaWV3IG9yIGFuIExDb250YWluZXJcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZVtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSA9PT0gJ251bWJlcicgJiZcbiAgICAgIHZhbHVlLmxlbmd0aCAhPT0gTENPTlRBSU5FUl9MRU5HVEg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0FuaW1hdGlvblByb3AobmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIHJldHVybiBuYW1lWzBdID09PSBBTklNQVRJT05fUFJPUF9QUkVGSVg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRQbGF5ZXJJbnRlcm5hbChcbiAgICBwbGF5ZXJDb250ZXh0OiBQbGF5ZXJDb250ZXh0LCByb290Q29udGV4dDogUm9vdENvbnRleHQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIHBsYXllcjogUGxheWVyIHwgbnVsbCwgcGxheWVyQ29udGV4dEluZGV4OiBudW1iZXIsIHJlZj86IGFueSk6IGJvb2xlYW4ge1xuICByZWYgPSByZWYgfHwgZWxlbWVudDtcbiAgaWYgKHBsYXllckNvbnRleHRJbmRleCkge1xuICAgIHBsYXllckNvbnRleHRbcGxheWVyQ29udGV4dEluZGV4XSA9IHBsYXllcjtcbiAgfSBlbHNlIHtcbiAgICBwbGF5ZXJDb250ZXh0LnB1c2gocGxheWVyKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXIpIHtcbiAgICBwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihQbGF5U3RhdGUuRGVzdHJveWVkLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHBsYXllckNvbnRleHQuaW5kZXhPZihwbGF5ZXIpO1xuICAgICAgY29uc3Qgbm9uRmFjdG9yeVBsYXllckluZGV4ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcblxuICAgICAgLy8gaWYgdGhlIHBsYXllciBpcyBiZWluZyByZW1vdmVkIGZyb20gdGhlIGZhY3Rvcnkgc2lkZSBvZiB0aGUgY29udGV4dFxuICAgICAgLy8gKHdoaWNoIGlzIHdoZXJlIHRoZSBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGRvIHRoZWlyIHRoaW5nKSB0aGVuXG4gICAgICAvLyB0aGF0IHNpZGUgb2YgdGhlIGFycmF5IGNhbm5vdCBiZSByZXNpemVkIHNpbmNlIHRoZSByZXNwZWN0aXZlIGJpbmRpbmdzXG4gICAgICAvLyBoYXZlIHBvaW50ZXIgaW5kZXggdmFsdWVzIHRoYXQgcG9pbnQgdG8gdGhlIGFzc29jaWF0ZWQgZmFjdG9yeSBpbnN0YW5jZVxuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCkge1xuICAgICAgICAgIHBsYXllckNvbnRleHRbaW5kZXhdID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBsYXllci5kZXN0cm95KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJIYW5kbGVyID1cbiAgICAgICAgcm9vdENvbnRleHQucGxheWVySGFuZGxlciB8fCAocm9vdENvbnRleHQucGxheWVySGFuZGxlciA9IG5ldyBDb3JlUGxheWVySGFuZGxlcigpKTtcbiAgICBwbGF5ZXJIYW5kbGVyLnF1ZXVlUGxheWVyKHBsYXllciwgcmVmKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXllcnNJbnRlcm5hbChwbGF5ZXJDb250ZXh0OiBQbGF5ZXJDb250ZXh0KTogUGxheWVyW10ge1xuICBjb25zdCBwbGF5ZXJzOiBQbGF5ZXJbXSA9IFtdO1xuICBjb25zdCBub25GYWN0b3J5UGxheWVyc1N0YXJ0ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcblxuICAvLyBhZGQgYWxsIGZhY3RvcnktYmFzZWQgcGxheWVycyAod2hpY2ggYXJlIGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBQbGF5ZXJJbmRleC5QbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb24gKyBQbGF5ZXJJbmRleC5QbGF5ZXJPZmZzZXRQb3NpdGlvbjtcbiAgICAgICBpIDwgbm9uRmFjdG9yeVBsYXllcnNTdGFydDsgaSArPSBQbGF5ZXJJbmRleC5QbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHBsYXllciA9IHBsYXllckNvbnRleHRbaV0gYXMgUGxheWVyIHwgbnVsbDtcbiAgICBpZiAocGxheWVyKSB7XG4gICAgICBwbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICB9XG4gIH1cblxuICAvLyBhZGQgYWxsIGN1c3RvbSBwbGF5ZXJzIChub3QgYXBhcnQgb2YgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncylcbiAgZm9yIChsZXQgaSA9IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgPCBwbGF5ZXJDb250ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgcGxheWVycy5wdXNoKHBsYXllckNvbnRleHRbaV0gYXMgUGxheWVyKTtcbiAgfVxuXG4gIHJldHVybiBwbGF5ZXJzO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQodGFyZ2V0OiB7fSwgY29udGV4dD86IExDb250ZXh0IHwgbnVsbCk6IFBsYXllckNvbnRleHR8XG4gICAgbnVsbCB7XG4gIGNvbnRleHQgPSBjb250ZXh0IHx8IGdldExDb250ZXh0KHRhcmdldCkgITtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgbmdEZXZNb2RlICYmIHRocm93SW52YWxpZFJlZkVycm9yKCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7bFZpZXcsIG5vZGVJbmRleH0gPSBjb250ZXh0O1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KG5vZGVJbmRleCwgbFZpZXcpO1xuICByZXR1cm4gZ2V0UGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCkgfHwgYWxsb2NQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogUGxheWVyQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIHN0eWxpbmdDb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jUGxheWVyQ29udGV4dChkYXRhOiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHQge1xuICByZXR1cm4gZGF0YVtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gPVxuICAgICAgICAgICAgIFtQbGF5ZXJJbmRleC5TaW5nbGVQbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb24sIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dJbnZhbGlkUmVmRXJyb3IoKSB7XG4gIHRocm93IG5ldyBFcnJvcignT25seSBlbGVtZW50cyB0aGF0IGV4aXN0IGluIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gY2FuIGJlIHVzZWQgZm9yIGFuaW1hdGlvbnMnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGhhc1N0eWxpbmcoYXR0cnM6IFRBdHRyaWJ1dGVzKTogYm9vbGVhbiB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBhdHRyID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHIgPT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgfHwgYXR0ciA9PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKSByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNDbGFzc0lucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQgPyB0cnVlIDogZmFsc2U7XG59XG4iXX0=