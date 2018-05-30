/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { assertEqual, assertLessThan, assertNotEqual, assertNotNull, assertNull, assertSame } from './assert';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { assertNodeType } from './node_assert';
import { appendChild, insertView, appendProjectedNode, removeView, canInsertNativeNode, createTextNode, getNextLNode, getChildLNode, getParentLNode } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
import { isDifferent, stringify } from './util';
import { executeHooks, queueLifecycleHooks, queueInitHooks, executeInitHooks } from './hooks';
import { throwCyclicDependencyError, throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
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
 */
export var _ROOT_DIRECTIVE_INDICES = [0, 0];
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
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return renderer;
}
export function getCurrentSanitizer() {
    return currentView && currentView.sanitizer;
}
/** Used to set the parent property when nodes are created. */
var previousOrParentNode;
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return previousOrParentNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
 */
var isParent;
/**
 * Static data that corresponds to the instance-specific data array on an LView.
 *
 * Each node's static data is stored in tData at the same index that it's stored
 * in the data array. Any nodes that do not have static data store a null value in
 * tData to avoid a sparse array.
 */
var tData;
/**
 * State of the current view being processed.
 *
 * NOTE: we cheat here and initialize it to `null` even thought the type does not
 * contain `null`. This is because we expect this value to be not `null` as soon
 * as we enter the view. Declaring the type as `null` would require us to place `!`
 * in most instructions since they all assume that `currentView` is defined.
 */
var currentView = (null);
var currentQueries;
export function getCurrentQueries(QueryType) {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return currentQueries || (currentQueries = new QueryType());
}
/**
 * This property gets set before entering a template.
 */
var creationMode;
export function getCreationMode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return creationMode;
}
/**
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
var data;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
var directives;
/**
 * When a view is destroyed, listeners need to be released and outputs need to be
 * unsubscribed. This cleanup array stores both listener data (in chunks of 4)
 * and output data (in chunks of 2) for a particular view. Combining the arrays
 * saves on memory (70 bytes per array) and on a few bytes of code size (for two
 * separate for loops).
 *
 * If it's a listener being stored:
 * 1st index is: event name to remove
 * 2nd index is: native element
 * 3rd index is: listener function
 * 4th index is: useCapture boolean
 *
 * If it's an output subscription:
 * 1st index is: unsubscribe function
 * 2nd index is: context for function
 */
var cleanup;
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
    var oldView = currentView;
    data = newView && newView.data;
    directives = newView && newView.directives;
    tData = newView && newView.tView.data;
    creationMode = newView && (newView.flags & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && newView.tView.firstTemplatePass;
    cleanup = newView && newView.cleanup;
    renderer = newView && newView.renderer;
    if (newView && newView.bindingIndex < 0) {
        newView.bindingIndex = newView.bindingStartIndex;
    }
    if (host != null) {
        previousOrParentNode = host;
        isParent = true;
    }
    currentView = newView;
    currentQueries = newView && newView.queries;
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
            executeHooks((directives), currentView.tView.viewHooks, currentView.tView.viewCheckHooks, creationMode);
        }
        // Views are clean and in update mode after being checked, so these bits are cleared
        currentView.flags &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    }
    currentView.lifecycleStage = 1 /* Init */;
    currentView.bindingIndex = -1;
    enterView(newView, null);
}
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic children, triggers content hooks, sets host bindings,
 * refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * */
function refreshView() {
    var tView = currentView.tView;
    if (!checkNoChangesMode) {
        executeInitHooks(currentView, tView, creationMode);
    }
    refreshDynamicChildren();
    if (!checkNoChangesMode) {
        executeHooks((directives), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = firstTemplatePass = false;
    setHostBindings(tView.hostBindings);
    refreshChildComponents(tView.components);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(bindings) {
    if (bindings != null) {
        var defs = (currentView.tView.directives);
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
        var tView = currentView.tView;
        executeInitHooks(currentView, tView, creationMode);
        executeHooks((directives), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
export function createLView(viewId, renderer, tView, template, context, flags, sanitizer) {
    var newView = {
        parent: currentView,
        id: viewId,
        // -1 for component views
        flags: flags | 1 /* CreationMode */ | 8 /* Attached */,
        node: (null),
        // until we initialize it in createNode.
        data: [],
        directives: null,
        tView: tView,
        cleanup: null,
        renderer: renderer,
        child: null,
        tail: null,
        next: null,
        bindingStartIndex: -1,
        bindingIndex: -1,
        template: template,
        context: context,
        dynamicViewCount: 0,
        lifecycleStage: 1 /* Init */,
        queries: null,
        injector: currentView && currentView.injector,
        sanitizer: sanitizer || null
    };
    return newView;
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
        tNode: (null),
        pNextOrParent: null,
        dynamicLContainerNode: null
    };
}
export function createLNode(index, type, native, name, attrs, state) {
    var parent = isParent ? previousOrParentNode :
        previousOrParentNode && getParentLNode(previousOrParentNode);
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var tParent = parent && parent.view === currentView ? parent.tNode : null;
    var queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    var isState = state != null;
    var node = createLNodeObject(type, currentView, parent, native, isState ? state : null, queries);
    if (index === null || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = state.tView.node || createTNode(type, index, null, null, tParent, null);
    }
    else {
        // This is an element or container or projection node
        ngDevMode && assertDataNext(index);
        data[index] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (index >= tData.length) {
            var tNode = tData[index] = createTNode(type, index, name, attrs, tParent, null);
            if (!isParent && previousOrParentNode) {
                var previousTNode = previousOrParentNode.tNode;
                previousTNode.next = tNode;
                if (previousTNode.dynamicContainerNode)
                    previousTNode.dynamicContainerNode.next = tNode;
            }
        }
        node.tNode = tData[index];
        // Now link ourselves into the tree.
        if (isParent) {
            currentQueries = null;
            if (previousOrParentNode.tNode.child == null && previousOrParentNode.view === currentView ||
                previousOrParentNode.tNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                previousOrParentNode.tNode.child = node.tNode;
            }
        }
    }
    // View nodes and host elements need to set their host node (components set host nodes later)
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        // Bit of a hack to bust through the readonly because there is a circular dep between
        // LView and LNode.
        ngDevMode && assertNull(state.node, 'LView.node should not have been initialized');
        state.node = node;
        if (firstTemplatePass)
            state.tView.node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
/**
 * Resets the application state.
 */
function resetApplicationState() {
    isParent = false;
    previousOrParentNode = (null);
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
        var tView = getOrCreateTView(template, directives || null, pipes || null);
        host = createLNode(null, 3 /* Element */, hostNode, null, null, createLView(-1, providedRendererFactory.createRenderer(null, null), tView, null, {}, 2 /* CheckAlways */, sanitizer));
    }
    var hostView = (host.data);
    ngDevMode && assertNotNull(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, template);
    return host;
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
export function renderEmbeddedTemplate(viewNode, tView, template, context, renderer, directives, pipes) {
    var _isParent = isParent;
    var _previousOrParentNode = previousOrParentNode;
    var oldView;
    var rf = 2 /* Update */;
    try {
        isParent = true;
        previousOrParentNode = (null);
        if (viewNode == null) {
            var lView = createLView(-1, renderer, tView, template, context, 2 /* CheckAlways */, getCurrentSanitizer());
            viewNode = createLNode(null, 2 /* View */, null, null, null, lView);
            rf = 1 /* Create */;
        }
        oldView = enterView(viewNode.data, viewNode);
        template(rf, context);
        if (rf & 2 /* Update */) {
            refreshView();
        }
        else {
            viewNode.data.tView.firstTemplatePass = firstTemplatePass = false;
        }
    }
    finally {
        // renderEmbeddedTemplate() is called twice in fact, once for creation only and then once for
        // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
        var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
        leaveView((oldView), isCreationOnly);
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
            template(getRenderFlags(hostView), (componentOrContext));
            refreshView();
        }
        else {
            executeInitAndContentHooks();
            // Element was stored at 0 in data and directive was stored at 0 in directives
            // in renderComponent()
            setHostBindings(_ROOT_DIRECTIVE_INDICES);
            componentRefresh(0, 0);
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
    return view.flags & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the data array
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
        assertEqual(currentView.bindingStartIndex, -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native = renderer.createElement(name);
    ngDevMode && assertDataInRange(index - 1);
    var node = createLNode(index, 3 /* Element */, (native), name, attrs || null, null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild(getParentLNode(node), native, currentView);
    createDirectivesAndLocals(index, name, attrs, localRefs, false);
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param index Index of the current node (to create TNode)
 * @param name Tag name of the current node
 * @param attrs Attrs of the current node
 * @param localRefs Local refs of the current node
 * @param inlineViews Whether or not this node will create inline views
 */
function createDirectivesAndLocals(index, name, attrs, localRefs, inlineViews) {
    var node = previousOrParentNode;
    if (firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        cacheMatchingDirectivesForNode(node.tNode, currentView.tView, localRefs || null);
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
    var registry = currentView.tView.directiveRegistry;
    var matches = null;
    if (registry) {
        for (var i = 0; i < registry.length; i++) {
            var def = registry[i];
            if (isNodeMatchingSelectorList(tNode, (def.selectors))) {
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
        (currentView.tView.components || (currentView.tView.components = [])).push(dirIndex, data.length - 1);
    }
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
 */
function queueHostBindingForCheck(dirIndex) {
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (currentView.tView.hostBindings || (currentView.tView.hostBindings = [])).push(dirIndex, data.length - 1);
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
        var tDirectives = (currentView.tView.directives);
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
 * to data[] in the same order as they are loaded in the template with load().
 */
function saveResolvedLocalsInData() {
    var localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ? previousOrParentNode.native : directives[index];
            data.push(value);
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
function getOrCreateTView(template, directives, pipes) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return template.ngPrivateData ||
        (template.ngPrivateData = createTView(directives, pipes));
}
/** Creates a TView instance */
export function createTView(defs, pipes) {
    ngDevMode && ngDevMode.tView++;
    return {
        node: (null),
        data: [],
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
        hostBindings: null,
        components: null,
        directiveRegistry: typeof defs === 'function' ? defs() : defs,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
        currentMatches: null
    };
}
function setUpAttributes(native, attrs) {
    ngDevMode && assertEqual(attrs.length % 2, 0, 'each attribute should have a key and a value');
    var isProc = isProceduralRenderer(renderer);
    for (var i = 0; i < attrs.length; i += 2) {
        var attrName = attrs[i];
        if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
            var attrVal = attrs[i + 1];
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ? renderer.setAttribute(native, attrName, attrVal) :
                native.setAttribute(attrName, attrVal);
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
    var node = createLNode(0, 3 /* Element */, rNode, null, null, createLView(-1, renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs), null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
    if (firstTemplatePass) {
        node.tNode.flags = 4096 /* isComponent */;
        if (def.diPublic)
            def.diPublic(def);
        currentView.tView.directives = [def];
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
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    var cleanupFns = cleanup || (cleanup = currentView.cleanup = []);
    ngDevMode && ngDevMode.rendererAddEventListener++;
    if (isProceduralRenderer(renderer)) {
        var wrappedListener = wrapListenerWithDirtyLogic(currentView, listenerFn);
        var cleanupFn = renderer.listen(native, eventName, wrappedListener);
        cleanupFns.push(cleanupFn, null);
    }
    else {
        var wrappedListener = wrapListenerWithDirtyAndDefault(currentView, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        cleanupFns.push(eventName, native, wrappedListener, useCapture);
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
        ngDevMode && assertDataInRange(outputs[i], (directives));
        var subscription = directives[outputs[i]][outputs[i + 1]].subscribe(listener);
        cleanup.push(subscription.unsubscribe, subscription);
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
    queueLifecycleHooks(previousOrParentNode.tNode.flags, currentView);
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
        var element = data[index];
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var strValue = sanitizer == null ? stringify(value) : sanitizer(value);
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
    var node = data[index];
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
 * @param index The index of the TNode in TView.data
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param parent The parent of this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export function createTNode(type, index, tagName, attrs, parent, tViews) {
    ngDevMode && ngDevMode.tNode++;
    return {
        type: type,
        index: index,
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
        dynamicContainerNode: null
    };
}
/**
 * Given a list of directive indices and minified input names, sets the
 * input properties on the corresponding directives.
 */
function setInputsForProperty(inputs, value) {
    for (var i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(inputs[i], (directives));
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
        var defs = (currentView.tView.directives);
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
        var lElement = data[index];
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
        var lElement = data[index];
        ngDevMode && ngDevMode.rendererSetClassName++;
        isProceduralRenderer(renderer) ? renderer.setProperty(lElement.native, 'className', value) :
            lElement.native['className'] = stringify(value);
    }
}
export function elementStyleNamed(index, styleName, value, suffixOrSanitizer) {
    if (value !== NO_CHANGE) {
        var lElement = data[index];
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
 * @param index The index of the element to update in the data array
 * @param value A value indicating if a given style should be added or removed.
 *   The expected shape of `value` is an object where keys are style names and the values
 *   are their corresponding values to set. If value is falsy than the style is remove. An absence
 *   of style does not cause that style to be removed. `NO_CHANGE` implies that no update should be
 *   performed.
 */
export function elementStyle(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `style`. In the future
        // we will add logic here which would work with the animation code.
        var lElement = data[index];
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
/**
 * Create static text node
 *
 * @param index Index of the node in the data array.
 * @param value Value to write. This value will be stringified.
 */
export function text(index, value) {
    ngDevMode &&
        assertEqual(currentView.bindingStartIndex, -1, 'text nodes should be created before bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    var textNode = createTextNode(value, renderer);
    var node = createLNode(index, 3 /* Element */, textNode, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(getParentLNode(node), textNode, currentView);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper bind(1-8) method
 *
 * @param index Index of the node in the data array.
 * @param value Stringified value to write.
 */
export function textBinding(index, value) {
    ngDevMode && assertDataInRange(index);
    var existingNode = data[index];
    ngDevMode && assertNotNull(existingNode, 'LNode should exist');
    ngDevMode && assertNotNull(existingNode.native, 'native element should exist');
    ngDevMode && ngDevMode.rendererSetText++;
    value !== NO_CHANGE &&
        (isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
            existingNode.native.textContent = stringify(value));
}
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
    ngDevMode && assertNotNull(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    var tNode = previousOrParentNode.tNode;
    var isComponent = directiveDef.template;
    if (isComponent) {
        addComponentLogic(index, directive, directiveDef);
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(index, directiveDef.onInit, directiveDef.doCheck, currentView.tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(index);
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(index, instance, directiveDef.inputs, tNode);
    }
    return instance;
}
function addComponentLogic(index, instance, def) {
    var tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var hostView = addToViewTree(currentView, createLView(-1, rendererFactory.createRenderer(previousOrParentNode.native, def.rendererType), tView, null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    previousOrParentNode.data = hostView;
    hostView.node = previousOrParentNode;
    if (firstTemplatePass)
        tView.node = previousOrParentNode.tNode;
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, hostView);
    if (firstTemplatePass)
        queueComponentIndexForCheck(index);
}
/**
 * A lighter version of directiveCreate() that is used for the root component
 *
 * This version does not contain features that we don't already support at root in
 * current Angular. Example: local refs and inputs on root component.
 */
export function baseDirectiveCreate(index, directive, directiveDef) {
    ngDevMode &&
        assertEqual(currentView.bindingStartIndex, -1, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    Object.defineProperty(directive, NG_HOST_SYMBOL, { enumerable: false, value: previousOrParentNode });
    if (directives == null)
        currentView.directives = directives = [];
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
            diPublic((directiveDef));
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
    var attrs = (tNode.attrs);
    for (var i = 0; i < attrs.length; i += 2) {
        var attrName = attrs[i];
        var minifiedInputName = inputs[attrName];
        if (minifiedInputName !== undefined) {
            var inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, attrs[i + 1]);
        }
    }
    return initialInputData;
}
export function createLContainer(parentLNode, currentView, template) {
    ngDevMode && assertNotNull(parentLNode, 'containers should have a parent');
    return {
        views: [],
        nextIndex: 0,
        // If the direct parent of the container is a view, its views will need to be added
        // through insertView() when its parent view is being inserted:
        renderParent: canInsertNativeNode(parentLNode, currentView) ? parentLNode : null,
        template: template == null ? null : template,
        next: null,
        parent: currentView,
        dynamicViewCount: 0,
        queries: null
    };
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
    ngDevMode && assertEqual(currentView.bindingStartIndex, -1, 'container nodes should be created before any bindings');
    var currentParent = isParent ? previousOrParentNode : getParentLNode(previousOrParentNode);
    var lContainer = createLContainer(currentParent, currentView, template);
    var node = createLNode(index, 0 /* Container */, undefined, tagName || null, attrs || null, lContainer);
    if (firstTemplatePass && template == null)
        node.tNode.tViews = [];
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(currentView, node.data);
    createDirectivesAndLocals(index, tagName || null, attrs, localRefs, template == null);
    isParent = false;
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    var queries = node.queries;
    if (queries) {
        // check if a given container node matches
        queries.addNode(node);
        // prepare place for matching nodes from views inserted into a given container
        lContainer.queries = queries.container();
    }
}
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    ngDevMode && assertDataInRange(index);
    previousOrParentNode = data[index];
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    isParent = true;
    previousOrParentNode.data.nextIndex = 0;
    ngDevMode && assertSame(previousOrParentNode.native, undefined, "the container's native element should not have been set yet.");
    if (!checkNoChangesMode) {
        // We need to execute init hooks here so ngOnInit hooks are called in top level views
        // before they are called in embedded views (for backwards compatibility).
        executeInitHooks(currentView, currentView.tView, creationMode);
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
        previousOrParentNode = (getParentLNode(previousOrParentNode));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    var container = previousOrParentNode;
    container.native = undefined;
    ngDevMode && assertNodeType(container, 0 /* Container */);
    var nextIndex = container.data.nextIndex;
    // remove extra views at the end of the container
    while (nextIndex < container.data.views.length) {
        removeView(container, nextIndex);
    }
}
function refreshDynamicChildren() {
    for (var current = currentView.child; current !== null; current = current.next) {
        if (current.dynamicViewCount !== 0 && current.views) {
            var container_1 = current;
            for (var i = 0; i < container_1.views.length; i++) {
                var lViewNode = container_1.views[i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                var dynamicView = lViewNode.data;
                ngDevMode && assertNotNull(dynamicView.tView, 'TView must be allocated');
                renderEmbeddedTemplate(lViewNode, dynamicView.tView, (dynamicView.template), (dynamicView.context), renderer);
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
    var views = containerNode.data.views;
    for (var i = startIdx; i < views.length; i++) {
        var viewAtPositionId = views[i].data.id;
        if (viewAtPositionId === viewBlockId) {
            return views[i];
        }
        else if (viewAtPositionId < viewBlockId) {
            // found a view that should not be at this position - remove
            removeView(containerNode, i);
        }
        else {
            // found a view with id grater than the one we are searching for
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
    var viewNode = scanForView(container, lContainer.nextIndex, viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        var newView = createLView(viewBlockId, renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer.queries) {
            newView.queries = lContainer.queries.enterView(lContainer.nextIndex);
        }
        enterView(newView, viewNode = createLNode(viewBlockId, 2 /* View */, null, null, null, newView));
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
    ngDevMode && assertNotNull(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        var tView = currentView.tView;
        containerTViews[viewIndex] = createTView(tView.directiveRegistry, tView.pipeRegistry);
    }
    return containerTViews[viewIndex];
}
/** Marks the end of an embedded view. */
export function embeddedViewEnd() {
    refreshView();
    isParent = false;
    var viewNode = previousOrParentNode = currentView.node;
    var containerNode = getParentLNode(previousOrParentNode);
    if (containerNode) {
        ngDevMode && assertNodeType(viewNode, 2 /* View */);
        ngDevMode && assertNodeType(containerNode, 0 /* Container */);
        var lContainer = containerNode.data;
        if (creationMode) {
            // When projected nodes are going to be inserted, the renderParent of the dynamic container
            // used by the ViewContainerRef must be set.
            setRenderParentInProjectedNodes(lContainer.renderParent, viewNode);
            // it is a new view, insert it into collection of views for a given container
            insertView(containerNode, viewNode, lContainer.nextIndex);
        }
        lContainer.nextIndex++;
    }
    leaveView((currentView.parent));
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
                        nodeToProject.dynamicLContainerNode.data.renderParent = renderParent;
                    }
                    nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
                }
            }
            node = getNextLNode(node);
        }
    }
}
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param directiveIndex
 * @param elementIndex
 */
export function componentRefresh(directiveIndex, elementIndex) {
    ngDevMode && assertDataInRange(elementIndex);
    var element = data[elementIndex];
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode && assertNotNull(element.data, "Component's host node should have an LView attached.");
    var hostView = (element.data);
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView.flags & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        ngDevMode && assertDataInRange(directiveIndex, (directives));
        var def = currentView.tView.directives[directiveIndex];
        detectChangesInternal(hostView, element, def, getDirectiveInstance(directives[directiveIndex]));
    }
}
/** Returns a boolean for whether the view is attached */
function viewAttached(view) {
    return (view.flags & 8 /* Attached */) === 8 /* Attached */;
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
    var componentNode = findComponentHost(currentView);
    var componentChild = getChildLNode(componentNode);
    while (componentChild !== null) {
        // execute selector matching logic if and only if:
        // - there are selectors defined
        // - a node has a tag name / attributes that can be matched
        if (selectors && componentChild.tNode) {
            var matchedIdx = matchingSelectorIndex(componentChild.tNode, selectors, (textSelectors));
            distributedNodes[matchedIdx].push(componentChild);
        }
        else {
            distributedNodes[0].push(componentChild);
        }
        componentChild = getNextLNode(componentChild);
    }
    ngDevMode && assertDataNext(index);
    data[index] = distributedNodes;
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
    var componentNode = findComponentHost(currentView);
    var componentLView = (componentNode.data);
    var nodesForSelector = componentLView.data[localIndex][selectorIndex];
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
    if (canInsertNativeNode(currentParent, currentView)) {
        ngDevMode && assertNodeType(currentParent, 3 /* Element */);
        // process each node in the list of projected nodes:
        var nodeToProject = node.data.head;
        var lastNodeToProject = node.data.tail;
        while (nodeToProject) {
            appendProjectedNode(nodeToProject, currentParent, currentView);
            nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
        }
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param lView LView for which we want a host element node
 * @returns The host node
 */
function findComponentHost(lView) {
    var viewRootLNode = lView.node;
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertNotNull(lView.parent, 'lView.parent');
        lView = (lView.parent);
        viewRootLNode = lView.node;
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertNotNull(viewRootLNode.data, 'node.data');
    return viewRootLNode;
}
/**
 * Adds a LView or a LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param currentView The view where LView or LContainer should be added
 * @param state The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export function addToViewTree(currentView, state) {
    currentView.tail ? (currentView.tail.next = state) : (currentView.child = state);
    currentView.tail = state;
    return state;
}
/** If node is an OnPush component, marks its LView dirty. */
export function markDirtyIfOnPush(node) {
    // Because data flows down the component tree, ancestors do not need to be marked dirty
    if (node.data && !(node.data.flags & 2 /* CheckAlways */)) {
        node.data.flags |= 4 /* Dirty */;
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
    while (currentView.parent != null) {
        currentView.flags |= 4 /* Dirty */;
        currentView = currentView.parent;
    }
    currentView.flags |= 4 /* Dirty */;
    ngDevMode && assertNotNull(currentView.context, 'rootContext');
    scheduleTick(currentView.context);
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
            tick(rootContext.component);
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
    var rootComponent = rootView.context.component;
    var hostNode = _getComponentHostLElementNode(rootComponent);
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    renderComponentOrTemplate(hostNode, rootView, rootComponent);
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param component any component
 */
export function getRootView(component) {
    ngDevMode && assertNotNull(component, 'component');
    var lElementNode = _getComponentHostLElementNode(component);
    var lView = lElementNode.view;
    while (lView.parent) {
        lView = lView.parent;
    }
    return lView;
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
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    var componentIndex = hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */;
    var def = hostNode.view.tView.directives[componentIndex];
    detectChangesInternal(hostNode.data, hostNode, def, component);
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
export function detectChangesInternal(hostView, hostNode, def, component) {
    var oldView = enterView(hostView, hostNode);
    var template = def.template;
    try {
        template(getRenderFlags(hostView), component);
        refreshView();
    }
    finally {
        leaveView(oldView);
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
    ngDevMode && assertNotNull(component, 'component');
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
    ngDevMode && assertEqual(currentView.bindingStartIndex, -1, 'Binding start index should only be set once, when null');
    ngDevMode && assertEqual(currentView.bindingIndex, -1, 'Binding index should not yet be set ' + currentView.bindingIndex);
    currentView.bindingIndex = currentView.bindingStartIndex = data.length;
}
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export function bind(value) {
    if (currentView.bindingStartIndex < 0) {
        initBindings();
        return data[currentView.bindingIndex++] = value;
    }
    var changed = value !== NO_CHANGE && isDifferent(data[currentView.bindingIndex], value);
    if (changed) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, data[currentView.bindingIndex], value);
        data[currentView.bindingIndex] = value;
    }
    currentView.bindingIndex++;
    return changed ? value : NO_CHANGE;
}
/**
 * Reserves slots for pure functions (`pureFunctionX` instructions)
 *
 * Binding for pure functions are store after the LNodes in the data array but before the binding.
 *
 *  ----------------------------------------------------------------------------
 *  |  LNodes ... | pure function bindings | regular bindings / interpolations |
 *  ----------------------------------------------------------------------------
 *                                         ^
 *                                         LView.bindingStartIndex
 *
 * Pure function instructions are given an offset from LView.bindingStartIndex.
 * Subtracting the offset from LView.bindingStartIndex gives the first index where the bindings
 * are stored.
 *
 * NOTE: reserveSlots instructions are only ever allowed at the very end of the creation block
 */
export function reserveSlots(numSlots) {
    // Init the slots with a unique `NO_CHANGE` value so that the first change is always detected
    // whether is happens or not during the first change detection pass - pure functions checks
    // might be skipped when short-circuited.
    data.length += numSlots;
    data.fill(NO_CHANGE, -numSlots);
    // We need to initialize the binding in case a `pureFunctionX` kind of binding instruction is
    // called first in the update section.
    initBindings();
}
/**
 * Sets up the binding index before execute any `pureFunctionX` instructions.
 *
 * The index must be restored after the pure function is executed
 *
 * {@link reserveSlots}
 */
export function moveBindingIndexToReservedSlot(offset) {
    var currentSlot = currentView.bindingIndex;
    currentView.bindingIndex = currentView.bindingStartIndex - offset;
    return currentSlot;
}
/**
 * Restores the binding index to the given value.
 *
 * This function is typically used to restore the index after a `pureFunctionX` has
 * been executed.
 */
export function restoreBindingIndex(index) {
    currentView.bindingIndex = index;
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
    if (index >= tData.length) {
        tData[index] = null;
    }
    data[index] = value;
}
/** Retrieves a value from the `data`. */
export function load(index) {
    ngDevMode && assertDataInRange(index);
    return data[index];
}
/** Retrieves a value from the `directives` array. */
export function loadDirective(index) {
    ngDevMode && assertNotNull(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, (directives));
    return directives[index];
}
/** Gets the current binding value and increments the binding index. */
export function consumeBinding() {
    ngDevMode && assertDataInRange(currentView.bindingIndex);
    ngDevMode &&
        assertNotEqual(data[currentView.bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return data[currentView.bindingIndex++];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    if (currentView.bindingStartIndex < 0) {
        initBindings();
    }
    else if (isDifferent(data[currentView.bindingIndex], value)) {
        throwErrorIfNoChangesMode(creationMode, checkNoChangesMode, data[currentView.bindingIndex], value);
    }
    else {
        currentView.bindingIndex++;
        return false;
    }
    data[currentView.bindingIndex++] = value;
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
    return currentView.tView;
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
    assertNotNull(getParentLNode(previousOrParentNode), 'previousOrParentNode should have a parent');
}
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = data;
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
function assertDataNext(index, arr) {
    if (arr == null)
        arr = data;
    assertEqual(arr.length, index, "index " + index + " expected to be at the end of arr (length " + arr.length + ")");
}
/**
 * On the first template pass the reserved slots should be set `NO_CHANGE`.
 *
 * If not they might not have been actually reserved.
 */
export function assertReservedSlotInitialized(slotOffset, numSlots) {
    if (firstTemplatePass) {
        var startIndex = currentView.bindingStartIndex - slotOffset;
        for (var i = 0; i < numSlots; i++) {
            assertEqual(data[startIndex + i], NO_CHANGE, 'The reserved slots should be set to `NO_CHANGE` on first template pass');
        }
    }
}
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertNotNull(component, 'expecting component got null');
    var lElementNode = component[NG_HOST_SYMBOL];
    ngDevMode && assertNotNull(component, 'object is not a component');
    return lElementNode;
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
export var ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUc1RyxPQUFPLEVBQStCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFLOUYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0ssT0FBTyxFQUFDLDBCQUEwQixFQUFFLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUYsT0FBTyxFQUFvRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25KLE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7O0FBUTVHLE1BQU0sQ0FBQyxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQzs7Ozs7QUFNaEQsSUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJ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QUMsTUFBTSxNQUFHLENBQUMsQ0FBQztDQUNsRzs7Ozs7O0FBT0QsTUFBTSx3Q0FBd0MsVUFBa0IsRUFBRSxRQUFnQjtJQUNoRixJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLElBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7UUFDOUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNqQyxXQUFXLENBQ1AsSUFBSSxDQUFDLFVBQVUsR0FBRyxDQUFDLENBQUMsRUFBRSxTQUFTLEVBQy9CLHdFQUF3RSxDQUFDLENBQUM7U0FDL0U7S0FDRjtDQUNGO0FBRUQsTUFBTSx3Q0FBMkMsU0FBWTtJQUMzRCxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3RFLElBQU0sWUFBWSxHQUFJLFNBQWlCLENBQUMsY0FBYyxDQUFpQixDQUFDO0lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFDbkUsT0FBTyxZQUFZLENBQUM7Q0FDckI7QUFFRCxNQUFNLENBQUMsSUFBTSxhQUFhLEdBQUcsY0FBYyxDQUFDO0FBQzVDLE1BQU0sQ0FBQyxJQUFNLHNCQUFzQixHQUFHLHVCQUF1QixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQgJy4vbmdfZGV2X21vZGUnO1xuXG5pbXBvcnQge2Fzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdE51bGwsIGFzc2VydE51bGwsIGFzc2VydFNhbWV9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0LCBMUHJvamVjdGlvbiwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0N1cnJlbnRNYXRjaGVzTGlzdCwgTFZpZXcsIExWaWV3RmxhZ3MsIExpZmVjeWNsZVN0YWdlLCBSb290Q29udGV4dCwgVERhdGEsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5cbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIFROb2RlVHlwZSwgVE5vZGVGbGFncywgTFByb2plY3Rpb25Ob2RlLCBMVGV4dE5vZGUsIExWaWV3Tm9kZSwgVE5vZGUsIFRDb250YWluZXJOb2RlLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBQcm9wZXJ0eUFsaWFzZXMsIFByb3BlcnR5QWxpYXNWYWx1ZSwgVEVsZW1lbnROb2RlLH0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBpbnNlcnRWaWV3LCBhcHBlbmRQcm9qZWN0ZWROb2RlLCByZW1vdmVWaWV3LCBjYW5JbnNlcnROYXRpdmVOb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZ2V0TmV4dExOb2RlLCBnZXRDaGlsZExOb2RlLCBnZXRQYXJlbnRMTm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBtYXRjaGluZ1NlbGVjdG9ySW5kZXh9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBQaXBlRGVmTGlzdCwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1JFbGVtZW50LCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBQcm9jZWR1cmFsUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNEaWZmZXJlbnQsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBxdWV1ZUxpZmVjeWNsZUhvb2tzLCBxdWV1ZUluaXRIb29rcywgZXhlY3V0ZUluaXRIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuLyoqXG4gKiBEaXJlY3RpdmUgKEQpIHNldHMgYSBwcm9wZXJ0eSBvbiBhbGwgY29tcG9uZW50IGluc3RhbmNlcyB1c2luZyB0aGlzIGNvbnN0YW50IGFzIGEga2V5IGFuZCB0aGVcbiAqIGNvbXBvbmVudCdzIGhvc3Qgbm9kZSAoTEVsZW1lbnQpIGFzIHRoZSB2YWx1ZS4gVGhpcyBpcyB1c2VkIGluIG1ldGhvZHMgbGlrZSBkZXRlY3RDaGFuZ2VzIHRvXG4gKiBmYWNpbGl0YXRlIGp1bXBpbmcgZnJvbSBhbiBpbnN0YW5jZSB0byB0aGUgaG9zdCBub2RlLlxuICovXG5leHBvcnQgY29uc3QgTkdfSE9TVF9TWU1CT0wgPSAnX19uZ0hvc3RMTm9kZV9fJztcblxuLyoqXG4gKiBBIHBlcm1hbmVudCBtYXJrZXIgcHJvbWlzZSB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgY3VycmVudCBDRCB0cmVlIGlzXG4gKiBjbGVhbi5cbiAqL1xuY29uc3QgX0NMRUFOX1BST01JU0UgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbi8qKlxuICogRnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUgYmVmb3JlIHdyaXRpbmcgaXQgaW50byB0aGUgcmVuZGVyZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFNhbml0aXplckZuID0gKHZhbHVlOiBhbnkpID0+IHN0cmluZztcblxuLyoqXG4gKiBEaXJlY3RpdmUgYW5kIGVsZW1lbnQgaW5kaWNlcyBmb3IgdG9wLWxldmVsIGRpcmVjdGl2ZS5cbiAqXG4gKiBTYXZlZCBoZXJlIHRvIGF2b2lkIHJlLWluc3RhbnRpYXRpbmcgYW4gYXJyYXkgb24gZXZlcnkgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKi9cbmV4cG9ydCBjb25zdCBfUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IFswLCAwXTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gY3VycmVudFZpZXcgJiYgY3VycmVudFZpZXcuc2FuaXRpemVyO1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnROb2RlOiBMTm9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk6IExOb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICovXG5sZXQgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuIEFueSBub2RlcyB0aGF0IGRvIG5vdCBoYXZlIHN0YXRpYyBkYXRhIHN0b3JlIGEgbnVsbCB2YWx1ZSBpblxuICogdERhdGEgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKi9cbmxldCB0RGF0YTogVERhdGE7XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTk9URTogd2UgY2hlYXQgaGVyZSBhbmQgaW5pdGlhbGl6ZSBpdCB0byBgbnVsbGAgZXZlbiB0aG91Z2h0IHRoZSB0eXBlIGRvZXMgbm90XG4gKiBjb250YWluIGBudWxsYC4gVGhpcyBpcyBiZWNhdXNlIHdlIGV4cGVjdCB0aGlzIHZhbHVlIHRvIGJlIG5vdCBgbnVsbGAgYXMgc29vblxuICogYXMgd2UgZW50ZXIgdGhlIHZpZXcuIERlY2xhcmluZyB0aGUgdHlwZSBhcyBgbnVsbGAgd291bGQgcmVxdWlyZSB1cyB0byBwbGFjZSBgIWBcbiAqIGluIG1vc3QgaW5zdHJ1Y3Rpb25zIHNpbmNlIHRoZXkgYWxsIGFzc3VtZSB0aGF0IGBjdXJyZW50Vmlld2AgaXMgZGVmaW5lZC5cbiAqL1xubGV0IGN1cnJlbnRWaWV3OiBMVmlldyA9IG51bGwgITtcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJpZXMoUXVlcnlUeXBlOiB7bmV3ICgpOiBMUXVlcmllc30pOiBMUXVlcmllcyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudFF1ZXJpZXMgfHwgKGN1cnJlbnRRdWVyaWVzID0gbmV3IFF1ZXJ5VHlwZSgpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCBkYXRhOiBhbnlbXTtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuLyoqXG4gKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjbGVhbnVwIGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGRhdGEgKGluIGNodW5rcyBvZiA0KVxuICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICogc2F2ZXMgb24gbWVtb3J5ICg3MCBieXRlcyBwZXIgYXJyYXkpIGFuZCBvbiBhIGZldyBieXRlcyBvZiBjb2RlIHNpemUgKGZvciB0d29cbiAqIHNlcGFyYXRlIGZvciBsb29wcykuXG4gKlxuICogSWYgaXQncyBhIGxpc3RlbmVyIGJlaW5nIHN0b3JlZDpcbiAqIDFzdCBpbmRleCBpczogZXZlbnQgbmFtZSB0byByZW1vdmVcbiAqIDJuZCBpbmRleCBpczogbmF0aXZlIGVsZW1lbnRcbiAqIDNyZCBpbmRleCBpczogbGlzdGVuZXIgZnVuY3Rpb25cbiAqIDR0aCBpbmRleCBpczogdXNlQ2FwdHVyZSBib29sZWFuXG4gKlxuICogSWYgaXQncyBhbiBvdXRwdXQgc3Vic2NyaXB0aW9uOlxuICogMXN0IGluZGV4IGlzOiB1bnN1YnNjcmliZSBmdW5jdGlvblxuICogMm5kIGluZGV4IGlzOiBjb250ZXh0IGZvciBmdW5jdGlvblxuICovXG5sZXQgY2xlYW51cDogYW55W118bnVsbDtcblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgaG9zdDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3Qgb2xkVmlldzogTFZpZXcgPSBjdXJyZW50VmlldztcbiAgZGF0YSA9IG5ld1ZpZXcgJiYgbmV3Vmlldy5kYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3LmRpcmVjdGl2ZXM7XG4gIHREYXRhID0gbmV3VmlldyAmJiBuZXdWaWV3LnRWaWV3LmRhdGE7XG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgbmV3Vmlldy50Vmlldy5maXJzdFRlbXBsYXRlUGFzcztcblxuICBjbGVhbnVwID0gbmV3VmlldyAmJiBuZXdWaWV3LmNsZWFudXA7XG4gIHJlbmRlcmVyID0gbmV3VmlldyAmJiBuZXdWaWV3LnJlbmRlcmVyO1xuXG4gIGlmIChuZXdWaWV3ICYmIG5ld1ZpZXcuYmluZGluZ0luZGV4IDwgMCkge1xuICAgIG5ld1ZpZXcuYmluZGluZ0luZGV4ID0gbmV3Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIGlmIChob3N0ICE9IG51bGwpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGhvc3Q7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICB9XG5cbiAgY3VycmVudFZpZXcgPSBuZXdWaWV3O1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlldy5xdWVyaWVzO1xuXG4gIHJldHVybiBvbGRWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGNyZWF0aW9uT25seSBBbiBvcHRpb25hbCBib29sZWFuIHRvIGluZGljYXRlIHRoYXQgdGhlIHZpZXcgd2FzIHByb2Nlc3NlZCBpbiBjcmVhdGlvbiBtb2RlXG4gKiBvbmx5LCBpLmUuIHRoZSBmaXJzdCB1cGRhdGUgd2lsbCBiZSBkb25lIGxhdGVyLiBPbmx5IHBvc3NpYmxlIGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KG5ld1ZpZXc6IExWaWV3LCBjcmVhdGlvbk9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgICBkaXJlY3RpdmVzICEsIGN1cnJlbnRWaWV3LnRWaWV3LnZpZXdIb29rcywgY3VycmVudFZpZXcudFZpZXcudmlld0NoZWNrSG9va3MsXG4gICAgICAgICAgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgY3VycmVudFZpZXcuZmxhZ3MgJj0gfihMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuRGlydHkpO1xuICB9XG4gIGN1cnJlbnRWaWV3LmxpZmVjeWNsZVN0YWdlID0gTGlmZWN5Y2xlU3RhZ2UuSW5pdDtcbiAgY3VycmVudFZpZXcuYmluZGluZ0luZGV4ID0gLTE7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBjaGlsZHJlbiwgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0IGJpbmRpbmdzLFxuICogcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICogKi9cbmZ1bmN0aW9uIHJlZnJlc2hWaWV3KCkge1xuICBjb25zdCB0VmlldyA9IGN1cnJlbnRWaWV3LnRWaWV3O1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG4gIHJlZnJlc2hEeW5hbWljQ2hpbGRyZW4oKTtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG5cbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyhiaW5kaW5nczogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChiaW5kaW5ncyAhPSBudWxsKSB7XG4gICAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICYmIGRlZi5ob3N0QmluZGluZ3MoZGlySW5kZXgsIGJpbmRpbmdzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldLCBjb21wb25lbnRzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBjb25zdCB0VmlldyA9IGN1cnJlbnRWaWV3LnRWaWV3O1xuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHZpZXdJZDogbnVtYmVyLCByZW5kZXJlcjogUmVuZGVyZXIzLCB0VmlldzogVFZpZXcsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPnwgbnVsbCxcbiAgICBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IG5ld1ZpZXcgPSB7XG4gICAgcGFyZW50OiBjdXJyZW50VmlldyxcbiAgICBpZDogdmlld0lkLCAgLy8gLTEgZm9yIGNvbXBvbmVudCB2aWV3c1xuICAgIGZsYWdzOiBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCxcbiAgICBub2RlOiBudWxsICEsICAvLyB1bnRpbCB3ZSBpbml0aWFsaXplIGl0IGluIGNyZWF0ZU5vZGUuXG4gICAgZGF0YTogW10sXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICB0VmlldzogdFZpZXcsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICByZW5kZXJlcjogcmVuZGVyZXIsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgdGFpbDogbnVsbCxcbiAgICBuZXh0OiBudWxsLFxuICAgIGJpbmRpbmdTdGFydEluZGV4OiAtMSxcbiAgICBiaW5kaW5nSW5kZXg6IC0xLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBjb250ZXh0LFxuICAgIGR5bmFtaWNWaWV3Q291bnQ6IDAsXG4gICAgbGlmZWN5Y2xlU3RhZ2U6IExpZmVjeWNsZVN0YWdlLkluaXQsXG4gICAgcXVlcmllczogbnVsbCxcbiAgICBpbmplY3RvcjogY3VycmVudFZpZXcgJiYgY3VycmVudFZpZXcuaW5qZWN0b3IsXG4gICAgc2FuaXRpemVyOiBzYW5pdGl6ZXIgfHwgbnVsbFxuICB9O1xuXG4gIHJldHVybiBuZXdWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0aW9uIG9mIExOb2RlIG9iamVjdCBpcyBleHRyYWN0ZWQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB3ZSBhbHdheXMgY3JlYXRlIExOb2RlIG9iamVjdFxuICogd2l0aCB0aGUgc2FtZSBzaGFwZVxuICogKHNhbWUgcHJvcGVydGllcyBhc3NpZ25lZCBpbiB0aGUgc2FtZSBvcmRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZU9iamVjdChcbiAgICB0eXBlOiBUTm9kZVR5cGUsIGN1cnJlbnRWaWV3OiBMVmlldywgcGFyZW50OiBMTm9kZSB8IG51bGwsXG4gICAgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCwgc3RhdGU6IGFueSxcbiAgICBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwpOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICByZXR1cm4ge1xuICAgIG5hdGl2ZTogbmF0aXZlIGFzIGFueSxcbiAgICB2aWV3OiBjdXJyZW50VmlldyxcbiAgICBub2RlSW5qZWN0b3I6IHBhcmVudCA/IHBhcmVudC5ub2RlSW5qZWN0b3IgOiBudWxsLFxuICAgIGRhdGE6IHN0YXRlLFxuICAgIHF1ZXJpZXM6IHF1ZXJpZXMsXG4gICAgdE5vZGU6IG51bGwgISxcbiAgICBwTmV4dE9yUGFyZW50OiBudWxsLFxuICAgIGR5bmFtaWNMQ29udGFpbmVyTm9kZTogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIEEgY29tbW9uIHdheSBvZiBjcmVhdGluZyB0aGUgTE5vZGUgdG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZW0gaGF2ZSBzYW1lIHNoYXBlIHRvXG4gKiBrZWVwIHRoZSBleGVjdXRpb24gY29kZSBtb25vbW9ycGhpYyBhbmQgZmFzdC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBMTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIExOb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgTE5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gZGF0YSBBbnkgZGF0YSB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiB0aGUgTE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogc3RyaW5nW10gfCBudWxsLCBsVmlldz86IExWaWV3IHwgbnVsbCk6IExFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyIHwgbnVsbCwgdHlwZTogVE5vZGVUeXBlLlZpZXcsIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCwgYXR0cnM6IG51bGwsXG4gICAgbFZpZXc6IExWaWV3KTogTFZpZXdOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogdW5kZWZpbmVkLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwsIGxDb250YWluZXI6IExDb250YWluZXIpOiBMQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogc3RyaW5nW10gfCBudWxsLFxuICAgIGxQcm9qZWN0aW9uOiBMUHJvamVjdGlvbik6IExQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZShcbiAgICBpbmRleDogbnVtYmVyIHwgbnVsbCwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwsIHN0YXRlPzogbnVsbCB8IExWaWV3IHwgTENvbnRhaW5lciB8XG4gICAgICAgIExQcm9qZWN0aW9uKTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgY29uc3QgcGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUgJiYgZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICFhcyBMTm9kZTtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHRQYXJlbnQgPVxuICAgICAgcGFyZW50ICYmIHBhcmVudC52aWV3ID09PSBjdXJyZW50VmlldyA/IHBhcmVudC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGxldCBxdWVyaWVzID1cbiAgICAgIChpc1BhcmVudCA/IGN1cnJlbnRRdWVyaWVzIDogcHJldmlvdXNPclBhcmVudE5vZGUgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcykgfHxcbiAgICAgIHBhcmVudCAmJiBwYXJlbnQucXVlcmllcyAmJiBwYXJlbnQucXVlcmllcy5jaGlsZCgpO1xuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCBjdXJyZW50VmlldywgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsLCBxdWVyaWVzKTtcblxuICBpZiAoaW5kZXggPT09IG51bGwgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gVFZpZXcubm9kZS5cbiAgICBub2RlLnROb2RlID0gKHN0YXRlIGFzIExWaWV3KS50Vmlldy5ub2RlIHx8IGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCB0UGFyZW50LCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gICAgZGF0YVtpbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGluZGV4ID49IHREYXRhLmxlbmd0aCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtpbmRleF0gPSBjcmVhdGVUTm9kZSh0eXBlLCBpbmRleCwgbmFtZSwgYXR0cnMsIHRQYXJlbnQsIG51bGwpO1xuICAgICAgaWYgKCFpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkgcHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIG5vZGUudE5vZGUgPSB0RGF0YVtpbmRleF0gYXMgVE5vZGU7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9PSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnZpZXcgPT09IGN1cnJlbnRWaWV3IHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIHNldCBob3N0IG5vZGVzIGxhdGVyKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICAvLyBCaXQgb2YgYSBoYWNrIHRvIGJ1c3QgdGhyb3VnaCB0aGUgcmVhZG9ubHkgYmVjYXVzZSB0aGVyZSBpcyBhIGNpcmN1bGFyIGRlcCBiZXR3ZWVuXG4gICAgLy8gTFZpZXcgYW5kIExOb2RlLlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdWxsKChzdGF0ZSBhcyBMVmlldykubm9kZSwgJ0xWaWV3Lm5vZGUgc2hvdWxkIG5vdCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQnKTtcbiAgICAoc3RhdGUgYXN7bm9kZTogTE5vZGV9KS5ub2RlID0gbm9kZTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIChzdGF0ZSBhcyBMVmlldykudFZpZXcubm9kZSA9IG5vZGUudE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgcmVuZGVyZXJGYWN0b3J5ID0gcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk7XG4gICAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwpO1xuICAgIGhvc3QgPSBjcmVhdGVMTm9kZShcbiAgICAgICAgbnVsbCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLFxuICAgICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICAgIC0xLCBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKSwgdFZpZXcsIG51bGwsIHt9LFxuICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdCwgaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgcmV0dXJuIGhvc3Q7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdOb2RlOiBMVmlld05vZGUgfCBudWxsLCB0VmlldzogVFZpZXcsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdCB8IG51bGwsXG4gICAgcGlwZXM/OiBQaXBlRGVmTGlzdCB8IG51bGwpOiBMVmlld05vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlldztcbiAgbGV0IHJmOiBSZW5kZXJGbGFncyA9IFJlbmRlckZsYWdzLlVwZGF0ZTtcbiAgdHJ5IHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgICBpZiAodmlld05vZGUgPT0gbnVsbCkge1xuICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgICAtMSwgcmVuZGVyZXIsIHRWaWV3LCB0ZW1wbGF0ZSwgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcblxuICAgICAgdmlld05vZGUgPSBjcmVhdGVMTm9kZShudWxsLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuICAgICAgcmYgPSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgfVxuICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld05vZGUuZGF0YSwgdmlld05vZGUpO1xuICAgIHRlbXBsYXRlKHJmLCBjb250ZXh0KTtcbiAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAgICAgIHJlZnJlc2hWaWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXdOb2RlLmRhdGEudFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlIGluIGZhY3QsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSwgaG9zdFZpZXc6IExWaWV3LCBjb21wb25lbnRPckNvbnRleHQ6IFQsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0Vmlldywgbm9kZSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnRPckNvbnRleHQgISk7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaCgwLCAwKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBzdHJpbmdbXSB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IFJFbGVtZW50IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgY29uc3QgbmF0aXZlOiBSRWxlbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Tm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgYXBwZW5kQ2hpbGQoZ2V0UGFyZW50TE5vZGUobm9kZSksIG5hdGl2ZSwgY3VycmVudFZpZXcpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGluZGV4LCBuYW1lLCBhdHRycywgbG9jYWxSZWZzLCBmYWxzZSk7XG4gIHJldHVybiBuYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGN1cnJlbnQgbm9kZSAodG8gY3JlYXRlIFROb2RlKVxuICogQHBhcmFtIG5hbWUgVGFnIG5hbWUgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICogQHBhcmFtIGF0dHJzIEF0dHJzIG9mIHRoZSBjdXJyZW50IG5vZGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgY3VycmVudCBub2RlXG4gKiBAcGFyYW0gaW5saW5lVmlld3MgV2hldGhlciBvciBub3QgdGhpcyBub2RlIHdpbGwgY3JlYXRlIGlubGluZSB2aWV3c1xuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwgfCB1bmRlZmluZWQsIGlubGluZVZpZXdzOiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShub2RlLnROb2RlLCBjdXJyZW50Vmlldy50VmlldywgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCk7XG4gIH1cbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKCk7XG59XG5cbi8qKlxuICogT24gZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbWF0Y2ggZWFjaCBub2RlIGFnYWluc3QgYXZhaWxhYmxlIGRpcmVjdGl2ZSBzZWxlY3RvcnMgYW5kIHNhdmVcbiAqIHRoZSByZXN1bHRpbmcgZGVmcyBpbiB0aGUgY29ycmVjdCBpbnN0YW50aWF0aW9uIG9yZGVyIGZvciBzdWJzZXF1ZW50IGNoYW5nZSBkZXRlY3Rpb24gcnVuc1xuICogKHNvIGRlcGVuZGVuY2llcyBhcmUgYWx3YXlzIGNyZWF0ZWQgYmVmb3JlIHRoZSBkaXJlY3RpdmVzIHRoYXQgaW5qZWN0IHRoZW0pLlxuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUoXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBjb25zdCBtYXRjaGVzID0gdFZpZXcuY3VycmVudE1hdGNoZXMgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZSk7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgdmFsdWVJbmRleCA9IGkgKyAxO1xuICAgICAgcmVzb2x2ZURpcmVjdGl2ZShkZWYsIHZhbHVlSW5kZXgsIG1hdGNoZXMsIHRWaWV3KTtcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAobWF0Y2hlc1t2YWx1ZUluZGV4XSBhcyBudW1iZXIsIGRlZiwgZXhwb3J0c01hcCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGU6IFROb2RlKTogQ3VycmVudE1hdGNoZXNMaXN0fG51bGwge1xuICBjb25zdCByZWdpc3RyeSA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldO1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgICAgICB9XG4gICAgICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgICAgICAobWF0Y2hlcyB8fCAobWF0Y2hlcyA9IFtdKSkucHVzaChkZWYsIG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyBhcyBDdXJyZW50TWF0Y2hlc0xpc3Q7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIHZhbHVlSW5kZXg6IG51bWJlciwgbWF0Y2hlczogQ3VycmVudE1hdGNoZXNMaXN0LCB0VmlldzogVFZpZXcpOiBhbnkge1xuICBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gbnVsbCkge1xuICAgIG1hdGNoZXNbdmFsdWVJbmRleF0gPSBDSVJDVUxBUjtcbiAgICBjb25zdCBpbnN0YW5jZSA9IGRlZi5mYWN0b3J5KCk7XG4gICAgKHRWaWV3LmRpcmVjdGl2ZXMgfHwgKHRWaWV3LmRpcmVjdGl2ZXMgPSBbXSkpLnB1c2goZGVmKTtcbiAgICByZXR1cm4gZGlyZWN0aXZlQ3JlYXRlKG1hdGNoZXNbdmFsdWVJbmRleF0gPSB0Vmlldy5kaXJlY3RpdmVzICEubGVuZ3RoIC0gMSwgaW5zdGFuY2UsIGRlZik7XG4gIH0gZWxzZSBpZiAobWF0Y2hlc1t2YWx1ZUluZGV4XSA9PT0gQ0lSQ1VMQVIpIHtcbiAgICAvLyBJZiB3ZSByZXZpc2l0IHRoaXMgZGlyZWN0aXZlIGJlZm9yZSBpdCdzIHJlc29sdmVkLCB3ZSBrbm93IGl0J3MgY2lyY3VsYXJcbiAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihkZWYudHlwZSk7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZnVuY3Rpb24gcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgKGN1cnJlbnRWaWV3LnRWaWV3LmNvbXBvbmVudHMgfHwgKGN1cnJlbnRWaWV3LnRWaWV3LmNvbXBvbmVudHMgPSBbXG4gICAgIF0pKS5wdXNoKGRpckluZGV4LCBkYXRhLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgZGlyZWN0aXZlIGFuZCBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIGJpbmRpbmcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhkaXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKGN1cnJlbnRWaWV3LnRWaWV3Lmhvc3RCaW5kaW5ncyB8fCAoY3VycmVudFZpZXcudFZpZXcuaG9zdEJpbmRpbmdzID0gW1xuICAgXSkpLnB1c2goZGlySW5kZXgsIGRhdGEubGVuZ3RoIC0gMSk7XG59XG5cbi8qKiBTZXRzIHRoZSBjb250ZXh0IGZvciBhIENoYW5nZURldGVjdG9yUmVmIHRvIHRoZSBnaXZlbiBpbnN0YW5jZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKFxuICAgIGluamVjdG9yOiBMSW5qZWN0b3IgfCBudWxsLCBpbnN0YW5jZTogYW55LCB2aWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAoaW5qZWN0b3IgJiYgaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgIT0gbnVsbCkge1xuICAgIChpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiBhcyBWaWV3UmVmPGFueT4pLl9zZXRDb21wb25lbnRDb250ZXh0KHZpZXcsIGluc3RhbmNlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNDb21wb25lbnQodE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIHJldHVybiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIGluc3RhbnRpYXRlcyB0aGUgZ2l2ZW4gZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKSB7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmPGFueT4gPSB0RGlyZWN0aXZlc1tpXTtcbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIGRhdGFbXSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/IHByZXZpb3VzT3JQYXJlbnROb2RlLm5hdGl2ZSA6IGRpcmVjdGl2ZXMgIVtpbmRleF07XG4gICAgICBkYXRhLnB1c2godmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGUgVGhlIHRlbXBsYXRlIGZyb20gd2hpY2ggdG8gZ2V0IHN0YXRpYyBkYXRhXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSBzYXZlZCBvbiBUVmlld1xuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhIHx8XG4gICAgICAodGVtcGxhdGUubmdQcml2YXRlRGF0YSA9IGNyZWF0ZVRWaWV3KGRpcmVjdGl2ZXMsIHBpcGVzKSBhcyBuZXZlcik7XG59XG5cbi8qKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2UgKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICBkZWZzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICByZXR1cm4ge1xuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBbXSxcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgaG9zdEJpbmRpbmdzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkZWZzID09PSAnZnVuY3Rpb24nID8gZGVmcygpIDogZGVmcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBjdXJyZW50TWF0Y2hlczogbnVsbFxuICB9O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IHN0cmluZ1tdKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChhdHRycy5sZW5ndGggJSAyLCAwLCAnZWFjaCBhdHRyaWJ1dGUgc2hvdWxkIGhhdmUgYSBrZXkgYW5kIGEgdmFsdWUnKTtcblxuICBjb25zdCBpc1Byb2MgPSBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcik7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSAhPT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgMV07XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICBpc1Byb2MgPyAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0QXR0cmlidXRlKG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwpIDpcbiAgICAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGF0dHJWYWwpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5cbi8qKlxuICogTG9jYXRlcyB0aGUgaG9zdCBuYXRpdmUgZWxlbWVudCwgdXNlZCBmb3IgYm9vdHN0cmFwcGluZyBleGlzdGluZyBub2RlcyBpbnRvIHJlbmRlcmluZyBwaXBlbGluZS5cbiAqXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIGZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZyk6IFJFbGVtZW50fG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoLTEpO1xuICByZW5kZXJlckZhY3RvcnkgPSBmYWN0b3J5O1xuICBjb25zdCBkZWZhdWx0UmVuZGVyZXIgPSBmYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICBjb25zdCByTm9kZSA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKGRlZmF1bHRSZW5kZXJlcikgP1xuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IpIDpcbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpKSA6XG4gICAgICBlbGVtZW50T3JTZWxlY3RvcjtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhck5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gck5vZGU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyB0aGUgaG9zdCBMTm9kZS5cbiAqXG4gKiBAcGFyYW0gck5vZGUgUmVuZGVyIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKlxuICogQHJldHVybnMgTEVsZW1lbnROb2RlIGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhvc3RFbGVtZW50KFxuICAgIHRhZzogc3RyaW5nLCByTm9kZTogUkVsZW1lbnQgfCBudWxsLCBkZWY6IENvbXBvbmVudERlZjxhbnk+LFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICByZXNldEFwcGxpY2F0aW9uU3RhdGUoKTtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKFxuICAgICAgMCwgVE5vZGVUeXBlLkVsZW1lbnQsIHJOb2RlLCBudWxsLCBudWxsLFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgLTEsIHJlbmRlcmVyLCBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcyksIG51bGwsIG51bGwsXG4gICAgICAgICAgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpKTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBub2RlLnROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICBjdXJyZW50Vmlldy50Vmlldy5kaXJlY3RpdmVzID0gW2RlZl07XG4gIH1cblxuICByZXR1cm4gbm9kZTtcbn1cblxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGlzdGVuZXIoXG4gICAgZXZlbnROYW1lOiBzdHJpbmcsIGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnksIHVzZUNhcHR1cmUgPSBmYWxzZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlIGFzIFJFbGVtZW50O1xuXG4gIC8vIEluIG9yZGVyIHRvIG1hdGNoIGN1cnJlbnQgYmVoYXZpb3IsIG5hdGl2ZSBET00gZXZlbnQgbGlzdGVuZXJzIG11c3QgYmUgYWRkZWQgZm9yIGFsbFxuICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgY29uc3QgY2xlYW51cEZucyA9IGNsZWFudXAgfHwgKGNsZWFudXAgPSBjdXJyZW50Vmlldy5jbGVhbnVwID0gW10pO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkRXZlbnRMaXN0ZW5lcisrO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgY29uc3Qgd3JhcHBlZExpc3RlbmVyID0gd3JhcExpc3RlbmVyV2l0aERpcnR5TG9naWMoY3VycmVudFZpZXcsIGxpc3RlbmVyRm4pO1xuICAgIGNvbnN0IGNsZWFudXBGbiA9IHJlbmRlcmVyLmxpc3RlbihuYXRpdmUsIGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyKTtcbiAgICBjbGVhbnVwRm5zLnB1c2goY2xlYW51cEZuLCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoRGlydHlBbmREZWZhdWx0KGN1cnJlbnRWaWV3LCBsaXN0ZW5lckZuKTtcbiAgICBuYXRpdmUuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gICAgY2xlYW51cEZucy5wdXNoKGV2ZW50TmFtZSwgbmF0aXZlLCB3cmFwcGVkTGlzdGVuZXIsIHVzZUNhcHR1cmUpO1xuICB9XG5cbiAgbGV0IHROb2RlOiBUTm9kZXxudWxsID0gbm9kZS50Tm9kZTtcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgb3V0cHV0RGF0YTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKG91dHB1dHMgJiYgKG91dHB1dERhdGEgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY3JlYXRlT3V0cHV0KG91dHB1dERhdGEsIGxpc3RlbmVyRm4pO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGV2ZW50IG5hbWUgYW5kIHN1YnNjcmliZXMgdG9cbiAqIGVhY2ggb3V0cHV0LlxuICovXG5mdW5jdGlvbiBjcmVhdGVPdXRwdXQob3V0cHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKG91dHB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGRpcmVjdGl2ZXMgIVtvdXRwdXRzW2ldIGFzIG51bWJlcl1bb3V0cHV0c1tpICsgMV1dLnN1YnNjcmliZShsaXN0ZW5lcik7XG4gICAgY2xlYW51cCAhLnB1c2goc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlLCBzdWJzY3JpcHRpb24pO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBnZXRQYXJlbnRMTm9kZShwcmV2aW91c09yUGFyZW50Tm9kZSkgYXMgTEVsZW1lbnROb2RlO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBxdWVyaWVzID0gcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcztcbiAgcXVlcmllcyAmJiBxdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50OiBMRWxlbWVudE5vZGUgPSBkYXRhW2luZGV4XTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHN0clZhbHVlID0gc2FuaXRpemVyID09IG51bGwgPyBzdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlKTtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBub2RlID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGU7XG4gIC8vIGlmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWRcbiAgaWYgKHROb2RlICYmIHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHBhcmVudCBUaGUgcGFyZW50IG9mIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyIHwgbnVsbCwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBwYXJlbnQ6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGluZGV4LFxuICAgIGZsYWdzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogcGFyZW50LFxuICAgIGR5bmFtaWNDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogR2l2ZW4gYSBsaXN0IG9mIGRpcmVjdGl2ZSBpbmRpY2VzIGFuZCBtaW5pZmllZCBpbnB1dCBuYW1lcywgc2V0cyB0aGVcbiAqIGlucHV0IHByb3BlcnRpZXMgb24gdGhlIGNvcnJlc3BvbmRpbmcgZGlyZWN0aXZlcy5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5wdXRzW2ldIGFzIG51bWJlciwgZGlyZWN0aXZlcyAhKTtcbiAgICBkaXJlY3RpdmVzICFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciBsTm9kZUZsYWdzIGxvZ2ljYWwgbm9kZSBmbGFnc1xuICogQHBhcmFtIERpcmVjdGlvbiBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICB0Tm9kZUZsYWdzOiBUTm9kZUZsYWdzLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgITtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBBZGQgb3IgcmVtb3ZlIGEgY2xhc3MgaW4gYSBgY2xhc3NMaXN0YCBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBbY2xhc3MuZm9vXT1cImV4cFwiIGNhc2VcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIGNsYXNzTmFtZSBOYW1lIG9mIGNsYXNzIHRvIHRvZ2dsZS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIGluZGljYXRpbmcgaWYgYSBnaXZlbiBjbGFzcyBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzc05hbWVkPFQ+KGluZGV4OiBudW1iZXIsIGNsYXNzTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxFbGVtZW50ID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZENsYXNzKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5hZGRDbGFzcyhsRWxlbWVudC5uYXRpdmUsIGNsYXNzTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbEVsZW1lbnQubmF0aXZlLmNsYXNzTGlzdC5hZGQoY2xhc3NOYW1lKTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUNsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LnJlbW92ZShjbGFzc05hbWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYGNsYXNzTmFtZWAgcHJvcGVydHkgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgYFtjbGFzc109XCJleHBcImAgdXNhZ2UuXG4gKlxuICogYGVsZW1lbnRDbGFzc2AgaW5zdHJ1Y3Rpb24gd3JpdGVzIHRoZSB2YWx1ZSB0byB0aGUgXCJlbGVtZW50J3NcIiBgY2xhc3NOYW1lYCBwcm9wZXJ0eS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBhIHNldCBvZiBjbGFzc2VzIHdoaWNoIHNob3VsZCBiZSBhcHBsaWVkLiBUaGUgbWV0aG9kIG92ZXJyaWRlc1xuICogICBhbnkgZXhpc3RpbmcgY2xhc3Nlcy4gVGhlIHZhbHVlIGlzIHN0cmluZ2lmaWVkIChgdG9TdHJpbmdgKSBiZWZvcmUgaXQgaXMgYXBwbGllZCB0byB0aGVcbiAqICAgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzczxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgY2xhc3NOYW1lYC4gSW4gdGhlXG4gICAgLy8gZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50OiBMRWxlbWVudE5vZGUgPSBkYXRhW2luZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0Q2xhc3NOYW1lKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnY2xhc3NOYW1lJywgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ2NsYXNzTmFtZSddID0gc3RyaW5naWZ5KHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIGdpdmVuIHN0eWxlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHN0eWxlTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHRyYW5zZm9ybSB0aGUgdmFsdWUgdHlwaWNhbGx5IHVzZWQgZm9yXG4gKiAgICAgICAgc2FuaXRpemF0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzdWZmaXg/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZU5hbWVkPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSxcbiAgICBzdWZmaXhPclNhbml0aXplcj86IHN0cmluZyB8IFNhbml0aXplckZuKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGRhdGFbaW5kZXhdO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIucmVtb3ZlU3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10ucmVtb3ZlUHJvcGVydHkoc3R5bGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IHN0clZhbHVlID1cbiAgICAgICAgICB0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ2Z1bmN0aW9uJyA/IHN1ZmZpeE9yU2FuaXRpemVyKHZhbHVlKSA6IHN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgICBpZiAodHlwZW9mIHN1ZmZpeE9yU2FuaXRpemVyID09ICdzdHJpbmcnKSBzdHJWYWx1ZSA9IHN0clZhbHVlICsgc3VmZml4T3JTYW5pdGl6ZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0U3R5bGUobEVsZW1lbnQubmF0aXZlLCBzdHlsZU5hbWUsIHN0clZhbHVlLCBSZW5kZXJlclN0eWxlRmxhZ3MzLkRhc2hDYXNlKSA6XG4gICAgICAgICAgbEVsZW1lbnQubmF0aXZlWydzdHlsZSddLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldCB0aGUgYHN0eWxlYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW3N0eWxlXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB2YWx1ZSBBIHZhbHVlIGluZGljYXRpbmcgaWYgYSBnaXZlbiBzdHlsZSBzaG91bGQgYmUgYWRkZWQgb3IgcmVtb3ZlZC5cbiAqICAgVGhlIGV4cGVjdGVkIHNoYXBlIG9mIGB2YWx1ZWAgaXMgYW4gb2JqZWN0IHdoZXJlIGtleXMgYXJlIHN0eWxlIG5hbWVzIGFuZCB0aGUgdmFsdWVzXG4gKiAgIGFyZSB0aGVpciBjb3JyZXNwb25kaW5nIHZhbHVlcyB0byBzZXQuIElmIHZhbHVlIGlzIGZhbHN5IHRoYW4gdGhlIHN0eWxlIGlzIHJlbW92ZS4gQW4gYWJzZW5jZVxuICogICBvZiBzdHlsZSBkb2VzIG5vdCBjYXVzZSB0aGF0IHN0eWxlIHRvIGJlIHJlbW92ZWQuIGBOT19DSEFOR0VgIGltcGxpZXMgdGhhdCBubyB1cGRhdGUgc2hvdWxkIGJlXG4gKiAgIHBlcmZvcm1lZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZTxUPihcbiAgICBpbmRleDogbnVtYmVyLCB2YWx1ZToge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICAvLyBUT0RPOiBUaGlzIGlzIGEgbmFpdmUgaW1wbGVtZW50YXRpb24gd2hpY2ggc2ltcGx5IHdyaXRlcyB2YWx1ZSB0byB0aGUgYHN0eWxlYC4gSW4gdGhlIGZ1dHVyZVxuICAgIC8vIHdlIHdpbGwgYWRkIGxvZ2ljIGhlcmUgd2hpY2ggd291bGQgd29yayB3aXRoIHRoZSBhbmltYXRpb24gY29kZS5cbiAgICBjb25zdCBsRWxlbWVudCA9IGRhdGFbaW5kZXhdIGFzIExFbGVtZW50Tm9kZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0U3R5bGUrKztcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGxFbGVtZW50Lm5hdGl2ZSwgJ3N0eWxlJywgdmFsdWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBzdHlsZSA9IGxFbGVtZW50Lm5hdGl2ZVsnc3R5bGUnXTtcbiAgICAgIGZvciAobGV0IGkgPSAwLCBrZXlzID0gT2JqZWN0LmtleXModmFsdWUpOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBzdHlsZU5hbWU6IHN0cmluZyA9IGtleXNbaV07XG4gICAgICAgIGNvbnN0IHN0eWxlVmFsdWU6IGFueSA9ICh2YWx1ZSBhcyBhbnkpW3N0eWxlTmFtZV07XG4gICAgICAgIGlmIChzdHlsZVZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlU3R5bGUrKztcbiAgICAgICAgICBzdHlsZS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgICAgIHN0eWxlLnNldFByb3BlcnR5KHN0eWxlTmFtZSwgc3R5bGVWYWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFRleHRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIHN0YXRpYyB0ZXh0IG5vZGVcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIFRoaXMgdmFsdWUgd2lsbCBiZSBzdHJpbmdpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU/OiBhbnkpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5vZGUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgcmVuZGVyZXIpO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0Tm9kZSwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nLlxuICBpc1BhcmVudCA9IGZhbHNlO1xuICBhcHBlbmRDaGlsZChnZXRQYXJlbnRMTm9kZShub2RlKSwgdGV4dE5vZGUsIGN1cnJlbnRWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgYmluZCgxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCk7XG4gIGxldCBleGlzdGluZ05vZGUgPSBkYXRhW2luZGV4XSBhcyBMVGV4dE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGV4aXN0aW5nTm9kZSwgJ0xOb2RlIHNob3VsZCBleGlzdCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChleGlzdGluZ05vZGUubmF0aXZlLCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIHZhbHVlICE9PSBOT19DSEFOR0UgJiZcbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShleGlzdGluZ05vZGUubmF0aXZlLCBzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhpc3RpbmdOb2RlLm5hdGl2ZS50ZXh0Q29udGVudCA9IHN0cmluZ2lmeSh2YWx1ZSkpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBEaXJlY3RpdmVcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIGEgZGlyZWN0aXZlLlxuICpcbiAqIE5PVEU6IGRpcmVjdGl2ZXMgY2FuIGJlIGNyZWF0ZWQgaW4gb3JkZXIgb3RoZXIgdGhhbiB0aGUgaW5kZXggb3JkZXIuIFRoZXkgY2FuIGFsc29cbiAqICAgICAgIGJlIHJldHJpZXZlZCBiZWZvcmUgdGhleSBhcmUgY3JlYXRlZCBpbiB3aGljaCBjYXNlIHRoZSB2YWx1ZSB3aWxsIGJlIG51bGwuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZSBUaGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICogQHBhcmFtIGRpcmVjdGl2ZURlZiBEaXJlY3RpdmVEZWYgb2JqZWN0IHdoaWNoIGNvbnRhaW5zIGluZm9ybWF0aW9uIGFib3V0IHRoZSB0ZW1wbGF0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUNyZWF0ZTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBkaXJlY3RpdmU6IFQsIGRpcmVjdGl2ZURlZjogRGlyZWN0aXZlRGVmPFQ+fCBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3QgaW5zdGFuY2UgPSBiYXNlRGlyZWN0aXZlQ3JlYXRlKGluZGV4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZik7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwocHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUsICdwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZScpO1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlO1xuXG4gIGNvbnN0IGlzQ29tcG9uZW50ID0gKGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWY8VD4pLnRlbXBsYXRlO1xuICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICBhZGRDb21wb25lbnRMb2dpYyhpbmRleCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmPFQ+KTtcbiAgfVxuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgcXVldWVJbml0SG9va3MoaW5kZXgsIGRpcmVjdGl2ZURlZi5vbkluaXQsIGRpcmVjdGl2ZURlZi5kb0NoZWNrLCBjdXJyZW50Vmlldy50Vmlldyk7XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmLmhvc3RCaW5kaW5ncykgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGluZGV4KTtcbiAgfVxuXG4gIGlmICh0Tm9kZSAmJiB0Tm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhpbmRleCwgaW5zdGFuY2UsIGRpcmVjdGl2ZURlZi5pbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oaW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhkZWYudGVtcGxhdGUsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCBob3N0VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBjdXJyZW50VmlldywgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgICAgICAgICAgICAgIC0xLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIGFzIFJFbGVtZW50LCBkZWYucmVuZGVyZXJUeXBlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgdFZpZXcsIG51bGwsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICAgICAgICAgICAgICAgZ2V0Q3VycmVudFNhbml0aXplcigpKSk7XG5cbiAgLy8gV2UgbmVlZCB0byBzZXQgdGhlIGhvc3Qgbm9kZS9kYXRhIGhlcmUgYmVjYXVzZSB3aGVuIHRoZSBjb21wb25lbnQgTE5vZGUgd2FzIGNyZWF0ZWQsXG4gIC8vIHdlIGRpZG4ndCB5ZXQga25vdyBpdCB3YXMgYSBjb21wb25lbnQgKGp1c3QgYW4gZWxlbWVudCkuXG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhc3tkYXRhOiBMVmlld30pLmRhdGEgPSBob3N0VmlldztcbiAgKGhvc3RWaWV3IGFze25vZGU6IExOb2RlfSkubm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHRWaWV3Lm5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcblxuICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKHByZXZpb3VzT3JQYXJlbnROb2RlLm5vZGVJbmplY3RvciwgaW5zdGFuY2UsIGhvc3RWaWV3KTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhpbmRleCk7XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgZGlyZWN0aXZlQ3JlYXRlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnRcbiAqXG4gKiBUaGlzIHZlcnNpb24gZG9lcyBub3QgY29udGFpbiBmZWF0dXJlcyB0aGF0IHdlIGRvbid0IGFscmVhZHkgc3VwcG9ydCBhdCByb290IGluXG4gKiBjdXJyZW50IEFuZ3VsYXIuIEV4YW1wbGU6IGxvY2FsIHJlZnMgYW5kIGlucHV0cyBvbiByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxUPnwgQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIC0xLCAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgZGlyZWN0aXZlLCBOR19IT1NUX1NZTUJPTCwge2VudW1lcmFibGU6IGZhbHNlLCB2YWx1ZTogcHJldmlvdXNPclBhcmVudE5vZGV9KTtcblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSBjdXJyZW50Vmlldy5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcyA9IFtdO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCwgZGlyZWN0aXZlcyk7XG4gIGRpcmVjdGl2ZXNbaW5kZXhdID0gZGlyZWN0aXZlO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGZsYWdzID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3M7XG4gICAgaWYgKChmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrKSA9PT0gMCkge1xuICAgICAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQ6XG4gICAgICAvLyAtIHNhdmUgdGhlIGluZGV4LFxuICAgICAgLy8gLSBzZXQgdGhlIG51bWJlciBvZiBkaXJlY3RpdmVzIHRvIDFcbiAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzID1cbiAgICAgICAgICBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8IDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE9ubHkgbmVlZCB0byBidW1wIHRoZSBzaXplIHdoZW4gc3Vic2VxdWVudCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkXG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2ssIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLFxuICAgICAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncysrO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkaVB1YmxpYyA9IGRpcmVjdGl2ZURlZiAhLmRpUHVibGljO1xuICAgIGlmIChkaVB1YmxpYykgZGlQdWJsaWMoZGlyZWN0aXZlRGVmICEpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgIT0gbnVsbCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS50eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKFxuICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmUsIGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgYXMgc3RyaW5nW10pO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJzW2kgKyAxXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgcGFyZW50TE5vZGU6IExOb2RlLCBjdXJyZW50VmlldzogTFZpZXcsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55Pik6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChwYXJlbnRMTm9kZSwgJ2NvbnRhaW5lcnMgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbiAgcmV0dXJuIDxMQ29udGFpbmVyPntcbiAgICB2aWV3czogW10sXG4gICAgbmV4dEluZGV4OiAwLFxuICAgIC8vIElmIHRoZSBkaXJlY3QgcGFyZW50IG9mIHRoZSBjb250YWluZXIgaXMgYSB2aWV3LCBpdHMgdmlld3Mgd2lsbCBuZWVkIHRvIGJlIGFkZGVkXG4gICAgLy8gdGhyb3VnaCBpbnNlcnRWaWV3KCkgd2hlbiBpdHMgcGFyZW50IHZpZXcgaXMgYmVpbmcgaW5zZXJ0ZWQ6XG4gICAgcmVuZGVyUGFyZW50OiBjYW5JbnNlcnROYXRpdmVOb2RlKHBhcmVudExOb2RlLCBjdXJyZW50VmlldykgPyBwYXJlbnRMTm9kZSA6IG51bGwsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlID09IG51bGwgPyBudWxsIDogdGVtcGxhdGUsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwYXJlbnQ6IGN1cnJlbnRWaWV3LFxuICAgIGR5bmFtaWNWaWV3Q291bnQ6IDAsXG4gICAgcXVlcmllczogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lck5vZGUuXG4gKlxuICogT25seSBgTFZpZXdOb2Rlc2AgY2FuIGdvIGludG8gYExDb250YWluZXJOb2Rlc2AuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdGVtcGxhdGUgT3B0aW9uYWwgaW5saW5lIHRlbXBsYXRlXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udGFpbmVyIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cnMgYXR0YWNoZWQgdG8gdGhlIGNvbnRhaW5lciwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXIoXG4gICAgaW5kZXg6IG51bWJlciwgdGVtcGxhdGU/OiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCB0YWdOYW1lPzogc3RyaW5nIHwgbnVsbCwgYXR0cnM/OiBzdHJpbmdbXSxcbiAgICBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4LCAtMSxcbiAgICAgICAgICAgICAgICAgICAnY29udGFpbmVyIG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCBjdXJyZW50UGFyZW50ID0gaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSAhO1xuICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldywgdGVtcGxhdGUpO1xuXG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShcbiAgICAgIGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCB1bmRlZmluZWQsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMgfHwgbnVsbCwgbENvbnRhaW5lcik7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzICYmIHRlbXBsYXRlID09IG51bGwpIG5vZGUudE5vZGUudFZpZXdzID0gW107XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUoY3VycmVudFZpZXcsIG5vZGUuZGF0YSk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoaW5kZXgsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMsIGxvY2FsUmVmcywgdGVtcGxhdGUgPT0gbnVsbCk7XG5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgcXVlcmllcyA9IG5vZGUucXVlcmllcztcbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICAvLyBjaGVjayBpZiBhIGdpdmVuIGNvbnRhaW5lciBub2RlIG1hdGNoZXNcbiAgICBxdWVyaWVzLmFkZE5vZGUobm9kZSk7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lci5xdWVyaWVzID0gcXVlcmllcy5jb250YWluZXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgYSBjb250YWluZXIgdXAgdG8gcmVjZWl2ZSB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hTdGFydChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCk7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZGF0YVtpbmRleF0gYXMgTE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhLm5leHRJbmRleCA9IDA7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTYW1lKFxuICAgICAgICAgICAgICAgICAgIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZSkubmF0aXZlLCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgYHRoZSBjb250YWluZXIncyBuYXRpdmUgZWxlbWVudCBzaG91bGQgbm90IGhhdmUgYmVlbiBzZXQgeWV0LmApO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAgIC8vIGJlZm9yZSB0aGV5IGFyZSBjYWxsZWQgaW4gZW1iZWRkZWQgdmlld3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkuXG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgY3VycmVudFZpZXcudFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyTm9kZS5cbiAqXG4gKiBNYXJraW5nIHRoZSBlbmQgb2YgTENvbnRhaW5lck5vZGUgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCBWaWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpICE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyID0gcHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gIGNvbnRhaW5lci5uYXRpdmUgPSB1bmRlZmluZWQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBuZXh0SW5kZXggPSBjb250YWluZXIuZGF0YS5uZXh0SW5kZXg7XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgY29udGFpbmVyLmRhdGEudmlld3MubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNDaGlsZHJlbigpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGN1cnJlbnRWaWV3LmNoaWxkOyBjdXJyZW50ICE9PSBudWxsOyBjdXJyZW50ID0gY3VycmVudC5uZXh0KSB7XG4gICAgaWYgKGN1cnJlbnQuZHluYW1pY1ZpZXdDb3VudCAhPT0gMCAmJiAoY3VycmVudCBhcyBMQ29udGFpbmVyKS52aWV3cykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gY3VycmVudCBhcyBMQ29udGFpbmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250YWluZXIudmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbFZpZXdOb2RlID0gY29udGFpbmVyLnZpZXdzW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBjb25zdCBkeW5hbWljVmlldyA9IGxWaWV3Tm9kZS5kYXRhO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChkeW5hbWljVmlldy50VmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBsVmlld05vZGUsIGR5bmFtaWNWaWV3LnRWaWV3LCBkeW5hbWljVmlldy50ZW1wbGF0ZSAhLCBkeW5hbWljVmlldy5jb250ZXh0ICEsIHJlbmRlcmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXJOb2RlIHdoZXJlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGNvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLCB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdOb2RlfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lck5vZGUuZGF0YS52aWV3cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2aWV3QXRQb3NpdGlvbklkID0gdmlld3NbaV0uZGF0YS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2ggaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIGNvbnN0IGNvbnRhaW5lciA9XG4gICAgICAoaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSkgYXMgTENvbnRhaW5lck5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyLmRhdGE7XG4gIGxldCB2aWV3Tm9kZTogTFZpZXdOb2RlfG51bGwgPSBzY2FuRm9yVmlldyhjb250YWluZXIsIGxDb250YWluZXIubmV4dEluZGV4LCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdOb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIGNvbnN0IG5ld1ZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgdmlld0Jsb2NrSWQsIHJlbmRlcmVyLCBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcodmlld0Jsb2NrSWQsIGNvbnRhaW5lciksIG51bGwsIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gICAgaWYgKGxDb250YWluZXIucXVlcmllcykge1xuICAgICAgbmV3Vmlldy5xdWVyaWVzID0gbENvbnRhaW5lci5xdWVyaWVzLmVudGVyVmlldyhsQ29udGFpbmVyLm5leHRJbmRleCk7XG4gICAgfVxuXG4gICAgZW50ZXJWaWV3KFxuICAgICAgICBuZXdWaWV3LCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKHZpZXdCbG9ja0lkLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbmV3VmlldykpO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjdXJyZW50Vmlldy50VmlldztcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnkpO1xuICB9XG4gIHJldHVybiBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XTtcbn1cblxuLyoqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdFbmQoKTogdm9pZCB7XG4gIHJlZnJlc2hWaWV3KCk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGNvbnN0IHZpZXdOb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUgPSBjdXJyZW50Vmlldy5ub2RlIGFzIExWaWV3Tm9kZTtcbiAgY29uc3QgY29udGFpbmVyTm9kZSA9IGdldFBhcmVudExOb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld05vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lck5vZGUuZGF0YTtcblxuICAgIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICAgIC8vIFdoZW4gcHJvamVjdGVkIG5vZGVzIGFyZSBnb2luZyB0byBiZSBpbnNlcnRlZCwgdGhlIHJlbmRlclBhcmVudCBvZiB0aGUgZHluYW1pYyBjb250YWluZXJcbiAgICAgIC8vIHVzZWQgYnkgdGhlIFZpZXdDb250YWluZXJSZWYgbXVzdCBiZSBzZXQuXG4gICAgICBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKGxDb250YWluZXIucmVuZGVyUGFyZW50LCB2aWV3Tm9kZSk7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyhjb250YWluZXJOb2RlLCB2aWV3Tm9kZSwgbENvbnRhaW5lci5uZXh0SW5kZXgpO1xuICAgIH1cblxuICAgIGxDb250YWluZXIubmV4dEluZGV4Kys7XG4gIH1cbiAgbGVhdmVWaWV3KGN1cnJlbnRWaWV3ICEucGFyZW50ICEpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIGZhbHNlLCAnaXNQYXJlbnQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG59XG5cbi8qKlxuICogRm9yIG5vZGVzIHdoaWNoIGFyZSBwcm9qZWN0ZWQgaW5zaWRlIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgcmVuZGVyUGFyZW50XG4gKiBvZiB0aGVpciBkeW5hbWljIExDb250YWluZXJOb2RlLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBMQ29udGFpbmVyIHdoaWNoIGNvbnRhaW5zIHRoZSBlbWJlZGRlZCB2aWV3LlxuICogQHBhcmFtIHZpZXdOb2RlIHRoZSBlbWJlZGRlZCB2aWV3LlxuICovXG5mdW5jdGlvbiBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKFxuICAgIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlIHwgbnVsbCwgdmlld05vZGU6IExWaWV3Tm9kZSk6IHZvaWQge1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUodmlld05vZGUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgICBjb25zdCBsYXN0Tm9kZVRvUHJvamVjdCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS50YWlsO1xuICAgICAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgICAgIGlmIChub2RlVG9Qcm9qZWN0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgICAgbm9kZVRvUHJvamVjdC5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSByZW5kZXJQYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4XG4gKiBAcGFyYW0gZWxlbWVudEluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShlbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZGF0YSAhW2VsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgYXR0YWNoZWQuYCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZWxlbWVudC5kYXRhICE7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlldy5mbGFncyAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoZGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3QgZGVmID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG5cbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoXG4gICAgICAgIGhvc3RWaWV3LCBlbGVtZW50LCBkZWYsIGdldERpcmVjdGl2ZUluc3RhbmNlKGRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJbmRleF0pKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoXG4gICAgaW5kZXg6IG51bWJlciwgc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBuZXcgQXJyYXk8TE5vZGVbXT4obm9PZk5vZGVCdWNrZXRzKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mTm9kZUJ1Y2tldHM7IGkrKykge1xuICAgIGRpc3RyaWJ1dGVkTm9kZXNbaV0gPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBvbmVudE5vZGU6IExFbGVtZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3KTtcbiAgbGV0IGNvbXBvbmVudENoaWxkOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShjb21wb25lbnROb2RlKTtcblxuICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAvLyBleGVjdXRlIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljIGlmIGFuZCBvbmx5IGlmOlxuICAgIC8vIC0gdGhlcmUgYXJlIHNlbGVjdG9ycyBkZWZpbmVkXG4gICAgLy8gLSBhIG5vZGUgaGFzIGEgdGFnIG5hbWUgLyBhdHRyaWJ1dGVzIHRoYXQgY2FuIGJlIG1hdGNoZWRcbiAgICBpZiAoc2VsZWN0b3JzICYmIGNvbXBvbmVudENoaWxkLnROb2RlKSB7XG4gICAgICBjb25zdCBtYXRjaGVkSWR4ID0gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLnROb2RlLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISk7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzW21hdGNoZWRJZHhdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzWzBdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudENoaWxkID0gZ2V0TmV4dExOb2RlKGNvbXBvbmVudENoaWxkKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gIGRhdGFbaW5kZXhdID0gZGlzdHJpYnV0ZWROb2Rlcztcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBsaW5rZWQgbGlzdCBvZiBhIHByb2plY3Rpb24gbm9kZSwgYnkgYXBwZW5kaW5nIGFub3RoZXIgbGlua2VkIGxpc3QuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25Ob2RlIFByb2plY3Rpb24gbm9kZSB3aG9zZSBwcm9qZWN0ZWQgbm9kZXMgbGlua2VkIGxpc3QgaGFzIHRvIGJlIHVwZGF0ZWRcbiAqIEBwYXJhbSBhcHBlbmRlZEZpcnN0IEZpcnN0IG5vZGUgb2YgdGhlIGxpbmtlZCBsaXN0IHRvIGFwcGVuZC5cbiAqIEBwYXJhbSBhcHBlbmRlZExhc3QgTGFzdCBub2RlIG9mIHRoZSBsaW5rZWQgbGlzdCB0byBhcHBlbmQuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgcHJvamVjdGlvbk5vZGU6IExQcm9qZWN0aW9uTm9kZSxcbiAgICBhcHBlbmRlZEZpcnN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwsXG4gICAgYXBwZW5kZWRMYXN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICEhYXBwZW5kZWRGaXJzdCwgISFhcHBlbmRlZExhc3QsXG4gICAgICAgICAgICAgICAgICAgJ2FwcGVuZGVkRmlyc3QgY2FuIGJlIG51bGwgaWYgYW5kIG9ubHkgaWYgYXBwZW5kZWRMYXN0IGlzIGFsc28gbnVsbCcpO1xuICBpZiAoIWFwcGVuZGVkTGFzdCkge1xuICAgIC8vIG5vdGhpbmcgdG8gYXBwZW5kXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb2plY3Rpb25Ob2RlRGF0YSA9IHByb2plY3Rpb25Ob2RlLmRhdGE7XG4gIGlmIChwcm9qZWN0aW9uTm9kZURhdGEudGFpbCkge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS50YWlsLnBOZXh0T3JQYXJlbnQgPSBhcHBlbmRlZEZpcnN0O1xuICB9IGVsc2Uge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS5oZWFkID0gYXBwZW5kZWRGaXJzdDtcbiAgfVxuICBwcm9qZWN0aW9uTm9kZURhdGEudGFpbCA9IGFwcGVuZGVkTGFzdDtcbiAgYXBwZW5kZWRMYXN0LnBOZXh0T3JQYXJlbnQgPSBwcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gbG9jYWxJbmRleCAtIGluZGV4IHVuZGVyIHdoaWNoIGRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0ZWQgbm9kZXMgd2FzIG1lbW9yaXplZFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIGxvY2FsSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCB7aGVhZDogbnVsbCwgdGFpbDogbnVsbH0pO1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIG1lbW9yaXplZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBjb21wb25lbnROb2RlLmRhdGEgITtcbiAgY29uc3Qgbm9kZXNGb3JTZWxlY3RvciA9IGNvbXBvbmVudExWaWV3LmRhdGEgIVtsb2NhbEluZGV4XVtzZWxlY3RvckluZGV4XTtcblxuICAvLyBidWlsZCB0aGUgbGlua2VkIGxpc3Qgb2YgcHJvamVjdGVkIG5vZGVzOlxuICBmb3IgKGxldCBpID0gMDsgaSA8IG5vZGVzRm9yU2VsZWN0b3IubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlVG9Qcm9qZWN0ID0gbm9kZXNGb3JTZWxlY3RvcltpXTtcbiAgICBpZiAobm9kZVRvUHJvamVjdC50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgLy8gUmVwcm9qZWN0aW5nIGEgcHJvamVjdGlvbiAtPiBhcHBlbmQgdGhlIGxpc3Qgb2YgcHJldmlvdXNseSBwcm9qZWN0ZWQgbm9kZXNcbiAgICAgIGNvbnN0IHByZXZpb3VzbHlQcm9qZWN0ZWQgPSAobm9kZVRvUHJvamVjdCBhcyBMUHJvamVjdGlvbk5vZGUpLmRhdGE7XG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKG5vZGUsIHByZXZpb3VzbHlQcm9qZWN0ZWQuaGVhZCwgcHJldmlvdXNseVByb2plY3RlZC50YWlsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gUHJvamVjdGluZyBhIHNpbmdsZSBub2RlXG4gICAgICBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKFxuICAgICAgICAgIG5vZGUsIG5vZGVUb1Byb2plY3QgYXMgTFRleHROb2RlIHwgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUsXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY3VycmVudFBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIC8vIHByb2Nlc3MgZWFjaCBub2RlIGluIHRoZSBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IG5vZGUuZGF0YS5oZWFkO1xuICAgIGNvbnN0IGxhc3ROb2RlVG9Qcm9qZWN0ID0gbm9kZS5kYXRhLnRhaWw7XG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCBhcyBMRWxlbWVudE5vZGUsXG4gICAgICAgICAgY3VycmVudFZpZXcpO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QgPT09IGxhc3ROb2RlVG9Qcm9qZWN0ID8gbnVsbCA6IG5vZGVUb1Byb2plY3QucE5leHRPclBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnRIb3N0KGxWaWV3OiBMVmlldyk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCB2aWV3Um9vdExOb2RlID0gbFZpZXcubm9kZTtcbiAgd2hpbGUgKHZpZXdSb290TE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChsVmlldy5wYXJlbnQsICdsVmlldy5wYXJlbnQnKTtcbiAgICBsVmlldyA9IGxWaWV3LnBhcmVudCAhO1xuICAgIHZpZXdSb290TE5vZGUgPSBsVmlldy5ub2RlO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdSb290TE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwodmlld1Jvb3RMTm9kZS5kYXRhLCAnbm9kZS5kYXRhJyk7XG5cbiAgcmV0dXJuIHZpZXdSb290TE5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYSBMVmlldyBvciBhIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGN1cnJlbnRWaWV3OiBMVmlldywgc3RhdGU6IFQpOiBUIHtcbiAgY3VycmVudFZpZXcudGFpbCA/IChjdXJyZW50Vmlldy50YWlsLm5leHQgPSBzdGF0ZSkgOiAoY3VycmVudFZpZXcuY2hpbGQgPSBzdGF0ZSk7XG4gIGN1cnJlbnRWaWV3LnRhaWwgPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGU6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAvLyBCZWNhdXNlIGRhdGEgZmxvd3MgZG93biB0aGUgY29tcG9uZW50IHRyZWUsIGFuY2VzdG9ycyBkbyBub3QgbmVlZCB0byBiZSBtYXJrZWQgZGlydHlcbiAgaWYgKG5vZGUuZGF0YSAmJiAhKG5vZGUuZGF0YS5mbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhLmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gTmVjZXNzYXJ5IHRvIHN1cHBvcnQgT25QdXNoIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyh2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IChlOiBFdmVudCkgPT5cbiAgICBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gQWxzbyB3cmFwcyB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChcbiAgICB2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya1ZpZXdEaXJ0eShlOiBFdmVudCkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3fG51bGwgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50Vmlldy5wYXJlbnQgIT0gbnVsbCkge1xuICAgIGN1cnJlbnRWaWV3LmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlldy5wYXJlbnQ7XG4gIH1cbiAgY3VycmVudFZpZXcuZmxhZ3MgfD0gTFZpZXdGbGFncy5EaXJ0eTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjdXJyZW50VmlldyAhLmNvbnRleHQsICdyb290Q29udGV4dCcpO1xuICBzY2hlZHVsZVRpY2soY3VycmVudFZpZXcgIS5jb250ZXh0IGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgdGljayhyb290Q29udGV4dC5jb21wb25lbnQpO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbXBvbmVudCA9IChyb290Vmlldy5jb250ZXh0IGFzIFJvb3RDb250ZXh0KS5jb21wb25lbnQ7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUocm9vdENvbXBvbmVudCk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdE5vZGUsIHJvb3RWaWV3LCByb290Q29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50OiBhbnkpOiBMVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBsZXQgbFZpZXcgPSBsRWxlbWVudE5vZGUudmlldztcbiAgd2hpbGUgKGxWaWV3LnBhcmVudCkge1xuICAgIGxWaWV3ID0gbFZpZXcucGFyZW50O1xuICB9XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gIGNvbnN0IGRlZiA9IGhvc3ROb2RlLnZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2NvbXBvbmVudEluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0Tm9kZS5kYXRhIGFzIExWaWV3LCBob3N0Tm9kZSwgZGVmLCBjb21wb25lbnQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGhvc3ROb2RlOiBMRWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+LCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdE5vZGUpO1xuICBjb25zdCB0ZW1wbGF0ZSA9IGRlZi50ZW1wbGF0ZTtcblxuICB0cnkge1xuICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoVmlldygpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbWFya1ZpZXdEaXJ0eShsRWxlbWVudE5vZGUudmlldyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogIEluaXRpYWxpemVzIHRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4LiBXaWxsIGdldCBpbmxpbmVkLlxuICpcbiAqICBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZyByZWxhdGVkIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogIChpZSBgYmluZCgpYCwgYGludGVycG9sYXRpb25YKClgLCBgcHVyZUZ1bmN0aW9uWCgpYClcbiAqL1xuZnVuY3Rpb24gaW5pdEJpbmRpbmdzKCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIC0xLFxuICAgICAgICAgICAgICAgICAgICdCaW5kaW5nIHN0YXJ0IGluZGV4IHNob3VsZCBvbmx5IGJlIHNldCBvbmNlLCB3aGVuIG51bGwnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ0JpbmRpbmcgaW5kZXggc2hvdWxkIG5vdCB5ZXQgYmUgc2V0ICcgKyBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgpO1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA9IGRhdGEubGVuZ3RoO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IFR8Tk9fQ0hBTkdFIHtcbiAgaWYgKGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IDwgMCkge1xuICAgIGluaXRCaW5kaW5ncygpO1xuICAgIHJldHVybiBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrXSA9IHZhbHVlO1xuICB9XG5cbiAgY29uc3QgY2hhbmdlZDogYm9vbGVhbiA9XG4gICAgICB2YWx1ZSAhPT0gTk9fQ0hBTkdFICYmIGlzRGlmZmVyZW50KGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoXG4gICAgICAgIGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfVxuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrKztcbiAgcmV0dXJuIGNoYW5nZWQgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBSZXNlcnZlcyBzbG90cyBmb3IgcHVyZSBmdW5jdGlvbnMgKGBwdXJlRnVuY3Rpb25YYCBpbnN0cnVjdGlvbnMpXG4gKlxuICogQmluZGluZyBmb3IgcHVyZSBmdW5jdGlvbnMgYXJlIHN0b3JlIGFmdGVyIHRoZSBMTm9kZXMgaW4gdGhlIGRhdGEgYXJyYXkgYnV0IGJlZm9yZSB0aGUgYmluZGluZy5cbiAqXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHwgIExOb2RlcyAuLi4gfCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIHwgcmVndWxhciBiaW5kaW5ncyAvIGludGVycG9sYXRpb25zIHxcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3LmJpbmRpbmdTdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIExWaWV3LmJpbmRpbmdTdGFydEluZGV4LlxuICogU3VidHJhY3RpbmcgdGhlIG9mZnNldCBmcm9tIExWaWV3LmJpbmRpbmdTdGFydEluZGV4IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3NcbiAqIGFyZSBzdG9yZWQuXG4gKlxuICogTk9URTogcmVzZXJ2ZVNsb3RzIGluc3RydWN0aW9ucyBhcmUgb25seSBldmVyIGFsbG93ZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSBjcmVhdGlvbiBibG9ja1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXJ2ZVNsb3RzKG51bVNsb3RzOiBudW1iZXIpIHtcbiAgLy8gSW5pdCB0aGUgc2xvdHMgd2l0aCBhIHVuaXF1ZSBgTk9fQ0hBTkdFYCB2YWx1ZSBzbyB0aGF0IHRoZSBmaXJzdCBjaGFuZ2UgaXMgYWx3YXlzIGRldGVjdGVkXG4gIC8vIHdoZXRoZXIgaXMgaGFwcGVucyBvciBub3QgZHVyaW5nIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MgLSBwdXJlIGZ1bmN0aW9ucyBjaGVja3NcbiAgLy8gbWlnaHQgYmUgc2tpcHBlZCB3aGVuIHNob3J0LWNpcmN1aXRlZC5cbiAgZGF0YS5sZW5ndGggKz0gbnVtU2xvdHM7XG4gIGRhdGEuZmlsbChOT19DSEFOR0UsIC1udW1TbG90cyk7XG4gIC8vIFdlIG5lZWQgdG8gaW5pdGlhbGl6ZSB0aGUgYmluZGluZyBpbiBjYXNlIGEgYHB1cmVGdW5jdGlvblhgIGtpbmQgb2YgYmluZGluZyBpbnN0cnVjdGlvbiBpc1xuICAvLyBjYWxsZWQgZmlyc3QgaW4gdGhlIHVwZGF0ZSBzZWN0aW9uLlxuICBpbml0QmluZGluZ3MoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIHRoZSBiaW5kaW5nIGluZGV4IGJlZm9yZSBleGVjdXRlIGFueSBgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoZSBpbmRleCBtdXN0IGJlIHJlc3RvcmVkIGFmdGVyIHRoZSBwdXJlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkXG4gKlxuICoge0BsaW5rIHJlc2VydmVTbG90c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChvZmZzZXQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGN1cnJlbnRTbG90ID0gY3VycmVudFZpZXcuYmluZGluZ0luZGV4O1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIG9mZnNldDtcbiAgcmV0dXJuIGN1cnJlbnRTbG90O1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIHRoZSBiaW5kaW5nIGluZGV4IHRvIHRoZSBnaXZlbiB2YWx1ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHR5cGljYWxseSB1c2VkIHRvIHJlc3RvcmUgdGhlIGluZGV4IGFmdGVyIGEgYHB1cmVGdW5jdGlvblhgIGhhc1xuICogYmVlbiBleGVjdXRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBpbmRleDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuXG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gc3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MCk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICtcbiAgICAgICAgICBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NCkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBpZiAoaW5kZXggPj0gdERhdGEubGVuZ3RoKSB7XG4gICAgdERhdGFbaW5kZXhdID0gbnVsbDtcbiAgfVxuICBkYXRhW2luZGV4XSA9IHZhbHVlO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSB0aGUgYGRhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgpO1xuICByZXR1cm4gZGF0YVtpbmRleF07XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGlyZWN0aXZlc2AgYXJyYXkuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZERpcmVjdGl2ZTxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGRpcmVjdGl2ZXMsICdEaXJlY3RpdmVzIGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBkaXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCwgZGlyZWN0aXZlcyAhKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZXMgIVtpbmRleF07XG59XG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUgYW5kIGluY3JlbWVudHMgdGhlIGJpbmRpbmcgaW5kZXguICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUJpbmRpbmcoKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXhdLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4KytdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuXG4gIGlmIChjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA8IDApIHtcbiAgICBpbml0QmluZGluZ3MoKTtcbiAgfSBlbHNlIGlmIChpc0RpZmZlcmVudChkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoXG4gICAgICAgIGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrXSA9IHZhbHVlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgdGhlIGxhdGVzdCB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmFsdWU6IGFueSk6IGFueSB7XG4gIGJpbmRpbmdVcGRhdGVkKHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKiogVXBkYXRlcyAyIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGVpdGhlciB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDIoZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoZXhwMSk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDQgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkNChleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRWaWV3KCk6IFRWaWV3IHtcbiAgcmV0dXJuIGN1cnJlbnRWaWV3LnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5zdGFuY2U8VD4oaW5zdGFuY2VPckFycmF5OiBUIHwgW1RdKTogVCB7XG4gIC8vIERpcmVjdGl2ZXMgd2l0aCBjb250ZW50IHF1ZXJpZXMgc3RvcmUgYW4gYXJyYXkgaW4gZGlyZWN0aXZlc1tkaXJlY3RpdmVJbmRleF1cbiAgLy8gd2l0aCB0aGUgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IGluZGV4XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGluc3RhbmNlT3JBcnJheSkgPyBpbnN0YW5jZU9yQXJyYXlbMF0gOiBpbnN0YW5jZU9yQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydE5vdE51bGwoZ2V0UGFyZW50TE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG4vKipcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIHRoZSByZXNlcnZlZCBzbG90cyBzaG91bGQgYmUgc2V0IGBOT19DSEFOR0VgLlxuICpcbiAqIElmIG5vdCB0aGV5IG1pZ2h0IG5vdCBoYXZlIGJlZW4gYWN0dWFsbHkgcmVzZXJ2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0OiBudW1iZXIsIG51bVNsb3RzOiBudW1iZXIpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gc2xvdE9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzOyBpKyspIHtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGRhdGFbc3RhcnRJbmRleCArIGldLCBOT19DSEFOR0UsXG4gICAgICAgICAgJ1RoZSByZXNlcnZlZCBzbG90cyBzaG91bGQgYmUgc2V0IHRvIGBOT19DSEFOR0VgIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlPFQ+KGNvbXBvbmVudDogVCk6IExFbGVtZW50Tm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2V4cGVjdGluZyBjb21wb25lbnQgZ290IG51bGwnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gKGNvbXBvbmVudCBhcyBhbnkpW05HX0hPU1RfU1lNQk9MXSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ29iamVjdCBpcyBub3QgYSBjb21wb25lbnQnKTtcbiAgcmV0dXJuIGxFbGVtZW50Tm9kZTtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcbmV4cG9ydCBjb25zdCBST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gX1JPT1RfRElSRUNUSVZFX0lORElDRVM7XG4iXX0=