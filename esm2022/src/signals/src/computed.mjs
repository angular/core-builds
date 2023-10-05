/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defaultEquals, SIGNAL } from './api';
import { consumerAfterComputation, consumerBeforeComputation, producerAccessed, producerUpdateValueVersion, REACTIVE_NODE } from './graph';
/**
 * Create a computed `Signal` which derives a reactive value from an expression.
 */
export function computed(computation, options) {
    const node = Object.create(COMPUTED_NODE);
    node.computation = computation;
    options?.equal && (node.equal = options.equal);
    const computed = () => {
        // Check if the value needs updating before returning it.
        producerUpdateValueVersion(node);
        // Record that someone looked at this signal.
        producerAccessed(node);
        if (node.value === ERRORED) {
            throw node.error;
        }
        return node.value;
    };
    computed[SIGNAL] = node;
    return computed;
}
/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const UNSET = /* @__PURE__ */ Symbol('UNSET');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const COMPUTING = /* @__PURE__ */ Symbol('COMPUTING');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
const ERRORED = /* @__PURE__ */ Symbol('ERRORED');
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const COMPUTED_NODE = /* @__PURE__ */ (() => {
    return {
        ...REACTIVE_NODE,
        value: UNSET,
        dirty: true,
        error: null,
        equal: defaultEquals,
        producerMustRecompute(node) {
            // Force a recomputation if there's no current value, or if the current value is in the
            // process of being calculated (which should throw an error).
            return node.value === UNSET || node.value === COMPUTING;
        },
        producerRecomputeValue(node) {
            if (node.value === COMPUTING) {
                // Our computation somehow led to a cyclic read of itself.
                throw new Error('Detected cycle in computations.');
            }
            const oldValue = node.value;
            node.value = COMPUTING;
            const prevConsumer = consumerBeforeComputation(node);
            let newValue;
            try {
                newValue = node.computation();
            }
            catch (err) {
                newValue = ERRORED;
                node.error = err;
            }
            finally {
                consumerAfterComputation(node, prevConsumer);
            }
            if (oldValue !== UNSET && oldValue !== ERRORED && newValue !== ERRORED &&
                node.equal(oldValue, newValue)) {
                // No change to `valueVersion` - old and new values are
                // semantically equivalent.
                node.value = oldValue;
                return;
            }
            node.value = newValue;
            node.version++;
        },
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9zaWduYWxzL3NyYy9jb21wdXRlZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsYUFBYSxFQUFFLE1BQU0sRUFBMEIsTUFBTSxPQUFPLENBQUM7QUFDckUsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBZSxNQUFNLFNBQVMsQ0FBQztBQVl2Sjs7R0FFRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUksV0FBb0IsRUFBRSxPQUFrQztJQUNsRixNQUFNLElBQUksR0FBb0IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUMzRCxJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUMvQixPQUFPLEVBQUUsS0FBSyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFL0MsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO1FBQ3BCLHlEQUF5RDtRQUN6RCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyw2Q0FBNkM7UUFDN0MsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sRUFBRTtZQUMxQixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDbEI7UUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0lBQ0QsUUFBZ0IsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDakMsT0FBTyxRQUE0QixDQUFDO0FBQ3RDLENBQUM7QUFHRDs7O0dBR0c7QUFDSCxNQUFNLEtBQUssR0FBUSxlQUFlLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBRW5EOzs7O0dBSUc7QUFDSCxNQUFNLFNBQVMsR0FBUSxlQUFlLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBRTNEOzs7O0dBSUc7QUFDSCxNQUFNLE9BQU8sR0FBUSxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBNEJ2RCxrRkFBa0Y7QUFDbEYsMkVBQTJFO0FBQzNFLDhFQUE4RTtBQUM5RSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDMUMsT0FBTztRQUNMLEdBQUcsYUFBYTtRQUNoQixLQUFLLEVBQUUsS0FBSztRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsYUFBYTtRQUVwQixxQkFBcUIsQ0FBQyxJQUEyQjtZQUMvQyx1RkFBdUY7WUFDdkYsNkRBQTZEO1lBQzdELE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7UUFDMUQsQ0FBQztRQUVELHNCQUFzQixDQUFDLElBQTJCO1lBQ2hELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLDBEQUEwRDtnQkFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUV2QixNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFJLFFBQWlCLENBQUM7WUFDdEIsSUFBSTtnQkFDRixRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQy9CO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osUUFBUSxHQUFHLE9BQU8sQ0FBQztnQkFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7YUFDbEI7b0JBQVM7Z0JBQ1Isd0JBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzlDO1lBRUQsSUFBSSxRQUFRLEtBQUssS0FBSyxJQUFJLFFBQVEsS0FBSyxPQUFPLElBQUksUUFBUSxLQUFLLE9BQU87Z0JBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNsQyx1REFBdUQ7Z0JBQ3ZELDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZWZhdWx0RXF1YWxzLCBTSUdOQUwsIFNpZ25hbCwgVmFsdWVFcXVhbGl0eUZufSBmcm9tICcuL2FwaSc7XG5pbXBvcnQge2NvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbiwgY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbiwgcHJvZHVjZXJBY2Nlc3NlZCwgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24sIFJFQUNUSVZFX05PREUsIFJlYWN0aXZlTm9kZX0gZnJvbSAnLi9ncmFwaCc7XG5cbi8qKlxuICogT3B0aW9ucyBwYXNzZWQgdG8gdGhlIGBjb21wdXRlZGAgY3JlYXRpb24gZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3JlYXRlQ29tcHV0ZWRPcHRpb25zPFQ+IHtcbiAgLyoqXG4gICAqIEEgY29tcGFyaXNvbiBmdW5jdGlvbiB3aGljaCBkZWZpbmVzIGVxdWFsaXR5IGZvciBjb21wdXRlZCB2YWx1ZXMuXG4gICAqL1xuICBlcXVhbD86IFZhbHVlRXF1YWxpdHlGbjxUPjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBjb21wdXRlZCBgU2lnbmFsYCB3aGljaCBkZXJpdmVzIGEgcmVhY3RpdmUgdmFsdWUgZnJvbSBhbiBleHByZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZWQ8VD4oY29tcHV0YXRpb246ICgpID0+IFQsIG9wdGlvbnM/OiBDcmVhdGVDb21wdXRlZE9wdGlvbnM8VD4pOiBTaWduYWw8VD4ge1xuICBjb25zdCBub2RlOiBDb21wdXRlZE5vZGU8VD4gPSBPYmplY3QuY3JlYXRlKENPTVBVVEVEX05PREUpO1xuICBub2RlLmNvbXB1dGF0aW9uID0gY29tcHV0YXRpb247XG4gIG9wdGlvbnM/LmVxdWFsICYmIChub2RlLmVxdWFsID0gb3B0aW9ucy5lcXVhbCk7XG5cbiAgY29uc3QgY29tcHV0ZWQgPSAoKSA9PiB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIG5lZWRzIHVwZGF0aW5nIGJlZm9yZSByZXR1cm5pbmcgaXQuXG4gICAgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24obm9kZSk7XG5cbiAgICAvLyBSZWNvcmQgdGhhdCBzb21lb25lIGxvb2tlZCBhdCB0aGlzIHNpZ25hbC5cbiAgICBwcm9kdWNlckFjY2Vzc2VkKG5vZGUpO1xuXG4gICAgaWYgKG5vZGUudmFsdWUgPT09IEVSUk9SRUQpIHtcbiAgICAgIHRocm93IG5vZGUuZXJyb3I7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gIH07XG4gIChjb21wdXRlZCBhcyBhbnkpW1NJR05BTF0gPSBub2RlO1xuICByZXR1cm4gY29tcHV0ZWQgYXMgYW55IGFzIFNpZ25hbDxUPjtcbn1cblxuXG4vKipcbiAqIEEgZGVkaWNhdGVkIHN5bWJvbCB1c2VkIGJlZm9yZSBhIGNvbXB1dGVkIHZhbHVlIGhhcyBiZWVuIGNhbGN1bGF0ZWQgZm9yIHRoZSBmaXJzdCB0aW1lLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBVTlNFVDogYW55ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbCgnVU5TRVQnKTtcblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBpbiBwbGFjZSBvZiBhIGNvbXB1dGVkIHNpZ25hbCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY29tcHV0YXRpb25cbiAqIGlzIGluIHByb2dyZXNzLiBVc2VkIHRvIGRldGVjdCBjeWNsZXMgaW4gY29tcHV0YXRpb24gY2hhaW5zLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBDT01QVVRJTkc6IGFueSA9IC8qIEBfX1BVUkVfXyAqLyBTeW1ib2woJ0NPTVBVVElORycpO1xuXG4vKipcbiAqIEEgZGVkaWNhdGVkIHN5bWJvbCB1c2VkIGluIHBsYWNlIG9mIGEgY29tcHV0ZWQgc2lnbmFsIHZhbHVlIHRvIGluZGljYXRlIHRoYXQgYSBnaXZlbiBjb21wdXRhdGlvblxuICogZmFpbGVkLiBUaGUgdGhyb3duIGVycm9yIGlzIGNhY2hlZCB1bnRpbCB0aGUgY29tcHV0YXRpb24gZ2V0cyBkaXJ0eSBhZ2Fpbi5cbiAqIEV4cGxpY2l0bHkgdHlwZWQgYXMgYGFueWAgc28gd2UgY2FuIHVzZSBpdCBhcyBzaWduYWwncyB2YWx1ZS5cbiAqL1xuY29uc3QgRVJST1JFRDogYW55ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbCgnRVJST1JFRCcpO1xuXG4vKipcbiAqIEEgY29tcHV0YXRpb24sIHdoaWNoIGRlcml2ZXMgYSB2YWx1ZSBmcm9tIGEgZGVjbGFyYXRpdmUgcmVhY3RpdmUgZXhwcmVzc2lvbi5cbiAqXG4gKiBgQ29tcHV0ZWRgcyBhcmUgYm90aCBwcm9kdWNlcnMgYW5kIGNvbnN1bWVycyBvZiByZWFjdGl2aXR5LlxuICovXG5pbnRlcmZhY2UgQ29tcHV0ZWROb2RlPFQ+IGV4dGVuZHMgUmVhY3RpdmVOb2RlIHtcbiAgLyoqXG4gICAqIEN1cnJlbnQgdmFsdWUgb2YgdGhlIGNvbXB1dGF0aW9uLCBvciBvbmUgb2YgdGhlIHNlbnRpbmVsIHZhbHVlcyBhYm92ZSAoYFVOU0VUYCwgYENPTVBVVElOR2AsXG4gICAqIGBFUlJPUmApLlxuICAgKi9cbiAgdmFsdWU6IFQ7XG5cbiAgLyoqXG4gICAqIElmIGB2YWx1ZWAgaXMgYEVSUk9SRURgLCB0aGUgZXJyb3IgY2F1Z2h0IGZyb20gdGhlIGxhc3QgY29tcHV0YXRpb24gYXR0ZW1wdCB3aGljaCB3aWxsXG4gICAqIGJlIHJlLXRocm93bi5cbiAgICovXG4gIGVycm9yOiB1bmtub3duO1xuXG4gIC8qKlxuICAgKiBUaGUgY29tcHV0YXRpb24gZnVuY3Rpb24gd2hpY2ggd2lsbCBwcm9kdWNlIGEgbmV3IHZhbHVlLlxuICAgKi9cbiAgY29tcHV0YXRpb246ICgpID0+IFQ7XG5cbiAgZXF1YWw6IFZhbHVlRXF1YWxpdHlGbjxUPjtcbn1cblxuLy8gTm90ZTogVXNpbmcgYW4gSUlGRSBoZXJlIHRvIGVuc3VyZSB0aGF0IHRoZSBzcHJlYWQgYXNzaWdubWVudCBpcyBub3QgY29uc2lkZXJlZFxuLy8gYSBzaWRlLWVmZmVjdCwgZW5kaW5nIHVwIHByZXNlcnZpbmcgYENPTVBVVEVEX05PREVgIGFuZCBgUkVBQ1RJVkVfTk9ERWAuXG4vLyBUT0RPOiByZW1vdmUgd2hlbiBodHRwczovL2dpdGh1Yi5jb20vZXZhbncvZXNidWlsZC9pc3N1ZXMvMzM5MiBpcyByZXNvbHZlZC5cbmNvbnN0IENPTVBVVEVEX05PREUgPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5SRUFDVElWRV9OT0RFLFxuICAgIHZhbHVlOiBVTlNFVCxcbiAgICBkaXJ0eTogdHJ1ZSxcbiAgICBlcnJvcjogbnVsbCxcbiAgICBlcXVhbDogZGVmYXVsdEVxdWFscyxcblxuICAgIHByb2R1Y2VyTXVzdFJlY29tcHV0ZShub2RlOiBDb21wdXRlZE5vZGU8dW5rbm93bj4pOiBib29sZWFuIHtcbiAgICAgIC8vIEZvcmNlIGEgcmVjb21wdXRhdGlvbiBpZiB0aGVyZSdzIG5vIGN1cnJlbnQgdmFsdWUsIG9yIGlmIHRoZSBjdXJyZW50IHZhbHVlIGlzIGluIHRoZVxuICAgICAgLy8gcHJvY2VzcyBvZiBiZWluZyBjYWxjdWxhdGVkICh3aGljaCBzaG91bGQgdGhyb3cgYW4gZXJyb3IpLlxuICAgICAgcmV0dXJuIG5vZGUudmFsdWUgPT09IFVOU0VUIHx8IG5vZGUudmFsdWUgPT09IENPTVBVVElORztcbiAgICB9LFxuXG4gICAgcHJvZHVjZXJSZWNvbXB1dGVWYWx1ZShub2RlOiBDb21wdXRlZE5vZGU8dW5rbm93bj4pOiB2b2lkIHtcbiAgICAgIGlmIChub2RlLnZhbHVlID09PSBDT01QVVRJTkcpIHtcbiAgICAgICAgLy8gT3VyIGNvbXB1dGF0aW9uIHNvbWVob3cgbGVkIHRvIGEgY3ljbGljIHJlYWQgb2YgaXRzZWxmLlxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0RldGVjdGVkIGN5Y2xlIGluIGNvbXB1dGF0aW9ucy4nKTtcbiAgICAgIH1cblxuICAgICAgY29uc3Qgb2xkVmFsdWUgPSBub2RlLnZhbHVlO1xuICAgICAgbm9kZS52YWx1ZSA9IENPTVBVVElORztcblxuICAgICAgY29uc3QgcHJldkNvbnN1bWVyID0gY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbihub2RlKTtcbiAgICAgIGxldCBuZXdWYWx1ZTogdW5rbm93bjtcbiAgICAgIHRyeSB7XG4gICAgICAgIG5ld1ZhbHVlID0gbm9kZS5jb21wdXRhdGlvbigpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIG5ld1ZhbHVlID0gRVJST1JFRDtcbiAgICAgICAgbm9kZS5lcnJvciA9IGVycjtcbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGNvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbihub2RlLCBwcmV2Q29uc3VtZXIpO1xuICAgICAgfVxuXG4gICAgICBpZiAob2xkVmFsdWUgIT09IFVOU0VUICYmIG9sZFZhbHVlICE9PSBFUlJPUkVEICYmIG5ld1ZhbHVlICE9PSBFUlJPUkVEICYmXG4gICAgICAgICAgbm9kZS5lcXVhbChvbGRWYWx1ZSwgbmV3VmFsdWUpKSB7XG4gICAgICAgIC8vIE5vIGNoYW5nZSB0byBgdmFsdWVWZXJzaW9uYCAtIG9sZCBhbmQgbmV3IHZhbHVlcyBhcmVcbiAgICAgICAgLy8gc2VtYW50aWNhbGx5IGVxdWl2YWxlbnQuXG4gICAgICAgIG5vZGUudmFsdWUgPSBvbGRWYWx1ZTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBub2RlLnZhbHVlID0gbmV3VmFsdWU7XG4gICAgICBub2RlLnZlcnNpb24rKztcbiAgICB9LFxuICB9O1xufSkoKTtcbiJdfQ==