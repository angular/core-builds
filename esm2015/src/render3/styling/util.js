/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import '../ng_dev_mode';
import { getLContext } from '../context_discovery';
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
    let storageIndex = index;
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
    context = context || /** @type {?} */ ((getLContext(target)));
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFPQSxPQUFPLGdCQUFnQixDQUFDO0FBR3hCLE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFLakUsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFxQixNQUFNLG9CQUFvQixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxRQUFRLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFakMsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7Ozs7Ozs7QUFFeEQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxPQUF5QixFQUFFLFNBQWtDLEVBQzdELG9CQUFvQztJQUN0QyxPQUFPO1FBQ0wsSUFBSTs7UUFDSixTQUFTLElBQUksSUFBSTs7UUFDakIsb0JBQW9CLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDOUIsQ0FBQztRQUNELENBQUM7O1FBQ0QsT0FBTyxJQUFJLElBQUk7UUFDZixJQUFJO1FBQ0osSUFBSTtLQUNMLENBQUM7Q0FDSDs7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsT0FBd0IsRUFBRSxvQkFBb0M7O0lBRWhFLE1BQU0sT0FBTyxzQkFBRyxvQkFBb0IsQ0FBQyxLQUFLLEVBQVMsR0FBbUI7SUFDdEUsT0FBTyx5QkFBOEIsR0FBRyxPQUFPLENBQUM7SUFDaEQsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBYSxFQUFFLFFBQWU7O0lBQzlELElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQzs7SUFDekIsSUFBSSxTQUFTLEdB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ICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0ICcuLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRleHQnO1xuaW1wb3J0IHtQbGF5U3RhdGUsIFBsYXllciwgUGxheWVyQ29udGV4dCwgUGxheWVySW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7UkVsZW1lbnR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtJbml0aWFsU3R5bGVzLCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0luZGV4fSBmcm9tICcuLi9pbnRlcmZhY2VzL3N0eWxpbmcnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgTFZpZXcsIFJvb3RDb250ZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtnZXRUTm9kZX0gZnJvbSAnLi4vdXRpbCc7XG5cbmltcG9ydCB7Q29yZVBsYXllckhhbmRsZXJ9IGZyb20gJy4vY29yZV9wbGF5ZXJfaGFuZGxlcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ/OiBSRWxlbWVudCB8IG51bGwsIHNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsXG4gICAgaW5pdGlhbFN0eWxpbmdWYWx1ZXM/OiBJbml0aWFsU3R5bGVzKTogU3R5bGluZ0NvbnRleHQge1xuICByZXR1cm4gW1xuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFBsYXllckNvbnRleHRcbiAgICBzYW5pdGl6ZXIgfHwgbnVsbCwgICAgICAgICAgICAgICAvLyBTdHlsZVNhbml0aXplclxuICAgIGluaXRpYWxTdHlsaW5nVmFsdWVzIHx8IFtudWxsXSwgIC8vIEluaXRpYWxTdHlsZXNcbiAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXN0ZXJGbGFnc1xuICAgIDAsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIENsYXNzT2Zmc2V0XG4gICAgZWxlbWVudCB8fCBudWxsLCAgICAgICAgICAgICAgICAgLy8gRWxlbWVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFByZXZpb3VzTXVsdGlDbGFzc1ZhbHVlXG4gICAgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gUHJldmlvdXNNdWx0aVN0eWxlVmFsdWVcbiAgXTtcbn1cblxuLyoqXG4gKiBVc2VkIGNsb25lIGEgY29weSBvZiBhIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBvZiBhIHN0eWxpbmcgY29udGV4dC5cbiAqXG4gKiBBIHByZS1jb21wdXRlZCB0ZW1wbGF0ZSBpcyBkZXNpZ25lZCB0byBiZSBjb21wdXRlZCBvbmNlIGZvciBhIGdpdmVuIGVsZW1lbnRcbiAqIChpbnN0cnVjdGlvbnMudHMgaGFzIGxvZ2ljIGZvciBjYWNoaW5nIHRoaXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NTdHlsaW5nQ29udGV4dChcbiAgICBlbGVtZW50OiBSRWxlbWVudCB8IG51bGwsIHRlbXBsYXRlU3R5bGVDb250ZXh0OiBTdHlsaW5nQ29udGV4dCk6IFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gZWFjaCBpbnN0YW5jZSBnZXRzIGEgY29weVxuICBjb25zdCBjb250ZXh0ID0gdGVtcGxhdGVTdHlsZUNvbnRleHQuc2xpY2UoKSBhcyBhbnkgYXMgU3R5bGluZ0NvbnRleHQ7XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gPSBlbGVtZW50O1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZpZXdEYXRhIFRoZSB2aWV3IHRvIHNlYXJjaCBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXg7XG4gIGxldCBzbG90VmFsdWU6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhO1xuXG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cblxuICBpZiAoaXNTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyIGFzIFN0eWxpbmdDb250ZXh0O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4IC0gSEVBREVSX09GRlNFVCwgdmlld0RhdGEpLnN0eWxpbmdUZW1wbGF0ZTtcblxuICAgIGlmICh3cmFwcGVyICE9PSB2aWV3RGF0YSkge1xuICAgICAgc3RvcmFnZUluZGV4ID0gSE9TVDtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcHBlcltzdG9yYWdlSW5kZXhdID0gc3R5bGluZ1RlbXBsYXRlID9cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChzbG90VmFsdWUsIHN0eWxpbmdUZW1wbGF0ZSkgOlxuICAgICAgICBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzU3R5bGluZ0NvbnRleHQodmFsdWU6IGFueSk6IHZhbHVlIGlzIFN0eWxpbmdDb250ZXh0IHtcbiAgLy8gTm90IGFuIExWaWV3IG9yIGFuIExDb250YWluZXJcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkodmFsdWUpICYmIHR5cGVvZiB2YWx1ZVtGTEFHU10gIT09ICdudW1iZXInICYmXG4gICAgICB0eXBlb2YgdmFsdWVbQUNUSVZFX0lOREVYXSAhPT0gJ251bWJlcic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhZGRQbGF5ZXJJbnRlcm5hbChcbiAgICBwbGF5ZXJDb250ZXh0OiBQbGF5ZXJDb250ZXh0LCByb290Q29udGV4dDogUm9vdENvbnRleHQsIGVsZW1lbnQ6IEhUTUxFbGVtZW50LFxuICAgIHBsYXllcjogUGxheWVyIHwgbnVsbCwgcGxheWVyQ29udGV4dEluZGV4OiBudW1iZXIsIHJlZj86IGFueSk6IGJvb2xlYW4ge1xuICByZWYgPSByZWYgfHwgZWxlbWVudDtcbiAgaWYgKHBsYXllckNvbnRleHRJbmRleCkge1xuICAgIHBsYXllckNvbnRleHRbcGxheWVyQ29udGV4dEluZGV4XSA9IHBsYXllcjtcbiAgfSBlbHNlIHtcbiAgICBwbGF5ZXJDb250ZXh0LnB1c2gocGxheWVyKTtcbiAgfVxuXG4gIGlmIChwbGF5ZXIpIHtcbiAgICBwbGF5ZXIuYWRkRXZlbnRMaXN0ZW5lcihQbGF5U3RhdGUuRGVzdHJveWVkLCAoKSA9PiB7XG4gICAgICBjb25zdCBpbmRleCA9IHBsYXllckNvbnRleHQuaW5kZXhPZihwbGF5ZXIpO1xuICAgICAgY29uc3Qgbm9uRmFjdG9yeVBsYXllckluZGV4ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcblxuICAgICAgLy8gaWYgdGhlIHBsYXllciBpcyBiZWluZyByZW1vdmVkIGZyb20gdGhlIGZhY3Rvcnkgc2lkZSBvZiB0aGUgY29udGV4dFxuICAgICAgLy8gKHdoaWNoIGlzIHdoZXJlIHRoZSBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzIGRvIHRoZWlyIHRoaW5nKSB0aGVuXG4gICAgICAvLyB0aGF0IHNpZGUgb2YgdGhlIGFycmF5IGNhbm5vdCBiZSByZXNpemVkIHNpbmNlIHRoZSByZXNwZWN0aXZlIGJpbmRpbmdzXG4gICAgICAvLyBoYXZlIHBvaW50ZXIgaW5kZXggdmFsdWVzIHRoYXQgcG9pbnQgdG8gdGhlIGFzc29jaWF0ZWQgZmFjdG9yeSBpbnN0YW5jZVxuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIGlmIChpbmRleCA8IG5vbkZhY3RvcnlQbGF5ZXJJbmRleCkge1xuICAgICAgICAgIHBsYXllckNvbnRleHRbaW5kZXhdID0gbnVsbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwbGF5ZXJDb250ZXh0LnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHBsYXllci5kZXN0cm95KCk7XG4gICAgfSk7XG5cbiAgICBjb25zdCBwbGF5ZXJIYW5kbGVyID1cbiAgICAgICAgcm9vdENvbnRleHQucGxheWVySGFuZGxlciB8fCAocm9vdENvbnRleHQucGxheWVySGFuZGxlciA9IG5ldyBDb3JlUGxheWVySGFuZGxlcigpKTtcbiAgICBwbGF5ZXJIYW5kbGVyLnF1ZXVlUGxheWVyKHBsYXllciwgcmVmKTtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXllcnNJbnRlcm5hbChwbGF5ZXJDb250ZXh0OiBQbGF5ZXJDb250ZXh0KTogUGxheWVyW10ge1xuICBjb25zdCBwbGF5ZXJzOiBQbGF5ZXJbXSA9IFtdO1xuICBjb25zdCBub25GYWN0b3J5UGxheWVyc1N0YXJ0ID0gcGxheWVyQ29udGV4dFtQbGF5ZXJJbmRleC5Ob25CdWlsZGVyUGxheWVyc1N0YXJ0XTtcblxuICAvLyBhZGQgYWxsIGZhY3RvcnktYmFzZWQgcGxheWVycyAod2hpY2ggYXJlIGFwYXJ0IG9mIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MpXG4gIGZvciAobGV0IGkgPSBQbGF5ZXJJbmRleC5QbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb24gKyBQbGF5ZXJJbmRleC5QbGF5ZXJPZmZzZXRQb3NpdGlvbjtcbiAgICAgICBpIDwgbm9uRmFjdG9yeVBsYXllcnNTdGFydDsgaSArPSBQbGF5ZXJJbmRleC5QbGF5ZXJBbmRQbGF5ZXJCdWlsZGVyc1R1cGxlU2l6ZSkge1xuICAgIGNvbnN0IHBsYXllciA9IHBsYXllckNvbnRleHRbaV0gYXMgUGxheWVyIHwgbnVsbDtcbiAgICBpZiAocGxheWVyKSB7XG4gICAgICBwbGF5ZXJzLnB1c2gocGxheWVyKTtcbiAgICB9XG4gIH1cblxuICAvLyBhZGQgYWxsIGN1c3RvbSBwbGF5ZXJzIChub3QgYXBhcnQgb2YgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncylcbiAgZm9yIChsZXQgaSA9IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQ7IGkgPCBwbGF5ZXJDb250ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgcGxheWVycy5wdXNoKHBsYXllckNvbnRleHRbaV0gYXMgUGxheWVyKTtcbiAgfVxuXG4gIHJldHVybiBwbGF5ZXJzO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQodGFyZ2V0OiB7fSwgY29udGV4dD86IExDb250ZXh0IHwgbnVsbCk6IFBsYXllckNvbnRleHR8XG4gICAgbnVsbCB7XG4gIGNvbnRleHQgPSBjb250ZXh0IHx8IGdldExDb250ZXh0KHRhcmdldCkgITtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgbmdEZXZNb2RlICYmIHRocm93SW52YWxpZFJlZkVycm9yKCk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBjb25zdCB7bFZpZXcsIG5vZGVJbmRleH0gPSBjb250ZXh0O1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KG5vZGVJbmRleCwgbFZpZXcpO1xuICByZXR1cm4gZ2V0UGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dCkgfHwgYWxsb2NQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogUGxheWVyQ29udGV4dHxudWxsIHtcbiAgcmV0dXJuIHN0eWxpbmdDb250ZXh0W1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jUGxheWVyQ29udGV4dChkYXRhOiBTdHlsaW5nQ29udGV4dCk6IFBsYXllckNvbnRleHQge1xuICByZXR1cm4gZGF0YVtTdHlsaW5nSW5kZXguUGxheWVyQ29udGV4dF0gPVxuICAgICAgICAgICAgIFtQbGF5ZXJJbmRleC5TaW5nbGVQbGF5ZXJCdWlsZGVyc1N0YXJ0UG9zaXRpb24sIG51bGwsIG51bGwsIG51bGwsIG51bGxdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dJbnZhbGlkUmVmRXJyb3IoKSB7XG4gIHRocm93IG5ldyBFcnJvcignT25seSBlbGVtZW50cyB0aGF0IGV4aXN0IGluIGFuIEFuZ3VsYXIgYXBwbGljYXRpb24gY2FuIGJlIHVzZWQgZm9yIGFuaW1hdGlvbnMnKTtcbn1cbiJdfQ==