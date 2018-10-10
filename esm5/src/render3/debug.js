/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { Injector } from '../di/injector';
import { DebugRendererFactory2 } from '../view/services';
import * as di from './di';
import { _getViewData } from './instructions';
import { CONTEXT, TVIEW } from './interfaces/view';
/**
 * Adapts the DebugRendererFactory2 to create a DebugRenderer2 specific for IVY.
 *
 * The created DebugRenderer know how to create a Debug Context specific to IVY.
 */
var Render3DebugRendererFactory2 = /** @class */ (function (_super) {
    tslib_1.__extends(Render3DebugRendererFactory2, _super);
    function Render3DebugRendererFactory2() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Render3DebugRendererFactory2.prototype.createRenderer = function (element, renderData) {
        var renderer = _super.prototype.createRenderer.call(this, element, renderData);
        renderer.debugContextFactory = function () { return new Render3DebugContext(_getViewData()); };
        return renderer;
    };
    return Render3DebugRendererFactory2;
}(DebugRendererFactory2));
export { Render3DebugRendererFactory2 };
/**
 * Stores context information about view nodes.
 *
 * Used in tests to retrieve information those nodes.
 */
var Render3DebugContext = /** @class */ (function () {
    function Render3DebugContext(viewData) {
        this.viewData = viewData;
        // The LNode will be created next and appended to viewData
        this.nodeIndex = viewData ? viewData.length : null;
    }
    Object.defineProperty(Render3DebugContext.prototype, "view", {
        get: function () { return this.viewData; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "injector", {
        get: function () {
            if (this.nodeIndex !== null) {
                var tNode = this.view[TVIEW].data[this.nodeIndex];
                return new di.NodeInjector(tNode, this.view);
            }
            return Injector.NULL;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "component", {
        get: function () {
            // TODO(vicb): why/when
            if (this.nodeIndex === null) {
                return null;
            }
            var tView = this.view[TVIEW];
            var components = tView.components;
            return (components && components.indexOf(this.nodeIndex) == -1) ?
                null :
                this.view[this.nodeIndex].data[CONTEXT];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "providerTokens", {
        // TODO(vicb): add view providers when supported
        get: function () {
            // TODO(vicb): why/when
            var directiveDefs = this.view[TVIEW].data;
            if (this.nodeIndex === null || directiveDefs == null) {
                return [];
            }
            var currentTNode = this.view[TVIEW].data[this.nodeIndex];
            var dirStart = currentTNode >> 15 /* DirectiveStartingIndexShift */;
            var dirEnd = dirStart + (currentTNode & 4095 /* DirectiveCountMask */);
            return directiveDefs.slice(dirStart, dirEnd);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "references", {
        get: function () {
            // TODO(vicb): implement retrieving references
            throw new Error('Not implemented yet in ivy');
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "context", {
        get: function () {
            if (this.nodeIndex === null) {
                return null;
            }
            var lNode = this.view[this.nodeIndex];
            return lNode.view[CONTEXT];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "componentRenderElement", {
        get: function () { throw new Error('Not implemented in ivy'); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Render3DebugContext.prototype, "renderNode", {
        get: function () { throw new Error('Not implemented in ivy'); },
        enumerable: true,
        configurable: true
    });
    // TODO(vicb): check previous implementation
    Render3DebugContext.prototype.logError = function (console) {
        var values = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            values[_i - 1] = arguments[_i];
        }
        console.error.apply(console, tslib_1.__spread(values));
    };
    return Render3DebugContext;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEMsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzNCLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUU1QyxPQUFPLEVBQUMsT0FBTyxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRzVEOzs7O0dBSUc7QUFDSDtJQUFrRCx3REFBcUI7SUFBdkU7O0lBTUEsQ0FBQztJQUxDLHFEQUFjLEdBQWQsVUFBZSxPQUFZLEVBQUUsVUFBOEI7UUFDekQsSUFBTSxRQUFRLEdBQUcsaUJBQU0sY0FBYyxZQUFDLE9BQU8sRUFBRSxVQUFVLENBQW1CLENBQUM7UUFDN0UsUUFBUSxDQUFDLG1CQUFtQixHQUFHLGNBQU0sT0FBQSxJQUFJLG1CQUFtQixDQUFDLFlBQVksRUFBRSxDQUFDLEVBQXZDLENBQXVDLENBQUM7UUFDN0UsT0FBTyxRQUFRLENBQUM7SUFDbEIsQ0FBQztJQUNILG1DQUFDO0FBQUQsQ0FBQyxBQU5ELENBQWtELHFCQUFxQixHQU10RTs7QUFFRDs7OztHQUlHO0FBQ0g7SUFHRSw2QkFBb0IsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVztRQUNyQywwREFBMEQ7UUFDMUQsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNyRCxDQUFDO0lBRUQsc0JBQUkscUNBQUk7YUFBUixjQUFrQixP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QUFiLE9BQU8sbUJBQVUsTUFBTSxHQUFFO0lBQUMsQ0FBQztJQUNsRiwwQkFBQztBQUFELENBQUMsQUFqRUQsSUFpRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3JztcbmltcG9ydCB7RGVidWdSZW5kZXJlcjIsIERlYnVnUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vdmlldy9zZXJ2aWNlcyc7XG5cbmltcG9ydCAqIGFzIGRpIGZyb20gJy4vZGknO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGF9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7VE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cblxuLyoqXG4gKiBBZGFwdHMgdGhlIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB0byBjcmVhdGUgYSBEZWJ1Z1JlbmRlcmVyMiBzcGVjaWZpYyBmb3IgSVZZLlxuICpcbiAqIFRoZSBjcmVhdGVkIERlYnVnUmVuZGVyZXIga25vdyBob3cgdG8gY3JlYXRlIGEgRGVidWcgQ29udGV4dCBzcGVjaWZpYyB0byBJVlkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZW5kZXIzRGVidWdSZW5kZXJlckZhY3RvcnkyIGV4dGVuZHMgRGVidWdSZW5kZXJlckZhY3RvcnkyIHtcbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gc3VwZXIuY3JlYXRlUmVuZGVyZXIoZWxlbWVudCwgcmVuZGVyRGF0YSkgYXMgRGVidWdSZW5kZXJlcjI7XG4gICAgcmVuZGVyZXIuZGVidWdDb250ZXh0RmFjdG9yeSA9ICgpID0+IG5ldyBSZW5kZXIzRGVidWdDb250ZXh0KF9nZXRWaWV3RGF0YSgpKTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICByZWFkb25seSBub2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlld0RhdGE6IExWaWV3RGF0YSkge1xuICAgIC8vIFRoZSBMTm9kZSB3aWxsIGJlIGNyZWF0ZWQgbmV4dCBhbmQgYXBwZW5kZWQgdG8gdmlld0RhdGFcbiAgICB0aGlzLm5vZGVJbmRleCA9IHZpZXdEYXRhID8gdmlld0RhdGEubGVuZ3RoIDogbnVsbDtcbiAgfVxuXG4gIGdldCB2aWV3KCk6IGFueSB7IHJldHVybiB0aGlzLnZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gdGhpcy52aWV3W1RWSUVXXS5kYXRhW3RoaXMubm9kZUluZGV4XTtcbiAgICAgIHJldHVybiBuZXcgZGkuTm9kZUluamVjdG9yKHROb2RlLCB0aGlzLnZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gSW5qZWN0b3IuTlVMTDtcbiAgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHtcbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdFZpZXcgPSB0aGlzLnZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwgPSB0Vmlldy5jb21wb25lbnRzO1xuXG4gICAgcmV0dXJuIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMuaW5kZXhPZih0aGlzLm5vZGVJbmRleCkgPT0gLTEpID9cbiAgICAgICAgbnVsbCA6XG4gICAgICAgIHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF0uZGF0YVtDT05URVhUXTtcbiAgfVxuXG4gIC8vIFRPRE8odmljYik6IGFkZCB2aWV3IHByb3ZpZGVycyB3aGVuIHN1cHBvcnRlZFxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgY29uc3QgZGlyZWN0aXZlRGVmcyA9IHRoaXMudmlld1tUVklFV10uZGF0YTtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwgfHwgZGlyZWN0aXZlRGVmcyA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gW107XG4gICAgfVxuXG4gICAgY29uc3QgY3VycmVudFROb2RlID0gdGhpcy52aWV3W1RWSUVXXS5kYXRhW3RoaXMubm9kZUluZGV4XTtcbiAgICBjb25zdCBkaXJTdGFydCA9IGN1cnJlbnRUTm9kZSA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBkaXJFbmQgPSBkaXJTdGFydCArIChjdXJyZW50VE5vZGUgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayk7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZURlZnMuc2xpY2UoZGlyU3RhcnQsIGRpckVuZCk7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgLy8gVE9ETyh2aWNiKTogaW1wbGVtZW50IHJldHJpZXZpbmcgcmVmZXJlbmNlc1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIHlldCBpbiBpdnknKTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgIHJldHVybiBsTm9kZS52aWV3W0NPTlRFWFRdO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8odmljYik6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pOiB2b2lkIHsgY29uc29sZS5lcnJvciguLi52YWx1ZXMpOyB9XG59XG4iXX0=