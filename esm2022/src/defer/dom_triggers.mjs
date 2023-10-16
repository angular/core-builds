/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { internalAfterNextRender } from '../render3/after_render_hooks';
import { assertLContainer, assertLView } from '../render3/assert';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isDestroyed } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, INJECTOR } from '../render3/interfaces/view';
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
/** Currently-registered `viewport` triggers. */
const viewportTriggers = new WeakMap();
/** Names of the events considered as interaction events. */
const interactionEventNames = ['click', 'keydown'];
/** Names of the events considered as hover events. */
const hoverEventNames = ['mouseenter', 'focusin'];
/** `IntersectionObserver` used to observe `viewport` triggers. */
let intersectionObserver = null;
/** Number of elements currently observed with `viewport` triggers. */
let observedViewportElements = 0;
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
        // Note that managing events centrally like this lends itself well to using global
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
        // Ensure that the handler runs in the NgZone
        ngDevMode && NgZone.assertInAngularZone();
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
 * @param injector Injector that can be used by the trigger to resolve DI tokens.
 */
export function onHover(trigger, callback, injector) {
    let entry = hoverTriggers.get(trigger);
    // If this is the first entry for this element, add the listener.
    if (!entry) {
        entry = new DeferEventEntry();
        hoverTriggers.set(trigger, entry);
        // Ensure that the handler runs in the NgZone
        ngDevMode && NgZone.assertInAngularZone();
        for (const name of hoverEventNames) {
            trigger.addEventListener(name, entry.listener, eventListenerOptions);
        }
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
    const ngZone = injector.get(NgZone);
    let entry = viewportTriggers.get(trigger);
    intersectionObserver = intersectionObserver || ngZone.runOutsideAngular(() => {
        return new IntersectionObserver(entries => {
            for (const current of entries) {
                // Only invoke the callbacks if the specific element is intersecting.
                if (current.isIntersecting && viewportTriggers.has(current.target)) {
                    ngZone.run(viewportTriggers.get(current.target).listener);
                }
            }
        });
    });
    if (!entry) {
        entry = new DeferEventEntry();
        ngZone.runOutsideAngular(() => intersectionObserver.observe(trigger));
        viewportTriggers.set(trigger, entry);
        observedViewportElements++;
    }
    entry.callbacks.add(callback);
    return () => {
        // It's possible that a different cleanup callback fully removed this element already.
        if (!viewportTriggers.has(trigger)) {
            return;
        }
        entry.callbacks.delete(callback);
        if (entry.callbacks.size === 0) {
            intersectionObserver?.unobserve(trigger);
            viewportTriggers.delete(trigger);
            observedViewportElements--;
        }
        if (observedViewportElements === 0) {
            intersectionObserver?.disconnect();
            intersectionObserver = null;
        }
    };
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
    function pollDomTrigger() {
        // If the initial view was destroyed, we don't need to do anything.
        if (isDestroyed(initialLView)) {
            return;
        }
        const lDetails = getLDeferBlockDetails(initialLView, tNode);
        const renderedState = lDetails[DEFER_BLOCK_STATE];
        // If the block was loaded before the trigger was resolved, we don't need to do anything.
        if (renderedState !== DeferBlockInternalState.Initial &&
            renderedState !== DeferBlockState.Placeholder) {
            return;
        }
        const triggerLView = getTriggerLView(initialLView, tNode, walkUpTimes);
        // Keep polling until we resolve the trigger's LView.
        if (!triggerLView) {
            internalAfterNextRender(pollDomTrigger, { injector });
            return;
        }
        // It's possible that the trigger's view was destroyed before we resolved the trigger element.
        if (isDestroyed(triggerLView)) {
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
        storeLViewOnDestroy(triggerLView, cleanup);
        // Since the trigger and deferred block might be in different
        // views, we have to register the callback in both locations.
        if (initialLView !== triggerLView) {
            storeLViewOnDestroy(initialLView, cleanup);
        }
    }
    // Begin polling for the trigger.
    internalAfterNextRender(pollDomTrigger, { injector });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX3RyaWdnZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvZG9tX3RyaWdnZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyx1QkFBdUIsRUFBQyxNQUFNLCtCQUErQixDQUFDO0FBQ3RFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNoRSxPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUV4RSxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sbUNBQW1DLENBQUM7QUFDOUQsT0FBTyxFQUFDLGFBQWEsRUFBRSxRQUFRLEVBQVEsTUFBTSw0QkFBNEIsQ0FBQztBQUMxRSxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUUsbUJBQW1CLEVBQUUsV0FBVyxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDcEgsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRS9CLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx1QkFBdUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDekYsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTlDLDBFQUEwRTtBQUMxRSxNQUFNLG9CQUFvQixHQUE0QjtJQUNwRCxPQUFPLEVBQUUsSUFBSTtJQUNiLE9BQU8sRUFBRSxJQUFJO0NBQ2QsQ0FBQztBQUVGLG1FQUFtRTtBQUNuRSxNQUFNLGFBQWEsR0FBRyxJQUFJLE9BQU8sRUFBNEIsQ0FBQztBQUU5RCx5RUFBeUU7QUFDekUsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLE9BQU8sRUFBNEIsQ0FBQztBQUVwRSxnREFBZ0Q7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QUFFLFFBQVEsQ0FBQyxDQUFDO1FBRWIsbUJBQW1CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLDZEQUE2RDtRQUM3RCw2REFBNkQ7UUFDN0QsSUFBSSxZQUFZLEtBQUssWUFBWSxFQUFFO1lBQ2pDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1QztJQUNILENBQUM7SUFFRCxpQ0FBaUM7SUFDakMsdUJBQXVCLENBQUMsY0FBYyxFQUFFLEVBQUMsUUFBUSxFQUFDLENBQUMsQ0FBQztBQUN0RCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyohXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB0eXBlIHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcn0gZnJvbSAnLi4vcmVuZGVyMy9hZnRlcl9yZW5kZXJfaG9va3MnO1xuaW1wb3J0IHthc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9hc3NlcnQnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVH0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge1ROb2RlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzRGVzdHJveWVkfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtIRUFERVJfT0ZGU0VULCBJTkpFQ1RPUiwgTFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Z2V0TmF0aXZlQnlJbmRleCwgcmVtb3ZlTFZpZXdPbkRlc3Ryb3ksIHN0b3JlTFZpZXdPbkRlc3Ryb3ksIHdhbGtVcFZpZXdzfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydEVsZW1lbnQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5cbmltcG9ydCB7REVGRVJfQkxPQ0tfU1RBVEUsIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLCBEZWZlckJsb2NrU3RhdGV9IGZyb20gJy4vaW50ZXJmYWNlcyc7XG5pbXBvcnQge2dldExEZWZlckJsb2NrRGV0YWlsc30gZnJvbSAnLi91dGlscyc7XG5cbi8qKiBDb25maWd1cmF0aW9uIG9iamVjdCB1c2VkIHRvIHJlZ2lzdGVyIHBhc3NpdmUgYW5kIGNhcHR1cmluZyBldmVudHMuICovXG5jb25zdCBldmVudExpc3RlbmVyT3B0aW9uczogQWRkRXZlbnRMaXN0ZW5lck9wdGlvbnMgPSB7XG4gIHBhc3NpdmU6IHRydWUsXG4gIGNhcHR1cmU6IHRydWVcbn07XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGhvdmVyYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGhvdmVyVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBLZWVwcyB0cmFjayBvZiB0aGUgY3VycmVudGx5LXJlZ2lzdGVyZWQgYG9uIGludGVyYWN0aW9uYCB0cmlnZ2Vycy4gKi9cbmNvbnN0IGludGVyYWN0aW9uVHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBDdXJyZW50bHktcmVnaXN0ZXJlZCBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xuY29uc3Qgdmlld3BvcnRUcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIE5hbWVzIG9mIHRoZSBldmVudHMgY29uc2lkZXJlZCBhcyBpbnRlcmFjdGlvbiBldmVudHMuICovXG5jb25zdCBpbnRlcmFjdGlvbkV2ZW50TmFtZXMgPSBbJ2NsaWNrJywgJ2tleWRvd24nXSBhcyBjb25zdDtcblxuLyoqIE5hbWVzIG9mIHRoZSBldmVudHMgY29uc2lkZXJlZCBhcyBob3ZlciBldmVudHMuICovXG5jb25zdCBob3ZlckV2ZW50TmFtZXMgPSBbJ21vdXNlZW50ZXInLCAnZm9jdXNpbiddIGFzIGNvbnN0O1xuXG4vKiogYEludGVyc2VjdGlvbk9ic2VydmVyYCB1c2VkIHRvIG9ic2VydmUgYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbmxldCBpbnRlcnNlY3Rpb25PYnNlcnZlcjogSW50ZXJzZWN0aW9uT2JzZXJ2ZXJ8bnVsbCA9IG51bGw7XG5cbi8qKiBOdW1iZXIgb2YgZWxlbWVudHMgY3VycmVudGx5IG9ic2VydmVkIHdpdGggYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbmxldCBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPSAwO1xuXG4vKiogT2JqZWN0IGtlZXBpbmcgdHJhY2sgb2YgcmVnaXN0ZXJlZCBjYWxsYmFja3MgZm9yIGEgZGVmZXJyZWQgYmxvY2sgdHJpZ2dlci4gKi9cbmNsYXNzIERlZmVyRXZlbnRFbnRyeSB7XG4gIGNhbGxiYWNrcyA9IG5ldyBTZXQ8Vm9pZEZ1bmN0aW9uPigpO1xuXG4gIGxpc3RlbmVyID0gKCkgPT4ge1xuICAgIGZvciAoY29uc3QgY2FsbGJhY2sgb2YgdGhpcy5jYWxsYmFja3MpIHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGFuIGludGVyYWN0aW9uIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGludGVyYWN0ZWQgd2l0aC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbihcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgZW50cnkgPSBpbnRlcmFjdGlvblRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbnRyeSBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGxpc3RlbmVycy5cbiAgaWYgKCFlbnRyeSkge1xuICAgIC8vIE5vdGUgdGhhdCBtYW5hZ2luZyBldmVudHMgY2VudHJhbGx5IGxpa2UgdGhpcyBsZW5kcyBpdHNlbGYgd2VsbCB0byB1c2luZyBnbG9iYWxcbiAgICAvLyBldmVudCBkZWxlZ2F0aW9uLiBJdCBjdXJyZW50bHkgZG9lcyBkZWxlZ2F0aW9uIGF0IHRoZSBlbGVtZW50IGxldmVsLCByYXRoZXIgdGhhbiB0aGVcbiAgICAvLyBkb2N1bWVudCBsZXZlbCwgYmVjYXVzZTpcbiAgICAvLyAxLiBHbG9iYWwgZGVsZWdhdGlvbiBpcyB0aGUgbW9zdCBlZmZlY3RpdmUgd2hlbiB0aGVyZSBhcmUgYSBsb3Qgb2YgZXZlbnRzIGJlaW5nIHJlZ2lzdGVyZWRcbiAgICAvLyBhdCB0aGUgc2FtZSB0aW1lLiBEZWZlcnJlZCBibG9ja3MgYXJlIHVubGlrZWx5IHRvIGJlIHVzZWQgaW4gc3VjaCBhIHdheS5cbiAgICAvLyAyLiBNYXRjaGluZyBldmVudHMgdG8gdGhlaXIgdGFyZ2V0IGlzbid0IGZyZWUuIEZvciBlYWNoIGBjbGlja2AgYW5kIGBrZXlkb3duYCBldmVudCB3ZVxuICAgIC8vIHdvdWxkIGhhdmUgbG9vayB0aHJvdWdoIGFsbCB0aGUgdHJpZ2dlcnMgYW5kIGNoZWNrIGlmIHRoZSB0YXJnZXQgZWl0aGVyIGlzIHRoZSBlbGVtZW50XG4gICAgLy8gaXRzZWxmIG9yIGl0J3MgY29udGFpbmVkIHdpdGhpbiB0aGUgZWxlbWVudC4gR2l2ZW4gdGhhdCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgYXJlIHNvbWVcbiAgICAvLyBvZiB0aGUgbW9zdCBjb21tb24gZXZlbnRzLCB0aGlzIG1heSBlbmQgdXAgaW50cm9kdWNpbmcgYSBsb3Qgb2YgcnVudGltZSBvdmVyaGVhZC5cbiAgICAvLyAzLiBXZSdyZSBzdGlsbCByZWdpc3RlcmluZyBvbmx5IHR3byBldmVudHMgcGVyIGVsZW1lbnQsIG5vIG1hdHRlciBob3cgbWFueSBkZWZlcnJlZCBibG9ja3NcbiAgICAvLyBhcmUgcmVmZXJlbmNpbmcgaXQuXG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhlIGhhbmRsZXIgcnVucyBpbiB0aGUgTmdab25lXG4gICAgbmdEZXZNb2RlICYmIE5nWm9uZS5hc3NlcnRJbkFuZ3VsYXJab25lKCk7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkhLmxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCB7Y2FsbGJhY2tzLCBsaXN0ZW5lcn0gPSBlbnRyeSE7XG4gICAgY2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG5cbiAgICBpZiAoY2FsbGJhY2tzLnNpemUgPT09IDApIHtcbiAgICAgIGludGVyYWN0aW9uVHJpZ2dlcnMuZGVsZXRlKHRyaWdnZXIpO1xuXG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaW50ZXJhY3Rpb25FdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBob3ZlciB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXIgRWxlbWVudCB0aGF0IGlzIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciBpcyBob3ZlcmVkIG92ZXIuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgdHJpZ2dlciB0byByZXNvbHZlIERJIHRva2Vucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSG92ZXIoXG4gICAgdHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGVudHJ5ID0gaG92ZXJUcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZW50cnkgZm9yIHRoaXMgZWxlbWVudCwgYWRkIHRoZSBsaXN0ZW5lci5cbiAgaWYgKCFlbnRyeSkge1xuICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgIGhvdmVyVHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBoYW5kbGVyIHJ1bnMgaW4gdGhlIE5nWm9uZVxuICAgIG5nRGV2TW9kZSAmJiBOZ1pvbmUuYXNzZXJ0SW5Bbmd1bGFyWm9uZSgpO1xuXG4gICAgZm9yIChjb25zdCBuYW1lIG9mIGhvdmVyRXZlbnROYW1lcykge1xuICAgICAgdHJpZ2dlci5hZGRFdmVudExpc3RlbmVyKG5hbWUsIGVudHJ5IS5saXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgIH1cbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgY29uc3Qge2NhbGxiYWNrcywgbGlzdGVuZXJ9ID0gZW50cnkhO1xuICAgIGNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGNhbGxiYWNrcy5zaXplID09PSAwKSB7XG4gICAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICAgIHRyaWdnZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihuYW1lLCBsaXN0ZW5lciwgZXZlbnRMaXN0ZW5lck9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgaG92ZXJUcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIHZpZXdwb3J0IHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGNvbWVzIGludG8gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIGluamVjdG9yIEluamVjdG9yIHRoYXQgY2FuIGJlIHVzZWQgYnkgdGhlIHRyaWdnZXIgdG8gcmVzb2x2ZSBESSB0b2tlbnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvblZpZXdwb3J0KFxuICAgIHRyaWdnZXI6IEVsZW1lbnQsIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sIGluamVjdG9yOiBJbmplY3Rvcik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBsZXQgZW50cnkgPSB2aWV3cG9ydFRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICBpbnRlcnNlY3Rpb25PYnNlcnZlciA9IGludGVyc2VjdGlvbk9ic2VydmVyIHx8IG5nWm9uZS5ydW5PdXRzaWRlQW5ndWxhcigoKSA9PiB7XG4gICAgcmV0dXJuIG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcihlbnRyaWVzID0+IHtcbiAgICAgIGZvciAoY29uc3QgY3VycmVudCBvZiBlbnRyaWVzKSB7XG4gICAgICAgIC8vIE9ubHkgaW52b2tlIHRoZSBjYWxsYmFja3MgaWYgdGhlIHNwZWNpZmljIGVsZW1lbnQgaXMgaW50ZXJzZWN0aW5nLlxuICAgICAgICBpZiAoY3VycmVudC5pc0ludGVyc2VjdGluZyAmJiB2aWV3cG9ydFRyaWdnZXJzLmhhcyhjdXJyZW50LnRhcmdldCkpIHtcbiAgICAgICAgICBuZ1pvbmUucnVuKHZpZXdwb3J0VHJpZ2dlcnMuZ2V0KGN1cnJlbnQudGFyZ2V0KSEubGlzdGVuZXIpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gaW50ZXJzZWN0aW9uT2JzZXJ2ZXIhLm9ic2VydmUodHJpZ2dlcikpO1xuICAgIHZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMrKztcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IGEgZGlmZmVyZW50IGNsZWFudXAgY2FsbGJhY2sgZnVsbHkgcmVtb3ZlZCB0aGlzIGVsZW1lbnQgYWxyZWFkeS5cbiAgICBpZiAoIXZpZXdwb3J0VHJpZ2dlcnMuaGFzKHRyaWdnZXIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGVudHJ5IS5jYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgIHZpZXdwb3J0VHJpZ2dlcnMuZGVsZXRlKHRyaWdnZXIpO1xuICAgICAgb2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzLS07XG4gICAgfVxuXG4gICAgaWYgKG9ic2VydmVkVmlld3BvcnRFbGVtZW50cyA9PT0gMCkge1xuICAgICAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgIGludGVyc2VjdGlvbk9ic2VydmVyID0gbnVsbDtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJpZ2dlckxWaWV3KFxuICAgIGRlZmVycmVkSG9zdExWaWV3OiBMVmlldywgZGVmZXJyZWRUTm9kZTogVE5vZGUsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkKTogTFZpZXd8bnVsbCB7XG4gIC8vIFRoZSB0cmlnZ2VyIGlzIGluIHRoZSBzYW1lIHZpZXcsIHdlIGRvbid0IG5lZWQgdG8gdHJhdmVyc2UuXG4gIGlmICh3YWxrVXBUaW1lcyA9PSBudWxsKSB7XG4gICAgcmV0dXJuIGRlZmVycmVkSG9zdExWaWV3O1xuICB9XG5cbiAgLy8gQSBwb3NpdGl2ZSB2YWx1ZSBvciB6ZXJvIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gYSBwYXJlbnQgdmlldy5cbiAgaWYgKHdhbGtVcFRpbWVzID49IDApIHtcbiAgICByZXR1cm4gd2Fsa1VwVmlld3Mod2Fsa1VwVGltZXMsIGRlZmVycmVkSG9zdExWaWV3KTtcbiAgfVxuXG4gIC8vIElmIHRoZSB2YWx1ZSBpcyBuZWdhdGl2ZSwgaXQgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbnNpZGUgdGhlIHBsYWNlaG9sZGVyLlxuICBjb25zdCBkZWZlcnJlZENvbnRhaW5lciA9IGRlZmVycmVkSG9zdExWaWV3W2RlZmVycmVkVE5vZGUuaW5kZXhdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihkZWZlcnJlZENvbnRhaW5lcik7XG4gIGNvbnN0IHRyaWdnZXJMVmlldyA9IGRlZmVycmVkQ29udGFpbmVyW0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUXSA/PyBudWxsO1xuXG4gIC8vIFdlIG5lZWQgdG8gbnVsbCBjaGVjaywgYmVjYXVzZSB0aGUgcGxhY2Vob2xkZXIgbWlnaHQgbm90IGhhdmUgYmVlbiByZW5kZXJlZCB5ZXQuXG4gIGlmIChuZ0Rldk1vZGUgJiYgdHJpZ2dlckxWaWV3ICE9PSBudWxsKSB7XG4gICAgY29uc3QgbERldGFpbHMgPSBnZXRMRGVmZXJCbG9ja0RldGFpbHMoZGVmZXJyZWRIb3N0TFZpZXcsIGRlZmVycmVkVE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHJlbmRlcmVkU3RhdGUsIERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcixcbiAgICAgICAgJ0V4cGVjdGVkIGEgcGxhY2Vob2xkZXIgdG8gYmUgcmVuZGVyZWQgaW4gdGhpcyBkZWZlciBibG9jay4nKTtcbiAgICBhc3NlcnRMVmlldyh0cmlnZ2VyTFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHRyaWdnZXJMVmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbGVtZW50IHRoYXQgYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcG9pbnRpbmcgdG8uXG4gKiBAcGFyYW0gdHJpZ2dlckxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSB0cmlnZ2VyIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSB0cmlnZ2VyIGVsZW1lbnQgc2hvdWxkJ3ZlIGJlZW4gcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJEb21UcmlnZ2VyKFxuICAgIGluaXRpYWxMVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSwgdHJpZ2dlckluZGV4OiBudW1iZXIsIHdhbGtVcFRpbWVzOiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgICBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKSB7XG4gIGNvbnN0IGluamVjdG9yID0gaW5pdGlhbExWaWV3W0lOSkVDVE9SXSE7XG4gIGZ1bmN0aW9uIHBvbGxEb21UcmlnZ2VyKCkge1xuICAgIC8vIElmIHRoZSBpbml0aWFsIHZpZXcgd2FzIGRlc3Ryb3llZCwgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZy5cbiAgICBpZiAoaXNEZXN0cm95ZWQoaW5pdGlhbExWaWV3KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGluaXRpYWxMVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IHJlbmRlcmVkU3RhdGUgPSBsRGV0YWlsc1tERUZFUl9CTE9DS19TVEFURV07XG5cbiAgICAvLyBJZiB0aGUgYmxvY2sgd2FzIGxvYWRlZCBiZWZvcmUgdGhlIHRyaWdnZXIgd2FzIHJlc29sdmVkLCB3ZSBkb24ndCBuZWVkIHRvIGRvIGFueXRoaW5nLlxuICAgIGlmIChyZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICAgIHJlbmRlcmVkU3RhdGUgIT09IERlZmVyQmxvY2tTdGF0ZS5QbGFjZWhvbGRlcikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHRyaWdnZXJMVmlldyA9IGdldFRyaWdnZXJMVmlldyhpbml0aWFsTFZpZXcsIHROb2RlLCB3YWxrVXBUaW1lcyk7XG5cbiAgICAvLyBLZWVwIHBvbGxpbmcgdW50aWwgd2UgcmVzb2x2ZSB0aGUgdHJpZ2dlcidzIExWaWV3LlxuICAgIGlmICghdHJpZ2dlckxWaWV3KSB7XG4gICAgICBpbnRlcm5hbEFmdGVyTmV4dFJlbmRlcihwb2xsRG9tVHJpZ2dlciwge2luamVjdG9yfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSB0cmlnZ2VyJ3MgdmlldyB3YXMgZGVzdHJveWVkIGJlZm9yZSB3ZSByZXNvbHZlZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICAgIGlmIChpc0Rlc3Ryb3llZCh0cmlnZ2VyTFZpZXcpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gVE9ETzogYWRkIGludGVncmF0aW9uIHdpdGggYERlZmVyQmxvY2tDbGVhbnVwTWFuYWdlcmAuXG4gICAgY29uc3QgZWxlbWVudCA9IGdldFRyaWdnZXJFbGVtZW50KHRyaWdnZXJMVmlldywgdHJpZ2dlckluZGV4KTtcbiAgICBjb25zdCBjbGVhbnVwID0gcmVnaXN0ZXJGbihlbGVtZW50LCAoKSA9PiB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgICAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcbiAgICAgIGlmIChpbml0aWFsTFZpZXcgIT09IHRyaWdnZXJMVmlldykge1xuICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveShpbml0aWFsTFZpZXcsIGNsZWFudXApO1xuICAgICAgfVxuICAgICAgY2xlYW51cCgpO1xuICAgIH0sIGluamVjdG9yKTtcblxuICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcblxuICAgIC8vIFNpbmNlIHRoZSB0cmlnZ2VyIGFuZCBkZWZlcnJlZCBibG9jayBtaWdodCBiZSBpbiBkaWZmZXJlbnRcbiAgICAvLyB2aWV3cywgd2UgaGF2ZSB0byByZWdpc3RlciB0aGUgY2FsbGJhY2sgaW4gYm90aCBsb2NhdGlvbnMuXG4gICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICBzdG9yZUxWaWV3T25EZXN0cm95KGluaXRpYWxMVmlldywgY2xlYW51cCk7XG4gICAgfVxuICB9XG5cbiAgLy8gQmVnaW4gcG9sbGluZyBmb3IgdGhlIHRyaWdnZXIuXG4gIGludGVybmFsQWZ0ZXJOZXh0UmVuZGVyKHBvbGxEb21UcmlnZ2VyLCB7aW5qZWN0b3J9KTtcbn1cbiJdfQ==