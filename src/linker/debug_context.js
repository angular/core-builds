/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isBlank, isPresent } from '../facade/lang';
import { ViewType } from './view_type';
export class StaticNodeDebugInfo {
    /**
     * @param {?} providerTokens
     * @param {?} componentToken
     * @param {?} refTokens
     */
    constructor(providerTokens, componentToken, refTokens) {
        this.providerTokens = providerTokens;
        this.componentToken = componentToken;
        this.refTokens = refTokens;
    }
}
function StaticNodeDebugInfo_tsickle_Closure_declarations() {
    /** @type {?} */
    StaticNodeDebugInfo.prototype.providerTokens;
    /** @type {?} */
    StaticNodeDebugInfo.prototype.componentToken;
    /** @type {?} */
    StaticNodeDebugInfo.prototype.refTokens;
}
export class DebugContext {
    /**
     * @param {?} _view
     * @param {?} _nodeIndex
     * @param {?} _tplRow
     * @param {?} _tplCol
     */
    constructor(_view, _nodeIndex, _tplRow, _tplCol) {
        this._view = _view;
        this._nodeIndex = _nodeIndex;
        this._tplRow = _tplRow;
        this._tplCol = _tplCol;
    }
    /**
     * @return {?}
     */
    get _staticNodeInfo() {
        return isPresent(this._nodeIndex) ? this._view.staticNodeDebugInfos[this._nodeIndex] : null;
    }
    /**
     * @return {?}
     */
    get context() { return this._view.context; }
    /**
     * @return {?}
     */
    get component() {
        const /** @type {?} */ staticNodeInfo = this._staticNodeInfo;
        if (isPresent(staticNodeInfo) && isPresent(staticNodeInfo.componentToken)) {
            return this.injector.get(staticNodeInfo.componentToken);
        }
        return null;
    }
    /**
     * @return {?}
     */
    get componentRenderElement() {
        let /** @type {?} */ componentView = this._view;
        while (isPresent(componentView.parentView) && componentView.type !== ViewType.COMPONENT) {
            componentView = (componentView.parentView);
        }
        return componentView.parentElement;
    }
    /**
     * @return {?}
     */
    get injector() { return this._view.injector(this._nodeIndex); }
    /**
     * @return {?}
     */
    get renderNode() {
        if (isPresent(this._nodeIndex) && this._view.allNodes) {
            return this._view.allNodes[this._nodeIndex];
        }
        else {
            return null;
        }
    }
    /**
     * @return {?}
     */
    get providerTokens() {
        const /** @type {?} */ staticNodeInfo = this._staticNodeInfo;
        return isPresent(staticNodeInfo) ? staticNodeInfo.providerTokens : null;
    }
    /**
     * @return {?}
     */
    get source() {
        return `${this._view.componentType.templateUrl}:${this._tplRow}:${this._tplCol}`;
    }
    /**
     * @return {?}
     */
    get references() {
        const /** @type {?} */ varValues = {};
        const /** @type {?} */ staticNodeInfo = this._staticNodeInfo;
        if (isPresent(staticNodeInfo)) {
            const /** @type {?} */ refs = staticNodeInfo.refTokens;
            Object.keys(refs).forEach(refName => {
                const /** @type {?} */ refToken = refs[refName];
                let /** @type {?} */ varValue;
                if (isBlank(refToken)) {
                    varValue = this._view.allNodes ? this._view.allNodes[this._nodeIndex] : null;
                }
                else {
                    varValue = this._view.injectorGet(refToken, this._nodeIndex, null);
                }
                varValues[refName] = varValue;
            });
        }
        return varValues;
    }
}
function DebugContext_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugContext.prototype._view;
    /** @type {?} */
    DebugContext.prototype._nodeIndex;
    /** @type {?} */
    DebugContext.prototype._tplRow;
    /** @type {?} */
    DebugContext.prototype._tplCol;
}
//# sourceMappingURL=debug_context.js.map