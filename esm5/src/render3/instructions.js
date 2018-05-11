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
import { appendChild, insertView, appendProjectedNode, removeView, canInsertNativeNode, createTextNode } from './node_manipulation';
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
        type: type,
        native: native,
        view: currentView,
        parent: parent,
        child: null,
        next: null,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: state,
        queries: queries,
        tNode: null,
        pNextOrParent: null,
        dynamicLContainerNode: null
    };
}
export function createLNode(index, type, native, state) {
    var parent = isParent ? previousOrParentNode :
        previousOrParentNode && previousOrParentNode.parent;
    var queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    var isState = state != null;
    var node = createLNodeObject(type, currentView, parent, native, isState ? state : null, queries);
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        // Bit of a hack to bust through the readonly because there is a circular dep between
        // LView and LNode.
        ngDevMode && assertNull(state.node, 'LView.node should not have been initialized');
        state.node = node;
    }
    if (index != null) {
        // We are Element or Container
        ngDevMode && assertDataNext(index);
        data[index] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (index >= tData.length) {
            tData[index] = null;
        }
        else {
            node.tNode = tData[index];
        }
        // Now link ourselves into the tree.
        if (isParent) {
            currentQueries = null;
            if (previousOrParentNode.view === currentView ||
                previousOrParentNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                ngDevMode && assertNull(previousOrParentNode.child, "previousOrParentNode's child should not have been set.");
                previousOrParentNode.child = node;
            }
            else {
                // We are adding component view, so we don't link parent node child to this node.
            }
        }
        else if (previousOrParentNode) {
            ngDevMode && assertNull(previousOrParentNode.next, "previousOrParentNode's next property should not have been set " + index + ".");
            previousOrParentNode.next = node;
            if (previousOrParentNode.dynamicLContainerNode) {
                previousOrParentNode.dynamicLContainerNode.next = node;
            }
        }
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
        host = createLNode(null, 3 /* Element */, hostNode, createLView(-1, providedRendererFactory.createRenderer(null, null), tView, null, {}, 2 /* CheckAlways */, sanitizer));
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
            viewNode = createLNode(null, 2 /* View */, null, lView);
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
    var node = createLNode(index, 3 /* Element */, (native), null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild((node.parent), native, currentView);
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
        ngDevMode && assertDataInRange(index - 1);
        node.tNode = tData[index] = createTNode(name, attrs || null, inlineViews ? [] : null);
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
    var tNode = (previousOrParentNode.tNode);
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
    var node = createLNode(0, 3 /* Element */, rNode, createLView(-1, renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs), null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
    if (firstTemplatePass) {
        node.tNode = createTNode(tag, null, null);
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
    var tNode = (node.tNode);
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
        previousOrParentNode = (previousOrParentNode.parent);
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
    var tNode = (node.tNode);
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
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this ndoe
 * @param tViews Any TViews attached to this node
 * @param localNames A list of local names and their matching indices
 * @returns the TNode object
 */
function createTNode(tagName, attrs, tViews) {
    ngDevMode && ngDevMode.tNode++;
    return {
        flags: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: null,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        tViews: tViews
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
    var node = createLNode(index, 3 /* Element */, textNode);
    // Text nodes are self closing.
    isParent = false;
    appendChild((node.parent), textNode, currentView);
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
    previousOrParentNode.data = hostView;
    hostView.node = previousOrParentNode;
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
    if (directiveDef.attributes != null && previousOrParentNode.type == 3 /* Element */) {
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
    var currentParent = isParent ? previousOrParentNode : previousOrParentNode.parent;
    var lContainer = createLContainer(currentParent, currentView, template);
    var node = createLNode(index, 0 /* Container */, undefined, lContainer);
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
        previousOrParentNode = (previousOrParentNode.parent);
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
    var container = (isParent ? previousOrParentNode : previousOrParentNode.parent);
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
        enterView(newView, viewNode = createLNode(null, 2 /* View */, null, newView));
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
    var containerNode = previousOrParentNode.parent;
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
        var node = viewNode.child;
        while (node) {
            if (node.type === 1 /* Projection */) {
                var nodeToProject = node.data.head;
                var lastNodeToProject = node.data.tail;
                while (nodeToProject) {
                    if (nodeToProject.dynamicLContainerNode) {
                        nodeToProject.dynamicLContainerNode.data.renderParent = renderParent;
                    }
                    nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
                }
            }
            node = node.next;
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
    var componentChild = componentNode.child;
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
        componentChild = componentChild.next;
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
    var node = createLNode(nodeIndex, 1 /* Projection */, null, { head: null, tail: null });
    if (node.tNode == null) {
        node.tNode = createTNode(null, attrs || null, null);
    }
    // `<ng-content>` has no content
    isParent = false;
    var currentParent = node.parent;
    // re-distribution of projectable nodes is memorized on a component's view level
    var componentNode = findComponentHost(currentView);
    var componentLView = (componentNode.data);
    var nodesForSelector = componentLView.data[localIndex][selectorIndex];
    // build the linked list of projected nodes:
    for (var i = 0; i < nodesForSelector.length; i++) {
        var nodeToProject = nodesForSelector[i];
        if (nodeToProject.type === 1 /* Projection */) {
            // Reprojecting a projection -> append the list of previously projected nodes
            var previouslyProjected = nodeToProject.data;
            appendToProjectionNode(node, previouslyProjected.head, previouslyProjected.tail);
        }
        else {
            // Projecting a single node
            appendToProjectionNode(node, nodeToProject, nodeToProject);
        }
    }
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
    while (viewRootLNode.type === 2 /* View */) {
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
    assertNotNull(previousOrParentNode.parent, 'previousOrParentNode should have a parent');
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
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertNotNull(component, 'expecting component got null');
    var lElementNode = component[NG_HOST_SYMBOL];
    ngDevMode && assertNotNull(component, 'object is not a component');
    return lElementNode;
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
export var ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OztBQVFBLE9BQU8sZUFBZSxDQUFDO0FBRXZCLE9BQU8sRUFBQyxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUc1RyxPQUFPLEVBQStCLHVCQUF1QixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFLOUYsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM3QyxPQUFPLEVBQUMsV0FBVyxFQUFFLFVBQVUsRUFBRSxtQkFBbUIsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbEksT0FBTyxFQUFDLDBCQUEwQixFQUFFLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUYsT0FBTyxFQUFvRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25KLE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7O0FBUTVHLE1BQU0sQ0FBQyxJQUFNLGNBQWMsR0FBRyxpQkFBaUIsQ0FBQzs7Ozs7QUFNaEQsSUFBTSxjQUFjLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Ozs7O0FBWTdDLE1BQU0sQ0FB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QUFXLENBQUMsUUFBUSxFQUFFLElBQUksRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0NBQ3hFO0FBRUQ7SUFDRSxhQUFhLENBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7Q0FDekY7QUFFRCwyQkFBMkIsS0FBYSxFQUFFLEdBQVc7SUFDbkQsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQztRQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7SUFDNUIsY0FBYyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSx5Q0FBeUMsQ0FBQyxDQUFDO0NBQ3hGO0FBRUQsd0JBQXdCLEtBQWEsRUFBRSxHQUFXO0lBQ2hELEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUM7UUFBQyxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQzVCLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxXQUFTLEtBQUssa0RBQTZDLEdBQUcsQ0FBQyxNQUFNLE1BQUcsQ0FBQyxDQUFDO0NBQ2xHO0FBRUQsTUFBTSx3Q0FBMkMsU0FBWTtJQUMzRCxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3RFLElBQU0sWUFBWSxHQUFJLFNBQWlCLENBQUMsY0FBYyxDQUFpQixDQUFDO0lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFDbkUsTUFBTSxDQUFDLFlBQVksQ0FBQztDQUNyQjtBQUVELE1BQU0sQ0FBQyxJQUFNLGFBQWEsR0FBRyxjQUFjLENBQUM7QUFDNUMsTUFBTSxDQUFDLElBQU0sc0JBQXNCLEdBQUcsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90TnVsbCwgYXNzZXJ0TnVsbCwgYXNzZXJ0U2FtZX0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3QsIExQcm9qZWN0aW9uLCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7Q3VycmVudE1hdGNoZXNMaXN0LCBMVmlldywgTFZpZXdGbGFncywgTGlmZWN5Y2xlU3RhZ2UsIFJvb3RDb250ZXh0LCBURGF0YSwgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTE5vZGVUeXBlLCBUTm9kZUZsYWdzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVENvbnRhaW5lck5vZGUsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLH0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBpbnNlcnRWaWV3LCBhcHBlbmRQcm9qZWN0ZWROb2RlLCByZW1vdmVWaWV3LCBjYW5JbnNlcnROYXRpdmVOb2RlLCBjcmVhdGVUZXh0Tm9kZX0gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBtYXRjaGluZ1NlbGVjdG9ySW5kZXh9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0LCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBQaXBlRGVmTGlzdCwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge1JFbGVtZW50LCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBQcm9jZWR1cmFsUmVuZGVyZXIzLCBSZW5kZXJlclN0eWxlRmxhZ3MzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7aXNEaWZmZXJlbnQsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBxdWV1ZUxpZmVjeWNsZUhvb2tzLCBxdWV1ZUluaXRIb29rcywgZXhlY3V0ZUluaXRIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge1ZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuaW1wb3J0IHt0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvciwgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcblxuLyoqXG4gKiBEaXJlY3RpdmUgKEQpIHNldHMgYSBwcm9wZXJ0eSBvbiBhbGwgY29tcG9uZW50IGluc3RhbmNlcyB1c2luZyB0aGlzIGNvbnN0YW50IGFzIGEga2V5IGFuZCB0aGVcbiAqIGNvbXBvbmVudCdzIGhvc3Qgbm9kZSAoTEVsZW1lbnQpIGFzIHRoZSB2YWx1ZS4gVGhpcyBpcyB1c2VkIGluIG1ldGhvZHMgbGlrZSBkZXRlY3RDaGFuZ2VzIHRvXG4gKiBmYWNpbGl0YXRlIGp1bXBpbmcgZnJvbSBhbiBpbnN0YW5jZSB0byB0aGUgaG9zdCBub2RlLlxuICovXG5leHBvcnQgY29uc3QgTkdfSE9TVF9TWU1CT0wgPSAnX19uZ0hvc3RMTm9kZV9fJztcblxuLyoqXG4gKiBBIHBlcm1hbmVudCBtYXJrZXIgcHJvbWlzZSB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgY3VycmVudCBDRCB0cmVlIGlzXG4gKiBjbGVhbi5cbiAqL1xuY29uc3QgX0NMRUFOX1BST01JU0UgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbi8qKlxuICogRnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUgYmVmb3JlIHdyaXRpbmcgaXQgaW50byB0aGUgcmVuZGVyZXIuXG4gKi9cbmV4cG9ydCB0eXBlIFNhbml0aXplckZuID0gKHZhbHVlOiBhbnkpID0+IHN0cmluZztcblxuLyoqXG4gKiBEaXJlY3RpdmUgYW5kIGVsZW1lbnQgaW5kaWNlcyBmb3IgdG9wLWxldmVsIGRpcmVjdGl2ZS5cbiAqXG4gKiBTYXZlZCBoZXJlIHRvIGF2b2lkIHJlLWluc3RhbnRpYXRpbmcgYW4gYXJyYXkgb24gZXZlcnkgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKi9cbmV4cG9ydCBjb25zdCBfUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IFswLCAwXTtcblxuLyoqXG4gKiBUb2tlbiBzZXQgaW4gY3VycmVudE1hdGNoZXMgd2hpbGUgZGVwZW5kZW5jaWVzIGFyZSBiZWluZyByZXNvbHZlZC5cbiAqXG4gKiBJZiB3ZSB2aXNpdCBhIGRpcmVjdGl2ZSB0aGF0IGhhcyBhIHZhbHVlIHNldCB0byBDSVJDVUxBUiwgd2Uga25vdyB3ZSd2ZVxuICogYWxyZWFkeSBzZWVuIGl0LCBhbmQgdGh1cyBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cbiAqL1xuZXhwb3J0IGNvbnN0IENJUkNVTEFSID0gJ19fQ0lSQ1VMQVJfXyc7XG5cbi8qKlxuICogVGhpcyBwcm9wZXJ0eSBnZXRzIHNldCBiZWZvcmUgZW50ZXJpbmcgYSB0ZW1wbGF0ZS5cbiAqXG4gKiBUaGlzIHJlbmRlcmVyIGNhbiBiZSBvbmUgb2YgdHdvIHZhcmlldGllcyBvZiBSZW5kZXJlcjM6XG4gKlxuICogLSBPYmplY3RlZE9yaWVudGVkUmVuZGVyZXIzXG4gKlxuICogVGhpcyBpcyB0aGUgbmF0aXZlIGJyb3dzZXIgQVBJIHN0eWxlLCBlLmcuIG9wZXJhdGlvbnMgYXJlIG1ldGhvZHMgb24gaW5kaXZpZHVhbCBvYmplY3RzXG4gKiBsaWtlIEhUTUxFbGVtZW50LiBXaXRoIHRoaXMgc3R5bGUsIG5vIGFkZGl0aW9uYWwgY29kZSBpcyBuZWVkZWQgYXMgYSBmYWNhZGUgKHJlZHVjaW5nIHBheWxvYWRcbiAqIHNpemUpLlxuICpcbiAqIC0gUHJvY2VkdXJhbFJlbmRlcmVyM1xuICpcbiAqIEluIG5vbi1uYXRpdmUgYnJvd3NlciBlbnZpcm9ubWVudHMgKGUuZy4gcGxhdGZvcm1zIHN1Y2ggYXMgd2ViLXdvcmtlcnMpLCB0aGlzIGlzIHRoZSBmYWNhZGVcbiAqIHRoYXQgZW5hYmxlcyBlbGVtZW50IG1hbmlwdWxhdGlvbi4gVGhpcyBhbHNvIGZhY2lsaXRhdGVzIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IHdpdGhcbiAqIFJlbmRlcmVyMi5cbiAqL1xubGV0IHJlbmRlcmVyOiBSZW5kZXJlcjM7XG5sZXQgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVuZGVyZXIoKTogUmVuZGVyZXIzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiByZW5kZXJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRTYW5pdGl6ZXIoKTogU2FuaXRpemVyfG51bGwge1xuICByZXR1cm4gY3VycmVudFZpZXcgJiYgY3VycmVudFZpZXcuc2FuaXRpemVyO1xufVxuXG4vKiogVXNlZCB0byBzZXQgdGhlIHBhcmVudCBwcm9wZXJ0eSB3aGVuIG5vZGVzIGFyZSBjcmVhdGVkLiAqL1xubGV0IHByZXZpb3VzT3JQYXJlbnROb2RlOiBMTm9kZTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCk6IExOb2RlIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBwcmV2aW91c09yUGFyZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBJZiBgaXNQYXJlbnRgIGlzOlxuICogIC0gYHRydWVgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIGEgcGFyZW50IG5vZGUuXG4gKiAgLSBgZmFsc2VgOiB0aGVuIGBwcmV2aW91c09yUGFyZW50Tm9kZWAgcG9pbnRzIHRvIHByZXZpb3VzIG5vZGUgKHNpYmxpbmcpLlxuICovXG5sZXQgaXNQYXJlbnQ6IGJvb2xlYW47XG5cbi8qKlxuICogU3RhdGljIGRhdGEgdGhhdCBjb3JyZXNwb25kcyB0byB0aGUgaW5zdGFuY2Utc3BlY2lmaWMgZGF0YSBhcnJheSBvbiBhbiBMVmlldy5cbiAqXG4gKiBFYWNoIG5vZGUncyBzdGF0aWMgZGF0YSBpcyBzdG9yZWQgaW4gdERhdGEgYXQgdGhlIHNhbWUgaW5kZXggdGhhdCBpdCdzIHN0b3JlZFxuICogaW4gdGhlIGRhdGEgYXJyYXkuIEFueSBub2RlcyB0aGF0IGRvIG5vdCBoYXZlIHN0YXRpYyBkYXRhIHN0b3JlIGEgbnVsbCB2YWx1ZSBpblxuICogdERhdGEgdG8gYXZvaWQgYSBzcGFyc2UgYXJyYXkuXG4gKi9cbmxldCB0RGF0YTogVERhdGE7XG5cbi8qKlxuICogU3RhdGUgb2YgdGhlIGN1cnJlbnQgdmlldyBiZWluZyBwcm9jZXNzZWQuXG4gKlxuICogTk9URTogd2UgY2hlYXQgaGVyZSBhbmQgaW5pdGlhbGl6ZSBpdCB0byBgbnVsbGAgZXZlbiB0aG91Z2h0IHRoZSB0eXBlIGRvZXMgbm90XG4gKiBjb250YWluIGBudWxsYC4gVGhpcyBpcyBiZWNhdXNlIHdlIGV4cGVjdCB0aGlzIHZhbHVlIHRvIGJlIG5vdCBgbnVsbGAgYXMgc29vblxuICogYXMgd2UgZW50ZXIgdGhlIHZpZXcuIERlY2xhcmluZyB0aGUgdHlwZSBhcyBgbnVsbGAgd291bGQgcmVxdWlyZSB1cyB0byBwbGFjZSBgIWBcbiAqIGluIG1vc3QgaW5zdHJ1Y3Rpb25zIHNpbmNlIHRoZXkgYWxsIGFzc3VtZSB0aGF0IGBjdXJyZW50Vmlld2AgaXMgZGVmaW5lZC5cbiAqL1xubGV0IGN1cnJlbnRWaWV3OiBMVmlldyA9IG51bGwgITtcblxubGV0IGN1cnJlbnRRdWVyaWVzOiBMUXVlcmllc3xudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFF1ZXJpZXMoUXVlcnlUeXBlOiB7bmV3ICgpOiBMUXVlcmllc30pOiBMUXVlcmllcyB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3VycmVudFF1ZXJpZXMgfHwgKGN1cnJlbnRRdWVyaWVzID0gbmV3IFF1ZXJ5VHlwZSgpKTtcbn1cblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICovXG5sZXQgY3JlYXRpb25Nb2RlOiBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3JlYXRpb25Nb2RlKCk6IGJvb2xlYW4ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIGNyZWF0aW9uTW9kZTtcbn1cblxuLyoqXG4gKiBBbiBhcnJheSBvZiBub2RlcyAodGV4dCwgZWxlbWVudCwgY29udGFpbmVyLCBldGMpLCBwaXBlcywgdGhlaXIgYmluZGluZ3MsIGFuZFxuICogYW55IGxvY2FsIHZhcmlhYmxlcyB0aGF0IG5lZWQgdG8gYmUgc3RvcmVkIGJldHdlZW4gaW52b2NhdGlvbnMuXG4gKi9cbmxldCBkYXRhOiBhbnlbXTtcblxuLyoqXG4gKiBBbiBhcnJheSBvZiBkaXJlY3RpdmUgaW5zdGFuY2VzIGluIHRoZSBjdXJyZW50IHZpZXcuXG4gKlxuICogVGhlc2UgbXVzdCBiZSBzdG9yZWQgc2VwYXJhdGVseSBmcm9tIExOb2RlcyBiZWNhdXNlIHRoZWlyIHByZXNlbmNlIGlzXG4gKiB1bmtub3duIGF0IGNvbXBpbGUtdGltZSBhbmQgdGh1cyBzcGFjZSBjYW5ub3QgYmUgcmVzZXJ2ZWQgaW4gZGF0YVtdLlxuICovXG5sZXQgZGlyZWN0aXZlczogYW55W118bnVsbDtcblxuLyoqXG4gKiBXaGVuIGEgdmlldyBpcyBkZXN0cm95ZWQsIGxpc3RlbmVycyBuZWVkIHRvIGJlIHJlbGVhc2VkIGFuZCBvdXRwdXRzIG5lZWQgdG8gYmVcbiAqIHVuc3Vic2NyaWJlZC4gVGhpcyBjbGVhbnVwIGFycmF5IHN0b3JlcyBib3RoIGxpc3RlbmVyIGRhdGEgKGluIGNodW5rcyBvZiA0KVxuICogYW5kIG91dHB1dCBkYXRhIChpbiBjaHVua3Mgb2YgMikgZm9yIGEgcGFydGljdWxhciB2aWV3LiBDb21iaW5pbmcgdGhlIGFycmF5c1xuICogc2F2ZXMgb24gbWVtb3J5ICg3MCBieXRlcyBwZXIgYXJyYXkpIGFuZCBvbiBhIGZldyBieXRlcyBvZiBjb2RlIHNpemUgKGZvciB0d29cbiAqIHNlcGFyYXRlIGZvciBsb29wcykuXG4gKlxuICogSWYgaXQncyBhIGxpc3RlbmVyIGJlaW5nIHN0b3JlZDpcbiAqIDFzdCBpbmRleCBpczogZXZlbnQgbmFtZSB0byByZW1vdmVcbiAqIDJuZCBpbmRleCBpczogbmF0aXZlIGVsZW1lbnRcbiAqIDNyZCBpbmRleCBpczogbGlzdGVuZXIgZnVuY3Rpb25cbiAqIDR0aCBpbmRleCBpczogdXNlQ2FwdHVyZSBib29sZWFuXG4gKlxuICogSWYgaXQncyBhbiBvdXRwdXQgc3Vic2NyaXB0aW9uOlxuICogMXN0IGluZGV4IGlzOiB1bnN1YnNjcmliZSBmdW5jdGlvblxuICogMm5kIGluZGV4IGlzOiBjb250ZXh0IGZvciBmdW5jdGlvblxuICovXG5sZXQgY2xlYW51cDogYW55W118bnVsbDtcblxuLyoqXG4gKiBJbiB0aGlzIG1vZGUsIGFueSBjaGFuZ2VzIGluIGJpbmRpbmdzIHdpbGwgdGhyb3cgYW4gRXhwcmVzc2lvbkNoYW5nZWRBZnRlckNoZWNrZWQgZXJyb3IuXG4gKlxuICogTmVjZXNzYXJ5IHRvIHN1cHBvcnQgQ2hhbmdlRGV0ZWN0b3JSZWYuY2hlY2tOb0NoYW5nZXMoKS5cbiAqL1xubGV0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuXG4vKiogV2hldGhlciBvciBub3QgdGhpcyBpcyB0aGUgZmlyc3QgdGltZSB0aGUgY3VycmVudCB2aWV3IGhhcyBiZWVuIHByb2Nlc3NlZC4gKi9cbmxldCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRydWU7XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogU3dhcCB0aGUgY3VycmVudCBzdGF0ZSB3aXRoIGEgbmV3IHN0YXRlLlxuICpcbiAqIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIHdlIHN0b3JlIHRoZSBzdGF0ZSBpbiB0aGUgdG9wIGxldmVsIG9mIHRoZSBtb2R1bGUuXG4gKiBUaGlzIHdheSB3ZSBtaW5pbWl6ZSB0aGUgbnVtYmVyIG9mIHByb3BlcnRpZXMgdG8gcmVhZC4gV2hlbmV2ZXIgYSBuZXcgdmlld1xuICogaXMgZW50ZXJlZCB3ZSBoYXZlIHRvIHN0b3JlIHRoZSBzdGF0ZSBmb3IgbGF0ZXIsIGFuZCB3aGVuIHRoZSB2aWV3IGlzXG4gKiBleGl0ZWQgdGhlIHN0YXRlIGhhcyB0byBiZSByZXN0b3JlZFxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gaG9zdCBFbGVtZW50IHRvIHdoaWNoIHRoZSBWaWV3IGlzIGEgY2hpbGQgb2ZcbiAqIEByZXR1cm5zIHRoZSBwcmV2aW91cyBzdGF0ZTtcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVudGVyVmlldyhuZXdWaWV3OiBMVmlldywgaG9zdDogTEVsZW1lbnROb2RlIHwgTFZpZXdOb2RlIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3Qgb2xkVmlldzogTFZpZXcgPSBjdXJyZW50VmlldztcbiAgZGF0YSA9IG5ld1ZpZXcgJiYgbmV3Vmlldy5kYXRhO1xuICBkaXJlY3RpdmVzID0gbmV3VmlldyAmJiBuZXdWaWV3LmRpcmVjdGl2ZXM7XG4gIHREYXRhID0gbmV3VmlldyAmJiBuZXdWaWV3LnRWaWV3LmRhdGE7XG4gIGNyZWF0aW9uTW9kZSA9IG5ld1ZpZXcgJiYgKG5ld1ZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgPT09IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICBmaXJzdFRlbXBsYXRlUGFzcyA9IG5ld1ZpZXcgJiYgbmV3Vmlldy50Vmlldy5maXJzdFRlbXBsYXRlUGFzcztcblxuICBjbGVhbnVwID0gbmV3VmlldyAmJiBuZXdWaWV3LmNsZWFudXA7XG4gIHJlbmRlcmVyID0gbmV3VmlldyAmJiBuZXdWaWV3LnJlbmRlcmVyO1xuXG4gIGlmIChuZXdWaWV3ICYmIG5ld1ZpZXcuYmluZGluZ0luZGV4IDwgMCkge1xuICAgIG5ld1ZpZXcuYmluZGluZ0luZGV4ID0gbmV3Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcbiAgfVxuXG4gIGlmIChob3N0ICE9IG51bGwpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGhvc3Q7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICB9XG5cbiAgY3VycmVudFZpZXcgPSBuZXdWaWV3O1xuICBjdXJyZW50UXVlcmllcyA9IG5ld1ZpZXcgJiYgbmV3Vmlldy5xdWVyaWVzO1xuXG4gIHJldHVybiBvbGRWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgaW4gbGlldSBvZiBlbnRlclZpZXcgdG8gbWFrZSBpdCBjbGVhciB3aGVuIHdlIGFyZSBleGl0aW5nIGEgY2hpbGQgdmlldy4gVGhpcyBtYWtlc1xuICogdGhlIGRpcmVjdGlvbiBvZiB0cmF2ZXJzYWwgKHVwIG9yIGRvd24gdGhlIHZpZXcgdHJlZSkgYSBiaXQgY2xlYXJlci5cbiAqXG4gKiBAcGFyYW0gbmV3VmlldyBOZXcgc3RhdGUgdG8gYmVjb21lIGFjdGl2ZVxuICogQHBhcmFtIGNyZWF0aW9uT25seSBBbiBvcHRpb25hbCBib29sZWFuIHRvIGluZGljYXRlIHRoYXQgdGhlIHZpZXcgd2FzIHByb2Nlc3NlZCBpbiBjcmVhdGlvbiBtb2RlXG4gKiBvbmx5LCBpLmUuIHRoZSBmaXJzdCB1cGRhdGUgd2lsbCBiZSBkb25lIGxhdGVyLiBPbmx5IHBvc3NpYmxlIGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbGVhdmVWaWV3KG5ld1ZpZXc6IExWaWV3LCBjcmVhdGlvbk9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGlmICghY3JlYXRpb25Pbmx5KSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgICBkaXJlY3RpdmVzICEsIGN1cnJlbnRWaWV3LnRWaWV3LnZpZXdIb29rcywgY3VycmVudFZpZXcudFZpZXcudmlld0NoZWNrSG9va3MsXG4gICAgICAgICAgY3JlYXRpb25Nb2RlKTtcbiAgICB9XG4gICAgLy8gVmlld3MgYXJlIGNsZWFuIGFuZCBpbiB1cGRhdGUgbW9kZSBhZnRlciBiZWluZyBjaGVja2VkLCBzbyB0aGVzZSBiaXRzIGFyZSBjbGVhcmVkXG4gICAgY3VycmVudFZpZXcuZmxhZ3MgJj0gfihMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuRGlydHkpO1xuICB9XG4gIGN1cnJlbnRWaWV3LmxpZmVjeWNsZVN0YWdlID0gTGlmZWN5Y2xlU3RhZ2UuSW5pdDtcbiAgY3VycmVudFZpZXcuYmluZGluZ0luZGV4ID0gLTE7XG4gIGVudGVyVmlldyhuZXdWaWV3LCBudWxsKTtcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBjaGlsZHJlbiwgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0IGJpbmRpbmdzLFxuICogcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICogKi9cbmZ1bmN0aW9uIHJlZnJlc2hWaWV3KCkge1xuICBjb25zdCB0VmlldyA9IGN1cnJlbnRWaWV3LnRWaWV3O1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG4gIHJlZnJlc2hEeW5hbWljQ2hpbGRyZW4oKTtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBleGVjdXRlSG9va3MoZGlyZWN0aXZlcyAhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICB9XG5cbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3Lmhvc3RCaW5kaW5ncyk7XG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyhiaW5kaW5nczogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChiaW5kaW5ncyAhPSBudWxsKSB7XG4gICAgY29uc3QgZGVmcyA9IGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgITtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGJpbmRpbmdzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJJbmRleCA9IGJpbmRpbmdzW2ldO1xuICAgICAgY29uc3QgZGVmID0gZGVmc1tkaXJJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICYmIGRlZi5ob3N0QmluZGluZ3MoZGlySW5kZXgsIGJpbmRpbmdzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldLCBjb21wb25lbnRzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpOiB2b2lkIHtcbiAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICBjb25zdCB0VmlldyA9IGN1cnJlbnRWaWV3LnRWaWV3O1xuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHZpZXdJZDogbnVtYmVyLCByZW5kZXJlcjogUmVuZGVyZXIzLCB0VmlldzogVFZpZXcsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPnwgbnVsbCxcbiAgICBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IG5ld1ZpZXcgPSB7XG4gICAgcGFyZW50OiBjdXJyZW50VmlldyxcbiAgICBpZDogdmlld0lkLCAgLy8gLTEgZm9yIGNvbXBvbmVudCB2aWV3c1xuICAgIGZsYWdzOiBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCxcbiAgICBub2RlOiBudWxsICEsICAvLyB1bnRpbCB3ZSBpbml0aWFsaXplIGl0IGluIGNyZWF0ZU5vZGUuXG4gICAgZGF0YTogW10sXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICB0VmlldzogdFZpZXcsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICByZW5kZXJlcjogcmVuZGVyZXIsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgdGFpbDogbnVsbCxcbiAgICBuZXh0OiBudWxsLFxuICAgIGJpbmRpbmdTdGFydEluZGV4OiAtMSxcbiAgICBiaW5kaW5nSW5kZXg6IC0xLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBjb250ZXh0OiBjb250ZXh0LFxuICAgIGR5bmFtaWNWaWV3Q291bnQ6IDAsXG4gICAgbGlmZWN5Y2xlU3RhZ2U6IExpZmVjeWNsZVN0YWdlLkluaXQsXG4gICAgcXVlcmllczogbnVsbCxcbiAgICBpbmplY3RvcjogY3VycmVudFZpZXcgJiYgY3VycmVudFZpZXcuaW5qZWN0b3IsXG4gICAgc2FuaXRpemVyOiBzYW5pdGl6ZXIgfHwgbnVsbFxuICB9O1xuXG4gIHJldHVybiBuZXdWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0aW9uIG9mIExOb2RlIG9iamVjdCBpcyBleHRyYWN0ZWQgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiBzbyB3ZSBhbHdheXMgY3JlYXRlIExOb2RlIG9iamVjdFxuICogd2l0aCB0aGUgc2FtZSBzaGFwZVxuICogKHNhbWUgcHJvcGVydGllcyBhc3NpZ25lZCBpbiB0aGUgc2FtZSBvcmRlcikuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMTm9kZU9iamVjdChcbiAgICB0eXBlOiBMTm9kZVR5cGUsIGN1cnJlbnRWaWV3OiBMVmlldywgcGFyZW50OiBMTm9kZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBzdGF0ZTogYW55LFxuICAgIHF1ZXJpZXM6IExRdWVyaWVzIHwgbnVsbCk6IExFbGVtZW50Tm9kZSZMVGV4dE5vZGUmTFZpZXdOb2RlJkxDb250YWluZXJOb2RlJkxQcm9qZWN0aW9uTm9kZSB7XG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksXG4gICAgdmlldzogY3VycmVudFZpZXcsXG4gICAgcGFyZW50OiBwYXJlbnQgYXMgYW55LFxuICAgIGNoaWxkOiBudWxsLFxuICAgIG5leHQ6IG51bGwsXG4gICAgbm9kZUluamVjdG9yOiBwYXJlbnQgPyBwYXJlbnQubm9kZUluamVjdG9yIDogbnVsbCxcbiAgICBkYXRhOiBzdGF0ZSxcbiAgICBxdWVyaWVzOiBxdWVyaWVzLFxuICAgIHROb2RlOiBudWxsLFxuICAgIHBOZXh0T3JQYXJlbnQ6IG51bGwsXG4gICAgZHluYW1pY0xDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogQSBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHRoZSBMTm9kZSB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlbSBoYXZlIHNhbWUgc2hhcGUgdG9cbiAqIGtlZXAgdGhlIGV4ZWN1dGlvbiBjb2RlIG1vbm9tb3JwaGljIGFuZCBmYXN0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciB8IG51bGwsIHR5cGU6IExOb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLFxuICAgIGxWaWV3PzogTFZpZXcgfCBudWxsKTogTEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudWxsLCB0eXBlOiBMTm9kZVR5cGUuVmlldywgbmF0aXZlOiBudWxsLCBsVmlldzogTFZpZXcpOiBMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogTE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiB1bmRlZmluZWQsXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IExDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IExOb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsXG4gICAgbFByb2plY3Rpb246IExQcm9qZWN0aW9uKTogTFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCB0eXBlOiBMTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgc3RhdGU/OiBudWxsIHwgTFZpZXcgfCBMQ29udGFpbmVyIHwgTFByb2plY3Rpb24pOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZcbiAgICBMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICBjb25zdCBwYXJlbnQgPSBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZSAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgYXMgTE5vZGU7XG4gIGxldCBxdWVyaWVzID1cbiAgICAgIChpc1BhcmVudCA/IGN1cnJlbnRRdWVyaWVzIDogcHJldmlvdXNPclBhcmVudE5vZGUgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcykgfHxcbiAgICAgIHBhcmVudCAmJiBwYXJlbnQucXVlcmllcyAmJiBwYXJlbnQucXVlcmllcy5jaGlsZCgpO1xuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCBjdXJyZW50VmlldywgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsLCBxdWVyaWVzKTtcblxuICBpZiAoKHR5cGUgJiBMTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IExOb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICAvLyBCaXQgb2YgYSBoYWNrIHRvIGJ1c3QgdGhyb3VnaCB0aGUgcmVhZG9ubHkgYmVjYXVzZSB0aGVyZSBpcyBhIGNpcmN1bGFyIGRlcCBiZXR3ZWVuXG4gICAgLy8gTFZpZXcgYW5kIExOb2RlLlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdWxsKChzdGF0ZSBhcyBMVmlldykubm9kZSwgJ0xWaWV3Lm5vZGUgc2hvdWxkIG5vdCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQnKTtcbiAgICAoc3RhdGUgYXMgTFZpZXcgYXN7bm9kZTogTE5vZGV9KS5ub2RlID0gbm9kZTtcbiAgfVxuICBpZiAoaW5kZXggIT0gbnVsbCkge1xuICAgIC8vIFdlIGFyZSBFbGVtZW50IG9yIENvbnRhaW5lclxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gICAgZGF0YVtpbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGluZGV4ID49IHREYXRhLmxlbmd0aCkge1xuICAgICAgdERhdGFbaW5kZXhdID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgbm9kZS50Tm9kZSA9IHREYXRhW2luZGV4XSBhcyBUTm9kZTtcbiAgICB9XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS52aWV3ID09PSBjdXJyZW50VmlldyB8fFxuICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLnR5cGUgPT09IExOb2RlVHlwZS5WaWV3KSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IFZpZXcuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdWxsKFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLmNoaWxkLFxuICAgICAgICAgICAgICAgICAgICAgICAgIGBwcmV2aW91c09yUGFyZW50Tm9kZSdzIGNoaWxkIHNob3VsZCBub3QgaGF2ZSBiZWVuIHNldC5gKTtcbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUuY2hpbGQgPSBub2RlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gV2UgYXJlIGFkZGluZyBjb21wb25lbnQgdmlldywgc28gd2UgZG9uJ3QgbGluayBwYXJlbnQgbm9kZSBjaGlsZCB0byB0aGlzIG5vZGUuXG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE51bGwoXG4gICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLm5leHQsXG4gICAgICAgICAgICAgICAgICAgICAgIGBwcmV2aW91c09yUGFyZW50Tm9kZSdzIG5leHQgcHJvcGVydHkgc2hvdWxkIG5vdCBoYXZlIGJlZW4gc2V0ICR7aW5kZXh9LmApO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUubmV4dCA9IG5vZGU7XG4gICAgICBpZiAocHJldmlvdXNPclBhcmVudE5vZGUuZHluYW1pY0xDb250YWluZXJOb2RlKSB7XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLmR5bmFtaWNMQ29udGFpbmVyTm9kZS5uZXh0ID0gbm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBub2RlO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIHJldHVybiBub2RlO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXNldHMgdGhlIGFwcGxpY2F0aW9uIHN0YXRlLlxuICovXG5mdW5jdGlvbiByZXNldEFwcGxpY2F0aW9uU3RhdGUoKSB7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xufVxuXG4vKipcbiAqXG4gKiBAcGFyYW0gaG9zdE5vZGUgRXhpc3Rpbmcgbm9kZSB0byByZW5kZXIgaW50by5cbiAqIEBwYXJhbSB0ZW1wbGF0ZSBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3Q6IExFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgaWYgKGhvc3QgPT0gbnVsbCkge1xuICAgIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpO1xuICAgIHJlbmRlcmVyRmFjdG9yeSA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5O1xuICAgIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZSwgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsKTtcbiAgICBob3N0ID0gY3JlYXRlTE5vZGUoXG4gICAgICAgIG51bGwsIExOb2RlVHlwZS5FbGVtZW50LCBob3N0Tm9kZSxcbiAgICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgICAtMSwgcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCksIHRWaWV3LCBudWxsLCB7fSxcbiAgICAgICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcikpO1xuICB9XG4gIGNvbnN0IGhvc3RWaWV3ID0gaG9zdC5kYXRhICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGhvc3RWaWV3LCAnSG9zdCBub2RlIHNob3VsZCBoYXZlIGFuIExWaWV3IGRlZmluZWQgaW4gaG9zdC5kYXRhLicpO1xuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3QsIGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZSk7XG4gIHJldHVybiBob3N0O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3Tm9kZTogTFZpZXdOb2RlIHwgbnVsbCwgdFZpZXc6IFRWaWV3LCB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQ6IFQsXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3QgfCBudWxsLFxuICAgIHBpcGVzPzogUGlwZURlZkxpc3QgfCBudWxsKTogTFZpZXdOb2RlIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gaXNQYXJlbnQ7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBsZXQgb2xkVmlldzogTFZpZXc7XG4gIGxldCByZjogUmVuZGVyRmxhZ3MgPSBSZW5kZXJGbGFncy5VcGRhdGU7XG4gIHRyeSB7XG4gICAgaXNQYXJlbnQgPSB0cnVlO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gbnVsbCAhO1xuXG4gICAgaWYgKHZpZXdOb2RlID09IG51bGwpIHtcbiAgICAgIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgICAgLTEsIHJlbmRlcmVyLCB0VmlldywgdGVtcGxhdGUsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICAgIHZpZXdOb2RlID0gY3JlYXRlTE5vZGUobnVsbCwgTE5vZGVUeXBlLlZpZXcsIG51bGwsIGxWaWV3KTtcbiAgICAgIHJmID0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgIH1cbiAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgICB0ZW1wbGF0ZShyZiwgY29udGV4dCk7XG4gICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2aWV3Tm9kZS5kYXRhLnRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgLy8gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIGlzIGNhbGxlZCB0d2ljZSBpbiBmYWN0LCBvbmNlIGZvciBjcmVhdGlvbiBvbmx5IGFuZCB0aGVuIG9uY2UgZm9yXG4gICAgLy8gdXBkYXRlLiBXaGVuIGZvciBjcmVhdGlvbiBvbmx5LCBsZWF2ZVZpZXcoKSBtdXN0IG5vdCB0cmlnZ2VyIHZpZXcgaG9va3MsIG5vciBjbGVhbiBmbGFncy5cbiAgICBjb25zdCBpc0NyZWF0aW9uT25seSA9IChyZiAmIFJlbmRlckZsYWdzLkNyZWF0ZSkgPT09IFJlbmRlckZsYWdzLkNyZWF0ZTtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBpc0NyZWF0aW9uT25seSk7XG4gICAgaXNQYXJlbnQgPSBfaXNQYXJlbnQ7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBfcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIH1cbiAgcmV0dXJuIHZpZXdOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBub2RlOiBMRWxlbWVudE5vZGUsIGhvc3RWaWV3OiBMVmlldywgY29tcG9uZW50T3JDb250ZXh0OiBULCB0ZW1wbGF0ZT86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIG5vZGUpO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGUpIHtcbiAgICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50T3JDb250ZXh0ICEpO1xuICAgICAgcmVmcmVzaFZpZXcoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXhlY3V0ZUluaXRBbmRDb250ZW50SG9va3MoKTtcblxuICAgICAgLy8gRWxlbWVudCB3YXMgc3RvcmVkIGF0IDAgaW4gZGF0YSBhbmQgZGlyZWN0aXZlIHdhcyBzdG9yZWQgYXQgMCBpbiBkaXJlY3RpdmVzXG4gICAgICAvLyBpbiByZW5kZXJDb21wb25lbnQoKVxuICAgICAgc2V0SG9zdEJpbmRpbmdzKF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTKTtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goMCwgMCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIEJ5IGRlZmF1bHQsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuIHdpdGggdGhlXG4gKiBjcmVhdGlvbiBibG9jayB3aGVuIHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUuIE90aGVyd2lzZSwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW5cbiAqIGFsb25lLlxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgZG8gTk9UIHVzZSB0aGlzIGNvbmZpZ3VyYXRpb24gKHVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5KS5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyRmxhZ3ModmlldzogTFZpZXcpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiB2aWV3LmZsYWdzICYgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTSBlbGVtZW50IG9uIGNyZWF0aW9uLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQXR0cmlidXRlcyBhbmQgbG9jYWxSZWZzIGFyZSBwYXNzZWQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVyZSBlbGVtZW50cyB3aXRoIGFuIGV2ZW4gaW5kZXhcbiAqIGhvbGQgYW4gYXR0cmlidXRlIG5hbWUgYW5kIGVsZW1lbnRzIHdpdGggYW4gb2RkIGluZGV4IGhvbGQgYW4gYXR0cmlidXRlIHZhbHVlLCBleC46XG4gKiBbJ2lkJywgJ3dhcm5pbmc1JywgJ2NsYXNzJywgJ2FsZXJ0J11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogc3RyaW5nW10gfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiBSRWxlbWVudCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIC0xLCAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG4gIGNvbnN0IG5hdGl2ZTogUkVsZW1lbnQgPSByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUpO1xuICBjb25zdCBub2RlOiBMRWxlbWVudE5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgTE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgYXBwZW5kQ2hpbGQobm9kZS5wYXJlbnQgISwgbmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMsIGZhbHNlKTtcbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgY3VycmVudCBub2RlICh0byBjcmVhdGUgVE5vZGUpXG4gKiBAcGFyYW0gbmFtZSBUYWcgbmFtZSBvZiB0aGUgY3VycmVudCBub2RlXG4gKiBAcGFyYW0gYXR0cnMgQXR0cnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBjdXJyZW50IG5vZGVcbiAqIEBwYXJhbSBpbmxpbmVWaWV3cyBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgd2lsbCBjcmVhdGUgaW5saW5lIHZpZXdzXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCwgaW5saW5lVmlld3M6IGJvb2xlYW4pIHtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4IC0gMSk7XG4gICAgbm9kZS50Tm9kZSA9IHREYXRhW2luZGV4XSA9IGNyZWF0ZVROb2RlKG5hbWUsIGF0dHJzIHx8IG51bGwsIGlubGluZVZpZXdzID8gW10gOiBudWxsKTtcbiAgICBjYWNoZU1hdGNoaW5nRGlyZWN0aXZlc0Zvck5vZGUobm9kZS50Tm9kZSwgY3VycmVudFZpZXcudFZpZXcsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpO1xuICB9XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSgpO1xufVxuXG4vKipcbiAqIE9uIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHdlIG1hdGNoIGVhY2ggbm9kZSBhZ2FpbnN0IGF2YWlsYWJsZSBkaXJlY3RpdmUgc2VsZWN0b3JzIGFuZCBzYXZlXG4gKiB0aGUgcmVzdWx0aW5nIGRlZnMgaW4gdGhlIGNvcnJlY3QgaW5zdGFudGlhdGlvbiBvcmRlciBmb3Igc3Vic2VxdWVudCBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bnNcbiAqIChzbyBkZXBlbmRlbmNpZXMgYXJlIGFsd2F5cyBjcmVhdGVkIGJlZm9yZSB0aGUgZGlyZWN0aXZlcyB0aGF0IGluamVjdCB0aGVtKS5cbiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpbiB0c2lja2xlLlxuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgY29uc3QgbWF0Y2hlcyA9IHRWaWV3LmN1cnJlbnRNYXRjaGVzID0gZmluZERpcmVjdGl2ZU1hdGNoZXModE5vZGUpO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHZhbHVlSW5kZXggPSBpICsgMTtcbiAgICAgIHJlc29sdmVEaXJlY3RpdmUoZGVmLCB2YWx1ZUluZGV4LCBtYXRjaGVzLCB0Vmlldyk7XG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKG1hdGNoZXNbdmFsdWVJbmRleF0gYXMgbnVtYmVyLCBkZWYsIGV4cG9ydHNNYXApO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy4gKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlOiBUTm9kZSk6IEN1cnJlbnRNYXRjaGVzTGlzdHxudWxsIHtcbiAgY29uc3QgcmVnaXN0cnkgPSBjdXJyZW50Vmlldy50Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXTtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyAhKSkge1xuICAgICAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZGVmLmRpUHVibGljKSBkZWYuZGlQdWJsaWMoZGVmKTtcbiAgICAgICAgKG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSkpLnB1c2goZGVmLCBudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXMgYXMgQ3VycmVudE1hdGNoZXNMaXN0O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB2YWx1ZUluZGV4OiBudW1iZXIsIG1hdGNoZXM6IEN1cnJlbnRNYXRjaGVzTGlzdCwgdFZpZXc6IFRWaWV3KTogYW55IHtcbiAgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IG51bGwpIHtcbiAgICBtYXRjaGVzW3ZhbHVlSW5kZXhdID0gQ0lSQ1VMQVI7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBkZWYuZmFjdG9yeSgpO1xuICAgICh0Vmlldy5kaXJlY3RpdmVzIHx8ICh0Vmlldy5kaXJlY3RpdmVzID0gW10pKS5wdXNoKGRlZik7XG4gICAgcmV0dXJuIGRpcmVjdGl2ZUNyZWF0ZShtYXRjaGVzW3ZhbHVlSW5kZXhdID0gdFZpZXcuZGlyZWN0aXZlcyAhLmxlbmd0aCAtIDEsIGluc3RhbmNlLCBkZWYpO1xuICB9IGVsc2UgaWYgKG1hdGNoZXNbdmFsdWVJbmRleF0gPT09IENJUkNVTEFSKSB7XG4gICAgLy8gSWYgd2UgcmV2aXNpdCB0aGlzIGRpcmVjdGl2ZSBiZWZvcmUgaXQncyByZXNvbHZlZCwgd2Uga25vdyBpdCdzIGNpcmN1bGFyXG4gICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IoZGVmLnR5cGUpO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhkaXJJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIChjdXJyZW50Vmlldy50Vmlldy5jb21wb25lbnRzIHx8IChjdXJyZW50Vmlldy50Vmlldy5jb21wb25lbnRzID0gW1xuICAgICBdKSkucHVzaChkaXJJbmRleCwgZGF0YS5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5mdW5jdGlvbiBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soZGlySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gIChjdXJyZW50Vmlldy50Vmlldy5ob3N0QmluZGluZ3MgfHwgKGN1cnJlbnRWaWV3LnRWaWV3Lmhvc3RCaW5kaW5ncyA9IFtcbiAgIF0pKS5wdXNoKGRpckluZGV4LCBkYXRhLmxlbmd0aCAtIDEpO1xufVxuXG4vKiogU2V0cyB0aGUgY29udGV4dCBmb3IgYSBDaGFuZ2VEZXRlY3RvclJlZiB0byB0aGUgZ2l2ZW4gaW5zdGFuY2UuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhcbiAgICBpbmplY3RvcjogTEluamVjdG9yIHwgbnVsbCwgaW5zdGFuY2U6IGFueSwgdmlldzogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKGluamVjdG9yICYmIGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmICE9IG51bGwpIHtcbiAgICAoaW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWYgYXMgVmlld1JlZjxhbnk+KS5fc2V0Q29tcG9uZW50Q29udGV4dCh2aWV3LCBpbnN0YW5jZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzQ29tcG9uZW50KHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiBpbnN0YW50aWF0ZXMgdGhlIGdpdmVuIGRpcmVjdGl2ZXMuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlRGlyZWN0aXZlc0RpcmVjdGx5KCkge1xuICBjb25zdCB0Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlICE7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IHREaXJlY3RpdmVzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZjogRGlyZWN0aXZlRGVmPGFueT4gPSB0RGlyZWN0aXZlc1tpXTtcbiAgICAgIGRpcmVjdGl2ZUNyZWF0ZShpLCBkZWYuZmFjdG9yeSgpLCBkZWYpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIGRhdGFbXSBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZSAhLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID8gcHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIGRhdGEucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB0ZW1wbGF0ZSBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhID0gY3JlYXRlVFZpZXcoZGlyZWN0aXZlcywgcGlwZXMpIGFzIG5ldmVyKTtcbn1cblxuLyoqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIGRlZnM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIHJldHVybiB7XG4gICAgZGF0YTogW10sXG4gICAgZGlyZWN0aXZlczogbnVsbCxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICBpbml0SG9va3M6IG51bGwsXG4gICAgY2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBwaXBlRGVzdHJveUhvb2tzOiBudWxsLFxuICAgIGhvc3RCaW5kaW5nczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGVmcyA9PT0gJ2Z1bmN0aW9uJyA/IGRlZnMoKSA6IGRlZnMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgY3VycmVudE1hdGNoZXM6IG51bGxcbiAgfTtcbn1cblxuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBzdHJpbmdbXSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoYXR0cnMubGVuZ3RoICUgMiwgMCwgJ2VhY2ggYXR0cmlidXRlIHNob3VsZCBoYXZlIGEga2V5IGFuZCBhIHZhbHVlJyk7XG5cbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgIT09IE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FKSB7XG4gICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jID8gKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsKSA6XG4gICAgICAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgcmVuZGVyZXJGYWN0b3J5ID0gZmFjdG9yeTtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgdGhlIGhvc3QgTE5vZGUuXG4gKlxuICogQHBhcmFtIHJOb2RlIFJlbmRlciBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICpcbiAqIEByZXR1cm5zIExFbGVtZW50Tm9kZSBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBob3N0RWxlbWVudChcbiAgICB0YWc6IHN0cmluZywgck5vZGU6IFJFbGVtZW50IHwgbnVsbCwgZGVmOiBDb21wb25lbnREZWY8YW55PixcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTEVsZW1lbnROb2RlIHtcbiAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShcbiAgICAgIDAsIExOb2RlVHlwZS5FbGVtZW50LCByTm9kZSxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIC0xLCByZW5kZXJlciwgZ2V0T3JDcmVhdGVUVmlldyhkZWYudGVtcGxhdGUsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMpLCBudWxsLCBudWxsLFxuICAgICAgICAgIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbm9kZS50Tm9kZSA9IGNyZWF0ZVROb2RlKHRhZyBhcyBzdHJpbmcsIG51bGwsIG51bGwpO1xuICAgIG5vZGUudE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgIGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgPSBbZGVmXTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIGNvbnN0IG5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgY29uc3QgbmF0aXZlID0gbm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQ7XG5cbiAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gIC8vIGV2ZW50cyAoaW5jbHVkaW5nIG91dHB1dHMpLlxuICBjb25zdCBjbGVhbnVwRm5zID0gY2xlYW51cCB8fCAoY2xlYW51cCA9IGN1cnJlbnRWaWV3LmNsZWFudXAgPSBbXSk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyhjdXJyZW50VmlldywgbGlzdGVuZXJGbik7XG4gICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKG5hdGl2ZSwgZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIpO1xuICAgIGNsZWFudXBGbnMucHVzaChjbGVhbnVwRm4sIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQoY3VycmVudFZpZXcsIGxpc3RlbmVyRm4pO1xuICAgIG5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICBjbGVhbnVwRm5zLnB1c2goZXZlbnROYW1lLCBuYXRpdmUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gIH1cblxuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSBub2RlLnROb2RlICE7XG4gIGlmICh0Tm9kZS5vdXRwdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBpZiB3ZSBjcmVhdGUgVE5vZGUgaGVyZSwgaW5wdXRzIG11c3QgYmUgdW5kZWZpbmVkIHNvIHdlIGtub3cgdGhleSBzdGlsbCBuZWVkIHRvIGJlXG4gICAgLy8gY2hlY2tlZFxuICAgIHROb2RlLm91dHB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhub2RlLnROb2RlICEuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgb3V0cHV0RGF0YTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKG91dHB1dHMgJiYgKG91dHB1dERhdGEgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY3JlYXRlT3V0cHV0KG91dHB1dERhdGEsIGxpc3RlbmVyRm4pO1xuICB9XG59XG5cbi8qKlxuICogSXRlcmF0ZXMgdGhyb3VnaCB0aGUgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBwYXJ0aWN1bGFyIGV2ZW50IG5hbWUgYW5kIHN1YnNjcmliZXMgdG9cbiAqIGVhY2ggb3V0cHV0LlxuICovXG5mdW5jdGlvbiBjcmVhdGVPdXRwdXQob3V0cHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBsaXN0ZW5lcjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBvdXRwdXRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKG91dHB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGRpcmVjdGl2ZXMgIVtvdXRwdXRzW2ldIGFzIG51bWJlcl1bb3V0cHV0c1tpICsgMV1dLnN1YnNjcmliZShsaXN0ZW5lcik7XG4gICAgY2xlYW51cCAhLnB1c2goc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlLCBzdWJzY3JpcHRpb24pO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpIHtcbiAgaWYgKGlzUGFyZW50KSB7XG4gICAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KCk7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgITtcbiAgfVxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIExOb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgcXVlcmllcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnF1ZXJpZXM7XG4gIHF1ZXJpZXMgJiYgcXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnROb2RlKTtcbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZSAhLmZsYWdzLCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50OiBMRWxlbWVudE5vZGUgPSBkYXRhW2luZGV4XTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHN0clZhbHVlID0gc2FuaXRpemVyID09IG51bGwgPyBzdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlKTtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBub2RlID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGUgITtcbiAgLy8gaWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZFxuICBpZiAodE5vZGUgJiYgdE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgdE5vZGUuaW5wdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZSAhLmZsYWdzLCBCaW5kaW5nRGlyZWN0aW9uLklucHV0KTtcbiAgfVxuXG4gIGNvbnN0IGlucHV0RGF0YSA9IHROb2RlICYmIHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKGlucHV0RGF0YSAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBtYXJrRGlydHlJZk9uUHVzaChub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBjb25zdCBuYXRpdmUgPSBub2RlLm5hdGl2ZTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShuYXRpdmUsIHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUuc2V0UHJvcGVydHkgPyBuYXRpdmUuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChuYXRpdmUgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbmRvZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHBhcmFtIGxvY2FsTmFtZXMgQSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBpbmRpY2VzXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICBmbGFnczogMCxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIGF0dHJzOiBhdHRycyxcbiAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRzOiB1bmRlZmluZWQsXG4gICAgdFZpZXdzOiB0Vmlld3NcbiAgfTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGljZXMgYW5kIG1pbmlmaWVkIGlucHV0IG5hbWVzLCBzZXRzIHRoZVxuICogaW5wdXQgcHJvcGVydGllcyBvbiB0aGUgY29ycmVzcG9uZGluZyBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbnB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGRpcmVjdGl2ZXMgIVtpbnB1dHNbaV0gYXMgbnVtYmVyXVtpbnB1dHNbaSArIDFdXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGxOb2RlRmxhZ3MgbG9naWNhbCBub2RlIGZsYWdzXG4gKiBAcGFyYW0gRGlyZWN0aW9uIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIHROb2RlRmxhZ3M6IFROb2RlRmxhZ3MsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgY291bnQgPSB0Tm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzTmFtZWQ8VD4oaW5kZXg6IG51bWJlciwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQgPSBkYXRhW2luZGV4XSBhcyBMRWxlbWVudE5vZGU7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobEVsZW1lbnQubmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgY2xhc3NOYW1lYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKiBgZWxlbWVudENsYXNzYCBpbnN0cnVjdGlvbiB3cml0ZXMgdGhlIHZhbHVlIHRvIHRoZSBcImVsZW1lbnQnc1wiIGBjbGFzc05hbWVgIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGEgc2V0IG9mIGNsYXNzZXMgd2hpY2ggc2hvdWxkIGJlIGFwcGxpZWQuIFRoZSBtZXRob2Qgb3ZlcnJpZGVzXG4gKiAgIGFueSBleGlzdGluZyBjbGFzc2VzLiBUaGUgdmFsdWUgaXMgc3RyaW5naWZpZWQgKGB0b1N0cmluZ2ApIGJlZm9yZSBpdCBpcyBhcHBsaWVkIHRvIHRoZVxuICogICBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gVE9ETzogVGhpcyBpcyBhIG5haXZlIGltcGxlbWVudGF0aW9uIHdoaWNoIHNpbXBseSB3cml0ZXMgdmFsdWUgdG8gdGhlIGBjbGFzc05hbWVgLiBJbiB0aGVcbiAgICAvLyBmdXR1cmVcbiAgICAvLyB3ZSB3aWxsIGFkZCBsb2dpYyBoZXJlIHdoaWNoIHdvdWxkIHdvcmsgd2l0aCB0aGUgYW5pbWF0aW9uIGNvZGUuXG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGRhdGFbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRDbGFzc05hbWUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShsRWxlbWVudC5uYXRpdmUsICdjbGFzc05hbWUnLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnY2xhc3NOYW1lJ10gPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgZ2l2ZW4gc3R5bGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gc3R5bGVOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKG51bGwgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gdHJhbnNmb3JtIHRoZSB2YWx1ZSB0eXBpY2FsbHkgdXNlZCBmb3JcbiAqICAgICAgICBzYW5pdGl6YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVOYW1lZDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZU5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHN1ZmZpeD86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeE9yU2FuaXRpemVyPzogc3RyaW5nIHwgU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBsRWxlbWVudDogTEVsZW1lbnROb2RlID0gZGF0YVtpbmRleF07XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnc3R5bGUnXS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RyVmFsdWUgPVxuICAgICAgICAgIHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PSAnZnVuY3Rpb24nID8gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ3N0cmluZycpIHN0clZhbHVlID0gc3RyVmFsdWUgKyBzdWZmaXhPclNhbml0aXplcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgc3RyVmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10uc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgc3R5bGVgIHByb3BlcnR5IG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHVzYWdlLlxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHN0eWxlIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICogICBUaGUgZXhwZWN0ZWQgc2hhcGUgb2YgYHZhbHVlYCBpcyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgc3R5bGUgbmFtZXMgYW5kIHRoZSB2YWx1ZXNcbiAqICAgYXJlIHRoZWlyIGNvcnJlc3BvbmRpbmcgdmFsdWVzIHRvIHNldC4gSWYgdmFsdWUgaXMgZmFsc3kgdGhhbiB0aGUgc3R5bGUgaXMgcmVtb3ZlLiBBbiBhYnNlbmNlXG4gKiAgIG9mIHN0eWxlIGRvZXMgbm90IGNhdXNlIHRoYXQgc3R5bGUgdG8gYmUgcmVtb3ZlZC4gYE5PX0NIQU5HRWAgaW1wbGllcyB0aGF0IG5vIHVwZGF0ZSBzaG91bGQgYmVcbiAqICAgcGVyZm9ybWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHZhbHVlOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgc3R5bGVgLiBJbiB0aGUgZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50ID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0eWxlID0gbEVsZW1lbnQubmF0aXZlWydzdHlsZSddO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlTmFtZTogc3RyaW5nID0ga2V5c1tpXTtcbiAgICAgICAgY29uc3Qgc3R5bGVWYWx1ZTogYW55ID0gKHZhbHVlIGFzIGFueSlbc3R5bGVOYW1lXTtcbiAgICAgICAgaWYgKHN0eWxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KHN0eWxlTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgICAgc3R5bGUuc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4LCAtMSwgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0Tm9kZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgTE5vZGVUeXBlLkVsZW1lbnQsIHRleHROb2RlKTtcbiAgLy8gVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nLlxuICBpc1BhcmVudCA9IGZhbHNlO1xuICBhcHBlbmRDaGlsZChub2RlLnBhcmVudCAhLCB0ZXh0Tm9kZSwgY3VycmVudFZpZXcpO1xufVxuXG4vKipcbiAqIENyZWF0ZSB0ZXh0IG5vZGUgd2l0aCBiaW5kaW5nXG4gKiBCaW5kaW5ncyBzaG91bGQgYmUgaGFuZGxlZCBleHRlcm5hbGx5IHdpdGggdGhlIHByb3BlciBiaW5kKDEtOCkgbWV0aG9kXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5LlxuICogQHBhcmFtIHZhbHVlIFN0cmluZ2lmaWVkIHZhbHVlIHRvIHdyaXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmc8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQgfCBOT19DSEFOR0UpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4KTtcbiAgbGV0IGV4aXN0aW5nTm9kZSA9IGRhdGFbaW5kZXhdIGFzIExUZXh0Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZXhpc3RpbmdOb2RlLCAnTE5vZGUgc2hvdWxkIGV4aXN0Jyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGV4aXN0aW5nTm9kZS5uYXRpdmUsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgdmFsdWUgIT09IE5PX0NIQU5HRSAmJlxuICAgICAgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGV4aXN0aW5nTm9kZS5uYXRpdmUsIHN0cmluZ2lmeSh2YWx1ZSkpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGlzdGluZ05vZGUubmF0aXZlLnRleHRDb250ZW50ID0gc3RyaW5naWZ5KHZhbHVlKSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgYSBkaXJlY3RpdmUuXG4gKlxuICogTk9URTogZGlyZWN0aXZlcyBjYW4gYmUgY3JlYXRlZCBpbiBvcmRlciBvdGhlciB0aGFuIHRoZSBpbmRleCBvcmRlci4gVGhleSBjYW4gYWxzb1xuICogICAgICAgYmUgcmV0cmlldmVkIGJlZm9yZSB0aGV5IGFyZSBjcmVhdGVkIGluIHdoaWNoIGNhc2UgdGhlIHZhbHVlIHdpbGwgYmUgbnVsbC5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIFRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZGlyZWN0aXZlRGVmIERpcmVjdGl2ZURlZiBvYmplY3Qgd2hpY2ggY29udGFpbnMgaW5mb3JtYXRpb24gYWJvdXQgdGhlIHRlbXBsYXRlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD58IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCBpbnN0YW5jZSA9IGJhc2VEaXJlY3RpdmVDcmVhdGUoaW5kZXgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlJyk7XG4gIGNvbnN0IHROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgY29uc3QgaXNDb21wb25lbnQgPSAoZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZjxUPikudGVtcGxhdGU7XG4gIGlmIChpc0NvbXBvbmVudCkge1xuICAgIGFkZENvbXBvbmVudExvZ2ljKGluZGV4LCBkaXJlY3RpdmUsIGRpcmVjdGl2ZURlZiBhcyBDb21wb25lbnREZWY8VD4pO1xuICB9XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICBxdWV1ZUluaXRIb29rcyhpbmRleCwgZGlyZWN0aXZlRGVmLm9uSW5pdCwgZGlyZWN0aXZlRGVmLmRvQ2hlY2ssIGN1cnJlbnRWaWV3LnRWaWV3KTtcblxuICAgIGlmIChkaXJlY3RpdmVEZWYuaG9zdEJpbmRpbmdzKSBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soaW5kZXgpO1xuICB9XG5cbiAgaWYgKHROb2RlICYmIHROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGluZGV4LCBpbnN0YW5jZSwgZGlyZWN0aXZlRGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihpbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KGRlZi50ZW1wbGF0ZSwgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcyk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IGhvc3RWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGN1cnJlbnRWaWV3LCBjcmVhdGVMVmlldyhcbiAgICAgICAgICAgICAgICAgICAgICAgLTEsIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQsIGRlZi5yZW5kZXJlclR5cGUpLFxuICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgbnVsbCwgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgICAgICAgICAgICAgICBnZXRDdXJyZW50U2FuaXRpemVyKCkpKTtcblxuICAocHJldmlvdXNPclBhcmVudE5vZGUuZGF0YSBhcyBhbnkpID0gaG9zdFZpZXc7XG4gIChob3N0Vmlldy5ub2RlIGFzIGFueSkgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcblxuICBpbml0Q2hhbmdlRGV0ZWN0b3JJZkV4aXN0aW5nKHByZXZpb3VzT3JQYXJlbnROb2RlLm5vZGVJbmplY3RvciwgaW5zdGFuY2UsIGhvc3RWaWV3KTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhpbmRleCk7XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgZGlyZWN0aXZlQ3JlYXRlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnRcbiAqXG4gKiBUaGlzIHZlcnNpb24gZG9lcyBub3QgY29udGFpbiBmZWF0dXJlcyB0aGF0IHdlIGRvbid0IGFscmVhZHkgc3VwcG9ydCBhdCByb290IGluXG4gKiBjdXJyZW50IEFuZ3VsYXIuIEV4YW1wbGU6IGxvY2FsIHJlZnMgYW5kIGlucHV0cyBvbiByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VEaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxUPnwgQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIC0xLCAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG5cbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFxuICAgICAgZGlyZWN0aXZlLCBOR19IT1NUX1NZTUJPTCwge2VudW1lcmFibGU6IGZhbHNlLCB2YWx1ZTogcHJldmlvdXNPclBhcmVudE5vZGV9KTtcblxuICBpZiAoZGlyZWN0aXZlcyA9PSBudWxsKSBjdXJyZW50Vmlldy5kaXJlY3RpdmVzID0gZGlyZWN0aXZlcyA9IFtdO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCwgZGlyZWN0aXZlcyk7XG4gIGRpcmVjdGl2ZXNbaW5kZXhdID0gZGlyZWN0aXZlO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGZsYWdzID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUgIS5mbGFncztcbiAgICBpZiAoKGZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2spID09PSAwKSB7XG4gICAgICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZDpcbiAgICAgIC8vIC0gc2F2ZSB0aGUgaW5kZXgsXG4gICAgICAvLyAtIHNldCB0aGUgbnVtYmVyIG9mIGRpcmVjdGl2ZXMgdG8gMVxuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUgIS5mbGFncyA9XG4gICAgICAgICAgaW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQgfCAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPbmx5IG5lZWQgdG8gYnVtcCB0aGUgc2l6ZSB3aGVuIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZFxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUgIS5mbGFncysrO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCBkaVB1YmxpYyA9IGRpcmVjdGl2ZURlZiAhLmRpUHVibGljO1xuICAgIGlmIChkaVB1YmxpYykgZGlQdWJsaWMoZGlyZWN0aXZlRGVmICEpO1xuICB9XG5cbiAgaWYgKGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgIT0gbnVsbCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS50eXBlID09IExOb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKFxuICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTEVsZW1lbnROb2RlKS5uYXRpdmUsIGRpcmVjdGl2ZURlZiAhLmF0dHJpYnV0ZXMgYXMgc3RyaW5nW10pO1xuICB9XG5cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBpbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbaW5pdGlhbElucHV0c1tpXV0gPSBpbml0aWFsSW5wdXRzW2kgKyAxXTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJzW2kgKyAxXSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIHBhcmVudExOb2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LCB0ZW1wbGF0ZT86IENvbXBvbmVudFRlbXBsYXRlPGFueT4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwocGFyZW50TE5vZGUsICdjb250YWluZXJzIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG4gIHJldHVybiA8TENvbnRhaW5lcj57XG4gICAgdmlld3M6IFtdLFxuICAgIG5leHRJbmRleDogMCxcbiAgICAvLyBJZiB0aGUgZGlyZWN0IHBhcmVudCBvZiB0aGUgY29udGFpbmVyIGlzIGEgdmlldywgaXRzIHZpZXdzIHdpbGwgbmVlZCB0byBiZSBhZGRlZFxuICAgIC8vIHRocm91Z2ggaW5zZXJ0VmlldygpIHdoZW4gaXRzIHBhcmVudCB2aWV3IGlzIGJlaW5nIGluc2VydGVkOlxuICAgIHJlbmRlclBhcmVudDogY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnRMTm9kZSwgY3VycmVudFZpZXcpID8gcGFyZW50TE5vZGUgOiBudWxsLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSA9PSBudWxsID8gbnVsbCA6IHRlbXBsYXRlLFxuICAgIG5leHQ6IG51bGwsXG4gICAgcGFyZW50OiBjdXJyZW50VmlldyxcbiAgICBkeW5hbWljVmlld0NvdW50OiAwLFxuICAgIHF1ZXJpZXM6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlLlxuICpcbiAqIE9ubHkgYExWaWV3Tm9kZXNgIGNhbiBnbyBpbnRvIGBMQ29udGFpbmVyTm9kZXNgLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlIE9wdGlvbmFsIGlubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJzIGF0dGFjaGVkIHRvIHRoZSBjb250YWluZXIsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgdGFnTmFtZT86IHN0cmluZyB8IG51bGwsIGF0dHJzPzogc3RyaW5nW10sXG4gICAgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoY3VycmVudFBhcmVudCwgY3VycmVudFZpZXcsIHRlbXBsYXRlKTtcblxuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoaW5kZXgsIExOb2RlVHlwZS5Db250YWluZXIsIHVuZGVmaW5lZCwgbENvbnRhaW5lcik7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUoY3VycmVudFZpZXcsIG5vZGUuZGF0YSk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoaW5kZXgsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMsIGxvY2FsUmVmcywgdGVtcGxhdGUgPT0gbnVsbCk7XG5cbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBMTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgcXVlcmllcyA9IG5vZGUucXVlcmllcztcbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICAvLyBjaGVjayBpZiBhIGdpdmVuIGNvbnRhaW5lciBub2RlIG1hdGNoZXNcbiAgICBxdWVyaWVzLmFkZE5vZGUobm9kZSk7XG4gICAgLy8gcHJlcGFyZSBwbGFjZSBmb3IgbWF0Y2hpbmcgbm9kZXMgZnJvbSB2aWV3cyBpbnNlcnRlZCBpbnRvIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgbENvbnRhaW5lci5xdWVyaWVzID0gcXVlcmllcy5jb250YWluZXIoKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgYSBjb250YWluZXIgdXAgdG8gcmVjZWl2ZSB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hTdGFydChpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCk7XG4gIHByZXZpb3VzT3JQYXJlbnROb2RlID0gZGF0YVtpbmRleF0gYXMgTE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlKS5kYXRhLm5leHRJbmRleCA9IDA7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTYW1lKFxuICAgICAgICAgICAgICAgICAgIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZSkubmF0aXZlLCB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgYHRoZSBjb250YWluZXIncyBuYXRpdmUgZWxlbWVudCBzaG91bGQgbm90IGhhdmUgYmVlbiBzZXQgeWV0LmApO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAgIC8vIGJlZm9yZSB0aGV5IGFyZSBjYWxsZWQgaW4gZW1iZWRkZWQgdmlld3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkuXG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgY3VycmVudFZpZXcudFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyTm9kZS5cbiAqXG4gKiBNYXJraW5nIHRoZSBlbmQgb2YgTENvbnRhaW5lck5vZGUgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCBWaWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGlmIChpc1BhcmVudCkge1xuICAgIGlzUGFyZW50ID0gZmFsc2U7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBMTm9kZVR5cGUuVmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUucGFyZW50ICE7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBMTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyID0gcHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gIGNvbnRhaW5lci5uYXRpdmUgPSB1bmRlZmluZWQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIExOb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBuZXh0SW5kZXggPSBjb250YWluZXIuZGF0YS5uZXh0SW5kZXg7XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgY29udGFpbmVyLmRhdGEudmlld3MubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhjb250YWluZXIsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNDaGlsZHJlbigpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGN1cnJlbnRWaWV3LmNoaWxkOyBjdXJyZW50ICE9PSBudWxsOyBjdXJyZW50ID0gY3VycmVudC5uZXh0KSB7XG4gICAgaWYgKGN1cnJlbnQuZHluYW1pY1ZpZXdDb3VudCAhPT0gMCAmJiAoY3VycmVudCBhcyBMQ29udGFpbmVyKS52aWV3cykge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gY3VycmVudCBhcyBMQ29udGFpbmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250YWluZXIudmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgbFZpZXdOb2RlID0gY29udGFpbmVyLnZpZXdzW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBjb25zdCBkeW5hbWljVmlldyA9IGxWaWV3Tm9kZS5kYXRhO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChkeW5hbWljVmlldy50VmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBsVmlld05vZGUsIGR5bmFtaWNWaWV3LnRWaWV3LCBkeW5hbWljVmlldy50ZW1wbGF0ZSAhLCBkeW5hbWljVmlldy5jb250ZXh0ICEsIHJlbmRlcmVyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb29rcyBmb3IgYSB2aWV3IHdpdGggYSBnaXZlbiB2aWV3IGJsb2NrIGlkIGluc2lkZSBhIHByb3ZpZGVkIExDb250YWluZXIuXG4gKiBSZW1vdmVzIHZpZXdzIHRoYXQgbmVlZCB0byBiZSBkZWxldGVkIGluIHRoZSBwcm9jZXNzLlxuICpcbiAqIEBwYXJhbSBjb250YWluZXJOb2RlIHdoZXJlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGNvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLCB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdOb2RlfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGNvbnRhaW5lck5vZGUuZGF0YS52aWV3cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2aWV3QXRQb3NpdGlvbklkID0gdmlld3NbaV0uZGF0YS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGNvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2ggaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIGNvbnN0IGNvbnRhaW5lciA9XG4gICAgICAoaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50Tm9kZSA6IHByZXZpb3VzT3JQYXJlbnROb2RlLnBhcmVudCAhKSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lciwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGxDb250YWluZXIgPSBjb250YWluZXIuZGF0YTtcbiAgbGV0IHZpZXdOb2RlOiBMVmlld05vZGV8bnVsbCA9IHNjYW5Gb3JWaWV3KGNvbnRhaW5lciwgbENvbnRhaW5lci5uZXh0SW5kZXgsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld05vZGUpIHtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IHZpZXdOb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgTE5vZGVUeXBlLlZpZXcpO1xuICAgIGlzUGFyZW50ID0gdHJ1ZTtcbiAgICBlbnRlclZpZXcodmlld05vZGUuZGF0YSwgdmlld05vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdoZW4gd2UgY3JlYXRlIGEgbmV3IExWaWV3LCB3ZSBhbHdheXMgcmVzZXQgdGhlIHN0YXRlIG9mIHRoZSBpbnN0cnVjdGlvbnMuXG4gICAgY29uc3QgbmV3VmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICB2aWV3QmxvY2tJZCwgcmVuZGVyZXIsIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29udGFpbmVyKSwgbnVsbCwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcbiAgICBpZiAobENvbnRhaW5lci5xdWVyaWVzKSB7XG4gICAgICBuZXdWaWV3LnF1ZXJpZXMgPSBsQ29udGFpbmVyLnF1ZXJpZXMuZW50ZXJWaWV3KGxDb250YWluZXIubmV4dEluZGV4KTtcbiAgICB9XG5cbiAgICBlbnRlclZpZXcobmV3Vmlldywgdmlld05vZGUgPSBjcmVhdGVMTm9kZShudWxsLCBMTm9kZVR5cGUuVmlldywgbnVsbCwgbmV3VmlldykpO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjdXJyZW50Vmlldy50VmlldztcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnkpO1xuICB9XG4gIHJldHVybiBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XTtcbn1cblxuLyoqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdFbmQoKTogdm9pZCB7XG4gIHJlZnJlc2hWaWV3KCk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGNvbnN0IHZpZXdOb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUgPSBjdXJyZW50Vmlldy5ub2RlIGFzIExWaWV3Tm9kZTtcbiAgY29uc3QgY29udGFpbmVyTm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnBhcmVudCBhcyBMQ29udGFpbmVyTm9kZTtcbiAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld05vZGUsIExOb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyTm9kZSwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lck5vZGUuZGF0YTtcblxuICAgIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICAgIC8vIFdoZW4gcHJvamVjdGVkIG5vZGVzIGFyZSBnb2luZyB0byBiZSBpbnNlcnRlZCwgdGhlIHJlbmRlclBhcmVudCBvZiB0aGUgZHluYW1pYyBjb250YWluZXJcbiAgICAgIC8vIHVzZWQgYnkgdGhlIFZpZXdDb250YWluZXJSZWYgbXVzdCBiZSBzZXQuXG4gICAgICBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKGxDb250YWluZXIucmVuZGVyUGFyZW50LCB2aWV3Tm9kZSk7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyhjb250YWluZXJOb2RlLCB2aWV3Tm9kZSwgbENvbnRhaW5lci5uZXh0SW5kZXgpO1xuICAgIH1cblxuICAgIGxDb250YWluZXIubmV4dEluZGV4Kys7XG4gIH1cbiAgbGVhdmVWaWV3KGN1cnJlbnRWaWV3ICEucGFyZW50ICEpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIGZhbHNlLCAnaXNQYXJlbnQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBMTm9kZVR5cGUuVmlldyk7XG59XG5cbi8qKlxuICogRm9yIG5vZGVzIHdoaWNoIGFyZSBwcm9qZWN0ZWQgaW5zaWRlIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgcmVuZGVyUGFyZW50XG4gKiBvZiB0aGVpciBkeW5hbWljIExDb250YWluZXJOb2RlLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBMQ29udGFpbmVyIHdoaWNoIGNvbnRhaW5zIHRoZSBlbWJlZGRlZCB2aWV3LlxuICogQHBhcmFtIHZpZXdOb2RlIHRoZSBlbWJlZGRlZCB2aWV3LlxuICovXG5mdW5jdGlvbiBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKFxuICAgIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlIHwgbnVsbCwgdmlld05vZGU6IExWaWV3Tm9kZSk6IHZvaWQge1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBsZXQgbm9kZSA9IHZpZXdOb2RlLmNoaWxkO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBpZiAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgICBjb25zdCBsYXN0Tm9kZVRvUHJvamVjdCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS50YWlsO1xuICAgICAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgICAgIGlmIChub2RlVG9Qcm9qZWN0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgICAgbm9kZVRvUHJvamVjdC5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSByZW5kZXJQYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUgPSBub2RlLm5leHQ7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4XG4gKiBAcGFyYW0gZWxlbWVudEluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShlbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZGF0YSAhW2VsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgTE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgYXR0YWNoZWQuYCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZWxlbWVudC5kYXRhICE7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlldy5mbGFncyAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoZGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3QgZGVmID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG5cbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoXG4gICAgICAgIGhvc3RWaWV3LCBlbGVtZW50LCBkZWYsIGdldERpcmVjdGl2ZUluc3RhbmNlKGRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJbmRleF0pKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoXG4gICAgaW5kZXg6IG51bWJlciwgc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBuZXcgQXJyYXk8TE5vZGVbXT4obm9PZk5vZGVCdWNrZXRzKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mTm9kZUJ1Y2tldHM7IGkrKykge1xuICAgIGRpc3RyaWJ1dGVkTm9kZXNbaV0gPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50SG9zdChjdXJyZW50Vmlldyk7XG4gIGxldCBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudE5vZGUuY2hpbGQ7XG5cbiAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgLy8gZXhlY3V0ZSBzZWxlY3RvciBtYXRjaGluZyBsb2dpYyBpZiBhbmQgb25seSBpZjpcbiAgICAvLyAtIHRoZXJlIGFyZSBzZWxlY3RvcnMgZGVmaW5lZFxuICAgIC8vIC0gYSBub2RlIGhhcyBhIHRhZyBuYW1lIC8gYXR0cmlidXRlcyB0aGF0IGNhbiBiZSBtYXRjaGVkXG4gICAgaWYgKHNlbGVjdG9ycyAmJiBjb21wb25lbnRDaGlsZC50Tm9kZSkge1xuICAgICAgY29uc3QgbWF0Y2hlZElkeCA9IG1hdGNoaW5nU2VsZWN0b3JJbmRleChjb21wb25lbnRDaGlsZC50Tm9kZSwgc2VsZWN0b3JzLCB0ZXh0U2VsZWN0b3JzICEpO1xuICAgICAgZGlzdHJpYnV0ZWROb2Rlc1ttYXRjaGVkSWR4XS5wdXNoKGNvbXBvbmVudENoaWxkKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZGlzdHJpYnV0ZWROb2Rlc1swXS5wdXNoKGNvbXBvbmVudENoaWxkKTtcbiAgICB9XG5cbiAgICBjb21wb25lbnRDaGlsZCA9IGNvbXBvbmVudENoaWxkLm5leHQ7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgpO1xuICBkYXRhW2luZGV4XSA9IGRpc3RyaWJ1dGVkTm9kZXM7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgbGlua2VkIGxpc3Qgb2YgYSBwcm9qZWN0aW9uIG5vZGUsIGJ5IGFwcGVuZGluZyBhbm90aGVyIGxpbmtlZCBsaXN0LlxuICpcbiAqIEBwYXJhbSBwcm9qZWN0aW9uTm9kZSBQcm9qZWN0aW9uIG5vZGUgd2hvc2UgcHJvamVjdGVkIG5vZGVzIGxpbmtlZCBsaXN0IGhhcyB0byBiZSB1cGRhdGVkXG4gKiBAcGFyYW0gYXBwZW5kZWRGaXJzdCBGaXJzdCBub2RlIG9mIHRoZSBsaW5rZWQgbGlzdCB0byBhcHBlbmQuXG4gKiBAcGFyYW0gYXBwZW5kZWRMYXN0IExhc3Qgbm9kZSBvZiB0aGUgbGlua2VkIGxpc3QgdG8gYXBwZW5kLlxuICovXG5mdW5jdGlvbiBhcHBlbmRUb1Byb2plY3Rpb25Ob2RlKFxuICAgIHByb2plY3Rpb25Ob2RlOiBMUHJvamVjdGlvbk5vZGUsXG4gICAgYXBwZW5kZWRGaXJzdDogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUgfCBudWxsLFxuICAgIGFwcGVuZGVkTGFzdDogTEVsZW1lbnROb2RlIHwgTFRleHROb2RlIHwgTENvbnRhaW5lck5vZGUgfCBudWxsKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAhIWFwcGVuZGVkRmlyc3QsICEhYXBwZW5kZWRMYXN0LFxuICAgICAgICAgICAgICAgICAgICdhcHBlbmRlZEZpcnN0IGNhbiBiZSBudWxsIGlmIGFuZCBvbmx5IGlmIGFwcGVuZGVkTGFzdCBpcyBhbHNvIG51bGwnKTtcbiAgaWYgKCFhcHBlbmRlZExhc3QpIHtcbiAgICAvLyBub3RoaW5nIHRvIGFwcGVuZFxuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBwcm9qZWN0aW9uTm9kZURhdGEgPSBwcm9qZWN0aW9uTm9kZS5kYXRhO1xuICBpZiAocHJvamVjdGlvbk5vZGVEYXRhLnRhaWwpIHtcbiAgICBwcm9qZWN0aW9uTm9kZURhdGEudGFpbC5wTmV4dE9yUGFyZW50ID0gYXBwZW5kZWRGaXJzdDtcbiAgfSBlbHNlIHtcbiAgICBwcm9qZWN0aW9uTm9kZURhdGEuaGVhZCA9IGFwcGVuZGVkRmlyc3Q7XG4gIH1cbiAgcHJvamVjdGlvbk5vZGVEYXRhLnRhaWwgPSBhcHBlbmRlZExhc3Q7XG4gIGFwcGVuZGVkTGFzdC5wTmV4dE9yUGFyZW50ID0gcHJvamVjdGlvbk5vZGU7XG59XG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIGxvY2FsSW5kZXggLSBpbmRleCB1bmRlciB3aGljaCBkaXN0cmlidXRpb24gb2YgcHJvamVjdGVkIG5vZGVzIHdhcyBtZW1vcml6ZWRcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKFxuICAgIG5vZGVJbmRleDogbnVtYmVyLCBsb2NhbEluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3Qgbm9kZSA9IGNyZWF0ZUxOb2RlKG5vZGVJbmRleCwgTE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIHtoZWFkOiBudWxsLCB0YWlsOiBudWxsfSk7XG5cbiAgaWYgKG5vZGUudE5vZGUgPT0gbnVsbCkge1xuICAgIG5vZGUudE5vZGUgPSBjcmVhdGVUTm9kZShudWxsLCBhdHRycyB8fCBudWxsLCBudWxsKTtcbiAgfVxuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGNvbnN0IGN1cnJlbnRQYXJlbnQgPSBub2RlLnBhcmVudDtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgbWVtb3JpemVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3QoY3VycmVudFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGNvbXBvbmVudE5vZGUuZGF0YSAhO1xuICBjb25zdCBub2Rlc0ZvclNlbGVjdG9yID0gY29tcG9uZW50TFZpZXcuZGF0YSAhW2xvY2FsSW5kZXhdW3NlbGVjdG9ySW5kZXhdO1xuXG4gIC8vIGJ1aWxkIHRoZSBsaW5rZWQgbGlzdCBvZiBwcm9qZWN0ZWQgbm9kZXM6XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXNGb3JTZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVUb1Byb2plY3QgPSBub2Rlc0ZvclNlbGVjdG9yW2ldO1xuICAgIGlmIChub2RlVG9Qcm9qZWN0LnR5cGUgPT09IExOb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBSZXByb2plY3RpbmcgYSBwcm9qZWN0aW9uIC0+IGFwcGVuZCB0aGUgbGlzdCBvZiBwcmV2aW91c2x5IHByb2plY3RlZCBub2Rlc1xuICAgICAgY29uc3QgcHJldmlvdXNseVByb2plY3RlZCA9IChub2RlVG9Qcm9qZWN0IGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YTtcbiAgICAgIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUobm9kZSwgcHJldmlvdXNseVByb2plY3RlZC5oZWFkLCBwcmV2aW91c2x5UHJvamVjdGVkLnRhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQcm9qZWN0aW5nIGEgc2luZ2xlIG5vZGVcbiAgICAgIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgICAgICAgbm9kZSwgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSxcbiAgICAgICAgICBub2RlVG9Qcm9qZWN0IGFzIExUZXh0Tm9kZSB8IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY3VycmVudFBhcmVudCwgTE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIC8vIHByb2Nlc3MgZWFjaCBub2RlIGluIHRoZSBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IG5vZGUuZGF0YS5oZWFkO1xuICAgIGNvbnN0IGxhc3ROb2RlVG9Qcm9qZWN0ID0gbm9kZS5kYXRhLnRhaWw7XG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCBhcyBMRWxlbWVudE5vZGUsXG4gICAgICAgICAgY3VycmVudFZpZXcpO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QgPT09IGxhc3ROb2RlVG9Qcm9qZWN0ID8gbnVsbCA6IG5vZGVUb1Byb2plY3QucE5leHRPclBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnRIb3N0KGxWaWV3OiBMVmlldyk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCB2aWV3Um9vdExOb2RlID0gbFZpZXcubm9kZTtcbiAgd2hpbGUgKHZpZXdSb290TE5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChsVmlldy5wYXJlbnQsICdsVmlldy5wYXJlbnQnKTtcbiAgICBsVmlldyA9IGxWaWV3LnBhcmVudCAhO1xuICAgIHZpZXdSb290TE5vZGUgPSBsVmlldy5ub2RlO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdSb290TE5vZGUsIExOb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwodmlld1Jvb3RMTm9kZS5kYXRhLCAnbm9kZS5kYXRhJyk7XG5cbiAgcmV0dXJuIHZpZXdSb290TE5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYSBMVmlldyBvciBhIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGN1cnJlbnRWaWV3OiBMVmlldywgc3RhdGU6IFQpOiBUIHtcbiAgY3VycmVudFZpZXcudGFpbCA/IChjdXJyZW50Vmlldy50YWlsLm5leHQgPSBzdGF0ZSkgOiAoY3VycmVudFZpZXcuY2hpbGQgPSBzdGF0ZSk7XG4gIGN1cnJlbnRWaWV3LnRhaWwgPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGU6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAvLyBCZWNhdXNlIGRhdGEgZmxvd3MgZG93biB0aGUgY29tcG9uZW50IHRyZWUsIGFuY2VzdG9ycyBkbyBub3QgbmVlZCB0byBiZSBtYXJrZWQgZGlydHlcbiAgaWYgKG5vZGUuZGF0YSAmJiAhKG5vZGUuZGF0YS5mbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhLmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gTmVjZXNzYXJ5IHRvIHN1cHBvcnQgT25QdXNoIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyh2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IChlOiBFdmVudCkgPT5cbiAgICBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gQWxzbyB3cmFwcyB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChcbiAgICB2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya1ZpZXdEaXJ0eShlOiBFdmVudCkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3fG51bGwgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50Vmlldy5wYXJlbnQgIT0gbnVsbCkge1xuICAgIGN1cnJlbnRWaWV3LmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlldy5wYXJlbnQ7XG4gIH1cbiAgY3VycmVudFZpZXcuZmxhZ3MgfD0gTFZpZXdGbGFncy5EaXJ0eTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjdXJyZW50VmlldyAhLmNvbnRleHQsICdyb290Q29udGV4dCcpO1xuICBzY2hlZHVsZVRpY2soY3VycmVudFZpZXcgIS5jb250ZXh0IGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgdGljayhyb290Q29udGV4dC5jb21wb25lbnQpO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbXBvbmVudCA9IChyb290Vmlldy5jb250ZXh0IGFzIFJvb3RDb250ZXh0KS5jb21wb25lbnQ7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUocm9vdENvbXBvbmVudCk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdE5vZGUsIHJvb3RWaWV3LCByb290Q29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50OiBhbnkpOiBMVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBsZXQgbFZpZXcgPSBsRWxlbWVudE5vZGUudmlldztcbiAgd2hpbGUgKGxWaWV3LnBhcmVudCkge1xuICAgIGxWaWV3ID0gbFZpZXcucGFyZW50O1xuICB9XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdE5vZGUudE5vZGUgIS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgY29uc3QgZGVmID0gaG9zdE5vZGUudmlldy50Vmlldy5kaXJlY3RpdmVzICFbY29tcG9uZW50SW5kZXhdIGFzIENvbXBvbmVudERlZjxUPjtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKGhvc3ROb2RlLmRhdGEgYXMgTFZpZXcsIGhvc3ROb2RlLCBkZWYsIGNvbXBvbmVudCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY2hlY2tOb0NoYW5nZXNNb2RlID0gdHJ1ZTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlldywgaG9zdE5vZGU6IExFbGVtZW50Tm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4sIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Tm9kZSk7XG4gIGNvbnN0IHRlbXBsYXRlID0gZGVmLnRlbXBsYXRlO1xuXG4gIHRyeSB7XG4gICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnQpO1xuICAgIHJlZnJlc2hWaWV3KCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cblxuLyoqXG4gKiBNYXJrIHRoZSBjb21wb25lbnQgYXMgZGlydHkgKG5lZWRpbmcgY2hhbmdlIGRldGVjdGlvbikuXG4gKlxuICogTWFya2luZyBhIGNvbXBvbmVudCBkaXJ0eSB3aWxsIHNjaGVkdWxlIGEgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGlzXG4gKiBjb21wb25lbnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLiBNYXJraW5nIGFuIGFscmVhZHkgZGlydHlcbiAqIGNvbXBvbmVudCBhcyBkaXJ0eSBpcyBhIG5vb3AuIE9ubHkgb25lIG91dHN0YW5kaW5nIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGNhbiBiZSBzY2hlZHVsZWQgcGVyIGNvbXBvbmVudCB0cmVlLiAoVHdvIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIHdpdGhcbiAqIHNlcGFyYXRlIGByZW5kZXJDb21wb25lbnRgIHdpbGwgaGF2ZSBzZXBhcmF0ZSBzY2hlZHVsZXJzKVxuICpcbiAqIFdoZW4gdGhlIHJvb3QgY29tcG9uZW50IGlzIGJvb3RzdHJhcHBlZCB3aXRoIGByZW5kZXJDb21wb25lbnRgLCBhIHNjaGVkdWxlclxuICogY2FuIGJlIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIG1hcmsgYXMgZGlydHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBtYXJrVmlld0RpcnR5KGxFbGVtZW50Tm9kZS52aWV3KTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBpbnRlcmZhY2UgTk9fQ0hBTkdFIHtcbiAgLy8gVGhpcyBpcyBhIGJyYW5kIHRoYXQgZW5zdXJlcyB0aGF0IHRoaXMgdHlwZSBjYW4gbmV2ZXIgbWF0Y2ggYW55dGhpbmcgZWxzZVxuICBicmFuZDogJ05PX0NIQU5HRSc7XG59XG5cbi8qKiBBIHNwZWNpYWwgdmFsdWUgd2hpY2ggZGVzaWduYXRlcyB0aGF0IGEgdmFsdWUgaGFzIG5vdCBjaGFuZ2VkLiAqL1xuZXhwb3J0IGNvbnN0IE5PX0NIQU5HRSA9IHt9IGFzIE5PX0NIQU5HRTtcblxuLyoqXG4gKiAgSW5pdGlhbGl6ZXMgdGhlIGJpbmRpbmcgc3RhcnQgaW5kZXguIFdpbGwgZ2V0IGlubGluZWQuXG4gKlxuICogIFRoaXMgZnVuY3Rpb24gbXVzdCBiZSBjYWxsZWQgYmVmb3JlIGFueSBiaW5kaW5nIHJlbGF0ZWQgZnVuY3Rpb24gaXMgY2FsbGVkXG4gKiAgKGllIGBiaW5kKClgLCBgaW50ZXJwb2xhdGlvblgoKWAsIGBwdXJlRnVuY3Rpb25YKClgKVxuICovXG5mdW5jdGlvbiBpbml0QmluZGluZ3MoKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ0JpbmRpbmcgc3RhcnQgaW5kZXggc2hvdWxkIG9ubHkgYmUgc2V0IG9uY2UsIHdoZW4gbnVsbCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ0luZGV4LCAtMSxcbiAgICAgICAgICAgICAgICAgICAnQmluZGluZyBpbmRleCBzaG91bGQgbm90IHlldCBiZSBzZXQgJyArIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCk7XG4gIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCA9IGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4ID0gZGF0YS5sZW5ndGg7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogVHxOT19DSEFOR0Uge1xuICBpZiAoY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXggPCAwKSB7XG4gICAgaW5pdEJpbmRpbmdzKCk7XG4gICAgcmV0dXJuIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4KytdID0gdmFsdWU7XG4gIH1cblxuICBjb25zdCBjaGFuZ2VkOiBib29sZWFuID1cbiAgICAgIHZhbHVlICE9PSBOT19DSEFOR0UgJiYgaXNEaWZmZXJlbnQoZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXhdLCB2YWx1ZSk7XG4gIGlmIChjaGFuZ2VkKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShcbiAgICAgICAgY3JlYXRpb25Nb2RlLCBjaGVja05vQ2hhbmdlc01vZGUsIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSA9IHZhbHVlO1xuICB9XG4gIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrO1xuICByZXR1cm4gY2hhbmdlZCA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZSBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgZXhwcmVzc2lvbnMuXG4gKlxuICogSWYgdGhlcmUgYXJlIDEgdG8gOCBleHByZXNzaW9ucyBgaW50ZXJwb2xhdGlvbjEoKWAgdG8gYGludGVycG9sYXRpb244KClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gKiBUaG9zZSBhcmUgZmFzdGVyIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVlZCB0byBjcmVhdGUgYW4gYXJyYXkgb2YgZXhwcmVzc2lvbnMgYW5kIGl0ZXJhdGUgb3ZlciBpdC5cbiAqXG4gKiBgdmFsdWVzYDpcbiAqIC0gaGFzIHN0YXRpYyB0ZXh0IGF0IGV2ZW4gaW5kZXhlcyxcbiAqIC0gaGFzIGV2YWx1YXRlZCBleHByZXNzaW9ucyBhdCBvZGQgaW5kZXhlcy5cbiAqXG4gKiBSZXR1cm5zIHRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvblYodmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG5cbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZCh2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSBzdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYwKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHYwLCB2MSk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHYyKSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgICAgICAgICAgICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgK1xuICAgICAgICAgIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDUgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjUoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY0KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKHY2KSB8fCBkaWZmZXJlbnQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgaTYgKyBzdHJpbmdpZnkodjcpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGlmIChpbmRleCA+PSB0RGF0YS5sZW5ndGgpIHtcbiAgICB0RGF0YVtpbmRleF0gPSBudWxsO1xuICB9XG4gIGRhdGFbaW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCk7XG4gIHJldHVybiBkYXRhW2luZGV4XTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gdGhlIGBkaXJlY3RpdmVzYCBhcnJheS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkRGlyZWN0aXZlPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZGlyZWN0aXZlcywgJ0RpcmVjdGl2ZXMgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIGRpci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4LCBkaXJlY3RpdmVzICEpO1xuICByZXR1cm4gZGlyZWN0aXZlcyAhW2luZGV4XTtcbn1cblxuLyoqIEdldHMgdGhlIGN1cnJlbnQgYmluZGluZyB2YWx1ZSBhbmQgaW5jcmVtZW50cyB0aGUgYmluZGluZyBpbmRleC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb25zdW1lQmluZGluZygpOiBhbnkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoY3VycmVudFZpZXcuYmluZGluZ0luZGV4KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIE5PX0NIQU5HRSwgJ1N0b3JlZCB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICByZXR1cm4gZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrK107XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQodmFsdWU6IGFueSk6IGJvb2xlYW4ge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwodmFsdWUsIE5PX0NIQU5HRSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG5cbiAgaWYgKGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IDwgMCkge1xuICAgIGluaXRCaW5kaW5ncygpO1xuICB9IGVsc2UgaWYgKGlzRGlmZmVyZW50KGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSwgdmFsdWUpKSB7XG4gICAgdGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZShcbiAgICAgICAgY3JlYXRpb25Nb2RlLCBjaGVja05vQ2hhbmdlc01vZGUsIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrO1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4KytdID0gdmFsdWU7XG4gIHJldHVybiB0cnVlO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB0aGUgbGF0ZXN0IHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlQmluZGluZyh2YWx1ZTogYW55KTogYW55IHtcbiAgYmluZGluZ1VwZGF0ZWQodmFsdWUpO1xuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihleHAxOiBhbnksIGV4cDI6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgNCBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQ0KGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoZXhwMSwgZXhwMik7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZDIoZXhwMywgZXhwNCkgfHwgZGlmZmVyZW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VFZpZXcoKTogVFZpZXcge1xuICByZXR1cm4gY3VycmVudFZpZXcudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXREaXJlY3RpdmVJbnN0YW5jZTxUPihpbnN0YW5jZU9yQXJyYXk6IFQgfCBbVF0pOiBUIHtcbiAgLy8gRGlyZWN0aXZlcyB3aXRoIGNvbnRlbnQgcXVlcmllcyBzdG9yZSBhbiBhcnJheSBpbiBkaXJlY3RpdmVzW2RpcmVjdGl2ZUluZGV4XVxuICAvLyB3aXRoIHRoZSBpbnN0YW5jZSBhcyB0aGUgZmlyc3QgaW5kZXhcbiAgcmV0dXJuIEFycmF5LmlzQXJyYXkoaW5zdGFuY2VPckFycmF5KSA/IGluc3RhbmNlT3JBcnJheVswXSA6IGluc3RhbmNlT3JBcnJheTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKSB7XG4gIGFzc2VydEVxdWFsKGlzUGFyZW50LCB0cnVlLCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGJlIGEgcGFyZW50Jyk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhhc1BhcmVudCgpIHtcbiAgYXNzZXJ0Tm90TnVsbChwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQsICdwcmV2aW91c09yUGFyZW50Tm9kZSBzaG91bGQgaGF2ZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhSW5SYW5nZShpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IGRhdGE7XG4gIGFzc2VydExlc3NUaGFuKGluZGV4LCBhcnIgPyBhcnIubGVuZ3RoIDogMCwgJ2luZGV4IGV4cGVjdGVkIHRvIGJlIGEgdmFsaWQgZGF0YSBpbmRleCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnREYXRhTmV4dChpbmRleDogbnVtYmVyLCBhcnI/OiBhbnlbXSkge1xuICBpZiAoYXJyID09IG51bGwpIGFyciA9IGRhdGE7XG4gIGFzc2VydEVxdWFsKFxuICAgICAgYXJyLmxlbmd0aCwgaW5kZXgsIGBpbmRleCAke2luZGV4fSBleHBlY3RlZCB0byBiZSBhdCB0aGUgZW5kIG9mIGFyciAobGVuZ3RoICR7YXJyLmxlbmd0aH0pYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZTxUPihjb21wb25lbnQ6IFQpOiBMRWxlbWVudE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjb21wb25lbnQsICdleHBlY3RpbmcgY29tcG9uZW50IGdvdCBudWxsJyk7XG4gIGNvbnN0IGxFbGVtZW50Tm9kZSA9IChjb21wb25lbnQgYXMgYW55KVtOR19IT1NUX1NZTUJPTF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjb21wb25lbnQsICdvYmplY3QgaXMgbm90IGEgY29tcG9uZW50Jyk7XG4gIHJldHVybiBsRWxlbWVudE5vZGU7XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5leHBvcnQgY29uc3QgUk9PVF9ESVJFQ1RJVkVfSU5ESUNFUyA9IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTO1xuIl19