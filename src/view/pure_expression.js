/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BindingType, DepFlags, NodeType, PureExpressionType, Services, asPureExpressionData } from './types';
import { checkAndUpdateBinding, tokenKey, unwrapValue } from './util';
/**
 * @param {?} pipeToken
 * @param {?} argCount
 * @return {?}
 */
export function purePipeDef(pipeToken, argCount) {
    return _pureExpressionDef(PureExpressionType.Pipe, new Array(argCount), { token: pipeToken, tokenKey: tokenKey(pipeToken), flags: DepFlags.None });
}
/**
 * @param {?} argCount
 * @return {?}
 */
export function pureArrayDef(argCount) {
    return _pureExpressionDef(PureExpressionType.Array, new Array(argCount), undefined);
}
/**
 * @param {?} propertyNames
 * @return {?}
 */
export function pureObjectDef(propertyNames) {
    return _pureExpressionDef(PureExpressionType.Object, propertyNames, undefined);
}
/**
 * @param {?} type
 * @param {?} propertyNames
 * @param {?} pipeDep
 * @return {?}
 */
function _pureExpressionDef(type, propertyNames, pipeDep) {
    var /** @type {?} */ bindings = new Array(propertyNames.length);
    for (var /** @type {?} */ i = 0; i < propertyNames.length; i++) {
        var /** @type {?} */ prop = propertyNames[i];
        bindings[i] = {
            type: BindingType.PureExpressionProperty,
            name: prop,
            nonMinifiedName: prop,
            securityContext: undefined,
            suffix: undefined
        };
    }
    return {
        type: NodeType.PureExpression,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        childFlags: undefined,
        childMatchedQueries: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: 0,
        matchedQueries: {},
        ngContentIndex: undefined,
        childCount: 0, bindings: bindings,
        disposableCount: 0,
        element: undefined,
        provider: undefined,
        text: undefined,
        pureExpression: { type: type, pipeDep: pipeDep },
        query: undefined,
        ngContent: undefined
    };
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createPureExpression(view, def) {
    var /** @type {?} */ pipe = def.pureExpression.pipeDep ?
        Services.resolveDep(view, def.index, def.parent, def.pureExpression.pipeDep) :
        undefined;
    return { value: undefined, pipe: pipe };
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
    var /** @type {?} */ bindings = def.bindings;
    var /** @type {?} */ changed = false;
    // Note: fallthrough is intended!
    switch (bindings.length) {
        case 10:
            if (checkAndUpdateBinding(view, def, 9, v9))
                changed = true;
        case 9:
            if (checkAndUpdateBinding(view, def, 8, v8))
                changed = true;
        case 8:
            if (checkAndUpdateBinding(view, def, 7, v7))
                changed = true;
        case 7:
            if (checkAndUpdateBinding(view, def, 6, v6))
                changed = true;
        case 6:
            if (checkAndUpdateBinding(view, def, 5, v5))
                changed = true;
        case 5:
            if (checkAndUpdateBinding(view, def, 4, v4))
                changed = true;
        case 4:
            if (checkAndUpdateBinding(view, def, 3, v3))
                changed = true;
        case 3:
            if (checkAndUpdateBinding(view, def, 2, v2))
                changed = true;
        case 2:
            if (checkAndUpdateBinding(view, def, 1, v1))
                changed = true;
        case 1:
            if (checkAndUpdateBinding(view, def, 0, v0))
                changed = true;
    }
    var /** @type {?} */ data = asPureExpressionData(view, def.index);
    if (changed) {
        v0 = unwrapValue(v0);
        v1 = unwrapValue(v1);
        v2 = unwrapValue(v2);
        v3 = unwrapValue(v3);
        v4 = unwrapValue(v4);
        v5 = unwrapValue(v5);
        v6 = unwrapValue(v6);
        v7 = unwrapValue(v7);
        v8 = unwrapValue(v8);
        v9 = unwrapValue(v9);
        var /** @type {?} */ value = void 0;
        switch (def.pureExpression.type) {
            case PureExpressionType.Array:
                value = new Array(bindings.length);
                // Note: fallthrough is intended!
                switch (bindings.length) {
                    case 10:
                        value[9] = v9;
                    case 9:
                        value[8] = v8;
                    case 8:
                        value[7] = v7;
                    case 7:
                        value[6] = v6;
                    case 6:
                        value[5] = v5;
                    case 5:
                        value[4] = v4;
                    case 4:
                        value[3] = v3;
                    case 3:
                        value[2] = v2;
                    case 2:
                        value[1] = v1;
                    case 1:
                        value[0] = v0;
                }
                break;
            case PureExpressionType.Object:
                value = {};
                // Note: fallthrough is intended!
                switch (bindings.length) {
                    case 10:
                        value[bindings[9].name] = v9;
                    case 9:
                        value[bindings[8].name] = v8;
                    case 8:
                        value[bindings[7].name] = v7;
                    case 7:
                        value[bindings[6].name] = v6;
                    case 6:
                        value[bindings[5].name] = v5;
                    case 5:
                        value[bindings[4].name] = v4;
                    case 4:
                        value[bindings[3].name] = v3;
                    case 3:
                        value[bindings[2].name] = v2;
                    case 2:
                        value[bindings[1].name] = v1;
                    case 1:
                        value[bindings[0].name] = v0;
                }
                break;
            case PureExpressionType.Pipe:
                switch (bindings.length) {
                    case 10:
                        value = data.pipe.transform(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
                        break;
                    case 9:
                        value = data.pipe.transform(v0, v1, v2, v3, v4, v5, v6, v7, v8);
                        break;
                    case 8:
                        value = data.pipe.transform(v0, v1, v2, v3, v4, v5, v6, v7);
                        break;
                    case 7:
                        value = data.pipe.transform(v0, v1, v2, v3, v4, v5, v6);
                        break;
                    case 6:
                        value = data.pipe.transform(v0, v1, v2, v3, v4, v5);
                        break;
                    case 5:
                        value = data.pipe.transform(v0, v1, v2, v3, v4);
                        break;
                    case 4:
                        value = data.pipe.transform(v0, v1, v2, v3);
                        break;
                    case 3:
                        value = data.pipe.transform(v0, v1, v2);
                        break;
                    case 2:
                        value = data.pipe.transform(v0, v1);
                        break;
                    case 1:
                        value = data.pipe.transform(v0);
                        break;
                }
                break;
        }
        data.value = value;
    }
    return data.value;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdatePureExpressionDynamic(view, def, values) {
    var /** @type {?} */ bindings = def.bindings;
    var /** @type {?} */ changed = false;
    for (var /** @type {?} */ i = 0; i < values.length; i++) {
        // Note: We need to loop over all values, so that
        // the old values are updates as well!
        if (checkAndUpdateBinding(view, def, i, values[i])) {
            changed = true;
        }
    }
    var /** @type {?} */ data = asPureExpressionData(view, def.index);
    if (changed) {
        var /** @type {?} */ value = void 0;
        switch (def.pureExpression.type) {
            case PureExpressionType.Array:
                value = new Array(values.length);
                for (var /** @type {?} */ i = 0; i < values.length; i++) {
                    value[i] = unwrapValue(values[i]);
                }
                break;
            case PureExpressionType.Object:
                value = {};
                for (var /** @type {?} */ i = 0; i < values.length; i++) {
                    value[bindings[i].name] = unwrapValue(values[i]);
                }
                break;
            case PureExpressionType.Pipe:
                var /** @type {?} */ params = new Array(values.length);
                for (var /** @type {?} */ i = 0; i < values.length; i++) {
                    params[i] = unwrapValue(values[i]);
                }
                value = (_a = data.pipe).transform.apply(_a, params);
                break;
        }
        data.value = value;
    }
    return data.value;
    var _a;
}
//# sourceMappingURL=pure_expression.js.map