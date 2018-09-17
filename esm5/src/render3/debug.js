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
                var lElementNode = this.view[this.nodeIndex];
                var nodeInjector = lElementNode.nodeInjector;
                if (nodeInjector) {
                    return new di.NodeInjector(nodeInjector);
                }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEMsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMzQixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFNUMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFeEU7Ozs7R0FJRztBQUNIO0lBQWtELHdEQUFxQjtJQUF2RTs7SUFNQSxDQUFDO0lBTEMscURBQWMsR0FBZCxVQUFlLE9BQVksRUFBRSxVQUE4QjtRQUN6RCxJQUFNLFFBQVEsR0FBRyxpQkFBTSxjQUFjLFlBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsQ0FBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsY0FBTSxPQUFBLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsbUNBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBa0QscUJBQXFCLEdBTXRFOztBQUVEOzs7O0dBSUc7QUFDSDtJQUdFLDZCQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENB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QUksMkNBQVU7YUFBZCxjQUF3QixNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVwRSw0Q0FBNEM7SUFDNUMsc0NBQVEsR0FBUixVQUFTLE9BQWdCO1FBQUUsZ0JBQWdCO2FBQWhCLFVBQWdCLEVBQWhCLHFCQUFnQixFQUFoQixJQUFnQjtZQUFoQiwrQkFBZ0I7O1FBQVUsT0FBTyxDQUFDLEtBQUssT0FBYixPQUFPLG1CQUFVLE1BQU0sR0FBRTtJQUFDLENBQUM7SUFDbEYsMEJBQUM7QUFBRCxDQUFDLEFBOUVELElBOEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldyc7XG5pbXBvcnQge0RlYnVnUmVuZGVyZXIyLCBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3ZpZXcvc2VydmljZXMnO1xuXG5pbXBvcnQge2dldExFbGVtZW50Tm9kZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQgKiBhcyBkaSBmcm9tICcuL2RpJztcbmltcG9ydCB7X2dldFZpZXdEYXRhfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0xFbGVtZW50Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtDT05URVhULCBESVJFQ1RJVkVTLCBMVmlld0RhdGEsIFRWSUVXfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAoKSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChfZ2V0Vmlld0RhdGEoKSk7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59XG5cbi8qKlxuICogU3RvcmVzIGNvbnRleHQgaW5mb3JtYXRpb24gYWJvdXQgdmlldyBub2Rlcy5cbiAqXG4gKiBVc2VkIGluIHRlc3RzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIHRob3NlIG5vZGVzLlxuICovXG5jbGFzcyBSZW5kZXIzRGVidWdDb250ZXh0IGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcmVhZG9ubHkgbm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgICAvLyBUaGUgTE5vZGUgd2lsbCBiZSBjcmVhdGVkIG5leHQgYW5kIGFwcGVuZGVkIHRvIHZpZXdEYXRhXG4gICAgdGhpcy5ub2RlSW5kZXggPSB2aWV3RGF0YSA/IHZpZXdEYXRhLmxlbmd0aCA6IG51bGw7XG4gIH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gdGhpcy52aWV3RGF0YTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBsRWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgICBjb25zdCBub2RlSW5qZWN0b3IgPSBsRWxlbWVudE5vZGUubm9kZUluamVjdG9yO1xuXG4gICAgICBpZiAobm9kZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGkuTm9kZUluamVjdG9yKG5vZGVJbmplY3Rvcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBJbmplY3Rvci5OVUxMO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkge1xuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB0VmlldyA9IHRoaXMudmlld1tUVklFV107XG4gICAgY29uc3QgY29tcG9uZW50czogbnVtYmVyW118bnVsbCA9IHRWaWV3LmNvbXBvbmVudHM7XG5cbiAgICByZXR1cm4gKGNvbXBvbmVudHMgJiYgY29tcG9uZW50cy5pbmRleE9mKHRoaXMubm9kZUluZGV4KSA9PSAtMSkgP1xuICAgICAgICBudWxsIDpcbiAgICAgICAgdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XS5kYXRhW0NPTlRFWFRdO1xuICB9XG5cbiAgLy8gVE9ETyh2aWNiKTogYWRkIHZpZXcgcHJvdmlkZXJzIHdoZW4gc3VwcG9ydGVkXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgbWF0Y2hlZERpcmVjdGl2ZXM6IGFueVtdID0gW107XG5cbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG1hdGNoZWREaXJlY3RpdmVzO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSB0aGlzLnZpZXdbRElSRUNUSVZFU107XG5cbiAgICBpZiAoZGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgZGlySW5kZXggPSAwOyBkaXJJbmRleCA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBkaXJJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZXNbZGlySW5kZXhdO1xuICAgICAgICBpZiAoZ2V0TEVsZW1lbnROb2RlKGRpcmVjdGl2ZSkgPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgbWF0Y2hlZERpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUuY29uc3RydWN0b3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICAvLyBUT0RPKHZpY2IpOiBpbXBsZW1lbnQgcmV0cmlldmluZyByZWZlcmVuY2VzXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgeWV0IGluIGl2eScpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsTm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgcmV0dXJuIGxOb2RlLnZpZXdbQ09OVEVYVF07XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyh2aWNiKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb25cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn1cbiJdfQ==