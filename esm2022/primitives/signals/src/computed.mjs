/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defaultEquals } from './equality';
import { consumerAfterComputation, consumerBeforeComputation, producerAccessed, producerUpdateValueVersion, REACTIVE_NODE, SIGNAL } from './graph';
/** Function used as the `toString` implementation of computed. */
const computedToString = () => '[COMPUTED]';
/**
 * Create a computed signal which derives a reactive value from an expression.
 */
export function createComputed(computation) {
    const node = Object.create(COMPUTED_NODE);
    node.computation = computation;
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
    computed.toString = computedToString;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscy9zcmMvY29tcHV0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGFBQWEsRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFDMUQsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBZ0IsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBaUMvSixrRUFBa0U7QUFDbEUsTUFBTSxnQkFBZ0IsR0FBRyxHQUFHLEVBQUUsQ0FBQyxZQUFZLENBQUM7QUFFNUM7O0dBRUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFJLFdBQW9CO0lBQ3BELE1BQU0sSUFBSSxHQUFvQixNQUFNLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzNELElBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO0lBRS9CLE1BQU0sUUFBUSxHQUFHLEdBQUcsRUFBRTtRQUNwQix5REFBeUQ7UUFDekQsMEJBQTBCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFakMsNkNBQTZDO1FBQzdDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXZCLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxPQUFPLEVBQUUsQ0FBQztZQUMzQixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDbkIsQ0FBQztRQUVELE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNwQixDQUFDLENBQUM7SUFDRCxRQUE4QixDQUFDLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQztJQUMvQyxRQUFRLENBQUMsUUFBUSxHQUFHLGdCQUFnQixDQUFDO0lBQ3JDLE9BQU8sUUFBd0MsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxLQUFLLEdBQVEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUVuRDs7OztHQUlHO0FBQ0gsTUFBTSxTQUFTLEdBQVEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUUzRDs7OztHQUlHO0FBQ0gsTUFBTSxPQUFPLEdBQVEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUV2RCxrRkFBa0Y7QUFDbEYsMkVBQTJFO0FBQzNFLDhFQUE4RTtBQUM5RSxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDMUMsT0FBTztRQUNMLEdBQUcsYUFBYTtRQUNoQixLQUFLLEVBQUUsS0FBSztRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsYUFBYTtRQUVwQixxQkFBcUIsQ0FBQyxJQUEyQjtZQUMvQyx1RkFBdUY7WUFDdkYsNkRBQTZEO1lBQzdELE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7UUFDMUQsQ0FBQztRQUVELHNCQUFzQixDQUFDLElBQTJCO1lBQ2hELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUUsQ0FBQztnQkFDN0IsMERBQTBEO2dCQUMxRCxNQUFNLElBQUksS0FBSyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7WUFDckQsQ0FBQztZQUVELE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7WUFDNUIsSUFBSSxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUM7WUFFdkIsTUFBTSxZQUFZLEdBQUcseUJBQXlCLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDckQsSUFBSSxRQUFpQixDQUFDO1lBQ3RCLElBQUksQ0FBQztnQkFDSCxRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hDLENBQUM7WUFBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO2dCQUNiLFFBQVEsR0FBRyxPQUFPLENBQUM7Z0JBQ25CLElBQUksQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDO1lBQ25CLENBQUM7b0JBQVMsQ0FBQztnQkFDVCx3QkFBd0IsQ0FBQyxJQUFJLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFDL0MsQ0FBQztZQUVELElBQUksUUFBUSxLQUFLLEtBQUssSUFBSSxRQUFRLEtBQUssT0FBTyxJQUFJLFFBQVEsS0FBSyxPQUFPO2dCQUNsRSxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsRUFBRSxDQUFDO2dCQUNuQyx1REFBdUQ7Z0JBQ3ZELDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3RCLE9BQU87WUFDVCxDQUFDO1lBRUQsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7WUFDdEIsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQ2pCLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2RlZmF1bHRFcXVhbHMsIFZhbHVlRXF1YWxpdHlGbn0gZnJvbSAnLi9lcXVhbGl0eSc7XG5pbXBvcnQge2NvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbiwgY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbiwgcHJvZHVjZXJBY2Nlc3NlZCwgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24sIFJFQUNUSVZFX05PREUsIFJlYWN0aXZlTm9kZSwgU0lHTkFMfSBmcm9tICcuL2dyYXBoJztcblxuXG4vKipcbiAqIEEgY29tcHV0YXRpb24sIHdoaWNoIGRlcml2ZXMgYSB2YWx1ZSBmcm9tIGEgZGVjbGFyYXRpdmUgcmVhY3RpdmUgZXhwcmVzc2lvbi5cbiAqXG4gKiBgQ29tcHV0ZWRgcyBhcmUgYm90aCBwcm9kdWNlcnMgYW5kIGNvbnN1bWVycyBvZiByZWFjdGl2aXR5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIENvbXB1dGVkTm9kZTxUPiBleHRlbmRzIFJlYWN0aXZlTm9kZSB7XG4gIC8qKlxuICAgKiBDdXJyZW50IHZhbHVlIG9mIHRoZSBjb21wdXRhdGlvbiwgb3Igb25lIG9mIHRoZSBzZW50aW5lbCB2YWx1ZXMgYWJvdmUgKGBVTlNFVGAsIGBDT01QVVRJTkdgLFxuICAgKiBgRVJST1JgKS5cbiAgICovXG4gIHZhbHVlOiBUO1xuXG4gIC8qKlxuICAgKiBJZiBgdmFsdWVgIGlzIGBFUlJPUkVEYCwgdGhlIGVycm9yIGNhdWdodCBmcm9tIHRoZSBsYXN0IGNvbXB1dGF0aW9uIGF0dGVtcHQgd2hpY2ggd2lsbFxuICAgKiBiZSByZS10aHJvd24uXG4gICAqL1xuICBlcnJvcjogdW5rbm93bjtcblxuICAvKipcbiAgICogVGhlIGNvbXB1dGF0aW9uIGZ1bmN0aW9uIHdoaWNoIHdpbGwgcHJvZHVjZSBhIG5ldyB2YWx1ZS5cbiAgICovXG4gIGNvbXB1dGF0aW9uOiAoKSA9PiBUO1xuXG4gIGVxdWFsOiBWYWx1ZUVxdWFsaXR5Rm48VD47XG59XG5cbmV4cG9ydCB0eXBlIENvbXB1dGVkR2V0dGVyPFQ+ID0gKCgpID0+IFQpJntcbiAgW1NJR05BTF06IENvbXB1dGVkTm9kZTxUPjtcbn07XG5cbi8qKiBGdW5jdGlvbiB1c2VkIGFzIHRoZSBgdG9TdHJpbmdgIGltcGxlbWVudGF0aW9uIG9mIGNvbXB1dGVkLiAqL1xuY29uc3QgY29tcHV0ZWRUb1N0cmluZyA9ICgpID0+ICdbQ09NUFVURURdJztcblxuLyoqXG4gKiBDcmVhdGUgYSBjb21wdXRlZCBzaWduYWwgd2hpY2ggZGVyaXZlcyBhIHJlYWN0aXZlIHZhbHVlIGZyb20gYW4gZXhwcmVzc2lvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbXB1dGVkPFQ+KGNvbXB1dGF0aW9uOiAoKSA9PiBUKTogQ29tcHV0ZWRHZXR0ZXI8VD4ge1xuICBjb25zdCBub2RlOiBDb21wdXRlZE5vZGU8VD4gPSBPYmplY3QuY3JlYXRlKENPTVBVVEVEX05PREUpO1xuICBub2RlLmNvbXB1dGF0aW9uID0gY29tcHV0YXRpb247XG5cbiAgY29uc3QgY29tcHV0ZWQgPSAoKSA9PiB7XG4gICAgLy8gQ2hlY2sgaWYgdGhlIHZhbHVlIG5lZWRzIHVwZGF0aW5nIGJlZm9yZSByZXR1cm5pbmcgaXQuXG4gICAgcHJvZHVjZXJVcGRhdGVWYWx1ZVZlcnNpb24obm9kZSk7XG5cbiAgICAvLyBSZWNvcmQgdGhhdCBzb21lb25lIGxvb2tlZCBhdCB0aGlzIHNpZ25hbC5cbiAgICBwcm9kdWNlckFjY2Vzc2VkKG5vZGUpO1xuXG4gICAgaWYgKG5vZGUudmFsdWUgPT09IEVSUk9SRUQpIHtcbiAgICAgIHRocm93IG5vZGUuZXJyb3I7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gIH07XG4gIChjb21wdXRlZCBhcyBDb21wdXRlZEdldHRlcjxUPilbU0lHTkFMXSA9IG5vZGU7XG4gIGNvbXB1dGVkLnRvU3RyaW5nID0gY29tcHV0ZWRUb1N0cmluZztcbiAgcmV0dXJuIGNvbXB1dGVkIGFzIHVua25vd24gYXMgQ29tcHV0ZWRHZXR0ZXI8VD47XG59XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgYmVmb3JlIGEgY29tcHV0ZWQgdmFsdWUgaGFzIGJlZW4gY2FsY3VsYXRlZCBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gKiBFeHBsaWNpdGx5IHR5cGVkIGFzIGBhbnlgIHNvIHdlIGNhbiB1c2UgaXQgYXMgc2lnbmFsJ3MgdmFsdWUuXG4gKi9cbmNvbnN0IFVOU0VUOiBhbnkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKCdVTlNFVCcpO1xuXG4vKipcbiAqIEEgZGVkaWNhdGVkIHN5bWJvbCB1c2VkIGluIHBsYWNlIG9mIGEgY29tcHV0ZWQgc2lnbmFsIHZhbHVlIHRvIGluZGljYXRlIHRoYXQgYSBnaXZlbiBjb21wdXRhdGlvblxuICogaXMgaW4gcHJvZ3Jlc3MuIFVzZWQgdG8gZGV0ZWN0IGN5Y2xlcyBpbiBjb21wdXRhdGlvbiBjaGFpbnMuXG4gKiBFeHBsaWNpdGx5IHR5cGVkIGFzIGBhbnlgIHNvIHdlIGNhbiB1c2UgaXQgYXMgc2lnbmFsJ3MgdmFsdWUuXG4gKi9cbmNvbnN0IENPTVBVVElORzogYW55ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbCgnQ09NUFVUSU5HJyk7XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgaW4gcGxhY2Ugb2YgYSBjb21wdXRlZCBzaWduYWwgdmFsdWUgdG8gaW5kaWNhdGUgdGhhdCBhIGdpdmVuIGNvbXB1dGF0aW9uXG4gKiBmYWlsZWQuIFRoZSB0aHJvd24gZXJyb3IgaXMgY2FjaGVkIHVudGlsIHRoZSBjb21wdXRhdGlvbiBnZXRzIGRpcnR5IGFnYWluLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5jb25zdCBFUlJPUkVEOiBhbnkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKCdFUlJPUkVEJyk7XG5cbi8vIE5vdGU6IFVzaW5nIGFuIElJRkUgaGVyZSB0byBlbnN1cmUgdGhhdCB0aGUgc3ByZWFkIGFzc2lnbm1lbnQgaXMgbm90IGNvbnNpZGVyZWRcbi8vIGEgc2lkZS1lZmZlY3QsIGVuZGluZyB1cCBwcmVzZXJ2aW5nIGBDT01QVVRFRF9OT0RFYCBhbmQgYFJFQUNUSVZFX05PREVgLlxuLy8gVE9ETzogcmVtb3ZlIHdoZW4gaHR0cHM6Ly9naXRodWIuY29tL2V2YW53L2VzYnVpbGQvaXNzdWVzLzMzOTIgaXMgcmVzb2x2ZWQuXG5jb25zdCBDT01QVVRFRF9OT0RFID0gLyogQF9fUFVSRV9fICovICgoKSA9PiB7XG4gIHJldHVybiB7XG4gICAgLi4uUkVBQ1RJVkVfTk9ERSxcbiAgICB2YWx1ZTogVU5TRVQsXG4gICAgZGlydHk6IHRydWUsXG4gICAgZXJyb3I6IG51bGwsXG4gICAgZXF1YWw6IGRlZmF1bHRFcXVhbHMsXG5cbiAgICBwcm9kdWNlck11c3RSZWNvbXB1dGUobm9kZTogQ29tcHV0ZWROb2RlPHVua25vd24+KTogYm9vbGVhbiB7XG4gICAgICAvLyBGb3JjZSBhIHJlY29tcHV0YXRpb24gaWYgdGhlcmUncyBubyBjdXJyZW50IHZhbHVlLCBvciBpZiB0aGUgY3VycmVudCB2YWx1ZSBpcyBpbiB0aGVcbiAgICAgIC8vIHByb2Nlc3Mgb2YgYmVpbmcgY2FsY3VsYXRlZCAod2hpY2ggc2hvdWxkIHRocm93IGFuIGVycm9yKS5cbiAgICAgIHJldHVybiBub2RlLnZhbHVlID09PSBVTlNFVCB8fCBub2RlLnZhbHVlID09PSBDT01QVVRJTkc7XG4gICAgfSxcblxuICAgIHByb2R1Y2VyUmVjb21wdXRlVmFsdWUobm9kZTogQ29tcHV0ZWROb2RlPHVua25vd24+KTogdm9pZCB7XG4gICAgICBpZiAobm9kZS52YWx1ZSA9PT0gQ09NUFVUSU5HKSB7XG4gICAgICAgIC8vIE91ciBjb21wdXRhdGlvbiBzb21laG93IGxlZCB0byBhIGN5Y2xpYyByZWFkIG9mIGl0c2VsZi5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdEZXRlY3RlZCBjeWNsZSBpbiBjb21wdXRhdGlvbnMuJyk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IG9sZFZhbHVlID0gbm9kZS52YWx1ZTtcbiAgICAgIG5vZGUudmFsdWUgPSBDT01QVVRJTkc7XG5cbiAgICAgIGNvbnN0IHByZXZDb25zdW1lciA9IGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24obm9kZSk7XG4gICAgICBsZXQgbmV3VmFsdWU6IHVua25vd247XG4gICAgICB0cnkge1xuICAgICAgICBuZXdWYWx1ZSA9IG5vZGUuY29tcHV0YXRpb24oKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBuZXdWYWx1ZSA9IEVSUk9SRUQ7XG4gICAgICAgIG5vZGUuZXJyb3IgPSBlcnI7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBjb25zdW1lckFmdGVyQ29tcHV0YXRpb24obm9kZSwgcHJldkNvbnN1bWVyKTtcbiAgICAgIH1cblxuICAgICAgaWYgKG9sZFZhbHVlICE9PSBVTlNFVCAmJiBvbGRWYWx1ZSAhPT0gRVJST1JFRCAmJiBuZXdWYWx1ZSAhPT0gRVJST1JFRCAmJlxuICAgICAgICAgIG5vZGUuZXF1YWwob2xkVmFsdWUsIG5ld1ZhbHVlKSkge1xuICAgICAgICAvLyBObyBjaGFuZ2UgdG8gYHZhbHVlVmVyc2lvbmAgLSBvbGQgYW5kIG5ldyB2YWx1ZXMgYXJlXG4gICAgICAgIC8vIHNlbWFudGljYWxseSBlcXVpdmFsZW50LlxuICAgICAgICBub2RlLnZhbHVlID0gb2xkVmFsdWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgbm9kZS52YWx1ZSA9IG5ld1ZhbHVlO1xuICAgICAgbm9kZS52ZXJzaW9uKys7XG4gICAgfSxcbiAgfTtcbn0pKCk7XG4iXX0=