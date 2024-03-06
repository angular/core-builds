/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext } from '../../di';
import { OutputEmitterRef } from './output_emitter_ref';
/**
 * The `outputs` function allows declaration of outputs in directives and
 * components.
 *
 * Initializes an output that can emit values to consumers of your
 * directive/component.
 *
 * @usageNotes
 * Initialize an output in your directive by declaring a
 * class field and initializing it with the `output()` function.
 *
 * ```ts
 * @Directive({..})
 * export class MyDir {
 *   nameChange = output<string>();     // OutputEmitterRef<string>
 *   onClick = output();                // OutputEmitterRef<void>
 * }
 * ```
 *
 * @developerPreview
 */
export function output(opts) {
    ngDevMode && assertInInjectionContext(output);
    return new OutputEmitterRef();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXV0aG9yaW5nL291dHB1dC9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBV3REOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSxNQUFNLENBQVcsSUFBb0I7SUFDbkQsU0FBUyxJQUFJLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLE9BQU8sSUFBSSxnQkFBZ0IsRUFBSyxDQUFDO0FBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHR9IGZyb20gJy4uLy4uL2RpJztcblxuaW1wb3J0IHtPdXRwdXRFbWl0dGVyUmVmfSBmcm9tICcuL291dHB1dF9lbWl0dGVyX3JlZic7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgZGVjbGFyaW5nIGFuIG91dHB1dC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIE91dHB1dE9wdGlvbnMge1xuICBhbGlhcz86IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgYG91dHB1dHNgIGZ1bmN0aW9uIGFsbG93cyBkZWNsYXJhdGlvbiBvZiBvdXRwdXRzIGluIGRpcmVjdGl2ZXMgYW5kXG4gKiBjb21wb25lbnRzLlxuICpcbiAqIEluaXRpYWxpemVzIGFuIG91dHB1dCB0aGF0IGNhbiBlbWl0IHZhbHVlcyB0byBjb25zdW1lcnMgb2YgeW91clxuICogZGlyZWN0aXZlL2NvbXBvbmVudC5cbiAqXG4gKiBAdXNhZ2VOb3Rlc1xuICogSW5pdGlhbGl6ZSBhbiBvdXRwdXQgaW4geW91ciBkaXJlY3RpdmUgYnkgZGVjbGFyaW5nIGFcbiAqIGNsYXNzIGZpZWxkIGFuZCBpbml0aWFsaXppbmcgaXQgd2l0aCB0aGUgYG91dHB1dCgpYCBmdW5jdGlvbi5cbiAqXG4gKiBgYGB0c1xuICogQERpcmVjdGl2ZSh7Li59KVxuICogZXhwb3J0IGNsYXNzIE15RGlyIHtcbiAqICAgbmFtZUNoYW5nZSA9IG91dHB1dDxzdHJpbmc+KCk7ICAgICAvLyBPdXRwdXRFbWl0dGVyUmVmPHN0cmluZz5cbiAqICAgb25DbGljayA9IG91dHB1dCgpOyAgICAgICAgICAgICAgICAvLyBPdXRwdXRFbWl0dGVyUmVmPHZvaWQ+XG4gKiB9XG4gKiBgYGBcbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gb3V0cHV0PFQgPSB2b2lkPihvcHRzPzogT3V0cHV0T3B0aW9ucyk6IE91dHB1dEVtaXR0ZXJSZWY8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KG91dHB1dCk7XG4gIHJldHVybiBuZXcgT3V0cHV0RW1pdHRlclJlZjxUPigpO1xufVxuIl19