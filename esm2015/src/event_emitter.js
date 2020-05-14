/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/event_emitter.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/// <reference types="rxjs" />
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="rxjs" />
import { Subject, Subscription } from 'rxjs';
// WARNING: interface has both a type and a value, skipping emit
class EventEmitter_ extends Subject {
    // tslint:disable-line
    /**
     * @param {?=} isAsync
     */
    constructor(isAsync = false) {
        super();
        this.__isAsync = isAsync;
    }
    /**
     * @param {?=} value
     * @return {?}
     */
    emit(value) {
        super.next(value);
    }
    /**
     * @param {?=} generatorOrNext
     * @param {?=} error
     * @param {?=} complete
     * @return {?}
     */
    subscribe(generatorOrNext, error, complete) {
        /** @type {?} */
        let schedulerFn;
        /** @type {?} */
        let errorFn = (/**
         * @param {?} err
         * @return {?}
         */
        (err) => null);
        /** @type {?} */
        let completeFn = (/**
         * @return {?}
         */
        () => null);
        if (generatorOrNext && typeof generatorOrNext === 'object') {
            schedulerFn = this.__isAsync ? (/**
             * @param {?} value
             * @return {?}
             */
            (value) => {
                setTimeout((/**
                 * @return {?}
                 */
                () => generatorOrNext.next(value)));
            }) : (/**
             * @param {?} value
             * @return {?}
             */
            (value) => {
                generatorOrNext.next(value);
            });
            if (generatorOrNext.error) {
                errorFn = this.__isAsync ? (/**
                 * @param {?} err
                 * @return {?}
                 */
                (err) => {
                    setTimeout((/**
                     * @return {?}
                     */
                    () => generatorOrNext.error(err)));
                }) : (/**
                 * @param {?} err
                 * @return {?}
                 */
                (err) => {
                    generatorOrNext.error(err);
                });
            }
            if (generatorOrNext.complete) {
                completeFn = this.__isAsync ? (/**
                 * @return {?}
                 */
                () => {
                    setTimeout((/**
                     * @return {?}
                     */
                    () => generatorOrNext.complete()));
                }) : (/**
                 * @return {?}
                 */
                () => {
                    generatorOrNext.complete();
                });
            }
        }
        else {
            schedulerFn = this.__isAsync ? (/**
             * @param {?} value
             * @return {?}
             */
            (value) => {
                setTimeout((/**
                 * @return {?}
                 */
                () => generatorOrNext(value)));
            }) : (/**
             * @param {?} value
             * @return {?}
             */
            (value) => {
                generatorOrNext(value);
            });
            if (error) {
                errorFn = this.__isAsync ? (/**
                 * @param {?} err
                 * @return {?}
                 */
                (err) => {
                    setTimeout((/**
                     * @return {?}
                     */
                    () => error(err)));
                }) : (/**
                 * @param {?} err
                 * @return {?}
                 */
                (err) => {
                    error(err);
                });
            }
            if (complete) {
                completeFn = this.__isAsync ? (/**
                 * @return {?}
                 */
                () => {
                    setTimeout((/**
                     * @return {?}
                     */
                    () => complete()));
                }) : (/**
                 * @return {?}
                 */
                () => {
                    complete();
                });
            }
        }
        /** @type {?} */
        const sink = super.subscribe(schedulerFn, errorFn, completeFn);
        if (generatorOrNext instanceof Subscription) {
            generatorOrNext.add(sink);
        }
        return sink;
    }
}
if (false) {
    /** @type {?} */
    EventEmitter_.prototype.__isAsync;
}
/**
 * \@publicApi
 * @type {?}
 */
export const EventEmitter = (/** @type {?} */ (EventEmitter_));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2VtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFRQSw4QkFBOEI7Ozs7Ozs7OztBQUU5QixPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQzs7QUFvRjNDLE1BQU0sYUFBYyxTQUFRLE9BQVk7Ozs7O0lBR3RDLFlBQVksVUFBbUIsS0FBSztRQUNsQyxLQUFLLEVBQUUsQ0FBQztRQUNSLElBQUksQ0FBQyxTQUFTLEdBQUcsT0FBTyxDQUFDO0lBQzNCLENBQUM7Ozs7O0lBRUQsSUFBSSxDQUFDLEtBQVc7UUFDZCxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BCLENBQUM7Ozs7Ozs7SUFFRCxTQUFTLENBQUMsZUFBcUIsRUFBRSxLQUFXLEVBQUUsUUFBYzs7WUFDdEQsV0FBNEI7O1lBQzVCLE9BQU87Ozs7UUFBRyxDQUFDLEdBQVEsRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFBOztZQUNqQyxVQUFVOzs7UUFBRyxHQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFFaEMsSUFBSSxlQUFlLElBQUksT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFO1lBQzFELFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7WUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUM1QyxVQUFVOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDO1lBQ2hELENBQUMsRUFBQyxDQUFDOzs7O1lBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRTtnQkFDakIsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUM5QixDQUFDLENBQUEsQ0FBQztZQUVGLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtnQkFDekIsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztnQkFBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNqQyxVQUFVOzs7b0JBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBQyxDQUFDO2dCQUMvQyxDQUFDLEVBQUMsQ0FBQzs7OztnQkFBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO29CQUNWLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQzdCLENBQUMsQ0FBQSxDQUFDO2FBQ0g7WUFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7OztnQkFBQyxHQUFHLEVBQUU7b0JBQ2pDLFVBQVU7OztvQkFBQyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsUUFBUSxFQUFFLEVBQUMsQ0FBQztnQkFDL0MsQ0FBQyxFQUFDLENBQUM7OztnQkFBQyxHQUFHLEVBQUU7b0JBQ1AsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDO2dCQUM3QixDQUFDLENBQUEsQ0FBQzthQUNIO1NBQ0Y7YUFBTTtZQUNMLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7WUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUM1QyxVQUFVOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUFDLENBQUM7WUFDM0MsQ0FBQyxFQUFDLENBQUM7Ozs7WUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUNqQixlQUFlLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekIsQ0FBQyxDQUFBLENBQUM7WUFFRixJQUFJLEtBQUssRUFBRTtnQkFDVCxPQUFPLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O2dCQUFDLENBQUMsR0FBRyxFQUFFLEVBQUU7b0JBQ2pDLFVBQVU7OztvQkFBQyxHQUFHLEVBQUUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUMsQ0FBQztnQkFDL0IsQ0FBQyxFQUFDLENBQUM7Ozs7Z0JBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRTtvQkFDVixLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ2IsQ0FBQyxDQUFBLENBQUM7YUFDSDtZQUVELElBQUksUUFBUSxFQUFFO2dCQUNaLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7OztnQkFBQyxHQUFHLEVBQUU7b0JBQ2pDLFVBQVU7OztvQkFBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBQyxDQUFDO2dCQUMvQixDQUFDLEVBQUMsQ0FBQzs7O2dCQUFDLEdBQUcsRUFBRTtvQkFDUCxRQUFRLEVBQUUsQ0FBQztnQkFDYixDQUFDLENBQUEsQ0FBQzthQUNIO1NBQ0Y7O2NBRUssSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUM7UUFFOUQsSUFBSSxlQUFlLFlBQVksWUFBWSxFQUFFO1lBQzNDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjs7O0lBdEVDLGtDQUFtQjs7Ozs7O0FBMkVyQixNQUFNLE9BQU8sWUFBWSxHQUdyQixtQkFBQSxhQUFhLEVBQU8iLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vLyA8cmVmZXJlbmNlIHR5cGVzPVwicnhqc1wiIC8+XG5cbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBVc2UgaW4gY29tcG9uZW50cyB3aXRoIHRoZSBgQE91dHB1dGAgZGlyZWN0aXZlIHRvIGVtaXQgY3VzdG9tIGV2ZW50c1xuICogc3luY2hyb25vdXNseSBvciBhc3luY2hyb25vdXNseSwgYW5kIHJlZ2lzdGVyIGhhbmRsZXJzIGZvciB0aG9zZSBldmVudHNcbiAqIGJ5IHN1YnNjcmliaW5nIHRvIGFuIGluc3RhbmNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogRXh0ZW5kc1xuICogW1J4SlMgYFN1YmplY3RgXShodHRwczovL3J4anMuZGV2L2FwaS9pbmRleC9jbGFzcy9TdWJqZWN0KVxuICogZm9yIEFuZ3VsYXIgYnkgYWRkaW5nIHRoZSBgZW1pdCgpYCBtZXRob2QuXG4gKlxuICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCBhIGNvbXBvbmVudCBkZWZpbmVzIHR3byBvdXRwdXQgcHJvcGVydGllc1xuICogdGhhdCBjcmVhdGUgZXZlbnQgZW1pdHRlcnMuIFdoZW4gdGhlIHRpdGxlIGlzIGNsaWNrZWQsIHRoZSBlbWl0dGVyXG4gKiBlbWl0cyBhbiBvcGVuIG9yIGNsb3NlIGV2ZW50IHRvIHRvZ2dsZSB0aGUgY3VycmVudCB2aXNpYmlsaXR5IHN0YXRlLlxuICpcbiAqIGBgYGh0bWxcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ3ppcHB5JyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgPGRpdiBjbGFzcz1cInppcHB5XCI+XG4gKiAgICAgPGRpdiAoY2xpY2spPVwidG9nZ2xlKClcIj5Ub2dnbGU8L2Rpdj5cbiAqICAgICA8ZGl2IFtoaWRkZW5dPVwiIXZpc2libGVcIj5cbiAqICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAqICAgICA8L2Rpdj5cbiAqICA8L2Rpdj5gfSlcbiAqIGV4cG9ydCBjbGFzcyBaaXBweSB7XG4gKiAgIHZpc2libGU6IGJvb2xlYW4gPSB0cnVlO1xuICogICBAT3V0cHV0KCkgb3BlbjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKiAgIEBPdXRwdXQoKSBjbG9zZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKlxuICogICB0b2dnbGUoKSB7XG4gKiAgICAgdGhpcy52aXNpYmxlID0gIXRoaXMudmlzaWJsZTtcbiAqICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gKiAgICAgICB0aGlzLm9wZW4uZW1pdChudWxsKTtcbiAqICAgICB9IGVsc2Uge1xuICogICAgICAgdGhpcy5jbG9zZS5lbWl0KG51bGwpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQWNjZXNzIHRoZSBldmVudCBvYmplY3Qgd2l0aCB0aGUgYCRldmVudGAgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBvdXRwdXQgZXZlbnRcbiAqIGhhbmRsZXI6XG4gKlxuICogYGBgaHRtbFxuICogPHppcHB5IChvcGVuKT1cIm9uT3BlbigkZXZlbnQpXCIgKGNsb3NlKT1cIm9uQ2xvc2UoJGV2ZW50KVwiPjwvemlwcHk+XG4gKiBgYGBcbiAqXG4gKiBAc2VlIFtPYnNlcnZhYmxlcyBpbiBBbmd1bGFyXShndWlkZS9vYnNlcnZhYmxlcy1pbi1hbmd1bGFyKVxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIEV2ZW50RW1pdHRlcjxUPiBleHRlbmRzIFN1YmplY3Q8VD4ge1xuICAvKipcbiAgICogQGludGVybmFsXG4gICAqL1xuICBfX2lzQXN5bmM6IGJvb2xlYW47XG5cbiAgLyoqXG4gICAqIENyZWF0ZXMgYW4gaW5zdGFuY2Ugb2YgdGhpcyBjbGFzcyB0aGF0IGNhblxuICAgKiBkZWxpdmVyIGV2ZW50cyBzeW5jaHJvbm91c2x5IG9yIGFzeW5jaHJvbm91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gW2lzQXN5bmM9ZmFsc2VdIFdoZW4gdHJ1ZSwgZGVsaXZlciBldmVudHMgYXN5bmNocm9ub3VzbHkuXG4gICAqXG4gICAqL1xuICBuZXcoaXNBc3luYz86IGJvb2xlYW4pOiBFdmVudEVtaXR0ZXI8VD47XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IGNvbnRhaW5pbmcgYSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBlbWl0LlxuICAgKi9cbiAgZW1pdCh2YWx1ZT86IFQpOiB2b2lkO1xuICAvKipcbiAgICogUmVnaXN0ZXJzIGhhbmRsZXJzIGZvciBldmVudHMgZW1pdHRlZCBieSB0aGlzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gZ2VuZXJhdG9yT3JOZXh0IFdoZW4gc3VwcGxpZWQsIGEgY3VzdG9tIGhhbmRsZXIgZm9yIGVtaXR0ZWQgZXZlbnRzLlxuICAgKiBAcGFyYW0gZXJyb3IgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYW4gZXJyb3Igbm90aWZpY2F0aW9uXG4gICAqIGZyb20gdGhpcyBlbWl0dGVyLlxuICAgKiBAcGFyYW0gY29tcGxldGUgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYSBjb21wbGV0aW9uXG4gICAqIG5vdGlmaWNhdGlvbiBmcm9tIHRoaXMgZW1pdHRlci5cbiAgICovXG4gIHN1YnNjcmliZShnZW5lcmF0b3JPck5leHQ/OiBhbnksIGVycm9yPzogYW55LCBjb21wbGV0ZT86IGFueSk6IFN1YnNjcmlwdGlvbjtcbn1cblxuY2xhc3MgRXZlbnRFbWl0dGVyXyBleHRlbmRzIFN1YmplY3Q8YW55PiB7XG4gIF9faXNBc3luYzogYm9vbGVhbjsgIC8vIHRzbGludDpkaXNhYmxlLWxpbmVcblxuICBjb25zdHJ1Y3Rvcihpc0FzeW5jOiBib29sZWFuID0gZmFsc2UpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuX19pc0FzeW5jID0gaXNBc3luYztcbiAgfVxuXG4gIGVtaXQodmFsdWU/OiBhbnkpIHtcbiAgICBzdXBlci5uZXh0KHZhbHVlKTtcbiAgfVxuXG4gIHN1YnNjcmliZShnZW5lcmF0b3JPck5leHQ/OiBhbnksIGVycm9yPzogYW55LCBjb21wbGV0ZT86IGFueSk6IFN1YnNjcmlwdGlvbiB7XG4gICAgbGV0IHNjaGVkdWxlckZuOiAodDogYW55KSA9PiBhbnk7XG4gICAgbGV0IGVycm9yRm4gPSAoZXJyOiBhbnkpOiBhbnkgPT4gbnVsbDtcbiAgICBsZXQgY29tcGxldGVGbiA9ICgpOiBhbnkgPT4gbnVsbDtcblxuICAgIGlmIChnZW5lcmF0b3JPck5leHQgJiYgdHlwZW9mIGdlbmVyYXRvck9yTmV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHNjaGVkdWxlckZuID0gdGhpcy5fX2lzQXN5bmMgPyAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGdlbmVyYXRvck9yTmV4dC5uZXh0KHZhbHVlKSk7XG4gICAgICB9IDogKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgZ2VuZXJhdG9yT3JOZXh0Lm5leHQodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgaWYgKGdlbmVyYXRvck9yTmV4dC5lcnJvcikge1xuICAgICAgICBlcnJvckZuID0gdGhpcy5fX2lzQXN5bmMgPyAoZXJyKSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQuZXJyb3IoZXJyKSk7XG4gICAgICAgIH0gOiAoZXJyKSA9PiB7XG4gICAgICAgICAgZ2VuZXJhdG9yT3JOZXh0LmVycm9yKGVycik7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChnZW5lcmF0b3JPck5leHQuY29tcGxldGUpIHtcbiAgICAgICAgY29tcGxldGVGbiA9IHRoaXMuX19pc0FzeW5jID8gKCkgPT4ge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0LmNvbXBsZXRlKCkpO1xuICAgICAgICB9IDogKCkgPT4ge1xuICAgICAgICAgIGdlbmVyYXRvck9yTmV4dC5jb21wbGV0ZSgpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZXJGbiA9IHRoaXMuX19pc0FzeW5jID8gKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQodmFsdWUpKTtcbiAgICAgIH0gOiAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICBnZW5lcmF0b3JPck5leHQodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGVycm9yRm4gPSB0aGlzLl9faXNBc3luYyA/IChlcnIpID0+IHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGVycm9yKGVycikpO1xuICAgICAgICB9IDogKGVycikgPT4ge1xuICAgICAgICAgIGVycm9yKGVycik7XG4gICAgICAgIH07XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBjb21wbGV0ZUZuID0gdGhpcy5fX2lzQXN5bmMgPyAoKSA9PiB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiBjb21wbGV0ZSgpKTtcbiAgICAgICAgfSA6ICgpID0+IHtcbiAgICAgICAgICBjb21wbGV0ZSgpO1xuICAgICAgICB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNpbmsgPSBzdXBlci5zdWJzY3JpYmUoc2NoZWR1bGVyRm4sIGVycm9yRm4sIGNvbXBsZXRlRm4pO1xuXG4gICAgaWYgKGdlbmVyYXRvck9yTmV4dCBpbnN0YW5jZW9mIFN1YnNjcmlwdGlvbikge1xuICAgICAgZ2VuZXJhdG9yT3JOZXh0LmFkZChzaW5rKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2luaztcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IEV2ZW50RW1pdHRlcjoge1xuICBuZXcgKGlzQXN5bmM/OiBib29sZWFuKTogRXZlbnRFbWl0dGVyPGFueT47IG5ldzxUPihpc0FzeW5jPzogYm9vbGVhbik6IEV2ZW50RW1pdHRlcjxUPjtcbiAgcmVhZG9ubHkgcHJvdG90eXBlOiBFdmVudEVtaXR0ZXI8YW55Pjtcbn0gPSBFdmVudEVtaXR0ZXJfIGFzIGFueTtcbiJdfQ==