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
 * `bootstrapCustomEventSupport` is required to add a listener that handles the
 * event.
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
/**
 * Bootstraps `CustomEvent` support on the container.
 *
 * This is required to handle events fired by `fireCustomEvent` in the `container`.
 *
 * @param container The JSAction container to add an event listener on.
 * @param trigger A function that can trigger JSAction Event dispatch. Generally this function
 *    should delegate to an `EventContract` handler for the event type provided defined by
 *    `event.detail['_type']`.
 * @returns A function that removes the event listener.
 */
export function bootstrapCustomEventSupport(container, trigger) {
    const customEventListener = (event) => {
        let customEvent = event;
        const detail = customEvent.detail;
        // For custom events, use a secondary dispatch based on the internal
        // custom type of the event.
        if (!detail || !detail['_type']) {
            // This should never happen.
            return;
        }
        // Mirrors code from Wiz's internal `trigger()` method.
        const syntheticCustomEvent = {
            'type': detail['_type'],
            'target': event.target,
            'bubbles': true,
            detail,
        };
        // tslint:disable-next-line:no-any
        trigger(syntheticCustomEvent);
    };
    container.addEventListener('_custom', customEventListener);
    return () => {
        container.removeEventListener('_custom', customEventListener);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3VzdG9tX2V2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcHJpbWl0aXZlcy9ldmVudC1kaXNwYXRjaC9zcmMvY3VzdG9tX2V2ZW50cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBZXhDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUFJLElBQVksRUFBRSxJQUFRLEVBQUUsZUFBdUI7SUFDbEYsSUFBSSxLQUFxRSxDQUFDO0lBQzFFLE1BQU0sZUFBZSxHQUErQjtRQUNsRCxPQUFPLEVBQUUsSUFBSTtLQUNkLENBQUM7SUFDRixNQUFNLGFBQWEsR0FBeUI7UUFDMUMsSUFBSTtRQUNKLElBQUk7UUFDSixlQUFlO0tBQ2hCLENBQUM7SUFDRixNQUFNLE1BQU0sR0FBRyxFQUFDLEdBQUcsZUFBZSxFQUFFLEdBQUcsYUFBYSxFQUFDLENBQUM7SUFDdEQsSUFBSSxDQUFDO1FBQ0gsbUVBQW1FO1FBQ25FLHFFQUFxRTtRQUNyRSxLQUFLLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUM1QyxLQUFLLENBQUMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztRQUNYLDBFQUEwRTtRQUMxRSwrQ0FBK0M7UUFFL0MsNEVBQTRFO1FBQzVFLFFBQVE7UUFDUixrQ0FBa0M7UUFDbEMsS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFRLENBQUM7UUFDbEQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyx3RUFBd0U7UUFDeEUsa0NBQWtDO1FBQ2pDLEtBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUM7SUFDcEMsQ0FBQztJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQzdCLE1BQWUsRUFDZixJQUFZLEVBQ1osSUFBUSxFQUNSLGVBQXVCO0lBRXZCLE1BQU0sS0FBSyxHQUFHLGlCQUFpQixDQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsZUFBZSxDQUFDLENBQUM7SUFDN0QsTUFBTSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5QixDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSwyQkFBMkIsQ0FBQyxTQUFrQixFQUFFLE9BQStCO0lBQzdGLE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxLQUFZLEVBQUUsRUFBRTtRQUMzQyxJQUFJLFdBQVcsR0FBRyxLQUFvQixDQUFDO1FBQ3ZDLE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUM7UUFDbEMsb0VBQW9FO1FBQ3BFLDRCQUE0QjtRQUM1QixJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUM7WUFDaEMsNEJBQTRCO1lBQzVCLE9BQU87UUFDVCxDQUFDO1FBQ0QsdURBQXVEO1FBQ3ZELE1BQU0sb0JBQW9CLEdBQUc7WUFDM0IsTUFBTSxFQUFFLE1BQU0sQ0FBQyxPQUFPLENBQUM7WUFDdkIsUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNO1lBQ3RCLFNBQVMsRUFBRSxJQUFJO1lBQ2YsTUFBTTtTQUNQLENBQUM7UUFDRixrQ0FBa0M7UUFDbEMsT0FBTyxDQUFDLG9CQUEyQixDQUFDLENBQUM7SUFDdkMsQ0FBQyxDQUFDO0lBQ0YsU0FBUyxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQzNELE9BQU8sR0FBRyxFQUFFO1FBQ1YsU0FBUyxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0lBQ2hFLENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtFdmVudFR5cGV9IGZyb20gJy4vL2V2ZW50X3R5cGUnO1xuXG4vLyBXZSB1c2UgJ190eXBlJyBmb3IgdGhlIGV2ZW50IGNvbnRyYWN0LCB3aGljaCBsaXZlcyBpbiBhIHNlcGFyYXRlXG4vLyBjb21waWxhdGlvbiB1bml0LlxuZGVjbGFyZSBpbnRlcmZhY2UgVW5yZW5hbWVkQ3VzdG9tRXZlbnREZXRhaWwge1xuICBfdHlwZTogc3RyaW5nO1xufVxuXG4vKiogVGhlIGRldGFpbCBpbnRlcmZhY2UgcHJvdmlkZWQgZm9yIGN1c3RvbSBldmVudHMuICovXG5leHBvcnQgaW50ZXJmYWNlIEN1c3RvbUV2ZW50RGV0YWlsPFQ+IHtcbiAgdHlwZTogc3RyaW5nO1xuICBkYXRhPzogVDtcbiAgdHJpZ2dlcmluZ0V2ZW50PzogRXZlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlIGEgY3VzdG9tIGV2ZW50IHdpdGggdGhlIHNwZWNpZmllZCBkYXRhLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIGFjdGlvbiwgZS5nLiwgJ3N1Ym1pdCcuXG4gKiBAcGFyYW0gZGF0YSBBbiBvcHRpb25hbCBkYXRhIHBheWxvYWQuXG4gKiBAcGFyYW0gdHJpZ2dlcmluZ0V2ZW50IFRoZSBldmVudCB0aGF0IHRyaWdnZXJzIHRoaXMgY3VzdG9tIGV2ZW50LiBUaGlzIGNhbiBiZVxuICogICAgIGFjY2Vzc2VkIGZyb20gdGhlIGN1c3RvbSBldmVudCdzIGFjdGlvbiBmbG93IGxpa2Ugc286XG4gKiAgICAgYWN0aW9uRmxvdy5ldmVudCgpLmRldGFpbC50cmlnZ2VyaW5nRXZlbnQuXG4gKiBAcmV0dXJuIFRoZSBuZXcgY3VzdG9tIGV2ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ3VzdG9tRXZlbnQ8VD4odHlwZTogc3RyaW5nLCBkYXRhPzogVCwgdHJpZ2dlcmluZ0V2ZW50PzogRXZlbnQpOiBFdmVudCB7XG4gIGxldCBldmVudDogQ3VzdG9tRXZlbnQ8Q3VzdG9tRXZlbnREZXRhaWw8VD4gJiBVbnJlbmFtZWRDdXN0b21FdmVudERldGFpbD47XG4gIGNvbnN0IHVucmVuYW1lZERldGFpbDogVW5yZW5hbWVkQ3VzdG9tRXZlbnREZXRhaWwgPSB7XG4gICAgJ190eXBlJzogdHlwZSxcbiAgfTtcbiAgY29uc3QgcmVuYW1lZERldGFpbDogQ3VzdG9tRXZlbnREZXRhaWw8VD4gPSB7XG4gICAgdHlwZSxcbiAgICBkYXRhLFxuICAgIHRyaWdnZXJpbmdFdmVudCxcbiAgfTtcbiAgY29uc3QgZGV0YWlsID0gey4uLnVucmVuYW1lZERldGFpbCwgLi4ucmVuYW1lZERldGFpbH07XG4gIHRyeSB7XG4gICAgLy8gV2UgZG9uJ3QgdXNlIHRoZSBDdXN0b21FdmVudCBjb25zdHJ1Y3RvciBkaXJlY3RseSBzaW5jZSBpdCBpc24ndFxuICAgIC8vIHN1cHBvcnRlZCBpbiBJRSA5IG9yIDEwIGFuZCBpbml0Q3VzdG9tRXZlbnQgYmVsb3cgd29ya3MganVzdCBmaW5lLlxuICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0N1c3RvbUV2ZW50Jyk7XG4gICAgZXZlbnQuaW5pdEN1c3RvbUV2ZW50KEV2ZW50VHlwZS5DVVNUT00sIHRydWUsIGZhbHNlLCBkZXRhaWwpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgLy8gSWYgY3VzdG9tIGV2ZW50cyBhcmVuJ3Qgc3VwcG9ydGVkLCBmYWxsIGJhY2sgdG8gY3VzdG9tLW5hbWVkIEhUTUxFdmVudC5cbiAgICAvLyBGYWxsYmFjayB1c2VkIGJ5IEFuZHJvaWQgR2luZ2VyYnJlYWQsIEZGNC01LlxuXG4gICAgLy8gSGFjayB0byBlbXVsYXRlIGBDdXN0b21FdmVudGAsIGBIVE1MRXZlbnRzYCBkb2Vzbid0IHNhdGlzZnkgYEN1c3RvbUV2ZW50YFxuICAgIC8vIHR5cGUuXG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKSBhcyBhbnk7XG4gICAgZXZlbnQuaW5pdEV2ZW50KEV2ZW50VHlwZS5DVVNUT00sIHRydWUsIGZhbHNlKTtcbiAgICAvLyBIYWNrIHRvIGVtdWxhdGUgYEN1c3RvbUV2ZW50YCwgYGRldGFpbGAgaXMgcmVhZG9ubHkgb24gYEN1c3RvbUV2ZW50YC5cbiAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tYW55XG4gICAgKGV2ZW50IGFzIGFueSlbJ2RldGFpbCddID0gZGV0YWlsO1xuICB9XG5cbiAgcmV0dXJuIGV2ZW50O1xufVxuXG4vKipcbiAqIEZpcmVzIGEgY3VzdG9tIGV2ZW50IHdpdGggYW4gb3B0aW9uYWwgcGF5bG9hZC4gT25seSBpbnRlbmRlZCB0byBiZSBjb25zdW1lZFxuICogYnkganNhY3Rpb24gaXRzZWxmLiBTdXBwb3J0ZWQgaW4gRmlyZWZveCA2KywgSUUgOSssIGFuZCBhbGwgQ2hyb21lIHZlcnNpb25zLlxuICpcbiAqIGBib290c3RyYXBDdXN0b21FdmVudFN1cHBvcnRgIGlzIHJlcXVpcmVkIHRvIGFkZCBhIGxpc3RlbmVyIHRoYXQgaGFuZGxlcyB0aGVcbiAqIGV2ZW50LlxuICpcbiAqIEBwYXJhbSB0YXJnZXQgVGhlIHRhcmdldCBlbGVtZW50LlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIGFjdGlvbiwgZS5nLiwgJ3N1Ym1pdCcuXG4gKiBAcGFyYW0gZGF0YSBBbiBvcHRpb25hbCBkYXRhIHBheWxvYWQuXG4gKiBAcGFyYW0gdHJpZ2dlcmluZ0V2ZW50IEFuIG9wdGlvbmFsIGRhdGEgZm9yIHRoZSBFdmVudCB0cmlnZ2VyZWQgdGhpcyBjdXN0b21cbiAqICAgICBldmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZpcmVDdXN0b21FdmVudDxUPihcbiAgdGFyZ2V0OiBFbGVtZW50LFxuICB0eXBlOiBzdHJpbmcsXG4gIGRhdGE/OiBULFxuICB0cmlnZ2VyaW5nRXZlbnQ/OiBFdmVudCxcbikge1xuICBjb25zdCBldmVudCA9IGNyZWF0ZUN1c3RvbUV2ZW50KHR5cGUsIGRhdGEsIHRyaWdnZXJpbmdFdmVudCk7XG4gIHRhcmdldC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbn1cblxuLyoqXG4gKiBCb290c3RyYXBzIGBDdXN0b21FdmVudGAgc3VwcG9ydCBvbiB0aGUgY29udGFpbmVyLlxuICpcbiAqIFRoaXMgaXMgcmVxdWlyZWQgdG8gaGFuZGxlIGV2ZW50cyBmaXJlZCBieSBgZmlyZUN1c3RvbUV2ZW50YCBpbiB0aGUgYGNvbnRhaW5lcmAuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgSlNBY3Rpb24gY29udGFpbmVyIHRvIGFkZCBhbiBldmVudCBsaXN0ZW5lciBvbi5cbiAqIEBwYXJhbSB0cmlnZ2VyIEEgZnVuY3Rpb24gdGhhdCBjYW4gdHJpZ2dlciBKU0FjdGlvbiBFdmVudCBkaXNwYXRjaC4gR2VuZXJhbGx5IHRoaXMgZnVuY3Rpb25cbiAqICAgIHNob3VsZCBkZWxlZ2F0ZSB0byBhbiBgRXZlbnRDb250cmFjdGAgaGFuZGxlciBmb3IgdGhlIGV2ZW50IHR5cGUgcHJvdmlkZWQgZGVmaW5lZCBieVxuICogICAgYGV2ZW50LmRldGFpbFsnX3R5cGUnXWAuXG4gKiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRoYXQgcmVtb3ZlcyB0aGUgZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBib290c3RyYXBDdXN0b21FdmVudFN1cHBvcnQoY29udGFpbmVyOiBFbGVtZW50LCB0cmlnZ2VyOiAoZXZlbnQ6IEV2ZW50KSA9PiB2b2lkKSB7XG4gIGNvbnN0IGN1c3RvbUV2ZW50TGlzdGVuZXIgPSAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgbGV0IGN1c3RvbUV2ZW50ID0gZXZlbnQgYXMgQ3VzdG9tRXZlbnQ7XG4gICAgY29uc3QgZGV0YWlsID0gY3VzdG9tRXZlbnQuZGV0YWlsO1xuICAgIC8vIEZvciBjdXN0b20gZXZlbnRzLCB1c2UgYSBzZWNvbmRhcnkgZGlzcGF0Y2ggYmFzZWQgb24gdGhlIGludGVybmFsXG4gICAgLy8gY3VzdG9tIHR5cGUgb2YgdGhlIGV2ZW50LlxuICAgIGlmICghZGV0YWlsIHx8ICFkZXRhaWxbJ190eXBlJ10pIHtcbiAgICAgIC8vIFRoaXMgc2hvdWxkIG5ldmVyIGhhcHBlbi5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgLy8gTWlycm9ycyBjb2RlIGZyb20gV2l6J3MgaW50ZXJuYWwgYHRyaWdnZXIoKWAgbWV0aG9kLlxuICAgIGNvbnN0IHN5bnRoZXRpY0N1c3RvbUV2ZW50ID0ge1xuICAgICAgJ3R5cGUnOiBkZXRhaWxbJ190eXBlJ10sXG4gICAgICAndGFyZ2V0JzogZXZlbnQudGFyZ2V0LFxuICAgICAgJ2J1YmJsZXMnOiB0cnVlLFxuICAgICAgZGV0YWlsLFxuICAgIH07XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWFueVxuICAgIHRyaWdnZXIoc3ludGhldGljQ3VzdG9tRXZlbnQgYXMgYW55KTtcbiAgfTtcbiAgY29udGFpbmVyLmFkZEV2ZW50TGlzdGVuZXIoJ19jdXN0b20nLCBjdXN0b21FdmVudExpc3RlbmVyKTtcbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb250YWluZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignX2N1c3RvbScsIGN1c3RvbUV2ZW50TGlzdGVuZXIpO1xuICB9O1xufVxuIl19