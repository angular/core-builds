/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import '../ng_dev_mode';
import { getContext } from '../context_discovery';
import { ACTIVE_INDEX } from '../interfaces/container';
import { FLAGS, HEADER_OFFSET, HOST } from '../interfaces/view';
import { getTNode } from '../util';
import { CorePlayerHandler } from './core_player_handler';
/**
 * @param {?=} element
 * @param {?=} sanitizer
 * @param {?=} initialStylingValues
 * @return {?}
 */
export function createEmptyStylingContext(element, sanitizer, initialStylingValues) {
    return [
        null,
        // PlayerContext
        sanitizer || null,
        // StyleSanitizer
        initialStylingValues || [null],
        0,
        0,
        // ClassOffset
        element || null,
        null,
        null
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
    /** @type {?} */
    const context = /** @type {?} */ ((templateStyleContext.slice()));
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
    let storageIndex = index + HEADER_OFFSET;
    /** @type {?} */
    let slotValue = viewData[storageIndex];
    /** @type {?} */
    let wrapper = viewData;
    while (Array.isArray(slotValue)) {
        wrapper = slotValue;
        slotValue = /** @type {?} */ (slotValue[HOST]);
    }
    if (isStylingContext(wrapper)) {
        return /** @type {?} */ (wrapper);
    }
    else {
        /** @type {?} */
        const stylingTemplate = getTNode(index, viewData).stylingTemplate;
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
function isStylingContext(value) {
    // Not an LView or an LContainer
    return typeof value[FLAGS] !== 'number' && typeof value[ACTIVE_INDEX] !== 'number';
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
        const player = /** @type {?} */ (playerContext[i]);
        if (player) {
            players.push(player);
        }
    }
    // add all custom players (not apart of [style] and [class] bindings)
    for (let i = nonFactoryPlayersStart; i < playerContext.length; i++) {
        players.push(/** @type {?} */ (playerContext[i]));
    }
    return players;
}
/**
 * @param {?} target
 * @param {?=} context
 * @return {?}
 */
export function getOrCreatePlayerContext(target, context) {
    context = context || /** @type {?} */ ((getContext(target)));
    if (!context) {
        ngDevMode && throwInvalidRefError();
        return null;
    }
    const { lView, nodeIndex } = context;
    /** @type {?} */
    const stylingContext = getStylingContext(nodeIndex - HEADER_OFFSET, lView);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGdCQUFnQixDQUFDO0FBR3hCLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNoRCxPQUFPLEVBQUMsWUFBWSxFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFLakUsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixNQUFNLG9CQUFvQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFakMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7QUFFeEQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF5QixFQUFFLFNBQWtDLEVBQzdELG9CQUFvQztJQUN0QyxPQUFPO1FBQ0wsSUFBSTs7UUFDSixTQUFTLElBQUksSUFBSTs7UUFDakIsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUNELENBQUM7O1FBQ0QsT0FBTyxJQUFJLElBQUk7UUFDZixJQUFJO1FBQ0osSUFBSTtLQUNMLENBQUM7Q0FDSDs7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsT0FBd0IsRUFBRSxvQkFBb0M7O0lBRWhFLE1BQU0sT0FBTyxzQkFBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQVMsR0FBbUI7SUFDdEUsT0FBTyx5QkFBOEIsR0FBRyxPQUFPLENBQUM7SUFDaEQsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBYSxFQUFFLFFBQWU7O0lBQzlELElBQUksWUFBWSxHQUFHLEtBQUssR0FBRyxhQUFhLENBQUM7O0lBQ3pDLElB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O1NBQ3RCO0tBQ0Y7O0lBR0QsS0FBSyxJQUFJLENBQUMsR0FBRyxzQkFBc0IsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNsRSxPQUFPLENBQUMsSUFBSSxtQkFBQyxhQUFhLENBQUMsQ0FBQyxDQUFXLEVBQUMsQ0FBQztLQUMxQztJQUVELE9BQU8sT0FBTyxDQUFDO0NBQ2hCOzs7Ozs7QUFHRCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsTUFBVSxFQUFFLE9BQXlCO0lBRTVFLE9BQU8sR0FBRyxPQUFPLHVCQUFJLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0lBQzFDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixTQUFTLElBQUksb0JBQW9CLEVBQUUsQ0FBQztRQUNwQyxPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsTUFBTSxFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUMsR0FBRyxPQUFPLENBQUM7O0lBQ25DLE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLFNBQVMsR0FBRyxhQUFhLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0UsT0FBTyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxrQkFBa0IsQ0FBQyxjQUFjLENBQUMsQ0FBQztDQUMvRTs7Ozs7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsY0FBOEI7SUFDN0QsT0FBTyxjQUFjLHVCQUE0QixDQUFDO0NBQ25EOzs7OztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxJQUFvQjtJQUNyRCxPQUFPLElBQUksdUJBQTRCO1FBQzVCLDRDQUFnRCxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNwRjs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0I7SUFDbEMsTUFBTSxJQUFJLEtBQUssQ0FBQywrRUFBK0UsQ0FBQyxDQUFDO0NBQ2xHIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0Q29udGV4dH0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGV4dCc7XG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyLCBQbGF5ZXJDb250ZXh0LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0luaXRpYWxTdHlsZXMsIFN0eWxpbmdDb250ZXh0LCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0ZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBMVmlldywgUm9vdENvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFROb2RlfSBmcm9tICcuLi91dGlsJztcblxuaW1wb3J0IHtDb3JlUGxheWVySGFuZGxlcn0gZnJvbSAnLi9jb3JlX3BsYXllcl9oYW5kbGVyJztcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoXG4gICAgZWxlbWVudD86IFJFbGVtZW50IHwgbnVsbCwgc2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCxcbiAgICBpbml0aWFsU3R5bGluZ1ZhbHVlcz86IEluaXRpYWxTdHlsZXMpOiBTdHlsaW5nQ29udGV4dCB7XG4gIHJldHVybiBbXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUGxheWVyQ29udGV4dFxuICAgIHNhbml0aXplciB8fCBudWxsLCAgICAgICAgICAgICAgIC8vIFN0eWxlU2FuaXRpemVyXG4gICAgaW5pdGlhbFN0eWxpbmdWYWx1ZXMgfHwgW251bGxdLCAgLy8gSW5pdGlhbFN0eWxlc1xuICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE1hc3RlckZsYWdzXG4gICAgMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQ2xhc3NPZmZzZXRcbiAgICBlbGVtZW50IHx8IG51bGwsICAgICAgICAgICAgICAgICAvLyBFbGVtZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmlvdXNNdWx0aUNsYXNzVmFsdWVcbiAgICBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQcmV2aW91c011bHRpU3R5bGVWYWx1ZVxuICBdO1xufVxuXG4vKipcbiAqIFVzZWQgY2xvbmUgYSBjb3B5IG9mIGEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIG9mIGEgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIEEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIGlzIGRlc2lnbmVkIHRvIGJlIGNvbXB1dGVkIG9uY2UgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuICogKGluc3RydWN0aW9ucy50cyBoYXMgbG9naWMgZm9yIGNhY2hpbmcgdGhpcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCwgdGVtcGxhdGVTdHlsZUNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogU3R5bGluZ0NvbnRleHQge1xuICAvLyBlYWNoIGluc3RhbmNlIGdldHMgYSBjb3B5XG4gIGNvbnN0IGNvbnRleHQgPSB0ZW1wbGF0ZVN0eWxlQ29udGV4dC5zbGljZSgpIGFzIGFueSBhcyBTdHlsaW5nQ29udGV4dDtcbiAgY29udGV4dFtTdHlsaW5nSW5kZXguRWxlbWVudFBvc2l0aW9uXSA9IGVsZW1lbnQ7XG4gIHJldHVybiBjb250ZXh0O1xufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgU3R5bGluZ0NvbnRleHRgIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKlxuICogVGhpcyBtZXRob2QgbGF6aWx5IGNyZWF0ZXMgdGhlIGBTdHlsaW5nQ29udGV4dGAuIFRoaXMgaXMgYmVjYXVzZSBpbiBtb3N0IGNhc2VzXG4gKiB3ZSBoYXZlIHN0eWxpbmcgd2l0aG91dCBhbnkgYmluZGluZ3MuIENyZWF0aW5nIGBTdHlsaW5nQ29udGV4dGAgZWFnZXJseSB3b3VsZCBtZWFuIHRoYXRcbiAqIGV2ZXJ5IHN0eWxlIGRlY2xhcmF0aW9uIHN1Y2ggYXMgYDxkaXYgc3R5bGU9XCJjb2xvcjogcmVkXCI+YCB3b3VsZCByZXN1bHQgYFN0eWxlQ29udGV4dGBcbiAqIHdoaWNoIHdvdWxkIGNyZWF0ZSB1bm5lY2Vzc2FyeSBtZW1vcnkgcHJlc3N1cmUuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBhbGxvY2F0aW9uLiBTZWU6IGBlbGVtZW50U3R5bGluZ2AuXG4gKiBAcGFyYW0gdmlld0RhdGEgVGhlIHZpZXcgdG8gc2VhcmNoIGZvciB0aGUgc3R5bGluZyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyLCB2aWV3RGF0YTogTFZpZXcpOiBTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBzdG9yYWdlSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGxldCBzbG90VmFsdWU6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhO1xuXG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cblxuICBpZiAoaXNTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyIGFzIFN0eWxpbmdDb250ZXh0O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4LCB2aWV3RGF0YSkuc3R5bGluZ1RlbXBsYXRlO1xuXG4gICAgaWYgKHdyYXBwZXIgIT09IHZpZXdEYXRhKSB7XG4gICAgICBzdG9yYWdlSW5kZXggPSBIT1NUO1xuICAgIH1cblxuICAgIHJldHVybiB3cmFwcGVyW3N0b3JhZ2VJbmRleF0gPSBzdHlsaW5nVGVtcGxhdGUgP1xuICAgICAgICBhbGxvY1N0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSwgc3R5bGluZ1RlbXBsYXRlKSA6XG4gICAgICAgIGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoc2xvdFZhbHVlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc1N0eWxpbmdDb250ZXh0KHZhbHVlOiBMVmlldyB8IExDb250YWluZXIgfCBTdHlsaW5nQ29udGV4dCkge1xuICAvLyBOb3QgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICByZXR1cm4gdHlwZW9mIHZhbHVlW0ZMQUdTXSAhPT0gJ251bWJlcicgJiYgdHlwZW9mIHZhbHVlW0FDVElWRV9JTkRFWF0gIT09ICdudW1iZXInO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVySW50ZXJuYWwoXG4gICAgcGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCwgcm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBlbGVtZW50OiBIVE1MRWxlbWVudCxcbiAgICBwbGF5ZXI6IFBsYXllciB8IG51bGwsIHBsYXllckNvbnRleHRJbmRleDogbnVtYmVyLCByZWY/OiBhbnkpOiBib29sZWFuIHtcbiAgcmVmID0gcmVmIHx8IGVsZW1lbnQ7XG4gIGlmIChwbGF5ZXJDb250ZXh0SW5kZXgpIHtcbiAgICBwbGF5ZXJDb250ZXh0W3BsYXllckNvbnRleHRJbmRleF0gPSBwbGF5ZXI7XG4gIH0gZWxzZSB7XG4gICAgcGxheWVyQ29udGV4dC5wdXNoKHBsYXllcik7XG4gIH1cblxuICBpZiAocGxheWVyKSB7XG4gICAgcGxheWVyLmFkZEV2ZW50TGlzdGVuZXIoUGxheVN0YXRlLkRlc3Ryb3llZCwgKCkgPT4ge1xuICAgICAgY29uc3QgaW5kZXggPSBwbGF5ZXJDb250ZXh0LmluZGV4T2YocGxheWVyKTtcbiAgICAgIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgICAgIC8vIGlmIHRoZSBwbGF5ZXIgaXMgYmVpbmcgcmVtb3ZlZCBmcm9tIHRoZSBmYWN0b3J5IHNpZGUgb2YgdGhlIGNvbnRleHRcbiAgICAgIC8vICh3aGljaCBpcyB3aGVyZSB0aGUgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncyBkbyB0aGVpciB0aGluZykgdGhlblxuICAgICAgLy8gdGhhdCBzaWRlIG9mIHRoZSBhcnJheSBjYW5ub3QgYmUgcmVzaXplZCBzaW5jZSB0aGUgcmVzcGVjdGl2ZSBiaW5kaW5nc1xuICAgICAgLy8gaGF2ZSBwb2ludGVyIGluZGV4IHZhbHVlcyB0aGF0IHBvaW50IHRvIHRoZSBhc3NvY2lhdGVkIGZhY3RvcnkgaW5zdGFuY2VcbiAgICAgIGlmIChpbmRleCkge1xuICAgICAgICBpZiAoaW5kZXggPCBub25GYWN0b3J5UGxheWVySW5kZXgpIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0W2luZGV4XSA9IG51bGw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dC5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwbGF5ZXIuZGVzdHJveSgpO1xuICAgIH0pO1xuXG4gICAgY29uc3QgcGxheWVySGFuZGxlciA9XG4gICAgICAgIHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgfHwgKHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXIgPSBuZXcgQ29yZVBsYXllckhhbmRsZXIoKSk7XG4gICAgcGxheWVySGFuZGxlci5xdWV1ZVBsYXllcihwbGF5ZXIsIHJlZik7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJzSW50ZXJuYWwocGxheWVyQ29udGV4dDogUGxheWVyQ29udGV4dCk6IFBsYXllcltdIHtcbiAgY29uc3QgcGxheWVyczogUGxheWVyW10gPSBbXTtcbiAgY29uc3Qgbm9uRmFjdG9yeVBsYXllcnNTdGFydCA9IHBsYXllckNvbnRleHRbUGxheWVySW5kZXguTm9uQnVpbGRlclBsYXllcnNTdGFydF07XG5cbiAgLy8gYWRkIGFsbCBmYWN0b3J5LWJhc2VkIHBsYXllcnMgKHdoaWNoIGFyZSBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gUGxheWVySW5kZXguUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uICsgUGxheWVySW5kZXguUGxheWVyT2Zmc2V0UG9zaXRpb247XG4gICAgICAgaSA8IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgKz0gUGxheWVySW5kZXguUGxheWVyQW5kUGxheWVyQnVpbGRlcnNUdXBsZVNpemUpIHtcbiAgICBjb25zdCBwbGF5ZXIgPSBwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllciB8IG51bGw7XG4gICAgaWYgKHBsYXllcikge1xuICAgICAgcGxheWVycy5wdXNoKHBsYXllcik7XG4gICAgfVxuICB9XG5cbiAgLy8gYWRkIGFsbCBjdXN0b20gcGxheWVycyAobm90IGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpIDwgcGxheWVyQ29udGV4dC5sZW5ndGg7IGkrKykge1xuICAgIHBsYXllcnMucHVzaChwbGF5ZXJDb250ZXh0W2ldIGFzIFBsYXllcik7XG4gIH1cblxuICByZXR1cm4gcGxheWVycztcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0KHRhcmdldDoge30sIGNvbnRleHQ/OiBMQ29udGV4dCB8IG51bGwpOiBQbGF5ZXJDb250ZXh0fFxuICAgIG51bGwge1xuICBjb250ZXh0ID0gY29udGV4dCB8fCBnZXRDb250ZXh0KHRhcmdldCkgITtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgbmdEZXZNb2RlICYmIHRocm93SW52YWxpZFJlZkVycm9yKCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7bFZpZXcsIG5vZGVJbmRleH0gPSBjb250ZXh0O1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KG5vZGVJbmRleCAtIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgcmV0dXJuIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpIHx8IGFsbG9jUGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHR8bnVsbCB7XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1BsYXllckNvbnRleHQoZGF0YTogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0IHtcbiAgcmV0dXJuIGRhdGFbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdID1cbiAgICAgICAgICAgICBbUGxheWVySW5kZXguU2luZ2xlUGxheWVyQnVpbGRlcnNTdGFydFBvc2l0aW9uLCBudWxsLCBudWxsLCBudWxsLCBudWxsXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRocm93SW52YWxpZFJlZkVycm9yKCkge1xuICB0aHJvdyBuZXcgRXJyb3IoJ09ubHkgZWxlbWVudHMgdGhhdCBleGlzdCBpbiBhbiBBbmd1bGFyIGFwcGxpY2F0aW9uIGNhbiBiZSB1c2VkIGZvciBhbmltYXRpb25zJyk7XG59XG4iXX0=