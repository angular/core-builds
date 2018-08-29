/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual } from './assert';
import { attachLViewDataToNode } from './element_discovery';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, RENDER_PARENT, VIEWS } from './interfaces/container';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, canInsertNativeNode, createTextNode, findComponentHost, getLViewChild, getParentLNode, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { allocStylingContext, createStylingContextTemplate, renderStyling as renderElementStyles, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling';
import { assertDataInRangeInternal, isDifferent, loadElementInternal, loadInternal, stringify } from './util';
/**
 * Directive (D) sets a property on all component instances using this constant as a key and the
 * component's host node (LElement) as the value. This is used in methods like detectChanges to
 * facilitate jumping from an instance to the host node.
 */
export var NG_HOST_SYMBOL = '__ngHostLNode__';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = Promise.resolve(null);
/**
 * TView.data needs to fill the same number of slots as the LViewData header
 * so the indices of nodes are consistent between LViewData and TView.data.
 *
 * It's much faster to keep a blueprint of the pre-filled array and slice it
 * than it is to create a new array and fill it each time a TView is created.
 */
var HEADER_FILLER = new Array(HEADER_OFFSET).fill(null);
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export var CIRCULAR = '__CIRCULAR__';
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
var renderer;
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
var rendererFactory;
export function getRendererFactory() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return rendererFactory;
}
var currentElementNode = null;
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
/**
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LViewData` to only those elements.
 */
var elementDepthCount;
/**
 * Returns the current OpaqueViewState instance.
 *
 * Used in conjunction with the restoreView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 */
export function getCurrentView() {
    return viewData;
}
/**
 * Restores `contextViewData` to the given OpaqueViewState instance.
 *
 * Used in conjunction with the getCurrentView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 *
 * @param viewToRestore The OpaqueViewState instance to restore.
 */
export function restoreView(viewToRestore) {
    contextViewData = viewToRestore;
}
/** Used to set the parent property when nodes are created. */
var previousOrParentNode;
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
 */
var isParent;
var tView;
var currentQueries;
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (inb this previousOrParentNode points to a node on which we
 * create content queries).
 */
export function getOrCreateCurrentQueries(QueryType) {
    var tNode = previousOrParentNode.tNode;
    // if this is the first content query on a node, any existing LQueries needs to be cloned
    // in subsequent template passes, the cloning occurs before directive instantiation.
    if (previousOrParentNode.data !== viewData && !isContentQueryHost(tNode)) {
        currentQueries && (currentQueries = currentQueries.clone());
        tNode.flags |= 16384 /* hasContentQuery */;
    }
    return currentQueries || (currentQueries = new QueryType(null, null, null));
}
/**
 * This property gets set before entering a template.
 */
var creationMode;
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
var viewData;
/**
 * Internal function that returns the current LViewData instance.
 *
 * The getCurrentView() instruction should be used for anything public.
 */
export function _getViewData() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return viewData;
}
/**
 * The last viewData retrieved by nextContext().
 * Allows building nextContext() and reference() calls.
 *
 * e.g. const inner = x().$implicit; const outer = x().$implicit;
 */
var contextViewData = null;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
var directives;
function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = []);
}
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
}
/**
 * In this mode, any changes in bindings will throw an ExpressionChangedAfterChecked error.
 *
 * Necessary to support ChangeDetectorRef.checkNoChanges().
 */
var checkNoChangesMode = false;
/** Whether or not this is the first time the current view has been processed. */
var firstTemplatePass = true;
/**
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.hostBindingStartIndex + any hostVars before the given dir.
 */
var bindingRootIndex = -1;
// top level variables should not be exported for performance reasons (PERF_NOTES.md)
export function getBindingRoot() {
    return bindingRootIndex;
}
/**
 * Swap the current state with a new state.
 *
 * For performance reasons we store the state in the top level of the module.
 * This way we minimize the number of properties to read. Whenever a new view
 * is entered we have to store the state for later, and when the view is
 * exited the state has to be restored
 *
 * @param newView New state to become active
 * @param host Element to which the View is a child of
 * @returns the previous state;
 */
export function enterView(newView, host) {
    var oldView = viewData;
    directives = newView && newView[DIRECTIVES];
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    bindingRootIndex = newView && tView.bindingStartIndex;
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
 * @param newView New state to become active
 * @param creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 */
export function leaveView(newView, creationOnly) {
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(directives, tView.viewHooks, tView.viewCheckHooks, creationMode);
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
        executeHooks(directives, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    setHostBindings(tView.hostBindings);
    refreshChildComponents(tView.components);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(bindings) {
    if (bindings != null) {
        bindingRootIndex = viewData[BINDING_INDEX] = tView.hostBindingStartIndex;
        var defs = tView.directives;
        for (var i = 0; i < bindings.length; i += 2) {
            var dirIndex = bindings[i];
            var def = defs[dirIndex];
            def.hostBindings(dirIndex, bindings[i + 1]);
            bindingRootIndex = viewData[BINDING_INDEX] = bindingRootIndex + def.hostVars;
        }
    }
}
/** Refreshes content queries for all directives in the given view. */
function refreshContentQueries(tView) {
    if (tView.contentQueries != null) {
        for (var i = 0; i < tView.contentQueries.length; i += 2) {
            var directiveDefIdx = tView.contentQueries[i];
            var directiveDef = tView.directives[directiveDefIdx];
            directiveDef.contentQueriesRefresh(directiveDefIdx, tView.contentQueries[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components) {
    if (components != null) {
        for (var i = 0; i < components.length; i++) {
            componentRefresh(components[i]);
        }
    }
}
export function executeInitAndContentHooks() {
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
        executeHooks(directives, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
export function createLViewData(renderer, tView, context, flags, sanitizer) {
    var instance = tView.blueprint.slice();
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
 */
export function createLNodeObject(type, currentView, parent, native, state) {
    return {
        native: native,
        view: currentView,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        tNode: null,
        dynamicLContainerNode: null
    };
}
export function createLNode(index, type, native, name, attrs, state) {
    var parent = isParent ? previousOrParentNode :
        previousOrParentNode && getParentLNode(previousOrParentNode);
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var tParent = parent && parent.view === viewData ? parent.tNode : null;
    var isState = state != null;
    var node = createLNodeObject(type, viewData, parent, native, isState ? state : null);
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = (state ? state[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        var adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        var tData = tView.data;
        ngDevMode && assertLessThan(adjustedIndex, viewData.length, "Slot should have been initialized with null");
        viewData[adjustedIndex] = node;
        if (tData[adjustedIndex] == null) {
            var tNode = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentNode) {
                var previousTNode = previousOrParentNode.tNode;
                previousTNode.next = tNode;
                if (previousTNode.dynamicContainerNode)
                    previousTNode.dynamicContainerNode.next = tNode;
            }
        }
        node.tNode = tData[adjustedIndex];
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
        var lViewData = state;
        ngDevMode &&
            assertEqual(lViewData[HOST_NODE], null, 'lViewData[HOST_NODE] should not have been initialized');
        lViewData[HOST_NODE] = node;
        if (firstTemplatePass)
            lViewData[TVIEW].node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
/**
 * When LNodes are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 */
export function adjustBlueprintForNewNode(view) {
    var tView = view[TVIEW];
    if (tView.firstTemplatePass) {
        tView.hostBindingStartIndex++;
        tView.blueprint.push(null);
        view.push(null);
    }
}
//////////////////////////
//// Render
//////////////////////////
/**
 * Resets the application state.
 */
export function resetComponentState() {
    isParent = false;
    previousOrParentNode = null;
    elementDepthCount = 0;
}
/**
 *
 * @param hostNode Existing node to render into.
 * @param templateFn Template function with the instructions.
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param context to pass into the template.
 * @param providedRendererFactory renderer factory to use
 * @param host The host element node to use
 * @param directives Directive defs that should be used for matching
 * @param pipes Pipe defs that should be used for matching
 */
export function renderTemplate(hostNode, templateFn, consts, vars, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetComponentState();
        rendererFactory = providedRendererFactory;
        var tView_1 = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLViewData(providedRendererFactory.createRenderer(null, null), tView_1, {}, 2 /* CheckAlways */, sanitizer));
    }
    var hostView = host.data;
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, templateFn);
    return host;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewNode(tView, context, declarationView, renderer, queries) {
    var _isParent = isParent;
    var _previousOrParentNode = previousOrParentNode;
    isParent = true;
    previousOrParentNode = null;
    var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    var viewNode = createLNode(-1, 2 /* View */, null, null, null, lView);
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
 */
export function renderEmbeddedTemplate(viewNode, tView, context, rf) {
    var _isParent = isParent;
    var _previousOrParentNode = previousOrParentNode;
    var oldView;
    if (viewNode.data[PARENT] == null && viewNode.data[CONTEXT] && !tView.template) {
        // This is a root view inside the view tree
        tickRootContext(viewNode.data[CONTEXT]);
    }
    else {
        try {
            isParent = true;
            previousOrParentNode = null;
            oldView = enterView(viewNode.data, viewNode);
            namespaceHTML();
            tView.template(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews();
            }
            else {
                viewNode.data[TVIEW].firstTemplatePass = firstTemplatePass = false;
            }
        }
        finally {
            // renderEmbeddedTemplate() is called twice in fact, once for creation only and then once for
            // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
            var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(oldView, isCreationOnly);
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
 * @param level The relative level of the view from which to grab context compared to contextVewData
 * @returns context
 */
export function nextContext(level) {
    if (level === void 0) { level = 1; }
    contextViewData = walkUpViews(level, contextViewData);
    return contextViewData[CONTEXT];
}
export function renderComponentOrTemplate(node, hostView, componentOrContext, templateFn) {
    var oldView = enterView(hostView, node);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (templateFn) {
            namespaceHTML();
            templateFn(getRenderFlags(hostView), componentOrContext);
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
 */
function getRenderFlags(view) {
    return view[FLAGS] & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
//////////////////////////
//// Namespace
//////////////////////////
var _currentNamespace = null;
export function namespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg/';
}
export function namespaceMathML() {
    _currentNamespace = 'http://www.w3.org/1998/MathML/';
}
export function namespaceHTML() {
    _currentNamespace = null;
}
//////////////////////////
//// Element
//////////////////////////
/**
 * Creates an empty element using {@link elementStart} and {@link elementEnd}
 *
 * @param index Index of the element in the data array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 */
export function element(index, name, attrs, localRefs) {
    elementStart(index, name, attrs, localRefs);
    elementEnd();
}
/**
 * Creates a logical container for other nodes (<ng-container>) backed by a comment node in the DOM.
 * The instruction must later be followed by `elementContainerEnd()` call.
 *
 * @param index Index of the element in the LViewData array
 * @param attrs Set of attributes to be used when matching directives.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 */
export function elementContainerStart(index, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    var node = createLNode(index, 4 /* ElementContainer */, native, null, attrs || null, null);
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(node, localRefs);
}
/** Mark the end of the <ng-container>. */
export function elementContainerEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentNode = getParentLNode(previousOrParentNode);
    }
    ngDevMode && assertNodeType(previousOrParentNode, 4 /* ElementContainer */);
    currentQueries && (currentQueries = currentQueries.addNode(previousOrParentNode));
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
}
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the LViewData array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 */
export function elementStart(index, name, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    var node = createLNode(index, 3 /* Element */, native, name, attrs || null, null);
    currentElementNode = node;
    if (attrs) {
        setUpAttributes(native, attrs);
    }
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(node, localRefs);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (elementDepthCount === 0) {
        attachLViewDataToNode(native, viewData);
    }
    elementDepthCount++;
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param overriddenRenderer Optional A renderer to override the default one
 * @returns the element created
 */
export function elementCreate(name, overriddenRenderer) {
    var native;
    var rendererToUse = overriddenRenderer || renderer;
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
function nativeNodeLocalRefExtractor(lNode) {
    return lNode.native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param lNode LNode for which directive and locals should be created
 * @param localRefs Local refs of the node in question
 * @param localRefExtractor mapping function that extracts local ref value from LNode
 */
function createDirectivesAndLocals(lNode, localRefs, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = nativeNodeLocalRefExtractor; }
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
 */
function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    var exportsMap = localRefs ? { '': -1 } : null;
    var matches = tView.currentMatches = findDirectiveMatches(tNode);
    if (matches) {
        for (var i = 0; i < matches.length; i += 2) {
            var def = matches[i];
            var valueIndex = i + 1;
            resolveDirective(def, valueIndex, matches, tView);
            saveNameToExportMap(matches[valueIndex], def, exportsMap);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
}
/** Matches the current node against all available selectors. */
function findDirectiveMatches(tNode) {
    var registry = tView.directiveRegistry;
    var matches = null;
    if (registry) {
        for (var i = 0; i < registry.length; i++) {
            var def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors)) {
                if (def.template) {
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
    return matches;
}
export function resolveDirective(def, valueIndex, matches, tView) {
    if (matches[valueIndex] === null) {
        matches[valueIndex] = CIRCULAR;
        var instance = def.factory();
        (tView.directives || (tView.directives = [])).push(def);
        return directiveCreate(matches[valueIndex] = tView.directives.length - 1, instance, def);
    }
    else if (matches[valueIndex] === CIRCULAR) {
        // If we revisit this directive before it's resolved, we know it's circular
        throwCyclicDependencyError(def.type);
    }
    return null;
}
/** Stores index of component's host element so it will be queued for view refresh during CD. */
function queueComponentIndexForCheck() {
    if (firstTemplatePass) {
        (tView.components || (tView.components = [])).push(previousOrParentNode.tNode.index);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
export function queueHostBindingForCheck(dirIndex, hostVars) {
    // Must subtract the header offset because hostBindings functions are generated with
    // instructions that expect element indices that are NOT adjusted (e.g. elementProperty).
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    for (var i = 0; i < hostVars; i++) {
        tView.blueprint.push(NO_CHANGE);
        viewData.push(NO_CHANGE);
    }
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, previousOrParentNode.tNode.index - HEADER_OFFSET);
}
/** Sets the context for a ChangeDetectorRef to the given instance. */
export function initChangeDetectorIfExisting(injector, instance, view) {
    if (injector && injector.changeDetectorRef != null) {
        injector.changeDetectorRef._setComponentContext(view, instance);
    }
}
export function isContentQueryHost(tNode) {
    return (tNode.flags & 16384 /* hasContentQuery */) !== 0;
}
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, "Directives should only be instantiated directly after first template pass");
    var tNode = previousOrParentNode.tNode;
    var count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(tNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        var start = tNode.flags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var tDirectives = tView.directives;
        for (var i = start; i < end; i++) {
            var def = tDirectives[i];
            directiveCreate(i, def.factory(), def);
        }
    }
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        var localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (var i = 0; i < localRefs.length; i += 2) {
            var index = exportsMap[localRefs[i + 1]];
            if (index == null)
                throw new Error("Export of name '" + localRefs[i + 1] + "' not found!");
            localNames.push(localRefs[i], index);
        }
    }
}
/**
 * Builds up an export map as directives are created, so local refs can be quickly mapped
 * to their directive instances.
 */
function saveNameToExportMap(index, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs)
            exportsMap[def.exportAs] = index;
        if (def.template)
            exportsMap[''] = index;
    }
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LViewData in the same order as they are loaded in the template with load().
 */
function saveResolvedLocalsInData(lNode, localRefExtractor) {
    var localNames = lNode.tNode.localNames;
    if (localNames) {
        var localIndex = lNode.tNode.index + 1;
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ? localRefExtractor(lNode) : directives[index];
            viewData[localIndex++] = value;
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param templateFn The template from which to get static data
 * @param consts The number of nodes, local refs, and pipes in this view
 * @param vars The number of bindings and pure function bindings in this view
 * @param directives Directive defs that should be saved on TView
 * @param pipes Pipe defs that should be saved on TView
 * @returns TView
 */
function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return templateFn.ngPrivateData ||
        (templateFn.ngPrivateData =
            createTView(-1, templateFn, consts, vars, directives, pipes, viewQuery));
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param templateFn Template function
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 */
export function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    var bindingStartIndex = HEADER_OFFSET + consts;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    var initialViewLength = bindingStartIndex + vars;
    var blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[TVIEW] = {
        id: viewIndex,
        blueprint: blueprint,
        template: templateFn,
        viewQuery: viewQuery,
        node: null,
        data: HEADER_FILLER.slice(),
        childIndex: -1,
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
        currentMatches: null
    };
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    var blueprint = new Array(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex);
    blueprint[CONTAINER_INDEX] = -1;
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
function setUpAttributes(native, attrs) {
    var isProc = isProceduralRenderer(renderer);
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === NG_PROJECT_AS_ATTR_NAME) {
            i += 2;
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (attrName === 0 /* NamespaceURI */) {
                // Namespaced attributes
                var namespaceURI = attrs[i + 1];
                var attrName_1 = attrs[i + 2];
                var attrVal = attrs[i + 3];
                isProc ?
                    renderer
                        .setAttribute(native, attrName_1, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName_1, attrVal);
                i += 4;
            }
            else {
                // Standard attributes
                var attrVal = attrs[i + 1];
                isProc ?
                    renderer
                        .setAttribute(native, attrName, attrVal) :
                    native.setAttribute(attrName, attrVal);
                i += 2;
            }
        }
    }
}
export function createError(text, token) {
    return new Error("Renderer: " + text + " [" + stringify(token) + "]");
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export function locateHostElement(factory, elementOrSelector) {
    ngDevMode && assertDataInRange(-1);
    rendererFactory = factory;
    var defaultRenderer = factory.createRenderer(null, null);
    var rNode = typeof elementOrSelector === 'string' ?
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
 * @param rNode Render host element.
 * @param def ComponentDef
 *
 * @returns LElementNode created
 */
export function hostElement(tag, rNode, def, sanitizer) {
    resetComponentState();
    var node = createLNode(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
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
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export function listener(eventName, listenerFn, useCapture) {
    if (useCapture === void 0) { useCapture = false; }
    ngDevMode && assertPreviousIsParent();
    ngDevMode && assertNodeOfPossibleTypes(previousOrParentNode, 3 /* Element */);
    var node = previousOrParentNode;
    var native = node.native;
    ngDevMode && ngDevMode.rendererAddEventListener++;
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    if (isProceduralRenderer(renderer)) {
        var wrappedListener = wrapListenerWithDirtyLogic(viewData, listenerFn);
        var cleanupFn = renderer.listen(native, eventName, wrappedListener);
        storeCleanupFn(viewData, cleanupFn);
    }
    else {
        var wrappedListener = wrapListenerWithDirtyAndDefault(viewData, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        var cleanupInstances = getCleanup(viewData);
        cleanupInstances.push(wrappedListener);
        if (firstTemplatePass) {
            getTViewCleanup(viewData).push(eventName, node.tNode.index, cleanupInstances.length - 1, useCapture);
        }
    }
    var tNode = node.tNode;
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(node.tNode.flags, 1 /* Output */);
    }
    var outputs = tNode.outputs;
    var outputData;
    if (outputs && (outputData = outputs[eventName])) {
        createOutput(outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 */
function createOutput(outputs, listener) {
    for (var i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(outputs[i], directives);
        var subscription = directives[outputs[i]][outputs[i + 1]].subscribe(listener);
        storeCleanupWithContext(viewData, subscription, subscription.unsubscribe);
    }
}
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export function storeCleanupWithContext(view, context, cleanupFn) {
    if (!view)
        view = viewData;
    getCleanup(view).push(context);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(cleanupFn, view[CLEANUP].length - 1);
    }
}
/**
 * Saves the cleanup function itself in LView.cleanupInstances.
 *
 * This is necessary for functions that are wrapped with their contexts, like in renderer2
 * listeners.
 *
 * On the first template pass, the index of the cleanup function is saved in TView.
 */
export function storeCleanupFn(view, cleanupFn) {
    getCleanup(view).push(cleanupFn);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push(view[CLEANUP].length - 1, null);
    }
}
/** Mark the end of the element. */
export function elementEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentNode = getParentLNode(previousOrParentNode);
    }
    ngDevMode && assertNodeType(previousOrParentNode, 3 /* Element */);
    currentQueries && (currentQueries = currentQueries.addNode(previousOrParentNode));
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
    currentElementNode = null;
    elementDepthCount--;
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param name name The name of the attribute.
 * @param value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param sanitizer An optional function used to sanitize the value.
 */
export function elementAttribute(index, name, value, sanitizer) {
    if (value !== NO_CHANGE) {
        var element_1 = loadElement(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1.native, name) :
                element_1.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var strValue = sanitizer == null ? stringify(value) : sanitizer(value);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element_1.native, name, strValue) :
                element_1.native.setAttribute(name, strValue);
        }
    }
}
/**
 * Update a property on an Element.
 *
 * If the property name also exists as an input property on one of the element's directives,
 * the component property will be set instead of the element property. This check must
 * be conducted at runtime so child components that add new @Inputs don't have to be re-compiled.
 *
 * @param index The index of the element to update in the data array
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 */
export function elementProperty(index, propName, value, sanitizer) {
    if (value === NO_CHANGE)
        return;
    var node = loadElement(index);
    var tNode = node.tNode;
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(node.tNode.flags, 0 /* Input */);
    }
    var inputData = tNode && tNode.inputs;
    var dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        markDirtyIfOnPush(node);
    }
    else {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value) : value;
        var native = node.native;
        ngDevMode && ngDevMode.rendererSetProperty++;
        isProceduralRenderer(renderer) ? renderer.setProperty(native, propName, value) :
            (native.setProperty ? native.setProperty(propName, value) :
                native[propName] = value);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param type The type of the node
 * @param adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param parent The parent of this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
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
 */
function setInputsForProperty(inputs, value) {
    for (var i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(inputs[i], directives);
        directives[inputs[i]][inputs[i + 1]] = value;
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param number lNodeFlags logical node flags
 * @param Direction direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNodeFlags, direction) {
    var count = tNodeFlags & 4095 /* DirectiveCountMask */;
    var propStore = null;
    if (count > 0) {
        var start = tNodeFlags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var isInput = direction === 0 /* Input */;
        var defs = tView.directives;
        for (var i = start; i < end; i++) {
            var directiveDef = defs[i];
            var propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (var publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    var internalName = propertyAliasMap[publicName];
                    var hasProperty = propStore.hasOwnProperty(publicName);
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
 * @param index The index of the element to update in the data array
 * @param className Name of class to toggle. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value A value indicating if a given class should be added or removed.
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
 * @param index Index value which will be allocated to store styling data for the element.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param classDeclarations A key/value array of CSS classes that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any classes placed on the element by multiple (`[class]`) or singular (`[class.named]`)
 *   bindings. If a class binding changes its value to a falsy value then the matching initial
 *   class value that are passed in here will be applied to the element (if matched).
 * @param styleDeclarations A key/value array of CSS styles that will be registered on the element.
 *   Each individual style will be used on the element as long as it is not overridden
 *   by any styles placed on the element by multiple (`[style]`) or singular (`[style.prop]`)
 *   bindings. If a style binding changes its value to null then the initial styling
 *   values that are passed in here will be applied to the element (if matched).
 * @param styleSanitizer An optional sanitizer function that will be used (if provided)
 *   to sanitize the any CSS property values that are applied to the element (during rendering).
 */
export function elementStyling(classDeclarations, styleDeclarations, styleSanitizer) {
    var lElement = currentElementNode;
    var tNode = lElement.tNode;
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
 * @param index Index of the style allocation. See: `elementStyling`.
 */
function getStylingContext(index) {
    var stylingContext = load(index);
    if (!Array.isArray(stylingContext)) {
        var lElement = stylingContext;
        var tNode = lElement.tNode;
        ngDevMode &&
            assertDefined(tNode.stylingTemplate, 'getStylingContext() called before elementStyling()');
        stylingContext = viewData[index + HEADER_OFFSET] =
            allocStylingContext(lElement, tNode.stylingTemplate);
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
 * @param index Index of the element's styling storage that will be rendered.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
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
 * @param index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param styleIndex Index of the style property on this element. (Monotonically increasing.)
 * @param styleName Name of property. Because it is going to DOM this is not subject to
 *        renaming as part of minification.
 * @param value New value to write (null to remove).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 */
export function elementStyleProp(index, styleIndex, value, suffix) {
    var valueToAdd = null;
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
            valueToAdd = value;
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
 * @param index Index of the element's styling storage to change in the data array.
 *        (Note that this is not the element index, but rather an index value allocated
 *        specifically for element styling--the index must be the next index after the element
 *        index.)
 * @param classes A key/value style map of CSS classes that will be added to the given element.
 *        Any missing classes (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's list of CSS classes.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 */
export function elementStylingMap(index, classes, styles) {
    updateStylingMap(getStylingContext(index), classes, styles);
}
//////////////////////////
//// Text
//////////////////////////
/**
 * Create static text node
 *
 * @param index Index of the node in the data array
 * @param value Value to write. This value will be stringified.
 */
export function text(index, value) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    var textNode = createTextNode(value, renderer);
    var node = createLNode(index, 3 /* Element */, textNode, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(getParentLNode(node), textNode, viewData);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper interpolation(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export function textBinding(index, value) {
    if (value !== NO_CHANGE) {
        ngDevMode && assertDataInRange(index + HEADER_OFFSET);
        var existingNode = loadElement(index);
        ngDevMode && assertDefined(existingNode, 'LNode should exist');
        ngDevMode && assertDefined(existingNode.native, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
            existingNode.native.textContent = stringify(value);
    }
}
//////////////////////////
//// Directive
//////////////////////////
/**
 * Create a directive and their associated content queries.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 */
export function directiveCreate(directiveDefIdx, directive, directiveDef) {
    var instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef);
    ngDevMode && assertDefined(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    var tNode = previousOrParentNode.tNode;
    var isComponent = directiveDef.template;
    if (isComponent) {
        addComponentLogic(directiveDefIdx, directive, directiveDef);
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(directiveDefIdx, directiveDef.onInit, directiveDef.doCheck, tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(directiveDefIdx, directiveDef.hostVars);
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, instance, directiveDef.inputs, tNode);
    }
    if (directiveDef.contentQueries) {
        directiveDef.contentQueries();
    }
    return instance;
}
function addComponentLogic(directiveIndex, instance, def) {
    var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var componentView = addToViewTree(viewData, previousOrParentNode.tNode.index, createLViewData(rendererFactory.createRenderer(previousOrParentNode.native, def), tView, instance, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    previousOrParentNode.data = componentView;
    componentView[HOST_NODE] = previousOrParentNode;
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, componentView);
    if (firstTemplatePass)
        queueComponentIndexForCheck();
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 */
export function baseDirectiveCreate(index, directive, directiveDef) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    Object.defineProperty(directive, NG_HOST_SYMBOL, { enumerable: false, value: previousOrParentNode });
    if (directives == null)
        viewData[DIRECTIVES] = directives = [];
    ngDevMode && assertDataNext(index, directives);
    directives[index] = directive;
    if (firstTemplatePass) {
        var flags = previousOrParentNode.tNode.flags;
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
        var diPublic = directiveDef.diPublic;
        if (diPublic)
            diPublic(directiveDef);
    }
    if (directiveDef.attributes != null && previousOrParentNode.tNode.type == 3 /* Element */) {
        setUpAttributes(previousOrParentNode.native, directiveDef.attributes);
    }
    return directive;
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data for this node
 */
function setInputsFromAttrs(directiveIndex, instance, inputs, tNode) {
    var initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    var initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (var i = 0; i < initialInputs.length; i += 2) {
            instance[initialInputs[i]] = initialInputs[i + 1];
        }
    }
}
/**
 * Generates initialInputData for a node and stores it in the template's static storage
 * so subsequent template invocations don't have to recalculate it.
 *
 * initialInputData is an array containing values that need to be set as input properties
 * for directives on this node, but only once on creation. We need this array to support
 * the case where you set an @Input property of a directive using attribute-like syntax.
 * e.g. if you have a `name` @Input, you can set it once like this:
 *
 * <my-component name="Bess"></my-component>
 *
 * @param directiveIndex Index to store the initial input data
 * @param inputs The list of inputs from the directive def
 * @param tNode The static data on this node
 */
function generateInitialInputs(directiveIndex, inputs, tNode) {
    var initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    var attrs = tNode.attrs;
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        var minifiedInputName = inputs[attrName];
        var attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            var inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, attrValue);
        }
        i += 2;
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param parentLNode the LNode in which the container's content will be rendered
 * @param currentView The parent view of the LContainer
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export function createLContainer(parentLNode, currentView, isForViewContainerRef) {
    ngDevMode && assertDefined(parentLNode, 'containers should have a parent');
    var renderParent = canInsertNativeNode(parentLNode, currentView) ?
        parentLNode :
        null;
    if (renderParent && renderParent.tNode.type === 2 /* View */) {
        renderParent = getParentLNode(renderParent).data[RENDER_PARENT];
    }
    return [
        isForViewContainerRef ? null : 0,
        currentView,
        null,
        null,
        [],
        renderParent
    ];
}
/**
 * Creates an LContainerNode for an ng-template (dynamically-inserted view), e.g.
 *
 * <ng-template #foo>
 *    <div></div>
 * </ng-template>
 *
 * @param index The index of the container in the data array
 * @param templateFn Inline template
 * @param consts The number of nodes, local refs, and pipes for this template
 * @param vars The number of bindings for this template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 * @param localRefExtractor A function which extracts local-refs values from the template.
 *        Defaults to the current element associated with the local-ref.
 */
export function template(index, templateFn, consts, vars, tagName, attrs, localRefs, localRefExtractor) {
    // TODO: consider a separate node type for templates
    var node = containerInternal(index, tagName || null, attrs || null, localRefs || null);
    if (firstTemplatePass) {
        node.tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
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
 * @param index The index of the container in the data array
 */
export function container(index) {
    var node = containerInternal(index, null, null, null);
    firstTemplatePass && (node.tNode.tViews = []);
    isParent = false;
}
function containerInternal(index, tagName, attrs, localRefs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
    var currentParent = isParent ? previousOrParentNode : getParentLNode(previousOrParentNode);
    var lContainer = createLContainer(currentParent, viewData);
    ngDevMode && ngDevMode.rendererCreateComment++;
    var comment = renderer.createComment(ngDevMode ? 'container' : '');
    var node = createLNode(index, 0 /* Container */, comment, tagName, attrs, lContainer);
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
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    previousOrParentNode = loadElement(index);
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    isParent = true;
    previousOrParentNode.data[ACTIVE_INDEX] = 0;
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
 */
export function containerRefreshEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentNode = getParentLNode(previousOrParentNode);
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    var container = previousOrParentNode;
    ngDevMode && assertNodeType(container, 0 /* Container */);
    var nextIndex = container.data[ACTIVE_INDEX];
    // remove extra views at the end of the container
    while (nextIndex < container.data[VIEWS].length) {
        removeView(container, nextIndex);
    }
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes them
 * by executing an associated template function.
 */
function refreshDynamicEmbeddedViews(lViewData) {
    for (var current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
        // Note: current can be an LViewData or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === null) {
            var container_1 = current;
            for (var i = 0; i < container_1[VIEWS].length; i++) {
                var lViewNode = container_1[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                var dynamicViewData = lViewNode.data;
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(lViewNode, dynamicViewData[TVIEW], dynamicViewData[CONTEXT], 2 /* Update */);
            }
        }
    }
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param containerNode where to search for views
 * @param startIdx starting index in the views array to search from
 * @param viewBlockId exact view block id to look for
 * @returns index of a found view or -1 if not found
 */
function scanForView(containerNode, startIdx, viewBlockId) {
    var views = containerNode.data[VIEWS];
    for (var i = startIdx; i < views.length; i++) {
        var viewAtPositionId = views[i].data[TVIEW].id;
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
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId, consts, vars) {
    var container = (isParent ? previousOrParentNode : getParentLNode(previousOrParentNode));
    ngDevMode && assertNodeType(container, 0 /* Container */);
    var lContainer = container.data;
    var viewNode = scanForView(container, lContainer[ACTIVE_INDEX], viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        var newView = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, consts, vars, container), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            newView[QUERIES] = lContainer[QUERIES].createView();
        }
        enterView(newView, viewNode = createLNode(viewBlockId, 2 /* View */, null, null, null, newView));
    }
    if (container) {
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(container, viewNode, lContainer[ACTIVE_INDEX]);
        }
        lContainer[ACTIVE_INDEX]++;
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
 * @param viewIndex The index of the TView in TNode.tViews
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param vars The number of bindings and pure function bindings in this template
 * @param parent The parent container in which to look for the view's static data
 * @returns TView
 */
function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    var containerTViews = parent.tNode.tViews;
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    refreshDescendantViews();
    isParent = false;
    previousOrParentNode = viewData[HOST_NODE];
    leaveView(viewData[PARENT]);
    ngDevMode && assertEqual(isParent, false, 'isParent');
    ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(adjustedElementIndex) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    var element = viewData[adjustedElementIndex];
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, "Component's host node should have an LViewData attached.");
    var hostView = element.data;
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        detectChangesInternal(hostView, element, hostView[CONTEXT]);
    }
}
/** Returns a boolean for whether the view is attached */
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
 * @param selectors A collection of parsed CSS selectors
 * @param rawSelectors A collection of CSS selectors in the raw, un-parsed form
 */
export function projectionDef(selectors, textSelectors) {
    var componentNode = findComponentHost(viewData);
    if (!componentNode.tNode.projection) {
        var noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        var pData = componentNode.tNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        var tails = pData.slice();
        var componentChild = componentNode.tNode.child;
        while (componentChild !== null) {
            var bucketIndex = selectors ? matchingSelectorIndex(componentChild, selectors, textSelectors) : 0;
            var nextNode = componentChild.next;
            if (tails[bucketIndex]) {
                tails[bucketIndex].next = componentChild;
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
/**
 * Stack used to keep track of projection nodes in projection() instruction.
 *
 * This is deliberately created outside of projection() to avoid allocating
 * a new array each time the function is called. Instead the array will be
 * re-used by each invocation. This works because the function is not reentrant.
 */
var projectionNodeStack = [];
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export function projection(nodeIndex, selectorIndex, attrs) {
    if (selectorIndex === void 0) { selectorIndex = 0; }
    var node = createLNode(nodeIndex, 1 /* Projection */, null, null, attrs || null, null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (node.tNode.projection === null)
        node.tNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is stored on a component's view level
    var parent = getParentLNode(node);
    if (canInsertNativeNode(parent, viewData)) {
        var componentNode = findComponentHost(viewData);
        var nodeToProject = componentNode.tNode.projection[selectorIndex];
        var projectedView = componentNode.view;
        var projectionNodeIndex = -1;
        var grandparent = void 0;
        var renderParent = parent.tNode.type === 2 /* View */ ?
            (grandparent = getParentLNode(parent)) &&
                grandparent.data[RENDER_PARENT] :
            parent;
        var parentView = viewData[HOST_NODE].view;
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                // This node is re-projected, so we must go up the tree to get its projected nodes.
                var currentComponentHost = findComponentHost(projectedView);
                var firstProjectedNode = currentComponentHost.tNode.projection[nodeToProject.projection];
                if (firstProjectedNode) {
                    projectionNodeStack[++projectionNodeIndex] = projectedView[nodeToProject.index];
                    nodeToProject = firstProjectedNode;
                    projectedView = currentComponentHost.view;
                    continue;
                }
            }
            else {
                var lNode = projectedView[nodeToProject.index];
                lNode.tNode.flags |= 8192 /* isProjected */;
                appendProjectedNode(lNode, parent, viewData, renderParent, parentView);
            }
            // If we are finished with a list of re-projected nodes, we need to get
            // back to the root projection node that was re-projected.
            if (nodeToProject.next === null && projectedView !== componentNode.view) {
                // move down into the view of the component we're projecting right now
                var lNode = projectionNodeStack[projectionNodeIndex--];
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
 * @param currentView The view where LViewData or LContainer should be added
 * @param adjustedHostIndex Index of the view's host node in LViewData[], adjusted for header
 * @param state The LViewData or LContainer to add to the view tree
 * @returns The state passed in
 */
export function addToViewTree(currentView, adjustedHostIndex, state) {
    if (currentView[TAIL]) {
        currentView[TAIL][NEXT] = state;
    }
    else if (firstTemplatePass) {
        tView.childIndex = adjustedHostIndex;
    }
    currentView[TAIL] = state;
    return state;
}
///////////////////////////////
//// Change detection
///////////////////////////////
/** If node is an OnPush component, marks its LViewData dirty. */
export function markDirtyIfOnPush(node) {
    // Because data flows down the component tree, ancestors do not need to be marked dirty
    if (node.data && !(node.data[FLAGS] & 2 /* CheckAlways */)) {
        node.data[FLAGS] |= 4 /* Dirty */;
    }
}
/**
 * Wraps an event listener so its host view and its ancestor views will be marked dirty
 * whenever the event fires. Necessary to support OnPush components.
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
/** Marks current view and all ancestors dirty */
export function markViewDirty(view) {
    var currentView = view;
    while (currentView[PARENT] != null) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = currentView[PARENT];
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext');
    scheduleTick(currentView[CONTEXT]);
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
 */
export function scheduleTick(rootContext) {
    if (rootContext.clean == _CLEAN_PROMISE) {
        var res_1;
        rootContext.clean = new Promise(function (r) { return res_1 = r; });
        rootContext.scheduler(function () {
            tickRootContext(rootContext);
            res_1(null);
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
 */
export function tick(component) {
    var rootView = getRootView(component);
    var rootContext = rootView[CONTEXT];
    tickRootContext(rootContext);
}
function tickRootContext(rootContext) {
    for (var i = 0; i < rootContext.components.length; i++) {
        var rootComponent = rootContext.components[i];
        var hostNode = _getComponentHostLElementNode(rootComponent);
        ngDevMode && assertDefined(hostNode.data, 'Component host node should be attached to an LView');
        renderComponentOrTemplate(hostNode, getRootView(rootComponent), rootComponent);
    }
}
/**
 * Retrieve the root view from any component by walking the parent `LViewData` until
 * reaching the root `LViewData`.
 *
 * @param component any component
 */
export function getRootView(component) {
    ngDevMode && assertDefined(component, 'component');
    var lElementNode = _getComponentHostLElementNode(component);
    var lViewData = lElementNode.view;
    while (lViewData[PARENT]) {
        lViewData = lViewData[PARENT];
    }
    return lViewData;
}
/**
 * Synchronously perform change detection on a component (and possibly its sub-components).
 *
 * This function triggers change detection in a synchronous way on a component. There should
 * be very little reason to call this function directly since a preferred way to do change
 * detection is to {@link markDirty} the component and wait for the scheduler to call this method
 * at some future point in time. This is because a single user action often results in many
 * components being invalidated and calling change detection on each component synchronously
 * would be inefficient. It is better to wait until all components are marked as dirty and
 * then perform single change detection across all of the components
 *
 * @param component The component which the change detection should be performed on.
 */
export function detectChanges(component) {
    var hostNode = _getComponentHostLElementNode(component);
    ngDevMode &&
        assertDefined(hostNode.data, 'Component host node should be attached to an LViewData instance.');
    detectChangesInternal(hostNode.data, hostNode, component);
}
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param lViewData The view which the change detection should be performed on.
 */
export function detectChangesInRootView(lViewData) {
    tickRootContext(lViewData[CONTEXT]);
}
/**
 * Checks the change detector and its children, and throws if any changes are detected.
 *
 * This is used in development mode to verify that running change detection doesn't
 * introduce other changes.
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
 * @param lViewData The view which the change detection should be checked on.
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
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export function detectChangesInternal(hostView, hostNode, component) {
    var oldView = enterView(hostView, hostNode);
    var hostTView = hostView[TVIEW];
    var templateFn = hostTView.template;
    var viewQuery = hostTView.viewQuery;
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
function createViewQuery(viewQuery, flags, component) {
    if (viewQuery && (flags & 1 /* CreationMode */)) {
        viewQuery(1 /* Create */, component);
    }
}
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
 * @param component Component to mark as dirty.
 */
export function markDirty(component) {
    ngDevMode && assertDefined(component, 'component');
    var lElementNode = _getComponentHostLElementNode(component);
    markViewDirty(lElementNode.view);
}
/** A special value which designates that a value has not changed. */
export var NO_CHANGE = {};
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
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
 */
export function interpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    var different = false;
    for (var i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    var content = values[0];
    for (var i = 1; i < values.length; i += 2) {
        content += stringify(values[i]) + values[i + 1];
    }
    return content;
}
/**
 * Creates an interpolation binding with 1 expression.
 *
 * @param prefix static value used for concatenation only.
 * @param v0 value checked for change.
 * @param suffix static value used for concatenation only.
 */
export function interpolation1(prefix, v0, suffix) {
    var different = bindingUpdated(viewData[BINDING_INDEX]++, v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated4(viewData[BINDING_INDEX] + 4, v4, v5, v6, v7) || different;
    viewData[BINDING_INDEX] += 8;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + i6 + stringify(v7) + suffix :
        NO_CHANGE;
}
/** Store a value in the `data` at a given `index`. */
export function store(index, value) {
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    var adjustedIndex = index + HEADER_OFFSET;
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
 * @param index The index of the local ref in contextViewData.
 */
export function reference(index) {
    return loadInternal(index, contextViewData);
}
function walkUpViews(nestingLevel, currentView) {
    while (nestingLevel > 0) {
        ngDevMode && assertDefined(currentView[DECLARATION_VIEW], 'Declaration view should be defined if nesting level is greater than 0.');
        currentView = currentView[DECLARATION_VIEW];
        nestingLevel--;
    }
    return currentView;
}
/** Retrieves a value from the `directives` array. */
export function loadDirective(index) {
    ngDevMode && assertDefined(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, directives);
    return directives[index];
}
export function loadQueryList(queryListIdx) {
    ngDevMode && assertDefined(viewData[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    ngDevMode && assertDataInRange(queryListIdx, viewData[CONTENT_QUERIES]);
    return viewData[CONTENT_QUERIES][queryListIdx];
}
/** Retrieves a value from current `viewData`. */
export function load(index) {
    return loadInternal(index, viewData);
}
export function loadElement(index) {
    return loadElementInternal(index, viewData);
}
/** Gets the current binding value. */
export function getBinding(bindingIndex) {
    ngDevMode && assertDataInRange(viewData[bindingIndex]);
    ngDevMode &&
        assertNotEqual(viewData[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[bindingIndex];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(bindingIndex, value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && assertLessThan(bindingIndex, viewData.length, "Slot should have been initialized to NO_CHANGE");
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
/** Updates binding and returns the value. */
export function updateBinding(bindingIndex, value) {
    return viewData[bindingIndex] = value;
}
/** Updates 2 bindings if changed, then returns whether either was updated. */
export function bindingUpdated2(bindingIndex, exp1, exp2) {
    var different = bindingUpdated(bindingIndex, exp1);
    return bindingUpdated(bindingIndex + 1, exp2) || different;
}
/** Updates 3 bindings if changed, then returns whether any was updated. */
export function bindingUpdated3(bindingIndex, exp1, exp2, exp3) {
    var different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated(bindingIndex + 2, exp3) || different;
}
/** Updates 4 bindings if changed, then returns whether any was updated. */
export function bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) {
    var different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated2(bindingIndex + 2, exp3, exp4) || different;
}
export function getTView() {
    return tView;
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 */
export function registerContentQuery(queryList) {
    var savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
    if (firstTemplatePass) {
        var currentDirectiveIndex = directives.length - 1;
        var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        var lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
        if (currentDirectiveIndex !== lastSavedDirectiveIndex) {
            tViewContentQueries.push(currentDirectiveIndex, savedContentQueriesLength - 1);
        }
    }
}
export function assertPreviousIsParent() {
    assertEqual(isParent, true, 'previousOrParentNode should be a parent');
}
function assertHasParent() {
    assertDefined(getParentLNode(previousOrParentNode), 'previousOrParentNode should have a parent');
}
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = viewData;
    assertDataInRangeInternal(index, arr || viewData);
}
function assertDataNext(index, arr) {
    if (arr == null)
        arr = viewData;
    assertEqual(arr.length, index, "index " + index + " expected to be at the end of arr (length " + arr.length + ")");
}
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertDefined(component, 'expecting component got null');
    var lElementNode = component[NG_HOST_SYMBOL];
    ngDevMode && assertDefined(component, 'object is not a component');
    return lElementNode;
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFNdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFvQixjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdEcsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDMUQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVHLE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQWMsYUFBYSxFQUFFLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSXRGLE9BQU8sRUFBa0IsdUJBQXVCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVqRixPQUFPLEVBQTBHLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEssT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQXNCLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXlCLElBQUksRUFBbUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQWUsU0FBUyxFQUFFLElBQUksRUFBUyxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM3VCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxX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RCxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3RFLElBQU0sWUFBWSxHQUFJLFNBQWlCLENBQUMsY0FBYyxDQUFpQixDQUFDO0lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFDbkUsT0FBTyxZQUFZLENBQUM7QUFDdEIsQ0FBQztBQUVELE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3REZWZpbmVkLCBhc3NlcnROb3RFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hMVmlld0RhdGFUb05vZGV9IGZyb20gJy4vZWxlbWVudF9kaXNjb3ZlcnknO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFJFTkRFUl9QQVJFTlQsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmSW50ZXJuYWwsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmSW50ZXJuYWwsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEluaXRpYWxTdHlsaW5nRmxhZ3MsIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTE5vZGVXaXRoTG9jYWxSZWZzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIENPTlRFTlRfUVVFUklFUywgQ09OVEVYVCwgQ3VycmVudE1hdGNoZXNMaXN0LCBERUNMQVJBVElPTl9WSUVXLCBESVJFQ1RJVkVTLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBORVhULCBPcGFxdWVWaWV3U3RhdGUsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJvb3RDb250ZXh0LCBTQU5JVElaRVIsIFRBSUwsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgYXBwZW5kUHJvamVjdGVkTm9kZSwgY2FuSW5zZXJ0TmF0aXZlTm9kZSwgY3JlYXRlVGV4dE5vZGUsIGZpbmRDb21wb25lbnRIb3N0LCBnZXRDaGlsZExOb2RlLCBnZXRMVmlld0NoaWxkLCBnZXROZXh0TE5vZGUsIGdldFBhcmVudExOb2RlLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtTdHlsaW5nQ29udGV4dCwgYWxsb2NTdHlsaW5nQ29udGV4dCwgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZSwgcmVuZGVyU3R5bGluZyBhcyByZW5kZXJFbGVtZW50U3R5bGVzLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AsIHVwZGF0ZVN0eWxpbmdNYXB9IGZyb20gJy4vc3R5bGluZyc7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlSW50ZXJuYWwsIGlzRGlmZmVyZW50LCBsb2FkRWxlbWVudEludGVybmFsLCBsb2FkSW50ZXJuYWwsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cbi8qKlxuICogRGlyZWN0aXZlIChEKSBzZXRzIGEgcHJvcGVydHkgb24gYWxsIGNvbXBvbmVudCBpbnN0YW5jZXMgdXNpbmcgdGhpcyBjb25zdGFudCBhcyBhIGtleSBhbmQgdGhlXG4gKiBjb21wb25lbnQncyBob3N0IG5vZGUgKExFbGVtZW50KSBhcyB0aGUgdmFsdWUuIFRoaXMgaXMgdXNlZCBpbiBtZXRob2RzIGxpa2UgZGV0ZWN0Q2hhbmdlcyB0b1xuICogZmFjaWxpdGF0ZSBqdW1waW5nIGZyb20gYW4gaW5zdGFuY2UgdG8gdGhlIGhvc3Qgbm9kZS5cbiAqL1xuZXhwb3J0IGNvbnN0IE5HX0hPU1RfU1lNQk9MID0gJ19fbmdIb3N0TE5vZGVfXyc7XG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG4vKipcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlIGJlZm9yZSB3cml0aW5nIGl0IGludG8gdGhlIHJlbmRlcmVyLlxuICovXG5leHBvcnQgdHlwZSBTYW5pdGl6ZXJGbiA9ICh2YWx1ZTogYW55KSA9PiBzdHJpbmc7XG5cbi8qKlxuICogVFZpZXcuZGF0YSBuZWVkcyB0byBmaWxsIHRoZSBzYW1lIG51bWJlciBvZiBzbG90cyBhcyB0aGUgTFZpZXdEYXRhIGhlYWRlclxuICogc28gdGhlIGluZGljZXMgb2Ygbm9kZXMgYXJlIGNvbnNpc3RlbnQgYmV0d2VlbiBMVmlld0RhdGEgYW5kIFRWaWV3LmRhdGEuXG4gKlxuICogSXQncyBtdWNoIGZhc3RlciB0byBrZWVwIGEgYmx1ZXByaW50IG9mIHRoZSBwcmUtZmlsbGVkIGFycmF5IGFuZCBzbGljZSBpdFxuICogdGhhbiBpdCBpcyB0byBjcmVhdGUgYSBuZXcgYXJyYXkgYW5kIGZpbGwgaXQgZWFjaCB0aW1lIGEgVFZpZXcgaXMgY3JlYXRlZC5cbiAqL1xuY29uc3QgSEVBREVSX0ZJTExFUiA9IG5ldyBBcnJheShIRUFERVJfT0ZGU0VUKS5maWxsKG51bGwpO1xuXG4vKipcbiAqIFRva2VuIHNldCBpbiBjdXJyZW50TWF0Y2hlcyB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkLlxuICpcbiAqIElmIHdlIHZpc2l0IGEgZGlyZWN0aXZlIHRoYXQgaGFzIGEgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB3ZSBrbm93IHdlJ3ZlXG4gKiBhbHJlYWR5IHNlZW4gaXQsIGFuZCB0aHVzIGhhdmUgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgY29uc3QgQ0lSQ1VMQVIgPSAnX19DSVJDVUxBUl9fJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICpcbiAqIFRoaXMgcmVuZGVyZXIgY2FuIGJlIG9uZSBvZiB0d28gdmFyaWV0aWVzIG9mIFJlbmRlcmVyMzpcbiAqXG4gKiAtIE9iamVjdGVkT3JpZW50ZWRSZW5kZXJlcjNcbiAqXG4gKiBUaGlzIGlzIHRoZSBuYXRpdmUgYnJvd3NlciBBUEkgc3R5bGUsIGUuZy4gb3BlcmF0aW9ucyBhcmUgbWV0aG9kcyBvbiBpbmRpdmlkdWFsIG9iamVjdHNcbiAqIGxpa2UgSFRNTEVsZW1lbnQuIFdpdGggdGhpcyBzdHlsZSwgbm8gYWRkaXRpb25hbCBjb2RlIGlzIG5lZWRlZCBhcyBhIGZhY2FkZSAocmVkdWNpbmcgcGF5bG9hZFxuICogc2l6ZSkuXG4gKlxuICogLSBQcm9jZWR1cmFsUmVuZGVyZXIzXG4gKlxuICogSW4gbm9uLW5hdGl2ZSBicm93c2VyIGVudmlyb25tZW50cyAoZS5nLiBwbGF0Zm9ybXMgc3VjaCBhcyB3ZWItd29ya2VycyksIHRoaXMgaXMgdGhlIGZhY2FkZVxuICogdGhhdCBlbmFibGVzIGVsZW1lbnQgbWFuaXB1bGF0aW9uLiBUaGlzIGFsc28gZmFjaWxpdGF0ZXMgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aFxuICogUmVuZGVyZXIyLlxuICovXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyMztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVyKCk6IFJlbmRlcmVyMyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyO1xufVxuXG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXJGYWN0b3J5KCk6IFJlbmRlcmVyRmFjdG9yeTMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlckZhY3Rvcnk7XG59XG5cbmxldCBjdXJyZW50RWxlbWVudE5vZGU6IExFbGVtZW50Tm9kZXxudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gdmlld0RhdGEgJiYgdmlld0RhdGFbU0FOSVRJWkVSXTtcbn1cblxuLyoqXG4gKiBTdG9yZSB0aGUgZWxlbWVudCBkZXB0aCBjb3VudC4gVGhpcyBpcyB1c2VkIHRvIGlkZW50aWZ5IHRoZSByb290IGVsZW1lbnRzIG9mIHRoZSB0ZW1wbGF0ZVxuICogc28gdGhhdCB3ZSBjYW4gdGhhbiBhdHRhY2ggYExWaWV3RGF0YWAgdG8gb25seSB0aG9zZSBlbGVtZW50cy5cbiAqL1xubGV0IGVsZW1lbnREZXB0aENvdW50ICE6IG51bWJlcjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiB2aWV3RGF0YSBhcyBhbnkgYXMgT3BhcXVlVmlld1N0YXRlO1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIGBjb250ZXh0Vmlld0RhdGFgIHRvIHRoZSBnaXZlbiBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBnZXRDdXJyZW50VmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKlxuICogQHBhcmFtIHZpZXdUb1Jlc3RvcmUgVGhlIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZSB0byByZXN0b3JlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZVZpZXcodmlld1RvUmVzdG9yZTogT3BhcXVlVmlld1N0YXRlKSB7XG4gIGNvbnRleHRWaWV3RGF0YSA9IHZpZXdUb1Jlc3RvcmUgYXMgYW55IGFzIExWaWV3RGF0YTtcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZC4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50Tm9kZTogTE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpOiBMTm9kZSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnROb2RlO1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpbmIgdGhpcyBwcmV2aW91c09yUGFyZW50Tm9kZSBwb2ludHMgdG8gYSBub2RlIG9uIHdoaWNoIHdlXG4gKiBjcmVhdGUgY29udGVudCBxdWVyaWVzKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ3VycmVudFF1ZXJpZXMoXG4gICAgUXVlcnlUeXBlOiB7bmV3IChwYXJlbnQ6IG51bGwsIHNoYWxsb3c6IG51bGwsIGRlZXA6IG51bGwpOiBMUXVlcmllc30pOiBMUXVlcmllcyB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29udGVudCBxdWVyeSBvbiBhIG5vZGUsIGFueSBleGlzdGluZyBMUXVlcmllcyBuZWVkcyB0byBiZSBjbG9uZWRcbiAgLy8gaW4gc3Vic2VxdWVudCB0ZW1wbGF0ZSBwYXNzZXMsIHRoZSBjbG9uaW5nIG9jY3VycyBiZWZvcmUgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24uXG4gIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS5kYXRhICE9PSB2aWV3RGF0YSAmJiAhaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGN1cnJlbnRRdWVyaWVzICYmIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmNsb25lKCkpO1xuICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICB9XG5cbiAgcmV0dXJuIGN1cnJlbnRRdWVyaWVzIHx8IChjdXJyZW50UXVlcmllcyA9IG5ldyBRdWVyeVR5cGUobnVsbCwgbnVsbCwgbnVsbCkpO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKi9cbmxldCBjcmVhdGlvbk1vZGU6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGlvbk1vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCB2aWV3RGF0YTogTFZpZXdEYXRhO1xuXG4vKipcbiAqIEludGVybmFsIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyB0aGUgY3VycmVudCBMVmlld0RhdGEgaW5zdGFuY2UuXG4gKlxuICogVGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gc2hvdWxkIGJlIHVzZWQgZm9yIGFueXRoaW5nIHB1YmxpYy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9nZXRWaWV3RGF0YSgpOiBMVmlld0RhdGEge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3RGF0YTtcbn1cblxuLyoqXG4gKiBUaGUgbGFzdCB2aWV3RGF0YSByZXRyaWV2ZWQgYnkgbmV4dENvbnRleHQoKS5cbiAqIEFsbG93cyBidWlsZGluZyBuZXh0Q29udGV4dCgpIGFuZCByZWZlcmVuY2UoKSBjYWxscy5cbiAqXG4gKiBlLmcuIGNvbnN0IGlubmVyID0geCgpLiRpbXBsaWNpdDsgY29uc3Qgb3V0ZXIgPSB4KCkuJGltcGxpY2l0O1xuICovXG5sZXQgY29udGV4dFZpZXdEYXRhOiBMVmlld0RhdGEgPSBudWxsICE7XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgZGlyZWN0aXZlIGluc3RhbmNlcyBpbiB0aGUgY3VycmVudCB2aWV3LlxuICpcbiAqIFRoZXNlIG11c3QgYmUgc3RvcmVkIHNlcGFyYXRlbHkgZnJvbSBMTm9kZXMgYmVjYXVzZSB0aGVpciBwcmVzZW5jZSBpc1xuICogdW5rbm93biBhdCBjb21waWxlLXRpbWUgYW5kIHRodXMgc3BhY2UgY2Fubm90IGJlIHJlc2VydmVkIGluIGRhdGFbXS5cbiAqL1xubGV0IGRpcmVjdGl2ZXM6IGFueVtdfG51bGw7XG5cbmZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXdEYXRhKTogYW55W10ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3W0NMRUFOVVBdIHx8ICh2aWV3W0NMRUFOVVBdID0gW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXdEYXRhKTogYW55W10ge1xuICByZXR1cm4gdmlld1tUVklFV10uY2xlYW51cCB8fCAodmlld1tUVklFV10uY2xlYW51cCA9IFtdKTtcbn1cbi8qKlxuICogSW4gdGhpcyBtb2RlLCBhbnkgY2hhbmdlcyBpbiBiaW5kaW5ncyB3aWxsIHRocm93IGFuIEV4cHJlc3Npb25DaGFuZ2VkQWZ0ZXJDaGVja2VkIGVycm9yLlxuICpcbiAqIE5lY2Vzc2FyeSB0byBzdXBwb3J0IENoYW5nZURldGVjdG9yUmVmLmNoZWNrTm9DaGFuZ2VzKCkuXG4gKi9cbmxldCBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcblxuLyoqIFdoZXRoZXIgb3Igbm90IHRoaXMgaXMgdGhlIGZpcnN0IHRpbWUgdGhlIGN1cnJlbnQgdmlldyBoYXMgYmVlbiBwcm9jZXNzZWQuICovXG5sZXQgZmlyc3RUZW1wbGF0ZVBhc3MgPSB0cnVlO1xuXG4vKipcbiAqIFRoZSByb290IGluZGV4IGZyb20gd2hpY2ggcHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgc2hvdWxkIGNhbGN1bGF0ZSB0aGVpciBiaW5kaW5nXG4gKiBpbmRpY2VzLiBJbiBjb21wb25lbnQgdmlld3MsIHRoaXMgaXMgVFZpZXcuYmluZGluZ1N0YXJ0SW5kZXguIEluIGEgaG9zdCBiaW5kaW5nXG4gKiBjb250ZXh0LCB0aGlzIGlzIHRoZSBUVmlldy5ob3N0QmluZGluZ1N0YXJ0SW5kZXggKyBhbnkgaG9zdFZhcnMgYmVmb3JlIHRoZSBnaXZlbiBkaXIuXG4gKi9cbmxldCBiaW5kaW5nUm9vdEluZGV4OiBudW1iZXIgPSAtMTtcblxuLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmdSb290KCkge1xuICByZXR1cm4gYmluZGluZ1Jvb3RJbmRleDtcbn1cblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3RGF0YSwgaG9zdDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IG9sZFZpZXc6IExWaWV3RGF0YSA9IHZpZXdEYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3W0RJUkVDVElWRVNdO1xuICB0VmlldyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tUVklFV107XG5cbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGJpbmRpbmdSb290SW5kZXggPSBuZXdWaWV3ICYmIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICByZW5kZXJlciA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tSRU5ERVJFUl07XG5cbiAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gaG9zdDtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gIH1cblxuICB2aWV3RGF0YSA9IGNvbnRleHRWaWV3RGF0YSA9IG5ld1ZpZXc7XG4gIG9sZFZpZXcgJiYgKG9sZFZpZXdbUVVFUklFU10gPSBjdXJyZW50UXVlcmllcyk7XG4gIGN1cnJlbnRRdWVyaWVzID0gbmV3VmlldyAmJiBuZXdWaWV3W1FVRVJJRVNdO1xuXG4gIHJldHVybiBvbGRWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGNyZWF0aW9uT25seSBBbiBvcHRpb25hbCBib29sZWFuIHRvIGluZGljYXRlIHRoYXQgdGhlIHZpZXcgd2FzIHByb2Nlc3NlZCBpbiBjcmVhdGlvbiBtb2RlXG4gKiBvbmx5LCBpLmUuIHRoZSBmaXJzdCB1cGRhdGUgd2lsbCBiZSBkb25lIGxhdGVyLiBPbmx5IHBvc3NpYmxlIGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KG5ld1ZpZXc6IExWaWV3RGF0YSwgY3JlYXRpb25Pbmx5PzogYm9vbGVhbik6IHZvaWQge1xuICBpZiAoIWNyZWF0aW9uT25seSkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy52aWV3SG9va3MsIHRWaWV3LnZpZXdDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICAgIH1cbiAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICB2aWV3RGF0YVtGTEFHU10gJj0gfihMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuRGlydHkpO1xuICB9XG4gIHZpZXdEYXRhW0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJ1bkluaXQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBlbWJlZGRlZCB2aWV3cywgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0XG4gKiBiaW5kaW5ncywgcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5mdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCkge1xuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG4gIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyh2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gIHJlZnJlc2hDb250ZW50UXVlcmllcyh0Vmlldyk7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG5cbiAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5ob3N0QmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgIShkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICAgIGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdSb290SW5kZXggKyBkZWYuaG9zdFZhcnM7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVEZWZJZHhdO1xuXG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoICEoZGlyZWN0aXZlRGVmSWR4LCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGluc3RhbmNlID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXdEYXRhO1xuICBpbnN0YW5jZVtQQVJFTlRdID0gdmlld0RhdGE7XG4gIGluc3RhbmNlW0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0O1xuICBpbnN0YW5jZVtDT05URVhUXSA9IGNvbnRleHQ7XG4gIGluc3RhbmNlW0lOSkVDVE9SXSA9IHZpZXdEYXRhID8gdmlld0RhdGFbSU5KRUNUT1JdIDogbnVsbDtcbiAgaW5zdGFuY2VbUkVOREVSRVJdID0gcmVuZGVyZXI7XG4gIGluc3RhbmNlW1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgbnVsbDtcbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG4vKipcbiAqIENyZWF0aW9uIG9mIExOb2RlIG9iamVjdCBpcyBleHRyYWN0ZWQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB3ZSBhbHdheXMgY3JlYXRlIExOb2RlIG9iamVjdFxuICogd2l0aCB0aGUgc2FtZSBzaGFwZVxuICogKHNhbWUgcHJvcGVydGllcyBhc3NpZ25lZCBpbiB0aGUgc2FtZSBvcmRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZU9iamVjdChcbiAgICB0eXBlOiBUTm9kZVR5cGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIHBhcmVudDogTE5vZGUgfCBudWxsLFxuICAgIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCxcbiAgICBzdGF0ZTogYW55KTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgcmV0dXJuIHtcbiAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksXG4gICAgdmlldzogY3VycmVudFZpZXcsXG4gICAgbm9kZUluamVjdG9yOiBwYXJlbnQgPyBwYXJlbnQubm9kZUluamVjdG9yIDogbnVsbCxcbiAgICBkYXRhOiBzdGF0ZSxcbiAgICB0Tm9kZTogbnVsbCAhLFxuICAgIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEEgY29tbW9uIHdheSBvZiBjcmVhdGluZyB0aGUgTE5vZGUgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZW0gaGF2ZSBzYW1lIHNoYXBlIHRvXG4gKiBrZWVwIHRoZSBleGVjdXRpb24gY29kZSBtb25vbW9ycGhpYyBhbmQgZmFzdC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBMTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBMTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIExOb2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGRhdGEgQW55IGRhdGEgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gdGhlIExOb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsVmlld0RhdGE/OiBMVmlld0RhdGEgfCBudWxsKTogTEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5WaWV3LCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBudWxsLFxuICAgIGxWaWV3RGF0YTogTFZpZXdEYXRhKTogTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IExDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgbFByb2plY3Rpb246IG51bGwpOiBMUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgZGF0YTogbnVsbCk6IExFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBzdGF0ZT86IG51bGwgfCBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZcbiAgICBMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgY29uc3QgcGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgJiYgZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICFhcyBMTm9kZTtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHRQYXJlbnQgPVxuICAgICAgcGFyZW50ICYmIHBhcmVudC52aWV3ID09PSB2aWV3RGF0YSA/IHBhcmVudC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG5cbiAgY29uc3QgaXNTdGF0ZSA9IHN0YXRlICE9IG51bGw7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCB2aWV3RGF0YSwgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsKTtcblxuICBpZiAoaW5kZXggPT09IC0xIHx8IHR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gICAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIFRWaWV3Lm5vZGUuXG4gICAgbm9kZS50Tm9kZSA9IChzdGF0ZSA/IChzdGF0ZSBhcyBMVmlld0RhdGEpW1RWSUVXXS5ub2RlIDogbnVsbCkgfHxcbiAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgaW5kZXgsIG51bGwsIG51bGwsIHRQYXJlbnQsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCB2aWV3RGF0YS5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgd2l0aCBudWxsYCk7XG5cbiAgICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IG5vZGU7XG5cbiAgICBpZiAodERhdGFbYWRqdXN0ZWRJbmRleF0gPT0gbnVsbCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMsIHRQYXJlbnQsIG51bGwpO1xuICAgICAgaWYgKCFpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkgcHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIG5vZGUudE5vZGUgPSB0RGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZTtcblxuICAgIC8vIE5vdyBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlLlxuICAgIGlmIChpc1BhcmVudCkge1xuICAgICAgaWYgKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmNoaWxkID09IG51bGwgJiYgcHJldmlvdXNPclBhcmVudE5vZGUudmlldyA9PT0gdmlld0RhdGEgfHxcbiAgICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCBWaWV3LlxuICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9IG5vZGUudE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVmlldyBub2RlcyBhbmQgaG9zdCBlbGVtZW50cyBuZWVkIHRvIHNldCB0aGVpciBob3N0IG5vZGUgKGNvbXBvbmVudHMgc2V0IGhvc3Qgbm9kZXMgbGF0ZXIpXG4gIGlmICgodHlwZSAmIFROb2RlVHlwZS5WaWV3T3JFbGVtZW50KSA9PT0gVE5vZGVUeXBlLlZpZXdPckVsZW1lbnQgJiYgaXNTdGF0ZSkge1xuICAgIGNvbnN0IGxWaWV3RGF0YSA9IHN0YXRlIGFzIExWaWV3RGF0YTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBsVmlld0RhdGFbSE9TVF9OT0RFXSwgbnVsbCwgJ2xWaWV3RGF0YVtIT1NUX05PREVdIHNob3VsZCBub3QgaGF2ZSBiZWVuIGluaXRpYWxpemVkJyk7XG4gICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0gPSBub2RlO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgbFZpZXdEYXRhW1RWSUVXXS5ub2RlID0gbm9kZS50Tm9kZTtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICByZXR1cm4gbm9kZTtcbn1cblxuLyoqXG4gKiBXaGVuIExOb2RlcyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCsrO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgIHZpZXcucHVzaChudWxsKTtcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG4gIGVsZW1lbnREZXB0aENvdW50ID0gMDtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGhvc3ROb2RlIEV4aXN0aW5nIG5vZGUgdG8gcmVuZGVyIGludG8uXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgIHJlbmRlcmVyRmFjdG9yeSA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5O1xuICAgIGNvbnN0IHRWaWV3ID1cbiAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCk7XG4gICAgaG9zdCA9IGNyZWF0ZUxOb2RlKFxuICAgICAgICAtMSwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLFxuICAgICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKSwgdFZpZXcsIHt9LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgICAgc2FuaXRpemVyKSk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdCwgaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlRm4pO1xuICByZXR1cm4gaG9zdDtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld05vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3RGF0YSwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBxdWVyaWVzPzogTFF1ZXJpZXMgfCBudWxsKTogTFZpZXdOb2RlIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjb25zdCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKC0xLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuXG4gIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIHJmOiBSZW5kZXJGbGFncyk6IExWaWV3Tm9kZXxcbiAgICBMRWxlbWVudE5vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlld0RhdGE7XG4gIGlmICh2aWV3Tm9kZS5kYXRhICFbUEFSRU5UXSA9PSBudWxsICYmIHZpZXdOb2RlLmRhdGEgIVtDT05URVhUXSAmJiAhdFZpZXcudGVtcGxhdGUpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KHZpZXdOb2RlLmRhdGEgIVtDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gICAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEgISwgdmlld05vZGUpO1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdFZpZXcudGVtcGxhdGUgIShyZiwgY29udGV4dCk7XG4gICAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAgICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmlld05vZGUuZGF0YSAhW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIC8vIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSBpcyBjYWxsZWQgdHdpY2UgaW4gZmFjdCwgb25jZSBmb3IgY3JlYXRpb24gb25seSBhbmQgdGhlbiBvbmNlIGZvclxuICAgICAgLy8gdXBkYXRlLiBXaGVuIGZvciBjcmVhdGlvbiBvbmx5LCBsZWF2ZVZpZXcoKSBtdXN0IG5vdCB0cmlnZ2VyIHZpZXcgaG9va3MsIG5vciBjbGVhbiBmbGFncy5cbiAgICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgICAgbGVhdmVWaWV3KG9sZFZpZXcgISwgaXNDcmVhdGlvbk9ubHkpO1xuICAgICAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGNvbnRleHQgYXQgdGhlIGxldmVsIHNwZWNpZmllZCBhbmQgc2F2ZXMgaXQgYXMgdGhlIGdsb2JhbCwgY29udGV4dFZpZXdEYXRhLlxuICogV2lsbCBnZXQgdGhlIG5leHQgbGV2ZWwgdXAgaWYgbGV2ZWwgaXMgbm90IHNwZWNpZmllZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gc2F2ZSBjb250ZXh0cyBvZiBwYXJlbnQgdmlld3Mgc28gdGhleSBjYW4gYmUgYm91bmQgaW4gZW1iZWRkZWQgdmlld3MsIG9yXG4gKiBpbiBjb25qdW5jdGlvbiB3aXRoIHJlZmVyZW5jZSgpIHRvIGJpbmQgYSByZWYgZnJvbSBhIHBhcmVudCB2aWV3LlxuICpcbiAqIEBwYXJhbSBsZXZlbCBUaGUgcmVsYXRpdmUgbGV2ZWwgb2YgdGhlIHZpZXcgZnJvbSB3aGljaCB0byBncmFiIGNvbnRleHQgY29tcGFyZWQgdG8gY29udGV4dFZld0RhdGFcbiAqIEByZXR1cm5zIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0PFQgPSBhbnk+KGxldmVsOiBudW1iZXIgPSAxKTogVCB7XG4gIGNvbnRleHRWaWV3RGF0YSA9IHdhbGtVcFZpZXdzKGxldmVsLCBjb250ZXh0Vmlld0RhdGEgISk7XG4gIHJldHVybiBjb250ZXh0Vmlld0RhdGFbQ09OVEVYVF0gYXMgVDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgbm9kZTogTEVsZW1lbnROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhLCBjb21wb25lbnRPckNvbnRleHQ6IFQsXG4gICAgdGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIG5vZGUpO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudE9yQ29udGV4dCAhKTtcbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTtcblxuICAgICAgLy8gRWxlbWVudCB3YXMgc3RvcmVkIGF0IDAgaW4gZGF0YSBhbmQgZGlyZWN0aXZlIHdhcyBzdG9yZWQgYXQgMCBpbiBkaXJlY3RpdmVzXG4gICAgICAvLyBpbiByZW5kZXJDb21wb25lbnQoKVxuICAgICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKEhFQURFUl9PRkZTRVQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiBvZiByZW5kZXJpbmcgZmxhZ3MgZGVwZW5kaW5nIG9uIHdoZW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBpbiBjcmVhdGlvbiBtb2RlIG9yIHVwZGF0ZSBtb2RlLiBCeSBkZWZhdWx0LCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1biB3aXRoIHRoZVxuICogY3JlYXRpb24gYmxvY2sgd2hlbiB0aGUgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlLiBPdGhlcndpc2UsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuXG4gKiBhbG9uZS5cbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIGRvIE5PVCB1c2UgdGhpcyBjb25maWd1cmF0aW9uICh1cGRhdGUgYmxvY2sgYW5kIGNyZWF0ZSBibG9jayBhcmVcbiAqIGFsd2F5cyBydW4gc2VwYXJhdGVseSkuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlckZsYWdzKHZpZXc6IExWaWV3RGF0YSk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gTmFtZXNwYWNlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGVsZW1lbnQgdXNpbmcge0BsaW5rIGVsZW1lbnRTdGFydH0gYW5kIHtAbGluayBlbGVtZW50RW5kfVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIGVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbG9naWNhbCBjb250YWluZXIgZm9yIG90aGVyIG5vZGVzICg8bmctY29udGFpbmVyPikgYmFja2VkIGJ5IGEgY29tbWVudCBub2RlIGluIHRoZSBET00uXG4gKiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudENvbnRhaW5lckVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gYXR0cnMgU2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgdXNlZCB3aGVuIG1hdGNoaW5nIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBFdmVuIGlmIHRoaXMgaW5zdHJ1Y3Rpb24gYWNjZXB0cyBhIHNldCBvZiBhdHRyaWJ1dGVzIG5vIGFjdHVhbCBhdHRyaWJ1dGUgdmFsdWVzIGFyZSBwcm9wYWdhdGVkIHRvXG4gKiB0aGUgRE9NIChhcyBhIGNvbW1lbnQgbm9kZSBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMpLiBBdHRyaWJ1dGVzIGFyZSBoZXJlIG9ubHkgZm9yIGRpcmVjdGl2ZVxuICogbWF0Y2hpbmcgcHVycG9zZXMgYW5kIHNldHRpbmcgaW5pdGlhbCBpbnB1dHMgb2YgZGlyZWN0aXZlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnQgY29udGFpbmVycyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnbmctY29udGFpbmVyJyA6ICcnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCBub2RlOiBMRWxlbWVudENvbnRhaW5lck5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmUsIG51bGwsIGF0dHJzIHx8IG51bGwsIG51bGwpO1xuXG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBuYXRpdmUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhub2RlLCBsb2NhbFJlZnMpO1xufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSBhcyBMRWxlbWVudENvbnRhaW5lck5vZGU7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcblxuICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSk7XG5cbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncywgdFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCBub2RlOiBMRWxlbWVudE5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG4gIGN1cnJlbnRFbGVtZW50Tm9kZSA9IG5vZGU7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICB9XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBuYXRpdmUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhub2RlLCBsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGVsZW1lbnREZXB0aENvdW50ID09PSAwKSB7XG4gICAgYXR0YWNoTFZpZXdEYXRhVG9Ob2RlKG5hdGl2ZSwgdmlld0RhdGEpO1xuICB9XG4gIGVsZW1lbnREZXB0aENvdW50Kys7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG92ZXJyaWRkZW5SZW5kZXJlciBPcHRpb25hbCBBIHJlbmRlcmVyIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9uZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIG92ZXJyaWRkZW5SZW5kZXJlcj86IFJlbmRlcmVyMyk6IFJFbGVtZW50IHtcbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyVG9Vc2UgPSBvdmVycmlkZGVuUmVuZGVyZXIgfHwgcmVuZGVyZXI7XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyVG9Vc2UpKSB7XG4gICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUsIF9jdXJyZW50TmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoX2N1cnJlbnROYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMoX2N1cnJlbnROYW1lc3BhY2UsIG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmF0aXZlO1xufVxuXG5mdW5jdGlvbiBuYXRpdmVOb2RlTG9jYWxSZWZFeHRyYWN0b3IobE5vZGU6IExOb2RlV2l0aExvY2FsUmVmcyk6IFJOb2RlIHtcbiAgcmV0dXJuIGxOb2RlLm5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsTm9kZSBMTm9kZSBmb3Igd2hpY2ggZGlyZWN0aXZlIGFuZCBsb2NhbHMgc2hvdWxkIGJlIGNyZWF0ZWRcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBMTm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIGxOb2RlOiBMTm9kZVdpdGhMb2NhbFJlZnMsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IG5hdGl2ZU5vZGVMb2NhbFJlZkV4dHJhY3Rvcikge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKGxOb2RlLnROb2RlLCB0VmlldywgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCk7XG4gIH1cbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxOb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCB2YWx1ZUluZGV4ID0gaSArIDE7XG4gICAgICByZXNvbHZlRGlyZWN0aXZlKGRlZiwgdmFsdWVJbmRleCwgbWF0Y2hlcywgdFZpZXcpO1xuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcChtYXRjaGVzW3ZhbHVlSW5kZXhdIGFzIG51bWJlciwgZGVmLCBleHBvcnRzTWFwKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuICovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZTogVE5vZGUpOiBDdXJyZW50TWF0Y2hlc0xpc3R8bnVsbCB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV07XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISkpIHtcbiAgICAgICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICAgICAgKG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSkpLnB1c2goZGVmLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXMgYXMgQ3VycmVudE1hdGNoZXNMaXN0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4sIHZhbHVlSW5kZXg6IG51bWJlciwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0LFxuICAgIHRWaWV3OiBUVmlldyk6IGFueSB7XG4gIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBudWxsKSB7XG4gICAgbWF0Y2hlc1t2YWx1ZUluZGV4XSA9IENJUkNVTEFSO1xuICAgIGNvbnN0IGluc3RhbmNlID0gZGVmLmZhY3RvcnkoKTtcbiAgICAodFZpZXcuZGlyZWN0aXZlcyB8fCAodFZpZXcuZGlyZWN0aXZlcyA9IFtdKSkucHVzaChkZWYpO1xuICAgIHJldHVybiBkaXJlY3RpdmVDcmVhdGUobWF0Y2hlc1t2YWx1ZUluZGV4XSA9IHRWaWV3LmRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxLCBpbnN0YW5jZSwgZGVmKTtcbiAgfSBlbHNlIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBDSVJDVUxBUikge1xuICAgIC8vIElmIHdlIHJldmlzaXQgdGhpcyBkaXJlY3RpdmUgYmVmb3JlIGl0J3MgcmVzb2x2ZWQsIHdlIGtub3cgaXQncyBjaXJjdWxhclxuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZi50eXBlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5mdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soKTogdm9pZCB7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gW10pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmluZGV4KTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIsIGhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gTXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMgYXJlIGdlbmVyYXRlZCB3aXRoXG4gIC8vIGluc3RydWN0aW9ucyB0aGF0IGV4cGVjdCBlbGVtZW50IGluZGljZXMgdGhhdCBhcmUgTk9UIGFkanVzdGVkIChlLmcuIGVsZW1lbnRQcm9wZXJ0eSkuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0VmFyczsgaSsrKSB7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB2aWV3RGF0YS5wdXNoKE5PX0NIQU5HRSk7XG4gIH1cbiAgKHRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAodFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG59XG5cbi8qKiBTZXRzIHRoZSBjb250ZXh0IGZvciBhIENoYW5nZURldGVjdG9yUmVmIHRvIHRoZSBnaXZlbiBpbnN0YW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKFxuICAgIGluamVjdG9yOiBMSW5qZWN0b3IgfCBudWxsLCBpbnN0YW5jZTogYW55LCB2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgaWYgKGluamVjdG9yICYmIGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmICE9IG51bGwpIHtcbiAgICAoaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld1JlZjxhbnk+KS5fc2V0Q29tcG9uZW50Q29udGV4dCh2aWV3LCBpbnN0YW5jZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5KSAhPT0gMDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpbnN0YW50aWF0ZXMgdGhlIGdpdmVuIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZmlyc3RUZW1wbGF0ZVBhc3MsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgIGBEaXJlY3RpdmVzIHNob3VsZCBvbmx5IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseSBhZnRlciBmaXJzdCB0ZW1wbGF0ZSBwYXNzYCk7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSAmJiBjdXJyZW50UXVlcmllcykge1xuICAgIGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuY2xvbmUoKTtcbiAgfVxuXG4gIGlmIChjb3VudCA+IDApIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgdERpcmVjdGl2ZXMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+ID0gdERpcmVjdGl2ZXNbaV07XG4gICAgICBkaXJlY3RpdmVDcmVhdGUoaSwgZGVmLmZhY3RvcnkoKSwgZGVmKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58IENvbXBvbmVudERlZkludGVybmFsPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNdID0gaW5kZXg7XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlld0RhdGEgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIGxOb2RlOiBMTm9kZVdpdGhMb2NhbFJlZnMsIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3Rvcik6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gbE5vZGUudE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBsZXQgbG9jYWxJbmRleCA9IGxOb2RlLnROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgPyBsb2NhbFJlZkV4dHJhY3RvcihsTm9kZSkgOiBkaXJlY3RpdmVzICFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9XG4gICAgICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PGFueT58IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVddID0ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IEhFQURFUl9GSUxMRVIuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld0RhdGFcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgaG9zdEJpbmRpbmdTdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5ldyBBcnJheShpbml0aWFsVmlld0xlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKG51bGwsIDAsIGJpbmRpbmdTdGFydEluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwoTk9fQ0hBTkdFLCBiaW5kaW5nU3RhcnRJbmRleCkgYXMgTFZpZXdEYXRhO1xuICBibHVlcHJpbnRbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICBibHVlcHJpbnRbQklORElOR19JTkRFWF0gPSBiaW5kaW5nU3RhcnRJbmRleDtcbiAgcmV0dXJuIGJsdWVwcmludDtcbn1cblxuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBUQXR0cmlidXRlcyk6IHZvaWQge1xuICBjb25zdCBpc1Byb2MgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgaSArPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgLy8gTmFtZXNwYWNlZCBhdHRyaWJ1dGVzXG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZVVSSSA9IGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaSArIDJdIGFzIHN0cmluZztcbiAgICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2kgKyAzXSBhcyBzdHJpbmc7XG4gICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwsIG5hbWVzcGFjZVVSSSkgOlxuICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgYXR0ck5hbWUsIGF0dHJWYWwpO1xuICAgICAgICBpICs9IDQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdGFuZGFyZCBhdHRyaWJ1dGVzXG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgMV07XG4gICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5cbi8qKlxuICogTG9jYXRlcyB0aGUgaG9zdCBuYXRpdmUgZWxlbWVudCwgdXNlZCBmb3IgYm9vdHN0cmFwcGluZyBleGlzdGluZyBub2RlcyBpbnRvIHJlbmRlcmluZyBwaXBlbGluZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIGZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZyk6IFJFbGVtZW50fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoLTEpO1xuICByZW5kZXJlckZhY3RvcnkgPSBmYWN0b3J5O1xuICBjb25zdCBkZWZhdWx0UmVuZGVyZXIgPSBmYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICBjb25zdCByTm9kZSA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKGRlZmF1bHRSZW5kZXJlcikgP1xuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IpIDpcbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpKSA6XG4gICAgICBlbGVtZW50T3JTZWxlY3RvcjtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhck5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gck5vZGU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgaG9zdCBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gck5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKlxuICogQHJldHVybnMgTEVsZW1lbnROb2RlIGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvc3RFbGVtZW50KFxuICAgIHRhZzogc3RyaW5nLCByTm9kZTogUkVsZW1lbnQgfCBudWxsLCBkZWY6IENvbXBvbmVudERlZkludGVybmFsPGFueT4sXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKFxuICAgICAgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyLFxuICAgICAgICAgIGdldE9yQ3JlYXRlVFZpZXcoXG4gICAgICAgICAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpLFxuICAgICAgICAgIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbm9kZS50Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgdFZpZXcuZGlyZWN0aXZlcyA9IFtkZWZdO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZSBhcyBSRWxlbWVudDtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyh2aWV3RGF0YSwgbGlzdGVuZXJGbik7XG4gICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKG5hdGl2ZSwgZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHN0b3JlQ2xlYW51cEZuKHZpZXdEYXRhLCBjbGVhbnVwRm4pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQodmlld0RhdGEsIGxpc3RlbmVyRm4pO1xuICAgIG5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICBjb25zdCBjbGVhbnVwSW5zdGFuY2VzID0gZ2V0Q2xlYW51cCh2aWV3RGF0YSk7XG4gICAgY2xlYW51cEluc3RhbmNlcy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICBnZXRUVmlld0NsZWFudXAodmlld0RhdGEpLnB1c2goXG4gICAgICAgICAgZXZlbnROYW1lLCBub2RlLnROb2RlLmluZGV4LCBjbGVhbnVwSW5zdGFuY2VzICEubGVuZ3RoIC0gMSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gbm9kZS50Tm9kZTtcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgb3V0cHV0RGF0YTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKG91dHB1dHMgJiYgKG91dHB1dERhdGEgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY3JlYXRlT3V0cHV0KG91dHB1dERhdGEsIGxpc3RlbmVyRm4pO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGV2ZW50IG5hbWUgYW5kIHN1YnNjcmliZXMgdG9cbiAqIGVhY2ggb3V0cHV0LlxuICovXG5mdW5jdGlvbiBjcmVhdGVPdXRwdXQob3V0cHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKG91dHB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGRpcmVjdGl2ZXMgIVtvdXRwdXRzW2ldIGFzIG51bWJlcl1bb3V0cHV0c1tpICsgMV1dLnN1YnNjcmliZShsaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQodmlld0RhdGEsIHN1YnNjcmlwdGlvbiwgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQoXG4gICAgdmlldzogTFZpZXdEYXRhIHwgbnVsbCwgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmICghdmlldykgdmlldyA9IHZpZXdEYXRhO1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuLCB2aWV3W0NMRUFOVVBdICEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXdEYXRhLCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExFbGVtZW50Tm9kZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY3VycmVudFF1ZXJpZXMgJiYgKGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIGN1cnJlbnRFbGVtZW50Tm9kZSA9IG51bGw7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gbG9hZEVsZW1lbnQoaW5kZXgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPSBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBwcm9wZXJ0eSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgQElucHV0cyBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IG5vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGU7XG4gIC8vIGlmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWRcbiAgaWYgKHROb2RlICYmIHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsLFxuICAgIGRldGFjaGVkOiBudWxsLFxuICAgIHN0eWxpbmdUZW1wbGF0ZTogbnVsbCxcbiAgICBwcm9qZWN0aW9uOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxpbmdJbmRleCwgdmFsdWUgPyB0cnVlIDogZmFsc2UpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBhbnkgaW5saW5lIHN0eWxlIHZhbHVlcyB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byBhcHBseSBhbGwgc3R5bGluZ1xuICogKGUuZy4gYHN0eWxlPVwiLi4uXCJgKSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuIFRoaXMgaXMgYWxzbyB3aGVyZSB0aGUgcHJvdmlkZWQgaW5kZXhcbiAqIHZhbHVlIGlzIGFsbG9jYXRlZCBmb3IgdGhlIHN0eWxpbmcgZGV0YWlscyBmb3IgaXRzIGNvcnJlc3BvbmRpbmcgZWxlbWVudCAodGhlIGVsZW1lbnRcbiAqIGluZGV4IGlzIHRoZSBwcmV2aW91cyBpbmRleCB2YWx1ZSBmcm9tIHRoaXMgb25lKS5cbiAqXG4gKiAoTm90ZSB0aGlzIGZ1bmN0aW9uIGNhbGxzIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4pXG4gKlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCB2YWx1ZSB3aGljaCB3aWxsIGJlIGFsbG9jYXRlZCB0byBzdG9yZSBzdHlsaW5nIGRhdGEgZm9yIHRoZSBlbGVtZW50LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzRGVjbGFyYXRpb25zIEEga2V5L3ZhbHVlIGFycmF5IG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IGNsYXNzZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW2NsYXNzXWApIG9yIHNpbmd1bGFyIChgW2NsYXNzLm5hbWVkXWApXG4gKiAgIGJpbmRpbmdzLiBJZiBhIGNsYXNzIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZSBtYXRjaGluZyBpbml0aWFsXG4gKiAgIGNsYXNzIHZhbHVlIHRoYXQgYXJlIHBhc3NlZCBpbiBoZXJlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaWYgbWF0Y2hlZCkuXG4gKiBAcGFyYW0gc3R5bGVEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZWxlbWVudC5cbiAqICAgRWFjaCBpbmRpdmlkdWFsIHN0eWxlIHdpbGwgYmUgdXNlZCBvbiB0aGUgZWxlbWVudCBhcyBsb25nIGFzIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gKiAgIGJ5IGFueSBzdHlsZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW3N0eWxlXWApIG9yIHNpbmd1bGFyIChgW3N0eWxlLnByb3BdYClcbiAqICAgYmluZGluZ3MuIElmIGEgc3R5bGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBudWxsIHRoZW4gdGhlIGluaXRpYWwgc3R5bGluZ1xuICogICB2YWx1ZXMgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgKGlmIHByb3ZpZGVkKVxuICogICB0byBzYW5pdGl6ZSB0aGUgYW55IENTUyBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZzxUPihcbiAgICBjbGFzc0RlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsRWxlbWVudCA9IGN1cnJlbnRFbGVtZW50Tm9kZSAhO1xuICBjb25zdCB0Tm9kZSA9IGxFbGVtZW50LnROb2RlO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIC8vIGluaXRpYWxpemUgdGhlIHN0eWxpbmcgdGVtcGxhdGUuXG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID1cbiAgICAgICAgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZShjbGFzc0RlY2xhcmF0aW9ucywgc3R5bGVEZWNsYXJhdGlvbnMsIHN0eWxlU2FuaXRpemVyKTtcbiAgfVxuICBpZiAoc3R5bGVEZWNsYXJhdGlvbnMgJiYgc3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoIHx8XG4gICAgICBjbGFzc0RlY2xhcmF0aW9ucyAmJiBjbGFzc0RlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICBlbGVtZW50U3R5bGluZ0FwcGx5KHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICovXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyKTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3R5bGluZ0NvbnRleHQgPSBsb2FkPFN0eWxpbmdDb250ZXh0PihpbmRleCk7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdHlsaW5nQ29udGV4dCkpIHtcbiAgICBjb25zdCBsRWxlbWVudCA9IHN0eWxpbmdDb250ZXh0IGFzIGFueSBhcyBMRWxlbWVudE5vZGU7XG4gICAgY29uc3QgdE5vZGUgPSBsRWxlbWVudC50Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RGVmaW5lZCh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsICdnZXRTdHlsaW5nQ29udGV4dCgpIGNhbGxlZCBiZWZvcmUgZWxlbWVudFN0eWxpbmcoKScpO1xuICAgIHN0eWxpbmdDb250ZXh0ID0gdmlld0RhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSA9XG4gICAgICAgIGFsbG9jU3R5bGluZ0NvbnRleHQobEVsZW1lbnQsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAhKTtcbiAgfVxuICByZXR1cm4gc3R5bGluZ0NvbnRleHQ7XG59XG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50IHdoaWNoIGhhdmUgYmVlbiBxdWV1ZWQgYnkgYW55IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIG9uY2Ugb25lIG9yIG1vcmUgYGVsZW1lbnRTdHlsZWAgYW5kL29yIGBlbGVtZW50U3R5bGVQcm9wYFxuICogaGF2ZSBiZWVuIGlzc3VlZCBhZ2FpbnN0IHRoZSBlbGVtZW50LiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyBkZXRlcm1pbmUgaWYgYW55IHN0eWxlcyBoYXZlXG4gKiBjaGFuZ2VkIGFuZCB3aWxsIHRoZW4gc2tpcCB0aGUgb3BlcmF0aW9uIGlmIHRoZXJlIGlzIG5vdGhpbmcgbmV3IHRvIHJlbmRlci5cbiAqXG4gKiBPbmNlIGNhbGxlZCB0aGVuIGFsbCBxdWV1ZWQgc3R5bGVzIHdpbGwgYmUgZmx1c2hlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdGhhdCB3aWxsIGJlIHJlbmRlcmVkLlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseTxUPihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHJlbmRlckVsZW1lbnRTdHlsZXMoZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgpLCByZW5kZXJlcik7XG59XG5cbi8qKlxuICogUXVldWUgYSBnaXZlbiBzdHlsZSB0byBiZSByZW5kZXJlZCBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBgbnVsbGAgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYGVsZW1lbnRTdHlsZWAgb3IgYW55IHN0eWxlcyB0aGF0IGFyZSBwcmVzZW50XG4gKiBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgKHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0byBjaGFuZ2UgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgcHJvcGVydHkgb24gdGhpcyBlbGVtZW50LiAoTW9ub3RvbmljYWxseSBpbmNyZWFzaW5nLilcbiAqIEBwYXJhbSBzdHlsZU5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00gdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAobnVsbCB0byByZW1vdmUpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZVByb3A8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IG51bGwsIHN1ZmZpeD86IHN0cmluZyk6IHZvaWQge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gc3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgdXBkYXRlRWxlbWVudFN0eWxlUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQpO1xufVxuXG4vKipcbiAqIFF1ZXVlIGEga2V5L3ZhbHVlIG1hcCBvZiBzdHlsZXMgdG8gYmUgcmVuZGVyZWQgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtzdHlsZV09XCJleHBcImAgdXNhZ2UuIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvXG4gKiB0aGUgRWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSBwbGFjZWQgd2l0aCByZXNwZWN0IHRvIGFueSBzdHlsZXMgc2V0IHdpdGggYGVsZW1lbnRTdHlsZVByb3BgLlxuICogSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGBudWxsYCB0aGVuIHRoZXkgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQgKHVubGVzcyB0aGUgc2FtZVxuICogc3R5bGUgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWQgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIHVzaW5nIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IG51bGwpOiB2b2lkIHtcbiAgdXBkYXRlU3R5bGluZ01hcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIGNsYXNzZXMsIHN0eWxlcyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFRleHRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIGNvbnN0IHRleHROb2RlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dE5vZGUsIG51bGwsIG51bGwpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIHRleHROb2RlLCB2aWV3RGF0YSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGNvbnN0IGV4aXN0aW5nTm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBhbnkgYXMgTFRleHROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZSwgJ0xOb2RlIHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZS5uYXRpdmUsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGV4aXN0aW5nTm9kZS5uYXRpdmUsIHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ05vZGUubmF0aXZlLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBEaXJlY3RpdmVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIGEgZGlyZWN0aXZlIGFuZCB0aGVpciBhc3NvY2lhdGVkIGNvbnRlbnQgcXVlcmllcy5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZik7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUsICdwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZScpO1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuXG4gIGNvbnN0IGlzQ29tcG9uZW50ID0gKGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPikudGVtcGxhdGU7XG4gIGlmIChpc0NvbXBvbmVudCkge1xuICAgIGFkZENvbXBvbmVudExvZ2ljKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCB0Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlRGVmLmhvc3RWYXJzKTtcbiAgfVxuXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhkaXJlY3RpdmVEZWZJZHgsIGluc3RhbmNlLCBkaXJlY3RpdmVEZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzKCk7XG4gIH1cblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IENvbXBvbmVudERlZkludGVybmFsPFQ+KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5pbmRleCBhcyBudW1iZXIsXG4gICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKHByZXZpb3VzT3JQYXJlbnROb2RlLm5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmKSwgdFZpZXcsXG4gICAgICAgICAgaW5zdGFuY2UsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKSk7XG5cbiAgLy8gV2UgbmVlZCB0byBzZXQgdGhlIGhvc3Qgbm9kZS9kYXRhIGhlcmUgYmVjYXVzZSB3aGVuIHRoZSBjb21wb25lbnQgTE5vZGUgd2FzIGNyZWF0ZWQsXG4gIC8vIHdlIGRpZG4ndCB5ZXQga25vdyBpdCB3YXMgYSBjb21wb25lbnQgKGp1c3QgYW4gZWxlbWVudCkuXG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhc3tkYXRhOiBMVmlld0RhdGF9KS5kYXRhID0gY29tcG9uZW50VmlldztcbiAgKGNvbXBvbmVudFZpZXcgYXMgTFZpZXdEYXRhKVtIT1NUX05PREVdID0gcHJldmlvdXNPclBhcmVudE5vZGUgYXMgTEVsZW1lbnROb2RlO1xuXG4gIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcocHJldmlvdXNPclBhcmVudE5vZGUubm9kZUluamVjdG9yLCBpbnN0YW5jZSwgY29tcG9uZW50Vmlldyk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soKTtcbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBkaXJlY3RpdmVDcmVhdGUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudFxuICpcbiAqIFRoaXMgdmVyc2lvbiBkb2VzIG5vdCBjb250YWluIGZlYXR1cmVzIHRoYXQgd2UgZG9uJ3QgYWxyZWFkeSBzdXBwb3J0IGF0IHJvb3QgaW5cbiAqIGN1cnJlbnQgQW5ndWxhci4gRXhhbXBsZTogbG9jYWwgcmVmcyBhbmQgaW5wdXRzIG9uIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZURpcmVjdGl2ZUNyZWF0ZTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBkaXJlY3RpdmU6IFQsXG4gICAgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgZGlyZWN0aXZlLCBOR19IT1NUX1NZTUJPTCwge2VudW1lcmFibGU6IGZhbHNlLCB2YWx1ZTogcHJldmlvdXNPclBhcmVudE5vZGV9KTtcblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSB2aWV3RGF0YVtESVJFQ1RJVkVTXSA9IGRpcmVjdGl2ZXMgPSBbXTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgsIGRpcmVjdGl2ZXMpO1xuICBkaXJlY3RpdmVzW2luZGV4XSA9IGRpcmVjdGl2ZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBmbGFncyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzO1xuICAgIGlmICgoZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaykgPT09IDApIHtcbiAgICAgIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkOlxuICAgICAgLy8gLSBzYXZlIHRoZSBpbmRleCxcbiAgICAgIC8vIC0gc2V0IHRoZSBudW1iZXIgb2YgZGlyZWN0aXZlcyB0byAxXG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncyA9XG4gICAgICAgICAgaW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQgfCAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPbmx5IG5lZWQgdG8gYnVtcCB0aGUgc2l6ZSB3aGVuIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZFxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MrKztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGlQdWJsaWMgPSBkaXJlY3RpdmVEZWYgIS5kaVB1YmxpYztcbiAgICBpZiAoZGlQdWJsaWMpIGRpUHVibGljKGRpcmVjdGl2ZURlZiAhKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHNldFVwQXR0cmlidXRlcyhcbiAgICAgICAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzIGFzIHN0cmluZ1tdKTtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgaW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZzt9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIHBhcmVudExOb2RlIHRoZSBMTm9kZSBpbiB3aGljaCB0aGUgY29udGFpbmVyJ3MgY29udGVudCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgcGFyZW50TE5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudExOb2RlLCAnY29udGFpbmVycyBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xuICBsZXQgcmVuZGVyUGFyZW50ID0gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnRMTm9kZSwgY3VycmVudFZpZXcpID9cbiAgICAgIHBhcmVudExOb2RlIGFzIExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSA6XG4gICAgICBudWxsO1xuICBpZiAocmVuZGVyUGFyZW50ICYmIHJlbmRlclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIHJlbmRlclBhcmVudCA9IGdldFBhcmVudExOb2RlKHJlbmRlclBhcmVudCBhcyBMVmlld05vZGUpICEuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgfVxuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IG51bGwgOiAwLCAgLy8gYWN0aXZlIGluZGV4XG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgcmVuZGVyUGFyZW50IGFzIExFbGVtZW50Tm9kZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGFuIG5nLXRlbXBsYXRlIChkeW5hbWljYWxseS1pbnNlcnRlZCB2aWV3KSwgZS5nLlxuICpcbiAqIDxuZy10ZW1wbGF0ZSAjZm9vPlxuICogICAgPGRpdj48L2Rpdj5cbiAqIDwvbmctdGVtcGxhdGU+XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBJbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgQSBmdW5jdGlvbiB3aGljaCBleHRyYWN0cyBsb2NhbC1yZWZzIHZhbHVlcyBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAqICAgICAgICBEZWZhdWx0cyB0byB0aGUgY3VycmVudCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgbG9jYWwtcmVmLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIC8vIFRPRE86IGNvbnNpZGVyIGEgc2VwYXJhdGUgbm9kZSB0eXBlIGZvciB0ZW1wbGF0ZXNcbiAgY29uc3Qgbm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwsIGxvY2FsUmVmcyB8fCBudWxsKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobm9kZSwgbG9jYWxSZWZzLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIGN1cnJlbnRRdWVyaWVzICYmIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUobm9kZSkpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKG5vZGUudE5vZGUuZmxhZ3MsIHRWaWV3KTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlIGZvciBpbmxpbmUgdmlld3MsIGUuZy5cbiAqXG4gKiAlIGlmIChzaG93aW5nKSB7XG4gKiAgIDxkaXY+PC9kaXY+XG4gKiAlIH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lcihpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gIGZpcnN0VGVtcGxhdGVQYXNzICYmIChub2RlLnROb2RlLnRWaWV3cyA9IFtdKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbn1cblxuZnVuY3Rpb24gY29udGFpbmVySW50ZXJuYWwoXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IExDb250YWluZXJOb2RlIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnY29udGFpbmVyIG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCBjdXJyZW50UGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhO1xuICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihjdXJyZW50UGFyZW50LCB2aWV3RGF0YSk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgY29tbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMsIGxDb250YWluZXIpO1xuICBhcHBlbmRDaGlsZChnZXRQYXJlbnRMTm9kZShub2RlKSwgY29tbWVudCwgdmlld0RhdGEpO1xuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKHZpZXdEYXRhLCBpbmRleCArIEhFQURFUl9PRkZTRVQsIG5vZGUuZGF0YSk7XG5cbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lcltRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmNvbnRhaW5lcigpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgTE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAgIC8vIGJlZm9yZSB0aGV5IGFyZSBjYWxsZWQgaW4gZW1iZWRkZWQgdmlld3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkuXG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyTm9kZS5cbiAqXG4gKiBNYXJraW5nIHRoZSBlbmQgb2YgTENvbnRhaW5lck5vZGUgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCBWaWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyID0gcHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBuZXh0SW5kZXggPSBjb250YWluZXIuZGF0YVtBQ1RJVkVfSU5ERVhdICE7XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgY29udGFpbmVyLmRhdGFbVklFV1NdLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcoY29udGFpbmVyLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlcyB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3RGF0YTogTFZpZXdEYXRhKSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBnZXRMVmlld0NoaWxkKGxWaWV3RGF0YSk7IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXdEYXRhIG9yIGFuIExDb250YWluZXIgaW5zdGFuY2UsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5IGludGVyZXN0ZWRcbiAgICAvLyBpbiBMQ29udGFpbmVyLiBXZSBjYW4gdGVsbCBpdCdzIGFuIExDb250YWluZXIgYmVjYXVzZSBpdHMgbGVuZ3RoIGlzIGxlc3MgdGhhbiB0aGUgTFZpZXdEYXRhXG4gICAgLy8gaGVhZGVyLlxuICAgIGlmIChjdXJyZW50Lmxlbmd0aCA8IEhFQURFUl9PRkZTRVQgJiYgY3VycmVudFtBQ1RJVkVfSU5ERVhdID09PSBudWxsKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBjdXJyZW50IGFzIExDb250YWluZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbFZpZXdOb2RlID0gY29udGFpbmVyW1ZJRVdTXVtpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXdEYXRhID0gbFZpZXdOb2RlLmRhdGE7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGR5bmFtaWNWaWV3RGF0YVtUVklFV10sICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKFxuICAgICAgICAgICAgbFZpZXdOb2RlLCBkeW5hbWljVmlld0RhdGFbVFZJRVddLCBkeW5hbWljVmlld0RhdGFbQ09OVEVYVF0gISwgUmVuZGVyRmxhZ3MuVXBkYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGNvbnRhaW5lck5vZGUgd2hlcmUgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHN0YXJ0SWR4IHN0YXJ0aW5nIGluZGV4IGluIHRoZSB2aWV3cyBhcnJheSB0byBzZWFyY2ggZnJvbVxuICogQHBhcmFtIHZpZXdCbG9ja0lkIGV4YWN0IHZpZXcgYmxvY2sgaWQgdG8gbG9vayBmb3JcbiAqIEByZXR1cm5zIGluZGV4IG9mIGEgZm91bmQgdmlldyBvciAtMSBpZiBub3QgZm91bmRcbiAqL1xuZnVuY3Rpb24gc2NhbkZvclZpZXcoXG4gICAgY29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUsIHN0YXJ0SWR4OiBudW1iZXIsIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld05vZGV8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gY29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2aWV3QXRQb3NpdGlvbklkID0gdmlld3NbaV0uZGF0YVtUVklFV10uaWQ7XG4gICAgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPT09IHZpZXdCbG9ja0lkKSB7XG4gICAgICByZXR1cm4gdmlld3NbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhjb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaCBoZXJlXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFya3MgdGhlIHN0YXJ0IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXdCbG9ja0lkIFRoZSBJRCBvZiB0aGlzIHZpZXdcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3U3RhcnQodmlld0Jsb2NrSWQ6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcik6IFJlbmRlckZsYWdzIHtcbiAgY29uc3QgY29udGFpbmVyID1cbiAgICAgIChpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDogZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpKSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGxDb250YWluZXIgPSBjb250YWluZXIuZGF0YTtcbiAgbGV0IHZpZXdOb2RlOiBMVmlld05vZGV8bnVsbCA9IHNjYW5Gb3JWaWV3KGNvbnRhaW5lciwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld05vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IHZpZXdOb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgICBlbnRlclZpZXcodmlld05vZGUuZGF0YSwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdoZW4gd2UgY3JlYXRlIGEgbmV3IExWaWV3LCB3ZSBhbHdheXMgcmVzZXQgdGhlIHN0YXRlIG9mIHRoZSBpbnN0cnVjdGlvbnMuXG4gICAgY29uc3QgbmV3VmlldyA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXIsIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29uc3RzLCB2YXJzLCBjb250YWluZXIpLCBudWxsLFxuICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuXG4gICAgaWYgKGxDb250YWluZXJbUVVFUklFU10pIHtcbiAgICAgIG5ld1ZpZXdbUVVFUklFU10gPSBsQ29udGFpbmVyW1FVRVJJRVNdICEuY3JlYXRlVmlldygpO1xuICAgIH1cblxuICAgIGVudGVyVmlldyhcbiAgICAgICAgbmV3Vmlldywgdmlld05vZGUgPSBjcmVhdGVMTm9kZSh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIG5ld1ZpZXcpKTtcbiAgfVxuICBpZiAoY29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyLCB2aWV3Tm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISsrO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IExDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gKHBhcmVudCAhLnROb2RlIGFzIFRDb250YWluZXJOb2RlKS50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICB2aWV3SW5kZXgsIG51bGwsIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICBpc1BhcmVudCA9IGZhbHNlO1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IHZpZXdEYXRhW0hPU1RfTk9ERV0gYXMgTFZpZXdOb2RlO1xuICBsZWF2ZVZpZXcodmlld0RhdGFbUEFSRU5UXSAhKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzUGFyZW50LCBmYWxzZSwgJ2lzUGFyZW50Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBhZGp1c3RlZEVsZW1lbnRJbmRleCAgRWxlbWVudCBpbmRleCBpbiBMVmlld0RhdGFbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGFkanVzdGVkRWxlbWVudEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgZWxlbWVudCA9IHZpZXdEYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShlbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXdEYXRhIGF0dGFjaGVkLmApO1xuICBjb25zdCBob3N0VmlldyA9IGVsZW1lbnQuZGF0YSAhO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0VmlldywgZWxlbWVudCwgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGU6IExFbGVtZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KHZpZXdEYXRhKTtcblxuICBpZiAoIWNvbXBvbmVudE5vZGUudE5vZGUucHJvamVjdGlvbikge1xuICAgIGNvbnN0IG5vT2ZOb2RlQnVja2V0cyA9IHNlbGVjdG9ycyA/IHNlbGVjdG9ycy5sZW5ndGggKyAxIDogMTtcbiAgICBjb25zdCBwRGF0YTogKFROb2RlIHwgbnVsbClbXSA9IGNvbXBvbmVudE5vZGUudE5vZGUucHJvamVjdGlvbiA9XG4gICAgICAgIG5ldyBBcnJheShub09mTm9kZUJ1Y2tldHMpLmZpbGwobnVsbCk7XG4gICAgY29uc3QgdGFpbHM6IChUTm9kZSB8IG51bGwpW10gPSBwRGF0YS5zbGljZSgpO1xuXG4gICAgbGV0IGNvbXBvbmVudENoaWxkID0gY29tcG9uZW50Tm9kZS50Tm9kZS5jaGlsZDtcblxuICAgIHdoaWxlIChjb21wb25lbnRDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgYnVja2V0SW5kZXggPVxuICAgICAgICAgIHNlbGVjdG9ycyA/IG1hdGNoaW5nU2VsZWN0b3JJbmRleChjb21wb25lbnRDaGlsZCwgc2VsZWN0b3JzLCB0ZXh0U2VsZWN0b3JzICEpIDogMDtcbiAgICAgIGNvbnN0IG5leHROb2RlID0gY29tcG9uZW50Q2hpbGQubmV4dDtcblxuICAgICAgaWYgKHRhaWxzW2J1Y2tldEluZGV4XSkge1xuICAgICAgICB0YWlsc1tidWNrZXRJbmRleF0gIS5uZXh0ID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwRGF0YVtidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcbiAgICAgICAgY29tcG9uZW50Q2hpbGQubmV4dCA9IG51bGw7XG4gICAgICB9XG4gICAgICB0YWlsc1tidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcblxuICAgICAgY29tcG9uZW50Q2hpbGQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiBwcm9qZWN0aW9uKCkgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHByb2plY3Rpb24oKSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogTFByb2plY3Rpb25Ob2RlW10gPSBbXTtcblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUobm9kZUluZGV4LCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbnVsbCwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gV2UgY2FuJ3QgdXNlIHZpZXdEYXRhW0hPU1RfTk9ERV0gYmVjYXVzZSBwcm9qZWN0aW9uIG5vZGVzIGNhbiBiZSBuZXN0ZWQgaW4gZW1iZWRkZWQgdmlld3MuXG4gIGlmIChub2RlLnROb2RlLnByb2plY3Rpb24gPT09IG51bGwpIG5vZGUudE5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgaXNQYXJlbnQgPSBmYWxzZTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcblxuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnQsIHZpZXdEYXRhKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50SG9zdCh2aWV3RGF0YSk7XG4gICAgbGV0IG5vZGVUb1Byb2plY3QgPSAoY29tcG9uZW50Tm9kZS50Tm9kZS5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbc2VsZWN0b3JJbmRleF07XG4gICAgbGV0IHByb2plY3RlZFZpZXcgPSBjb21wb25lbnROb2RlLnZpZXc7XG4gICAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcbiAgICBsZXQgZ3JhbmRwYXJlbnQ6IExDb250YWluZXJOb2RlO1xuICAgIGNvbnN0IHJlbmRlclBhcmVudCA9IHBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICAgIChncmFuZHBhcmVudCA9IGdldFBhcmVudExOb2RlKHBhcmVudCkgYXMgTENvbnRhaW5lck5vZGUpICYmXG4gICAgICAgICAgICBncmFuZHBhcmVudC5kYXRhW1JFTkRFUl9QQVJFTlRdICEgOlxuICAgICAgICBwYXJlbnQgYXMgTEVsZW1lbnROb2RlO1xuXG4gICAgY29uc3QgcGFyZW50VmlldyA9IHZpZXdEYXRhW0hPU1RfTk9ERV0udmlldztcbiAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgaWYgKG5vZGVUb1Byb2plY3QudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gVGhpcyBub2RlIGlzIHJlLXByb2plY3RlZCwgc28gd2UgbXVzdCBnbyB1cCB0aGUgdHJlZSB0byBnZXQgaXRzIHByb2plY3RlZCBub2Rlcy5cbiAgICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudEhvc3QgPSBmaW5kQ29tcG9uZW50SG9zdChwcm9qZWN0ZWRWaWV3KTtcbiAgICAgICAgY29uc3QgZmlyc3RQcm9qZWN0ZWROb2RlID0gKGN1cnJlbnRDb21wb25lbnRIb3N0LnROb2RlLnByb2plY3Rpb24gYXMoXG4gICAgICAgICAgICBUTm9kZSB8IG51bGwpW10pW25vZGVUb1Byb2plY3QucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICAgIGlmIChmaXJzdFByb2plY3RlZE5vZGUpIHtcbiAgICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBwcm9qZWN0ZWRWaWV3W25vZGVUb1Byb2plY3QuaW5kZXhdO1xuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBmaXJzdFByb2plY3RlZE5vZGU7XG4gICAgICAgICAgcHJvamVjdGVkVmlldyA9IGN1cnJlbnRDb21wb25lbnRIb3N0LnZpZXc7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGxOb2RlID0gcHJvamVjdGVkVmlld1tub2RlVG9Qcm9qZWN0LmluZGV4XTtcbiAgICAgICAgbE5vZGUudE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcbiAgICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShcbiAgICAgICAgICAgIGxOb2RlIGFzIExUZXh0Tm9kZSB8IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlLCBwYXJlbnQsIHZpZXdEYXRhLCByZW5kZXJQYXJlbnQsXG4gICAgICAgICAgICBwYXJlbnRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgYXJlIGZpbmlzaGVkIHdpdGggYSBsaXN0IG9mIHJlLXByb2plY3RlZCBub2Rlcywgd2UgbmVlZCB0byBnZXRcbiAgICAgIC8vIGJhY2sgdG8gdGhlIHJvb3QgcHJvamVjdGlvbiBub2RlIHRoYXQgd2FzIHJlLXByb2plY3RlZC5cbiAgICAgIGlmIChub2RlVG9Qcm9qZWN0Lm5leHQgPT09IG51bGwgJiYgcHJvamVjdGVkVmlldyAhPT0gY29tcG9uZW50Tm9kZS52aWV3KSB7XG4gICAgICAgIC8vIG1vdmUgZG93biBpbnRvIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgd2UncmUgcHJvamVjdGluZyByaWdodCBub3dcbiAgICAgICAgY29uc3QgbE5vZGUgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV07XG4gICAgICAgIG5vZGVUb1Byb2plY3QgPSBsTm9kZS50Tm9kZTtcbiAgICAgICAgcHJvamVjdGVkVmlldyA9IGxOb2RlLnZpZXc7XG4gICAgICB9XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3RGF0YVtdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld0RhdGF8TENvbnRhaW5lcj4oXG4gICAgY3VycmVudFZpZXc6IExWaWV3RGF0YSwgYWRqdXN0ZWRIb3N0SW5kZXg6IG51bWJlciwgc3RhdGU6IFQpOiBUIHtcbiAgaWYgKGN1cnJlbnRWaWV3W1RBSUxdKSB7XG4gICAgY3VycmVudFZpZXdbVEFJTF0gIVtORVhUXSA9IHN0YXRlO1xuICB9IGVsc2UgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuY2hpbGRJbmRleCA9IGFkanVzdGVkSG9zdEluZGV4O1xuICB9XG4gIGN1cnJlbnRWaWV3W1RBSUxdID0gc3RhdGU7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlld0RhdGEgZGlydHkuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobm9kZTogTEVsZW1lbnROb2RlKTogdm9pZCB7XG4gIC8vIEJlY2F1c2UgZGF0YSBmbG93cyBkb3duIHRoZSBjb21wb25lbnQgdHJlZSwgYW5jZXN0b3JzIGRvIG5vdCBuZWVkIHRvIGJlIG1hcmtlZCBkaXJ0eVxuICBpZiAobm9kZS5kYXRhICYmICEobm9kZS5kYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhW0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKlxuICogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgc28gaXRzIGhvc3QgdmlldyBhbmQgaXRzIGFuY2VzdG9yIHZpZXdzIHdpbGwgYmUgbWFya2VkIGRpcnR5XG4gKiB3aGVuZXZlciB0aGUgZXZlbnQgZmlyZXMuIE5lY2Vzc2FyeSB0byBzdXBwb3J0IE9uUHVzaCBjb21wb25lbnRzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5TG9naWMoXG4gICAgdmlldzogTFZpZXdEYXRhLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogKGU6IEV2ZW50KSA9PiBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gQWxzbyB3cmFwcyB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChcbiAgICB2aWV3OiBMVmlld0RhdGEsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX21hcmtWaWV3RGlydHkoZTogRXZlbnQpIHtcbiAgICBtYXJrVmlld0RpcnR5KHZpZXcpO1xuICAgIGlmIChsaXN0ZW5lckZuKGUpID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkodmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGxldCBjdXJyZW50VmlldzogTFZpZXdEYXRhID0gdmlldztcblxuICB3aGlsZSAoY3VycmVudFZpZXdbUEFSRU5UXSAhPSBudWxsKSB7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gIH1cbiAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnRWaWV3W0NPTlRFWFRdLCAncm9vdENvbnRleHQnKTtcbiAgc2NoZWR1bGVUaWNrKGN1cnJlbnRWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gYGRldGVjdENoYW5nZXNgLCBidXQgaW52b2tlZCBvbiByb290IGNvbXBvbmVudC4gQWRkaXRpb25hbGx5LCBgdGlja2BcbiAqIGV4ZWN1dGVzIGxpZmVjeWNsZSBob29rcyBhbmQgY29uZGl0aW9uYWxseSBjaGVja3MgY29tcG9uZW50cyBiYXNlZCBvbiB0aGVpclxuICogYENoYW5nZURldGVjdGlvblN0cmF0ZWd5YCBhbmQgZGlydGluZXNzLlxuICpcbiAqIFRoZSBwcmVmZXJyZWQgd2F5IHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBpcyB0byBjYWxsIGBtYXJrRGlydHlgLiBgbWFya0RpcnR5YCBpbnRlcm5hbGx5XG4gKiBzY2hlZHVsZXMgYHRpY2tgIHVzaW5nIGEgc2NoZWR1bGVyIGluIG9yZGVyIHRvIGNvYWxlc2NlIG11bHRpcGxlIGBtYXJrRGlydHlgIGNhbGxzIGludG8gYVxuICogc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gcnVuLiBCeSBkZWZhdWx0LCB0aGUgc2NoZWR1bGVyIGlzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLCBidXQgY2FuXG4gKiBiZSBjaGFuZ2VkIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBhbmQgcHJvdmlkaW5nIHRoZSBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aWNrPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KGNvbXBvbmVudCk7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gcm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShyb290Q29tcG9uZW50KTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3ROb2RlLmRhdGEsICdDb21wb25lbnQgaG9zdCBub2RlIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhbiBMVmlldycpO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdE5vZGUsIGdldFJvb3RWaWV3KHJvb3RDb21wb25lbnQpLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlIHRoZSByb290IHZpZXcgZnJvbSBhbnkgY29tcG9uZW50IGJ5IHdhbGtpbmcgdGhlIHBhcmVudCBgTFZpZXdEYXRhYCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3RGF0YWAuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBhbnkgY29tcG9uZW50XG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJvb3RWaWV3KGNvbXBvbmVudDogYW55KTogTFZpZXdEYXRhIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIGxldCBsVmlld0RhdGEgPSBsRWxlbWVudE5vZGUudmlldztcbiAgd2hpbGUgKGxWaWV3RGF0YVtQQVJFTlRdKSB7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgfVxuICByZXR1cm4gbFZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuIFRoZXJlIHNob3VsZFxuICogYmUgdmVyeSBsaXR0bGUgcmVhc29uIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiBkaXJlY3RseSBzaW5jZSBhIHByZWZlcnJlZCB3YXkgdG8gZG8gY2hhbmdlXG4gKiBkZXRlY3Rpb24gaXMgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gdGhlIGNvbXBvbmVudCBhbmQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBjYWxsIHRoaXMgbWV0aG9kXG4gKiBhdCBzb21lIGZ1dHVyZSBwb2ludCBpbiB0aW1lLiBUaGlzIGlzIGJlY2F1c2UgYSBzaW5nbGUgdXNlciBhY3Rpb24gb2Z0ZW4gcmVzdWx0cyBpbiBtYW55XG4gKiBjb21wb25lbnRzIGJlaW5nIGludmFsaWRhdGVkIGFuZCBjYWxsaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gZWFjaCBjb21wb25lbnQgc3luY2hyb25vdXNseVxuICogd291bGQgYmUgaW5lZmZpY2llbnQuIEl0IGlzIGJldHRlciB0byB3YWl0IHVudGlsIGFsbCBjb21wb25lbnRzIGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kXG4gKiB0aGVuIHBlcmZvcm0gc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gYWNyb3NzIGFsbCBvZiB0aGUgY29tcG9uZW50c1xuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3RGF0YSBpbnN0YW5jZS4nKTtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGhvc3ROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLCBob3N0Tm9kZSwgY29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhOiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3RGF0YVtDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSB0cnVlO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YSk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEsIGhvc3ROb2RlOiBMRWxlbWVudE5vZGUsIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Tm9kZSk7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3QgdGVtcGxhdGVGbiA9IGhvc3RUVmlldy50ZW1wbGF0ZSAhO1xuICBjb25zdCB2aWV3UXVlcnkgPSBob3N0VFZpZXcudmlld1F1ZXJ5O1xuXG4gIHRyeSB7XG4gICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgIGNyZWF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGhvc3RWaWV3W0ZMQUdTXSwgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgdXBkYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld1F1ZXJ5PFQ+KFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBmbGFnczogTFZpZXdGbGFncywgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkgJiYgKGZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpKSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3UXVlcnk8VD4odmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5KSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLlVwZGF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbWFya1ZpZXdEaXJ0eShsRWxlbWVudE5vZGUudmlldyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHYwKTtcbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMztcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIHN1ZmZpeCA6XG4gICAgICAgICAgICAgICAgICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGUgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NikgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA3O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCBjb250ZXh0Vmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdLFxuICAgICAgICAgICAgICAgICAgICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShxdWVyeUxpc3RJZHgsIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gISk7XG5cbiAgcmV0dXJuIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50KGluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gbG9hZEVsZW1lbnRJbnRlcm5hbChpbmRleCwgdmlld0RhdGEpO1xufVxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uodmlld0RhdGFbYmluZGluZ0luZGV4XSk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwodmlld0RhdGFbYmluZGluZ0luZGV4XSwgTk9fQ0hBTkdFLCAnU3RvcmVkIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIHJldHVybiB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYW55KTogYm9vbGVhbiB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbCh2YWx1ZSwgTk9fQ0hBTkdFLCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgICAgIGJpbmRpbmdJbmRleCwgdmlld0RhdGEubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHRvIE5PX0NIQU5HRWApO1xuXG4gIGlmICh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID09PSBOT19DSEFOR0UpIHtcbiAgICB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNEaWZmZXJlbnQodmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUsIGNoZWNrTm9DaGFuZ2VzTW9kZSkpIHtcbiAgICB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlKGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gICAgdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBhbmQgcmV0dXJucyB0aGUgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gdXBkYXRlQmluZGluZyhiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IGFueSB7XG4gIHJldHVybiB2aWV3RGF0YVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4LCBleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4ICsgMiwgZXhwMykgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXggKyAyLCBleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiB0Vmlldztcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRlbnRRdWVyeTxRPihxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxRPik6IHZvaWQge1xuICBjb25zdCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoID1cbiAgICAgICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdIHx8ICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKHF1ZXJ5TGlzdCk7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxO1xuICAgIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gICAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlldy5jb250ZW50UXVlcmllc1t0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggLSAyXSA6IC0xO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goY3VycmVudERpcmVjdGl2ZUluZGV4LCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydERlZmluZWQoZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbChpbmRleCwgYXJyIHx8IHZpZXdEYXRhKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSB2aWV3RGF0YTtcbiAgYXNzZXJ0RXF1YWwoXG4gICAgICBhcnIubGVuZ3RoLCBpbmRleCwgYGluZGV4ICR7aW5kZXh9IGV4cGVjdGVkIHRvIGJlIGF0IHRoZSBlbmQgb2YgYXJyIChsZW5ndGggJHthcnIubGVuZ3RofSlgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlPFQ+KGNvbXBvbmVudDogVCk6IExFbGVtZW50Tm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2V4cGVjdGluZyBjb21wb25lbnQgZ290IG51bGwnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gKGNvbXBvbmVudCBhcyBhbnkpW05HX0hPU1RfU1lNQk9MXSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ29iamVjdCBpcyBub3QgYSBjb21wb25lbnQnKTtcbiAgcmV0dXJuIGxFbGVtZW50Tm9kZTtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcbiJdfQ==