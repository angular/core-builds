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
import { assertEqual, assertLessThan, assertNotEqual, assertNotNull, assertNull, assertSame } from './assert';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { assertNodeType } from './node_assert';
import { appendChild, insertView, appendProjectedNode, removeView, canInsertNativeNode, createTextNode, getNextLNode, getChildLNode } from './node_manipulation';
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
 */
export const /** @type {?} */ _ROOT_DIRECTIVE_INDICES = [0, 0];
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
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return renderer;
}
/**
 * @return {?}
 */
export function getCurrentSanitizer() {
    return currentView && currentView.sanitizer;
}
/**
 * Used to set the parent property when nodes are created.
 */
let /** @type {?} */ previousOrParentNode;
/**
 * @return {?}
 */
export function getPreviousOrParentNode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return previousOrParentNode;
}
/**
 * If `isParent` is:
 *  - `true`: then `previousOrParentNode` points to a parent node.
 *  - `false`: then `previousOrParentNode` points to previous node (sibling).
 */
let /** @type {?} */ isParent;
/**
 * Static data that corresponds to the instance-specific data array on an LView.
 *
 * Each node's static data is stored in tData at the same index that it's stored
 * in the data array. Any nodes that do not have static data store a null value in
 * tData to avoid a sparse array.
 */
let /** @type {?} */ tData;
/**
 * State of the current view being processed.
 *
 * NOTE: we cheat here and initialize it to `null` even thought the type does not
 * contain `null`. This is because we expect this value to be not `null` as soon
 * as we enter the view. Declaring the type as `null` would require us to place `!`
 * in most instructions since they all assume that `currentView` is defined.
 */
let /** @type {?} */ currentView = /** @type {?} */ ((null));
let /** @type {?} */ currentQueries;
/**
 * @param {?} QueryType
 * @return {?}
 */
export function getCurrentQueries(QueryType) {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return currentQueries || (currentQueries = new QueryType());
}
/**
 * This property gets set before entering a template.
 */
let /** @type {?} */ creationMode;
/**
 * @return {?}
 */
export function getCreationMode() {
    // top level variables should not be exported for performance reason (PERF_NOTES.md)
    return creationMode;
}
/**
 * An array of nodes (text, element, container, etc), pipes, their bindings, and
 * any local variables that need to be stored between invocations.
 */
let /** @type {?} */ data;
/**
 * An array of directive instances in the current view.
 *
 * These must be stored separately from LNodes because their presence is
 * unknown at compile-time and thus space cannot be reserved in data[].
 */
let /** @type {?} */ directives;
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
let /** @type {?} */ cleanup;
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
    const /** @type {?} */ oldView = currentView;
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
 * @param {?} newView New state to become active
 * @param {?=} creationOnly An optional boolean to indicate that the view was processed in creation mode
 * only, i.e. the first update will be done later. Only possible for dynamically created views.
 * @return {?}
 */
export function leaveView(newView, creationOnly) {
    if (!creationOnly) {
        if (!checkNoChangesMode) {
            executeHooks(/** @type {?} */ ((directives)), currentView.tView.viewHooks, currentView.tView.viewCheckHooks, creationMode);
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
 *
 * @return {?}
 */
function refreshView() {
    const /** @type {?} */ tView = currentView.tView;
    if (!checkNoChangesMode) {
        executeInitHooks(currentView, tView, creationMode);
    }
    refreshDynamicChildren();
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
        const /** @type {?} */ defs = /** @type {?} */ ((currentView.tView.directives));
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
        const /** @type {?} */ tView = currentView.tView;
        executeInitHooks(currentView, tView, creationMode);
        executeHooks(/** @type {?} */ ((directives)), tView.contentHooks, tView.contentCheckHooks, creationMode);
    }
}
/**
 * @template T
 * @param {?} viewId
 * @param {?} renderer
 * @param {?} tView
 * @param {?} template
 * @param {?} context
 * @param {?} flags
 * @param {?=} sanitizer
 * @return {?}
 */
export function createLView(viewId, renderer, tView, template, context, flags, sanitizer) {
    const /** @type {?} */ newView = {
        parent: currentView,
        id: viewId,
        // -1 for component views
        flags: flags | 1 /* CreationMode */ | 8 /* Attached */,
        node: /** @type {?} */ ((null)),
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
        parent: /** @type {?} */ (parent),
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
        previousOrParentNode && /** @type {?} */ (previousOrParentNode.parent);
    let /** @type {?} */ queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    const /** @type {?} */ isState = state != null;
    const /** @type {?} */ node = createLNodeObject(type, currentView, parent, native, isState ? /** @type {?} */ (state) : null, queries);
    if (index === null || type === 2 /* View */) {
        // View nodes are not stored in data because they can be added / removed at runtime (which
        // would cause indices to change). Their TNodes are instead stored in TView.node.
        node.tNode = (/** @type {?} */ (state)).tView.node || createTNode(type, index, null, null, null);
    }
    else {
        // This is an element or container or projection node
        ngDevMode && assertDataNext(index);
        data[index] = node;
        // Every node adds a value to the static data array to avoid a sparse array
        if (index >= tData.length) {
            const /** @type {?} */ tNode = tData[index] = createTNode(type, index, name, attrs, null);
            if (!isParent && previousOrParentNode) {
                const /** @type {?} */ previousTNode = previousOrParentNode.tNode;
                previousTNode.next = tNode;
                if (previousTNode.dynamicContainerNode)
                    previousTNode.dynamicContainerNode.next = tNode;
            }
        }
        node.tNode = /** @type {?} */ (tData[index]);
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
        ngDevMode && assertNull((/** @type {?} */ (state)).node, 'LView.node should not have been initialized');
        (/** @type {?} */ (state)).node = node;
        if (firstTemplatePass)
            (/** @type {?} */ (state)).tView.node = node.tNode;
    }
    previousOrParentNode = node;
    isParent = true;
    return node;
}
/**
 * Resets the application state.
 * @return {?}
 */
function resetApplicationState() {
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
        const /** @type {?} */ tView = getOrCreateTView(template, directives || null, pipes || null);
        host = createLNode(null, 3 /* Element */, hostNode, null, null, createLView(-1, providedRendererFactory.createRenderer(null, null), tView, null, {}, 2 /* CheckAlways */, sanitizer));
    }
    const /** @type {?} */ hostView = /** @type {?} */ ((host.data));
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
 * @template T
 * @param {?} viewNode
 * @param {?} tView
 * @param {?} template
 * @param {?} context
 * @param {?} renderer
 * @param {?=} directives
 * @param {?=} pipes
 * @return {?}
 */
export function renderEmbeddedTemplate(viewNode, tView, template, context, renderer, directives, pipes) {
    const /** @type {?} */ _isParent = isParent;
    const /** @type {?} */ _previousOrParentNode = previousOrParentNode;
    let /** @type {?} */ oldView;
    let /** @type {?} */ rf = 2 /* Update */;
    try {
        isParent = true;
        previousOrParentNode = /** @type {?} */ ((null));
        if (viewNode == null) {
            const /** @type {?} */ lView = createLView(-1, renderer, tView, template, context, 2 /* CheckAlways */, getCurrentSanitizer());
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
            template(getRenderFlags(hostView), /** @type {?} */ ((componentOrContext)));
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
 * @param {?} view
 * @return {?}
 */
function getRenderFlags(view) {
    return view.flags & 1 /* CreationMode */ ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
}
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param {?} index Index of the element in the data array
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
        assertEqual(currentView.bindingStartIndex, -1, 'elements should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateElement++;
    const /** @type {?} */ native = renderer.createElement(name);
    ngDevMode && assertDataInRange(index - 1);
    const /** @type {?} */ node = createLNode(index, 3 /* Element */, /** @type {?} */ ((native)), name, attrs || null, null);
    if (attrs)
        setUpAttributes(native, attrs);
    appendChild(/** @type {?} */ ((node.parent)), native, currentView);
    createDirectivesAndLocals(index, name, attrs, localRefs, false);
    return native;
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param {?} index Index of the current node (to create TNode)
 * @param {?} name Tag name of the current node
 * @param {?} attrs Attrs of the current node
 * @param {?} localRefs Local refs of the current node
 * @param {?} inlineViews Whether or not this node will create inline views
 * @return {?}
 */
function createDirectivesAndLocals(index, name, attrs, localRefs, inlineViews) {
    const /** @type {?} */ node = previousOrParentNode;
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
    const /** @type {?} */ registry = currentView.tView.directiveRegistry;
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
        (currentView.tView.components || (currentView.tView.components = [])).push(dirIndex, data.length - 1);
    }
}
/**
 * Stores index of directive and host element so it will be queued for binding refresh during CD.
 * @param {?} dirIndex
 * @return {?}
 */
function queueHostBindingForCheck(dirIndex) {
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (currentView.tView.hostBindings || (currentView.tView.hostBindings = [])).push(dirIndex, data.length - 1);
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
        const /** @type {?} */ tDirectives = /** @type {?} */ ((currentView.tView.directives));
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
 * to data[] in the same order as they are loaded in the template with load().
 * @return {?}
 */
function saveResolvedLocalsInData() {
    const /** @type {?} */ localNames = previousOrParentNode.tNode.localNames;
    if (localNames) {
        for (let /** @type {?} */ i = 0; i < localNames.length; i += 2) {
            const /** @type {?} */ index = /** @type {?} */ (localNames[i + 1]);
            const /** @type {?} */ value = index === -1 ? previousOrParentNode.native : /** @type {?} */ ((directives))[index];
            data.push(value);
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
 * @return {?} TView
 */
function getOrCreateTView(template, directives, pipes) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return template.ngPrivateData ||
        (template.ngPrivateData = /** @type {?} */ (createTView(directives, pipes)));
}
/**
 * Creates a TView instance
 * @param {?} defs
 * @param {?} pipes
 * @return {?}
 */
export function createTView(defs, pipes) {
    ngDevMode && ngDevMode.tView++;
    return {
        node: /** @type {?} */ ((null)),
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
/**
 * @param {?} native
 * @param {?} attrs
 * @return {?}
 */
function setUpAttributes(native, attrs) {
    ngDevMode && assertEqual(attrs.length % 2, 0, 'each attribute should have a key and a value');
    const /** @type {?} */ isProc = isProceduralRenderer(renderer);
    for (let /** @type {?} */ i = 0; i < attrs.length; i += 2) {
        const /** @type {?} */ attrName = attrs[i];
        if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
            const /** @type {?} */ attrVal = attrs[i + 1];
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ? (/** @type {?} */ (renderer)).setAttribute(native, attrName, attrVal) :
                native.setAttribute(attrName, attrVal);
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
    const /** @type {?} */ node = createLNode(0, 3 /* Element */, rNode, null, null, createLView(-1, renderer, getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs), null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, sanitizer));
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
 * @param {?} eventName Name of the event
 * @param {?} listenerFn The function to be called when event emits
 * @param {?=} useCapture Whether or not to use capture in event listener.
 * @return {?}
 */
export function listener(eventName, listenerFn, useCapture = false) {
    ngDevMode && assertPreviousIsParent();
    const /** @type {?} */ node = previousOrParentNode;
    const /** @type {?} */ native = /** @type {?} */ (node.native);
    // In order to match current behavior, native DOM event listeners must be added for all
    // events (including outputs).
    const /** @type {?} */ cleanupFns = cleanup || (cleanup = currentView.cleanup = []);
    ngDevMode && ngDevMode.rendererAddEventListener++;
    if (isProceduralRenderer(renderer)) {
        const /** @type {?} */ wrappedListener = wrapListenerWithDirtyLogic(currentView, listenerFn);
        const /** @type {?} */ cleanupFn = renderer.listen(native, eventName, wrappedListener);
        cleanupFns.push(cleanupFn, null);
    }
    else {
        const /** @type {?} */ wrappedListener = wrapListenerWithDirtyAndDefault(currentView, listenerFn);
        native.addEventListener(eventName, wrappedListener, useCapture);
        cleanupFns.push(eventName, native, wrappedListener, useCapture);
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
        const /** @type {?} */ subscription = /** @type {?} */ ((directives))[/** @type {?} */ (outputs[i])][outputs[i + 1]].subscribe(listener); /** @type {?} */
        ((cleanup)).push(subscription.unsubscribe, subscription);
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
        previousOrParentNode = /** @type {?} */ ((previousOrParentNode.parent));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 3 /* Element */);
    const /** @type {?} */ queries = previousOrParentNode.queries;
    queries && queries.addNode(previousOrParentNode);
    queueLifecycleHooks(previousOrParentNode.tNode.flags, currentView);
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
        const /** @type {?} */ element = data[index];
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
    const /** @type {?} */ node = /** @type {?} */ (data[index]);
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
 * @param {?} index The index of the TNode in TView.data
 * @param {?} tagName The tag name of the node
 * @param {?} attrs The attributes defined on this node
 * @param {?} tViews Any TViews attached to this node
 * @return {?} the TNode object
 */
export function createTNode(type, index, tagName, attrs, tViews) {
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
        dynamicContainerNode: null
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
        const /** @type {?} */ defs = /** @type {?} */ ((currentView.tView.directives));
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
        const /** @type {?} */ lElement = /** @type {?} */ (data[index]);
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
        const /** @type {?} */ lElement = data[index];
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
        const /** @type {?} */ lElement = data[index];
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
 * @param {?} index The index of the element to update in the data array
 * @param {?} value A value indicating if a given style should be added or removed.
 *   The expected shape of `value` is an object where keys are style names and the values
 *   are their corresponding values to set. If value is falsy than the style is remove. An absence
 *   of style does not cause that style to be removed. `NO_CHANGE` implies that no update should be
 *   performed.
 * @return {?}
 */
export function elementStyle(index, value) {
    if (value !== NO_CHANGE) {
        // TODO: This is a naive implementation which simply writes value to the `style`. In the future
        // we will add logic here which would work with the animation code.
        const /** @type {?} */ lElement = /** @type {?} */ (data[index]);
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
 * @param {?} index Index of the node in the data array.
 * @param {?=} value Value to write. This value will be stringified.
 * @return {?}
 */
export function text(index, value) {
    ngDevMode &&
        assertEqual(currentView.bindingStartIndex, -1, 'text nodes should be created before bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    const /** @type {?} */ textNode = createTextNode(value, renderer);
    const /** @type {?} */ node = createLNode(index, 3 /* Element */, textNode, null, null);
    // Text nodes are self closing.
    isParent = false;
    appendChild(/** @type {?} */ ((node.parent)), textNode, currentView);
}
/**
 * Create text node with binding
 * Bindings should be handled externally with the proper bind(1-8) method
 *
 * @template T
 * @param {?} index Index of the node in the data array.
 * @param {?} value Stringified value to write.
 * @return {?}
 */
export function textBinding(index, value) {
    ngDevMode && assertDataInRange(index);
    let /** @type {?} */ existingNode = /** @type {?} */ (data[index]);
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
 * @template T
 * @param {?} index
 * @param {?} directive The directive instance.
 * @param {?} directiveDef DirectiveDef object which contains information about the template.
 * @return {?}
 */
export function directiveCreate(index, directive, directiveDef) {
    const /** @type {?} */ instance = baseDirectiveCreate(index, directive, directiveDef);
    ngDevMode && assertNotNull(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    const /** @type {?} */ tNode = previousOrParentNode.tNode;
    const /** @type {?} */ isComponent = (/** @type {?} */ (directiveDef)).template;
    if (isComponent) {
        addComponentLogic(index, directive, /** @type {?} */ (directiveDef));
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
/**
 * @template T
 * @param {?} index
 * @param {?} instance
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(index, instance, def) {
    const /** @type {?} */ tView = getOrCreateTView(def.template, def.directiveDefs, def.pipeDefs);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const /** @type {?} */ hostView = addToViewTree(currentView, createLView(-1, rendererFactory.createRenderer(/** @type {?} */ (previousOrParentNode.native), def.rendererType), tView, null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    // We need to set the host node/data here because when the component LNode was created,
    // we didn't yet know it was a component (just an element).
    (/** @type {?} */ (previousOrParentNode)).data = hostView;
    (/** @type {?} */ (hostView)).node = previousOrParentNode;
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
 * @template T
 * @param {?} index
 * @param {?} directive
 * @param {?} directiveDef
 * @return {?}
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
    for (let /** @type {?} */ i = 0; i < attrs.length; i += 2) {
        const /** @type {?} */ attrName = attrs[i];
        const /** @type {?} */ minifiedInputName = inputs[attrName];
        if (minifiedInputName !== undefined) {
            const /** @type {?} */ inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(minifiedInputName, attrs[i + 1]);
        }
    }
    return initialInputData;
}
/**
 * @param {?} parentLNode
 * @param {?} currentView
 * @param {?=} template
 * @return {?}
 */
export function createLContainer(parentLNode, currentView, template) {
    ngDevMode && assertNotNull(parentLNode, 'containers should have a parent');
    return /** @type {?} */ ({
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
    });
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
    ngDevMode && assertEqual(currentView.bindingStartIndex, -1, 'container nodes should be created before any bindings');
    const /** @type {?} */ currentParent = isParent ? previousOrParentNode : /** @type {?} */ ((previousOrParentNode.parent));
    const /** @type {?} */ lContainer = createLContainer(currentParent, currentView, template);
    const /** @type {?} */ node = createLNode(index, 0 /* Container */, undefined, tagName || null, attrs || null, lContainer);
    if (firstTemplatePass && template == null)
        node.tNode.tViews = [];
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(currentView, node.data);
    createDirectivesAndLocals(index, tagName || null, attrs, localRefs, template == null);
    isParent = false;
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    const /** @type {?} */ queries = node.queries;
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
 * @param {?} index The index of the container in the data array
 * @return {?}
 */
export function containerRefreshStart(index) {
    ngDevMode && assertDataInRange(index);
    previousOrParentNode = /** @type {?} */ (data[index]);
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    isParent = true;
    (/** @type {?} */ (previousOrParentNode)).data.nextIndex = 0;
    ngDevMode && assertSame((/** @type {?} */ (previousOrParentNode)).native, undefined, `the container's native element should not have been set yet.`);
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
 * @return {?}
 */
export function containerRefreshEnd() {
    if (isParent) {
        isParent = false;
    }
    else {
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentNode = /** @type {?} */ ((previousOrParentNode.parent));
    }
    ngDevMode && assertNodeType(previousOrParentNode, 0 /* Container */);
    const /** @type {?} */ container = /** @type {?} */ (previousOrParentNode);
    container.native = undefined;
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const /** @type {?} */ nextIndex = container.data.nextIndex;
    // remove extra views at the end of the container
    while (nextIndex < container.data.views.length) {
        removeView(container, nextIndex);
    }
}
/**
 * @return {?}
 */
function refreshDynamicChildren() {
    for (let /** @type {?} */ current = currentView.child; current !== null; current = current.next) {
        if (current.dynamicViewCount !== 0 && (/** @type {?} */ (current)).views) {
            const /** @type {?} */ container = /** @type {?} */ (current);
            for (let /** @type {?} */ i = 0; i < container.views.length; i++) {
                const /** @type {?} */ lViewNode = container.views[i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                const /** @type {?} */ dynamicView = lViewNode.data;
                ngDevMode && assertNotNull(dynamicView.tView, 'TView must be allocated');
                renderEmbeddedTemplate(lViewNode, dynamicView.tView, /** @type {?} */ ((dynamicView.template)), /** @type {?} */ ((dynamicView.context)), renderer);
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
    const /** @type {?} */ views = containerNode.data.views;
    for (let /** @type {?} */ i = startIdx; i < views.length; i++) {
        const /** @type {?} */ viewAtPositionId = views[i].data.id;
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
 * @param {?} viewBlockId The ID of this view
 * @return {?} boolean Whether or not this view is in creation mode
 */
export function embeddedViewStart(viewBlockId) {
    const /** @type {?} */ container = /** @type {?} */ ((isParent ? previousOrParentNode : /** @type {?} */ ((previousOrParentNode.parent))));
    ngDevMode && assertNodeType(container, 0 /* Container */);
    const /** @type {?} */ lContainer = container.data;
    let /** @type {?} */ viewNode = scanForView(container, lContainer.nextIndex, viewBlockId);
    if (viewNode) {
        previousOrParentNode = viewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView(viewNode.data, viewNode);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        const /** @type {?} */ newView = createLView(viewBlockId, renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, null, 2 /* CheckAlways */, getCurrentSanitizer());
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
 * @param {?} viewIndex The index of the TView in TNode.tViews
 * @param {?} parent The parent container in which to look for the view's static data
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    const /** @type {?} */ containerTViews = /** @type {?} */ ((/** @type {?} */ (((parent)).tNode)).tViews);
    ngDevMode && assertNotNull(containerTViews, 'TView expected');
    ngDevMode && assertEqual(Array.isArray(containerTViews), true, 'TViews should be in an array');
    if (viewIndex >= containerTViews.length || containerTViews[viewIndex] == null) {
        const /** @type {?} */ tView = currentView.tView;
        containerTViews[viewIndex] = createTView(tView.directiveRegistry, tView.pipeRegistry);
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
    const /** @type {?} */ viewNode = previousOrParentNode = /** @type {?} */ (currentView.node);
    const /** @type {?} */ containerNode = /** @type {?} */ (previousOrParentNode.parent);
    if (containerNode) {
        ngDevMode && assertNodeType(viewNode, 2 /* View */);
        ngDevMode && assertNodeType(containerNode, 0 /* Container */);
        const /** @type {?} */ lContainer = containerNode.data;
        if (creationMode) {
            // When projected nodes are going to be inserted, the renderParent of the dynamic container
            // used by the ViewContainerRef must be set.
            setRenderParentInProjectedNodes(lContainer.renderParent, viewNode);
            // it is a new view, insert it into collection of views for a given container
            insertView(containerNode, viewNode, lContainer.nextIndex);
        }
        lContainer.nextIndex++;
    }
    leaveView(/** @type {?} */ ((/** @type {?} */ ((currentView)).parent)));
    ngDevMode && assertEqual(isParent, false, 'isParent');
    ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
}
/**
 * For nodes which are projected inside an embedded view, this function sets the renderParent
 * of their dynamic LContainerNode.
 * @param {?} renderParent the renderParent of the LContainer which contains the embedded view.
 * @param {?} viewNode the embedded view.
 * @return {?}
 */
function setRenderParentInProjectedNodes(renderParent, viewNode) {
    if (renderParent != null) {
        let /** @type {?} */ node = getChildLNode(viewNode);
        while (node) {
            if (node.tNode.type === 1 /* Projection */) {
                let /** @type {?} */ nodeToProject = (/** @type {?} */ (node)).data.head;
                const /** @type {?} */ lastNodeToProject = (/** @type {?} */ (node)).data.tail;
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
 * @template T
 * @param {?} directiveIndex
 * @param {?} elementIndex
 * @return {?}
 */
export function componentRefresh(directiveIndex, elementIndex) {
    ngDevMode && assertDataInRange(elementIndex);
    const /** @type {?} */ element = /** @type {?} */ (((data))[elementIndex]);
    ngDevMode && assertNodeType(element, 3 /* Element */);
    ngDevMode && assertNotNull(element.data, `Component's host node should have an LView attached.`);
    const /** @type {?} */ hostView = /** @type {?} */ ((element.data));
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView.flags & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        ngDevMode && assertDataInRange(directiveIndex, /** @type {?} */ ((directives)));
        const /** @type {?} */ def = /** @type {?} */ (((currentView.tView.directives))[directiveIndex]);
        detectChangesInternal(hostView, element, def, getDirectiveInstance(/** @type {?} */ ((directives))[directiveIndex]));
    }
}
/**
 * Returns a boolean for whether the view is attached
 * @param {?} view
 * @return {?}
 */
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
    const /** @type {?} */ componentNode = findComponentHost(currentView);
    let /** @type {?} */ componentChild = getChildLNode(componentNode);
    while (componentChild !== null) {
        // execute selector matching logic if and only if:
        // - there are selectors defined
        // - a node has a tag name / attributes that can be matched
        if (selectors && componentChild.tNode) {
            const /** @type {?} */ matchedIdx = matchingSelectorIndex(componentChild.tNode, selectors, /** @type {?} */ ((textSelectors)));
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
    const /** @type {?} */ currentParent = node.parent;
    // re-distribution of projectable nodes is memorized on a component's view level
    const /** @type {?} */ componentNode = findComponentHost(currentView);
    const /** @type {?} */ componentLView = /** @type {?} */ ((componentNode.data));
    const /** @type {?} */ nodesForSelector = /** @type {?} */ ((componentLView.data))[localIndex][selectorIndex];
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
    if (canInsertNativeNode(currentParent, currentView)) {
        ngDevMode && assertNodeType(currentParent, 3 /* Element */);
        // process each node in the list of projected nodes:
        let /** @type {?} */ nodeToProject = node.data.head;
        const /** @type {?} */ lastNodeToProject = node.data.tail;
        while (nodeToProject) {
            appendProjectedNode(/** @type {?} */ (nodeToProject), /** @type {?} */ (currentParent), currentView);
            nodeToProject = nodeToProject === lastNodeToProject ? null : nodeToProject.pNextOrParent;
        }
    }
}
/**
 * Given a current view, finds the nearest component's host (LElement).
 *
 * @param {?} lView LView for which we want a host element node
 * @return {?} The host node
 */
function findComponentHost(lView) {
    let /** @type {?} */ viewRootLNode = lView.node;
    while (viewRootLNode.tNode.type === 2 /* View */) {
        ngDevMode && assertNotNull(lView.parent, 'lView.parent');
        lView = /** @type {?} */ ((lView.parent));
        viewRootLNode = lView.node;
    }
    ngDevMode && assertNodeType(viewRootLNode, 3 /* Element */);
    ngDevMode && assertNotNull(viewRootLNode.data, 'node.data');
    return /** @type {?} */ (viewRootLNode);
}
/**
 * Adds a LView or a LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @template T
 * @param {?} currentView The view where LView or LContainer should be added
 * @param {?} state The LView or LContainer to add to the view tree
 * @return {?} The state passed in
 */
export function addToViewTree(currentView, state) {
    currentView.tail ? (currentView.tail.next = state) : (currentView.child = state);
    currentView.tail = state;
    return state;
}
/**
 * If node is an OnPush component, marks its LView dirty.
 * @param {?} node
 * @return {?}
 */
export function markDirtyIfOnPush(node) {
    // Because data flows down the component tree, ancestors do not need to be marked dirty
    if (node.data && !(node.data.flags & 2 /* CheckAlways */)) {
        node.data.flags |= 4 /* Dirty */;
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
    while (currentView.parent != null) {
        currentView.flags |= 4 /* Dirty */;
        currentView = currentView.parent;
    }
    currentView.flags |= 4 /* Dirty */;
    ngDevMode && assertNotNull(/** @type {?} */ ((currentView)).context, 'rootContext');
    scheduleTick(/** @type {?} */ (((currentView)).context));
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
            tick(rootContext.component); /** @type {?} */
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
    const /** @type {?} */ rootComponent = (/** @type {?} */ (rootView.context)).component;
    const /** @type {?} */ hostNode = _getComponentHostLElementNode(rootComponent);
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    renderComponentOrTemplate(hostNode, rootView, rootComponent);
}
/**
 * Retrieve the root view from any component by walking the parent `LView` until
 * reaching the root `LView`.
 *
 * @param {?} component any component
 * @return {?}
 */
export function getRootView(component) {
    ngDevMode && assertNotNull(component, 'component');
    const /** @type {?} */ lElementNode = _getComponentHostLElementNode(component);
    let /** @type {?} */ lView = lElementNode.view;
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
    ngDevMode && assertNotNull(hostNode.data, 'Component host node should be attached to an LView');
    const /** @type {?} */ componentIndex = hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */;
    const /** @type {?} */ def = /** @type {?} */ (((hostNode.view.tView.directives))[componentIndex]);
    detectChangesInternal(/** @type {?} */ (hostNode.data), hostNode, def, component);
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
 * @param {?} def
 * @param {?} component
 * @return {?}
 */
export function detectChangesInternal(hostView, hostNode, def, component) {
    const /** @type {?} */ oldView = enterView(hostView, hostNode);
    const /** @type {?} */ template = def.template;
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
 * @template T
 * @param {?} component Component to mark as dirty.
 * @return {?}
 */
export function markDirty(component) {
    ngDevMode && assertNotNull(component, 'component');
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
    ngDevMode && assertEqual(currentView.bindingStartIndex, -1, 'Binding start index should only be set once, when null');
    ngDevMode && assertEqual(currentView.bindingIndex, -1, 'Binding index should not yet be set ' + currentView.bindingIndex);
    currentView.bindingIndex = currentView.bindingStartIndex = data.length;
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(value) {
    if (currentView.bindingStartIndex < 0) {
        initBindings();
        return data[currentView.bindingIndex++] = value;
    }
    const /** @type {?} */ changed = value !== NO_CHANGE && isDifferent(data[currentView.bindingIndex], value);
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
 * @param {?} numSlots
 * @return {?}
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
 * {\@link reserveSlots}
 * @param {?} offset
 * @return {?}
 */
export function moveBindingIndexToReservedSlot(offset) {
    const /** @type {?} */ currentSlot = currentView.bindingIndex;
    currentView.bindingIndex = currentView.bindingStartIndex - offset;
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
    if (index >= tData.length) {
        tData[index] = null;
    }
    data[index] = value;
}
/**
 * Retrieves a value from the `data`.
 * @template T
 * @param {?} index
 * @return {?}
 */
export function load(index) {
    ngDevMode && assertDataInRange(index);
    return data[index];
}
/**
 * Retrieves a value from the `directives` array.
 * @template T
 * @param {?} index
 * @return {?}
 */
export function loadDirective(index) {
    ngDevMode && assertNotNull(directives, 'Directives array should be defined if reading a dir.');
    ngDevMode && assertDataInRange(index, /** @type {?} */ ((directives)));
    return /** @type {?} */ ((directives))[index];
}
/**
 * Gets the current binding value and increments the binding index.
 * @return {?}
 */
export function consumeBinding() {
    ngDevMode && assertDataInRange(currentView.bindingIndex);
    ngDevMode &&
        assertNotEqual(data[currentView.bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return data[currentView.bindingIndex++];
}
/**
 * Updates binding if changed, then returns whether it was updated.
 * @param {?} value
 * @return {?}
 */
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
    return currentView.tView;
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
    assertNotNull(previousOrParentNode.parent, 'previousOrParentNode should have a parent');
}
/**
 * @param {?} index
 * @param {?=} arr
 * @return {?}
 */
function assertDataInRange(index, arr) {
    if (arr == null)
        arr = data;
    assertLessThan(index, arr ? arr.length : 0, 'index expected to be a valid data index');
}
/**
 * @param {?} index
 * @param {?=} arr
 * @return {?}
 */
function assertDataNext(index, arr) {
    if (arr == null)
        arr = data;
    assertEqual(arr.length, index, `index ${index} expected to be at the end of arr (length ${arr.length})`);
}
/**
 * On the first template pass the reserved slots should be set `NO_CHANGE`.
 *
 * If not they might not have been actually reserved.
 * @param {?} slotOffset
 * @param {?} numSlots
 * @return {?}
 */
export function assertReservedSlotInitialized(slotOffset, numSlots) {
    if (firstTemplatePass) {
        const /** @type {?} */ startIndex = currentView.bindingStartIndex - slotOffset;
        for (let /** @type {?} */ i = 0; i < numSlots; i++) {
            assertEqual(data[startIndex + i], NO_CHANGE, 'The reserved slots should be set to `NO_CHANGE` on first template pass');
        }
    }
}
/**
 * @template T
 * @param {?} component
 * @return {?}
 */
export function _getComponentHostLElementNode(component) {
    ngDevMode && assertNotNull(component, 'expecting component got null');
    const /** @type {?} */ lElementNode = /** @type {?} */ ((/** @type {?} */ (component))[NG_HOST_SYMBOL]);
    ngDevMode && assertNotNull(component, 'object is not a component');
    return lElementNode;
}
export const /** @type {?} */ CLEAN_PROMISE = _CLEAN_PROMISE;
export const /** @type {?} */ ROOT_DIRECTIVE_INDICES = _ROOT_DIRECTIVE_INDICES;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFRQSxPQUFPLGVBQWUsQ0FBQztBQUV2QixPQUFPLEVBQUMsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFHNUcsT0FBTyxFQUErQix1QkFBdUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBSzlGLE9BQU8sRUFBQyxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDN0MsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsbUJBQW1CLEVBQUUsVUFBVSxFQUFFLG1CQUFtQixFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDL0osT0FBTyxFQUFDLDBCQUEwQixFQUFFLHFCQUFxQixFQUFDLE1BQU0seUJBQXlCLENBQUM7QUFFMUYsT0FBTyxFQUFvRSxtQkFBbUIsRUFBRSxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ25KLE9BQU8sRUFBQyxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQzlDLE9BQU8sRUFBQyxZQUFZLEVBQUUsbUJBQW1CLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTVGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSx5QkFBeUIsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFVBQVUsQ0FBQzs7Ozs7O0FBUTVHLE1BQU0sQ0FBQyx1QkFBTSxjQUFjLEdBQUcsaUJBQWlCLENBQUM7Ozs7O0FBTWhELHVCQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDOzs7Ozs7QUFZN0MsTUFBTSxDQUFDLHVCQUFNLHVCQUF1QixHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDOzs7Ozs7O0FBUTlDLE1BQU0sQ0FBQyx1QkFBTSxRQUFRLEdBQUcsY0FBYyxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQnZDLHFCQUFJLFFBQW1CLENBQUM7QUFDeEIscUJBQUksZUFBaUMsQ0FBQzs7OztBQUV0QyxNQUFNOztJQUVKLE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7O0FBRUQsTUFBTTtJQUNKLE9BQU8sV0FBVyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUM7Q0FDN0M7Ozs7QUFHRCxxQkFBSSxvQkFBMkIsQ0FBQzs7OztBQUVoQyxNQUFNOztJQUVKLE9BQU8sb0JBQW9CLENBQUM7Q0FDN0I7Ozs7OztBQU9ELHFCQUFJLFFBQWlCLENBQUM7Ozs7Ozs7O0FBU3RCLHFCQUFJLEtBQVksQ0FBQzs7Ozs7Ozs7O0FBVWpCLHFCQUFJLFdBQVcsc0JBQVUsSUFBSSxFQUFFLENBQUM7QUFFaEMscUJBQUksY0FBNkIsQ0FBQzs7Ozs7QUFFbEMsTUFBTSw0QkFBNEIsU0FBNkI7O0lBRTdELE9BQU8sY0FBYyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUMsQ0FBQztDQUM3RDs7OztBQUtELHFCQUFJLFlBQXFCLENBQUM7Ozs7QUFFMUIsTUFBTTs7SUFFSixPQUFPLFlBQVksQ0FBQztDQUNyQjs7Ozs7QUFNRCxxQkFBSSxJQUFXLENBQUM7Ozs7Ozs7QUFRaEIscUJBQUksVUFBc0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUIzQixxQkFBSSxPQUFtQixDQUFDOzs7Ozs7QUFPeEIscUJBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFDOzs7O0FBRy9CLHFCQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUI3QixNQUFNLG9CQUFvQixPQUFjLEVBQUUsSUFBcUM7SUFDN0UsdUJBQU0sT0FBTyxHQUFVLFdBQVcsQ0FBQztJQUNuQyxJQUFJLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLENBQUM7SUFDL0IsVUFBVSxHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDO0lBQzNDLEtBQUssR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFDdEMsWUFBWSxHQUFHLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLHVCQUEwQixDQUFDLHlCQUE0QixDQUFDO0lBQ2hHLGlCQUFpQixHQUFHLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0lBRS9ELE9BQU8sR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUNyQyxRQUFRLEdBQUcsT0FBTyxJQUFJLE9BQU8sQ0FBQyxRQUFRLENBQUM7SUFFdkMsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFlBQVksR0FBRyxDQUFDLEVBQUU7UUFDdkMsT0FBTyxDQUFDLFlBQVksR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUM7S0FDbEQ7SUFFRCxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUU7UUFDaEIsb0JBQW9CLEdBQUcsSUFBSSxDQUFDO1FBQzVCLFFBQVEsR0FBRyxJQUFJLENBQUM7S0FDakI7SUFFRCxXQUFXLEdBQUcsT0FBTyxDQUFDO0lBQ3RCLGNBQWMsR0FBRyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQztJQUU1QyxPQUFPLE9BQU8sQ0FBQztDQUNoQjs7Ozs7Ozs7OztBQVVELE1BQU0sb0JBQW9CLE9BQWMsRUFBRSxZQUFzQjtJQUM5RCxJQUFJLENBQUMsWUFBWSxFQUFFO1FBQ2pCLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QixZQUFZLG9CQUNSLFVBQVUsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFDM0UsWUFBWSxDQUFDLENBQUM7U0FDbkI7O1FBRUQsV0FBVyxDQUFDLEtBQUssSUFBSSxDQUFDLENBQUMsb0NBQTBDLENBQUMsQ0FBQztLQUNwRTtJQUNELFdBQVcsQ0FBQyxjQUFjLGVBQXNCLENBQUM7SUFDakQsV0FBVyxDQUFDLFlBQVksR0FBRyxDQUFDLENBQUMsQ0FBQztJQUM5QixTQUFTLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQzFCOzs7Ozs7Ozs7QUFRRDtJQUNFLHVCQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDO0lBQ2hDLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUN2QixnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3BEO0lBQ0Qsc0JBQXNCLEVBQUUsQ0FBQztJQUN6QixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFDdkIsWUFBWSxvQkFBQyxVQUFVLElBQUksS0FBSyxDQUFDLFlBQVksRUFBRSxLQUFLLENBQUMsaUJBQWlCLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDdkY7O0lBR0QsS0FBSyxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLEtBQUssQ0FBQztJQUVwRCxlQUFlLENBQUMsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3BDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQztDQUMxQzs7Ozs7O0FBR0QsTUFBTSwwQkFBMEIsUUFBeUI7SUFDdkQsSUFBSSxRQUFRLElBQUksSUFBSSxFQUFFO1FBQ3BCLHVCQUFNLElBQUksc0JBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQztRQUM1QyxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMzQyx1QkFBTSxRQUFRLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzdCLHVCQUFNLEdBQUcscUJBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBc0IsQ0FBQSxDQUFDO1lBQ2hELEdBQUcsQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pFO0tBQ0Y7Q0FDRjs7Ozs7O0FBR0QsZ0NBQWdDLFVBQTJCO0lBQ3pELElBQUksVUFBVSxJQUFJLElBQUksRUFBRTtRQUN0QixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3BEO0tBQ0Y7Q0FDRjs7OztBQUVELE1BQU07SUFDSixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFDdkIsdUJBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDaEMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztRQUNuRCxZQUFZLG9CQUFDLFVBQVUsSUFBSSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztLQUN2RjtDQUNGOzs7Ozs7Ozs7Ozs7QUFFRCxNQUFNLHNCQUNGLE1BQWMsRUFBRSxRQUFtQixFQUFFLEtBQVksRUFBRSxRQUFvQyxFQUN2RixPQUFpQixFQUFFLEtBQWlCLEVBQUUsU0FBNEI7SUFDcEUsdUJBQU0sT0FBTyxHQUFHO1FBQ2QsTUFBTSxFQUFFLFdBQVc7UUFDbkIsRUFBRSxFQUFFLE1BQU07O1FBQ1YsS0FBSyxFQUFFLEtBQUssdUJBQTBCLG1CQUFzQjtRQUM1RCxJQUFJLHFCQUFFLElBQUksRUFBRTs7UUFDWixJQUFJLEVBQUUsRUFBRTtRQUNSLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLEtBQUssRUFBRSxLQUFLO1FBQ1osT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsUUFBUTtRQUNsQixLQUFLLEVBQUUsSUFBSTtRQUNYLElBQUksRUFBRSxJQUFJO1FBQ1YsSUFBSSxFQUFFLElBQUk7UUFDVixpQkFBaUIsRUFBRSxDQUFDLENBQUM7UUFDckIsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUNoQixRQUFRLEVBQUUsUUFBUTtRQUNsQixPQUFPLEVBQUUsT0FBTztRQUNoQixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLGNBQWMsY0FBcUI7UUFDbkMsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsV0FBVyxJQUFJLFdBQVcsQ0FBQyxRQUFRO1FBQzdDLFNBQVMsRUFBRSxTQUFTLElBQUksSUFBSTtLQUM3QixDQUFDO0lBRUYsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7Ozs7Ozs7QUFPRCxNQUFNLDRCQUNGLElBQWUsRUFBRSxXQUFrQixFQUFFLE1BQWEsRUFBRSxNQUEyQyxFQUMvRixLQUFVLEVBQ1YsT0FBd0I7SUFDMUIsT0FBTztRQUNMLE1BQU0sb0JBQUUsTUFBYSxDQUFBO1FBQ3JCLElBQUksRUFBRSxXQUFXO1FBQ2pCLE1BQU0sb0JBQUUsTUFBYSxDQUFBO1FBQ3JCLFlBQVksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUk7UUFDakQsSUFBSSxFQUFFLEtBQUs7UUFDWCxPQUFPLEVBQUUsT0FBTztRQUNoQixLQUFLLHFCQUFFLElBQUksRUFBRTtRQUNiLGFBQWEsRUFBRSxJQUFJO1FBQ25CLHFCQUFxQixFQUFFLElBQUk7S0FDNUIsQ0FBQztDQUNIOzs7Ozs7Ozs7O0FBMEJELE1BQU0sc0JBQ0YsS0FBb0IsRUFBRSxJQUFlLEVBQUUsTUFBMkMsRUFDbEYsSUFBbUIsRUFBRSxLQUFzQixFQUFFLEtBQzlCO0lBQ2pCLHVCQUFNLE1BQU0sR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDdEIsb0JBQW9CLHNCQUFJLG9CQUFvQixDQUFDLE1BQWUsQ0FBQSxDQUFDO0lBQ3ZGLHFCQUFJLE9BQU8sR0FDUCxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxvQkFBb0IsSUFBSSxvQkFBb0IsQ0FBQyxPQUFPLENBQUM7UUFDbEYsTUFBTSxJQUFJLE1BQU0sQ0FBQyxPQUFPLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN2RCx1QkFBTSxPQUFPLEdBQUcsS0FBSyxJQUFJLElBQUksQ0FBQztJQUM5Qix1QkFBTSxJQUFJLEdBQ04saUJBQWlCLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLE9BQU8sQ0FBQyxDQUFDLG1CQUFDLEtBQVksRUFBQyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBRWpHLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxJQUFJLGlCQUFtQixFQUFFOzs7UUFHN0MsSUFBSSxDQUFDLEtBQUssR0FBRyxtQkFBQyxLQUFjLEVBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDeEY7U0FBTTs7UUFFTCxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7O1FBR25CLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUU7WUFDekIsdUJBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ3pFLElBQUksQ0FBQyxRQUFRLElBQUksb0JBQW9CLEVBQUU7Z0JBQ3JDLHVCQUFNLGFBQWEsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7Z0JBQ2pELGFBQWEsQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDO2dCQUMzQixJQUFJLGFBQWEsQ0FBQyxvQkFBb0I7b0JBQUUsYUFBYSxDQUFDLG9CQUFvQixDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7YUFDekY7U0FDRjtRQUNELElBQUksQ0FBQyxLQUFLLHFCQUFHLEtBQUssQ0FBQyxLQUFLLENBQVUsQ0FBQSxDQUFDOztRQUduQyxJQUFJLFFBQVEsRUFBRTtZQUNaLGNBQWMsR0FBRyxJQUFJLENBQUM7WUFDdEIsSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLEtBQUssV0FBVztnQkFDckYsb0JBQW9CLENBQUMsS0FBSyxDQUFDLElBQUksaUJBQW1CLEVBQUU7O2dCQUV0RCxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7YUFDL0M7U0FDRjtLQUNGOztJQUdELElBQUksQ0FBQyxJQUFJLHdCQUEwQixDQUFDLDBCQUE0QixJQUFJLE9BQU8sRUFBRTs7O1FBRzNFLFNBQVMsSUFBSSxVQUFVLENBQUMsbUJBQUMsS0FBYyxFQUFDLENBQUMsSUFBSSxFQUFFLDZDQUE2QyxDQUFDLENBQUM7UUFDOUYsbUJBQUMsS0FBcUIsRUFBQyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFDcEMsSUFBSSxpQkFBaUI7WUFBRSxtQkFBQyxLQUFjLEVBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7S0FDakU7SUFFRCxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFDNUIsUUFBUSxHQUFHLElBQUksQ0FBQztJQUNoQixPQUFPLElBQUksQ0FBQztDQUNiOzs7OztBQVVEO0lBQ0UsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNqQixvQkFBb0Isc0JBQUcsSUFBSSxFQUFFLENBQUM7Q0FDL0I7Ozs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSx5QkFDRixRQUFrQixFQUFFLFFBQThCLEVBQUUsT0FBVSxFQUM5RCx1QkFBeUMsRUFBRSxJQUF5QixFQUNwRSxVQUE2QyxFQUFFLEtBQW1DLEVBQ2xGLFNBQTRCO0lBQzlCLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtRQUNoQixxQkFBcUIsRUFBRSxDQUFDO1FBQ3hCLGVBQWUsR0FBRyx1QkFBdUIsQ0FBQztRQUMxQyx1QkFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLFVBQVUsSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO1FBQzVFLElBQUksR0FBRyxXQUFXLENBQ2QsSUFBSSxtQkFBcUIsUUFBUSxFQUFFLElBQUksRUFBRSxJQUFJLEVBQzdDLFdBQVcsQ0FDUCxDQUFDLENBQUMsRUFBRSx1QkFBdUIsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSx1QkFDL0MsU0FBUyxDQUFDLENBQUMsQ0FBQztLQUM3QztJQUNELHVCQUFNLFFBQVEsc0JBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0lBQzdCLFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLHNEQUFzRCxDQUFDLENBQUM7SUFDN0YseUJBQXlCLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0QsT0FBTyxJQUFJLENBQUM7Q0FDYjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLGlDQUNGLFFBQTBCLEVBQUUsS0FBWSxFQUFFLFFBQThCLEVBQUUsT0FBVSxFQUNwRixRQUFtQixFQUFFLFVBQW9DLEVBQ3pELEtBQTBCO0lBQzVCLHVCQUFNLFNBQVMsR0FBRyxRQUFRLENBQUM7SUFDM0IsdUJBQU0scUJBQXFCLEdBQUcsb0JBQW9CLENBQUM7SUFDbkQscUJBQUksT0FBYyxDQUFDO0lBQ25CLHFCQUFJLEVBQUUsaUJBQWtDLENBQUM7SUFDekMsSUFBSTtRQUNGLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDaEIsb0JBQW9CLHNCQUFHLElBQUksRUFBRSxDQUFDO1FBRTlCLElBQUksUUFBUSxJQUFJLElBQUksRUFBRTtZQUNwQix1QkFBTSxLQUFLLEdBQUcsV0FBVyxDQUNyQixDQUFDLENBQUMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxPQUFPLHVCQUEwQixtQkFBbUIsRUFBRSxDQUFDLENBQUM7WUFFM0YsUUFBUSxHQUFHLFdBQVcsQ0FBQyxJQUFJLGdCQUFrQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztZQUN0RSxFQUFFLGlCQUFxQixDQUFDO1NBQ3pCO1FBQ0QsT0FBTyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1FBQzdDLFFBQVEsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDdEIsSUFBSSxFQUFFLGlCQUFxQixFQUFFO1lBQzNCLFdBQVcsRUFBRSxDQUFDO1NBQ2Y7YUFBTTtZQUNMLFFBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLGlCQUFpQixHQUFHLEtBQUssQ0FBQztTQUNuRTtLQUNGO1lBQVM7OztRQUdSLHVCQUFNLGNBQWMsR0FBRyxDQUFDLEVBQUUsaUJBQXFCLENBQUMsbUJBQXVCLENBQUM7UUFDeEUsU0FBUyxvQkFBQyxPQUFPLElBQUksY0FBYyxDQUFDLENBQUM7UUFDckMsUUFBUSxHQUFHLFNBQVMsQ0FBQztRQUNyQixvQkFBb0IsR0FBRyxxQkFBcUIsQ0FBQztLQUM5QztJQUNELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7Ozs7QUFFRCxNQUFNLG9DQUNGLElBQWtCLEVBQUUsUUFBZSxFQUFFLGtCQUFxQixFQUFFLFFBQStCO0lBQzdGLHVCQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzFDLElBQUk7UUFDRixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUU7WUFDekIsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxRQUFRLEVBQUU7WUFDWixRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxxQkFBRSxrQkFBa0IsR0FBRyxDQUFDO1lBQ3pELFdBQVcsRUFBRSxDQUFDO1NBQ2Y7YUFBTTtZQUNMLDBCQUEwQixFQUFFLENBQUM7OztZQUk3QixlQUFlLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUN6QyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDeEI7S0FDRjtZQUFTO1FBQ1IsSUFBSSxlQUFlLENBQUMsR0FBRyxFQUFFO1lBQ3ZCLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUN2QjtRQUNELFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNwQjtDQUNGOzs7Ozs7Ozs7Ozs7QUFXRCx3QkFBd0IsSUFBVztJQUNqQyxPQUFPLElBQUksQ0FBQyxLQUFLLHVCQUEwQixDQUFDLENBQUMsQ0FBQywrQkFBdUMsQ0FBQyxDQUFDO3NCQUN2QixDQUFDO0NBQ2xFOzs7Ozs7Ozs7Ozs7OztBQWtCRCxNQUFNLHVCQUNGLEtBQWEsRUFBRSxJQUFZLEVBQUUsS0FBdUIsRUFBRSxTQUEyQjtJQUNuRixTQUFTO1FBQ0wsV0FBVyxDQUNQLFdBQVcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO0lBRTdGLFNBQVMsSUFBSSxTQUFTLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUMvQyx1QkFBTSxNQUFNLEdBQWEsUUFBUSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0RCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRTFDLHVCQUFNLElBQUksR0FDTixXQUFXLENBQUMsS0FBSyxzQ0FBcUIsTUFBTSxJQUFJLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBRS9FLElBQUksS0FBSztRQUFFLGVBQWUsQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUMsV0FBVyxvQkFBQyxJQUFJLENBQUMsTUFBTSxJQUFJLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNoRCx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDaEUsT0FBTyxNQUFNLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7QUFXRCxtQ0FDSSxLQUFhLEVBQUUsSUFBbUIsRUFBRSxLQUFrQyxFQUN0RSxTQUFzQyxFQUFFLFdBQW9CO0lBQzlELHVCQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQztJQUNsQyxJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLFNBQVMsSUFBSSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMzQyw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDO0tBQ2xGO1NBQU07UUFDTCw2QkFBNkIsRUFBRSxDQUFDO0tBQ2pDO0lBQ0Qsd0JBQXdCLEVBQUUsQ0FBQztDQUM1Qjs7Ozs7Ozs7OztBQU9ELHdDQUNJLEtBQVksRUFBRSxLQUFZLEVBQUUsU0FBMEI7O0lBRXhELHVCQUFNLFVBQVUsR0FBcUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDakYsdUJBQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxjQUFjLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkUsSUFBSSxPQUFPLEVBQUU7UUFDWCxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUMxQyx1QkFBTSxHQUFHLHFCQUFHLE9BQU8sQ0FBQyxDQUFDLENBQXNCLENBQUEsQ0FBQztZQUM1Qyx1QkFBTSxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztZQUN6QixnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRCxtQkFBbUIsbUJBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBVyxHQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNyRTtLQUNGO0lBQ0QsSUFBSSxVQUFVO1FBQUUsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztDQUN2RTs7Ozs7O0FBR0QsOEJBQThCLEtBQVk7SUFDeEMsdUJBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUM7SUFDckQscUJBQUksT0FBTyxHQUFlLElBQUksQ0FBQztJQUMvQixJQUFJLFFBQVEsRUFBRTtRQUNaLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4Qyx1QkFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hCLElBQUksMEJBQTBCLENBQUMsS0FBSyxxQkFBRSxHQUFHLENBQUMsU0FBUyxHQUFHLEVBQUU7Z0JBQ3RELElBQUksbUJBQUMsR0FBd0IsRUFBQyxDQUFDLFFBQVEsRUFBRTtvQkFDdkMsSUFBSSxLQUFLLENBQUMsS0FBSyx5QkFBeUI7d0JBQUUsMkJBQTJCLENBQUMsS0FBSyxDQUFDLENBQUM7b0JBQzdFLEtBQUssQ0FBQyxLQUFLLHlCQUF5QixDQUFDO2lCQUN0QztnQkFDRCxJQUFJLEdBQUcsQ0FBQyxRQUFRO29CQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7Z0JBQ3BDLENBQUMsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUM3QztTQUNGO0tBQ0Y7SUFDRCx5QkFBTyxPQUE2QixFQUFDO0NBQ3RDOzs7Ozs7OztBQUVELE1BQU0sMkJBQ0YsR0FBc0IsRUFBRSxVQUFrQixFQUFFLE9BQTJCLEVBQUUsS0FBWTtJQUN2RixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQztRQUMvQix1QkFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLE9BQU8sRUFBRSxDQUFDO1FBQy9CLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDeEQsT0FBTyxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxzQkFBRyxLQUFLLENBQUMsVUFBVSxHQUFHLE1BQU0sR0FBRyxDQUFDLEVBQUUsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQzVGO1NBQU0sSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssUUFBUSxFQUFFOztRQUUzQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdEM7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7QUFHRCxxQ0FBcUMsUUFBZ0I7SUFDbkQsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxJQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFDL0QsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3RDO0NBQ0Y7Ozs7OztBQUlELGtDQUFrQyxRQUFnQjtJQUNoRCxTQUFTO1FBQ0wsV0FBVyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO0lBQzFGLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxZQUFZLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxFQUNuRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7Q0FDdEM7Ozs7Ozs7O0FBR0QsTUFBTSx1Q0FDRixRQUEwQixFQUFFLFFBQWEsRUFBRSxJQUFXO0lBQ3hELElBQUksUUFBUSxJQUFJLFFBQVEsQ0FBQyxpQkFBaUIsSUFBSSxJQUFJLEVBQUU7UUFDbEQsbUJBQUMsUUFBUSxDQUFDLGlCQUFpQyxFQUFDLENBQUMsb0JBQW9CLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0tBQ25GO0NBQ0Y7Ozs7O0FBRUQsTUFBTSxzQkFBc0IsS0FBWTtJQUN0QyxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQXlCLENBQUMsMkJBQTJCLENBQUM7Q0FDMUU7Ozs7O0FBS0Q7SUFDRSx1QkFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDO0lBQ3pDLHVCQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxnQ0FBZ0MsQ0FBQztJQUUxRCxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7UUFDYix1QkFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7UUFDcEUsdUJBQU0sR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDMUIsdUJBQU0sV0FBVyxzQkFBRyxXQUFXLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxDQUFDO1FBRW5ELEtBQUsscUJBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hDLHVCQUFNLEdBQUcsR0FBc0IsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3hDO0tBQ0Y7Q0FDRjs7Ozs7Ozs7QUFHRCxpQ0FDSSxLQUFZLEVBQUUsU0FBMEIsRUFBRSxVQUFtQztJQUMvRSxJQUFJLFNBQVMsRUFBRTtRQUNiLHVCQUFNLFVBQVUsR0FBd0IsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFFLENBQUM7Ozs7UUFLOUQsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUMsdUJBQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0RixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QztLQUNGO0NBQ0Y7Ozs7Ozs7OztBQU1ELDZCQUNJLEtBQWEsRUFBRSxHQUF5QyxFQUN4RCxVQUEwQztJQUM1QyxJQUFJLFVBQVUsRUFBRTtRQUNkLElBQUksR0FBRyxDQUFDLFFBQVE7WUFBRSxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztRQUNuRCxJQUFJLG1CQUFDLEdBQXdCLEVBQUMsQ0FBQyxRQUFRO1lBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUNqRTtDQUNGOzs7Ozs7QUFNRDtJQUNFLHVCQUFNLFVBQVUsR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3pELElBQUksVUFBVSxFQUFFO1FBQ2QsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsdUJBQU0sS0FBSyxxQkFBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFBLENBQUM7WUFDMUMsdUJBQU0sS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsTUFBTSxDQUFDLENBQUMsb0JBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQyxDQUFDO1lBQy9FLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDbEI7S0FDRjtDQUNGOzs7Ozs7Ozs7O0FBV0QsMEJBQ0ksUUFBZ0MsRUFBRSxVQUE0QyxFQUM5RSxLQUFrQzs7Ozs7OztJQVFwQyxPQUFPLFFBQVEsQ0FBQyxhQUFhO1FBQ3pCLENBQUMsUUFBUSxDQUFDLGFBQWEscUJBQUcsV0FBVyxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQVUsQ0FBQSxDQUFDLENBQUM7Q0FDeEU7Ozs7Ozs7QUFHRCxNQUFNLHNCQUNGLElBQXNDLEVBQUUsS0FBa0M7SUFDNUUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQixPQUFPO1FBQ0wsSUFBSSxxQkFBRSxJQUFJLEVBQUU7UUFDWixJQUFJLEVBQUUsRUFBRTtRQUNSLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGlCQUFpQixFQUFFLElBQUk7UUFDdkIsU0FBUyxFQUFFLElBQUk7UUFDZixVQUFVLEVBQUUsSUFBSTtRQUNoQixZQUFZLEVBQUUsSUFBSTtRQUNsQixpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsY0FBYyxFQUFFLElBQUk7UUFDcEIsWUFBWSxFQUFFLElBQUk7UUFDbEIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixZQUFZLEVBQUUsSUFBSTtRQUNsQixVQUFVLEVBQUUsSUFBSTtRQUNoQixpQkFBaUIsRUFBRSxPQUFPLElBQUksS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQzdELFlBQVksRUFBRSxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLO1FBQzNELGNBQWMsRUFBRSxJQUFJO0tBQ3JCLENBQUM7Q0FDSDs7Ozs7O0FBRUQseUJBQXlCLE1BQWdCLEVBQUUsS0FBZTtJQUN4RCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO0lBRTlGLHVCQUFNLE1BQU0sR0FBRyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUM5QyxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN4Qyx1QkFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFCLElBQUksUUFBUSxLQUFLLHVCQUF1QixFQUFFO1lBQ3hDLHVCQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUM5QyxNQUFNLENBQUMsQ0FBQyxDQUFDLG1CQUFDLFFBQStCLEVBQUMsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUMzRSxNQUFNLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNqRDtLQUNGO0NBQ0Y7Ozs7OztBQUVELE1BQU0sc0JBQXNCLElBQVksRUFBRSxLQUFVO0lBQ2xELE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM3RDs7Ozs7Ozs7QUFRRCxNQUFNLDRCQUNGLE9BQXlCLEVBQUUsaUJBQW9DO0lBQ2pFLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ25DLGVBQWUsR0FBRyxPQUFPLENBQUM7SUFDMUIsdUJBQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzNELHVCQUFNLEtBQUssR0FBRyxPQUFPLGlCQUFpQixLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBQ2pELENBQUMsb0JBQW9CLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztZQUNuQyxlQUFlLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1lBQ3RELGVBQWUsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEQsaUJBQWlCLENBQUM7SUFDdEIsSUFBSSxTQUFTLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDdkIsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtZQUN6QyxNQUFNLFdBQVcsQ0FBQyxvQ0FBb0MsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQzVFO2FBQU07WUFDTCxNQUFNLFdBQVcsQ0FBQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQ2hFO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztDQUNkOzs7Ozs7Ozs7OztBQVVELE1BQU0sc0JBQ0YsR0FBVyxFQUFFLEtBQXNCLEVBQUUsR0FBc0IsRUFDM0QsU0FBNEI7SUFDOUIscUJBQXFCLEVBQUUsQ0FBQztJQUN4Qix1QkFBTSxJQUFJLEdBQUcsV0FBVyxDQUNwQixDQUFDLG1CQUFxQixLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFDdkMsV0FBVyxDQUNQLENBQUMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQ3pGLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFrQixDQUFDLG9CQUF1QixFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7SUFFNUUsSUFBSSxpQkFBaUIsRUFBRTtRQUNyQixJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUsseUJBQXlCLENBQUM7UUFDMUMsSUFBSSxHQUFHLENBQUMsUUFBUTtZQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDcEMsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN0QztJQUVELE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7Ozs7Ozs7OztBQWFELE1BQU0sbUJBQ0YsU0FBaUIsRUFBRSxVQUE0QixFQUFFLFVBQVUsR0FBRyxLQUFLO0lBQ3JFLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RDLHVCQUFNLElBQUksR0FBRyxvQkFBb0IsQ0FBQztJQUNsQyx1QkFBTSxNQUFNLHFCQUFHLElBQUksQ0FBQyxNQUFrQixDQUFBLENBQUM7OztJQUl2Qyx1QkFBTSxVQUFVLEdBQUcsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDbkUsU0FBUyxJQUFJLFNBQVMsQ0FBQyx3QkFBd0IsRUFBRSxDQUFDO0lBQ2xELElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsdUJBQU0sZUFBZSxHQUFHLDBCQUEwQixDQUFDLFdBQVcsRUFBRSxVQUFVLENBQUMsQ0FBQztRQUM1RSx1QkFBTSxTQUFTLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RFLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2xDO1NBQU07UUFDTCx1QkFBTSxlQUFlLEdBQUcsK0JBQStCLENBQUMsV0FBVyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2pGLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBQ2hFLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDakU7SUFFRCxxQkFBSSxLQUFLLEdBQWUsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUNuQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssU0FBUyxFQUFFOzs7UUFHL0IsS0FBSyxDQUFDLE9BQU8sR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssaUJBQTBCLENBQUM7S0FDcEY7SUFFRCx1QkFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUM5QixxQkFBSSxVQUF3QyxDQUFDO0lBQzdDLElBQUksT0FBTyxJQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFO1FBQ2hELFlBQVksQ0FBQyxVQUFVLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdEM7Q0FDRjs7Ozs7Ozs7QUFNRCxzQkFBc0IsT0FBMkIsRUFBRSxRQUFrQjtJQUNuRSxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMxQyxTQUFTLElBQUksaUJBQWlCLG1CQUFDLE9BQU8sQ0FBQyxDQUFDLENBQVcsc0JBQUUsVUFBVSxHQUFHLENBQUM7UUFDbkUsdUJBQU0sWUFBWSxzQkFBRyxVQUFVLHFCQUFHLE9BQU8sQ0FBQyxDQUFDLENBQVcsR0FBRSxPQUFPLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQztVQUM1RixPQUFPLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsWUFBWTtLQUN0RDtDQUNGOzs7OztBQUdELE1BQU07SUFDSixJQUFJLFFBQVEsRUFBRTtRQUNaLFFBQVEsR0FBRyxLQUFLLENBQUM7S0FDbEI7U0FBTTtRQUNMLFNBQVMsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUMvQixvQkFBb0Isc0JBQUcsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDdEQ7SUFDRCxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixrQkFBb0IsQ0FBQztJQUNyRSx1QkFBTSxPQUFPLEdBQUcsb0JBQW9CLENBQUMsT0FBTyxDQUFDO0lBQzdDLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUM7SUFDakQsbUJBQW1CLENBQUMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxXQUFXLENBQUMsQ0FBQztDQUNwRTs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLDJCQUNGLEtBQWEsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLFNBQXVCO0lBQ2xFLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2Qix1QkFBTSxPQUFPLEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMxQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDakIsU0FBUyxJQUFJLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1lBQ2pELG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztnQkFDaEQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkU7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsb0JBQW9CLEVBQUUsQ0FBQztZQUM5Qyx1QkFBTSxRQUFRLEdBQUcsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDekUsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDdkQsT0FBTyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQzlFO0tBQ0Y7Q0FDRjs7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxNQUFNLDBCQUNGLEtBQWEsRUFBRSxRQUFnQixFQUFFLEtBQW9CLEVBQUUsU0FBdUI7SUFDaEYsSUFBSSxLQUFLLEtBQUssU0FBUztRQUFFLE9BQU87SUFDaEMsdUJBQU0sSUFBSSxxQkFBRyxJQUFJLENBQUMsS0FBSyxDQUFpQixDQUFBLENBQUM7SUFDekMsdUJBQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7OztJQUd6QixJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTs7UUFFdkMsS0FBSyxDQUFDLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssZ0JBQXlCLENBQUM7S0FDbEY7SUFFRCx1QkFBTSxTQUFTLEdBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDeEMscUJBQUksU0FBdUMsQ0FBQztJQUM1QyxJQUFJLFNBQVMsSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtRQUNsRCxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDdkMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDekI7U0FBTTs7O1FBR0wsS0FBSyxHQUFHLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLG1CQUFDLFNBQVMsQ0FBQyxLQUFLLENBQVEsRUFBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDOUQsdUJBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7UUFDM0IsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1FBQzdDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztZQUMvQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLG1CQUFDLE1BQWEsRUFBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDO0tBQzNGO0NBQ0Y7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxzQkFDRixJQUFlLEVBQUUsS0FBb0IsRUFBRSxPQUFzQixFQUFFLEtBQXNCLEVBQ3JGLE1BQXNCO0lBQ3hCLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsT0FBTztRQUNMLElBQUksRUFBRSxJQUFJO1FBQ1YsS0FBSyxFQUFFLEtBQUs7UUFDWixLQUFLLEVBQUUsQ0FBQztRQUNSLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLEtBQUssRUFBRSxLQUFLO1FBQ1osVUFBVSxFQUFFLElBQUk7UUFDaEIsYUFBYSxFQUFFLFNBQVM7UUFDeEIsTUFBTSxFQUFFLFNBQVM7UUFDakIsT0FBTyxFQUFFLFNBQVM7UUFDbEIsTUFBTSxFQUFFLE1BQU07UUFDZCxJQUFJLEVBQUUsSUFBSTtRQUNWLEtBQUssRUFBRSxJQUFJO1FBQ1gsb0JBQW9CLEVBQUUsSUFBSTtLQUMzQixDQUFDO0NBQ0g7Ozs7Ozs7O0FBTUQsOEJBQThCLE1BQTBCLEVBQUUsS0FBVTtJQUNsRSxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUN6QyxTQUFTLElBQUksaUJBQWlCLG1CQUFDLE1BQU0sQ0FBQyxDQUFDLENBQVcsc0JBQUUsVUFBVSxHQUFHLENBQUM7VUFDbEUsVUFBVSxxQkFBRyxNQUFNLENBQUMsQ0FBQyxDQUFXLEdBQUUsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxLQUFLO0tBQ3pEO0NBQ0Y7Ozs7Ozs7O0FBU0QsaUNBQ0ksVUFBc0IsRUFBRSxTQUEyQjtJQUNyRCx1QkFBTSxLQUFLLEdBQUcsVUFBVSxnQ0FBZ0MsQ0FBQztJQUN6RCxxQkFBSSxTQUFTLEdBQXlCLElBQUksQ0FBQztJQUUzQyxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7UUFDYix1QkFBTSxLQUFLLEdBQUcsVUFBVSx3Q0FBMEMsQ0FBQztRQUNuRSx1QkFBTSxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUMxQix1QkFBTSxPQUFPLEdBQUcsU0FBUyxrQkFBMkIsQ0FBQztRQUNyRCx1QkFBTSxJQUFJLHNCQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsVUFBVSxFQUFFLENBQUM7UUFFNUMsS0FBSyxxQkFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEMsdUJBQU0sWUFBWSxxQkFBRyxJQUFJLENBQUMsQ0FBQyxDQUFzQixDQUFBLENBQUM7WUFDbEQsdUJBQU0sZ0JBQWdCLEdBQ2xCLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQztZQUN6RCxLQUFLLHFCQUFJLFVBQVUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDdkMsSUFBSSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQy9DLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBRSxDQUFDO29CQUM1Qix1QkFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQ2xELHVCQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO29CQUN6RCxXQUFXLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7d0JBQzdDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7aUJBQzNEO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7Q0FDbEI7Ozs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLDRCQUErQixLQUFhLEVBQUUsU0FBaUIsRUFBRSxLQUFvQjtJQUN6RixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDdkIsdUJBQU0sUUFBUSxxQkFBRyxJQUFJLENBQUMsS0FBSyxDQUFpQixDQUFBLENBQUM7UUFDN0MsSUFBSSxLQUFLLEVBQUU7WUFDVCxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDO2dCQUMvQyxRQUFRLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7U0FFM0U7YUFBTTtZQUNMLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztZQUM3QyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELFFBQVEsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUM5RTtLQUNGO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sdUJBQTBCLEtBQWEsRUFBRSxLQUFvQjtJQUNqRSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7Ozs7UUFJdkIsdUJBQU0sUUFBUSxHQUFpQixJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzlDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDM0QsUUFBUSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEY7Q0FDRjs7Ozs7Ozs7O0FBaUJELE1BQU0sNEJBQ0YsS0FBYSxFQUFFLFNBQWlCLEVBQUUsS0FBb0IsRUFDdEQsaUJBQXdDO0lBQzFDLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUN2Qix1QkFBTSxRQUFRLEdBQWlCLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQyxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDakIsU0FBUyxJQUFJLFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1lBQzdDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxTQUFTLEVBQUUsbUJBQW1CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDaEYsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDeEQ7YUFBTTtZQUNMLHFCQUFJLFFBQVEsR0FDUixPQUFPLGlCQUFpQixJQUFJLFVBQVUsQ0FBQyxDQUFDLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN6RixJQUFJLE9BQU8saUJBQWlCLElBQUksUUFBUTtnQkFBRSxRQUFRLEdBQUcsUUFBUSxHQUFHLGlCQUFpQixDQUFDO1lBQ2xGLFNBQVMsSUFBSSxTQUFTLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztZQUMxQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxtQkFBbUIsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUN2RixRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDL0Q7S0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7O0FBZUQsTUFBTSx1QkFDRixLQUFhLEVBQUUsS0FBNkM7SUFDOUQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFOzs7UUFHdkIsdUJBQU0sUUFBUSxxQkFBRyxJQUFJLENBQUMsS0FBSyxDQUFpQixDQUFBLENBQUM7UUFDN0MsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxTQUFTLElBQUksU0FBUyxDQUFDLGdCQUFnQixFQUFFLENBQUM7WUFDMUMsUUFBUSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN2RDthQUFNO1lBQ0wsdUJBQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7WUFDdkMsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxtQkFBRSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDL0QsdUJBQU0sU0FBUyxHQUFXLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDbEMsdUJBQU0sVUFBVSxHQUFRLG1CQUFDLEtBQVksRUFBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUNsRCxJQUFJLFVBQVUsSUFBSSxJQUFJLEVBQUU7b0JBQ3RCLFNBQVMsSUFBSSxTQUFTLENBQUMsbUJBQW1CLEVBQUUsQ0FBQztvQkFDN0MsS0FBSyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztpQkFDakM7cUJBQU07b0JBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO29CQUMxQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztpQkFDMUM7YUFDRjtTQUNGO0tBQ0Y7Q0FDRjs7Ozs7Ozs7QUFjRCxNQUFNLGVBQWUsS0FBYSxFQUFFLEtBQVc7SUFDN0MsU0FBUztRQUNMLFdBQVcsQ0FDUCxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsOENBQThDLENBQUMsQ0FBQztJQUMzRixTQUFTLElBQUksU0FBUyxDQUFDLHNCQUFzQixFQUFFLENBQUM7SUFDaEQsdUJBQU0sUUFBUSxHQUFHLGNBQWMsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDakQsdUJBQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxLQUFLLG1CQUFxQixRQUFRLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDOztJQUd6RSxRQUFRLEdBQUcsS0FBSyxDQUFDO0lBQ2pCLFdBQVcsb0JBQUMsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLEVBQUUsV0FBVyxDQUFDLENBQUM7Q0FDbkQ7Ozs7Ozs7Ozs7QUFTRCxNQUFNLHNCQUF5QixLQUFhLEVBQUUsS0FBb0I7SUFDaEUsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RDLHFCQUFJLFlBQVkscUJBQUcsSUFBSSxDQUFDLEtBQUssQ0FBYyxDQUFBLENBQUM7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxZQUFZLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztJQUMvRCxTQUFTLElBQUksYUFBYSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUMvRSxTQUFTLElBQUksU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLEtBQUssS0FBSyxTQUFTO1FBQ2YsQ0FBQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxZQUFZLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUQsWUFBWSxDQUFDLE1BQU0sQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7Q0FDM0Y7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNLDBCQUNGLEtBQWEsRUFBRSxTQUFZLEVBQUUsWUFBOEM7SUFDN0UsdUJBQU0sUUFBUSxHQUFHLG1CQUFtQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsWUFBWSxDQUFDLENBQUM7SUFFckUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUNyRix1QkFBTSxLQUFLLEdBQUcsb0JBQW9CLENBQUMsS0FBSyxDQUFDO0lBRXpDLHVCQUFNLFdBQVcsR0FBRyxtQkFBQyxZQUErQixFQUFDLENBQUMsUUFBUSxDQUFDO0lBQy9ELElBQUksV0FBVyxFQUFFO1FBQ2YsaUJBQWlCLENBQUMsS0FBSyxFQUFFLFNBQVMsb0JBQUUsWUFBK0IsRUFBQyxDQUFDO0tBQ3RFO0lBRUQsSUFBSSxpQkFBaUIsRUFBRTs7O1FBR3JCLGNBQWMsQ0FBQyxLQUFLLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxZQUFZLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUVwRixJQUFJLFlBQVksQ0FBQyxZQUFZO1lBQUUsd0JBQXdCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDaEU7SUFFRCxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxFQUFFO1FBQ3hCLGtCQUFrQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNqRTtJQUVELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7OztBQUVELDJCQUE4QixLQUFhLEVBQUUsUUFBVyxFQUFFLEdBQW9CO0lBQzVFLHVCQUFNLEtBQUssR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7SUFJOUUsdUJBQU0sUUFBUSxHQUFHLGFBQWEsQ0FDMUIsV0FBVyxFQUFFLFdBQVcsQ0FDUCxDQUFDLENBQUMsRUFBRSxlQUFlLENBQUMsY0FBYyxtQkFDMUIsb0JBQW9CLENBQUMsTUFBa0IsR0FBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQ2xFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxlQUFrQixDQUFDLG9CQUF1QixFQUN6RSxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQzs7O0lBSTdDLG1CQUFDLG9CQUFvQyxFQUFDLENBQUMsSUFBSSxHQUFHLFFBQVEsQ0FBQztJQUN2RCxtQkFBQyxRQUF3QixFQUFDLENBQUMsSUFBSSxHQUFHLG9CQUFvQixDQUFDO0lBQ3ZELElBQUksaUJBQWlCO1FBQUUsS0FBSyxDQUFDLElBQUksR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUM7SUFFL0QsNEJBQTRCLENBQUMsb0JBQW9CLENBQUMsWUFBWSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsQ0FBQztJQUVwRixJQUFJLGlCQUFpQjtRQUFFLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQzNEOzs7Ozs7Ozs7Ozs7QUFRRCxNQUFNLDhCQUNGLEtBQWEsRUFBRSxTQUFZLEVBQUUsWUFBOEM7SUFDN0UsU0FBUztRQUNMLFdBQVcsQ0FDUCxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQUUsa0RBQWtELENBQUMsQ0FBQztJQUMvRixTQUFTLElBQUksc0JBQXNCLEVBQUUsQ0FBQztJQUV0QyxNQUFNLENBQUMsY0FBYyxDQUNqQixTQUFTLEVBQUUsY0FBYyxFQUFFLEVBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUMsQ0FBQyxDQUFDO0lBRWpGLElBQUksVUFBVSxJQUFJLElBQUk7UUFBRSxXQUFXLENBQUMsVUFBVSxHQUFHLFVBQVUsR0FBRyxFQUFFLENBQUM7SUFFakUsU0FBUyxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7SUFDL0MsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUU5QixJQUFJLGlCQUFpQixFQUFFO1FBQ3JCLHVCQUFNLEtBQUssR0FBRyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQy9DLElBQUksQ0FBQyxLQUFLLGdDQUFnQyxDQUFDLEtBQUssQ0FBQyxFQUFFOzs7O1lBSWpELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLO2dCQUM1QixLQUFLLHdDQUEwQyxHQUFHLEtBQUsseUJBQXlCLEdBQUcsQ0FBQyxDQUFDO1NBQzFGO2FBQU07O1lBRUwsU0FBUyxJQUFJLGNBQWMsQ0FDVixLQUFLLGdDQUFnQyxpQ0FDckMsc0NBQXNDLENBQUMsQ0FBQztZQUN6RCxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDcEM7S0FDRjtTQUFNO1FBQ0wsdUJBQU0sUUFBUSxzQkFBRyxZQUFZLEdBQUcsUUFBUSxDQUFDO1FBQ3pDLElBQUksUUFBUTtZQUFFLFFBQVEsb0JBQUMsWUFBWSxHQUFHLENBQUM7S0FDeEM7SUFFRCx1QkFBSSxZQUFZLEdBQUcsVUFBVSxJQUFJLElBQUksSUFBSSxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxtQkFBcUIsRUFBRTtRQUM3RixlQUFlLENBQ1gsbUJBQUMsb0JBQW9DLEVBQUMsQ0FBQyxNQUFNLHNCQUFFLFlBQVksR0FBRyxVQUFVLEVBQWEsQ0FBQztLQUMzRjtJQUVELE9BQU8sU0FBUyxDQUFDO0NBQ2xCOzs7Ozs7Ozs7OztBQVVELDRCQUNJLGNBQXNCLEVBQUUsUUFBVyxFQUFFLE1BQStCLEVBQUUsS0FBWTtJQUNwRixxQkFBSSxnQkFBZ0IscUJBQUcsS0FBSyxDQUFDLGFBQTZDLENBQUEsQ0FBQztJQUMzRSxJQUFJLGdCQUFnQixLQUFLLFNBQVMsSUFBSSxjQUFjLElBQUksZ0JBQWdCLENBQUMsTUFBTSxFQUFFO1FBQy9FLGdCQUFnQixHQUFHLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDekU7SUFFRCx1QkFBTSxhQUFhLEdBQXVCLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzNFLElBQUksYUFBYSxFQUFFO1FBQ2pCLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2hELG1CQUFDLFFBQWUsRUFBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDNUQ7S0FDRjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCwrQkFDSSxjQUFzQixFQUFFLE1BQStCLEVBQUUsS0FBWTtJQUN2RSx1QkFBTSxnQkFBZ0IsR0FBcUIsS0FBSyxDQUFDLGFBQWEsSUFBSSxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDN0YsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBRXhDLHVCQUFNLEtBQUssc0JBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQzVCLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQ3hDLHVCQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsdUJBQU0saUJBQWlCLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzNDLElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFO1lBQ25DLHVCQUFNLGFBQWEsR0FDZixnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLGFBQWEsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ3JEO0tBQ0Y7SUFDRCxPQUFPLGdCQUFnQixDQUFDO0NBQ3pCOzs7Ozs7O0FBTUQsTUFBTSwyQkFDRixXQUFrQixFQUFFLFdBQWtCLEVBQUUsUUFBaUM7SUFDM0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxXQUFXLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztJQUMzRSx5QkFBbUI7UUFDakIsS0FBSyxFQUFFLEVBQUU7UUFDVCxTQUFTLEVBQUUsQ0FBQzs7O1FBR1osWUFBWSxFQUFFLG1CQUFtQixDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxJQUFJO1FBQ2hGLFFBQVEsRUFBRSxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVE7UUFDNUMsSUFBSSxFQUFFLElBQUk7UUFDVixNQUFNLEVBQUUsV0FBVztRQUNuQixnQkFBZ0IsRUFBRSxDQUFDO1FBQ25CLE9BQU8sRUFBRSxJQUFJO0tBQ2QsRUFBQztDQUNIOzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxvQkFDRixLQUFhLEVBQUUsUUFBaUMsRUFBRSxPQUF1QixFQUFFLEtBQWdCLEVBQzNGLFNBQTJCO0lBQzdCLFNBQVMsSUFBSSxXQUFXLENBQ1AsV0FBVyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxFQUNqQyx1REFBdUQsQ0FBQyxDQUFDO0lBRTFFLHVCQUFNLGFBQWEsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLG9CQUFvQixDQUFDLENBQUMsb0JBQUMsb0JBQW9CLENBQUMsTUFBTSxFQUFFLENBQUM7SUFDdEYsdUJBQU0sVUFBVSxHQUFHLGdCQUFnQixDQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFMUUsdUJBQU0sSUFBSSxHQUFHLFdBQVcsQ0FDcEIsS0FBSyxxQkFBdUIsU0FBUyxFQUFFLE9BQU8sSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQztJQUV2RixJQUFJLGlCQUFpQixJQUFJLFFBQVEsSUFBSSxJQUFJO1FBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDOzs7SUFJbEUsYUFBYSxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdEMseUJBQXlCLENBQUMsS0FBSyxFQUFFLE9BQU8sSUFBSSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLElBQUksSUFBSSxDQUFDLENBQUM7SUFFdEYsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNqQixTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixvQkFBc0IsQ0FBQztJQUN2RSx1QkFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQztJQUM3QixJQUFJLE9BQU8sRUFBRTs7UUFFWCxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDOztRQUV0QixVQUFVLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxTQUFTLEVBQUUsQ0FBQztLQUMxQztDQUNGOzs7Ozs7O0FBT0QsTUFBTSxnQ0FBZ0MsS0FBYTtJQUNqRCxTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDdEMsb0JBQW9CLHFCQUFHLElBQUksQ0FBQyxLQUFLLENBQVUsQ0FBQSxDQUFDO0lBQzVDLFNBQVMsSUFBSSxjQUFjLENBQUMsb0JBQW9CLG9CQUFzQixDQUFDO0lBQ3ZFLFFBQVEsR0FBRyxJQUFJLENBQUM7SUFDaEIsbUJBQUMsb0JBQXNDLEVBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztJQUM1RCxTQUFTLElBQUksVUFBVSxDQUNOLG1CQUFDLG9CQUFzQyxFQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFDMUQsOERBQThELENBQUMsQ0FBQztJQUVqRixJQUFJLENBQUMsa0JBQWtCLEVBQUU7OztRQUd2QixnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsV0FBVyxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQztLQUNoRTtDQUNGOzs7Ozs7O0FBT0QsTUFBTTtJQUNKLElBQUksUUFBUSxFQUFFO1FBQ1osUUFBUSxHQUFHLEtBQUssQ0FBQztLQUNsQjtTQUFNO1FBQ0wsU0FBUyxJQUFJLGNBQWMsQ0FBQyxvQkFBb0IsZUFBaUIsQ0FBQztRQUNsRSxTQUFTLElBQUksZUFBZSxFQUFFLENBQUM7UUFDL0Isb0JBQW9CLHNCQUFHLG9CQUFvQixDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ3REO0lBQ0QsU0FBUyxJQUFJLGNBQWMsQ0FBQyxvQkFBb0Isb0JBQXNCLENBQUM7SUFDdkUsdUJBQU0sU0FBUyxxQkFBRyxvQkFBc0MsQ0FBQSxDQUFDO0lBQ3pELFNBQVMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO0lBQzdCLFNBQVMsSUFBSSxjQUFjLENBQUMsU0FBUyxvQkFBc0IsQ0FBQztJQUM1RCx1QkFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7O0lBRzNDLE9BQU8sU0FBUyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUM5QyxVQUFVLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ2xDO0NBQ0Y7Ozs7QUFFRDtJQUNFLEtBQUsscUJBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxLQUFLLElBQUksRUFBRSxPQUFPLEdBQUcsT0FBTyxDQUFDLElBQUksRUFBRTtRQUM5RSxJQUFJLE9BQU8sQ0FBQyxnQkFBZ0IsS0FBSyxDQUFDLElBQUksbUJBQUMsT0FBcUIsRUFBQyxDQUFDLEtBQUssRUFBRTtZQUNuRSx1QkFBTSxTQUFTLHFCQUFHLE9BQXFCLENBQUEsQ0FBQztZQUN4QyxLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUMvQyx1QkFBTSxTQUFTLEdBQUcsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Z0JBRXJDLHVCQUFNLFdBQVcsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDO2dCQUNuQyxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDekUsc0JBQXNCLENBQ2xCLFNBQVMsRUFBRSxXQUFXLENBQUMsS0FBSyxxQkFBRSxXQUFXLENBQUMsUUFBUSx1QkFBSSxXQUFXLENBQUMsT0FBTyxJQUFJLFFBQVEsQ0FBQyxDQUFDO2FBQzVGO1NBQ0Y7S0FDRjtDQUNGOzs7Ozs7Ozs7O0FBV0QscUJBQ0ksYUFBNkIsRUFBRSxRQUFnQixFQUFFLFdBQW1CO0lBQ3RFLHVCQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN2QyxLQUFLLHFCQUFJLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDNUMsdUJBQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDMUMsSUFBSSxnQkFBZ0IsS0FBSyxXQUFXLEVBQUU7WUFDcEMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDakI7YUFBTSxJQUFJLGdCQUFnQixHQUFHLFdBQVcsRUFBRTs7WUFFekMsVUFBVSxDQUFDLGFBQWEsRUFBRSxDQUFDLENBQUMsQ0FBQztTQUM5QjthQUFNOzs7O1lBSUwsTUFBTTtTQUNQO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztDQUNiOzs7Ozs7O0FBUUQsTUFBTSw0QkFBNEIsV0FBbUI7SUFDbkQsdUJBQU0sU0FBUyxxQkFDWCxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxvQkFBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsQ0FBbUIsQ0FBQSxDQUFDO0lBQ3hGLFNBQVMsSUFBSSxjQUFjLENBQUMsU0FBUyxvQkFBc0IsQ0FBQztJQUM1RCx1QkFBTSxVQUFVLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztJQUNsQyxxQkFBSSxRQUFRLEdBQW1CLFdBQVcsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUV6RixJQUFJLFFBQVEsRUFBRTtRQUNaLG9CQUFvQixHQUFHLFFBQVEsQ0FBQztRQUNoQyxTQUFTLElBQUksY0FBYyxDQUFDLG9CQUFvQixlQUFpQixDQUFDO1FBQ2xFLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDaEIsU0FBUyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7S0FDcEM7U0FBTTs7UUFFTCx1QkFBTSxPQUFPLEdBQUcsV0FBVyxDQUN2QixXQUFXLEVBQUUsUUFBUSxFQUFFLHdCQUF3QixDQUFDLFdBQVcsRUFBRSxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSx1QkFDM0QsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDO1FBQ25ELElBQUksVUFBVSxDQUFDLE9BQU8sRUFBRTtZQUN0QixPQUFPLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUN0RTtRQUVELFNBQVMsQ0FDTCxPQUFPLEVBQUUsUUFBUSxHQUFHLFdBQVcsQ0FBQyxXQUFXLGdCQUFrQixJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQzlGO0lBQ0QsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3RDOzs7Ozs7Ozs7Ozs7QUFhRCxrQ0FBa0MsU0FBaUIsRUFBRSxNQUFzQjtJQUN6RSxTQUFTLElBQUksY0FBYyxDQUFDLE1BQU0sb0JBQXNCLENBQUM7SUFDekQsdUJBQU0sZUFBZSxxQkFBRyxxQkFBQyxNQUFNLEdBQUcsS0FBSyxFQUFtQixDQUFDLE1BQWlCLENBQUEsQ0FBQztJQUM3RSxTQUFTLElBQUksYUFBYSxDQUFDLGVBQWUsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0lBQzlELFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxlQUFlLENBQUMsRUFBRSxJQUFJLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUMvRixJQUFJLFNBQVMsSUFBSSxlQUFlLENBQUMsTUFBTSxJQUFJLGVBQWUsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDN0UsdUJBQU0sS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUM7UUFDaEMsZUFBZSxDQUFDLFNBQVMsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsS0FBSyxDQUFDLFlBQVksQ0FBQyxDQUFDO0tBQ3ZGO0lBQ0QsT0FBTyxlQUFlLENBQUMsU0FBUyxDQUFDLENBQUM7Q0FDbkM7Ozs7O0FBR0QsTUFBTTtJQUNKLFdBQVcsRUFBRSxDQUFDO0lBQ2QsUUFBUSxHQUFHLEtBQUssQ0FBQztJQUNqQix1QkFBTSxRQUFRLEdBQUcsb0JBQW9CLHFCQUFHLFdBQVcsQ0FBQyxJQUFpQixDQUFBLENBQUM7SUFDdEUsdUJBQU0sYUFBYSxxQkFBRyxvQkFBb0IsQ0FBQyxNQUF3QixDQUFBLENBQUM7SUFDcEUsSUFBSSxhQUFhLEVBQUU7UUFDakIsU0FBUyxJQUFJLGNBQWMsQ0FBQyxRQUFRLGVBQWlCLENBQUM7UUFDdEQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxhQUFhLG9CQUFzQixDQUFDO1FBQ2hFLHVCQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDO1FBRXRDLElBQUksWUFBWSxFQUFFOzs7WUFHaEIsK0JBQStCLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxRQUFRLENBQUMsQ0FBQzs7WUFFbkUsVUFBVSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzNEO1FBRUQsVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO0tBQ3hCO0lBQ0QsU0FBUyx1Q0FBQyxXQUFXLEdBQUcsTUFBTSxHQUFHLENBQUM7SUFDbEMsU0FBUyxJQUFJLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ3RELFNBQVMsSUFBSSxjQUFjLENBQUMsb0JBQW9CLGVBQWlCLENBQUM7Q0FDbkU7Ozs7Ozs7O0FBUUQseUNBQ0ksWUFBaUMsRUFBRSxRQUFtQjtJQUN4RCxJQUFJLFlBQVksSUFBSSxJQUFJLEVBQUU7UUFDeEIscUJBQUksSUFBSSxHQUFlLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvQyxPQUFPLElBQUksRUFBRTtZQUNYLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFO2dCQUM1QyxxQkFBSSxhQUFhLEdBQWUsbUJBQUMsSUFBdUIsRUFBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7Z0JBQ3BFLHVCQUFNLGlCQUFpQixHQUFHLG1CQUFDLElBQXVCLEVBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDO2dCQUM5RCxPQUFPLGFBQWEsRUFBRTtvQkFDcEIsSUFBSSxhQUFhLENBQUMscUJBQXFCLEVBQUU7d0JBQ3ZDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQztxQkFDdEU7b0JBQ0QsYUFBYSxHQUFHLGFBQWEsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxhQUFhLENBQUMsYUFBYSxDQUFDO2lCQUMxRjthQUNGO1lBQ0QsSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQjtLQUNGO0NBQ0Y7Ozs7Ozs7OztBQVVELE1BQU0sMkJBQThCLGNBQXNCLEVBQUUsWUFBb0I7SUFDOUUsU0FBUyxJQUFJLGlCQUFpQixDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQzdDLHVCQUFNLE9BQU8sdUJBQUcsSUFBSSxHQUFHLFlBQVksRUFBaUIsQ0FBQztJQUNyRCxTQUFTLElBQUksY0FBYyxDQUFDLE9BQU8sa0JBQW9CLENBQUM7SUFDeEQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLHNEQUFzRCxDQUFDLENBQUM7SUFDakcsdUJBQU0sUUFBUSxzQkFBRyxPQUFPLENBQUMsSUFBSSxFQUFFLENBQUM7O0lBR2hDLElBQUksWUFBWSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFFBQVEsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxtQ0FBeUMsQ0FBQyxFQUFFO1FBQzFGLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxjQUFjLHFCQUFFLFVBQVUsR0FBRyxDQUFDO1FBQzdELHVCQUFNLEdBQUcsdUJBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsY0FBYyxFQUFvQixDQUFDO1FBRTlFLHFCQUFxQixDQUNqQixRQUFRLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxvQkFBb0Isb0JBQUMsVUFBVSxHQUFHLGNBQWMsRUFBRSxDQUFDLENBQUM7S0FDakY7Q0FDRjs7Ozs7O0FBR0Qsc0JBQXNCLElBQVc7SUFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLG1CQUFzQixDQUFDLHFCQUF3QixDQUFDO0NBQ25FOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUF1QkQsTUFBTSx3QkFDRixLQUFhLEVBQUUsU0FBNkIsRUFBRSxhQUF3QjtJQUN4RSx1QkFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQzdELHVCQUFNLGdCQUFnQixHQUFHLElBQUksS0FBSyxDQUFVLGVBQWUsQ0FBQyxDQUFDO0lBQzdELEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUMxQjtJQUVELHVCQUFNLGFBQWEsR0FBaUIsaUJBQWlCLENBQUMsV0FBVyxDQUFDLENBQUM7SUFDbkUscUJBQUksY0FBYyxHQUFlLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUU5RCxPQUFPLGNBQWMsS0FBSyxJQUFJLEVBQUU7Ozs7UUFJOUIsSUFBSSxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRTtZQUNyQyx1QkFBTSxVQUFVLEdBQUcscUJBQXFCLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLHFCQUFFLGFBQWEsR0FBRyxDQUFDO1lBQzNGLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztTQUNuRDthQUFNO1lBQ0wsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO1NBQzFDO1FBRUQsY0FBYyxHQUFHLFlBQVksQ0FBQyxjQUFjLENBQUMsQ0FBQztLQUMvQztJQUVELFNBQVMsSUFBSSxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLGdCQUFnQixDQUFDO0NBQ2hDOzs7Ozs7Ozs7QUFTRCxnQ0FDSSxjQUErQixFQUMvQixhQUErRCxFQUMvRCxZQUE4RDtJQUNoRSxTQUFTLElBQUksV0FBVyxDQUNQLENBQUMsQ0FBQyxhQUFhLEVBQUUsQ0FBQyxDQUFDLFlBQVksRUFDL0Isb0VBQW9FLENBQUMsQ0FBQztJQUN2RixJQUFJLENBQUMsWUFBWSxFQUFFOztRQUVqQixPQUFPO0tBQ1I7SUFDRCx1QkFBTSxrQkFBa0IsR0FBRyxjQUFjLENBQUMsSUFBSSxDQUFDO0lBQy9DLElBQUksa0JBQWtCLENBQUMsSUFBSSxFQUFFO1FBQzNCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO0tBQ3ZEO1NBQU07UUFDTCxrQkFBa0IsQ0FBQyxJQUFJLEdBQUcsYUFBYSxDQUFDO0tBQ3pDO0lBQ0Qsa0JBQWtCLENBQUMsSUFBSSxHQUFHLFlBQVksQ0FBQztJQUN2QyxZQUFZLENBQUMsYUFBYSxHQUFHLGNBQWMsQ0FBQztDQUM3Qzs7Ozs7Ozs7Ozs7QUFZRCxNQUFNLHFCQUNGLFNBQWlCLEVBQUUsVUFBa0IsRUFBRSxnQkFBd0IsQ0FBQyxFQUFFLEtBQWdCO0lBQ3BGLHVCQUFNLElBQUksR0FBRyxXQUFXLENBQ3BCLFNBQVMsc0JBQXdCLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxFQUFDLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7O0lBRzFGLFFBQVEsR0FBRyxLQUFLLENBQUM7SUFDakIsdUJBQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7O0lBR2xDLHVCQUFNLGFBQWEsR0FBRyxpQkFBaUIsQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUNyRCx1QkFBTSxjQUFjLHNCQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUM1Qyx1QkFBTSxnQkFBZ0Isc0JBQUcsY0FBYyxDQUFDLElBQUksR0FBRyxVQUFVLEVBQUUsYUFBYSxDQUFDLENBQUM7O0lBRzFFLEtBQUsscUJBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ2hELHVCQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSx1QkFBeUIsRUFBRTs7WUFFckQsdUJBQU0sbUJBQW1CLEdBQUcsbUJBQUMsYUFBZ0MsRUFBQyxDQUFDLElBQUksQ0FBQztZQUNwRSxzQkFBc0IsQ0FBQyxJQUFJLEVBQUUsbUJBQW1CLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xGO2FBQU07O1lBRUwsc0JBQXNCLENBQ2xCLElBQUksb0JBQUUsYUFBMEQscUJBQ2hFLGFBQTBELEVBQUMsQ0FBQztTQUNqRTtLQUNGO0lBRUQsSUFBSSxtQkFBbUIsQ0FBQyxhQUFhLEVBQUUsV0FBVyxDQUFDLEVBQUU7UUFDbkQsU0FBUyxJQUFJLGNBQWMsQ0FBQyxhQUFhLGtCQUFvQixDQUFDOztRQUU5RCxxQkFBSSxhQUFhLEdBQWUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDL0MsdUJBQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDekMsT0FBTyxhQUFhLEVBQUU7WUFDcEIsbUJBQW1CLG1CQUNmLGFBQTBELHFCQUFFLGFBQTZCLEdBQ3pGLFdBQVcsQ0FBQyxDQUFDO1lBQ2pCLGFBQWEsR0FBRyxhQUFhLEtBQUssaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsYUFBYSxDQUFDLGFBQWEsQ0FBQztTQUMxRjtLQUNGO0NBQ0Y7Ozs7Ozs7QUFRRCwyQkFBMkIsS0FBWTtJQUNyQyxxQkFBSSxhQUFhLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQztJQUMvQixPQUFPLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxpQkFBbUIsRUFBRTtRQUNsRCxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDekQsS0FBSyxzQkFBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7UUFDdkIsYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7S0FDNUI7SUFFRCxTQUFTLElBQUksY0FBYyxDQUFDLGFBQWEsa0JBQW9CLENBQUM7SUFDOUQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRTVELHlCQUFPLGFBQTZCLEVBQUM7Q0FDdEM7Ozs7Ozs7Ozs7OztBQVlELE1BQU0sd0JBQW9ELFdBQWtCLEVBQUUsS0FBUTtJQUNwRixXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUM7SUFDakYsV0FBVyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7SUFDekIsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7O0FBT0QsTUFBTSw0QkFBNEIsSUFBa0I7O0lBRWxELElBQUksSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLHNCQUF5QixDQUFDLEVBQUU7UUFDNUQsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLGlCQUFvQixDQUFDO0tBQ3JDO0NBQ0Y7Ozs7Ozs7O0FBTUQsTUFBTSxxQ0FBcUMsSUFBVyxFQUFFLFVBQTRCO0lBRWxGLE9BQU8sVUFBUyxDQUFNO1FBQ3BCLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwQixPQUFPLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QixDQUFDO0NBQ0g7Ozs7Ozs7O0FBTUQsTUFBTSwwQ0FDRixJQUFXLEVBQUUsVUFBNEI7SUFDM0MsT0FBTyxzQ0FBc0MsQ0FBUTtRQUNuRCxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDcEIsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssS0FBSyxFQUFFO1lBQzNCLENBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQzs7WUFFbkIsQ0FBQyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7U0FDdkI7S0FDRixDQUFDO0NBQ0g7Ozs7OztBQUdELE1BQU0sd0JBQXdCLElBQVc7SUFDdkMscUJBQUksV0FBVyxHQUFlLElBQUksQ0FBQztJQUVuQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLElBQUksSUFBSSxFQUFFO1FBQ2pDLFdBQVcsQ0FBQyxLQUFLLGlCQUFvQixDQUFDO1FBQ3RDLFdBQVcsR0FBRyxXQUFXLENBQUMsTUFBTSxDQUFDO0tBQ2xDO0lBQ0QsV0FBVyxDQUFDLEtBQUssaUJBQW9CLENBQUM7SUFFdEMsU0FBUyxJQUFJLGFBQWEsb0JBQUMsV0FBVyxHQUFHLE9BQU8sRUFBRSxhQUFhLENBQUMsQ0FBQztJQUNqRSxZQUFZLHFCQUFDLFdBQVcsR0FBRyxPQUFPLEVBQWdCLENBQUM7Q0FDcEQ7Ozs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0sdUJBQTBCLFdBQXdCO0lBQ3RELElBQUksV0FBVyxDQUFDLEtBQUssSUFBSSxjQUFjLEVBQUU7UUFDdkMscUJBQUksR0FBK0IsQ0FBQztRQUNwQyxXQUFXLENBQUMsS0FBSyxHQUFHLElBQUksT0FBTyxDQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDdEQsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEVBQUU7WUFDekIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztjQUM1QixHQUFHLEdBQUcsSUFBSTtZQUNWLFdBQVcsQ0FBQyxLQUFLLEdBQUcsY0FBYyxDQUFDO1NBQ3BDLENBQUMsQ0FBQztLQUNKO0NBQ0Y7Ozs7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLGVBQWtCLFNBQVk7SUFDbEMsdUJBQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN4Qyx1QkFBTSxhQUFhLEdBQUcsbUJBQUMsUUFBUSxDQUFDLE9BQXNCLEVBQUMsQ0FBQyxTQUFTLENBQUM7SUFDbEUsdUJBQU0sUUFBUSxHQUFHLDZCQUE2QixDQUFDLGFBQWEsQ0FBQyxDQUFDO0lBRTlELFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvREFBb0QsQ0FBQyxDQUFDO0lBQ2hHLHlCQUF5QixDQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7Q0FDOUQ7Ozs7Ozs7O0FBU0QsTUFBTSxzQkFBc0IsU0FBYztJQUN4QyxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSxXQUFXLENBQUMsQ0FBQztJQUNuRCx1QkFBTSxZQUFZLEdBQUcsNkJBQTZCLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDOUQscUJBQUksS0FBSyxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUM7SUFDOUIsT0FBTyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ25CLEtBQUssR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0tBQ3RCO0lBQ0QsT0FBTyxLQUFLLENBQUM7Q0FDZDs7Ozs7Ozs7Ozs7Ozs7OztBQWVELE1BQU0sd0JBQTJCLFNBQVk7SUFDM0MsdUJBQU0sUUFBUSxHQUFHLDZCQUE2QixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzFELFNBQVMsSUFBSSxhQUFhLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxvREFBb0QsQ0FBQyxDQUFDO0lBQ2hHLHVCQUFNLGNBQWMsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLEtBQUssd0NBQTBDLENBQUM7SUFDdEYsdUJBQU0sR0FBRyx1QkFBRyxRQUFRLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsY0FBYyxFQUFvQixDQUFDO0lBQ2hGLHFCQUFxQixtQkFBQyxRQUFRLENBQUMsSUFBYSxHQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7Q0FDekU7Ozs7Ozs7Ozs7QUFTRCxNQUFNLHlCQUE0QixTQUFZO0lBQzVDLGtCQUFrQixHQUFHLElBQUksQ0FBQztJQUMxQixJQUFJO1FBQ0YsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzFCO1lBQVM7UUFDUixrQkFBa0IsR0FBRyxLQUFLLENBQUM7S0FDNUI7Q0FDRjs7Ozs7Ozs7OztBQUdELE1BQU0sZ0NBQ0YsUUFBZSxFQUFFLFFBQXNCLEVBQUUsR0FBb0IsRUFBRSxTQUFZO0lBQzdFLHVCQUFNLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBQzlDLHVCQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBRTlCLElBQUk7UUFDRixRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzlDLFdBQVcsRUFBRSxDQUFDO0tBQ2Y7WUFBUztRQUNSLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNwQjtDQUNGOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxNQUFNLG9CQUF1QixTQUFZO0lBQ3ZDLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ25ELHVCQUFNLFlBQVksR0FBRyw2QkFBNkIsQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUM5RCxhQUFhLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ2xDOzs7O0FBWUQsTUFBTSxDQUFDLHVCQUFNLFNBQVMscUJBQUcsRUFBZSxDQUFBLENBQUM7Ozs7Ozs7O0FBUXpDO0lBQ0UsU0FBUyxJQUFJLFdBQVcsQ0FDUCxXQUFXLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEVBQ2pDLHdEQUF3RCxDQUFDLENBQUM7SUFDM0UsU0FBUyxJQUFJLFdBQVcsQ0FDUCxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQyxFQUM1QixzQ0FBc0MsR0FBRyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7SUFDcEYsV0FBVyxDQUFDLFlBQVksR0FBRyxXQUFXLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztDQUN4RTs7Ozs7Ozs7QUFPRCxNQUFNLGVBQWtCLEtBQW9CO0lBQzFDLElBQUksV0FBVyxDQUFDLGlCQUFpQixHQUFHLENBQUMsRUFBRTtRQUNyQyxZQUFZLEVBQUUsQ0FBQztRQUNmLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztLQUNqRDtJQUVELHVCQUFNLE9BQU8sR0FDVCxLQUFLLEtBQUssU0FBUyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlFLElBQUksT0FBTyxFQUFFO1FBQ1gseUJBQXlCLENBQ3JCLFlBQVksRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzdFLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQ3hDO0lBQ0QsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDO0lBQzNCLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQztDQUNwQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFtQkQsTUFBTSx1QkFBdUIsUUFBZ0I7Ozs7SUFJM0MsSUFBSSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUM7SUFDeEIsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsQ0FBQzs7O0lBR2hDLFlBQVksRUFBRSxDQUFDO0NBQ2hCOzs7Ozs7Ozs7O0FBU0QsTUFBTSx5Q0FBeUMsTUFBYztJQUMzRCx1QkFBTSxXQUFXLEdBQUcsV0FBVyxDQUFDLFlBQVksQ0FBQztJQUM3QyxXQUFXLENBQUMsWUFBWSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxNQUFNLENBQUM7SUFDbEUsT0FBTyxXQUFXLENBQUM7Q0FDcEI7Ozs7Ozs7OztBQVFELE1BQU0sOEJBQThCLEtBQWE7SUFDL0MsV0FBVyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7Q0FDbEM7Ozs7Ozs7Ozs7Ozs7OztBQWNELE1BQU0seUJBQXlCLE1BQWE7SUFDMUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLE1BQU0sRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0lBQy9FLFNBQVMsSUFBSSxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLHFDQUFxQyxDQUFDLENBQUM7SUFFdEYscUJBQUksU0FBUyxHQUFHLEtBQUssQ0FBQztJQUV0QixLQUFLLHFCQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7UUFFekMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsSUFBSSxDQUFDLFNBQVMsRUFBRTtRQUNkLE9BQU8sU0FBUyxDQUFDO0tBQ2xCOztJQUdELHFCQUFJLE9BQU8sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDekMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ2pEO0lBRUQsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7Ozs7OztBQVNELE1BQU0seUJBQXlCLE1BQWMsRUFBRSxFQUFPLEVBQUUsTUFBYztJQUNwRSx1QkFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRXJDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0NBQ2hFOzs7Ozs7Ozs7O0FBR0QsTUFBTSx5QkFDRixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsTUFBYztJQUM5RCx1QkFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUUxQyxPQUFPLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO0NBQ3JGOzs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFFbkYscUJBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDeEMsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQzNFLFNBQVMsQ0FBQztDQUM5Qjs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQ3RGLE1BQWM7SUFDaEIsdUJBQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVsRCxPQUFPLFNBQVMsQ0FBQyxDQUFDO1FBQ2QsTUFBTSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUM7WUFDakYsTUFBTSxDQUFDLENBQUM7UUFDWixTQUFTLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7Ozs7OztBQUdELE1BQU0seUJBQ0YsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxNQUFjO0lBQ3JDLHFCQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEQsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDNUIsU0FBUyxDQUFDO0NBQ2Y7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUdELE1BQU0seUJBQ0YsTUFBYyxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFDdEYsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFDMUQscUJBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRCxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFakQsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQztRQUNqRCxTQUFTLENBQUM7Q0FDZjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFHRCxNQUFNLHlCQUNGLE1BQWMsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQ3RGLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUFFLE1BQWM7SUFFL0UscUJBQUksU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNoRCxTQUFTLEdBQUcsZUFBZSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFDakQsU0FBUyxHQUFHLGNBQWMsQ0FBQyxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFNUMsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFDO1FBQ3RFLFNBQVMsQ0FBQztDQUNmOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBR0QsTUFBTSx5QkFDRixNQUFjLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUN0RixFQUFVLEVBQUUsRUFBTyxFQUFFLEVBQVUsRUFBRSxFQUFPLEVBQUUsRUFBVSxFQUFFLEVBQU8sRUFBRSxFQUFVLEVBQUUsRUFBTyxFQUNsRixNQUFjO0lBQ2hCLHFCQUFJLFNBQVMsR0FBRyxlQUFlLENBQUMsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7SUFDaEQsU0FBUyxHQUFHLGVBQWUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLENBQUMsSUFBSSxTQUFTLENBQUM7SUFFekQsT0FBTyxTQUFTLENBQUMsQ0FBQztRQUNkLE1BQU0sR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRTtZQUN0RixTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxHQUFHLFNBQVMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLEdBQUcsU0FBUyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUM7UUFDM0YsU0FBUyxDQUFDO0NBQ2Y7Ozs7Ozs7O0FBR0QsTUFBTSxnQkFBbUIsS0FBYSxFQUFFLEtBQVE7OztJQUc5QyxJQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ3pCLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDckI7SUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0NBQ3JCOzs7Ozs7O0FBR0QsTUFBTSxlQUFrQixLQUFhO0lBQ25DLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUN0QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztDQUNwQjs7Ozs7OztBQUdELE1BQU0sd0JBQTJCLEtBQWE7SUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUUsc0RBQXNELENBQUMsQ0FBQztJQUMvRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxxQkFBRSxVQUFVLEdBQUcsQ0FBQztJQUNwRCwwQkFBTyxVQUFVLEdBQUcsS0FBSyxFQUFFO0NBQzVCOzs7OztBQUdELE1BQU07SUFDSixTQUFTLElBQUksaUJBQWlCLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ3pELFNBQVM7UUFDTCxjQUFjLENBQ1YsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsRUFBRSxTQUFTLEVBQUUseUNBQXlDLENBQUMsQ0FBQztJQUM5RixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztDQUN6Qzs7Ozs7O0FBR0QsTUFBTSx5QkFBeUIsS0FBVTtJQUN2QyxTQUFTLElBQUksY0FBYyxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztJQUUzRixJQUFJLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLEVBQUU7UUFDckMsWUFBWSxFQUFFLENBQUM7S0FDaEI7U0FBTSxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxFQUFFLEtBQUssQ0FBQyxFQUFFO1FBQzdELHlCQUF5QixDQUNyQixZQUFZLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUM5RTtTQUFNO1FBQ0wsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDO1FBQzNCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7SUFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLFlBQVksRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ3pDLE9BQU8sSUFBSSxDQUFDO0NBQ2I7Ozs7OztBQUdELE1BQU0sZ0NBQWdDLEtBQVU7SUFDOUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3RCLE9BQU8sS0FBSyxDQUFDO0NBQ2Q7Ozs7Ozs7QUFHRCxNQUFNLDBCQUEwQixJQUFTLEVBQUUsSUFBUztJQUNsRCx1QkFBTSxTQUFTLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZDLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxJQUFJLFNBQVMsQ0FBQztDQUMxQzs7Ozs7Ozs7O0FBR0QsTUFBTSwwQkFBMEIsSUFBUyxFQUFFLElBQVMsRUFBRSxJQUFTLEVBQUUsSUFBUztJQUN4RSx1QkFBTSxTQUFTLEdBQUcsZUFBZSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM5QyxPQUFPLGVBQWUsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksU0FBUyxDQUFDO0NBQ2pEOzs7O0FBRUQsTUFBTTtJQUNKLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQztDQUMxQjs7Ozs7O0FBRUQsTUFBTSwrQkFBa0MsZUFBd0I7OztJQUc5RCxPQUFPLEtBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0NBQzlFOzs7O0FBRUQsTUFBTTtJQUNKLFdBQVcsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLHlDQUF5QyxDQUFDLENBQUM7Q0FDeEU7Ozs7QUFFRDtJQUNFLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztDQUN6Rjs7Ozs7O0FBRUQsMkJBQTJCLEtBQWEsRUFBRSxHQUFXO0lBQ25ELElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQzVCLGNBQWMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUseUNBQXlDLENBQUMsQ0FBQztDQUN4Rjs7Ozs7O0FBRUQsd0JBQXdCLEtBQWEsRUFBRSxHQUFXO0lBQ2hELElBQUksR0FBRyxJQUFJLElBQUk7UUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDO0lBQzVCLFdBQVcsQ0FDUCxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEtBQUssNkNBQTZDLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0NBQ2xHOzs7Ozs7Ozs7QUFPRCxNQUFNLHdDQUF3QyxVQUFrQixFQUFFLFFBQWdCO0lBQ2hGLElBQUksaUJBQWlCLEVBQUU7UUFDckIsdUJBQU0sVUFBVSxHQUFHLFdBQVcsQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUM7UUFDOUQsS0FBSyxxQkFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDakMsV0FBVyxDQUNQLElBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxDQUFDLEVBQUUsU0FBUyxFQUMvQix3RUFBd0UsQ0FBQyxDQUFDO1NBQy9FO0tBQ0Y7Q0FDRjs7Ozs7O0FBRUQsTUFBTSx3Q0FBMkMsU0FBWTtJQUMzRCxTQUFTLElBQUksYUFBYSxDQUFDLFNBQVMsRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3RFLHVCQUFNLFlBQVkscUJBQUcsbUJBQUMsU0FBZ0IsRUFBQyxDQUFDLGNBQWMsQ0FBaUIsQ0FBQSxDQUFDO0lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLDJCQUEyQixDQUFDLENBQUM7SUFDbkUsT0FBTyxZQUFZLENBQUM7Q0FDckI7QUFFRCxNQUFNLENBQUMsdUJBQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQztBQUM1QyxNQUFNLENBQUMsdUJBQU0sc0JBQXNCLEdBQUcsdUJBQXVCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7YXNzZXJ0RXF1YWwsIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90TnVsbCwgYXNzZXJ0TnVsbCwgYXNzZXJ0U2FtZX0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtMQ29udGFpbmVyfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3QsIExQcm9qZWN0aW9uLCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7Q3VycmVudE1hdGNoZXNMaXN0LCBMVmlldywgTFZpZXdGbGFncywgTGlmZWN5Y2xlU3RhZ2UsIFJvb3RDb250ZXh0LCBURGF0YSwgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcblxuaW1wb3J0IHtMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVE5vZGVUeXBlLCBUTm9kZUZsYWdzLCBMUHJvamVjdGlvbk5vZGUsIExUZXh0Tm9kZSwgTFZpZXdOb2RlLCBUTm9kZSwgVENvbnRhaW5lck5vZGUsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLH0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHthc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBpbnNlcnRWaWV3LCBhcHBlbmRQcm9qZWN0ZWROb2RlLCByZW1vdmVWaWV3LCBjYW5JbnNlcnROYXRpdmVOb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZ2V0TmV4dExOb2RlLCBnZXRDaGlsZExOb2RlfSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0LCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7UkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFByb2NlZHVyYWxSZW5kZXJlcjMsIFJlbmRlcmVyU3R5bGVGbGFnczMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtpc0RpZmZlcmVudCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3MsIHF1ZXVlSW5pdEhvb2tzLCBleGVjdXRlSW5pdEhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5pbXBvcnQge3Rocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yLCB0aHJvd0Vycm9ySWZOb0NoYW5nZXNNb2RlLCB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuXG4vKipcbiAqIERpcmVjdGl2ZSAoRCkgc2V0cyBhIHByb3BlcnR5IG9uIGFsbCBjb21wb25lbnQgaW5zdGFuY2VzIHVzaW5nIHRoaXMgY29uc3RhbnQgYXMgYSBrZXkgYW5kIHRoZVxuICogY29tcG9uZW50J3MgaG9zdCBub2RlIChMRWxlbWVudCkgYXMgdGhlIHZhbHVlLiBUaGlzIGlzIHVzZWQgaW4gbWV0aG9kcyBsaWtlIGRldGVjdENoYW5nZXMgdG9cbiAqIGZhY2lsaXRhdGUganVtcGluZyBmcm9tIGFuIGluc3RhbmNlIHRvIHRoZSBob3N0IG5vZGUuXG4gKi9cbmV4cG9ydCBjb25zdCBOR19IT1NUX1NZTUJPTCA9ICdfX25nSG9zdExOb2RlX18nO1xuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuLyoqXG4gKiBGdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZSBiZWZvcmUgd3JpdGluZyBpdCBpbnRvIHRoZSByZW5kZXJlci5cbiAqL1xuZXhwb3J0IHR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIERpcmVjdGl2ZSBhbmQgZWxlbWVudCBpbmRpY2VzIGZvciB0b3AtbGV2ZWwgZGlyZWN0aXZlLlxuICpcbiAqIFNhdmVkIGhlcmUgdG8gYXZvaWQgcmUtaW5zdGFudGlhdGluZyBhbiBhcnJheSBvbiBldmVyeSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqL1xuZXhwb3J0IGNvbnN0IF9ST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gWzAsIDBdO1xuXG4vKipcbiAqIFRva2VuIHNldCBpbiBjdXJyZW50TWF0Y2hlcyB3aGlsZSBkZXBlbmRlbmNpZXMgYXJlIGJlaW5nIHJlc29sdmVkLlxuICpcbiAqIElmIHdlIHZpc2l0IGEgZGlyZWN0aXZlIHRoYXQgaGFzIGEgdmFsdWUgc2V0IHRvIENJUkNVTEFSLCB3ZSBrbm93IHdlJ3ZlXG4gKiBhbHJlYWR5IHNlZW4gaXQsIGFuZCB0aHVzIGhhdmUgYSBjaXJjdWxhciBkZXBlbmRlbmN5LlxuICovXG5leHBvcnQgY29uc3QgQ0lSQ1VMQVIgPSAnX19DSVJDVUxBUl9fJztcblxuLyoqXG4gKiBUaGlzIHByb3BlcnR5IGdldHMgc2V0IGJlZm9yZSBlbnRlcmluZyBhIHRlbXBsYXRlLlxuICpcbiAqIFRoaXMgcmVuZGVyZXIgY2FuIGJlIG9uZSBvZiB0d28gdmFyaWV0aWVzIG9mIFJlbmRlcmVyMzpcbiAqXG4gKiAtIE9iamVjdGVkT3JpZW50ZWRSZW5kZXJlcjNcbiAqXG4gKiBUaGlzIGlzIHRoZSBuYXRpdmUgYnJvd3NlciBBUEkgc3R5bGUsIGUuZy4gb3BlcmF0aW9ucyBhcmUgbWV0aG9kcyBvbiBpbmRpdmlkdWFsIG9iamVjdHNcbiAqIGxpa2UgSFRNTEVsZW1lbnQuIFdpdGggdGhpcyBzdHlsZSwgbm8gYWRkaXRpb25hbCBjb2RlIGlzIG5lZWRlZCBhcyBhIGZhY2FkZSAocmVkdWNpbmcgcGF5bG9hZFxuICogc2l6ZSkuXG4gKlxuICogLSBQcm9jZWR1cmFsUmVuZGVyZXIzXG4gKlxuICogSW4gbm9uLW5hdGl2ZSBicm93c2VyIGVudmlyb25tZW50cyAoZS5nLiBwbGF0Zm9ybXMgc3VjaCBhcyB3ZWItd29ya2VycyksIHRoaXMgaXMgdGhlIGZhY2FkZVxuICogdGhhdCBlbmFibGVzIGVsZW1lbnQgbWFuaXB1bGF0aW9uLiBUaGlzIGFsc28gZmFjaWxpdGF0ZXMgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkgd2l0aFxuICogUmVuZGVyZXIyLlxuICovXG5sZXQgcmVuZGVyZXI6IFJlbmRlcmVyMztcbmxldCByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTM7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRSZW5kZXJlcigpOiBSZW5kZXJlcjMge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHJlbmRlcmVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFNhbml0aXplcigpOiBTYW5pdGl6ZXJ8bnVsbCB7XG4gIHJldHVybiBjdXJyZW50VmlldyAmJiBjdXJyZW50Vmlldy5zYW5pdGl6ZXI7XG59XG5cbi8qKiBVc2VkIHRvIHNldCB0aGUgcGFyZW50IHByb3BlcnR5IHdoZW4gbm9kZXMgYXJlIGNyZWF0ZWQuICovXG5sZXQgcHJldmlvdXNPclBhcmVudE5vZGU6IExOb2RlO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKTogTE5vZGUge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbiAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHByZXZpb3VzT3JQYXJlbnROb2RlO1xufVxuXG4vKipcbiAqIElmIGBpc1BhcmVudGAgaXM6XG4gKiAgLSBgdHJ1ZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gYSBwYXJlbnQgbm9kZS5cbiAqICAtIGBmYWxzZWA6IHRoZW4gYHByZXZpb3VzT3JQYXJlbnROb2RlYCBwb2ludHMgdG8gcHJldmlvdXMgbm9kZSAoc2libGluZykuXG4gKi9cbmxldCBpc1BhcmVudDogYm9vbGVhbjtcblxuLyoqXG4gKiBTdGF0aWMgZGF0YSB0aGF0IGNvcnJlc3BvbmRzIHRvIHRoZSBpbnN0YW5jZS1zcGVjaWZpYyBkYXRhIGFycmF5IG9uIGFuIExWaWV3LlxuICpcbiAqIEVhY2ggbm9kZSdzIHN0YXRpYyBkYXRhIGlzIHN0b3JlZCBpbiB0RGF0YSBhdCB0aGUgc2FtZSBpbmRleCB0aGF0IGl0J3Mgc3RvcmVkXG4gKiBpbiB0aGUgZGF0YSBhcnJheS4gQW55IG5vZGVzIHRoYXQgZG8gbm90IGhhdmUgc3RhdGljIGRhdGEgc3RvcmUgYSBudWxsIHZhbHVlIGluXG4gKiB0RGF0YSB0byBhdm9pZCBhIHNwYXJzZSBhcnJheS5cbiAqL1xubGV0IHREYXRhOiBURGF0YTtcblxuLyoqXG4gKiBTdGF0ZSBvZiB0aGUgY3VycmVudCB2aWV3IGJlaW5nIHByb2Nlc3NlZC5cbiAqXG4gKiBOT1RFOiB3ZSBjaGVhdCBoZXJlIGFuZCBpbml0aWFsaXplIGl0IHRvIGBudWxsYCBldmVuIHRob3VnaHQgdGhlIHR5cGUgZG9lcyBub3RcbiAqIGNvbnRhaW4gYG51bGxgLiBUaGlzIGlzIGJlY2F1c2Ugd2UgZXhwZWN0IHRoaXMgdmFsdWUgdG8gYmUgbm90IGBudWxsYCBhcyBzb29uXG4gKiBhcyB3ZSBlbnRlciB0aGUgdmlldy4gRGVjbGFyaW5nIHRoZSB0eXBlIGFzIGBudWxsYCB3b3VsZCByZXF1aXJlIHVzIHRvIHBsYWNlIGAhYFxuICogaW4gbW9zdCBpbnN0cnVjdGlvbnMgc2luY2UgdGhleSBhbGwgYXNzdW1lIHRoYXQgYGN1cnJlbnRWaWV3YCBpcyBkZWZpbmVkLlxuICovXG5sZXQgY3VycmVudFZpZXc6IExWaWV3ID0gbnVsbCAhO1xuXG5sZXQgY3VycmVudFF1ZXJpZXM6IExRdWVyaWVzfG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXJyZW50UXVlcmllcyhRdWVyeVR5cGU6IHtuZXcgKCk6IExRdWVyaWVzfSk6IExRdWVyaWVzIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb24gKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiBjdXJyZW50UXVlcmllcyB8fCAoY3VycmVudFF1ZXJpZXMgPSBuZXcgUXVlcnlUeXBlKCkpO1xufVxuXG4vKipcbiAqIFRoaXMgcHJvcGVydHkgZ2V0cyBzZXQgYmVmb3JlIGVudGVyaW5nIGEgdGVtcGxhdGUuXG4gKi9cbmxldCBjcmVhdGlvbk1vZGU6IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDcmVhdGlvbk1vZGUoKTogYm9vbGVhbiB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29uIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gY3JlYXRpb25Nb2RlO1xufVxuXG4vKipcbiAqIEFuIGFycmF5IG9mIG5vZGVzICh0ZXh0LCBlbGVtZW50LCBjb250YWluZXIsIGV0YyksIHBpcGVzLCB0aGVpciBiaW5kaW5ncywgYW5kXG4gKiBhbnkgbG9jYWwgdmFyaWFibGVzIHRoYXQgbmVlZCB0byBiZSBzdG9yZWQgYmV0d2VlbiBpbnZvY2F0aW9ucy5cbiAqL1xubGV0IGRhdGE6IGFueVtdO1xuXG4vKipcbiAqIEFuIGFycmF5IG9mIGRpcmVjdGl2ZSBpbnN0YW5jZXMgaW4gdGhlIGN1cnJlbnQgdmlldy5cbiAqXG4gKiBUaGVzZSBtdXN0IGJlIHN0b3JlZCBzZXBhcmF0ZWx5IGZyb20gTE5vZGVzIGJlY2F1c2UgdGhlaXIgcHJlc2VuY2UgaXNcbiAqIHVua25vd24gYXQgY29tcGlsZS10aW1lIGFuZCB0aHVzIHNwYWNlIGNhbm5vdCBiZSByZXNlcnZlZCBpbiBkYXRhW10uXG4gKi9cbmxldCBkaXJlY3RpdmVzOiBhbnlbXXxudWxsO1xuXG4vKipcbiAqIFdoZW4gYSB2aWV3IGlzIGRlc3Ryb3llZCwgbGlzdGVuZXJzIG5lZWQgdG8gYmUgcmVsZWFzZWQgYW5kIG91dHB1dHMgbmVlZCB0byBiZVxuICogdW5zdWJzY3JpYmVkLiBUaGlzIGNsZWFudXAgYXJyYXkgc3RvcmVzIGJvdGggbGlzdGVuZXIgZGF0YSAoaW4gY2h1bmtzIG9mIDQpXG4gKiBhbmQgb3V0cHV0IGRhdGEgKGluIGNodW5rcyBvZiAyKSBmb3IgYSBwYXJ0aWN1bGFyIHZpZXcuIENvbWJpbmluZyB0aGUgYXJyYXlzXG4gKiBzYXZlcyBvbiBtZW1vcnkgKDcwIGJ5dGVzIHBlciBhcnJheSkgYW5kIG9uIGEgZmV3IGJ5dGVzIG9mIGNvZGUgc2l6ZSAoZm9yIHR3b1xuICogc2VwYXJhdGUgZm9yIGxvb3BzKS5cbiAqXG4gKiBJZiBpdCdzIGEgbGlzdGVuZXIgYmVpbmcgc3RvcmVkOlxuICogMXN0IGluZGV4IGlzOiBldmVudCBuYW1lIHRvIHJlbW92ZVxuICogMm5kIGluZGV4IGlzOiBuYXRpdmUgZWxlbWVudFxuICogM3JkIGluZGV4IGlzOiBsaXN0ZW5lciBmdW5jdGlvblxuICogNHRoIGluZGV4IGlzOiB1c2VDYXB0dXJlIGJvb2xlYW5cbiAqXG4gKiBJZiBpdCdzIGFuIG91dHB1dCBzdWJzY3JpcHRpb246XG4gKiAxc3QgaW5kZXggaXM6IHVuc3Vic2NyaWJlIGZ1bmN0aW9uXG4gKiAybmQgaW5kZXggaXM6IGNvbnRleHQgZm9yIGZ1bmN0aW9uXG4gKi9cbmxldCBjbGVhbnVwOiBhbnlbXXxudWxsO1xuXG4vKipcbiAqIEluIHRoaXMgbW9kZSwgYW55IGNoYW5nZXMgaW4gYmluZGluZ3Mgd2lsbCB0aHJvdyBhbiBFeHByZXNzaW9uQ2hhbmdlZEFmdGVyQ2hlY2tlZCBlcnJvci5cbiAqXG4gKiBOZWNlc3NhcnkgdG8gc3VwcG9ydCBDaGFuZ2VEZXRlY3RvclJlZi5jaGVja05vQ2hhbmdlcygpLlxuICovXG5sZXQgY2hlY2tOb0NoYW5nZXNNb2RlID0gZmFsc2U7XG5cbi8qKiBXaGV0aGVyIG9yIG5vdCB0aGlzIGlzIHRoZSBmaXJzdCB0aW1lIHRoZSBjdXJyZW50IHZpZXcgaGFzIGJlZW4gcHJvY2Vzc2VkLiAqL1xubGV0IGZpcnN0VGVtcGxhdGVQYXNzID0gdHJ1ZTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBTd2FwIHRoZSBjdXJyZW50IHN0YXRlIHdpdGggYSBuZXcgc3RhdGUuXG4gKlxuICogRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgd2Ugc3RvcmUgdGhlIHN0YXRlIGluIHRoZSB0b3AgbGV2ZWwgb2YgdGhlIG1vZHVsZS5cbiAqIFRoaXMgd2F5IHdlIG1pbmltaXplIHRoZSBudW1iZXIgb2YgcHJvcGVydGllcyB0byByZWFkLiBXaGVuZXZlciBhIG5ldyB2aWV3XG4gKiBpcyBlbnRlcmVkIHdlIGhhdmUgdG8gc3RvcmUgdGhlIHN0YXRlIGZvciBsYXRlciwgYW5kIHdoZW4gdGhlIHZpZXcgaXNcbiAqIGV4aXRlZCB0aGUgc3RhdGUgaGFzIHRvIGJlIHJlc3RvcmVkXG4gKlxuICogQHBhcmFtIG5ld1ZpZXcgTmV3IHN0YXRlIHRvIGJlY29tZSBhY3RpdmVcbiAqIEBwYXJhbSBob3N0IEVsZW1lbnQgdG8gd2hpY2ggdGhlIFZpZXcgaXMgYSBjaGlsZCBvZlxuICogQHJldHVybnMgdGhlIHByZXZpb3VzIHN0YXRlO1xuICovXG5leHBvcnQgZnVuY3Rpb24gZW50ZXJWaWV3KG5ld1ZpZXc6IExWaWV3LCBob3N0OiBMRWxlbWVudE5vZGUgfCBMVmlld05vZGUgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBvbGRWaWV3OiBMVmlldyA9IGN1cnJlbnRWaWV3O1xuICBkYXRhID0gbmV3VmlldyAmJiBuZXdWaWV3LmRhdGE7XG4gIGRpcmVjdGl2ZXMgPSBuZXdWaWV3ICYmIG5ld1ZpZXcuZGlyZWN0aXZlcztcbiAgdERhdGEgPSBuZXdWaWV3ICYmIG5ld1ZpZXcudFZpZXcuZGF0YTtcbiAgY3JlYXRpb25Nb2RlID0gbmV3VmlldyAmJiAobmV3Vmlldy5mbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSA9PT0gTFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gIGZpcnN0VGVtcGxhdGVQYXNzID0gbmV3VmlldyAmJiBuZXdWaWV3LnRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuXG4gIGNsZWFudXAgPSBuZXdWaWV3ICYmIG5ld1ZpZXcuY2xlYW51cDtcbiAgcmVuZGVyZXIgPSBuZXdWaWV3ICYmIG5ld1ZpZXcucmVuZGVyZXI7XG5cbiAgaWYgKG5ld1ZpZXcgJiYgbmV3Vmlldy5iaW5kaW5nSW5kZXggPCAwKSB7XG4gICAgbmV3Vmlldy5iaW5kaW5nSW5kZXggPSBuZXdWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuICB9XG5cbiAgaWYgKGhvc3QgIT0gbnVsbCkge1xuICAgIHByZXZpb3VzT3JQYXJlbnROb2RlID0gaG9zdDtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gIH1cblxuICBjdXJyZW50VmlldyA9IG5ld1ZpZXc7XG4gIGN1cnJlbnRRdWVyaWVzID0gbmV3VmlldyAmJiBuZXdWaWV3LnF1ZXJpZXM7XG5cbiAgcmV0dXJuIG9sZFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBpbiBsaWV1IG9mIGVudGVyVmlldyB0byBtYWtlIGl0IGNsZWFyIHdoZW4gd2UgYXJlIGV4aXRpbmcgYSBjaGlsZCB2aWV3LiBUaGlzIG1ha2VzXG4gKiB0aGUgZGlyZWN0aW9uIG9mIHRyYXZlcnNhbCAodXAgb3IgZG93biB0aGUgdmlldyB0cmVlKSBhIGJpdCBjbGVhcmVyLlxuICpcbiAqIEBwYXJhbSBuZXdWaWV3IE5ldyBzdGF0ZSB0byBiZWNvbWUgYWN0aXZlXG4gKiBAcGFyYW0gY3JlYXRpb25Pbmx5IEFuIG9wdGlvbmFsIGJvb2xlYW4gdG8gaW5kaWNhdGUgdGhhdCB0aGUgdmlldyB3YXMgcHJvY2Vzc2VkIGluIGNyZWF0aW9uIG1vZGVcbiAqIG9ubHksIGkuZS4gdGhlIGZpcnN0IHVwZGF0ZSB3aWxsIGJlIGRvbmUgbGF0ZXIuIE9ubHkgcG9zc2libGUgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsZWF2ZVZpZXcobmV3VmlldzogTFZpZXcsIGNyZWF0aW9uT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgaWYgKCFjcmVhdGlvbk9ubHkpIHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKFxuICAgICAgICAgIGRpcmVjdGl2ZXMgISwgY3VycmVudFZpZXcudFZpZXcudmlld0hvb2tzLCBjdXJyZW50Vmlldy50Vmlldy52aWV3Q2hlY2tIb29rcyxcbiAgICAgICAgICBjcmVhdGlvbk1vZGUpO1xuICAgIH1cbiAgICAvLyBWaWV3cyBhcmUgY2xlYW4gYW5kIGluIHVwZGF0ZSBtb2RlIGFmdGVyIGJlaW5nIGNoZWNrZWQsIHNvIHRoZXNlIGJpdHMgYXJlIGNsZWFyZWRcbiAgICBjdXJyZW50Vmlldy5mbGFncyAmPSB+KExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5EaXJ0eSk7XG4gIH1cbiAgY3VycmVudFZpZXcubGlmZWN5Y2xlU3RhZ2UgPSBMaWZlY3ljbGVTdGFnZS5Jbml0O1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSAtMTtcbiAgZW50ZXJWaWV3KG5ld1ZpZXcsIG51bGwpO1xufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGNoaWxkcmVuLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3QgYmluZGluZ3MsXG4gKiByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKiAqL1xuZnVuY3Rpb24gcmVmcmVzaFZpZXcoKSB7XG4gIGNvbnN0IHRWaWV3ID0gY3VycmVudFZpZXcudFZpZXc7XG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gIH1cbiAgcmVmcmVzaER5bmFtaWNDaGlsZHJlbigpO1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGV4ZWN1dGVIb29rcyhkaXJlY3RpdmVzICEsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNyZWF0aW9uTW9kZSk7XG4gIH1cblxuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICBzZXRIb3N0QmluZGluZ3ModFZpZXcuaG9zdEJpbmRpbmdzKTtcbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzKTtcbn1cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKGJpbmRpbmdzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGJpbmRpbmdzICE9IG51bGwpIHtcbiAgICBjb25zdCBkZWZzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmluZGluZ3MubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRpckluZGV4ID0gYmluZGluZ3NbaV07XG4gICAgICBjb25zdCBkZWYgPSBkZWZzW2RpckluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgJiYgZGVmLmhvc3RCaW5kaW5ncyhkaXJJbmRleCwgYmluZGluZ3NbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGNvbXBvbmVudHM6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoY29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKGNvbXBvbmVudHNbaV0sIGNvbXBvbmVudHNbaSArIDFdKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVJbml0QW5kQ29udGVudEhvb2tzKCk6IHZvaWQge1xuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIGNvbnN0IHRWaWV3ID0gY3VycmVudFZpZXcudFZpZXc7XG4gICAgZXhlY3V0ZUluaXRIb29rcyhjdXJyZW50VmlldywgdFZpZXcsIGNyZWF0aW9uTW9kZSk7XG4gICAgZXhlY3V0ZUhvb2tzKGRpcmVjdGl2ZXMgISwgdFZpZXcuY29udGVudEhvb2tzLCB0Vmlldy5jb250ZW50Q2hlY2tIb29rcywgY3JlYXRpb25Nb2RlKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgdmlld0lkOiBudW1iZXIsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHRWaWV3OiBUVmlldywgdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPFQ+fCBudWxsLFxuICAgIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncywgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3QgbmV3VmlldyA9IHtcbiAgICBwYXJlbnQ6IGN1cnJlbnRWaWV3LFxuICAgIGlkOiB2aWV3SWQsICAvLyAtMSBmb3IgY29tcG9uZW50IHZpZXdzXG4gICAgZmxhZ3M6IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkLFxuICAgIG5vZGU6IG51bGwgISwgIC8vIHVudGlsIHdlIGluaXRpYWxpemUgaXQgaW4gY3JlYXRlTm9kZS5cbiAgICBkYXRhOiBbXSxcbiAgICBkaXJlY3RpdmVzOiBudWxsLFxuICAgIHRWaWV3OiB0VmlldyxcbiAgICBjbGVhbnVwOiBudWxsLFxuICAgIHJlbmRlcmVyOiByZW5kZXJlcixcbiAgICBjaGlsZDogbnVsbCxcbiAgICB0YWlsOiBudWxsLFxuICAgIG5leHQ6IG51bGwsXG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IC0xLFxuICAgIGJpbmRpbmdJbmRleDogLTEsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGNvbnRleHQ6IGNvbnRleHQsXG4gICAgZHluYW1pY1ZpZXdDb3VudDogMCxcbiAgICBsaWZlY3ljbGVTdGFnZTogTGlmZWN5Y2xlU3RhZ2UuSW5pdCxcbiAgICBxdWVyaWVzOiBudWxsLFxuICAgIGluamVjdG9yOiBjdXJyZW50VmlldyAmJiBjdXJyZW50Vmlldy5pbmplY3RvcixcbiAgICBzYW5pdGl6ZXI6IHNhbml0aXplciB8fCBudWxsXG4gIH07XG5cbiAgcmV0dXJuIG5ld1ZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRpb24gb2YgTE5vZGUgb2JqZWN0IGlzIGV4dHJhY3RlZCB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHNvIHdlIGFsd2F5cyBjcmVhdGUgTE5vZGUgb2JqZWN0XG4gKiB3aXRoIHRoZSBzYW1lIHNoYXBlXG4gKiAoc2FtZSBwcm9wZXJ0aWVzIGFzc2lnbmVkIGluIHRoZSBzYW1lIG9yZGVyKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgIHR5cGU6IFROb2RlVHlwZSwgY3VycmVudFZpZXc6IExWaWV3LCBwYXJlbnQ6IExOb2RlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIHN0YXRlOiBhbnksXG4gICAgcXVlcmllczogTFF1ZXJpZXMgfCBudWxsKTogTEVsZW1lbnROb2RlJkxUZXh0Tm9kZSZMVmlld05vZGUmTENvbnRhaW5lck5vZGUmTFByb2plY3Rpb25Ob2RlIHtcbiAgcmV0dXJuIHtcbiAgICBuYXRpdmU6IG5hdGl2ZSBhcyBhbnksXG4gICAgdmlldzogY3VycmVudFZpZXcsXG4gICAgcGFyZW50OiBwYXJlbnQgYXMgYW55LFxuICAgIG5vZGVJbmplY3RvcjogcGFyZW50ID8gcGFyZW50Lm5vZGVJbmplY3RvciA6IG51bGwsXG4gICAgZGF0YTogc3RhdGUsXG4gICAgcXVlcmllczogcXVlcmllcyxcbiAgICB0Tm9kZTogbnVsbCAhLFxuICAgIHBOZXh0T3JQYXJlbnQ6IG51bGwsXG4gICAgZHluYW1pY0xDb250YWluZXJOb2RlOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogQSBjb21tb24gd2F5IG9mIGNyZWF0aW5nIHRoZSBMTm9kZSB0byBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlbSBoYXZlIHNhbWUgc2hhcGUgdG9cbiAqIGtlZXAgdGhlIGV4ZWN1dGlvbiBjb2RlIG1vbm9tb3JwaGljIGFuZCBmYXN0LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIExOb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKVxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgTE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBMTm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBkYXRhIEFueSBkYXRhIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIHRoZSBMTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciB8IG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwsIGxWaWV3PzogTFZpZXcgfCBudWxsKTogTEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCB0eXBlOiBUTm9kZVR5cGUuVmlldywgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLCBhdHRyczogbnVsbCxcbiAgICBsVmlldzogTFZpZXcpOiBMVmlld05vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTE5vZGUoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiB1bmRlZmluZWQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCwgbENvbnRhaW5lcjogTENvbnRhaW5lcik6IExDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsIGF0dHJzOiBzdHJpbmdbXSB8IG51bGwsXG4gICAgbFByb2plY3Rpb246IExQcm9qZWN0aW9uKTogTFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxOb2RlKFxuICAgIGluZGV4OiBudW1iZXIgfCBudWxsLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IG51bGwgfCB1bmRlZmluZWQsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCwgc3RhdGU/OiBudWxsIHwgTFZpZXcgfCBMQ29udGFpbmVyIHxcbiAgICAgICAgTFByb2plY3Rpb24pOiBMRWxlbWVudE5vZGUmTFRleHROb2RlJkxWaWV3Tm9kZSZMQ29udGFpbmVyTm9kZSZMUHJvamVjdGlvbk5vZGUge1xuICBjb25zdCBwYXJlbnQgPSBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnROb2RlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcmV2aW91c09yUGFyZW50Tm9kZSAmJiBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgYXMgTE5vZGU7XG4gIGxldCBxdWVyaWVzID1cbiAgICAgIChpc1BhcmVudCA/IGN1cnJlbnRRdWVyaWVzIDogcHJldmlvdXNPclBhcmVudE5vZGUgJiYgcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcykgfHxcbiAgICAgIHBhcmVudCAmJiBwYXJlbnQucXVlcmllcyAmJiBwYXJlbnQucXVlcmllcy5jaGlsZCgpO1xuICBjb25zdCBpc1N0YXRlID0gc3RhdGUgIT0gbnVsbDtcbiAgY29uc3Qgbm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZU9iamVjdCh0eXBlLCBjdXJyZW50VmlldywgcGFyZW50LCBuYXRpdmUsIGlzU3RhdGUgPyBzdGF0ZSBhcyBhbnkgOiBudWxsLCBxdWVyaWVzKTtcblxuICBpZiAoaW5kZXggPT09IG51bGwgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gVFZpZXcubm9kZS5cbiAgICBub2RlLnROb2RlID0gKHN0YXRlIGFzIExWaWV3KS50Vmlldy5ub2RlIHx8IGNyZWF0ZVROb2RlKHR5cGUsIGluZGV4LCBudWxsLCBudWxsLCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGlzIGlzIGFuIGVsZW1lbnQgb3IgY29udGFpbmVyIG9yIHByb2plY3Rpb24gbm9kZVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gICAgZGF0YVtpbmRleF0gPSBub2RlO1xuXG4gICAgLy8gRXZlcnkgbm9kZSBhZGRzIGEgdmFsdWUgdG8gdGhlIHN0YXRpYyBkYXRhIGFycmF5IHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gICAgaWYgKGluZGV4ID49IHREYXRhLmxlbmd0aCkge1xuICAgICAgY29uc3QgdE5vZGUgPSB0RGF0YVtpbmRleF0gPSBjcmVhdGVUTm9kZSh0eXBlLCBpbmRleCwgbmFtZSwgYXR0cnMsIG51bGwpO1xuICAgICAgaWYgKCFpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50Tm9kZSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG4gICAgICAgIHByZXZpb3VzVE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICBpZiAocHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkgcHJldmlvdXNUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICAgIG5vZGUudE5vZGUgPSB0RGF0YVtpbmRleF0gYXMgVE5vZGU7XG5cbiAgICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIGN1cnJlbnRRdWVyaWVzID0gbnVsbDtcbiAgICAgIGlmIChwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5jaGlsZCA9PSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnROb2RlLnZpZXcgPT09IGN1cnJlbnRWaWV3IHx8XG4gICAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgVmlldy5cbiAgICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuY2hpbGQgPSBub2RlLnROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFZpZXcgbm9kZXMgYW5kIGhvc3QgZWxlbWVudHMgbmVlZCB0byBzZXQgdGhlaXIgaG9zdCBub2RlIChjb21wb25lbnRzIHNldCBob3N0IG5vZGVzIGxhdGVyKVxuICBpZiAoKHR5cGUgJiBUTm9kZVR5cGUuVmlld09yRWxlbWVudCkgPT09IFROb2RlVHlwZS5WaWV3T3JFbGVtZW50ICYmIGlzU3RhdGUpIHtcbiAgICAvLyBCaXQgb2YgYSBoYWNrIHRvIGJ1c3QgdGhyb3VnaCB0aGUgcmVhZG9ubHkgYmVjYXVzZSB0aGVyZSBpcyBhIGNpcmN1bGFyIGRlcCBiZXR3ZWVuXG4gICAgLy8gTFZpZXcgYW5kIExOb2RlLlxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROdWxsKChzdGF0ZSBhcyBMVmlldykubm9kZSwgJ0xWaWV3Lm5vZGUgc2hvdWxkIG5vdCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQnKTtcbiAgICAoc3RhdGUgYXN7bm9kZTogTE5vZGV9KS5ub2RlID0gbm9kZTtcbiAgICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIChzdGF0ZSBhcyBMVmlldykudFZpZXcubm9kZSA9IG5vZGUudE5vZGU7XG4gIH1cblxuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IG5vZGU7XG4gIGlzUGFyZW50ID0gdHJ1ZTtcbiAgcmV0dXJuIG5vZGU7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlc2V0cyB0aGUgYXBwbGljYXRpb24gc3RhdGUuXG4gKi9cbmZ1bmN0aW9uIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpIHtcbiAgaXNQYXJlbnQgPSBmYWxzZTtcbiAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG59XG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdDogTEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMRWxlbWVudE5vZGUge1xuICBpZiAoaG9zdCA9PSBudWxsKSB7XG4gICAgcmVzZXRBcHBsaWNhdGlvblN0YXRlKCk7XG4gICAgcmVuZGVyZXJGYWN0b3J5ID0gcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk7XG4gICAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwpO1xuICAgIGhvc3QgPSBjcmVhdGVMTm9kZShcbiAgICAgICAgbnVsbCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsLFxuICAgICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICAgIC0xLCBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKSwgdFZpZXcsIG51bGwsIHt9LFxuICAgICAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgc2FuaXRpemVyKSk7XG4gIH1cbiAgY29uc3QgaG9zdFZpZXcgPSBob3N0LmRhdGEgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdFZpZXcsICdIb3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgZGVmaW5lZCBpbiBob3N0LmRhdGEuJyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdCwgaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlKTtcbiAgcmV0dXJuIGhvc3Q7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KFxuICAgIHZpZXdOb2RlOiBMVmlld05vZGUgfCBudWxsLCB0VmlldzogVFZpZXcsIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dDogVCxcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdCB8IG51bGwsXG4gICAgcGlwZXM/OiBQaXBlRGVmTGlzdCB8IG51bGwpOiBMVmlld05vZGUge1xuICBjb25zdCBfaXNQYXJlbnQgPSBpc1BhcmVudDtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnROb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGU7XG4gIGxldCBvbGRWaWV3OiBMVmlldztcbiAgbGV0IHJmOiBSZW5kZXJGbGFncyA9IFJlbmRlckZsYWdzLlVwZGF0ZTtcbiAgdHJ5IHtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSBudWxsICE7XG5cbiAgICBpZiAodmlld05vZGUgPT0gbnVsbCkge1xuICAgICAgY29uc3QgbFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgICAtMSwgcmVuZGVyZXIsIHRWaWV3LCB0ZW1wbGF0ZSwgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgZ2V0Q3VycmVudFNhbml0aXplcigpKTtcblxuICAgICAgdmlld05vZGUgPSBjcmVhdGVMTm9kZShudWxsLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbFZpZXcpO1xuICAgICAgcmYgPSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgfVxuICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld05vZGUuZGF0YSwgdmlld05vZGUpO1xuICAgIHRlbXBsYXRlKHJmLCBjb250ZXh0KTtcbiAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUpIHtcbiAgICAgIHJlZnJlc2hWaWV3KCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZpZXdOb2RlLmRhdGEudFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmaXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlIGluIGZhY3QsIG9uY2UgZm9yIGNyZWF0aW9uIG9ubHkgYW5kIHRoZW4gb25jZSBmb3JcbiAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgIGNvbnN0IGlzQ3JlYXRpb25Pbmx5ID0gKHJmICYgUmVuZGVyRmxhZ3MuQ3JlYXRlKSA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlO1xuICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIGlzQ3JlYXRpb25Pbmx5KTtcbiAgICBpc1BhcmVudCA9IF9pc1BhcmVudDtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IF9wcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgfVxuICByZXR1cm4gdmlld05vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSwgaG9zdFZpZXc6IExWaWV3LCBjb21wb25lbnRPckNvbnRleHQ6IFQsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0Vmlldywgbm9kZSk7XG4gIHRyeSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmICh0ZW1wbGF0ZSkge1xuICAgICAgdGVtcGxhdGUoZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnRPckNvbnRleHQgISk7XG4gICAgICByZWZyZXNoVmlldygpO1xuICAgIH0gZWxzZSB7XG4gICAgICBleGVjdXRlSW5pdEFuZENvbnRlbnRIb29rcygpO1xuXG4gICAgICAvLyBFbGVtZW50IHdhcyBzdG9yZWQgYXQgMCBpbiBkYXRhIGFuZCBkaXJlY3RpdmUgd2FzIHN0b3JlZCBhdCAwIGluIGRpcmVjdGl2ZXNcbiAgICAgIC8vIGluIHJlbmRlckNvbXBvbmVudCgpXG4gICAgICBzZXRIb3N0QmluZGluZ3MoX1JPT1RfRElSRUNUSVZFX0lORElDRVMpO1xuICAgICAgY29tcG9uZW50UmVmcmVzaCgwLCAwKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gQnkgZGVmYXVsdCwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW4gd2l0aCB0aGVcbiAqIGNyZWF0aW9uIGJsb2NrIHdoZW4gdGhlIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZS4gT3RoZXJ3aXNlLCB0aGUgdXBkYXRlIGJsb2NrIGlzIHJ1blxuICogYWxvbmUuXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBkbyBOT1QgdXNlIHRoaXMgY29uZmlndXJhdGlvbiAodXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkpLlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NIGVsZW1lbnQgb24gY3JlYXRpb24uXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBzdHJpbmdbXSB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IFJFbGVtZW50IHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUVsZW1lbnQrKztcbiAgY29uc3QgbmF0aXZlOiBSRWxlbWVudCA9IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuXG4gIGNvbnN0IG5vZGU6IExFbGVtZW50Tm9kZSA9XG4gICAgICBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsLCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgYXBwZW5kQ2hpbGQobm9kZS5wYXJlbnQgISwgbmF0aXZlLCBjdXJyZW50Vmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMsIGZhbHNlKTtcbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgY3VycmVudCBub2RlICh0byBjcmVhdGUgVE5vZGUpXG4gKiBAcGFyYW0gbmFtZSBUYWcgbmFtZSBvZiB0aGUgY3VycmVudCBub2RlXG4gKiBAcGFyYW0gYXR0cnMgQXR0cnMgb2YgdGhlIGN1cnJlbnQgbm9kZVxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBjdXJyZW50IG5vZGVcbiAqIEBwYXJhbSBpbmxpbmVWaWV3cyBXaGV0aGVyIG9yIG5vdCB0aGlzIG5vZGUgd2lsbCBjcmVhdGUgaW5saW5lIHZpZXdzXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCwgaW5saW5lVmlld3M6IGJvb2xlYW4pIHtcbiAgY29uc3Qgbm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlO1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG4gICAgY2FjaGVNYXRjaGluZ0RpcmVjdGl2ZXNGb3JOb2RlKG5vZGUudE5vZGUsIGN1cnJlbnRWaWV3LnRWaWV3LCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gIH0gZWxzZSB7XG4gICAgaW5zdGFudGlhdGVEaXJlY3RpdmVzRGlyZWN0bHkoKTtcbiAgfVxuICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoKTtcbn1cblxuLyoqXG4gKiBPbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB3ZSBtYXRjaCBlYWNoIG5vZGUgYWdhaW5zdCBhdmFpbGFibGUgZGlyZWN0aXZlIHNlbGVjdG9ycyBhbmQgc2F2ZVxuICogdGhlIHJlc3VsdGluZyBkZWZzIGluIHRoZSBjb3JyZWN0IGluc3RhbnRpYXRpb24gb3JkZXIgZm9yIHN1YnNlcXVlbnQgY2hhbmdlIGRldGVjdGlvbiBydW5zXG4gKiAoc28gZGVwZW5kZW5jaWVzIGFyZSBhbHdheXMgY3JlYXRlZCBiZWZvcmUgdGhlIGRpcmVjdGl2ZXMgdGhhdCBpbmplY3QgdGhlbSkuXG4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdEaXJlY3RpdmVzRm9yTm9kZShcbiAgICB0Tm9kZTogVE5vZGUsIHRWaWV3OiBUVmlldywgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG4gIGNvbnN0IG1hdGNoZXMgPSB0Vmlldy5jdXJyZW50TWF0Y2hlcyA9IGZpbmREaXJlY3RpdmVNYXRjaGVzKHROb2RlKTtcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCB2YWx1ZUluZGV4ID0gaSArIDE7XG4gICAgICByZXNvbHZlRGlyZWN0aXZlKGRlZiwgdmFsdWVJbmRleCwgbWF0Y2hlcywgdFZpZXcpO1xuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcChtYXRjaGVzW3ZhbHVlSW5kZXhdIGFzIG51bWJlciwgZGVmLCBleHBvcnRzTWFwKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuICovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Tm9kZTogVE5vZGUpOiBDdXJyZW50TWF0Y2hlc0xpc3R8bnVsbCB7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV07XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISkpIHtcbiAgICAgICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRlZi5kaVB1YmxpYykgZGVmLmRpUHVibGljKGRlZik7XG4gICAgICAgIChtYXRjaGVzIHx8IChtYXRjaGVzID0gW10pKS5wdXNoKGRlZiwgbnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzIGFzIEN1cnJlbnRNYXRjaGVzTGlzdDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdmFsdWVJbmRleDogbnVtYmVyLCBtYXRjaGVzOiBDdXJyZW50TWF0Y2hlc0xpc3QsIHRWaWV3OiBUVmlldyk6IGFueSB7XG4gIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBudWxsKSB7XG4gICAgbWF0Y2hlc1t2YWx1ZUluZGV4XSA9IENJUkNVTEFSO1xuICAgIGNvbnN0IGluc3RhbmNlID0gZGVmLmZhY3RvcnkoKTtcbiAgICAodFZpZXcuZGlyZWN0aXZlcyB8fCAodFZpZXcuZGlyZWN0aXZlcyA9IFtdKSkucHVzaChkZWYpO1xuICAgIHJldHVybiBkaXJlY3RpdmVDcmVhdGUobWF0Y2hlc1t2YWx1ZUluZGV4XSA9IHRWaWV3LmRpcmVjdGl2ZXMgIS5sZW5ndGggLSAxLCBpbnN0YW5jZSwgZGVmKTtcbiAgfSBlbHNlIGlmIChtYXRjaGVzW3ZhbHVlSW5kZXhdID09PSBDSVJDVUxBUikge1xuICAgIC8vIElmIHdlIHJldmlzaXQgdGhpcyBkaXJlY3RpdmUgYmVmb3JlIGl0J3MgcmVzb2x2ZWQsIHdlIGtub3cgaXQncyBjaXJjdWxhclxuICAgIHRocm93Q3ljbGljRGVwZW5kZW5jeUVycm9yKGRlZi50eXBlKTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5mdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soZGlySW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAoY3VycmVudFZpZXcudFZpZXcuY29tcG9uZW50cyB8fCAoY3VycmVudFZpZXcudFZpZXcuY29tcG9uZW50cyA9IFtcbiAgICAgXSkpLnB1c2goZGlySW5kZXgsIGRhdGEubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBkaXJlY3RpdmUgYW5kIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKGRpckluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChmaXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuICAoY3VycmVudFZpZXcudFZpZXcuaG9zdEJpbmRpbmdzIHx8IChjdXJyZW50Vmlldy50Vmlldy5ob3N0QmluZGluZ3MgPSBbXG4gICBdKSkucHVzaChkaXJJbmRleCwgZGF0YS5sZW5ndGggLSAxKTtcbn1cblxuLyoqIFNldHMgdGhlIGNvbnRleHQgZm9yIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdGhlIGdpdmVuIGluc3RhbmNlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRDaGFuZ2VEZXRlY3RvcklmRXhpc3RpbmcoXG4gICAgaW5qZWN0b3I6IExJbmplY3RvciB8IG51bGwsIGluc3RhbmNlOiBhbnksIHZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGlmIChpbmplY3RvciAmJiBpbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZiAhPSBudWxsKSB7XG4gICAgKGluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmIGFzIFZpZXdSZWY8YW55PikuX3NldENvbXBvbmVudENvbnRleHQodmlldywgaW5zdGFuY2UpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0NvbXBvbmVudCh0Tm9kZTogVE5vZGUpOiBib29sZWFuIHtcbiAgcmV0dXJuICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gaW5zdGFudGlhdGVzIHRoZSBnaXZlbiBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZURpcmVjdGl2ZXNEaXJlY3RseSgpIHtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcbiAgY29uc3QgY291bnQgPSB0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gIGlmIChjb3VudCA+IDApIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgdERpcmVjdGl2ZXMgPSBjdXJyZW50Vmlldy50Vmlldy5kaXJlY3RpdmVzICE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGVmOiBEaXJlY3RpdmVEZWY8YW55PiA9IHREaXJlY3RpdmVzW2ldO1xuICAgICAgZGlyZWN0aXZlQ3JlYXRlKGksIGRlZi5mYWN0b3J5KCksIGRlZik7XG4gICAgfVxuICB9XG59XG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNdID0gaW5kZXg7XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gZGF0YVtdIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSgpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID8gcHJldmlvdXNPclBhcmVudE5vZGUubmF0aXZlIDogZGlyZWN0aXZlcyAhW2luZGV4XTtcbiAgICAgIGRhdGEucHVzaCh2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB0ZW1wbGF0ZSBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZS5uZ1ByaXZhdGVEYXRhID0gY3JlYXRlVFZpZXcoZGlyZWN0aXZlcywgcGlwZXMpIGFzIG5ldmVyKTtcbn1cblxuLyoqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIGRlZnM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIHJldHVybiB7XG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IFtdLFxuICAgIGRpcmVjdGl2ZXM6IG51bGwsXG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IHRydWUsXG4gICAgaW5pdEhvb2tzOiBudWxsLFxuICAgIGNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgcGlwZURlc3Ryb3lIb29rczogbnVsbCxcbiAgICBob3N0QmluZGluZ3M6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRlZnMgPT09ICdmdW5jdGlvbicgPyBkZWZzKCkgOiBkZWZzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGN1cnJlbnRNYXRjaGVzOiBudWxsXG4gIH07XG59XG5cbmZ1bmN0aW9uIHNldFVwQXR0cmlidXRlcyhuYXRpdmU6IFJFbGVtZW50LCBhdHRyczogc3RyaW5nW10pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGF0dHJzLmxlbmd0aCAlIDIsIDAsICdlYWNoIGF0dHJpYnV0ZSBzaG91bGQgaGF2ZSBhIGtleSBhbmQgYSB2YWx1ZScpO1xuXG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lICE9PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgY29uc3QgYXR0clZhbCA9IGF0dHJzW2kgKyAxXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvYyA/IChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKS5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCkgOlxuICAgICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSgtMSk7XG4gIHJlbmRlcmVyRmFjdG9yeSA9IGZhY3Rvcnk7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIHRoZSBob3N0IExOb2RlLlxuICpcbiAqIEBwYXJhbSByTm9kZSBSZW5kZXIgaG9zdCBlbGVtZW50LlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqXG4gKiBAcmV0dXJucyBMRWxlbWVudE5vZGUgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gaG9zdEVsZW1lbnQoXG4gICAgdGFnOiBzdHJpbmcsIHJOb2RlOiBSRWxlbWVudCB8IG51bGwsIGRlZjogQ29tcG9uZW50RGVmPGFueT4sXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExFbGVtZW50Tm9kZSB7XG4gIHJlc2V0QXBwbGljYXRpb25TdGF0ZSgpO1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICAwLCBUTm9kZVR5cGUuRWxlbWVudCwgck5vZGUsIG51bGwsIG51bGwsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICAtMSwgcmVuZGVyZXIsIGdldE9yQ3JlYXRlVFZpZXcoZGVmLnRlbXBsYXRlLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzKSwgbnVsbCwgbnVsbCxcbiAgICAgICAgICBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHNhbml0aXplcikpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIG5vZGUudE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICAgIGlmIChkZWYuZGlQdWJsaWMpIGRlZi5kaVB1YmxpYyhkZWYpO1xuICAgIGN1cnJlbnRWaWV3LnRWaWV3LmRpcmVjdGl2ZXMgPSBbZGVmXTtcbiAgfVxuXG4gIHJldHVybiBub2RlO1xufVxuXG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIGNvbnN0IG5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgY29uc3QgbmF0aXZlID0gbm9kZS5uYXRpdmUgYXMgUkVsZW1lbnQ7XG5cbiAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gIC8vIGV2ZW50cyAoaW5jbHVkaW5nIG91dHB1dHMpLlxuICBjb25zdCBjbGVhbnVwRm5zID0gY2xlYW51cCB8fCAoY2xlYW51cCA9IGN1cnJlbnRWaWV3LmNsZWFudXAgPSBbXSk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJBZGRFdmVudExpc3RlbmVyKys7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICBjb25zdCB3cmFwcGVkTGlzdGVuZXIgPSB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyhjdXJyZW50VmlldywgbGlzdGVuZXJGbik7XG4gICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKG5hdGl2ZSwgZXZlbnROYW1lLCB3cmFwcGVkTGlzdGVuZXIpO1xuICAgIGNsZWFudXBGbnMucHVzaChjbGVhbnVwRm4sIG51bGwpO1xuICB9IGVsc2Uge1xuICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhEaXJ0eUFuZERlZmF1bHQoY3VycmVudFZpZXcsIGxpc3RlbmVyRm4pO1xuICAgIG5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICBjbGVhbnVwRm5zLnB1c2goZXZlbnROYW1lLCBuYXRpdmUsIHdyYXBwZWRMaXN0ZW5lciwgdXNlQ2FwdHVyZSk7XG4gIH1cblxuICBsZXQgdE5vZGU6IFROb2RlfG51bGwgPSBub2RlLnROb2RlO1xuICBpZiAodE5vZGUub3V0cHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gaWYgd2UgY3JlYXRlIFROb2RlIGhlcmUsIGlucHV0cyBtdXN0IGJlIHVuZGVmaW5lZCBzbyB3ZSBrbm93IHRoZXkgc3RpbGwgbmVlZCB0byBiZVxuICAgIC8vIGNoZWNrZWRcbiAgICB0Tm9kZS5vdXRwdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMobm9kZS50Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5PdXRwdXQpO1xuICB9XG5cbiAgY29uc3Qgb3V0cHV0cyA9IHROb2RlLm91dHB1dHM7XG4gIGxldCBvdXRwdXREYXRhOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAob3V0cHV0RGF0YSA9IG91dHB1dHNbZXZlbnROYW1lXSkpIHtcbiAgICBjcmVhdGVPdXRwdXQob3V0cHV0RGF0YSwgbGlzdGVuZXJGbik7XG4gIH1cbn1cblxuLyoqXG4gKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHBhcnRpY3VsYXIgZXZlbnQgbmFtZSBhbmQgc3Vic2NyaWJlcyB0b1xuICogZWFjaCBvdXRwdXQuXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU91dHB1dChvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIGxpc3RlbmVyOiBGdW5jdGlvbik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG91dHB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2Uob3V0cHV0c1tpXSBhcyBudW1iZXIsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gZGlyZWN0aXZlcyAhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBjbGVhbnVwICEucHVzaChzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUsIHN1YnNjcmlwdGlvbik7XG4gIH1cbn1cblxuLyoqIE1hcmsgdGhlIGVuZCBvZiB0aGUgZWxlbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50RW5kKCkge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnBhcmVudCAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBxdWVyaWVzID0gcHJldmlvdXNPclBhcmVudE5vZGUucXVlcmllcztcbiAgcXVlcmllcyAmJiBxdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudE5vZGUpO1xuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzLCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBlbGVtZW50OiBMRWxlbWVudE5vZGUgPSBkYXRhW2luZGV4XTtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQubmF0aXZlLCBuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50Lm5hdGl2ZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHN0clZhbHVlID0gc2FuaXRpemVyID09IG51bGwgPyBzdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlKTtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50Lm5hdGl2ZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQubmF0aXZlLnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBub2RlID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBjb25zdCB0Tm9kZSA9IG5vZGUudE5vZGU7XG4gIC8vIGlmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWRcbiAgaWYgKHROb2RlICYmIHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKG5vZGUudE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQpO1xuICB9XG5cbiAgY29uc3QgaW5wdXREYXRhID0gdE5vZGUgJiYgdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGNvbnN0IG5hdGl2ZSA9IG5vZGUubmF0aXZlO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFByb3BlcnR5KG5hdGl2ZSwgcHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZS5zZXRQcm9wZXJ0eSA/IG5hdGl2ZS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKG5hdGl2ZSBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyIHwgbnVsbCwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IHN0cmluZ1tdIHwgbnVsbCxcbiAgICB0Vmlld3M6IFRWaWV3W10gfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBpbmRleDogaW5kZXgsXG4gICAgZmxhZ3M6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogdFZpZXdzLFxuICAgIG5leHQ6IG51bGwsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgZHluYW1pY0NvbnRhaW5lck5vZGU6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGljZXMgYW5kIG1pbmlmaWVkIGlucHV0IG5hbWVzLCBzZXRzIHRoZVxuICogaW5wdXQgcHJvcGVydGllcyBvbiB0aGUgY29ycmVzcG9uZGluZyBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbnB1dHNbaV0gYXMgbnVtYmVyLCBkaXJlY3RpdmVzICEpO1xuICAgIGRpcmVjdGl2ZXMgIVtpbnB1dHNbaV0gYXMgbnVtYmVyXVtpbnB1dHNbaSArIDFdXSA9IHZhbHVlO1xuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGxOb2RlRmxhZ3MgbG9naWNhbCBub2RlIGZsYWdzXG4gKiBAcGFyYW0gRGlyZWN0aW9uIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIHROb2RlRmxhZ3M6IFROb2RlRmxhZ3MsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgY291bnQgPSB0Tm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBpZiAoY291bnQgPiAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyBpbiBhIGBjbGFzc0xpc3RgIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gY2xhc3NOYW1lIE5hbWUgb2YgY2xhc3MgdG8gdG9nZ2xlLiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIGNsYXNzIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzTmFtZWQ8VD4oaW5kZXg6IG51bWJlciwgY2xhc3NOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbEVsZW1lbnQgPSBkYXRhW2luZGV4XSBhcyBMRWxlbWVudE5vZGU7XG4gICAgaWYgKHZhbHVlKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQWRkQ2xhc3MrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLmFkZENsYXNzKGxFbGVtZW50Lm5hdGl2ZSwgY2xhc3NOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsRWxlbWVudC5uYXRpdmUuY2xhc3NMaXN0LmFkZChjbGFzc05hbWUpO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVDbGFzcysrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQ2xhc3MobEVsZW1lbnQubmF0aXZlLCBjbGFzc05hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZS5jbGFzc0xpc3QucmVtb3ZlKGNsYXNzTmFtZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgY2xhc3NOYW1lYCBwcm9wZXJ0eSBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBgW2NsYXNzXT1cImV4cFwiYCB1c2FnZS5cbiAqXG4gKiBgZWxlbWVudENsYXNzYCBpbnN0cnVjdGlvbiB3cml0ZXMgdGhlIHZhbHVlIHRvIHRoZSBcImVsZW1lbnQnc1wiIGBjbGFzc05hbWVgIHByb3BlcnR5LlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGEgc2V0IG9mIGNsYXNzZXMgd2hpY2ggc2hvdWxkIGJlIGFwcGxpZWQuIFRoZSBtZXRob2Qgb3ZlcnJpZGVzXG4gKiAgIGFueSBleGlzdGluZyBjbGFzc2VzLiBUaGUgdmFsdWUgaXMgc3RyaW5naWZpZWQgKGB0b1N0cmluZ2ApIGJlZm9yZSBpdCBpcyBhcHBsaWVkIHRvIHRoZVxuICogICBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgLy8gVE9ETzogVGhpcyBpcyBhIG5haXZlIGltcGxlbWVudGF0aW9uIHdoaWNoIHNpbXBseSB3cml0ZXMgdmFsdWUgdG8gdGhlIGBjbGFzc05hbWVgLiBJbiB0aGVcbiAgICAvLyBmdXR1cmVcbiAgICAvLyB3ZSB3aWxsIGFkZCBsb2dpYyBoZXJlIHdoaWNoIHdvdWxkIHdvcmsgd2l0aCB0aGUgYW5pbWF0aW9uIGNvZGUuXG4gICAgY29uc3QgbEVsZW1lbnQ6IExFbGVtZW50Tm9kZSA9IGRhdGFbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRDbGFzc05hbWUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRQcm9wZXJ0eShsRWxlbWVudC5uYXRpdmUsICdjbGFzc05hbWUnLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnY2xhc3NOYW1lJ10gPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgZ2l2ZW4gc3R5bGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gc3R5bGVOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKG51bGwgdG8gcmVtb3ZlKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gdHJhbnNmb3JtIHRoZSB2YWx1ZSB0eXBpY2FsbHkgdXNlZCBmb3JcbiAqICAgICAgICBzYW5pdGl6YXRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVOYW1lZDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZU5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHN1ZmZpeD86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlTmFtZWQ8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLFxuICAgIHN1ZmZpeE9yU2FuaXRpemVyPzogc3RyaW5nIHwgU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBsRWxlbWVudDogTEVsZW1lbnROb2RlID0gZGF0YVtpbmRleF07XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5yZW1vdmVTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgUmVuZGVyZXJTdHlsZUZsYWdzMy5EYXNoQ2FzZSkgOlxuICAgICAgICAgIGxFbGVtZW50Lm5hdGl2ZVsnc3R5bGUnXS5yZW1vdmVQcm9wZXJ0eShzdHlsZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBsZXQgc3RyVmFsdWUgPVxuICAgICAgICAgIHR5cGVvZiBzdWZmaXhPclNhbml0aXplciA9PSAnZnVuY3Rpb24nID8gc3VmZml4T3JTYW5pdGl6ZXIodmFsdWUpIDogc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgIGlmICh0eXBlb2Ygc3VmZml4T3JTYW5pdGl6ZXIgPT0gJ3N0cmluZycpIHN0clZhbHVlID0gc3RyVmFsdWUgKyBzdWZmaXhPclNhbml0aXplcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRTdHlsZShsRWxlbWVudC5uYXRpdmUsIHN0eWxlTmFtZSwgc3RyVmFsdWUsIFJlbmRlcmVyU3R5bGVGbGFnczMuRGFzaENhc2UpIDpcbiAgICAgICAgICBsRWxlbWVudC5uYXRpdmVbJ3N0eWxlJ10uc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0IHRoZSBgc3R5bGVgIHByb3BlcnR5IG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHVzYWdlLlxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIEEgdmFsdWUgaW5kaWNhdGluZyBpZiBhIGdpdmVuIHN0eWxlIHNob3VsZCBiZSBhZGRlZCBvciByZW1vdmVkLlxuICogICBUaGUgZXhwZWN0ZWQgc2hhcGUgb2YgYHZhbHVlYCBpcyBhbiBvYmplY3Qgd2hlcmUga2V5cyBhcmUgc3R5bGUgbmFtZXMgYW5kIHRoZSB2YWx1ZXNcbiAqICAgYXJlIHRoZWlyIGNvcnJlc3BvbmRpbmcgdmFsdWVzIHRvIHNldC4gSWYgdmFsdWUgaXMgZmFsc3kgdGhhbiB0aGUgc3R5bGUgaXMgcmVtb3ZlLiBBbiBhYnNlbmNlXG4gKiAgIG9mIHN0eWxlIGRvZXMgbm90IGNhdXNlIHRoYXQgc3R5bGUgdG8gYmUgcmVtb3ZlZC4gYE5PX0NIQU5HRWAgaW1wbGllcyB0aGF0IG5vIHVwZGF0ZSBzaG91bGQgYmVcbiAqICAgcGVyZm9ybWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHZhbHVlOiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIC8vIFRPRE86IFRoaXMgaXMgYSBuYWl2ZSBpbXBsZW1lbnRhdGlvbiB3aGljaCBzaW1wbHkgd3JpdGVzIHZhbHVlIHRvIHRoZSBgc3R5bGVgLiBJbiB0aGUgZnV0dXJlXG4gICAgLy8gd2Ugd2lsbCBhZGQgbG9naWMgaGVyZSB3aGljaCB3b3VsZCB3b3JrIHdpdGggdGhlIGFuaW1hdGlvbiBjb2RlLlxuICAgIGNvbnN0IGxFbGVtZW50ID0gZGF0YVtpbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRTdHlsZSsrO1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkobEVsZW1lbnQubmF0aXZlLCAnc3R5bGUnLCB2YWx1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHN0eWxlID0gbEVsZW1lbnQubmF0aXZlWydzdHlsZSddO1xuICAgICAgZm9yIChsZXQgaSA9IDAsIGtleXMgPSBPYmplY3Qua2V5cyh2YWx1ZSk7IGkgPCBrZXlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHN0eWxlTmFtZTogc3RyaW5nID0ga2V5c1tpXTtcbiAgICAgICAgY29uc3Qgc3R5bGVWYWx1ZTogYW55ID0gKHZhbHVlIGFzIGFueSlbc3R5bGVOYW1lXTtcbiAgICAgICAgaWYgKHN0eWxlVmFsdWUgPT0gbnVsbCkge1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVTdHlsZSsrO1xuICAgICAgICAgIHN0eWxlLnJlbW92ZVByb3BlcnR5KHN0eWxlTmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFN0eWxlKys7XG4gICAgICAgICAgc3R5bGUuc2V0UHJvcGVydHkoc3R5bGVOYW1lLCBzdHlsZVZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byB3cml0ZS4gVGhpcyB2YWx1ZSB3aWxsIGJlIHN0cmluZ2lmaWVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dChpbmRleDogbnVtYmVyLCB2YWx1ZT86IGFueSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4LCAtMSwgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0Tm9kZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCByZW5kZXJlcik7XG4gIGNvbnN0IG5vZGUgPSBjcmVhdGVMTm9kZShpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIHRleHROb2RlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGFwcGVuZENoaWxkKG5vZGUucGFyZW50ICEsIHRleHROb2RlLCBjdXJyZW50Vmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGJpbmQoMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgpO1xuICBsZXQgZXhpc3RpbmdOb2RlID0gZGF0YVtpbmRleF0gYXMgTFRleHROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChleGlzdGluZ05vZGUsICdMTm9kZSBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICB2YWx1ZSAhPT0gTk9fQ0hBTkdFICYmXG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZXhpc3RpbmdOb2RlLm5hdGl2ZSwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4aXN0aW5nTm9kZS5uYXRpdmUudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRGlyZWN0aXZlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBhIGRpcmVjdGl2ZS5cbiAqXG4gKiBOT1RFOiBkaXJlY3RpdmVzIGNhbiBiZSBjcmVhdGVkIGluIG9yZGVyIG90aGVyIHRoYW4gdGhlIGluZGV4IG9yZGVyLiBUaGV5IGNhbiBhbHNvXG4gKiAgICAgICBiZSByZXRyaWV2ZWQgYmVmb3JlIHRoZXkgYXJlIGNyZWF0ZWQgaW4gd2hpY2ggY2FzZSB0aGUgdmFsdWUgd2lsbCBiZSBudWxsLlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVEZWYgRGlyZWN0aXZlRGVmIG9iamVjdCB3aGljaCBjb250YWlucyBpbmZvcm1hdGlvbiBhYm91dCB0aGUgdGVtcGxhdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVDcmVhdGU8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlOiBULCBkaXJlY3RpdmVEZWY6IERpcmVjdGl2ZURlZjxUPnwgQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IGluc3RhbmNlID0gYmFzZURpcmVjdGl2ZUNyZWF0ZShpbmRleCwgZGlyZWN0aXZlLCBkaXJlY3RpdmVEZWYpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLCAncHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUnKTtcbiAgY29uc3QgdE5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZTtcblxuICBjb25zdCBpc0NvbXBvbmVudCA9IChkaXJlY3RpdmVEZWYgYXMgQ29tcG9uZW50RGVmPFQ+KS50ZW1wbGF0ZTtcbiAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgYWRkQ29tcG9uZW50TG9naWMoaW5kZXgsIGRpcmVjdGl2ZSwgZGlyZWN0aXZlRGVmIGFzIENvbXBvbmVudERlZjxUPik7XG4gIH1cblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAvLyBJbml0IGhvb2tzIGFyZSBxdWV1ZWQgbm93IHNvIG5nT25Jbml0IGlzIGNhbGxlZCBpbiBob3N0IGNvbXBvbmVudHMgYmVmb3JlXG4gICAgLy8gYW55IHByb2plY3RlZCBjb21wb25lbnRzLlxuICAgIHF1ZXVlSW5pdEhvb2tzKGluZGV4LCBkaXJlY3RpdmVEZWYub25Jbml0LCBkaXJlY3RpdmVEZWYuZG9DaGVjaywgY3VycmVudFZpZXcudFZpZXcpO1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZi5ob3N0QmluZGluZ3MpIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayhpbmRleCk7XG4gIH1cblxuICBpZiAodE5vZGUgJiYgdE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoaW5kZXgsIGluc3RhbmNlLCBkaXJlY3RpdmVEZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcoZGVmLnRlbXBsYXRlLCBkZWYuZGlyZWN0aXZlRGVmcywgZGVmLnBpcGVEZWZzKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgaG9zdFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgY3VycmVudFZpZXcsIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAtMSwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByZXZpb3VzT3JQYXJlbnROb2RlLm5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmLnJlbmRlcmVyVHlwZSksXG4gICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCBudWxsLCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgICAgICAgICAgICAgIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSkpO1xuXG4gIC8vIFdlIG5lZWQgdG8gc2V0IHRoZSBob3N0IG5vZGUvZGF0YSBoZXJlIGJlY2F1c2Ugd2hlbiB0aGUgY29tcG9uZW50IExOb2RlIHdhcyBjcmVhdGVkLFxuICAvLyB3ZSBkaWRuJ3QgeWV0IGtub3cgaXQgd2FzIGEgY29tcG9uZW50IChqdXN0IGFuIGVsZW1lbnQpLlxuICAocHJldmlvdXNPclBhcmVudE5vZGUgYXN7ZGF0YTogTFZpZXd9KS5kYXRhID0gaG9zdFZpZXc7XG4gIChob3N0VmlldyBhc3tub2RlOiBMTm9kZX0pLm5vZGUgPSBwcmV2aW91c09yUGFyZW50Tm9kZTtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB0Vmlldy5ub2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGU7XG5cbiAgaW5pdENoYW5nZURldGVjdG9ySWZFeGlzdGluZyhwcmV2aW91c09yUGFyZW50Tm9kZS5ub2RlSW5qZWN0b3IsIGluc3RhbmNlLCBob3N0Vmlldyk7XG5cbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2soaW5kZXgpO1xufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIGRpcmVjdGl2ZUNyZWF0ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50XG4gKlxuICogVGhpcyB2ZXJzaW9uIGRvZXMgbm90IGNvbnRhaW4gZmVhdHVyZXMgdGhhdCB3ZSBkb24ndCBhbHJlYWR5IHN1cHBvcnQgYXQgcm9vdCBpblxuICogY3VycmVudCBBbmd1bGFyLiBFeGFtcGxlOiBsb2NhbCByZWZzIGFuZCBpbnB1dHMgb24gcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiYXNlRGlyZWN0aXZlQ3JlYXRlPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZTogVCwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8VD58IENvbXBvbmVudERlZjxUPik6IFQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4LCAtMSwgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShcbiAgICAgIGRpcmVjdGl2ZSwgTkdfSE9TVF9TWU1CT0wsIHtlbnVtZXJhYmxlOiBmYWxzZSwgdmFsdWU6IHByZXZpb3VzT3JQYXJlbnROb2RlfSk7XG5cbiAgaWYgKGRpcmVjdGl2ZXMgPT0gbnVsbCkgY3VycmVudFZpZXcuZGlyZWN0aXZlcyA9IGRpcmVjdGl2ZXMgPSBbXTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YU5leHQoaW5kZXgsIGRpcmVjdGl2ZXMpO1xuICBkaXJlY3RpdmVzW2luZGV4XSA9IGRpcmVjdGl2ZTtcblxuICBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBjb25zdCBmbGFncyA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnROb2RlLmZsYWdzO1xuICAgIGlmICgoZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaykgPT09IDApIHtcbiAgICAgIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkOlxuICAgICAgLy8gLSBzYXZlIHRoZSBpbmRleCxcbiAgICAgIC8vIC0gc2V0IHRoZSBudW1iZXIgb2YgZGlyZWN0aXZlcyB0byAxXG4gICAgICBwcmV2aW91c09yUGFyZW50Tm9kZS50Tm9kZS5mbGFncyA9XG4gICAgICAgICAgaW5kZXggPDwgVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQgfCBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQgfCAxO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBPbmx5IG5lZWQgdG8gYnVtcCB0aGUgc2l6ZSB3aGVuIHN1YnNlcXVlbnQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZFxuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAgICAgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUuZmxhZ3MrKztcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgZGlQdWJsaWMgPSBkaXJlY3RpdmVEZWYgIS5kaVB1YmxpYztcbiAgICBpZiAoZGlQdWJsaWMpIGRpUHVibGljKGRpcmVjdGl2ZURlZiAhKTtcbiAgfVxuXG4gIGlmIChkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudE5vZGUudE5vZGUudHlwZSA9PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHNldFVwQXR0cmlidXRlcyhcbiAgICAgICAgKHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExFbGVtZW50Tm9kZSkubmF0aXZlLCBkaXJlY3RpdmVEZWYgIS5hdHRyaWJ1dGVzIGFzIHN0cmluZ1tdKTtcbiAgfVxuXG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW2luaXRpYWxJbnB1dHNbaV1dID0gaW5pdGlhbElucHV0c1tpICsgMV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGNvbnN0IG1pbmlmaWVkSW5wdXROYW1lID0gaW5wdXRzW2F0dHJOYW1lXTtcbiAgICBpZiAobWluaWZpZWRJbnB1dE5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0cyA9XG4gICAgICAgICAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gfHwgKGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gW10pO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyc1tpICsgMV0pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIHBhcmVudExOb2RlOiBMTm9kZSwgY3VycmVudFZpZXc6IExWaWV3LCB0ZW1wbGF0ZT86IENvbXBvbmVudFRlbXBsYXRlPGFueT4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwocGFyZW50TE5vZGUsICdjb250YWluZXJzIHNob3VsZCBoYXZlIGEgcGFyZW50Jyk7XG4gIHJldHVybiA8TENvbnRhaW5lcj57XG4gICAgdmlld3M6IFtdLFxuICAgIG5leHRJbmRleDogMCxcbiAgICAvLyBJZiB0aGUgZGlyZWN0IHBhcmVudCBvZiB0aGUgY29udGFpbmVyIGlzIGEgdmlldywgaXRzIHZpZXdzIHdpbGwgbmVlZCB0byBiZSBhZGRlZFxuICAgIC8vIHRocm91Z2ggaW5zZXJ0VmlldygpIHdoZW4gaXRzIHBhcmVudCB2aWV3IGlzIGJlaW5nIGluc2VydGVkOlxuICAgIHJlbmRlclBhcmVudDogY2FuSW5zZXJ0TmF0aXZlTm9kZShwYXJlbnRMTm9kZSwgY3VycmVudFZpZXcpID8gcGFyZW50TE5vZGUgOiBudWxsLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSA9PSBudWxsID8gbnVsbCA6IHRlbXBsYXRlLFxuICAgIG5leHQ6IG51bGwsXG4gICAgcGFyZW50OiBjdXJyZW50VmlldyxcbiAgICBkeW5hbWljVmlld0NvdW50OiAwLFxuICAgIHF1ZXJpZXM6IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXJOb2RlLlxuICpcbiAqIE9ubHkgYExWaWV3Tm9kZXNgIGNhbiBnbyBpbnRvIGBMQ29udGFpbmVyTm9kZXNgLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHRlbXBsYXRlIE9wdGlvbmFsIGlubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIHRhZ05hbWUgVGhlIG5hbWUgb2YgdGhlIGNvbnRhaW5lciBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJzIGF0dGFjaGVkIHRvIHRoZSBjb250YWluZXIsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKFxuICAgIGluZGV4OiBudW1iZXIsIHRlbXBsYXRlPzogQ29tcG9uZW50VGVtcGxhdGU8YW55PiwgdGFnTmFtZT86IHN0cmluZyB8IG51bGwsIGF0dHJzPzogc3RyaW5nW10sXG4gICAgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgY3VycmVudFBhcmVudCA9IGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgITtcbiAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoY3VycmVudFBhcmVudCwgY3VycmVudFZpZXcsIHRlbXBsYXRlKTtcblxuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgdW5kZWZpbmVkLCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwsIGxDb250YWluZXIpO1xuXG4gIGlmIChmaXJzdFRlbXBsYXRlUGFzcyAmJiB0ZW1wbGF0ZSA9PSBudWxsKSBub2RlLnROb2RlLnRWaWV3cyA9IFtdO1xuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKGN1cnJlbnRWaWV3LCBub2RlLmRhdGEpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzLCBsb2NhbFJlZnMsIHRlbXBsYXRlID09IG51bGwpO1xuXG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IHF1ZXJpZXMgPSBub2RlLnF1ZXJpZXM7XG4gIGlmIChxdWVyaWVzKSB7XG4gICAgLy8gY2hlY2sgaWYgYSBnaXZlbiBjb250YWluZXIgbm9kZSBtYXRjaGVzXG4gICAgcXVlcmllcy5hZGROb2RlKG5vZGUpO1xuICAgIC8vIHByZXBhcmUgcGxhY2UgZm9yIG1hdGNoaW5nIG5vZGVzIGZyb20gdmlld3MgaW5zZXJ0ZWQgaW50byBhIGdpdmVuIGNvbnRhaW5lclxuICAgIGxDb250YWluZXIucXVlcmllcyA9IHF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgpO1xuICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IGRhdGFbaW5kZXhdIGFzIExOb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBpc1BhcmVudCA9IHRydWU7XG4gIChwcmV2aW91c09yUGFyZW50Tm9kZSBhcyBMQ29udGFpbmVyTm9kZSkuZGF0YS5uZXh0SW5kZXggPSAwO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZShcbiAgICAgICAgICAgICAgICAgICAocHJldmlvdXNPclBhcmVudE5vZGUgYXMgTENvbnRhaW5lck5vZGUpLm5hdGl2ZSwgdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgIGB0aGUgY29udGFpbmVyJ3MgbmF0aXZlIGVsZW1lbnQgc2hvdWxkIG5vdCBoYXZlIGJlZW4gc2V0IHlldC5gKTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICAgIGV4ZWN1dGVJbml0SG9va3MoY3VycmVudFZpZXcsIGN1cnJlbnRWaWV3LnRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICB9XG59XG5cbi8qKlxuICogTWFya3MgdGhlIGVuZCBvZiB0aGUgTENvbnRhaW5lck5vZGUuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXJOb2RlIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgVmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBpZiAoaXNQYXJlbnQpIHtcbiAgICBpc1BhcmVudCA9IGZhbHNlO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50Tm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnBhcmVudCAhO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lciA9IHByZXZpb3VzT3JQYXJlbnROb2RlIGFzIExDb250YWluZXJOb2RlO1xuICBjb250YWluZXIubmF0aXZlID0gdW5kZWZpbmVkO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgbmV4dEluZGV4ID0gY29udGFpbmVyLmRhdGEubmV4dEluZGV4O1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGNvbnRhaW5lci5kYXRhLnZpZXdzLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcoY29udGFpbmVyLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlZnJlc2hEeW5hbWljQ2hpbGRyZW4oKSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBjdXJyZW50Vmlldy5jaGlsZDsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnQubmV4dCkge1xuICAgIGlmIChjdXJyZW50LmR5bmFtaWNWaWV3Q291bnQgIT09IDAgJiYgKGN1cnJlbnQgYXMgTENvbnRhaW5lcikudmlld3MpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyLnZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3Tm9kZSA9IGNvbnRhaW5lci52aWV3c1tpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXcgPSBsVmlld05vZGUuZGF0YTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoZHluYW1pY1ZpZXcudFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKFxuICAgICAgICAgICAgbFZpZXdOb2RlLCBkeW5hbWljVmlldy50VmlldywgZHluYW1pY1ZpZXcudGVtcGxhdGUgISwgZHluYW1pY1ZpZXcuY29udGV4dCAhLCByZW5kZXJlcik7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gY29udGFpbmVyTm9kZSB3aGVyZSB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gc3RhcnRJZHggc3RhcnRpbmcgaW5kZXggaW4gdGhlIHZpZXdzIGFycmF5IHRvIHNlYXJjaCBmcm9tXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgZXhhY3QgdmlldyBibG9jayBpZCB0byBsb29rIGZvclxuICogQHJldHVybnMgaW5kZXggb2YgYSBmb3VuZCB2aWV3IG9yIC0xIGlmIG5vdCBmb3VuZFxuICovXG5mdW5jdGlvbiBzY2FuRm9yVmlldyhcbiAgICBjb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlciwgdmlld0Jsb2NrSWQ6IG51bWJlcik6IExWaWV3Tm9kZXxudWxsIHtcbiAgY29uc3Qgdmlld3MgPSBjb250YWluZXJOb2RlLmRhdGEudmlld3M7XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldLmRhdGEuaWQ7XG4gICAgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPT09IHZpZXdCbG9ja0lkKSB7XG4gICAgICByZXR1cm4gdmlld3NbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhjb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoIGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBjb250YWluZXIgPVxuICAgICAgKGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudE5vZGUgOiBwcmV2aW91c09yUGFyZW50Tm9kZS5wYXJlbnQgISkgYXMgTENvbnRhaW5lck5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCBsQ29udGFpbmVyID0gY29udGFpbmVyLmRhdGE7XG4gIGxldCB2aWV3Tm9kZTogTFZpZXdOb2RlfG51bGwgPSBzY2FuRm9yVmlldyhjb250YWluZXIsIGxDb250YWluZXIubmV4dEluZGV4LCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdOb2RlKSB7XG4gICAgcHJldmlvdXNPclBhcmVudE5vZGUgPSB2aWV3Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBpc1BhcmVudCA9IHRydWU7XG4gICAgZW50ZXJWaWV3KHZpZXdOb2RlLmRhdGEsIHZpZXdOb2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIGNvbnN0IG5ld1ZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgdmlld0Jsb2NrSWQsIHJlbmRlcmVyLCBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcodmlld0Jsb2NrSWQsIGNvbnRhaW5lciksIG51bGwsIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gICAgaWYgKGxDb250YWluZXIucXVlcmllcykge1xuICAgICAgbmV3Vmlldy5xdWVyaWVzID0gbENvbnRhaW5lci5xdWVyaWVzLmVudGVyVmlldyhsQ29udGFpbmVyLm5leHRJbmRleCk7XG4gICAgfVxuXG4gICAgZW50ZXJWaWV3KFxuICAgICAgICBuZXdWaWV3LCB2aWV3Tm9kZSA9IGNyZWF0ZUxOb2RlKHZpZXdCbG9ja0lkLCBUTm9kZVR5cGUuVmlldywgbnVsbCwgbnVsbCwgbnVsbCwgbmV3VmlldykpO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3Tm9kZS5kYXRhKTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gcGFyZW50IFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3SW5kZXg6IG51bWJlciwgcGFyZW50OiBMQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IChwYXJlbnQgIS50Tm9kZSBhcyBUQ29udGFpbmVyTm9kZSkudFZpZXdzIGFzIFRWaWV3W107XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbnRhaW5lclRWaWV3cywgJ1RWaWV3IGV4cGVjdGVkJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChBcnJheS5pc0FycmF5KGNvbnRhaW5lclRWaWV3cyksIHRydWUsICdUVmlld3Mgc2hvdWxkIGJlIGluIGFuIGFycmF5Jyk7XG4gIGlmICh2aWV3SW5kZXggPj0gY29udGFpbmVyVFZpZXdzLmxlbmd0aCB8fCBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9PSBudWxsKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjdXJyZW50Vmlldy50VmlldztcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnkpO1xuICB9XG4gIHJldHVybiBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XTtcbn1cblxuLyoqIE1hcmtzIHRoZSBlbmQgb2YgYW4gZW1iZWRkZWQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdFbmQoKTogdm9pZCB7XG4gIHJlZnJlc2hWaWV3KCk7XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGNvbnN0IHZpZXdOb2RlID0gcHJldmlvdXNPclBhcmVudE5vZGUgPSBjdXJyZW50Vmlldy5ub2RlIGFzIExWaWV3Tm9kZTtcbiAgY29uc3QgY29udGFpbmVyTm9kZSA9IHByZXZpb3VzT3JQYXJlbnROb2RlLnBhcmVudCBhcyBMQ29udGFpbmVyTm9kZTtcbiAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUodmlld05vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNvbnRhaW5lck5vZGUuZGF0YTtcblxuICAgIGlmIChjcmVhdGlvbk1vZGUpIHtcbiAgICAgIC8vIFdoZW4gcHJvamVjdGVkIG5vZGVzIGFyZSBnb2luZyB0byBiZSBpbnNlcnRlZCwgdGhlIHJlbmRlclBhcmVudCBvZiB0aGUgZHluYW1pYyBjb250YWluZXJcbiAgICAgIC8vIHVzZWQgYnkgdGhlIFZpZXdDb250YWluZXJSZWYgbXVzdCBiZSBzZXQuXG4gICAgICBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKGxDb250YWluZXIucmVuZGVyUGFyZW50LCB2aWV3Tm9kZSk7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyhjb250YWluZXJOb2RlLCB2aWV3Tm9kZSwgbENvbnRhaW5lci5uZXh0SW5kZXgpO1xuICAgIH1cblxuICAgIGxDb250YWluZXIubmV4dEluZGV4Kys7XG4gIH1cbiAgbGVhdmVWaWV3KGN1cnJlbnRWaWV3ICEucGFyZW50ICEpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNQYXJlbnQsIGZhbHNlLCAnaXNQYXJlbnQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnROb2RlLCBUTm9kZVR5cGUuVmlldyk7XG59XG5cbi8qKlxuICogRm9yIG5vZGVzIHdoaWNoIGFyZSBwcm9qZWN0ZWQgaW5zaWRlIGFuIGVtYmVkZGVkIHZpZXcsIHRoaXMgZnVuY3Rpb24gc2V0cyB0aGUgcmVuZGVyUGFyZW50XG4gKiBvZiB0aGVpciBkeW5hbWljIExDb250YWluZXJOb2RlLlxuICogQHBhcmFtIHJlbmRlclBhcmVudCB0aGUgcmVuZGVyUGFyZW50IG9mIHRoZSBMQ29udGFpbmVyIHdoaWNoIGNvbnRhaW5zIHRoZSBlbWJlZGRlZCB2aWV3LlxuICogQHBhcmFtIHZpZXdOb2RlIHRoZSBlbWJlZGRlZCB2aWV3LlxuICovXG5mdW5jdGlvbiBzZXRSZW5kZXJQYXJlbnRJblByb2plY3RlZE5vZGVzKFxuICAgIHJlbmRlclBhcmVudDogTEVsZW1lbnROb2RlIHwgbnVsbCwgdmlld05vZGU6IExWaWV3Tm9kZSk6IHZvaWQge1xuICBpZiAocmVuZGVyUGFyZW50ICE9IG51bGwpIHtcbiAgICBsZXQgbm9kZTogTE5vZGV8bnVsbCA9IGdldENoaWxkTE5vZGUodmlld05vZGUpO1xuICAgIHdoaWxlIChub2RlKSB7XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS5oZWFkO1xuICAgICAgICBjb25zdCBsYXN0Tm9kZVRvUHJvamVjdCA9IChub2RlIGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YS50YWlsO1xuICAgICAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgICAgIGlmIChub2RlVG9Qcm9qZWN0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSkge1xuICAgICAgICAgICAgbm9kZVRvUHJvamVjdC5keW5hbWljTENvbnRhaW5lck5vZGUuZGF0YS5yZW5kZXJQYXJlbnQgPSByZW5kZXJQYXJlbnQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0ID09PSBsYXN0Tm9kZVRvUHJvamVjdCA/IG51bGwgOiBub2RlVG9Qcm9qZWN0LnBOZXh0T3JQYXJlbnQ7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIG5vZGUgPSBnZXROZXh0TE5vZGUobm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4XG4gKiBAcGFyYW0gZWxlbWVudEluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoPFQ+KGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShlbGVtZW50SW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZGF0YSAhW2VsZW1lbnRJbmRleF0gYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChlbGVtZW50LmRhdGEsIGBDb21wb25lbnQncyBob3N0IG5vZGUgc2hvdWxkIGhhdmUgYW4gTFZpZXcgYXR0YWNoZWQuYCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZWxlbWVudC5kYXRhICE7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlldy5mbGFncyAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoZGlyZWN0aXZlSW5kZXgsIGRpcmVjdGl2ZXMgISk7XG4gICAgY29uc3QgZGVmID0gY3VycmVudFZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG5cbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoXG4gICAgICAgIGhvc3RWaWV3LCBlbGVtZW50LCBkZWYsIGdldERpcmVjdGl2ZUluc3RhbmNlKGRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJbmRleF0pKTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXcuZmxhZ3MgJiBMVmlld0ZsYWdzLkF0dGFjaGVkKSA9PT0gTFZpZXdGbGFncy5BdHRhY2hlZDtcbn1cblxuLyoqXG4gKiBJbnN0cnVjdGlvbiB0byBkaXN0cmlidXRlIHByb2plY3RhYmxlIG5vZGVzIGFtb25nIDxuZy1jb250ZW50PiBvY2N1cnJlbmNlcyBpbiBhIGdpdmVuIHRlbXBsYXRlLlxuICogSXQgdGFrZXMgYWxsIHRoZSBzZWxlY3RvcnMgZnJvbSB0aGUgZW50aXJlIGNvbXBvbmVudCdzIHRlbXBsYXRlIGFuZCBkZWNpZGVzIHdoZXJlXG4gKiBlYWNoIHByb2plY3RlZCBub2RlIGJlbG9uZ3MgKGl0IHJlLWRpc3RyaWJ1dGVzIG5vZGVzIGFtb25nIFwiYnVja2V0c1wiIHdoZXJlIGVhY2ggXCJidWNrZXRcIiBpc1xuICogYmFja2VkIGJ5IGEgc2VsZWN0b3IpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcmVxdWlyZXMgQ1NTIHNlbGVjdG9ycyB0byBiZSBwcm92aWRlZCBpbiAyIGZvcm1zOiBwYXJzZWQgKGJ5IGEgY29tcGlsZXIpIGFuZCB0ZXh0LFxuICogdW4tcGFyc2VkIGZvcm0uXG4gKlxuICogVGhlIHBhcnNlZCBmb3JtIGlzIG5lZWRlZCBmb3IgZWZmaWNpZW50IG1hdGNoaW5nIG9mIGEgbm9kZSBhZ2FpbnN0IGEgZ2l2ZW4gQ1NTIHNlbGVjdG9yLlxuICogVGhlIHVuLXBhcnNlZCwgdGV4dHVhbCBmb3JtIGlzIG5lZWRlZCBmb3Igc3VwcG9ydCBvZiB0aGUgbmdQcm9qZWN0QXMgYXR0cmlidXRlLlxuICpcbiAqIEhhdmluZyBhIENTUyBzZWxlY3RvciBpbiAyIGRpZmZlcmVudCBmb3JtYXRzIGlzIG5vdCBpZGVhbCwgYnV0IGFsdGVybmF0aXZlcyBoYXZlIGV2ZW4gbW9yZVxuICogZHJhd2JhY2tzOlxuICogLSBoYXZpbmcgb25seSBhIHRleHR1YWwgZm9ybSB3b3VsZCByZXF1aXJlIHJ1bnRpbWUgcGFyc2luZyBvZiBDU1Mgc2VsZWN0b3JzO1xuICogLSB3ZSBjYW4ndCBoYXZlIG9ubHkgYSBwYXJzZWQgYXMgd2UgY2FuJ3QgcmUtY29uc3RydWN0IHRleHR1YWwgZm9ybSBmcm9tIGl0IChhcyBlbnRlcmVkIGJ5IGFcbiAqIHRlbXBsYXRlIGF1dGhvcikuXG4gKlxuICogQHBhcmFtIHNlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgcGFyc2VkIENTUyBzZWxlY3RvcnNcbiAqIEBwYXJhbSByYXdTZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIENTUyBzZWxlY3RvcnMgaW4gdGhlIHJhdywgdW4tcGFyc2VkIGZvcm1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb25EZWYoXG4gICAgaW5kZXg6IG51bWJlciwgc2VsZWN0b3JzPzogQ3NzU2VsZWN0b3JMaXN0W10sIHRleHRTZWxlY3RvcnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub09mTm9kZUJ1Y2tldHMgPSBzZWxlY3RvcnMgPyBzZWxlY3RvcnMubGVuZ3RoICsgMSA6IDE7XG4gIGNvbnN0IGRpc3RyaWJ1dGVkTm9kZXMgPSBuZXcgQXJyYXk8TE5vZGVbXT4obm9PZk5vZGVCdWNrZXRzKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub09mTm9kZUJ1Y2tldHM7IGkrKykge1xuICAgIGRpc3RyaWJ1dGVkTm9kZXNbaV0gPSBbXTtcbiAgfVxuXG4gIGNvbnN0IGNvbXBvbmVudE5vZGU6IExFbGVtZW50Tm9kZSA9IGZpbmRDb21wb25lbnRIb3N0KGN1cnJlbnRWaWV3KTtcbiAgbGV0IGNvbXBvbmVudENoaWxkOiBMTm9kZXxudWxsID0gZ2V0Q2hpbGRMTm9kZShjb21wb25lbnROb2RlKTtcblxuICB3aGlsZSAoY29tcG9uZW50Q2hpbGQgIT09IG51bGwpIHtcbiAgICAvLyBleGVjdXRlIHNlbGVjdG9yIG1hdGNoaW5nIGxvZ2ljIGlmIGFuZCBvbmx5IGlmOlxuICAgIC8vIC0gdGhlcmUgYXJlIHNlbGVjdG9ycyBkZWZpbmVkXG4gICAgLy8gLSBhIG5vZGUgaGFzIGEgdGFnIG5hbWUgLyBhdHRyaWJ1dGVzIHRoYXQgY2FuIGJlIG1hdGNoZWRcbiAgICBpZiAoc2VsZWN0b3JzICYmIGNvbXBvbmVudENoaWxkLnROb2RlKSB7XG4gICAgICBjb25zdCBtYXRjaGVkSWR4ID0gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLnROb2RlLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISk7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzW21hdGNoZWRJZHhdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBkaXN0cmlidXRlZE5vZGVzWzBdLnB1c2goY29tcG9uZW50Q2hpbGQpO1xuICAgIH1cblxuICAgIGNvbXBvbmVudENoaWxkID0gZ2V0TmV4dExOb2RlKGNvbXBvbmVudENoaWxkKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhTmV4dChpbmRleCk7XG4gIGRhdGFbaW5kZXhdID0gZGlzdHJpYnV0ZWROb2Rlcztcbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSBsaW5rZWQgbGlzdCBvZiBhIHByb2plY3Rpb24gbm9kZSwgYnkgYXBwZW5kaW5nIGFub3RoZXIgbGlua2VkIGxpc3QuXG4gKlxuICogQHBhcmFtIHByb2plY3Rpb25Ob2RlIFByb2plY3Rpb24gbm9kZSB3aG9zZSBwcm9qZWN0ZWQgbm9kZXMgbGlua2VkIGxpc3QgaGFzIHRvIGJlIHVwZGF0ZWRcbiAqIEBwYXJhbSBhcHBlbmRlZEZpcnN0IEZpcnN0IG5vZGUgb2YgdGhlIGxpbmtlZCBsaXN0IHRvIGFwcGVuZC5cbiAqIEBwYXJhbSBhcHBlbmRlZExhc3QgTGFzdCBub2RlIG9mIHRoZSBsaW5rZWQgbGlzdCB0byBhcHBlbmQuXG4gKi9cbmZ1bmN0aW9uIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgcHJvamVjdGlvbk5vZGU6IExQcm9qZWN0aW9uTm9kZSxcbiAgICBhcHBlbmRlZEZpcnN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwsXG4gICAgYXBwZW5kZWRMYXN0OiBMRWxlbWVudE5vZGUgfCBMVGV4dE5vZGUgfCBMQ29udGFpbmVyTm9kZSB8IG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgICEhYXBwZW5kZWRGaXJzdCwgISFhcHBlbmRlZExhc3QsXG4gICAgICAgICAgICAgICAgICAgJ2FwcGVuZGVkRmlyc3QgY2FuIGJlIG51bGwgaWYgYW5kIG9ubHkgaWYgYXBwZW5kZWRMYXN0IGlzIGFsc28gbnVsbCcpO1xuICBpZiAoIWFwcGVuZGVkTGFzdCkge1xuICAgIC8vIG5vdGhpbmcgdG8gYXBwZW5kXG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb2plY3Rpb25Ob2RlRGF0YSA9IHByb2plY3Rpb25Ob2RlLmRhdGE7XG4gIGlmIChwcm9qZWN0aW9uTm9kZURhdGEudGFpbCkge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS50YWlsLnBOZXh0T3JQYXJlbnQgPSBhcHBlbmRlZEZpcnN0O1xuICB9IGVsc2Uge1xuICAgIHByb2plY3Rpb25Ob2RlRGF0YS5oZWFkID0gYXBwZW5kZWRGaXJzdDtcbiAgfVxuICBwcm9qZWN0aW9uTm9kZURhdGEudGFpbCA9IGFwcGVuZGVkTGFzdDtcbiAgYXBwZW5kZWRMYXN0LnBOZXh0T3JQYXJlbnQgPSBwcm9qZWN0aW9uTm9kZTtcbn1cblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gbG9jYWxJbmRleCAtIGluZGV4IHVuZGVyIHdoaWNoIGRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0ZWQgbm9kZXMgd2FzIG1lbW9yaXplZFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24oXG4gICAgbm9kZUluZGV4OiBudW1iZXIsIGxvY2FsSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBub2RlID0gY3JlYXRlTE5vZGUoXG4gICAgICBub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsLCB7aGVhZDogbnVsbCwgdGFpbDogbnVsbH0pO1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIGlzUGFyZW50ID0gZmFsc2U7XG4gIGNvbnN0IGN1cnJlbnRQYXJlbnQgPSBub2RlLnBhcmVudDtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgbWVtb3JpemVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnROb2RlID0gZmluZENvbXBvbmVudEhvc3QoY3VycmVudFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGNvbXBvbmVudE5vZGUuZGF0YSAhO1xuICBjb25zdCBub2Rlc0ZvclNlbGVjdG9yID0gY29tcG9uZW50TFZpZXcuZGF0YSAhW2xvY2FsSW5kZXhdW3NlbGVjdG9ySW5kZXhdO1xuXG4gIC8vIGJ1aWxkIHRoZSBsaW5rZWQgbGlzdCBvZiBwcm9qZWN0ZWQgbm9kZXM6XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXNGb3JTZWxlY3Rvci5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVUb1Byb2plY3QgPSBub2Rlc0ZvclNlbGVjdG9yW2ldO1xuICAgIGlmIChub2RlVG9Qcm9qZWN0LnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBSZXByb2plY3RpbmcgYSBwcm9qZWN0aW9uIC0+IGFwcGVuZCB0aGUgbGlzdCBvZiBwcmV2aW91c2x5IHByb2plY3RlZCBub2Rlc1xuICAgICAgY29uc3QgcHJldmlvdXNseVByb2plY3RlZCA9IChub2RlVG9Qcm9qZWN0IGFzIExQcm9qZWN0aW9uTm9kZSkuZGF0YTtcbiAgICAgIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUobm9kZSwgcHJldmlvdXNseVByb2plY3RlZC5oZWFkLCBwcmV2aW91c2x5UHJvamVjdGVkLnRhaWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQcm9qZWN0aW5nIGEgc2luZ2xlIG5vZGVcbiAgICAgIGFwcGVuZFRvUHJvamVjdGlvbk5vZGUoXG4gICAgICAgICAgbm9kZSwgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSxcbiAgICAgICAgICBub2RlVG9Qcm9qZWN0IGFzIExUZXh0Tm9kZSB8IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbiAgICB9XG4gIH1cblxuICBpZiAoY2FuSW5zZXJ0TmF0aXZlTm9kZShjdXJyZW50UGFyZW50LCBjdXJyZW50VmlldykpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY3VycmVudFBhcmVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIC8vIHByb2Nlc3MgZWFjaCBub2RlIGluIHRoZSBsaXN0IG9mIHByb2plY3RlZCBub2RlczpcbiAgICBsZXQgbm9kZVRvUHJvamVjdDogTE5vZGV8bnVsbCA9IG5vZGUuZGF0YS5oZWFkO1xuICAgIGNvbnN0IGxhc3ROb2RlVG9Qcm9qZWN0ID0gbm9kZS5kYXRhLnRhaWw7XG4gICAgd2hpbGUgKG5vZGVUb1Byb2plY3QpIHtcbiAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUoXG4gICAgICAgICAgbm9kZVRvUHJvamVjdCBhcyBMVGV4dE5vZGUgfCBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSwgY3VycmVudFBhcmVudCBhcyBMRWxlbWVudE5vZGUsXG4gICAgICAgICAgY3VycmVudFZpZXcpO1xuICAgICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QgPT09IGxhc3ROb2RlVG9Qcm9qZWN0ID8gbnVsbCA6IG5vZGVUb1Byb2plY3QucE5leHRPclBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHaXZlbiBhIGN1cnJlbnQgdmlldywgZmluZHMgdGhlIG5lYXJlc3QgY29tcG9uZW50J3MgaG9zdCAoTEVsZW1lbnQpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBMVmlldyBmb3Igd2hpY2ggd2Ugd2FudCBhIGhvc3QgZWxlbWVudCBub2RlXG4gKiBAcmV0dXJucyBUaGUgaG9zdCBub2RlXG4gKi9cbmZ1bmN0aW9uIGZpbmRDb21wb25lbnRIb3N0KGxWaWV3OiBMVmlldyk6IExFbGVtZW50Tm9kZSB7XG4gIGxldCB2aWV3Um9vdExOb2RlID0gbFZpZXcubm9kZTtcbiAgd2hpbGUgKHZpZXdSb290TE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChsVmlldy5wYXJlbnQsICdsVmlldy5wYXJlbnQnKTtcbiAgICBsVmlldyA9IGxWaWV3LnBhcmVudCAhO1xuICAgIHZpZXdSb290TE5vZGUgPSBsVmlldy5ub2RlO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHZpZXdSb290TE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwodmlld1Jvb3RMTm9kZS5kYXRhLCAnbm9kZS5kYXRhJyk7XG5cbiAgcmV0dXJuIHZpZXdSb290TE5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYSBMVmlldyBvciBhIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGN1cnJlbnRWaWV3OiBMVmlldywgc3RhdGU6IFQpOiBUIHtcbiAgY3VycmVudFZpZXcudGFpbCA/IChjdXJyZW50Vmlldy50YWlsLm5leHQgPSBzdGF0ZSkgOiAoY3VycmVudFZpZXcuY2hpbGQgPSBzdGF0ZSk7XG4gIGN1cnJlbnRWaWV3LnRhaWwgPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKG5vZGU6IExFbGVtZW50Tm9kZSk6IHZvaWQge1xuICAvLyBCZWNhdXNlIGRhdGEgZmxvd3MgZG93biB0aGUgY29tcG9uZW50IHRyZWUsIGFuY2VzdG9ycyBkbyBub3QgbmVlZCB0byBiZSBtYXJrZWQgZGlydHlcbiAgaWYgKG5vZGUuZGF0YSAmJiAhKG5vZGUuZGF0YS5mbGFncyAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgbm9kZS5kYXRhLmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gTmVjZXNzYXJ5IHRvIHN1cHBvcnQgT25QdXNoIGNvbXBvbmVudHMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoRGlydHlMb2dpYyh2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IChlOiBFdmVudCkgPT5cbiAgICBhbnkge1xuICByZXR1cm4gZnVuY3Rpb24oZTogYW55KSB7XG4gICAgbWFya1ZpZXdEaXJ0eSh2aWV3KTtcbiAgICByZXR1cm4gbGlzdGVuZXJGbihlKTtcbiAgfTtcbn1cblxuLyoqXG4gKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciBzbyBpdHMgaG9zdCB2aWV3IGFuZCBpdHMgYW5jZXN0b3Igdmlld3Mgd2lsbCBiZSBtYXJrZWQgZGlydHlcbiAqIHdoZW5ldmVyIHRoZSBldmVudCBmaXJlcy4gQWxzbyB3cmFwcyB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLlxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aERpcnR5QW5kRGVmYXVsdChcbiAgICB2aWV3OiBMVmlldywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fbWFya1ZpZXdEaXJ0eShlOiBFdmVudCkge1xuICAgIG1hcmtWaWV3RGlydHkodmlldyk7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKiogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5ICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eSh2aWV3OiBMVmlldyk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3fG51bGwgPSB2aWV3O1xuXG4gIHdoaWxlIChjdXJyZW50Vmlldy5wYXJlbnQgIT0gbnVsbCkge1xuICAgIGN1cnJlbnRWaWV3LmZsYWdzIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlldy5wYXJlbnQ7XG4gIH1cbiAgY3VycmVudFZpZXcuZmxhZ3MgfD0gTFZpZXdGbGFncy5EaXJ0eTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjdXJyZW50VmlldyAhLmNvbnRleHQsICdyb290Q29udGV4dCcpO1xuICBzY2hlZHVsZVRpY2soY3VycmVudFZpZXcgIS5jb250ZXh0IGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBpZiAocm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgdGljayhyb290Q29udGV4dC5jb21wb25lbnQpO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbXBvbmVudCA9IChyb290Vmlldy5jb250ZXh0IGFzIFJvb3RDb250ZXh0KS5jb21wb25lbnQ7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUocm9vdENvbXBvbmVudCk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdE5vZGUsIHJvb3RWaWV3LCByb290Q29tcG9uZW50KTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSB0aGUgcm9vdCB2aWV3IGZyb20gYW55IGNvbXBvbmVudCBieSB3YWxraW5nIHRoZSBwYXJlbnQgYExWaWV3YCB1bnRpbFxuICogcmVhY2hpbmcgdGhlIHJvb3QgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IGFueSBjb21wb25lbnRcbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Um9vdFZpZXcoY29tcG9uZW50OiBhbnkpOiBMVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCBsRWxlbWVudE5vZGUgPSBfZ2V0Q29tcG9uZW50SG9zdExFbGVtZW50Tm9kZShjb21wb25lbnQpO1xuICBsZXQgbFZpZXcgPSBsRWxlbWVudE5vZGUudmlldztcbiAgd2hpbGUgKGxWaWV3LnBhcmVudCkge1xuICAgIGxWaWV3ID0gbFZpZXcucGFyZW50O1xuICB9XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IGhvc3ROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdE5vZGUuZGF0YSwgJ0NvbXBvbmVudCBob3N0IG5vZGUgc2hvdWxkIGJlIGF0dGFjaGVkIHRvIGFuIExWaWV3Jyk7XG4gIGNvbnN0IGNvbXBvbmVudEluZGV4ID0gaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gIGNvbnN0IGRlZiA9IGhvc3ROb2RlLnZpZXcudFZpZXcuZGlyZWN0aXZlcyAhW2NvbXBvbmVudEluZGV4XSBhcyBDb21wb25lbnREZWY8VD47XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbChob3N0Tm9kZS5kYXRhIGFzIExWaWV3LCBob3N0Tm9kZSwgZGVmLCBjb21wb25lbnQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IHRydWU7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGZhbHNlO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGhvc3ROb2RlOiBMRWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+LCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdE5vZGUpO1xuICBjb25zdCB0ZW1wbGF0ZSA9IGRlZi50ZW1wbGF0ZTtcblxuICB0cnkge1xuICAgIHRlbXBsYXRlKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoVmlldygpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gX2dldENvbXBvbmVudEhvc3RMRWxlbWVudE5vZGUoY29tcG9uZW50KTtcbiAgbWFya1ZpZXdEaXJ0eShsRWxlbWVudE5vZGUudmlldyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgaW50ZXJmYWNlIE5PX0NIQU5HRSB7XG4gIC8vIFRoaXMgaXMgYSBicmFuZCB0aGF0IGVuc3VyZXMgdGhhdCB0aGlzIHR5cGUgY2FuIG5ldmVyIG1hdGNoIGFueXRoaW5nIGVsc2VcbiAgYnJhbmQ6ICdOT19DSEFOR0UnO1xufVxuXG4vKiogQSBzcGVjaWFsIHZhbHVlIHdoaWNoIGRlc2lnbmF0ZXMgdGhhdCBhIHZhbHVlIGhhcyBub3QgY2hhbmdlZC4gKi9cbmV4cG9ydCBjb25zdCBOT19DSEFOR0UgPSB7fSBhcyBOT19DSEFOR0U7XG5cbi8qKlxuICogIEluaXRpYWxpemVzIHRoZSBiaW5kaW5nIHN0YXJ0IGluZGV4LiBXaWxsIGdldCBpbmxpbmVkLlxuICpcbiAqICBUaGlzIGZ1bmN0aW9uIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBhbnkgYmluZGluZyByZWxhdGVkIGZ1bmN0aW9uIGlzIGNhbGxlZFxuICogIChpZSBgYmluZCgpYCwgYGludGVycG9sYXRpb25YKClgLCBgcHVyZUZ1bmN0aW9uWCgpYClcbiAqL1xuZnVuY3Rpb24gaW5pdEJpbmRpbmdzKCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgY3VycmVudFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsIC0xLFxuICAgICAgICAgICAgICAgICAgICdCaW5kaW5nIHN0YXJ0IGluZGV4IHNob3VsZCBvbmx5IGJlIHNldCBvbmNlLCB3aGVuIG51bGwnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCwgLTEsXG4gICAgICAgICAgICAgICAgICAgJ0JpbmRpbmcgaW5kZXggc2hvdWxkIG5vdCB5ZXQgYmUgc2V0ICcgKyBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgpO1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA9IGRhdGEubGVuZ3RoO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IFR8Tk9fQ0hBTkdFIHtcbiAgaWYgKGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IDwgMCkge1xuICAgIGluaXRCaW5kaW5ncygpO1xuICAgIHJldHVybiBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrXSA9IHZhbHVlO1xuICB9XG5cbiAgY29uc3QgY2hhbmdlZDogYm9vbGVhbiA9XG4gICAgICB2YWx1ZSAhPT0gTk9fQ0hBTkdFICYmIGlzRGlmZmVyZW50KGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICBpZiAoY2hhbmdlZCkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoXG4gICAgICAgIGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfVxuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrKztcbiAgcmV0dXJuIGNoYW5nZWQgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBSZXNlcnZlcyBzbG90cyBmb3IgcHVyZSBmdW5jdGlvbnMgKGBwdXJlRnVuY3Rpb25YYCBpbnN0cnVjdGlvbnMpXG4gKlxuICogQmluZGluZyBmb3IgcHVyZSBmdW5jdGlvbnMgYXJlIHN0b3JlIGFmdGVyIHRoZSBMTm9kZXMgaW4gdGhlIGRhdGEgYXJyYXkgYnV0IGJlZm9yZSB0aGUgYmluZGluZy5cbiAqXG4gKiAgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICogIHwgIExOb2RlcyAuLi4gfCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIHwgcmVndWxhciBiaW5kaW5ncyAvIGludGVycG9sYXRpb25zIHxcbiAqICAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXlxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIExWaWV3LmJpbmRpbmdTdGFydEluZGV4XG4gKlxuICogUHVyZSBmdW5jdGlvbiBpbnN0cnVjdGlvbnMgYXJlIGdpdmVuIGFuIG9mZnNldCBmcm9tIExWaWV3LmJpbmRpbmdTdGFydEluZGV4LlxuICogU3VidHJhY3RpbmcgdGhlIG9mZnNldCBmcm9tIExWaWV3LmJpbmRpbmdTdGFydEluZGV4IGdpdmVzIHRoZSBmaXJzdCBpbmRleCB3aGVyZSB0aGUgYmluZGluZ3NcbiAqIGFyZSBzdG9yZWQuXG4gKlxuICogTk9URTogcmVzZXJ2ZVNsb3RzIGluc3RydWN0aW9ucyBhcmUgb25seSBldmVyIGFsbG93ZWQgYXQgdGhlIHZlcnkgZW5kIG9mIHRoZSBjcmVhdGlvbiBibG9ja1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzZXJ2ZVNsb3RzKG51bVNsb3RzOiBudW1iZXIpIHtcbiAgLy8gSW5pdCB0aGUgc2xvdHMgd2l0aCBhIHVuaXF1ZSBgTk9fQ0hBTkdFYCB2YWx1ZSBzbyB0aGF0IHRoZSBmaXJzdCBjaGFuZ2UgaXMgYWx3YXlzIGRldGVjdGVkXG4gIC8vIHdoZXRoZXIgaXMgaGFwcGVucyBvciBub3QgZHVyaW5nIHRoZSBmaXJzdCBjaGFuZ2UgZGV0ZWN0aW9uIHBhc3MgLSBwdXJlIGZ1bmN0aW9ucyBjaGVja3NcbiAgLy8gbWlnaHQgYmUgc2tpcHBlZCB3aGVuIHNob3J0LWNpcmN1aXRlZC5cbiAgZGF0YS5sZW5ndGggKz0gbnVtU2xvdHM7XG4gIGRhdGEuZmlsbChOT19DSEFOR0UsIC1udW1TbG90cyk7XG4gIC8vIFdlIG5lZWQgdG8gaW5pdGlhbGl6ZSB0aGUgYmluZGluZyBpbiBjYXNlIGEgYHB1cmVGdW5jdGlvblhgIGtpbmQgb2YgYmluZGluZyBpbnN0cnVjdGlvbiBpc1xuICAvLyBjYWxsZWQgZmlyc3QgaW4gdGhlIHVwZGF0ZSBzZWN0aW9uLlxuICBpbml0QmluZGluZ3MoKTtcbn1cblxuLyoqXG4gKiBTZXRzIHVwIHRoZSBiaW5kaW5nIGluZGV4IGJlZm9yZSBleGVjdXRlIGFueSBgcHVyZUZ1bmN0aW9uWGAgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoZSBpbmRleCBtdXN0IGJlIHJlc3RvcmVkIGFmdGVyIHRoZSBwdXJlIGZ1bmN0aW9uIGlzIGV4ZWN1dGVkXG4gKlxuICoge0BsaW5rIHJlc2VydmVTbG90c31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1vdmVCaW5kaW5nSW5kZXhUb1Jlc2VydmVkU2xvdChvZmZzZXQ6IG51bWJlcik6IG51bWJlciB7XG4gIGNvbnN0IGN1cnJlbnRTbG90ID0gY3VycmVudFZpZXcuYmluZGluZ0luZGV4O1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCAtIG9mZnNldDtcbiAgcmV0dXJuIGN1cnJlbnRTbG90O1xufVxuXG4vKipcbiAqIFJlc3RvcmVzIHRoZSBiaW5kaW5nIGluZGV4IHRvIHRoZSBnaXZlbiB2YWx1ZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIHR5cGljYWxseSB1c2VkIHRvIHJlc3RvcmUgdGhlIGluZGV4IGFmdGVyIGEgYHB1cmVGdW5jdGlvblhgIGhhc1xuICogYmVlbiBleGVjdXRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc3RvcmVCaW5kaW5nSW5kZXgoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXggPSBpbmRleDtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuXG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQodmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gc3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MCk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2MCwgdjEpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2MikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2MCwgdjEsIHYyLCB2Myk7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICtcbiAgICAgICAgICBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NCkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2NikgfHwgZGlmZmVyZW50O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgaTUgKyBzdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBpZiAoaW5kZXggPj0gdERhdGEubGVuZ3RoKSB7XG4gICAgdERhdGFbaW5kZXhdID0gbnVsbDtcbiAgfVxuICBkYXRhW2luZGV4XSA9IHZhbHVlO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSB0aGUgYGRhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXgpO1xuICByZXR1cm4gZGF0YVtpbmRleF07XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIHRoZSBgZGlyZWN0aXZlc2AgYXJyYXkuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZERpcmVjdGl2ZTxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGRpcmVjdGl2ZXMsICdEaXJlY3RpdmVzIGFycmF5IHNob3VsZCBiZSBkZWZpbmVkIGlmIHJlYWRpbmcgYSBkaXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCwgZGlyZWN0aXZlcyAhKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZXMgIVtpbmRleF07XG59XG5cbi8qKiBHZXRzIHRoZSBjdXJyZW50IGJpbmRpbmcgdmFsdWUgYW5kIGluY3JlbWVudHMgdGhlIGJpbmRpbmcgaW5kZXguICovXG5leHBvcnQgZnVuY3Rpb24gY29uc3VtZUJpbmRpbmcoKTogYW55IHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGN1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgZGF0YVtjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXhdLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIGRhdGFbY3VycmVudFZpZXcuYmluZGluZ0luZGV4KytdO1xufVxuXG4vKiogVXBkYXRlcyBiaW5kaW5nIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGl0IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkKHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuXG4gIGlmIChjdXJyZW50Vmlldy5iaW5kaW5nU3RhcnRJbmRleCA8IDApIHtcbiAgICBpbml0QmluZGluZ3MoKTtcbiAgfSBlbHNlIGlmIChpc0RpZmZlcmVudChkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoXG4gICAgICAgIGNyZWF0aW9uTW9kZSwgY2hlY2tOb0NoYW5nZXNNb2RlLCBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleF0sIHZhbHVlKTtcbiAgfSBlbHNlIHtcbiAgICBjdXJyZW50Vmlldy5iaW5kaW5nSW5kZXgrKztcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkYXRhW2N1cnJlbnRWaWV3LmJpbmRpbmdJbmRleCsrXSA9IHZhbHVlO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuLyoqIFVwZGF0ZXMgYmluZGluZyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgdGhlIGxhdGVzdCB2YWx1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZUJpbmRpbmcodmFsdWU6IGFueSk6IGFueSB7XG4gIGJpbmRpbmdVcGRhdGVkKHZhbHVlKTtcbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKiogVXBkYXRlcyAyIGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGVpdGhlciB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDIoZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoZXhwMSk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChleHAyKSB8fCBkaWZmZXJlbnQ7XG59XG5cbi8qKiBVcGRhdGVzIDQgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgYW55IHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkNChleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55LCBleHA0OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQyKGV4cDMsIGV4cDQpIHx8IGRpZmZlcmVudDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldFRWaWV3KCk6IFRWaWV3IHtcbiAgcmV0dXJuIGN1cnJlbnRWaWV3LnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGlyZWN0aXZlSW5zdGFuY2U8VD4oaW5zdGFuY2VPckFycmF5OiBUIHwgW1RdKTogVCB7XG4gIC8vIERpcmVjdGl2ZXMgd2l0aCBjb250ZW50IHF1ZXJpZXMgc3RvcmUgYW4gYXJyYXkgaW4gZGlyZWN0aXZlc1tkaXJlY3RpdmVJbmRleF1cbiAgLy8gd2l0aCB0aGUgaW5zdGFuY2UgYXMgdGhlIGZpcnN0IGluZGV4XG4gIHJldHVybiBBcnJheS5pc0FycmF5KGluc3RhbmNlT3JBcnJheSkgPyBpbnN0YW5jZU9yQXJyYXlbMF0gOiBpbnN0YW5jZU9yQXJyYXk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCkge1xuICBhc3NlcnRFcXVhbChpc1BhcmVudCwgdHJ1ZSwgJ3ByZXZpb3VzT3JQYXJlbnROb2RlIHNob3VsZCBiZSBhIHBhcmVudCcpO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIYXNQYXJlbnQoKSB7XG4gIGFzc2VydE5vdE51bGwocHJldmlvdXNPclBhcmVudE5vZGUucGFyZW50LCAncHJldmlvdXNPclBhcmVudE5vZGUgc2hvdWxkIGhhdmUgYSBwYXJlbnQnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRMZXNzVGhhbihpbmRleCwgYXJyID8gYXJyLmxlbmd0aCA6IDAsICdpbmRleCBleHBlY3RlZCB0byBiZSBhIHZhbGlkIGRhdGEgaW5kZXgnKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0RGF0YU5leHQoaW5kZXg6IG51bWJlciwgYXJyPzogYW55W10pIHtcbiAgaWYgKGFyciA9PSBudWxsKSBhcnIgPSBkYXRhO1xuICBhc3NlcnRFcXVhbChcbiAgICAgIGFyci5sZW5ndGgsIGluZGV4LCBgaW5kZXggJHtpbmRleH0gZXhwZWN0ZWQgdG8gYmUgYXQgdGhlIGVuZCBvZiBhcnIgKGxlbmd0aCAke2Fyci5sZW5ndGh9KWApO1xufVxuXG4vKipcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIHRoZSByZXNlcnZlZCBzbG90cyBzaG91bGQgYmUgc2V0IGBOT19DSEFOR0VgLlxuICpcbiAqIElmIG5vdCB0aGV5IG1pZ2h0IG5vdCBoYXZlIGJlZW4gYWN0dWFsbHkgcmVzZXJ2ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRSZXNlcnZlZFNsb3RJbml0aWFsaXplZChzbG90T2Zmc2V0OiBudW1iZXIsIG51bVNsb3RzOiBudW1iZXIpIHtcbiAgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3Qgc3RhcnRJbmRleCA9IGN1cnJlbnRWaWV3LmJpbmRpbmdTdGFydEluZGV4IC0gc2xvdE9mZnNldDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzOyBpKyspIHtcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGRhdGFbc3RhcnRJbmRleCArIGldLCBOT19DSEFOR0UsXG4gICAgICAgICAgJ1RoZSByZXNlcnZlZCBzbG90cyBzaG91bGQgYmUgc2V0IHRvIGBOT19DSEFOR0VgIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MnKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9nZXRDb21wb25lbnRIb3N0TEVsZW1lbnROb2RlPFQ+KGNvbXBvbmVudDogVCk6IExFbGVtZW50Tm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ2V4cGVjdGluZyBjb21wb25lbnQgZ290IG51bGwnKTtcbiAgY29uc3QgbEVsZW1lbnROb2RlID0gKGNvbXBvbmVudCBhcyBhbnkpW05HX0hPU1RfU1lNQk9MXSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGNvbXBvbmVudCwgJ29iamVjdCBpcyBub3QgYSBjb21wb25lbnQnKTtcbiAgcmV0dXJuIGxFbGVtZW50Tm9kZTtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcbmV4cG9ydCBjb25zdCBST09UX0RJUkVDVElWRV9JTkRJQ0VTID0gX1JPT1RfRElSRUNUSVZFX0lORElDRVM7XG4iXX0=