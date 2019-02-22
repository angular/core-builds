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
import '../util/ng_dev_mode';
import { getLContext } from './context_discovery';
import { getRootContext } from './discovery_utils';
import { scheduleTick } from './instructions';
import { addPlayerInternal, getOrCreatePlayerContext, getPlayerContext, getPlayersInternal, getStylingContext, throwInvalidRefError } from './styling/util';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGxheWVycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvcGxheWVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQU9BLE9BQU8scUJBQXFCLENBQUM7QUFFN0IsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hELE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHNUMsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLG9CQUFvQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWUxSixNQUFNLFVBQVUsU0FBUyxDQUNyQixHQUF3RCxFQUFFLE1BQWM7O1VBQ3BFLE9BQU8sR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixTQUFTLElBQUksb0JBQW9CLEVBQUUsQ0FBQztRQUNwQyxPQUFPO0tBQ1I7O1VBRUssT0FBTyxHQUFHLG1CQUFBLE9BQU8sQ0FBQyxNQUFNLEVBQWU7O1VBQ3ZDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSzs7VUFDckIsYUFBYSxHQUFHLG1CQUFBLHdCQUF3QixDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsRUFBRTs7VUFDNUQsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7SUFDekMsaUJBQWlCLENBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztJQUN2RSxZQUFZLENBQUMsV0FBVyx1QkFBZ0MsQ0FBQztBQUMzRCxDQUFDOzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxHQUF3RDs7VUFDM0UsT0FBTyxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUM7SUFDaEMsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLFNBQVMsSUFBSSxvQkFBb0IsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sRUFBRSxDQUFDO0tBQ1g7O1VBRUssY0FBYyxHQUFHLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQzs7VUFDcEUsYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7SUFDOUUsT0FBTyxhQUFhLENBQUMsQ0FBQyxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDaEUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCAnLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7Z2V0TENvbnRleHR9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRSb290Q29udGV4dH0gZnJvbSAnLi9kaXNjb3ZlcnlfdXRpbHMnO1xuaW1wb3J0IHtzY2hlZHVsZVRpY2t9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50SW5zdGFuY2UsIERpcmVjdGl2ZUluc3RhbmNlLCBQbGF5ZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBSb290Q29udGV4dEZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2FkZFBsYXllckludGVybmFsLCBnZXRPckNyZWF0ZVBsYXllckNvbnRleHQsIGdldFBsYXllckNvbnRleHQsIGdldFBsYXllcnNJbnRlcm5hbCwgZ2V0U3R5bGluZ0NvbnRleHQsIHRocm93SW52YWxpZFJlZkVycm9yfSBmcm9tICcuL3N0eWxpbmcvdXRpbCc7XG5cbi8qKlxuICogQWRkcyBhIHBsYXllciB0byBhbiBlbGVtZW50LCBkaXJlY3RpdmUgb3IgY29tcG9uZW50IGluc3RhbmNlIHRoYXQgd2lsbCBsYXRlciBiZVxuICogYW5pbWF0ZWQgb25jZSBjaGFuZ2UgZGV0ZWN0aW9uIGhhcyBwYXNzZWQuXG4gKlxuICogV2hlbiBhIHBsYXllciBpcyBhZGRlZCB0byBhIHJlZmVyZW5jZSBpdCB3aWxsIHN0YXkgYWN0aXZlIHVudGlsIGBwbGF5ZXIuZGVzdHJveSgpYFxuICogaXMgY2FsbGVkLiBPbmNlIGNhbGxlZCB0aGVuIHRoZSBwbGF5ZXIgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGFjdGl2ZSBwbGF5ZXJzXG4gKiBwcmVzZW50IG9uIHRoZSBhc3NvY2lhdGVkIHJlZiBpbnN0YW5jZS5cbiAqXG4gKiBUbyBnZXQgYSBsaXN0IG9mIGFsbCB0aGUgYWN0aXZlIHBsYXllcnMgb24gYW4gZWxlbWVudCBzZWUgW2dldFBsYXllcnNdLlxuICpcbiAqIEBwYXJhbSByZWYgVGhlIGVsZW1lbnQsIGRpcmVjdGl2ZSBvciBjb21wb25lbnQgdGhhdCB0aGUgcGxheWVyIHdpbGwgYmUgcGxhY2VkIG9uLlxuICogQHBhcmFtIHBsYXllciBUaGUgcGxheWVyIHRoYXQgd2lsbCBiZSB0cmlnZ2VyZWQgdG8gcGxheSBvbmNlIGNoYW5nZSBkZXRlY3Rpb24gaGFzIHJ1bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFBsYXllcihcbiAgICByZWY6IENvbXBvbmVudEluc3RhbmNlIHwgRGlyZWN0aXZlSW5zdGFuY2UgfCBIVE1MRWxlbWVudCwgcGxheWVyOiBQbGF5ZXIpOiB2b2lkIHtcbiAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHJlZik7XG4gIGlmICghY29udGV4dCkge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0ludmFsaWRSZWZFcnJvcigpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGNvbnN0IGVsZW1lbnQgPSBjb250ZXh0Lm5hdGl2ZSBhcyBIVE1MRWxlbWVudDtcbiAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gZ2V0T3JDcmVhdGVQbGF5ZXJDb250ZXh0KGVsZW1lbnQsIGNvbnRleHQpICE7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICBhZGRQbGF5ZXJJbnRlcm5hbChwbGF5ZXJDb250ZXh0LCByb290Q29udGV4dCwgZWxlbWVudCwgcGxheWVyLCAwLCByZWYpO1xuICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgbGlzdCBvZiBhbGwgdGhlIGFjdGl2ZSBwbGF5ZXJzIHByZXNlbnQgb24gdGhlIHByb3ZpZGVkIHJlZiBpbnN0YW5jZSAod2hpY2ggY2FuXG4gKiBiZSBhbiBpbnN0YW5jZSBvZiBhIGRpcmVjdGl2ZSwgY29tcG9uZW50IG9yIGVsZW1lbnQpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gd2lsbCBvbmx5IHJldHVybiBwbGF5ZXJzIHRoYXQgaGF2ZSBiZWVuIGFkZGVkIHRvIHRoZSByZWYgaW5zdGFuY2UgdXNpbmdcbiAqIGBhZGRQbGF5ZXJgIG9yIGFueSBwbGF5ZXJzIHRoYXQgYXJlIGFjdGl2ZSB0aHJvdWdoIGFueSB0ZW1wbGF0ZSBzdHlsaW5nIGJpbmRpbmdzXG4gKiAoYFtzdHlsZV1gLCBgW3N0eWxlLnByb3BdYCwgYFtjbGFzc11gIGFuZCBgW2NsYXNzLm5hbWVdYCkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGxheWVycyhyZWY6IENvbXBvbmVudEluc3RhbmNlIHwgRGlyZWN0aXZlSW5zdGFuY2UgfCBIVE1MRWxlbWVudCk6IFBsYXllcltdIHtcbiAgY29uc3QgY29udGV4dCA9IGdldExDb250ZXh0KHJlZik7XG4gIGlmICghY29udGV4dCkge1xuICAgIG5nRGV2TW9kZSAmJiB0aHJvd0ludmFsaWRSZWZFcnJvcigpO1xuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoY29udGV4dC5ub2RlSW5kZXgsIGNvbnRleHQubFZpZXcpO1xuICBjb25zdCBwbGF5ZXJDb250ZXh0ID0gc3R5bGluZ0NvbnRleHQgPyBnZXRQbGF5ZXJDb250ZXh0KHN0eWxpbmdDb250ZXh0KSA6IG51bGw7XG4gIHJldHVybiBwbGF5ZXJDb250ZXh0ID8gZ2V0UGxheWVyc0ludGVybmFsKHBsYXllckNvbnRleHQpIDogW107XG59XG4iXX0=