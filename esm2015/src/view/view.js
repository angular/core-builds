/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { checkAndUpdateElementDynamic, checkAndUpdateElementInline, createElement, listenToElementOutputs } from './element';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { appendNgContent } from './ng_content';
import { callLifecycleHooksChildrenFirst, checkAndUpdateDirectiveDynamic, checkAndUpdateDirectiveInline, createDirectiveInstance, createPipeInstance, createProviderInstance } from './provider';
import { checkAndUpdatePureExpressionDynamic, checkAndUpdatePureExpressionInline, createPureExpression } from './pure_expression';
import { checkAndUpdateQuery, createQuery } from './query';
import { createTemplateData, createViewContainerData } from './refs';
import { checkAndUpdateTextDynamic, checkAndUpdateTextInline, createText } from './text';
import { Services, asElementData, asQueryList, asTextData, shiftInitState } from './types';
import { NOOP, checkBindingNoChanges, isComponentView, markParentViewsForCheckProjectedViews, resolveDefinition, tokenKey } from './util';
import { detachProjectedView } from './view_attach';
/**
 * @param {?} flags
 * @param {?} nodes
 * @param {?=} updateDirectives
 * @param {?=} updateRenderer
 * @return {?}
 */
export function viewDef(flags, nodes, updateDirectives, updateRenderer) {
    // clone nodes and set auto calculated values
    let /** @type {?} */ viewBindingCount = 0;
    let /** @type {?} */ viewDisposableCount = 0;
    let /** @type {?} */ viewNodeFlags = 0;
    let /** @type {?} */ viewRootNodeFlags = 0;
    let /** @type {?} */ viewMatchedQueries = 0;
    let /** @type {?} */ currentParent = null;
    let /** @type {?} */ currentRenderParent = null;
    let /** @type {?} */ currentElementHasPublicProviders = false;
    let /** @type {?} */ currentElementHasPrivateProviders = false;
    let /** @type {?} */ lastRenderRootNode = null;
    for (let /** @type {?} */ i = 0; i < nodes.length; i++) {
        const /** @type {?} */ node = nodes[i];
        node.nodeIndex = i;
        node.parent = currentParent;
        node.bindingIndex = viewBindingCount;
        node.outputIndex = viewDisposableCount;
        node.renderParent = currentRenderParent;
        viewNodeFlags |= node.flags;
        viewMatchedQueries |= node.matchedQueryIds;
        if (node.element) {
            const /** @type {?} */ elDef = node.element;
            elDef.publicProviders =
                currentParent ? /** @type {?} */ ((currentParent.element)).publicProviders : Object.create(null);
            elDef.allProviders = elDef.publicProviders;
            // Note: We assume that all providers of an element are before any child element!
            currentElementHasPublicProviders = false;
            currentElementHasPrivateProviders = false;
            if (node.element.template) {
                viewMatchedQueries |= node.element.template.nodeMatchedQueries;
            }
        }
        validateNode(currentParent, node, nodes.length);
        viewBindingCount += node.bindings.length;
        viewDisposableCount += node.outputs.length;
        if (!currentRenderParent && (node.flags & 3 /* CatRenderNode */)) {
            lastRenderRootNode = node;
        }
        if (node.flags & 20224 /* CatProvider */) {
            if (!currentElementHasPublicProviders) {
                currentElementHasPublicProviders = true; /** @type {?} */
                ((/** @type {?} */ ((currentParent)).element)).publicProviders = Object.create(/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders); /** @type {?} */
                ((/** @type {?} */ ((currentParent)).element)).allProviders = /** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders;
            }
            const /** @type {?} */ isPrivateService = (node.flags & 8192 /* PrivateProvider */) !== 0;
            const /** @type {?} */ isComponent = (node.flags & 32768 /* Component */) !== 0;
            if (!isPrivateService || isComponent) {
                /** @type {?} */ ((/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders))[tokenKey(/** @type {?} */ ((node.provider)).token)] = node;
            }
            else {
                if (!currentElementHasPrivateProviders) {
                    currentElementHasPrivateProviders = true; /** @type {?} */
                    ((/** @type {?} */ ((currentParent)).element)).allProviders = Object.create(/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).publicProviders);
                } /** @type {?} */
                ((/** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).allProviders))[tokenKey(/** @type {?} */ ((node.provider)).token)] = node;
            }
            if (isComponent) {
                /** @type {?} */ ((/** @type {?} */ ((currentParent)).element)).componentProvider = node;
            }
        }
        if (currentParent) {
            currentParent.childFlags |= node.flags;
            currentParent.directChildFlags |= node.flags;
            currentParent.childMatchedQueries |= node.matchedQueryIds;
            if (node.element && node.element.template) {
                currentParent.childMatchedQueries |= node.element.template.nodeMatchedQueries;
            }
        }
        else {
            viewRootNodeFlags |= node.flags;
        }
        if (node.childCount > 0) {
            currentParent = node;
            if (!isNgContainer(node)) {
                currentRenderParent = node;
            }
        }
        else {
            // When the current node has no children, check if it is the last children of its parent.
            // When it is, propagate the flags up.
            // The loop is required because an element could be the last transitive children of several
            // elements. We loop to either the root or the highest opened element (= with remaining
            // children)
            while (currentParent && i === currentParent.nodeIndex + currentParent.childCount) {
                const /** @type {?} */ newParent = currentParent.parent;
                if (newParent) {
                    newParent.childFlags |= currentParent.childFlags;
                    newParent.childMatchedQueries |= currentParent.childMatchedQueries;
                }
                currentParent = newParent;
                // We also need to update the render parent & account for ng-container
                if (currentParent && isNgContainer(currentParent)) {
                    currentRenderParent = currentParent.renderParent;
                }
                else {
                    currentRenderParent = currentParent;
                }
            }
        }
    }
    const /** @type {?} */ handleEvent = (view, nodeIndex, eventName, event) => /** @type {?} */ ((/** @type {?} */ ((nodes[nodeIndex].element)).handleEvent))(view, eventName, event);
    return {
        // Will be filled later...
        factory: null,
        nodeFlags: viewNodeFlags,
        rootNodeFlags: viewRootNodeFlags,
        nodeMatchedQueries: viewMatchedQueries, flags,
        nodes: nodes,
        updateDirectives: updateDirectives || NOOP,
        updateRenderer: updateRenderer || NOOP, handleEvent,
        bindingCount: viewBindingCount,
        outputCount: viewDisposableCount, lastRenderRootNode
    };
}
/**
 * @param {?} node
 * @return {?}
 */
function isNgContainer(node) {
    return (node.flags & 1 /* TypeElement */) !== 0 && /** @type {?} */ ((node.element)).name === null;
}
/**
 * @param {?} parent
 * @param {?} node
 * @param {?} nodeCount
 * @return {?}
 */
function validateNode(parent, node, nodeCount) {
    const /** @type {?} */ template = node.element && node.element.template;
    if (template) {
        if (!template.lastRenderRootNode) {
            throw new Error(`Illegal State: Embedded templates without nodes are not allowed!`);
        }
        if (template.lastRenderRootNode &&
            template.lastRenderRootNode.flags & 16777216 /* EmbeddedViews */) {
            throw new Error(`Illegal State: Last root node of a template can't have embedded views, at index ${node.nodeIndex}!`);
        }
    }
    if (node.flags & 20224 /* CatProvider */) {
        const /** @type {?} */ parentFlags = parent ? parent.flags : 0;
        if ((parentFlags & 1 /* TypeElement */) === 0) {
            throw new Error(`Illegal State: StaticProvider/Directive nodes need to be children of elements or anchors, at index ${node.nodeIndex}!`);
        }
    }
    if (node.query) {
        if (node.flags & 67108864 /* TypeContentQuery */ &&
            (!parent || (parent.flags & 16384 /* TypeDirective */) === 0)) {
            throw new Error(`Illegal State: Content Query nodes need to be children of directives, at index ${node.nodeIndex}!`);
        }
        if (node.flags & 134217728 /* TypeViewQuery */ && parent) {
            throw new Error(`Illegal State: View Query nodes have to be top level nodes, at index ${node.nodeIndex}!`);
        }
    }
    if (node.childCount) {
        const /** @type {?} */ parentEnd = parent ? parent.nodeIndex + parent.childCount : nodeCount - 1;
        if (node.nodeIndex <= parentEnd && node.nodeIndex + node.childCount > parentEnd) {
            throw new Error(`Illegal State: childCount of node leads outside of parent, at index ${node.nodeIndex}!`);
        }
    }
}
/**
 * @param {?} parent
 * @param {?} anchorDef
 * @param {?} viewDef
 * @param {?=} context
 * @return {?}
 */
export function createEmbeddedView(parent, anchorDef, viewDef, context) {
    // embedded views are seen as siblings to the anchor, so we need
    // to get the parent of the anchor and use it as parentIndex.
    const /** @type {?} */ view = createView(parent.root, parent.renderer, parent, anchorDef, viewDef);
    initView(view, parent.component, context);
    createViewNodes(view);
    return view;
}
/**
 * @param {?} root
 * @param {?} def
 * @param {?=} context
 * @return {?}
 */
export function createRootView(root, def, context) {
    const /** @type {?} */ view = createView(root, root.renderer, null, null, def);
    initView(view, context, context);
    createViewNodes(view);
    return view;
}
/**
 * @param {?} parentView
 * @param {?} nodeDef
 * @param {?} viewDef
 * @param {?} hostElement
 * @return {?}
 */
export function createComponentView(parentView, nodeDef, viewDef, hostElement) {
    const /** @type {?} */ rendererType = /** @type {?} */ ((nodeDef.element)).componentRendererType;
    let /** @type {?} */ compRenderer;
    if (!rendererType) {
        compRenderer = parentView.root.renderer;
    }
    else {
        compRenderer = parentView.root.rendererFactory.createRenderer(hostElement, rendererType);
    }
    return createView(parentView.root, compRenderer, parentView, /** @type {?} */ ((nodeDef.element)).componentProvider, viewDef);
}
/**
 * @param {?} root
 * @param {?} renderer
 * @param {?} parent
 * @param {?} parentNodeDef
 * @param {?} def
 * @return {?}
 */
function createView(root, renderer, parent, parentNodeDef, def) {
    const /** @type {?} */ nodes = new Array(def.nodes.length);
    const /** @type {?} */ disposables = def.outputCount ? new Array(def.outputCount) : null;
    const /** @type {?} */ view = {
        def,
        parent,
        viewContainerParent: null, parentNodeDef,
        context: null,
        component: null, nodes,
        state: 13 /* CatInit */, root, renderer,
        oldValues: new Array(def.bindingCount), disposables,
        initIndex: -1
    };
    return view;
}
/**
 * @param {?} view
 * @param {?} component
 * @param {?} context
 * @return {?}
 */
function initView(view, component, context) {
    view.component = component;
    view.context = context;
}
/**
 * @param {?} view
 * @return {?}
 */
function createViewNodes(view) {
    let /** @type {?} */ renderHost;
    if (isComponentView(view)) {
        const /** @type {?} */ hostDef = view.parentNodeDef;
        renderHost = asElementData(/** @type {?} */ ((view.parent)), /** @type {?} */ ((/** @type {?} */ ((hostDef)).parent)).nodeIndex).renderElement;
    }
    const /** @type {?} */ def = view.def;
    const /** @type {?} */ nodes = view.nodes;
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        Services.setCurrentNode(view, i);
        let /** @type {?} */ nodeData;
        switch (nodeDef.flags & 201347067 /* Types */) {
            case 1 /* TypeElement */:
                const /** @type {?} */ el = /** @type {?} */ (createElement(view, renderHost, nodeDef));
                let /** @type {?} */ componentView = /** @type {?} */ ((undefined));
                if (nodeDef.flags & 33554432 /* ComponentView */) {
                    const /** @type {?} */ compViewDef = resolveDefinition(/** @type {?} */ ((/** @type {?} */ ((nodeDef.element)).componentView)));
                    componentView = Services.createComponentView(view, nodeDef, compViewDef, el);
                }
                listenToElementOutputs(view, componentView, nodeDef, el);
                nodeData = /** @type {?} */ ({
                    renderElement: el,
                    componentView,
                    viewContainer: null,
                    template: /** @type {?} */ ((nodeDef.element)).template ? createTemplateData(view, nodeDef) : undefined
                });
                if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
                    nodeData.viewContainer = createViewContainerData(view, nodeDef, nodeData);
                }
                break;
            case 2 /* TypeText */:
                nodeData = /** @type {?} */ (createText(view, renderHost, nodeDef));
                break;
            case 512 /* TypeClassProvider */:
            case 1024 /* TypeFactoryProvider */:
            case 2048 /* TypeUseExistingProvider */:
            case 256 /* TypeValueProvider */: {
                nodeData = nodes[i];
                if (!nodeData && !(nodeDef.flags & 4096 /* LazyProvider */)) {
                    const /** @type {?} */ instance = createProviderInstance(view, nodeDef);
                    nodeData = /** @type {?} */ ({ instance });
                }
                break;
            }
            case 16 /* TypePipe */: {
                const /** @type {?} */ instance = createPipeInstance(view, nodeDef);
                nodeData = /** @type {?} */ ({ instance });
                break;
            }
            case 16384 /* TypeDirective */: {
                nodeData = nodes[i];
                if (!nodeData) {
                    const /** @type {?} */ instance = createDirectiveInstance(view, nodeDef);
                    nodeData = /** @type {?} */ ({ instance });
                }
                if (nodeDef.flags & 32768 /* Component */) {
                    const /** @type {?} */ compView = asElementData(view, /** @type {?} */ ((nodeDef.parent)).nodeIndex).componentView;
                    initView(compView, nodeData.instance, nodeData.instance);
                }
                break;
            }
            case 32 /* TypePureArray */:
            case 64 /* TypePureObject */:
            case 128 /* TypePurePipe */:
                nodeData = /** @type {?} */ (createPureExpression(view, nodeDef));
                break;
            case 67108864 /* TypeContentQuery */:
            case 134217728 /* TypeViewQuery */:
                nodeData = /** @type {?} */ (createQuery());
                break;
            case 8 /* TypeNgContent */:
                appendNgContent(view, renderHost, nodeDef);
                // no runtime data needed for NgContent...
                nodeData = undefined;
                break;
        }
        nodes[i] = nodeData;
    }
    // Create the ViewData.nodes of component views after we created everything else,
    // so that e.g. ng-content works
    execComponentViewsAction(view, ViewAction.CreateViewNodes);
    // fill static content and view queries
    execQueriesAction(view, 67108864 /* TypeContentQuery */ | 134217728 /* TypeViewQuery */, 268435456 /* StaticQuery */, 0 /* CheckAndUpdate */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkNoChangesView(view) {
    markProjectedViewsForCheck(view);
    Services.updateDirectives(view, 1 /* CheckNoChanges */);
    execEmbeddedViewsAction(view, ViewAction.CheckNoChanges);
    Services.updateRenderer(view, 1 /* CheckNoChanges */);
    execComponentViewsAction(view, ViewAction.CheckNoChanges);
    // Note: We don't check queries for changes as we didn't do this in v2.x.
    // TODO(tbosch): investigate if we can enable the check again in v5.x with a nicer error message.
    view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkAndUpdateView(view) {
    if (view.state & 1 /* BeforeFirstCheck */) {
        view.state &= ~1 /* BeforeFirstCheck */;
        view.state |= 2 /* FirstCheck */;
    }
    else {
        view.state &= ~2 /* FirstCheck */;
    }
    shiftInitState(view, 0 /* InitState_BeforeInit */, 256 /* InitState_CallingOnInit */);
    markProjectedViewsForCheck(view);
    Services.updateDirectives(view, 0 /* CheckAndUpdate */);
    execEmbeddedViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, 67108864 /* TypeContentQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
    let /** @type {?} */ callInit = shiftInitState(view, 256 /* InitState_CallingOnInit */, 512 /* InitState_CallingAfterContentInit */);
    callLifecycleHooksChildrenFirst(view, 2097152 /* AfterContentChecked */ | (callInit ? 1048576 /* AfterContentInit */ : 0));
    Services.updateRenderer(view, 0 /* CheckAndUpdate */);
    execComponentViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, 134217728 /* TypeViewQuery */, 536870912 /* DynamicQuery */, 0 /* CheckAndUpdate */);
    callInit = shiftInitState(view, 512 /* InitState_CallingAfterContentInit */, 768 /* InitState_CallingAfterViewInit */);
    callLifecycleHooksChildrenFirst(view, 8388608 /* AfterViewChecked */ | (callInit ? 4194304 /* AfterViewInit */ : 0));
    if (view.def.flags & 2 /* OnPush */) {
        view.state &= ~8 /* ChecksEnabled */;
    }
    view.state &= ~(64 /* CheckProjectedViews */ | 32 /* CheckProjectedView */);
    shiftInitState(view, 768 /* InitState_CallingAfterViewInit */, 1024 /* InitState_AfterInit */);
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
export function checkAndUpdateNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === 0 /* Inline */) {
        return checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        return checkAndUpdateNodeDynamic(view, nodeDef, v0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
function markProjectedViewsForCheck(view) {
    const /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & 4 /* ProjectedTemplate */)) {
        return;
    }
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & 4 /* ProjectedTemplate */) {
            const /** @type {?} */ projectedViews = asElementData(view, i).template._projectedViews;
            if (projectedViews) {
                for (let /** @type {?} */ i = 0; i < projectedViews.length; i++) {
                    const /** @type {?} */ projectedView = projectedViews[i];
                    projectedView.state |= 32 /* CheckProjectedView */;
                    markParentViewsForCheckProjectedViews(projectedView, view);
                }
            }
        }
        else if ((nodeDef.childFlags & 4 /* ProjectedTemplate */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
function checkAndUpdateNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    switch (nodeDef.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return checkAndUpdateElementInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 2 /* TypeText */:
            return checkAndUpdateTextInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 16384 /* TypeDirective */:
            return checkAndUpdateDirectiveInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case 32 /* TypePureArray */:
        case 64 /* TypePureObject */:
        case 128 /* TypePurePipe */:
            return checkAndUpdatePureExpressionInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        default:
            throw 'unreachable';
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function checkAndUpdateNodeDynamic(view, nodeDef, values) {
    switch (nodeDef.flags & 201347067 /* Types */) {
        case 1 /* TypeElement */:
            return checkAndUpdateElementDynamic(view, nodeDef, values);
        case 2 /* TypeText */:
            return checkAndUpdateTextDynamic(view, nodeDef, values);
        case 16384 /* TypeDirective */:
            return checkAndUpdateDirectiveDynamic(view, nodeDef, values);
        case 32 /* TypePureArray */:
        case 64 /* TypePureObject */:
        case 128 /* TypePurePipe */:
            return checkAndUpdatePureExpressionDynamic(view, nodeDef, values);
        default:
            throw 'unreachable';
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} argStyle
 * @param {?=} v0
 * @param {?=} v1
 * @param {?=} v2
 * @param {?=} v3
 * @param {?=} v4
 * @param {?=} v5
 * @param {?=} v6
 * @param {?=} v7
 * @param {?=} v8
 * @param {?=} v9
 * @return {?}
 */
export function checkNoChangesNode(view, nodeDef, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === 0 /* Inline */) {
        checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        checkNoChangesNodeDynamic(view, nodeDef, v0);
    }
    // Returning false is ok here as we would have thrown in case of a change.
    return false;
}
/**
 * @param {?} view
 * @param {?} nodeDef
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
function checkNoChangesNodeInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const /** @type {?} */ bindLen = nodeDef.bindings.length;
    if (bindLen > 0)
        checkBindingNoChanges(view, nodeDef, 0, v0);
    if (bindLen > 1)
        checkBindingNoChanges(view, nodeDef, 1, v1);
    if (bindLen > 2)
        checkBindingNoChanges(view, nodeDef, 2, v2);
    if (bindLen > 3)
        checkBindingNoChanges(view, nodeDef, 3, v3);
    if (bindLen > 4)
        checkBindingNoChanges(view, nodeDef, 4, v4);
    if (bindLen > 5)
        checkBindingNoChanges(view, nodeDef, 5, v5);
    if (bindLen > 6)
        checkBindingNoChanges(view, nodeDef, 6, v6);
    if (bindLen > 7)
        checkBindingNoChanges(view, nodeDef, 7, v7);
    if (bindLen > 8)
        checkBindingNoChanges(view, nodeDef, 8, v8);
    if (bindLen > 9)
        checkBindingNoChanges(view, nodeDef, 9, v9);
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function checkNoChangesNodeDynamic(view, nodeDef, values) {
    for (let /** @type {?} */ i = 0; i < values.length; i++) {
        checkBindingNoChanges(view, nodeDef, i, values[i]);
    }
}
/**
 * Workaround https://github.com/angular/tsickle/issues/497
 * @suppress {misplacedTypeAnnotation}
 * @param {?} view
 * @param {?} nodeDef
 * @return {?}
 */
function checkNoChangesQuery(view, nodeDef) {
    const /** @type {?} */ queryList = asQueryList(view, nodeDef.nodeIndex);
    if (queryList.dirty) {
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, nodeDef.nodeIndex), `Query ${(/** @type {?} */ ((nodeDef.query))).id} not dirty`, `Query ${(/** @type {?} */ ((nodeDef.query))).id} dirty`, (view.state & 1 /* BeforeFirstCheck */) !== 0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function destroyView(view) {
    if (view.state & 128 /* Destroyed */) {
        return;
    }
    execEmbeddedViewsAction(view, ViewAction.Destroy);
    execComponentViewsAction(view, ViewAction.Destroy);
    callLifecycleHooksChildrenFirst(view, 131072 /* OnDestroy */);
    if (view.disposables) {
        for (let /** @type {?} */ i = 0; i < view.disposables.length; i++) {
            view.disposables[i]();
        }
    }
    detachProjectedView(view);
    if (view.renderer.destroyNode) {
        destroyViewNodes(view);
    }
    if (isComponentView(view)) {
        view.renderer.destroy();
    }
    view.state |= 128 /* Destroyed */;
}
/**
 * @param {?} view
 * @return {?}
 */
function destroyViewNodes(view) {
    const /** @type {?} */ len = view.def.nodes.length;
    for (let /** @type {?} */ i = 0; i < len; i++) {
        const /** @type {?} */ def = view.def.nodes[i];
        if (def.flags & 1 /* TypeElement */) {
            /** @type {?} */ ((view.renderer.destroyNode))(asElementData(view, i).renderElement);
        }
        else if (def.flags & 2 /* TypeText */) {
            /** @type {?} */ ((view.renderer.destroyNode))(asTextData(view, i).renderText);
        }
        else if (def.flags & 67108864 /* TypeContentQuery */ || def.flags & 134217728 /* TypeViewQuery */) {
            asQueryList(view, i).destroy();
        }
    }
}
/** @enum {number} */
const ViewAction = {
    CreateViewNodes: 0,
    CheckNoChanges: 1,
    CheckNoChangesProjectedViews: 2,
    CheckAndUpdate: 3,
    CheckAndUpdateProjectedViews: 4,
    Destroy: 5,
};
ViewAction[ViewAction.CreateViewNodes] = "CreateViewNodes";
ViewAction[ViewAction.CheckNoChanges] = "CheckNoChanges";
ViewAction[ViewAction.CheckNoChangesProjectedViews] = "CheckNoChangesProjectedViews";
ViewAction[ViewAction.CheckAndUpdate] = "CheckAndUpdate";
ViewAction[ViewAction.CheckAndUpdateProjectedViews] = "CheckAndUpdateProjectedViews";
ViewAction[ViewAction.Destroy] = "Destroy";
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execComponentViewsAction(view, action) {
    const /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & 33554432 /* ComponentView */)) {
        return;
    }
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & 33554432 /* ComponentView */) {
            // a leaf
            callViewAction(asElementData(view, i).componentView, action);
        }
        else if ((nodeDef.childFlags & 33554432 /* ComponentView */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execEmbeddedViewsAction(view, action) {
    const /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & 16777216 /* EmbeddedViews */)) {
        return;
    }
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & 16777216 /* EmbeddedViews */) {
            // a leaf
            const /** @type {?} */ embeddedViews = /** @type {?} */ ((asElementData(view, i).viewContainer))._embeddedViews;
            for (let /** @type {?} */ k = 0; k < embeddedViews.length; k++) {
                callViewAction(embeddedViews[k], action);
            }
        }
        else if ((nodeDef.childFlags & 16777216 /* EmbeddedViews */) === 0) {
            // a parent with leafs
            // no child is a component,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function callViewAction(view, action) {
    const /** @type {?} */ viewState = view.state;
    switch (action) {
        case ViewAction.CheckNoChanges:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                    checkNoChangesView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, ViewAction.CheckNoChangesProjectedViews);
                }
            }
            break;
        case ViewAction.CheckNoChangesProjectedViews:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if (viewState & 32 /* CheckProjectedView */) {
                    checkNoChangesView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, action);
                }
            }
            break;
        case ViewAction.CheckAndUpdate:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if ((viewState & 12 /* CatDetectChanges */) === 12 /* CatDetectChanges */) {
                    checkAndUpdateView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, ViewAction.CheckAndUpdateProjectedViews);
                }
            }
            break;
        case ViewAction.CheckAndUpdateProjectedViews:
            if ((viewState & 128 /* Destroyed */) === 0) {
                if (viewState & 32 /* CheckProjectedView */) {
                    checkAndUpdateView(view);
                }
                else if (viewState & 64 /* CheckProjectedViews */) {
                    execProjectedViewsAction(view, action);
                }
            }
            break;
        case ViewAction.Destroy:
            // Note: destroyView recurses over all views,
            // so we don't need to special case projected views here.
            destroyView(view);
            break;
        case ViewAction.CreateViewNodes:
            createViewNodes(view);
            break;
    }
}
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execProjectedViewsAction(view, action) {
    execEmbeddedViewsAction(view, action);
    execComponentViewsAction(view, action);
}
/**
 * @param {?} view
 * @param {?} queryFlags
 * @param {?} staticDynamicQueryFlag
 * @param {?} checkType
 * @return {?}
 */
function execQueriesAction(view, queryFlags, staticDynamicQueryFlag, checkType) {
    if (!(view.def.nodeFlags & queryFlags) || !(view.def.nodeFlags & staticDynamicQueryFlag)) {
        return;
    }
    const /** @type {?} */ nodeCount = view.def.nodes.length;
    for (let /** @type {?} */ i = 0; i < nodeCount; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
        if ((nodeDef.flags & queryFlags) && (nodeDef.flags & staticDynamicQueryFlag)) {
            Services.setCurrentNode(view, nodeDef.nodeIndex);
            switch (checkType) {
                case 0 /* CheckAndUpdate */:
                    checkAndUpdateQuery(view, nodeDef);
                    break;
                case 1 /* CheckNoChanges */:
                    checkNoChangesQuery(view, nodeDef);
                    break;
            }
        }
        if (!(nodeDef.childFlags & queryFlags) || !(nodeDef.childFlags & staticDynamicQueryFlag)) {
            // no child has a matching query
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidmlldy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL3ZpZXcvdmlldy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7OztBQVVBLE9BQU8sRUFBQyw0QkFBNEIsRUFBRSwyQkFBMkIsRUFBRSxhQUFhLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDM0gsT0FBTyxFQUFDLDJDQUEyQyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JFLE9BQU8sRUFBQyxlQUFlLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDN0MsT0FBTyxFQUFDLCtCQUErQixFQUFFLDhCQUE4QixFQUFFLDZCQUE2QixFQUFFLHVCQUF1QixFQUFFLGtCQUFrQixFQUFFLHNCQUFzQixFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQy9MLE9BQU8sRUFBQyxtQ0FBbUMsRUFBRSxrQ0FBa0MsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2hJLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxXQUFXLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDekQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ25FLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSx3QkFBd0IsRUFBRSxVQUFVLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDdkYsT0FBTyxFQUE2RixRQUFRLEVBQW1GLGFBQWEsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGNBQWMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN0USxPQUFPLEVBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFLGVBQWUsRUFBRSxxQ0FBcUMsRUFBRSxpQkFBaUIsRUFBRSxRQUFRLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDeEksT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7OztBQUVsRCxNQUFNLGtCQUNGLEtB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QUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUMvRixFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU87SUFDM0IsdUJBQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDO0lBQ3hDLElBQUksT0FBTyxHQUFHLENBQUM7UUFBRSxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RCxJQUFJLE9BQU8sR0FBRyxDQUFDO1FBQUUscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0QsSUFBSSxPQUFPLEdBQUcsQ0FBQztRQUFFLHFCQUFxQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdELElBQUksT0FBTyxHQUFHLENBQUM7UUFBRSxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RCxJQUFJLE9BQU8sR0FBRyxDQUFDO1FBQUUscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0QsSUFBSSxPQUFPLEdBQUcsQ0FBQztRQUFFLHFCQUFxQixDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBQzdELElBQUksT0FBTyxHQUFHLENBQUM7UUFBRSxxQkFBcUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUM3RCxJQUFJLE9BQU8sR0FBRyxDQUFDO1FBQUUscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDN0QsSUFBSSxPQUFPLEdBQUcsQ0FBQztRQUFFLHFCQUFxQixDQUFDLElBQUksRUFBRSxP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Y2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcblxuaW1wb3J0IHtjaGVja0FuZFVwZGF0ZUVsZW1lbnREeW5hbWljLCBjaGVja0FuZFVwZGF0ZUVsZW1lbnRJbmxpbmUsIGNyZWF0ZUVsZW1lbnQsIGxpc3RlblRvRWxlbWVudE91dHB1dHN9IGZyb20gJy4vZWxlbWVudCc7XG5pbXBvcnQge2V4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJJdEhhc0JlZW5DaGVja2VkRXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7YXBwZW5kTmdDb250ZW50fSBmcm9tICcuL25nX2NvbnRlbnQnO1xuaW1wb3J0IHtjYWxsTGlmZWN5Y2xlSG9va3NDaGlsZHJlbkZpcnN0LCBjaGVja0FuZFVwZGF0ZURpcmVjdGl2ZUR5bmFtaWMsIGNoZWNrQW5kVXBkYXRlRGlyZWN0aXZlSW5saW5lLCBjcmVhdGVEaXJlY3RpdmVJbnN0YW5jZSwgY3JlYXRlUGlwZUluc3RhbmNlLCBjcmVhdGVQcm92aWRlckluc3RhbmNlfSBmcm9tICcuL3Byb3ZpZGVyJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVQdXJlRXhwcmVzc2lvbkR5bmFtaWMsIGNoZWNrQW5kVXBkYXRlUHVyZUV4cHJlc3Npb25JbmxpbmUsIGNyZWF0ZVB1cmVFeHByZXNzaW9ufSBmcm9tICcuL3B1cmVfZXhwcmVzc2lvbic7XG5pbXBvcnQge2NoZWNrQW5kVXBkYXRlUXVlcnksIGNyZWF0ZVF1ZXJ5fSBmcm9tICcuL3F1ZXJ5JztcbmltcG9ydCB7Y3JlYXRlVGVtcGxhdGVEYXRhLCBjcmVhdGVWaWV3Q29udGFpbmVyRGF0YX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7Y2hlY2tBbmRVcGRhdGVUZXh0RHluYW1pYywgY2hlY2tBbmRVcGRhdGVUZXh0SW5saW5lLCBjcmVhdGVUZXh0fSBmcm9tICcuL3RleHQnO1xuaW1wb3J0IHtBcmd1bWVudFR5cGUsIENoZWNrVHlwZSwgRWxlbWVudERhdGEsIE5vZGVEYXRhLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIFByb3ZpZGVyRGF0YSwgUm9vdERhdGEsIFNlcnZpY2VzLCBWaWV3RGF0YSwgVmlld0RlZmluaXRpb24sIFZpZXdGbGFncywgVmlld0hhbmRsZUV2ZW50Rm4sIFZpZXdTdGF0ZSwgVmlld1VwZGF0ZUZuLCBhc0VsZW1lbnREYXRhLCBhc1F1ZXJ5TGlzdCwgYXNUZXh0RGF0YSwgc2hpZnRJbml0U3RhdGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtOT09QLCBjaGVja0JpbmRpbmdOb0NoYW5nZXMsIGlzQ29tcG9uZW50VmlldywgbWFya1BhcmVudFZpZXdzRm9yQ2hlY2tQcm9qZWN0ZWRWaWV3cywgcmVzb2x2ZURlZmluaXRpb24sIHRva2VuS2V5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtkZXRhY2hQcm9qZWN0ZWRWaWV3fSBmcm9tICcuL3ZpZXdfYXR0YWNoJztcblxuZXhwb3J0IGZ1bmN0aW9uIHZpZXdEZWYoXG4gICAgZmxhZ3M6IFZpZXdGbGFncywgbm9kZXM6IE5vZGVEZWZbXSwgdXBkYXRlRGlyZWN0aXZlcz86IG51bGwgfCBWaWV3VXBkYXRlRm4sXG4gICAgdXBkYXRlUmVuZGVyZXI/OiBudWxsIHwgVmlld1VwZGF0ZUZuKTogVmlld0RlZmluaXRpb24ge1xuICAvLyBjbG9uZSBub2RlcyBhbmQgc2V0IGF1dG8gY2FsY3VsYXRlZCB2YWx1ZXNcbiAgbGV0IHZpZXdCaW5kaW5nQ291bnQgPSAwO1xuICBsZXQgdmlld0Rpc3Bvc2FibGVDb3VudCA9IDA7XG4gIGxldCB2aWV3Tm9kZUZsYWdzID0gMDtcbiAgbGV0IHZpZXdSb290Tm9kZUZsYWdzID0gMDtcbiAgbGV0IHZpZXdNYXRjaGVkUXVlcmllcyA9IDA7XG4gIGxldCBjdXJyZW50UGFyZW50OiBOb2RlRGVmfG51bGwgPSBudWxsO1xuICBsZXQgY3VycmVudFJlbmRlclBhcmVudDogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgbGV0IGN1cnJlbnRFbGVtZW50SGFzUHVibGljUHJvdmlkZXJzID0gZmFsc2U7XG4gIGxldCBjdXJyZW50RWxlbWVudEhhc1ByaXZhdGVQcm92aWRlcnMgPSBmYWxzZTtcbiAgbGV0IGxhc3RSZW5kZXJSb290Tm9kZTogTm9kZURlZnxudWxsID0gbnVsbDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICBub2RlLm5vZGVJbmRleCA9IGk7XG4gICAgbm9kZS5wYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgIG5vZGUuYmluZGluZ0luZGV4ID0gdmlld0JpbmRpbmdDb3VudDtcbiAgICBub2RlLm91dHB1dEluZGV4ID0gdmlld0Rpc3Bvc2FibGVDb3VudDtcbiAgICBub2RlLnJlbmRlclBhcmVudCA9IGN1cnJlbnRSZW5kZXJQYXJlbnQ7XG5cbiAgICB2aWV3Tm9kZUZsYWdzIHw9IG5vZGUuZmxhZ3M7XG4gICAgdmlld01hdGNoZWRRdWVyaWVzIHw9IG5vZGUubWF0Y2hlZFF1ZXJ5SWRzO1xuXG4gICAgaWYgKG5vZGUuZWxlbWVudCkge1xuICAgICAgY29uc3QgZWxEZWYgPSBub2RlLmVsZW1lbnQ7XG4gICAgICBlbERlZi5wdWJsaWNQcm92aWRlcnMgPVxuICAgICAgICAgIGN1cnJlbnRQYXJlbnQgPyBjdXJyZW50UGFyZW50LmVsZW1lbnQgIS5wdWJsaWNQcm92aWRlcnMgOiBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgZWxEZWYuYWxsUHJvdmlkZXJzID0gZWxEZWYucHVibGljUHJvdmlkZXJzO1xuICAgICAgLy8gTm90ZTogV2UgYXNzdW1lIHRoYXQgYWxsIHByb3ZpZGVycyBvZiBhbiBlbGVtZW50IGFyZSBiZWZvcmUgYW55IGNoaWxkIGVsZW1lbnQhXG4gICAgICBjdXJyZW50RWxlbWVudEhhc1B1YmxpY1Byb3ZpZGVycyA9IGZhbHNlO1xuICAgICAgY3VycmVudEVsZW1lbnRIYXNQcml2YXRlUHJvdmlkZXJzID0gZmFsc2U7XG5cbiAgICAgIGlmIChub2RlLmVsZW1lbnQudGVtcGxhdGUpIHtcbiAgICAgICAgdmlld01hdGNoZWRRdWVyaWVzIHw9IG5vZGUuZWxlbWVudC50ZW1wbGF0ZS5ub2RlTWF0Y2hlZFF1ZXJpZXM7XG4gICAgICB9XG4gICAgfVxuICAgIHZhbGlkYXRlTm9kZShjdXJyZW50UGFyZW50LCBub2RlLCBub2Rlcy5sZW5ndGgpO1xuXG5cbiAgICB2aWV3QmluZGluZ0NvdW50ICs9IG5vZGUuYmluZGluZ3MubGVuZ3RoO1xuICAgIHZpZXdEaXNwb3NhYmxlQ291bnQgKz0gbm9kZS5vdXRwdXRzLmxlbmd0aDtcblxuICAgIGlmICghY3VycmVudFJlbmRlclBhcmVudCAmJiAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRSZW5kZXJOb2RlKSkge1xuICAgICAgbGFzdFJlbmRlclJvb3ROb2RlID0gbm9kZTtcbiAgICB9XG5cbiAgICBpZiAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5DYXRQcm92aWRlcikge1xuICAgICAgaWYgKCFjdXJyZW50RWxlbWVudEhhc1B1YmxpY1Byb3ZpZGVycykge1xuICAgICAgICBjdXJyZW50RWxlbWVudEhhc1B1YmxpY1Byb3ZpZGVycyA9IHRydWU7XG4gICAgICAgIC8vIFVzZSBwcm90b3R5cGljYWwgaW5oZXJpdGFuY2UgdG8gbm90IGdldCBPKG5eMikgY29tcGxleGl0eS4uLlxuICAgICAgICBjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLnB1YmxpY1Byb3ZpZGVycyA9XG4gICAgICAgICAgICBPYmplY3QuY3JlYXRlKGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzKTtcbiAgICAgICAgY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5hbGxQcm92aWRlcnMgPSBjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLnB1YmxpY1Byb3ZpZGVycztcbiAgICAgIH1cbiAgICAgIGNvbnN0IGlzUHJpdmF0ZVNlcnZpY2UgPSAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5Qcml2YXRlUHJvdmlkZXIpICE9PSAwO1xuICAgICAgY29uc3QgaXNDb21wb25lbnQgPSAobm9kZS5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnQpICE9PSAwO1xuICAgICAgaWYgKCFpc1ByaXZhdGVTZXJ2aWNlIHx8IGlzQ29tcG9uZW50KSB7XG4gICAgICAgIGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzICFbdG9rZW5LZXkobm9kZS5wcm92aWRlciAhLnRva2VuKV0gPSBub2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKCFjdXJyZW50RWxlbWVudEhhc1ByaXZhdGVQcm92aWRlcnMpIHtcbiAgICAgICAgICBjdXJyZW50RWxlbWVudEhhc1ByaXZhdGVQcm92aWRlcnMgPSB0cnVlO1xuICAgICAgICAgIC8vIFVzZSBwcm90b3R5cGljYWwgaW5oZXJpdGFuY2UgdG8gbm90IGdldCBPKG5eMikgY29tcGxleGl0eS4uLlxuICAgICAgICAgIGN1cnJlbnRQYXJlbnQgIS5lbGVtZW50ICEuYWxsUHJvdmlkZXJzID1cbiAgICAgICAgICAgICAgT2JqZWN0LmNyZWF0ZShjdXJyZW50UGFyZW50ICEuZWxlbWVudCAhLnB1YmxpY1Byb3ZpZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5hbGxQcm92aWRlcnMgIVt0b2tlbktleShub2RlLnByb3ZpZGVyICEudG9rZW4pXSA9IG5vZGU7XG4gICAgICB9XG4gICAgICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICAgICAgY3VycmVudFBhcmVudCAhLmVsZW1lbnQgIS5jb21wb25lbnRQcm92aWRlciA9IG5vZGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGN1cnJlbnRQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRQYXJlbnQuY2hpbGRGbGFncyB8PSBub2RlLmZsYWdzO1xuICAgICAgY3VycmVudFBhcmVudC5kaXJlY3RDaGlsZEZsYWdzIHw9IG5vZGUuZmxhZ3M7XG4gICAgICBjdXJyZW50UGFyZW50LmNoaWxkTWF0Y2hlZFF1ZXJpZXMgfD0gbm9kZS5tYXRjaGVkUXVlcnlJZHM7XG4gICAgICBpZiAobm9kZS5lbGVtZW50ICYmIG5vZGUuZWxlbWVudC50ZW1wbGF0ZSkge1xuICAgICAgICBjdXJyZW50UGFyZW50LmNoaWxkTWF0Y2hlZFF1ZXJpZXMgfD0gbm9kZS5lbGVtZW50LnRlbXBsYXRlLm5vZGVNYXRjaGVkUXVlcmllcztcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdmlld1Jvb3ROb2RlRmxhZ3MgfD0gbm9kZS5mbGFncztcbiAgICB9XG5cbiAgICBpZiAobm9kZS5jaGlsZENvdW50ID4gMCkge1xuICAgICAgY3VycmVudFBhcmVudCA9IG5vZGU7XG5cbiAgICAgIGlmICghaXNOZ0NvbnRhaW5lcihub2RlKSkge1xuICAgICAgICBjdXJyZW50UmVuZGVyUGFyZW50ID0gbm9kZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gV2hlbiB0aGUgY3VycmVudCBub2RlIGhhcyBubyBjaGlsZHJlbiwgY2hlY2sgaWYgaXQgaXMgdGhlIGxhc3QgY2hpbGRyZW4gb2YgaXRzIHBhcmVudC5cbiAgICAgIC8vIFdoZW4gaXQgaXMsIHByb3BhZ2F0ZSB0aGUgZmxhZ3MgdXAuXG4gICAgICAvLyBUaGUgbG9vcCBpcyByZXF1aXJlZCBiZWNhdXNlIGFuIGVsZW1lbnQgY291bGQgYmUgdGhlIGxhc3QgdHJhbnNpdGl2ZSBjaGlsZHJlbiBvZiBzZXZlcmFsXG4gICAgICAvLyBlbGVtZW50cy4gV2UgbG9vcCB0byBlaXRoZXIgdGhlIHJvb3Qgb3IgdGhlIGhpZ2hlc3Qgb3BlbmVkIGVsZW1lbnQgKD0gd2l0aCByZW1haW5pbmdcbiAgICAgIC8vIGNoaWxkcmVuKVxuICAgICAgd2hpbGUgKGN1cnJlbnRQYXJlbnQgJiYgaSA9PT0gY3VycmVudFBhcmVudC5ub2RlSW5kZXggKyBjdXJyZW50UGFyZW50LmNoaWxkQ291bnQpIHtcbiAgICAgICAgY29uc3QgbmV3UGFyZW50OiBOb2RlRGVmfG51bGwgPSBjdXJyZW50UGFyZW50LnBhcmVudDtcbiAgICAgICAgaWYgKG5ld1BhcmVudCkge1xuICAgICAgICAgIG5ld1BhcmVudC5jaGlsZEZsYWdzIHw9IGN1cnJlbnRQYXJlbnQuY2hpbGRGbGFncztcbiAgICAgICAgICBuZXdQYXJlbnQuY2hpbGRNYXRjaGVkUXVlcmllcyB8PSBjdXJyZW50UGFyZW50LmNoaWxkTWF0Y2hlZFF1ZXJpZXM7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudFBhcmVudCA9IG5ld1BhcmVudDtcbiAgICAgICAgLy8gV2UgYWxzbyBuZWVkIHRvIHVwZGF0ZSB0aGUgcmVuZGVyIHBhcmVudCAmIGFjY291bnQgZm9yIG5nLWNvbnRhaW5lclxuICAgICAgICBpZiAoY3VycmVudFBhcmVudCAmJiBpc05nQ29udGFpbmVyKGN1cnJlbnRQYXJlbnQpKSB7XG4gICAgICAgICAgY3VycmVudFJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQucmVuZGVyUGFyZW50O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRSZW5kZXJQYXJlbnQgPSBjdXJyZW50UGFyZW50O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgaGFuZGxlRXZlbnQ6IFZpZXdIYW5kbGVFdmVudEZuID0gKHZpZXcsIG5vZGVJbmRleCwgZXZlbnROYW1lLCBldmVudCkgPT5cbiAgICAgIG5vZGVzW25vZGVJbmRleF0uZWxlbWVudCAhLmhhbmRsZUV2ZW50ICEodmlldywgZXZlbnROYW1lLCBldmVudCk7XG5cbiAgcmV0dXJuIHtcbiAgICAvLyBXaWxsIGJlIGZpbGxlZCBsYXRlci4uLlxuICAgIGZhY3Rvcnk6IG51bGwsXG4gICAgbm9kZUZsYWdzOiB2aWV3Tm9kZUZsYWdzLFxuICAgIHJvb3ROb2RlRmxhZ3M6IHZpZXdSb290Tm9kZUZsYWdzLFxuICAgIG5vZGVNYXRjaGVkUXVlcmllczogdmlld01hdGNoZWRRdWVyaWVzLCBmbGFncyxcbiAgICBub2Rlczogbm9kZXMsXG4gICAgdXBkYXRlRGlyZWN0aXZlczogdXBkYXRlRGlyZWN0aXZlcyB8fCBOT09QLFxuICAgIHVwZGF0ZVJlbmRlcmVyOiB1cGRhdGVSZW5kZXJlciB8fCBOT09QLCBoYW5kbGVFdmVudCxcbiAgICBiaW5kaW5nQ291bnQ6IHZpZXdCaW5kaW5nQ291bnQsXG4gICAgb3V0cHV0Q291bnQ6IHZpZXdEaXNwb3NhYmxlQ291bnQsIGxhc3RSZW5kZXJSb290Tm9kZVxuICB9O1xufVxuXG5mdW5jdGlvbiBpc05nQ29udGFpbmVyKG5vZGU6IE5vZGVEZWYpOiBib29sZWFuIHtcbiAgcmV0dXJuIChub2RlLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSAhPT0gMCAmJiBub2RlLmVsZW1lbnQgIS5uYW1lID09PSBudWxsO1xufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZU5vZGUocGFyZW50OiBOb2RlRGVmIHwgbnVsbCwgbm9kZTogTm9kZURlZiwgbm9kZUNvdW50OiBudW1iZXIpIHtcbiAgY29uc3QgdGVtcGxhdGUgPSBub2RlLmVsZW1lbnQgJiYgbm9kZS5lbGVtZW50LnRlbXBsYXRlO1xuICBpZiAodGVtcGxhdGUpIHtcbiAgICBpZiAoIXRlbXBsYXRlLmxhc3RSZW5kZXJSb290Tm9kZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbGxlZ2FsIFN0YXRlOiBFbWJlZGRlZCB0ZW1wbGF0ZXMgd2l0aG91dCBub2RlcyBhcmUgbm90IGFsbG93ZWQhYCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZS5sYXN0UmVuZGVyUm9vdE5vZGUgJiZcbiAgICAgICAgdGVtcGxhdGUubGFzdFJlbmRlclJvb3ROb2RlLmZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSWxsZWdhbCBTdGF0ZTogTGFzdCByb290IG5vZGUgb2YgYSB0ZW1wbGF0ZSBjYW4ndCBoYXZlIGVtYmVkZGVkIHZpZXdzLCBhdCBpbmRleCAke25vZGUubm9kZUluZGV4fSFgKTtcbiAgICB9XG4gIH1cbiAgaWYgKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuQ2F0UHJvdmlkZXIpIHtcbiAgICBjb25zdCBwYXJlbnRGbGFncyA9IHBhcmVudCA/IHBhcmVudC5mbGFncyA6IDA7XG4gICAgaWYgKChwYXJlbnRGbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgPT09IDApIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgSWxsZWdhbCBTdGF0ZTogU3RhdGljUHJvdmlkZXIvRGlyZWN0aXZlIG5vZGVzIG5lZWQgdG8gYmUgY2hpbGRyZW4gb2YgZWxlbWVudHMgb3IgYW5jaG9ycywgYXQgaW5kZXggJHtub2RlLm5vZGVJbmRleH0hYCk7XG4gICAgfVxuICB9XG4gIGlmIChub2RlLnF1ZXJ5KSB7XG4gICAgaWYgKG5vZGUuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUNvbnRlbnRRdWVyeSAmJlxuICAgICAgICAoIXBhcmVudCB8fCAocGFyZW50LmZsYWdzICYgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmUpID09PSAwKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBJbGxlZ2FsIFN0YXRlOiBDb250ZW50IFF1ZXJ5IG5vZGVzIG5lZWQgdG8gYmUgY2hpbGRyZW4gb2YgZGlyZWN0aXZlcywgYXQgaW5kZXggJHtub2RlLm5vZGVJbmRleH0hYCk7XG4gICAgfVxuICAgIGlmIChub2RlLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVWaWV3UXVlcnkgJiYgcGFyZW50KSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYElsbGVnYWwgU3RhdGU6IFZpZXcgUXVlcnkgbm9kZXMgaGF2ZSB0byBiZSB0b3AgbGV2ZWwgbm9kZXMsIGF0IGluZGV4ICR7bm9kZS5ub2RlSW5kZXh9IWApO1xuICAgIH1cbiAgfVxuICBpZiAobm9kZS5jaGlsZENvdW50KSB7XG4gICAgY29uc3QgcGFyZW50RW5kID0gcGFyZW50ID8gcGFyZW50Lm5vZGVJbmRleCArIHBhcmVudC5jaGlsZENvdW50IDogbm9kZUNvdW50IC0gMTtcbiAgICBpZiAobm9kZS5ub2RlSW5kZXggPD0gcGFyZW50RW5kICYmIG5vZGUubm9kZUluZGV4ICsgbm9kZS5jaGlsZENvdW50ID4gcGFyZW50RW5kKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYElsbGVnYWwgU3RhdGU6IGNoaWxkQ291bnQgb2Ygbm9kZSBsZWFkcyBvdXRzaWRlIG9mIHBhcmVudCwgYXQgaW5kZXggJHtub2RlLm5vZGVJbmRleH0hYCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgcGFyZW50OiBWaWV3RGF0YSwgYW5jaG9yRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgLy8gZW1iZWRkZWQgdmlld3MgYXJlIHNlZW4gYXMgc2libGluZ3MgdG8gdGhlIGFuY2hvciwgc28gd2UgbmVlZFxuICAvLyB0byBnZXQgdGhlIHBhcmVudCBvZiB0aGUgYW5jaG9yIGFuZCB1c2UgaXQgYXMgcGFyZW50SW5kZXguXG4gIGNvbnN0IHZpZXcgPSBjcmVhdGVWaWV3KHBhcmVudC5yb290LCBwYXJlbnQucmVuZGVyZXIsIHBhcmVudCwgYW5jaG9yRGVmLCB2aWV3RGVmKTtcbiAgaW5pdFZpZXcodmlldywgcGFyZW50LmNvbXBvbmVudCwgY29udGV4dCk7XG4gIGNyZWF0ZVZpZXdOb2Rlcyh2aWV3KTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVSb290Vmlldyhyb290OiBSb290RGF0YSwgZGVmOiBWaWV3RGVmaW5pdGlvbiwgY29udGV4dD86IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgdmlldyA9IGNyZWF0ZVZpZXcocm9vdCwgcm9vdC5yZW5kZXJlciwgbnVsbCwgbnVsbCwgZGVmKTtcbiAgaW5pdFZpZXcodmlldywgY29udGV4dCwgY29udGV4dCk7XG4gIGNyZWF0ZVZpZXdOb2Rlcyh2aWV3KTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21wb25lbnRWaWV3KFxuICAgIHBhcmVudFZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCB2aWV3RGVmOiBWaWV3RGVmaW5pdGlvbiwgaG9zdEVsZW1lbnQ6IGFueSk6IFZpZXdEYXRhIHtcbiAgY29uc3QgcmVuZGVyZXJUeXBlID0gbm9kZURlZi5lbGVtZW50ICEuY29tcG9uZW50UmVuZGVyZXJUeXBlO1xuICBsZXQgY29tcFJlbmRlcmVyOiBSZW5kZXJlcjI7XG4gIGlmICghcmVuZGVyZXJUeXBlKSB7XG4gICAgY29tcFJlbmRlcmVyID0gcGFyZW50Vmlldy5yb290LnJlbmRlcmVyO1xuICB9IGVsc2Uge1xuICAgIGNvbXBSZW5kZXJlciA9IHBhcmVudFZpZXcucm9vdC5yZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoaG9zdEVsZW1lbnQsIHJlbmRlcmVyVHlwZSk7XG4gIH1cbiAgcmV0dXJuIGNyZWF0ZVZpZXcoXG4gICAgICBwYXJlbnRWaWV3LnJvb3QsIGNvbXBSZW5kZXJlciwgcGFyZW50Vmlldywgbm9kZURlZi5lbGVtZW50ICEuY29tcG9uZW50UHJvdmlkZXIsIHZpZXdEZWYpO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3KFxuICAgIHJvb3Q6IFJvb3REYXRhLCByZW5kZXJlcjogUmVuZGVyZXIyLCBwYXJlbnQ6IFZpZXdEYXRhIHwgbnVsbCwgcGFyZW50Tm9kZURlZjogTm9kZURlZiB8IG51bGwsXG4gICAgZGVmOiBWaWV3RGVmaW5pdGlvbik6IFZpZXdEYXRhIHtcbiAgY29uc3Qgbm9kZXM6IE5vZGVEYXRhW10gPSBuZXcgQXJyYXkoZGVmLm5vZGVzLmxlbmd0aCk7XG4gIGNvbnN0IGRpc3Bvc2FibGVzID0gZGVmLm91dHB1dENvdW50ID8gbmV3IEFycmF5KGRlZi5vdXRwdXRDb3VudCkgOiBudWxsO1xuICBjb25zdCB2aWV3OiBWaWV3RGF0YSA9IHtcbiAgICBkZWYsXG4gICAgcGFyZW50LFxuICAgIHZpZXdDb250YWluZXJQYXJlbnQ6IG51bGwsIHBhcmVudE5vZGVEZWYsXG4gICAgY29udGV4dDogbnVsbCxcbiAgICBjb21wb25lbnQ6IG51bGwsIG5vZGVzLFxuICAgIHN0YXRlOiBWaWV3U3RhdGUuQ2F0SW5pdCwgcm9vdCwgcmVuZGVyZXIsXG4gICAgb2xkVmFsdWVzOiBuZXcgQXJyYXkoZGVmLmJpbmRpbmdDb3VudCksIGRpc3Bvc2FibGVzLFxuICAgIGluaXRJbmRleDogLTFcbiAgfTtcbiAgcmV0dXJuIHZpZXc7XG59XG5cbmZ1bmN0aW9uIGluaXRWaWV3KHZpZXc6IFZpZXdEYXRhLCBjb21wb25lbnQ6IGFueSwgY29udGV4dDogYW55KSB7XG4gIHZpZXcuY29tcG9uZW50ID0gY29tcG9uZW50O1xuICB2aWV3LmNvbnRleHQgPSBjb250ZXh0O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Tm9kZXModmlldzogVmlld0RhdGEpIHtcbiAgbGV0IHJlbmRlckhvc3Q6IGFueTtcbiAgaWYgKGlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIGNvbnN0IGhvc3REZWYgPSB2aWV3LnBhcmVudE5vZGVEZWY7XG4gICAgcmVuZGVySG9zdCA9IGFzRWxlbWVudERhdGEodmlldy5wYXJlbnQgISwgaG9zdERlZiAhLnBhcmVudCAhLm5vZGVJbmRleCkucmVuZGVyRWxlbWVudDtcbiAgfVxuICBjb25zdCBkZWYgPSB2aWV3LmRlZjtcbiAgY29uc3Qgbm9kZXMgPSB2aWV3Lm5vZGVzO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSBkZWYubm9kZXNbaV07XG4gICAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUodmlldywgaSk7XG4gICAgbGV0IG5vZGVEYXRhOiBhbnk7XG4gICAgc3dpdGNoIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlRWxlbWVudDpcbiAgICAgICAgY29uc3QgZWwgPSBjcmVhdGVFbGVtZW50KHZpZXcsIHJlbmRlckhvc3QsIG5vZGVEZWYpIGFzIGFueTtcbiAgICAgICAgbGV0IGNvbXBvbmVudFZpZXc6IFZpZXdEYXRhID0gdW5kZWZpbmVkICE7XG4gICAgICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcpIHtcbiAgICAgICAgICBjb25zdCBjb21wVmlld0RlZiA9IHJlc29sdmVEZWZpbml0aW9uKG5vZGVEZWYuZWxlbWVudCAhLmNvbXBvbmVudFZpZXcgISk7XG4gICAgICAgICAgY29tcG9uZW50VmlldyA9IFNlcnZpY2VzLmNyZWF0ZUNvbXBvbmVudFZpZXcodmlldywgbm9kZURlZiwgY29tcFZpZXdEZWYsIGVsKTtcbiAgICAgICAgfVxuICAgICAgICBsaXN0ZW5Ub0VsZW1lbnRPdXRwdXRzKHZpZXcsIGNvbXBvbmVudFZpZXcsIG5vZGVEZWYsIGVsKTtcbiAgICAgICAgbm9kZURhdGEgPSA8RWxlbWVudERhdGE+e1xuICAgICAgICAgIHJlbmRlckVsZW1lbnQ6IGVsLFxuICAgICAgICAgIGNvbXBvbmVudFZpZXcsXG4gICAgICAgICAgdmlld0NvbnRhaW5lcjogbnVsbCxcbiAgICAgICAgICB0ZW1wbGF0ZTogbm9kZURlZi5lbGVtZW50ICEudGVtcGxhdGUgPyBjcmVhdGVUZW1wbGF0ZURhdGEodmlldywgbm9kZURlZikgOiB1bmRlZmluZWRcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuRW1iZWRkZWRWaWV3cykge1xuICAgICAgICAgIG5vZGVEYXRhLnZpZXdDb250YWluZXIgPSBjcmVhdGVWaWV3Q29udGFpbmVyRGF0YSh2aWV3LCBub2RlRGVmLCBub2RlRGF0YSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlVGV4dDpcbiAgICAgICAgbm9kZURhdGEgPSBjcmVhdGVUZXh0KHZpZXcsIHJlbmRlckhvc3QsIG5vZGVEZWYpIGFzIGFueTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlQ2xhc3NQcm92aWRlcjpcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVGYWN0b3J5UHJvdmlkZXI6XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlVXNlRXhpc3RpbmdQcm92aWRlcjpcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVWYWx1ZVByb3ZpZGVyOiB7XG4gICAgICAgIG5vZGVEYXRhID0gbm9kZXNbaV07XG4gICAgICAgIGlmICghbm9kZURhdGEgJiYgIShub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLkxhenlQcm92aWRlcikpIHtcbiAgICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGNyZWF0ZVByb3ZpZGVySW5zdGFuY2Uodmlldywgbm9kZURlZik7XG4gICAgICAgICAgbm9kZURhdGEgPSA8UHJvdmlkZXJEYXRhPntpbnN0YW5jZX07XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUGlwZToge1xuICAgICAgICBjb25zdCBpbnN0YW5jZSA9IGNyZWF0ZVBpcGVJbnN0YW5jZSh2aWV3LCBub2RlRGVmKTtcbiAgICAgICAgbm9kZURhdGEgPSA8UHJvdmlkZXJEYXRhPntpbnN0YW5jZX07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZToge1xuICAgICAgICBub2RlRGF0YSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAoIW5vZGVEYXRhKSB7XG4gICAgICAgICAgY29uc3QgaW5zdGFuY2UgPSBjcmVhdGVEaXJlY3RpdmVJbnN0YW5jZSh2aWV3LCBub2RlRGVmKTtcbiAgICAgICAgICBub2RlRGF0YSA9IDxQcm92aWRlckRhdGE+e2luc3RhbmNlfTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnQpIHtcbiAgICAgICAgICBjb25zdCBjb21wVmlldyA9IGFzRWxlbWVudERhdGEodmlldywgbm9kZURlZi5wYXJlbnQgIS5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gICAgICAgICAgaW5pdFZpZXcoY29tcFZpZXcsIG5vZGVEYXRhLmluc3RhbmNlLCBub2RlRGF0YS5pbnN0YW5jZSk7XG4gICAgICAgIH1cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZUFycmF5OlxuICAgICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3Q6XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlUHVyZVBpcGU6XG4gICAgICAgIG5vZGVEYXRhID0gY3JlYXRlUHVyZUV4cHJlc3Npb24odmlldywgbm9kZURlZikgYXMgYW55O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVDb250ZW50UXVlcnk6XG4gICAgICBjYXNlIE5vZGVGbGFncy5UeXBlVmlld1F1ZXJ5OlxuICAgICAgICBub2RlRGF0YSA9IGNyZWF0ZVF1ZXJ5KCkgYXMgYW55O1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVOZ0NvbnRlbnQ6XG4gICAgICAgIGFwcGVuZE5nQ29udGVudCh2aWV3LCByZW5kZXJIb3N0LCBub2RlRGVmKTtcbiAgICAgICAgLy8gbm8gcnVudGltZSBkYXRhIG5lZWRlZCBmb3IgTmdDb250ZW50Li4uXG4gICAgICAgIG5vZGVEYXRhID0gdW5kZWZpbmVkO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gICAgbm9kZXNbaV0gPSBub2RlRGF0YTtcbiAgfVxuICAvLyBDcmVhdGUgdGhlIFZpZXdEYXRhLm5vZGVzIG9mIGNvbXBvbmVudCB2aWV3cyBhZnRlciB3ZSBjcmVhdGVkIGV2ZXJ5dGhpbmcgZWxzZSxcbiAgLy8gc28gdGhhdCBlLmcuIG5nLWNvbnRlbnQgd29ya3NcbiAgZXhlY0NvbXBvbmVudFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ3JlYXRlVmlld05vZGVzKTtcblxuICAvLyBmaWxsIHN0YXRpYyBjb250ZW50IGFuZCB2aWV3IHF1ZXJpZXNcbiAgZXhlY1F1ZXJpZXNBY3Rpb24oXG4gICAgICB2aWV3LCBOb2RlRmxhZ3MuVHlwZUNvbnRlbnRRdWVyeSB8IE5vZGVGbGFncy5UeXBlVmlld1F1ZXJ5LCBOb2RlRmxhZ3MuU3RhdGljUXVlcnksXG4gICAgICBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNWaWV3KHZpZXc6IFZpZXdEYXRhKSB7XG4gIG1hcmtQcm9qZWN0ZWRWaWV3c0ZvckNoZWNrKHZpZXcpO1xuICBTZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzKHZpZXcsIENoZWNrVHlwZS5DaGVja05vQ2hhbmdlcyk7XG4gIGV4ZWNFbWJlZGRlZFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ2hlY2tOb0NoYW5nZXMpO1xuICBTZXJ2aWNlcy51cGRhdGVSZW5kZXJlcih2aWV3LCBDaGVja1R5cGUuQ2hlY2tOb0NoYW5nZXMpO1xuICBleGVjQ29tcG9uZW50Vmlld3NBY3Rpb24odmlldywgVmlld0FjdGlvbi5DaGVja05vQ2hhbmdlcyk7XG4gIC8vIE5vdGU6IFdlIGRvbid0IGNoZWNrIHF1ZXJpZXMgZm9yIGNoYW5nZXMgYXMgd2UgZGlkbid0IGRvIHRoaXMgaW4gdjIueC5cbiAgLy8gVE9ETyh0Ym9zY2gpOiBpbnZlc3RpZ2F0ZSBpZiB3ZSBjYW4gZW5hYmxlIHRoZSBjaGVjayBhZ2FpbiBpbiB2NS54IHdpdGggYSBuaWNlciBlcnJvciBtZXNzYWdlLlxuICB2aWV3LnN0YXRlICY9IH4oVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlld3MgfCBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlVmlldyh2aWV3OiBWaWV3RGF0YSkge1xuICBpZiAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5CZWZvcmVGaXJzdENoZWNrKSB7XG4gICAgdmlldy5zdGF0ZSAmPSB+Vmlld1N0YXRlLkJlZm9yZUZpcnN0Q2hlY2s7XG4gICAgdmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuRmlyc3RDaGVjaztcbiAgfSBlbHNlIHtcbiAgICB2aWV3LnN0YXRlICY9IH5WaWV3U3RhdGUuRmlyc3RDaGVjaztcbiAgfVxuICBzaGlmdEluaXRTdGF0ZSh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0JlZm9yZUluaXQsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ09uSW5pdCk7XG4gIG1hcmtQcm9qZWN0ZWRWaWV3c0ZvckNoZWNrKHZpZXcpO1xuICBTZXJ2aWNlcy51cGRhdGVEaXJlY3RpdmVzKHZpZXcsIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSk7XG4gIGV4ZWNFbWJlZGRlZFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ2hlY2tBbmRVcGRhdGUpO1xuICBleGVjUXVlcmllc0FjdGlvbihcbiAgICAgIHZpZXcsIE5vZGVGbGFncy5UeXBlQ29udGVudFF1ZXJ5LCBOb2RlRmxhZ3MuRHluYW1pY1F1ZXJ5LCBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpO1xuICBsZXQgY2FsbEluaXQgPSBzaGlmdEluaXRTdGF0ZShcbiAgICAgIHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ09uSW5pdCwgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJDb250ZW50SW5pdCk7XG4gIGNhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QoXG4gICAgICB2aWV3LCBOb2RlRmxhZ3MuQWZ0ZXJDb250ZW50Q2hlY2tlZCB8IChjYWxsSW5pdCA/IE5vZGVGbGFncy5BZnRlckNvbnRlbnRJbml0IDogMCkpO1xuXG4gIFNlcnZpY2VzLnVwZGF0ZVJlbmRlcmVyKHZpZXcsIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZSk7XG5cbiAgZXhlY0NvbXBvbmVudFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ2hlY2tBbmRVcGRhdGUpO1xuICBleGVjUXVlcmllc0FjdGlvbihcbiAgICAgIHZpZXcsIE5vZGVGbGFncy5UeXBlVmlld1F1ZXJ5LCBOb2RlRmxhZ3MuRHluYW1pY1F1ZXJ5LCBDaGVja1R5cGUuQ2hlY2tBbmRVcGRhdGUpO1xuICBjYWxsSW5pdCA9IHNoaWZ0SW5pdFN0YXRlKFxuICAgICAgdmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJDb250ZW50SW5pdCwgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJWaWV3SW5pdCk7XG4gIGNhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QoXG4gICAgICB2aWV3LCBOb2RlRmxhZ3MuQWZ0ZXJWaWV3Q2hlY2tlZCB8IChjYWxsSW5pdCA/IE5vZGVGbGFncy5BZnRlclZpZXdJbml0IDogMCkpO1xuXG4gIGlmICh2aWV3LmRlZi5mbGFncyAmIFZpZXdGbGFncy5PblB1c2gpIHtcbiAgICB2aWV3LnN0YXRlICY9IH5WaWV3U3RhdGUuQ2hlY2tzRW5hYmxlZDtcbiAgfVxuICB2aWV3LnN0YXRlICY9IH4oVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlld3MgfCBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3KTtcbiAgc2hpZnRJbml0U3RhdGUodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJWaWV3SW5pdCwgVmlld1N0YXRlLkluaXRTdGF0ZV9BZnRlckluaXQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVOb2RlKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBub2RlRGVmOiBOb2RlRGVmLCBhcmdTdHlsZTogQXJndW1lbnRUeXBlLCB2MD86IGFueSwgdjE/OiBhbnksIHYyPzogYW55LFxuICAgIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksIHY2PzogYW55LCB2Nz86IGFueSwgdjg/OiBhbnksIHY5PzogYW55KTogYm9vbGVhbiB7XG4gIGlmIChhcmdTdHlsZSA9PT0gQXJndW1lbnRUeXBlLklubGluZSkge1xuICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZU5vZGVJbmxpbmUodmlldywgbm9kZURlZiwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZU5vZGVEeW5hbWljKHZpZXcsIG5vZGVEZWYsIHYwKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXJrUHJvamVjdGVkVmlld3NGb3JDaGVjayh2aWV3OiBWaWV3RGF0YSkge1xuICBjb25zdCBkZWYgPSB2aWV3LmRlZjtcbiAgaWYgKCEoZGVmLm5vZGVGbGFncyAmIE5vZGVGbGFncy5Qcm9qZWN0ZWRUZW1wbGF0ZSkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYubm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gZGVmLm5vZGVzW2ldO1xuICAgIGlmIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlByb2plY3RlZFRlbXBsYXRlKSB7XG4gICAgICBjb25zdCBwcm9qZWN0ZWRWaWV3cyA9IGFzRWxlbWVudERhdGEodmlldywgaSkudGVtcGxhdGUuX3Byb2plY3RlZFZpZXdzO1xuICAgICAgaWYgKHByb2plY3RlZFZpZXdzKSB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvamVjdGVkVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBwcm9qZWN0ZWRWaWV3ID0gcHJvamVjdGVkVmlld3NbaV07XG4gICAgICAgICAgcHJvamVjdGVkVmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3O1xuICAgICAgICAgIG1hcmtQYXJlbnRWaWV3c0ZvckNoZWNrUHJvamVjdGVkVmlld3MocHJvamVjdGVkVmlldywgdmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKChub2RlRGVmLmNoaWxkRmxhZ3MgJiBOb2RlRmxhZ3MuUHJvamVjdGVkVGVtcGxhdGUpID09PSAwKSB7XG4gICAgICAvLyBhIHBhcmVudCB3aXRoIGxlYWZzXG4gICAgICAvLyBubyBjaGlsZCBpcyBhIGNvbXBvbmVudCxcbiAgICAgIC8vIHRoZW4gc2tpcCB0aGUgY2hpbGRyZW5cbiAgICAgIGkgKz0gbm9kZURlZi5jaGlsZENvdW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBjaGVja0FuZFVwZGF0ZU5vZGVJbmxpbmUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHYwPzogYW55LCB2MT86IGFueSwgdjI/OiBhbnksIHYzPzogYW55LCB2ND86IGFueSwgdjU/OiBhbnksXG4gICAgdjY/OiBhbnksIHY3PzogYW55LCB2OD86IGFueSwgdjk/OiBhbnkpOiBib29sZWFuIHtcbiAgc3dpdGNoIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQ6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVFbGVtZW50SW5saW5lKHZpZXcsIG5vZGVEZWYsIHYwLCB2MSwgdjIsIHYzLCB2NCwgdjUsIHY2LCB2NywgdjgsIHY5KTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVGV4dDpcbiAgICAgIHJldHVybiBjaGVja0FuZFVwZGF0ZVRleHRJbmxpbmUodmlldywgbm9kZURlZiwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmU6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVJbmxpbmUodmlldywgbm9kZURlZiwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlQXJyYXk6XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3Q6XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVQaXBlOlxuICAgICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlUHVyZUV4cHJlc3Npb25JbmxpbmUoXG4gICAgICAgICAgdmlldywgbm9kZURlZiwgdjAsIHYxLCB2MiwgdjMsIHY0LCB2NSwgdjYsIHY3LCB2OCwgdjkpO1xuICAgIGRlZmF1bHQ6XG4gICAgICB0aHJvdyAndW5yZWFjaGFibGUnO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlTm9kZUR5bmFtaWModmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHZhbHVlczogYW55W10pOiBib29sZWFuIHtcbiAgc3dpdGNoIChub2RlRGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUVsZW1lbnQ6XG4gICAgICByZXR1cm4gY2hlY2tBbmRVcGRhdGVFbGVtZW50RHluYW1pYyh2aWV3LCBub2RlRGVmLCB2YWx1ZXMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVUZXh0OlxuICAgICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlVGV4dER5bmFtaWModmlldywgbm9kZURlZiwgdmFsdWVzKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlOlxuICAgICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlRGlyZWN0aXZlRHluYW1pYyh2aWV3LCBub2RlRGVmLCB2YWx1ZXMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVQdXJlQXJyYXk6XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVPYmplY3Q6XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVB1cmVQaXBlOlxuICAgICAgcmV0dXJuIGNoZWNrQW5kVXBkYXRlUHVyZUV4cHJlc3Npb25EeW5hbWljKHZpZXcsIG5vZGVEZWYsIHZhbHVlcyk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93ICd1bnJlYWNoYWJsZSc7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzTm9kZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgYXJnU3R5bGU6IEFyZ3VtZW50VHlwZSwgdjA/OiBhbnksIHYxPzogYW55LCB2Mj86IGFueSxcbiAgICB2Mz86IGFueSwgdjQ/OiBhbnksIHY1PzogYW55LCB2Nj86IGFueSwgdjc/OiBhbnksIHY4PzogYW55LCB2OT86IGFueSk6IGFueSB7XG4gIGlmIChhcmdTdHlsZSA9PT0gQXJndW1lbnRUeXBlLklubGluZSkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTm9kZUlubGluZSh2aWV3LCBub2RlRGVmLCB2MCwgdjEsIHYyLCB2MywgdjQsIHY1LCB2NiwgdjcsIHY4LCB2OSk7XG4gIH0gZWxzZSB7XG4gICAgY2hlY2tOb0NoYW5nZXNOb2RlRHluYW1pYyh2aWV3LCBub2RlRGVmLCB2MCk7XG4gIH1cbiAgLy8gUmV0dXJuaW5nIGZhbHNlIGlzIG9rIGhlcmUgYXMgd2Ugd291bGQgaGF2ZSB0aHJvd24gaW4gY2FzZSBvZiBhIGNoYW5nZS5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjaGVja05vQ2hhbmdlc05vZGVJbmxpbmUoXG4gICAgdmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYsIHYwOiBhbnksIHYxOiBhbnksIHYyOiBhbnksIHYzOiBhbnksIHY0OiBhbnksIHY1OiBhbnksIHY2OiBhbnksXG4gICAgdjc6IGFueSwgdjg6IGFueSwgdjk6IGFueSk6IHZvaWQge1xuICBjb25zdCBiaW5kTGVuID0gbm9kZURlZi5iaW5kaW5ncy5sZW5ndGg7XG4gIGlmIChiaW5kTGVuID4gMCkgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDAsIHYwKTtcbiAgaWYgKGJpbmRMZW4gPiAxKSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgMSwgdjEpO1xuICBpZiAoYmluZExlbiA+IDIpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCAyLCB2Mik7XG4gIGlmIChiaW5kTGVuID4gMykgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDMsIHYzKTtcbiAgaWYgKGJpbmRMZW4gPiA0KSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgNCwgdjQpO1xuICBpZiAoYmluZExlbiA+IDUpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCA1LCB2NSk7XG4gIGlmIChiaW5kTGVuID4gNikgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDYsIHY2KTtcbiAgaWYgKGJpbmRMZW4gPiA3KSBjaGVja0JpbmRpbmdOb0NoYW5nZXModmlldywgbm9kZURlZiwgNywgdjcpO1xuICBpZiAoYmluZExlbiA+IDgpIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCA4LCB2OCk7XG4gIGlmIChiaW5kTGVuID4gOSkgY2hlY2tCaW5kaW5nTm9DaGFuZ2VzKHZpZXcsIG5vZGVEZWYsIDksIHY5KTtcbn1cblxuZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNOb2RlRHluYW1pYyh2aWV3OiBWaWV3RGF0YSwgbm9kZURlZjogTm9kZURlZiwgdmFsdWVzOiBhbnlbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGNoZWNrQmluZGluZ05vQ2hhbmdlcyh2aWV3LCBub2RlRGVmLCBpLCB2YWx1ZXNbaV0pO1xuICB9XG59XG5cbi8qKlxuICogV29ya2Fyb3VuZCBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci90c2lja2xlL2lzc3Vlcy80OTdcbiAqIEBzdXBwcmVzcyB7bWlzcGxhY2VkVHlwZUFubm90YXRpb259XG4gKi9cbmZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzUXVlcnkodmlldzogVmlld0RhdGEsIG5vZGVEZWY6IE5vZGVEZWYpIHtcbiAgY29uc3QgcXVlcnlMaXN0ID0gYXNRdWVyeUxpc3Qodmlldywgbm9kZURlZi5ub2RlSW5kZXgpO1xuICBpZiAocXVlcnlMaXN0LmRpcnR5KSB7XG4gICAgdGhyb3cgZXhwcmVzc2lvbkNoYW5nZWRBZnRlckl0SGFzQmVlbkNoZWNrZWRFcnJvcihcbiAgICAgICAgU2VydmljZXMuY3JlYXRlRGVidWdDb250ZXh0KHZpZXcsIG5vZGVEZWYubm9kZUluZGV4KSxcbiAgICAgICAgYFF1ZXJ5ICR7bm9kZURlZi5xdWVyeSEuaWR9IG5vdCBkaXJ0eWAsIGBRdWVyeSAke25vZGVEZWYucXVlcnkhLmlkfSBkaXJ0eWAsXG4gICAgICAgICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkJlZm9yZUZpcnN0Q2hlY2spICE9PSAwKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVzdHJveVZpZXcodmlldzogVmlld0RhdGEpIHtcbiAgaWYgKHZpZXcuc3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGV4ZWNFbWJlZGRlZFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uRGVzdHJveSk7XG4gIGV4ZWNDb21wb25lbnRWaWV3c0FjdGlvbih2aWV3LCBWaWV3QWN0aW9uLkRlc3Ryb3kpO1xuICBjYWxsTGlmZWN5Y2xlSG9va3NDaGlsZHJlbkZpcnN0KHZpZXcsIE5vZGVGbGFncy5PbkRlc3Ryb3kpO1xuICBpZiAodmlldy5kaXNwb3NhYmxlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdmlldy5kaXNwb3NhYmxlcy5sZW5ndGg7IGkrKykge1xuICAgICAgdmlldy5kaXNwb3NhYmxlc1tpXSgpO1xuICAgIH1cbiAgfVxuICBkZXRhY2hQcm9qZWN0ZWRWaWV3KHZpZXcpO1xuICBpZiAodmlldy5yZW5kZXJlci5kZXN0cm95Tm9kZSkge1xuICAgIGRlc3Ryb3lWaWV3Tm9kZXModmlldyk7XG4gIH1cbiAgaWYgKGlzQ29tcG9uZW50Vmlldyh2aWV3KSkge1xuICAgIHZpZXcucmVuZGVyZXIuZGVzdHJveSgpO1xuICB9XG4gIHZpZXcuc3RhdGUgfD0gVmlld1N0YXRlLkRlc3Ryb3llZDtcbn1cblxuZnVuY3Rpb24gZGVzdHJveVZpZXdOb2Rlcyh2aWV3OiBWaWV3RGF0YSkge1xuICBjb25zdCBsZW4gPSB2aWV3LmRlZi5ub2Rlcy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSB7XG4gICAgICB2aWV3LnJlbmRlcmVyLmRlc3Ryb3lOb2RlICEoYXNFbGVtZW50RGF0YSh2aWV3LCBpKS5yZW5kZXJFbGVtZW50KTtcbiAgICB9IGVsc2UgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlVGV4dCkge1xuICAgICAgdmlldy5yZW5kZXJlci5kZXN0cm95Tm9kZSAhKGFzVGV4dERhdGEodmlldywgaSkucmVuZGVyVGV4dCk7XG4gICAgfSBlbHNlIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZUNvbnRlbnRRdWVyeSB8fCBkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZVZpZXdRdWVyeSkge1xuICAgICAgYXNRdWVyeUxpc3QodmlldywgaSkuZGVzdHJveSgpO1xuICAgIH1cbiAgfVxufVxuXG5lbnVtIFZpZXdBY3Rpb24ge1xuICBDcmVhdGVWaWV3Tm9kZXMsXG4gIENoZWNrTm9DaGFuZ2VzLFxuICBDaGVja05vQ2hhbmdlc1Byb2plY3RlZFZpZXdzLFxuICBDaGVja0FuZFVwZGF0ZSxcbiAgQ2hlY2tBbmRVcGRhdGVQcm9qZWN0ZWRWaWV3cyxcbiAgRGVzdHJveVxufVxuXG5mdW5jdGlvbiBleGVjQ29tcG9uZW50Vmlld3NBY3Rpb24odmlldzogVmlld0RhdGEsIGFjdGlvbjogVmlld0FjdGlvbikge1xuICBjb25zdCBkZWYgPSB2aWV3LmRlZjtcbiAgaWYgKCEoZGVmLm5vZGVGbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnRWaWV3KSkge1xuICAgIHJldHVybjtcbiAgfVxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSBkZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50Vmlldykge1xuICAgICAgLy8gYSBsZWFmXG4gICAgICBjYWxsVmlld0FjdGlvbihhc0VsZW1lbnREYXRhKHZpZXcsIGkpLmNvbXBvbmVudFZpZXcsIGFjdGlvbik7XG4gICAgfSBlbHNlIGlmICgobm9kZURlZi5jaGlsZEZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudFZpZXcpID09PSAwKSB7XG4gICAgICAvLyBhIHBhcmVudCB3aXRoIGxlYWZzXG4gICAgICAvLyBubyBjaGlsZCBpcyBhIGNvbXBvbmVudCxcbiAgICAgIC8vIHRoZW4gc2tpcCB0aGUgY2hpbGRyZW5cbiAgICAgIGkgKz0gbm9kZURlZi5jaGlsZENvdW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjRW1iZWRkZWRWaWV3c0FjdGlvbih2aWV3OiBWaWV3RGF0YSwgYWN0aW9uOiBWaWV3QWN0aW9uKSB7XG4gIGNvbnN0IGRlZiA9IHZpZXcuZGVmO1xuICBpZiAoIShkZWYubm9kZUZsYWdzICYgTm9kZUZsYWdzLkVtYmVkZGVkVmlld3MpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZURlZiA9IGRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIE5vZGVGbGFncy5FbWJlZGRlZFZpZXdzKSB7XG4gICAgICAvLyBhIGxlYWZcbiAgICAgIGNvbnN0IGVtYmVkZGVkVmlld3MgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGkpLnZpZXdDb250YWluZXIgIS5fZW1iZWRkZWRWaWV3cztcbiAgICAgIGZvciAobGV0IGsgPSAwOyBrIDwgZW1iZWRkZWRWaWV3cy5sZW5ndGg7IGsrKykge1xuICAgICAgICBjYWxsVmlld0FjdGlvbihlbWJlZGRlZFZpZXdzW2tdLCBhY3Rpb24pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoKG5vZGVEZWYuY2hpbGRGbGFncyAmIE5vZGVGbGFncy5FbWJlZGRlZFZpZXdzKSA9PT0gMCkge1xuICAgICAgLy8gYSBwYXJlbnQgd2l0aCBsZWFmc1xuICAgICAgLy8gbm8gY2hpbGQgaXMgYSBjb21wb25lbnQsXG4gICAgICAvLyB0aGVuIHNraXAgdGhlIGNoaWxkcmVuXG4gICAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbFZpZXdBY3Rpb24odmlldzogVmlld0RhdGEsIGFjdGlvbjogVmlld0FjdGlvbikge1xuICBjb25zdCB2aWV3U3RhdGUgPSB2aWV3LnN0YXRlO1xuICBzd2l0Y2ggKGFjdGlvbikge1xuICAgIGNhc2UgVmlld0FjdGlvbi5DaGVja05vQ2hhbmdlczpcbiAgICAgIGlmICgodmlld1N0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkgPT09IDApIHtcbiAgICAgICAgaWYgKCh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2F0RGV0ZWN0Q2hhbmdlcykgPT09IFZpZXdTdGF0ZS5DYXREZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgICAgY2hlY2tOb0NoYW5nZXNWaWV3KHZpZXcpO1xuICAgICAgICB9IGVsc2UgaWYgKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXdzKSB7XG4gICAgICAgICAgZXhlY1Byb2plY3RlZFZpZXdzQWN0aW9uKHZpZXcsIFZpZXdBY3Rpb24uQ2hlY2tOb0NoYW5nZXNQcm9qZWN0ZWRWaWV3cyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIGNhc2UgVmlld0FjdGlvbi5DaGVja05vQ2hhbmdlc1Byb2plY3RlZFZpZXdzOlxuICAgICAgaWYgKCh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuRGVzdHJveWVkKSA9PT0gMCkge1xuICAgICAgICBpZiAodmlld1N0YXRlICYgVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlldykge1xuICAgICAgICAgIGNoZWNrTm9DaGFuZ2VzVmlldyh2aWV3KTtcbiAgICAgICAgfSBlbHNlIGlmICh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cykge1xuICAgICAgICAgIGV4ZWNQcm9qZWN0ZWRWaWV3c0FjdGlvbih2aWV3LCBhY3Rpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFZpZXdBY3Rpb24uQ2hlY2tBbmRVcGRhdGU6XG4gICAgICBpZiAoKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5EZXN0cm95ZWQpID09PSAwKSB7XG4gICAgICAgIGlmICgodmlld1N0YXRlICYgVmlld1N0YXRlLkNhdERldGVjdENoYW5nZXMpID09PSBWaWV3U3RhdGUuQ2F0RGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICAgIGNoZWNrQW5kVXBkYXRlVmlldyh2aWV3KTtcbiAgICAgICAgfSBlbHNlIGlmICh2aWV3U3RhdGUgJiBWaWV3U3RhdGUuQ2hlY2tQcm9qZWN0ZWRWaWV3cykge1xuICAgICAgICAgIGV4ZWNQcm9qZWN0ZWRWaWV3c0FjdGlvbih2aWV3LCBWaWV3QWN0aW9uLkNoZWNrQW5kVXBkYXRlUHJvamVjdGVkVmlld3MpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBicmVhaztcbiAgICBjYXNlIFZpZXdBY3Rpb24uQ2hlY2tBbmRVcGRhdGVQcm9qZWN0ZWRWaWV3czpcbiAgICAgIGlmICgodmlld1N0YXRlICYgVmlld1N0YXRlLkRlc3Ryb3llZCkgPT09IDApIHtcbiAgICAgICAgaWYgKHZpZXdTdGF0ZSAmIFZpZXdTdGF0ZS5DaGVja1Byb2plY3RlZFZpZXcpIHtcbiAgICAgICAgICBjaGVja0FuZFVwZGF0ZVZpZXcodmlldyk7XG4gICAgICAgIH0gZWxzZSBpZiAodmlld1N0YXRlICYgVmlld1N0YXRlLkNoZWNrUHJvamVjdGVkVmlld3MpIHtcbiAgICAgICAgICBleGVjUHJvamVjdGVkVmlld3NBY3Rpb24odmlldywgYWN0aW9uKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBWaWV3QWN0aW9uLkRlc3Ryb3k6XG4gICAgICAvLyBOb3RlOiBkZXN0cm95VmlldyByZWN1cnNlcyBvdmVyIGFsbCB2aWV3cyxcbiAgICAgIC8vIHNvIHdlIGRvbid0IG5lZWQgdG8gc3BlY2lhbCBjYXNlIHByb2plY3RlZCB2aWV3cyBoZXJlLlxuICAgICAgZGVzdHJveVZpZXcodmlldyk7XG4gICAgICBicmVhaztcbiAgICBjYXNlIFZpZXdBY3Rpb24uQ3JlYXRlVmlld05vZGVzOlxuICAgICAgY3JlYXRlVmlld05vZGVzKHZpZXcpO1xuICAgICAgYnJlYWs7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY1Byb2plY3RlZFZpZXdzQWN0aW9uKHZpZXc6IFZpZXdEYXRhLCBhY3Rpb246IFZpZXdBY3Rpb24pIHtcbiAgZXhlY0VtYmVkZGVkVmlld3NBY3Rpb24odmlldywgYWN0aW9uKTtcbiAgZXhlY0NvbXBvbmVudFZpZXdzQWN0aW9uKHZpZXcsIGFjdGlvbik7XG59XG5cbmZ1bmN0aW9uIGV4ZWNRdWVyaWVzQWN0aW9uKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBxdWVyeUZsYWdzOiBOb2RlRmxhZ3MsIHN0YXRpY0R5bmFtaWNRdWVyeUZsYWc6IE5vZGVGbGFncyxcbiAgICBjaGVja1R5cGU6IENoZWNrVHlwZSkge1xuICBpZiAoISh2aWV3LmRlZi5ub2RlRmxhZ3MgJiBxdWVyeUZsYWdzKSB8fCAhKHZpZXcuZGVmLm5vZGVGbGFncyAmIHN0YXRpY0R5bmFtaWNRdWVyeUZsYWcpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IG5vZGVDb3VudCA9IHZpZXcuZGVmLm5vZGVzLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2RlQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAoKG5vZGVEZWYuZmxhZ3MgJiBxdWVyeUZsYWdzKSAmJiAobm9kZURlZi5mbGFncyAmIHN0YXRpY0R5bmFtaWNRdWVyeUZsYWcpKSB7XG4gICAgICBTZXJ2aWNlcy5zZXRDdXJyZW50Tm9kZSh2aWV3LCBub2RlRGVmLm5vZGVJbmRleCk7XG4gICAgICBzd2l0Y2ggKGNoZWNrVHlwZSkge1xuICAgICAgICBjYXNlIENoZWNrVHlwZS5DaGVja0FuZFVwZGF0ZTpcbiAgICAgICAgICBjaGVja0FuZFVwZGF0ZVF1ZXJ5KHZpZXcsIG5vZGVEZWYpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIENoZWNrVHlwZS5DaGVja05vQ2hhbmdlczpcbiAgICAgICAgICBjaGVja05vQ2hhbmdlc1F1ZXJ5KHZpZXcsIG5vZGVEZWYpO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIShub2RlRGVmLmNoaWxkRmxhZ3MgJiBxdWVyeUZsYWdzKSB8fCAhKG5vZGVEZWYuY2hpbGRGbGFncyAmIHN0YXRpY0R5bmFtaWNRdWVyeUZsYWcpKSB7XG4gICAgICAvLyBubyBjaGlsZCBoYXMgYSBtYXRjaGluZyBxdWVyeVxuICAgICAgLy8gdGhlbiBza2lwIHRoZSBjaGlsZHJlblxuICAgICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gICAgfVxuICB9XG59XG4iXX0=