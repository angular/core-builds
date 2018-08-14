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
import { NG_HOST_SYMBOL, _getViewData } from './instructions';
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
                    if (directive[NG_HOST_SYMBOL] === currentNode) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHeEMsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sS0FBSyxFQUFFLE1BQU0sTUFBTSxDQUFDO0FBQzNCLE9BQU8sRUFBQyxjQUFjLEVBQUUsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFNUQsT0FBTyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQWEsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFeEU7Ozs7R0FJRztBQUNIO0lBQWtELHdEQUFxQjtJQUF2RTs7SUFNQSxDQUFDO0lBTEMscURBQWMsR0FBZCxVQUFlLE9BQVksRUFBRSxVQUE4QjtRQUN6RCxJQUFNLFFBQVEsR0FBRyxpQkFBTSxjQUFjLFlBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsQ0FBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsY0FBTSxPQUFBLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsRUFBdkMsQ0FBdUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztJQUNsQixDQUFDO0lBQ0gsbUNBQUM7QUFBRCxDQUFDLEFBTkQsQ0FBa0QscUJBQXFCLEdBTXRFOztBQUVEOzs7O0dBSUc7QUFDSDtJQUdFLDZCQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXO1FBQ3JDLDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3JELENBQUM7SUFFRCxzQkFB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SyxDQUFDLHdCQUF3QixDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVwRSw0Q0FBNEM7SUFDNUMsc0NBQVEsR0FBUixVQUFTLE9BQWdCO1FBQUUsZ0JBQWdCO2FBQWhCLFVBQWdCLEVBQWhCLHFCQUFnQixFQUFoQixJQUFnQjtZQUFoQiwrQkFBZ0I7O1FBQVUsT0FBTyxDQUFDLEtBQUssT0FBYixPQUFPLG1CQUFVLE1BQU0sR0FBRTtJQUFDLENBQUM7SUFDbEYsMEJBQUM7QUFBRCxDQUFDLEFBOUVELElBOEVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldyc7XG5pbXBvcnQge0RlYnVnUmVuZGVyZXIyLCBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3ZpZXcvc2VydmljZXMnO1xuXG5pbXBvcnQgKiBhcyBkaSBmcm9tICcuL2RpJztcbmltcG9ydCB7TkdfSE9TVF9TWU1CT0wsIF9nZXRWaWV3RGF0YX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgRElSRUNUSVZFUywgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIEFkYXB0cyB0aGUgRGVidWdSZW5kZXJlckZhY3RvcnkyIHRvIGNyZWF0ZSBhIERlYnVnUmVuZGVyZXIyIHNwZWNpZmljIGZvciBJVlkuXG4gKlxuICogVGhlIGNyZWF0ZWQgRGVidWdSZW5kZXJlciBrbm93IGhvdyB0byBjcmVhdGUgYSBEZWJ1ZyBDb250ZXh0IHNwZWNpZmljIHRvIElWWS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgZXh0ZW5kcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIge1xuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBzdXBlci5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSBhcyBEZWJ1Z1JlbmRlcmVyMjtcbiAgICByZW5kZXJlci5kZWJ1Z0NvbnRleHRGYWN0b3J5ID0gKCkgPT4gbmV3IFJlbmRlcjNEZWJ1Z0NvbnRleHQoX2dldFZpZXdEYXRhKCkpO1xuICAgIHJldHVybiByZW5kZXJlcjtcbiAgfVxufVxuXG4vKipcbiAqIFN0b3JlcyBjb250ZXh0IGluZm9ybWF0aW9uIGFib3V0IHZpZXcgbm9kZXMuXG4gKlxuICogVXNlZCBpbiB0ZXN0cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiB0aG9zZSBub2Rlcy5cbiAqL1xuY2xhc3MgUmVuZGVyM0RlYnVnQ29udGV4dCBpbXBsZW1lbnRzIERlYnVnQ29udGV4dCB7XG4gIHJlYWRvbmx5IG5vZGVJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3RGF0YTogTFZpZXdEYXRhKSB7XG4gICAgLy8gVGhlIExOb2RlIHdpbGwgYmUgY3JlYXRlZCBuZXh0IGFuZCBhcHBlbmRlZCB0byB2aWV3RGF0YVxuICAgIHRoaXMubm9kZUluZGV4ID0gdmlld0RhdGEgPyB2aWV3RGF0YS5sZW5ndGggOiBudWxsO1xuICB9XG5cbiAgZ2V0IHZpZXcoKTogYW55IHsgcmV0dXJuIHRoaXMudmlld0RhdGE7IH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLm5vZGVJbmRleCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbEVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgY29uc3Qgbm9kZUluamVjdG9yID0gbEVsZW1lbnROb2RlLm5vZGVJbmplY3RvcjtcblxuICAgICAgaWYgKG5vZGVJbmplY3Rvcikge1xuICAgICAgICByZXR1cm4gbmV3IGRpLk5vZGVJbmplY3Rvcihub2RlSW5qZWN0b3IpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSW5qZWN0b3IuTlVMTDtcbiAgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHtcbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdFZpZXcgPSB0aGlzLnZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwgPSB0Vmlldy5jb21wb25lbnRzO1xuXG4gICAgcmV0dXJuIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMuaW5kZXhPZih0aGlzLm5vZGVJbmRleCkgPT0gLTEpID9cbiAgICAgICAgbnVsbCA6XG4gICAgICAgIHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF0uZGF0YVtDT05URVhUXTtcbiAgfVxuXG4gIC8vIFRPRE8odmljYik6IGFkZCB2aWV3IHByb3ZpZGVycyB3aGVuIHN1cHBvcnRlZFxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IG1hdGNoZWREaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuXG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmVzID0gdGhpcy52aWV3W0RJUkVDVElWRVNdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICAgIGZvciAobGV0IGRpckluZGV4ID0gMDsgZGlySW5kZXggPCBkaXJlY3RpdmVzLmxlbmd0aDsgZGlySW5kZXgrKykge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSBkaXJlY3RpdmVzW2RpckluZGV4XTtcbiAgICAgICAgaWYgKGRpcmVjdGl2ZVtOR19IT1NUX1NZTUJPTF0gPT09IGN1cnJlbnROb2RlKSB7XG4gICAgICAgICAgbWF0Y2hlZERpcmVjdGl2ZXMucHVzaChkaXJlY3RpdmUuY29uc3RydWN0b3IpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgfVxuXG4gIGdldCByZWZlcmVuY2VzKCk6IHtba2V5OiBzdHJpbmddOiBhbnl9IHtcbiAgICAvLyBUT0RPKHZpY2IpOiBpbXBsZW1lbnQgcmV0cmlldmluZyByZWZlcmVuY2VzXG4gICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgeWV0IGluIGl2eScpO1xuICB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBsTm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgcmV0dXJuIGxOb2RlLnZpZXdbQ09OVEVYVF07XG4gIH1cblxuICBnZXQgY29tcG9uZW50UmVuZGVyRWxlbWVudCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIGdldCByZW5kZXJOb2RlKCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyh2aWNiKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb25cbiAgbG9nRXJyb3IoY29uc29sZTogQ29uc29sZSwgLi4udmFsdWVzOiBhbnlbXSk6IHZvaWQgeyBjb25zb2xlLmVycm9yKC4uLnZhbHVlcyk7IH1cbn0iXX0=