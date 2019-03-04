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
import { getTNode, isStylingContext } from '../util/view_utils';
import { CorePlayerHandler } from './core_player_handler';
/** @type {?} */
export const ANIMATION_PROP_PREFIX = '@';
/**
 * @param {?=} wrappedElement
 * @param {?=} sanitizer
 * @param {?=} initialStyles
 * @param {?=} initialClasses
 * @return {?}
 */
export function createEmptyStylingContext(wrappedElement, sanitizer, initialStyles, initialClasses) {
    /** @type {?} */
    const context = [
        wrappedElement || null,
        0,
        (/** @type {?} */ ([])),
        initialStyles || [null, null],
        initialClasses || [null, null],
        [0, 0],
        [0],
        [0],
        null,
    ];
    // whenever a context is created there is always a `null` directive
    // that is registered (which is a placeholder for the "template").
    allocateDirectiveIntoContext(context, null);
    return context;
}
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
 * @param {?} context the target StylingContext
 * @param {?} directiveRef the directive that will be allocated into the context
 * @return {?} the index where the directive was inserted into
 */
export function allocateDirectiveIntoContext(context, directiveRef) {
    // this is a new directive which we have not seen yet.
    /** @type {?} */
    const dirs = context[2 /* DirectiveRegistryPosition */];
    /** @type {?} */
    const i = dirs.length;
    // we preemptively make space into the directives array and then
    // assign values slot-by-slot to ensure that if the directive ordering
    // changes then it will still function
    dirs.push(null, null, null, null);
    dirs[i + 0 /* DirectiveValueOffset */] = directiveRef;
    dirs[i + 2 /* DirtyFlagOffset */] = false;
    dirs[i + 3 /* StyleSanitizerOffset */] = null;
    // -1 is used to signal that the directive has been allocated, but
    // no actual style or class bindings have been registered yet...
    dirs[i + 1 /* SinglePropValuesIndexOffset */] = -1;
    return i;
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
    context[0 /* ElementPosition */] = element;
    // this will prevent any other directives from extending the context
    context[1 /* MasterFlagPosition */] |= 16 /* BindingAllocationLocked */;
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
        return wrapper;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvc3R5bGluZy91dGlsLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBT0EsT0FBTyx3QkFBd0IsQ0FBQztBQUdoQyxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFPakQsT0FBTyxFQUFDLGFBQWEsRUFBRSxJQUFJLEVBQXFCLE1BQU0sb0JBQW9CLENBQUM7QUFDM0UsT0FBTyxFQUFDLFFBQVEsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRTlELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOztBQUV4RCxNQUFNLE9BQU8scUJBQXFCLEdBQUcsR0FBRzs7Ozs7Ozs7QUFFeEMsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxjQUFxRCxFQUFFLFNBQWtDLEVBQ3pGLGFBQTJDLEVBQzNDLGNBQTRDOztVQUN4QyxPQUFPLEdBQW1CO1FBQzlCLGNBQWMsSUFBSSxJQUFJO1FBQ3RCLENBQUM7UUFDRCxtQkFBQSxFQUFFLEVBQU87UUFDVCxhQUFhLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDO1FBQzdCLGNBQWMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUM7UUFDOUIsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ04sQ0FBQyxDQUFDLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUNILElBQUk7S0FDTDtJQUVELG1FQUFtRTtJQUNuRSxrRUFBa0U7SUFDbEUsNEJBQTRCLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVDLE9BQU8sT0FBTyxDQUFDO0FBQ2pCLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JELE1BQU0sVUFBVSw0QkFBNEIsQ0FDeEMsT0FBdUIsRUFBRSxZQUF3Qjs7O1VBRTdDLElB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LiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMQ29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250ZXh0JztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQXR0cmlidXRlcywgVE5vZGUsIFROb2RlRmxhZ3N9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyLCBQbGF5ZXJDb250ZXh0LCBQbGF5ZXJJbmRleH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtSRWxlbWVudH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXgsIEluaXRpYWxTdHlsaW5nVmFsdWVzLCBTdHlsaW5nQ29udGV4dCwgU3R5bGluZ0ZsYWdzLCBTdHlsaW5nSW5kZXh9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIEhPU1QsIExWaWV3LCBSb290Q29udGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0VE5vZGUsIGlzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7Q29yZVBsYXllckhhbmRsZXJ9IGZyb20gJy4vY29yZV9wbGF5ZXJfaGFuZGxlcic7XG5cbmV4cG9ydCBjb25zdCBBTklNQVRJT05fUFJPUF9QUkVGSVggPSAnQCc7XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KFxuICAgIHdyYXBwZWRFbGVtZW50PzogTENvbnRhaW5lciB8IExWaWV3IHwgUkVsZW1lbnQgfCBudWxsLCBzYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLFxuICAgIGluaXRpYWxTdHlsZXM/OiBJbml0aWFsU3R5bGluZ1ZhbHVlcyB8IG51bGwsXG4gICAgaW5pdGlhbENsYXNzZXM/OiBJbml0aWFsU3R5bGluZ1ZhbHVlcyB8IG51bGwpOiBTdHlsaW5nQ29udGV4dCB7XG4gIGNvbnN0IGNvbnRleHQ6IFN0eWxpbmdDb250ZXh0ID0gW1xuICAgIHdyYXBwZWRFbGVtZW50IHx8IG51bGwsICAgICAgICAgIC8vIEVsZW1lbnRcbiAgICAwLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYXN0ZXJGbGFnc1xuICAgIFtdIGFzIGFueSwgICAgICAgICAgICAgICAgICAgICAgIC8vIERpcmVjdGl2ZVJlZnMgKHRoaXMgZ2V0cyBmaWxsZWQgYmVsb3cpXG4gICAgaW5pdGlhbFN0eWxlcyB8fCBbbnVsbCwgbnVsbF0sICAgLy8gSW5pdGlhbFN0eWxlc1xuICAgIGluaXRpYWxDbGFzc2VzIHx8IFtudWxsLCBudWxsXSwgIC8vIEluaXRpYWxDbGFzc2VzXG4gICAgWzAsIDBdLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2luZ2xlUHJvcE9mZnNldHNcbiAgICBbMF0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZWRNdWx0aUNsYXNzVmFsdWVcbiAgICBbMF0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBDYWNoZWRNdWx0aVN0eWxlVmFsdWVcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBQbGF5ZXJDb250ZXh0XG4gIF07XG5cbiAgLy8gd2hlbmV2ZXIgYSBjb250ZXh0IGlzIGNyZWF0ZWQgdGhlcmUgaXMgYWx3YXlzIGEgYG51bGxgIGRpcmVjdGl2ZVxuICAvLyB0aGF0IGlzIHJlZ2lzdGVyZWQgKHdoaWNoIGlzIGEgcGxhY2Vob2xkZXIgZm9yIHRoZSBcInRlbXBsYXRlXCIpLlxuICBhbGxvY2F0ZURpcmVjdGl2ZUludG9Db250ZXh0KGNvbnRleHQsIG51bGwpO1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgKHJlZ2lzdGVycykgYSBkaXJlY3RpdmUgaW50byB0aGUgZGlyZWN0aXZlIHJlZ2lzdHJ5IHdpdGhpbiB0aGUgcHJvdmlkZWQgc3R5bGluZ1xuICogY29udGV4dC5cbiAqXG4gKiBGb3IgZWFjaCBhbmQgZXZlcnkgYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gLCBgW2NsYXNzLm5hbWVdYCBiaW5kaW5nXG4gKiAoYXMgd2VsbCBhcyBzdGF0aWMgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXMpIGEgZGlyZWN0aXZlLCBjb21wb25lbnQgb3IgdGVtcGxhdGVcbiAqIGlzIG1hcmtlZCBhcyB0aGUgb3duZXIuIFdoZW4gYW4gb3duZXIgaXMgZGV0ZXJtaW5lZCAodGhpcyBoYXBwZW5zIHdoZW4gdGhlIHRlbXBsYXRlXG4gKiBpcyBmaXJzdCBwYXNzZWQgb3ZlcikgdGhlIGRpcmVjdGl2ZSBvd25lciBpcyBhbGxvY2F0ZWQgaW50byB0aGUgc3R5bGluZyBjb250ZXh0LiBXaGVuXG4gKiB0aGlzIGhhcHBlbnMsIGVhY2ggb3duZXIgZ2V0cyBpdHMgb3duIGluZGV4IHZhbHVlLiBUaGlzIHRoZW4gZW5zdXJlcyB0aGF0IG9uY2UgYW55XG4gKiBzdHlsZSBhbmQvb3IgY2xhc3MgYmluZGluZyBhcmUgYXNzaWduZWQgaW50byB0aGUgY29udGV4dCB0aGVuIHRoZXkgYXJlIG1hcmtlZCB0b1xuICogdGhhdCBkaXJlY3RpdmUncyBpbmRleCB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gY29udGV4dCB0aGUgdGFyZ2V0IFN0eWxpbmdDb250ZXh0XG4gKiBAcGFyYW0gZGlyZWN0aXZlUmVmIHRoZSBkaXJlY3RpdmUgdGhhdCB3aWxsIGJlIGFsbG9jYXRlZCBpbnRvIHRoZSBjb250ZXh0XG4gKiBAcmV0dXJucyB0aGUgaW5kZXggd2hlcmUgdGhlIGRpcmVjdGl2ZSB3YXMgaW5zZXJ0ZWQgaW50b1xuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NhdGVEaXJlY3RpdmVJbnRvQ29udGV4dChcbiAgICBjb250ZXh0OiBTdHlsaW5nQ29udGV4dCwgZGlyZWN0aXZlUmVmOiBhbnkgfCBudWxsKTogbnVtYmVyIHtcbiAgLy8gdGhpcyBpcyBhIG5ldyBkaXJlY3RpdmUgd2hpY2ggd2UgaGF2ZSBub3Qgc2VlbiB5ZXQuXG4gIGNvbnN0IGRpcnMgPSBjb250ZXh0W1N0eWxpbmdJbmRleC5EaXJlY3RpdmVSZWdpc3RyeVBvc2l0aW9uXTtcbiAgY29uc3QgaSA9IGRpcnMubGVuZ3RoO1xuXG4gIC8vIHdlIHByZWVtcHRpdmVseSBtYWtlIHNwYWNlIGludG8gdGhlIGRpcmVjdGl2ZXMgYXJyYXkgYW5kIHRoZW5cbiAgLy8gYXNzaWduIHZhbHVlcyBzbG90LWJ5LXNsb3QgdG8gZW5zdXJlIHRoYXQgaWYgdGhlIGRpcmVjdGl2ZSBvcmRlcmluZ1xuICAvLyBjaGFuZ2VzIHRoZW4gaXQgd2lsbCBzdGlsbCBmdW5jdGlvblxuICBkaXJzLnB1c2gobnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIGRpcnNbaSArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguRGlyZWN0aXZlVmFsdWVPZmZzZXRdID0gZGlyZWN0aXZlUmVmO1xuICBkaXJzW2kgKyBEaXJlY3RpdmVSZWdpc3RyeVZhbHVlc0luZGV4LkRpcnR5RmxhZ09mZnNldF0gPSBmYWxzZTtcbiAgZGlyc1tpICsgRGlyZWN0aXZlUmVnaXN0cnlWYWx1ZXNJbmRleC5TdHlsZVNhbml0aXplck9mZnNldF0gPSBudWxsO1xuXG4gIC8vIC0xIGlzIHVzZWQgdG8gc2lnbmFsIHRoYXQgdGhlIGRpcmVjdGl2ZSBoYXMgYmVlbiBhbGxvY2F0ZWQsIGJ1dFxuICAvLyBubyBhY3R1YWwgc3R5bGUgb3IgY2xhc3MgYmluZGluZ3MgaGF2ZSBiZWVuIHJlZ2lzdGVyZWQgeWV0Li4uXG4gIGRpcnNbaSArIERpcmVjdGl2ZVJlZ2lzdHJ5VmFsdWVzSW5kZXguU2luZ2xlUHJvcFZhbHVlc0luZGV4T2Zmc2V0XSA9IC0xO1xuXG4gIHJldHVybiBpO1xufVxuXG4vKipcbiAqIFVzZWQgY2xvbmUgYSBjb3B5IG9mIGEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIG9mIGEgc3R5bGluZyBjb250ZXh0LlxuICpcbiAqIEEgcHJlLWNvbXB1dGVkIHRlbXBsYXRlIGlzIGRlc2lnbmVkIHRvIGJlIGNvbXB1dGVkIG9uY2UgZm9yIGEgZ2l2ZW4gZWxlbWVudFxuICogKGluc3RydWN0aW9ucy50cyBoYXMgbG9naWMgZm9yIGNhY2hpbmcgdGhpcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY1N0eWxpbmdDb250ZXh0KFxuICAgIGVsZW1lbnQ6IFJFbGVtZW50IHwgbnVsbCwgdGVtcGxhdGVTdHlsZUNvbnRleHQ6IFN0eWxpbmdDb250ZXh0KTogU3R5bGluZ0NvbnRleHQge1xuICAvLyBlYWNoIGluc3RhbmNlIGdldHMgYSBjb3B5XG4gIGNvbnN0IGNvbnRleHQgPSB0ZW1wbGF0ZVN0eWxlQ29udGV4dC5zbGljZSgpIGFzIGFueSBhcyBTdHlsaW5nQ29udGV4dDtcblxuICAvLyB0aGUgSEVBREVSIHZhbHVlcyBjb250YWluIGFycmF5cyB3aGljaCBhbHNvIG5lZWRcbiAgLy8gdG8gYmUgY29waWVkIG92ZXIgaW50byB0aGUgbmV3IGNvbnRleHRcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBTdHlsaW5nSW5kZXguU2luZ2xlU3R5bGVzU3RhcnRQb3NpdGlvbjsgaSsrKSB7XG4gICAgY29uc3QgdmFsdWUgPSB0ZW1wbGF0ZVN0eWxlQ29udGV4dFtpXTtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgIGNvbnRleHRbaV0gPSB2YWx1ZS5zbGljZSgpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnRleHRbU3R5bGluZ0luZGV4LkVsZW1lbnRQb3NpdGlvbl0gPSBlbGVtZW50O1xuXG4gIC8vIHRoaXMgd2lsbCBwcmV2ZW50IGFueSBvdGhlciBkaXJlY3RpdmVzIGZyb20gZXh0ZW5kaW5nIHRoZSBjb250ZXh0XG4gIGNvbnRleHRbU3R5bGluZ0luZGV4Lk1hc3RlckZsYWdQb3NpdGlvbl0gfD0gU3R5bGluZ0ZsYWdzLkJpbmRpbmdBbGxvY2F0aW9uTG9ja2VkO1xuICByZXR1cm4gY29udGV4dDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICogQHBhcmFtIHZpZXdEYXRhIFRoZSB2aWV3IHRvIHNlYXJjaCBmb3IgdGhlIHN0eWxpbmcgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlciwgdmlld0RhdGE6IExWaWV3KTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3RvcmFnZUluZGV4ID0gaW5kZXg7XG4gIGxldCBzbG90VmFsdWU6IExDb250YWluZXJ8TFZpZXd8U3R5bGluZ0NvbnRleHR8UkVsZW1lbnQgPSB2aWV3RGF0YVtzdG9yYWdlSW5kZXhdO1xuICBsZXQgd3JhcHBlcjogTENvbnRhaW5lcnxMVmlld3xTdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhO1xuXG4gIHdoaWxlIChBcnJheS5pc0FycmF5KHNsb3RWYWx1ZSkpIHtcbiAgICB3cmFwcGVyID0gc2xvdFZhbHVlO1xuICAgIHNsb3RWYWx1ZSA9IHNsb3RWYWx1ZVtIT1NUXSBhcyBMVmlldyB8IFN0eWxpbmdDb250ZXh0IHwgUkVsZW1lbnQ7XG4gIH1cblxuICBpZiAoaXNTdHlsaW5nQ29udGV4dCh3cmFwcGVyKSkge1xuICAgIHJldHVybiB3cmFwcGVyO1xuICB9IGVsc2Uge1xuICAgIC8vIFRoaXMgaXMgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lclxuICAgIGNvbnN0IHN0eWxpbmdUZW1wbGF0ZSA9IGdldFROb2RlKGluZGV4IC0gSEVBREVSX09GRlNFVCwgdmlld0RhdGEpLnN0eWxpbmdUZW1wbGF0ZTtcblxuICAgIGlmICh3cmFwcGVyICE9PSB2aWV3RGF0YSkge1xuICAgICAgc3RvcmFnZUluZGV4ID0gSE9TVDtcbiAgICB9XG5cbiAgICByZXR1cm4gd3JhcHBlcltzdG9yYWdlSW5kZXhdID0gc3R5bGluZ1RlbXBsYXRlID9cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChzbG90VmFsdWUsIHN0eWxpbmdUZW1wbGF0ZSkgOlxuICAgICAgICBjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0KHNsb3RWYWx1ZSk7XG4gIH1cbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gaXNBbmltYXRpb25Qcm9wKG5hbWU6IHN0cmluZyk6IGJvb2xlYW4ge1xuICByZXR1cm4gbmFtZVswXSA9PT0gQU5JTUFUSU9OX1BST1BfUFJFRklYO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaGFzQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBoYXNTdHlsZUlucHV0KHROb2RlOiBUTm9kZSkge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlQ2xhc3Nlc0FzU3RyaW5nKGNsYXNzZXM6IHN0cmluZyB8IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgbnVsbCB8IHVuZGVmaW5lZCk6XG4gICAgc3RyaW5nIHtcbiAgaWYgKGNsYXNzZXMgJiYgdHlwZW9mIGNsYXNzZXMgIT09ICdzdHJpbmcnKSB7XG4gICAgY2xhc3NlcyA9IE9iamVjdC5rZXlzKGNsYXNzZXMpLmpvaW4oJyAnKTtcbiAgfVxuICByZXR1cm4gKGNsYXNzZXMgYXMgc3RyaW5nKSB8fCAnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZvcmNlU3R5bGVzQXNTdHJpbmcoc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IG51bGwgfCB1bmRlZmluZWQpOiBzdHJpbmcge1xuICBsZXQgc3RyID0gJyc7XG4gIGlmIChzdHlsZXMpIHtcbiAgICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgcHJvcCA9IHByb3BzW2ldO1xuICAgICAgc3RyICs9IChpID8gJzsnIDogJycpICsgYCR7cHJvcH06JHtzdHlsZXNbcHJvcF19YDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHN0cjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFkZFBsYXllckludGVybmFsKFxuICAgIHBsYXllckNvbnRleHQ6IFBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0OiBSb290Q29udGV4dCwgZWxlbWVudDogSFRNTEVsZW1lbnQsXG4gICAgcGxheWVyOiBQbGF5ZXIgfCBudWxsLCBwbGF5ZXJDb250ZXh0SW5kZXg6IG51bWJlciwgcmVmPzogYW55KTogYm9vbGVhbiB7XG4gIHJlZiA9IHJlZiB8fCBlbGVtZW50O1xuICBpZiAocGxheWVyQ29udGV4dEluZGV4KSB7XG4gICAgcGxheWVyQ29udGV4dFtwbGF5ZXJDb250ZXh0SW5kZXhdID0gcGxheWVyO1xuICB9IGVsc2Uge1xuICAgIHBsYXllckNvbnRleHQucHVzaChwbGF5ZXIpO1xuICB9XG5cbiAgaWYgKHBsYXllcikge1xuICAgIHBsYXllci5hZGRFdmVudExpc3RlbmVyKFBsYXlTdGF0ZS5EZXN0cm95ZWQsICgpID0+IHtcbiAgICAgIGNvbnN0IGluZGV4ID0gcGxheWVyQ29udGV4dC5pbmRleE9mKHBsYXllcik7XG4gICAgICBjb25zdCBub25GYWN0b3J5UGxheWVySW5kZXggPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuXG4gICAgICAvLyBpZiB0aGUgcGxheWVyIGlzIGJlaW5nIHJlbW92ZWQgZnJvbSB0aGUgZmFjdG9yeSBzaWRlIG9mIHRoZSBjb250ZXh0XG4gICAgICAvLyAod2hpY2ggaXMgd2hlcmUgdGhlIFtzdHlsZV0gYW5kIFtjbGFzc10gYmluZGluZ3MgZG8gdGhlaXIgdGhpbmcpIHRoZW5cbiAgICAgIC8vIHRoYXQgc2lkZSBvZiB0aGUgYXJyYXkgY2Fubm90IGJlIHJlc2l6ZWQgc2luY2UgdGhlIHJlc3BlY3RpdmUgYmluZGluZ3NcbiAgICAgIC8vIGhhdmUgcG9pbnRlciBpbmRleCB2YWx1ZXMgdGhhdCBwb2ludCB0byB0aGUgYXNzb2NpYXRlZCBmYWN0b3J5IGluc3RhbmNlXG4gICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgaWYgKGluZGV4IDwgbm9uRmFjdG9yeVBsYXllckluZGV4KSB7XG4gICAgICAgICAgcGxheWVyQ29udGV4dFtpbmRleF0gPSBudWxsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHBsYXllckNvbnRleHQuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcGxheWVyLmRlc3Ryb3koKTtcbiAgICB9KTtcblxuICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPVxuICAgICAgICByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyIHx8IChyb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyID0gbmV3IENvcmVQbGF5ZXJIYW5kbGVyKCkpO1xuICAgIHBsYXllckhhbmRsZXIucXVldWVQbGF5ZXIocGxheWVyLCByZWYpO1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxheWVyc0ludGVybmFsKHBsYXllckNvbnRleHQ6IFBsYXllckNvbnRleHQpOiBQbGF5ZXJbXSB7XG4gIGNvbnN0IHBsYXllcnM6IFBsYXllcltdID0gW107XG4gIGNvbnN0IG5vbkZhY3RvcnlQbGF5ZXJzU3RhcnQgPSBwbGF5ZXJDb250ZXh0W1BsYXllckluZGV4Lk5vbkJ1aWxkZXJQbGF5ZXJzU3RhcnRdO1xuXG4gIC8vIGFkZCBhbGwgZmFjdG9yeS1iYXNlZCBwbGF5ZXJzICh3aGljaCBhcmUgYXBhcnQgb2YgW3N0eWxlXSBhbmQgW2NsYXNzXSBiaW5kaW5ncylcbiAgZm9yIChsZXQgaSA9IFBsYXllckluZGV4LlBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbiArIFBsYXllckluZGV4LlBsYXllck9mZnNldFBvc2l0aW9uO1xuICAgICAgIGkgPCBub25GYWN0b3J5UGxheWVyc1N0YXJ0OyBpICs9IFBsYXllckluZGV4LlBsYXllckFuZFBsYXllckJ1aWxkZXJzVHVwbGVTaXplKSB7XG4gICAgY29uc3QgcGxheWVyID0gcGxheWVyQ29udGV4dFtpXSBhcyBQbGF5ZXIgfCBudWxsO1xuICAgIGlmIChwbGF5ZXIpIHtcbiAgICAgIHBsYXllcnMucHVzaChwbGF5ZXIpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFkZCBhbGwgY3VzdG9tIHBsYXllcnMgKG5vdCBhcGFydCBvZiBbc3R5bGVdIGFuZCBbY2xhc3NdIGJpbmRpbmdzKVxuICBmb3IgKGxldCBpID0gbm9uRmFjdG9yeVBsYXllcnNTdGFydDsgaSA8IHBsYXllckNvbnRleHQubGVuZ3RoOyBpKyspIHtcbiAgICBwbGF5ZXJzLnB1c2gocGxheWVyQ29udGV4dFtpXSBhcyBQbGF5ZXIpO1xuICB9XG5cbiAgcmV0dXJuIHBsYXllcnM7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlUGxheWVyQ29udGV4dCh0YXJnZXQ6IHt9LCBjb250ZXh0PzogTENvbnRleHQgfCBudWxsKTogUGxheWVyQ29udGV4dHxcbiAgICBudWxsIHtcbiAgY29udGV4dCA9IGNvbnRleHQgfHwgZ2V0TENvbnRleHQodGFyZ2V0KSAhO1xuICBpZiAoIWNvbnRleHQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdGhyb3dJbnZhbGlkUmVmRXJyb3IoKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHtsVmlldywgbm9kZUluZGV4fSA9IGNvbnRleHQ7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQobm9kZUluZGV4LCBsVmlldyk7XG4gIHJldHVybiBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KSB8fCBhbGxvY1BsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxheWVyQ29udGV4dChzdHlsaW5nQ29udGV4dDogU3R5bGluZ0NvbnRleHQpOiBQbGF5ZXJDb250ZXh0fG51bGwge1xuICByZXR1cm4gc3R5bGluZ0NvbnRleHRbU3R5bGluZ0luZGV4LlBsYXllckNvbnRleHRdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NQbGF5ZXJDb250ZXh0KGRhdGE6IFN0eWxpbmdDb250ZXh0KTogUGxheWVyQ29udGV4dCB7XG4gIHJldHVybiBkYXRhW1N0eWxpbmdJbmRleC5QbGF5ZXJDb250ZXh0XSA9XG4gICAgICAgICAgICAgW1BsYXllckluZGV4LlNpbmdsZVBsYXllckJ1aWxkZXJzU3RhcnRQb3NpdGlvbiwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aHJvd0ludmFsaWRSZWZFcnJvcigpIHtcbiAgdGhyb3cgbmV3IEVycm9yKCdPbmx5IGVsZW1lbnRzIHRoYXQgZXhpc3QgaW4gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBjYW4gYmUgdXNlZCBmb3IgYW5pbWF0aW9ucycpO1xufVxuIl19