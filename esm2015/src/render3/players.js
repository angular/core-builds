/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import '../util/ng_dev_mode';
import { getLContext } from './context_discovery';
import { scheduleTick } from './instructions/all';
import { addPlayerInternal, getOrCreatePlayerContext, getPlayerContext, getPlayersInternal, getStylingContext, throwInvalidRefError } from './styling/util';
import { getRootContext } from './util/view_traversal_utils';
/**
 * Adds a player to an element, directive or component instance that will later be
 * animated once change detection has passed.
 *
 * When a player is added to a reference it will stay active until `player.destroy()`
 * is called. Once called then the player will be removed from the active players
 * present on the associated ref instance.
 *
 * To get a list of all the active players on an element see [getPlayers].
 *
 * @param {?} ref The element, directive or component that the player will be placed on.
 * @param {?} player The player that will be triggered to play once change detection has run.
 * @return {?}
 */
export function addPlayer(ref, player) {
    /** @type {?} */
    const context = getLContext(ref);
    if (!context) {
        ngDevMode && throwInvalidRefError();
        return;
    }
    /** @type {?} */
    const element = (/** @type {?} */ (context.native));
    /** @type {?} */
    const lView = context.lView;
    /** @type {?} */
    const playerContext = (/** @type {?} */ (getOrCreatePlayerContext(element, context)));
    /** @type {?} */
    const rootContext = getRootContext(lView);
    addPlayerInternal(playerContext, rootContext, element, player, 0, ref);
    scheduleTick(rootContext, 2 /* FlushPlayers */);
}
/**
 * Returns a list of all the active players present on the provided ref instance (which can
 * be an instance of a directive, component or element).
 *
 * This function will only return players that have been added to the ref instance using
 * `addPlayer` or any players that are active through any template styling bindings
 * (`[style]`, `[style.prop]`, `[class]` and `[class.name]`).
 *
 * \@publicApi
 * @param {?} ref
 * @return {?}
 */
export function getPlayers(ref) {
    /** @type {?} */
    const context = getLContext(ref);
    if (!context) {
        ngDevMode && throwInvalidRefError();
        return [];
    }
    /** @type {?} */
    const stylingContext = getStylingContext(context.nodeIndex, context.lView);
    /** @type {?} */
    const playerContext = stylingContext ? getPlayerContext(stylingContext) : null;
    return playerContext ? getPlayersInternal(playerContext) : [];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcGxheWVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUdoRCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxSixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sNkJBQTZCLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWUzRCxNQUFNLFVBQVUsU0FBUyxDQUNyQixHQUF3RCxFQUFFLE1BQWM7O1VBQ3BFLE9BQU8sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixTQUFTLElBQUksb0JBQW9CLEVBQUUsQ0FBQztRQUNwQyxPQUFPO0tBQ1I7O1VBRUssT0FBTyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxNQUFNLEVBQWU7O1VBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSzs7VUFDckIsYUFBYSxHQUFHLG1CQUFBLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTs7VUFDNUQsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7SUFDekMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN2RSxZQUFZLENBQUMsV0FBVyx1QkFBZ0MsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxHQUF3RDs7VUFDM0UsT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUM7SUFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLFNBQVMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7O1VBRUssY0FBYyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQzs7VUFDcEUsYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7SUFDOUUsT0FBTyxhQUFhLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDaEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtzY2hlZHVsZVRpY2t9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zL2FsbCc7XG5pbXBvcnQge0NvbXBvbmVudEluc3RhbmNlLCBEaXJlY3RpdmVJbnN0YW5jZSwgUGxheWVyfSBmcm9tICcuL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7Um9vdENvbnRleHRGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthZGRQbGF5ZXJJbnRlcm5hbCwgZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0LCBnZXRQbGF5ZXJDb250ZXh0LCBnZXRQbGF5ZXJzSW50ZXJuYWwsIGdldFN0eWxpbmdDb250ZXh0LCB0aHJvd0ludmFsaWRSZWZFcnJvcn0gZnJvbSAnLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcblxuLyoqXG4gKiBBZGRzIGEgcGxheWVyIHRvIGFuIGVsZW1lbnQsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgaW5zdGFuY2UgdGhhdCB3aWxsIGxhdGVyIGJlXG4gKiBhbmltYXRlZCBvbmNlIGNoYW5nZSBkZXRlY3Rpb24gaGFzIHBhc3NlZC5cbiAqXG4gKiBXaGVuIGEgcGxheWVyIGlzIGFkZGVkIHRvIGEgcmVmZXJlbmNlIGl0IHdpbGwgc3RheSBhY3RpdmUgdW50aWwgYHBsYXllci5kZXN0cm95KClgXG4gKiBpcyBjYWxsZWQuIE9uY2UgY2FsbGVkIHRoZW4gdGhlIHBsYXllciB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgYWN0aXZlIHBsYXllcnNcbiAqIHByZXNlbnQgb24gdGhlIGFzc29jaWF0ZWQgcmVmIGluc3RhbmNlLlxuICpcbiAqIFRvIGdldCBhIGxpc3Qgb2YgYWxsIHRoZSBhY3RpdmUgcGxheWVycyBvbiBhbiBlbGVtZW50IHNlZSBbZ2V0UGxheWVyc10uXG4gKlxuICogQHBhcmFtIHJlZiBUaGUgZWxlbWVudCwgZGlyZWN0aXZlIG9yIGNvbXBvbmVudCB0aGF0IHRoZSBwbGF5ZXIgd2lsbCBiZSBwbGFjZWQgb24uXG4gKiBAcGFyYW0gcGxheWVyIFRoZSBwbGF5ZXIgdGhhdCB3aWxsIGJlIHRyaWdnZXJlZCB0byBwbGF5IG9uY2UgY2hhbmdlIGRldGVjdGlvbiBoYXMgcnVuLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkUGxheWVyKFxuICAgIHJlZjogQ29tcG9uZW50SW5zdGFuY2UgfCBEaXJlY3RpdmVJbnN0YW5jZSB8IEhUTUxFbGVtZW50LCBwbGF5ZXI6IFBsYXllcik6IHZvaWQge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQocmVmKTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgbmdEZXZNb2RlICYmIHRocm93SW52YWxpZFJlZkVycm9yKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgZWxlbWVudCA9IGNvbnRleHQubmF0aXZlIGFzIEhUTUxFbGVtZW50O1xuICBjb25zdCBsVmlldyA9IGNvbnRleHQubFZpZXc7XG4gIGNvbnN0IHBsYXllckNvbnRleHQgPSBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQoZWxlbWVudCwgY29udGV4dCkgITtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gIGFkZFBsYXllckludGVybmFsKHBsYXllckNvbnRleHQsIHJvb3RDb250ZXh0LCBlbGVtZW50LCBwbGF5ZXIsIDAsIHJlZik7XG4gIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xufVxuXG4vKipcbiAqIFJldHVybnMgYSBsaXN0IG9mIGFsbCB0aGUgYWN0aXZlIHBsYXllcnMgcHJlc2VudCBvbiB0aGUgcHJvdmlkZWQgcmVmIGluc3RhbmNlICh3aGljaCBjYW5cbiAqIGJlIGFuIGluc3RhbmNlIG9mIGEgZGlyZWN0aXZlLCBjb21wb25lbnQgb3IgZWxlbWVudCkuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB3aWxsIG9ubHkgcmV0dXJuIHBsYXllcnMgdGhhdCBoYXZlIGJlZW4gYWRkZWQgdG8gdGhlIHJlZiBpbnN0YW5jZSB1c2luZ1xuICogYGFkZFBsYXllcmAgb3IgYW55IHBsYXllcnMgdGhhdCBhcmUgYWN0aXZlIHRocm91Z2ggYW55IHRlbXBsYXRlIHN0eWxpbmcgYmluZGluZ3NcbiAqIChgW3N0eWxlXWAsIGBbc3R5bGUucHJvcF1gLCBgW2NsYXNzXWAgYW5kIGBbY2xhc3MubmFtZV1gKS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQbGF5ZXJzKHJlZjogQ29tcG9uZW50SW5zdGFuY2UgfCBEaXJlY3RpdmVJbnN0YW5jZSB8IEhUTUxFbGVtZW50KTogUGxheWVyW10ge1xuICBjb25zdCBjb250ZXh0ID0gZ2V0TENvbnRleHQocmVmKTtcbiAgaWYgKCFjb250ZXh0KSB7XG4gICAgbmdEZXZNb2RlICYmIHRocm93SW52YWxpZFJlZkVycm9yKCk7XG4gICAgcmV0dXJuIFtdO1xuICB9XG5cbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChjb250ZXh0Lm5vZGVJbmRleCwgY29udGV4dC5sVmlldyk7XG4gIGNvbnN0IHBsYXllckNvbnRleHQgPSBzdHlsaW5nQ29udGV4dCA/IGdldFBsYXllckNvbnRleHQoc3R5bGluZ0NvbnRleHQpIDogbnVsbDtcbiAgcmV0dXJuIHBsYXllckNvbnRleHQgPyBnZXRQbGF5ZXJzSW50ZXJuYWwocGxheWVyQ29udGV4dCkgOiBbXTtcbn1cbiJdfQ==