/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { Injector } from '../di';
import { ElementRef } from '../linker/element_ref';
import { RootRenderer } from '../render/api';
import { Sanitizer } from '../security';
import { resolveDep, tokenKey } from './provider';
import { getQueryValue } from './query';
import { DepFlags, NodeType, ViewState, asElementData, asProviderData } from './types';
import { findElementDef, isComponentView, parentDiIndex, renderNode, resolveViewDefinition, rootRenderNodes } from './util';
import { checkAndUpdateView, checkNoChangesView, createEmbeddedView, createRootView, destroyView } from './view';
import { attachEmbeddedView, detachEmbeddedView, moveEmbeddedView } from './view_attach';
const /** @type {?} */ EMPTY_CONTEXT = new Object();
/**
 * @return {?}
 */
export function createRefs() {
    return new Refs_();
}
export class Refs_ {
    /**
     * @param {?} selector
     * @param {?} viewDefFactory
     * @return {?}
     */
    createComponentFactory(selector, viewDefFactory) {
        return new ComponentFactory_(selector, viewDefFactory);
    }
    /**
     * @param {?} data
     * @return {?}
     */
    createViewRef(data) { return new ViewRef_(data); }
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    createViewContainerRef(view, elIndex) {
        return new ViewContainerRef_(view, elIndex);
    }
    /**
     * @param {?} parentView
     * @param {?} def
     * @return {?}
     */
    createTemplateRef(parentView, def) {
        return new TemplateRef_(parentView, def);
    }
    /**
     * @param {?} view
     * @param {?} elIndex
     * @return {?}
     */
    createInjector(view, elIndex) { return new Injector_(view, elIndex); }
    /**
     * @param {?} view
     * @param {?} nodeIndex
     * @return {?}
     */
    createDebugContext(view, nodeIndex) {
        return new DebugContext_(view, nodeIndex);
    }
}
class ComponentFactory_ {
    /**
     * @param {?} selector
     * @param {?} viewDefFactory
     */
    constructor(selector, viewDefFactory) {
        this.selector = selector;
        const viewDef = this._viewDef = resolveViewDefinition(viewDefFactory);
        const len = viewDef.nodes.length;
        for (let i = 0; i < len; i++) {
            const nodeDef = viewDef.nodes[i];
            if (nodeDef.provider && nodeDef.provider.component) {
                this._componentNodeIndex = i;
                break;
            }
        }
        if (this._componentNodeIndex == null) {
            throw new Error(`Illegal State: Could not find a component in the view definition!`);
        }
    }
    /**
     * @return {?}
     */
    get componentType() {
        return this._viewDef.nodes[this._componentNodeIndex].provider.value;
    }
    /**
     * Creates a new component.
     * @param {?} injector
     * @param {?=} projectableNodes
     * @param {?=} rootSelectorOrNode
     * @return {?}
     */
    create(injector, projectableNodes = null, rootSelectorOrNode = null) {
        if (!projectableNodes) {
            projectableNodes = [];
        }
        if (!rootSelectorOrNode) {
            rootSelectorOrNode = this.selector;
        }
        const /** @type {?} */ renderer = injector.get(RootRenderer);
        const /** @type {?} */ sanitizer = injector.get(Sanitizer);
        const /** @type {?} */ root = { injector, projectableNodes, selectorOrNode: rootSelectorOrNode, sanitizer, renderer };
        const /** @type {?} */ view = createRootView(root, this._viewDef, EMPTY_CONTEXT);
        const /** @type {?} */ component = asProviderData(view, this._componentNodeIndex).instance;
        return new ComponentRef_(view, component);
    }
}
function ComponentFactory__tsickle_Closure_declarations() {
    /**
     * Only needed so that we can implement ComponentFactory
     * \@internal
     * @type {?}
     */
    ComponentFactory_.prototype._viewClass;
    /** @type {?} */
    ComponentFactory_.prototype._viewDef;
    /** @type {?} */
    ComponentFactory_.prototype._componentNodeIndex;
    /** @type {?} */
    ComponentFactory_.prototype.selector;
}
class ComponentRef_ {
    /**
     * @param {?} _view
     * @param {?} _component
     */
    constructor(_view, _component) {
        this._view = _view;
        this._component = _component;
        this._viewRef = new ViewRef_(_view);
    }
    /**
     * @return {?}
     */
    get location() { return new ElementRef(asElementData(this._view, 0).renderElement); }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this._view, 0); }
    /**
     * @return {?}
     */
    get instance() { return this._component; }
    ;
    /**
     * @return {?}
     */
    get hostView() { return this._viewRef; }
    ;
    /**
     * @return {?}
     */
    get changeDetectorRef() { return this._viewRef; }
    ;
    /**
     * @return {?}
     */
    get componentType() { return (this._component.constructor); }
    /**
     * @return {?}
     */
    destroy() { this._viewRef.destroy(); }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._viewRef.onDestroy(callback); }
}
function ComponentRef__tsickle_Closure_declarations() {
    /** @type {?} */
    ComponentRef_.prototype._viewRef;
    /** @type {?} */
    ComponentRef_.prototype._view;
    /** @type {?} */
    ComponentRef_.prototype._component;
}
class ViewContainerRef_ {
    /**
     * @param {?} _view
     * @param {?} _elIndex
     */
    constructor(_view, _elIndex) {
        this._view = _view;
        this._elIndex = _elIndex;
        this._data = asElementData(_view, _elIndex);
    }
    /**
     * @return {?}
     */
    get element() { return new ElementRef(this._data.renderElement); }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this._view, this._elIndex); }
    /**
     * @return {?}
     */
    get parentInjector() {
        let /** @type {?} */ view = this._view;
        let /** @type {?} */ elIndex = view.def.nodes[this._elIndex].parent;
        while (elIndex == null && view) {
            elIndex = parentDiIndex(view);
            view = view.parent;
        }
        return view ? new Injector_(view, elIndex) : this._view.root.injector;
    }
    /**
     * @return {?}
     */
    clear() {
        const /** @type {?} */ len = this._data.embeddedViews.length;
        for (let /** @type {?} */ i = len - 1; i >= 0; i--) {
            const /** @type {?} */ view = detachEmbeddedView(this._data, i);
            destroyView(view);
        }
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return new ViewRef_(this._data.embeddedViews[index]); }
    /**
     * @return {?}
     */
    get length() { return this._data.embeddedViews.length; }
    ;
    /**
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) {
        const /** @type {?} */ viewRef = templateRef.createEmbeddedView(context);
        this.insert(viewRef, index);
        return viewRef;
    }
    /**
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes) {
        const /** @type {?} */ contextInjector = injector || this.parentInjector;
        const /** @type {?} */ componentRef = componentFactory.create(contextInjector, projectableNodes);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index) {
        const /** @type {?} */ viewData = ((viewRef))._view;
        attachEmbeddedView(this._data, index, viewData);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    move(viewRef, currentIndex) {
        const /** @type {?} */ previousIndex = this._data.embeddedViews.indexOf(viewRef._view);
        moveEmbeddedView(this._data, previousIndex, currentIndex);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) {
        return this._data.embeddedViews.indexOf(((viewRef))._view);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    remove(index) {
        const /** @type {?} */ viewData = detachEmbeddedView(this._data, index);
        destroyView(viewData);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        const /** @type {?} */ view = this.get(index);
        detachEmbeddedView(this._data, index);
        return view;
    }
}
function ViewContainerRef__tsickle_Closure_declarations() {
    /** @type {?} */
    ViewContainerRef_.prototype._data;
    /** @type {?} */
    ViewContainerRef_.prototype._view;
    /** @type {?} */
    ViewContainerRef_.prototype._elIndex;
}
class ViewRef_ {
    /**
     * @param {?} _view
     */
    constructor(_view) { this._view = _view; }
    /**
     * @return {?}
     */
    get rootNodes() { return rootRenderNodes(this._view); }
    /**
     * @return {?}
     */
    get context() { return this._view.context; }
    /**
     * @return {?}
     */
    get destroyed() { return (this._view.state & ViewState.Destroyed) !== 0; }
    /**
     * @return {?}
     */
    markForCheck() { this.reattach(); }
    /**
     * @return {?}
     */
    detach() { this._view.state &= ~ViewState.ChecksEnabled; }
    /**
     * @return {?}
     */
    detectChanges() { checkAndUpdateView(this._view); }
    /**
     * @return {?}
     */
    checkNoChanges() { checkNoChangesView(this._view); }
    /**
     * @return {?}
     */
    reattach() { this._view.state |= ViewState.ChecksEnabled; }
    /**
     * @param {?} callback
     * @return {?}
     */
    onDestroy(callback) { this._view.disposables.push(/** @type {?} */ (callback)); }
    /**
     * @return {?}
     */
    destroy() { destroyView(this._view); }
}
function ViewRef__tsickle_Closure_declarations() {
    /**
     * \@internal
     * @type {?}
     */
    ViewRef_.prototype._view;
}
class TemplateRef_ {
    /**
     * @param {?} _parentView
     * @param {?} _def
     */
    constructor(_parentView, _def) {
        this._parentView = _parentView;
        this._def = _def;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        return new ViewRef_(createEmbeddedView(this._parentView, this._def, context));
    }
    /**
     * @return {?}
     */
    get elementRef() {
        return new ElementRef(asElementData(this._parentView, this._def.index).renderElement);
    }
}
function TemplateRef__tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateRef_.prototype._parentView;
    /** @type {?} */
    TemplateRef_.prototype._def;
}
class Injector_ {
    /**
     * @param {?} view
     * @param {?} elIndex
     */
    constructor(view, elIndex) {
        this.view = view;
        this.elIndex = elIndex;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
        return resolveDep(this.view, undefined, this.elIndex, { flags: DepFlags.None, token, tokenKey: tokenKey(token) }, notFoundValue);
    }
}
function Injector__tsickle_Closure_declarations() {
    /** @type {?} */
    Injector_.prototype.view;
    /** @type {?} */
    Injector_.prototype.elIndex;
}
class DebugContext_ {
    /**
     * @param {?} view
     * @param {?} nodeIndex
     */
    constructor(view, nodeIndex) {
        this.view = view;
        this.nodeIndex = nodeIndex;
        if (nodeIndex == null) {
            this.nodeIndex = nodeIndex = view.parentIndex;
            this.view = view = view.parent;
        }
        this.nodeDef = view.def.nodes[nodeIndex];
        this.elDef = findElementDef(view, nodeIndex);
    }
    /**
     * @return {?}
     */
    get injector() { return new Injector_(this.view, this.elDef.index); }
    /**
     * @return {?}
     */
    get component() { return this.view.component; }
    /**
     * @return {?}
     */
    get providerTokens() {
        const /** @type {?} */ tokens = [];
        if (this.elDef) {
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.view.def.nodes[i];
                if (childDef.type === NodeType.Provider) {
                    tokens.push(childDef.provider.token);
                }
                else {
                    i += childDef.childCount;
                }
            }
        }
        return tokens;
    }
    /**
     * @return {?}
     */
    get references() {
        const /** @type {?} */ references = {};
        if (this.elDef) {
            collectReferences(this.view, this.elDef, references);
            for (let /** @type {?} */ i = this.elDef.index + 1; i <= this.elDef.index + this.elDef.childCount; i++) {
                const /** @type {?} */ childDef = this.view.def.nodes[i];
                if (childDef.type === NodeType.Provider) {
                    collectReferences(this.view, childDef, references);
                }
                else {
                    i += childDef.childCount;
                }
            }
        }
        return references;
    }
    /**
     * @return {?}
     */
    get context() { return this.view.context; }
    /**
     * @return {?}
     */
    get source() {
        if (this.nodeDef.type === NodeType.Text) {
            return this.nodeDef.text.source;
        }
        else {
            return this.elDef.element.source;
        }
    }
    /**
     * @return {?}
     */
    get componentRenderElement() {
        const /** @type {?} */ elData = findHostElement(this.view);
        return elData ? elData.renderElement : undefined;
    }
    /**
     * @return {?}
     */
    get renderNode() {
        let /** @type {?} */ nodeDef = this.nodeDef.type === NodeType.Text ? this.nodeDef : this.elDef;
        return renderNode(this.view, nodeDef);
    }
}
function DebugContext__tsickle_Closure_declarations() {
    /** @type {?} */
    DebugContext_.prototype.nodeDef;
    /** @type {?} */
    DebugContext_.prototype.elDef;
    /** @type {?} */
    DebugContext_.prototype.view;
    /** @type {?} */
    DebugContext_.prototype.nodeIndex;
}
/**
 * @param {?} view
 * @return {?}
 */
function findHostElement(view) {
    while (view && !isComponentView(view)) {
        view = view.parent;
    }
    if (view.parent) {
        const /** @type {?} */ hostData = asElementData(view.parent, view.parentIndex);
        return hostData;
    }
    return undefined;
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} references
 * @return {?}
 */
function collectReferences(view, nodeDef, references) {
    for (let /** @type {?} */ queryId in nodeDef.matchedQueries) {
        if (queryId.startsWith('#')) {
            references[queryId.slice(1)] = getQueryValue(view, nodeDef, queryId);
        }
    }
}
//# sourceMappingURL=refs.js.map