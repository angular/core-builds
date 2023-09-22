/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/** Configuration object used to register passive and capturing events. */
const eventListenerOptions = {
    passive: true,
    capture: true
};
/** Keeps track of the currently-registered `on interaction` triggers. */
const interactionTriggers = new WeakMap();
/** Names of the events considered as interaction events. */
const interactionEventNames = ['click', 'keydown'];
/** Object keeping track of registered callbacks for a deferred block trigger. */
class DeferEventEntry {
    constructor() {
        this.callbacks = new Set();
        this.listener = () => {
            for (const callback of this.callbacks) {
                callback();
            }
        };
    }
}
/**
 * Registers an interaction trigger.
 * @param trigger Element that is the trigger.
 * @param callback Callback to be invoked when the trigger is interacted with.
 */
export function onInteraction(trigger, callback) {
    let entry = interactionTriggers.get(trigger);
    // If this is the first entry for this element, add the listeners.
    if (!entry) {
        // Note that using managing events centrally like this lends itself well to using global
        // event delegation. It currently does delegation at the element level, rather than the
        // document level, because:
        // 1. Global delegation is the most effective when there are a lot of events being registered
        // at the same time. Deferred blocks are unlikely to be used in such a way.
        // 2. Matching events to their target isn't free. For each `click` and `keydown` event we
        // would have look through all the triggers and check if the target either is the element
        // itself or it's contained within the element. Given that `click` and `keydown` are some
        // of the most common events, this may end up introducing a lot of runtime overhead.
        // 3. We're still registering only two events per element, no matter how many deferred blocks
        // are referencing it.
        entry = new DeferEventEntry();
        interactionTriggers.set(trigger, entry);
        for (const name of interactionEventNames) {
            trigger.addEventListener(name, entry.listener, eventListenerOptions);
        }
    }
    entry.callbacks.add(callback);
    return () => {
        const { callbacks, listener } = entry;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            interactionTriggers.delete(trigger);
            for (const name of interactionEventNames) {
                trigger.removeEventListener(name, listener, eventListenerOptions);
            }
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJfZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZGVmZXJfZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBFQUEwRTtBQUMxRSxNQUFNLG9CQUFvQixHQUE0QjtJQUNwRCxPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQztBQUVGLHlFQUF5RTtBQUN6RSxNQUFNLG1CQUFtQixHQUFHLElBQUksT0FBTyxFQUE0QixDQUFDO0FBRXBFLDREQUE0RDtBQUM1RCxNQUFNLHFCQUFxQixHQUFHLENBQUMsT0FBTyxFQUFFLFNBQVMsQ0FBVSxDQUFDO0FBRTVELGlGQUFpRjtBQUNqRixNQUFNLGVBQWU7SUFBckI7UUFDRSxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztRQUVsQyxhQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ2QsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNyQyxRQUFRLEVBQUUsQ0FBQzthQUNaO1FBQ0gsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztDQUFBO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQUMsT0FBZ0IsRUFBRSxRQUFzQjtJQUNwRSxJQUFJLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0Msa0VBQWtFO0lBQ2xFLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDVix3RkFBd0Y7UUFDeEYsdUZBQXVGO1FBQ3ZGLDJCQUEyQjtRQUMzQiw2RkFBNkY7UUFDN0YsMkVBQTJFO1FBQzNFLHlGQUF5RjtRQUN6Rix5RkFBeUY7UUFDekYseUZBQXlGO1FBQ3pGLG9GQUFvRjtRQUNwRiw2RkFBNkY7UUFDN0Ysc0JBQXNCO1FBQ3RCLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQzlCLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEMsS0FBSyxNQUFNLElBQUksSUFBSSxxQkFBcUIsRUFBRTtZQUN4QyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztTQUN0RTtLQUNGO0lBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFOUIsT0FBTyxHQUFHLEVBQUU7UUFDVixNQUFNLEVBQUMsU0FBUyxFQUFFLFFBQVEsRUFBQyxHQUFHLEtBQU0sQ0FBQztRQUNyQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTNCLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7WUFDeEIsbUJBQW1CLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBRXBDLEtBQUssTUFBTSxJQUFJLElBQUkscUJBQXFCLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsUUFBUSxFQUFFLG9CQUFvQixDQUFDLENBQUM7YUFDbkU7U0FDRjtJQUNILENBQUMsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLyoqIENvbmZpZ3VyYXRpb24gb2JqZWN0IHVzZWQgdG8gcmVnaXN0ZXIgcGFzc2l2ZSBhbmQgY2FwdHVyaW5nIGV2ZW50cy4gKi9cbmNvbnN0IGV2ZW50TGlzdGVuZXJPcHRpb25zOiBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyA9IHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufTtcblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktcmVnaXN0ZXJlZCBgb24gaW50ZXJhY3Rpb25gIHRyaWdnZXJzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25UcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIE5hbWVzIG9mIHRoZSBldmVudHMgY29uc2lkZXJlZCBhcyBpbnRlcmFjdGlvbiBldmVudHMuICovXG5jb25zdCBpbnRlcmFjdGlvbkV2ZW50TmFtZXMgPSBbJ2NsaWNrJywgJ2tleWRvd24nXSBhcyBjb25zdDtcblxuLyoqIE9iamVjdCBrZWVwaW5nIHRyYWNrIG9mIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZvciBhIGRlZmVycmVkIGJsb2NrIHRyaWdnZXIuICovXG5jbGFzcyBEZWZlckV2ZW50RW50cnkge1xuICBjYWxsYmFja3MgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbiAgbGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmNhbGxiYWNrcykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gaW50ZXJhY3Rpb24gdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaW50ZXJhY3RlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGxldCBlbnRyeSA9IGludGVyYWN0aW9uVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXJzLlxuICBpZiAoIWVudHJ5KSB7XG4gICAgLy8gTm90ZSB0aGF0IHVzaW5nIG1hbmFnaW5nIGV2ZW50cyBjZW50cmFsbHkgbGlrZSB0aGlzIGxlbmRzIGl0c2VsZiB3ZWxsIHRvIHVzaW5nIGdsb2JhbFxuICAgIC8vIGV2ZW50IGRlbGVnYXRpb24uIEl0IGN1cnJlbnRseSBkb2VzIGRlbGVnYXRpb24gYXQgdGhlIGVsZW1lbnQgbGV2ZWwsIHJhdGhlciB0aGFuIHRoZVxuICAgIC8vIGRvY3VtZW50IGxldmVsLCBiZWNhdXNlOlxuICAgIC8vIDEuIEdsb2JhbCBkZWxlZ2F0aW9uIGlzIHRoZSBtb3N0IGVmZmVjdGl2ZSB3aGVuIHRoZXJlIGFyZSBhIGxvdCBvZiBldmVudHMgYmVpbmcgcmVnaXN0ZXJlZFxuICAgIC8vIGF0IHRoZSBzYW1lIHRpbWUuIERlZmVycmVkIGJsb2NrcyBhcmUgdW5saWtlbHkgdG8gYmUgdXNlZCBpbiBzdWNoIGEgd2F5LlxuICAgIC8vIDIuIE1hdGNoaW5nIGV2ZW50cyB0byB0aGVpciB0YXJnZXQgaXNuJ3QgZnJlZS4gRm9yIGVhY2ggYGNsaWNrYCBhbmQgYGtleWRvd25gIGV2ZW50IHdlXG4gICAgLy8gd291bGQgaGF2ZSBsb29rIHRocm91Z2ggYWxsIHRoZSB0cmlnZ2VycyBhbmQgY2hlY2sgaWYgdGhlIHRhcmdldCBlaXRoZXIgaXMgdGhlIGVsZW1lbnRcbiAgICAvLyBpdHNlbGYgb3IgaXQncyBjb250YWluZWQgd2l0aGluIHRoZSBlbGVtZW50LiBHaXZlbiB0aGF0IGBjbGlja2AgYW5kIGBrZXlkb3duYCBhcmUgc29tZVxuICAgIC8vIG9mIHRoZSBtb3N0IGNvbW1vbiBldmVudHMsIHRoaXMgbWF5IGVuZCB1cCBpbnRyb2R1Y2luZyBhIGxvdCBvZiBydW50aW1lIG92ZXJoZWFkLlxuICAgIC8vIDMuIFdlJ3JlIHN0aWxsIHJlZ2lzdGVyaW5nIG9ubHkgdHdvIGV2ZW50cyBwZXIgZWxlbWVudCwgbm8gbWF0dGVyIGhvdyBtYW55IGRlZmVycmVkIGJsb2Nrc1xuICAgIC8vIGFyZSByZWZlcmVuY2luZyBpdC5cbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBpbnRlcmFjdGlvblRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IHtjYWxsYmFja3MsIGxpc3RlbmVyfSA9IGVudHJ5ITtcbiAgICBjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChjYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG5cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuIl19