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
import { callLifecycleHooksChildrenFirst, checkAndUpdateProviderDynamic, checkAndUpdateProviderInline, createProviderInstance } from './provider';
import { checkAndUpdatePureExpressionDynamic, checkAndUpdatePureExpressionInline, createPureExpression } from './pure_expression';
import { checkAndUpdateQuery, createQuery } from './query';
import { checkAndUpdateTextDynamic, checkAndUpdateTextInline, createText } from './text';
import { EntryAction, NodeFlags, NodeType, Refs, ViewFlags, ViewState, asElementData, asProviderData, asPureExpressionData, asQueryList } from './types';
import { checkBindingNoChanges, currentAction, currentNodeIndex, currentView, entryAction, isComponentView, resolveViewDefinition, setCurrentNode } from './util';
const /** @type {?} */ NOOP = () => undefined;
/**
 * @param {?} flags
 * @param {?} nodesWithoutIndices
 * @param {?=} update
 * @param {?=} handleEvent
 * @param {?=} componentType
 * @return {?}
 */
export function viewDef(flags, nodesWithoutIndices, update, handleEvent, componentType) {
    // clone nodes and set auto calculated values
    if (nodesWithoutIndices.length === 0) {
        throw new Error(`Illegal State: Views without nodes are not allowed!`);
    }
    const /** @type {?} */ nodes = new Array(nodesWithoutIndices.length);
    const /** @type {?} */ reverseChildNodes = new Array(nodesWithoutIndices.length);
    let /** @type {?} */ viewBindingCount = 0;
    let /** @type {?} */ viewDisposableCount = 0;
    let /** @type {?} */ viewNodeFlags = 0;
    let /** @type {?} */ viewMatchedQueries = {};
    let /** @type {?} */ currentParent = null;
    let /** @type {?} */ lastRootNode = null;
    for (let /** @type {?} */ i = 0; i < nodesWithoutIndices.length; i++) {
        while (currentParent && i > currentParent.index + currentParent.childCount) {
            const /** @type {?} */ newParent = nodes[currentParent.parent];
            if (newParent) {
                newParent.childFlags |= currentParent.childFlags;
                copyInto(currentParent.childMatchedQueries, newParent.childMatchedQueries);
            }
            currentParent = newParent;
        }
        const /** @type {?} */ nodeWithoutIndices = nodesWithoutIndices[i];
        const /** @type {?} */ reverseChildIndex = calculateReverseChildIndex(currentParent, i, nodeWithoutIndices.childCount, nodesWithoutIndices.length);
        const /** @type {?} */ node = cloneAndModifyNode(nodeWithoutIndices, {
            index: i,
            parent: currentParent ? currentParent.index : undefined,
            bindingIndex: viewBindingCount,
            disposableIndex: viewDisposableCount, reverseChildIndex,
        });
        if (node.element) {
            node.element = cloneAndModifyElement(node.element, {
                // Use protoypical inheritance to not get O(n^2) complexity...
                providerIndices: Object.create(currentParent ? currentParent.element.providerIndices : null),
            });
        }
        nodes[i] = node;
        reverseChildNodes[reverseChildIndex] = node;
        validateNode(currentParent, node);
        viewNodeFlags |= node.flags;
        copyInto(node.matchedQueries, viewMatchedQueries);
        viewBindingCount += node.bindings.length;
        viewDisposableCount += node.disposableCount;
        if (currentParent) {
            currentParent.childFlags |= node.flags;
            copyInto(node.matchedQueries, currentParent.childMatchedQueries);
            if (node.element && node.element.template) {
                copyInto(node.element.template.nodeMatchedQueries, currentParent.childMatchedQueries);
            }
        }
        if (!currentParent) {
            lastRootNode = node;
        }
        if (node.provider) {
            currentParent.element.providerIndices[node.provider.tokenKey] = i;
        }
        if (node.query) {
            const /** @type {?} */ elementDef = nodes[currentParent.parent];
            elementDef.element.providerIndices[node.query.id] = i;
        }
        if (node.childCount) {
            currentParent = node;
        }
    }
    while (currentParent) {
        const /** @type {?} */ newParent = nodes[currentParent.parent];
        if (newParent) {
            newParent.childFlags |= currentParent.childFlags;
            copyInto(currentParent.childMatchedQueries, newParent.childMatchedQueries);
        }
        currentParent = newParent;
    }
    return {
        nodeFlags: viewNodeFlags,
        nodeMatchedQueries: viewMatchedQueries, flags,
        nodes: nodes, reverseChildNodes,
        update: update || NOOP,
        handleEvent: handleEvent || NOOP, componentType,
        bindingCount: viewBindingCount,
        disposableCount: viewDisposableCount, lastRootNode
    };
}
/**
 * @param {?} source
 * @param {?} target
 * @return {?}
 */
function copyInto(source, target) {
    for (let /** @type {?} */ prop in source) {
        target[prop] = source[prop];
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
    let /** @type {?} */ lastChildOffsetRelativeToParentInDfsOrder;
    let /** @type {?} */ parentEndIndexInReverseChildOrder;
    if (currentParent) {
        const /** @type {?} */ lastChildIndex = i + childCount;
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
 * @return {?}
 */
function validateNode(parent, node) {
    const /** @type {?} */ template = node.element && node.element.template;
    if (template) {
        if (template.lastRootNode && template.lastRootNode.flags & NodeFlags.HasEmbeddedViews) {
            throw new Error(`Illegal State: Last root node of a template can't have embedded views, at index ${node.index}!`);
        }
    }
    if (node.provider) {
        const /** @type {?} */ parentType = parent ? parent.type : null;
        if (parentType !== NodeType.Element) {
            throw new Error(`Illegal State: Provider nodes need to be children of elements or anchors, at index ${node.index}!`);
        }
    }
    if (node.query) {
        const /** @type {?} */ parentType = parent ? parent.type : null;
        if (parentType !== NodeType.Provider) {
            throw new Error(`Illegal State: Query nodes need to be children of providers, at index ${node.index}!`);
        }
    }
    if (node.childCount) {
        if (parent) {
            const /** @type {?} */ parentEnd = parent.index + parent.childCount;
            if (node.index <= parentEnd && node.index + node.childCount > parentEnd) {
                throw new Error(`Illegal State: childCount of node leads outside of parent, at index ${node.index}!`);
            }
        }
    }
}
/**
 * @param {?} nodeDef
 * @param {?} values
 * @return {?}
 */
function cloneAndModifyNode(nodeDef, values) {
    const /** @type {?} */ clonedNode = ({});
    copyInto(nodeDef, clonedNode);
    clonedNode.index = values.index;
    clonedNode.bindingIndex = values.bindingIndex;
    clonedNode.disposableIndex = values.disposableIndex;
    clonedNode.parent = values.parent;
    clonedNode.reverseChildIndex = values.reverseChildIndex;
    // Note: We can't set the value immediately, as we need to walk the children first.
    clonedNode.childFlags = 0;
    clonedNode.childMatchedQueries = {};
    return clonedNode;
}
/**
 * @param {?} elementDef
 * @param {?} values
 * @return {?}
 */
function cloneAndModifyElement(elementDef, values) {
    const /** @type {?} */ clonedElement = ({});
    copyInto(elementDef, clonedElement);
    clonedElement.providerIndices = values.providerIndices;
    return clonedElement;
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
    const /** @type {?} */ view = createView(parent.root, parent, anchorDef.index, anchorDef.element.template);
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
    const /** @type {?} */ view = createView(root, null, null, def);
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
    const /** @type {?} */ nodes = new Array(def.nodes.length);
    let /** @type {?} */ renderer;
    if (def.flags != null && (def.flags & ViewFlags.DirectDom)) {
        renderer = null;
    }
    else {
        renderer =
            def.componentType ? root.renderer.renderComponent(def.componentType) : parent.renderer;
    }
    const /** @type {?} */ disposables = def.disposableCount ? new Array(def.disposableCount) : undefined;
    const /** @type {?} */ view = {
        def,
        parent,
        parentIndex,
        context: undefined,
        component: undefined, nodes,
        state: ViewState.FirstCheck | ViewState.ChecksEnabled, renderer, root,
        oldValues: new Array(def.bindingCount), disposables
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
const /** @type {?} */ createViewNodes = entryAction(EntryAction.CheckNoChanges, _createViewNodes);
/**
 * @param {?} view
 * @return {?}
 */
function _createViewNodes(view) {
    let /** @type {?} */ renderHost;
    if (isComponentView(view)) {
        renderHost = asElementData(view.parent, view.parentIndex).renderElement;
        if (view.renderer) {
            renderHost = view.renderer.createViewRoot(renderHost);
        }
    }
    const /** @type {?} */ def = view.def;
    const /** @type {?} */ nodes = view.nodes;
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        // As the current node is being created, we have to use
        // the parent node as the current node for error messages, ...
        setCurrentNode(view, nodeDef.parent);
        switch (nodeDef.type) {
            case NodeType.Element:
                nodes[i] = (createElement(view, renderHost, nodeDef));
                break;
            case NodeType.Text:
                nodes[i] = (createText(view, renderHost, nodeDef));
                break;
            case NodeType.Provider:
                if (nodeDef.provider.component) {
                    // Components can inject a ChangeDetectorRef that needs a references to
                    // the component view. Therefore, we create the component view first
                    // and set the ProviderData in ViewData, and then instantiate the provider.
                    const /** @type {?} */ componentView = createView(view.root, view, nodeDef.parent, resolveViewDefinition(nodeDef.provider.component));
                    const /** @type {?} */ providerData = ({ componentView, instance: undefined });
                    nodes[i] = (providerData);
                    const /** @type {?} */ instance = providerData.instance = createProviderInstance(view, nodeDef);
                    initView(componentView, instance, instance);
                }
                else {
                    const /** @type {?} */ instance = createProviderInstance(view, nodeDef);
                    const /** @type {?} */ providerData = ({ componentView: undefined, instance });
                    nodes[i] = (providerData);
                }
                break;
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
export const /** @type {?} */ checkNoChangesView = entryAction(EntryAction.CheckNoChanges, _checkNoChangesView);
/**
 * @param {?} view
 * @return {?}
 */
function _checkNoChangesView(view) {
    view.def.update(view);
    execEmbeddedViewsAction(view, ViewAction.CheckNoChanges);
    execQueriesAction(view, NodeFlags.HasContentQuery, QueryAction.CheckNoChanges);
    execComponentViewsAction(view, ViewAction.CheckNoChanges);
    execQueriesAction(view, NodeFlags.HasViewQuery, QueryAction.CheckNoChanges);
}
export const /** @type {?} */ checkAndUpdateView = entryAction(EntryAction.CheckAndUpdate, _checkAndUpdateView);
/**
 * @param {?} view
 * @return {?}
 */
function _checkAndUpdateView(view) {
    view.def.update(view);
    execEmbeddedViewsAction(view, ViewAction.CheckAndUpdate);
    execQueriesAction(view, NodeFlags.HasContentQuery, QueryAction.CheckAndUpdate);
    callLifecycleHooksChildrenFirst(view, NodeFlags.AfterContentChecked |
        (view.state & ViewState.FirstCheck ? NodeFlags.AfterContentInit : 0));
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
export function checkNodeInline(v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const /** @type {?} */ action = currentAction();
    const /** @type {?} */ view = currentView();
    const /** @type {?} */ nodeIndex = currentNodeIndex();
    const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    switch (action) {
        case EntryAction.CheckNoChanges:
            checkNodeNoChangesInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
            break;
        case EntryAction.CheckAndUpdate:
            switch (nodeDef.type) {
                case NodeType.Element:
                    checkAndUpdateElementInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
                    break;
                case NodeType.Text:
                    checkAndUpdateTextInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
                    break;
                case NodeType.Provider:
                    checkAndUpdateProviderInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
                    break;
                case NodeType.PureExpression:
                    checkAndUpdatePureExpressionInline(view, nodeDef, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9);
                    break;
            }
            break;
        default:
            throw new Error(`Illegal State: In action ${EntryAction[action]}`);
    }
    return nodeDef.type === NodeType.PureExpression ? asPureExpressionData(view, nodeIndex).value :
        undefined;
}
/**
 * @param {?} values
 * @return {?}
 */
export function checkNodeDynamic(values) {
    const /** @type {?} */ action = currentAction();
    const /** @type {?} */ view = currentView();
    const /** @type {?} */ nodeIndex = currentNodeIndex();
    const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    switch (action) {
        case EntryAction.CheckNoChanges:
            checkNodeNoChangesDynamic(view, nodeIndex, values);
            break;
        case EntryAction.CheckAndUpdate:
            switch (nodeDef.type) {
                case NodeType.Element:
                    checkAndUpdateElementDynamic(view, nodeDef, values);
                    break;
                case NodeType.Text:
                    checkAndUpdateTextDynamic(view, nodeDef, values);
                    break;
                case NodeType.Provider:
                    checkAndUpdateProviderDynamic(view, nodeDef, values);
                    break;
                case NodeType.PureExpression:
                    checkAndUpdatePureExpressionDynamic(view, nodeDef, values);
                    break;
            }
            break;
        default:
            throw new Error(`Illegal State: In action ${EntryAction[action]}`);
    }
    return nodeDef.type === NodeType.PureExpression ? asPureExpressionData(view, nodeIndex).value :
        undefined;
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
function checkNodeNoChangesInline(view, nodeIndex, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
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
    return undefined;
}
/**
 * @param {?} view
 * @param {?} nodeIndex
 * @param {?} values
 * @return {?}
 */
function checkNodeNoChangesDynamic(view, nodeIndex, values) {
    const /** @type {?} */ nodeDef = view.def.nodes[nodeIndex];
    for (let /** @type {?} */ i = 0; i < values.length; i++) {
        checkBindingNoChanges(view, nodeDef, i, values[i]);
    }
}
/**
 * @param {?} view
 * @param {?} nodeDef
 * @return {?}
 */
function checkNoChangesQuery(view, nodeDef) {
    const /** @type {?} */ queryList = asQueryList(view, nodeDef.index);
    if (queryList.dirty) {
        throw expressionChangedAfterItHasBeenCheckedError(Refs.createDebugContext(view, nodeDef.index), `Query ${nodeDef.query.id} not dirty`, `Query ${nodeDef.query.id} dirty`, (view.state & ViewState.FirstCheck) !== 0);
    }
}
export const /** @type {?} */ destroyView = entryAction(EntryAction.Destroy, _destroyView);
/**
 * @param {?} view
 * @return {?}
 */
function _destroyView(view) {
    callLifecycleHooksChildrenFirst(view, NodeFlags.OnDestroy);
    if (view.disposables) {
        for (let /** @type {?} */ i = 0; i < view.disposables.length; i++) {
            view.disposables[i]();
        }
    }
    execComponentViewsAction(view, ViewAction.Destroy);
    execEmbeddedViewsAction(view, ViewAction.Destroy);
    view.state |= ViewState.Destroyed;
}
let ViewAction = {};
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
    const /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & NodeFlags.HasComponent)) {
        return;
    }
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & NodeFlags.HasComponent) {
            // a leaf
            const /** @type {?} */ providerData = asProviderData(view, i);
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
    const /** @type {?} */ def = view.def;
    if (!(def.nodeFlags & NodeFlags.HasEmbeddedViews)) {
        return;
    }
    for (let /** @type {?} */ i = 0; i < def.nodes.length; i++) {
        const /** @type {?} */ nodeDef = def.nodes[i];
        if (nodeDef.flags & NodeFlags.HasEmbeddedViews) {
            // a leaf
            const /** @type {?} */ embeddedViews = asElementData(view, i).embeddedViews;
            if (embeddedViews) {
                for (let /** @type {?} */ k = 0; k < embeddedViews.length; k++) {
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
    const /** @type {?} */ viewState = view.state;
    switch (action) {
        case ViewAction.CheckNoChanges:
            if ((viewState & ViewState.ChecksEnabled) &&
                (viewState & (ViewState.Errored | ViewState.Destroyed)) === 0) {
                _checkNoChangesView(view);
            }
            break;
        case ViewAction.CheckAndUpdate:
            if ((viewState & ViewState.ChecksEnabled) &&
                (viewState & (ViewState.Errored | ViewState.Destroyed)) === 0) {
                _checkAndUpdateView(view);
            }
            break;
        case ViewAction.Destroy:
            _destroyView(view);
            break;
        case ViewAction.CreateViewNodes:
            _createViewNodes(view);
            break;
    }
}
let QueryAction = {};
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
    const /** @type {?} */ nodeCount = view.def.nodes.length;
    for (let /** @type {?} */ i = 0; i < nodeCount; i++) {
        const /** @type {?} */ nodeDef = view.def.nodes[i];
        if (nodeDef.flags & queryFlags) {
            setCurrentNode(view, nodeDef.index);
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