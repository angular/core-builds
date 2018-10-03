/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
export class Render3DebugRendererFactory2 extends DebugRendererFactory2 {
    /**
     * @param {?} element
     * @param {?} renderData
     * @return {?}
     */
    createRenderer(element, renderData) {
        /** @type {?} */
        const renderer = /** @type {?} */ (super.createRenderer(element, renderData));
        renderer.debugContextFactory = () => new Render3DebugContext(_getViewData());
        return renderer;
    }
}
/**
 * Stores context information about view nodes.
 *
 * Used in tests to retrieve information those nodes.
 */
class Render3DebugContext {
    /**
     * @param {?} viewData
     */
    constructor(viewData) {
        this.viewData = viewData;
        // The LNode will be created next and appended to viewData
        this.nodeIndex = viewData ? viewData.length : null;
    }
    /**
     * @return {?}
     */
    get view() { return this.viewData; }
    /**
     * @return {?}
     */
    get injector() {
        if (this.nodeIndex !== null) {
            /** @type {?} */
            const tNode = this.view[TVIEW].data[this.nodeIndex];
            return new di.NodeInjector(tNode, this.view);
        }
        return Injector.NULL;
    }
    /**
     * @return {?}
     */
    get component() {
        // TODO(vicb): why/when
        if (this.nodeIndex === null) {
            return null;
        }
        /** @type {?} */
        const tView = this.view[TVIEW];
        /** @type {?} */
        const components = tView.components;
        return (components && components.indexOf(this.nodeIndex) == -1) ?
            null :
            this.view[this.nodeIndex].data[CONTEXT];
    }
    /**
     * @return {?}
     */
    get providerTokens() {
        /** @type {?} */
        const matchedDirectives = [];
        // TODO(vicb): why/when
        if (this.nodeIndex === null) {
            return matchedDirectives;
        }
        /** @type {?} */
        const directives = this.view[DIRECTIVES];
        if (directives) {
            /** @type {?} */
            const currentNode = this.view[this.nodeIndex];
            for (let dirIndex = 0; dirIndex < directives.length; dirIndex++) {
                /** @type {?} */
                const directive = directives[dirIndex];
                if (getLElementNode(directive) === currentNode) {
                    matchedDirectives.push(directive.constructor);
                }
            }
        }
        return matchedDirectives;
    }
    /**
     * @return {?}
     */
    get references() {
        // TODO(vicb): implement retrieving references
        throw new Error('Not implemented yet in ivy');
    }
    /**
     * @return {?}
     */
    get context() {
        if (this.nodeIndex === null) {
            return null;
        }
        /** @type {?} */
        const lNode = this.view[this.nodeIndex];
        return lNode.view[CONTEXT];
    }
    /**
     * @return {?}
     */
    get componentRenderElement() { throw new Error('Not implemented in ivy'); }
    /**
     * @return {?}
     */
    get renderNode() { throw new Error('Not implemented in ivy'); }
    /**
     * @param {?} console
     * @param {...?} values
     * @return {?}
     */
    logError(console, ...values) { console.error(...values); }
}
if (false) {
    /** @type {?} */
    Render3DebugContext.prototype.nodeIndex;
    /** @type {?} */
    Render3DebugContext.prototype.viewData;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3hDLE9BQU8sRUFBaUIscUJBQXFCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV2RSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDM0IsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVDLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7QUFPeEUsTUFBTSxPQUFPLDRCQUE2QixTQUFRLHFCQUFxQjs7Ozs7O0lBQ3JFLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFBOEI7O1FBQ3pELE1BQU0sUUFBUSxxQkFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQW1CLEVBQUM7UUFDN0UsUUFBUSxDQUFDLG1CQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFPRCxNQUFNLG1CQUFtQjs7OztJQUd2QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXOztRQUVyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQ3BEOzs7O0lBRUQsSUFBSSxJQUFJLEtBQVUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7Ozs7SUFFekMsSUFBSSxRQUFRO1FBQ1YsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTs7WUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQ3BELE9BQU8sSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDOUM7UUFDRCxPQUFPLFFBQVEsQ0FBQyxJQUFJLENBQUM7S0FDdEI7Ozs7SUFFRCxJQUFJLFNBQVM7O1FBRVgsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtZQUMzQixPQUFPLElBQUksQ0FBQztTQUNiOztRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7O1FBQy9CLE1BQU0sVUFBVSxHQUFrQixLQUFLLENBQUMsVUFBVSxDQUFDO1FBRW5ELE9BQU8sQ0FBQyxVQUFVLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdELElBQUksQ0FBQyxDQUFDO1lBQ04sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzdDOzs7O0lBR0QsSUFBSSxjQUFjOztRQUNoQixNQUFNLGlCQUFpQixHQUFVLEVBQUUsQ0FBQzs7UUFHcEMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtZQUMzQixPQUFPLGlCQUFpQixDQUFDO1NBQzFCOztRQUVELE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFekMsSUFBSSxVQUFVLEVBQUU7O1lBQ2QsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDOUMsS0FBSyxJQUFJLFFBQVEsR0FBRyxDQUFDLEVBQUUsUUFBUSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsUUFBUSxFQUFFLEVBQUU7O2dCQUMvRCxNQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBQ3ZDLElBQUksZUFBZSxDQUFDLFNBQVMsQ0FBQyxLQUFLLFdBQVcsRUFBRTtvQkFDOUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQztpQkFDL0M7YUFDRjtTQUNGO1FBQ0QsT0FBTyxpQkFBaUIsQ0FBQztLQUMxQjs7OztJQUVELElBQUksVUFBVTs7UUFFWixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7Ozs7SUFFRCxJQUFJLE9BQU87UUFDVCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQzNCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7O1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzVCOzs7O0lBRUQsSUFBSSxzQkFBc0IsS0FBVSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRTs7OztJQUVoRixJQUFJLFVBQVUsS0FBVSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRTs7Ozs7O0lBR3BFLFFBQVEsQ0FBQyxPQUFnQixFQUFFLEdBQUcsTUFBYSxJQUFVLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFO0NBQ2pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldyc7XG5pbXBvcnQge0RlYnVnUmVuZGVyZXIyLCBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3ZpZXcvc2VydmljZXMnO1xuXG5pbXBvcnQge2dldExFbGVtZW50Tm9kZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQgKiBhcyBkaSBmcm9tICcuL2RpJztcbmltcG9ydCB7X2dldFZpZXdEYXRhfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBBZGFwdHMgdGhlIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB0byBjcmVhdGUgYSBEZWJ1Z1JlbmRlcmVyMiBzcGVjaWZpYyBmb3IgSVZZLlxuICpcbiAqIFRoZSBjcmVhdGVkIERlYnVnUmVuZGVyZXIga25vdyBob3cgdG8gY3JlYXRlIGEgRGVidWcgQ29udGV4dCBzcGVjaWZpYyB0byBJVlkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZW5kZXIzRGVidWdSZW5kZXJlckZhY3RvcnkyIGV4dGVuZHMgRGVidWdSZW5kZXJlckZhY3RvcnkyIHtcbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gc3VwZXIuY3JlYXRlUmVuZGVyZXIoZWxlbWVudCwgcmVuZGVyRGF0YSkgYXMgRGVidWdSZW5kZXJlcjI7XG4gICAgcmVuZGVyZXIuZGVidWdDb250ZXh0RmFjdG9yeSA9ICgpID0+IG5ldyBSZW5kZXIzRGVidWdDb250ZXh0KF9nZXRWaWV3RGF0YSgpKTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICByZWFkb25seSBub2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlld0RhdGE6IExWaWV3RGF0YSkge1xuICAgIC8vIFRoZSBMTm9kZSB3aWxsIGJlIGNyZWF0ZWQgbmV4dCBhbmQgYXBwZW5kZWQgdG8gdmlld0RhdGFcbiAgICB0aGlzLm5vZGVJbmRleCA9IHZpZXdEYXRhID8gdmlld0RhdGEubGVuZ3RoIDogbnVsbDtcbiAgfVxuXG4gIGdldCB2aWV3KCk6IGFueSB7IHJldHVybiB0aGlzLnZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gdGhpcy52aWV3W1RWSUVXXS5kYXRhW3RoaXMubm9kZUluZGV4XTtcbiAgICAgIHJldHVybiBuZXcgZGkuTm9kZUluamVjdG9yKHROb2RlLCB0aGlzLnZpZXcpO1xuICAgIH1cbiAgICByZXR1cm4gSW5qZWN0b3IuTlVMTDtcbiAgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHtcbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdFZpZXcgPSB0aGlzLnZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwgPSB0Vmlldy5jb21wb25lbnRzO1xuXG4gICAgcmV0dXJuIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMuaW5kZXhPZih0aGlzLm5vZGVJbmRleCkgPT0gLTEpID9cbiAgICAgICAgbnVsbCA6XG4gICAgICAgIHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF0uZGF0YVtDT05URVhUXTtcbiAgfVxuXG4gIC8vIFRPRE8odmljYik6IGFkZCB2aWV3IHByb3ZpZGVycyB3aGVuIHN1cHBvcnRlZFxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IG1hdGNoZWREaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuXG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmVzID0gdGhpcy52aWV3W0RJUkVDVElWRVNdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICAgIGZvciAobGV0IGRpckluZGV4ID0gMDsgZGlySW5kZXggPCBkaXJlY3RpdmVzLmxlbmd0aDsgZGlySW5kZXgrKykge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSBkaXJlY3RpdmVzW2RpckluZGV4XTtcbiAgICAgICAgaWYgKGdldExFbGVtZW50Tm9kZShkaXJlY3RpdmUpID09PSBjdXJyZW50Tm9kZSkge1xuICAgICAgICAgIG1hdGNoZWREaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlZERpcmVjdGl2ZXM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgLy8gVE9ETyh2aWNiKTogaW1wbGVtZW50IHJldHJpZXZpbmcgcmVmZXJlbmNlc1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIHlldCBpbiBpdnknKTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgIHJldHVybiBsTm9kZS52aWV3W0NPTlRFWFRdO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8odmljYik6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pOiB2b2lkIHsgY29uc29sZS5lcnJvciguLi52YWx1ZXMpOyB9XG59XG4iXX0=