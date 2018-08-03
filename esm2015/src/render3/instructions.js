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
/** @type {?} */
let rendererFactory;
/** @type {?} */
let currentElementNode = null;
/**
 * @return {?}
 */
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
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
    return /** @type {?} */ ((/** @type {?} */ (viewData)));
}
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
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param {?} viewToRestore The LViewData instance to restore.
 * @return {?}
 */
export function restoreView(viewToRestore) {
    contextViewData = /** @type {?} */ ((/** @type {?} */ (viewToRestore)));
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
export function getCurrentQueries(QueryType) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentQueries ||
        (currentQueries =
            (previousOrParentNode.queries && previousOrParentNode.queries.clone() ||
                new QueryType()));
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
 * @param {?} queries
 * @return {?}
 */
export function createLNodeObject(type, currentView, parent, native, state, queries) {
    return {
        native: /** @type {?} */ (native),
        view: currentView,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        queries: queries,
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
    let queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    /** @type {?} */
    const isState = state != null;
    /** @type {?} */
    const node = createLNodeObject(type, viewData, parent, native, isState ? /** @type {?} */ (state) : null, queries);
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
            currentQueries = null;
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
 * @param {?} template Template function with the instructions.
 * @param {?} context to pass into the template.
 * @param {?} providedRendererFactory renderer factory to use
 * @param {?} host The host element node to use
 * @param {?=} directives Directive defs that should be used for matching
 * @param {?=} pipes Pipe defs that should be used for matching
 * @param {?=} sanitizer
 * @return {?}
 */
export function renderTemplate(hostNode, template, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetApplicationState();
        rendererFactory = providedRendererFactory;
        /** @type {?} */
        const tView = getOrCreateTView(template, directives || null, pipes || null, null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLViewData(providedRendererFactory.createRenderer(null, null), tView, {}, 2 /* CheckAlways */, sanitizer));
    }
    /** @type {?} */
    const hostView = /** @type {?} */ ((host.data));
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, template);
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
 * @param {?=} template
 * @return {?}
 */
export function renderComponentOrTemplate(node, hostView, componentOrContext, template) {
    /** @type {?} */
    const oldView = enterView(hostView, node);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (template) {
            namespaceHTML();
            template(getRenderFlags(hostView), /** @type {?} */ ((componentOrContext)));
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
        previousOrParentNode = /** @type {?} */ (getParentLNode(previousOrParentNode));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 4 /* ElementContainer */);
    /** @type {?} */
    const queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
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
    createDirectivesAndLocals(localRefs);
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
 * Creates directive instances and populates local refs.
 *
 * @param {?=} localRefs Local refs of the current node
 * @return {?}
 */
function createDirectivesAndLocals(localRefs) {
    /** @type {?} */
    const node = previousOrParentNode;
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(node.tNode, tView, localRefs || null);
    }
    else {
        instantiateDirectivesDirectly();
    }
    saveResolvedLocalsInData();
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
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * This function instantiates the given directives.
 * @return {?}
 */
function instantiateDirectivesDirectly() {
    /** @type {?} */
    const tNode = previousOrParentNode.tNode;
    /** @type {?} */
    const count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (count > 0) {
        /** @type {?} */
        const start = tNode.flags >> 14 /* DirectiveStartingIndexShift */;
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
 * @return {?}
 */
function saveResolvedLocalsInData() {
    /** @type {?} */
    const localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (let i = 0; i < localNames.length; i += 2) {
            /** @type {?} */
            const index = /** @type {?} */ (localNames[i + 1]);
            /** @type {?} */
            const value = index === -1 ? previousOrParentNode.native : /** @type {?} */ ((directives))[index];
            viewData.push(value);
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param {?} template The template from which to get static data
 * @param {?} directives Directive defs that should be saved on TView
 * @param {?} pipes Pipe defs that should be saved on TView
 * @param {?} viewQuery
 * @return {?} TView
 */
function getOrCreateTView(template, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return template.ngPrivateData ||
        (template.ngPrivateData = /** @type {?} */ (createTView(-1, template, directives, pipes, viewQuery)));
}
/**
 * Creates a TView instance
 *
 * @param {?} viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param {?} template
 * @param {?} directives Registry of directives for this view
 * @param {?} pipes Registry of pipes for this view
 * @param {?} viewQuery
 * @return {?}
 */
export function createTView(viewIndex, template, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    return {
        id: viewIndex,
        template: template,
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
    /** @type {?} */
    const queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
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
        const start = tNodeFlags >> 14 /* DirectiveStartingIndexShift */;
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
    const componentView = addToViewTree(viewData, /** @type {?} */ (previousOrParentNode.tNode.index), createLViewData(rendererFactory.createRenderer(/** @type {?} */ (previousOrParentNode.native), def.rendererType), tView, instance, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
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
                index << 14 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
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
 * Creates an LContainerNode.
 *
 * Only `LViewNodes` can go into `LContainerNodes`.
 *
 * @param {?} index The index of the container in the data array
 * @param {?=} template Optional inline template
 * @param {?=} tagName The name of the container element, if applicable
 * @param {?=} attrs The attrs attached to the container, if applicable
 * @param {?=} localRefs A set of local reference bindings on the element.
 * @return {?}
 */
export function container(index, template, tagName, attrs, localRefs) {
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
    const node = createLNode(index, 0 /* Container */, comment, tagName || null, attrs || null, lContainer);
    appendChild(getParentLNode(node), comment, viewData);
    if (firstTemplatePass) {
        node.tNode.tViews = template ?
            createTView(-1, template, tView.directiveRegistry, tView.pipeRegistry, null) :
            [];
    }
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, node.data);
    /** @type {?} */
    const queries = node.queries;
    if (queries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = queries.container();
    }
    createDirectivesAndLocals(localRefs);
    isParent = false;
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    queries && queries.addNode(node); // check if a given container node matches
    queueLifecycleHooks(node.tNode.flags, tView);
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
    const template = /** @type {?} */ ((hostTView.template));
    /** @type {?} */
    const viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, hostView[FLAGS], component);
        template(getRenderFlags(hostView), component);
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
    else if (isDifferent(viewData[bindingIndex], value)) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQU12QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RHLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RyxPQUFPLEVBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM1RixPQUFPLEVBQUMsWUFBWSxFQUFjLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUl0RixPQUFPLEVBQWtCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFakYsT0FBTyxFQUFtRyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzdKLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFtQixlQUFlLEVBQUUsT0FBTyxFQUFzQixnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUF5QixJQUFJLEVBQW1CLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFlLFNBQVMsRUFBRSxJQUFJLEVBQVMsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDN1QsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsV0FBVyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxpQkFBaUIsRUFBaUIsYUFBYSxFQUFnQixjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2pOLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzFGLE9BQU8sRUFBaUIsbUJBQW1CLEVBQUUsNEJBQTRCLEVBQUUsYUFBYSxJQUFJLG1CQUFtQixFQUFFLGVBQWUsSUFBSSxzQkFBc0IsRUFBRSxlQUFlLElBQUksc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDMU8sT0FBTyxFQUFDLHlCQUF5QixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7QUFVNUcsYUFBYSxjQUFjLEdBQUcsaUJBQWlCLENBQUM7Ozs7O0FBTWhELE1BQU0sY0FBYyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7QUFnQjdDLE1BQU0sdUJBQXVCLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7Ozs7Ozs7O0FBU3ZDLE1BQU0sYUFBYSxHQUFHLElBQUksS0FBSyxDQUFDLGFBQWEsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7OztBQVExRCxhQUFhLFFBQVEsR0FBRyxjQUFjLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQW1CdkMsSUFBSSxRQUFRLENBQVk7O0FBQ3hCLElBQUksZUFBZSxDQUFtQjs7QUFDdEMsSUFBSSxrQkFBa0IsR0FBc0IsSUFBSSxDQUFDOzs7O0FBRWpELE1BQU07O0lBRUosT0FBTyxRQUFRLENBQUM7Q0FDakI7Ozs7QUFFRCxNQUFNO0lBQ0osT0FBTyxRQUFRLElBQUksUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0NBQ3hDOzs7Ozs7Ozs7QUFTRCxNQUFNO0lBQ0oseUJBQU8sbUJBQUMsUUFBZSxFQUFvQixFQUFDO0NBQzdDOzs7Ozs7O0FBT0QsTUFBTTs7SUFFSixPQUFPLFFBQVEsQ0FBQztDQUNqQjs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLHNCQUFzQixhQUE4QjtJQUN4RCxlQUFlLHFCQUFHLG1CQUFDLGFBQW9CLEVBQWMsQ0FBQSxDQUFDO0NBQ3ZEOzs7O0FBR0QsSUFBSSxvQkFBb0IsQ0FBUTs7OztBQUVoQyxNQUFNOztJQUVKLE9BQU8sb0JBQW9CLENBQUM7Q0FDN0I7Ozs7OztBQU9ELElBQUksUUFBUSxDQUFVOztBQUV0QixJQUFJLEtBQUssQ0FBUTs7QUFFakIsSUFBSSxjQUFjLENBQWdCOzs7Ozs7Ozs7O0FBU2xDLE1BQU0sNEJBQTRCLFNBQTZCOztJQUU3RCxPQUFPLGNBQWM7UUFDakIsQ0FBQyxjQUFjO1lBQ1YsQ0FBQyxvQkFBb0IsQ0FBQyxPQUFPLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDcEUsSUFBSSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDN0I7Ozs7QUFLRCxJQUFJLFlBQVksQ0FBVTs7OztBQUUxQixNQUFNOztJQUVKLE9BQU8sWUFBWSxDQUFDO0NBQ3JCOzs7Ozs7O0FBUUQsSUFBSSxRQUFRLENBQVk7Ozs7Ozs7QUFReEIsSUFBSSxlQUFlLHNCQUFjLElBQUksR0FBRzs7Ozs7OztBQVF4QyxJQUFJLFVBQVUsQ0FBYTs7Ozs7QUFFM0Isb0JBQW9CLElBQWU7O0lBRWpDLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0NBQzlDOzs7OztBQUVELHlCQUF5QixJQUFlO0lBQ3RDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUM7Q0FDMUQ7Ozs7OztBQU1ELElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDOzs7O0FBRy9CLElBQUksaUJBQWlCLEdBQUcsSUFBSSxDQUFDOzs7SUFHM0IsUUFBSztJQUNMLFNBQU07Ozs7Ozs7Ozs7Ozs7O0FBZVIsTUFBTSxvQkFBb0IsT0FBa0IsRUFBRSxJQUFxQzs7SUFDakYsTUFBTSxPQUFPLEdBQWMsUUFBUSxDQUFDO0lBQ3BDLFVBQVUsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzVDLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWxDLFlBQVksR0FBRyxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUEwQixDQUFDLHlCQUE0QixDQUFDO0lBQ2pHLGlCQUFpQixHQUFHLE9BQU8sSUFBSSxLQUFLLENBQUMsaUJBQWlCLENBQUM7SUFFdkQsUUFBUSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7SUFFeEMsSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFO1FBQ2hCLG9CQUFvQixHQUFHLElBQUksQ0FBQztRQUM1QixRQUFRLEdBQUcsSUFBSSxDQUFDO0tBQ2pCO0lBRUQsUUFBUSxHQUFHLGVBQWUsR0FBRyxPQUFPLENBQUM7SUFDckMsY0FBYyxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFN0MsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7QUFVRCxNQUFNLG9CQUFvQixPQUFrQixFQUFFLFlBQXNCO0lBQ2xFLElBQUksQ0FBQyxZQUFZLEVBQUU7UUFDakIsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQ3ZCLFlBQVksb0JBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNqRjs7UUFFRCxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLG9DQUEwQyxDQUFDLENBQUM7S0FDbEU7SUFDRCxRQUFRLENBQUMsS0FBSyxDQUFDLG9CQUFzQixDQUFDO0lBQ3RDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM3QixTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzFCOzs7Ozs7OztBQVFEOztJQUVFLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFFcEQsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1FBQ3ZCLGdCQUFnQixDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDakQ7SUFDRCwyQkFBMkIsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7SUFHdEMscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFN0IsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1FBQ3ZCLFlBQVksb0JBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3ZGO0lBRUQsZUFBZSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztJQUNwQyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7Q0FDMUM7Ozs7OztBQUlELE1BQU0sMEJBQTBCLFFBQXlCO0lBQ3ZELElBQUksUUFBUSxJQUFJLElBQUksRUFBRTs7UUFDcEIsTUFBTSxJQUFJLHNCQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUc7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFDM0MsTUFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDOztZQUM3QixNQUFNLEdBQUcscUJBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBOEIsRUFBQztZQUN4RCxHQUFHLENBQUMsWUFBWSxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNqRTtLQUNGO0NBQ0Y7Ozs7OztBQUdELCtCQUErQixLQUFZO0lBQ3pDLElBQUksS0FBSyxDQUFDLGNBQWMsSUFBSSxJQUFJLEVBQUU7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7O1lBQ3ZELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7O1lBQ2hELE1BQU0sWUFBWSxzQkFBRyxLQUFLLENBQUMsVUFBVSxHQUFHLGVBQWUsRUFBRTtjQUV6RCxZQUFZLENBQUMscUJBQXFCLEdBQUcsZUFBZSxFQUFFLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUNsRjtLQUNGO0NBQ0Y7Ozs7OztBQUdELGdDQUFnQyxVQUEyQjtJQUN6RCxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7UUFDdEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDMUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakM7S0FDRjtDQUNGOzs7O0FBRUQsTUFBTTtJQUNKLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO1FBQ2hELFlBQVksb0JBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxZQUFZLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3ZGO0NBQ0Y7Ozs7Ozs7Ozs7QUFFRCxNQUFNLDBCQUNGLFFBQW1CLEVBQUUsS0FBWSxFQUFFLE9BQWlCLEVBQUUsS0FBaUIsRUFDdkUsU0FBNEI7SUFDOUIsT0FBTztRQUNMLEtBQUs7UUFDTCxRQUFRO1FBQ1IsSUFBSTtRQUNKLElBQUk7O1FBQ0osS0FBSyx1QkFBMEIsbUJBQXNCLG1CQUFxQjsyQkFDMUUsSUFBSTs7UUFDSixDQUFDLENBQUM7UUFDRixJQUFJO1FBQ0osSUFBSTtRQUNKLE9BQU87O1FBQ1AsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDcEMsUUFBUTs7UUFDUixTQUFTLElBQUksSUFBSTtRQUNqQixJQUFJOztRQUNKLENBQUMsQ0FBQztRQUNGLElBQUk7UUFDSixJQUFJO0tBQ0wsQ0FBQztDQUNIOzs7Ozs7Ozs7Ozs7O0FBT0QsTUFBTSw0QkFDRixJQUFlLEVBQUUsV0FBc0IsRUFBRSxNQUFvQixFQUM3RCxNQUEwQyxFQUFFLEtBQVUsRUFDdEQsT0FBd0I7SUFDMUIsT0FBTztRQUNMLE1BQU0sb0JBQUUsTUFBYSxDQUFBO1FBQ3JCLElBQUksRUFBRSxXQUFXO1FBQ2pCLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDakQsSUFBSSxFQUFFLEtBQUs7UUFDWCxPQUFPLEVBQUUsT0FBTztRQUNoQixLQUFLLHFCQUFFLElBQUksRUFBRTtRQUNiLHFCQUFxQixFQUFFLElBQUk7S0FDNUIsQ0FBQztDQUNIOzs7Ozs7Ozs7O0FBNkJELE1BQU0sc0JBQ0YsS0FBYSxFQUFFLElBQWUsRUFBRSxNQUEwQyxFQUFFLElBQW1CLEVBQy9GLEtBQXlCLEVBQUUsS0FBcUM7O0lBRWxFLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQztRQUN0QixvQkFBb0Isd0JBQUksY0FBYyxDQUFDLG9CQUFvQixDQUFDLEdBQVUsQ0FBQzs7SUFHakcsTUFBTSxPQUFPLEdBQ1QsTUFBTSxJQUFJLE1BQU0sQ0FBQyxJQUFJLEtBQUssUUFBUSxDQUFDLENBQUMsbUJBQUMsTUFBTSxDQUFDLEtBQXNDLEVBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQzs7SUFDOUYsSUFBSSxPQUFPLEdBQ1AsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLElBQUksb0JBQW9CLENBQUMsT0FBTyxDQUFDO1FBQ2xGLE1BQU0sSUFBSSxNQUFNLENBQUMsT0FBTyxJQUFJLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUM7O0lBQ3ZELE1BQU0sT0FBTyxHQUFHLEtBQUssSUFBSSxJQUFJLENBQUM7O0lBQzlCLE1BQU0sSUFBSSxHQUNOLGlCQUFpQixDQUFDLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxtQkFBQyxLQUFZLEVBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztJQUU5RixJQUFJLEtBQUssS0FBSyxDQUFDLENBQUMsSUFBSSxJQUFJLGlCQUFtQixFQUFFOzs7UUFHM0MsSUFBSSxDQUFDLEtBQUssR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsbUJBQUMsS0FBa0IsRUFBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQzFELFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ3pEO1NBQU07O1FBQ0wsTUFBTSxhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQzs7UUFHNUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQzs7UUFDM0MsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztRQUV6QixRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxDQUFDOztRQUcvQixJQUFJLGFBQWEsSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFOztZQUNqQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO2dCQUM5QixXQUFXLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNqRSxJQUFJLENBQUMsUUFBUSxJQUFJLG9CQUFvQixFQUFFOztnQkFDckMsTUFBTSxhQUFhLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDO2dCQUNqRCxhQUFhLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFDM0IsSUFBSSxhQUFhLENBQUMsb0JBQW9CO29CQUFFLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2FBQ3pGO1NBQ0Y7UUFDRCxJQUFJLENBQUMsS0FBSyxxQkFBRyxLQUFLLENBQUMsYUFBYSxDQUFVLENBQUEsQ0FBQzs7UUFHM0MsSUFBSSxRQUFRLEVBQUU7WUFDWixjQUFjLEdBQUcsSUFBSSxDQUFDO1lBQ3RCLElBQUksb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxJQUFJLElBQUksb0JBQW9CLENBQUMsSUFBSSxLQUFLLFFBQVE7Z0JBQ2xGLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixFQUFFOztnQkFFdEQsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQy9DO1NBQ0Y7S0FDRjs7SUFHRCxJQUFJLENBQUMsSUFBSSx3QkFBMEIsQ0FBQywwQkFBNEIsSUFBSSxPQUFPLEVBQUU7O1FBQzNFLE1BQU0sU0FBUyxxQkFBRyxLQUFrQixFQUFDO1FBQ3JDLFNBQVMsSUFBSSxnQkFBZ0IsQ0FDWixTQUFTLENBQUMsU0FBUyxDQUFDLEVBQUUsdURBQXVELENBQUMsQ0FBQztRQUNoRyxTQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsSUFBSSxDQUFDO1FBQzVCLElBQUksaUJBQWlCO1lBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0tBQzNEO0lBRUQsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO0lBQzVCLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDaEIsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7QUFVRCxNQUFNO0lBQ0osUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNqQixvQkFBb0Isc0JBQUcsSUFBSSxFQUFFLENBQUM7Q0FDL0I7Ozs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSx5QkFDRixRQUFrQixFQUFFLFFBQThCLEVBQUUsT0FBVSxFQUM5RCx1QkFBeUMsRUFBRSxJQUF5QixFQUNwRSxVQUE2QyxFQUFFLEtBQW1DLEVBQ2xGLFNBQTRCO0lBQzlCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtRQUNoQixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQzs7UUFDMUMsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQVUsSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUNsRixJQUFJLEdBQUcsV0FBVyxDQUNkLENBQUMsQ0FBQyxtQkFBcUIsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQzNDLGVBQWUsQ0FDWCx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxFQUFFLHVCQUM3RCxTQUFTLENBQUMsQ0FBQyxDQUFDO0tBQ3JCOztJQUNELE1BQU0sUUFBUSxzQkFBRyxJQUFJLENBQUMsSUFBSSxHQUFHO0lBQzdCLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLHNEQUFzRCxDQUFDLENBQUM7SUFDN0YseUJBQXlCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7OztBQU9ELE1BQU0saUNBQ0YsS0FBWSxFQUFFLE9BQVUsRUFBRSxlQUEwQixFQUFFLFFBQW1CLEVBQ3pFLE9BQXlCOztJQUMzQixNQUFNLFNBQVMsR0FBRyxRQUFRLENBQUM7O0lBQzNCLE1BQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7SUFDbkQsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNoQixvQkFBb0Isc0JBQUcsSUFBSSxFQUFFLENBQUM7O0lBRTlCLE1BQU0sS0FBSyxHQUNQLGVBQWUsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLE9BQU8sdUJBQTBCLG1CQUFtQixFQUFFLENBQUMsQ0FBQztJQUM3RixLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxlQUFlLENBQUM7SUFFMUMsSUFBSSxPQUFPLEVBQUU7UUFDWCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3ZDOztJQUNELE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxDQUFDLENBQUMsZ0JBQWtCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRTFFLFFBQVEsR0FBRyxTQUFTLENBQUM7SUFDckIsb0JBQW9CLEdBQUcscUJBQXFCLENBQUM7SUFDN0MsT0FBTyxRQUFRLENBQUM7Q0FDakI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxpQ0FDRixRQUFrQyxFQUFFLEtBQVksRUFBRSxPQUFVLEVBQUUsRUFBZTs7SUFFL0UsTUFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDOztJQUMzQixNQUFNLHFCQUFxQixHQUFHLG9CQUFvQixDQUFDOztJQUNuRCxJQUFJLE9BQU8sQ0FBWTtJQUN2Qix1QkFBSSxRQUFRLENBQUMsSUFBSSxHQUFHLE1BQU0sS0FBSyxJQUFJLHVCQUFJLFFBQVEsQ0FBQyxJQUFJLEdBQUcsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLFFBQVEsRUFBRTs7UUFFbEYsZUFBZSxxQkFBQyxRQUFRLENBQUMsSUFBSSxHQUFHLE9BQU8sR0FBaUIsQ0FBQztLQUMxRDtTQUFNO1FBQ0wsSUFBSTtZQUNGLFFBQVEsR0FBRyxJQUFJLENBQUM7WUFDaEIsb0JBQW9CLHNCQUFHLElBQUksRUFBRSxDQUFDO1lBRTlCLE9BQU8sR0FBRyxTQUFTLG9CQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksUUFBUSxDQUFDLENBQUM7WUFDL0MsYUFBYSxFQUFFLENBQUM7Y0FDaEIsS0FBSyxDQUFDLFFBQVEsR0FBRyxFQUFFLEVBQUUsT0FBTztZQUM1QixJQUFJLEVBQUUsaUJBQXFCLEVBQUU7Z0JBQzNCLHNCQUFzQixFQUFFLENBQUM7YUFDMUI7aUJBQU07bUNBQ0wsUUFBUSxDQUFDLElBQUksR0FBRyxLQUFLLEVBQUUsaUJBQWlCLEdBQUcsaUJBQWlCLEdBQUcsS0FBSzthQUNyRTtTQUNGO2dCQUFTOztZQUdSLE1BQU0sY0FBYyxHQUFHLENBQUMsRUFBRSxpQkFBcUIsQ0FBQyxtQkFBdUIsQ0FBQztZQUN4RSxTQUFTLG9CQUFDLE9BQU8sSUFBSSxjQUFjLENBQUMsQ0FBQztZQUNyQyxRQUFRLEdBQUcsU0FBUyxDQUFDO1lBQ3JCLG9CQUFvQixHQUFHLHFCQUFxQixDQUFDO1NBQzlDO0tBQ0Y7SUFDRCxPQUFPLFFBQVEsQ0FBQztDQUNqQjs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxzQkFBK0IsUUFBZ0IsQ0FBQztJQUNwRCxlQUFlLEdBQUcsV0FBVyxDQUFDLEtBQUsscUJBQUUsZUFBZSxHQUFHLENBQUM7SUFDeEQseUJBQU8sZUFBZSxDQUFDLE9BQU8sQ0FBTSxFQUFDO0NBQ3RDOzs7Ozs7Ozs7QUFFRCxNQUFNLG9DQUNGLElBQWtCLEVBQUUsUUFBbUIsRUFBRSxrQkFBcUIsRUFDOUQsUUFBK0I7O0lBQ2pDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDMUMsSUFBSTtRQUNGLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtZQUN6QixlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDekI7UUFDRCxJQUFJLFFBQVEsRUFBRTtZQUNaLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLHFCQUFFLGtCQUFrQixHQUFHLENBQUM7WUFDekQsc0JBQXNCLEVBQUUsQ0FBQztTQUMxQjthQUFNO1lBQ0wsMEJBQTBCLEVBQUUsQ0FBQzs7O1lBSTdCLGVBQWUsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3pDLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ2pDO0tBQ0Y7WUFBUztRQUNSLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRTtZQUN2QixlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdkI7UUFDRCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEI7Q0FDRjs7Ozs7Ozs7Ozs7O0FBV0Qsd0JBQXdCLElBQWU7SUFDckMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLHVCQUEwQixDQUFDLENBQUMsQ0FBQywrQkFBdUMsQ0FBQyxDQUFDO3NCQUN2QixDQUFDO0NBQ25FOztBQU1ELElBQUksaUJBQWlCLEdBQWdCLElBQUksQ0FBQzs7OztBQUUxQyxNQUFNO0lBQ0osaUJBQWlCLEdBQUcsNkJBQTZCLENBQUM7Q0FDbkQ7Ozs7QUFFRCxNQUFNO0lBQ0osaUJBQWlCLEdBQUcsZ0NBQWdDLENBQUM7Q0FDdEQ7Ozs7QUFFRCxNQUFNO0lBQ0osaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0NBQzFCOzs7Ozs7Ozs7O0FBY0QsTUFBTSxrQkFDRixLQUFhLEVBQUUsSUFBWSxFQUFFLEtBQTBCLEVBQUUsU0FBMkI7SUFDdEYsWUFBWSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVDLFVBQVUsRUFBRSxDQUFDO0NBQ2Q7Ozs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxnQ0FDRixLQUFhLEVBQUUsS0FBMEIsRUFBRSxTQUEyQjtJQUN4RSxTQUFTO1FBQ0wsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO0lBRS9GLFNBQVMsSUFBSSxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQzs7SUFDL0MsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7SUFFdkUsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssR0FBRyxDQUFDLENBQUMsQ0FBQzs7SUFFMUMsTUFBTSxJQUFJLEdBQ04sV0FBVyxDQUFDLEtBQUssNEJBQThCLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUV0RixXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUN0Qzs7Ozs7QUFHRCxNQUFNO0lBQ0osSUFBSSxRQUFRLEVBQUU7UUFDWixRQUFRLEdBQUcsS0FBSyxDQUFDO0tBQ2xCO1NBQU07UUFDTCxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7UUFDL0Isb0JBQW9CLHFCQUFHLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBMEIsQ0FBQSxDQUFDO0tBQ3RGO0lBRUQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxvQkFBb0IsMkJBQTZCLENBQUM7O0lBQzlFLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQztJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ2pELG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDOUQ7Ozs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSx1QkFDRixLQUFhLEVBQUUsSUFBWSxFQUFFLEtBQTBCLEVBQUUsU0FBMkI7SUFDdEYsU0FBUztRQUNMLFdBQVcsQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztJQUUvRixTQUFTLElBQUksU0FBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7O0lBRS9DLE1BQU0sTUFBTSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVuQyxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDOztJQUUxQyxNQUFNLElBQUksR0FDTixXQUFXLENBQUMsS0FBSyxzQ0FBcUIsTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9FLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUUxQixJQUFJLEtBQUssRUFBRTtRQUNULGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDaEM7SUFDRCxXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLE1BQU0sRUFBRSxRQUFRLENBQUMsQ0FBQztJQUNwRCx5QkFBeUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUN0Qzs7Ozs7OztBQVFELE1BQU0sd0JBQXdCLElBQVksRUFBRSxrQkFBOEI7O0lBQ3hFLElBQUksTUFBTSxDQUFXOztJQUNyQixNQUFNLGFBQWEsR0FBRyxrQkFBa0IsSUFBSSxRQUFRLENBQUM7SUFFckQsSUFBSSxvQkFBb0IsQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUN2QyxNQUFNLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztLQUMvRDtTQUFNO1FBQ0wsSUFBSSxpQkFBaUIsS0FBSyxJQUFJLEVBQUU7WUFDOUIsTUFBTSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDNUM7YUFBTTtZQUNMLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2pFO0tBQ0Y7SUFDRCxPQUFPLE1BQU0sQ0FBQztDQUNmOzs7Ozs7O0FBT0QsbUNBQW1DLFNBQTJCOztJQUM1RCxNQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQztJQUVsQyxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLFNBQVMsSUFBSSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMzQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLElBQUksSUFBSSxDQUFDLENBQUM7S0FDdEU7U0FBTTtRQUNMLDZCQUE2QixFQUFFLENBQUM7S0FDakM7SUFDRCx3QkFBd0IsRUFBRSxDQUFDO0NBQzVCOzs7Ozs7Ozs7O0FBT0Qsd0NBQ0ksS0FBWSxFQUFFLEtBQVksRUFBRSxTQUEwQjs7SUFFeEQsTUFBTSxVQUFVLEdBQXFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDOztJQUNqRixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsY0FBYyxHQUFHLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25FLElBQUksT0FBTyxFQUFFO1FBQ1gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFDMUMsTUFBTSxHQUFHLHFCQUFHLE9BQU8sQ0FBQyxDQUFDLENBQThCLEVBQUM7O1lBQ3BELE1BQU0sVUFBVSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7WUFDekIsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEQsbUJBQW1CLG1CQUFDLE9BQU8sQ0FBQyxVQUFVLENBQVcsR0FBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDckU7S0FDRjtJQUNELElBQUksVUFBVTtRQUFFLHVCQUF1QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7Q0FDdkU7Ozs7OztBQUdELDhCQUE4QixLQUFZOztJQUN4QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7O0lBQ3pDLElBQUksT0FBTyxHQUFlLElBQUksQ0FBQztJQUMvQixJQUFJLFFBQVEsRUFBRTtRQUNaLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztZQUN4QyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEIsSUFBSSwwQkFBMEIsQ0FBQyxLQUFLLHFCQUFFLEdBQUcsQ0FBQyxTQUFTLEdBQUcsRUFBRTtnQkFDdEQsSUFBSSxtQkFBQyxHQUFnQyxFQUFDLENBQUMsUUFBUSxFQUFFO29CQUMvQyxJQUFJLEtBQUssQ0FBQyxLQUFLLHlCQUF5Qjt3QkFBRSwyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0UsS0FBSyxDQUFDLEtBQUsseUJBQXlCLENBQUM7aUJBQ3RDO2dCQUNELElBQUksR0FBRyxDQUFDLFFBQVE7b0JBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztnQkFDcEMsQ0FBQyxPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQzdDO1NBQ0Y7S0FDRjtJQUNELHlCQUFPLE9BQTZCLEVBQUM7Q0FDdEM7Ozs7Ozs7O0FBRUQsTUFBTSwyQkFDRixHQUE4QixFQUFFLFVBQWtCLEVBQUUsT0FBMkIsRUFDL0UsS0FBWTtJQUNkLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDOztRQUMvQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsT0FBTyxFQUFFLENBQUM7UUFDL0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUN4RCxPQUFPLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLHNCQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxHQUFHLENBQUMsRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDNUY7U0FBTSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxRQUFRLEVBQUU7O1FBRTNDLDBCQUEwQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN0QztJQUNELE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7O0FBR0Q7SUFDRSxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztLQUN6RTtDQUNGOzs7Ozs7QUFJRCxrQ0FBa0MsUUFBZ0I7OztJQUdoRCxTQUFTO1FBQ0wsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO0lBQzFGLENBQUMsS0FBSyxDQUFDLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLEdBQUcsRUFDM0MsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQztDQUMxRDs7Ozs7Ozs7QUFHRCxNQUFNLHVDQUNGLFFBQTBCLEVBQUUsUUFBYSxFQUFFLElBQWU7SUFDNUQsSUFBSSxRQUFRLElBQUksUUFBUSxDQUFDLGlCQUFpQixJQUFJLElBQUksRUFBRTtRQUNsRCxtQkFBQyxRQUFRLENBQUMsaUJBQWlDLEVBQUMsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDbkY7Q0FDRjs7Ozs7QUFFRCxNQUFNLHNCQUFzQixLQUFZO0lBQ3RDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyx5QkFBeUIsQ0FBQywyQkFBMkIsQ0FBQztDQUMxRTs7Ozs7QUFLRDs7SUFDRSxNQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7O0lBQ3pDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLGdDQUFnQyxDQUFDO0lBRTFELElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTs7UUFDYixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyx3Q0FBMEMsQ0FBQzs7UUFDcEUsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7UUFDMUIsTUFBTSxXQUFXLHNCQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUc7UUFFdkMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs7WUFDaEMsTUFBTSxHQUFHLEdBQThCLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN0RCxlQUFlLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxPQUFPLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUN4QztLQUNGO0NBQ0Y7Ozs7Ozs7O0FBR0QsaUNBQ0ksS0FBWSxFQUFFLFNBQTBCLEVBQUUsVUFBbUM7SUFDL0UsSUFBSSxTQUFTLEVBQUU7O1FBQ2IsTUFBTSxVQUFVLEdBQXdCLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDOzs7O1FBSzlELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7O1lBQzVDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0RixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QztLQUNGO0NBQ0Y7Ozs7Ozs7OztBQU1ELDZCQUNJLEtBQWEsRUFBRSxHQUF5RCxFQUN4RSxVQUEwQztJQUM1QyxJQUFJLFVBQVUsRUFBRTtRQUNkLElBQUksR0FBRyxDQUFDLFFBQVE7WUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNuRCxJQUFJLG1CQUFDLEdBQWdDLEVBQUMsQ0FBQyxRQUFRO1lBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUN6RTtDQUNGOzs7Ozs7QUFNRDs7SUFDRSxNQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3pELElBQUksVUFBVSxFQUFFO1FBQ2QsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7WUFDN0MsTUFBTSxLQUFLLHFCQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLEVBQUM7O1lBQzFDLE1BQU0sS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsb0JBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQy9FLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDdEI7S0FDRjtDQUNGOzs7Ozs7Ozs7OztBQVdELDBCQUNJLFFBQWdDLEVBQUUsVUFBNEMsRUFDOUUsS0FBa0MsRUFBRSxTQUFvQzs7Ozs7OztJQVExRSxPQUFPLFFBQVEsQ0FBQyxhQUFhO1FBQ3pCLENBQUMsUUFBUSxDQUFDLGFBQWEscUJBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBVSxDQUFBLENBQUMsQ0FBQztDQUNqRzs7Ozs7Ozs7Ozs7QUFTRCxNQUFNLHNCQUNGLFNBQWlCLEVBQUUsUUFBc0MsRUFDekQsVUFBNEMsRUFBRSxLQUFrQyxFQUNoRixTQUFvQztJQUN0QyxTQUFTLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQy9CLE9BQU87UUFDTCxFQUFFLEVBQUUsU0FBUztRQUNiLFFBQVEsRUFBRSxRQUFRO1FBQ2xCLFNBQVMsRUFBRSxTQUFTO1FBQ3BCLElBQUkscUJBQUUsSUFBSSxFQUFFO1FBQ1osSUFBSSxFQUFFLGFBQWEsQ0FBQyxLQUFLLEVBQUU7O1FBQzNCLFVBQVUsRUFBRSxDQUFDLENBQUM7O1FBQ2QsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDOztRQUNyQixVQUFVLEVBQUUsSUFBSTtRQUNoQixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsVUFBVSxFQUFFLElBQUk7UUFDaEIsWUFBWSxFQUFFLElBQUk7UUFDbEIsaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixTQUFTLEVBQUUsSUFBSTtRQUNmLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLGdCQUFnQixFQUFFLElBQUk7UUFDdEIsT0FBTyxFQUFFLElBQUk7UUFDYixZQUFZLEVBQUUsSUFBSTtRQUNsQixjQUFjLEVBQUUsSUFBSTtRQUNwQixVQUFVLEVBQUUsSUFBSTtRQUNoQixpQkFBaUIsRUFBRSxPQUFPLFVBQVUsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBQyxVQUFVO1FBQy9FLFlBQVksRUFBRSxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBQzNELGNBQWMsRUFBRSxJQUFJO0tBQ3JCLENBQUM7Q0FDSDs7Ozs7O0FBRUQseUJBQXlCLE1BQWdCLEVBQUUsS0FBa0I7O0lBQzNELE1BQU0sTUFBTSxHQUFHLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDOztJQUM5QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFVixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFOztRQUN2QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxRQUFRLHVCQUErQjtZQUFFLE1BQU07UUFDbkQsSUFBSSxRQUFRLEtBQUssdUJBQXVCLEVBQUU7WUFDeEMsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNSO2FBQU07WUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7WUFDOUMsSUFBSSxRQUFRLHlCQUFpQyxFQUFFOztnQkFFN0MsTUFBTSxZQUFZLHFCQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLEVBQUM7O2dCQUM1QyxNQUFNLFFBQVEscUJBQUcsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsRUFBQzs7Z0JBQ3hDLE1BQU0sT0FBTyxxQkFBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxFQUFDO2dCQUN2QyxNQUFNLENBQUMsQ0FBQztvQkFDSixtQkFBQyxRQUErQixFQUFDO3lCQUM1QixZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztvQkFDNUQsTUFBTSxDQUFDLGNBQWMsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO2dCQUMzRCxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ1I7aUJBQU07O2dCQUVMLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7Z0JBQzdCLE1BQU0sQ0FBQyxDQUFDO29CQUNKLG1CQUFDLFFBQStCLEVBQUM7eUJBQzVCLFlBQVksQ0FBQyxNQUFNLG9CQUFFLFFBQWtCLHFCQUFFLE9BQWlCLEVBQUMsQ0FBQyxDQUFDO29CQUNsRSxNQUFNLENBQUMsWUFBWSxtQkFBQyxRQUFrQixxQkFBRSxPQUFpQixFQUFDLENBQUM7Z0JBQy9ELENBQUMsSUFBSSxDQUFDLENBQUM7YUFDUjtTQUNGO0tBQ0Y7Q0FDRjs7Ozs7O0FBRUQsTUFBTSxzQkFBc0IsSUFBWSxFQUFFLEtBQVU7SUFDbEQsT0FBTyxJQUFJLEtBQUssQ0FBQyxhQUFhLElBQUksS0FBSyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzdEOzs7Ozs7OztBQVFELE1BQU0sNEJBQ0YsT0FBeUIsRUFBRSxpQkFBb0M7SUFDakUsU0FBUyxJQUFJLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDbkMsZUFBZSxHQUFHLE9BQU8sQ0FBQzs7SUFDMUIsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7O0lBQzNELE1BQU0sS0FBSyxHQUFHLE9BQU8saUJBQWlCLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDakQsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ25DLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdEQsZUFBZSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxpQkFBaUIsQ0FBQztJQUN0QixJQUFJLFNBQVMsSUFBSSxDQUFDLEtBQUssRUFBRTtRQUN2QixJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFO1lBQ3pDLE1BQU0sV0FBVyxDQUFDLG9DQUFvQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDNUU7YUFBTTtZQUNMLE1BQU0sV0FBVyxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDaEU7S0FDRjtJQUNELE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7Ozs7O0FBVUQsTUFBTSxzQkFDRixHQUFXLEVBQUUsS0FBc0IsRUFBRSxHQUE4QixFQUNuRSxTQUE0QjtJQUM5QixxQkFBcUIsRUFBRSxDQUFDOztJQUN4QixNQUFNLElBQUksR0FBRyxXQUFXLENBQ3BCLENBQUMsbUJBQXFCLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUN2QyxlQUFlLENBQ1gsUUFBUSxFQUFFLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLGFBQWEsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFDeEYsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFrQixDQUFDLG9CQUF1QixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFbEYsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQXlCLENBQUM7UUFDMUMsSUFBSSxHQUFHLENBQUMsUUFBUTtZQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsS0FBSyxDQUFDLFVBQVUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFCO0lBRUQsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxtQkFDRixTQUFpQixFQUFFLFVBQTRCLEVBQUUsVUFBVSxHQUFHLEtBQUs7SUFDckUsU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUM7SUFDdEMsU0FBUyxJQUFJLHlCQUF5QixDQUFDLG9CQUFvQixrQkFBb0IsQ0FBQzs7SUFDaEYsTUFBTSxJQUFJLEdBQUcsb0JBQW9CLENBQUM7O0lBQ2xDLE1BQU0sTUFBTSxxQkFBRyxJQUFJLENBQUMsTUFBa0IsRUFBQztJQUN2QyxTQUFTLElBQUksU0FBUyxDQUFDLHdCQUF3QixFQUFFLENBQUM7OztJQUlsRCxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFOztRQUNsQyxNQUFNLGVBQWUsR0FBRywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7O1FBQ3pFLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN0RSxjQUFjLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3JDO1NBQU07O1FBQ0wsTUFBTSxlQUFlLEdBQUcsK0JBQStCLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQzlFLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDOztRQUNoRSxNQUFNLGdCQUFnQixHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM5QyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDdkMsSUFBSSxpQkFBaUIsRUFBRTtZQUNyQixlQUFlLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUMxQixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLHFCQUFFLGdCQUFnQixHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDN0U7S0FDRjs7SUFFRCxJQUFJLEtBQUssR0FBZSxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQ25DLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUU7OztRQUcvQixLQUFLLENBQUMsT0FBTyxHQUFHLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxpQkFBMEIsQ0FBQztLQUNwRjs7SUFFRCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDOztJQUM5QixJQUFJLFVBQVUsQ0FBK0I7SUFDN0MsSUFBSSxPQUFPLElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUU7UUFDaEQsWUFBWSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN0QztDQUNGOzs7Ozs7OztBQU1ELHNCQUFzQixPQUEyQixFQUFFLFFBQWtCO0lBQ25FLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDMUMsU0FBUyxJQUFJLGlCQUFpQixtQkFBQyxPQUFPLENBQUMsQ0FBQyxDQUFXLHNCQUFFLFVBQVUsR0FBRyxDQUFDOztRQUNuRSxNQUFNLFlBQVksc0JBQUcsVUFBVSxxQkFBRyxPQUFPLENBQUMsQ0FBQyxDQUFXLEdBQUUsT0FBTyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLENBQUMsUUFBUSxFQUFFO1FBQzVGLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxZQUFZLEVBQUUsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQzNFO0NBQ0Y7Ozs7Ozs7Ozs7OztBQVNELE1BQU0sa0NBQ0YsSUFBc0IsRUFBRSxPQUFZLEVBQUUsU0FBbUI7SUFDM0QsSUFBSSxDQUFDLElBQUk7UUFBRSxJQUFJLEdBQUcsUUFBUSxDQUFDO0lBQzNCLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFL0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLEVBQUU7UUFDakMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLHFCQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDbkU7Q0FDRjs7Ozs7Ozs7Ozs7O0FBVUQsTUFBTSx5QkFBeUIsSUFBZSxFQUFFLFNBQW1CO0lBQ2pFLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFFakMsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLEVBQUU7UUFDakMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksb0JBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDOUQ7Q0FDRjs7Ozs7QUFHRCxNQUFNO0lBQ0osSUFBSSxRQUFRLEVBQUU7UUFDWixRQUFRLEdBQUcsS0FBSyxDQUFDO0tBQ2xCO1NBQU07UUFDTCxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7UUFDL0Isb0JBQW9CLHFCQUFHLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBaUIsQ0FBQSxDQUFDO0tBQzdFO0lBQ0QsU0FBUyxJQUFJLGNBQWMsQ0FBQyxvQkFBb0Isa0JBQW9CLENBQUM7O0lBQ3JFLE1BQU0sT0FBTyxHQUFHLG9CQUFvQixDQUFDLE9BQU8sQ0FBQztJQUM3QyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ2pELG1CQUFtQixDQUFDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDN0Qsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0NBQzNCOzs7Ozs7Ozs7OztBQVdELE1BQU0sMkJBQ0YsS0FBYSxFQUFFLElBQVksRUFBRSxLQUFVLEVBQUUsU0FBdUI7SUFDbEUsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFOztRQUN2QixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ2pCLFNBQVMsSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztZQUNqRCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7Z0JBQ2hELE9BQU8sQ0FBQyxNQUFNLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3ZFO2FBQU07WUFDTCxTQUFTLElBQUksU0FBUyxDQUFDLG9CQUFvQixFQUFFLENBQUM7O1lBQzlDLE1BQU0sUUFBUSxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3pFLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZELE9BQU8sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxRQUFRLENBQUMsQ0FBQztTQUM5RTtLQUNGO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsTUFBTSwwQkFDRixLQUFhLEVBQUUsUUFBZ0IsRUFBRSxLQUFvQixFQUFFLFNBQXVCO0lBQ2hGLElBQUksS0FBSyxLQUFLLFNBQVM7UUFBRSxPQUFPOztJQUNoQyxNQUFNLElBQUkscUJBQUcsV0FBVyxDQUFDLEtBQUssQ0FBaUIsRUFBQzs7SUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQzs7O0lBR3pCLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssU0FBUyxFQUFFOztRQUV2QyxLQUFLLENBQUMsTUFBTSxHQUFHLHVCQUF1QixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxnQkFBeUIsQ0FBQztLQUNsRjs7SUFFRCxNQUFNLFNBQVMsR0FBRyxLQUFLLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQzs7SUFDeEMsSUFBSSxTQUFTLENBQStCO0lBQzVDLElBQUksU0FBUyxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQ2xELG9CQUFvQixDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN2QyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUN6QjtTQUFNOzs7UUFHTCxLQUFLLEdBQUcsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsbUJBQUMsU0FBUyxDQUFDLEtBQUssQ0FBUSxFQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQzs7UUFDOUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztRQUMzQixTQUFTLElBQUksU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7UUFDN0Msb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQy9DLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDckMsbUJBQUMsTUFBYSxFQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUM7S0FDM0Y7Q0FDRjs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxzQkFDRixJQUFlLEVBQUUsYUFBcUIsRUFBRSxPQUFzQixFQUFFLEtBQXlCLEVBQ3pGLE1BQTRDLEVBQUUsTUFBc0I7SUFDdEUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQixPQUFPO1FBQ0wsSUFBSSxFQUFFLElBQUk7UUFDVixLQUFLLEVBQUUsYUFBYTtRQUNwQixLQUFLLEVBQUUsQ0FBQztRQUNSLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLEtBQUssRUFBRSxLQUFLO1FBQ1osVUFBVSxFQUFFLElBQUk7UUFDaEIsYUFBYSxFQUFFLFNBQVM7UUFDeEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7UUFDbEIsTUFBTSxFQUFFLE1BQU07UUFDZCxJQUFJLEVBQUUsSUFBSTtRQUNWLEtBQUssRUFBRSxJQUFJO1FBQ1gsTUFBTSxFQUFFLE1BQU07UUFDZCxvQkFBb0IsRUFBRSxJQUFJO1FBQzFCLFFBQVEsRUFBRSxJQUFJO1FBQ2QsZUFBZSxFQUFFLElBQUk7UUFDckIsVUFBVSxFQUFFLElBQUk7S0FDakIsQ0FBQztDQUNIOzs7Ozs7OztBQU1ELDhCQUE4QixNQUEwQixFQUFFLEtBQVU7SUFDbEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN6QyxTQUFTLElBQUksaUJBQWlCLG1CQUFDLE1BQU0sQ0FBQyxDQUFDLENBQVcsc0JBQUUsVUFBVSxHQUFHLENBQUM7VUFDbEUsVUFBVSxxQkFBRyxNQUFNLENBQUMsQ0FBQyxDQUFXLEdBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLO0tBQ3pEO0NBQ0Y7Ozs7Ozs7O0FBU0QsaUNBQ0ksVUFBc0IsRUFBRSxTQUEyQjs7SUFDckQsTUFBTSxLQUFLLEdBQUcsVUFBVSxnQ0FBZ0MsQ0FBQzs7SUFDekQsSUFBSSxTQUFTLEdBQXlCLElBQUksQ0FBQztJQUUzQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7O1FBQ2IsTUFBTSxLQUFLLEdBQUcsVUFBVSx3Q0FBMEMsQ0FBQzs7UUFDbkUsTUFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQzs7UUFDMUIsTUFBTSxPQUFPLEdBQUcsU0FBUyxrQkFBMkIsQ0FBQzs7UUFDckQsTUFBTSxJQUFJLHNCQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUc7UUFFaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs7WUFDaEMsTUFBTSxZQUFZLHFCQUFHLElBQUksQ0FBQyxDQUFDLENBQThCLEVBQUM7O1lBQzFELE1BQU0sZ0JBQWdCLEdBQ2xCLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUN6RCxLQUFLLElBQUksVUFBVSxJQUFJLGdCQUFnQixFQUFFO2dCQUN2QyxJQUFJLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtvQkFDL0MsU0FBUyxHQUFHLFNBQVMsSUFBSSxFQUFFLENBQUM7O29CQUM1QixNQUFNLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7b0JBQ2xELE1BQU0sV0FBVyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ3pELFdBQVcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDN0MsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQztpQkFDM0Q7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQztDQUNsQjs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSwyQkFDRixLQUFhLEVBQUUsWUFBb0IsRUFBRSxLQUFvQjtJQUMzRCxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxZQUFZLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3RGOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4QkQsTUFBTSx5QkFDRixpQkFBcUUsRUFDckUsaUJBQXFFLEVBQ3JFLGNBQXVDOztJQUN6QyxNQUFNLFFBQVEsc0JBQUcsa0JBQWtCLEdBQUc7O0lBQ3RDLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7SUFDN0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUU7O1FBRTFCLEtBQUssQ0FBQyxlQUFlO1lBQ2pCLDRCQUE0QixDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQ3hGO0lBQ0QsSUFBSSxpQkFBaUIsSUFBSSxpQkFBaUIsQ0FBQyxNQUFNO1FBQzdDLGlCQUFpQixJQUFJLGlCQUFpQixDQUFDLE1BQU0sRUFBRTtRQUNqRCxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0tBQ2xEO0NBQ0Y7Ozs7Ozs7Ozs7OztBQVlELDJCQUEyQixLQUFhOztJQUN0QyxJQUFJLGNBQWMsR0FBRyxJQUFJLENBQWlCLEtBQUssQ0FBQyxDQUFDO0lBQ2pELElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxFQUFFOztRQUNsQyxNQUFNLFFBQVEsc0JBQUcsY0FBcUIsR0FBaUI7O1FBQ3ZELE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7UUFDN0IsU0FBUztZQUNMLGFBQWEsQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLG9EQUFvRCxDQUFDLENBQUM7UUFDL0YsY0FBYyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDO1lBQzVDLG1CQUFtQixDQUFDLFFBQVEscUJBQUUsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFDO0tBQzVEO0lBQ0QsT0FBTyxjQUFjLENBQUM7Q0FDdkI7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JELE1BQU0sOEJBQWlDLEtBQWE7SUFDbEQsbUJBQW1CLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUM7Q0FDekQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBd0JELE1BQU0sMkJBQ0YsS0FBYSxFQUFFLFVBQWtCLEVBQUUsS0FBZSxFQUFFLE1BQWU7O0lBQ3JFLElBQUksVUFBVSxHQUFnQixJQUFJLENBQUM7SUFDbkMsSUFBSSxLQUFLLEVBQUU7UUFDVCxJQUFJLE1BQU0sRUFBRTs7O1lBR1YsVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUM7U0FDeEM7YUFBTTs7Ozs7WUFLTCxVQUFVLHNCQUFHLEtBQVksRUFBVSxDQUFDO1NBQ3JDO0tBQ0Y7SUFDRCxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7Q0FDMUU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQXVCRCxNQUFNLDRCQUNGLEtBQWEsRUFBRSxPQUE2QyxFQUM1RCxNQUEwQztJQUM1QyxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7Q0FDN0Q7Ozs7Ozs7O0FBWUQsTUFBTSxlQUFlLEtBQWEsRUFBRSxLQUFXO0lBQzdDLFNBQVM7UUFDTCxXQUFXLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLDhDQUE4QyxDQUFDLENBQUM7SUFDN0YsU0FBUyxJQUFJLFNBQVMsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDOztJQUNoRCxNQUFNLFFBQVEsR0FBRyxjQUFjLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDOztJQUNqRCxNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsS0FBSyxtQkFBcUIsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzs7SUFHekUsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNqQixXQUFXLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztDQUN2RDs7Ozs7Ozs7OztBQVNELE1BQU0sc0JBQXlCLEtBQWEsRUFBRSxLQUFvQjtJQUNoRSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQzs7UUFDdEQsTUFBTSxZQUFZLHNCQUFHLFdBQVcsQ0FBQyxLQUFLLENBQVEsR0FBYztRQUM1RCxTQUFTLElBQUksYUFBYSxDQUFDLFlBQVksRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO1FBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO1FBQy9FLFNBQVMsSUFBSSxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7UUFDekMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFELFlBQVksQ0FBQyxNQUFNLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNyRjtDQUNGOzs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSwwQkFDRixlQUF1QixFQUFFLFNBQVksRUFDckMsWUFBOEQ7O0lBQ2hFLE1BQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFL0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsNEJBQTRCLENBQUMsQ0FBQzs7SUFDckYsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDOztJQUV6QyxNQUFNLFdBQVcsR0FBRyxtQkFBQyxZQUF1QyxFQUFDLENBQUMsUUFBUSxDQUFDO0lBQ3ZFLElBQUksV0FBVyxFQUFFO1FBQ2YsaUJBQWlCLENBQUMsZUFBZSxFQUFFLFNBQVMsb0JBQUUsWUFBdUMsRUFBQyxDQUFDO0tBQ3hGO0lBRUQsSUFBSSxpQkFBaUIsRUFBRTs7O1FBR3JCLGNBQWMsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxGLElBQUksWUFBWSxDQUFDLFlBQVk7WUFBRSx3QkFBd0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztLQUMxRTtJQUVELElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDeEIsa0JBQWtCLENBQUMsZUFBZSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzNFO0lBRUQsSUFBSSxZQUFZLENBQUMsY0FBYyxFQUFFO1FBQy9CLFlBQVksQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUMvQjtJQUVELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7OztBQUVELDJCQUNJLGNBQXNCLEVBQUUsUUFBVyxFQUFFLEdBQTRCOztJQUNuRSxNQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBSTdGLE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FDL0IsUUFBUSxvQkFBRSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBZSxHQUNwRCxlQUFlLENBQ1gsZUFBZSxDQUFDLGNBQWMsbUJBQUMsb0JBQW9CLENBQUMsTUFBa0IsR0FBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQ3pGLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGVBQWtCLENBQUMsb0JBQXVCLEVBQ3ZFLG1CQUFtQixFQUFFLENBQUMsQ0FBQyxDQUFDOzs7SUFJaEMsbUJBQUMsb0JBQXdDLEVBQUMsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDO0lBQ2hFLG1CQUFDLGFBQTBCLEVBQUMsQ0FBQyxTQUFTLENBQUMscUJBQUcsb0JBQW9DLENBQUEsQ0FBQztJQUUvRSw0QkFBNEIsQ0FBQyxvQkFBb0IsQ0FBQyxZQUFZLEVBQUUsUUFBUSxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRXpGLElBQUksaUJBQWlCO1FBQUUsMkJBQTJCLEVBQUUsQ0FBQztDQUN0RDs7Ozs7Ozs7Ozs7O0FBUUQsTUFBTSw4QkFDRixLQUFhLEVBQUUsU0FBWSxFQUMzQixZQUE4RDtJQUNoRSxTQUFTO1FBQ0wsV0FBVyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxrREFBa0QsQ0FBQyxDQUFDO0lBQ2pHLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBRXRDLE1BQU0sQ0FBQyxjQUFjLENBQ2pCLFNBQVMsRUFBRSxjQUFjLEVBQUUsRUFBQyxVQUFVLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBQyxDQUFDLENBQUM7SUFFakYsSUFBSSxVQUFVLElBQUksSUFBSTtRQUFFLFFBQVEsQ0FBQyxVQUFVLENBQUMsR0FBRyxVQUFVLEdBQUcsRUFBRSxDQUFDO0lBRS9ELFNBQVMsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQy9DLFVBQVUsQ0FBQyxLQUFLLENBQUMsR0FBRyxTQUFTLENBQUM7SUFFOUIsSUFBSSxpQkFBaUIsRUFBRTs7UUFDckIsTUFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUMvQyxJQUFJLENBQUMsS0FBSyxnQ0FBZ0MsQ0FBQyxLQUFLLENBQUMsRUFBRTs7OztZQUlqRCxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBSztnQkFDNUIsS0FBSyx3Q0FBMEMsR0FBRyxLQUFLLHlCQUF5QixHQUFHLENBQUMsQ0FBQztTQUMxRjthQUFNOztZQUVMLFNBQVMsSUFBSSxjQUFjLENBQ1YsS0FBSyxnQ0FBZ0MsaUNBQ3JDLHNDQUFzQyxDQUFDLENBQUM7WUFDekQsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3BDO0tBQ0Y7U0FBTTs7UUFDTCxNQUFNLFFBQVEsc0JBQUcsWUFBWSxHQUFHLFFBQVEsQ0FBQztRQUN6QyxJQUFJLFFBQVE7WUFBRSxRQUFRLG9CQUFDLFlBQVksR0FBRyxDQUFDO0tBQ3hDO0lBRUQsdUJBQUksWUFBWSxHQUFHLFVBQVUsSUFBSSxJQUFJLElBQUksb0JBQW9CLENBQUMsS0FBSyxDQUFDLElBQUksbUJBQXFCLEVBQUU7UUFDN0YsZUFBZSxDQUNYLG1CQUFDLG9CQUFvQyxFQUFDLENBQUMsTUFBTSxzQkFBRSxZQUFZLEdBQUcsVUFBVSxFQUFhLENBQUM7S0FDM0Y7SUFFRCxPQUFPLFNBQVMsQ0FBQztDQUNsQjs7Ozs7Ozs7Ozs7QUFVRCw0QkFDSSxjQUFzQixFQUFFLFFBQVcsRUFBRSxNQUFpQyxFQUFFLEtBQVk7O0lBQ3RGLElBQUksZ0JBQWdCLHFCQUFHLEtBQUssQ0FBQyxhQUE2QyxFQUFDO0lBQzNFLElBQUksZ0JBQWdCLEtBQUssU0FBUyxJQUFJLGNBQWMsSUFBSSxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUU7UUFDL0UsZ0JBQWdCLEdBQUcscUJBQXFCLENBQUMsY0FBYyxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUN6RTs7SUFFRCxNQUFNLGFBQWEsR0FBdUIsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDM0UsSUFBSSxhQUFhLEVBQUU7UUFDakIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNoRCxtQkFBQyxRQUFlLEVBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzVEO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQkQsK0JBQ0ksY0FBc0IsRUFBRSxNQUErQixFQUFFLEtBQVk7O0lBQ3ZFLE1BQU0sZ0JBQWdCLEdBQXFCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxHQUFHLElBQUksQ0FBQzs7SUFFeEMsTUFBTSxLQUFLLHNCQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUc7O0lBQzVCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNWLE9BQU8sQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7O1FBQ3ZCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixJQUFJLFFBQVEsdUJBQStCO1lBQUUsTUFBTTtRQUNuRCxJQUFJLFFBQVEseUJBQWlDLEVBQUU7O1lBRTdDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTO1NBQ1Y7O1FBQ0QsTUFBTSxpQkFBaUIsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUM7O1FBQzNDLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFFL0IsSUFBSSxpQkFBaUIsS0FBSyxTQUFTLEVBQUU7O1lBQ25DLE1BQU0sYUFBYSxHQUNmLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDaEYsYUFBYSxDQUFDLElBQUksQ0FBQyxpQkFBaUIsb0JBQUUsU0FBbUIsRUFBQyxDQUFDO1NBQzVEO1FBRUQsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNSO0lBQ0QsT0FBTyxnQkFBZ0IsQ0FBQztDQUN6Qjs7Ozs7Ozs7O0FBY0QsTUFBTSwyQkFDRixXQUFrQixFQUFFLFdBQXNCLEVBQUUscUJBQStCO0lBQzdFLFNBQVMsSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7O0lBQzNFLElBQUksWUFBWSxHQUFHLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLG1CQUM5RCxXQUF1QyxFQUFDLENBQUM7UUFDekMsSUFBSSxDQUFDO0lBQ1QsSUFBSSxZQUFZLElBQUksWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLGlCQUFtQixFQUFFO1FBQzlELFlBQVksc0JBQUcsY0FBYyxtQkFBQyxZQUF5QixFQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ2hGO0lBQ0QsT0FBTztRQUNMLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEMsV0FBVztRQUNYLElBQUk7UUFDSixJQUFJOztRQUNKLEVBQUU7MEJBQ0YsWUFBNEI7S0FDN0IsQ0FBQztDQUNIOzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxvQkFDRixLQUFhLEVBQUUsUUFBaUMsRUFBRSxPQUF1QixFQUFFLEtBQW1CLEVBQzlGLFNBQTJCO0lBQzdCLFNBQVM7UUFDTCxXQUFXLENBQ1AsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLHVEQUF1RCxDQUFDLENBQUM7O0lBRTlGLE1BQU0sYUFBYSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxvQkFBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsRUFBRSxDQUFDOztJQUMvRixNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFN0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDOztJQUMvQyxNQUFNLE9BQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQzs7SUFDckUsTUFBTSxJQUFJLEdBQ04sV0FBVyxDQUFDLEtBQUsscUJBQXVCLE9BQU8sRUFBRSxPQUFPLElBQUksSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDakcsV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFckQsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQztZQUMxQixXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7WUFDOUUsRUFBRSxDQUFDO0tBQ1I7OztJQUlELGFBQWEsQ0FBQyxRQUFRLEVBQUUsS0FBSyxHQUFHLGFBQWEsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7O0lBRTFELE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7SUFDN0IsSUFBSSxPQUFPLEVBQUU7O1FBRVgsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUMzQztJQUVELHlCQUF5QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRXJDLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDakIsU0FBUyxJQUFJLGNBQWMsQ0FBQyxvQkFBb0Isb0JBQXNCLENBQUM7SUFDdkUsT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDakMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7Q0FDOUM7Ozs7Ozs7QUFPRCxNQUFNLGdDQUFnQyxLQUFhO0lBQ2pELG9CQUFvQixxQkFBRyxXQUFXLENBQUMsS0FBSyxDQUFVLENBQUEsQ0FBQztJQUNuRCxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixvQkFBc0IsQ0FBQztJQUN2RSxRQUFRLEdBQUcsSUFBSSxDQUFDO0lBQ2hCLG1CQUFDLG9CQUFzQyxFQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUVoRSxJQUFJLENBQUMsa0JBQWtCLEVBQUU7OztRQUd2QixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ2pEO0NBQ0Y7Ozs7Ozs7QUFPRCxNQUFNO0lBQ0osSUFBSSxRQUFRLEVBQUU7UUFDWixRQUFRLEdBQUcsS0FBSyxDQUFDO0tBQ2xCO1NBQU07UUFDTCxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixlQUFpQixDQUFDO1FBQ2xFLFNBQVMsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUMvQixvQkFBb0Isc0JBQUcsY0FBYyxDQUFDLG9CQUFvQixDQUFDLEVBQUUsQ0FBQztLQUMvRDtJQUNELFNBQVMsSUFBSSxjQUFjLENBQUMsb0JBQW9CLG9CQUFzQixDQUFDOztJQUN2RSxNQUFNLFNBQVMscUJBQUcsb0JBQXNDLEVBQUM7SUFDekQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxTQUFTLG9CQUFzQixDQUFDOztJQUM1RCxNQUFNLFNBQVMsc0JBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsR0FBRzs7SUFHakQsT0FBTyxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLEVBQUU7UUFDL0MsVUFBVSxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNsQztDQUNGOzs7Ozs7O0FBTUQscUNBQXFDLFNBQW9CO0lBQ3ZELEtBQUssSUFBSSxPQUFPLEdBQUcsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLE9BQU8sS0FBSyxJQUFJLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTs7OztRQUl0RixJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsYUFBYSxJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLEVBQUU7O1lBQ3BFLE1BQU0sU0FBUyxxQkFBRyxPQUFxQixFQUFDO1lBQ3hDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztnQkFDaEQsTUFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztnQkFFdEMsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztnQkFDdkMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDOUUsc0JBQXNCLENBQ2xCLFNBQVMsRUFBRSxlQUFlLENBQUMsS0FBSyxDQUFDLHFCQUFFLGVBQWUsQ0FBQyxPQUFPLENBQUMsbUJBQXVCLENBQUM7YUFDeEY7U0FDRjtLQUNGO0NBQ0Y7Ozs7Ozs7Ozs7QUFZRCxxQkFDSSxhQUE2QixFQUFFLFFBQWdCLEVBQUUsV0FBbUI7O0lBQ3RFLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDeEMsS0FBSyxJQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQzVDLE1BQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFDakQsSUFBSSxnQkFBZ0IsS0FBSyxXQUFXLEVBQUU7WUFDcEMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakI7YUFBTSxJQUFJLGdCQUFnQixHQUFHLFdBQVcsRUFBRTs7WUFFekMsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM5QjthQUFNOzs7O1lBSUwsTUFBTTtTQUNQO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7O0FBUUQsTUFBTSw0QkFBNEIsV0FBbUI7O0lBQ25ELE1BQU0sU0FBUyxxQkFDWCxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFtQixFQUFDO0lBQy9GLFNBQVMsSUFBSSxjQUFjLENBQUMsU0FBUyxvQkFBc0IsQ0FBQzs7SUFDNUQsTUFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQzs7SUFDbEMsSUFBSSxRQUFRLEdBQW1CLFdBQVcsQ0FBQyxTQUFTLHFCQUFFLFVBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxXQUFXLENBQUMsQ0FBQztJQUUvRixJQUFJLFFBQVEsRUFBRTtRQUNaLG9CQUFvQixHQUFHLFFBQVEsQ0FBQztRQUNoQyxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixlQUFpQixDQUFDO1FBQ2xFLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDaEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDcEM7U0FBTTs7UUFFTCxNQUFNLE9BQU8sR0FBRyxlQUFlLENBQzNCLFFBQVEsRUFBRSx3QkFBd0IsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLEVBQUUsSUFBSSx1QkFDaEUsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBRTNCLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sQ0FBQyxPQUFPLENBQUMsc0JBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFVBQVUsRUFBRSxDQUFDO1NBQ3ZEO1FBRUQsU0FBUyxDQUNMLE9BQU8sRUFBRSxRQUFRLEdBQUcsV0FBVyxDQUFDLFdBQVcsZ0JBQWtCLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDOUY7SUFDRCxJQUFJLFNBQVMsRUFBRTtRQUNiLElBQUksWUFBWSxFQUFFOztZQUVoQixVQUFVLENBQUMsU0FBUyxFQUFFLFFBQVEscUJBQUUsVUFBVSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUM7U0FDN0Q7VUFDRCxVQUFVLENBQUMsWUFBWSxDQUFDO0tBQ3pCO0lBQ0QsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3RDOzs7Ozs7Ozs7Ozs7QUFhRCxrQ0FBa0MsU0FBaUIsRUFBRSxNQUFzQjtJQUN6RSxTQUFTLElBQUksY0FBYyxDQUFDLE1BQU0sb0JBQXNCLENBQUM7O0lBQ3pELE1BQU0sZUFBZSxxQkFBRyxxQkFBQyxNQUFNLEdBQUcsS0FBSyxFQUFtQixDQUFDLE1BQWlCLEVBQUM7SUFDN0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxlQUFlLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztJQUM5RCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLEVBQUUsSUFBSSxFQUFFLDhCQUE4QixDQUFDLENBQUM7SUFDL0YsSUFBSSxTQUFTLElBQUksZUFBZSxDQUFDLE1BQU0sSUFBSSxlQUFlLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSSxFQUFFO1FBQzdFLGVBQWUsQ0FBQyxTQUFTLENBQUM7WUFDdEIsV0FBVyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEtBQUssQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDckY7SUFDRCxPQUFPLGVBQWUsQ0FBQyxTQUFTLENBQUMsQ0FBQztDQUNuQzs7Ozs7QUFHRCxNQUFNO0lBQ0osc0JBQXNCLEVBQUUsQ0FBQztJQUN6QixRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ2pCLG9CQUFvQixxQkFBRyxRQUFRLENBQUMsU0FBUyxDQUFjLENBQUEsQ0FBQztJQUN4RCxTQUFTLG9CQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDO0lBQzlCLFNBQVMsSUFBSSxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztJQUN0RCxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixlQUFpQixDQUFDO0NBQ25FOzs7Ozs7OztBQVNELE1BQU0sMkJBQThCLG9CQUE0QjtJQUM5RCxTQUFTLElBQUksaUJBQWlCLENBQUMsb0JBQW9CLENBQUMsQ0FBQzs7SUFDckQsTUFBTSxPQUFPLHFCQUFHLFFBQVEsQ0FBQyxvQkFBb0IsQ0FBaUIsRUFBQztJQUMvRCxTQUFTLElBQUksY0FBYyxDQUFDLE9BQU8sa0JBQW9CLENBQUM7SUFDeEQsU0FBUztRQUNMLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLDBEQUEwRCxDQUFDLENBQUM7O0lBQzVGLE1BQU0sUUFBUSxzQkFBRyxPQUFPLENBQUMsSUFBSSxHQUFHOztJQUdoQyxJQUFJLFlBQVksQ0FBQyxRQUFRLENBQUMsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxtQ0FBeUMsQ0FBQyxFQUFFO1FBQzNGLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDN0Q7Q0FDRjs7Ozs7O0FBR0QsTUFBTSx1QkFBdUIsSUFBZTtJQUMxQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBc0IsQ0FBQyxxQkFBd0IsQ0FBQztDQUNwRTs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSx3QkFBd0IsU0FBNkIsRUFBRSxhQUF3Qjs7SUFDbkYsTUFBTSxhQUFhLEdBQWlCLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBRWhFLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRTs7UUFDbkMsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOztRQUM3RCxNQUFNLEtBQUssR0FBcUIsYUFBYSxDQUFDLEtBQUssQ0FBQyxVQUFVO1lBQzFELElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7UUFDMUMsTUFBTSxLQUFLLEdBQXFCLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQzs7UUFFOUMsSUFBSSxjQUFjLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFFL0MsT0FBTyxjQUFjLEtBQUssSUFBSSxFQUFFOztZQUM5QixNQUFNLFdBQVcsR0FDYixTQUFTLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxTQUFTLHFCQUFFLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7O1lBQ3RGLE1BQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxJQUFJLENBQUM7WUFFckMsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUU7bUNBQ3RCLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxJQUFJLEdBQUcsY0FBYzthQUMzQztpQkFBTTtnQkFDTCxLQUFLLENBQUMsV0FBVyxDQUFDLEdBQUcsY0FBYyxDQUFDO2dCQUNwQyxjQUFjLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUM1QjtZQUNELEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxjQUFjLENBQUM7WUFFcEMsY0FBYyxHQUFHLFFBQVEsQ0FBQztTQUMzQjtLQUNGO0NBQ0Y7Ozs7Ozs7O0FBU0QsTUFBTSxtQkFBbUIsR0FBc0IsRUFBRSxDQUFDOzs7Ozs7Ozs7O0FBV2xELE1BQU0scUJBQXFCLFNBQWlCLEVBQUUsZ0JBQXdCLENBQUMsRUFBRSxLQUFnQjs7SUFDdkYsTUFBTSxJQUFJLEdBQUcsV0FBVyxDQUFDLFNBQVMsc0JBQXdCLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQzs7SUFHM0YsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsS0FBSyxJQUFJO1FBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDOztJQUcxRSxRQUFRLEdBQUcsS0FBSyxDQUFDOztJQUdqQixNQUFNLE1BQU0sR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFFcEMsSUFBSSxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsUUFBUSxDQUFDLEVBQUU7O1FBQ3pDLE1BQU0sYUFBYSxHQUFHLGlCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDOztRQUNsRCxJQUFJLGFBQWEsR0FBRyxtQkFBQyxhQUFhLENBQUMsS0FBSyxDQUFDLFVBQTZCLEVBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQzs7UUFDdkYsSUFBSSxhQUFhLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQzs7UUFDdkMsSUFBSSxtQkFBbUIsR0FBRyxDQUFDLENBQUMsQ0FBQzs7UUFDN0IsSUFBSSxXQUFXLENBQWlCOztRQUNoQyxNQUFNLFlBQVksR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLENBQUMsQ0FBQztZQUN2RCxDQUFDLFdBQVcscUJBQUcsY0FBYyxDQUFDLE1BQU0sQ0FBbUIsQ0FBQSxDQUFDO21DQUNwRCxXQUFXLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxtQkFDdkMsTUFBc0IsQ0FBQSxDQUFDO1FBRTNCLE9BQU8sYUFBYSxFQUFFO1lBQ3BCLElBQUksYUFBYSxDQUFDLElBQUksdUJBQXlCLEVBQUU7O2dCQUUvQyxNQUFNLG9CQUFvQixHQUFHLGlCQUFpQixDQUFDLGFBQWEsQ0FBQyxDQUFDOztnQkFDOUQsTUFBTSxrQkFBa0IsR0FBRyxtQkFBQyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsVUFDcEMsRUFBQyxtQkFBQyxhQUFhLENBQUMsVUFBb0IsRUFBQyxDQUFDO2dCQUV6RCxJQUFJLGtCQUFrQixFQUFFO29CQUN0QixtQkFBbUIsQ0FBQyxFQUFFLG1CQUFtQixDQUFDLEdBQUcsYUFBYSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDaEYsYUFBYSxHQUFHLGtCQUFrQixDQUFDO29CQUNuQyxhQUFhLEdBQUcsb0JBQW9CLENBQUMsSUFBSSxDQUFDO29CQUMxQyxTQUFTO2lCQUNWO2FBQ0Y7aUJBQU07O2dCQUNMLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2pELEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSywwQkFBMEIsQ0FBQztnQkFDNUMsbUJBQW1CLG1CQUNmLEtBQWtELEdBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxZQUFZLENBQUMsQ0FBQzthQUN6Rjs7O1lBSUQsSUFBSSxhQUFhLENBQUMsSUFBSSxLQUFLLElBQUksSUFBSSxhQUFhLEtBQUssYUFBYSxDQUFDLElBQUksRUFBRTs7Z0JBRXZFLE1BQU0sS0FBSyxHQUFHLG1CQUFtQixDQUFDLG1CQUFtQixFQUFFLENBQUMsQ0FBQztnQkFDekQsYUFBYSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7Z0JBQzVCLGFBQWEsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO2FBQzVCO1lBQ0QsYUFBYSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7U0FDcEM7S0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSx3QkFDRixXQUFzQixFQUFFLGlCQUF5QixFQUFFLEtBQVE7SUFDN0QsSUFBSSxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUU7MkJBQ3JCLFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksS0FBSztLQUNsQztTQUFNLElBQUksaUJBQWlCLEVBQUU7UUFDNUIsS0FBSyxDQUFDLFVBQVUsR0FBRyxpQkFBaUIsQ0FBQztLQUN0QztJQUNELFdBQVcsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7SUFDMUIsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7O0FBT0QsTUFBTSw0QkFBNEIsSUFBa0I7O0lBRWxELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsc0JBQXlCLENBQUMsRUFBRTtRQUM3RCxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBb0IsQ0FBQztLQUN0QztDQUNGOzs7Ozs7OztBQU1ELE1BQU0scUNBQ0YsSUFBZSxFQUFFLFVBQTRCO0lBQy9DLE9BQU8sVUFBUyxDQUFNO1FBQ3BCLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QixDQUFDO0NBQ0g7Ozs7Ozs7O0FBTUQsTUFBTSwwQ0FDRixJQUFlLEVBQUUsVUFBNEI7SUFDL0MsT0FBTyxzQ0FBc0MsQ0FBUTtRQUNuRCxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFO1lBQzNCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7WUFFbkIsQ0FBQyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDdkI7S0FDRixDQUFDO0NBQ0g7Ozs7OztBQUdELE1BQU0sd0JBQXdCLElBQWU7O0lBQzNDLElBQUksV0FBVyxHQUFjLElBQUksQ0FBQztJQUVsQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDbEMsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBb0IsQ0FBQztRQUN2QyxXQUFXLHNCQUFHLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO0tBQ3JDO0lBQ0QsV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBb0IsQ0FBQztJQUN2QyxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNoRSxZQUFZLG1CQUFDLFdBQVcsQ0FBQyxPQUFPLENBQWdCLEVBQUMsQ0FBQztDQUNuRDs7Ozs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSx1QkFBMEIsV0FBd0I7SUFDdEQsSUFBSSxXQUFXLENBQUMsS0FBSyxJQUFJLGNBQWMsRUFBRTs7UUFDdkMsSUFBSSxHQUFHLENBQTZCO1FBQ3BDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0RCxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUN6QixlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7Y0FDN0IsR0FBRyxHQUFHLElBQUk7WUFDVixXQUFXLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQztTQUNwQyxDQUFDLENBQUM7S0FDSjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7O0FBY0QsTUFBTSxlQUFrQixTQUFZOztJQUNsQyxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBQ3hDLE1BQU0sV0FBVyxxQkFBRyxRQUFRLENBQUMsT0FBTyxDQUFnQixFQUFDO0lBQ3JELGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztDQUM5Qjs7Ozs7QUFFRCx5QkFBeUIsV0FBd0I7SUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztRQUN0RCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOztRQUNoRCxNQUFNLFFBQVEsR0FBRyw2QkFBNkIsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUU5RCxTQUFTLElBQUksYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsb0RBQW9ELENBQUMsQ0FBQztRQUNoRyx5QkFBeUIsQ0FBQyxRQUFRLEVBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0tBQ2hGO0NBQ0Y7Ozs7Ozs7O0FBU0QsTUFBTSxzQkFBc0IsU0FBYztJQUN4QyxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQzs7SUFDbkQsTUFBTSxZQUFZLEdBQUcsNkJBQTZCLENBQUMsU0FBUyxDQUFDLENBQUM7O0lBQzlELElBQUksU0FBUyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDbEMsT0FBTyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUU7UUFDeEIsU0FBUyxzQkFBRyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQztLQUNqQztJQUNELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSx3QkFBMkIsU0FBWTs7SUFDM0MsTUFBTSxRQUFRLEdBQUcsNkJBQTZCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDMUQsU0FBUztRQUNMLGFBQWEsQ0FDVCxRQUFRLENBQUMsSUFBSSxFQUFFLGtFQUFrRSxDQUFDLENBQUM7SUFDM0YscUJBQXFCLG1CQUFDLFFBQVEsQ0FBQyxJQUFpQixHQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztDQUN4RTs7Ozs7OztBQU9ELE1BQU0sa0NBQWtDLFNBQW9CO0lBQzFELGVBQWUsbUJBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBZ0IsRUFBQyxDQUFDO0NBQ3BEOzs7Ozs7Ozs7O0FBU0QsTUFBTSx5QkFBNEIsU0FBWTtJQUM1QyxrQkFBa0IsR0FBRyxJQUFJLENBQUM7SUFDMUIsSUFBSTtRQUNGLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUMxQjtZQUFTO1FBQ1Isa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0tBQzVCO0NBQ0Y7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxtQ0FBbUMsU0FBb0I7SUFDM0Qsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0lBQzFCLElBQUk7UUFDRix1QkFBdUIsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUNwQztZQUFTO1FBQ1Isa0JBQWtCLEdBQUcsS0FBSyxDQUFDO0tBQzVCO0NBQ0Y7Ozs7Ozs7OztBQUdELE1BQU0sZ0NBQ0YsUUFBbUIsRUFBRSxRQUFzQixFQUFFLFNBQVk7O0lBQzNELE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUM7O0lBQzlDLE1BQU0sU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQzs7SUFDbEMsTUFBTSxRQUFRLHNCQUFHLFNBQVMsQ0FBQyxRQUFRLEdBQUc7O0lBQ3RDLE1BQU0sU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUM7SUFFdEMsSUFBSTtRQUNGLGFBQWEsRUFBRSxDQUFDO1FBQ2hCLGVBQWUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELFFBQVEsQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsc0JBQXNCLEVBQUUsQ0FBQztRQUN6QixlQUFlLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZDO1lBQVM7UUFDUixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEI7Q0FDRjs7Ozs7Ozs7QUFFRCx5QkFDSSxTQUFtQyxFQUFFLEtBQWlCLEVBQUUsU0FBWTtJQUN0RSxJQUFJLFNBQVMsSUFBSSxDQUFDLEtBQUssdUJBQTBCLENBQUMsRUFBRTtRQUNsRCxTQUFTLGlCQUFxQixTQUFTLENBQUMsQ0FBQztLQUMxQztDQUNGOzs7Ozs7O0FBRUQseUJBQTRCLFNBQW1DLEVBQUUsU0FBWTtJQUMzRSxJQUFJLFNBQVMsRUFBRTtRQUNiLFNBQVMsaUJBQXFCLFNBQVMsQ0FBQyxDQUFDO0tBQzFDO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBaUJELE1BQU0sb0JBQXVCLFNBQVk7SUFDdkMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7O0lBQ25ELE1BQU0sWUFBWSxHQUFHLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzlELGFBQWEsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDbEM7Ozs7QUFZRCxhQUFhLFNBQVMscUJBQUcsRUFBZSxFQUFDOzs7Ozs7OztBQVF6QztJQUNFLFNBQVMsSUFBSSxXQUFXLENBQ1AsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUMzQixzQ0FBc0MsR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztJQUNuRixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNsQyxLQUFLLENBQUMsaUJBQWlCLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztLQUMzQztJQUNELFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7Q0FDbkQ7Ozs7Ozs7O0FBT0QsTUFBTSxlQUFrQixLQUFRO0lBQzlCLE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztDQUNsRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkQsTUFBTSx1QkFBdUIsUUFBZ0I7Ozs7SUFJM0MsUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUM7SUFDNUIsUUFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7O0lBR3BDLFlBQVksRUFBRSxDQUFDO0NBQ2hCOzs7Ozs7Ozs7O0FBU0QsTUFBTSx5Q0FBeUMsTUFBYzs7SUFDM0QsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBQzVDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUMsaUJBQWlCLEdBQUcsTUFBTSxDQUFDO0lBQzNELE9BQU8sV0FBVyxDQUFDO0NBQ3BCOzs7Ozs7Ozs7QUFRRCxNQUFNLDhCQUE4QixLQUFhO0lBQy9DLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxLQUFLLENBQUM7Q0FDakM7Ozs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0seUJBQXlCLE1BQWE7SUFDMUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0lBQy9FLFNBQVMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFDQUFxQyxDQUFDLENBQUM7O0lBRXRGLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUV0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFOztRQUV6QyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLENBQUM7S0FDakQ7SUFFRCxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ2QsT0FBTyxTQUFTLENBQUM7S0FDbEI7O0lBR0QsSUFBSSxPQUFPLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDekMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7OztBQVNELE1BQU0seUJBQXlCLE1BQWMsRUFBRSxFQUFPLEVBQUUsTUFBYzs7SUFDcEUsTUFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRXJDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0NBQ2hFOzs7Ozs7Ozs7O0FBR0QsTUFBTSx5QkFDRixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsTUFBYzs7SUFDOUQsTUFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUUxQyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0NBQ3JGOzs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7O0lBRW5GLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQzNFLFNBQVMsQ0FBQztDQUM5Qjs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQ3RGLE1BQWM7O0lBQ2hCLE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVsRCxPQUFPLFNBQVMsQ0FBQyxDQUFDO1FBQ2QsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDakYsTUFBTSxDQUFDLENBQUM7UUFDWixTQUFTLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7Ozs7OztBQUdELE1BQU0seUJBQ0YsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxNQUFjOztJQUNyQyxJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEQsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDNUIsU0FBUyxDQUFDO0NBQ2Y7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdELE1BQU0seUJBQ0YsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7O0lBQzFELElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRCxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFakQsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNqRCxTQUFTLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQ3RGLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7O0lBRS9FLElBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRCxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDakQsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLFNBQVMsQ0FBQztDQUNmOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0QsTUFBTSx5QkFDRixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUN0RixFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUNsRixNQUFjOztJQUNoQixJQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEQsU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFekQsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDM0YsU0FBUyxDQUFDO0NBQ2Y7Ozs7Ozs7O0FBR0QsTUFBTSxnQkFBbUIsS0FBYSxFQUFFLEtBQVE7O0lBRzlDLE1BQU0sYUFBYSxHQUFHLEtBQUssR0FBRyxhQUFhLENBQUM7SUFDNUMsSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDdEMsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDbEM7SUFDRCxRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ2pDOzs7Ozs7Ozs7OztBQVVELE1BQU0sb0JBQXVCLEtBQWE7SUFDeEMsT0FBTyxZQUFZLENBQUksS0FBSyxFQUFFLGVBQWUsQ0FBQyxDQUFDO0NBQ2hEOzs7Ozs7QUFFRCxxQkFBcUIsWUFBb0IsRUFBRSxXQUFzQjtJQUMvRCxPQUFPLFlBQVksR0FBRyxDQUFDLEVBQUU7UUFDdkIsU0FBUyxJQUFJLGFBQWEsQ0FDVCxXQUFXLENBQUMsZ0JBQWdCLENBQUMsRUFDN0Isd0VBQXdFLENBQUMsQ0FBQztRQUMzRixXQUFXLHNCQUFHLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7UUFDOUMsWUFBWSxFQUFFLENBQUM7S0FDaEI7SUFDRCxPQUFPLFdBQVcsQ0FBQztDQUNwQjs7Ozs7OztBQUdELE1BQU0sd0JBQTJCLEtBQWE7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUUsc0RBQXNELENBQUMsQ0FBQztJQUMvRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxxQkFBRSxVQUFVLEdBQUcsQ0FBQztJQUNwRCwwQkFBTyxVQUFVLEdBQUcsS0FBSyxFQUFFO0NBQzVCOzs7Ozs7QUFFRCxNQUFNLHdCQUEyQixZQUFvQjtJQUNuRCxTQUFTLElBQUksYUFBYSxDQUNULFFBQVEsQ0FBQyxlQUFlLENBQUMsRUFDekIsK0RBQStELENBQUMsQ0FBQztJQUNsRixTQUFTLElBQUksaUJBQWlCLENBQUMsWUFBWSxxQkFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsQ0FBQztJQUUxRSwwQkFBTyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsWUFBWSxFQUFFO0NBQ2xEOzs7Ozs7O0FBR0QsTUFBTSxlQUFrQixLQUFhO0lBQ25DLE9BQU8sWUFBWSxDQUFJLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztDQUN6Qzs7Ozs7QUFFRCxNQUFNLHNCQUFzQixLQUFhO0lBQ3ZDLE9BQU8sbUJBQW1CLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0NBQzdDOzs7OztBQUdELE1BQU07SUFDSixTQUFTLElBQUksaUJBQWlCLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7SUFDeEQsU0FBUztRQUNMLGNBQWMsQ0FDVixRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUFFLHlDQUF5QyxDQUFDLENBQUM7SUFDakcsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztDQUM1Qzs7Ozs7O0FBR0QsTUFBTSx5QkFBeUIsS0FBVTtJQUN2QyxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztJQUMzRixJQUFJLFFBQVEsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFBRSxZQUFZLEVBQUUsQ0FBQzs7SUFDbkQsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTdDLElBQUksWUFBWSxJQUFJLFFBQVEsQ0FBQyxNQUFNLEVBQUU7UUFDbkMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQzdDO1NBQU0sSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQ3JELHlCQUF5QixDQUFDLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDM0YsUUFBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQzdDO1NBQU07UUFDTCxRQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQztRQUMxQixPQUFPLEtBQUssQ0FBQztLQUNkO0lBQ0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7O0FBR0QsTUFBTSxnQ0FBZ0MsS0FBVTtJQUM5QyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEIsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7OztBQUdELE1BQU0sMEJBQTBCLElBQVMsRUFBRSxJQUFTOztJQUNsRCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsT0FBTyxjQUFjLENBQUMsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0NBQzFDOzs7Ozs7Ozs7QUFHRCxNQUFNLDBCQUEwQixJQUFTLEVBQUUsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTOztJQUN4RSxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzlDLE9BQU8sZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxTQUFTLENBQUM7Q0FDakQ7Ozs7QUFFRCxNQUFNO0lBQ0osT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7Ozs7QUFNRCxNQUFNLCtCQUFrQyxTQUF1Qjs7SUFDN0QsTUFBTSx5QkFBeUIsR0FDM0IsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDcEYsSUFBSSxpQkFBaUIsRUFBRTs7UUFDckIsTUFBTSxxQkFBcUIsc0JBQUcsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7O1FBQ3RELE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxDQUFDLGNBQWMsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFDLENBQUM7O1FBQ2hGLE1BQU0sdUJBQXVCLEdBQ3pCLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RixJQUFJLHFCQUFxQixLQUFLLHVCQUF1QixFQUFFO1lBQ3JELG1CQUFtQixDQUFDLElBQUksQ0FBQyxxQkFBcUIsRUFBRSx5QkFBeUIsR0FBRyxDQUFDLENBQUMsQ0FBQztTQUNoRjtLQUNGO0NBQ0Y7Ozs7QUFFRCxNQUFNO0lBQ0osV0FBVyxDQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUseUNBQXlDLENBQUMsQ0FBQztDQUN4RTs7OztBQUVEO0lBQ0UsYUFBYSxDQUFDLGNBQWMsQ0FBQyxvQkFBb0IsQ0FBQyxFQUFFLDJDQUEyQyxDQUFDLENBQUM7Q0FDbEc7Ozs7OztBQUVELDJCQUEyQixLQUFhLEVBQUUsR0FBVztJQUNuRCxJQUFJLEdBQUcsSUFBSSxJQUFJO1FBQUUsR0FBRyxHQUFHLFFBQVEsQ0FBQztJQUNoQyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLFFBQVEsQ0FBQyxDQUFDO0NBQ25EOzs7Ozs7QUFFRCx3QkFBd0IsS0FBYSxFQUFFLEdBQVc7SUFDaEQsSUFBSSxHQUFHLElBQUksSUFBSTtRQUFFLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDaEMsV0FBVyxDQUNQLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsS0FBSyw2Q0FBNkMsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7Q0FDbEc7Ozs7Ozs7OztBQU9ELE1BQU0sd0NBQXdDLFVBQWtCLEVBQUUsUUFBZ0I7SUFDaEYsSUFBSSxpQkFBaUIsRUFBRTs7UUFDckIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztRQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pDLFdBQVcsQ0FDUCxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFDbkMsd0VBQXdFLENBQUMsQ0FBQztTQUMvRTtLQUNGO0NBQ0Y7Ozs7OztBQUVELE1BQU0sd0NBQTJDLFNBQVk7SUFDM0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsOEJBQThCLENBQUMsQ0FBQzs7SUFDdEUsTUFBTSxZQUFZLHFCQUFHLG1CQUFDLFNBQWdCLEVBQUMsQ0FBQyxjQUFjLENBQWlCLEVBQUM7SUFDeEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUNuRSxPQUFPLFlBQVksQ0FBQztDQUNyQjs7QUFFRCxhQUFhLGFBQWEsR0FBRyxjQUFjLENBQUM7O0FBQzVDLGFBQWEsc0JBQXNCLEdBQUcsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3REZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmSW50ZXJuYWwsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEluaXRpYWxTdHlsaW5nRmxhZ3MsIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgQ09OVEVOVF9RVUVSSUVTLCBDT05URVhULCBDdXJyZW50TWF0Y2hlc0xpc3QsIERFQ0xBUkFUSU9OX1ZJRVcsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIE9wYXF1ZVZpZXdTdGF0ZSwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUm9vdENvbnRleHQsIFNBTklUSVpFUiwgVEFJTCwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlLCBjYW5JbnNlcnROYXRpdmVOb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZmluZENvbXBvbmVudEhvc3QsIGdldENoaWxkTE5vZGUsIGdldExWaWV3Q2hpbGQsIGdldE5leHRMTm9kZSwgZ2V0UGFyZW50TE5vZGUsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0LCBhbGxvY1N0eWxpbmdDb250ZXh0LCBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlLCByZW5kZXJTdHlsaW5nIGFzIHJlbmRlckVsZW1lbnRTdHlsZXMsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbCwgaXNEaWZmZXJlbnQsIGxvYWRFbGVtZW50SW50ZXJuYWwsIGxvYWRJbnRlcm5hbCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogRGlyZWN0aXZlIChEKSBzZXRzIGEgcHJvcGVydHkgb24gYWxsIGNvbXBvbmVudCBpbnN0YW5jZXMgdXNpbmcgdGhpcyBjb25zdGFudCBhcyBhIGtleSBhbmQgdGhlXG4gKiBjb21wb25lbnQncyBob3N0IG5vZGUgKExFbGVtZW50KSBhcyB0aGUgdmFsdWUuIFRoaXMgaXMgdXNlZCBpbiBtZXRob2RzIGxpa2UgZGV0ZWN0Q2hhbmdlcyB0b1xuICogZmFjaWxpdGF0ZSBqdW1waW5nIGZyb20gYW4gaW5zdGFuY2UgdG8gdGhlIGhvc3Qgbm9kZS5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HX0hPU1RfU1lNQk9MID0gJ19fbmdIb3N0TE5vZGVfXyc7XG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG4vKipcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlIGJlZm9yZSB3cml0aW5nIGl0IGludG8gdGhlIHJlbmRlcmVyLlxuICovXG5leHBvcnQgdHlwZSBTYW5pdGl6ZXJGbiA9ICh2YWx1ZTogYW55KSA9PiBzdHJpbmc7XG5cbi8qKlxuICogRGlyZWN0aXZlIGFuZCBlbGVtZW50IGluZGljZXMgZm9yIHRvcC1sZXZlbCBkaXJlY3RpdmUuXG4gKlxuICogU2F2ZWQgaGVyZSB0byBhdm9pZCByZS1pbnN0YW50aWF0aW5nIGFuIGFycmF5IG9uIGV2ZXJ5IGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICpcbiAqIE5vdGU6IEVsZW1lbnQgaXMgbm90IGFjdHVhbGx5IHN0b3JlZCBhdCBpbmRleCAwIGJlY2F1c2Ugb2YgdGhlIExWaWV3RGF0YVxuICogaGVhZGVyLCBidXQgdGhlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24gZXhwZWN0cyBhbiBpbmRleCB0aGF0IGlzIE5PVCBhZGp1c3RlZFxuICogYmVjYXVzZSBpdCB3aWxsIHVsdGltYXRlbHkgYmUgZmVkIHRvIGluc3RydWN0aW9ucyBsaWtlIGVsZW1lbnRQcm9wZXJ0eS5cbiAqL1xuY29uc3QgX1JPT1RfRElSRUNUSVZFX0lORElDRVMgPSBbMCwgMF07XG5cbi8qKlxuICogVFZpZXcuZGF0YSBuZWVkcyB0byBmaWxsIHRoZSBzYW1lIG51bWJlciBvZiBzbG90cyBhcyB0aGUgTFZpZXdEYXRhIGhlYWRlclxuICogc28gdGhlIGluZGljZXMgb2Ygbm9kZXMgYXJlIGNvbnNpc3RlbnQgYmV0d2VlbiBMVmlld0RhdGEgYW5kIFRWaWV3LmRhdGEuXG4gKlxuICogSXQncyBtdWNoIGZhc3RlciB0byBrZWVwIGEgYmx1ZXByaW50IG9mIHRoZSBwcmUtZmlsbGVkIGFycmF5IGFuZCBzbGljZSBpdFxuICogdGhhbiBpdCBpcyB0byBjcmVhdGUgYSBuZXcgYXJyYXkgYW5kIGZpbGwgaXQgZWFjaCB0aW1lIGEgVFZpZXcgaXMgY3JlYXRlZC5cbiAqL1xuY29uc3QgSEVBREVSX0ZJTExFUiA9IG5ldyBBcnJheShIRUFERVJfT0ZGU0VUKS5maWxsKG51bGwpO1xuXG4vKipcbiAqIFRva2VuIHNldCBpbiBjdXJyZW50TWF0Y2hlcyB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkLlxuICpcbiAqIElmIHdlIHZpc2l0IGEgZGlyZWN0aXZlIHRoYXQgaGFzIGEgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB3ZSBrbm93IHdlJ3ZlXG4gKiBhbHJlYWR5IHNlZW4gaXQsIGFuZCB0aHVzIGhhdmUgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgY29uc3QgQ0lSQ1VMQVIgPSAnX19DSVJDVUxBUl9fJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICpcbiAqIFRoaXMgcmVuZGVyZXIgY2FuIGJlIG9uZSBvZiB0d28gdmFyaWV0aWVzIG9mIFJlbmRlcmVyMzpcbiAqXG4gKiAtIE9iamVjdGVkT3JpZW50ZWRSZW5kZXJlcjNcbiAqXG4gKiBUaGlzIGlzIHRoZSBuYXRpdmUgYnJvd3NlciBBUEkgc3R5bGUsIGUuZy4gb3BlcmF0aW9ucyBhcmUgbWV0aG9kcyBvbiBpbmRpdmlkdWFsIG9iamVjdHNcbiAqIGxpa2UgSFRNTEVsZW1lbnQuIFdpdGggdGhpcyBzdHlsZSwgbm8gYWRkaXRpb25hbCBjb2RlIGlzIG5lZWRlZCBhcyBhIGZhY2FkZSAocmVkdWNpbmcgcGF5bG9hZFxuICogc2l6ZSkuXG4gKlxuICogLSBQcm9jZWR1cmFsUmVuZGVyZXIzXG4gKlxuICogSW4gbm9uLW5hdGl2ZSBicm93c2VyIGVudmlyb25tZW50cyAoZS5nLiBwbGF0Zm9ybXMgc3VjaCBhcyB3ZWItd29ya2VycyksIHRoaXMgaXMgdGhlIGZhY2FkZVxuICogdGhhdCBlbmFibGVzIGVsZW1lbnQgbWFuaXB1bGF0aW9uLiBUaGlzIGFsc28gZmFjaWxpdGF0ZXMgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aFxuICogUmVuZGVyZXIyLlxuICovXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyMztcbmxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5sZXQgY3VycmVudEVsZW1lbnROb2RlOiBMRWxlbWVudE5vZGV8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gdmlld0RhdGEgJiYgdmlld0RhdGFbU0FOSVRJWkVSXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiAodmlld0RhdGEgYXMgYW55KSBhcyBPcGFxdWVWaWV3U3RhdGU7XG59XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IExWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBUaGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiBzaG91bGQgYmUgdXNlZCBmb3IgYW55dGhpbmcgcHVibGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldFZpZXdEYXRhKCk6IExWaWV3RGF0YSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIExWaWV3RGF0YSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRWaWV3RGF0YSA9ICh2aWV3VG9SZXN0b3JlIGFzIGFueSkgYXMgTFZpZXdEYXRhO1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnROb2RlOiBMTm9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk6IExOb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudE5vZGU7XG59XG5cbi8qKlxuICogSWYgYGlzUGFyZW50YCBpczpcbiAqICAtIGB0cnVlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudE5vZGVgIHBvaW50cyB0byBwcmV2aW91cyBub2RlIChzaWJsaW5nKS5cbiAqL1xubGV0IGlzUGFyZW50OiBib29sZWFuO1xuXG5sZXQgdFZpZXc6IFRWaWV3O1xuXG5sZXQgY3VycmVudFF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbi8qKlxuICogUXVlcnkgaW5zdHJ1Y3Rpb25zIGNhbiBhc2sgZm9yIFwiY3VycmVudCBxdWVyaWVzXCIgaW4gMiBkaWZmZXJlbnQgY2FzZXM6XG4gKiAtIHdoZW4gY3JlYXRpbmcgdmlldyBxdWVyaWVzIChhdCB0aGUgcm9vdCBvZiBhIGNvbXBvbmVudCB2aWV3LCBiZWZvcmUgYW55IG5vZGUgaXMgY3JlYXRlZCAtIGluXG4gKiB0aGlzIGNhc2UgY3VycmVudFF1ZXJpZXMgcG9pbnRzIHRvIHZpZXcgcXVlcmllcylcbiAqIC0gd2hlbiBjcmVhdGluZyBjb250ZW50IHF1ZXJpZXMgKGluYiB0aGlzIHByZXZpb3VzT3JQYXJlbnROb2RlIHBvaW50cyB0byBhIG5vZGUgb24gd2hpY2ggd2VcbiAqIGNyZWF0ZSBjb250ZW50IHF1ZXJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJpZXMoUXVlcnlUeXBlOiB7bmV3ICgpOiBMUXVlcmllc30pOiBMUXVlcmllcyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyaWVzIHx8XG4gICAgICAoY3VycmVudFF1ZXJpZXMgPVxuICAgICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcyAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS5xdWVyaWVzLmNsb25lKCkgfHxcbiAgICAgICAgICAgIG5ldyBRdWVyeVR5cGUoKSkpO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKi9cbmxldCBjcmVhdGlvbk1vZGU6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGlvbk1vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCB2aWV3RGF0YTogTFZpZXdEYXRhO1xuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0Vmlld0RhdGE6IExWaWV3RGF0YSA9IG51bGwgITtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gW10pO1xufVxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBvbGRWaWV3OiBMVmlld0RhdGEgPSB2aWV3RGF0YTtcbiAgZGlyZWN0aXZlcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tESVJFQ1RJVkVTXTtcbiAgdFZpZXcgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbVFZJRVddO1xuXG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgZmlyc3RUZW1wbGF0ZVBhc3MgPSBuZXdWaWV3ICYmIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuXG4gIHJlbmRlcmVyID0gbmV3VmlldyAmJiBuZXdWaWV3W1JFTkRFUkVSXTtcblxuICBpZiAoaG9zdCAhPSBudWxsKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBob3N0O1xuICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgfVxuXG4gIHZpZXdEYXRhID0gY29udGV4dFZpZXdEYXRhID0gbmV3VmlldztcbiAgY3VycmVudFF1ZXJpZXMgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUVVFUklFU107XG5cbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXdEYXRhLCBjcmVhdGlvbk9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LnZpZXdIb29rcywgdFZpZXcudmlld0NoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gICAgfVxuICAgIC8vIFZpZXdzIGFyZSBjbGVhbiBhbmQgaW4gdXBkYXRlIG1vZGUgYWZ0ZXIgYmVpbmcgY2hlY2tlZCwgc28gdGhlc2UgYml0cyBhcmUgY2xlYXJlZFxuICAgIHZpZXdEYXRhW0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5EaXJ0eSk7XG4gIH1cbiAgdmlld0RhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSAtMTtcbiAgZW50ZXJWaWV3KG5ld1ZpZXcsIG51bGwpO1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKSB7XG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbiAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKHZpZXdEYXRhKTtcblxuICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3KTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cblxuICBzZXRIb3N0QmluZGluZ3ModFZpZXcuaG9zdEJpbmRpbmdzKTtcbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzKTtcbn1cblxuXG4vKiogU2V0cyB0aGUgaG9zdCBiaW5kaW5ncyBmb3IgdGhlIGN1cnJlbnQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIb3N0QmluZGluZ3MoYmluZGluZ3M6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoYmluZGluZ3MgIT0gbnVsbCkge1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlySW5kZXggPSBiaW5kaW5nc1tpXTtcbiAgICAgIGNvbnN0IGRlZiA9IGRlZnNbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICYmIGRlZi5ob3N0QmluZGluZ3MoZGlySW5kZXgsIGJpbmRpbmdzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVEZWZJZHhdO1xuXG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoICEoZGlyZWN0aXZlRGVmSWR4LCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIHJldHVybiBbXG4gICAgdFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0Vmlld1xuICAgIHZpZXdEYXRhLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLlJ1bkluaXQsICAvLyBmbGFnc1xuICAgIG51bGwgISwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaG9zdE5vZGVcbiAgICAtMSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJpbmRpbmdJbmRleFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlyZWN0aXZlc1xuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xlYW51cEluc3RhbmNlc1xuICAgIGNvbnRleHQsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGV4dFxuICAgIHZpZXdEYXRhID8gdmlld0RhdGFbSU5KRUNUT1JdIDogbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5qZWN0b3JcbiAgICByZW5kZXJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmRlcmVyXG4gICAgc2FuaXRpemVyIHx8IG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW5pdGl6ZXJcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRhaWxcbiAgICAtMSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRhaW5lckluZGV4XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250ZW50UXVlcmllc1xuICAgIG51bGwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGVjbGFyYXRpb25WaWV3XG4gIF07XG59XG5cbi8qKlxuICogQ3JlYXRpb24gb2YgTE5vZGUgb2JqZWN0IGlzIGV4dHJhY3RlZCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHdlIGFsd2F5cyBjcmVhdGUgTE5vZGUgb2JqZWN0XG4gKiB3aXRoIHRoZSBzYW1lIHNoYXBlXG4gKiAoc2FtZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGluIHRoZSBzYW1lIG9yZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgIHR5cGU6IFROb2RlVHlwZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgcGFyZW50OiBMTm9kZSB8IG51bGwsXG4gICAgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBzdGF0ZTogYW55LFxuICAgIHF1ZXJpZXM6IExRdWVyaWVzIHwgbnVsbCk6IExFbGVtZW50Tm9kZSZMVGV4dE5vZGUmTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIHJldHVybiB7XG4gICAgbmF0aXZlOiBuYXRpdmUgYXMgYW55LFxuICAgIHZpZXc6IGN1cnJlbnRWaWV3LFxuICAgIG5vZGVJbmplY3RvcjogcGFyZW50ID8gcGFyZW50Lm5vZGVJbmplY3RvciA6IG51bGwsXG4gICAgZGF0YTogc3RhdGUsXG4gICAgcXVlcmllczogcXVlcmllcyxcbiAgICB0Tm9kZTogbnVsbCAhLFxuICAgIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEEgY29tbW9uIHdheSBvZiBjcmVhdGluZyB0aGUgTE5vZGUgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZW0gaGF2ZSBzYW1lIHNoYXBlIHRvXG4gKiBrZWVwIHRoZSBleGVjdXRpb24gY29kZSBtb25vbW9ycGhpYyBhbmQgZmFzdC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBMTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBMTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIExOb2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGRhdGEgQW55IGRhdGEgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gdGhlIExOb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsVmlld0RhdGE/OiBMVmlld0RhdGEgfCBudWxsKTogTEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5WaWV3LCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBudWxsLFxuICAgIGxWaWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IExDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgbFByb2plY3Rpb246IG51bGwpOiBMUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgZGF0YTogbnVsbCk6IExFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBzdGF0ZT86IG51bGwgfCBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZcbiAgICBMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgY29uc3QgcGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgJiYgZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICFhcyBMTm9kZTtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHRQYXJlbnQgPVxuICAgICAgcGFyZW50ICYmIHBhcmVudC52aWV3ID09PSB2aWV3RGF0YSA/IHBhcmVudC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGxldCBxdWVyaWVzID1cbiAgICAgIChpc1BhcmVudCA/IGN1cnJlbnRRdWVyaWVzIDogcHJldmlvdXNPclBhcmVudE5vZGUgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcykgfHxcbiAgICAgIHBhcmVudCAmJiBwYXJlbnQucXVlcmllcyAmJiBwYXJlbnQucXVlcmllcy5jaGlsZCgpO1xuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCB2aWV3RGF0YSwgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsLCBxdWVyaWVzKTtcblxuICBpZiAoaW5kZXggPT09IC0xIHx8IHR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gICAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIFRWaWV3Lm5vZGUuXG4gICAgbm9kZS50Tm9kZSA9IChzdGF0ZSA/IChzdGF0ZSBhcyBMVmlld0RhdGEpW1RWSUVXXS5ub2RlIDogbnVsbCkgfHxcbiAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgaW5kZXgsIG51bGwsIG51bGwsIHRQYXJlbnQsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChhZGp1c3RlZEluZGV4KTtcbiAgICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IG5vZGU7XG5cbiAgICAvLyBFdmVyeSBub2RlIGFkZHMgYSB2YWx1ZSB0byB0aGUgc3RhdGljIGRhdGEgYXJyYXkgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXlcbiAgICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0RGF0YS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzLCB0UGFyZW50LCBudWxsKTtcbiAgICAgIGlmICghaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuICAgICAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUpIHByZXZpb3VzVE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICBub2RlLnROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGU7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9PSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnZpZXcgPT09IHZpZXdEYXRhIHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIHNldCBob3N0IG5vZGVzIGxhdGVyKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICBjb25zdCBsVmlld0RhdGEgPSBzdGF0ZSBhcyBMVmlld0RhdGE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBsVmlld0RhdGFbSE9TVF9OT0RFXSwgJ2xWaWV3RGF0YVtIT1NUX05PREVdIHNob3VsZCBub3QgaGF2ZSBiZWVuIGluaXRpYWxpemVkJyk7XG4gICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0gPSBub2RlO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgbFZpZXdEYXRhW1RWSUVXXS5ub2RlID0gbm9kZS50Tm9kZTtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVzZXRzIHRoZSBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgcmVuZGVyZXJGYWN0b3J5ID0gcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk7XG4gICAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwsIG51bGwpO1xuICAgIGhvc3QgPSBjcmVhdGVMTm9kZShcbiAgICAgICAgLTEsIFROb2RlVHlwZS5FbGVtZW50LCBob3N0Tm9kZSwgbnVsbCwgbnVsbCxcbiAgICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgICAgcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCksIHRWaWV3LCB7fSwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICAgIHNhbml0aXplcikpO1xuICB9XG4gIGNvbnN0IGhvc3RWaWV3ID0gaG9zdC5kYXRhICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RWaWV3LCAnSG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3IGRlZmluZWQgaW4gaG9zdC5kYXRhLicpO1xuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3QsIGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gIHJldHVybiBob3N0O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXdEYXRhLCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHF1ZXJpZXM/OiBMUXVlcmllcyB8IG51bGwpOiBMVmlld05vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgY29uc3QgbFZpZXcgPVxuICAgICAgY3JlYXRlTFZpZXdEYXRhKHJlbmRlcmVyLCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBkZWNsYXJhdGlvblZpZXc7XG5cbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IHF1ZXJpZXMuY3JlYXRlVmlldygpO1xuICB9XG4gIGNvbnN0IHZpZXdOb2RlID0gY3JlYXRlTE5vZGUoLTEsIFROb2RlVHlwZS5WaWV3LCBudWxsLCBudWxsLCBudWxsLCBsVmlldyk7XG5cbiAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnROb2RlO1xuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdOb2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgcmY6IFJlbmRlckZsYWdzKTogTFZpZXdOb2RlfFxuICAgIExFbGVtZW50Tm9kZSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3RGF0YTtcbiAgaWYgKHZpZXdOb2RlLmRhdGEgIVtQQVJFTlRdID09IG51bGwgJiYgdmlld05vZGUuZGF0YSAhW0NPTlRFWFRdICYmICF0Vmlldy50ZW1wbGF0ZSkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQodmlld05vZGUuZGF0YSAhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld05vZGUuZGF0YSAhLCB2aWV3Tm9kZSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKHJmLCBjb250ZXh0KTtcbiAgICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3Tm9kZS5kYXRhICFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIGlzIGNhbGxlZCB0d2ljZSBpbiBmYWN0LCBvbmNlIGZvciBjcmVhdGlvbiBvbmx5IGFuZCB0aGVuIG9uY2UgZm9yXG4gICAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgICAgY29uc3QgaXNDcmVhdGlvbk9ubHkgPSAocmYgJiBSZW5kZXJGbGFncy5DcmVhdGUpID09PSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBpc0NyZWF0aW9uT25seSk7XG4gICAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnROb2RlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY29udGV4dCBhdCB0aGUgbGV2ZWwgc3BlY2lmaWVkIGFuZCBzYXZlcyBpdCBhcyB0aGUgZ2xvYmFsLCBjb250ZXh0Vmlld0RhdGEuXG4gKiBXaWxsIGdldCB0aGUgbmV4dCBsZXZlbCB1cCBpZiBsZXZlbCBpcyBub3Qgc3BlY2lmaWVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBzYXZlIGNvbnRleHRzIG9mIHBhcmVudCB2aWV3cyBzbyB0aGV5IGNhbiBiZSBib3VuZCBpbiBlbWJlZGRlZCB2aWV3cywgb3JcbiAqIGluIGNvbmp1bmN0aW9uIHdpdGggcmVmZXJlbmNlKCkgdG8gYmluZCBhIHJlZiBmcm9tIGEgcGFyZW50IHZpZXcuXG4gKlxuICogQHBhcmFtIGxldmVsIFRoZSByZWxhdGl2ZSBsZXZlbCBvZiB0aGUgdmlldyBmcm9tIHdoaWNoIHRvIGdyYWIgY29udGV4dCBjb21wYXJlZCB0byBjb250ZXh0VmV3RGF0YVxuICogQHJldHVybnMgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHQ8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgY29udGV4dFZpZXdEYXRhID0gd2Fsa1VwVmlld3MobGV2ZWwsIGNvbnRleHRWaWV3RGF0YSAhKTtcbiAgcmV0dXJuIGNvbnRleHRWaWV3RGF0YVtDT05URVhUXSBhcyBUO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBub2RlOiBMRWxlbWVudE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudE9yQ29udGV4dDogVCxcbiAgICB0ZW1wbGF0ZT86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIG5vZGUpO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50T3JDb250ZXh0ICEpO1xuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaChIRUFERVJfT0ZGU0VUKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ2VsZW1lbnRzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICduZy1jb250YWluZXInIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Q29udGFpbmVyTm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZSwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIG5hdGl2ZSwgdmlld0RhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExFbGVtZW50Q29udGFpbmVyTm9kZTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBjb25zdCBxdWVyaWVzID0gcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcztcbiAgcXVlcmllcyAmJiBxdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCB0Vmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCBub2RlOiBMRWxlbWVudE5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG4gIGN1cnJlbnRFbGVtZW50Tm9kZSA9IG5vZGU7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICB9XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBuYXRpdmUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IHJlbmRlcmVyO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgY3VycmVudCBub2RlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKSB7XG4gIGNvbnN0IG5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKG5vZGUudE5vZGUsIHRWaWV3LCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKTtcbiAgfVxuICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTtcbn1cblxuLyoqXG4gKiBPbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB3ZSBtYXRjaCBlYWNoIG5vZGUgYWdhaW5zdCBhdmFpbGFibGUgZGlyZWN0aXZlIHNlbGVjdG9ycyBhbmQgc2F2ZVxuICogdGhlIHJlc3VsdGluZyBkZWZzIGluIHRoZSBjb3JyZWN0IGluc3RhbnRpYXRpb24gb3JkZXIgZm9yIHN1YnNlcXVlbnQgY2hhbmdlIGRldGVjdGlvbiBydW5zXG4gKiAoc28gZGVwZW5kZW5jaWVzIGFyZSBhbHdheXMgY3JlYXRlZCBiZWZvcmUgdGhlIGRpcmVjdGl2ZXMgdGhhdCBpbmplY3QgdGhlbSkuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHRWaWV3OiBUVmlldywgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG4gIGNvbnN0IG1hdGNoZXMgPSB0Vmlldy5jdXJyZW50TWF0Y2hlcyA9IGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlKTtcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSBpICsgMTtcbiAgICAgIHJlc29sdmVEaXJlY3RpdmUoZGVmLCB2YWx1ZUluZGV4LCBtYXRjaGVzLCB0Vmlldyk7XG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKG1hdGNoZXNbdmFsdWVJbmRleF0gYXMgbnVtYmVyLCBkZWYsIGV4cG9ydHNNYXApO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy4gKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlOiBUTm9kZSk6IEN1cnJlbnRNYXRjaGVzTGlzdHxudWxsIHtcbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXTtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyAhKSkge1xuICAgICAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgICAgICAobWF0Y2hlcyB8fCAobWF0Y2hlcyA9IFtdKSkucHVzaChkZWYsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyBhcyBDdXJyZW50TWF0Y2hlc0xpc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiwgdmFsdWVJbmRleDogbnVtYmVyLCBtYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3QsXG4gICAgdFZpZXc6IFRWaWV3KTogYW55IHtcbiAgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IG51bGwpIHtcbiAgICBtYXRjaGVzW3ZhbHVlSW5kZXhdID0gQ0lSQ1VMQVI7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSgpO1xuICAgICh0Vmlldy5kaXJlY3RpdmVzIHx8ICh0Vmlldy5kaXJlY3RpdmVzID0gW10pKS5wdXNoKGRlZik7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUNyZWF0ZShtYXRjaGVzW3ZhbHVlSW5kZXhdID0gdFZpZXcuZGlyZWN0aXZlcyAhLmxlbmd0aCAtIDEsIGluc3RhbmNlLCBkZWYpO1xuICB9IGVsc2UgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IENJUkNVTEFSKSB7XG4gICAgLy8gSWYgd2UgcmV2aXNpdCB0aGlzIGRpcmVjdGl2ZSBiZWZvcmUgaXQncyByZXNvbHZlZCwgd2Uga25vdyBpdCdzIGNpcmN1bGFyXG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmLnR5cGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjaygpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2godmlld0RhdGEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBkaXJlY3RpdmUgYW5kIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gTXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMgYXJlIGdlbmVyYXRlZCB3aXRoXG4gIC8vIGluc3RydWN0aW9ucyB0aGF0IGV4cGVjdCBlbGVtZW50IGluZGljZXMgdGhhdCBhcmUgTk9UIGFkanVzdGVkIChlLmcuIGVsZW1lbnRQcm9wZXJ0eSkuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKHRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAodFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIHZpZXdEYXRhLmxlbmd0aCAtIDEgLSBIRUFERVJfT0ZGU0VUKTtcbn1cblxuLyoqIFNldHMgdGhlIGNvbnRleHQgZm9yIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdGhlIGdpdmVuIGluc3RhbmNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcoXG4gICAgaW5qZWN0b3I6IExJbmplY3RvciB8IG51bGwsIGluc3RhbmNlOiBhbnksIHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBpZiAoaW5qZWN0b3IgJiYgaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgIT0gbnVsbCkge1xuICAgIChpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3UmVmPGFueT4pLl9zZXRDb21wb25lbnRDb250ZXh0KHZpZXcsIGluc3RhbmNlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiA9IHREaXJlY3RpdmVzW2ldO1xuICAgICAgZGlyZWN0aXZlQ3JlYXRlKGksIGRlZi5mYWN0b3J5KCksIGRlZik7XG4gICAgfVxuICB9XG59XG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fCBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXdEYXRhIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSgpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID8gcHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhID0gY3JlYXRlVFZpZXcoLTEsIHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIHJldHVybiB7XG4gICAgaWQ6IHZpZXdJbmRleCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IEhFQURFUl9GSUxMRVIuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld0RhdGFcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogLTEsICAgICAgICAvLyBTZXQgaW4gaW5pdEJpbmRpbmdzKClcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKFxuICAgICAgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyLCBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICB0Vmlldy5kaXJlY3RpdmVzID0gW2RlZl07XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlIGFzIFJFbGVtZW50O1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKHZpZXdEYXRhLCBsaXN0ZW5lckZuKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obmF0aXZlLCBldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwRm4odmlld0RhdGEsIGNsZWFudXBGbik7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdCh2aWV3RGF0YSwgbGlzdGVuZXJGbik7XG4gICAgbmF0aXZlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIGNvbnN0IGNsZWFudXBJbnN0YW5jZXMgPSBnZXRDbGVhbnVwKHZpZXdEYXRhKTtcbiAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3RGF0YSkucHVzaChcbiAgICAgICAgICBldmVudE5hbWUsIG5vZGUudE5vZGUuaW5kZXgsIGNsZWFudXBJbnN0YW5jZXMgIS5sZW5ndGggLSAxLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSBub2RlLnROb2RlO1xuICBpZiAodE5vZGUub3V0cHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gaWYgd2UgY3JlYXRlIFROb2RlIGhlcmUsIGlucHV0cyBtdXN0IGJlIHVuZGVmaW5lZCBzbyB3ZSBrbm93IHRoZXkgc3RpbGwgbmVlZCB0byBiZVxuICAgIC8vIGNoZWNrZWRcbiAgICB0Tm9kZS5vdXRwdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gdmlld0RhdGE7XG4gIGdldENsZWFudXAodmlldykucHVzaChjb250ZXh0KTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4sIHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlld0RhdGEsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgYXMgTEVsZW1lbnROb2RlO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBxdWVyaWVzID0gcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcztcbiAgcXVlcmllcyAmJiBxdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIGN1cnJlbnRFbGVtZW50Tm9kZSA9IG51bGw7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gbG9hZEVsZW1lbnQoaW5kZXgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPSBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBwcm9wZXJ0eSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgQElucHV0cyBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IG5vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGU7XG4gIC8vIGlmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWRcbiAgaWYgKHROb2RlICYmIHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsLFxuICAgIGRldGFjaGVkOiBudWxsLFxuICAgIHN0eWxpbmdUZW1wbGF0ZTogbnVsbCxcbiAgICBwcm9qZWN0aW9uOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxpbmdJbmRleCwgdmFsdWUgPyB0cnVlIDogZmFsc2UpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBhbnkgaW5saW5lIHN0eWxlIHZhbHVlcyB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byBhcHBseSBhbGwgc3R5bGluZ1xuICogKGUuZy4gYHN0eWxlPVwiLi4uXCJgKSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuIFRoaXMgaXMgYWxzbyB3aGVyZSB0aGUgcHJvdmlkZWQgaW5kZXhcbiAqIHZhbHVlIGlzIGFsbG9jYXRlZCBmb3IgdGhlIHN0eWxpbmcgZGV0YWlscyBmb3IgaXRzIGNvcnJlc3BvbmRpbmcgZWxlbWVudCAodGhlIGVsZW1lbnRcbiAqIGluZGV4IGlzIHRoZSBwcmV2aW91cyBpbmRleCB2YWx1ZSBmcm9tIHRoaXMgb25lKS5cbiAqXG4gKiAoTm90ZSB0aGlzIGZ1bmN0aW9uIGNhbGxzIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4pXG4gKlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCB2YWx1ZSB3aGljaCB3aWxsIGJlIGFsbG9jYXRlZCB0byBzdG9yZSBzdHlsaW5nIGRhdGEgZm9yIHRoZSBlbGVtZW50LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzRGVjbGFyYXRpb25zIEEga2V5L3ZhbHVlIGFycmF5IG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IGNsYXNzZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW2NsYXNzXWApIG9yIHNpbmd1bGFyIChgW2NsYXNzLm5hbWVkXWApXG4gKiAgIGJpbmRpbmdzLiBJZiBhIGNsYXNzIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZSBtYXRjaGluZyBpbml0aWFsXG4gKiAgIGNsYXNzIHZhbHVlIHRoYXQgYXJlIHBhc3NlZCBpbiBoZXJlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaWYgbWF0Y2hlZCkuXG4gKiBAcGFyYW0gc3R5bGVEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZWxlbWVudC5cbiAqICAgRWFjaCBpbmRpdmlkdWFsIHN0eWxlIHdpbGwgYmUgdXNlZCBvbiB0aGUgZWxlbWVudCBhcyBsb25nIGFzIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gKiAgIGJ5IGFueSBzdHlsZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW3N0eWxlXWApIG9yIHNpbmd1bGFyIChgW3N0eWxlLnByb3BdYClcbiAqICAgYmluZGluZ3MuIElmIGEgc3R5bGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBudWxsIHRoZW4gdGhlIGluaXRpYWwgc3R5bGluZ1xuICogICB2YWx1ZXMgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgKGlmIHByb3ZpZGVkKVxuICogICB0byBzYW5pdGl6ZSB0aGUgYW55IENTUyBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZzxUPihcbiAgICBjbGFzc0RlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50Tm9kZSAhO1xuICBjb25zdCB0Tm9kZSA9IGxFbGVtZW50LnROb2RlO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIC8vIGluaXRpYWxpemUgdGhlIHN0eWxpbmcgdGVtcGxhdGUuXG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID1cbiAgICAgICAgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZShjbGFzc0RlY2xhcmF0aW9ucywgc3R5bGVEZWNsYXJhdGlvbnMsIHN0eWxlU2FuaXRpemVyKTtcbiAgfVxuICBpZiAoc3R5bGVEZWNsYXJhdGlvbnMgJiYgc3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoIHx8XG4gICAgICBjbGFzc0RlY2xhcmF0aW9ucyAmJiBjbGFzc0RlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICBlbGVtZW50U3R5bGluZ0FwcGx5KHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6ICdyZWQnIFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICovXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyKTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3R5bGluZ0NvbnRleHQgPSBsb2FkPFN0eWxpbmdDb250ZXh0PihpbmRleCk7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdHlsaW5nQ29udGV4dCkpIHtcbiAgICBjb25zdCBsRWxlbWVudCA9IHN0eWxpbmdDb250ZXh0IGFzIGFueSBhcyBMRWxlbWVudE5vZGU7XG4gICAgY29uc3QgdE5vZGUgPSBsRWxlbWVudC50Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZCh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsICdnZXRTdHlsaW5nQ29udGV4dCgpIGNhbGxlZCBiZWZvcmUgZWxlbWVudFN0eWxpbmcoKScpO1xuICAgIHN0eWxpbmdDb250ZXh0ID0gdmlld0RhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9XG4gICAgICAgIGFsbG9jU3R5bGluZ0NvbnRleHQobEVsZW1lbnQsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhKTtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0NvbnRleHQ7XG59XG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50IHdoaWNoIGhhdmUgYmVlbiBxdWV1ZWQgYnkgYW55IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIG9uY2Ugb25lIG9yIG1vcmUgYGVsZW1lbnRTdHlsZWAgYW5kL29yIGBlbGVtZW50U3R5bGVQcm9wYFxuICogaGF2ZSBiZWVuIGlzc3VlZCBhZ2FpbnN0IHRoZSBlbGVtZW50LiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyBkZXRlcm1pbmUgaWYgYW55IHN0eWxlcyBoYXZlXG4gKiBjaGFuZ2VkIGFuZCB3aWxsIHRoZW4gc2tpcCB0aGUgb3BlcmF0aW9uIGlmIHRoZXJlIGlzIG5vdGhpbmcgbmV3IHRvIHJlbmRlci5cbiAqXG4gKiBPbmNlIGNhbGxlZCB0aGVuIGFsbCBxdWV1ZWQgc3R5bGVzIHdpbGwgYmUgZmx1c2hlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdGhhdCB3aWxsIGJlIHJlbmRlcmVkLlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseTxUPihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHJlbmRlckVsZW1lbnRTdHlsZXMoZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgpLCByZW5kZXJlcik7XG59XG5cbi8qKlxuICogUXVldWUgYSBnaXZlbiBzdHlsZSB0byBiZSByZW5kZXJlZCBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBgbnVsbGAgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYGVsZW1lbnRTdHlsZWAgb3IgYW55IHN0eWxlcyB0aGF0IGFyZSBwcmVzZW50XG4gKiBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgKHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0byBjaGFuZ2UgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgcHJvcGVydHkgb24gdGhpcyBlbGVtZW50LiAoTW9ub3RvbmljYWxseSBpbmNyZWFzaW5nLilcbiAqIEBwYXJhbSBzdHlsZU5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00gdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAobnVsbCB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZVByb3A8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyk6IHZvaWQge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gc3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgdXBkYXRlRWxlbWVudFN0eWxlUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQpO1xufVxuXG4vKipcbiAqIFF1ZXVlIGEga2V5L3ZhbHVlIG1hcCBvZiBzdHlsZXMgdG8gYmUgcmVuZGVyZWQgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtzdHlsZV09XCJleHBcImAgdXNhZ2UuIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvXG4gKiB0aGUgRWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSBwbGFjZWQgd2l0aCByZXNwZWN0IHRvIGFueSBzdHlsZXMgc2V0IHdpdGggYGVsZW1lbnRTdHlsZVByb3BgLlxuICogSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGBudWxsYCB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgKHVubGVzcyB0aGUgc2FtZVxuICogc3R5bGUgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIHVzaW5nIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IG51bGwpOiB2b2lkIHtcbiAgdXBkYXRlU3R5bGluZ01hcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIGNsYXNzZXMsIHN0eWxlcyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFRleHRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0Tm9kZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHROb2RlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCB0ZXh0Tm9kZSwgdmlld0RhdGEpO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0ZXh0IG5vZGUgd2l0aCBiaW5kaW5nXG4gKiBCaW5kaW5ncyBzaG91bGQgYmUgaGFuZGxlZCBleHRlcm5hbGx5IHdpdGggdGhlIHByb3BlciBpbnRlcnBvbGF0aW9uKDEtOCkgbWV0aG9kXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5LlxuICogQHBhcmFtIHZhbHVlIFN0cmluZ2lmaWVkIHZhbHVlIHRvIHdyaXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmc8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBjb25zdCBleGlzdGluZ05vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgYW55IGFzIExUZXh0Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChleGlzdGluZ05vZGUsICdMTm9kZSBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChleGlzdGluZ05vZGUubmF0aXZlLCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShleGlzdGluZ05vZGUubmF0aXZlLCBzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdOb2RlLm5hdGl2ZS50ZXh0Q29udGVudCA9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRGlyZWN0aXZlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBhIGRpcmVjdGl2ZSBhbmQgdGhlaXIgYXNzb2NpYXRlZCBjb250ZW50IHF1ZXJpZXMuXG4gKlxuICogTk9URTogZGlyZWN0aXZlcyBjYW4gYmUgY3JlYXRlZCBpbiBvcmRlciBvdGhlciB0aGFuIHRoZSBpbmRleCBvcmRlci4gVGhleSBjYW4gYWxzb1xuICogICAgICAgYmUgcmV0cmlldmVkIGJlZm9yZSB0aGV5IGFyZSBjcmVhdGVkIGluIHdoaWNoIGNhc2UgdGhlIHZhbHVlIHdpbGwgYmUgbnVsbC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIFRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIERpcmVjdGl2ZURlZiBvYmplY3Qgd2hpY2ggY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyLCBkaXJlY3RpdmU6IFQsXG4gICAgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pOiBUIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLCAncHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUnKTtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcblxuICBjb25zdCBpc0NvbXBvbmVudCA9IChkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pLnRlbXBsYXRlO1xuICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICBhZGRDb21wb25lbnRMb2dpYyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+KTtcbiAgfVxuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgcXVldWVJbml0SG9va3MoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmVEZWYub25Jbml0LCBkaXJlY3RpdmVEZWYuZG9DaGVjaywgdFZpZXcpO1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZi5ob3N0QmluZGluZ3MpIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJlY3RpdmVEZWZJZHgpO1xuICB9XG5cbiAgaWYgKHROb2RlICYmIHROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGRpcmVjdGl2ZURlZklkeCwgaW5zdGFuY2UsIGRpcmVjdGl2ZURlZi5pbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMoKTtcbiAgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmluZGV4IGFzIG51bWJlcixcbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIocHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIGFzIFJFbGVtZW50LCBkZWYucmVuZGVyZXJUeXBlKSxcbiAgICAgICAgICB0VmlldywgaW5zdGFuY2UsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICBnZXRDdXJyZW50U2FuaXRpemVyKCkpKTtcblxuICAvLyBXZSBuZWVkIHRvIHNldCB0aGUgaG9zdCBub2RlL2RhdGEgaGVyZSBiZWNhdXNlIHdoZW4gdGhlIGNvbXBvbmVudCBMTm9kZSB3YXMgY3JlYXRlZCxcbiAgLy8gd2UgZGlkbid0IHlldCBrbm93IGl0IHdhcyBhIGNvbXBvbmVudCAoanVzdCBhbiBlbGVtZW50KS5cbiAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFze2RhdGE6IExWaWV3RGF0YX0pLmRhdGEgPSBjb21wb25lbnRWaWV3O1xuICAoY29tcG9uZW50VmlldyBhcyBMVmlld0RhdGEpW0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMRWxlbWVudE5vZGU7XG5cbiAgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhwcmV2aW91c09yUGFyZW50Tm9kZS5ub2RlSW5qZWN0b3IsIGluc3RhbmNlLCBjb21wb25lbnRWaWV3KTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjaygpO1xufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgIGRpcmVjdGl2ZSwgTkdfSE9TVF9TWU1CT0wsIHtlbnVtZXJhYmxlOiBmYWxzZSwgdmFsdWU6IHByZXZpb3VzT3JQYXJlbnROb2RlfSk7XG5cbiAgaWYgKGRpcmVjdGl2ZXMgPT0gbnVsbCkgdmlld0RhdGFbRElSRUNUSVZFU10gPSBkaXJlY3RpdmVzID0gW107XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFOZXh0KGluZGV4LCBkaXJlY3RpdmVzKTtcbiAgZGlyZWN0aXZlc1tpbmRleF0gPSBkaXJlY3RpdmU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MgPVxuICAgICAgICAgIGluZGV4IDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0IHwgZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50IHwgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT25seSBuZWVkIHRvIGJ1bXAgdGhlIHNpemUgd2hlbiBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWRcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaywgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzKys7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpUHVibGljID0gZGlyZWN0aXZlRGVmICEuZGlQdWJsaWM7XG4gICAgaWYgKGRpUHVibGljKSBkaVB1YmxpYyhkaXJlY3RpdmVEZWYgISk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMoXG4gICAgICAgIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZSwgZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmc7fSwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW2luaXRpYWxJbnB1dHNbaV1dID0gaW5pdGlhbElucHV0c1tpICsgMV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBwYXJlbnRMTm9kZSB0aGUgTE5vZGUgaW4gd2hpY2ggdGhlIGNvbnRhaW5lcidzIGNvbnRlbnQgd2lsbCBiZSByZW5kZXJlZFxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIHBhcmVudExOb2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwYXJlbnRMTm9kZSwgJ2NvbnRhaW5lcnMgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbiAgbGV0IHJlbmRlclBhcmVudCA9IGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50TE5vZGUsIGN1cnJlbnRWaWV3KSA/XG4gICAgICBwYXJlbnRMTm9kZSBhcyBMRWxlbWVudE5vZGUgfCBMVmlld05vZGUgOlxuICAgICAgbnVsbDtcbiAgaWYgKHJlbmRlclBhcmVudCAmJiByZW5kZXJQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICByZW5kZXJQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShyZW5kZXJQYXJlbnQgYXMgTFZpZXdOb2RlKSAhLmRhdGFbUkVOREVSX1BBUkVOVF07XG4gIH1cbiAgcmV0dXJuIFtcbiAgICBpc0ZvclZpZXdDb250YWluZXJSZWYgPyBudWxsIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3c1xuICAgIHJlbmRlclBhcmVudCBhcyBMRWxlbWVudE5vZGVcbiAgXTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlLlxuICpcbiAqIE9ubHkgYExWaWV3Tm9kZXNgIGNhbiBnbyBpbnRvIGBMQ29udGFpbmVyTm9kZXNgLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlIE9wdGlvbmFsIGlubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJzIGF0dGFjaGVkIHRvIHRoZSBjb250YWluZXIsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgdGFnTmFtZT86IHN0cmluZyB8IG51bGwsIGF0dHJzPzogVEF0dHJpYnV0ZXMsXG4gICAgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnY29udGFpbmVyIG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCBjdXJyZW50UGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhO1xuICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihjdXJyZW50UGFyZW50LCB2aWV3RGF0YSk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgY29tbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IG5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5Db250YWluZXIsIGNvbW1lbnQsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbENvbnRhaW5lcik7XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBjb21tZW50LCB2aWV3RGF0YSk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbm9kZS50Tm9kZS50Vmlld3MgPSB0ZW1wbGF0ZSA/XG4gICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZSwgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCkgOlxuICAgICAgICBbXTtcbiAgfVxuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKHZpZXdEYXRhLCBpbmRleCArIEhFQURFUl9PRkZTRVQsIG5vZGUuZGF0YSk7XG5cbiAgY29uc3QgcXVlcmllcyA9IG5vZGUucXVlcmllcztcbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gcXVlcmllcy5jb250YWluZXIoKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobG9jYWxSZWZzKTtcblxuICBpc1BhcmVudCA9IGZhbHNlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBxdWVyaWVzICYmIHF1ZXJpZXMuYWRkTm9kZShub2RlKTsgIC8vIGNoZWNrIGlmIGEgZ2l2ZW4gY29udGFpbmVyIG5vZGUgbWF0Y2hlc1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKG5vZGUudE5vZGUuZmxhZ3MsIHRWaWV3KTtcbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBMTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGFbQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAvLyBXZSBuZWVkIHRvIGV4ZWN1dGUgaW5pdCBob29rcyBoZXJlIHNvIG5nT25Jbml0IGhvb2tzIGFyZSBjYWxsZWQgaW4gdG9wIGxldmVsIHZpZXdzXG4gICAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXJOb2RlLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyTm9kZSBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIFZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgITtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBjb250YWluZXIgPSBwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IG5leHRJbmRleCA9IGNvbnRhaW5lci5kYXRhW0FDVElWRV9JTkRFWF0gITtcblxuICAvLyByZW1vdmUgZXh0cmEgdmlld3MgYXQgdGhlIGVuZCBvZiB0aGUgY29udGFpbmVyXG4gIHdoaWxlIChuZXh0SW5kZXggPCBjb250YWluZXIuZGF0YVtWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBsVmlld05vZGUgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBsVmlld05vZGUuZGF0YTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBsVmlld05vZGUsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLCBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyTm9kZSB3aGVyZSB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gc3RhcnRJZHggc3RhcnRpbmcgaW5kZXggaW4gdGhlIHZpZXdzIGFycmF5IHRvIHNlYXJjaCBmcm9tXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgZXhhY3QgdmlldyBibG9jayBpZCB0byBsb29rIGZvclxuICogQHJldHVybnMgaW5kZXggb2YgYSBmb3VuZCB2aWV3IG9yIC0xIGlmIG5vdCBmb3VuZFxuICovXG5mdW5jdGlvbiBzY2FuRm9yVmlldyhcbiAgICBjb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlciwgdmlld0Jsb2NrSWQ6IG51bWJlcik6IExWaWV3Tm9kZXxudWxsIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXS5kYXRhW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoIGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBjb250YWluZXIgPVxuICAgICAgKGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkpIGFzIExDb250YWluZXJOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lci5kYXRhO1xuICBsZXQgdmlld05vZGU6IExWaWV3Tm9kZXxudWxsID0gc2NhbkZvclZpZXcoY29udGFpbmVyLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3Tm9kZSkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gdmlld05vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIGVudGVyVmlldyh2aWV3Tm9kZS5kYXRhLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICBjb25zdCBuZXdWaWV3ID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlciwgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb250YWluZXIpLCBudWxsLCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuXG4gICAgaWYgKGxDb250YWluZXJbUVVFUklFU10pIHtcbiAgICAgIG5ld1ZpZXdbUVVFUklFU10gPSBsQ29udGFpbmVyW1FVRVJJRVNdICEuY3JlYXRlVmlldygpO1xuICAgIH1cblxuICAgIGVudGVyVmlldyhcbiAgICAgICAgbmV3Vmlldywgdmlld05vZGUgPSBjcmVhdGVMTm9kZSh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIG5ld1ZpZXcpKTtcbiAgfVxuICBpZiAoY29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyLCB2aWV3Tm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISsrO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPVxuICAgICAgICBjcmVhdGVUVmlldyh2aWV3SW5kZXgsIG51bGwsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG4gIHJldHVybiBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XTtcbn1cblxuLyoqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdFbmQoKTogdm9pZCB7XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3RGF0YVtIT1NUX05PREVdIGFzIExWaWV3Tm9kZTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc1BhcmVudCwgZmFsc2UsICdpc1BhcmVudCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gYWRqdXN0ZWRFbGVtZW50SW5kZXggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdEYXRhW10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaDxUPihhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGVsZW1lbnQgPSB2aWV3RGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoZWxlbWVudC5kYXRhLCBgQ29tcG9uZW50J3MgaG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3RGF0YSBhdHRhY2hlZC5gKTtcbiAgY29uc3QgaG9zdFZpZXcgPSBlbGVtZW50LmRhdGEgITtcblxuICAvLyBPbmx5IGF0dGFjaGVkIENoZWNrQWx3YXlzIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICh2aWV3QXR0YWNoZWQoaG9zdFZpZXcpICYmIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdFZpZXcsIGVsZW1lbnQsIGhvc3RWaWV3W0NPTlRFWFRdKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWQodmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBjb21wb25lbnROb2RlOiBMRWxlbWVudE5vZGUgPSBmaW5kQ29tcG9uZW50SG9zdCh2aWV3RGF0YSk7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcERhdGE6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobm9PZk5vZGVCdWNrZXRzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcERhdGEuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudE5vZGUudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldEluZGV4ID1cbiAgICAgICAgICBzZWxlY3RvcnMgPyBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKSA6IDA7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG5cbiAgICAgIGlmICh0YWlsc1tidWNrZXRJbmRleF0pIHtcbiAgICAgICAgdGFpbHNbYnVja2V0SW5kZXhdICEubmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcERhdGFbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IExQcm9qZWN0aW9uTm9kZVtdID0gW107XG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24obm9kZUluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKG5vZGVJbmRleCwgVE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIG51bGwsIGF0dHJzIHx8IG51bGwsIG51bGwpO1xuXG4gIC8vIFdlIGNhbid0IHVzZSB2aWV3RGF0YVtIT1NUX05PREVdIGJlY2F1c2UgcHJvamVjdGlvbiBub2RlcyBjYW4gYmUgbmVzdGVkIGluIGVtYmVkZGVkIHZpZXdzLlxuICBpZiAobm9kZS50Tm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSBub2RlLnROb2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIHN0b3JlZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG5cbiAgaWYgKGNhbkluc2VydE5hdGl2ZU5vZGUocGFyZW50LCB2aWV3RGF0YSkpIHtcbiAgICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3Qodmlld0RhdGEpO1xuICAgIGxldCBub2RlVG9Qcm9qZWN0ID0gKGNvbXBvbmVudE5vZGUudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3NlbGVjdG9ySW5kZXhdO1xuICAgIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Tm9kZS52aWV3O1xuICAgIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG4gICAgbGV0IGdyYW5kcGFyZW50OiBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCByZW5kZXJQYXJlbnQgPSBwYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICAoZ3JhbmRwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShwYXJlbnQpIGFzIExDb250YWluZXJOb2RlKSAmJlxuICAgICAgICAgICAgZ3JhbmRwYXJlbnQuZGF0YVtSRU5ERVJfUEFSRU5UXSAhIDpcbiAgICAgICAgcGFyZW50IGFzIExFbGVtZW50Tm9kZTtcblxuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAvLyBUaGlzIG5vZGUgaXMgcmUtcHJvamVjdGVkLCBzbyB3ZSBtdXN0IGdvIHVwIHRoZSB0cmVlIHRvIGdldCBpdHMgcHJvamVjdGVkIG5vZGVzLlxuICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGZpbmRDb21wb25lbnRIb3N0KHByb2plY3RlZFZpZXcpO1xuICAgICAgICBjb25zdCBmaXJzdFByb2plY3RlZE5vZGUgPSAoY3VycmVudENvbXBvbmVudEhvc3QudE5vZGUucHJvamVjdGlvbiBhcyhcbiAgICAgICAgICAgIFROb2RlIHwgbnVsbClbXSlbbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgICAgaWYgKGZpcnN0UHJvamVjdGVkTm9kZSkge1xuICAgICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHByb2plY3RlZFZpZXdbbm9kZVRvUHJvamVjdC5pbmRleF07XG4gICAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgICBwcm9qZWN0ZWRWaWV3ID0gY3VycmVudENvbXBvbmVudEhvc3QudmlldztcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgbE5vZGUgPSBwcm9qZWN0ZWRWaWV3W25vZGVUb1Byb2plY3QuaW5kZXhdO1xuICAgICAgICBsTm9kZS50Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKFxuICAgICAgICAgICAgbE5vZGUgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUsIHBhcmVudCwgdmlld0RhdGEsIHJlbmRlclBhcmVudCk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGFyZSBmaW5pc2hlZCB3aXRoIGEgbGlzdCBvZiByZS1wcm9qZWN0ZWQgbm9kZXMsIHdlIG5lZWQgdG8gZ2V0XG4gICAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgICBpZiAobm9kZVRvUHJvamVjdC5uZXh0ID09PSBudWxsICYmIHByb2plY3RlZFZpZXcgIT09IGNvbXBvbmVudE5vZGUudmlldykge1xuICAgICAgICAvLyBtb3ZlIGRvd24gaW50byB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHdlJ3JlIHByb2plY3RpbmcgcmlnaHQgbm93XG4gICAgICAgIGNvbnN0IGxOb2RlID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dO1xuICAgICAgICBub2RlVG9Qcm9qZWN0ID0gbE5vZGUudE5vZGU7XG4gICAgICAgIHByb2plY3RlZFZpZXcgPSBsTm9kZS52aWV3O1xuICAgICAgfVxuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QubmV4dDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3aGVyZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld0RhdGFbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXdEYXRhfExDb250YWluZXI+KFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGFkanVzdGVkSG9zdEluZGV4OiBudW1iZXIsIHN0YXRlOiBUKTogVCB7XG4gIGlmIChjdXJyZW50Vmlld1tUQUlMXSkge1xuICAgIGN1cnJlbnRWaWV3W1RBSUxdICFbTkVYVF0gPSBzdGF0ZTtcbiAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmNoaWxkSW5kZXggPSBhZGp1c3RlZEhvc3RJbmRleDtcbiAgfVxuICBjdXJyZW50Vmlld1tUQUlMXSA9IHN0YXRlO1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXdEYXRhIGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGU6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAvLyBCZWNhdXNlIGRhdGEgZmxvd3MgZG93biB0aGUgY29tcG9uZW50IHRyZWUsIGFuY2VzdG9ycyBkbyBub3QgbmVlZCB0byBiZSBtYXJrZWQgZGlydHlcbiAgaWYgKG5vZGUuZGF0YSAmJiAhKG5vZGUuZGF0YVtGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIG5vZGUuZGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHNvIGl0cyBob3N0IHZpZXcgYW5kIGl0cyBhbmNlc3RvciB2aWV3cyB3aWxsIGJlIG1hcmtlZCBkaXJ0eVxuICogd2hlbmV2ZXIgdGhlIGV2ZW50IGZpcmVzLiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBPblB1c2ggY29tcG9uZW50cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKFxuICAgIHZpZXc6IExWaWV3RGF0YSwgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IChlOiBFdmVudCkgPT4gYW55IHtcbiAgcmV0dXJuIGZ1bmN0aW9uKGU6IGFueSkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgcmV0dXJuIGxpc3RlbmVyRm4oZSk7XG4gIH07XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgc28gaXRzIGhvc3QgdmlldyBhbmQgaXRzIGFuY2VzdG9yIHZpZXdzIHdpbGwgYmUgbWFya2VkIGRpcnR5XG4gKiB3aGVuZXZlciB0aGUgZXZlbnQgZmlyZXMuIEFsc28gd3JhcHMgd2l0aCBwcmV2ZW50RGVmYXVsdCBiZWhhdmlvci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQoXG4gICAgdmlldzogTFZpZXdEYXRhLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9tYXJrVmlld0RpcnR5KGU6IEV2ZW50KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICBpZiAobGlzdGVuZXJGbihlKSA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3RGF0YSA9IHZpZXc7XG5cbiAgd2hpbGUgKGN1cnJlbnRWaWV3W1BBUkVOVF0gIT0gbnVsbCkge1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50Vmlld1tDT05URVhUXSwgJ3Jvb3RDb250ZXh0Jyk7XG4gIHNjaGVkdWxlVGljayhjdXJyZW50Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgaWYgKHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICByZXMgIShudWxsKTtcbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUocm9vdENvbXBvbmVudCk7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0Tm9kZS5kYXRhLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXcnKTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3ROb2RlLCBnZXRSb290Vmlldyhyb290Q29tcG9uZW50KSwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3RGF0YWAgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld0RhdGFgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnQ6IGFueSk6IExWaWV3RGF0YSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBsZXQgbFZpZXdEYXRhID0gbEVsZW1lbnROb2RlLnZpZXc7XG4gIHdoaWxlIChsVmlld0RhdGFbUEFSRU5UXSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGhvc3ROb2RlLmRhdGEsICdDb21wb25lbnQgaG9zdCBub2RlIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhbiBMVmlld0RhdGEgaW5zdGFuY2UuJyk7XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSwgaG9zdE5vZGUsIGNvbXBvbmVudCk7XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld0RhdGFbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGEpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICBob3N0VmlldzogTFZpZXdEYXRhLCBob3N0Tm9kZTogTEVsZW1lbnROb2RlLCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdE5vZGUpO1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IHRlbXBsYXRlID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IGhvc3RUVmlldy52aWV3UXVlcnk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXdbRkxBR1NdLCBjb21wb25lbnQpO1xuICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgdXBkYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld1F1ZXJ5PFQ+KFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBmbGFnczogTFZpZXdGbGFncywgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkgJiYgKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpKSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3UXVlcnk8VD4odmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5KSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLlVwZGF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbWFya1ZpZXdEaXJ0eShsRWxlbWVudE5vZGUudmlldyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogIEluaXRpYWxpemVzIHRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4LiBXaWxsIGdldCBpbmxpbmVkLlxuICpcbiAqICBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZyByZWxhdGVkIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogIChpZSBgYmluZCgpYCwgYGludGVycG9sYXRpb25YKClgLCBgcHVyZUZ1bmN0aW9uWCgpYClcbiAqL1xuZnVuY3Rpb24gaW5pdEJpbmRpbmdzKCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLFxuICAgICAgICAgICAgICAgICAgICdCaW5kaW5nIGluZGV4IHNob3VsZCBub3QgeWV0IGJlIHNldCAnICsgdmlld0RhdGFbQklORElOR19JTkRFWF0pO1xuICBpZiAodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggPT09IC0xKSB7XG4gICAgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggPSB2aWV3RGF0YS5sZW5ndGg7XG4gIH1cbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgc2luZ2xlIHZhbHVlIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGRpZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmQ8VD4odmFsdWU6IFQpOiBUfE5PX0NIQU5HRSB7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZCh2YWx1ZSkgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBSZXNlcnZlcyBzbG90cyBmb3IgcHVyZSBmdW5jdGlvbnMgKGBwdXJlRnVuY3Rpb25YYCBpbnN0cnVjdGlvbnMpXG4gKlxuICogQmluZGluZ3MgZm9yIHB1cmUgZnVuY3Rpb25zIGFyZSBzdG9yZWQgYWZ0ZXIgdGhlIExOb2RlcyBpbiB0aGUgZGF0YSBhcnJheSBidXQgYmVmb3JlIHRoZSBiaW5kaW5nLlxuICpcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgfCAgTE5vZGVzIC4uLiB8IHB1cmUgZnVuY3Rpb24gYmluZGluZ3MgfCByZWd1bGFyIGJpbmRpbmdzIC8gaW50ZXJwb2xhdGlvbnMgfFxuICogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBeXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXhcbiAqXG4gKiBQdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBhcmUgZ2l2ZW4gYW4gb2Zmc2V0IGZyb20gVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguXG4gKiBTdWJ0cmFjdGluZyB0aGUgb2Zmc2V0IGZyb20gVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggZ2l2ZXMgdGhlIGZpcnN0IGluZGV4IHdoZXJlIHRoZSBiaW5kaW5nc1xuICogYXJlIHN0b3JlZC5cbiAqXG4gKiBOT1RFOiByZXNlcnZlU2xvdHMgaW5zdHJ1Y3Rpb25zIGFyZSBvbmx5IGV2ZXIgYWxsb3dlZCBhdCB0aGUgdmVyeSBlbmQgb2YgdGhlIGNyZWF0aW9uIGJsb2NrXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNlcnZlU2xvdHMobnVtU2xvdHM6IG51bWJlcikge1xuICAvLyBJbml0IHRoZSBzbG90cyB3aXRoIGEgdW5pcXVlIGBOT19DSEFOR0VgIHZhbHVlIHNvIHRoYXQgdGhlIGZpcnN0IGNoYW5nZSBpcyBhbHdheXMgZGV0ZWN0ZWRcbiAgLy8gd2hldGhlciBpdCBoYXBwZW5zIG9yIG5vdCBkdXJpbmcgdGhlIGZpcnN0IGNoYW5nZSBkZXRlY3Rpb24gcGFzcyAtIHB1cmUgZnVuY3Rpb25zIGNoZWNrc1xuICAvLyBtaWdodCBiZSBza2lwcGVkIHdoZW4gc2hvcnQtY2lyY3VpdGVkLlxuICB2aWV3RGF0YS5sZW5ndGggKz0gbnVtU2xvdHM7XG4gIHZpZXdEYXRhLmZpbGwoTk9fQ0hBTkdFLCAtbnVtU2xvdHMpO1xuICAvLyBXZSBuZWVkIHRvIGluaXRpYWxpemUgdGhlIGJpbmRpbmcgaW4gY2FzZSBhIGBwdXJlRnVuY3Rpb25YYCBraW5kIG9mIGJpbmRpbmcgaW5zdHJ1Y3Rpb24gaXNcbiAgLy8gY2FsbGVkIGZpcnN0IGluIHRoZSB1cGRhdGUgc2VjdGlvbi5cbiAgaW5pdEJpbmRpbmdzKCk7XG59XG5cbi8qKlxuICogU2V0cyB1cCB0aGUgYmluZGluZyBpbmRleCBiZWZvcmUgZXhlY3V0aW5nIGFueSBgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoZSBpbmRleCBtdXN0IGJlIHJlc3RvcmVkIGFmdGVyIHRoZSBwdXJlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkXG4gKlxuICoge0BsaW5rIHJlc2VydmVTbG90c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChvZmZzZXQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGN1cnJlbnRTbG90ID0gdmlld0RhdGFbQklORElOR19JTkRFWF07XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSBvZmZzZXQ7XG4gIHJldHVybiBjdXJyZW50U2xvdDtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyB0aGUgYmluZGluZyBpbmRleCB0byB0aGUgZ2l2ZW4gdmFsdWUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBpcyB0eXBpY2FsbHkgdXNlZCB0byByZXN0b3JlIHRoZSBpbmRleCBhZnRlciBhIGBwdXJlRnVuY3Rpb25YYCBoYXNcbiAqIGJlZW4gZXhlY3V0ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXN0b3JlQmluZGluZ0luZGV4KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBpbmRleDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuXG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gc3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MCk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgICAgICAgICAgICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY0KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY2KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgaTYgKyBzdHJpbmdpZnkodjcpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gIH1cbiAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBsb2NhbCByZWZlcmVuY2UgZnJvbSB0aGUgY3VycmVudCBjb250ZXh0Vmlld0RhdGEuXG4gKlxuICogSWYgdGhlIHJlZmVyZW5jZSB0byByZXRyaWV2ZSBpcyBpbiBhIHBhcmVudCB2aWV3LCB0aGlzIGluc3RydWN0aW9uIGlzIHVzZWQgaW4gY29uanVuY3Rpb25cbiAqIHdpdGggYSBuZXh0Q29udGV4dCgpIGNhbGwsIHdoaWNoIHdhbGtzIHVwIHRoZSB0cmVlIGFuZCB1cGRhdGVzIHRoZSBjb250ZXh0Vmlld0RhdGEgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgbG9jYWwgcmVmIGluIGNvbnRleHRWaWV3RGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZmVyZW5jZTxUPihpbmRleDogbnVtYmVyKSB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIGNvbnRleHRWaWV3RGF0YSk7XG59XG5cbmZ1bmN0aW9uIHdhbGtVcFZpZXdzKG5lc3RpbmdMZXZlbDogbnVtYmVyLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKTogTFZpZXdEYXRhIHtcbiAgd2hpbGUgKG5lc3RpbmdMZXZlbCA+IDApIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddLFxuICAgICAgICAgICAgICAgICAgICAgJ0RlY2xhcmF0aW9uIHZpZXcgc2hvdWxkIGJlIGRlZmluZWQgaWYgbmVzdGluZyBsZXZlbCBpcyBncmVhdGVyIHRoYW4gMC4nKTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgbmVzdGluZ0xldmVsLS07XG4gIH1cbiAgcmV0dXJuIGN1cnJlbnRWaWV3O1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSB0aGUgYGRpcmVjdGl2ZXNgIGFycmF5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWREaXJlY3RpdmU8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVzLCAnRGlyZWN0aXZlcyBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgZGlyLicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gIHJldHVybiBkaXJlY3RpdmVzICFbaW5kZXhdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFF1ZXJ5TGlzdDxUPihxdWVyeUxpc3RJZHg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10sXG4gICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQgUXVlcnlMaXN0IGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBxdWVyeS4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHF1ZXJ5TGlzdElkeCwgdmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSAhKTtcblxuICByZXR1cm4gdmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSAhW3F1ZXJ5TGlzdElkeF07XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGN1cnJlbnQgYHZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihpbmRleCwgdmlld0RhdGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEVsZW1lbnQoaW5kZXg6IG51bWJlcik6IExFbGVtZW50Tm9kZSB7XG4gIHJldHVybiBsb2FkRWxlbWVudEludGVybmFsKGluZGV4LCB2aWV3RGF0YSk7XG59XG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUgYW5kIGluY3JlbWVudHMgdGhlIGJpbmRpbmcgaW5kZXguICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUJpbmRpbmcoKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICB2aWV3RGF0YVt2aWV3RGF0YVtCSU5ESU5HX0lOREVYXV0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gdmlld0RhdGFbdmlld0RhdGFbQklORElOR19JTkRFWF0rK107XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGlmICh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9PT0gLTEpIGluaXRCaW5kaW5ncygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXTtcblxuICBpZiAoYmluZGluZ0luZGV4ID49IHZpZXdEYXRhLmxlbmd0aCkge1xuICAgIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNEaWZmZXJlbnQodmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShjcmVhdGlvbk1vZGUsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RhdGFbQklORElOR19JTkRFWF0rKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHRoZSBsYXRlc3QgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZhbHVlOiBhbnkpOiBhbnkge1xuICBiaW5kaW5nVXBkYXRlZCh2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoZXhwMikgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiB0Vmlldztcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRlbnRRdWVyeTxRPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxRPik6IHZvaWQge1xuICBjb25zdCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoID1cbiAgICAgICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdIHx8ICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKHF1ZXJ5TGlzdCk7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxO1xuICAgIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gICAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlldy5jb250ZW50UXVlcmllc1t0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggLSAyXSA6IC0xO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goY3VycmVudERpcmVjdGl2ZUluZGV4LCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydERlZmluZWQoZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleCwgYXJyIHx8IHZpZXdEYXRhKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBhcnIubGVuZ3RoLCBpbmRleCwgYGluZGV4ICR7aW5kZXh9IGV4cGVjdGVkIHRvIGJlIGF0IHRoZSBlbmQgb2YgYXJyIChsZW5ndGggJHthcnIubGVuZ3RofSlgKTtcbn1cblxuLyoqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIHJlc2VydmVkIHNsb3RzIHNob3VsZCBiZSBzZXQgYE5PX0NIQU5HRWAuXG4gKlxuICogSWYgbm90LCB0aGV5IG1pZ2h0IG5vdCBoYXZlIGJlZW4gYWN0dWFsbHkgcmVzZXJ2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0OiBudW1iZXIsIG51bVNsb3RzOiBudW1iZXIpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gc2xvdE9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzOyBpKyspIHtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHZpZXdEYXRhW3N0YXJ0SW5kZXggKyBpXSwgTk9fQ0hBTkdFLFxuICAgICAgICAgICdUaGUgcmVzZXJ2ZWQgc2xvdHMgc2hvdWxkIGJlIHNldCB0byBgTk9fQ0hBTkdFYCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzJyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZTxUPihjb21wb25lbnQ6IFQpOiBMRWxlbWVudE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdleHBlY3RpbmcgY29tcG9uZW50IGdvdCBudWxsJyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IChjb21wb25lbnQgYXMgYW55KVtOR19IT1NUX1NZTUJPTF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdvYmplY3QgaXMgbm90IGEgY29tcG9uZW50Jyk7XG4gIHJldHVybiBsRWxlbWVudE5vZGU7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5leHBvcnQgY29uc3QgUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTO1xuIl19