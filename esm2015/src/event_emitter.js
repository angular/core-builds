/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
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
/**
 * Use in directives and components to emit custom events synchronously
 * or asynchronously, and register handlers for those events by subscribing
 * to an instance.
 *
 * \@usageNotes
 *
 * In the following example, a component defines two output properties
 * that create event emitters. When the title is clicked, the emitter
 * emits an open or close event to toggle the current visibility state.
 *
 * ```html
 * \@Component({
 *   selector: 'zippy',
 *   template: `
 *   <div class="zippy">
 *     <div (click)="toggle()">Toggle</div>
 *     <div [hidden]="!visible">
 *       <ng-content></ng-content>
 *     </div>
 *  </div>`})
 * export class Zippy {
 *   visible: boolean = true;
 * \@Output() open: EventEmitter<any> = new EventEmitter();
 * \@Output() close: EventEmitter<any> = new EventEmitter();
 *
 *   toggle() {
 *     this.visible = !this.visible;
 *     if (this.visible) {
 *       this.open.emit(null);
 *     } else {
 *       this.close.emit(null);
 *     }
 *   }
 * }
 * ```
 *
 * Access the event object with the `$event` argument passed to the output event
 * handler:
 *
 * ```html
 * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
 * ```
 *
 * \@publicApi
 * @template T
 */
export class EventEmitter extends Subject {
    // tslint:disable-line
    /**
     * Creates an instance of this class that can
     * deliver events synchronously or asynchronously.
     *
     * @param {?=} isAsync When true, deliver events asynchronously.
     *
     */
    constructor(isAsync = false) {
        super();
        this.__isAsync = isAsync;
    }
    /**
     * Emits an event containing a given value.
     * @param {?=} value The value to emit.
     * @return {?}
     */
    emit(value) { super.next(value); }
    /**
     * Registers handlers for events emitted by this instance.
     * @param {?=} generatorOrNext When supplied, a custom handler for emitted events.
     * @param {?=} error When supplied, a custom handler for an error notification
     * from this emitter.
     * @param {?=} complete When supplied, a custom handler for a completion
     * notification from this emitter.
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
            (value) => { generatorOrNext.next(value); });
            if (generatorOrNext.error) {
                errorFn = this.__isAsync ? (/**
                 * @param {?} err
                 * @return {?}
                 */
                (err) => { setTimeout((/**
                 * @return {?}
                 */
                () => generatorOrNext.error(err))); }) :
                    (/**
                     * @param {?} err
                     * @return {?}
                     */
                    (err) => { generatorOrNext.error(err); });
            }
            if (generatorOrNext.complete) {
                completeFn = this.__isAsync ? (/**
                 * @return {?}
                 */
                () => { setTimeout((/**
                 * @return {?}
                 */
                () => generatorOrNext.complete())); }) :
                    (/**
                     * @return {?}
                     */
                    () => { generatorOrNext.complete(); });
            }
        }
        else {
            schedulerFn = this.__isAsync ? (/**
             * @param {?} value
             * @return {?}
             */
            (value) => { setTimeout((/**
             * @return {?}
             */
            () => generatorOrNext(value))); }) :
                (/**
                 * @param {?} value
                 * @return {?}
                 */
                (value) => { generatorOrNext(value); });
            if (error) {
                errorFn =
                    this.__isAsync ? (/**
                     * @param {?} err
                     * @return {?}
                     */
                    (err) => { setTimeout((/**
                     * @return {?}
                     */
                    () => error(err))); }) : (/**
                     * @param {?} err
                     * @return {?}
                     */
                    (err) => { error(err); });
            }
            if (complete) {
                completeFn =
                    this.__isAsync ? (/**
                     * @return {?}
                     */
                    () => { setTimeout((/**
                     * @return {?}
                     */
                    () => complete())); }) : (/**
                     * @return {?}
                     */
                    () => { complete(); });
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
    /**
     * Internal
     * @type {?}
     */
    EventEmitter.prototype.__isAsync;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2VtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQVFBLDhCQUE4Qjs7Ozs7Ozs7O0FBRTlCLE9BQU8sRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFDLE1BQU0sTUFBTSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnRDNDLE1BQU0sT0FBTyxZQUFnQixTQUFRLE9BQVU7Ozs7Ozs7OztJQWlCN0MsWUFBWSxVQUFtQixLQUFLO1FBQ2xDLEtBQUssRUFBRSxDQUFDO1FBQ1IsSUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUM7SUFDM0IsQ0FBQzs7Ozs7O0lBTUQsSUFBSSxDQUFDLEtBQVMsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Ozs7Ozs7OztJQVV0QyxTQUFTLENBQUMsZUFBcUIsRUFBRSxLQUFXLEVBQUUsUUFBYzs7WUFDdEQsV0FBNEI7O1lBQzVCLE9BQU87Ozs7UUFBRyxDQUFDLEdBQVEsRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFBOztZQUNqQyxVQUFVOzs7UUFBRyxHQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUE7UUFFaEMsSUFBSSxlQUFlLElBQUksT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFO1lBQzFELFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7WUFBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUM1QyxVQUFVOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQyxDQUFDO1lBQ2hELENBQUMsRUFBQyxDQUFDOzs7O1lBQUMsQ0FBQyxLQUFVLEVBQUUsRUFBRSxHQUFHLGVBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUEsQ0FBQztZQUVyRCxJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3pCLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7Z0JBQUMsQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLFVBQVU7OztnQkFBQyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQzs7Ozs7b0JBQzVELENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxlQUFlLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUM7YUFDckU7WUFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7OztnQkFBQyxHQUFHLEVBQUUsR0FBRyxVQUFVOzs7Z0JBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQzs7OztvQkFDekQsR0FBRyxFQUFFLEdBQUcsZUFBZSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUM7YUFDckU7U0FDRjthQUFNO1lBQ0wsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7OztZQUFDLENBQUMsS0FBVSxFQUFFLEVBQUUsR0FBRyxVQUFVOzs7WUFBQyxHQUFHLEVBQUUsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQyxDQUFDOzs7OztnQkFDL0QsQ0FBQyxLQUFVLEVBQUUsRUFBRSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFDO1lBRTNFLElBQUksS0FBSyxFQUFFO2dCQUNULE9BQU87b0JBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O29CQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxVQUFVOzs7b0JBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQzs7OztvQkFBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUM7YUFDNUY7WUFFRCxJQUFJLFFBQVEsRUFBRTtnQkFDWixVQUFVO29CQUNOLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQzs7O29CQUFDLEdBQUcsRUFBRSxHQUFHLFVBQVU7OztvQkFBQyxHQUFHLEVBQUUsQ0FBQyxRQUFRLEVBQUUsRUFBQyxDQUFDLENBQUMsQ0FBQyxFQUFDLENBQUM7OztvQkFBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxDQUFDO2FBQ3RGO1NBQ0Y7O2NBRUssSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUM7UUFFOUQsSUFBSSxlQUFlLFlBQVksWUFBWSxFQUFFO1lBQzNDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFFRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7Q0FDRjs7Ozs7O0lBdEVDLGlDQUFtQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJyeGpzXCIgLz5cblxuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIFVzZSBpbiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRvIGVtaXQgY3VzdG9tIGV2ZW50cyBzeW5jaHJvbm91c2x5XG4gKiBvciBhc3luY2hyb25vdXNseSwgYW5kIHJlZ2lzdGVyIGhhbmRsZXJzIGZvciB0aG9zZSBldmVudHMgYnkgc3Vic2NyaWJpbmdcbiAqIHRvIGFuIGluc3RhbmNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCBhIGNvbXBvbmVudCBkZWZpbmVzIHR3byBvdXRwdXQgcHJvcGVydGllc1xuICogdGhhdCBjcmVhdGUgZXZlbnQgZW1pdHRlcnMuIFdoZW4gdGhlIHRpdGxlIGlzIGNsaWNrZWQsIHRoZSBlbWl0dGVyXG4gKiBlbWl0cyBhbiBvcGVuIG9yIGNsb3NlIGV2ZW50IHRvIHRvZ2dsZSB0aGUgY3VycmVudCB2aXNpYmlsaXR5IHN0YXRlLlxuICpcbiAqIGBgYGh0bWxcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ3ppcHB5JyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgPGRpdiBjbGFzcz1cInppcHB5XCI+XG4gKiAgICAgPGRpdiAoY2xpY2spPVwidG9nZ2xlKClcIj5Ub2dnbGU8L2Rpdj5cbiAqICAgICA8ZGl2IFtoaWRkZW5dPVwiIXZpc2libGVcIj5cbiAqICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAqICAgICA8L2Rpdj5cbiAqICA8L2Rpdj5gfSlcbiAqIGV4cG9ydCBjbGFzcyBaaXBweSB7XG4gKiAgIHZpc2libGU6IGJvb2xlYW4gPSB0cnVlO1xuICogICBAT3V0cHV0KCkgb3BlbjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKiAgIEBPdXRwdXQoKSBjbG9zZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKlxuICogICB0b2dnbGUoKSB7XG4gKiAgICAgdGhpcy52aXNpYmxlID0gIXRoaXMudmlzaWJsZTtcbiAqICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gKiAgICAgICB0aGlzLm9wZW4uZW1pdChudWxsKTtcbiAqICAgICB9IGVsc2Uge1xuICogICAgICAgdGhpcy5jbG9zZS5lbWl0KG51bGwpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQWNjZXNzIHRoZSBldmVudCBvYmplY3Qgd2l0aCB0aGUgYCRldmVudGAgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBvdXRwdXQgZXZlbnRcbiAqIGhhbmRsZXI6XG4gKlxuICogYGBgaHRtbFxuICogPHppcHB5IChvcGVuKT1cIm9uT3BlbigkZXZlbnQpXCIgKGNsb3NlKT1cIm9uQ2xvc2UoJGV2ZW50KVwiPjwvemlwcHk+XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXI8VD4gZXh0ZW5kcyBTdWJqZWN0PFQ+IHtcbiAgLy8gVE9ETzogbWFyayB0aGlzIGFzIGludGVybmFsIG9uY2UgYWxsIHRoZSBmYWNhZGVzIGFyZSBnb25lXG4gIC8vIHdlIGNhbid0IG1hcmsgaXQgYXMgaW50ZXJuYWwgbm93IGJlY2F1c2UgRXZlbnRFbWl0dGVyIGV4cG9ydGVkIHZpYSBAYW5ndWxhci9jb3JlIHdvdWxkIG5vdFxuICAvLyBjb250YWluIHRoaXMgcHJvcGVydHkgbWFraW5nIGl0IGluY29tcGF0aWJsZSB3aXRoIGFsbCB0aGUgY29kZSB0aGF0IHVzZXMgRXZlbnRFbWl0dGVyIHZpYVxuICAvLyBmYWNhZGVzLCB3aGljaCBhcmUgbG9jYWwgdG8gdGhlIGNvZGUgYW5kIGRvIG5vdCBoYXZlIHRoaXMgcHJvcGVydHkgc3RyaXBwZWQuXG4gIC8qKlxuICAgKiBJbnRlcm5hbFxuICAgKi9cbiAgX19pc0FzeW5jOiBib29sZWFuOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdGhhdCBjYW5cbiAgICogZGVsaXZlciBldmVudHMgc3luY2hyb25vdXNseSBvciBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICogQHBhcmFtIGlzQXN5bmMgV2hlbiB0cnVlLCBkZWxpdmVyIGV2ZW50cyBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICovXG4gIGNvbnN0cnVjdG9yKGlzQXN5bmM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2lzQXN5bmMgPSBpc0FzeW5jO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IGNvbnRhaW5pbmcgYSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBlbWl0LlxuICAgKi9cbiAgZW1pdCh2YWx1ZT86IFQpIHsgc3VwZXIubmV4dCh2YWx1ZSk7IH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGhhbmRsZXJzIGZvciBldmVudHMgZW1pdHRlZCBieSB0aGlzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gZ2VuZXJhdG9yT3JOZXh0IFdoZW4gc3VwcGxpZWQsIGEgY3VzdG9tIGhhbmRsZXIgZm9yIGVtaXR0ZWQgZXZlbnRzLlxuICAgKiBAcGFyYW0gZXJyb3IgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYW4gZXJyb3Igbm90aWZpY2F0aW9uXG4gICAqIGZyb20gdGhpcyBlbWl0dGVyLlxuICAgKiBAcGFyYW0gY29tcGxldGUgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYSBjb21wbGV0aW9uXG4gICAqIG5vdGlmaWNhdGlvbiBmcm9tIHRoaXMgZW1pdHRlci5cbiAgICovXG4gIHN1YnNjcmliZShnZW5lcmF0b3JPck5leHQ/OiBhbnksIGVycm9yPzogYW55LCBjb21wbGV0ZT86IGFueSk6IFN1YnNjcmlwdGlvbiB7XG4gICAgbGV0IHNjaGVkdWxlckZuOiAodDogYW55KSA9PiBhbnk7XG4gICAgbGV0IGVycm9yRm4gPSAoZXJyOiBhbnkpOiBhbnkgPT4gbnVsbDtcbiAgICBsZXQgY29tcGxldGVGbiA9ICgpOiBhbnkgPT4gbnVsbDtcblxuICAgIGlmIChnZW5lcmF0b3JPck5leHQgJiYgdHlwZW9mIGdlbmVyYXRvck9yTmV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHNjaGVkdWxlckZuID0gdGhpcy5fX2lzQXN5bmMgPyAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGdlbmVyYXRvck9yTmV4dC5uZXh0KHZhbHVlKSk7XG4gICAgICB9IDogKHZhbHVlOiBhbnkpID0+IHsgZ2VuZXJhdG9yT3JOZXh0Lm5leHQodmFsdWUpOyB9O1xuXG4gICAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0LmVycm9yKSB7XG4gICAgICAgIGVycm9yRm4gPSB0aGlzLl9faXNBc3luYyA/IChlcnIpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQuZXJyb3IoZXJyKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyKSA9PiB7IGdlbmVyYXRvck9yTmV4dC5lcnJvcihlcnIpOyB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0LmNvbXBsZXRlKSB7XG4gICAgICAgIGNvbXBsZXRlRm4gPSB0aGlzLl9faXNBc3luYyA/ICgpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQuY29tcGxldGUoKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7IGdlbmVyYXRvck9yTmV4dC5jb21wbGV0ZSgpOyB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZXJGbiA9IHRoaXMuX19pc0FzeW5jID8gKHZhbHVlOiBhbnkpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQodmFsdWUpKTsgfSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlOiBhbnkpID0+IHsgZ2VuZXJhdG9yT3JOZXh0KHZhbHVlKTsgfTtcblxuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGVycm9yRm4gPVxuICAgICAgICAgICAgdGhpcy5fX2lzQXN5bmMgPyAoZXJyKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZXJyb3IoZXJyKSk7IH0gOiAoZXJyKSA9PiB7IGVycm9yKGVycik7IH07XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBjb21wbGV0ZUZuID1cbiAgICAgICAgICAgIHRoaXMuX19pc0FzeW5jID8gKCkgPT4geyBzZXRUaW1lb3V0KCgpID0+IGNvbXBsZXRlKCkpOyB9IDogKCkgPT4geyBjb21wbGV0ZSgpOyB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNpbmsgPSBzdXBlci5zdWJzY3JpYmUoc2NoZWR1bGVyRm4sIGVycm9yRm4sIGNvbXBsZXRlRm4pO1xuXG4gICAgaWYgKGdlbmVyYXRvck9yTmV4dCBpbnN0YW5jZW9mIFN1YnNjcmlwdGlvbikge1xuICAgICAgZ2VuZXJhdG9yT3JOZXh0LmFkZChzaW5rKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2luaztcbiAgfVxufVxuIl19