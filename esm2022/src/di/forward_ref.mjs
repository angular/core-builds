/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getClosureSafeProperty } from '../util/property';
import { stringify } from '../util/stringify';
const __forward_ref__ = getClosureSafeProperty({ __forward_ref__: getClosureSafeProperty });
/**
 * Allows to refer to references which are not yet defined.
 *
 * For instance, `forwardRef` is used when the `token` which we need to refer to for the purposes of
 * DI is declared, but not yet defined. It is also used when the `token` which we use when creating
 * a query is not yet defined.
 *
 * `forwardRef` is also used to break circularities in standalone components imports.
 *
 * @usageNotes
 * ### Circular dependency example
 * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='forward_ref'}
 *
 * ### Circular standalone reference import example
 * ```ts
 * @Component({
 *   standalone: true,
 *   imports: [ChildComponent],
 *   selector: 'app-parent',
 *   template: `<app-child [hideParent]="hideParent"></app-child>`,
 * })
 * export class ParentComponent {
 *   @Input() hideParent: boolean;
 * }
 *
 *
 * @Component({
 *   standalone: true,
 *   imports: [CommonModule, forwardRef(() => ParentComponent)],
 *   selector: 'app-child',
 *   template: `<app-parent *ngIf="!hideParent"></app-parent>`,
 * })
 * export class ChildComponent {
 *   @Input() hideParent: boolean;
 * }
 * ```
 *
 * @publicApi
 */
export function forwardRef(forwardRefFn) {
    forwardRefFn.__forward_ref__ = forwardRef;
    forwardRefFn.toString = function () {
        return stringify(this());
    };
    return forwardRefFn;
}
/**
 * Lazily retrieves the reference value from a forwardRef.
 *
 * Acts as the identity function when given a non-forward-ref value.
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/di/ts/forward_ref/forward_ref_spec.ts region='resolve_forward_ref'}
 *
 * @see {@link forwardRef}
 * @publicApi
 */
export function resolveForwardRef(type) {
    return isForwardRef(type) ? type() : type;
}
/** Checks whether a function is wrapped by a `forwardRef`. */
export function isForwardRef(fn) {
    return typeof fn === 'function' && fn.hasOwnProperty(__forward_ref__) &&
        fn.__forward_ref__ === forwardRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZm9yd2FyZF9yZWYuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9kaS9mb3J3YXJkX3JlZi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7QUFFSCxPQUFPLEVBQUMsc0JBQXNCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUN4RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFpQjVDLE1BQU0sZUFBZSxHQUFHLHNCQUFzQixDQUFDLEVBQUMsZUFBZSxFQUFFLHNCQUFzQixFQUFDLENBQUMsQ0FBQztBQUUxRjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FzQ0c7QUFDSCxNQUFNLFVBQVUsVUFBVSxDQUFJLFlBQTZCO0lBQ25ELFlBQWEsQ0FBQyxlQUFlLEdBQUcsVUFBVSxDQUFDO0lBQzNDLFlBQWEsQ0FBQyxRQUFRLEdBQUc7UUFDN0IsT0FBTyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztJQUMzQixDQUFDLENBQUM7SUFDRixPQUFnQixZQUFhLENBQUM7QUFDaEMsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FBSSxJQUFPO0lBQzFDLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQzVDLENBQUM7QUFFRCw4REFBOEQ7QUFDOUQsTUFBTSxVQUFVLFlBQVksQ0FBQyxFQUFPO0lBQ2xDLE9BQU8sT0FBTyxFQUFFLEtBQUssVUFBVSxJQUFJLEVBQUUsQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDO1FBQ2pFLEVBQUUsQ0FBQyxlQUFlLEtBQUssVUFBVSxDQUFDO0FBQ3hDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSBmcm9tICcuLi91dGlsL3Byb3BlcnR5JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cblxuXG4vKipcbiAqIEFuIGludGVyZmFjZSB0aGF0IGEgZnVuY3Rpb24gcGFzc2VkIGludG8ge0BsaW5rIGZvcndhcmRSZWZ9IGhhcyB0byBpbXBsZW1lbnQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlXG4gKlxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvZm9yd2FyZF9yZWYvZm9yd2FyZF9yZWZfc3BlYy50cyByZWdpb249J2ZvcndhcmRfcmVmX2ZuJ31cbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBGb3J3YXJkUmVmRm48VD4ge1xuICAoKTogVDtcbn1cblxuY29uc3QgX19mb3J3YXJkX3JlZl9fID0gZ2V0Q2xvc3VyZVNhZmVQcm9wZXJ0eSh7X19mb3J3YXJkX3JlZl9fOiBnZXRDbG9zdXJlU2FmZVByb3BlcnR5fSk7XG5cbi8qKlxuICogQWxsb3dzIHRvIHJlZmVyIHRvIHJlZmVyZW5jZXMgd2hpY2ggYXJlIG5vdCB5ZXQgZGVmaW5lZC5cbiAqXG4gKiBGb3IgaW5zdGFuY2UsIGBmb3J3YXJkUmVmYCBpcyB1c2VkIHdoZW4gdGhlIGB0b2tlbmAgd2hpY2ggd2UgbmVlZCB0byByZWZlciB0byBmb3IgdGhlIHB1cnBvc2VzIG9mXG4gKiBESSBpcyBkZWNsYXJlZCwgYnV0IG5vdCB5ZXQgZGVmaW5lZC4gSXQgaXMgYWxzbyB1c2VkIHdoZW4gdGhlIGB0b2tlbmAgd2hpY2ggd2UgdXNlIHdoZW4gY3JlYXRpbmdcbiAqIGEgcXVlcnkgaXMgbm90IHlldCBkZWZpbmVkLlxuICpcbiAqIGBmb3J3YXJkUmVmYCBpcyBhbHNvIHVzZWQgdG8gYnJlYWsgY2lyY3VsYXJpdGllcyBpbiBzdGFuZGFsb25lIGNvbXBvbmVudHMgaW1wb3J0cy5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogIyMjIENpcmN1bGFyIGRlcGVuZGVuY3kgZXhhbXBsZVxuICoge0BleGFtcGxlIGNvcmUvZGkvdHMvZm9yd2FyZF9yZWYvZm9yd2FyZF9yZWZfc3BlYy50cyByZWdpb249J2ZvcndhcmRfcmVmJ31cbiAqXG4gKiAjIyMgQ2lyY3VsYXIgc3RhbmRhbG9uZSByZWZlcmVuY2UgaW1wb3J0IGV4YW1wbGVcbiAqIGBgYHRzXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAqICAgaW1wb3J0czogW0NoaWxkQ29tcG9uZW50XSxcbiAqICAgc2VsZWN0b3I6ICdhcHAtcGFyZW50JyxcbiAqICAgdGVtcGxhdGU6IGA8YXBwLWNoaWxkIFtoaWRlUGFyZW50XT1cImhpZGVQYXJlbnRcIj48L2FwcC1jaGlsZD5gLFxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBQYXJlbnRDb21wb25lbnQge1xuICogICBASW5wdXQoKSBoaWRlUGFyZW50OiBib29sZWFuO1xuICogfVxuICpcbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgc3RhbmRhbG9uZTogdHJ1ZSxcbiAqICAgaW1wb3J0czogW0NvbW1vbk1vZHVsZSwgZm9yd2FyZFJlZigoKSA9PiBQYXJlbnRDb21wb25lbnQpXSxcbiAqICAgc2VsZWN0b3I6ICdhcHAtY2hpbGQnLFxuICogICB0ZW1wbGF0ZTogYDxhcHAtcGFyZW50ICpuZ0lmPVwiIWhpZGVQYXJlbnRcIj48L2FwcC1wYXJlbnQ+YCxcbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgQ2hpbGRDb21wb25lbnQge1xuICogICBASW5wdXQoKSBoaWRlUGFyZW50OiBib29sZWFuO1xuICogfVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9yd2FyZFJlZjxUPihmb3J3YXJkUmVmRm46IEZvcndhcmRSZWZGbjxUPik6IFQge1xuICAoPGFueT5mb3J3YXJkUmVmRm4pLl9fZm9yd2FyZF9yZWZfXyA9IGZvcndhcmRSZWY7XG4gICg8YW55PmZvcndhcmRSZWZGbikudG9TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc3RyaW5naWZ5KHRoaXMoKSk7XG4gIH07XG4gIHJldHVybiAoPFQ+PGFueT5mb3J3YXJkUmVmRm4pO1xufVxuXG4vKipcbiAqIExhemlseSByZXRyaWV2ZXMgdGhlIHJlZmVyZW5jZSB2YWx1ZSBmcm9tIGEgZm9yd2FyZFJlZi5cbiAqXG4gKiBBY3RzIGFzIHRoZSBpZGVudGl0eSBmdW5jdGlvbiB3aGVuIGdpdmVuIGEgbm9uLWZvcndhcmQtcmVmIHZhbHVlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiAjIyMgRXhhbXBsZVxuICpcbiAqIHtAZXhhbXBsZSBjb3JlL2RpL3RzL2ZvcndhcmRfcmVmL2ZvcndhcmRfcmVmX3NwZWMudHMgcmVnaW9uPSdyZXNvbHZlX2ZvcndhcmRfcmVmJ31cbiAqXG4gKiBAc2VlIHtAbGluayBmb3J3YXJkUmVmfVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUZvcndhcmRSZWY8VD4odHlwZTogVCk6IFQge1xuICByZXR1cm4gaXNGb3J3YXJkUmVmKHR5cGUpID8gdHlwZSgpIDogdHlwZTtcbn1cblxuLyoqIENoZWNrcyB3aGV0aGVyIGEgZnVuY3Rpb24gaXMgd3JhcHBlZCBieSBhIGBmb3J3YXJkUmVmYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc0ZvcndhcmRSZWYoZm46IGFueSk6IGZuIGlzKCkgPT4gYW55IHtcbiAgcmV0dXJuIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJyAmJiBmbi5oYXNPd25Qcm9wZXJ0eShfX2ZvcndhcmRfcmVmX18pICYmXG4gICAgICBmbi5fX2ZvcndhcmRfcmVmX18gPT09IGZvcndhcmRSZWY7XG59XG4iXX0=