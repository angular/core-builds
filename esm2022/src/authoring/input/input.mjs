/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext } from '../../di';
import { createInputSignal, } from './input_signal';
import { REQUIRED_UNSET_VALUE } from './input_signal_node';
export function inputFunction(initialValue, opts) {
    ngDevMode && assertInInjectionContext(input);
    return createInputSignal(initialValue, opts);
}
export function inputRequiredFunction(opts) {
    ngDevMode && assertInInjectionContext(input);
    return createInputSignal(REQUIRED_UNSET_VALUE, opts);
}
/**
 * The `input` function allows declaration of Angular inputs in directives
 * and components.
 *
 * There are two variants of inputs that can be declared:
 *
 *   1. **Optional inputs** with an initial value.
 *   2. **Required inputs** that consumers need to set.
 *
 * By default, the `input` function will declare optional inputs that
 * always have an initial value. Required inputs can be declared
 * using the `input.required()` function.
 *
 * Inputs are signals. The values of an input are exposed as a `Signal`.
 * The signal always holds the latest value of the input that is bound
 * from the parent.
 *
 * @usageNotes
 * To use signal-based inputs, import `input` from `@angular/core`.
 *
 * ```
 * import {input} from '@angular/core`;
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `input` or `input.required`.
 *
 * ```ts
 * @Component({
 *   ...
 * })
 * export class UserProfileComponent {
 *   firstName = input<string>();             // Signal<string|undefined>
 *   lastName  = input.required<string>();    // Signal<string>
 *   age       = input(0)                     // Signal<number>
 * }
 * ```
 *
 * Inside your component template, you can display values of the inputs
 * by calling the signal.
 *
 * ```html
 * <span>{{firstName()}}</span>
 * ```
 *
 * @developerPreview
 * @initializerApiFunction
 */
export const input = (() => {
    // Note: This may be considered a side-effect, but nothing will depend on
    // this assignment, unless this `input` constant export is accessed. It's a
    // self-contained side effect that is local to the user facing`input` export.
    inputFunction.required = inputRequiredFunction;
    return inputFunction;
})();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5wdXQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9hdXRob3JpbmcvaW5wdXQvaW5wdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxELE9BQU8sRUFDTCxpQkFBaUIsR0FNbEIsTUFBTSxnQkFBZ0IsQ0FBQztBQUN4QixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUV6RCxNQUFNLFVBQVUsYUFBYSxDQUMzQixZQUFvQixFQUNwQixJQUFrQztJQUVsQyxTQUFTLElBQUksd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDN0MsT0FBTyxpQkFBaUIsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELE1BQU0sVUFBVSxxQkFBcUIsQ0FDbkMsSUFBa0M7SUFFbEMsU0FBUyxJQUFJLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzdDLE9BQU8saUJBQWlCLENBQUMsb0JBQTZCLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDaEUsQ0FBQztBQXVERDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0ErQ0c7QUFDSCxNQUFNLENBQUMsTUFBTSxLQUFLLEdBQWtCLENBQUMsR0FBRyxFQUFFO0lBQ3hDLHlFQUF5RTtJQUN6RSwyRUFBMkU7SUFDM0UsNkVBQTZFO0lBQzVFLGFBQXFCLENBQUMsUUFBUSxHQUFHLHFCQUFxQixDQUFDO0lBQ3hELE9BQU8sYUFBZ0YsQ0FBQztBQUMxRixDQUFDLENBQUMsRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0fSBmcm9tICcuLi8uLi9kaSc7XG5cbmltcG9ydCB7XG4gIGNyZWF0ZUlucHV0U2lnbmFsLFxuICBJbnB1dE9wdGlvbnMsXG4gIElucHV0T3B0aW9uc1dpdGhvdXRUcmFuc2Zvcm0sXG4gIElucHV0T3B0aW9uc1dpdGhUcmFuc2Zvcm0sXG4gIElucHV0U2lnbmFsLFxuICBJbnB1dFNpZ25hbFdpdGhUcmFuc2Zvcm0sXG59IGZyb20gJy4vaW5wdXRfc2lnbmFsJztcbmltcG9ydCB7UkVRVUlSRURfVU5TRVRfVkFMVUV9IGZyb20gJy4vaW5wdXRfc2lnbmFsX25vZGUnO1xuXG5leHBvcnQgZnVuY3Rpb24gaW5wdXRGdW5jdGlvbjxSZWFkVCwgV3JpdGVUPihcbiAgaW5pdGlhbFZhbHVlPzogUmVhZFQsXG4gIG9wdHM/OiBJbnB1dE9wdGlvbnM8UmVhZFQsIFdyaXRlVD4sXG4pOiBJbnB1dFNpZ25hbFdpdGhUcmFuc2Zvcm08UmVhZFQgfCB1bmRlZmluZWQsIFdyaXRlVD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KGlucHV0KTtcbiAgcmV0dXJuIGNyZWF0ZUlucHV0U2lnbmFsKGluaXRpYWxWYWx1ZSwgb3B0cyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnB1dFJlcXVpcmVkRnVuY3Rpb248UmVhZFQsIFdyaXRlVCA9IFJlYWRUPihcbiAgb3B0cz86IElucHV0T3B0aW9uczxSZWFkVCwgV3JpdGVUPixcbik6IElucHV0U2lnbmFsV2l0aFRyYW5zZm9ybTxSZWFkVCwgV3JpdGVUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoaW5wdXQpO1xuICByZXR1cm4gY3JlYXRlSW5wdXRTaWduYWwoUkVRVUlSRURfVU5TRVRfVkFMVUUgYXMgbmV2ZXIsIG9wdHMpO1xufVxuXG4vKipcbiAqIFRoZSBgaW5wdXRgIGZ1bmN0aW9uIGFsbG93cyBkZWNsYXJhdGlvbiBvZiBpbnB1dHMgaW4gZGlyZWN0aXZlcyBhbmRcbiAqIGNvbXBvbmVudHMuXG4gKlxuICogVGhlIGZ1bmN0aW9uIGV4cG9zZXMgYW4gQVBJIGZvciBhbHNvIGRlY2xhcmluZyByZXF1aXJlZCBpbnB1dHMgdmlhIHRoZVxuICogYGlucHV0LnJlcXVpcmVkYCBmdW5jdGlvbi5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICogQGRvY3NQcml2YXRlIElnbm9yZWQgYmVjYXVzZSBgaW5wdXRgIGlzIHRoZSBjYW5vbmljYWwgQVBJIGVudHJ5LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIElucHV0RnVuY3Rpb24ge1xuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYW4gaW5wdXQgb2YgdHlwZSBgVGAgd2l0aCBhbiBpbml0aWFsIHZhbHVlIG9mIGB1bmRlZmluZWRgLlxuICAgKiBBbmd1bGFyIHdpbGwgaW1wbGljaXRseSB1c2UgYHVuZGVmaW5lZGAgYXMgaW5pdGlhbCB2YWx1ZS5cbiAgICovXG4gIDxUPigpOiBJbnB1dFNpZ25hbDxUIHwgdW5kZWZpbmVkPjtcbiAgLyoqIERlY2xhcmVzIGFuIGlucHV0IG9mIHR5cGUgYFRgIHdpdGggYW4gZXhwbGljaXQgaW5pdGlhbCB2YWx1ZS4gKi9cbiAgPFQ+KGluaXRpYWxWYWx1ZTogVCwgb3B0cz86IElucHV0T3B0aW9uc1dpdGhvdXRUcmFuc2Zvcm08VD4pOiBJbnB1dFNpZ25hbDxUPjtcbiAgLyoqXG4gICAqIERlY2xhcmVzIGFuIGlucHV0IG9mIHR5cGUgYFRgIHdpdGggYW4gaW5pdGlhbCB2YWx1ZSBhbmQgYSB0cmFuc2Zvcm1cbiAgICogZnVuY3Rpb24uXG4gICAqXG4gICAqIFRoZSBpbnB1dCBhY2NlcHRzIHZhbHVlcyBvZiB0eXBlIGBUcmFuc2Zvcm1UYCBhbmQgdGhlIGdpdmVuXG4gICAqIHRyYW5zZm9ybSBmdW5jdGlvbiB3aWxsIHRyYW5zZm9ybSB0aGUgdmFsdWUgdG8gdHlwZSBgVGAuXG4gICAqL1xuICA8VCwgVHJhbnNmb3JtVD4oXG4gICAgaW5pdGlhbFZhbHVlOiBULFxuICAgIG9wdHM6IElucHV0T3B0aW9uc1dpdGhUcmFuc2Zvcm08VCwgVHJhbnNmb3JtVD4sXG4gICk6IElucHV0U2lnbmFsV2l0aFRyYW5zZm9ybTxULCBUcmFuc2Zvcm1UPjtcblxuICAvKipcbiAgICogSW5pdGlhbGl6ZXMgYSByZXF1aXJlZCBpbnB1dC5cbiAgICpcbiAgICogQ29uc3VtZXJzIG9mIHlvdXIgZGlyZWN0aXZlL2NvbXBvbmVudCBuZWVkIHRvIGJpbmQgdG8gdGhpc1xuICAgKiBpbnB1dC4gSWYgdW5zZXQsIGEgY29tcGlsZSB0aW1lIGVycm9yIHdpbGwgYmUgcmVwb3J0ZWQuXG4gICAqXG4gICAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gICAqL1xuICByZXF1aXJlZDoge1xuICAgIC8qKiBEZWNsYXJlcyBhIHJlcXVpcmVkIGlucHV0IG9mIHR5cGUgYFRgLiAqL1xuICAgIDxUPihvcHRzPzogSW5wdXRPcHRpb25zV2l0aG91dFRyYW5zZm9ybTxUPik6IElucHV0U2lnbmFsPFQ+O1xuICAgIC8qKlxuICAgICAqIERlY2xhcmVzIGEgcmVxdWlyZWQgaW5wdXQgb2YgdHlwZSBgVGAgd2l0aCBhIHRyYW5zZm9ybSBmdW5jdGlvbi5cbiAgICAgKlxuICAgICAqIFRoZSBpbnB1dCBhY2NlcHRzIHZhbHVlcyBvZiB0eXBlIGBUcmFuc2Zvcm1UYCBhbmQgdGhlIGdpdmVuXG4gICAgICogdHJhbnNmb3JtIGZ1bmN0aW9uIHdpbGwgdHJhbnNmb3JtIHRoZSB2YWx1ZSB0byB0eXBlIGBUYC5cbiAgICAgKi9cbiAgICA8VCwgVHJhbnNmb3JtVD4oXG4gICAgICBvcHRzOiBJbnB1dE9wdGlvbnNXaXRoVHJhbnNmb3JtPFQsIFRyYW5zZm9ybVQ+LFxuICAgICk6IElucHV0U2lnbmFsV2l0aFRyYW5zZm9ybTxULCBUcmFuc2Zvcm1UPjtcbiAgfTtcbn1cblxuLyoqXG4gKiBUaGUgYGlucHV0YCBmdW5jdGlvbiBhbGxvd3MgZGVjbGFyYXRpb24gb2YgQW5ndWxhciBpbnB1dHMgaW4gZGlyZWN0aXZlc1xuICogYW5kIGNvbXBvbmVudHMuXG4gKlxuICogVGhlcmUgYXJlIHR3byB2YXJpYW50cyBvZiBpbnB1dHMgdGhhdCBjYW4gYmUgZGVjbGFyZWQ6XG4gKlxuICogICAxLiAqKk9wdGlvbmFsIGlucHV0cyoqIHdpdGggYW4gaW5pdGlhbCB2YWx1ZS5cbiAqICAgMi4gKipSZXF1aXJlZCBpbnB1dHMqKiB0aGF0IGNvbnN1bWVycyBuZWVkIHRvIHNldC5cbiAqXG4gKiBCeSBkZWZhdWx0LCB0aGUgYGlucHV0YCBmdW5jdGlvbiB3aWxsIGRlY2xhcmUgb3B0aW9uYWwgaW5wdXRzIHRoYXRcbiAqIGFsd2F5cyBoYXZlIGFuIGluaXRpYWwgdmFsdWUuIFJlcXVpcmVkIGlucHV0cyBjYW4gYmUgZGVjbGFyZWRcbiAqIHVzaW5nIHRoZSBgaW5wdXQucmVxdWlyZWQoKWAgZnVuY3Rpb24uXG4gKlxuICogSW5wdXRzIGFyZSBzaWduYWxzLiBUaGUgdmFsdWVzIG9mIGFuIGlucHV0IGFyZSBleHBvc2VkIGFzIGEgYFNpZ25hbGAuXG4gKiBUaGUgc2lnbmFsIGFsd2F5cyBob2xkcyB0aGUgbGF0ZXN0IHZhbHVlIG9mIHRoZSBpbnB1dCB0aGF0IGlzIGJvdW5kXG4gKiBmcm9tIHRoZSBwYXJlbnQuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqIFRvIHVzZSBzaWduYWwtYmFzZWQgaW5wdXRzLCBpbXBvcnQgYGlucHV0YCBmcm9tIGBAYW5ndWxhci9jb3JlYC5cbiAqXG4gKiBgYGBcbiAqIGltcG9ydCB7aW5wdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmVgO1xuICogYGBgXG4gKlxuICogSW5zaWRlIHlvdXIgY29tcG9uZW50LCBpbnRyb2R1Y2UgYSBuZXcgY2xhc3MgbWVtYmVyIGFuZCBpbml0aWFsaXplXG4gKiBpdCB3aXRoIGEgY2FsbCB0byBgaW5wdXRgIG9yIGBpbnB1dC5yZXF1aXJlZGAuXG4gKlxuICogYGBgdHNcbiAqIEBDb21wb25lbnQoe1xuICogICAuLi5cbiAqIH0pXG4gKiBleHBvcnQgY2xhc3MgVXNlclByb2ZpbGVDb21wb25lbnQge1xuICogICBmaXJzdE5hbWUgPSBpbnB1dDxzdHJpbmc+KCk7ICAgICAgICAgICAgIC8vIFNpZ25hbDxzdHJpbmd8dW5kZWZpbmVkPlxuICogICBsYXN0TmFtZSAgPSBpbnB1dC5yZXF1aXJlZDxzdHJpbmc+KCk7ICAgIC8vIFNpZ25hbDxzdHJpbmc+XG4gKiAgIGFnZSAgICAgICA9IGlucHV0KDApICAgICAgICAgICAgICAgICAgICAgLy8gU2lnbmFsPG51bWJlcj5cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEluc2lkZSB5b3VyIGNvbXBvbmVudCB0ZW1wbGF0ZSwgeW91IGNhbiBkaXNwbGF5IHZhbHVlcyBvZiB0aGUgaW5wdXRzXG4gKiBieSBjYWxsaW5nIHRoZSBzaWduYWwuXG4gKlxuICogYGBgaHRtbFxuICogPHNwYW4+e3tmaXJzdE5hbWUoKX19PC9zcGFuPlxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqIEBpbml0aWFsaXplckFwaUZ1bmN0aW9uXG4gKi9cbmV4cG9ydCBjb25zdCBpbnB1dDogSW5wdXRGdW5jdGlvbiA9ICgoKSA9PiB7XG4gIC8vIE5vdGU6IFRoaXMgbWF5IGJlIGNvbnNpZGVyZWQgYSBzaWRlLWVmZmVjdCwgYnV0IG5vdGhpbmcgd2lsbCBkZXBlbmQgb25cbiAgLy8gdGhpcyBhc3NpZ25tZW50LCB1bmxlc3MgdGhpcyBgaW5wdXRgIGNvbnN0YW50IGV4cG9ydCBpcyBhY2Nlc3NlZC4gSXQncyBhXG4gIC8vIHNlbGYtY29udGFpbmVkIHNpZGUgZWZmZWN0IHRoYXQgaXMgbG9jYWwgdG8gdGhlIHVzZXIgZmFjaW5nYGlucHV0YCBleHBvcnQuXG4gIChpbnB1dEZ1bmN0aW9uIGFzIGFueSkucmVxdWlyZWQgPSBpbnB1dFJlcXVpcmVkRnVuY3Rpb247XG4gIHJldHVybiBpbnB1dEZ1bmN0aW9uIGFzIHR5cGVvZiBpbnB1dEZ1bmN0aW9uICYge3JlcXVpcmVkOiB0eXBlb2YgaW5wdXRSZXF1aXJlZEZ1bmN0aW9ufTtcbn0pKCk7XG4iXX0=