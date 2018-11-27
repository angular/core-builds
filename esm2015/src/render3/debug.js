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
import { DebugRendererFactory2 } from '../view/services';
import { getComponent, getInjector, getLocalRefs, loadContext } from './discovery_utils';
import { TVIEW } from './interfaces/view';
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
        renderer.debugContextFactory = (nativeElement) => new Render3DebugContext(nativeElement);
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
     * @param {?} _nativeNode
     */
    constructor(_nativeNode) {
        this._nativeNode = _nativeNode;
    }
    /**
     * @return {?}
     */
    get nodeIndex() { return loadContext(this._nativeNode).nodeIndex; }
    /**
     * @return {?}
     */
    get view() { return loadContext(this._nativeNode).lViewData; }
    /**
     * @return {?}
     */
    get injector() { return getInjector(this._nativeNode); }
    /**
     * @return {?}
     */
    get component() { return getComponent(this._nativeNode); }
    /**
     * @return {?}
     */
    get providerTokens() {
        /** @type {?} */
        const lDebugCtx = loadContext(this._nativeNode);
        /** @type {?} */
        const lViewData = lDebugCtx.lViewData;
        /** @type {?} */
        const tNode = /** @type {?} */ (lViewData[TVIEW].data[lDebugCtx.nodeIndex]);
        /** @type {?} */
        const directivesCount = tNode.flags & 4095 /* DirectiveCountMask */;
        if (directivesCount > 0) {
            /** @type {?} */
            const directiveIdxStart = tNode.flags >> 16 /* DirectiveStartingIndexShift */;
            /** @type {?} */
            const directiveIdxEnd = directiveIdxStart + directivesCount;
            /** @type {?} */
            const viewDirectiveDefs = this.view[TVIEW].data;
            /** @type {?} */
            const directiveDefs = /** @type {?} */ (viewDirectiveDefs.slice(directiveIdxStart, directiveIdxEnd));
            return directiveDefs.map(directiveDef => directiveDef.type);
        }
        return [];
    }
    /**
     * @return {?}
     */
    get references() { return getLocalRefs(this._nativeNode); }
    /**
     * @return {?}
     */
    get context() { throw new Error('Not implemented in ivy'); }
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
    Render3DebugContext.prototype._nativeNode;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWcuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RlYnVnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUFpQixxQkFBcUIsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBRXZFLE9BQU8sRUFBQyxZQUFZLEVBQUUsV0FBVyxFQUFFLFlBQVksRUFBRSxXQUFXLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUd2RixPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7Ozs7OztBQVF4QyxNQUFNLE9BQU8sNEJBQTZCLFNBQVEscUJBQXFCOzs7Ozs7SUFDckUsY0FBYyxDQUFDLE9BQVksRUFBRSxVQUE4Qjs7UUFDekQsTUFBTSxRQUFRLHFCQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBbUIsRUFBQztRQUM3RSxRQUFRLENBQUMsbUJBQW1CLEdBQUcsQ0FBQyxhQUFrQixFQUFFLEVBQUUsQ0FBQyxJQUFJLG1CQUFtQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQzlGLE9BQU8sUUFBUSxDQUFDO0tBQ2pCO0NBQ0Y7Ozs7OztBQU9ELE1BQU0sbUJBQW1COzs7O0lBQ3ZCLFlBQW9CLFdBQWdCO1FBQWhCLGdCQUFXLEdBQVgsV0FBVyxDQUFLO0tBQUk7Ozs7SUFFeEMsSUFBSSxTQUFTLEtBQWtCLE9BQU8sV0FBVyxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBRTs7OztJQUVoRixJQUFJLElBQUksS0FBVSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUU7Ozs7SUFFbkUsSUFBSSxRQUFRLEtBQWUsT0FBTyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFFbEUsSUFBSSxTQUFTLEtBQVUsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFFL0QsSUFBSSxjQUFjOztRQUNoQixNQUFNLFNBQVMsR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDOztRQUNoRCxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsU0FBUyxDQUFDOztRQUN0QyxNQUFNLEtBQUsscUJBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFVLEVBQUM7O1FBQ2xFLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLGdDQUFnQyxDQUFDO1FBRXBFLElBQUksZUFBZSxHQUFHLENBQUMsRUFBRTs7WUFDdkIsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsS0FBSyx3Q0FBMEMsQ0FBQzs7WUFDaEYsTUFBTSxlQUFlLEdBQUcsaUJBQWlCLEdBQUcsZUFBZSxDQUFDOztZQUM1RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDOztZQUNoRCxNQUFNLGFBQWEscUJBQ2YsaUJBQWlCLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBd0IsRUFBQztZQUV2RixPQUFPLGFBQWEsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDN0Q7UUFFRCxPQUFPLEVBQUUsQ0FBQztLQUNYOzs7O0lBRUQsSUFBSSxVQUFVLEtBQTJCLE9BQU8sWUFBWSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFOzs7O0lBR2pGLElBQUksT0FBTyxLQUFVLE1BQU0sSUFBSSxLQUFLLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxFQUFFOzs7O0lBR2pFLElBQUksc0JBQXNCLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7SUFHaEYsSUFBSSxVQUFVLEtBQVUsTUFBTSxJQUFJLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDLEVBQUU7Ozs7OztJQUdwRSxRQUFRLENBQUMsT0FBZ0IsRUFBRSxHQUFHLE1BQWEsSUFBVSxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRTtDQUNqRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtSZW5kZXJlcjIsIFJlbmRlcmVyVHlwZTJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtEZWJ1Z0NvbnRleHR9IGZyb20gJy4uL3ZpZXcnO1xuaW1wb3J0IHtEZWJ1Z1JlbmRlcmVyMiwgRGVidWdSZW5kZXJlckZhY3RvcnkyfSBmcm9tICcuLi92aWV3L3NlcnZpY2VzJztcblxuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldEluamVjdG9yLCBnZXRMb2NhbFJlZnMsIGxvYWRDb250ZXh0fSBmcm9tICcuL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtUTm9kZSwgVE5vZGVGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtUVklFV30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuXG5cbi8qKlxuICogQWRhcHRzIHRoZSBEZWJ1Z1JlbmRlcmVyRmFjdG9yeTIgdG8gY3JlYXRlIGEgRGVidWdSZW5kZXJlcjIgc3BlY2lmaWMgZm9yIElWWS5cbiAqXG4gKiBUaGUgY3JlYXRlZCBEZWJ1Z1JlbmRlcmVyIGtub3cgaG93IHRvIGNyZWF0ZSBhIERlYnVnIENvbnRleHQgc3BlY2lmaWMgdG8gSVZZLlxuICovXG5leHBvcnQgY2xhc3MgUmVuZGVyM0RlYnVnUmVuZGVyZXJGYWN0b3J5MiBleHRlbmRzIERlYnVnUmVuZGVyZXJGYWN0b3J5MiB7XG4gIGNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQ6IGFueSwgcmVuZGVyRGF0YTogUmVuZGVyZXJUeXBlMnxudWxsKTogUmVuZGVyZXIyIHtcbiAgICBjb25zdCByZW5kZXJlciA9IHN1cGVyLmNyZWF0ZVJlbmRlcmVyKGVsZW1lbnQsIHJlbmRlckRhdGEpIGFzIERlYnVnUmVuZGVyZXIyO1xuICAgIHJlbmRlcmVyLmRlYnVnQ29udGV4dEZhY3RvcnkgPSAobmF0aXZlRWxlbWVudDogYW55KSA9PiBuZXcgUmVuZGVyM0RlYnVnQ29udGV4dChuYXRpdmVFbGVtZW50KTtcbiAgICByZXR1cm4gcmVuZGVyZXI7XG4gIH1cbn1cblxuLyoqXG4gKiBTdG9yZXMgY29udGV4dCBpbmZvcm1hdGlvbiBhYm91dCB2aWV3IG5vZGVzLlxuICpcbiAqIFVzZWQgaW4gdGVzdHMgdG8gcmV0cmlldmUgaW5mb3JtYXRpb24gdGhvc2Ugbm9kZXMuXG4gKi9cbmNsYXNzIFJlbmRlcjNEZWJ1Z0NvbnRleHQgaW1wbGVtZW50cyBEZWJ1Z0NvbnRleHQge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9uYXRpdmVOb2RlOiBhbnkpIHt9XG5cbiAgZ2V0IG5vZGVJbmRleCgpOiBudW1iZXJ8bnVsbCB7IHJldHVybiBsb2FkQ29udGV4dCh0aGlzLl9uYXRpdmVOb2RlKS5ub2RlSW5kZXg7IH1cblxuICBnZXQgdmlldygpOiBhbnkgeyByZXR1cm4gbG9hZENvbnRleHQodGhpcy5fbmF0aXZlTm9kZSkubFZpZXdEYXRhOyB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHsgcmV0dXJuIGdldEluamVjdG9yKHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudCgpOiBhbnkgeyByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMuX25hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHtcbiAgICBjb25zdCBsRGVidWdDdHggPSBsb2FkQ29udGV4dCh0aGlzLl9uYXRpdmVOb2RlKTtcbiAgICBjb25zdCBsVmlld0RhdGEgPSBsRGVidWdDdHgubFZpZXdEYXRhO1xuICAgIGNvbnN0IHROb2RlID0gbFZpZXdEYXRhW1RWSUVXXS5kYXRhW2xEZWJ1Z0N0eC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgIGNvbnN0IGRpcmVjdGl2ZXNDb3VudCA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICBpZiAoZGlyZWN0aXZlc0NvdW50ID4gMCkge1xuICAgICAgY29uc3QgZGlyZWN0aXZlSWR4U3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeEVuZCA9IGRpcmVjdGl2ZUlkeFN0YXJ0ICsgZGlyZWN0aXZlc0NvdW50O1xuICAgICAgY29uc3Qgdmlld0RpcmVjdGl2ZURlZnMgPSB0aGlzLnZpZXdbVFZJRVddLmRhdGE7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZzID1cbiAgICAgICAgICB2aWV3RGlyZWN0aXZlRGVmcy5zbGljZShkaXJlY3RpdmVJZHhTdGFydCwgZGlyZWN0aXZlSWR4RW5kKSBhcyBEaXJlY3RpdmVEZWY8YW55PltdO1xuXG4gICAgICByZXR1cm4gZGlyZWN0aXZlRGVmcy5tYXAoZGlyZWN0aXZlRGVmID0+IGRpcmVjdGl2ZURlZi50eXBlKTtcbiAgICB9XG5cbiAgICByZXR1cm4gW107XG4gIH1cblxuICBnZXQgcmVmZXJlbmNlcygpOiB7W2tleTogc3RyaW5nXTogYW55fSB7IHJldHVybiBnZXRMb2NhbFJlZnModGhpcy5fbmF0aXZlTm9kZSk7IH1cblxuICAvLyBUT0RPKHBrKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb24gYW5kIHJlLWltcGxlbWVudFxuICBnZXQgY29udGV4dCgpOiBhbnkgeyB0aHJvdyBuZXcgRXJyb3IoJ05vdCBpbXBsZW1lbnRlZCBpbiBpdnknKTsgfVxuXG4gIC8vIFRPRE8ocGspOiBjaGVjayBwcmV2aW91cyBpbXBsZW1lbnRhdGlvbiBhbmQgcmUtaW1wbGVtZW50XG4gIGdldCBjb21wb25lbnRSZW5kZXJFbGVtZW50KCk6IGFueSB7IHRocm93IG5ldyBFcnJvcignTm90IGltcGxlbWVudGVkIGluIGl2eScpOyB9XG5cbiAgLy8gVE9ETyhwayk6IGNoZWNrIHByZXZpb3VzIGltcGxlbWVudGF0aW9uIGFuZCByZS1pbXBsZW1lbnRcbiAgZ2V0IHJlbmRlck5vZGUoKTogYW55IHsgdGhyb3cgbmV3IEVycm9yKCdOb3QgaW1wbGVtZW50ZWQgaW4gaXZ5Jyk7IH1cblxuICAvLyBUT0RPKHBrKTogY2hlY2sgcHJldmlvdXMgaW1wbGVtZW50YXRpb24gYW5kIHJlLWltcGxlbWVudFxuICBsb2dFcnJvcihjb25zb2xlOiBDb25zb2xlLCAuLi52YWx1ZXM6IGFueVtdKTogdm9pZCB7IGNvbnNvbGUuZXJyb3IoLi4udmFsdWVzKTsgfVxufVxuIl19