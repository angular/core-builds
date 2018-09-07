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
            const lElementNode = this.view[this.nodeIndex];
            /** @type {?} */
            const nodeInjector = lElementNode.nodeInjector;
            if (nodeInjector) {
                return new di.NodeInjector(nodeInjector);
            }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3hDLE9BQU8sRUFBaUIscUJBQXFCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV2RSxPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEQsT0FBTyxLQUFLLEVBQUUsTUFBTSxNQUFNLENBQUM7QUFDM0IsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7QUFPeEUsTUFBTSxPQUFPLDRCQUE2QixTQUFRLHFCQUFxQjs7Ozs7O0lBQ3JFLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFBOEI7O1FBQ3pELE1BQU0sUUFBUSxxQkFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQW1CLEVBQUM7UUFDN0UsUUFBUSxDQUFDLG1CQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFPRCxNQUFNLG1CQUFtQjs7OztJQUd2QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXOztRQUVyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQ3BEOzs7O0lBRUQsSUFBSSxJQUFJLEtBQVUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7Ozs7SUFFekMsSUFBSSxRQUFRO1FBQ1YsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTs7WUFDM0IsTUFBTSxZQUFZLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztZQUM3RCxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO1lBRS9DLElBQUksWUFBWSxFQUFFO2dCQUNoQixPQUFPLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUMxQztTQUNGO1FBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO0tBQ3RCOzs7O0lBRUQsSUFBSSxTQUFTOztRQUVYLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDYjs7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUMvQixNQUFNLFVBQVUsR0FBa0IsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUVuRCxPQUFPLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM3Qzs7OztJQUdELElBQUksY0FBYzs7UUFDaEIsTUFBTSxpQkFBaUIsR0FBVSxFQUFFLENBQUM7O1FBR3BDLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxpQkFBaUIsQ0FBQztTQUMxQjs7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXpDLElBQUksVUFBVSxFQUFFOztZQUNkLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLEtBQUssSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFOztnQkFDL0QsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsS0FBSyxXQUFXLEVBQUU7b0JBQzlDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQy9DO2FBQ0Y7U0FDRjtRQUNELE9BQU8saUJBQWlCLENBQUM7S0FDMUI7Ozs7SUFFRCxJQUFJLFVBQVU7O1FBRVosTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0tBQy9DOzs7O0lBRUQsSUFBSSxPQUFPO1FBQ1QsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtZQUMzQixPQUFPLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1Qjs7OztJQUVELElBQUksc0JBQXNCLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFFaEYsSUFBSSxVQUFVLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUdwRSxRQUFRLENBQUMsT0FBZ0IsRUFBRSxHQUFHLE1BQWEsSUFBVSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUNqRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z1JlbmRlcmVyMiwgRGVidWdSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi92aWV3L3NlcnZpY2VzJztcblxuaW1wb3J0IHtnZXRMRWxlbWVudE5vZGV9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0ICogYXMgZGkgZnJvbSAnLi9kaSc7XG5pbXBvcnQge19nZXRWaWV3RGF0YX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMRWxlbWVudE5vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgRElSRUNUSVZFUywgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG4vKipcbiAqIEFkYXB0cyB0aGUgRGVidWdSZW5kZXJlckZhY3RvcnkyIHRvIGNyZWF0ZSBhIERlYnVnUmVuZGVyZXIyIHNwZWNpZmljIGZvciBJVlkuXG4gKlxuICogVGhlIGNyZWF0ZWQgRGVidWdSZW5kZXJlciBrbm93IGhvdyB0byBjcmVhdGUgYSBEZWJ1ZyBDb250ZXh0IHNwZWNpZmljIHRvIElWWS5cbiAqL1xuZXhwb3J0IGNsYXNzIFJlbmRlcjNEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgZXh0ZW5kcyBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIge1xuICBjcmVhdGVSZW5kZXJlcihlbGVtZW50OiBhbnksIHJlbmRlckRhdGE6IFJlbmRlcmVyVHlwZTJ8bnVsbCk6IFJlbmRlcmVyMiB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBzdXBlci5jcmVhdGVSZW5kZXJlcihlbGVtZW50LCByZW5kZXJEYXRhKSBhcyBEZWJ1Z1JlbmRlcmVyMjtcbiAgICByZW5kZXJlci5kZWJ1Z0NvbnRleHRGYWN0b3J5ID0gKCkgPT4gbmV3IFJlbmRlcjNEZWJ1Z0NvbnRleHQoX2dldFZpZXdEYXRhKCkpO1xuICAgIHJldHVybiByZW5kZXJlcjtcbiAgfVxufVxuXG4vKipcbiAqIFN0b3JlcyBjb250ZXh0IGluZm9ybWF0aW9uIGFib3V0IHZpZXcgbm9kZXMuXG4gKlxuICogVXNlZCBpbiB0ZXN0cyB0byByZXRyaWV2ZSBpbmZvcm1hdGlvbiB0aG9zZSBub2Rlcy5cbiAqL1xuY2xhc3MgUmVuZGVyM0RlYnVnQ29udGV4dCBpbXBsZW1lbnRzIERlYnVnQ29udGV4dCB7XG4gIHJlYWRvbmx5IG5vZGVJbmRleDogbnVtYmVyfG51bGw7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSB2aWV3RGF0YTogTFZpZXdEYXRhKSB7XG4gICAgLy8gVGhlIExOb2RlIHdpbGwgYmUgY3JlYXRlZCBuZXh0IGFuZCBhcHBlbmRlZCB0byB2aWV3RGF0YVxuICAgIHRoaXMubm9kZUluZGV4ID0gdmlld0RhdGEgPyB2aWV3RGF0YS5sZW5ndGggOiBudWxsO1xuICB9XG5cbiAgZ2V0IHZpZXcoKTogYW55IHsgcmV0dXJuIHRoaXMudmlld0RhdGE7IH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGlmICh0aGlzLm5vZGVJbmRleCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgbEVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgICAgY29uc3Qgbm9kZUluamVjdG9yID0gbEVsZW1lbnROb2RlLm5vZGVJbmplY3RvcjtcblxuICAgICAgaWYgKG5vZGVJbmplY3Rvcikge1xuICAgICAgICByZXR1cm4gbmV3IGRpLk5vZGVJbmplY3Rvcihub2RlSW5qZWN0b3IpO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gSW5qZWN0b3IuTlVMTDtcbiAgfVxuXG4gIGdldCBjb21wb25lbnQoKTogYW55IHtcbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgY29uc3QgdFZpZXcgPSB0aGlzLnZpZXdbVFZJRVddO1xuICAgIGNvbnN0IGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwgPSB0Vmlldy5jb21wb25lbnRzO1xuXG4gICAgcmV0dXJuIChjb21wb25lbnRzICYmIGNvbXBvbmVudHMuaW5kZXhPZih0aGlzLm5vZGVJbmRleCkgPT0gLTEpID9cbiAgICAgICAgbnVsbCA6XG4gICAgICAgIHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF0uZGF0YVtDT05URVhUXTtcbiAgfVxuXG4gIC8vIFRPRE8odmljYik6IGFkZCB2aWV3IHByb3ZpZGVycyB3aGVuIHN1cHBvcnRlZFxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10ge1xuICAgIGNvbnN0IG1hdGNoZWREaXJlY3RpdmVzOiBhbnlbXSA9IFtdO1xuXG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBtYXRjaGVkRGlyZWN0aXZlcztcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmVzID0gdGhpcy52aWV3W0RJUkVDVElWRVNdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICAgIGNvbnN0IGN1cnJlbnROb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICAgIGZvciAobGV0IGRpckluZGV4ID0gMDsgZGlySW5kZXggPCBkaXJlY3RpdmVzLmxlbmd0aDsgZGlySW5kZXgrKykge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSBkaXJlY3RpdmVzW2RpckluZGV4XTtcbiAgICAgICAgaWYgKGdldExFbGVtZW50Tm9kZShkaXJlY3RpdmUpID09PSBjdXJyZW50Tm9kZSkge1xuICAgICAgICAgIG1hdGNoZWREaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlZERpcmVjdGl2ZXM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgLy8gVE9ETyh2aWNiKTogaW1wbGVtZW50IHJldHJpZXZpbmcgcmVmZXJlbmNlc1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIHlldCBpbiBpdnknKTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgIHJldHVybiBsTm9kZS52aWV3W0NPTlRFWFRdO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8odmljYik6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pOiB2b2lkIHsgY29uc29sZS5lcnJvciguLi52YWx1ZXMpOyB9XG59XG4iXX0=