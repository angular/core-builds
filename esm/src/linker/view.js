/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { AnimationGroupPlayer } from '../animation/animation_group_player';
import { AnimationTransitionEvent } from '../animation/animation_transition_event';
import { ViewAnimationMap } from '../animation/view_animation_map';
import { ChangeDetectorStatus } from '../change_detection/change_detection';
import { ListWrapper } from '../facade/collection';
import { isPresent } from '../facade/lang';
import { wtfCreateScope, wtfLeave } from '../profile/profile';
import { DebugContext } from './debug_context';
import { AppElement } from './element';
import { ElementInjector } from './element_injector';
import { ExpressionChangedAfterItHasBeenCheckedError, ViewDestroyedError, ViewWrappedError } from './errors';
import { ViewRef_ } from './view_ref';
import { ViewType } from './view_type';
import { ensureSlotCount, flattenNestedViewRenderNodes } from './view_utils';
var _scope_check = wtfCreateScope(`AppView#check(ascii id)`);
/**
 * Cost of making objects: http://jsperf.com/instantiate-size-of-object
 *
 */
export class AppView {
    constructor(clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode) {
        this.clazz = clazz;
        this.componentType = componentType;
        this.type = type;
        this.viewUtils = viewUtils;
        this.parentInjector = parentInjector;
        this.declarationAppElement = declarationAppElement;
        this.cdMode = cdMode;
        this.contentChildren = [];
        this.viewChildren = [];
        this.viewContainerElement = null;
        this.numberOfChecks = 0;
        this.animationPlayers = new ViewAnimationMap();
        this._animationListeners = new Map();
        this.ref = new ViewRef_(this);
        if (type === ViewType.COMPONENT || type === ViewType.HOST) {
            this.renderer = viewUtils.renderComponent(componentType);
        }
        else {
            this.renderer = declarationAppElement.parentView.renderer;
        }
    }
    get destroyed() { return this.cdMode === ChangeDetectorStatus.Destroyed; }
    cancelActiveAnimation(element, animationName, removeAllAnimations = false) {
        if (removeAllAnimations) {
            this.animationPlayers.findAllPlayersByElement(element).forEach(player => player.destroy());
        }
        else {
            var player = this.animationPlayers.find(element, animationName);
            if (isPresent(player)) {
                player.destroy();
            }
        }
    }
    queueAnimation(element, animationName, player, totalTime, fromState, toState) {
        var event = new AnimationTransitionEvent({ 'fromState': fromState, 'toState': toState, 'totalTime': totalTime });
        this.animationPlayers.set(element, animationName, player);
        player.onDone(() => {
            // TODO: make this into a datastructure for done|start
            this.triggerAnimationOutput(element, animationName, 'done', event);
            this.animationPlayers.remove(element, animationName);
        });
        player.onStart(() => { this.triggerAnimationOutput(element, animationName, 'start', event); });
    }
    triggerQueuedAnimations() {
        this.animationPlayers.getAllPlayers().forEach(player => {
            if (!player.hasStarted()) {
                player.play();
            }
        });
    }
    triggerAnimationOutput(element, animationName, phase, event) {
        var listeners = this._animationListeners.get(element);
        if (isPresent(listeners) && listeners.length) {
            for (let i = 0; i < listeners.length; i++) {
                let listener = listeners[i];
                // we check for both the name in addition to the phase in the event
                // that there may be more than one @trigger on the same element
                if (listener.output.name == animationName && listener.output.phase == phase) {
                    listener.handler(event);
                    break;
                }
            }
        }
    }
    registerAnimationOutput(element, outputEvent, eventHandler) {
        var entry = new _AnimationOutputWithHandler(outputEvent, eventHandler);
        var animations = this._animationListeners.get(element);
        if (!isPresent(animations)) {
            this._animationListeners.set(element, animations = []);
        }
        animations.push(entry);
    }
    create(context, givenProjectableNodes, rootSelectorOrNode) {
        this.context = context;
        var projectableNodes;
        switch (this.type) {
            case ViewType.COMPONENT:
                projectableNodes = ensureSlotCount(givenProjectableNodes, this.componentType.slotCount);
                break;
            case ViewType.EMBEDDED:
                projectableNodes = this.declarationAppElement.parentView.projectableNodes;
                break;
            case ViewType.HOST:
                // Note: Don't ensure the slot count for the projectableNodes as we store
                // them only for the contained component view (which will later check the slot count...)
                projectableNodes = givenProjectableNodes;
                break;
        }
        this._hasExternalHostElement = isPresent(rootSelectorOrNode);
        this.projectableNodes = projectableNodes;
        return this.createInternal(rootSelectorOrNode);
    }
    /**
     * Overwritten by implementations.
     * Returns the AppElement for the host element for ViewType.HOST.
     */
    createInternal(rootSelectorOrNode) { return null; }
    init(rootNodesOrAppElements, allNodes, disposables, subscriptions) {
        this.rootNodesOrAppElements = rootNodesOrAppElements;
        this.allNodes = allNodes;
        this.disposables = disposables;
        this.subscriptions = subscriptions;
        if (this.type === ViewType.COMPONENT) {
            // Note: the render nodes have been attached to their host element
            // in the ViewFactory already.
            this.declarationAppElement.parentView.viewChildren.push(this);
            this.dirtyParentQueriesInternal();
        }
    }
    selectOrCreateHostElement(elementName, rootSelectorOrNode, debugInfo) {
        var hostElement;
        if (isPresent(rootSelectorOrNode)) {
            hostElement = this.renderer.selectRootElement(rootSelectorOrNode, debugInfo);
        }
        else {
            hostElement = this.renderer.createElement(null, elementName, debugInfo);
        }
        return hostElement;
    }
    injectorGet(token, nodeIndex, notFoundResult) {
        return this.injectorGetInternal(token, nodeIndex, notFoundResult);
    }
    /**
     * Overwritten by implementations
     */
    injectorGetInternal(token, nodeIndex, notFoundResult) {
        return notFoundResult;
    }
    injector(nodeIndex) {
        if (isPresent(nodeIndex)) {
            return new ElementInjector(this, nodeIndex);
        }
        else {
            return this.parentInjector;
        }
    }
    destroy() {
        if (this._hasExternalHostElement) {
            this.renderer.detachView(this.flatRootNodes);
        }
        else if (isPresent(this.viewContainerElement)) {
            this.viewContainerElement.detachView(this.viewContainerElement.nestedViews.indexOf(this));
        }
        this._destroyRecurse();
    }
    _destroyRecurse() {
        if (this.cdMode === ChangeDetectorStatus.Destroyed) {
            return;
        }
        var children = this.contentChildren;
        for (var i = 0; i < children.length; i++) {
            children[i]._destroyRecurse();
        }
        children = this.viewChildren;
        for (var i = 0; i < children.length; i++) {
            children[i]._destroyRecurse();
        }
        this.destroyLocal();
        this.cdMode = ChangeDetectorStatus.Destroyed;
    }
    destroyLocal() {
        var hostElement = this.type === ViewType.COMPONENT ? this.declarationAppElement.nativeElement : null;
        for (var i = 0; i < this.disposables.length; i++) {
            this.disposables[i]();
        }
        for (var i = 0; i < this.subscriptions.length; i++) {
            this.subscriptions[i].unsubscribe();
        }
        this.destroyInternal();
        this.dirtyParentQueriesInternal();
        if (this.animationPlayers.length == 0) {
            this.renderer.destroyView(hostElement, this.allNodes);
        }
        else {
            var player = new AnimationGroupPlayer(this.animationPlayers.getAllPlayers());
            player.onDone(() => { this.renderer.destroyView(hostElement, this.allNodes); });
        }
    }
    /**
     * Overwritten by implementations
     */
    destroyInternal() { }
    /**
     * Overwritten by implementations
     */
    detachInternal() { }
    detach() {
        this.detachInternal();
        if (this.animationPlayers.length == 0) {
            this.renderer.detachView(this.flatRootNodes);
        }
        else {
            var player = new AnimationGroupPlayer(this.animationPlayers.getAllPlayers());
            player.onDone(() => { this.renderer.detachView(this.flatRootNodes); });
        }
    }
    get changeDetectorRef() { return this.ref; }
    get parent() {
        return isPresent(this.declarationAppElement) ? this.declarationAppElement.parentView : null;
    }
    get flatRootNodes() { return flattenNestedViewRenderNodes(this.rootNodesOrAppElements); }
    get lastRootNode() {
        var lastNode = this.rootNodesOrAppElements.length > 0 ?
            this.rootNodesOrAppElements[this.rootNodesOrAppElements.length - 1] :
            null;
        return _findLastRenderNode(lastNode);
    }
    /**
     * Overwritten by implementations
     */
    dirtyParentQueriesInternal() { }
    detectChanges(throwOnChange) {
        var s = _scope_check(this.clazz);
        if (this.cdMode === ChangeDetectorStatus.Checked ||
            this.cdMode === ChangeDetectorStatus.Errored)
            return;
        if (this.cdMode === ChangeDetectorStatus.Destroyed) {
            this.throwDestroyedError('detectChanges');
        }
        this.detectChangesInternal(throwOnChange);
        if (this.cdMode === ChangeDetectorStatus.CheckOnce)
            this.cdMode = ChangeDetectorStatus.Checked;
        this.numberOfChecks++;
        wtfLeave(s);
    }
    /**
     * Overwritten by implementations
     */
    detectChangesInternal(throwOnChange) {
        this.detectContentChildrenChanges(throwOnChange);
        this.detectViewChildrenChanges(throwOnChange);
    }
    detectContentChildrenChanges(throwOnChange) {
        for (var i = 0; i < this.contentChildren.length; ++i) {
            var child = this.contentChildren[i];
            if (child.cdMode === ChangeDetectorStatus.Detached)
                continue;
            child.detectChanges(throwOnChange);
        }
    }
    detectViewChildrenChanges(throwOnChange) {
        for (var i = 0; i < this.viewChildren.length; ++i) {
            var child = this.viewChildren[i];
            if (child.cdMode === ChangeDetectorStatus.Detached)
                continue;
            child.detectChanges(throwOnChange);
        }
    }
    markContentChildAsMoved(renderAppElement) { this.dirtyParentQueriesInternal(); }
    addToContentChildren(renderAppElement) {
        renderAppElement.parentView.contentChildren.push(this);
        this.viewContainerElement = renderAppElement;
        this.dirtyParentQueriesInternal();
    }
    removeFromContentChildren(renderAppElement) {
        ListWrapper.remove(renderAppElement.parentView.contentChildren, this);
        this.dirtyParentQueriesInternal();
        this.viewContainerElement = null;
    }
    markAsCheckOnce() { this.cdMode = ChangeDetectorStatus.CheckOnce; }
    markPathToRootAsCheckOnce() {
        let c = this;
        while (isPresent(c) && c.cdMode !== ChangeDetectorStatus.Detached) {
            if (c.cdMode === ChangeDetectorStatus.Checked) {
                c.cdMode = ChangeDetectorStatus.CheckOnce;
            }
            let parentEl = c.type === ViewType.COMPONENT ? c.declarationAppElement : c.viewContainerElement;
            c = isPresent(parentEl) ? parentEl.parentView : null;
        }
    }
    eventHandler(cb) { return cb; }
    throwDestroyedError(details) { throw new ViewDestroyedError(details); }
}
export class DebugAppView extends AppView {
    constructor(clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode, staticNodeDebugInfos) {
        super(clazz, componentType, type, viewUtils, parentInjector, declarationAppElement, cdMode);
        this.staticNodeDebugInfos = staticNodeDebugInfos;
        this._currentDebugContext = null;
    }
    create(context, givenProjectableNodes, rootSelectorOrNode) {
        this._resetDebug();
        try {
            return super.create(context, givenProjectableNodes, rootSelectorOrNode);
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
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
    destroyLocal() {
        this._resetDebug();
        try {
            super.destroyLocal();
        }
        catch (e) {
            this._rethrowWithContext(e);
            throw e;
        }
    }
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
    _resetDebug() { this._currentDebugContext = null; }
    debug(nodeIndex, rowNum, colNum) {
        return this._currentDebugContext = new DebugContext(this, nodeIndex, rowNum, colNum);
    }
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
    eventHandler(cb) {
        var superHandler = super.eventHandler(cb);
        return (event) => {
            this._resetDebug();
            try {
                return superHandler(event);
            }
            catch (e) {
                this._rethrowWithContext(e);
                throw e;
            }
        };
    }
}
function _findLastRenderNode(node) {
    var lastNode;
    if (node instanceof AppElement) {
        var appEl = node;
        lastNode = appEl.nativeElement;
        if (isPresent(appEl.nestedViews)) {
            // Note: Views might have no root nodes at all!
            for (var i = appEl.nestedViews.length - 1; i >= 0; i--) {
                var nestedView = appEl.nestedViews[i];
                if (nestedView.rootNodesOrAppElements.length > 0) {
                    lastNode = _findLastRenderNode(nestedView.rootNodesOrAppElements[nestedView.rootNodesOrAppElements.length - 1]);
                }
            }
        }
    }
    else {
        lastNode = node;
    }
    return lastNode;
}
class _AnimationOutputWithHandler {
    constructor(output, handler) {
        this.output = output;
        this.handler = handler;
    }
}
//# sourceMappingURL=view.js.map