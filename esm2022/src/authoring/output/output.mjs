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
 * The `output` function allows declaration of Angular outputs in
 * directives and components.
 *
 * You can use outputs to emit values to parent directives and component.
 * Parents can subscribe to changes via:
 *
 * - template event bindings. For example, `(myOutput)="doSomething($event)"`
 * - programmatic subscription by using `OutputRef#subscribe`.
 *
 * @usageNotes
 *
 * To use `output()`, import the function from `@angular/core`.
 *
 * ```ts
 * import {output} from '@angular/core';
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `output`.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   nameChange = output<string>();    // OutputEmitterRef<string>
 *   onClick    = output();            // OutputEmitterRef<void>
 * }
 * ```
 *
 * You can emit values to consumers of your directive, by using
 * the `emit` method from `OutputEmitterRef`.
 *
 * ```ts
 * updateName(newName: string): void {
 *   this.nameChange.emit(newName);
 * }
 * ```
 *
 * @developerPreview
 * @initializerApiFunction {"showTypesInSignaturePreview": true}
 */
export function output(opts) {
    ngDevMode && assertInInjectionContext(output);
    return new OutputEmitterRef();
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXV0aG9yaW5nL291dHB1dC9vdXRwdXQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRWxELE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBV3REOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQ0c7QUFDSCxNQUFNLFVBQVUsTUFBTSxDQUFXLElBQW9CO0lBQ25ELFNBQVMsSUFBSSx3QkFBd0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUM5QyxPQUFPLElBQUksZ0JBQWdCLEVBQUssQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7YXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0fSBmcm9tICcuLi8uLi9kaSc7XG5cbmltcG9ydCB7T3V0cHV0RW1pdHRlclJlZn0gZnJvbSAnLi9vdXRwdXRfZW1pdHRlcl9yZWYnO1xuXG4vKipcbiAqIE9wdGlvbnMgZm9yIGRlY2xhcmluZyBhbiBvdXRwdXQuXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBPdXRwdXRPcHRpb25zIHtcbiAgYWxpYXM/OiBzdHJpbmc7XG59XG5cbi8qKlxuICogVGhlIGBvdXRwdXRgIGZ1bmN0aW9uIGFsbG93cyBkZWNsYXJhdGlvbiBvZiBBbmd1bGFyIG91dHB1dHMgaW5cbiAqIGRpcmVjdGl2ZXMgYW5kIGNvbXBvbmVudHMuXG4gKlxuICogWW91IGNhbiB1c2Ugb3V0cHV0cyB0byBlbWl0IHZhbHVlcyB0byBwYXJlbnQgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50LlxuICogUGFyZW50cyBjYW4gc3Vic2NyaWJlIHRvIGNoYW5nZXMgdmlhOlxuICpcbiAqIC0gdGVtcGxhdGUgZXZlbnQgYmluZGluZ3MuIEZvciBleGFtcGxlLCBgKG15T3V0cHV0KT1cImRvU29tZXRoaW5nKCRldmVudClcImBcbiAqIC0gcHJvZ3JhbW1hdGljIHN1YnNjcmlwdGlvbiBieSB1c2luZyBgT3V0cHV0UmVmI3N1YnNjcmliZWAuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqXG4gKiBUbyB1c2UgYG91dHB1dCgpYCwgaW1wb3J0IHRoZSBmdW5jdGlvbiBmcm9tIGBAYW5ndWxhci9jb3JlYC5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHtvdXRwdXR9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuICogYGBgXG4gKlxuICogSW5zaWRlIHlvdXIgY29tcG9uZW50LCBpbnRyb2R1Y2UgYSBuZXcgY2xhc3MgbWVtYmVyIGFuZCBpbml0aWFsaXplXG4gKiBpdCB3aXRoIGEgY2FsbCB0byBgb3V0cHV0YC5cbiAqXG4gKiBgYGB0c1xuICogQERpcmVjdGl2ZSh7XG4gKiAgIC4uLlxuICogfSlcbiAqIGV4cG9ydCBjbGFzcyBNeURpciB7XG4gKiAgIG5hbWVDaGFuZ2UgPSBvdXRwdXQ8c3RyaW5nPigpOyAgICAvLyBPdXRwdXRFbWl0dGVyUmVmPHN0cmluZz5cbiAqICAgb25DbGljayAgICA9IG91dHB1dCgpOyAgICAgICAgICAgIC8vIE91dHB1dEVtaXR0ZXJSZWY8dm9pZD5cbiAqIH1cbiAqIGBgYFxuICpcbiAqIFlvdSBjYW4gZW1pdCB2YWx1ZXMgdG8gY29uc3VtZXJzIG9mIHlvdXIgZGlyZWN0aXZlLCBieSB1c2luZ1xuICogdGhlIGBlbWl0YCBtZXRob2QgZnJvbSBgT3V0cHV0RW1pdHRlclJlZmAuXG4gKlxuICogYGBgdHNcbiAqIHVwZGF0ZU5hbWUobmV3TmFtZTogc3RyaW5nKTogdm9pZCB7XG4gKiAgIHRoaXMubmFtZUNoYW5nZS5lbWl0KG5ld05hbWUpO1xuICogfVxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqIEBpbml0aWFsaXplckFwaUZ1bmN0aW9uIHtcInNob3dUeXBlc0luU2lnbmF0dXJlUHJldmlld1wiOiB0cnVlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gb3V0cHV0PFQgPSB2b2lkPihvcHRzPzogT3V0cHV0T3B0aW9ucyk6IE91dHB1dEVtaXR0ZXJSZWY8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5JbmplY3Rpb25Db250ZXh0KG91dHB1dCk7XG4gIHJldHVybiBuZXcgT3V0cHV0RW1pdHRlclJlZjxUPigpO1xufVxuIl19