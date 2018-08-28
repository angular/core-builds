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
import * as di from './di';
import { NG_HOST_SYMBOL, _getViewData } from './instructions';
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
                if (directive[NG_HOST_SYMBOL] === currentNode) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3hDLE9BQU8sRUFBaUIscUJBQXFCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV2RSxPQUFPLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMzQixPQUFPLEVBQUMsY0FBYyxFQUFFLFlBQVksRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRTVELE9BQU8sRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFhLEtBQUssRUFBQyxNQUFNLG1CQUFtQixDQUFDOzs7Ozs7QUFPeEUsTUFBTSxPQUFPLDRCQUE2QixTQUFRLHFCQUFxQjs7Ozs7O0lBQ3JFLGNBQWMsQ0FBQyxPQUFZLEVBQUUsVUFBOEI7O1FBQ3pELE1BQU0sUUFBUSxxQkFBRyxLQUFLLENBQUMsY0FBYyxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQW1CLEVBQUM7UUFDN0UsUUFBUSxDQUFDLG1CQUFtQixHQUFHLEdBQUcsRUFBRSxDQUFDLElBQUksbUJBQW1CLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUM3RSxPQUFPLFFBQVEsQ0FBQztLQUNqQjtDQUNGOzs7Ozs7QUFPRCxNQUFNLG1CQUFtQjs7OztJQUd2QixZQUFvQixRQUFtQjtRQUFuQixhQUFRLEdBQVIsUUFBUSxDQUFXOztRQUVyQyxJQUFJLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0tBQ3BEOzs7O0lBRUQsSUFBSSxJQUFJLEtBQVUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUU7Ozs7SUFFekMsSUFBSSxRQUFRO1FBQ1YsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTs7WUFDM0IsTUFBTSxZQUFZLEdBQWlCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztZQUM3RCxNQUFNLFlBQVksR0FBRyxZQUFZLENBQUMsWUFBWSxDQUFDO1lBRS9DLElBQUksWUFBWSxFQUFFO2dCQUNoQixPQUFPLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUMxQztTQUNGO1FBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO0tBQ3RCOzs7O0lBRUQsSUFBSSxTQUFTOztRQUVYLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDYjs7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUMvQixNQUFNLFVBQVUsR0FBa0IsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUVuRCxPQUFPLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM3Qzs7OztJQUdELElBQUksY0FBYzs7UUFDaEIsTUFBTSxpQkFBaUIsR0FBVSxFQUFFLENBQUM7O1FBR3BDLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxpQkFBaUIsQ0FBQztTQUMxQjs7UUFFRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBRXpDLElBQUksVUFBVSxFQUFFOztZQUNkLE1BQU0sV0FBVyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1lBQzlDLEtBQUssSUFBSSxRQUFRLEdBQUcsQ0FBQyxFQUFFLFFBQVEsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxFQUFFOztnQkFDL0QsTUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUN2QyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUMsS0FBSyxXQUFXLEVBQUU7b0JBQzdDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7aUJBQy9DO2FBQ0Y7U0FDRjtRQUNELE9BQU8saUJBQWlCLENBQUM7S0FDMUI7Ozs7SUFFRCxJQUFJLFVBQVU7O1FBRVosTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO0tBQy9DOzs7O0lBRUQsSUFBSSxPQUFPO1FBQ1QsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtZQUMzQixPQUFPLElBQUksQ0FBQztTQUNiOztRQUNELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hDLE9BQU8sS0FBSyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM1Qjs7OztJQUVELElBQUksc0JBQXNCLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFFaEYsSUFBSSxVQUFVLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUdwRSxRQUFRLENBQUMsT0FBZ0IsRUFBRSxHQUFHLE1BQWEsSUFBVSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUNqRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z1JlbmRlcmVyMiwgRGVidWdSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi92aWV3L3NlcnZpY2VzJztcblxuaW1wb3J0ICogYXMgZGkgZnJvbSAnLi9kaSc7XG5pbXBvcnQge05HX0hPU1RfU1lNQk9MLCBfZ2V0Vmlld0RhdGF9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7TEVsZW1lbnROb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIExWaWV3RGF0YSwgVFZJRVd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuLyoqXG4gKiBBZGFwdHMgdGhlIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB0byBjcmVhdGUgYSBEZWJ1Z1JlbmRlcmVyMiBzcGVjaWZpYyBmb3IgSVZZLlxuICpcbiAqIFRoZSBjcmVhdGVkIERlYnVnUmVuZGVyZXIga25vdyBob3cgdG8gY3JlYXRlIGEgRGVidWcgQ29udGV4dCBzcGVjaWZpYyB0byBJVlkuXG4gKi9cbmV4cG9ydCBjbGFzcyBSZW5kZXIzRGVidWdSZW5kZXJlckZhY3RvcnkyIGV4dGVuZHMgRGVidWdSZW5kZXJlckZhY3RvcnkyIHtcbiAgY3JlYXRlUmVuZGVyZXIoZWxlbWVudDogYW55LCByZW5kZXJEYXRhOiBSZW5kZXJlclR5cGUyfG51bGwpOiBSZW5kZXJlcjIge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gc3VwZXIuY3JlYXRlUmVuZGVyZXIoZWxlbWVudCwgcmVuZGVyRGF0YSkgYXMgRGVidWdSZW5kZXJlcjI7XG4gICAgcmVuZGVyZXIuZGVidWdDb250ZXh0RmFjdG9yeSA9ICgpID0+IG5ldyBSZW5kZXIzRGVidWdDb250ZXh0KF9nZXRWaWV3RGF0YSgpKTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICByZWFkb25seSBub2RlSW5kZXg6IG51bWJlcnxudWxsO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgdmlld0RhdGE6IExWaWV3RGF0YSkge1xuICAgIC8vIFRoZSBMTm9kZSB3aWxsIGJlIGNyZWF0ZWQgbmV4dCBhbmQgYXBwZW5kZWQgdG8gdmlld0RhdGFcbiAgICB0aGlzLm5vZGVJbmRleCA9IHZpZXdEYXRhID8gdmlld0RhdGEubGVuZ3RoIDogbnVsbDtcbiAgfVxuXG4gIGdldCB2aWV3KCk6IGFueSB7IHJldHVybiB0aGlzLnZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBpZiAodGhpcy5ub2RlSW5kZXggIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGxFbGVtZW50Tm9kZTogTEVsZW1lbnROb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICAgIGNvbnN0IG5vZGVJbmplY3RvciA9IGxFbGVtZW50Tm9kZS5ub2RlSW5qZWN0b3I7XG5cbiAgICAgIGlmIChub2RlSW5qZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBkaS5Ob2RlSW5qZWN0b3Iobm9kZUluamVjdG9yKTtcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIEluamVjdG9yLk5VTEw7XG4gIH1cblxuICBnZXQgY29tcG9uZW50KCk6IGFueSB7XG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRWaWV3ID0gdGhpcy52aWV3W1RWSUVXXTtcbiAgICBjb25zdCBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsID0gdFZpZXcuY29tcG9uZW50cztcblxuICAgIHJldHVybiAoY29tcG9uZW50cyAmJiBjb21wb25lbnRzLmluZGV4T2YodGhpcy5ub2RlSW5kZXgpID09IC0xKSA/XG4gICAgICAgIG51bGwgOlxuICAgICAgICB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdLmRhdGFbQ09OVEVYVF07XG4gIH1cblxuICAvLyBUT0RPKHZpY2IpOiBhZGQgdmlldyBwcm92aWRlcnMgd2hlbiBzdXBwb3J0ZWRcbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCBtYXRjaGVkRGlyZWN0aXZlczogYW55W10gPSBbXTtcblxuICAgIC8vIFRPRE8odmljYik6IHdoeS93aGVuXG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbWF0Y2hlZERpcmVjdGl2ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlcyA9IHRoaXMudmlld1tESVJFQ1RJVkVTXTtcblxuICAgIGlmIChkaXJlY3RpdmVzKSB7XG4gICAgICBjb25zdCBjdXJyZW50Tm9kZSA9IHRoaXMudmlld1t0aGlzLm5vZGVJbmRleF07XG4gICAgICBmb3IgKGxldCBkaXJJbmRleCA9IDA7IGRpckluZGV4IDwgZGlyZWN0aXZlcy5sZW5ndGg7IGRpckluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlID0gZGlyZWN0aXZlc1tkaXJJbmRleF07XG4gICAgICAgIGlmIChkaXJlY3RpdmVbTkdfSE9TVF9TWU1CT0xdID09PSBjdXJyZW50Tm9kZSkge1xuICAgICAgICAgIG1hdGNoZWREaXJlY3RpdmVzLnB1c2goZGlyZWN0aXZlLmNvbnN0cnVjdG9yKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbWF0Y2hlZERpcmVjdGl2ZXM7XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7XG4gICAgLy8gVE9ETyh2aWNiKTogaW1wbGVtZW50IHJldHJpZXZpbmcgcmVmZXJlbmNlc1xuICAgIHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIHlldCBpbiBpdnknKTtcbiAgfVxuXG4gIGdldCBjb250ZXh0KCk6IGFueSB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbE5vZGUgPSB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdO1xuICAgIHJldHVybiBsTm9kZS52aWV3W0NPTlRFWFRdO1xuICB9XG5cbiAgZ2V0IGNvbXBvbmVudFJlbmRlckVsZW1lbnQoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICBnZXQgcmVuZGVyTm9kZSgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8odmljYik6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uXG4gIGxvZ0Vycm9yKGNvbnNvbGU6IENvbnNvbGUsIC4uLnZhbHVlczogYW55W10pOiB2b2lkIHsgY29uc29sZS5lcnJvciguLi52YWx1ZXMpOyB9XG59Il19