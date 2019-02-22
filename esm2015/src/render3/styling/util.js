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
import { getTNode } from '../util/view_utils';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyx3QkFBd0IsQ0FBQztBQUdoQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFPakQsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQXFCLE1BQU0sb0JBQW9CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUV4RCxNQUFNLE9BQU8scUJBQXFCLEdBQUcsR0FBRzs7Ozs7Ozs7QUFFeEMsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF5QixFQUFFLFNBQWtDLEVBQzdELGFBQTJDLEVBQzNDLGNBQTRDOztVQUN4QyxPQUFPLEdBQW1CO1FBQzlCLENBQUM7UUFDRCxtQkFBQSxFQUFFLEVBQU87UUFDVCxhQUFhLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO1FBQzdCLGNBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7UUFDOUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ04sT0FBTyxJQUFJLElBQUk7UUFDZixDQUFDLENBQUMsQ0FBQztRQUNILENBQUMsQ0FBQyxDQUFDO1FBQ0gsSUFBSTtLQUNMO0lBQ0QsNEJBQTRCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSw0QkFBNEIsQ0FBQyxPQUF1QixFQUFFLFlBQXdCO0lBQzVGLHNEQUFzRDtJQUN0RCxPQUFPLG1DQUF3QyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsQ0FBQyxD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LGtCQUEwQjtZQUFFLE9BQU8sSUFBSSxDQUFDO0tBQ3BGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtTdHlsZVNhbml0aXplRm59IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zdHlsZV9zYW5pdGl6ZXInO1xuaW1wb3J0IHtnZXRMQ29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtMQ09OVEFJTkVSX0xFTkdUSCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyLCBQbGF5ZXJDb250ZXh0LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsaW5nVmFsdWVzLCBJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0VE5vZGV9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7Q29yZVBsYXllckhhbmRsZXJ9IGZyb20gJy4vY29yZV9wbGF5ZXJfaGFuZGxlcic7XG5cbmV4cG9ydCBjb25zdCBBTklNQVRJT05fUFJPUF9QUkVGSVggPSAnQCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ/OiBSRWxlbWVudCB8IG51bGwsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgaW5pdGlhbFN0eWxlcz86IEluaXRpYWxTdHlsaW5nVmFsdWVzIHwgbnVsbCxcbiAgICBpbml0aWFsQ2xhc3Nlcz86IEluaXRpYWxTdHlsaW5nVmFsdWVzIHwgbnVsbCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgY29uc3QgY29udGV4dDogU3R5bGluZ0NvbnRleHQgPSBbXG4gICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFzdGVyRmxhZ3NcbiAgICBbXSBhcyBhbnksICAgICAgICAgICAgICAgICAgICAgICAvLyBEaXJlY3RpdmVSZWZzICh0aGlzIGdldHMgZmlsbGVkIGJlbG93KVxuICAgIGluaXRpYWxTdHlsZXMgfHwgW251bGwsIG51bGxdLCAgIC8vIEluaXRpYWxTdHlsZXNcbiAgICBpbml0aWFsQ2xhc3NlcyB8fCBbbnVsbCwgbnVsbF0sICAvLyBJbml0aWFsQ2xhc3Nlc1xuICAgIFswLCAwXSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNpbmdsZVByb3BPZmZzZXRzXG4gICAgZWxlbWVudCB8fCBudWxsLCAgICAgICAgICAgICAgICAgLy8gRWxlbWVudFxuICAgIFswXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhY2hlZE11bHRpQ2xhc3NWYWx1ZVxuICAgIFswXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENhY2hlZE11bHRpU3R5bGVWYWx1ZVxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYXllckNvbnRleHRcbiAgXTtcbiAgYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dChjb250ZXh0LCBudWxsKTtcbiAgcmV0dXJuIGNvbnRleHQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0KGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0LCBkaXJlY3RpdmVSZWY6IGFueSB8IG51bGwpIHtcbiAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkRpcmVjdGl2ZVJlZ2lzdHJ5UG9zaXRpb25dLnB1c2goZGlyZWN0aXZlUmVmLCAtMSwgZmFsc2UsIG51bGwpO1xufVxuXG4vKipcbiAqIFVzZWQgY2xvbmUgYSBjb3B5IG9mIGEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIG9mIGEgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIEEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIGlzIGRlc2lnbmVkIHRvIGJlIGNvbXB1dGVkIG9uY2UgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuICogKGluc3RydWN0aW9ucy50cyBoYXMgbG9naWMgZm9yIGNhY2hpbmcgdGhpcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCwgdGVtcGxhdGVTdHlsZUNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogU3R5bGluZ0NvbnRleHQge1xuICAvLyBlYWNoIGluc3RhbmNlIGdldHMgYSBjb3B5XG4gIGNvbnN0IGNvbnRleHQgPSB0ZW1wbGF0ZVN0eWxlQ29udGV4dC5zbGljZSgpIGFzIGFueSBhcyBTdHlsaW5nQ29udGV4dDtcblxuICAvLyB0aGUgSEVBREVSIHZhbHVlcyBjb250YWluIGFycmF5cyB3aGljaCBhbHNvIG5lZWRcbiAgLy8gdG8gYmUgY29waWVkIG92ZXIgaW50byB0aGUgbmV3IGNvbnRleHRcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0ZW1wbGF0ZVN0eWxlQ29udGV4dFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGNvbnRleHRbaV0gPSB2YWx1ZS5zbGljZSgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gPSBlbGVtZW50O1xuXG4gIC8vIHRoaXMgd2lsbCBwcmV2ZW50IGFueSBvdGhlciBkaXJlY3RpdmVzIGZyb20gZXh0ZW5kaW5nIHRoZSBjb250ZXh0XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gfD0gU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkO1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZpZXdEYXRhIFRoZSB2aWV3IHRvIHNlYXJjaCBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXg7XG4gIGxldCBzbG90VmFsdWU6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhO1xuXG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cblxuICBpZiAoaXNTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyIGFzIFN0eWxpbmdDb250ZXh0O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4IC0gSEVBREVSX09GRlNFVCwgdmlld0RhdGEpLnN0eWxpbmdUZW1wbGF0ZTtcblxuICAgIGlmICh3cmFwcGVyICE9PSB2aWV3RGF0YSkge1xuICAgICAgc3RvcmFnZUluZGV4ID0gSE9TVDtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcHBlcltzdG9yYWdlSW5kZXhdID0gc3R5bGluZ1RlbXBsYXRlID9cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChzbG90VmFsdWUsIHN0eWxpbmdUZW1wbGF0ZSkgOlxuICAgICAgICBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ0NvbnRleHQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICAvLyBOb3QgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID49IFN0eWxpbmdJbmRleC5TaW5nbGVTdHlsZXNTdGFydFBvc2l0aW9uKSB7XG4gICAgcmV0dXJuIHR5cGVvZiB2YWx1ZVtTdHlsaW5nSW5kZXguTWFzdGVyRmxhZ1Bvc2l0aW9uXSA9PT0gJ251bWJlcicgJiZcbiAgICAgICAgdmFsdWVbU3R5bGluZ0luZGV4LkluaXRpYWxDbGFzc1ZhbHVlc1Bvc2l0aW9uXVxuICAgICAgICAgICAgIFtJbml0aWFsU3R5bGluZ1ZhbHVlc0luZGV4LkRlZmF1bHROdWxsVmFsdWVQb3NpdGlvbl0gPT09IG51bGw7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBbmltYXRpb25Qcm9wKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZVswXSA9PT0gQU5JTUFUSU9OX1BST1BfUFJFRklYO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6XG4gICAgc3RyaW5nIHtcbiAgaWYgKGNsYXNzZXMgJiYgdHlwZW9mIGNsYXNzZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgY2xhc3NlcyA9IE9iamVjdC5rZXlzKGNsYXNzZXMpLmpvaW4oJyAnKTtcbiAgfVxuICByZXR1cm4gKGNsYXNzZXMgYXMgc3RyaW5nKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgc3RyICs9IChpID8gJzsnIDogJycpICsgYCR7cHJvcH06JHtzdHlsZXNbcHJvcF19YDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFBsYXllckludGVybmFsKFxuICAgIHBsYXllckNvbnRleHQ6IFBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0OiBSb290Q29udGV4dCwgZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgcGxheWVyOiBQbGF5ZXIgfCBudWxsLCBwbGF5ZXJDb250ZXh0SW5kZXg6IG51bWJlciwgcmVmPzogYW55KTogYm9vbGVhbiB7XG4gIHJlZiA9IHJlZiB8fCBlbGVtZW50O1xuICBpZiAocGxheWVyQ29udGV4dEluZGV4KSB7XG4gICAgcGxheWVyQ29udGV4dFtwbGF5ZXJDb250ZXh0SW5kZXhdID0gcGxheWVyO1xuICB9IGVsc2Uge1xuICAgIHBsYXllckNvbnRleHQucHVzaChwbGF5ZXIpO1xuICB9XG5cbiAgaWYgKHBsYXllcikge1xuICAgIHBsYXllci5hZGRFdmVudExpc3RlbmVyKFBsYXlTdGF0ZS5EZXN0cm95ZWQsICgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGxheWVyQ29udGV4dC5pbmRleE9mKHBsYXllcik7XG4gICAgICBjb25zdCBub25GYWN0b3J5UGxheWVySW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuXG4gICAgICAvLyBpZiB0aGUgcGxheWVyIGlzIGJlaW5nIHJlbW92ZWQgZnJvbSB0aGUgZmFjdG9yeSBzaWRlIG9mIHRoZSBjb250ZXh0XG4gICAgICAvLyAod2hpY2ggaXMgd2hlcmUgdGhlIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgZG8gdGhlaXIgdGhpbmcpIHRoZW5cbiAgICAgIC8vIHRoYXQgc2lkZSBvZiB0aGUgYXJyYXkgY2Fubm90IGJlIHJlc2l6ZWQgc2luY2UgdGhlIHJlc3BlY3RpdmUgYmluZGluZ3NcbiAgICAgIC8vIGhhdmUgcG9pbnRlciBpbmRleCB2YWx1ZXMgdGhhdCBwb2ludCB0byB0aGUgYXNzb2NpYXRlZCBmYWN0b3J5IGluc3RhbmNlXG4gICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4IDwgbm9uRmFjdG9yeVBsYXllckluZGV4KSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dFtpbmRleF0gPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllckNvbnRleHQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPVxuICAgICAgICByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyIHx8IChyb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyID0gbmV3IENvcmVQbGF5ZXJIYW5kbGVyKCkpO1xuICAgIHBsYXllckhhbmRsZXIucXVldWVQbGF5ZXIocGxheWVyLCByZWYpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxheWVyc0ludGVybmFsKHBsYXllckNvbnRleHQ6IFBsYXllckNvbnRleHQpOiBQbGF5ZXJbXSB7XG4gIGNvbnN0IHBsYXllcnM6IFBsYXllcltdID0gW107XG4gIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQgPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuXG4gIC8vIGFkZCBhbGwgZmFjdG9yeS1iYXNlZCBwbGF5ZXJzICh3aGljaCBhcmUgYXBhcnQgb2YgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncylcbiAgZm9yIChsZXQgaSA9IFBsYXllckluZGV4LlBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbiArIFBsYXllckluZGV4LlBsYXllck9mZnNldFBvc2l0aW9uO1xuICAgICAgIGkgPCBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcGxheWVyID0gcGxheWVyQ29udGV4dFtpXSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgIGlmIChwbGF5ZXIpIHtcbiAgICAgIHBsYXllcnMucHVzaChwbGF5ZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFkZCBhbGwgY3VzdG9tIHBsYXllcnMgKG5vdCBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gbm9uRmFjdG9yeVBsYXllcnNTdGFydDsgaSA8IHBsYXllckNvbnRleHQubGVuZ3RoOyBpKyspIHtcbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyQ29udGV4dFtpXSBhcyBQbGF5ZXIpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXllcnM7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlUGxheWVyQ29udGV4dCh0YXJnZXQ6IHt9LCBjb250ZXh0PzogTENvbnRleHQgfCBudWxsKTogUGxheWVyQ29udGV4dHxcbiAgICBudWxsIHtcbiAgY29udGV4dCA9IGNvbnRleHQgfHwgZ2V0TENvbnRleHQodGFyZ2V0KSAhO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdGhyb3dJbnZhbGlkUmVmRXJyb3IoKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHtsVmlldywgbm9kZUluZGV4fSA9IGNvbnRleHQ7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobm9kZUluZGV4LCBsVmlldyk7XG4gIHJldHVybiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KSB8fCBhbGxvY1BsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0fG51bGwge1xuICByZXR1cm4gc3R5bGluZ0NvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NQbGF5ZXJDb250ZXh0KGRhdGE6IFN0eWxpbmdDb250ZXh0KTogUGxheWVyQ29udGV4dCB7XG4gIHJldHVybiBkYXRhW1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSA9XG4gICAgICAgICAgICAgW1BsYXllckluZGV4LlNpbmdsZVBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbiwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0ludmFsaWRSZWZFcnJvcigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGVsZW1lbnRzIHRoYXQgZXhpc3QgaW4gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gYmUgdXNlZCBmb3IgYW5pbWF0aW9ucycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzU3R5bGluZyhhdHRyczogVEF0dHJpYnV0ZXMpOiBib29sZWFuIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGF0dHIgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ciA9PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcyB8fCBhdHRyID09IEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMpIHJldHVybiB0cnVlO1xuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cbiJdfQ==