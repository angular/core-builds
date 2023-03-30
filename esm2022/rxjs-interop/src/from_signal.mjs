/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { assertInInjectionContext, effect, inject, Injector } from '@angular/core';
import { Observable } from 'rxjs';
/**
 * Exposes the value of an Angular `Signal` as an RxJS `Observable`.
 *
 * The signal's value will be propagated into the `Observable`'s subscribers using an `effect`.
 *
 * `fromSignal` must be called in an injection context.
 *
 * @developerPreview
 */
export function fromSignal(source, options) {
    !options?.injector && assertInInjectionContext(fromSignal);
    const injector = options?.injector ?? inject(Injector);
    // Creating a new `Observable` allows the creation of the effect to be lazy. This allows for all
    // references to `source` to be dropped if the `Observable` is fully unsubscribed and thrown away.
    return new Observable(observer => {
        const watcher = effect(() => {
            try {
                observer.next(source());
            }
            catch (err) {
                observer.error(err);
            }
        }, { injector, manualCleanup: true });
        return () => watcher.destroy();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZnJvbV9zaWduYWwuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3J4anMtaW50ZXJvcC9zcmMvZnJvbV9zaWduYWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLHdCQUF3QixFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFTLE1BQU0sZUFBZSxDQUFDO0FBQ3pGLE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFnQmhDOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FDdEIsTUFBaUIsRUFDakIsT0FBMkI7SUFFN0IsQ0FBQyxPQUFPLEVBQUUsUUFBUSxJQUFJLHdCQUF3QixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNELE1BQU0sUUFBUSxHQUFHLE9BQU8sRUFBRSxRQUFRLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRXZELGdHQUFnRztJQUNoRyxrR0FBa0c7SUFDbEcsT0FBTyxJQUFJLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMvQixNQUFNLE9BQU8sR0FBRyxNQUFNLENBQUMsR0FBRyxFQUFFO1lBQzFCLElBQUk7Z0JBQ0YsUUFBUSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO2FBQ3pCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUNyQjtRQUNILENBQUMsRUFBRSxFQUFDLFFBQVEsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztRQUNwQyxPQUFPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUNqQyxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHthc3NlcnRJbkluamVjdGlvbkNvbnRleHQsIGVmZmVjdCwgaW5qZWN0LCBJbmplY3RvciwgU2lnbmFsfSBmcm9tICdAYW5ndWxhci9jb3JlJztcbmltcG9ydCB7T2JzZXJ2YWJsZX0gZnJvbSAncnhqcyc7XG5cbi8qKlxuICogT3B0aW9ucyBmb3IgYGZyb21TaWduYWxgLlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRnJvbVNpZ25hbE9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIHdoZW4gY3JlYXRpbmcgdGhlIGVmZmVjdC5cbiAgICpcbiAgICogSWYgdGhpcyBpc24ndCBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogRXhwb3NlcyB0aGUgdmFsdWUgb2YgYW4gQW5ndWxhciBgU2lnbmFsYCBhcyBhbiBSeEpTIGBPYnNlcnZhYmxlYC5cbiAqXG4gKiBUaGUgc2lnbmFsJ3MgdmFsdWUgd2lsbCBiZSBwcm9wYWdhdGVkIGludG8gdGhlIGBPYnNlcnZhYmxlYCdzIHN1YnNjcmliZXJzIHVzaW5nIGFuIGBlZmZlY3RgLlxuICpcbiAqIGBmcm9tU2lnbmFsYCBtdXN0IGJlIGNhbGxlZCBpbiBhbiBpbmplY3Rpb24gY29udGV4dC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZnJvbVNpZ25hbDxUPihcbiAgICBzb3VyY2U6IFNpZ25hbDxUPixcbiAgICBvcHRpb25zPzogRnJvbVNpZ25hbE9wdGlvbnMsXG4gICAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICFvcHRpb25zPy5pbmplY3RvciAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQoZnJvbVNpZ25hbCk7XG4gIGNvbnN0IGluamVjdG9yID0gb3B0aW9ucz8uaW5qZWN0b3IgPz8gaW5qZWN0KEluamVjdG9yKTtcblxuICAvLyBDcmVhdGluZyBhIG5ldyBgT2JzZXJ2YWJsZWAgYWxsb3dzIHRoZSBjcmVhdGlvbiBvZiB0aGUgZWZmZWN0IHRvIGJlIGxhenkuIFRoaXMgYWxsb3dzIGZvciBhbGxcbiAgLy8gcmVmZXJlbmNlcyB0byBgc291cmNlYCB0byBiZSBkcm9wcGVkIGlmIHRoZSBgT2JzZXJ2YWJsZWAgaXMgZnVsbHkgdW5zdWJzY3JpYmVkIGFuZCB0aHJvd24gYXdheS5cbiAgcmV0dXJuIG5ldyBPYnNlcnZhYmxlKG9ic2VydmVyID0+IHtcbiAgICBjb25zdCB3YXRjaGVyID0gZWZmZWN0KCgpID0+IHtcbiAgICAgIHRyeSB7XG4gICAgICAgIG9ic2VydmVyLm5leHQoc291cmNlKCkpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIG9ic2VydmVyLmVycm9yKGVycik7XG4gICAgICB9XG4gICAgfSwge2luamVjdG9yLCBtYW51YWxDbGVhbnVwOiB0cnVlfSk7XG4gICAgcmV0dXJuICgpID0+IHdhdGNoZXIuZGVzdHJveSgpO1xuICB9KTtcbn1cbiJdfQ==