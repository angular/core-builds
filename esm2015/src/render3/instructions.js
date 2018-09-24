/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual } from './assert';
import { attachPatchData, getLElementFromComponent, readElementValue, readPatchedLViewData } from './context_discovery';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, RENDER_PARENT, VIEWS } from './interfaces/container';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, findComponentView, getContainerNode, getHostElementNode, getLViewChild, getParentOrContainerNode, getRenderParent, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { allocStylingContext, createStylingContextTemplate, renderStyling as renderElementStyles, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling';
import { assertDataInRangeInternal, getLNode, getRootView, isContentQueryHost, isDifferent, loadElementInternal, loadInternal, stringify } from './util';
/** *
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
  @type {?} */
const _CLEAN_PROMISE = Promise.resolve(null);
/** @typedef {?} */
var SanitizerFn;
export { SanitizerFn };
/** *
 * TView.data needs to fill the same number of slots as the LViewData header
 * so the indices of nodes are consistent between LViewData and TView.data.
 *
 * It's much faster to keep a blueprint of the pre-filled array and slice it
 * than it is to create a new array and fill it each time a TView is created.
  @type {?} */
const HEADER_FILLER = new Array(HEADER_OFFSET).fill(null);
/** *
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
  @type {?} */
export const CIRCULAR = '__CIRCULAR__';
/** *
 * This property gets set before entering a template.
 *
 * This renderer can be one of two varieties of Renderer3:
 *
 * - ObjectedOrientedRenderer3
 *
 * This is the native browser API style, e.g. operations are methods on individual objects
 * like HTMLElement. With this style, no additional code is needed as a facade (reducing payload
 * size).
 *
 * - ProceduralRenderer3
 *
 * In non-native browser environments (e.g. platforms such as web-workers), this is the facade
 * that enables element manipulation. This also facilitates backwards compatibility with
 * Renderer2.
  @type {?} */
let renderer;
/**
 * @return {?}
 */
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
/** @type {?} */
let rendererFactory;
/**
 * @return {?}
 */
export function getRendererFactory() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return rendererFactory;
}
/**
 * @return {?}
 */
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
/** *
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LViewData` to only those elements.
  @type {?} */
let elementDepthCount;
/**
 * Returns the current OpaqueViewState instance.
 *
 * Used in conjunction with the restoreView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 * @return {?}
 */
export function getCurrentView() {
    return /** @type {?} */ ((viewData));
}
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param {?} viewToRestore The OpaqueViewState instance to restore.
 * @return {?}
 */
export function restoreView(viewToRestore) {
    contextViewData = /** @type {?} */ ((viewToRestore));
}
/** *
 * Used to set the parent property when nodes are created and track query results.
  @type {?} */
let previousOrParentTNode;
/**
 * @return {?}
 */
export function getPreviousOrParentNode() {
    return previousOrParentTNode == null || previousOrParentTNode === viewData[HOST_NODE] ?
        getHostElementNode(viewData) :
        getLNode(previousOrParentTNode, viewData);
}
/**
 * @return {?}
 */
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
/** *
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
  @type {?} */
let isParent;
/** @type {?} */
let tView;
/** @type {?} */
let currentQueries;
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
 * create content queries).
 * @param {?} QueryType
 * @return {?}
 */
export function getOrCreateCurrentQueries(QueryType) {
    // if this is the first content query on a node, any existing LQueries needs to be cloned
    // in subsequent template passes, the cloning occurs before directive instantiation.
    if (previousOrParentTNode && previousOrParentTNode !== viewData[HOST_NODE] &&
        !isContentQueryHost(previousOrParentTNode)) {
        currentQueries && (currentQueries = currentQueries.clone());
        previousOrParentTNode.flags |= 16384 /* hasContentQuery */;
    }
    return currentQueries || (currentQueries = new QueryType(null, null, null));
}
/** *
 * This property gets set before entering a template.
  @type {?} */
let creationMode;
/**
 * @return {?}
 */
export function getCreationMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return creationMode;
}
/** *
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
  @type {?} */
let viewData;
/**
 * Internal function that returns the current LViewData instance.
 *
 * The getCurrentView() instruction should be used for anything public.
 * @return {?}
 */
export function _getViewData() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return viewData;
}
/** *
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
  @type {?} */
let contextViewData = /** @type {?} */ ((null));
/** *
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
  @type {?} */
let directives;
/**
 * @param {?} view
 * @return {?}
 */
function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = []);
}
/**
 * @param {?} view
 * @return {?}
 */
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
}
/** *
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
  @type {?} */
let checkNoChangesMode = false;
/** *
 * Whether or not this is the first time the current view has been processed.
  @type {?} */
let firstTemplatePass = true;
/** *
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.hostBindingStartIndex + any hostVars before the given dir.
  @type {?} */
let bindingRootIndex = -1;
/**
 * @return {?}
 */
export function getBindingRoot() {
    return bindingRootIndex;
}
/** @enum {number} */
var BindingDirection = {
    Input: 0,
    Output: 1,
};
/**
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param {?} newView New state to become active
 * @param {?} hostTNode
 * @return {?} the previous state;
 */
export function enterView(newView, hostTNode) {
    /** @type {?} */
    const oldView = viewData;
    directives = newView && newView[DIRECTIVES];
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    bindingRootIndex = newView && tView.bindingStartIndex;
    renderer = newView && newView[RENDERER];
    previousOrParentTNode = /** @type {?} */ ((hostTNode));
    isParent = true;
    viewData = contextViewData = newView;
    oldView && (oldView[QUERIES] = currentQueries);
    currentQueries = newView && newView[QUERIES];
    return oldView;
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 *
 * @param {?} newView New state to become active
 * @param {?=} creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 * @return {?}
 */
export function leaveView(newView, creationOnly) {
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(/** @type {?} */ ((directives)), tView.viewHooks, tView.viewCheckHooks, creationMode);
        }
        // Views are clean and in update mode after being checked, so these bits are cleared
        viewData[FLAGS] &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    }
    viewData[FLAGS] |= 16 /* RunInit */;
    viewData[BINDING_INDEX] = tView.bindingStartIndex;
    enterView(newView, null);
}
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * @return {?}
 */
function refreshDescendantViews() {
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
    }
    refreshDynamicEmbeddedViews(viewData);
    // Content query results must be refreshed before content hooks are called.
    refreshContentQueries(tView);
    if (!checkNoChangesMode) {
        executeHooks(/** @type {?} */ ((directives)), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    setHostBindings(tView.hostBindings);
    refreshChildComponents(tView.components);
}
/**
 * Sets the host bindings for the current view.
 * @param {?} bindings
 * @return {?}
 */
export function setHostBindings(bindings) {
    if (bindings != null) {
        bindingRootIndex = viewData[BINDING_INDEX] = tView.hostBindingStartIndex;
        /** @type {?} */
        const defs = /** @type {?} */ ((tView.directives));
        for (let i = 0; i < bindings.length; i += 2) {
            /** @type {?} */
            const dirIndex = bindings[i];
            /** @type {?} */
            const def = /** @type {?} */ (defs[dirIndex]); /** @type {?} */
            ((def.hostBindings))(dirIndex, bindings[i + 1]);
            bindingRootIndex = viewData[BINDING_INDEX] = bindingRootIndex + def.hostVars;
        }
    }
}
/**
 * Refreshes content queries for all directives in the given view.
 * @param {?} tView
 * @return {?}
 */
function refreshContentQueries(tView) {
    if (tView.contentQueries != null) {
        for (let i = 0; i < tView.contentQueries.length; i += 2) {
            /** @type {?} */
            const directiveDefIdx = tView.contentQueries[i];
            /** @type {?} */
            const directiveDef = /** @type {?} */ ((tView.directives))[directiveDefIdx]; /** @type {?} */
            ((directiveDef.contentQueriesRefresh))(directiveDefIdx, tView.contentQueries[i + 1]);
        }
    }
}
/**
 * Refreshes child components in the current view.
 * @param {?} components
 * @return {?}
 */
function refreshChildComponents(components) {
    if (components != null) {
        for (let i = 0; i < components.length; i++) {
            componentRefresh(components[i]);
        }
    }
}
/**
 * @return {?}
 */
export function executeInitAndContentHooks() {
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
        executeHooks(/** @type {?} */ ((directives)), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
/**
 * @template T
 * @param {?} renderer
 * @param {?} tView
 * @param {?} context
 * @param {?} flags
 * @param {?=} sanitizer
 * @return {?}
 */
export function createLViewData(renderer, tView, context, flags, sanitizer) {
    /** @type {?} */
    const instance = /** @type {?} */ (tView.blueprint.slice());
    instance[PARENT] = viewData;
    instance[FLAGS] = flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */;
    instance[CONTEXT] = context;
    instance[INJECTOR] = viewData ? viewData[INJECTOR] : null;
    instance[RENDERER] = renderer;
    instance[SANITIZER] = sanitizer || null;
    return instance;
}
/**
 * Creation of LNode object is extracted to a separate function so we always create LNode object
 * with the same shape
 * (same properties assigned in the same order).
 * @param {?} type
 * @param {?} nodeInjector
 * @param {?} native
 * @param {?} state
 * @return {?}
 */
export function createLNodeObject(type, nodeInjector, native, state) {
    return {
        native: /** @type {?} */ (native),
        nodeInjector: nodeInjector,
        data: state,
        dynamicLContainerNode: null
    };
}
/**
 * @param {?} index
 * @param {?} type
 * @param {?} native
 * @param {?} name
 * @param {?} attrs
 * @param {?=} state
 * @return {?}
 */
export function createNodeAtIndex(index, type, native, name, attrs, state) {
    /** @type {?} */
    const parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    /** @type {?} */
    const parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
    /** @type {?} */
    const tParent = parentInSameView ? /** @type {?} */ (parent) : null;
    /** @type {?} */
    const isState = state != null;
    /** @type {?} */
    const node = createLNodeObject(type, null, native, isState ? /** @type {?} */ (state) : null);
    /** @type {?} */
    let tNode;
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in tView.node.
        tNode = (state ? (/** @type {?} */ (state))[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        /** @type {?} */
        const adjustedIndex = index + HEADER_OFFSET;
        /** @type {?} */
        const tData = tView.data;
        ngDevMode && assertLessThan(adjustedIndex, viewData.length, `Slot should have been initialized with null`);
        viewData[adjustedIndex] = node;
        if (tData[adjustedIndex] == null) {
            /** @type {?} */
            const tNode = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentTNode) {
                previousOrParentTNode.next = tNode;
                if (previousOrParentTNode.dynamicContainerNode)
                    previousOrParentTNode.dynamicContainerNode.next = tNode;
            }
        }
        tNode = /** @type {?} */ (tData[adjustedIndex]);
        if (!tView.firstChild && type === 3 /* Element */) {
            tView.firstChild = tNode;
        }
        // Now link ourselves into the tree.
        if (isParent && previousOrParentTNode) {
            if (previousOrParentTNode.child == null && parentInSameView ||
                previousOrParentTNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                previousOrParentTNode.child = tNode;
            }
        }
    }
    // TODO: temporary, remove this when removing nodeInjector (bringing in fns to hello world)
    if (index !== -1 && !(viewData[FLAGS] & 64 /* IsRoot */)) {
        /** @type {?} */
        const parentLNode = type === 2 /* View */ ?
            getContainerNode(tNode, /** @type {?} */ (state)) :
            getParentOrContainerNode(tNode, viewData);
        parentLNode && (node.nodeInjector = parentLNode.nodeInjector);
    }
    // View nodes and host elements need to set their host node (components do not save host TNodes)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        /** @type {?} */
        const lViewData = /** @type {?} */ (state);
        ngDevMode &&
            assertEqual(lViewData[HOST_NODE], null, 'lViewData[HOST_NODE] should not have been initialized');
        lViewData[HOST_NODE] = /** @type {?} */ (tNode);
        if (lViewData[TVIEW].firstTemplatePass) {
            lViewData[TVIEW].node = /** @type {?} */ (tNode);
        }
    }
    previousOrParentTNode = tNode;
    isParent = true;
    return /** @type {?} */ (tNode);
}
/**
 * When LNodes are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 * @param {?} view
 * @return {?}
 */
export function adjustBlueprintForNewNode(view) {
    /** @type {?} */
    const tView = view[TVIEW];
    if (tView.firstTemplatePass) {
        tView.hostBindingStartIndex++;
        tView.blueprint.push(null);
        view.push(null);
    }
}
/**
 * Resets the application state.
 * @return {?}
 */
export function resetComponentState() {
    isParent = false;
    previousOrParentTNode = /** @type {?} */ ((null));
    elementDepthCount = 0;
}
/**
 *
 * @template T
 * @param {?} hostNode Existing node to render into.
 * @param {?} templateFn Template function with the instructions.
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars
 * @param {?} context to pass into the template.
 * @param {?} providedRendererFactory renderer factory to use
 * @param {?} host The host element node to use
 * @param {?=} directives Directive defs that should be used for matching
 * @param {?=} pipes Pipe defs that should be used for matching
 * @param {?=} sanitizer
 * @return {?}
 */
export function renderTemplate(hostNode, templateFn, consts, vars, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetComponentState();
        rendererFactory = providedRendererFactory;
        renderer = providedRendererFactory.createRenderer(null, null);
        // We need to create a root view so it's possible to look up the host element through its index
        tView = createTView(-1, null, 1, 0, null, null, null);
        viewData = createLViewData(renderer, tView, {}, 2 /* CheckAlways */ | 64 /* IsRoot */);
        /** @type {?} */
        const componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        /** @type {?} */
        const componentLView = createLViewData(renderer, componentTView, context, 2 /* CheckAlways */, sanitizer);
        createNodeAtIndex(0, 3 /* Element */, hostNode, null, null, componentLView);
        host = loadElement(0);
    }
    /** @type {?} */
    const hostView = /** @type {?} */ ((host.data));
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(hostView, context, templateFn);
    return host;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 * @template T
 * @param {?} tView
 * @param {?} context
 * @param {?} declarationView
 * @param {?} renderer
 * @param {?=} queries
 * @return {?}
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries) {
    /** @type {?} */
    const _isParent = isParent;
    /** @type {?} */
    const _previousOrParentTNode = previousOrParentTNode;
    isParent = true;
    previousOrParentTNode = /** @type {?} */ ((null));
    /** @type {?} */
    const lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    createNodeAtIndex(-1, 2 /* View */, null, null, null, lView);
    isParent = _isParent;
    previousOrParentTNode = _previousOrParentTNode;
    return lView;
}
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor inside
 * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
 * can't store TViews in the template function itself (as we do for comps). Instead, we store the
 * TView for dynamically created views on their host TNode, which only has one instance.
 * @template T
 * @param {?} viewToRender
 * @param {?} tView
 * @param {?} context
 * @param {?} rf
 * @return {?}
 */
export function renderEmbeddedTemplate(viewToRender, tView, context, rf) {
    /** @type {?} */
    const _isParent = isParent;
    /** @type {?} */
    const _previousOrParentTNode = previousOrParentTNode;
    /** @type {?} */
    let oldView;
    if (viewToRender[FLAGS] & 64 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(/** @type {?} */ (viewToRender[CONTEXT]));
    }
    else {
        try {
            isParent = true;
            previousOrParentTNode = /** @type {?} */ ((null));
            oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
            namespaceHTML(); /** @type {?} */
            ((tView.template))(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews();
            }
            else {
                viewToRender[TVIEW].firstTemplatePass = firstTemplatePass = false;
            }
        }
        finally {
            /** @type {?} */
            const isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(/** @type {?} */ ((oldView)), isCreationOnly);
            isParent = _isParent;
            previousOrParentTNode = _previousOrParentTNode;
        }
    }
}
/**
 * Retrieves a context at the level specified and saves it as the global, contextViewData.
 * Will get the next level up if level is not specified.
 *
 * This is used to save contexts of parent views so they can be bound in embedded views, or
 * in conjunction with reference() to bind a ref from a parent view.
 *
 * @template T
 * @param {?=} level The relative level of the view from which to grab context compared to contextVewData
 * @return {?} context
 */
export function nextContext(level = 1) {
    contextViewData = walkUpViews(level, /** @type {?} */ ((contextViewData)));
    return /** @type {?} */ (contextViewData[CONTEXT]);
}
/**
 * @template T
 * @param {?} hostView
 * @param {?} componentOrContext
 * @param {?=} templateFn
 * @return {?}
 */
export function renderComponentOrTemplate(hostView, componentOrContext, templateFn) {
    /** @type {?} */
    const oldView = enterView(hostView, hostView[HOST_NODE]);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (templateFn) {
            namespaceHTML();
            templateFn(getRenderFlags(hostView), /** @type {?} */ ((componentOrContext)));
            refreshDescendantViews();
        }
        else {
            executeInitAndContentHooks();
            // Element was stored at 0 in data and directive was stored at 0 in directives
            // in renderComponent()
            setHostBindings(tView.hostBindings);
            componentRefresh(HEADER_OFFSET);
        }
    }
    finally {
        if (rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView);
    }
}
/**
 * This function returns the default configuration of rendering flags depending on when the
 * template is in creation mode or update mode. By default, the update block is run with the
 * creation block when the view is in creation mode. Otherwise, the update block is run
 * alone.
 *
 * Dynamically created views do NOT use this configuration (update block and create block are
 * always run separately).
 * @param {?} view
 * @return {?}
 */
function getRenderFlags(view) {
    return view[FLAGS] & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
/** @type {?} */
let _currentNamespace = null;
/**
 * @return {?}
 */
export function namespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg/';
}
/**
 * @return {?}
 */
export function namespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
}
/**
 * @return {?}
 */
export function namespaceHTML() {
    _currentNamespace = null;
}
/**
 * Creates an empty element using {\@link elementStart} and {\@link elementEnd}
 *
 * @param {?} index Index of the element in the data array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @return {?}
 */
export function element(index, name, attrs, localRefs) {
    elementStart(index, name, attrs, localRefs);
    elementEnd();
}
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * @param {?} index Index of the element in the LViewData array
 * @param {?=} attrs Set of attributes to be used when matching directives.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 * @return {?}
 */
export function elementContainerStart(index, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    /** @type {?} */
    const native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    /** @type {?} */
    const tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null, null);
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(localRefs);
}
/**
 * Mark the end of the <ng-container>.
 * @return {?}
 */
export function elementContainerEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = /** @type {?} */ ((previousOrParentTNode.parent));
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(/** @type {?} */ (previousOrParentTNode)));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
}
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param {?} index Index of the element in the LViewData array
 * @param {?} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 * @return {?}
 */
export function elementStart(index, name, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    /** @type {?} */
    const native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    /** @type {?} */
    const tNode = createNodeAtIndex(index, 3 /* Element */, /** @type {?} */ ((native)), name, attrs || null, null);
    if (attrs) {
        setUpAttributes(native, attrs);
    }
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(localRefs);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (elementDepthCount === 0) {
        attachPatchData(native, viewData);
    }
    elementDepthCount++;
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param {?} name the tag name
 * @param {?=} overriddenRenderer Optional A renderer to override the default one
 * @return {?} the element created
 */
export function elementCreate(name, overriddenRenderer) {
    /** @type {?} */
    let native;
    /** @type {?} */
    const rendererToUse = overriddenRenderer || renderer;
    if (isProceduralRenderer(rendererToUse)) {
        native = rendererToUse.createElement(name, _currentNamespace);
    }
    else {
        if (_currentNamespace === null) {
            native = rendererToUse.createElement(name);
        }
        else {
            native = rendererToUse.createElementNS(_currentNamespace, name);
        }
    }
    return native;
}
/**
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
function nativeNodeLocalRefExtractor(tNode, currentView) {
    return getLNode(tNode, currentView).native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param {?} localRefs Local refs of the node in question
 * @param {?=} localRefExtractor mapping function that extracts local ref value from LNode
 * @return {?}
 */
function createDirectivesAndLocals(localRefs, localRefExtractor = nativeNodeLocalRefExtractor) {
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(previousOrParentTNode, tView, localRefs || null);
    }
    else {
        instantiateDirectivesDirectly();
    }
    saveResolvedLocalsInData(localRefExtractor);
}
/**
 * On first template pass, we match each node against available directive selectors and save
 * the resulting defs in the correct instantiation order for subsequent change detection runs
 * (so dependencies are always created before the directives that inject them).
 * @param {?} tNode
 * @param {?} tView
 * @param {?} localRefs
 * @return {?}
 */
function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
    /** @type {?} */
    const exportsMap = localRefs ? { '': -1 } : null;
    /** @type {?} */
    const matches = tView.currentMatches = findDirectiveMatches(tNode);
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            /** @type {?} */
            const def = /** @type {?} */ (matches[i]);
            /** @type {?} */
            const valueIndex = i + 1;
            resolveDirective(def, valueIndex, matches, tView);
            saveNameToExportMap(/** @type {?} */ (matches[valueIndex]), def, exportsMap);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
}
/**
 * Matches the current node against all available selectors.
 * @param {?} tNode
 * @return {?}
 */
function findDirectiveMatches(tNode) {
    /** @type {?} */
    const registry = tView.directiveRegistry;
    /** @type {?} */
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            /** @type {?} */
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, /** @type {?} */ ((def.selectors)))) {
                matches || (matches = []);
                if ((/** @type {?} */ (def)).template) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    addComponentLogic(/** @type {?} */ (def));
                    tNode.flags = 4096 /* isComponent */;
                    // The component is always stored first with directives after.
                    matches.unshift(def, null);
                }
                else {
                    matches.push(def, null);
                }
                if (def.diPublic)
                    def.diPublic(def);
            }
        }
    }
    return /** @type {?} */ (matches);
}
/**
 * @param {?} def
 * @param {?} valueIndex
 * @param {?} matches
 * @param {?} tView
 * @return {?}
 */
export function resolveDirective(def, valueIndex, matches, tView) {
    if (matches[valueIndex] === null) {
        matches[valueIndex] = CIRCULAR;
        /** @type {?} */
        const instance = def.factory();
        (tView.directives || (tView.directives = [])).push(def);
        return directiveCreate(matches[valueIndex] = /** @type {?} */ ((tView.directives)).length - 1, instance, def);
    }
    else if (matches[valueIndex] === CIRCULAR) {
        // If we revisit this directive before it's resolved, we know it's circular
        throwCyclicDependencyError(def.type);
    }
    return null;
}
/**
 * Stores index of component's host element so it will be queued for view refresh during CD.
 * @return {?}
 */
function queueComponentIndexForCheck() {
    if (firstTemplatePass) {
        (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
    }
}
/**
 * Stores index of directive and host element so it will be queued for binding refresh during CD.
 * @param {?} dirIndex
 * @param {?} hostVars
 * @return {?}
 */
export function queueHostBindingForCheck(dirIndex, hostVars) {
    // Must subtract the header offset because hostBindings functions are generated with
    // instructions that expect element indices that are NOT adjusted (e.g. elementProperty).
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    for (let i = 0; i < hostVars; i++) {
        tView.blueprint.push(NO_CHANGE);
        viewData.push(NO_CHANGE);
    }
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, previousOrParentTNode.index - HEADER_OFFSET);
}
/**
 * This function instantiates the given directives.
 * @return {?}
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, `Directives should only be instantiated directly after first template pass`);
    /** @type {?} */
    const count = previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(previousOrParentTNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        /** @type {?} */
        const start = previousOrParentTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const end = start + count;
        /** @type {?} */
        const tDirectives = /** @type {?} */ ((tView.directives));
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = tDirectives[i];
            // Component view must be set on node before the factory is created so
            // ChangeDetectorRefs have a way to store component view on creation.
            if ((/** @type {?} */ (def)).template) {
                addComponentLogic(/** @type {?} */ (def));
            }
            directiveCreate(i, def.factory(), def);
        }
    }
}
/**
 * Caches local names and their matching directive indices for query and template lookups.
 * @param {?} tNode
 * @param {?} localRefs
 * @param {?} exportsMap
 * @return {?}
 */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        /** @type {?} */
        const localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let i = 0; i < localRefs.length; i += 2) {
            /** @type {?} */
            const index = exportsMap[localRefs[i + 1]];
            if (index == null)
                throw new Error(`Export of name '${localRefs[i + 1]}' not found!`);
            localNames.push(localRefs[i], index);
        }
    }
}
/**
 * Builds up an export map as directives are created, so local refs can be quickly mapped
 * to their directive instances.
 * @param {?} index
 * @param {?} def
 * @param {?} exportsMap
 * @return {?}
 */
function saveNameToExportMap(index, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs)
            exportsMap[def.exportAs] = index;
        if ((/** @type {?} */ (def)).template)
            exportsMap[''] = index;
    }
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LViewData in the same order as they are loaded in the template with load().
 * @param {?} localRefExtractor
 * @return {?}
 */
function saveResolvedLocalsInData(localRefExtractor) {
    /** @type {?} */
    const localNames = previousOrParentTNode.localNames;
    /** @type {?} */
    const tNode = /** @type {?} */ (previousOrParentTNode);
    if (localNames) {
        /** @type {?} */
        let localIndex = previousOrParentTNode.index + 1;
        for (let i = 0; i < localNames.length; i += 2) {
            /** @type {?} */
            const index = /** @type {?} */ (localNames[i + 1]);
            /** @type {?} */
            const value = index === -1 ? localRefExtractor(tNode, viewData) : /** @type {?} */ ((directives))[index];
            viewData[localIndex++] = value;
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param {?} templateFn The template from which to get static data
 * @param {?} consts The number of nodes, local refs, and pipes in this view
 * @param {?} vars The number of bindings and pure function bindings in this view
 * @param {?} directives Directive defs that should be saved on TView
 * @param {?} pipes Pipe defs that should be saved on TView
 * @param {?} viewQuery
 * @return {?} TView
 */
function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return templateFn.ngPrivateData ||
        (templateFn.ngPrivateData = /** @type {?} */ (createTView(-1, templateFn, consts, vars, directives, pipes, viewQuery)));
}
/**
 * Creates a TView instance
 *
 * @param {?} viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param {?} templateFn Template function
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars
 * @param {?} directives Registry of directives for this view
 * @param {?} pipes Registry of pipes for this view
 * @param {?} viewQuery
 * @return {?}
 */
export function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    /** @type {?} */
    const bindingStartIndex = HEADER_OFFSET + consts;
    /** @type {?} */
    const initialViewLength = bindingStartIndex + vars;
    /** @type {?} */
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[TVIEW] = {
        id: viewIndex,
        blueprint: blueprint,
        template: templateFn,
        viewQuery: viewQuery,
        node: /** @type {?} */ ((null)),
        data: HEADER_FILLER.slice(),
        // Fill in to match HEADER_OFFSET in LViewData
        childIndex: -1,
        // Children set in addToViewTree(), if any
        bindingStartIndex: bindingStartIndex,
        hostBindingStartIndex: initialViewLength,
        directives: null,
        firstTemplatePass: true,
        initHooks: null,
        checkHooks: null,
        contentHooks: null,
        contentCheckHooks: null,
        viewHooks: null,
        viewCheckHooks: null,
        destroyHooks: null,
        pipeDestroyHooks: null,
        cleanup: null,
        hostBindings: null,
        contentQueries: null,
        components: null,
        directiveRegistry: typeof directives === 'function' ? directives() : directives,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
        currentMatches: null,
        firstChild: null,
    };
}
/**
 * @param {?} bindingStartIndex
 * @param {?} initialViewLength
 * @return {?}
 */
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    /** @type {?} */
    const blueprint = /** @type {?} */ (new Array(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex));
    blueprint[CONTAINER_INDEX] = -1;
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
/**
 * @param {?} native
 * @param {?} attrs
 * @return {?}
 */
function setUpAttributes(native, attrs) {
    /** @type {?} */
    const isProc = isProceduralRenderer(renderer);
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        const attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === NG_PROJECT_AS_ATTR_NAME) {
            i += 2;
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (attrName === 0 /* NamespaceURI */) {
                /** @type {?} */
                const namespaceURI = /** @type {?} */ (attrs[i + 1]);
                /** @type {?} */
                const attrName = /** @type {?} */ (attrs[i + 2]);
                /** @type {?} */
                const attrVal = /** @type {?} */ (attrs[i + 3]);
                isProc ?
                    (/** @type {?} */ (renderer))
                        .setAttribute(native, attrName, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName, attrVal);
                i += 4;
            }
            else {
                /** @type {?} */
                const attrVal = attrs[i + 1];
                isProc ?
                    (/** @type {?} */ (renderer))
                        .setAttribute(native, /** @type {?} */ (attrName), /** @type {?} */ (attrVal)) :
                    native.setAttribute(/** @type {?} */ (attrName), /** @type {?} */ (attrVal));
                i += 2;
            }
        }
    }
}
/**
 * @param {?} text
 * @param {?} token
 * @return {?}
 */
export function createError(text, token) {
    return new Error(`Renderer: ${text} [${stringify(token)}]`);
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param {?} factory
 * @param {?} elementOrSelector Render element or CSS selector to locate the element.
 * @return {?}
 */
export function locateHostElement(factory, elementOrSelector) {
    ngDevMode && assertDataInRange(-1);
    rendererFactory = factory;
    /** @type {?} */
    const defaultRenderer = factory.createRenderer(null, null);
    /** @type {?} */
    const rNode = typeof elementOrSelector === 'string' ?
        (isProceduralRenderer(defaultRenderer) ?
            defaultRenderer.selectRootElement(elementOrSelector) :
            defaultRenderer.querySelector(elementOrSelector)) :
        elementOrSelector;
    if (ngDevMode && !rNode) {
        if (typeof elementOrSelector === 'string') {
            throw createError('Host node with selector not found:', elementOrSelector);
        }
        else {
            throw createError('Host node is required:', elementOrSelector);
        }
    }
    return rNode;
}
/**
 * Creates the host LNode.
 *
 * @param {?} tag
 * @param {?} rNode Render host element.
 * @param {?} def ComponentDef
 *
 * @param {?=} sanitizer
 * @return {?} LElementNode created
 */
export function hostElement(tag, rNode, def, sanitizer) {
    resetComponentState();
    /** @type {?} */
    const tNode = createNodeAtIndex(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
    if (firstTemplatePass) {
        tNode.flags = 4096 /* isComponent */;
        if (def.diPublic)
            def.diPublic(def);
        tView.directives = [def];
    }
    return viewData[HEADER_OFFSET];
}
/**
 * Adds an event listener to the current node.
 *
 * If an output exists on one of the node's directives, it also subscribes to the output
 * and saves the subscription for later cleanup.
 *
 * @param {?} eventName Name of the event
 * @param {?} listenerFn The function to be called when event emits
 * @param {?=} useCapture Whether or not to use capture in event listener.
 * @return {?}
 */
export function listener(eventName, listenerFn, useCapture = false) {
    /** @type {?} */
    const tNode = previousOrParentTNode;
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        /** @type {?} */
        const node = /** @type {?} */ (getPreviousOrParentNode());
        ngDevMode && ngDevMode.rendererAddEventListener++;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            /** @type {?} */
            const cleanupFn = renderer.listen(node.native, eventName, listenerFn);
            storeCleanupFn(viewData, cleanupFn);
        }
        else {
            /** @type {?} */
            const wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            node.native.addEventListener(eventName, wrappedListener, useCapture);
            /** @type {?} */
            const cleanupInstances = getCleanup(viewData);
            cleanupInstances.push(wrappedListener);
            if (firstTemplatePass) {
                getTViewCleanup(viewData).push(eventName, tNode.index, /** @type {?} */ ((cleanupInstances)).length - 1, useCapture);
            }
        }
    }
    // subscribe to directive outputs
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tNode.flags, 1 /* Output */);
    }
    /** @type {?} */
    const outputs = tNode.outputs;
    /** @type {?} */
    let outputData;
    if (outputs && (outputData = outputs[eventName])) {
        createOutput(outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 * @param {?} outputs
 * @param {?} listener
 * @return {?}
 */
function createOutput(outputs, listener) {
    for (let i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(/** @type {?} */ (outputs[i]), /** @type {?} */ ((directives)));
        /** @type {?} */
        const subscription = /** @type {?} */ ((directives))[/** @type {?} */ (outputs[i])][outputs[i + 1]].subscribe(listener);
        storeCleanupWithContext(viewData, subscription, subscription.unsubscribe);
    }
}
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 * @param {?} view
 * @param {?} context
 * @param {?} cleanupFn
 * @return {?}
 */
export function storeCleanupWithContext(view, context, cleanupFn) {
    if (!view)
        view = viewData;
    getCleanup(view).push(context);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(cleanupFn, /** @type {?} */ ((view[CLEANUP])).length - 1);
    }
}
/**
 * Saves the cleanup function itself in LView.cleanupInstances.
 *
 * This is necessary for functions that are wrapped with their contexts, like in renderer2
 * listeners.
 *
 * On the first template pass, the index of the cleanup function is saved in TView.
 * @param {?} view
 * @param {?} cleanupFn
 * @return {?}
 */
export function storeCleanupFn(view, cleanupFn) {
    getCleanup(view).push(cleanupFn);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(/** @type {?} */ ((view[CLEANUP])).length - 1, null);
    }
}
/**
 * Mark the end of the element.
 * @return {?}
 */
export function elementEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = /** @type {?} */ ((previousOrParentTNode.parent));
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(/** @type {?} */ (previousOrParentTNode)));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
    elementDepthCount--;
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param {?} index
 * @param {?} name name The name of the attribute.
 * @param {?} value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @return {?}
 */
export function elementAttribute(index, name, value, sanitizer) {
    if (value !== NO_CHANGE) {
        /** @type {?} */
        const element = loadElement(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            /** @type {?} */
            const strValue = sanitizer == null ? stringify(value) : sanitizer(value);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element.native, name, strValue) :
                element.native.setAttribute(name, strValue);
        }
    }
}
/**
 * Update a property on an Element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new \@Inputs don't have to be re-compiled.
 *
 * @template T
 * @param {?} index The index of the element to update in the data array
 * @param {?} propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value New value to write.
 * @param {?=} sanitizer An optional function used to sanitize the value.
 * @return {?}
 */
export function elementProperty(index, propName, value, sanitizer) {
    if (value === NO_CHANGE)
        return;
    /** @type {?} */
    const node = /** @type {?} */ (loadElement(index));
    /** @type {?} */
    const tNode = getTNode(index);
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
    }
    /** @type {?} */
    const inputData = tNode && tNode.inputs;
    /** @type {?} */
    let dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        markDirtyIfOnPush(node);
    }
    else {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? (/** @type {?} */ (sanitizer(value))) : value;
        /** @type {?} */
        const native = node.native;
        ngDevMode && ngDevMode.rendererSetProperty++;
        isProceduralRenderer(renderer) ? renderer.setProperty(native, propName, value) :
            (native.setProperty ? native.setProperty(propName, value) :
                (/** @type {?} */ (native))[propName] = value);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param {?} type The type of the node
 * @param {?} adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param {?} tagName The tag name of the node
 * @param {?} attrs The attributes defined on this node
 * @param {?} parent The parent of this node
 * @param {?} tViews Any TViews attached to this node
 * @return {?} the TNode object
 */
export function createTNode(type, adjustedIndex, tagName, attrs, parent, tViews) {
    ngDevMode && ngDevMode.tNode++;
    return {
        type: type,
        index: adjustedIndex,
        flags: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: null,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        tViews: tViews,
        next: null,
        child: null,
        parent: parent,
        dynamicContainerNode: null,
        detached: null,
        stylingTemplate: null,
        projection: null
    };
}
/**
 * Given a list of directive indices and minified input names, sets the
 * input properties on the corresponding directives.
 * @param {?} inputs
 * @param {?} value
 * @return {?}
 */
function setInputsForProperty(inputs, value) {
    for (let i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(/** @type {?} */ (inputs[i]), /** @type {?} */ ((directives))); /** @type {?} */
        ((directives))[/** @type {?} */ (inputs[i])][inputs[i + 1]] = value;
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param {?} tNodeFlags
 * @param {?} direction
 * @return {?} PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNodeFlags, direction) {
    /** @type {?} */
    const count = tNodeFlags & 4095 /* DirectiveCountMask */;
    /** @type {?} */
    let propStore = null;
    if (count > 0) {
        /** @type {?} */
        const start = tNodeFlags >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const end = start + count;
        /** @type {?} */
        const isInput = direction === 0 /* Input */;
        /** @type {?} */
        const defs = /** @type {?} */ ((tView.directives));
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const directiveDef = /** @type {?} */ (defs[i]);
            /** @type {?} */
            const propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (let publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    /** @type {?} */
                    const internalName = propertyAliasMap[publicName];
                    /** @type {?} */
                    const hasProperty = propStore.hasOwnProperty(publicName);
                    hasProperty ? propStore[publicName].push(i, internalName) :
                        (propStore[publicName] = [i, internalName]);
                }
            }
        }
    }
    return propStore;
}
/**
 * Add or remove a class in a `classList` on a DOM element.
 *
 * This instruction is meant to handle the [class.foo]="exp" case
 *
 * @template T
 * @param {?} index The index of the element to update in the data array
 * @param {?} stylingIndex
 * @param {?} value A value indicating if a given class should be added or removed.
 * @return {?}
 */
export function elementClassProp(index, stylingIndex, value) {
    updateElementClassProp(getStylingContext(index), stylingIndex, value ? true : false);
}
/**
 * Assign any inline style values to the element during creation mode.
 *
 * This instruction is meant to be called during creation mode to apply all styling
 * (e.g. `style="..."`) values to the element. This is also where the provided index
 * value is allocated for the styling details for its corresponding element (the element
 * index is the previous index value from this one).
 *
 * (Note this function calls `elementStylingApply` immediately when called.)
 *
 *
 * @template T
 * @param {?=} classDeclarations A key/value array of CSS classes that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any classes placed on the element by multiple (`[class]`) or singular (`[class.named]`)
 *   bindings. If a class binding changes its value to a falsy value then the matching initial
 *   class value that are passed in here will be applied to the element (if matched).
 * @param {?=} styleDeclarations A key/value array of CSS styles that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any styles placed on the element by multiple (`[style]`) or singular (`[style.prop]`)
 *   bindings. If a style binding changes its value to null then the initial styling
 *   values that are passed in here will be applied to the element (if matched).
 * @param {?=} styleSanitizer An optional sanitizer function that will be used (if provided)
 *   to sanitize the any CSS property values that are applied to the element (during rendering).
 * @return {?}
 */
export function elementStyling(classDeclarations, styleDeclarations, styleSanitizer) {
    /** @type {?} */
    const tNode = previousOrParentTNode;
    if (!tNode.stylingTemplate) {
        // initialize the styling template.
        tNode.stylingTemplate =
            createStylingContextTemplate(classDeclarations, styleDeclarations, styleSanitizer);
    }
    if (styleDeclarations && styleDeclarations.length ||
        classDeclarations && classDeclarations.length) {
        elementStylingApply(tNode.index - HEADER_OFFSET);
    }
}
/**
 * Retrieve the `StylingContext` at a given index.
 *
 * This method lazily creates the `StylingContext`. This is because in most cases
 * we have styling without any bindings. Creating `StylingContext` eagerly would mean that
 * every style declaration such as `<div style="color: red">` would result `StyleContext`
 * which would create unnecessary memory pressure.
 *
 * @param {?} index Index of the style allocation. See: `elementStyling`.
 * @return {?}
 */
function getStylingContext(index) {
    /** @type {?} */
    let stylingContext = load(index);
    if (!Array.isArray(stylingContext)) {
        /** @type {?} */
        const lElement = /** @type {?} */ ((stylingContext));
        /** @type {?} */
        const tNode = getTNode(index);
        ngDevMode &&
            assertDefined(tNode.stylingTemplate, 'getStylingContext() called before elementStyling()');
        stylingContext = viewData[index + HEADER_OFFSET] =
            allocStylingContext(lElement, /** @type {?} */ ((tNode.stylingTemplate)));
    }
    return stylingContext;
}
/**
 * Apply all styling values to the element which have been queued by any styling instructions.
 *
 * This instruction is meant to be run once one or more `elementStyle` and/or `elementStyleProp`
 * have been issued against the element. This function will also determine if any styles have
 * changed and will then skip the operation if there is nothing new to render.
 *
 * Once called then all queued styles will be flushed.
 *
 * @template T
 * @param {?} index Index of the element's styling storage that will be rendered.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @return {?}
 */
export function elementStylingApply(index) {
    renderElementStyles(getStylingContext(index), renderer);
}
/**
 * Queue a given style to be rendered on an Element.
 *
 * If the style value is `null` then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `elementStyle` or any styles that are present
 * from when the element was created (with `elementStyling`).
 *
 * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
 *
 * @template T
 * @param {?} index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param {?} styleIndex Index of the style property on this element. (Monotonically increasing.)
 * @param {?} value New value to write (null to remove).
 * @param {?=} suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @return {?}
 */
export function elementStyleProp(index, styleIndex, value, suffix) {
    /** @type {?} */
    let valueToAdd = null;
    if (value) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            valueToAdd = stringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a String value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            valueToAdd = /** @type {?} */ ((value));
        }
    }
    updateElementStyleProp(getStylingContext(index), styleIndex, valueToAdd);
}
/**
 * Queue a key/value map of styles to be rendered on an Element.
 *
 * This instruction is meant to handle the `[style]="exp"` usage. When styles are applied to
 * the Element they will then be placed with respect to any styles set with `elementStyleProp`.
 * If any styles are set to `null` then they will be removed from the element (unless the same
 * style properties have been assigned to the element during creation using `elementStyling`).
 *
 * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
 *
 * @template T
 * @param {?} index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param {?} classes A key/value style map of CSS classes that will be added to the given element.
 *        Any missing classes (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's list of CSS classes.
 * @param {?=} styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 * @return {?}
 */
export function elementStylingMap(index, classes, styles) {
    updateStylingMap(getStylingContext(index), classes, styles);
}
/**
 * Create static text node
 *
 * @param {?} index Index of the node in the data array
 * @param {?=} value Value to write. This value will be stringified.
 * @return {?}
 */
export function text(index, value) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    /** @type {?} */
    const textNative = createTextNode(value, renderer);
    /** @type {?} */
    const tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(textNative, tNode, viewData);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @template T
 * @param {?} index Index of the node in the data array.
 * @param {?} value Stringified value to write.
 * @return {?}
 */
export function textBinding(index, value) {
    if (value !== NO_CHANGE) {
        ngDevMode && assertDataInRange(index + HEADER_OFFSET);
        /** @type {?} */
        const existingNode = /** @type {?} */ ((loadElement(index)));
        ngDevMode && assertDefined(existingNode, 'LNode should exist');
        ngDevMode && assertDefined(existingNode.native, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
            existingNode.native.textContent = stringify(value);
    }
}
/**
 * Create a directive and their associated content queries.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @template T
 * @param {?} directiveDefIdx
 * @param {?} directive The directive instance.
 * @param {?} directiveDef DirectiveDef object which contains information about the template.
 * @return {?}
 */
export function directiveCreate(directiveDefIdx, directive, directiveDef) {
    /** @type {?} */
    const hostNode = getLNode(previousOrParentTNode, viewData);
    /** @type {?} */
    const instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef, hostNode);
    if ((/** @type {?} */ (directiveDef)).template) {
        /** @type {?} */ ((hostNode.data))[CONTEXT] = directive;
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(directiveDefIdx, directiveDef.onInit, directiveDef.doCheck, tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(directiveDefIdx, directiveDef.hostVars);
    }
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, instance, directiveDef.inputs, previousOrParentTNode);
    }
    if (directiveDef.contentQueries) {
        directiveDef.contentQueries();
    }
    return instance;
}
/**
 * @template T
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(def) {
    /** @type {?} */
    const hostNode = getLNode(previousOrParentTNode, viewData);
    /** @type {?} */
    const tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    /** @type {?} */
    const componentView = addToViewTree(viewData, /** @type {?} */ (previousOrParentTNode.index), createLViewData(rendererFactory.createRenderer(/** @type {?} */ (hostNode.native), def), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    (/** @type {?} */ (hostNode)).data = componentView;
    (/** @type {?} */ (componentView))[HOST_NODE] = /** @type {?} */ (previousOrParentTNode);
    if (firstTemplatePass)
        queueComponentIndexForCheck();
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 * @template T
 * @param {?} index
 * @param {?} directive
 * @param {?} directiveDef
 * @param {?} hostNode
 * @return {?}
 */
export function baseDirectiveCreate(index, directive, directiveDef, hostNode) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    attachPatchData(directive, viewData);
    if (hostNode) {
        attachPatchData(hostNode.native, viewData);
    }
    if (directives == null)
        viewData[DIRECTIVES] = directives = [];
    ngDevMode && assertDataNext(index, directives);
    directives[index] = directive;
    if (firstTemplatePass) {
        /** @type {?} */
        const flags = previousOrParentTNode.flags;
        if ((flags & 4095 /* DirectiveCountMask */) === 0) {
            // When the first directive is created:
            // - save the index,
            // - set the number of directives to 1
            previousOrParentTNode.flags =
                index << 15 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
        }
        else {
            // Only need to bump the size when subsequent directives are created
            ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
            previousOrParentTNode.flags++;
        }
    }
    else {
        /** @type {?} */
        const diPublic = /** @type {?} */ ((directiveDef)).diPublic;
        if (diPublic)
            diPublic(/** @type {?} */ ((directiveDef)));
    }
    if (/** @type {?} */ ((directiveDef)).attributes != null && previousOrParentTNode.type == 3 /* Element */) {
        setUpAttributes((/** @type {?} */ (hostNode)).native, /** @type {?} */ (((directiveDef)).attributes));
    }
    return directive;
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @template T
 * @param {?} directiveIndex Index of the directive in directives array
 * @param {?} instance Instance of the directive on which to set the initial inputs
 * @param {?} inputs The list of inputs from the directive def
 * @param {?} tNode The static data for this node
 * @return {?}
 */
function setInputsFromAttrs(directiveIndex, instance, inputs, tNode) {
    /** @type {?} */
    let initialInputData = /** @type {?} */ (tNode.initialInputs);
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    /** @type {?} */
    const initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (let i = 0; i < initialInputs.length; i += 2) {
            (/** @type {?} */ (instance))[initialInputs[i]] = initialInputs[i + 1];
        }
    }
}
/**
 * Generates initialInputData for a node and stores it in the template's static storage
 * so subsequent template invocations don't have to recalculate it.
 *
 * initialInputData is an array containing values that need to be set as input properties
 * for directives on this node, but only once on creation. We need this array to support
 * the case where you set an \@Input property of a directive using attribute-like syntax.
 * e.g. if you have a `name` \@Input, you can set it once like this:
 *
 * <my-component name="Bess"></my-component>
 *
 * @param {?} directiveIndex Index to store the initial input data
 * @param {?} inputs The list of inputs from the directive def
 * @param {?} tNode The static data on this node
 * @return {?}
 */
function generateInitialInputs(directiveIndex, inputs, tNode) {
    /** @type {?} */
    const initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    /** @type {?} */
    const attrs = /** @type {?} */ ((tNode.attrs));
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        const attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        /** @type {?} */
        const minifiedInputName = inputs[attrName];
        /** @type {?} */
        const attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            /** @type {?} */
            const inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, /** @type {?} */ (attrValue));
        }
        i += 2;
    }
    return initialInputData;
}
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param {?} currentView The parent view of the LContainer
 * @param {?=} isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @return {?} LContainer
 */
export function createLContainer(currentView, isForViewContainerRef) {
    return [
        isForViewContainerRef ? null : 0,
        currentView,
        null,
        null,
        // queries
        [],
        null
    ];
}
/**
 * Creates an LContainerNode for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param {?} index The index of the container in the data array
 * @param {?} templateFn Inline template
 * @param {?} consts The number of nodes, local refs, and pipes for this template
 * @param {?} vars The number of bindings for this template
 * @param {?=} tagName The name of the container element, if applicable
 * @param {?=} attrs The attrs attached to the container, if applicable
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @param {?=} localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 * @return {?}
 */
export function template(index, templateFn, consts, vars, tagName, attrs, localRefs, localRefExtractor) {
    /** @type {?} */
    const tNode = containerInternal(index, tagName || null, attrs || null);
    if (firstTemplatePass) {
        tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(localRefs, localRefExtractor);
    currentQueries &&
        (currentQueries = currentQueries.addNode(/** @type {?} */ (previousOrParentTNode)));
    queueLifecycleHooks(tNode.flags, tView);
    isParent = false;
}
/**
 * Creates an LContainerNode for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param {?} index The index of the container in the data array
 * @return {?}
 */
export function container(index) {
    /** @type {?} */
    const tNode = containerInternal(index, null, null);
    firstTemplatePass && (tNode.tViews = []);
    isParent = false;
}
/**
 * @param {?} index
 * @param {?} tagName
 * @param {?} attrs
 * @return {?}
 */
function containerInternal(index, tagName, attrs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
    /** @type {?} */
    const lContainer = createLContainer(viewData);
    ngDevMode && ngDevMode.rendererCreateComment++;
    /** @type {?} */
    const comment = renderer.createComment(ngDevMode ? 'container' : '');
    /** @type {?} */
    const tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs, lContainer);
    lContainer[RENDER_PARENT] = getRenderParent(tNode, viewData);
    appendChild(comment, tNode, viewData);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, lContainer);
    if (currentQueries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = currentQueries.container();
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    return tNode;
}
/**
 * Sets a container up to receive views.
 *
 * @param {?} index The index of the container in the data array
 * @return {?}
 */
export function containerRefreshStart(index) {
    previousOrParentTNode = /** @type {?} */ (loadInternal(index, tView.data));
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    isParent = true;
    // Inline containers cannot have style bindings, so we can read the value directly
    (/** @type {?} */ (viewData[previousOrParentTNode.index])).data[ACTIVE_INDEX] = 0;
    if (!checkNoChangesMode) {
        // We need to execute init hooks here so ngOnInit hooks are called in top level views
        // before they are called in embedded views (for backwards compatibility).
        executeInitHooks(viewData, tView, creationMode);
    }
}
/**
 * Marks the end of the LContainerNode.
 *
 * Marking the end of LContainerNode is the time when to child Views get inserted or removed.
 * @return {?}
 */
export function containerRefreshEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentTNode = /** @type {?} */ ((previousOrParentTNode.parent));
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    /** @type {?} */
    const lContainer = viewData[previousOrParentTNode.index].data;
    /** @type {?} */
    const nextIndex = lContainer[ACTIVE_INDEX];
    // remove extra views at the end of the container
    while (nextIndex < lContainer[VIEWS].length) {
        removeView(lContainer, /** @type {?} */ (previousOrParentTNode), nextIndex);
    }
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes them
 * by executing an associated template function.
 * @param {?} lViewData
 * @return {?}
 */
function refreshDynamicEmbeddedViews(lViewData) {
    for (let current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
        // Note: current can be an LViewData or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === null) {
            /** @type {?} */
            const container = /** @type {?} */ (current);
            for (let i = 0; i < container[VIEWS].length; i++) {
                /** @type {?} */
                const dynamicViewData = container[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], /** @type {?} */ ((dynamicViewData[CONTEXT])), 2 /* Update */);
            }
        }
    }
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param {?} lContainer to search for views
 * @param {?} tContainerNode to search for views
 * @param {?} startIdx starting index in the views array to search from
 * @param {?} viewBlockId exact view block id to look for
 * @return {?} index of a found view or -1 if not found
 */
function scanForView(lContainer, tContainerNode, startIdx, viewBlockId) {
    /** @type {?} */
    const views = lContainer[VIEWS];
    for (let i = startIdx; i < views.length; i++) {
        /** @type {?} */
        const viewAtPositionId = views[i][TVIEW].id;
        if (viewAtPositionId === viewBlockId) {
            return views[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(lContainer, tContainerNode, i);
        }
        else {
            // found a view with id greater than the one we are searching for
            // which means that required view doesn't exist and can't be found at
            // later positions in the views array - stop the search here
            break;
        }
    }
    return null;
}
/**
 * Marks the start of an embedded view.
 *
 * @param {?} viewBlockId The ID of this view
 * @param {?} consts
 * @param {?} vars
 * @return {?} boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId, consts, vars) {
    /** @type {?} */
    const containerTNode = previousOrParentTNode.type === 2 /* View */ ? /** @type {?} */
        ((previousOrParentTNode.parent)) :
        previousOrParentTNode;
    /** @type {?} */
    const container = /** @type {?} */ (viewData[containerTNode.index]);
    /** @type {?} */
    const currentView = viewData;
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    /** @type {?} */
    const lContainer = container.data;
    /** @type {?} */
    let viewToRender = scanForView(lContainer, /** @type {?} */ (containerTNode), /** @type {?} */ ((lContainer[ACTIVE_INDEX])), viewBlockId);
    if (viewToRender) {
        isParent = true;
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, consts, vars, /** @type {?} */ (containerTNode)), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = /** @type {?} */ ((lContainer[QUERIES])).createView();
        }
        createNodeAtIndex(viewBlockId, 2 /* View */, null, null, null, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (container) {
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, currentView, /** @type {?} */ ((lContainer[ACTIVE_INDEX])), -1);
        } /** @type {?} */
        ((lContainer[ACTIVE_INDEX]))++;
    }
    return getRenderFlags(viewToRender);
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
 * static data for a particular node would overwrite the static data for a node in the view above
 * it with the same index (since it's in the same template).
 *
 * @param {?} viewIndex The index of the TView in TNode.tViews
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars The number of bindings and pure function bindings in this template
 * @param {?} parent
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    /** @type {?} */
    const containerTViews = /** @type {?} */ (parent.tViews);
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/**
 * Marks the end of an embedded view.
 * @return {?}
 */
export function embeddedViewEnd() {
    /** @type {?} */
    const viewHost = viewData[HOST_NODE];
    refreshDescendantViews();
    leaveView(/** @type {?} */ ((viewData[PARENT])));
    previousOrParentTNode = /** @type {?} */ ((viewHost));
    isParent = false;
}
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @template T
 * @param {?} adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 * @return {?}
 */
export function componentRefresh(adjustedElementIndex) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    /** @type {?} */
    const element = /** @type {?} */ (readElementValue(viewData[adjustedElementIndex]));
    ngDevMode && assertNodeType(/** @type {?} */ (tView.data[adjustedElementIndex]), 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, `Component's host node should have an LViewData attached.`);
    /** @type {?} */
    const hostView = /** @type {?} */ ((element.data));
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        detectChangesInternal(hostView, hostView[CONTEXT]);
    }
}
/**
 * Returns a boolean for whether the view is attached
 * @param {?} view
 * @return {?}
 */
export function viewAttached(view) {
    return (view[FLAGS] & 8 /* Attached */) === 8 /* Attached */;
}
/**
 * Instruction to distribute projectable nodes among <ng-content> occurrences in a given template.
 * It takes all the selectors from the entire component's template and decides where
 * each projected node belongs (it re-distributes nodes among "buckets" where each "bucket" is
 * backed by a selector).
 *
 * This function requires CSS selectors to be provided in 2 forms: parsed (by a compiler) and text,
 * un-parsed form.
 *
 * The parsed form is needed for efficient matching of a node against a given CSS selector.
 * The un-parsed, textual form is needed for support of the ngProjectAs attribute.
 *
 * Having a CSS selector in 2 different formats is not ideal, but alternatives have even more
 * drawbacks:
 * - having only a textual form would require runtime parsing of CSS selectors;
 * - we can't have only a parsed as we can't re-construct textual form from it (as entered by a
 * template author).
 *
 * @param {?=} selectors A collection of parsed CSS selectors
 * @param {?=} textSelectors
 * @return {?}
 */
export function projectionDef(selectors, textSelectors) {
    /** @type {?} */
    const componentNode = /** @type {?} */ (findComponentView(viewData)[HOST_NODE]);
    if (!componentNode.projection) {
        /** @type {?} */
        const noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        /** @type {?} */
        const pData = componentNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        /** @type {?} */
        const tails = pData.slice();
        /** @type {?} */
        let componentChild = componentNode.child;
        while (componentChild !== null) {
            /** @type {?} */
            const bucketIndex = selectors ? matchingSelectorIndex(componentChild, selectors, /** @type {?} */ ((textSelectors))) : 0;
            /** @type {?} */
            const nextNode = componentChild.next;
            if (tails[bucketIndex]) {
                /** @type {?} */ ((tails[bucketIndex])).next = componentChild;
            }
            else {
                pData[bucketIndex] = componentChild;
                componentChild.next = null;
            }
            tails[bucketIndex] = componentChild;
            componentChild = nextNode;
        }
    }
}
/** *
 * Stack used to keep track of projection nodes in projection() instruction.
 *
 * This is deliberately created outside of projection() to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
  @type {?} */
const projectionNodeStack = [];
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param {?} nodeIndex
 * @param {?=} selectorIndex
 * @param {?=} attrs
 * @return {?}
 */
export function projection(nodeIndex, selectorIndex = 0, attrs) {
    /** @type {?} */
    const tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null, null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    /** @type {?} */
    const componentView = findComponentView(viewData);
    /** @type {?} */
    const componentNode = /** @type {?} */ (componentView[HOST_NODE]);
    /** @type {?} */
    let nodeToProject = (/** @type {?} */ (componentNode.projection))[selectorIndex];
    /** @type {?} */
    let projectedView = /** @type {?} */ ((componentView[PARENT]));
    /** @type {?} */
    let projectionNodeIndex = -1;
    while (nodeToProject) {
        if (nodeToProject.type === 1 /* Projection */) {
            /** @type {?} */
            const currentComponentView = findComponentView(projectedView);
            /** @type {?} */
            const currentComponentHost = /** @type {?} */ (currentComponentView[HOST_NODE]);
            /** @type {?} */
            const firstProjectedNode = (/** @type {?} */ (currentComponentHost.projection))[/** @type {?} */ (nodeToProject.projection)];
            if (firstProjectedNode) {
                projectionNodeStack[++projectionNodeIndex] = nodeToProject;
                projectionNodeStack[++projectionNodeIndex] = projectedView;
                nodeToProject = firstProjectedNode;
                projectedView = /** @type {?} */ ((currentComponentView[PARENT]));
                continue;
            }
        }
        else {
            /** @type {?} */
            const lNode = /** @type {?} */ (projectedView[nodeToProject.index]);
            // This flag must be set now or we won't know that this node is projected
            // if the nodes are inserted into a container later.
            nodeToProject.flags |= 8192 /* isProjected */;
            appendProjectedNode(lNode, nodeToProject, tProjectionNode, viewData, projectedView);
        }
        // If we are finished with a list of re-projected nodes, we need to get
        // back to the root projection node that was re-projected.
        if (nodeToProject.next === null && projectedView !== /** @type {?} */ ((componentView[PARENT]))) {
            projectedView = /** @type {?} */ (projectionNodeStack[projectionNodeIndex--]);
            nodeToProject = /** @type {?} */ (projectionNodeStack[projectionNodeIndex--]);
        }
        nodeToProject = nodeToProject.next;
    }
}
/**
 * Adds LViewData or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @template T
 * @param {?} currentView The view where LViewData or LContainer should be added
 * @param {?} adjustedHostIndex Index of the view's host node in LViewData[], adjusted for header
 * @param {?} state The LViewData or LContainer to add to the view tree
 * @return {?} The state passed in
 */
export function addToViewTree(currentView, adjustedHostIndex, state) {
    if (currentView[TAIL]) {
        /** @type {?} */ ((currentView[TAIL]))[NEXT] = state;
    }
    else if (firstTemplatePass) {
        tView.childIndex = adjustedHostIndex;
    }
    currentView[TAIL] = state;
    return state;
}
/**
 * If node is an OnPush component, marks its LViewData dirty.
 * @param {?} node
 * @return {?}
 */
export function markDirtyIfOnPush(node) {
    // Because data flows down the component tree, ancestors do not need to be marked dirty
    if (node.data && !(node.data[FLAGS] & 2 /* CheckAlways */)) {
        node.data[FLAGS] |= 4 /* Dirty */;
    }
}
/**
 * Wraps an event listener with preventDefault behavior.
 * @param {?} listenerFn
 * @return {?}
 */
export function wrapListenerWithPreventDefault(listenerFn) {
    return function wrapListenerIn_preventDefault(e) {
        if (listenerFn(e) === false) {
            e.preventDefault();
            // Necessary for legacy browsers that don't support preventDefault (e.g. IE)
            e.returnValue = false;
        }
    };
}
/**
 * Marks current view and all ancestors dirty
 * @param {?} view
 * @return {?}
 */
export function markViewDirty(view) {
    /** @type {?} */
    let currentView = view;
    while (currentView && !(currentView[FLAGS] & 64 /* IsRoot */)) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = /** @type {?} */ ((currentView[PARENT]));
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext should be defined');
    /** @type {?} */
    const rootContext = /** @type {?} */ (currentView[CONTEXT]);
    /** @type {?} */
    const nothingScheduled = rootContext.flags === 0 /* Empty */;
    rootContext.flags |= 1 /* DetectChanges */;
    if (nothingScheduled) {
        scheduleTick(rootContext);
    }
}
/**
 * Used to schedule change detection on the whole application.
 *
 * Unlike `tick`, `scheduleTick` coalesces multiple calls into one change detection run.
 * It is usually called indirectly by calling `markDirty` when the view needs to be
 * re-rendered.
 *
 * Typically `scheduleTick` uses `requestAnimationFrame` to coalesce multiple
 * `scheduleTick` requests. The scheduling function can be overridden in
 * `renderComponent`'s `scheduler` option.
 * @template T
 * @param {?} rootContext
 * @return {?}
 */
export function scheduleTick(rootContext) {
    if (rootContext.clean == _CLEAN_PROMISE) {
        /** @type {?} */
        let res;
        rootContext.clean = new Promise((r) => res = r);
        rootContext.scheduler(() => {
            if (rootContext.flags & 1 /* DetectChanges */) {
                rootContext.flags &= ~1 /* DetectChanges */;
                tickRootContext(rootContext);
            }
            if (rootContext.flags & 2 /* FlushPlayers */) {
                rootContext.flags &= ~2 /* FlushPlayers */;
                /** @type {?} */
                const playerHandler = rootContext.playerHandler;
                if (playerHandler) {
                    playerHandler.flushPlayers();
                }
            }
            rootContext.clean = _CLEAN_PROMISE; /** @type {?} */
            ((res))(null);
        });
    }
}
/**
 * Used to perform change detection on the whole application.
 *
 * This is equivalent to `detectChanges`, but invoked on root component. Additionally, `tick`
 * executes lifecycle hooks and conditionally checks components based on their
 * `ChangeDetectionStrategy` and dirtiness.
 *
 * The preferred way to trigger change detection is to call `markDirty`. `markDirty` internally
 * schedules `tick` using a scheduler in order to coalesce multiple `markDirty` calls into a
 * single change detection run. By default, the scheduler is `requestAnimationFrame`, but can
 * be changed when calling `renderComponent` and providing the `scheduler` option.
 * @template T
 * @param {?} component
 * @return {?}
 */
export function tick(component) {
    /** @type {?} */
    const rootView = getRootView(component);
    /** @type {?} */
    const rootContext = /** @type {?} */ (rootView[CONTEXT]);
    tickRootContext(rootContext);
}
/**
 * @param {?} rootContext
 * @return {?}
 */
function tickRootContext(rootContext) {
    for (let i = 0; i < rootContext.components.length; i++) {
        /** @type {?} */
        const rootComponent = rootContext.components[i];
        renderComponentOrTemplate(/** @type {?} */ ((readPatchedLViewData(rootComponent))), rootComponent);
    }
}
/**
 * Synchronously perform change detection on a component (and possibly its sub-components).
 *
 * This function triggers change detection in a synchronous way on a component. There should
 * be very little reason to call this function directly since a preferred way to do change
 * detection is to {\@link markDirty} the component and wait for the scheduler to call this method
 * at some future point in time. This is because a single user action often results in many
 * components being invalidated and calling change detection on each component synchronously
 * would be inefficient. It is better to wait until all components are marked as dirty and
 * then perform single change detection across all of the components
 *
 * @template T
 * @param {?} component The component which the change detection should be performed on.
 * @return {?}
 */
export function detectChanges(component) {
    /** @type {?} */
    const hostNode = /** @type {?} */ ((getLElementFromComponent(component)));
    ngDevMode &&
        assertDefined(hostNode, 'Component host node should be attached to an LViewData instance.');
    detectChangesInternal(/** @type {?} */ ((hostNode.data)), component);
}
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param {?} lViewData The view which the change detection should be performed on.
 * @return {?}
 */
export function detectChangesInRootView(lViewData) {
    tickRootContext(/** @type {?} */ (lViewData[CONTEXT]));
}
/**
 * Checks the change detector and its children, and throws if any changes are detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 * @template T
 * @param {?} component
 * @return {?}
 */
export function checkNoChanges(component) {
    checkNoChangesMode = true;
    try {
        detectChanges(component);
    }
    finally {
        checkNoChangesMode = false;
    }
}
/**
 * Checks the change detector on a root view and its components, and throws if any changes are
 * detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
 *
 * @param {?} lViewData The view which the change detection should be checked on.
 * @return {?}
 */
export function checkNoChangesInRootView(lViewData) {
    checkNoChangesMode = true;
    try {
        detectChangesInRootView(lViewData);
    }
    finally {
        checkNoChangesMode = false;
    }
}
/**
 * Checks the view of the component provided. Does not gate on dirty checks or execute doCheck.
 * @template T
 * @param {?} hostView
 * @param {?} component
 * @return {?}
 */
export function detectChangesInternal(hostView, component) {
    /** @type {?} */
    const hostTView = hostView[TVIEW];
    /** @type {?} */
    const oldView = enterView(hostView, hostView[HOST_NODE]);
    /** @type {?} */
    const templateFn = /** @type {?} */ ((hostTView.template));
    /** @type {?} */
    const viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, hostView[FLAGS], component);
        templateFn(getRenderFlags(hostView), component);
        refreshDescendantViews();
        updateViewQuery(viewQuery, component);
    }
    finally {
        leaveView(oldView);
    }
}
/**
 * @template T
 * @param {?} viewQuery
 * @param {?} flags
 * @param {?} component
 * @return {?}
 */
function createViewQuery(viewQuery, flags, component) {
    if (viewQuery && (flags & 1 /* CreationMode */)) {
        viewQuery(1 /* Create */, component);
    }
}
/**
 * @template T
 * @param {?} viewQuery
 * @param {?} component
 * @return {?}
 */
function updateViewQuery(viewQuery, component) {
    if (viewQuery) {
        viewQuery(2 /* Update */, component);
    }
}
/**
 * Mark the component as dirty (needing change detection).
 *
 * Marking a component dirty will schedule a change detection on this
 * component at some point in the future. Marking an already dirty
 * component as dirty is a noop. Only one outstanding change detection
 * can be scheduled per component tree. (Two components bootstrapped with
 * separate `renderComponent` will have separate schedulers)
 *
 * When the root component is bootstrapped with `renderComponent`, a scheduler
 * can be provided.
 *
 * @template T
 * @param {?} component Component to mark as dirty.
 * @return {?}
 */
export function markDirty(component) {
    ngDevMode && assertDefined(component, 'component');
    /** @type {?} */
    const elementNode = /** @type {?} */ ((getLElementFromComponent(component)));
    markViewDirty(/** @type {?} */ (elementNode.data));
}
/** *
 * A special value which designates that a value has not changed.
  @type {?} */
export const NO_CHANGE = /** @type {?} */ ({});
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(value) {
    return bindingUpdated(viewData[BINDING_INDEX]++, value) ? value : NO_CHANGE;
}
/**
 * Create interpolation bindings with a variable number of expressions.
 *
 * If there are 1 to 8 expressions `interpolation1()` to `interpolation8()` should be used instead.
 * Those are faster because there is no need to create an array of expressions and iterate over it.
 *
 * `values`:
 * - has static text at even indexes,
 * - has evaluated expressions at odd indexes.
 *
 * Returns the concatenated string when any of the arguments changes, `NO_CHANGE` otherwise.
 * @param {?} values
 * @return {?}
 */
export function interpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    /** @type {?} */
    let different = false;
    for (let i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    /** @type {?} */
    let content = values[0];
    for (let i = 1; i < values.length; i += 2) {
        content += stringify(values[i]) + values[i + 1];
    }
    return content;
}
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param {?} prefix static value used for concatenation only.
 * @param {?} v0 value checked for change.
 * @param {?} suffix static value used for concatenation only.
 * @return {?}
 */
export function interpolation1(prefix, v0, suffix) {
    /** @type {?} */
    const different = bindingUpdated(viewData[BINDING_INDEX]++, v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 2 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} suffix
 * @return {?}
 */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    /** @type {?} */
    const different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation binding with 3 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} suffix
 * @return {?}
 */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    /** @type {?} */
    const different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/**
 * Create an interpolation binding with 4 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} suffix
 * @return {?}
 */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    /** @type {?} */
    const different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 5 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} suffix
 * @return {?}
 */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 6 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} suffix
 * @return {?}
 */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 7 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} i5
 * @param {?} v6
 * @param {?} suffix
 * @return {?}
 */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/**
 * Creates an interpolation binding with 8 expressions.
 * @param {?} prefix
 * @param {?} v0
 * @param {?} i0
 * @param {?} v1
 * @param {?} i1
 * @param {?} v2
 * @param {?} i2
 * @param {?} v3
 * @param {?} i3
 * @param {?} v4
 * @param {?} i4
 * @param {?} v5
 * @param {?} i5
 * @param {?} v6
 * @param {?} i6
 * @param {?} v7
 * @param {?} suffix
 * @return {?}
 */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    /** @type {?} */
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
    viewData[BINDING_INDEX] += 8;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + i6 + stringify(v7) + suffix :
        NO_CHANGE;
}
/**
 * Store a value in the `data` at a given `index`.
 * @template T
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function store(index, value) {
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
    }
    viewData[adjustedIndex] = value;
}
/**
 * Retrieves a local reference from the current contextViewData.
 *
 * If the reference to retrieve is in a parent view, this instruction is used in conjunction
 * with a nextContext() call, which walks up the tree and updates the contextViewData instance.
 *
 * @template T
 * @param {?} index The index of the local ref in contextViewData.
 * @return {?}
 */
export function reference(index) {
    return loadInternal(index, contextViewData);
}
/**
 * @param {?} nestingLevel
 * @param {?} currentView
 * @return {?}
 */
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = /** @type {?} */ ((currentView[DECLARATION_VIEW]));
        nestingLevel--;
    }
    return currentView;
}
/**
 * Retrieves a value from the `directives` array.
 * @template T
 * @param {?} index
 * @return {?}
 */
export function loadDirective(index) {
    ngDevMode && assertDefined(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, /** @type {?} */ ((directives)));
    return /** @type {?} */ ((directives))[index];
}
/**
 * @template T
 * @param {?} queryListIdx
 * @return {?}
 */
export function loadQueryList(queryListIdx) {
    ngDevMode && assertDefined(viewData[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    ngDevMode && assertDataInRange(queryListIdx, /** @type {?} */ ((viewData[CONTENT_QUERIES])));
    return /** @type {?} */ ((viewData[CONTENT_QUERIES]))[queryListIdx];
}
/**
 * Retrieves a value from current `viewData`.
 * @template T
 * @param {?} index
 * @return {?}
 */
export function load(index) {
    return loadInternal(index, viewData);
}
/**
 * @param {?} index
 * @return {?}
 */
export function loadElement(index) {
    return loadElementInternal(index, viewData);
}
/**
 * @param {?} index
 * @return {?}
 */
export function getTNode(index) {
    return /** @type {?} */ (tView.data[index + HEADER_OFFSET]);
}
/**
 * Gets the current binding value.
 * @param {?} bindingIndex
 * @return {?}
 */
export function getBinding(bindingIndex) {
    ngDevMode && assertDataInRange(viewData[bindingIndex]);
    ngDevMode &&
        assertNotEqual(viewData[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[bindingIndex];
}
/**
 * Updates binding if changed, then returns whether it was updated.
 * @param {?} bindingIndex
 * @param {?} value
 * @return {?}
 */
export function bindingUpdated(bindingIndex, value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && assertLessThan(bindingIndex, viewData.length, `Slot should have been initialized to NO_CHANGE`);
    if (viewData[bindingIndex] === NO_CHANGE) {
        viewData[bindingIndex] = value;
    }
    else if (isDifferent(viewData[bindingIndex], value, checkNoChangesMode)) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, viewData[bindingIndex], value);
        viewData[bindingIndex] = value;
    }
    else {
        return false;
    }
    return true;
}
/**
 * Updates binding and returns the value.
 * @param {?} bindingIndex
 * @param {?} value
 * @return {?}
 */
export function updateBinding(bindingIndex, value) {
    return viewData[bindingIndex] = value;
}
/**
 * Updates 2 bindings if changed, then returns whether either was updated.
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @return {?}
 */
export function bindingUpdated2(bindingIndex, exp1, exp2) {
    /** @type {?} */
    const different = bindingUpdated(bindingIndex, exp1);
    return bindingUpdated(bindingIndex + 1, exp2) || different;
}
/**
 * Updates 3 bindings if changed, then returns whether any was updated.
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @return {?}
 */
export function bindingUpdated3(bindingIndex, exp1, exp2, exp3) {
    /** @type {?} */
    const different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated(bindingIndex + 2, exp3) || different;
}
/**
 * Updates 4 bindings if changed, then returns whether any was updated.
 * @param {?} bindingIndex
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @return {?}
 */
export function bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) {
    /** @type {?} */
    const different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated2(bindingIndex + 2, exp3, exp4) || different;
}
/**
 * @return {?}
 */
export function getTView() {
    return tView;
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 * @template Q
 * @param {?} queryList
 * @return {?}
 */
export function registerContentQuery(queryList) {
    /** @type {?} */
    const savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
    if (firstTemplatePass) {
        /** @type {?} */
        const currentDirectiveIndex = /** @type {?} */ ((directives)).length - 1;
        /** @type {?} */
        const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        /** @type {?} */
        const lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
        if (currentDirectiveIndex !== lastSavedDirectiveIndex) {
            tViewContentQueries.push(currentDirectiveIndex, savedContentQueriesLength - 1);
        }
    }
}
/**
 * @return {?}
 */
export function assertPreviousIsParent() {
    assertEqual(isParent, true, 'previousOrParentTNode should be a parent');
}
/**
 * @return {?}
 */
function assertHasParent() {
    assertDefined(previousOrParentTNode.parent, 'previousOrParentTNode should have a parent');
}
/**
 * @param {?} index
 * @param {?=} arr
 * @return {?}
 */
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = viewData;
    assertDataInRangeInternal(index, arr || viewData);
}
/**
 * @param {?} index
 * @param {?=} arr
 * @return {?}
 */
function assertDataNext(index, arr) {
    if (arr == null)
        arr = viewData;
    assertEqual(arr.length, index, `index ${index} expected to be at the end of arr (length ${arr.length})`);
}
/** @type {?} */
export const CLEAN_PROMISE = _CLEAN_PROMISE;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQU12QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxlQUFlLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsb0JBQW9CLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0SCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUcsT0FBTyxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUYsT0FBTyxFQUFDLFlBQVksRUFBYyxhQUFhLEVBQUUsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFJdEYsT0FBTyxFQUFrQix1QkFBdUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRWpGLE9BQU8sRUFBcUYsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMvSSxPQUFPLEVBQUMsYUFBYSxFQUFFLE9BQU8sRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBc0IsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBeUIsSUFBSSxFQUFtQixNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBaUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUN4VSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxD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QUFHLElBQUksUUFBUSxDQUFDLENBQUM7Q0FDbkQ7Ozs7OztBQUVELFNBQVMsY0FBYyxDQUFDLEtBQWEsRUFBRSxHQUFXO0lBQ2hELElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDO0lBQ2hDLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssNkNBQTZDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0NBQ2xHOztBQUVELGFBQWEsYUFBYSxHQUFHLGNBQWMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlcic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50LCByZWFkRWxlbWVudFZhbHVlLCByZWFkUGF0Y2hlZExWaWV3RGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBleGVjdXRlSW5pdEhvb2tzLCBxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50UXVlcnksIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgSW5pdGlhbFN0eWxpbmdGbGFncywgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIENPTlRFTlRfUVVFUklFUywgQ09OVEVYVCwgQ3VycmVudE1hdGNoZXNMaXN0LCBERUNMQVJBVElPTl9WSUVXLCBESVJFQ1RJVkVTLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBORVhULCBPcGFxdWVWaWV3U3RhdGUsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFRBSUwsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZmluZENvbXBvbmVudFZpZXcsIGdldENvbnRhaW5lck5vZGUsIGdldEhvc3RFbGVtZW50Tm9kZSwgZ2V0TFZpZXdDaGlsZCwgZ2V0UGFyZW50T3JDb250YWluZXJOb2RlLCBnZXRSZW5kZXJQYXJlbnQsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0LCBhbGxvY1N0eWxpbmdDb250ZXh0LCBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlLCByZW5kZXJTdHlsaW5nIGFzIHJlbmRlckVsZW1lbnRTdHlsZXMsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbCwgZ2V0TE5vZGUsIGdldFJvb3RDb250ZXh0LCBnZXRSb290VmlldywgaXNDb250ZW50UXVlcnlIb3N0LCBpc0RpZmZlcmVudCwgbG9hZEVsZW1lbnRJbnRlcm5hbCwgbG9hZEludGVybmFsLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cblxuLyoqXG4gKiBBIHBlcm1hbmVudCBtYXJrZXIgcHJvbWlzZSB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgY3VycmVudCBDRCB0cmVlIGlzXG4gKiBjbGVhbi5cbiAqL1xuY29uc3QgX0NMRUFOX1BST01JU0UgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbi8qKlxuICogRnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUgYmVmb3JlIHdyaXRpbmcgaXQgaW50byB0aGUgcmVuZGVyZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFNhbml0aXplckZuID0gKHZhbHVlOiBhbnkpID0+IHN0cmluZztcblxuLyoqXG4gKiBUVmlldy5kYXRhIG5lZWRzIHRvIGZpbGwgdGhlIHNhbWUgbnVtYmVyIG9mIHNsb3RzIGFzIHRoZSBMVmlld0RhdGEgaGVhZGVyXG4gKiBzbyB0aGUgaW5kaWNlcyBvZiBub2RlcyBhcmUgY29uc2lzdGVudCBiZXR3ZWVuIExWaWV3RGF0YSBhbmQgVFZpZXcuZGF0YS5cbiAqXG4gKiBJdCdzIG11Y2ggZmFzdGVyIHRvIGtlZXAgYSBibHVlcHJpbnQgb2YgdGhlIHByZS1maWxsZWQgYXJyYXkgYW5kIHNsaWNlIGl0XG4gKiB0aGFuIGl0IGlzIHRvIGNyZWF0ZSBhIG5ldyBhcnJheSBhbmQgZmlsbCBpdCBlYWNoIHRpbWUgYSBUVmlldyBpcyBjcmVhdGVkLlxuICovXG5jb25zdCBIRUFERVJfRklMTEVSID0gbmV3IEFycmF5KEhFQURFUl9PRkZTRVQpLmZpbGwobnVsbCk7XG5cbi8qKlxuICogVG9rZW4gc2V0IGluIGN1cnJlbnRNYXRjaGVzIHdoaWxlIGRlcGVuZGVuY2llcyBhcmUgYmVpbmcgcmVzb2x2ZWQuXG4gKlxuICogSWYgd2UgdmlzaXQgYSBkaXJlY3RpdmUgdGhhdCBoYXMgYSB2YWx1ZSBzZXQgdG8gQ0lSQ1VMQVIsIHdlIGtub3cgd2UndmVcbiAqIGFscmVhZHkgc2VlbiBpdCwgYW5kIHRodXMgaGF2ZSBhIGNpcmN1bGFyIGRlcGVuZGVuY3kuXG4gKi9cbmV4cG9ydCBjb25zdCBDSVJDVUxBUiA9ICdfX0NJUkNVTEFSX18nO1xuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKlxuICogVGhpcyByZW5kZXJlciBjYW4gYmUgb25lIG9mIHR3byB2YXJpZXRpZXMgb2YgUmVuZGVyZXIzOlxuICpcbiAqIC0gT2JqZWN0ZWRPcmllbnRlZFJlbmRlcmVyM1xuICpcbiAqIFRoaXMgaXMgdGhlIG5hdGl2ZSBicm93c2VyIEFQSSBzdHlsZSwgZS5nLiBvcGVyYXRpb25zIGFyZSBtZXRob2RzIG9uIGluZGl2aWR1YWwgb2JqZWN0c1xuICogbGlrZSBIVE1MRWxlbWVudC4gV2l0aCB0aGlzIHN0eWxlLCBubyBhZGRpdGlvbmFsIGNvZGUgaXMgbmVlZGVkIGFzIGEgZmFjYWRlIChyZWR1Y2luZyBwYXlsb2FkXG4gKiBzaXplKS5cbiAqXG4gKiAtIFByb2NlZHVyYWxSZW5kZXJlcjNcbiAqXG4gKiBJbiBub24tbmF0aXZlIGJyb3dzZXIgZW52aXJvbm1lbnRzIChlLmcuIHBsYXRmb3JtcyBzdWNoIGFzIHdlYi13b3JrZXJzKSwgdGhpcyBpcyB0aGUgZmFjYWRlXG4gKiB0aGF0IGVuYWJsZXMgZWxlbWVudCBtYW5pcHVsYXRpb24uIFRoaXMgYWxzbyBmYWNpbGl0YXRlcyBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSB3aXRoXG4gKiBSZW5kZXJlcjIuXG4gKi9cbmxldCByZW5kZXJlcjogUmVuZGVyZXIzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXI7XG59XG5cbmxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlckZhY3RvcnkoKTogUmVuZGVyZXJGYWN0b3J5MyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyRmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gdmlld0RhdGEgJiYgdmlld0RhdGFbU0FOSVRJWkVSXTtcbn1cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3RGF0YWAgdG8gb25seSB0aG9zZSBlbGVtZW50cy5cbiAqL1xubGV0IGVsZW1lbnREZXB0aENvdW50ICE6IG51bWJlcjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiB2aWV3RGF0YSBhcyBhbnkgYXMgT3BhcXVlVmlld1N0YXRlO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRWaWV3RGF0YSA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3RGF0YTtcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZCBhbmQgdHJhY2sgcXVlcnkgcmVzdWx0cy4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKTogTE5vZGV8bnVsbCB7XG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGUgPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUgPT09IHZpZXdEYXRhW0hPU1RfTk9ERV0gP1xuICAgICAgZ2V0SG9zdEVsZW1lbnROb2RlKHZpZXdEYXRhKSA6XG4gICAgICBnZXRMTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpOiBUTm9kZSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbn1cblxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnRUTm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAqL1xubGV0IGlzUGFyZW50OiBib29sZWFuO1xuXG5sZXQgdFZpZXc6IFRWaWV3O1xuXG5sZXQgY3VycmVudFF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbi8qKlxuICogUXVlcnkgaW5zdHJ1Y3Rpb25zIGNhbiBhc2sgZm9yIFwiY3VycmVudCBxdWVyaWVzXCIgaW4gMiBkaWZmZXJlbnQgY2FzZXM6XG4gKiAtIHdoZW4gY3JlYXRpbmcgdmlldyBxdWVyaWVzIChhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCB2aWV3LCBiZWZvcmUgYW55IG5vZGUgaXMgY3JlYXRlZCAtIGluXG4gKiB0aGlzIGNhc2UgY3VycmVudFF1ZXJpZXMgcG9pbnRzIHRvIHZpZXcgcXVlcmllcylcbiAqIC0gd2hlbiBjcmVhdGluZyBjb250ZW50IHF1ZXJpZXMgKGkuZS4gdGhpcyBwcmV2aW91c09yUGFyZW50VE5vZGUgcG9pbnRzIHRvIGEgbm9kZSBvbiB3aGljaCB3ZVxuICogY3JlYXRlIGNvbnRlbnQgcXVlcmllcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzKFxuICAgIFF1ZXJ5VHlwZToge25ldyAocGFyZW50OiBudWxsLCBzaGFsbG93OiBudWxsLCBkZWVwOiBudWxsKTogTFF1ZXJpZXN9KTogTFF1ZXJpZXMge1xuICAvLyBpZiB0aGlzIGlzIHRoZSBmaXJzdCBjb250ZW50IHF1ZXJ5IG9uIGEgbm9kZSwgYW55IGV4aXN0aW5nIExRdWVyaWVzIG5lZWRzIHRvIGJlIGNsb25lZFxuICAvLyBpbiBzdWJzZXF1ZW50IHRlbXBsYXRlIHBhc3NlcywgdGhlIGNsb25pbmcgb2NjdXJzIGJlZm9yZSBkaXJlY3RpdmUgaW5zdGFudGlhdGlvbi5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV0gJiZcbiAgICAgICFpc0NvbnRlbnRRdWVyeUhvc3QocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIGN1cnJlbnRRdWVyaWVzICYmIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fCAoY3VycmVudFF1ZXJpZXMgPSBuZXcgUXVlcnlUeXBlKG51bGwsIG51bGwsIG51bGwpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjcmVhdGlvbk1vZGU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgdmlld0RhdGE6IExWaWV3RGF0YTtcblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGN1cnJlbnQgTFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIFRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHNob3VsZCBiZSB1c2VkIGZvciBhbnl0aGluZyBwdWJsaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Vmlld0RhdGEoKTogTFZpZXdEYXRhIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld0RhdGE7XG59XG5cbi8qKlxuICogVGhlIGxhc3Qgdmlld0RhdGEgcmV0cmlldmVkIGJ5IG5leHRDb250ZXh0KCkuXG4gKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gKlxuICogZS5nLiBjb25zdCBpbm5lciA9IHgoKS4kaW1wbGljaXQ7IGNvbnN0IG91dGVyID0geCgpLiRpbXBsaWNpdDtcbiAqL1xubGV0IGNvbnRleHRWaWV3RGF0YTogTFZpZXdEYXRhID0gbnVsbCAhO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAqXG4gKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gKi9cbmxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG5mdW5jdGlvbiBnZXRDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuLyoqXG4gKiBUaGUgcm9vdCBpbmRleCBmcm9tIHdoaWNoIHB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIHNob3VsZCBjYWxjdWxhdGUgdGhlaXIgYmluZGluZ1xuICogaW5kaWNlcy4gSW4gY29tcG9uZW50IHZpZXdzLCB0aGlzIGlzIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LiBJbiBhIGhvc3QgYmluZGluZ1xuICogY29udGV4dCwgdGhpcyBpcyB0aGUgVFZpZXcuaG9zdEJpbmRpbmdTdGFydEluZGV4ICsgYW55IGhvc3RWYXJzIGJlZm9yZSB0aGUgZ2l2ZW4gZGlyLlxuICovXG5sZXQgYmluZGluZ1Jvb3RJbmRleDogbnVtYmVyID0gLTE7XG5cbi8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nUm9vdCgpIHtcbiAgcmV0dXJuIGJpbmRpbmdSb290SW5kZXg7XG59XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhcbiAgICBuZXdWaWV3OiBMVmlld0RhdGEsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IG9sZFZpZXc6IExWaWV3RGF0YSA9IHZpZXdEYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3W0RJUkVDVElWRVNdO1xuICB0VmlldyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tUVklFV107XG5cbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGJpbmRpbmdSb290SW5kZXggPSBuZXdWaWV3ICYmIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICByZW5kZXJlciA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tSRU5ERVJFUl07XG5cbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gaG9zdFROb2RlICE7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcblxuICB2aWV3RGF0YSA9IGNvbnRleHRWaWV3RGF0YSA9IG5ld1ZpZXc7XG4gIG9sZFZpZXcgJiYgKG9sZFZpZXdbUVVFUklFU10gPSBjdXJyZW50UXVlcmllcyk7XG4gIGN1cnJlbnRRdWVyaWVzID0gbmV3VmlldyAmJiBuZXdWaWV3W1FVRVJJRVNdO1xuXG4gIHJldHVybiBvbGRWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGNyZWF0aW9uT25seSBBbiBvcHRpb25hbCBib29sZWFuIHRvIGluZGljYXRlIHRoYXQgdGhlIHZpZXcgd2FzIHByb2Nlc3NlZCBpbiBjcmVhdGlvbiBtb2RlXG4gKiBvbmx5LCBpLmUuIHRoZSBmaXJzdCB1cGRhdGUgd2lsbCBiZSBkb25lIGxhdGVyLiBPbmx5IHBvc3NpYmxlIGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KG5ld1ZpZXc6IExWaWV3RGF0YSwgY3JlYXRpb25Pbmx5PzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIWNyZWF0aW9uT25seSkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy52aWV3SG9va3MsIHRWaWV3LnZpZXdDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICAgIH1cbiAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICB2aWV3RGF0YVtGTEFHU10gJj0gfihMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuRGlydHkpO1xuICB9XG4gIHZpZXdEYXRhW0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJ1bkluaXQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBlbWJlZGRlZCB2aWV3cywgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0XG4gKiBiaW5kaW5ncywgcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5mdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCkge1xuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG4gIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyh2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gIHJlZnJlc2hDb250ZW50UXVlcmllcyh0Vmlldyk7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG5cbiAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5ob3N0QmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgIShkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICAgIGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdSb290SW5kZXggKyBkZWYuaG9zdFZhcnM7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVEZWZJZHhdO1xuXG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoICEoZGlyZWN0aXZlRGVmSWR4LCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGluc3RhbmNlID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXdEYXRhO1xuICBpbnN0YW5jZVtQQVJFTlRdID0gdmlld0RhdGE7XG4gIGluc3RhbmNlW0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0O1xuICBpbnN0YW5jZVtDT05URVhUXSA9IGNvbnRleHQ7XG4gIGluc3RhbmNlW0lOSkVDVE9SXSA9IHZpZXdEYXRhID8gdmlld0RhdGFbSU5KRUNUT1JdIDogbnVsbDtcbiAgaW5zdGFuY2VbUkVOREVSRVJdID0gcmVuZGVyZXI7XG4gIGluc3RhbmNlW1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgbnVsbDtcbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG4vKipcbiAqIENyZWF0aW9uIG9mIExOb2RlIG9iamVjdCBpcyBleHRyYWN0ZWQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB3ZSBhbHdheXMgY3JlYXRlIExOb2RlIG9iamVjdFxuICogd2l0aCB0aGUgc2FtZSBzaGFwZVxuICogKHNhbWUgcHJvcGVydGllcyBhc3NpZ25lZCBpbiB0aGUgc2FtZSBvcmRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZU9iamVjdChcbiAgICB0eXBlOiBUTm9kZVR5cGUsIG5vZGVJbmplY3RvcjogTEluamVjdG9yIHwgbnVsbCwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLFxuICAgIHN0YXRlOiBhbnkpOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICByZXR1cm4ge1xuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICBub2RlSW5qZWN0b3I6IG5vZGVJbmplY3RvcixcbiAgICBkYXRhOiBzdGF0ZSxcbiAgICBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIGNvbW1vbiB3YXkgb2YgY3JlYXRpbmcgdGhlIExOb2RlIHRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGVtIGhhdmUgc2FtZSBzaGFwZSB0b1xuICoga2VlcCB0aGUgZXhlY3V0aW9uIGNvZGUgbW9ub21vcnBoaWMgYW5kIGZhc3QuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgTE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgTE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBMTm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBkYXRhIEFueSBkYXRhIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIHRoZSBMTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbFZpZXdEYXRhPzogTFZpZXdEYXRhIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuVmlldywgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogbnVsbCxcbiAgICBsVmlld0RhdGE6IExWaWV3RGF0YSk6IFRWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGxDb250YWluZXI6IExDb250YWluZXIpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIGxQcm9qZWN0aW9uOiBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGRhdGE6IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgc3RhdGU/OiBudWxsIHwgTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IFRFbGVtZW50Tm9kZSZUVmlld05vZGUmXG4gICAgVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSB7XG4gIGNvbnN0IHBhcmVudCA9XG4gICAgICBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuXG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIHZpZXdEYXRhICYmIHBhcmVudCAhPT0gdmlld0RhdGFbSE9TVF9OT0RFXTtcbiAgY29uc3QgdFBhcmVudCA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuXG4gIGNvbnN0IGlzU3RhdGUgPSBzdGF0ZSAhPSBudWxsO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGVPYmplY3QodHlwZSwgbnVsbCwgbmF0aXZlLCBpc1N0YXRlID8gc3RhdGUgYXMgYW55IDogbnVsbCk7XG4gIGxldCB0Tm9kZTogVE5vZGU7XG5cbiAgaWYgKGluZGV4ID09PSAtMSB8fCB0eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAgIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICAgIHROb2RlID0gKHN0YXRlID8gKHN0YXRlIGFzIExWaWV3RGF0YSlbVFZJRVddLm5vZGUgOiBudWxsKSB8fFxuICAgICAgICBjcmVhdGVUTm9kZSh0eXBlLCBpbmRleCwgbnVsbCwgbnVsbCwgdFBhcmVudCwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcblxuICAgIC8vIFRoaXMgaXMgYW4gZWxlbWVudCBvciBjb250YWluZXIgb3IgcHJvamVjdGlvbiBub2RlXG4gICAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihcbiAgICAgICAgICAgICAgICAgICAgIGFkanVzdGVkSW5kZXgsIHZpZXdEYXRhLmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB3aXRoIG51bGxgKTtcblxuICAgIHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdID0gbm9kZTtcblxuICAgIGlmICh0RGF0YVthZGp1c3RlZEluZGV4XSA9PSBudWxsKSB7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgICAgICBjcmVhdGVUTm9kZSh0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycywgdFBhcmVudCwgbnVsbCk7XG4gICAgICBpZiAoIWlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKVxuICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdE5vZGUgPSB0RGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZTtcbiAgICBpZiAoIXRWaWV3LmZpcnN0Q2hpbGQgJiYgdHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgICB9XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiYgcGFyZW50SW5TYW1lVmlldyB8fFxuICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCBWaWV3LlxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gVE9ETzogdGVtcG9yYXJ5LCByZW1vdmUgdGhpcyB3aGVuIHJlbW92aW5nIG5vZGVJbmplY3RvciAoYnJpbmdpbmcgaW4gZm5zIHRvIGhlbGxvIHdvcmxkKVxuICBpZiAoaW5kZXggIT09IC0xICYmICEodmlld0RhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgY29uc3QgcGFyZW50TE5vZGU6IExOb2RlfG51bGwgPSB0eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICAgIGdldENvbnRhaW5lck5vZGUodE5vZGUsIHN0YXRlIGFzIExWaWV3RGF0YSkgOlxuICAgICAgICBnZXRQYXJlbnRPckNvbnRhaW5lck5vZGUodE5vZGUsIHZpZXdEYXRhKTtcbiAgICBwYXJlbnRMTm9kZSAmJiAobm9kZS5ub2RlSW5qZWN0b3IgPSBwYXJlbnRMTm9kZS5ub2RlSW5qZWN0b3IpO1xuICB9XG5cbiAgLy8gVmlldyBub2RlcyBhbmQgaG9zdCBlbGVtZW50cyBuZWVkIHRvIHNldCB0aGVpciBob3N0IG5vZGUgKGNvbXBvbmVudHMgZG8gbm90IHNhdmUgaG9zdCBUTm9kZXMpXG4gIGlmICgodHlwZSAmIFROb2RlVHlwZS5WaWV3T3JFbGVtZW50KSA9PT0gVE5vZGVUeXBlLlZpZXdPckVsZW1lbnQgJiYgaXNTdGF0ZSkge1xuICAgIGNvbnN0IGxWaWV3RGF0YSA9IHN0YXRlIGFzIExWaWV3RGF0YTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBsVmlld0RhdGFbSE9TVF9OT0RFXSwgbnVsbCwgJ2xWaWV3RGF0YVtIT1NUX05PREVdIHNob3VsZCBub3QgaGF2ZSBiZWVuIGluaXRpYWxpemVkJyk7XG4gICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0gPSB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUVmlld05vZGU7XG4gICAgaWYgKGxWaWV3RGF0YVtUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGxWaWV3RGF0YVtUVklFV10ubm9kZSA9IHROb2RlIGFzIFRWaWV3Tm9kZSB8IFRFbGVtZW50Tm9kZTtcbiAgICB9XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB0Tm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlO1xufVxuXG4vKipcbiAqIFdoZW4gTE5vZGVzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSBvciBDb21wb25lbnRGYWN0b3J5LmNyZWF0ZSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0Qmx1ZXByaW50Rm9yTmV3Tm9kZSh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuaG9zdEJpbmRpbmdTdGFydEluZGV4Kys7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgdmlldy5wdXNoKG51bGwpO1xuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldENvbXBvbmVudFN0YXRlKCkge1xuICBpc1BhcmVudCA9IGZhbHNlO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBudWxsICE7XG4gIGVsZW1lbnREZXB0aENvdW50ID0gMDtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGhvc3ROb2RlIEV4aXN0aW5nIG5vZGUgdG8gcmVuZGVyIGludG8uXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgIHJlbmRlcmVyRmFjdG9yeSA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5O1xuICAgIHJlbmRlcmVyID0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIHJvb3QgdmlldyBzbyBpdCdzIHBvc3NpYmxlIHRvIGxvb2sgdXAgdGhlIGhvc3QgZWxlbWVudCB0aHJvdWdoIGl0cyBpbmRleFxuICAgIHRWaWV3ID0gY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIHZpZXdEYXRhID0gY3JlYXRlTFZpZXdEYXRhKHJlbmRlcmVyLCB0Vmlldywge30sIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdCk7XG5cbiAgICBjb25zdCBjb21wb25lbnRUVmlldyA9XG4gICAgICAgIGdldE9yQ3JlYXRlVFZpZXcodGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwsIG51bGwpO1xuICAgIGNvbnN0IGNvbXBvbmVudExWaWV3ID1cbiAgICAgICAgY3JlYXRlTFZpZXdEYXRhKHJlbmRlcmVyLCBjb21wb25lbnRUVmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKTtcbiAgICBjcmVhdGVOb2RlQXRJbmRleCgwLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwsIGNvbXBvbmVudExWaWV3KTtcbiAgICBob3N0ID0gbG9hZEVsZW1lbnQoMCk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlRm4pO1xuXG4gIHJldHVybiBob3N0O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXdEYXRhLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHF1ZXJpZXM/OiBMUXVlcmllcyB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBudWxsICE7XG5cbiAgY29uc3QgbFZpZXcgPVxuICAgICAgY3JlYXRlTFZpZXdEYXRhKHJlbmRlcmVyLCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBkZWNsYXJhdGlvblZpZXc7XG5cbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IHF1ZXJpZXMuY3JlYXRlVmlldygpO1xuICB9XG4gIGNyZWF0ZU5vZGVBdEluZGV4KC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuXG4gIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBfcHJldmlvdXNPclBhcmVudFROb2RlO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdUb1JlbmRlcjogTFZpZXdEYXRhLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIHJmOiBSZW5kZXJGbGFncykge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3RGF0YTtcbiAgaWYgKHZpZXdUb1JlbmRlcltGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQodmlld1RvUmVuZGVyW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuXG4gICAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW0hPU1RfTk9ERV0pO1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdFZpZXcudGVtcGxhdGUgIShyZiwgY29udGV4dCk7XG4gICAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAgICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSBpcyBjYWxsZWQgdHdpY2UgaW4gZmFjdCwgb25jZSBmb3IgY3JlYXRpb24gb25seSBhbmQgdGhlbiBvbmNlIGZvclxuICAgICAgLy8gdXBkYXRlLiBXaGVuIGZvciBjcmVhdGlvbiBvbmx5LCBsZWF2ZVZpZXcoKSBtdXN0IG5vdCB0cmlnZ2VyIHZpZXcgaG9va3MsIG5vciBjbGVhbiBmbGFncy5cbiAgICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgICAgbGVhdmVWaWV3KG9sZFZpZXcgISwgaXNDcmVhdGlvbk9ubHkpO1xuICAgICAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBfcHJldmlvdXNPclBhcmVudFROb2RlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGNvbnRleHQgYXQgdGhlIGxldmVsIHNwZWNpZmllZCBhbmQgc2F2ZXMgaXQgYXMgdGhlIGdsb2JhbCwgY29udGV4dFZpZXdEYXRhLlxuICogV2lsbCBnZXQgdGhlIG5leHQgbGV2ZWwgdXAgaWYgbGV2ZWwgaXMgbm90IHNwZWNpZmllZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gc2F2ZSBjb250ZXh0cyBvZiBwYXJlbnQgdmlld3Mgc28gdGhleSBjYW4gYmUgYm91bmQgaW4gZW1iZWRkZWQgdmlld3MsIG9yXG4gKiBpbiBjb25qdW5jdGlvbiB3aXRoIHJlZmVyZW5jZSgpIHRvIGJpbmQgYSByZWYgZnJvbSBhIHBhcmVudCB2aWV3LlxuICpcbiAqIEBwYXJhbSBsZXZlbCBUaGUgcmVsYXRpdmUgbGV2ZWwgb2YgdGhlIHZpZXcgZnJvbSB3aGljaCB0byBncmFiIGNvbnRleHQgY29tcGFyZWQgdG8gY29udGV4dFZld0RhdGFcbiAqIEByZXR1cm5zIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0PFQgPSBhbnk+KGxldmVsOiBudW1iZXIgPSAxKTogVCB7XG4gIGNvbnRleHRWaWV3RGF0YSA9IHdhbGtVcFZpZXdzKGxldmVsLCBjb250ZXh0Vmlld0RhdGEgISk7XG4gIHJldHVybiBjb250ZXh0Vmlld0RhdGFbQ09OVEVYVF0gYXMgVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgaG9zdFZpZXc6IExWaWV3RGF0YSwgY29tcG9uZW50T3JDb250ZXh0OiBULCB0ZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZUZuKSB7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50T3JDb250ZXh0ICEpO1xuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3ModFZpZXcuaG9zdEJpbmRpbmdzKTtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goSEVBREVSX09GRlNFVCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIEJ5IGRlZmF1bHQsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuIHdpdGggdGhlXG4gKiBjcmVhdGlvbiBibG9jayB3aGVuIHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUuIE90aGVyd2lzZSwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW5cbiAqIGFsb25lLlxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgZG8gTk9UIHVzZSB0aGlzIGNvbmZpZ3VyYXRpb24gKHVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5KS5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyRmxhZ3ModmlldzogTFZpZXdEYXRhKTogUmVuZGVyRmxhZ3Mge1xuICByZXR1cm4gdmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBOYW1lc3BhY2Vcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zy8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgZWxlbWVudCB1c2luZyB7QGxpbmsgZWxlbWVudFN0YXJ0fSBhbmQge0BsaW5rIGVsZW1lbnRFbmR9XG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgZWxlbWVudFN0YXJ0KGluZGV4LCBuYW1lLCBhdHRycywgbG9jYWxSZWZzKTtcbiAgZWxlbWVudEVuZCgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBsb2dpY2FsIGNvbnRhaW5lciBmb3Igb3RoZXIgbm9kZXMgKDxuZy1jb250YWluZXI+KSBiYWNrZWQgYnkgYSBjb21tZW50IG5vZGUgaW4gdGhlIERPTS5cbiAqIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50Q29udGFpbmVyRW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlld0RhdGEgYXJyYXlcbiAqIEBwYXJhbSBhdHRycyBTZXQgb2YgYXR0cmlidXRlcyB0byBiZSB1c2VkIHdoZW4gbWF0Y2hpbmcgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEV2ZW4gaWYgdGhpcyBpbnN0cnVjdGlvbiBhY2NlcHRzIGEgc2V0IG9mIGF0dHJpYnV0ZXMgbm8gYWN0dWFsIGF0dHJpYnV0ZSB2YWx1ZXMgYXJlIHByb3BhZ2F0ZWQgdG9cbiAqIHRoZSBET00gKGFzIGEgY29tbWVudCBub2RlIGNhbid0IGhhdmUgYXR0cmlidXRlcykuIEF0dHJpYnV0ZXMgYXJlIGhlcmUgb25seSBmb3IgZGlyZWN0aXZlXG4gKiBtYXRjaGluZyBwdXJwb3NlcyBhbmQgc2V0dGluZyBpbml0aWFsIGlucHV0cyBvZiBkaXJlY3RpdmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENvbnRhaW5lclN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudCBjb250YWluZXJzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICduZy1jb250YWluZXInIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuICBjb25zdCB0Tm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZSwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgdmlld0RhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgY3VycmVudFF1ZXJpZXMgJiZcbiAgICAgIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Q29udGFpbmVyTm9kZSkpO1xuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MocHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzLCB0Vmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnRzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MgJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcblxuICBjb25zdCBuYXRpdmUgPSBlbGVtZW50Q3JlYXRlKG5hbWUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICB9XG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGVsZW1lbnREZXB0aENvdW50ID09PSAwKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgdmlld0RhdGEpO1xuICB9XG4gIGVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG92ZXJyaWRkZW5SZW5kZXJlciBPcHRpb25hbCBBIHJlbmRlcmVyIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9uZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIG92ZXJyaWRkZW5SZW5kZXJlcj86IFJlbmRlcmVyMyk6IFJFbGVtZW50IHtcbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyVG9Vc2UgPSBvdmVycmlkZGVuUmVuZGVyZXIgfHwgcmVuZGVyZXI7XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyVG9Vc2UpKSB7XG4gICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUsIF9jdXJyZW50TmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoX2N1cnJlbnROYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMoX2N1cnJlbnROYW1lc3BhY2UsIG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmF0aXZlO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVOb2RlTG9jYWxSZWZFeHRyYWN0b3IodE5vZGU6IFROb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogUk5vZGUge1xuICByZXR1cm4gZ2V0TE5vZGUodE5vZGUsIGN1cnJlbnRWaWV3KS5uYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbE5vZGUgTE5vZGUgZm9yIHdoaWNoIGRpcmVjdGl2ZSBhbmQgbG9jYWxzIHNob3VsZCBiZSBjcmVhdGVkXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gTE5vZGVcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0FuZExvY2FscyhcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBuYXRpdmVOb2RlTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIHRWaWV3LCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKTtcbiAgfVxuICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobG9jYWxSZWZFeHRyYWN0b3IpO1xufVxuXG4vKipcbiAqIE9uIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHdlIG1hdGNoIGVhY2ggbm9kZSBhZ2FpbnN0IGF2YWlsYWJsZSBkaXJlY3RpdmUgc2VsZWN0b3JzIGFuZCBzYXZlXG4gKiB0aGUgcmVzdWx0aW5nIGRlZnMgaW4gdGhlIGNvcnJlY3QgaW5zdGFudGlhdGlvbiBvcmRlciBmb3Igc3Vic2VxdWVudCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnNcbiAqIChzbyBkZXBlbmRlbmNpZXMgYXJlIGFsd2F5cyBjcmVhdGVkIGJlZm9yZSB0aGUgZGlyZWN0aXZlcyB0aGF0IGluamVjdCB0aGVtKS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpbiB0c2lja2xlLlxuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgY29uc3QgbWF0Y2hlcyA9IHRWaWV3LmN1cnJlbnRNYXRjaGVzID0gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGUpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgY29uc3QgdmFsdWVJbmRleCA9IGkgKyAxO1xuICAgICAgcmVzb2x2ZURpcmVjdGl2ZShkZWYsIHZhbHVlSW5kZXgsIG1hdGNoZXMsIHRWaWV3KTtcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAobWF0Y2hlc1t2YWx1ZUluZGV4XSBhcyBudW1iZXIsIGRlZiwgZXhwb3J0c01hcCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICBhZGRDb21wb25lbnRMb2dpYyhkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pik7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuXG4gICAgICAgICAgLy8gVGhlIGNvbXBvbmVudCBpcyBhbHdheXMgc3RvcmVkIGZpcnN0IHdpdGggZGlyZWN0aXZlcyBhZnRlci5cbiAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoZGVmLCBudWxsKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXMgYXMgQ3VycmVudE1hdGNoZXNMaXN0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4sIHZhbHVlSW5kZXg6IG51bWJlciwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0LFxuICAgIHRWaWV3OiBUVmlldyk6IGFueSB7XG4gIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBudWxsKSB7XG4gICAgbWF0Y2hlc1t2YWx1ZUluZGV4XSA9IENJUkNVTEFSO1xuICAgIGNvbnN0IGluc3RhbmNlID0gZGVmLmZhY3RvcnkoKTtcbiAgICAodFZpZXcuZGlyZWN0aXZlcyB8fCAodFZpZXcuZGlyZWN0aXZlcyA9IFtdKSkucHVzaChkZWYpO1xuICAgIHJldHVybiBkaXJlY3RpdmVDcmVhdGUobWF0Y2hlc1t2YWx1ZUluZGV4XSA9IHRWaWV3LmRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxLCBpbnN0YW5jZSwgZGVmKTtcbiAgfSBlbHNlIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBDSVJDVUxBUikge1xuICAgIC8vIElmIHdlIHJldmlzaXQgdGhpcyBkaXJlY3RpdmUgYmVmb3JlIGl0J3MgcmVzb2x2ZWQsIHdlIGtub3cgaXQncyBjaXJjdWxhclxuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZi50eXBlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5mdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soKTogdm9pZCB7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gW10pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG4gIH1cbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBkaXJlY3RpdmUgYW5kIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJJbmRleDogbnVtYmVyLCBob3N0VmFyczogbnVtYmVyKTogdm9pZCB7XG4gIC8vIE11c3Qgc3VidHJhY3QgdGhlIGhlYWRlciBvZmZzZXQgYmVjYXVzZSBob3N0QmluZGluZ3MgZnVuY3Rpb25zIGFyZSBnZW5lcmF0ZWQgd2l0aFxuICAvLyBpbnN0cnVjdGlvbnMgdGhhdCBleHBlY3QgZWxlbWVudCBpbmRpY2VzIHRoYXQgYXJlIE5PVCBhZGp1c3RlZCAoZS5nLiBlbGVtZW50UHJvcGVydHkpLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaG9zdFZhcnM7IGkrKykge1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdmlld0RhdGEucHVzaChOT19DSEFOR0UpO1xuICB9XG4gICh0Vmlldy5ob3N0QmluZGluZ3MgfHwgKHRWaWV3Lmhvc3RCaW5kaW5ncyA9IFtcbiAgIF0pKS5wdXNoKGRpckluZGV4LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmaXJzdFRlbXBsYXRlUGFzcywgZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgYERpcmVjdGl2ZXMgc2hvdWxkIG9ubHkgYmUgaW5zdGFudGlhdGVkIGRpcmVjdGx5IGFmdGVyIGZpcnN0IHRlbXBsYXRlIHBhc3NgKTtcbiAgY29uc3QgY291bnQgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkgJiYgY3VycmVudFF1ZXJpZXMpIHtcbiAgICBjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCk7XG4gIH1cblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBjb25zdCB0RGlyZWN0aXZlcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4gPSB0RGlyZWN0aXZlc1tpXTtcblxuICAgICAgLy8gQ29tcG9uZW50IHZpZXcgbXVzdCBiZSBzZXQgb24gbm9kZSBiZWZvcmUgdGhlIGZhY3RvcnkgaXMgY3JlYXRlZCBzb1xuICAgICAgLy8gQ2hhbmdlRGV0ZWN0b3JSZWZzIGhhdmUgYSB3YXkgdG8gc3RvcmUgY29tcG9uZW50IHZpZXcgb24gY3JlYXRpb24uXG4gICAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICBhZGRDb21wb25lbnRMb2dpYyhkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55Pik7XG4gICAgICB9XG4gICAgICBkaXJlY3RpdmVDcmVhdGUoaSwgZGVmLmZhY3RvcnkoKSwgZGVmKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58IENvbXBvbmVudERlZkludGVybmFsPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNdID0gaW5kZXg7XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlld0RhdGEgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3Rvcik6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gcHJldmlvdXNPclBhcmVudFROb2RlLmxvY2FsTmFtZXM7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGxldCBsb2NhbEluZGV4ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgPyBsb2NhbFJlZkV4dHJhY3Rvcih0Tm9kZSwgdmlld0RhdGEpIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgYW5kIHB1cmUgZnVuY3Rpb24gYmluZGluZ3MgaW4gdGhpcyB2aWV3XG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgPVxuICAgICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGNvbnN0cztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXXSA9IHtcbiAgICBpZDogdmlld0luZGV4LFxuICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBIRUFERVJfRklMTEVSLnNsaWNlKCksICAvLyBGaWxsIGluIHRvIG1hdGNoIEhFQURFUl9PRkZTRVQgaW4gTFZpZXdEYXRhXG4gICAgY2hpbGRJbmRleDogLTEsICAgICAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGhvc3RCaW5kaW5nU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICBpbml0SG9va3M6IG51bGwsXG4gICAgY2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBwaXBlRGVzdHJveUhvb2tzOiBudWxsLFxuICAgIGNsZWFudXA6IG51bGwsXG4gICAgaG9zdEJpbmRpbmdzOiBudWxsLFxuICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBjdXJyZW50TWF0Y2hlczogbnVsbCxcbiAgICBmaXJzdENoaWxkOiBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlld0RhdGEge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZXcgQXJyYXkoaW5pdGlhbFZpZXdMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChudWxsLCAwLCBiaW5kaW5nU3RhcnRJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKE5PX0NIQU5HRSwgYmluZGluZ1N0YXJ0SW5kZXgpIGFzIExWaWV3RGF0YTtcbiAgYmx1ZXByaW50W0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgYmx1ZXByaW50W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJldHVybiBibHVlcHJpbnQ7XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgICAwLCBUTm9kZVR5cGUuRWxlbWVudCwgck5vZGUsIG51bGwsIG51bGwsXG4gICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgdFZpZXcuZGlyZWN0aXZlcyA9IFtkZWZdO1xuICB9XG4gIHJldHVybiB2aWV3RGF0YVtIRUFERVJfT0ZGU0VUXTtcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIC8vIGFkZCBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgLSBhcHBsaWNhYmxlIHRvIGVsZW1lbnRzIG9ubHlcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3Qgbm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obm9kZS5uYXRpdmUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbik7XG4gICAgICBzdG9yZUNsZWFudXBGbih2aWV3RGF0YSwgY2xlYW51cEZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm4pO1xuICAgICAgbm9kZS5uYXRpdmUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICBjb25zdCBjbGVhbnVwSW5zdGFuY2VzID0gZ2V0Q2xlYW51cCh2aWV3RGF0YSk7XG4gICAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBnZXRUVmlld0NsZWFudXAodmlld0RhdGEpLnB1c2goXG4gICAgICAgICAgICBldmVudE5hbWUsIHROb2RlLmluZGV4LCBjbGVhbnVwSW5zdGFuY2VzICEubGVuZ3RoIC0gMSwgdXNlQ2FwdHVyZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gdmlld0RhdGE7XG4gIGdldENsZWFudXAodmlldykucHVzaChjb250ZXh0KTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4sIHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlld0RhdGEsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY3VycmVudFF1ZXJpZXMgJiZcbiAgICAgIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSkpO1xuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MocHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gbG9hZEVsZW1lbnQoaW5kZXgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPSBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBwcm9wZXJ0eSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgQElucHV0cyBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IG5vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4KTtcbiAgLy8gaWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZFxuICBpZiAodE5vZGUgJiYgdE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgdE5vZGUuaW5wdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXModE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsLFxuICAgIGRldGFjaGVkOiBudWxsLFxuICAgIHN0eWxpbmdUZW1wbGF0ZTogbnVsbCxcbiAgICBwcm9qZWN0aW9uOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxpbmdJbmRleCwgdmFsdWUgPyB0cnVlIDogZmFsc2UpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBhbnkgaW5saW5lIHN0eWxlIHZhbHVlcyB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byBhcHBseSBhbGwgc3R5bGluZ1xuICogKGUuZy4gYHN0eWxlPVwiLi4uXCJgKSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuIFRoaXMgaXMgYWxzbyB3aGVyZSB0aGUgcHJvdmlkZWQgaW5kZXhcbiAqIHZhbHVlIGlzIGFsbG9jYXRlZCBmb3IgdGhlIHN0eWxpbmcgZGV0YWlscyBmb3IgaXRzIGNvcnJlc3BvbmRpbmcgZWxlbWVudCAodGhlIGVsZW1lbnRcbiAqIGluZGV4IGlzIHRoZSBwcmV2aW91cyBpbmRleCB2YWx1ZSBmcm9tIHRoaXMgb25lKS5cbiAqXG4gKiAoTm90ZSB0aGlzIGZ1bmN0aW9uIGNhbGxzIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4pXG4gKlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCB2YWx1ZSB3aGljaCB3aWxsIGJlIGFsbG9jYXRlZCB0byBzdG9yZSBzdHlsaW5nIGRhdGEgZm9yIHRoZSBlbGVtZW50LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzRGVjbGFyYXRpb25zIEEga2V5L3ZhbHVlIGFycmF5IG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IGNsYXNzZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW2NsYXNzXWApIG9yIHNpbmd1bGFyIChgW2NsYXNzLm5hbWVkXWApXG4gKiAgIGJpbmRpbmdzLiBJZiBhIGNsYXNzIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZSBtYXRjaGluZyBpbml0aWFsXG4gKiAgIGNsYXNzIHZhbHVlIHRoYXQgYXJlIHBhc3NlZCBpbiBoZXJlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaWYgbWF0Y2hlZCkuXG4gKiBAcGFyYW0gc3R5bGVEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZWxlbWVudC5cbiAqICAgRWFjaCBpbmRpdmlkdWFsIHN0eWxlIHdpbGwgYmUgdXNlZCBvbiB0aGUgZWxlbWVudCBhcyBsb25nIGFzIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gKiAgIGJ5IGFueSBzdHlsZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW3N0eWxlXWApIG9yIHNpbmd1bGFyIChgW3N0eWxlLnByb3BdYClcbiAqICAgYmluZGluZ3MuIElmIGEgc3R5bGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBudWxsIHRoZW4gdGhlIGluaXRpYWwgc3R5bGluZ1xuICogICB2YWx1ZXMgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgKGlmIHByb3ZpZGVkKVxuICogICB0byBzYW5pdGl6ZSB0aGUgYW55IENTUyBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZzxUPihcbiAgICBjbGFzc0RlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICAvLyBpbml0aWFsaXplIHRoZSBzdHlsaW5nIHRlbXBsYXRlLlxuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9XG4gICAgICAgIGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUoY2xhc3NEZWNsYXJhdGlvbnMsIHN0eWxlRGVjbGFyYXRpb25zLCBzdHlsZVNhbml0aXplcik7XG4gIH1cbiAgaWYgKHN0eWxlRGVjbGFyYXRpb25zICYmIHN0eWxlRGVjbGFyYXRpb25zLmxlbmd0aCB8fFxuICAgICAgY2xhc3NEZWNsYXJhdGlvbnMgJiYgY2xhc3NEZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgZWxlbWVudFN0eWxpbmdBcHBseSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGBTdHlsaW5nQ29udGV4dGAgYXQgYSBnaXZlbiBpbmRleC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBsYXppbHkgY3JlYXRlcyB0aGUgYFN0eWxpbmdDb250ZXh0YC4gVGhpcyBpcyBiZWNhdXNlIGluIG1vc3QgY2FzZXNcbiAqIHdlIGhhdmUgc3R5bGluZyB3aXRob3V0IGFueSBiaW5kaW5ncy4gQ3JlYXRpbmcgYFN0eWxpbmdDb250ZXh0YCBlYWdlcmx5IHdvdWxkIG1lYW4gdGhhdFxuICogZXZlcnkgc3R5bGUgZGVjbGFyYXRpb24gc3VjaCBhcyBgPGRpdiBzdHlsZT1cImNvbG9yOiByZWRcIj5gIHdvdWxkIHJlc3VsdCBgU3R5bGVDb250ZXh0YFxuICogd2hpY2ggd291bGQgY3JlYXRlIHVubmVjZXNzYXJ5IG1lbW9yeSBwcmVzc3VyZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIGFsbG9jYXRpb24uIFNlZTogYGVsZW1lbnRTdHlsaW5nYC5cbiAqL1xuZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlcik6IFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IHN0eWxpbmdDb250ZXh0ID0gbG9hZDxTdHlsaW5nQ29udGV4dD4oaW5kZXgpO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0NvbnRleHQpKSB7XG4gICAgY29uc3QgbEVsZW1lbnQgPSBzdHlsaW5nQ29udGV4dCBhcyBhbnkgYXMgTEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgJ2dldFN0eWxpbmdDb250ZXh0KCkgY2FsbGVkIGJlZm9yZSBlbGVtZW50U3R5bGluZygpJyk7XG4gICAgc3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID1cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChsRWxlbWVudCwgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dDtcbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgd2hpY2ggaGF2ZSBiZWVuIHF1ZXVlZCBieSBhbnkgc3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gb25jZSBvbmUgb3IgbW9yZSBgZWxlbWVudFN0eWxlYCBhbmQvb3IgYGVsZW1lbnRTdHlsZVByb3BgXG4gKiBoYXZlIGJlZW4gaXNzdWVkIGFnYWluc3QgdGhlIGVsZW1lbnQuIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIGRldGVybWluZSBpZiBhbnkgc3R5bGVzIGhhdmVcbiAqIGNoYW5nZWQgYW5kIHdpbGwgdGhlbiBza2lwIHRoZSBvcGVyYXRpb24gaWYgdGhlcmUgaXMgbm90aGluZyBuZXcgdG8gcmVuZGVyLlxuICpcbiAqIE9uY2UgY2FsbGVkIHRoZW4gYWxsIHF1ZXVlZCBzdHlsZXMgd2lsbCBiZSBmbHVzaGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5PFQ+KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgcmVuZGVyRWxlbWVudFN0eWxlcyhnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHJlbmRlcmVyKTtcbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGdpdmVuIHN0eWxlIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGBudWxsYCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxlYCBvciBhbnkgc3R5bGVzIHRoYXQgYXJlIHByZXNlbnRcbiAqIGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCAod2l0aCBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBwcm9wZXJ0eSBvbiB0aGlzIGVsZW1lbnQuIChNb25vdG9uaWNhbGx5IGluY3JlYXNpbmcuKVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgbnVsbCwgc3VmZml4Pzogc3RyaW5nKTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSBzdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCk7XG59XG5cbi8qKlxuICogUXVldWUgYSBrZXkvdmFsdWUgbWFwIG9mIHN0eWxlcyB0byBiZSByZW5kZXJlZCBvbiBhbiBFbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS4gV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAqIHRoZSBFbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHBsYWNlZCB3aXRoIHJlc3BlY3QgdG8gYW55IHN0eWxlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAuXG4gKiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gYG51bGxgIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCAodW5sZXNzIHRoZSBzYW1lXG4gKiBzdHlsZSBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gdXNpbmcgYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0byBjaGFuZ2UgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdNYXA8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICB1cGRhdGVTdHlsaW5nTWFwKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5hdGl2ZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0TmF0aXZlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGFwcGVuZENoaWxkKHRleHROYXRpdmUsIHROb2RlLCB2aWV3RGF0YSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGNvbnN0IGV4aXN0aW5nTm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBhbnkgYXMgTFRleHROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZSwgJ0xOb2RlIHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZS5uYXRpdmUsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGV4aXN0aW5nTm9kZS5uYXRpdmUsIHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ05vZGUubmF0aXZlLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBEaXJlY3RpdmVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIGEgZGlyZWN0aXZlIGFuZCB0aGVpciBhc3NvY2lhdGVkIGNvbnRlbnQgcXVlcmllcy5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldExOb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdmlld0RhdGEpO1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZiwgaG9zdE5vZGUpO1xuXG4gIGlmICgoZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+KS50ZW1wbGF0ZSkge1xuICAgIGhvc3ROb2RlLmRhdGEgIVtDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgfVxuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgcXVldWVJbml0SG9va3MoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmVEZWYub25Jbml0LCBkaXJlY3RpdmVEZWYuZG9DaGVjaywgdFZpZXcpO1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZi5ob3N0QmluZGluZ3MpIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZURlZi5ob3N0VmFycyk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdwcmV2aW91c09yUGFyZW50VE5vZGUnKTtcbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoZGlyZWN0aXZlRGVmSWR4LCBpbnN0YW5jZSwgZGlyZWN0aXZlRGVmLmlucHV0cywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMoKTtcbiAgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IHZvaWQge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldExOb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdmlld0RhdGEpO1xuXG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Tm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQsIGRlZiksIHRWaWV3LCBudWxsLFxuICAgICAgICAgIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKSk7XG5cbiAgLy8gV2UgbmVlZCB0byBzZXQgdGhlIGhvc3Qgbm9kZS9kYXRhIGhlcmUgYmVjYXVzZSB3aGVuIHRoZSBjb21wb25lbnQgTE5vZGUgd2FzIGNyZWF0ZWQsXG4gIC8vIHdlIGRpZG4ndCB5ZXQga25vdyBpdCB3YXMgYSBjb21wb25lbnQgKGp1c3QgYW4gZWxlbWVudCkuXG4gIChob3N0Tm9kZSBhc3tkYXRhOiBMVmlld0RhdGF9KS5kYXRhID0gY29tcG9uZW50VmlldztcbiAgKGNvbXBvbmVudFZpZXcgYXMgTFZpZXdEYXRhKVtIT1NUX05PREVdID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjaygpO1xufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4sXG4gICAgaG9zdE5vZGU6IExOb2RlKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuXG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIHZpZXdEYXRhKTtcbiAgaWYgKGhvc3ROb2RlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGhvc3ROb2RlLm5hdGl2ZSwgdmlld0RhdGEpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZXMgPT0gbnVsbCkgdmlld0RhdGFbRElSRUNUSVZFU10gPSBkaXJlY3RpdmVzID0gW107XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFOZXh0KGluZGV4LCBkaXJlY3RpdmVzKTtcbiAgZGlyZWN0aXZlc1tpbmRleF0gPSBkaXJlY3RpdmU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3M7XG4gICAgaWYgKChmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrKSA9PT0gMCkge1xuICAgICAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQ6XG4gICAgICAvLyAtIHNhdmUgdGhlIGluZGV4LFxuICAgICAgLy8gLSBzZXQgdGhlIG51bWJlciBvZiBkaXJlY3RpdmVzIHRvIDFcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyA9XG4gICAgICAgICAgaW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQgfCAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPbmx5IG5lZWQgdG8gYnVtcCB0aGUgc2l6ZSB3aGVuIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZFxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzKys7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpUHVibGljID0gZGlyZWN0aXZlRGVmICEuZGlQdWJsaWM7XG4gICAgaWYgKGRpUHVibGljKSBkaVB1YmxpYyhkaXJlY3RpdmVEZWYgISk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKChob3N0Tm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZSwgZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmc7fSwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW2luaXRpYWxJbnB1dHNbaV1dID0gaW5pdGlhbElucHV0c1tpICsgMV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIHJldHVybiBbXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmID8gbnVsbCA6IDAsICAvLyBhY3RpdmUgaW5kZXhcbiAgICBjdXJyZW50VmlldywgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlld3NcbiAgICBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmRlclBhcmVudCwgc2V0IGFmdGVyIG5vZGUgY3JlYXRpb25cbiAgXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlIGZvciBhbiBuZy10ZW1wbGF0ZSAoZHluYW1pY2FsbHktaW5zZXJ0ZWQgdmlldyksIGUuZy5cbiAqXG4gKiA8bmctdGVtcGxhdGUgI2Zvbz5cbiAqICAgIDxkaXY+PC9kaXY+XG4gKiA8L25nLXRlbXBsYXRlPlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlRm4gSW5saW5lIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBmb3IgdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJzIGF0dGFjaGVkIHRvIHRoZSBjb250YWluZXIsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIEEgZnVuY3Rpb24gd2hpY2ggZXh0cmFjdHMgbG9jYWwtcmVmcyB2YWx1ZXMgZnJvbSB0aGUgdGVtcGxhdGUuXG4gKiAgICAgICAgRGVmYXVsdHMgdG8gdGhlIGN1cnJlbnQgZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhlIGxvY2FsLXJlZi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgdGFnTmFtZT86IHN0cmluZyB8IG51bGwsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgbG9jYWxSZWZFeHRyYWN0b3I/OiBMb2NhbFJlZkV4dHJhY3Rvcikge1xuICAvLyBUT0RPOiBjb25zaWRlciBhIHNlcGFyYXRlIG5vZGUgdHlwZSBmb3IgdGVtcGxhdGVzXG4gIGNvbnN0IHROb2RlID0gY29udGFpbmVySW50ZXJuYWwoaW5kZXgsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMsIGxvY2FsUmVmRXh0cmFjdG9yKTtcbiAgY3VycmVudFF1ZXJpZXMgJiZcbiAgICAgIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlKSk7XG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3ModE5vZGUuZmxhZ3MsIHRWaWV3KTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlIGZvciBpbmxpbmUgdmlld3MsIGUuZy5cbiAqXG4gKiAlIGlmIChzaG93aW5nKSB7XG4gKiAgIDxkaXY+PC9kaXY+XG4gKiAlIH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lcihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gY29udGFpbmVySW50ZXJuYWwoaW5kZXgsIG51bGwsIG51bGwpO1xuICBmaXJzdFRlbXBsYXRlUGFzcyAmJiAodE5vZGUudFZpZXdzID0gW10pO1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKHZpZXdEYXRhKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgY29tbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5Db250YWluZXIsIGNvbW1lbnQsIHRhZ05hbWUsIGF0dHJzLCBsQ29udGFpbmVyKTtcblxuICBsQ29udGFpbmVyW1JFTkRFUl9QQVJFTlRdID0gZ2V0UmVuZGVyUGFyZW50KHROb2RlLCB2aWV3RGF0YSk7XG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUodmlld0RhdGEsIGluZGV4ICsgSEVBREVSX09GRlNFVCwgbENvbnRhaW5lcik7XG5cbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lcltRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmNvbnRhaW5lcigpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBsb2FkSW50ZXJuYWwoaW5kZXgsIHRWaWV3LmRhdGEpIGFzIFROb2RlO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIC8vIElubGluZSBjb250YWluZXJzIGNhbm5vdCBoYXZlIHN0eWxlIGJpbmRpbmdzLCBzbyB3ZSBjYW4gcmVhZCB0aGUgdmFsdWUgZGlyZWN0bHlcbiAgKHZpZXdEYXRhW3ByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleF0gYXMgTENvbnRhaW5lck5vZGUpLmRhdGFbQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAvLyBXZSBuZWVkIHRvIGV4ZWN1dGUgaW5pdCBob29rcyBoZXJlIHNvIG5nT25Jbml0IGhvb2tzIGFyZSBjYWxsZWQgaW4gdG9wIGxldmVsIHZpZXdzXG4gICAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXJOb2RlLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyTm9kZSBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIFZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuXG4gIC8vIElubGluZSBjb250YWluZXJzIGNhbm5vdCBoYXZlIHN0eWxlIGJpbmRpbmdzLCBzbyB3ZSBjYW4gcmVhZCB0aGUgdmFsdWUgZGlyZWN0bHlcbiAgY29uc3QgbENvbnRhaW5lciA9IHZpZXdEYXRhW3ByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleF0uZGF0YTtcbiAgY29uc3QgbmV4dEluZGV4ID0gbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlcyB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3RGF0YTogTFZpZXdEYXRhKSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBnZXRMVmlld0NoaWxkKGxWaWV3RGF0YSk7IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXdEYXRhIG9yIGFuIExDb250YWluZXIgaW5zdGFuY2UsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5IGludGVyZXN0ZWRcbiAgICAvLyBpbiBMQ29udGFpbmVyLiBXZSBjYW4gdGVsbCBpdCdzIGFuIExDb250YWluZXIgYmVjYXVzZSBpdHMgbGVuZ3RoIGlzIGxlc3MgdGhhbiB0aGUgTFZpZXdEYXRhXG4gICAgLy8gaGVhZGVyLlxuICAgIGlmIChjdXJyZW50Lmxlbmd0aCA8IEhFQURFUl9PRkZTRVQgJiYgY3VycmVudFtBQ1RJVkVfSU5ERVhdID09PSBudWxsKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBjdXJyZW50IGFzIExDb250YWluZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXdEYXRhID0gY29udGFpbmVyW1ZJRVdTXVtpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLFxuICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXVtUVklFV10uaWQ7XG4gICAgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPT09IHZpZXdCbG9ja0lkKSB7XG4gICAgICByZXR1cm4gdmlld3NbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB3aXRoIGlkIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2ggaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIC8vIFRoZSBwcmV2aW91cyBub2RlIGNhbiBiZSBhIHZpZXcgbm9kZSBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBhbiBpbmxpbmUgZm9yIGxvb3BcbiAgY29uc3QgY29udGFpbmVyVE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhIDpcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgLy8gSW5saW5lIGNvbnRhaW5lcnMgY2Fubm90IGhhdmUgc3R5bGUgYmluZGluZ3MsIHNvIHdlIGNhbiByZWFkIHRoZSB2YWx1ZSBkaXJlY3RseVxuICBjb25zdCBjb250YWluZXIgPSB2aWV3RGF0YVtjb250YWluZXJUTm9kZS5pbmRleF0gYXMgTENvbnRhaW5lck5vZGU7XG4gIGNvbnN0IGN1cnJlbnRWaWV3ID0gdmlld0RhdGE7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lclROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lci5kYXRhO1xuICBsZXQgdmlld1RvUmVuZGVyID0gc2NhbkZvclZpZXcoXG4gICAgICBsQ29udGFpbmVyLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld1RvUmVuZGVyKSB7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICB2aWV3VG9SZW5kZXIgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgIHJlbmRlcmVyLFxuICAgICAgICBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcodmlld0Jsb2NrSWQsIGNvbnN0cywgdmFycywgY29udGFpbmVyVE5vZGUgYXMgVENvbnRhaW5lck5vZGUpLCBudWxsLFxuICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuXG4gICAgaWYgKGxDb250YWluZXJbUVVFUklFU10pIHtcbiAgICAgIHZpZXdUb1JlbmRlcltRVUVSSUVTXSA9IGxDb250YWluZXJbUVVFUklFU10gIS5jcmVhdGVWaWV3KCk7XG4gICAgfVxuXG4gICAgY3JlYXRlTm9kZUF0SW5kZXgodmlld0Jsb2NrSWQsIFROb2RlVHlwZS5WaWV3LCBudWxsLCBudWxsLCBudWxsLCB2aWV3VG9SZW5kZXIpO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH1cbiAgaWYgKGNvbnRhaW5lcikge1xuICAgIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KHZpZXdUb1JlbmRlciwgbENvbnRhaW5lciwgY3VycmVudFZpZXcsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCAtMSk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGdldFJlbmRlckZsYWdzKHZpZXdUb1JlbmRlcik7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgVFZpZXcgKGUuZy4gc3RhdGljIGRhdGEpIGZvciB0aGUgYWN0aXZlIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogRWFjaCBlbWJlZGRlZCB2aWV3IGJsb2NrIG11c3QgY3JlYXRlIG9yIHJldHJpZXZlIGl0cyBvd24gVFZpZXcuIE90aGVyd2lzZSwgdGhlIGVtYmVkZGVkIHZpZXcnc1xuICogc3RhdGljIGRhdGEgZm9yIGEgcGFydGljdWxhciBub2RlIHdvdWxkIG92ZXJ3cml0ZSB0aGUgc3RhdGljIGRhdGEgZm9yIGEgbm9kZSBpbiB0aGUgdmlldyBhYm92ZVxuICogaXQgd2l0aCB0aGUgc2FtZSBpbmRleCAoc2luY2UgaXQncyBpbiB0aGUgc2FtZSB0ZW1wbGF0ZSkuXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgaW5kZXggb2YgdGhlIFRWaWV3IGluIFROb2RlLnRWaWV3c1xuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgcGFyZW50OiBUQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IHBhcmVudC50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICB2aWV3SW5kZXgsIG51bGwsIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgY29uc3Qgdmlld0hvc3QgPSB2aWV3RGF0YVtIT1NUX05PREVdO1xuICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gIGxlYXZlVmlldyh2aWV3RGF0YVtQQVJFTlRdICEpO1xuICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSB2aWV3SG9zdCAhO1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBhZGp1c3RlZEVsZW1lbnRJbmRleCAgRWxlbWVudCBpbmRleCBpbiBMVmlld0RhdGFbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGFkanVzdGVkRWxlbWVudEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgZWxlbWVudCA9IHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdKSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh0Vmlldy5kYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoZWxlbWVudC5kYXRhLCBgQ29tcG9uZW50J3MgaG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3RGF0YSBhdHRhY2hlZC5gKTtcbiAgY29uc3QgaG9zdFZpZXcgPSBlbGVtZW50LmRhdGEgITtcblxuICAvLyBPbmx5IGF0dGFjaGVkIENoZWNrQWx3YXlzIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICh2aWV3QXR0YWNoZWQoaG9zdFZpZXcpICYmIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdFZpZXcsIGhvc3RWaWV3W0NPTlRFWFRdKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWQodmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpW0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmICghY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgY29uc3Qgbm9PZk5vZGVCdWNrZXRzID0gc2VsZWN0b3JzID8gc2VsZWN0b3JzLmxlbmd0aCArIDEgOiAxO1xuICAgIGNvbnN0IHBEYXRhOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHBEYXRhLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBidWNrZXRJbmRleCA9XG4gICAgICAgICAgc2VsZWN0b3JzID8gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISkgOiAwO1xuICAgICAgY29uc3QgbmV4dE5vZGUgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLm5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBEYXRhW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgICBjb21wb25lbnRDaGlsZC5uZXh0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuXG4gICAgICBjb21wb25lbnRDaGlsZCA9IG5leHROb2RlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHByb2plY3Rpb24oKSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2YgcHJvamVjdGlvbigpIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXdEYXRhIHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB0UHJvamVjdGlvbk5vZGUgPVxuICAgICAgY3JlYXRlTm9kZUF0SW5kZXgobm9kZUluZGV4LCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbnVsbCwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gV2UgY2FuJ3QgdXNlIHZpZXdEYXRhW0hPU1RfTk9ERV0gYmVjYXVzZSBwcm9qZWN0aW9uIG5vZGVzIGNhbiBiZSBuZXN0ZWQgaW4gZW1iZWRkZWQgdmlld3MuXG4gIGlmICh0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9PT0gbnVsbCkgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIHN0b3JlZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KHZpZXdEYXRhKTtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIGxldCBub2RlVG9Qcm9qZWN0ID0gKGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3NlbGVjdG9ySW5kZXhdO1xuICBsZXQgcHJvamVjdGVkVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuXG4gIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgaWYgKG5vZGVUb1Byb2plY3QudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIFRoaXMgbm9kZSBpcyByZS1wcm9qZWN0ZWQsIHNvIHdlIG11c3QgZ28gdXAgdGhlIHRyZWUgdG8gZ2V0IGl0cyBwcm9qZWN0ZWQgbm9kZXMuXG4gICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpO1xuICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudEhvc3QgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGZpcnN0UHJvamVjdGVkTm9kZSA9XG4gICAgICAgICAgKGN1cnJlbnRDb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtub2RlVG9Qcm9qZWN0LnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgaWYgKGZpcnN0UHJvamVjdGVkTm9kZSkge1xuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBub2RlVG9Qcm9qZWN0O1xuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBwcm9qZWN0ZWRWaWV3O1xuXG4gICAgICAgIG5vZGVUb1Byb2plY3QgPSBmaXJzdFByb2plY3RlZE5vZGU7XG4gICAgICAgIHByb2plY3RlZFZpZXcgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBsTm9kZSA9IHByb2plY3RlZFZpZXdbbm9kZVRvUHJvamVjdC5pbmRleF0gYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGU7XG4gICAgICAvLyBUaGlzIGZsYWcgbXVzdCBiZSBzZXQgbm93IG9yIHdlIHdvbid0IGtub3cgdGhhdCB0aGlzIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgICAvLyBpZiB0aGUgbm9kZXMgYXJlIGluc2VydGVkIGludG8gYSBjb250YWluZXIgbGF0ZXIuXG4gICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG5cbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobE5vZGUsIG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgdmlld0RhdGEsIHByb2plY3RlZFZpZXcpO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGFyZSBmaW5pc2hlZCB3aXRoIGEgbGlzdCBvZiByZS1wcm9qZWN0ZWQgbm9kZXMsIHdlIG5lZWQgdG8gZ2V0XG4gICAgLy8gYmFjayB0byB0aGUgcm9vdCBwcm9qZWN0aW9uIG5vZGUgdGhhdCB3YXMgcmUtcHJvamVjdGVkLlxuICAgIGlmIChub2RlVG9Qcm9qZWN0Lm5leHQgPT09IG51bGwgJiYgcHJvamVjdGVkVmlldyAhPT0gY29tcG9uZW50Vmlld1tQQVJFTlRdICEpIHtcbiAgICAgIHByb2plY3RlZFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXdEYXRhO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICB9XG4gICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QubmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3RGF0YVtdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld0RhdGF8TENvbnRhaW5lcj4oXG4gICAgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgYWRqdXN0ZWRIb3N0SW5kZXg6IG51bWJlciwgc3RhdGU6IFQpOiBUIHtcbiAgaWYgKGN1cnJlbnRWaWV3W1RBSUxdKSB7XG4gICAgY3VycmVudFZpZXdbVEFJTF0gIVtORVhUXSA9IHN0YXRlO1xuICB9IGVsc2UgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuY2hpbGRJbmRleCA9IGFkanVzdGVkSG9zdEluZGV4O1xuICB9XG4gIGN1cnJlbnRWaWV3W1RBSUxdID0gc3RhdGU7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlld0RhdGEgZGlydHkuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobm9kZTogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIC8vIEJlY2F1c2UgZGF0YSBmbG93cyBkb3duIHRoZSBjb21wb25lbnQgdHJlZSwgYW5jZXN0b3JzIGRvIG5vdCBuZWVkIHRvIGJlIG1hcmtlZCBkaXJ0eVxuICBpZiAobm9kZS5kYXRhICYmICEobm9kZS5kYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhW0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9wcmV2ZW50RGVmYXVsdChlOiBFdmVudCkge1xuICAgIGlmIChsaXN0ZW5lckZuKGUpID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkodmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGxldCBjdXJyZW50VmlldzogTFZpZXdEYXRhID0gdmlldztcblxuICB3aGlsZSAoY3VycmVudFZpZXcgJiYgIShjdXJyZW50Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W1BBUkVOVF0gITtcbiAgfVxuICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY3VycmVudFZpZXdbQ09OVEVYVF0sICdyb290Q29udGV4dCBzaG91bGQgYmUgZGVmaW5lZCcpO1xuXG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gY3VycmVudFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICBpZiAobm90aGluZ1NjaGVkdWxlZCkge1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgaWYgKHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKHJlYWRQYXRjaGVkTFZpZXdEYXRhKHJvb3RDb21wb25lbnQpICEsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBjb21wb25lbnQgKGFuZCBwb3NzaWJseSBpdHMgc3ViLWNvbXBvbmVudHMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBpbiBhIHN5bmNocm9ub3VzIHdheSBvbiBhIGNvbXBvbmVudC4gVGhlcmUgc2hvdWxkXG4gKiBiZSB2ZXJ5IGxpdHRsZSByZWFzb24gdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIGRpcmVjdGx5IHNpbmNlIGEgcHJlZmVycmVkIHdheSB0byBkbyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBpcyB0byB7QGxpbmsgbWFya0RpcnR5fSB0aGUgY29tcG9uZW50IGFuZCB3YWl0IGZvciB0aGUgc2NoZWR1bGVyIHRvIGNhbGwgdGhpcyBtZXRob2RcbiAqIGF0IHNvbWUgZnV0dXJlIHBvaW50IGluIHRpbWUuIFRoaXMgaXMgYmVjYXVzZSBhIHNpbmdsZSB1c2VyIGFjdGlvbiBvZnRlbiByZXN1bHRzIGluIG1hbnlcbiAqIGNvbXBvbmVudHMgYmVpbmcgaW52YWxpZGF0ZWQgYW5kIGNhbGxpbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBlYWNoIGNvbXBvbmVudCBzeW5jaHJvbm91c2x5XG4gKiB3b3VsZCBiZSBpbmVmZmljaWVudC4gSXQgaXMgYmV0dGVyIHRvIHdhaXQgdW50aWwgYWxsIGNvbXBvbmVudHMgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmRcbiAqIHRoZW4gcGVyZm9ybSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBhY3Jvc3MgYWxsIG9mIHRoZSBjb21wb25lbnRzXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldExFbGVtZW50RnJvbUNvbXBvbmVudChjb21wb25lbnQpICE7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChob3N0Tm9kZSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3RGF0YSBpbnN0YW5jZS4nKTtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGhvc3ROb2RlLmRhdGEgISwgY29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3RGF0YVtDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSB0cnVlO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICBjb25zdCB0ZW1wbGF0ZUZuID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IGhvc3RUVmlldy52aWV3UXVlcnk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXdbRkxBR1NdLCBjb21wb25lbnQpO1xuICAgIHRlbXBsYXRlRm4oZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnQpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICB1cGRhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3UXVlcnk8VD4oXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSAmJiAoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVZpZXdRdWVyeTxUPih2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cblxuLyoqXG4gKiBNYXJrIHRoZSBjb21wb25lbnQgYXMgZGlydHkgKG5lZWRpbmcgY2hhbmdlIGRldGVjdGlvbikuXG4gKlxuICogTWFya2luZyBhIGNvbXBvbmVudCBkaXJ0eSB3aWxsIHNjaGVkdWxlIGEgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGlzXG4gKiBjb21wb25lbnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLiBNYXJraW5nIGFuIGFscmVhZHkgZGlydHlcbiAqIGNvbXBvbmVudCBhcyBkaXJ0eSBpcyBhIG5vb3AuIE9ubHkgb25lIG91dHN0YW5kaW5nIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGNhbiBiZSBzY2hlZHVsZWQgcGVyIGNvbXBvbmVudCB0cmVlLiAoVHdvIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIHdpdGhcbiAqIHNlcGFyYXRlIGByZW5kZXJDb21wb25lbnRgIHdpbGwgaGF2ZSBzZXBhcmF0ZSBzY2hlZHVsZXJzKVxuICpcbiAqIFdoZW4gdGhlIHJvb3QgY29tcG9uZW50IGlzIGJvb3RzdHJhcHBlZCB3aXRoIGByZW5kZXJDb21wb25lbnRgLCBhIHNjaGVkdWxlclxuICogY2FuIGJlIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIG1hcmsgYXMgZGlydHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBlbGVtZW50Tm9kZSA9IGdldExFbGVtZW50RnJvbUNvbXBvbmVudChjb21wb25lbnQpICE7XG4gIG1hcmtWaWV3RGlydHkoZWxlbWVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGludGVyZmFjZSBOT19DSEFOR0Uge1xuICAvLyBUaGlzIGlzIGEgYnJhbmQgdGhhdCBlbnN1cmVzIHRoYXQgdGhpcyB0eXBlIGNhbiBuZXZlciBtYXRjaCBhbnl0aGluZyBlbHNlXG4gIGJyYW5kOiAnTk9fQ0hBTkdFJztcbn1cblxuLyoqIEEgc3BlY2lhbCB2YWx1ZSB3aGljaCBkZXNpZ25hdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuICovXG5leHBvcnQgY29uc3QgTk9fQ0hBTkdFID0ge30gYXMgTk9fQ0hBTkdFO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZSBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgZXhwcmVzc2lvbnMuXG4gKlxuICogSWYgdGhlcmUgYXJlIDEgdG8gOCBleHByZXNzaW9ucyBgaW50ZXJwb2xhdGlvbjEoKWAgdG8gYGludGVycG9sYXRpb244KClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gKiBUaG9zZSBhcmUgZmFzdGVyIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVlZCB0byBjcmVhdGUgYW4gYXJyYXkgb2YgZXhwcmVzc2lvbnMgYW5kIGl0ZXJhdGUgb3ZlciBpdC5cbiAqXG4gKiBgdmFsdWVzYDpcbiAqIC0gaGFzIHN0YXRpYyB0ZXh0IGF0IGV2ZW4gaW5kZXhlcyxcbiAqIC0gaGFzIGV2YWx1YXRlZCBleHByZXNzaW9ucyBhdCBvZGQgaW5kZXhlcy5cbiAqXG4gKiBSZXR1cm5zIHRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvblYodmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gc3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrLCB2MCk7XG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAyIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24yKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDI7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDMgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjMoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2Mik7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDM7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgICAgICAgICAgICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICtcbiAgICAgICAgICBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCkgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA1O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA2O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNztcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjgoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDg7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBpNiArIHN0cmluZ2lmeSh2NykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogU3RvcmUgYSB2YWx1ZSBpbiB0aGUgYGRhdGFgIGF0IGEgZ2l2ZW4gYGluZGV4YC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZTxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCk6IHZvaWQge1xuICAvLyBXZSBkb24ndCBzdG9yZSBhbnkgc3RhdGljIGRhdGEgZm9yIGxvY2FsIHZhcmlhYmxlcywgc28gdGhlIGZpcnN0IHRpbWVcbiAgLy8gd2Ugc2VlIHRoZSB0ZW1wbGF0ZSwgd2Ugc2hvdWxkIHN0b3JlIGFzIG51bGwgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXlcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgaWYgKGFkanVzdGVkSW5kZXggPj0gdFZpZXcuZGF0YS5sZW5ndGgpIHtcbiAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID0gbnVsbDtcbiAgfVxuICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGxvY2FsIHJlZmVyZW5jZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHRWaWV3RGF0YS5cbiAqXG4gKiBJZiB0aGUgcmVmZXJlbmNlIHRvIHJldHJpZXZlIGlzIGluIGEgcGFyZW50IHZpZXcsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgdXNlZCBpbiBjb25qdW5jdGlvblxuICogd2l0aCBhIG5leHRDb250ZXh0KCkgY2FsbCwgd2hpY2ggd2Fsa3MgdXAgdGhlIHRyZWUgYW5kIHVwZGF0ZXMgdGhlIGNvbnRleHRWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBsb2NhbCByZWYgaW4gY29udGV4dFZpZXdEYXRhLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmZXJlbmNlPFQ+KGluZGV4OiBudW1iZXIpIHtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihpbmRleCwgY29udGV4dFZpZXdEYXRhKTtcbn1cblxuZnVuY3Rpb24gd2Fsa1VwVmlld3MobmVzdGluZ0xldmVsOiBudW1iZXIsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICB3aGlsZSAobmVzdGluZ0xldmVsID4gMCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10sXG4gICAgICAgICAgICAgICAgICAgICAnRGVjbGFyYXRpb24gdmlldyBzaG91bGQgYmUgZGVmaW5lZCBpZiBuZXN0aW5nIGxldmVsIGlzIGdyZWF0ZXIgdGhhbiAwLicpO1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBuZXN0aW5nTGV2ZWwtLTtcbiAgfVxuICByZXR1cm4gY3VycmVudFZpZXc7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGlyZWN0aXZlc2AgYXJyYXkuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZERpcmVjdGl2ZTxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZXMsICdEaXJlY3RpdmVzIGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBkaXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCwgZGlyZWN0aXZlcyAhKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZXMgIVtpbmRleF07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkUXVlcnlMaXN0PFQ+KHF1ZXJ5TGlzdElkeDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSxcbiAgICAgICAgICAgICAgICAgICAnQ29udGVudCBRdWVyeUxpc3QgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIHF1ZXJ5LicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UocXVlcnlMaXN0SWR4LCB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdICEpO1xuXG4gIHJldHVybiB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdICFbcXVlcnlMaXN0SWR4XTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gY3VycmVudCBgdmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCB2aWV3RGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRWxlbWVudChpbmRleDogbnVtYmVyKTogTEVsZW1lbnROb2RlIHtcbiAgcmV0dXJuIGxvYWRFbGVtZW50SW50ZXJuYWwoaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFROb2RlKGluZGV4OiBudW1iZXIpOiBUTm9kZSB7XG4gIHJldHVybiB0Vmlldy5kYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG59XG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZyhiaW5kaW5nSW5kZXg6IG51bWJlcik6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbCh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIHZpZXdEYXRhW2JpbmRpbmdJbmRleF07XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgICAgYmluZGluZ0luZGV4LCB2aWV3RGF0YS5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgdG8gTk9fQ0hBTkdFYCk7XG5cbiAgaWYgKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPT09IE5PX0NIQU5HRSkge1xuICAgIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIGlmIChpc0RpZmZlcmVudCh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSwgY2hlY2tOb0NoYW5nZXNNb2RlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoY3JlYXRpb25Nb2RlLCBjaGVja05vQ2hhbmdlc01vZGUsIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGFuZCByZXR1cm5zIHRoZSB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1cGRhdGVCaW5kaW5nKGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYW55IHtcbiAgcmV0dXJuIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXgsIGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4ICsgMSwgZXhwMikgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyAzIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDMoYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXggKyAyLCBleHAzKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDQgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkNChcbiAgICBiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGJpbmRpbmdJbmRleCArIDIsIGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRWaWV3KCk6IFRWaWV3IHtcbiAgcmV0dXJuIHRWaWV3O1xufVxuXG4vKipcbiAqIFJlZ2lzdGVycyBhIFF1ZXJ5TGlzdCwgYXNzb2NpYXRlZCB3aXRoIGEgY29udGVudCBxdWVyeSwgZm9yIGxhdGVyIHJlZnJlc2ggKHBhcnQgb2YgYSB2aWV3XG4gKiByZWZyZXNoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyQ29udGVudFF1ZXJ5PFE+KHF1ZXJ5TGlzdDogUXVlcnlMaXN0PFE+KTogdm9pZCB7XG4gIGNvbnN0IHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggPVxuICAgICAgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gfHwgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gPSBbXSkpLnB1c2gocXVlcnlMaXN0KTtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZGlyZWN0aXZlcyAhLmxlbmd0aCAtIDE7XG4gICAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgICBjb25zdCBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCA9XG4gICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzW3RWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDJdIDogLTE7XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaChjdXJyZW50RGlyZWN0aXZlSW5kZXgsIHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKSB7XG4gIGFzc2VydEVxdWFsKGlzUGFyZW50LCB0cnVlLCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZShpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnREYXRhSW5SYW5nZUludGVybmFsKGluZGV4LCBhcnIgfHwgdmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhTmV4dChpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuIl19