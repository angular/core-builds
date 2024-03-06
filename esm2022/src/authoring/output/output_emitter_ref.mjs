/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { setActiveConsumer } from '@angular/core/primitives/signals';
import { inject } from '../../di/injector_compatibility';
import { RuntimeError } from '../../errors';
import { DestroyRef } from '../../linker/destroy_ref';
/**
 * An `OutputEmitterRef` is created by the `output()` function and can be
 * used to emit values to consumers of your directive or component.
 *
 * Consumers of your directive/component can bind to the output and
 * subscribe to changes via the bound event syntax. For example:
 *
 * ```html
 * <my-comp (valueChange)="processNewValue($event)" />
 * ```
 *
 * @developerPreview
 */
export class OutputEmitterRef {
    constructor() {
        this.destroyed = false;
        this.listeners = null;
        /** @internal */
        this.destroyRef = inject(DestroyRef);
        // Clean-up all listeners and mark as destroyed upon destroy.
        this.destroyRef.onDestroy(() => {
            this.destroyed = true;
            this.listeners = null;
        });
    }
    subscribe(callback) {
        if (this.destroyed) {
            throw new RuntimeError(953 /* RuntimeErrorCode.OUTPUT_REF_DESTROYED */, ngDevMode &&
                'Unexpected subscription to destroyed `OutputRef`. ' +
                    'The owning directive/component is destroyed.');
        }
        (this.listeners ??= []).push(callback);
        return {
            unsubscribe: () => {
                const idx = this.listeners?.indexOf(callback);
                if (idx !== undefined && idx !== -1) {
                    this.listeners?.splice(idx, 1);
                }
            }
        };
    }
    /** Emits a new value to the output. */
    emit(value) {
        if (this.destroyed) {
            throw new RuntimeError(953 /* RuntimeErrorCode.OUTPUT_REF_DESTROYED */, ngDevMode &&
                'Unexpected emit for destroyed `OutputRef`. ' +
                    'The owning directive/component is destroyed.');
        }
        const previousConsumer = setActiveConsumer(null);
        try {
            // TODO: Run every listener using `try/catch`.
            this.listeners?.forEach(fn => fn(value));
        }
        finally {
            setActiveConsumer(previousConsumer);
        }
    }
}
/** Gets the owning `DestroyRef` for the given output. */
export function getOutputDestroyRef(ref) {
    return ref.destroyRef;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3V0cHV0X2VtaXR0ZXJfcmVmLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvYXV0aG9yaW5nL291dHB1dC9vdXRwdXRfZW1pdHRlcl9yZWYudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sa0NBQWtDLENBQUM7QUFFbkUsT0FBTyxFQUFDLE1BQU0sRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxZQUFZLEVBQW1CLE1BQU0sY0FBYyxDQUFDO0FBQzVELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUlwRDs7Ozs7Ozs7Ozs7O0dBWUc7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lBTzNCO1FBTlEsY0FBUyxHQUFHLEtBQUssQ0FBQztRQUNsQixjQUFTLEdBQW1DLElBQUksQ0FBQztRQUV6RCxnQkFBZ0I7UUFDaEIsZUFBVSxHQUFlLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUcxQyw2REFBNkQ7UUFDN0QsSUFBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQzdCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELFNBQVMsQ0FBQyxRQUE0QjtRQUNwQyxJQUFJLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNuQixNQUFNLElBQUksWUFBWSxrREFFbEIsU0FBUztnQkFDTCxvREFBb0Q7b0JBQ2hELDhDQUE4QyxDQUFDLENBQUM7UUFDOUQsQ0FBQztRQUVELENBQUMsSUFBSSxDQUFDLFNBQVMsS0FBSyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFdkMsT0FBTztZQUNMLFdBQVcsRUFBRSxHQUFHLEVBQUU7Z0JBQ2hCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUM5QyxJQUFJLEdBQUcsS0FBSyxTQUFTLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7b0JBQ3BDLElBQUksQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztnQkFDakMsQ0FBQztZQUNILENBQUM7U0FDRixDQUFDO0lBQ0osQ0FBQztJQUVELHVDQUF1QztJQUN2QyxJQUFJLENBQUMsS0FBUTtRQUNYLElBQUksSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ25CLE1BQU0sSUFBSSxZQUFZLGtEQUVsQixTQUFTO2dCQUNMLDZDQUE2QztvQkFDekMsOENBQThDLENBQUMsQ0FBQztRQUM5RCxDQUFDO1FBRUQsTUFBTSxnQkFBZ0IsR0FBRyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNqRCxJQUFJLENBQUM7WUFDSCw4Q0FBOEM7WUFDOUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztRQUMzQyxDQUFDO2dCQUFTLENBQUM7WUFDVCxpQkFBaUIsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7SUFDSCxDQUFDO0NBQ0Y7QUFFRCx5REFBeUQ7QUFDekQsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEdBQXVCO0lBQ3pELE9BQU8sR0FBRyxDQUFDLFVBQVUsQ0FBQztBQUN4QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7c2V0QWN0aXZlQ29uc3VtZXJ9IGZyb20gJ0Bhbmd1bGFyL2NvcmUvcHJpbWl0aXZlcy9zaWduYWxzJztcblxuaW1wb3J0IHtpbmplY3R9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvckNvZGV9IGZyb20gJy4uLy4uL2Vycm9ycyc7XG5pbXBvcnQge0Rlc3Ryb3lSZWZ9IGZyb20gJy4uLy4uL2xpbmtlci9kZXN0cm95X3JlZic7XG5cbmltcG9ydCB7T3V0cHV0UmVmLCBPdXRwdXRSZWZTdWJzY3JpcHRpb259IGZyb20gJy4vb3V0cHV0X3JlZic7XG5cbi8qKlxuICogQW4gYE91dHB1dEVtaXR0ZXJSZWZgIGlzIGNyZWF0ZWQgYnkgdGhlIGBvdXRwdXQoKWAgZnVuY3Rpb24gYW5kIGNhbiBiZVxuICogdXNlZCB0byBlbWl0IHZhbHVlcyB0byBjb25zdW1lcnMgb2YgeW91ciBkaXJlY3RpdmUgb3IgY29tcG9uZW50LlxuICpcbiAqIENvbnN1bWVycyBvZiB5b3VyIGRpcmVjdGl2ZS9jb21wb25lbnQgY2FuIGJpbmQgdG8gdGhlIG91dHB1dCBhbmRcbiAqIHN1YnNjcmliZSB0byBjaGFuZ2VzIHZpYSB0aGUgYm91bmQgZXZlbnQgc3ludGF4LiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGBodG1sXG4gKiA8bXktY29tcCAodmFsdWVDaGFuZ2UpPVwicHJvY2Vzc05ld1ZhbHVlKCRldmVudClcIiAvPlxuICogYGBgXG4gKlxuICogQGRldmVsb3BlclByZXZpZXdcbiAqL1xuZXhwb3J0IGNsYXNzIE91dHB1dEVtaXR0ZXJSZWY8VD4gaW1wbGVtZW50cyBPdXRwdXRSZWY8VD4ge1xuICBwcml2YXRlIGRlc3Ryb3llZCA9IGZhbHNlO1xuICBwcml2YXRlIGxpc3RlbmVyczogQXJyYXk8KHZhbHVlOiBUKSA9PiB2b2lkPnxudWxsID0gbnVsbDtcblxuICAvKiogQGludGVybmFsICovXG4gIGRlc3Ryb3lSZWY6IERlc3Ryb3lSZWYgPSBpbmplY3QoRGVzdHJveVJlZik7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gQ2xlYW4tdXAgYWxsIGxpc3RlbmVycyBhbmQgbWFyayBhcyBkZXN0cm95ZWQgdXBvbiBkZXN0cm95LlxuICAgIHRoaXMuZGVzdHJveVJlZi5vbkRlc3Ryb3koKCkgPT4ge1xuICAgICAgdGhpcy5kZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgdGhpcy5saXN0ZW5lcnMgPSBudWxsO1xuICAgIH0pO1xuICB9XG5cbiAgc3Vic2NyaWJlKGNhbGxiYWNrOiAodmFsdWU6IFQpID0+IHZvaWQpOiBPdXRwdXRSZWZTdWJzY3JpcHRpb24ge1xuICAgIGlmICh0aGlzLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLk9VVFBVVF9SRUZfREVTVFJPWUVELFxuICAgICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgICAnVW5leHBlY3RlZCBzdWJzY3JpcHRpb24gdG8gZGVzdHJveWVkIGBPdXRwdXRSZWZgLiAnICtcbiAgICAgICAgICAgICAgICAgICdUaGUgb3duaW5nIGRpcmVjdGl2ZS9jb21wb25lbnQgaXMgZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgICh0aGlzLmxpc3RlbmVycyA/Pz0gW10pLnB1c2goY2FsbGJhY2spO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHVuc3Vic2NyaWJlOiAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGlkeCA9IHRoaXMubGlzdGVuZXJzPy5pbmRleE9mKGNhbGxiYWNrKTtcbiAgICAgICAgaWYgKGlkeCAhPT0gdW5kZWZpbmVkICYmIGlkeCAhPT0gLTEpIHtcbiAgICAgICAgICB0aGlzLmxpc3RlbmVycz8uc3BsaWNlKGlkeCwgMSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9XG5cbiAgLyoqIEVtaXRzIGEgbmV3IHZhbHVlIHRvIHRoZSBvdXRwdXQuICovXG4gIGVtaXQodmFsdWU6IFQpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgUnVudGltZUVycm9yQ29kZS5PVVRQVVRfUkVGX0RFU1RST1lFRCxcbiAgICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgICAgJ1VuZXhwZWN0ZWQgZW1pdCBmb3IgZGVzdHJveWVkIGBPdXRwdXRSZWZgLiAnICtcbiAgICAgICAgICAgICAgICAgICdUaGUgb3duaW5nIGRpcmVjdGl2ZS9jb21wb25lbnQgaXMgZGVzdHJveWVkLicpO1xuICAgIH1cblxuICAgIGNvbnN0IHByZXZpb3VzQ29uc3VtZXIgPSBzZXRBY3RpdmVDb25zdW1lcihudWxsKTtcbiAgICB0cnkge1xuICAgICAgLy8gVE9ETzogUnVuIGV2ZXJ5IGxpc3RlbmVyIHVzaW5nIGB0cnkvY2F0Y2hgLlxuICAgICAgdGhpcy5saXN0ZW5lcnM/LmZvckVhY2goZm4gPT4gZm4odmFsdWUpKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldmlvdXNDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG5cbi8qKiBHZXRzIHRoZSBvd25pbmcgYERlc3Ryb3lSZWZgIGZvciB0aGUgZ2l2ZW4gb3V0cHV0LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE91dHB1dERlc3Ryb3lSZWYocmVmOiBPdXRwdXRSZWY8dW5rbm93bj4pOiBEZXN0cm95UmVmfHVuZGVmaW5lZCB7XG4gIHJldHVybiByZWYuZGVzdHJveVJlZjtcbn1cbiJdfQ==