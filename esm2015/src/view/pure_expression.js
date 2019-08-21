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
import { newArray } from '../util/array_utils';
import { asPureExpressionData } from './types';
import { calcBindingFlags, checkAndUpdateBinding } from './util';
/**
 * @param {?} checkIndex
 * @param {?} argCount
 * @return {?}
 */
export function purePipeDef(checkIndex, argCount) {
    // argCount + 1 to include the pipe as first arg
    return _pureExpressionDef(128 /* TypePurePipe */, checkIndex, newArray(argCount + 1));
}
/**
 * @param {?} checkIndex
 * @param {?} argCount
 * @return {?}
 */
export function pureArrayDef(checkIndex, argCount) {
    return _pureExpressionDef(32 /* TypePureArray */, checkIndex, newArray(argCount));
}
/**
 * @param {?} checkIndex
 * @param {?} propToIndex
 * @return {?}
 */
export function pureObjectDef(checkIndex, propToIndex) {
    /** @type {?} */
    const keys = Object.keys(propToIndex);
    /** @type {?} */
    const nbKeys = keys.length;
    /** @type {?} */
    const propertyNames = [];
    for (let i = 0; i < nbKeys; i++) {
        /** @type {?} */
        const key = keys[i];
        /** @type {?} */
        const index = propToIndex[key];
        propertyNames.push(key);
    }
    return _pureExpressionDef(64 /* TypePureObject */, checkIndex, propertyNames);
}
/**
 * @param {?} flags
 * @param {?} checkIndex
 * @param {?} propertyNames
 * @return {?}
 */
function _pureExpressionDef(flags, checkIndex, propertyNames) {
    /** @type {?} */
    const bindings = [];
    for (let i = 0; i < propertyNames.length; i++) {
        /** @type {?} */
        const prop = propertyNames[i];
        bindings.push({
            flags: 8 /* TypeProperty */,
            name: prop,
            ns: null,
            nonMinifiedName: prop,
            securityContext: null,
            suffix: null
        });
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
        flags,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0,
        matchedQueries: {},
        matchedQueryIds: 0,
        references: {},
        ngContentIndex: -1,
        childCount: 0, bindings,
        bindingFlags: calcBindingFlags(bindings),
        outputs: [],
        element: null,
        provider: null,
        text: null,
        query: null,
        ngContent: null
    };
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createPureExpression(view, def) {
    return { value: undefined };
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
export function checkAndUpdatePureExpressionInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    const bindings = def.bindings;
    /** @type {?} */
    let changed = false;
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
        const data = asPureExpressionData(view, def.nodeIndex);
        /** @type {?} */
        let value;
        switch (def.flags & 201347067 /* Types */) {
            case 32 /* TypePureArray */:
                value = [];
                if (bindLen > 0)
                    value.push(v0);
                if (bindLen > 1)
                    value.push(v1);
                if (bindLen > 2)
                    value.push(v2);
                if (bindLen > 3)
                    value.push(v3);
                if (bindLen > 4)
                    value.push(v4);
                if (bindLen > 5)
                    value.push(v5);
                if (bindLen > 6)
                    value.push(v6);
                if (bindLen > 7)
                    value.push(v7);
                if (bindLen > 8)
                    value.push(v8);
                if (bindLen > 9)
                    value.push(v9);
                break;
            case 64 /* TypePureObject */:
                value = {};
                if (bindLen > 0)
                    value[(/** @type {?} */ (bindings[0].name))] = v0;
                if (bindLen > 1)
                    value[(/** @type {?} */ (bindings[1].name))] = v1;
                if (bindLen > 2)
                    value[(/** @type {?} */ (bindings[2].name))] = v2;
                if (bindLen > 3)
                    value[(/** @type {?} */ (bindings[3].name))] = v3;
                if (bindLen > 4)
                    value[(/** @type {?} */ (bindings[4].name))] = v4;
                if (bindLen > 5)
                    value[(/** @type {?} */ (bindings[5].name))] = v5;
                if (bindLen > 6)
                    value[(/** @type {?} */ (bindings[6].name))] = v6;
                if (bindLen > 7)
                    value[(/** @type {?} */ (bindings[7].name))] = v7;
                if (bindLen > 8)
                    value[(/** @type {?} */ (bindings[8].name))] = v8;
                if (bindLen > 9)
                    value[(/** @type {?} */ (bindings[9].name))] = v9;
                break;
            case 128 /* TypePurePipe */:
                /** @type {?} */
                const pipe = v0;
                switch (bindLen) {
                    case 1:
                        value = pipe.transform(v0);
                        break;
                    case 2:
                        value = pipe.transform(v1);
                        break;
                    case 3:
                        value = pipe.transform(v1, v2);
                        break;
                    case 4:
                        value = pipe.transform(v1, v2, v3);
                        break;
                    case 5:
                        value = pipe.transform(v1, v2, v3, v4);
                        break;
                    case 6:
                        value = pipe.transform(v1, v2, v3, v4, v5);
                        break;
                    case 7:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6);
                        break;
                    case 8:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7);
                        break;
                    case 9:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8);
                        break;
                    case 10:
                        value = pipe.transform(v1, v2, v3, v4, v5, v6, v7, v8, v9);
                        break;
                }
                break;
        }
        data.value = value;
    }
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdatePureExpressionDynamic(view, def, values) {
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
        const data = asPureExpressionData(view, def.nodeIndex);
        /** @type {?} */
        let value;
        switch (def.flags & 201347067 /* Types */) {
            case 32 /* TypePureArray */:
                value = values;
                break;
            case 64 /* TypePureObject */:
                value = {};
                for (let i = 0; i < values.length; i++) {
                    value[(/** @type {?} */ (bindings[i].name))] = values[i];
                }
                break;
            case 128 /* TypePurePipe */:
                /** @type {?} */
                const pipe = values[0];
                /** @type {?} */
                const params = values.slice(1);
                value = ((/** @type {?} */ (pipe.transform)))(...params);
                break;
        }
        data.value = value;
    }
    return changed;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVyZV9leHByZXNzaW9uLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvdmlldy9wdXJlX2V4cHJlc3Npb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLEVBQUMsUUFBUSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFN0MsT0FBTyxFQUE2RSxvQkFBb0IsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN6SCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxRQUFRLENBQUM7Ozs7OztBQUUvRCxNQUFNLFVBQVUsV0FBVyxDQUFDLFVBQWtCLEVBQUUsUUFBZ0I7SUFDOUQsZ0RBQWdEO0lBQ2hELE9BQU8sa0JBQWtCLHlCQUF5QixVQUFVLEVBQUUsUUFBUSxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3hGLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxZQUFZLENBQUMsVUFBa0IsRUFBRSxRQUFnQjtJQUMvRCxPQUFPLGtCQUFrQix5QkFBMEIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO0FBQ3JGLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxhQUFhLENBQUMsVUFBa0IsRUFBRSxXQUFrQzs7VUFDNUUsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDOztVQUMvQixNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU07O1VBQ3BCLGFBQWEsR0FBRyxFQUFFO0lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O2NBQ3pCLEdBQUcsR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDOztjQUNiLEtBQUssR0FBRyxXQUFXLENBQUMsR0FBRyxDQUFDO1FBQzlCLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDekI7SUFFRCxPQUFPLGtCQUFrQiwwQkFBMkIsVUFBVSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQ2pGLENBQUM7Ozs7Ozs7QUFFRCxTQUFTLGtCQUFrQixDQUN2QixLQUFnQixFQUFFLFVBQWtCLEVBQUUsYUFBdUI7O1VBQ3pELFFBQVEsR0FBaUIsRUFBRTtJQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7Y0FDdkMsSUFBSSxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDN0IsUUFBUSxDQUFDLElBQUksQ0FBQztZQUNaLEtBQUssc0JBQTJCO1lBQ2hDLElBQUksRUFBRSxJQUFJO1lBQ1YsRUFBRSxFQUFFLElBQUk7WUFDUixlQUFlLEVBQUUsSUFBSTtZQUNyQixlQUFlLEVBQUUsSUFBSTtZQUNyQixNQUFNLEVBQUUsSUFBSTtTQUNiLENBQUMsQ0FBQztLQUNKO0lBQ0QsT0FBTzs7UUFFTCxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2IsTUFBTSxFQUFFLElBQUk7UUFDWixZQUFZLEVBQUUsSUFBSTtRQUNsQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hCLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDZixpQkFBaUI7UUFDakIsVUFBVTtRQUNWLEtBQUs7UUFDTCxVQUFVLEVBQUUsQ0FBQztRQUNiLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixjQUFjLEVBQUUsRUFBRTtRQUNsQixlQUFlLEVBQUUsQ0FBQztRQUNsQixVQUFVLEVBQUUsRUFBRTtRQUNkLGNBQWMsRUFBRSxDQUFDLENBQUM7UUFDbEIsVUFBVSxFQUFFLENBQUMsRUFBRSxRQUFRO1FBQ3ZCLFlBQVksRUFBRSxnQkFBZ0IsQ0FBQyxRQUFRLENBQUM7UUFDeEMsT0FBTyxFQUFFLEVBQUU7UUFDWCxPQUFPLEVBQUUsSUFBSTtRQUNiLFFBQVEsRUFBRSxJQUFJO1FBQ2QsSUFBSSxFQUFFLElBQUk7UUFDVixLQUFLLEVBQUUsSUFBSTtRQUNYLFNBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUM7QUFDSixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsSUFBYyxFQUFFLEdBQVk7SUFDL0QsT0FBTyxFQUFDLEtBQUssRUFBRSxTQUFTLEVBQUMsQ0FBQztBQUM1QixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLGtDQUFrQyxDQUM5QyxJQUFjLEVBQUUsR0FBWSxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFDM0YsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPOztVQUNyQixRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVE7O1FBQ3pCLE9BQU8sR0FBRyxLQUFLOztVQUNiLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTTtJQUMvQixJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUMzRSxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUkscUJBQXFCLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQUUsT0FBTyxHQUFHLElBQUksQ0FBQztJQUUzRSxJQUFJLE9BQU8sRUFBRTs7Y0FDTCxJQUFJLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUM7O1lBQ2xELEtBQVU7UUFDZCxRQUFRLEdBQUcsQ0FBQyxLQUFLLHdCQUFrQixFQUFFO1lBQ25DO2dCQUNFLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ1gsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7Z0JBQ2hDLElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDaEMsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUNoQyxNQUFNO1lBQ1I7Z0JBQ0UsS0FBSyxHQUFHLEVBQUUsQ0FBQztnQkFDWCxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2hELElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLG1CQUFBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsbUJBQUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2hELElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLG1CQUFBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsbUJBQUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2hELElBQUksT0FBTyxHQUFHLENBQUM7b0JBQUUsS0FBSyxDQUFDLG1CQUFBLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztnQkFDaEQsSUFBSSxPQUFPLEdBQUcsQ0FBQztvQkFBRSxLQUFLLENBQUMsbUJBQUEsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDO2dCQUNoRCxJQUFJLE9BQU8sR0FBRyxDQUFDO29CQUFFLEtBQUssQ0FBQyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7Z0JBQ2hELE1BQU07WUFDUjs7c0JBQ1EsSUFBSSxHQUFHLEVBQUU7Z0JBQ2YsUUFBUSxPQUFPLEVBQUU7b0JBQ2YsS0FBSyxDQUFDO3dCQUNKLEtBQUssR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUMzQixNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFDM0IsTUFBTTtvQkFDUixLQUFLLENBQUM7d0JBQ0osS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMvQixNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUNuQyxNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDdkMsTUFBTTtvQkFDUixLQUFLLENBQUM7d0JBQ0osS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMzQyxNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMvQyxNQUFNO29CQUNSLEtBQUssQ0FBQzt3QkFDSixLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFDbkQsTUFBTTtvQkFDUixLQUFLLENBQUM7d0JBQ0osS0FBSyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUN2RCxNQUFNO29CQUNSLEtBQUssRUFBRTt3QkFDTCxLQUFLLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDO3dCQUMzRCxNQUFNO2lCQUNUO2dCQUNELE1BQU07U0FDVDtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxtQ0FBbUMsQ0FDL0MsSUFBYyxFQUFFLEdBQVksRUFBRSxNQUFhOztVQUN2QyxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVE7O1FBQ3pCLE9BQU8sR0FBRyxLQUFLO0lBQ25CLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3RDLGlEQUFpRDtRQUNqRCxzQ0FBc0M7UUFDdEMsSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUNsRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1NBQ2hCO0tBQ0Y7SUFDRCxJQUFJLE9BQU8sRUFBRTs7Y0FDTCxJQUFJLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUM7O1lBQ2xELEtBQVU7UUFDZCxRQUFRLEdBQUcsQ0FBQyxLQUFLLHdCQUFrQixFQUFFO1lBQ25DO2dCQUNFLEtBQUssR0FBRyxNQUFNLENBQUM7Z0JBQ2YsTUFBTTtZQUNSO2dCQUNFLEtBQUssR0FBRyxFQUFFLENBQUM7Z0JBQ1gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ3RDLEtBQUssQ0FBQyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7aUJBQ3ZDO2dCQUNELE1BQU07WUFDUjs7c0JBQ1EsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7O3NCQUNoQixNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQzlCLEtBQUssR0FBRyxDQUFDLG1CQUFLLElBQUksQ0FBQyxTQUFTLEVBQUEsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7Z0JBQ3pDLE1BQU07U0FDVDtRQUNELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtuZXdBcnJheX0gZnJvbSAnLi4vdXRpbC9hcnJheV91dGlscyc7XG5cbmltcG9ydCB7QmluZGluZ0RlZiwgQmluZGluZ0ZsYWdzLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIFB1cmVFeHByZXNzaW9uRGF0YSwgVmlld0RhdGEsIGFzUHVyZUV4cHJlc3Npb25EYXRhfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y2FsY0JpbmRpbmdGbGFncywgY2hlY2tBbmRVcGRhdGVCaW5kaW5nfSBmcm9tICcuL3V0aWwnO1xuXG5leHBvcnQgZnVuY3Rpb24gcHVyZVBpcGVEZWYoY2hlY2tJbmRleDogbnVtYmVyLCBhcmdDb3VudDogbnVtYmVyKTogTm9kZURlZiB7XG4gIC8vIGFyZ0NvdW50ICsgMSB0byBpbmNsdWRlIHRoZSBwaXBlIGFzIGZpcnN0IGFyZ1xuICByZXR1cm4gX3B1cmVFeHByZXNzaW9uRGVmKE5vZGVGbGFncy5UeXBlUHVyZVBpcGUsIGNoZWNrSW5kZXgsIG5ld0FycmF5KGFyZ0NvdW50ICsgMSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVyZUFycmF5RGVmKGNoZWNrSW5kZXg6IG51bWJlciwgYXJnQ291bnQ6IG51bWJlcik6IE5vZGVEZWYge1xuICByZXR1cm4gX3B1cmVFeHByZXNzaW9uRGVmKE5vZGVGbGFncy5UeXBlUHVyZUFycmF5LCBjaGVja0luZGV4LCBuZXdBcnJheShhcmdDb3VudCkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHVyZU9iamVjdERlZihjaGVja0luZGV4OiBudW1iZXIsIHByb3BUb0luZGV4OiB7W3A6IHN0cmluZ106IG51bWJlcn0pOiBOb2RlRGVmIHtcbiAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHByb3BUb0luZGV4KTtcbiAgY29uc3QgbmJLZXlzID0ga2V5cy5sZW5ndGg7XG4gIGNvbnN0IHByb3BlcnR5TmFtZXMgPSBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBuYktleXM7IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgY29uc3QgaW5kZXggPSBwcm9wVG9JbmRleFtrZXldO1xuICAgIHByb3BlcnR5TmFtZXMucHVzaChrZXkpO1xuICB9XG5cbiAgcmV0dXJuIF9wdXJlRXhwcmVzc2lvbkRlZihOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3QsIGNoZWNrSW5kZXgsIHByb3BlcnR5TmFtZXMpO1xufVxuXG5mdW5jdGlvbiBfcHVyZUV4cHJlc3Npb25EZWYoXG4gICAgZmxhZ3M6IE5vZGVGbGFncywgY2hlY2tJbmRleDogbnVtYmVyLCBwcm9wZXJ0eU5hbWVzOiBzdHJpbmdbXSk6IE5vZGVEZWYge1xuICBjb25zdCBiaW5kaW5nczogQmluZGluZ0RlZltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcGVydHlOYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHByb3AgPSBwcm9wZXJ0eU5hbWVzW2ldO1xuICAgIGJpbmRpbmdzLnB1c2goe1xuICAgICAgZmxhZ3M6IEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHksXG4gICAgICBuYW1lOiBwcm9wLFxuICAgICAgbnM6IG51bGwsXG4gICAgICBub25NaW5pZmllZE5hbWU6IHByb3AsXG4gICAgICBzZWN1cml0eUNvbnRleHQ6IG51bGwsXG4gICAgICBzdWZmaXg6IG51bGxcbiAgICB9KTtcbiAgfVxuICByZXR1cm4ge1xuICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgdmlldyBkZWZpbml0aW9uXG4gICAgbm9kZUluZGV4OiAtMSxcbiAgICBwYXJlbnQ6IG51bGwsXG4gICAgcmVuZGVyUGFyZW50OiBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogLTEsXG4gICAgb3V0cHV0SW5kZXg6IC0xLFxuICAgIC8vIHJlZ3VsYXIgdmFsdWVzXG4gICAgY2hlY2tJbmRleCxcbiAgICBmbGFncyxcbiAgICBjaGlsZEZsYWdzOiAwLFxuICAgIGRpcmVjdENoaWxkRmxhZ3M6IDAsXG4gICAgY2hpbGRNYXRjaGVkUXVlcmllczogMCxcbiAgICBtYXRjaGVkUXVlcmllczoge30sXG4gICAgbWF0Y2hlZFF1ZXJ5SWRzOiAwLFxuICAgIHJlZmVyZW5jZXM6IHt9LFxuICAgIG5nQ29udGVudEluZGV4OiAtMSxcbiAgICBjaGlsZENvdW50OiAwLCBiaW5kaW5ncyxcbiAgICBiaW5kaW5nRmxhZ3M6IGNhbGNCaW5kaW5nRmxhZ3MoYmluZGluZ3MpLFxuICAgIG91dHB1dHM6IFtdLFxuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgcHJvdmlkZXI6IG51bGwsXG4gICAgdGV4dDogbnVsbCxcbiAgICBxdWVyeTogbnVsbCxcbiAgICBuZ0NvbnRlbnQ6IG51bGxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVB1cmVFeHByZXNzaW9uKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBQdXJlRXhwcmVzc2lvbkRhdGEge1xuICByZXR1cm4ge3ZhbHVlOiB1bmRlZmluZWR9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbklubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LFxuICAgIHY3OiBhbnksIHY4OiBhbnksIHY5OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgYmluZGluZ3MgPSBkZWYuYmluZGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGNvbnN0IGJpbmRMZW4gPSBiaW5kaW5ncy5sZW5ndGg7XG4gIGlmIChiaW5kTGVuID4gMCAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAwLCB2MCkpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDEgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgMSwgdjEpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiAyICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDIsIHYyKSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gMyAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCAzLCB2MykpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDQgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNCwgdjQpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA1ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDUsIHY1KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gNiAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA2LCB2NikpIGNoYW5nZWQgPSB0cnVlO1xuICBpZiAoYmluZExlbiA+IDcgJiYgY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZpZXcsIGRlZiwgNywgdjcpKSBjaGFuZ2VkID0gdHJ1ZTtcbiAgaWYgKGJpbmRMZW4gPiA4ICYmIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIDgsIHY4KSkgY2hhbmdlZCA9IHRydWU7XG4gIGlmIChiaW5kTGVuID4gOSAmJiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmlldywgZGVmLCA5LCB2OSkpIGNoYW5nZWQgPSB0cnVlO1xuXG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgY29uc3QgZGF0YSA9IGFzUHVyZUV4cHJlc3Npb25EYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICAgIGxldCB2YWx1ZTogYW55O1xuICAgIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZUFycmF5OlxuICAgICAgICB2YWx1ZSA9IFtdO1xuICAgICAgICBpZiAoYmluZExlbiA+IDApIHZhbHVlLnB1c2godjApO1xuICAgICAgICBpZiAoYmluZExlbiA+IDEpIHZhbHVlLnB1c2godjEpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDIpIHZhbHVlLnB1c2godjIpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDMpIHZhbHVlLnB1c2godjMpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDQpIHZhbHVlLnB1c2godjQpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDUpIHZhbHVlLnB1c2godjUpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDYpIHZhbHVlLnB1c2godjYpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDcpIHZhbHVlLnB1c2godjcpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDgpIHZhbHVlLnB1c2godjgpO1xuICAgICAgICBpZiAoYmluZExlbiA+IDkpIHZhbHVlLnB1c2godjkpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlT2JqZWN0OlxuICAgICAgICB2YWx1ZSA9IHt9O1xuICAgICAgICBpZiAoYmluZExlbiA+IDApIHZhbHVlW2JpbmRpbmdzWzBdLm5hbWUgIV0gPSB2MDtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiAxKSB2YWx1ZVtiaW5kaW5nc1sxXS5uYW1lICFdID0gdjE7XG4gICAgICAgIGlmIChiaW5kTGVuID4gMikgdmFsdWVbYmluZGluZ3NbMl0ubmFtZSAhXSA9IHYyO1xuICAgICAgICBpZiAoYmluZExlbiA+IDMpIHZhbHVlW2JpbmRpbmdzWzNdLm5hbWUgIV0gPSB2MztcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA0KSB2YWx1ZVtiaW5kaW5nc1s0XS5uYW1lICFdID0gdjQ7XG4gICAgICAgIGlmIChiaW5kTGVuID4gNSkgdmFsdWVbYmluZGluZ3NbNV0ubmFtZSAhXSA9IHY1O1xuICAgICAgICBpZiAoYmluZExlbiA+IDYpIHZhbHVlW2JpbmRpbmdzWzZdLm5hbWUgIV0gPSB2NjtcbiAgICAgICAgaWYgKGJpbmRMZW4gPiA3KSB2YWx1ZVtiaW5kaW5nc1s3XS5uYW1lICFdID0gdjc7XG4gICAgICAgIGlmIChiaW5kTGVuID4gOCkgdmFsdWVbYmluZGluZ3NbOF0ubmFtZSAhXSA9IHY4O1xuICAgICAgICBpZiAoYmluZExlbiA+IDkpIHZhbHVlW2JpbmRpbmdzWzldLm5hbWUgIV0gPSB2OTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZVBpcGU6XG4gICAgICAgIGNvbnN0IHBpcGUgPSB2MDtcbiAgICAgICAgc3dpdGNoIChiaW5kTGVuKSB7XG4gICAgICAgICAgY2FzZSAxOlxuICAgICAgICAgICAgdmFsdWUgPSBwaXBlLnRyYW5zZm9ybSh2MCk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICB2YWx1ZSA9IHBpcGUudHJhbnNmb3JtKHYxKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMzpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgNDpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2Myk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDU6XG4gICAgICAgICAgICB2YWx1ZSA9IHBpcGUudHJhbnNmb3JtKHYxLCB2MiwgdjMsIHY0KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgNjpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQsIHY1KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgNzpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQsIHY1LCB2Nik7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDg6XG4gICAgICAgICAgICB2YWx1ZSA9IHBpcGUudHJhbnNmb3JtKHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgOTpcbiAgICAgICAgICAgIHZhbHVlID0gcGlwZS50cmFuc2Zvcm0odjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4KTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMTA6XG4gICAgICAgICAgICB2YWx1ZSA9IHBpcGUudHJhbnNmb3JtKHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRhdGEudmFsdWUgPSB2YWx1ZTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlUHVyZUV4cHJlc3Npb25EeW5hbWljKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIHZhbHVlczogYW55W10pOiBib29sZWFuIHtcbiAgY29uc3QgYmluZGluZ3MgPSBkZWYuYmluZGluZ3M7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgLy8gTm90ZTogV2UgbmVlZCB0byBsb29wIG92ZXIgYWxsIHZhbHVlcywgc28gdGhhdFxuICAgIC8vIHRoZSBvbGQgdmFsdWVzIGFyZSB1cGRhdGVzIGFzIHdlbGwhXG4gICAgaWYgKGNoZWNrQW5kVXBkYXRlQmluZGluZyh2aWV3LCBkZWYsIGksIHZhbHVlc1tpXSkpIHtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIH1cbiAgfVxuICBpZiAoY2hhbmdlZCkge1xuICAgIGNvbnN0IGRhdGEgPSBhc1B1cmVFeHByZXNzaW9uRGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KTtcbiAgICBsZXQgdmFsdWU6IGFueTtcbiAgICBzd2l0Y2ggKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlcykge1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVBcnJheTpcbiAgICAgICAgdmFsdWUgPSB2YWx1ZXM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3Q6XG4gICAgICAgIHZhbHVlID0ge307XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgdmFsdWVbYmluZGluZ3NbaV0ubmFtZSAhXSA9IHZhbHVlc1tpXTtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlUGlwZTpcbiAgICAgICAgY29uc3QgcGlwZSA9IHZhbHVlc1swXTtcbiAgICAgICAgY29uc3QgcGFyYW1zID0gdmFsdWVzLnNsaWNlKDEpO1xuICAgICAgICB2YWx1ZSA9ICg8YW55PnBpcGUudHJhbnNmb3JtKSguLi5wYXJhbXMpO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgZGF0YS52YWx1ZSA9IHZhbHVlO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuIl19