/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { asTextData } from './types';
import { checkAndUpdateBinding, getParentRenderElement } from './util';
/**
 * @param {?} checkIndex
 * @param {?} ngContentIndex
 * @param {?} staticText
 * @return {?}
 */
export function textDef(checkIndex, ngContentIndex, staticText) {
    /** @type {?} */
    const bindings = [];
    for (let i = 1; i < staticText.length; i++) {
        bindings[i - 1] = {
            flags: 8 /* TypeProperty */,
            name: null,
            ns: null,
            nonMinifiedName: null,
            securityContext: null,
            suffix: staticText[i],
        };
    }
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        checkIndex,
        flags: 2 /* TypeText */,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0,
        matchedQueries: {},
        matchedQueryIds: 0,
        references: {}, ngContentIndex,
        childCount: 0, bindings,
        bindingFlags: 8 /* TypeProperty */,
        outputs: [],
        element: null,
        provider: null,
        text: { prefix: staticText[0] },
        query: null,
        ngContent: null,
    };
}
/**
 * @param {?} view
 * @param {?} renderHost
 * @param {?} def
 * @return {?}
 */
export function createText(view, renderHost, def) {
    /** @type {?} */
    let renderNode;
    /** @type {?} */
    const renderer = view.renderer;
    renderNode = renderer.createText((/** @type {?} */ (def.text)).prefix);
    /** @type {?} */
    const parentEl = getParentRenderElement(view, renderHost, def);
    if (parentEl) {
        renderer.appendChild(parentEl, renderNode);
    }
    return { renderText: renderNode };
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} v0
 * @param {?} v1
 * @param {?} v2
 * @param {?} v3
 * @param {?} v4
 * @param {?} v5
 * @param {?} v6
 * @param {?} v7
 * @param {?} v8
 * @param {?} v9
 * @return {?}
 */
export function checkAndUpdateTextInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    let changed = false;
    /** @type {?} */
    const bindings = def.bindings;
    /** @type {?} */
    const bindLen = bindings.length;
    if (bindLen > 0 && checkAndUpdateBinding(view, def, 0, v0))
        changed = true;
    if (bindLen > 1 && checkAndUpdateBinding(view, def, 1, v1))
        changed = true;
    if (bindLen > 2 && checkAndUpdateBinding(view, def, 2, v2))
        changed = true;
    if (bindLen > 3 && checkAndUpdateBinding(view, def, 3, v3))
        changed = true;
    if (bindLen > 4 && checkAndUpdateBinding(view, def, 4, v4))
        changed = true;
    if (bindLen > 5 && checkAndUpdateBinding(view, def, 5, v5))
        changed = true;
    if (bindLen > 6 && checkAndUpdateBinding(view, def, 6, v6))
        changed = true;
    if (bindLen > 7 && checkAndUpdateBinding(view, def, 7, v7))
        changed = true;
    if (bindLen > 8 && checkAndUpdateBinding(view, def, 8, v8))
        changed = true;
    if (bindLen > 9 && checkAndUpdateBinding(view, def, 9, v9))
        changed = true;
    if (changed) {
        /** @type {?} */
        let value = (/** @type {?} */ (def.text)).prefix;
        if (bindLen > 0)
            value += _addInterpolationPart(v0, bindings[0]);
        if (bindLen > 1)
            value += _addInterpolationPart(v1, bindings[1]);
        if (bindLen > 2)
            value += _addInterpolationPart(v2, bindings[2]);
        if (bindLen > 3)
            value += _addInterpolationPart(v3, bindings[3]);
        if (bindLen > 4)
            value += _addInterpolationPart(v4, bindings[4]);
        if (bindLen > 5)
            value += _addInterpolationPart(v5, bindings[5]);
        if (bindLen > 6)
            value += _addInterpolationPart(v6, bindings[6]);
        if (bindLen > 7)
            value += _addInterpolationPart(v7, bindings[7]);
        if (bindLen > 8)
            value += _addInterpolationPart(v8, bindings[8]);
        if (bindLen > 9)
            value += _addInterpolationPart(v9, bindings[9]);
        /** @type {?} */
        const renderNode = asTextData(view, def.nodeIndex).renderText;
        view.renderer.setValue(renderNode, value);
    }
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateTextDynamic(view, def, values) {
    /** @type {?} */
    const bindings = def.bindings;
    /** @type {?} */
    let changed = false;
    for (let i = 0; i < values.length; i++) {
        // Note: We need to loop over all values, so that
        // the old values are updates as well!
        if (checkAndUpdateBinding(view, def, i, values[i])) {
            changed = true;
        }
    }
    if (changed) {
        /** @type {?} */
        let value = '';
        for (let i = 0; i < values.length; i++) {
            value = value + _addInterpolationPart(values[i], bindings[i]);
        }
        value = (/** @type {?} */ (def.text)).prefix + value;
        /** @type {?} */
        const renderNode = asTextData(view, def.nodeIndex).renderText;
        view.renderer.setValue(renderNode, value);
    }
    return changed;
}
/**
 * @param {?} value
 * @param {?} binding
 * @return {?}
 */
function _addInterpolationPart(value, binding) {
    /** @type {?} */
    const valueStr = value != null ? value.toString() : '';
    return valueStr + binding.suffix;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGV4dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdGV4dC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVFBLE9BQU8sRUFBbUUsVUFBVSxFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ3JHLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFFBQVEsQ0FBQzs7Ozs7OztBQUVyRSxNQUFNLFVBQVUsT0FBTyxDQUNuQixVQUFrQixFQUFFLGNBQTZCLEVBQUUsVUFBb0I7O1VBQ25FLFFBQVEsR0FBaUIsRUFBRTtJQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxRQUFRLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHO1lBQ2hCLEtBQUssc0JBQTJCO1lBQ2hDLElBQUksRUFBRSxJQUFJO1lBQ1YsRUFBRSxFQUFFLElBQUk7WUFDUixlQUFlLEVBQUUsSUFBSTtZQUNyQixlQUFlLEVBQUUsSUFBSTtZQUNyQixNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUN0QixDQUFDO0tBQ0g7SUFFRCxPQUFPOztRQUVMLFNBQVMsRUFBRSxDQUFDLENBQUM7UUFDYixNQUFNLEVBQUUsSUFBSTtRQUNaLFlBQVksRUFBRSxJQUFJO1FBQ2xCLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDaEIsV0FBVyxFQUFFLENBQUMsQ0FBQztRQUNmLGlCQUFpQjtRQUNqQixVQUFVO1FBQ1YsS0FBSyxrQkFBb0I7UUFDekIsVUFBVSxFQUFFLENBQUM7UUFDYixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLG1CQUFtQixFQUFFLENBQUM7UUFDdEIsY0FBYyxFQUFFLEVBQUU7UUFDbEIsZUFBZSxFQUFFLENBQUM7UUFDbEIsVUFBVSxFQUFFLEVBQUUsRUFBRSxjQUFjO1FBQzlCLFVBQVUsRUFBRSxDQUFDLEVBQUUsUUFBUTtRQUN2QixZQUFZLHNCQUEyQjtRQUN2QyxPQUFPLEVBQUUsRUFBRTtRQUNYLE9BQU8sRUFBRSxJQUFJO1FBQ2IsUUFBUSxFQUFFLElBQUk7UUFDZCxJQUFJLEVBQUUsRUFBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxFQUFDO1FBQzdCLEtBQUssRUFBRSxJQUFJO1FBQ1gsU0FBUyxFQUFFLElBQUk7S0FDaEIsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsVUFBVSxDQUFDLElBQWMsRUFBRSxVQUFlLEVBQUUsR0FBWTs7UUFDbEUsVUFBZTs7VUFDYixRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVE7SUFDOUIsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsbUJBQUEsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztVQUM5QyxRQUFRLEdBQUcsc0JBQXNCLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxHQUFHLENBQUM7SUFDOUQsSUFBSSxRQUFRLEVBQUU7UUFDWixRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUM1QztJQUNELE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFDLENBQUM7QUFDbEMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7OztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsSUFBYyxFQUFFLEdBQVksRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQzNGLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTzs7UUFDdkIsT0FBTyxHQUFHLEtBQUs7O1VBQ2IsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFROztVQUN2QixPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU07SUFDL0IsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFDM0UsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLHFCQUFxQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQztRQUFFLE9BQU8sR0FBRyxJQUFJLENBQUM7SUFFM0UsSUFBSSxPQUFPLEVBQUU7O1lBQ1AsS0FBSyxHQUFHLG1CQUFBLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxNQUFNO1FBQzdCLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2pFLElBQUksT0FBTyxHQUFHLENBQUM7WUFBRSxLQUFLLElBQUkscUJBQXFCLENBQUMsRUFBRSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztjQUMzRCxVQUFVLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVTtRQUM3RCxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0M7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLElBQWMsRUFBRSxHQUFZLEVBQUUsTUFBYTs7VUFDN0UsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFROztRQUN6QixPQUFPLEdBQUcsS0FBSztJQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxpREFBaUQ7UUFDakQsc0NBQXNDO1FBQ3RDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7WUFDbEQsT0FBTyxHQUFHLElBQUksQ0FBQztTQUNoQjtLQUNGO0lBQ0QsSUFBSSxPQUFPLEVBQUU7O1lBQ1AsS0FBSyxHQUFHLEVBQUU7UUFDZCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QyxLQUFLLEdBQUcsS0FBSyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUMvRDtRQUNELEtBQUssR0FBRyxtQkFBQSxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQzs7Y0FDNUIsVUFBVSxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVU7UUFDN0QsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzNDO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxxQkFBcUIsQ0FBQyxLQUFVLEVBQUUsT0FBbUI7O1VBQ3RELFFBQVEsR0FBRyxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDdEQsT0FBTyxRQUFRLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNuQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JpbmRpbmdEZWYsIEJpbmRpbmdGbGFncywgTm9kZURlZiwgTm9kZUZsYWdzLCBUZXh0RGF0YSwgVmlld0RhdGEsIGFzVGV4dERhdGF9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZUJpbmRpbmcsIGdldFBhcmVudFJlbmRlckVsZW1lbnR9IGZyb20gJy4vdXRpbCc7XG5cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0RGVmKFxuICAgIGNoZWNrSW5kZXg6IG51bWJlciwgbmdDb250ZW50SW5kZXg6IG51bWJlciB8IG51bGwsIHN0YXRpY1RleHQ6IHN0cmluZ1tdKTogTm9kZURlZiB7XG4gIGNvbnN0IGJpbmRpbmdzOiBCaW5kaW5nRGVmW10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCBzdGF0aWNUZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgYmluZGluZ3NbaSAtIDFdID0ge1xuICAgICAgZmxhZ3M6IEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHksXG4gICAgICBuYW1lOiBudWxsLFxuICAgICAgbnM6IG51bGwsXG4gICAgICBub25NaW5pZmllZE5hbWU6IG51bGwsXG4gICAgICBzZWN1cml0eUNvbnRleHQ6IG51bGwsXG4gICAgICBzdWZmaXg6IHN0YXRpY1RleHRbaV0sXG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgLy8gd2lsbCBiZXQgc2V0IGJ5IHRoZSB2aWV3IGRlZmluaXRpb25cbiAgICBub2RlSW5kZXg6IC0xLFxuICAgIHBhcmVudDogbnVsbCxcbiAgICByZW5kZXJQYXJlbnQ6IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICBvdXRwdXRJbmRleDogLTEsXG4gICAgLy8gcmVndWxhciB2YWx1ZXNcbiAgICBjaGVja0luZGV4LFxuICAgIGZsYWdzOiBOb2RlRmxhZ3MuVHlwZVRleHQsXG4gICAgY2hpbGRGbGFnczogMCxcbiAgICBkaXJlY3RDaGlsZEZsYWdzOiAwLFxuICAgIGNoaWxkTWF0Y2hlZFF1ZXJpZXM6IDAsXG4gICAgbWF0Y2hlZFF1ZXJpZXM6IHt9LFxuICAgIG1hdGNoZWRRdWVyeUlkczogMCxcbiAgICByZWZlcmVuY2VzOiB7fSwgbmdDb250ZW50SW5kZXgsXG4gICAgY2hpbGRDb3VudDogMCwgYmluZGluZ3MsXG4gICAgYmluZGluZ0ZsYWdzOiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5LFxuICAgIG91dHB1dHM6IFtdLFxuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgcHJvdmlkZXI6IG51bGwsXG4gICAgdGV4dDoge3ByZWZpeDogc3RhdGljVGV4dFswXX0sXG4gICAgcXVlcnk6IG51bGwsXG4gICAgbmdDb250ZW50OiBudWxsLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dCh2aWV3OiBWaWV3RGF0YSwgcmVuZGVySG9zdDogYW55LCBkZWY6IE5vZGVEZWYpOiBUZXh0RGF0YSB7XG4gIGxldCByZW5kZXJOb2RlOiBhbnk7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlldy5yZW5kZXJlcjtcbiAgcmVuZGVyTm9kZSA9IHJlbmRlcmVyLmNyZWF0ZVRleHQoZGVmLnRleHQgIS5wcmVmaXgpO1xuICBjb25zdCBwYXJlbnRFbCA9IGdldFBhcmVudFJlbmRlckVsZW1lbnQodmlldywgcmVuZGVySG9zdCwgZGVmKTtcbiAgaWYgKHBhcmVudEVsKSB7XG4gICAgcmVuZGVyZXIuYXBwZW5kQ2hpbGQocGFyZW50RWwsIHJlbmRlck5vZGUpO1xuICB9XG4gIHJldHVybiB7cmVuZGVyVGV4dDogcmVuZGVyTm9kZX07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZVRleHRJbmxpbmUoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSxcbiAgICB2NzogYW55LCB2ODogYW55LCB2OTogYW55KTogYm9vbGVhbiB7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGNvbnN0IGJpbmRpbmdzID0gZGVmLmJpbmRpbmdzO1xuICBjb25zdCBiaW5kTGVuID0gYmluZGluZ3MubGVuZ3RoO1xuICBpZiAoYmluZExlbiA+IDAgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgMCwgdjApKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiAxICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDEsIHYxKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMiAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAyLCB2MikpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDMgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgMywgdjMpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA0ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDQsIHY0KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNSAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA1LCB2NSkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDYgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNiwgdjYpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA3ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDcsIHY3KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gOCAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA4LCB2OCkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDkgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgOSwgdjkpKSBjaGFuZ2VkID0gdHJ1ZTtcblxuICBpZiAoY2hhbmdlZCkge1xuICAgIGxldCB2YWx1ZSA9IGRlZi50ZXh0ICEucHJlZml4O1xuICAgIGlmIChiaW5kTGVuID4gMCkgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHYwLCBiaW5kaW5nc1swXSk7XG4gICAgaWYgKGJpbmRMZW4gPiAxKSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjEsIGJpbmRpbmdzWzFdKTtcbiAgICBpZiAoYmluZExlbiA+IDIpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2MiwgYmluZGluZ3NbMl0pO1xuICAgIGlmIChiaW5kTGVuID4gMykgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHYzLCBiaW5kaW5nc1szXSk7XG4gICAgaWYgKGJpbmRMZW4gPiA0KSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjQsIGJpbmRpbmdzWzRdKTtcbiAgICBpZiAoYmluZExlbiA+IDUpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2NSwgYmluZGluZ3NbNV0pO1xuICAgIGlmIChiaW5kTGVuID4gNikgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHY2LCBiaW5kaW5nc1s2XSk7XG4gICAgaWYgKGJpbmRMZW4gPiA3KSB2YWx1ZSArPSBfYWRkSW50ZXJwb2xhdGlvblBhcnQodjcsIGJpbmRpbmdzWzddKTtcbiAgICBpZiAoYmluZExlbiA+IDgpIHZhbHVlICs9IF9hZGRJbnRlcnBvbGF0aW9uUGFydCh2OCwgYmluZGluZ3NbOF0pO1xuICAgIGlmIChiaW5kTGVuID4gOSkgdmFsdWUgKz0gX2FkZEludGVycG9sYXRpb25QYXJ0KHY5LCBiaW5kaW5nc1s5XSk7XG4gICAgY29uc3QgcmVuZGVyTm9kZSA9IGFzVGV4dERhdGEodmlldywgZGVmLm5vZGVJbmRleCkucmVuZGVyVGV4dDtcbiAgICB2aWV3LnJlbmRlcmVyLnNldFZhbHVlKHJlbmRlck5vZGUsIHZhbHVlKTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlVGV4dER5bmFtaWModmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdmFsdWVzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICBjb25zdCBiaW5kaW5ncyA9IGRlZi5iaW5kaW5ncztcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAvLyBOb3RlOiBXZSBuZWVkIHRvIGxvb3Agb3ZlciBhbGwgdmFsdWVzLCBzbyB0aGF0XG4gICAgLy8gdGhlIG9sZCB2YWx1ZXMgYXJlIHVwZGF0ZXMgYXMgd2VsbCFcbiAgICBpZiAoY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgaSwgdmFsdWVzW2ldKSkge1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgbGV0IHZhbHVlID0gJyc7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhbHVlID0gdmFsdWUgKyBfYWRkSW50ZXJwb2xhdGlvblBhcnQodmFsdWVzW2ldLCBiaW5kaW5nc1tpXSk7XG4gICAgfVxuICAgIHZhbHVlID0gZGVmLnRleHQgIS5wcmVmaXggKyB2YWx1ZTtcbiAgICBjb25zdCByZW5kZXJOb2RlID0gYXNUZXh0RGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KS5yZW5kZXJUZXh0O1xuICAgIHZpZXcucmVuZGVyZXIuc2V0VmFsdWUocmVuZGVyTm9kZSwgdmFsdWUpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5mdW5jdGlvbiBfYWRkSW50ZXJwb2xhdGlvblBhcnQodmFsdWU6IGFueSwgYmluZGluZzogQmluZGluZ0RlZik6IHN0cmluZyB7XG4gIGNvbnN0IHZhbHVlU3RyID0gdmFsdWUgIT0gbnVsbCA/IHZhbHVlLnRvU3RyaW5nKCkgOiAnJztcbiAgcmV0dXJuIHZhbHVlU3RyICsgYmluZGluZy5zdWZmaXg7XG59XG4iXX0=