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
 * `toObservable` must be called in an injection context.
 *
 * @developerPreview
 */
export function toObservable(source, options) {
    !options?.injector && assertInInjectionContext(toObservable);
    const injector = options?.injector ?? inject(Injector);
    // Creating a new `Observable` allows the creation of the effect to be lazy. This allows for all
    // references to `source` to be dropped if the `Observable` is fully unsubscribed and thrown away.
    return new Observable(observer => {
        const watcher = effect(() => {
            let value;
            try {
                value = source();
            }
            catch (err) {
                observer.error(err);
                return;
            }
            observer.next(value);
        }, { injector, manualCleanup: true, allowSignalWrites: true });
        return () => watcher.destroy();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9fb2JzZXJ2YWJsZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvcnhqcy1pbnRlcm9wL3NyYy90b19vYnNlcnZhYmxlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBUyxNQUFNLGVBQWUsQ0FBQztBQUN6RixPQUFPLEVBQUMsVUFBVSxFQUFDLE1BQU0sTUFBTSxDQUFDO0FBZ0JoQzs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQ3hCLE1BQWlCLEVBQ2pCLE9BQTZCO0lBRS9CLENBQUMsT0FBTyxFQUFFLFFBQVEsSUFBSSx3QkFBd0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUM3RCxNQUFNLFFBQVEsR0FBRyxPQUFPLEVBQUUsUUFBUSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUV2RCxnR0FBZ0c7SUFDaEcsa0dBQWtHO0lBQ2xHLE9BQU8sSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDL0IsTUFBTSxPQUFPLEdBQUcsTUFBTSxDQUFDLEdBQUcsRUFBRTtZQUMxQixJQUFJLEtBQVEsQ0FBQztZQUNiLElBQUk7Z0JBQ0YsS0FBSyxHQUFHLE1BQU0sRUFBRSxDQUFDO2FBQ2xCO1lBQUMsT0FBTyxHQUFHLEVBQUU7Z0JBQ1osUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEIsT0FBTzthQUNSO1lBQ0QsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QixDQUFDLEVBQUUsRUFBQyxRQUFRLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1FBQzdELE9BQU8sR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO0lBQ2pDLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2Fzc2VydEluSW5qZWN0aW9uQ29udGV4dCwgZWZmZWN0LCBpbmplY3QsIEluamVjdG9yLCBTaWduYWx9IGZyb20gJ0Bhbmd1bGFyL2NvcmUnO1xuaW1wb3J0IHtPYnNlcnZhYmxlfSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBPcHRpb25zIGZvciBgdG9PYnNlcnZhYmxlYC5cbiAqXG4gKiBAZGV2ZWxvcGVyUHJldmlld1xuICovXG5leHBvcnQgaW50ZXJmYWNlIHRvT2JzZXJ2YWJsZU9wdGlvbnMge1xuICAvKipcbiAgICogVGhlIGBJbmplY3RvcmAgdG8gdXNlIHdoZW4gY3JlYXRpbmcgdGhlIGVmZmVjdC5cbiAgICpcbiAgICogSWYgdGhpcyBpc24ndCBzcGVjaWZpZWQsIHRoZSBjdXJyZW50IGluamVjdGlvbiBjb250ZXh0IHdpbGwgYmUgdXNlZC5cbiAgICovXG4gIGluamVjdG9yPzogSW5qZWN0b3I7XG59XG5cbi8qKlxuICogRXhwb3NlcyB0aGUgdmFsdWUgb2YgYW4gQW5ndWxhciBgU2lnbmFsYCBhcyBhbiBSeEpTIGBPYnNlcnZhYmxlYC5cbiAqXG4gKiBUaGUgc2lnbmFsJ3MgdmFsdWUgd2lsbCBiZSBwcm9wYWdhdGVkIGludG8gdGhlIGBPYnNlcnZhYmxlYCdzIHN1YnNjcmliZXJzIHVzaW5nIGFuIGBlZmZlY3RgLlxuICpcbiAqIGB0b09ic2VydmFibGVgIG11c3QgYmUgY2FsbGVkIGluIGFuIGluamVjdGlvbiBjb250ZXh0LlxuICpcbiAqIEBkZXZlbG9wZXJQcmV2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b09ic2VydmFibGU8VD4oXG4gICAgc291cmNlOiBTaWduYWw8VD4sXG4gICAgb3B0aW9ucz86IHRvT2JzZXJ2YWJsZU9wdGlvbnMsXG4gICAgKTogT2JzZXJ2YWJsZTxUPiB7XG4gICFvcHRpb25zPy5pbmplY3RvciAmJiBhc3NlcnRJbkluamVjdGlvbkNvbnRleHQodG9PYnNlcnZhYmxlKTtcbiAgY29uc3QgaW5qZWN0b3IgPSBvcHRpb25zPy5pbmplY3RvciA/PyBpbmplY3QoSW5qZWN0b3IpO1xuXG4gIC8vIENyZWF0aW5nIGEgbmV3IGBPYnNlcnZhYmxlYCBhbGxvd3MgdGhlIGNyZWF0aW9uIG9mIHRoZSBlZmZlY3QgdG8gYmUgbGF6eS4gVGhpcyBhbGxvd3MgZm9yIGFsbFxuICAvLyByZWZlcmVuY2VzIHRvIGBzb3VyY2VgIHRvIGJlIGRyb3BwZWQgaWYgdGhlIGBPYnNlcnZhYmxlYCBpcyBmdWxseSB1bnN1YnNjcmliZWQgYW5kIHRocm93biBhd2F5LlxuICByZXR1cm4gbmV3IE9ic2VydmFibGUob2JzZXJ2ZXIgPT4ge1xuICAgIGNvbnN0IHdhdGNoZXIgPSBlZmZlY3QoKCkgPT4ge1xuICAgICAgbGV0IHZhbHVlOiBUO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdmFsdWUgPSBzb3VyY2UoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBvYnNlcnZlci5lcnJvcihlcnIpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBvYnNlcnZlci5uZXh0KHZhbHVlKTtcbiAgICB9LCB7aW5qZWN0b3IsIG1hbnVhbENsZWFudXA6IHRydWUsIGFsbG93U2lnbmFsV3JpdGVzOiB0cnVlfSk7XG4gICAgcmV0dXJuICgpID0+IHdhdGNoZXIuZGVzdHJveSgpO1xuICB9KTtcbn1cbiJdfQ==