/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerMarkDirty, producerAccessed, producerUpdateValueVersion, REACTIVE_NODE, SIGNAL } from '@angular/core/primitives/signals';
import { RuntimeError } from '../errors';
import { unwrapElementRef } from '../linker/element_ref';
import { EMPTY_ARRAY } from '../util/empty';
import { TVIEW } from './interfaces/view';
import { collectQueryResults, getTQuery, loadQueryInternal, materializeViewResults } from './query';
import { getLView } from './state';
function createQuerySignalFn(firstOnly, required) {
    const node = Object.create(QUERY_SIGNAL_NODE);
    function signalFn() {
        // Check if the value needs updating before returning it.
        producerUpdateValueVersion(node);
        // Mark this producer as accessed.
        producerAccessed(node);
        if (firstOnly) {
            const firstValue = node._queryList?.first;
            if (firstValue === undefined && required) {
                // TODO: add error code
                // TODO: add proper message
                throw new RuntimeError(0, 'no query results yet!');
            }
            return firstValue;
        }
        else {
            // TODO(perf): make sure that I'm not creating new arrays when returning results. The other
            // consideration here is the referential stability of results.
            return node._queryList?.toArray() ?? EMPTY_ARRAY;
        }
    }
    signalFn[SIGNAL] = node;
    if (ngDevMode) {
        signalFn.toString = () => `[Query Signal]`;
    }
    return signalFn;
}
export function createSingleResultOptionalQuerySignalFn() {
    return createQuerySignalFn(/* firstOnly */ true, /* required */ false);
}
export function createSingleResultRequiredQuerySignalFn() {
    return createQuerySignalFn(/* firstOnly */ true, /* required */ true);
}
export function createMultiResultQuerySignalFn() {
    return createQuerySignalFn(/* firstOnly */ false, /* required */ false);
}
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
export const QUERY_SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        // Base reactive node.overrides
        producerMustRecompute: (node) => {
            return !!node._queryList?.dirty;
        },
        producerRecomputeValue: (node) => {
            // The current value is stale. Check whether we need to produce a new one.
            // TODO: assert: I've got both the lView and queryIndex stored
            // TODO(perf): I'm assuming that the signal value changes when the list of matches changes.
            // But this is not correct for the single-element queries since we should also compare (===)
            // the value of the first element.
            // TODO: error handling - should we guard against exceptions thrown from refreshSignalQuery -
            // normally it should never
            if (refreshSignalQuery(node._lView, node._queryIndex)) {
                node.version++;
            }
        }
    };
})();
export function bindQueryToSignal(target, queryIndex) {
    const node = target[SIGNAL];
    node._lView = getLView();
    node._queryIndex = queryIndex;
    node._queryList = loadQueryInternal(node._lView, queryIndex);
    node._queryList.onDirty(() => {
        // Mark this producer as dirty and notify live consumer about the potential change. Note
        // that the onDirty callback will fire only on the initial dirty marking (that is,
        // subsequent dirty notifications are not fired- until the QueryList becomes clean again).
        consumerMarkDirty(node);
    });
}
// TODO(refactor): some code duplication with queryRefresh
export function refreshSignalQuery(lView, queryIndex) {
    const queryList = loadQueryInternal(lView, queryIndex);
    const tView = lView[TVIEW];
    const tQuery = getTQuery(tView, queryIndex);
    // TODO(test): operation of refreshing a signal query could be invoked during the first
    // creation pass, while results are still being collected; we should NOT mark such query as
    // "clean" as we might not have any view add / remove operations that would make it dirty again.
    // Leaning towards exiting early for calls to refreshSignalQuery before the first creation pass
    // finished
    if (queryList.dirty && tQuery.matches !== null) {
        const result = tQuery.crossesNgTemplate ?
            collectQueryResults(tView, lView, queryIndex, []) :
            materializeViewResults(tView, lView, tQuery, queryIndex);
        queryList.reset(result, unwrapElementRef);
        // TODO(test): don't mark signal as dirty when a query was marked as dirty but there
        // was no actual change
        // TODO: change the reset logic so it returns the value
        return true;
    }
    return false;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlfcmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5X3JlYWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQWdCLE1BQU0sRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRXRKLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFdkQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUxQyxPQUFPLEVBQVEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVsRyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBS2pDLFNBQVMsbUJBQW1CLENBQUksU0FBa0IsRUFBRSxRQUFpQjtJQUNuRSxNQUFNLElBQUksR0FBdUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2xFLFNBQVMsUUFBUTtRQUNmLHlEQUF5RDtRQUN6RCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyxrQ0FBa0M7UUFDbEMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkIsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1lBQzFDLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDekMsdUJBQXVCO2dCQUN2Qiwy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VSxDQUFDLENBQUM7SUFFNUMsdUZBQXVGO0lBQ3ZGLDJGQUEyRjtJQUMzRixnR0FBZ0c7SUFDaEcsK0ZBQStGO0lBQy9GLFdBQVc7SUFDWCxJQUFJLFNBQVMsQ0FBQyxLQUFLLElBQUksTUFBTSxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUUsQ0FBQztRQUMvQyxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNyQyxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDO1lBQ25ELHNCQUFzQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRTdELFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFMUMsb0ZBQW9GO1FBQ3BGLHVCQUF1QjtRQUN2Qix1REFBdUQ7UUFDdkQsT0FBTyxJQUFJLENBQUM7SUFDZCxDQUFDO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Y29uc3VtZXJNYXJrRGlydHksIHByb2R1Y2VyQWNjZXNzZWQsIHByb2R1Y2VyVXBkYXRlVmFsdWVWZXJzaW9uLCBSRUFDVElWRV9OT0RFLCBSZWFjdGl2ZU5vZGUsIFNJR05BTH0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMnO1xuXG5pbXBvcnQge1J1bnRpbWVFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7dW53cmFwRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXIvcXVlcnlfbGlzdCc7XG5pbXBvcnQge0VNUFRZX0FSUkFZfSBmcm9tICcuLi91dGlsL2VtcHR5JztcblxuaW1wb3J0IHtMVmlldywgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7Y29sbGVjdFF1ZXJ5UmVzdWx0cywgZ2V0VFF1ZXJ5LCBsb2FkUXVlcnlJbnRlcm5hbCwgbWF0ZXJpYWxpemVWaWV3UmVzdWx0c30gZnJvbSAnLi9xdWVyeSc7XG5pbXBvcnQge1NpZ25hbH0gZnJvbSAnLi9yZWFjdGl2aXR5L2FwaSc7XG5pbXBvcnQge2dldExWaWV3fSBmcm9tICcuL3N0YXRlJztcblxuZnVuY3Rpb24gY3JlYXRlUXVlcnlTaWduYWxGbjxWPihmaXJzdE9ubHk6IHRydWUsIHJlcXVpcmVkOiB0cnVlKTogU2lnbmFsPFY+O1xuZnVuY3Rpb24gY3JlYXRlUXVlcnlTaWduYWxGbjxWPihmaXJzdE9ubHk6IHRydWUsIHJlcXVpcmVkOiBmYWxzZSk6IFNpZ25hbDxWfHVuZGVmaW5lZD47XG5mdW5jdGlvbiBjcmVhdGVRdWVyeVNpZ25hbEZuPFY+KGZpcnN0T25seTogZmFsc2UsIHJlcXVpcmVkOiBmYWxzZSk6IFNpZ25hbDxSZWFkb25seUFycmF5PFY+PjtcbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5U2lnbmFsRm48Vj4oZmlyc3RPbmx5OiBib29sZWFuLCByZXF1aXJlZDogYm9vbGVhbikge1xuICBjb25zdCBub2RlOiBRdWVyeVNpZ25hbE5vZGU8Vj4gPSBPYmplY3QuY3JlYXRlKFFVRVJZX1NJR05BTF9OT0RFKTtcbiAgZnVuY3Rpb24gc2lnbmFsRm4oKSB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIG5lZWRzIHVwZGF0aW5nIGJlZm9yZSByZXR1cm5pbmcgaXQuXG4gICAgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24obm9kZSk7XG5cbiAgICAvLyBNYXJrIHRoaXMgcHJvZHVjZXIgYXMgYWNjZXNzZWQuXG4gICAgcHJvZHVjZXJBY2Nlc3NlZChub2RlKTtcblxuICAgIGlmIChmaXJzdE9ubHkpIHtcbiAgICAgIGNvbnN0IGZpcnN0VmFsdWUgPSBub2RlLl9xdWVyeUxpc3Q/LmZpcnN0O1xuICAgICAgaWYgKGZpcnN0VmFsdWUgPT09IHVuZGVmaW5lZCAmJiByZXF1aXJlZCkge1xuICAgICAgICAvLyBUT0RPOiBhZGQgZXJyb3IgY29kZVxuICAgICAgICAvLyBUT0RPOiBhZGQgcHJvcGVyIG1lc3NhZ2VcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcigwLCAnbm8gcXVlcnkgcmVzdWx0cyB5ZXQhJyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlyc3RWYWx1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVE9ETyhwZXJmKTogbWFrZSBzdXJlIHRoYXQgSSdtIG5vdCBjcmVhdGluZyBuZXcgYXJyYXlzIHdoZW4gcmV0dXJuaW5nIHJlc3VsdHMuIFRoZSBvdGhlclxuICAgICAgLy8gY29uc2lkZXJhdGlvbiBoZXJlIGlzIHRoZSByZWZlcmVudGlhbCBzdGFiaWxpdHkgb2YgcmVzdWx0cy5cbiAgICAgIHJldHVybiBub2RlLl9xdWVyeUxpc3Q/LnRvQXJyYXkoKSA/PyBFTVBUWV9BUlJBWTtcbiAgICB9XG4gIH1cbiAgKHNpZ25hbEZuIGFzIGFueSlbU0lHTkFMXSA9IG5vZGU7XG5cbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIHNpZ25hbEZuLnRvU3RyaW5nID0gKCkgPT4gYFtRdWVyeSBTaWduYWxdYDtcbiAgfVxuXG4gIHJldHVybiBzaWduYWxGbjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZVJlc3VsdE9wdGlvbmFsUXVlcnlTaWduYWxGbjxSZWFkVD4oKTogU2lnbmFsPFJlYWRUfHVuZGVmaW5lZD4ge1xuICByZXR1cm4gY3JlYXRlUXVlcnlTaWduYWxGbigvKiBmaXJzdE9ubHkgKi8gdHJ1ZSwgLyogcmVxdWlyZWQgKi8gZmFsc2UpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2luZ2xlUmVzdWx0UmVxdWlyZWRRdWVyeVNpZ25hbEZuPFJlYWRUPigpOiBTaWduYWw8UmVhZFQ+IHtcbiAgcmV0dXJuIGNyZWF0ZVF1ZXJ5U2lnbmFsRm4oLyogZmlyc3RPbmx5ICovIHRydWUsIC8qIHJlcXVpcmVkICovIHRydWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTXVsdGlSZXN1bHRRdWVyeVNpZ25hbEZuPFJlYWRUPigpOiBTaWduYWw8UmVhZG9ubHlBcnJheTxSZWFkVD4+IHtcbiAgcmV0dXJuIGNyZWF0ZVF1ZXJ5U2lnbmFsRm4oLyogZmlyc3RPbmx5ICovIGZhbHNlLCAvKiByZXF1aXJlZCAqLyBmYWxzZSk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUXVlcnlTaWduYWxOb2RlPFQ+IGV4dGVuZHMgUmVhY3RpdmVOb2RlIHtcbiAgX2xWaWV3PzogTFZpZXc7XG4gIF9xdWVyeUluZGV4PzogbnVtYmVyO1xuICBfcXVlcnlMaXN0PzogUXVlcnlMaXN0PFQ+O1xufVxuXG4vLyBOb3RlOiBVc2luZyBhbiBJSUZFIGhlcmUgdG8gZW5zdXJlIHRoYXQgdGhlIHNwcmVhZCBhc3NpZ25tZW50IGlzIG5vdCBjb25zaWRlcmVkXG4vLyBhIHNpZGUtZWZmZWN0LCBlbmRpbmcgdXAgcHJlc2VydmluZyBgQ09NUFVURURfTk9ERWAgYW5kIGBSRUFDVElWRV9OT0RFYC5cbi8vIFRPRE86IHJlbW92ZSB3aGVuIGh0dHBzOi8vZ2l0aHViLmNvbS9ldmFudy9lc2J1aWxkL2lzc3Vlcy8zMzkyIGlzIHJlc29sdmVkLlxuZXhwb3J0IGNvbnN0IFFVRVJZX1NJR05BTF9OT0RFOiBRdWVyeVNpZ25hbE5vZGU8dW5rbm93bj4gPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5SRUFDVElWRV9OT0RFLFxuXG4gICAgLy8gQmFzZSByZWFjdGl2ZSBub2RlLm92ZXJyaWRlc1xuICAgIHByb2R1Y2VyTXVzdFJlY29tcHV0ZTogKG5vZGU6IFF1ZXJ5U2lnbmFsTm9kZTx1bmtub3duPikgPT4ge1xuICAgICAgcmV0dXJuICEhbm9kZS5fcXVlcnlMaXN0Py5kaXJ0eTtcbiAgICB9LFxuXG4gICAgcHJvZHVjZXJSZWNvbXB1dGVWYWx1ZTogKG5vZGU6IFF1ZXJ5U2lnbmFsTm9kZTx1bmtub3duPikgPT4ge1xuICAgICAgLy8gVGhlIGN1cnJlbnQgdmFsdWUgaXMgc3RhbGUuIENoZWNrIHdoZXRoZXIgd2UgbmVlZCB0byBwcm9kdWNlIGEgbmV3IG9uZS5cbiAgICAgIC8vIFRPRE86IGFzc2VydDogSSd2ZSBnb3QgYm90aCB0aGUgbFZpZXcgYW5kIHF1ZXJ5SW5kZXggc3RvcmVkXG4gICAgICAvLyBUT0RPKHBlcmYpOiBJJ20gYXNzdW1pbmcgdGhhdCB0aGUgc2lnbmFsIHZhbHVlIGNoYW5nZXMgd2hlbiB0aGUgbGlzdCBvZiBtYXRjaGVzIGNoYW5nZXMuXG4gICAgICAvLyBCdXQgdGhpcyBpcyBub3QgY29ycmVjdCBmb3IgdGhlIHNpbmdsZS1lbGVtZW50IHF1ZXJpZXMgc2luY2Ugd2Ugc2hvdWxkIGFsc28gY29tcGFyZSAoPT09KVxuICAgICAgLy8gdGhlIHZhbHVlIG9mIHRoZSBmaXJzdCBlbGVtZW50LlxuICAgICAgLy8gVE9ETzogZXJyb3IgaGFuZGxpbmcgLSBzaG91bGQgd2UgZ3VhcmQgYWdhaW5zdCBleGNlcHRpb25zIHRocm93biBmcm9tIHJlZnJlc2hTaWduYWxRdWVyeSAtXG4gICAgICAvLyBub3JtYWxseSBpdCBzaG91bGQgbmV2ZXJcbiAgICAgIGlmIChyZWZyZXNoU2lnbmFsUXVlcnkobm9kZS5fbFZpZXchLCBub2RlLl9xdWVyeUluZGV4ISkpIHtcbiAgICAgICAgbm9kZS52ZXJzaW9uKys7XG4gICAgICB9XG4gICAgfVxuICB9O1xufSkoKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGJpbmRRdWVyeVRvU2lnbmFsKHRhcmdldDogU2lnbmFsPHVua25vd24+LCBxdWVyeUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgbm9kZSA9IHRhcmdldFtTSUdOQUxdIGFzIFF1ZXJ5U2lnbmFsTm9kZTx1bmtub3duPjtcbiAgbm9kZS5fbFZpZXcgPSBnZXRMVmlldygpO1xuICBub2RlLl9xdWVyeUluZGV4ID0gcXVlcnlJbmRleDtcbiAgbm9kZS5fcXVlcnlMaXN0ID0gbG9hZFF1ZXJ5SW50ZXJuYWwobm9kZS5fbFZpZXcsIHF1ZXJ5SW5kZXgpO1xuICBub2RlLl9xdWVyeUxpc3Qub25EaXJ0eSgoKSA9PiB7XG4gICAgLy8gTWFyayB0aGlzIHByb2R1Y2VyIGFzIGRpcnR5IGFuZCBub3RpZnkgbGl2ZSBjb25zdW1lciBhYm91dCB0aGUgcG90ZW50aWFsIGNoYW5nZS4gTm90ZVxuICAgIC8vIHRoYXQgdGhlIG9uRGlydHkgY2FsbGJhY2sgd2lsbCBmaXJlIG9ubHkgb24gdGhlIGluaXRpYWwgZGlydHkgbWFya2luZyAodGhhdCBpcyxcbiAgICAvLyBzdWJzZXF1ZW50IGRpcnR5IG5vdGlmaWNhdGlvbnMgYXJlIG5vdCBmaXJlZC0gdW50aWwgdGhlIFF1ZXJ5TGlzdCBiZWNvbWVzIGNsZWFuIGFnYWluKS5cbiAgICBjb25zdW1lck1hcmtEaXJ0eShub2RlKTtcbiAgfSk7XG59XG5cbi8vIFRPRE8ocmVmYWN0b3IpOiBzb21lIGNvZGUgZHVwbGljYXRpb24gd2l0aCBxdWVyeVJlZnJlc2hcbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoU2lnbmFsUXVlcnkobFZpZXc6IExWaWV3PHVua25vd24+LCBxdWVyeUluZGV4OiBudW1iZXIpOiBib29sZWFuIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gbG9hZFF1ZXJ5SW50ZXJuYWw8dW5rbm93bj4obFZpZXcsIHF1ZXJ5SW5kZXgpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdFF1ZXJ5ID0gZ2V0VFF1ZXJ5KHRWaWV3LCBxdWVyeUluZGV4KTtcblxuICAvLyBUT0RPKHRlc3QpOiBvcGVyYXRpb24gb2YgcmVmcmVzaGluZyBhIHNpZ25hbCBxdWVyeSBjb3VsZCBiZSBpbnZva2VkIGR1cmluZyB0aGUgZmlyc3RcbiAgLy8gY3JlYXRpb24gcGFzcywgd2hpbGUgcmVzdWx0cyBhcmUgc3RpbGwgYmVpbmcgY29sbGVjdGVkOyB3ZSBzaG91bGQgTk9UIG1hcmsgc3VjaCBxdWVyeSBhc1xuICAvLyBcImNsZWFuXCIgYXMgd2UgbWlnaHQgbm90IGhhdmUgYW55IHZpZXcgYWRkIC8gcmVtb3ZlIG9wZXJhdGlvbnMgdGhhdCB3b3VsZCBtYWtlIGl0IGRpcnR5IGFnYWluLlxuICAvLyBMZWFuaW5nIHRvd2FyZHMgZXhpdGluZyBlYXJseSBmb3IgY2FsbHMgdG8gcmVmcmVzaFNpZ25hbFF1ZXJ5IGJlZm9yZSB0aGUgZmlyc3QgY3JlYXRpb24gcGFzc1xuICAvLyBmaW5pc2hlZFxuICBpZiAocXVlcnlMaXN0LmRpcnR5ICYmIHRRdWVyeS5tYXRjaGVzICE9PSBudWxsKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gdFF1ZXJ5LmNyb3NzZXNOZ1RlbXBsYXRlID9cbiAgICAgICAgY29sbGVjdFF1ZXJ5UmVzdWx0cyh0VmlldywgbFZpZXcsIHF1ZXJ5SW5kZXgsIFtdKSA6XG4gICAgICAgIG1hdGVyaWFsaXplVmlld1Jlc3VsdHModFZpZXcsIGxWaWV3LCB0UXVlcnksIHF1ZXJ5SW5kZXgpO1xuXG4gICAgcXVlcnlMaXN0LnJlc2V0KHJlc3VsdCwgdW53cmFwRWxlbWVudFJlZik7XG5cbiAgICAvLyBUT0RPKHRlc3QpOiBkb24ndCBtYXJrIHNpZ25hbCBhcyBkaXJ0eSB3aGVuIGEgcXVlcnkgd2FzIG1hcmtlZCBhcyBkaXJ0eSBidXQgdGhlcmVcbiAgICAvLyB3YXMgbm8gYWN0dWFsIGNoYW5nZVxuICAgIC8vIFRPRE86IGNoYW5nZSB0aGUgcmVzZXQgbG9naWMgc28gaXQgcmV0dXJucyB0aGUgdmFsdWVcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuICByZXR1cm4gZmFsc2U7XG59XG4iXX0=