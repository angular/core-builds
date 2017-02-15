/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { checkAndUpdateElementDynamic, checkAndUpdateElementInline, createElement } from './element';
import { expressionChangedAfterItHasBeenCheckedError } from './errors';
import { appendNgContent } from './ng_content';
import { callLifecycleHooksChildrenFirst, checkAndUpdateDirectiveDynamic, checkAndUpdateDirectiveInline, createDirectiveInstance, createPipeInstance, createProviderInstance } from './provider';
import { checkAndUpdatePureExpressionDynamic, checkAndUpdatePureExpressionInline, createPureExpression } from './pure_expression';
import { checkAndUpdateQuery, createQuery } from './query';
import { checkAndUpdateTextDynamic, checkAndUpdateTextInline, createText } from './text';
import { ArgumentType, NodeFlags, NodeType, Services, ViewFlags, ViewState, asElementData, asProviderData, asPureExpressionData, asQueryList } from './types';
import { checkBindingNoChanges, isComponentView, queryIdIsReference, resolveViewDefinition, viewParentElIndex } from './util';
var /** @type {?} */ NOOP = function () { return undefined; };
/**
 * @param {?} flags
 * @param {?} nodesWithoutIndices
 * @param {?=} updateDirectives
 * @param {?=} updateRenderer
 * @param {?=} handleEvent
 * @param {?=} compId
 * @param {?=} encapsulation
 * @param {?=} styles
 * @return {?}
 */
export function viewDef(flags, nodesWithoutIndices, updateDirectives, updateRenderer, handleEvent, compId, encapsulation, styles) {
    // clone nodes and set auto calculated values
    if (nodesWithoutIndices.length === 0) {
        throw new Error("Illegal State: Views without nodes are not allowed!");
    }
    var /** @type {?} */ nodes = new Array(nodesWithoutIndices.length);
    var /** @type {?} */ reverseChildNodes = new Array(nodesWithoutIndices.length);
    var /** @type {?} */ viewBindingCount = 0;
    var /** @type {?} */ viewDisposableCount = 0;
    var /** @type {?} */ viewNodeFlags = 0;
    var /** @type {?} */ viewMatchedQueries = {};
    var /** @type {?} */ currentParent = null;
    var /** @type {?} */ lastRootNode = null;
    for (var /** @type {?} */ i = 0; i < nodesWithoutIndices.length; i++) {
        while (currentParent && i > currentParent.index + currentParent.childCount) {
            var /** @type {?} */ newParent = nodes[currentParent.parent];
            if (newParent) {
                newParent.childFlags |= currentParent.childFlags;
                copyQueryMatchesInto(currentParent.childMatchedQueries, newParent.childMatchedQueries);
            }
            currentParent = newParent;
        }
        var /** @type {?} */ nodeWithoutIndices = nodesWithoutIndices[i];
        var /** @type {?} */ reverseChildIndex = calculateReverseChildIndex(currentParent, i, nodeWithoutIndices.childCount, nodesWithoutIndices.length);
        var /** @type {?} */ node = cloneAndModifyNode(nodeWithoutIndices, {
            index: i,
            parent: currentParent ? currentParent.index : undefined,
            bindingIndex: viewBindingCount,
            disposableIndex: viewDisposableCount, reverseChildIndex: reverseChildIndex,
        });
        if (node.element) {
            node.element = cloneAndModifyElement(node.element, {
                // Use protoypical inheritance to not get O(n^2) complexity...
                providerIndices: Object.create(currentParent ? currentParent.element.providerIndices : null),
            });
        }
        nodes[i] = node;
        reverseChildNodes[reverseChildIndex] = node;
        validateNode(currentParent, node, nodesWithoutIndices.length);
        viewNodeFlags |= node.flags;
        copyQueryMatchesInto(node.matchedQueries, viewMatchedQueries);
        viewBindingCount += node.bindings.length;
        viewDisposableCount += node.disposableCount;
        if (currentParent) {
            currentParent.childFlags |= node.flags;
            copyQueryMatchesInto(node.matchedQueries, currentParent.childMatchedQueries);
            if (node.element && node.element.template) {
                copyQueryMatchesInto(node.element.template.nodeMatchedQueries, currentParent.childMatchedQueries);
            }
        }
        if (!currentParent) {
            lastRootNode = node;
        }
        if (node.type === NodeType.Provider || node.type === NodeType.Directive) {
            currentParent.element.providerIndices[node.provider.tokenKey] = i;
        }
        if (node.query) {
            var /** @type {?} */ elementDef = nodes[currentParent.parent];
            elementDef.element.providerIndices[node.query.id] = i;
        }
        if (node.childCount) {
            currentParent = node;
        }
    }
    while (currentParent) {
        var /** @type {?} */ newParent = nodes[currentParent.parent];
        if (newParent) {
            newParent.childFlags |= currentParent.childFlags;
            copyQueryMatchesInto(currentParent.childMatchedQueries, newParent.childMatchedQueries);
        }
        currentParent = newParent;
    }
    var /** @type {?} */ componentDef = compId ? ({ id: compId, encapsulation: encapsulation, styles: styles }) : undefined;
    return {
        nodeFlags: viewNodeFlags,
        nodeMatchedQueries: viewMatchedQueries, flags: flags,
        nodes: nodes, reverseChildNodes: reverseChildNodes,
        updateDirectives: updateDirectives || NOOP,
        updateRenderer: updateRenderer || NOOP,
        handleEvent: handleEvent || NOOP,
        component: componentDef,
        bindingCount: viewBindingCount,
        disposableCount: viewDisposableCount, lastRootNode: lastRootNode
    };
}
/**
 * @param {?} source
 * @param {?} target
 * @return {?}
 */
function copyQueryMatchesInto(source, target) {
    for (var /** @type {?} */ prop in source) {
        if (!queryIdIsReference(prop)) {
            target[prop] = true;
        }
    }
}
/**
 * @param {?} currentParent
 * @param {?} i
 * @param {?} childCount
 * @param {?} nodeCount
 * @return {?}
 */
function calculateReverseChildIndex(currentParent, i, childCount, nodeCount) {
    // Notes about reverse child order:
    // - Every node is directly before its children, in dfs and reverse child order.
    // - node.childCount contains all children, in dfs and reverse child order.
    // - In dfs order, every node is before its first child
    // - In reverse child order, every node is before its last child
    // Algorithm, main idea:
    // - In reverse child order, the ranges for each child + its transitive children are mirrored
    //   regarding their position inside of their parent
    // Visualization:
    // Given the following tree:
    // Nodes: n0
    //             n1         n2
    //                n11 n12    n21 n22
    // dfs:    0   1   2   3  4   5   6
    // result: 0   4   6   5  1   3   2
    //
    // Example:
    // Current node = 1
    // 1) lastChildIndex = 3
    // 2) lastChildOffsetRelativeToParentInDfsOrder = 2
    // 3) parentEndIndexInReverseChildOrder = 6
    // 4) result = 4
    var /** @type {?} */ lastChildOffsetRelativeToParentInDfsOrder;
    var /** @type {?} */ parentEndIndexInReverseChildOrder;
    if (currentParent) {
        var /** @type {?} */ lastChildIndex = i + childCount;
        lastChildOffsetRelativeToParentInDfsOrder = lastChildIndex - currentParent.index - 1;
        parentEndIndexInReverseChildOrder = currentParent.reverseChildIndex + currentParent.childCount;
    }
    else {
        lastChildOffsetRelativeToParentInDfsOrder = i + childCount;
        parentEndIndexInReverseChildOrder = nodeCount - 1;
    }
    return parentEndIndexInReverseChildOrder - lastChildOffsetRelativeToParentInDfsOrder;
}
/**
 * @param {?} parent
 * @param {?} node
 * @param {?} nodeCount
 * @return {?}
 */
function validateNode(parent, node, nodeCount) {
    var /** @type {?} */ template = node.element && node.element.template;
    if (template) {
        if (template.lastRootNode && template.lastRootNode.flags & NodeFlags.HasEmbeddedViews) {
            throw new Error("Illegal State: Last root node of a template can't have embedded views, at index " + node.index + "!");
        }
    }
    if (node.type === NodeType.Provider || node.type === NodeType.Directive) {
        var /** @type {?} */ parentType = parent ? parent.type : null;
        if (parentType !== NodeType.Element) {
            throw new Error("Illegal State: Provider/Directive nodes need to be children of elements or anchors, at index " + node.index + "!");
        }
    }
    if (node.query) {
        var /** @type {?} */ parentType = parent ? parent.type : null;
        if (parentType !== NodeType.Directive) {
            throw new Error("Illegal State: Query nodes need to be children of directives, at index " + node.index + "!");
        }
    }
    if (node.childCount) {
        var /** @type {?} */ parentEnd = parent ? parent.index + parent.childCount : nodeCount - 1;
        if (node.index <= parentEnd && node.index + node.childCount > parentEnd) {
            throw new Error("Illegal State: childCount of node leads outside of parent, at index " + node.index + "!");
        }
    }
}
/**
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function cloneAndModifyNode(nodeDef, values) {
    // Attention: don't use copyInto here to prevent v8 from treating this object
    // as a dictionary!
    return {
        type: nodeDef.type,
        index: values.index,
        reverseChildIndex: values.reverseChildIndex,
        parent: values.parent,
        childFlags: 0,
        childMatchedQueries: {},
        bindingIndex: values.bindingIndex,
        disposableIndex: values.disposableIndex,
        flags: nodeDef.flags,
        matchedQueries: nodeDef.matchedQueries,
        ngContentIndex: nodeDef.ngContentIndex,
        childCount: nodeDef.childCount,
        bindings: nodeDef.bindings,
        disposableCount: nodeDef.disposableCount,
        element: nodeDef.element,
        provider: nodeDef.provider,
        text: nodeDef.text,
        pureExpression: nodeDef.pureExpression,
        query: nodeDef.query,
        ngContent: nodeDef.ngContent
    };
}
/**
 * @param {?} elementDef
 * @param {?} values
 * @return {?}
 */
function cloneAndModifyElement(elementDef, values) {
    // Attention: don't use copyInto here to prevent v8 from treating this object
    // as a dictionary!
    return {
        name: elementDef.name,
        attrs: elementDef.attrs,
        outputs: elementDef.outputs,
        template: elementDef.template,
        providerIndices: values.providerIndices,
        source: elementDef.source
    };
}
/**
 * @param {?} parent
 * @param {?} anchorDef
 * @param {?=} context
 * @return {?}
 */
export function createEmbeddedView(parent, anchorDef, context) {
    // embedded views are seen as siblings to the anchor, so we need
    // to get the parent of the anchor and use it as parentIndex.
    var /** @type {?} */ view = createView(parent.root, parent, anchorDef.index, anchorDef.element.template);
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
    var /** @type {?} */ view = createView(root, null, null, def);
    initView(view, context, context);
    createViewNodes(view);
    return view;
}
/**
 * @param {?} root
 * @param {?} parent
 * @param {?} parentIndex
 * @param {?} def
 * @return {?}
 */
function createView(root, parent, parentIndex, def) {
    var /** @type {?} */ nodes = new Array(def.nodes.length);
    var /** @type {?} */ disposables = def.disposableCount ? new Array(def.disposableCount) : undefined;
    var /** @type {?} */ view = {
        def: def,
        parent: parent,
        parentIndex: parentIndex,
        context: undefined,
        component: undefined, nodes: nodes,
        state: ViewState.FirstCheck | ViewState.ChecksEnabled, root: root,
        oldValues: new Array(def.bindingCount), disposables: disposables
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
    var /** @type {?} */ renderHost;
    if (isComponentView(view)) {
        renderHost = asElementData(view.parent, viewParentElIndex(view)).renderElement;
    }
    var /** @type {?} */ def = view.def;
    var /** @type {?} */ nodes = view.nodes;
    for (var /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = def.nodes[i];
        Services.setCurrentNode(view, i);
        switch (nodeDef.type) {
            case NodeType.Element:
                nodes[i] = (createElement(view, renderHost, nodeDef));
                break;
            case NodeType.Text:
                nodes[i] = (createText(view, renderHost, nodeDef));
                break;
            case NodeType.Provider: {
                var /** @type {?} */ instance = createProviderInstance(view, nodeDef);
                var /** @type {?} */ providerData = ({ componentView: undefined, instance: instance });
                nodes[i] = (providerData);
                break;
            }
            case NodeType.Pipe: {
                var /** @type {?} */ instance = createPipeInstance(view, nodeDef);
                var /** @type {?} */ providerData = ({ componentView: undefined, instance: instance });
                nodes[i] = (providerData);
                break;
            }
            case NodeType.Directive: {
                if (nodeDef.flags & NodeFlags.HasComponent) {
                    // Components can inject a ChangeDetectorRef that needs a references to
                    // the component view. Therefore, we create the component view first
                    // and set the ProviderData in ViewData, and then instantiate the provider.
                    var /** @type {?} */ componentView = createView(view.root, view, nodeDef.index, resolveViewDefinition(nodeDef.provider.component));
                    var /** @type {?} */ providerData = ({ componentView: componentView, instance: undefined });
                    nodes[i] = (providerData);
                    var /** @type {?} */ instance = providerData.instance = createDirectiveInstance(view, nodeDef);
                    initView(componentView, instance, instance);
                }
                else {
                    var /** @type {?} */ instance = createDirectiveInstance(view, nodeDef);
                    var /** @type {?} */ providerData = ({ componentView: undefined, instance: instance });
                    nodes[i] = (providerData);
                }
                break;
            }
            case NodeType.PureExpression:
                nodes[i] = (createPureExpression(view, nodeDef));
                break;
            case NodeType.Query:
                nodes[i] = (createQuery());
                break;
            case NodeType.NgContent:
                appendNgContent(view, renderHost, nodeDef);
                // no runtime data needed for NgContent...
                nodes[i] = undefined;
                break;
        }
    }
    // Create the ViewData.nodes of component views after we created everything else,
    // so that e.g. ng-content works
    execComponentViewsAction(view, ViewAction.CreateViewNodes);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkNoChangesView(view) {
    Services.updateDirectives(checkNoChangesNode, view);
    execEmbeddedViewsAction(view, ViewAction.CheckNoChanges);
    execQueriesAction(view, NodeFlags.HasContentQuery, QueryAction.CheckNoChanges);
    Services.updateRenderer(checkNoChangesNode, view);
    execComponentViewsAction(view, ViewAction.CheckNoChanges);
    execQueriesAction(view, NodeFlags.HasViewQuery, QueryAction.CheckNoChanges);
}
/**
 * @param {?} view
 * @return {?}
 */
export function checkAndUpdateView(view) {
    Services.updateDirectives(checkAndUpdateNode, view);
    execEmbeddedViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, NodeFlags.HasContentQuery, QueryAction.CheckAndUpdate);
    callLifecycleHooksChildrenFirst(view, NodeFlags.AfterContentChecked |
        (view.state & ViewState.FirstCheck ? NodeFlags.AfterContentInit : 0));
    Services.updateRenderer(checkAndUpdateNode, view);
    execComponentViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, NodeFlags.HasViewQuery, QueryAction.CheckAndUpdate);
    callLifecycleHooksChildrenFirst(view, NodeFlags.AfterViewChecked |
        (view.state & ViewState.FirstCheck ? NodeFlags.AfterViewInit : 0));
    if (view.def.flags & ViewFlags.OnPush) {
        view.state &= ~ViewState.ChecksEnabled;
    }
    view.state &= ~ViewState.FirstCheck;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
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
function checkAndUpdateNode(view, nodeIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === ArgumentType.Inline) {
        return checkAndUpdateNodeInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        return checkAndUpdateNodeDynamic(view, nodeIndex, v0);
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
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
function checkAndUpdateNodeInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    switch (nodeDef.type) {
        case NodeType.Element:
            return checkAndUpdateElementInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case NodeType.Text:
            return checkAndUpdateTextInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case NodeType.Directive:
            return checkAndUpdateDirectiveInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
        case NodeType.PureExpression:
            return checkAndUpdatePureExpressionInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} values
 * @return {?}
 */
function checkAndUpdateNodeDynamic(view, nodeIndex, values) {
    var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    switch (nodeDef.type) {
        case NodeType.Element:
            return checkAndUpdateElementDynamic(view, nodeDef, values);
        case NodeType.Text:
            return checkAndUpdateTextDynamic(view, nodeDef, values);
        case NodeType.Directive:
            return checkAndUpdateDirectiveDynamic(view, nodeDef, values);
        case NodeType.PureExpression:
            return checkAndUpdatePureExpressionDynamic(view, nodeDef, values);
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
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
function checkNoChangesNode(view, nodeIndex, argStyle, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    if (argStyle === ArgumentType.Inline) {
        return checkNoChangesNodeInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
    }
    else {
        return checkNoChangesNodeDynamic(view, nodeIndex, v0);
    }
}
/**
 * @param {?} view
 * @param {?} nodeIndex
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
function checkNoChangesNodeInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    // Note: fallthrough is intended!
    switch (nodeDef.bindings.length) {
        case 10:
            checkBindingNoChanges(view, nodeDef, 9, v9);
        case 9:
            checkBindingNoChanges(view, nodeDef, 8, v8);
        case 8:
            checkBindingNoChanges(view, nodeDef, 7, v7);
        case 7:
            checkBindingNoChanges(view, nodeDef, 6, v6);
        case 6:
            checkBindingNoChanges(view, nodeDef, 5, v5);
        case 5:
            checkBindingNoChanges(view, nodeDef, 4, v4);
        case 4:
            checkBindingNoChanges(view, nodeDef, 3, v3);
        case 3:
            checkBindingNoChanges(view, nodeDef, 2, v2);
        case 2:
            checkBindingNoChanges(view, nodeDef, 1, v1);
        case 1:
            checkBindingNoChanges(view, nodeDef, 0, v0);
    }
    return nodeDef.type === NodeType.PureExpression ? asPureExpressionData(view, nodeIndex).value :
        undefined;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} values
 * @return {?}
 */
function checkNoChangesNodeDynamic(view, nodeIndex, values) {
    var /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    for (var /** @type {?} */ i = 0; i < values.length; i++) {
        checkBindingNoChanges(view, nodeDef, i, values[i]);
    }
    return nodeDef.type === NodeType.PureExpression ? asPureExpressionData(view, nodeIndex).value :
        undefined;
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @return {?}
 */
function checkNoChangesQuery(view, nodeDef) {
    var /** @type {?} */ queryList = asQueryList(view, nodeDef.index);
    if (queryList.dirty) {
        throw expressionChangedAfterItHasBeenCheckedError(Services.createDebugContext(view, nodeDef.index), "Query " + nodeDef.query.id + " not dirty", "Query " + nodeDef.query.id + " dirty", (view.state & ViewState.FirstCheck) !== 0);
    }
}
/**
 * @param {?} view
 * @return {?}
 */
export function destroyView(view) {
    execEmbeddedViewsAction(view, ViewAction.Destroy);
    execComponentViewsAction(view, ViewAction.Destroy);
    callLifecycleHooksChildrenFirst(view, NodeFlags.OnDestroy);
    if (view.disposables) {
        for (var /** @type {?} */ i = 0; i < view.disposables.length; i++) {
            view.disposables[i]();
        }
    }
    view.state |= ViewState.Destroyed;
}
var ViewAction = {};
ViewAction.CreateViewNodes = 0;
ViewAction.CheckNoChanges = 1;
ViewAction.CheckAndUpdate = 2;
ViewAction.Destroy = 3;
ViewAction[ViewAction.CreateViewNodes] = "CreateViewNodes";
ViewAction[ViewAction.CheckNoChanges] = "CheckNoChanges";
ViewAction[ViewAction.CheckAndUpdate] = "CheckAndUpdate";
ViewAction[ViewAction.Destroy] = "Destroy";
/**
 * @param {?} view
 * @param {?} action
 * @return {?}
 */
function execComponentViewsAction(view, action) {
    var /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & NodeFlags.HasComponent)) {
        return;
    }
    for (var /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & NodeFlags.HasComponent) {
            // a leaf
            var /** @type {?} */ providerData = asProviderData(view, i);
            callViewAction(providerData.componentView, action);
        }
        else if ((nodeDef.childFlags & NodeFlags.HasComponent) === 0) {
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
    var /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & NodeFlags.HasEmbeddedViews)) {
        return;
    }
    for (var /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        var /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & NodeFlags.HasEmbeddedViews) {
            // a leaf
            var /** @type {?} */ embeddedViews = asElementData(view, i).embeddedViews;
            if (embeddedViews) {
                for (var /** @type {?} */ k = 0; k < embeddedViews.length; k++) {
                    callViewAction(embeddedViews[k], action);
                }
            }
        }
        else if ((nodeDef.childFlags & NodeFlags.HasEmbeddedViews) === 0) {
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
    var /** @type {?} */ viewState = view.state;
    switch (action) {
        case ViewAction.CheckNoChanges:
            if ((viewState & ViewState.ChecksEnabled) &&
                (viewState & (ViewState.Errored | ViewState.Destroyed)) === 0) {
                checkNoChangesView(view);
            }
            break;
        case ViewAction.CheckAndUpdate:
            if ((viewState & ViewState.ChecksEnabled) &&
                (viewState & (ViewState.Errored | ViewState.Destroyed)) === 0) {
                checkAndUpdateView(view);
            }
            break;
        case ViewAction.Destroy:
            destroyView(view);
            break;
        case ViewAction.CreateViewNodes:
            createViewNodes(view);
            break;
    }
}
var QueryAction = {};
QueryAction.CheckAndUpdate = 0;
QueryAction.CheckNoChanges = 1;
QueryAction[QueryAction.CheckAndUpdate] = "CheckAndUpdate";
QueryAction[QueryAction.CheckNoChanges] = "CheckNoChanges";
/**
 * @param {?} view
 * @param {?} queryFlags
 * @param {?} action
 * @return {?}
 */
function execQueriesAction(view, queryFlags, action) {
    if (!(view.def.nodeFlags & queryFlags)) {
        return;
    }
    var /** @type {?} */ nodeCount = view.def.nodes.length;
    for (var /** @type {?} */ i = 0; i < nodeCount; i++) {
        var /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.flags & queryFlags) {
            Services.setCurrentNode(view, nodeDef.index);
            switch (action) {
                case QueryAction.CheckAndUpdate:
                    checkAndUpdateQuery(view, nodeDef);
                    break;
                case QueryAction.CheckNoChanges:
                    checkNoChangesQuery(view, nodeDef);
                    break;
            }
        }
        else if ((nodeDef.childFlags & queryFlags) === 0) {
            // no child has a content query
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
//# sourceMappingURL=view.js.map