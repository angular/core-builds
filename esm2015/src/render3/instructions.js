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
import { assertDefined, assertEqual, assertLessThan, assertNotDefined, assertNotEqual } from './assert';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, RENDER_PARENT, VIEWS } from './interfaces/container';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, canInsertNativeNode, createTextNode, findComponentHost, getLViewChild, getParentLNode, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { allocStylingContext, createStylingContextTemplate, renderStyling as renderElementStyles, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling';
import { assertDataInRangeInternal, isDifferent, loadElementInternal, loadInternal, stringify } from './util';
/** *
 * Directive (D) sets a property on all component instances using this constant as a key and the
 * component's host node (LElement) as the value. This is used in methods like detectChanges to
 * facilitate jumping from an instance to the host node.
  @type {?} */
export const NG_HOST_SYMBOL = '__ngHostLNode__';
/** *
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
  @type {?} */
const _CLEAN_PROMISE = Promise.resolve(null);
/** @typedef {?} */
var SanitizerFn;
export { SanitizerFn };
/** *
 * Directive and element indices for top-level directive.
 *
 * Saved here to avoid re-instantiating an array on every change detection run.
 *
 * Note: Element is not actually stored at index 0 because of the LViewData
 * header, but the host bindings function expects an index that is NOT adjusted
 * because it will ultimately be fed to instructions like elementProperty.
  @type {?} */
const _ROOT_DIRECTIVE_INDICES = [0, 0];
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
/** @type {?} */
let currentElementNode = null;
/**
 * @return {?}
 */
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
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
 * Used to set the parent property when nodes are created.
  @type {?} */
let previousOrParentNode;
/**
 * @return {?}
 */
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentNode;
}
/** *
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
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
 * - when creating content queries (inb this previousOrParentNode points to a node on which we
 * create content queries).
 * @param {?} QueryType
 * @return {?}
 */
export function getOrCreateCurrentQueries(QueryType) {
    /** @type {?} */
    const tNode = previousOrParentNode.tNode;
    // if this is the first content query on a node, any existing LQueries needs to be cloned
    // in subsequent template passes, the cloning occurs before directive instantiation.
    if (previousOrParentNode.data !== viewData && !isContentQueryHost(tNode)) {
        currentQueries && (currentQueries = currentQueries.clone());
        tNode.flags |= 16384 /* hasContentQuery */;
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
/** @enum {number} */
const BindingDirection = {
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
 * @param {?} host Element to which the View is a child of
 * @return {?} the previous state;
 */
export function enterView(newView, host) {
    /** @type {?} */
    const oldView = viewData;
    directives = newView && newView[DIRECTIVES];
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    renderer = newView && newView[RENDERER];
    if (host != null) {
        previousOrParentNode = host;
        isParent = true;
    }
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
    viewData[BINDING_INDEX] = -1;
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
        /** @type {?} */
        const defs = /** @type {?} */ ((tView.directives));
        for (let i = 0; i < bindings.length; i += 2) {
            /** @type {?} */
            const dirIndex = bindings[i];
            /** @type {?} */
            const def = /** @type {?} */ (defs[dirIndex]);
            def.hostBindings && def.hostBindings(dirIndex, bindings[i + 1]);
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
    return [
        tView,
        viewData,
        null,
        null,
        // queries
        flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */,
        /** @type {?} */ ((null)),
        // hostNode
        -1,
        null,
        null,
        context,
        // context
        viewData ? viewData[INJECTOR] : null,
        renderer,
        // renderer
        sanitizer || null,
        null,
        // tail
        -1,
        null,
        null
    ];
}
/**
 * Creation of LNode object is extracted to a separate function so we always create LNode object
 * with the same shape
 * (same properties assigned in the same order).
 * @param {?} type
 * @param {?} currentView
 * @param {?} parent
 * @param {?} native
 * @param {?} state
 * @return {?}
 */
export function createLNodeObject(type, currentView, parent, native, state) {
    return {
        native: /** @type {?} */ (native),
        view: currentView,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        tNode: /** @type {?} */ ((null)),
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
export function createLNode(index, type, native, name, attrs, state) {
    /** @type {?} */
    const parent = isParent ? previousOrParentNode :
        previousOrParentNode && /** @type {?} */ (((getParentLNode(previousOrParentNode))));
    /** @type {?} */
    const tParent = parent && parent.view === viewData ? /** @type {?} */ (parent.tNode) : null;
    /** @type {?} */
    const isState = state != null;
    /** @type {?} */
    const node = createLNodeObject(type, viewData, parent, native, isState ? /** @type {?} */ (state) : null);
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = (state ? (/** @type {?} */ (state))[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        /** @type {?} */
        const adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        ngDevMode && assertDataNext(adjustedIndex);
        /** @type {?} */
        const tData = tView.data;
        viewData[adjustedIndex] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (adjustedIndex >= tData.length) {
            /** @type {?} */
            const tNode = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentNode) {
                /** @type {?} */
                const previousTNode = previousOrParentNode.tNode;
                previousTNode.next = tNode;
                if (previousTNode.dynamicContainerNode)
                    previousTNode.dynamicContainerNode.next = tNode;
            }
        }
        node.tNode = /** @type {?} */ (tData[adjustedIndex]);
        // Now link ourselves into the tree.
        if (isParent) {
            if (previousOrParentNode.tNode.child == null && previousOrParentNode.view === viewData ||
                previousOrParentNode.tNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                previousOrParentNode.tNode.child = node.tNode;
            }
        }
    }
    // View nodes and host elements need to set their host node (components set host nodes later)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        /** @type {?} */
        const lViewData = /** @type {?} */ (state);
        ngDevMode && assertNotDefined(lViewData[HOST_NODE], 'lViewData[HOST_NODE] should not have been initialized');
        lViewData[HOST_NODE] = node;
        if (firstTemplatePass)
            lViewData[TVIEW].node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
/**
 * Resets the application state.
 * @return {?}
 */
export function resetApplicationState() {
    isParent = false;
    previousOrParentNode = /** @type {?} */ ((null));
}
/**
 *
 * @template T
 * @param {?} hostNode Existing node to render into.
 * @param {?} templateFn Template function with the instructions.
 * @param {?} context to pass into the template.
 * @param {?} providedRendererFactory renderer factory to use
 * @param {?} host The host element node to use
 * @param {?=} directives Directive defs that should be used for matching
 * @param {?=} pipes Pipe defs that should be used for matching
 * @param {?=} sanitizer
 * @return {?}
 */
export function renderTemplate(hostNode, templateFn, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetApplicationState();
        rendererFactory = providedRendererFactory;
        /** @type {?} */
        const tView = getOrCreateTView(templateFn, directives || null, pipes || null, null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLViewData(providedRendererFactory.createRenderer(null, null), tView, {}, 2 /* CheckAlways */, sanitizer));
    }
    /** @type {?} */
    const hostView = /** @type {?} */ ((host.data));
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, templateFn);
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
export function createEmbeddedViewNode(tView, context, declarationView, renderer, queries) {
    /** @type {?} */
    const _isParent = isParent;
    /** @type {?} */
    const _previousOrParentNode = previousOrParentNode;
    isParent = true;
    previousOrParentNode = /** @type {?} */ ((null));
    /** @type {?} */
    const lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    /** @type {?} */
    const viewNode = createLNode(-1, 2 /* View */, null, null, null, lView);
    isParent = _isParent;
    previousOrParentNode = _previousOrParentNode;
    return viewNode;
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
 * @param {?} viewNode
 * @param {?} tView
 * @param {?} context
 * @param {?} rf
 * @return {?}
 */
export function renderEmbeddedTemplate(viewNode, tView, context, rf) {
    /** @type {?} */
    const _isParent = isParent;
    /** @type {?} */
    const _previousOrParentNode = previousOrParentNode;
    /** @type {?} */
    let oldView;
    if (/** @type {?} */ ((viewNode.data))[PARENT] == null && /** @type {?} */ ((viewNode.data))[CONTEXT] && !tView.template) {
        // This is a root view inside the view tree
        tickRootContext(/** @type {?} */ (((viewNode.data))[CONTEXT]));
    }
    else {
        try {
            isParent = true;
            previousOrParentNode = /** @type {?} */ ((null));
            oldView = enterView(/** @type {?} */ ((viewNode.data)), viewNode);
            namespaceHTML(); /** @type {?} */
            ((tView.template))(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews();
            }
            else {
                /** @type {?} */ ((viewNode.data))[TVIEW].firstTemplatePass = firstTemplatePass = false;
            }
        }
        finally {
            /** @type {?} */
            const isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(/** @type {?} */ ((oldView)), isCreationOnly);
            isParent = _isParent;
            previousOrParentNode = _previousOrParentNode;
        }
    }
    return viewNode;
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
 * @param {?} node
 * @param {?} hostView
 * @param {?} componentOrContext
 * @param {?=} templateFn
 * @return {?}
 */
export function renderComponentOrTemplate(node, hostView, componentOrContext, templateFn) {
    /** @type {?} */
    const oldView = enterView(hostView, node);
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
            setHostBindings(_ROOT_DIRECTIVE_INDICES);
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
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    /** @type {?} */
    const native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    /** @type {?} */
    const node = createLNode(index, 4 /* ElementContainer */, native, null, attrs || null, null);
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(node, localRefs);
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
        previousOrParentNode = /** @type {?} */ (getParentLNode(previousOrParentNode));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 4 /* ElementContainer */);
    currentQueries && (currentQueries = currentQueries.addNode(previousOrParentNode));
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
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
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    /** @type {?} */
    const native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    /** @type {?} */
    const node = createLNode(index, 3 /* Element */, /** @type {?} */ ((native)), name, attrs || null, null);
    currentElementNode = node;
    if (attrs) {
        setUpAttributes(native, attrs);
    }
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(node, localRefs);
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
 * @param {?} lNode
 * @return {?}
 */
function nativeNodeLocalRefExtractor(lNode) {
    return lNode.native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param {?} lNode LNode for which directive and locals should be created
 * @param {?} localRefs Local refs of the node in question
 * @param {?=} localRefExtractor mapping function that extracts local ref value from LNode
 * @return {?}
 */
function createDirectivesAndLocals(lNode, localRefs, localRefExtractor = nativeNodeLocalRefExtractor) {
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(lNode.tNode, tView, localRefs || null);
    }
    else {
        instantiateDirectivesDirectly();
    }
    saveResolvedLocalsInData(lNode, localRefExtractor);
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
                if ((/** @type {?} */ (def)).template) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    tNode.flags = 4096 /* isComponent */;
                }
                if (def.diPublic)
                    def.diPublic(def);
                (matches || (matches = [])).push(def, null);
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
        (tView.components || (tView.components = [])).push(viewData.length - 1);
    }
}
/**
 * Stores index of directive and host element so it will be queued for binding refresh during CD.
 * @param {?} dirIndex
 * @return {?}
 */
function queueHostBindingForCheck(dirIndex) {
    // Must subtract the header offset because hostBindings functions are generated with
    // instructions that expect element indices that are NOT adjusted (e.g. elementProperty).
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, viewData.length - 1 - HEADER_OFFSET);
}
/**
 * Sets the context for a ChangeDetectorRef to the given instance.
 * @param {?} injector
 * @param {?} instance
 * @param {?} view
 * @return {?}
 */
export function initChangeDetectorIfExisting(injector, instance, view) {
    if (injector && injector.changeDetectorRef != null) {
        (/** @type {?} */ (injector.changeDetectorRef))._setComponentContext(view, instance);
    }
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isContentQueryHost(tNode) {
    return (tNode.flags & 16384 /* hasContentQuery */) !== 0;
}
/**
 * @param {?} tNode
 * @return {?}
 */
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * This function instantiates the given directives.
 * @return {?}
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, `Directives should only be instantiated directly after first template pass`);
    /** @type {?} */
    const tNode = previousOrParentNode.tNode;
    /** @type {?} */
    const count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(tNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        /** @type {?} */
        const start = tNode.flags >> 15 /* DirectiveStartingIndexShift */;
        /** @type {?} */
        const end = start + count;
        /** @type {?} */
        const tDirectives = /** @type {?} */ ((tView.directives));
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = tDirectives[i];
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
 * @param {?} lNode
 * @param {?} localRefExtractor
 * @return {?}
 */
function saveResolvedLocalsInData(lNode, localRefExtractor) {
    /** @type {?} */
    const localNames = lNode.tNode.localNames;
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
            /** @type {?} */
            const index = /** @type {?} */ (localNames[i + 1]);
            /** @type {?} */
            const value = index === -1 ? localRefExtractor(lNode) : /** @type {?} */ ((directives))[index];
            viewData.push(value);
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param {?} templateFn The template from which to get static data
 * @param {?} directives Directive defs that should be saved on TView
 * @param {?} pipes Pipe defs that should be saved on TView
 * @param {?} viewQuery
 * @return {?} TView
 */
function getOrCreateTView(templateFn, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return templateFn.ngPrivateData || (templateFn.ngPrivateData = /** @type {?} */ (createTView(-1, templateFn, directives, pipes, viewQuery)));
}
/**
 * Creates a TView instance
 *
 * @param {?} viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param {?} templateFn
 * @param {?} directives Registry of directives for this view
 * @param {?} pipes Registry of pipes for this view
 * @param {?} viewQuery
 * @return {?}
 */
export function createTView(viewIndex, templateFn, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    return {
        id: viewIndex,
        template: templateFn,
        viewQuery: viewQuery,
        node: /** @type {?} */ ((null)),
        data: HEADER_FILLER.slice(),
        // Fill in to match HEADER_OFFSET in LViewData
        childIndex: -1,
        // Children set in addToViewTree(), if any
        bindingStartIndex: -1,
        // Set in initBindings()
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
        currentMatches: null
    };
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
    resetApplicationState();
    /** @type {?} */
    const node = createLNode(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
    if (firstTemplatePass) {
        node.tNode.flags = 4096 /* isComponent */;
        if (def.diPublic)
            def.diPublic(def);
        tView.directives = [def];
    }
    return node;
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
    ngDevMode && assertPreviousIsParent();
    ngDevMode && assertNodeOfPossibleTypes(previousOrParentNode, 3 /* Element */);
    /** @type {?} */
    const node = previousOrParentNode;
    /** @type {?} */
    const native = /** @type {?} */ (node.native);
    ngDevMode && ngDevMode.rendererAddEventListener++;
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    if (isProceduralRenderer(renderer)) {
        /** @type {?} */
        const wrappedListener = wrapListenerWithDirtyLogic(viewData, listenerFn);
        /** @type {?} */
        const cleanupFn = renderer.listen(native, eventName, wrappedListener);
        storeCleanupFn(viewData, cleanupFn);
    }
    else {
        /** @type {?} */
        const wrappedListener = wrapListenerWithDirtyAndDefault(viewData, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        /** @type {?} */
        const cleanupInstances = getCleanup(viewData);
        cleanupInstances.push(wrappedListener);
        if (firstTemplatePass) {
            getTViewCleanup(viewData).push(eventName, node.tNode.index, /** @type {?} */ ((cleanupInstances)).length - 1, useCapture);
        }
    }
    /** @type {?} */
    let tNode = node.tNode;
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(node.tNode.flags, 1 /* Output */);
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
        previousOrParentNode = /** @type {?} */ (getParentLNode(previousOrParentNode));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 3 /* Element */);
    currentQueries && (currentQueries = currentQueries.addNode(previousOrParentNode));
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
    currentElementNode = null;
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
    const tNode = node.tNode;
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(node.tNode.flags, 0 /* Input */);
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
    const lElement = /** @type {?} */ ((currentElementNode));
    /** @type {?} */
    const tNode = lElement.tNode;
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
 * every style declaration such as `<div style="color: 'red' ">` would result `StyleContext`
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
        const tNode = lElement.tNode;
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
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'text nodes should be created before bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    /** @type {?} */
    const textNode = createTextNode(value, renderer);
    /** @type {?} */
    const node = createLNode(index, 3 /* Element */, textNode, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(getParentLNode(node), textNode, viewData);
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
    const instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef);
    ngDevMode && assertDefined(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    /** @type {?} */
    const tNode = previousOrParentNode.tNode;
    /** @type {?} */
    const isComponent = (/** @type {?} */ (directiveDef)).template;
    if (isComponent) {
        addComponentLogic(directiveDefIdx, directive, /** @type {?} */ (directiveDef));
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(directiveDefIdx, directiveDef.onInit, directiveDef.doCheck, tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(directiveDefIdx);
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, instance, directiveDef.inputs, tNode);
    }
    if (directiveDef.contentQueries) {
        directiveDef.contentQueries();
    }
    return instance;
}
/**
 * @template T
 * @param {?} directiveIndex
 * @param {?} instance
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(directiveIndex, instance, def) {
    /** @type {?} */
    const tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery);
    /** @type {?} */
    const componentView = addToViewTree(viewData, /** @type {?} */ (previousOrParentNode.tNode.index), createLViewData(rendererFactory.createRenderer(/** @type {?} */ (previousOrParentNode.native), def), tView, instance, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    (/** @type {?} */ (previousOrParentNode)).data = componentView;
    (/** @type {?} */ (componentView))[HOST_NODE] = /** @type {?} */ (previousOrParentNode);
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, componentView);
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
 * @return {?}
 */
export function baseDirectiveCreate(index, directive, directiveDef) {
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    Object.defineProperty(directive, NG_HOST_SYMBOL, { enumerable: false, value: previousOrParentNode });
    if (directives == null)
        viewData[DIRECTIVES] = directives = [];
    ngDevMode && assertDataNext(index, directives);
    directives[index] = directive;
    if (firstTemplatePass) {
        /** @type {?} */
        const flags = previousOrParentNode.tNode.flags;
        if ((flags & 4095 /* DirectiveCountMask */) === 0) {
            // When the first directive is created:
            // - save the index,
            // - set the number of directives to 1
            previousOrParentNode.tNode.flags =
                index << 15 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
        }
        else {
            // Only need to bump the size when subsequent directives are created
            ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
            previousOrParentNode.tNode.flags++;
        }
    }
    else {
        /** @type {?} */
        const diPublic = /** @type {?} */ ((directiveDef)).diPublic;
        if (diPublic)
            diPublic(/** @type {?} */ ((directiveDef)));
    }
    if (/** @type {?} */ ((directiveDef)).attributes != null && previousOrParentNode.tNode.type == 3 /* Element */) {
        setUpAttributes((/** @type {?} */ (previousOrParentNode)).native, /** @type {?} */ (((directiveDef)).attributes));
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
 * @param {?} parentLNode the LNode in which the container's content will be rendered
 * @param {?} currentView The parent view of the LContainer
 * @param {?=} isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @return {?} LContainer
 */
export function createLContainer(parentLNode, currentView, isForViewContainerRef) {
    ngDevMode && assertDefined(parentLNode, 'containers should have a parent');
    /** @type {?} */
    let renderParent = canInsertNativeNode(parentLNode, currentView) ? /** @type {?} */ (parentLNode) :
        null;
    if (renderParent && renderParent.tNode.type === 2 /* View */) {
        renderParent = /** @type {?} */ ((getParentLNode(/** @type {?} */ (renderParent)))).data[RENDER_PARENT];
    }
    return [
        isForViewContainerRef ? null : 0,
        currentView,
        null,
        null,
        // queries
        [],
        /** @type {?} */ (renderParent)
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
 * @param {?=} tagName The name of the container element, if applicable
 * @param {?=} attrs The attrs attached to the container, if applicable
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @param {?=} localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 * @return {?}
 */
export function template(index, templateFn, tagName, attrs, localRefs, localRefExtractor) {
    /** @type {?} */
    const node = containerInternal(index, tagName || null, attrs || null, localRefs || null);
    if (firstTemplatePass) {
        node.tNode.tViews =
            createTView(-1, templateFn, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(node, localRefs, localRefExtractor);
    currentQueries && (currentQueries = currentQueries.addNode(node));
    queueLifecycleHooks(node.tNode.flags, tView);
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
    const node = containerInternal(index, null, null, null);
    firstTemplatePass && (node.tNode.tViews = []);
    isParent = false;
}
/**
 * @param {?} index
 * @param {?} tagName
 * @param {?} attrs
 * @param {?} localRefs
 * @return {?}
 */
function containerInternal(index, tagName, attrs, localRefs) {
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'container nodes should be created before any bindings');
    /** @type {?} */
    const currentParent = isParent ? previousOrParentNode : /** @type {?} */ ((getParentLNode(previousOrParentNode)));
    /** @type {?} */
    const lContainer = createLContainer(currentParent, viewData);
    ngDevMode && ngDevMode.rendererCreateComment++;
    /** @type {?} */
    const comment = renderer.createComment(ngDevMode ? 'container' : '');
    /** @type {?} */
    const node = createLNode(index, 0 /* Container */, comment, tagName, attrs, lContainer);
    appendChild(getParentLNode(node), comment, viewData);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, node.data);
    if (currentQueries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = currentQueries.container();
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    return node;
}
/**
 * Sets a container up to receive views.
 *
 * @param {?} index The index of the container in the data array
 * @return {?}
 */
export function containerRefreshStart(index) {
    previousOrParentNode = /** @type {?} */ (loadElement(index));
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    isParent = true;
    (/** @type {?} */ (previousOrParentNode)).data[ACTIVE_INDEX] = 0;
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
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentNode = /** @type {?} */ ((getParentLNode(previousOrParentNode)));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    /** @type {?} */
    const container = /** @type {?} */ (previousOrParentNode);
    ngDevMode && assertNodeType(container, 0 /* Container */);
    /** @type {?} */
    const nextIndex = /** @type {?} */ ((container.data[ACTIVE_INDEX]));
    // remove extra views at the end of the container
    while (nextIndex < container.data[VIEWS].length) {
        removeView(container, nextIndex);
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
                const lViewNode = container[VIEWS][i];
                /** @type {?} */
                const dynamicViewData = lViewNode.data;
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(lViewNode, dynamicViewData[TVIEW], /** @type {?} */ ((dynamicViewData[CONTEXT])), 2 /* Update */);
            }
        }
    }
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param {?} containerNode where to search for views
 * @param {?} startIdx starting index in the views array to search from
 * @param {?} viewBlockId exact view block id to look for
 * @return {?} index of a found view or -1 if not found
 */
function scanForView(containerNode, startIdx, viewBlockId) {
    /** @type {?} */
    const views = containerNode.data[VIEWS];
    for (let i = startIdx; i < views.length; i++) {
        /** @type {?} */
        const viewAtPositionId = views[i].data[TVIEW].id;
        if (viewAtPositionId === viewBlockId) {
            return views[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(containerNode, i);
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
 * @return {?} boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId) {
    /** @type {?} */
    const container = /** @type {?} */ ((isParent ? previousOrParentNode : getParentLNode(previousOrParentNode)));
    ngDevMode && assertNodeType(container, 0 /* Container */);
    /** @type {?} */
    const lContainer = container.data;
    /** @type {?} */
    let viewNode = scanForView(container, /** @type {?} */ ((lContainer[ACTIVE_INDEX])), viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        /** @type {?} */
        const newView = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            newView[QUERIES] = /** @type {?} */ ((lContainer[QUERIES])).createView();
        }
        enterView(newView, viewNode = createLNode(viewBlockId, 2 /* View */, null, null, null, newView));
    }
    if (container) {
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(container, viewNode, /** @type {?} */ ((lContainer[ACTIVE_INDEX])));
        } /** @type {?} */
        ((lContainer[ACTIVE_INDEX]))++;
    }
    return getRenderFlags(viewNode.data);
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view block must create or retrieve its own TView. Otherwise, the embedded view's
 * static data for a particular node would overwrite the static data for a node in the view above
 * it with the same index (since it's in the same template).
 *
 * @param {?} viewIndex The index of the TView in TNode.tViews
 * @param {?} parent The parent container in which to look for the view's static data
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    /** @type {?} */
    const containerTViews = /** @type {?} */ ((/** @type {?} */ (((parent)).tNode)).tViews);
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] =
            createTView(viewIndex, null, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/**
 * Marks the end of an embedded view.
 * @return {?}
 */
export function embeddedViewEnd() {
    refreshDescendantViews();
    isParent = false;
    previousOrParentNode = /** @type {?} */ (viewData[HOST_NODE]);
    leaveView(/** @type {?} */ ((viewData[PARENT])));
    ngDevMode && assertEqual(isParent, false, 'isParent');
    ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
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
    const element = /** @type {?} */ (viewData[adjustedElementIndex]);
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, `Component's host node should have an LViewData attached.`);
    /** @type {?} */
    const hostView = /** @type {?} */ ((element.data));
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        detectChangesInternal(hostView, element, hostView[CONTEXT]);
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
    const componentNode = findComponentHost(viewData);
    if (!componentNode.tNode.projection) {
        /** @type {?} */
        const noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        /** @type {?} */
        const pData = componentNode.tNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        /** @type {?} */
        const tails = pData.slice();
        /** @type {?} */
        let componentChild = componentNode.tNode.child;
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
    const node = createLNode(nodeIndex, 1 /* Projection */, null, null, attrs || null, null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (node.tNode.projection === null)
        node.tNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    /** @type {?} */
    const parent = getParentLNode(node);
    if (canInsertNativeNode(parent, viewData)) {
        /** @type {?} */
        const componentNode = findComponentHost(viewData);
        /** @type {?} */
        let nodeToProject = (/** @type {?} */ (componentNode.tNode.projection))[selectorIndex];
        /** @type {?} */
        let projectedView = componentNode.view;
        /** @type {?} */
        let projectionNodeIndex = -1;
        /** @type {?} */
        let grandparent;
        /** @type {?} */
        const renderParent = parent.tNode.type === 2 /* View */ ?
            (grandparent = /** @type {?} */ (getParentLNode(parent))) &&
                /** @type {?} */ ((grandparent.data[RENDER_PARENT])) : /** @type {?} */ (parent);
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                /** @type {?} */
                const currentComponentHost = findComponentHost(projectedView);
                /** @type {?} */
                const firstProjectedNode = (/** @type {?} */ (currentComponentHost.tNode.projection))[/** @type {?} */ (nodeToProject.projection)];
                if (firstProjectedNode) {
                    projectionNodeStack[++projectionNodeIndex] = projectedView[nodeToProject.index];
                    nodeToProject = firstProjectedNode;
                    projectedView = currentComponentHost.view;
                    continue;
                }
            }
            else {
                /** @type {?} */
                const lNode = projectedView[nodeToProject.index];
                lNode.tNode.flags |= 8192 /* isProjected */;
                appendProjectedNode(/** @type {?} */ (lNode), parent, viewData, renderParent);
            }
            // If we are finished with a list of re-projected nodes, we need to get
            // back to the root projection node that was re-projected.
            if (nodeToProject.next === null && projectedView !== componentNode.view) {
                /** @type {?} */
                const lNode = projectionNodeStack[projectionNodeIndex--];
                nodeToProject = lNode.tNode;
                projectedView = lNode.view;
            }
            nodeToProject = nodeToProject.next;
        }
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
 * Wraps an event listener so its host view and its ancestor views will be marked dirty
 * whenever the event fires. Necessary to support OnPush components.
 * @param {?} view
 * @param {?} listenerFn
 * @return {?}
 */
export function wrapListenerWithDirtyLogic(view, listenerFn) {
    return function (e) {
        markViewDirty(view);
        return listenerFn(e);
    };
}
/**
 * Wraps an event listener so its host view and its ancestor views will be marked dirty
 * whenever the event fires. Also wraps with preventDefault behavior.
 * @param {?} view
 * @param {?} listenerFn
 * @return {?}
 */
export function wrapListenerWithDirtyAndDefault(view, listenerFn) {
    return function wrapListenerIn_markViewDirty(e) {
        markViewDirty(view);
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
    while (currentView[PARENT] != null) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = /** @type {?} */ ((currentView[PARENT]));
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext');
    scheduleTick(/** @type {?} */ (currentView[CONTEXT]));
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
            tickRootContext(rootContext); /** @type {?} */
            ((res))(null);
            rootContext.clean = _CLEAN_PROMISE;
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
        /** @type {?} */
        const hostNode = _getComponentHostLElementNode(rootComponent);
        ngDevMode && assertDefined(hostNode.data, 'Component host node should be attached to an LView');
        renderComponentOrTemplate(hostNode, getRootView(rootComponent), rootComponent);
    }
}
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param {?} component any component
 * @return {?}
 */
export function getRootView(component) {
    ngDevMode && assertDefined(component, 'component');
    /** @type {?} */
    const lElementNode = _getComponentHostLElementNode(component);
    /** @type {?} */
    let lViewData = lElementNode.view;
    while (lViewData[PARENT]) {
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
    }
    return lViewData;
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
    const hostNode = _getComponentHostLElementNode(component);
    ngDevMode &&
        assertDefined(hostNode.data, 'Component host node should be attached to an LViewData instance.');
    detectChangesInternal(/** @type {?} */ (hostNode.data), hostNode, component);
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
 * @param {?} hostNode
 * @param {?} component
 * @return {?}
 */
export function detectChangesInternal(hostView, hostNode, component) {
    /** @type {?} */
    const oldView = enterView(hostView, hostNode);
    /** @type {?} */
    const hostTView = hostView[TVIEW];
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
    const lElementNode = _getComponentHostLElementNode(component);
    markViewDirty(lElementNode.view);
}
/** *
 * A special value which designates that a value has not changed.
  @type {?} */
export const NO_CHANGE = /** @type {?} */ ({});
/**
 *  Initializes the binding start index. Will get inlined.
 *
 *  This function must be called before any binding related function is called
 *  (ie `bind()`, `interpolationX()`, `pureFunctionX()`)
 * @return {?}
 */
function initBindings() {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], -1, 'Binding index should not yet be set ' + viewData[BINDING_INDEX]);
    if (tView.bindingStartIndex === -1) {
        tView.bindingStartIndex = viewData.length;
    }
    viewData[BINDING_INDEX] = tView.bindingStartIndex;
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(value) {
    return bindingUpdated(value) ? value : NO_CHANGE;
}
/**
 * Reserves slots for pure functions (`pureFunctionX` instructions)
 *
 * Bindings for pure functions are stored after the LNodes in the data array but before the binding.
 *
 *  ----------------------------------------------------------------------------
 *  |  LNodes ... | pure function bindings | regular bindings / interpolations |
 *  ----------------------------------------------------------------------------
 *                                         ^
 *                                         TView.bindingStartIndex
 *
 * Pure function instructions are given an offset from TView.bindingStartIndex.
 * Subtracting the offset from TView.bindingStartIndex gives the first index where the bindings
 * are stored.
 *
 * NOTE: reserveSlots instructions are only ever allowed at the very end of the creation block
 * @param {?} numSlots
 * @return {?}
 */
export function reserveSlots(numSlots) {
    // Init the slots with a unique `NO_CHANGE` value so that the first change is always detected
    // whether it happens or not during the first change detection pass - pure functions checks
    // might be skipped when short-circuited.
    viewData.length += numSlots;
    viewData.fill(NO_CHANGE, -numSlots);
    // We need to initialize the binding in case a `pureFunctionX` kind of binding instruction is
    // called first in the update section.
    initBindings();
}
/**
 * Sets up the binding index before executing any `pureFunctionX` instructions.
 *
 * The index must be restored after the pure function is executed
 *
 * {\@link reserveSlots}
 * @param {?} offset
 * @return {?}
 */
export function moveBindingIndexToReservedSlot(offset) {
    /** @type {?} */
    const currentSlot = viewData[BINDING_INDEX];
    viewData[BINDING_INDEX] = tView.bindingStartIndex - offset;
    return currentSlot;
}
/**
 * Restores the binding index to the given value.
 *
 * This function is typically used to restore the index after a `pureFunctionX` has
 * been executed.
 * @param {?} index
 * @return {?}
 */
export function restoreBindingIndex(index) {
    viewData[BINDING_INDEX] = index;
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
        bindingUpdated(values[i]) && (different = true);
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
    const different = bindingUpdated(v0);
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
    const different = bindingUpdated2(v0, v1);
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
    let different = bindingUpdated2(v0, v1);
    different = bindingUpdated(v2) || different;
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
    const different = bindingUpdated4(v0, v1, v2, v3);
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
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated(v4) || different;
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
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
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
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
    different = bindingUpdated(v6) || different;
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
    let different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated4(v4, v5, v6, v7) || different;
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
 * Gets the current binding value and increments the binding index.
 * @return {?}
 */
export function consumeBinding() {
    ngDevMode && assertDataInRange(viewData[BINDING_INDEX]);
    ngDevMode &&
        assertNotEqual(viewData[viewData[BINDING_INDEX]], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[viewData[BINDING_INDEX]++];
}
/**
 * Updates binding if changed, then returns whether it was updated.
 * @param {?} value
 * @return {?}
 */
export function bindingUpdated(value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    if (viewData[BINDING_INDEX] === -1)
        initBindings();
    /** @type {?} */
    const bindingIndex = viewData[BINDING_INDEX];
    if (bindingIndex >= viewData.length) {
        viewData[viewData[BINDING_INDEX]++] = value;
    }
    else if (isDifferent(viewData[bindingIndex], value, checkNoChangesMode)) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, viewData[bindingIndex], value);
        viewData[viewData[BINDING_INDEX]++] = value;
    }
    else {
        viewData[BINDING_INDEX]++;
        return false;
    }
    return true;
}
/**
 * Updates binding if changed, then returns the latest value.
 * @param {?} value
 * @return {?}
 */
export function checkAndUpdateBinding(value) {
    bindingUpdated(value);
    return value;
}
/**
 * Updates 2 bindings if changed, then returns whether either was updated.
 * @param {?} exp1
 * @param {?} exp2
 * @return {?}
 */
export function bindingUpdated2(exp1, exp2) {
    /** @type {?} */
    const different = bindingUpdated(exp1);
    return bindingUpdated(exp2) || different;
}
/**
 * Updates 4 bindings if changed, then returns whether any was updated.
 * @param {?} exp1
 * @param {?} exp2
 * @param {?} exp3
 * @param {?} exp4
 * @return {?}
 */
export function bindingUpdated4(exp1, exp2, exp3, exp4) {
    /** @type {?} */
    const different = bindingUpdated2(exp1, exp2);
    return bindingUpdated2(exp3, exp4) || different;
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
    assertEqual(isParent, true, 'previousOrParentNode should be a parent');
}
/**
 * @return {?}
 */
function assertHasParent() {
    assertDefined(getParentLNode(previousOrParentNode), 'previousOrParentNode should have a parent');
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
/**
 * On the first template pass, the reserved slots should be set `NO_CHANGE`.
 *
 * If not, they might not have been actually reserved.
 * @param {?} slotOffset
 * @param {?} numSlots
 * @return {?}
 */
export function assertReservedSlotInitialized(slotOffset, numSlots) {
    if (firstTemplatePass) {
        /** @type {?} */
        const startIndex = tView.bindingStartIndex - slotOffset;
        for (let i = 0; i < numSlots; i++) {
            assertEqual(viewData[startIndex + i], NO_CHANGE, 'The reserved slots should be set to `NO_CHANGE` on first template pass');
        }
    }
}
/**
 * @template T
 * @param {?} component
 * @return {?}
 */
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertDefined(component, 'expecting component got null');
    /** @type {?} */
    const lElementNode = /** @type {?} */ ((/** @type {?} */ (component))[NG_HOST_SYMBOL]);
    ngDevMode && assertDefined(component, 'object is not a component');
    return lElementNode;
}
/** @type {?} */
export const CLEAN_PROMISE = _CLEAN_PROMISE;
/** @type {?} */
export const ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQU12QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RHLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RyxPQUFPLEVBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM1RixPQUFPLEVBQUMsWUFBWSxFQUFjLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUl0RixPQUFPLEVBQWtCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFakYsT0FBTyxFQUEwRyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BLLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQXNCLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXlCLElBQUksRUFBbUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQWUsU0FBUyxFQUFFLElBQUksRUFBUyxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM1UyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGlCQUFpQixFQUFpQixh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QkFBd0IsS0FBYSxFQUFFLEdBQVc7SUFDaEQsSUFBSSxHQUFHLElBQUksSUFBSTtRQUFFLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDaEMsV0FBVyxDQUNQLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsS0FBSyw2Q0FBNkMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Q0FDbEc7Ozs7Ozs7OztBQU9ELE1BQU0sd0NBQXdDLFVBQWtCLEVBQUUsUUFBZ0I7SUFDaEYsSUFBSSxpQkFBaUIsRUFBRTs7UUFDckIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztRQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pDLFdBQVcsQ0FDUCxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFDbkMsd0VBQXdFLENBQUMsQ0FBQztTQUMvRTtLQUNGO0NBQ0Y7Ozs7OztBQUVELE1BQU0sd0NBQTJDLFNBQVk7SUFDM0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsOEJBQThCLENBQUMsQ0FBQzs7SUFDdEUsTUFBTSxZQUFZLHFCQUFHLG1CQUFDLFNBQWdCLEVBQUMsQ0FBQyxjQUFjLENBQWlCLEVBQUM7SUFDeEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUNuRSxPQUFPLFlBQVksQ0FBQztDQUNyQjs7QUFFRCxhQUFhLGFBQWEsR0FBRyxjQUFjLENBQUM7O0FBQzVDLGFBQWEsc0JBQXNCLEdBQUcsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3REZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmSW50ZXJuYWwsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEluaXRpYWxTdHlsaW5nRmxhZ3MsIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTE5vZGVXaXRoTG9jYWxSZWZzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05URU5UX1FVRVJJRVMsIENPTlRFWFQsIEN1cnJlbnRNYXRjaGVzTGlzdCwgREVDTEFSQVRJT05fVklFVywgRElSRUNUSVZFUywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgTFZpZXdGbGFncywgTkVYVCwgT3BhcXVlVmlld1N0YXRlLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSb290Q29udGV4dCwgU0FOSVRJWkVSLCBUQUlMLCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGUsIGNhbkluc2VydE5hdGl2ZU5vZGUsIGNyZWF0ZVRleHROb2RlLCBmaW5kQ29tcG9uZW50SG9zdCwgZ2V0Q2hpbGRMTm9kZSwgZ2V0TFZpZXdDaGlsZCwgZ2V0TmV4dExOb2RlLCBnZXRQYXJlbnRMTm9kZSwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBtYXRjaGluZ1NlbGVjdG9ySW5kZXh9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHQsIGFsbG9jU3R5bGluZ0NvbnRleHQsIGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUsIHJlbmRlclN0eWxpbmcgYXMgcmVuZGVyRWxlbWVudFN0eWxlcywgdXBkYXRlQ2xhc3NQcm9wIGFzIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AsIHVwZGF0ZVN0eWxlUHJvcCBhcyB1cGRhdGVFbGVtZW50U3R5bGVQcm9wLCB1cGRhdGVTdHlsaW5nTWFwfSBmcm9tICcuL3N0eWxpbmcnO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZUludGVybmFsLCBpc0RpZmZlcmVudCwgbG9hZEVsZW1lbnRJbnRlcm5hbCwgbG9hZEludGVybmFsLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG4vKipcbiAqIERpcmVjdGl2ZSAoRCkgc2V0cyBhIHByb3BlcnR5IG9uIGFsbCBjb21wb25lbnQgaW5zdGFuY2VzIHVzaW5nIHRoaXMgY29uc3RhbnQgYXMgYSBrZXkgYW5kIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBub2RlIChMRWxlbWVudCkgYXMgdGhlIHZhbHVlLiBUaGlzIGlzIHVzZWQgaW4gbWV0aG9kcyBsaWtlIGRldGVjdENoYW5nZXMgdG9cbiAqIGZhY2lsaXRhdGUganVtcGluZyBmcm9tIGFuIGluc3RhbmNlIHRvIHRoZSBob3N0IG5vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBOR19IT1NUX1NZTUJPTCA9ICdfX25nSG9zdExOb2RlX18nO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICpcbiAqIFNhdmVkIGhlcmUgdG8gYXZvaWQgcmUtaW5zdGFudGlhdGluZyBhbiBhcnJheSBvbiBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqXG4gKiBOb3RlOiBFbGVtZW50IGlzIG5vdCBhY3R1YWxseSBzdG9yZWQgYXQgaW5kZXggMCBiZWNhdXNlIG9mIHRoZSBMVmlld0RhdGFcbiAqIGhlYWRlciwgYnV0IHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGV4cGVjdHMgYW4gaW5kZXggdGhhdCBpcyBOT1QgYWRqdXN0ZWRcbiAqIGJlY2F1c2UgaXQgd2lsbCB1bHRpbWF0ZWx5IGJlIGZlZCB0byBpbnN0cnVjdGlvbnMgbGlrZSBlbGVtZW50UHJvcGVydHkuXG4gKi9cbmNvbnN0IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gWzAsIDBdO1xuXG4vKipcbiAqIFRWaWV3LmRhdGEgbmVlZHMgdG8gZmlsbCB0aGUgc2FtZSBudW1iZXIgb2Ygc2xvdHMgYXMgdGhlIExWaWV3RGF0YSBoZWFkZXJcbiAqIHNvIHRoZSBpbmRpY2VzIG9mIG5vZGVzIGFyZSBjb25zaXN0ZW50IGJldHdlZW4gTFZpZXdEYXRhIGFuZCBUVmlldy5kYXRhLlxuICpcbiAqIEl0J3MgbXVjaCBmYXN0ZXIgdG8ga2VlcCBhIGJsdWVwcmludCBvZiB0aGUgcHJlLWZpbGxlZCBhcnJheSBhbmQgc2xpY2UgaXRcbiAqIHRoYW4gaXQgaXMgdG8gY3JlYXRlIGEgbmV3IGFycmF5IGFuZCBmaWxsIGl0IGVhY2ggdGltZSBhIFRWaWV3IGlzIGNyZWF0ZWQuXG4gKi9cbmNvbnN0IEhFQURFUl9GSUxMRVIgPSBuZXcgQXJyYXkoSEVBREVSX09GRlNFVCkuZmlsbChudWxsKTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlcjtcbn1cblxubGV0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVyRmFjdG9yeSgpOiBSZW5kZXJlckZhY3RvcnkzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXJGYWN0b3J5O1xufVxuXG5sZXQgY3VycmVudEVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGV8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgcmV0dXJuIHZpZXdEYXRhICYmIHZpZXdEYXRhW1NBTklUSVpFUl07XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSByZXN0b3JlVmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VmlldygpOiBPcGFxdWVWaWV3U3RhdGUge1xuICByZXR1cm4gdmlld0RhdGEgYXMgYW55IGFzIE9wYXF1ZVZpZXdTdGF0ZTtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBjb250ZXh0Vmlld0RhdGEgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlld0RhdGE7XG59XG5cbi8qKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQuICovXG5sZXQgcHJldmlvdXNPclBhcmVudE5vZGU6IExOb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKTogTE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICovXG5sZXQgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbmxldCB0VmlldzogVFZpZXc7XG5cbmxldCBjdXJyZW50UXVlcmllczogTFF1ZXJpZXN8bnVsbDtcblxuLyoqXG4gKiBRdWVyeSBpbnN0cnVjdGlvbnMgY2FuIGFzayBmb3IgXCJjdXJyZW50IHF1ZXJpZXNcIiBpbiAyIGRpZmZlcmVudCBjYXNlczpcbiAqIC0gd2hlbiBjcmVhdGluZyB2aWV3IHF1ZXJpZXMgKGF0IHRoZSByb290IG9mIGEgY29tcG9uZW50IHZpZXcsIGJlZm9yZSBhbnkgbm9kZSBpcyBjcmVhdGVkIC0gaW5cbiAqIHRoaXMgY2FzZSBjdXJyZW50UXVlcmllcyBwb2ludHMgdG8gdmlldyBxdWVyaWVzKVxuICogLSB3aGVuIGNyZWF0aW5nIGNvbnRlbnQgcXVlcmllcyAoaW5iIHRoaXMgcHJldmlvdXNPclBhcmVudE5vZGUgcG9pbnRzIHRvIGEgbm9kZSBvbiB3aGljaCB3ZVxuICogY3JlYXRlIGNvbnRlbnQgcXVlcmllcykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUN1cnJlbnRRdWVyaWVzKFxuICAgIFF1ZXJ5VHlwZToge25ldyAocGFyZW50OiBudWxsLCBzaGFsbG93OiBudWxsLCBkZWVwOiBudWxsKTogTFF1ZXJpZXN9KTogTFF1ZXJpZXMge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuXG4gIC8vIGlmIHRoaXMgaXMgdGhlIGZpcnN0IGNvbnRlbnQgcXVlcnkgb24gYSBub2RlLCBhbnkgZXhpc3RpbmcgTFF1ZXJpZXMgbmVlZHMgdG8gYmUgY2xvbmVkXG4gIC8vIGluIHN1YnNlcXVlbnQgdGVtcGxhdGUgcGFzc2VzLCB0aGUgY2xvbmluZyBvY2N1cnMgYmVmb3JlIGRpcmVjdGl2ZSBpbnN0YW50aWF0aW9uLlxuICBpZiAocHJldmlvdXNPclBhcmVudE5vZGUuZGF0YSAhPT0gdmlld0RhdGEgJiYgIWlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpKTtcbiAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgfVxuXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fCAoY3VycmVudFF1ZXJpZXMgPSBuZXcgUXVlcnlUeXBlKG51bGwsIG51bGwsIG51bGwpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjcmVhdGlvbk1vZGU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgdmlld0RhdGE6IExWaWV3RGF0YTtcblxuLyoqXG4gKiBJbnRlcm5hbCBmdW5jdGlvbiB0aGF0IHJldHVybnMgdGhlIGN1cnJlbnQgTFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIFRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHNob3VsZCBiZSB1c2VkIGZvciBhbnl0aGluZyBwdWJsaWMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Vmlld0RhdGEoKTogTFZpZXdEYXRhIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld0RhdGE7XG59XG5cbi8qKlxuICogVGhlIGxhc3Qgdmlld0RhdGEgcmV0cmlldmVkIGJ5IG5leHRDb250ZXh0KCkuXG4gKiBBbGxvd3MgYnVpbGRpbmcgbmV4dENvbnRleHQoKSBhbmQgcmVmZXJlbmNlKCkgY2FsbHMuXG4gKlxuICogZS5nLiBjb25zdCBpbm5lciA9IHgoKS4kaW1wbGljaXQ7IGNvbnN0IG91dGVyID0geCgpLiRpbXBsaWNpdDtcbiAqL1xubGV0IGNvbnRleHRWaWV3RGF0YTogTFZpZXdEYXRhID0gbnVsbCAhO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAqXG4gKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gKi9cbmxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG5mdW5jdGlvbiBnZXRDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3RGF0YSwgaG9zdDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IG9sZFZpZXc6IExWaWV3RGF0YSA9IHZpZXdEYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3W0RJUkVDVElWRVNdO1xuICB0VmlldyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tUVklFV107XG5cbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG5cbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUkVOREVSRVJdO1xuXG4gIGlmIChob3N0ICE9IG51bGwpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGhvc3Q7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICB9XG5cbiAgdmlld0RhdGEgPSBjb250ZXh0Vmlld0RhdGEgPSBuZXdWaWV3O1xuICBvbGRWaWV3ICYmIChvbGRWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMpO1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tRVUVSSUVTXTtcblxuICByZXR1cm4gb2xkVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBjcmVhdGlvbk9ubHkgQW4gb3B0aW9uYWwgYm9vbGVhbiB0byBpbmRpY2F0ZSB0aGF0IHRoZSB2aWV3IHdhcyBwcm9jZXNzZWQgaW4gY3JlYXRpb24gbW9kZVxuICogb25seSwgaS5lLiB0aGUgZmlyc3QgdXBkYXRlIHdpbGwgYmUgZG9uZSBsYXRlci4gT25seSBwb3NzaWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgdmlld0RhdGFbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICB2aWV3RGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IC0xO1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIHRoZSB2aWV3LCBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBzdGVwcyBpbiB0aGF0IG9yZGVyOlxuICogdHJpZ2dlcnMgaW5pdCBob29rcywgcmVmcmVzaGVzIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MsIHRyaWdnZXJzIGNvbnRlbnQgaG9va3MsIHNldHMgaG9zdFxuICogYmluZGluZ3MsIHJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzLlxuICogTm90ZTogdmlldyBob29rcyBhcmUgdHJpZ2dlcmVkIGxhdGVyIHdoZW4gbGVhdmluZyB0aGUgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpIHtcbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3Modmlld0RhdGEpO1xuXG4gIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuXG4gIHNldEhvc3RCaW5kaW5ncyh0Vmlldy5ob3N0QmluZGluZ3MpO1xuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyhiaW5kaW5nczogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChiaW5kaW5ncyAhPSBudWxsKSB7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgJiYgZGVmLmhvc3RCaW5kaW5ncyhkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjb250ZW50IHF1ZXJpZXMgZm9yIGFsbCBkaXJlY3RpdmVzIGluIHRoZSBnaXZlbiB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZURlZklkeF07XG5cbiAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllc1JlZnJlc2ggIShkaXJlY3RpdmVEZWZJZHgsIHRWaWV3LmNvbnRlbnRRdWVyaWVzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzKCk6IHZvaWQge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3RGF0YTxUPihcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncyxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXdEYXRhIHtcbiAgcmV0dXJuIFtcbiAgICB0VmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRWaWV3XG4gICAgdmlld0RhdGEsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuUnVuSW5pdCwgIC8vIGZsYWdzXG4gICAgbnVsbCAhLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0Tm9kZVxuICAgIC0xLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmluZGluZ0luZGV4XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkaXJlY3RpdmVzXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjbGVhbnVwSW5zdGFuY2VzXG4gICAgY29udGV4dCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250ZXh0XG4gICAgdmlld0RhdGEgPyB2aWV3RGF0YVtJTkpFQ1RPUl0gOiBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmplY3RvclxuICAgIHJlbmRlcmVyLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZGVyZXJcbiAgICBzYW5pdGl6ZXIgfHwgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNhbml0aXplclxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGFpbFxuICAgIC0xLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGFpbmVySW5kZXhcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzXG4gICAgbnVsbCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkZWNsYXJhdGlvblZpZXdcbiAgXTtcbn1cblxuLyoqXG4gKiBDcmVhdGlvbiBvZiBMTm9kZSBvYmplY3QgaXMgZXh0cmFjdGVkIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gd2UgYWx3YXlzIGNyZWF0ZSBMTm9kZSBvYmplY3RcbiAqIHdpdGggdGhlIHNhbWUgc2hhcGVcbiAqIChzYW1lIHByb3BlcnRpZXMgYXNzaWduZWQgaW4gdGhlIHNhbWUgb3JkZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBwYXJlbnQ6IExOb2RlIHwgbnVsbCxcbiAgICBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsXG4gICAgc3RhdGU6IGFueSk6IExFbGVtZW50Tm9kZSZMVGV4dE5vZGUmTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIHJldHVybiB7XG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LFxuICAgIHZpZXc6IGN1cnJlbnRWaWV3LFxuICAgIG5vZGVJbmplY3RvcjogcGFyZW50ID8gcGFyZW50Lm5vZGVJbmplY3RvciA6IG51bGwsXG4gICAgZGF0YTogc3RhdGUsXG4gICAgdE5vZGU6IG51bGwgISxcbiAgICBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBBIGNvbW1vbiB3YXkgb2YgY3JlYXRpbmcgdGhlIExOb2RlIHRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGVtIGhhdmUgc2FtZSBzaGFwZSB0b1xuICoga2VlcCB0aGUgZXhlY3V0aW9uIGNvZGUgbW9ub21vcnBoaWMgYW5kIGZhc3QuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgTE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgTE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBMTm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBkYXRhIEFueSBkYXRhIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIHRoZSBMTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbFZpZXdEYXRhPzogTFZpZXdEYXRhIHwgbnVsbCk6IExFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuVmlldywgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogbnVsbCxcbiAgICBsVmlld0RhdGE6IExWaWV3RGF0YSk6IExWaWV3Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGxDb250YWluZXI6IExDb250YWluZXIpOiBMQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIGxQcm9qZWN0aW9uOiBudWxsKTogTFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGRhdGE6IG51bGwpOiBMRWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgc3RhdGU/OiBudWxsIHwgTFZpZXdEYXRhIHwgTENvbnRhaW5lcik6IExFbGVtZW50Tm9kZSZMVGV4dE5vZGUmXG4gICAgTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIGNvbnN0IHBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlICYmIGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhYXMgTE5vZGU7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCB0UGFyZW50ID1cbiAgICAgIHBhcmVudCAmJiBwYXJlbnQudmlldyA9PT0gdmlld0RhdGEgPyBwYXJlbnQudE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuXG4gIGNvbnN0IGlzU3RhdGUgPSBzdGF0ZSAhPSBudWxsO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGVPYmplY3QodHlwZSwgdmlld0RhdGEsIHBhcmVudCwgbmF0aXZlLCBpc1N0YXRlID8gc3RhdGUgYXMgYW55IDogbnVsbCk7XG5cbiAgaWYgKGluZGV4ID09PSAtMSB8fCB0eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAgIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiBUVmlldy5ub2RlLlxuICAgIG5vZGUudE5vZGUgPSAoc3RhdGUgPyAoc3RhdGUgYXMgTFZpZXdEYXRhKVtUVklFV10ubm9kZSA6IG51bGwpIHx8XG4gICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCB0UGFyZW50LCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gICAgLy8gVGhpcyBpcyBhbiBlbGVtZW50IG9yIGNvbnRhaW5lciBvciBwcm9qZWN0aW9uIG5vZGVcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoYWRqdXN0ZWRJbmRleCk7XG4gICAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuXG4gICAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGFkanVzdGVkSW5kZXggPj0gdERhdGEubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgICAgICBjcmVhdGVUTm9kZSh0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycywgdFBhcmVudCwgbnVsbCk7XG4gICAgICBpZiAoIWlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnROb2RlKSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzVE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcbiAgICAgICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICAgIGlmIChwcmV2aW91c1ROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSBwcmV2aW91c1ROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgbm9kZS50Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICBpZiAocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPT0gbnVsbCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS52aWV3ID09PSB2aWV3RGF0YSB8fFxuICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IFZpZXcuXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmNoaWxkID0gbm9kZS50Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBWaWV3IG5vZGVzIGFuZCBob3N0IGVsZW1lbnRzIG5lZWQgdG8gc2V0IHRoZWlyIGhvc3Qgbm9kZSAoY29tcG9uZW50cyBzZXQgaG9zdCBub2RlcyBsYXRlcilcbiAgaWYgKCh0eXBlICYgVE5vZGVUeXBlLlZpZXdPckVsZW1lbnQpID09PSBUTm9kZVR5cGUuVmlld09yRWxlbWVudCAmJiBpc1N0YXRlKSB7XG4gICAgY29uc3QgbFZpZXdEYXRhID0gc3RhdGUgYXMgTFZpZXdEYXRhO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3REZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0sICdsVmlld0RhdGFbSE9TVF9OT0RFXSBzaG91bGQgbm90IGhhdmUgYmVlbiBpbml0aWFsaXplZCcpO1xuICAgIGxWaWV3RGF0YVtIT1NUX05PREVdID0gbm9kZTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIGxWaWV3RGF0YVtUVklFV10ubm9kZSA9IG5vZGUudE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldEFwcGxpY2F0aW9uU3RhdGUoKSB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gaG9zdE5vZGUgRXhpc3Rpbmcgbm9kZSB0byByZW5kZXIgaW50by5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCBjb250ZXh0OiBULFxuICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBob3N0OiBMRWxlbWVudE5vZGUgfCBudWxsLFxuICAgIGRpcmVjdGl2ZXM/OiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM/OiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIGlmIChob3N0ID09IG51bGwpIHtcbiAgICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgICByZW5kZXJlckZhY3RvcnkgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTtcbiAgICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcodGVtcGxhdGVGbiwgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsLCBudWxsKTtcbiAgICBob3N0ID0gY3JlYXRlTE5vZGUoXG4gICAgICAgIC0xLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwsXG4gICAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpLCB0Vmlldywge30sIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgICBzYW5pdGl6ZXIpKTtcbiAgfVxuICBjb25zdCBob3N0VmlldyA9IGhvc3QuZGF0YSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VmlldywgJ0hvc3Qgbm9kZSBzaG91bGQgaGF2ZSBhbiBMVmlldyBkZWZpbmVkIGluIGhvc3QuZGF0YS4nKTtcbiAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShob3N0LCBob3N0VmlldywgY29udGV4dCwgdGVtcGxhdGVGbik7XG4gIHJldHVybiBob3N0O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXdEYXRhLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHF1ZXJpZXM/OiBMUXVlcmllcyB8IG51bGwpOiBMVmlld05vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgY29uc3QgbFZpZXcgPVxuICAgICAgY3JlYXRlTFZpZXdEYXRhKHJlbmRlcmVyLCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBkZWNsYXJhdGlvblZpZXc7XG5cbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IHF1ZXJpZXMuY3JlYXRlVmlldygpO1xuICB9XG4gIGNvbnN0IHZpZXdOb2RlID0gY3JlYXRlTE5vZGUoLTEsIFROb2RlVHlwZS5WaWV3LCBudWxsLCBudWxsLCBudWxsLCBsVmlldyk7XG5cbiAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnROb2RlO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdOb2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgcmY6IFJlbmRlckZsYWdzKTogTFZpZXdOb2RlfFxuICAgIExFbGVtZW50Tm9kZSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3RGF0YTtcbiAgaWYgKHZpZXdOb2RlLmRhdGEgIVtQQVJFTlRdID09IG51bGwgJiYgdmlld05vZGUuZGF0YSAhW0NPTlRFWFRdICYmICF0Vmlldy50ZW1wbGF0ZSkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQodmlld05vZGUuZGF0YSAhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld05vZGUuZGF0YSAhLCB2aWV3Tm9kZSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKHJmLCBjb250ZXh0KTtcbiAgICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3Tm9kZS5kYXRhICFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIGlzIGNhbGxlZCB0d2ljZSBpbiBmYWN0LCBvbmNlIGZvciBjcmVhdGlvbiBvbmx5IGFuZCB0aGVuIG9uY2UgZm9yXG4gICAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgICAgY29uc3QgaXNDcmVhdGlvbk9ubHkgPSAocmYgJiBSZW5kZXJGbGFncy5DcmVhdGUpID09PSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBpc0NyZWF0aW9uT25seSk7XG4gICAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY29udGV4dCBhdCB0aGUgbGV2ZWwgc3BlY2lmaWVkIGFuZCBzYXZlcyBpdCBhcyB0aGUgZ2xvYmFsLCBjb250ZXh0Vmlld0RhdGEuXG4gKiBXaWxsIGdldCB0aGUgbmV4dCBsZXZlbCB1cCBpZiBsZXZlbCBpcyBub3Qgc3BlY2lmaWVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBzYXZlIGNvbnRleHRzIG9mIHBhcmVudCB2aWV3cyBzbyB0aGV5IGNhbiBiZSBib3VuZCBpbiBlbWJlZGRlZCB2aWV3cywgb3JcbiAqIGluIGNvbmp1bmN0aW9uIHdpdGggcmVmZXJlbmNlKCkgdG8gYmluZCBhIHJlZiBmcm9tIGEgcGFyZW50IHZpZXcuXG4gKlxuICogQHBhcmFtIGxldmVsIFRoZSByZWxhdGl2ZSBsZXZlbCBvZiB0aGUgdmlldyBmcm9tIHdoaWNoIHRvIGdyYWIgY29udGV4dCBjb21wYXJlZCB0byBjb250ZXh0VmV3RGF0YVxuICogQHJldHVybnMgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHQ8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgY29udGV4dFZpZXdEYXRhID0gd2Fsa1VwVmlld3MobGV2ZWwsIGNvbnRleHRWaWV3RGF0YSAhKTtcbiAgcmV0dXJuIGNvbnRleHRWaWV3RGF0YVtDT05URVhUXSBhcyBUO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBub2RlOiBMRWxlbWVudE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudE9yQ29udGV4dDogVCxcbiAgICB0ZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0Vmlldywgbm9kZSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZUZuKSB7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50T3JDb250ZXh0ICEpO1xuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaChIRUFERVJfT0ZGU0VUKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ2VsZW1lbnRzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICduZy1jb250YWluZXInIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Q29udGFpbmVyTm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZSwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIG5hdGl2ZSwgdmlld0RhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKG5vZGUsIGxvY2FsUmVmcyk7XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExFbGVtZW50Q29udGFpbmVyTm9kZTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIGN1cnJlbnRRdWVyaWVzICYmIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpKTtcblxuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCB0Vmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCBub2RlOiBMRWxlbWVudE5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG4gIGN1cnJlbnRFbGVtZW50Tm9kZSA9IG5vZGU7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICB9XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBuYXRpdmUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhub2RlLCBsb2NhbFJlZnMpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IHJlbmRlcmVyO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuZnVuY3Rpb24gbmF0aXZlTm9kZUxvY2FsUmVmRXh0cmFjdG9yKGxOb2RlOiBMTm9kZVdpdGhMb2NhbFJlZnMpOiBSTm9kZSB7XG4gIHJldHVybiBsTm9kZS5uYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbE5vZGUgTE5vZGUgZm9yIHdoaWNoIGRpcmVjdGl2ZSBhbmQgbG9jYWxzIHNob3VsZCBiZSBjcmVhdGVkXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gTE5vZGVcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0FuZExvY2FscyhcbiAgICBsTm9kZTogTE5vZGVXaXRoTG9jYWxSZWZzLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBuYXRpdmVOb2RlTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShsTm9kZS50Tm9kZSwgdFZpZXcsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpO1xuICB9XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsTm9kZSwgbG9jYWxSZWZFeHRyYWN0b3IpO1xufVxuXG4vKipcbiAqIE9uIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHdlIG1hdGNoIGVhY2ggbm9kZSBhZ2FpbnN0IGF2YWlsYWJsZSBkaXJlY3RpdmUgc2VsZWN0b3JzIGFuZCBzYXZlXG4gKiB0aGUgcmVzdWx0aW5nIGRlZnMgaW4gdGhlIGNvcnJlY3QgaW5zdGFudGlhdGlvbiBvcmRlciBmb3Igc3Vic2VxdWVudCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnNcbiAqIChzbyBkZXBlbmRlbmNpZXMgYXJlIGFsd2F5cyBjcmVhdGVkIGJlZm9yZSB0aGUgZGlyZWN0aXZlcyB0aGF0IGluamVjdCB0aGVtKS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpbiB0c2lja2xlLlxuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgY29uc3QgbWF0Y2hlcyA9IHRWaWV3LmN1cnJlbnRNYXRjaGVzID0gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGUpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgY29uc3QgdmFsdWVJbmRleCA9IGkgKyAxO1xuICAgICAgcmVzb2x2ZURpcmVjdGl2ZShkZWYsIHZhbHVlSW5kZXgsIG1hdGNoZXMsIHRWaWV3KTtcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAobWF0Y2hlc1t2YWx1ZUluZGV4XSBhcyBudW1iZXIsIGRlZiwgZXhwb3J0c01hcCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgICAgIChtYXRjaGVzIHx8IChtYXRjaGVzID0gW10pKS5wdXNoKGRlZiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzIGFzIEN1cnJlbnRNYXRjaGVzTGlzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+LCB2YWx1ZUluZGV4OiBudW1iZXIsIG1hdGNoZXM6IEN1cnJlbnRNYXRjaGVzTGlzdCxcbiAgICB0VmlldzogVFZpZXcpOiBhbnkge1xuICBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gbnVsbCkge1xuICAgIG1hdGNoZXNbdmFsdWVJbmRleF0gPSBDSVJDVUxBUjtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGRlZi5mYWN0b3J5KCk7XG4gICAgKHRWaWV3LmRpcmVjdGl2ZXMgfHwgKHRWaWV3LmRpcmVjdGl2ZXMgPSBbXSkpLnB1c2goZGVmKTtcbiAgICByZXR1cm4gZGlyZWN0aXZlQ3JlYXRlKG1hdGNoZXNbdmFsdWVJbmRleF0gPSB0Vmlldy5kaXJlY3RpdmVzICEubGVuZ3RoIC0gMSwgaW5zdGFuY2UsIGRlZik7XG4gIH0gZWxzZSBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gQ0lSQ1VMQVIpIHtcbiAgICAvLyBJZiB3ZSByZXZpc2l0IHRoaXMgZGlyZWN0aXZlIGJlZm9yZSBpdCdzIHJlc29sdmVkLCB3ZSBrbm93IGl0J3MgY2lyY3VsYXJcbiAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihkZWYudHlwZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZnVuY3Rpb24gcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKCk6IHZvaWQge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IFtdKSkucHVzaCh2aWV3RGF0YS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5mdW5jdGlvbiBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soZGlySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAvLyBNdXN0IHN1YnRyYWN0IHRoZSBoZWFkZXIgb2Zmc2V0IGJlY2F1c2UgaG9zdEJpbmRpbmdzIGZ1bmN0aW9ucyBhcmUgZ2VuZXJhdGVkIHdpdGhcbiAgLy8gaW5zdHJ1Y3Rpb25zIHRoYXQgZXhwZWN0IGVsZW1lbnQgaW5kaWNlcyB0aGF0IGFyZSBOT1QgYWRqdXN0ZWQgKGUuZy4gZWxlbWVudFByb3BlcnR5KS5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChmaXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuICAodFZpZXcuaG9zdEJpbmRpbmdzIHx8ICh0Vmlldy5ob3N0QmluZGluZ3MgPSBbXG4gICBdKSkucHVzaChkaXJJbmRleCwgdmlld0RhdGEubGVuZ3RoIC0gMSAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKiogU2V0cyB0aGUgY29udGV4dCBmb3IgYSBDaGFuZ2VEZXRlY3RvclJlZiB0byB0aGUgZ2l2ZW4gaW5zdGFuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhcbiAgICBpbmplY3RvcjogTEluamVjdG9yIHwgbnVsbCwgaW5zdGFuY2U6IGFueSwgdmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGlmIChpbmplY3RvciAmJiBpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiAhPSBudWxsKSB7XG4gICAgKGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdSZWY8YW55PikuX3NldENvbXBvbmVudENvbnRleHQodmlldywgaW5zdGFuY2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeSkgIT09IDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaW5zdGFudGlhdGVzIHRoZSBnaXZlbiBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZpcnN0VGVtcGxhdGVQYXNzLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICBgRGlyZWN0aXZlcyBzaG91bGQgb25seSBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkgYWZ0ZXIgZmlyc3QgdGVtcGxhdGUgcGFzc2ApO1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuICBjb25zdCBjb3VudCA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkgJiYgY3VycmVudFF1ZXJpZXMpIHtcbiAgICBjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCk7XG4gIH1cblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiA9IHREaXJlY3RpdmVzW2ldO1xuICAgICAgZGlyZWN0aXZlQ3JlYXRlKGksIGRlZi5mYWN0b3J5KCksIGRlZik7XG4gICAgfVxuICB9XG59XG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fCBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXdEYXRhIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICBsTm9kZTogTE5vZGVXaXRoTG9jYWxSZWZzLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IGxOb2RlLnROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID8gbG9jYWxSZWZFeHRyYWN0b3IobE5vZGUpIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHwgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEsIHRlbXBsYXRlRm4sIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHBpcGVzIFJlZ2lzdHJ5IG9mIHBpcGVzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IEhFQURFUl9GSUxMRVIuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld0RhdGFcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogLTEsICAgICAgICAvLyBTZXQgaW4gaW5pdEJpbmRpbmdzKClcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKFxuICAgICAgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyLCBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICB0Vmlldy5kaXJlY3RpdmVzID0gW2RlZl07XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlIGFzIFJFbGVtZW50O1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKHZpZXdEYXRhLCBsaXN0ZW5lckZuKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obmF0aXZlLCBldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwRm4odmlld0RhdGEsIGNsZWFudXBGbik7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdCh2aWV3RGF0YSwgbGlzdGVuZXJGbik7XG4gICAgbmF0aXZlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIGNvbnN0IGNsZWFudXBJbnN0YW5jZXMgPSBnZXRDbGVhbnVwKHZpZXdEYXRhKTtcbiAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3RGF0YSkucHVzaChcbiAgICAgICAgICBldmVudE5hbWUsIG5vZGUudE5vZGUuaW5kZXgsIGNsZWFudXBJbnN0YW5jZXMgIS5sZW5ndGggLSAxLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSBub2RlLnROb2RlO1xuICBpZiAodE5vZGUub3V0cHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gaWYgd2UgY3JlYXRlIFROb2RlIGhlcmUsIGlucHV0cyBtdXN0IGJlIHVuZGVmaW5lZCBzbyB3ZSBrbm93IHRoZXkgc3RpbGwgbmVlZCB0byBiZVxuICAgIC8vIGNoZWNrZWRcbiAgICB0Tm9kZS5vdXRwdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gdmlld0RhdGE7XG4gIGdldENsZWFudXAodmlldykucHVzaChjb250ZXh0KTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4sIHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlld0RhdGEsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgYXMgTEVsZW1lbnROb2RlO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSk7XG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MsIHRWaWV3KTtcbiAgY3VycmVudEVsZW1lbnROb2RlID0gbnVsbDtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBudW1iZXIgaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgVGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkIHdoZW4gdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICogICAgICAgICAgICAgICAgICBPdGhlcndpc2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZ2lmaWVkIHZhbHVlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBsb2FkRWxlbWVudChpbmRleCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBjb25zdCBzdHJWYWx1ZSA9IHNhbml0aXplciA9PSBudWxsID8gc3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSk7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybjtcbiAgY29uc3Qgbm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBMRWxlbWVudE5vZGU7XG4gIGNvbnN0IHROb2RlID0gbm9kZS50Tm9kZTtcbiAgLy8gaWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZFxuICBpZiAodE5vZGUgJiYgdE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgdE5vZGUuaW5wdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cblxuICBjb25zdCBpbnB1dERhdGEgPSB0Tm9kZSAmJiB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChpbnB1dERhdGEgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgbWFya0RpcnR5SWZPblB1c2gobm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlIHByb3BlcnR5XG4gICAgLy8gaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgY29uc3QgbmF0aXZlID0gbm9kZS5uYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0UHJvcGVydHkobmF0aXZlLCBwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmF0aXZlLnNldFByb3BlcnR5ID8gbmF0aXZlLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmF0aXZlIGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhZGp1c3RlZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgb2YgdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0eXBlOiBUTm9kZVR5cGUsIGFkanVzdGVkSW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBwYXJlbnQ6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgZmxhZ3M6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogdFZpZXdzLFxuICAgIG5leHQ6IG51bGwsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgcGFyZW50OiBwYXJlbnQsXG4gICAgZHluYW1pY0NvbnRhaW5lck5vZGU6IG51bGwsXG4gICAgZGV0YWNoZWQ6IG51bGwsXG4gICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgIHByb2plY3Rpb246IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGljZXMgYW5kIG1pbmlmaWVkIGlucHV0IG5hbWVzLCBzZXRzIHRoZVxuICogaW5wdXQgcHJvcGVydGllcyBvbiB0aGUgY29ycmVzcG9uZGluZyBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbnB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGRpcmVjdGl2ZXMgIVtpbnB1dHNbaV0gYXMgbnVtYmVyXVtpbnB1dHNbaSArIDFdXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGxOb2RlRmxhZ3MgbG9naWNhbCBub2RlIGZsYWdzXG4gKiBAcGFyYW0gRGlyZWN0aW9uIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIHROb2RlRmxhZ3M6IFROb2RlRmxhZ3MsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgY291bnQgPSB0Tm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQWRkIG9yIHJlbW92ZSBhIGNsYXNzIGluIGEgYGNsYXNzTGlzdGAgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgW2NsYXNzLmZvb109XCJleHBcIiBjYXNlXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBjbGFzc05hbWUgTmFtZSBvZiBjbGFzcyB0byB0b2dnbGUuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gY2xhc3Mgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgc3R5bGluZ0luZGV4LCB2YWx1ZSA/IHRydWUgOiBmYWxzZSk7XG59XG5cbi8qKlxuICogQXNzaWduIGFueSBpbmxpbmUgc3R5bGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIGFwcGx5IGFsbCBzdHlsaW5nXG4gKiAoZS5nLiBgc3R5bGU9XCIuLi5cImApIHZhbHVlcyB0byB0aGUgZWxlbWVudC4gVGhpcyBpcyBhbHNvIHdoZXJlIHRoZSBwcm92aWRlZCBpbmRleFxuICogdmFsdWUgaXMgYWxsb2NhdGVkIGZvciB0aGUgc3R5bGluZyBkZXRhaWxzIGZvciBpdHMgY29ycmVzcG9uZGluZyBlbGVtZW50ICh0aGUgZWxlbWVudFxuICogaW5kZXggaXMgdGhlIHByZXZpb3VzIGluZGV4IHZhbHVlIGZyb20gdGhpcyBvbmUpLlxuICpcbiAqIChOb3RlIHRoaXMgZnVuY3Rpb24gY2FsbHMgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGltbWVkaWF0ZWx5IHdoZW4gY2FsbGVkLilcbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IHZhbHVlIHdoaWNoIHdpbGwgYmUgYWxsb2NhdGVkIHRvIHN0b3JlIHN0eWxpbmcgZGF0YSBmb3IgdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIHJlZ2lzdGVyZWQgb24gdGhlIGVsZW1lbnQuXG4gKiAgIEVhY2ggaW5kaXZpZHVhbCBzdHlsZSB3aWxsIGJlIHVzZWQgb24gdGhlIGVsZW1lbnQgYXMgbG9uZyBhcyBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICogICBieSBhbnkgY2xhc3NlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbY2xhc3NdYCkgb3Igc2luZ3VsYXIgKGBbY2xhc3MubmFtZWRdYClcbiAqICAgYmluZGluZ3MuIElmIGEgY2xhc3MgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBhIGZhbHN5IHZhbHVlIHRoZW4gdGhlIG1hdGNoaW5nIGluaXRpYWxcbiAqICAgY2xhc3MgdmFsdWUgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZURlY2xhcmF0aW9ucyBBIGtleS92YWx1ZSBhcnJheSBvZiBDU1Mgc3R5bGVzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IHN0eWxlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbc3R5bGVdYCkgb3Igc2luZ3VsYXIgKGBbc3R5bGUucHJvcF1gKVxuICogICBiaW5kaW5ncy4gSWYgYSBzdHlsZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIG51bGwgdGhlbiB0aGUgaW5pdGlhbCBzdHlsaW5nXG4gKiAgIHZhbHVlcyB0aGF0IGFyZSBwYXNzZWQgaW4gaGVyZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGlmIG1hdGNoZWQpLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCAoaWYgcHJvdmlkZWQpXG4gKiAgIHRvIHNhbml0aXplIHRoZSBhbnkgQ1NTIHByb3BlcnR5IHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nPFQ+KFxuICAgIGNsYXNzRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IGJvb2xlYW4gfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCxcbiAgICBzdHlsZURlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxFbGVtZW50ID0gY3VycmVudEVsZW1lbnROb2RlICE7XG4gIGNvbnN0IHROb2RlID0gbEVsZW1lbnQudE5vZGU7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgLy8gaW5pdGlhbGl6ZSB0aGUgc3R5bGluZyB0ZW1wbGF0ZS5cbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPVxuICAgICAgICBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlKGNsYXNzRGVjbGFyYXRpb25zLCBzdHlsZURlY2xhcmF0aW9ucywgc3R5bGVTYW5pdGl6ZXIpO1xuICB9XG4gIGlmIChzdHlsZURlY2xhcmF0aW9ucyAmJiBzdHlsZURlY2xhcmF0aW9ucy5sZW5ndGggfHxcbiAgICAgIGNsYXNzRGVjbGFyYXRpb25zICYmIGNsYXNzRGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgIGVsZW1lbnRTdHlsaW5nQXBwbHkodE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSBgU3R5bGluZ0NvbnRleHRgIGF0IGEgZ2l2ZW4gaW5kZXguXG4gKlxuICogVGhpcyBtZXRob2QgbGF6aWx5IGNyZWF0ZXMgdGhlIGBTdHlsaW5nQ29udGV4dGAuIFRoaXMgaXMgYmVjYXVzZSBpbiBtb3N0IGNhc2VzXG4gKiB3ZSBoYXZlIHN0eWxpbmcgd2l0aG91dCBhbnkgYmluZGluZ3MuIENyZWF0aW5nIGBTdHlsaW5nQ29udGV4dGAgZWFnZXJseSB3b3VsZCBtZWFuIHRoYXRcbiAqIGV2ZXJ5IHN0eWxlIGRlY2xhcmF0aW9uIHN1Y2ggYXMgYDxkaXYgc3R5bGU9XCJjb2xvcjogJ3JlZCcgXCI+YCB3b3VsZCByZXN1bHQgYFN0eWxlQ29udGV4dGBcbiAqIHdoaWNoIHdvdWxkIGNyZWF0ZSB1bm5lY2Vzc2FyeSBtZW1vcnkgcHJlc3N1cmUuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBhbGxvY2F0aW9uLiBTZWU6IGBlbGVtZW50U3R5bGluZ2AuXG4gKi9cbmZ1bmN0aW9uIGdldFN0eWxpbmdDb250ZXh0KGluZGV4OiBudW1iZXIpOiBTdHlsaW5nQ29udGV4dCB7XG4gIGxldCBzdHlsaW5nQ29udGV4dCA9IGxvYWQ8U3R5bGluZ0NvbnRleHQ+KGluZGV4KTtcbiAgaWYgKCFBcnJheS5pc0FycmF5KHN0eWxpbmdDb250ZXh0KSkge1xuICAgIGNvbnN0IGxFbGVtZW50ID0gc3R5bGluZ0NvbnRleHQgYXMgYW55IGFzIExFbGVtZW50Tm9kZTtcbiAgICBjb25zdCB0Tm9kZSA9IGxFbGVtZW50LnROb2RlO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgJ2dldFN0eWxpbmdDb250ZXh0KCkgY2FsbGVkIGJlZm9yZSBlbGVtZW50U3R5bGluZygpJyk7XG4gICAgc3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID1cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChsRWxlbWVudCwgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dDtcbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgd2hpY2ggaGF2ZSBiZWVuIHF1ZXVlZCBieSBhbnkgc3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gb25jZSBvbmUgb3IgbW9yZSBgZWxlbWVudFN0eWxlYCBhbmQvb3IgYGVsZW1lbnRTdHlsZVByb3BgXG4gKiBoYXZlIGJlZW4gaXNzdWVkIGFnYWluc3QgdGhlIGVsZW1lbnQuIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIGRldGVybWluZSBpZiBhbnkgc3R5bGVzIGhhdmVcbiAqIGNoYW5nZWQgYW5kIHdpbGwgdGhlbiBza2lwIHRoZSBvcGVyYXRpb24gaWYgdGhlcmUgaXMgbm90aGluZyBuZXcgdG8gcmVuZGVyLlxuICpcbiAqIE9uY2UgY2FsbGVkIHRoZW4gYWxsIHF1ZXVlZCBzdHlsZXMgd2lsbCBiZSBmbHVzaGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5PFQ+KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgcmVuZGVyRWxlbWVudFN0eWxlcyhnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHJlbmRlcmVyKTtcbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGdpdmVuIHN0eWxlIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGBudWxsYCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxlYCBvciBhbnkgc3R5bGVzIHRoYXQgYXJlIHByZXNlbnRcbiAqIGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCAod2l0aCBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBwcm9wZXJ0eSBvbiB0aGlzIGVsZW1lbnQuIChNb25vdG9uaWNhbGx5IGluY3JlYXNpbmcuKVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgbnVsbCwgc3VmZml4Pzogc3RyaW5nKTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSBzdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCk7XG59XG5cbi8qKlxuICogUXVldWUgYSBrZXkvdmFsdWUgbWFwIG9mIHN0eWxlcyB0byBiZSByZW5kZXJlZCBvbiBhbiBFbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS4gV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAqIHRoZSBFbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHBsYWNlZCB3aXRoIHJlc3BlY3QgdG8gYW55IHN0eWxlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAuXG4gKiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gYG51bGxgIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCAodW5sZXNzIHRoZSBzYW1lXG4gKiBzdHlsZSBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gdXNpbmcgYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0byBjaGFuZ2UgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdNYXA8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICB1cGRhdGVTdHlsaW5nTWFwKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIGNvbnN0IHRleHROb2RlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dE5vZGUsIG51bGwsIG51bGwpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIHRleHROb2RlLCB2aWV3RGF0YSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGNvbnN0IGV4aXN0aW5nTm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBhbnkgYXMgTFRleHROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZSwgJ0xOb2RlIHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZS5uYXRpdmUsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGV4aXN0aW5nTm9kZS5uYXRpdmUsIHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ05vZGUubmF0aXZlLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBEaXJlY3RpdmVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIGEgZGlyZWN0aXZlIGFuZCB0aGVpciBhc3NvY2lhdGVkIGNvbnRlbnQgcXVlcmllcy5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZik7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUsICdwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZScpO1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuXG4gIGNvbnN0IGlzQ29tcG9uZW50ID0gKGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPikudGVtcGxhdGU7XG4gIGlmIChpc0NvbXBvbmVudCkge1xuICAgIGFkZENvbXBvbmVudExvZ2ljKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCB0Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpcmVjdGl2ZURlZklkeCk7XG4gIH1cblxuICBpZiAodE5vZGUgJiYgdE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoZGlyZWN0aXZlRGVmSWR4LCBpbnN0YW5jZSwgZGlyZWN0aXZlRGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcykge1xuICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcygpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcoZGVmLnRlbXBsYXRlLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5KTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICB2aWV3RGF0YSwgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihwcmV2aW91c09yUGFyZW50Tm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQsIGRlZiksIHRWaWV3LFxuICAgICAgICAgIGluc3RhbmNlLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSkpO1xuXG4gIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBob3N0IG5vZGUvZGF0YSBoZXJlIGJlY2F1c2Ugd2hlbiB0aGUgY29tcG9uZW50IExOb2RlIHdhcyBjcmVhdGVkLFxuICAvLyB3ZSBkaWRuJ3QgeWV0IGtub3cgaXQgd2FzIGEgY29tcG9uZW50IChqdXN0IGFuIGVsZW1lbnQpLlxuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXN7ZGF0YTogTFZpZXdEYXRhfSkuZGF0YSA9IGNvbXBvbmVudFZpZXc7XG4gIChjb21wb25lbnRWaWV3IGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA9IHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExFbGVtZW50Tm9kZTtcblxuICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKHByZXZpb3VzT3JQYXJlbnROb2RlLm5vZGVJbmplY3RvciwgaW5zdGFuY2UsIGNvbXBvbmVudFZpZXcpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKCk7XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgZGlyZWN0aXZlQ3JlYXRlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnRcbiAqXG4gKiBUaGlzIHZlcnNpb24gZG9lcyBub3QgY29udGFpbiBmZWF0dXJlcyB0aGF0IHdlIGRvbid0IGFscmVhZHkgc3VwcG9ydCBhdCByb290IGluXG4gKiBjdXJyZW50IEFuZ3VsYXIuIEV4YW1wbGU6IGxvY2FsIHJlZnMgYW5kIGlucHV0cyBvbiByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULFxuICAgIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD58IENvbXBvbmVudERlZkludGVybmFsPFQ+KTogVCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgZGlyZWN0aXZlLCBOR19IT1NUX1NZTUJPTCwge2VudW1lcmFibGU6IGZhbHNlLCB2YWx1ZTogcHJldmlvdXNPclBhcmVudE5vZGV9KTtcblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSB2aWV3RGF0YVtESVJFQ1RJVkVTXSA9IGRpcmVjdGl2ZXMgPSBbXTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgsIGRpcmVjdGl2ZXMpO1xuICBkaXJlY3RpdmVzW2luZGV4XSA9IGRpcmVjdGl2ZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBmbGFncyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzO1xuICAgIGlmICgoZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaykgPT09IDApIHtcbiAgICAgIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkOlxuICAgICAgLy8gLSBzYXZlIHRoZSBpbmRleCxcbiAgICAgIC8vIC0gc2V0IHRoZSBudW1iZXIgb2YgZGlyZWN0aXZlcyB0byAxXG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncyA9XG4gICAgICAgICAgaW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQgfCAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPbmx5IG5lZWQgdG8gYnVtcCB0aGUgc2l6ZSB3aGVuIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZFxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MrKztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGlQdWJsaWMgPSBkaXJlY3RpdmVEZWYgIS5kaVB1YmxpYztcbiAgICBpZiAoZGlQdWJsaWMpIGRpUHVibGljKGRpcmVjdGl2ZURlZiAhKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHNldFVwQXR0cmlidXRlcyhcbiAgICAgICAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzIGFzIHN0cmluZ1tdKTtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgaW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZzt9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIHBhcmVudExOb2RlIHRoZSBMTm9kZSBpbiB3aGljaCB0aGUgY29udGFpbmVyJ3MgY29udGVudCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgcGFyZW50TE5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudExOb2RlLCAnY29udGFpbmVycyBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xuICBsZXQgcmVuZGVyUGFyZW50ID0gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnRMTm9kZSwgY3VycmVudFZpZXcpID9cbiAgICAgIHBhcmVudExOb2RlIGFzIExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSA6XG4gICAgICBudWxsO1xuICBpZiAocmVuZGVyUGFyZW50ICYmIHJlbmRlclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIHJlbmRlclBhcmVudCA9IGdldFBhcmVudExOb2RlKHJlbmRlclBhcmVudCBhcyBMVmlld05vZGUpICEuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgfVxuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IG51bGwgOiAwLCAgLy8gYWN0aXZlIGluZGV4XG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgcmVuZGVyUGFyZW50IGFzIExFbGVtZW50Tm9kZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGFuIG5nLXRlbXBsYXRlIChkeW5hbWljYWxseS1pbnNlcnRlZCB2aWV3KSwgZS5nLlxuICpcbiAqIDxuZy10ZW1wbGF0ZSAjZm9vPlxuICogICAgPGRpdj48L2Rpdj5cbiAqIDwvbmctdGVtcGxhdGU+XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBJbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCBub2RlID0gY29udGFpbmVySW50ZXJuYWwoaW5kZXgsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbG9jYWxSZWZzIHx8IG51bGwpO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLnRWaWV3cyA9XG4gICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobm9kZSwgbG9jYWxSZWZzLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIGN1cnJlbnRRdWVyaWVzICYmIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUobm9kZSkpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKG5vZGUudE5vZGUuZmxhZ3MsIHRWaWV3KTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlIGZvciBpbmxpbmUgdmlld3MsIGUuZy5cbiAqXG4gKiAlIGlmIChzaG93aW5nKSB7XG4gKiAgIDxkaXY+PC9kaXY+XG4gKiAlIH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lcihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIGZpcnN0VGVtcGxhdGVQYXNzICYmIChub2RlLnROb2RlLnRWaWV3cyA9IFtdKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY29udGFpbmVySW50ZXJuYWwoXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IExDb250YWluZXJOb2RlIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGN1cnJlbnRQYXJlbnQgPSBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDogZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICE7XG4gIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGN1cnJlbnRQYXJlbnQsIHZpZXdEYXRhKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50ID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCB0YWdOYW1lLCBhdHRycywgbENvbnRhaW5lcik7XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBjb21tZW50LCB2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUodmlld0RhdGEsIGluZGV4ICsgSEVBREVSX09GRlNFVCwgbm9kZS5kYXRhKTtcblxuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gbm9kZTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBMTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGFbQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAvLyBXZSBuZWVkIHRvIGV4ZWN1dGUgaW5pdCBob29rcyBoZXJlIHNvIG5nT25Jbml0IGhvb2tzIGFyZSBjYWxsZWQgaW4gdG9wIGxldmVsIHZpZXdzXG4gICAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXJOb2RlLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyTm9kZSBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIFZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgITtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBjb250YWluZXIgPSBwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IG5leHRJbmRleCA9IGNvbnRhaW5lci5kYXRhW0FDVElWRV9JTkRFWF0gITtcblxuICAvLyByZW1vdmUgZXh0cmEgdmlld3MgYXQgdGhlIGVuZCBvZiB0aGUgY29udGFpbmVyXG4gIHdoaWxlIChuZXh0SW5kZXggPCBjb250YWluZXIuZGF0YVtWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBsVmlld05vZGUgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBsVmlld05vZGUuZGF0YTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBsVmlld05vZGUsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLCBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyTm9kZSB3aGVyZSB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gc3RhcnRJZHggc3RhcnRpbmcgaW5kZXggaW4gdGhlIHZpZXdzIGFycmF5IHRvIHNlYXJjaCBmcm9tXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgZXhhY3QgdmlldyBibG9jayBpZCB0byBsb29rIGZvclxuICogQHJldHVybnMgaW5kZXggb2YgYSBmb3VuZCB2aWV3IG9yIC0xIGlmIG5vdCBmb3VuZFxuICovXG5mdW5jdGlvbiBzY2FuRm9yVmlldyhcbiAgICBjb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlciwgdmlld0Jsb2NrSWQ6IG51bWJlcik6IExWaWV3Tm9kZXxudWxsIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXS5kYXRhW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoIGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBjb250YWluZXIgPVxuICAgICAgKGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkpIGFzIExDb250YWluZXJOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lci5kYXRhO1xuICBsZXQgdmlld05vZGU6IExWaWV3Tm9kZXxudWxsID0gc2NhbkZvclZpZXcoY29udGFpbmVyLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3Tm9kZSkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gdmlld05vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIGVudGVyVmlldyh2aWV3Tm9kZS5kYXRhLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICBjb25zdCBuZXdWaWV3ID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlciwgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb250YWluZXIpLCBudWxsLCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuXG4gICAgaWYgKGxDb250YWluZXJbUVVFUklFU10pIHtcbiAgICAgIG5ld1ZpZXdbUVVFUklFU10gPSBsQ29udGFpbmVyW1FVRVJJRVNdICEuY3JlYXRlVmlldygpO1xuICAgIH1cblxuICAgIGVudGVyVmlldyhcbiAgICAgICAgbmV3Vmlldywgdmlld05vZGUgPSBjcmVhdGVMTm9kZSh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIG5ld1ZpZXcpKTtcbiAgfVxuICBpZiAoY29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyLCB2aWV3Tm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISsrO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPVxuICAgICAgICBjcmVhdGVUVmlldyh2aWV3SW5kZXgsIG51bGwsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG4gIHJldHVybiBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XTtcbn1cblxuLyoqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdFbmQoKTogdm9pZCB7XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3RGF0YVtIT1NUX05PREVdIGFzIExWaWV3Tm9kZTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc1BhcmVudCwgZmFsc2UsICdpc1BhcmVudCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gYWRqdXN0ZWRFbGVtZW50SW5kZXggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdEYXRhW10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaDxUPihhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGVsZW1lbnQgPSB2aWV3RGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoZWxlbWVudC5kYXRhLCBgQ29tcG9uZW50J3MgaG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3RGF0YSBhdHRhY2hlZC5gKTtcbiAgY29uc3QgaG9zdFZpZXcgPSBlbGVtZW50LmRhdGEgITtcblxuICAvLyBPbmx5IGF0dGFjaGVkIENoZWNrQWx3YXlzIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICh2aWV3QXR0YWNoZWQoaG9zdFZpZXcpICYmIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdFZpZXcsIGVsZW1lbnQsIGhvc3RWaWV3W0NPTlRFWFRdKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWQodmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBjb21wb25lbnROb2RlOiBMRWxlbWVudE5vZGUgPSBmaW5kQ29tcG9uZW50SG9zdCh2aWV3RGF0YSk7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcERhdGE6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobm9PZk5vZGVCdWNrZXRzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcERhdGEuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudE5vZGUudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldEluZGV4ID1cbiAgICAgICAgICBzZWxlY3RvcnMgPyBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKSA6IDA7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG5cbiAgICAgIGlmICh0YWlsc1tidWNrZXRJbmRleF0pIHtcbiAgICAgICAgdGFpbHNbYnVja2V0SW5kZXhdICEubmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcERhdGFbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IExQcm9qZWN0aW9uTm9kZVtdID0gW107XG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24obm9kZUluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKG5vZGVJbmRleCwgVE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIG51bGwsIGF0dHJzIHx8IG51bGwsIG51bGwpO1xuXG4gIC8vIFdlIGNhbid0IHVzZSB2aWV3RGF0YVtIT1NUX05PREVdIGJlY2F1c2UgcHJvamVjdGlvbiBub2RlcyBjYW4gYmUgbmVzdGVkIGluIGVtYmVkZGVkIHZpZXdzLlxuICBpZiAobm9kZS50Tm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSBub2RlLnROb2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIHN0b3JlZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG5cbiAgaWYgKGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCB2aWV3RGF0YSkpIHtcbiAgICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3Qodmlld0RhdGEpO1xuICAgIGxldCBub2RlVG9Qcm9qZWN0ID0gKGNvbXBvbmVudE5vZGUudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3NlbGVjdG9ySW5kZXhdO1xuICAgIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Tm9kZS52aWV3O1xuICAgIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG4gICAgbGV0IGdyYW5kcGFyZW50OiBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCByZW5kZXJQYXJlbnQgPSBwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICAoZ3JhbmRwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShwYXJlbnQpIGFzIExDb250YWluZXJOb2RlKSAmJlxuICAgICAgICAgICAgZ3JhbmRwYXJlbnQuZGF0YVtSRU5ERVJfUEFSRU5UXSAhIDpcbiAgICAgICAgcGFyZW50IGFzIExFbGVtZW50Tm9kZTtcblxuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAvLyBUaGlzIG5vZGUgaXMgcmUtcHJvamVjdGVkLCBzbyB3ZSBtdXN0IGdvIHVwIHRoZSB0cmVlIHRvIGdldCBpdHMgcHJvamVjdGVkIG5vZGVzLlxuICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGZpbmRDb21wb25lbnRIb3N0KHByb2plY3RlZFZpZXcpO1xuICAgICAgICBjb25zdCBmaXJzdFByb2plY3RlZE5vZGUgPSAoY3VycmVudENvbXBvbmVudEhvc3QudE5vZGUucHJvamVjdGlvbiBhcyhcbiAgICAgICAgICAgIFROb2RlIHwgbnVsbClbXSlbbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgICAgaWYgKGZpcnN0UHJvamVjdGVkTm9kZSkge1xuICAgICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHByb2plY3RlZFZpZXdbbm9kZVRvUHJvamVjdC5pbmRleF07XG4gICAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgICBwcm9qZWN0ZWRWaWV3ID0gY3VycmVudENvbXBvbmVudEhvc3QudmlldztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbE5vZGUgPSBwcm9qZWN0ZWRWaWV3W25vZGVUb1Byb2plY3QuaW5kZXhdO1xuICAgICAgICBsTm9kZS50Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgICAgICAgICAgbE5vZGUgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUsIHBhcmVudCwgdmlld0RhdGEsIHJlbmRlclBhcmVudCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGFyZSBmaW5pc2hlZCB3aXRoIGEgbGlzdCBvZiByZS1wcm9qZWN0ZWQgbm9kZXMsIHdlIG5lZWQgdG8gZ2V0XG4gICAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgICBpZiAobm9kZVRvUHJvamVjdC5uZXh0ID09PSBudWxsICYmIHByb2plY3RlZFZpZXcgIT09IGNvbXBvbmVudE5vZGUudmlldykge1xuICAgICAgICAvLyBtb3ZlIGRvd24gaW50byB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHdlJ3JlIHByb2plY3RpbmcgcmlnaHQgbm93XG4gICAgICAgIGNvbnN0IGxOb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dO1xuICAgICAgICBub2RlVG9Qcm9qZWN0ID0gbE5vZGUudE5vZGU7XG4gICAgICAgIHByb2plY3RlZFZpZXcgPSBsTm9kZS52aWV3O1xuICAgICAgfVxuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QubmV4dDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3aGVyZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld0RhdGFbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXdEYXRhfExDb250YWluZXI+KFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGFkanVzdGVkSG9zdEluZGV4OiBudW1iZXIsIHN0YXRlOiBUKTogVCB7XG4gIGlmIChjdXJyZW50Vmlld1tUQUlMXSkge1xuICAgIGN1cnJlbnRWaWV3W1RBSUxdICFbTkVYVF0gPSBzdGF0ZTtcbiAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmNoaWxkSW5kZXggPSBhZGp1c3RlZEhvc3RJbmRleDtcbiAgfVxuICBjdXJyZW50Vmlld1tUQUlMXSA9IHN0YXRlO1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXdEYXRhIGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGU6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAvLyBCZWNhdXNlIGRhdGEgZmxvd3MgZG93biB0aGUgY29tcG9uZW50IHRyZWUsIGFuY2VzdG9ycyBkbyBub3QgbmVlZCB0byBiZSBtYXJrZWQgZGlydHlcbiAgaWYgKG5vZGUuZGF0YSAmJiAhKG5vZGUuZGF0YVtGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIG5vZGUuZGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHNvIGl0cyBob3N0IHZpZXcgYW5kIGl0cyBhbmNlc3RvciB2aWV3cyB3aWxsIGJlIG1hcmtlZCBkaXJ0eVxuICogd2hlbmV2ZXIgdGhlIGV2ZW50IGZpcmVzLiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBPblB1c2ggY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKFxuICAgIHZpZXc6IExWaWV3RGF0YSwgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IChlOiBFdmVudCkgPT4gYW55IHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGU6IGFueSkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSk7XG4gIH07XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgc28gaXRzIGhvc3QgdmlldyBhbmQgaXRzIGFuY2VzdG9yIHZpZXdzIHdpbGwgYmUgbWFya2VkIGRpcnR5XG4gKiB3aGVuZXZlciB0aGUgZXZlbnQgZmlyZXMuIEFsc28gd3JhcHMgd2l0aCBwcmV2ZW50RGVmYXVsdCBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQoXG4gICAgdmlldzogTFZpZXdEYXRhLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrVmlld0RpcnR5KGU6IEV2ZW50KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICBpZiAobGlzdGVuZXJGbihlKSA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3RGF0YSA9IHZpZXc7XG5cbiAgd2hpbGUgKGN1cnJlbnRWaWV3W1BBUkVOVF0gIT0gbnVsbCkge1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50Vmlld1tDT05URVhUXSwgJ3Jvb3RDb250ZXh0Jyk7XG4gIHNjaGVkdWxlVGljayhjdXJyZW50Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgaWYgKHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICByZXMgIShudWxsKTtcbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUocm9vdENvbXBvbmVudCk7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0Tm9kZS5kYXRhLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXcnKTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3ROb2RlLCBnZXRSb290Vmlldyhyb290Q29tcG9uZW50KSwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3RGF0YWAgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld0RhdGFgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnQ6IGFueSk6IExWaWV3RGF0YSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBsZXQgbFZpZXdEYXRhID0gbEVsZW1lbnROb2RlLnZpZXc7XG4gIHdoaWxlIChsVmlld0RhdGFbUEFSRU5UXSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGhvc3ROb2RlLmRhdGEsICdDb21wb25lbnQgaG9zdCBub2RlIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhbiBMVmlld0RhdGEgaW5zdGFuY2UuJyk7XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSwgaG9zdE5vZGUsIGNvbXBvbmVudCk7XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld0RhdGFbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGEpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICBob3N0VmlldzogTFZpZXdEYXRhLCBob3N0Tm9kZTogTEVsZW1lbnROb2RlLCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdE5vZGUpO1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3Qgdmlld1F1ZXJ5ID0gaG9zdFRWaWV3LnZpZXdRdWVyeTtcblxuICB0cnkge1xuICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICBjcmVhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBob3N0Vmlld1tGTEFHU10sIGNvbXBvbmVudCk7XG4gICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIHVwZGF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmIChmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5DcmVhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlVmlld1F1ZXJ5PFQ+KHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIG1hcmtWaWV3RGlydHkobEVsZW1lbnROb2RlLnZpZXcpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGludGVyZmFjZSBOT19DSEFOR0Uge1xuICAvLyBUaGlzIGlzIGEgYnJhbmQgdGhhdCBlbnN1cmVzIHRoYXQgdGhpcyB0eXBlIGNhbiBuZXZlciBtYXRjaCBhbnl0aGluZyBlbHNlXG4gIGJyYW5kOiAnTk9fQ0hBTkdFJztcbn1cblxuLyoqIEEgc3BlY2lhbCB2YWx1ZSB3aGljaCBkZXNpZ25hdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuICovXG5leHBvcnQgY29uc3QgTk9fQ0hBTkdFID0ge30gYXMgTk9fQ0hBTkdFO1xuXG4vKipcbiAqICBJbml0aWFsaXplcyB0aGUgYmluZGluZyBzdGFydCBpbmRleC4gV2lsbCBnZXQgaW5saW5lZC5cbiAqXG4gKiAgVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcgcmVsYXRlZCBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqICAoaWUgYGJpbmQoKWAsIGBpbnRlcnBvbGF0aW9uWCgpYCwgYHB1cmVGdW5jdGlvblgoKWApXG4gKi9cbmZ1bmN0aW9uIGluaXRCaW5kaW5ncygpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSxcbiAgICAgICAgICAgICAgICAgICAnQmluZGluZyBpbmRleCBzaG91bGQgbm90IHlldCBiZSBzZXQgJyArIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKTtcbiAgaWYgKHRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID09PSAtMSkge1xuICAgIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID0gdmlld0RhdGEubGVuZ3RoO1xuICB9XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogUmVzZXJ2ZXMgc2xvdHMgZm9yIHB1cmUgZnVuY3Rpb25zIChgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zKVxuICpcbiAqIEJpbmRpbmdzIGZvciBwdXJlIGZ1bmN0aW9ucyBhcmUgc3RvcmVkIGFmdGVyIHRoZSBMTm9kZXMgaW4gdGhlIGRhdGEgYXJyYXkgYnV0IGJlZm9yZSB0aGUgYmluZGluZy5cbiAqXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHwgIExOb2RlcyAuLi4gfCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIHwgcmVndWxhciBiaW5kaW5ncyAvIGludGVycG9sYXRpb25zIHxcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LlxuICogU3VidHJhY3RpbmcgdGhlIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3NcbiAqIGFyZSBzdG9yZWQuXG4gKlxuICogTk9URTogcmVzZXJ2ZVNsb3RzIGluc3RydWN0aW9ucyBhcmUgb25seSBldmVyIGFsbG93ZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSBjcmVhdGlvbiBibG9ja1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXJ2ZVNsb3RzKG51bVNsb3RzOiBudW1iZXIpIHtcbiAgLy8gSW5pdCB0aGUgc2xvdHMgd2l0aCBhIHVuaXF1ZSBgTk9fQ0hBTkdFYCB2YWx1ZSBzbyB0aGF0IHRoZSBmaXJzdCBjaGFuZ2UgaXMgYWx3YXlzIGRldGVjdGVkXG4gIC8vIHdoZXRoZXIgaXQgaGFwcGVucyBvciBub3QgZHVyaW5nIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MgLSBwdXJlIGZ1bmN0aW9ucyBjaGVja3NcbiAgLy8gbWlnaHQgYmUgc2tpcHBlZCB3aGVuIHNob3J0LWNpcmN1aXRlZC5cbiAgdmlld0RhdGEubGVuZ3RoICs9IG51bVNsb3RzO1xuICB2aWV3RGF0YS5maWxsKE5PX0NIQU5HRSwgLW51bVNsb3RzKTtcbiAgLy8gV2UgbmVlZCB0byBpbml0aWFsaXplIHRoZSBiaW5kaW5nIGluIGNhc2UgYSBgcHVyZUZ1bmN0aW9uWGAga2luZCBvZiBiaW5kaW5nIGluc3RydWN0aW9uIGlzXG4gIC8vIGNhbGxlZCBmaXJzdCBpbiB0aGUgdXBkYXRlIHNlY3Rpb24uXG4gIGluaXRCaW5kaW5ncygpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgdGhlIGJpbmRpbmcgaW5kZXggYmVmb3JlIGV4ZWN1dGluZyBhbnkgYHB1cmVGdW5jdGlvblhgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBUaGUgaW5kZXggbXVzdCBiZSByZXN0b3JlZCBhZnRlciB0aGUgcHVyZSBmdW5jdGlvbiBpcyBleGVjdXRlZFxuICpcbiAqIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3Qob2Zmc2V0OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBjdXJyZW50U2xvdCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gb2Zmc2V0O1xuICByZXR1cm4gY3VycmVudFNsb3Q7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgdGhlIGJpbmRpbmcgaW5kZXggdG8gdGhlIGdpdmVuIHZhbHVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdHlwaWNhbGx5IHVzZWQgdG8gcmVzdG9yZSB0aGUgaW5kZXggYWZ0ZXIgYSBgcHVyZUZ1bmN0aW9uWGAgaGFzXG4gKiBiZWVuIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gaW5kZXg7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcblxuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAvLyBDaGVjayBpZiBiaW5kaW5ncyAob2RkIGluZGV4ZXMpIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjApO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAyIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24yKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjAsIHYxKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICtcbiAgICAgICAgICBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NCkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCBjb250ZXh0Vmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdLFxuICAgICAgICAgICAgICAgICAgICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShxdWVyeUxpc3RJZHgsIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gISk7XG5cbiAgcmV0dXJuIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50KGluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gbG9hZEVsZW1lbnRJbnRlcm5hbChpbmRleCwgdmlld0RhdGEpO1xufVxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlIGFuZCBpbmNyZW1lbnRzIHRoZSBiaW5kaW5nIGluZGV4LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVCaW5kaW5nKCk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgdmlld0RhdGFbdmlld0RhdGFbQklORElOR19JTkRFWF1dLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBpZiAodmlld0RhdGFbQklORElOR19JTkRFWF0gPT09IC0xKSBpbml0QmluZGluZ3MoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF07XG5cbiAgaWYgKGJpbmRpbmdJbmRleCA+PSB2aWV3RGF0YS5sZW5ndGgpIHtcbiAgICB2aWV3RGF0YVt2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrXSA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKGlzRGlmZmVyZW50KHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlLCBjaGVja05vQ2hhbmdlc01vZGUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShjcmVhdGlvbk1vZGUsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RhdGFbQklORElOR19JTkRFWF0rKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHRoZSBsYXRlc3QgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZhbHVlOiBhbnkpOiBhbnkge1xuICBiaW5kaW5nVXBkYXRlZCh2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoZXhwMikgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiB0Vmlldztcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRlbnRRdWVyeTxRPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxRPik6IHZvaWQge1xuICBjb25zdCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoID1cbiAgICAgICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdIHx8ICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKHF1ZXJ5TGlzdCk7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxO1xuICAgIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gICAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlldy5jb250ZW50UXVlcmllc1t0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggLSAyXSA6IC0xO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goY3VycmVudERpcmVjdGl2ZUluZGV4LCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydERlZmluZWQoZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleCwgYXJyIHx8IHZpZXdEYXRhKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBhcnIubGVuZ3RoLCBpbmRleCwgYGluZGV4ICR7aW5kZXh9IGV4cGVjdGVkIHRvIGJlIGF0IHRoZSBlbmQgb2YgYXJyIChsZW5ndGggJHthcnIubGVuZ3RofSlgKTtcbn1cblxuLyoqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIHJlc2VydmVkIHNsb3RzIHNob3VsZCBiZSBzZXQgYE5PX0NIQU5HRWAuXG4gKlxuICogSWYgbm90LCB0aGV5IG1pZ2h0IG5vdCBoYXZlIGJlZW4gYWN0dWFsbHkgcmVzZXJ2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0OiBudW1iZXIsIG51bVNsb3RzOiBudW1iZXIpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gc2xvdE9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzOyBpKyspIHtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHZpZXdEYXRhW3N0YXJ0SW5kZXggKyBpXSwgTk9fQ0hBTkdFLFxuICAgICAgICAgICdUaGUgcmVzZXJ2ZWQgc2xvdHMgc2hvdWxkIGJlIHNldCB0byBgTk9fQ0hBTkdFYCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzJyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZTxUPihjb21wb25lbnQ6IFQpOiBMRWxlbWVudE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdleHBlY3RpbmcgY29tcG9uZW50IGdvdCBudWxsJyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IChjb21wb25lbnQgYXMgYW55KVtOR19IT1NUX1NZTUJPTF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdvYmplY3QgaXMgbm90IGEgY29tcG9uZW50Jyk7XG4gIHJldHVybiBsRWxlbWVudE5vZGU7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5leHBvcnQgY29uc3QgUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTO1xuIl19