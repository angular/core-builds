/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { defaultEquals } from './equality';
import { consumerAfterComputation, consumerBeforeComputation, producerAccessed, producerUpdateValueVersion, REACTIVE_NODE, SIGNAL } from './graph';
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
    return computed;
}
/**
 * A dedicated symbol used before a computed value has been calculated for the first time.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
export const UNSET = /* @__PURE__ */ Symbol('UNSET');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * is in progress. Used to detect cycles in computation chains.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
export const COMPUTING = /* @__PURE__ */ Symbol('COMPUTING');
/**
 * A dedicated symbol used in place of a computed signal value to indicate that a given computation
 * failed. The thrown error is cached until the computation gets dirty again.
 * Explicitly typed as `any` so we can use it as signal's value.
 */
export const ERRORED = /* @__PURE__ */ Symbol('ERRORED');
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
export const COMPUTED_NODE = /* @__PURE__ */ (() => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tcHV0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscy9zcmMvY29tcHV0ZWQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGFBQWEsRUFBa0IsTUFBTSxZQUFZLENBQUM7QUFDMUQsT0FBTyxFQUFDLHdCQUF3QixFQUFFLHlCQUF5QixFQUFFLGdCQUFnQixFQUFFLDBCQUEwQixFQUFFLGFBQWEsRUFBZ0IsTUFBTSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBaUMvSjs7R0FFRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUksV0FBb0I7SUFDcEQsTUFBTSxJQUFJLEdBQW9CLE1BQU0sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7SUFDM0QsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7SUFFL0IsTUFBTSxRQUFRLEdBQUcsR0FBRyxFQUFFO1FBQ3BCLHlEQUF5RDtRQUN6RCwwQkFBMEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVqQyw2Q0FBNkM7UUFDN0MsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFdkIsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLE9BQU8sRUFBRTtZQUMxQixNQUFNLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDbEI7UUFFRCxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDcEIsQ0FBQyxDQUFDO0lBQ0QsUUFBOEIsQ0FBQyxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDL0MsT0FBTyxRQUF3QyxDQUFDO0FBQ2xELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQVEsZUFBZSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUUxRDs7OztHQUlHO0FBQ0gsTUFBTSxDQUFDLE1BQU0sU0FBUyxHQUFRLGVBQWUsQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLENBQUM7QUFFbEU7Ozs7R0FJRztBQUNILE1BQU0sQ0FBQyxNQUFNLE9BQU8sR0FBUSxlQUFlLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRTlELGtGQUFrRjtBQUNsRiwyRUFBMkU7QUFDM0UsOEVBQThFO0FBQzlFLE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxlQUFlLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDakQsT0FBTztRQUNMLEdBQUcsYUFBYTtRQUNoQixLQUFLLEVBQUUsS0FBSztRQUNaLEtBQUssRUFBRSxJQUFJO1FBQ1gsS0FBSyxFQUFFLElBQUk7UUFDWCxLQUFLLEVBQUUsYUFBYTtRQUVwQixxQkFBcUIsQ0FBQyxJQUEyQjtZQUMvQyx1RkFBdUY7WUFDdkYsNkRBQTZEO1lBQzdELE9BQU8sSUFBSSxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLENBQUM7UUFDMUQsQ0FBQztRQUVELHNCQUFzQixDQUFDLElBQTJCO1lBQ2hELElBQUksSUFBSSxDQUFDLEtBQUssS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLDBEQUEwRDtnQkFDMUQsTUFBTSxJQUFJLEtBQUssQ0FBQyxpQ0FBaUMsQ0FBQyxDQUFDO2FBQ3BEO1lBRUQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztZQUM1QixJQUFJLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQztZQUV2QixNQUFNLFlBQVksR0FBRyx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNyRCxJQUFJLFFBQWlCLENBQUM7WUFDdEIsSUFBSTtnQkFDRixRQUFRLEdBQUcsSUFBSSxDQUFDLFdBQVcsRUFBRSxDQUFDO2FBQy9CO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osUUFBUSxHQUFHLE9BQU8sQ0FBQztnQkFDbkIsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUM7YUFDbEI7b0JBQVM7Z0JBQ1Isd0JBQXdCLENBQUMsSUFBSSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzlDO1lBRUQsSUFBSSxRQUFRLEtBQUssS0FBSyxJQUFJLFFBQVEsS0FBSyxPQUFPLElBQUksUUFBUSxLQUFLLE9BQU87Z0JBQ2xFLElBQUksQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxFQUFFO2dCQUNsQyx1REFBdUQ7Z0JBQ3ZELDJCQUEyQjtnQkFDM0IsSUFBSSxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUM7Z0JBQ3RCLE9BQU87YUFDUjtZQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsUUFBUSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNqQixDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUMsQ0FBQyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtkZWZhdWx0RXF1YWxzLCBWYWx1ZUVxdWFsaXR5Rm59IGZyb20gJy4vZXF1YWxpdHknO1xuaW1wb3J0IHtjb25zdW1lckFmdGVyQ29tcHV0YXRpb24sIGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24sIHByb2R1Y2VyQWNjZXNzZWQsIHByb2R1Y2VyVXBkYXRlVmFsdWVWZXJzaW9uLCBSRUFDVElWRV9OT0RFLCBSZWFjdGl2ZU5vZGUsIFNJR05BTH0gZnJvbSAnLi9ncmFwaCc7XG5cblxuLyoqXG4gKiBBIGNvbXB1dGF0aW9uLCB3aGljaCBkZXJpdmVzIGEgdmFsdWUgZnJvbSBhIGRlY2xhcmF0aXZlIHJlYWN0aXZlIGV4cHJlc3Npb24uXG4gKlxuICogYENvbXB1dGVkYHMgYXJlIGJvdGggcHJvZHVjZXJzIGFuZCBjb25zdW1lcnMgb2YgcmVhY3Rpdml0eS5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBDb21wdXRlZE5vZGU8VD4gZXh0ZW5kcyBSZWFjdGl2ZU5vZGUge1xuICAvKipcbiAgICogQ3VycmVudCB2YWx1ZSBvZiB0aGUgY29tcHV0YXRpb24sIG9yIG9uZSBvZiB0aGUgc2VudGluZWwgdmFsdWVzIGFib3ZlIChgVU5TRVRgLCBgQ09NUFVUSU5HYCxcbiAgICogYEVSUk9SYCkuXG4gICAqL1xuICB2YWx1ZTogVDtcblxuICAvKipcbiAgICogSWYgYHZhbHVlYCBpcyBgRVJST1JFRGAsIHRoZSBlcnJvciBjYXVnaHQgZnJvbSB0aGUgbGFzdCBjb21wdXRhdGlvbiBhdHRlbXB0IHdoaWNoIHdpbGxcbiAgICogYmUgcmUtdGhyb3duLlxuICAgKi9cbiAgZXJyb3I6IHVua25vd247XG5cbiAgLyoqXG4gICAqIFRoZSBjb21wdXRhdGlvbiBmdW5jdGlvbiB3aGljaCB3aWxsIHByb2R1Y2UgYSBuZXcgdmFsdWUuXG4gICAqL1xuICBjb21wdXRhdGlvbjogKCkgPT4gVDtcblxuICBlcXVhbDogVmFsdWVFcXVhbGl0eUZuPFQ+O1xufVxuXG5leHBvcnQgdHlwZSBDb21wdXRlZEdldHRlcjxUPiA9ICgoKSA9PiBUKSZ7XG4gIFtTSUdOQUxdOiBDb21wdXRlZE5vZGU8VD47XG59O1xuXG4vKipcbiAqIENyZWF0ZSBhIGNvbXB1dGVkIHNpZ25hbCB3aGljaCBkZXJpdmVzIGEgcmVhY3RpdmUgdmFsdWUgZnJvbSBhbiBleHByZXNzaW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ29tcHV0ZWQ8VD4oY29tcHV0YXRpb246ICgpID0+IFQpOiBDb21wdXRlZEdldHRlcjxUPiB7XG4gIGNvbnN0IG5vZGU6IENvbXB1dGVkTm9kZTxUPiA9IE9iamVjdC5jcmVhdGUoQ09NUFVURURfTk9ERSk7XG4gIG5vZGUuY29tcHV0YXRpb24gPSBjb21wdXRhdGlvbjtcblxuICBjb25zdCBjb21wdXRlZCA9ICgpID0+IHtcbiAgICAvLyBDaGVjayBpZiB0aGUgdmFsdWUgbmVlZHMgdXBkYXRpbmcgYmVmb3JlIHJldHVybmluZyBpdC5cbiAgICBwcm9kdWNlclVwZGF0ZVZhbHVlVmVyc2lvbihub2RlKTtcblxuICAgIC8vIFJlY29yZCB0aGF0IHNvbWVvbmUgbG9va2VkIGF0IHRoaXMgc2lnbmFsLlxuICAgIHByb2R1Y2VyQWNjZXNzZWQobm9kZSk7XG5cbiAgICBpZiAobm9kZS52YWx1ZSA9PT0gRVJST1JFRCkge1xuICAgICAgdGhyb3cgbm9kZS5lcnJvcjtcbiAgICB9XG5cbiAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgfTtcbiAgKGNvbXB1dGVkIGFzIENvbXB1dGVkR2V0dGVyPFQ+KVtTSUdOQUxdID0gbm9kZTtcbiAgcmV0dXJuIGNvbXB1dGVkIGFzIHVua25vd24gYXMgQ29tcHV0ZWRHZXR0ZXI8VD47XG59XG5cbi8qKlxuICogQSBkZWRpY2F0ZWQgc3ltYm9sIHVzZWQgYmVmb3JlIGEgY29tcHV0ZWQgdmFsdWUgaGFzIGJlZW4gY2FsY3VsYXRlZCBmb3IgdGhlIGZpcnN0IHRpbWUuXG4gKiBFeHBsaWNpdGx5IHR5cGVkIGFzIGBhbnlgIHNvIHdlIGNhbiB1c2UgaXQgYXMgc2lnbmFsJ3MgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBVTlNFVDogYW55ID0gLyogQF9fUFVSRV9fICovIFN5bWJvbCgnVU5TRVQnKTtcblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBpbiBwbGFjZSBvZiBhIGNvbXB1dGVkIHNpZ25hbCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY29tcHV0YXRpb25cbiAqIGlzIGluIHByb2dyZXNzLiBVc2VkIHRvIGRldGVjdCBjeWNsZXMgaW4gY29tcHV0YXRpb24gY2hhaW5zLlxuICogRXhwbGljaXRseSB0eXBlZCBhcyBgYW55YCBzbyB3ZSBjYW4gdXNlIGl0IGFzIHNpZ25hbCdzIHZhbHVlLlxuICovXG5leHBvcnQgY29uc3QgQ09NUFVUSU5HOiBhbnkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKCdDT01QVVRJTkcnKTtcblxuLyoqXG4gKiBBIGRlZGljYXRlZCBzeW1ib2wgdXNlZCBpbiBwbGFjZSBvZiBhIGNvbXB1dGVkIHNpZ25hbCB2YWx1ZSB0byBpbmRpY2F0ZSB0aGF0IGEgZ2l2ZW4gY29tcHV0YXRpb25cbiAqIGZhaWxlZC4gVGhlIHRocm93biBlcnJvciBpcyBjYWNoZWQgdW50aWwgdGhlIGNvbXB1dGF0aW9uIGdldHMgZGlydHkgYWdhaW4uXG4gKiBFeHBsaWNpdGx5IHR5cGVkIGFzIGBhbnlgIHNvIHdlIGNhbiB1c2UgaXQgYXMgc2lnbmFsJ3MgdmFsdWUuXG4gKi9cbmV4cG9ydCBjb25zdCBFUlJPUkVEOiBhbnkgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKCdFUlJPUkVEJyk7XG5cbi8vIE5vdGU6IFVzaW5nIGFuIElJRkUgaGVyZSB0byBlbnN1cmUgdGhhdCB0aGUgc3ByZWFkIGFzc2lnbm1lbnQgaXMgbm90IGNvbnNpZGVyZWRcbi8vIGEgc2lkZS1lZmZlY3QsIGVuZGluZyB1cCBwcmVzZXJ2aW5nIGBDT01QVVRFRF9OT0RFYCBhbmQgYFJFQUNUSVZFX05PREVgLlxuLy8gVE9ETzogcmVtb3ZlIHdoZW4gaHR0cHM6Ly9naXRodWIuY29tL2V2YW53L2VzYnVpbGQvaXNzdWVzLzMzOTIgaXMgcmVzb2x2ZWQuXG5leHBvcnQgY29uc3QgQ09NUFVURURfTk9ERSA9IC8qIEBfX1BVUkVfXyAqLyAoKCkgPT4ge1xuICByZXR1cm4ge1xuICAgIC4uLlJFQUNUSVZFX05PREUsXG4gICAgdmFsdWU6IFVOU0VULFxuICAgIGRpcnR5OiB0cnVlLFxuICAgIGVycm9yOiBudWxsLFxuICAgIGVxdWFsOiBkZWZhdWx0RXF1YWxzLFxuXG4gICAgcHJvZHVjZXJNdXN0UmVjb21wdXRlKG5vZGU6IENvbXB1dGVkTm9kZTx1bmtub3duPik6IGJvb2xlYW4ge1xuICAgICAgLy8gRm9yY2UgYSByZWNvbXB1dGF0aW9uIGlmIHRoZXJlJ3Mgbm8gY3VycmVudCB2YWx1ZSwgb3IgaWYgdGhlIGN1cnJlbnQgdmFsdWUgaXMgaW4gdGhlXG4gICAgICAvLyBwcm9jZXNzIG9mIGJlaW5nIGNhbGN1bGF0ZWQgKHdoaWNoIHNob3VsZCB0aHJvdyBhbiBlcnJvcikuXG4gICAgICByZXR1cm4gbm9kZS52YWx1ZSA9PT0gVU5TRVQgfHwgbm9kZS52YWx1ZSA9PT0gQ09NUFVUSU5HO1xuICAgIH0sXG5cbiAgICBwcm9kdWNlclJlY29tcHV0ZVZhbHVlKG5vZGU6IENvbXB1dGVkTm9kZTx1bmtub3duPik6IHZvaWQge1xuICAgICAgaWYgKG5vZGUudmFsdWUgPT09IENPTVBVVElORykge1xuICAgICAgICAvLyBPdXIgY29tcHV0YXRpb24gc29tZWhvdyBsZWQgdG8gYSBjeWNsaWMgcmVhZCBvZiBpdHNlbGYuXG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRGV0ZWN0ZWQgY3ljbGUgaW4gY29tcHV0YXRpb25zLicpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBvbGRWYWx1ZSA9IG5vZGUudmFsdWU7XG4gICAgICBub2RlLnZhbHVlID0gQ09NUFVUSU5HO1xuXG4gICAgICBjb25zdCBwcmV2Q29uc3VtZXIgPSBjb25zdW1lckJlZm9yZUNvbXB1dGF0aW9uKG5vZGUpO1xuICAgICAgbGV0IG5ld1ZhbHVlOiB1bmtub3duO1xuICAgICAgdHJ5IHtcbiAgICAgICAgbmV3VmFsdWUgPSBub2RlLmNvbXB1dGF0aW9uKCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgbmV3VmFsdWUgPSBFUlJPUkVEO1xuICAgICAgICBub2RlLmVycm9yID0gZXJyO1xuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgY29uc3VtZXJBZnRlckNvbXB1dGF0aW9uKG5vZGUsIHByZXZDb25zdW1lcik7XG4gICAgICB9XG5cbiAgICAgIGlmIChvbGRWYWx1ZSAhPT0gVU5TRVQgJiYgb2xkVmFsdWUgIT09IEVSUk9SRUQgJiYgbmV3VmFsdWUgIT09IEVSUk9SRUQgJiZcbiAgICAgICAgICBub2RlLmVxdWFsKG9sZFZhbHVlLCBuZXdWYWx1ZSkpIHtcbiAgICAgICAgLy8gTm8gY2hhbmdlIHRvIGB2YWx1ZVZlcnNpb25gIC0gb2xkIGFuZCBuZXcgdmFsdWVzIGFyZVxuICAgICAgICAvLyBzZW1hbnRpY2FsbHkgZXF1aXZhbGVudC5cbiAgICAgICAgbm9kZS52YWx1ZSA9IG9sZFZhbHVlO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIG5vZGUudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgIG5vZGUudmVyc2lvbisrO1xuICAgIH0sXG4gIH07XG59KSgpO1xuIl19