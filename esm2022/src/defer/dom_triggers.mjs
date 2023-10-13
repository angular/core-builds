/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9tX3RyaWdnZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvZGVmZXIvZG9tX3RyaWdnZXJzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSwrQkFBK0IsQ0FBQztBQUMxRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsV0FBVyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDaEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFeEUsT0FBTyxFQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsUUFBUSxFQUFvQixNQUFNLDRCQUE0QixDQUFDO0FBQzdGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSw0QkFBNEIsQ0FBQztBQUNwSCxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzFELE9BQU8sRUFBQyxNQUFNLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFL0IsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHVCQUF1QixFQUFFLGVBQWUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUN6RixPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFOUMsMEVBQTBFO0FBQzFFLE1BQU0sb0JBQW9CLEdBQTRCO0lBQ3BELE9BQU8sRUFBRSxJQUFJO0lBQ2IsT0FBTyxFQUFFLElBQUk7Q0FDZCxDQUFDO0FBRUYsbUVBQW1FO0FBQ25FLE1BQU0sYUFBYSxHQUFHLElBQUksT0FBTyxFQUE0QixDQUFDO0FBRTlELHlFQUF5RTtBQUN6RSxNQUFNLG1CQUFtQixHQUFHLElBQUksT0FBTyxFQUE0QixDQUFDO0FBRXBFLGdEQUFnRDtBQUNoRCxNQUFNLGdCQUFnQixHQUFHLElBQUksT0FBTyxF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RUFBRTtnQkFDakMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzdDO1lBQ0QsT0FBTyxFQUFFLENBQUM7UUFDWixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFFYixjQUFjLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDekIsbUJBQW1CLENBQUMsWUFBWSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1FBRTNDLDZEQUE2RDtRQUM3RCw2REFBNkQ7UUFDN0QsSUFBSSxZQUFZLEtBQUssWUFBWSxFQUFFO1lBQ2pDLG1CQUFtQixDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1QztJQUNILENBQUMsRUFBRSxFQUFDLFFBQVEsRUFBQyxDQUFDLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgdHlwZSB7SW5qZWN0b3J9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7YWZ0ZXJSZW5kZXJ9IGZyb20gJy4uL3JlbmRlcjMvYWZ0ZXJfcmVuZGVyX2hvb2tzJztcbmltcG9ydCB7YXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvYXNzZXJ0JztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVR9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtUTm9kZX0gZnJvbSAnLi4vcmVuZGVyMy9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtGTEFHUywgSEVBREVSX09GRlNFVCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldE5hdGl2ZUJ5SW5kZXgsIHJlbW92ZUxWaWV3T25EZXN0cm95LCBzdG9yZUxWaWV3T25EZXN0cm95LCB3YWxrVXBWaWV3c30gZnJvbSAnLi4vcmVuZGVyMy91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHthc3NlcnRFbGVtZW50LCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtOZ1pvbmV9IGZyb20gJy4uL3pvbmUnO1xuXG5pbXBvcnQge0RFRkVSX0JMT0NLX1NUQVRFLCBEZWZlckJsb2NrSW50ZXJuYWxTdGF0ZSwgRGVmZXJCbG9ja1N0YXRlfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtnZXRMRGVmZXJCbG9ja0RldGFpbHN9IGZyb20gJy4vdXRpbHMnO1xuXG4vKiogQ29uZmlndXJhdGlvbiBvYmplY3QgdXNlZCB0byByZWdpc3RlciBwYXNzaXZlIGFuZCBjYXB0dXJpbmcgZXZlbnRzLiAqL1xuY29uc3QgZXZlbnRMaXN0ZW5lck9wdGlvbnM6IEFkZEV2ZW50TGlzdGVuZXJPcHRpb25zID0ge1xuICBwYXNzaXZlOiB0cnVlLFxuICBjYXB0dXJlOiB0cnVlXG59O1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBob3ZlcmAgdHJpZ2dlcnMuICovXG5jb25zdCBob3ZlclRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogS2VlcHMgdHJhY2sgb2YgdGhlIGN1cnJlbnRseS1yZWdpc3RlcmVkIGBvbiBpbnRlcmFjdGlvbmAgdHJpZ2dlcnMuICovXG5jb25zdCBpbnRlcmFjdGlvblRyaWdnZXJzID0gbmV3IFdlYWtNYXA8RWxlbWVudCwgRGVmZXJFdmVudEVudHJ5PigpO1xuXG4vKiogQ3VycmVudGx5LXJlZ2lzdGVyZWQgYHZpZXdwb3J0YCB0cmlnZ2Vycy4gKi9cbmNvbnN0IHZpZXdwb3J0VHJpZ2dlcnMgPSBuZXcgV2Vha01hcDxFbGVtZW50LCBEZWZlckV2ZW50RW50cnk+KCk7XG5cbi8qKiBOYW1lcyBvZiB0aGUgZXZlbnRzIGNvbnNpZGVyZWQgYXMgaW50ZXJhY3Rpb24gZXZlbnRzLiAqL1xuY29uc3QgaW50ZXJhY3Rpb25FdmVudE5hbWVzID0gWydjbGljaycsICdrZXlkb3duJ10gYXMgY29uc3Q7XG5cbi8qKiBOYW1lcyBvZiB0aGUgZXZlbnRzIGNvbnNpZGVyZWQgYXMgaG92ZXIgZXZlbnRzLiAqL1xuY29uc3QgaG92ZXJFdmVudE5hbWVzID0gWydtb3VzZWVudGVyJywgJ2ZvY3VzaW4nXSBhcyBjb25zdDtcblxuLyoqIGBJbnRlcnNlY3Rpb25PYnNlcnZlcmAgdXNlZCB0byBvYnNlcnZlIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG5sZXQgaW50ZXJzZWN0aW9uT2JzZXJ2ZXI6IEludGVyc2VjdGlvbk9ic2VydmVyfG51bGwgPSBudWxsO1xuXG4vKiogTnVtYmVyIG9mIGVsZW1lbnRzIGN1cnJlbnRseSBvYnNlcnZlZCB3aXRoIGB2aWV3cG9ydGAgdHJpZ2dlcnMuICovXG5sZXQgb2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzID0gMDtcblxuLyoqIE9iamVjdCBrZWVwaW5nIHRyYWNrIG9mIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGZvciBhIGRlZmVycmVkIGJsb2NrIHRyaWdnZXIuICovXG5jbGFzcyBEZWZlckV2ZW50RW50cnkge1xuICBjYWxsYmFja3MgPSBuZXcgU2V0PFZvaWRGdW5jdGlvbj4oKTtcblxuICBsaXN0ZW5lciA9ICgpID0+IHtcbiAgICBmb3IgKGNvbnN0IGNhbGxiYWNrIG9mIHRoaXMuY2FsbGJhY2tzKSB7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhbiBpbnRlcmFjdGlvbiB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXIgRWxlbWVudCB0aGF0IGlzIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciBpcyBpbnRlcmFjdGVkIHdpdGguXG4gKiBAcGFyYW0gaW5qZWN0b3IgSW5qZWN0b3IgdGhhdCBjYW4gYmUgdXNlZCBieSB0aGUgdHJpZ2dlciB0byByZXNvbHZlIERJIHRva2Vucy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9uSW50ZXJhY3Rpb24oXG4gICAgdHJpZ2dlcjogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKTogVm9pZEZ1bmN0aW9uIHtcbiAgbGV0IGVudHJ5ID0gaW50ZXJhY3Rpb25UcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZW50cnkgZm9yIHRoaXMgZWxlbWVudCwgYWRkIHRoZSBsaXN0ZW5lcnMuXG4gIGlmICghZW50cnkpIHtcbiAgICAvLyBOb3RlIHRoYXQgbWFuYWdpbmcgZXZlbnRzIGNlbnRyYWxseSBsaWtlIHRoaXMgbGVuZHMgaXRzZWxmIHdlbGwgdG8gdXNpbmcgZ2xvYmFsXG4gICAgLy8gZXZlbnQgZGVsZWdhdGlvbi4gSXQgY3VycmVudGx5IGRvZXMgZGVsZWdhdGlvbiBhdCB0aGUgZWxlbWVudCBsZXZlbCwgcmF0aGVyIHRoYW4gdGhlXG4gICAgLy8gZG9jdW1lbnQgbGV2ZWwsIGJlY2F1c2U6XG4gICAgLy8gMS4gR2xvYmFsIGRlbGVnYXRpb24gaXMgdGhlIG1vc3QgZWZmZWN0aXZlIHdoZW4gdGhlcmUgYXJlIGEgbG90IG9mIGV2ZW50cyBiZWluZyByZWdpc3RlcmVkXG4gICAgLy8gYXQgdGhlIHNhbWUgdGltZS4gRGVmZXJyZWQgYmxvY2tzIGFyZSB1bmxpa2VseSB0byBiZSB1c2VkIGluIHN1Y2ggYSB3YXkuXG4gICAgLy8gMi4gTWF0Y2hpbmcgZXZlbnRzIHRvIHRoZWlyIHRhcmdldCBpc24ndCBmcmVlLiBGb3IgZWFjaCBgY2xpY2tgIGFuZCBga2V5ZG93bmAgZXZlbnQgd2VcbiAgICAvLyB3b3VsZCBoYXZlIGxvb2sgdGhyb3VnaCBhbGwgdGhlIHRyaWdnZXJzIGFuZCBjaGVjayBpZiB0aGUgdGFyZ2V0IGVpdGhlciBpcyB0aGUgZWxlbWVudFxuICAgIC8vIGl0c2VsZiBvciBpdCdzIGNvbnRhaW5lZCB3aXRoaW4gdGhlIGVsZW1lbnQuIEdpdmVuIHRoYXQgYGNsaWNrYCBhbmQgYGtleWRvd25gIGFyZSBzb21lXG4gICAgLy8gb2YgdGhlIG1vc3QgY29tbW9uIGV2ZW50cywgdGhpcyBtYXkgZW5kIHVwIGludHJvZHVjaW5nIGEgbG90IG9mIHJ1bnRpbWUgb3ZlcmhlYWQuXG4gICAgLy8gMy4gV2UncmUgc3RpbGwgcmVnaXN0ZXJpbmcgb25seSB0d28gZXZlbnRzIHBlciBlbGVtZW50LCBubyBtYXR0ZXIgaG93IG1hbnkgZGVmZXJyZWQgYmxvY2tzXG4gICAgLy8gYXJlIHJlZmVyZW5jaW5nIGl0LlxuICAgIGVudHJ5ID0gbmV3IERlZmVyRXZlbnRFbnRyeSgpO1xuICAgIGludGVyYWN0aW9uVHJpZ2dlcnMuc2V0KHRyaWdnZXIsIGVudHJ5KTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBoYW5kbGVyIHJ1bnMgaW4gdGhlIE5nWm9uZSBzaW5jZSBpdCBnZXRzXG4gICAgLy8gcmVnaXN0ZXJlZCBpbiBgYWZ0ZXJSZW5kZXJgIHdoaWNoIHJ1bnMgb3V0c2lkZS5cbiAgICBpbmplY3Rvci5nZXQoTmdab25lKS5ydW4oKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGludGVyYWN0aW9uRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkhLmxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IHtjYWxsYmFja3MsIGxpc3RlbmVyfSA9IGVudHJ5ITtcbiAgICBjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChjYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgaW50ZXJhY3Rpb25UcmlnZ2Vycy5kZWxldGUodHJpZ2dlcik7XG5cbiAgICAgIGZvciAoY29uc3QgbmFtZSBvZiBpbnRlcmFjdGlvbkV2ZW50TmFtZXMpIHtcbiAgICAgICAgdHJpZ2dlci5yZW1vdmVFdmVudExpc3RlbmVyKG5hbWUsIGxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIGhvdmVyIHRyaWdnZXIuXG4gKiBAcGFyYW0gdHJpZ2dlciBFbGVtZW50IHRoYXQgaXMgdGhlIHRyaWdnZXIuXG4gKiBAcGFyYW0gY2FsbGJhY2sgQ2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aGVuIHRoZSB0cmlnZ2VyIGlzIGhvdmVyZWQgb3Zlci5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25Ib3ZlcihcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBsZXQgZW50cnkgPSBob3ZlclRyaWdnZXJzLmdldCh0cmlnZ2VyKTtcblxuICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBlbnRyeSBmb3IgdGhpcyBlbGVtZW50LCBhZGQgdGhlIGxpc3RlbmVyLlxuICBpZiAoIWVudHJ5KSB7XG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgaG92ZXJUcmlnZ2Vycy5zZXQodHJpZ2dlciwgZW50cnkpO1xuICAgIC8vIEVuc3VyZSB0aGF0IHRoZSBoYW5kbGVyIHJ1bnMgaW4gdGhlIE5nWm9uZSBzaW5jZSBpdCBnZXRzXG4gICAgLy8gcmVnaXN0ZXJlZCBpbiBgYWZ0ZXJSZW5kZXJgIHdoaWNoIHJ1bnMgb3V0c2lkZS5cbiAgICBpbmplY3Rvci5nZXQoTmdab25lKS5ydW4oKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGhvdmVyRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLmFkZEV2ZW50TGlzdGVuZXIobmFtZSwgZW50cnkhLmxpc3RlbmVyLCBldmVudExpc3RlbmVyT3B0aW9ucyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIGNvbnN0IHtjYWxsYmFja3MsIGxpc3RlbmVyfSA9IGVudHJ5ITtcbiAgICBjYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChjYWxsYmFja3Muc2l6ZSA9PT0gMCkge1xuICAgICAgZm9yIChjb25zdCBuYW1lIG9mIGhvdmVyRXZlbnROYW1lcykge1xuICAgICAgICB0cmlnZ2VyLnJlbW92ZUV2ZW50TGlzdGVuZXIobmFtZSwgbGlzdGVuZXIsIGV2ZW50TGlzdGVuZXJPcHRpb25zKTtcbiAgICAgIH1cbiAgICAgIGhvdmVyVHJpZ2dlcnMuZGVsZXRlKHRyaWdnZXIpO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSB2aWV3cG9ydCB0cmlnZ2VyLlxuICogQHBhcmFtIHRyaWdnZXIgRWxlbWVudCB0aGF0IGlzIHRoZSB0cmlnZ2VyLlxuICogQHBhcmFtIGNhbGxiYWNrIENhbGxiYWNrIHRvIGJlIGludm9rZWQgd2hlbiB0aGUgdHJpZ2dlciBjb21lcyBpbnRvIHRoZSB2aWV3cG9ydC5cbiAqIEBwYXJhbSBpbmplY3RvciBJbmplY3RvciB0aGF0IGNhbiBiZSB1c2VkIGJ5IHRoZSB0cmlnZ2VyIHRvIHJlc29sdmUgREkgdG9rZW5zLlxuICovXG5leHBvcnQgZnVuY3Rpb24gb25WaWV3cG9ydChcbiAgICB0cmlnZ2VyOiBFbGVtZW50LCBjYWxsYmFjazogVm9pZEZ1bmN0aW9uLCBpbmplY3RvcjogSW5qZWN0b3IpOiBWb2lkRnVuY3Rpb24ge1xuICBjb25zdCBuZ1pvbmUgPSBpbmplY3Rvci5nZXQoTmdab25lKTtcbiAgbGV0IGVudHJ5ID0gdmlld3BvcnRUcmlnZ2Vycy5nZXQodHJpZ2dlcik7XG5cbiAgaW50ZXJzZWN0aW9uT2JzZXJ2ZXIgPSBpbnRlcnNlY3Rpb25PYnNlcnZlciB8fCBuZ1pvbmUucnVuT3V0c2lkZUFuZ3VsYXIoKCkgPT4ge1xuICAgIHJldHVybiBuZXcgSW50ZXJzZWN0aW9uT2JzZXJ2ZXIoZW50cmllcyA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGN1cnJlbnQgb2YgZW50cmllcykge1xuICAgICAgICAvLyBPbmx5IGludm9rZSB0aGUgY2FsbGJhY2tzIGlmIHRoZSBzcGVjaWZpYyBlbGVtZW50IGlzIGludGVyc2VjdGluZy5cbiAgICAgICAgaWYgKGN1cnJlbnQuaXNJbnRlcnNlY3RpbmcgJiYgdmlld3BvcnRUcmlnZ2Vycy5oYXMoY3VycmVudC50YXJnZXQpKSB7XG4gICAgICAgICAgbmdab25lLnJ1bih2aWV3cG9ydFRyaWdnZXJzLmdldChjdXJyZW50LnRhcmdldCkhLmxpc3RlbmVyKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9KTtcblxuICBpZiAoIWVudHJ5KSB7XG4gICAgZW50cnkgPSBuZXcgRGVmZXJFdmVudEVudHJ5KCk7XG4gICAgbmdab25lLnJ1bk91dHNpZGVBbmd1bGFyKCgpID0+IGludGVyc2VjdGlvbk9ic2VydmVyIS5vYnNlcnZlKHRyaWdnZXIpKTtcbiAgICB2aWV3cG9ydFRyaWdnZXJzLnNldCh0cmlnZ2VyLCBlbnRyeSk7XG4gICAgb2JzZXJ2ZWRWaWV3cG9ydEVsZW1lbnRzKys7XG4gIH1cblxuICBlbnRyeS5jYWxsYmFja3MuYWRkKGNhbGxiYWNrKTtcblxuICByZXR1cm4gKCkgPT4ge1xuICAgIC8vIEl0J3MgcG9zc2libGUgdGhhdCBhIGRpZmZlcmVudCBjbGVhbnVwIGNhbGxiYWNrIGZ1bGx5IHJlbW92ZWQgdGhpcyBlbGVtZW50IGFscmVhZHkuXG4gICAgaWYgKCF2aWV3cG9ydFRyaWdnZXJzLmhhcyh0cmlnZ2VyKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGVudHJ5IS5jYWxsYmFja3MuZGVsZXRlKGNhbGxiYWNrKTtcblxuICAgIGlmIChlbnRyeSEuY2FsbGJhY2tzLnNpemUgPT09IDApIHtcbiAgICAgIGludGVyc2VjdGlvbk9ic2VydmVyPy51bm9ic2VydmUodHJpZ2dlcik7XG4gICAgICB2aWV3cG9ydFRyaWdnZXJzLmRlbGV0ZSh0cmlnZ2VyKTtcbiAgICAgIG9ic2VydmVkVmlld3BvcnRFbGVtZW50cy0tO1xuICAgIH1cblxuICAgIGlmIChvYnNlcnZlZFZpZXdwb3J0RWxlbWVudHMgPT09IDApIHtcbiAgICAgIGludGVyc2VjdGlvbk9ic2VydmVyPy5kaXNjb25uZWN0KCk7XG4gICAgICBpbnRlcnNlY3Rpb25PYnNlcnZlciA9IG51bGw7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBnZXQgdGhlIExWaWV3IGluIHdoaWNoIGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIGRlZmVycmVkSG9zdExWaWV3IExWaWV3IGluIHdoaWNoIHRoZSBkZWZlcnJlZCBibG9jayBpcyBkZWZpbmVkLlxuICogQHBhcmFtIGRlZmVycmVkVE5vZGUgVE5vZGUgZGVmaW5pbmcgdGhlIGRlZmVycmVkIGJsb2NrLlxuICogQHBhcmFtIHdhbGtVcFRpbWVzIE51bWJlciBvZiB0aW1lcyB0byBnbyB1cCBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlcidzIHZpZXcuXG4gKiAgIEEgbmVnYXRpdmUgdmFsdWUgbWVhbnMgdGhhdCB0aGUgdHJpZ2dlciBpcyBpbnNpZGUgdGhlIGJsb2NrJ3MgcGxhY2Vob2xkZXIsIHdoaWxlIGFuIHVuZGVmaW5lZFxuICogICB2YWx1ZSBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIHRoZSBzYW1lIExWaWV3IGFzIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRyaWdnZXJMVmlldyhcbiAgICBkZWZlcnJlZEhvc3RMVmlldzogTFZpZXcsIGRlZmVycmVkVE5vZGU6IFROb2RlLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCk6IExWaWV3fG51bGwge1xuICAvLyBUaGUgdHJpZ2dlciBpcyBpbiB0aGUgc2FtZSB2aWV3LCB3ZSBkb24ndCBuZWVkIHRvIHRyYXZlcnNlLlxuICBpZiAod2Fsa1VwVGltZXMgPT0gbnVsbCkge1xuICAgIHJldHVybiBkZWZlcnJlZEhvc3RMVmlldztcbiAgfVxuXG4gIC8vIEEgcG9zaXRpdmUgdmFsdWUgb3IgemVybyBtZWFucyB0aGF0IHRoZSB0cmlnZ2VyIGlzIGluIGEgcGFyZW50IHZpZXcuXG4gIGlmICh3YWxrVXBUaW1lcyA+PSAwKSB7XG4gICAgcmV0dXJuIHdhbGtVcFZpZXdzKHdhbGtVcFRpbWVzLCBkZWZlcnJlZEhvc3RMVmlldyk7XG4gIH1cblxuICAvLyBJZiB0aGUgdmFsdWUgaXMgbmVnYXRpdmUsIGl0IG1lYW5zIHRoYXQgdGhlIHRyaWdnZXIgaXMgaW5zaWRlIHRoZSBwbGFjZWhvbGRlci5cbiAgY29uc3QgZGVmZXJyZWRDb250YWluZXIgPSBkZWZlcnJlZEhvc3RMVmlld1tkZWZlcnJlZFROb2RlLmluZGV4XTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoZGVmZXJyZWRDb250YWluZXIpO1xuICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBkZWZlcnJlZENvbnRhaW5lcltDT05UQUlORVJfSEVBREVSX09GRlNFVF0gPz8gbnVsbDtcblxuICAvLyBXZSBuZWVkIHRvIG51bGwgY2hlY2ssIGJlY2F1c2UgdGhlIHBsYWNlaG9sZGVyIG1pZ2h0IG5vdCBoYXZlIGJlZW4gcmVuZGVyZWQgeWV0LlxuICBpZiAobmdEZXZNb2RlICYmIHRyaWdnZXJMVmlldyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IGxEZXRhaWxzID0gZ2V0TERlZmVyQmxvY2tEZXRhaWxzKGRlZmVycmVkSG9zdExWaWV3LCBkZWZlcnJlZFROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICByZW5kZXJlZFN0YXRlLCBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIsXG4gICAgICAgICdFeHBlY3RlZCBhIHBsYWNlaG9sZGVyIHRvIGJlIHJlbmRlcmVkIGluIHRoaXMgZGVmZXIgYmxvY2suJyk7XG4gICAgYXNzZXJ0TFZpZXcodHJpZ2dlckxWaWV3KTtcbiAgfVxuXG4gIHJldHVybiB0cmlnZ2VyTFZpZXc7XG59XG5cbi8qKlxuICogR2V0cyB0aGUgZWxlbWVudCB0aGF0IGEgZGVmZXJyZWQgYmxvY2sncyB0cmlnZ2VyIGlzIHBvaW50aW5nIHRvLlxuICogQHBhcmFtIHRyaWdnZXJMVmlldyBMVmlldyBpbiB3aGljaCB0aGUgdHJpZ2dlciBpcyBkZWZpbmVkLlxuICogQHBhcmFtIHRyaWdnZXJJbmRleCBJbmRleCBhdCB3aGljaCB0aGUgdHJpZ2dlciBlbGVtZW50IHNob3VsZCd2ZSBiZWVuIHJlbmRlcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3OiBMVmlldywgdHJpZ2dlckluZGV4OiBudW1iZXIpOiBFbGVtZW50IHtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoSEVBREVSX09GRlNFVCArIHRyaWdnZXJJbmRleCwgdHJpZ2dlckxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVsZW1lbnQoZWxlbWVudCk7XG4gIHJldHVybiBlbGVtZW50IGFzIEVsZW1lbnQ7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgRE9NLW5vZGUgYmFzZWQgdHJpZ2dlci5cbiAqIEBwYXJhbSBpbml0aWFsTFZpZXcgTFZpZXcgaW4gd2hpY2ggdGhlIGRlZmVyIGJsb2NrIGlzIHJlbmRlcmVkLlxuICogQHBhcmFtIHROb2RlIFROb2RlIHJlcHJlc2VudGluZyB0aGUgZGVmZXIgYmxvY2suXG4gKiBAcGFyYW0gdHJpZ2dlckluZGV4IEluZGV4IGF0IHdoaWNoIHRvIGZpbmQgdGhlIHRyaWdnZXIgZWxlbWVudC5cbiAqIEBwYXJhbSB3YWxrVXBUaW1lcyBOdW1iZXIgb2YgdGltZXMgdG8gZ28gdXAvZG93biBpbiB0aGUgdmlldyBoaWVyYXJjaHkgdG8gZmluZCB0aGUgdHJpZ2dlci5cbiAqIEBwYXJhbSByZWdpc3RlckZuIEZ1bmN0aW9uIHRoYXQgd2lsbCByZWdpc3RlciB0aGUgRE9NIGV2ZW50cy5cbiAqIEBwYXJhbSBjYWxsYmFjayBDYWxsYmFjayB0byBiZSBpbnZva2VkIHdoZW4gdGhlIHRyaWdnZXIgcmVjZWl2ZXMgdGhlIGV2ZW50IHRoYXQgc2hvdWxkIHJlbmRlclxuICogICAgIHRoZSBkZWZlcnJlZCBibG9jay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyRG9tVHJpZ2dlcihcbiAgICBpbml0aWFsTFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUsIHRyaWdnZXJJbmRleDogbnVtYmVyLCB3YWxrVXBUaW1lczogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICByZWdpc3RlckZuOiAoZWxlbWVudDogRWxlbWVudCwgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbiwgaW5qZWN0b3I6IEluamVjdG9yKSA9PiBWb2lkRnVuY3Rpb24sXG4gICAgY2FsbGJhY2s6IFZvaWRGdW5jdGlvbikge1xuICBjb25zdCBpbmplY3RvciA9IGluaXRpYWxMVmlld1tJTkpFQ1RPUl0hO1xuXG4gIC8vIEFzc3VtcHRpb246IHRoZSBgYWZ0ZXJSZW5kZXJgIHJlZmVyZW5jZSBzaG91bGQgYmUgZGVzdHJveWVkXG4gIC8vIGF1dG9tYXRpY2FsbHkgc28gd2UgZG9uJ3QgbmVlZCB0byBrZWVwIHRyYWNrIG9mIGl0LlxuICBjb25zdCBhZnRlclJlbmRlclJlZiA9IGFmdGVyUmVuZGVyKCgpID0+IHtcbiAgICBjb25zdCBsRGV0YWlscyA9IGdldExEZWZlckJsb2NrRGV0YWlscyhpbml0aWFsTFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCByZW5kZXJlZFN0YXRlID0gbERldGFpbHNbREVGRVJfQkxPQ0tfU1RBVEVdO1xuXG4gICAgLy8gSWYgdGhlIGJsb2NrIHdhcyBsb2FkZWQgYmVmb3JlIHRoZSB0cmlnZ2VyIHdhcyByZXNvbHZlZCwgd2UgZG9uJ3QgbmVlZCB0byBkbyBhbnl0aGluZy5cbiAgICBpZiAocmVuZGVyZWRTdGF0ZSAhPT0gRGVmZXJCbG9ja0ludGVybmFsU3RhdGUuSW5pdGlhbCAmJlxuICAgICAgICByZW5kZXJlZFN0YXRlICE9PSBEZWZlckJsb2NrU3RhdGUuUGxhY2Vob2xkZXIpIHtcbiAgICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmlnZ2VyTFZpZXcgPSBnZXRUcmlnZ2VyTFZpZXcoaW5pdGlhbExWaWV3LCB0Tm9kZSwgd2Fsa1VwVGltZXMpO1xuXG4gICAgLy8gS2VlcCBwb2xsaW5nIHVudGlsIHdlIHJlc29sdmUgdGhlIHRyaWdnZXIncyBMVmlldy5cbiAgICAvLyBgYWZ0ZXJSZW5kZXJgIHNob3VsZCBzdG9wIGF1dG9tYXRpY2FsbHkgaWYgdGhlIHZpZXcgaXMgZGVzdHJveWVkLlxuICAgIGlmICghdHJpZ2dlckxWaWV3KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gSXQncyBwb3NzaWJsZSB0aGF0IHRoZSB0cmlnZ2VyJ3MgdmlldyB3YXMgZGVzdHJveWVkIGJlZm9yZSB3ZSByZXNvbHZlZCB0aGUgdHJpZ2dlciBlbGVtZW50LlxuICAgIGlmICh0cmlnZ2VyTFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpIHtcbiAgICAgIGFmdGVyUmVuZGVyUmVmLmRlc3Ryb3koKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBhZGQgaW50ZWdyYXRpb24gd2l0aCBgRGVmZXJCbG9ja0NsZWFudXBNYW5hZ2VyYC5cbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0VHJpZ2dlckVsZW1lbnQodHJpZ2dlckxWaWV3LCB0cmlnZ2VySW5kZXgpO1xuICAgIGNvbnN0IGNsZWFudXAgPSByZWdpc3RlckZuKGVsZW1lbnQsICgpID0+IHtcbiAgICAgIGNhbGxiYWNrKCk7XG4gICAgICByZW1vdmVMVmlld09uRGVzdHJveSh0cmlnZ2VyTFZpZXcsIGNsZWFudXApO1xuICAgICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICAgIHJlbW92ZUxWaWV3T25EZXN0cm95KGluaXRpYWxMVmlldywgY2xlYW51cCk7XG4gICAgICB9XG4gICAgICBjbGVhbnVwKCk7XG4gICAgfSwgaW5qZWN0b3IpO1xuXG4gICAgYWZ0ZXJSZW5kZXJSZWYuZGVzdHJveSgpO1xuICAgIHN0b3JlTFZpZXdPbkRlc3Ryb3kodHJpZ2dlckxWaWV3LCBjbGVhbnVwKTtcblxuICAgIC8vIFNpbmNlIHRoZSB0cmlnZ2VyIGFuZCBkZWZlcnJlZCBibG9jayBtaWdodCBiZSBpbiBkaWZmZXJlbnRcbiAgICAvLyB2aWV3cywgd2UgaGF2ZSB0byByZWdpc3RlciB0aGUgY2FsbGJhY2sgaW4gYm90aCBsb2NhdGlvbnMuXG4gICAgaWYgKGluaXRpYWxMVmlldyAhPT0gdHJpZ2dlckxWaWV3KSB7XG4gICAgICBzdG9yZUxWaWV3T25EZXN0cm95KGluaXRpYWxMVmlldywgY2xlYW51cCk7XG4gICAgfVxuICB9LCB7aW5qZWN0b3J9KTtcbn1cbiJdfQ==