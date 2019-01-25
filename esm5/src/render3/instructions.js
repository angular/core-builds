/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectFlags } from '../di';
import { resolveForwardRef } from '../di/forward_ref';
import { validateAttribute, validateProperty } from '../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertEqual, assertLessThan, assertNotEqual } from '../util/assert';
import { isObservable } from '../util/lang';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../util/ng_reflect';
import { assertHasParent, assertPreviousIsParent } from './assert';
import { bindingUpdated, bindingUpdated2, bindingUpdated3, bindingUpdated4 } from './bindings';
import { attachPatchData, getComponentViewByInstance } from './context_discovery';
import { diPublicInInjector, getNodeInjectable, getOrCreateInjectable, getOrCreateNodeInjectorForNode, injectAttributeImpl } from './di';
import { throwMultipleComponentError } from './errors';
import { executeHooks, executeInitHooks, registerPostOrderHooks, registerPreOrderHooks } from './hooks';
import { ACTIVE_INDEX, VIEWS } from './interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from './interfaces/injector';
import { NG_PROJECT_AS_ATTR_NAME } from './interfaces/projection';
import { isProceduralRenderer } from './interfaces/renderer';
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTENT_QUERIES, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, getLViewChild, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { decreaseElementDepthCount, enterView, getBindingsEnabled, getCheckNoChangesMode, getContextLView, getCurrentDirectiveDef, getElementDepthCount, getFirstTemplatePass, getIsParent, getLView, getPreviousOrParentTNode, increaseElementDepthCount, isCreationMode, leaveView, nextContextImpl, resetComponentState, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentViewQueryIndex, setFirstTemplatePass, setIsParent, setPreviousOrParentTNode } from './state';
import { getInitialClassNameValue, initializeStaticContext as initializeStaticStylingContext, patchContextWithStaticAttrs, renderInitialStylesAndClasses, renderStyling, updateClassProp as updateElementClassProp, updateContextWithBindings, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling/class_and_style_bindings';
import { BoundPlayerFactory } from './styling/player_factory';
import { createEmptyStylingContext, getStylingContext, hasClassInput, hasStyling, isAnimationProp } from './styling/util';
import { NO_CHANGE } from './tokens';
import { INTERPOLATION_DELIMITER, findComponentView, getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getRootContext, getRootView, getTNode, isComponent, isComponentDef, isContentQueryHost, loadInternal, readElementValue, readPatchedLView, renderStringify } from './util';
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
export function refreshDescendantViews(lView) {
    var tView = lView[TVIEW];
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = false;
    setFirstTemplatePass(false);
    // If this is a creation pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update pass.
    if (!isCreationMode(lView)) {
        var checkNoChangesMode = getCheckNoChangesMode();
        executeInitHooks(lView, tView, checkNoChangesMode);
        refreshDynamicEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView);
        executeHooks(lView, tView.contentHooks, tView.contentCheckHooks, checkNoChangesMode);
        setHostBindings(tView, lView);
    }
    refreshChildComponents(tView.components);
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
                    bindingRootIndex += INJECTOR_BLOOM_PARENT_SIZE + providerCount;
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
                if (instruction !== null) {
                    viewData[BINDING_INDEX] = bindingRootIndex;
                    instruction(2 /* Update */, readElementValue(viewData[currentDirectiveIndex]), currentElementIndex);
                }
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
function refreshChildComponents(components) {
    if (components != null) {
        for (var i = 0; i < components.length; i++) {
            componentRefresh(components[i]);
        }
    }
}
export function createLView(parentLView, tView, context, flags, rendererFactory, renderer, sanitizer, injector) {
    var lView = tView.blueprint.slice();
    lView[FLAGS] = flags | 1 /* CreationMode */ | 16 /* Attached */ | 32 /* RunInit */ |
        2 /* FirstLViewPass */;
    lView[PARENT] = lView[DECLARATION_VIEW] = parentLView;
    lView[CONTEXT] = context;
    lView[RENDERER_FACTORY] = (rendererFactory || parentLView && parentLView[RENDERER_FACTORY]);
    ngDevMode && assertDefined(lView[RENDERER_FACTORY], 'RendererFactory is required');
    lView[RENDERER] = (renderer || parentLView && parentLView[RENDERER]);
    ngDevMode && assertDefined(lView[RENDERER], 'Renderer is required');
    lView[SANITIZER] = sanitizer || parentLView && parentLView[SANITIZER] || null;
    lView[INJECTOR] = injector || parentLView && parentLView[INJECTOR] || null;
    return lView;
}
export function createNodeAtIndex(index, type, native, name, attrs) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var adjustedIndex = index + HEADER_OFFSET;
    ngDevMode &&
        assertLessThan(adjustedIndex, lView.length, "Slot should have been initialized with null");
    lView[adjustedIndex] = native;
    var tNode = tView.data[adjustedIndex];
    if (tNode == null) {
        // TODO(misko): Refactor createTNode so that it does not depend on LView.
        tNode = tView.data[adjustedIndex] = createTNode(lView, type, adjustedIndex, name, attrs, null);
    }
    // Now link ourselves into the tree.
    // We need this even if tNode exists, otherwise we might end up pointing to unexisting tNodes when
    // we use i18n (especially with ICU expressions that update the DOM during the update phase).
    var previousOrParentTNode = getPreviousOrParentTNode();
    var isParent = getIsParent();
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
    if (tView.firstChild == null) {
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
    return view[HOST_NODE] = view[TVIEW].node;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 */
export function allocExpando(view) {
    var tView = view[TVIEW];
    if (tView.firstTemplatePass) {
        tView.expandoStartIndex++;
        tView.blueprint.push(null);
        tView.data.push(null);
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
        var renderer = providedRendererFactory.createRenderer(null, null);
        // We need to create a root view so it's possible to look up the host element through its index
        var hostLView = createLView(null, createTView(-1, null, 1, 0, null, null, null), {}, 4 /* CheckAlways */ | 128 /* IsRoot */, providedRendererFactory, renderer);
        enterView(hostLView, null); // SUSPECT! why do we need to enter the View?
        var componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        hostView = createLView(hostLView, componentTView, context, 4 /* CheckAlways */, providedRendererFactory, renderer, sanitizer);
        hostView[HOST_NODE] = createNodeAtIndex(0, 3 /* Element */, hostNode, null, null);
    }
    renderComponentOrTemplate(hostView, context, templateFn);
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
    var lView = createLView(declarationView, tView, context, 4 /* CheckAlways */);
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
export function renderEmbeddedTemplate(viewToRender, tView, context) {
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    var oldView;
    if (viewToRender[FLAGS] & 128 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(getRootContext(viewToRender));
    }
    else {
        try {
            setIsParent(true);
            setPreviousOrParentTNode(null);
            oldView = enterView(viewToRender, viewToRender[HOST_NODE]);
            namespaceHTML();
            tView.template(getRenderFlags(viewToRender), context);
            // This must be set to false immediately after the first creation run because in an
            // ngFor loop, all the views will be created together before update mode runs and turns
            // off firstTemplatePass. If we don't set it here, instances will perform directive
            // matching, etc again and again.
            viewToRender[TVIEW].firstTemplatePass = false;
            setFirstTemplatePass(false);
            refreshDescendantViews(viewToRender);
        }
        finally {
            leaveView(oldView);
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
function renderComponentOrTemplate(hostView, context, templateFn) {
    var rendererFactory = hostView[RENDERER_FACTORY];
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    var normalExecutionPath = !getCheckNoChangesMode();
    var creationModeIsActive = isCreationMode(hostView);
    try {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (creationModeIsActive) {
            // creation mode pass
            if (templateFn) {
                namespaceHTML();
                templateFn(1 /* Create */, context);
            }
            refreshDescendantViews(hostView);
            hostView[FLAGS] &= ~1 /* CreationMode */;
        }
        // update mode pass
        templateFn && templateFn(2 /* Update */, context);
        refreshDescendantViews(hostView);
    }
    finally {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView);
    }
}
/**
 * This function returns the default configuration of rendering flags depending on when the
 * template is in creation mode or update mode. Update block and create block are
 * always run separately.
 */
function getRenderFlags(view) {
    return isCreationMode(view) ? 1 /* Create */ : 2 /* Update */;
}
//////////////////////////
//// Namespace
//////////////////////////
var _currentNamespace = null;
export function namespaceSVG() {
    _currentNamespace = 'http://www.w3.org/2000/svg';
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
 * @param attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
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
 * @param index Index of the element in the LView array
 * @param attrs Set of attributes to be used when matching directives.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Even if this instruction accepts a set of attributes no actual attribute values are propagated to
 * the DOM (as a comment node can't have attributes). Attributes are here only for directive
 * matching purposes and setting initial inputs of directives.
 */
export function elementContainerStart(index, attrs, localRefs) {
    var lView = getLView();
    var tView = lView[TVIEW];
    var renderer = lView[RENDERER];
    var tagName = 'ng-container';
    ngDevMode && assertEqual(lView[BINDING_INDEX], tView.bindingStartIndex, 'element containers should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var native = renderer.createComment(ngDevMode ? tagName : '');
    ngDevMode && assertDataInRange(lView, index - 1);
    var tNode = createNodeAtIndex(index, 4 /* ElementContainer */, native, tagName, attrs || null);
    appendChild(native, tNode, lView);
    createDirectivesAndLocals(tView, lView, localRefs);
    attachPatchData(native, lView);
    var currentQueries = lView[QUERIES];
    if (currentQueries) {
        currentQueries.addNode(tNode);
    }
}
/** Mark the end of the <ng-container>. */
export function elementContainerEnd() {
    var previousOrParentTNode = getPreviousOrParentTNode();
    var lView = getLView();
    var tView = lView[TVIEW];
    if (getIsParent()) {
        setIsParent(false);
    }
    else {
        ngDevMode && assertHasParent(getPreviousOrParentTNode());
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 4 /* ElementContainer */);
    var currentQueries = lView[QUERIES];
    if (currentQueries) {
        lView[QUERIES] =
            isContentQueryHost(previousOrParentTNode) ? currentQueries.parent : currentQueries;
    }
    registerPostOrderHooks(tView, previousOrParentTNode);
}
/**
 * Create DOM element. The instruction must later be followed by `elementEnd()` call.
 *
 * @param index Index of the element in the LView array
 * @param name Name of the DOM Node
 * @param attrs Statically bound set of attributes, classes, and styles to be written into the DOM
 *              element on creation. Use [AttributeMarker] to denote the meaning of this array.
 * @param localRefs A set of local reference bindings on the element.
 *
 * Attributes and localRefs are passed as an array of strings where elements with an even index
 * hold an attribute name and elements with an odd index hold an attribute value, ex.:
 * ['id', 'warning5', 'class', 'alert']
 */
export function elementStart(index, name, attrs, localRefs) {
    var lView = getLView();
    var tView = lView[TVIEW];
    ngDevMode && assertEqual(lView[BINDING_INDEX], tView.bindingStartIndex, 'elements should be created before any bindings ');
    ngDevMode && ngDevMode.rendererCreateElement++;
    var native = elementCreate(name);
    ngDevMode && assertDataInRange(lView, index - 1);
    var tNode = createNodeAtIndex(index, 3 /* Element */, native, name, attrs || null);
    if (attrs) {
        // it's important to only prepare styling-related datastructures once for a given
        // tNode and not each time an element is created. Also, the styling code is designed
        // to be patched and constructed at various points, but only up until the first element
        // is created. Then the styling context is locked and can only be instantiated for each
        // successive element that is created.
        if (tView.firstTemplatePass && !tNode.stylingTemplate && hasStyling(attrs)) {
            tNode.stylingTemplate = initializeStaticStylingContext(attrs);
        }
        setUpAttributes(native, attrs);
    }
    appendChild(native, tNode, lView);
    createDirectivesAndLocals(tView, lView, localRefs);
    // any immediate children of a component or template container must be pre-emptively
    // monkey-patched with the component view data so that the element can be inspected
    // later on using any element discovery utility methods (see `element_discovery.ts`)
    if (getElementDepthCount() === 0) {
        attachPatchData(native, lView);
    }
    increaseElementDepthCount();
    // if a directive contains a host binding for "class" then all class-based data will
    // flow through that (except for `[class.prop]` bindings). This also includes initial
    // static class values as well. (Note that this will be fixed once map-based `[style]`
    // and `[class]` bindings work for multiple directives.)
    if (tView.firstTemplatePass) {
        var inputData = initializeTNodeInputs(tNode);
        if (inputData && inputData.hasOwnProperty('class')) {
            tNode.flags |= 8 /* hasClassInput */;
        }
    }
    // There is no point in rendering styles when a class directive is present since
    // it will take that over for us (this will be removed once #FW-882 is in).
    if (tNode.stylingTemplate && (tNode.flags & 8 /* hasClassInput */) === 0) {
        renderInitialStylesAndClasses(native, tNode.stylingTemplate, lView[RENDERER]);
    }
    var currentQueries = lView[QUERIES];
    if (currentQueries) {
        currentQueries.addNode(tNode);
    }
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param overriddenRenderer Optional A renderer to override the default one
 * @returns the element created
 */
export function elementCreate(name, overriddenRenderer) {
    var native;
    var rendererToUse = overriddenRenderer || getLView()[RENDERER];
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
function createDirectivesAndLocals(tView, lView, localRefs, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
    if (!getBindingsEnabled())
        return;
    var previousOrParentTNode = getPreviousOrParentTNode();
    if (getFirstTemplatePass()) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        resolveDirectives(tView, lView, findDirectiveMatches(tView, lView, previousOrParentTNode), previousOrParentTNode, localRefs || null);
    }
    else {
        // During first template pass, queries are created or cloned when first requested
        // using `getOrCreateCurrentQueries`. For subsequent template passes, we clone
        // any current LQueries here up-front if the current node hosts a content query.
        if (isContentQueryHost(getPreviousOrParentTNode()) && lView[QUERIES]) {
            lView[QUERIES] = lView[QUERIES].clone();
        }
    }
    instantiateAllDirectives(tView, lView, previousOrParentTNode);
    invokeDirectivesHostBindings(tView, lView, previousOrParentTNode);
    saveResolvedLocalsInData(lView, previousOrParentTNode, localRefExtractor);
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LView in the same order as they are loaded in the template with load().
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
        data: blueprint.slice().fill(null, bindingStartIndex),
        childIndex: -1,
        bindingStartIndex: bindingStartIndex,
        viewQueryStartIndex: initialViewLength,
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
/**
 * Assigns all attribute values to the provided element via the inferred renderer.
 *
 * This function accepts two forms of attribute entries:
 *
 * default: (key, value):
 *  attrs = [key1, value1, key2, value2]
 *
 * namespaced: (NAMESPACE_MARKER, uri, name, value)
 *  attrs = [NAMESPACE_MARKER, uri, name, value, NAMESPACE_MARKER, uri, name, value]
 *
 * The `attrs` array can contain a mix of both the default and namespaced entries.
 * The "default" values are set without a marker, but if the function comes across
 * a marker value then it will attempt to set a namespaced value. If the marker is
 * not of a namespaced value then the function will quit and return the index value
 * where it stopped during the iteration of the attrs array.
 *
 * See [AttributeMarker] to understand what the namespace marker value is.
 *
 * Note that this instruction does not support assigning style and class values to
 * an element. See `elementStart` and `elementHostAttrs` to learn how styling values
 * are applied to an element.
 *
 * @param native The element that the attributes will be assigned to
 * @param attrs The attribute array of values that will be assigned to the element
 * @returns the index value that was last accessed in the attributes array
 */
function setUpAttributes(native, attrs) {
    var renderer = getLView()[RENDERER];
    var isProc = isProceduralRenderer(renderer);
    var i = 0;
    while (i < attrs.length) {
        var value = attrs[i];
        if (typeof value === 'number') {
            // only namespaces are supported. Other value types (such as style/class
            // entries) are not supported in this function.
            if (value !== 0 /* NamespaceURI */) {
                break;
            }
            // we just landed on the marker value ... therefore
            // we should skip to the next entry
            i++;
            var namespaceURI = attrs[i++];
            var attrName = attrs[i++];
            var attrVal = attrs[i++];
            ngDevMode && ngDevMode.rendererSetAttribute++;
            isProc ?
                renderer.setAttribute(native, attrName, attrVal, namespaceURI) :
                native.setAttributeNS(namespaceURI, attrName, attrVal);
        }
        else {
            /// attrName is string;
            var attrName = value;
            var attrVal = attrs[++i];
            if (attrName !== NG_PROJECT_AS_ATTR_NAME) {
                // Standard attributes
                ngDevMode && ngDevMode.rendererSetAttribute++;
                if (isAnimationProp(attrName)) {
                    if (isProc) {
                        renderer.setProperty(native, attrName, attrVal);
                    }
                }
                else {
                    isProc ?
                        renderer
                            .setAttribute(native, attrName, attrVal) :
                        native.setAttribute(attrName, attrVal);
                }
            }
            i++;
        }
    }
    // another piece of code may iterate over the same attributes array. Therefore
    // it may be helpful to return the exact spot where the attributes array exited
    // whether by running into an unsupported marker or if all the static values were
    // iterated over.
    return i;
}
export function createError(text, token) {
    return new Error("Renderer: " + text + " [" + renderStringify(token) + "]");
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param elementOrSelector Render element or CSS selector to locate the element.
 */
export function locateHostElement(factory, elementOrSelector) {
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
 * @param useCapture Whether or not to use capture in event listener
 * @param eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 */
export function listener(eventName, listenerFn, useCapture, eventTargetResolver) {
    if (useCapture === void 0) { useCapture = false; }
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver);
}
/**
 * Registers a synthetic host listener (e.g. `(@foo.start)`) on a component.
 *
 * This instruction is for compatibility purposes and is designed to ensure that a
 * synthetic host listener (e.g. `@HostListener('@foo.start')`) properly gets rendered
 * in the component's renderer. Normally all host listeners are evaluated with the
 * parent component's renderer, but, in the case of animation @triggers, they need
 * to be evaluated with the sub component's renderer (because that's where the
 * animation triggers are defined).
 *
 * Do not use this instruction as a replacement for `listener`. This instruction
 * only exists to ensure compatibility with the ViewEngine's host binding behavior.
 *
 * @param eventName Name of the event
 * @param listenerFn The function to be called when event emits
 * @param useCapture Whether or not to use capture in event listener
 * @param eventTargetResolver Function that returns global target information in case this listener
 * should be attached to a global object like window, document or body
 */
export function componentHostSyntheticListener(eventName, listenerFn, useCapture, eventTargetResolver) {
    if (useCapture === void 0) { useCapture = false; }
    listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver, loadComponentRenderer);
}
function listenerInternal(eventName, listenerFn, useCapture, eventTargetResolver, loadRendererFn) {
    if (useCapture === void 0) { useCapture = false; }
    var lView = getLView();
    var tNode = getPreviousOrParentTNode();
    var tView = lView[TVIEW];
    var firstTemplatePass = tView.firstTemplatePass;
    var tCleanup = firstTemplatePass && (tView.cleanup || (tView.cleanup = []));
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 0 /* Container */, 4 /* ElementContainer */);
    // add native event listener - applicable to elements only
    if (tNode.type === 3 /* Element */) {
        var native = getNativeByTNode(tNode, lView);
        var resolved = eventTargetResolver ? eventTargetResolver(native) : {};
        var target = resolved.target || native;
        ngDevMode && ngDevMode.rendererAddEventListener++;
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        var lCleanup = getCleanup(lView);
        var lCleanupIndex = lCleanup.length;
        var useCaptureOrSubIdx = useCapture;
        // In order to match current behavior, native DOM event listeners must be added for all
        // events (including outputs).
        if (isProceduralRenderer(renderer)) {
            // The first argument of `listen` function in Procedural Renderer is:
            // - either a target name (as a string) in case of global target (window, document, body)
            // - or element reference (in all other cases)
            var cleanupFn = renderer.listen(resolved.name || target, eventName, listenerFn);
            lCleanup.push(listenerFn, cleanupFn);
            useCaptureOrSubIdx = lCleanupIndex + 1;
        }
        else {
            var wrappedListener = wrapListenerWithPreventDefault(listenerFn);
            target.addEventListener(eventName, wrappedListener, useCapture);
            lCleanup.push(wrappedListener);
        }
        var idxOrTargetGetter = eventTargetResolver ?
            function (_lView) { return eventTargetResolver(readElementValue(_lView[tNode.index])).target; } :
            tNode.index;
        tCleanup && tCleanup.push(eventName, idxOrTargetGetter, lCleanupIndex, useCaptureOrSubIdx);
    }
    // subscribe to directive outputs
    if (tNode.outputs === undefined) {
        // if we create TNode here, inputs must be undefined so we know they still need to be
        // checked
        tNode.outputs = generatePropertyAliases(tNode, 1 /* Output */);
    }
    var outputs = tNode.outputs;
    var props;
    if (outputs && (props = outputs[eventName])) {
        var propsLength = props.length;
        if (propsLength) {
            var lCleanup = getCleanup(lView);
            for (var i = 0; i < propsLength; i += 3) {
                var index = props[i];
                ngDevMode && assertDataInRange(lView, index);
                var minifiedName = props[i + 2];
                var directiveInstance = lView[index];
                var output = directiveInstance[minifiedName];
                if (ngDevMode && !isObservable(output)) {
                    throw new Error("@Output " + minifiedName + " not initialized in '" + directiveInstance.constructor.name + "'.");
                }
                var subscription = output.subscribe(listenerFn);
                var idx = lCleanup.length;
                lCleanup.push(listenerFn, subscription);
                tCleanup && tCleanup.push(eventName, tNode.index, idx, -(idx + 1));
            }
        }
    }
}
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export function storeCleanupWithContext(lView, context, cleanupFn) {
    var lCleanup = getCleanup(lView);
    lCleanup.push(context);
    if (lView[TVIEW].firstTemplatePass) {
        getTViewCleanup(lView).push(cleanupFn, lCleanup.length - 1);
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
        ngDevMode && assertHasParent(getPreviousOrParentTNode());
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 3 /* Element */);
    var lView = getLView();
    var currentQueries = lView[QUERIES];
    if (currentQueries) {
        lView[QUERIES] =
            isContentQueryHost(previousOrParentTNode) ? currentQueries.parent : currentQueries;
    }
    registerPostOrderHooks(getLView()[TVIEW], previousOrParentTNode);
    decreaseElementDepthCount();
    // this is fired at the end of elementEnd because ALL of the stylingBindings code
    // (for directives and the template) have now executed which means the styling
    // context can be instantiated properly.
    if (hasClassInput(previousOrParentTNode)) {
        var stylingContext = getStylingContext(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, previousOrParentTNode.inputs['class'], getInitialClassNameValue(stylingContext));
    }
}
/**
 * Updates the value of removes an attribute on an Element.
 *
 * @param number index The index of the element in the data array
 * @param name name The name of the attribute.
 * @param value value The attribute is removed when value is `null` or `undefined`.
 *                  Otherwise the attribute value is set to the stringified value.
 * @param sanitizer An optional function used to sanitize the value.
 * @param namespace Optional namespace to use when setting the attribute.
 */
export function elementAttribute(index, name, value, sanitizer, namespace) {
    if (value !== NO_CHANGE) {
        ngDevMode && validateAttribute(name);
        var lView = getLView();
        var renderer = lView[RENDERER];
        var element_1 = getNativeByIndex(index, lView);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1, name, namespace) :
                element_1.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var tNode = getTNode(index, lView);
            var strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tNode.tagName || '', name);
            if (isProceduralRenderer(renderer)) {
                renderer.setAttribute(element_1, name, strValue, namespace);
            }
            else {
                namespace ? element_1.setAttributeNS(namespace, name, strValue) :
                    element_1.setAttribute(name, strValue);
            }
        }
    }
}
/**
 * Update a property on an element.
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
 * @param nativeOnly Whether or not we should only set native properties and skip input check
 * (this is necessary for host property bindings)
 */
export function elementProperty(index, propName, value, sanitizer, nativeOnly) {
    elementPropertyInternal(index, propName, value, sanitizer, nativeOnly);
}
/**
 * Updates a synthetic host binding (e.g. `[@foo]`) on a component.
 *
 * This instruction is for compatibility purposes and is designed to ensure that a
 * synthetic host binding (e.g. `@HostBinding('@foo')`) properly gets rendered in
 * the component's renderer. Normally all host bindings are evaluated with the parent
 * component's renderer, but, in the case of animation @triggers, they need to be
 * evaluated with the sub component's renderer (because that's where the animation
 * triggers are defined).
 *
 * Do not use this instruction as a replacement for `elementProperty`. This instruction
 * only exists to ensure compatibility with the ViewEngine's host binding behavior.
 *
 * @param index The index of the element to update in the data array
 * @param propName Name of property. Because it is going to DOM, this is not subject to
 *        renaming as part of minification.
 * @param value New value to write.
 * @param sanitizer An optional function used to sanitize the value.
 * @param nativeOnly Whether or not we should only set native properties and skip input check
 * (this is necessary for host property bindings)
 */
export function componentHostSyntheticProperty(index, propName, value, sanitizer, nativeOnly) {
    elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadComponentRenderer);
}
function elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    if (value === NO_CHANGE)
        return;
    var lView = getLView();
    var element = getNativeByIndex(index, lView);
    var tNode = getTNode(index, lView);
    var inputData;
    var dataValue;
    if (!nativeOnly && (inputData = initializeTNodeInputs(tNode)) &&
        (dataValue = inputData[propName])) {
        setInputsForProperty(lView, dataValue, value);
        if (isComponent(tNode))
            markDirtyIfOnPush(lView, index + HEADER_OFFSET);
        if (ngDevMode) {
            if (tNode.type === 3 /* Element */ || tNode.type === 0 /* Container */) {
                setNgReflectProperties(lView, element, tNode.type, dataValue, value);
            }
        }
    }
    else if (tNode.type === 3 /* Element */) {
        if (ngDevMode) {
            validateProperty(propName);
            ngDevMode.rendererSetProperty++;
        }
        savePropertyDebugData(tNode, lView, propName, lView[TVIEW].data, nativeOnly);
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value, tNode.tagName || '', propName) : value;
        if (isProceduralRenderer(renderer)) {
            renderer.setProperty(element, propName, value);
        }
        else if (!isAnimationProp(propName)) {
            element.setProperty ? element.setProperty(propName, value) :
                element[propName] = value;
        }
    }
}
/**
 * Stores debugging data for this property binding on first template pass.
 * This enables features like DebugElement.properties.
 */
function savePropertyDebugData(tNode, lView, propName, tData, nativeOnly) {
    var lastBindingIndex = lView[BINDING_INDEX] - 1;
    // Bind/interpolation functions save binding metadata in the last binding index,
    // but leave the property name blank. If the interpolation delimiter is at the 0
    // index, we know that this is our first pass and the property name still needs to
    // be set.
    var bindingMetadata = tData[lastBindingIndex];
    if (bindingMetadata[0] == INTERPOLATION_DELIMITER) {
        tData[lastBindingIndex] = propName + bindingMetadata;
        // We don't want to store indices for host bindings because they are stored in a
        // different part of LView (the expando section).
        if (!nativeOnly) {
            if (tNode.propertyMetadataStartIndex == -1) {
                tNode.propertyMetadataStartIndex = lastBindingIndex;
            }
            tNode.propertyMetadataEndIndex = lastBindingIndex + 1;
        }
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
export function createTNode(lView, type, adjustedIndex, tagName, attrs, tViews) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    ngDevMode && ngDevMode.tNode++;
    var parent = getIsParent() ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && lView && parent !== lView[HOST_NODE];
    var tParent = parentInSameView ? parent : null;
    return {
        type: type,
        index: adjustedIndex,
        injectorIndex: tParent ? tParent.injectorIndex : -1,
        directiveStart: -1,
        directiveEnd: -1,
        propertyMetadataStartIndex: -1,
        propertyMetadataEndIndex: -1,
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
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param lView the `LView` which contains the directives.
 * @param inputAliases mapping between the public "input" name and privately-known,
 * possibly minified, property names to write to.
 * @param value Value to set.
 */
function setInputsForProperty(lView, inputs, value) {
    var tView = lView[TVIEW];
    for (var i = 0; i < inputs.length;) {
        var index = inputs[i++];
        var publicName = inputs[i++];
        var privateName = inputs[i++];
        var instance = lView[index];
        ngDevMode && assertDataInRange(lView, index);
        var def = tView.data[index];
        var setInput = def.setInput;
        if (setInput) {
            def.setInput(instance, value, publicName, privateName);
        }
        else {
            instance[privateName] = value;
        }
    }
}
function setNgReflectProperties(lView, element, type, inputs, value) {
    var _a;
    for (var i = 0; i < inputs.length; i += 3) {
        var renderer = lView[RENDERER];
        var attrName = normalizeDebugBindingName(inputs[i + 2]);
        var debugValue = normalizeDebugBindingValue(value);
        if (type === 3 /* Element */) {
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(element, attrName, debugValue) :
                element.setAttribute(attrName, debugValue);
        }
        else if (value !== undefined) {
            var value_1 = "bindings=" + JSON.stringify((_a = {}, _a[attrName] = debugValue, _a), null, 2);
            if (isProceduralRenderer(renderer)) {
                renderer.setValue(element, value_1);
            }
            else {
                element.textContent = value_1;
            }
        }
    }
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param tNodeFlags node flags
 * @param direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
function generatePropertyAliases(tNode, direction) {
    var tView = getLView()[TVIEW];
    var propStore = null;
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    if (end > start) {
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
                    hasProperty ? propStore[publicName].push(i, publicName, internalName) :
                        (propStore[publicName] = [i, publicName, internalName]);
                }
            }
        }
    }
    return propStore;
}
/**
 * Assign any inline style values to the element during creation mode.
 *
 * This instruction is meant to be called during creation mode to register all
 * dynamic style and class bindings on the element. Note for static values (no binding)
 * see `elementStart` and `elementHostAttrs`.
 *
 * @param classBindingNames An array containing bindable class names.
 *        The `elementClassProp` refers to the class name by index in this array.
 *        (i.e. `['foo', 'bar']` means `foo=0` and `bar=1`).
 * @param styleBindingNames An array containing bindable style properties.
 *        The `elementStyleProp` refers to the class name by index in this array.
 *        (i.e. `['width', 'height']` means `width=0` and `height=1`).
 * @param styleSanitizer An optional sanitizer function that will be used to sanitize any CSS
 *        property values that are applied to the element (during rendering).
 *        Note that the sanitizer instance itself is tied to the `directive` (if  provided).
 * @param directive A directive instance the styling is associated with. If not provided
 *        current view's controller instance is assumed.
 *
 * @publicApi
 */
export function elementStyling(classBindingNames, styleBindingNames, styleSanitizer, directive) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = createEmptyStylingContext();
    }
    updateContextWithBindings(tNode.stylingTemplate, directive || null, classBindingNames, styleBindingNames, styleSanitizer, hasClassInput(tNode));
}
/**
 * Assign static attribute values to a host element.
 *
 * This instruction will assign static attribute values as well as class and style
 * values to an element within the host bindings function. Since attribute values
 * can consist of different types of values, the `attrs` array must include the values in
 * the following format:
 *
 * attrs = [
 *   // static attributes (like `title`, `name`, `id`...)
 *   attr1, value1, attr2, value,
 *
 *   // a single namespace value (like `x:id`)
 *   NAMESPACE_MARKER, namespaceUri1, name1, value1,
 *
 *   // another single namespace value (like `x:name`)
 *   NAMESPACE_MARKER, namespaceUri2, name2, value2,
 *
 *   // a series of CSS classes that will be applied to the element (no spaces)
 *   CLASSES_MARKER, class1, class2, class3,
 *
 *   // a series of CSS styles (property + value) that will be applied to the element
 *   STYLES_MARKER, prop1, value1, prop2, value2
 * ]
 *
 * All non-class and non-style attributes must be defined at the start of the list
 * first before all class and style values are set. When there is a change in value
 * type (like when classes and styles are introduced) a marker must be used to separate
 * the entries. The marker values themselves are set via entries found in the
 * [AttributeMarker] enum.
 *
 * NOTE: This instruction is meant to used from `hostBindings` function only.
 *
 * @param directive A directive instance the styling is associated with.
 * @param attrs An array of static values (attributes, classes and styles) with the correct marker
 * values.
 *
 * @publicApi
 */
export function elementHostAttrs(directive, attrs) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = initializeStaticStylingContext(attrs);
    }
    var lView = getLView();
    var native = getNativeByTNode(tNode, lView);
    var i = setUpAttributes(native, attrs);
    patchContextWithStaticAttrs(tNode.stylingTemplate, attrs, i, directive);
}
/**
 * Apply styling binding to the element.
 *
 * This instruction is meant to be run after `elementStyle` and/or `elementStyleProp`.
 * if any styling bindings have changed then the changes are flushed to the element.
 *
 *
 * @param index Index of the element's with which styling is associated.
 * @param directive Directive instance that is attempting to change styling. (Defaults to the
 *        component of the current view).
components
 *
 * @publicApi
 */
export function elementStylingApply(index, directive) {
    var lView = getLView();
    var isFirstRender = (lView[FLAGS] & 2 /* FirstLViewPass */) !== 0;
    var totalPlayersQueued = renderStyling(getStylingContext(index + HEADER_OFFSET, lView), lView[RENDERER], lView, isFirstRender, null, null, directive);
    if (totalPlayersQueued > 0) {
        var rootContext = getRootContext(lView);
        scheduleTick(rootContext, 2 /* FlushPlayers */);
    }
}
/**
 * Update a style bindings value on an element.
 *
 * If the style value is `null` then it will be removed from the element
 * (or assigned a different value depending if there are any styles placed
 * on the element with `elementStyle` or any styles that are present
 * from when the element was created (with `elementStyling`).
 *
 * (Note that the styling element is updated as part of `elementStylingApply`.)
 *
 * @param index Index of the element's with which styling is associated.
 * @param styleIndex Index of style to update. This index value refers to the
 *        index of the style in the style bindings array that was passed into
 *        `elementStlyingBindings`.
 * @param value New value to write (null to remove). Note that if a directive also
 *        attempts to write to the same binding value then it will only be able to
 *        do so if the template binding value is `null` (or doesn't exist at all).
 * @param suffix Optional suffix. Used with scalar values to add unit such as `px`.
 *        Note that when a suffix is provided then the underlying sanitizer will
 *        be ignored.
 * @param directive Directive instance that is attempting to change styling. (Defaults to the
 *        component of the current view).
components
 *
 * @publicApi
 */
export function elementStyleProp(index, styleIndex, value, suffix, directive) {
    var valueToAdd = null;
    if (value !== null) {
        if (suffix) {
            // when a suffix is applied then it will bypass
            // sanitization entirely (b/c a new string is created)
            valueToAdd = renderStringify(value) + suffix;
        }
        else {
            // sanitization happens by dealing with a String value
            // this means that the string value will be passed through
            // into the style rendering later (which is where the value
            // will be sanitized before it is applied)
            valueToAdd = value;
        }
    }
    updateElementStyleProp(getStylingContext(index + HEADER_OFFSET, getLView()), styleIndex, valueToAdd, directive);
}
/**
 * Add or remove a class via a class binding on a DOM element.
 *
 * This instruction is meant to handle the [class.foo]="exp" case and, therefore,
 * the class itself must already be applied using `elementStyling` within
 * the creation block.
 *
 * @param index Index of the element's with which styling is associated.
 * @param classIndex Index of class to toggle. This index value refers to the
 *        index of the class in the class bindings array that was passed into
 *        `elementStlyingBindings` (which is meant to be called before this
 *        function is).
 * @param value A true/false value which will turn the class on or off.
 * @param directive Directive instance that is attempting to change styling. (Defaults to the
 *        component of the current view).
components
 *
 * @publicApi
 */
export function elementClassProp(index, classIndex, value, directive) {
    var onOrOffClassValue = (value instanceof BoundPlayerFactory) ? value : (!!value);
    updateElementClassProp(getStylingContext(index + HEADER_OFFSET, getLView()), classIndex, onOrOffClassValue, directive);
}
/**
 * Update style and/or class bindings using object literal.
 *
 * This instruction is meant apply styling via the `[style]="exp"` and `[class]="exp"` template
 * bindings. When styles are applied to the Element they will then be placed with respect to
 * any styles set with `elementStyleProp`. If any styles are set to `null` then they will be
 * removed from the element.
 *
 * (Note that the styling instruction will not be applied until `elementStylingApply` is called.)
 *
 * @param index Index of the element's with which styling is associated.
 * @param classes A key/value style map of CSS classes that will be added to the given element.
 *        Any missing classes (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's list of CSS classes.
 * @param styles A key/value style map of the styles that will be applied to the given element.
 *        Any missing styles (that have already been applied to the element beforehand) will be
 *        removed (unset) from the element's styling.
 * @param directive Directive instance that is attempting to change styling. (Defaults to the
 *        component of the current view).
 *
 * @publicApi
 */
export function elementStylingMap(index, classes, styles, directive) {
    if (directive != undefined)
        return hackImplementationOfElementStylingMap(index, classes, styles, directive); // supported in next PR
    var lView = getLView();
    var tNode = getTNode(index, lView);
    var stylingContext = getStylingContext(index + HEADER_OFFSET, lView);
    if (hasClassInput(tNode) && classes !== NO_CHANGE) {
        var initialClasses = getInitialClassNameValue(stylingContext);
        var classInputVal = (initialClasses.length ? (initialClasses + ' ') : '') + classes;
        setInputsForProperty(lView, tNode.inputs['class'], classInputVal);
    }
    else {
        updateStylingMap(stylingContext, classes, styles);
    }
}
/* START OF HACK BLOCK */
function hackImplementationOfElementStylingMap(index, classes, styles, directive) {
    throw new Error('unimplemented. Should not be needed by ViewEngine compatibility');
}
/* END OF HACK BLOCK */
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
    var lView = getLView();
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'text nodes should be created before any bindings');
    ngDevMode && ngDevMode.rendererCreateTextNode++;
    var textNative = createTextNode(value, lView[RENDERER]);
    var tNode = createNodeAtIndex(index, 3 /* Element */, textNative, null, null);
    // Text nodes are self closing.
    setIsParent(false);
    appendChild(textNative, tNode, lView);
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
        var lView = getLView();
        ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
        var element_2 = getNativeByIndex(index, lView);
        ngDevMode && assertDefined(element_2, 'native element should exist');
        ngDevMode && ngDevMode.rendererSetText++;
        var renderer = lView[RENDERER];
        isProceduralRenderer(renderer) ? renderer.setValue(element_2, renderStringify(value)) :
            element_2.textContent = renderStringify(value);
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
            saveNameToExportMap(tView.data.length - 1, def, exportsMap);
            // Init hooks are queued now so ngOnInit is called in host components before
            // any projected components.
            registerPreOrderHooks(directiveDefIdx, def, tView);
        }
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
}
/**
 * Instantiate all the directives that were previously resolved on the current node.
 */
function instantiateAllDirectives(tView, lView, tNode) {
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    if (!getFirstTemplatePass() && start < end) {
        getOrCreateNodeInjectorForNode(tNode, lView);
    }
    for (var i = start; i < end; i++) {
        var def = tView.data[i];
        if (isComponentDef(def)) {
            addComponentLogic(lView, tNode, def);
        }
        var directive = getNodeInjectable(tView.data, lView, i, tNode);
        postProcessDirective(lView, directive, def, i);
    }
}
function invokeDirectivesHostBindings(tView, viewData, tNode) {
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    var expando = tView.expandoInstructions;
    var firstTemplatePass = getFirstTemplatePass();
    for (var i = start; i < end; i++) {
        var def = tView.data[i];
        var directive = viewData[i];
        if (def.hostBindings) {
            var previousExpandoLength = expando.length;
            setCurrentDirectiveDef(def);
            def.hostBindings(1 /* Create */, directive, tNode.index - HEADER_OFFSET);
            setCurrentDirectiveDef(null);
            // `hostBindings` function may or may not contain `allocHostVars` call
            // (e.g. it may not if it only contains host listeners), so we need to check whether
            // `expandoInstructions` has changed and if not - we still push `hostBindings` to
            // expando block, to make sure we execute it for DI cycle
            if (previousExpandoLength === expando.length && firstTemplatePass) {
                expando.push(def.hostBindings);
            }
        }
        else if (firstTemplatePass) {
            expando.push(null);
        }
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
function prefillHostVars(tView, lView, totalHostVars) {
    ngDevMode &&
        assertEqual(getFirstTemplatePass(), true, 'Should only be called in first template pass.');
    for (var i = 0; i < totalHostVars; i++) {
        lView.push(NO_CHANGE);
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
        setInputsFromAttrs(directiveDefIdx, directive, def, previousOrParentTNode);
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
function postProcessBaseDirective(lView, previousOrParentTNode, directive, def) {
    var native = getNativeByTNode(previousOrParentTNode, lView);
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent(getIsParent());
    attachPatchData(directive, lView);
    if (native) {
        attachPatchData(native, lView);
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
            if (isNodeMatchingSelectorList(tNode, def.selectors, /* isProjectionMode */ false)) {
                matches || (matches = []);
                diPublicInInjector(getOrCreateNodeInjectorForNode(getPreviousOrParentTNode(), viewData), viewData, def.type);
                if (isComponentDef(def)) {
                    if (tNode.flags & 1 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    tNode.flags = 1 /* isComponent */;
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
    var tView = getLView()[TVIEW];
    (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
}
/**
 * Stores host binding fn and number of host vars so it will be queued for binding refresh during
 * CD.
*/
function queueHostBindingForCheck(tView, def, hostVars) {
    ngDevMode &&
        assertEqual(getFirstTemplatePass(), true, 'Should only be called in first template pass.');
    var expando = tView.expandoInstructions;
    var length = expando.length;
    // Check whether a given `hostBindings` function already exists in expandoInstructions,
    // which can happen in case directive definition was extended from base definition (as a part of
    // the `InheritDefinitionFeature` logic). If we found the same `hostBindings` function in the
    // list, we just increase the number of host vars associated with that function, but do not add it
    // into the list again.
    if (length >= 2 && expando[length - 2] === def.hostBindings) {
        expando[length - 1] = expando[length - 1] + hostVars;
    }
    else {
        expando.push(def.hostBindings, hostVars);
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
        if (def.exportAs) {
            for (var i = 0; i < def.exportAs.length; i++) {
                exportsMap[def.exportAs[i]] = index;
            }
        }
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
    ngDevMode && assertEqual(flags === 0 || flags === 1 /* isComponent */, true, 'expected node flags to not be initialized');
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    // When the first directive is created on a node, save the index
    tNode.flags = flags & 1 /* isComponent */;
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
    tNode.providerIndexes = index;
}
function baseResolveDirective(tView, viewData, def, directiveFactory) {
    tView.data.push(def);
    var nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), false, null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
function addComponentLogic(lView, previousOrParentTNode, def) {
    var native = getNativeByTNode(previousOrParentTNode, lView);
    var tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var rendererFactory = lView[RENDERER_FACTORY];
    var componentView = addToViewTree(lView, previousOrParentTNode.index, createLView(lView, tView, null, def.onPush ? 8 /* Dirty */ : 4 /* CheckAlways */, rendererFactory, lView[RENDERER_FACTORY].createRenderer(native, def)));
    componentView[HOST_NODE] = previousOrParentTNode;
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    componentView[HOST] = lView[previousOrParentTNode.index];
    lView[previousOrParentTNode.index] = componentView;
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
function setInputsFromAttrs(directiveIndex, instance, def, tNode) {
    var initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, def.inputs, tNode);
    }
    var initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        var setInput = def.setInput;
        for (var i = 0; i < initialInputs.length;) {
            var publicName = initialInputs[i++];
            var privateName = initialInputs[i++];
            var value = initialInputs[i++];
            if (setInput) {
                def.setInput(instance, value, publicName, privateName);
            }
            else {
                instance[privateName] = value;
            }
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
        // If we hit Select-Only, Classes or Styles, we're done anyway. None of those are valid inputs.
        if (attrName === 3 /* SelectOnly */ || attrName === 1 /* Classes */ ||
            attrName === 2 /* Styles */)
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
            inputsToStore.push(attrName, minifiedInputName, attrValue);
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
export function createLContainer(hostNative, currentView, native, isForViewContainerRef) {
    return [
        isForViewContainerRef ? -1 : 0,
        [],
        currentView,
        null,
        null,
        hostNative,
        native,
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
    var lView = getLView();
    var tView = lView[TVIEW];
    // TODO: consider a separate node type for templates
    var tNode = containerInternal(index, tagName || null, attrs || null);
    if (getFirstTemplatePass()) {
        tNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(tView, lView, localRefs, localRefExtractor);
    var currentQueries = lView[QUERIES];
    var previousOrParentTNode = getPreviousOrParentTNode();
    var native = getNativeByTNode(previousOrParentTNode, lView);
    attachPatchData(native, lView);
    if (currentQueries) {
        lView[QUERIES] = currentQueries.addNode(previousOrParentTNode);
    }
    registerPostOrderHooks(tView, tNode);
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
    var lView = getLView();
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'container nodes should be created before any bindings');
    var adjustedIndex = index + HEADER_OFFSET;
    var comment = lView[RENDERER].createComment(ngDevMode ? 'container' : '');
    ngDevMode && ngDevMode.rendererCreateComment++;
    var tNode = createNodeAtIndex(index, 0 /* Container */, comment, tagName, attrs);
    var lContainer = lView[adjustedIndex] = createLContainer(lView[adjustedIndex], lView, comment);
    appendChild(comment, tNode, lView);
    // Containers are added to the current view tree instead of their embedded views
    // because views can be removed and re-inserted.
    addToViewTree(lView, index + HEADER_OFFSET, lContainer);
    var currentQueries = lView[QUERIES];
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
    var lView = getLView();
    var tView = lView[TVIEW];
    var previousOrParentTNode = loadInternal(tView.data, index);
    setPreviousOrParentTNode(previousOrParentTNode);
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    setIsParent(true);
    lView[index + HEADER_OFFSET][ACTIVE_INDEX] = 0;
    // We need to execute init hooks here so ngOnInit hooks are called in top level views
    // before they are called in embedded views (for backwards compatibility).
    executeInitHooks(lView, tView, getCheckNoChangesMode());
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
        ngDevMode && assertHasParent(previousOrParentTNode);
        previousOrParentTNode = previousOrParentTNode.parent;
        setPreviousOrParentTNode(previousOrParentTNode);
    }
    ngDevMode && assertNodeType(previousOrParentTNode, 0 /* Container */);
    var lContainer = getLView()[previousOrParentTNode.index];
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
function refreshDynamicEmbeddedViews(lView) {
    for (var current = getLViewChild(lView); current !== null; current = current[NEXT]) {
        // Note: current can be an LView or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LView
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === -1) {
            var container_1 = current;
            for (var i = 0; i < container_1[VIEWS].length; i++) {
                var dynamicViewData = container_1[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], dynamicViewData[CONTEXT]);
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
    var lView = getLView();
    var previousOrParentTNode = getPreviousOrParentTNode();
    // The previous node can be a view node if we are processing an inline for loop
    var containerTNode = previousOrParentTNode.type === 2 /* View */ ?
        previousOrParentTNode.parent :
        previousOrParentTNode;
    var lContainer = lView[containerTNode.index];
    ngDevMode && assertNodeType(containerTNode, 0 /* Container */);
    var viewToRender = scanForView(lContainer, containerTNode, lContainer[ACTIVE_INDEX], viewBlockId);
    if (viewToRender) {
        setIsParent(true);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    else {
        // When we create a new LView, we always reset the state of the instructions.
        viewToRender = createLView(lView, getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 4 /* CheckAlways */);
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = lContainer[QUERIES].createView();
        }
        createViewNode(viewBlockId, viewToRender);
        enterView(viewToRender, viewToRender[TVIEW].node);
    }
    if (lContainer) {
        if (isCreationMode(viewToRender)) {
            // it is a new view, insert it into collection of views for a given container
            insertView(viewToRender, lContainer, lView, lContainer[ACTIVE_INDEX], -1);
        }
        lContainer[ACTIVE_INDEX]++;
    }
    return isCreationMode(viewToRender) ? 1 /* Create */ | 2 /* Update */ :
        2 /* Update */;
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
    var tView = getLView()[TVIEW];
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
    var lView = getLView();
    var viewHost = lView[HOST_NODE];
    if (isCreationMode(lView)) {
        refreshDescendantViews(lView); // creation mode pass
        lView[FLAGS] &= ~1 /* CreationMode */;
    }
    refreshDescendantViews(lView); // update mode pass
    leaveView(lView[PARENT]);
    setPreviousOrParentTNode(viewHost);
    setIsParent(false);
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LView[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(adjustedElementIndex) {
    var lView = getLView();
    ngDevMode && assertDataInRange(lView, adjustedElementIndex);
    var hostView = getComponentViewByIndex(adjustedElementIndex, lView);
    ngDevMode && assertNodeType(lView[TVIEW].data[adjustedElementIndex], 3 /* Element */);
    // Only attached CheckAlways components or attached, dirty OnPush components should be checked
    if (viewAttached(hostView) && hostView[FLAGS] & (4 /* CheckAlways */ | 8 /* Dirty */)) {
        syncViewWithBlueprint(hostView);
        checkView(hostView, hostView[CONTEXT]);
    }
}
/**
 * Syncs an LView instance with its blueprint if they have gotten out of sync.
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
 * 2. First <comp> is matched as a component and its LView is created.
 * 3. Second <comp> is matched as a component and its LView is created.
 * 4. App template completes processing, so it's time to check child templates.
 * 5. First <comp> template is checked. It has a directive, so its def is pushed to blueprint.
 * 6. Second <comp> template is checked. Its blueprint has been updated by the first
 * <comp> template, but its LView was created before this update, so it is out of sync.
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
    return (view[FLAGS] & 16 /* Attached */) === 16 /* Attached */;
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
    var componentNode = findComponentView(getLView())[HOST_NODE];
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
            }
            componentChild.next = null;
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
    var lView = getLView();
    var tProjectionNode = createNodeAtIndex(nodeIndex, 1 /* Projection */, null, null, attrs || null);
    // We can't use viewData[HOST_NODE] because projection nodes can be nested in embedded views.
    if (tProjectionNode.projection === null)
        tProjectionNode.projection = selectorIndex;
    // `<ng-content>` has no content
    setIsParent(false);
    // re-distribution of projectable nodes is stored on a component's view level
    var componentView = findComponentView(lView);
    var componentNode = componentView[HOST_NODE];
    var nodeToProject = componentNode.projection[selectorIndex];
    var projectedView = componentView[PARENT];
    var projectionNodeIndex = -1;
    if (Array.isArray(nodeToProject)) {
        appendChild(nodeToProject, tProjectionNode, lView);
    }
    else {
        while (nodeToProject) {
            if (nodeToProject.type === 1 /* Projection */) {
                // This node is re-projected, so we must go up the tree to get its projected nodes.
                var currentComponentView = findComponentView(projectedView);
                var currentComponentHost = currentComponentView[HOST_NODE];
                var firstProjectedNode = currentComponentHost.projection[nodeToProject.projection];
                if (firstProjectedNode) {
                    if (Array.isArray(firstProjectedNode)) {
                        appendChild(firstProjectedNode, tProjectionNode, lView);
                    }
                    else {
                        projectionNodeStack[++projectionNodeIndex] = nodeToProject;
                        projectionNodeStack[++projectionNodeIndex] = projectedView;
                        nodeToProject = firstProjectedNode;
                        projectedView = currentComponentView[PARENT];
                        continue;
                    }
                }
            }
            else {
                // This flag must be set now or we won't know that this node is projected
                // if the nodes are inserted into a container later.
                nodeToProject.flags |= 2 /* isProjected */;
                appendProjectedNode(nodeToProject, tProjectionNode, lView, projectedView);
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
}
/**
 * Adds LView or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param lView The view where LView or LContainer should be added
 * @param adjustedHostIndex Index of the view's host node in LView[], adjusted for header
 * @param state The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export function addToViewTree(lView, adjustedHostIndex, state) {
    var tView = lView[TVIEW];
    var firstTemplatePass = getFirstTemplatePass();
    if (lView[TAIL]) {
        lView[TAIL][NEXT] = state;
    }
    else if (firstTemplatePass) {
        tView.childIndex = adjustedHostIndex;
    }
    lView[TAIL] = state;
    return state;
}
///////////////////////////////
//// Change detection
///////////////////////////////
/** If node is an OnPush component, marks its LView dirty. */
function markDirtyIfOnPush(lView, viewIndex) {
    var childComponentLView = getComponentViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 4 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 8 /* Dirty */;
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
/**
 * Marks current view and all ancestors dirty.
 *
 * Returns the root view because it is found as a byproduct of marking the view tree
 * dirty, and can be used by methods that consume markViewDirty() to easily schedule
 * change detection. Otherwise, such methods would need to traverse up the view tree
 * an additional time to get the root view and schedule a tick on it.
 *
 * @param lView The starting LView to mark dirty
 * @returns the root LView
 */
export function markViewDirty(lView) {
    while (lView && !(lView[FLAGS] & 128 /* IsRoot */)) {
        lView[FLAGS] |= 8 /* Dirty */;
        lView = lView[PARENT];
    }
    lView[FLAGS] |= 8 /* Dirty */;
    return lView;
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
        renderComponentOrTemplate(readPatchedLView(rootComponent), rootComponent);
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
    var view = getComponentViewByInstance(component);
    detectChangesInternal(view, component);
}
export function detectChangesInternal(view, context) {
    var rendererFactory = view[RENDERER_FACTORY];
    if (rendererFactory.begin)
        rendererFactory.begin();
    if (isCreationMode(view)) {
        checkView(view, context); // creation mode pass
    }
    checkView(view, context); // update mode pass
    if (rendererFactory.end)
        rendererFactory.end();
}
/**
 * Synchronously perform change detection on a root view and its components.
 *
 * @param lView The view which the change detection should be performed on.
 */
export function detectChangesInRootView(lView) {
    tickRootContext(lView[CONTEXT]);
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
 * @param lView The view which the change detection should be checked on.
 */
export function checkNoChangesInRootView(lView) {
    setCheckNoChangesMode(true);
    try {
        detectChangesInRootView(lView);
    }
    finally {
        setCheckNoChangesMode(false);
    }
}
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck. */
export function checkView(hostView, component) {
    var hostTView = hostView[TVIEW];
    var oldView = enterView(hostView, hostView[HOST_NODE]);
    var templateFn = hostTView.template;
    var creationMode = isCreationMode(hostView);
    try {
        namespaceHTML();
        creationMode && executeViewQueryFn(hostView, hostTView, component);
        templateFn(getRenderFlags(hostView), component);
        refreshDescendantViews(hostView);
        !creationMode && executeViewQueryFn(hostView, hostTView, component);
    }
    finally {
        leaveView(oldView);
    }
}
function executeViewQueryFn(lView, tView, component) {
    var viewQuery = tView.viewQuery;
    if (viewQuery) {
        setCurrentViewQueryIndex(tView.viewQueryStartIndex);
        viewQuery(getRenderFlags(lView), component);
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
 *
 * @publicApi
 */
export function markDirty(component) {
    ngDevMode && assertDefined(component, 'component');
    var rootView = markViewDirty(getComponentViewByInstance(component));
    ngDevMode && assertDefined(rootView[CONTEXT], 'rootContext should be defined');
    scheduleTick(rootView[CONTEXT], 1 /* DetectChanges */);
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
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX]++;
    storeBindingMetadata(lView);
    return bindingUpdated(lView, bindingIndex, value) ? value : NO_CHANGE;
}
/**
 * Allocates the necessary amount of slots for host vars.
 *
 * @param count Amount of vars to be allocated
 */
export function allocHostVars(count) {
    if (!getFirstTemplatePass())
        return;
    var lView = getLView();
    var tView = lView[TVIEW];
    queueHostBindingForCheck(tView, getCurrentDirectiveDef(), count);
    prefillHostVars(tView, lView, count);
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
    var lView = getLView();
    var tData = lView[TVIEW].data;
    var bindingIndex = lView[BINDING_INDEX];
    if (tData[bindingIndex] == null) {
        // 2 is the index of the first static interstitial value (ie. not prefix)
        for (var i = 2; i < values.length; i += 2) {
            tData[bindingIndex++] = values[i];
        }
        bindingIndex = lView[BINDING_INDEX];
    }
    for (var i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(lView, bindingIndex++, values[i]) && (different = true);
    }
    lView[BINDING_INDEX] = bindingIndex;
    storeBindingMetadata(lView, values[0], values[values.length - 1]);
    if (!different) {
        return NO_CHANGE;
    }
    // Build the updated content
    var content = values[0];
    for (var i = 1; i < values.length; i += 2) {
        content += renderStringify(values[i]) + values[i + 1];
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
    var lView = getLView();
    var different = bindingUpdated(lView, lView[BINDING_INDEX]++, v0);
    storeBindingMetadata(lView, prefix, suffix);
    return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated2(lView, bindingIndex, v0, v1);
    lView[BINDING_INDEX] += 2;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        lView[TVIEW].data[bindingIndex] = i0;
    }
    return different ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated3(lView, bindingIndex, v0, v1, v2);
    lView[BINDING_INDEX] += 3;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    lView[BINDING_INDEX] += 4;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 5 expressions. */
export function interpolation5(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated(lView, bindingIndex + 4, v4) || different;
    lView[BINDING_INDEX] += 5;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 6 expressions. */
export function interpolation6(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated2(lView, bindingIndex + 4, v4, v5) || different;
    lView[BINDING_INDEX] += 6;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 7 expressions. */
export function interpolation7(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated3(lView, bindingIndex + 4, v4, v5, v6) || different;
    lView[BINDING_INDEX] += 7;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
        tData[bindingIndex + 5] = i5;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + suffix :
        NO_CHANGE;
}
/** Creates an interpolation binding with 8 expressions. */
export function interpolation8(prefix, v0, i0, v1, i1, v2, i2, v3, i3, v4, i4, v5, i5, v6, i6, v7, suffix) {
    var lView = getLView();
    var bindingIndex = lView[BINDING_INDEX];
    var different = bindingUpdated4(lView, bindingIndex, v0, v1, v2, v3);
    different = bindingUpdated4(lView, bindingIndex + 4, v4, v5, v6, v7) || different;
    lView[BINDING_INDEX] += 8;
    // Only set static strings the first time (data will be null subsequent runs).
    var data = storeBindingMetadata(lView, prefix, suffix);
    if (data) {
        var tData = lView[TVIEW].data;
        tData[bindingIndex] = i0;
        tData[bindingIndex + 1] = i1;
        tData[bindingIndex + 2] = i2;
        tData[bindingIndex + 3] = i3;
        tData[bindingIndex + 4] = i4;
        tData[bindingIndex + 5] = i5;
        tData[bindingIndex + 6] = i6;
    }
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + i6 + renderStringify(v7) + suffix :
        NO_CHANGE;
}
/**
 * Creates binding metadata for a particular binding and stores it in
 * TView.data. These are generated in order to support DebugElement.properties.
 *
 * Each binding / interpolation will have one (including attribute bindings)
 * because at the time of binding, we don't know to which instruction the binding
 * belongs. It is always stored in TView.data at the index of the last binding
 * value in LView (e.g. for interpolation8, it would be stored at the index of
 * the 8th value).
 *
 * @param lView The LView that contains the current binding index.
 * @param prefix The static prefix string
 * @param suffix The static suffix string
 *
 * @returns Newly created binding metadata string for this binding or null
 */
function storeBindingMetadata(lView, prefix, suffix) {
    if (prefix === void 0) { prefix = ''; }
    if (suffix === void 0) { suffix = ''; }
    var tData = lView[TVIEW].data;
    var lastBindingIndex = lView[BINDING_INDEX] - 1;
    var value = INTERPOLATION_DELIMITER + prefix + INTERPOLATION_DELIMITER + suffix;
    return tData[lastBindingIndex] == null ? (tData[lastBindingIndex] = value) : null;
}
/** Store a value in the `data` at a given `index`. */
export function store(index, value) {
    var lView = getLView();
    var tView = lView[TVIEW];
    // We don't store any static data for local variables, so the first time
    // we see the template, we should store as null to avoid a sparse array
    var adjustedIndex = index + HEADER_OFFSET;
    if (adjustedIndex >= tView.data.length) {
        tView.data[adjustedIndex] = null;
        tView.blueprint[adjustedIndex] = null;
    }
    lView[adjustedIndex] = value;
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
    var contextLView = getContextLView();
    return loadInternal(contextLView, index);
}
export function loadQueryList(queryListIdx) {
    var lView = getLView();
    ngDevMode &&
        assertDefined(lView[CONTENT_QUERIES], 'Content QueryList array should be defined if reading a query.');
    ngDevMode && assertDataInRange(lView[CONTENT_QUERIES], queryListIdx);
    return lView[CONTENT_QUERIES][queryListIdx];
}
/** Retrieves a value from current `viewData`. */
export function load(index) {
    return loadInternal(getLView(), index);
}
export function directiveInject(token, flags) {
    if (flags === void 0) { flags = InjectFlags.Default; }
    token = resolveForwardRef(token);
    return getOrCreateInjectable(getPreviousOrParentTNode(), getLView(), token, flags);
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
    var viewData = getLView();
    var tView = viewData[TVIEW];
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
            tNode.inputs = generatePropertyAliases(tNode, 0 /* Input */);
        }
        return tNode.inputs;
    }
    return null;
}
/**
 * Returns the current OpaqueViewState instance.
 *
 * Used in conjunction with the restoreView() instruction to save a snapshot
 * of the current view and restore it when listeners are invoked. This allows
 * walking the declaration view tree in listeners to get vars from parent views.
 */
export function getCurrentView() {
    return getLView();
}
function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = []);
}
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
}
/**
 * There are cases where the sub component's renderer needs to be included
 * instead of the current renderer (see the componentSyntheticHost* instructions).
 */
function loadComponentRenderer(tNode, lView) {
    var componentLView = lView[tNode.index];
    return componentLView[RENDERER];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFdBQVcsRUFBMkIsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHakYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdHLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekYsT0FBTyxFQUFDLGVBQWUsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzdGLE9BQU8sRUFBQyxlQUFlLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsOEJBQThCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkksT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDdEcs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RUFBRSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUFDLElBQVc7SUFDbEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUMzRCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN2RCxJQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBVSxDQUFDO0lBQ25ELE9BQU8sY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdGlvblRva2VuLCBJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtyZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnLi4vbGlua2VyJztcbmltcG9ydCB7dmFsaWRhdGVBdHRyaWJ1dGUsIHZhbGlkYXRlUHJvcGVydHl9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5cbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50LCBhc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkMywgYmluZGluZ1VwZGF0ZWQ0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlLCBpbmplY3RBdHRyaWJ1dGVJbXBsfSBmcm9tICcuL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcywgcmVnaXN0ZXJQcmVPcmRlckhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50UXVlcnksIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSwgTm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0dsb2JhbFRhcmdldFJlc29sdmVyLCBQcm9jZWR1cmFsUmVuZGVyZXIzLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgQ09OVEVOVF9RVUVSSUVTLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIE9wYXF1ZVZpZXdTdGF0ZSwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUkVOREVSRVJfRkFDVE9SWSwgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MsIFNBTklUSVpFUiwgVEFJTCwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZ2V0TFZpZXdDaGlsZCwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBtYXRjaGluZ1NlbGVjdG9ySW5kZXh9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q29udGV4dExWaWV3LCBnZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBnZXRDdXJyZW50Vmlld1F1ZXJ5SW5kZXgsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRGaXJzdFRlbXBsYXRlUGFzcywgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIGlzQ3JlYXRpb25Nb2RlLCBsZWF2ZVZpZXcsIG5leHRDb250ZXh0SW1wbCwgcmVzZXRDb21wb25lbnRTdGF0ZSwgc2V0QmluZGluZ1Jvb3QsIHNldENoZWNrTm9DaGFuZ2VzTW9kZSwgc2V0Q3VycmVudERpcmVjdGl2ZURlZiwgc2V0Q3VycmVudFZpZXdRdWVyeUluZGV4LCBzZXRGaXJzdFRlbXBsYXRlUGFzcywgc2V0SXNQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQgYXMgaW5pdGlhbGl6ZVN0YXRpY1N0eWxpbmdDb250ZXh0LCBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnMsIHJlbmRlckluaXRpYWxTdHlsZXNBbmRDbGFzc2VzLCByZW5kZXJTdHlsaW5nLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncywgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AsIHVwZGF0ZVN0eWxpbmdNYXB9IGZyb20gJy4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vc3R5bGluZy9wbGF5ZXJfZmFjdG9yeSc7XG5pbXBvcnQge2NyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGdldFN0eWxpbmdDb250ZXh0LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsaW5nLCBpc0FuaW1hdGlvblByb3B9IGZyb20gJy4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCBmaW5kQ29tcG9uZW50VmlldywgZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFJvb3RDb250ZXh0LCBnZXRSb290VmlldywgZ2V0VE5vZGUsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgaXNDb250ZW50UXVlcnlIb3N0LCBsb2FkSW50ZXJuYWwsIHJlYWRFbGVtZW50VmFsdWUsIHJlYWRQYXRjaGVkTFZpZXcsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG5jb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICBzZXRGaXJzdFRlbXBsYXRlUGFzcyhmYWxzZSk7XG5cbiAgLy8gSWYgdGhpcyBpcyBhIGNyZWF0aW9uIHBhc3MsIHdlIHNob3VsZCBub3QgY2FsbCBsaWZlY3ljbGUgaG9va3Mgb3IgZXZhbHVhdGUgYmluZGluZ3MuXG4gIC8vIFRoaXMgd2lsbCBiZSBkb25lIGluIHRoZSB1cGRhdGUgcGFzcy5cbiAgaWYgKCFpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICAgIGV4ZWN1dGVJbml0SG9va3MobFZpZXcsIHRWaWV3LCBjaGVja05vQ2hhbmdlc01vZGUpO1xuXG4gICAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0Vmlldyk7XG5cbiAgICBleGVjdXRlSG9va3MobFZpZXcsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSk7XG5cbiAgICBzZXRIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3KTtcbiAgfVxuXG4gIHJlZnJlc2hDaGlsZENvbXBvbmVudHModFZpZXcuY29tcG9uZW50cyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgbGV0IGJpbmRpbmdSb290SW5kZXggPSB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICBsZXQgY3VycmVudEVsZW1lbnRJbmRleCA9IC0xO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgLy8gdGhlIGN1cnJlbnQgZWxlbWVudCBhbmQgZGlyZWN0aXZlIGluZGV4LlxuICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgLy8gSW5qZWN0b3IgYmxvY2sgYW5kIHByb3ZpZGVycyBhcmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSArIHByb3ZpZGVyQ291bnQ7XG5cbiAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIFRoaXMgaXMgZWl0aGVyIHRoZSBpbmplY3RvciBzaXplIChzbyB0aGUgYmluZGluZyByb290IGNhbiBza2lwIG92ZXIgZGlyZWN0aXZlc1xuICAgICAgICAgIC8vIGFuZCBnZXQgdG8gdGhlIGZpcnN0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkgb3IgdGhlIGhvc3QgdmFyIGNvdW50XG4gICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gaW5zdHJ1Y3Rpb247XG4gICAgICAgIH1cbiAgICAgICAgc2V0QmluZGluZ1Jvb3QoYmluZGluZ1Jvb3RJbmRleCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiBpdCdzIG5vdCBhIG51bWJlciwgaXQncyBhIGhvc3QgYmluZGluZyBmdW5jdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGV4ZWN1dGVkLlxuICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICB2aWV3RGF0YVtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdSb290SW5kZXg7XG4gICAgICAgICAgaW5zdHJ1Y3Rpb24oXG4gICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZSwgcmVhZEVsZW1lbnRWYWx1ZSh2aWV3RGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdKSxcbiAgICAgICAgICAgICAgY3VycmVudEVsZW1lbnRJbmRleCk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4Kys7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5jb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzUmVmcmVzaCAhKFxuICAgICAgICAgIGRpcmVjdGl2ZURlZklkeCAtIEhFQURFUl9PRkZTRVQsIHRWaWV3LmNvbnRlbnRRdWVyaWVzW2kgKyAxXSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlldyB8IG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTMgfCBudWxsLCByZW5kZXJlcj86IFJlbmRlcmVyMyB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCwgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5SdW5Jbml0IHxcbiAgICAgIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIGxWaWV3W1BBUkVOVF0gPSBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IHBhcmVudExWaWV3O1xuICBsVmlld1tDT05URVhUXSA9IGNvbnRleHQ7XG4gIGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldID0gKHJlbmRlcmVyRmFjdG9yeSB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl9GQUNUT1JZXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwgITtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZTogUkVsZW1lbnQgfCBSVGV4dCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmF0aXZlOiBudWxsLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYXRpdmU6IFJUZXh0IHwgUkVsZW1lbnQgfCBSQ29tbWVudCB8IG51bGwsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlxuICAgIFRJY3VDb250YWluZXJOb2RlIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRMZXNzVGhhbihhZGp1c3RlZEluZGV4LCBsVmlldy5sZW5ndGgsIGBTbG90IHNob3VsZCBoYXZlIGJlZW4gaW5pdGlhbGl6ZWQgd2l0aCBudWxsYCk7XG4gIGxWaWV3W2FkanVzdGVkSW5kZXhdID0gbmF0aXZlO1xuXG4gIGxldCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSA9PSBudWxsKSB7XG4gICAgLy8gVE9ETyhtaXNrbyk6IFJlZmFjdG9yIGNyZWF0ZVROb2RlIHNvIHRoYXQgaXQgZG9lcyBub3QgZGVwZW5kIG9uIExWaWV3LlxuICAgIHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IGNyZWF0ZVROb2RlKGxWaWV3LCB0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycywgbnVsbCk7XG4gIH1cblxuICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgLy8gV2UgbmVlZCB0aGlzIGV2ZW4gaWYgdE5vZGUgZXhpc3RzLCBvdGhlcndpc2Ugd2UgbWlnaHQgZW5kIHVwIHBvaW50aW5nIHRvIHVuZXhpc3RpbmcgdE5vZGVzIHdoZW5cbiAgLy8gd2UgdXNlIGkxOG4gKGVzcGVjaWFsbHkgd2l0aCBJQ1UgZXhwcmVzc2lvbnMgdGhhdCB1cGRhdGUgdGhlIERPTSBkdXJpbmcgdGhlIHVwZGF0ZSBwaGFzZSkuXG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBpc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgKHROb2RlLnBhcmVudCAhPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpKSB7XG4gICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmICghaXNQYXJlbnQpIHtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT0gbnVsbCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuXG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSk7XG4gIHNldElzUGFyZW50KHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlICYgVEljdUNvbnRhaW5lck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVWaWV3Tm9kZShpbmRleDogbnVtYmVyLCB2aWV3OiBMVmlldykge1xuICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gIGlmICh2aWV3W1RWSUVXXS5ub2RlID09IG51bGwpIHtcbiAgICB2aWV3W1RWSUVXXS5ub2RlID0gY3JlYXRlVE5vZGUodmlldywgVE5vZGVUeXBlLlZpZXcsIGluZGV4LCBudWxsLCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gIH1cblxuICByZXR1cm4gdmlld1tIT1NUX05PREVdID0gdmlld1tUVklFV10ubm9kZSBhcyBUVmlld05vZGU7XG59XG5cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSBvciBDb21wb25lbnRGYWN0b3J5LmNyZWF0ZSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKHZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IHRWaWV3ID0gdmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4Kys7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICAgIHZpZXcucHVzaChudWxsKTtcbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKlxuICogQHBhcmFtIGhvc3ROb2RlIEV4aXN0aW5nIG5vZGUgdG8gcmVuZGVyIGludG8uXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvbiB3aXRoIHRoZSBpbnN0cnVjdGlvbnMuXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGV4dCB0byBwYXNzIGludG8gdGhlIHRlbXBsYXRlLlxuICogQHBhcmFtIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5IHJlbmRlcmVyIGZhY3RvcnkgdG8gdXNlXG4gKiBAcGFyYW0gaG9zdCBUaGUgaG9zdCBlbGVtZW50IG5vZGUgdG8gdXNlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBEaXJlY3RpdmUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICogQHBhcmFtIHBpcGVzIFBpcGUgZGVmcyB0aGF0IHNob3VsZCBiZSB1c2VkIGZvciBtYXRjaGluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVGVtcGxhdGU8VD4oXG4gICAgaG9zdE5vZGU6IFJFbGVtZW50LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgY29udGV4dDogVCxcbiAgICBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgaG9zdFZpZXc6IExWaWV3IHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIGlmIChob3N0VmlldyA9PSBudWxsKSB7XG4gICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIHJvb3QgdmlldyBzbyBpdCdzIHBvc3NpYmxlIHRvIGxvb2sgdXAgdGhlIGhvc3QgZWxlbWVudCB0aHJvdWdoIGl0cyBpbmRleFxuICAgIGNvbnN0IGhvc3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCksIHt9LFxuICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3QsIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlcik7XG4gICAgZW50ZXJWaWV3KGhvc3RMVmlldywgbnVsbCk7ICAvLyBTVVNQRUNUISB3aHkgZG8gd2UgbmVlZCB0byBlbnRlciB0aGUgVmlldz9cblxuICAgIGNvbnN0IGNvbXBvbmVudFRWaWV3ID1cbiAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCk7XG4gICAgaG9zdFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgaG9zdExWaWV3LCBjb21wb25lbnRUVmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgcHJvdmlkZWRSZW5kZXJlckZhY3RvcnksXG4gICAgICAgIHJlbmRlcmVyLCBzYW5pdGl6ZXIpO1xuICAgIGhvc3RWaWV3W0hPU1RfTk9ERV0gPSBjcmVhdGVOb2RlQXRJbmRleCgwLCBUTm9kZVR5cGUuRWxlbWVudCwgaG9zdE5vZGUsIG51bGwsIG51bGwpO1xuICB9XG4gIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUoaG9zdFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlRm4pO1xuICByZXR1cm4gaG9zdFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgY3JlYXRpbmcgdGhlIExWaWV3Tm9kZSBvZiBhIGR5bmFtaWMgZW1iZWRkZWQgdmlldyxcbiAqIGVpdGhlciB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkgb3IgVGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkuXG4gKiBTdWNoIGxWaWV3Tm9kZSB3aWxsIHRoZW4gYmUgcmVuZGVyZXIgd2l0aCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgKHNlZSBiZWxvdykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgZGVjbGFyYXRpb25WaWV3OiBMVmlldywgcmVuZGVyZXI6IFJlbmRlcmVyMywgcXVlcmllczogTFF1ZXJpZXMgfCBudWxsLFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG5cbiAgY29uc3QgbFZpZXcgPSBjcmVhdGVMVmlldyhkZWNsYXJhdGlvblZpZXcsIHRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBkZWNsYXJhdGlvblZpZXc7XG5cbiAgaWYgKHF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IHF1ZXJpZXMuY3JlYXRlVmlldygpO1xuICB9XG4gIGNyZWF0ZVZpZXdOb2RlKC0xLCBsVmlldyk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcubm9kZSAhLmluamVjdG9ySW5kZXggPSBpbmplY3RvckluZGV4O1xuICB9XG5cbiAgc2V0SXNQYXJlbnQoX2lzUGFyZW50KTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKF9wcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3IgaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KHZpZXdUb1JlbmRlcjogTFZpZXcsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCBfaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGxldCBvbGRWaWV3OiBMVmlldztcbiAgaWYgKHZpZXdUb1JlbmRlcltGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQoZ2V0Um9vdENvbnRleHQodmlld1RvUmVuZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIHNldElzUGFyZW50KHRydWUpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbSE9TVF9OT0RFXSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKGdldFJlbmRlckZsYWdzKHZpZXdUb1JlbmRlciksIGNvbnRleHQpO1xuICAgICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgICAgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MoZmFsc2UpO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEpO1xuICAgICAgc2V0SXNQYXJlbnQoX2lzUGFyZW50KTtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjb250ZXh0IGF0IHRoZSBsZXZlbCBzcGVjaWZpZWQgYW5kIHNhdmVzIGl0IGFzIHRoZSBnbG9iYWwsIGNvbnRleHRWaWV3RGF0YS5cbiAqIFdpbGwgZ2V0IHRoZSBuZXh0IGxldmVsIHVwIGlmIGxldmVsIGlzIG5vdCBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIHNhdmUgY29udGV4dHMgb2YgcGFyZW50IHZpZXdzIHNvIHRoZXkgY2FuIGJlIGJvdW5kIGluIGVtYmVkZGVkIHZpZXdzLCBvclxuICogaW4gY29uanVuY3Rpb24gd2l0aCByZWZlcmVuY2UoKSB0byBiaW5kIGEgcmVmIGZyb20gYSBwYXJlbnQgdmlldy5cbiAqXG4gKiBAcGFyYW0gbGV2ZWwgVGhlIHJlbGF0aXZlIGxldmVsIG9mIHRoZSB2aWV3IGZyb20gd2hpY2ggdG8gZ3JhYiBjb250ZXh0IGNvbXBhcmVkIHRvIGNvbnRleHRWZXdEYXRhXG4gKiBAcmV0dXJucyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICByZXR1cm4gbmV4dENvbnRleHRJbXBsKGxldmVsKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIHRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBob3N0Vmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuICB0cnkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cblxuICAgIGlmIChjcmVhdGlvbk1vZGVJc0FjdGl2ZSkge1xuICAgICAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gICAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICAgIHRlbXBsYXRlRm4oUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb250ZXh0ICEpO1xuICAgICAgfVxuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAgIGhvc3RWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICAgIHRlbXBsYXRlRm4gJiYgdGVtcGxhdGVGbihSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQgISk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0Vmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gVXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlckZsYWdzKHZpZXc6IExWaWV3KTogUmVuZGVyRmxhZ3Mge1xuICByZXR1cm4gaXNDcmVhdGlvbk1vZGUodmlldykgPyBSZW5kZXJGbGFncy5DcmVhdGUgOiBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIE5hbWVzcGFjZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxubGV0IF9jdXJyZW50TmFtZXNwYWNlOiBzdHJpbmd8bnVsbCA9IG51bGw7XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VTVkcoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZU1hdGhNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMTk5OC9NYXRoTUwvJztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZUhUTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gbnVsbDtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGVtcHR5IGVsZW1lbnQgdXNpbmcge0BsaW5rIGVsZW1lbnRTdGFydH0gYW5kIHtAbGluayBlbGVtZW50RW5kfVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzLCBjbGFzc2VzLCBhbmQgc3R5bGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NXG4gKiAgICAgICAgICAgICAgZWxlbWVudCBvbiBjcmVhdGlvbi4gVXNlIFtBdHRyaWJ1dGVNYXJrZXJdIHRvIGRlbm90ZSB0aGUgbWVhbmluZyBvZiB0aGlzIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBlbGVtZW50U3RhcnQoaW5kZXgsIG5hbWUsIGF0dHJzLCBsb2NhbFJlZnMpO1xuICBlbGVtZW50RW5kKCk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIGxvZ2ljYWwgY29udGFpbmVyIGZvciBvdGhlciBub2RlcyAoPG5nLWNvbnRhaW5lcj4pIGJhY2tlZCBieSBhIGNvbW1lbnQgbm9kZSBpbiB0aGUgRE9NLlxuICogVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRDb250YWluZXJFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gYXR0cnMgU2V0IG9mIGF0dHJpYnV0ZXMgdG8gYmUgdXNlZCB3aGVuIG1hdGNoaW5nIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBFdmVuIGlmIHRoaXMgaW5zdHJ1Y3Rpb24gYWNjZXB0cyBhIHNldCBvZiBhdHRyaWJ1dGVzIG5vIGFjdHVhbCBhdHRyaWJ1dGUgdmFsdWVzIGFyZSBwcm9wYWdhdGVkIHRvXG4gKiB0aGUgRE9NIChhcyBhIGNvbW1lbnQgbm9kZSBjYW4ndCBoYXZlIGF0dHJpYnV0ZXMpLiBBdHRyaWJ1dGVzIGFyZSBoZXJlIG9ubHkgZm9yIGRpcmVjdGl2ZVxuICogbWF0Y2hpbmcgcHVycG9zZXMgYW5kIHNldHRpbmcgaW5pdGlhbCBpbnB1dHMgb2YgZGlyZWN0aXZlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBjb25zdCB0YWdOYW1lID0gJ25nLWNvbnRhaW5lcic7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2VsZW1lbnQgY29udGFpbmVycyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgbmF0aXZlID0gcmVuZGVyZXIuY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyB0YWdOYW1lIDogJycpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggLSAxKTtcbiAgY29uc3QgdE5vZGUgPVxuICAgICAgY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmUsIHRhZ05hbWUsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGFwcGVuZENoaWxkKG5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIGxvY2FsUmVmcyk7XG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBjdXJyZW50UXVlcmllcy5hZGROb2RlKHROb2RlKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSA8bmctY29udGFpbmVyPi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpO1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgITtcbiAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgY29uc3QgY3VycmVudFF1ZXJpZXMgPSBsVmlld1tRVUVSSUVTXTtcbiAgaWYgKGN1cnJlbnRRdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPVxuICAgICAgICBpc0NvbnRlbnRRdWVyeUhvc3QocHJldmlvdXNPclBhcmVudFROb2RlKSA/IGN1cnJlbnRRdWVyaWVzLnBhcmVudCA6IGN1cnJlbnRRdWVyaWVzO1xuICB9XG5cbiAgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcyh0VmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgRE9NIGVsZW1lbnQuIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50RW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIG5hbWUgTmFtZSBvZiB0aGUgRE9NIE5vZGVcbiAqIEBwYXJhbSBhdHRycyBTdGF0aWNhbGx5IGJvdW5kIHNldCBvZiBhdHRyaWJ1dGVzLCBjbGFzc2VzLCBhbmQgc3R5bGVzIHRvIGJlIHdyaXR0ZW4gaW50byB0aGUgRE9NXG4gKiAgICAgICAgICAgICAgZWxlbWVudCBvbiBjcmVhdGlvbi4gVXNlIFtBdHRyaWJ1dGVNYXJrZXJdIHRvIGRlbm90ZSB0aGUgbWVhbmluZyBvZiB0aGlzIGFycmF5LlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogQXR0cmlidXRlcyBhbmQgbG9jYWxSZWZzIGFyZSBwYXNzZWQgYXMgYW4gYXJyYXkgb2Ygc3RyaW5ncyB3aGVyZSBlbGVtZW50cyB3aXRoIGFuIGV2ZW4gaW5kZXhcbiAqIGhvbGQgYW4gYXR0cmlidXRlIG5hbWUgYW5kIGVsZW1lbnRzIHdpdGggYW4gb2RkIGluZGV4IGhvbGQgYW4gYXR0cmlidXRlIHZhbHVlLCBleC46XG4gKiBbJ2lkJywgJ3dhcm5pbmc1JywgJ2NsYXNzJywgJ2FsZXJ0J11cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdGFydChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudHMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncyAnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlRWxlbWVudCsrO1xuXG4gIGNvbnN0IG5hdGl2ZSA9IGVsZW1lbnRDcmVhdGUobmFtZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCAtIDEpO1xuXG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmUgISwgbmFtZSwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgaWYgKGF0dHJzKSB7XG4gICAgLy8gaXQncyBpbXBvcnRhbnQgdG8gb25seSBwcmVwYXJlIHN0eWxpbmctcmVsYXRlZCBkYXRhc3RydWN0dXJlcyBvbmNlIGZvciBhIGdpdmVuXG4gICAgLy8gdE5vZGUgYW5kIG5vdCBlYWNoIHRpbWUgYW4gZWxlbWVudCBpcyBjcmVhdGVkLiBBbHNvLCB0aGUgc3R5bGluZyBjb2RlIGlzIGRlc2lnbmVkXG4gICAgLy8gdG8gYmUgcGF0Y2hlZCBhbmQgY29uc3RydWN0ZWQgYXQgdmFyaW91cyBwb2ludHMsIGJ1dCBvbmx5IHVwIHVudGlsIHRoZSBmaXJzdCBlbGVtZW50XG4gICAgLy8gaXMgY3JlYXRlZC4gVGhlbiB0aGUgc3R5bGluZyBjb250ZXh0IGlzIGxvY2tlZCBhbmQgY2FuIG9ubHkgYmUgaW5zdGFudGlhdGVkIGZvciBlYWNoXG4gICAgLy8gc3VjY2Vzc2l2ZSBlbGVtZW50IHRoYXQgaXMgY3JlYXRlZC5cbiAgICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSAmJiBoYXNTdHlsaW5nKGF0dHJzKSkge1xuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gaW5pdGlhbGl6ZVN0YXRpY1N0eWxpbmdDb250ZXh0KGF0dHJzKTtcbiAgICB9XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICB9XG5cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgbFZpZXcpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKHRWaWV3LCBsVmlldywgbG9jYWxSZWZzKTtcblxuICAvLyBhbnkgaW1tZWRpYXRlIGNoaWxkcmVuIG9mIGEgY29tcG9uZW50IG9yIHRlbXBsYXRlIGNvbnRhaW5lciBtdXN0IGJlIHByZS1lbXB0aXZlbHlcbiAgLy8gbW9ua2V5LXBhdGNoZWQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXcgZGF0YSBzbyB0aGF0IHRoZSBlbGVtZW50IGNhbiBiZSBpbnNwZWN0ZWRcbiAgLy8gbGF0ZXIgb24gdXNpbmcgYW55IGVsZW1lbnQgZGlzY292ZXJ5IHV0aWxpdHkgbWV0aG9kcyAoc2VlIGBlbGVtZW50X2Rpc2NvdmVyeS50c2ApXG4gIGlmIChnZXRFbGVtZW50RGVwdGhDb3VudCgpID09PSAwKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG4gIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyBpZiBhIGRpcmVjdGl2ZSBjb250YWlucyBhIGhvc3QgYmluZGluZyBmb3IgXCJjbGFzc1wiIHRoZW4gYWxsIGNsYXNzLWJhc2VkIGRhdGEgd2lsbFxuICAvLyBmbG93IHRocm91Z2ggdGhhdCAoZXhjZXB0IGZvciBgW2NsYXNzLnByb3BdYCBiaW5kaW5ncykuIFRoaXMgYWxzbyBpbmNsdWRlcyBpbml0aWFsXG4gIC8vIHN0YXRpYyBjbGFzcyB2YWx1ZXMgYXMgd2VsbC4gKE5vdGUgdGhhdCB0aGlzIHdpbGwgYmUgZml4ZWQgb25jZSBtYXAtYmFzZWQgYFtzdHlsZV1gXG4gIC8vIGFuZCBgW2NsYXNzXWAgYmluZGluZ3Mgd29yayBmb3IgbXVsdGlwbGUgZGlyZWN0aXZlcy4pXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGNvbnN0IGlucHV0RGF0YSA9IGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZSk7XG4gICAgaWYgKGlucHV0RGF0YSAmJiBpbnB1dERhdGEuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gIH1cblxuICAvLyBUaGVyZSBpcyBubyBwb2ludCBpbiByZW5kZXJpbmcgc3R5bGVzIHdoZW4gYSBjbGFzcyBkaXJlY3RpdmUgaXMgcHJlc2VudCBzaW5jZVxuICAvLyBpdCB3aWxsIHRha2UgdGhhdCBvdmVyIGZvciB1cyAodGhpcyB3aWxsIGJlIHJlbW92ZWQgb25jZSAjRlctODgyIGlzIGluKS5cbiAgaWYgKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSAmJiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQpID09PSAwKSB7XG4gICAgcmVuZGVySW5pdGlhbFN0eWxlc0FuZENsYXNzZXMobmF0aXZlLCB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIGxWaWV3W1JFTkRFUkVSXSk7XG4gIH1cblxuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBjdXJyZW50UXVlcmllcy5hZGROb2RlKHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IGdldExWaWV3KClbUkVOREVSRVJdO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBUTm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuXG4gICAgcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgICAgIHRWaWV3LCBsVmlldywgZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXcsIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpLFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBEdXJpbmcgZmlyc3QgdGVtcGxhdGUgcGFzcywgcXVlcmllcyBhcmUgY3JlYXRlZCBvciBjbG9uZWQgd2hlbiBmaXJzdCByZXF1ZXN0ZWRcbiAgICAvLyB1c2luZyBgZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllc2AuIEZvciBzdWJzZXF1ZW50IHRlbXBsYXRlIHBhc3Nlcywgd2UgY2xvbmVcbiAgICAvLyBhbnkgY3VycmVudCBMUXVlcmllcyBoZXJlIHVwLWZyb250IGlmIHRoZSBjdXJyZW50IG5vZGUgaG9zdHMgYSBjb250ZW50IHF1ZXJ5LlxuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpICYmIGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgICBsVmlld1tRVUVSSUVTXSA9IGxWaWV3W1FVRVJJRVNdICEuY2xvbmUoKTtcbiAgICB9XG4gIH1cbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgPVxuICAgICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGNvbnN0cztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSB7XG4gICAgaWQ6IHZpZXdJbmRleCxcbiAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICBub2RlOiBudWxsICEsXG4gICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgY2hpbGRJbmRleDogLTEsICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgdmlld1F1ZXJ5U3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IHRydWUsXG4gICAgaW5pdEhvb2tzOiBudWxsLFxuICAgIGNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZXcgQXJyYXkoaW5pdGlhbFZpZXdMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChudWxsLCAwLCBiaW5kaW5nU3RhcnRJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKE5PX0NIQU5HRSwgYmluZGluZ1N0YXJ0SW5kZXgpIGFzIExWaWV3O1xuICBibHVlcHJpbnRbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICBibHVlcHJpbnRbQklORElOR19JTkRFWF0gPSBiaW5kaW5nU3RhcnRJbmRleDtcbiAgcmV0dXJuIGJsdWVwcmludDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGFsbCBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHZpYSB0aGUgaW5mZXJyZWQgcmVuZGVyZXIuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIHR3byBmb3JtcyBvZiBhdHRyaWJ1dGUgZW50cmllczpcbiAqXG4gKiBkZWZhdWx0OiAoa2V5LCB2YWx1ZSk6XG4gKiAgYXR0cnMgPSBba2V5MSwgdmFsdWUxLCBrZXkyLCB2YWx1ZTJdXG4gKlxuICogbmFtZXNwYWNlZDogKE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUpXG4gKiAgYXR0cnMgPSBbTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZSwgTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZV1cbiAqXG4gKiBUaGUgYGF0dHJzYCBhcnJheSBjYW4gY29udGFpbiBhIG1peCBvZiBib3RoIHRoZSBkZWZhdWx0IGFuZCBuYW1lc3BhY2VkIGVudHJpZXMuXG4gKiBUaGUgXCJkZWZhdWx0XCIgdmFsdWVzIGFyZSBzZXQgd2l0aG91dCBhIG1hcmtlciwgYnV0IGlmIHRoZSBmdW5jdGlvbiBjb21lcyBhY3Jvc3NcbiAqIGEgbWFya2VyIHZhbHVlIHRoZW4gaXQgd2lsbCBhdHRlbXB0IHRvIHNldCBhIG5hbWVzcGFjZWQgdmFsdWUuIElmIHRoZSBtYXJrZXIgaXNcbiAqIG5vdCBvZiBhIG5hbWVzcGFjZWQgdmFsdWUgdGhlbiB0aGUgZnVuY3Rpb24gd2lsbCBxdWl0IGFuZCByZXR1cm4gdGhlIGluZGV4IHZhbHVlXG4gKiB3aGVyZSBpdCBzdG9wcGVkIGR1cmluZyB0aGUgaXRlcmF0aW9uIG9mIHRoZSBhdHRycyBhcnJheS5cbiAqXG4gKiBTZWUgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gdW5kZXJzdGFuZCB3aGF0IHRoZSBuYW1lc3BhY2UgbWFya2VyIHZhbHVlIGlzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGluc3RydWN0aW9uIGRvZXMgbm90IHN1cHBvcnQgYXNzaWduaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgdG9cbiAqIGFuIGVsZW1lbnQuIFNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgIHRvIGxlYXJuIGhvdyBzdHlsaW5nIHZhbHVlc1xuICogYXJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBlbGVtZW50IHRoYXQgdGhlIGF0dHJpYnV0ZXMgd2lsbCBiZSBhc3NpZ25lZCB0b1xuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGUgYXJyYXkgb2YgdmFsdWVzIHRoYXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICogQHJldHVybnMgdGhlIGluZGV4IHZhbHVlIHRoYXQgd2FzIGxhc3QgYWNjZXNzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlcbiAqL1xuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBUQXR0cmlidXRlcyk6IG51bWJlciB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcblxuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gb25seSBuYW1lc3BhY2VzIGFyZSBzdXBwb3J0ZWQuIE90aGVyIHZhbHVlIHR5cGVzIChzdWNoIGFzIHN0eWxlL2NsYXNzXG4gICAgICAvLyBlbnRyaWVzKSBhcmUgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGZ1bmN0aW9uLlxuICAgICAgaWYgKHZhbHVlICE9PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBqdXN0IGxhbmRlZCBvbiB0aGUgbWFya2VyIHZhbHVlIC4uLiB0aGVyZWZvcmVcbiAgICAgIC8vIHdlIHNob3VsZCBza2lwIHRvIHRoZSBuZXh0IGVudHJ5XG4gICAgICBpKys7XG5cbiAgICAgIGNvbnN0IG5hbWVzcGFjZVVSSSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vLyBhdHRyTmFtZSBpcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1srK2ldO1xuICAgICAgaWYgKGF0dHJOYW1lICE9PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgICAvLyBTdGFuZGFyZCBhdHRyaWJ1dGVzXG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgICAgaWYgKGlzQW5pbWF0aW9uUHJvcChhdHRyTmFtZSkpIHtcbiAgICAgICAgICBpZiAoaXNQcm9jKSB7XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0UHJvcGVydHkobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFub3RoZXIgcGllY2Ugb2YgY29kZSBtYXkgaXRlcmF0ZSBvdmVyIHRoZSBzYW1lIGF0dHJpYnV0ZXMgYXJyYXkuIFRoZXJlZm9yZVxuICAvLyBpdCBtYXkgYmUgaGVscGZ1bCB0byByZXR1cm4gdGhlIGV4YWN0IHNwb3Qgd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJyYXkgZXhpdGVkXG4gIC8vIHdoZXRoZXIgYnkgcnVubmluZyBpbnRvIGFuIHVuc3VwcG9ydGVkIG1hcmtlciBvciBpZiBhbGwgdGhlIHN0YXRpYyB2YWx1ZXMgd2VyZVxuICAvLyBpdGVyYXRlZCBvdmVyLlxuICByZXR1cm4gaTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtyZW5kZXJTdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGxpc3RlbmVySW50ZXJuYWwoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiAqIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiAqIHBhcmVudCBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWRcbiAqIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuICogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuICogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudEhvc3RTeW50aGV0aWNMaXN0ZW5lcjxUPihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBsaXN0ZW5lckludGVybmFsKGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlciwgbG9hZENvbXBvbmVudFJlbmRlcmVyKTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJJbnRlcm5hbChcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IHRDbGVhbnVwOiBmYWxzZXxhbnlbXSA9IGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDoge30gYXMgYW55O1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVkLnRhcmdldCB8fCBuYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgbGV0IHVzZUNhcHR1cmVPclN1YklkeDogYm9vbGVhbnxudW1iZXIgPSB1c2VDYXB0dXJlO1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAvLyAtIGVpdGhlciBhIHRhcmdldCBuYW1lIChhcyBhIHN0cmluZykgaW4gY2FzZSBvZiBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csIGRvY3VtZW50LCBib2R5KVxuICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gbENsZWFudXBJbmRleCArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGxDbGVhbnVwLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcihyZWFkRWxlbWVudFZhbHVlKF9sVmlld1t0Tm9kZS5pbmRleF0pKS50YXJnZXQgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcbiAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IHByb3BzOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wc0xlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcHJvcHNbaV0gYXMgbnVtYmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICAgICAgY29uc3QgbWluaWZpZWROYW1lID0gcHJvcHNbaSArIDJdO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZGlyZWN0aXZlSW5zdGFuY2VbbWluaWZpZWROYW1lXTtcblxuICAgICAgICBpZiAobmdEZXZNb2RlICYmICFpc09ic2VydmFibGUob3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYEBPdXRwdXQgJHttaW5pZmllZE5hbWV9IG5vdCBpbml0aWFsaXplZCBpbiAnJHtkaXJlY3RpdmVJbnN0YW5jZS5jb25zdHJ1Y3Rvci5uYW1lfScuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvdXRwdXQuc3Vic2NyaWJlKGxpc3RlbmVyRm4pO1xuICAgICAgICBjb25zdCBpZHggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIHROb2RlLmluZGV4LCBpZHgsIC0oaWR4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID1cbiAgICAgICAgaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkgPyBjdXJyZW50UXVlcmllcy5wYXJlbnQgOiBjdXJyZW50UXVlcmllcztcbiAgfVxuXG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyB0aGlzIGlzIGZpcmVkIGF0IHRoZSBlbmQgb2YgZWxlbWVudEVuZCBiZWNhdXNlIEFMTCBvZiB0aGUgc3R5bGluZ0JpbmRpbmdzIGNvZGVcbiAgLy8gKGZvciBkaXJlY3RpdmVzIGFuZCB0aGUgdGVtcGxhdGUpIGhhdmUgbm93IGV4ZWN1dGVkIHdoaWNoIG1lYW5zIHRoZSBzdHlsaW5nXG4gIC8vIGNvbnRleHQgY2FuIGJlIGluc3RhbnRpYXRlZCBwcm9wZXJseS5cbiAgaWYgKGhhc0NsYXNzSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBudW1iZXIgaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgVGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkIHdoZW4gdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICogICAgICAgICAgICAgICAgICBPdGhlcndpc2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZ2lmaWVkIHZhbHVlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYW1lc3BhY2UgT3B0aW9uYWwgbmFtZXNwYWNlIHRvIHVzZSB3aGVuIHNldHRpbmcgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlQXR0cmlidXRlKG5hbWUpO1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuYW1lc3BhY2UgPyBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcGFyYW0gbmF0aXZlT25seSBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgb25seSBzZXQgbmF0aXZlIHByb3BlcnRpZXMgYW5kIHNraXAgaW5wdXQgY2hlY2tcbiAqICh0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgaG9zdCBwcm9wZXJ0eSBiaW5kaW5ncylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hdGl2ZU9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGluZGV4LCBwcm9wTmFtZSwgdmFsdWUsIHNhbml0aXplciwgbmF0aXZlT25seSk7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHN5bnRoZXRpYyBob3N0IGJpbmRpbmcgKGUuZy4gYFtAZm9vXWApIG9uIGEgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgZm9yIGNvbXBhdGliaWxpdHkgcHVycG9zZXMgYW5kIGlzIGRlc2lnbmVkIHRvIGVuc3VyZSB0aGF0IGFcbiAqIHN5bnRoZXRpYyBob3N0IGJpbmRpbmcgKGUuZy4gYEBIb3N0QmluZGluZygnQGZvbycpYCkgcHJvcGVybHkgZ2V0cyByZW5kZXJlZCBpblxuICogdGhlIGNvbXBvbmVudCdzIHJlbmRlcmVyLiBOb3JtYWxseSBhbGwgaG9zdCBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkIHdpdGggdGhlIHBhcmVudFxuICogY29tcG9uZW50J3MgcmVuZGVyZXIsIGJ1dCwgaW4gdGhlIGNhc2Ugb2YgYW5pbWF0aW9uIEB0cmlnZ2VycywgdGhleSBuZWVkIHRvIGJlXG4gKiBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGUgYW5pbWF0aW9uXG4gKiB0cmlnZ2VycyBhcmUgZGVmaW5lZCkuXG4gKlxuICogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBlbGVtZW50UHJvcGVydHlgLiBUaGlzIGluc3RydWN0aW9uXG4gKiBvbmx5IGV4aXN0cyB0byBlbnN1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBWaWV3RW5naW5lJ3MgaG9zdCBiaW5kaW5nIGJlaGF2aW9yLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHBhcmFtIG5hdGl2ZU9ubHkgV2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIG9ubHkgc2V0IG5hdGl2ZSBwcm9wZXJ0aWVzIGFuZCBza2lwIGlucHV0IGNoZWNrXG4gKiAodGhpcyBpcyBuZWNlc3NhcnkgZm9yIGhvc3QgcHJvcGVydHkgYmluZGluZ3MpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRIb3N0U3ludGhldGljUHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYXRpdmVPbmx5PzogYm9vbGVhbikge1xuICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChpbmRleCwgcHJvcE5hbWUsIHZhbHVlLCBzYW5pdGl6ZXIsIG5hdGl2ZU9ubHksIGxvYWRDb21wb25lbnRSZW5kZXJlcik7XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBsZXQgaW5wdXREYXRhOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiAoaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKSkgJiZcbiAgICAgIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZVByb3BlcnR5KHByb3BOYW1lKTtcbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgc2F2ZVByb3BlcnR5RGVidWdEYXRhKHROb2RlLCBsVmlldywgcHJvcE5hbWUsIGxWaWV3W1RWSUVXXS5kYXRhLCBuYXRpdmVPbmx5KTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN0b3JlcyBkZWJ1Z2dpbmcgZGF0YSBmb3IgdGhpcyBwcm9wZXJ0eSBiaW5kaW5nIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4gKiBUaGlzIGVuYWJsZXMgZmVhdHVyZXMgbGlrZSBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZVByb3BlcnR5RGVidWdEYXRhKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB0RGF0YTogVERhdGEsXG4gICAgbmF0aXZlT25seTogYm9vbGVhbiB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICBjb25zdCBsYXN0QmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSAxO1xuXG4gIC8vIEJpbmQvaW50ZXJwb2xhdGlvbiBmdW5jdGlvbnMgc2F2ZSBiaW5kaW5nIG1ldGFkYXRhIGluIHRoZSBsYXN0IGJpbmRpbmcgaW5kZXgsXG4gIC8vIGJ1dCBsZWF2ZSB0aGUgcHJvcGVydHkgbmFtZSBibGFuay4gSWYgdGhlIGludGVycG9sYXRpb24gZGVsaW1pdGVyIGlzIGF0IHRoZSAwXG4gIC8vIGluZGV4LCB3ZSBrbm93IHRoYXQgdGhpcyBpcyBvdXIgZmlyc3QgcGFzcyBhbmQgdGhlIHByb3BlcnR5IG5hbWUgc3RpbGwgbmVlZHMgdG9cbiAgLy8gYmUgc2V0LlxuICBjb25zdCBiaW5kaW5nTWV0YWRhdGEgPSB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gIGlmIChiaW5kaW5nTWV0YWRhdGFbMF0gPT0gSU5URVJQT0xBVElPTl9ERUxJTUlURVIpIHtcbiAgICB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9IHByb3BOYW1lICsgYmluZGluZ01ldGFkYXRhO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzdG9yZSBpbmRpY2VzIGZvciBob3N0IGJpbmRpbmdzIGJlY2F1c2UgdGhleSBhcmUgc3RvcmVkIGluIGFcbiAgICAvLyBkaWZmZXJlbnQgcGFydCBvZiBMVmlldyAodGhlIGV4cGFuZG8gc2VjdGlvbikuXG4gICAgaWYgKCFuYXRpdmVPbmx5KSB7XG4gICAgICBpZiAodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPSBsYXN0QmluZGluZ0luZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleCArIDE7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhZGp1c3RlZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICBsVmlldzogTFZpZXcsIHR5cGU6IFROb2RlVHlwZSwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwsIHRWaWV3czogVFZpZXdbXSB8IG51bGwpOiBUTm9kZSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIGNvbnN0IHBhcmVudCA9XG4gICAgICBnZXRJc1BhcmVudCgpID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG5cbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgbFZpZXcgJiYgcGFyZW50ICE9PSBsVmlld1tIT1NUX05PREVdO1xuICBjb25zdCB0UGFyZW50ID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG5cbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGluamVjdG9ySW5kZXg6IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMSxcbiAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICBwcm9wZXJ0eU1ldGFkYXRhU3RhcnRJbmRleDogLTEsXG4gICAgcHJvcGVydHlNZXRhZGF0YUVuZEluZGV4OiAtMSxcbiAgICBmbGFnczogMCxcbiAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogdFZpZXdzLFxuICAgIG5leHQ6IG51bGwsXG4gICAgY2hpbGQ6IG51bGwsXG4gICAgcGFyZW50OiB0UGFyZW50LFxuICAgIGRldGFjaGVkOiBudWxsLFxuICAgIHN0eWxpbmdUZW1wbGF0ZTogbnVsbCxcbiAgICBwcm9qZWN0aW9uOiBudWxsXG4gIH07XG59XG5cbi8qKlxuICogU2V0IHRoZSBpbnB1dHMgb2YgZGlyZWN0aXZlcyBhdCB0aGUgY3VycmVudCBub2RlIHRvIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGlucHV0QWxpYXNlcyBtYXBwaW5nIGJldHdlZW4gdGhlIHB1YmxpYyBcImlucHV0XCIgbmFtZSBhbmQgcHJpdmF0ZWx5LWtub3duLFxuICogcG9zc2libHkgbWluaWZpZWQsIHByb3BlcnR5IG5hbWVzIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHNldC5cbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnRpZXMoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOyBpICs9IDMpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoaW5wdXRzW2kgKyAyXSBhcyBzdHJpbmcpO1xuICAgIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZUZsYWdzIG5vZGUgZmxhZ3NcbiAqIEBwYXJhbSBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZTogVE5vZGUsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gYW55IGlubGluZSBzdHlsZSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC4gTm90ZSBmb3Igc3RhdGljIHZhbHVlcyAobm8gYmluZGluZylcbiAqIHNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudENsYXNzUHJvcGAgcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluIHRoaXMgYXJyYXkuXG4gKiAgICAgICAgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50U3R5bGVQcm9wYCByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW4gdGhpcyBhcnJheS5cbiAqICAgICAgICAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHByb3BlcnR5IHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqICAgICAgICBOb3RlIHRoYXQgdGhlIHNhbml0aXplciBpbnN0YW5jZSBpdHNlbGYgaXMgdGllZCB0byB0aGUgYGRpcmVjdGl2ZWAgKGlmICBwcm92aWRlZCkuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEEgZGlyZWN0aXZlIGluc3RhbmNlIHRoZSBzdHlsaW5nIGlzIGFzc29jaWF0ZWQgd2l0aC4gSWYgbm90IHByb3ZpZGVkXG4gKiAgICAgICAgY3VycmVudCB2aWV3J3MgY29udHJvbGxlciBpbnN0YW5jZSBpcyBhc3N1bWVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlIHx8IG51bGwsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcyxcbiAgICAgIHN0eWxlU2FuaXRpemVyLCBoYXNDbGFzc0lucHV0KHROb2RlKSk7XG59XG5cbi8qKlxuICogQXNzaWduIHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWVzIHRvIGEgaG9zdCBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgYXMgd2VsbCBhcyBjbGFzcyBhbmQgc3R5bGVcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gU2luY2UgYXR0cmlidXRlIHZhbHVlc1xuICogY2FuIGNvbnNpc3Qgb2YgZGlmZmVyZW50IHR5cGVzIG9mIHZhbHVlcywgdGhlIGBhdHRyc2AgYXJyYXkgbXVzdCBpbmNsdWRlIHRoZSB2YWx1ZXMgaW5cbiAqIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICpcbiAqIGF0dHJzID0gW1xuICogICAvLyBzdGF0aWMgYXR0cmlidXRlcyAobGlrZSBgdGl0bGVgLCBgbmFtZWAsIGBpZGAuLi4pXG4gKiAgIGF0dHIxLCB2YWx1ZTEsIGF0dHIyLCB2YWx1ZSxcbiAqXG4gKiAgIC8vIGEgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDppZGApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTEsIG5hbWUxLCB2YWx1ZTEsXG4gKlxuICogICAvLyBhbm90aGVyIHNpbmdsZSBuYW1lc3BhY2UgdmFsdWUgKGxpa2UgYHg6bmFtZWApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTIsIG5hbWUyLCB2YWx1ZTIsXG4gKlxuICogICAvLyBhIHNlcmllcyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAobm8gc3BhY2VzKVxuICogICBDTEFTU0VTX01BUktFUiwgY2xhc3MxLCBjbGFzczIsIGNsYXNzMyxcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBzdHlsZXMgKHByb3BlcnR5ICsgdmFsdWUpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgIFNUWUxFU19NQVJLRVIsIHByb3AxLCB2YWx1ZTEsIHByb3AyLCB2YWx1ZTJcbiAqIF1cbiAqXG4gKiBBbGwgbm9uLWNsYXNzIGFuZCBub24tc3R5bGUgYXR0cmlidXRlcyBtdXN0IGJlIGRlZmluZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsaXN0XG4gKiBmaXJzdCBiZWZvcmUgYWxsIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXJlIHNldC4gV2hlbiB0aGVyZSBpcyBhIGNoYW5nZSBpbiB2YWx1ZVxuICogdHlwZSAobGlrZSB3aGVuIGNsYXNzZXMgYW5kIHN0eWxlcyBhcmUgaW50cm9kdWNlZCkgYSBtYXJrZXIgbXVzdCBiZSB1c2VkIHRvIHNlcGFyYXRlXG4gKiB0aGUgZW50cmllcy4gVGhlIG1hcmtlciB2YWx1ZXMgdGhlbXNlbHZlcyBhcmUgc2V0IHZpYSBlbnRyaWVzIGZvdW5kIGluIHRoZVxuICogW0F0dHJpYnV0ZU1hcmtlcl0gZW51bS5cbiAqXG4gKiBOT1RFOiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIHVzZWQgZnJvbSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBvbmx5LlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgQSBkaXJlY3RpdmUgaW5zdGFuY2UgdGhlIHN0eWxpbmcgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICogQHBhcmFtIGF0dHJzIEFuIGFycmF5IG9mIHN0YXRpYyB2YWx1ZXMgKGF0dHJpYnV0ZXMsIGNsYXNzZXMgYW5kIHN0eWxlcykgd2l0aCB0aGUgY29ycmVjdCBtYXJrZXJcbiAqIHZhbHVlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdEF0dHJzKGRpcmVjdGl2ZTogYW55LCBhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICB9XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBpID0gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnModE5vZGUuc3R5bGluZ1RlbXBsYXRlLCBhdHRycywgaSwgZGlyZWN0aXZlKTtcbn1cblxuLyoqXG4gKiBBcHBseSBzdHlsaW5nIGJpbmRpbmcgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYGVsZW1lbnRTdHlsZWAgYW5kL29yIGBlbGVtZW50U3R5bGVQcm9wYC5cbiAqIGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgY2hhbmdlZCB0aGVuIHRoZSBjaGFuZ2VzIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbmNvbXBvbmVudHNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5KGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZT86IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGlzRmlyc3RSZW5kZXIgPSAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcykgIT09IDA7XG4gIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KSwgbFZpZXdbUkVOREVSRVJdLCBsVmlldywgaXNGaXJzdFJlbmRlciwgbnVsbCxcbiAgICAgIG51bGwsIGRpcmVjdGl2ZSk7XG4gIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5ncyB2YWx1ZSBvbiBhbiBlbGVtZW50LlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBgbnVsbGAgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYGVsZW1lbnRTdHlsZWAgb3IgYW55IHN0eWxlcyB0aGF0IGFyZSBwcmVzZW50XG4gKiBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgKHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgZWxlbWVudFN0eWxpbmdBcHBseWAuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYGVsZW1lbnRTdGx5aW5nQmluZGluZ3NgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAobnVsbCB0byByZW1vdmUpLiBOb3RlIHRoYXQgaWYgYSBkaXJlY3RpdmUgYWxzb1xuICogICAgICAgIGF0dGVtcHRzIHRvIHdyaXRlIHRvIHRoZSBzYW1lIGJpbmRpbmcgdmFsdWUgdGhlbiBpdCB3aWxsIG9ubHkgYmUgYWJsZSB0b1xuICogICAgICAgIGRvIHNvIGlmIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIHZhbHVlIGlzIGBudWxsYCAob3IgZG9lc24ndCBleGlzdCBhdCBhbGwpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbmNvbXBvbmVudHNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgZGlyZWN0aXZlKTtcbn1cblxuLyoqXG4gKiBBZGQgb3IgcmVtb3ZlIGEgY2xhc3MgdmlhIGEgY2xhc3MgYmluZGluZyBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBbY2xhc3MuZm9vXT1cImV4cFwiIGNhc2UgYW5kLCB0aGVyZWZvcmUsXG4gKiB0aGUgY2xhc3MgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhcHBsaWVkIHVzaW5nIGBlbGVtZW50U3R5bGluZ2Agd2l0aGluXG4gKiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0bHlpbmdCaW5kaW5nc2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIERpcmVjdGl2ZSBpbnN0YW5jZSB0aGF0IGlzIGF0dGVtcHRpbmcgdG8gY2hhbmdlIHN0eWxpbmcuIChEZWZhdWx0cyB0byB0aGVcbiAqICAgICAgICBjb21wb25lbnQgb2YgdGhlIGN1cnJlbnQgdmlldykuXG5jb21wb25lbnRzXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZGlyZWN0aXZlPzoge30pOiB2b2lkIHtcbiAgY29uc3Qgb25Pck9mZkNsYXNzVmFsdWUgPVxuICAgICAgKHZhbHVlIGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/ICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbj4pIDogKCEhdmFsdWUpO1xuICB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgY2xhc3NJbmRleCwgb25Pck9mZkNsYXNzVmFsdWUsXG4gICAgICBkaXJlY3RpdmUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBhbmQvb3IgY2xhc3MgYmluZGluZ3MgdXNpbmcgb2JqZWN0IGxpdGVyYWwuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgYW5kIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlXG4gKiBiaW5kaW5ncy4gV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIEVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgcGxhY2VkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBgbnVsbGAgdGhlbiB0aGV5IHdpbGwgYmVcbiAqIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBEaXJlY3RpdmUgaW5zdGFuY2UgdGhhdCBpcyBhdHRlbXB0aW5nIHRvIGNoYW5nZSBzdHlsaW5nLiAoRGVmYXVsdHMgdG8gdGhlXG4gKiAgICAgICAgY29tcG9uZW50IG9mIHRoZSBjdXJyZW50IHZpZXcpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGlmIChkaXJlY3RpdmUgIT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBoYWNrSW1wbGVtZW50YXRpb25PZkVsZW1lbnRTdHlsaW5nTWFwKFxuICAgICAgICBpbmRleCwgY2xhc3Nlcywgc3R5bGVzLCBkaXJlY3RpdmUpOyAgLy8gc3VwcG9ydGVkIGluIG5leHQgUFJcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgY29uc3QgY2xhc3NJbnB1dFZhbCA9XG4gICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgKGNsYXNzZXMgYXMgc3RyaW5nKTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgY2xhc3NJbnB1dFZhbCk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlU3R5bGluZ01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzKTtcbiAgfVxufVxuXG4vKiBTVEFSVCBPRiBIQUNLIEJMT0NLICovXG5mdW5jdGlvbiBoYWNrSW1wbGVtZW50YXRpb25PZkVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIHRocm93IG5ldyBFcnJvcigndW5pbXBsZW1lbnRlZC4gU2hvdWxkIG5vdCBiZSBuZWVkZWQgYnkgVmlld0VuZ2luZSBjb21wYXRpYmlsaXR5Jyk7XG59XG4vKiBFTkQgT0YgSEFDSyBCTE9DSyAqL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBUZXh0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBzdGF0aWMgdGV4dCBub2RlXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIFRoaXMgdmFsdWUgd2lsbCBiZSBzdHJpbmdpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU/OiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0TmF0aXZlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIGxWaWV3W1JFTkRFUkVSXSk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0TmF0aXZlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIHNldElzUGFyZW50KGZhbHNlKTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShlbGVtZW50LCByZW5kZXJTdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRGlyZWN0aXZlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmLCBkZWYuZmFjdG9yeSk7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID1cbiAgICAgIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIHZpZXdEYXRhLCB2aWV3RGF0YS5sZW5ndGggLSAxLCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCByb290VE5vZGUsIGRpcmVjdGl2ZSwgZGVmIGFzIERpcmVjdGl2ZURlZjxUPik7XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10gfCBudWxsLCB0Tm9kZTogVE5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmRhdGEubGVuZ3RoO1xuICAgICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcblxuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcCh0Vmlldy5kYXRhICEubGVuZ3RoIC0gMSwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgICAgLy8gYW55IHByb2plY3RlZCBjb21wb25lbnRzLlxuICAgICAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKGRpcmVjdGl2ZURlZklkeCwgZGVmLCB0Vmlldyk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIWdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgc3RhcnQgPCBlbmQpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGxWaWV3ICEsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgcG9zdFByb2Nlc3NEaXJlY3RpdmUobFZpZXcsIGRpcmVjdGl2ZSwgZGVmLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IGdldEZpcnN0VGVtcGxhdGVQYXNzKCk7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSB2aWV3RGF0YVtpXTtcbiAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgY29uc3QgcHJldmlvdXNFeHBhbmRvTGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gICAgICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZik7XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUsIHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKG51bGwpO1xuICAgICAgLy8gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gbWF5IG9yIG1heSBub3QgY29udGFpbiBgYWxsb2NIb3N0VmFyc2AgY2FsbFxuICAgICAgLy8gKGUuZy4gaXQgbWF5IG5vdCBpZiBpdCBvbmx5IGNvbnRhaW5zIGhvc3QgbGlzdGVuZXJzKSwgc28gd2UgbmVlZCB0byBjaGVjayB3aGV0aGVyXG4gICAgICAvLyBgZXhwYW5kb0luc3RydWN0aW9uc2AgaGFzIGNoYW5nZWQgYW5kIGlmIG5vdCAtIHdlIHN0aWxsIHB1c2ggYGhvc3RCaW5kaW5nc2AgdG9cbiAgICAgIC8vIGV4cGFuZG8gYmxvY2ssIHRvIG1ha2Ugc3VyZSB3ZSBleGVjdXRlIGl0IGZvciBESSBjeWNsZVxuICAgICAgaWYgKHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9PT0gZXhwYW5kby5sZW5ndGggJiYgZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGV4cGFuZG8ucHVzaChudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEdlbmVyYXRlcyBhIG5ldyBibG9jayBpbiBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIGZvciB0aGlzIG5vZGUuXG4qXG4qIEVhY2ggZXhwYW5kbyBibG9jayBzdGFydHMgd2l0aCB0aGUgZWxlbWVudCBpbmRleCAodHVybmVkIG5lZ2F0aXZlIHNvIHdlIGNhbiBkaXN0aW5ndWlzaFxuKiBpdCBmcm9tIHRoZSBob3N0VmFyIGNvdW50KSBhbmQgdGhlIGRpcmVjdGl2ZSBjb3VudC4gU2VlIG1vcmUgaW4gVklFV19EQVRBLm1kLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcblxuICBjb25zdCBlbGVtZW50SW5kZXggPSAtKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW1xuICAgXSkpLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbmVlZCB0byByZXNlcnZlIHNwYWNlIGZvciBob3N0IGJpbmRpbmcgdmFsdWVzXG4qIGFmdGVyIGRpcmVjdGl2ZXMgYXJlIG1hdGNoZWQgKHNvIGFsbCBkaXJlY3RpdmVzIGFyZSBzYXZlZCwgdGhlbiBiaW5kaW5ncykuXG4qIEJlY2F1c2Ugd2UgYXJlIHVwZGF0aW5nIHRoZSBibHVlcHJpbnQsIHdlIG9ubHkgbmVlZCB0byBkbyB0aGlzIG9uY2UuXG4qL1xuZnVuY3Rpb24gcHJlZmlsbEhvc3RWYXJzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0b3RhbEhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChnZXRGaXJzdFRlbXBsYXRlUGFzcygpLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxIb3N0VmFyczsgaSsrKSB7XG4gICAgbFZpZXcucHVzaChOT19DSEFOR0UpO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2VzcyBhIGRpcmVjdGl2ZSBvbiB0aGUgY3VycmVudCBub2RlIGFmdGVyIGl0cyBjcmVhdGlvbi5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NEaXJlY3RpdmU8VD4oXG4gICAgdmlld0RhdGE6IExWaWV3LCBkaXJlY3RpdmU6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBkaXJlY3RpdmVEZWZJZHg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUsIGRpcmVjdGl2ZSwgZGVmKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlJyk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkZWYsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGVmLmNvbnRlbnRRdWVyaWVzKGRpcmVjdGl2ZURlZklkeCk7XG4gIH1cblxuICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIHZpZXdEYXRhKTtcbiAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICB9XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgcG9zdFByb2Nlc3NEaXJlY3RpdmUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSwgZGlyZWN0aXZlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbFZpZXcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoZ2V0SXNQYXJlbnQoKSk7XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG59XG5cblxuXG4vKipcbiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4qIElmIGEgY29tcG9uZW50IGlzIG1hdGNoZWQgKGF0IG1vc3Qgb25lKSwgaXQgaXMgcmV0dXJuZWQgaW4gZmlyc3QgcG9zaXRpb24gaW4gdGhlIGFycmF5LlxuKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfFxuICAgIG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbn1cblxuLyoqXG4gKiBTdG9yZXMgaG9zdCBiaW5kaW5nIGZuIGFuZCBudW1iZXIgb2YgaG9zdCB2YXJzIHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nXG4gKiBDRC5cbiovXG5mdW5jdGlvbiBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soXG4gICAgdFZpZXc6IFRWaWV3LCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PiwgaG9zdFZhcnM6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgITtcbiAgY29uc3QgbGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBhbHJlYWR5IGV4aXN0cyBpbiBleHBhbmRvSW5zdHJ1Y3Rpb25zLFxuICAvLyB3aGljaCBjYW4gaGFwcGVuIGluIGNhc2UgZGlyZWN0aXZlIGRlZmluaXRpb24gd2FzIGV4dGVuZGVkIGZyb20gYmFzZSBkZWZpbml0aW9uIChhcyBhIHBhcnQgb2ZcbiAgLy8gdGhlIGBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgIGxvZ2ljKS4gSWYgd2UgZm91bmQgdGhlIHNhbWUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gaW4gdGhlXG4gIC8vIGxpc3QsIHdlIGp1c3QgaW5jcmVhc2UgdGhlIG51bWJlciBvZiBob3N0IHZhcnMgYXNzb2NpYXRlZCB3aXRoIHRoYXQgZnVuY3Rpb24sIGJ1dCBkbyBub3QgYWRkIGl0XG4gIC8vIGludG8gdGhlIGxpc3QgYWdhaW4uXG4gIGlmIChsZW5ndGggPj0gMiAmJiBleHBhbmRvW2xlbmd0aCAtIDJdID09PSBkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgZXhwYW5kb1tsZW5ndGggLSAxXSA9IChleHBhbmRvW2xlbmd0aCAtIDFdIGFzIG51bWJlcikgKyBob3N0VmFycztcbiAgfSBlbHNlIHtcbiAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyAhLCBob3N0VmFycyk7XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4qIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0VGVtcGxhdGVQYXNzIHRvIGJlIHRydWUnKTtcbiAgY29uc3QgZmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZsYWdzID09PSAwIHx8IGZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCBub2RlIGZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5mbGFncyA9IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4sXG4gICAgZGlyZWN0aXZlRmFjdG9yeTogKHQ6IFR5cGU8VD58IG51bGwpID0+IGFueSkge1xuICB0Vmlldy5kYXRhLnB1c2goZGVmKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBmYWxzZSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXS5jcmVhdGVSZW5kZXJlcihuYXRpdmUgYXMgUkVsZW1lbnQsIGRlZikpKTtcblxuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBjb21wb25lbnRWaWV3W0hPU1RdID0gbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQpIHtcbiAgICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgLy8gSWYgd2UgaGl0IFNlbGVjdC1Pbmx5LCBDbGFzc2VzIG9yIFN0eWxlcywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5IHx8IGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcyB8fFxuICAgICAgICBhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcylcbiAgICAgIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUsIG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0IG5hdGl2ZVxuICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgdE5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIGxvY2FsUmVmcywgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlKTtcbiAgfVxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCB0Tm9kZSk7XG4gIHNldElzUGFyZW50KGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgKHROb2RlLnRWaWV3cyA9IFtdKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IGNvbW1lbnQgPSBsVmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMpO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVMQ29udGFpbmVyKGxWaWV3W2FkanVzdGVkSW5kZXhdLCBsVmlldywgY29tbWVudCk7XG5cbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsQ29udGFpbmVyKTtcblxuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWRJbnRlcm5hbCh0Vmlldy5kYXRhLCBpbmRleCkgYXMgVE5vZGU7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcblxuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgZXhlY3V0ZUluaXRIb29rcyhsVmlldywgdFZpZXcsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgdmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGdldExWaWV3KClbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgY29uc3QgbmV4dEluZGV4ID0gbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlcyB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBjdXJyZW50ID0gZ2V0TFZpZXdDaGlsZChsVmlldyk7IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld1xuICAgIC8vIGhlYWRlci5cbiAgICBpZiAoY3VycmVudC5sZW5ndGggPCBIRUFERVJfT0ZGU0VUICYmIGN1cnJlbnRbQUNUSVZFX0lOREVYXSA9PT0gLTEpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXd8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIHRDb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaGRlZi5jb250IGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAvLyBUaGUgcHJldmlvdXMgbm9kZSBjYW4gYmUgYSB2aWV3IG5vZGUgaWYgd2UgYXJlIHByb2Nlc3NpbmcgYW4gaW5saW5lIGZvciBsb29wXG4gIGNvbnN0IGNvbnRhaW5lclROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgISA6XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tjb250YWluZXJUTm9kZS5pbmRleF0gYXMgTENvbnRhaW5lcjtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyVE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBsZXQgdmlld1RvUmVuZGVyID0gc2NhbkZvclZpZXcoXG4gICAgICBsQ29udGFpbmVyLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld1RvUmVuZGVyKSB7XG4gICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBsVmlldyxcbiAgICAgICAgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb25zdHMsIHZhcnMsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlKSwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVWaWV3Tm9kZSh2aWV3QmxvY2tJZCwgdmlld1RvUmVuZGVyKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9XG4gIGlmIChsQ29udGFpbmVyKSB7XG4gICAgaWYgKGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikpIHtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KHZpZXdUb1JlbmRlciwgbENvbnRhaW5lciwgbFZpZXcsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCAtMSk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHZpZXdIb3N0ID0gbFZpZXdbSE9TVF9OT0RFXTtcblxuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldyk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MobFZpZXcpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICBsZWF2ZVZpZXcobFZpZXdbUEFSRU5UXSAhKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ICEpO1xuICBzZXRJc1BhcmVudChmYWxzZSk7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaDxUPihhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoYWRqdXN0ZWRFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxWaWV3W1RWSUVXXS5kYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIHN5bmNWaWV3V2l0aEJsdWVwcmludChob3N0Vmlldyk7XG4gICAgY2hlY2tWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3OiBMVmlldykge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5BdHRhY2hlZCkgPT09IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogSW5zdHJ1Y3Rpb24gdG8gZGlzdHJpYnV0ZSBwcm9qZWN0YWJsZSBub2RlcyBhbW9uZyA8bmctY29udGVudD4gb2NjdXJyZW5jZXMgaW4gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEl0IHRha2VzIGFsbCB0aGUgc2VsZWN0b3JzIGZyb20gdGhlIGVudGlyZSBjb21wb25lbnQncyB0ZW1wbGF0ZSBhbmQgZGVjaWRlcyB3aGVyZVxuICogZWFjaCBwcm9qZWN0ZWQgbm9kZSBiZWxvbmdzIChpdCByZS1kaXN0cmlidXRlcyBub2RlcyBhbW9uZyBcImJ1Y2tldHNcIiB3aGVyZSBlYWNoIFwiYnVja2V0XCIgaXNcbiAqIGJhY2tlZCBieSBhIHNlbGVjdG9yKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlcXVpcmVzIENTUyBzZWxlY3RvcnMgdG8gYmUgcHJvdmlkZWQgaW4gMiBmb3JtczogcGFyc2VkIChieSBhIGNvbXBpbGVyKSBhbmQgdGV4dCxcbiAqIHVuLXBhcnNlZCBmb3JtLlxuICpcbiAqIFRoZSBwYXJzZWQgZm9ybSBpcyBuZWVkZWQgZm9yIGVmZmljaWVudCBtYXRjaGluZyBvZiBhIG5vZGUgYWdhaW5zdCBhIGdpdmVuIENTUyBzZWxlY3Rvci5cbiAqIFRoZSB1bi1wYXJzZWQsIHRleHR1YWwgZm9ybSBpcyBuZWVkZWQgZm9yIHN1cHBvcnQgb2YgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZS5cbiAqXG4gKiBIYXZpbmcgYSBDU1Mgc2VsZWN0b3IgaW4gMiBkaWZmZXJlbnQgZm9ybWF0cyBpcyBub3QgaWRlYWwsIGJ1dCBhbHRlcm5hdGl2ZXMgaGF2ZSBldmVuIG1vcmVcbiAqIGRyYXdiYWNrczpcbiAqIC0gaGF2aW5nIG9ubHkgYSB0ZXh0dWFsIGZvcm0gd291bGQgcmVxdWlyZSBydW50aW1lIHBhcnNpbmcgb2YgQ1NTIHNlbGVjdG9ycztcbiAqIC0gd2UgY2FuJ3QgaGF2ZSBvbmx5IGEgcGFyc2VkIGFzIHdlIGNhbid0IHJlLWNvbnN0cnVjdCB0ZXh0dWFsIGZvcm0gZnJvbSBpdCAoYXMgZW50ZXJlZCBieSBhXG4gKiB0ZW1wbGF0ZSBhdXRob3IpLlxuICpcbiAqIEBwYXJhbSBzZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIHBhcnNlZCBDU1Mgc2VsZWN0b3JzXG4gKiBAcGFyYW0gcmF3U2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBDU1Mgc2VsZWN0b3JzIGluIHRoZSByYXcsIHVuLXBhcnNlZCBmb3JtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGVmKHNlbGVjdG9ycz86IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRWaWV3KGdldExWaWV3KCkpW0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmICghY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgY29uc3Qgbm9PZk5vZGVCdWNrZXRzID0gc2VsZWN0b3JzID8gc2VsZWN0b3JzLmxlbmd0aCArIDEgOiAxO1xuICAgIGNvbnN0IHBEYXRhOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHBEYXRhLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBidWNrZXRJbmRleCA9XG4gICAgICAgICAgc2VsZWN0b3JzID8gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISkgOiAwO1xuICAgICAgY29uc3QgbmV4dE5vZGUgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLm5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBEYXRhW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfVxuICAgICAgY29tcG9uZW50Q2hpbGQubmV4dCA9IG51bGw7XG4gICAgICB0YWlsc1tidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcblxuICAgICAgY29tcG9uZW50Q2hpbGQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiBwcm9qZWN0aW9uKCkgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHByb2plY3Rpb24oKSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogKExWaWV3IHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuXG4gIC8vIHJlLWRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0YWJsZSBub2RlcyBpcyBzdG9yZWQgb24gYSBjb21wb25lbnQncyB2aWV3IGxldmVsXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhsVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcbiAgbGV0IHByb2plY3RlZFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlVG9Qcm9qZWN0KSkge1xuICAgIGFwcGVuZENoaWxkKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICB9IGVsc2Uge1xuICAgIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgICBpZiAobm9kZVRvUHJvamVjdC50eXBlID09PSBUTm9kZVR5cGUuUHJvamVjdGlvbikge1xuICAgICAgICAvLyBUaGlzIG5vZGUgaXMgcmUtcHJvamVjdGVkLCBzbyB3ZSBtdXN0IGdvIHVwIHRoZSB0cmVlIHRvIGdldCBpdHMgcHJvamVjdGVkIG5vZGVzLlxuICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpO1xuICAgICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50SG9zdCA9IGN1cnJlbnRDb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICAgICAgICBjb25zdCBmaXJzdFByb2plY3RlZE5vZGUgPSAoY3VycmVudENvbXBvbmVudEhvc3QucHJvamVjdGlvbiBhcyhcbiAgICAgICAgICAgIFROb2RlIHwgbnVsbClbXSlbbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgICAgaWYgKGZpcnN0UHJvamVjdGVkTm9kZSkge1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KGZpcnN0UHJvamVjdGVkTm9kZSkpIHtcbiAgICAgICAgICAgIGFwcGVuZENoaWxkKGZpcnN0UHJvamVjdGVkTm9kZSwgdFByb2plY3Rpb25Ob2RlLCBsVmlldyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHByb2plY3Rpb25Ob2RlU3RhY2tbKytwcm9qZWN0aW9uTm9kZUluZGV4XSA9IG5vZGVUb1Byb2plY3Q7XG4gICAgICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBwcm9qZWN0ZWRWaWV3O1xuXG4gICAgICAgICAgICBub2RlVG9Qcm9qZWN0ID0gZmlyc3RQcm9qZWN0ZWROb2RlO1xuICAgICAgICAgICAgcHJvamVjdGVkVmlldyA9IGN1cnJlbnRDb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gVGhpcyBmbGFnIG11c3QgYmUgc2V0IG5vdyBvciB3ZSB3b24ndCBrbm93IHRoYXQgdGhpcyBub2RlIGlzIHByb2plY3RlZFxuICAgICAgICAvLyBpZiB0aGUgbm9kZXMgYXJlIGluc2VydGVkIGludG8gYSBjb250YWluZXIgbGF0ZXIuXG4gICAgICAgIG5vZGVUb1Byb2plY3QuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc1Byb2plY3RlZDtcbiAgICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShub2RlVG9Qcm9qZWN0LCB0UHJvamVjdGlvbk5vZGUsIGxWaWV3LCBwcm9qZWN0ZWRWaWV3KTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgYXJlIGZpbmlzaGVkIHdpdGggYSBsaXN0IG9mIHJlLXByb2plY3RlZCBub2Rlcywgd2UgbmVlZCB0byBnZXRcbiAgICAgIC8vIGJhY2sgdG8gdGhlIHJvb3QgcHJvamVjdGlvbiBub2RlIHRoYXQgd2FzIHJlLXByb2plY3RlZC5cbiAgICAgIGlmIChub2RlVG9Qcm9qZWN0Lm5leHQgPT09IG51bGwgJiYgcHJvamVjdGVkVmlldyAhPT0gY29tcG9uZW50Vmlld1tQQVJFTlRdICEpIHtcbiAgICAgICAgcHJvamVjdGVkVmlldyA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBMVmlldztcbiAgICAgICAgbm9kZVRvUHJvamVjdCA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICAgIH1cbiAgICAgIG5vZGVUb1Byb2plY3QgPSBub2RlVG9Qcm9qZWN0Lm5leHQ7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4oXG4gICAgbFZpZXc6IExWaWV3LCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSBnZXRGaXJzdFRlbXBsYXRlUGFzcygpO1xuICBpZiAobFZpZXdbVEFJTF0pIHtcbiAgICBsVmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgbFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLiAqL1xuZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX3ByZXZlbnREZWZhdWx0KGU6IEV2ZW50KSB7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3IHtcbiAgd2hpbGUgKGxWaWV3ICYmICEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgbFZpZXcgPSBsVmlld1tQQVJFTlRdICE7XG4gIH1cbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSAhLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuIFRoZXJlIHNob3VsZFxuICogYmUgdmVyeSBsaXR0bGUgcmVhc29uIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiBkaXJlY3RseSBzaW5jZSBhIHByZWZlcnJlZCB3YXkgdG8gZG8gY2hhbmdlXG4gKiBkZXRlY3Rpb24gaXMgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gdGhlIGNvbXBvbmVudCBhbmQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBjYWxsIHRoaXMgbWV0aG9kXG4gKiBhdCBzb21lIGZ1dHVyZSBwb2ludCBpbiB0aW1lLiBUaGlzIGlzIGJlY2F1c2UgYSBzaW5nbGUgdXNlciBhY3Rpb24gb2Z0ZW4gcmVzdWx0cyBpbiBtYW55XG4gKiBjb21wb25lbnRzIGJlaW5nIGludmFsaWRhdGVkIGFuZCBjYWxsaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gZWFjaCBjb21wb25lbnQgc3luY2hyb25vdXNseVxuICogd291bGQgYmUgaW5lZmZpY2llbnQuIEl0IGlzIGJldHRlciB0byB3YWl0IHVudGlsIGFsbCBjb21wb25lbnRzIGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kXG4gKiB0aGVuIHBlcmZvcm0gc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gYWNyb3NzIGFsbCBvZiB0aGUgY29tcG9uZW50c1xuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCkgITtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHZpZXcsIGNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gdmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcblxuICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICBpZiAoaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgfVxuICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyB1cGRhdGUgbW9kZSBwYXNzXG5cbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tWaWV3PFQ+KGhvc3RWaWV3OiBMVmlldywgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuXG4gIHRyeSB7XG4gICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgIGNyZWF0aW9uTW9kZSAmJiBleGVjdXRlVmlld1F1ZXJ5Rm4oaG9zdFZpZXcsIGhvc3RUVmlldywgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAhY3JlYXRpb25Nb2RlICYmIGV4ZWN1dGVWaWV3UXVlcnlGbihob3N0VmlldywgaG9zdFRWaWV3LCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4obFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gIGlmICh2aWV3UXVlcnkpIHtcbiAgICBzZXRDdXJyZW50Vmlld1F1ZXJ5SW5kZXgodFZpZXcudmlld1F1ZXJ5U3RhcnRJbmRleCk7XG4gICAgdmlld1F1ZXJ5KGdldFJlbmRlckZsYWdzKGxWaWV3KSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5cbi8qKlxuICogTWFyayB0aGUgY29tcG9uZW50IGFzIGRpcnR5IChuZWVkaW5nIGNoYW5nZSBkZXRlY3Rpb24pLlxuICpcbiAqIE1hcmtpbmcgYSBjb21wb25lbnQgZGlydHkgd2lsbCBzY2hlZHVsZSBhIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhpc1xuICogY29tcG9uZW50IGF0IHNvbWUgcG9pbnQgaW4gdGhlIGZ1dHVyZS4gTWFya2luZyBhbiBhbHJlYWR5IGRpcnR5XG4gKiBjb21wb25lbnQgYXMgZGlydHkgaXMgYSBub29wLiBPbmx5IG9uZSBvdXRzdGFuZGluZyBjaGFuZ2UgZGV0ZWN0aW9uXG4gKiBjYW4gYmUgc2NoZWR1bGVkIHBlciBjb21wb25lbnQgdHJlZS4gKFR3byBjb21wb25lbnRzIGJvb3RzdHJhcHBlZCB3aXRoXG4gKiBzZXBhcmF0ZSBgcmVuZGVyQ29tcG9uZW50YCB3aWxsIGhhdmUgc2VwYXJhdGUgc2NoZWR1bGVycylcbiAqXG4gKiBXaGVuIHRoZSByb290IGNvbXBvbmVudCBpcyBib290c3RyYXBwZWQgd2l0aCBgcmVuZGVyQ29tcG9uZW50YCwgYSBzY2hlZHVsZXJcbiAqIGNhbiBiZSBwcm92aWRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IENvbXBvbmVudCB0byBtYXJrIGFzIGRpcnR5LlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eTxUPihjb21wb25lbnQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29tcG9uZW50LCAnY29tcG9uZW50Jyk7XG4gIGNvbnN0IHJvb3RWaWV3ID0gbWFya1ZpZXdEaXJ0eShnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChyb290Vmlld1tDT05URVhUXSwgJ3Jvb3RDb250ZXh0IHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gIHNjaGVkdWxlVGljayhyb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIHNpbmdsZSB2YWx1ZSBiaW5kaW5nLlxuICpcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBkaWZmXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBiaW5kPFQ+KHZhbHVlOiBUKTogVHxOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdKys7XG4gIHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3KTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyB0aGUgbmVjZXNzYXJ5IGFtb3VudCBvZiBzbG90cyBmb3IgaG9zdCB2YXJzLlxuICpcbiAqIEBwYXJhbSBjb3VudCBBbW91bnQgb2YgdmFycyB0byBiZSBhbGxvY2F0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jSG9zdFZhcnMoY291bnQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAoIWdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHJldHVybjtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKHRWaWV3LCBnZXRDdXJyZW50RGlyZWN0aXZlRGVmKCkgISwgY291bnQpO1xuICBwcmVmaWxsSG9zdFZhcnModFZpZXcsIGxWaWV3LCBjb3VudCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gIGxldCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcblxuICBpZiAodERhdGFbYmluZGluZ0luZGV4XSA9PSBudWxsKSB7XG4gICAgLy8gMiBpcyB0aGUgaW5kZXggb2YgdGhlIGZpcnN0IHN0YXRpYyBpbnRlcnN0aXRpYWwgdmFsdWUgKGllLiBub3QgcHJlZml4KVxuICAgIGZvciAobGV0IGkgPSAyOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXgrK10gPSB2YWx1ZXNbaV07XG4gICAgfVxuICAgIGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICB9XG5cbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAvLyBDaGVjayBpZiBiaW5kaW5ncyAob2RkIGluZGV4ZXMpIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgrKywgdmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cbiAgbFZpZXdbQklORElOR19JTkRFWF0gPSBiaW5kaW5nSW5kZXg7XG4gIHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCB2YWx1ZXNbMF0sIHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gMV0pO1xuXG4gIGlmICghZGlmZmVyZW50KSB7XG4gICAgcmV0dXJuIE5PX0NIQU5HRTtcbiAgfVxuXG4gIC8vIEJ1aWxkIHRoZSB1cGRhdGVkIGNvbnRlbnRcbiAgbGV0IGNvbnRlbnQgPSB2YWx1ZXNbMF07XG4gIGZvciAobGV0IGkgPSAxOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgY29udGVudCArPSByZW5kZXJTdHJpbmdpZnkodmFsdWVzW2ldKSArIHZhbHVlc1tpICsgMV07XG4gIH1cblxuICByZXR1cm4gY29udGVudDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDEgZXhwcmVzc2lvbi5cbiAqXG4gKiBAcGFyYW0gcHJlZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKiBAcGFyYW0gdjAgdmFsdWUgY2hlY2tlZCBmb3IgY2hhbmdlLlxuICogQHBhcmFtIHN1ZmZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjEocHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGxWaWV3W0JJTkRJTkdfSU5ERVhdKyssIHYwKTtcbiAgc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEpO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSAyO1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBsVmlld1tUVklFV10uZGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIGkwICsgcmVuZGVyU3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIpO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSAzO1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9IGkxO1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgfVxuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIGkwICsgcmVuZGVyU3RyaW5naWZ5KHYxKSArIGkxICsgcmVuZGVyU3RyaW5naWZ5KHYyKSArIGkyICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjMpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNShcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAzXSA9IGkzO1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA2O1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9IGkxO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDJdID0gaTI7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgM10gPSBpMztcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA0XSA9IGk0O1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNztcblxuICAvLyBPbmx5IHNldCBzdGF0aWMgc3RyaW5ncyB0aGUgZmlyc3QgdGltZSAoZGF0YSB3aWxsIGJlIG51bGwgc3Vic2VxdWVudCBydW5zKS5cbiAgY29uc3QgZGF0YSA9IHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCBwcmVmaXgsIHN1ZmZpeCk7XG4gIGlmIChkYXRhKSB7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMV0gPSBpMTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAyXSA9IGkyO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDNdID0gaTM7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgNF0gPSBpNDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA1XSA9IGk1O1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBpNSArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHY2KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDggZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjgoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgaTY6IHN0cmluZywgdjc6IGFueSxcbiAgICBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LCB2NCwgdjUsIHY2LCB2NykgfHwgZGlmZmVyZW50O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA4O1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9IGkxO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDJdID0gaTI7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgM10gPSBpMztcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA0XSA9IGk0O1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDVdID0gaTU7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgNl0gPSBpNjtcbiAgfVxuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIGkwICsgcmVuZGVyU3RyaW5naWZ5KHYxKSArIGkxICsgcmVuZGVyU3RyaW5naWZ5KHYyKSArIGkyICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjMpICsgaTMgKyByZW5kZXJTdHJpbmdpZnkodjQpICsgaTQgKyByZW5kZXJTdHJpbmdpZnkodjUpICsgaTUgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2NikgKyBpNiArIHJlbmRlclN0cmluZ2lmeSh2NykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYmluZGluZyBtZXRhZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIGJpbmRpbmcgYW5kIHN0b3JlcyBpdCBpblxuICogVFZpZXcuZGF0YS4gVGhlc2UgYXJlIGdlbmVyYXRlZCBpbiBvcmRlciB0byBzdXBwb3J0IERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzLlxuICpcbiAqIEVhY2ggYmluZGluZyAvIGludGVycG9sYXRpb24gd2lsbCBoYXZlIG9uZSAoaW5jbHVkaW5nIGF0dHJpYnV0ZSBiaW5kaW5ncylcbiAqIGJlY2F1c2UgYXQgdGhlIHRpbWUgb2YgYmluZGluZywgd2UgZG9uJ3Qga25vdyB0byB3aGljaCBpbnN0cnVjdGlvbiB0aGUgYmluZGluZ1xuICogYmVsb25ncy4gSXQgaXMgYWx3YXlzIHN0b3JlZCBpbiBUVmlldy5kYXRhIGF0IHRoZSBpbmRleCBvZiB0aGUgbGFzdCBiaW5kaW5nXG4gKiB2YWx1ZSBpbiBMVmlldyAoZS5nLiBmb3IgaW50ZXJwb2xhdGlvbjgsIGl0IHdvdWxkIGJlIHN0b3JlZCBhdCB0aGUgaW5kZXggb2ZcbiAqIHRoZSA4dGggdmFsdWUpLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgTFZpZXcgdGhhdCBjb250YWlucyB0aGUgY3VycmVudCBiaW5kaW5nIGluZGV4LlxuICogQHBhcmFtIHByZWZpeCBUaGUgc3RhdGljIHByZWZpeCBzdHJpbmdcbiAqIEBwYXJhbSBzdWZmaXggVGhlIHN0YXRpYyBzdWZmaXggc3RyaW5nXG4gKlxuICogQHJldHVybnMgTmV3bHkgY3JlYXRlZCBiaW5kaW5nIG1ldGFkYXRhIHN0cmluZyBmb3IgdGhpcyBiaW5kaW5nIG9yIG51bGxcbiAqL1xuZnVuY3Rpb24gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXc6IExWaWV3LCBwcmVmaXggPSAnJywgc3VmZml4ID0gJycpOiBzdHJpbmd8bnVsbCB7XG4gIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gIGNvbnN0IGxhc3RCaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSAtIDE7XG4gIGNvbnN0IHZhbHVlID0gSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBwcmVmaXggKyBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHN1ZmZpeDtcblxuICByZXR1cm4gdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gPT0gbnVsbCA/ICh0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9IHZhbHVlKSA6IG51bGw7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICAgIHRWaWV3LmJsdWVwcmludFthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gIH1cbiAgbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBsb2NhbCByZWZlcmVuY2UgZnJvbSB0aGUgY3VycmVudCBjb250ZXh0Vmlld0RhdGEuXG4gKlxuICogSWYgdGhlIHJlZmVyZW5jZSB0byByZXRyaWV2ZSBpcyBpbiBhIHBhcmVudCB2aWV3LCB0aGlzIGluc3RydWN0aW9uIGlzIHVzZWQgaW4gY29uanVuY3Rpb25cbiAqIHdpdGggYSBuZXh0Q29udGV4dCgpIGNhbGwsIHdoaWNoIHdhbGtzIHVwIHRoZSB0cmVlIGFuZCB1cGRhdGVzIHRoZSBjb250ZXh0Vmlld0RhdGEgaW5zdGFuY2UuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgbG9jYWwgcmVmIGluIGNvbnRleHRWaWV3RGF0YS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZmVyZW5jZTxUPihpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IGNvbnRleHRMVmlldyA9IGdldENvbnRleHRMVmlldygpO1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGNvbnRleHRMVmlldywgaW5kZXgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZFF1ZXJ5TGlzdDxUPihxdWVyeUxpc3RJZHg6IG51bWJlcik6IFF1ZXJ5TGlzdDxUPiB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGxWaWV3W0NPTlRFTlRfUVVFUklFU10sICdDb250ZW50IFF1ZXJ5TGlzdCBhcnJheSBzaG91bGQgYmUgZGVmaW5lZCBpZiByZWFkaW5nIGEgcXVlcnkuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlld1tDT05URU5UX1FVRVJJRVNdICEsIHF1ZXJ5TGlzdElkeCk7XG5cbiAgcmV0dXJuIGxWaWV3W0NPTlRFTlRfUVVFUklFU10gIVtxdWVyeUxpc3RJZHhdO1xufVxuXG4vKiogUmV0cmlldmVzIGEgdmFsdWUgZnJvbSBjdXJyZW50IGB2aWV3RGF0YWAuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZDxUPihpbmRleDogbnVtYmVyKTogVCB7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oZ2V0TFZpZXcoKSwgaW5kZXgpO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBESVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBgZGlyZWN0aXZlSW5qZWN0YCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBkaXJlY3RpdmUsIGNvbXBvbmVudCBhbmQgcGlwZSBmYWN0b3JpZXMuXG4gKiAgQWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgbm9kZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIHR5cGUgb3IgdG9rZW4gdG8gaW5qZWN0XG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHRva2VuID0gcmVzb2x2ZUZvcndhcmRSZWYodG9rZW4pO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBnZXRMVmlldygpLCB0b2tlbiwgZmxhZ3MpO1xufVxuXG4vKipcbiAqIEZhY2FkZSBmb3IgdGhlIGF0dHJpYnV0ZSBpbmplY3Rpb24gZnJvbSBESS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIHJldHVybiBpbmplY3RBdHRyaWJ1dGVJbXBsKGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpLCBhdHRyTmFtZVRvSW5qZWN0KTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBRdWVyeUxpc3QsIGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRlbnQgcXVlcnksIGZvciBsYXRlciByZWZyZXNoIChwYXJ0IG9mIGEgdmlld1xuICogcmVmcmVzaCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckNvbnRlbnRRdWVyeTxRPihcbiAgICBxdWVyeUxpc3Q6IFF1ZXJ5TGlzdDxRPiwgY3VycmVudERpcmVjdGl2ZUluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3Qgdmlld0RhdGEgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IHZpZXdEYXRhW1RWSUVXXTtcbiAgY29uc3Qgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCA9XG4gICAgICAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSB8fCAodmlld0RhdGFbQ09OVEVOVF9RVUVSSUVTXSA9IFtdKSkucHVzaChxdWVyeUxpc3QpO1xuICBpZiAoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSkge1xuICAgIGNvbnN0IHRWaWV3Q29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcyB8fCAodFZpZXcuY29udGVudFF1ZXJpZXMgPSBbXSk7XG4gICAgY29uc3QgbGFzdFNhdmVkRGlyZWN0aXZlSW5kZXggPVxuICAgICAgICB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggPyB0Vmlldy5jb250ZW50UXVlcmllc1t0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGggLSAyXSA6IC0xO1xuICAgIGlmIChjdXJyZW50RGlyZWN0aXZlSW5kZXggIT09IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4KSB7XG4gICAgICB0Vmlld0NvbnRlbnRRdWVyaWVzLnB1c2goY3VycmVudERpcmVjdGl2ZUluZGV4LCBzYXZlZENvbnRlbnRRdWVyaWVzTGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5cbmZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZTogVE5vZGUgfCBudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICAvLyBJZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkLlxuICBpZiAodE5vZGUpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLklucHV0KTtcbiAgICB9XG4gICAgcmV0dXJuIHROb2RlLmlucHV0cztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIGN1cnJlbnQgT3BhcXVlVmlld1N0YXRlIGluc3RhbmNlLlxuICpcbiAqIFVzZWQgaW4gY29uanVuY3Rpb24gd2l0aCB0aGUgcmVzdG9yZVZpZXcoKSBpbnN0cnVjdGlvbiB0byBzYXZlIGEgc25hcHNob3RcbiAqIG9mIHRoZSBjdXJyZW50IHZpZXcgYW5kIHJlc3RvcmUgaXQgd2hlbiBsaXN0ZW5lcnMgYXJlIGludm9rZWQuIFRoaXMgYWxsb3dzXG4gKiB3YWxraW5nIHRoZSBkZWNsYXJhdGlvbiB2aWV3IHRyZWUgaW4gbGlzdGVuZXJzIHRvIGdldCB2YXJzIGZyb20gcGFyZW50IHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q3VycmVudFZpZXcoKTogT3BhcXVlVmlld1N0YXRlIHtcbiAgcmV0dXJuIGdldExWaWV3KCkgYXMgYW55IGFzIE9wYXF1ZVZpZXdTdGF0ZTtcbn1cblxuZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3KTogYW55W10ge1xuICByZXR1cm4gdmlld1tUVklFV10uY2xlYW51cCB8fCAodmlld1tUVklFV10uY2xlYW51cCA9IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5mdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlcjMge1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGxWaWV3W3ROb2RlLmluZGV4XSBhcyBMVmlldztcbiAgcmV0dXJuIGNvbXBvbmVudExWaWV3W1JFTkRFUkVSXTtcbn1cbiJdfQ==