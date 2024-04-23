/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { EventType } from './/event_type';
/**
 * Create a custom event with the specified data.
 * @param type The type of the action, e.g., 'submit'.
 * @param data An optional data payload.
 * @param triggeringEvent The event that triggers this custom event. This can be
 *     accessed from the custom event's action flow like so:
 *     actionFlow.event().detail.triggeringEvent.
 * @return The new custom event.
 */
export function createCustomEvent(type, data, triggeringEvent) {
    let event;
    const unrenamedDetail = {
        '_type': type,
    };
    const renamedDetail = {
        type,
        data,
        triggeringEvent,
    };
    const detail = { ...unrenamedDetail, ...renamedDetail };
    try {
        // We don't use the CustomEvent constructor directly since it isn't
        // supported in IE 9 or 10 and initCustomEvent below works just fine.
        event = document.createEvent('CustomEvent');
        event.initCustomEvent(EventType.CUSTOM, true, false, detail);
    }
    catch (e) {
        // If custom events aren't supported, fall back to custom-named HTMLEvent.
        // Fallback used by Android Gingerbread, FF4-5.
        // Hack to emulate `CustomEvent`, `HTMLEvents` doesn't satisfy `CustomEvent`
        // type.
        // tslint:disable-next-line:no-any
        event = document.createEvent('HTMLEvents');
        event.initEvent(EventType.CUSTOM, true, false);
        // Hack to emulate `CustomEvent`, `detail` is readonly on `CustomEvent`.
        // tslint:disable-next-line:no-any
        event['detail'] = detail;
    }
    return event;
}
/**
 * Fires a custom event with an optional payload. Only intended to be consumed
 * by jsaction itself. Supported in Firefox 6+, IE 9+, and all Chrome versions.
 *
 * @param target The target element.
 * @param type The type of the action, e.g., 'submit'.
 * @param data An optional data payload.
 * @param triggeringEvent An optional data for the Event triggered this custom
 *     event.
 */
export function fireCustomEvent(target, type, data, triggeringEvent) {
    const event = createCustomEvent(type, data, triggeringEvent);
    target.dispatchEvent(event);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tX2V2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvY3VzdG9tX2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBZXhDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFJLElBQVksRUFBRSxJQUFRLEVBQUUsZUFBdUI7SUFDbEYsSUFBSSxLQUFxRSxDQUFDO0lBQzFFLE1BQU0sZUFBZSxHQUErQjtRQUNsRCxPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUM7SUFDRixNQUFNLGFBQWEsR0FBeUI7UUFDMUMsSUFBSTtRQUNKLElBQUk7UUFDSixlQUFlO0tBQ2hCLENBQUM7SUFDRixNQUFNLE1BQU0sR0FBRyxFQUFDLEdBQUcsZUFBZSxFQUFFLEdBQUcsYUFBYSxFQUFDLENBQUM7SUFDdEQsSUFBSSxDQUFDO1FBQ0gsbUVBQW1FO1FBQ25FLHFFQUFxRTtRQUNyRSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLDBFQUEwRTtRQUMxRSwrQ0FBK0M7UUFFL0MsNEVBQTRFO1FBQzVFLFFBQVE7UUFDUixrQ0FBa0M7UUFDbEMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFRLENBQUM7UUFDbEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyx3RUFBd0U7UUFDeEUsa0NBQWtDO1FBQ2pDLEtBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDcEMsQ0FBQztJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzdCLE1BQWUsRUFDZixJQUFZLEVBQ1osSUFBUSxFQUNSLGVBQXVCO0lBRXZCLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDN0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RXZlbnRUeXBlfSBmcm9tICcuLy9ldmVudF90eXBlJztcblxuLy8gV2UgdXNlICdfdHlwZScgZm9yIHRoZSBldmVudCBjb250cmFjdCwgd2hpY2ggbGl2ZXMgaW4gYSBzZXBhcmF0ZVxuLy8gY29tcGlsYXRpb24gdW5pdC5cbmRlY2xhcmUgaW50ZXJmYWNlIFVucmVuYW1lZEN1c3RvbUV2ZW50RGV0YWlsIHtcbiAgX3R5cGU6IHN0cmluZztcbn1cblxuLyoqIFRoZSBkZXRhaWwgaW50ZXJmYWNlIHByb3ZpZGVkIGZvciBjdXN0b20gZXZlbnRzLiAqL1xuZXhwb3J0IGludGVyZmFjZSBDdXN0b21FdmVudERldGFpbDxUPiB7XG4gIHR5cGU6IHN0cmluZztcbiAgZGF0YT86IFQ7XG4gIHRyaWdnZXJpbmdFdmVudD86IEV2ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhIGN1c3RvbSBldmVudCB3aXRoIHRoZSBzcGVjaWZpZWQgZGF0YS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBhY3Rpb24sIGUuZy4sICdzdWJtaXQnLlxuICogQHBhcmFtIGRhdGEgQW4gb3B0aW9uYWwgZGF0YSBwYXlsb2FkLlxuICogQHBhcmFtIHRyaWdnZXJpbmdFdmVudCBUaGUgZXZlbnQgdGhhdCB0cmlnZ2VycyB0aGlzIGN1c3RvbSBldmVudC4gVGhpcyBjYW4gYmVcbiAqICAgICBhY2Nlc3NlZCBmcm9tIHRoZSBjdXN0b20gZXZlbnQncyBhY3Rpb24gZmxvdyBsaWtlIHNvOlxuICogICAgIGFjdGlvbkZsb3cuZXZlbnQoKS5kZXRhaWwudHJpZ2dlcmluZ0V2ZW50LlxuICogQHJldHVybiBUaGUgbmV3IGN1c3RvbSBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUN1c3RvbUV2ZW50PFQ+KHR5cGU6IHN0cmluZywgZGF0YT86IFQsIHRyaWdnZXJpbmdFdmVudD86IEV2ZW50KTogRXZlbnQge1xuICBsZXQgZXZlbnQ6IEN1c3RvbUV2ZW50PEN1c3RvbUV2ZW50RGV0YWlsPFQ+ICYgVW5yZW5hbWVkQ3VzdG9tRXZlbnREZXRhaWw+O1xuICBjb25zdCB1bnJlbmFtZWREZXRhaWw6IFVucmVuYW1lZEN1c3RvbUV2ZW50RGV0YWlsID0ge1xuICAgICdfdHlwZSc6IHR5cGUsXG4gIH07XG4gIGNvbnN0IHJlbmFtZWREZXRhaWw6IEN1c3RvbUV2ZW50RGV0YWlsPFQ+ID0ge1xuICAgIHR5cGUsXG4gICAgZGF0YSxcbiAgICB0cmlnZ2VyaW5nRXZlbnQsXG4gIH07XG4gIGNvbnN0IGRldGFpbCA9IHsuLi51bnJlbmFtZWREZXRhaWwsIC4uLnJlbmFtZWREZXRhaWx9O1xuICB0cnkge1xuICAgIC8vIFdlIGRvbid0IHVzZSB0aGUgQ3VzdG9tRXZlbnQgY29uc3RydWN0b3IgZGlyZWN0bHkgc2luY2UgaXQgaXNuJ3RcbiAgICAvLyBzdXBwb3J0ZWQgaW4gSUUgOSBvciAxMCBhbmQgaW5pdEN1c3RvbUV2ZW50IGJlbG93IHdvcmtzIGp1c3QgZmluZS5cbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdDdXN0b21FdmVudCcpO1xuICAgIGV2ZW50LmluaXRDdXN0b21FdmVudChFdmVudFR5cGUuQ1VTVE9NLCB0cnVlLCBmYWxzZSwgZGV0YWlsKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIC8vIElmIGN1c3RvbSBldmVudHMgYXJlbid0IHN1cHBvcnRlZCwgZmFsbCBiYWNrIHRvIGN1c3RvbS1uYW1lZCBIVE1MRXZlbnQuXG4gICAgLy8gRmFsbGJhY2sgdXNlZCBieSBBbmRyb2lkIEdpbmdlcmJyZWFkLCBGRjQtNS5cblxuICAgIC8vIEhhY2sgdG8gZW11bGF0ZSBgQ3VzdG9tRXZlbnRgLCBgSFRNTEV2ZW50c2AgZG9lc24ndCBzYXRpc2Z5IGBDdXN0b21FdmVudGBcbiAgICAvLyB0eXBlLlxuICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1hbnlcbiAgICBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJykgYXMgYW55O1xuICAgIGV2ZW50LmluaXRFdmVudChFdmVudFR5cGUuQ1VTVE9NLCB0cnVlLCBmYWxzZSk7XG4gICAgLy8gSGFjayB0byBlbXVsYXRlIGBDdXN0b21FdmVudGAsIGBkZXRhaWxgIGlzIHJlYWRvbmx5IG9uIGBDdXN0b21FdmVudGAuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIChldmVudCBhcyBhbnkpWydkZXRhaWwnXSA9IGRldGFpbDtcbiAgfVxuXG4gIHJldHVybiBldmVudDtcbn1cblxuLyoqXG4gKiBGaXJlcyBhIGN1c3RvbSBldmVudCB3aXRoIGFuIG9wdGlvbmFsIHBheWxvYWQuIE9ubHkgaW50ZW5kZWQgdG8gYmUgY29uc3VtZWRcbiAqIGJ5IGpzYWN0aW9uIGl0c2VsZi4gU3VwcG9ydGVkIGluIEZpcmVmb3ggNissIElFIDkrLCBhbmQgYWxsIENocm9tZSB2ZXJzaW9ucy5cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IFRoZSB0YXJnZXQgZWxlbWVudC5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBhY3Rpb24sIGUuZy4sICdzdWJtaXQnLlxuICogQHBhcmFtIGRhdGEgQW4gb3B0aW9uYWwgZGF0YSBwYXlsb2FkLlxuICogQHBhcmFtIHRyaWdnZXJpbmdFdmVudCBBbiBvcHRpb25hbCBkYXRhIGZvciB0aGUgRXZlbnQgdHJpZ2dlcmVkIHRoaXMgY3VzdG9tXG4gKiAgICAgZXZlbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaXJlQ3VzdG9tRXZlbnQ8VD4oXG4gIHRhcmdldDogRWxlbWVudCxcbiAgdHlwZTogc3RyaW5nLFxuICBkYXRhPzogVCxcbiAgdHJpZ2dlcmluZ0V2ZW50PzogRXZlbnQsXG4pIHtcbiAgY29uc3QgZXZlbnQgPSBjcmVhdGVDdXN0b21FdmVudCh0eXBlLCBkYXRhLCB0cmlnZ2VyaW5nRXZlbnQpO1xuICB0YXJnZXQuZGlzcGF0Y2hFdmVudChldmVudCk7XG59XG4iXX0=