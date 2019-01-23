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
import { OnChangesDirectiveWrapper, isOnChangesDirectiveWrapper, recordChange, unwrapOnChangesDirectiveWrapper } from './onchanges_util';
import { decreaseElementDepthCount, enterView, getBindingsEnabled, getCheckNoChangesMode, getContextLView, getCurrentDirectiveDef, getElementDepthCount, getFirstTemplatePass, getIsParent, getLView, getPreviousOrParentTNode, increaseElementDepthCount, isCreationMode, leaveView, nextContextImpl, resetComponentState, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setFirstTemplatePass, setIsParent, setPreviousOrParentTNode } from './state';
import { getInitialClassNameValue, initializeStaticContext as initializeStaticStylingContext, patchContextWithStaticAttrs, renderInitialStylesAndClasses, renderStyling, updateClassProp as updateElementClassProp, updateContextWithBindings, updateStyleProp as updateElementStyleProp, updateStylingMap } from './styling/class_and_style_bindings';
import { BoundPlayerFactory } from './styling/player_factory';
import { createEmptyStylingContext, getStylingContext, hasClassInput, hasStyling, isAnimationProp } from './styling/util';
import { NO_CHANGE } from './tokens';
import { findComponentView, getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getRootContext, getRootView, getTNode, isComponent, isComponentDef, isContentQueryHost, loadInternal, readElementValue, readPatchedLView, renderStringify } from './util';
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
                    instruction(2 /* Update */, unwrapOnChangesDirectiveWrapper(viewData[currentDirectiveIndex]), currentElementIndex);
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
        lView[QUERIES] = currentQueries.addNode(previousOrParentTNode);
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
        data: blueprint.slice(),
        childIndex: -1,
        bindingStartIndex: bindingStartIndex,
        expandoStartIndex: initialViewLength,
        expandoInstructions: null,
        firstTemplatePass: true,
        changesHooks: null,
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
            // Subscribe to listeners for each output, and setup clean up for each.
            for (var i = 0; i < propsLength;) {
                var directiveIndex = props[i++];
                var minifiedName = props[i++];
                var declaredName = props[i++];
                ngDevMode && assertDataInRange(lView, directiveIndex);
                var directive = unwrapOnChangesDirectiveWrapper(lView[directiveIndex]);
                var output = directive[minifiedName];
                if (ngDevMode && !isObservable(output)) {
                    throw new Error("@Output " + minifiedName + " not initialized in '" + directive.constructor.name + "'.");
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
        lView[QUERIES] = currentQueries.addNode(previousOrParentTNode);
    }
    registerPostOrderHooks(getLView()[TVIEW], previousOrParentTNode);
    decreaseElementDepthCount();
    // this is fired at the end of elementEnd because ALL of the stylingBindings code
    // (for directives and the template) have now executed which means the styling
    // context can be instantiated properly.
    if (hasClassInput(previousOrParentTNode)) {
        var stylingContext = getStylingContext(previousOrParentTNode.index, lView);
        setInputsForProperty(lView, previousOrParentTNode.inputs, 'class', getInitialClassNameValue(stylingContext));
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
 */
export function elementAttribute(index, name, value, sanitizer) {
    if (value !== NO_CHANGE) {
        ngDevMode && validateAttribute(name);
        var lView = getLView();
        var renderer = lView[RENDERER];
        var element_1 = getNativeByIndex(index, lView);
        if (value == null) {
            ngDevMode && ngDevMode.rendererRemoveAttribute++;
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element_1, name) :
                element_1.removeAttribute(name);
        }
        else {
            ngDevMode && ngDevMode.rendererSetAttribute++;
            var tNode = getTNode(index, lView);
            var strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tNode.tagName || '', name);
            isProceduralRenderer(renderer) ? renderer.setAttribute(element_1, name, strValue) :
                element_1.setAttribute(name, strValue);
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
        setInputsForProperty(lView, inputData, propName, value);
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
 * @param publicName public binding name. (This is the `<div [publicName]=value>`)
 * @param value Value to set.
 */
function setInputsForProperty(lView, inputAliases, publicName, value) {
    var inputs = inputAliases[publicName];
    for (var i = 0; i < inputs.length;) {
        var directiveIndex = inputs[i++];
        var privateName = inputs[i++];
        var declaredName = inputs[i++];
        ngDevMode && assertDataInRange(lView, directiveIndex);
        recordChangeAndUpdateProperty(lView[directiveIndex], declaredName, privateName, value);
    }
}
function setNgReflectProperties(lView, element, type, inputs, value) {
    var _a;
    for (var i = 0; i < inputs.length;) {
        var directiveIndex = inputs[i++];
        var privateName = inputs[i++];
        var declaredName = inputs[i++];
        var renderer = lView[RENDERER];
        var attrName = normalizeDebugBindingName(privateName);
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
            var publicToMinifiedNames = isInput ? directiveDef.inputs : directiveDef.outputs;
            var publicToDeclaredNames = isInput ? directiveDef.declaredInputs : null;
            for (var publicName in publicToMinifiedNames) {
                if (publicToMinifiedNames.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    var minifiedName = publicToMinifiedNames[publicName];
                    var declaredName = publicToDeclaredNames ? publicToDeclaredNames[publicName] : minifiedName;
                    var aliases = propStore.hasOwnProperty(publicName) ?
                        propStore[publicName] :
                        propStore[publicName] = [];
                    aliases.push(i, minifiedName, declaredName);
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
        setInputsForProperty(lView, tNode.inputs, 'class', classInputVal);
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
        var directive = unwrapOnChangesDirectiveWrapper(viewData[i]);
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
function postProcessDirective(lView, directive, def, directiveDefIdx) {
    if (def.onChanges) {
        // We have onChanges, wrap it so that we can track changes.
        lView[directiveDefIdx] = new OnChangesDirectiveWrapper(lView[directiveDefIdx]);
    }
    var previousOrParentTNode = getPreviousOrParentTNode();
    postProcessBaseDirective(lView, previousOrParentTNode, directive, def);
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(lView, directiveDefIdx, def, previousOrParentTNode);
    }
    if (def.contentQueries) {
        def.contentQueries(directiveDefIdx);
    }
    if (isComponentDef(def)) {
        var componentView = getComponentViewByIndex(previousOrParentTNode.index, lView);
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
function setInputsFromAttrs(lView, directiveIndex, def, tNode) {
    var initialInputData = tNode.initialInputs;
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, def, tNode);
    }
    var initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        var directiveOrWrappedDirective = lView[directiveIndex];
        for (var i = 0; i < initialInputs.length;) {
            var privateName = initialInputs[i++];
            var declaredName = initialInputs[i++];
            var attrValue = initialInputs[i++];
            recordChangeAndUpdateProperty(directiveOrWrappedDirective, declaredName, privateName, attrValue);
        }
    }
}
/**
 * Checks to see if the instanced passed as `directiveOrWrappedDirective` is wrapped in {@link
 * OnChangesDirectiveWrapper} or not.
 * If it is, it will update the related {@link SimpleChanges} object with the change to signal
 * `ngOnChanges` hook
 * should fire, then it will unwrap the instance. After that, it will set the property with the key
 * provided
 * in `privateName` on the instance with the passed value.
 * @param directiveOrWrappedDirective The directive instance or a directive instance wrapped in
 * {@link OnChangesDirectiveWrapper}
 * @param declaredName The original, declared name of the property to update.
 * @param privateName The private, possibly minified name of the property to update.
 * @param value The value to update the property with.
 */
function recordChangeAndUpdateProperty(directiveOrWrappedDirective, declaredName, privateName, value) {
    var instance;
    if (isOnChangesDirectiveWrapper(directiveOrWrappedDirective)) {
        instance = unwrapOnChangesDirectiveWrapper(directiveOrWrappedDirective);
        recordChange(directiveOrWrappedDirective, declaredName, value);
    }
    else {
        instance = directiveOrWrappedDirective;
    }
    instance[privateName] = value;
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
function generateInitialInputs(directiveIndex, directiveDef, tNode) {
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
        var privateName = directiveDef.inputs[attrName];
        var declaredName = directiveDef.declaredInputs[attrName];
        var attrValue = attrs[i + 1];
        if (privateName !== undefined) {
            var inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(privateName, declaredName, attrValue);
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
    var viewQuery = hostTView.viewQuery;
    try {
        namespaceHTML();
        createViewQuery(viewQuery, hostView, component);
        templateFn(getRenderFlags(hostView), component);
        refreshDescendantViews(hostView);
        updateViewQuery(viewQuery, hostView, component);
    }
    finally {
        leaveView(oldView);
    }
}
function createViewQuery(viewQuery, view, component) {
    if (viewQuery && isCreationMode(view)) {
        viewQuery(1 /* Create */, component);
    }
}
function updateViewQuery(viewQuery, view, component) {
    if (viewQuery && !isCreationMode(view)) {
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
    return bindingUpdated(lView, lView[BINDING_INDEX]++, value) ? value : NO_CHANGE;
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
    var bindingIndex = lView[BINDING_INDEX];
    for (var i = 1; i < values.length; i += 2) {
        // Check if bindings (odd indexes) have changed
        bindingUpdated(lView, bindingIndex++, values[i]) && (different = true);
    }
    lView[BINDING_INDEX] = bindingIndex;
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
    var different = bindingUpdated(lView, lView[BINDING_INDEX], v0);
    lView[BINDING_INDEX] += 1;
    return different ? prefix + renderStringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var lView = getLView();
    var different = bindingUpdated2(lView, lView[BINDING_INDEX], v0, v1);
    lView[BINDING_INDEX] += 2;
    return different ? prefix + renderStringify(v0) + i0 + renderStringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var lView = getLView();
    var different = bindingUpdated3(lView, lView[BINDING_INDEX], v0, v1, v2);
    lView[BINDING_INDEX] += 3;
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var lView = getLView();
    var different = bindingUpdated4(lView, lView[BINDING_INDEX], v0, v1, v2, v3);
    lView[BINDING_INDEX] += 4;
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
    return different ?
        prefix + renderStringify(v0) + i0 + renderStringify(v1) + i1 + renderStringify(v2) + i2 +
            renderStringify(v3) + i3 + renderStringify(v4) + i4 + renderStringify(v5) + i5 +
            renderStringify(v6) + i6 + renderStringify(v7) + suffix :
        NO_CHANGE;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFdBQVcsRUFBMkIsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHakYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdHLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekYsT0FBTyxFQUFDLGVBQWUsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzdGLE9BQU8sRUFBQyxlQUFlLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsOEJBQThCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkksT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDdEcs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Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxjQUFjO0lBQzVCLE9BQU8sUUFBUSxFQUE0QixDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFXO0lBQzdCLHFGQUFxRjtJQUNyRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBVztJQUNsQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELElBQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFVLENBQUM7SUFDbkQsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHt2YWxpZGF0ZUF0dHJpYnV0ZSwgdmFsaWRhdGVQcm9wZXJ0eX0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7U3R5bGVTYW5pdGl6ZUZufSBmcm9tICcuLi9zYW5pdGl6YXRpb24vc3R5bGVfc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7aXNPYnNlcnZhYmxlfSBmcm9tICcuLi91dGlsL2xhbmcnO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vdXRpbC9uZ19yZWZsZWN0JztcblxuaW1wb3J0IHthc3NlcnRIYXNQYXJlbnQsIGFzc2VydFByZXZpb3VzSXNQYXJlbnR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YmluZGluZ1VwZGF0ZWQsIGJpbmRpbmdVcGRhdGVkMiwgYmluZGluZ1VwZGF0ZWQzLCBiaW5kaW5nVXBkYXRlZDR9IGZyb20gJy4vYmluZGluZ3MnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGEsIGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlfSBmcm9tICcuL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUsIGluamVjdEF0dHJpYnV0ZUltcGx9IGZyb20gJy4vZGknO1xuaW1wb3J0IHt0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUhvb2tzLCBleGVjdXRlSW5pdEhvb2tzLCByZWdpc3RlclBvc3RPcmRlckhvb2tzLCByZWdpc3RlclByZU9yZGVySG9va3N9IGZyb20gJy4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIExDb250YWluZXIsIFZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRRdWVyeSwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFLCBOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL2ludGVyZmFjZXMvcGxheWVyJztcbmltcG9ydCB7Q3NzU2VsZWN0b3JMaXN0LCBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRX0gZnJvbSAnLi9pbnRlcmZhY2VzL3Byb2plY3Rpb24nO1xuaW1wb3J0IHtMUXVlcmllc30gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7R2xvYmFsVGFyZ2V0UmVzb2x2ZXIsIFByb2NlZHVyYWxSZW5kZXJlcjMsIFJDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0xFQU5VUCwgQ09OVEFJTkVSX0lOREVYLCBDT05URU5UX1FVRVJJRVMsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgT3BhcXVlVmlld1N0YXRlLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBUQUlMLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthcHBlbmRDaGlsZCwgYXBwZW5kUHJvamVjdGVkTm9kZSwgY3JlYXRlVGV4dE5vZGUsIGdldExWaWV3Q2hpbGQsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCwgbWF0Y2hpbmdTZWxlY3RvckluZGV4fSBmcm9tICcuL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge09uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIsIGlzT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlciwgcmVjb3JkQ2hhbmdlLCB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyfSBmcm9tICcuL29uY2hhbmdlc191dGlsJztcbmltcG9ydCB7ZGVjcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q29udGV4dExWaWV3LCBnZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBnZXRFbGVtZW50RGVwdGhDb3VudCwgZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBpbmNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBpc0NyZWF0aW9uTW9kZSwgbGVhdmVWaWV3LCBuZXh0Q29udGV4dEltcGwsIHJlc2V0Q29tcG9uZW50U3RhdGUsIHNldEJpbmRpbmdSb290LCBzZXRDaGVja05vQ2hhbmdlc01vZGUsIHNldEN1cnJlbnREaXJlY3RpdmVEZWYsIHNldEZpcnN0VGVtcGxhdGVQYXNzLCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7Z2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlLCBpbml0aWFsaXplU3RhdGljQ29udGV4dCBhcyBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQsIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycywgcmVuZGVySW5pdGlhbFN0eWxlc0FuZENsYXNzZXMsIHJlbmRlclN0eWxpbmcsIHVwZGF0ZUNsYXNzUHJvcCBhcyB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wLCB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzLCB1cGRhdGVTdHlsZVByb3AgYXMgdXBkYXRlRWxlbWVudFN0eWxlUHJvcCwgdXBkYXRlU3R5bGluZ01hcH0gZnJvbSAnLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge0JvdW5kUGxheWVyRmFjdG9yeX0gZnJvbSAnLi9zdHlsaW5nL3BsYXllcl9mYWN0b3J5JztcbmltcG9ydCB7Y3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCwgZ2V0U3R5bGluZ0NvbnRleHQsIGhhc0NsYXNzSW5wdXQsIGhhc1N0eWxpbmcsIGlzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4vdG9rZW5zJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRSb290Q29udGV4dCwgZ2V0Um9vdFZpZXcsIGdldFROb2RlLCBpc0NvbXBvbmVudCwgaXNDb21wb25lbnREZWYsIGlzQ29udGVudFF1ZXJ5SG9zdCwgbG9hZEludGVybmFsLCByZWFkRWxlbWVudFZhbHVlLCByZWFkUGF0Y2hlZExWaWV3LCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBlbWJlZGRlZCB2aWV3cywgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0XG4gKiBiaW5kaW5ncywgcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MoZmFsc2UpO1xuXG4gIC8vIElmIHRoaXMgaXMgYSBjcmVhdGlvbiBwYXNzLCB3ZSBzaG91bGQgbm90IGNhbGwgbGlmZWN5Y2xlIGhvb2tzIG9yIGV2YWx1YXRlIGJpbmRpbmdzLlxuICAvLyBUaGlzIHdpbGwgYmUgZG9uZSBpbiB0aGUgdXBkYXRlIHBhc3MuXG4gIGlmICghaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgICBleGVjdXRlSW5pdEhvb2tzKGxWaWV3LCB0VmlldywgY2hlY2tOb0NoYW5nZXNNb2RlKTtcblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gICAgZXhlY3V0ZUhvb2tzKGxWaWV3LCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUpO1xuXG4gICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICBsZXQgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gLTE7XG4gICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9uID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBtZWFuIHRoYXQgd2UgYXJlIHN0YXJ0aW5nIG5ldyBFWFBBTkRPIGJsb2NrIGFuZCBuZWVkIHRvIHVwZGF0ZVxuICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICBjdXJyZW50RWxlbWVudEluZGV4ID0gLWluc3RydWN0aW9uO1xuICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICBjb25zdCBwcm92aWRlckNvdW50ID0gKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbKytpXSBhcyBudW1iZXIpO1xuICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgIC8vICh0byBnZXQgdG8gdGhlIG5leHQgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKS5cbiAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgaWYgKGluc3RydWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIGluc3RydWN0aW9uKFxuICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGUsIHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIodmlld0RhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XSksXG4gICAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNvbnRlbnQgcXVlcmllcyBmb3IgYWxsIGRpcmVjdGl2ZXMgaW4gdGhlIGdpdmVuIHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllc1JlZnJlc2ggIShcbiAgICAgICAgICBkaXJlY3RpdmVEZWZJZHggLSBIRUFERVJfT0ZGU0VULCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXcgfCBudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncyxcbiAgICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzIHwgbnVsbCwgcmVuZGVyZXI/OiBSZW5kZXJlcjMgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwsIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuUnVuSW5pdCB8XG4gICAgICBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLCAnUmVuZGVyZXJGYWN0b3J5IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSXSwgJ1JlbmRlcmVyIGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbU0FOSVRJWkVSXSB8fCBudWxsICE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZcbiAgICBUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oYWRqdXN0ZWRJbmRleCwgbFZpZXcubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHdpdGggbnVsbGApO1xuICBsVmlld1thZGp1c3RlZEluZGV4XSA9IG5hdGl2ZTtcblxuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIC8vIFRPRE8obWlza28pOiBSZWZhY3RvciBjcmVhdGVUTm9kZSBzbyB0aGF0IGl0IGRvZXMgbm90IGRlcGVuZCBvbiBMVmlldy5cbiAgICB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVUTm9kZShsVmlldywgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMsIG51bGwpO1xuICB9XG5cbiAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gIC8vIFdlIG5lZWQgdGhpcyBldmVuIGlmIHROb2RlIGV4aXN0cywgb3RoZXJ3aXNlIHdlIG1pZ2h0IGVuZCB1cCBwb2ludGluZyB0byB1bmV4aXN0aW5nIHROb2RlcyB3aGVuXG4gIC8vIHdlIHVzZSBpMThuIChlc3BlY2lhbGx5IHdpdGggSUNVIGV4cHJlc3Npb25zIHRoYXQgdXBkYXRlIHRoZSBET00gZHVyaW5nIHRoZSB1cGRhdGUgcGhhc2UpLlxuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmXG4gICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09IG51bGwpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cblxuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld05vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXcpIHtcbiAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICBpZiAodmlld1tUVklFV10ubm9kZSA9PSBudWxsKSB7XG4gICAgdmlld1tUVklFV10ubm9kZSA9IGNyZWF0ZVROb2RlKHZpZXcsIFROb2RlVHlwZS5WaWV3LCBpbmRleCwgbnVsbCwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICB9XG5cbiAgcmV0dXJuIHZpZXdbSE9TVF9OT0RFXSA9IHZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgICB2aWV3LnB1c2gobnVsbCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3RWaWV3OiBMVmlldyB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXcge1xuICBpZiAoaG9zdFZpZXcgPT0gbnVsbCkge1xuICAgIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYSByb290IHZpZXcgc28gaXQncyBwb3NzaWJsZSB0byBsb29rIHVwIHRoZSBob3N0IGVsZW1lbnQgdGhyb3VnaCBpdHMgaW5kZXhcbiAgICBjb25zdCBob3N0TFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbnVsbCwgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCB7fSxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290LCBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIpO1xuICAgIGVudGVyVmlldyhob3N0TFZpZXcsIG51bGwpOyAgLy8gU1VTUEVDVCEgd2h5IGRvIHdlIG5lZWQgdG8gZW50ZXIgdGhlIFZpZXc/XG5cbiAgICBjb25zdCBjb21wb25lbnRUVmlldyA9XG4gICAgICAgIGdldE9yQ3JlYXRlVFZpZXcodGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwsIG51bGwpO1xuICAgIGhvc3RWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIGhvc3RMVmlldywgY29tcG9uZW50VFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LFxuICAgICAgICByZW5kZXJlciwgc2FuaXRpemVyKTtcbiAgICBob3N0Vmlld1tIT1NUX05PREVdID0gY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsKTtcbiAgfVxuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZUZuKTtcbiAgcmV0dXJuIGhvc3RWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHF1ZXJpZXM6IExRdWVyaWVzIHwgbnVsbCxcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEpO1xuXG4gIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoZGVjbGFyYXRpb25WaWV3LCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjcmVhdGVWaWV3Tm9kZSgtMSwgbFZpZXcpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lm5vZGUgIS5pbmplY3RvckluZGV4ID0gaW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIHNldElzUGFyZW50KF9pc1BhcmVudCk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPih2aWV3VG9SZW5kZXI6IExWaWV3LCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBsZXQgb2xkVmlldzogTFZpZXc7XG4gIGlmICh2aWV3VG9SZW5kZXJbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KGdldFJvb3RDb250ZXh0KHZpZXdUb1JlbmRlcikpO1xuICB9IGVsc2Uge1xuICAgIHRyeSB7XG4gICAgICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEpO1xuXG4gICAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW0hPU1RfTk9ERV0pO1xuICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgdFZpZXcudGVtcGxhdGUgIShnZXRSZW5kZXJGbGFncyh2aWV3VG9SZW5kZXIpLCBjb250ZXh0KTtcbiAgICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAgIC8vIG9mZiBmaXJzdFRlbXBsYXRlUGFzcy4gSWYgd2UgZG9uJ3Qgc2V0IGl0IGhlcmUsIGluc3RhbmNlcyB3aWxsIHBlcmZvcm0gZGlyZWN0aXZlXG4gICAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICAgIHZpZXdUb1JlbmRlcltUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgICAgIHNldEZpcnN0VGVtcGxhdGVQYXNzKGZhbHNlKTtcblxuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyh2aWV3VG9SZW5kZXIpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhKTtcbiAgICAgIHNldElzUGFyZW50KF9pc1BhcmVudCk7XG4gICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgY29udGV4dCBhdCB0aGUgbGV2ZWwgc3BlY2lmaWVkIGFuZCBzYXZlcyBpdCBhcyB0aGUgZ2xvYmFsLCBjb250ZXh0Vmlld0RhdGEuXG4gKiBXaWxsIGdldCB0aGUgbmV4dCBsZXZlbCB1cCBpZiBsZXZlbCBpcyBub3Qgc3BlY2lmaWVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCB0byBzYXZlIGNvbnRleHRzIG9mIHBhcmVudCB2aWV3cyBzbyB0aGV5IGNhbiBiZSBib3VuZCBpbiBlbWJlZGRlZCB2aWV3cywgb3JcbiAqIGluIGNvbmp1bmN0aW9uIHdpdGggcmVmZXJlbmNlKCkgdG8gYmluZCBhIHJlZiBmcm9tIGEgcGFyZW50IHZpZXcuXG4gKlxuICogQHBhcmFtIGxldmVsIFRoZSByZWxhdGl2ZSBsZXZlbCBvZiB0aGUgdmlldyBmcm9tIHdoaWNoIHRvIGdyYWIgY29udGV4dCBjb21wYXJlZCB0byBjb250ZXh0VmV3RGF0YVxuICogQHJldHVybnMgY29udGV4dFxuICovXG5leHBvcnQgZnVuY3Rpb24gbmV4dENvbnRleHQ8VCA9IGFueT4obGV2ZWw6IG51bWJlciA9IDEpOiBUIHtcbiAgcmV0dXJuIG5leHRDb250ZXh0SW1wbChsZXZlbCk7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgaG9zdFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCB0ZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gaG9zdFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCBjcmVhdGlvbk1vZGVJc0FjdGl2ZSA9IGlzQ3JlYXRpb25Nb2RlKGhvc3RWaWV3KTtcbiAgdHJ5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG5cbiAgICBpZiAoY3JlYXRpb25Nb2RlSXNBY3RpdmUpIHtcbiAgICAgIC8vIGNyZWF0aW9uIG1vZGUgcGFzc1xuICAgICAgaWYgKHRlbXBsYXRlRm4pIHtcbiAgICAgICAgbmFtZXNwYWNlSFRNTCgpO1xuICAgICAgICB0ZW1wbGF0ZUZuKFJlbmRlckZsYWdzLkNyZWF0ZSwgY29udGV4dCAhKTtcbiAgICAgIH1cblxuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0Vmlldyk7XG4gICAgICBob3N0Vmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcbiAgICB0ZW1wbGF0ZUZuICYmIHRlbXBsYXRlRm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0ICEpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIFVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5LlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXcpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIDogUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBOYW1lc3BhY2Vcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcywgY2xhc3NlcywgYW5kIHN0eWxlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTVxuICogICAgICAgICAgICAgIGVsZW1lbnQgb24gY3JlYXRpb24uIFVzZSBbQXR0cmlidXRlTWFya2VyXSB0byBkZW5vdGUgdGhlIG1lYW5pbmcgb2YgdGhpcyBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgZWxlbWVudFN0YXJ0KGluZGV4LCBuYW1lLCBhdHRycywgbG9jYWxSZWZzKTtcbiAgZWxlbWVudEVuZCgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBsb2dpY2FsIGNvbnRhaW5lciBmb3Igb3RoZXIgbm9kZXMgKDxuZy1jb250YWluZXI+KSBiYWNrZWQgYnkgYSBjb21tZW50IG5vZGUgaW4gdGhlIERPTS5cbiAqIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50Q29udGFpbmVyRW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgdGFnTmFtZSA9ICduZy1jb250YWluZXInO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IG5hdGl2ZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gdGFnTmFtZSA6ICcnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlLCB0YWdOYW1lLCBhdHRycyB8fCBudWxsKTtcblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Q29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG5cbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHtcbiAgICAvLyBpdCdzIGltcG9ydGFudCB0byBvbmx5IHByZXBhcmUgc3R5bGluZy1yZWxhdGVkIGRhdGFzdHJ1Y3R1cmVzIG9uY2UgZm9yIGEgZ2l2ZW5cbiAgICAvLyB0Tm9kZSBhbmQgbm90IGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEFsc28sIHRoZSBzdHlsaW5nIGNvZGUgaXMgZGVzaWduZWRcbiAgICAvLyB0byBiZSBwYXRjaGVkIGFuZCBjb25zdHJ1Y3RlZCBhdCB2YXJpb3VzIHBvaW50cywgYnV0IG9ubHkgdXAgdW50aWwgdGhlIGZpcnN0IGVsZW1lbnRcbiAgICAvLyBpcyBjcmVhdGVkLiBUaGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgaXMgbG9ja2VkIGFuZCBjYW4gb25seSBiZSBpbnN0YW50aWF0ZWQgZm9yIGVhY2hcbiAgICAvLyBzdWNjZXNzaXZlIGVsZW1lbnQgdGhhdCBpcyBjcmVhdGVkLlxuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiAhdE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmIGhhc1N0eWxpbmcoYXR0cnMpKSB7XG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICAgIH1cbiAgICBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGdldEVsZW1lbnREZXB0aENvdW50KCkgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIGlmIGEgZGlyZWN0aXZlIGNvbnRhaW5zIGEgaG9zdCBiaW5kaW5nIGZvciBcImNsYXNzXCIgdGhlbiBhbGwgY2xhc3MtYmFzZWQgZGF0YSB3aWxsXG4gIC8vIGZsb3cgdGhyb3VnaCB0aGF0IChleGNlcHQgZm9yIGBbY2xhc3MucHJvcF1gIGJpbmRpbmdzKS4gVGhpcyBhbHNvIGluY2x1ZGVzIGluaXRpYWxcbiAgLy8gc3RhdGljIGNsYXNzIHZhbHVlcyBhcyB3ZWxsLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIG1hcC1iYXNlZCBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3b3JrIGZvciBtdWx0aXBsZSBkaXJlY3RpdmVzLilcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKTtcbiAgICBpZiAoaW5wdXREYXRhICYmIGlucHV0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgd2hlbiBhIGNsYXNzIGRpcmVjdGl2ZSBpcyBwcmVzZW50IHNpbmNlXG4gIC8vIGl0IHdpbGwgdGFrZSB0aGF0IG92ZXIgZm9yIHVzICh0aGlzIHdpbGwgYmUgcmVtb3ZlZCBvbmNlICNGVy04ODIgaXMgaW4pLlxuICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgPT09IDApIHtcbiAgICByZW5kZXJJbml0aWFsU3R5bGVzQW5kQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgbFZpZXdbUkVOREVSRVJdKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IGdldExWaWV3KClbUkVOREVSRVJdO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBUTm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuXG4gICAgcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgICAgIHRWaWV3LCBsVmlldywgZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXcsIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpLFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBEdXJpbmcgZmlyc3QgdGVtcGxhdGUgcGFzcywgcXVlcmllcyBhcmUgY3JlYXRlZCBvciBjbG9uZWQgd2hlbiBmaXJzdCByZXF1ZXN0ZWRcbiAgICAvLyB1c2luZyBgZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllc2AuIEZvciBzdWJzZXF1ZW50IHRlbXBsYXRlIHBhc3Nlcywgd2UgY2xvbmVcbiAgICAvLyBhbnkgY3VycmVudCBMUXVlcmllcyBoZXJlIHVwLWZyb250IGlmIHRoZSBjdXJyZW50IG5vZGUgaG9zdHMgYSBjb250ZW50IHF1ZXJ5LlxuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpICYmIGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgICBsVmlld1tRVUVSSUVTXSA9IGxWaWV3W1FVRVJJRVNdICEuY2xvbmUoKTtcbiAgICB9XG4gIH1cbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgPVxuICAgICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGNvbnN0cztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSB7XG4gICAgaWQ6IHZpZXdJbmRleCxcbiAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICBub2RlOiBudWxsICEsXG4gICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCksICAvLyBGaWxsIGluIHRvIG1hdGNoIEhFQURFUl9PRkZTRVQgaW4gTFZpZXdcbiAgICBjaGlsZEluZGV4OiAtMSwgICAgICAgICAgIC8vIENoaWxkcmVuIHNldCBpbiBhZGRUb1ZpZXdUcmVlKCksIGlmIGFueVxuICAgIGJpbmRpbmdTdGFydEluZGV4OiBiaW5kaW5nU3RhcnRJbmRleCxcbiAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZXhwYW5kb0luc3RydWN0aW9uczogbnVsbCxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICBjaGFuZ2VzSG9va3M6IG51bGwsXG4gICAgaW5pdEhvb2tzOiBudWxsLFxuICAgIGNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZXcgQXJyYXkoaW5pdGlhbFZpZXdMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChudWxsLCAwLCBiaW5kaW5nU3RhcnRJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKE5PX0NIQU5HRSwgYmluZGluZ1N0YXJ0SW5kZXgpIGFzIExWaWV3O1xuICBibHVlcHJpbnRbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICBibHVlcHJpbnRbQklORElOR19JTkRFWF0gPSBiaW5kaW5nU3RhcnRJbmRleDtcbiAgcmV0dXJuIGJsdWVwcmludDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGFsbCBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHZpYSB0aGUgaW5mZXJyZWQgcmVuZGVyZXIuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIHR3byBmb3JtcyBvZiBhdHRyaWJ1dGUgZW50cmllczpcbiAqXG4gKiBkZWZhdWx0OiAoa2V5LCB2YWx1ZSk6XG4gKiAgYXR0cnMgPSBba2V5MSwgdmFsdWUxLCBrZXkyLCB2YWx1ZTJdXG4gKlxuICogbmFtZXNwYWNlZDogKE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUpXG4gKiAgYXR0cnMgPSBbTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZSwgTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZV1cbiAqXG4gKiBUaGUgYGF0dHJzYCBhcnJheSBjYW4gY29udGFpbiBhIG1peCBvZiBib3RoIHRoZSBkZWZhdWx0IGFuZCBuYW1lc3BhY2VkIGVudHJpZXMuXG4gKiBUaGUgXCJkZWZhdWx0XCIgdmFsdWVzIGFyZSBzZXQgd2l0aG91dCBhIG1hcmtlciwgYnV0IGlmIHRoZSBmdW5jdGlvbiBjb21lcyBhY3Jvc3NcbiAqIGEgbWFya2VyIHZhbHVlIHRoZW4gaXQgd2lsbCBhdHRlbXB0IHRvIHNldCBhIG5hbWVzcGFjZWQgdmFsdWUuIElmIHRoZSBtYXJrZXIgaXNcbiAqIG5vdCBvZiBhIG5hbWVzcGFjZWQgdmFsdWUgdGhlbiB0aGUgZnVuY3Rpb24gd2lsbCBxdWl0IGFuZCByZXR1cm4gdGhlIGluZGV4IHZhbHVlXG4gKiB3aGVyZSBpdCBzdG9wcGVkIGR1cmluZyB0aGUgaXRlcmF0aW9uIG9mIHRoZSBhdHRycyBhcnJheS5cbiAqXG4gKiBTZWUgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gdW5kZXJzdGFuZCB3aGF0IHRoZSBuYW1lc3BhY2UgbWFya2VyIHZhbHVlIGlzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGluc3RydWN0aW9uIGRvZXMgbm90IHN1cHBvcnQgYXNzaWduaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgdG9cbiAqIGFuIGVsZW1lbnQuIFNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgIHRvIGxlYXJuIGhvdyBzdHlsaW5nIHZhbHVlc1xuICogYXJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBlbGVtZW50IHRoYXQgdGhlIGF0dHJpYnV0ZXMgd2lsbCBiZSBhc3NpZ25lZCB0b1xuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGUgYXJyYXkgb2YgdmFsdWVzIHRoYXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICogQHJldHVybnMgdGhlIGluZGV4IHZhbHVlIHRoYXQgd2FzIGxhc3QgYWNjZXNzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlcbiAqL1xuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBUQXR0cmlidXRlcyk6IG51bWJlciB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcblxuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gb25seSBuYW1lc3BhY2VzIGFyZSBzdXBwb3J0ZWQuIE90aGVyIHZhbHVlIHR5cGVzIChzdWNoIGFzIHN0eWxlL2NsYXNzXG4gICAgICAvLyBlbnRyaWVzKSBhcmUgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGZ1bmN0aW9uLlxuICAgICAgaWYgKHZhbHVlICE9PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBqdXN0IGxhbmRlZCBvbiB0aGUgbWFya2VyIHZhbHVlIC4uLiB0aGVyZWZvcmVcbiAgICAgIC8vIHdlIHNob3VsZCBza2lwIHRvIHRoZSBuZXh0IGVudHJ5XG4gICAgICBpKys7XG5cbiAgICAgIGNvbnN0IG5hbWVzcGFjZVVSSSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vLyBhdHRyTmFtZSBpcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1srK2ldO1xuICAgICAgaWYgKGF0dHJOYW1lICE9PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgICAvLyBTdGFuZGFyZCBhdHRyaWJ1dGVzXG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgICAgaWYgKGlzQW5pbWF0aW9uUHJvcChhdHRyTmFtZSkpIHtcbiAgICAgICAgICBpZiAoaXNQcm9jKSB7XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0UHJvcGVydHkobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFub3RoZXIgcGllY2Ugb2YgY29kZSBtYXkgaXRlcmF0ZSBvdmVyIHRoZSBzYW1lIGF0dHJpYnV0ZXMgYXJyYXkuIFRoZXJlZm9yZVxuICAvLyBpdCBtYXkgYmUgaGVscGZ1bCB0byByZXR1cm4gdGhlIGV4YWN0IHNwb3Qgd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJyYXkgZXhpdGVkXG4gIC8vIHdoZXRoZXIgYnkgcnVubmluZyBpbnRvIGFuIHVuc3VwcG9ydGVkIG1hcmtlciBvciBpZiBhbGwgdGhlIHN0YXRpYyB2YWx1ZXMgd2VyZVxuICAvLyBpdGVyYXRlZCBvdmVyLlxuICByZXR1cm4gaTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtyZW5kZXJTdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGxpc3RlbmVySW50ZXJuYWwoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiAqIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiAqIHBhcmVudCBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWRcbiAqIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuICogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuICogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudEhvc3RTeW50aGV0aWNMaXN0ZW5lcjxUPihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBsaXN0ZW5lckludGVybmFsKGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlciwgbG9hZENvbXBvbmVudFJlbmRlcmVyKTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJJbnRlcm5hbChcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IHRDbGVhbnVwOiBmYWxzZXxhbnlbXSA9IGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDoge30gYXMgYW55O1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVkLnRhcmdldCB8fCBuYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgbGV0IHVzZUNhcHR1cmVPclN1YklkeDogYm9vbGVhbnxudW1iZXIgPSB1c2VDYXB0dXJlO1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAvLyAtIGVpdGhlciBhIHRhcmdldCBuYW1lIChhcyBhIHN0cmluZykgaW4gY2FzZSBvZiBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csIGRvY3VtZW50LCBib2R5KVxuICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gbENsZWFudXBJbmRleCArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGxDbGVhbnVwLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcihyZWFkRWxlbWVudFZhbHVlKF9sVmlld1t0Tm9kZS5pbmRleF0pKS50YXJnZXQgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcbiAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IHByb3BzOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgICAgLy8gU3Vic2NyaWJlIHRvIGxpc3RlbmVycyBmb3IgZWFjaCBvdXRwdXQsIGFuZCBzZXR1cCBjbGVhbiB1cCBmb3IgZWFjaC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7KSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gcHJvcHNbaSsrXSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IG1pbmlmaWVkTmFtZSA9IHByb3BzW2krK10gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBkZWNsYXJlZE5hbWUgPSBwcm9wc1tpKytdIGFzIHN0cmluZztcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBkaXJlY3RpdmVJbmRleCBhcyBudW1iZXIpO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKGxWaWV3W2RpcmVjdGl2ZUluZGV4XSk7XG4gICAgICAgIGNvbnN0IG91dHB1dCA9IGRpcmVjdGl2ZVttaW5pZmllZE5hbWVdO1xuXG4gICAgICAgIGlmIChuZ0Rldk1vZGUgJiYgIWlzT2JzZXJ2YWJsZShvdXRwdXQpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgQE91dHB1dCAke21pbmlmaWVkTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2RpcmVjdGl2ZS5jb25zdHJ1Y3Rvci5uYW1lfScuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvdXRwdXQuc3Vic2NyaWJlKGxpc3RlbmVyRm4pO1xuICAgICAgICBjb25zdCBpZHggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIHROb2RlLmluZGV4LCBpZHgsIC0oaWR4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuYWRkTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfVxuXG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyB0aGlzIGlzIGZpcmVkIGF0IHRoZSBlbmQgb2YgZWxlbWVudEVuZCBiZWNhdXNlIEFMTCBvZiB0aGUgc3R5bGluZ0JpbmRpbmdzIGNvZGVcbiAgLy8gKGZvciBkaXJlY3RpdmVzIGFuZCB0aGUgdGVtcGxhdGUpIGhhdmUgbm93IGV4ZWN1dGVkIHdoaWNoIG1lYW5zIHRoZSBzdHlsaW5nXG4gIC8vIGNvbnRleHQgY2FuIGJlIGluc3RhbnRpYXRlZCBwcm9wZXJseS5cbiAgaWYgKGhhc0NsYXNzSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICEsICdjbGFzcycsIGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCkpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyB0aGUgdmFsdWUgb2YgcmVtb3ZlcyBhbiBhdHRyaWJ1dGUgb24gYW4gRWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbnVtYmVyIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIG5hbWUgbmFtZSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlLlxuICogQHBhcmFtIHZhbHVlIHZhbHVlIFRoZSBhdHRyaWJ1dGUgaXMgcmVtb3ZlZCB3aGVuIHZhbHVlIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYC5cbiAqICAgICAgICAgICAgICAgICAgT3RoZXJ3aXNlIHRoZSBhdHRyaWJ1dGUgdmFsdWUgaXMgc2V0IHRvIHRoZSBzdHJpbmdpZmllZCB2YWx1ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlQXR0cmlidXRlKG5hbWUpO1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYXRpdmVPbmx5IFdoZXRoZXIgb3Igbm90IHdlIHNob3VsZCBvbmx5IHNldCBuYXRpdmUgcHJvcGVydGllcyBhbmQgc2tpcCBpbnB1dCBjaGVja1xuICogKHRoaXMgaXMgbmVjZXNzYXJ5IGZvciBob3N0IHByb3BlcnR5IGJpbmRpbmdzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyLCBuYXRpdmVPbmx5KTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgW0Bmb29dYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgQEhvc3RCaW5kaW5nKCdAZm9vJylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkIGluXG4gKiB0aGUgY29tcG9uZW50J3MgcmVuZGVyZXIuIE5vcm1hbGx5IGFsbCBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGUgcGFyZW50XG4gKiBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWQgdG8gYmVcbiAqIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZSBhbmltYXRpb25cbiAqIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGVsZW1lbnRQcm9wZXJ0eWAuIFRoaXMgaW5zdHJ1Y3Rpb25cbiAqIG9ubHkgZXhpc3RzIHRvIGVuc3VyZSBjb21wYXRpYmlsaXR5IHdpdGggdGhlIFZpZXdFbmdpbmUncyBob3N0IGJpbmRpbmcgYmVoYXZpb3IuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcGFyYW0gbmF0aXZlT25seSBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgb25seSBzZXQgbmF0aXZlIHByb3BlcnRpZXMgYW5kIHNraXAgaW5wdXQgY2hlY2tcbiAqICh0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgaG9zdCBwcm9wZXJ0eSBiaW5kaW5ncylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudEhvc3RTeW50aGV0aWNQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hdGl2ZU9ubHk/OiBib29sZWFuKSB7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGluZGV4LCBwcm9wTmFtZSwgdmFsdWUsIHNhbml0aXplciwgbmF0aXZlT25seSwgbG9hZENvbXBvbmVudFJlbmRlcmVyKTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYXRpdmVPbmx5PzogYm9vbGVhbixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGxldCBpbnB1dERhdGE6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIChpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpKSAmJlxuICAgICAgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0RGF0YSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZVByb3BlcnR5KHByb3BOYW1lKTtcbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgbFZpZXc6IExWaWV3LCB0eXBlOiBUTm9kZVR5cGUsIGFkanVzdGVkSW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCB0Vmlld3M6IFRWaWV3W10gfCBudWxsKTogVE5vZGUge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgZ2V0SXNQYXJlbnQoKSA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuXG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIGxWaWV3ICYmIHBhcmVudCAhPT0gbFZpZXdbSE9TVF9OT0RFXTtcbiAgY29uc3QgdFBhcmVudCA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuXG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBpbmRleDogYWRqdXN0ZWRJbmRleCxcbiAgICBpbmplY3RvckluZGV4OiB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTEsXG4gICAgZGlyZWN0aXZlU3RhcnQ6IC0xLFxuICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgZmxhZ3M6IDAsXG4gICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IHRWaWV3cyxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBkZXRhY2hlZDogbnVsbCxcbiAgICBzdHlsaW5nVGVtcGxhdGU6IG51bGwsXG4gICAgcHJvamVjdGlvbjogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIFNldCB0aGUgaW5wdXRzIG9mIGRpcmVjdGl2ZXMgYXQgdGhlIGN1cnJlbnQgbm9kZSB0byBjb3JyZXNwb25kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dEFsaWFzZXMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqIHBvc3NpYmx5IG1pbmlmaWVkLCBwcm9wZXJ0eSBuYW1lcyB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSBwdWJsaWNOYW1lIHB1YmxpYyBiaW5kaW5nIG5hbWUuIChUaGlzIGlzIHRoZSBgPGRpdiBbcHVibGljTmFtZV09dmFsdWU+YClcbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBzZXQuXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgaW5wdXRBbGlhc2VzOiBQcm9wZXJ0eUFsaWFzZXMsIHB1YmxpY05hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCBpbnB1dHMgPSBpbnB1dEFsaWFzZXNbcHVibGljTmFtZV07XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVJbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGlucHV0c1tpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBkZWNsYXJlZE5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBkaXJlY3RpdmVJbmRleCk7XG4gICAgcmVjb3JkQ2hhbmdlQW5kVXBkYXRlUHJvcGVydHkobFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkZWNsYXJlZE5hbWUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7KSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpbnB1dHNbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgZGVjbGFyZWROYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShwcml2YXRlTmFtZSk7XG4gICAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUsIGRlYnVnVmFsdWUpIDpcbiAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gO1xuICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIHROb2RlRmxhZ3Mgbm9kZSBmbGFnc1xuICogQHBhcmFtIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlOiBUTm9kZSwgZGlyZWN0aW9uOiBCaW5kaW5nRGlyZWN0aW9uKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcblxuICBpZiAoZW5kID4gc3RhcnQpIHtcbiAgICBjb25zdCBpc0lucHV0ID0gZGlyZWN0aW9uID09PSBCaW5kaW5nRGlyZWN0aW9uLklucHV0O1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kYXRhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBwdWJsaWNUb01pbmlmaWVkTmFtZXM6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGNvbnN0IHB1YmxpY1RvRGVjbGFyZWROYW1lczoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9fG51bGwgPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuZGVjbGFyZWRJbnB1dHMgOiBudWxsO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwdWJsaWNUb01pbmlmaWVkTmFtZXMpIHtcbiAgICAgICAgaWYgKHB1YmxpY1RvTWluaWZpZWROYW1lcy5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBtaW5pZmllZE5hbWUgPSBwdWJsaWNUb01pbmlmaWVkTmFtZXNbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgZGVjbGFyZWROYW1lID1cbiAgICAgICAgICAgICAgcHVibGljVG9EZWNsYXJlZE5hbWVzID8gcHVibGljVG9EZWNsYXJlZE5hbWVzW3B1YmxpY05hbWVdIDogbWluaWZpZWROYW1lO1xuICAgICAgICAgIGNvbnN0IGFsaWFzZXM6IFByb3BlcnR5QWxpYXNWYWx1ZSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSA/XG4gICAgICAgICAgICAgIHByb3BTdG9yZVtwdWJsaWNOYW1lXSA6XG4gICAgICAgICAgICAgIHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtdO1xuICAgICAgICAgIGFsaWFzZXMucHVzaChpLCBtaW5pZmllZE5hbWUsIGRlY2xhcmVkTmFtZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBBc3NpZ24gYW55IGlubGluZSBzdHlsZSB2YWx1ZXMgdG8gdGhlIGVsZW1lbnQgZHVyaW5nIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBjYWxsZWQgZHVyaW5nIGNyZWF0aW9uIG1vZGUgdG8gcmVnaXN0ZXIgYWxsXG4gKiBkeW5hbWljIHN0eWxlIGFuZCBjbGFzcyBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC4gTm90ZSBmb3Igc3RhdGljIHZhbHVlcyAobm8gYmluZGluZylcbiAqIHNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgLlxuICpcbiAqIEBwYXJhbSBjbGFzc0JpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIGNsYXNzIG5hbWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudENsYXNzUHJvcGAgcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluIHRoaXMgYXJyYXkuXG4gKiAgICAgICAgKGkuZS4gYFsnZm9vJywgJ2JhciddYCBtZWFucyBgZm9vPTBgIGFuZCBgYmFyPTFgKS5cbiAqIEBwYXJhbSBzdHlsZUJpbmRpbmdOYW1lcyBBbiBhcnJheSBjb250YWluaW5nIGJpbmRhYmxlIHN0eWxlIHByb3BlcnRpZXMuXG4gKiAgICAgICAgVGhlIGBlbGVtZW50U3R5bGVQcm9wYCByZWZlcnMgdG8gdGhlIGNsYXNzIG5hbWUgYnkgaW5kZXggaW4gdGhpcyBhcnJheS5cbiAqICAgICAgICAoaS5lLiBgWyd3aWR0aCcsICdoZWlnaHQnXWAgbWVhbnMgYHdpZHRoPTBgIGFuZCBgaGVpZ2h0PTFgKS5cbiAqIEBwYXJhbSBzdHlsZVNhbml0aXplciBBbiBvcHRpb25hbCBzYW5pdGl6ZXIgZnVuY3Rpb24gdGhhdCB3aWxsIGJlIHVzZWQgdG8gc2FuaXRpemUgYW55IENTU1xuICogICAgICAgIHByb3BlcnR5IHZhbHVlcyB0aGF0IGFyZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IChkdXJpbmcgcmVuZGVyaW5nKS5cbiAqICAgICAgICBOb3RlIHRoYXQgdGhlIHNhbml0aXplciBpbnN0YW5jZSBpdHNlbGYgaXMgdGllZCB0byB0aGUgYGRpcmVjdGl2ZWAgKGlmICBwcm92aWRlZCkuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEEgZGlyZWN0aXZlIGluc3RhbmNlIHRoZSBzdHlsaW5nIGlzIGFzc29jaWF0ZWQgd2l0aC4gSWYgbm90IHByb3ZpZGVkXG4gKiAgICAgICAgY3VycmVudCB2aWV3J3MgY29udHJvbGxlciBpbnN0YW5jZSBpcyBhc3N1bWVkLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nKFxuICAgIGNsYXNzQmluZGluZ05hbWVzPzogc3RyaW5nW10gfCBudWxsLCBzdHlsZUJpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCxcbiAgICBzdHlsZVNhbml0aXplcj86IFN0eWxlU2FuaXRpemVGbiB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gY3JlYXRlRW1wdHlTdHlsaW5nQ29udGV4dCgpO1xuICB9XG4gIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MoXG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgISwgZGlyZWN0aXZlIHx8IG51bGwsIGNsYXNzQmluZGluZ05hbWVzLCBzdHlsZUJpbmRpbmdOYW1lcyxcbiAgICAgIHN0eWxlU2FuaXRpemVyLCBoYXNDbGFzc0lucHV0KHROb2RlKSk7XG59XG5cbi8qKlxuICogQXNzaWduIHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWVzIHRvIGEgaG9zdCBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gd2lsbCBhc3NpZ24gc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZXMgYXMgd2VsbCBhcyBjbGFzcyBhbmQgc3R5bGVcbiAqIHZhbHVlcyB0byBhbiBlbGVtZW50IHdpdGhpbiB0aGUgaG9zdCBiaW5kaW5ncyBmdW5jdGlvbi4gU2luY2UgYXR0cmlidXRlIHZhbHVlc1xuICogY2FuIGNvbnNpc3Qgb2YgZGlmZmVyZW50IHR5cGVzIG9mIHZhbHVlcywgdGhlIGBhdHRyc2AgYXJyYXkgbXVzdCBpbmNsdWRlIHRoZSB2YWx1ZXMgaW5cbiAqIHRoZSBmb2xsb3dpbmcgZm9ybWF0OlxuICpcbiAqIGF0dHJzID0gW1xuICogICAvLyBzdGF0aWMgYXR0cmlidXRlcyAobGlrZSBgdGl0bGVgLCBgbmFtZWAsIGBpZGAuLi4pXG4gKiAgIGF0dHIxLCB2YWx1ZTEsIGF0dHIyLCB2YWx1ZSxcbiAqXG4gKiAgIC8vIGEgc2luZ2xlIG5hbWVzcGFjZSB2YWx1ZSAobGlrZSBgeDppZGApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTEsIG5hbWUxLCB2YWx1ZTEsXG4gKlxuICogICAvLyBhbm90aGVyIHNpbmdsZSBuYW1lc3BhY2UgdmFsdWUgKGxpa2UgYHg6bmFtZWApXG4gKiAgIE5BTUVTUEFDRV9NQVJLRVIsIG5hbWVzcGFjZVVyaTIsIG5hbWUyLCB2YWx1ZTIsXG4gKlxuICogICAvLyBhIHNlcmllcyBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAobm8gc3BhY2VzKVxuICogICBDTEFTU0VTX01BUktFUiwgY2xhc3MxLCBjbGFzczIsIGNsYXNzMyxcbiAqXG4gKiAgIC8vIGEgc2VyaWVzIG9mIENTUyBzdHlsZXMgKHByb3BlcnR5ICsgdmFsdWUpIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBlbGVtZW50XG4gKiAgIFNUWUxFU19NQVJLRVIsIHByb3AxLCB2YWx1ZTEsIHByb3AyLCB2YWx1ZTJcbiAqIF1cbiAqXG4gKiBBbGwgbm9uLWNsYXNzIGFuZCBub24tc3R5bGUgYXR0cmlidXRlcyBtdXN0IGJlIGRlZmluZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBsaXN0XG4gKiBmaXJzdCBiZWZvcmUgYWxsIGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMgYXJlIHNldC4gV2hlbiB0aGVyZSBpcyBhIGNoYW5nZSBpbiB2YWx1ZVxuICogdHlwZSAobGlrZSB3aGVuIGNsYXNzZXMgYW5kIHN0eWxlcyBhcmUgaW50cm9kdWNlZCkgYSBtYXJrZXIgbXVzdCBiZSB1c2VkIHRvIHNlcGFyYXRlXG4gKiB0aGUgZW50cmllcy4gVGhlIG1hcmtlciB2YWx1ZXMgdGhlbXNlbHZlcyBhcmUgc2V0IHZpYSBlbnRyaWVzIGZvdW5kIGluIHRoZVxuICogW0F0dHJpYnV0ZU1hcmtlcl0gZW51bS5cbiAqXG4gKiBOT1RFOiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIHVzZWQgZnJvbSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBvbmx5LlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmUgQSBkaXJlY3RpdmUgaW5zdGFuY2UgdGhlIHN0eWxpbmcgaXMgYXNzb2NpYXRlZCB3aXRoLlxuICogQHBhcmFtIGF0dHJzIEFuIGFycmF5IG9mIHN0YXRpYyB2YWx1ZXMgKGF0dHJpYnV0ZXMsIGNsYXNzZXMgYW5kIHN0eWxlcykgd2l0aCB0aGUgY29ycmVjdCBtYXJrZXJcbiAqIHZhbHVlcy5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdEF0dHJzKGRpcmVjdGl2ZTogYW55LCBhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICB9XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCBpID0gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSwgYXR0cnMpO1xuICBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnModE5vZGUuc3R5bGluZ1RlbXBsYXRlLCBhdHRycywgaSwgZGlyZWN0aXZlKTtcbn1cblxuLyoqXG4gKiBBcHBseSBzdHlsaW5nIGJpbmRpbmcgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBiZSBydW4gYWZ0ZXIgYGVsZW1lbnRTdHlsZWAgYW5kL29yIGBlbGVtZW50U3R5bGVQcm9wYC5cbiAqIGlmIGFueSBzdHlsaW5nIGJpbmRpbmdzIGhhdmUgY2hhbmdlZCB0aGVuIHRoZSBjaGFuZ2VzIGFyZSBmbHVzaGVkIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbmNvbXBvbmVudHNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ0FwcGx5KGluZGV4OiBudW1iZXIsIGRpcmVjdGl2ZT86IGFueSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGlzRmlyc3RSZW5kZXIgPSAobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcykgIT09IDA7XG4gIGNvbnN0IHRvdGFsUGxheWVyc1F1ZXVlZCA9IHJlbmRlclN0eWxpbmcoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KSwgbFZpZXdbUkVOREVSRVJdLCBsVmlldywgaXNGaXJzdFJlbmRlciwgbnVsbCxcbiAgICAgIG51bGwsIGRpcmVjdGl2ZSk7XG4gIGlmICh0b3RhbFBsYXllcnNRdWV1ZWQgPiAwKSB7XG4gICAgY29uc3Qgcm9vdENvbnRleHQgPSBnZXRSb290Q29udGV4dChsVmlldyk7XG4gICAgc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGUgYSBzdHlsZSBiaW5kaW5ncyB2YWx1ZSBvbiBhbiBlbGVtZW50LlxuICpcbiAqIElmIHRoZSBzdHlsZSB2YWx1ZSBpcyBgbnVsbGAgdGhlbiBpdCB3aWxsIGJlIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudFxuICogKG9yIGFzc2lnbmVkIGEgZGlmZmVyZW50IHZhbHVlIGRlcGVuZGluZyBpZiB0aGVyZSBhcmUgYW55IHN0eWxlcyBwbGFjZWRcbiAqIG9uIHRoZSBlbGVtZW50IHdpdGggYGVsZW1lbnRTdHlsZWAgb3IgYW55IHN0eWxlcyB0aGF0IGFyZSBwcmVzZW50XG4gKiBmcm9tIHdoZW4gdGhlIGVsZW1lbnQgd2FzIGNyZWF0ZWQgKHdpdGggYGVsZW1lbnRTdHlsaW5nYCkuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBlbGVtZW50IGlzIHVwZGF0ZWQgYXMgcGFydCBvZiBgZWxlbWVudFN0eWxpbmdBcHBseWAuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIHN0eWxlSW5kZXggSW5kZXggb2Ygc3R5bGUgdG8gdXBkYXRlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgc3R5bGUgaW4gdGhlIHN0eWxlIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYGVsZW1lbnRTdGx5aW5nQmluZGluZ3NgLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZSAobnVsbCB0byByZW1vdmUpLiBOb3RlIHRoYXQgaWYgYSBkaXJlY3RpdmUgYWxzb1xuICogICAgICAgIGF0dGVtcHRzIHRvIHdyaXRlIHRvIHRoZSBzYW1lIGJpbmRpbmcgdmFsdWUgdGhlbiBpdCB3aWxsIG9ubHkgYmUgYWJsZSB0b1xuICogICAgICAgIGRvIHNvIGlmIHRoZSB0ZW1wbGF0ZSBiaW5kaW5nIHZhbHVlIGlzIGBudWxsYCAob3IgZG9lc24ndCBleGlzdCBhdCBhbGwpLlxuICogQHBhcmFtIHN1ZmZpeCBPcHRpb25hbCBzdWZmaXguIFVzZWQgd2l0aCBzY2FsYXIgdmFsdWVzIHRvIGFkZCB1bml0IHN1Y2ggYXMgYHB4YC5cbiAqICAgICAgICBOb3RlIHRoYXQgd2hlbiBhIHN1ZmZpeCBpcyBwcm92aWRlZCB0aGVuIHRoZSB1bmRlcmx5aW5nIHNhbml0aXplciB3aWxsXG4gKiAgICAgICAgYmUgaWdub3JlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbmNvbXBvbmVudHNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGVQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIHN0eWxlSW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyB8IG51bWJlciB8IFN0cmluZyB8IFBsYXllckZhY3RvcnkgfCBudWxsLFxuICAgIHN1ZmZpeD86IHN0cmluZyB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGxldCB2YWx1ZVRvQWRkOiBzdHJpbmd8bnVsbCA9IG51bGw7XG4gIGlmICh2YWx1ZSAhPT0gbnVsbCkge1xuICAgIGlmIChzdWZmaXgpIHtcbiAgICAgIC8vIHdoZW4gYSBzdWZmaXggaXMgYXBwbGllZCB0aGVuIGl0IHdpbGwgYnlwYXNzXG4gICAgICAvLyBzYW5pdGl6YXRpb24gZW50aXJlbHkgKGIvYyBhIG5ldyBzdHJpbmcgaXMgY3JlYXRlZClcbiAgICAgIHZhbHVlVG9BZGQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpICsgc3VmZml4O1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBzYW5pdGl6YXRpb24gaGFwcGVucyBieSBkZWFsaW5nIHdpdGggYSBTdHJpbmcgdmFsdWVcbiAgICAgIC8vIHRoaXMgbWVhbnMgdGhhdCB0aGUgc3RyaW5nIHZhbHVlIHdpbGwgYmUgcGFzc2VkIHRocm91Z2hcbiAgICAgIC8vIGludG8gdGhlIHN0eWxlIHJlbmRlcmluZyBsYXRlciAod2hpY2ggaXMgd2hlcmUgdGhlIHZhbHVlXG4gICAgICAvLyB3aWxsIGJlIHNhbml0aXplZCBiZWZvcmUgaXQgaXMgYXBwbGllZClcbiAgICAgIHZhbHVlVG9BZGQgPSB2YWx1ZSBhcyBhbnkgYXMgc3RyaW5nO1xuICAgIH1cbiAgfVxuICB1cGRhdGVFbGVtZW50U3R5bGVQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgc3R5bGVJbmRleCwgdmFsdWVUb0FkZCwgZGlyZWN0aXZlKTtcbn1cblxuLyoqXG4gKiBBZGQgb3IgcmVtb3ZlIGEgY2xhc3MgdmlhIGEgY2xhc3MgYmluZGluZyBvbiBhIERPTSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gaGFuZGxlIHRoZSBbY2xhc3MuZm9vXT1cImV4cFwiIGNhc2UgYW5kLCB0aGVyZWZvcmUsXG4gKiB0aGUgY2xhc3MgaXRzZWxmIG11c3QgYWxyZWFkeSBiZSBhcHBsaWVkIHVzaW5nIGBlbGVtZW50U3R5bGluZ2Agd2l0aGluXG4gKiB0aGUgY3JlYXRpb24gYmxvY2suXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NJbmRleCBJbmRleCBvZiBjbGFzcyB0byB0b2dnbGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBjbGFzcyBpbiB0aGUgY2xhc3MgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0bHlpbmdCaW5kaW5nc2AgKHdoaWNoIGlzIG1lYW50IHRvIGJlIGNhbGxlZCBiZWZvcmUgdGhpc1xuICogICAgICAgIGZ1bmN0aW9uIGlzKS5cbiAqIEBwYXJhbSB2YWx1ZSBBIHRydWUvZmFsc2UgdmFsdWUgd2hpY2ggd2lsbCB0dXJuIHRoZSBjbGFzcyBvbiBvciBvZmYuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIERpcmVjdGl2ZSBpbnN0YW5jZSB0aGF0IGlzIGF0dGVtcHRpbmcgdG8gY2hhbmdlIHN0eWxpbmcuIChEZWZhdWx0cyB0byB0aGVcbiAqICAgICAgICBjb21wb25lbnQgb2YgdGhlIGN1cnJlbnQgdmlldykuXG5jb21wb25lbnRzXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENsYXNzUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc0luZGV4OiBudW1iZXIsIHZhbHVlOiBib29sZWFuIHwgUGxheWVyRmFjdG9yeSwgZGlyZWN0aXZlPzoge30pOiB2b2lkIHtcbiAgY29uc3Qgb25Pck9mZkNsYXNzVmFsdWUgPVxuICAgICAgKHZhbHVlIGluc3RhbmNlb2YgQm91bmRQbGF5ZXJGYWN0b3J5KSA/ICh2YWx1ZSBhcyBCb3VuZFBsYXllckZhY3Rvcnk8Ym9vbGVhbj4pIDogKCEhdmFsdWUpO1xuICB1cGRhdGVFbGVtZW50Q2xhc3NQcm9wKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBnZXRMVmlldygpKSwgY2xhc3NJbmRleCwgb25Pck9mZkNsYXNzVmFsdWUsXG4gICAgICBkaXJlY3RpdmUpO1xufVxuXG4vKipcbiAqIFVwZGF0ZSBzdHlsZSBhbmQvb3IgY2xhc3MgYmluZGluZ3MgdXNpbmcgb2JqZWN0IGxpdGVyYWwuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCBhcHBseSBzdHlsaW5nIHZpYSB0aGUgYFtzdHlsZV09XCJleHBcImAgYW5kIGBbY2xhc3NdPVwiZXhwXCJgIHRlbXBsYXRlXG4gKiBiaW5kaW5ncy4gV2hlbiBzdHlsZXMgYXJlIGFwcGxpZWQgdG8gdGhlIEVsZW1lbnQgdGhleSB3aWxsIHRoZW4gYmUgcGxhY2VkIHdpdGggcmVzcGVjdCB0b1xuICogYW55IHN0eWxlcyBzZXQgd2l0aCBgZWxlbWVudFN0eWxlUHJvcGAuIElmIGFueSBzdHlsZXMgYXJlIHNldCB0byBgbnVsbGAgdGhlbiB0aGV5IHdpbGwgYmVcbiAqIHJlbW92ZWQgZnJvbSB0aGUgZWxlbWVudC5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGluc3RydWN0aW9uIHdpbGwgbm90IGJlIGFwcGxpZWQgdW50aWwgYGVsZW1lbnRTdHlsaW5nQXBwbHlgIGlzIGNhbGxlZC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gY2xhc3NlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFkZGVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIGNsYXNzZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBsaXN0IG9mIENTUyBjbGFzc2VzLlxuICogQHBhcmFtIHN0eWxlcyBBIGtleS92YWx1ZSBzdHlsZSBtYXAgb2YgdGhlIHN0eWxlcyB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBzdHlsZXMgKHRoYXQgaGF2ZSBhbHJlYWR5IGJlZW4gYXBwbGllZCB0byB0aGUgZWxlbWVudCBiZWZvcmVoYW5kKSB3aWxsIGJlXG4gKiAgICAgICAgcmVtb3ZlZCAodW5zZXQpIGZyb20gdGhlIGVsZW1lbnQncyBzdHlsaW5nLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBEaXJlY3RpdmUgaW5zdGFuY2UgdGhhdCBpcyBhdHRlbXB0aW5nIHRvIGNoYW5nZSBzdHlsaW5nLiAoRGVmYXVsdHMgdG8gdGhlXG4gKiAgICAgICAgY29tcG9uZW50IG9mIHRoZSBjdXJyZW50IHZpZXcpLlxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGlmIChkaXJlY3RpdmUgIT0gdW5kZWZpbmVkKVxuICAgIHJldHVybiBoYWNrSW1wbGVtZW50YXRpb25PZkVsZW1lbnRTdHlsaW5nTWFwKFxuICAgICAgICBpbmRleCwgY2xhc3Nlcywgc3R5bGVzLCBkaXJlY3RpdmUpOyAgLy8gc3VwcG9ydGVkIGluIG5leHQgUFJcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyk7XG4gIGlmIChoYXNDbGFzc0lucHV0KHROb2RlKSAmJiBjbGFzc2VzICE9PSBOT19DSEFOR0UpIHtcbiAgICBjb25zdCBpbml0aWFsQ2xhc3NlcyA9IGdldEluaXRpYWxDbGFzc05hbWVWYWx1ZShzdHlsaW5nQ29udGV4dCk7XG4gICAgY29uc3QgY2xhc3NJbnB1dFZhbCA9XG4gICAgICAgIChpbml0aWFsQ2xhc3Nlcy5sZW5ndGggPyAoaW5pdGlhbENsYXNzZXMgKyAnICcpIDogJycpICsgKGNsYXNzZXMgYXMgc3RyaW5nKTtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgdE5vZGUuaW5wdXRzICEsICdjbGFzcycsIGNsYXNzSW5wdXRWYWwpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZVN0eWxpbmdNYXAoc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMsIHN0eWxlcyk7XG4gIH1cbn1cblxuLyogU1RBUlQgT0YgSEFDSyBCTE9DSyAqL1xuZnVuY3Rpb24gaGFja0ltcGxlbWVudGF0aW9uT2ZFbGVtZW50U3R5bGluZ01hcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICB0aHJvdyBuZXcgRXJyb3IoJ3VuaW1wbGVtZW50ZWQuIFNob3VsZCBub3QgYmUgbmVlZGVkIGJ5IFZpZXdFbmdpbmUgY29tcGF0aWJpbGl0eScpO1xufVxuLyogRU5EIE9GIEhBQ0sgQkxPQ0sgKi9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5hdGl2ZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCBsVmlld1tSRU5ERVJFUl0pO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dE5hdGl2ZSwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nLlxuICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIGFwcGVuZENoaWxkKHRleHROYXRpdmUsIHROb2RlLCBsVmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkZWY6IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0Vmlldywgcm9vdFROb2RlLCAxKTtcbiAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0Vmlldywgdmlld0RhdGEsIGRlZiwgZGVmLmZhY3RvcnkpO1xuICB9XG4gIGNvbnN0IGRpcmVjdGl2ZSA9XG4gICAgICBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCB2aWV3RGF0YSwgdmlld0RhdGEubGVuZ3RoIC0gMSwgcm9vdFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZSh2aWV3RGF0YSwgcm9vdFROb2RlLCBkaXJlY3RpdmUsIGRlZiBhcyBEaXJlY3RpdmVEZWY8VD4pO1xuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIG1hdGNoZWQgZGlyZWN0aXZlcyBvbiBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdIHwgbnVsbCwgdE5vZGU6IFROb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChnZXRGaXJzdFRlbXBsYXRlUGFzcygpLCB0cnVlLCAnc2hvdWxkIHJ1biBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG4gIGlmIChkaXJlY3RpdmVzKSB7XG4gICAgaW5pdE5vZGVGbGFncyh0Tm9kZSwgdFZpZXcuZGF0YS5sZW5ndGgsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgLy8gdGhlIHZpZXdFbmdpbmU6XG4gICAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgIC8vIFNvIHRvIG1hdGNoIHRoZXNlIHJ1bGVzLCB0aGUgb3JkZXIgaW4gd2hpY2ggcHJvdmlkZXJzIGFyZSBhZGRlZCBpbiB0aGUgYXJyYXlzIGlzIHZlcnlcbiAgICAvLyBpbXBvcnRhbnQuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgfVxuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHROb2RlLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuXG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSB0Vmlldy5kYXRhLmxlbmd0aDtcbiAgICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmLCBkZWYuZmFjdG9yeSk7XG5cbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAodFZpZXcuZGF0YSAhLmxlbmd0aCAtIDEsIGRlZiwgZXhwb3J0c01hcCk7XG5cbiAgICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICAgIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhkaXJlY3RpdmVEZWZJZHgsIGRlZiwgdFZpZXcpO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCFnZXRGaXJzdFRlbXBsYXRlUGFzcygpICYmIHN0YXJ0IDwgZW5kKSB7XG4gICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgYWRkQ29tcG9uZW50TG9naWMobFZpZXcsIHROb2RlLCBkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pO1xuICAgIH1cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCBsVmlldyAhLCBpLCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuXG4gICAgcG9zdFByb2Nlc3NEaXJlY3RpdmUobFZpZXcsIGRpcmVjdGl2ZSwgZGVmLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IGdldEZpcnN0VGVtcGxhdGVQYXNzKCk7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBkaXJlY3RpdmUgPSB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKHZpZXdEYXRhW2ldKTtcbiAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgY29uc3QgcHJldmlvdXNFeHBhbmRvTGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gICAgICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZik7XG4gICAgICBkZWYuaG9zdEJpbmRpbmdzICEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUsIHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKG51bGwpO1xuICAgICAgLy8gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gbWF5IG9yIG1heSBub3QgY29udGFpbiBgYWxsb2NIb3N0VmFyc2AgY2FsbFxuICAgICAgLy8gKGUuZy4gaXQgbWF5IG5vdCBpZiBpdCBvbmx5IGNvbnRhaW5zIGhvc3QgbGlzdGVuZXJzKSwgc28gd2UgbmVlZCB0byBjaGVjayB3aGV0aGVyXG4gICAgICAvLyBgZXhwYW5kb0luc3RydWN0aW9uc2AgaGFzIGNoYW5nZWQgYW5kIGlmIG5vdCAtIHdlIHN0aWxsIHB1c2ggYGhvc3RCaW5kaW5nc2AgdG9cbiAgICAgIC8vIGV4cGFuZG8gYmxvY2ssIHRvIG1ha2Ugc3VyZSB3ZSBleGVjdXRlIGl0IGZvciBESSBjeWNsZVxuICAgICAgaWYgKHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9PT0gZXhwYW5kby5sZW5ndGggJiYgZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGV4cGFuZG8ucHVzaChudWxsKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEdlbmVyYXRlcyBhIG5ldyBibG9jayBpbiBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIGZvciB0aGlzIG5vZGUuXG4qXG4qIEVhY2ggZXhwYW5kbyBibG9jayBzdGFydHMgd2l0aCB0aGUgZWxlbWVudCBpbmRleCAodHVybmVkIG5lZ2F0aXZlIHNvIHdlIGNhbiBkaXN0aW5ndWlzaFxuKiBpdCBmcm9tIHRoZSBob3N0VmFyIGNvdW50KSBhbmQgdGhlIGRpcmVjdGl2ZSBjb3VudC4gU2VlIG1vcmUgaW4gVklFV19EQVRBLm1kLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcblxuICBjb25zdCBlbGVtZW50SW5kZXggPSAtKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW1xuICAgXSkpLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgd2UgbmVlZCB0byByZXNlcnZlIHNwYWNlIGZvciBob3N0IGJpbmRpbmcgdmFsdWVzXG4qIGFmdGVyIGRpcmVjdGl2ZXMgYXJlIG1hdGNoZWQgKHNvIGFsbCBkaXJlY3RpdmVzIGFyZSBzYXZlZCwgdGhlbiBiaW5kaW5ncykuXG4qIEJlY2F1c2Ugd2UgYXJlIHVwZGF0aW5nIHRoZSBibHVlcHJpbnQsIHdlIG9ubHkgbmVlZCB0byBkbyB0aGlzIG9uY2UuXG4qL1xuZnVuY3Rpb24gcHJlZmlsbEhvc3RWYXJzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0b3RhbEhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChnZXRGaXJzdFRlbXBsYXRlUGFzcygpLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdG90YWxIb3N0VmFyczsgaSsrKSB7XG4gICAgbFZpZXcucHVzaChOT19DSEFOR0UpO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2VzcyBhIGRpcmVjdGl2ZSBvbiB0aGUgY3VycmVudCBub2RlIGFmdGVyIGl0cyBjcmVhdGlvbi5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NEaXJlY3RpdmU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmU6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBkaXJlY3RpdmVEZWZJZHg6IG51bWJlcik6IHZvaWQge1xuICBpZiAoZGVmLm9uQ2hhbmdlcykge1xuICAgIC8vIFdlIGhhdmUgb25DaGFuZ2VzLCB3cmFwIGl0IHNvIHRoYXQgd2UgY2FuIHRyYWNrIGNoYW5nZXMuXG4gICAgbFZpZXdbZGlyZWN0aXZlRGVmSWR4XSA9IG5ldyBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKGxWaWV3W2RpcmVjdGl2ZURlZklkeF0pO1xuICB9XG5cbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBkaXJlY3RpdmUsIGRlZik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZScpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhsVmlldywgZGlyZWN0aXZlRGVmSWR4LCBkZWYsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgZGVmLmNvbnRlbnRRdWVyaWVzKGRpcmVjdGl2ZURlZklkeCk7XG4gIH1cblxuICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICB9XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgcG9zdFByb2Nlc3NEaXJlY3RpdmUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSwgZGlyZWN0aXZlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbFZpZXcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoZ2V0SXNQYXJlbnQoKSk7XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG59XG5cblxuXG4vKipcbiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4qIElmIGEgY29tcG9uZW50IGlzIG1hdGNoZWQgKGF0IG1vc3Qgb25lKSwgaXQgaXMgcmV0dXJuZWQgaW4gZmlyc3QgcG9zaXRpb24gaW4gdGhlIGFycmF5LlxuKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfFxuICAgIG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbn1cblxuLyoqXG4gKiBTdG9yZXMgaG9zdCBiaW5kaW5nIGZuIGFuZCBudW1iZXIgb2YgaG9zdCB2YXJzIHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nXG4gKiBDRC5cbiovXG5mdW5jdGlvbiBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soXG4gICAgdFZpZXc6IFRWaWV3LCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PiwgaG9zdFZhcnM6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgITtcbiAgY29uc3QgbGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBhbHJlYWR5IGV4aXN0cyBpbiBleHBhbmRvSW5zdHJ1Y3Rpb25zLFxuICAvLyB3aGljaCBjYW4gaGFwcGVuIGluIGNhc2UgZGlyZWN0aXZlIGRlZmluaXRpb24gd2FzIGV4dGVuZGVkIGZyb20gYmFzZSBkZWZpbml0aW9uIChhcyBhIHBhcnQgb2ZcbiAgLy8gdGhlIGBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgIGxvZ2ljKS4gSWYgd2UgZm91bmQgdGhlIHNhbWUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gaW4gdGhlXG4gIC8vIGxpc3QsIHdlIGp1c3QgaW5jcmVhc2UgdGhlIG51bWJlciBvZiBob3N0IHZhcnMgYXNzb2NpYXRlZCB3aXRoIHRoYXQgZnVuY3Rpb24sIGJ1dCBkbyBub3QgYWRkIGl0XG4gIC8vIGludG8gdGhlIGxpc3QgYWdhaW4uXG4gIGlmIChsZW5ndGggPj0gMiAmJiBleHBhbmRvW2xlbmd0aCAtIDJdID09PSBkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgZXhwYW5kb1tsZW5ndGggLSAxXSA9IChleHBhbmRvW2xlbmd0aCAtIDFdIGFzIG51bWJlcikgKyBob3N0VmFycztcbiAgfSBlbHNlIHtcbiAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyAhLCBob3N0VmFycyk7XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4qIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0VGVtcGxhdGVQYXNzIHRvIGJlIHRydWUnKTtcbiAgY29uc3QgZmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZsYWdzID09PSAwIHx8IGZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCBub2RlIGZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5mbGFncyA9IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4sXG4gICAgZGlyZWN0aXZlRmFjdG9yeTogKHQ6IFR5cGU8VD58IG51bGwpID0+IGFueSkge1xuICB0Vmlldy5kYXRhLnB1c2goZGVmKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBmYWxzZSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXS5jcmVhdGVSZW5kZXJlcihuYXRpdmUgYXMgUkVsZW1lbnQsIGRlZikpKTtcblxuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBjb21wb25lbnRWaWV3W0hPU1RdID0gbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSA9IGxWaWV3W2RpcmVjdGl2ZUluZGV4XTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIHJlY29yZENoYW5nZUFuZFVwZGF0ZVByb3BlcnR5KFxuICAgICAgICAgIGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSwgZGVjbGFyZWROYW1lLCBwcml2YXRlTmFtZSwgYXR0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBpbnN0YW5jZWQgcGFzc2VkIGFzIGBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmVgIGlzIHdyYXBwZWQgaW4ge0BsaW5rXG4gKiBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyfSBvciBub3QuXG4gKiBJZiBpdCBpcywgaXQgd2lsbCB1cGRhdGUgdGhlIHJlbGF0ZWQge0BsaW5rIFNpbXBsZUNoYW5nZXN9IG9iamVjdCB3aXRoIHRoZSBjaGFuZ2UgdG8gc2lnbmFsXG4gKiBgbmdPbkNoYW5nZXNgIGhvb2tcbiAqIHNob3VsZCBmaXJlLCB0aGVuIGl0IHdpbGwgdW53cmFwIHRoZSBpbnN0YW5jZS4gQWZ0ZXIgdGhhdCwgaXQgd2lsbCBzZXQgdGhlIHByb3BlcnR5IHdpdGggdGhlIGtleVxuICogcHJvdmlkZWRcbiAqIGluIGBwcml2YXRlTmFtZWAgb24gdGhlIGluc3RhbmNlIHdpdGggdGhlIHBhc3NlZCB2YWx1ZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBvciBhIGRpcmVjdGl2ZSBpbnN0YW5jZSB3cmFwcGVkIGluXG4gKiB7QGxpbmsgT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcn1cbiAqIEBwYXJhbSBkZWNsYXJlZE5hbWUgVGhlIG9yaWdpbmFsLCBkZWNsYXJlZCBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGUuXG4gKiBAcGFyYW0gcHJpdmF0ZU5hbWUgVGhlIHByaXZhdGUsIHBvc3NpYmx5IG1pbmlmaWVkIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdXBkYXRlIHRoZSBwcm9wZXJ0eSB3aXRoLlxuICovXG5mdW5jdGlvbiByZWNvcmRDaGFuZ2VBbmRVcGRhdGVQcm9wZXJ0eTxULCBLIGV4dGVuZHMga2V5b2YgVD4oXG4gICAgZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlOiBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyPFQ+fCBULCBkZWNsYXJlZE5hbWU6IHN0cmluZyxcbiAgICBwcml2YXRlTmFtZTogSywgdmFsdWU6IGFueSkge1xuICBsZXQgaW5zdGFuY2U6IFQ7XG4gIGlmIChpc09uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIoZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlKSkge1xuICAgIGluc3RhbmNlID0gdW53cmFwT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcihkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUpO1xuICAgIHJlY29yZENoYW5nZShkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUsIGRlY2xhcmVkTmFtZSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbmNlID0gZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlO1xuICB9XG4gIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB0byBzdG9yZSB0aGUgaW5pdGlhbCBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdE5vZGU6IFROb2RlKTogSW5pdGlhbElucHV0RGF0YSB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIHx8ICh0Tm9kZS5pbml0aWFsSW5wdXRzID0gW10pO1xuICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG51bGw7XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAvLyBJZiB3ZSBoaXQgU2VsZWN0LU9ubHksIENsYXNzZXMgb3IgU3R5bGVzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkgfHwgYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8XG4gICAgICAgIGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKVxuICAgICAgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGRpcmVjdGl2ZURlZi5pbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9IGRpcmVjdGl2ZURlZi5kZWNsYXJlZElucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKHByaXZhdGVOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChwcml2YXRlTmFtZSwgZGVjbGFyZWROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0IG5hdGl2ZVxuICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgdE5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIGxvY2FsUmVmcywgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlKTtcbiAgfVxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCB0Tm9kZSk7XG4gIHNldElzUGFyZW50KGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgKHROb2RlLnRWaWV3cyA9IFtdKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IGNvbW1lbnQgPSBsVmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMpO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVMQ29udGFpbmVyKGxWaWV3W2FkanVzdGVkSW5kZXhdLCBsVmlldywgY29tbWVudCk7XG5cbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsQ29udGFpbmVyKTtcblxuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWRJbnRlcm5hbCh0Vmlldy5kYXRhLCBpbmRleCkgYXMgVE5vZGU7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcblxuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgZXhlY3V0ZUluaXRIb29rcyhsVmlldywgdFZpZXcsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgdmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGdldExWaWV3KClbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgY29uc3QgbmV4dEluZGV4ID0gbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlcyB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBjdXJyZW50ID0gZ2V0TFZpZXdDaGlsZChsVmlldyk7IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld1xuICAgIC8vIGhlYWRlci5cbiAgICBpZiAoY3VycmVudC5sZW5ndGggPCBIRUFERVJfT0ZGU0VUICYmIGN1cnJlbnRbQUNUSVZFX0lOREVYXSA9PT0gLTEpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXd8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIHRDb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaGRlZi5jb250IGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAvLyBUaGUgcHJldmlvdXMgbm9kZSBjYW4gYmUgYSB2aWV3IG5vZGUgaWYgd2UgYXJlIHByb2Nlc3NpbmcgYW4gaW5saW5lIGZvciBsb29wXG4gIGNvbnN0IGNvbnRhaW5lclROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgISA6XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tjb250YWluZXJUTm9kZS5pbmRleF0gYXMgTENvbnRhaW5lcjtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyVE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBsZXQgdmlld1RvUmVuZGVyID0gc2NhbkZvclZpZXcoXG4gICAgICBsQ29udGFpbmVyLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld1RvUmVuZGVyKSB7XG4gICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBsVmlldyxcbiAgICAgICAgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb25zdHMsIHZhcnMsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlKSwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVWaWV3Tm9kZSh2aWV3QmxvY2tJZCwgdmlld1RvUmVuZGVyKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9XG4gIGlmIChsQ29udGFpbmVyKSB7XG4gICAgaWYgKGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikpIHtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KHZpZXdUb1JlbmRlciwgbENvbnRhaW5lciwgbFZpZXcsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCAtMSk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHZpZXdIb3N0ID0gbFZpZXdbSE9TVF9OT0RFXTtcblxuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldyk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MobFZpZXcpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICBsZWF2ZVZpZXcobFZpZXdbUEFSRU5UXSAhKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ICEpO1xuICBzZXRJc1BhcmVudChmYWxzZSk7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaDxUPihhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoYWRqdXN0ZWRFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxWaWV3W1RWSUVXXS5kYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIHN5bmNWaWV3V2l0aEJsdWVwcmludChob3N0Vmlldyk7XG4gICAgY2hlY2tWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3OiBMVmlldykge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5BdHRhY2hlZCkgPT09IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogSW5zdHJ1Y3Rpb24gdG8gZGlzdHJpYnV0ZSBwcm9qZWN0YWJsZSBub2RlcyBhbW9uZyA8bmctY29udGVudD4gb2NjdXJyZW5jZXMgaW4gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEl0IHRha2VzIGFsbCB0aGUgc2VsZWN0b3JzIGZyb20gdGhlIGVudGlyZSBjb21wb25lbnQncyB0ZW1wbGF0ZSBhbmQgZGVjaWRlcyB3aGVyZVxuICogZWFjaCBwcm9qZWN0ZWQgbm9kZSBiZWxvbmdzIChpdCByZS1kaXN0cmlidXRlcyBub2RlcyBhbW9uZyBcImJ1Y2tldHNcIiB3aGVyZSBlYWNoIFwiYnVja2V0XCIgaXNcbiAqIGJhY2tlZCBieSBhIHNlbGVjdG9yKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlcXVpcmVzIENTUyBzZWxlY3RvcnMgdG8gYmUgcHJvdmlkZWQgaW4gMiBmb3JtczogcGFyc2VkIChieSBhIGNvbXBpbGVyKSBhbmQgdGV4dCxcbiAqIHVuLXBhcnNlZCBmb3JtLlxuICpcbiAqIFRoZSBwYXJzZWQgZm9ybSBpcyBuZWVkZWQgZm9yIGVmZmljaWVudCBtYXRjaGluZyBvZiBhIG5vZGUgYWdhaW5zdCBhIGdpdmVuIENTUyBzZWxlY3Rvci5cbiAqIFRoZSB1bi1wYXJzZWQsIHRleHR1YWwgZm9ybSBpcyBuZWVkZWQgZm9yIHN1cHBvcnQgb2YgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZS5cbiAqXG4gKiBIYXZpbmcgYSBDU1Mgc2VsZWN0b3IgaW4gMiBkaWZmZXJlbnQgZm9ybWF0cyBpcyBub3QgaWRlYWwsIGJ1dCBhbHRlcm5hdGl2ZXMgaGF2ZSBldmVuIG1vcmVcbiAqIGRyYXdiYWNrczpcbiAqIC0gaGF2aW5nIG9ubHkgYSB0ZXh0dWFsIGZvcm0gd291bGQgcmVxdWlyZSBydW50aW1lIHBhcnNpbmcgb2YgQ1NTIHNlbGVjdG9ycztcbiAqIC0gd2UgY2FuJ3QgaGF2ZSBvbmx5IGEgcGFyc2VkIGFzIHdlIGNhbid0IHJlLWNvbnN0cnVjdCB0ZXh0dWFsIGZvcm0gZnJvbSBpdCAoYXMgZW50ZXJlZCBieSBhXG4gKiB0ZW1wbGF0ZSBhdXRob3IpLlxuICpcbiAqIEBwYXJhbSBzZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIHBhcnNlZCBDU1Mgc2VsZWN0b3JzXG4gKiBAcGFyYW0gcmF3U2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBDU1Mgc2VsZWN0b3JzIGluIHRoZSByYXcsIHVuLXBhcnNlZCBmb3JtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGVmKHNlbGVjdG9ycz86IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRWaWV3KGdldExWaWV3KCkpW0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmICghY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgY29uc3Qgbm9PZk5vZGVCdWNrZXRzID0gc2VsZWN0b3JzID8gc2VsZWN0b3JzLmxlbmd0aCArIDEgOiAxO1xuICAgIGNvbnN0IHBEYXRhOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHBEYXRhLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBidWNrZXRJbmRleCA9XG4gICAgICAgICAgc2VsZWN0b3JzID8gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISkgOiAwO1xuICAgICAgY29uc3QgbmV4dE5vZGUgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLm5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBEYXRhW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgfVxuICAgICAgY29tcG9uZW50Q2hpbGQubmV4dCA9IG51bGw7XG4gICAgICB0YWlsc1tidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcblxuICAgICAgY29tcG9uZW50Q2hpbGQgPSBuZXh0Tm9kZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTdGFjayB1c2VkIHRvIGtlZXAgdHJhY2sgb2YgcHJvamVjdGlvbiBub2RlcyBpbiBwcm9qZWN0aW9uKCkgaW5zdHJ1Y3Rpb24uXG4gKlxuICogVGhpcyBpcyBkZWxpYmVyYXRlbHkgY3JlYXRlZCBvdXRzaWRlIG9mIHByb2plY3Rpb24oKSB0byBhdm9pZCBhbGxvY2F0aW5nXG4gKiBhIG5ldyBhcnJheSBlYWNoIHRpbWUgdGhlIGZ1bmN0aW9uIGlzIGNhbGxlZC4gSW5zdGVhZCB0aGUgYXJyYXkgd2lsbCBiZVxuICogcmUtdXNlZCBieSBlYWNoIGludm9jYXRpb24uIFRoaXMgd29ya3MgYmVjYXVzZSB0aGUgZnVuY3Rpb24gaXMgbm90IHJlZW50cmFudC5cbiAqL1xuY29uc3QgcHJvamVjdGlvbk5vZGVTdGFjazogKExWaWV3IHwgVE5vZGUpW10gPSBbXTtcblxuLyoqXG4gKiBJbnNlcnRzIHByZXZpb3VzbHkgcmUtZGlzdHJpYnV0ZWQgcHJvamVjdGVkIG5vZGVzLiBUaGlzIGluc3RydWN0aW9uIG11c3QgYmUgcHJlY2VkZWQgYnkgYSBjYWxsXG4gKiB0byB0aGUgcHJvamVjdGlvbkRlZiBpbnN0cnVjdGlvbi5cbiAqXG4gKiBAcGFyYW0gbm9kZUluZGV4XG4gKiBAcGFyYW0gc2VsZWN0b3JJbmRleDpcbiAqICAgICAgICAtIDAgd2hlbiB0aGUgc2VsZWN0b3IgaXMgYCpgIChvciB1bnNwZWNpZmllZCBhcyB0aGlzIGlzIHRoZSBkZWZhdWx0IHZhbHVlKSxcbiAqICAgICAgICAtIDEgYmFzZWQgaW5kZXggb2YgdGhlIHNlbGVjdG9yIGZyb20gdGhlIHtAbGluayBwcm9qZWN0aW9uRGVmfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbihub2RlSW5kZXg6IG51bWJlciwgc2VsZWN0b3JJbmRleDogbnVtYmVyID0gMCwgYXR0cnM/OiBzdHJpbmdbXSk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRQcm9qZWN0aW9uTm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChub2RlSW5kZXgsIFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBudWxsLCBudWxsLCBhdHRycyB8fCBudWxsKTtcblxuICAvLyBXZSBjYW4ndCB1c2Ugdmlld0RhdGFbSE9TVF9OT0RFXSBiZWNhdXNlIHByb2plY3Rpb24gbm9kZXMgY2FuIGJlIG5lc3RlZCBpbiBlbWJlZGRlZCB2aWV3cy5cbiAgaWYgKHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID09PSBudWxsKSB0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9IHNlbGVjdG9ySW5kZXg7XG5cbiAgLy8gYDxuZy1jb250ZW50PmAgaGFzIG5vIGNvbnRlbnRcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuXG4gIC8vIHJlLWRpc3RyaWJ1dGlvbiBvZiBwcm9qZWN0YWJsZSBub2RlcyBpcyBzdG9yZWQgb24gYSBjb21wb25lbnQncyB2aWV3IGxldmVsXG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50VmlldyhsVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuICBsZXQgbm9kZVRvUHJvamVjdCA9IChjb21wb25lbnROb2RlLnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtzZWxlY3RvckluZGV4XTtcbiAgbGV0IHByb2plY3RlZFZpZXcgPSBjb21wb25lbnRWaWV3W1BBUkVOVF0gITtcbiAgbGV0IHByb2plY3Rpb25Ob2RlSW5kZXggPSAtMTtcblxuICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgIGlmIChub2RlVG9Qcm9qZWN0LnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgICAvLyBUaGlzIG5vZGUgaXMgcmUtcHJvamVjdGVkLCBzbyB3ZSBtdXN0IGdvIHVwIHRoZSB0cmVlIHRvIGdldCBpdHMgcHJvamVjdGVkIG5vZGVzLlxuICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhwcm9qZWN0ZWRWaWV3KTtcbiAgICAgIGNvbnN0IGN1cnJlbnRDb21wb25lbnRIb3N0ID0gY3VycmVudENvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gICAgICBjb25zdCBmaXJzdFByb2plY3RlZE5vZGUgPVxuICAgICAgICAgIChjdXJyZW50Q29tcG9uZW50SG9zdC5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbbm9kZVRvUHJvamVjdC5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICAgIGlmIChmaXJzdFByb2plY3RlZE5vZGUpIHtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gbm9kZVRvUHJvamVjdDtcbiAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gcHJvamVjdGVkVmlldztcblxuICAgICAgICBub2RlVG9Qcm9qZWN0ID0gZmlyc3RQcm9qZWN0ZWROb2RlO1xuICAgICAgICBwcm9qZWN0ZWRWaWV3ID0gY3VycmVudENvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gVGhpcyBmbGFnIG11c3QgYmUgc2V0IG5vdyBvciB3ZSB3b24ndCBrbm93IHRoYXQgdGhpcyBub2RlIGlzIHByb2plY3RlZFxuICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgbm9kZVRvUHJvamVjdC5mbGFncyB8PSBUTm9kZUZsYWdzLmlzUHJvamVjdGVkO1xuICAgICAgYXBwZW5kUHJvamVjdGVkTm9kZShub2RlVG9Qcm9qZWN0LCB0UHJvamVjdGlvbk5vZGUsIGxWaWV3LCBwcm9qZWN0ZWRWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBhcmUgZmluaXNoZWQgd2l0aCBhIGxpc3Qgb2YgcmUtcHJvamVjdGVkIG5vZGVzLCB3ZSBuZWVkIHRvIGdldFxuICAgIC8vIGJhY2sgdG8gdGhlIHJvb3QgcHJvamVjdGlvbiBub2RlIHRoYXQgd2FzIHJlLXByb2plY3RlZC5cbiAgICBpZiAobm9kZVRvUHJvamVjdC5uZXh0ID09PSBudWxsICYmIHByb2plY3RlZFZpZXcgIT09IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhKSB7XG4gICAgICBwcm9qZWN0ZWRWaWV3ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIExWaWV3O1xuICAgICAgbm9kZVRvUHJvamVjdCA9IHByb2plY3Rpb25Ob2RlU3RhY2tbcHJvamVjdGlvbk5vZGVJbmRleC0tXSBhcyBUTm9kZTtcbiAgICB9XG4gICAgbm9kZVRvUHJvamVjdCA9IG5vZGVUb1Byb2plY3QubmV4dDtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KFxuICAgIGxWaWV3OiBMVmlldywgYWRqdXN0ZWRIb3N0SW5kZXg6IG51bWJlciwgc3RhdGU6IFQpOiBUIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKTtcbiAgaWYgKGxWaWV3W1RBSUxdKSB7XG4gICAgbFZpZXdbVEFJTF0gIVtORVhUXSA9IHN0YXRlO1xuICB9IGVsc2UgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuY2hpbGRJbmRleCA9IGFkanVzdGVkSG9zdEluZGV4O1xuICB9XG4gIGxWaWV3W1RBSUxdID0gc3RhdGU7XG4gIHJldHVybiBzdGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlldyBkaXJ0eS4gKi9cbmZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG4vKiogV3JhcHMgYW4gZXZlbnQgbGlzdGVuZXIgd2l0aCBwcmV2ZW50RGVmYXVsdCBiZWhhdmlvci4gKi9cbmZ1bmN0aW9uIHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55KTogRXZlbnRMaXN0ZW5lciB7XG4gIHJldHVybiBmdW5jdGlvbiB3cmFwTGlzdGVuZXJJbl9wcmV2ZW50RGVmYXVsdChlOiBFdmVudCkge1xuICAgIGlmIChsaXN0ZW5lckZuKGUpID09PSBmYWxzZSkge1xuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgLy8gTmVjZXNzYXJ5IGZvciBsZWdhY3kgYnJvd3NlcnMgdGhhdCBkb24ndCBzdXBwb3J0IHByZXZlbnREZWZhdWx0IChlLmcuIElFKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlO1xuICAgIH1cbiAgfTtcbn1cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlldyB7XG4gIHdoaWxlIChsVmlldyAmJiAhKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSkge1xuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGxWaWV3ID0gbFZpZXdbUEFSRU5UXSAhO1xuICB9XG4gIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2s8VD4ocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbi8qKlxuICogVXNlZCB0byBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFRoaXMgaXMgZXF1aXZhbGVudCB0byBgZGV0ZWN0Q2hhbmdlc2AsIGJ1dCBpbnZva2VkIG9uIHJvb3QgY29tcG9uZW50LiBBZGRpdGlvbmFsbHksIGB0aWNrYFxuICogZXhlY3V0ZXMgbGlmZWN5Y2xlIGhvb2tzIGFuZCBjb25kaXRpb25hbGx5IGNoZWNrcyBjb21wb25lbnRzIGJhc2VkIG9uIHRoZWlyXG4gKiBgQ2hhbmdlRGV0ZWN0aW9uU3RyYXRlZ3lgIGFuZCBkaXJ0aW5lc3MuXG4gKlxuICogVGhlIHByZWZlcnJlZCB3YXkgdG8gdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uIGlzIHRvIGNhbGwgYG1hcmtEaXJ0eWAuIGBtYXJrRGlydHlgIGludGVybmFsbHlcbiAqIHNjaGVkdWxlcyBgdGlja2AgdXNpbmcgYSBzY2hlZHVsZXIgaW4gb3JkZXIgdG8gY29hbGVzY2UgbXVsdGlwbGUgYG1hcmtEaXJ0eWAgY2FsbHMgaW50byBhXG4gKiBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBydW4uIEJ5IGRlZmF1bHQsIHRoZSBzY2hlZHVsZXIgaXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAsIGJ1dCBjYW5cbiAqIGJlIGNoYW5nZWQgd2hlbiBjYWxsaW5nIGByZW5kZXJDb21wb25lbnRgIGFuZCBwcm92aWRpbmcgdGhlIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRpY2s8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHJvb3RWaWV3ID0gZ2V0Um9vdFZpZXcoY29tcG9uZW50KTtcbiAgY29uc3Qgcm9vdENvbnRleHQgPSByb290Vmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dDtcbiAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbn1cblxuZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKHJlYWRQYXRjaGVkTFZpZXcocm9vdENvbXBvbmVudCkgISwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIGNvbXBvbmVudCAoYW5kIHBvc3NpYmx5IGl0cyBzdWItY29tcG9uZW50cykuXG4gKlxuICogVGhpcyBmdW5jdGlvbiB0cmlnZ2VycyBjaGFuZ2UgZGV0ZWN0aW9uIGluIGEgc3luY2hyb25vdXMgd2F5IG9uIGEgY29tcG9uZW50LiBUaGVyZSBzaG91bGRcbiAqIGJlIHZlcnkgbGl0dGxlIHJlYXNvbiB0byBjYWxsIHRoaXMgZnVuY3Rpb24gZGlyZWN0bHkgc2luY2UgYSBwcmVmZXJyZWQgd2F5IHRvIGRvIGNoYW5nZVxuICogZGV0ZWN0aW9uIGlzIHRvIHtAbGluayBtYXJrRGlydHl9IHRoZSBjb21wb25lbnQgYW5kIHdhaXQgZm9yIHRoZSBzY2hlZHVsZXIgdG8gY2FsbCB0aGlzIG1ldGhvZFxuICogYXQgc29tZSBmdXR1cmUgcG9pbnQgaW4gdGltZS4gVGhpcyBpcyBiZWNhdXNlIGEgc2luZ2xlIHVzZXIgYWN0aW9uIG9mdGVuIHJlc3VsdHMgaW4gbWFueVxuICogY29tcG9uZW50cyBiZWluZyBpbnZhbGlkYXRlZCBhbmQgY2FsbGluZyBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGVhY2ggY29tcG9uZW50IHN5bmNocm9ub3VzbHlcbiAqIHdvdWxkIGJlIGluZWZmaWNpZW50LiBJdCBpcyBiZXR0ZXIgdG8gd2FpdCB1bnRpbCBhbGwgY29tcG9uZW50cyBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZFxuICogdGhlbiBwZXJmb3JtIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIGFjcm9zcyBhbGwgb2YgdGhlIGNvbXBvbmVudHNcbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50IFRoZSBjb21wb25lbnQgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpICE7XG4gIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih2aWV3LCBjb21wb25lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG5cbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgaWYgKGlzQ3JlYXRpb25Nb2RlKHZpZXcpKSB7XG4gICAgY2hlY2tWaWV3KHZpZXcsIGNvbnRleHQpOyAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gIH1cbiAgY2hlY2tWaWV3KHZpZXcsIGNvbnRleHQpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuXG4gIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXMoY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVmlldzxUPihob3N0VmlldzogTFZpZXcsIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W0hPU1RfTk9ERV0pO1xuICBjb25zdCB0ZW1wbGF0ZUZuID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IGhvc3RUVmlldy52aWV3UXVlcnk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXcsIGNvbXBvbmVudCk7XG4gICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0Vmlldyk7XG4gICAgdXBkYXRlVmlld1F1ZXJ5KHZpZXdRdWVyeSwgaG9zdFZpZXcsIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdRdWVyeTxUPih2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgdmlldzogTFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmIGlzQ3JlYXRpb25Nb2RlKHZpZXcpKSB7XG4gICAgdmlld1F1ZXJ5KFJlbmRlckZsYWdzLkNyZWF0ZSwgY29tcG9uZW50KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGVWaWV3UXVlcnk8VD4odmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTx7fT58IG51bGwsIHZpZXc6IExWaWV3LCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgaWYgKHZpZXdRdWVyeSAmJiAhaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cblxuLyoqXG4gKiBNYXJrIHRoZSBjb21wb25lbnQgYXMgZGlydHkgKG5lZWRpbmcgY2hhbmdlIGRldGVjdGlvbikuXG4gKlxuICogTWFya2luZyBhIGNvbXBvbmVudCBkaXJ0eSB3aWxsIHNjaGVkdWxlIGEgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGlzXG4gKiBjb21wb25lbnQgYXQgc29tZSBwb2ludCBpbiB0aGUgZnV0dXJlLiBNYXJraW5nIGFuIGFscmVhZHkgZGlydHlcbiAqIGNvbXBvbmVudCBhcyBkaXJ0eSBpcyBhIG5vb3AuIE9ubHkgb25lIG91dHN0YW5kaW5nIGNoYW5nZSBkZXRlY3Rpb25cbiAqIGNhbiBiZSBzY2hlZHVsZWQgcGVyIGNvbXBvbmVudCB0cmVlLiAoVHdvIGNvbXBvbmVudHMgYm9vdHN0cmFwcGVkIHdpdGhcbiAqIHNlcGFyYXRlIGByZW5kZXJDb21wb25lbnRgIHdpbGwgaGF2ZSBzZXBhcmF0ZSBzY2hlZHVsZXJzKVxuICpcbiAqIFdoZW4gdGhlIHJvb3QgY29tcG9uZW50IGlzIGJvb3RzdHJhcHBlZCB3aXRoIGByZW5kZXJDb21wb25lbnRgLCBhIHNjaGVkdWxlclxuICogY2FuIGJlIHByb3ZpZGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgQ29tcG9uZW50IHRvIG1hcmsgYXMgZGlydHkuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0RpcnR5PFQ+KGNvbXBvbmVudDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb21wb25lbnQsICdjb21wb25lbnQnKTtcbiAgY29uc3Qgcm9vdFZpZXcgPSBtYXJrVmlld0RpcnR5KGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCkpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHJvb3RWaWV3W0NPTlRFWFRdLCAncm9vdENvbnRleHQgc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgc2NoZWR1bGVUaWNrKHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXMpO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgc2luZ2xlIHZhbHVlIGJpbmRpbmcuXG4gKlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIGRpZmZcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJpbmQ8VD4odmFsdWU6IFQpOiBUfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgcmV0dXJuIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBsVmlld1tCSU5ESU5HX0lOREVYXSsrLCB2YWx1ZSkgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgdGhlIG5lY2Vzc2FyeSBhbW91bnQgb2Ygc2xvdHMgZm9yIGhvc3QgdmFycy5cbiAqXG4gKiBAcGFyYW0gY291bnQgQW1vdW50IG9mIHZhcnMgdG8gYmUgYWxsb2NhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0hvc3RWYXJzKGNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKCFnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSByZXR1cm47XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIHF1ZXVlSG9zdEJpbmRpbmdGb3JDaGVjayh0VmlldywgZ2V0Q3VycmVudERpcmVjdGl2ZURlZigpICEsIGNvdW50KTtcbiAgcHJlZmlsbEhvc3RWYXJzKHRWaWV3LCBsVmlldywgY291bnQpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBpbnRlcnBvbGF0aW9uIGJpbmRpbmdzIHdpdGggYSB2YXJpYWJsZSBudW1iZXIgb2YgZXhwcmVzc2lvbnMuXG4gKlxuICogSWYgdGhlcmUgYXJlIDEgdG8gOCBleHByZXNzaW9ucyBgaW50ZXJwb2xhdGlvbjEoKWAgdG8gYGludGVycG9sYXRpb244KClgIHNob3VsZCBiZSB1c2VkIGluc3RlYWQuXG4gKiBUaG9zZSBhcmUgZmFzdGVyIGJlY2F1c2UgdGhlcmUgaXMgbm8gbmVlZCB0byBjcmVhdGUgYW4gYXJyYXkgb2YgZXhwcmVzc2lvbnMgYW5kIGl0ZXJhdGUgb3ZlciBpdC5cbiAqXG4gKiBgdmFsdWVzYDpcbiAqIC0gaGFzIHN0YXRpYyB0ZXh0IGF0IGV2ZW4gaW5kZXhlcyxcbiAqIC0gaGFzIGV2YWx1YXRlZCBleHByZXNzaW9ucyBhdCBvZGQgaW5kZXhlcy5cbiAqXG4gKiBSZXR1cm5zIHRoZSBjb25jYXRlbmF0ZWQgc3RyaW5nIHdoZW4gYW55IG9mIHRoZSBhcmd1bWVudHMgY2hhbmdlcywgYE5PX0NIQU5HRWAgb3RoZXJ3aXNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvblYodmFsdWVzOiBhbnlbXSk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TGVzc1RoYW4oMiwgdmFsdWVzLmxlbmd0aCwgJ3Nob3VsZCBoYXZlIGF0IGxlYXN0IDMgdmFsdWVzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh2YWx1ZXMubGVuZ3RoICUgMiwgMSwgJ3Nob3VsZCBoYXZlIGFuIG9kZCBudW1iZXIgb2YgdmFsdWVzJyk7XG4gIGxldCBkaWZmZXJlbnQgPSBmYWxzZTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuXG4gIGxldCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAvLyBDaGVjayBpZiBiaW5kaW5ncyAob2RkIGluZGV4ZXMpIGhhdmUgY2hhbmdlZFxuICAgIGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBiaW5kaW5nSW5kZXgrKywgdmFsdWVzW2ldKSAmJiAoZGlmZmVyZW50ID0gdHJ1ZSk7XG4gIH1cbiAgbFZpZXdbQklORElOR19JTkRFWF0gPSBiaW5kaW5nSW5kZXg7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgbFZpZXdbQklORElOR19JTkRFWF0sIHYwKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gMTtcbiAgcmV0dXJuIGRpZmZlcmVudCA/IHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBzdWZmaXggOiBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDIgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjIoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBsVmlld1tCSU5ESU5HX0lOREVYXSwgdjAsIHYxKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gMjtcblxuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIGkwICsgcmVuZGVyU3RyaW5naWZ5KHYxKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gMztcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEsIHYyLCB2Myk7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDQ7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNTtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDYgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA3IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb243KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfFxuICAgIE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNztcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIGk1ICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDg7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBpNSArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHY2KSArIGk2ICsgcmVuZGVyU3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIGxWaWV3W2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBnZXRDb250ZXh0TFZpZXcoKTtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihjb250ZXh0TFZpZXcsIGluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBsVmlld1tDT05URU5UX1FVRVJJRVNdLCAnQ29udGVudCBRdWVyeUxpc3QgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIHF1ZXJ5LicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSAhLCBxdWVyeUxpc3RJZHgpO1xuXG4gIHJldHVybiBsVmlld1tDT05URU5UX1FVRVJJRVNdICFbcXVlcnlMaXN0SWR4XTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gY3VycmVudCBgdmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGdldExWaWV3KCksIGluZGV4KTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRElcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgZ2V0TFZpZXcoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBGYWNhZGUgZm9yIHRoZSBhdHRyaWJ1dGUgaW5qZWN0aW9uIGZyb20gREkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gaW5qZWN0QXR0cmlidXRlSW1wbChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgYXR0ck5hbWVUb0luamVjdCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZW50UXVlcnk8UT4oXG4gICAgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8UT4sIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSB2aWV3RGF0YVtUVklFV107XG4gIGNvbnN0IHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggPVxuICAgICAgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gfHwgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gPSBbXSkpLnB1c2gocXVlcnlMaXN0KTtcbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMl0gOiAtMTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKGN1cnJlbnREaXJlY3RpdmVJbmRleCwgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGU6IFROb2RlIHwgbnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgLy8gSWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZC5cbiAgaWYgKHROb2RlKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gICAgfVxuICAgIHJldHVybiB0Tm9kZS5pbnB1dHM7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiBnZXRMVmlldygpIGFzIGFueSBhcyBPcGFxdWVWaWV3U3RhdGU7XG59XG5cbmZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG5cbi8qKlxuICogVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgbmVlZHMgdG8gYmUgaW5jbHVkZWRcbiAqIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXIgKHNlZSB0aGUgY29tcG9uZW50U3ludGhldGljSG9zdCogaW5zdHJ1Y3Rpb25zKS5cbiAqL1xuZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG4iXX0=