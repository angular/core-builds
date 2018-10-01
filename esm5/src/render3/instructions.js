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
import { getRootView } from './discovery_utils';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, RENDER_PARENT, VIEWS } from './interfaces/container';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, DIRECTIVES, FLAGS, HEADER_OFFSET, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, findComponentView, getHostElementNode, getLViewChild, getRenderParent, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { allocStylingContext, createStylingContextTemplate, renderStyling as renderElementStyles, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling';
import { assertDataInRangeInternal, getLNode, isContentQueryHost, isDifferent, loadElementInternal, loadInternal, stringify } from './util';
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
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
/**
 * Store the element depth count. This is used to identify the root elements of the template
 * so that we can than attach `LViewData` to only those elements.
 */
var elementDepthCount;
/**
 * Stores whether directives should be matched to elements.
 *
 * When template contains `ngNonBindable` than we need to prevent the runtime form matching
 * directives on children of that element.
 *
 * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 * </div>
 * ```
 */
var bindingsEnabled;
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
/** Used to set the parent property when nodes are created and track query results. */
var previousOrParentTNode;
export function getPreviousOrParentNode() {
    return previousOrParentTNode == null || previousOrParentTNode === viewData[HOST_NODE] ?
        getHostElementNode(viewData) :
        getLNode(previousOrParentTNode, viewData);
}
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
export function setEnvironment(tNode, view) {
    previousOrParentTNode = tNode;
    viewData = view;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
 */
var isParent;
var tView;
var currentQueries;
/**
 * Query instructions can ask for "current queries" in 2 different cases:
 * - when creating view queries (at the root of a component view, before any node is created - in
 * this case currentQueries points to view queries)
 * - when creating content queries (i.e. this previousOrParentTNode points to a node on which we
 * create content queries).
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
export function enterView(newView, hostTNode) {
    var oldView = viewData;
    directives = newView && newView[DIRECTIVES];
    tView = newView && newView[TVIEW];
    creationMode = newView && (newView[FLAGS] & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && tView.firstTemplatePass;
    bindingRootIndex = newView && tView.bindingStartIndex;
    renderer = newView && newView[RENDERER];
    previousOrParentTNode = hostTNode;
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
    setHostBindings(tView.hostBindings);
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
            if (firstTemplatePass) {
                for (var i_1 = 0; i_1 < def.hostVars; i_1++) {
                    tView.blueprint.push(NO_CHANGE);
                    viewData.push(NO_CHANGE);
                }
            }
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
    instance[PARENT] = instance[DECLARATION_VIEW] = viewData;
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
export function createLNodeObject(type, native, state) {
    return { native: native, data: state, dynamicLContainerNode: null };
}
export function createNodeAtIndex(index, type, native, name, attrs, state) {
    var parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
    var tParent = parentInSameView ? parent : null;
    var isState = state != null;
    var node = createLNodeObject(type, native, isState ? state : null);
    var tNode;
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in tView.node.
        tNode = (state ? state[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        var adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        var tData = tView.data;
        ngDevMode && assertLessThan(adjustedIndex, viewData.length, "Slot should have been initialized with null");
        viewData[adjustedIndex] = node;
        if (tData[adjustedIndex] == null) {
            var tNode_1 = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentTNode) {
                previousOrParentTNode.next = tNode_1;
                if (previousOrParentTNode.dynamicContainerNode)
                    previousOrParentTNode.dynamicContainerNode.next = tNode_1;
            }
        }
        tNode = tData[adjustedIndex];
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
    // View nodes and host elements need to set their host node (components do not save host TNodes)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        var lViewData = state;
        ngDevMode &&
            assertEqual(lViewData[HOST_NODE], null, 'lViewData[HOST_NODE] should not have been initialized');
        lViewData[HOST_NODE] = tNode;
        if (lViewData[TVIEW].firstTemplatePass) {
            lViewData[TVIEW].node = tNode;
        }
    }
    previousOrParentTNode = tNode;
    isParent = true;
    return tNode;
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
    previousOrParentTNode = null;
    elementDepthCount = 0;
    bindingsEnabled = true;
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
        renderer = providedRendererFactory.createRenderer(null, null);
        // We need to create a root view so it's possible to look up the host element through its index
        tView = createTView(-1, null, 1, 0, null, null, null);
        viewData = createLViewData(renderer, tView, {}, 2 /* CheckAlways */ | 64 /* IsRoot */);
        var componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        var componentLView = createLViewData(renderer, componentTView, context, 2 /* CheckAlways */, sanitizer);
        createNodeAtIndex(0, 3 /* Element */, hostNode, null, null, componentLView);
        host = loadElement(0);
    }
    var hostView = host.data;
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(hostView, context, templateFn);
    return host;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries, injectorIndex) {
    var _isParent = isParent;
    var _previousOrParentTNode = previousOrParentTNode;
    isParent = true;
    previousOrParentTNode = null;
    var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    createNodeAtIndex(-1, 2 /* View */, null, null, null, lView);
    if (tView.firstTemplatePass) {
        tView.node.injectorIndex = injectorIndex;
    }
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
 */
export function renderEmbeddedTemplate(viewToRender, tView, context, rf) {
    var _isParent = isParent;
    var _previousOrParentTNode = previousOrParentTNode;
    var oldView;
    if (viewToRender[FLAGS] & 64 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(viewToRender[CONTEXT]);
    }
    else {
        try {
            isParent = true;
            previousOrParentTNode = null;
            oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
            namespaceHTML();
            tView.template(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews();
            }
            else {
                viewToRender[TVIEW].firstTemplatePass = firstTemplatePass = false;
            }
        }
        finally {
            // renderEmbeddedTemplate() is called twice in fact, once for creation only and then once for
            // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
            var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(oldView, isCreationOnly);
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
 * @param level The relative level of the view from which to grab context compared to contextVewData
 * @returns context
 */
export function nextContext(level) {
    if (level === void 0) { level = 1; }
    contextViewData = walkUpViews(level, contextViewData);
    return contextViewData[CONTEXT];
}
export function renderComponentOrTemplate(hostView, componentOrContext, templateFn) {
    var oldView = enterView(hostView, hostView[HOST_NODE]);
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
    var tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null, null);
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(localRefs);
}
/** Mark the end of the <ng-container>. */
export function elementContainerEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
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
    var tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null, null);
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
function nativeNodeLocalRefExtractor(tNode, currentView) {
    return getLNode(tNode, currentView).native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param lNode LNode for which directive and locals should be created
 * @param localRefs Local refs of the node in question
 * @param localRefExtractor mapping function that extracts local ref value from LNode
 */
function createDirectivesAndLocals(localRefs, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = nativeNodeLocalRefExtractor; }
    if (!bindingsEnabled)
        return;
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
                matches || (matches = []);
                if (def.template) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    addComponentLogic(def);
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
        (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
export function queueHostBindingForCheck(dirIndex, hostVars) {
    // Must subtract the header offset because hostBindings functions are generated with
    // instructions that expect element indices that are NOT adjusted (e.g. elementProperty).
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, previousOrParentTNode.index - HEADER_OFFSET);
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, "Directives should only be instantiated directly after first template pass");
    var count = previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(previousOrParentTNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        var start = previousOrParentTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var tDirectives = tView.directives;
        for (var i = start; i < end; i++) {
            var def = tDirectives[i];
            // Component view must be set on node before the factory is created so
            // ChangeDetectorRefs have a way to store component view on creation.
            if (def.template) {
                addComponentLogic(def);
            }
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
function saveResolvedLocalsInData(localRefExtractor) {
    var localNames = previousOrParentTNode.localNames;
    var tNode = previousOrParentTNode;
    if (localNames) {
        var localIndex = previousOrParentTNode.index + 1;
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ? localRefExtractor(tNode, viewData) : directives[index];
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
        currentMatches: null,
        firstChild: null,
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
    var tNode = createNodeAtIndex(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
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
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export function listener(eventName, listenerFn, useCapture) {
    if (useCapture === void 0) { useCapture = false; }
    var tNode = previousOrParentTNode;
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var node = getPreviousOrParentNode();
        ngDevMode && ngDevMode.rendererAddEventListener++;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            var cleanupFn = renderer.listen(node.native, eventName, listenerFn);
            storeCleanupFn(viewData, cleanupFn);
        }
        else {
            var wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            node.native.addEventListener(eventName, wrappedListener, useCapture);
            var cleanupInstances = getCleanup(viewData);
            cleanupInstances.push(wrappedListener);
            if (firstTemplatePass) {
                getTViewCleanup(viewData).push(eventName, tNode.index, cleanupInstances.length - 1, useCapture);
            }
        }
    }
    // subscribe to directive outputs
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tNode.flags, 1 /* Output */);
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
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
    queueLifecycleHooks(previousOrParentTNode.flags, tView);
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
    var tNode = getTNode(index);
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
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
 * Enables directive matching on elements.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 */
export function enableBindings() {
    bindingsEnabled = true;
}
/**
 * Disables directive matching on element.
 *
 *  * Example:
 * ```
 * <my-comp my-directive>
 *   Should match component / directive.
 * </my-comp>
 * <div ngNonBindable>
 *   <!-- disabledBindings() -->
 *   <my-comp my-directive>
 *     Should not match component / directive because we are in ngNonBindable.
 *   </my-comp>
 *   <!-- enableBindings() -->
 * </div>
 * ```
 */
export function disableBindings() {
    bindingsEnabled = false;
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
        injectorIndex: parent ? parent.injectorIndex : -1,
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
    var tNode = previousOrParentTNode;
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
        var tNode = getTNode(index);
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
    var textNative = createTextNode(value, renderer);
    var tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(textNative, tNode, viewData);
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
    var hostNode = getLNode(previousOrParentTNode, viewData);
    var instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef, hostNode);
    if (directiveDef.template) {
        hostNode.data[CONTEXT] = directive;
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
function addComponentLogic(def) {
    var hostNode = getLNode(previousOrParentTNode, viewData);
    var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var componentView = addToViewTree(viewData, previousOrParentTNode.index, createLViewData(rendererFactory.createRenderer(hostNode.native, def), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    hostNode.data = componentView;
    componentView[HOST_NODE] = previousOrParentTNode;
    if (firstTemplatePass)
        queueComponentIndexForCheck();
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
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
        var flags = previousOrParentTNode.flags;
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
        var diPublic = directiveDef.diPublic;
        if (diPublic)
            diPublic(directiveDef);
    }
    if (directiveDef.attributes != null && previousOrParentTNode.type == 3 /* Element */) {
        setUpAttributes(hostNode.native, directiveDef.attributes);
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
 * @param currentView The parent view of the LContainer
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export function createLContainer(currentView, isForViewContainerRef) {
    return [
        isForViewContainerRef ? null : 0,
        currentView,
        null,
        null,
        [],
        null // renderParent, set after node creation
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
    var tNode = containerInternal(index, tagName || null, attrs || null);
    if (firstTemplatePass) {
        tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(localRefs, localRefExtractor);
    currentQueries &&
        (currentQueries = currentQueries.addNode(previousOrParentTNode));
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
 * @param index The index of the container in the data array
 */
export function container(index) {
    var tNode = containerInternal(index, null, null);
    firstTemplatePass && (tNode.tViews = []);
    isParent = false;
}
function containerInternal(index, tagName, attrs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
    var lContainer = createLContainer(viewData);
    ngDevMode && ngDevMode.rendererCreateComment++;
    var comment = renderer.createComment(ngDevMode ? 'container' : '');
    var tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs, lContainer);
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
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    previousOrParentTNode = loadInternal(index, tView.data);
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    isParent = true;
    // Inline containers cannot have style bindings, so we can read the value directly
    viewData[previousOrParentTNode.index].data[ACTIVE_INDEX] = 0;
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
        ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    // Inline containers cannot have style bindings, so we can read the value directly
    var lContainer = viewData[previousOrParentTNode.index].data;
    var nextIndex = lContainer[ACTIVE_INDEX];
    // remove extra views at the end of the container
    while (nextIndex < lContainer[VIEWS].length) {
        removeView(lContainer, previousOrParentTNode, nextIndex);
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
                var dynamicViewData = container_1[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], dynamicViewData[CONTEXT], 2 /* Update */);
            }
        }
    }
}
/**
 * Looks for a view with a given view block id inside a provided LContainer.
 * Removes views that need to be deleted in the process.
 *
 * @param lContainer to search for views
 * @param tContainerNode to search for views
 * @param startIdx starting index in the views array to search from
 * @param viewBlockId exact view block id to look for
 * @returns index of a found view or -1 if not found
 */
function scanForView(lContainer, tContainerNode, startIdx, viewBlockId) {
    var views = lContainer[VIEWS];
    for (var i = startIdx; i < views.length; i++) {
        var viewAtPositionId = views[i][TVIEW].id;
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
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId, consts, vars) {
    // The previous node can be a view node if we are processing an inline for loop
    var containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        previousOrParentTNode.parent :
        previousOrParentTNode;
    // Inline containers cannot have style bindings, so we can read the value directly
    var container = viewData[containerTNode.index];
    var currentView = viewData;
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    var lContainer = container.data;
    var viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
    if (viewToRender) {
        isParent = true;
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = lContainer[QUERIES].createView();
        }
        createNodeAtIndex(viewBlockId, 2 /* View */, null, null, null, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (container) {
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, currentView, lContainer[ACTIVE_INDEX], -1);
        }
        lContainer[ACTIVE_INDEX]++;
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
 * @param viewIndex The index of the TView in TNode.tViews
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param vars The number of bindings and pure function bindings in this template
 * @param container The parent container in which to look for the view's static data
 * @returns TView
 */
function getOrCreateEmbeddedTView(viewIndex, consts, vars, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    var containerTViews = parent.tViews;
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    var viewHost = viewData[HOST_NODE];
    refreshDescendantViews();
    leaveView(viewData[PARENT]);
    previousOrParentTNode = viewHost;
    isParent = false;
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(adjustedElementIndex) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    var element = readElementValue(viewData[adjustedElementIndex]);
    ngDevMode && assertNodeType(tView.data[adjustedElementIndex], 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, "Component's host node should have an LViewData attached.");
    var hostView = element.data;
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        detectChangesInternal(hostView, hostView[CONTEXT]);
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
    var componentNode = findComponentView(viewData)[HOST_NODE];
    if (!componentNode.projection) {
        var noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        var pData = componentNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        var tails = pData.slice();
        var componentChild = componentNode.child;
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
    var tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null, null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is stored on a component's view level
    var componentView = findComponentView(viewData);
    var componentNode = componentView[HOST_NODE];
    var nodeToProject = componentNode.projection[selectorIndex];
    var projectedView = componentView[PARENT];
    var projectionNodeIndex = -1;
    while (nodeToProject) {
        if (nodeToProject.type === 1 /* Projection */) {
            // This node is re-projected, so we must go up the tree to get its projected nodes.
            var currentComponentView = findComponentView(projectedView);
            var currentComponentHost = currentComponentView[HOST_NODE];
            var firstProjectedNode = currentComponentHost.projection[nodeToProject.projection];
            if (firstProjectedNode) {
                projectionNodeStack[++projectionNodeIndex] = nodeToProject;
                projectionNodeStack[++projectionNodeIndex] = projectedView;
                nodeToProject = firstProjectedNode;
                projectedView = currentComponentView[PARENT];
                continue;
            }
        }
        else {
            var lNode = projectedView[nodeToProject.index];
            // This flag must be set now or we won't know that this node is projected
            // if the nodes are inserted into a container later.
            nodeToProject.flags |= 8192 /* isProjected */;
            appendProjectedNode(lNode, nodeToProject, tProjectionNode, viewData, projectedView);
        }
        // If we are finished with a list of re-projected nodes, we need to get
        // back to the root projection node that was re-projected.
        if (nodeToProject.next === null && projectedView !== componentView[PARENT]) {
            projectedView = projectionNodeStack[projectionNodeIndex--];
            nodeToProject = projectionNodeStack[projectionNodeIndex--];
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
/** Wraps an event listener with preventDefault behavior. */
export function wrapListenerWithPreventDefault(listenerFn) {
    return function wrapListenerIn_preventDefault(e) {
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
    while (currentView && !(currentView[FLAGS] & 64 /* IsRoot */)) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = currentView[PARENT];
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext should be defined');
    var rootContext = currentView[CONTEXT];
    var nothingScheduled = rootContext.flags === 0 /* Empty */;
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
 */
export function scheduleTick(rootContext) {
    if (rootContext.clean == _CLEAN_PROMISE) {
        var res_1;
        rootContext.clean = new Promise(function (r) { return res_1 = r; });
        rootContext.scheduler(function () {
            if (rootContext.flags & 1 /* DetectChanges */) {
                rootContext.flags &= ~1 /* DetectChanges */;
                tickRootContext(rootContext);
            }
            if (rootContext.flags & 2 /* FlushPlayers */) {
                rootContext.flags &= ~2 /* FlushPlayers */;
                var playerHandler = rootContext.playerHandler;
                if (playerHandler) {
                    playerHandler.flushPlayers();
                }
            }
            rootContext.clean = _CLEAN_PROMISE;
            res_1(null);
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
        renderComponentOrTemplate(readPatchedLViewData(rootComponent), rootComponent);
    }
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
    var hostNode = getLElementFromComponent(component);
    ngDevMode &&
        assertDefined(hostNode, 'Component host node should be attached to an LViewData instance.');
    detectChangesInternal(hostNode.data, component);
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
export function detectChangesInternal(hostView, component) {
    var hostTView = hostView[TVIEW];
    var oldView = enterView(hostView, hostView[HOST_NODE]);
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
    var elementNode = getLElementFromComponent(component);
    markViewDirty(elementNode.data);
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
export function getTNode(index) {
    return tView.data[index + HEADER_OFFSET];
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
    assertEqual(isParent, true, 'previousOrParentTNode should be a parent');
}
function assertHasParent() {
    assertDefined(previousOrParentTNode.parent, 'previousOrParentTNode should have a parent');
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
export var CLEAN_PROMISE = _CLEAN_PROMISE;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFLdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRixPQUFPLEVBQUMsZUFBZSxFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEgsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlDLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUM1RyxPQUFPLEVBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUM1RixPQUFPLEVBQUMsWUFBWSxFQUFjLGFBQWEsRUFBRSxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUl0RixPQUFPLEVBQWtCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFakYsT0FBTyxFQUFxRixvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQy9JLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFzQixnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUF5QixJQUFJLEVBQW1CLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFpQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBUSxNQUFNLG1CQUFt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LENBQUMscUJBQXFCLENBQUMsTUFBTSxFQUFFLDRDQUE0QyxDQUFDLENBQUM7QUFDNUYsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUMsS0FBYSxFQUFFLEdBQVc7SUFDbkQsSUFBSSxHQUFHLElBQUksSUFBSTtRQUFFLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDaEMseUJBQXlCLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxRQUFRLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBRUQsU0FBUyxjQUFjLENBQUMsS0FBYSxFQUFFLEdBQVc7SUFDaEQsSUFBSSxHQUFHLElBQUksSUFBSTtRQUFFLEdBQUcsR0FBRyxRQUFRLENBQUM7SUFDaEMsV0FBVyxDQUNQLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVMsS0FBSyxrREFBNkMsR0FBRyxDQUFDLE1BQU0sTUFBRyxDQUFDLENBQUM7QUFDbkcsQ0FBQztBQUVELE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRMRWxlbWVudEZyb21Db21wb25lbnQsIHJlYWRFbGVtZW50VmFsdWUsIHJlYWRQYXRjaGVkTFZpZXdEYXRhfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0Um9vdFZpZXd9IGZyb20gJy4vZGlzY292ZXJ5X3V0aWxzJztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUsIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIGV4ZWN1dGVJbml0SG9va3MsIHF1ZXVlSW5pdEhvb2tzLCBxdWV1ZUxpZmVjeWNsZUhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBSRU5ERVJfUEFSRU5ULCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZkludGVybmFsLCBDb21wb25lbnRRdWVyeSwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZkludGVybmFsLCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBJbml0aWFsU3R5bGluZ0ZsYWdzLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExDb250YWluZXJOb2RlLCBMRWxlbWVudENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExQcm9qZWN0aW9uTm9kZSwgTFRleHROb2RlLCBMVmlld05vZGUsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgQ09OVEVOVF9RVUVSSUVTLCBDT05URVhULCBDdXJyZW50TWF0Y2hlc0xpc3QsIERFQ0xBUkFUSU9OX1ZJRVcsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIE9wYXF1ZVZpZXdTdGF0ZSwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MsIFNBTklUSVpFUiwgVEFJTCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGUsIGNyZWF0ZVRleHROb2RlLCBmaW5kQ29tcG9uZW50VmlldywgZ2V0SG9zdEVsZW1lbnROb2RlLCBnZXRMVmlld0NoaWxkLCBnZXRSZW5kZXJQYXJlbnQsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0LCBhbGxvY1N0eWxpbmdDb250ZXh0LCBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlLCByZW5kZXJTdHlsaW5nIGFzIHJlbmRlckVsZW1lbnRTdHlsZXMsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbCwgZ2V0TE5vZGUsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNEaWZmZXJlbnQsIGxvYWRFbGVtZW50SW50ZXJuYWwsIGxvYWRJbnRlcm5hbCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIFRWaWV3LmRhdGEgbmVlZHMgdG8gZmlsbCB0aGUgc2FtZSBudW1iZXIgb2Ygc2xvdHMgYXMgdGhlIExWaWV3RGF0YSBoZWFkZXJcbiAqIHNvIHRoZSBpbmRpY2VzIG9mIG5vZGVzIGFyZSBjb25zaXN0ZW50IGJldHdlZW4gTFZpZXdEYXRhIGFuZCBUVmlldy5kYXRhLlxuICpcbiAqIEl0J3MgbXVjaCBmYXN0ZXIgdG8ga2VlcCBhIGJsdWVwcmludCBvZiB0aGUgcHJlLWZpbGxlZCBhcnJheSBhbmQgc2xpY2UgaXRcbiAqIHRoYW4gaXQgaXMgdG8gY3JlYXRlIGEgbmV3IGFycmF5IGFuZCBmaWxsIGl0IGVhY2ggdGltZSBhIFRWaWV3IGlzIGNyZWF0ZWQuXG4gKi9cbmNvbnN0IEhFQURFUl9GSUxMRVIgPSBuZXcgQXJyYXkoSEVBREVSX09GRlNFVCkuZmlsbChudWxsKTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlcjtcbn1cblxubGV0IHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVyRmFjdG9yeSgpOiBSZW5kZXJlckZhY3RvcnkzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXJGYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIHJldHVybiB2aWV3RGF0YSAmJiB2aWV3RGF0YVtTQU5JVElaRVJdO1xufVxuXG4vKipcbiAqIFN0b3JlIHRoZSBlbGVtZW50IGRlcHRoIGNvdW50LiBUaGlzIGlzIHVzZWQgdG8gaWRlbnRpZnkgdGhlIHJvb3QgZWxlbWVudHMgb2YgdGhlIHRlbXBsYXRlXG4gKiBzbyB0aGF0IHdlIGNhbiB0aGFuIGF0dGFjaCBgTFZpZXdEYXRhYCB0byBvbmx5IHRob3NlIGVsZW1lbnRzLlxuICovXG5sZXQgZWxlbWVudERlcHRoQ291bnQgITogbnVtYmVyO1xuXG4vKipcbiAqIFN0b3JlcyB3aGV0aGVyIGRpcmVjdGl2ZXMgc2hvdWxkIGJlIG1hdGNoZWQgdG8gZWxlbWVudHMuXG4gKlxuICogV2hlbiB0ZW1wbGF0ZSBjb250YWlucyBgbmdOb25CaW5kYWJsZWAgdGhhbiB3ZSBuZWVkIHRvIHByZXZlbnQgdGhlIHJ1bnRpbWUgZm9ybSBtYXRjaGluZ1xuICogZGlyZWN0aXZlcyBvbiBjaGlsZHJlbiBvZiB0aGF0IGVsZW1lbnQuXG4gKlxuICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8bXktY29tcCBteS1kaXJlY3RpdmU+XG4gKiAgICAgU2hvdWxkIG5vdCBtYXRjaCBjb21wb25lbnQgLyBkaXJlY3RpdmUgYmVjYXVzZSB3ZSBhcmUgaW4gbmdOb25CaW5kYWJsZS5cbiAqICAgPC9teS1jb21wPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqL1xubGV0IGJpbmRpbmdzRW5hYmxlZCAhOiBib29sZWFuO1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgcmVzdG9yZVZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFZpZXcoKTogT3BhcXVlVmlld1N0YXRlIHtcbiAgcmV0dXJuIHZpZXdEYXRhIGFzIGFueSBhcyBPcGFxdWVWaWV3U3RhdGU7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgYGNvbnRleHRWaWV3RGF0YWAgdG8gdGhlIGdpdmVuIE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIGdldEN1cnJlbnRWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gdmlld1RvUmVzdG9yZSBUaGUgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlIHRvIHJlc3RvcmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXN0b3JlVmlldyh2aWV3VG9SZXN0b3JlOiBPcGFxdWVWaWV3U3RhdGUpIHtcbiAgY29udGV4dFZpZXdEYXRhID0gdmlld1RvUmVzdG9yZSBhcyBhbnkgYXMgTFZpZXdEYXRhO1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkIGFuZCB0cmFjayBxdWVyeSByZXN1bHRzLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpOiBMTm9kZXxudWxsIHtcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9PT0gdmlld0RhdGFbSE9TVF9OT0RFXSA/XG4gICAgICBnZXRIb3N0RWxlbWVudE5vZGUodmlld0RhdGEpIDpcbiAgICAgIGdldExOb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdmlld0RhdGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk6IFROb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0RW52aXJvbm1lbnQodE5vZGU6IFROb2RlLCB2aWV3OiBMVmlld0RhdGEpIHtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIHZpZXdEYXRhID0gdmlldztcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpLmUuIHRoaXMgcHJldmlvdXNPclBhcmVudFROb2RlIHBvaW50cyB0byBhIG5vZGUgb24gd2hpY2ggd2VcbiAqIGNyZWF0ZSBjb250ZW50IHF1ZXJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhcbiAgICBRdWVyeVR5cGU6IHtuZXcgKHBhcmVudDogbnVsbCwgc2hhbGxvdzogbnVsbCwgZGVlcDogbnVsbCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29udGVudCBxdWVyeSBvbiBhIG5vZGUsIGFueSBleGlzdGluZyBMUXVlcmllcyBuZWVkcyB0byBiZSBjbG9uZWRcbiAgLy8gaW4gc3Vic2VxdWVudCB0ZW1wbGF0ZSBwYXNzZXMsIHRoZSBjbG9uaW5nIG9jY3VycyBiZWZvcmUgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24uXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtIT1NUX05PREVdICYmXG4gICAgICAhaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gIH1cblxuICByZXR1cm4gY3VycmVudFF1ZXJpZXMgfHwgKGN1cnJlbnRRdWVyaWVzID0gbmV3IFF1ZXJ5VHlwZShudWxsLCBudWxsLCBudWxsKSk7XG59XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqL1xubGV0IGNyZWF0aW9uTW9kZTogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENyZWF0aW9uTW9kZSgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IHZpZXdEYXRhOiBMVmlld0RhdGE7XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IExWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBUaGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiBzaG91bGQgYmUgdXNlZCBmb3IgYW55dGhpbmcgcHVibGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldFZpZXdEYXRhKCk6IExWaWV3RGF0YSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0Vmlld0RhdGE6IExWaWV3RGF0YSA9IG51bGwgITtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gW10pO1xufVxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbi8qKlxuICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCArIGFueSBob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAqL1xubGV0IGJpbmRpbmdSb290SW5kZXg6IG51bWJlciA9IC0xO1xuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIHJldHVybiBiaW5kaW5nUm9vdEluZGV4O1xufVxuXG5jb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcoXG4gICAgbmV3VmlldzogTFZpZXdEYXRhLCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRWaWV3Tm9kZSB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBvbGRWaWV3OiBMVmlld0RhdGEgPSB2aWV3RGF0YTtcbiAgZGlyZWN0aXZlcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tESVJFQ1RJVkVTXTtcbiAgdFZpZXcgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbVFZJRVddO1xuXG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgZmlyc3RUZW1wbGF0ZVBhc3MgPSBuZXdWaWV3ICYmIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICBiaW5kaW5nUm9vdEluZGV4ID0gbmV3VmlldyAmJiB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUkVOREVSRVJdO1xuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgdmlld0RhdGEgPSBjb250ZXh0Vmlld0RhdGEgPSBuZXdWaWV3O1xuICBvbGRWaWV3ICYmIChvbGRWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMpO1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tRVUVSSUVTXTtcblxuICByZXR1cm4gb2xkVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBjcmVhdGlvbk9ubHkgQW4gb3B0aW9uYWwgYm9vbGVhbiB0byBpbmRpY2F0ZSB0aGF0IHRoZSB2aWV3IHdhcyBwcm9jZXNzZWQgaW4gY3JlYXRpb24gbW9kZVxuICogb25seSwgaS5lLiB0aGUgZmlyc3QgdXBkYXRlIHdpbGwgYmUgZG9uZSBsYXRlci4gT25seSBwb3NzaWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgdmlld0RhdGFbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICB2aWV3RGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIHRoZSB2aWV3LCBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBzdGVwcyBpbiB0aGF0IG9yZGVyOlxuICogdHJpZ2dlcnMgaW5pdCBob29rcywgcmVmcmVzaGVzIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MsIHRyaWdnZXJzIGNvbnRlbnQgaG9va3MsIHNldHMgaG9zdFxuICogYmluZGluZ3MsIHJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzLlxuICogTm90ZTogdmlldyBob29rcyBhcmUgdHJpZ2dlcmVkIGxhdGVyIHdoZW4gbGVhdmluZyB0aGUgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpIHtcbiAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG5cbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3Modmlld0RhdGEpO1xuXG4gIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuXG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5ob3N0QmluZGluZ1N0YXJ0SW5kZXg7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5ob3N0VmFyczsgaSsrKSB7XG4gICAgICAgICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICAgICAgICB2aWV3RGF0YS5wdXNoKE5PX0NIQU5HRSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgIShkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICAgIGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdSb290SW5kZXggKyBkZWYuaG9zdFZhcnM7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVEZWZJZHhdO1xuXG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoICEoZGlyZWN0aXZlRGVmSWR4LCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGluc3RhbmNlID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXdEYXRhO1xuICBpbnN0YW5jZVtQQVJFTlRdID0gaW5zdGFuY2VbREVDTEFSQVRJT05fVklFV10gPSB2aWV3RGF0YTtcbiAgaW5zdGFuY2VbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLlJ1bkluaXQ7XG4gIGluc3RhbmNlW0NPTlRFWFRdID0gY29udGV4dDtcbiAgaW5zdGFuY2VbSU5KRUNUT1JdID0gdmlld0RhdGEgPyB2aWV3RGF0YVtJTkpFQ1RPUl0gOiBudWxsO1xuICBpbnN0YW5jZVtSRU5ERVJFUl0gPSByZW5kZXJlcjtcbiAgaW5zdGFuY2VbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBudWxsO1xuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbi8qKlxuICogQ3JlYXRpb24gb2YgTE5vZGUgb2JqZWN0IGlzIGV4dHJhY3RlZCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHdlIGFsd2F5cyBjcmVhdGUgTE5vZGUgb2JqZWN0XG4gKiB3aXRoIHRoZSBzYW1lIHNoYXBlXG4gKiAoc2FtZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGluIHRoZSBzYW1lIG9yZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBzdGF0ZTogYW55KTogTEVsZW1lbnROb2RlJlxuICAgIExUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgcmV0dXJuIHtuYXRpdmU6IG5hdGl2ZSBhcyBhbnksIGRhdGE6IHN0YXRlLCBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGx9O1xufVxuXG4vKipcbiAqIEEgY29tbW9uIHdheSBvZiBjcmVhdGluZyB0aGUgTE5vZGUgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZW0gaGF2ZSBzYW1lIHNoYXBlIHRvXG4gKiBrZWVwIHRoZSBleGVjdXRpb24gY29kZSBtb25vbW9ycGhpYyBhbmQgZmFzdC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBMTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBMTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIExOb2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGRhdGEgQW55IGRhdGEgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gdGhlIExOb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsVmlld0RhdGE/OiBMVmlld0RhdGEgfCBudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5WaWV3LCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBudWxsLFxuICAgIGxWaWV3RGF0YTogTFZpZXdEYXRhKTogVFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgbFByb2plY3Rpb246IG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgZGF0YTogbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBzdGF0ZT86IG51bGwgfCBMVmlld0RhdGEgfCBMQ29udGFpbmVyKTogVEVsZW1lbnROb2RlJlRWaWV3Tm9kZSZcbiAgICBUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlIHtcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG5cbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgdmlld0RhdGEgJiYgcGFyZW50ICE9PSB2aWV3RGF0YVtIT1NUX05PREVdO1xuICBjb25zdCB0UGFyZW50ID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG5cbiAgY29uc3QgaXNTdGF0ZSA9IHN0YXRlICE9IG51bGw7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsKTtcbiAgbGV0IHROb2RlOiBUTm9kZTtcblxuICBpZiAoaW5kZXggPT09IC0xIHx8IHR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gICAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gICAgdE5vZGUgPSAoc3RhdGUgPyAoc3RhdGUgYXMgTFZpZXdEYXRhKVtUVklFV10ubm9kZSA6IG51bGwpIHx8XG4gICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCB0UGFyZW50LCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuXG4gICAgLy8gVGhpcyBpcyBhbiBlbGVtZW50IG9yIGNvbnRhaW5lciBvciBwcm9qZWN0aW9uIG5vZGVcbiAgICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKFxuICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRJbmRleCwgdmlld0RhdGEubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHdpdGggbnVsbGApO1xuXG4gICAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSBub2RlO1xuXG4gICAgaWYgKHREYXRhW2FkanVzdGVkSW5kZXhdID09IG51bGwpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzLCB0UGFyZW50LCBudWxsKTtcbiAgICAgIGlmICghaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICAgIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUpXG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0Tm9kZSA9IHREYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuICAgIGlmICghdFZpZXcuZmlyc3RDaGlsZCAmJiB0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICAgIH1cblxuICAgIC8vIE5vdyBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlLlxuICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJiBwYXJlbnRJblNhbWVWaWV3IHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IFZpZXcuXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIGRvIG5vdCBzYXZlIGhvc3QgVE5vZGVzKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICBjb25zdCBsVmlld0RhdGEgPSBzdGF0ZSBhcyBMVmlld0RhdGE7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0sIG51bGwsICdsVmlld0RhdGFbSE9TVF9OT0RFXSBzaG91bGQgbm90IGhhdmUgYmVlbiBpbml0aWFsaXplZCcpO1xuICAgIGxWaWV3RGF0YVtIT1NUX05PREVdID0gdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlO1xuICAgIGlmIChsVmlld0RhdGFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICBsVmlld0RhdGFbVFZJRVddLm5vZGUgPSB0Tm9kZSBhcyBUVmlld05vZGUgfCBURWxlbWVudE5vZGU7XG4gICAgfVxuICB9XG5cbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBXaGVuIExOb2RlcyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCsrO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgIHZpZXcucHVzaChudWxsKTtcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IHRydWU7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgICByZW5kZXJlckZhY3RvcnkgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTtcbiAgICByZW5kZXJlciA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYSByb290IHZpZXcgc28gaXQncyBwb3NzaWJsZSB0byBsb29rIHVwIHRoZSBob3N0IGVsZW1lbnQgdGhyb3VnaCBpdHMgaW5kZXhcbiAgICB0VmlldyA9IGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB2aWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIHt9LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3QpO1xuXG4gICAgY29uc3QgY29tcG9uZW50VFZpZXcgPVxuICAgICAgICBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlRm4sIGNvbnN0cywgdmFycywgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsLCBudWxsKTtcbiAgICBjb25zdCBjb21wb25lbnRMVmlldyA9XG4gICAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgY29tcG9uZW50VFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcik7XG4gICAgY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLCBjb21wb25lbnRMVmlldyk7XG4gICAgaG9zdCA9IGxvYWRFbGVtZW50KDApO1xuICB9XG4gIGNvbnN0IGhvc3RWaWV3ID0gaG9zdC5kYXRhICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RWaWV3LCAnSG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3IGRlZmluZWQgaW4gaG9zdC5kYXRhLicpO1xuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZUZuKTtcblxuICByZXR1cm4gaG9zdDtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3RGF0YSwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3RGF0YSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcblxuICBjb25zdCBsVmlldyA9XG4gICAgICBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIHRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgY3JlYXRlTm9kZUF0SW5kZXgoLTEsIFROb2RlVHlwZS5WaWV3LCBudWxsLCBudWxsLCBudWxsLCBsVmlldyk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcubm9kZSAhLmluamVjdG9ySW5kZXggPSBpbmplY3RvckluZGV4O1xuICB9XG5cbiAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IF9wcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciByZW5kZXJpbmcgZW1iZWRkZWQgdmlld3MgKGUuZy4gZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cylcbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG11c3Qgc3RvcmUvcmV0cmlldmUgdGhlaXIgVFZpZXdzIGRpZmZlcmVudGx5IGZyb20gY29tcG9uZW50IHZpZXdzXG4gKiBiZWNhdXNlIHRoZWlyIHRlbXBsYXRlIGZ1bmN0aW9ucyBhcmUgbmVzdGVkIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgb2YgdGhlaXIgaG9zdHMsIGNyZWF0aW5nXG4gKiBjbG9zdXJlcy4gSWYgdGhlaXIgaG9zdCB0ZW1wbGF0ZSBoYXBwZW5zIHRvIGJlIGFuIGVtYmVkZGVkIHRlbXBsYXRlIGluIGEgbG9vcCAoZS5nLiBuZ0ZvciBpbnNpZGVcbiAqIGFuIG5nRm9yKSwgdGhlIG5lc3Rpbmcgd291bGQgbWVhbiB3ZSdkIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgc28gd2VcbiAqIGNhbid0IHN0b3JlIFRWaWV3cyBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gaXRzZWxmIChhcyB3ZSBkbyBmb3IgY29tcHMpLiBJbnN0ZWFkLCB3ZSBzdG9yZSB0aGVcbiAqIFRWaWV3IGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG9uIHRoZWlyIGhvc3QgVE5vZGUsIHdoaWNoIG9ubHkgaGFzIG9uZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckVtYmVkZGVkVGVtcGxhdGU8VD4oXG4gICAgdmlld1RvUmVuZGVyOiBMVmlld0RhdGEsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgcmY6IFJlbmRlckZsYWdzKSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBsZXQgb2xkVmlldzogTFZpZXdEYXRhO1xuICBpZiAodmlld1RvUmVuZGVyW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSB7XG4gICAgLy8gVGhpcyBpcyBhIHJvb3QgdmlldyBpbnNpZGUgdGhlIHZpZXcgdHJlZVxuICAgIHRpY2tSb290Q29udGV4dCh2aWV3VG9SZW5kZXJbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBudWxsICE7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbSE9TVF9OT0RFXSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKHJmLCBjb250ZXh0KTtcbiAgICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB2aWV3VG9SZW5kZXJbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgLy8gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIGlzIGNhbGxlZCB0d2ljZSBpbiBmYWN0LCBvbmNlIGZvciBjcmVhdGlvbiBvbmx5IGFuZCB0aGVuIG9uY2UgZm9yXG4gICAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgICAgY29uc3QgaXNDcmVhdGlvbk9ubHkgPSAocmYgJiBSZW5kZXJGbGFncy5DcmVhdGUpID09PSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBpc0NyZWF0aW9uT25seSk7XG4gICAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IF9wcmV2aW91c09yUGFyZW50VE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY29udGV4dCBhdCB0aGUgbGV2ZWwgc3BlY2lmaWVkIGFuZCBzYXZlcyBpdCBhcyB0aGUgZ2xvYmFsLCBjb250ZXh0Vmlld0RhdGEuXG4gKiBXaWxsIGdldCB0aGUgbmV4dCBsZXZlbCB1cCBpZiBsZXZlbCBpcyBub3Qgc3BlY2lmaWVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBzYXZlIGNvbnRleHRzIG9mIHBhcmVudCB2aWV3cyBzbyB0aGV5IGNhbiBiZSBib3VuZCBpbiBlbWJlZGRlZCB2aWV3cywgb3JcbiAqIGluIGNvbmp1bmN0aW9uIHdpdGggcmVmZXJlbmNlKCkgdG8gYmluZCBhIHJlZiBmcm9tIGEgcGFyZW50IHZpZXcuXG4gKlxuICogQHBhcmFtIGxldmVsIFRoZSByZWxhdGl2ZSBsZXZlbCBvZiB0aGUgdmlldyBmcm9tIHdoaWNoIHRvIGdyYWIgY29udGV4dCBjb21wYXJlZCB0byBjb250ZXh0VmV3RGF0YVxuICogQHJldHVybnMgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHQ8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgY29udGV4dFZpZXdEYXRhID0gd2Fsa1VwVmlld3MobGV2ZWwsIGNvbnRleHRWaWV3RGF0YSAhKTtcbiAgcmV0dXJuIGNvbnRleHRWaWV3RGF0YVtDT05URVhUXSBhcyBUO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBob3N0VmlldzogTFZpZXdEYXRhLCBjb21wb25lbnRPckNvbnRleHQ6IFQsIHRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tIT1NUX05PREVdKTtcbiAgdHJ5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG4gICAgaWYgKHRlbXBsYXRlRm4pIHtcbiAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgIHRlbXBsYXRlRm4oZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnRPckNvbnRleHQgISk7XG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzKCk7XG5cbiAgICAgIC8vIEVsZW1lbnQgd2FzIHN0b3JlZCBhdCAwIGluIGRhdGEgYW5kIGRpcmVjdGl2ZSB3YXMgc3RvcmVkIGF0IDAgaW4gZGlyZWN0aXZlc1xuICAgICAgLy8gaW4gcmVuZGVyQ29tcG9uZW50KClcbiAgICAgIHNldEhvc3RCaW5kaW5ncyh0Vmlldy5ob3N0QmluZGluZ3MpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaChIRUFERVJfT0ZGU0VUKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IG5hdGl2ZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ25nLWNvbnRhaW5lcicgOiAnJyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4IC0gMSk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlLCBudWxsLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCB2aWV3RGF0YSk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobG9jYWxSZWZzKTtcbn1cblxuLyoqIE1hcmsgdGhlIGVuZCBvZiB0aGUgPG5nLWNvbnRhaW5lcj4uICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENvbnRhaW5lckVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBjdXJyZW50UXVlcmllcyAmJlxuICAgICAgKGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnRDb250YWluZXJOb2RlKSk7XG5cbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MsIHRWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgRE9NIGVsZW1lbnQuIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50RW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlld0RhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQXR0cmlidXRlcyBhbmQgbG9jYWxSZWZzIGFyZSBwYXNzZWQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVyZSBlbGVtZW50cyB3aXRoIGFuIGV2ZW4gaW5kZXhcbiAqIGhvbGQgYW4gYXR0cmlidXRlIG5hbWUgYW5kIGVsZW1lbnRzIHdpdGggYW4gb2RkIGluZGV4IGhvbGQgYW4gYXR0cmlidXRlIHZhbHVlLCBleC46XG4gKiBbJ2lkJywgJ3dhcm5pbmc1JywgJ2NsYXNzJywgJ2FsZXJ0J11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncyAnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuXG4gIGNvbnN0IG5hdGl2ZSA9IGVsZW1lbnRDcmVhdGUobmFtZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4IC0gMSk7XG5cbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG4gIH1cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgdmlld0RhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZWxlbWVudERlcHRoQ291bnQgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCB2aWV3RGF0YSk7XG4gIH1cbiAgZWxlbWVudERlcHRoQ291bnQrKztcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmF0aXZlIGVsZW1lbnQgZnJvbSBhIHRhZyBuYW1lLCB1c2luZyBhIHJlbmRlcmVyLlxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gb3ZlcnJpZGRlblJlbmRlcmVyIE9wdGlvbmFsIEEgcmVuZGVyZXIgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb25lXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKG5hbWU6IHN0cmluZywgb3ZlcnJpZGRlblJlbmRlcmVyPzogUmVuZGVyZXIzKTogUkVsZW1lbnQge1xuICBsZXQgbmF0aXZlOiBSRWxlbWVudDtcbiAgY29uc3QgcmVuZGVyZXJUb1VzZSA9IG92ZXJyaWRkZW5SZW5kZXJlciB8fCByZW5kZXJlcjtcblxuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXJUb1VzZSkpIHtcbiAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSwgX2N1cnJlbnROYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIGlmIChfY3VycmVudE5hbWVzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnROUyhfY3VycmVudE5hbWVzcGFjZSwgbmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmU7XG59XG5cbmZ1bmN0aW9uIG5hdGl2ZU5vZGVMb2NhbFJlZkV4dHJhY3Rvcih0Tm9kZTogVE5vZGUsIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEpOiBSTm9kZSB7XG4gIHJldHVybiBnZXRMTm9kZSh0Tm9kZSwgY3VycmVudFZpZXcpLm5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsTm9kZSBMTm9kZSBmb3Igd2hpY2ggZGlyZWN0aXZlIGFuZCBsb2NhbHMgc2hvdWxkIGJlIGNyZWF0ZWRcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBMTm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IG5hdGl2ZU5vZGVMb2NhbFJlZkV4dHJhY3Rvcikge1xuICBpZiAoIWJpbmRpbmdzRW5hYmxlZCkgcmV0dXJuO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdFZpZXcsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpO1xuICB9XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCB2YWx1ZUluZGV4ID0gaSArIDE7XG4gICAgICByZXNvbHZlRGlyZWN0aXZlKGRlZiwgdmFsdWVJbmRleCwgbWF0Y2hlcywgdFZpZXcpO1xuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcChtYXRjaGVzW3ZhbHVlSW5kZXhdIGFzIG51bWJlciwgZGVmLCBleHBvcnRzTWFwKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuICovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZTogVE5vZGUpOiBDdXJyZW50TWF0Y2hlc0xpc3R8bnVsbCB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV07XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISkpIHtcbiAgICAgICAgbWF0Y2hlcyB8fCAobWF0Y2hlcyA9IFtdKTtcbiAgICAgICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIGFkZENvbXBvbmVudExvZ2ljKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYsIG51bGwpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYsIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyBhcyBDdXJyZW50TWF0Y2hlc0xpc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiwgdmFsdWVJbmRleDogbnVtYmVyLCBtYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3QsXG4gICAgdFZpZXc6IFRWaWV3KTogYW55IHtcbiAgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IG51bGwpIHtcbiAgICBtYXRjaGVzW3ZhbHVlSW5kZXhdID0gQ0lSQ1VMQVI7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSgpO1xuICAgICh0Vmlldy5kaXJlY3RpdmVzIHx8ICh0Vmlldy5kaXJlY3RpdmVzID0gW10pKS5wdXNoKGRlZik7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUNyZWF0ZShtYXRjaGVzW3ZhbHVlSW5kZXhdID0gdFZpZXcuZGlyZWN0aXZlcyAhLmxlbmd0aCAtIDEsIGluc3RhbmNlLCBkZWYpO1xuICB9IGVsc2UgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IENJUkNVTEFSKSB7XG4gICAgLy8gSWYgd2UgcmV2aXNpdCB0aGlzIGRpcmVjdGl2ZSBiZWZvcmUgaXQncyByZXNvbHZlZCwgd2Uga25vdyBpdCdzIGNpcmN1bGFyXG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmLnR5cGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjaygpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIsIGhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gTXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMgYXJlIGdlbmVyYXRlZCB3aXRoXG4gIC8vIGluc3RydWN0aW9ucyB0aGF0IGV4cGVjdCBlbGVtZW50IGluZGljZXMgdGhhdCBhcmUgTk9UIGFkanVzdGVkIChlLmcuIGVsZW1lbnRQcm9wZXJ0eSkuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKHRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAodFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaW5zdGFudGlhdGVzIHRoZSBnaXZlbiBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZpcnN0VGVtcGxhdGVQYXNzLCBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICBgRGlyZWN0aXZlcyBzaG91bGQgb25seSBiZSBpbnN0YW50aWF0ZWQgZGlyZWN0bHkgYWZ0ZXIgZmlyc3QgdGVtcGxhdGUgcGFzc2ApO1xuICBjb25zdCBjb3VudCA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QocHJldmlvdXNPclBhcmVudFROb2RlKSAmJiBjdXJyZW50UXVlcmllcykge1xuICAgIGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuY2xvbmUoKTtcbiAgfVxuXG4gIGlmIChjb3VudCA+IDApIHtcbiAgICBjb25zdCBzdGFydCA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiA9IHREaXJlY3RpdmVzW2ldO1xuXG4gICAgICAvLyBDb21wb25lbnQgdmlldyBtdXN0IGJlIHNldCBvbiBub2RlIGJlZm9yZSB0aGUgZmFjdG9yeSBpcyBjcmVhdGVkIHNvXG4gICAgICAvLyBDaGFuZ2VEZXRlY3RvclJlZnMgaGF2ZSBhIHdheSB0byBzdG9yZSBjb21wb25lbnQgdmlldyBvbiBjcmVhdGlvbi5cbiAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSB7XG4gICAgICAgIGFkZENvbXBvbmVudExvZ2ljKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KTtcbiAgICAgIH1cbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSBleHBvcnRzTWFwW2RlZi5leHBvcnRBc10gPSBpbmRleDtcbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3RGF0YSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50VE5vZGUubG9jYWxOYW1lcztcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/IGxvY2FsUmVmRXh0cmFjdG9yKHROb2RlLCB2aWV3RGF0YSkgOiBkaXJlY3RpdmVzICFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9XG4gICAgICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PGFueT58IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVddID0ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IEhFQURFUl9GSUxMRVIuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld0RhdGFcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgICAgICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgaG9zdEJpbmRpbmdTdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsLFxuICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3RGF0YSB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5ldyBBcnJheShpbml0aWFsVmlld0xlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKG51bGwsIDAsIGJpbmRpbmdTdGFydEluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwoTk9fQ0hBTkdFLCBiaW5kaW5nU3RhcnRJbmRleCkgYXMgTFZpZXdEYXRhO1xuICBibHVlcHJpbnRbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICBibHVlcHJpbnRbQklORElOR19JTkRFWF0gPSBiaW5kaW5nU3RhcnRJbmRleDtcbiAgcmV0dXJuIGJsdWVwcmludDtcbn1cblxuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBUQXR0cmlidXRlcyk6IHZvaWQge1xuICBjb25zdCBpc1Byb2MgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGxldCBpID0gMDtcblxuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgaSArPSAyO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgLy8gTmFtZXNwYWNlZCBhdHRyaWJ1dGVzXG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZVVSSSA9IGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaSArIDJdIGFzIHN0cmluZztcbiAgICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2kgKyAzXSBhcyBzdHJpbmc7XG4gICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwsIG5hbWVzcGFjZVVSSSkgOlxuICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZVVSSSwgYXR0ck5hbWUsIGF0dHJWYWwpO1xuICAgICAgICBpICs9IDQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTdGFuZGFyZCBhdHRyaWJ1dGVzXG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgMV07XG4gICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZykgOlxuICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgICAgaSArPSAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5cbi8qKlxuICogTG9jYXRlcyB0aGUgaG9zdCBuYXRpdmUgZWxlbWVudCwgdXNlZCBmb3IgYm9vdHN0cmFwcGluZyBleGlzdGluZyBub2RlcyBpbnRvIHJlbmRlcmluZyBwaXBlbGluZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIGZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZyk6IFJFbGVtZW50fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoLTEpO1xuICByZW5kZXJlckZhY3RvcnkgPSBmYWN0b3J5O1xuICBjb25zdCBkZWZhdWx0UmVuZGVyZXIgPSBmYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICBjb25zdCByTm9kZSA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKGRlZmF1bHRSZW5kZXJlcikgP1xuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IpIDpcbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpKSA6XG4gICAgICBlbGVtZW50T3JTZWxlY3RvcjtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhck5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gck5vZGU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgaG9zdCBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gck5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKlxuICogQHJldHVybnMgTEVsZW1lbnROb2RlIGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvc3RFbGVtZW50KFxuICAgIHRhZzogc3RyaW5nLCByTm9kZTogUkVsZW1lbnQgfCBudWxsLCBkZWY6IENvbXBvbmVudERlZkludGVybmFsPGFueT4sXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChcbiAgICAgIDAsIFROb2RlVHlwZS5FbGVtZW50LCByTm9kZSwgbnVsbCwgbnVsbCxcbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICByZW5kZXJlcixcbiAgICAgICAgICBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICBkZWYudGVtcGxhdGUsIGRlZi5jb25zdHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5KSxcbiAgICAgICAgICBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcikpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICB0Vmlldy5kaXJlY3RpdmVzID0gW2RlZl07XG4gIH1cbiAgcmV0dXJuIHZpZXdEYXRhW0hFQURFUl9PRkZTRVRdO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBub2RlID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAgIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAgIC8vIGV2ZW50cyAoaW5jbHVkaW5nIG91dHB1dHMpLlxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3Rlbihub2RlLm5hdGl2ZSwgZXZlbnROYW1lLCBsaXN0ZW5lckZuKTtcbiAgICAgIHN0b3JlQ2xlYW51cEZuKHZpZXdEYXRhLCBjbGVhbnVwRm4pO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoUHJldmVudERlZmF1bHQobGlzdGVuZXJGbik7XG4gICAgICBub2RlLm5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGNvbnN0IGNsZWFudXBJbnN0YW5jZXMgPSBnZXRDbGVhbnVwKHZpZXdEYXRhKTtcbiAgICAgIGNsZWFudXBJbnN0YW5jZXMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgICAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3RGF0YSkucHVzaChcbiAgICAgICAgICAgIGV2ZW50TmFtZSwgdE5vZGUuaW5kZXgsIGNsZWFudXBJbnN0YW5jZXMgIS5sZW5ndGggLSAxLCB1c2VDYXB0dXJlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLmZsYWdzLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IG91dHB1dERhdGE6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChvdXRwdXRzICYmIChvdXRwdXREYXRhID0gb3V0cHV0c1tldmVudE5hbWVdKSkge1xuICAgIGNyZWF0ZU91dHB1dChvdXRwdXREYXRhLCBsaXN0ZW5lckZuKTtcbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBldmVudCBuYW1lIGFuZCBzdWJzY3JpYmVzIHRvXG4gKiBlYWNoIG91dHB1dC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlT3V0cHV0KG91dHB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgbGlzdGVuZXI6IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShvdXRwdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBkaXJlY3RpdmVzICFbb3V0cHV0c1tpXSBhcyBudW1iZXJdW291dHB1dHNbaSArIDFdXS5zdWJzY3JpYmUobGlzdGVuZXIpO1xuICAgIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KHZpZXdEYXRhLCBzdWJzY3JpcHRpb24sIHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KFxuICAgIHZpZXc6IExWaWV3RGF0YSB8IG51bGwsIGNvbnRleHQ6IGFueSwgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBpZiAoIXZpZXcpIHZpZXcgPSB2aWV3RGF0YTtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNvbnRleHQpO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbiwgdmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHZpZXc6IExWaWV3RGF0YSwgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuKTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaCh2aWV3W0NMRUFOVVBdICEubGVuZ3RoIC0gMSwgbnVsbCk7XG4gIH1cbn1cblxuLyoqIE1hcmsgdGhlIGVuZCBvZiB0aGUgZWxlbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50RW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjdXJyZW50UXVlcmllcyAmJlxuICAgICAgKGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlKSk7XG5cbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MsIHRWaWV3KTtcbiAgZWxlbWVudERlcHRoQ291bnQtLTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBudW1iZXIgaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgVGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkIHdoZW4gdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICogICAgICAgICAgICAgICAgICBPdGhlcndpc2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZ2lmaWVkIHZhbHVlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGVsZW1lbnQgPSBsb2FkRWxlbWVudChpbmRleCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBjb25zdCBzdHJWYWx1ZSA9IHNhbml0aXplciA9PSBudWxsID8gc3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSk7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybjtcbiAgY29uc3Qgbm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBMRWxlbWVudE5vZGU7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgpO1xuICAvLyBpZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cblxuICBjb25zdCBpbnB1dERhdGEgPSB0Tm9kZSAmJiB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmIChpbnB1dERhdGEgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgbWFya0RpcnR5SWZPblB1c2gobm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlIHByb3BlcnR5XG4gICAgLy8gaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgY29uc3QgbmF0aXZlID0gbm9kZS5uYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0UHJvcGVydHkobmF0aXZlLCBwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmF0aXZlLnNldFByb3BlcnR5ID8gbmF0aXZlLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAobmF0aXZlIGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogRW5hYmxlcyBkaXJlY3RpdmUgbWF0Y2hpbmcgb24gZWxlbWVudHMuXG4gKlxuICogICogRXhhbXBsZTpcbiAqIGBgYFxuICogPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICBTaG91bGQgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlLlxuICogPC9teS1jb21wPlxuICogPGRpdiBuZ05vbkJpbmRhYmxlPlxuICogICA8IS0tIGRpc2FibGVkQmluZGluZ3MoKSAtLT5cbiAqICAgPG15LWNvbXAgbXktZGlyZWN0aXZlPlxuICogICAgIFNob3VsZCBub3QgbWF0Y2ggY29tcG9uZW50IC8gZGlyZWN0aXZlIGJlY2F1c2Ugd2UgYXJlIGluIG5nTm9uQmluZGFibGUuXG4gKiAgIDwvbXktY29tcD5cbiAqICAgPCEtLSBlbmFibGVCaW5kaW5ncygpIC0tPlxuICogPC9kaXY+XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVuYWJsZUJpbmRpbmdzKCk6IHZvaWQge1xuICBiaW5kaW5nc0VuYWJsZWQgPSB0cnVlO1xufVxuXG4vKipcbiAqIERpc2FibGVzIGRpcmVjdGl2ZSBtYXRjaGluZyBvbiBlbGVtZW50LlxuICpcbiAqICAqIEV4YW1wbGU6XG4gKiBgYGBcbiAqIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgU2hvdWxkIG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZS5cbiAqIDwvbXktY29tcD5cbiAqIDxkaXYgbmdOb25CaW5kYWJsZT5cbiAqICAgPCEtLSBkaXNhYmxlZEJpbmRpbmdzKCkgLS0+XG4gKiAgIDxteS1jb21wIG15LWRpcmVjdGl2ZT5cbiAqICAgICBTaG91bGQgbm90IG1hdGNoIGNvbXBvbmVudCAvIGRpcmVjdGl2ZSBiZWNhdXNlIHdlIGFyZSBpbiBuZ05vbkJpbmRhYmxlLlxuICogICA8L215LWNvbXA+XG4gKiAgIDwhLS0gZW5hYmxlQmluZGluZ3MoKSAtLT5cbiAqIDwvZGl2PlxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXNhYmxlQmluZGluZ3MoKTogdm9pZCB7XG4gIGJpbmRpbmdzRW5hYmxlZCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGluamVjdG9ySW5kZXg6IHBhcmVudCA/IHBhcmVudC5pbmplY3RvckluZGV4IDogLTEsXG4gICAgZmxhZ3M6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogdFZpZXdzLFxuICAgIG5leHQ6IG51bGwsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgcGFyZW50OiBwYXJlbnQsXG4gICAgZHluYW1pY0NvbnRhaW5lck5vZGU6IG51bGwsXG4gICAgZGV0YWNoZWQ6IG51bGwsXG4gICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgIHByb2plY3Rpb246IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGljZXMgYW5kIG1pbmlmaWVkIGlucHV0IG5hbWVzLCBzZXRzIHRoZVxuICogaW5wdXQgcHJvcGVydGllcyBvbiB0aGUgY29ycmVzcG9uZGluZyBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbnB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGRpcmVjdGl2ZXMgIVtpbnB1dHNbaV0gYXMgbnVtYmVyXVtpbnB1dHNbaSArIDFdXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGxOb2RlRmxhZ3MgbG9naWNhbCBub2RlIGZsYWdzXG4gKiBAcGFyYW0gRGlyZWN0aW9uIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIHROb2RlRmxhZ3M6IFROb2RlRmxhZ3MsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgY291bnQgPSB0Tm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQWRkIG9yIHJlbW92ZSBhIGNsYXNzIGluIGEgYGNsYXNzTGlzdGAgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgW2NsYXNzLmZvb109XCJleHBcIiBjYXNlXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBjbGFzc05hbWUgTmFtZSBvZiBjbGFzcyB0byB0b2dnbGUuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gY2xhc3Mgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgc3R5bGluZ0luZGV4LCB2YWx1ZSA/IHRydWUgOiBmYWxzZSk7XG59XG5cbi8qKlxuICogQXNzaWduIGFueSBpbmxpbmUgc3R5bGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIGFwcGx5IGFsbCBzdHlsaW5nXG4gKiAoZS5nLiBgc3R5bGU9XCIuLi5cImApIHZhbHVlcyB0byB0aGUgZWxlbWVudC4gVGhpcyBpcyBhbHNvIHdoZXJlIHRoZSBwcm92aWRlZCBpbmRleFxuICogdmFsdWUgaXMgYWxsb2NhdGVkIGZvciB0aGUgc3R5bGluZyBkZXRhaWxzIGZvciBpdHMgY29ycmVzcG9uZGluZyBlbGVtZW50ICh0aGUgZWxlbWVudFxuICogaW5kZXggaXMgdGhlIHByZXZpb3VzIGluZGV4IHZhbHVlIGZyb20gdGhpcyBvbmUpLlxuICpcbiAqIChOb3RlIHRoaXMgZnVuY3Rpb24gY2FsbHMgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGltbWVkaWF0ZWx5IHdoZW4gY2FsbGVkLilcbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IHZhbHVlIHdoaWNoIHdpbGwgYmUgYWxsb2NhdGVkIHRvIHN0b3JlIHN0eWxpbmcgZGF0YSBmb3IgdGhlIGVsZW1lbnQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIHJlZ2lzdGVyZWQgb24gdGhlIGVsZW1lbnQuXG4gKiAgIEVhY2ggaW5kaXZpZHVhbCBzdHlsZSB3aWxsIGJlIHVzZWQgb24gdGhlIGVsZW1lbnQgYXMgbG9uZyBhcyBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICogICBieSBhbnkgY2xhc3NlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbY2xhc3NdYCkgb3Igc2luZ3VsYXIgKGBbY2xhc3MubmFtZWRdYClcbiAqICAgYmluZGluZ3MuIElmIGEgY2xhc3MgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBhIGZhbHN5IHZhbHVlIHRoZW4gdGhlIG1hdGNoaW5nIGluaXRpYWxcbiAqICAgY2xhc3MgdmFsdWUgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZURlY2xhcmF0aW9ucyBBIGtleS92YWx1ZSBhcnJheSBvZiBDU1Mgc3R5bGVzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IHN0eWxlcyBwbGFjZWQgb24gdGhlIGVsZW1lbnQgYnkgbXVsdGlwbGUgKGBbc3R5bGVdYCkgb3Igc2luZ3VsYXIgKGBbc3R5bGUucHJvcF1gKVxuICogICBiaW5kaW5ncy4gSWYgYSBzdHlsZSBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIG51bGwgdGhlbiB0aGUgaW5pdGlhbCBzdHlsaW5nXG4gKiAgIHZhbHVlcyB0aGF0IGFyZSBwYXNzZWQgaW4gaGVyZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGlmIG1hdGNoZWQpLlxuICogQHBhcmFtIHN0eWxlU2FuaXRpemVyIEFuIG9wdGlvbmFsIHNhbml0aXplciBmdW5jdGlvbiB0aGF0IHdpbGwgYmUgdXNlZCAoaWYgcHJvdmlkZWQpXG4gKiAgIHRvIHNhbml0aXplIHRoZSBhbnkgQ1NTIHByb3BlcnR5IHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nPFQ+KFxuICAgIGNsYXNzRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IGJvb2xlYW4gfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCxcbiAgICBzdHlsZURlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIC8vIGluaXRpYWxpemUgdGhlIHN0eWxpbmcgdGVtcGxhdGUuXG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID1cbiAgICAgICAgY3JlYXRlU3R5bGluZ0NvbnRleHRUZW1wbGF0ZShjbGFzc0RlY2xhcmF0aW9ucywgc3R5bGVEZWNsYXJhdGlvbnMsIHN0eWxlU2FuaXRpemVyKTtcbiAgfVxuICBpZiAoc3R5bGVEZWNsYXJhdGlvbnMgJiYgc3R5bGVEZWNsYXJhdGlvbnMubGVuZ3RoIHx8XG4gICAgICBjbGFzc0RlY2xhcmF0aW9ucyAmJiBjbGFzc0RlY2xhcmF0aW9ucy5sZW5ndGgpIHtcbiAgICBlbGVtZW50U3R5bGluZ0FwcGx5KHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgYFN0eWxpbmdDb250ZXh0YCBhdCBhIGdpdmVuIGluZGV4LlxuICpcbiAqIFRoaXMgbWV0aG9kIGxhemlseSBjcmVhdGVzIHRoZSBgU3R5bGluZ0NvbnRleHRgLiBUaGlzIGlzIGJlY2F1c2UgaW4gbW9zdCBjYXNlc1xuICogd2UgaGF2ZSBzdHlsaW5nIHdpdGhvdXQgYW55IGJpbmRpbmdzLiBDcmVhdGluZyBgU3R5bGluZ0NvbnRleHRgIGVhZ2VybHkgd291bGQgbWVhbiB0aGF0XG4gKiBldmVyeSBzdHlsZSBkZWNsYXJhdGlvbiBzdWNoIGFzIGA8ZGl2IHN0eWxlPVwiY29sb3I6IHJlZFwiPmAgd291bGQgcmVzdWx0IGBTdHlsZUNvbnRleHRgXG4gKiB3aGljaCB3b3VsZCBjcmVhdGUgdW5uZWNlc3NhcnkgbWVtb3J5IHByZXNzdXJlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgc3R5bGUgYWxsb2NhdGlvbi4gU2VlOiBgZWxlbWVudFN0eWxpbmdgLlxuICovXG5mdW5jdGlvbiBnZXRTdHlsaW5nQ29udGV4dChpbmRleDogbnVtYmVyKTogU3R5bGluZ0NvbnRleHQge1xuICBsZXQgc3R5bGluZ0NvbnRleHQgPSBsb2FkPFN0eWxpbmdDb250ZXh0PihpbmRleCk7XG4gIGlmICghQXJyYXkuaXNBcnJheShzdHlsaW5nQ29udGV4dCkpIHtcbiAgICBjb25zdCBsRWxlbWVudCA9IHN0eWxpbmdDb250ZXh0IGFzIGFueSBhcyBMRWxlbWVudE5vZGU7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCk7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydERlZmluZWQodE5vZGUuc3R5bGluZ1RlbXBsYXRlLCAnZ2V0U3R5bGluZ0NvbnRleHQoKSBjYWxsZWQgYmVmb3JlIGVsZW1lbnRTdHlsaW5nKCknKTtcbiAgICBzdHlsaW5nQ29udGV4dCA9IHZpZXdEYXRhW2luZGV4ICsgSEVBREVSX09GRlNFVF0gPVxuICAgICAgICBhbGxvY1N0eWxpbmdDb250ZXh0KGxFbGVtZW50LCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISk7XG4gIH1cbiAgcmV0dXJuIHN0eWxpbmdDb250ZXh0O1xufVxuXG4vKipcbiAqIEFwcGx5IGFsbCBzdHlsaW5nIHZhbHVlcyB0byB0aGUgZWxlbWVudCB3aGljaCBoYXZlIGJlZW4gcXVldWVkIGJ5IGFueSBzdHlsaW5nIGluc3RydWN0aW9ucy5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBvbmNlIG9uZSBvciBtb3JlIGBlbGVtZW50U3R5bGVgIGFuZC9vciBgZWxlbWVudFN0eWxlUHJvcGBcbiAqIGhhdmUgYmVlbiBpc3N1ZWQgYWdhaW5zdCB0aGUgZWxlbWVudC4gVGhpcyBmdW5jdGlvbiB3aWxsIGFsc28gZGV0ZXJtaW5lIGlmIGFueSBzdHlsZXMgaGF2ZVxuICogY2hhbmdlZCBhbmQgd2lsbCB0aGVuIHNraXAgdGhlIG9wZXJhdGlvbiBpZiB0aGVyZSBpcyBub3RoaW5nIG5ldyB0byByZW5kZXIuXG4gKlxuICogT25jZSBjYWxsZWQgdGhlbiBhbGwgcXVldWVkIHN0eWxlcyB3aWxsIGJlIGZsdXNoZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRoYXQgd2lsbCBiZSByZW5kZXJlZC5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nQXBwbHk8VD4oaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICByZW5kZXJFbGVtZW50U3R5bGVzKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgcmVuZGVyZXIpO1xufVxuXG4vKipcbiAqIFF1ZXVlIGEgZ2l2ZW4gc3R5bGUgdG8gYmUgcmVuZGVyZWQgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgYG51bGxgIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGVgIG9yIGFueSBzdHlsZXMgdGhhdCBhcmUgcHJlc2VudFxuICogZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkICh3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIHByb3BlcnR5IG9uIHRoaXMgZWxlbWVudC4gKE1vbm90b25pY2FsbHkgaW5jcmVhc2luZy4pXG4gKiBAcGFyYW0gc3R5bGVOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKG51bGwgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBudWxsLCBzdWZmaXg/OiBzdHJpbmcpOiB2b2lkIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkKTtcbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGtleS92YWx1ZSBtYXAgb2Ygc3R5bGVzIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHVzYWdlLiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0b1xuICogdGhlIEVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgcGxhY2VkIHdpdGggcmVzcGVjdCB0byBhbnkgc3R5bGVzIHNldCB3aXRoIGBlbGVtZW50U3R5bGVQcm9wYC5cbiAqIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBgbnVsbGAgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50ICh1bmxlc3MgdGhlIHNhbWVcbiAqIHN0eWxlIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiB1c2luZyBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ01hcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBudWxsKTogdm9pZCB7XG4gIHVwZGF0ZVN0eWxpbmdNYXAoZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgpLCBjbGFzc2VzLCBzdHlsZXMpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBUZXh0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBzdGF0aWMgdGV4dCBub2RlXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIFRoaXMgdmFsdWUgd2lsbCBiZSBzdHJpbmdpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU/OiBhbnkpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0TmF0aXZlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIHJlbmRlcmVyKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHROYXRpdmUsIG51bGwsIG51bGwpO1xuXG4gIC8vIFRleHQgbm9kZXMgYXJlIHNlbGYgY2xvc2luZy5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgY29uc3QgZXhpc3RpbmdOb2RlID0gbG9hZEVsZW1lbnQoaW5kZXgpIGFzIGFueSBhcyBMVGV4dE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZXhpc3RpbmdOb2RlLCAnTE5vZGUgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nTm9kZS5uYXRpdmUudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RpdmUgYW5kIHRoZWlyIGFzc29jaWF0ZWQgY29udGVudCBxdWVyaWVzLlxuICpcbiAqIE5PVEU6IGRpcmVjdGl2ZXMgY2FuIGJlIGNyZWF0ZWQgaW4gb3JkZXIgb3RoZXIgdGhhbiB0aGUgaW5kZXggb3JkZXIuIFRoZXkgY2FuIGFsc29cbiAqICAgICAgIGJlIHJldHJpZXZlZCBiZWZvcmUgdGhleSBhcmUgY3JlYXRlZCBpbiB3aGljaCBjYXNlIHRoZSB2YWx1ZSB3aWxsIGJlIG51bGwuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBUaGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICogQHBhcmFtIGRpcmVjdGl2ZURlZiBEaXJlY3RpdmVEZWYgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUNyZWF0ZTxUPihcbiAgICBkaXJlY3RpdmVEZWZJZHg6IG51bWJlciwgZGlyZWN0aXZlOiBULFxuICAgIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8VD58IENvbXBvbmVudERlZkludGVybmFsPFQ+KTogVCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0TE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB2aWV3RGF0YSk7XG4gIGNvbnN0IGluc3RhbmNlID0gYmFzZURpcmVjdGl2ZUNyZWF0ZShkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmLCBob3N0Tm9kZSk7XG5cbiAgaWYgKChkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pLnRlbXBsYXRlKSB7XG4gICAgaG9zdE5vZGUuZGF0YSAhW0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCB0Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlRGVmLmhvc3RWYXJzKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZScpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhkaXJlY3RpdmVEZWZJZHgsIGluc3RhbmNlLCBkaXJlY3RpdmVEZWYuaW5wdXRzLCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcykge1xuICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcygpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihkZWY6IENvbXBvbmVudERlZkludGVybmFsPFQ+KTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0TE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB2aWV3RGF0YSk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCBhcyBudW1iZXIsXG4gICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKGhvc3ROb2RlLm5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmKSwgdFZpZXcsIG51bGwsXG4gICAgICAgICAgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpKTtcblxuICAvLyBXZSBuZWVkIHRvIHNldCB0aGUgaG9zdCBub2RlL2RhdGEgaGVyZSBiZWNhdXNlIHdoZW4gdGhlIGNvbXBvbmVudCBMTm9kZSB3YXMgY3JlYXRlZCxcbiAgLy8gd2UgZGlkbid0IHlldCBrbm93IGl0IHdhcyBhIGNvbXBvbmVudCAoanVzdCBhbiBlbGVtZW50KS5cbiAgKGhvc3ROb2RlIGFze2RhdGE6IExWaWV3RGF0YX0pLmRhdGEgPSBjb21wb25lbnRWaWV3O1xuICAoY29tcG9uZW50VmlldyBhcyBMVmlld0RhdGEpW0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKCk7XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgZGlyZWN0aXZlQ3JlYXRlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnRcbiAqXG4gKiBUaGlzIHZlcnNpb24gZG9lcyBub3QgY29udGFpbiBmZWF0dXJlcyB0aGF0IHdlIGRvbid0IGFscmVhZHkgc3VwcG9ydCBhdCByb290IGluXG4gKiBjdXJyZW50IEFuZ3VsYXIuIEV4YW1wbGU6IGxvY2FsIHJlZnMgYW5kIGlucHV0cyBvbiByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPixcbiAgICBob3N0Tm9kZTogTE5vZGUpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgdmlld0RhdGEpO1xuICBpZiAoaG9zdE5vZGUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEoaG9zdE5vZGUubmF0aXZlLCB2aWV3RGF0YSk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSB2aWV3RGF0YVtESVJFQ1RJVkVTXSA9IGRpcmVjdGl2ZXMgPSBbXTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgsIGRpcmVjdGl2ZXMpO1xuICBkaXJlY3RpdmVzW2luZGV4XSA9IGRpcmVjdGl2ZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBmbGFncyA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID1cbiAgICAgICAgICBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9ubHkgbmVlZCB0byBidW1wIHRoZSBzaXplIHdoZW4gc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MrKztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGlQdWJsaWMgPSBkaXJlY3RpdmVEZWYgIS5kaVB1YmxpYztcbiAgICBpZiAoZGlQdWJsaWMpIGRpUHVibGljKGRpcmVjdGl2ZURlZiAhKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMoKGhvc3ROb2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzIGFzIHN0cmluZ1tdKTtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgaW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZzt9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgcmV0dXJuIFtcbiAgICBpc0ZvclZpZXdDb250YWluZXJSZWYgPyBudWxsIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3c1xuICAgIG51bGwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZGVyUGFyZW50LCBzZXQgYWZ0ZXIgbm9kZSBjcmVhdGlvblxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGFuIG5nLXRlbXBsYXRlIChkeW5hbWljYWxseS1pbnNlcnRlZCB2aWV3KSwgZS5nLlxuICpcbiAqIDxuZy10ZW1wbGF0ZSAjZm9vPlxuICogICAgPGRpdj48L2Rpdj5cbiAqIDwvbmctdGVtcGxhdGU+XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBJbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgQSBmdW5jdGlvbiB3aGljaCBleHRyYWN0cyBsb2NhbC1yZWZzIHZhbHVlcyBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAqICAgICAgICBEZWZhdWx0cyB0byB0aGUgY3VycmVudCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgbG9jYWwtcmVmLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIC8vIFRPRE86IGNvbnNpZGVyIGEgc2VwYXJhdGUgbm9kZSB0eXBlIGZvciB0ZW1wbGF0ZXNcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgdGFnTmFtZSB8fCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS50Vmlld3MgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgLTEsIHRlbXBsYXRlRm4sIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cblxuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcywgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICBjdXJyZW50UXVlcmllcyAmJlxuICAgICAgKGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUpKTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyh0Tm9kZS5mbGFncywgdFZpZXcpO1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Tm9kZS50Vmlld3MgPSBbXSk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5lckludGVybmFsKFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIodmlld0RhdGEpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50ID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMsIGxDb250YWluZXIpO1xuXG4gIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSBnZXRSZW5kZXJQYXJlbnQodE5vZGUsIHZpZXdEYXRhKTtcbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIHZpZXdEYXRhKTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZSh2aWV3RGF0YSwgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsQ29udGFpbmVyKTtcblxuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFNldHMgYSBjb250YWluZXIgdXAgdG8gcmVjZWl2ZSB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hTdGFydChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWRJbnRlcm5hbChpbmRleCwgdFZpZXcuZGF0YSkgYXMgVE5vZGU7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgLy8gSW5saW5lIGNvbnRhaW5lcnMgY2Fubm90IGhhdmUgc3R5bGUgYmluZGluZ3MsIHNvIHdlIGNhbiByZWFkIHRoZSB2YWx1ZSBkaXJlY3RseVxuICAodmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lck5vZGUuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXJOb2RlIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgVmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgLy8gSW5saW5lIGNvbnRhaW5lcnMgY2Fubm90IGhhdmUgc3R5bGUgYmluZGluZ3MsIHNvIHdlIGNhbiByZWFkIHRoZSB2YWx1ZSBkaXJlY3RseVxuICBjb25zdCBsQ29udGFpbmVyID0gdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XS5kYXRhO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShcbiAgICAgICAgICAgIGR5bmFtaWNWaWV3RGF0YSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEsXG4gICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gdENvbnRhaW5lck5vZGUgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHN0YXJ0SWR4IHN0YXJ0aW5nIGluZGV4IGluIHRoZSB2aWV3cyBhcnJheSB0byBzZWFyY2ggZnJvbVxuICogQHBhcmFtIHZpZXdCbG9ja0lkIGV4YWN0IHZpZXcgYmxvY2sgaWQgdG8gbG9vayBmb3JcbiAqIEByZXR1cm5zIGluZGV4IG9mIGEgZm91bmQgdmlldyBvciAtMSBpZiBub3QgZm91bmRcbiAqL1xuZnVuY3Rpb24gc2NhbkZvclZpZXcoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdENvbnRhaW5lck5vZGU6IFRDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLFxuICAgIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld0RhdGF8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIHRDb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaCBoZXJlXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFya3MgdGhlIHN0YXJ0IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXdCbG9ja0lkIFRoZSBJRCBvZiB0aGlzIHZpZXdcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3U3RhcnQodmlld0Jsb2NrSWQ6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcik6IFJlbmRlckZsYWdzIHtcbiAgLy8gVGhlIHByZXZpb3VzIG5vZGUgY2FuIGJlIGEgdmlldyBub2RlIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGFuIGlubGluZSBmb3IgbG9vcFxuICBjb25zdCBjb250YWluZXJUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICEgOlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlO1xuICAvLyBJbmxpbmUgY29udGFpbmVycyBjYW5ub3QgaGF2ZSBzdHlsZSBiaW5kaW5ncywgc28gd2UgY2FuIHJlYWQgdGhlIHZhbHVlIGRpcmVjdGx5XG4gIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdEYXRhW2NvbnRhaW5lclROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgY29uc3QgY3VycmVudFZpZXcgPSB2aWV3RGF0YTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyVE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyLmRhdGE7XG4gIGxldCB2aWV3VG9SZW5kZXIgPSBzY2FuRm9yVmlldyhcbiAgICAgIGxDb250YWluZXIsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3VG9SZW5kZXIpIHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29uc3RzLCB2YXJzLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSksIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVOb2RlQXRJbmRleCh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIHZpZXdUb1JlbmRlcik7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfVxuICBpZiAoY29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcodmlld1RvUmVuZGVyLCBsQ29udGFpbmVyLCBjdXJyZW50VmlldywgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIC0xKTtcbiAgICB9XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICErKztcbiAgfVxuICByZXR1cm4gZ2V0UmVuZGVyRmxhZ3Modmlld1RvUmVuZGVyKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCB2aWV3SG9zdCA9IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHZpZXdIb3N0ICE7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3RGF0YVtdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoYWRqdXN0ZWRFbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0pIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHRWaWV3LmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXdEYXRhIGF0dGFjaGVkLmApO1xuICBjb25zdCBob3N0VmlldyA9IGVsZW1lbnQuZGF0YSAhO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0VmlldywgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50Vmlldyh2aWV3RGF0YSlbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcERhdGE6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobm9PZk5vZGVCdWNrZXRzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcERhdGEuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZDogVE5vZGV8bnVsbCA9IGNvbXBvbmVudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldEluZGV4ID1cbiAgICAgICAgICBzZWxlY3RvcnMgPyBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKSA6IDA7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG5cbiAgICAgIGlmICh0YWlsc1tidWNrZXRJbmRleF0pIHtcbiAgICAgICAgdGFpbHNbYnVja2V0SW5kZXhdICEubmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcERhdGFbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlld0RhdGEgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKG5vZGVJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgaXNQYXJlbnQgPSBmYWxzZTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgbGV0IG5vZGVUb1Byb2plY3QgPSAoY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbc2VsZWN0b3JJbmRleF07XG4gIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG5cbiAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gVGhpcyBub2RlIGlzIHJlLXByb2plY3RlZCwgc28gd2UgbXVzdCBnbyB1cCB0aGUgdHJlZSB0byBnZXQgaXRzIHByb2plY3RlZCBub2Rlcy5cbiAgICAgIGNvbnN0IGN1cnJlbnRDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcocHJvamVjdGVkVmlldyk7XG4gICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGN1cnJlbnRDb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgZmlyc3RQcm9qZWN0ZWROb2RlID1cbiAgICAgICAgICAoY3VycmVudENvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW25vZGVUb1Byb2plY3QucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICBpZiAoZmlyc3RQcm9qZWN0ZWROb2RlKSB7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IG5vZGVUb1Byb2plY3Q7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHByb2plY3RlZFZpZXc7XG5cbiAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgcHJvamVjdGVkVmlldyA9IGN1cnJlbnRDb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxOb2RlID0gcHJvamVjdGVkVmlld1tub2RlVG9Qcm9qZWN0LmluZGV4XSBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZTtcbiAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgIC8vIGlmIHRoZSBub2RlcyBhcmUgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBsYXRlci5cbiAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcblxuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShsTm9kZSwgbm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCB2aWV3RGF0YSwgcHJvamVjdGVkVmlldyk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgYXJlIGZpbmlzaGVkIHdpdGggYSBsaXN0IG9mIHJlLXByb2plY3RlZCBub2Rlcywgd2UgbmVlZCB0byBnZXRcbiAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgaWYgKG5vZGVUb1Byb2plY3QubmV4dCA9PT0gbnVsbCAmJiBwcm9qZWN0ZWRWaWV3ICE9PSBjb21wb25lbnRWaWV3W1BBUkVOVF0gISkge1xuICAgICAgcHJvamVjdGVkVmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlld0RhdGE7XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgIH1cbiAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdEYXRhW10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3RGF0YXxMQ29udGFpbmVyPihcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBpZiAoY3VycmVudFZpZXdbVEFJTF0pIHtcbiAgICBjdXJyZW50Vmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3RGF0YSBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChub2RlOiBMRWxlbWVudE5vZGUpOiB2b2lkIHtcbiAgLy8gQmVjYXVzZSBkYXRhIGZsb3dzIGRvd24gdGhlIGNvbXBvbmVudCB0cmVlLCBhbmNlc3RvcnMgZG8gbm90IG5lZWQgdG8gYmUgbWFya2VkIGRpcnR5XG4gIGlmIChub2RlLmRhdGEgJiYgIShub2RlLmRhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBub2RlLmRhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX3ByZXZlbnREZWZhdWx0KGU6IEV2ZW50KSB7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgbGV0IGN1cnJlbnRWaWV3OiBMVmlld0RhdGEgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50VmlldyAmJiAhKGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50Vmlld1tDT05URVhUXSwgJ3Jvb3RDb250ZXh0IHNob3VsZCBiZSBkZWZpbmVkJyk7XG5cbiAgY29uc3Qgcm9vdENvbnRleHQgPSBjdXJyZW50Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgY29uc3Qgbm90aGluZ1NjaGVkdWxlZCA9IHJvb3RDb250ZXh0LmZsYWdzID09PSBSb290Q29udGV4dEZsYWdzLkVtcHR5O1xuICByb290Q29udGV4dC5mbGFncyB8PSBSb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gIGlmIChub3RoaW5nU2NoZWR1bGVkKSB7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0KTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlld0RhdGEocm9vdENvbXBvbmVudCkgISwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudCkgITtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGhvc3ROb2RlLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXdEYXRhIGluc3RhbmNlLicpO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdE5vZGUuZGF0YSAhLCBjb21wb25lbnQpO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSB0cnVlO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXMoY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcbiAgfVxufVxuXG4vKiogQ2hlY2tzIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgcHJvdmlkZWQuIERvZXMgbm90IGdhdGUgb24gZGlydHkgY2hlY2tzIG9yIGV4ZWN1dGUgZG9DaGVjay4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4oaG9zdFZpZXc6IExWaWV3RGF0YSwgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3Qgdmlld1F1ZXJ5ID0gaG9zdFRWaWV3LnZpZXdRdWVyeTtcblxuICB0cnkge1xuICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICBjcmVhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBob3N0Vmlld1tGTEFHU10sIGNvbXBvbmVudCk7XG4gICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIHVwZGF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmIChmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5DcmVhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlVmlld1F1ZXJ5PFQ+KHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGVsZW1lbnROb2RlID0gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudCkgITtcbiAgbWFya1ZpZXdEaXJ0eShlbGVtZW50Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHYwKTtcbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMztcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIHN1ZmZpeCA6XG4gICAgICAgICAgICAgICAgICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGUgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NikgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA3O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCBjb250ZXh0Vmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdLFxuICAgICAgICAgICAgICAgICAgICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShxdWVyeUxpc3RJZHgsIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gISk7XG5cbiAgcmV0dXJuIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50KGluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gbG9hZEVsZW1lbnRJbnRlcm5hbChpbmRleCwgdmlld0RhdGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VE5vZGUoaW5kZXg6IG51bWJlcik6IFROb2RlIHtcbiAgcmV0dXJuIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGN1cnJlbnQgYmluZGluZyB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nKGJpbmRpbmdJbmRleDogbnVtYmVyKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0pO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gdmlld0RhdGFbYmluZGluZ0luZGV4XTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBpdCB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihcbiAgICAgICAgICAgICAgICAgICBiaW5kaW5nSW5kZXgsIHZpZXdEYXRhLmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB0byBOT19DSEFOR0VgKTtcblxuICBpZiAodmlld0RhdGFbYmluZGluZ0luZGV4XSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKGlzRGlmZmVyZW50KHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlLCBjaGVja05vQ2hhbmdlc01vZGUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShjcmVhdGlvbk1vZGUsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgYW5kIHJldHVybnMgdGhlIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBhbnkge1xuICByZXR1cm4gdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG4vKiogVXBkYXRlcyAyIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGVpdGhlciB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCwgZXhwMSk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXggKyAxLCBleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDMgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMyhiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCArIDIsIGV4cDMpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4ICsgMiwgZXhwMywgZXhwNCkgfHwgZGlmZmVyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFZpZXcoKTogVFZpZXcge1xuICByZXR1cm4gdFZpZXc7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZW50UXVlcnk8UT4ocXVlcnlMaXN0OiBRdWVyeUxpc3Q8UT4pOiB2b2lkIHtcbiAgY29uc3Qgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCA9XG4gICAgICAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSB8fCAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChxdWVyeUxpc3QpO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVzICEubGVuZ3RoIC0gMTtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMl0gOiAtMTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKGN1cnJlbnREaXJlY3RpdmVJbmRleCwgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpIHtcbiAgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIHRydWUsICdwcmV2aW91c09yUGFyZW50VE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhhc1BhcmVudCgpIHtcbiAgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50LCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGFJblJhbmdlKGluZGV4OiBudW1iZXIsIGFycj86IGFueVtdKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkgYXJyID0gdmlld0RhdGE7XG4gIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXgsIGFyciB8fCB2aWV3RGF0YSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGFOZXh0KGluZGV4OiBudW1iZXIsIGFycj86IGFueVtdKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkgYXJyID0gdmlld0RhdGE7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgYXJyLmxlbmd0aCwgaW5kZXgsIGBpbmRleCAke2luZGV4fSBleHBlY3RlZCB0byBiZSBhdCB0aGUgZW5kIG9mIGFyciAobGVuZ3RoICR7YXJyLmxlbmd0aH0pYCk7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG4iXX0=