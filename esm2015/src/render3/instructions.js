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
import { appendChild, insertChild, insertView, appendProjectedNode, removeView, canInsertNativeNode } from './node_manipulation';
import { isNodeMatchingSelector, matchingSelectorIndex } from './node_selector_matcher';
import { RendererStyleFlags3, isProceduralRenderer } from './interfaces/renderer';
import { isDifferent, stringify } from './util';
import { executeHooks, queueLifecycleHooks, queueInitHooks, executeInitHooks } from './hooks';
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
 * Points to the next binding index to read or write to.
 */
let /** @type {?} */ bindingIndex;
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
    bindingIndex = newView && newView.bindingStartIndex || 0;
    tData = newView && newView.tView.data;
    creationMode = newView && (newView.flags & 1 /* CreationMode */) === 1 /* CreationMode */;
    firstTemplatePass = newView && newView.tView.firstTemplatePass;
    cleanup = newView && newView.cleanup;
    renderer = newView && newView.renderer;
    if (host != null) {
        previousOrParentNode = host;
        isParent = true;
    }
    currentView = newView;
    currentQueries = newView && newView.queries;
    return /** @type {?} */ ((oldView));
}
/**
 * Used in lieu of enterView to make it clear when we are exiting a child view. This makes
 * the direction of traversal (up or down the view tree) a bit clearer.
 * @param {?} newView
 * @return {?}
 */
export function leaveView(newView) {
    if (!checkNoChangesMode) {
        executeHooks(/** @type {?} */ ((directives)), currentView.tView.viewHooks, currentView.tView.viewCheckHooks, creationMode);
    }
    // Views should be clean and in update mode after being checked, so these bits are cleared
    currentView.flags &= ~(1 /* CreationMode */ | 4 /* Dirty */);
    currentView.lifecycleStage = 1 /* INIT */;
    enterView(newView, null);
}
/**
 * Refreshes directives in this view and triggers any init/content hooks.
 * @return {?}
 */
function refreshDirectives() {
    executeInitAndContentHooks();
    const /** @type {?} */ tView = currentView.tView;
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
            def.hostBindings && def.hostBindings(dirIndex, bindings[i | 1]);
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
            componentRefresh(components[i], components[i | 1]);
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
 * @param {?} viewId
 * @param {?} renderer
 * @param {?} tView
 * @param {?} template
 * @param {?} context
 * @param {?} flags
 * @return {?}
 */
export function createLView(viewId, renderer, tView, template, context, flags) {
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
        bindingStartIndex: null,
        template: template,
        context: context,
        dynamicViewCount: 0,
        lifecycleStage: 1 /* INIT */,
        queries: null,
    };
    return newView;
}
/**
 * @param {?} index
 * @param {?} type
 * @param {?} native
 * @param {?=} state
 * @return {?}
 */
export function createLNode(index, type, native, state) {
    const /** @type {?} */ parent = isParent ? previousOrParentNode :
        previousOrParentNode && /** @type {?} */ (previousOrParentNode.parent);
    let /** @type {?} */ queries = (isParent ? currentQueries : previousOrParentNode && previousOrParentNode.queries) ||
        parent && parent.queries && parent.queries.child();
    const /** @type {?} */ isState = state != null;
    const /** @type {?} */ node = {
        type: type,
        native: /** @type {?} */ (native),
        view: currentView,
        parent: /** @type {?} */ (parent),
        child: null,
        next: null,
        nodeInjector: parent ? parent.nodeInjector : null,
        data: isState ? /** @type {?} */ (state) : null,
        queries: queries,
        tNode: null,
        pNextOrParent: null
    };
    if ((type & 2 /* ViewOrElement */) === 2 /* ViewOrElement */ && isState) {
        // Bit of a hack to bust through the readonly because there is a circular dep between
        // LView and LNode.
        ngDevMode && assertNull((/** @type {?} */ (state)).node, 'LView.node should not have been initialized');
        (/** @type {?} */ ((state))).node = node;
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
            node.tNode = /** @type {?} */ (tData[index]);
        }
        // Now link ourselves into the tree.
        if (isParent) {
            currentQueries = null;
            if (previousOrParentNode.view === currentView ||
                previousOrParentNode.type === 2 /* View */) {
                // We are in the same view, which means we are adding content node to the parent View.
                ngDevMode && assertNull(previousOrParentNode.child, `previousOrParentNode's child should not have been set.`);
                previousOrParentNode.child = node;
            }
            else {
                // We are adding component view, so we don't link parent node child to this node.
            }
        }
        else if (previousOrParentNode) {
            ngDevMode && assertNull(previousOrParentNode.next, `previousOrParentNode's next property should not have been set.`);
            previousOrParentNode.next = node;
        }
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
 * @param {?=} directiveRegistry Any directive defs that should be used to match nodes to directives
 * @return {?}
 */
export function renderTemplate(hostNode, template, context, providedRendererFactory, host, directiveRegistry = null) {
    if (host == null) {
        resetApplicationState();
        rendererFactory = providedRendererFactory;
        host = createLNode(null, 3 /* Element */, hostNode, createLView(-1, providedRendererFactory.createRenderer(null, null), getOrCreateTView(template, directiveRegistry), null, {}, 2 /* CheckAlways */));
    }
    const /** @type {?} */ hostView = /** @type {?} */ ((host.data));
    ngDevMode && assertNotNull(hostView, 'Host node should have an LView defined in host.data.');
    renderComponentOrTemplate(host, hostView, context, template);
    return host;
}
/**
 * @template T
 * @param {?} viewNode
 * @param {?} template
 * @param {?} context
 * @param {?} renderer
 * @return {?}
 */
export function renderEmbeddedTemplate(viewNode, template, context, renderer) {
    const /** @type {?} */ _isParent = isParent;
    const /** @type {?} */ _previousOrParentNode = previousOrParentNode;
    try {
        isParent = true;
        previousOrParentNode = /** @type {?} */ ((null));
        let /** @type {?} */ cm = false;
        if (viewNode == null) {
            const /** @type {?} */ view = createLView(-1, renderer, createTView(currentView.tView.directiveRegistry), template, context, 2 /* CheckAlways */);
            viewNode = createLNode(null, 2 /* View */, null, view);
            cm = true;
        }
        enterView(viewNode.data, viewNode);
        template(context, cm);
        refreshDynamicChildren();
        refreshDirectives();
    }
    finally {
        leaveView(/** @type {?} */ ((/** @type {?} */ ((currentView)).parent)));
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
            template(/** @type {?} */ ((componentOrContext)), creationMode);
            refreshDirectives();
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
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param {?} index Index of the element in the data array
 * @param {?=} name Name of the DOM Node
 * @param {?=} attrs Statically bound set of attributes to be written into the DOM element on creation.
 * @param {?=} localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 * @return {?}
 */
export function elementStart(index, name, attrs, localRefs) {
    let /** @type {?} */ node;
    let /** @type {?} */ native;
    if (name == null) {
        // native node retrieval - used for exporting elements as tpl local variables (<div #foo>)
        const /** @type {?} */ node = /** @type {?} */ ((data[index]));
        native = node && (/** @type {?} */ (node)).native;
    }
    else {
        ngDevMode &&
            assertNull(currentView.bindingStartIndex, 'elements should be created before any bindings');
        native = renderer.createElement(name);
        node = createLNode(index, 3 /* Element */, /** @type {?} */ ((native)), null);
        if (attrs)
            setUpAttributes(native, attrs);
        appendChild(/** @type {?} */ ((node.parent)), native, currentView);
        if (firstTemplatePass) {
            const /** @type {?} */ tNode = createTNode(name, attrs || null, null, null);
            cacheMatchingDirectivesForNode(tNode);
            ngDevMode && assertDataInRange(index - 1);
            node.tNode = tData[index] = tNode;
            if (!isComponent(tNode)) {
                tNode.localNames = findMatchingLocalNames(null, localRefs, -1, '');
            }
        }
        hack_declareDirectives(index, localRefs);
    }
    return native;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function cacheMatchingDirectivesForNode(tNode) {
    const /** @type {?} */ registry = currentView.tView.directiveRegistry;
    const /** @type {?} */ startIndex = directives ? directives.length : 0;
    if (registry) {
        let /** @type {?} */ componentFlag = 0;
        let /** @type {?} */ size = 0;
        for (let /** @type {?} */ i = 0; i < registry.length; i++) {
            const /** @type {?} */ def = registry[i];
            if (isNodeMatchingSelector(tNode, /** @type {?} */ ((def.selector)))) {
                if ((/** @type {?} */ (def)).template) {
                    if (componentFlag)
                        throwMultipleComponentError(tNode);
                    componentFlag |= 1 /* Component */;
                }
                (currentView.tView.directives || (currentView.tView.directives = [])).push(def);
                size++;
            }
        }
        if (size > 0)
            buildTNodeFlags(tNode, startIndex, size, componentFlag);
    }
}
/**
 * @param {?} tNode
 * @param {?} index
 * @param {?} size
 * @param {?} component
 * @return {?}
 */
function buildTNodeFlags(tNode, index, size, component) {
    tNode.flags = (index << 13 /* INDX_SHIFT */) | (size << 1 /* SIZE_SHIFT */) | component;
}
/**
 * @param {?} tNode
 * @return {?}
 */
function throwMultipleComponentError(tNode) {
    throw new Error(`Multiple components match node with tagname ${tNode.tagName}`);
}
/**
 * Stores index of component's host element so it will be queued for view refresh during CD.
 * @param {?} dirIndex
 * @param {?} elIndex
 * @return {?}
 */
function queueComponentIndexForCheck(dirIndex, elIndex) {
    if (firstTemplatePass) {
        (currentView.tView.components || (currentView.tView.components = [])).push(dirIndex, elIndex);
    }
}
/**
 * Stores index of directive and host element so it will be queued for binding refresh during CD.
 * @param {?} dirIndex
 * @param {?} elIndex
 * @return {?}
 */
function queueHostBindingForCheck(dirIndex, elIndex) {
    ngDevMode &&
        assertEqual(firstTemplatePass, true, 'Should only be called in first template pass.');
    (currentView.tView.hostBindings || (currentView.tView.hostBindings = [])).push(dirIndex, elIndex);
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
    return (tNode.flags & 1 /* Component */) === 1 /* Component */;
}
/**
 * This function instantiates the given directives. It is a hack since it assumes the directives
 * come in the correct order for DI.
 * @param {?} elementIndex
 * @param {?} localRefs
 * @return {?}
 */
function hack_declareDirectives(elementIndex, localRefs) {
    const /** @type {?} */ size = (/** @type {?} */ ((previousOrParentNode.tNode)).flags & 8190 /* SIZE_MASK */) >> 1 /* SIZE_SHIFT */;
    if (size > 0) {
        let /** @type {?} */ startIndex = /** @type {?} */ ((previousOrParentNode.tNode)).flags >> 13 /* INDX_SHIFT */;
        const /** @type {?} */ endIndex = startIndex + size;
        const /** @type {?} */ tDirectives = /** @type {?} */ ((currentView.tView.directives));
        // TODO(mhevery): This assumes that the directives come in correct order, which
        // is not guaranteed. Must be refactored to take it into account.
        for (let /** @type {?} */ i = startIndex; i < endIndex; i++) {
            const /** @type {?} */ def = /** @type {?} */ (tDirectives[i]);
            directiveCreate(elementIndex, def.factory(), def, localRefs);
            startIndex++;
        }
    }
}
/**
 * Finds any local names that match the given directive's exportAs and returns them with directive
 * index. If the directiveDef is null, it matches against the default '' value instead of
 * exportAs.
 * @param {?} directiveDef
 * @param {?} localRefs
 * @param {?} index
 * @param {?=} defaultExport
 * @return {?}
 */
function findMatchingLocalNames(directiveDef, localRefs, index, defaultExport) {
    const /** @type {?} */ exportAs = directiveDef && directiveDef.exportAs || defaultExport;
    let /** @type {?} */ matches = null;
    if (exportAs != null && localRefs) {
        for (let /** @type {?} */ i = 0; i < localRefs.length; i = i + 2) {
            const /** @type {?} */ local = localRefs[i];
            const /** @type {?} */ toExportAs = localRefs[i | 1];
            if (toExportAs === exportAs || toExportAs === defaultExport) {
                (matches || (matches = [])).push(local, index);
            }
        }
    }
    return matches;
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param {?} template The template from which to get static data
 * @param {?} defs
 * @return {?} TView
 */
function getOrCreateTView(template, defs) {
    return template.ngPrivateData || (template.ngPrivateData = /** @type {?} */ (createTView(defs)));
}
/**
 * Creates a TView instance
 * @param {?} defs
 * @return {?}
 */
export function createTView(defs) {
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
        directiveRegistry: typeof defs === 'function' ? defs() : defs
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
 * @return {?} LElementNode created
 */
export function hostElement(tag, rNode, def) {
    resetApplicationState();
    const /** @type {?} */ node = createLNode(0, 3 /* Element */, rNode, createLView(-1, renderer, getOrCreateTView(def.template, def.directiveDefs), null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */));
    if (firstTemplatePass) {
        node.tNode = createTNode(/** @type {?} */ (tag), null, null, null);
        // Root directive is stored at index 0, size 1
        buildTNodeFlags(node.tNode, 0, 1, 1 /* Component */);
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
    let /** @type {?} */ tNode = /** @type {?} */ ((node.tNode));
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(/** @type {?} */ ((node.tNode)).flags, 1 /* Output */);
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
        const /** @type {?} */ subscription = /** @type {?} */ ((directives))[/** @type {?} */ (outputs[i])][outputs[i | 1]].subscribe(listener); /** @type {?} */
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
    queueLifecycleHooks(/** @type {?} */ ((previousOrParentNode.tNode)).flags, currentView);
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
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element.native, name) :
                element.native.removeAttribute(name);
        }
        else {
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
    const /** @type {?} */ tNode = /** @type {?} */ ((node.tNode));
    // if tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked
    if (tNode && tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(/** @type {?} */ ((node.tNode)).flags, 0 /* Input */);
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
        isProceduralRenderer(renderer) ? renderer.setProperty(native, propName, value) :
            (native.setProperty ? native.setProperty(propName, value) :
                (/** @type {?} */ (native))[propName] = value);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param {?} tagName
 * @param {?} attrs
 * @param {?} data
 * @param {?} localNames A list of local names and their matching indices
 * @return {?} the TNode object
 */
function createTNode(tagName, attrs, data, localNames) {
    return {
        flags: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: localNames,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        data: data
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
        ((directives))[/** @type {?} */ (inputs[i])][inputs[i | 1]] = value;
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
    const /** @type {?} */ size = (tNodeFlags & 8190 /* SIZE_MASK */) >> 1 /* SIZE_SHIFT */;
    let /** @type {?} */ propStore = null;
    if (size > 0) {
        const /** @type {?} */ start = tNodeFlags >> 13 /* INDX_SHIFT */;
        const /** @type {?} */ isInput = direction === 0 /* Input */;
        const /** @type {?} */ defs = /** @type {?} */ ((currentView.tView.directives));
        for (let /** @type {?} */ i = start, /** @type {?} */ ii = start + size; i < ii; i++) {
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
            isProceduralRenderer(renderer) ? renderer.addClass(lElement.native, className) :
                lElement.native.classList.add(className);
        }
        else {
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
            isProceduralRenderer(renderer) ?
                renderer.removeStyle(lElement.native, styleName, RendererStyleFlags3.DashCase) :
                lElement.native['style'].removeProperty(styleName);
        }
        else {
            let /** @type {?} */ strValue = typeof suffixOrSanitizer == 'function' ? suffixOrSanitizer(value) : stringify(value);
            if (typeof suffixOrSanitizer == 'string')
                strValue = strValue + suffixOrSanitizer;
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
            renderer.setProperty(lElement.native, 'style', value);
        }
        else {
            const /** @type {?} */ style = lElement.native['style'];
            for (let /** @type {?} */ i = 0, /** @type {?} */ keys = Object.keys(value); i < keys.length; i++) {
                const /** @type {?} */ styleName = keys[i];
                const /** @type {?} */ styleValue = (/** @type {?} */ (value))[styleName];
                styleValue == null ? style.removeProperty(styleName) :
                    style.setProperty(styleName, styleValue);
            }
        }
    }
}
/**
 * Create static text node
 *
 * @param {?} index Index of the node in the data array.
 * @param {?=} value Value to write. This value will be stringified.
 *   If value is not provided than the actual creation of the text node is delayed.
 * @return {?}
 */
export function text(index, value) {
    ngDevMode &&
        assertNull(currentView.bindingStartIndex, 'text nodes should be created before bindings');
    const /** @type {?} */ textNode = value != null ?
        (isProceduralRenderer(renderer) ? renderer.createText(stringify(value)) :
            renderer.createTextNode(stringify(value))) :
        null;
    const /** @type {?} */ node = createLNode(index, 3 /* Element */, textNode);
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
    ngDevMode && assertNotNull(existingNode, 'existing node');
    if (existingNode.native) {
        // If DOM node exists and value changed, update textContent
        value !== NO_CHANGE &&
            (isProceduralRenderer(renderer) ? renderer.setValue(existingNode.native, stringify(value)) :
                existingNode.native.textContent = stringify(value));
    }
    else {
        // Node was created but DOM node creation was delayed. Create and append now.
        existingNode.native = isProceduralRenderer(renderer) ?
            renderer.createText(stringify(value)) :
            renderer.createTextNode(stringify(value));
        insertChild(existingNode, currentView);
    }
}
/**
 * Create a directive.
 *
 * NOTE: directives can be created in order other than the index order. They can also
 *       be retrieved before they are created in which case the value will be null.
 *
 * @template T
 * @param {?} elementIndex Index of the host element in the data array
 * @param {?} directive The directive instance.
 * @param {?} directiveDef DirectiveDef object which contains information about the template.
 * @param {?=} localRefs Names under which a query can retrieve the directive instance
 * @return {?}
 */
export function directiveCreate(elementIndex, directive, directiveDef, localRefs) {
    const /** @type {?} */ index = directives ? directives.length : 0;
    const /** @type {?} */ instance = baseDirectiveCreate(index, directive, directiveDef);
    ngDevMode && assertNotNull(previousOrParentNode.tNode, 'previousOrParentNode.tNode');
    const /** @type {?} */ tNode = /** @type {?} */ ((previousOrParentNode.tNode));
    const /** @type {?} */ isComponent = (/** @type {?} */ (directiveDef)).template;
    if (isComponent) {
        addComponentLogic(index, elementIndex, directive, /** @type {?} */ (directiveDef));
    }
    if (firstTemplatePass) {
        // Init hooks are queued now so ngOnInit is called in host components before
        // any projected components.
        queueInitHooks(index, directiveDef.onInit, directiveDef.doCheck, currentView.tView);
        if (directiveDef.hostBindings)
            queueHostBindingForCheck(index, elementIndex);
        if (localRefs) {
            const /** @type {?} */ localNames = findMatchingLocalNames(directiveDef, localRefs, index, isComponent ? '' : undefined);
            tNode.localNames =
                localNames && tNode.localNames ? tNode.localNames.concat(localNames) : localNames;
        }
    }
    if (tNode && tNode.attrs) {
        setInputsFromAttrs(index, instance, directiveDef.inputs, tNode);
    }
    return instance;
}
/**
 * @template T
 * @param {?} index
 * @param {?} elementIndex
 * @param {?} instance
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(index, elementIndex, instance, def) {
    const /** @type {?} */ tView = getOrCreateTView(def.template, def.directiveDefs);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const /** @type {?} */ hostView = addToViewTree(createLView(-1, rendererFactory.createRenderer(/** @type {?} */ (previousOrParentNode.native), def.rendererType), tView, null, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */));
    (/** @type {?} */ (previousOrParentNode.data)) = hostView;
    (/** @type {?} */ (hostView.node)) = previousOrParentNode;
    initChangeDetectorIfExisting(previousOrParentNode.nodeInjector, instance, hostView);
    if (firstTemplatePass) {
        queueComponentIndexForCheck(index, elementIndex);
    }
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
        assertNull(currentView.bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    Object.defineProperty(directive, NG_HOST_SYMBOL, { enumerable: false, value: previousOrParentNode });
    if (directives == null)
        currentView.directives = directives = [];
    ngDevMode && assertDataNext(index, directives);
    directives[index] = directive;
    const /** @type {?} */ diPublic = /** @type {?} */ ((directiveDef)).diPublic;
    if (diPublic) {
        diPublic(/** @type {?} */ ((directiveDef)));
    }
    if (/** @type {?} */ ((directiveDef)).attributes != null && previousOrParentNode.type == 3 /* Element */) {
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
            (/** @type {?} */ (instance))[initialInputs[i]] = initialInputs[i | 1];
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
            inputsToStore.push(minifiedInputName, attrs[i | 1]);
        }
    }
    return initialInputData;
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
        assertNull(currentView.bindingStartIndex, 'container nodes should be created before any bindings');
    const /** @type {?} */ currentParent = isParent ? previousOrParentNode : /** @type {?} */ ((previousOrParentNode.parent));
    ngDevMode && assertNotNull(currentParent, 'containers should have a parent');
    const /** @type {?} */ lContainer = /** @type {?} */ ({
        views: [],
        nextIndex: 0,
        // If the direct parent of the container is a view, its views will need to be added
        // through insertView() when its parent view is being inserted:
        renderParent: canInsertNativeNode(currentParent, currentView) ? currentParent : null,
        template: template == null ? null : template,
        next: null,
        parent: currentView,
        dynamicViewCount: 0,
        queries: null
    });
    const /** @type {?} */ node = createLNode(index, 0 /* Container */, undefined, lContainer);
    if (node.tNode == null) {
        const /** @type {?} */ localNames = findMatchingLocalNames(null, localRefs, -1, '');
        node.tNode = tData[index] = createTNode(tagName || null, attrs || null, [], localNames);
    }
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(node.data);
    if (firstTemplatePass)
        cacheMatchingDirectivesForNode(node.tNode);
    hack_declareDirectives(index, localRefs);
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
                const /** @type {?} */ view = container.views[i];
                renderEmbeddedTemplate(view, /** @type {?} */ ((view.data.template)), /** @type {?} */ ((view.data.context)), renderer);
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
    const /** @type {?} */ existingViewNode = scanForView(container, lContainer.nextIndex, viewBlockId);
    if (existingViewNode) {
        previousOrParentNode = existingViewNode;
        ngDevMode && assertNodeType(previousOrParentNode, 2 /* View */);
        isParent = true;
        enterView((/** @type {?} */ (existingViewNode)).data, /** @type {?} */ (existingViewNode));
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        const /** @type {?} */ newView = createLView(viewBlockId, renderer, getOrCreateEmbeddedTView(viewBlockId, container), null, null, 2 /* CheckAlways */);
        if (lContainer.queries) {
            newView.queries = lContainer.queries.enterView(lContainer.nextIndex);
        }
        enterView(newView, createLNode(null, 2 /* View */, null, newView));
    }
    return !existingViewNode;
}
/**
 * Initialize the TView (e.g. static data) for the active embedded view.
 *
 * Each embedded view needs to set the global tData variable to the static data for
 * that view. Otherwise, the view's static data for a particular node would overwrite
 * the static data for a node in the view above it with the same index (since it's in the
 * same template).
 *
 * @param {?} viewIndex The index of the TView in TContainer
 * @param {?} parent The parent container in which to look for the view's static data
 * @return {?} TView
 */
function getOrCreateEmbeddedTView(viewIndex, parent) {
    ngDevMode && assertNodeType(parent, 0 /* Container */);
    const /** @type {?} */ tContainer = (/** @type {?} */ (((parent)).tNode)).data;
    if (viewIndex >= tContainer.length || tContainer[viewIndex] == null) {
        tContainer[viewIndex] = createTView(currentView.tView.directiveRegistry);
    }
    return tContainer[viewIndex];
}
/**
 * Marks the end of an embedded view.
 * @return {?}
 */
export function embeddedViewEnd() {
    refreshDirectives();
    isParent = false;
    const /** @type {?} */ viewNode = previousOrParentNode = /** @type {?} */ (currentView.node);
    const /** @type {?} */ containerNode = /** @type {?} */ (previousOrParentNode.parent);
    if (containerNode) {
        ngDevMode && assertNodeType(viewNode, 2 /* View */);
        ngDevMode && assertNodeType(containerNode, 0 /* Container */);
        const /** @type {?} */ lContainer = containerNode.data;
        if (creationMode) {
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
    let /** @type {?} */ componentChild = componentNode.child;
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
        componentChild = componentChild.next;
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
 * @param {?=} selectorIndex - 0 means <ng-content> without any selector
 * @param {?=} attrs - attributes attached to the ng-content node, if present
 * @return {?}
 */
export function projection(nodeIndex, localIndex, selectorIndex = 0, attrs) {
    const /** @type {?} */ node = createLNode(nodeIndex, 1 /* Projection */, null, { head: null, tail: null });
    if (node.tNode == null) {
        node.tNode = createTNode(null, attrs || null, null, null);
    }
    isParent = false; // self closing
    const /** @type {?} */ currentParent = node.parent;
    // re-distribution of projectable nodes is memorized on a component's view level
    const /** @type {?} */ componentNode = findComponentHost(currentView);
    // make sure that nodes to project were memorized
    const /** @type {?} */ nodesForSelector = /** @type {?} */ ((/** @type {?} */ ((componentNode.data)).data))[localIndex][selectorIndex];
    // build the linked list of projected nodes:
    for (let /** @type {?} */ i = 0; i < nodesForSelector.length; i++) {
        const /** @type {?} */ nodeToProject = nodesForSelector[i];
        if (nodeToProject.type === 1 /* Projection */) {
            const /** @type {?} */ previouslyProjected = (/** @type {?} */ (nodeToProject)).data;
            appendToProjectionNode(node, previouslyProjected.head, previouslyProjected.tail);
        }
        else {
            appendToProjectionNode(node, /** @type {?} */ (nodeToProject), /** @type {?} */ (nodeToProject));
        }
    }
    if (canInsertNativeNode(currentParent, currentView)) {
        // process each node in the list of projected nodes:
        let /** @type {?} */ nodeToProject = node.data.head;
        const /** @type {?} */ lastNodeToProject = node.data.tail;
        while (nodeToProject) {
            appendProjectedNode(/** @type {?} */ (nodeToProject), currentParent, currentView);
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
    while (viewRootLNode.type === 2 /* View */) {
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
 * @param {?} state The LView or LContainer to add to the view tree
 * @return {?} The state passed in
 */
export function addToViewTree(state) {
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
    return function (e) {
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
    const /** @type {?} */ componentIndex = /** @type {?} */ ((hostNode.tNode)).flags >> 13 /* INDX_SHIFT */;
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
 * Throws an ExpressionChangedAfterChecked error if checkNoChanges mode is on.
 * @param {?} oldValue
 * @param {?} currValue
 * @return {?}
 */
function throwErrorIfNoChangesMode(oldValue, currValue) {
    if (checkNoChangesMode) {
        let /** @type {?} */ msg = `ExpressionChangedAfterItHasBeenCheckedError: Expression has changed after it was checked. Previous value: '${oldValue}'. Current value: '${currValue}'.`;
        if (creationMode) {
            msg +=
                ` It seems like the view has been created after its parent and its children have been dirty checked.` +
                    ` Has it been created in a change detection hook ?`;
        }
        // TODO: include debug context
        throw new Error(msg);
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
        template(component, creationMode);
        refreshDynamicChildren();
        refreshDirectives();
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
    // `bindingIndex` is initialized when the view is first entered when not in creation mode
    ngDevMode &&
        assertEqual(creationMode, true, 'should only be called in creationMode for performance reasons');
    if (currentView.bindingStartIndex == null) {
        bindingIndex = currentView.bindingStartIndex = data.length;
    }
}
/**
 * Creates a single value binding.
 *
 * @template T
 * @param {?} value Value to diff
 * @return {?}
 */
export function bind(value) {
    if (creationMode) {
        initBindings();
        return data[bindingIndex++] = value;
    }
    const /** @type {?} */ changed = value !== NO_CHANGE && isDifferent(data[bindingIndex], value);
    if (changed) {
        throwErrorIfNoChangesMode(data[bindingIndex], value);
        data[bindingIndex] = value;
    }
    bindingIndex++;
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
    ngDevMode && assertDataInRange(bindingIndex);
    ngDevMode &&
        assertNotEqual(data[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return data[bindingIndex++];
}
/**
 * Updates binding if changed, then returns whether it was updated.
 * @param {?} value
 * @return {?}
 */
export function bindingUpdated(value) {
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    if (creationMode) {
        initBindings();
    }
    else if (isDifferent(data[bindingIndex], value)) {
        throwErrorIfNoChangesMode(data[bindingIndex], value);
    }
    else {
        bindingIndex++;
        return false;
    }
    data[bindingIndex++] = value;
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
    assertEqual(arr.length, index, 'index expected to be at the end of arr');
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
//# sourceMappingURL=instructions.js.map