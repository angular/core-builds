/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defaultEquals } from './equality';
import { throwInvalidWriteToSignalError } from './errors';
import { producerAccessed, producerIncrementEpoch, producerNotifyConsumers, producerUpdatesAllowed, REACTIVE_NODE, SIGNAL, } from './graph';
/**
 * If set, called after `WritableSignal`s are updated.
 *
 * This hook can be used to achieve various effects, such as running effects synchronously as part
 * of setting a signal.
 */
let postSignalSetFn = null;
/**
 * Create a `Signal` that can be set or updated directly.
 */
export function createSignal(initialValue) {
    const node = Object.create(SIGNAL_NODE);
    node.value = initialValue;
    const getter = (() => {
        producerAccessed(node);
        return node.value;
    });
    getter[SIGNAL] = node;
    return getter;
}
export function setPostSignalSetFn(fn) {
    const prev = postSignalSetFn;
    postSignalSetFn = fn;
    return prev;
}
export function signalGetFn() {
    producerAccessed(this);
    return this.value;
}
export function signalSetFn(node, newValue) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError();
    }
    if (!node.equal(node.value, newValue)) {
        node.value = newValue;
        signalValueChanged(node);
    }
}
export function signalUpdateFn(node, updater) {
    if (!producerUpdatesAllowed()) {
        throwInvalidWriteToSignalError();
    }
    signalSetFn(node, updater(node.value));
}
export function runPostSignalSetFn() {
    postSignalSetFn?.();
}
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
export const SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        equal: defaultEquals,
        value: undefined,
    };
})();
function signalValueChanged(node) {
    node.version++;
    producerIncrementEpoch();
    producerNotifyConsumers(node);
    postSignalSetFn?.();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2lnbmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMvc3JjL3NpZ25hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsYUFBYSxFQUFrQixNQUFNLFlBQVksQ0FBQztBQUMxRCxPQUFPLEVBQUMsOEJBQThCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDeEQsT0FBTyxFQUNMLGdCQUFnQixFQUNoQixzQkFBc0IsRUFDdEIsdUJBQXVCLEVBQ3ZCLHNCQUFzQixFQUN0QixhQUFhLEVBRWIsTUFBTSxHQUNQLE1BQU0sU0FBUyxDQUFDO0FBTWpCOzs7OztHQUtHO0FBQ0gsSUFBSSxlQUFlLEdBQXdCLElBQUksQ0FBQztBQWVoRDs7R0FFRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUksWUFBZTtJQUM3QyxNQUFNLElBQUksR0FBa0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN2RCxJQUFJLENBQUMsS0FBSyxHQUFHLFlBQVksQ0FBQztJQUMxQixNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsRUFBRTtRQUNuQixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQyxDQUFvQixDQUFDO0lBQ3JCLE1BQWMsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0IsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FBQyxFQUF1QjtJQUN4RCxNQUFNLElBQUksR0FBRyxlQUFlLENBQUM7SUFDN0IsZUFBZSxHQUFHLEVBQUUsQ0FBQztJQUNyQixPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVztJQUN6QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QixPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7QUFDcEIsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQUksSUFBbUIsRUFBRSxRQUFXO0lBQzdELElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7UUFDOUIsOEJBQThCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1FBQ3RCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzNCLENBQUM7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLGNBQWMsQ0FBSSxJQUFtQixFQUFFLE9BQXdCO0lBQzdFLElBQUksQ0FBQyxzQkFBc0IsRUFBRSxFQUFFLENBQUM7UUFDOUIsOEJBQThCLEVBQUUsQ0FBQztJQUNuQyxDQUFDO0lBRUQsV0FBVyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDekMsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0I7SUFDaEMsZUFBZSxFQUFFLEVBQUUsQ0FBQztBQUN0QixDQUFDO0FBRUQsa0ZBQWtGO0FBQ2xGLDJFQUEyRTtBQUMzRSw4RUFBOEU7QUFDOUUsTUFBTSxDQUFDLE1BQU0sV0FBVyxHQUF3QixlQUFlLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDcEUsT0FBTztRQUNMLEdBQUcsYUFBYTtRQUNoQixLQUFLLEVBQUUsYUFBYTtRQUNwQixLQUFLLEVBQUUsU0FBUztLQUNqQixDQUFDO0FBQ0osQ0FBQyxDQUFDLEVBQUUsQ0FBQztBQUVMLFNBQVMsa0JBQWtCLENBQUksSUFBbUI7SUFDaEQsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2Ysc0JBQXNCLEVBQUUsQ0FBQztJQUN6Qix1QkFBdUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM5QixlQUFlLEVBQUUsRUFBRSxDQUFDO0FBQ3RCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZWZhdWx0RXF1YWxzLCBWYWx1ZUVxdWFsaXR5Rm59IGZyb20gJy4vZXF1YWxpdHknO1xuaW1wb3J0IHt0aHJvd0ludmFsaWRXcml0ZVRvU2lnbmFsRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7XG4gIHByb2R1Y2VyQWNjZXNzZWQsXG4gIHByb2R1Y2VySW5jcmVtZW50RXBvY2gsXG4gIHByb2R1Y2VyTm90aWZ5Q29uc3VtZXJzLFxuICBwcm9kdWNlclVwZGF0ZXNBbGxvd2VkLFxuICBSRUFDVElWRV9OT0RFLFxuICBSZWFjdGl2ZU5vZGUsXG4gIFNJR05BTCxcbn0gZnJvbSAnLi9ncmFwaCc7XG5cbi8vIFJlcXVpcmVkIGFzIHRoZSBzaWduYWxzIGxpYnJhcnkgaXMgaW4gYSBzZXBhcmF0ZSBwYWNrYWdlLCBzbyB3ZSBuZWVkIHRvIGV4cGxpY2l0bHkgZW5zdXJlIHRoZVxuLy8gZ2xvYmFsIGBuZ0Rldk1vZGVgIHR5cGUgaXMgZGVmaW5lZC5cbmRlY2xhcmUgY29uc3QgbmdEZXZNb2RlOiBib29sZWFuIHwgdW5kZWZpbmVkO1xuXG4vKipcbiAqIElmIHNldCwgY2FsbGVkIGFmdGVyIGBXcml0YWJsZVNpZ25hbGBzIGFyZSB1cGRhdGVkLlxuICpcbiAqIFRoaXMgaG9vayBjYW4gYmUgdXNlZCB0byBhY2hpZXZlIHZhcmlvdXMgZWZmZWN0cywgc3VjaCBhcyBydW5uaW5nIGVmZmVjdHMgc3luY2hyb25vdXNseSBhcyBwYXJ0XG4gKiBvZiBzZXR0aW5nIGEgc2lnbmFsLlxuICovXG5sZXQgcG9zdFNpZ25hbFNldEZuOiAoKCkgPT4gdm9pZCkgfCBudWxsID0gbnVsbDtcblxuZXhwb3J0IGludGVyZmFjZSBTaWduYWxOb2RlPFQ+IGV4dGVuZHMgUmVhY3RpdmVOb2RlIHtcbiAgdmFsdWU6IFQ7XG4gIGVxdWFsOiBWYWx1ZUVxdWFsaXR5Rm48VD47XG59XG5cbmV4cG9ydCB0eXBlIFNpZ25hbEJhc2VHZXR0ZXI8VD4gPSAoKCkgPT4gVCkgJiB7cmVhZG9ubHkgW1NJR05BTF06IHVua25vd259O1xuXG4vLyBOb3RlOiBDbG9zdXJlICpyZXF1aXJlcyogdGhpcyB0byBiZSBhbiBgaW50ZXJmYWNlYCBhbmQgbm90IGEgdHlwZSwgd2hpY2ggaXMgd2h5IHRoZVxuLy8gYFNpZ25hbEJhc2VHZXR0ZXJgIHR5cGUgZXhpc3RzIHRvIHByb3ZpZGUgdGhlIGNvcnJlY3Qgc2hhcGUuXG5leHBvcnQgaW50ZXJmYWNlIFNpZ25hbEdldHRlcjxUPiBleHRlbmRzIFNpZ25hbEJhc2VHZXR0ZXI8VD4ge1xuICByZWFkb25seSBbU0lHTkFMXTogU2lnbmFsTm9kZTxUPjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBgU2lnbmFsYCB0aGF0IGNhbiBiZSBzZXQgb3IgdXBkYXRlZCBkaXJlY3RseS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNpZ25hbDxUPihpbml0aWFsVmFsdWU6IFQpOiBTaWduYWxHZXR0ZXI8VD4ge1xuICBjb25zdCBub2RlOiBTaWduYWxOb2RlPFQ+ID0gT2JqZWN0LmNyZWF0ZShTSUdOQUxfTk9ERSk7XG4gIG5vZGUudmFsdWUgPSBpbml0aWFsVmFsdWU7XG4gIGNvbnN0IGdldHRlciA9ICgoKSA9PiB7XG4gICAgcHJvZHVjZXJBY2Nlc3NlZChub2RlKTtcbiAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgfSkgYXMgU2lnbmFsR2V0dGVyPFQ+O1xuICAoZ2V0dGVyIGFzIGFueSlbU0lHTkFMXSA9IG5vZGU7XG4gIHJldHVybiBnZXR0ZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRQb3N0U2lnbmFsU2V0Rm4oZm46ICgoKSA9PiB2b2lkKSB8IG51bGwpOiAoKCkgPT4gdm9pZCkgfCBudWxsIHtcbiAgY29uc3QgcHJldiA9IHBvc3RTaWduYWxTZXRGbjtcbiAgcG9zdFNpZ25hbFNldEZuID0gZm47XG4gIHJldHVybiBwcmV2O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2lnbmFsR2V0Rm48VD4odGhpczogU2lnbmFsTm9kZTxUPik6IFQge1xuICBwcm9kdWNlckFjY2Vzc2VkKHRoaXMpO1xuICByZXR1cm4gdGhpcy52YWx1ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNpZ25hbFNldEZuPFQ+KG5vZGU6IFNpZ25hbE5vZGU8VD4sIG5ld1ZhbHVlOiBUKSB7XG4gIGlmICghcHJvZHVjZXJVcGRhdGVzQWxsb3dlZCgpKSB7XG4gICAgdGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCk7XG4gIH1cblxuICBpZiAoIW5vZGUuZXF1YWwobm9kZS52YWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgbm9kZS52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgIHNpZ25hbFZhbHVlQ2hhbmdlZChub2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2lnbmFsVXBkYXRlRm48VD4obm9kZTogU2lnbmFsTm9kZTxUPiwgdXBkYXRlcjogKHZhbHVlOiBUKSA9PiBUKTogdm9pZCB7XG4gIGlmICghcHJvZHVjZXJVcGRhdGVzQWxsb3dlZCgpKSB7XG4gICAgdGhyb3dJbnZhbGlkV3JpdGVUb1NpZ25hbEVycm9yKCk7XG4gIH1cblxuICBzaWduYWxTZXRGbihub2RlLCB1cGRhdGVyKG5vZGUudmFsdWUpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJ1blBvc3RTaWduYWxTZXRGbigpOiB2b2lkIHtcbiAgcG9zdFNpZ25hbFNldEZuPy4oKTtcbn1cblxuLy8gTm90ZTogVXNpbmcgYW4gSUlGRSBoZXJlIHRvIGVuc3VyZSB0aGF0IHRoZSBzcHJlYWQgYXNzaWdubWVudCBpcyBub3QgY29uc2lkZXJlZFxuLy8gYSBzaWRlLWVmZmVjdCwgZW5kaW5nIHVwIHByZXNlcnZpbmcgYENPTVBVVEVEX05PREVgIGFuZCBgUkVBQ1RJVkVfTk9ERWAuXG4vLyBUT0RPOiByZW1vdmUgd2hlbiBodHRwczovL2dpdGh1Yi5jb20vZXZhbncvZXNidWlsZC9pc3N1ZXMvMzM5MiBpcyByZXNvbHZlZC5cbmV4cG9ydCBjb25zdCBTSUdOQUxfTk9ERTogU2lnbmFsTm9kZTx1bmtub3duPiA9IC8qIEBfX1BVUkVfXyAqLyAoKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIC4uLlJFQUNUSVZFX05PREUsXG4gICAgZXF1YWw6IGRlZmF1bHRFcXVhbHMsXG4gICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgfTtcbn0pKCk7XG5cbmZ1bmN0aW9uIHNpZ25hbFZhbHVlQ2hhbmdlZDxUPihub2RlOiBTaWduYWxOb2RlPFQ+KTogdm9pZCB7XG4gIG5vZGUudmVyc2lvbisrO1xuICBwcm9kdWNlckluY3JlbWVudEVwb2NoKCk7XG4gIHByb2R1Y2VyTm90aWZ5Q29uc3VtZXJzKG5vZGUpO1xuICBwb3N0U2lnbmFsU2V0Rm4/LigpO1xufVxuIl19