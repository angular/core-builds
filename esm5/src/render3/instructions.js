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
export var NG_HOST_SYMBOL = '__ngHostLNode__';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = Promise.resolve(null);
/**
 * Directive and element indices for top-level directive.
 *
 * Saved here to avoid re-instantiating an array on every change detection run.
 *
 * Note: Element is not actually stored at index 0 because of the LViewData
 * header, but the host bindings function expects an index that is NOT adjusted
 * because it will ultimately be fed to instructions like elementProperty.
 */
var _ROOT_DIRECTIVE_INDICES = [0, 0];
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
var rendererFactory;
export function getRenderer() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return renderer;
}
export function getCurrentSanitizer() {
    return viewData && viewData[SANITIZER];
}
export function getViewData() {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return viewData;
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
export function getCurrentQueries(QueryType) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return currentQueries || (currentQueries = (previousOrParentNode.queries || new QueryType()));
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
    viewData[BINDING_INDEX] = -1;
    enterView(newView, null);
}
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings,
 * refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 */
function refreshView() {
    if (!checkNoChangesMode) {
        executeInitHooks(viewData, tView, creationMode);
    }
    refreshDynamicEmbeddedViews(viewData);
    if (!checkNoChangesMode) {
        executeHooks(directives, tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
    setHostBindings(tView.hostBindings);
    refreshChildComponents(tView.components);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(bindings) {
    if (bindings != null) {
        var defs = tView.directives;
        for (var i = 0; i < bindings.length; i += 2) {
            var dirIndex = bindings[i];
            var def = defs[dirIndex];
            def.hostBindings && def.hostBindings(dirIndex, bindings[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components) {
    if (components != null) {
        for (var i = 0; i < components.length; i += 2) {
            componentRefresh(components[i], components[i + 1]);
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
    return [
        tView,
        viewData,
        null,
        null,
        flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */,
        null,
        -1,
        null,
        null,
        context,
        viewData && viewData[INJECTOR],
        renderer,
        sanitizer || null,
        null // tail
    ];
}
/**
 * Creation of LNode object is extracted to a separate function so we always create LNode object
 * with the same shape
 * (same properties assigned in the same order).
 */
export function createLNodeObject(type, currentView, parent, native, state, queries) {
    return {
        native: native,
        view: currentView,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        queries: queries,
        tNode: null,
        pNextOrParent: null,
        dynamicLContainerNode: null,
        dynamicParent: null,
        pChild: null,
    };
}
export function createLNode(index, type, native, name, attrs, state) {
    var parent = isParent ? previousOrParentNode :
        previousOrParentNode && getParentLNode(previousOrParentNode);
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var tParent = parent && parent.view === viewData ? parent.tNode : null;
    var queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    var isState = state != null;
    var node = createLNodeObject(type, viewData, parent, native, isState ? state : null, queries);
    if (index === -1 || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = (state ? state[TVIEW].node : null) ||
            createTNode(type, index, null, null, tParent, null);
    }
    else {
        var adjustedIndex = index + HEADER_OFFSET;
        // This is an element or container or projection node
        ngDevMode && assertDataNext(adjustedIndex);
        var tData = tView.data;
        viewData[adjustedIndex] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (adjustedIndex >= tData.length) {
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
        var lViewData = state;
        ngDevMode && assertNotDefined(lViewData[HOST_NODE], 'lViewData[HOST_NODE] should not have been initialized');
        lViewData[HOST_NODE] = node;
        if (firstTemplatePass)
            lViewData[TVIEW].node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
//////////////////////////
//// Render
//////////////////////////
/**
 * Resets the application state.
 */
function resetApplicationState() {
    isParent = false;
    previousOrParentNode = null;
}
/**
 *
 * @param hostNode Existing node to render into.
 * @param template Template function with the instructions.
 * @param context to pass into the template.
 * @param providedRendererFactory renderer factory to use
 * @param host The host element node to use
 * @param directives Directive defs that should be used for matching
 * @param pipes Pipe defs that should be used for matching
 */
export function renderTemplate(hostNode, template, context, providedRendererFactory, host, directives, pipes, sanitizer) {
    if (host == null) {
        resetApplicationState();
        rendererFactory = providedRendererFactory;
        var tView_1 = getOrCreateTView(template, directives || null, pipes || null, null);
        host = createLNode(-1, 3 /* Element */, hostNode, null, null, createLViewData(providedRendererFactory.createRenderer(null, null), tView_1, {}, 2 /* CheckAlways */, sanitizer));
    }
    var hostView = host.data;
    ngDevMode && assertDefined(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, template);
    return host;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewNode(tView, context, renderer, queries) {
    var _isParent = isParent;
    var _previousOrParentNode = previousOrParentNode;
    isParent = true;
    previousOrParentNode = null;
    var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
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
    try {
        isParent = true;
        previousOrParentNode = null;
        oldView = enterView(viewNode.data, viewNode);
        namespaceHTML();
        tView.template(rf, context);
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
        var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
        leaveView(oldView, isCreationOnly);
        isParent = _isParent;
        previousOrParentNode = _previousOrParentNode;
    }
    return viewNode;
}
export function renderComponentOrTemplate(node, hostView, componentOrContext, template) {
    var oldView = enterView(hostView, node);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (template) {
            namespaceHTML();
            template(getRenderFlags(hostView), componentOrContext);
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
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native;
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
    var node = createLNode(index, 3 /* Element */, native, name, attrs || null, null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild(getParentLNode(node), native, viewData);
    createDirectivesAndLocals(localRefs);
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param localRefs Local refs of the current node
 */
function createDirectivesAndLocals(localRefs) {
    var node = previousOrParentNode;
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
function queueComponentIndexForCheck(dirIndex) {
    if (firstTemplatePass) {
        (tView.components || (tView.components = [])).push(dirIndex, viewData.length - 1);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
function queueHostBindingForCheck(dirIndex) {
    // Must subtract the header offset because hostBindings functions are generated with
    // instructions that expect element indices that are NOT adjusted (e.g. elementProperty).
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.hostBindings || (tView.hostBindings = [])).push(dirIndex, viewData.length - 1 - HEADER_OFFSET);
}
/** Sets the context for a ChangeDetectorRef to the given instance. */
export function initChangeDetectorIfExisting(injector, instance, view) {
    if (injector && injector.changeDetectorRef != null) {
        injector.changeDetectorRef._setComponentContext(view, instance);
    }
}
export function isComponent(tNode) {
    return (tNode.flags & 4096 /* isComponent */) === 4096 /* isComponent */;
}
/**
 * This function instantiates the given directives.
 */
function instantiateDirectivesDirectly() {
    var tNode = previousOrParentNode.tNode;
    var count = tNode.flags & 4095 /* DirectiveCountMask */;
    if (count > 0) {
        var start = tNode.flags >> 13 /* DirectiveStartingIndexShift */;
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
function saveResolvedLocalsInData() {
    var localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ? previousOrParentNode.native : directives[index];
            viewData.push(value);
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param template The template from which to get static data
 * @param directives Directive defs that should be saved on TView
 * @param pipes Pipe defs that should be saved on TView
 * @returns TView
 */
function getOrCreateTView(template, directives, pipes, viewQuery) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return template.ngPrivateData ||
        (template.ngPrivateData = createTView(-1, template, directives, pipes, viewQuery));
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 */
export function createTView(viewIndex, template, directives, pipes, viewQuery) {
    ngDevMode && ngDevMode.tView++;
    return {
        id: viewIndex,
        template: template,
        viewQuery: viewQuery,
        node: null,
        data: HEADER_FILLER.slice(),
        childIndex: -1,
        bindingStartIndex: -1,
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
    resetApplicationState();
    var node = createLNode(0, 3 /* Element */, rNode, null, null, createLViewData(renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery), null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
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
    var queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
    queueLifecycleHooks(previousOrParentNode.tNode.flags, tView);
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
        var element_1 = load(index);
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
    var node = load(index);
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
        detached: null
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
        var start = tNodeFlags >> 13 /* DirectiveStartingIndexShift */;
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
export function elementClassNamed(index, className, value) {
    if (value !== NO_CHANGE) {
        var lElement = load(index);
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
 * @param index The index of the element to update in the data array
 * @param value A value indicating a set of classes which should be applied. The method overrides
 *   any existing classes. The value is stringified (`toString`) before it is applied to the
 *   element.
 */
export function elementClass(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `className`. In the
        // future
        // we will add logic here which would work with the animation code.
        var lElement = load(index);
        ngDevMode && ngDevMode.rendererSetClassName++;
        isProceduralRenderer(renderer) ? renderer.setProperty(lElement.native, 'className', value) :
            lElement.native['className'] = stringify(value);
    }
}
export function elementStyleNamed(index, styleName, value, suffixOrSanitizer) {
    if (value !== NO_CHANGE) {
        var lElement = load(index);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveStyle++;
            isProceduralRenderer(renderer) ?
                renderer.removeStyle(lElement.native, styleName, RendererStyleFlags3.DashCase) :
                lElement.native['style'].removeProperty(styleName);
        }
        else {
            var strValue = typeof suffixOrSanitizer == 'function' ? suffixOrSanitizer(value) : stringify(value);
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
 * @param index The index of the element to update in the LViewData array
 * @param value A value indicating if a given style should be added or removed.
 *   The expected shape of `value` is an object where keys are style names and the values
 *   are their corresponding values to set. If value is falsy, then the style is removed. An absence
 *   of style does not cause that style to be removed. `NO_CHANGE` implies that no update should be
 *   performed.
 */
export function elementStyle(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `style`. In the future
        // we will add logic here which would work with the animation code.
        var lElement = load(index);
        if (isProceduralRenderer(renderer)) {
            ngDevMode && ngDevMode.rendererSetStyle++;
            renderer.setProperty(lElement.native, 'style', value);
        }
        else {
            var style = lElement.native['style'];
            for (var i = 0, keys = Object.keys(value); i < keys.length; i++) {
                var styleName = keys[i];
                var styleValue = value[styleName];
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
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'text nodes should be created before bindings');
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
        var existingNode = load(index);
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
 * Create a directive.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @param directive The directive instance.
 * @param directiveDef DirectiveDef object which contains information about the template.
 */
export function directiveCreate(index, directive, directiveDef) {
    var instance = baseDirectiveCreate(index, directive, directiveDef);
    ngDevMode && assertDefined(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    var tNode = previousOrParentNode.tNode;
    var isComponent = directiveDef.template;
    if (isComponent) {
        addComponentLogic(index, directive, directiveDef);
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
function addComponentLogic(directiveIndex, instance, def) {
    var tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var componentView = addToViewTree(viewData, previousOrParentNode.tNode.index, createLViewData(rendererFactory.createRenderer(previousOrParentNode.native, def.rendererType), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    previousOrParentNode.data = componentView;
    componentView[HOST_NODE] = previousOrParentNode;
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, componentView);
    if (firstTemplatePass)
        queueComponentIndexForCheck(directiveIndex);
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
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
        var flags = previousOrParentNode.tNode.flags;
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
 * Creates an LContainerNode.
 *
 * Only `LViewNodes` can go into `LContainerNodes`.
 *
 * @param index The index of the container in the data array
 * @param template Optional inline template
 * @param tagName The name of the container element, if applicable
 * @param attrs The attrs attached to the container, if applicable
 * @param localRefs A set of local reference bindings on the element.
 */
export function container(index, template, tagName, attrs, localRefs) {
    ngDevMode &&
        assertEqual(viewData[BINDING_INDEX], -1, 'container nodes should be created before any bindings');
    var currentParent = isParent ? previousOrParentNode : getParentLNode(previousOrParentNode);
    var lContainer = createLContainer(currentParent, viewData);
    var comment = renderer.createComment(ngDevMode ? 'container' : '');
    var node = createLNode(index, 0 /* Container */, comment, tagName || null, attrs || null, lContainer);
    appendChild(getParentLNode(node), comment, viewData);
    if (firstTemplatePass) {
        node.tNode.tViews = template ?
            createTView(-1, template, tView.directiveRegistry, tView.pipeRegistry, null) :
            [];
    }
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, node.data);
    var queries = node.queries;
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
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    previousOrParentNode = load(index);
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
export function embeddedViewStart(viewBlockId) {
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
        var newView = createLViewData(renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            newView[QUERIES] = lContainer[QUERIES].createView();
        }
        enterView(newView, viewNode = createLNode(viewBlockId, 2 /* View */, null, null, null, newView));
    }
    var containerNode = getParentLNode(viewNode);
    if (containerNode) {
        ngDevMode && assertNodeType(viewNode, 2 /* View */);
        ngDevMode && assertNodeType(containerNode, 0 /* Container */);
        var lContainer_1 = containerNode.data;
        if (creationMode) {
            // it is a new view, insert it into collection of views for a given container
            insertView(containerNode, viewNode, lContainer_1[ACTIVE_INDEX]);
        }
        lContainer_1[ACTIVE_INDEX]++;
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
 * @param parent The parent container in which to look for the view's static data
 * @returns TView
 */
function getOrCreateEmbeddedTView(viewIndex, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    var containerTViews = parent.tNode.tViews;
    ngDevMode && assertDefined(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        containerTViews[viewIndex] =
            createTView(viewIndex, null, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    refreshView();
    isParent = false;
    previousOrParentNode = viewData[HOST_NODE];
    if (creationMode) {
        var containerNode = getParentLNode(previousOrParentNode);
        if (containerNode) {
            ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
            ngDevMode && assertNodeType(containerNode, 0 /* Container */);
            // When projected nodes are going to be inserted, the renderParent of the dynamic container
            // used by the ViewContainerRef must be set.
            setRenderParentInProjectedNodes(containerNode.data[RENDER_PARENT], previousOrParentNode);
        }
    }
    leaveView(viewData[PARENT]);
    ngDevMode && assertEqual(isParent, false, 'isParent');
    ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
}
/**
 * For nodes which are projected inside an embedded view, this function sets the renderParent
 * of their dynamic LContainerNode.
 * @param renderParent the renderParent of the LContainer which contains the embedded view.
 * @param viewNode the embedded view.
 */
function setRenderParentInProjectedNodes(renderParent, viewNode) {
    if (renderParent != null) {
        var node = getChildLNode(viewNode);
        while (node) {
            if (node.tNode.type === 1 /* Projection */) {
                var nodeToProject = node.data.head;
                var lastNodeToProject = node.data.tail;
                while (nodeToProject) {
                    if (nodeToProject.dynamicLContainerNode) {
                        nodeToProject.dynamicLContainerNode.data[RENDER_PARENT] = renderParent;
                    }
                    nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
                }
            }
            node = getNextLNode(node);
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param directiveIndex Directive index in LViewData[DIRECTIVES]
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(directiveIndex, adjustedElementIndex) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    var element = viewData[adjustedElementIndex];
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode &&
        assertDefined(element.data, "Component's host node should have an LViewData attached.");
    var hostView = element.data;
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        ngDevMode && assertDataInRange(directiveIndex, directives);
        detectChangesInternal(hostView, element, getDirectiveInstance(directives[directiveIndex]));
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
export function projectionDef(index, selectors, textSelectors) {
    var noOfNodeBuckets = selectors ? selectors.length + 1 : 1;
    var distributedNodes = new Array(noOfNodeBuckets);
    for (var i = 0; i < noOfNodeBuckets; i++) {
        distributedNodes[i] = [];
    }
    var componentNode = findComponentHost(viewData);
    var isProjectingI18nNodes = false;
    var componentChild;
    // for i18n translations we use pChild to point to the next child
    // TODO(kara): Remove when removing LNodes
    if (componentNode.pChild) {
        isProjectingI18nNodes = true;
        componentChild = componentNode.pChild;
    }
    else {
        componentChild = getChildLNode(componentNode);
    }
    while (componentChild !== null) {
        // execute selector matching logic if and only if:
        // - there are selectors defined
        // - a node has a tag name / attributes that can be matched
        if (selectors && componentChild.tNode) {
            var matchedIdx = matchingSelectorIndex(componentChild.tNode, selectors, textSelectors);
            distributedNodes[matchedIdx].push(componentChild);
        }
        else {
            distributedNodes[0].push(componentChild);
        }
        if (isProjectingI18nNodes) {
            componentChild = componentChild.pNextOrParent;
        }
        else {
            componentChild = getNextLNode(componentChild);
        }
    }
    ngDevMode && assertDataNext(index + HEADER_OFFSET);
    store(index, distributedNodes);
}
/**
 * Updates the linked list of a projection node, by appending another linked list.
 *
 * @param projectionNode Projection node whose projected nodes linked list has to be updated
 * @param appendedFirst First node of the linked list to append.
 * @param appendedLast Last node of the linked list to append.
 */
function appendToProjectionNode(projectionNode, appendedFirst, appendedLast) {
    ngDevMode && assertEqual(!!appendedFirst, !!appendedLast, 'appendedFirst can be null if and only if appendedLast is also null');
    if (!appendedLast) {
        // nothing to append
        return;
    }
    var projectionNodeData = projectionNode.data;
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
 * @param nodeIndex
 * @param localIndex - index under which distribution of projected nodes was memorized
 * @param selectorIndex:
 *        - 0 when the selector is `*` (or unspecified as this is the default value),
 *        - 1 based index of the selector from the {@link projectionDef}
 */
export function projection(nodeIndex, localIndex, selectorIndex, attrs) {
    if (selectorIndex === void 0) { selectorIndex = 0; }
    var node = createLNode(nodeIndex, 1 /* Projection */, null, null, attrs || null, { head: null, tail: null });
    // `<ng-content>` has no content
    isParent = false;
    // re-distribution of projectable nodes is memorized on a component's view level
    var componentNode = findComponentHost(viewData);
    var componentLView = componentNode.data;
    var distributedNodes = loadInternal(localIndex, componentLView);
    var nodesForSelector = distributedNodes[selectorIndex];
    // build the linked list of projected nodes:
    for (var i = 0; i < nodesForSelector.length; i++) {
        var nodeToProject = nodesForSelector[i];
        if (nodeToProject.tNode.type === 1 /* Projection */) {
            // Reprojecting a projection -> append the list of previously projected nodes
            var previouslyProjected = nodeToProject.data;
            appendToProjectionNode(node, previouslyProjected.head, previouslyProjected.tail);
        }
        else {
            // Projecting a single node
            appendToProjectionNode(node, nodeToProject, nodeToProject);
        }
    }
    var currentParent = getParentLNode(node);
    if (canInsertNativeNode(currentParent, viewData)) {
        ngDevMode && assertNodeOfPossibleTypes(currentParent, 3 /* Element */, 2 /* View */);
        // process each node in the list of projected nodes:
        var nodeToProject = node.data.head;
        var lastNodeToProject = node.data.tail;
        while (nodeToProject) {
            appendProjectedNode(nodeToProject, currentParent, viewData);
            nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
        }
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param lViewData LViewData for which we want a host element node
 * @returns The host node
 */
function findComponentHost(lViewData) {
    var viewRootLNode = lViewData[HOST_NODE];
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertDefined(lViewData[PARENT], 'lViewData.parent');
        lViewData = lViewData[PARENT];
        viewRootLNode = lViewData[HOST_NODE];
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertDefined(viewRootLNode.data, 'node.data');
    return viewRootLNode;
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
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export function detectChangesInternal(hostView, hostNode, component) {
    var oldView = enterView(hostView, hostNode);
    var hostTView = hostView[TVIEW];
    var template = hostTView.template;
    var viewQuery = hostTView.viewQuery;
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
 *  Initializes the binding start index. Will get inlined.
 *
 *  This function must be called before any binding related function is called
 *  (ie `bind()`, `interpolationX()`, `pureFunctionX()`)
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
 * @param value Value to diff
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
 * {@link reserveSlots}
 */
export function moveBindingIndexToReservedSlot(offset) {
    var currentSlot = viewData[BINDING_INDEX];
    viewData[BINDING_INDEX] = tView.bindingStartIndex - offset;
    return currentSlot;
}
/**
 * Restores the binding index to the given value.
 *
 * This function is typically used to restore the index after a `pureFunctionX` has
 * been executed.
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
 */
export function interpolationV(values) {
    ngDevMode && assertLessThan(2, values.length, 'should have at least 3 values');
    ngDevMode && assertEqual(values.length % 2, 1, 'should have an odd number of values');
    var different = false;
    for (var i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(values[i]) && (different = true);
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
    var different = bindingUpdated(v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var different = bindingUpdated2(v0, v1);
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation bindings with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var different = bindingUpdated2(v0, v1);
    different = bindingUpdated(v2) || different;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var different = bindingUpdated4(v0, v1, v2, v3);
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated(v4) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated2(v4, v5) || different;
    different = bindingUpdated(v6) || different;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var different = bindingUpdated4(v0, v1, v2, v3);
    different = bindingUpdated4(v4, v5, v6, v7) || different;
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
/** Retrieves a value from current `viewData`. */
export function load(index) {
    return loadInternal(index, viewData);
}
/** Retrieves a value from any `LViewData`. */
export function loadInternal(index, arr) {
    ngDevMode && assertDataInRange(index + HEADER_OFFSET, arr);
    return arr[index + HEADER_OFFSET];
}
/** Retrieves a value from the `directives` array. */
export function loadDirective(index) {
    ngDevMode && assertDefined(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, directives);
    return directives[index];
}
/** Gets the current binding value and increments the binding index. */
export function consumeBinding() {
    ngDevMode && assertDataInRange(viewData[BINDING_INDEX]);
    ngDevMode &&
        assertNotEqual(viewData[viewData[BINDING_INDEX]], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[viewData[BINDING_INDEX]++];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    if (viewData[BINDING_INDEX] === -1)
        initBindings();
    var bindingIndex = viewData[BINDING_INDEX];
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
/** Updates binding if changed, then returns the latest value. */
export function checkAndUpdateBinding(value) {
    bindingUpdated(value);
    return value;
}
/** Updates 2 bindings if changed, then returns whether either was updated. */
export function bindingUpdated2(exp1, exp2) {
    var different = bindingUpdated(exp1);
    return bindingUpdated(exp2) || different;
}
/** Updates 4 bindings if changed, then returns whether any was updated. */
export function bindingUpdated4(exp1, exp2, exp3, exp4) {
    var different = bindingUpdated2(exp1, exp2);
    return bindingUpdated2(exp3, exp4) || different;
}
export function getTView() {
    return tView;
}
export function getDirectiveInstance(instanceOrArray) {
    // Directives with content queries store an array in directives[directiveIndex]
    // with the instance as the first index
    return Array.isArray(instanceOrArray) ? instanceOrArray[0] : instanceOrArray;
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
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
function assertDataNext(index, arr) {
    if (arr == null)
        arr = viewData;
    assertEqual(arr.length, index, "index " + index + " expected to be at the end of arr (length " + arr.length + ")");
}
/**
 * On the first template pass, the reserved slots should be set `NO_CHANGE`.
 *
 * If not, they might not have been actually reserved.
 */
export function assertReservedSlotInitialized(slotOffset, numSlots) {
    if (firstTemplatePass) {
        var startIndex = tView.bindingStartIndex - slotOffset;
        for (var i = 0; i < numSlots; i++) {
            assertEqual(viewData[startIndex + i], NO_CHANGE, 'The reserved slots should be set to `NO_CHANGE` on first template pass');
        }
    }
}
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertDefined(component, 'expecting component got null');
    var lElementNode = component[NG_HOST_SYMBOL];
    ngDevMode && assertDefined(component, 'object is not a component');
    return lElementNode;
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
export var ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFJdkIsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN0RyxPQUFPLEVBQUMsMEJBQTBCLEVBQUUseUJBQXlCLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDNUcsT0FBTyxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDNUYsT0FBTyxFQUFDLFlBQVksRUFBYyxhQUFhLEVBQUUsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFdEYsT0FBTyxFQUErQix1QkFBdUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRTlGLE9BQU8sRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBc0IsVUFBVSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBeUIsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFlLFNBQVMsRUFBRSxJQUFJLEVBQVMsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFHeFAsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLHFCQUFx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aEMsV0FBVyxDQUNQLEdBQUcsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFdBQVMsS0FBSyxrREFBNkMsR0FBRyxDQUFDLE1BQU0sTUFBRyxDQUFDLENBQUM7QUFDbkcsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLHdDQUF3QyxVQUFrQixFQUFFLFFBQWdCO0lBQ2hGLElBQUksaUJBQWlCLEVBQUU7UUFDckIsSUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQztRQUN4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2pDLFdBQVcsQ0FDUCxRQUFRLENBQUMsVUFBVSxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsRUFDbkMsd0VBQXdFLENBQUMsQ0FBQztTQUMvRTtLQUNGO0FBQ0gsQ0FBQztBQUVELE1BQU0sd0NBQTJDLFNBQVk7SUFDM0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxTQUFTLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUN0RSxJQUFNLFlBQVksR0FBSSxTQUFpQixDQUFDLGNBQWMsQ0FBaUIsQ0FBQztJQUN4RSxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSwyQkFBMkIsQ0FBQyxDQUFDO0lBQ25FLE9BQU8sWUFBWSxDQUFDO0FBQ3RCLENBQUM7QUFFRCxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDO0FBQzVDLE1BQU0sQ0FBQyxJQUFNLHNCQUFzQixHQUFHLHVCQUF1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdERlZmluZWQsIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBleGVjdXRlSW5pdEhvb2tzLCBxdWV1ZUluaXRIb29rcywgcXVldWVMaWZlY3ljbGVIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgUkVOREVSX1BBUkVOVCwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTFByb2plY3Rpb24sIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05URVhULCBDdXJyZW50TWF0Y2hlc0xpc3QsIERJUkVDVElWRVMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJvb3RDb250ZXh0LCBTQU5JVElaRVIsIFRBSUwsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRBdHRyaWJ1dGVzLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGVUeXBlLCBUTm9kZUZsYWdzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVENvbnRhaW5lck5vZGUsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBURWxlbWVudE5vZGUsfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGluc2VydFZpZXcsIGFwcGVuZFByb2plY3RlZE5vZGUsIHJlbW92ZVZpZXcsIGNhbkluc2VydE5hdGl2ZU5vZGUsIGNyZWF0ZVRleHROb2RlLCBnZXROZXh0TE5vZGUsIGdldENoaWxkTE5vZGUsIGdldFBhcmVudExOb2RlLCBnZXRMVmlld0NoaWxkfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWZJbnRlcm5hbCwgQ29tcG9uZW50VGVtcGxhdGUsIENvbXBvbmVudFF1ZXJ5LCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgUHJvY2VkdXJhbFJlbmRlcmVyMywgUmVuZGVyZXJTdHlsZUZsYWdzMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge2lzRGlmZmVyZW50LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG4vKipcbiAqIERpcmVjdGl2ZSAoRCkgc2V0cyBhIHByb3BlcnR5IG9uIGFsbCBjb21wb25lbnQgaW5zdGFuY2VzIHVzaW5nIHRoaXMgY29uc3RhbnQgYXMgYSBrZXkgYW5kIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBub2RlIChMRWxlbWVudCkgYXMgdGhlIHZhbHVlLiBUaGlzIGlzIHVzZWQgaW4gbWV0aG9kcyBsaWtlIGRldGVjdENoYW5nZXMgdG9cbiAqIGZhY2lsaXRhdGUganVtcGluZyBmcm9tIGFuIGluc3RhbmNlIHRvIHRoZSBob3N0IG5vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBOR19IT1NUX1NZTUJPTCA9ICdfX25nSG9zdExOb2RlX18nO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICpcbiAqIFNhdmVkIGhlcmUgdG8gYXZvaWQgcmUtaW5zdGFudGlhdGluZyBhbiBhcnJheSBvbiBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqXG4gKiBOb3RlOiBFbGVtZW50IGlzIG5vdCBhY3R1YWxseSBzdG9yZWQgYXQgaW5kZXggMCBiZWNhdXNlIG9mIHRoZSBMVmlld0RhdGFcbiAqIGhlYWRlciwgYnV0IHRoZSBob3N0IGJpbmRpbmdzIGZ1bmN0aW9uIGV4cGVjdHMgYW4gaW5kZXggdGhhdCBpcyBOT1QgYWRqdXN0ZWRcbiAqIGJlY2F1c2UgaXQgd2lsbCB1bHRpbWF0ZWx5IGJlIGZlZCB0byBpbnN0cnVjdGlvbnMgbGlrZSBlbGVtZW50UHJvcGVydHkuXG4gKi9cbmNvbnN0IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gWzAsIDBdO1xuXG4vKipcbiAqIFRWaWV3LmRhdGEgbmVlZHMgdG8gZmlsbCB0aGUgc2FtZSBudW1iZXIgb2Ygc2xvdHMgYXMgdGhlIExWaWV3RGF0YSBoZWFkZXJcbiAqIHNvIHRoZSBpbmRpY2VzIG9mIG5vZGVzIGFyZSBjb25zaXN0ZW50IGJldHdlZW4gTFZpZXdEYXRhIGFuZCBUVmlldy5kYXRhLlxuICpcbiAqIEl0J3MgbXVjaCBmYXN0ZXIgdG8ga2VlcCBhIGJsdWVwcmludCBvZiB0aGUgcHJlLWZpbGxlZCBhcnJheSBhbmQgc2xpY2UgaXRcbiAqIHRoYW4gaXQgaXMgdG8gY3JlYXRlIGEgbmV3IGFycmF5IGFuZCBmaWxsIGl0IGVhY2ggdGltZSBhIFRWaWV3IGlzIGNyZWF0ZWQuXG4gKi9cbmNvbnN0IEhFQURFUl9GSUxMRVIgPSBuZXcgQXJyYXkoSEVBREVSX09GRlNFVCkuZmlsbChudWxsKTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gcmVuZGVyZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50U2FuaXRpemVyKCk6IFNhbml0aXplcnxudWxsIHtcbiAgcmV0dXJuIHZpZXdEYXRhICYmIHZpZXdEYXRhW1NBTklUSVpFUl07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWaWV3RGF0YSgpOiBMVmlld0RhdGEge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3RGF0YTtcbn1cblxuLyoqIFVzZWQgdG8gc2V0IHRoZSBwYXJlbnQgcHJvcGVydHkgd2hlbiBub2RlcyBhcmUgY3JlYXRlZC4gKi9cbmxldCBwcmV2aW91c09yUGFyZW50Tm9kZTogTE5vZGU7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpOiBMTm9kZSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnROb2RlO1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxubGV0IHRWaWV3OiBUVmlldztcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJpZXMoUXVlcnlUeXBlOiB7bmV3ICgpOiBMUXVlcmllc30pOiBMUXVlcmllcyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGN1cnJlbnRRdWVyaWVzIHx8IChjdXJyZW50UXVlcmllcyA9IChwcmV2aW91c09yUGFyZW50Tm9kZS5xdWVyaWVzIHx8IG5ldyBRdWVyeVR5cGUoKSkpO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKi9cbmxldCBjcmVhdGlvbk1vZGU6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGlvbk1vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCB2aWV3RGF0YTogTFZpZXdEYXRhO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAqXG4gKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gKi9cbmxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG5mdW5jdGlvbiBnZXRDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3RGF0YSk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3RGF0YSwgaG9zdDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IG9sZFZpZXc6IExWaWV3RGF0YSA9IHZpZXdEYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3W0RJUkVDVElWRVNdO1xuICB0VmlldyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tUVklFV107XG5cbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG5cbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXdbUkVOREVSRVJdO1xuXG4gIGlmIChob3N0ICE9IG51bGwpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGhvc3Q7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICB9XG5cbiAgdmlld0RhdGEgPSBuZXdWaWV3O1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlld1tRVUVSSUVTXTtcblxuICByZXR1cm4gb2xkVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGluIGxpZXUgb2YgZW50ZXJWaWV3IHRvIG1ha2UgaXQgY2xlYXIgd2hlbiB3ZSBhcmUgZXhpdGluZyBhIGNoaWxkIHZpZXcuIFRoaXMgbWFrZXNcbiAqIHRoZSBkaXJlY3Rpb24gb2YgdHJhdmVyc2FsICh1cCBvciBkb3duIHRoZSB2aWV3IHRyZWUpIGEgYml0IGNsZWFyZXIuXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBjcmVhdGlvbk9ubHkgQW4gb3B0aW9uYWwgYm9vbGVhbiB0byBpbmRpY2F0ZSB0aGF0IHRoZSB2aWV3IHdhcyBwcm9jZXNzZWQgaW4gY3JlYXRpb24gbW9kZVxuICogb25seSwgaS5lLiB0aGUgZmlyc3QgdXBkYXRlIHdpbGwgYmUgZG9uZSBsYXRlci4gT25seSBwb3NzaWJsZSBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxlYXZlVmlldyhuZXdWaWV3OiBMVmlld0RhdGEsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcudmlld0hvb2tzLCB0Vmlldy52aWV3Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgdmlld0RhdGFbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkRpcnR5KTtcbiAgfVxuICB2aWV3RGF0YVtGTEFHU10gfD0gTFZpZXdGbGFncy5SdW5Jbml0O1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IC0xO1xuICBlbnRlclZpZXcobmV3VmlldywgbnVsbCk7XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIHRoZSB2aWV3LCBleGVjdXRpbmcgdGhlIGZvbGxvd2luZyBzdGVwcyBpbiB0aGF0IG9yZGVyOlxuICogdHJpZ2dlcnMgaW5pdCBob29rcywgcmVmcmVzaGVzIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MsIHRyaWdnZXJzIGNvbnRlbnQgaG9va3MsIHNldHMgaG9zdFxuICogYmluZGluZ3MsXG4gKiByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hWaWV3KCkge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG4gIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyh2aWV3RGF0YSk7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxuXG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gIHNldEhvc3RCaW5kaW5ncyh0Vmlldy5ob3N0QmluZGluZ3MpO1xuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG4vKiogU2V0cyB0aGUgaG9zdCBiaW5kaW5ncyBmb3IgdGhlIGN1cnJlbnQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIb3N0QmluZGluZ3MoYmluZGluZ3M6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoYmluZGluZ3MgIT0gbnVsbCkge1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5ncy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlySW5kZXggPSBiaW5kaW5nc1tpXTtcbiAgICAgIGNvbnN0IGRlZiA9IGRlZnNbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICYmIGRlZi5ob3N0QmluZGluZ3MoZGlySW5kZXgsIGJpbmRpbmdzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldLCBjb21wb25lbnRzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIHJldHVybiBbXG4gICAgdFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0Vmlld1xuICAgIHZpZXdEYXRhLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLlJ1bkluaXQsICAvLyBmbGFnc1xuICAgIG51bGwgISwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaG9zdE5vZGVcbiAgICAtMSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJpbmRpbmdJbmRleFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGlyZWN0aXZlc1xuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xlYW51cEluc3RhbmNlc1xuICAgIGNvbnRleHQsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGV4dFxuICAgIHZpZXdEYXRhICYmIHZpZXdEYXRhW0lOSkVDVE9SXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5qZWN0b3JcbiAgICByZW5kZXJlciwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJlbmRlcmVyXG4gICAgc2FuaXRpemVyIHx8IG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzYW5pdGl6ZXJcbiAgICBudWxsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRhaWxcbiAgXTtcbn1cblxuLyoqXG4gKiBDcmVhdGlvbiBvZiBMTm9kZSBvYmplY3QgaXMgZXh0cmFjdGVkIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gc28gd2UgYWx3YXlzIGNyZWF0ZSBMTm9kZSBvYmplY3RcbiAqIHdpdGggdGhlIHNhbWUgc2hhcGVcbiAqIChzYW1lIHByb3BlcnRpZXMgYXNzaWduZWQgaW4gdGhlIHNhbWUgb3JkZXIpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBwYXJlbnQ6IExOb2RlIHwgbnVsbCxcbiAgICBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsIHN0YXRlOiBhbnksXG4gICAgcXVlcmllczogTFF1ZXJpZXMgfCBudWxsKTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgcmV0dXJuIHtcbiAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksXG4gICAgdmlldzogY3VycmVudFZpZXcsXG4gICAgbm9kZUluamVjdG9yOiBwYXJlbnQgPyBwYXJlbnQubm9kZUluamVjdG9yIDogbnVsbCxcbiAgICBkYXRhOiBzdGF0ZSxcbiAgICBxdWVyaWVzOiBxdWVyaWVzLFxuICAgIHROb2RlOiBudWxsICEsXG4gICAgcE5leHRPclBhcmVudDogbnVsbCxcbiAgICBkeW5hbWljTENvbnRhaW5lck5vZGU6IG51bGwsXG4gICAgZHluYW1pY1BhcmVudDogbnVsbCxcbiAgICBwQ2hpbGQ6IG51bGwsXG4gIH07XG59XG5cbi8qKlxuICogQSBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHRoZSBMTm9kZSB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlbSBoYXZlIHNhbWUgc2hhcGUgdG9cbiAqIGtlZXAgdGhlIGV4ZWN1dGlvbiBjb2RlIG1vbm9tb3JwaGljIGFuZCBmYXN0LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIExOb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIExOb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgTE5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gZGF0YSBBbnkgZGF0YSB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiB0aGUgTE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIGxWaWV3RGF0YT86IExWaWV3RGF0YSB8IG51bGwpOiBMRWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlZpZXcsIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IG51bGwsXG4gICAgbFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBsQ29udGFpbmVyOiBMQ29udGFpbmVyKTogTENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBsUHJvamVjdGlvbjogTFByb2plY3Rpb24pOiBMUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgc3RhdGU/OiBudWxsIHwgTFZpZXdEYXRhIHwgTENvbnRhaW5lciB8IExQcm9qZWN0aW9uKTogTEVsZW1lbnROb2RlJlxuICAgIExUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgY29uc3QgcGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgJiYgZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICFhcyBMTm9kZTtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHRQYXJlbnQgPVxuICAgICAgcGFyZW50ICYmIHBhcmVudC52aWV3ID09PSB2aWV3RGF0YSA/IHBhcmVudC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGxldCBxdWVyaWVzID1cbiAgICAgIChpc1BhcmVudCA/IGN1cnJlbnRRdWVyaWVzIDogcHJldmlvdXNPclBhcmVudE5vZGUgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcykgfHxcbiAgICAgIHBhcmVudCAmJiBwYXJlbnQucXVlcmllcyAmJiBwYXJlbnQucXVlcmllcy5jaGlsZCgpO1xuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCB2aWV3RGF0YSwgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsLCBxdWVyaWVzKTtcblxuICBpZiAoaW5kZXggPT09IC0xIHx8IHR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gICAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIFRWaWV3Lm5vZGUuXG4gICAgbm9kZS50Tm9kZSA9IChzdGF0ZSA/IChzdGF0ZSBhcyBMVmlld0RhdGEpW1RWSUVXXS5ub2RlIDogbnVsbCkgfHxcbiAgICAgICAgY3JlYXRlVE5vZGUodHlwZSwgaW5kZXgsIG51bGwsIG51bGwsIHRQYXJlbnQsIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG5cbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChhZGp1c3RlZEluZGV4KTtcbiAgICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IG5vZGU7XG5cbiAgICAvLyBFdmVyeSBub2RlIGFkZHMgYSB2YWx1ZSB0byB0aGUgc3RhdGljIGRhdGEgYXJyYXkgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXlcbiAgICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0RGF0YS5sZW5ndGgpIHtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgICAgIGNyZWF0ZVROb2RlKHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzLCB0UGFyZW50LCBudWxsKTtcbiAgICAgIGlmICghaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudE5vZGUpIHtcbiAgICAgICAgY29uc3QgcHJldmlvdXNUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuICAgICAgICBwcmV2aW91c1ROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgICAgaWYgKHByZXZpb3VzVE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUpIHByZXZpb3VzVE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgICBub2RlLnROb2RlID0gdERhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGU7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9PSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnZpZXcgPT09IHZpZXdEYXRhIHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIHNldCBob3N0IG5vZGVzIGxhdGVyKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICBjb25zdCBsVmlld0RhdGEgPSBzdGF0ZSBhcyBMVmlld0RhdGE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdERlZmluZWQoXG4gICAgICAgICAgICAgICAgICAgICBsVmlld0RhdGFbSE9TVF9OT0RFXSwgJ2xWaWV3RGF0YVtIT1NUX05PREVdIHNob3VsZCBub3QgaGF2ZSBiZWVuIGluaXRpYWxpemVkJyk7XG4gICAgbFZpZXdEYXRhW0hPU1RfTk9ERV0gPSBub2RlO1xuICAgIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgbFZpZXdEYXRhW1RWSUVXXS5ub2RlID0gbm9kZS50Tm9kZTtcbiAgfVxuXG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVzZXRzIHRoZSBhcHBsaWNhdGlvbiBzdGF0ZS5cbiAqL1xuZnVuY3Rpb24gcmVzZXRBcHBsaWNhdGlvblN0YXRlKCkge1xuICBpc1BhcmVudCA9IGZhbHNlO1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG51bGwgITtcbn1cblxuLyoqXG4gKlxuICogQHBhcmFtIGhvc3ROb2RlIEV4aXN0aW5nIG5vZGUgdG8gcmVuZGVyIGludG8uXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+LCBjb250ZXh0OiBULFxuICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBob3N0OiBMRWxlbWVudE5vZGUgfCBudWxsLFxuICAgIGRpcmVjdGl2ZXM/OiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM/OiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIGlmIChob3N0ID09IG51bGwpIHtcbiAgICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgICByZW5kZXJlckZhY3RvcnkgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTtcbiAgICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcodGVtcGxhdGUsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCk7XG4gICAgaG9zdCA9IGNyZWF0ZUxOb2RlKFxuICAgICAgICAtMSwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLFxuICAgICAgICBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgICAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKSwgdFZpZXcsIHt9LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgICAgc2FuaXRpemVyKSk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdCwgaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgcmV0dXJuIGhvc3Q7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgY3JlYXRpbmcgdGhlIExWaWV3Tm9kZSBvZiBhIGR5bmFtaWMgZW1iZWRkZWQgdmlldyxcbiAqIGVpdGhlciB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkgb3IgVGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkuXG4gKiBTdWNoIGxWaWV3Tm9kZSB3aWxsIHRoZW4gYmUgcmVuZGVyZXIgd2l0aCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgKHNlZSBiZWxvdykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbWJlZGRlZFZpZXdOb2RlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgcmVuZGVyZXI6IFJlbmRlcmVyMywgcXVlcmllcz86IExRdWVyaWVzIHwgbnVsbCk6IExWaWV3Tm9kZSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGlzUGFyZW50O1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG51bGwgITtcblxuICBjb25zdCBsVmlldyA9XG4gICAgICBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIHRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgY29uc3Qgdmlld05vZGUgPSBjcmVhdGVMTm9kZSgtMSwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIGxWaWV3KTtcblxuICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBfcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIHJldHVybiB2aWV3Tm9kZTtcbn1cblxuLyoqXG4gKiBVc2VkIGZvciByZW5kZXJpbmcgZW1iZWRkZWQgdmlld3MgKGUuZy4gZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cylcbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG11c3Qgc3RvcmUvcmV0cmlldmUgdGhlaXIgVFZpZXdzIGRpZmZlcmVudGx5IGZyb20gY29tcG9uZW50IHZpZXdzXG4gKiBiZWNhdXNlIHRoZWlyIHRlbXBsYXRlIGZ1bmN0aW9ucyBhcmUgbmVzdGVkIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgb2YgdGhlaXIgaG9zdHMsIGNyZWF0aW5nXG4gKiBjbG9zdXJlcy4gSWYgdGhlaXIgaG9zdCB0ZW1wbGF0ZSBoYXBwZW5zIHRvIGJlIGFuIGVtYmVkZGVkIHRlbXBsYXRlIGluIGEgbG9vcCAoZS5nLiBuZ0ZvciBpbnNpZGVcbiAqIGFuIG5nRm9yKSwgdGhlIG5lc3Rpbmcgd291bGQgbWVhbiB3ZSdkIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgc28gd2VcbiAqIGNhbid0IHN0b3JlIFRWaWV3cyBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gaXRzZWxmIChhcyB3ZSBkbyBmb3IgY29tcHMpLiBJbnN0ZWFkLCB3ZSBzdG9yZSB0aGVcbiAqIFRWaWV3IGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG9uIHRoZWlyIGhvc3QgVE5vZGUsIHdoaWNoIG9ubHkgaGFzIG9uZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckVtYmVkZGVkVGVtcGxhdGU8VD4oXG4gICAgdmlld05vZGU6IExWaWV3Tm9kZSwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCByZjogUmVuZGVyRmxhZ3MpOiBMVmlld05vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlld0RhdGE7XG4gIHRyeSB7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3Tm9kZS5kYXRhLCB2aWV3Tm9kZSk7XG4gICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgIHRWaWV3LnRlbXBsYXRlICEocmYsIGNvbnRleHQpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgcmVmcmVzaFZpZXcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmlld05vZGUuZGF0YVtUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlIGluIGZhY3QsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSwgY29tcG9uZW50T3JDb250ZXh0OiBULFxuICAgIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0Vmlldywgbm9kZSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnRPckNvbnRleHQgISk7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaCgwLCBIRUFERVJfT0ZGU0VUKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCxcbiAgICBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiBSRWxlbWVudCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodmlld0RhdGFbQklORElOR19JTkRFWF0sIC0xLCAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSwgX2N1cnJlbnROYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIGlmIChfY3VycmVudE5hbWVzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCBub2RlOiBMRWxlbWVudE5vZGUgPVxuICAgICAgY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCwgbnVsbCk7XG5cbiAgaWYgKGF0dHJzKSBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCBuYXRpdmUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xuICByZXR1cm4gbmF0aXZlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcyBhbmQgcG9wdWxhdGVzIGxvY2FsIHJlZnMuXG4gKlxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBjdXJyZW50IG5vZGVcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpIHtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUuZmlyc3RUZW1wbGF0ZVBhc3MrKztcbiAgICBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUobm9kZS50Tm9kZSwgdFZpZXcsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpO1xuICB9XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSgpO1xufVxuXG4vKipcbiAqIE9uIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHdlIG1hdGNoIGVhY2ggbm9kZSBhZ2FpbnN0IGF2YWlsYWJsZSBkaXJlY3RpdmUgc2VsZWN0b3JzIGFuZCBzYXZlXG4gKiB0aGUgcmVzdWx0aW5nIGRlZnMgaW4gdGhlIGNvcnJlY3QgaW5zdGFudGlhdGlvbiBvcmRlciBmb3Igc3Vic2VxdWVudCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnNcbiAqIChzbyBkZXBlbmRlbmNpZXMgYXJlIGFsd2F5cyBjcmVhdGVkIGJlZm9yZSB0aGUgZGlyZWN0aXZlcyB0aGF0IGluamVjdCB0aGVtKS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpbiB0c2lja2xlLlxuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgY29uc3QgbWF0Y2hlcyA9IHRWaWV3LmN1cnJlbnRNYXRjaGVzID0gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGUpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgY29uc3QgdmFsdWVJbmRleCA9IGkgKyAxO1xuICAgICAgcmVzb2x2ZURpcmVjdGl2ZShkZWYsIHZhbHVlSW5kZXgsIG1hdGNoZXMsIHRWaWV3KTtcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAobWF0Y2hlc1t2YWx1ZUluZGV4XSBhcyBudW1iZXIsIGRlZiwgZXhwb3J0c01hcCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPGFueT4pLnRlbXBsYXRlKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgICAgIChtYXRjaGVzIHx8IChtYXRjaGVzID0gW10pKS5wdXNoKGRlZiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzIGFzIEN1cnJlbnRNYXRjaGVzTGlzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+LCB2YWx1ZUluZGV4OiBudW1iZXIsIG1hdGNoZXM6IEN1cnJlbnRNYXRjaGVzTGlzdCxcbiAgICB0VmlldzogVFZpZXcpOiBhbnkge1xuICBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gbnVsbCkge1xuICAgIG1hdGNoZXNbdmFsdWVJbmRleF0gPSBDSVJDVUxBUjtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGRlZi5mYWN0b3J5KCk7XG4gICAgKHRWaWV3LmRpcmVjdGl2ZXMgfHwgKHRWaWV3LmRpcmVjdGl2ZXMgPSBbXSkpLnB1c2goZGVmKTtcbiAgICByZXR1cm4gZGlyZWN0aXZlQ3JlYXRlKG1hdGNoZXNbdmFsdWVJbmRleF0gPSB0Vmlldy5kaXJlY3RpdmVzICEubGVuZ3RoIC0gMSwgaW5zdGFuY2UsIGRlZik7XG4gIH0gZWxzZSBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gQ0lSQ1VMQVIpIHtcbiAgICAvLyBJZiB3ZSByZXZpc2l0IHRoaXMgZGlyZWN0aXZlIGJlZm9yZSBpdCdzIHJlc29sdmVkLCB3ZSBrbm93IGl0J3MgY2lyY3VsYXJcbiAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihkZWYudHlwZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZnVuY3Rpb24gcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2goZGlySW5kZXgsIHZpZXdEYXRhLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgZGlyZWN0aXZlIGFuZCBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIGJpbmRpbmcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIC8vIE11c3Qgc3VidHJhY3QgdGhlIGhlYWRlciBvZmZzZXQgYmVjYXVzZSBob3N0QmluZGluZ3MgZnVuY3Rpb25zIGFyZSBnZW5lcmF0ZWQgd2l0aFxuICAvLyBpbnN0cnVjdGlvbnMgdGhhdCBleHBlY3QgZWxlbWVudCBpbmRpY2VzIHRoYXQgYXJlIE5PVCBhZGp1c3RlZCAoZS5nLiBlbGVtZW50UHJvcGVydHkpLlxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gICh0Vmlldy5ob3N0QmluZGluZ3MgfHwgKHRWaWV3Lmhvc3RCaW5kaW5ncyA9IFtcbiAgIF0pKS5wdXNoKGRpckluZGV4LCB2aWV3RGF0YS5sZW5ndGggLSAxIC0gSEVBREVSX09GRlNFVCk7XG59XG5cbi8qKiBTZXRzIHRoZSBjb250ZXh0IGZvciBhIENoYW5nZURldGVjdG9yUmVmIHRvIHRoZSBnaXZlbiBpbnN0YW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKFxuICAgIGluamVjdG9yOiBMSW5qZWN0b3IgfCBudWxsLCBpbnN0YW5jZTogYW55LCB2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgaWYgKGluamVjdG9yICYmIGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmICE9IG51bGwpIHtcbiAgICAoaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld1JlZjxhbnk+KS5fc2V0Q29tcG9uZW50Q29udGV4dCh2aWV3LCBpbnN0YW5jZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpbnN0YW50aWF0ZXMgdGhlIGdpdmVuIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCkge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuICBjb25zdCBjb3VudCA9IHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBjb25zdCB0RGlyZWN0aXZlcyA9IHRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4gPSB0RGlyZWN0aXZlc1tpXTtcbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSBleHBvcnRzTWFwW2RlZi5leHBvcnRBc10gPSBpbmRleDtcbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWZJbnRlcm5hbDxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3RGF0YSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/IHByZXZpb3VzT3JQYXJlbnROb2RlLm5hdGl2ZSA6IGRpcmVjdGl2ZXMgIVtpbmRleF07XG4gICAgICB2aWV3RGF0YS5wdXNoKHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIHRlbXBsYXRlIFRoZSB0ZW1wbGF0ZSBmcm9tIHdoaWNoIHRvIGdldCBzdGF0aWMgZGF0YVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlVFZpZXcoXG4gICAgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhIHx8XG4gICAgICAodGVtcGxhdGUubmdQcml2YXRlRGF0YSA9IGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZSwgZGlyZWN0aXZlcywgcGlwZXMsIHZpZXdRdWVyeSkgYXMgbmV2ZXIpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIHZpZXdCbG9ja0lkIGZvciBpbmxpbmUgdmlld3MsIG9yIC0xIGlmIGl0J3MgYSBjb21wb25lbnQvZHluYW1pY1xuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICByZXR1cm4ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBIRUFERVJfRklMTEVSLnNsaWNlKCksICAvLyBGaWxsIGluIHRvIG1hdGNoIEhFQURFUl9PRkZTRVQgaW4gTFZpZXdEYXRhXG4gICAgY2hpbGRJbmRleDogLTEsICAgICAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IC0xLCAgICAgICAgLy8gU2V0IGluIGluaXRCaW5kaW5ncygpXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICBpbml0SG9va3M6IG51bGwsXG4gICAgY2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBwaXBlRGVzdHJveUhvb2tzOiBudWxsLFxuICAgIGNsZWFudXA6IG51bGwsXG4gICAgaG9zdEJpbmRpbmdzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBjdXJyZW50TWF0Y2hlczogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICBpZiAoYXR0ck5hbWUgPT09IE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKSB7XG4gICAgICBpICs9IDI7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBOYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpICsgMl0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDNdIGFzIHN0cmluZztcbiAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCwgbmFtZXNwYWNlVVJJKSA6XG4gICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgIGkgKz0gNDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFN0YW5kYXJkIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2kgKyAxXTtcbiAgICAgICAgaXNQcm9jID9cbiAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgIC5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKSA6XG4gICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpO1xuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSgtMSk7XG4gIHJlbmRlcmVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBob3N0IExOb2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqXG4gKiBAcmV0dXJucyBMRWxlbWVudE5vZGUgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaG9zdEVsZW1lbnQoXG4gICAgdGFnOiBzdHJpbmcsIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8YW55PixcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShcbiAgICAgIDAsIFROb2RlVHlwZS5FbGVtZW50LCByTm9kZSwgbnVsbCwgbnVsbCxcbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICByZW5kZXJlciwgZ2V0T3JDcmVhdGVUVmlldyhkZWYudGVtcGxhdGUsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpLFxuICAgICAgICAgIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbm9kZS50Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgdFZpZXcuZGlyZWN0aXZlcyA9IFtkZWZdO1xuICB9XG5cbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLyoqXG4gKiBBZGRzIGFuIGV2ZW50IGxpc3RlbmVyIHRvIHRoZSBjdXJyZW50IG5vZGUuXG4gKlxuICogSWYgYW4gb3V0cHV0IGV4aXN0cyBvbiBvbmUgb2YgdGhlIG5vZGUncyBkaXJlY3RpdmVzLCBpdCBhbHNvIHN1YnNjcmliZXMgdG8gdGhlIG91dHB1dFxuICogYW5kIHNhdmVzIHRoZSBzdWJzY3JpcHRpb24gZm9yIGxhdGVyIGNsZWFudXAuXG4gKlxuICogQHBhcmFtIGV2ZW50TmFtZSBOYW1lIG9mIHRoZSBldmVudFxuICogQHBhcmFtIGxpc3RlbmVyRm4gVGhlIGZ1bmN0aW9uIHRvIGJlIGNhbGxlZCB3aGVuIGV2ZW50IGVtaXRzXG4gKiBAcGFyYW0gdXNlQ2FwdHVyZSBXaGV0aGVyIG9yIG5vdCB0byB1c2UgY2FwdHVyZSBpbiBldmVudCBsaXN0ZW5lci5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZSBhcyBSRWxlbWVudDtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcblxuICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyh2aWV3RGF0YSwgbGlzdGVuZXJGbik7XG4gICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKG5hdGl2ZSwgZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIpO1xuICAgIHN0b3JlQ2xlYW51cEZuKHZpZXdEYXRhLCBjbGVhbnVwRm4pO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQodmlld0RhdGEsIGxpc3RlbmVyRm4pO1xuICAgIG5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICBjb25zdCBjbGVhbnVwSW5zdGFuY2VzID0gZ2V0Q2xlYW51cCh2aWV3RGF0YSk7XG4gICAgY2xlYW51cEluc3RhbmNlcy5wdXNoKHdyYXBwZWRMaXN0ZW5lcik7XG4gICAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICBnZXRUVmlld0NsZWFudXAodmlld0RhdGEpLnB1c2goXG4gICAgICAgICAgZXZlbnROYW1lLCBub2RlLnROb2RlLmluZGV4LCBjbGVhbnVwSW5zdGFuY2VzICEubGVuZ3RoIC0gMSwgdXNlQ2FwdHVyZSk7XG4gICAgfVxuICB9XG5cbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gbm9kZS50Tm9kZTtcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgb3V0cHV0RGF0YTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKG91dHB1dHMgJiYgKG91dHB1dERhdGEgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY3JlYXRlT3V0cHV0KG91dHB1dERhdGEsIGxpc3RlbmVyRm4pO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGV2ZW50IG5hbWUgYW5kIHN1YnNjcmliZXMgdG9cbiAqIGVhY2ggb3V0cHV0LlxuICovXG5mdW5jdGlvbiBjcmVhdGVPdXRwdXQob3V0cHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKG91dHB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGRpcmVjdGl2ZXMgIVtvdXRwdXRzW2ldIGFzIG51bWJlcl1bb3V0cHV0c1tpICsgMV1dLnN1YnNjcmliZShsaXN0ZW5lcik7XG4gICAgc3RvcmVDbGVhbnVwV2l0aENvbnRleHQodmlld0RhdGEsIHN1YnNjcmlwdGlvbiwgc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQoXG4gICAgdmlldzogTFZpZXdEYXRhIHwgbnVsbCwgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGlmICghdmlldykgdmlldyA9IHZpZXdEYXRhO1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuLCB2aWV3W0NMRUFOVVBdICEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXdEYXRhLCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFbmQoKSB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpIGFzIExFbGVtZW50Tm9kZTtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgcXVlcmllcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnF1ZXJpZXM7XG4gIHF1ZXJpZXMgJiYgcXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncywgdFZpZXcpO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHJlbW92ZXMgYW4gYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG51bWJlciBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZShcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcj86IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgZWxlbWVudDogTEVsZW1lbnROb2RlID0gbG9hZChpbmRleCk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5uYXRpdmUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBjb25zdCBzdHJWYWx1ZSA9IHNhbml0aXplciA9PSBudWxsID8gc3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSk7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudC5uYXRpdmUsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIEVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09PSBOT19DSEFOR0UpIHJldHVybjtcbiAgY29uc3Qgbm9kZSA9IGxvYWQoaW5kZXgpIGFzIExFbGVtZW50Tm9kZTtcbiAgY29uc3QgdE5vZGUgPSBub2RlLnROb2RlO1xuICAvLyBpZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhub2RlLnROb2RlLmZsYWdzLCBCaW5kaW5nRGlyZWN0aW9uLklucHV0KTtcbiAgfVxuXG4gIGNvbnN0IGlucHV0RGF0YSA9IHROb2RlICYmIHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKGlucHV0RGF0YSAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBtYXJrRGlydHlJZk9uUHVzaChub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShuYXRpdmUsIHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUuc2V0UHJvcGVydHkgPyBuYXRpdmUuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGFkanVzdGVkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBvZiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHR5cGU6IFROb2RlVHlwZSwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLFxuICAgIHBhcmVudDogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCB0Vmlld3M6IFRWaWV3W10gfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBpbmRleDogYWRqdXN0ZWRJbmRleCxcbiAgICBmbGFnczogMCxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIGF0dHJzOiBhdHRycyxcbiAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRzOiB1bmRlZmluZWQsXG4gICAgdFZpZXdzOiB0Vmlld3MsXG4gICAgbmV4dDogbnVsbCxcbiAgICBjaGlsZDogbnVsbCxcbiAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICBkeW5hbWljQ29udGFpbmVyTm9kZTogbnVsbCxcbiAgICBkZXRhY2hlZDogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEdpdmVuIGEgbGlzdCBvZiBkaXJlY3RpdmUgaW5kaWNlcyBhbmQgbWluaWZpZWQgaW5wdXQgbmFtZXMsIHNldHMgdGhlXG4gKiBpbnB1dCBwcm9wZXJ0aWVzIG9uIHRoZSBjb3JyZXNwb25kaW5nIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGlucHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgZGlyZWN0aXZlcyAhW2lucHV0c1tpXSBhcyBudW1iZXJdW2lucHV0c1tpICsgMV1dID0gdmFsdWU7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSBudW1iZXIgbE5vZGVGbGFncyBsb2dpY2FsIG5vZGUgZmxhZ3NcbiAqIEBwYXJhbSBEaXJlY3Rpb24gZGlyZWN0aW9uIHdoZXRoZXIgdG8gY29uc2lkZXIgaW5wdXRzIG9yIG91dHB1dHNcbiAqIEByZXR1cm5zIFByb3BlcnR5QWxpYXNlc3xudWxsIGFnZ3JlZ2F0ZSBvZiBhbGwgcHJvcGVydGllcyBpZiBhbnksIGBudWxsYCBvdGhlcndpc2VcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoXG4gICAgdE5vZGVGbGFnczogVE5vZGVGbGFncywgZGlyZWN0aW9uOiBCaW5kaW5nRGlyZWN0aW9uKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBjb25zdCBjb3VudCA9IHROb2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuXG4gIGlmIChjb3VudCA+IDApIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBjb25zdCBpc0lucHV0ID0gZGlyZWN0aW9uID09PSBCaW5kaW5nRGlyZWN0aW9uLklucHV0O1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kaXJlY3RpdmVzICE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBBZGQgb3IgcmVtb3ZlIGEgY2xhc3MgaW4gYSBgY2xhc3NMaXN0YCBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBbY2xhc3MuZm9vXT1cImV4cFwiIGNhc2VcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIGNsYXNzTmFtZSBOYW1lIG9mIGNsYXNzIHRvIHRvZ2dsZS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIGluZGljYXRpbmcgaWYgYSBnaXZlbiBjbGFzcyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzc05hbWVkPFQ+KGluZGV4OiBudW1iZXIsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxFbGVtZW50ID0gbG9hZChpbmRleCkgYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhsRWxlbWVudC5uYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbEVsZW1lbnQubmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYGNsYXNzTmFtZWAgcHJvcGVydHkgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzc109XCJleHBcImAgdXNhZ2UuXG4gKlxuICogYGVsZW1lbnRDbGFzc2AgaW5zdHJ1Y3Rpb24gd3JpdGVzIHRoZSB2YWx1ZSB0byB0aGUgXCJlbGVtZW50J3NcIiBgY2xhc3NOYW1lYCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBhIHNldCBvZiBjbGFzc2VzIHdoaWNoIHNob3VsZCBiZSBhcHBsaWVkLiBUaGUgbWV0aG9kIG92ZXJyaWRlc1xuICogICBhbnkgZXhpc3RpbmcgY2xhc3Nlcy4gVGhlIHZhbHVlIGlzIHN0cmluZ2lmaWVkIChgdG9TdHJpbmdgKSBiZWZvcmUgaXQgaXMgYXBwbGllZCB0byB0aGVcbiAqICAgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzczxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgY2xhc3NOYW1lYC4gSW4gdGhlXG4gICAgLy8gZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50OiBMRWxlbWVudE5vZGUgPSBsb2FkKGluZGV4KTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0Q2xhc3NOYW1lKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnY2xhc3NOYW1lJywgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ2NsYXNzTmFtZSddID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGdpdmVuIHN0eWxlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHRyYW5zZm9ybSB0aGUgdmFsdWUgdHlwaWNhbGx5IHVzZWQgZm9yXG4gKiAgICAgICAgc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzdWZmaXg/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXhPclNhbml0aXplcj86IHN0cmluZyB8IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGxvYWQoaW5kZXgpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10ucmVtb3ZlUHJvcGVydHkoc3R5bGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN0clZhbHVlID1cbiAgICAgICAgICB0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ2Z1bmN0aW9uJyA/IHN1ZmZpeE9yU2FuaXRpemVyKHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09ICdzdHJpbmcnKSBzdHJWYWx1ZSA9IHN0clZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIHN0clZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgbEVsZW1lbnQubmF0aXZlWydzdHlsZSddLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYHN0eWxlYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIExWaWV3RGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHN0eWxlIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICogICBUaGUgZXhwZWN0ZWQgc2hhcGUgb2YgYHZhbHVlYCBpcyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgc3R5bGUgbmFtZXMgYW5kIHRoZSB2YWx1ZXNcbiAqICAgYXJlIHRoZWlyIGNvcnJlc3BvbmRpbmcgdmFsdWVzIHRvIHNldC4gSWYgdmFsdWUgaXMgZmFsc3ksIHRoZW4gdGhlIHN0eWxlIGlzIHJlbW92ZWQuIEFuIGFic2VuY2VcbiAqICAgb2Ygc3R5bGUgZG9lcyBub3QgY2F1c2UgdGhhdCBzdHlsZSB0byBiZSByZW1vdmVkLiBgTk9fQ0hBTkdFYCBpbXBsaWVzIHRoYXQgbm8gdXBkYXRlIHNob3VsZCBiZVxuICogICBwZXJmb3JtZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgdmFsdWU6IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gVE9ETzogVGhpcyBpcyBhIG5haXZlIGltcGxlbWVudGF0aW9uIHdoaWNoIHNpbXBseSB3cml0ZXMgdmFsdWUgdG8gdGhlIGBzdHlsZWAuIEluIHRoZSBmdXR1cmVcbiAgICAvLyB3ZSB3aWxsIGFkZCBsb2dpYyBoZXJlIHdoaWNoIHdvdWxkIHdvcmsgd2l0aCB0aGUgYW5pbWF0aW9uIGNvZGUuXG4gICAgY29uc3QgbEVsZW1lbnQgPSBsb2FkKGluZGV4KSBhcyBMRWxlbWVudE5vZGU7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShsRWxlbWVudC5uYXRpdmUsICdzdHlsZScsIHZhbHVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3R5bGUgPSBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ107XG4gICAgICBmb3IgKGxldCBpID0gMCwga2V5cyA9IE9iamVjdC5rZXlzKHZhbHVlKTsgaSA8IGtleXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3Qgc3R5bGVOYW1lOiBzdHJpbmcgPSBrZXlzW2ldO1xuICAgICAgICBjb25zdCBzdHlsZVZhbHVlOiBhbnkgPSAodmFsdWUgYXMgYW55KVtzdHlsZU5hbWVdO1xuICAgICAgICBpZiAoc3R5bGVWYWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZVN0eWxlKys7XG4gICAgICAgICAgc3R5bGUucmVtb3ZlUHJvcGVydHkoc3R5bGVOYW1lKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgICAgICBzdHlsZS5zZXRQcm9wZXJ0eShzdHlsZU5hbWUsIHN0eWxlVmFsdWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFRleHRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSwgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0Tm9kZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHROb2RlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGFwcGVuZENoaWxkKGdldFBhcmVudExOb2RlKG5vZGUpLCB0ZXh0Tm9kZSwgdmlld0RhdGEpO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0ZXh0IG5vZGUgd2l0aCBiaW5kaW5nXG4gKiBCaW5kaW5ncyBzaG91bGQgYmUgaGFuZGxlZCBleHRlcm5hbGx5IHdpdGggdGhlIHByb3BlciBpbnRlcnBvbGF0aW9uKDEtOCkgbWV0aG9kXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5LlxuICogQHBhcmFtIHZhbHVlIFN0cmluZ2lmaWVkIHZhbHVlIHRvIHdyaXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmc8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBjb25zdCBleGlzdGluZ05vZGUgPSBsb2FkKGluZGV4KSBhcyBMVGV4dE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZXhpc3RpbmdOb2RlLCAnTE5vZGUgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nTm9kZS5uYXRpdmUudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RpdmUuXG4gKlxuICogTk9URTogZGlyZWN0aXZlcyBjYW4gYmUgY3JlYXRlZCBpbiBvcmRlciBvdGhlciB0aGFuIHRoZSBpbmRleCBvcmRlci4gVGhleSBjYW4gYWxzb1xuICogICAgICAgYmUgcmV0cmlldmVkIGJlZm9yZSB0aGV5IGFyZSBjcmVhdGVkIGluIHdoaWNoIGNhc2UgdGhlIHZhbHVlIHdpbGwgYmUgbnVsbC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIFRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIERpcmVjdGl2ZURlZiBvYmplY3Qgd2hpY2ggY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCxcbiAgICBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZkludGVybmFsPFQ+fCBDb21wb25lbnREZWZJbnRlcm5hbDxUPik6IFQge1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoaW5kZXgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlJyk7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgY29uc3QgaXNDb21wb25lbnQgPSAoZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+KS50ZW1wbGF0ZTtcbiAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgYWRkQ29tcG9uZW50TG9naWMoaW5kZXgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZkludGVybmFsPFQ+KTtcbiAgfVxuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgcXVldWVJbml0SG9va3MoaW5kZXgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCB0Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGluZGV4KTtcbiAgfVxuXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhpbmRleCwgaW5zdGFuY2UsIGRpcmVjdGl2ZURlZi5pbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmluZGV4IGFzIG51bWJlcixcbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShcbiAgICAgICAgICByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIocHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIGFzIFJFbGVtZW50LCBkZWYucmVuZGVyZXJUeXBlKSxcbiAgICAgICAgICB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSkpO1xuXG4gIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBob3N0IG5vZGUvZGF0YSBoZXJlIGJlY2F1c2Ugd2hlbiB0aGUgY29tcG9uZW50IExOb2RlIHdhcyBjcmVhdGVkLFxuICAvLyB3ZSBkaWRuJ3QgeWV0IGtub3cgaXQgd2FzIGEgY29tcG9uZW50IChqdXN0IGFuIGVsZW1lbnQpLlxuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXN7ZGF0YTogTFZpZXdEYXRhfSkuZGF0YSA9IGNvbXBvbmVudFZpZXc7XG4gIChjb21wb25lbnRWaWV3IGFzIExWaWV3RGF0YSlbSE9TVF9OT0RFXSA9IHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExFbGVtZW50Tm9kZTtcblxuICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKHByZXZpb3VzT3JQYXJlbnROb2RlLm5vZGVJbmplY3RvciwgaW5zdGFuY2UsIGNvbXBvbmVudFZpZXcpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKGRpcmVjdGl2ZUluZGV4KTtcbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBkaXJlY3RpdmVDcmVhdGUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudFxuICpcbiAqIFRoaXMgdmVyc2lvbiBkb2VzIG5vdCBjb250YWluIGZlYXR1cmVzIHRoYXQgd2UgZG9uJ3QgYWxyZWFkeSBzdXBwb3J0IGF0IHJvb3QgaW5cbiAqIGN1cnJlbnQgQW5ndWxhci4gRXhhbXBsZTogbG9jYWwgcmVmcyBhbmQgaW5wdXRzIG9uIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmFzZURpcmVjdGl2ZUNyZWF0ZTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBkaXJlY3RpdmU6IFQsXG4gICAgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxUPnwgQ29tcG9uZW50RGVmSW50ZXJuYWw8VD4pOiBUIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcblxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoXG4gICAgICBkaXJlY3RpdmUsIE5HX0hPU1RfU1lNQk9MLCB7ZW51bWVyYWJsZTogZmFsc2UsIHZhbHVlOiBwcmV2aW91c09yUGFyZW50Tm9kZX0pO1xuXG4gIGlmIChkaXJlY3RpdmVzID09IG51bGwpIHZpZXdEYXRhW0RJUkVDVElWRVNdID0gZGlyZWN0aXZlcyA9IFtdO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCwgZGlyZWN0aXZlcyk7XG4gIGRpcmVjdGl2ZXNbaW5kZXhdID0gZGlyZWN0aXZlO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGZsYWdzID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3M7XG4gICAgaWYgKChmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrKSA9PT0gMCkge1xuICAgICAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQ6XG4gICAgICAvLyAtIHNhdmUgdGhlIGluZGV4LFxuICAgICAgLy8gLSBzZXQgdGhlIG51bWJlciBvZiBkaXJlY3RpdmVzIHRvIDFcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzID1cbiAgICAgICAgICBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9ubHkgbmVlZCB0byBidW1wIHRoZSBzaXplIHdoZW4gc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncysrO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkaVB1YmxpYyA9IGRpcmVjdGl2ZURlZiAhLmRpUHVibGljO1xuICAgIGlmIChkaVB1YmxpYykgZGlQdWJsaWMoZGlyZWN0aXZlRGVmICEpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgIT0gbnVsbCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS50eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKFxuICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmUsIGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgYXMgc3RyaW5nW10pO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIHBhcmVudExOb2RlIHRoZSBMTm9kZSBpbiB3aGljaCB0aGUgY29udGFpbmVyJ3MgY29udGVudCB3aWxsIGJlIHJlbmRlcmVkXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgcGFyZW50TE5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHBhcmVudExOb2RlLCAnY29udGFpbmVycyBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xuICBsZXQgcmVuZGVyUGFyZW50ID0gY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnRMTm9kZSwgY3VycmVudFZpZXcpID9cbiAgICAgIHBhcmVudExOb2RlIGFzIExFbGVtZW50Tm9kZSB8IExWaWV3Tm9kZSA6XG4gICAgICBudWxsO1xuICBpZiAocmVuZGVyUGFyZW50ICYmIHJlbmRlclBhcmVudC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIHJlbmRlclBhcmVudCA9IGdldFBhcmVudExOb2RlKHJlbmRlclBhcmVudCBhcyBMVmlld05vZGUpICEuZGF0YVtSRU5ERVJfUEFSRU5UXTtcbiAgfVxuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IG51bGwgOiAwLCAgLy8gYWN0aXZlIGluZGV4XG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgcmVuZGVyUGFyZW50IGFzIExFbGVtZW50Tm9kZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUuXG4gKlxuICogT25seSBgTFZpZXdOb2Rlc2AgY2FuIGdvIGludG8gYExDb250YWluZXJOb2Rlc2AuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGUgT3B0aW9uYWwgaW5saW5lIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXIoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGU/OiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBUQXR0cmlidXRlcyxcbiAgICBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgLTEsICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGN1cnJlbnRQYXJlbnQgPSBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDogZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICE7XG4gIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGN1cnJlbnRQYXJlbnQsIHZpZXdEYXRhKTtcblxuICBjb25zdCBjb21tZW50ID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSB8fCBudWxsLCBhdHRycyB8fCBudWxsLCBsQ29udGFpbmVyKTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIGNvbW1lbnQsIHZpZXdEYXRhKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLnRWaWV3cyA9IHRlbXBsYXRlID9cbiAgICAgICAgY3JlYXRlVFZpZXcoLTEsIHRlbXBsYXRlLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKSA6XG4gICAgICAgIFtdO1xuICB9XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUodmlld0RhdGEsIGluZGV4ICsgSEVBREVSX09GRlNFVCwgbm9kZS5kYXRhKTtcblxuICBjb25zdCBxdWVyaWVzID0gbm9kZS5xdWVyaWVzO1xuICBpZiAocXVlcmllcykge1xuICAgIC8vIHByZXBhcmUgcGxhY2UgZm9yIG1hdGNoaW5nIG5vZGVzIGZyb20gdmlld3MgaW5zZXJ0ZWQgaW50byBhIGdpdmVuIGNvbnRhaW5lclxuICAgIGxDb250YWluZXJbUVVFUklFU10gPSBxdWVyaWVzLmNvbnRhaW5lcigpO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyhsb2NhbFJlZnMpO1xuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlmIChxdWVyaWVzKSB7XG4gICAgLy8gY2hlY2sgaWYgYSBnaXZlbiBjb250YWluZXIgbm9kZSBtYXRjaGVzXG4gICAgcXVlcmllcy5hZGROb2RlKG5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBsb2FkKGluZGV4KSBhcyBMTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgaXNQYXJlbnQgPSB0cnVlO1xuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLmRhdGFbQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAvLyBXZSBuZWVkIHRvIGV4ZWN1dGUgaW5pdCBob29rcyBoZXJlIHNvIG5nT25Jbml0IGhvb2tzIGFyZSBjYWxsZWQgaW4gdG9wIGxldmVsIHZpZXdzXG4gICAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgICBleGVjdXRlSW5pdEhvb2tzKHZpZXdEYXRhLCB0VmlldywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXJOb2RlLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyTm9kZSBpcyB0aGUgdGltZSB3aGVuIHRvIGNoaWxkIFZpZXdzIGdldCBpbnNlcnRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaEVuZCgpOiB2b2lkIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgITtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBjb250YWluZXIgPSBwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IG5leHRJbmRleCA9IGNvbnRhaW5lci5kYXRhW0FDVElWRV9JTkRFWF0gITtcblxuICAvLyByZW1vdmUgZXh0cmEgdmlld3MgYXQgdGhlIGVuZCBvZiB0aGUgY29udGFpbmVyXG4gIHdoaWxlIChuZXh0SW5kZXggPCBjb250YWluZXIuZGF0YVtWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IG51bGwpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBsVmlld05vZGUgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBsVmlld05vZGUuZGF0YTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBsVmlld05vZGUsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLCBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyTm9kZSB3aGVyZSB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gc3RhcnRJZHggc3RhcnRpbmcgaW5kZXggaW4gdGhlIHZpZXdzIGFycmF5IHRvIHNlYXJjaCBmcm9tXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgZXhhY3QgdmlldyBibG9jayBpZCB0byBsb29rIGZvclxuICogQHJldHVybnMgaW5kZXggb2YgYSBmb3VuZCB2aWV3IG9yIC0xIGlmIG5vdCBmb3VuZFxuICovXG5mdW5jdGlvbiBzY2FuRm9yVmlldyhcbiAgICBjb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlciwgdmlld0Jsb2NrSWQ6IG51bWJlcik6IExWaWV3Tm9kZXxudWxsIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXS5kYXRhW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoIGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBjb250YWluZXIgPVxuICAgICAgKGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkpIGFzIExDb250YWluZXJOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lci5kYXRhO1xuICBsZXQgdmlld05vZGU6IExWaWV3Tm9kZXxudWxsID0gc2NhbkZvclZpZXcoY29udGFpbmVyLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3Tm9kZSkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gdmlld05vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIGVudGVyVmlldyh2aWV3Tm9kZS5kYXRhLCB2aWV3Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICBjb25zdCBuZXdWaWV3ID0gY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICByZW5kZXJlciwgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb250YWluZXIpLCBudWxsLCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICBnZXRDdXJyZW50U2FuaXRpemVyKCkpO1xuXG4gICAgaWYgKGxDb250YWluZXJbUVVFUklFU10pIHtcbiAgICAgIG5ld1ZpZXdbUVVFUklFU10gPSBsQ29udGFpbmVyW1FVRVJJRVNdICEuY3JlYXRlVmlldygpO1xuICAgIH1cblxuICAgIGVudGVyVmlldyhcbiAgICAgICAgbmV3Vmlldywgdmlld05vZGUgPSBjcmVhdGVMTm9kZSh2aWV3QmxvY2tJZCwgVE5vZGVUeXBlLlZpZXcsIG51bGwsIG51bGwsIG51bGwsIG5ld1ZpZXcpKTtcbiAgfVxuICBjb25zdCBjb250YWluZXJOb2RlID0gZ2V0UGFyZW50TE5vZGUodmlld05vZGUpIGFzIExDb250YWluZXJOb2RlO1xuICBpZiAoY29udGFpbmVyTm9kZSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZSh2aWV3Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXJOb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyTm9kZS5kYXRhO1xuICAgIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KGNvbnRhaW5lck5vZGUsIHZpZXdOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGdldFJlbmRlckZsYWdzKHZpZXdOb2RlLmRhdGEpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIFRWaWV3IChlLmcuIHN0YXRpYyBkYXRhKSBmb3IgdGhlIGFjdGl2ZSBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEVhY2ggZW1iZWRkZWQgdmlldyBibG9jayBtdXN0IGNyZWF0ZSBvciByZXRyaWV2ZSBpdHMgb3duIFRWaWV3LiBPdGhlcndpc2UsIHRoZSBlbWJlZGRlZCB2aWV3J3NcbiAqIHN0YXRpYyBkYXRhIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB3b3VsZCBvdmVyd3JpdGUgdGhlIHN0YXRpYyBkYXRhIGZvciBhIG5vZGUgaW4gdGhlIHZpZXcgYWJvdmVcbiAqIGl0IHdpdGggdGhlIHNhbWUgaW5kZXggKHNpbmNlIGl0J3MgaW4gdGhlIHNhbWUgdGVtcGxhdGUpLlxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIGluZGV4IG9mIHRoZSBUVmlldyBpbiBUTm9kZS50Vmlld3NcbiAqIEBwYXJhbSBwYXJlbnQgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdJbmRleDogbnVtYmVyLCBwYXJlbnQ6IExDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gKHBhcmVudCAhLnROb2RlIGFzIFRDb250YWluZXJOb2RlKS50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9XG4gICAgICAgIGNyZWF0ZVRWaWV3KHZpZXdJbmRleCwgbnVsbCwgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgcmVmcmVzaFZpZXcoKTtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3RGF0YVtIT1NUX05PREVdIGFzIExWaWV3Tm9kZTtcbiAgaWYgKGNyZWF0aW9uTW9kZSkge1xuICAgIGNvbnN0IGNvbnRhaW5lck5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lck5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgICAgLy8gV2hlbiBwcm9qZWN0ZWQgbm9kZXMgYXJlIGdvaW5nIHRvIGJlIGluc2VydGVkLCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBkeW5hbWljIGNvbnRhaW5lclxuICAgICAgLy8gdXNlZCBieSB0aGUgVmlld0NvbnRhaW5lclJlZiBtdXN0IGJlIHNldC5cbiAgICAgIHNldFJlbmRlclBhcmVudEluUHJvamVjdGVkTm9kZXMoXG4gICAgICAgICAgY29udGFpbmVyTm9kZS5kYXRhW1JFTkRFUl9QQVJFTlRdLCBwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMVmlld05vZGUpO1xuICAgIH1cbiAgfVxuICBsZWF2ZVZpZXcodmlld0RhdGFbUEFSRU5UXSAhKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzUGFyZW50LCBmYWxzZSwgJ2lzUGFyZW50Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xufVxuXG4vKipcbiAqIEZvciBub2RlcyB3aGljaCBhcmUgcHJvamVjdGVkIGluc2lkZSBhbiBlbWJlZGRlZCB2aWV3LCB0aGlzIGZ1bmN0aW9uIHNldHMgdGhlIHJlbmRlclBhcmVudFxuICogb2YgdGhlaXIgZHluYW1pYyBMQ29udGFpbmVyTm9kZS5cbiAqIEBwYXJhbSByZW5kZXJQYXJlbnQgdGhlIHJlbmRlclBhcmVudCBvZiB0aGUgTENvbnRhaW5lciB3aGljaCBjb250YWlucyB0aGUgZW1iZWRkZWQgdmlldy5cbiAqIEBwYXJhbSB2aWV3Tm9kZSB0aGUgZW1iZWRkZWQgdmlldy5cbiAqL1xuZnVuY3Rpb24gc2V0UmVuZGVyUGFyZW50SW5Qcm9qZWN0ZWROb2RlcyhcbiAgICByZW5kZXJQYXJlbnQ6IExFbGVtZW50Tm9kZSB8IG51bGwsIHZpZXdOb2RlOiBMVmlld05vZGUpOiB2b2lkIHtcbiAgaWYgKHJlbmRlclBhcmVudCAhPSBudWxsKSB7XG4gICAgbGV0IG5vZGU6IExOb2RlfG51bGwgPSBnZXRDaGlsZExOb2RlKHZpZXdOb2RlKTtcbiAgICB3aGlsZSAobm9kZSkge1xuICAgICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgbGV0IG5vZGVUb1Byb2plY3Q6IExOb2RlfG51bGwgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEuaGVhZDtcbiAgICAgICAgY29uc3QgbGFzdE5vZGVUb1Byb2plY3QgPSAobm9kZSBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGEudGFpbDtcbiAgICAgICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgICAgICBpZiAobm9kZVRvUHJvamVjdC5keW5hbWljTENvbnRhaW5lck5vZGUpIHtcbiAgICAgICAgICAgIG5vZGVUb1Byb2plY3QuZHluYW1pY0xDb250YWluZXJOb2RlLmRhdGFbUkVOREVSX1BBUkVOVF0gPSByZW5kZXJQYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IERpcmVjdGl2ZSBpbmRleCBpbiBMVmlld0RhdGFbRElSRUNUSVZFU11cbiAqIEBwYXJhbSBhZGp1c3RlZEVsZW1lbnRJbmRleCAgRWxlbWVudCBpbmRleCBpbiBMVmlld0RhdGFbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGFkanVzdGVkRWxlbWVudEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgZWxlbWVudCA9IHZpZXdEYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShlbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXdEYXRhIGF0dGFjaGVkLmApO1xuICBjb25zdCBob3N0VmlldyA9IGVsZW1lbnQuZGF0YSAhO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShkaXJlY3RpdmVJbmRleCwgZGlyZWN0aXZlcyAhKTtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdFZpZXcsIGVsZW1lbnQsIGdldERpcmVjdGl2ZUluc3RhbmNlKGRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJbmRleF0pKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWQodmlldzogTFZpZXdEYXRhKTogYm9vbGVhbiB7XG4gIHJldHVybiAodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoXG4gICAgaW5kZXg6IG51bWJlciwgc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBuZXcgQXJyYXk8TE5vZGVbXT4obm9PZk5vZGVCdWNrZXRzKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mTm9kZUJ1Y2tldHM7IGkrKykge1xuICAgIGRpc3RyaWJ1dGVkTm9kZXNbaV0gPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBvbmVudE5vZGU6IExFbGVtZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KHZpZXdEYXRhKTtcbiAgbGV0IGlzUHJvamVjdGluZ0kxOG5Ob2RlcyA9IGZhbHNlO1xuICBsZXQgY29tcG9uZW50Q2hpbGQ6IExOb2RlfG51bGw7XG4gIC8vIGZvciBpMThuIHRyYW5zbGF0aW9ucyB3ZSB1c2UgcENoaWxkIHRvIHBvaW50IHRvIHRoZSBuZXh0IGNoaWxkXG4gIC8vIFRPRE8oa2FyYSk6IFJlbW92ZSB3aGVuIHJlbW92aW5nIExOb2Rlc1xuICBpZiAoY29tcG9uZW50Tm9kZS5wQ2hpbGQpIHtcbiAgICBpc1Byb2plY3RpbmdJMThuTm9kZXMgPSB0cnVlO1xuICAgIGNvbXBvbmVudENoaWxkID0gY29tcG9uZW50Tm9kZS5wQ2hpbGQ7XG4gIH0gZWxzZSB7XG4gICAgY29tcG9uZW50Q2hpbGQgPSBnZXRDaGlsZExOb2RlKGNvbXBvbmVudE5vZGUpO1xuICB9XG5cbiAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgLy8gZXhlY3V0ZSBzZWxlY3RvciBtYXRjaGluZyBsb2dpYyBpZiBhbmQgb25seSBpZjpcbiAgICAvLyAtIHRoZXJlIGFyZSBzZWxlY3RvcnMgZGVmaW5lZFxuICAgIC8vIC0gYSBub2RlIGhhcyBhIHRhZyBuYW1lIC8gYXR0cmlidXRlcyB0aGF0IGNhbiBiZSBtYXRjaGVkXG4gICAgaWYgKHNlbGVjdG9ycyAmJiBjb21wb25lbnRDaGlsZC50Tm9kZSkge1xuICAgICAgY29uc3QgbWF0Y2hlZElkeCA9IG1hdGNoaW5nU2VsZWN0b3JJbmRleChjb21wb25lbnRDaGlsZC50Tm9kZSwgc2VsZWN0b3JzLCB0ZXh0U2VsZWN0b3JzICEpO1xuICAgICAgZGlzdHJpYnV0ZWROb2Rlc1ttYXRjaGVkSWR4XS5wdXNoKGNvbXBvbmVudENoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlzdHJpYnV0ZWROb2Rlc1swXS5wdXNoKGNvbXBvbmVudENoaWxkKTtcbiAgICB9XG5cbiAgICBpZiAoaXNQcm9qZWN0aW5nSTE4bk5vZGVzKSB7XG4gICAgICBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudENoaWxkLnBOZXh0T3JQYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudENoaWxkID0gZ2V0TmV4dExOb2RlKGNvbXBvbmVudENoaWxkKTtcbiAgICB9XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgc3RvcmUoaW5kZXgsIGRpc3RyaWJ1dGVkTm9kZXMpO1xufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIGxpbmtlZCBsaXN0IG9mIGEgcHJvamVjdGlvbiBub2RlLCBieSBhcHBlbmRpbmcgYW5vdGhlciBsaW5rZWQgbGlzdC5cbiAqXG4gKiBAcGFyYW0gcHJvamVjdGlvbk5vZGUgUHJvamVjdGlvbiBub2RlIHdob3NlIHByb2plY3RlZCBub2RlcyBsaW5rZWQgbGlzdCBoYXMgdG8gYmUgdXBkYXRlZFxuICogQHBhcmFtIGFwcGVuZGVkRmlyc3QgRmlyc3Qgbm9kZSBvZiB0aGUgbGlua2VkIGxpc3QgdG8gYXBwZW5kLlxuICogQHBhcmFtIGFwcGVuZGVkTGFzdCBMYXN0IG5vZGUgb2YgdGhlIGxpbmtlZCBsaXN0IHRvIGFwcGVuZC5cbiAqL1xuZnVuY3Rpb24gYXBwZW5kVG9Qcm9qZWN0aW9uTm9kZShcbiAgICBwcm9qZWN0aW9uTm9kZTogTFByb2plY3Rpb25Ob2RlLFxuICAgIGFwcGVuZGVkRmlyc3Q6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlIHwgbnVsbCxcbiAgICBhcHBlbmRlZExhc3Q6IExFbGVtZW50Tm9kZSB8IExUZXh0Tm9kZSB8IExDb250YWluZXJOb2RlIHwgbnVsbCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgISFhcHBlbmRlZEZpcnN0LCAhIWFwcGVuZGVkTGFzdCxcbiAgICAgICAgICAgICAgICAgICAnYXBwZW5kZWRGaXJzdCBjYW4gYmUgbnVsbCBpZiBhbmQgb25seSBpZiBhcHBlbmRlZExhc3QgaXMgYWxzbyBudWxsJyk7XG4gIGlmICghYXBwZW5kZWRMYXN0KSB7XG4gICAgLy8gbm90aGluZyB0byBhcHBlbmRcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvamVjdGlvbk5vZGVEYXRhID0gcHJvamVjdGlvbk5vZGUuZGF0YTtcbiAgaWYgKHByb2plY3Rpb25Ob2RlRGF0YS50YWlsKSB7XG4gICAgcHJvamVjdGlvbk5vZGVEYXRhLnRhaWwucE5leHRPclBhcmVudCA9IGFwcGVuZGVkRmlyc3Q7XG4gIH0gZWxzZSB7XG4gICAgcHJvamVjdGlvbk5vZGVEYXRhLmhlYWQgPSBhcHBlbmRlZEZpcnN0O1xuICB9XG4gIHByb2plY3Rpb25Ob2RlRGF0YS50YWlsID0gYXBwZW5kZWRMYXN0O1xuICBhcHBlbmRlZExhc3QucE5leHRPclBhcmVudCA9IHByb2plY3Rpb25Ob2RlO1xufVxuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBsb2NhbEluZGV4IC0gaW5kZXggdW5kZXIgd2hpY2ggZGlzdHJpYnV0aW9uIG9mIHByb2plY3RlZCBub2RlcyB3YXMgbWVtb3JpemVkXG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihcbiAgICBub2RlSW5kZXg6IG51bWJlciwgbG9jYWxJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShcbiAgICAgIG5vZGVJbmRleCwgVE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIG51bGwsIGF0dHJzIHx8IG51bGwsIHtoZWFkOiBudWxsLCB0YWlsOiBudWxsfSk7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgaXNQYXJlbnQgPSBmYWxzZTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgbWVtb3JpemVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3Qodmlld0RhdGEpO1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGNvbXBvbmVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBsb2FkSW50ZXJuYWwobG9jYWxJbmRleCwgY29tcG9uZW50TFZpZXcpIGFzIEFycmF5PExOb2RlW10+O1xuICBjb25zdCBub2Rlc0ZvclNlbGVjdG9yID0gZGlzdHJpYnV0ZWROb2Rlc1tzZWxlY3RvckluZGV4XTtcblxuICAvLyBidWlsZCB0aGUgbGlua2VkIGxpc3Qgb2YgcHJvamVjdGVkIG5vZGVzOlxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzRm9yU2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlVG9Qcm9qZWN0ID0gbm9kZXNGb3JTZWxlY3RvcltpXTtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gUmVwcm9qZWN0aW5nIGEgcHJvamVjdGlvbiAtPiBhcHBlbmQgdGhlIGxpc3Qgb2YgcHJldmlvdXNseSBwcm9qZWN0ZWQgbm9kZXNcbiAgICAgIGNvbnN0IHByZXZpb3VzbHlQcm9qZWN0ZWQgPSAobm9kZVRvUHJvamVjdCBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGE7XG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKG5vZGUsIHByZXZpb3VzbHlQcm9qZWN0ZWQuaGVhZCwgcHJldmlvdXNseVByb2plY3RlZC50YWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUHJvamVjdGluZyBhIHNpbmdsZSBub2RlXG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKFxuICAgICAgICAgIG5vZGUsIG5vZGVUb1Byb2plY3QgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShjdXJyZW50UGFyZW50LCB2aWV3RGF0YSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhjdXJyZW50UGFyZW50LCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIC8vIHByb2Nlc3MgZWFjaCBub2RlIGluIHRoZSBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IG5vZGUuZGF0YS5oZWFkO1xuICAgIGNvbnN0IGxhc3ROb2RlVG9Qcm9qZWN0ID0gbm9kZS5kYXRhLnRhaWw7XG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCBhcyBMRWxlbWVudE5vZGUsXG4gICAgICAgICAgdmlld0RhdGEpO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QgPT09IGxhc3ROb2RlVG9Qcm9qZWN0ID8gbnVsbCA6IG5vZGVUb1Byb2plY3QucE5leHRPclBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlld0RhdGEgTFZpZXdEYXRhIGZvciB3aGljaCB3ZSB3YW50IGEgaG9zdCBlbGVtZW50IG5vZGVcbiAqIEByZXR1cm5zIFRoZSBob3N0IG5vZGVcbiAqL1xuZnVuY3Rpb24gZmluZENvbXBvbmVudEhvc3QobFZpZXdEYXRhOiBMVmlld0RhdGEpOiBMRWxlbWVudE5vZGUge1xuICBsZXQgdmlld1Jvb3RMTm9kZSA9IGxWaWV3RGF0YVtIT1NUX05PREVdO1xuXG4gIHdoaWxlICh2aWV3Um9vdExOb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdEYXRhW1BBUkVOVF0sICdsVmlld0RhdGEucGFyZW50Jyk7XG4gICAgbFZpZXdEYXRhID0gbFZpZXdEYXRhW1BBUkVOVF0gITtcbiAgICB2aWV3Um9vdExOb2RlID0gbFZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld1Jvb3RMTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3Um9vdExOb2RlLmRhdGEsICdub2RlLmRhdGEnKTtcblxuICByZXR1cm4gdmlld1Jvb3RMTm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogQWRkcyBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdEYXRhW10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXdEYXRhIG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3RGF0YXxMQ29udGFpbmVyPihcbiAgICBjdXJyZW50VmlldzogTFZpZXdEYXRhLCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBpZiAoY3VycmVudFZpZXdbVEFJTF0pIHtcbiAgICBjdXJyZW50Vmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3RGF0YSBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChub2RlOiBMRWxlbWVudE5vZGUpOiB2b2lkIHtcbiAgLy8gQmVjYXVzZSBkYXRhIGZsb3dzIGRvd24gdGhlIGNvbXBvbmVudCB0cmVlLCBhbmNlc3RvcnMgZG8gbm90IG5lZWQgdG8gYmUgbWFya2VkIGRpcnR5XG4gIGlmIChub2RlLmRhdGEgJiYgIShub2RlLmRhdGFbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBub2RlLmRhdGFbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gTmVjZXNzYXJ5IHRvIHN1cHBvcnQgT25QdXNoIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyhcbiAgICB2aWV3OiBMVmlld0RhdGEsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiAoZTogRXZlbnQpID0+IGFueSB7XG4gIHJldHVybiBmdW5jdGlvbihlOiBhbnkpIHtcbiAgICBtYXJrVmlld0RpcnR5KHZpZXcpO1xuICAgIHJldHVybiBsaXN0ZW5lckZuKGUpO1xuICB9O1xufVxuXG4vKipcbiAqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHNvIGl0cyBob3N0IHZpZXcgYW5kIGl0cyBhbmNlc3RvciB2aWV3cyB3aWxsIGJlIG1hcmtlZCBkaXJ0eVxuICogd2hlbmV2ZXIgdGhlIGV2ZW50IGZpcmVzLiBBbHNvIHdyYXBzIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlBbmREZWZhdWx0KFxuICAgIHZpZXc6IExWaWV3RGF0YSwgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya1ZpZXdEaXJ0eShlOiBFdmVudCkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlld0RhdGEpOiB2b2lkIHtcbiAgbGV0IGN1cnJlbnRWaWV3OiBMVmlld0RhdGEgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50Vmlld1tQQVJFTlRdICE9IG51bGwpIHtcbiAgICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjdXJyZW50VmlldyA9IGN1cnJlbnRWaWV3W1BBUkVOVF0gITtcbiAgfVxuICBjdXJyZW50Vmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY3VycmVudFZpZXdbQ09OVEVYVF0sICdyb290Q29udGV4dCcpO1xuICBzY2hlZHVsZVRpY2soY3VycmVudFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2s8VD4ocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGlmIChyb290Q29udGV4dC5jbGVhbiA9PSBfQ0xFQU5fUFJPTUlTRSkge1xuICAgIGxldCByZXM6IG51bGx8KCh2YWw6IG51bGwpID0+IHZvaWQpO1xuICAgIHJvb3RDb250ZXh0LmNsZWFuID0gbmV3IFByb21pc2U8bnVsbD4oKHIpID0+IHJlcyA9IHIpO1xuICAgIHJvb3RDb250ZXh0LnNjaGVkdWxlcigoKSA9PiB7XG4gICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICBjb25zdCBob3N0Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKHJvb3RDb21wb25lbnQpO1xuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShob3N0Tm9kZSwgZ2V0Um9vdFZpZXcocm9vdENvbXBvbmVudCksIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmUgdGhlIHJvb3QgdmlldyBmcm9tIGFueSBjb21wb25lbnQgYnkgd2Fsa2luZyB0aGUgcGFyZW50IGBMVmlld0RhdGFgIHVudGlsXG4gKiByZWFjaGluZyB0aGUgcm9vdCBgTFZpZXdEYXRhYC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50OiBhbnkpOiBMVmlld0RhdGEge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbGV0IGxWaWV3RGF0YSA9IGxFbGVtZW50Tm9kZS52aWV3O1xuICB3aGlsZSAobFZpZXdEYXRhW1BBUkVOVF0pIHtcbiAgICBsVmlld0RhdGEgPSBsVmlld0RhdGFbUEFSRU5UXSAhO1xuICB9XG4gIHJldHVybiBsVmlld0RhdGE7XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBjb21wb25lbnQgKGFuZCBwb3NzaWJseSBpdHMgc3ViLWNvbXBvbmVudHMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBpbiBhIHN5bmNocm9ub3VzIHdheSBvbiBhIGNvbXBvbmVudC4gVGhlcmUgc2hvdWxkXG4gKiBiZSB2ZXJ5IGxpdHRsZSByZWFzb24gdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIGRpcmVjdGx5IHNpbmNlIGEgcHJlZmVycmVkIHdheSB0byBkbyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBpcyB0byB7QGxpbmsgbWFya0RpcnR5fSB0aGUgY29tcG9uZW50IGFuZCB3YWl0IGZvciB0aGUgc2NoZWR1bGVyIHRvIGNhbGwgdGhpcyBtZXRob2RcbiAqIGF0IHNvbWUgZnV0dXJlIHBvaW50IGluIHRpbWUuIFRoaXMgaXMgYmVjYXVzZSBhIHNpbmdsZSB1c2VyIGFjdGlvbiBvZnRlbiByZXN1bHRzIGluIG1hbnlcbiAqIGNvbXBvbmVudHMgYmVpbmcgaW52YWxpZGF0ZWQgYW5kIGNhbGxpbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBlYWNoIGNvbXBvbmVudCBzeW5jaHJvbm91c2x5XG4gKiB3b3VsZCBiZSBpbmVmZmljaWVudC4gSXQgaXMgYmV0dGVyIHRvIHdhaXQgdW50aWwgYWxsIGNvbXBvbmVudHMgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmRcbiAqIHRoZW4gcGVyZm9ybSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBhY3Jvc3MgYWxsIG9mIHRoZSBjb21wb25lbnRzXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCBob3N0Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhLCAnQ29tcG9uZW50IGhvc3Qgbm9kZSBzaG91bGQgYmUgYXR0YWNoZWQgdG8gYW4gTFZpZXdEYXRhIGluc3RhbmNlLicpO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsIGhvc3ROb2RlLCBjb21wb25lbnQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICBob3N0VmlldzogTFZpZXdEYXRhLCBob3N0Tm9kZTogTEVsZW1lbnROb2RlLCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdE5vZGUpO1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IHRlbXBsYXRlID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IGhvc3RUVmlldy52aWV3UXVlcnk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXdbRkxBR1NdLCBjb21wb25lbnQpO1xuICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoVmlldygpO1xuICAgIHVwZGF0ZVZpZXdRdWVyeSh2aWV3UXVlcnksIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPihcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmIChmbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5DcmVhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdXBkYXRlVmlld1F1ZXJ5PFQ+KHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlKGNvbXBvbmVudCk7XG4gIG1hcmtWaWV3RGlydHkobEVsZW1lbnROb2RlLnZpZXcpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGludGVyZmFjZSBOT19DSEFOR0Uge1xuICAvLyBUaGlzIGlzIGEgYnJhbmQgdGhhdCBlbnN1cmVzIHRoYXQgdGhpcyB0eXBlIGNhbiBuZXZlciBtYXRjaCBhbnl0aGluZyBlbHNlXG4gIGJyYW5kOiAnTk9fQ0hBTkdFJztcbn1cblxuLyoqIEEgc3BlY2lhbCB2YWx1ZSB3aGljaCBkZXNpZ25hdGVzIHRoYXQgYSB2YWx1ZSBoYXMgbm90IGNoYW5nZWQuICovXG5leHBvcnQgY29uc3QgTk9fQ0hBTkdFID0ge30gYXMgTk9fQ0hBTkdFO1xuXG4vKipcbiAqICBJbml0aWFsaXplcyB0aGUgYmluZGluZyBzdGFydCBpbmRleC4gV2lsbCBnZXQgaW5saW5lZC5cbiAqXG4gKiAgVGhpcyBmdW5jdGlvbiBtdXN0IGJlIGNhbGxlZCBiZWZvcmUgYW55IGJpbmRpbmcgcmVsYXRlZCBmdW5jdGlvbiBpcyBjYWxsZWRcbiAqICAoaWUgYGJpbmQoKWAsIGBpbnRlcnBvbGF0aW9uWCgpYCwgYHB1cmVGdW5jdGlvblgoKWApXG4gKi9cbmZ1bmN0aW9uIGluaXRCaW5kaW5ncygpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCAtMSxcbiAgICAgICAgICAgICAgICAgICAnQmluZGluZyBpbmRleCBzaG91bGQgbm90IHlldCBiZSBzZXQgJyArIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKTtcbiAgaWYgKHRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID09PSAtMSkge1xuICAgIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID0gdmlld0RhdGEubGVuZ3RoO1xuICB9XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQodmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogUmVzZXJ2ZXMgc2xvdHMgZm9yIHB1cmUgZnVuY3Rpb25zIChgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zKVxuICpcbiAqIEJpbmRpbmdzIGZvciBwdXJlIGZ1bmN0aW9ucyBhcmUgc3RvcmVkIGFmdGVyIHRoZSBMTm9kZXMgaW4gdGhlIGRhdGEgYXJyYXkgYnV0IGJlZm9yZSB0aGUgYmluZGluZy5cbiAqXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHwgIExOb2RlcyAuLi4gfCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIHwgcmVndWxhciBiaW5kaW5ncyAvIGludGVycG9sYXRpb25zIHxcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4LlxuICogU3VidHJhY3RpbmcgdGhlIG9mZnNldCBmcm9tIFRWaWV3LmJpbmRpbmdTdGFydEluZGV4IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3NcbiAqIGFyZSBzdG9yZWQuXG4gKlxuICogTk9URTogcmVzZXJ2ZVNsb3RzIGluc3RydWN0aW9ucyBhcmUgb25seSBldmVyIGFsbG93ZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSBjcmVhdGlvbiBibG9ja1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXJ2ZVNsb3RzKG51bVNsb3RzOiBudW1iZXIpIHtcbiAgLy8gSW5pdCB0aGUgc2xvdHMgd2l0aCBhIHVuaXF1ZSBgTk9fQ0hBTkdFYCB2YWx1ZSBzbyB0aGF0IHRoZSBmaXJzdCBjaGFuZ2UgaXMgYWx3YXlzIGRldGVjdGVkXG4gIC8vIHdoZXRoZXIgaXQgaGFwcGVucyBvciBub3QgZHVyaW5nIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MgLSBwdXJlIGZ1bmN0aW9ucyBjaGVja3NcbiAgLy8gbWlnaHQgYmUgc2tpcHBlZCB3aGVuIHNob3J0LWNpcmN1aXRlZC5cbiAgdmlld0RhdGEubGVuZ3RoICs9IG51bVNsb3RzO1xuICB2aWV3RGF0YS5maWxsKE5PX0NIQU5HRSwgLW51bVNsb3RzKTtcbiAgLy8gV2UgbmVlZCB0byBpbml0aWFsaXplIHRoZSBiaW5kaW5nIGluIGNhc2UgYSBgcHVyZUZ1bmN0aW9uWGAga2luZCBvZiBiaW5kaW5nIGluc3RydWN0aW9uIGlzXG4gIC8vIGNhbGxlZCBmaXJzdCBpbiB0aGUgdXBkYXRlIHNlY3Rpb24uXG4gIGluaXRCaW5kaW5ncygpO1xufVxuXG4vKipcbiAqIFNldHMgdXAgdGhlIGJpbmRpbmcgaW5kZXggYmVmb3JlIGV4ZWN1dGluZyBhbnkgYHB1cmVGdW5jdGlvblhgIGluc3RydWN0aW9ucy5cbiAqXG4gKiBUaGUgaW5kZXggbXVzdCBiZSByZXN0b3JlZCBhZnRlciB0aGUgcHVyZSBmdW5jdGlvbiBpcyBleGVjdXRlZFxuICpcbiAqIHtAbGluayByZXNlcnZlU2xvdHN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtb3ZlQmluZGluZ0luZGV4VG9SZXNlcnZlZFNsb3Qob2Zmc2V0OiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBjdXJyZW50U2xvdCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gb2Zmc2V0O1xuICByZXR1cm4gY3VycmVudFNsb3Q7XG59XG5cbi8qKlxuICogUmVzdG9yZXMgdGhlIGJpbmRpbmcgaW5kZXggdG8gdGhlIGdpdmVuIHZhbHVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gaXMgdHlwaWNhbGx5IHVzZWQgdG8gcmVzdG9yZSB0aGUgaW5kZXggYWZ0ZXIgYSBgcHVyZUZ1bmN0aW9uWGAgaGFzXG4gKiBiZWVuIGV4ZWN1dGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzdG9yZUJpbmRpbmdJbmRleChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gaW5kZXg7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcblxuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAvLyBDaGVjayBpZiBiaW5kaW5ncyAob2RkIGluZGV4ZXMpIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjApO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAyIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24yKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjAsIHYxKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIDMgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjMoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjAsIHYxKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjIpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIHN1ZmZpeCA6XG4gICAgICAgICAgICAgICAgICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGUgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArXG4gICAgICAgICAgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNShcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjQpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDYgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2NCwgdjUpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDcgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2NCwgdjUpIHx8IGRpZmZlcmVudDtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQodjYpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjgoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBpNiArIHN0cmluZ2lmeSh2NykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogU3RvcmUgYSB2YWx1ZSBpbiB0aGUgYGRhdGFgIGF0IGEgZ2l2ZW4gYGluZGV4YC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZTxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCk6IHZvaWQge1xuICAvLyBXZSBkb24ndCBzdG9yZSBhbnkgc3RhdGljIGRhdGEgZm9yIGxvY2FsIHZhcmlhYmxlcywgc28gdGhlIGZpcnN0IHRpbWVcbiAgLy8gd2Ugc2VlIHRoZSB0ZW1wbGF0ZSwgd2Ugc2hvdWxkIHN0b3JlIGFzIG51bGwgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXlcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgaWYgKGFkanVzdGVkSW5kZXggPj0gdFZpZXcuZGF0YS5sZW5ndGgpIHtcbiAgICB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID0gbnVsbDtcbiAgfVxuICB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9IHZhbHVlO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIHZpZXdEYXRhKTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gYW55IGBMVmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRJbnRlcm5hbDxUPihpbmRleDogbnVtYmVyLCBhcnI6IExWaWV3RGF0YSk6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBhcnIpO1xuICByZXR1cm4gYXJyW2luZGV4ICsgSEVBREVSX09GRlNFVF07XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGlyZWN0aXZlc2AgYXJyYXkuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZERpcmVjdGl2ZTxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZXMsICdEaXJlY3RpdmVzIGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBkaXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCwgZGlyZWN0aXZlcyAhKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZXMgIVtpbmRleF07XG59XG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUgYW5kIGluY3JlbWVudHMgdGhlIGJpbmRpbmcgaW5kZXguICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUJpbmRpbmcoKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICB2aWV3RGF0YVt2aWV3RGF0YVtCSU5ESU5HX0lOREVYXV0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gdmlld0RhdGFbdmlld0RhdGFbQklORElOR19JTkRFWF0rK107XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGlmICh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9PT0gLTEpIGluaXRCaW5kaW5ncygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXTtcblxuICBpZiAoYmluZGluZ0luZGV4ID49IHZpZXdEYXRhLmxlbmd0aCkge1xuICAgIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdID0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoaXNEaWZmZXJlbnQodmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShjcmVhdGlvbk1vZGUsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW3ZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdKytdID0gdmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdmlld0RhdGFbQklORElOR19JTkRFWF0rKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHRoZSBsYXRlc3QgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVCaW5kaW5nKHZhbHVlOiBhbnkpOiBhbnkge1xuICBiaW5kaW5nVXBkYXRlZCh2YWx1ZSk7XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgMiBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBlaXRoZXIgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQyKGV4cDE6IGFueSwgZXhwMjogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGV4cDEpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoZXhwMikgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoZXhwMTogYW55LCBleHAyOiBhbnksIGV4cDM6IGFueSwgZXhwNDogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRUVmlldygpOiBUVmlldyB7XG4gIHJldHVybiB0Vmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldERpcmVjdGl2ZUluc3RhbmNlPFQ+KGluc3RhbmNlT3JBcnJheTogVCB8IFtUXSk6IFQge1xuICAvLyBEaXJlY3RpdmVzIHdpdGggY29udGVudCBxdWVyaWVzIHN0b3JlIGFuIGFycmF5IGluIGRpcmVjdGl2ZXNbZGlyZWN0aXZlSW5kZXhdXG4gIC8vIHdpdGggdGhlIGluc3RhbmNlIGFzIHRoZSBmaXJzdCBpbmRleFxuICByZXR1cm4gQXJyYXkuaXNBcnJheShpbnN0YW5jZU9yQXJyYXkpID8gaW5zdGFuY2VPckFycmF5WzBdIDogaW5zdGFuY2VPckFycmF5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpIHtcbiAgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIHRydWUsICdwcmV2aW91c09yUGFyZW50Tm9kZSBzaG91bGQgYmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0SGFzUGFyZW50KCkge1xuICBhc3NlcnREZWZpbmVkKGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydERhdGFJblJhbmdlKGluZGV4OiBudW1iZXIsIGFycj86IGFueVtdKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkgYXJyID0gdmlld0RhdGE7XG4gIGFzc2VydExlc3NUaGFuKGluZGV4LCBhcnIgPyBhcnIubGVuZ3RoIDogMCwgJ2luZGV4IGV4cGVjdGVkIHRvIGJlIGEgdmFsaWQgZGF0YSBpbmRleCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhTmV4dChpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IHZpZXdEYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG4vKipcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgcmVzZXJ2ZWQgc2xvdHMgc2hvdWxkIGJlIHNldCBgTk9fQ0hBTkdFYC5cbiAqXG4gKiBJZiBub3QsIHRoZXkgbWlnaHQgbm90IGhhdmUgYmVlbiBhY3R1YWxseSByZXNlcnZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFJlc2VydmVkU2xvdEluaXRpYWxpemVkKHNsb3RPZmZzZXQ6IG51bWJlciwgbnVtU2xvdHM6IG51bWJlcikge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBzdGFydEluZGV4ID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggLSBzbG90T2Zmc2V0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHM7IGkrKykge1xuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdmlld0RhdGFbc3RhcnRJbmRleCArIGldLCBOT19DSEFOR0UsXG4gICAgICAgICAgJ1RoZSByZXNlcnZlZCBzbG90cyBzaG91bGQgYmUgc2V0IHRvIGBOT19DSEFOR0VgIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlPFQ+KGNvbXBvbmVudDogVCk6IExFbGVtZW50Tm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2V4cGVjdGluZyBjb21wb25lbnQgZ290IG51bGwnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gKGNvbXBvbmVudCBhcyBhbnkpW05HX0hPU1RfU1lNQk9MXSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ29iamVjdCBpcyBub3QgYSBjb21wb25lbnQnKTtcbiAgcmV0dXJuIGxFbGVtZW50Tm9kZTtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcbmV4cG9ydCBjb25zdCBST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gX1JPT1RfRElSRUNUSVZFX0lORElDRVM7XG4iXX0=