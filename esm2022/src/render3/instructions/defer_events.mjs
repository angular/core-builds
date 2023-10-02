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
            trigger.addEventListener('mouseenter', entry.listener, eventListenerOptions);
        });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJfZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZGVmZXJfZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVsQywwRUFBMEU7QUFDMUUsTUFBTSxvQkFBb0IsR0FBNEI7SUFDcEQsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixtRUFBbUU7QUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFOUQseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFcEUsNERBQTREO0FBQzVELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFVLENBQUM7QUFFNUQsaUZBQWlGO0FBQ2pGLE1BQU0sZUFBZTtJQUFyQjtRQUNFLGNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBYyxDQUFDO1FBRWxDLGFBQVEsR0FBRyxHQUFHLEVBQUU7WUFDZCxLQUFLLE1BQU0sUUFBUSxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUU7Z0JBQ3JDLFFBQVEsRUFBRSxDQUFDO2FBQ1o7UUFDSCxDQUFDLENBQUE7SUFDSCxDQUFDO0NBQUE7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQ3pCLE9BQWdCLEVBQUUsUUFBc0IsRUFBRSxRQUFrQjtJQUM5RCxJQUFJLEtBQUssR0FBRyxtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0Msa0VBQWtFO0lBQ2xFLElBQUksQ0FBQyxLQUFL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QyxHQUFHLEVBQUUsQ0FBQyxJQUFJLG9CQUFvQixDQUFDLElBQUksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLENBQUM7U0FDOUY7UUFFRCxJQUFJLENBQUMsS0FBSyxFQUFFO1lBQ1YsS0FBSyxHQUFHLElBQUksZUFBZSxFQUFFLENBQUM7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsb0JBQXFCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDakYsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7U0FDakM7UUFFRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU5QixPQUFPLEdBQUcsRUFBRTtZQUNWLEtBQU0sQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBRWxDLElBQUksS0FBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMsb0JBQW9CLEVBQUUsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN0QyxJQUFJLENBQUMsd0JBQXdCLEVBQUUsQ0FBQzthQUNqQztZQUVELElBQUksSUFBSSxDQUFDLHdCQUF3QixLQUFLLENBQUMsRUFBRTtnQkFDdkMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLFVBQVUsRUFBRSxDQUFDO2dCQUN4QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO2FBQ2xDO1FBQ0gsQ0FBQyxDQUFDO0lBQ0osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2luamVjdCwgSW5qZWN0b3IsIMm1ybVkZWZpbmVJbmplY3RhYmxlfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vLi4vem9uZSc7XG5cbi8qKiBDb25maWd1cmF0aW9uIG9iamVjdCB1c2VkIHRvIHJlZ2lzdGVyIHBhc3NpdmUgYW5kIGNhcHR1cmluZyBldmVudHMuICovXG5jb25zdCBldmVudExpc3RlbmVyT3B0aW9uczogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSB7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn07XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGhvdmVyYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGhvdmVyVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGludGVyYWN0aW9uYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGludGVyYWN0aW9uVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBOYW1lcyBvZiB0aGUgZXZlbnRzIGNvbnNpZGVyZWQgYXMgaW50ZXJhY3Rpb24gZXZlbnRzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25FdmVudE5hbWVzID0gWydjbGljaycsICdrZXlkb3duJ10gYXMgY29uc3Q7XG5cbi8qKiBPYmplY3Qga2VlcGluZyB0cmFjayBvZiByZWdpc3RlcmVkIGNhbGxiYWNrcyBmb3IgYSBkZWZlcnJlZCBibG9jayB0cmlnZ2VyLiAqL1xuY2xhc3MgRGVmZXJFdmVudEVudHJ5IHtcbiAgY2FsbGJhY2tzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4gIGxpc3RlbmVyID0gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGludGVyYWN0aW9uIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGludGVyYWN0ZWQgd2l0aC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbihcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgZW50cnkgPSBpbnRlcmFjdGlvblRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbnRyeSBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGxpc3RlbmVycy5cbiAgaWYgKCFlbnRyeSkge1xuICAgIC8vIE5vdGUgdGhhdCB1c2luZyBtYW5hZ2luZyBldmVudHMgY2VudHJhbGx5IGxpa2UgdGhpcyBsZW5kcyBpdHNlbGYgd2VsbCB0byB1c2luZyBnbG9iYWxcbiAgICAvLyBldmVudCBkZWxlZ2F0aW9uLiBJdCBjdXJyZW50bHkgZG9lcyBkZWxlZ2F0aW9uIGF0IHRoZSBlbGVtZW50IGxldmVsLCByYXRoZXIgdGhhbiB0aGVcbiAgICAvLyBkb2N1bWVudCBsZXZlbCwgYmVjYXVzZTpcbiAgICAvLyAxLiBHbG9iYWwgZGVsZWdhdGlvbiBpcyB0aGUgbW9zdCBlZmZlY3RpdmUgd2hlbiB0aGVyZSBhcmUgYSBsb3Qgb2YgZXZlbnRzIGJlaW5nIHJlZ2lzdGVyZWRcbiAgICAvLyBhdCB0aGUgc2FtZSB0aW1lLiBEZWZlcnJlZCBibG9ja3MgYXJlIHVubGlrZWx5IHRvIGJlIHVzZWQgaW4gc3VjaCBhIHdheS5cbiAgICAvLyAyLiBNYXRjaGluZyBldmVudHMgdG8gdGhlaXIgdGFyZ2V0IGlzbid0IGZyZWUuIEZvciBlYWNoIGBjbGlja2AgYW5kIGBrZXlkb3duYCBldmVudCB3ZVxuICAgIC8vIHdvdWxkIGhhdmUgbG9vayB0aHJvdWdoIGFsbCB0aGUgdHJpZ2dlcnMgYW5kIGNoZWNrIGlmIHRoZSB0YXJnZXQgZWl0aGVyIGlzIHRoZSBlbGVtZW50XG4gICAgLy8gaXRzZWxmIG9yIGl0J3MgY29udGFpbmVkIHdpdGhpbiB0aGUgZWxlbWVudC4gR2l2ZW4gdGhhdCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgYXJlIHNvbWVcbiAgICAvLyBvZiB0aGUgbW9zdCBjb21tb24gZXZlbnRzLCB0aGlzIG1heSBlbmQgdXAgaW50cm9kdWNpbmcgYSBsb3Qgb2YgcnVudGltZSBvdmVyaGVhZC5cbiAgICAvLyAzLiBXZSdyZSBzdGlsbCByZWdpc3RlcmluZyBvbmx5IHR3byBldmVudHMgcGVyIGVsZW1lbnQsIG5vIG1hdHRlciBob3cgbWFueSBkZWZlcnJlZCBibG9ja3NcbiAgICAvLyBhcmUgcmVmZXJlbmNpbmcgaXQuXG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBpbnRlcmFjdGlvblRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcblxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGludGVyYWN0aW9uRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgaG92ZXIgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaG92ZXJlZCBvdmVyLlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbkhvdmVyKFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGhvdmVyVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXIuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBob3ZlclRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vdXNlZW50ZXInLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgaG92ZXJUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHZpZXdwb3J0IHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGNvbWVzIGludG8gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblZpZXdwb3J0KFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIHJldHVybiBpbmplY3Rvci5nZXQoRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKS5yZWdpc3Rlcih0cmlnZ2VyLCBjYWxsYmFjayk7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuY2xhc3MgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKGluamVjdChOZ1pvbmUpKSxcbiAgfSk7XG5cbiAgLyoqIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAgdXNlZCB0byBvYnNlcnZlIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4gIC8qKiBOdW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IG9ic2VydmVkIHdpdGggYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbiAgcHJpdmF0ZSBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPSAwO1xuXG4gIC8qKiBDdXJyZW50bHktcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuICBwcml2YXRlIHZpZXdwb3J0VHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge31cblxuICByZWdpc3Rlcih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBsZXQgZW50cnkgPSB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gICAgaWYgKCF0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyKSB7XG4gICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID1cbiAgICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5pbnRlcnNlY3Rpb25DYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICghZW50cnkpIHtcbiAgICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciEub2JzZXJ2ZSh0cmlnZ2VyKSk7XG4gICAgICB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICAgIHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzKys7XG4gICAgfVxuXG4gICAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgICBpZiAoZW50cnkhLmNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy52aWV3cG9ydFRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMtLTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uQ2FsbGJhY2s6IEludGVyc2VjdGlvbk9ic2VydmVyQ2FsbGJhY2sgPSBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgLy8gT25seSBpbnZva2UgdGhlIGNhbGxiYWNrcyBpZiB0aGUgc3BlY2lmaWMgZWxlbWVudCBpcyBpbnRlcnNlY3RpbmcuXG4gICAgICBpZiAoY3VycmVudC5pc0ludGVyc2VjdGluZyAmJiB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuaGFzKGN1cnJlbnQudGFyZ2V0KSkge1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW4odGhpcy52aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==