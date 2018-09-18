/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual } from './assert';
import { attachPatchData, getLElementFromComponent, readPatchedLViewData } from './context_discovery';
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
import { assertDataInRangeInternal, getLNode, isContentQueryHost, isDifferent, loadElementInternal, loadInternal, readElementValue, stringify } from './util';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
const _CLEAN_PROMISE = Promise.resolve(null);
/**
 * TView.data needs to fill the same number of slots as the LViewData header
 * so the indices of nodes are consistent between LViewData and TView.data.
 *
 * It's much faster to keep a blueprint of the pre-filled array and slice it
 * than it is to create a new array and fill it each time a TView is created.
 */
const HEADER_FILLER = new Array(HEADER_OFFSET).fill(null);
/**
 * Token set in currentMatches while dependencies are being resolved.
 *
 * If we visit a directive that has a value set to CIRCULAR, we know we've
 * already seen it, and thus have a circular dependency.
 */
export const CIRCULAR = '__CIRCULAR__';
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
let renderer;
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
let rendererFactory;
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
let elementDepthCount;
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
let previousOrParentTNode;
export function getPreviousOrParentNode() {
    return previousOrParentTNode == null || previousOrParentTNode === viewData[HOST_NODE] ?
        getHostElementNode(viewData) :
        getLNode(previousOrParentTNode, viewData);
}
export function getPreviousOrParentTNode() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return previousOrParentTNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentTNode` points to a parent node.
 *  - `false`: then `previousOrParentTNode` points to previous node (sibling).
 */
let isParent;
let tView;
let currentQueries;
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
let creationMode;
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
let viewData;
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
let contextViewData = null;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
let directives;
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
let checkNoChangesMode = false;
/** Whether or not this is the first time the current view has been processed. */
let firstTemplatePass = true;
/**
 * The root index from which pure function instructions should calculate their binding
 * indices. In component views, this is TView.bindingStartIndex. In a host binding
 * context, this is the TView.hostBindingStartIndex + any hostVars before the given dir.
 */
let bindingRootIndex = -1;
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
    const oldView = viewData;
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
        const defs = tView.directives;
        for (let i = 0; i < bindings.length; i += 2) {
            const dirIndex = bindings[i];
            const def = defs[dirIndex];
            def.hostBindings(dirIndex, bindings[i + 1]);
            bindingRootIndex = viewData[BINDING_INDEX] = bindingRootIndex + def.hostVars;
        }
    }
}
/** Refreshes content queries for all directives in the given view. */
function refreshContentQueries(tView) {
    if (tView.contentQueries != null) {
        for (let i = 0; i < tView.contentQueries.length; i += 2) {
            const directiveDefIdx = tView.contentQueries[i];
            const directiveDef = tView.directives[directiveDefIdx];
            directiveDef.contentQueriesRefresh(directiveDefIdx, tView.contentQueries[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components) {
    if (components != null) {
        for (let i = 0; i < components.length; i++) {
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
    const instance = tView.blueprint.slice();
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
export function createLNodeObject(type, nodeInjector, native, state) {
    return {
        native: native,
        nodeInjector: nodeInjector,
        data: state,
        dynamicLContainerNode: null
    };
}
export function createNodeAtIndex(index, type, native, name, attrs, state) {
    const parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    const parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
    const tParent = parentInSameView ? parent : null;
    const isState = state != null;
    const node = createLNodeObject(type, null, native, isState ? state : null);
    let tNode;
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in tView.node.
        tNode = (state ? state[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        const adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        const tData = tView.data;
        ngDevMode && assertLessThan(adjustedIndex, viewData.length, `Slot should have been initialized with null`);
        viewData[adjustedIndex] = node;
        if (tData[adjustedIndex] == null) {
            const tNode = tData[adjustedIndex] =
                createTNode(type, adjustedIndex, name, attrs, tParent, null);
            if (!isParent && previousOrParentTNode) {
                previousOrParentTNode.next = tNode;
                if (previousOrParentTNode.dynamicContainerNode)
                    previousOrParentTNode.dynamicContainerNode.next = tNode;
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
    // TODO: temporary, remove this when removing nodeInjector (bringing in fns to hello world)
    if (index !== -1 && !(viewData[FLAGS] & 64 /* IsRoot */)) {
        const parentLNode = type === 2 /* View */ ?
            getContainerNode(tNode, state) :
            getParentOrContainerNode(tNode, viewData);
        parentLNode && (node.nodeInjector = parentLNode.nodeInjector);
    }
    // View nodes and host elements need to set their host node (components do not save host TNodes)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        const lViewData = state;
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
    const tView = view[TVIEW];
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
        const componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        const componentLView = createLViewData(renderer, componentTView, context, 2 /* CheckAlways */, sanitizer);
        createNodeAtIndex(0, 3 /* Element */, hostNode, null, null, componentLView);
        host = loadElement(0);
    }
    const hostView = host.data;
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(hostView, context, templateFn);
    return host;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries) {
    const _isParent = isParent;
    const _previousOrParentTNode = previousOrParentTNode;
    isParent = true;
    previousOrParentTNode = null;
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
 */
export function renderEmbeddedTemplate(viewToRender, tView, context, rf) {
    const _isParent = isParent;
    const _previousOrParentTNode = previousOrParentTNode;
    let oldView;
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
            const isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
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
export function nextContext(level = 1) {
    contextViewData = walkUpViews(level, contextViewData);
    return contextViewData[CONTEXT];
}
export function renderComponentOrTemplate(hostView, componentOrContext, templateFn) {
    const oldView = enterView(hostView, hostView[HOST_NODE]);
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
let _currentNamespace = null;
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
    const native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    const tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null, null);
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
    const native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    const tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null, null);
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
    let native;
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
 */
function cacheMatchingDirectivesForNode(tNode, tView, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    const exportsMap = localRefs ? { '': -1 } : null;
    const matches = tView.currentMatches = findDirectiveMatches(tNode);
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            const def = matches[i];
            const valueIndex = i + 1;
            resolveDirective(def, valueIndex, matches, tView);
            saveNameToExportMap(matches[valueIndex], def, exportsMap);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
}
/** Matches the current node against all available selectors. */
function findDirectiveMatches(tNode) {
    const registry = tView.directiveRegistry;
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
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
        const instance = def.factory();
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
    for (let i = 0; i < hostVars; i++) {
        tView.blueprint.push(NO_CHANGE);
        viewData.push(NO_CHANGE);
    }
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, previousOrParentTNode.index - HEADER_OFFSET);
}
/** Sets the context for a ChangeDetectorRef to the given instance. */
export function initChangeDetectorIfExisting(injector, instance, view) {
    if (injector && injector.changeDetectorRef != null) {
        injector.changeDetectorRef._setComponentContext(view, instance);
    }
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    ngDevMode && assertEqual(firstTemplatePass, false, `Directives should only be instantiated directly after first template pass`);
    const count = previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
    if (isContentQueryHost(previousOrParentTNode) && currentQueries) {
        currentQueries = currentQueries.clone();
    }
    if (count > 0) {
        const start = previousOrParentTNode.flags >> 15 /* DirectiveStartingIndexShift */;
        const end = start + count;
        const tDirectives = tView.directives;
        for (let i = start; i < end; i++) {
            const def = tDirectives[i];
            directiveCreate(i, def.factory(), def);
        }
    }
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        const localNames = tNode.localNames = [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let i = 0; i < localRefs.length; i += 2) {
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
    const localNames = previousOrParentTNode.localNames;
    const tNode = previousOrParentTNode;
    if (localNames) {
        let localIndex = previousOrParentTNode.index + 1;
        for (let i = 0; i < localNames.length; i += 2) {
            const index = localNames[i + 1];
            const value = index === -1 ? localRefExtractor(tNode, viewData) : directives[index];
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
    const bindingStartIndex = HEADER_OFFSET + consts;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    const initialViewLength = bindingStartIndex + vars;
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
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
    const blueprint = new Array(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex);
    blueprint[CONTAINER_INDEX] = -1;
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
function setUpAttributes(native, attrs) {
    const isProc = isProceduralRenderer(renderer);
    let i = 0;
    while (i < attrs.length) {
        const attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === NG_PROJECT_AS_ATTR_NAME) {
            i += 2;
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            if (attrName === 0 /* NamespaceURI */) {
                // Namespaced attributes
                const namespaceURI = attrs[i + 1];
                const attrName = attrs[i + 2];
                const attrVal = attrs[i + 3];
                isProc ?
                    renderer
                        .setAttribute(native, attrName, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName, attrVal);
                i += 4;
            }
            else {
                // Standard attributes
                const attrVal = attrs[i + 1];
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
    return new Error(`Renderer: ${text} [${stringify(token)}]`);
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export function locateHostElement(factory, elementOrSelector) {
    ngDevMode && assertDataInRange(-1);
    rendererFactory = factory;
    const defaultRenderer = factory.createRenderer(null, null);
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
 * @param rNode Render host element.
 * @param def ComponentDef
 *
 * @returns LElementNode created
 */
export function hostElement(tag, rNode, def, sanitizer) {
    resetComponentState();
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
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener.
 */
export function listener(eventName, listenerFn, useCapture = false) {
    const tNode = previousOrParentTNode;
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        const node = getPreviousOrParentNode();
        ngDevMode && ngDevMode.rendererAddEventListener++;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            const cleanupFn = renderer.listen(node.native, eventName, listenerFn);
            storeCleanupFn(viewData, cleanupFn);
        }
        else {
            const wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            node.native.addEventListener(eventName, wrappedListener, useCapture);
            const cleanupInstances = getCleanup(viewData);
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
    const outputs = tNode.outputs;
    let outputData;
    if (outputs && (outputData = outputs[eventName])) {
        createOutput(outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 */
function createOutput(outputs, listener) {
    for (let i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(outputs[i], directives);
        const subscription = directives[outputs[i]][outputs[i + 1]].subscribe(listener);
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
        const element = loadElement(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
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
    const node = loadElement(index);
    const tNode = getTNode(index);
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
    }
    const inputData = tNode && tNode.inputs;
    let dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(dataValue, value);
        markDirtyIfOnPush(node);
    }
    else {
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value) : value;
        const native = node.native;
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
    for (let i = 0; i < inputs.length; i += 2) {
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
    const count = tNodeFlags & 4095 /* DirectiveCountMask */;
    let propStore = null;
    if (count > 0) {
        const start = tNodeFlags >> 15 /* DirectiveStartingIndexShift */;
        const end = start + count;
        const isInput = direction === 0 /* Input */;
        const defs = tView.directives;
        for (let i = start; i < end; i++) {
            const directiveDef = defs[i];
            const propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (let publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    const internalName = propertyAliasMap[publicName];
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
 * @param index Index of the style allocation. See: `elementStyling`.
 */
function getStylingContext(index) {
    let stylingContext = load(index);
    if (!Array.isArray(stylingContext)) {
        const lElement = stylingContext;
        const tNode = getTNode(index);
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
    const textNative = createTextNode(value, renderer);
    const tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
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
        const existingNode = loadElement(index);
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
    const hostNode = getPreviousOrParentNode();
    const instance = baseDirectiveCreate(directiveDefIdx, directive, directiveDef, hostNode);
    const isComponent = directiveDef.template;
    if (isComponent) {
        addComponentLogic(directiveDefIdx, directive, directiveDef, hostNode);
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
function addComponentLogic(directiveIndex, instance, def, hostNode) {
    const tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const componentView = addToViewTree(viewData, previousOrParentTNode.index, createLViewData(rendererFactory.createRenderer(hostNode.native, def), tView, instance, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    hostNode.data = componentView;
    componentView[HOST_NODE] = getPreviousOrParentTNode();
    initChangeDetectorIfExisting(hostNode.nodeInjector, instance, componentView);
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
        const diPublic = directiveDef.diPublic;
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
    let initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, inputs, tNode);
    }
    const initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        for (let i = 0; i < initialInputs.length; i += 2) {
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
    const initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
    const attrs = tNode.attrs;
    let i = 0;
    while (i < attrs.length) {
        const attrName = attrs[i];
        if (attrName === 1 /* SelectOnly */)
            break;
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        const minifiedInputName = inputs[attrName];
        const attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            const inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
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
    const tNode = containerInternal(index, tagName || null, attrs || null);
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
    const tNode = containerInternal(index, null, null);
    firstTemplatePass && (tNode.tViews = []);
    isParent = false;
}
function containerInternal(index, tagName, attrs) {
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'container nodes should be created before any bindings');
    const lContainer = createLContainer(viewData);
    ngDevMode && ngDevMode.rendererCreateComment++;
    const comment = renderer.createComment(ngDevMode ? 'container' : '');
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
    const lContainer = viewData[previousOrParentTNode.index].data;
    const nextIndex = lContainer[ACTIVE_INDEX];
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
    for (let current = getLViewChild(lViewData); current !== null; current = current[NEXT]) {
        // Note: current can be an LViewData or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LViewData
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === null) {
            const container = current;
            for (let i = 0; i < container[VIEWS].length; i++) {
                const dynamicViewData = container[VIEWS][i];
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
    const views = lContainer[VIEWS];
    for (let i = startIdx; i < views.length; i++) {
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
 * @param viewBlockId The ID of this view
 * @return boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId, consts, vars) {
    // The previous node can be a view node if we are processing an inline for loop
    const containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        previousOrParentTNode.parent :
        previousOrParentTNode;
    // Inline containers cannot have style bindings, so we can read the value directly
    const container = viewData[containerTNode.index];
    const currentView = viewData;
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    const lContainer = container.data;
    let viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
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
    const containerTViews = parent.tViews;
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] = createTView(viewIndex, null, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    const viewHost = viewData[HOST_NODE];
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
    const element = readElementValue(viewData[adjustedElementIndex]);
    ngDevMode && assertNodeType(tView.data[adjustedElementIndex], 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, `Component's host node should have an LViewData attached.`);
    const hostView = element.data;
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
    const componentNode = findComponentView(viewData)[HOST_NODE];
    if (!componentNode.projection) {
        const noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
        const pData = componentNode.projection =
            new Array(noOfNodeBuckets).fill(null);
        const tails = pData.slice();
        let componentChild = componentNode.child;
        while (componentChild !== null) {
            const bucketIndex = selectors ? matchingSelectorIndex(componentChild, selectors, textSelectors) : 0;
            const nextNode = componentChild.next;
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
const projectionNodeStack = [];
/**
 * Inserts previously re-distributed projected nodes. This instruction must be preceded by a call
 * to the projectionDef instruction.
 *
 * @param nodeIndex
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export function projection(nodeIndex, selectorIndex = 0, attrs) {
    const tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null, null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is stored on a component's view level
    const componentView = findComponentView(viewData);
    const componentNode = componentView[HOST_NODE];
    let nodeToProject = componentNode.projection[selectorIndex];
    let projectedView = componentView[PARENT];
    let projectionNodeIndex = -1;
    while (nodeToProject) {
        if (nodeToProject.type === 1 /* Projection */) {
            // This node is re-projected, so we must go up the tree to get its projected nodes.
            const currentComponentView = findComponentView(projectedView);
            const currentComponentHost = currentComponentView[HOST_NODE];
            const firstProjectedNode = currentComponentHost.projection[nodeToProject.projection];
            if (firstProjectedNode) {
                projectionNodeStack[++projectionNodeIndex] = nodeToProject;
                projectionNodeStack[++projectionNodeIndex] = projectedView;
                nodeToProject = firstProjectedNode;
                projectedView = currentComponentView[PARENT];
                continue;
            }
        }
        else {
            const lNode = projectedView[nodeToProject.index];
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
    let currentView = view;
    while (currentView && !(currentView[FLAGS] & 64 /* IsRoot */)) {
        currentView[FLAGS] |= 4 /* Dirty */;
        currentView = currentView[PARENT];
    }
    currentView[FLAGS] |= 4 /* Dirty */;
    ngDevMode && assertDefined(currentView[CONTEXT], 'rootContext should be defined');
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
        let res;
        rootContext.clean = new Promise((r) => res = r);
        rootContext.scheduler(() => {
            tickRootContext(rootContext);
            res(null);
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
    const rootView = getRootView(component);
    const rootContext = rootView[CONTEXT];
    tickRootContext(rootContext);
}
function tickRootContext(rootContext) {
    for (let i = 0; i < rootContext.components.length; i++) {
        const rootComponent = rootContext.components[i];
        renderComponentOrTemplate(readPatchedLViewData(rootComponent), rootComponent);
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
    let lViewData = readPatchedLViewData(component);
    while (lViewData && !(lViewData[FLAGS] & 64 /* IsRoot */)) {
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
    const hostNode = getLElementFromComponent(component);
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
    const hostTView = hostView[TVIEW];
    const oldView = enterView(hostView, hostView[HOST_NODE]);
    const templateFn = hostTView.template;
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
    const elementNode = getLElementFromComponent(component);
    markViewDirty(elementNode.data);
}
/** A special value which designates that a value has not changed. */
export const NO_CHANGE = {};
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
    let different = false;
    for (let i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(viewData[BINDING_INDEX]++, values[i]) && (different = true);
    }
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    let content = values[0];
    for (let i = 1; i < values.length; i += 2) {
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
    const different = bindingUpdated(viewData[BINDING_INDEX]++, v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    const different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    const different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    const different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated(viewData[BINDING_INDEX] + 4, v4) || different;
    viewData[BINDING_INDEX] += 5;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated2(viewData[BINDING_INDEX] + 4, v4, v5) || different;
    viewData[BINDING_INDEX] += 6;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    different = bindingUpdated3(viewData[BINDING_INDEX] + 4, v4, v5, v6) || different;
    viewData[BINDING_INDEX] += 7;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    let different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
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
/** Updates binding and returns the value. */
export function updateBinding(bindingIndex, value) {
    return viewData[bindingIndex] = value;
}
/** Updates 2 bindings if changed, then returns whether either was updated. */
export function bindingUpdated2(bindingIndex, exp1, exp2) {
    const different = bindingUpdated(bindingIndex, exp1);
    return bindingUpdated(bindingIndex + 1, exp2) || different;
}
/** Updates 3 bindings if changed, then returns whether any was updated. */
export function bindingUpdated3(bindingIndex, exp1, exp2, exp3) {
    const different = bindingUpdated2(bindingIndex, exp1, exp2);
    return bindingUpdated(bindingIndex + 2, exp3) || different;
}
/** Updates 4 bindings if changed, then returns whether any was updated. */
export function bindingUpdated4(bindingIndex, exp1, exp2, exp3, exp4) {
    const different = bindingUpdated2(bindingIndex, exp1, exp2);
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
    const savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
    if (firstTemplatePass) {
        const currentDirectiveIndex = directives.length - 1;
        const tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        const lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
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
    assertEqual(arr.length, index, `index ${index} expected to be at the end of arr (length ${arr.length})`);
}
export const CLEAN_PROMISE = _CLEAN_PROMISE;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFNdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNwRixPQUFPLEVBQUMsZUFBZSxFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEcsT0FBTyxFQUFDLDBCQUEwQixFQUFFLHlCQUF5QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzVHLE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQWMsYUFBYSxFQUFFLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBSXRGLE9BQU8sRUFBa0IsdUJBQXVCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVqRixPQUFPLEVBQXFGLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDL0ksT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQXNCLGdCQUFnQixFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXlCLElBQUksRUFBbUIsTUFBTSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQWUsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUN0VCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hF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QyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICcuL25nX2Rldl9tb2RlJztcblxuaW1wb3J0IHtRdWVyeUxpc3R9IGZyb20gJy4uL2xpbmtlcic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50LCByZWFkUGF0Y2hlZExWaWV3RGF0YX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBleGVjdXRlSW5pdEhvb2tzLCBxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50UXVlcnksIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgSW5pdGlhbFN0eWxpbmdGbGFncywgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIENPTlRFTlRfUVVFUklFUywgQ09OVEVYVCwgQ3VycmVudE1hdGNoZXNMaXN0LCBERUNMQVJBVElPTl9WSUVXLCBESVJFQ1RJVkVTLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBMVmlld0ZsYWdzLCBORVhULCBPcGFxdWVWaWV3U3RhdGUsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJvb3RDb250ZXh0LCBTQU5JVElaRVIsIFRBSUwsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZmluZENvbXBvbmVudFZpZXcsIGdldENvbnRhaW5lck5vZGUsIGdldEhvc3RFbGVtZW50Tm9kZSwgZ2V0TFZpZXdDaGlsZCwgZ2V0UGFyZW50T3JDb250YWluZXJOb2RlLCBnZXRSZW5kZXJQYXJlbnQsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge1N0eWxpbmdDb250ZXh0LCBhbGxvY1N0eWxpbmdDb250ZXh0LCBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlLCByZW5kZXJTdHlsaW5nIGFzIHJlbmRlckVsZW1lbnRTdHlsZXMsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2VJbnRlcm5hbCwgZ2V0TE5vZGUsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNEaWZmZXJlbnQsIGxvYWRFbGVtZW50SW50ZXJuYWwsIGxvYWRJbnRlcm5hbCwgcmVhZEVsZW1lbnRWYWx1ZSwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG4vKipcbiAqIEZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlIGJlZm9yZSB3cml0aW5nIGl0IGludG8gdGhlIHJlbmRlcmVyLlxuICovXG5leHBvcnQgdHlwZSBTYW5pdGl6ZXJGbiA9ICh2YWx1ZTogYW55KSA9PiBzdHJpbmc7XG5cbi8qKlxuICogVFZpZXcuZGF0YSBuZWVkcyB0byBmaWxsIHRoZSBzYW1lIG51bWJlciBvZiBzbG90cyBhcyB0aGUgTFZpZXdEYXRhIGhlYWRlclxuICogc28gdGhlIGluZGljZXMgb2Ygbm9kZXMgYXJlIGNvbnNpc3RlbnQgYmV0d2VlbiBMVmlld0RhdGEgYW5kIFRWaWV3LmRhdGEuXG4gKlxuICogSXQncyBtdWNoIGZhc3RlciB0byBrZWVwIGEgYmx1ZXByaW50IG9mIHRoZSBwcmUtZmlsbGVkIGFycmF5IGFuZCBzbGljZSBpdFxuICogdGhhbiBpdCBpcyB0byBjcmVhdGUgYSBuZXcgYXJyYXkgYW5kIGZpbGwgaXQgZWFjaCB0aW1lIGEgVFZpZXcgaXMgY3JlYXRlZC5cbiAqL1xuY29uc3QgSEVBREVSX0ZJTExFUiA9IG5ldyBBcnJheShIRUFERVJfT0ZGU0VUKS5maWxsKG51bGwpO1xuXG4vKipcbiAqIFRva2VuIHNldCBpbiBjdXJyZW50TWF0Y2hlcyB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkLlxuICpcbiAqIElmIHdlIHZpc2l0IGEgZGlyZWN0aXZlIHRoYXQgaGFzIGEgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB3ZSBrbm93IHdlJ3ZlXG4gKiBhbHJlYWR5IHNlZW4gaXQsIGFuZCB0aHVzIGhhdmUgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgY29uc3QgQ0lSQ1VMQVIgPSAnX19DSVJDVUxBUl9fJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICpcbiAqIFRoaXMgcmVuZGVyZXIgY2FuIGJlIG9uZSBvZiB0d28gdmFyaWV0aWVzIG9mIFJlbmRlcmVyMzpcbiAqXG4gKiAtIE9iamVjdGVkT3JpZW50ZWRSZW5kZXJlcjNcbiAqXG4gKiBUaGlzIGlzIHRoZSBuYXRpdmUgYnJvd3NlciBBUEkgc3R5bGUsIGUuZy4gb3BlcmF0aW9ucyBhcmUgbWV0aG9kcyBvbiBpbmRpdmlkdWFsIG9iamVjdHNcbiAqIGxpa2UgSFRNTEVsZW1lbnQuIFdpdGggdGhpcyBzdHlsZSwgbm8gYWRkaXRpb25hbCBjb2RlIGlzIG5lZWRlZCBhcyBhIGZhY2FkZSAocmVkdWNpbmcgcGF5bG9hZFxuICogc2l6ZSkuXG4gKlxuICogLSBQcm9jZWR1cmFsUmVuZGVyZXIzXG4gKlxuICogSW4gbm9uLW5hdGl2ZSBicm93c2VyIGVudmlyb25tZW50cyAoZS5nLiBwbGF0Zm9ybXMgc3VjaCBhcyB3ZWItd29ya2VycyksIHRoaXMgaXMgdGhlIGZhY2FkZVxuICogdGhhdCBlbmFibGVzIGVsZW1lbnQgbWFuaXB1bGF0aW9uLiBUaGlzIGFsc28gZmFjaWxpdGF0ZXMgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aFxuICogUmVuZGVyZXIyLlxuICovXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyMztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFJlbmRlcmVyKCk6IFJlbmRlcmVyMyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyO1xufVxuXG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXJGYWN0b3J5KCk6IFJlbmRlcmVyRmFjdG9yeTMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlckZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgcmV0dXJuIHZpZXdEYXRhICYmIHZpZXdEYXRhW1NBTklUSVpFUl07XG59XG5cbi8qKlxuICogU3RvcmUgdGhlIGVsZW1lbnQgZGVwdGggY291bnQuIFRoaXMgaXMgdXNlZCB0byBpZGVudGlmeSB0aGUgcm9vdCBlbGVtZW50cyBvZiB0aGUgdGVtcGxhdGVcbiAqIHNvIHRoYXQgd2UgY2FuIHRoYW4gYXR0YWNoIGBMVmlld0RhdGFgIHRvIG9ubHkgdGhvc2UgZWxlbWVudHMuXG4gKi9cbmxldCBlbGVtZW50RGVwdGhDb3VudCAhOiBudW1iZXI7XG5cbi8qKlxuICogUmV0dXJucyB0aGUgY3VycmVudCBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UuXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSByZXN0b3JlVmlldygpIGluc3RydWN0aW9uIHRvIHNhdmUgYSBzbmFwc2hvdFxuICogb2YgdGhlIGN1cnJlbnQgdmlldyBhbmQgcmVzdG9yZSBpdCB3aGVuIGxpc3RlbmVycyBhcmUgaW52b2tlZC4gVGhpcyBhbGxvd3NcbiAqIHdhbGtpbmcgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSBpbiBsaXN0ZW5lcnMgdG8gZ2V0IHZhcnMgZnJvbSBwYXJlbnQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50VmlldygpOiBPcGFxdWVWaWV3U3RhdGUge1xuICByZXR1cm4gdmlld0RhdGEgYXMgYW55IGFzIE9wYXF1ZVZpZXdTdGF0ZTtcbn1cblxuLyoqXG4gKiBSZXN0b3JlcyBgY29udGV4dFZpZXdEYXRhYCB0byB0aGUgZ2l2ZW4gT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICpcbiAqIEBwYXJhbSB2aWV3VG9SZXN0b3JlIFRoZSBPcGFxdWVWaWV3U3RhdGUgaW5zdGFuY2UgdG8gcmVzdG9yZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc3RvcmVWaWV3KHZpZXdUb1Jlc3RvcmU6IE9wYXF1ZVZpZXdTdGF0ZSkge1xuICBjb250ZXh0Vmlld0RhdGEgPSB2aWV3VG9SZXN0b3JlIGFzIGFueSBhcyBMVmlld0RhdGE7XG59XG5cbi8qKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQgYW5kIHRyYWNrIHF1ZXJ5IHJlc3VsdHMuICovXG5sZXQgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk6IExOb2RlfG51bGwge1xuICByZXR1cm4gcHJldmlvdXNPclBhcmVudFROb2RlID09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlID09PSB2aWV3RGF0YVtIT1NUX05PREVdID9cbiAgICAgIGdldEhvc3RFbGVtZW50Tm9kZSh2aWV3RGF0YSkgOlxuICAgICAgZ2V0TE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB2aWV3RGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTogVE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50VE5vZGU7XG59XG5cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50VE5vZGVgIHBvaW50cyB0byBhIHBhcmVudCBub2RlLlxuICogIC0gYGZhbHNlYDogdGhlbiBgcHJldmlvdXNPclBhcmVudFROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG4vKipcbiAqIFF1ZXJ5IGluc3RydWN0aW9ucyBjYW4gYXNrIGZvciBcImN1cnJlbnQgcXVlcmllc1wiIGluIDIgZGlmZmVyZW50IGNhc2VzOlxuICogLSB3aGVuIGNyZWF0aW5nIHZpZXcgcXVlcmllcyAoYXQgdGhlIHJvb3Qgb2YgYSBjb21wb25lbnQgdmlldywgYmVmb3JlIGFueSBub2RlIGlzIGNyZWF0ZWQgLSBpblxuICogdGhpcyBjYXNlIGN1cnJlbnRRdWVyaWVzIHBvaW50cyB0byB2aWV3IHF1ZXJpZXMpXG4gKiAtIHdoZW4gY3JlYXRpbmcgY29udGVudCBxdWVyaWVzIChpLmUuIHRoaXMgcHJldmlvdXNPclBhcmVudFROb2RlIHBvaW50cyB0byBhIG5vZGUgb24gd2hpY2ggd2VcbiAqIGNyZWF0ZSBjb250ZW50IHF1ZXJpZXMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllcyhcbiAgICBRdWVyeVR5cGU6IHtuZXcgKHBhcmVudDogbnVsbCwgc2hhbGxvdzogbnVsbCwgZGVlcDogbnVsbCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgLy8gaWYgdGhpcyBpcyB0aGUgZmlyc3QgY29udGVudCBxdWVyeSBvbiBhIG5vZGUsIGFueSBleGlzdGluZyBMUXVlcmllcyBuZWVkcyB0byBiZSBjbG9uZWRcbiAgLy8gaW4gc3Vic2VxdWVudCB0ZW1wbGF0ZSBwYXNzZXMsIHRoZSBjbG9uaW5nIG9jY3VycyBiZWZvcmUgZGlyZWN0aXZlIGluc3RhbnRpYXRpb24uXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlICE9PSB2aWV3RGF0YVtIT1NUX05PREVdICYmXG4gICAgICAhaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICBjdXJyZW50UXVlcmllcyAmJiAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gIH1cblxuICByZXR1cm4gY3VycmVudFF1ZXJpZXMgfHwgKGN1cnJlbnRRdWVyaWVzID0gbmV3IFF1ZXJ5VHlwZShudWxsLCBudWxsLCBudWxsKSk7XG59XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqL1xubGV0IGNyZWF0aW9uTW9kZTogYm9vbGVhbjtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldENyZWF0aW9uTW9kZSgpOiBib29sZWFuIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIFN0YXRlIG9mIHRoZSBjdXJyZW50IHZpZXcgYmVpbmcgcHJvY2Vzc2VkLlxuICpcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IHZpZXdEYXRhOiBMVmlld0RhdGE7XG5cbi8qKlxuICogSW50ZXJuYWwgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBjdXJyZW50IExWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBUaGUgZ2V0Q3VycmVudFZpZXcoKSBpbnN0cnVjdGlvbiBzaG91bGQgYmUgdXNlZCBmb3IgYW55dGhpbmcgcHVibGljLlxuICovXG5leHBvcnQgZnVuY3Rpb24gX2dldFZpZXdEYXRhKCk6IExWaWV3RGF0YSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdEYXRhO1xufVxuXG4vKipcbiAqIFRoZSBsYXN0IHZpZXdEYXRhIHJldHJpZXZlZCBieSBuZXh0Q29udGV4dCgpLlxuICogQWxsb3dzIGJ1aWxkaW5nIG5leHRDb250ZXh0KCkgYW5kIHJlZmVyZW5jZSgpIGNhbGxzLlxuICpcbiAqIGUuZy4gY29uc3QgaW5uZXIgPSB4KCkuJGltcGxpY2l0OyBjb25zdCBvdXRlciA9IHgoKS4kaW1wbGljaXQ7XG4gKi9cbmxldCBjb250ZXh0Vmlld0RhdGE6IExWaWV3RGF0YSA9IG51bGwgITtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlld0RhdGEpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gW10pO1xufVxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbi8qKlxuICogVGhlIHJvb3QgaW5kZXggZnJvbSB3aGljaCBwdXJlIGZ1bmN0aW9uIGluc3RydWN0aW9ucyBzaG91bGQgY2FsY3VsYXRlIHRoZWlyIGJpbmRpbmdcbiAqIGluZGljZXMuIEluIGNvbXBvbmVudCB2aWV3cywgdGhpcyBpcyBUVmlldy5iaW5kaW5nU3RhcnRJbmRleC4gSW4gYSBob3N0IGJpbmRpbmdcbiAqIGNvbnRleHQsIHRoaXMgaXMgdGhlIFRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCArIGFueSBob3N0VmFycyBiZWZvcmUgdGhlIGdpdmVuIGRpci5cbiAqL1xubGV0IGJpbmRpbmdSb290SW5kZXg6IG51bWJlciA9IC0xO1xuXG4vLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG5leHBvcnQgZnVuY3Rpb24gZ2V0QmluZGluZ1Jvb3QoKSB7XG4gIHJldHVybiBiaW5kaW5nUm9vdEluZGV4O1xufVxuXG5jb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFN3YXAgdGhlIGN1cnJlbnQgc3RhdGUgd2l0aCBhIG5ldyBzdGF0ZS5cbiAqXG4gKiBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyB3ZSBzdG9yZSB0aGUgc3RhdGUgaW4gdGhlIHRvcCBsZXZlbCBvZiB0aGUgbW9kdWxlLlxuICogVGhpcyB3YXkgd2UgbWluaW1pemUgdGhlIG51bWJlciBvZiBwcm9wZXJ0aWVzIHRvIHJlYWQuIFdoZW5ldmVyIGEgbmV3IHZpZXdcbiAqIGlzIGVudGVyZWQgd2UgaGF2ZSB0byBzdG9yZSB0aGUgc3RhdGUgZm9yIGxhdGVyLCBhbmQgd2hlbiB0aGUgdmlldyBpc1xuICogZXhpdGVkIHRoZSBzdGF0ZSBoYXMgdG8gYmUgcmVzdG9yZWRcbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGhvc3QgRWxlbWVudCB0byB3aGljaCB0aGUgVmlldyBpcyBhIGNoaWxkIG9mXG4gKiBAcmV0dXJucyB0aGUgcHJldmlvdXMgc3RhdGU7XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbnRlclZpZXcoXG4gICAgbmV3VmlldzogTFZpZXdEYXRhLCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRWaWV3Tm9kZSB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBvbGRWaWV3OiBMVmlld0RhdGEgPSB2aWV3RGF0YTtcbiAgZGlyZWN0aXZlcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tESVJFQ1RJVkVTXTtcbiAgdFZpZXcgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbVFZJRVddO1xuXG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUpID09PSBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgZmlyc3RUZW1wbGF0ZVBhc3MgPSBuZXdWaWV3ICYmIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICBiaW5kaW5nUm9vdEluZGV4ID0gbmV3VmlldyAmJiB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUkVOREVSRVJdO1xuXG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGhvc3RUTm9kZSAhO1xuICBpc1BhcmVudCA9IHRydWU7XG5cbiAgdmlld0RhdGEgPSBjb250ZXh0Vmlld0RhdGEgPSBuZXdWaWV3O1xuICBvbGRWaWV3ICYmIChvbGRWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMpO1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tRVUVSSUVTXTtcblxuICByZXR1cm4gb2xkVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBjcmVhdGlvbk9ubHkgQW4gb3B0aW9uYWwgYm9vbGVhbiB0byBpbmRpY2F0ZSB0aGF0IHRoZSB2aWV3IHdhcyBwcm9jZXNzZWQgaW4gY3JlYXRpb24gbW9kZVxuICogb25seSwgaS5lLiB0aGUgZmlyc3QgdXBkYXRlIHdpbGwgYmUgZG9uZSBsYXRlci4gT25seSBwb3NzaWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgdmlld0RhdGFbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICB2aWV3RGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIHRoZSB2aWV3LCBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBzdGVwcyBpbiB0aGF0IG9yZGVyOlxuICogdHJpZ2dlcnMgaW5pdCBob29rcywgcmVmcmVzaGVzIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MsIHRyaWdnZXJzIGNvbnRlbnQgaG9va3MsIHNldHMgaG9zdFxuICogYmluZGluZ3MsIHJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzLlxuICogTm90ZTogdmlldyBob29rcyBhcmUgdHJpZ2dlcmVkIGxhdGVyIHdoZW4gbGVhdmluZyB0aGUgdmlldy5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpIHtcbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3Modmlld0RhdGEpO1xuXG4gIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuXG4gIHNldEhvc3RCaW5kaW5ncyh0Vmlldy5ob3N0QmluZGluZ3MpO1xuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyhiaW5kaW5nczogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChiaW5kaW5ncyAhPSBudWxsKSB7XG4gICAgYmluZGluZ1Jvb3RJbmRleCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuaG9zdEJpbmRpbmdTdGFydEluZGV4O1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlySW5kZXggPSBiaW5kaW5nc1tpXTtcbiAgICAgIGNvbnN0IGRlZiA9IGRlZnNbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICEoZGlySW5kZXgsIGJpbmRpbmdzW2kgKyAxXSk7XG4gICAgICBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4ICsgZGVmLmhvc3RWYXJzO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNvbnRlbnQgcXVlcmllcyBmb3IgYWxsIGRpcmVjdGl2ZXMgaW4gdGhlIGdpdmVuIHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kaXJlY3RpdmVzICFbZGlyZWN0aXZlRGVmSWR4XTtcblxuICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCAhKGRpcmVjdGl2ZURlZklkeCwgdFZpZXcuY29udGVudFF1ZXJpZXNbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGNvbXBvbmVudHM6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoY29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKGNvbXBvbmVudHNbaV0pO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTogdm9pZCB7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXdEYXRhPFQ+KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlld0RhdGEge1xuICBjb25zdCBpbnN0YW5jZSA9IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3RGF0YTtcbiAgaW5zdGFuY2VbUEFSRU5UXSA9IHZpZXdEYXRhO1xuICBpbnN0YW5jZVtGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuUnVuSW5pdDtcbiAgaW5zdGFuY2VbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBpbnN0YW5jZVtJTkpFQ1RPUl0gPSB2aWV3RGF0YSA/IHZpZXdEYXRhW0lOSkVDVE9SXSA6IG51bGw7XG4gIGluc3RhbmNlW1JFTkRFUkVSXSA9IHJlbmRlcmVyO1xuICBpbnN0YW5jZVtTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IG51bGw7XG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuLyoqXG4gKiBDcmVhdGlvbiBvZiBMTm9kZSBvYmplY3QgaXMgZXh0cmFjdGVkIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gd2UgYWx3YXlzIGNyZWF0ZSBMTm9kZSBvYmplY3RcbiAqIHdpdGggdGhlIHNhbWUgc2hhcGVcbiAqIChzYW1lIHByb3BlcnRpZXMgYXNzaWduZWQgaW4gdGhlIHNhbWUgb3JkZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBub2RlSW5qZWN0b3I6IExJbmplY3RvciB8IG51bGwsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCxcbiAgICBzdGF0ZTogYW55KTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgcmV0dXJuIHtcbiAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksXG4gICAgbm9kZUluamVjdG9yOiBub2RlSW5qZWN0b3IsXG4gICAgZGF0YTogc3RhdGUsXG4gICAgZHluYW1pY0xDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogQSBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHRoZSBMTm9kZSB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlbSBoYXZlIHNhbWUgc2hhcGUgdG9cbiAqIGtlZXAgdGhlIGV4ZWN1dGlvbiBjb2RlIG1vbm9tb3JwaGljIGFuZCBmYXN0LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIExOb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIExOb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgTE5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gZGF0YSBBbnkgZGF0YSB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiB0aGUgTE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGxWaWV3RGF0YT86IExWaWV3RGF0YSB8IG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlZpZXcsIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IG51bGwsXG4gICAgbFZpZXdEYXRhOiBMVmlld0RhdGEpOiBUVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBsUHJvamVjdGlvbjogbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBkYXRhOiBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIHN0YXRlPzogbnVsbCB8IExWaWV3RGF0YSB8IExDb250YWluZXIpOiBURWxlbWVudE5vZGUmVFZpZXdOb2RlJlxuICAgIFRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUge1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcblxuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiB2aWV3RGF0YSAmJiBwYXJlbnQgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIGNvbnN0IHRQYXJlbnQgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcblxuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlT2JqZWN0KHR5cGUsIG51bGwsIG5hdGl2ZSwgaXNTdGF0ZSA/IHN0YXRlIGFzIGFueSA6IG51bGwpO1xuICBsZXQgdE5vZGU6IFROb2RlO1xuXG4gIGlmIChpbmRleCA9PT0gLTEgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgICB0Tm9kZSA9IChzdGF0ZSA/IChzdGF0ZSBhcyBMVmlld0RhdGEpW1RWSUVXXS5ub2RlIDogbnVsbCkgfHxcbiAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgaW5kZXgsIG51bGwsIG51bGwsIHRQYXJlbnQsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCB2aWV3RGF0YS5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgd2l0aCBudWxsYCk7XG5cbiAgICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IG5vZGU7XG5cbiAgICBpZiAodERhdGFbYWRqdXN0ZWRJbmRleF0gPT0gbnVsbCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMsIHRQYXJlbnQsIG51bGwpO1xuICAgICAgaWYgKCFpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgICAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSlcbiAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGU7XG4gICAgaWYgKCF0Vmlldy5maXJzdENoaWxkICYmIHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gICAgfVxuXG4gICAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgICAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmIHBhcmVudEluU2FtZVZpZXcgfHxcbiAgICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIC8vIFRPRE86IHRlbXBvcmFyeSwgcmVtb3ZlIHRoaXMgd2hlbiByZW1vdmluZyBub2RlSW5qZWN0b3IgKGJyaW5naW5nIGluIGZucyB0byBoZWxsbyB3b3JsZClcbiAgaWYgKGluZGV4ICE9PSAtMSAmJiAhKHZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGNvbnN0IHBhcmVudExOb2RlOiBMTm9kZXxudWxsID0gdHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgICBnZXRDb250YWluZXJOb2RlKHROb2RlLCBzdGF0ZSBhcyBMVmlld0RhdGEpIDpcbiAgICAgICAgZ2V0UGFyZW50T3JDb250YWluZXJOb2RlKHROb2RlLCB2aWV3RGF0YSk7XG4gICAgcGFyZW50TE5vZGUgJiYgKG5vZGUubm9kZUluamVjdG9yID0gcGFyZW50TE5vZGUubm9kZUluamVjdG9yKTtcbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIGRvIG5vdCBzYXZlIGhvc3QgVE5vZGVzKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICBjb25zdCBsVmlld0RhdGEgPSBzdGF0ZSBhcyBMVmlld0RhdGE7XG4gICAgbmdEZXZNb2RlICYmXG4gICAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0sIG51bGwsICdsVmlld0RhdGFbSE9TVF9OT0RFXSBzaG91bGQgbm90IGhhdmUgYmVlbiBpbml0aWFsaXplZCcpO1xuICAgIGxWaWV3RGF0YVtIT1NUX05PREVdID0gdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVFZpZXdOb2RlO1xuICAgIGlmIChsVmlld0RhdGFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICBsVmlld0RhdGFbVFZJRVddLm5vZGUgPSB0Tm9kZSBhcyBUVmlld05vZGUgfCBURWxlbWVudE5vZGU7XG4gICAgfVxuICB9XG5cbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gdE5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBXaGVuIExOb2RlcyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkanVzdEJsdWVwcmludEZvck5ld05vZGUodmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCsrO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgIHZpZXcucHVzaChudWxsKTtcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXRDb21wb25lbnRTdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuICBlbGVtZW50RGVwdGhDb3VudCA9IDA7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgICByZW5kZXJlckZhY3RvcnkgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTtcbiAgICByZW5kZXJlciA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYSByb290IHZpZXcgc28gaXQncyBwb3NzaWJsZSB0byBsb29rIHVwIHRoZSBob3N0IGVsZW1lbnQgdGhyb3VnaCBpdHMgaW5kZXhcbiAgICB0VmlldyA9IGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB2aWV3RGF0YSA9IGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIHt9LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3QpO1xuXG4gICAgY29uc3QgY29tcG9uZW50VFZpZXcgPVxuICAgICAgICBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlRm4sIGNvbnN0cywgdmFycywgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsLCBudWxsKTtcbiAgICBjb25zdCBjb21wb25lbnRMVmlldyA9XG4gICAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgY29tcG9uZW50VFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcik7XG4gICAgY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLCBjb21wb25lbnRMVmlldyk7XG4gICAgaG9zdCA9IGxvYWRFbGVtZW50KDApO1xuICB9XG4gIGNvbnN0IGhvc3RWaWV3ID0gaG9zdC5kYXRhICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RWaWV3LCAnSG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3IGRlZmluZWQgaW4gaG9zdC5kYXRhLicpO1xuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZUZuKTtcblxuICByZXR1cm4gaG9zdDtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3RGF0YSwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBxdWVyaWVzPzogTFF1ZXJpZXMgfCBudWxsKTogTFZpZXdEYXRhIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gbnVsbCAhO1xuXG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjcmVhdGVOb2RlQXRJbmRleCgtMSwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIGxWaWV3KTtcblxuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgcHJldmlvdXNPclBhcmVudFROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3VG9SZW5kZXI6IExWaWV3RGF0YSwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCByZjogUmVuZGVyRmxhZ3MpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlld0RhdGE7XG4gIGlmICh2aWV3VG9SZW5kZXJbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KHZpZXdUb1JlbmRlcltDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IG51bGwgITtcblxuICAgICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltIT1NUX05PREVdKTtcbiAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgIHRWaWV3LnRlbXBsYXRlICEocmYsIGNvbnRleHQpO1xuICAgICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gICAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZpZXdUb1JlbmRlcltUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlIGluIGZhY3QsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAgIC8vIHVwZGF0ZS4gV2hlbiBmb3IgY3JlYXRpb24gb25seSwgbGVhdmVWaWV3KCkgbXVzdCBub3QgdHJpZ2dlciB2aWV3IGhvb2tzLCBub3IgY2xlYW4gZmxhZ3MuXG4gICAgICBjb25zdCBpc0NyZWF0aW9uT25seSA9IChyZiAmIFJlbmRlckZsYWdzLkNyZWF0ZSkgPT09IFJlbmRlckZsYWdzLkNyZWF0ZTtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICAgIGlzUGFyZW50ID0gX2lzUGFyZW50O1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gX3ByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjb250ZXh0IGF0IHRoZSBsZXZlbCBzcGVjaWZpZWQgYW5kIHNhdmVzIGl0IGFzIHRoZSBnbG9iYWwsIGNvbnRleHRWaWV3RGF0YS5cbiAqIFdpbGwgZ2V0IHRoZSBuZXh0IGxldmVsIHVwIGlmIGxldmVsIGlzIG5vdCBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIHNhdmUgY29udGV4dHMgb2YgcGFyZW50IHZpZXdzIHNvIHRoZXkgY2FuIGJlIGJvdW5kIGluIGVtYmVkZGVkIHZpZXdzLCBvclxuICogaW4gY29uanVuY3Rpb24gd2l0aCByZWZlcmVuY2UoKSB0byBiaW5kIGEgcmVmIGZyb20gYSBwYXJlbnQgdmlldy5cbiAqXG4gKiBAcGFyYW0gbGV2ZWwgVGhlIHJlbGF0aXZlIGxldmVsIG9mIHRoZSB2aWV3IGZyb20gd2hpY2ggdG8gZ3JhYiBjb250ZXh0IGNvbXBhcmVkIHRvIGNvbnRleHRWZXdEYXRhXG4gKiBAcmV0dXJucyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICBjb250ZXh0Vmlld0RhdGEgPSB3YWxrVXBWaWV3cyhsZXZlbCwgY29udGV4dFZpZXdEYXRhICEpO1xuICByZXR1cm4gY29udGV4dFZpZXdEYXRhW0NPTlRFWFRdIGFzIFQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudE9yQ29udGV4dDogVCwgdGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudE9yQ29udGV4dCAhKTtcbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTtcblxuICAgICAgLy8gRWxlbWVudCB3YXMgc3RvcmVkIGF0IDAgaW4gZGF0YSBhbmQgZGlyZWN0aXZlIHdhcyBzdG9yZWQgYXQgMCBpbiBkaXJlY3RpdmVzXG4gICAgICAvLyBpbiByZW5kZXJDb21wb25lbnQoKVxuICAgICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKEhFQURFUl9PRkZTRVQpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiBvZiByZW5kZXJpbmcgZmxhZ3MgZGVwZW5kaW5nIG9uIHdoZW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBpbiBjcmVhdGlvbiBtb2RlIG9yIHVwZGF0ZSBtb2RlLiBCeSBkZWZhdWx0LCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1biB3aXRoIHRoZVxuICogY3JlYXRpb24gYmxvY2sgd2hlbiB0aGUgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlLiBPdGhlcndpc2UsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuXG4gKiBhbG9uZS5cbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIGRvIE5PVCB1c2UgdGhpcyBjb25maWd1cmF0aW9uICh1cGRhdGUgYmxvY2sgYW5kIGNyZWF0ZSBibG9jayBhcmVcbiAqIGFsd2F5cyBydW4gc2VwYXJhdGVseSkuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlckZsYWdzKHZpZXc6IExWaWV3RGF0YSk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gTmFtZXNwYWNlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGVsZW1lbnQgdXNpbmcge0BsaW5rIGVsZW1lbnRTdGFydH0gYW5kIHtAbGluayBlbGVtZW50RW5kfVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIGVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbG9naWNhbCBjb250YWluZXIgZm9yIG90aGVyIG5vZGVzICg8bmctY29udGFpbmVyPikgYmFja2VkIGJ5IGEgY29tbWVudCBub2RlIGluIHRoZSBET00uXG4gKiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudENvbnRhaW5lckVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gYXR0cnMgU2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgdXNlZCB3aGVuIG1hdGNoaW5nIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBFdmVuIGlmIHRoaXMgaW5zdHJ1Y3Rpb24gYWNjZXB0cyBhIHNldCBvZiBhdHRyaWJ1dGVzIG5vIGFjdHVhbCBhdHRyaWJ1dGUgdmFsdWVzIGFyZSBwcm9wYWdhdGVkIHRvXG4gKiB0aGUgRE9NIChhcyBhIGNvbW1lbnQgbm9kZSBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMpLiBBdHRyaWJ1dGVzIGFyZSBoZXJlIG9ubHkgZm9yIGRpcmVjdGl2ZVxuICogbWF0Y2hpbmcgcHVycG9zZXMgYW5kIHNldHRpbmcgaW5pdGlhbCBpbnB1dHMgb2YgZGlyZWN0aXZlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnQgY29udGFpbmVycyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnbmctY29udGFpbmVyJyA6ICcnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcbiAgY29uc3QgdE5vZGUgPVxuICAgICAgY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmUsIG51bGwsIGF0dHJzIHx8IG51bGwsIG51bGwpO1xuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIGN1cnJlbnRRdWVyaWVzICYmXG4gICAgICAoY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudENvbnRhaW5lck5vZGUpKTtcblxuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncywgdFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlICEsIG5hbWUsIGF0dHJzIHx8IG51bGwsIG51bGwpO1xuXG4gIGlmIChhdHRycykge1xuICAgIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgfVxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCB2aWV3RGF0YSk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMobG9jYWxSZWZzKTtcblxuICAvLyBhbnkgaW1tZWRpYXRlIGNoaWxkcmVuIG9mIGEgY29tcG9uZW50IG9yIHRlbXBsYXRlIGNvbnRhaW5lciBtdXN0IGJlIHByZS1lbXB0aXZlbHlcbiAgLy8gbW9ua2V5LXBhdGNoZWQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXcgZGF0YSBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZSBpbnNwZWN0ZWRcbiAgLy8gbGF0ZXIgb24gdXNpbmcgYW55IGVsZW1lbnQgZGlzY292ZXJ5IHV0aWxpdHkgbWV0aG9kcyAoc2VlIGBlbGVtZW50X2Rpc2NvdmVyeS50c2ApXG4gIGlmIChlbGVtZW50RGVwdGhDb3VudCA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHZpZXdEYXRhKTtcbiAgfVxuICBlbGVtZW50RGVwdGhDb3VudCsrO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IHJlbmRlcmVyO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuZnVuY3Rpb24gbmF0aXZlTm9kZUxvY2FsUmVmRXh0cmFjdG9yKHROb2RlOiBUTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IFJOb2RlIHtcbiAgcmV0dXJuIGdldExOb2RlKHROb2RlLCBjdXJyZW50VmlldykubmF0aXZlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcyBhbmQgcG9wdWxhdGVzIGxvY2FsIHJlZnMuXG4gKlxuICogQHBhcmFtIGxOb2RlIExOb2RlIGZvciB3aGljaCBkaXJlY3RpdmUgYW5kIGxvY2FscyBzaG91bGQgYmUgY3JlYXRlZFxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBub2RlIGluIHF1ZXN0aW9uXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgbWFwcGluZyBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGxvY2FsIHJlZiB2YWx1ZSBmcm9tIExOb2RlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yID0gbmF0aXZlTm9kZUxvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmlyc3RUZW1wbGF0ZVBhc3MrKztcbiAgICBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCB0VmlldywgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCk7XG4gIH1cbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxvY2FsUmVmRXh0cmFjdG9yKTtcbn1cblxuLyoqXG4gKiBPbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB3ZSBtYXRjaCBlYWNoIG5vZGUgYWdhaW5zdCBhdmFpbGFibGUgZGlyZWN0aXZlIHNlbGVjdG9ycyBhbmQgc2F2ZVxuICogdGhlIHJlc3VsdGluZyBkZWZzIGluIHRoZSBjb3JyZWN0IGluc3RhbnRpYXRpb24gb3JkZXIgZm9yIHN1YnNlcXVlbnQgY2hhbmdlIGRldGVjdGlvbiBydW5zXG4gKiAoc28gZGVwZW5kZW5jaWVzIGFyZSBhbHdheXMgY3JlYXRlZCBiZWZvcmUgdGhlIGRpcmVjdGl2ZXMgdGhhdCBpbmplY3QgdGhlbSkuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHRWaWV3OiBUVmlldywgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG4gIGNvbnN0IG1hdGNoZXMgPSB0Vmlldy5jdXJyZW50TWF0Y2hlcyA9IGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlKTtcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSBpICsgMTtcbiAgICAgIHJlc29sdmVEaXJlY3RpdmUoZGVmLCB2YWx1ZUluZGV4LCBtYXRjaGVzLCB0Vmlldyk7XG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKG1hdGNoZXNbdmFsdWVJbmRleF0gYXMgbnVtYmVyLCBkZWYsIGV4cG9ydHNNYXApO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy4gKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlOiBUTm9kZSk6IEN1cnJlbnRNYXRjaGVzTGlzdHxudWxsIHtcbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXTtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyAhKSkge1xuICAgICAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgICAgICAobWF0Y2hlcyB8fCAobWF0Y2hlcyA9IFtdKSkucHVzaChkZWYsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyBhcyBDdXJyZW50TWF0Y2hlc0xpc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PiwgdmFsdWVJbmRleDogbnVtYmVyLCBtYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3QsXG4gICAgdFZpZXc6IFRWaWV3KTogYW55IHtcbiAgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IG51bGwpIHtcbiAgICBtYXRjaGVzW3ZhbHVlSW5kZXhdID0gQ0lSQ1VMQVI7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSgpO1xuICAgICh0Vmlldy5kaXJlY3RpdmVzIHx8ICh0Vmlldy5kaXJlY3RpdmVzID0gW10pKS5wdXNoKGRlZik7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUNyZWF0ZShtYXRjaGVzW3ZhbHVlSW5kZXhdID0gdFZpZXcuZGlyZWN0aXZlcyAhLmxlbmd0aCAtIDEsIGluc3RhbmNlLCBkZWYpO1xuICB9IGVsc2UgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IENJUkNVTEFSKSB7XG4gICAgLy8gSWYgd2UgcmV2aXNpdCB0aGlzIGRpcmVjdGl2ZSBiZWZvcmUgaXQncyByZXNvbHZlZCwgd2Uga25vdyBpdCdzIGNpcmN1bGFyXG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmLnR5cGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjaygpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5leHBvcnQgZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIsIGhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgLy8gTXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbnMgYXJlIGdlbmVyYXRlZCB3aXRoXG4gIC8vIGluc3RydWN0aW9ucyB0aGF0IGV4cGVjdCBlbGVtZW50IGluZGljZXMgdGhhdCBhcmUgTk9UIGFkanVzdGVkIChlLmcuIGVsZW1lbnRQcm9wZXJ0eSkuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0VmFyczsgaSsrKSB7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB2aWV3RGF0YS5wdXNoKE5PX0NIQU5HRSk7XG4gIH1cbiAgKHRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAodFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xufVxuXG4vKiogU2V0cyB0aGUgY29udGV4dCBmb3IgYSBDaGFuZ2VEZXRlY3RvclJlZiB0byB0aGUgZ2l2ZW4gaW5zdGFuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhcbiAgICBpbmplY3RvcjogTEluamVjdG9yIHwgbnVsbCwgaW5zdGFuY2U6IGFueSwgdmlldzogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGlmIChpbmplY3RvciAmJiBpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiAhPSBudWxsKSB7XG4gICAgKGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdSZWY8YW55PikuX3NldENvbXBvbmVudENvbnRleHQodmlldywgaW5zdGFuY2UpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpbnN0YW50aWF0ZXMgdGhlIGdpdmVuIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZmlyc3RUZW1wbGF0ZVBhc3MsIGZhbHNlLFxuICAgICAgICAgICAgICAgICAgIGBEaXJlY3RpdmVzIHNob3VsZCBvbmx5IGJlIGluc3RhbnRpYXRlZCBkaXJlY3RseSBhZnRlciBmaXJzdCB0ZW1wbGF0ZSBwYXNzYCk7XG4gIGNvbnN0IGNvdW50ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdChwcmV2aW91c09yUGFyZW50VE5vZGUpICYmIGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgY3VycmVudFF1ZXJpZXMgPSBjdXJyZW50UXVlcmllcy5jbG9uZSgpO1xuICB9XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgdERpcmVjdGl2ZXMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+ID0gdERpcmVjdGl2ZXNbaV07XG4gICAgICBkaXJlY3RpdmVDcmVhdGUoaSwgZGVmLmZhY3RvcnkoKSwgZGVmKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT58IENvbXBvbmVudERlZkludGVybmFsPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNdID0gaW5kZXg7XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlld0RhdGEgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3Rvcik6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gcHJldmlvdXNPclBhcmVudFROb2RlLmxvY2FsTmFtZXM7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGxldCBsb2NhbEluZGV4ID0gcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgPyBsb2NhbFJlZkV4dHJhY3Rvcih0Tm9kZSwgdmlld0RhdGEpIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgYW5kIHB1cmUgZnVuY3Rpb24gYmluZGluZ3MgaW4gdGhpcyB2aWV3XG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgPVxuICAgICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGNvbnN0cztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXXSA9IHtcbiAgICBpZDogdmlld0luZGV4LFxuICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBIRUFERVJfRklMTEVSLnNsaWNlKCksICAvLyBGaWxsIGluIHRvIG1hdGNoIEhFQURFUl9PRkZTRVQgaW4gTFZpZXdEYXRhXG4gICAgY2hpbGRJbmRleDogLTEsICAgICAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGhvc3RCaW5kaW5nU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICBpbml0SG9va3M6IG51bGwsXG4gICAgY2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBwaXBlRGVzdHJveUhvb2tzOiBudWxsLFxuICAgIGNsZWFudXA6IG51bGwsXG4gICAgaG9zdEJpbmRpbmdzOiBudWxsLFxuICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBjdXJyZW50TWF0Y2hlczogbnVsbCxcbiAgICBmaXJzdENoaWxkOiBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlld0RhdGEge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZXcgQXJyYXkoaW5pdGlhbFZpZXdMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChudWxsLCAwLCBiaW5kaW5nU3RhcnRJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKE5PX0NIQU5HRSwgYmluZGluZ1N0YXJ0SW5kZXgpIGFzIExWaWV3RGF0YTtcbiAgYmx1ZXByaW50W0NPTlRBSU5FUl9JTkRFWF0gPSAtMTtcbiAgYmx1ZXByaW50W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJldHVybiBibHVlcHJpbnQ7XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogVEF0dHJpYnV0ZXMpOiB2b2lkIHtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgICAwLCBUTm9kZVR5cGUuRWxlbWVudCwgck5vZGUsIG51bGwsIG51bGwsXG4gICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSksXG4gICAgICAgICAgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgdFZpZXcuZGlyZWN0aXZlcyA9IFtkZWZdO1xuICB9XG4gIHJldHVybiB2aWV3RGF0YVtIRUFERVJfT0ZGU0VUXTtcbn1cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuXG4gIC8vIGFkZCBuYXRpdmUgZXZlbnQgbGlzdGVuZXIgLSBhcHBsaWNhYmxlIHRvIGVsZW1lbnRzIG9ubHlcbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgY29uc3Qgbm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obm9kZS5uYXRpdmUsIGV2ZW50TmFtZSwgbGlzdGVuZXJGbik7XG4gICAgICBzdG9yZUNsZWFudXBGbih2aWV3RGF0YSwgY2xlYW51cEZuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm4pO1xuICAgICAgbm9kZS5uYXRpdmUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgICBjb25zdCBjbGVhbnVwSW5zdGFuY2VzID0gZ2V0Q2xlYW51cCh2aWV3RGF0YSk7XG4gICAgICBjbGVhbnVwSW5zdGFuY2VzLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBnZXRUVmlld0NsZWFudXAodmlld0RhdGEpLnB1c2goXG4gICAgICAgICAgICBldmVudE5hbWUsIHROb2RlLmluZGV4LCBjbGVhbnVwSW5zdGFuY2VzICEubGVuZ3RoIC0gMSwgdXNlQ2FwdHVyZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gc3Vic2NyaWJlIHRvIGRpcmVjdGl2ZSBvdXRwdXRzXG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gdmlld0RhdGE7XG4gIGdldENsZWFudXAodmlldykucHVzaChjb250ZXh0KTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4sIHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlld0RhdGEsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY3VycmVudFF1ZXJpZXMgJiZcbiAgICAgIChjdXJyZW50UXVlcmllcyA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSkpO1xuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MocHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIGVsZW1lbnREZXB0aENvdW50LS07XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50ID0gbG9hZEVsZW1lbnQoaW5kZXgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPSBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBwcm9wZXJ0eSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIElmIHRoZSBwcm9wZXJ0eSBuYW1lIGFsc28gZXhpc3RzIGFzIGFuIGlucHV0IHByb3BlcnR5IG9uIG9uZSBvZiB0aGUgZWxlbWVudCdzIGRpcmVjdGl2ZXMsXG4gKiB0aGUgY29tcG9uZW50IHByb3BlcnR5IHdpbGwgYmUgc2V0IGluc3RlYWQgb2YgdGhlIGVsZW1lbnQgcHJvcGVydHkuIFRoaXMgY2hlY2sgbXVzdFxuICogYmUgY29uZHVjdGVkIGF0IHJ1bnRpbWUgc28gY2hpbGQgY29tcG9uZW50cyB0aGF0IGFkZCBuZXcgQElucHV0cyBkb24ndCBoYXZlIHRvIGJlIHJlLWNvbXBpbGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IG5vZGUgPSBsb2FkRWxlbWVudChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4KTtcbiAgLy8gaWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZFxuICBpZiAodE5vZGUgJiYgdE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgdE5vZGUuaW5wdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXModE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsXG4gICAgcGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsLFxuICAgIGRldGFjaGVkOiBudWxsLFxuICAgIHN0eWxpbmdUZW1wbGF0ZTogbnVsbCxcbiAgICBwcm9qZWN0aW9uOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHN0eWxpbmdJbmRleCwgdmFsdWUgPyB0cnVlIDogZmFsc2UpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBhbnkgaW5saW5lIHN0eWxlIHZhbHVlcyB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBkdXJpbmcgY3JlYXRpb24gbW9kZSB0byBhcHBseSBhbGwgc3R5bGluZ1xuICogKGUuZy4gYHN0eWxlPVwiLi4uXCJgKSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQuIFRoaXMgaXMgYWxzbyB3aGVyZSB0aGUgcHJvdmlkZWQgaW5kZXhcbiAqIHZhbHVlIGlzIGFsbG9jYXRlZCBmb3IgdGhlIHN0eWxpbmcgZGV0YWlscyBmb3IgaXRzIGNvcnJlc3BvbmRpbmcgZWxlbWVudCAodGhlIGVsZW1lbnRcbiAqIGluZGV4IGlzIHRoZSBwcmV2aW91cyBpbmRleCB2YWx1ZSBmcm9tIHRoaXMgb25lKS5cbiAqXG4gKiAoTm90ZSB0aGlzIGZ1bmN0aW9uIGNhbGxzIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpbW1lZGlhdGVseSB3aGVuIGNhbGxlZC4pXG4gKlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCB2YWx1ZSB3aGljaCB3aWxsIGJlIGFsbG9jYXRlZCB0byBzdG9yZSBzdHlsaW5nIGRhdGEgZm9yIHRoZSBlbGVtZW50LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIGNsYXNzRGVjbGFyYXRpb25zIEEga2V5L3ZhbHVlIGFycmF5IG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSByZWdpc3RlcmVkIG9uIHRoZSBlbGVtZW50LlxuICogICBFYWNoIGluZGl2aWR1YWwgc3R5bGUgd2lsbCBiZSB1c2VkIG9uIHRoZSBlbGVtZW50IGFzIGxvbmcgYXMgaXQgaXMgbm90IG92ZXJyaWRkZW5cbiAqICAgYnkgYW55IGNsYXNzZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW2NsYXNzXWApIG9yIHNpbmd1bGFyIChgW2NsYXNzLm5hbWVkXWApXG4gKiAgIGJpbmRpbmdzLiBJZiBhIGNsYXNzIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gYSBmYWxzeSB2YWx1ZSB0aGVuIHRoZSBtYXRjaGluZyBpbml0aWFsXG4gKiAgIGNsYXNzIHZhbHVlIHRoYXQgYXJlIHBhc3NlZCBpbiBoZXJlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaWYgbWF0Y2hlZCkuXG4gKiBAcGFyYW0gc3R5bGVEZWNsYXJhdGlvbnMgQSBrZXkvdmFsdWUgYXJyYXkgb2YgQ1NTIHN0eWxlcyB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZWxlbWVudC5cbiAqICAgRWFjaCBpbmRpdmlkdWFsIHN0eWxlIHdpbGwgYmUgdXNlZCBvbiB0aGUgZWxlbWVudCBhcyBsb25nIGFzIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gKiAgIGJ5IGFueSBzdHlsZXMgcGxhY2VkIG9uIHRoZSBlbGVtZW50IGJ5IG11bHRpcGxlIChgW3N0eWxlXWApIG9yIHNpbmd1bGFyIChgW3N0eWxlLnByb3BdYClcbiAqICAgYmluZGluZ3MuIElmIGEgc3R5bGUgYmluZGluZyBjaGFuZ2VzIGl0cyB2YWx1ZSB0byBudWxsIHRoZW4gdGhlIGluaXRpYWwgc3R5bGluZ1xuICogICB2YWx1ZXMgdGhhdCBhcmUgcGFzc2VkIGluIGhlcmUgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChpZiBtYXRjaGVkKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgKGlmIHByb3ZpZGVkKVxuICogICB0byBzYW5pdGl6ZSB0aGUgYW55IENTUyBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZzxUPihcbiAgICBjbGFzc0RlY2xhcmF0aW9ucz86IChzdHJpbmcgfCBib29sZWFuIHwgSW5pdGlhbFN0eWxpbmdGbGFncylbXSB8IG51bGwsXG4gICAgc3R5bGVEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlU2FuaXRpemVyPzogU3R5bGVTYW5pdGl6ZUZuIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICAvLyBpbml0aWFsaXplIHRoZSBzdHlsaW5nIHRlbXBsYXRlLlxuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9XG4gICAgICAgIGNyZWF0ZVN0eWxpbmdDb250ZXh0VGVtcGxhdGUoY2xhc3NEZWNsYXJhdGlvbnMsIHN0eWxlRGVjbGFyYXRpb25zLCBzdHlsZVNhbml0aXplcik7XG4gIH1cbiAgaWYgKHN0eWxlRGVjbGFyYXRpb25zICYmIHN0eWxlRGVjbGFyYXRpb25zLmxlbmd0aCB8fFxuICAgICAgY2xhc3NEZWNsYXJhdGlvbnMgJiYgY2xhc3NEZWNsYXJhdGlvbnMubGVuZ3RoKSB7XG4gICAgZWxlbWVudFN0eWxpbmdBcHBseSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIGBTdHlsaW5nQ29udGV4dGAgYXQgYSBnaXZlbiBpbmRleC5cbiAqXG4gKiBUaGlzIG1ldGhvZCBsYXppbHkgY3JlYXRlcyB0aGUgYFN0eWxpbmdDb250ZXh0YC4gVGhpcyBpcyBiZWNhdXNlIGluIG1vc3QgY2FzZXNcbiAqIHdlIGhhdmUgc3R5bGluZyB3aXRob3V0IGFueSBiaW5kaW5ncy4gQ3JlYXRpbmcgYFN0eWxpbmdDb250ZXh0YCBlYWdlcmx5IHdvdWxkIG1lYW4gdGhhdFxuICogZXZlcnkgc3R5bGUgZGVjbGFyYXRpb24gc3VjaCBhcyBgPGRpdiBzdHlsZT1cImNvbG9yOiByZWRcIj5gIHdvdWxkIHJlc3VsdCBgU3R5bGVDb250ZXh0YFxuICogd2hpY2ggd291bGQgY3JlYXRlIHVubmVjZXNzYXJ5IG1lbW9yeSBwcmVzc3VyZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIGFsbG9jYXRpb24uIFNlZTogYGVsZW1lbnRTdHlsaW5nYC5cbiAqL1xuZnVuY3Rpb24gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXg6IG51bWJlcik6IFN0eWxpbmdDb250ZXh0IHtcbiAgbGV0IHN0eWxpbmdDb250ZXh0ID0gbG9hZDxTdHlsaW5nQ29udGV4dD4oaW5kZXgpO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoc3R5bGluZ0NvbnRleHQpKSB7XG4gICAgY29uc3QgbEVsZW1lbnQgPSBzdHlsaW5nQ29udGV4dCBhcyBhbnkgYXMgTEVsZW1lbnROb2RlO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnREZWZpbmVkKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgJ2dldFN0eWxpbmdDb250ZXh0KCkgY2FsbGVkIGJlZm9yZSBlbGVtZW50U3R5bGluZygpJyk7XG4gICAgc3R5bGluZ0NvbnRleHQgPSB2aWV3RGF0YVtpbmRleCArIEhFQURFUl9PRkZTRVRdID1cbiAgICAgICAgYWxsb2NTdHlsaW5nQ29udGV4dChsRWxlbWVudCwgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEpO1xuICB9XG4gIHJldHVybiBzdHlsaW5nQ29udGV4dDtcbn1cblxuLyoqXG4gKiBBcHBseSBhbGwgc3R5bGluZyB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgd2hpY2ggaGF2ZSBiZWVuIHF1ZXVlZCBieSBhbnkgc3R5bGluZyBpbnN0cnVjdGlvbnMuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gb25jZSBvbmUgb3IgbW9yZSBgZWxlbWVudFN0eWxlYCBhbmQvb3IgYGVsZW1lbnRTdHlsZVByb3BgXG4gKiBoYXZlIGJlZW4gaXNzdWVkIGFnYWluc3QgdGhlIGVsZW1lbnQuIFRoaXMgZnVuY3Rpb24gd2lsbCBhbHNvIGRldGVybWluZSBpZiBhbnkgc3R5bGVzIGhhdmVcbiAqIGNoYW5nZWQgYW5kIHdpbGwgdGhlbiBza2lwIHRoZSBvcGVyYXRpb24gaWYgdGhlcmUgaXMgbm90aGluZyBuZXcgdG8gcmVuZGVyLlxuICpcbiAqIE9uY2UgY2FsbGVkIHRoZW4gYWxsIHF1ZXVlZCBzdHlsZXMgd2lsbCBiZSBmbHVzaGVkLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0aGF0IHdpbGwgYmUgcmVuZGVyZWQuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5PFQ+KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgcmVuZGVyRWxlbWVudFN0eWxlcyhnZXRTdHlsaW5nQ29udGV4dChpbmRleCksIHJlbmRlcmVyKTtcbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGdpdmVuIHN0eWxlIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGBudWxsYCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxlYCBvciBhbnkgc3R5bGVzIHRoYXQgYXJlIHByZXNlbnRcbiAqIGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCAod2l0aCBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHRoZSBzdHlsZSBwcm9wZXJ0eSBvbiB0aGlzIGVsZW1lbnQuIChNb25vdG9uaWNhbGx5IGluY3JlYXNpbmcuKVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgbnVsbCwgc3VmZml4Pzogc3RyaW5nKTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSBzdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCk7XG59XG5cbi8qKlxuICogUXVldWUgYSBrZXkvdmFsdWUgbWFwIG9mIHN0eWxlcyB0byBiZSByZW5kZXJlZCBvbiBhbiBFbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS4gV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG9cbiAqIHRoZSBFbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHBsYWNlZCB3aXRoIHJlc3BlY3QgdG8gYW55IHN0eWxlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAuXG4gKiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gYG51bGxgIHRoZW4gdGhleSB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudCAodW5sZXNzIHRoZSBzYW1lXG4gKiBzdHlsZSBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZCB0byB0aGUgZWxlbWVudCBkdXJpbmcgY3JlYXRpb24gdXNpbmcgYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHN0eWxpbmcgc3RvcmFnZSB0byBjaGFuZ2UgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiAgICAgICAgKE5vdGUgdGhhdCB0aGlzIGlzIG5vdCB0aGUgZWxlbWVudCBpbmRleCwgYnV0IHJhdGhlciBhbiBpbmRleCB2YWx1ZSBhbGxvY2F0ZWRcbiAqICAgICAgICBzcGVjaWZpY2FsbHkgZm9yIGVsZW1lbnQgc3R5bGluZy0tdGhlIGluZGV4IG11c3QgYmUgdGhlIG5leHQgaW5kZXggYWZ0ZXIgdGhlIGVsZW1lbnRcbiAqICAgICAgICBpbmRleC4pXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdNYXA8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgbnVsbCk6IHZvaWQge1xuICB1cGRhdGVTdHlsaW5nTWFwKGdldFN0eWxpbmdDb250ZXh0KGluZGV4KSwgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5hdGl2ZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0TmF0aXZlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGFwcGVuZENoaWxkKHRleHROYXRpdmUsIHROb2RlLCB2aWV3RGF0YSk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGNvbnN0IGV4aXN0aW5nTm9kZSA9IGxvYWRFbGVtZW50KGluZGV4KSBhcyBhbnkgYXMgTFRleHROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZSwgJ0xOb2RlIHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGV4aXN0aW5nTm9kZS5uYXRpdmUsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGV4aXN0aW5nTm9kZS5uYXRpdmUsIHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ05vZGUubmF0aXZlLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBEaXJlY3RpdmVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIGEgZGlyZWN0aXZlIGFuZCB0aGVpciBhc3NvY2lhdGVkIGNvbnRlbnQgcXVlcmllcy5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgITtcbiAgY29uc3QgaW5zdGFuY2UgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYsIGhvc3ROb2RlKTtcblxuICBjb25zdCBpc0NvbXBvbmVudCA9IChkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pLnRlbXBsYXRlO1xuICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICBhZGRDb21wb25lbnRMb2dpYyhcbiAgICAgICAgZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxUPiwgaG9zdE5vZGUpO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCB0Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlRGVmLmhvc3RWYXJzKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZScpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhkaXJlY3RpdmVEZWZJZHgsIGluc3RhbmNlLCBkaXJlY3RpdmVEZWYuaW5wdXRzLCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcykge1xuICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcygpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBDb21wb25lbnREZWZJbnRlcm5hbDxUPiwgaG9zdE5vZGU6IExOb2RlKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihob3N0Tm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQsIGRlZiksIHRWaWV3LCBpbnN0YW5jZSxcbiAgICAgICAgICBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSkpO1xuXG4gIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBob3N0IG5vZGUvZGF0YSBoZXJlIGJlY2F1c2Ugd2hlbiB0aGUgY29tcG9uZW50IExOb2RlIHdhcyBjcmVhdGVkLFxuICAvLyB3ZSBkaWRuJ3QgeWV0IGtub3cgaXQgd2FzIGEgY29tcG9uZW50IChqdXN0IGFuIGVsZW1lbnQpLlxuICAoaG9zdE5vZGUgYXN7ZGF0YTogTFZpZXdEYXRhfSkuZGF0YSA9IGNvbXBvbmVudFZpZXc7XG4gIChjb21wb25lbnRWaWV3IGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZTtcblxuICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKGhvc3ROb2RlLm5vZGVJbmplY3RvciwgaW5zdGFuY2UsIGNvbXBvbmVudFZpZXcpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKCk7XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgZGlyZWN0aXZlQ3JlYXRlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnRcbiAqXG4gKiBUaGlzIHZlcnNpb24gZG9lcyBub3QgY29udGFpbiBmZWF0dXJlcyB0aGF0IHdlIGRvbid0IGFscmVhZHkgc3VwcG9ydCBhdCByb290IGluXG4gKiBjdXJyZW50IEFuZ3VsYXIuIEV4YW1wbGU6IGxvY2FsIHJlZnMgYW5kIGlucHV0cyBvbiByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPixcbiAgICBob3N0Tm9kZTogTE5vZGUpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgdmlld0RhdGEpO1xuICBpZiAoaG9zdE5vZGUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEoaG9zdE5vZGUubmF0aXZlLCB2aWV3RGF0YSk7XG4gIH1cblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSB2aWV3RGF0YVtESVJFQ1RJVkVTXSA9IGRpcmVjdGl2ZXMgPSBbXTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgsIGRpcmVjdGl2ZXMpO1xuICBkaXJlY3RpdmVzW2luZGV4XSA9IGRpcmVjdGl2ZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBmbGFncyA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzID1cbiAgICAgICAgICBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9ubHkgbmVlZCB0byBidW1wIHRoZSBzaXplIHdoZW4gc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MrKztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGlQdWJsaWMgPSBkaXJlY3RpdmVEZWYgIS5kaVB1YmxpYztcbiAgICBpZiAoZGlQdWJsaWMpIGRpUHVibGljKGRpcmVjdGl2ZURlZiAhKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMoKGhvc3ROb2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzIGFzIHN0cmluZ1tdKTtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgaW5wdXRzOiB7W1AgaW4ga2V5b2YgVF06IHN0cmluZzt9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgcmV0dXJuIFtcbiAgICBpc0ZvclZpZXdDb250YWluZXJSZWYgPyBudWxsIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3c1xuICAgIG51bGwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmVuZGVyUGFyZW50LCBzZXQgYWZ0ZXIgbm9kZSBjcmVhdGlvblxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGFuIG5nLXRlbXBsYXRlIChkeW5hbWljYWxseS1pbnNlcnRlZCB2aWV3KSwgZS5nLlxuICpcbiAqIDxuZy10ZW1wbGF0ZSAjZm9vPlxuICogICAgPGRpdj48L2Rpdj5cbiAqIDwvbmctdGVtcGxhdGU+XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBJbmxpbmUgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGZvciB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgQSBmdW5jdGlvbiB3aGljaCBleHRyYWN0cyBsb2NhbC1yZWZzIHZhbHVlcyBmcm9tIHRoZSB0ZW1wbGF0ZS5cbiAqICAgICAgICBEZWZhdWx0cyB0byB0aGUgY3VycmVudCBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGUgbG9jYWwtcmVmLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGUoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBsb2NhbFJlZkV4dHJhY3Rvcj86IExvY2FsUmVmRXh0cmFjdG9yKSB7XG4gIC8vIFRPRE86IGNvbnNpZGVyIGEgc2VwYXJhdGUgbm9kZSB0eXBlIGZvciB0ZW1wbGF0ZXNcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgdGFnTmFtZSB8fCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS50Vmlld3MgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgLTEsIHRlbXBsYXRlRm4sIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cblxuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGxvY2FsUmVmcywgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICBjdXJyZW50UXVlcmllcyAmJlxuICAgICAgKGN1cnJlbnRRdWVyaWVzID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUpKTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyh0Tm9kZS5mbGFncywgdFZpZXcpO1xuICBpc1BhcmVudCA9IGZhbHNlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Tm9kZS50Vmlld3MgPSBbXSk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5lckludGVybmFsKFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIodmlld0RhdGEpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBjb21tZW50ID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMsIGxDb250YWluZXIpO1xuXG4gIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSBnZXRSZW5kZXJQYXJlbnQodE5vZGUsIHZpZXdEYXRhKTtcbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIHZpZXdEYXRhKTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZSh2aWV3RGF0YSwgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsQ29udGFpbmVyKTtcblxuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFNldHMgYSBjb250YWluZXIgdXAgdG8gcmVjZWl2ZSB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hTdGFydChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWRJbnRlcm5hbChpbmRleCwgdFZpZXcuZGF0YSkgYXMgVE5vZGU7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgLy8gSW5saW5lIGNvbnRhaW5lcnMgY2Fubm90IGhhdmUgc3R5bGUgYmluZGluZ3MsIHNvIHdlIGNhbiByZWFkIHRoZSB2YWx1ZSBkaXJlY3RseVxuICAodmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lck5vZGUuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXJOb2RlIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgVmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgLy8gSW5saW5lIGNvbnRhaW5lcnMgY2Fubm90IGhhdmUgc3R5bGUgYmluZGluZ3MsIHNvIHdlIGNhbiByZWFkIHRoZSB2YWx1ZSBkaXJlY3RseVxuICBjb25zdCBsQ29udGFpbmVyID0gdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XS5kYXRhO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShcbiAgICAgICAgICAgIGR5bmFtaWNWaWV3RGF0YSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEsXG4gICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gdENvbnRhaW5lck5vZGUgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHN0YXJ0SWR4IHN0YXJ0aW5nIGluZGV4IGluIHRoZSB2aWV3cyBhcnJheSB0byBzZWFyY2ggZnJvbVxuICogQHBhcmFtIHZpZXdCbG9ja0lkIGV4YWN0IHZpZXcgYmxvY2sgaWQgdG8gbG9vayBmb3JcbiAqIEByZXR1cm5zIGluZGV4IG9mIGEgZm91bmQgdmlldyBvciAtMSBpZiBub3QgZm91bmRcbiAqL1xuZnVuY3Rpb24gc2NhbkZvclZpZXcoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdENvbnRhaW5lck5vZGU6IFRDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLFxuICAgIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld0RhdGF8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIHRDb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaCBoZXJlXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFya3MgdGhlIHN0YXJ0IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXdCbG9ja0lkIFRoZSBJRCBvZiB0aGlzIHZpZXdcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3U3RhcnQodmlld0Jsb2NrSWQ6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcik6IFJlbmRlckZsYWdzIHtcbiAgLy8gVGhlIHByZXZpb3VzIG5vZGUgY2FuIGJlIGEgdmlldyBub2RlIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGFuIGlubGluZSBmb3IgbG9vcFxuICBjb25zdCBjb250YWluZXJUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICEgOlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlO1xuICAvLyBJbmxpbmUgY29udGFpbmVycyBjYW5ub3QgaGF2ZSBzdHlsZSBiaW5kaW5ncywgc28gd2UgY2FuIHJlYWQgdGhlIHZhbHVlIGRpcmVjdGx5XG4gIGNvbnN0IGNvbnRhaW5lciA9IHZpZXdEYXRhW2NvbnRhaW5lclROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgY29uc3QgY3VycmVudFZpZXcgPSB2aWV3RGF0YTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyVE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyLmRhdGE7XG4gIGxldCB2aWV3VG9SZW5kZXIgPSBzY2FuRm9yVmlldyhcbiAgICAgIGxDb250YWluZXIsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3VG9SZW5kZXIpIHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgcmVuZGVyZXIsXG4gICAgICAgIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29uc3RzLCB2YXJzLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSksIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVOb2RlQXRJbmRleCh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIHZpZXdUb1JlbmRlcik7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfVxuICBpZiAoY29udGFpbmVyKSB7XG4gICAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgICAgLy8gaXQgaXMgYSBuZXcgdmlldywgaW5zZXJ0IGl0IGludG8gY29sbGVjdGlvbiBvZiB2aWV3cyBmb3IgYSBnaXZlbiBjb250YWluZXJcbiAgICAgIGluc2VydFZpZXcodmlld1RvUmVuZGVyLCBsQ29udGFpbmVyLCBjdXJyZW50VmlldywgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIC0xKTtcbiAgICB9XG4gICAgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICErKztcbiAgfVxuICByZXR1cm4gZ2V0UmVuZGVyRmxhZ3Modmlld1RvUmVuZGVyKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCB2aWV3SG9zdCA9IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoKTtcbiAgbGVhdmVWaWV3KHZpZXdEYXRhW1BBUkVOVF0gISk7XG4gIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHZpZXdIb3N0ICE7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3RGF0YVtdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoYWRqdXN0ZWRFbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0pIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHRWaWV3LmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXdEYXRhIGF0dGFjaGVkLmApO1xuICBjb25zdCBob3N0VmlldyA9IGVsZW1lbnQuZGF0YSAhO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0VmlldywgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlld0RhdGEpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50Vmlldyh2aWV3RGF0YSlbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG5cbiAgaWYgKCFjb21wb25lbnROb2RlLnByb2plY3Rpb24pIHtcbiAgICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gICAgY29uc3QgcERhdGE6IChUTm9kZSB8IG51bGwpW10gPSBjb21wb25lbnROb2RlLnByb2plY3Rpb24gPVxuICAgICAgICBuZXcgQXJyYXkobm9PZk5vZGVCdWNrZXRzKS5maWxsKG51bGwpO1xuICAgIGNvbnN0IHRhaWxzOiAoVE5vZGUgfCBudWxsKVtdID0gcERhdGEuc2xpY2UoKTtcblxuICAgIGxldCBjb21wb25lbnRDaGlsZDogVE5vZGV8bnVsbCA9IGNvbXBvbmVudE5vZGUuY2hpbGQ7XG5cbiAgICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldEluZGV4ID1cbiAgICAgICAgICBzZWxlY3RvcnMgPyBtYXRjaGluZ1NlbGVjdG9ySW5kZXgoY29tcG9uZW50Q2hpbGQsIHNlbGVjdG9ycywgdGV4dFNlbGVjdG9ycyAhKSA6IDA7XG4gICAgICBjb25zdCBuZXh0Tm9kZSA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG5cbiAgICAgIGlmICh0YWlsc1tidWNrZXRJbmRleF0pIHtcbiAgICAgICAgdGFpbHNbYnVja2V0SW5kZXhdICEubmV4dCA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcERhdGFbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgfVxuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlld0RhdGEgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKG5vZGVJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgaXNQYXJlbnQgPSBmYWxzZTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcodmlld0RhdGEpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgbGV0IG5vZGVUb1Byb2plY3QgPSAoY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbc2VsZWN0b3JJbmRleF07XG4gIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG5cbiAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gVGhpcyBub2RlIGlzIHJlLXByb2plY3RlZCwgc28gd2UgbXVzdCBnbyB1cCB0aGUgdHJlZSB0byBnZXQgaXRzIHByb2plY3RlZCBub2Rlcy5cbiAgICAgIGNvbnN0IGN1cnJlbnRDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcocHJvamVjdGVkVmlldyk7XG4gICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGN1cnJlbnRDb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgY29uc3QgZmlyc3RQcm9qZWN0ZWROb2RlID1cbiAgICAgICAgICAoY3VycmVudENvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW25vZGVUb1Byb2plY3QucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICBpZiAoZmlyc3RQcm9qZWN0ZWROb2RlKSB7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IG5vZGVUb1Byb2plY3Q7XG4gICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IHByb2plY3RlZFZpZXc7XG5cbiAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgcHJvamVjdGVkVmlldyA9IGN1cnJlbnRDb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxOb2RlID0gcHJvamVjdGVkVmlld1tub2RlVG9Qcm9qZWN0LmluZGV4XSBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZTtcbiAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgIC8vIGlmIHRoZSBub2RlcyBhcmUgaW5zZXJ0ZWQgaW50byBhIGNvbnRhaW5lciBsYXRlci5cbiAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcblxuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShsTm9kZSwgbm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCB2aWV3RGF0YSwgcHJvamVjdGVkVmlldyk7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgYXJlIGZpbmlzaGVkIHdpdGggYSBsaXN0IG9mIHJlLXByb2plY3RlZCBub2Rlcywgd2UgbmVlZCB0byBnZXRcbiAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgaWYgKG5vZGVUb1Byb2plY3QubmV4dCA9PT0gbnVsbCAmJiBwcm9qZWN0ZWRWaWV3ICE9PSBjb21wb25lbnRWaWV3W1BBUkVOVF0gISkge1xuICAgICAgcHJvamVjdGVkVmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlld0RhdGE7XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgIH1cbiAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdEYXRhW10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3RGF0YXxMQ29udGFpbmVyPihcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBpZiAoY3VycmVudFZpZXdbVEFJTF0pIHtcbiAgICBjdXJyZW50Vmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3RGF0YSBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChub2RlOiBMRWxlbWVudE5vZGUpOiB2b2lkIHtcbiAgLy8gQmVjYXVzZSBkYXRhIGZsb3dzIGRvd24gdGhlIGNvbXBvbmVudCB0cmVlLCBhbmNlc3RvcnMgZG8gbm90IG5lZWQgdG8gYmUgbWFya2VkIGRpcnR5XG4gIGlmIChub2RlLmRhdGEgJiYgIShub2RlLmRhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBub2RlLmRhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX3ByZXZlbnREZWZhdWx0KGU6IEV2ZW50KSB7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgbGV0IGN1cnJlbnRWaWV3OiBMVmlld0RhdGEgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50VmlldyAmJiAhKGN1cnJlbnRWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGN1cnJlbnRWaWV3ID0gY3VycmVudFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIGN1cnJlbnRWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjdXJyZW50Vmlld1tDT05URVhUXSwgJ3Jvb3RDb250ZXh0IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gIHNjaGVkdWxlVGljayhjdXJyZW50Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgaWYgKHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICByZXMgIShudWxsKTtcbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlld0RhdGEocm9vdENvbXBvbmVudCkgISwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3RGF0YWAgdW50aWxcbiAqIHJlYWNoaW5nIHRoZSByb290IGBMVmlld0RhdGFgLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgYW55IGNvbXBvbmVudFxuICovXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSb290Vmlldyhjb21wb25lbnQ6IGFueSk6IExWaWV3RGF0YSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBsZXQgbFZpZXdEYXRhID0gcmVhZFBhdGNoZWRMVmlld0RhdGEoY29tcG9uZW50KSAhO1xuICB3aGlsZSAobFZpZXdEYXRhICYmICEobFZpZXdEYXRhW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3RGF0YSA9IGxWaWV3RGF0YVtQQVJFTlRdICE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3RGF0YTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudCkgITtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKGhvc3ROb2RlLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXdEYXRhIGluc3RhbmNlLicpO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdE5vZGUuZGF0YSAhLCBjb21wb25lbnQpO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjaGVja05vQ2hhbmdlc01vZGUgPSB0cnVlO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXMoY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBjaGVja05vQ2hhbmdlc01vZGUgPSBmYWxzZTtcbiAgfVxufVxuXG4vKiogQ2hlY2tzIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgcHJvdmlkZWQuIERvZXMgbm90IGdhdGUgb24gZGlydHkgY2hlY2tzIG9yIGV4ZWN1dGUgZG9DaGVjay4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4oaG9zdFZpZXc6IExWaWV3RGF0YSwgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3Qgdmlld1F1ZXJ5ID0gaG9zdFRWaWV3LnZpZXdRdWVyeTtcblxuICB0cnkge1xuICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICBjcmVhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBob3N0Vmlld1tGTEFHU10sIGNvbXBvbmVudCk7XG4gICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cygpO1xuICAgIHVwZGF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmIChmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5DcmVhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlVmlld1F1ZXJ5PFQ+KHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGVsZW1lbnROb2RlID0gZ2V0TEVsZW1lbnRGcm9tQ29tcG9uZW50KGNvbXBvbmVudCkgITtcbiAgbWFya1ZpZXdEaXJ0eShlbGVtZW50Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmlld0RhdGFbQklORElOR19JTkRFWF0rKywgdmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKyssIHYwKTtcbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMztcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIHN1ZmZpeCA6XG4gICAgICAgICAgICAgICAgICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGUgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NikgfHwgZGlmZmVyZW50O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSA3O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGluZGV4LCBjb250ZXh0Vmlld0RhdGEpO1xufVxuXG5mdW5jdGlvbiB3YWxrVXBWaWV3cyhuZXN0aW5nTGV2ZWw6IG51bWJlciwgY3VycmVudFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIHdoaWxlIChuZXN0aW5nTGV2ZWwgPiAwKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSxcbiAgICAgICAgICAgICAgICAgICAgICdEZWNsYXJhdGlvbiB2aWV3IHNob3VsZCBiZSBkZWZpbmVkIGlmIG5lc3RpbmcgbGV2ZWwgaXMgZ3JlYXRlciB0aGFuIDAuJyk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIG5lc3RpbmdMZXZlbC0tO1xuICB9XG4gIHJldHVybiBjdXJyZW50Vmlldztcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdLFxuICAgICAgICAgICAgICAgICAgICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShxdWVyeUxpc3RJZHgsIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gISk7XG5cbiAgcmV0dXJuIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRFbGVtZW50KGluZGV4OiBudW1iZXIpOiBMRWxlbWVudE5vZGUge1xuICByZXR1cm4gbG9hZEVsZW1lbnRJbnRlcm5hbChpbmRleCwgdmlld0RhdGEpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VE5vZGUoaW5kZXg6IG51bWJlcik6IFROb2RlIHtcbiAgcmV0dXJuIHRWaWV3LmRhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXSBhcyBUTm9kZTtcbn1cblxuLyoqIEdldHMgdGhlIGN1cnJlbnQgYmluZGluZyB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRCaW5kaW5nKGJpbmRpbmdJbmRleDogbnVtYmVyKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0pO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gdmlld0RhdGFbYmluZGluZ0luZGV4XTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBpdCB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXg6IG51bWJlciwgdmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbihcbiAgICAgICAgICAgICAgICAgICBiaW5kaW5nSW5kZXgsIHZpZXdEYXRhLmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB0byBOT19DSEFOR0VgKTtcblxuICBpZiAodmlld0RhdGFbYmluZGluZ0luZGV4XSA9PT0gTk9fQ0hBTkdFKSB7XG4gICAgdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9IGVsc2UgaWYgKGlzRGlmZmVyZW50KHZpZXdEYXRhW2JpbmRpbmdJbmRleF0sIHZhbHVlLCBjaGVja05vQ2hhbmdlc01vZGUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShjcmVhdGlvbk1vZGUsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgYW5kIHJldHVybnMgdGhlIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBhbnkge1xuICByZXR1cm4gdmlld0RhdGFbYmluZGluZ0luZGV4XSA9IHZhbHVlO1xufVxuXG4vKiogVXBkYXRlcyAyIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGVpdGhlciB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCwgZXhwMSk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChiaW5kaW5nSW5kZXggKyAxLCBleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDMgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMyhiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCArIDIsIGV4cDMpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KFxuICAgIGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGJpbmRpbmdJbmRleCwgZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4ICsgMiwgZXhwMywgZXhwNCkgfHwgZGlmZmVyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFZpZXcoKTogVFZpZXcge1xuICByZXR1cm4gdFZpZXc7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZW50UXVlcnk8UT4ocXVlcnlMaXN0OiBRdWVyeUxpc3Q8UT4pOiB2b2lkIHtcbiAgY29uc3Qgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCA9XG4gICAgICAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSB8fCAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChxdWVyeUxpc3QpO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBkaXJlY3RpdmVzICEubGVuZ3RoIC0gMTtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMl0gOiAtMTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKGN1cnJlbnREaXJlY3RpdmVJbmRleCwgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpIHtcbiAgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIHRydWUsICdwcmV2aW91c09yUGFyZW50VE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhhc1BhcmVudCgpIHtcbiAgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50LCAncHJldmlvdXNPclBhcmVudFROb2RlIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGFJblJhbmdlKGluZGV4OiBudW1iZXIsIGFycj86IGFueVtdKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkgYXJyID0gdmlld0RhdGE7XG4gIGFzc2VydERhdGFJblJhbmdlSW50ZXJuYWwoaW5kZXgsIGFyciB8fCB2aWV3RGF0YSk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGFOZXh0KGluZGV4OiBudW1iZXIsIGFycj86IGFueVtdKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkgYXJyID0gdmlld0RhdGE7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgYXJyLmxlbmd0aCwgaW5kZXgsIGBpbmRleCAke2luZGV4fSBleHBlY3RlZCB0byBiZSBhdCB0aGUgZW5kIG9mIGFyciAobGVuZ3RoICR7YXJyLmxlbmd0aH0pYCk7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG4iXX0=