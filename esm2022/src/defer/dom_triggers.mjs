/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { afterNextRender } from '../render3/after_render/hooks';
import { assertLContainer, assertLView } from '../render3/assert';
import { CONTAINER_HEADER_OFFSET } from '../render3/interfaces/container';
import { isDestroyed } from '../render3/interfaces/type_checks';
import { HEADER_OFFSET, INJECTOR } from '../render3/interfaces/view';
import { getNativeByIndex, removeLViewOnDestroy, storeLViewOnDestroy, walkUpViews, } from '../render3/util/view_utils';
import { assertElement, assertEqual } from '../util/assert';
import { NgZone } from '../zone';
import { storeTriggerCleanupFn } from './cleanup';
import { DEFER_BLOCK_STATE, DeferBlockInternalState, DeferBlockState, } from './interfaces';
import { getLDeferBlockDetails } from './utils';
/** Configuration object used to register passive and capturing events. */
const eventListenerOptions = {
    passive: true,
    capture: true,
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
 */
export function onInteraction(trigger, callback) {
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
        hoverTriggers.set(trigger, entry);
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
    intersectionObserver =
        intersectionObserver ||
            ngZone.runOutsideAngular(() => {
                return new IntersectionObserver((entries) => {
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
 * @param type Trigger type to distinguish between regular and prefetch triggers.
 */
export function registerDomTrigger(initialLView, tNode, triggerIndex, walkUpTimes, registerFn, callback, type) {
    const injector = initialLView[INJECTOR];
    const zone = injector.get(NgZone);
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
            afterNextRender({ read: pollDomTrigger }, { injector });
            return;
        }
        // It's possible that the trigger's view was destroyed before we resolved the trigger element.
        if (isDestroyed(triggerLView)) {
            return;
        }
        const element = getTriggerElement(triggerLView, triggerIndex);
        const cleanup = registerFn(element, () => {
            // `pollDomTrigger` runs outside the zone (because of `afterNextRender`) and registers its
            // listeners outside the zone, so we jump back into the zone prior to running the callback.
            zone.run(() => {
                if (initialLView !== triggerLView) {
                    removeLViewOnDestroy(triggerLView, cleanup);
                }
                callback();
            });
        }, injector);
        // The trigger and deferred block might be in different LViews.
        // For the main LView the cleanup would happen as a part of
        // `storeTriggerCleanupFn` logic. For trigger LView we register
        // a cleanup function there to remove event handlers in case an
        // LView gets destroyed before a trigger is invoked.
        if (initialLView !== triggerLView) {
            storeLViewOnDestroy(triggerLView, cleanup);
        }
        storeTriggerCleanupFn(type, lDetails, cleanup);
    }
    // Begin polling for the trigger.
    afterNextRender({ read: pollDomTrigger }, { injector });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX3RyaWdnZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvZG9tX3RyaWdnZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUU5RCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFeEUsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQzlELE9BQU8sRUFBQyxhQUFhLEVBQUUsUUFBUSxFQUFRLE1BQU0sNEJBQTRCLENBQUM7QUFDMUUsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixvQkFBb0IsRUFDcEIsbUJBQW1CLEVBQ25CLFdBQVcsR0FDWixNQUFNLDRCQUE0QixDQUFDO0FBQ3BDLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDMUQsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUMvQixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFFaEQsT0FBTyxFQUNMLGlCQUFpQixFQUNqQix1QkFBdUIsRUFDdkIsZUFBZSxHQUVoQixNQUFNLGNBQWMsQ0FBQztBQUN0QixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFOUMsMEVBQTBFO0FBQzFFLE1BQU0sb0JBQW9CLEdBQTRCO0lBQ3BELE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDO0FBRUYsbUVBQW1FO0FBQ25FLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxFQUE0QixDQUFDO0FBRTlELHlFQUF5RTtBQUN6RSxNQUFN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TUFBTSxPQUFPLEdBQUcsVUFBVSxDQUN4QixPQUFPLEVBQ1AsR0FBRyxFQUFFO1lBQ0gsMEZBQTBGO1lBQzFGLDJGQUEyRjtZQUMzRixJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRTtnQkFDWixJQUFJLFlBQVksS0FBSyxZQUFZLEVBQUUsQ0FBQztvQkFDbEMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUM5QyxDQUFDO2dCQUNELFFBQVEsRUFBRSxDQUFDO1lBQ2IsQ0FBQyxDQUFDLENBQUM7UUFDTCxDQUFDLEVBQ0QsUUFBUSxDQUNULENBQUM7UUFFRiwrREFBK0Q7UUFDL0QsMkRBQTJEO1FBQzNELCtEQUErRDtRQUMvRCwrREFBK0Q7UUFDL0Qsb0RBQW9EO1FBQ3BELElBQUksWUFBWSxLQUFLLFlBQVksRUFBRSxDQUFDO1lBQ2xDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUM3QyxDQUFDO1FBRUQscUJBQXFCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztJQUNqRCxDQUFDO0lBRUQsaUNBQWlDO0lBQ2pDLGVBQWUsQ0FBQyxFQUFDLElBQUksRUFBRSxjQUFjLEVBQUMsRUFBRSxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUM7QUFDdEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2FmdGVyTmV4dFJlbmRlcn0gZnJvbSAnLi4vcmVuZGVyMy9hZnRlcl9yZW5kZXIvaG9va3MnO1xuaW1wb3J0IHR5cGUge0luamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge2Fzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3fSBmcm9tICcuLi9yZW5kZXIzL2Fzc2VydCc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VUfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VE5vZGV9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNEZXN0cm95ZWR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0hFQURFUl9PRkZTRVQsIElOSkVDVE9SLCBMVmlld30gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtcbiAgZ2V0TmF0aXZlQnlJbmRleCxcbiAgcmVtb3ZlTFZpZXdPbkRlc3Ryb3ksXG4gIHN0b3JlTFZpZXdPbkRlc3Ryb3ksXG4gIHdhbGtVcFZpZXdzLFxufSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydEVsZW1lbnQsIGFzc2VydEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge05nWm9uZX0gZnJvbSAnLi4vem9uZSc7XG5pbXBvcnQge3N0b3JlVHJpZ2dlckNsZWFudXBGbn0gZnJvbSAnLi9jbGVhbnVwJztcblxuaW1wb3J0IHtcbiAgREVGRVJfQkxPQ0tfU1RBVEUsXG4gIERlZmVyQmxvY2tJbnRlcm5hbFN0YXRlLFxuICBEZWZlckJsb2NrU3RhdGUsXG4gIFRyaWdnZXJUeXBlLFxufSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRMRGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogQ29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byByZWdpc3RlciBwYXNzaXZlIGFuZCBjYXB0dXJpbmcgZXZlbnRzLiAqL1xuY29uc3QgZXZlbnRMaXN0ZW5lck9wdGlvbnM6IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zID0ge1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlLFxufTtcblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktcmVnaXN0ZXJlZCBgb24gaG92ZXJgIHRyaWdnZXJzLiAqL1xuY29uc3QgaG92ZXJUcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIEtlZXBzIHRyYWNrIG9mIHRoZSBjdXJyZW50bHktcmVnaXN0ZXJlZCBgb24gaW50ZXJhY3Rpb25gIHRyaWdnZXJzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25UcmlnZ2VycyA9IG5ldyBXZWFrTWFwPEVsZW1lbnQsIERlZmVyRXZlbnRFbnRyeT4oKTtcblxuLyoqIEN1cnJlbnRseS1yZWdpc3RlcmVkIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG5jb25zdCB2aWV3cG9ydFRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGludGVyYWN0aW9uIGV2ZW50cy4gKi9cbmNvbnN0IGludGVyYWN0aW9uRXZlbnROYW1lcyA9IFsnY2xpY2snLCAna2V5ZG93biddIGFzIGNvbnN0O1xuXG4vKiogTmFtZXMgb2YgdGhlIGV2ZW50cyBjb25zaWRlcmVkIGFzIGhvdmVyIGV2ZW50cy4gKi9cbmNvbnN0IGhvdmVyRXZlbnROYW1lcyA9IFsnbW91c2VlbnRlcicsICdmb2N1c2luJ10gYXMgY29uc3Q7XG5cbi8qKiBgSW50ZXJzZWN0aW9uT2JzZXJ2ZXJgIHVzZWQgdG8gb2JzZXJ2ZSBgdmlld3BvcnRgIHRyaWdnZXJzLiAqL1xubGV0IGludGVyc2VjdGlvbk9ic2VydmVyOiBJbnRlcnNlY3Rpb25PYnNlcnZlciB8IG51bGwgPSBudWxsO1xuXG4vKiogTnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBvYnNlcnZlZCB3aXRoIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG5sZXQgb2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID0gMDtcblxuLyoqIE9iamVjdCBrZWVwaW5nIHRyYWNrIG9mIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZvciBhIGRlZmVycmVkIGJsb2NrIHRyaWdnZXIuICovXG5jbGFzcyBEZWZlckV2ZW50RW50cnkge1xuICBjYWxsYmFja3MgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICBsaXN0ZW5lciA9ICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYW4gaW50ZXJhY3Rpb24gdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgaXMgaW50ZXJhY3RlZCB3aXRoLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25JbnRlcmFjdGlvbih0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGVudHJ5ID0gaW50ZXJhY3Rpb25UcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZW50cnkgZm9yIHRoaXMgZWxlbWVudCwgYWRkIHRoZSBsaXN0ZW5lcnMuXG4gIGlmICghZW50cnkpIHtcbiAgICAvLyBOb3RlIHRoYXQgbWFuYWdpbmcgZXZlbnRzIGNlbnRyYWxseSBsaWtlIHRoaXMgbGVuZHMgaXRzZWxmIHdlbGwgdG8gdXNpbmcgZ2xvYmFsXG4gICAgLy8gZXZlbnQgZGVsZWdhdGlvbi4gSXQgY3VycmVudGx5IGRvZXMgZGVsZWdhdGlvbiBhdCB0aGUgZWxlbWVudCBsZXZlbCwgcmF0aGVyIHRoYW4gdGhlXG4gICAgLy8gZG9jdW1lbnQgbGV2ZWwsIGJlY2F1c2U6XG4gICAgLy8gMS4gR2xvYmFsIGRlbGVnYXRpb24gaXMgdGhlIG1vc3QgZWZmZWN0aXZlIHdoZW4gdGhlcmUgYXJlIGEgbG90IG9mIGV2ZW50cyBiZWluZyByZWdpc3RlcmVkXG4gICAgLy8gYXQgdGhlIHNhbWUgdGltZS4gRGVmZXJyZWQgYmxvY2tzIGFyZSB1bmxpa2VseSB0byBiZSB1c2VkIGluIHN1Y2ggYSB3YXkuXG4gICAgLy8gMi4gTWF0Y2hpbmcgZXZlbnRzIHRvIHRoZWlyIHRhcmdldCBpc24ndCBmcmVlLiBGb3IgZWFjaCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgZXZlbnQgd2VcbiAgICAvLyB3b3VsZCBoYXZlIGxvb2sgdGhyb3VnaCBhbGwgdGhlIHRyaWdnZXJzIGFuZCBjaGVjayBpZiB0aGUgdGFyZ2V0IGVpdGhlciBpcyB0aGUgZWxlbWVudFxuICAgIC8vIGl0c2VsZiBvciBpdCdzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGVsZW1lbnQuIEdpdmVuIHRoYXQgYGNsaWNrYCBhbmQgYGtleWRvd25gIGFyZSBzb21lXG4gICAgLy8gb2YgdGhlIG1vc3QgY29tbW9uIGV2ZW50cywgdGhpcyBtYXkgZW5kIHVwIGludHJvZHVjaW5nIGEgbG90IG9mIHJ1bnRpbWUgb3ZlcmhlYWQuXG4gICAgLy8gMy4gV2UncmUgc3RpbGwgcmVnaXN0ZXJpbmcgb25seSB0d28gZXZlbnRzIHBlciBlbGVtZW50LCBubyBtYXR0ZXIgaG93IG1hbnkgZGVmZXJyZWQgYmxvY2tzXG4gICAgLy8gYXJlIHJlZmVyZW5jaW5nIGl0LlxuICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgIGludGVyYWN0aW9uVHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcblxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgIHRyaWdnZXIuYWRkRXZlbnRMaXN0ZW5lcihuYW1lLCBlbnRyeSEubGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICB9XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IHtjYWxsYmFja3MsIGxpc3RlbmVyfSA9IGVudHJ5ITtcbiAgICBjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChjYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG5cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGhvdmVyIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGhvdmVyZWQgb3Zlci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSG92ZXIodHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbik6IFZvaWRGdW5jdGlvbiB7XG4gIGxldCBlbnRyeSA9IGhvdmVyVHJpZ2dlcnMuZ2V0KHRyaWdnZXIpO1xuXG4gIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGVudHJ5IGZvciB0aGlzIGVsZW1lbnQsIGFkZCB0aGUgbGlzdGVuZXIuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBob3ZlclRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG5cbiAgICBmb3IgKGNvbnN0IG5hbWUgb2YgaG92ZXJFdmVudE5hbWVzKSB7XG4gICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkhLmxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgfVxuICB9XG5cbiAgZW50cnkuY2FsbGJhY2tzLmFkZChjYWxsYmFjayk7XG5cbiAgcmV0dXJuICgpID0+IHtcbiAgICBjb25zdCB7Y2FsbGJhY2tzLCBsaXN0ZW5lcn0gPSBlbnRyeSE7XG4gICAgY2FsbGJhY2tzLmRlbGV0ZShjYWxsYmFjayk7XG5cbiAgICBpZiAoY2FsbGJhY2tzLnNpemUgPT09IDApIHtcbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBob3ZlckV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgICBob3ZlclRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgdmlld3BvcnQgdHJpZ2dlci5cbiAqIEBwYXJhbSB0cmlnZ2VyIEVsZW1lbnQgdGhhdCBpcyB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgY29tZXMgaW50byB0aGUgdmlld3BvcnQuXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgdHJpZ2dlciB0byByZXNvbHZlIERJIHRva2Vucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uVmlld3BvcnQoXG4gIHRyaWdnZXI6IEVsZW1lbnQsXG4gIGNhbGxiYWNrOiBWb2lkRnVuY3Rpb24sXG4gIGluamVjdG9yOiBJbmplY3Rvcixcbik6IFZvaWRGdW5jdGlvbiB7XG4gIGNvbnN0IG5nWm9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBsZXQgZW50cnkgPSB2aWV3cG9ydFRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICBpbnRlcnNlY3Rpb25PYnNlcnZlciA9XG4gICAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXIgfHxcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgICAgcmV0dXJuIG5ldyBJbnRlcnNlY3Rpb25PYnNlcnZlcigoZW50cmllcykgPT4ge1xuICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgICAgIC8vIE9ubHkgaW52b2tlIHRoZSBjYWxsYmFja3MgaWYgdGhlIHNwZWNpZmljIGVsZW1lbnQgaXMgaW50ZXJzZWN0aW5nLlxuICAgICAgICAgIGlmIChjdXJyZW50LmlzSW50ZXJzZWN0aW5nICYmIHZpZXdwb3J0VHJpZ2dlcnMuaGFzKGN1cnJlbnQudGFyZ2V0KSkge1xuICAgICAgICAgICAgbmdab25lLnJ1bih2aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gIGlmICghZW50cnkpIHtcbiAgICBlbnRyeSA9IG5ldyBEZWZlckV2ZW50RW50cnkoKTtcbiAgICBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4gaW50ZXJzZWN0aW9uT2JzZXJ2ZXIhLm9ic2VydmUodHJpZ2dlcikpO1xuICAgIHZpZXdwb3J0VHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcbiAgICBvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMrKztcbiAgfVxuXG4gIGVudHJ5LmNhbGxiYWNrcy5hZGQoY2FsbGJhY2spO1xuXG4gIHJldHVybiAoKSA9PiB7XG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IGEgZGlmZmVyZW50IGNsZWFudXAgY2FsbGJhY2sgZnVsbHkgcmVtb3ZlZCB0aGlzIGVsZW1lbnQgYWxyZWFkeS5cbiAgICBpZiAoIXZpZXdwb3J0VHJpZ2dlcnMuaGFzKHRyaWdnZXIpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgZW50cnkhLmNhbGxiYWNrcy5kZWxldGUoY2FsbGJhY2spO1xuXG4gICAgaWYgKGVudHJ5IS5jYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LnVub2JzZXJ2ZSh0cmlnZ2VyKTtcbiAgICAgIHZpZXdwb3J0VHJpZ2dlcnMuZGVsZXRlKHRyaWdnZXIpO1xuICAgICAgb2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzLS07XG4gICAgfVxuXG4gICAgaWYgKG9ic2VydmVkVmlld3BvcnRFbGVtZW50cyA9PT0gMCkge1xuICAgICAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI/LmRpc2Nvbm5lY3QoKTtcbiAgICAgIGludGVyc2VjdGlvbk9ic2VydmVyID0gbnVsbDtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogSGVscGVyIGZ1bmN0aW9uIHRvIGdldCB0aGUgTFZpZXcgaW4gd2hpY2ggYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRIb3N0TFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVycmVkIGJsb2NrIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gZGVmZXJyZWRUTm9kZSBUTm9kZSBkZWZpbmluZyB0aGUgZGVmZXJyZWQgYmxvY2suXG4gKiBAcGFyYW0gd2Fsa1VwVGltZXMgTnVtYmVyIG9mIHRpbWVzIHRvIGdvIHVwIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyJ3Mgdmlldy5cbiAqICAgQSBuZWdhdGl2ZSB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgYmxvY2sncyBwbGFjZWhvbGRlciwgd2hpbGUgYW4gdW5kZWZpbmVkXG4gKiAgIHZhbHVlIG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgTFZpZXcgYXMgdGhlIGRlZmVycmVkIGJsb2NrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJpZ2dlckxWaWV3KFxuICBkZWZlcnJlZEhvc3RMVmlldzogTFZpZXcsXG4gIGRlZmVycmVkVE5vZGU6IFROb2RlLFxuICB3YWxrVXBUaW1lczogbnVtYmVyIHwgdW5kZWZpbmVkLFxuKTogTFZpZXcgfCBudWxsIHtcbiAgLy8gVGhlIHRyaWdnZXIgaXMgaW4gdGhlIHNhbWUgdmlldywgd2UgZG9uJ3QgbmVlZCB0byB0cmF2ZXJzZS5cbiAgaWYgKHdhbGtVcFRpbWVzID09IG51bGwpIHtcbiAgICByZXR1cm4gZGVmZXJyZWRIb3N0TFZpZXc7XG4gIH1cblxuICAvLyBBIHBvc2l0aXZlIHZhbHVlIG9yIHplcm8gbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbiBhIHBhcmVudCB2aWV3LlxuICBpZiAod2Fsa1VwVGltZXMgPj0gMCkge1xuICAgIHJldHVybiB3YWxrVXBWaWV3cyh3YWxrVXBUaW1lcywgZGVmZXJyZWRIb3N0TFZpZXcpO1xuICB9XG5cbiAgLy8gSWYgdGhlIHZhbHVlIGlzIG5lZ2F0aXZlLCBpdCBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluc2lkZSB0aGUgcGxhY2Vob2xkZXIuXG4gIGNvbnN0IGRlZmVycmVkQ29udGFpbmVyID0gZGVmZXJyZWRIb3N0TFZpZXdbZGVmZXJyZWRUTm9kZS5pbmRleF07XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGRlZmVycmVkQ29udGFpbmVyKTtcbiAgY29uc3QgdHJpZ2dlckxWaWV3ID0gZGVmZXJyZWRDb250YWluZXJbQ09OVEFJTkVSX0hFQURFUl9PRkZTRVRdID8/IG51bGw7XG5cbiAgLy8gV2UgbmVlZCB0byBudWxsIGNoZWNrLCBiZWNhdXNlIHRoZSBwbGFjZWhvbGRlciBtaWdodCBub3QgaGF2ZSBiZWVuIHJlbmRlcmVkIHlldC5cbiAgaWYgKG5nRGV2TW9kZSAmJiB0cmlnZ2VyTFZpZXcgIT09IG51bGwpIHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhkZWZlcnJlZEhvc3RMVmlldywgZGVmZXJyZWRUTm9kZSk7XG4gICAgY29uc3QgcmVuZGVyZWRTdGF0ZSA9IGxEZXRhaWxzW0RFRkVSX0JMT0NLX1NUQVRFXTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgIHJlbmRlcmVkU3RhdGUsXG4gICAgICBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsXG4gICAgICAnRXhwZWN0ZWQgYSBwbGFjZWhvbGRlciB0byBiZSByZW5kZXJlZCBpbiB0aGlzIGRlZmVyIGJsb2NrLicsXG4gICAgKTtcbiAgICBhc3NlcnRMVmlldyh0cmlnZ2VyTFZpZXcpO1xuICB9XG5cbiAgcmV0dXJuIHRyaWdnZXJMVmlldztcbn1cblxuLyoqXG4gKiBHZXRzIHRoZSBlbGVtZW50IHRoYXQgYSBkZWZlcnJlZCBibG9jaydzIHRyaWdnZXIgaXMgcG9pbnRpbmcgdG8uXG4gKiBAcGFyYW0gdHJpZ2dlckxWaWV3IExWaWV3IGluIHdoaWNoIHRoZSB0cmlnZ2VyIGlzIGRlZmluZWQuXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRoZSB0cmlnZ2VyIGVsZW1lbnQgc2hvdWxkJ3ZlIGJlZW4gcmVuZGVyZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXc6IExWaWV3LCB0cmlnZ2VySW5kZXg6IG51bWJlcik6IEVsZW1lbnQge1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChIRUFERVJfT0ZGU0VUICsgdHJpZ2dlckluZGV4LCB0cmlnZ2VyTFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RWxlbWVudChlbGVtZW50KTtcbiAgcmV0dXJuIGVsZW1lbnQgYXMgRWxlbWVudDtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBET00tbm9kZSBiYXNlZCB0cmlnZ2VyLlxuICogQHBhcmFtIGluaXRpYWxMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgZGVmZXIgYmxvY2sgaXMgcmVuZGVyZWQuXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgcmVwcmVzZW50aW5nIHRoZSBkZWZlciBibG9jay5cbiAqIEBwYXJhbSB0cmlnZ2VySW5kZXggSW5kZXggYXQgd2hpY2ggdG8gZmluZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cC9kb3duIGluIHRoZSB2aWV3IGhpZXJhcmNoeSB0byBmaW5kIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIHJlZ2lzdGVyRm4gRnVuY3Rpb24gdGhhdCB3aWxsIHJlZ2lzdGVyIHRoZSBET00gZXZlbnRzLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciByZWNlaXZlcyB0aGUgZXZlbnQgdGhhdCBzaG91bGQgcmVuZGVyXG4gKiAgICAgdGhlIGRlZmVycmVkIGJsb2NrLlxuICogQHBhcmFtIHR5cGUgVHJpZ2dlciB0eXBlIHRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gcmVndWxhciBhbmQgcHJlZmV0Y2ggdHJpZ2dlcnMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckRvbVRyaWdnZXIoXG4gIGluaXRpYWxMVmlldzogTFZpZXcsXG4gIHROb2RlOiBUTm9kZSxcbiAgdHJpZ2dlckluZGV4OiBudW1iZXIsXG4gIHdhbGtVcFRpbWVzOiBudW1iZXIgfCB1bmRlZmluZWQsXG4gIHJlZ2lzdGVyRm46IChlbGVtZW50OiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpID0+IFZvaWRGdW5jdGlvbixcbiAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbixcbiAgdHlwZTogVHJpZ2dlclR5cGUsXG4pIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBpbml0aWFsTFZpZXdbSU5KRUNUT1JdITtcbiAgY29uc3Qgem9uZSA9IGluamVjdG9yLmdldChOZ1pvbmUpO1xuICBmdW5jdGlvbiBwb2xsRG9tVHJpZ2dlcigpIHtcbiAgICAvLyBJZiB0aGUgaW5pdGlhbCB2aWV3IHdhcyBkZXN0cm95ZWQsIHdlIGRvbid0IG5lZWQgdG8gZG8gYW55dGhpbmcuXG4gICAgaWYgKGlzRGVzdHJveWVkKGluaXRpYWxMVmlldykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhpbml0aWFsTFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuXG4gICAgLy8gSWYgdGhlIGJsb2NrIHdhcyBsb2FkZWQgYmVmb3JlIHRoZSB0cmlnZ2VyIHdhcyByZXNvbHZlZCwgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZy5cbiAgICBpZiAoXG4gICAgICByZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZS5Jbml0aWFsICYmXG4gICAgICByZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXJcbiAgICApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBnZXRUcmlnZ2VyTFZpZXcoaW5pdGlhbExWaWV3LCB0Tm9kZSwgd2Fsa1VwVGltZXMpO1xuXG4gICAgLy8gS2VlcCBwb2xsaW5nIHVudGlsIHdlIHJlc29sdmUgdGhlIHRyaWdnZXIncyBMVmlldy5cbiAgICBpZiAoIXRyaWdnZXJMVmlldykge1xuICAgICAgYWZ0ZXJOZXh0UmVuZGVyKHtyZWFkOiBwb2xsRG9tVHJpZ2dlcn0sIHtpbmplY3Rvcn0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCB0aGUgdHJpZ2dlcidzIHZpZXcgd2FzIGRlc3Ryb3llZCBiZWZvcmUgd2UgcmVzb2x2ZWQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAgICBpZiAoaXNEZXN0cm95ZWQodHJpZ2dlckxWaWV3KSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXRUcmlnZ2VyRWxlbWVudCh0cmlnZ2VyTFZpZXcsIHRyaWdnZXJJbmRleCk7XG4gICAgY29uc3QgY2xlYW51cCA9IHJlZ2lzdGVyRm4oXG4gICAgICBlbGVtZW50LFxuICAgICAgKCkgPT4ge1xuICAgICAgICAvLyBgcG9sbERvbVRyaWdnZXJgIHJ1bnMgb3V0c2lkZSB0aGUgem9uZSAoYmVjYXVzZSBvZiBgYWZ0ZXJOZXh0UmVuZGVyYCkgYW5kIHJlZ2lzdGVycyBpdHNcbiAgICAgICAgLy8gbGlzdGVuZXJzIG91dHNpZGUgdGhlIHpvbmUsIHNvIHdlIGp1bXAgYmFjayBpbnRvIHRoZSB6b25lIHByaW9yIHRvIHJ1bm5pbmcgdGhlIGNhbGxiYWNrLlxuICAgICAgICB6b25lLnJ1bigoKSA9PiB7XG4gICAgICAgICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICAgICAgICByZW1vdmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9KTtcbiAgICAgIH0sXG4gICAgICBpbmplY3RvcixcbiAgICApO1xuXG4gICAgLy8gVGhlIHRyaWdnZXIgYW5kIGRlZmVycmVkIGJsb2NrIG1pZ2h0IGJlIGluIGRpZmZlcmVudCBMVmlld3MuXG4gICAgLy8gRm9yIHRoZSBtYWluIExWaWV3IHRoZSBjbGVhbnVwIHdvdWxkIGhhcHBlbiBhcyBhIHBhcnQgb2ZcbiAgICAvLyBgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuYCBsb2dpYy4gRm9yIHRyaWdnZXIgTFZpZXcgd2UgcmVnaXN0ZXJcbiAgICAvLyBhIGNsZWFudXAgZnVuY3Rpb24gdGhlcmUgdG8gcmVtb3ZlIGV2ZW50IGhhbmRsZXJzIGluIGNhc2UgYW5cbiAgICAvLyBMVmlldyBnZXRzIGRlc3Ryb3llZCBiZWZvcmUgYSB0cmlnZ2VyIGlzIGludm9rZWQuXG4gICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICBzdG9yZUxWaWV3T25EZXN0cm95KHRyaWdnZXJMVmlldywgY2xlYW51cCk7XG4gICAgfVxuXG4gICAgc3RvcmVUcmlnZ2VyQ2xlYW51cEZuKHR5cGUsIGxEZXRhaWxzLCBjbGVhbnVwKTtcbiAgfVxuXG4gIC8vIEJlZ2luIHBvbGxpbmcgZm9yIHRoZSB0cmlnZ2VyLlxuICBhZnRlck5leHRSZW5kZXIoe3JlYWQ6IHBvbGxEb21UcmlnZ2VyfSwge2luamVjdG9yfSk7XG59XG4iXX0=