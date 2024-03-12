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
 * The `output` function allows declaration of outputs in directives and
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXV0aG9yaW5nL291dHB1dC9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBV3REOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSxNQUFNLENBQVcsSUFBb0I7SUFDbkQsU0FBUyxJQUFJLHdCQUF3QixDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQzlDLE9BQU8sSUFBSSxnQkFBZ0IsRUFBSyxDQUFDO0FBQ25DLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHR9IGZyb20gJy4uLy4uL2RpJztcblxuaW1wb3J0IHtPdXRwdXRFbWl0dGVyUmVmfSBmcm9tICcuL291dHB1dF9lbWl0dGVyX3JlZic7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgZGVjbGFyaW5nIGFuIG91dHB1dC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIE91dHB1dE9wdGlvbnMge1xuICBhbGlhcz86IHN0cmluZztcbn1cblxuLyoqXG4gKiBUaGUgYG91dHB1dGAgZnVuY3Rpb24gYWxsb3dzIGRlY2xhcmF0aW9uIG9mIG91dHB1dHMgaW4gZGlyZWN0aXZlcyBhbmRcbiAqIGNvbXBvbmVudHMuXG4gKlxuICogSW5pdGlhbGl6ZXMgYW4gb3V0cHV0IHRoYXQgY2FuIGVtaXQgdmFsdWVzIHRvIGNvbnN1bWVycyBvZiB5b3VyXG4gKiBkaXJlY3RpdmUvY29tcG9uZW50LlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKiBJbml0aWFsaXplIGFuIG91dHB1dCBpbiB5b3VyIGRpcmVjdGl2ZSBieSBkZWNsYXJpbmcgYVxuICogY2xhc3MgZmllbGQgYW5kIGluaXRpYWxpemluZyBpdCB3aXRoIHRoZSBgb3V0cHV0KClgIGZ1bmN0aW9uLlxuICpcbiAqIGBgYHRzXG4gKiBARGlyZWN0aXZlKHsuLn0pXG4gKiBleHBvcnQgY2xhc3MgTXlEaXIge1xuICogICBuYW1lQ2hhbmdlID0gb3V0cHV0PHN0cmluZz4oKTsgICAgIC8vIE91dHB1dEVtaXR0ZXJSZWY8c3RyaW5nPlxuICogICBvbkNsaWNrID0gb3V0cHV0KCk7ICAgICAgICAgICAgICAgIC8vIE91dHB1dEVtaXR0ZXJSZWY8dm9pZD5cbiAqIH1cbiAqIGBgYFxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBvdXRwdXQ8VCA9IHZvaWQ+KG9wdHM/OiBPdXRwdXRPcHRpb25zKTogT3V0cHV0RW1pdHRlclJlZjxUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQob3V0cHV0KTtcbiAgcmV0dXJuIG5ldyBPdXRwdXRFbWl0dGVyUmVmPFQ+KCk7XG59XG4iXX0=