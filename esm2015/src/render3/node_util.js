/**
 * @fileoverview added by tsickle
 * Generated from: packages/core/src/render3/node_util.ts
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { DECLARATION_VIEW, T_HOST } from './interfaces/view';
import { getParentInjectorViewOffset } from './util/injector_utils';
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the TNode of the parent injector is found.
 *
 * @param {?} location The location of the parent injector, which contains the view offset
 * @param {?} startView The LView instance from which to start walking up the view tree
 * @param {?} startTNode The TNode instance of the starting element
 * @return {?} The TNode of the parent injector
 */
export function getParentInjectorTNode(location, startView, startTNode) {
    if (startTNode.parent && startTNode.parent.injectorIndex !== -1) {
        // view offset is 0
        /** @type {?} */
        const injectorIndex = startTNode.parent.injectorIndex;
        /** @type {?} */
        let parentTNode = startTNode.parent;
        while (parentTNode.parent != null && injectorIndex == parentTNode.injectorIndex) {
            parentTNode = parentTNode.parent;
        }
        return parentTNode;
    }
    /** @type {?} */
    let viewOffset = getParentInjectorViewOffset(location);
    // view offset is 1
    /** @type {?} */
    let parentView = startView;
    /** @type {?} */
    let parentTNode = (/** @type {?} */ (startView[T_HOST]));
    // view offset is superior to 1
    while (viewOffset > 1) {
        parentView = (/** @type {?} */ (parentView[DECLARATION_VIEW]));
        parentTNode = (/** @type {?} */ (parentView[T_HOST]));
        viewOffset--;
    }
    return parentTNode;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibm9kZV91dGlsLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9ub2RlX3V0aWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0FBVUEsT0FBTyxFQUFDLGdCQUFnQixFQUFTLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xFLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLHVCQUF1QixDQUFDOzs7Ozs7Ozs7O0FBV2xFLE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsUUFBa0MsRUFBRSxTQUFnQixFQUFFLFVBQWlCO0lBRXpFLElBQUksVUFBVSxDQUFDLE1BQU0sSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRTs7O2NBRXpELGFBQWEsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFDLGFBQWE7O1lBQ2pELFdBQVcsR0FBRyxVQUFVLENBQUMsTUFBTTtRQUNuQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLGFBQWEsSUFBSSxXQUFXLENBQUMsYUFBYSxFQUFFO1lBQy9FLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO1NBQ2xDO1FBQ0QsT0FBTyxXQUFXLENBQUM7S0FDcEI7O1FBQ0csVUFBVSxHQUFHLDJCQUEyQixDQUFDLFFBQVEsQ0FBQzs7O1FBRWxELFVBQVUsR0FBRyxTQUFTOztRQUN0QixXQUFXLEdBQUcsbUJBQUEsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFnQjtJQUNuRCwrQkFBK0I7SUFDL0IsT0FBTyxVQUFVLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLFVBQVUsR0FBRyxtQkFBQSxVQUFVLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1FBQzVDLFdBQVcsR0FBRyxtQkFBQSxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQWdCLENBQUM7UUFDakQsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sV0FBVyxDQUFDO0FBQ3JCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVsYXRpdmVJbmplY3RvckxvY2F0aW9ufSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBMVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9yVmlld09mZnNldH0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcblxuLyoqXG4gKiBVbndyYXBzIGEgcGFyZW50IGluamVjdG9yIGxvY2F0aW9uIG51bWJlciB0byBmaW5kIHRoZSB2aWV3IG9mZnNldCBmcm9tIHRoZSBjdXJyZW50IGluamVjdG9yLFxuICogdGhlbiB3YWxrcyB1cCB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIHVudGlsIHRoZSBUTm9kZSBvZiB0aGUgcGFyZW50IGluamVjdG9yIGlzIGZvdW5kLlxuICpcbiAqIEBwYXJhbSBsb2NhdGlvbiBUaGUgbG9jYXRpb24gb2YgdGhlIHBhcmVudCBpbmplY3Rvciwgd2hpY2ggY29udGFpbnMgdGhlIHZpZXcgb2Zmc2V0XG4gKiBAcGFyYW0gc3RhcnRWaWV3IFRoZSBMVmlldyBpbnN0YW5jZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHdhbGtpbmcgdXAgdGhlIHZpZXcgdHJlZVxuICogQHBhcmFtIHN0YXJ0VE5vZGUgVGhlIFROb2RlIGluc3RhbmNlIG9mIHRoZSBzdGFydGluZyBlbGVtZW50XG4gKiBAcmV0dXJucyBUaGUgVE5vZGUgb2YgdGhlIHBhcmVudCBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JUTm9kZShcbiAgICBsb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBzdGFydFZpZXc6IExWaWV3LCBzdGFydFROb2RlOiBUTm9kZSk6IFRFbGVtZW50Tm9kZXxcbiAgICBUQ29udGFpbmVyTm9kZXxudWxsIHtcbiAgaWYgKHN0YXJ0VE5vZGUucGFyZW50ICYmIHN0YXJ0VE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgLy8gdmlldyBvZmZzZXQgaXMgMFxuICAgIGNvbnN0IGluamVjdG9ySW5kZXggPSBzdGFydFROb2RlLnBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIGxldCBwYXJlbnRUTm9kZSA9IHN0YXJ0VE5vZGUucGFyZW50O1xuICAgIHdoaWxlIChwYXJlbnRUTm9kZS5wYXJlbnQgIT0gbnVsbCAmJiBpbmplY3RvckluZGV4ID09IHBhcmVudFROb2RlLmluamVjdG9ySW5kZXgpIHtcbiAgICAgIHBhcmVudFROb2RlID0gcGFyZW50VE5vZGUucGFyZW50O1xuICAgIH1cbiAgICByZXR1cm4gcGFyZW50VE5vZGU7XG4gIH1cbiAgbGV0IHZpZXdPZmZzZXQgPSBnZXRQYXJlbnRJbmplY3RvclZpZXdPZmZzZXQobG9jYXRpb24pO1xuICAvLyB2aWV3IG9mZnNldCBpcyAxXG4gIGxldCBwYXJlbnRWaWV3ID0gc3RhcnRWaWV3O1xuICBsZXQgcGFyZW50VE5vZGUgPSBzdGFydFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIC8vIHZpZXcgb2Zmc2V0IGlzIHN1cGVyaW9yIHRvIDFcbiAgd2hpbGUgKHZpZXdPZmZzZXQgPiAxKSB7XG4gICAgcGFyZW50VmlldyA9IHBhcmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBwYXJlbnRUTm9kZSA9IHBhcmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgdmlld09mZnNldC0tO1xuICB9XG4gIHJldHVybiBwYXJlbnRUTm9kZTtcbn1cbiJdfQ==