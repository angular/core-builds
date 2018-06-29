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
import './ng_dev_mode';
import { assertDefined, assertEqual, assertLessThan, assertNotDefined, assertNotEqual } from './assert';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, RENDER_PARENT, VIEWS } from './interfaces/container';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { BINDING_INDEX, CLEANUP, CONTEXT, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, insertView, appendProjectedNode, removeView, canInsertNativeNode, createTextNode, getNextLNode, getChildLNode, getParentLNode, getLViewChild } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
import { isDifferent, stringify } from './util';
/**
 * Directive (D) sets a property on all component instances using this constant as a key and the
 * component's host node (LElement) as the value. This is used in methods like detectChanges to
 * facilitate jumping from an instance to the host node.
 */
export const /** @type {?} */ NG_HOST_SYMBOL = '__ngHostLNode__';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
const /** @type {?} */ _CLEAN_PROMISE = Promise.resolve(null);
/**
 * Directive and element indices for top-level directive.
 *
 * Saved here to avoid re-instantiating an array on every change detection run.
 *
 * Note: Element is not actually stored at index 0 because of the LViewData
 * header, but the host bindings function expects an index that is NOT adjusted
 * because it will ultimately be fed to instructions like elementProperty.
 */
const /** @type {?} */ _ROOT_DIRECTIVE_INDICES = [0, 0];
/**
 * TView.data needs to fill the same number of slots as the LViewData header
 * so the indices of nodes are consistent between LViewData and TView.data.
 *
 * It's much faster to keep a blueprint of the pre-filled array and slice it
 * than it is to create a new array and fill it each time a TView is created.
 */
const /** @type {?} */ HEADER_FILLER = new Array(HEADER_OFFSET).fill(null);
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export const /** @type {?} */ CIRCULAR = '__CIRCULAR__';
/**
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
 */
let /** @type {?} */ renderer;
let /** @type {?} */ rendererFactory;
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
 * @return {?}
 */
export function getViewData() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return viewData;
}
/**
 * Used to set the parent property when nodes are created.
 */
let /** @type {?} */ previousOrParentNode;
/**
 * @return {?}
 */
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
 */
let /** @type {?} */ isParent;
let /** @type {?} */ tView;
let /** @type {?} */ currentQueries;
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
/**
 * This property gets set before entering a template.
 */
let /** @type {?} */ creationMode;
/**
 * @return {?}
 */
export function getCreationMode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return creationMode;
}
/**
 * State of the current view being processed.
 *
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
let /** @type {?} */ viewData;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
let /** @type {?} */ directives;
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
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 */
let /** @type {?} */ checkNoChangesMode = false;
/**
 * Whether or not this is the first time the current view has been processed.
 */
let /** @type {?} */ firstTemplatePass = true;
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
    const /** @type {?} */ oldView = viewData;
    directives = newView && newView[DIRECTIVES];
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    renderer = newView && newView[RENDERER];
    if (host != null) {
        previousOrParentNode = host;
        isParent = true;
    }
    viewData = newView;
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
 * bindings,
 * refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * @return {?}
 */
function refreshView() {
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
    }
    refreshDynamicEmbeddedViews(viewData);
    if (!checkNoChangesMode) {
        executeHooks(/** @type {?} */ ((directives)), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
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
        const /** @type {?} */ defs = /** @type {?} */ ((tView.directives));
        for (let /** @type {?} */ i = 0; i < bindings.length; i += 2) {
            const /** @type {?} */ dirIndex = bindings[i];
            const /** @type {?} */ def = /** @type {?} */ (defs[dirIndex]);
            def.hostBindings && def.hostBindings(dirIndex, bindings[i + 1]);
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
        for (let /** @type {?} */ i = 0; i < components.length; i += 2) {
            componentRefresh(components[i], components[i + 1]);
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
        viewData && viewData[INJECTOR],
        renderer,
        // renderer
        sanitizer || null,
        null,
        // tail
        -1 // containerIndex
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
        pNextOrParent: null,
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
    const /** @type {?} */ parent = isParent ? previousOrParentNode :
        previousOrParentNode && /** @type {?} */ (((getParentLNode(previousOrParentNode))));
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    const /** @type {?} */ tParent = parent && parent.view === viewData ? /** @type {?} */ (parent.tNode) : null;
    let /** @type {?} */ queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    const /** @type {?} */ isState = state != null;
    const /** @type {?} */ node = createLNodeObject(type, viewData, parent, native, isState ? /** @type {?} */ (state) : null, queries);
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = (state ? (/** @type {?} */ (state))[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        const /** @type {?} */ adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        ngDevMode && assertDataNext(adjustedIndex);
        const /** @type {?} */ tData = tView.data;
        viewData[adjustedIndex] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (adjustedIndex >= tData.length) {
            const /** @type {?} */ tNode = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentNode) {
                const /** @type {?} */ previousTNode = previousOrParentNode.tNode;
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
        const /** @type {?} */ lViewData = /** @type {?} */ (state);
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
        const /** @type {?} */ tView = getOrCreateTView(template, directives || null, pipes || null, null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLViewData(providedRendererFactory.createRenderer(null, null), tView, {}, 2 /* CheckAlways */, sanitizer));
    }
    const /** @type {?} */ hostView = /** @type {?} */ ((host.data));
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
 * @param {?} renderer
 * @param {?=} queries
 * @return {?}
 */
export function createEmbeddedViewNode(tView, context, renderer, queries) {
    const /** @type {?} */ _isParent = isParent;
    const /** @type {?} */ _previousOrParentNode = previousOrParentNode;
    isParent = true;
    previousOrParentNode = /** @type {?} */ ((null));
    const /** @type {?} */ lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    const /** @type {?} */ viewNode = createLNode(-1, 2 /* View */, null, null, null, lView);
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
    const /** @type {?} */ _isParent = isParent;
    const /** @type {?} */ _previousOrParentNode = previousOrParentNode;
    let /** @type {?} */ oldView;
    try {
        isParent = true;
        previousOrParentNode = /** @type {?} */ ((null));
        oldView = enterView(viewNode.data, viewNode);
        namespaceHTML(); /** @type {?} */
        ((tView.template))(rf, context);
        if (rf & 2 /* Update */) {
            refreshView();
        }
        else {
            viewNode.data[TVIEW].firstTemplatePass = firstTemplatePass = false;
        }
    }
    finally {
        // renderEmbeddedTemplate() is called twice in fact, once for creation only and then once for
        // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
        const /** @type {?} */ isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
        leaveView(/** @type {?} */ ((oldView)), isCreationOnly);
        isParent = _isParent;
        previousOrParentNode = _previousOrParentNode;
    }
    return viewNode;
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
    const /** @type {?} */ oldView = enterView(hostView, node);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (template) {
            namespaceHTML();
            template(getRenderFlags(hostView), /** @type {?} */ ((componentOrContext)));
            refreshView();
        }
        else {
            executeInitAndContentHooks();
            // Element was stored at 0 in data and directive was stored at 0 in directives
            // in renderComponent()
            setHostBindings(_ROOT_DIRECTIVE_INDICES);
            componentRefresh(0, HEADER_OFFSET);
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
let /** @type {?} */ _currentNamespace = null;
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
    let /** @type {?} */ native;
    if (isProceduralRenderer(renderer)) {
        native = renderer.createElement(name, _currentNamespace);
    }
    else {
        if (_currentNamespace === null) {
            native = renderer.createElement(name);
        }
        else {
            native = renderer.createElementNS(_currentNamespace, name);
        }
    }
    ngDevMode && assertDataInRange(index - 1);
    const /** @type {?} */ node = createLNode(index, 3 /* Element */, /** @type {?} */ ((native)), name, attrs || null, null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(localRefs);
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param {?=} localRefs Local refs of the current node
 * @return {?}
 */
function createDirectivesAndLocals(localRefs) {
    const /** @type {?} */ node = previousOrParentNode;
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
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    const /** @type {?} */ exportsMap = localRefs ? { '': -1 } : null;
    const /** @type {?} */ matches = tView.currentMatches = findDirectiveMatches(tNode);
    if (matches) {
        for (let /** @type {?} */ i = 0; i < matches.length; i += 2) {
            const /** @type {?} */ def = /** @type {?} */ (matches[i]);
            const /** @type {?} */ valueIndex = i + 1;
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
    const /** @type {?} */ registry = tView.directiveRegistry;
    let /** @type {?} */ matches = null;
    if (registry) {
        for (let /** @type {?} */ i = 0; i < registry.length; i++) {
            const /** @type {?} */ def = registry[i];
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
        const /** @type {?} */ instance = def.factory();
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
 * @param {?} dirIndex
 * @return {?}
 */
function queueComponentIndexForCheck(dirIndex) {
    if (firstTemplatePass) {
        (tView.components || (tView.components = [])).push(dirIndex, viewData.length - 1);
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
    const /** @type {?} */ tNode = previousOrParentNode.tNode;
    const /** @type {?} */ count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (count > 0) {
        const /** @type {?} */ start = tNode.flags >> 13 /* DirectiveStartingIndexShift */;
        const /** @type {?} */ end = start + count;
        const /** @type {?} */ tDirectives = /** @type {?} */ ((tView.directives));
        for (let /** @type {?} */ i = start; i < end; i++) {
            const /** @type {?} */ def = tDirectives[i];
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
        const /** @type {?} */ localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let /** @type {?} */ i = 0; i < localRefs.length; i += 2) {
            const /** @type {?} */ index = exportsMap[localRefs[i + 1]];
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
    const /** @type {?} */ localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (let /** @type {?} */ i = 0; i < localNames.length; i += 2) {
            const /** @type {?} */ index = /** @type {?} */ (localNames[i + 1]);
            const /** @type {?} */ value = index === -1 ? previousOrParentNode.native : /** @type {?} */ ((directives))[index];
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
    const /** @type {?} */ isProc = isProceduralRenderer(renderer);
    let /** @type {?} */ i = 0;
    while (i < attrs.length) {
        const /** @type {?} */ attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === NG_PROJECT_AS_ATTR_NAME) {
            i += 2;
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (attrName === 0 /* NamespaceURI */) {
                // Namespaced attributes
                const /** @type {?} */ namespaceURI = /** @type {?} */ (attrs[i + 1]);
                const /** @type {?} */ attrName = /** @type {?} */ (attrs[i + 2]);
                const /** @type {?} */ attrVal = /** @type {?} */ (attrs[i + 3]);
                isProc ?
                    (/** @type {?} */ (renderer))
                        .setAttribute(native, attrName, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName, attrVal);
                i += 4;
            }
            else {
                // Standard attributes
                const /** @type {?} */ attrVal = attrs[i + 1];
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
    const /** @type {?} */ defaultRenderer = factory.createRenderer(null, null);
    const /** @type {?} */ rNode = typeof elementOrSelector === 'string' ?
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
    const /** @type {?} */ node = createLNode(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
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
    const /** @type {?} */ node = previousOrParentNode;
    const /** @type {?} */ native = /** @type {?} */ (node.native);
    ngDevMode && ngDevMode.rendererAddEventListener++;
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    if (isProceduralRenderer(renderer)) {
        const /** @type {?} */ wrappedListener = wrapListenerWithDirtyLogic(viewData, listenerFn);
        const /** @type {?} */ cleanupFn = renderer.listen(native, eventName, wrappedListener);
        storeCleanupFn(viewData, cleanupFn);
    }
    else {
        const /** @type {?} */ wrappedListener = wrapListenerWithDirtyAndDefault(viewData, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        const /** @type {?} */ cleanupInstances = getCleanup(viewData);
        cleanupInstances.push(wrappedListener);
        if (firstTemplatePass) {
            getTViewCleanup(viewData).push(eventName, node.tNode.index, /** @type {?} */ ((cleanupInstances)).length - 1, useCapture);
        }
    }
    let /** @type {?} */ tNode = node.tNode;
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(node.tNode.flags, 1 /* Output */);
    }
    const /** @type {?} */ outputs = tNode.outputs;
    let /** @type {?} */ outputData;
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
    for (let /** @type {?} */ i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(/** @type {?} */ (outputs[i]), /** @type {?} */ ((directives)));
        const /** @type {?} */ subscription = /** @type {?} */ ((directives))[/** @type {?} */ (outputs[i])][outputs[i + 1]].subscribe(listener);
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
    const /** @type {?} */ queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
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
        const /** @type {?} */ element = load(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            const /** @type {?} */ strValue = sanitizer == null ? stringify(value) : sanitizer(value);
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
    const /** @type {?} */ node = /** @type {?} */ (load(index));
    const /** @type {?} */ tNode = node.tNode;
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(node.tNode.flags, 0 /* Input */);
    }
    const /** @type {?} */ inputData = tNode && tNode.inputs;
    let /** @type {?} */ dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        markDirtyIfOnPush(node);
    }
    else {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? (/** @type {?} */ (sanitizer(value))) : value;
        const /** @type {?} */ native = node.native;
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
        detached: null
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
    for (let /** @type {?} */ i = 0; i < inputs.length; i += 2) {
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
    const /** @type {?} */ count = tNodeFlags & 4095 /* DirectiveCountMask */;
    let /** @type {?} */ propStore = null;
    if (count > 0) {
        const /** @type {?} */ start = tNodeFlags >> 13 /* DirectiveStartingIndexShift */;
        const /** @type {?} */ end = start + count;
        const /** @type {?} */ isInput = direction === 0 /* Input */;
        const /** @type {?} */ defs = /** @type {?} */ ((tView.directives));
        for (let /** @type {?} */ i = start; i < end; i++) {
            const /** @type {?} */ directiveDef = /** @type {?} */ (defs[i]);
            const /** @type {?} */ propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (let /** @type {?} */ publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    const /** @type {?} */ internalName = propertyAliasMap[publicName];
                    const /** @type {?} */ hasProperty = propStore.hasOwnProperty(publicName);
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
 * @param {?} className Name of class to toggle. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param {?} value A value indicating if a given class should be added or removed.
 * @return {?}
 */
export function elementClassNamed(index, className, value) {
    if (value !== NO_CHANGE) {
        const /** @type {?} */ lElement = /** @type {?} */ (load(index));
        if (value) {
            ngDevMode && ngDevMode.rendererAddClass++;
            isProceduralRenderer(renderer) ? renderer.addClass(lElement.native, className) :
                lElement.native.classList.add(className);
        }
        else {
            ngDevMode && ngDevMode.rendererRemoveClass++;
            isProceduralRenderer(renderer) ? renderer.removeClass(lElement.native, className) :
                lElement.native.classList.remove(className);
        }
    }
}
/**
 * Set the `className` property on a DOM element.
 *
 * This instruction is meant to handle the `[class]="exp"` usage.
 *
 * `elementClass` instruction writes the value to the "element's" `className` property.
 *
 * @template T
 * @param {?} index The index of the element to update in the data array
 * @param {?} value A value indicating a set of classes which should be applied. The method overrides
 *   any existing classes. The value is stringified (`toString`) before it is applied to the
 *   element.
 * @return {?}
 */
export function elementClass(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `className`. In the
        // future
        // we will add logic here which would work with the animation code.
        const /** @type {?} */ lElement = load(index);
        ngDevMode && ngDevMode.rendererSetClassName++;
        isProceduralRenderer(renderer) ? renderer.setProperty(lElement.native, 'className', value) :
            lElement.native['className'] = stringify(value);
    }
}
/**
 * @template T
 * @param {?} index
 * @param {?} styleName
 * @param {?} value
 * @param {?=} suffixOrSanitizer
 * @return {?}
 */
export function elementStyleNamed(index, styleName, value, suffixOrSanitizer) {
    if (value !== NO_CHANGE) {
        const /** @type {?} */ lElement = load(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            isProceduralRenderer(renderer) ?
                renderer.removeStyle(lElement.native, styleName, RendererStyleFlags3.DashCase) :
                lElement.native['style'].removeProperty(styleName);
        }
        else {
            let /** @type {?} */ strValue = typeof suffixOrSanitizer == 'function' ? suffixOrSanitizer(value) : stringify(value);
            if (typeof suffixOrSanitizer == 'string')
                strValue = strValue + suffixOrSanitizer;
            ngDevMode && ngDevMode.rendererSetStyle++;
            isProceduralRenderer(renderer) ?
                renderer.setStyle(lElement.native, styleName, strValue, RendererStyleFlags3.DashCase) :
                lElement.native['style'].setProperty(styleName, strValue);
        }
    }
}
/**
 * Set the `style` property on a DOM element.
 *
 * This instruction is meant to handle the `[style]="exp"` usage.
 *
 *
 * @template T
 * @param {?} index The index of the element to update in the LViewData array
 * @param {?} value A value indicating if a given style should be added or removed.
 *   The expected shape of `value` is an object where keys are style names and the values
 *   are their corresponding values to set. If value is falsy, then the style is removed. An absence
 *   of style does not cause that style to be removed. `NO_CHANGE` implies that no update should be
 *   performed.
 * @return {?}
 */
export function elementStyle(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `style`. In the future
        // we will add logic here which would work with the animation code.
        const /** @type {?} */ lElement = /** @type {?} */ (load(index));
        if (isProceduralRenderer(renderer)) {
            ngDevMode && ngDevMode.rendererSetStyle++;
            renderer.setProperty(lElement.native, 'style', value);
        }
        else {
            const /** @type {?} */ style = lElement.native['style'];
            for (let /** @type {?} */ i = 0, /** @type {?} */ keys = Object.keys(value); i < keys.length; i++) {
                const /** @type {?} */ styleName = keys[i];
                const /** @type {?} */ styleValue = (/** @type {?} */ (value))[styleName];
                if (styleValue == null) {
                    ngDevMode && ngDevMode.rendererRemoveStyle++;
                    style.removeProperty(styleName);
                }
                else {
                    ngDevMode && ngDevMode.rendererSetStyle++;
                    style.setProperty(styleName, styleValue);
                }
            }
        }
    }
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
    const /** @type {?} */ textNode = createTextNode(value, renderer);
    const /** @type {?} */ node = createLNode(index, 3 /* Element */, textNode, null, null);
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
        const /** @type {?} */ existingNode = /** @type {?} */ (load(index));
        ngDevMode && assertDefined(existingNode, 'LNode should exist');
        ngDevMode && assertDefined(existingNode.native, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
            existingNode.native.textContent = stringify(value);
    }
}
/**
 * Create a directive.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @template T
 * @param {?} index
 * @param {?} directive The directive instance.
 * @param {?} directiveDef DirectiveDef object which contains information about the template.
 * @return {?}
 */
export function directiveCreate(index, directive, directiveDef) {
    const /** @type {?} */ instance = baseDirectiveCreate(index, directive, directiveDef);
    ngDevMode && assertDefined(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    const /** @type {?} */ tNode = previousOrParentNode.tNode;
    const /** @type {?} */ isComponent = (/** @type {?} */ (directiveDef)).template;
    if (isComponent) {
        addComponentLogic(index, directive, /** @type {?} */ (directiveDef));
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(index, directiveDef.onInit, directiveDef.doCheck, tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(index);
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(index, instance, directiveDef.inputs, tNode);
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
    const /** @type {?} */ tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const /** @type {?} */ componentView = addToViewTree(viewData, /** @type {?} */ (previousOrParentNode.tNode.index), createLViewData(rendererFactory.createRenderer(/** @type {?} */ (previousOrParentNode.native), def.rendererType), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    (/** @type {?} */ (previousOrParentNode)).data = componentView;
    (/** @type {?} */ (componentView))[HOST_NODE] = /** @type {?} */ (previousOrParentNode);
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, componentView);
    if (firstTemplatePass)
        queueComponentIndexForCheck(directiveIndex);
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
        const /** @type {?} */ flags = previousOrParentNode.tNode.flags;
        if ((flags & 4095 /* DirectiveCountMask */) === 0) {
            // When the first directive is created:
            // - save the index,
            // - set the number of directives to 1
            previousOrParentNode.tNode.flags =
                index << 13 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ | 1;
        }
        else {
            // Only need to bump the size when subsequent directives are created
            ngDevMode && assertNotEqual(flags & 4095 /* DirectiveCountMask */, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
            previousOrParentNode.tNode.flags++;
        }
    }
    else {
        const /** @type {?} */ diPublic = /** @type {?} */ ((directiveDef)).diPublic;
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
    let /** @type {?} */ initialInputData = /** @type {?} */ (tNode.initialInputs);
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    const /** @type {?} */ initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (let /** @type {?} */ i = 0; i < initialInputs.length; i += 2) {
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
    const /** @type {?} */ initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    const /** @type {?} */ attrs = /** @type {?} */ ((tNode.attrs));
    let /** @type {?} */ i = 0;
    while (i < attrs.length) {
        const /** @type {?} */ attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        const /** @type {?} */ minifiedInputName = inputs[attrName];
        const /** @type {?} */ attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            const /** @type {?} */ inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
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
    let /** @type {?} */ renderParent = canInsertNativeNode(parentLNode, currentView) ? /** @type {?} */ (parentLNode) :
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
    const /** @type {?} */ currentParent = isParent ? previousOrParentNode : /** @type {?} */ ((getParentLNode(previousOrParentNode)));
    const /** @type {?} */ lContainer = createLContainer(currentParent, viewData);
    const /** @type {?} */ comment = renderer.createComment(ngDevMode ? 'container' : '');
    const /** @type {?} */ node = createLNode(index, 0 /* Container */, comment, tagName || null, attrs || null, lContainer);
    appendChild(getParentLNode(node), comment, viewData);
    if (firstTemplatePass) {
        node.tNode.tViews = template ?
            createTView(-1, template, tView.directiveRegistry, tView.pipeRegistry, null) :
            [];
    }
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, node.data);
    const /** @type {?} */ queries = node.queries;
    if (queries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = queries.container();
    }
    createDirectivesAndLocals(localRefs);
    isParent = false;
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    if (queries) {
        // check if a given container node matches
        queries.addNode(node);
    }
}
/**
 * Sets a container up to receive views.
 *
 * @param {?} index The index of the container in the data array
 * @return {?}
 */
export function containerRefreshStart(index) {
    previousOrParentNode = /** @type {?} */ (load(index));
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
    const /** @type {?} */ container = /** @type {?} */ (previousOrParentNode);
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const /** @type {?} */ nextIndex = /** @type {?} */ ((container.data[ACTIVE_INDEX]));
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
    for (let /** @type {?} */ current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
        // Note: current can be an LViewData or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === null) {
            const /** @type {?} */ container = /** @type {?} */ (current);
            for (let /** @type {?} */ i = 0; i < container[VIEWS].length; i++) {
                const /** @type {?} */ lViewNode = container[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                const /** @type {?} */ dynamicViewData = lViewNode.data;
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
    const /** @type {?} */ views = containerNode.data[VIEWS];
    for (let /** @type {?} */ i = startIdx; i < views.length; i++) {
        const /** @type {?} */ viewAtPositionId = views[i].data[TVIEW].id;
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
    const /** @type {?} */ container = /** @type {?} */ ((isParent ? previousOrParentNode : getParentLNode(previousOrParentNode)));
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const /** @type {?} */ lContainer = container.data;
    let /** @type {?} */ viewNode = scanForView(container, /** @type {?} */ ((lContainer[ACTIVE_INDEX])), viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        const /** @type {?} */ newView = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, 2 /* CheckAlways */, getCurrentSanitizer());
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
    const /** @type {?} */ containerTViews = /** @type {?} */ ((/** @type {?} */ (((parent)).tNode)).tViews);
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
    refreshView();
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
 * @param {?} directiveIndex Directive index in LViewData[DIRECTIVES]
 * @param {?} adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 * @return {?}
 */
export function componentRefresh(directiveIndex, adjustedElementIndex) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    const /** @type {?} */ element = /** @type {?} */ (viewData[adjustedElementIndex]);
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, `Component's host node should have an LViewData attached.`);
    const /** @type {?} */ hostView = /** @type {?} */ ((element.data));
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        ngDevMode && assertDataInRange(directiveIndex, /** @type {?} */ ((directives)));
        detectChangesInternal(hostView, element, getDirectiveInstance(/** @type {?} */ ((directives))[directiveIndex]));
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
 * @param {?} index
 * @param {?=} selectors A collection of parsed CSS selectors
 * @param {?=} textSelectors
 * @return {?}
 */
export function projectionDef(index, selectors, textSelectors) {
    const /** @type {?} */ noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
    const /** @type {?} */ distributedNodes = new Array(noOfNodeBuckets);
    for (let /** @type {?} */ i = 0; i < noOfNodeBuckets; i++) {
        distributedNodes[i] = [];
    }
    const /** @type {?} */ componentNode = findComponentHost(viewData);
    let /** @type {?} */ componentChild = getChildLNode(componentNode);
    while (componentChild !== null) {
        // execute selector matching logic if and only if:
        // - there are selectors defined
        // - a node has a tag name / attributes that can be matched
        if (selectors) {
            const /** @type {?} */ matchedIdx = matchingSelectorIndex(componentChild.tNode, selectors, /** @type {?} */ ((textSelectors)));
            distributedNodes[matchedIdx].push(componentChild);
        }
        else {
            distributedNodes[0].push(componentChild);
        }
        componentChild = getNextLNode(componentChild);
    }
    ngDevMode && assertDataNext(index + HEADER_OFFSET);
    store(index, distributedNodes);
}
/**
 * Updates the linked list of a projection node, by appending another linked list.
 *
 * @param {?} projectionNode Projection node whose projected nodes linked list has to be updated
 * @param {?} appendedFirst First node of the linked list to append.
 * @param {?} appendedLast Last node of the linked list to append.
 * @return {?}
 */
function appendToProjectionNode(projectionNode, appendedFirst, appendedLast) {
    ngDevMode && assertEqual(!!appendedFirst, !!appendedLast, 'appendedFirst can be null if and only if appendedLast is also null');
    if (!appendedLast) {
        // nothing to append
        return;
    }
    const /** @type {?} */ projectionNodeData = projectionNode.data;
    if (projectionNodeData.tail) {
        projectionNodeData.tail.pNextOrParent = appendedFirst;
    }
    else {
        projectionNodeData.head = appendedFirst;
    }
    projectionNodeData.tail = appendedLast;
    appendedLast.pNextOrParent = projectionNode;
}
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param {?} nodeIndex
 * @param {?} localIndex - index under which distribution of projected nodes was memorized
 * @param {?=} selectorIndex
 * @param {?=} attrs
 * @return {?}
 */
export function projection(nodeIndex, localIndex, selectorIndex = 0, attrs) {
    const /** @type {?} */ node = createLNode(nodeIndex, 1 /* Projection */, null, null, attrs || null, { head: null, tail: null });
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is memorized on a component's view level
    const /** @type {?} */ componentNode = findComponentHost(viewData);
    const /** @type {?} */ componentLView = /** @type {?} */ (componentNode.data);
    const /** @type {?} */ distributedNodes = /** @type {?} */ (loadInternal(localIndex, componentLView));
    const /** @type {?} */ nodesForSelector = distributedNodes[selectorIndex];
    // build the linked list of projected nodes:
    for (let /** @type {?} */ i = 0; i < nodesForSelector.length; i++) {
        const /** @type {?} */ nodeToProject = nodesForSelector[i];
        if (nodeToProject.tNode.type === 1 /* Projection */) {
            // Reprojecting a projection -> append the list of previously projected nodes
            const /** @type {?} */ previouslyProjected = (/** @type {?} */ (nodeToProject)).data;
            appendToProjectionNode(node, previouslyProjected.head, previouslyProjected.tail);
        }
        else {
            // Projecting a single node
            appendToProjectionNode(node, /** @type {?} */ (nodeToProject), /** @type {?} */ (nodeToProject));
        }
    }
    const /** @type {?} */ currentParent = getParentLNode(node);
    if (canInsertNativeNode(currentParent, viewData)) {
        ngDevMode && assertNodeOfPossibleTypes(currentParent, 3 /* Element */, 2 /* View */);
        // process each node in the list of projected nodes:
        let /** @type {?} */ nodeToProject = node.data.head;
        const /** @type {?} */ lastNodeToProject = node.data.tail;
        const /** @type {?} */ renderParent = currentParent.tNode.type === 2 /* View */ ? /** @type {?} */
            (((/** @type {?} */ (getParentLNode(currentParent))).data[RENDER_PARENT])) : /** @type {?} */ (currentParent);
        while (nodeToProject) {
            appendProjectedNode(/** @type {?} */ (nodeToProject), currentParent, viewData, renderParent);
            nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
        }
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lViewData LViewData for which we want a host element node
 * @return {?} The host node
 */
function findComponentHost(lViewData) {
    let /** @type {?} */ viewRootLNode = lViewData[HOST_NODE];
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'lViewData.parent');
        lViewData = /** @type {?} */ ((lViewData[PARENT]));
        viewRootLNode = lViewData[HOST_NODE];
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertDefined(viewRootLNode.data, 'node.data');
    return /** @type {?} */ (viewRootLNode);
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
    let /** @type {?} */ currentView = view;
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
        let /** @type {?} */ res;
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
    const /** @type {?} */ rootView = getRootView(component);
    const /** @type {?} */ rootContext = /** @type {?} */ (rootView[CONTEXT]);
    tickRootContext(rootContext);
}
/**
 * @param {?} rootContext
 * @return {?}
 */
function tickRootContext(rootContext) {
    for (let /** @type {?} */ i = 0; i < rootContext.components.length; i++) {
        const /** @type {?} */ rootComponent = rootContext.components[i];
        const /** @type {?} */ hostNode = _getComponentHostLElementNode(rootComponent);
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
    const /** @type {?} */ lElementNode = _getComponentHostLElementNode(component);
    let /** @type {?} */ lViewData = lElementNode.view;
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
    const /** @type {?} */ hostNode = _getComponentHostLElementNode(component);
    ngDevMode &&
        assertDefined(hostNode.data, 'Component host node should be attached to an LViewData instance.');
    detectChangesInternal(/** @type {?} */ (hostNode.data), hostNode, component);
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
 * Checks the view of the component provided. Does not gate on dirty checks or execute doCheck.
 * @template T
 * @param {?} hostView
 * @param {?} hostNode
 * @param {?} component
 * @return {?}
 */
export function detectChangesInternal(hostView, hostNode, component) {
    const /** @type {?} */ oldView = enterView(hostView, hostNode);
    const /** @type {?} */ hostTView = hostView[TVIEW];
    const /** @type {?} */ template = /** @type {?} */ ((hostTView.template));
    const /** @type {?} */ viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, hostView[FLAGS], component);
        template(getRenderFlags(hostView), component);
        refreshView();
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
    const /** @type {?} */ lElementNode = _getComponentHostLElementNode(component);
    markViewDirty(lElementNode.view);
}
/**
 * A special value which designates that a value has not changed.
 */
export const /** @type {?} */ NO_CHANGE = /** @type {?} */ ({});
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
    const /** @type {?} */ currentSlot = viewData[BINDING_INDEX];
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
    let /** @type {?} */ different = false;
    for (let /** @type {?} */ i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    let /** @type {?} */ content = values[0];
    for (let /** @type {?} */ i = 1; i < values.length; i += 2) {
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
    const /** @type {?} */ different = bindingUpdated(v0);
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
    const /** @type {?} */ different = bindingUpdated2(v0, v1);
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/**
 * Creates an interpolation bindings with 3 expressions.
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
    let /** @type {?} */ different = bindingUpdated2(v0, v1);
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
    const /** @type {?} */ different = bindingUpdated4(v0, v1, v2, v3);
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
    let /** @type {?} */ different = bindingUpdated4(v0, v1, v2, v3);
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
    let /** @type {?} */ different = bindingUpdated4(v0, v1, v2, v3);
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
    let /** @type {?} */ different = bindingUpdated4(v0, v1, v2, v3);
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
    let /** @type {?} */ different = bindingUpdated4(v0, v1, v2, v3);
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
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    const /** @type {?} */ adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
    }
    viewData[adjustedIndex] = value;
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
 * Retrieves a value from any `LViewData`.
 * @template T
 * @param {?} index
 * @param {?} arr
 * @return {?}
 */
export function loadInternal(index, arr) {
    ngDevMode && assertDataInRange(index + HEADER_OFFSET, arr);
    return arr[index + HEADER_OFFSET];
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
    const /** @type {?} */ bindingIndex = viewData[BINDING_INDEX];
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
    const /** @type {?} */ different = bindingUpdated(exp1);
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
    const /** @type {?} */ different = bindingUpdated2(exp1, exp2);
    return bindingUpdated2(exp3, exp4) || different;
}
/**
 * @return {?}
 */
export function getTView() {
    return tView;
}
/**
 * @template T
 * @param {?} instanceOrArray
 * @return {?}
 */
export function getDirectiveInstance(instanceOrArray) {
    // Directives with content queries store an array in directives[directiveIndex]
    // with the instance as the first index
    return Array.isArray(instanceOrArray) ? instanceOrArray[0] : instanceOrArray;
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
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
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
        const /** @type {?} */ startIndex = tView.bindingStartIndex - slotOffset;
        for (let /** @type {?} */ i = 0; i < numSlots; i++) {
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
    const /** @type {?} */ lElementNode = /** @type {?} */ ((/** @type {?} */ (component))[NG_HOST_SYMBOL]);
    ngDevMode && assertDefined(component, 'object is not a component');
    return lElementNode;
}
export const /** @type {?} */ CLEAN_PROMISE = _CLEAN_PROMISE;
export const /** @type {?} */ ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQUl2QixPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3RHLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RyxPQUFPLEVBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM1RixPQUFPLEVBQUMsWUFBWSxFQUFjLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUV0RixPQUFPLEVBQStCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFOUYsT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQW1CLE9BQU8sRUFBc0IsVUFBVSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBeUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFlLFNBQVMsRUFBRSxJQUFJLEVBQVMsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFHelEsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzlM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QUM7SUFDdEUsdUJBQU0sWUFBWSxxQkFBRyxtQkFBQyxTQUFnQixFQUFDLENBQUMsY0FBYyxDQUFpQixDQUFBLENBQUM7SUFDeEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsMkJBQTJCLENBQUMsQ0FBQztJQUNuRSxPQUFPLFlBQVksQ0FBQztDQUNyQjtBQUVELE1BQU0sQ0FBQyx1QkFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDO0FBQzVDLE1BQU0sQ0FBQyx1QkFBTSxzQkFBc0IsR0FBRyx1QkFBdUIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3REZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3QsIExQcm9qZWN0aW9uLCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBDT05URVhULCBDdXJyZW50TWF0Y2hlc0xpc3QsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJvb3RDb250ZXh0LCBTQU5JVElaRVIsIFRBSUwsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGVUeXBlLCBUTm9kZUZsYWdzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVENvbnRhaW5lck5vZGUsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBURWxlbWVudE5vZGUsfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGluc2VydFZpZXcsIGFwcGVuZFByb2plY3RlZE5vZGUsIHJlbW92ZVZpZXcsIGNhbkluc2VydE5hdGl2ZU5vZGUsIGNyZWF0ZVRleHROb2RlLCBnZXROZXh0TE5vZGUsIGdldENoaWxkTE5vZGUsIGdldFBhcmVudExOb2RlLCBnZXRMVmlld0NoaWxkfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50VGVtcGxhdGUsIENvbXBvbmVudFF1ZXJ5LCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgUHJvY2VkdXJhbFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzRGlmZmVyZW50LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG4vKipcbiAqIERpcmVjdGl2ZSAoRCkgc2V0cyBhIHByb3BlcnR5IG9uIGFsbCBjb21wb25lbnQgaW5zdGFuY2VzIHVzaW5nIHRoaXMgY29uc3RhbnQgYXMgYSBrZXkgYW5kIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBub2RlIChMRWxlbWVudCkgYXMgdGhlIHZhbHVlLiBUaGlzIGlzIHVzZWQgaW4gbWV0aG9kcyBsaWtlIGRldGVjdENoYW5nZXMgdG9cbiAqIGZhY2lsaXRhdGUganVtcGluZyBmcm9tIGFuIGluc3RhbmNlIHRvIHRoZSBob3N0IG5vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBOR19IT1NUX1NZTUJPTCA9ICdfX25nSG9zdExOb2RlX18nO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICpcbiAqIFNhdmVkIGhlcmUgdG8gYXZvaWQgcmUtaW5zdGFudGlhdGluZyBhbiBhcnJheSBvbiBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqXG4gKiBOb3RlOiBFbGVtZW50IGlzIG5vdCBhY3R1YWxseSBzdG9yZWQgYXQgaW5kZXggMCBiZWNhdXNlIG9mIHRoZSBMVmlld0RhdGFcbiAqIGhlYWRlciwgYnV0IHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGV4cGVjdHMgYW4gaW5kZXggdGhhdCBpcyBOT1QgYWRqdXN0ZWRcbiAqIGJlY2F1c2UgaXQgd2lsbCB1bHRpbWF0ZWx5IGJlIGZlZCB0byBpbnN0cnVjdGlvbnMgbGlrZSBlbGVtZW50UHJvcGVydHkuXG4gKi9cbmNvbnN0IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gWzAsIDBdO1xuXG4vKipcbiAqIFRWaWV3LmRhdGEgbmVlZHMgdG8gZmlsbCB0aGUgc2FtZSBudW1iZXIgb2Ygc2xvdHMgYXMgdGhlIExWaWV3RGF0YSBoZWFkZXJcbiAqIHNvIHRoZSBpbmRpY2VzIG9mIG5vZGVzIGFyZSBjb25zaXN0ZW50IGJldHdlZW4gTFZpZXdEYXRhIGFuZCBUVmlldy5kYXRhLlxuICpcbiAqIEl0J3MgbXVjaCBmYXN0ZXIgdG8ga2VlcCBhIGJsdWVwcmludCBvZiB0aGUgcHJlLWZpbGxlZCBhcnJheSBhbmQgc2xpY2UgaXRcbiAqIHRoYW4gaXQgaXMgdG8gY3JlYXRlIGEgbmV3IGFycmF5IGFuZCBmaWxsIGl0IGVhY2ggdGltZSBhIFRWaWV3IGlzIGNyZWF0ZWQuXG4gKi9cbmNvbnN0IEhFQURFUl9GSUxMRVIgPSBuZXcgQXJyYXkoSEVBREVSX09GRlNFVCkuZmlsbChudWxsKTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgcmV0dXJuIHZpZXdEYXRhICYmIHZpZXdEYXRhW1NBTklUSVpFUl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWaWV3RGF0YSgpOiBMVmlld0RhdGEge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3RGF0YTtcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZC4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50Tm9kZTogTE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpOiBMTm9kZSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnROb2RlO1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpbmIgdGhpcyBwcmV2aW91c09yUGFyZW50Tm9kZSBwb2ludHMgdG8gYSBub2RlIG9uIHdoaWNoIHdlXG4gKiBjcmVhdGUgY29udGVudCBxdWVyaWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRRdWVyaWVzKFF1ZXJ5VHlwZToge25ldyAoKTogTFF1ZXJpZXN9KTogTFF1ZXJpZXMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fFxuICAgICAgKGN1cnJlbnRRdWVyaWVzID1cbiAgICAgICAgICAgKHByZXZpb3VzT3JQYXJlbnROb2RlLnF1ZXJpZXMgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcy5jbG9uZSgpIHx8XG4gICAgICAgICAgICBuZXcgUXVlcnlUeXBlKCkpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjcmVhdGlvbk1vZGU7XG59XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogQW4gYXJyYXkgb2Ygbm9kZXMgKHRleHQsIGVsZW1lbnQsIGNvbnRhaW5lciwgZXRjKSwgcGlwZXMsIHRoZWlyIGJpbmRpbmdzLCBhbmRcbiAqIGFueSBsb2NhbCB2YXJpYWJsZXMgdGhhdCBuZWVkIHRvIGJlIHN0b3JlZCBiZXR3ZWVuIGludm9jYXRpb25zLlxuICovXG5sZXQgdmlld0RhdGE6IExWaWV3RGF0YTtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gW10pO1xufVxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBvbGRWaWV3OiBMVmlld0RhdGEgPSB2aWV3RGF0YTtcbiAgZGlyZWN0aXZlcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tESVJFQ1RJVkVTXTtcbiAgdFZpZXcgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbVFZJRVddO1xuXG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgZmlyc3RUZW1wbGF0ZVBhc3MgPSBuZXdWaWV3ICYmIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuXG4gIHJlbmRlcmVyID0gbmV3VmlldyAmJiBuZXdWaWV3W1JFTkRFUkVSXTtcblxuICBpZiAoaG9zdCAhPSBudWxsKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBob3N0O1xuICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgfVxuXG4gIHZpZXdEYXRhID0gbmV3VmlldztcbiAgY3VycmVudFF1ZXJpZXMgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUVVFUklFU107XG5cbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXdEYXRhLCBjcmVhdGlvbk9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LnZpZXdIb29rcywgdFZpZXcudmlld0NoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gICAgfVxuICAgIC8vIFZpZXdzIGFyZSBjbGVhbiBhbmQgaW4gdXBkYXRlIG1vZGUgYWZ0ZXIgYmVpbmcgY2hlY2tlZCwgc28gdGhlc2UgYml0cyBhcmUgY2xlYXJlZFxuICAgIHZpZXdEYXRhW0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5EaXJ0eSk7XG4gIH1cbiAgdmlld0RhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSAtMTtcbiAgZW50ZXJWaWV3KG5ld1ZpZXcsIG51bGwpO1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLFxuICogcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5mdW5jdGlvbiByZWZyZXNoVmlldygpIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3Modmlld0RhdGEpO1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cblxuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICBzZXRIb3N0QmluZGluZ3ModFZpZXcuaG9zdEJpbmRpbmdzKTtcbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzKTtcbn1cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRpckluZGV4ID0gYmluZGluZ3NbaV07XG4gICAgICBjb25zdCBkZWYgPSBkZWZzW2RpckluZGV4XSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgZGVmLmhvc3RCaW5kaW5ncyAmJiBkZWYuaG9zdEJpbmRpbmdzKGRpckluZGV4LCBiaW5kaW5nc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSwgY29tcG9uZW50c1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXdEYXRhPFQ+KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlld0RhdGEge1xuICByZXR1cm4gW1xuICAgIHRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdFZpZXdcbiAgICB2aWV3RGF0YSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgIGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0LCAgLy8gZmxhZ3NcbiAgICBudWxsICEsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhvc3ROb2RlXG4gICAgLTEsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiaW5kaW5nSW5kZXhcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZXNcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXBJbnN0YW5jZXNcbiAgICBjb250ZXh0LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRleHRcbiAgICB2aWV3RGF0YSAmJiB2aWV3RGF0YVtJTkpFQ1RPUl0sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluamVjdG9yXG4gICAgcmVuZGVyZXIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyByZW5kZXJlclxuICAgIHNhbml0aXplciB8fCBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2FuaXRpemVyXG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0YWlsXG4gICAgLTEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250YWluZXJJbmRleFxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0aW9uIG9mIExOb2RlIG9iamVjdCBpcyBleHRyYWN0ZWQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB3ZSBhbHdheXMgY3JlYXRlIExOb2RlIG9iamVjdFxuICogd2l0aCB0aGUgc2FtZSBzaGFwZVxuICogKHNhbWUgcHJvcGVydGllcyBhc3NpZ25lZCBpbiB0aGUgc2FtZSBvcmRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZU9iamVjdChcbiAgICB0eXBlOiBUTm9kZVR5cGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHBhcmVudDogTE5vZGUgfCBudWxsLFxuICAgIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgc3RhdGU6IGFueSxcbiAgICBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwpOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICByZXR1cm4ge1xuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICB2aWV3OiBjdXJyZW50VmlldyxcbiAgICBub2RlSW5qZWN0b3I6IHBhcmVudCA/IHBhcmVudC5ub2RlSW5qZWN0b3IgOiBudWxsLFxuICAgIGRhdGE6IHN0YXRlLFxuICAgIHF1ZXJpZXM6IHF1ZXJpZXMsXG4gICAgdE5vZGU6IG51bGwgISxcbiAgICBwTmV4dE9yUGFyZW50OiBudWxsLFxuICAgIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEEgY29tbW9uIHdheSBvZiBjcmVhdGluZyB0aGUgTE5vZGUgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZW0gaGF2ZSBzYW1lIHNoYXBlIHRvXG4gKiBrZWVwIHRoZSBleGVjdXRpb24gY29kZSBtb25vbW9ycGhpYyBhbmQgZmFzdC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBMTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBMTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIExOb2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGRhdGEgQW55IGRhdGEgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gdGhlIExOb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsVmlld0RhdGE/OiBMVmlld0RhdGEgfCBudWxsKTogTEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5WaWV3LCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBudWxsLFxuICAgIGxWaWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IExDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgbFByb2plY3Rpb246IExQcm9qZWN0aW9uKTogTFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIHN0YXRlPzogbnVsbCB8IExWaWV3RGF0YSB8IExDb250YWluZXIgfCBMUHJvamVjdGlvbik6IExFbGVtZW50Tm9kZSZcbiAgICBMVGV4dE5vZGUmTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIGNvbnN0IHBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlICYmIGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhYXMgTE5vZGU7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCB0UGFyZW50ID1cbiAgICAgIHBhcmVudCAmJiBwYXJlbnQudmlldyA9PT0gdmlld0RhdGEgPyBwYXJlbnQudE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuICBsZXQgcXVlcmllcyA9XG4gICAgICAoaXNQYXJlbnQgPyBjdXJyZW50UXVlcmllcyA6IHByZXZpb3VzT3JQYXJlbnROb2RlICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnF1ZXJpZXMpIHx8XG4gICAgICBwYXJlbnQgJiYgcGFyZW50LnF1ZXJpZXMgJiYgcGFyZW50LnF1ZXJpZXMuY2hpbGQoKTtcbiAgY29uc3QgaXNTdGF0ZSA9IHN0YXRlICE9IG51bGw7XG4gIGNvbnN0IG5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGVPYmplY3QodHlwZSwgdmlld0RhdGEsIHBhcmVudCwgbmF0aXZlLCBpc1N0YXRlID8gc3RhdGUgYXMgYW55IDogbnVsbCwgcXVlcmllcyk7XG5cbiAgaWYgKGluZGV4ID09PSAtMSB8fCB0eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAgIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiBUVmlldy5ub2RlLlxuICAgIG5vZGUudE5vZGUgPSAoc3RhdGUgPyAoc3RhdGUgYXMgTFZpZXdEYXRhKVtUVklFV10ubm9kZSA6IG51bGwpIHx8XG4gICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCB0UGFyZW50LCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gICAgLy8gVGhpcyBpcyBhbiBlbGVtZW50IG9yIGNvbnRhaW5lciBvciBwcm9qZWN0aW9uIG5vZGVcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoYWRqdXN0ZWRJbmRleCk7XG4gICAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhO1xuXG4gICAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGFkanVzdGVkSW5kZXggPj0gdERhdGEubGVuZ3RoKSB7XG4gICAgICBjb25zdCB0Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgICAgICBjcmVhdGVUTm9kZSh0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycywgdFBhcmVudCwgbnVsbCk7XG4gICAgICBpZiAoIWlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnROb2RlKSB7XG4gICAgICAgIGNvbnN0IHByZXZpb3VzVE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcbiAgICAgICAgcHJldmlvdXNUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICAgIGlmIChwcmV2aW91c1ROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSBwcmV2aW91c1ROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gICAgbm9kZS50Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICBjdXJyZW50UXVlcmllcyA9IG51bGw7XG4gICAgICBpZiAocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPT0gbnVsbCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS52aWV3ID09PSB2aWV3RGF0YSB8fFxuICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IFZpZXcuXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmNoaWxkID0gbm9kZS50Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBWaWV3IG5vZGVzIGFuZCBob3N0IGVsZW1lbnRzIG5lZWQgdG8gc2V0IHRoZWlyIGhvc3Qgbm9kZSAoY29tcG9uZW50cyBzZXQgaG9zdCBub2RlcyBsYXRlcilcbiAgaWYgKCh0eXBlICYgVE5vZGVUeXBlLlZpZXdPckVsZW1lbnQpID09PSBUTm9kZVR5cGUuVmlld09yRWxlbWVudCAmJiBpc1N0YXRlKSB7XG4gICAgY29uc3QgbFZpZXdEYXRhID0gc3RhdGUgYXMgTFZpZXdEYXRhO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3REZWZpbmVkKFxuICAgICAgICAgICAgICAgICAgICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0sICdsVmlld0RhdGFbSE9TVF9OT0RFXSBzaG91bGQgbm90IGhhdmUgYmVlbiBpbml0aWFsaXplZCcpO1xuICAgIGxWaWV3RGF0YVtIT1NUX05PREVdID0gbm9kZTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIGxWaWV3RGF0YVtUVklFV10ubm9kZSA9IG5vZGUudE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNldEFwcGxpY2F0aW9uU3RhdGUoKSB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gaG9zdE5vZGUgRXhpc3Rpbmcgbm9kZSB0byByZW5kZXIgaW50by5cbiAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpO1xuICAgIHJlbmRlcmVyRmFjdG9yeSA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5O1xuICAgIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZSwgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsLCBudWxsKTtcbiAgICBob3N0ID0gY3JlYXRlTE5vZGUoXG4gICAgICAgIC0xLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwsXG4gICAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpLCB0Vmlldywge30sIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgICBzYW5pdGl6ZXIpKTtcbiAgfVxuICBjb25zdCBob3N0VmlldyA9IGhvc3QuZGF0YSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VmlldywgJ0hvc3Qgbm9kZSBzaG91bGQgaGF2ZSBhbiBMVmlldyBkZWZpbmVkIGluIGhvc3QuZGF0YS4nKTtcbiAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShob3N0LCBob3N0VmlldywgY29udGV4dCwgdGVtcGxhdGUpO1xuICByZXR1cm4gaG9zdDtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld05vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCByZW5kZXJlcjogUmVuZGVyZXIzLCBxdWVyaWVzPzogTFF1ZXJpZXMgfCBudWxsKTogTFZpZXdOb2RlIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjb25zdCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuXG4gIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3Tm9kZTogTFZpZXdOb2RlLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIHJmOiBSZW5kZXJGbGFncyk6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3RGF0YTtcbiAgdHJ5IHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgdFZpZXcudGVtcGxhdGUgIShyZiwgY29udGV4dCk7XG4gICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3Tm9kZS5kYXRhW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIC8vIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSBpcyBjYWxsZWQgdHdpY2UgaW4gZmFjdCwgb25jZSBmb3IgY3JlYXRpb24gb25seSBhbmQgdGhlbiBvbmNlIGZvclxuICAgIC8vIHVwZGF0ZS4gV2hlbiBmb3IgY3JlYXRpb24gb25seSwgbGVhdmVWaWV3KCkgbXVzdCBub3QgdHJpZ2dlciB2aWV3IGhvb2tzLCBub3IgY2xlYW4gZmxhZ3MuXG4gICAgY29uc3QgaXNDcmVhdGlvbk9ubHkgPSAocmYgJiBSZW5kZXJGbGFncy5DcmVhdGUpID09PSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcgISwgaXNDcmVhdGlvbk9ubHkpO1xuICAgIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnROb2RlO1xuICB9XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgbm9kZTogTEVsZW1lbnROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhLCBjb21wb25lbnRPckNvbnRleHQ6IFQsXG4gICAgdGVtcGxhdGU/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBub2RlKTtcbiAgdHJ5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlKSB7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0ZW1wbGF0ZShnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudE9yQ29udGV4dCAhKTtcbiAgICAgIHJlZnJlc2hWaWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzKCk7XG5cbiAgICAgIC8vIEVsZW1lbnQgd2FzIHN0b3JlZCBhdCAwIGluIGRhdGEgYW5kIGRpcmVjdGl2ZSB3YXMgc3RvcmVkIGF0IDAgaW4gZGlyZWN0aXZlc1xuICAgICAgLy8gaW4gcmVuZGVyQ29tcG9uZW50KClcbiAgICAgIHNldEhvc3RCaW5kaW5ncyhfUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyk7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKDAsIEhFQURFUl9PRkZTRVQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiBvZiByZW5kZXJpbmcgZmxhZ3MgZGVwZW5kaW5nIG9uIHdoZW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBpbiBjcmVhdGlvbiBtb2RlIG9yIHVwZGF0ZSBtb2RlLiBCeSBkZWZhdWx0LCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1biB3aXRoIHRoZVxuICogY3JlYXRpb24gYmxvY2sgd2hlbiB0aGUgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlLiBPdGhlcndpc2UsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuXG4gKiBhbG9uZS5cbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIGRvIE5PVCB1c2UgdGhpcyBjb25maWd1cmF0aW9uICh1cGRhdGUgYmxvY2sgYW5kIGNyZWF0ZSBibG9jayBhcmVcbiAqIGFsd2F5cyBydW4gc2VwYXJhdGVseSkuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlckZsYWdzKHZpZXc6IExWaWV3RGF0YSk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gTmFtZXNwYWNlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGVsZW1lbnQgdXNpbmcge0BsaW5rIGVsZW1lbnRTdGFydH0gYW5kIHtAbGluayBlbGVtZW50RW5kfVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIGVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgRE9NIGVsZW1lbnQuIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50RW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlld0RhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQXR0cmlidXRlcyBhbmQgbG9jYWxSZWZzIGFyZSBwYXNzZWQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVyZSBlbGVtZW50cyB3aXRoIGFuIGV2ZW4gaW5kZXhcbiAqIGhvbGQgYW4gYXR0cmlidXRlIG5hbWUgYW5kIGVsZW1lbnRzIHdpdGggYW4gb2RkIGluZGV4IGhvbGQgYW4gYXR0cmlidXRlIHZhbHVlLCBleC46XG4gKiBbJ2lkJywgJ3dhcm5pbmc1JywgJ2NsYXNzJywgJ2FsZXJ0J11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IFJFbGVtZW50IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcblxuICBsZXQgbmF0aXZlOiBSRWxlbWVudDtcblxuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVFbGVtZW50TlMoX2N1cnJlbnROYW1lc3BhY2UsIG5hbWUpO1xuICAgIH1cbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Tm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIG5hdGl2ZSwgdmlld0RhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG4gIHJldHVybiBuYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCkge1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShub2RlLnROb2RlLCB0VmlldywgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCk7XG4gIH1cbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKCk7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCB2YWx1ZUluZGV4ID0gaSArIDE7XG4gICAgICByZXNvbHZlRGlyZWN0aXZlKGRlZiwgdmFsdWVJbmRleCwgbWF0Y2hlcywgdFZpZXcpO1xuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcChtYXRjaGVzW3ZhbHVlSW5kZXhdIGFzIG51bWJlciwgZGVmLCBleHBvcnRzTWFwKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuICovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZTogVE5vZGUpOiBDdXJyZW50TWF0Y2hlc0xpc3R8bnVsbCB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV07XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISkpIHtcbiAgICAgICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICAgICAgKG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSkpLnB1c2goZGVmLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXMgYXMgQ3VycmVudE1hdGNoZXNMaXN0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4sIHZhbHVlSW5kZXg6IG51bWJlciwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0LFxuICAgIHRWaWV3OiBUVmlldyk6IGFueSB7XG4gIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBudWxsKSB7XG4gICAgbWF0Y2hlc1t2YWx1ZUluZGV4XSA9IENJUkNVTEFSO1xuICAgIGNvbnN0IGluc3RhbmNlID0gZGVmLmZhY3RvcnkoKTtcbiAgICAodFZpZXcuZGlyZWN0aXZlcyB8fCAodFZpZXcuZGlyZWN0aXZlcyA9IFtdKSkucHVzaChkZWYpO1xuICAgIHJldHVybiBkaXJlY3RpdmVDcmVhdGUobWF0Y2hlc1t2YWx1ZUluZGV4XSA9IHRWaWV3LmRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxLCBpbnN0YW5jZSwgZGVmKTtcbiAgfSBlbHNlIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBDSVJDVUxBUikge1xuICAgIC8vIElmIHdlIHJldmlzaXQgdGhpcyBkaXJlY3RpdmUgYmVmb3JlIGl0J3MgcmVzb2x2ZWQsIHdlIGtub3cgaXQncyBjaXJjdWxhclxuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZi50eXBlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5mdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soZGlySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IFtdKSkucHVzaChkaXJJbmRleCwgdmlld0RhdGEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBkaXJlY3RpdmUgYW5kIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gTXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMgYXJlIGdlbmVyYXRlZCB3aXRoXG4gIC8vIGluc3RydWN0aW9ucyB0aGF0IGV4cGVjdCBlbGVtZW50IGluZGljZXMgdGhhdCBhcmUgTk9UIGFkanVzdGVkIChlLmcuIGVsZW1lbnRQcm9wZXJ0eSkuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKHRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAodFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIHZpZXdEYXRhLmxlbmd0aCAtIDEgLSBIRUFERVJfT0ZGU0VUKTtcbn1cblxuLyoqIFNldHMgdGhlIGNvbnRleHQgZm9yIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdGhlIGdpdmVuIGluc3RhbmNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcoXG4gICAgaW5qZWN0b3I6IExJbmplY3RvciB8IG51bGwsIGluc3RhbmNlOiBhbnksIHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBpZiAoaW5qZWN0b3IgJiYgaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgIT0gbnVsbCkge1xuICAgIChpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3UmVmPGFueT4pLl9zZXRDb21wb25lbnRDb250ZXh0KHZpZXcsIGluc3RhbmNlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiA9IHREaXJlY3RpdmVzW2ldO1xuICAgICAgZGlyZWN0aXZlQ3JlYXRlKGksIGRlZi5mYWN0b3J5KCksIGRlZik7XG4gICAgfVxuICB9XG59XG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+fCBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXdEYXRhIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSgpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID8gcHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhID0gY3JlYXRlVFZpZXcoLTEsIHRlbXBsYXRlLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIHJldHVybiB7XG4gICAgaWQ6IHZpZXdJbmRleCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IEhFQURFUl9GSUxMRVIuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld0RhdGFcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogLTEsICAgICAgICAvLyBTZXQgaW4gaW5pdEJpbmRpbmdzKClcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKFxuICAgICAgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyLCBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICB0Vmlldy5kaXJlY3RpdmVzID0gW2RlZl07XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlIGFzIFJFbGVtZW50O1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuXG4gIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUxvZ2ljKHZpZXdEYXRhLCBsaXN0ZW5lckZuKTtcbiAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obmF0aXZlLCBldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwRm4odmlld0RhdGEsIGNsZWFudXBGbik7XG4gIH0gZWxzZSB7XG4gICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdCh2aWV3RGF0YSwgbGlzdGVuZXJGbik7XG4gICAgbmF0aXZlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICAgIGNvbnN0IGNsZWFudXBJbnN0YW5jZXMgPSBnZXRDbGVhbnVwKHZpZXdEYXRhKTtcbiAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3RGF0YSkucHVzaChcbiAgICAgICAgICBldmVudE5hbWUsIG5vZGUudE5vZGUuaW5kZXgsIGNsZWFudXBJbnN0YW5jZXMgIS5sZW5ndGggLSAxLCB1c2VDYXB0dXJlKTtcbiAgICB9XG4gIH1cblxuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSBub2RlLnROb2RlO1xuICBpZiAodE5vZGUub3V0cHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gaWYgd2UgY3JlYXRlIFROb2RlIGhlcmUsIGlucHV0cyBtdXN0IGJlIHVuZGVmaW5lZCBzbyB3ZSBrbm93IHRoZXkgc3RpbGwgbmVlZCB0byBiZVxuICAgIC8vIGNoZWNrZWRcbiAgICB0Tm9kZS5vdXRwdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gdmlld0RhdGE7XG4gIGdldENsZWFudXAodmlldykucHVzaChjb250ZXh0KTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4sIHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlld0RhdGEsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgYXMgTEVsZW1lbnROb2RlO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBxdWVyaWVzID0gcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcztcbiAgcXVlcmllcyAmJiBxdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCB0Vmlldyk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50OiBMRWxlbWVudE5vZGUgPSBsb2FkKGluZGV4KTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHN0clZhbHVlID0gc2FuaXRpemVyID09IG51bGwgPyBzdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlKTtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBub2RlID0gbG9hZChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGU7XG4gIC8vIGlmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWRcbiAgaWYgKHROb2RlICYmIHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsLFxuICAgIGRldGFjaGVkOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzTmFtZWQ8VD4oaW5kZXg6IG51bWJlciwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQgPSBsb2FkKGluZGV4KSBhcyBMRWxlbWVudE5vZGU7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobEVsZW1lbnQubmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgY2xhc3NOYW1lYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKiBgZWxlbWVudENsYXNzYCBpbnN0cnVjdGlvbiB3cml0ZXMgdGhlIHZhbHVlIHRvIHRoZSBcImVsZW1lbnQnc1wiIGBjbGFzc05hbWVgIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGEgc2V0IG9mIGNsYXNzZXMgd2hpY2ggc2hvdWxkIGJlIGFwcGxpZWQuIFRoZSBtZXRob2Qgb3ZlcnJpZGVzXG4gKiAgIGFueSBleGlzdGluZyBjbGFzc2VzLiBUaGUgdmFsdWUgaXMgc3RyaW5naWZpZWQgKGB0b1N0cmluZ2ApIGJlZm9yZSBpdCBpcyBhcHBsaWVkIHRvIHRoZVxuICogICBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gVE9ETzogVGhpcyBpcyBhIG5haXZlIGltcGxlbWVudGF0aW9uIHdoaWNoIHNpbXBseSB3cml0ZXMgdmFsdWUgdG8gdGhlIGBjbGFzc05hbWVgLiBJbiB0aGVcbiAgICAvLyBmdXR1cmVcbiAgICAvLyB3ZSB3aWxsIGFkZCBsb2dpYyBoZXJlIHdoaWNoIHdvdWxkIHdvcmsgd2l0aCB0aGUgYW5pbWF0aW9uIGNvZGUuXG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGxvYWQoaW5kZXgpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRDbGFzc05hbWUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShsRWxlbWVudC5uYXRpdmUsICdjbGFzc05hbWUnLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnY2xhc3NOYW1lJ10gPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgZ2l2ZW4gc3R5bGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gc3R5bGVOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKG51bGwgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gdHJhbnNmb3JtIHRoZSB2YWx1ZSB0eXBpY2FsbHkgdXNlZCBmb3JcbiAqICAgICAgICBzYW5pdGl6YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVOYW1lZDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZU5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHN1ZmZpeD86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeE9yU2FuaXRpemVyPzogc3RyaW5nIHwgU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBsRWxlbWVudDogTEVsZW1lbnROb2RlID0gbG9hZChpbmRleCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnc3R5bGUnXS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RyVmFsdWUgPVxuICAgICAgICAgIHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PSAnZnVuY3Rpb24nID8gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ3N0cmluZycpIHN0clZhbHVlID0gc3RyVmFsdWUgKyBzdWZmaXhPclNhbml0aXplcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgc3RyVmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10uc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgc3R5bGVgIHByb3BlcnR5IG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHVzYWdlLlxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gc3R5bGUgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWQuXG4gKiAgIFRoZSBleHBlY3RlZCBzaGFwZSBvZiBgdmFsdWVgIGlzIGFuIG9iamVjdCB3aGVyZSBrZXlzIGFyZSBzdHlsZSBuYW1lcyBhbmQgdGhlIHZhbHVlc1xuICogICBhcmUgdGhlaXIgY29ycmVzcG9uZGluZyB2YWx1ZXMgdG8gc2V0LiBJZiB2YWx1ZSBpcyBmYWxzeSwgdGhlbiB0aGUgc3R5bGUgaXMgcmVtb3ZlZC4gQW4gYWJzZW5jZVxuICogICBvZiBzdHlsZSBkb2VzIG5vdCBjYXVzZSB0aGF0IHN0eWxlIHRvIGJlIHJlbW92ZWQuIGBOT19DSEFOR0VgIGltcGxpZXMgdGhhdCBubyB1cGRhdGUgc2hvdWxkIGJlXG4gKiAgIHBlcmZvcm1lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZTxUPihcbiAgICBpbmRleDogbnVtYmVyLCB2YWx1ZToge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICAvLyBUT0RPOiBUaGlzIGlzIGEgbmFpdmUgaW1wbGVtZW50YXRpb24gd2hpY2ggc2ltcGx5IHdyaXRlcyB2YWx1ZSB0byB0aGUgYHN0eWxlYC4gSW4gdGhlIGZ1dHVyZVxuICAgIC8vIHdlIHdpbGwgYWRkIGxvZ2ljIGhlcmUgd2hpY2ggd291bGQgd29yayB3aXRoIHRoZSBhbmltYXRpb24gY29kZS5cbiAgICBjb25zdCBsRWxlbWVudCA9IGxvYWQoaW5kZXgpIGFzIExFbGVtZW50Tm9kZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGxFbGVtZW50Lm5hdGl2ZSwgJ3N0eWxlJywgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdHlsZSA9IGxFbGVtZW50Lm5hdGl2ZVsnc3R5bGUnXTtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzdHlsZU5hbWU6IHN0cmluZyA9IGtleXNbaV07XG4gICAgICAgIGNvbnN0IHN0eWxlVmFsdWU6IGFueSA9ICh2YWx1ZSBhcyBhbnkpW3N0eWxlTmFtZV07XG4gICAgICAgIGlmIChzdHlsZVZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgICAgICBzdHlsZS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICAgIHN0eWxlLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIGNvbnN0IHRleHROb2RlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dE5vZGUsIG51bGwsIG51bGwpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIHRleHROb2RlLCB2aWV3RGF0YSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGNvbnN0IGV4aXN0aW5nTm9kZSA9IGxvYWQoaW5kZXgpIGFzIExUZXh0Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChleGlzdGluZ05vZGUsICdMTm9kZSBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChleGlzdGluZ05vZGUubmF0aXZlLCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShleGlzdGluZ05vZGUubmF0aXZlLCBzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdOb2RlLm5hdGl2ZS50ZXh0Q29udGVudCA9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRGlyZWN0aXZlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULFxuICAgIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD58IENvbXBvbmVudERlZkludGVybmFsPFQ+KTogVCB7XG4gIGNvbnN0IGluc3RhbmNlID0gYmFzZURpcmVjdGl2ZUNyZWF0ZShpbmRleCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLCAncHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUnKTtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcblxuICBjb25zdCBpc0NvbXBvbmVudCA9IChkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pLnRlbXBsYXRlO1xuICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICBhZGRDb21wb25lbnRMb2dpYyhpbmRleCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhpbmRleCwgZGlyZWN0aXZlRGVmLm9uSW5pdCwgZGlyZWN0aXZlRGVmLmRvQ2hlY2ssIHRWaWV3KTtcblxuICAgIGlmIChkaXJlY3RpdmVEZWYuaG9zdEJpbmRpbmdzKSBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soaW5kZXgpO1xuICB9XG5cbiAgaWYgKHROb2RlICYmIHROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGluZGV4LCBpbnN0YW5jZSwgZGlyZWN0aXZlRGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcoZGVmLnRlbXBsYXRlLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5KTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICB2aWV3RGF0YSwgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihwcmV2aW91c09yUGFyZW50Tm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQsIGRlZi5yZW5kZXJlclR5cGUpLFxuICAgICAgICAgIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgZ2V0Q3VycmVudFNhbml0aXplcigpKSk7XG5cbiAgLy8gV2UgbmVlZCB0byBzZXQgdGhlIGhvc3Qgbm9kZS9kYXRhIGhlcmUgYmVjYXVzZSB3aGVuIHRoZSBjb21wb25lbnQgTE5vZGUgd2FzIGNyZWF0ZWQsXG4gIC8vIHdlIGRpZG4ndCB5ZXQga25vdyBpdCB3YXMgYSBjb21wb25lbnQgKGp1c3QgYW4gZWxlbWVudCkuXG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhc3tkYXRhOiBMVmlld0RhdGF9KS5kYXRhID0gY29tcG9uZW50VmlldztcbiAgKGNvbXBvbmVudFZpZXcgYXMgTFZpZXdEYXRhKVtIT1NUX05PREVdID0gcHJldmlvdXNPclBhcmVudE5vZGUgYXMgTEVsZW1lbnROb2RlO1xuXG4gIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcocHJldmlvdXNPclBhcmVudE5vZGUubm9kZUluamVjdG9yLCBpbnN0YW5jZSwgY29tcG9uZW50Vmlldyk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soZGlyZWN0aXZlSW5kZXgpO1xufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgIGRpcmVjdGl2ZSwgTkdfSE9TVF9TWU1CT0wsIHtlbnVtZXJhYmxlOiBmYWxzZSwgdmFsdWU6IHByZXZpb3VzT3JQYXJlbnROb2RlfSk7XG5cbiAgaWYgKGRpcmVjdGl2ZXMgPT0gbnVsbCkgdmlld0RhdGFbRElSRUNUSVZFU10gPSBkaXJlY3RpdmVzID0gW107XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFOZXh0KGluZGV4LCBkaXJlY3RpdmVzKTtcbiAgZGlyZWN0aXZlc1tpbmRleF0gPSBkaXJlY3RpdmU7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgZmxhZ3MgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MgPVxuICAgICAgICAgIGluZGV4IDw8IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0IHwgZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50IHwgMTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT25seSBuZWVkIHRvIGJ1bXAgdGhlIHNpemUgd2hlbiBzdWJzZXF1ZW50IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWRcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaywgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssXG4gICAgICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzKys7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IGRpUHVibGljID0gZGlyZWN0aXZlRGVmICEuZGlQdWJsaWM7XG4gICAgaWYgKGRpUHVibGljKSBkaVB1YmxpYyhkaXJlY3RpdmVEZWYgISk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMoXG4gICAgICAgIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMRWxlbWVudE5vZGUpLm5hdGl2ZSwgZGlyZWN0aXZlRGVmICEuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cblxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBsZXQgaW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgYXMgSW5pdGlhbElucHV0RGF0YSB8IHVuZGVmaW5lZDtcbiAgaWYgKGluaXRpYWxJbnB1dERhdGEgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3RpdmVJbmRleCA+PSBpbml0aWFsSW5wdXREYXRhLmxlbmd0aCkge1xuICAgIGluaXRpYWxJbnB1dERhdGEgPSBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoZGlyZWN0aXZlSW5kZXgsIGlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAoaW5zdGFuY2UgYXMgYW55KVtpbml0aWFsSW5wdXRzW2ldXSA9IGluaXRpYWxJbnB1dHNbaSArIDFdO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB0byBzdG9yZSB0aGUgaW5pdGlhbCBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgdE5vZGU6IFROb2RlKTogSW5pdGlhbElucHV0RGF0YSB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIHx8ICh0Tm9kZS5pbml0aWFsSW5wdXRzID0gW10pO1xuICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG51bGw7XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIFdlIGRvIG5vdCBhbGxvdyBpbnB1dHMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICAgICAgaSArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IG1pbmlmaWVkSW5wdXROYW1lID0gaW5wdXRzW2F0dHJOYW1lXTtcbiAgICBjb25zdCBhdHRyVmFsdWUgPSBhdHRyc1tpICsgMV07XG5cbiAgICBpZiAobWluaWZpZWRJbnB1dE5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0cyA9XG4gICAgICAgICAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gfHwgKGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gW10pO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gcGFyZW50TE5vZGUgdGhlIExOb2RlIGluIHdoaWNoIHRoZSBjb250YWluZXIncyBjb250ZW50IHdpbGwgYmUgcmVuZGVyZWRcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBwYXJlbnRMTm9kZTogTE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocGFyZW50TE5vZGUsICdjb250YWluZXJzIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG4gIGxldCByZW5kZXJQYXJlbnQgPSBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudExOb2RlLCBjdXJyZW50VmlldykgP1xuICAgICAgcGFyZW50TE5vZGUgYXMgTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIDpcbiAgICAgIG51bGw7XG4gIGlmIChyZW5kZXJQYXJlbnQgJiYgcmVuZGVyUGFyZW50LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgcmVuZGVyUGFyZW50ID0gZ2V0UGFyZW50TE5vZGUocmVuZGVyUGFyZW50IGFzIExWaWV3Tm9kZSkgIS5kYXRhW1JFTkRFUl9QQVJFTlRdO1xuICB9XG4gIHJldHVybiBbXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmID8gbnVsbCA6IDAsICAvLyBhY3RpdmUgaW5kZXhcbiAgICBjdXJyZW50VmlldywgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlld3NcbiAgICByZW5kZXJQYXJlbnQgYXMgTEVsZW1lbnROb2RlXG4gIF07XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBMQ29udGFpbmVyTm9kZS5cbiAqXG4gKiBPbmx5IGBMVmlld05vZGVzYCBjYW4gZ28gaW50byBgTENvbnRhaW5lck5vZGVzYC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZSBPcHRpb25hbCBpbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lcihcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZT86IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzLFxuICAgIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoY3VycmVudFBhcmVudCwgdmlld0RhdGEpO1xuXG4gIGNvbnN0IGNvbW1lbnQgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICBjb25zdCBub2RlID1cbiAgICAgIGNyZWF0ZUxOb2RlKGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwsIGxDb250YWluZXIpO1xuICBhcHBlbmRDaGlsZChnZXRQYXJlbnRMTm9kZShub2RlKSwgY29tbWVudCwgdmlld0RhdGEpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5vZGUudE5vZGUudFZpZXdzID0gdGVtcGxhdGUgP1xuICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGUsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpIDpcbiAgICAgICAgW107XG4gIH1cblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZSh2aWV3RGF0YSwgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBub2RlLmRhdGEpO1xuXG4gIGNvbnN0IHF1ZXJpZXMgPSBub2RlLnF1ZXJpZXM7XG4gIGlmIChxdWVyaWVzKSB7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lcltRVUVSSUVTXSA9IHF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICAvLyBjaGVjayBpZiBhIGdpdmVuIGNvbnRhaW5lciBub2RlIG1hdGNoZXNcbiAgICBxdWVyaWVzLmFkZE5vZGUobm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGxvYWQoaW5kZXgpIGFzIExOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lck5vZGUuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXJOb2RlIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgVmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lciA9IHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbmV4dEluZGV4ID0gY29udGFpbmVyLmRhdGFbQUNUSVZFX0lOREVYXSAhO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGNvbnRhaW5lci5kYXRhW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICByZW1vdmVWaWV3KGNvbnRhaW5lciwgbmV4dEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEdvZXMgb3ZlciBkeW5hbWljIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXMgdGhlbVxuICogYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlld0RhdGE6IExWaWV3RGF0YSkge1xuICBmb3IgKGxldCBjdXJyZW50ID0gZ2V0TFZpZXdDaGlsZChsVmlld0RhdGEpOyBjdXJyZW50ICE9PSBudWxsOyBjdXJyZW50ID0gY3VycmVudFtORVhUXSkge1xuICAgIC8vIE5vdGU6IGN1cnJlbnQgY2FuIGJlIGFuIExWaWV3RGF0YSBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seSBpbnRlcmVzdGVkXG4gICAgLy8gaW4gTENvbnRhaW5lci4gV2UgY2FuIHRlbGwgaXQncyBhbiBMQ29udGFpbmVyIGJlY2F1c2UgaXRzIGxlbmd0aCBpcyBsZXNzIHRoYW4gdGhlIExWaWV3RGF0YVxuICAgIC8vIGhlYWRlci5cbiAgICBpZiAoY3VycmVudC5sZW5ndGggPCBIRUFERVJfT0ZGU0VUICYmIGN1cnJlbnRbQUNUSVZFX0lOREVYXSA9PT0gbnVsbCkge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gY3VycmVudCBhcyBMQ29udGFpbmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250YWluZXJbVklFV1NdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3Tm9kZSA9IGNvbnRhaW5lcltWSUVXU11baV07XG4gICAgICAgIC8vIFRoZSBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmUgbm90IG5lZWRlZCBoZXJlIGFzIGFuIGV4aXN0aW5nIHZpZXcgaXMgb25seSBiZWluZyByZWZyZXNoZWQuXG4gICAgICAgIGNvbnN0IGR5bmFtaWNWaWV3RGF0YSA9IGxWaWV3Tm9kZS5kYXRhO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShcbiAgICAgICAgICAgIGxWaWV3Tm9kZSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEsIFJlbmRlckZsYWdzLlVwZGF0ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXJOb2RlIHdoZXJlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGNvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLCB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdOb2RlfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lck5vZGUuZGF0YVtWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldLmRhdGFbVFZJRVddLmlkO1xuICAgIGlmICh2aWV3QXRQb3NpdGlvbklkID09PSB2aWV3QmxvY2tJZCkge1xuICAgICAgcmV0dXJuIHZpZXdzW2ldO1xuICAgIH0gZWxzZSBpZiAodmlld0F0UG9zaXRpb25JZCA8IHZpZXdCbG9ja0lkKSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgdGhhdCBzaG91bGQgbm90IGJlIGF0IHRoaXMgcG9zaXRpb24gLSByZW1vdmVcbiAgICAgIHJlbW92ZVZpZXcoY29udGFpbmVyTm9kZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB3aXRoIGlkIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2ggaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIGNvbnN0IGNvbnRhaW5lciA9XG4gICAgICAoaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSkgYXMgTENvbnRhaW5lck5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyLmRhdGE7XG4gIGxldCB2aWV3Tm9kZTogTFZpZXdOb2RlfG51bGwgPSBzY2FuRm9yVmlldyhjb250YWluZXIsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdOb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIGNvbnN0IG5ld1ZpZXcgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgIHJlbmRlcmVyLCBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcodmlld0Jsb2NrSWQsIGNvbnRhaW5lciksIG51bGwsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgbmV3Vmlld1tRVUVSSUVTXSA9IGxDb250YWluZXJbUVVFUklFU10gIS5jcmVhdGVWaWV3KCk7XG4gICAgfVxuXG4gICAgZW50ZXJWaWV3KFxuICAgICAgICBuZXdWaWV3LCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKHZpZXdCbG9ja0lkLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbmV3VmlldykpO1xuICB9XG4gIGlmIChjb250YWluZXIpIHtcbiAgICBpZiAoY3JlYXRpb25Nb2RlKSB7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyhjb250YWluZXIsIHZpZXdOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGdldFJlbmRlckZsYWdzKHZpZXdOb2RlLmRhdGEpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIFRWaWV3IChlLmcuIHN0YXRpYyBkYXRhKSBmb3IgdGhlIGFjdGl2ZSBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEVhY2ggZW1iZWRkZWQgdmlldyBibG9jayBtdXN0IGNyZWF0ZSBvciByZXRyaWV2ZSBpdHMgb3duIFRWaWV3LiBPdGhlcndpc2UsIHRoZSBlbWJlZGRlZCB2aWV3J3NcbiAqIHN0YXRpYyBkYXRhIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB3b3VsZCBvdmVyd3JpdGUgdGhlIHN0YXRpYyBkYXRhIGZvciBhIG5vZGUgaW4gdGhlIHZpZXcgYWJvdmVcbiAqIGl0IHdpdGggdGhlIHNhbWUgaW5kZXggKHNpbmNlIGl0J3MgaW4gdGhlIHNhbWUgdGVtcGxhdGUpLlxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIGluZGV4IG9mIHRoZSBUVmlldyBpbiBUTm9kZS50Vmlld3NcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdJbmRleDogbnVtYmVyLCBwYXJlbnQ6IExDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gKHBhcmVudCAhLnROb2RlIGFzIFRDb250YWluZXJOb2RlKS50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9XG4gICAgICAgIGNyZWF0ZVRWaWV3KHZpZXdJbmRleCwgbnVsbCwgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgcmVmcmVzaFZpZXcoKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3RGF0YVtIT1NUX05PREVdIGFzIExWaWV3Tm9kZTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc1BhcmVudCwgZmFsc2UsICdpc1BhcmVudCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggRGlyZWN0aXZlIGluZGV4IGluIExWaWV3RGF0YVtESVJFQ1RJVkVTXVxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3RGF0YVtdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoYWRqdXN0ZWRFbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gdmlld0RhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGVsZW1lbnQuZGF0YSwgYENvbXBvbmVudCdzIGhvc3Qgbm9kZSBzaG91bGQgaGF2ZSBhbiBMVmlld0RhdGEgYXR0YWNoZWQuYCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZWxlbWVudC5kYXRhICE7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGRpcmVjdGl2ZUluZGV4LCBkaXJlY3RpdmVzICEpO1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0VmlldywgZWxlbWVudCwgZ2V0RGlyZWN0aXZlSW5zdGFuY2UoZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUluZGV4XSkpO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihcbiAgICBpbmRleDogbnVtYmVyLCBzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IG5vT2ZOb2RlQnVja2V0cyA9IHNlbGVjdG9ycyA/IHNlbGVjdG9ycy5sZW5ndGggKyAxIDogMTtcbiAgY29uc3QgZGlzdHJpYnV0ZWROb2RlcyA9IG5ldyBBcnJheTxMTm9kZVtdPihub09mTm9kZUJ1Y2tldHMpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vT2ZOb2RlQnVja2V0czsgaSsrKSB7XG4gICAgZGlzdHJpYnV0ZWROb2Rlc1tpXSA9IFtdO1xuICB9XG5cbiAgY29uc3QgY29tcG9uZW50Tm9kZTogTEVsZW1lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3Qodmlld0RhdGEpO1xuICBsZXQgY29tcG9uZW50Q2hpbGQgPSBnZXRDaGlsZExOb2RlKGNvbXBvbmVudE5vZGUpO1xuXG4gIHdoaWxlIChjb21wb25lbnRDaGlsZCAhPT0gbnVsbCkge1xuICAgIC8vIGV4ZWN1dGUgc2VsZWN0b3IgbWF0Y2hpbmcgbG9naWMgaWYgYW5kIG9ubHkgaWY6XG4gICAgLy8gLSB0aGVyZSBhcmUgc2VsZWN0b3JzIGRlZmluZWRcbiAgICAvLyAtIGEgbm9kZSBoYXMgYSB0YWcgbmFtZSAvIGF0dHJpYnV0ZXMgdGhhdCBjYW4gYmUgbWF0Y2hlZFxuICAgIGlmIChzZWxlY3RvcnMpIHtcbiAgICAgIGNvbnN0IG1hdGNoZWRJZHggPSBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQudE5vZGUsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKTtcbiAgICAgIGRpc3RyaWJ1dGVkTm9kZXNbbWF0Y2hlZElkeF0ucHVzaChjb21wb25lbnRDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRpc3RyaWJ1dGVkTm9kZXNbMF0ucHVzaChjb21wb25lbnRDaGlsZCk7XG4gICAgfVxuXG4gICAgY29tcG9uZW50Q2hpbGQgPSBnZXROZXh0TE5vZGUoY29tcG9uZW50Q2hpbGQpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFOZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIHN0b3JlKGluZGV4LCBkaXN0cmlidXRlZE5vZGVzKTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBsaW5rZWQgbGlzdCBvZiBhIHByb2plY3Rpb24gbm9kZSwgYnkgYXBwZW5kaW5nIGFub3RoZXIgbGlua2VkIGxpc3QuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25Ob2RlIFByb2plY3Rpb24gbm9kZSB3aG9zZSBwcm9qZWN0ZWQgbm9kZXMgbGlua2VkIGxpc3QgaGFzIHRvIGJlIHVwZGF0ZWRcbiAqIEBwYXJhbSBhcHBlbmRlZEZpcnN0IEZpcnN0IG5vZGUgb2YgdGhlIGxpbmtlZCBsaXN0IHRvIGFwcGVuZC5cbiAqIEBwYXJhbSBhcHBlbmRlZExhc3QgTGFzdCBub2RlIG9mIHRoZSBsaW5rZWQgbGlzdCB0byBhcHBlbmQuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgcHJvamVjdGlvbk5vZGU6IExQcm9qZWN0aW9uTm9kZSxcbiAgICBhcHBlbmRlZEZpcnN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwsXG4gICAgYXBwZW5kZWRMYXN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICEhYXBwZW5kZWRGaXJzdCwgISFhcHBlbmRlZExhc3QsXG4gICAgICAgICAgICAgICAgICAgJ2FwcGVuZGVkRmlyc3QgY2FuIGJlIG51bGwgaWYgYW5kIG9ubHkgaWYgYXBwZW5kZWRMYXN0IGlzIGFsc28gbnVsbCcpO1xuICBpZiAoIWFwcGVuZGVkTGFzdCkge1xuICAgIC8vIG5vdGhpbmcgdG8gYXBwZW5kXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb2plY3Rpb25Ob2RlRGF0YSA9IHByb2plY3Rpb25Ob2RlLmRhdGE7XG4gIGlmIChwcm9qZWN0aW9uTm9kZURhdGEudGFpbCkge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS50YWlsLnBOZXh0T3JQYXJlbnQgPSBhcHBlbmRlZEZpcnN0O1xuICB9IGVsc2Uge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS5oZWFkID0gYXBwZW5kZWRGaXJzdDtcbiAgfVxuICBwcm9qZWN0aW9uTm9kZURhdGEudGFpbCA9IGFwcGVuZGVkTGFzdDtcbiAgYXBwZW5kZWRMYXN0LnBOZXh0T3JQYXJlbnQgPSBwcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gbG9jYWxJbmRleCAtIGluZGV4IHVuZGVyIHdoaWNoIGRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0ZWQgbm9kZXMgd2FzIG1lbW9yaXplZFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIGxvY2FsSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCB7aGVhZDogbnVsbCwgdGFpbDogbnVsbH0pO1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIG1lbW9yaXplZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KHZpZXdEYXRhKTtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBjb21wb25lbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhO1xuICBjb25zdCBkaXN0cmlidXRlZE5vZGVzID0gbG9hZEludGVybmFsKGxvY2FsSW5kZXgsIGNvbXBvbmVudExWaWV3KSBhcyBBcnJheTxMTm9kZVtdPjtcbiAgY29uc3Qgbm9kZXNGb3JTZWxlY3RvciA9IGRpc3RyaWJ1dGVkTm9kZXNbc2VsZWN0b3JJbmRleF07XG5cbiAgLy8gYnVpbGQgdGhlIGxpbmtlZCBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlc0ZvclNlbGVjdG9yLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgbm9kZVRvUHJvamVjdCA9IG5vZGVzRm9yU2VsZWN0b3JbaV07XG4gICAgaWYgKG5vZGVUb1Byb2plY3QudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIFJlcHJvamVjdGluZyBhIHByb2plY3Rpb24gLT4gYXBwZW5kIHRoZSBsaXN0IG9mIHByZXZpb3VzbHkgcHJvamVjdGVkIG5vZGVzXG4gICAgICBjb25zdCBwcmV2aW91c2x5UHJvamVjdGVkID0gKG5vZGVUb1Byb2plY3QgYXMgTFByb2plY3Rpb25Ob2RlKS5kYXRhO1xuICAgICAgYXBwZW5kVG9Qcm9qZWN0aW9uTm9kZShub2RlLCBwcmV2aW91c2x5UHJvamVjdGVkLmhlYWQsIHByZXZpb3VzbHlQcm9qZWN0ZWQudGFpbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFByb2plY3RpbmcgYSBzaW5nbGUgbm9kZVxuICAgICAgYXBwZW5kVG9Qcm9qZWN0aW9uTm9kZShcbiAgICAgICAgICBub2RlLCBub2RlVG9Qcm9qZWN0IGFzIExUZXh0Tm9kZSB8IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnRQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgaWYgKGNhbkluc2VydE5hdGl2ZU5vZGUoY3VycmVudFBhcmVudCwgdmlld0RhdGEpKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoY3VycmVudFBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5WaWV3KTtcbiAgICAvLyBwcm9jZXNzIGVhY2ggbm9kZSBpbiB0aGUgbGlzdCBvZiBwcm9qZWN0ZWQgbm9kZXM6XG4gICAgbGV0IG5vZGVUb1Byb2plY3Q6IExOb2RlfG51bGwgPSBub2RlLmRhdGEuaGVhZDtcbiAgICBjb25zdCBsYXN0Tm9kZVRvUHJvamVjdCA9IG5vZGUuZGF0YS50YWlsO1xuICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IGN1cnJlbnRQYXJlbnQudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICAoZ2V0UGFyZW50TE5vZGUoY3VycmVudFBhcmVudCkgYXMgTENvbnRhaW5lck5vZGUpLmRhdGFbUkVOREVSX1BBUkVOVF0gISA6XG4gICAgICAgIGN1cnJlbnRQYXJlbnQgYXMgTEVsZW1lbnROb2RlO1xuXG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCwgdmlld0RhdGEsXG4gICAgICAgICAgcmVuZGVyUGFyZW50KTtcbiAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2l2ZW4gYSBjdXJyZW50IHZpZXcsIGZpbmRzIHRoZSBuZWFyZXN0IGNvbXBvbmVudCdzIGhvc3QgKExFbGVtZW50KS5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIExWaWV3RGF0YSBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnRIb3N0KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogTEVsZW1lbnROb2RlIHtcbiAgbGV0IHZpZXdSb290TE5vZGUgPSBsVmlld0RhdGFbSE9TVF9OT0RFXTtcblxuICB3aGlsZSAodmlld1Jvb3RMTm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3RGF0YVtQQVJFTlRdLCAnbFZpZXdEYXRhLnBhcmVudCcpO1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gICAgdmlld1Jvb3RMTm9kZSA9IGxWaWV3RGF0YVtIT1NUX05PREVdO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdSb290TE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1Jvb3RMTm9kZS5kYXRhLCAnbm9kZS5kYXRhJyk7XG5cbiAgcmV0dXJuIHZpZXdSb290TE5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3RGF0YVtdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld0RhdGF8TENvbnRhaW5lcj4oXG4gICAgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgYWRqdXN0ZWRIb3N0SW5kZXg6IG51bWJlciwgc3RhdGU6IFQpOiBUIHtcbiAgaWYgKGN1cnJlbnRWaWV3W1RBSUxdKSB7XG4gICAgY3VycmVudFZpZXdbVEFJTF0gIVtORVhUXSA9IHN0YXRlO1xuICB9IGVsc2UgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuY2hpbGRJbmRleCA9IGFkanVzdGVkSG9zdEluZGV4O1xuICB9XG4gIGN1cnJlbnRWaWV3W1RBSUxdID0gc3RhdGU7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlld0RhdGEgZGlydHkuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobm9kZTogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIC8vIEJlY2F1c2UgZGF0YSBmbG93cyBkb3duIHRoZSBjb21wb25lbnQgdHJlZSwgYW5jZXN0b3JzIGRvIG5vdCBuZWVkIHRvIGJlIG1hcmtlZCBkaXJ0eVxuICBpZiAobm9kZS5kYXRhICYmICEobm9kZS5kYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhW0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgc28gaXRzIGhvc3QgdmlldyBhbmQgaXRzIGFuY2VzdG9yIHZpZXdzIHdpbGwgYmUgbWFya2VkIGRpcnR5XG4gKiB3aGVuZXZlciB0aGUgZXZlbnQgZmlyZXMuIE5lY2Vzc2FyeSB0byBzdXBwb3J0IE9uUHVzaCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5TG9naWMoXG4gICAgdmlldzogTFZpZXdEYXRhLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogKGU6IEV2ZW50KSA9PiBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gQWxzbyB3cmFwcyB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChcbiAgICB2aWV3OiBMVmlld0RhdGEsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX21hcmtWaWV3RGlydHkoZTogRXZlbnQpIHtcbiAgICBtYXJrVmlld0RpcnR5KHZpZXcpO1xuICAgIGlmIChsaXN0ZW5lckZuKGUpID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkodmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGxldCBjdXJyZW50VmlldzogTFZpZXdEYXRhID0gdmlldztcblxuICB3aGlsZSAoY3VycmVudFZpZXdbUEFSRU5UXSAhPSBudWxsKSB7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gIH1cbiAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnRWaWV3W0NPTlRFWFRdLCAncm9vdENvbnRleHQnKTtcbiAgc2NoZWR1bGVUaWNrKGN1cnJlbnRWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gYGRldGVjdENoYW5nZXNgLCBidXQgaW52b2tlZCBvbiByb290IGNvbXBvbmVudC4gQWRkaXRpb25hbGx5LCBgdGlja2BcbiAqIGV4ZWN1dGVzIGxpZmVjeWNsZSBob29rcyBhbmQgY29uZGl0aW9uYWxseSBjaGVja3MgY29tcG9uZW50cyBiYXNlZCBvbiB0aGVpclxuICogYENoYW5nZURldGVjdGlvblN0cmF0ZWd5YCBhbmQgZGlydGluZXNzLlxuICpcbiAqIFRoZSBwcmVmZXJyZWQgd2F5IHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBpcyB0byBjYWxsIGBtYXJrRGlydHlgLiBgbWFya0RpcnR5YCBpbnRlcm5hbGx5XG4gKiBzY2hlZHVsZXMgYHRpY2tgIHVzaW5nIGEgc2NoZWR1bGVyIGluIG9yZGVyIHRvIGNvYWxlc2NlIG11bHRpcGxlIGBtYXJrRGlydHlgIGNhbGxzIGludG8gYVxuICogc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gcnVuLiBCeSBkZWZhdWx0LCB0aGUgc2NoZWR1bGVyIGlzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLCBidXQgY2FuXG4gKiBiZSBjaGFuZ2VkIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBhbmQgcHJvdmlkaW5nIHRoZSBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aWNrPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KGNvbXBvbmVudCk7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gcm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShyb290Q29tcG9uZW50KTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3ROb2RlLmRhdGEsICdDb21wb25lbnQgaG9zdCBub2RlIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhbiBMVmlldycpO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdE5vZGUsIGdldFJvb3RWaWV3KHJvb3RDb21wb25lbnQpLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdEYXRhYCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3RGF0YWAuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudDogYW55KTogTFZpZXdEYXRhIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIGxldCBsVmlld0RhdGEgPSBsRWxlbWVudE5vZGUudmlldztcbiAgd2hpbGUgKGxWaWV3RGF0YVtQQVJFTlRdKSB7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuIFRoZXJlIHNob3VsZFxuICogYmUgdmVyeSBsaXR0bGUgcmVhc29uIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiBkaXJlY3RseSBzaW5jZSBhIHByZWZlcnJlZCB3YXkgdG8gZG8gY2hhbmdlXG4gKiBkZXRlY3Rpb24gaXMgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gdGhlIGNvbXBvbmVudCBhbmQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBjYWxsIHRoaXMgbWV0aG9kXG4gKiBhdCBzb21lIGZ1dHVyZSBwb2ludCBpbiB0aW1lLiBUaGlzIGlzIGJlY2F1c2UgYSBzaW5nbGUgdXNlciBhY3Rpb24gb2Z0ZW4gcmVzdWx0cyBpbiBtYW55XG4gKiBjb21wb25lbnRzIGJlaW5nIGludmFsaWRhdGVkIGFuZCBjYWxsaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gZWFjaCBjb21wb25lbnQgc3luY2hyb25vdXNseVxuICogd291bGQgYmUgaW5lZmZpY2llbnQuIEl0IGlzIGJldHRlciB0byB3YWl0IHVudGlsIGFsbCBjb21wb25lbnRzIGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kXG4gKiB0aGVuIHBlcmZvcm0gc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gYWNyb3NzIGFsbCBvZiB0aGUgY29tcG9uZW50c1xuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3RGF0YSBpbnN0YW5jZS4nKTtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGhvc3ROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLCBob3N0Tm9kZSwgY29tcG9uZW50KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSB0cnVlO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXMoY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcbiAgfVxufVxuXG4vKiogQ2hlY2tzIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgcHJvdmlkZWQuIERvZXMgbm90IGdhdGUgb24gZGlydHkgY2hlY2tzIG9yIGV4ZWN1dGUgZG9DaGVjay4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4oXG4gICAgaG9zdFZpZXc6IExWaWV3RGF0YSwgaG9zdE5vZGU6IExFbGVtZW50Tm9kZSwgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3ROb2RlKTtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBjb25zdCB0ZW1wbGF0ZSA9IGhvc3RUVmlldy50ZW1wbGF0ZSAhO1xuICBjb25zdCB2aWV3UXVlcnkgPSBob3N0VFZpZXcudmlld1F1ZXJ5O1xuXG4gIHRyeSB7XG4gICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgIGNyZWF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGhvc3RWaWV3W0ZMQUdTXSwgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZShnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaFZpZXcoKTtcbiAgICB1cGRhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3UXVlcnk8VD4oXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSAmJiAoZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVZpZXdRdWVyeTxUPih2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cblxuLyoqXG4gKiBNYXJrIHRoZSBjb21wb25lbnQgYXMgZGlydHkgKG5lZWRpbmcgY2hhbmdlIGRldGVjdGlvbikuXG4gKlxuICogTWFya2luZyBhIGNvbXBvbmVudCBkaXJ0eSB3aWxsIHNjaGVkdWxlIGEgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGlzXG4gKiBjb21wb25lbnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLiBNYXJraW5nIGFuIGFscmVhZHkgZGlydHlcbiAqIGNvbXBvbmVudCBhcyBkaXJ0eSBpcyBhIG5vb3AuIE9ubHkgb25lIG91dHN0YW5kaW5nIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGNhbiBiZSBzY2hlZHVsZWQgcGVyIGNvbXBvbmVudCB0cmVlLiAoVHdvIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIHdpdGhcbiAqIHNlcGFyYXRlIGByZW5kZXJDb21wb25lbnRgIHdpbGwgaGF2ZSBzZXBhcmF0ZSBzY2hlZHVsZXJzKVxuICpcbiAqIFdoZW4gdGhlIHJvb3QgY29tcG9uZW50IGlzIGJvb3RzdHJhcHBlZCB3aXRoIGByZW5kZXJDb21wb25lbnRgLCBhIHNjaGVkdWxlclxuICogY2FuIGJlIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIG1hcmsgYXMgZGlydHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBtYXJrVmlld0RpcnR5KGxFbGVtZW50Tm9kZS52aWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgTk9fQ0hBTkdFIHtcbiAgLy8gVGhpcyBpcyBhIGJyYW5kIHRoYXQgZW5zdXJlcyB0aGF0IHRoaXMgdHlwZSBjYW4gbmV2ZXIgbWF0Y2ggYW55dGhpbmcgZWxzZVxuICBicmFuZDogJ05PX0NIQU5HRSc7XG59XG5cbi8qKiBBIHNwZWNpYWwgdmFsdWUgd2hpY2ggZGVzaWduYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLiAqL1xuZXhwb3J0IGNvbnN0IE5PX0NIQU5HRSA9IHt9IGFzIE5PX0NIQU5HRTtcblxuLyoqXG4gKiAgSW5pdGlhbGl6ZXMgdGhlIGJpbmRpbmcgc3RhcnQgaW5kZXguIFdpbGwgZ2V0IGlubGluZWQuXG4gKlxuICogIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nIHJlbGF0ZWQgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiAgKGllIGBiaW5kKClgLCBgaW50ZXJwb2xhdGlvblgoKWAsIGBwdXJlRnVuY3Rpb25YKClgKVxuICovXG5mdW5jdGlvbiBpbml0QmluZGluZ3MoKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ0JpbmRpbmcgaW5kZXggc2hvdWxkIG5vdCB5ZXQgYmUgc2V0ICcgKyB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSk7XG4gIGlmICh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA9PT0gLTEpIHtcbiAgICB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA9IHZpZXdEYXRhLmxlbmd0aDtcbiAgfVxuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIFJlc2VydmVzIHNsb3RzIGZvciBwdXJlIGZ1bmN0aW9ucyAoYHB1cmVGdW5jdGlvblhgIGluc3RydWN0aW9ucylcbiAqXG4gKiBCaW5kaW5ncyBmb3IgcHVyZSBmdW5jdGlvbnMgYXJlIHN0b3JlZCBhZnRlciB0aGUgTE5vZGVzIGluIHRoZSBkYXRhIGFycmF5IGJ1dCBiZWZvcmUgdGhlIGJpbmRpbmcuXG4gKlxuICogIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAqICB8ICBMTm9kZXMgLi4uIHwgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyB8IHJlZ3VsYXIgYmluZGluZ3MgLyBpbnRlcnBvbGF0aW9ucyB8XG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF5cbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUVmlldy5iaW5kaW5nU3RhcnRJbmRleFxuICpcbiAqIFB1cmUgZnVuY3Rpb24gaW5zdHJ1Y3Rpb25zIGFyZSBnaXZlbiBhbiBvZmZzZXQgZnJvbSBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC5cbiAqIFN1YnRyYWN0aW5nIHRoZSBvZmZzZXQgZnJvbSBUVmlldy5iaW5kaW5nU3RhcnRJbmRleCBnaXZlcyB0aGUgZmlyc3QgaW5kZXggd2hlcmUgdGhlIGJpbmRpbmdzXG4gKiBhcmUgc3RvcmVkLlxuICpcbiAqIE5PVEU6IHJlc2VydmVTbG90cyBpbnN0cnVjdGlvbnMgYXJlIG9ubHkgZXZlciBhbGxvd2VkIGF0IHRoZSB2ZXJ5IGVuZCBvZiB0aGUgY3JlYXRpb24gYmxvY2tcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc2VydmVTbG90cyhudW1TbG90czogbnVtYmVyKSB7XG4gIC8vIEluaXQgdGhlIHNsb3RzIHdpdGggYSB1bmlxdWUgYE5PX0NIQU5HRWAgdmFsdWUgc28gdGhhdCB0aGUgZmlyc3QgY2hhbmdlIGlzIGFsd2F5cyBkZXRlY3RlZFxuICAvLyB3aGV0aGVyIGl0IGhhcHBlbnMgb3Igbm90IGR1cmluZyB0aGUgZmlyc3QgY2hhbmdlIGRldGVjdGlvbiBwYXNzIC0gcHVyZSBmdW5jdGlvbnMgY2hlY2tzXG4gIC8vIG1pZ2h0IGJlIHNraXBwZWQgd2hlbiBzaG9ydC1jaXJjdWl0ZWQuXG4gIHZpZXdEYXRhLmxlbmd0aCArPSBudW1TbG90cztcbiAgdmlld0RhdGEuZmlsbChOT19DSEFOR0UsIC1udW1TbG90cyk7XG4gIC8vIFdlIG5lZWQgdG8gaW5pdGlhbGl6ZSB0aGUgYmluZGluZyBpbiBjYXNlIGEgYHB1cmVGdW5jdGlvblhgIGtpbmQgb2YgYmluZGluZyBpbnN0cnVjdGlvbiBpc1xuICAvLyBjYWxsZWQgZmlyc3QgaW4gdGhlIHVwZGF0ZSBzZWN0aW9uLlxuICBpbml0QmluZGluZ3MoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIHRoZSBiaW5kaW5nIGluZGV4IGJlZm9yZSBleGVjdXRpbmcgYW55IGBwdXJlRnVuY3Rpb25YYCBpbnN0cnVjdGlvbnMuXG4gKlxuICogVGhlIGluZGV4IG11c3QgYmUgcmVzdG9yZWQgYWZ0ZXIgdGhlIHB1cmUgZnVuY3Rpb24gaXMgZXhlY3V0ZWRcbiAqXG4gKiB7QGxpbmsgcmVzZXJ2ZVNsb3RzfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbW92ZUJpbmRpbmdJbmRleFRvUmVzZXJ2ZWRTbG90KG9mZnNldDogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgY3VycmVudFNsb3QgPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIG9mZnNldDtcbiAgcmV0dXJuIGN1cnJlbnRTbG90O1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIHRoZSBiaW5kaW5nIGluZGV4IHRvIHRoZSBnaXZlbiB2YWx1ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHR5cGljYWxseSB1c2VkIHRvIHJlc3RvcmUgdGhlIGluZGV4IGFmdGVyIGEgYHB1cmVGdW5jdGlvblhgIGhhc1xuICogYmVlbiBleGVjdXRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IGluZGV4O1xufVxuXG4vKipcbiAqIENyZWF0ZSBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgZXhwcmVzc2lvbnMuXG4gKlxuICogSWYgdGhlcmUgYXJlIDEgdG8gOCBleHByZXNzaW9ucyBgaW50ZXJwb2xhdGlvbjEoKWAgdG8gYGludGVycG9sYXRpb244KClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gKiBUaG9zZSBhcmUgZmFzdGVyIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVlZCB0byBjcmVhdGUgYW4gYXJyYXkgb2YgZXhwcmVzc2lvbnMgYW5kIGl0ZXJhdGUgb3ZlciBpdC5cbiAqXG4gKiBgdmFsdWVzYDpcbiAqIC0gaGFzIHN0YXRpYyB0ZXh0IGF0IGV2ZW4gaW5kZXhlcyxcbiAqIC0gaGFzIGV2YWx1YXRlZCBleHByZXNzaW9ucyBhdCBvZGQgaW5kZXhlcy5cbiAqXG4gKiBSZXR1cm5zIHRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvblYodmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG5cbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYwKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgICAgICAgICAgICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY0KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY2KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgaTYgKyBzdHJpbmdpZnkodjcpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gIH1cbiAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSB2YWx1ZTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gY3VycmVudCBgdmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCB2aWV3RGF0YSk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGFueSBgTFZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkSW50ZXJuYWw8VD4oaW5kZXg6IG51bWJlciwgYXJyOiBMVmlld0RhdGEpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4ICsgSEVBREVSX09GRlNFVCwgYXJyKTtcbiAgcmV0dXJuIGFycltpbmRleCArIEhFQURFUl9PRkZTRVRdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSB0aGUgYGRpcmVjdGl2ZXNgIGFycmF5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWREaXJlY3RpdmU8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVzLCAnRGlyZWN0aXZlcyBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgZGlyLicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gIHJldHVybiBkaXJlY3RpdmVzICFbaW5kZXhdO1xufVxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlIGFuZCBpbmNyZW1lbnRzIHRoZSBiaW5kaW5nIGluZGV4LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnN1bWVCaW5kaW5nKCk6IGFueSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgdmlld0RhdGFbdmlld0RhdGFbQklORElOR19JTkRFWF1dLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBpZiAodmlld0RhdGFbQklORElOR19JTkRFWF0gPT09IC0xKSBpbml0QmluZGluZ3MoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF07XG5cbiAgaWYgKGJpbmRpbmdJbmRleCA+PSB2aWV3RGF0YS5sZW5ndGgpIHtcbiAgICB2aWV3RGF0YVt2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrXSA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKGlzRGlmZmVyZW50KHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoY3JlYXRpb25Nb2RlLCBjaGVja05vQ2hhbmdlc01vZGUsIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICB2aWV3RGF0YVt2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrXSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKys7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB0aGUgbGF0ZXN0IHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2YWx1ZTogYW55KTogYW55IHtcbiAgYmluZGluZ1VwZGF0ZWQodmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihleHAxOiBhbnksIGV4cDI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIoZXhwMywgZXhwNCkgfHwgZGlmZmVyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFZpZXcoKTogVFZpZXcge1xuICByZXR1cm4gdFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVJbnN0YW5jZTxUPihpbnN0YW5jZU9yQXJyYXk6IFQgfCBbVF0pOiBUIHtcbiAgLy8gRGlyZWN0aXZlcyB3aXRoIGNvbnRlbnQgcXVlcmllcyBzdG9yZSBhbiBhcnJheSBpbiBkaXJlY3RpdmVzW2RpcmVjdGl2ZUluZGV4XVxuICAvLyB3aXRoIHRoZSBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgaW5kZXhcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoaW5zdGFuY2VPckFycmF5KSA/IGluc3RhbmNlT3JBcnJheVswXSA6IGluc3RhbmNlT3JBcnJheTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKSB7XG4gIGFzc2VydEVxdWFsKGlzUGFyZW50LCB0cnVlLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhhc1BhcmVudCgpIHtcbiAgYXNzZXJ0RGVmaW5lZChnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSksICdwcmV2aW91c09yUGFyZW50Tm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZShpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBhcnIubGVuZ3RoLCBpbmRleCwgYGluZGV4ICR7aW5kZXh9IGV4cGVjdGVkIHRvIGJlIGF0IHRoZSBlbmQgb2YgYXJyIChsZW5ndGggJHthcnIubGVuZ3RofSlgKTtcbn1cblxuLyoqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIHJlc2VydmVkIHNsb3RzIHNob3VsZCBiZSBzZXQgYE5PX0NIQU5HRWAuXG4gKlxuICogSWYgbm90LCB0aGV5IG1pZ2h0IG5vdCBoYXZlIGJlZW4gYWN0dWFsbHkgcmVzZXJ2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0OiBudW1iZXIsIG51bVNsb3RzOiBudW1iZXIpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gc2xvdE9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzOyBpKyspIHtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHZpZXdEYXRhW3N0YXJ0SW5kZXggKyBpXSwgTk9fQ0hBTkdFLFxuICAgICAgICAgICdUaGUgcmVzZXJ2ZWQgc2xvdHMgc2hvdWxkIGJlIHNldCB0byBgTk9fQ0hBTkdFYCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzJyk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZTxUPihjb21wb25lbnQ6IFQpOiBMRWxlbWVudE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdleHBlY3RpbmcgY29tcG9uZW50IGdvdCBudWxsJyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IChjb21wb25lbnQgYXMgYW55KVtOR19IT1NUX1NZTUJPTF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdvYmplY3QgaXMgbm90IGEgY29tcG9uZW50Jyk7XG4gIHJldHVybiBsRWxlbWVudE5vZGU7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5leHBvcnQgY29uc3QgUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTO1xuIl19