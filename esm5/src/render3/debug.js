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
                var nodeInjector = di.getInjector(tNode, this.view);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEMsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRCxPQUFPLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMzQixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDNUMsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFeEU7Ozs7R0FJRztBQUNIO0lBQWtELHdEQUFxQjtJQUF2RTs7SUFNQSxDQUFDO0lBTEMscURBQWMsR0FBZCxVQUFlLE9BQVksRUFBRSxVQUE4QjtRQUN6RCxJQUFNLFFBQVEsR0FBRyxpQkFBTSxjQUFjLFlBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsQ0FBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsY0FBTSxPQUFBLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsbUNBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBa0QscUJBQXFCLEdBTXRFOztBQUVEOzs7O0dBSUc7QUFDSDtJQUdFLDZCQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENB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LElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVoRixzQkFBSSwyQ0FBVTthQUFkLGNBQXdCLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7OztPQUFBO0lBRXBFLDRDQUE0QztJQUM1QyxzQ0FBUSxHQUFSLFVBQVMsT0FBZ0I7UUFBRSxnQkFBZ0I7YUFBaEIsVUFBZ0IsRUFBaEIscUJBQWdCLEVBQWhCLElBQWdCO1lBQWhCLCtCQUFnQjs7UUFBVSxPQUFPLENBQUMsS0FBSyxPQUFiLE9BQU8sbUJBQVUsTUFBTSxHQUFFO0lBQUMsQ0FBQztJQUNsRiwwQkFBQztBQUFELENBQUMsQUE3RUQsSUE2RUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyLCBSZW5kZXJlclR5cGUyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3JztcbmltcG9ydCB7RGVidWdSZW5kZXJlcjIsIERlYnVnUmVuZGVyZXJGYWN0b3J5Mn0gZnJvbSAnLi4vdmlldy9zZXJ2aWNlcyc7XG5cbmltcG9ydCB7Z2V0TEVsZW1lbnROb2RlfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCAqIGFzIGRpIGZyb20gJy4vZGknO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGF9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q09OVEVYVCwgRElSRUNUSVZFUywgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIEFkYXB0cyB0aGUgRGVidWdSZW5kZXJlckZhY3RvcnkyIHRvIGNyZWF0ZSBhIERlYnVnUmVuZGVyZXIyIHNwZWNpZmljIGZvciBJVlkuXG4gKlxuICogVGhlIGNyZWF0ZWQgRGVidWdSZW5kZXJlciBrbm93IGhvdyB0byBjcmVhdGUgYSBEZWJ1ZyBDb250ZXh0IHNwZWNpZmljIHRvIElWWS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgZXh0ZW5kcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIge1xuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBzdXBlci5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSBhcyBEZWJ1Z1JlbmRlcmVyMjtcbiAgICByZW5kZXJlci5kZWJ1Z0NvbnRleHRGYWN0b3J5ID0gKCkgPT4gbmV3IFJlbmRlcjNEZWJ1Z0NvbnRleHQoX2dldFZpZXdEYXRhKCkpO1xuICAgIHJldHVybiByZW5kZXJlcjtcbiAgfVxufVxuXG4vKipcbiAqIFN0b3JlcyBjb250ZXh0IGluZm9ybWF0aW9uIGFib3V0IHZpZXcgbm9kZXMuXG4gKlxuICogVXNlZCBpbiB0ZXN0cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiB0aG9zZSBub2Rlcy5cbiAqL1xuY2xhc3MgUmVuZGVyM0RlYnVnQ29udGV4dCBpbXBsZW1lbnRzIERlYnVnQ29udGV4dCB7XG4gIHJlYWRvbmx5IG5vZGVJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3RGF0YTogTFZpZXdEYXRhKSB7XG4gICAgLy8gVGhlIExOb2RlIHdpbGwgYmUgY3JlYXRlZCBuZXh0IGFuZCBhcHBlbmRlZCB0byB2aWV3RGF0YVxuICAgIHRoaXMubm9kZUluZGV4ID0gdmlld0RhdGEgPyB2aWV3RGF0YS5sZW5ndGggOiBudWxsO1xuICB9XG5cbiAgZ2V0IHZpZXcoKTogYW55IHsgcmV0dXJuIHRoaXMudmlld0RhdGE7IH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLm5vZGVJbmRleCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0aGlzLnZpZXdbVFZJRVddLmRhdGFbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgY29uc3Qgbm9kZUluamVjdG9yID0gZGkuZ2V0SW5qZWN0b3IodE5vZGUsIHRoaXMudmlldyk7XG4gICAgICBpZiAobm9kZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBuZXcgZGkuTm9kZUluamVjdG9yKG5vZGVJbmplY3Rvcik7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBJbmplY3Rvci5OVUxMO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkge1xuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICBjb25zdCB0VmlldyA9IHRoaXMudmlld1tUVklFV107XG4gICAgY29uc3QgY29tcG9uZW50czogbnVtYmVyW118bnVsbCA9IHRWaWV3LmNvbXBvbmVudHM7XG5cbiAgICByZXR1cm4gKGNvbXBvbmVudHMgJiYgY29tcG9uZW50cy5pbmRleE9mKHRoaXMubm9kZUluZGV4KSA9PSAtMSkgP1xuICAgICAgICBudWxsIDpcbiAgICAgICAgdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XS5kYXRhW0NPTlRFWFRdO1xuICB9XG5cbiAgLy8gVE9ETyh2aWNiKTogYWRkIHZpZXcgcHJvdmlkZXJzIHdoZW4gc3VwcG9ydGVkXG4gIGdldCBwcm92aWRlclRva2VucygpOiBhbnlbXSB7XG4gICAgY29uc3QgbWF0Y2hlZERpcmVjdGl2ZXM6IGFueVtdID0gW107XG5cbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG1hdGNoZWREaXJlY3RpdmVzO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZXMgPSB0aGlzLnZpZXdbRElSRUNUSVZFU107XG5cbiAgICBpZiAoZGlyZWN0aXZlcykge1xuICAgICAgY29uc3QgY3VycmVudE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgZm9yIChsZXQgZGlySW5kZXggPSAwOyBkaXJJbmRleCA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBkaXJJbmRleCsrKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGRpcmVjdGl2ZXNbZGlySW5kZXhdO1xuICAgICAgICBpZiAoZ2V0TEVsZW1lbnROb2RlKGRpcmVjdGl2ZSkgPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgbWF0Y2hlZERpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUuY29uc3RydWN0b3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICAvLyBUT0RPKHZpY2IpOiBpbXBsZW1lbnQgcmV0cmlldmluZyByZWZlcmVuY2VzXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgeWV0IGluIGl2eScpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsTm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgcmV0dXJuIGxOb2RlLnZpZXdbQ09OVEVYVF07XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyh2aWNiKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb25cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn1cbiJdfQ==