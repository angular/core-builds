/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, ɵɵdefineInjectable } from '../../di';
import { NgZone } from '../../zone';
/** Configuration object used to register passive and capturing events. */
const eventListenerOptions = {
    passive: true,
    capture: true
};
/** Keeps track of the currently-registered `on hover` triggers. */
const hoverTriggers = new WeakMap();
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
/**
 * Registers a hover trigger.
 * @param trigger Element that is the trigger.
 * @param callback Callback to be invoked when the trigger is hovered over.
 */
export function onHover(trigger, callback) {
    let entry = hoverTriggers.get(trigger);
    // If this is the first entry for this element, add the listener.
    if (!entry) {
        entry = new DeferEventEntry();
        trigger.addEventListener('mouseenter', entry.listener, eventListenerOptions);
        hoverTriggers.set(trigger, entry);
    }
    entry.callbacks.add(callback);
    return () => {
        const { callbacks, listener } = entry;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            trigger.removeEventListener('mouseenter', listener, eventListenerOptions);
            hoverTriggers.delete(trigger);
        }
    };
}
/**
 * Registers a viewport trigger.
 * @param trigger Element that is the trigger.
 * @param callback Callback to be invoked when the trigger comes into the viewport.
 * @param injector Injector that can be used by the trigger to resolve DI tokens.
 */
export function onViewport(trigger, callback, injector) {
    return injector.get(DeferIntersectionManager).register(trigger, callback);
}
/** Keeps track of the registered `viewport` triggers. */
class DeferIntersectionManager {
    /** @nocollapse */
    static { this.ɵprov = ɵɵdefineInjectable({
        token: DeferIntersectionManager,
        providedIn: 'root',
        factory: () => new DeferIntersectionManager(inject(NgZone)),
    }); }
    constructor(ngZone) {
        this.ngZone = ngZone;
        /** `IntersectionObserver` used to observe `viewport` triggers. */
        this.intersectionObserver = null;
        /** Number of elements currently observed with `viewport` triggers. */
        this.observedViewportElements = 0;
        /** Currently-registered `viewport` triggers. */
        this.viewportTriggers = new WeakMap();
        this.intersectionCallback = entries => {
            for (const current of entries) {
                // Only invoke the callbacks if the specific element is intersecting.
                if (current.isIntersecting && this.viewportTriggers.has(current.target)) {
                    this.ngZone.run(this.viewportTriggers.get(current.target).listener);
                }
            }
        };
    }
    register(trigger, callback) {
        let entry = this.viewportTriggers.get(trigger);
        if (!this.intersectionObserver) {
            this.intersectionObserver =
                this.ngZone.runOutsideAngular(() => new IntersectionObserver(this.intersectionCallback));
        }
        if (!entry) {
            entry = new DeferEventEntry();
            this.ngZone.runOutsideAngular(() => this.intersectionObserver.observe(trigger));
            this.viewportTriggers.set(trigger, entry);
            this.observedViewportElements++;
        }
        entry.callbacks.add(callback);
        return () => {
            entry.callbacks.delete(callback);
            if (entry.callbacks.size === 0) {
                this.intersectionObserver?.unobserve(trigger);
                this.viewportTriggers.delete(trigger);
                this.observedViewportElements--;
            }
            if (this.observedViewportElements === 0) {
                this.intersectionObserver?.disconnect();
                this.intersectionObserver = null;
            }
        };
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJfZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZGVmZXJfZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVsQywwRUFBMEU7QUFDMUUsTUFBTSxvQkFBb0IsR0FBNEI7SUFDcEQsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixtRUFBbUU7QUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFOUQseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFcEUsNERBQTREO0FBQzVELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFVLENBQUM7QUFFNUQsaUZBQWlGO0FBQ2pGLE1BQU0sZUFBZTtJQUFyQjtRQUNFLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO1FBRWxDLGFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDZCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ3JDLFFBQVEsRUFBRSxDQUFDO2FBQ1o7UUFDSCxDQUFDLENBQUE7SUFDSCxDQUFDO0NBQUE7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGFBQWEsQ0FBQyxPQUFnQixFQUFFLFFBQXNCO0lBQ3BFLElBQUksS0FBSyxHQUFHLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUU3QyxrRUFBa0U7SUFDbEUsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLHdG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RixJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUMxQyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztTQUNqQztRQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRTlCLE9BQU8sR0FBRyxFQUFFO1lBQ1YsS0FBTSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7WUFFbEMsSUFBSSxLQUFNLENBQUMsU0FBUyxDQUFDLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQy9CLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQzlDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7Z0JBQ3RDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO2FBQ2pDO1lBRUQsSUFBSSxJQUFJLENBQUMsd0JBQXdCLEtBQUssQ0FBQyxFQUFFO2dCQUN2QyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsVUFBVSxFQUFFLENBQUM7Z0JBQ3hDLElBQUksQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUM7YUFDbEM7UUFDSCxDQUFDLENBQUM7SUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7Tmdab25lfSBmcm9tICcuLi8uLi96b25lJztcblxuLyoqIENvbmZpZ3VyYXRpb24gb2JqZWN0IHVzZWQgdG8gcmVnaXN0ZXIgcGFzc2l2ZSBhbmQgY2FwdHVyaW5nIGV2ZW50cy4gKi9cbmNvbnN0IGV2ZW50TGlzdGVuZXJPcHRpb25zOiBBZGRFdmVudExpc3RlbmVyT3B0aW9ucyA9IHtcbiAgcGFzc2l2ZTogdHJ1ZSxcbiAgY2FwdHVyZTogdHJ1ZVxufTtcblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktcmVnaXN0ZXJlZCBgb24gaG92ZXJgIHRyaWdnZXJzLiAqL1xuY29uc3QgaG92ZXJUcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktcmVnaXN0ZXJlZCBgb24gaW50ZXJhY3Rpb25gIHRyaWdnZXJzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25UcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIE5hbWVzIG9mIHRoZSBldmVudHMgY29uc2lkZXJlZCBhcyBpbnRlcmFjdGlvbiBldmVudHMuICovXG5jb25zdCBpbnRlcmFjdGlvbkV2ZW50TmFtZXMgPSBbJ2NsaWNrJywgJ2tleWRvd24nXSBhcyBjb25zdDtcblxuLyoqIE9iamVjdCBrZWVwaW5nIHRyYWNrIG9mIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZvciBhIGRlZmVycmVkIGJsb2NrIHRyaWdnZXIuICovXG5jbGFzcyBEZWZlckV2ZW50RW50cnkge1xuICBjYWxsYmFja3MgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbiAgbGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmNhbGxiYWNrcykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gaW50ZXJhY3Rpb24gdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaW50ZXJhY3RlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGxldCBlbnRyeSA9IGludGVyYWN0aW9uVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXJzLlxuICBpZiAoIWVudHJ5KSB7XG4gICAgLy8gTm90ZSB0aGF0IHVzaW5nIG1hbmFnaW5nIGV2ZW50cyBjZW50cmFsbHkgbGlrZSB0aGlzIGxlbmRzIGl0c2VsZiB3ZWxsIHRvIHVzaW5nIGdsb2JhbFxuICAgIC8vIGV2ZW50IGRlbGVnYXRpb24uIEl0IGN1cnJlbnRseSBkb2VzIGRlbGVnYXRpb24gYXQgdGhlIGVsZW1lbnQgbGV2ZWwsIHJhdGhlciB0aGFuIHRoZVxuICAgIC8vIGRvY3VtZW50IGxldmVsLCBiZWNhdXNlOlxuICAgIC8vIDEuIEdsb2JhbCBkZWxlZ2F0aW9uIGlzIHRoZSBtb3N0IGVmZmVjdGl2ZSB3aGVuIHRoZXJlIGFyZSBhIGxvdCBvZiBldmVudHMgYmVpbmcgcmVnaXN0ZXJlZFxuICAgIC8vIGF0IHRoZSBzYW1lIHRpbWUuIERlZmVycmVkIGJsb2NrcyBhcmUgdW5saWtlbHkgdG8gYmUgdXNlZCBpbiBzdWNoIGEgd2F5LlxuICAgIC8vIDIuIE1hdGNoaW5nIGV2ZW50cyB0byB0aGVpciB0YXJnZXQgaXNuJ3QgZnJlZS4gRm9yIGVhY2ggYGNsaWNrYCBhbmQgYGtleWRvd25gIGV2ZW50IHdlXG4gICAgLy8gd291bGQgaGF2ZSBsb29rIHRocm91Z2ggYWxsIHRoZSB0cmlnZ2VycyBhbmQgY2hlY2sgaWYgdGhlIHRhcmdldCBlaXRoZXIgaXMgdGhlIGVsZW1lbnRcbiAgICAvLyBpdHNlbGYgb3IgaXQncyBjb250YWluZWQgd2l0aGluIHRoZSBlbGVtZW50LiBHaXZlbiB0aGF0IGBjbGlja2AgYW5kIGBrZXlkb3duYCBhcmUgc29tZVxuICAgIC8vIG9mIHRoZSBtb3N0IGNvbW1vbiBldmVudHMsIHRoaXMgbWF5IGVuZCB1cCBpbnRyb2R1Y2luZyBhIGxvdCBvZiBydW50aW1lIG92ZXJoZWFkLlxuICAgIC8vIDMuIFdlJ3JlIHN0aWxsIHJlZ2lzdGVyaW5nIG9ubHkgdHdvIGV2ZW50cyBwZXIgZWxlbWVudCwgbm8gbWF0dGVyIGhvdyBtYW55IGRlZmVycmVkIGJsb2Nrc1xuICAgIC8vIGFyZSByZWZlcmVuY2luZyBpdC5cbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBpbnRlcmFjdGlvblRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IHtjYWxsYmFja3MsIGxpc3RlbmVyfSA9IGVudHJ5ITtcbiAgICBjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChjYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG5cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGhvdmVyIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGhvdmVyZWQgb3Zlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSG92ZXIodHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGhvdmVyVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXIuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBlbnRyeS5saXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIGhvdmVyVHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgaG92ZXJUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHZpZXdwb3J0IHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGNvbWVzIGludG8gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblZpZXdwb3J0KFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIHJldHVybiBpbmplY3Rvci5nZXQoRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKS5yZWdpc3Rlcih0cmlnZ2VyLCBjYWxsYmFjayk7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuY2xhc3MgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKGluamVjdChOZ1pvbmUpKSxcbiAgfSk7XG5cbiAgLyoqIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAgdXNlZCB0byBvYnNlcnZlIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4gIC8qKiBOdW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IG9ic2VydmVkIHdpdGggYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbiAgcHJpdmF0ZSBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPSAwO1xuXG4gIC8qKiBDdXJyZW50bHktcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuICBwcml2YXRlIHZpZXdwb3J0VHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge31cblxuICByZWdpc3Rlcih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBsZXQgZW50cnkgPSB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gICAgaWYgKCF0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyKSB7XG4gICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID1cbiAgICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5pbnRlcnNlY3Rpb25DYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICghZW50cnkpIHtcbiAgICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciEub2JzZXJ2ZSh0cmlnZ2VyKSk7XG4gICAgICB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICAgIHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzKys7XG4gICAgfVxuXG4gICAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgICBpZiAoZW50cnkhLmNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy52aWV3cG9ydFRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMtLTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uQ2FsbGJhY2s6IEludGVyc2VjdGlvbk9ic2VydmVyQ2FsbGJhY2sgPSBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgLy8gT25seSBpbnZva2UgdGhlIGNhbGxiYWNrcyBpZiB0aGUgc3BlY2lmaWMgZWxlbWVudCBpcyBpbnRlcnNlY3RpbmcuXG4gICAgICBpZiAoY3VycmVudC5pc0ludGVyc2VjdGluZyAmJiB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuaGFzKGN1cnJlbnQudGFyZ2V0KSkge1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW4odGhpcy52aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==