/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { COMPUTED_NODE, UNSET } from '@angular/core/primitives/signals';
import { setPureFunctionsEnabled } from '../pure_function';
export const BRAND_WRITE_TYPE = /* @__PURE__ */ Symbol();
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
export const INPUT_SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...COMPUTED_NODE,
        // Input-signal specific defaults.
        isInitialized: false,
        transform: value => value,
        // Overrides from the computed node.
        // TODO: Should we change `ComputedNode` somehow to not rely on context (seems rather brittle).
        computation: function () {
            if (!this.isInitialized) {
                // TODO: Make this a proper RuntimeError
                throw new Error(`InputSignal not yet initialized`);
            }
            if (this._boundComputation !== undefined) {
                // TODO(signals): Do we need this?
                // Disable pure function memoization when running computations of input signals.
                // ---
                // Bound computations are generated with instructions in place to memoize allocations like
                // object literals, or for pipe transformations. Such operations do not need to be memoized
                // in input computations as the `InputSignal` naturally memoizes the whole expression.
                const prevPureFunctionsEnabled = setPureFunctionsEnabled(false);
                try {
                    return this.transform(this._boundComputation());
                }
                finally {
                    setPureFunctionsEnabled(prevPureFunctionsEnabled);
                }
            }
            // Alternatively, if there no bound computation, we use the bound value.
            return this.transform(this._boundValue);
        },
        bind: function (node, value) {
            // TODO(signals): perf]
            node._boundComputation = value.computation;
            node._boundValue = value.value;
            // TODO: Do we need to switch between bound values/computation.
            node.dirty = true;
            node.value = UNSET;
        },
    };
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXRfc2lnbmFsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9yZWFjdGl2aXR5L2lucHV0X3NpZ25hbC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFHSCxPQUFPLEVBQUMsYUFBYSxFQUFnQixLQUFLLEVBQUMsTUFBTSxrQ0FBa0MsQ0FBQztBQUVwRixPQUFPLEVBQUMsdUJBQXVCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUl6RCxNQUFNLENBQUMsTUFBTSxnQkFBZ0IsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7QUEwQ3pELGtGQUFrRjtBQUNsRiwyRUFBMkU7QUFDM0UsOEVBQThFO0FBQzlFLE1BQU0sQ0FBQyxNQUFNLGlCQUFpQixHQUFzQyxlQUFlLENBQUMsQ0FBQyxHQUFHLEVBQUU7SUFDeEYsT0FBTztRQUNMLEdBQUcsYUFBYTtRQUVoQixrQ0FBa0M7UUFDbEMsYUFBYSxFQUFFLEtBQUs7UUFDcEIsU0FBUyxFQUFFLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSztRQUV6QixvQ0FBb0M7UUFDcEMsK0ZBQStGO1FBQy9GLFdBQVcsRUFBRTtZQUNYLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxFQUFFO2dCQUN2Qix3Q0FBd0M7Z0JBQ3hDLE1BQU0sSUFBSSxLQUFLLENBQUMsaUNBQWlDLENBQUMsQ0FBQzthQUNwRDtZQUVELElBQUksSUFBSSxDQUFDLGlCQUFpQixLQUFLLFNBQVMsRUFBRTtnQkFDeEMsa0NBQWtDO2dCQUNsQyxnRkFBZ0Y7Z0JBQ2hGLE1BQU07Z0JBQ04sMEZBQTBGO2dCQUMxRiwyRkFBMkY7Z0JBQzNGLHNGQUFzRjtnQkFDdEYsTUFBTSx3QkFBd0IsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDaEUsSUFBSTtvQkFDRixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQztpQkFDakQ7d0JBQVM7b0JBQ1IsdUJBQXVCLENBQUMsd0JBQXdCLENBQUMsQ0FBQztpQkFDbkQ7YUFDRjtZQUVELHdFQUF3RTtZQUN4RSxPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFFRCxJQUFJLEVBQUUsVUFDRixJQUFvQyxFQUFFLEtBQW1EO1lBQzNGLHVCQUF1QjtZQUN2QixJQUFJLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLFdBQVcsQ0FBQztZQUMzQyxJQUFJLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFFL0IsK0RBQStEO1lBQy9ELElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1lBQ2xCLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3JCLENBQUM7S0FDRixDQUFDO0FBQ0osQ0FBQyxDQUFDLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5cbmltcG9ydCB7Q09NUFVURURfTk9ERSwgQ29tcHV0ZWROb2RlLCBVTlNFVH0gZnJvbSAnQGFuZ3VsYXIvY29yZS9wcmltaXRpdmVzL3NpZ25hbHMnO1xuXG5pbXBvcnQge3NldFB1cmVGdW5jdGlvbnNFbmFibGVkfSBmcm9tICcuLi9wdXJlX2Z1bmN0aW9uJztcblxuaW1wb3J0IHtTaWduYWx9IGZyb20gJy4vYXBpJztcblxuZXhwb3J0IGNvbnN0IEJSQU5EX1dSSVRFX1RZUEUgPSAvKiBAX19QVVJFX18gKi8gU3ltYm9sKCk7XG5cbi8qKlxuICogQSBgU2lnbmFsYCByZXByZXNlbnRpbmcgYSBjb21wb25lbnQgb3IgZGlyZWN0aXZlIGlucHV0LlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBhIGBTaWduYWxgLCBleGNlcHQgaXQgYWxzbyBjYXJyaWVzIHR5cGUgaW5mb3JtYXRpb24gYWJvdXQgdGhlXG4gKi9cbmV4cG9ydCB0eXBlIElucHV0U2lnbmFsPFJlYWRULCBXcml0ZVQ+ID0gU2lnbmFsPFJlYWRUPiZ7XG4gIFtCUkFORF9XUklURV9UWVBFXTogV3JpdGVUO1xufTtcblxuLy8gVE9ETyhzaWduYWxzKVxuZXhwb3J0IHR5cGUgybXJtUdldElucHV0U2lnbmFsV3JpdGVUeXBlPFQ+ID0gVCBleHRlbmRzIElucHV0U2lnbmFsPGFueSwgaW5mZXIgWD4/IFggOiBuZXZlcjtcblxuZXhwb3J0IGludGVyZmFjZSBJbnB1dFNpZ25hbE5vZGU8UmVhZFQsIFdyaXRlVD4gZXh0ZW5kcyBDb21wdXRlZE5vZGU8UmVhZFQ+IHtcbiAgLyoqXG4gICAqIFdoZXRoZXIgdGhlIGlucHV0IHNpZ25hbCBpcyBpbml0aWFsaXplZC4gSWYgbm90LCBhY2Nlc3NpbmcgdGhlIG5vZGUgcmVzdWx0cyBpbiBhbiBlcnJvci5cbiAgICpcbiAgICogV2Ugc3VwcG9ydCB0aGlzIHRvIGVuYWJsZSByZXF1aXJlZCBpbnB1dHMgd2hpY2ggbWF5IGJlIHNldCBsYXRlciwgYnV0IHNob3VsZCBub3QgYmUgYWNjZXNzZWRcbiAgICogYmVmb3JlIGFzIHRoZXJlIGlzIG5vIG1lYW5pbmdmdWwgdmFsdWUgYW5kIHRoaXMgdXN1YWxseSBpbmRpY2F0ZXMgaW5jb3JyZWN0IHVzZXIgY29kZS5cbiAgICovXG4gIGlzSW5pdGlhbGl6ZWQ6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIFRoZSBjb21wdXRhdGlvbiB0byB3aGljaCB0aGUgaW5wdXQgaXMgY3VycmVudGx5IGJvdW5kLiBBbiBpbnB1dCBzaWduYWwgaXMgY29tbW9ubHlcbiAgICogYm91bmQgdG8gYSBjb21wdXRhdGlvbiBpZiBhIHBhcmVudCBzaWduYWwgY29tcG9uZW50IGJpbmRzIHRvIHRoZSBpbnB1dC5cbiAgICovXG4gIF9ib3VuZENvbXB1dGF0aW9uPzogKCgpID0+IFdyaXRlVCk7XG5cbiAgLyoqXG4gICAqIEFuIGlucHV0IHNpZ25hbCBjYW4gaG9sZCBhIGRpcmVjdGx5IGJvdW5kIHZhbHVlLiBUaGlzIGlzIHVzZWQgd2hlbiBlLmcuIFpvbmUgY29tcG9uZW50c1xuICAgKiBjaGFuZ2UgaW5wdXQgc2lnbmFsIHZhbHVlcy5cbiAgICovXG4gIF9ib3VuZFZhbHVlPzogV3JpdGVUO1xuXG4gIGJpbmQobm9kZTogdGhpcywgdmFsdWU6IHt2YWx1ZT86IFdyaXRlVCwgY29tcHV0YXRpb24/OiAoKSA9PiBXcml0ZVR9KTogdm9pZDtcblxuICAvKiogVHJhbnNmb3JtIGZ1bmN0aW9uIHRoYXQgaXMgcnVuIHdoZW5ldmVyIHRoZSBub2RlIHZhbHVlIGlzIHJldHJpZXZlZC4gKi9cbiAgLy8gVE9ETzogZG8gd2UgbmVlZCB0byBtZW1vaXplXG4gIHRyYW5zZm9ybTogKHZhbHVlOiBXcml0ZVQpID0+IFJlYWRUO1xufVxuXG4vLyBOb3RlOiBVc2luZyBhbiBJSUZFIGhlcmUgdG8gZW5zdXJlIHRoYXQgdGhlIHNwcmVhZCBhc3NpZ25tZW50IGlzIG5vdCBjb25zaWRlcmVkXG4vLyBhIHNpZGUtZWZmZWN0LCBlbmRpbmcgdXAgcHJlc2VydmluZyBgQ09NUFVURURfTk9ERWAgYW5kIGBSRUFDVElWRV9OT0RFYC5cbi8vIFRPRE86IHJlbW92ZSB3aGVuIGh0dHBzOi8vZ2l0aHViLmNvbS9ldmFudy9lc2J1aWxkL2lzc3Vlcy8zMzkyIGlzIHJlc29sdmVkLlxuZXhwb3J0IGNvbnN0IElOUFVUX1NJR05BTF9OT0RFOiBJbnB1dFNpZ25hbE5vZGU8dW5rbm93biwgdW5rbm93bj4gPSAvKiBAX19QVVJFX18gKi8gKCgpID0+IHtcbiAgcmV0dXJuIHtcbiAgICAuLi5DT01QVVRFRF9OT0RFLFxuXG4gICAgLy8gSW5wdXQtc2lnbmFsIHNwZWNpZmljIGRlZmF1bHRzLlxuICAgIGlzSW5pdGlhbGl6ZWQ6IGZhbHNlLFxuICAgIHRyYW5zZm9ybTogdmFsdWUgPT4gdmFsdWUsXG5cbiAgICAvLyBPdmVycmlkZXMgZnJvbSB0aGUgY29tcHV0ZWQgbm9kZS5cbiAgICAvLyBUT0RPOiBTaG91bGQgd2UgY2hhbmdlIGBDb21wdXRlZE5vZGVgIHNvbWVob3cgdG8gbm90IHJlbHkgb24gY29udGV4dCAoc2VlbXMgcmF0aGVyIGJyaXR0bGUpLlxuICAgIGNvbXB1dGF0aW9uOiBmdW5jdGlvbih0aGlzOiBJbnB1dFNpZ25hbE5vZGU8dW5rbm93biwgdW5rbm93bj4pIHtcbiAgICAgIGlmICghdGhpcy5pc0luaXRpYWxpemVkKSB7XG4gICAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBhIHByb3BlciBSdW50aW1lRXJyb3JcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnB1dFNpZ25hbCBub3QgeWV0IGluaXRpYWxpemVkYCk7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLl9ib3VuZENvbXB1dGF0aW9uICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgLy8gVE9ETyhzaWduYWxzKTogRG8gd2UgbmVlZCB0aGlzP1xuICAgICAgICAvLyBEaXNhYmxlIHB1cmUgZnVuY3Rpb24gbWVtb2l6YXRpb24gd2hlbiBydW5uaW5nIGNvbXB1dGF0aW9ucyBvZiBpbnB1dCBzaWduYWxzLlxuICAgICAgICAvLyAtLS1cbiAgICAgICAgLy8gQm91bmQgY29tcHV0YXRpb25zIGFyZSBnZW5lcmF0ZWQgd2l0aCBpbnN0cnVjdGlvbnMgaW4gcGxhY2UgdG8gbWVtb2l6ZSBhbGxvY2F0aW9ucyBsaWtlXG4gICAgICAgIC8vIG9iamVjdCBsaXRlcmFscywgb3IgZm9yIHBpcGUgdHJhbnNmb3JtYXRpb25zLiBTdWNoIG9wZXJhdGlvbnMgZG8gbm90IG5lZWQgdG8gYmUgbWVtb2l6ZWRcbiAgICAgICAgLy8gaW4gaW5wdXQgY29tcHV0YXRpb25zIGFzIHRoZSBgSW5wdXRTaWduYWxgIG5hdHVyYWxseSBtZW1vaXplcyB0aGUgd2hvbGUgZXhwcmVzc2lvbi5cbiAgICAgICAgY29uc3QgcHJldlB1cmVGdW5jdGlvbnNFbmFibGVkID0gc2V0UHVyZUZ1bmN0aW9uc0VuYWJsZWQoZmFsc2UpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHJldHVybiB0aGlzLnRyYW5zZm9ybSh0aGlzLl9ib3VuZENvbXB1dGF0aW9uKCkpO1xuICAgICAgICB9IGZpbmFsbHkge1xuICAgICAgICAgIHNldFB1cmVGdW5jdGlvbnNFbmFibGVkKHByZXZQdXJlRnVuY3Rpb25zRW5hYmxlZCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQWx0ZXJuYXRpdmVseSwgaWYgdGhlcmUgbm8gYm91bmQgY29tcHV0YXRpb24sIHdlIHVzZSB0aGUgYm91bmQgdmFsdWUuXG4gICAgICByZXR1cm4gdGhpcy50cmFuc2Zvcm0odGhpcy5fYm91bmRWYWx1ZSk7XG4gICAgfSxcblxuICAgIGJpbmQ6IGZ1bmN0aW9uPFJlYWRULCBXcml0ZVQ+KFxuICAgICAgICBub2RlOiBJbnB1dFNpZ25hbE5vZGU8UmVhZFQsIFdyaXRlVD4sIHZhbHVlOiB7dmFsdWU/OiBXcml0ZVQsIGNvbXB1dGF0aW9uPzogKCkgPT4gV3JpdGVUfSkge1xuICAgICAgLy8gVE9ETyhzaWduYWxzKTogcGVyZl1cbiAgICAgIG5vZGUuX2JvdW5kQ29tcHV0YXRpb24gPSB2YWx1ZS5jb21wdXRhdGlvbjtcbiAgICAgIG5vZGUuX2JvdW5kVmFsdWUgPSB2YWx1ZS52YWx1ZTtcblxuICAgICAgLy8gVE9ETzogRG8gd2UgbmVlZCB0byBzd2l0Y2ggYmV0d2VlbiBib3VuZCB2YWx1ZXMvY29tcHV0YXRpb24uXG4gICAgICBub2RlLmRpcnR5ID0gdHJ1ZTtcbiAgICAgIG5vZGUudmFsdWUgPSBVTlNFVDtcbiAgICB9LFxuICB9O1xufSkoKTtcbiJdfQ==