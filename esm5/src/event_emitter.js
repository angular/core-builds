/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
/// <reference types="rxjs" />
import { Subject, Subscription } from 'rxjs';
/**
 * Use in directives and components to emit custom events synchronously
 * or asynchronously, and register handlers for those events by subscribing
 * to an instance.
 *
 * @usageNotes
 *
 * In the following example, a component defines two output properties
 * that create event emitters. When the title is clicked, the emitter
 * emits an open or close event to toggle the current visibility state.
 *
 * ```html
 * @Component({
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
 *   @Output() open: EventEmitter<any> = new EventEmitter();
 *   @Output() close: EventEmitter<any> = new EventEmitter();
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
 * @publicApi
 */
var EventEmitter = /** @class */ (function (_super) {
    tslib_1.__extends(EventEmitter, _super);
    /**
     * Creates an instance of this class that can
     * deliver events synchronously or asynchronously.
     *
     * @param isAsync When true, deliver events asynchronously.
     *
     */
    function EventEmitter(isAsync) {
        if (isAsync === void 0) { isAsync = false; }
        var _this = _super.call(this) || this;
        _this.__isAsync = isAsync;
        return _this;
    }
    /**
     * Emits an event containing a given value.
     * @param value The value to emit.
     */
    EventEmitter.prototype.emit = function (value) { _super.prototype.next.call(this, value); };
    /**
     * Registers handlers for events emitted by this instance.
     * @param generatorOrNext When supplied, a custom handler for emitted events.
     * @param error When supplied, a custom handler for an error notification
     * from this emitter.
     * @param complete When supplied, a custom handler for a completion
     * notification from this emitter.
     */
    EventEmitter.prototype.subscribe = function (generatorOrNext, error, complete) {
        var schedulerFn;
        var errorFn = function (err) { return null; };
        var completeFn = function () { return null; };
        if (generatorOrNext && typeof generatorOrNext === 'object') {
            schedulerFn = this.__isAsync ? function (value) {
                setTimeout(function () { return generatorOrNext.next(value); });
            } : function (value) { generatorOrNext.next(value); };
            if (generatorOrNext.error) {
                errorFn = this.__isAsync ? function (err) { setTimeout(function () { return generatorOrNext.error(err); }); } :
                    function (err) { generatorOrNext.error(err); };
            }
            if (generatorOrNext.complete) {
                completeFn = this.__isAsync ? function () { setTimeout(function () { return generatorOrNext.complete(); }); } :
                    function () { generatorOrNext.complete(); };
            }
        }
        else {
            schedulerFn = this.__isAsync ? function (value) { setTimeout(function () { return generatorOrNext(value); }); } :
                function (value) { generatorOrNext(value); };
            if (error) {
                errorFn =
                    this.__isAsync ? function (err) { setTimeout(function () { return error(err); }); } : function (err) { error(err); };
            }
            if (complete) {
                completeFn =
                    this.__isAsync ? function () { setTimeout(function () { return complete(); }); } : function () { complete(); };
            }
        }
        var sink = _super.prototype.subscribe.call(this, schedulerFn, errorFn, completeFn);
        if (generatorOrNext instanceof Subscription) {
            generatorOrNext.add(sink);
        }
        return sink;
    };
    return EventEmitter;
}(Subject));
export { EventEmitter };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2VtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUVILDhCQUE4QjtBQUU5QixPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUUzQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBNkNHO0FBQ0g7SUFBcUMsd0NBQVU7SUFVN0M7Ozs7OztPQU1HO0lBQ0gsc0JBQVksT0FBd0I7UUFBeEIsd0JBQUEsRUFBQSxlQUF3QjtRQUFwQyxZQUNFLGlCQUFPLFNBRVI7UUFEQyxLQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQzs7SUFDM0IsQ0FBQztJQUVEOzs7T0FHRztJQUNILDJCQUFJLEdBQUosVUFBSyxLQUFTLElBQUksaUJBQU0sSUFBSSxZQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUV0Qzs7Ozs7OztPQU9HO0lBQ0gsZ0NBQVMsR0FBVCxVQUFVLGVBQXFCLEVBQUUsS0FBVyxFQUFFLFFBQWM7UUFDMUQsSUFBSSxXQUE0QixDQUFDO1FBQ2pDLElBQUksT0FBTyxHQUFHLFVBQUMsR0FBUSxJQUFVLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQztRQUN0QyxJQUFJLFVBQVUsR0FBRyxjQUFXLE9BQUEsSUFBSSxFQUFKLENBQUksQ0FBQztRQUVqQyxJQUFJLGVBQWUsSUFBSSxPQUFPLGVBQWUsS0FBSyxRQUFRLEVBQUU7WUFDMUQsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsS0FBVTtnQkFDeEMsVUFBVSxDQUFDLGNBQU0sT0FBQSxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUEzQixDQUEyQixDQUFDLENBQUM7WUFDaEQsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFDLEtBQVUsSUFBTyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRXJELElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtnQkFDekIsT0FBTyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsR0FBRyxJQUFPLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBMUIsQ0FBMEIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7b0JBQzVELFVBQUMsR0FBRyxJQUFPLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckU7WUFFRCxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUU7Z0JBQzVCLFVBQVUsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxjQUFRLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLFFBQVEsRUFBRSxFQUExQixDQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFDekQsY0FBUSxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDckU7U0FDRjthQUFNO1lBQ0wsV0FBVyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLFVBQUMsS0FBVSxJQUFPLFVBQVUsQ0FBQyxjQUFNLE9BQUEsZUFBZSxDQUFDLEtBQUssQ0FBQyxFQUF0QixDQUFzQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDL0QsVUFBQyxLQUFVLElBQU8sZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBRTNFLElBQUksS0FBSyxFQUFFO2dCQUNULE9BQU87b0JBQ0gsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsVUFBQyxHQUFHLElBQU8sVUFBVSxDQUFDLGNBQU0sT0FBQSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQVYsQ0FBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQUMsR0FBRyxJQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUM1RjtZQUVELElBQUksUUFBUSxFQUFFO2dCQUNaLFVBQVU7b0JBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsY0FBUSxVQUFVLENBQUMsY0FBTSxPQUFBLFFBQVEsRUFBRSxFQUFWLENBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFRLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RGO1NBQ0Y7UUFFRCxJQUFNLElBQUksR0FBRyxpQkFBTSxTQUFTLFlBQUMsV0FBVyxFQUFFLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztRQUUvRCxJQUFJLGVBQWUsWUFBWSxZQUFZLEVBQUU7WUFDM0MsZUFBZSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjtRQUVELE9BQU8sSUFBSSxDQUFDO0lBQ2QsQ0FBQztJQUNILG1CQUFDO0FBQUQsQ0FBQyxBQTlFRCxDQUFxQyxPQUFPLEdBOEUzQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8vIDxyZWZlcmVuY2UgdHlwZXM9XCJyeGpzXCIgLz5cblxuaW1wb3J0IHtTdWJqZWN0LCBTdWJzY3JpcHRpb259IGZyb20gJ3J4anMnO1xuXG4vKipcbiAqIFVzZSBpbiBkaXJlY3RpdmVzIGFuZCBjb21wb25lbnRzIHRvIGVtaXQgY3VzdG9tIGV2ZW50cyBzeW5jaHJvbm91c2x5XG4gKiBvciBhc3luY2hyb25vdXNseSwgYW5kIHJlZ2lzdGVyIGhhbmRsZXJzIGZvciB0aG9zZSBldmVudHMgYnkgc3Vic2NyaWJpbmdcbiAqIHRvIGFuIGluc3RhbmNlLlxuICpcbiAqIEB1c2FnZU5vdGVzXG4gKlxuICogSW4gdGhlIGZvbGxvd2luZyBleGFtcGxlLCBhIGNvbXBvbmVudCBkZWZpbmVzIHR3byBvdXRwdXQgcHJvcGVydGllc1xuICogdGhhdCBjcmVhdGUgZXZlbnQgZW1pdHRlcnMuIFdoZW4gdGhlIHRpdGxlIGlzIGNsaWNrZWQsIHRoZSBlbWl0dGVyXG4gKiBlbWl0cyBhbiBvcGVuIG9yIGNsb3NlIGV2ZW50IHRvIHRvZ2dsZSB0aGUgY3VycmVudCB2aXNpYmlsaXR5IHN0YXRlLlxuICpcbiAqIGBgYGh0bWxcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ3ppcHB5JyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgPGRpdiBjbGFzcz1cInppcHB5XCI+XG4gKiAgICAgPGRpdiAoY2xpY2spPVwidG9nZ2xlKClcIj5Ub2dnbGU8L2Rpdj5cbiAqICAgICA8ZGl2IFtoaWRkZW5dPVwiIXZpc2libGVcIj5cbiAqICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAqICAgICA8L2Rpdj5cbiAqICA8L2Rpdj5gfSlcbiAqIGV4cG9ydCBjbGFzcyBaaXBweSB7XG4gKiAgIHZpc2libGU6IGJvb2xlYW4gPSB0cnVlO1xuICogICBAT3V0cHV0KCkgb3BlbjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKiAgIEBPdXRwdXQoKSBjbG9zZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKlxuICogICB0b2dnbGUoKSB7XG4gKiAgICAgdGhpcy52aXNpYmxlID0gIXRoaXMudmlzaWJsZTtcbiAqICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gKiAgICAgICB0aGlzLm9wZW4uZW1pdChudWxsKTtcbiAqICAgICB9IGVsc2Uge1xuICogICAgICAgdGhpcy5jbG9zZS5lbWl0KG51bGwpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogQWNjZXNzIHRoZSBldmVudCBvYmplY3Qgd2l0aCB0aGUgYCRldmVudGAgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBvdXRwdXQgZXZlbnRcbiAqIGhhbmRsZXI6XG4gKlxuICogYGBgaHRtbFxuICogPHppcHB5IChvcGVuKT1cIm9uT3BlbigkZXZlbnQpXCIgKGNsb3NlKT1cIm9uQ2xvc2UoJGV2ZW50KVwiPjwvemlwcHk+XG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjbGFzcyBFdmVudEVtaXR0ZXI8VD4gZXh0ZW5kcyBTdWJqZWN0PFQ+IHtcbiAgLy8gVE9ETzogbWFyayB0aGlzIGFzIGludGVybmFsIG9uY2UgYWxsIHRoZSBmYWNhZGVzIGFyZSBnb25lXG4gIC8vIHdlIGNhbid0IG1hcmsgaXQgYXMgaW50ZXJuYWwgbm93IGJlY2F1c2UgRXZlbnRFbWl0dGVyIGV4cG9ydGVkIHZpYSBAYW5ndWxhci9jb3JlIHdvdWxkIG5vdFxuICAvLyBjb250YWluIHRoaXMgcHJvcGVydHkgbWFraW5nIGl0IGluY29tcGF0aWJsZSB3aXRoIGFsbCB0aGUgY29kZSB0aGF0IHVzZXMgRXZlbnRFbWl0dGVyIHZpYVxuICAvLyBmYWNhZGVzLCB3aGljaCBhcmUgbG9jYWwgdG8gdGhlIGNvZGUgYW5kIGRvIG5vdCBoYXZlIHRoaXMgcHJvcGVydHkgc3RyaXBwZWQuXG4gIC8qKlxuICAgKiBJbnRlcm5hbFxuICAgKi9cbiAgX19pc0FzeW5jOiBib29sZWFuOyAgLy8gdHNsaW50OmRpc2FibGUtbGluZVxuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHRoaXMgY2xhc3MgdGhhdCBjYW5cbiAgICogZGVsaXZlciBldmVudHMgc3luY2hyb25vdXNseSBvciBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICogQHBhcmFtIGlzQXN5bmMgV2hlbiB0cnVlLCBkZWxpdmVyIGV2ZW50cyBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICovXG4gIGNvbnN0cnVjdG9yKGlzQXN5bmM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2lzQXN5bmMgPSBpc0FzeW5jO1xuICB9XG5cbiAgLyoqXG4gICAqIEVtaXRzIGFuIGV2ZW50IGNvbnRhaW5pbmcgYSBnaXZlbiB2YWx1ZS5cbiAgICogQHBhcmFtIHZhbHVlIFRoZSB2YWx1ZSB0byBlbWl0LlxuICAgKi9cbiAgZW1pdCh2YWx1ZT86IFQpIHsgc3VwZXIubmV4dCh2YWx1ZSk7IH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGhhbmRsZXJzIGZvciBldmVudHMgZW1pdHRlZCBieSB0aGlzIGluc3RhbmNlLlxuICAgKiBAcGFyYW0gZ2VuZXJhdG9yT3JOZXh0IFdoZW4gc3VwcGxpZWQsIGEgY3VzdG9tIGhhbmRsZXIgZm9yIGVtaXR0ZWQgZXZlbnRzLlxuICAgKiBAcGFyYW0gZXJyb3IgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYW4gZXJyb3Igbm90aWZpY2F0aW9uXG4gICAqIGZyb20gdGhpcyBlbWl0dGVyLlxuICAgKiBAcGFyYW0gY29tcGxldGUgV2hlbiBzdXBwbGllZCwgYSBjdXN0b20gaGFuZGxlciBmb3IgYSBjb21wbGV0aW9uXG4gICAqIG5vdGlmaWNhdGlvbiBmcm9tIHRoaXMgZW1pdHRlci5cbiAgICovXG4gIHN1YnNjcmliZShnZW5lcmF0b3JPck5leHQ/OiBhbnksIGVycm9yPzogYW55LCBjb21wbGV0ZT86IGFueSk6IFN1YnNjcmlwdGlvbiB7XG4gICAgbGV0IHNjaGVkdWxlckZuOiAodDogYW55KSA9PiBhbnk7XG4gICAgbGV0IGVycm9yRm4gPSAoZXJyOiBhbnkpOiBhbnkgPT4gbnVsbDtcbiAgICBsZXQgY29tcGxldGVGbiA9ICgpOiBhbnkgPT4gbnVsbDtcblxuICAgIGlmIChnZW5lcmF0b3JPck5leHQgJiYgdHlwZW9mIGdlbmVyYXRvck9yTmV4dCA9PT0gJ29iamVjdCcpIHtcbiAgICAgIHNjaGVkdWxlckZuID0gdGhpcy5fX2lzQXN5bmMgPyAodmFsdWU6IGFueSkgPT4ge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IGdlbmVyYXRvck9yTmV4dC5uZXh0KHZhbHVlKSk7XG4gICAgICB9IDogKHZhbHVlOiBhbnkpID0+IHsgZ2VuZXJhdG9yT3JOZXh0Lm5leHQodmFsdWUpOyB9O1xuXG4gICAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0LmVycm9yKSB7XG4gICAgICAgIGVycm9yRm4gPSB0aGlzLl9faXNBc3luYyA/IChlcnIpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQuZXJyb3IoZXJyKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyKSA9PiB7IGdlbmVyYXRvck9yTmV4dC5lcnJvcihlcnIpOyB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0LmNvbXBsZXRlKSB7XG4gICAgICAgIGNvbXBsZXRlRm4gPSB0aGlzLl9faXNBc3luYyA/ICgpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQuY29tcGxldGUoKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiB7IGdlbmVyYXRvck9yTmV4dC5jb21wbGV0ZSgpOyB9O1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBzY2hlZHVsZXJGbiA9IHRoaXMuX19pc0FzeW5jID8gKHZhbHVlOiBhbnkpID0+IHsgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQodmFsdWUpKTsgfSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKHZhbHVlOiBhbnkpID0+IHsgZ2VuZXJhdG9yT3JOZXh0KHZhbHVlKTsgfTtcblxuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIGVycm9yRm4gPVxuICAgICAgICAgICAgdGhpcy5fX2lzQXN5bmMgPyAoZXJyKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZXJyb3IoZXJyKSk7IH0gOiAoZXJyKSA9PiB7IGVycm9yKGVycik7IH07XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wbGV0ZSkge1xuICAgICAgICBjb21wbGV0ZUZuID1cbiAgICAgICAgICAgIHRoaXMuX19pc0FzeW5jID8gKCkgPT4geyBzZXRUaW1lb3V0KCgpID0+IGNvbXBsZXRlKCkpOyB9IDogKCkgPT4geyBjb21wbGV0ZSgpOyB9O1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IHNpbmsgPSBzdXBlci5zdWJzY3JpYmUoc2NoZWR1bGVyRm4sIGVycm9yRm4sIGNvbXBsZXRlRm4pO1xuXG4gICAgaWYgKGdlbmVyYXRvck9yTmV4dCBpbnN0YW5jZW9mIFN1YnNjcmlwdGlvbikge1xuICAgICAgZ2VuZXJhdG9yT3JOZXh0LmFkZChzaW5rKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc2luaztcbiAgfVxufVxuIl19