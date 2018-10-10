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
import { _getViewData } from './instructions';
import { CONTEXT, TVIEW } from './interfaces/view';
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
        const directiveDefs = this.view[TVIEW].data;
        if (this.nodeIndex === null || directiveDefs == null) {
            return [];
        }
        /** @type {?} */
        const currentTNode = this.view[TVIEW].data[this.nodeIndex];
        /** @type {?} */
        const dirStart = currentTNode >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const dirEnd = dirStart + (currentTNode & 4095 /* DirectiveCountMask */);
        return directiveDefs.slice(dirStart, dirEnd);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBR3hDLE9BQU8sRUFBaUIscUJBQXFCLEVBQUMsTUFBTSxrQkFBa0IsQ0FBQztBQUV2RSxPQUFPLEtBQUssRUFBRSxNQUFNLE1BQU0sQ0FBQztBQUMzQixPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFNUMsT0FBTyxFQUFDLE9BQU8sRUFBYSxLQUFLLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQzs7Ozs7O0FBUTVELE1BQU0sT0FBTyw0QkFBNkIsU0FBUSxxQkFBcUI7Ozs7OztJQUNyRSxjQUFjLENBQUMsT0FBWSxFQUFFLFVBQThCOztRQUN6RCxNQUFNLFFBQVEscUJBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFtQixFQUFDO1FBQzdFLFFBQVEsQ0FBQyxtQkFBbUIsR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDN0UsT0FBTyxRQUFRLENBQUM7S0FDakI7Q0FDRjs7Ozs7O0FBT0QsTUFBTSxtQkFBbUI7Ozs7SUFHdkIsWUFBb0IsUUFBbUI7UUFBbkIsYUFBUSxHQUFSLFFBQVEsQ0FBVzs7UUFFckMsSUFBSSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztLQUNwRDs7OztJQUVELElBQUksSUFBSSxLQUFVLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxFQUFFOzs7O0lBRXpDLElBQUksUUFBUTtRQUNWLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7O1lBQzNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUNwRCxPQUFPLElBQUksRUFBRSxDQUFDLFlBQVksQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzlDO1FBQ0QsT0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDO0tBQ3RCOzs7O0lBRUQsSUFBSSxTQUFTOztRQUVYLElBQUksSUFBSSxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDM0IsT0FBTyxJQUFJLENBQUM7U0FDYjs7UUFFRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDOztRQUMvQixNQUFNLFVBQVUsR0FBa0IsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUVuRCxPQUFPLENBQUMsVUFBVSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM3RCxJQUFJLENBQUMsQ0FBQztZQUNOLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUM3Qzs7OztJQUdELElBQUksY0FBYzs7UUFFaEIsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDNUMsSUFBSSxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxhQUFhLElBQUksSUFBSSxFQUFFO1lBQ3BELE9BQU8sRUFBRSxDQUFDO1NBQ1g7O1FBRUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDOztRQUMzRCxNQUFNLFFBQVEsR0FBRyxZQUFZLHdDQUEwQyxDQUFDOztRQUN4RSxNQUFNLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxZQUFZLGdDQUFnQyxDQUFDLENBQUM7UUFDekUsT0FBTyxhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUM5Qzs7OztJQUVELElBQUksVUFBVTs7UUFFWixNQUFNLElBQUksS0FBSyxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDL0M7Ozs7SUFFRCxJQUFJLE9BQU87UUFDVCxJQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQzNCLE9BQU8sSUFBSSxDQUFDO1NBQ2I7O1FBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzVCOzs7O0lBRUQsSUFBSSxzQkFBc0IsS0FBVSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRTs7OztJQUVoRixJQUFJLFVBQVUsS0FBVSxNQUFNLElBQUksS0FBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsRUFBRTs7Ozs7O0lBR3BFLFFBQVEsQ0FBQyxPQUFnQixFQUFFLEdBQUcsTUFBYSxJQUFVLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFO0NBQ2pGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMiwgUmVuZGVyZXJUeXBlMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge0RlYnVnQ29udGV4dH0gZnJvbSAnLi4vdmlldyc7XG5pbXBvcnQge0RlYnVnUmVuZGVyZXIyLCBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTJ9IGZyb20gJy4uL3ZpZXcvc2VydmljZXMnO1xuXG5pbXBvcnQgKiBhcyBkaSBmcm9tICcuL2RpJztcbmltcG9ydCB7X2dldFZpZXdEYXRhfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1ROb2RlRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q09OVEVYVCwgTFZpZXdEYXRhLCBUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAoKSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChfZ2V0Vmlld0RhdGEoKSk7XG4gICAgcmV0dXJuIHJlbmRlcmVyO1xuICB9XG59XG5cbi8qKlxuICogU3RvcmVzIGNvbnRleHQgaW5mb3JtYXRpb24gYWJvdXQgdmlldyBub2Rlcy5cbiAqXG4gKiBVc2VkIGluIHRlc3RzIHRvIHJldHJpZXZlIGluZm9ybWF0aW9uIHRob3NlIG5vZGVzLlxuICovXG5jbGFzcyBSZW5kZXIzRGVidWdDb250ZXh0IGltcGxlbWVudHMgRGVidWdDb250ZXh0IHtcbiAgcmVhZG9ubHkgbm9kZUluZGV4OiBudW1iZXJ8bnVsbDtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIHZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgICAvLyBUaGUgTE5vZGUgd2lsbCBiZSBjcmVhdGVkIG5leHQgYW5kIGFwcGVuZGVkIHRvIHZpZXdEYXRhXG4gICAgdGhpcy5ub2RlSW5kZXggPSB2aWV3RGF0YSA/IHZpZXdEYXRhLmxlbmd0aCA6IG51bGw7XG4gIH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gdGhpcy52aWV3RGF0YTsgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ICE9PSBudWxsKSB7XG4gICAgICBjb25zdCB0Tm9kZSA9IHRoaXMudmlld1tUVklFV10uZGF0YVt0aGlzLm5vZGVJbmRleF07XG4gICAgICByZXR1cm4gbmV3IGRpLk5vZGVJbmplY3Rvcih0Tm9kZSwgdGhpcy52aWV3KTtcbiAgICB9XG4gICAgcmV0dXJuIEluamVjdG9yLk5VTEw7XG4gIH1cblxuICBnZXQgY29tcG9uZW50KCk6IGFueSB7XG4gICAgLy8gVE9ETyh2aWNiKTogd2h5L3doZW5cbiAgICBpZiAodGhpcy5ub2RlSW5kZXggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IHRWaWV3ID0gdGhpcy52aWV3W1RWSUVXXTtcbiAgICBjb25zdCBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsID0gdFZpZXcuY29tcG9uZW50cztcblxuICAgIHJldHVybiAoY29tcG9uZW50cyAmJiBjb21wb25lbnRzLmluZGV4T2YodGhpcy5ub2RlSW5kZXgpID09IC0xKSA/XG4gICAgICAgIG51bGwgOlxuICAgICAgICB0aGlzLnZpZXdbdGhpcy5ub2RlSW5kZXhdLmRhdGFbQ09OVEVYVF07XG4gIH1cblxuICAvLyBUT0RPKHZpY2IpOiBhZGQgdmlldyBwcm92aWRlcnMgd2hlbiBzdXBwb3J0ZWRcbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICAvLyBUT0RPKHZpY2IpOiB3aHkvd2hlblxuICAgIGNvbnN0IGRpcmVjdGl2ZURlZnMgPSB0aGlzLnZpZXdbVFZJRVddLmRhdGE7XG4gICAgaWYgKHRoaXMubm9kZUluZGV4ID09PSBudWxsIHx8IGRpcmVjdGl2ZURlZnMgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRUTm9kZSA9IHRoaXMudmlld1tUVklFV10uZGF0YVt0aGlzLm5vZGVJbmRleF07XG4gICAgY29uc3QgZGlyU3RhcnQgPSBjdXJyZW50VE5vZGUgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZGlyRW5kID0gZGlyU3RhcnQgKyAoY3VycmVudFROb2RlICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spO1xuICAgIHJldHVybiBkaXJlY3RpdmVEZWZzLnNsaWNlKGRpclN0YXJ0LCBkaXJFbmQpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0ge1xuICAgIC8vIFRPRE8odmljYik6IGltcGxlbWVudCByZXRyaWV2aW5nIHJlZmVyZW5jZXNcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCB5ZXQgaW4gaXZ5Jyk7XG4gIH1cblxuICBnZXQgY29udGV4dCgpOiBhbnkge1xuICAgIGlmICh0aGlzLm5vZGVJbmRleCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGxOb2RlID0gdGhpcy52aWV3W3RoaXMubm9kZUluZGV4XTtcbiAgICByZXR1cm4gbE5vZGUudmlld1tDT05URVhUXTtcbiAgfVxuXG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICAvLyBUT0RPKHZpY2IpOiBjaGVjayBwcmV2aW91cyBpbXBsZW1lbnRhdGlvblxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKTogdm9pZCB7IGNvbnNvbGUuZXJyb3IoLi4udmFsdWVzKTsgfVxufVxuIl19