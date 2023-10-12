/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, ɵɵdefineInjectable } from '../di';
import { afterRender } from '../render3/after_render_hooks';
import { assertLContainer, assertLView } from '../render3/assert';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { FLAGS, HEADER_OFFSET, INJECTOR } from '../render3/interfaces/view';
import { getNativeByIndex, removeLViewOnDestroy, storeLViewOnDestroy, walkUpViews } from '../render3/util/view_utils';
import { assertElement, assertEqual } from '../util/assert';
import { NgZone } from '../zone';
import { DEFER_BLOCK_STATE, DeferBlockInternalState, DeferBlockState } from './interfaces';
import { getLDeferBlockDetails } from './utils';
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
/**
 * Helper function to get the LView in which a deferred block's trigger is rendered.
 * @param deferredHostLView LView in which the deferred block is defined.
 * @param deferredTNode TNode defining the deferred block.
 * @param walkUpTimes Number of times to go up in the view hierarchy to find the trigger's view.
 *   A negative value means that the trigger is inside the block's placeholder, while an undefined
 *   value means that the trigger is in the same LView as the deferred block.
 */
export function getTriggerLView(deferredHostLView, deferredTNode, walkUpTimes) {
    // The trigger is in the same view, we don't need to traverse.
    if (walkUpTimes == null) {
        return deferredHostLView;
    }
    // A positive value or zero means that the trigger is in a parent view.
    if (walkUpTimes >= 0) {
        return walkUpViews(walkUpTimes, deferredHostLView);
    }
    // If the value is negative, it means that the trigger is inside the placeholder.
    const deferredContainer = deferredHostLView[deferredTNode.index];
    ngDevMode && assertLContainer(deferredContainer);
    const triggerLView = deferredContainer[CONTAINER_HEADER_OFFSET] ?? null;
    // We need to null check, because the placeholder might not have been rendered yet.
    if (ngDevMode && triggerLView !== null) {
        const lDetails = getLDeferBlockDetails(deferredHostLView, deferredTNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        assertEqual(renderedState, DeferBlockState.Placeholder, 'Expected a placeholder to be rendered in this defer block.');
        assertLView(triggerLView);
    }
    return triggerLView;
}
/**
 * Gets the element that a deferred block's trigger is pointing to.
 * @param triggerLView LView in which the trigger is defined.
 * @param triggerIndex Index at which the trigger element should've been rendered.
 */
export function getTriggerElement(triggerLView, triggerIndex) {
    const element = getNativeByIndex(HEADER_OFFSET + triggerIndex, triggerLView);
    ngDevMode && assertElement(element);
    return element;
}
/**
 * Registers a DOM-node based trigger.
 * @param initialLView LView in which the defer block is rendered.
 * @param tNode TNode representing the defer block.
 * @param triggerIndex Index at which to find the trigger element.
 * @param walkUpTimes Number of times to go up/down in the view hierarchy to find the trigger.
 * @param registerFn Function that will register the DOM events.
 * @param callback Callback to be invoked when the trigger receives the event that should render
 *     the deferred block.
 */
export function registerDomTrigger(initialLView, tNode, triggerIndex, walkUpTimes, registerFn, callback) {
    const injector = initialLView[INJECTOR];
    // Assumption: the `afterRender` reference should be destroyed
    // automatically so we don't need to keep track of it.
    const afterRenderRef = afterRender(() => {
        const lDetails = getLDeferBlockDetails(initialLView, tNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        // If the block was loaded before the trigger was resolved, we don't need to do anything.
        if (renderedState !== DeferBlockInternalState.Initial &&
            renderedState !== DeferBlockState.Placeholder) {
            afterRenderRef.destroy();
            return;
        }
        const triggerLView = getTriggerLView(initialLView, tNode, walkUpTimes);
        // Keep polling until we resolve the trigger's LView.
        // `afterRender` should stop automatically if the view is destroyed.
        if (!triggerLView) {
            return;
        }
        // It's possible that the trigger's view was destroyed before we resolved the trigger element.
        if (triggerLView[FLAGS] & 256 /* LViewFlags.Destroyed */) {
            afterRenderRef.destroy();
            return;
        }
        // TODO: add integration with `DeferBlockCleanupManager`.
        const element = getTriggerElement(triggerLView, triggerIndex);
        const cleanup = registerFn(element, () => {
            callback();
            removeLViewOnDestroy(triggerLView, cleanup);
            if (initialLView !== triggerLView) {
                removeLViewOnDestroy(initialLView, cleanup);
            }
            cleanup();
        }, injector);
        afterRenderRef.destroy();
        storeLViewOnDestroy(triggerLView, cleanup);
        // Since the trigger and deferred block might be in different
        // views, we have to register the callback in both locations.
        if (initialLView !== triggerLView) {
            storeLViewOnDestroy(initialLView, cleanup);
        }
    }, { injector });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX3RyaWdnZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvZG9tX3RyaWdnZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxNQUFNLEVBQVksa0JBQWtCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDM0QsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQzFELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV4RSxPQUFPLEVBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQW9CLE1BQU0sNEJBQTRCLENBQUM7QUFDN0YsT0FBTyxFQUFDLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLG1CQUFtQixFQUFFLFdBQVcsRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBQ3BILE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUUvQixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsdUJBQXVCLEVBQUUsZUFBZSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU5QywwRUFBMEU7QUFDMUUsTUFBTSxvQkFBb0IsR0FBNEI7SUFDcEQsT0FBTyxFQUFFLElBQUk7SUFDYixPQUFPLEVBQUUsSUFBSTtDQUNkLENBQUM7QUFFRixtRUFBbUU7QUFDbkUsTUFBTSxhQUFhLEdBQUcsSUFBSSxPQUFPLEVBQTRCLENBQUM7QUFFOUQseUVBQXlFO0FBQ3pFLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxPQUFPLEVBQTRC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LEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztBQUNqQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aW5qZWN0LCBJbmplY3RvciwgybXJtWRlZmluZUluamVjdGFibGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7YWZ0ZXJSZW5kZXJ9IGZyb20gJy4uL3JlbmRlcjMvYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95LCB3YWxrVXBWaWV3c30gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50LCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUnO1xuXG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRMRGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogQ29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byByZWdpc3RlciBwYXNzaXZlIGFuZCBjYXB0dXJpbmcgZXZlbnRzLiAqL1xuY29uc3QgZXZlbnRMaXN0ZW5lck9wdGlvbnM6IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zID0ge1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59O1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBob3ZlcmAgdHJpZ2dlcnMuICovXG5jb25zdCBob3ZlclRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBpbnRlcmFjdGlvbmAgdHJpZ2dlcnMuICovXG5jb25zdCBpbnRlcmFjdGlvblRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGludGVyYWN0aW9uIGV2ZW50cy4gKi9cbmNvbnN0IGludGVyYWN0aW9uRXZlbnROYW1lcyA9IFsnY2xpY2snLCAna2V5ZG93biddIGFzIGNvbnN0O1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGhvdmVyIGV2ZW50cy4gKi9cbmNvbnN0IGhvdmVyRXZlbnROYW1lcyA9IFsnbW91c2VlbnRlcicsICdmb2N1c2luJ107XG5cbi8qKiBPYmplY3Qga2VlcGluZyB0cmFjayBvZiByZWdpc3RlcmVkIGNhbGxiYWNrcyBmb3IgYSBkZWZlcnJlZCBibG9jayB0cmlnZ2VyLiAqL1xuY2xhc3MgRGVmZXJFdmVudEVudHJ5IHtcbiAgY2FsbGJhY2tzID0gbmV3IFNldDwoKSA9PiB2b2lkPigpO1xuXG4gIGxpc3RlbmVyID0gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGludGVyYWN0aW9uIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGludGVyYWN0ZWQgd2l0aC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbihcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgZW50cnkgPSBpbnRlcmFjdGlvblRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbnRyeSBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGxpc3RlbmVycy5cbiAgaWYgKCFlbnRyeSkge1xuICAgIC8vIE5vdGUgdGhhdCB1c2luZyBtYW5hZ2luZyBldmVudHMgY2VudHJhbGx5IGxpa2UgdGhpcyBsZW5kcyBpdHNlbGYgd2VsbCB0byB1c2luZyBnbG9iYWxcbiAgICAvLyBldmVudCBkZWxlZ2F0aW9uLiBJdCBjdXJyZW50bHkgZG9lcyBkZWxlZ2F0aW9uIGF0IHRoZSBlbGVtZW50IGxldmVsLCByYXRoZXIgdGhhbiB0aGVcbiAgICAvLyBkb2N1bWVudCBsZXZlbCwgYmVjYXVzZTpcbiAgICAvLyAxLiBHbG9iYWwgZGVsZWdhdGlvbiBpcyB0aGUgbW9zdCBlZmZlY3RpdmUgd2hlbiB0aGVyZSBhcmUgYSBsb3Qgb2YgZXZlbnRzIGJlaW5nIHJlZ2lzdGVyZWRcbiAgICAvLyBhdCB0aGUgc2FtZSB0aW1lLiBEZWZlcnJlZCBibG9ja3MgYXJlIHVubGlrZWx5IHRvIGJlIHVzZWQgaW4gc3VjaCBhIHdheS5cbiAgICAvLyAyLiBNYXRjaGluZyBldmVudHMgdG8gdGhlaXIgdGFyZ2V0IGlzbid0IGZyZWUuIEZvciBlYWNoIGBjbGlja2AgYW5kIGBrZXlkb3duYCBldmVudCB3ZVxuICAgIC8vIHdvdWxkIGhhdmUgbG9vayB0aHJvdWdoIGFsbCB0aGUgdHJpZ2dlcnMgYW5kIGNoZWNrIGlmIHRoZSB0YXJnZXQgZWl0aGVyIGlzIHRoZSBlbGVtZW50XG4gICAgLy8gaXRzZWxmIG9yIGl0J3MgY29udGFpbmVkIHdpdGhpbiB0aGUgZWxlbWVudC4gR2l2ZW4gdGhhdCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgYXJlIHNvbWVcbiAgICAvLyBvZiB0aGUgbW9zdCBjb21tb24gZXZlbnRzLCB0aGlzIG1heSBlbmQgdXAgaW50cm9kdWNpbmcgYSBsb3Qgb2YgcnVudGltZSBvdmVyaGVhZC5cbiAgICAvLyAzLiBXZSdyZSBzdGlsbCByZWdpc3RlcmluZyBvbmx5IHR3byBldmVudHMgcGVyIGVsZW1lbnQsIG5vIG1hdHRlciBob3cgbWFueSBkZWZlcnJlZCBibG9ja3NcbiAgICAvLyBhcmUgcmVmZXJlbmNpbmcgaXQuXG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBpbnRlcmFjdGlvblRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcblxuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGludGVyYWN0aW9uRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgaG92ZXIgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaG92ZXJlZCBvdmVyLlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvbkhvdmVyKFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGhvdmVyVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXIuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBob3ZlclRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lIHNpbmNlIGl0IGdldHNcbiAgICAvLyByZWdpc3RlcmVkIGluIGBhZnRlclJlbmRlcmAgd2hpY2ggcnVucyBvdXRzaWRlLlxuICAgIGluamVjdG9yLmdldChOZ1pvbmUpLnJ1bigoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaG92ZXJUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHZpZXdwb3J0IHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGNvbWVzIGludG8gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblZpZXdwb3J0KFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIHJldHVybiBpbmplY3Rvci5nZXQoRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKS5yZWdpc3Rlcih0cmlnZ2VyLCBjYWxsYmFjayk7XG59XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuY2xhc3MgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyIHtcbiAgLyoqIEBub2NvbGxhcHNlICovXG4gIHN0YXRpYyDJtXByb3YgPSAvKiogQHB1cmVPckJyZWFrTXlDb2RlICovIMm1ybVkZWZpbmVJbmplY3RhYmxlKHtcbiAgICB0b2tlbjogRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyLFxuICAgIHByb3ZpZGVkSW46ICdyb290JyxcbiAgICBmYWN0b3J5OiAoKSA9PiBuZXcgRGVmZXJJbnRlcnNlY3Rpb25NYW5hZ2VyKGluamVjdChOZ1pvbmUpKSxcbiAgfSk7XG5cbiAgLyoqIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAgdXNlZCB0byBvYnNlcnZlIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG4gIHByaXZhdGUgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4gIC8qKiBOdW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IG9ic2VydmVkIHdpdGggYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbiAgcHJpdmF0ZSBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPSAwO1xuXG4gIC8qKiBDdXJyZW50bHktcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuICBwcml2YXRlIHZpZXdwb3J0VHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBuZ1pvbmU6IE5nWm9uZSkge31cblxuICByZWdpc3Rlcih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgICBsZXQgZW50cnkgPSB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gICAgaWYgKCF0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyKSB7XG4gICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyID1cbiAgICAgICAgICB0aGlzLm5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIodGhpcy5pbnRlcnNlY3Rpb25DYWxsYmFjaykpO1xuICAgIH1cblxuICAgIGlmICghZW50cnkpIHtcbiAgICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgICAgdGhpcy5uZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gdGhpcy5pbnRlcnNlY3Rpb25PYnNlcnZlciEub2JzZXJ2ZSh0cmlnZ2VyKSk7XG4gICAgICB0aGlzLnZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICAgIHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzKys7XG4gICAgfVxuXG4gICAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IGEgZGlmZmVyZW50IGNsZWFudXAgY2FsbGJhY2sgZnVsbHkgcmVtb3ZlZCB0aGlzIGVsZW1lbnQgYWxyZWFkeS5cbiAgICAgIGlmICghdGhpcy52aWV3cG9ydFRyaWdnZXJzLmhhcyh0cmlnZ2VyKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGVudHJ5IS5jYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgICAgaWYgKGVudHJ5IS5jYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy51bm9ic2VydmUodHJpZ2dlcik7XG4gICAgICAgIHRoaXMudmlld3BvcnRUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgICAgIHRoaXMub2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzLS07XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLm9ic2VydmVkVmlld3BvcnRFbGVtZW50cyA9PT0gMCkge1xuICAgICAgICB0aGlzLmludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgICAgIHRoaXMuaW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBudWxsO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBwcml2YXRlIGludGVyc2VjdGlvbkNhbGxiYWNrOiBJbnRlcnNlY3Rpb25PYnNlcnZlckNhbGxiYWNrID0gZW50cmllcyA9PiB7XG4gICAgZm9yIChjb25zdCBjdXJyZW50IG9mIGVudHJpZXMpIHtcbiAgICAgIC8vIE9ubHkgaW52b2tlIHRoZSBjYWxsYmFja3MgaWYgdGhlIHNwZWNpZmljIGVsZW1lbnQgaXMgaW50ZXJzZWN0aW5nLlxuICAgICAgaWYgKGN1cnJlbnQuaXNJbnRlcnNlY3RpbmcgJiYgdGhpcy52aWV3cG9ydFRyaWdnZXJzLmhhcyhjdXJyZW50LnRhcmdldCkpIHtcbiAgICAgICAgdGhpcy5uZ1pvbmUucnVuKHRoaXMudmlld3BvcnRUcmlnZ2Vycy5nZXQoY3VycmVudC50YXJnZXQpIS5saXN0ZW5lcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJpZ2dlckxWaWV3KFxuICAgIGRlZmVycmVkSG9zdExWaWV3OiBMVmlldywgZGVmZXJyZWRUTm9kZTogVE5vZGUsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkKTogTFZpZXd8bnVsbCB7XG4gIC8vIFRoZSB0cmlnZ2VyIGlzIGluIHRoZSBzYW1lIHZpZXcsIHdlIGRvbid0IG5lZWQgdG8gdHJhdmVyc2UuXG4gIGlmICh3YWxrVXBUaW1lcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZmVycmVkSG9zdExWaWV3O1xuICB9XG5cbiAgLy8gQSBwb3NpdGl2ZSB2YWx1ZSBvciB6ZXJvIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gYSBwYXJlbnQgdmlldy5cbiAgaWYgKHdhbGtVcFRpbWVzID49IDApIHtcbiAgICByZXR1cm4gd2Fsa1VwVmlld3Mod2Fsa1VwVGltZXMsIGRlZmVycmVkSG9zdExWaWV3KTtcbiAgfVxuXG4gIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSwgaXQgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbnNpZGUgdGhlIHBsYWNlaG9sZGVyLlxuICBjb25zdCBkZWZlcnJlZENvbnRhaW5lciA9IGRlZmVycmVkSG9zdExWaWV3W2RlZmVycmVkVE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWZlcnJlZENvbnRhaW5lcik7XG4gIGNvbnN0IHRyaWdnZXJMVmlldyA9IGRlZmVycmVkQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXSA/PyBudWxsO1xuXG4gIC8vIFdlIG5lZWQgdG8gbnVsbCBjaGVjaywgYmVjYXVzZSB0aGUgcGxhY2Vob2xkZXIgbWlnaHQgbm90IGhhdmUgYmVlbiByZW5kZXJlZCB5ZXQuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdHJpZ2dlckxWaWV3ICE9PSBudWxsKSB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoZGVmZXJyZWRIb3N0TFZpZXcsIGRlZmVycmVkVE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHJlbmRlcmVkU3RhdGUsIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcixcbiAgICAgICAgJ0V4cGVjdGVkIGEgcGxhY2Vob2xkZXIgdG8gYmUgcmVuZGVyZWQgaW4gdGhpcyBkZWZlciBibG9jay4nKTtcbiAgICBhc3NlcnRMVmlldyh0cmlnZ2VyTFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHRyaWdnZXJMVmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbGVtZW50IHRoYXQgYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcG9pbnRpbmcgdG8uXG4gKiBAcGFyYW0gdHJpZ2dlckxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSB0cmlnZ2VyIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSB0cmlnZ2VyIGVsZW1lbnQgc2hvdWxkJ3ZlIGJlZW4gcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGluaXRpYWxMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgdHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGluamVjdG9yID0gaW5pdGlhbExWaWV3W0lOSkVDVE9SXSE7XG5cbiAgLy8gQXNzdW1wdGlvbjogdGhlIGBhZnRlclJlbmRlcmAgcmVmZXJlbmNlIHNob3VsZCBiZSBkZXN0cm95ZWRcbiAgLy8gYXV0b21hdGljYWxseSBzbyB3ZSBkb24ndCBuZWVkIHRvIGtlZXAgdHJhY2sgb2YgaXQuXG4gIGNvbnN0IGFmdGVyUmVuZGVyUmVmID0gYWZ0ZXJSZW5kZXIoKCkgPT4ge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGluaXRpYWxMVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgICAvLyBJZiB0aGUgYmxvY2sgd2FzIGxvYWRlZCBiZWZvcmUgdGhlIHRyaWdnZXIgd2FzIHJlc29sdmVkLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nLlxuICAgIGlmIChyZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICAgIHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaWdnZXJMVmlldyA9IGdldFRyaWdnZXJMVmlldyhpbml0aWFsTFZpZXcsIHROb2RlLCB3YWxrVXBUaW1lcyk7XG5cbiAgICAvLyBLZWVwIHBvbGxpbmcgdW50aWwgd2UgcmVzb2x2ZSB0aGUgdHJpZ2dlcidzIExWaWV3LlxuICAgIC8vIGBhZnRlclJlbmRlcmAgc2hvdWxkIHN0b3AgYXV0b21hdGljYWxseSBpZiB0aGUgdmlldyBpcyBkZXN0cm95ZWQuXG4gICAgaWYgKCF0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBJdCdzIHBvc3NpYmxlIHRoYXQgdGhlIHRyaWdnZXIncyB2aWV3IHdhcyBkZXN0cm95ZWQgYmVmb3JlIHdlIHJlc29sdmVkIHRoZSB0cmlnZ2VyIGVsZW1lbnQuXG4gICAgaWYgKHRyaWdnZXJMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkge1xuICAgICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGFkZCBpbnRlZ3JhdGlvbiB3aXRoIGBEZWZlckJsb2NrQ2xlYW51cE1hbmFnZXJgLlxuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXcsIHRyaWdnZXJJbmRleCk7XG4gICAgY29uc3QgY2xlYW51cCA9IHJlZ2lzdGVyRm4oZWxlbWVudCwgKCkgPT4ge1xuICAgICAgY2FsbGJhY2soKTtcbiAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG4gICAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICAgIH1cbiAgICAgIGNsZWFudXAoKTtcbiAgICB9LCBpbmplY3Rvcik7XG5cbiAgICBhZnRlclJlbmRlclJlZi5kZXN0cm95KCk7XG4gICAgc3RvcmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuXG4gICAgLy8gU2luY2UgdGhlIHRyaWdnZXIgYW5kIGRlZmVycmVkIGJsb2NrIG1pZ2h0IGJlIGluIGRpZmZlcmVudFxuICAgIC8vIHZpZXdzLCB3ZSBoYXZlIHRvIHJlZ2lzdGVyIHRoZSBjYWxsYmFjayBpbiBib3RoIGxvY2F0aW9ucy5cbiAgICBpZiAoaW5pdGlhbExWaWV3ICE9PSB0cmlnZ2VyTFZpZXcpIHtcbiAgICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3koaW5pdGlhbExWaWV3LCBjbGVhbnVwKTtcbiAgICB9XG4gIH0sIHtpbmplY3Rvcn0pO1xufVxuIl19