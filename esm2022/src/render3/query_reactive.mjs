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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicXVlcnlfcmVhY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL3F1ZXJ5X3JlYWN0aXZlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxnQkFBZ0IsRUFBRSwwQkFBMEIsRUFBRSxhQUFhLEVBQWdCLE1BQU0sRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBRXRKLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdkMsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFdkQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUUxQyxPQUFPLEVBQVEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0MsT0FBTyxFQUFDLG1CQUFtQixFQUFFLFNBQVMsRUFBRSxpQkFBaUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUVsRyxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBS2pDLFNBQVMsbUJBQW1CLENBQUksU0FBa0IsRUFBRSxRQUFpQjtJQUNuRSxNQUFNLElBQUksR0FBdUIsTUFBTSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2xFLFNBQVMsUUFBUTtRQUNmLHlEQUF5RDtRQUN6RCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyxrQ0FBa0M7UUFDbEMsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkIsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNkLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDO1lBQzFDLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxRQUFRLEVBQUUsQ0FBQztnQkFDekMsdUJBQXVCO2dCQUN2Qiwy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UyxDQUFDLEtBQUssSUFBSSxNQUFNLENBQUMsT0FBTyxLQUFLLElBQUksRUFBRSxDQUFDO1FBQy9DLE1BQU0sTUFBTSxHQUFHLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3JDLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDbkQsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFN0QsU0FBUyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUUxQyxvRkFBb0Y7UUFDcEYsdUJBQXVCO1FBQ3ZCLHVEQUF1RDtRQUN2RCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb25zdW1lck1hcmtEaXJ0eSwgcHJvZHVjZXJBY2Nlc3NlZCwgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24sIFJFQUNUSVZFX05PREUsIFJlYWN0aXZlTm9kZSwgU0lHTkFMfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7UnVudGltZUVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHt1bndyYXBFbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlci9xdWVyeV9saXN0JztcbmltcG9ydCB7RU1QVFlfQVJSQVl9IGZyb20gJy4uL3V0aWwvZW1wdHknO1xuXG5pbXBvcnQge0xWaWV3LCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHtjb2xsZWN0UXVlcnlSZXN1bHRzLCBnZXRUUXVlcnksIGxvYWRRdWVyeUludGVybmFsLCBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzfSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7U2lnbmFsfSBmcm9tICcuL3JlYWN0aXZpdHkvYXBpJztcbmltcG9ydCB7Z2V0TFZpZXd9IGZyb20gJy4vc3RhdGUnO1xuXG5mdW5jdGlvbiBjcmVhdGVRdWVyeVNpZ25hbEZuPFY+KGZpcnN0T25seTogdHJ1ZSwgcmVxdWlyZWQ6IHRydWUpOiBTaWduYWw8Vj47XG5mdW5jdGlvbiBjcmVhdGVRdWVyeVNpZ25hbEZuPFY+KGZpcnN0T25seTogdHJ1ZSwgcmVxdWlyZWQ6IGZhbHNlKTogU2lnbmFsPFZ8dW5kZWZpbmVkPjtcbmZ1bmN0aW9uIGNyZWF0ZVF1ZXJ5U2lnbmFsRm48Vj4oZmlyc3RPbmx5OiBmYWxzZSwgcmVxdWlyZWQ6IGZhbHNlKTogU2lnbmFsPFJlYWRvbmx5QXJyYXk8Vj4+O1xuZnVuY3Rpb24gY3JlYXRlUXVlcnlTaWduYWxGbjxWPihmaXJzdE9ubHk6IGJvb2xlYW4sIHJlcXVpcmVkOiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGU6IFF1ZXJ5U2lnbmFsTm9kZTxWPiA9IE9iamVjdC5jcmVhdGUoUVVFUllfU0lHTkFMX05PREUpO1xuICBmdW5jdGlvbiBzaWduYWxGbigpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgbmVlZHMgdXBkYXRpbmcgYmVmb3JlIHJldHVybmluZyBpdC5cbiAgICBwcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbihub2RlKTtcblxuICAgIC8vIE1hcmsgdGhpcyBwcm9kdWNlciBhcyBhY2Nlc3NlZC5cbiAgICBwcm9kdWNlckFjY2Vzc2VkKG5vZGUpO1xuXG4gICAgaWYgKGZpcnN0T25seSkge1xuICAgICAgY29uc3QgZmlyc3RWYWx1ZSA9IG5vZGUuX3F1ZXJ5TGlzdD8uZmlyc3Q7XG4gICAgICBpZiAoZmlyc3RWYWx1ZSA9PT0gdW5kZWZpbmVkICYmIHJlcXVpcmVkKSB7XG4gICAgICAgIC8vIFRPRE86IGFkZCBlcnJvciBjb2RlXG4gICAgICAgIC8vIFRPRE86IGFkZCBwcm9wZXIgbWVzc2FnZVxuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKDAsICdubyBxdWVyeSByZXN1bHRzIHlldCEnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaXJzdFZhbHVlO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUT0RPKHBlcmYpOiBtYWtlIHN1cmUgdGhhdCBJJ20gbm90IGNyZWF0aW5nIG5ldyBhcnJheXMgd2hlbiByZXR1cm5pbmcgcmVzdWx0cy4gVGhlIG90aGVyXG4gICAgICAvLyBjb25zaWRlcmF0aW9uIGhlcmUgaXMgdGhlIHJlZmVyZW50aWFsIHN0YWJpbGl0eSBvZiByZXN1bHRzLlxuICAgICAgcmV0dXJuIG5vZGUuX3F1ZXJ5TGlzdD8udG9BcnJheSgpID8/IEVNUFRZX0FSUkFZO1xuICAgIH1cbiAgfVxuICAoc2lnbmFsRm4gYXMgYW55KVtTSUdOQUxdID0gbm9kZTtcblxuICByZXR1cm4gc2lnbmFsRm47XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTaW5nbGVSZXN1bHRPcHRpb25hbFF1ZXJ5U2lnbmFsRm48UmVhZFQ+KCk6IFNpZ25hbDxSZWFkVHx1bmRlZmluZWQ+IHtcbiAgcmV0dXJuIGNyZWF0ZVF1ZXJ5U2lnbmFsRm4oLyogZmlyc3RPbmx5ICovIHRydWUsIC8qIHJlcXVpcmVkICovIGZhbHNlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNpbmdsZVJlc3VsdFJlcXVpcmVkUXVlcnlTaWduYWxGbjxSZWFkVD4oKTogU2lnbmFsPFJlYWRUPiB7XG4gIHJldHVybiBjcmVhdGVRdWVyeVNpZ25hbEZuKC8qIGZpcnN0T25seSAqLyB0cnVlLCAvKiByZXF1aXJlZCAqLyB0cnVlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU11bHRpUmVzdWx0UXVlcnlTaWduYWxGbjxSZWFkVD4oKTogU2lnbmFsPFJlYWRvbmx5QXJyYXk8UmVhZFQ+PiB7XG4gIHJldHVybiBjcmVhdGVRdWVyeVNpZ25hbEZuKC8qIGZpcnN0T25seSAqLyBmYWxzZSwgLyogcmVxdWlyZWQgKi8gZmFsc2UpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFF1ZXJ5U2lnbmFsTm9kZTxUPiBleHRlbmRzIFJlYWN0aXZlTm9kZSB7XG4gIF9sVmlldz86IExWaWV3O1xuICBfcXVlcnlJbmRleD86IG51bWJlcjtcbiAgX3F1ZXJ5TGlzdD86IFF1ZXJ5TGlzdDxUPjtcbn1cblxuLy8gTm90ZTogVXNpbmcgYW4gSUlGRSBoZXJlIHRvIGVuc3VyZSB0aGF0IHRoZSBzcHJlYWQgYXNzaWdubWVudCBpcyBub3QgY29uc2lkZXJlZFxuLy8gYSBzaWRlLWVmZmVjdCwgZW5kaW5nIHVwIHByZXNlcnZpbmcgYENPTVBVVEVEX05PREVgIGFuZCBgUkVBQ1RJVkVfTk9ERWAuXG4vLyBUT0RPOiByZW1vdmUgd2hlbiBodHRwczovL2dpdGh1Yi5jb20vZXZhbncvZXNidWlsZC9pc3N1ZXMvMzM5MiBpcyByZXNvbHZlZC5cbmV4cG9ydCBjb25zdCBRVUVSWV9TSUdOQUxfTk9ERTogUXVlcnlTaWduYWxOb2RlPHVua25vd24+ID0gLyogQF9fUFVSRV9fICovICgoKSA9PiB7XG4gIHJldHVybiB7XG4gICAgLi4uUkVBQ1RJVkVfTk9ERSxcblxuICAgIC8vIEJhc2UgcmVhY3RpdmUgbm9kZS5vdmVycmlkZXNcbiAgICBwcm9kdWNlck11c3RSZWNvbXB1dGU6IChub2RlOiBRdWVyeVNpZ25hbE5vZGU8dW5rbm93bj4pID0+IHtcbiAgICAgIHJldHVybiAhIW5vZGUuX3F1ZXJ5TGlzdD8uZGlydHk7XG4gICAgfSxcblxuICAgIHByb2R1Y2VyUmVjb21wdXRlVmFsdWU6IChub2RlOiBRdWVyeVNpZ25hbE5vZGU8dW5rbm93bj4pID0+IHtcbiAgICAgIC8vIFRoZSBjdXJyZW50IHZhbHVlIGlzIHN0YWxlLiBDaGVjayB3aGV0aGVyIHdlIG5lZWQgdG8gcHJvZHVjZSBhIG5ldyBvbmUuXG4gICAgICAvLyBUT0RPOiBhc3NlcnQ6IEkndmUgZ290IGJvdGggdGhlIGxWaWV3IGFuZCBxdWVyeUluZGV4IHN0b3JlZFxuICAgICAgLy8gVE9ETyhwZXJmKTogSSdtIGFzc3VtaW5nIHRoYXQgdGhlIHNpZ25hbCB2YWx1ZSBjaGFuZ2VzIHdoZW4gdGhlIGxpc3Qgb2YgbWF0Y2hlcyBjaGFuZ2VzLlxuICAgICAgLy8gQnV0IHRoaXMgaXMgbm90IGNvcnJlY3QgZm9yIHRoZSBzaW5nbGUtZWxlbWVudCBxdWVyaWVzIHNpbmNlIHdlIHNob3VsZCBhbHNvIGNvbXBhcmUgKD09PSlcbiAgICAgIC8vIHRoZSB2YWx1ZSBvZiB0aGUgZmlyc3QgZWxlbWVudC5cbiAgICAgIC8vIFRPRE86IGVycm9yIGhhbmRsaW5nIC0gc2hvdWxkIHdlIGd1YXJkIGFnYWluc3QgZXhjZXB0aW9ucyB0aHJvd24gZnJvbSByZWZyZXNoU2lnbmFsUXVlcnkgLVxuICAgICAgLy8gbm9ybWFsbHkgaXQgc2hvdWxkIG5ldmVyXG4gICAgICBpZiAocmVmcmVzaFNpZ25hbFF1ZXJ5KG5vZGUuX2xWaWV3ISwgbm9kZS5fcXVlcnlJbmRleCEpKSB7XG4gICAgICAgIG5vZGUudmVyc2lvbisrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn0pKCk7XG5cbmV4cG9ydCBmdW5jdGlvbiBiaW5kUXVlcnlUb1NpZ25hbCh0YXJnZXQ6IFNpZ25hbDx1bmtub3duPiwgcXVlcnlJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSB0YXJnZXRbU0lHTkFMXSBhcyBRdWVyeVNpZ25hbE5vZGU8dW5rbm93bj47XG4gIG5vZGUuX2xWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbm9kZS5fcXVlcnlJbmRleCA9IHF1ZXJ5SW5kZXg7XG4gIG5vZGUuX3F1ZXJ5TGlzdCA9IGxvYWRRdWVyeUludGVybmFsKG5vZGUuX2xWaWV3LCBxdWVyeUluZGV4KTtcbiAgbm9kZS5fcXVlcnlMaXN0Lm9uRGlydHkoKCkgPT4ge1xuICAgIC8vIE1hcmsgdGhpcyBwcm9kdWNlciBhcyBkaXJ0eSBhbmQgbm90aWZ5IGxpdmUgY29uc3VtZXIgYWJvdXQgdGhlIHBvdGVudGlhbCBjaGFuZ2UuIE5vdGVcbiAgICAvLyB0aGF0IHRoZSBvbkRpcnR5IGNhbGxiYWNrIHdpbGwgZmlyZSBvbmx5IG9uIHRoZSBpbml0aWFsIGRpcnR5IG1hcmtpbmcgKHRoYXQgaXMsXG4gICAgLy8gc3Vic2VxdWVudCBkaXJ0eSBub3RpZmljYXRpb25zIGFyZSBub3QgZmlyZWQtIHVudGlsIHRoZSBRdWVyeUxpc3QgYmVjb21lcyBjbGVhbiBhZ2FpbikuXG4gICAgY29uc3VtZXJNYXJrRGlydHkobm9kZSk7XG4gIH0pO1xufVxuXG4vLyBUT0RPKHJlZmFjdG9yKTogc29tZSBjb2RlIGR1cGxpY2F0aW9uIHdpdGggcXVlcnlSZWZyZXNoXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFNpZ25hbFF1ZXJ5KGxWaWV3OiBMVmlldzx1bmtub3duPiwgcXVlcnlJbmRleDogbnVtYmVyKTogYm9vbGVhbiB7XG4gIGNvbnN0IHF1ZXJ5TGlzdCA9IGxvYWRRdWVyeUludGVybmFsPHVua25vd24+KGxWaWV3LCBxdWVyeUluZGV4KTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHRRdWVyeSA9IGdldFRRdWVyeSh0VmlldywgcXVlcnlJbmRleCk7XG5cbiAgLy8gVE9ETyh0ZXN0KTogb3BlcmF0aW9uIG9mIHJlZnJlc2hpbmcgYSBzaWduYWwgcXVlcnkgY291bGQgYmUgaW52b2tlZCBkdXJpbmcgdGhlIGZpcnN0XG4gIC8vIGNyZWF0aW9uIHBhc3MsIHdoaWxlIHJlc3VsdHMgYXJlIHN0aWxsIGJlaW5nIGNvbGxlY3RlZDsgd2Ugc2hvdWxkIE5PVCBtYXJrIHN1Y2ggcXVlcnkgYXNcbiAgLy8gXCJjbGVhblwiIGFzIHdlIG1pZ2h0IG5vdCBoYXZlIGFueSB2aWV3IGFkZCAvIHJlbW92ZSBvcGVyYXRpb25zIHRoYXQgd291bGQgbWFrZSBpdCBkaXJ0eSBhZ2Fpbi5cbiAgLy8gTGVhbmluZyB0b3dhcmRzIGV4aXRpbmcgZWFybHkgZm9yIGNhbGxzIHRvIHJlZnJlc2hTaWduYWxRdWVyeSBiZWZvcmUgdGhlIGZpcnN0IGNyZWF0aW9uIHBhc3NcbiAgLy8gZmluaXNoZWRcbiAgaWYgKHF1ZXJ5TGlzdC5kaXJ0eSAmJiB0UXVlcnkubWF0Y2hlcyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHRRdWVyeS5jcm9zc2VzTmdUZW1wbGF0ZSA/XG4gICAgICAgIGNvbGxlY3RRdWVyeVJlc3VsdHModFZpZXcsIGxWaWV3LCBxdWVyeUluZGV4LCBbXSkgOlxuICAgICAgICBtYXRlcmlhbGl6ZVZpZXdSZXN1bHRzKHRWaWV3LCBsVmlldywgdFF1ZXJ5LCBxdWVyeUluZGV4KTtcblxuICAgIHF1ZXJ5TGlzdC5yZXNldChyZXN1bHQsIHVud3JhcEVsZW1lbnRSZWYpO1xuXG4gICAgLy8gVE9ETyh0ZXN0KTogZG9uJ3QgbWFyayBzaWduYWwgYXMgZGlydHkgd2hlbiBhIHF1ZXJ5IHdhcyBtYXJrZWQgYXMgZGlydHkgYnV0IHRoZXJlXG4gICAgLy8gd2FzIG5vIGFjdHVhbCBjaGFuZ2VcbiAgICAvLyBUT0RPOiBjaGFuZ2UgdGhlIHJlc2V0IGxvZ2ljIHNvIGl0IHJldHVybnMgdGhlIHZhbHVlXG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19