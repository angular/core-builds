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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmZXJfZXZlbnRzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvZGVmZXJfZXZlbnRzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUVsQywwRUFBMEU7QUFDMUUsTUFBTSxvQkFBb0IsR0FBNEI7SUFDcEQsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixtRUFBbUU7QUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFOUQseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFcEUsNERBQTREO0FBQzVELE1BQU0scUJBQXFCLEdBQUcsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFVLENBQUM7QUFFNUQsc0RBQXNEO0FBQ3RELE1BQU0sZUFBZSxHQUFHLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBRWxELGlGQUFpRjtBQUNqRixNQUFNLGVBQWU7SUFBckI7UUFDRSxjQUFTLEdBQUcsSUFBSSxHQUFHLEVBQWMsQ0FBQztRQUVsQyxhQUFRLEdBQUcsR0FBRyxFQUFFO1lBQ2QsS0FBSyxNQUFNLFFBQVEsSUFBSSxJQUFJLENBQUMsU0FBUyxFQUFFO2dCQUNyQyxRQUFRLEVBQUUsQ0FBQzthQUNaO1FBQ0gsQ0FBQyxDQUFBO0lBQ0gsQ0FBQztDQUFBO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUN6QixPQUFnQixFQUFFLFFBQXNCLEVBQUUsUUFBa0I7SUFDOUQsSUFBSSxLQUFLLEdBQUcsbUJBQW1CLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRTdDLGtFQUFrRTtJQUNsRSxJQUFJLENBQUMsS0FBSyxFQUFFO1FBQ1Ysd0ZBQXdGO1FBQ3hGLHVGQUF1RjtRQUN2RiwyQkFBMkI7UUFDM0IsNkZBQTZGO1FBQzdGLDJFQUEyRTtRQUMzRSx5RkFBeUY7UUFDekYseUZBQXlGO1FBQ3pGLHlGQUF5RjtRQUN6RixvRkFBb0Y7UUFDcEYsNkZBQTZGO1FBQzdGLHNCQUFzQjtRQUN0QixLQUFLLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUM5QixtQkFBbUIsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhDLDJEQUEyRDtRQUMzRCxrREFBa0Q7UUFDbEQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQzVCLEtBQUssTUFBTSxJQUFJLElBQUkscUJBQXFCLEVBQUU7Z0JBQ3hDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLEVBQUUsS0FBTSxDQUFDLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2FBQ3ZFO1FBQ0gsQ0FBQyxDQUFDLENBQUM7S0FDSjtJQUVELEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRTlCLE9BQU8sR0FBRyxFQUFFO1FBQ1YsTUFBTSxFQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUMsR0FBRyxLQUFNLENBQUM7UUFDckMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUUzQixJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ3hCLG1CQUFtQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUVwQyxLQUFLLE1BQU0sSUFBSSxJQUFJLHFCQUFxQixFQUFFO2dCQUN4QyxPQUFPLENBQUMsbUJBQW1CLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO2FBQ25FO1NBQ0Y7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsT0FBTyxDQUNuQixPQUFnQixFQUFFLFFBQXNCLEVBQUUsUUFBa0I7SUFDOUQsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2QyxpRUFBaUU7SUFDakUsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUNWLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLDJEQUEyRDtRQUMzRCxrREFBa0Q7UUFDbEQsUUFBUSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO1lBQzVCLEtBQUssTUFBTSxJQUFJLElBQUksZUFBZSxFQUFFO2dCQUNsQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLEtBQU0sQ0FBQyxRQUFRLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzthQUN2RTtRQUNILENBQUMsQ0FBQyxDQUFDO0tBQ0o7SUFFRCxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUU5QixPQUFPLEdBQUcsRUFBRTtRQUNWLE1BQU0sRUFBQyxTQUFTLEVBQUUsUUFBUSxFQUFDLEdBQUcsS0FBTSxDQUFDO1FBQ3JDLFNBQVMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFM0IsSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUN4QixLQUFLLE1BQU0sSUFBSSxJQUFJLGVBQWUsRUFBRTtnQkFDbEMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsb0JBQW9CLENBQUMsQ0FBQzthQUNuRTtZQUNELGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDL0I7SUFDSCxDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUN0QixPQUFnQixFQUFFLFFBQXNCLEVBQUUsUUFBa0I7SUFDOUQsT0FBTyxRQUFRLENBQUMsR0FBRyxDQUFDLHdCQUF3QixDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1RSxDQUFDO0FBRUQseURBQXlEO0FBQ3pELE1BQU0sd0JBQXdCO0lBQzVCLGtCQUFrQjthQUNYLFVBQUssR0FBNkIsa0JBQWtCLENBQUM7UUFDMUQsS0FBSyxFQUFFLHdCQUF3QjtRQUMvQixVQUFVLEVBQUUsTUFBTTtRQUNsQixPQUFPLEVBQUUsR0FBRyxFQUFFLENBQUMsSUFBSSx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDNUQsQ0FBQyxBQUpVLENBSVQ7SUFXSCxZQUFvQixNQUFjO1FBQWQsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQVRsQyxrRUFBa0U7UUFDMUQseUJBQW9CLEdBQThCLElBQUksQ0FBQztRQUUvRCxzRUFBc0U7UUFDOUQsNkJBQXdCLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLGdEQUFnRDtRQUN4QyxxQkFBZ0IsR0FBRyxJQUFJLE9BQU8sRUFBNEIsQ0FBQztRQXFDM0QseUJBQW9CLEdBQWlDLE9BQU8sQ0FBQyxFQUFFO1lBQ3JFLEtBQUssTUFBTSxPQUFPLElBQUksT0FBTyxFQUFFO2dCQUM3QixxRUFBcUU7Z0JBQ3JFLElBQUksT0FBTyxDQUFDLGNBQWMsSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRTtvQkFDdkUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFFLENBQUMsUUFBUSxDQUFDLENBQUM7aUJBQ3RFO2FBQ0Y7UUFDSCxDQUFDLENBQUE7SUExQ29DLENBQUM7SUFFdEMsUUFBUSxDQUFDLE9BQWdCLEVBQUUsUUFBc0I7UUFDL0MsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUUvQyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLElBQUksQ0FBQyxvQkFBb0I7Z0JBQ3JCLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1NBQzlGO1FBRUQsSUFBSSxDQUFDLEtBQUssRUFBRTtZQUNWLEtBQUssR0FBRyxJQUFJLGVBQWUsRUFBRSxDQUFDO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLG9CQUFxQixDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQ2pGLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO1NBQ2pDO1FBRUQsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFOUIsT0FBTyxHQUFHLEVBQUU7WUFDVixLQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUVsQyxJQUFJLEtBQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxLQUFLLENBQUMsRUFBRTtnQkFDL0IsSUFBSSxDQUFDLG9CQUFvQixFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEMsSUFBSSxDQUFDLHdCQUF3QixFQUFFLENBQUM7YUFDakM7WUFFRCxJQUFJLElBQUksQ0FBQyx3QkFBd0IsS0FBSyxDQUFDLEVBQUU7Z0JBQ3ZDLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxVQUFVLEVBQUUsQ0FBQztnQkFDeEMsSUFBSSxDQUFDLG9CQUFvQixHQUFHLElBQUksQ0FBQzthQUNsQztRQUNILENBQUMsQ0FBQztJQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiFcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpbmplY3QsIEluamVjdG9yLCDJtcm1ZGVmaW5lSW5qZWN0YWJsZX0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uLy4uL3pvbmUnO1xuXG4vKiogQ29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byByZWdpc3RlciBwYXNzaXZlIGFuZCBjYXB0dXJpbmcgZXZlbnRzLiAqL1xuY29uc3QgZXZlbnRMaXN0ZW5lck9wdGlvbnM6IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zID0ge1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59O1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBob3ZlcmAgdHJpZ2dlcnMuICovXG5jb25zdCBob3ZlclRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBpbnRlcmFjdGlvbmAgdHJpZ2dlcnMuICovXG5jb25zdCBpbnRlcmFjdGlvblRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGludGVyYWN0aW9uIGV2ZW50cy4gKi9cbmNvbnN0IGludGVyYWN0aW9uRXZlbnROYW1lcyA9IFsnY2xpY2snLCAna2V5ZG93biddIGFzIGNvbnN0O1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGhvdmVyIGV2ZW50cy4gKi9cbmNvbnN0IGhvdmVyRXZlbnROYW1lcyA9IFsnbW91c2VlbnRlcicsICdmb2N1c2luJ107XG5cbi8qKiBPYmplY3Qga2VlcGluZyB0cmFjayBvZiByZWdpc3RlcmVkIGNhbGxiYWNrcyBmb3IgYSBkZWZlcnJlZCBibG9jayB0cmlnZ2VyLiAqL1xuY2xhc3MgRGVmZXJFdmVudEVudHJ5IHtcbiAgY2FsbGJhY2tzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4gIGxpc3RlbmVyID0gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGludGVyYWN0aW9uIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGludGVyYWN0ZWQgd2l0aC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbihcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgZW50cnkgPSBpbnRlcmFjdGlvblRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbnRyeSBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGxpc3RlbmVycy5cbiAgaWYgKCFlbnRyeSkge1xuICAgIC8vIE5vdGUgdGhhdCB1c2luZyBtYW5hZ2luZyBldmVudHMgY2VudHJhbGx5IGxpa2UgdGhpcyBsZW5kcyBpdHNlbGYgd2VsbCB0byB1c2luZyBnbG9iYWxcbiAgICAvLyBldmVudCBkZWxlZ2F0aW9uLiBJdCBjdXJyZW50bHkgZG9lcyBkZWxlZ2F0aW9uIGF0IHRoZSBlbGVtZW50IGxldmVsLCByYXRoZXIgdGhhbiB0aGVcbiAgICAvLyBkb2N1bWVudCBsZXZlbCwgYmVjYXVzZTpcbiAgICAvLyAxLiBHbG9iYWwgZGVsZWdhdGlvbiBpcyB0aGUgbW9zdCBlZmZlY3RpdmUgd2hlbiB0aGVyZSBhcmUgYSBsb3Qgb2YgZXZlbnRzIGJlaW5nIHJlZ2lzdGVyZWRcbiAgICAvLyBhdCB0aGUgc2FtZSB0aW1lLiBEZWZlcnJlZCBibG9ja3MgYXJlIHVubGlrZWx5IHRvIGJlIHVzZWQgaW4gc3VjaCBhIHdheS5cbiAgICAvLyAyLiBNYXRjaGluZyBldmVudHMgdG8gdGhlaXIgdGFyZ2V0IGlzbid0IGZyZWUuIEZvciBlYWNoIGBjbGlja2AgYW5kIGBrZXlkb3duYCBldmVudCB3ZVxuICAgIC8vIHdvdWxkIGhhdmUgbG9vayB0aHJvdWdoIGFsbCB0aGUgdHJpZ2dlcnMgYW5kIGNoZWNrIGlmIHRoZSB0YXJnZXQgZWl0aGVyIGlzIHRoZSBlbGVtZW50XG4gICAgLy8gaXRzZWxmIG9yIGl0J3MgY29udGFpbmVkIHdpdGhpbiB0aGUgZWxlbWVudC4gR2l2ZW4gdGhhdCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgYXJlIHNvbWVcbiAgICAvLyBvZiB0aGUgbW9zdCBjb21tb24gZXZlbnRzLCB0aGlzIG1heSBlbmQgdXAgaW50cm9kdWNpbmcgYSBsb3Qgb2YgcnVudGltZSBvdmVyaGVhZC5cbiAgICAvLyAzLiBXZSdyZSBzdGlsbCByZWdpc3RlcmluZyBvbmx5IHR3byBldmVudHMgcGVyIGVsZW1lbnQsIG5vIG1hdHRlciBob3cgbWFueSBkZWZlcnJlZCBibG9ja3NcbiAgICAvLyBhcmUgcmVmZXJlbmNpbmcgaXQuXG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBpbnRlcmFjdGlvblRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcblxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGludGVyYWN0aW9uRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgaG92ZXIgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaG92ZXJlZCBvdmVyLlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbkhvdmVyKFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGhvdmVyVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXIuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBob3ZlclRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaG92ZXJUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHZpZXdwb3J0IHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGNvbWVzIGludG8gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblZpZXdwb3J0KFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIHJldHVybiBpbmplY3Rvci5nZXQoRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKS5yZWdpc3Rlcih0cmlnZ2VyLCBjYWxsYmFjayk7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuY2xhc3MgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKGluamVjdChOZ1pvbmUpKSxcbiAgfSk7XG5cbiAgLyoqIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAgdXNlZCB0byBvYnNlcnZlIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4gIC8qKiBOdW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IG9ic2VydmVkIHdpdGggYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbiAgcHJpdmF0ZSBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPSAwO1xuXG4gIC8qKiBDdXJyZW50bHktcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuICBwcml2YXRlIHZpZXdwb3J0VHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge31cblxuICByZWdpc3Rlcih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBsZXQgZW50cnkgPSB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gICAgaWYgKCF0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyKSB7XG4gICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID1cbiAgICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5pbnRlcnNlY3Rpb25DYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICghZW50cnkpIHtcbiAgICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciEub2JzZXJ2ZSh0cmlnZ2VyKSk7XG4gICAgICB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICAgIHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzKys7XG4gICAgfVxuXG4gICAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgICBpZiAoZW50cnkhLmNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy52aWV3cG9ydFRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICAgICAgdGhpcy5vYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMtLTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID09PSAwKSB7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgICAgdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uQ2FsbGJhY2s6IEludGVyc2VjdGlvbk9ic2VydmVyQ2FsbGJhY2sgPSBlbnRyaWVzID0+IHtcbiAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgLy8gT25seSBpbnZva2UgdGhlIGNhbGxiYWNrcyBpZiB0aGUgc3BlY2lmaWMgZWxlbWVudCBpcyBpbnRlcnNlY3RpbmcuXG4gICAgICBpZiAoY3VycmVudC5pc0ludGVyc2VjdGluZyAmJiB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuaGFzKGN1cnJlbnQudGFyZ2V0KSkge1xuICAgICAgICB0aGlzLm5nWm9uZS5ydW4odGhpcy52aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbiJdfQ==