/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Subject } from 'rxjs';
import { hyphenateProp } from './util';
var StylingPlayer = /** @class */ (function () {
    function StylingPlayer(element, _animator, timing, classes, styles) {
        this.element = element;
        this._animator = _animator;
        this.parent = null;
        this.state = 0 /* Pending */;
        this._effect = { timing: timing, classes: classes, styles: styles ? hyphenateStyles(styles) : null };
    }
    StylingPlayer.prototype.getStatus = function () {
        if (!this._subject) {
            this._subject = new Subject();
        }
        return this._subject.asObservable();
    };
    StylingPlayer.prototype._emit = function (value) {
        if (this._subject) {
            this._subject.next(value);
        }
    };
    StylingPlayer.prototype.play = function () {
        var _this = this;
        if (this.state === 0 /* Pending */) {
            this._animator.addEffect(this._effect);
            this._animator.onAllEffectsDone(function () { return _this._onFinish(); });
            this._animator.scheduleFlush();
            this._emit(this.state = 1 /* Running */);
        }
        else if (this.state === 2 /* Paused */) {
            this._emit(this.state = 1 /* Running */);
        }
    };
    StylingPlayer.prototype.pause = function () {
        if (this.state === 1 /* Running */) {
            this._emit(this.state = 2 /* Paused */);
        }
    };
    StylingPlayer.prototype.finish = function () {
        if (this.state < 100 /* Finished */) {
            this._animator.finishEffect(this._effect);
            this._onFinish();
        }
    };
    StylingPlayer.prototype._onFinish = function () {
        if (this.state < 100 /* Finished */) {
            this._emit(this.state = 100 /* Finished */);
        }
    };
    StylingPlayer.prototype.destroy = function (replacementPlayer) {
        if (this.state < 200 /* Destroyed */) {
            var removeEffect = !replacementPlayer || !(replacementPlayer instanceof StylingPlayer);
            if (removeEffect) {
                this._animator.destroyEffect(this._effect);
            }
            this._onFinish();
            this._emit(this.state = 200 /* Destroyed */);
            if (this._subject) {
                this._subject.complete();
            }
        }
    };
    return StylingPlayer;
}());
export { StylingPlayer };
function hyphenateStyles(styles) {
    var props = Object.keys(styles);
    var newStyles = {};
    for (var i = 0; i < props.length; i++) {
        var prop = props[i];
        newStyles[hyphenateProp(prop)] = styles[prop];
    }
    return newStyles;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3R5bGluZ19wbGF5ZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2FuaW1hdGlvbnMvc3R5bGluZ19wbGF5ZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBQ0gsT0FBTyxFQUFhLE9BQU8sRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUt6QyxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRXJDO0lBTUUsdUJBQ1csT0FBb0IsRUFBVSxTQUFtQixFQUFFLE1BQWMsRUFDeEUsT0FBa0MsRUFBRSxNQUFpQztRQUQ5RCxZQUFPLEdBQVAsT0FBTyxDQUFhO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVTtRQU41RCxXQUFNLEdBQWdCLElBQUksQ0FBQztRQUMzQixVQUFLLG1CQUFxQjtRQU94QixJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUMsTUFBTSxRQUFBLEVBQUUsT0FBTyxTQUFBLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUMsQ0FBQztJQUNwRixDQUFDO0lBRUQsaUNBQVMsR0FBVDtRQUNFLElBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2xCLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLEVBQW9CLENBQUM7U0FDakQ7UUFDRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLENBQUM7SUFDdEMsQ0FBQztJQUVPLDZCQUFLLEdBQWIsVUFBYyxLQUF1QjtRQUNuQyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDakIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDM0I7SUFDSCxDQUFDO0lBRUQsNEJBQUksR0FBSjtRQUFBLGlCQVNDO1FBUkMsSUFBSSxJQUFJLENBQUMsS0FBSyxvQkFBc0IsRUFBRTtZQUNwQyxJQUFJLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxnQkFBZ0IsQ0FBQyxjQUFNLE9BQUEsS0FBSSxDQUFDLFNBQVMsRUFBRSxFQUFoQixDQUFnQixDQUFDLENBQUM7WUFDeEQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUMvQixJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLGtCQUFvQixDQUFDLENBQUM7U0FDNUM7YUFBTSxJQUFJLElBQUksQ0FBQyxLQUFLLG1CQUFxQixFQUFFO1lBQzFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssa0JBQW9CLENBQUMsQ0FBQztTQUM1QztJQUNILENBQUM7SUFFRCw2QkFBSyxHQUFMO1FBQ0UsSUFBSSxJQUFJLENBQUMsS0FBSyxvQkFBc0IsRUFBRTtZQUNwQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLGlCQUFtQixDQUFDLENBQUM7U0FDM0M7SUFDSCxDQUFDO0lBRUQsOEJBQU0sR0FBTjtRQUNFLElBQUksSUFBSSxDQUFDLEtBQUsscUJBQXFCLEVBQUU7WUFDbkMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQztTQUNsQjtJQUNILENBQUM7SUFFTyxpQ0FBUyxHQUFqQjtRQUNFLElBQUksSUFBSSxDQUFDLEtBQUsscUJBQXFCLEVBQUU7WUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxxQkFBcUIsQ0FBQyxDQUFDO1NBQzdDO0lBQ0gsQ0FBQztJQUVELCtCQUFPLEdBQVAsVUFBUSxpQkFBK0I7UUFDckMsSUFBSSxJQUFJLENBQUMsS0FBSyxzQkFBc0IsRUFBRTtZQUNwQyxJQUFNLFlBQVksR0FBRyxDQUFDLGlCQUFpQixJQUFJLENBQUMsQ0FBQyxpQkFBaUIsWUFBWSxhQUFhLENBQUMsQ0FBQztZQUN6RixJQUFJLFlBQVksRUFBRTtnQkFDaEIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2FBQzVDO1lBQ0QsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO1lBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssc0JBQXNCLENBQUMsQ0FBQztZQUM3QyxJQUFJLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0JBQ2pCLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDMUI7U0FDRjtJQUNILENBQUM7SUFDSCxvQkFBQztBQUFELENBQUMsQUFwRUQsSUFvRUM7O0FBRUQsU0FBUyxlQUFlLENBQUMsTUFBNEI7SUFDbkQsSUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQyxJQUFNLFNBQVMsR0FBeUIsRUFBRSxDQUFDO0lBQzNDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3JDLElBQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN0QixTQUFTLENBQUMsYUFBYSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQy9DO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7T2JzZXJ2YWJsZSwgU3ViamVjdH0gZnJvbSAncnhqcyc7XG5cbmltcG9ydCB7UGxheVN0YXRlLCBQbGF5ZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcGxheWVyJztcblxuaW1wb3J0IHtBbmltYXRvciwgU3R5bGluZ0VmZmVjdCwgVGltaW5nfSBmcm9tICcuL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtoeXBoZW5hdGVQcm9wfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgY2xhc3MgU3R5bGluZ1BsYXllciBpbXBsZW1lbnRzIFBsYXllciB7XG4gIHBhcmVudDogUGxheWVyfG51bGwgPSBudWxsO1xuICBzdGF0ZSA9IFBsYXlTdGF0ZS5QZW5kaW5nO1xuICBwcml2YXRlIF9zdWJqZWN0ICE6IFN1YmplY3Q8UGxheVN0YXRlfHN0cmluZz58IG51bGw7XG4gIHByaXZhdGUgX2VmZmVjdDogU3R5bGluZ0VmZmVjdDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHB1YmxpYyBlbGVtZW50OiBIVE1MRWxlbWVudCwgcHJpdmF0ZSBfYW5pbWF0b3I6IEFuaW1hdG9yLCB0aW1pbmc6IFRpbWluZyxcbiAgICAgIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9fG51bGwsIHN0eWxlczoge1trZXk6IHN0cmluZ106IGFueX18bnVsbCkge1xuICAgIHRoaXMuX2VmZmVjdCA9IHt0aW1pbmcsIGNsYXNzZXMsIHN0eWxlczogc3R5bGVzID8gaHlwaGVuYXRlU3R5bGVzKHN0eWxlcykgOiBudWxsfTtcbiAgfVxuXG4gIGdldFN0YXR1cygpOiBPYnNlcnZhYmxlPFBsYXlTdGF0ZXxzdHJpbmc+IHtcbiAgICBpZiAoIXRoaXMuX3N1YmplY3QpIHtcbiAgICAgIHRoaXMuX3N1YmplY3QgPSBuZXcgU3ViamVjdDxQbGF5U3RhdGV8c3RyaW5nPigpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fc3ViamVjdC5hc09ic2VydmFibGUoKTtcbiAgfVxuXG4gIHByaXZhdGUgX2VtaXQodmFsdWU6IFBsYXlTdGF0ZXxzdHJpbmcpIHtcbiAgICBpZiAodGhpcy5fc3ViamVjdCkge1xuICAgICAgdGhpcy5fc3ViamVjdC5uZXh0KHZhbHVlKTtcbiAgICB9XG4gIH1cblxuICBwbGF5KCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlID09PSBQbGF5U3RhdGUuUGVuZGluZykge1xuICAgICAgdGhpcy5fYW5pbWF0b3IuYWRkRWZmZWN0KHRoaXMuX2VmZmVjdCk7XG4gICAgICB0aGlzLl9hbmltYXRvci5vbkFsbEVmZmVjdHNEb25lKCgpID0+IHRoaXMuX29uRmluaXNoKCkpO1xuICAgICAgdGhpcy5fYW5pbWF0b3Iuc2NoZWR1bGVGbHVzaCgpO1xuICAgICAgdGhpcy5fZW1pdCh0aGlzLnN0YXRlID0gUGxheVN0YXRlLlJ1bm5pbmcpO1xuICAgIH0gZWxzZSBpZiAodGhpcy5zdGF0ZSA9PT0gUGxheVN0YXRlLlBhdXNlZCkge1xuICAgICAgdGhpcy5fZW1pdCh0aGlzLnN0YXRlID0gUGxheVN0YXRlLlJ1bm5pbmcpO1xuICAgIH1cbiAgfVxuXG4gIHBhdXNlKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlID09PSBQbGF5U3RhdGUuUnVubmluZykge1xuICAgICAgdGhpcy5fZW1pdCh0aGlzLnN0YXRlID0gUGxheVN0YXRlLlBhdXNlZCk7XG4gICAgfVxuICB9XG5cbiAgZmluaXNoKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLnN0YXRlIDwgUGxheVN0YXRlLkZpbmlzaGVkKSB7XG4gICAgICB0aGlzLl9hbmltYXRvci5maW5pc2hFZmZlY3QodGhpcy5fZWZmZWN0KTtcbiAgICAgIHRoaXMuX29uRmluaXNoKCk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBfb25GaW5pc2goKSB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPCBQbGF5U3RhdGUuRmluaXNoZWQpIHtcbiAgICAgIHRoaXMuX2VtaXQodGhpcy5zdGF0ZSA9IFBsYXlTdGF0ZS5GaW5pc2hlZCk7XG4gICAgfVxuICB9XG5cbiAgZGVzdHJveShyZXBsYWNlbWVudFBsYXllcj86IFBsYXllcnxudWxsKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuc3RhdGUgPCBQbGF5U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgICBjb25zdCByZW1vdmVFZmZlY3QgPSAhcmVwbGFjZW1lbnRQbGF5ZXIgfHwgIShyZXBsYWNlbWVudFBsYXllciBpbnN0YW5jZW9mIFN0eWxpbmdQbGF5ZXIpO1xuICAgICAgaWYgKHJlbW92ZUVmZmVjdCkge1xuICAgICAgICB0aGlzLl9hbmltYXRvci5kZXN0cm95RWZmZWN0KHRoaXMuX2VmZmVjdCk7XG4gICAgICB9XG4gICAgICB0aGlzLl9vbkZpbmlzaCgpO1xuICAgICAgdGhpcy5fZW1pdCh0aGlzLnN0YXRlID0gUGxheVN0YXRlLkRlc3Ryb3llZCk7XG4gICAgICBpZiAodGhpcy5fc3ViamVjdCkge1xuICAgICAgICB0aGlzLl9zdWJqZWN0LmNvbXBsZXRlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGh5cGhlbmF0ZVN0eWxlcyhzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9KToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICBjb25zdCBwcm9wcyA9IE9iamVjdC5rZXlzKHN0eWxlcyk7XG4gIGNvbnN0IG5ld1N0eWxlczoge1trZXk6IHN0cmluZ106IGFueX0gPSB7fTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3AgPSBwcm9wc1tpXTtcbiAgICBuZXdTdHlsZXNbaHlwaGVuYXRlUHJvcChwcm9wKV0gPSBzdHlsZXNbcHJvcF07XG4gIH1cbiAgcmV0dXJuIG5ld1N0eWxlcztcbn0iXX0=