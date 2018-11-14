/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
import { Subject } from 'rxjs';
import { hyphenateProp } from './util';
export class StylingPlayer {
    /**
     * @param {?} element
     * @param {?} _animator
     * @param {?} timing
     * @param {?} classes
     * @param {?} styles
     */
    constructor(element, _animator, timing, classes, styles) {
        this.element = element;
        this._animator = _animator;
        this.parent = null;
        this.state = 0 /* Pending */;
        this._effect = { timing, classes, styles: styles ? hyphenateStyles(styles) : null };
    }
    /**
     * @return {?}
     */
    getStatus() {
        if (!this._subject) {
            this._subject = new Subject();
        }
        return this._subject.asObservable();
    }
    /**
     * @param {?} value
     * @return {?}
     */
    _emit(value) {
        if (this._subject) {
            this._subject.next(value);
        }
    }
    /**
     * @return {?}
     */
    play() {
        if (this.state === 0 /* Pending */) {
            this._animator.addEffect(this._effect);
            this._animator.onAllEffectsDone(() => this._onFinish());
            this._animator.scheduleFlush();
            this._emit(this.state = 1 /* Running */);
        }
        else if (this.state === 2 /* Paused */) {
            this._emit(this.state = 1 /* Running */);
        }
    }
    /**
     * @return {?}
     */
    pause() {
        if (this.state === 1 /* Running */) {
            this._emit(this.state = 2 /* Paused */);
        }
    }
    /**
     * @return {?}
     */
    finish() {
        if (this.state < 100 /* Finished */) {
            this._animator.finishEffect(this._effect);
            this._onFinish();
        }
    }
    /**
     * @return {?}
     */
    _onFinish() {
        if (this.state < 100 /* Finished */) {
            this._emit(this.state = 100 /* Finished */);
        }
    }
    /**
     * @param {?=} replacementPlayer
     * @return {?}
     */
    destroy(replacementPlayer) {
        if (this.state < 200 /* Destroyed */) {
            /** @type {?} */
            const removeEffect = !replacementPlayer || !(replacementPlayer instanceof StylingPlayer);
            if (removeEffect) {
                this._animator.destroyEffect(this._effect);
            }
            this._onFinish();
            this._emit(this.state = 200 /* Destroyed */);
            if (this._subject) {
                this._subject.complete();
            }
        }
    }
}
if (false) {
    /** @type {?} */
    StylingPlayer.prototype.parent;
    /** @type {?} */
    StylingPlayer.prototype.state;
    /** @type {?} */
    StylingPlayer.prototype._subject;
    /** @type {?} */
    StylingPlayer.prototype._effect;
    /** @type {?} */
    StylingPlayer.prototype.element;
    /** @type {?} */
    StylingPlayer.prototype._animator;
}
/**
 * @param {?} styles
 * @return {?}
 */
function hyphenateStyles(styles) {
    /** @type {?} */
    const props = Object.keys(styles);
    /** @type {?} */
    const newStyles = {};
    for (let i = 0; i < props.length; i++) {
        /** @type {?} */
        const prop = props[i];
        newStyles[hyphenateProp(prop)] = styles[prop];
    }
    return newStyles;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19wbGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2FuaW1hdGlvbnMvc3R5bGluZ19wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OztBQU9BLE9BQU8sRUFBYSxPQUFPLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFLekMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVyQyxNQUFNLE9BQU8sYUFBYTs7Ozs7Ozs7SUFNeEIsWUFDVyxTQUE4QixTQUFtQixFQUFFLE1BQWMsRUFDeEUsT0FBa0MsRUFBRSxNQUFpQztRQUQ5RCxZQUFPLEdBQVAsT0FBTztRQUF1QixjQUFTLEdBQVQsU0FBUyxDQUFVO1FBTjVELGNBQXNCLElBQUksQ0FBQztRQUMzQiw2QkFBMEI7UUFPeEIsSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQztLQUNuRjs7OztJQUVELFNBQVM7UUFDUCxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRTtZQUNsQixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksT0FBTyxFQUFvQixDQUFDO1NBQ2pEO1FBQ0QsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxDQUFDO0tBQ3JDOzs7OztJQUVPLEtBQUssQ0FBQyxLQUF1QjtRQUNuQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDM0I7Ozs7O0lBR0gsSUFBSTtRQUNGLElBQUksSUFBSSxDQUFDLEtBQUssb0JBQXNCLEVBQUU7WUFDcEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3ZDLElBQUksQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLGtCQUFvQixDQUFDLENBQUM7U0FDNUM7YUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLG1CQUFxQixFQUFFO1lBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssa0JBQW9CLENBQUMsQ0FBQztTQUM1QztLQUNGOzs7O0lBRUQsS0FBSztRQUNILElBQUksSUFBSSxDQUFDLEtBQUssb0JBQXNCLEVBQUU7WUFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxpQkFBbUIsQ0FBQyxDQUFDO1NBQzNDO0tBQ0Y7Ozs7SUFFRCxNQUFNO1FBQ0osSUFBSSxJQUFJLENBQUMsS0FBSyxxQkFBcUIsRUFBRTtZQUNuQyxJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDMUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ2xCO0tBQ0Y7Ozs7SUFFTyxTQUFTO1FBQ2YsSUFBSSxJQUFJLENBQUMsS0FBSyxxQkFBcUIsRUFBRTtZQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLHFCQUFxQixDQUFDLENBQUM7U0FDN0M7Ozs7OztJQUdILE9BQU8sQ0FBQyxpQkFBK0I7UUFDckMsSUFBSSxJQUFJLENBQUMsS0FBSyxzQkFBc0IsRUFBRTs7WUFDcEMsTUFBTSxZQUFZLEdBQUcsQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLENBQUMsaUJBQWlCLFlBQVksYUFBYSxDQUFDLENBQUM7WUFDekYsSUFBSSxZQUFZLEVBQUU7Z0JBQ2hCLElBQUksQ0FBQyxTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQzthQUM1QztZQUNELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUNqQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLHNCQUFzQixDQUFDLENBQUM7WUFDN0MsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNqQixJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDO2FBQzFCO1NBQ0Y7S0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBNEI7O0lBQ25ELE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7O0lBQ2xDLE1BQU0sU0FBUyxHQUF5QixFQUFFLENBQUM7SUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQ3JDLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQy9DO0lBQ0QsT0FBTyxTQUFTLENBQUM7Q0FDbEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge09ic2VydmFibGUsIFN1YmplY3R9IGZyb20gJ3J4anMnO1xuXG5pbXBvcnQge1BsYXlTdGF0ZSwgUGxheWVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3BsYXllcic7XG5cbmltcG9ydCB7QW5pbWF0b3IsIFN0eWxpbmdFZmZlY3QsIFRpbWluZ30gZnJvbSAnLi9pbnRlcmZhY2VzJztcbmltcG9ydCB7aHlwaGVuYXRlUHJvcH0gZnJvbSAnLi91dGlsJztcblxuZXhwb3J0IGNsYXNzIFN0eWxpbmdQbGF5ZXIgaW1wbGVtZW50cyBQbGF5ZXIge1xuICBwYXJlbnQ6IFBsYXllcnxudWxsID0gbnVsbDtcbiAgc3RhdGUgPSBQbGF5U3RhdGUuUGVuZGluZztcbiAgcHJpdmF0ZSBfc3ViamVjdCAhOiBTdWJqZWN0PFBsYXlTdGF0ZXxzdHJpbmc+fCBudWxsO1xuICBwcml2YXRlIF9lZmZlY3Q6IFN0eWxpbmdFZmZlY3Q7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwdWJsaWMgZWxlbWVudDogSFRNTEVsZW1lbnQsIHByaXZhdGUgX2FuaW1hdG9yOiBBbmltYXRvciwgdGltaW5nOiBUaW1pbmcsXG4gICAgICBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fXxudWxsLCBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwpIHtcbiAgICB0aGlzLl9lZmZlY3QgPSB7dGltaW5nLCBjbGFzc2VzLCBzdHlsZXM6IHN0eWxlcyA/IGh5cGhlbmF0ZVN0eWxlcyhzdHlsZXMpIDogbnVsbH07XG4gIH1cblxuICBnZXRTdGF0dXMoKTogT2JzZXJ2YWJsZTxQbGF5U3RhdGV8c3RyaW5nPiB7XG4gICAgaWYgKCF0aGlzLl9zdWJqZWN0KSB7XG4gICAgICB0aGlzLl9zdWJqZWN0ID0gbmV3IFN1YmplY3Q8UGxheVN0YXRlfHN0cmluZz4oKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX3N1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gIH1cblxuICBwcml2YXRlIF9lbWl0KHZhbHVlOiBQbGF5U3RhdGV8c3RyaW5nKSB7XG4gICAgaWYgKHRoaXMuX3N1YmplY3QpIHtcbiAgICAgIHRoaXMuX3N1YmplY3QubmV4dCh2YWx1ZSk7XG4gICAgfVxuICB9XG5cbiAgcGxheSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gUGxheVN0YXRlLlBlbmRpbmcpIHtcbiAgICAgIHRoaXMuX2FuaW1hdG9yLmFkZEVmZmVjdCh0aGlzLl9lZmZlY3QpO1xuICAgICAgdGhpcy5fYW5pbWF0b3Iub25BbGxFZmZlY3RzRG9uZSgoKSA9PiB0aGlzLl9vbkZpbmlzaCgpKTtcbiAgICAgIHRoaXMuX2FuaW1hdG9yLnNjaGVkdWxlRmx1c2goKTtcbiAgICAgIHRoaXMuX2VtaXQodGhpcy5zdGF0ZSA9IFBsYXlTdGF0ZS5SdW5uaW5nKTtcbiAgICB9IGVsc2UgaWYgKHRoaXMuc3RhdGUgPT09IFBsYXlTdGF0ZS5QYXVzZWQpIHtcbiAgICAgIHRoaXMuX2VtaXQodGhpcy5zdGF0ZSA9IFBsYXlTdGF0ZS5SdW5uaW5nKTtcbiAgICB9XG4gIH1cblxuICBwYXVzZSgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA9PT0gUGxheVN0YXRlLlJ1bm5pbmcpIHtcbiAgICAgIHRoaXMuX2VtaXQodGhpcy5zdGF0ZSA9IFBsYXlTdGF0ZS5QYXVzZWQpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaCgpOiB2b2lkIHtcbiAgICBpZiAodGhpcy5zdGF0ZSA8IFBsYXlTdGF0ZS5GaW5pc2hlZCkge1xuICAgICAgdGhpcy5fYW5pbWF0b3IuZmluaXNoRWZmZWN0KHRoaXMuX2VmZmVjdCk7XG4gICAgICB0aGlzLl9vbkZpbmlzaCgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgX29uRmluaXNoKCkge1xuICAgIGlmICh0aGlzLnN0YXRlIDwgUGxheVN0YXRlLkZpbmlzaGVkKSB7XG4gICAgICB0aGlzLl9lbWl0KHRoaXMuc3RhdGUgPSBQbGF5U3RhdGUuRmluaXNoZWQpO1xuICAgIH1cbiAgfVxuXG4gIGRlc3Ryb3kocmVwbGFjZW1lbnRQbGF5ZXI/OiBQbGF5ZXJ8bnVsbCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlIDwgUGxheVN0YXRlLkRlc3Ryb3llZCkge1xuICAgICAgY29uc3QgcmVtb3ZlRWZmZWN0ID0gIXJlcGxhY2VtZW50UGxheWVyIHx8ICEocmVwbGFjZW1lbnRQbGF5ZXIgaW5zdGFuY2VvZiBTdHlsaW5nUGxheWVyKTtcbiAgICAgIGlmIChyZW1vdmVFZmZlY3QpIHtcbiAgICAgICAgdGhpcy5fYW5pbWF0b3IuZGVzdHJveUVmZmVjdCh0aGlzLl9lZmZlY3QpO1xuICAgICAgfVxuICAgICAgdGhpcy5fb25GaW5pc2goKTtcbiAgICAgIHRoaXMuX2VtaXQodGhpcy5zdGF0ZSA9IFBsYXlTdGF0ZS5EZXN0cm95ZWQpO1xuICAgICAgaWYgKHRoaXMuX3N1YmplY3QpIHtcbiAgICAgICAgdGhpcy5fc3ViamVjdC5jb21wbGV0ZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBoeXBoZW5hdGVTdHlsZXMoc3R5bGVzOiB7W2tleTogc3RyaW5nXTogYW55fSk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgY29uc3QgcHJvcHMgPSBPYmplY3Qua2V5cyhzdHlsZXMpO1xuICBjb25zdCBuZXdTdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBwcm9wID0gcHJvcHNbaV07XG4gICAgbmV3U3R5bGVzW2h5cGhlbmF0ZVByb3AocHJvcCldID0gc3R5bGVzW3Byb3BdO1xuICB9XG4gIHJldHVybiBuZXdTdHlsZXM7XG59Il19