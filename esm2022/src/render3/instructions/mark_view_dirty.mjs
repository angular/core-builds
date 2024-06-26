/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isRootView } from '../interfaces/type_checks';
import { ENVIRONMENT, FLAGS } from '../interfaces/view';
import { isRefreshingViews } from '../state';
import { getLViewParent } from '../util/view_utils';
/**
 * Marks current view and all ancestors dirty.
 *
 * Returns the root view because it is found as a byproduct of marking the view tree
 * dirty, and can be used by methods that consume markViewDirty() to easily schedule
 * change detection. Otherwise, such methods would need to traverse up the view tree
 * an additional time to get the root view and schedule a tick on it.
 *
 * @param lView The starting LView to mark dirty
 * @returns the root LView
 */
export function markViewDirty(lView, source) {
    const dirtyBitsToUse = isRefreshingViews()
        ? // When we are actively refreshing views, we only use the `Dirty` bit to mark a view
            64 /* LViewFlags.Dirty */
        : // When we are not actively refreshing a view tree, it is absolutely
            // valid to update state and mark views dirty. We use the `RefreshView` flag in this
            // case to allow synchronously rerunning change detection. This applies today to
            // afterRender hooks as well as animation listeners which execute after detecting
            // changes in a view when the render factory flushes.
            1024 /* LViewFlags.RefreshView */ | 64 /* LViewFlags.Dirty */;
    lView[ENVIRONMENT].changeDetectionScheduler?.notify(source);
    while (lView) {
        lView[FLAGS] |= dirtyBitsToUse;
        const parent = getLViewParent(lView);
        // Stop traversing up as soon as you find a root view that wasn't attached to any container
        if (isRootView(lView) && !parent) {
            return lView;
        }
        // continue otherwise
        lView = parent;
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFya192aWV3X2RpcnR5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvbWFya192aWV3X2RpcnR5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUNyRCxPQUFPLEVBQUMsV0FBVyxFQUFFLEtBQUssRUFBb0IsTUFBTSxvQkFBb0IsQ0FBQztBQUN6RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDM0MsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWxEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVksRUFBRSxNQUEwQjtJQUNwRSxNQUFNLGNBQWMsR0FBRyxpQkFBaUIsRUFBRTtRQUN4QyxDQUFDLENBQUMsb0ZBQW9GOztRQU10RixDQUFDLENBQUMsb0VBQW9FO1lBQ3BFLG9GQUFvRjtZQUNwRixnRkFBZ0Y7WUFDaEYsaUZBQWlGO1lBQ2pGLHFEQUFxRDtZQUNyRCw2REFBeUMsQ0FBQztJQUM5QyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsd0JBQXdCLEVBQUUsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzVELE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDYixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksY0FBYyxDQUFDO1FBQy9CLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQywyRkFBMkY7UUFDM0YsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztZQUNqQyxPQUFPLEtBQUssQ0FBQztRQUNmLENBQUM7UUFDRCxxQkFBcUI7UUFDckIsS0FBSyxHQUFHLE1BQU8sQ0FBQztJQUNsQixDQUFDO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Tm90aWZpY2F0aW9uU291cmNlfSBmcm9tICcuLi8uLi9jaGFuZ2VfZGV0ZWN0aW9uL3NjaGVkdWxpbmcvem9uZWxlc3Nfc2NoZWR1bGluZyc7XG5pbXBvcnQge2lzUm9vdFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtFTlZJUk9OTUVOVCwgRkxBR1MsIExWaWV3LCBMVmlld0ZsYWdzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtpc1JlZnJlc2hpbmdWaWV3c30gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcsIHNvdXJjZTogTm90aWZpY2F0aW9uU291cmNlKTogTFZpZXcgfCBudWxsIHtcbiAgY29uc3QgZGlydHlCaXRzVG9Vc2UgPSBpc1JlZnJlc2hpbmdWaWV3cygpXG4gICAgPyAvLyBXaGVuIHdlIGFyZSBhY3RpdmVseSByZWZyZXNoaW5nIHZpZXdzLCB3ZSBvbmx5IHVzZSB0aGUgYERpcnR5YCBiaXQgdG8gbWFyayBhIHZpZXdcbiAgICAgIC8vIGZvciBjaGVjay4gVGhpcyBiaXQgaXMgaWdub3JlZCBpbiBDaGFuZ2VEZXRlY3Rpb25Nb2RlLlRhcmdldGVkLCB3aGljaCBpcyB1c2VkIHRvXG4gICAgICAvLyBzeW5jaHJvbm91c2x5IHJlcnVuIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBzcGVjaWZpYyBzZXQgb2Ygdmlld3MgKHRob3NlIHdoaWNoIGhhdmVcbiAgICAgIC8vIHRoZSBgUmVmcmVzaFZpZXdgIGZsYWcgYW5kIHRob3NlIHdpdGggZGlydHkgc2lnbmFsIGNvbnN1bWVycykuIGBMVmlld0ZsYWdzLkRpcnR5YFxuICAgICAgLy8gZG9lcyBub3Qgc3VwcG9ydCByZS1lbnRyYW50IGNoYW5nZSBkZXRlY3Rpb24gb24gaXRzIG93bi5cbiAgICAgIExWaWV3RmxhZ3MuRGlydHlcbiAgICA6IC8vIFdoZW4gd2UgYXJlIG5vdCBhY3RpdmVseSByZWZyZXNoaW5nIGEgdmlldyB0cmVlLCBpdCBpcyBhYnNvbHV0ZWx5XG4gICAgICAvLyB2YWxpZCB0byB1cGRhdGUgc3RhdGUgYW5kIG1hcmsgdmlld3MgZGlydHkuIFdlIHVzZSB0aGUgYFJlZnJlc2hWaWV3YCBmbGFnIGluIHRoaXNcbiAgICAgIC8vIGNhc2UgdG8gYWxsb3cgc3luY2hyb25vdXNseSByZXJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbi4gVGhpcyBhcHBsaWVzIHRvZGF5IHRvXG4gICAgICAvLyBhZnRlclJlbmRlciBob29rcyBhcyB3ZWxsIGFzIGFuaW1hdGlvbiBsaXN0ZW5lcnMgd2hpY2ggZXhlY3V0ZSBhZnRlciBkZXRlY3RpbmdcbiAgICAgIC8vIGNoYW5nZXMgaW4gYSB2aWV3IHdoZW4gdGhlIHJlbmRlciBmYWN0b3J5IGZsdXNoZXMuXG4gICAgICBMVmlld0ZsYWdzLlJlZnJlc2hWaWV3IHwgTFZpZXdGbGFncy5EaXJ0eTtcbiAgbFZpZXdbRU5WSVJPTk1FTlRdLmNoYW5nZURldGVjdGlvblNjaGVkdWxlcj8ubm90aWZ5KHNvdXJjZSk7XG4gIHdoaWxlIChsVmlldykge1xuICAgIGxWaWV3W0ZMQUdTXSB8PSBkaXJ0eUJpdHNUb1VzZTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ITtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==