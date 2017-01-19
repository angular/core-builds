/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorStatus } from '../change_detection/change_detection';
import { THROW_IF_NOT_FOUND } from '../di/injector';
import { isPresent } from '../facade/lang';
import { wtfCreateScope, wtfLeave } from '../profile/profile';
import { AnimationViewContext } from './animation_view_context';
import { DebugContext } from './debug_context';
import { ElementInjector } from './element_injector';
import { ExpressionChangedAfterItHasBeenCheckedError, ViewDestroyedError, ViewWrappedError } from './errors';
import { ViewRef_ } from './view_ref';
import { ViewType } from './view_type';
import { addToArray } from './view_utils';
const /** @type {?} */ _scope_check = wtfCreateScope(`AppView#check(ascii id)`);
/**
 * @experimental
 */
const /** @type {?} */ EMPTY_CONTEXT = new Object();
const /** @type {?} */ UNDEFINED = new Object();
/**
 * Cost of making objects: http://jsperf.com/instantiate-size-of-object
 *
 * @abstract
 */
export class AppView {
    /**
     * @param {?} clazz
     * @param {?} componentType
     * @param {?} type
     * @param {?} viewUtils
     * @param {?} parentView
     * @param {?} parentIndex
     * @param {?} parentElement
     * @param {?} cdMode
     * @param {?=} declaredViewContainer
     */
    constructor(clazz, componentType, type, viewUtils, parentView, parentIndex, parentElement, cdMode, declaredViewContainer = null) {
        this.clazz = clazz;
        this.componentType = componentType;
        this.type = type;
        this.viewUtils = viewUtils;
        this.parentView = parentView;
        this.parentIndex = parentIndex;
        this.parentElement = parentElement;
        this.cdMode = cdMode;
        this.declaredViewContainer = declaredViewContainer;
        this.numberOfChecks = 0;
        this.throwOnChange = false;
        this.ref = new ViewRef_(this, viewUtils.animationQueue);
        if (type === ViewType.COMPONENT || type === ViewType.HOST) {
            this.renderer = viewUtils.renderComponent(componentType);
        }
        else {
            this.renderer = parentView.renderer;
        }
        this._directRenderer = this.renderer.directRenderer;
    }
    /**
     * @return {?}
     */
    get animationContext() {
        if (!this._animationContext) {
            this._animationContext = new AnimationViewContext(this.viewUtils.animationQueue);
        }
        return this._animationContext;
    }
    /**
     * @return {?}
     */
    get destroyed() { return this.cdMode === ChangeDetectorStatus.Destroyed; }
    /**
     * @param {?} context
     * @return {?}
     */
    create(context) {
        this.context = context;
        return this.createInternal(null);
    }
    /**
     * @param {?} rootSelectorOrNode
     * @param {?} hostInjector
     * @param {?} projectableNodes
     * @return {?}
     */
    createHostView(rootSelectorOrNode, hostInjector, projectableNodes) {
        this.context = (EMPTY_CONTEXT);
        this._hasExternalHostElement = isPresent(rootSelectorOrNode);
        this._hostInjector = hostInjector;
        this._hostProjectableNodes = projectableNodes;
        return this.createInternal(rootSelectorOrNode);
    }
    /**
     * Overwritten by implementations.
     * Returns the ComponentRef for the host element for ViewType.HOST.
     * @param {?} rootSelectorOrNode
     * @return {?}
     */
    createInternal(rootSelectorOrNode) { return null; }
    /**
     * Overwritten by implementations.
     * @param {?} templateNodeIndex
     * @return {?}
     */
    createEmbeddedViewInternal(templateNodeIndex) { return null; }
    /**
     * @param {?} lastRootNode
     * @param {?} allNodes
     * @param {?} disposables
     * @return {?}
     */
    init(lastRootNode, allNodes, disposables) {
        this.lastRootNode = lastRootNode;
        this.allNodes = allNodes;
        this.disposables = disposables;
        if (this.type === ViewType.COMPONENT) {
            this.dirtyParentQueriesInternal();
        }
    }
    /**
     * @param {?} token
     * @param {?} nodeIndex
     * @param {?=} notFoundValue
     * @return {?}
     */
    injectorGet(token, nodeIndex, notFoundValue = THROW_IF_NOT_FOUND) {
        let /** @type {?} */ result = UNDEFINED;
        let /** @type {?} */ view = this;
        while (result === UNDEFINED) {
            if (isPresent(nodeIndex)) {
                result = view.injectorGetInternal(token, nodeIndex, UNDEFINED);
            }
            if (result === UNDEFINED && view.type === ViewType.HOST) {
                result = view._hostInjector.get(token, notFoundValue);
            }
            nodeIndex = view.parentIndex;
            view = view.parentView;
        }
        return result;
    }
    /**
     * Overwritten by implementations
     * @param {?} token
     * @param {?} nodeIndex
     * @param {?} notFoundResult
     * @return {?}
     */
    injectorGetInternal(token, nodeIndex, notFoundResult) {
        return notFoundResult;
    }
    /**
     * @param {?} nodeIndex
     * @return {?}
     */
    injector(nodeIndex) { return new ElementInjector(this, nodeIndex); }
    /**
     * @return {?}
     */
    detachAndDestroy() {
        if (this.viewContainer) {
            this.viewContainer.detachView(this.viewContainer.nestedViews.indexOf(this));
        }
        else if (this.appRef) {
            this.appRef.detachView(this.ref);
        }
        else if (this._hasExternalHostElement) {
            this.detach();
        }
        this.destroy();
    }
    /**
     * @return {?}
     */
    destroy() {
        if (this.cdMode === ChangeDetectorStatus.Destroyed) {
            return;
        }
        const /** @type {?} */ hostElement = this.type === ViewType.COMPONENT ? this.parentElement : null;
        if (this.disposables) {
            for (let /** @type {?} */ i = 0; i < this.disposables.length; i++) {
                this.disposables[i]();
            }
        }
        this.destroyInternal();
        this.dirtyParentQueriesInternal();
        if (this._animationContext) {
            this._animationContext.onAllActiveAnimationsDone(() => this.renderer.destroyView(hostElement, this.allNodes));
        }
        else {
            this.renderer.destroyView(hostElement, this.allNodes);
        }
        this.cdMode = ChangeDetectorStatus.Destroyed;
    }
    /**
     * Overwritten by implementations
     * @return {?}
     */
    destroyInternal() { }
    /**
     * Overwritten by implementations
     * @return {?}
     */
    detachInternal() { }
    /**
     * @return {?}
     */
    detach() {
        this.detachInternal();
        if (this._animationContext) {
            this._animationContext.onAllActiveAnimationsDone(() => this._renderDetach());
        }
        else {
            this._renderDetach();
        }
        if (this.declaredViewContainer && this.declaredViewContainer !== this.viewContainer &&
            this.declaredViewContainer.projectedViews) {
            const /** @type {?} */ projectedViews = this.declaredViewContainer.projectedViews;
            const /** @type {?} */ index = projectedViews.indexOf(this);
            // perf: pop is faster than splice!
            if (index >= projectedViews.length - 1) {
                projectedViews.pop();
            }
            else {
                projectedViews.splice(index, 1);
            }
        }
        this.appRef = null;
        this.viewContainer = null;
        this.dirtyParentQueriesInternal();
    }
    /**
     * @return {?}
     */
    _renderDetach() {
        if (this._directRenderer) {
            this.visitRootNodesInternal(this._directRenderer.remove, null);
        }
        else {
            this.renderer.detachView(this.flatRootNodes);
        }
    }
    /**
     * @param {?} appRef
     * @return {?}
     */
    attachToAppRef(appRef) {
        if (this.viewContainer) {
            throw new Error('This view is already attached to a ViewContainer!');
        }
        this.appRef = appRef;
        this.dirtyParentQueriesInternal();
    }
    /**
     * @param {?} viewContainer
     * @param {?} prevView
     * @return {?}
     */
    attachAfter(viewContainer, prevView) {
        if (this.appRef) {
            throw new Error('This view is already attached directly to the ApplicationRef!');
        }
        this._renderAttach(viewContainer, prevView);
        this.viewContainer = viewContainer;
        if (this.declaredViewContainer && this.declaredViewContainer !== viewContainer) {
            if (!this.declaredViewContainer.projectedViews) {
                this.declaredViewContainer.projectedViews = [];
            }
            this.declaredViewContainer.projectedViews.push(this);
        }
        this.dirtyParentQueriesInternal();
    }
    /**
     * @param {?} viewContainer
     * @param {?} prevView
     * @return {?}
     */
    moveAfter(viewContainer, prevView) {
        this._renderAttach(viewContainer, prevView);
        this.dirtyParentQueriesInternal();
    }
    /**
     * @param {?} viewContainer
     * @param {?} prevView
     * @return {?}
     */
    _renderAttach(viewContainer, prevView) {
        const /** @type {?} */ prevNode = prevView ? prevView.lastRootNode : viewContainer.nativeElement;
        if (this._directRenderer) {
            const /** @type {?} */ nextSibling = this._directRenderer.nextSibling(prevNode);
            if (nextSibling) {
                this.visitRootNodesInternal(this._directRenderer.insertBefore, nextSibling);
            }
            else {
                const /** @type {?} */ parentElement = this._directRenderer.parentElement(prevNode);
                if (parentElement) {
                    this.visitRootNodesInternal(this._directRenderer.appendChild, parentElement);
                }
            }
        }
        else {
            this.renderer.attachViewAfter(prevNode, this.flatRootNodes);
        }
    }
    /**
     * @return {?}
     */
    get changeDetectorRef() { return this.ref; }
    /**
     * @return {?}
     */
    get flatRootNodes() {
        const /** @type {?} */ nodes = [];
        this.visitRootNodesInternal(addToArray, nodes);
        return nodes;
    }
    /**
     * @param {?} parentElement
     * @param {?} ngContentIndex
     * @return {?}
     */
    projectNodes(parentElement, ngContentIndex) {
        if (this._directRenderer) {
            this.visitProjectedNodes(ngContentIndex, this._directRenderer.appendChild, parentElement);
        }
        else {
            const /** @type {?} */ nodes = [];
            this.visitProjectedNodes(ngContentIndex, addToArray, nodes);
            this.renderer.projectNodes(parentElement, nodes);
        }
    }
    /**
     * @param {?} ngContentIndex
     * @param {?} cb
     * @param {?} c
     * @return {?}
     */
    visitProjectedNodes(ngContentIndex, cb, c) {
        switch (this.type) {
            case ViewType.EMBEDDED:
                this.parentView.visitProjectedNodes(ngContentIndex, cb, c);
                break;
            case ViewType.COMPONENT:
                if (this.parentView.type === ViewType.HOST) {
                    const /** @type {?} */ nodes = this.parentView._hostProjectableNodes[ngContentIndex] || [];
                    for (let /** @type {?} */ i = 0; i < nodes.length; i++) {
                        cb(nodes[i], c);
                    }
                }
                else {
                    this.parentView.visitProjectableNodesInternal(this.parentIndex, ngContentIndex, cb, c);
                }
                break;
        }
    }
    /**
     * Overwritten by implementations
     * @param {?} cb
     * @param {?} c
     * @return {?}
     */
    visitRootNodesInternal(cb, c) { }
    /**
     * Overwritten by implementations
     * @param {?} nodeIndex
     * @param {?} ngContentIndex
     * @param {?} cb
     * @param {?} c
     * @return {?}
     */
    visitProjectableNodesInternal(nodeIndex, ngContentIndex, cb, c) { }
    /**
     * Overwritten by implementations
     * @return {?}
     */
    dirtyParentQueriesInternal() { }
    /**
     * @param {?} throwOnChange
     * @return {?}
     */
    internalDetectChanges(throwOnChange) {
        if (this.cdMode !== ChangeDetectorStatus.Detached) {
            this.detectChanges(throwOnChange);
        }
    }
    /**
     * @param {?} throwOnChange
     * @return {?}
     */
    detectChanges(throwOnChange) {
        const /** @type {?} */ s = _scope_check(this.clazz);
        if (this.cdMode === ChangeDetectorStatus.Checked ||
            this.cdMode === ChangeDetectorStatus.Errored)
            return;
        if (this.cdMode === ChangeDetectorStatus.Destroyed) {
            this.throwDestroyedError('detectChanges');
        }
        this.throwOnChange = throwOnChange;
        this.detectChangesInternal();
        if (this.cdMode === ChangeDetectorStatus.CheckOnce)
            this.cdMode = ChangeDetectorStatus.Checked;
        this.numberOfChecks++;
        wtfLeave(s);
    }
    /**
     * Overwritten by implementations
     * @return {?}
     */
    detectChangesInternal() { }
    /**
     * @return {?}
     */
    markAsCheckOnce() { this.cdMode = ChangeDetectorStatus.CheckOnce; }
    /**
     * @return {?}
     */
    markPathToRootAsCheckOnce() {
        let /** @type {?} */ c = this;
        while (isPresent(c) && c.cdMode !== ChangeDetectorStatus.Detached) {
            if (c.cdMode === ChangeDetectorStatus.Checked) {
                c.cdMode = ChangeDetectorStatus.CheckOnce;
            }
            if (c.type === ViewType.COMPONENT) {
                c = c.parentView;
            }
            else {
                c = c.viewContainer ? c.viewContainer.parentView : null;
            }
        }
    }
    /**
     * @param {?} cb
     * @return {?}
     */
    eventHandler(cb) {
        return cb;
    }
    /**
     * @param {?} details
     * @return {?}
     */
    throwDestroyedError(details) { throw new ViewDestroyedError(details); }
}
function AppView_tsickle_Closure_declarations() {
    /** @type {?} */
    AppView.prototype.ref;
    /** @type {?} */
    AppView.prototype.lastRootNode;
    /** @type {?} */
    AppView.prototype.allNodes;
    /** @type {?} */
    AppView.prototype.disposables;
    /** @type {?} */
    AppView.prototype.viewContainer;
    /** @type {?} */
    AppView.prototype.appRef;
    /** @type {?} */
    AppView.prototype.numberOfChecks;
    /** @type {?} */
    AppView.prototype.throwOnChange;
    /** @type {?} */
    AppView.prototype.renderer;
    /** @type {?} */
    AppView.prototype._hasExternalHostElement;
    /** @type {?} */
    AppView.prototype._hostInjector;
    /** @type {?} */
    AppView.prototype._hostProjectableNodes;
    /** @type {?} */
    AppView.prototype._animationContext;
    /** @type {?} */
    AppView.prototype._directRenderer;
    /** @type {?} */
    AppView.prototype.context;
    /** @type {?} */
    AppView.prototype.clazz;
    /** @type {?} */
    AppView.prototype.componentType;
    /** @type {?} */
    AppView.prototype.type;
    /** @type {?} */
    AppView.prototype.viewUtils;
    /** @type {?} */
    AppView.prototype.parentView;
    /** @type {?} */
    AppView.prototype.parentIndex;
    /** @type {?} */
    AppView.prototype.parentElement;
    /** @type {?} */
    AppView.prototype.cdMode;
    /** @type {?} */
    AppView.prototype.declaredViewContainer;
}
export class DebugAppView extends AppView {
    /**
     * @param {?} clazz
     * @param {?} componentType
     * @param {?} type
     * @param {?} viewUtils
     * @param {?} parentView
     * @param {?} parentIndex
     * @param {?} parentNode
     * @param {?} cdMode
     * @param {?} staticNodeDebugInfos
     * @param {?=} declaredViewContainer
     */
    constructor(clazz, componentType, type, viewUtils, parentView, parentIndex, parentNode, cdMode, staticNodeDebugInfos, declaredViewContainer = null) {
        super(clazz, componentType, type, viewUtils, parentView, parentIndex, parentNode, cdMode, declaredViewContainer);
        this.staticNodeDebugInfos = staticNodeDebugInfos;
        this._currentDebugContext = null;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    create(context) {
        this._resetDebug();
        try {
            return super.create(context);
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @param {?} rootSelectorOrNode
     * @param {?} injector
     * @param {?=} projectableNodes
     * @return {?}
     */
    createHostView(rootSelectorOrNode, injector, projectableNodes = null) {
        this._resetDebug();
        try {
            return super.createHostView(rootSelectorOrNode, injector, projectableNodes);
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @param {?} token
     * @param {?} nodeIndex
     * @param {?=} notFoundResult
     * @return {?}
     */
    injectorGet(token, nodeIndex, notFoundResult) {
        this._resetDebug();
        try {
            return super.injectorGet(token, nodeIndex, notFoundResult);
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @return {?}
     */
    detach() {
        this._resetDebug();
        try {
            super.detach();
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @return {?}
     */
    destroy() {
        this._resetDebug();
        try {
            super.destroy();
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @param {?} throwOnChange
     * @return {?}
     */
    detectChanges(throwOnChange) {
        this._resetDebug();
        try {
            super.detectChanges(throwOnChange);
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
    /**
     * @return {?}
     */
    _resetDebug() { this._currentDebugContext = null; }
    /**
     * @param {?} nodeIndex
     * @param {?} rowNum
     * @param {?} colNum
     * @return {?}
     */
    debug(nodeIndex, rowNum, colNum) {
        return this._currentDebugContext = new DebugContext(this, nodeIndex, rowNum, colNum);
    }
    /**
     * @param {?} e
     * @return {?}
     */
    _rethrowWithContext(e) {
        if (!(e instanceof ViewWrappedError)) {
            if (!(e instanceof ExpressionChangedAfterItHasBeenCheckedError)) {
                this.cdMode = ChangeDetectorStatus.Errored;
            }
            if (isPresent(this._currentDebugContext)) {
                throw new ViewWrappedError(e, this._currentDebugContext);
            }
        }
    }
    /**
     * @param {?} cb
     * @return {?}
     */
    eventHandler(cb) {
        const /** @type {?} */ superHandler = super.eventHandler(cb);
        return (eventName, event) => {
            this._resetDebug();
            try {
                return superHandler.call(this, eventName, event);
            }
            catch (e) {
                this._rethrowWithContext(e);
                throw e;
            }
        };
    }
}
function DebugAppView_tsickle_Closure_declarations() {
    /** @type {?} */
    DebugAppView.prototype._currentDebugContext;
    /** @type {?} */
    DebugAppView.prototype.staticNodeDebugInfos;
}
//# sourceMappingURL=view.js.map