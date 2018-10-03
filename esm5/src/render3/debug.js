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
import { getLElementNode } from './context_discovery';
import * as di from './di';
import { _getViewData } from './instructions';
import { CONTEXT, DIRECTIVES, TVIEW } from './interfaces/view';
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
            var matchedDirectives = [];
            // TODO(vicb): why/when
            if (this.nodeIndex === null) {
                return matchedDirectives;
            }
            var directives = this.view[DIRECTIVES];
            if (directives) {
                var currentNode = this.view[this.nodeIndex];
                for (var dirIndex = 0; dirIndex < directives.length; dirIndex++) {
                    var directive = directives[dirIndex];
                    if (getLElementNode(directive) === currentNode) {
                        matchedDirectives.push(directive.constructor);
                    }
                }
            }
            return matchedDirectives;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEMsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMzQixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFeEU7Ozs7R0FJRztBQUNIO0lBQWtELHdEQUFxQjtJQUF2RTs7SUFNQSxDQUFDO0lBTEMscURBQWMsR0FBZCxVQUFlLE9BQVksRUFBRSxVQUE4QjtRQUN6RCxJQUFNLFFBQVEsR0FBRyxpQkFBTSxjQUFjLFlBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsQ0FBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsY0FBTSxPQUFBLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsbUNBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBa0QscUJBQXFCLEdBTXRFOztBQUVEOzs7O0dBSUc7QUFDSDtJQUdFLDZCQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENB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QUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFcEUsNENBQTRDO0lBQzVDLHNDQUFRLEdBQVIsVUFBUyxPQUFnQjtRQUFFLGdCQUFnQjthQUFoQixVQUFnQixFQUFoQixxQkFBZ0IsRUFBaEIsSUFBZ0I7WUFBaEIsK0JBQWdCOztRQUFVLE9BQU8sQ0FBQyxLQUFLLE9BQWIsT0FBTyxtQkFBVSxNQUFNLEdBQUU7SUFBQyxDQUFDO0lBQ2xGLDBCQUFDO0FBQUQsQ0FBQyxBQTFFRCxJQTBFQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z1JlbmRlcmVyMiwgRGVidWdSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi92aWV3L3NlcnZpY2VzJztcblxuaW1wb3J0IHtnZXRMRWxlbWVudE5vZGV9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0ICogYXMgZGkgZnJvbSAnLi9kaSc7XG5pbXBvcnQge19nZXRWaWV3RGF0YX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDT05URVhULCBESVJFQ1RJVkVTLCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAoKSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChfZ2V0Vmlld0RhdGEoKSk7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59XG5cbi8qKlxuICogU3RvcmVzIGNvbnRleHQgaW5mb3JtYXRpb24gYWJvdXQgdmlldyBub2Rlcy5cbiAqXG4gKiBVc2VkIGluIHRlc3RzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIHRob3NlIG5vZGVzLlxuICovXG5jbGFzcyBSZW5kZXIzRGVidWdDb250ZXh0IGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcmVhZG9ubHkgbm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgICAvLyBUaGUgTE5vZGUgd2lsbCBiZSBjcmVhdGVkIG5leHQgYW5kIGFwcGVuZGVkIHRvIHZpZXdEYXRhXG4gICAgdGhpcy5ub2RlSW5kZXggPSB2aWV3RGF0YSA/IHZpZXdEYXRhLmxlbmd0aCA6IG51bGw7XG4gIH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gdGhpcy52aWV3RGF0YTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0Tm9kZSA9IHRoaXMudmlld1tUVklFV10uZGF0YVt0aGlzLm5vZGVJbmRleF07XG4gICAgICByZXR1cm4gbmV3IGRpLk5vZGVJbmplY3Rvcih0Tm9kZSwgdGhpcy52aWV3KTtcbiAgICB9XG4gICAgcmV0dXJuIEluamVjdG9yLk5VTEw7XG4gIH1cblxuICBnZXQgY29tcG9uZW50KCk6IGFueSB7XG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRWaWV3ID0gdGhpcy52aWV3W1RWSUVXXTtcbiAgICBjb25zdCBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsID0gdFZpZXcuY29tcG9uZW50cztcblxuICAgIHJldHVybiAoY29tcG9uZW50cyAmJiBjb21wb25lbnRzLmluZGV4T2YodGhpcy5ub2RlSW5kZXgpID09IC0xKSA/XG4gICAgICAgIG51bGwgOlxuICAgICAgICB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdLmRhdGFbQ09OVEVYVF07XG4gIH1cblxuICAvLyBUT0RPKHZpY2IpOiBhZGQgdmlldyBwcm92aWRlcnMgd2hlbiBzdXBwb3J0ZWRcbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCBtYXRjaGVkRGlyZWN0aXZlczogYW55W10gPSBbXTtcblxuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZERpcmVjdGl2ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlcyA9IHRoaXMudmlld1tESVJFQ1RJVkVTXTtcblxuICAgIGlmIChkaXJlY3RpdmVzKSB7XG4gICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgICBmb3IgKGxldCBkaXJJbmRleCA9IDA7IGRpckluZGV4IDwgZGlyZWN0aXZlcy5sZW5ndGg7IGRpckluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlID0gZGlyZWN0aXZlc1tkaXJJbmRleF07XG4gICAgICAgIGlmIChnZXRMRWxlbWVudE5vZGUoZGlyZWN0aXZlKSA9PT0gY3VycmVudE5vZGUpIHtcbiAgICAgICAgICBtYXRjaGVkRGlyZWN0aXZlcy5wdXNoKGRpcmVjdGl2ZS5jb25zdHJ1Y3Rvcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZWREaXJlY3RpdmVzO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIC8vIFRPRE8odmljYik6IGltcGxlbWVudCByZXRyaWV2aW5nIHJlZmVyZW5jZXNcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCB5ZXQgaW4gaXZ5Jyk7XG4gIH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkge1xuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGxOb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICByZXR1cm4gbE5vZGUudmlld1tDT05URVhUXTtcbiAgfVxuXG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICAvLyBUT0RPKHZpY2IpOiBjaGVjayBwcmV2aW91cyBpbXBsZW1lbnRhdGlvblxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKTogdm9pZCB7IGNvbnNvbGUuZXJyb3IoLi4udmFsdWVzKTsgfVxufVxuIl19