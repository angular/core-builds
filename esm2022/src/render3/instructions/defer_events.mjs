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
/** Names of the events considered as hover events. */
const hoverEventNames = ['mouseenter', 'focusin'];
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
 * @param injector Injector that can be used by the trigger to resolve DI tokens.
 */
export function onInteraction(trigger, callback, injector) {
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
        // Ensure that the handler runs in the NgZone since it gets
        // registered in `afterRender` which runs outside.
        injector.get(NgZone).run(() => {
            for (const name of interactionEventNames) {
                trigger.addEventListener(name, entry.listener, eventListenerOptions);
            }
        });
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
 * @param injector Injector that can be used by the trigger to resolve DI tokens.
 */
export function onHover(trigger, callback, injector) {
    let entry = hoverTriggers.get(trigger);
    // If this is the first entry for this element, add the listener.
    if (!entry) {
        entry = new DeferEventEntry();
        hoverTriggers.set(trigger, entry);
        // Ensure that the handler runs in the NgZone since it gets
        // registered in `afterRender` which runs outside.
        injector.get(NgZone).run(() => {
            for (const name of hoverEventNames) {
                trigger.addEventListener(name, entry.listener, eventListenerOptions);
            }
        });
    }
    entry.callbacks.add(callback);
    return () => {
        const { callbacks, listener } = entry;
        callbacks.delete(callback);
        if (callbacks.size === 0) {
            for (const name of hoverEventNames) {
                trigger.removeEventListener(name, listener, eventListenerOptions);
            }
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
            // It's possible that a different cleanup callback fully removed this element already.
            if (!this.viewportTriggers.has(trigger)) {
                return;
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJfZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZGVmZXJfZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVsQywwRUFBMEU7QUFDMUUsTUFBTSxvQkFBb0IsR0FBNEI7SUFDcEQsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixtRUFBbUU7QUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFOUQseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFcEUsNERBQTREO0FBQzVELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFVLENBQUM7QUFFNUQsc0RBQXNEO0FBQ3RELE1BQU0sZUFBZSxHQUFHLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRWxELGlGQUFpRjtBQUNqRixNQUFNLGVBQWU7SUFBckI7UUFDRSxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztRQUVsQyxhQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ2QsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNyQyxRQUFRLEVBQUUsQ0FBQzthQUNaO1FBQ0gsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztDQUFBO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUN6QixPQUFnQixFQUFFLFFBQXNCLEVBQUUsUUFBa0I7SUFDOUQsSUFBSSxLQUFLLEdBQUcsbUJBQW1C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QUVELElBQUksSUFBSSxDQUFDLHdCQUF3QixLQUFLLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5cbi8qKiBDb25maWd1cmF0aW9uIG9iamVjdCB1c2VkIHRvIHJlZ2lzdGVyIHBhc3NpdmUgYW5kIGNhcHR1cmluZyBldmVudHMuICovXG5jb25zdCBldmVudExpc3RlbmVyT3B0aW9uczogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSB7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn07XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGhvdmVyYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGhvdmVyVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGludGVyYWN0aW9uYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGludGVyYWN0aW9uVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBOYW1lcyBvZiB0aGUgZXZlbnRzIGNvbnNpZGVyZWQgYXMgaW50ZXJhY3Rpb24gZXZlbnRzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25FdmVudE5hbWVzID0gWydjbGljaycsICdrZXlkb3duJ10gYXMgY29uc3Q7XG5cbi8qKiBOYW1lcyBvZiB0aGUgZXZlbnRzIGNvbnNpZGVyZWQgYXMgaG92ZXIgZXZlbnRzLiAqL1xuY29uc3QgaG92ZXJFdmVudE5hbWVzID0gWydtb3VzZWVudGVyJywgJ2ZvY3VzaW4nXTtcblxuLyoqIE9iamVjdCBrZWVwaW5nIHRyYWNrIG9mIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZvciBhIGRlZmVycmVkIGJsb2NrIHRyaWdnZXIuICovXG5jbGFzcyBEZWZlckV2ZW50RW50cnkge1xuICBjYWxsYmFja3MgPSBuZXcgU2V0PCgpID0+IHZvaWQ+KCk7XG5cbiAgbGlzdGVuZXIgPSAoKSA9PiB7XG4gICAgZm9yIChjb25zdCBjYWxsYmFjayBvZiB0aGlzLmNhbGxiYWNrcykge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gaW50ZXJhY3Rpb24gdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaW50ZXJhY3RlZCB3aXRoLlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbkludGVyYWN0aW9uKFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGludGVyYWN0aW9uVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXJzLlxuICBpZiAoIWVudHJ5KSB7XG4gICAgLy8gTm90ZSB0aGF0IHVzaW5nIG1hbmFnaW5nIGV2ZW50cyBjZW50cmFsbHkgbGlrZSB0aGlzIGxlbmRzIGl0c2VsZiB3ZWxsIHRvIHVzaW5nIGdsb2JhbFxuICAgIC8vIGV2ZW50IGRlbGVnYXRpb24uIEl0IGN1cnJlbnRseSBkb2VzIGRlbGVnYXRpb24gYXQgdGhlIGVsZW1lbnQgbGV2ZWwsIHJhdGhlciB0aGFuIHRoZVxuICAgIC8vIGRvY3VtZW50IGxldmVsLCBiZWNhdXNlOlxuICAgIC8vIDEuIEdsb2JhbCBkZWxlZ2F0aW9uIGlzIHRoZSBtb3N0IGVmZmVjdGl2ZSB3aGVuIHRoZXJlIGFyZSBhIGxvdCBvZiBldmVudHMgYmVpbmcgcmVnaXN0ZXJlZFxuICAgIC8vIGF0IHRoZSBzYW1lIHRpbWUuIERlZmVycmVkIGJsb2NrcyBhcmUgdW5saWtlbHkgdG8gYmUgdXNlZCBpbiBzdWNoIGEgd2F5LlxuICAgIC8vIDIuIE1hdGNoaW5nIGV2ZW50cyB0byB0aGVpciB0YXJnZXQgaXNuJ3QgZnJlZS4gRm9yIGVhY2ggYGNsaWNrYCBhbmQgYGtleWRvd25gIGV2ZW50IHdlXG4gICAgLy8gd291bGQgaGF2ZSBsb29rIHRocm91Z2ggYWxsIHRoZSB0cmlnZ2VycyBhbmQgY2hlY2sgaWYgdGhlIHRhcmdldCBlaXRoZXIgaXMgdGhlIGVsZW1lbnRcbiAgICAvLyBpdHNlbGYgb3IgaXQncyBjb250YWluZWQgd2l0aGluIHRoZSBlbGVtZW50LiBHaXZlbiB0aGF0IGBjbGlja2AgYW5kIGBrZXlkb3duYCBhcmUgc29tZVxuICAgIC8vIG9mIHRoZSBtb3N0IGNvbW1vbiBldmVudHMsIHRoaXMgbWF5IGVuZCB1cCBpbnRyb2R1Y2luZyBhIGxvdCBvZiBydW50aW1lIG92ZXJoZWFkLlxuICAgIC8vIDMuIFdlJ3JlIHN0aWxsIHJlZ2lzdGVyaW5nIG9ubHkgdHdvIGV2ZW50cyBwZXIgZWxlbWVudCwgbm8gbWF0dGVyIGhvdyBtYW55IGRlZmVycmVkIGJsb2Nrc1xuICAgIC8vIGFyZSByZWZlcmVuY2luZyBpdC5cbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBpbnRlcmFjdGlvblRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgaGFuZGxlciBydW5zIGluIHRoZSBOZ1pvbmUgc2luY2UgaXQgZ2V0c1xuICAgIC8vIHJlZ2lzdGVyZWQgaW4gYGFmdGVyUmVuZGVyYCB3aGljaCBydW5zIG91dHNpZGUuXG4gICAgaW5qZWN0b3IuZ2V0KE5nWm9uZSkucnVuKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGVudHJ5IS5saXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCB7Y2FsbGJhY2tzLCBsaXN0ZW5lcn0gPSBlbnRyeSE7XG4gICAgY2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG5cbiAgICBpZiAoY2FsbGJhY2tzLnNpemUgPT09IDApIHtcbiAgICAgIGludGVyYWN0aW9uVHJpZ2dlcnMuZGVsZXRlKHRyaWdnZXIpO1xuXG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBob3ZlciB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXIgRWxlbWVudCB0aGF0IGlzIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciBpcyBob3ZlcmVkIG92ZXIuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgdHJpZ2dlciB0byByZXNvbHZlIERJIHRva2Vucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSG92ZXIoXG4gICAgdHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGVudHJ5ID0gaG92ZXJUcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZW50cnkgZm9yIHRoaXMgZWxlbWVudCwgYWRkIHRoZSBsaXN0ZW5lci5cbiAgaWYgKCFlbnRyeSkge1xuICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgIGhvdmVyVHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICAvLyBFbnN1cmUgdGhhdCB0aGUgaGFuZGxlciBydW5zIGluIHRoZSBOZ1pvbmUgc2luY2UgaXQgZ2V0c1xuICAgIC8vIHJlZ2lzdGVyZWQgaW4gYGFmdGVyUmVuZGVyYCB3aGljaCBydW5zIG91dHNpZGUuXG4gICAgaW5qZWN0b3IuZ2V0KE5nWm9uZSkucnVuKCgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBob3ZlckV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGVudHJ5IS5saXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCB7Y2FsbGJhY2tzLCBsaXN0ZW5lcn0gPSBlbnRyeSE7XG4gICAgY2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG5cbiAgICBpZiAoY2FsbGJhY2tzLnNpemUgPT09IDApIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBob3ZlckV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBob3ZlclRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdmlld3BvcnQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgY29tZXMgaW50byB0aGUgdmlld3BvcnQuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgdHJpZ2dlciB0byByZXNvbHZlIERJIHRva2Vucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uVmlld3BvcnQoXG4gICAgdHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKTogVm9pZEZ1bmN0aW9uIHtcbiAgcmV0dXJuIGluamVjdG9yLmdldChEZWZlckludGVyc2VjdGlvbk1hbmFnZXIpLnJlZ2lzdGVyKHRyaWdnZXIsIGNhbGxiYWNrKTtcbn1cblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSByZWdpc3RlcmVkIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG5jbGFzcyBEZWZlckludGVyc2VjdGlvbk1hbmFnZXIge1xuICAvKiogQG5vY29sbGFwc2UgKi9cbiAgc3RhdGljIMm1cHJvdiA9IC8qKiBAcHVyZU9yQnJlYWtNeUNvZGUgKi8gybXJtWRlZmluZUluamVjdGFibGUoe1xuICAgIHRva2VuOiBEZWZlckludGVyc2VjdGlvbk1hbmFnZXIsXG4gICAgcHJvdmlkZWRJbjogJ3Jvb3QnLFxuICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBEZWZlckludGVyc2VjdGlvbk1hbmFnZXIoaW5qZWN0KE5nWm9uZSkpLFxuICB9KTtcblxuICAvKiogYEludGVyc2VjdGlvbk9ic2VydmVyYCB1c2VkIHRvIG9ic2VydmUgYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbiAgcHJpdmF0ZSBpbnRlcnNlY3Rpb25PYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXJ8bnVsbCA9IG51bGw7XG5cbiAgLyoqIE51bWJlciBvZiBlbGVtZW50cyBjdXJyZW50bHkgb2JzZXJ2ZWQgd2l0aCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuICBwcml2YXRlIG9ic2VydmVkVmlld3BvcnRFbGVtZW50cyA9IDA7XG5cbiAgLyoqIEN1cnJlbnRseS1yZWdpc3RlcmVkIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG4gIHByaXZhdGUgdmlld3BvcnRUcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIG5nWm9uZTogTmdab25lKSB7fVxuXG4gIHJlZ2lzdGVyKHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24pOiBWb2lkRnVuY3Rpb24ge1xuICAgIGxldCBlbnRyeSA9IHRoaXMudmlld3BvcnRUcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgICBpZiAoIXRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPVxuICAgICAgICAgIHRoaXMubmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcih0aGlzLmludGVyc2VjdGlvbkNhbGxiYWNrKSk7XG4gICAgfVxuXG4gICAgaWYgKCFlbnRyeSkge1xuICAgICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyIS5vYnNlcnZlKHRyaWdnZXIpKTtcbiAgICAgIHRoaXMudmlld3BvcnRUcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuICAgICAgdGhpcy5vYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMrKztcbiAgICB9XG5cbiAgICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgYSBkaWZmZXJlbnQgY2xlYW51cCBjYWxsYmFjayBmdWxseSByZW1vdmVkIHRoaXMgZWxlbWVudCBhbHJlYWR5LlxuICAgICAgaWYgKCF0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuaGFzKHRyaWdnZXIpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgICBpZiAoZW50cnkhLmNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy52aWV3cG9ydFRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMtLTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uQ2FsbGJhY2s6IEludGVyc2VjdGlvbk9ic2VydmVyQ2FsbGJhY2sgPSBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgLy8gT25seSBpbnZva2UgdGhlIGNhbGxiYWNrcyBpZiB0aGUgc3BlY2lmaWMgZWxlbWVudCBpcyBpbnRlcnNlY3RpbmcuXG4gICAgICBpZiAoY3VycmVudC5pc0ludGVyc2VjdGluZyAmJiB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuaGFzKGN1cnJlbnQudGFyZ2V0KSkge1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW4odGhpcy52aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==