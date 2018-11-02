/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import './ng_dev_mode';
import { noop } from '../util/noop';
import { assertDefined, assertEqual, assertLessThan, assertNotEqual } from './assert';
import { attachPatchData, getComponentViewByInstance } from './context_discovery';
import { diPublicInInjector, getNodeInjectable, getOrCreateInjectable, getOrCreateNodeInjectorForNode, injectAttributeImpl } from './di';
import { throwErrorIfNoChangesMode, throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, queueInitHooks, queueLifecycleHooks } from './hooks';
import { ACTIVE_INDEX, VIEWS } from './interfaces/container';
import { INJECTOR_SIZE, NodeInjectorFactory } from './interfaces/injector';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, findComponentView, getLViewChild, getRenderParent, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { assertDataInRange, assertHasParent, assertPreviousIsParent, decreaseElementDepthCount, enterView, getBindingsEnabled, getCheckNoChangesMode, getCleanup, getContextViewData, getCreationMode, getCurrentQueries, getCurrentSanitizer, getElementDepthCount, getFirstTemplatePass, getIsParent, getPreviousOrParentTNode, getRenderer, getRendererFactory, getTView, getTViewCleanup, getViewData, increaseElementDepthCount, leaveView, nextContextImpl, resetComponentState, setBindingRoot, setCheckNoChangesMode, setCurrentQueries, setFirstTemplatePass, setIsParent, setPreviousOrParentTNode, setRenderer, setRendererFactory } from './state';
import { createStylingContextTemplate, renderStyleAndClassBindings, updateClassProp as updateElementClassProp, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling/class_and_style_bindings';
import { BoundPlayerFactory } from './styling/player_factory';
import { getStylingContext } from './styling/util';
import { NO_CHANGE } from './tokens';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getRootContext, getRootView, getTNode, isComponent, isComponentDef, isDifferent, loadInternal, readPatchedLViewData, stringify } from './util';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = Promise.resolve(null);
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 */
export function refreshDescendantViews(viewData, rf) {
    var tView = getTView();
    var parentFirstTemplatePass = getFirstTemplatePass();
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = false;
    setFirstTemplatePass(false);
    // Dynamically created views must run first only in creation mode. If this is a
    // creation-only pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update-only pass.
    if (rf !== 1 /* Create */) {
        var creationMode = getCreationMode();
        var checkNoChangesMode = getCheckNoChangesMode();
        if (!checkNoChangesMode) {
            executeInitHooks(viewData, tView, creationMode);
        }
        setHostBindings(tView, viewData);
        refreshDynamicEmbeddedViews(viewData);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView);
        if (!checkNoChangesMode) {
            executeHooks(viewData, tView.contentHooks, tView.contentCheckHooks, creationMode);
        }
    }
    refreshChildComponents(tView.components, parentFirstTemplatePass, rf);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(tView, viewData) {
    if (tView.expandoInstructions) {
        var bindingRootIndex = viewData[BINDING_INDEX] = tView.expandoStartIndex;
        setBindingRoot(bindingRootIndex);
        var currentDirectiveIndex = -1;
        var currentElementIndex = -1;
        for (var i = 0; i < tView.expandoInstructions.length; i++) {
            var instruction = tView.expandoInstructions[i];
            if (typeof instruction === 'number') {
                if (instruction <= 0) {
                    // Negative numbers mean that we are starting new EXPANDO block and need to update
                    // the current element and directive index.
                    currentElementIndex = -instruction;
                    // Injector block and providers are taken into account.
                    var providerCount = tView.expandoInstructions[++i];
                    bindingRootIndex += INJECTOR_SIZE + providerCount;
                    currentDirectiveIndex = bindingRootIndex;
                }
                else {
                    // This is either the injector size (so the binding root can skip over directives
                    // and get to the first set of host bindings on this node) or the host var count
                    // (to get to the next set of host bindings on this node).
                    bindingRootIndex += instruction;
                }
                setBindingRoot(bindingRootIndex);
            }
            else {
                // If it's not a number, it's a host binding function that needs to be executed.
                viewData[BINDING_INDEX] = bindingRootIndex;
                // We must subtract the header offset because the load() instruction
                // expects a raw, unadjusted index.
                instruction(currentDirectiveIndex - HEADER_OFFSET, currentElementIndex);
                currentDirectiveIndex++;
            }
        }
    }
}
/** Refreshes content queries for all directives in the given view. */
function refreshContentQueries(tView) {
    if (tView.contentQueries != null) {
        for (var i = 0; i < tView.contentQueries.length; i += 2) {
            var directiveDefIdx = tView.contentQueries[i];
            var directiveDef = tView.data[directiveDefIdx];
            directiveDef.contentQueriesRefresh(directiveDefIdx - HEADER_OFFSET, tView.contentQueries[i + 1]);
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(components, parentFirstTemplatePass, rf) {
    if (components != null) {
        for (var i = 0; i < components.length; i++) {
            componentRefresh(components[i], parentFirstTemplatePass, rf);
        }
    }
}
export function createLViewData(renderer, tView, context, flags, sanitizer) {
    var viewData = getViewData();
    var instance = tView.blueprint.slice();
    instance[FLAGS] = flags | 1 /* CreationMode */ | 8 /* Attached */ | 16 /* RunInit */;
    instance[PARENT] = instance[DECLARATION_VIEW] = viewData;
    instance[CONTEXT] = context;
    instance[INJECTOR] = viewData ? viewData[INJECTOR] : null;
    instance[RENDERER] = renderer;
    instance[SANITIZER] = sanitizer || null;
    return instance;
}
export function createNodeAtIndex(index, type, native, name, attrs) {
    var viewData = getViewData();
    var tView = getTView();
    var adjustedIndex = index + HEADER_OFFSET;
    ngDevMode &&
        assertLessThan(adjustedIndex, viewData.length, "Slot should have been initialized with null");
    viewData[adjustedIndex] = native;
    var tNode = tView.data[adjustedIndex];
    if (tNode == null) {
        var previousOrParentTNode = getPreviousOrParentTNode();
        var isParent = getIsParent();
        tNode = tView.data[adjustedIndex] =
            createTNode(viewData, type, adjustedIndex, name, attrs, null);
        // Now link ourselves into the tree.
        if (previousOrParentTNode) {
            if (isParent && previousOrParentTNode.child == null &&
                (tNode.parent !== null || previousOrParentTNode.type === 2 /* View */)) {
                // We are in the same view, which means we are adding content node to the parent view.
                previousOrParentTNode.child = tNode;
            }
            else if (!isParent) {
                previousOrParentTNode.next = tNode;
            }
        }
    }
    if (tView.firstChild == null && type === 3 /* Element */) {
        tView.firstChild = tNode;
    }
    setPreviousOrParentTNode(tNode);
    setIsParent(true);
    return tNode;
}
export function createViewNode(index, view) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    if (view[TVIEW].node == null) {
        view[TVIEW].node = createTNode(view, 2 /* View */, index, null, null, null);
    }
    setIsParent(true);
    var tNode = view[TVIEW].node;
    setPreviousOrParentTNode(tNode);
    return view[HOST_NODE] = tNode;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 */
export function adjustBlueprintForNewNode(view) {
    var tView = view[TVIEW];
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
        tView.blueprint.push(null);
        view.push(null);
    }
}
//////////////////////////
//// Render
//////////////////////////
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
export function renderTemplate(hostNode, templateFn, consts, vars, context, providedRendererFactory, hostView, directives, pipes, sanitizer) {
    if (hostView == null) {
        resetComponentState();
        setRendererFactory(providedRendererFactory);
        var renderer = providedRendererFactory.createRenderer(null, null);
        setRenderer(renderer);
        // We need to create a root view so it's possible to look up the host element through its index
        enterView(createLViewData(renderer, createTView(-1, null, 1, 0, null, null, null), {}, 2 /* CheckAlways */ | 64 /* IsRoot */), null);
        var componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        hostView =
            createLViewData(renderer, componentTView, context, 2 /* CheckAlways */, sanitizer);
        hostView[HOST_NODE] = createNodeAtIndex(0, 3 /* Element */, hostNode, null, null);
    }
    renderComponentOrTemplate(hostView, context, null, templateFn);
    return hostView;
}
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, renderer, queries, injectorIndex) {
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    setIsParent(true);
    setPreviousOrParentTNode(null);
    var lView = createLViewData(renderer, tView, context, 2 /* CheckAlways */, getCurrentSanitizer());
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    createViewNode(-1, lView);
    if (tView.firstTemplatePass) {
        tView.node.injectorIndex = injectorIndex;
    }
    setIsParent(_isParent);
    setPreviousOrParentTNode(_previousOrParentTNode);
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
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    setIsParent(true);
    setPreviousOrParentTNode(null);
    var oldView;
    if (viewToRender[FLAGS] & 64 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(viewToRender[CONTEXT]);
    }
    else {
        try {
            setIsParent(true);
            setPreviousOrParentTNode(null);
            oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
            namespaceHTML();
            tView.template(rf, context);
            if (rf & 2 /* Update */) {
                refreshDescendantViews(viewToRender, null);
            }
            else {
                // This must be set to false immediately after the first creation run because in an
                // ngFor loop, all the views will be created together before update mode runs and turns
                // off firstTemplatePass. If we don't set it here, instances will perform directive
                // matching, etc again and again.
                viewToRender[TVIEW].firstTemplatePass = false;
                setFirstTemplatePass(false);
            }
        }
        finally {
            // renderEmbeddedTemplate() is called twice, once for creation only and then once for
            // update. When for creation only, leaveView() must not trigger view hooks, nor clean flags.
            var isCreationOnly = (rf & 1 /* Create */) === 1 /* Create */;
            leaveView(oldView, isCreationOnly);
            setIsParent(_isParent);
            setPreviousOrParentTNode(_previousOrParentTNode);
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
    return nextContextImpl(level);
}
function renderComponentOrTemplate(hostView, componentOrContext, rf, templateFn) {
    var rendererFactory = getRendererFactory();
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    try {
        if (rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (templateFn) {
            namespaceHTML();
            templateFn(rf || getRenderFlags(hostView), componentOrContext);
        }
        refreshDescendantViews(hostView, rf);
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
    var viewData = getViewData();
    var tView = getTView();
    var renderer = getRenderer();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var native = renderer.createComment(ngDevMode ? 'ng-container' : '');
    ngDevMode && assertDataInRange(index - 1);
    var tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, null, attrs || null);
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(tView, viewData, localRefs);
}
/** Mark the end of the <ng-container>. */
export function elementContainerEnd() {
    var previousOrParentTNode = getPreviousOrParentTNode();
    var tView = getTView();
    if (getIsParent()) {
        setIsParent(false);
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    var currentQueries = getCurrentQueries();
    if (currentQueries) {
        setCurrentQueries(currentQueries.addNode(previousOrParentTNode));
    }
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
    var viewData = getViewData();
    var tView = getTView();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native = elementCreate(name);
    ngDevMode && assertDataInRange(index - 1);
    var tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null);
    if (attrs) {
        setUpAttributes(native, attrs);
    }
    appendChild(native, tNode, viewData);
    createDirectivesAndLocals(tView, viewData, localRefs);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (getElementDepthCount() === 0) {
        attachPatchData(native, viewData);
    }
    increaseElementDepthCount();
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param overriddenRenderer Optional A renderer to override the default one
 * @returns the element created
 */
export function elementCreate(name, overriddenRenderer) {
    var native;
    var rendererToUse = overriddenRenderer || getRenderer();
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
 * @param localRefs Local refs of the node in question
 * @param localRefExtractor mapping function that extracts local ref value from TNode
 */
function createDirectivesAndLocals(tView, viewData, localRefs, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
    if (!getBindingsEnabled())
        return;
    var previousOrParentTNode = getPreviousOrParentTNode();
    if (getFirstTemplatePass()) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        resolveDirectives(tView, viewData, findDirectiveMatches(tView, viewData, previousOrParentTNode), previousOrParentTNode, localRefs || null);
    }
    instantiateAllDirectives(tView, viewData, previousOrParentTNode);
    saveResolvedLocalsInData(viewData, previousOrParentTNode, localRefExtractor);
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LViewData in the same order as they are loaded in the template with load().
 */
function saveResolvedLocalsInData(viewData, tNode, localRefExtractor) {
    var localNames = tNode.localNames;
    if (localNames) {
        var localIndex = tNode.index + 1;
        for (var i = 0; i < localNames.length; i += 2) {
            var index = localNames[i + 1];
            var value = index === -1 ?
                localRefExtractor(tNode, viewData) :
                viewData[index];
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
export function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery) {
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
        data: blueprint.slice(),
        childIndex: -1,
        bindingStartIndex: bindingStartIndex,
        expandoStartIndex: initialViewLength,
        expandoInstructions: null,
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
        contentQueries: null,
        components: null,
        directiveRegistry: typeof directives === 'function' ? directives() : directives,
        pipeRegistry: typeof pipes === 'function' ? pipes() : pipes,
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
    var renderer = getRenderer();
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
    setRendererFactory(factory);
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
    var viewData = getViewData();
    var tNode = getPreviousOrParentTNode();
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(tNode, viewData);
        ngDevMode && ngDevMode.rendererAddEventListener++;
        var renderer = getRenderer();
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            var cleanupFn = renderer.listen(native, eventName, listenerFn);
            storeCleanupFn(viewData, cleanupFn);
        }
        else {
            var wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            native.addEventListener(eventName, wrappedListener, useCapture);
            var cleanupInstances = getCleanup(viewData);
            cleanupInstances.push(wrappedListener);
            if (getFirstTemplatePass()) {
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
        createOutput(viewData, outputData, listenerFn);
    }
}
/**
 * Iterates through the outputs associated with a particular event name and subscribes to
 * each output.
 */
function createOutput(viewData, outputs, listener) {
    for (var i = 0; i < outputs.length; i += 2) {
        ngDevMode && assertDataInRange(outputs[i], viewData);
        var subscription = viewData[outputs[i]][outputs[i + 1]].subscribe(listener);
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
        view = getViewData();
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
    var previousOrParentTNode = getPreviousOrParentTNode();
    if (getIsParent()) {
        setIsParent(false);
    }
    else {
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    var currentQueries = getCurrentQueries();
    if (currentQueries) {
        setCurrentQueries(currentQueries.addNode(previousOrParentTNode));
    }
    queueLifecycleHooks(previousOrParentTNode.flags, getTView());
    decreaseElementDepthCount();
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
        var viewData = getViewData();
        var renderer = getRenderer();
        var element_1 = getNativeByIndex(index, viewData);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1, name) :
                element_1.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var strValue = sanitizer == null ? stringify(value) : sanitizer(value);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element_1, name, strValue) :
                element_1.setAttribute(name, strValue);
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
    var viewData = getViewData();
    var element = getNativeByIndex(index, viewData);
    var tNode = getTNode(index, viewData);
    var inputData = initializeTNodeInputs(tNode);
    var dataValue;
    if (inputData && (dataValue = inputData[propName])) {
        setInputsForProperty(viewData, dataValue, value);
        if (isComponent(tNode))
            markDirtyIfOnPush(viewData, index + HEADER_OFFSET);
    }
    else if (tNode.type === 3 /* Element */) {
        var renderer = getRenderer();
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value) : value;
        ngDevMode && ngDevMode.rendererSetProperty++;
        isProceduralRenderer(renderer) ?
            renderer.setProperty(element, propName, value) :
            (element.setProperty ? element.setProperty(propName, value) :
                element[propName] = value);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param type The type of the node
 * @param adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export function createTNode(viewData, type, adjustedIndex, tagName, attrs, tViews) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && ngDevMode.tNode++;
    var parent = getIsParent() ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && viewData && parent !== viewData[HOST_NODE];
    var tParent = parentInSameView ? parent : null;
    return {
        type: type,
        index: adjustedIndex,
        injectorIndex: tParent ? tParent.injectorIndex : -1,
        flags: 0,
        providerIndexes: 0,
        tagName: tagName,
        attrs: attrs,
        localNames: null,
        initialInputs: undefined,
        inputs: undefined,
        outputs: undefined,
        tViews: tViews,
        next: null,
        child: null,
        parent: tParent,
        detached: null,
        stylingTemplate: null,
        projection: null
    };
}
/**
 * Given a list of directive indices and minified input names, sets the
 * input properties on the corresponding directives.
 */
function setInputsForProperty(viewData, inputs, value) {
    for (var i = 0; i < inputs.length; i += 2) {
        ngDevMode && assertDataInRange(inputs[i], viewData);
        viewData[inputs[i]][inputs[i + 1]] = value;
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param number tNodeFlags node flags
 * @param Direction direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNodeFlags, direction) {
    var tView = getTView();
    var count = tNodeFlags & 4095 /* DirectiveCountMask */;
    var propStore = null;
    if (count > 0) {
        var start = tNodeFlags >> 16 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var isInput = direction === 0 /* Input */;
        var defs = tView.data;
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
    var val = (value instanceof BoundPlayerFactory) ? value : (!!value);
    updateElementClassProp(getStylingContext(index, getViewData()), stylingIndex, val);
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
    var tNode = getPreviousOrParentTNode();
    var inputData = initializeTNodeInputs(tNode);
    if (!tNode.stylingTemplate) {
        var hasClassInput = inputData && inputData.hasOwnProperty('class') ? true : false;
        if (hasClassInput) {
            tNode.flags |= 32768 /* hasClassInput */;
        }
        // initialize the styling template.
        tNode.stylingTemplate = createStylingContextTemplate(classDeclarations, styleDeclarations, styleSanitizer, hasClassInput);
    }
    if (styleDeclarations && styleDeclarations.length ||
        classDeclarations && classDeclarations.length) {
        var index = tNode.index - HEADER_OFFSET;
        if (delegateToClassInput(tNode)) {
            var stylingContext = getStylingContext(index, getViewData());
            var initialClasses = stylingContext[6 /* PreviousOrCachedMultiClassValue */];
            setInputsForProperty(getViewData(), tNode.inputs['class'], initialClasses);
        }
        elementStylingApply(index);
    }
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
    var viewData = getViewData();
    var isFirstRender = (viewData[FLAGS] & 1 /* CreationMode */) !== 0;
    var totalPlayersQueued = renderStyleAndClassBindings(getStylingContext(index, viewData), getRenderer(), viewData, isFirstRender);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(viewData);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
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
    updateElementStyleProp(getStylingContext(index, getViewData()), styleIndex, valueToAdd);
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
    var viewData = getViewData();
    var tNode = getTNode(index, viewData);
    var stylingContext = getStylingContext(index, viewData);
    if (delegateToClassInput(tNode) && classes !== NO_CHANGE) {
        var initialClasses = stylingContext[6 /* PreviousOrCachedMultiClassValue */];
        var classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + classes;
        setInputsForProperty(getViewData(), tNode.inputs['class'], classInputVal);
    }
    updateStylingMap(stylingContext, classes, styles);
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
    var viewData = getViewData();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], getTView().bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    var textNative = createTextNode(value, getRenderer());
    var tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
    // Text nodes are self closing.
    setIsParent(false);
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
        var element_2 = getNativeByIndex(index, getViewData());
        ngDevMode && assertDefined(element_2, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        var renderer = getRenderer();
        isProceduralRenderer(renderer) ? renderer.setValue(element_2, stringify(value)) :
            element_2.textContent = stringify(value);
    }
}
//////////////////////////
//// Directive
//////////////////////////
/**
 * Instantiate a root component.
 */
export function instantiateRootComponent(tView, viewData, def) {
    var rootTNode = getPreviousOrParentTNode();
    if (tView.firstTemplatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        generateExpandoInstructionBlock(tView, rootTNode, 1);
        baseResolveDirective(tView, viewData, def, def.factory);
    }
    var directive = getNodeInjectable(tView.data, viewData, viewData.length - 1, rootTNode);
    postProcessBaseDirective(viewData, rootTNode, directive, def);
    return directive;
}
/**
 * Resolve the matched directives on a node.
 */
function resolveDirectives(tView, viewData, directives, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
    ngDevMode && assertEqual(getFirstTemplatePass(), true, 'should run on first template pass only');
    var exportsMap = localRefs ? { '': -1 } : null;
    var totalHostVars = 0;
    if (directives) {
        initNodeFlags(tNode, tView.data.length, directives.length);
        // When the same token is provided by several directives on the same node, some rules apply in
        // the viewEngine:
        // - viewProviders have priority over providers
        // - the last directive in NgModule.declarations has priority over the previous one
        // So to match these rules, the order in which providers are added in the arrays is very
        // important.
        for (var i = 0; i < directives.length; i++) {
            var def = directives[i];
            if (def.providersResolver)
                def.providersResolver(def);
        }
        generateExpandoInstructionBlock(tView, tNode, directives.length);
        for (var i = 0; i < directives.length; i++) {
            var def = directives[i];
            var directiveDefIdx = tView.data.length;
            baseResolveDirective(tView, viewData, def, def.factory);
            totalHostVars += def.hostVars;
            saveNameToExportMap(tView.data.length - 1, def, exportsMap);
            // Init hooks are queued now so ngOnInit is called in host components before
            // any projected components.
            queueInitHooks(directiveDefIdx, def.onInit, def.doCheck, tView);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    prefillHostVars(tView, viewData, totalHostVars);
}
/**
 * Instantiate all the directives that were previously resolved on the current node.
 */
function instantiateAllDirectives(tView, viewData, previousOrParentTNode) {
    var start = previousOrParentTNode.flags >> 16 /* DirectiveStartingIndexShift */;
    var end = start + previousOrParentTNode.flags & 4095 /* DirectiveCountMask */;
    if (!getFirstTemplatePass() && start < end) {
        getOrCreateNodeInjectorForNode(previousOrParentTNode, viewData);
    }
    for (var i = start; i < end; i++) {
        var def = tView.data[i];
        if (isComponentDef(def)) {
            addComponentLogic(viewData, previousOrParentTNode, def);
        }
        var directive = getNodeInjectable(tView.data, viewData, i, previousOrParentTNode);
        postProcessDirective(viewData, directive, def, i);
    }
}
/**
* Generates a new block in TView.expandoInstructions for this node.
*
* Each expando block starts with the element index (turned negative so we can distinguish
* it from the hostVar count) and the directive count. See more in VIEW_DATA.md.
*/
export function generateExpandoInstructionBlock(tView, tNode, directiveCount) {
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'Expando block should only be generated on first template pass.');
    var elementIndex = -(tNode.index - HEADER_OFFSET);
    var providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    var providerCount = tView.data.length - providerStartIndex;
    (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, providerCount, directiveCount);
}
/**
* On the first template pass, we need to reserve space for host binding values
* after directives are matched (so all directives are saved, then bindings).
* Because we are updating the blueprint, we only need to do this once.
*/
export function prefillHostVars(tView, viewData, totalHostVars) {
    for (var i = 0; i < totalHostVars; i++) {
        viewData.push(NO_CHANGE);
        tView.blueprint.push(NO_CHANGE);
        tView.data.push(null);
    }
}
/**
 * Process a directive on the current node after its creation.
 */
function postProcessDirective(viewData, directive, def, directiveDefIdx) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    postProcessBaseDirective(viewData, previousOrParentTNode, directive, def);
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, directive, def.inputs, previousOrParentTNode);
    }
    if (def.contentQueries) {
        def.contentQueries(directiveDefIdx);
    }
    if (isComponentDef(def)) {
        var componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
        componentView[CONTEXT] = directive;
    }
}
/**
 * A lighter version of postProcessDirective() that is used for the root component.
 */
function postProcessBaseDirective(viewData, previousOrParentTNode, directive, def) {
    var native = getNativeByTNode(previousOrParentTNode, viewData);
    ngDevMode && assertEqual(viewData[BINDING_INDEX], getTView().bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent();
    attachPatchData(directive, viewData);
    if (native) {
        attachPatchData(native, viewData);
    }
    // TODO(misko): setUpAttributes should be a feature for better treeshakability.
    if (def.attributes != null && previousOrParentTNode.type == 3 /* Element */) {
        setUpAttributes(native, def.attributes);
    }
}
/**
* Matches the current node against all available selectors.
* If a component is matched (at most one), it is returned in first position in the array.
*/
function findDirectiveMatches(tView, viewData, tNode) {
    ngDevMode && assertEqual(getFirstTemplatePass(), true, 'should run on first template pass only');
    var registry = tView.directiveRegistry;
    var matches = null;
    if (registry) {
        for (var i = 0; i < registry.length; i++) {
            var def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors)) {
                matches || (matches = []);
                diPublicInInjector(getOrCreateNodeInjectorForNode(getPreviousOrParentTNode(), viewData), viewData, def.type);
                if (isComponentDef(def)) {
                    if (tNode.flags & 4096 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    tNode.flags = 4096 /* isComponent */;
                    // The component is always stored first with directives after.
                    matches.unshift(def);
                }
                else {
                    matches.push(def);
                }
            }
        }
    }
    return matches;
}
/** Stores index of component's host element so it will be queued for view refresh during CD. */
export function queueComponentIndexForCheck(previousOrParentTNode) {
    ngDevMode &&
        assertEqual(getFirstTemplatePass(), true, 'Should only be called in first template pass.');
    var tView = getTView();
    (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
}
/** Stores index of directive and host element so it will be queued for binding refresh during CD.
*/
function queueHostBindingForCheck(tView, def) {
    ngDevMode &&
        assertEqual(getFirstTemplatePass(), true, 'Should only be called in first template pass.');
    tView.expandoInstructions.push(def.hostBindings || noop);
    if (def.hostVars)
        tView.expandoInstructions.push(def.hostVars);
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
 * Initializes the flags on the current node, setting all indices to the initial index,
 * the directive count to 0, and adding the isComponent flag.
 * @param index the initial index
 */
export function initNodeFlags(tNode, index, numberOfDirectives) {
    ngDevMode && assertEqual(getFirstTemplatePass(), true, 'expected firstTemplatePass to be true');
    var flags = tNode.flags;
    ngDevMode && assertEqual(flags === 0 || flags === 4096 /* isComponent */, true, 'expected node flags to not be initialized');
    ngDevMode && assertNotEqual(numberOfDirectives, 4095 /* DirectiveCountMask */, 'Reached the max number of directives');
    // When the first directive is created on a node, save the index
    tNode.flags = index << 16 /* DirectiveStartingIndexShift */ | flags & 4096 /* isComponent */ |
        numberOfDirectives;
    tNode.providerIndexes = index;
}
function baseResolveDirective(tView, viewData, def, directiveFactory) {
    tView.data.push(def);
    var nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
    queueHostBindingForCheck(tView, def);
}
function addComponentLogic(viewData, previousOrParentTNode, def) {
    var native = getNativeByTNode(previousOrParentTNode, viewData);
    var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var componentView = addToViewTree(viewData, previousOrParentTNode.index, createLViewData(getRendererFactory().createRenderer(native, def), tView, null, def.onPush ? 4 /* Dirty */ : 2 /* CheckAlways */, getCurrentSanitizer()));
    componentView[HOST_NODE] = previousOrParentTNode;
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    componentView[HOST] = viewData[previousOrParentTNode.index];
    viewData[previousOrParentTNode.index] = componentView;
    if (getFirstTemplatePass()) {
        queueComponentIndexForCheck(previousOrParentTNode);
    }
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
 * @param hostNative The host element for the LContainer
 * @param hostTNode The host TNode for the LContainer
 * @param currentView The parent view of the LContainer
 * @param native The native comment element
 * @param isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @returns LContainer
 */
export function createLContainer(hostNative, hostTNode, currentView, native, isForViewContainerRef) {
    return [
        isForViewContainerRef ? -1 : 0,
        [],
        currentView,
        null,
        null,
        hostNative,
        native,
        getRenderParent(hostTNode, currentView) // renderParent
    ];
}
/**
 * Creates an LContainer for an ng-template (dynamically-inserted view), e.g.
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
    var viewData = getViewData();
    var tView = getTView();
    // TODO: consider a separate node type for templates
    var tNode = containerInternal(index, tagName || null, attrs || null);
    if (getFirstTemplatePass()) {
        tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(tView, viewData, localRefs, localRefExtractor);
    var currentQueries = getCurrentQueries();
    var previousOrParentTNode = getPreviousOrParentTNode();
    if (currentQueries) {
        setCurrentQueries(currentQueries.addNode(previousOrParentTNode));
    }
    queueLifecycleHooks(tNode.flags, tView);
    setIsParent(false);
}
/**
 * Creates an LContainer for inline views, e.g.
 *
 * % if (showing) {
 *   <div></div>
 * % }
 *
 * @param index The index of the container in the data array
 */
export function container(index) {
    var tNode = containerInternal(index, null, null);
    getFirstTemplatePass() && (tNode.tViews = []);
    setIsParent(false);
}
function containerInternal(index, tagName, attrs) {
    var viewData = getViewData();
    ngDevMode && assertEqual(viewData[BINDING_INDEX], getTView().bindingStartIndex, 'container nodes should be created before any bindings');
    var adjustedIndex = index + HEADER_OFFSET;
    var comment = getRenderer().createComment(ngDevMode ? 'container' : '');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs);
    var lContainer = viewData[adjustedIndex] =
        createLContainer(viewData[adjustedIndex], tNode, viewData, comment);
    appendChild(comment, tNode, viewData);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(viewData, index + HEADER_OFFSET, lContainer);
    var currentQueries = getCurrentQueries();
    if (currentQueries) {
        // prepare place for matching nodes from views inserted into a given container
        lContainer[QUERIES] = currentQueries.container();
    }
    ngDevMode && assertNodeType(getPreviousOrParentTNode(), 0 /* Container */);
    return tNode;
}
/**
 * Sets a container up to receive views.
 *
 * @param index The index of the container in the data array
 */
export function containerRefreshStart(index) {
    var viewData = getViewData();
    var tView = getTView();
    var previousOrParentTNode = loadInternal(index, tView.data);
    setPreviousOrParentTNode(previousOrParentTNode);
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    setIsParent(true);
    viewData[index + HEADER_OFFSET][ACTIVE_INDEX] = 0;
    if (!getCheckNoChangesMode()) {
        // We need to execute init hooks here so ngOnInit hooks are called in top level views
        // before they are called in embedded views (for backwards compatibility).
        executeInitHooks(viewData, tView, getCreationMode());
    }
}
/**
 * Marks the end of the LContainer.
 *
 * Marking the end of LContainer is the time when to child views get inserted or removed.
 */
export function containerRefreshEnd() {
    var previousOrParentTNode = getPreviousOrParentTNode();
    if (getIsParent()) {
        setIsParent(false);
    }
    else {
        ngDevMode && assertNodeType(previousOrParentTNode, 2 /* View */);
        ngDevMode && assertHasParent();
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    var lContainer = getViewData()[previousOrParentTNode.index];
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
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === -1) {
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
            // later positions in the views array - stop the searchdef.cont here
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
    var viewData = getViewData();
    var previousOrParentTNode = getPreviousOrParentTNode();
    // The previous node can be a view node if we are processing an inline for loop
    var containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        previousOrParentTNode.parent :
        previousOrParentTNode;
    var lContainer = viewData[containerTNode.index];
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    var viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
    if (viewToRender) {
        setIsParent(true);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLViewData(getRenderer(), getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 2 /* CheckAlways */, getCurrentSanitizer());
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = lContainer[QUERIES].createView();
        }
        createViewNode(viewBlockId, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (lContainer) {
        if (getCreationMode()) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, viewData, lContainer[ACTIVE_INDEX], -1);
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
    var tView = getTView();
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
    var viewData = getViewData();
    var viewHost = viewData[HOST_NODE];
    refreshDescendantViews(viewData, null);
    leaveView(viewData[PARENT]);
    setPreviousOrParentTNode(viewHost);
    setIsParent(false);
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LViewData[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(adjustedElementIndex, parentFirstTemplatePass, rf) {
    ngDevMode && assertDataInRange(adjustedElementIndex);
    var hostView = getComponentViewByIndex(adjustedElementIndex, getViewData());
    ngDevMode && assertNodeType(getTView().data[adjustedElementIndex], 3 /* Element */);
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (2 /* CheckAlways */ | 4 /* Dirty */)) {
        parentFirstTemplatePass && syncViewWithBlueprint(hostView);
        detectChangesInternal(hostView, hostView[CONTEXT], rf);
    }
}
/**
 * Syncs an LViewData instance with its blueprint if they have gotten out of sync.
 *
 * Typically, blueprints and their view instances should always be in sync, so the loop here
 * will be skipped. However, consider this case of two components side-by-side:
 *
 * App template:
 * ```
 * <comp></comp>
 * <comp></comp>
 * ```
 *
 * The following will happen:
 * 1. App template begins processing.
 * 2. First <comp> is matched as a component and its LViewData is created.
 * 3. Second <comp> is matched as a component and its LViewData is created.
 * 4. App template completes processing, so it's time to check child templates.
 * 5. First <comp> template is checked. It has a directive, so its def is pushed to blueprint.
 * 6. Second <comp> template is checked. Its blueprint has been updated by the first
 * <comp> template, but its LViewData was created before this update, so it is out of sync.
 *
 * Note that embedded views inside ngFor loops will never be out of sync because these views
 * are processed as soon as they are created.
 *
 * @param componentView The view to sync
 */
function syncViewWithBlueprint(componentView) {
    var componentTView = componentView[TVIEW];
    for (var i = componentView.length; i < componentTView.blueprint.length; i++) {
        componentView[i] = componentTView.blueprint[i];
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
    var componentNode = findComponentView(getViewData())[HOST_NODE];
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
    var viewData = getViewData();
    var tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    setIsParent(false);
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
            // This flag must be set now or we won't know that this node is projected
            // if the nodes are inserted into a container later.
            nodeToProject.flags |= 8192 /* isProjected */;
            appendProjectedNode(nodeToProject, tProjectionNode, viewData, projectedView);
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
    var tView = getTView();
    var firstTemplatePass = getFirstTemplatePass();
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
function markDirtyIfOnPush(viewData, viewIndex) {
    var view = getComponentViewByIndex(viewIndex, viewData);
    if (!(view[FLAGS] & 2 /* CheckAlways */)) {
        view[FLAGS] |= 4 /* Dirty */;
    }
}
/** Wraps an event listener with preventDefault behavior. */
function wrapListenerWithPreventDefault(listenerFn) {
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
    scheduleTick(rootContext, 1 /* DetectChanges */);
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
export function scheduleTick(rootContext, flags) {
    var nothingScheduled = rootContext.flags === 0 /* Empty */;
    rootContext.flags |= flags;
    if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
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
        renderComponentOrTemplate(readPatchedLViewData(rootComponent), rootComponent, 2 /* Update */);
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
    detectChangesInternal(getComponentViewByInstance(component), component, null);
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
    setCheckNoChangesMode(true);
    try {
        detectChanges(component);
    }
    finally {
        setCheckNoChangesMode(false);
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
    setCheckNoChangesMode(true);
    try {
        detectChangesInRootView(lViewData);
    }
    finally {
        setCheckNoChangesMode(false);
    }
}
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
function detectChangesInternal(hostView, component, rf) {
    var hostTView = hostView[TVIEW];
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    var templateFn = hostTView.template;
    var viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, rf, hostView[FLAGS], component);
        templateFn(rf || getRenderFlags(hostView), component);
        refreshDescendantViews(hostView, rf);
        updateViewQuery(viewQuery, hostView[FLAGS], component);
    }
    finally {
        leaveView(oldView, rf === 1 /* Create */);
    }
}
function createViewQuery(viewQuery, renderFlags, viewFlags, component) {
    if (viewQuery && (renderFlags === 1 /* Create */ ||
        (renderFlags === null && (viewFlags & 1 /* CreationMode */)))) {
        viewQuery(1 /* Create */, component);
    }
}
function updateViewQuery(viewQuery, flags, component) {
    if (viewQuery && flags & 2 /* Update */) {
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
    markViewDirty(getComponentViewByInstance(component));
}
///////////////////////////////
//// Bindings & interpolations
///////////////////////////////
/**
 * Creates a single value binding.
 *
 * @param value Value to diff
 */
export function bind(value) {
    return bindingUpdated(getViewData()[BINDING_INDEX]++, value) ? value : NO_CHANGE;
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
        bindingUpdated(getViewData()[BINDING_INDEX]++, values[i]) && (different = true);
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
    var different = bindingUpdated(getViewData()[BINDING_INDEX]++, v0);
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var viewData = getViewData();
    var different = bindingUpdated2(viewData[BINDING_INDEX], v0, v1);
    viewData[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var viewData = getViewData();
    var different = bindingUpdated3(viewData[BINDING_INDEX], v0, v1, v2);
    viewData[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var viewData = getViewData();
    var different = bindingUpdated4(viewData[BINDING_INDEX], v0, v1, v2, v3);
    viewData[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var viewData = getViewData();
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
    var viewData = getViewData();
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
    var viewData = getViewData();
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
    var viewData = getViewData();
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
    var tView = getTView();
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    var adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
    }
    getViewData()[adjustedIndex] = value;
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
    var contextViewData = getContextViewData();
    return loadInternal(index, contextViewData);
}
export function loadQueryList(queryListIdx) {
    var viewData = getViewData();
    ngDevMode && assertDefined(viewData[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    ngDevMode && assertDataInRange(queryListIdx, viewData[CONTENT_QUERIES]);
    return viewData[CONTENT_QUERIES][queryListIdx];
}
/** Retrieves a value from current `viewData`. */
export function load(index) {
    return loadInternal(index, getViewData());
}
/** Gets the current binding value. */
export function getBinding(bindingIndex) {
    var viewData = getViewData();
    ngDevMode && assertDataInRange(viewData[bindingIndex]);
    ngDevMode &&
        assertNotEqual(viewData[bindingIndex], NO_CHANGE, 'Stored value should never be NO_CHANGE.');
    return viewData[bindingIndex];
}
/** Updates binding if changed, then returns whether it was updated. */
export function bindingUpdated(bindingIndex, value) {
    var viewData = getViewData();
    var checkNoChangesMode = getCheckNoChangesMode();
    ngDevMode && assertNotEqual(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && assertLessThan(bindingIndex, viewData.length, "Slot should have been initialized to NO_CHANGE");
    if (viewData[bindingIndex] === NO_CHANGE) {
        viewData[bindingIndex] = value;
    }
    else if (isDifferent(viewData[bindingIndex], value, checkNoChangesMode)) {
        throwErrorIfNoChangesMode(getCreationMode(), checkNoChangesMode, viewData[bindingIndex], value);
        viewData[bindingIndex] = value;
    }
    else {
        return false;
    }
    return true;
}
/** Updates binding and returns the value. */
export function updateBinding(bindingIndex, value) {
    return getViewData()[bindingIndex] = value;
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
export function directiveInject(token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    return getOrCreateInjectable(getPreviousOrParentTNode(), getViewData(), token, flags);
}
/**
 * Facade for the attribute injection from DI.
 */
export function injectAttribute(attrNameToInject) {
    return injectAttributeImpl(getPreviousOrParentTNode(), attrNameToInject);
}
/**
 * Registers a QueryList, associated with a content query, for later refresh (part of a view
 * refresh).
 */
export function registerContentQuery(queryList, currentDirectiveIndex) {
    var viewData = getViewData();
    var tView = getTView();
    var savedContentQueriesLength = (viewData[CONTENT_QUERIES] || (viewData[CONTENT_QUERIES] = [])).push(queryList);
    if (getFirstTemplatePass()) {
        var tViewContentQueries = tView.contentQueries || (tView.contentQueries = []);
        var lastSavedDirectiveIndex = tView.contentQueries.length ? tView.contentQueries[tView.contentQueries.length - 2] : -1;
        if (currentDirectiveIndex !== lastSavedDirectiveIndex) {
            tViewContentQueries.push(currentDirectiveIndex, savedContentQueriesLength - 1);
        }
    }
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
function initializeTNodeInputs(tNode) {
    // If tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked.
    if (tNode) {
        if (tNode.inputs === undefined) {
            // mark inputs as checked
            tNode.inputs = generatePropertyAliases(tNode.flags, 0 /* Input */);
        }
        return tNode.inputs;
    }
    return null;
}
export function delegateToClassInput(tNode) {
    return tNode.flags & 32768 /* hasClassInput */;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxlQUFlLENBQUM7QUFRdkIsT0FBTyxFQUFDLElBQUksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUVsQyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BGLE9BQU8sRUFBQyxlQUFlLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsOEJBQThCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkksT0FBTyxFQUFDLHlCQUF5QixFQUFFLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLG1CQUFtQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQzVGLE9BQU8sRUFBQyxZQUFZLEVBQWMsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFFdkUsT0FBTyxFQUFDLGFBQWEsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBR3pFLE9BQU8sRUFBa0IsdUJBQXVCLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVqRixPQUFPLEVBQXFGLG9CQUFvQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFL0ksT0FBTyxFQUFDLGFBQWEsRUFBRSxPQUFPLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsU0FBUyxF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Y0FBYyxDQUFDO0FBRTVDLFNBQVMscUJBQXFCLENBQUMsS0FBbUI7SUFDaEQsbUZBQW1GO0lBQ25GLG9CQUFvQjtJQUNwQixJQUFJLEtBQUssRUFBRTtRQUNULElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxTQUFTLEVBQUU7WUFDOUIseUJBQXlCO1lBQ3pCLEtBQUssQ0FBQyxNQUFNLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEtBQUssZ0JBQXlCLENBQUM7U0FDN0U7UUFDRCxPQUFPLEtBQUssQ0FBQyxNQUFNLENBQUM7S0FDckI7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBWTtJQUMvQyxPQUFPLEtBQUssQ0FBQyxLQUFLLDRCQUEyQixDQUFDO0FBQ2hELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAnLi9uZ19kZXZfbW9kZSc7XG5cbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdEZsYWdzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuaW1wb3J0IHtub29wfSBmcm9tICcuLi91dGlsL25vb3AnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlLCBpbmplY3RBdHRyaWJ1dGVJbXBsfSBmcm9tICcuL2RpJztcbmltcG9ydCB7dGhyb3dFcnJvcklmTm9DaGFuZ2VzTW9kZSwgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcXVldWVJbml0SG9va3MsIHF1ZXVlTGlmZWN5Y2xlSG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRRdWVyeSwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgSW5pdGlhbFN0eWxpbmdGbGFncywgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lOSkVDVE9SX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNWYWx1ZSwgUHJvcGVydHlBbGlhc2VzLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1Byb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTdHlsaW5nSW5kZXh9IGZyb20gJy4vaW50ZXJmYWNlcy9zdHlsaW5nJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBDT05URU5UX1FVRVJJRVMsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIExWaWV3RmxhZ3MsIE5FWFQsIE9wYXF1ZVZpZXdTdGF0ZSwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MsIFNBTklUSVpFUiwgVEFJTCwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGUsIGNyZWF0ZVRleHROb2RlLCBmaW5kQ29tcG9uZW50VmlldywgZ2V0TFZpZXdDaGlsZCwgZ2V0UmVuZGVyUGFyZW50LCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0SGFzUGFyZW50LCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRDbGVhbnVwLCBnZXRDb250ZXh0Vmlld0RhdGEsIGdldENyZWF0aW9uTW9kZSwgZ2V0Q3VycmVudFF1ZXJpZXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRGaXJzdFRlbXBsYXRlUGFzcywgZ2V0SXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0UmVuZGVyZXIsIGdldFJlbmRlcmVyRmFjdG9yeSwgZ2V0VFZpZXcsIGdldFRWaWV3Q2xlYW51cCwgZ2V0Vmlld0RhdGEsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIGxlYXZlVmlldywgbmV4dENvbnRleHRJbXBsLCByZXNldENvbXBvbmVudFN0YXRlLCBzZXRCaW5kaW5nUm9vdCwgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50UXVlcmllcywgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MsIHNldElzUGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldFJlbmRlcmVyLCBzZXRSZW5kZXJlckZhY3Rvcnl9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlLCByZW5kZXJTdHlsZUFuZENsYXNzQmluZGluZ3MsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge0JvdW5kUGxheWVyRmFjdG9yeX0gZnJvbSAnLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7Z2V0U3R5bGluZ0NvbnRleHR9IGZyb20gJy4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRSb290Q29udGV4dCwgZ2V0Um9vdFZpZXcsIGdldFROb2RlLCBpc0NvbXBvbmVudCwgaXNDb21wb25lbnREZWYsIGlzRGlmZmVyZW50LCBsb2FkSW50ZXJuYWwsIHJlYWRQYXRjaGVkTFZpZXdEYXRhLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuLyoqXG4gKiBBIHBlcm1hbmVudCBtYXJrZXIgcHJvbWlzZSB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgY3VycmVudCBDRCB0cmVlIGlzXG4gKiBjbGVhbi5cbiAqL1xuY29uc3QgX0NMRUFOX1BST01JU0UgPSBQcm9taXNlLnJlc29sdmUobnVsbCk7XG5cbmNvbnN0IGVudW0gQmluZGluZ0RpcmVjdGlvbiB7XG4gIElucHV0LFxuICBPdXRwdXQsXG59XG5cbi8qKlxuICogRnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUgYmVmb3JlIHdyaXRpbmcgaXQgaW50byB0aGUgcmVuZGVyZXIuXG4gKi9cbnR5cGUgU2FuaXRpemVyRm4gPSAodmFsdWU6IGFueSkgPT4gc3RyaW5nO1xuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdEYXRhOiBMVmlld0RhdGEsIHJmOiBSZW5kZXJGbGFncyB8IG51bGwpIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBwYXJlbnRGaXJzdFRlbXBsYXRlUGFzcyA9IGdldEZpcnN0VGVtcGxhdGVQYXNzKCk7XG5cbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICBzZXRGaXJzdFRlbXBsYXRlUGFzcyhmYWxzZSk7XG5cbiAgLy8gRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHJ1biBmaXJzdCBvbmx5IGluIGNyZWF0aW9uIG1vZGUuIElmIHRoaXMgaXMgYVxuICAvLyBjcmVhdGlvbi1vbmx5IHBhc3MsIHdlIHNob3VsZCBub3QgY2FsbCBsaWZlY3ljbGUgaG9va3Mgb3IgZXZhbHVhdGUgYmluZGluZ3MuXG4gIC8vIFRoaXMgd2lsbCBiZSBkb25lIGluIHRoZSB1cGRhdGUtb25seSBwYXNzLlxuICBpZiAocmYgIT09IFJlbmRlckZsYWdzLkNyZWF0ZSkge1xuICAgIGNvbnN0IGNyZWF0aW9uTW9kZSA9IGdldENyZWF0aW9uTW9kZSgpO1xuICAgIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGV4ZWN1dGVJbml0SG9va3Modmlld0RhdGEsIHRWaWV3LCBjcmVhdGlvbk1vZGUpO1xuICAgIH1cblxuICAgIHNldEhvc3RCaW5kaW5ncyh0Vmlldywgdmlld0RhdGEpO1xuXG4gICAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKHZpZXdEYXRhKTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0Vmlldyk7XG5cbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgZXhlY3V0ZUhvb2tzKHZpZXdEYXRhLCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjcmVhdGlvbk1vZGUpO1xuICAgIH1cbiAgfVxuXG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cywgcGFyZW50Rmlyc3RUZW1wbGF0ZVBhc3MsIHJmKTtcbn1cblxuXG4vKiogU2V0cyB0aGUgaG9zdCBiaW5kaW5ncyBmb3IgdGhlIGN1cnJlbnQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXdEYXRhKTogdm9pZCB7XG4gIGlmICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgbGV0IGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICBsZXQgY3VycmVudEVsZW1lbnRJbmRleCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgLy8gdGhlIGN1cnJlbnQgZWxlbWVudCBhbmQgZGlyZWN0aXZlIGluZGV4LlxuICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgLy8gSW5qZWN0b3IgYmxvY2sgYW5kIHByb3ZpZGVycyBhcmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBJTkpFQ1RPUl9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgLy8gYW5kIGdldCB0byB0aGUgZmlyc3Qgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKSBvciB0aGUgaG9zdCB2YXIgY291bnRcbiAgICAgICAgICAvLyAodG8gZ2V0IHRvIHRoZSBuZXh0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkuXG4gICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgfVxuICAgICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIGl0J3Mgbm90IGEgbnVtYmVyLCBpdCdzIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uIHRoYXQgbmVlZHMgdG8gYmUgZXhlY3V0ZWQuXG4gICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgLy8gV2UgbXVzdCBzdWJ0cmFjdCB0aGUgaGVhZGVyIG9mZnNldCBiZWNhdXNlIHRoZSBsb2FkKCkgaW5zdHJ1Y3Rpb25cbiAgICAgICAgLy8gZXhwZWN0cyBhIHJhdywgdW5hZGp1c3RlZCBpbmRleC5cbiAgICAgICAgaW5zdHJ1Y3Rpb24oY3VycmVudERpcmVjdGl2ZUluZGV4IC0gSEVBREVSX09GRlNFVCwgY3VycmVudEVsZW1lbnRJbmRleCk7XG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNvbnRlbnQgcXVlcmllcyBmb3IgYWxsIGRpcmVjdGl2ZXMgaW4gdGhlIGdpdmVuIHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllc1JlZnJlc2ggIShcbiAgICAgICAgICBkaXJlY3RpdmVEZWZJZHggLSBIRUFERVJfT0ZGU0VULCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoXG4gICAgY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsLCBwYXJlbnRGaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbiwgcmY6IFJlbmRlckZsYWdzIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoY29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKGNvbXBvbmVudHNbaV0sIHBhcmVudEZpcnN0VGVtcGxhdGVQYXNzLCByZik7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlld0RhdGE8VD4oXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgaW5zdGFuY2UgPSB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlld0RhdGE7XG4gIGluc3RhbmNlW0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0O1xuICBpbnN0YW5jZVtQQVJFTlRdID0gaW5zdGFuY2VbREVDTEFSQVRJT05fVklFV10gPSB2aWV3RGF0YTtcbiAgaW5zdGFuY2VbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBpbnN0YW5jZVtJTkpFQ1RPUl0gPSB2aWV3RGF0YSA/IHZpZXdEYXRhW0lOSkVDVE9SXSA6IG51bGw7XG4gIGluc3RhbmNlW1JFTkRFUkVSXSA9IHJlbmRlcmVyO1xuICBpbnN0YW5jZVtTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IG51bGw7XG4gIHJldHVybiBpbnN0YW5jZTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKGFkanVzdGVkSW5kZXgsIHZpZXdEYXRhLmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB3aXRoIG51bGxgKTtcbiAgdmlld0RhdGFbYWRqdXN0ZWRJbmRleF0gPSBuYXRpdmU7XG5cbiAgbGV0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBpc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gICAgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgICAgY3JlYXRlVE5vZGUodmlld0RhdGEsIHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzLCBudWxsKTtcblxuICAgIC8vIE5vdyBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlLlxuICAgIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJlxuICAgICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT0gbnVsbCAmJiB0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuXG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSk7XG4gIHNldElzUGFyZW50KHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld05vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhKSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgaWYgKHZpZXdbVFZJRVddLm5vZGUgPT0gbnVsbCkge1xuICAgIHZpZXdbVFZJRVddLm5vZGUgPSBjcmVhdGVUTm9kZSh2aWV3LCBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHNldElzUGFyZW50KHRydWUpO1xuICBjb25zdCB0Tm9kZSA9IHZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUpO1xuICByZXR1cm4gdmlld1tIT1NUX05PREVdID0gdE5vZGU7XG59XG5cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSBvciBDb21wb25lbnRGYWN0b3J5LmNyZWF0ZSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRqdXN0Qmx1ZXByaW50Rm9yTmV3Tm9kZSh2aWV3OiBMVmlld0RhdGEpIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgrKztcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICB2aWV3LnB1c2gobnVsbCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3RWaWV3OiBMVmlld0RhdGEgfCBudWxsLFxuICAgIGRpcmVjdGl2ZXM/OiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM/OiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3RGF0YSB7XG4gIGlmIChob3N0VmlldyA9PSBudWxsKSB7XG4gICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgIHNldFJlbmRlcmVyRmFjdG9yeShwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgICBzZXRSZW5kZXJlcihyZW5kZXJlcik7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIHJvb3QgdmlldyBzbyBpdCdzIHBvc3NpYmxlIHRvIGxvb2sgdXAgdGhlIGhvc3QgZWxlbWVudCB0aHJvdWdoIGl0cyBpbmRleFxuICAgIGVudGVyVmlldyhcbiAgICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgICAgcmVuZGVyZXIsIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwge30sXG4gICAgICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3QpLFxuICAgICAgICBudWxsKTtcblxuICAgIGNvbnN0IGNvbXBvbmVudFRWaWV3ID1cbiAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCk7XG4gICAgaG9zdFZpZXcgPVxuICAgICAgICBjcmVhdGVMVmlld0RhdGEocmVuZGVyZXIsIGNvbXBvbmVudFRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBzYW5pdGl6ZXIpO1xuICAgIGhvc3RWaWV3W0hPU1RfTk9ERV0gPSBjcmVhdGVOb2RlQXRJbmRleCgwLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwpO1xuICB9XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdFZpZXcsIGNvbnRleHQsIG51bGwsIHRlbXBsYXRlRm4pO1xuXG4gIHJldHVybiBob3N0Vmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3RGF0YSwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3RGF0YSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEpO1xuXG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIGNyZWF0ZUxWaWV3RGF0YShyZW5kZXJlciwgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjcmVhdGVWaWV3Tm9kZSgtMSwgbFZpZXcpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lm5vZGUgIS5pbmplY3RvckluZGV4ID0gaW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIHNldElzUGFyZW50KF9pc1BhcmVudCk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPihcbiAgICB2aWV3VG9SZW5kZXI6IExWaWV3RGF0YSwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCByZjogUmVuZGVyRmxhZ3MpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG4gIGxldCBvbGRWaWV3OiBMVmlld0RhdGE7XG4gIGlmICh2aWV3VG9SZW5kZXJbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KHZpZXdUb1JlbmRlcltDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIHNldElzUGFyZW50KHRydWUpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbSE9TVF9OT0RFXSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKHJmLCBjb250ZXh0KTtcbiAgICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlciwgbnVsbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUaGlzIG11c3QgYmUgc2V0IHRvIGZhbHNlIGltbWVkaWF0ZWx5IGFmdGVyIHRoZSBmaXJzdCBjcmVhdGlvbiBydW4gYmVjYXVzZSBpbiBhblxuICAgICAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAgICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAgICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgICAgIHZpZXdUb1JlbmRlcltUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICAgICAgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MoZmFsc2UpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICAvLyByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgaXMgY2FsbGVkIHR3aWNlLCBvbmNlIGZvciBjcmVhdGlvbiBvbmx5IGFuZCB0aGVuIG9uY2UgZm9yXG4gICAgICAvLyB1cGRhdGUuIFdoZW4gZm9yIGNyZWF0aW9uIG9ubHksIGxlYXZlVmlldygpIG11c3Qgbm90IHRyaWdnZXIgdmlldyBob29rcywgbm9yIGNsZWFuIGZsYWdzLlxuICAgICAgY29uc3QgaXNDcmVhdGlvbk9ubHkgPSAocmYgJiBSZW5kZXJGbGFncy5DcmVhdGUpID09PSBSZW5kZXJGbGFncy5DcmVhdGU7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBpc0NyZWF0aW9uT25seSk7XG4gICAgICBzZXRJc1BhcmVudChfaXNQYXJlbnQpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKF9wcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGNvbnRleHQgYXQgdGhlIGxldmVsIHNwZWNpZmllZCBhbmQgc2F2ZXMgaXQgYXMgdGhlIGdsb2JhbCwgY29udGV4dFZpZXdEYXRhLlxuICogV2lsbCBnZXQgdGhlIG5leHQgbGV2ZWwgdXAgaWYgbGV2ZWwgaXMgbm90IHNwZWNpZmllZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gc2F2ZSBjb250ZXh0cyBvZiBwYXJlbnQgdmlld3Mgc28gdGhleSBjYW4gYmUgYm91bmQgaW4gZW1iZWRkZWQgdmlld3MsIG9yXG4gKiBpbiBjb25qdW5jdGlvbiB3aXRoIHJlZmVyZW5jZSgpIHRvIGJpbmQgYSByZWYgZnJvbSBhIHBhcmVudCB2aWV3LlxuICpcbiAqIEBwYXJhbSBsZXZlbCBUaGUgcmVsYXRpdmUgbGV2ZWwgb2YgdGhlIHZpZXcgZnJvbSB3aGljaCB0byBncmFiIGNvbnRleHQgY29tcGFyZWQgdG8gY29udGV4dFZld0RhdGFcbiAqIEByZXR1cm5zIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0PFQgPSBhbnk+KGxldmVsOiBudW1iZXIgPSAxKTogVCB7XG4gIHJldHVybiBuZXh0Q29udGV4dEltcGwobGV2ZWwpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudE9yQ29udGV4dDogVCwgcmY6IFJlbmRlckZsYWdzIHwgbnVsbCxcbiAgICB0ZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gZ2V0UmVuZGVyZXJGYWN0b3J5KCk7XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICB0cnkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdGVtcGxhdGVGbihyZiB8fCBnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudE9yQ29udGV4dCAhKTtcbiAgICB9XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0VmlldywgcmYpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIEJ5IGRlZmF1bHQsIHRoZSB1cGRhdGUgYmxvY2sgaXMgcnVuIHdpdGggdGhlXG4gKiBjcmVhdGlvbiBibG9jayB3aGVuIHRoZSB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGUuIE90aGVyd2lzZSwgdGhlIHVwZGF0ZSBibG9jayBpcyBydW5cbiAqIGFsb25lLlxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgZG8gTk9UIHVzZSB0aGlzIGNvbmZpZ3VyYXRpb24gKHVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5KS5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyRmxhZ3ModmlldzogTFZpZXdEYXRhKTogUmVuZGVyRmxhZ3Mge1xuICByZXR1cm4gdmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSA/IFJlbmRlckZsYWdzLkNyZWF0ZSB8IFJlbmRlckZsYWdzLlVwZGF0ZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBOYW1lc3BhY2Vcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zy8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgZWxlbWVudCB1c2luZyB7QGxpbmsgZWxlbWVudFN0YXJ0fSBhbmQge0BsaW5rIGVsZW1lbnRFbmR9XG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgZWxlbWVudFN0YXJ0KGluZGV4LCBuYW1lLCBhdHRycywgbG9jYWxSZWZzKTtcbiAgZWxlbWVudEVuZCgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBsb2dpY2FsIGNvbnRhaW5lciBmb3Igb3RoZXIgbm9kZXMgKDxuZy1jb250YWluZXI+KSBiYWNrZWQgYnkgYSBjb21tZW50IG5vZGUgaW4gdGhlIERPTS5cbiAqIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50Q29udGFpbmVyRW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlld0RhdGEgYXJyYXlcbiAqIEBwYXJhbSBhdHRycyBTZXQgb2YgYXR0cmlidXRlcyB0byBiZSB1c2VkIHdoZW4gbWF0Y2hpbmcgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEV2ZW4gaWYgdGhpcyBpbnN0cnVjdGlvbiBhY2NlcHRzIGEgc2V0IG9mIGF0dHJpYnV0ZXMgbm8gYWN0dWFsIGF0dHJpYnV0ZSB2YWx1ZXMgYXJlIHByb3BhZ2F0ZWQgdG9cbiAqIHRoZSBET00gKGFzIGEgY29tbWVudCBub2RlIGNhbid0IGhhdmUgYXR0cmlidXRlcykuIEF0dHJpYnV0ZXMgYXJlIGhlcmUgb25seSBmb3IgZGlyZWN0aXZlXG4gKiBtYXRjaGluZyBwdXJwb3NlcyBhbmQgc2V0dGluZyBpbml0aWFsIGlucHV0cyBvZiBkaXJlY3RpdmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENvbnRhaW5lclN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudCBjb250YWluZXJzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICduZy1jb250YWluZXInIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbmRleCAtIDEpO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCB2aWV3RGF0YSk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIHZpZXdEYXRhLCBsb2NhbFJlZnMpO1xufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudCgpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBnZXRDdXJyZW50UXVlcmllcygpO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBzZXRDdXJyZW50UXVlcmllcyhjdXJyZW50UXVlcmllcy5hZGROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudENvbnRhaW5lck5vZGUpKTtcbiAgfVxuXG4gIHF1ZXVlTGlmZWN5Y2xlSG9va3MocHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzLCB0Vmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIERPTSBlbGVtZW50LiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudEVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXdEYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET00gZWxlbWVudCBvbiBjcmVhdGlvbi5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEF0dHJpYnV0ZXMgYW5kIGxvY2FsUmVmcyBhcmUgcGFzc2VkIGFzIGFuIGFycmF5IG9mIHN0cmluZ3Mgd2hlcmUgZWxlbWVudHMgd2l0aCBhbiBldmVuIGluZGV4XG4gKiBob2xkIGFuIGF0dHJpYnV0ZSBuYW1lIGFuZCBlbGVtZW50cyB3aXRoIGFuIG9kZCBpbmRleCBob2xkIGFuIGF0dHJpYnV0ZSB2YWx1ZSwgZXguOlxuICogWydpZCcsICd3YXJuaW5nNScsICdjbGFzcycsICdhbGVydCddXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaW5kZXggLSAxKTtcblxuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlICEsIG5hbWUsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChhdHRycykge1xuICAgIHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgfVxuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0Vmlldywgdmlld0RhdGEsIGxvY2FsUmVmcyk7XG5cbiAgLy8gYW55IGltbWVkaWF0ZSBjaGlsZHJlbiBvZiBhIGNvbXBvbmVudCBvciB0ZW1wbGF0ZSBjb250YWluZXIgbXVzdCBiZSBwcmUtZW1wdGl2ZWx5XG4gIC8vIG1vbmtleS1wYXRjaGVkIHdpdGggdGhlIGNvbXBvbmVudCB2aWV3IGRhdGEgc28gdGhhdCB0aGUgZWxlbWVudCBjYW4gYmUgaW5zcGVjdGVkXG4gIC8vIGxhdGVyIG9uIHVzaW5nIGFueSBlbGVtZW50IGRpc2NvdmVyeSB1dGlsaXR5IG1ldGhvZHMgKHNlZSBgZWxlbWVudF9kaXNjb3ZlcnkudHNgKVxuICBpZiAoZ2V0RWxlbWVudERlcHRoQ291bnQoKSA9PT0gMCkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHZpZXdEYXRhKTtcbiAgfVxuICBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG92ZXJyaWRkZW5SZW5kZXJlciBPcHRpb25hbCBBIHJlbmRlcmVyIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9uZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIG92ZXJyaWRkZW5SZW5kZXJlcj86IFJlbmRlcmVyMyk6IFJFbGVtZW50IHtcbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyVG9Vc2UgPSBvdmVycmlkZGVuUmVuZGVyZXIgfHwgZ2V0UmVuZGVyZXIoKTtcblxuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXJUb1VzZSkpIHtcbiAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSwgX2N1cnJlbnROYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIGlmIChfY3VycmVudE5hbWVzcGFjZSA9PT0gbnVsbCkge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnROUyhfY3VycmVudE5hbWVzcGFjZSwgbmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmU7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gVE5vZGVcbiAqL1xuZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0FuZExvY2FscyhcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlld0RhdGEsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLmZpcnN0VGVtcGxhdGVQYXNzKys7XG5cbiAgICByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICAgICAgdFZpZXcsIHZpZXdEYXRhLCBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0Vmlldywgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSksXG4gICAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbG9jYWxSZWZzIHx8IG51bGwpO1xuICB9XG4gIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0Vmlldywgdmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YSh2aWV3RGF0YSwgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXdEYXRhIGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICB2aWV3RGF0YTogTFZpZXdEYXRhLCB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3Rvcik6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBsZXQgbG9jYWxJbmRleCA9IHROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICAgIGxvY2FsUmVmRXh0cmFjdG9yKFxuICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgdmlld0RhdGEpIDpcbiAgICAgICAgICB2aWV3RGF0YVtpbmRleF07XG4gICAgICB2aWV3RGF0YVtsb2NhbEluZGV4KytdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRoZSB0ZW1wbGF0ZSBmcm9tIHdoaWNoIHRvIGdldCBzdGF0aWMgZGF0YVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9XG4gICAgICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PGFueT58IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVddID0ge1xuICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgbm9kZTogbnVsbCAhLFxuICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLCAgLy8gRmlsbCBpbiB0byBtYXRjaCBIRUFERVJfT0ZGU0VUIGluIExWaWV3RGF0YVxuICAgIGNoaWxkSW5kZXg6IC0xLCAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGluaXRIb29rczogbnVsbCxcbiAgICBjaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIHBpcGVEZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXdEYXRhIHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV3IEFycmF5KGluaXRpYWxWaWV3TGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwobnVsbCwgMCwgYmluZGluZ1N0YXJ0SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChOT19DSEFOR0UsIGJpbmRpbmdTdGFydEluZGV4KSBhcyBMVmlld0RhdGE7XG4gIGJsdWVwcmludFtDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gIGJsdWVwcmludFtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdTdGFydEluZGV4O1xuICByZXR1cm4gYmx1ZXByaW50O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgY29uc3QgaXNQcm9jID0gaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpO1xuICBsZXQgaSA9IDA7XG5cbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgIGkgKz0gMjtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIE5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBuYW1lc3BhY2VVUkkgPSBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2kgKyAyXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpICsgM10gYXMgc3RyaW5nO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgICAgaSArPSA0O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSArIDFdO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIGkgKz0gMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKC0xKTtcbiAgc2V0UmVuZGVyZXJGYWN0b3J5KGZhY3RvcnkpO1xuICBjb25zdCBkZWZhdWx0UmVuZGVyZXIgPSBmYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuICBjb25zdCByTm9kZSA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKGRlZmF1bHRSZW5kZXJlcikgP1xuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IpIDpcbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpKSA6XG4gICAgICBlbGVtZW50T3JTZWxlY3RvcjtcbiAgaWYgKG5nRGV2TW9kZSAmJiAhck5vZGUpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gck5vZGU7XG59XG5cbi8qKlxuICogQWRkcyBhbiBldmVudCBsaXN0ZW5lciB0byB0aGUgY3VycmVudCBub2RlLlxuICpcbiAqIElmIGFuIG91dHB1dCBleGlzdHMgb24gb25lIG9mIHRoZSBub2RlJ3MgZGlyZWN0aXZlcywgaXQgYWxzbyBzdWJzY3JpYmVzIHRvIHRoZSBvdXRwdXRcbiAqIGFuZCBzYXZlcyB0aGUgc3Vic2NyaXB0aW9uIGZvciBsYXRlciBjbGVhbnVwLlxuICpcbiAqIEBwYXJhbSBldmVudE5hbWUgTmFtZSBvZiB0aGUgZXZlbnRcbiAqIEBwYXJhbSBsaXN0ZW5lckZuIFRoZSBmdW5jdGlvbiB0byBiZSBjYWxsZWQgd2hlbiBldmVudCBlbWl0c1xuICogQHBhcmFtIHVzZUNhcHR1cmUgV2hldGhlciBvciBub3QgdG8gdXNlIGNhcHR1cmUgaW4gZXZlbnQgbGlzdGVuZXIuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsaXN0ZW5lcihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCB2aWV3RGF0YSkgYXMgUkVsZW1lbnQ7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKCk7XG5cbiAgICAvLyBJbiBvcmRlciB0byBtYXRjaCBjdXJyZW50IGJlaGF2aW9yLCBuYXRpdmUgRE9NIGV2ZW50IGxpc3RlbmVycyBtdXN0IGJlIGFkZGVkIGZvciBhbGxcbiAgICAvLyBldmVudHMgKGluY2x1ZGluZyBvdXRwdXRzKS5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICBjb25zdCBjbGVhbnVwRm4gPSByZW5kZXJlci5saXN0ZW4obmF0aXZlLCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgc3RvcmVDbGVhbnVwRm4odmlld0RhdGEsIGNsZWFudXBGbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuKTtcbiAgICAgIG5hdGl2ZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGNvbnN0IGNsZWFudXBJbnN0YW5jZXMgPSBnZXRDbGVhbnVwKHZpZXdEYXRhKTtcbiAgICAgIGNsZWFudXBJbnN0YW5jZXMucHVzaCh3cmFwcGVkTGlzdGVuZXIpO1xuICAgICAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICAgICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXdEYXRhKS5wdXNoKFxuICAgICAgICAgICAgZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgY2xlYW51cEluc3RhbmNlcyAhLmxlbmd0aCAtIDEsIHVzZUNhcHR1cmUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIHN1YnNjcmliZSB0byBkaXJlY3RpdmUgb3V0cHV0c1xuICBpZiAodE5vZGUub3V0cHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gaWYgd2UgY3JlYXRlIFROb2RlIGhlcmUsIGlucHV0cyBtdXN0IGJlIHVuZGVmaW5lZCBzbyB3ZSBrbm93IHRoZXkgc3RpbGwgbmVlZCB0byBiZVxuICAgIC8vIGNoZWNrZWRcbiAgICB0Tm9kZS5vdXRwdXRzID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXModE5vZGUuZmxhZ3MsIEJpbmRpbmdEaXJlY3Rpb24uT3V0cHV0KTtcbiAgfVxuXG4gIGNvbnN0IG91dHB1dHMgPSB0Tm9kZS5vdXRwdXRzO1xuICBsZXQgb3V0cHV0RGF0YTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKG91dHB1dHMgJiYgKG91dHB1dERhdGEgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY3JlYXRlT3V0cHV0KHZpZXdEYXRhLCBvdXRwdXREYXRhLCBsaXN0ZW5lckZuKTtcbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgcGFydGljdWxhciBldmVudCBuYW1lIGFuZCBzdWJzY3JpYmVzIHRvXG4gKiBlYWNoIG91dHB1dC5cbiAqL1xuZnVuY3Rpb24gY3JlYXRlT3V0cHV0KHZpZXdEYXRhOiBMVmlld0RhdGEsIG91dHB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgbGlzdGVuZXI6IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb3V0cHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShvdXRwdXRzW2ldIGFzIG51bWJlciwgdmlld0RhdGEpO1xuICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IHZpZXdEYXRhW291dHB1dHNbaV0gYXMgbnVtYmVyXVtvdXRwdXRzW2kgKyAxXV0uc3Vic2NyaWJlKGxpc3RlbmVyKTtcbiAgICBzdG9yZUNsZWFudXBXaXRoQ29udGV4dCh2aWV3RGF0YSwgc3Vic2NyaXB0aW9uLCBzdWJzY3JpcHRpb24udW5zdWJzY3JpYmUpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB2aWV3OiBMVmlld0RhdGEgfCBudWxsLCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgaWYgKCF2aWV3KSB2aWV3ID0gZ2V0Vmlld0RhdGEoKTtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNvbnRleHQpO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbiwgdmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHZpZXc6IExWaWV3RGF0YSwgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuKTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodmlldykucHVzaCh2aWV3W0NMRUFOVVBdICEubGVuZ3RoIC0gMSwgbnVsbCk7XG4gIH1cbn1cblxuLyoqIE1hcmsgdGhlIGVuZCBvZiB0aGUgZWxlbWVudC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50RW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGdldEN1cnJlbnRRdWVyaWVzKCk7XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIHNldEN1cnJlbnRRdWVyaWVzKGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSkpO1xuICB9XG5cbiAgcXVldWVMaWZlY3ljbGVIb29rcyhwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MsIGdldFRWaWV3KCkpO1xuICBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4pOiB2b2lkIHtcbiAgaWYgKHZhbHVlICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBnZXRSZW5kZXJlcigpO1xuICAgIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSk7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50LCBuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPSBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqL1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbik6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCB2aWV3RGF0YSkgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgdmlld0RhdGEpO1xuICBjb25zdCBpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoaW5wdXREYXRhICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KHZpZXdEYXRhLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaCh2aWV3RGF0YSwgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gZ2V0UmVuZGVyZXIoKTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgKChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdmlld0RhdGE6IExWaWV3RGF0YSwgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcblxuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiB2aWV3RGF0YSAmJiBwYXJlbnQgIT09IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIGNvbnN0IHRQYXJlbnQgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgaW5qZWN0b3JJbmRleDogdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xLFxuICAgIGZsYWdzOiAwLFxuICAgIHByb3ZpZGVySW5kZXhlczogMCxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIGF0dHJzOiBhdHRycyxcbiAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRzOiB1bmRlZmluZWQsXG4gICAgdFZpZXdzOiB0Vmlld3MsXG4gICAgbmV4dDogbnVsbCxcbiAgICBjaGlsZDogbnVsbCxcbiAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgZGV0YWNoZWQ6IG51bGwsXG4gICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgIHByb2plY3Rpb246IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGxpc3Qgb2YgZGlyZWN0aXZlIGluZGljZXMgYW5kIG1pbmlmaWVkIGlucHV0IG5hbWVzLCBzZXRzIHRoZVxuICogaW5wdXQgcHJvcGVydGllcyBvbiB0aGUgY29ycmVzcG9uZGluZyBkaXJlY3RpdmVzLlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh2aWV3RGF0YTogTFZpZXdEYXRhLCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShpbnB1dHNbaV0gYXMgbnVtYmVyLCB2aWV3RGF0YSk7XG4gICAgdmlld0RhdGFbaW5wdXRzW2ldIGFzIG51bWJlcl1baW5wdXRzW2kgKyAxXV0gPSB2YWx1ZTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIG51bWJlciB0Tm9kZUZsYWdzIG5vZGUgZmxhZ3NcbiAqIEBwYXJhbSBEaXJlY3Rpb24gZGlyZWN0aW9uIHdoZXRoZXIgdG8gY29uc2lkZXIgaW5wdXRzIG9yIG91dHB1dHNcbiAqIEByZXR1cm5zIFByb3BlcnR5QWxpYXNlc3xudWxsIGFnZ3JlZ2F0ZSBvZiBhbGwgcHJvcGVydGllcyBpZiBhbnksIGBudWxsYCBvdGhlcndpc2VcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoXG4gICAgdE5vZGVGbGFnczogVE5vZGVGbGFncywgZGlyZWN0aW9uOiBCaW5kaW5nRGlyZWN0aW9uKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGNvbnN0IGNvdW50ID0gdE5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgaWYgKGNvdW50ID4gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQWRkIG9yIHJlbW92ZSBhIGNsYXNzIGluIGEgYGNsYXNzTGlzdGAgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgW2NsYXNzLmZvb109XCJleHBcIiBjYXNlXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBjbGFzc05hbWUgTmFtZSBvZiBjbGFzcyB0byB0b2dnbGUuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgQSB2YWx1ZSBpbmRpY2F0aW5nIGlmIGEgZ2l2ZW4gY2xhc3Mgc2hvdWxkIGJlIGFkZGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxpbmdJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnkpOiB2b2lkIHtcbiAgY29uc3QgdmFsID1cbiAgICAgICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW4+KSA6ICghIXZhbHVlKTtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChnZXRTdHlsaW5nQ29udGV4dChpbmRleCwgZ2V0Vmlld0RhdGEoKSksIHN0eWxpbmdJbmRleCwgdmFsKTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gYW55IGlubGluZSBzdHlsZSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gYXBwbHkgYWxsIHN0eWxpbmdcbiAqIChlLmcuIGBzdHlsZT1cIi4uLlwiYCkgdmFsdWVzIHRvIHRoZSBlbGVtZW50LiBUaGlzIGlzIGFsc28gd2hlcmUgdGhlIHByb3ZpZGVkIGluZGV4XG4gKiB2YWx1ZSBpcyBhbGxvY2F0ZWQgZm9yIHRoZSBzdHlsaW5nIGRldGFpbHMgZm9yIGl0cyBjb3JyZXNwb25kaW5nIGVsZW1lbnQgKHRoZSBlbGVtZW50XG4gKiBpbmRleCBpcyB0aGUgcHJldmlvdXMgaW5kZXggdmFsdWUgZnJvbSB0aGlzIG9uZSkuXG4gKlxuICogKE5vdGUgdGhpcyBmdW5jdGlvbiBjYWxscyBgZWxlbWVudFN0eWxpbmdBcHBseWAgaW1tZWRpYXRlbHkgd2hlbiBjYWxsZWQuKVxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggdmFsdWUgd2hpY2ggd2lsbCBiZSBhbGxvY2F0ZWQgdG8gc3RvcmUgc3R5bGluZyBkYXRhIGZvciB0aGUgZWxlbWVudC5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBjbGFzc0RlY2xhcmF0aW9ucyBBIGtleS92YWx1ZSBhcnJheSBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgcmVnaXN0ZXJlZCBvbiB0aGUgZWxlbWVudC5cbiAqICAgRWFjaCBpbmRpdmlkdWFsIHN0eWxlIHdpbGwgYmUgdXNlZCBvbiB0aGUgZWxlbWVudCBhcyBsb25nIGFzIGl0IGlzIG5vdCBvdmVycmlkZGVuXG4gKiAgIGJ5IGFueSBjbGFzc2VzIHBsYWNlZCBvbiB0aGUgZWxlbWVudCBieSBtdWx0aXBsZSAoYFtjbGFzc11gKSBvciBzaW5ndWxhciAoYFtjbGFzcy5uYW1lZF1gKVxuICogICBiaW5kaW5ncy4gSWYgYSBjbGFzcyBiaW5kaW5nIGNoYW5nZXMgaXRzIHZhbHVlIHRvIGEgZmFsc3kgdmFsdWUgdGhlbiB0aGUgbWF0Y2hpbmcgaW5pdGlhbFxuICogICBjbGFzcyB2YWx1ZSB0aGF0IGFyZSBwYXNzZWQgaW4gaGVyZSB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGlmIG1hdGNoZWQpLlxuICogQHBhcmFtIHN0eWxlRGVjbGFyYXRpb25zIEEga2V5L3ZhbHVlIGFycmF5IG9mIENTUyBzdHlsZXMgdGhhdCB3aWxsIGJlIHJlZ2lzdGVyZWQgb24gdGhlIGVsZW1lbnQuXG4gKiAgIEVhY2ggaW5kaXZpZHVhbCBzdHlsZSB3aWxsIGJlIHVzZWQgb24gdGhlIGVsZW1lbnQgYXMgbG9uZyBhcyBpdCBpcyBub3Qgb3ZlcnJpZGRlblxuICogICBieSBhbnkgc3R5bGVzIHBsYWNlZCBvbiB0aGUgZWxlbWVudCBieSBtdWx0aXBsZSAoYFtzdHlsZV1gKSBvciBzaW5ndWxhciAoYFtzdHlsZS5wcm9wXWApXG4gKiAgIGJpbmRpbmdzLiBJZiBhIHN0eWxlIGJpbmRpbmcgY2hhbmdlcyBpdHMgdmFsdWUgdG8gbnVsbCB0aGVuIHRoZSBpbml0aWFsIHN0eWxpbmdcbiAqICAgdmFsdWVzIHRoYXQgYXJlIHBhc3NlZCBpbiBoZXJlIHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoaWYgbWF0Y2hlZCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIChpZiBwcm92aWRlZClcbiAqICAgdG8gc2FuaXRpemUgdGhlIGFueSBDU1MgcHJvcGVydHkgdmFsdWVzIHRoYXQgYXJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKGR1cmluZyByZW5kZXJpbmcpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmcoXG4gICAgY2xhc3NEZWNsYXJhdGlvbnM/OiAoc3RyaW5nIHwgYm9vbGVhbiB8IEluaXRpYWxTdHlsaW5nRmxhZ3MpW10gfCBudWxsLFxuICAgIHN0eWxlRGVjbGFyYXRpb25zPzogKHN0cmluZyB8IGJvb2xlYW4gfCBJbml0aWFsU3R5bGluZ0ZsYWdzKVtdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKTtcblxuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIGNvbnN0IGhhc0NsYXNzSW5wdXQgPSBpbnB1dERhdGEgJiYgaW5wdXREYXRhLmhhc093blByb3BlcnR5KCdjbGFzcycpID8gdHJ1ZSA6IGZhbHNlO1xuICAgIGlmIChoYXNDbGFzc0lucHV0KSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQ7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSB0aGUgc3R5bGluZyB0ZW1wbGF0ZS5cbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBjcmVhdGVTdHlsaW5nQ29udGV4dFRlbXBsYXRlKFxuICAgICAgICBjbGFzc0RlY2xhcmF0aW9ucywgc3R5bGVEZWNsYXJhdGlvbnMsIHN0eWxlU2FuaXRpemVyLCBoYXNDbGFzc0lucHV0KTtcbiAgfVxuXG4gIGlmIChzdHlsZURlY2xhcmF0aW9ucyAmJiBzdHlsZURlY2xhcmF0aW9ucy5sZW5ndGggfHxcbiAgICAgIGNsYXNzRGVjbGFyYXRpb25zICYmIGNsYXNzRGVjbGFyYXRpb25zLmxlbmd0aCkge1xuICAgIGNvbnN0IGluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICAgIGlmIChkZWxlZ2F0ZVRvQ2xhc3NJbnB1dCh0Tm9kZSkpIHtcbiAgICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldFZpZXdEYXRhKCkpO1xuICAgICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUHJldmlvdXNPckNhY2hlZE11bHRpQ2xhc3NWYWx1ZV0gYXMgc3RyaW5nO1xuICAgICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoZ2V0Vmlld0RhdGEoKSwgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgaW5pdGlhbENsYXNzZXMpO1xuICAgIH1cbiAgICBlbGVtZW50U3R5bGluZ0FwcGx5KGluZGV4KTtcbiAgfVxufVxuXG5cbi8qKlxuICogQXBwbHkgYWxsIHN0eWxpbmcgdmFsdWVzIHRvIHRoZSBlbGVtZW50IHdoaWNoIGhhdmUgYmVlbiBxdWV1ZWQgYnkgYW55IHN0eWxpbmcgaW5zdHJ1Y3Rpb25zLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIG9uY2Ugb25lIG9yIG1vcmUgYGVsZW1lbnRTdHlsZWAgYW5kL29yIGBlbGVtZW50U3R5bGVQcm9wYFxuICogaGF2ZSBiZWVuIGlzc3VlZCBhZ2FpbnN0IHRoZSBlbGVtZW50LiBUaGlzIGZ1bmN0aW9uIHdpbGwgYWxzbyBkZXRlcm1pbmUgaWYgYW55IHN0eWxlcyBoYXZlXG4gKiBjaGFuZ2VkIGFuZCB3aWxsIHRoZW4gc2tpcCB0aGUgb3BlcmF0aW9uIGlmIHRoZXJlIGlzIG5vdGhpbmcgbmV3IHRvIHJlbmRlci5cbiAqXG4gKiBPbmNlIGNhbGxlZCB0aGVuIGFsbCBxdWV1ZWQgc3R5bGVzIHdpbGwgYmUgZmx1c2hlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdGhhdCB3aWxsIGJlIHJlbmRlcmVkLlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseShpbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9ICh2aWV3RGF0YVtGTEFHU10gJiBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSkgIT09IDA7XG4gIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxlQW5kQ2xhc3NCaW5kaW5ncyhcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCB2aWV3RGF0YSksIGdldFJlbmRlcmVyKCksIHZpZXdEYXRhLCBpc0ZpcnN0UmVuZGVyKTtcbiAgaWYgKHRvdGFsUGxheWVyc1F1ZXVlZCA+IDApIHtcbiAgICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RDb250ZXh0KHZpZXdEYXRhKTtcbiAgICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKTtcbiAgfVxufVxuXG4vKipcbiAqIFF1ZXVlIGEgZ2l2ZW4gc3R5bGUgdG8gYmUgcmVuZGVyZWQgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgYG51bGxgIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGVgIG9yIGFueSBzdHlsZXMgdGhhdCBhcmUgcHJlc2VudFxuICogZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkICh3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyBzdHlsaW5nIHN0b3JhZ2UgdG8gY2hhbmdlIGluIHRoZSBkYXRhIGFycmF5LlxuICogICAgICAgIChOb3RlIHRoYXQgdGhpcyBpcyBub3QgdGhlIGVsZW1lbnQgaW5kZXgsIGJ1dCByYXRoZXIgYW4gaW5kZXggdmFsdWUgYWxsb2NhdGVkXG4gKiAgICAgICAgc3BlY2lmaWNhbGx5IGZvciBlbGVtZW50IHN0eWxpbmctLXRoZSBpbmRleCBtdXN0IGJlIHRoZSBuZXh0IGluZGV4IGFmdGVyIHRoZSBlbGVtZW50XG4gKiAgICAgICAgaW5kZXguKVxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2YgdGhlIHN0eWxlIHByb3BlcnR5IG9uIHRoaXMgZWxlbWVudC4gKE1vbm90b25pY2FsbHkgaW5jcmVhc2luZy4pXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcpOiB2b2lkIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXgsIGdldFZpZXdEYXRhKCkpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkKTtcbn1cblxuLyoqXG4gKiBRdWV1ZSBhIGtleS92YWx1ZSBtYXAgb2Ygc3R5bGVzIHRvIGJlIHJlbmRlcmVkIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIHVzYWdlLiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0b1xuICogdGhlIEVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgcGxhY2VkIHdpdGggcmVzcGVjdCB0byBhbnkgc3R5bGVzIHNldCB3aXRoIGBlbGVtZW50U3R5bGVQcm9wYC5cbiAqIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBgbnVsbGAgdGhlbiB0aGV5IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50ICh1bmxlc3MgdGhlIHNhbWVcbiAqIHN0eWxlIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiB1c2luZyBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgc3R5bGluZyBzdG9yYWdlIHRvIGNoYW5nZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqICAgICAgICAoTm90ZSB0aGF0IHRoaXMgaXMgbm90IHRoZSBlbGVtZW50IGluZGV4LCBidXQgcmF0aGVyIGFuIGluZGV4IHZhbHVlIGFsbG9jYXRlZFxuICogICAgICAgIHNwZWNpZmljYWxseSBmb3IgZWxlbWVudCBzdHlsaW5nLS10aGUgaW5kZXggbXVzdCBiZSB0aGUgbmV4dCBpbmRleCBhZnRlciB0aGUgZWxlbWVudFxuICogICAgICAgIGluZGV4LilcbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ01hcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgdmlld0RhdGEpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4LCB2aWV3RGF0YSk7XG4gIGlmIChkZWxlZ2F0ZVRvQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBzdHlsaW5nQ29udGV4dFtTdHlsaW5nSW5kZXguUHJldmlvdXNPckNhY2hlZE11bHRpQ2xhc3NWYWx1ZV0gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIChjbGFzc2VzIGFzIHN0cmluZyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoZ2V0Vmlld0RhdGEoKSwgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gIH1cbiAgdXBkYXRlU3R5bGluZ01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCBnZXRUVmlldygpLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICd0ZXh0IG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZVRleHROb2RlKys7XG4gIGNvbnN0IHRleHROYXRpdmUgPSBjcmVhdGVUZXh0Tm9kZSh2YWx1ZSwgZ2V0UmVuZGVyZXIoKSk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0TmF0aXZlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIHNldElzUGFyZW50KGZhbHNlKTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIHZpZXdEYXRhKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGdldFZpZXdEYXRhKCkpIGFzIGFueSBhcyBSVGV4dDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGdldFJlbmRlcmVyKCk7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgc3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSBzdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3RGF0YSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPVxuICAgICAgZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgdmlld0RhdGEsIHZpZXdEYXRhLmxlbmd0aCAtIDEsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHJvb3RUTm9kZSwgZGlyZWN0aXZlLCBkZWYgYXMgRGlyZWN0aXZlRGVmPFQ+KTtcbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5mdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlld0RhdGEsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10gfCBudWxsLCB0Tm9kZTogVE5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgbGV0IHRvdGFsSG9zdFZhcnMgPSAwO1xuICBpZiAoZGlyZWN0aXZlcykge1xuICAgIGluaXROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG4gICAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAgIC8vIHRoZSB2aWV3RW5naW5lOlxuICAgIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gICAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAvLyBTbyB0byBtYXRjaCB0aGVzZSBydWxlcywgdGhlIG9yZGVyIGluIHdoaWNoIHByb3ZpZGVycyBhcmUgYWRkZWQgaW4gdGhlIGFycmF5cyBpcyB2ZXJ5XG4gICAgLy8gaW1wb3J0YW50LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIH1cbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0Vmlldywgdmlld0RhdGEsIGRlZiwgZGVmLmZhY3RvcnkpO1xuXG4gICAgICB0b3RhbEhvc3RWYXJzICs9IGRlZi5ob3N0VmFycztcbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAodFZpZXcuZGF0YSAhLmxlbmd0aCAtIDEsIGRlZiwgZXhwb3J0c01hcCk7XG5cbiAgICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICAgIHF1ZXVlSW5pdEhvb2tzKGRpcmVjdGl2ZURlZklkeCwgZGVmLm9uSW5pdCwgZGVmLmRvQ2hlY2ssIHRWaWV3KTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xuICBwcmVmaWxsSG9zdFZhcnModFZpZXcsIHZpZXdEYXRhLCB0b3RhbEhvc3RWYXJzKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3RGF0YSwgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgY29uc3QgZW5kID0gc3RhcnQgKyBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgaWYgKCFnZXRGaXJzdFRlbXBsYXRlUGFzcygpICYmIHN0YXJ0IDwgZW5kKSB7XG4gICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKTtcbiAgfVxuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9XG4gICAgICAgIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIHZpZXdEYXRhICEsIGksIHByZXZpb3VzT3JQYXJlbnRUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICAgIHBvc3RQcm9jZXNzRGlyZWN0aXZlKHZpZXdEYXRhLCBkaXJlY3RpdmUsIGRlZiwgaSk7XG4gIH1cbn1cblxuLyoqXG4qIEdlbmVyYXRlcyBhIG5ldyBibG9jayBpbiBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIGZvciB0aGlzIG5vZGUuXG4qXG4qIEVhY2ggZXhwYW5kbyBibG9jayBzdGFydHMgd2l0aCB0aGUgZWxlbWVudCBpbmRleCAodHVybmVkIG5lZ2F0aXZlIHNvIHdlIGNhbiBkaXN0aW5ndWlzaFxuKiBpdCBmcm9tIHRoZSBob3N0VmFyIGNvdW50KSBhbmQgdGhlIGRpcmVjdGl2ZSBjb3VudC4gU2VlIG1vcmUgaW4gVklFV19EQVRBLm1kLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcblxuICBjb25zdCBlbGVtZW50SW5kZXggPSAtKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW1xuICAgXSkpLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbmVlZCB0byByZXNlcnZlIHNwYWNlIGZvciBob3N0IGJpbmRpbmcgdmFsdWVzXG4qIGFmdGVyIGRpcmVjdGl2ZXMgYXJlIG1hdGNoZWQgKHNvIGFsbCBkaXJlY3RpdmVzIGFyZSBzYXZlZCwgdGhlbiBiaW5kaW5ncykuXG4qIEJlY2F1c2Ugd2UgYXJlIHVwZGF0aW5nIHRoZSBibHVlcHJpbnQsIHdlIG9ubHkgbmVlZCB0byBkbyB0aGlzIG9uY2UuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIHByZWZpbGxIb3N0VmFycyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlld0RhdGEsIHRvdGFsSG9zdFZhcnM6IG51bWJlcik6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHRvdGFsSG9zdFZhcnM7IGkrKykge1xuICAgIHZpZXdEYXRhLnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChOT19DSEFOR0UpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3MgYSBkaXJlY3RpdmUgb24gdGhlIGN1cnJlbnQgbm9kZSBhZnRlciBpdHMgY3JlYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzRGlyZWN0aXZlPFQ+KFxuICAgIHZpZXdEYXRhOiBMVmlld0RhdGEsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZGlyZWN0aXZlLCBkZWYpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdwcmV2aW91c09yUGFyZW50VE5vZGUnKTtcbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRlZi5pbnB1dHMsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGVmLmNvbnRlbnRRdWVyaWVzKGRpcmVjdGl2ZURlZklkeCk7XG4gIH1cblxuICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIHZpZXdEYXRhKTtcbiAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICB9XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgcG9zdFByb2Nlc3NEaXJlY3RpdmUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlPFQ+KFxuICAgIHZpZXdEYXRhOiBMVmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIHZpZXdEYXRhKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0sIGdldFRWaWV3KCkuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuXG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIHZpZXdEYXRhKTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIHZpZXdEYXRhKTtcbiAgfVxuXG4gIC8vIFRPRE8obWlza28pOiBzZXRVcEF0dHJpYnV0ZXMgc2hvdWxkIGJlIGEgZmVhdHVyZSBmb3IgYmV0dGVyIHRyZWVzaGFrYWJpbGl0eS5cbiAgaWYgKGRlZi5hdHRyaWJ1dGVzICE9IG51bGwgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlIGFzIFJFbGVtZW50LCBkZWYuYXR0cmlidXRlcyBhcyBzdHJpbmdbXSk7XG4gIH1cbn1cblxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXdEYXRhLCB0Tm9kZTogVE5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfFxuICAgIG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IFtdKSkucHVzaChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgpO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGRpcmVjdGl2ZSBhbmQgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nIENELlxuKi9cbmZ1bmN0aW9uIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayh0VmlldzogVFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICEucHVzaChkZWYuaG9zdEJpbmRpbmdzIHx8IG5vb3ApO1xuICBpZiAoZGVmLmhvc3RWYXJzKSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICEucHVzaChkZWYuaG9zdFZhcnMpO1xufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzXSA9IGluZGV4O1xuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIHRoZSBmbGFncyBvbiB0aGUgY3VycmVudCBub2RlLCBzZXR0aW5nIGFsbCBpbmRpY2VzIHRvIHRoZSBpbml0aWFsIGluZGV4LFxuICogdGhlIGRpcmVjdGl2ZSBjb3VudCB0byAwLCBhbmQgYWRkaW5nIHRoZSBpc0NvbXBvbmVudCBmbGFnLlxuICogQHBhcmFtIGluZGV4IHRoZSBpbml0aWFsIGluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Tm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdleHBlY3RlZCBmaXJzdFRlbXBsYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmbGFncyA9PT0gMCB8fCBmbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnZXhwZWN0ZWQgbm9kZSBmbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzayxcbiAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZmxhZ3MgPSBpbmRleCA8PCBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdCB8IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCB8XG4gICAgICBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlld0RhdGEsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LFxuICAgIGRpcmVjdGl2ZUZhY3Rvcnk6ICh0OiBUeXBlPFQ+fCBudWxsKSA9PiBhbnkpIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBudWxsKTtcbiAgdFZpZXcuYmx1ZXByaW50LnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG4gIHZpZXdEYXRhLnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG5cbiAgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKHRWaWV3LCBkZWYpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICB2aWV3RGF0YTogTFZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgdmlld0RhdGEpO1xuXG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXdEYXRhKFxuICAgICAgICAgIGdldFJlbmRlcmVyRmFjdG9yeSgpLmNyZWF0ZVJlbmRlcmVyKG5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmKSwgdFZpZXcsIG51bGwsXG4gICAgICAgICAgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBnZXRDdXJyZW50U2FuaXRpemVyKCkpKTtcblxuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBjb21wb25lbnRWaWV3W0hPU1RdID0gdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgdmlld0RhdGFbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGlucHV0czoge1tQIGluIGtleW9mIFRdOiBzdHJpbmc7fSwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW2luaXRpYWxJbnB1dHNbaV1dID0gaW5pdGlhbElucHV0c1tpICsgMV07XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2gobWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQsXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgY3VycmVudFZpZXc6IExWaWV3RGF0YSxcbiAgICBuYXRpdmU6IFJDb21tZW50LCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIHJldHVybiBbXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmID8gLTEgOiAwLCAgICAgICAgICAvLyBhY3RpdmUgaW5kZXhcbiAgICBbXSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhvc3QgbmF0aXZlXG4gICAgbmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuYXRpdmVcbiAgICBnZXRSZW5kZXJQYXJlbnQoaG9zdFROb2RlLCBjdXJyZW50VmlldykgIC8vIHJlbmRlclBhcmVudFxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIC8vIFRPRE86IGNvbnNpZGVyIGEgc2VwYXJhdGUgbm9kZSB0eXBlIGZvciB0ZW1wbGF0ZXNcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgdGFnTmFtZSB8fCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSkge1xuICAgIHROb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIHZpZXdEYXRhLCBsb2NhbFJlZnMsIGxvY2FsUmVmRXh0cmFjdG9yKTtcbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBnZXRDdXJyZW50UXVlcmllcygpO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgc2V0Q3VycmVudFF1ZXJpZXMoY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUpKTtcbiAgfVxuICBxdWV1ZUxpZmVjeWNsZUhvb2tzKHROb2RlLmZsYWdzLCB0Vmlldyk7XG4gIHNldElzUGFyZW50KGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgKHROb2RlLnRWaWV3cyA9IFtdKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgZ2V0VFZpZXcoKS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnY29udGFpbmVyIG5vZGVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCBjb21tZW50ID0gZ2V0UmVuZGVyZXIoKS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCB0YWdOYW1lLCBhdHRycyk7XG4gIGNvbnN0IGxDb250YWluZXIgPSB2aWV3RGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICBjcmVhdGVMQ29udGFpbmVyKHZpZXdEYXRhW2FkanVzdGVkSW5kZXhdLCB0Tm9kZSwgdmlld0RhdGEsIGNvbW1lbnQpO1xuXG4gIGFwcGVuZENoaWxkKGNvbW1lbnQsIHROb2RlLCB2aWV3RGF0YSk7XG5cbiAgLy8gQ29udGFpbmVycyBhcmUgYWRkZWQgdG8gdGhlIGN1cnJlbnQgdmlldyB0cmVlIGluc3RlYWQgb2YgdGhlaXIgZW1iZWRkZWQgdmlld3NcbiAgLy8gYmVjYXVzZSB2aWV3cyBjYW4gYmUgcmVtb3ZlZCBhbmQgcmUtaW5zZXJ0ZWQuXG4gIGFkZFRvVmlld1RyZWUodmlld0RhdGEsIGluZGV4ICsgSEVBREVSX09GRlNFVCwgbENvbnRhaW5lcik7XG5cbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBnZXRDdXJyZW50UXVlcmllcygpO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCB0VmlldyA9IGdldFRWaWV3KCk7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBsb2FkSW50ZXJuYWwoaW5kZXgsIHRWaWV3LmRhdGEpIGFzIFROb2RlO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgc2V0SXNQYXJlbnQodHJ1ZSk7XG5cbiAgdmlld0RhdGFbaW5kZXggKyBIRUFERVJfT0ZGU0VUXVtBQ1RJVkVfSU5ERVhdID0gMDtcblxuICBpZiAoIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKSB7XG4gICAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAgIC8vIGJlZm9yZSB0aGV5IGFyZSBjYWxsZWQgaW4gZW1iZWRkZWQgdmlld3MgKGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eSkuXG4gICAgZXhlY3V0ZUluaXRIb29rcyh2aWV3RGF0YSwgdFZpZXcsIGdldENyZWF0aW9uTW9kZSgpKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXIuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXIgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCB2aWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcblxuICBjb25zdCBsQ29udGFpbmVyID0gZ2V0Vmlld0RhdGEoKVtwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXdEYXRhOiBMVmlld0RhdGEpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGdldExWaWV3Q2hpbGQobFZpZXdEYXRhKTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlld0RhdGEgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld0RhdGFcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnQubGVuZ3RoIDwgSEVBREVSX09GRlNFVCAmJiBjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IC0xKSB7XG4gICAgICBjb25zdCBjb250YWluZXIgPSBjdXJyZW50IGFzIExDb250YWluZXI7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lcltWSUVXU10ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXdEYXRhID0gY29udGFpbmVyW1ZJRVdTXVtpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoXG4gICAgICAgICAgICBkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhLFxuICAgICAgICAgICAgUmVuZGVyRmxhZ3MuVXBkYXRlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXdEYXRhfG51bGwge1xuICBjb25zdCB2aWV3cyA9IGxDb250YWluZXJbVklFV1NdO1xuICBmb3IgKGxldCBpID0gc3RhcnRJZHg7IGkgPCB2aWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHZpZXdBdFBvc2l0aW9uSWQgPSB2aWV3c1tpXVtUVklFV10uaWQ7XG4gICAgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPT09IHZpZXdCbG9ja0lkKSB7XG4gICAgICByZXR1cm4gdmlld3NbaV07XG4gICAgfSBlbHNlIGlmICh2aWV3QXRQb3NpdGlvbklkIDwgdmlld0Jsb2NrSWQpIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB0aGF0IHNob3VsZCBub3QgYmUgYXQgdGhpcyBwb3NpdGlvbiAtIHJlbW92ZVxuICAgICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCB0Q29udGFpbmVyTm9kZSwgaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIGZvdW5kIGEgdmlldyB3aXRoIGlkIGdyZWF0ZXIgdGhhbiB0aGUgb25lIHdlIGFyZSBzZWFyY2hpbmcgZm9yXG4gICAgICAvLyB3aGljaCBtZWFucyB0aGF0IHJlcXVpcmVkIHZpZXcgZG9lc24ndCBleGlzdCBhbmQgY2FuJ3QgYmUgZm91bmQgYXRcbiAgICAgIC8vIGxhdGVyIHBvc2l0aW9ucyBpbiB0aGUgdmlld3MgYXJyYXkgLSBzdG9wIHRoZSBzZWFyY2hkZWYuY29udCBoZXJlXG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogTWFya3MgdGhlIHN0YXJ0IG9mIGFuIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogQHBhcmFtIHZpZXdCbG9ja0lkIFRoZSBJRCBvZiB0aGlzIHZpZXdcbiAqIEByZXR1cm4gYm9vbGVhbiBXaGV0aGVyIG9yIG5vdCB0aGlzIHZpZXcgaXMgaW4gY3JlYXRpb24gbW9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3U3RhcnQodmlld0Jsb2NrSWQ6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcik6IFJlbmRlckZsYWdzIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgLy8gVGhlIHByZXZpb3VzIG5vZGUgY2FuIGJlIGEgdmlldyBub2RlIGlmIHdlIGFyZSBwcm9jZXNzaW5nIGFuIGlubGluZSBmb3IgbG9vcFxuICBjb25zdCBjb250YWluZXJUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldyA/XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICEgOlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlO1xuICBjb25zdCBsQ29udGFpbmVyID0gdmlld0RhdGFbY29udGFpbmVyVE5vZGUuaW5kZXhdIGFzIExDb250YWluZXI7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGNvbnRhaW5lclROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgbGV0IHZpZXdUb1JlbmRlciA9IHNjYW5Gb3JWaWV3KFxuICAgICAgbENvbnRhaW5lciwgY29udGFpbmVyVE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCB2aWV3QmxvY2tJZCk7XG5cbiAgaWYgKHZpZXdUb1JlbmRlcikge1xuICAgIHNldElzUGFyZW50KHRydWUpO1xuICAgIGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUVklFV10ubm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2hlbiB3ZSBjcmVhdGUgYSBuZXcgTFZpZXcsIHdlIGFsd2F5cyByZXNldCB0aGUgc3RhdGUgb2YgdGhlIGluc3RydWN0aW9ucy5cbiAgICB2aWV3VG9SZW5kZXIgPSBjcmVhdGVMVmlld0RhdGEoXG4gICAgICAgIGdldFJlbmRlcmVyKCksXG4gICAgICAgIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyh2aWV3QmxvY2tJZCwgY29uc3RzLCB2YXJzLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSksIG51bGwsXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGdldEN1cnJlbnRTYW5pdGl6ZXIoKSk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVWaWV3Tm9kZSh2aWV3QmxvY2tJZCwgdmlld1RvUmVuZGVyKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9XG4gIGlmIChsQ29udGFpbmVyKSB7XG4gICAgaWYgKGdldENyZWF0aW9uTW9kZSgpKSB7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyh2aWV3VG9SZW5kZXIsIGxDb250YWluZXIsIHZpZXdEYXRhLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgLTEpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISsrO1xuICB9XG4gIHJldHVybiBnZXRSZW5kZXJGbGFncyh2aWV3VG9SZW5kZXIpO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemUgdGhlIFRWaWV3IChlLmcuIHN0YXRpYyBkYXRhKSBmb3IgdGhlIGFjdGl2ZSBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEVhY2ggZW1iZWRkZWQgdmlldyBibG9jayBtdXN0IGNyZWF0ZSBvciByZXRyaWV2ZSBpdHMgb3duIFRWaWV3LiBPdGhlcndpc2UsIHRoZSBlbWJlZGRlZCB2aWV3J3NcbiAqIHN0YXRpYyBkYXRhIGZvciBhIHBhcnRpY3VsYXIgbm9kZSB3b3VsZCBvdmVyd3JpdGUgdGhlIHN0YXRpYyBkYXRhIGZvciBhIG5vZGUgaW4gdGhlIHZpZXcgYWJvdmVcbiAqIGl0IHdpdGggdGhlIHNhbWUgaW5kZXggKHNpbmNlIGl0J3MgaW4gdGhlIHNhbWUgdGVtcGxhdGUpLlxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIGluZGV4IG9mIHRoZSBUVmlldyBpbiBUTm9kZS50Vmlld3NcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgYW5kIHB1cmUgZnVuY3Rpb24gYmluZGluZ3MgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRhaW5lciBUaGUgcGFyZW50IGNvbnRhaW5lciBpbiB3aGljaCB0byBsb29rIGZvciB0aGUgdmlldydzIHN0YXRpYyBkYXRhXG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIHBhcmVudDogVENvbnRhaW5lck5vZGUpOiBUVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IHBhcmVudC50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICB2aWV3SW5kZXgsIG51bGwsIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCB2aWV3SG9zdCA9IHZpZXdEYXRhW0hPU1RfTk9ERV07XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Modmlld0RhdGEsIG51bGwpO1xuICBsZWF2ZVZpZXcodmlld0RhdGFbUEFSRU5UXSAhKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ICEpO1xuICBzZXRJc1BhcmVudChmYWxzZSk7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3RGF0YVtdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oXG4gICAgYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlciwgcGFyZW50Rmlyc3RUZW1wbGF0ZVBhc3M6IGJvb2xlYW4sIHJmOiBSZW5kZXJGbGFncyB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgaG9zdFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChhZGp1c3RlZEVsZW1lbnRJbmRleCwgZ2V0Vmlld0RhdGEoKSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShnZXRUVmlldygpLmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgLy8gT25seSBhdHRhY2hlZCBDaGVja0Fsd2F5cyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAodmlld0F0dGFjaGVkKGhvc3RWaWV3KSAmJiBob3N0Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgcGFyZW50Rmlyc3RUZW1wbGF0ZVBhc3MgJiYgc3luY1ZpZXdXaXRoQmx1ZXByaW50KGhvc3RWaWV3KTtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoaG9zdFZpZXcsIGhvc3RWaWV3W0NPTlRFWFRdLCByZik7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlld0RhdGEgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3RGF0YSBpcyBjcmVhdGVkLlxuICogMy4gU2Vjb25kIDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXdEYXRhIGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlld0RhdGEgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VmlldzogTFZpZXdEYXRhKSB7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBjb21wb25lbnRWaWV3Lmxlbmd0aDsgaSA8IGNvbXBvbmVudFRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGNvbXBvbmVudFZpZXdbaV0gPSBjb21wb25lbnRUVmlldy5ibHVlcHJpbnRbaV07XG4gIH1cbn1cblxuLyoqIFJldHVybnMgYSBib29sZWFuIGZvciB3aGV0aGVyIHRoZSB2aWV3IGlzIGF0dGFjaGVkICovXG5leHBvcnQgZnVuY3Rpb24gdmlld0F0dGFjaGVkKHZpZXc6IExWaWV3RGF0YSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5BdHRhY2hlZCkgPT09IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogSW5zdHJ1Y3Rpb24gdG8gZGlzdHJpYnV0ZSBwcm9qZWN0YWJsZSBub2RlcyBhbW9uZyA8bmctY29udGVudD4gb2NjdXJyZW5jZXMgaW4gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEl0IHRha2VzIGFsbCB0aGUgc2VsZWN0b3JzIGZyb20gdGhlIGVudGlyZSBjb21wb25lbnQncyB0ZW1wbGF0ZSBhbmQgZGVjaWRlcyB3aGVyZVxuICogZWFjaCBwcm9qZWN0ZWQgbm9kZSBiZWxvbmdzIChpdCByZS1kaXN0cmlidXRlcyBub2RlcyBhbW9uZyBcImJ1Y2tldHNcIiB3aGVyZSBlYWNoIFwiYnVja2V0XCIgaXNcbiAqIGJhY2tlZCBieSBhIHNlbGVjdG9yKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlcXVpcmVzIENTUyBzZWxlY3RvcnMgdG8gYmUgcHJvdmlkZWQgaW4gMiBmb3JtczogcGFyc2VkIChieSBhIGNvbXBpbGVyKSBhbmQgdGV4dCxcbiAqIHVuLXBhcnNlZCBmb3JtLlxuICpcbiAqIFRoZSBwYXJzZWQgZm9ybSBpcyBuZWVkZWQgZm9yIGVmZmljaWVudCBtYXRjaGluZyBvZiBhIG5vZGUgYWdhaW5zdCBhIGdpdmVuIENTUyBzZWxlY3Rvci5cbiAqIFRoZSB1bi1wYXJzZWQsIHRleHR1YWwgZm9ybSBpcyBuZWVkZWQgZm9yIHN1cHBvcnQgb2YgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZS5cbiAqXG4gKiBIYXZpbmcgYSBDU1Mgc2VsZWN0b3IgaW4gMiBkaWZmZXJlbnQgZm9ybWF0cyBpcyBub3QgaWRlYWwsIGJ1dCBhbHRlcm5hdGl2ZXMgaGF2ZSBldmVuIG1vcmVcbiAqIGRyYXdiYWNrczpcbiAqIC0gaGF2aW5nIG9ubHkgYSB0ZXh0dWFsIGZvcm0gd291bGQgcmVxdWlyZSBydW50aW1lIHBhcnNpbmcgb2YgQ1NTIHNlbGVjdG9ycztcbiAqIC0gd2UgY2FuJ3QgaGF2ZSBvbmx5IGEgcGFyc2VkIGFzIHdlIGNhbid0IHJlLWNvbnN0cnVjdCB0ZXh0dWFsIGZvcm0gZnJvbSBpdCAoYXMgZW50ZXJlZCBieSBhXG4gKiB0ZW1wbGF0ZSBhdXRob3IpLlxuICpcbiAqIEBwYXJhbSBzZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIHBhcnNlZCBDU1Mgc2VsZWN0b3JzXG4gKiBAcGFyYW0gcmF3U2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBDU1Mgc2VsZWN0b3JzIGluIHRoZSByYXcsIHVuLXBhcnNlZCBmb3JtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGVmKHNlbGVjdG9ycz86IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRWaWV3KGdldFZpZXdEYXRhKCkpW0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmICghY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgY29uc3Qgbm9PZk5vZGVCdWNrZXRzID0gc2VsZWN0b3JzID8gc2VsZWN0b3JzLmxlbmd0aCArIDEgOiAxO1xuICAgIGNvbnN0IHBEYXRhOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHBEYXRhLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBidWNrZXRJbmRleCA9XG4gICAgICAgICAgc2VsZWN0b3JzID8gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISkgOiAwO1xuICAgICAgY29uc3QgbmV4dE5vZGUgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLm5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBEYXRhW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgICBjb21wb25lbnRDaGlsZC5uZXh0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuXG4gICAgICBjb21wb25lbnRDaGlsZCA9IG5leHROb2RlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHByb2plY3Rpb24oKSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2YgcHJvamVjdGlvbigpIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXdEYXRhIHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuXG4gIC8vIHJlLWRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0YWJsZSBub2RlcyBpcyBzdG9yZWQgb24gYSBjb21wb25lbnQncyB2aWV3IGxldmVsXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyh2aWV3RGF0YSk7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcbiAgbGV0IHByb2plY3RlZFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcblxuICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgIGlmIChub2RlVG9Qcm9qZWN0LnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBUaGlzIG5vZGUgaXMgcmUtcHJvamVjdGVkLCBzbyB3ZSBtdXN0IGdvIHVwIHRoZSB0cmVlIHRvIGdldCBpdHMgcHJvamVjdGVkIG5vZGVzLlxuICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhwcm9qZWN0ZWRWaWV3KTtcbiAgICAgIGNvbnN0IGN1cnJlbnRDb21wb25lbnRIb3N0ID0gY3VycmVudENvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICBjb25zdCBmaXJzdFByb2plY3RlZE5vZGUgPVxuICAgICAgICAgIChjdXJyZW50Q29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIGlmIChmaXJzdFByb2plY3RlZE5vZGUpIHtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gbm9kZVRvUHJvamVjdDtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gcHJvamVjdGVkVmlldztcblxuICAgICAgICBub2RlVG9Qcm9qZWN0ID0gZmlyc3RQcm9qZWN0ZWROb2RlO1xuICAgICAgICBwcm9qZWN0ZWRWaWV3ID0gY3VycmVudENvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhpcyBmbGFnIG11c3QgYmUgc2V0IG5vdyBvciB3ZSB3b24ndCBrbm93IHRoYXQgdGhpcyBub2RlIGlzIHByb2plY3RlZFxuICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgbm9kZVRvUHJvamVjdC5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShub2RlVG9Qcm9qZWN0LCB0UHJvamVjdGlvbk5vZGUsIHZpZXdEYXRhLCBwcm9qZWN0ZWRWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBhcmUgZmluaXNoZWQgd2l0aCBhIGxpc3Qgb2YgcmUtcHJvamVjdGVkIG5vZGVzLCB3ZSBuZWVkIHRvIGdldFxuICAgIC8vIGJhY2sgdG8gdGhlIHJvb3QgcHJvamVjdGlvbiBub2RlIHRoYXQgd2FzIHJlLXByb2plY3RlZC5cbiAgICBpZiAobm9kZVRvUHJvamVjdC5uZXh0ID09PSBudWxsICYmIHByb2plY3RlZFZpZXcgIT09IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhKSB7XG4gICAgICBwcm9qZWN0ZWRWaWV3ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExWaWV3RGF0YTtcbiAgICAgIG5vZGVUb1Byb2plY3QgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgVE5vZGU7XG4gICAgfVxuICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0Lm5leHQ7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3RGF0YSBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgdmlldyB3aGVyZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld0RhdGFbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIHN0YXRlIFRoZSBMVmlld0RhdGEgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXdEYXRhfExDb250YWluZXI+KFxuICAgIGN1cnJlbnRWaWV3OiBMVmlld0RhdGEsIGFkanVzdGVkSG9zdEluZGV4OiBudW1iZXIsIHN0YXRlOiBUKTogVCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSBnZXRGaXJzdFRlbXBsYXRlUGFzcygpO1xuICBpZiAoY3VycmVudFZpZXdbVEFJTF0pIHtcbiAgICBjdXJyZW50Vmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgY3VycmVudFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3RGF0YSBkaXJ0eS4gKi9cbmZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKHZpZXdEYXRhOiBMVmlld0RhdGEsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh2aWV3SW5kZXgsIHZpZXdEYXRhKTtcbiAgaWYgKCEodmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIHZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuICovXG5mdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoUHJldmVudERlZmF1bHQobGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fcHJldmVudERlZmF1bHQoZTogRXZlbnQpIHtcbiAgICBpZiAobGlzdGVuZXJGbihlKSA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbi8qKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkgKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KHZpZXc6IExWaWV3RGF0YSk6IHZvaWQge1xuICBsZXQgY3VycmVudFZpZXc6IExWaWV3RGF0YSA9IHZpZXc7XG5cbiAgd2hpbGUgKGN1cnJlbnRWaWV3ICYmICEoY3VycmVudFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY3VycmVudFZpZXcgPSBjdXJyZW50Vmlld1tQQVJFTlRdICE7XG4gIH1cbiAgY3VycmVudFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGN1cnJlbnRWaWV3W0NPTlRFWFRdLCAncm9vdENvbnRleHQgc2hvdWxkIGJlIGRlZmluZWQnKTtcblxuICBjb25zdCByb290Q29udGV4dCA9IGN1cnJlbnRWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcyk7XG59XG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2s8VD4ocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKFxuICAgICAgICByZWFkUGF0Y2hlZExWaWV3RGF0YShyb290Q29tcG9uZW50KSAhLCByb290Q29tcG9uZW50LCBSZW5kZXJGbGFncy5VcGRhdGUpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBjb21wb25lbnQgKGFuZCBwb3NzaWJseSBpdHMgc3ViLWNvbXBvbmVudHMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBpbiBhIHN5bmNocm9ub3VzIHdheSBvbiBhIGNvbXBvbmVudC4gVGhlcmUgc2hvdWxkXG4gKiBiZSB2ZXJ5IGxpdHRsZSByZWFzb24gdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIGRpcmVjdGx5IHNpbmNlIGEgcHJlZmVycmVkIHdheSB0byBkbyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBpcyB0byB7QGxpbmsgbWFya0RpcnR5fSB0aGUgY29tcG9uZW50IGFuZCB3YWl0IGZvciB0aGUgc2NoZWR1bGVyIHRvIGNhbGwgdGhpcyBtZXRob2RcbiAqIGF0IHNvbWUgZnV0dXJlIHBvaW50IGluIHRpbWUuIFRoaXMgaXMgYmVjYXVzZSBhIHNpbmdsZSB1c2VyIGFjdGlvbiBvZnRlbiByZXN1bHRzIGluIG1hbnlcbiAqIGNvbXBvbmVudHMgYmVpbmcgaW52YWxpZGF0ZWQgYW5kIGNhbGxpbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBlYWNoIGNvbXBvbmVudCBzeW5jaHJvbm91c2x5XG4gKiB3b3VsZCBiZSBpbmVmZmljaWVudC4gSXQgaXMgYmV0dGVyIHRvIHdhaXQgdW50aWwgYWxsIGNvbXBvbmVudHMgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmRcbiAqIHRoZW4gcGVyZm9ybSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBhY3Jvc3MgYWxsIG9mIHRoZSBjb21wb25lbnRzXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwoZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KSAhLCBjb21wb25lbnQsIG51bGwpO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXdEYXRhIFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdEYXRhW0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3RGF0YSBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlld0RhdGE6IExWaWV3RGF0YSk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXdEYXRhKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KGhvc3RWaWV3OiBMVmlld0RhdGEsIGNvbXBvbmVudDogVCwgcmY6IFJlbmRlckZsYWdzIHwgbnVsbCkge1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICBjb25zdCB0ZW1wbGF0ZUZuID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IGhvc3RUVmlldy52aWV3UXVlcnk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgcmYsIGhvc3RWaWV3W0ZMQUdTXSwgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZUZuKHJmIHx8IGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3LCByZik7XG4gICAgdXBkYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXdbRkxBR1NdLCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3LCByZiA9PT0gUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3UXVlcnk8VD4oXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIHJlbmRlckZsYWdzOiBSZW5kZXJGbGFncyB8IG51bGwsIHZpZXdGbGFnczogTFZpZXdGbGFncyxcbiAgICBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSAmJiAocmVuZGVyRmxhZ3MgPT09IFJlbmRlckZsYWdzLkNyZWF0ZSB8fFxuICAgICAgICAgICAgICAgICAgICAocmVuZGVyRmxhZ3MgPT09IG51bGwgJiYgKHZpZXdGbGFncyAmIExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlKSkpKSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3UXVlcnk8VD4oXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSAmJiBmbGFncyAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIG1hcmtWaWV3RGlydHkoZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KSk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGdldFZpZXdEYXRhKClbQklORElOR19JTkRFWF0rKywgdmFsdWUpID8gdmFsdWUgOiBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuXG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgLy8gQ2hlY2sgaWYgYmluZGluZ3MgKG9kZCBpbmRleGVzKSBoYXZlIGNoYW5nZWRcbiAgICBiaW5kaW5nVXBkYXRlZChnZXRWaWV3RGF0YSgpW0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlc1tpXSkgJiYgKGRpZmZlcmVudCA9IHRydWUpO1xuICB9XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoZ2V0Vmlld0RhdGEoKVtCSU5ESU5HX0lOREVYXSsrLCB2MCk7XG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAyIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24yKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMih2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDModmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIpO1xuICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArPSAzO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICtcbiAgICAgICAgICBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNCh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIodmlld0RhdGFbQklORElOR19JTkRFWF0gKyA0LCB2NCwgdjUpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNjtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDcgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyh2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gNztcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjgoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQodmlld0RhdGFbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgdmlld0RhdGFbQklORElOR19JTkRFWF0gKz0gODtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0VFZpZXcoKTtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gIH1cbiAgZ2V0Vmlld0RhdGEoKVthZGp1c3RlZEluZGV4XSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGxvY2FsIHJlZmVyZW5jZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHRWaWV3RGF0YS5cbiAqXG4gKiBJZiB0aGUgcmVmZXJlbmNlIHRvIHJldHJpZXZlIGlzIGluIGEgcGFyZW50IHZpZXcsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgdXNlZCBpbiBjb25qdW5jdGlvblxuICogd2l0aCBhIG5leHRDb250ZXh0KCkgY2FsbCwgd2hpY2ggd2Fsa3MgdXAgdGhlIHRyZWUgYW5kIHVwZGF0ZXMgdGhlIGNvbnRleHRWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBsb2NhbCByZWYgaW4gY29udGV4dFZpZXdEYXRhLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmZXJlbmNlPFQ+KGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgY29udGV4dFZpZXdEYXRhID0gZ2V0Q29udGV4dFZpZXdEYXRhKCk7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIGNvbnRleHRWaWV3RGF0YSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2FkUXVlcnlMaXN0PFQ+KHF1ZXJ5TGlzdElkeDogbnVtYmVyKTogUXVlcnlMaXN0PFQ+IHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICAgICAgICAgICB2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdLFxuICAgICAgICAgICAgICAgICAgICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShxdWVyeUxpc3RJZHgsIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gISk7XG5cbiAgcmV0dXJuIHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oaW5kZXgsIGdldFZpZXdEYXRhKCkpO1xufVxuXG4vKiogR2V0cyB0aGUgY3VycmVudCBiaW5kaW5nIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIpOiBhbnkge1xuICBjb25zdCB2aWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZSh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbCh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCBOT19DSEFOR0UsICdTdG9yZWQgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgcmV0dXJuIHZpZXdEYXRhW2JpbmRpbmdJbmRleF07XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgaXQgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKHZhbHVlLCBOT19DSEFOR0UsICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oXG4gICAgICAgICAgICAgICAgICAgYmluZGluZ0luZGV4LCB2aWV3RGF0YS5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgdG8gTk9fQ0hBTkdFYCk7XG5cbiAgaWYgKHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPT09IE5PX0NIQU5HRSkge1xuICAgIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIGlmIChpc0RpZmZlcmVudCh2aWV3RGF0YVtiaW5kaW5nSW5kZXhdLCB2YWx1ZSwgY2hlY2tOb0NoYW5nZXNNb2RlKSkge1xuICAgIHRocm93RXJyb3JJZk5vQ2hhbmdlc01vZGUoZ2V0Q3JlYXRpb25Nb2RlKCksIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdmlld0RhdGFbYmluZGluZ0luZGV4XSwgdmFsdWUpO1xuICAgIHZpZXdEYXRhW2JpbmRpbmdJbmRleF0gPSB2YWx1ZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59XG5cbi8qKiBVcGRhdGVzIGJpbmRpbmcgYW5kIHJldHVybnMgdGhlIHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVwZGF0ZUJpbmRpbmcoYmluZGluZ0luZGV4OiBudW1iZXIsIHZhbHVlOiBhbnkpOiBhbnkge1xuICByZXR1cm4gZ2V0Vmlld0RhdGEoKVtiaW5kaW5nSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKiBVcGRhdGVzIDIgYmluZGluZ3MgaWYgY2hhbmdlZCwgdGhlbiByZXR1cm5zIHdoZXRoZXIgZWl0aGVyIHdhcyB1cGRhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXg6IG51bWJlciwgZXhwMTogYW55LCBleHAyOiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4LCBleHAxKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGJpbmRpbmdJbmRleCArIDEsIGV4cDIpIHx8IGRpZmZlcmVudDtcbn1cblxuLyoqIFVwZGF0ZXMgMyBiaW5kaW5ncyBpZiBjaGFuZ2VkLCB0aGVuIHJldHVybnMgd2hldGhlciBhbnkgd2FzIHVwZGF0ZWQuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZGluZ1VwZGF0ZWQzKGJpbmRpbmdJbmRleDogbnVtYmVyLCBleHAxOiBhbnksIGV4cDI6IGFueSwgZXhwMzogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXgsIGV4cDEsIGV4cDIpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQoYmluZGluZ0luZGV4ICsgMiwgZXhwMykgfHwgZGlmZmVyZW50O1xufVxuXG4vKiogVXBkYXRlcyA0IGJpbmRpbmdzIGlmIGNoYW5nZWQsIHRoZW4gcmV0dXJucyB3aGV0aGVyIGFueSB3YXMgdXBkYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kaW5nVXBkYXRlZDQoXG4gICAgYmluZGluZ0luZGV4OiBudW1iZXIsIGV4cDE6IGFueSwgZXhwMjogYW55LCBleHAzOiBhbnksIGV4cDQ6IGFueSk6IGJvb2xlYW4ge1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIoYmluZGluZ0luZGV4LCBleHAxLCBleHAyKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkMihiaW5kaW5nSW5kZXggKyAyLCBleHAzLCBleHA0KSB8fCBkaWZmZXJlbnQ7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBESVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBgZGlyZWN0aXZlSW5qZWN0YCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBkaXJlY3RpdmUsIGNvbXBvbmVudCBhbmQgcGlwZSBmYWN0b3JpZXMuXG4gKiAgQWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgbm9kZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIHR5cGUgb3IgdG9rZW4gdG8gaW5qZWN0XG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGdldFZpZXdEYXRhKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogRmFjYWRlIGZvciB0aGUgYXR0cmlidXRlIGluamVjdGlvbiBmcm9tIERJLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICByZXR1cm4gaW5qZWN0QXR0cmlidXRlSW1wbChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgYXR0ck5hbWVUb0luamVjdCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZW50UXVlcnk8UT4oXG4gICAgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8UT4sIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRUVmlldygpO1xuICBjb25zdCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoID1cbiAgICAgICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdIHx8ICh2aWV3RGF0YVtDT05URU5UX1FVRVJJRVNdID0gW10pKS5wdXNoKHF1ZXJ5TGlzdCk7XG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgY29uc3QgdFZpZXdDb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzIHx8ICh0Vmlldy5jb250ZW50UXVlcmllcyA9IFtdKTtcbiAgICBjb25zdCBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCA9XG4gICAgICAgIHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCA/IHRWaWV3LmNvbnRlbnRRdWVyaWVzW3RWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aCAtIDJdIDogLTE7XG4gICAgaWYgKGN1cnJlbnREaXJlY3RpdmVJbmRleCAhPT0gbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgIHRWaWV3Q29udGVudFF1ZXJpZXMucHVzaChjdXJyZW50RGlyZWN0aXZlSW5kZXgsIHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZnVuY3Rpb24gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlOiBUTm9kZSB8IG51bGwpIHtcbiAgLy8gSWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZC5cbiAgaWYgKHROb2RlKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZS5mbGFncywgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gICAgfVxuICAgIHJldHVybiB0Tm9kZS5pbnB1dHM7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWxlZ2F0ZVRvQ2xhc3NJbnB1dCh0Tm9kZTogVE5vZGUpIHtcbiAgcmV0dXJuIHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xufVxuIl19