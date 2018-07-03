/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subject, Subscription } from 'rxjs';
/**
 * Use by directives and components to emit custom Events.
 *
 * \@usageNotes
 * ### Examples
 *
 * In the following example, `Zippy` alternatively emits `open` and `close` events when its
 * title gets clicked:
 *
 * ```
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
 * The events payload can be accessed by the parameter `$event` on the components output event
 * handler:
 *
 * ```
 * <zippy (open)="onOpen($event)" (close)="onClose($event)"></zippy>
 * ```
 *
 * ### Notes
 *
 * Uses Rx.Observable but provides an adapter to make it work as specified here:
 * https://github.com/jhusain/observable-spec
 *
 * Once a reference implementation of the spec is available, switch to it.
 *
 * @template T
 */
export class EventEmitter extends Subject {
    /**
     * Creates an instance of {\@link EventEmitter}, which depending on `isAsync`,
     * delivers events synchronously or asynchronously.
     *
     * @param {?=} isAsync By default, events are delivered synchronously (default value: `false`).
     * Set to `true` for asynchronous event delivery.
     */
    constructor(isAsync = false) {
        super();
        this.__isAsync = isAsync;
    }
    /**
     * @param {?=} value
     * @return {?}
     */
    emit(value) { super.next(value); }
    /**
     * @param {?=} generatorOrNext
     * @param {?=} error
     * @param {?=} complete
     * @return {?}
     */
    subscribe(generatorOrNext, error, complete) {
        let /** @type {?} */ schedulerFn;
        let /** @type {?} */ errorFn = (err) => null;
        let /** @type {?} */ completeFn = () => null;
        if (generatorOrNext && typeof generatorOrNext === 'object') {
            schedulerFn = this.__isAsync ? (value) => {
                setTimeout(() => generatorOrNext.next(value));
            } : (value) => { generatorOrNext.next(value); };
            if (generatorOrNext.error) {
                errorFn = this.__isAsync ? (err) => { setTimeout(() => generatorOrNext.error(err)); } :
                    (err) => { generatorOrNext.error(err); };
            }
            if (generatorOrNext.complete) {
                completeFn = this.__isAsync ? () => { setTimeout(() => generatorOrNext.complete()); } :
                    () => { generatorOrNext.complete(); };
            }
        }
        else {
            schedulerFn = this.__isAsync ? (value) => { setTimeout(() => generatorOrNext(value)); } :
                (value) => { generatorOrNext(value); };
            if (error) {
                errorFn =
                    this.__isAsync ? (err) => { setTimeout(() => error(err)); } : (err) => { error(err); };
            }
            if (complete) {
                completeFn =
                    this.__isAsync ? () => { setTimeout(() => complete()); } : () => { complete(); };
            }
        }
        const /** @type {?} */ sink = super.subscribe(schedulerFn, errorFn, completeFn);
        if (generatorOrNext instanceof Subscription) {
            generatorOrNext.add(sink);
        }
        return sink;
    }
}
function EventEmitter_tsickle_Closure_declarations() {
    /** @type {?} */
    EventEmitter.prototype.__isAsync;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRfZW1pdHRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2V2ZW50X2VtaXR0ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsT0FBTyxFQUFFLFlBQVksRUFBQyxNQUFNLE1BQU0sQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW9EM0MsTUFBTSxtQkFBdUIsU0FBUSxPQUFVOzs7Ozs7OztJQWU3QyxZQUFZLFVBQW1CLEtBQUs7UUFDbEMsS0FBSyxFQUFFLENBQUM7UUFDUixJQUFJLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQztLQUMxQjs7Ozs7SUFFRCxJQUFJLENBQUMsS0FBUyxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTs7Ozs7OztJQUV0QyxTQUFTLENBQUMsZUFBcUIsRUFBRSxLQUFXLEVBQUUsUUFBYztRQUMxRCxxQkFBSSxXQUE0QixDQUFDO1FBQ2pDLHFCQUFJLE9BQU8sR0FBRyxDQUFDLEdBQVEsRUFBTyxFQUFFLENBQUMsSUFBSSxDQUFDO1FBQ3RDLHFCQUFJLFVBQVUsR0FBRyxHQUFRLEVBQUUsQ0FBQyxJQUFJLENBQUM7UUFFakMsSUFBSSxlQUFlLElBQUksT0FBTyxlQUFlLEtBQUssUUFBUSxFQUFFO1lBQzFELFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFO2dCQUM1QyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO2FBQy9DLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBVSxFQUFFLEVBQUUsR0FBRyxlQUFlLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUVyRCxJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUU7Z0JBQ3pCLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztvQkFDNUQsQ0FBQyxHQUFHLEVBQUUsRUFBRSxHQUFHLGVBQWUsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO2FBQ3JFO1lBRUQsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFO2dCQUM1QixVQUFVLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO29CQUN6RCxHQUFHLEVBQUUsR0FBRyxlQUFlLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxDQUFDO2FBQ3JFO1NBQ0Y7YUFBTTtZQUNMLFdBQVcsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQVUsRUFBRSxFQUFFLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMvRCxDQUFDLEtBQVUsRUFBRSxFQUFFLEdBQUcsZUFBZSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUUzRSxJQUFJLEtBQUssRUFBRTtnQkFDVCxPQUFPO29CQUNILElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsR0FBRyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQzthQUM1RjtZQUVELElBQUksUUFBUSxFQUFFO2dCQUNaLFVBQVU7b0JBQ04sSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLEdBQUcsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDdEY7U0FDRjtRQUVELHVCQUFNLElBQUksR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFFL0QsSUFBSSxlQUFlLFlBQVksWUFBWSxFQUFFO1lBQzNDLGVBQWUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0I7UUFFRCxPQUFPLElBQUksQ0FBQztLQUNiO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7U3ViamVjdCwgU3Vic2NyaXB0aW9ufSBmcm9tICdyeGpzJztcblxuLyoqXG4gKiBVc2UgYnkgZGlyZWN0aXZlcyBhbmQgY29tcG9uZW50cyB0byBlbWl0IGN1c3RvbSBFdmVudHMuXG4gKlxuICogQHVzYWdlTm90ZXNcbiAqICMjIyBFeGFtcGxlc1xuICpcbiAqIEluIHRoZSBmb2xsb3dpbmcgZXhhbXBsZSwgYFppcHB5YCBhbHRlcm5hdGl2ZWx5IGVtaXRzIGBvcGVuYCBhbmQgYGNsb3NlYCBldmVudHMgd2hlbiBpdHNcbiAqIHRpdGxlIGdldHMgY2xpY2tlZDpcbiAqXG4gKiBgYGBcbiAqIEBDb21wb25lbnQoe1xuICogICBzZWxlY3RvcjogJ3ppcHB5JyxcbiAqICAgdGVtcGxhdGU6IGBcbiAqICAgPGRpdiBjbGFzcz1cInppcHB5XCI+XG4gKiAgICAgPGRpdiAoY2xpY2spPVwidG9nZ2xlKClcIj5Ub2dnbGU8L2Rpdj5cbiAqICAgICA8ZGl2IFtoaWRkZW5dPVwiIXZpc2libGVcIj5cbiAqICAgICAgIDxuZy1jb250ZW50PjwvbmctY29udGVudD5cbiAqICAgICA8L2Rpdj5cbiAqICA8L2Rpdj5gfSlcbiAqIGV4cG9ydCBjbGFzcyBaaXBweSB7XG4gKiAgIHZpc2libGU6IGJvb2xlYW4gPSB0cnVlO1xuICogICBAT3V0cHV0KCkgb3BlbjogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKiAgIEBPdXRwdXQoKSBjbG9zZTogRXZlbnRFbWl0dGVyPGFueT4gPSBuZXcgRXZlbnRFbWl0dGVyKCk7XG4gKlxuICogICB0b2dnbGUoKSB7XG4gKiAgICAgdGhpcy52aXNpYmxlID0gIXRoaXMudmlzaWJsZTtcbiAqICAgICBpZiAodGhpcy52aXNpYmxlKSB7XG4gKiAgICAgICB0aGlzLm9wZW4uZW1pdChudWxsKTtcbiAqICAgICB9IGVsc2Uge1xuICogICAgICAgdGhpcy5jbG9zZS5lbWl0KG51bGwpO1xuICogICAgIH1cbiAqICAgfVxuICogfVxuICogYGBgXG4gKlxuICogVGhlIGV2ZW50cyBwYXlsb2FkIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgcGFyYW1ldGVyIGAkZXZlbnRgIG9uIHRoZSBjb21wb25lbnRzIG91dHB1dCBldmVudFxuICogaGFuZGxlcjpcbiAqXG4gKiBgYGBcbiAqIDx6aXBweSAob3Blbik9XCJvbk9wZW4oJGV2ZW50KVwiIChjbG9zZSk9XCJvbkNsb3NlKCRldmVudClcIj48L3ppcHB5PlxuICogYGBgXG4gKlxuICogIyMjIE5vdGVzXG4gKlxuICogVXNlcyBSeC5PYnNlcnZhYmxlIGJ1dCBwcm92aWRlcyBhbiBhZGFwdGVyIHRvIG1ha2UgaXQgd29yayBhcyBzcGVjaWZpZWQgaGVyZTpcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9qaHVzYWluL29ic2VydmFibGUtc3BlY1xuICpcbiAqIE9uY2UgYSByZWZlcmVuY2UgaW1wbGVtZW50YXRpb24gb2YgdGhlIHNwZWMgaXMgYXZhaWxhYmxlLCBzd2l0Y2ggdG8gaXQuXG4gKlxuICovXG5leHBvcnQgY2xhc3MgRXZlbnRFbWl0dGVyPFQ+IGV4dGVuZHMgU3ViamVjdDxUPiB7XG4gIC8vIFRPRE86IG1hcmsgdGhpcyBhcyBpbnRlcm5hbCBvbmNlIGFsbCB0aGUgZmFjYWRlcyBhcmUgZ29uZVxuICAvLyB3ZSBjYW4ndCBtYXJrIGl0IGFzIGludGVybmFsIG5vdyBiZWNhdXNlIEV2ZW50RW1pdHRlciBleHBvcnRlZCB2aWEgQGFuZ3VsYXIvY29yZSB3b3VsZCBub3RcbiAgLy8gY29udGFpbiB0aGlzIHByb3BlcnR5IG1ha2luZyBpdCBpbmNvbXBhdGlibGUgd2l0aCBhbGwgdGhlIGNvZGUgdGhhdCB1c2VzIEV2ZW50RW1pdHRlciB2aWFcbiAgLy8gZmFjYWRlcywgd2hpY2ggYXJlIGxvY2FsIHRvIHRoZSBjb2RlIGFuZCBkbyBub3QgaGF2ZSB0aGlzIHByb3BlcnR5IHN0cmlwcGVkLlxuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmVcbiAgX19pc0FzeW5jOiBib29sZWFuO1xuXG4gIC8qKlxuICAgKiBDcmVhdGVzIGFuIGluc3RhbmNlIG9mIHtAbGluayBFdmVudEVtaXR0ZXJ9LCB3aGljaCBkZXBlbmRpbmcgb24gYGlzQXN5bmNgLFxuICAgKiBkZWxpdmVycyBldmVudHMgc3luY2hyb25vdXNseSBvciBhc3luY2hyb25vdXNseS5cbiAgICpcbiAgICogQHBhcmFtIGlzQXN5bmMgQnkgZGVmYXVsdCwgZXZlbnRzIGFyZSBkZWxpdmVyZWQgc3luY2hyb25vdXNseSAoZGVmYXVsdCB2YWx1ZTogYGZhbHNlYCkuXG4gICAqIFNldCB0byBgdHJ1ZWAgZm9yIGFzeW5jaHJvbm91cyBldmVudCBkZWxpdmVyeS5cbiAgICovXG4gIGNvbnN0cnVjdG9yKGlzQXN5bmM6IGJvb2xlYW4gPSBmYWxzZSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fX2lzQXN5bmMgPSBpc0FzeW5jO1xuICB9XG5cbiAgZW1pdCh2YWx1ZT86IFQpIHsgc3VwZXIubmV4dCh2YWx1ZSk7IH1cblxuICBzdWJzY3JpYmUoZ2VuZXJhdG9yT3JOZXh0PzogYW55LCBlcnJvcj86IGFueSwgY29tcGxldGU/OiBhbnkpOiBhbnkge1xuICAgIGxldCBzY2hlZHVsZXJGbjogKHQ6IGFueSkgPT4gYW55O1xuICAgIGxldCBlcnJvckZuID0gKGVycjogYW55KTogYW55ID0+IG51bGw7XG4gICAgbGV0IGNvbXBsZXRlRm4gPSAoKTogYW55ID0+IG51bGw7XG5cbiAgICBpZiAoZ2VuZXJhdG9yT3JOZXh0ICYmIHR5cGVvZiBnZW5lcmF0b3JPck5leHQgPT09ICdvYmplY3QnKSB7XG4gICAgICBzY2hlZHVsZXJGbiA9IHRoaXMuX19pc0FzeW5jID8gKHZhbHVlOiBhbnkpID0+IHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiBnZW5lcmF0b3JPck5leHQubmV4dCh2YWx1ZSkpO1xuICAgICAgfSA6ICh2YWx1ZTogYW55KSA9PiB7IGdlbmVyYXRvck9yTmV4dC5uZXh0KHZhbHVlKTsgfTtcblxuICAgICAgaWYgKGdlbmVyYXRvck9yTmV4dC5lcnJvcikge1xuICAgICAgICBlcnJvckZuID0gdGhpcy5fX2lzQXN5bmMgPyAoZXJyKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0LmVycm9yKGVycikpOyB9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVycikgPT4geyBnZW5lcmF0b3JPck5leHQuZXJyb3IoZXJyKTsgfTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdlbmVyYXRvck9yTmV4dC5jb21wbGV0ZSkge1xuICAgICAgICBjb21wbGV0ZUZuID0gdGhpcy5fX2lzQXN5bmMgPyAoKSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0LmNvbXBsZXRlKCkpOyB9IDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4geyBnZW5lcmF0b3JPck5leHQuY29tcGxldGUoKTsgfTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgc2NoZWR1bGVyRm4gPSB0aGlzLl9faXNBc3luYyA/ICh2YWx1ZTogYW55KSA9PiB7IHNldFRpbWVvdXQoKCkgPT4gZ2VuZXJhdG9yT3JOZXh0KHZhbHVlKSk7IH0gOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh2YWx1ZTogYW55KSA9PiB7IGdlbmVyYXRvck9yTmV4dCh2YWx1ZSk7IH07XG5cbiAgICAgIGlmIChlcnJvcikge1xuICAgICAgICBlcnJvckZuID1cbiAgICAgICAgICAgIHRoaXMuX19pc0FzeW5jID8gKGVycikgPT4geyBzZXRUaW1lb3V0KCgpID0+IGVycm9yKGVycikpOyB9IDogKGVycikgPT4geyBlcnJvcihlcnIpOyB9O1xuICAgICAgfVxuXG4gICAgICBpZiAoY29tcGxldGUpIHtcbiAgICAgICAgY29tcGxldGVGbiA9XG4gICAgICAgICAgICB0aGlzLl9faXNBc3luYyA/ICgpID0+IHsgc2V0VGltZW91dCgoKSA9PiBjb21wbGV0ZSgpKTsgfSA6ICgpID0+IHsgY29tcGxldGUoKTsgfTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBzaW5rID0gc3VwZXIuc3Vic2NyaWJlKHNjaGVkdWxlckZuLCBlcnJvckZuLCBjb21wbGV0ZUZuKTtcblxuICAgIGlmIChnZW5lcmF0b3JPck5leHQgaW5zdGFuY2VvZiBTdWJzY3JpcHRpb24pIHtcbiAgICAgIGdlbmVyYXRvck9yTmV4dC5hZGQoc2luayk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNpbms7XG4gIH1cbn1cbiJdfQ==