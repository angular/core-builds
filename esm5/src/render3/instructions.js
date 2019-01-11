/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { resolveForwardRef } from '../di/forward_ref';
import { InjectFlags } from '../di/injector_compatibility';
import { assertDataInRange, assertDefined, assertEqual, assertLessThan, assertNotEqual } from '../util/assert';
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
import { findComponentView, getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getRootContext, getRootView, getTNode, isComponent, isComponentDef, loadInternal, readElementValue, readPatchedLView, stringify } from './util';
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
    setIsParent(true);
    setPreviousOrParentTNode(null);
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
    try {
        if (normalExecutionPath && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (isCreationMode(hostView)) {
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
        if (normalExecutionPath && rendererFactory.end) {
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
    invokeDirectivesHostBindings(tView, viewData, previousOrParentTNode);
    saveResolvedLocalsInData(viewData, previousOrParentTNode, localRefExtractor);
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
function setUpAttributes(native, attrs) {
    var renderer = getLView()[RENDERER];
    var isProc = isProceduralRenderer(renderer);
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i++];
        if (typeof attrName == 'number') {
            if (attrName === 0 /* NamespaceURI */) {
                // Namespaced attributes
                var namespaceURI = attrs[i++];
                var attrName_1 = attrs[i++];
                var attrVal = attrs[i++];
                ngDevMode && ngDevMode.rendererSetAttribute++;
                isProc ?
                    renderer
                        .setAttribute(native, attrName_1, attrVal, namespaceURI) :
                    native.setAttributeNS(namespaceURI, attrName_1, attrVal);
            }
            else {
                // All other `AttributeMarker`s are ignored here.
                break;
            }
        }
        else {
            /// attrName is string;
            var attrVal = attrs[i++];
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
        var renderer = lView[RENDERER];
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
                var subscription = directive[minifiedName].subscribe(listenerFn);
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
            var strValue = sanitizer == null ? stringify(value) : sanitizer(value, tNode.tagName || '', name);
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
 * evaluated with the sub components renderer (because that's where the animation
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
function loadComponentRenderer(tNode, lView) {
    var componentLView = lView[tNode.index];
    return componentLView[RENDERER];
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
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value, tNode.tagName || '', propName) : value;
        ngDevMode && ngDevMode.rendererSetProperty++;
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
 * Assign static styling values to a host element.
 *
 * NOTE: This instruction is meant to used from `hostBindings` function only.
 *
 * @param directive A directive instance the styling is associated with.
 * @param attrs An array containing class and styling information. The values must be marked with
 *              `AttributeMarker`.
 *
 *        ```
 *        var attrs = [AttributeMarker.Classes, 'foo', 'bar',
 *                     AttributeMarker.Styles, 'width', '100px', 'height, '200px']
 *        elementHostAttrs(directive, attrs);
 *        ```
 *
 * @publicApi
 */
export function elementHostAttrs(directive, attrs) {
    var tNode = getPreviousOrParentTNode();
    if (!tNode.stylingTemplate) {
        tNode.stylingTemplate = initializeStaticStylingContext(attrs);
    }
    patchContextWithStaticAttrs(tNode.stylingTemplate, attrs, directive);
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
    var lView = getLView();
    var different = bindingUpdated(lView, lView[BINDING_INDEX], v0);
    lView[BINDING_INDEX] += 1;
    return different ? prefix + stringify(v0) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 2 expressions. */
export function interpolation2(prefix, v0, i0, v1, suffix) {
    var lView = getLView();
    var different = bindingUpdated2(lView, lView[BINDING_INDEX], v0, v1);
    lView[BINDING_INDEX] += 2;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + suffix : NO_CHANGE;
}
/** Creates an interpolation binding with 3 expressions. */
export function interpolation3(prefix, v0, i0, v1, i1, v2, suffix) {
    var lView = getLView();
    var different = bindingUpdated3(lView, lView[BINDING_INDEX], v0, v1, v2);
    lView[BINDING_INDEX] += 3;
    return different ? prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + suffix :
        NO_CHANGE;
}
/** Create an interpolation binding with 4 expressions. */
export function interpolation4(prefix, v0, i0, v1, i1, v2, i2, v3, suffix) {
    var lView = getLView();
    var different = bindingUpdated4(lView, lView[BINDING_INDEX], v0, v1, v2, v3);
    lView[BINDING_INDEX] += 4;
    return different ?
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) +
            suffix :
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
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + suffix :
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
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + suffix :
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
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + suffix :
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
        prefix + stringify(v0) + i0 + stringify(v1) + i1 + stringify(v2) + i2 + stringify(v3) + i3 +
            stringify(v4) + i4 + stringify(v5) + i5 + stringify(v6) + i6 + stringify(v7) + suffix :
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFHcEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBS3pELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGNBQWMsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM3RyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUV6RixPQUFPLEVBQUMsZUFBZSxFQUFFLHNCQUFzQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2pFLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFDN0YsT0FBTyxFQUFDLGVBQWUsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ2hGLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSxxQkFBcUIsRUFBRSw4QkFBOEIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLE1BQU0sQ0FBQztBQUN2SSxPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDckQsT0FBTyxFQUFDLFlBQVksRUFBRSxnQkFBZ0IsRUFBRSxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN0RyxPQUFPLEVBQUMsWUFBWSxFQUFjLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXZFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHVCQUF1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ZUFBZSxDQUFDLElBQVc7SUFDbEMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUMsQ0FBQztBQUMzRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7UXVlcnlMaXN0fSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi91dGlsL25nX3JlZmxlY3QnO1xuXG5pbXBvcnQge2Fzc2VydEhhc1BhcmVudCwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtiaW5kaW5nVXBkYXRlZCwgYmluZGluZ1VwZGF0ZWQyLCBiaW5kaW5nVXBkYXRlZDMsIGJpbmRpbmdVcGRhdGVkNH0gZnJvbSAnLi9iaW5kaW5ncyc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2V9IGZyb20gJy4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSwgaW5qZWN0QXR0cmlidXRlSW1wbH0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIGV4ZWN1dGVJbml0SG9va3MsIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MsIHJlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0FDVElWRV9JTkRFWCwgTENvbnRhaW5lciwgVklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFF1ZXJ5LCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNWYWx1ZSwgUHJvcGVydHlBbGlhc2VzLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1BsYXllckZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9wbGF5ZXInO1xuaW1wb3J0IHtDc3NTZWxlY3Rvckxpc3QsIE5HX1BST0pFQ1RfQVNfQVRUUl9OQU1FfSBmcm9tICcuL2ludGVyZmFjZXMvcHJvamVjdGlvbic7XG5pbXBvcnQge0xRdWVyaWVzfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtHbG9iYWxUYXJnZXRSZXNvbHZlciwgUHJvY2VkdXJhbFJlbmRlcmVyMywgUkNvbW1lbnQsIFJFbGVtZW50LCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDTEVBTlVQLCBDT05UQUlORVJfSU5ERVgsIENPTlRFTlRfUVVFUklFUywgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBPcGFxdWVWaWV3U3RhdGUsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFRBSUwsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FwcGVuZENoaWxkLCBhcHBlbmRQcm9qZWN0ZWROb2RlLCBjcmVhdGVUZXh0Tm9kZSwgZ2V0TFZpZXdDaGlsZCwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0LCBtYXRjaGluZ1NlbGVjdG9ySW5kZXh9IGZyb20gJy4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7T25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlciwgaXNPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyLCByZWNvcmRDaGFuZ2UsIHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXJ9IGZyb20gJy4vb25jaGFuZ2VzX3V0aWwnO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRDb250ZXh0TFZpZXcsIGdldEN1cnJlbnREaXJlY3RpdmVEZWYsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRGaXJzdFRlbXBsYXRlUGFzcywgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGluY3JlYXNlRWxlbWVudERlcHRoQ291bnQsIGlzQ3JlYXRpb25Nb2RlLCBsZWF2ZVZpZXcsIG5leHRDb250ZXh0SW1wbCwgcmVzZXRDb21wb25lbnRTdGF0ZSwgc2V0QmluZGluZ1Jvb3QsIHNldENoZWNrTm9DaGFuZ2VzTW9kZSwgc2V0Q3VycmVudERpcmVjdGl2ZURlZiwgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MsIHNldElzUGFyZW50LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGV9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUsIGluaXRpYWxpemVTdGF0aWNDb250ZXh0IGFzIGluaXRpYWxpemVTdGF0aWNTdHlsaW5nQ29udGV4dCwgcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzLCByZW5kZXJJbml0aWFsU3R5bGVzQW5kQ2xhc3NlcywgcmVuZGVyU3R5bGluZywgdXBkYXRlQ2xhc3NQcm9wIGFzIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AsIHVwZGF0ZUNvbnRleHRXaXRoQmluZGluZ3MsIHVwZGF0ZVN0eWxlUHJvcCBhcyB1cGRhdGVFbGVtZW50U3R5bGVQcm9wLCB1cGRhdGVTdHlsaW5nTWFwfSBmcm9tICcuL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7Qm91bmRQbGF5ZXJGYWN0b3J5fSBmcm9tICcuL3N0eWxpbmcvcGxheWVyX2ZhY3RvcnknO1xuaW1wb3J0IHtjcmVhdGVFbXB0eVN0eWxpbmdDb250ZXh0LCBnZXRTdHlsaW5nQ29udGV4dCwgaGFzQ2xhc3NJbnB1dCwgaGFzU3R5bGluZywgaXNBbmltYXRpb25Qcm9wfSBmcm9tICcuL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi90b2tlbnMnO1xuaW1wb3J0IHtmaW5kQ29tcG9uZW50VmlldywgZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFJvb3RDb250ZXh0LCBnZXRSb290VmlldywgZ2V0VE5vZGUsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgbG9hZEludGVybmFsLCByZWFkRWxlbWVudFZhbHVlLCByZWFkUGF0Y2hlZExWaWV3LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9IFByb21pc2UucmVzb2x2ZShudWxsKTtcblxuY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBlbWJlZGRlZCB2aWV3cywgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0XG4gKiBiaW5kaW5ncywgcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcbiAgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MoZmFsc2UpO1xuXG4gIC8vIElmIHRoaXMgaXMgYSBjcmVhdGlvbiBwYXNzLCB3ZSBzaG91bGQgbm90IGNhbGwgbGlmZWN5Y2xlIGhvb2tzIG9yIGV2YWx1YXRlIGJpbmRpbmdzLlxuICAvLyBUaGlzIHdpbGwgYmUgZG9uZSBpbiB0aGUgdXBkYXRlIHBhc3MuXG4gIGlmICghaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgICBleGVjdXRlSW5pdEhvb2tzKGxWaWV3LCB0VmlldywgY2hlY2tOb0NoYW5nZXNNb2RlKTtcblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcpO1xuXG4gICAgZXhlY3V0ZUhvb2tzKGxWaWV3LCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUpO1xuXG4gICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICBsZXQgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gLTE7XG4gICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9uID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBtZWFuIHRoYXQgd2UgYXJlIHN0YXJ0aW5nIG5ldyBFWFBBTkRPIGJsb2NrIGFuZCBuZWVkIHRvIHVwZGF0ZVxuICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICBjdXJyZW50RWxlbWVudEluZGV4ID0gLWluc3RydWN0aW9uO1xuICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICBjb25zdCBwcm92aWRlckNvdW50ID0gKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbKytpXSBhcyBudW1iZXIpO1xuICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgIC8vICh0byBnZXQgdG8gdGhlIG5leHQgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKS5cbiAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgaWYgKGluc3RydWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIGluc3RydWN0aW9uKFxuICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGUsIHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIodmlld0RhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XSksXG4gICAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNvbnRlbnQgcXVlcmllcyBmb3IgYWxsIGRpcmVjdGl2ZXMgaW4gdGhlIGdpdmVuIHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllc1JlZnJlc2ggIShcbiAgICAgICAgICBkaXJlY3RpdmVEZWZJZHggLSBIRUFERVJfT0ZGU0VULCB0Vmlldy5jb250ZW50UXVlcmllc1tpICsgMV0pO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXcgfCBudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncyxcbiAgICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzIHwgbnVsbCwgcmVuZGVyZXI/OiBSZW5kZXJlcjMgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwsIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuUnVuSW5pdCB8XG4gICAgICBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLCAnUmVuZGVyZXJGYWN0b3J5IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSXSwgJ1JlbmRlcmVyIGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbU0FOSVRJWkVSXSB8fCBudWxsICE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZcbiAgICBUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oYWRqdXN0ZWRJbmRleCwgbFZpZXcubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHdpdGggbnVsbGApO1xuICBsVmlld1thZGp1c3RlZEluZGV4XSA9IG5hdGl2ZTtcblxuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIC8vIFRPRE8obWlza28pOiBSZWZhY3RvciBjcmVhdGVUTm9kZSBzbyB0aGF0IGl0IGRvZXMgbm90IGRlcGVuZCBvbiBMVmlldy5cbiAgICB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVUTm9kZShsVmlldywgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMsIG51bGwpO1xuICB9XG5cbiAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gIC8vIFdlIG5lZWQgdGhpcyBldmVuIGlmIHROb2RlIGV4aXN0cywgb3RoZXJ3aXNlIHdlIG1pZ2h0IGVuZCB1cCBwb2ludGluZyB0byB1bmV4aXN0aW5nIHROb2RlcyB3aGVuXG4gIC8vIHdlIHVzZSBpMThuIChlc3BlY2lhbGx5IHdpdGggSUNVIGV4cHJlc3Npb25zIHRoYXQgdXBkYXRlIHRoZSBET00gZHVyaW5nIHRoZSB1cGRhdGUgcGhhc2UpLlxuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmXG4gICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09IG51bGwpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cblxuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVmlld05vZGUoaW5kZXg6IG51bWJlciwgdmlldzogTFZpZXcpIHtcbiAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICBpZiAodmlld1tUVklFV10ubm9kZSA9PSBudWxsKSB7XG4gICAgdmlld1tUVklFV10ubm9kZSA9IGNyZWF0ZVROb2RlKHZpZXcsIFROb2RlVHlwZS5WaWV3LCBpbmRleCwgbnVsbCwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICB9XG5cbiAgcmV0dXJuIHZpZXdbSE9TVF9OT0RFXSA9IHZpZXdbVFZJRVddLm5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCsrO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgICB2aWV3LnB1c2gobnVsbCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGhvc3RWaWV3OiBMVmlldyB8IG51bGwsXG4gICAgZGlyZWN0aXZlcz86IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlcz86IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsKTogTFZpZXcge1xuICBpZiAoaG9zdFZpZXcgPT0gbnVsbCkge1xuICAgIHJlc2V0Q29tcG9uZW50U3RhdGUoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG51bGwsIG51bGwpO1xuXG4gICAgLy8gV2UgbmVlZCB0byBjcmVhdGUgYSByb290IHZpZXcgc28gaXQncyBwb3NzaWJsZSB0byBsb29rIHVwIHRoZSBob3N0IGVsZW1lbnQgdGhyb3VnaCBpdHMgaW5kZXhcbiAgICBjb25zdCBob3N0TFZpZXcgPSBjcmVhdGVMVmlldyhcbiAgICAgICAgbnVsbCwgY3JlYXRlVFZpZXcoLTEsIG51bGwsIDEsIDAsIG51bGwsIG51bGwsIG51bGwpLCB7fSxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuSXNSb290LCBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXIpO1xuICAgIGVudGVyVmlldyhob3N0TFZpZXcsIG51bGwpOyAgLy8gU1VTUEVDVCEgd2h5IGRvIHdlIG5lZWQgdG8gZW50ZXIgdGhlIFZpZXc/XG5cbiAgICBjb25zdCBjb21wb25lbnRUVmlldyA9XG4gICAgICAgIGdldE9yQ3JlYXRlVFZpZXcodGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzIHx8IG51bGwsIHBpcGVzIHx8IG51bGwsIG51bGwpO1xuICAgIGhvc3RWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIGhvc3RMVmlldywgY29tcG9uZW50VFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LFxuICAgICAgICByZW5kZXJlciwgc2FuaXRpemVyKTtcbiAgICBob3N0Vmlld1tIT1NUX05PREVdID0gY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsKTtcbiAgfVxuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGhvc3RWaWV3LCBjb250ZXh0LCB0ZW1wbGF0ZUZuKTtcbiAgcmV0dXJuIGhvc3RWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIHF1ZXJpZXM6IExRdWVyaWVzIHwgbnVsbCxcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEpO1xuXG4gIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoZGVjbGFyYXRpb25WaWV3LCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmNyZWF0ZVZpZXcoKTtcbiAgfVxuICBjcmVhdGVWaWV3Tm9kZSgtMSwgbFZpZXcpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lm5vZGUgIS5pbmplY3RvckluZGV4ID0gaW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIHNldElzUGFyZW50KF9pc1BhcmVudCk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPih2aWV3VG9SZW5kZXI6IExWaWV3LCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG4gIGxldCBvbGRWaWV3OiBMVmlldztcbiAgaWYgKHZpZXdUb1JlbmRlcltGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQoZ2V0Um9vdENvbnRleHQodmlld1RvUmVuZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgdHJ5IHtcbiAgICAgIHNldElzUGFyZW50KHRydWUpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISk7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbSE9TVF9OT0RFXSk7XG4gICAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKGdldFJlbmRlckZsYWdzKHZpZXdUb1JlbmRlciksIGNvbnRleHQpO1xuICAgICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuICAgICAgc2V0Rmlyc3RUZW1wbGF0ZVBhc3MoZmFsc2UpO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEpO1xuICAgICAgc2V0SXNQYXJlbnQoX2lzUGFyZW50KTtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYSBjb250ZXh0IGF0IHRoZSBsZXZlbCBzcGVjaWZpZWQgYW5kIHNhdmVzIGl0IGFzIHRoZSBnbG9iYWwsIGNvbnRleHRWaWV3RGF0YS5cbiAqIFdpbGwgZ2V0IHRoZSBuZXh0IGxldmVsIHVwIGlmIGxldmVsIGlzIG5vdCBzcGVjaWZpZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIHRvIHNhdmUgY29udGV4dHMgb2YgcGFyZW50IHZpZXdzIHNvIHRoZXkgY2FuIGJlIGJvdW5kIGluIGVtYmVkZGVkIHZpZXdzLCBvclxuICogaW4gY29uanVuY3Rpb24gd2l0aCByZWZlcmVuY2UoKSB0byBiaW5kIGEgcmVmIGZyb20gYSBwYXJlbnQgdmlldy5cbiAqXG4gKiBAcGFyYW0gbGV2ZWwgVGhlIHJlbGF0aXZlIGxldmVsIG9mIHRoZSB2aWV3IGZyb20gd2hpY2ggdG8gZ3JhYiBjb250ZXh0IGNvbXBhcmVkIHRvIGNvbnRleHRWZXdEYXRhXG4gKiBAcmV0dXJucyBjb250ZXh0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBuZXh0Q29udGV4dDxUID0gYW55PihsZXZlbDogbnVtYmVyID0gMSk6IFQge1xuICByZXR1cm4gbmV4dENvbnRleHRJbXBsKGxldmVsKTtcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIHRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBob3N0Vmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG5cbiAgICBpZiAoaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpKSB7XG4gICAgICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICAgIGlmICh0ZW1wbGF0ZUZuKSB7XG4gICAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgICAgdGVtcGxhdGVGbihSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQgISk7XG4gICAgICB9XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICAgICAgaG9zdFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gICAgdGVtcGxhdGVGbiAmJiB0ZW1wbGF0ZUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCAhKTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIFVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5LlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXcpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIDogUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBOYW1lc3BhY2Vcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmxldCBfY3VycmVudE5hbWVzcGFjZTogc3RyaW5nfG51bGwgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlU1ZHKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VNYXRoTUwoKSB7XG4gIF9jdXJyZW50TmFtZXNwYWNlID0gJ2h0dHA6Ly93d3cudzMub3JnLzE5OTgvTWF0aE1MLyc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBuYW1lc3BhY2VIVE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9IG51bGw7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhbiBlbXB0eSBlbGVtZW50IHVzaW5nIHtAbGluayBlbGVtZW50U3RhcnR9IGFuZCB7QGxpbmsgZWxlbWVudEVuZH1cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhlIERPTSBOb2RlXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljYWxseSBib3VuZCBzZXQgb2YgYXR0cmlidXRlcywgY2xhc3NlcywgYW5kIHN0eWxlcyB0byBiZSB3cml0dGVuIGludG8gdGhlIERPTVxuICogICAgICAgICAgICAgIGVsZW1lbnQgb24gY3JlYXRpb24uIFVzZSBbQXR0cmlidXRlTWFya2VyXSB0byBkZW5vdGUgdGhlIG1lYW5pbmcgb2YgdGhpcyBhcnJheS5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgZWxlbWVudFN0YXJ0KGluZGV4LCBuYW1lLCBhdHRycywgbG9jYWxSZWZzKTtcbiAgZWxlbWVudEVuZCgpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBsb2dpY2FsIGNvbnRhaW5lciBmb3Igb3RoZXIgbm9kZXMgKDxuZy1jb250YWluZXI+KSBiYWNrZWQgYnkgYSBjb21tZW50IG5vZGUgaW4gdGhlIERPTS5cbiAqIFRoZSBpbnN0cnVjdGlvbiBtdXN0IGxhdGVyIGJlIGZvbGxvd2VkIGJ5IGBlbGVtZW50Q29udGFpbmVyRW5kKClgIGNhbGwuXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBMVmlldyBhcnJheVxuICogQHBhcmFtIGF0dHJzIFNldCBvZiBhdHRyaWJ1dGVzIHRvIGJlIHVzZWQgd2hlbiBtYXRjaGluZyBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGxvY2FsUmVmcyBBIHNldCBvZiBsb2NhbCByZWZlcmVuY2UgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuXG4gKlxuICogRXZlbiBpZiB0aGlzIGluc3RydWN0aW9uIGFjY2VwdHMgYSBzZXQgb2YgYXR0cmlidXRlcyBubyBhY3R1YWwgYXR0cmlidXRlIHZhbHVlcyBhcmUgcHJvcGFnYXRlZCB0b1xuICogdGhlIERPTSAoYXMgYSBjb21tZW50IG5vZGUgY2FuJ3QgaGF2ZSBhdHRyaWJ1dGVzKS4gQXR0cmlidXRlcyBhcmUgaGVyZSBvbmx5IGZvciBkaXJlY3RpdmVcbiAqIG1hdGNoaW5nIHB1cnBvc2VzIGFuZCBzZXR0aW5nIGluaXRpYWwgaW5wdXRzIG9mIGRpcmVjdGl2ZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q29udGFpbmVyU3RhcnQoXG4gICAgaW5kZXg6IG51bWJlciwgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgY29uc3QgdGFnTmFtZSA9ICduZy1jb250YWluZXInO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50IGNvbnRhaW5lcnMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVDb21tZW50Kys7XG4gIGNvbnN0IG5hdGl2ZSA9IHJlbmRlcmVyLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gdGFnTmFtZSA6ICcnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG4gIGNvbnN0IHROb2RlID1cbiAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlLCB0YWdOYW1lLCBhdHRycyB8fCBudWxsKTtcblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Q29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG5cbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHtcbiAgICAvLyBpdCdzIGltcG9ydGFudCB0byBvbmx5IHByZXBhcmUgc3R5bGluZy1yZWxhdGVkIGRhdGFzdHJ1Y3R1cmVzIG9uY2UgZm9yIGEgZ2l2ZW5cbiAgICAvLyB0Tm9kZSBhbmQgbm90IGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEFsc28sIHRoZSBzdHlsaW5nIGNvZGUgaXMgZGVzaWduZWRcbiAgICAvLyB0byBiZSBwYXRjaGVkIGFuZCBjb25zdHJ1Y3RlZCBhdCB2YXJpb3VzIHBvaW50cywgYnV0IG9ubHkgdXAgdW50aWwgdGhlIGZpcnN0IGVsZW1lbnRcbiAgICAvLyBpcyBjcmVhdGVkLiBUaGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgaXMgbG9ja2VkIGFuZCBjYW4gb25seSBiZSBpbnN0YW50aWF0ZWQgZm9yIGVhY2hcbiAgICAvLyBzdWNjZXNzaXZlIGVsZW1lbnQgdGhhdCBpcyBjcmVhdGVkLlxuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiAhdE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmIGhhc1N0eWxpbmcoYXR0cnMpKSB7XG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICAgIH1cbiAgICBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGdldEVsZW1lbnREZXB0aENvdW50KCkgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIGlmIGEgZGlyZWN0aXZlIGNvbnRhaW5zIGEgaG9zdCBiaW5kaW5nIGZvciBcImNsYXNzXCIgdGhlbiBhbGwgY2xhc3MtYmFzZWQgZGF0YSB3aWxsXG4gIC8vIGZsb3cgdGhyb3VnaCB0aGF0IChleGNlcHQgZm9yIGBbY2xhc3MucHJvcF1gIGJpbmRpbmdzKS4gVGhpcyBhbHNvIGluY2x1ZGVzIGluaXRpYWxcbiAgLy8gc3RhdGljIGNsYXNzIHZhbHVlcyBhcyB3ZWxsLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIG1hcC1iYXNlZCBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3b3JrIGZvciBtdWx0aXBsZSBkaXJlY3RpdmVzLilcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKTtcbiAgICBpZiAoaW5wdXREYXRhICYmIGlucHV0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgd2hlbiBhIGNsYXNzIGRpcmVjdGl2ZSBpcyBwcmVzZW50IHNpbmNlXG4gIC8vIGl0IHdpbGwgdGFrZSB0aGF0IG92ZXIgZm9yIHVzICh0aGlzIHdpbGwgYmUgcmVtb3ZlZCBvbmNlICNGVy04ODIgaXMgaW4pLlxuICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgPT09IDApIHtcbiAgICByZW5kZXJJbml0aWFsU3R5bGVzQW5kQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgbFZpZXdbUkVOREVSRVJdKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IGdldExWaWV3KClbUkVOREVSRVJdO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBfY3VycmVudE5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKF9jdXJyZW50TmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKF9jdXJyZW50TmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBUTm9kZVxuICovXG5mdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCB8IHVuZGVmaW5lZCxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuXG4gICAgcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgICAgIHRWaWV3LCB2aWV3RGF0YSwgZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXcsIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUpLFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfVxuICBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXcsIHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCB2aWV3RGF0YSwgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUsIGxvY2FsUmVmRXh0cmFjdG9yKTtcbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlldyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5mdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3Rvcik6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMpIHtcbiAgICBsZXQgbG9jYWxJbmRleCA9IHROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICAgIGxvY2FsUmVmRXh0cmFjdG9yKFxuICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgdmlld0RhdGEpIDpcbiAgICAgICAgICB2aWV3RGF0YVtpbmRleF07XG4gICAgICB2aWV3RGF0YVtsb2NhbEluZGV4KytdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRoZSB0ZW1wbGF0ZSBmcm9tIHdoaWNoIHRvIGdldCBzdGF0aWMgZGF0YVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9XG4gICAgICAgICAgIGNyZWF0ZVRWaWV3KC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMsIHBpcGVzLCB2aWV3UXVlcnkpIGFzIG5ldmVyKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PGFueT58IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IHtcbiAgICBpZDogdmlld0luZGV4LFxuICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKSwgIC8vIEZpbGwgaW4gdG8gbWF0Y2ggSEVBREVSX09GRlNFVCBpbiBMVmlld1xuICAgIGNoaWxkSW5kZXg6IC0xLCAgICAgICAgICAgLy8gQ2hpbGRyZW4gc2V0IGluIGFkZFRvVmlld1RyZWUoKSwgaWYgYW55XG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgIGNoYW5nZXNIb29rczogbnVsbCxcbiAgICBpbml0SG9va3M6IG51bGwsXG4gICAgY2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBjbGVhbnVwOiBudWxsLFxuICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBmaXJzdENoaWxkOiBudWxsLFxuICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5ldyBBcnJheShpbml0aWFsVmlld0xlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKG51bGwsIDAsIGJpbmRpbmdTdGFydEluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwoTk9fQ0hBTkdFLCBiaW5kaW5nU3RhcnRJbmRleCkgYXMgTFZpZXc7XG4gIGJsdWVwcmludFtDT05UQUlORVJfSU5ERVhdID0gLTE7XG4gIGJsdWVwcmludFtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdTdGFydEluZGV4O1xuICByZXR1cm4gYmx1ZXByaW50O1xufVxuXG5mdW5jdGlvbiBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlOiBSRWxlbWVudCwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogdm9pZCB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcbiAgbGV0IGkgPSAwO1xuXG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpKytdO1xuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT0gJ251bWJlcicpIHtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyBOYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlVVJJID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaSsrXSBhcyBzdHJpbmc7XG4gICAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpXG4gICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2VVUkksIGF0dHJOYW1lLCBhdHRyVmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEFsbCBvdGhlciBgQXR0cmlidXRlTWFya2VyYHMgYXJlIGlnbm9yZWQgaGVyZS5cbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vLyBhdHRyTmFtZSBpcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyVmFsID0gYXR0cnNbaSsrXTtcbiAgICAgIGlmIChhdHRyTmFtZSAhPT0gTkdfUFJPSkVDVF9BU19BVFRSX05BTUUpIHtcbiAgICAgICAgLy8gU3RhbmRhcmQgYXR0cmlidXRlc1xuICAgICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgICAgIGlmIChpc0FuaW1hdGlvblByb3AoYXR0ck5hbWUpKSB7XG4gICAgICAgICAgaWYgKGlzUHJvYykge1xuICAgICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldFByb3BlcnR5KG5hdGl2ZSwgYXR0ck5hbWUsIGF0dHJWYWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpc1Byb2MgP1xuICAgICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMylcbiAgICAgICAgICAgICAgICAgIC5zZXRBdHRyaWJ1dGUobmF0aXZlLCBhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKSA6XG4gICAgICAgICAgICAgIG5hdGl2ZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUgYXMgc3RyaW5nLCBhdHRyVmFsIGFzIHN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IHRDbGVhbnVwOiBmYWxzZXxhbnlbXSA9IGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDoge30gYXMgYW55O1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVkLnRhcmdldCB8fCBuYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgbGV0IHVzZUNhcHR1cmVPclN1YklkeDogYm9vbGVhbnxudW1iZXIgPSB1c2VDYXB0dXJlO1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAvLyAtIGVpdGhlciBhIHRhcmdldCBuYW1lIChhcyBhIHN0cmluZykgaW4gY2FzZSBvZiBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csIGRvY3VtZW50LCBib2R5KVxuICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gbENsZWFudXBJbmRleCArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGxDbGVhbnVwLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcihyZWFkRWxlbWVudFZhbHVlKF9sVmlld1t0Tm9kZS5pbmRleF0pKS50YXJnZXQgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcbiAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IHByb3BzOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgICAgLy8gU3Vic2NyaWJlIHRvIGxpc3RlbmVycyBmb3IgZWFjaCBvdXRwdXQsIGFuZCBzZXR1cCBjbGVhbiB1cCBmb3IgZWFjaC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcHJvcHNMZW5ndGg7KSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gcHJvcHNbaSsrXSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IG1pbmlmaWVkTmFtZSA9IHByb3BzW2krK10gYXMgc3RyaW5nO1xuICAgICAgICBjb25zdCBkZWNsYXJlZE5hbWUgPSBwcm9wc1tpKytdIGFzIHN0cmluZztcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBkaXJlY3RpdmVJbmRleCBhcyBudW1iZXIpO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmUgPSB1bndyYXBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyKGxWaWV3W2RpcmVjdGl2ZUluZGV4XSk7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IGRpcmVjdGl2ZVttaW5pZmllZE5hbWVdLnN1YnNjcmliZShsaXN0ZW5lckZuKTtcbiAgICAgICAgY29uc3QgaWR4ID0gbENsZWFudXAubGVuZ3RoO1xuICAgICAgICBsQ2xlYW51cC5wdXNoKGxpc3RlbmVyRm4sIHN1YnNjcmlwdGlvbik7XG4gICAgICAgIHRDbGVhbnVwICYmIHRDbGVhbnVwLnB1c2goZXZlbnROYW1lLCB0Tm9kZS5pbmRleCwgaWR4LCAtKGlkeCArIDEpKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cChsVmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHZpZXc6IExWaWV3LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vKiogTWFyayB0aGUgZW5kIG9mIHRoZSBlbGVtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH1cblxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKGdldExWaWV3KClbVFZJRVddLCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICBkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50KCk7XG5cbiAgLy8gdGhpcyBpcyBmaXJlZCBhdCB0aGUgZW5kIG9mIGVsZW1lbnRFbmQgYmVjYXVzZSBBTEwgb2YgdGhlIHN0eWxpbmdCaW5kaW5ncyBjb2RlXG4gIC8vIChmb3IgZGlyZWN0aXZlcyBhbmQgdGhlIHRlbXBsYXRlKSBoYXZlIG5vdyBleGVjdXRlZCB3aGljaCBtZWFucyB0aGUgc3R5bGluZ1xuICAvLyBjb250ZXh0IGNhbiBiZSBpbnN0YW50aWF0ZWQgcHJvcGVybHkuXG4gIGlmIChoYXNDbGFzc0lucHV0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkpIHtcbiAgICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCwgbFZpZXcpO1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KFxuICAgICAgICBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLmlucHV0cyAhLCAnY2xhc3MnLCBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgdGhlIHZhbHVlIG9mIHJlbW92ZXMgYW4gYXR0cmlidXRlIG9uIGFuIEVsZW1lbnQuXG4gKlxuICogQHBhcmFtIG51bWJlciBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBuYW1lIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZS5cbiAqIEBwYXJhbSB2YWx1ZSB2YWx1ZSBUaGUgYXR0cmlidXRlIGlzIHJlbW92ZWQgd2hlbiB2YWx1ZSBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAuXG4gKiAgICAgICAgICAgICAgICAgIE90aGVyd2lzZSB0aGUgYXR0cmlidXRlIHZhbHVlIGlzIHNldCB0byB0aGUgc3RyaW5naWZpZWQgdmFsdWUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZShcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgcHJvcGVydHkgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgcHJvcGVydHkgbmFtZSBhbHNvIGV4aXN0cyBhcyBhbiBpbnB1dCBwcm9wZXJ0eSBvbiBvbmUgb2YgdGhlIGVsZW1lbnQncyBkaXJlY3RpdmVzLFxuICogdGhlIGNvbXBvbmVudCBwcm9wZXJ0eSB3aWxsIGJlIHNldCBpbnN0ZWFkIG9mIHRoZSBlbGVtZW50IHByb3BlcnR5LiBUaGlzIGNoZWNrIG11c3RcbiAqIGJlIGNvbmR1Y3RlZCBhdCBydW50aW1lIHNvIGNoaWxkIGNvbXBvbmVudHMgdGhhdCBhZGQgbmV3IEBJbnB1dHMgZG9uJ3QgaGF2ZSB0byBiZSByZS1jb21waWxlZC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYXRpdmVPbmx5IFdoZXRoZXIgb3Igbm90IHdlIHNob3VsZCBvbmx5IHNldCBuYXRpdmUgcHJvcGVydGllcyBhbmQgc2tpcCBpbnB1dCBjaGVja1xuICogKHRoaXMgaXMgbmVjZXNzYXJ5IGZvciBob3N0IHByb3BlcnR5IGJpbmRpbmdzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyLCBuYXRpdmVPbmx5KTtcbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgW0Bmb29dYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgYmluZGluZyAoZS5nLiBgQEhvc3RCaW5kaW5nKCdAZm9vJylgKSBwcm9wZXJseSBnZXRzIHJlbmRlcmVkIGluXG4gKiB0aGUgY29tcG9uZW50J3MgcmVuZGVyZXIuIE5vcm1hbGx5IGFsbCBob3N0IGJpbmRpbmdzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGUgcGFyZW50XG4gKiBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWQgdG8gYmVcbiAqIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50cyByZW5kZXJlciAoYmVjYXVzZSB0aGF0J3Mgd2hlcmUgdGhlIGFuaW1hdGlvblxuICogdHJpZ2dlcnMgYXJlIGRlZmluZWQpLlxuICpcbiAqIERvIG5vdCB1c2UgdGhpcyBpbnN0cnVjdGlvbiBhcyBhIHJlcGxhY2VtZW50IGZvciBgZWxlbWVudFByb3BlcnR5YC4gVGhpcyBpbnN0cnVjdGlvblxuICogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IHRvIHVwZGF0ZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgcHJvcGVydHkuIEJlY2F1c2UgaXQgaXMgZ29pbmcgdG8gRE9NLCB0aGlzIGlzIG5vdCBzdWJqZWN0IHRvXG4gKiAgICAgICAgcmVuYW1pbmcgYXMgcGFydCBvZiBtaW5pZmljYXRpb24uXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYXRpdmVPbmx5IFdoZXRoZXIgb3Igbm90IHdlIHNob3VsZCBvbmx5IHNldCBuYXRpdmUgcHJvcGVydGllcyBhbmQgc2tpcCBpbnB1dCBjaGVja1xuICogKHRoaXMgaXMgbmVjZXNzYXJ5IGZvciBob3N0IHByb3BlcnR5IGJpbmRpbmdzKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50SG9zdFN5bnRoZXRpY1Byb3BlcnR5PFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4pIHtcbiAgZWxlbWVudFByb3BlcnR5SW50ZXJuYWwoaW5kZXgsIHByb3BOYW1lLCB2YWx1ZSwgc2FuaXRpemVyLCBuYXRpdmVPbmx5LCBsb2FkQ29tcG9uZW50UmVuZGVyZXIpO1xufVxuXG5mdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlcjMge1xuICBjb25zdCBjb21wb25lbnRMVmlldyA9IGxWaWV3W3ROb2RlLmluZGV4XSBhcyBMVmlldztcbiAgcmV0dXJuIGNvbXBvbmVudExWaWV3W1JFTkRFUkVSXTtcbn1cblxuZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYXRpdmVPbmx5PzogYm9vbGVhbixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGxldCBpbnB1dERhdGE6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIChpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpKSAmJlxuICAgICAgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGlucHV0RGF0YSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGUgcHJvcGVydHlcbiAgICAvLyBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKCFpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0UHJvcGVydHkgPyAoZWxlbWVudCBhcyBhbnkpLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGFkanVzdGVkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIGxWaWV3OiBMVmlldywgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgdFZpZXdzOiBUVmlld1tdIHwgbnVsbCk6IFROb2RlIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGdldElzUGFyZW50KCkgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcblxuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiBsVmlldyAmJiBwYXJlbnQgIT09IGxWaWV3W0hPU1RfTk9ERV07XG4gIGNvbnN0IHRQYXJlbnQgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcblxuICByZXR1cm4ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgaW5qZWN0b3JJbmRleDogdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xLFxuICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgIGZsYWdzOiAwLFxuICAgIHByb3ZpZGVySW5kZXhlczogMCxcbiAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgIGF0dHJzOiBhdHRycyxcbiAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICBvdXRwdXRzOiB1bmRlZmluZWQsXG4gICAgdFZpZXdzOiB0Vmlld3MsXG4gICAgbmV4dDogbnVsbCxcbiAgICBjaGlsZDogbnVsbCxcbiAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgZGV0YWNoZWQ6IG51bGwsXG4gICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgIHByb2plY3Rpb246IG51bGxcbiAgfTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRBbGlhc2VzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gcHVibGljTmFtZSBwdWJsaWMgYmluZGluZyBuYW1lLiAoVGhpcyBpcyB0aGUgYDxkaXYgW3B1YmxpY05hbWVdPXZhbHVlPmApXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICBsVmlldzogTFZpZXcsIGlucHV0QWxpYXNlczogUHJvcGVydHlBbGlhc2VzLCBwdWJsaWNOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5wdXRzID0gaW5wdXRBbGlhc2VzW3B1YmxpY05hbWVdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7KSB7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBpbnB1dHNbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgZGVjbGFyZWROYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgZGlyZWN0aXZlSW5kZXgpO1xuICAgIHJlY29yZENoYW5nZUFuZFVwZGF0ZVByb3BlcnR5KGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGVjbGFyZWROYW1lLCBwcml2YXRlTmFtZSwgdmFsdWUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnRpZXMoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZUluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9IGlucHV0c1tpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUocHJpdmF0ZU5hbWUpO1xuICAgIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gICAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfSBlbHNlIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZUZsYWdzIG5vZGUgZmxhZ3NcbiAqIEBwYXJhbSBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZTogVE5vZGUsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHVibGljVG9NaW5pZmllZE5hbWVzOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBjb25zdCBwdWJsaWNUb0RlY2xhcmVkTmFtZXM6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfXxudWxsID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmRlY2xhcmVkSW5wdXRzIDogbnVsbDtcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHVibGljVG9NaW5pZmllZE5hbWVzKSB7XG4gICAgICAgIGlmIChwdWJsaWNUb01pbmlmaWVkTmFtZXMuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgbWluaWZpZWROYW1lID0gcHVibGljVG9NaW5pZmllZE5hbWVzW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9XG4gICAgICAgICAgICAgIHB1YmxpY1RvRGVjbGFyZWROYW1lcyA/IHB1YmxpY1RvRGVjbGFyZWROYW1lc1twdWJsaWNOYW1lXSA6IG1pbmlmaWVkTmFtZTtcbiAgICAgICAgICBjb25zdCBhbGlhc2VzOiBQcm9wZXJ0eUFsaWFzVmFsdWUgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkgP1xuICAgICAgICAgICAgICBwcm9wU3RvcmVbcHVibGljTmFtZV0gOlxuICAgICAgICAgICAgICBwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbXTtcbiAgICAgICAgICBhbGlhc2VzLnB1c2goaSwgbWluaWZpZWROYW1lLCBkZWNsYXJlZE5hbWUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQXNzaWduIGFueSBpbmxpbmUgc3R5bGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgZm9yIHN0YXRpYyB2YWx1ZXMgKG5vIGJpbmRpbmcpXG4gKiBzZWUgYGVsZW1lbnRTdGFydGAgYW5kIGBlbGVtZW50SG9zdEF0dHJzYC5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRDbGFzc1Byb3BgIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpbiB0aGlzIGFycmF5LlxuICogICAgICAgIChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudFN0eWxlUHJvcGAgcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluIHRoaXMgYXJyYXkuXG4gKiAgICAgICAgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKiAgICAgICAgTm90ZSB0aGF0IHRoZSBzYW5pdGl6ZXIgaW5zdGFuY2UgaXRzZWxmIGlzIHRpZWQgdG8gdGhlIGBkaXJlY3RpdmVgIChpZiAgcHJvdmlkZWQpLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguIElmIG5vdCBwcm92aWRlZFxuICogICAgICAgIGN1cnJlbnQgdmlldydzIGNvbnRyb2xsZXIgaW5zdGFuY2UgaXMgYXNzdW1lZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgfVxuICB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZSB8fCBudWxsLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplciwgaGFzQ2xhc3NJbnB1dCh0Tm9kZSkpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBzdGF0aWMgc3R5bGluZyB2YWx1ZXMgdG8gYSBob3N0IGVsZW1lbnQuXG4gKlxuICogTk9URTogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byB1c2VkIGZyb20gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gb25seS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEEgZGlyZWN0aXZlIGluc3RhbmNlIHRoZSBzdHlsaW5nIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqIEBwYXJhbSBhdHRycyBBbiBhcnJheSBjb250YWluaW5nIGNsYXNzIGFuZCBzdHlsaW5nIGluZm9ybWF0aW9uLiBUaGUgdmFsdWVzIG11c3QgYmUgbWFya2VkIHdpdGhcbiAqICAgICAgICAgICAgICBgQXR0cmlidXRlTWFya2VyYC5cbiAqXG4gKiAgICAgICAgYGBgXG4gKiAgICAgICAgdmFyIGF0dHJzID0gW0F0dHJpYnV0ZU1hcmtlci5DbGFzc2VzLCAnZm9vJywgJ2JhcicsXG4gKiAgICAgICAgICAgICAgICAgICAgIEF0dHJpYnV0ZU1hcmtlci5TdHlsZXMsICd3aWR0aCcsICcxMDBweCcsICdoZWlnaHQsICcyMDBweCddXG4gKiAgICAgICAgZWxlbWVudEhvc3RBdHRycyhkaXJlY3RpdmUsIGF0dHJzKTtcbiAqICAgICAgICBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50SG9zdEF0dHJzKGRpcmVjdGl2ZTogYW55LCBhdHRyczogVEF0dHJpYnV0ZXMpIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKCF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICB9XG4gIHBhdGNoQ29udGV4dFdpdGhTdGF0aWNBdHRycyh0Tm9kZS5zdHlsaW5nVGVtcGxhdGUsIGF0dHJzLCBkaXJlY3RpdmUpO1xufVxuXG4vKipcbiAqIEFwcGx5IHN0eWxpbmcgYmluZGluZyB0byB0aGUgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGJlIHJ1biBhZnRlciBgZWxlbWVudFN0eWxlYCBhbmQvb3IgYGVsZW1lbnRTdHlsZVByb3BgLlxuICogaWYgYW55IHN0eWxpbmcgYmluZGluZ3MgaGF2ZSBjaGFuZ2VkIHRoZW4gdGhlIGNoYW5nZXMgYXJlIGZsdXNoZWQgdG8gdGhlIGVsZW1lbnQuXG4gKlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBEaXJlY3RpdmUgaW5zdGFuY2UgdGhhdCBpcyBhdHRlbXB0aW5nIHRvIGNoYW5nZSBzdHlsaW5nLiAoRGVmYXVsdHMgdG8gdGhlXG4gKiAgICAgICAgY29tcG9uZW50IG9mIHRoZSBjdXJyZW50IHZpZXcpLlxuY29tcG9uZW50c1xuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsaW5nQXBwbHkoaW5kZXg6IG51bWJlciwgZGlyZWN0aXZlPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgaXNGaXJzdFJlbmRlciA9IChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKSAhPT0gMDtcbiAgY29uc3QgdG90YWxQbGF5ZXJzUXVldWVkID0gcmVuZGVyU3R5bGluZyhcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpLCBsVmlld1tSRU5ERVJFUl0sIGxWaWV3LCBpc0ZpcnN0UmVuZGVyLCBudWxsLFxuICAgICAgbnVsbCwgZGlyZWN0aXZlKTtcbiAgaWYgKHRvdGFsUGxheWVyc1F1ZXVlZCA+IDApIHtcbiAgICBjb25zdCByb290Q29udGV4dCA9IGdldFJvb3RDb250ZXh0KGxWaWV3KTtcbiAgICBzY2hlZHVsZVRpY2socm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKTtcbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHN0eWxlIGJpbmRpbmdzIHZhbHVlIG9uIGFuIGVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHN0eWxlIHZhbHVlIGlzIGBudWxsYCB0aGVuIGl0IHdpbGwgYmUgcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50XG4gKiAob3IgYXNzaWduZWQgYSBkaWZmZXJlbnQgdmFsdWUgZGVwZW5kaW5nIGlmIHRoZXJlIGFyZSBhbnkgc3R5bGVzIHBsYWNlZFxuICogb24gdGhlIGVsZW1lbnQgd2l0aCBgZWxlbWVudFN0eWxlYCBvciBhbnkgc3R5bGVzIHRoYXQgYXJlIHByZXNlbnRcbiAqIGZyb20gd2hlbiB0aGUgZWxlbWVudCB3YXMgY3JlYXRlZCAod2l0aCBgZWxlbWVudFN0eWxpbmdgKS5cbiAqXG4gKiAoTm90ZSB0aGF0IHRoZSBzdHlsaW5nIGVsZW1lbnQgaXMgdXBkYXRlZCBhcyBwYXJ0IG9mIGBlbGVtZW50U3R5bGluZ0FwcGx5YC4pXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gc3R5bGVJbmRleCBJbmRleCBvZiBzdHlsZSB0byB1cGRhdGUuIFRoaXMgaW5kZXggdmFsdWUgcmVmZXJzIHRvIHRoZVxuICogICAgICAgIGluZGV4IG9mIHRoZSBzdHlsZSBpbiB0aGUgc3R5bGUgYmluZGluZ3MgYXJyYXkgdGhhdCB3YXMgcGFzc2VkIGludG9cbiAqICAgICAgICBgZWxlbWVudFN0bHlpbmdCaW5kaW5nc2AuXG4gKiBAcGFyYW0gdmFsdWUgTmV3IHZhbHVlIHRvIHdyaXRlIChudWxsIHRvIHJlbW92ZSkuIE5vdGUgdGhhdCBpZiBhIGRpcmVjdGl2ZSBhbHNvXG4gKiAgICAgICAgYXR0ZW1wdHMgdG8gd3JpdGUgdG8gdGhlIHNhbWUgYmluZGluZyB2YWx1ZSB0aGVuIGl0IHdpbGwgb25seSBiZSBhYmxlIHRvXG4gKiAgICAgICAgZG8gc28gaWYgdGhlIHRlbXBsYXRlIGJpbmRpbmcgdmFsdWUgaXMgYG51bGxgIChvciBkb2Vzbid0IGV4aXN0IGF0IGFsbCkuXG4gKiBAcGFyYW0gc3VmZml4IE9wdGlvbmFsIHN1ZmZpeC4gVXNlZCB3aXRoIHNjYWxhciB2YWx1ZXMgdG8gYWRkIHVuaXQgc3VjaCBhcyBgcHhgLlxuICogICAgICAgIE5vdGUgdGhhdCB3aGVuIGEgc3VmZml4IGlzIHByb3ZpZGVkIHRoZW4gdGhlIHVuZGVybHlpbmcgc2FuaXRpemVyIHdpbGxcbiAqICAgICAgICBiZSBpZ25vcmVkLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBEaXJlY3RpdmUgaW5zdGFuY2UgdGhhdCBpcyBhdHRlbXB0aW5nIHRvIGNoYW5nZSBzdHlsaW5nLiAoRGVmYXVsdHMgdG8gdGhlXG4gKiAgICAgICAgY29tcG9uZW50IG9mIHRoZSBjdXJyZW50IHZpZXcpLlxuY29tcG9uZW50c1xuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRTdHlsZVByb3AoXG4gICAgaW5kZXg6IG51bWJlciwgc3R5bGVJbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nIHwgbnVtYmVyIHwgU3RyaW5nIHwgUGxheWVyRmFjdG9yeSB8IG51bGwsXG4gICAgc3VmZml4Pzogc3RyaW5nIHwgbnVsbCwgZGlyZWN0aXZlPzoge30pOiB2b2lkIHtcbiAgbGV0IHZhbHVlVG9BZGQ6IHN0cmluZ3xudWxsID0gbnVsbDtcbiAgaWYgKHZhbHVlICE9PSBudWxsKSB7XG4gICAgaWYgKHN1ZmZpeCkge1xuICAgICAgLy8gd2hlbiBhIHN1ZmZpeCBpcyBhcHBsaWVkIHRoZW4gaXQgd2lsbCBieXBhc3NcbiAgICAgIC8vIHNhbml0aXphdGlvbiBlbnRpcmVseSAoYi9jIGEgbmV3IHN0cmluZyBpcyBjcmVhdGVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHN0cmluZ2lmeSh2YWx1ZSkgKyBzdWZmaXg7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIHNhbml0aXphdGlvbiBoYXBwZW5zIGJ5IGRlYWxpbmcgd2l0aCBhIFN0cmluZyB2YWx1ZVxuICAgICAgLy8gdGhpcyBtZWFucyB0aGF0IHRoZSBzdHJpbmcgdmFsdWUgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaFxuICAgICAgLy8gaW50byB0aGUgc3R5bGUgcmVuZGVyaW5nIGxhdGVyICh3aGljaCBpcyB3aGVyZSB0aGUgdmFsdWVcbiAgICAgIC8vIHdpbGwgYmUgc2FuaXRpemVkIGJlZm9yZSBpdCBpcyBhcHBsaWVkKVxuICAgICAgdmFsdWVUb0FkZCA9IHZhbHVlIGFzIGFueSBhcyBzdHJpbmc7XG4gICAgfVxuICB9XG4gIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBzdHlsZUluZGV4LCB2YWx1ZVRvQWRkLCBkaXJlY3RpdmUpO1xufVxuXG4vKipcbiAqIEFkZCBvciByZW1vdmUgYSBjbGFzcyB2aWEgYSBjbGFzcyBiaW5kaW5nIG9uIGEgRE9NIGVsZW1lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byBoYW5kbGUgdGhlIFtjbGFzcy5mb29dPVwiZXhwXCIgY2FzZSBhbmQsIHRoZXJlZm9yZSxcbiAqIHRoZSBjbGFzcyBpdHNlbGYgbXVzdCBhbHJlYWR5IGJlIGFwcGxpZWQgdXNpbmcgYGVsZW1lbnRTdHlsaW5nYCB3aXRoaW5cbiAqIHRoZSBjcmVhdGlvbiBibG9jay5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc0luZGV4IEluZGV4IG9mIGNsYXNzIHRvIHRvZ2dsZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIGNsYXNzIGluIHRoZSBjbGFzcyBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3RseWluZ0JpbmRpbmdzYCAod2hpY2ggaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGJlZm9yZSB0aGlzXG4gKiAgICAgICAgZnVuY3Rpb24gaXMpLlxuICogQHBhcmFtIHZhbHVlIEEgdHJ1ZS9mYWxzZSB2YWx1ZSB3aGljaCB3aWxsIHR1cm4gdGhlIGNsYXNzIG9uIG9yIG9mZi5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbmNvbXBvbmVudHNcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q2xhc3NQcm9wKFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzSW5kZXg6IG51bWJlciwgdmFsdWU6IGJvb2xlYW4gfCBQbGF5ZXJGYWN0b3J5LCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICBjb25zdCBvbk9yT2ZmQ2xhc3NWYWx1ZSA9XG4gICAgICAodmFsdWUgaW5zdGFuY2VvZiBCb3VuZFBsYXllckZhY3RvcnkpID8gKHZhbHVlIGFzIEJvdW5kUGxheWVyRmFjdG9yeTxib29sZWFuPikgOiAoISF2YWx1ZSk7XG4gIHVwZGF0ZUVsZW1lbnRDbGFzc1Byb3AoXG4gICAgICBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGdldExWaWV3KCkpLCBjbGFzc0luZGV4LCBvbk9yT2ZmQ2xhc3NWYWx1ZSxcbiAgICAgIGRpcmVjdGl2ZSk7XG59XG5cbi8qKlxuICogVXBkYXRlIHN0eWxlIGFuZC9vciBjbGFzcyBiaW5kaW5ncyB1c2luZyBvYmplY3QgbGl0ZXJhbC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IGFwcGx5IHN0eWxpbmcgdmlhIHRoZSBgW3N0eWxlXT1cImV4cFwiYCBhbmQgYFtjbGFzc109XCJleHBcImAgdGVtcGxhdGVcbiAqIGJpbmRpbmdzLiBXaGVuIHN0eWxlcyBhcmUgYXBwbGllZCB0byB0aGUgRWxlbWVudCB0aGV5IHdpbGwgdGhlbiBiZSBwbGFjZWQgd2l0aCByZXNwZWN0IHRvXG4gKiBhbnkgc3R5bGVzIHNldCB3aXRoIGBlbGVtZW50U3R5bGVQcm9wYC4gSWYgYW55IHN0eWxlcyBhcmUgc2V0IHRvIGBudWxsYCB0aGVuIHRoZXkgd2lsbCBiZVxuICogcmVtb3ZlZCBmcm9tIHRoZSBlbGVtZW50LlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgaW5zdHJ1Y3Rpb24gd2lsbCBub3QgYmUgYXBwbGllZCB1bnRpbCBgZWxlbWVudFN0eWxpbmdBcHBseWAgaXMgY2FsbGVkLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBjbGFzc2VzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiBDU1MgY2xhc3NlcyB0aGF0IHdpbGwgYmUgYWRkZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3NpbmcgY2xhc3NlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIGxpc3Qgb2YgQ1NTIGNsYXNzZXMuXG4gKiBAcGFyYW0gc3R5bGVzIEEga2V5L3ZhbHVlIHN0eWxlIG1hcCBvZiB0aGUgc3R5bGVzIHRoYXQgd2lsbCBiZSBhcHBsaWVkIHRvIHRoZSBnaXZlbiBlbGVtZW50LlxuICogICAgICAgIEFueSBtaXNzaW5nIHN0eWxlcyAodGhhdCBoYXZlIGFscmVhZHkgYmVlbiBhcHBsaWVkIHRvIHRoZSBlbGVtZW50IGJlZm9yZWhhbmQpIHdpbGwgYmVcbiAqICAgICAgICByZW1vdmVkICh1bnNldCkgZnJvbSB0aGUgZWxlbWVudCdzIHN0eWxpbmcuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIERpcmVjdGl2ZSBpbnN0YW5jZSB0aGF0IGlzIGF0dGVtcHRpbmcgdG8gY2hhbmdlIHN0eWxpbmcuIChEZWZhdWx0cyB0byB0aGVcbiAqICAgICAgICBjb21wb25lbnQgb2YgdGhlIGN1cnJlbnQgdmlldykuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdNYXA8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGFueX0gfCBzdHJpbmcgfCBOT19DSEFOR0UgfCBudWxsLFxuICAgIHN0eWxlcz86IHtbc3R5bGVOYW1lOiBzdHJpbmddOiBhbnl9IHwgTk9fQ0hBTkdFIHwgbnVsbCwgZGlyZWN0aXZlPzoge30pOiB2b2lkIHtcbiAgaWYgKGRpcmVjdGl2ZSAhPSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIGhhY2tJbXBsZW1lbnRhdGlvbk9mRWxlbWVudFN0eWxpbmdNYXAoXG4gICAgICAgIGluZGV4LCBjbGFzc2VzLCBzdHlsZXMsIGRpcmVjdGl2ZSk7ICAvLyBzdXBwb3J0ZWQgaW4gbmV4dCBQUlxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgY29uc3Qgc3R5bGluZ0NvbnRleHQgPSBnZXRTdHlsaW5nQ29udGV4dChpbmRleCArIEhFQURFUl9PRkZTRVQsIGxWaWV3KTtcbiAgaWYgKGhhc0NsYXNzSW5wdXQodE5vZGUpICYmIGNsYXNzZXMgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGluaXRpYWxDbGFzc2VzID0gZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KTtcbiAgICBjb25zdCBjbGFzc0lucHV0VmFsID1cbiAgICAgICAgKGluaXRpYWxDbGFzc2VzLmxlbmd0aCA/IChpbml0aWFsQ2xhc3NlcyArICcgJykgOiAnJykgKyAoY2xhc3NlcyBhcyBzdHJpbmcpO1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCB0Tm9kZS5pbnB1dHMgISwgJ2NsYXNzJywgY2xhc3NJbnB1dFZhbCk7XG4gIH0gZWxzZSB7XG4gICAgdXBkYXRlU3R5bGluZ01hcChzdHlsaW5nQ29udGV4dCwgY2xhc3Nlcywgc3R5bGVzKTtcbiAgfVxufVxuXG4vKiBTVEFSVCBPRiBIQUNLIEJMT0NLICovXG5mdW5jdGlvbiBoYWNrSW1wbGVtZW50YXRpb25PZkVsZW1lbnRTdHlsaW5nTWFwPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIGNsYXNzZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9IHwgc3RyaW5nIHwgTk9fQ0hBTkdFIHwgbnVsbCxcbiAgICBzdHlsZXM/OiB7W3N0eWxlTmFtZTogc3RyaW5nXTogYW55fSB8IE5PX0NIQU5HRSB8IG51bGwsIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIHRocm93IG5ldyBFcnJvcigndW5pbXBsZW1lbnRlZC4gU2hvdWxkIG5vdCBiZSBuZWVkZWQgYnkgVmlld0VuZ2luZSBjb21wYXRpYmlsaXR5Jyk7XG59XG4vKiBFTkQgT0YgSEFDSyBCTE9DSyAqL1xuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBUZXh0XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZSBzdGF0aWMgdGV4dCBub2RlXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBub2RlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gd3JpdGUuIFRoaXMgdmFsdWUgd2lsbCBiZSBzdHJpbmdpZmllZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHQoaW5kZXg6IG51bWJlciwgdmFsdWU/OiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAndGV4dCBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVUZXh0Tm9kZSsrO1xuICBjb25zdCB0ZXh0TmF0aXZlID0gY3JlYXRlVGV4dE5vZGUodmFsdWUsIGxWaWV3W1JFTkRFUkVSXSk7XG4gIGNvbnN0IHROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoaW5kZXgsIFROb2RlVHlwZS5FbGVtZW50LCB0ZXh0TmF0aXZlLCBudWxsLCBudWxsKTtcblxuICAvLyBUZXh0IG5vZGVzIGFyZSBzZWxmIGNsb3NpbmcuXG4gIHNldElzUGFyZW50KGZhbHNlKTtcbiAgYXBwZW5kQ2hpbGQodGV4dE5hdGl2ZSwgdE5vZGUsIGxWaWV3KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgdGV4dCBub2RlIHdpdGggYmluZGluZ1xuICogQmluZGluZ3Mgc2hvdWxkIGJlIGhhbmRsZWQgZXh0ZXJuYWxseSB3aXRoIHRoZSBwcm9wZXIgaW50ZXJwb2xhdGlvbigxLTgpIG1ldGhvZFxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheS5cbiAqIEBwYXJhbSB2YWx1ZSBTdHJpbmdpZmllZCB2YWx1ZSB0byB3cml0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShlbGVtZW50LCBzdHJpbmdpZnkodmFsdWUpKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC50ZXh0Q29udGVudCA9IHN0cmluZ2lmeSh2YWx1ZSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRGlyZWN0aXZlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmLCBkZWYuZmFjdG9yeSk7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID1cbiAgICAgIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIHZpZXdEYXRhLCB2aWV3RGF0YS5sZW5ndGggLSAxLCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCByb290VE5vZGUsIGRpcmVjdGl2ZSwgZGVmIGFzIERpcmVjdGl2ZURlZjxUPik7XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10gfCBudWxsLCB0Tm9kZTogVE5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW4gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmRhdGEubGVuZ3RoO1xuICAgICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcblxuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcCh0Vmlldy5kYXRhICEubGVuZ3RoIC0gMSwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgICAgLy8gYW55IHByb2plY3RlZCBjb21wb25lbnRzLlxuICAgICAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKGRpcmVjdGl2ZURlZklkeCwgZGVmLCB0Vmlldyk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIWdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgc3RhcnQgPCBlbmQpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGxWaWV3ICEsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG5cbiAgICBwb3N0UHJvY2Vzc0RpcmVjdGl2ZShsVmlldywgZGlyZWN0aXZlLCBkZWYsIGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICE7XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IHVud3JhcE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIodmlld0RhdGFbaV0pO1xuICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgICBjb25zdCBwcmV2aW91c0V4cGFuZG9MZW5ndGggPSBleHBhbmRvLmxlbmd0aDtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoZGVmKTtcbiAgICAgIGRlZi5ob3N0QmluZGluZ3MgIShSZW5kZXJGbGFncy5DcmVhdGUsIGRpcmVjdGl2ZSwgdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVEZWYobnVsbCk7XG4gICAgICAvLyBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBtYXkgb3IgbWF5IG5vdCBjb250YWluIGBhbGxvY0hvc3RWYXJzYCBjYWxsXG4gICAgICAvLyAoZS5nLiBpdCBtYXkgbm90IGlmIGl0IG9ubHkgY29udGFpbnMgaG9zdCBsaXN0ZW5lcnMpLCBzbyB3ZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXJcbiAgICAgIC8vIGBleHBhbmRvSW5zdHJ1Y3Rpb25zYCBoYXMgY2hhbmdlZCBhbmQgaWYgbm90IC0gd2Ugc3RpbGwgcHVzaCBgaG9zdEJpbmRpbmdzYCB0b1xuICAgICAgLy8gZXhwYW5kbyBibG9jaywgdG8gbWFrZSBzdXJlIHdlIGV4ZWN1dGUgaXQgZm9yIERJIGN5Y2xlXG4gICAgICBpZiAocHJldmlvdXNFeHBhbmRvTGVuZ3RoID09PSBleHBhbmRvLmxlbmd0aCAmJiBmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgZXhwYW5kby5wdXNoKG51bGwpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbipcbiogRWFjaCBleHBhbmRvIGJsb2NrIHN0YXJ0cyB3aXRoIHRoZSBlbGVtZW50IGluZGV4ICh0dXJuZWQgbmVnYXRpdmUgc28gd2UgY2FuIGRpc3Rpbmd1aXNoXG4qIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2soXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdFeHBhbmRvIGJsb2NrIHNob3VsZCBvbmx5IGJlIGdlbmVyYXRlZCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuXG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IC0odE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgcHJvdmlkZXJTdGFydEluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IHByb3ZpZGVyQ291bnQgPSB0Vmlldy5kYXRhLmxlbmd0aCAtIHByb3ZpZGVyU3RhcnRJbmRleDtcbiAgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgfHwgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgPSBbXG4gICBdKSkucHVzaChlbGVtZW50SW5kZXgsIHByb3ZpZGVyQ291bnQsIGRpcmVjdGl2ZUNvdW50KTtcbn1cblxuLyoqXG4qIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB3ZSBuZWVkIHRvIHJlc2VydmUgc3BhY2UgZm9yIGhvc3QgYmluZGluZyB2YWx1ZXNcbiogYWZ0ZXIgZGlyZWN0aXZlcyBhcmUgbWF0Y2hlZCAoc28gYWxsIGRpcmVjdGl2ZXMgYXJlIHNhdmVkLCB0aGVuIGJpbmRpbmdzKS5cbiogQmVjYXVzZSB3ZSBhcmUgdXBkYXRpbmcgdGhlIGJsdWVwcmludCwgd2Ugb25seSBuZWVkIHRvIGRvIHRoaXMgb25jZS5cbiovXG5mdW5jdGlvbiBwcmVmaWxsSG9zdFZhcnModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRvdGFsSG9zdFZhcnM6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbEhvc3RWYXJzOyBpKyspIHtcbiAgICBsVmlldy5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIGEgZGlyZWN0aXZlIG9uIHRoZSBjdXJyZW50IG5vZGUgYWZ0ZXIgaXRzIGNyZWF0aW9uLlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZTxUPihcbiAgICBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkZWYub25DaGFuZ2VzKSB7XG4gICAgLy8gV2UgaGF2ZSBvbkNoYW5nZXMsIHdyYXAgaXQgc28gdGhhdCB3ZSBjYW4gdHJhY2sgY2hhbmdlcy5cbiAgICBsVmlld1tkaXJlY3RpdmVEZWZJZHhdID0gbmV3IE9uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIobFZpZXdbZGlyZWN0aXZlRGVmSWR4XSk7XG4gIH1cblxuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUsIGRpcmVjdGl2ZSwgZGVmKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlJyk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGxWaWV3LCBkaXJlY3RpdmVEZWZJZHgsIGRlZiwgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBkZWYuY29udGVudFF1ZXJpZXMoZGlyZWN0aXZlRGVmSWR4KTtcbiAgfVxuXG4gIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCwgbFZpZXcpO1xuICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkaXJlY3RpdmU6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcblxuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cblxuICAvLyBUT0RPKG1pc2tvKTogc2V0VXBBdHRyaWJ1dGVzIHNob3VsZCBiZSBhIGZlYXR1cmUgZm9yIGJldHRlciB0cmVlc2hha2FiaWxpdHkuXG4gIGlmIChkZWYuYXR0cmlidXRlcyAhPSBudWxsICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZSBhcyBSRWxlbWVudCwgZGVmLmF0dHJpYnV0ZXMgYXMgc3RyaW5nW10pO1xuICB9XG59XG5cblxuXG4vKipcbiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4qIElmIGEgY29tcG9uZW50IGlzIG1hdGNoZWQgKGF0IG1vc3Qgb25lKSwgaXQgaXMgcmV0dXJuZWQgaW4gZmlyc3QgcG9zaXRpb24gaW4gdGhlIGFycmF5LlxuKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfFxuICAgIG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBbXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbn1cblxuLyoqXG4gKiBTdG9yZXMgaG9zdCBiaW5kaW5nIGZuIGFuZCBudW1iZXIgb2YgaG9zdCB2YXJzIHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciBiaW5kaW5nIHJlZnJlc2ggZHVyaW5nXG4gKiBDRC5cbiovXG5mdW5jdGlvbiBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2soXG4gICAgdFZpZXc6IFRWaWV3LCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PiwgaG9zdFZhcnM6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKGdldEZpcnN0VGVtcGxhdGVQYXNzKCksIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgITtcbiAgY29uc3QgbGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gIC8vIENoZWNrIHdoZXRoZXIgYSBnaXZlbiBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBhbHJlYWR5IGV4aXN0cyBpbiBleHBhbmRvSW5zdHJ1Y3Rpb25zLFxuICAvLyB3aGljaCBjYW4gaGFwcGVuIGluIGNhc2UgZGlyZWN0aXZlIGRlZmluaXRpb24gd2FzIGV4dGVuZGVkIGZyb20gYmFzZSBkZWZpbml0aW9uIChhcyBhIHBhcnQgb2ZcbiAgLy8gdGhlIGBJbmhlcml0RGVmaW5pdGlvbkZlYXR1cmVgIGxvZ2ljKS4gSWYgd2UgZm91bmQgdGhlIHNhbWUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gaW4gdGhlXG4gIC8vIGxpc3QsIHdlIGp1c3QgaW5jcmVhc2UgdGhlIG51bWJlciBvZiBob3N0IHZhcnMgYXNzb2NpYXRlZCB3aXRoIHRoYXQgZnVuY3Rpb24sIGJ1dCBkbyBub3QgYWRkIGl0XG4gIC8vIGludG8gdGhlIGxpc3QgYWdhaW4uXG4gIGlmIChsZW5ndGggPj0gMiAmJiBleHBhbmRvW2xlbmd0aCAtIDJdID09PSBkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgZXhwYW5kb1tsZW5ndGggLSAxXSA9IChleHBhbmRvW2xlbmd0aCAtIDFdIGFzIG51bWJlcikgKyBob3N0VmFycztcbiAgfSBlbHNlIHtcbiAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyAhLCBob3N0VmFycyk7XG4gIH1cbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4qIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoZ2V0Rmlyc3RUZW1wbGF0ZVBhc3MoKSwgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0VGVtcGxhdGVQYXNzIHRvIGJlIHRydWUnKTtcbiAgY29uc3QgZmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZsYWdzID09PSAwIHx8IGZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCBub2RlIGZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5mbGFncyA9IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4sXG4gICAgZGlyZWN0aXZlRmFjdG9yeTogKHQ6IFR5cGU8VD58IG51bGwpID0+IGFueSkge1xuICB0Vmlldy5kYXRhLnB1c2goZGVmKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBmYWxzZSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSk7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXggYXMgbnVtYmVyLFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsXG4gICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXS5jcmVhdGVSZW5kZXJlcihuYXRpdmUgYXMgUkVsZW1lbnQsIGRlZikpKTtcblxuICBjb21wb25lbnRWaWV3W0hPU1RfTk9ERV0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBjb21wb25lbnRWaWV3W0hPU1RdID0gbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSA9IGxWaWV3W2RpcmVjdGl2ZUluZGV4XTtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIHJlY29yZENoYW5nZUFuZFVwZGF0ZVByb3BlcnR5KFxuICAgICAgICAgIGRpcmVjdGl2ZU9yV3JhcHBlZERpcmVjdGl2ZSwgZGVjbGFyZWROYW1lLCBwcml2YXRlTmFtZSwgYXR0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdG8gc2VlIGlmIHRoZSBpbnN0YW5jZWQgcGFzc2VkIGFzIGBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmVgIGlzIHdyYXBwZWQgaW4ge0BsaW5rXG4gKiBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyfSBvciBub3QuXG4gKiBJZiBpdCBpcywgaXQgd2lsbCB1cGRhdGUgdGhlIHJlbGF0ZWQge0BsaW5rIFNpbXBsZUNoYW5nZXN9IG9iamVjdCB3aXRoIHRoZSBjaGFuZ2UgdG8gc2lnbmFsXG4gKiBgbmdPbkNoYW5nZXNgIGhvb2tcbiAqIHNob3VsZCBmaXJlLCB0aGVuIGl0IHdpbGwgdW53cmFwIHRoZSBpbnN0YW5jZS4gQWZ0ZXIgdGhhdCwgaXQgd2lsbCBzZXQgdGhlIHByb3BlcnR5IHdpdGggdGhlIGtleVxuICogcHJvdmlkZWRcbiAqIGluIGBwcml2YXRlTmFtZWAgb24gdGhlIGluc3RhbmNlIHdpdGggdGhlIHBhc3NlZCB2YWx1ZS5cbiAqIEBwYXJhbSBkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUgVGhlIGRpcmVjdGl2ZSBpbnN0YW5jZSBvciBhIGRpcmVjdGl2ZSBpbnN0YW5jZSB3cmFwcGVkIGluXG4gKiB7QGxpbmsgT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcn1cbiAqIEBwYXJhbSBkZWNsYXJlZE5hbWUgVGhlIG9yaWdpbmFsLCBkZWNsYXJlZCBuYW1lIG9mIHRoZSBwcm9wZXJ0eSB0byB1cGRhdGUuXG4gKiBAcGFyYW0gcHJpdmF0ZU5hbWUgVGhlIHByaXZhdGUsIHBvc3NpYmx5IG1pbmlmaWVkIG5hbWUgb2YgdGhlIHByb3BlcnR5IHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gdXBkYXRlIHRoZSBwcm9wZXJ0eSB3aXRoLlxuICovXG5mdW5jdGlvbiByZWNvcmRDaGFuZ2VBbmRVcGRhdGVQcm9wZXJ0eTxULCBLIGV4dGVuZHMga2V5b2YgVD4oXG4gICAgZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlOiBPbkNoYW5nZXNEaXJlY3RpdmVXcmFwcGVyPFQ+fCBULCBkZWNsYXJlZE5hbWU6IHN0cmluZyxcbiAgICBwcml2YXRlTmFtZTogSywgdmFsdWU6IGFueSkge1xuICBsZXQgaW5zdGFuY2U6IFQ7XG4gIGlmIChpc09uQ2hhbmdlc0RpcmVjdGl2ZVdyYXBwZXIoZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlKSkge1xuICAgIGluc3RhbmNlID0gdW53cmFwT25DaGFuZ2VzRGlyZWN0aXZlV3JhcHBlcihkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUpO1xuICAgIHJlY29yZENoYW5nZShkaXJlY3RpdmVPcldyYXBwZWREaXJlY3RpdmUsIGRlY2xhcmVkTmFtZSwgdmFsdWUpO1xuICB9IGVsc2Uge1xuICAgIGluc3RhbmNlID0gZGlyZWN0aXZlT3JXcmFwcGVkRGlyZWN0aXZlO1xuICB9XG4gIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB0byBzdG9yZSB0aGUgaW5pdGlhbCBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGlyZWN0aXZlRGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgdE5vZGU6IFROb2RlKTogSW5pdGlhbElucHV0RGF0YSB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIHx8ICh0Tm9kZS5pbml0aWFsSW5wdXRzID0gW10pO1xuICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG51bGw7XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAvLyBJZiB3ZSBoaXQgU2VsZWN0LU9ubHksIENsYXNzZXMgb3IgU3R5bGVzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkgfHwgYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5DbGFzc2VzIHx8XG4gICAgICAgIGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU3R5bGVzKVxuICAgICAgYnJlYWs7XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGRpcmVjdGl2ZURlZi5pbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGRlY2xhcmVkTmFtZSA9IGRpcmVjdGl2ZURlZi5kZWNsYXJlZElucHV0c1thdHRyTmFtZV07XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKHByaXZhdGVOYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPVxuICAgICAgICAgIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8IChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChwcml2YXRlTmFtZSwgZGVjbGFyZWROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0IG5hdGl2ZVxuICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gVE9ETzogY29uc2lkZXIgYSBzZXBhcmF0ZSBub2RlIHR5cGUgZm9yIHRlbXBsYXRlc1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCB0YWdOYW1lIHx8IG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIGlmIChnZXRGaXJzdFRlbXBsYXRlUGFzcygpKSB7XG4gICAgdE5vZGUudFZpZXdzID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIC0xLCB0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCB0Vmlldy5waXBlUmVnaXN0cnksIG51bGwpO1xuICB9XG5cbiAgY3JlYXRlRGlyZWN0aXZlc0FuZExvY2Fscyh0VmlldywgbFZpZXcsIGxvY2FsUmVmcywgbG9jYWxSZWZFeHRyYWN0b3IpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9IGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlKTtcbiAgfVxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCB0Tm9kZSk7XG4gIHNldElzUGFyZW50KGZhbHNlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIExDb250YWluZXIgZm9yIGlubGluZSB2aWV3cywgZS5nLlxuICpcbiAqICUgaWYgKHNob3dpbmcpIHtcbiAqICAgPGRpdj48L2Rpdj5cbiAqICUgfVxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyKGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgdE5vZGUgPSBjb250YWluZXJJbnRlcm5hbChpbmRleCwgbnVsbCwgbnVsbCk7XG4gIGdldEZpcnN0VGVtcGxhdGVQYXNzKCkgJiYgKHROb2RlLnRWaWV3cyA9IFtdKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG5mdW5jdGlvbiBjb250YWluZXJJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdjb250YWluZXIgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IGNvbW1lbnQgPSBsVmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckNyZWF0ZUNvbW1lbnQrKztcbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgY29tbWVudCwgdGFnTmFtZSwgYXR0cnMpO1xuICBjb25zdCBsQ29udGFpbmVyID0gbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVMQ29udGFpbmVyKGxWaWV3W2FkanVzdGVkSW5kZXhdLCBsVmlldywgY29tbWVudCk7XG5cbiAgYXBwZW5kQ2hpbGQoY29tbWVudCwgdE5vZGUsIGxWaWV3KTtcblxuICAvLyBDb250YWluZXJzIGFyZSBhZGRlZCB0byB0aGUgY3VycmVudCB2aWV3IHRyZWUgaW5zdGVhZCBvZiB0aGVpciBlbWJlZGRlZCB2aWV3c1xuICAvLyBiZWNhdXNlIHZpZXdzIGNhbiBiZSByZW1vdmVkIGFuZCByZS1pbnNlcnRlZC5cbiAgYWRkVG9WaWV3VHJlZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsQ29udGFpbmVyKTtcblxuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICAvLyBwcmVwYXJlIHBsYWNlIGZvciBtYXRjaGluZyBub2RlcyBmcm9tIHZpZXdzIGluc2VydGVkIGludG8gYSBnaXZlbiBjb250YWluZXJcbiAgICBsQ29udGFpbmVyW1FVRVJJRVNdID0gY3VycmVudFF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIFROb2RlVHlwZS5Db250YWluZXIpO1xuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogU2V0cyBhIGNvbnRhaW5lciB1cCB0byByZWNlaXZlIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGNvbnRhaW5lciBpbiB0aGUgZGF0YSBhcnJheVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29udGFpbmVyUmVmcmVzaFN0YXJ0KGluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGxvYWRJbnRlcm5hbCh0Vmlldy5kYXRhLCBpbmRleCkgYXMgVE5vZGU7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcblxuICBsVmlld1tpbmRleCArIEhFQURFUl9PRkZTRVRdW0FDVElWRV9JTkRFWF0gPSAwO1xuXG4gIC8vIFdlIG5lZWQgdG8gZXhlY3V0ZSBpbml0IGhvb2tzIGhlcmUgc28gbmdPbkluaXQgaG9va3MgYXJlIGNhbGxlZCBpbiB0b3AgbGV2ZWwgdmlld3NcbiAgLy8gYmVmb3JlIHRoZXkgYXJlIGNhbGxlZCBpbiBlbWJlZGRlZCB2aWV3cyAoZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5KS5cbiAgZXhlY3V0ZUluaXRIb29rcyhsVmlldywgdFZpZXcsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgZW5kIG9mIHRoZSBMQ29udGFpbmVyLlxuICpcbiAqIE1hcmtpbmcgdGhlIGVuZCBvZiBMQ29udGFpbmVyIGlzIHRoZSB0aW1lIHdoZW4gdG8gY2hpbGQgdmlld3MgZ2V0IGluc2VydGVkIG9yIHJlbW92ZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoRW5kKCk6IHZvaWQge1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmIChnZXRJc1BhcmVudCgpKSB7XG4gICAgc2V0SXNQYXJlbnQoZmFsc2UpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShwcmV2aW91c09yUGFyZW50VE5vZGUsIFROb2RlVHlwZS5WaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG5cbiAgY29uc3QgbENvbnRhaW5lciA9IGdldExWaWV3KClbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XTtcbiAgY29uc3QgbmV4dEluZGV4ID0gbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdO1xuXG4gIC8vIHJlbW92ZSBleHRyYSB2aWV3cyBhdCB0aGUgZW5kIG9mIHRoZSBjb250YWluZXJcbiAgd2hpbGUgKG5leHRJbmRleCA8IGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRDb250YWluZXJOb2RlLCBuZXh0SW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlcyB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBjdXJyZW50ID0gZ2V0TFZpZXdDaGlsZChsVmlldyk7IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld1xuICAgIC8vIGhlYWRlci5cbiAgICBpZiAoY3VycmVudC5sZW5ndGggPCBIRUFERVJfT0ZGU0VUICYmIGN1cnJlbnRbQUNUSVZFX0lOREVYXSA9PT0gLTEpIHtcbiAgICAgIGNvbnN0IGNvbnRhaW5lciA9IGN1cnJlbnQgYXMgTENvbnRhaW5lcjtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjb250YWluZXJbVklFV1NdW2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIExvb2tzIGZvciBhIHZpZXcgd2l0aCBhIGdpdmVuIHZpZXcgYmxvY2sgaWQgaW5zaWRlIGEgcHJvdmlkZWQgTENvbnRhaW5lci5cbiAqIFJlbW92ZXMgdmlld3MgdGhhdCBuZWVkIHRvIGJlIGRlbGV0ZWQgaW4gdGhlIHByb2Nlc3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHRDb250YWluZXJOb2RlIHRvIHNlYXJjaCBmb3Igdmlld3NcbiAqIEBwYXJhbSBzdGFydElkeCBzdGFydGluZyBpbmRleCBpbiB0aGUgdmlld3MgYXJyYXkgdG8gc2VhcmNoIGZyb21cbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBleGFjdCB2aWV3IGJsb2NrIGlkIHRvIGxvb2sgZm9yXG4gKiBAcmV0dXJucyBpbmRleCBvZiBhIGZvdW5kIHZpZXcgb3IgLTEgaWYgbm90IGZvdW5kXG4gKi9cbmZ1bmN0aW9uIHNjYW5Gb3JWaWV3KFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSwgc3RhcnRJZHg6IG51bWJlcixcbiAgICB2aWV3QmxvY2tJZDogbnVtYmVyKTogTFZpZXd8bnVsbCB7XG4gIGNvbnN0IHZpZXdzID0gbENvbnRhaW5lcltWSUVXU107XG4gIGZvciAobGV0IGkgPSBzdGFydElkeDsgaSA8IHZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgdmlld0F0UG9zaXRpb25JZCA9IHZpZXdzW2ldW1RWSUVXXS5pZDtcbiAgICBpZiAodmlld0F0UG9zaXRpb25JZCA9PT0gdmlld0Jsb2NrSWQpIHtcbiAgICAgIHJldHVybiB2aWV3c1tpXTtcbiAgICB9IGVsc2UgaWYgKHZpZXdBdFBvc2l0aW9uSWQgPCB2aWV3QmxvY2tJZCkge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHRoYXQgc2hvdWxkIG5vdCBiZSBhdCB0aGlzIHBvc2l0aW9uIC0gcmVtb3ZlXG4gICAgICByZW1vdmVWaWV3KGxDb250YWluZXIsIHRDb250YWluZXJOb2RlLCBpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gZm91bmQgYSB2aWV3IHdpdGggaWQgZ3JlYXRlciB0aGFuIHRoZSBvbmUgd2UgYXJlIHNlYXJjaGluZyBmb3JcbiAgICAgIC8vIHdoaWNoIG1lYW5zIHRoYXQgcmVxdWlyZWQgdmlldyBkb2Vzbid0IGV4aXN0IGFuZCBjYW4ndCBiZSBmb3VuZCBhdFxuICAgICAgLy8gbGF0ZXIgcG9zaXRpb25zIGluIHRoZSB2aWV3cyBhcnJheSAtIHN0b3AgdGhlIHNlYXJjaGRlZi5jb250IGhlcmVcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBNYXJrcyB0aGUgc3RhcnQgb2YgYW4gZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBAcGFyYW0gdmlld0Jsb2NrSWQgVGhlIElEIG9mIHRoaXMgdmlld1xuICogQHJldHVybiBib29sZWFuIFdoZXRoZXIgb3Igbm90IHRoaXMgdmlldyBpcyBpbiBjcmVhdGlvbiBtb2RlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbWJlZGRlZFZpZXdTdGFydCh2aWV3QmxvY2tJZDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyKTogUmVuZGVyRmxhZ3Mge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAvLyBUaGUgcHJldmlvdXMgbm9kZSBjYW4gYmUgYSB2aWV3IG5vZGUgaWYgd2UgYXJlIHByb2Nlc3NpbmcgYW4gaW5saW5lIGZvciBsb29wXG4gIGNvbnN0IGNvbnRhaW5lclROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3ID9cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQgISA6XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGU7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1tjb250YWluZXJUTm9kZS5pbmRleF0gYXMgTENvbnRhaW5lcjtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoY29udGFpbmVyVE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBsZXQgdmlld1RvUmVuZGVyID0gc2NhbkZvclZpZXcoXG4gICAgICBsQ29udGFpbmVyLCBjb250YWluZXJUTm9kZSBhcyBUQ29udGFpbmVyTm9kZSwgbENvbnRhaW5lcltBQ1RJVkVfSU5ERVhdICEsIHZpZXdCbG9ja0lkKTtcblxuICBpZiAodmlld1RvUmVuZGVyKSB7XG4gICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBXaGVuIHdlIGNyZWF0ZSBhIG5ldyBMVmlldywgd2UgYWx3YXlzIHJlc2V0IHRoZSBzdGF0ZSBvZiB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgIHZpZXdUb1JlbmRlciA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBsVmlldyxcbiAgICAgICAgZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KHZpZXdCbG9ja0lkLCBjb25zdHMsIHZhcnMsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlKSwgbnVsbCxcbiAgICAgICAgTFZpZXdGbGFncy5DaGVja0Fsd2F5cyk7XG5cbiAgICBpZiAobENvbnRhaW5lcltRVUVSSUVTXSkge1xuICAgICAgdmlld1RvUmVuZGVyW1FVRVJJRVNdID0gbENvbnRhaW5lcltRVUVSSUVTXSAhLmNyZWF0ZVZpZXcoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVWaWV3Tm9kZSh2aWV3QmxvY2tJZCwgdmlld1RvUmVuZGVyKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9XG4gIGlmIChsQ29udGFpbmVyKSB7XG4gICAgaWYgKGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikpIHtcbiAgICAgIC8vIGl0IGlzIGEgbmV3IHZpZXcsIGluc2VydCBpdCBpbnRvIGNvbGxlY3Rpb24gb2Ygdmlld3MgZm9yIGEgZ2l2ZW4gY29udGFpbmVyXG4gICAgICBpbnNlcnRWaWV3KHZpZXdUb1JlbmRlciwgbENvbnRhaW5lciwgbFZpZXcsIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhLCAtMSk7XG4gICAgfVxuICAgIGxDb250YWluZXJbQUNUSVZFX0lOREVYXSAhKys7XG4gIH1cbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXdUb1JlbmRlcikgPyBSZW5kZXJGbGFncy5DcmVhdGUgfCBSZW5kZXJGbGFncy5VcGRhdGUgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplIHRoZSBUVmlldyAoZS5nLiBzdGF0aWMgZGF0YSkgZm9yIHRoZSBhY3RpdmUgZW1iZWRkZWQgdmlldy5cbiAqXG4gKiBFYWNoIGVtYmVkZGVkIHZpZXcgYmxvY2sgbXVzdCBjcmVhdGUgb3IgcmV0cmlldmUgaXRzIG93biBUVmlldy4gT3RoZXJ3aXNlLCB0aGUgZW1iZWRkZWQgdmlldydzXG4gKiBzdGF0aWMgZGF0YSBmb3IgYSBwYXJ0aWN1bGFyIG5vZGUgd291bGQgb3ZlcndyaXRlIHRoZSBzdGF0aWMgZGF0YSBmb3IgYSBub2RlIGluIHRoZSB2aWV3IGFib3ZlXG4gKiBpdCB3aXRoIHRoZSBzYW1lIGluZGV4IChzaW5jZSBpdCdzIGluIHRoZSBzYW1lIHRlbXBsYXRlKS5cbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSBpbmRleCBvZiB0aGUgVFZpZXcgaW4gVE5vZGUudFZpZXdzXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gdmFycyBUaGUgbnVtYmVyIG9mIGJpbmRpbmdzIGFuZCBwdXJlIGZ1bmN0aW9uIGJpbmRpbmdzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250YWluZXIgVGhlIHBhcmVudCBjb250YWluZXIgaW4gd2hpY2ggdG8gbG9vayBmb3IgdGhlIHZpZXcncyBzdGF0aWMgZGF0YVxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbWJlZGRlZFRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBwYXJlbnQ6IFRDb250YWluZXJOb2RlKTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocGFyZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgY29udGFpbmVyVFZpZXdzID0gcGFyZW50LnRWaWV3cyBhcyBUVmlld1tdO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChjb250YWluZXJUVmlld3MsICdUVmlldyBleHBlY3RlZCcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoQXJyYXkuaXNBcnJheShjb250YWluZXJUVmlld3MpLCB0cnVlLCAnVFZpZXdzIHNob3VsZCBiZSBpbiBhbiBhcnJheScpO1xuICBpZiAodmlld0luZGV4ID49IGNvbnRhaW5lclRWaWV3cy5sZW5ndGggfHwgY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF0gPT0gbnVsbCkge1xuICAgIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID0gY3JlYXRlVFZpZXcoXG4gICAgICAgIHZpZXdJbmRleCwgbnVsbCwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuICByZXR1cm4gY29udGFpbmVyVFZpZXdzW3ZpZXdJbmRleF07XG59XG5cbi8qKiBNYXJrcyB0aGUgZW5kIG9mIGFuIGVtYmVkZGVkIHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gZW1iZWRkZWRWaWV3RW5kKCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHZpZXdIb3N0ID0gbFZpZXdbSE9TVF9OT0RFXTtcblxuICBpZiAoaXNDcmVhdGlvbk1vZGUobFZpZXcpKSB7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldyk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICB9XG4gIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MobFZpZXcpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICBsZWF2ZVZpZXcobFZpZXdbUEFSRU5UXSAhKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHZpZXdIb3N0ICEpO1xuICBzZXRJc1BhcmVudChmYWxzZSk7XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaDxUPihhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoYWRqdXN0ZWRFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxWaWV3W1RWSUVXXS5kYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuXG4gIC8vIE9ubHkgYXR0YWNoZWQgQ2hlY2tBbHdheXMgY29tcG9uZW50cyBvciBhdHRhY2hlZCwgZGlydHkgT25QdXNoIGNvbXBvbmVudHMgc2hvdWxkIGJlIGNoZWNrZWRcbiAgaWYgKHZpZXdBdHRhY2hlZChob3N0VmlldykgJiYgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIHN5bmNWaWV3V2l0aEJsdWVwcmludChob3N0Vmlldyk7XG4gICAgY2hlY2tWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3OiBMVmlldykge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKiBSZXR1cm5zIGEgYm9vbGVhbiBmb3Igd2hldGhlciB0aGUgdmlldyBpcyBhdHRhY2hlZCAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZpZXdBdHRhY2hlZCh2aWV3OiBMVmlldyk6IGJvb2xlYW4ge1xuICByZXR1cm4gKHZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5BdHRhY2hlZCkgPT09IExWaWV3RmxhZ3MuQXR0YWNoZWQ7XG59XG5cbi8qKlxuICogSW5zdHJ1Y3Rpb24gdG8gZGlzdHJpYnV0ZSBwcm9qZWN0YWJsZSBub2RlcyBhbW9uZyA8bmctY29udGVudD4gb2NjdXJyZW5jZXMgaW4gYSBnaXZlbiB0ZW1wbGF0ZS5cbiAqIEl0IHRha2VzIGFsbCB0aGUgc2VsZWN0b3JzIGZyb20gdGhlIGVudGlyZSBjb21wb25lbnQncyB0ZW1wbGF0ZSBhbmQgZGVjaWRlcyB3aGVyZVxuICogZWFjaCBwcm9qZWN0ZWQgbm9kZSBiZWxvbmdzIChpdCByZS1kaXN0cmlidXRlcyBub2RlcyBhbW9uZyBcImJ1Y2tldHNcIiB3aGVyZSBlYWNoIFwiYnVja2V0XCIgaXNcbiAqIGJhY2tlZCBieSBhIHNlbGVjdG9yKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHJlcXVpcmVzIENTUyBzZWxlY3RvcnMgdG8gYmUgcHJvdmlkZWQgaW4gMiBmb3JtczogcGFyc2VkIChieSBhIGNvbXBpbGVyKSBhbmQgdGV4dCxcbiAqIHVuLXBhcnNlZCBmb3JtLlxuICpcbiAqIFRoZSBwYXJzZWQgZm9ybSBpcyBuZWVkZWQgZm9yIGVmZmljaWVudCBtYXRjaGluZyBvZiBhIG5vZGUgYWdhaW5zdCBhIGdpdmVuIENTUyBzZWxlY3Rvci5cbiAqIFRoZSB1bi1wYXJzZWQsIHRleHR1YWwgZm9ybSBpcyBuZWVkZWQgZm9yIHN1cHBvcnQgb2YgdGhlIG5nUHJvamVjdEFzIGF0dHJpYnV0ZS5cbiAqXG4gKiBIYXZpbmcgYSBDU1Mgc2VsZWN0b3IgaW4gMiBkaWZmZXJlbnQgZm9ybWF0cyBpcyBub3QgaWRlYWwsIGJ1dCBhbHRlcm5hdGl2ZXMgaGF2ZSBldmVuIG1vcmVcbiAqIGRyYXdiYWNrczpcbiAqIC0gaGF2aW5nIG9ubHkgYSB0ZXh0dWFsIGZvcm0gd291bGQgcmVxdWlyZSBydW50aW1lIHBhcnNpbmcgb2YgQ1NTIHNlbGVjdG9ycztcbiAqIC0gd2UgY2FuJ3QgaGF2ZSBvbmx5IGEgcGFyc2VkIGFzIHdlIGNhbid0IHJlLWNvbnN0cnVjdCB0ZXh0dWFsIGZvcm0gZnJvbSBpdCAoYXMgZW50ZXJlZCBieSBhXG4gKiB0ZW1wbGF0ZSBhdXRob3IpLlxuICpcbiAqIEBwYXJhbSBzZWxlY3RvcnMgQSBjb2xsZWN0aW9uIG9mIHBhcnNlZCBDU1Mgc2VsZWN0b3JzXG4gKiBAcGFyYW0gcmF3U2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBDU1Mgc2VsZWN0b3JzIGluIHRoZSByYXcsIHVuLXBhcnNlZCBmb3JtXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uRGVmKHNlbGVjdG9ycz86IENzc1NlbGVjdG9yTGlzdFtdLCB0ZXh0U2VsZWN0b3JzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGZpbmRDb21wb25lbnRWaWV3KGdldExWaWV3KCkpW0hPU1RfTk9ERV0gYXMgVEVsZW1lbnROb2RlO1xuXG4gIGlmICghY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uKSB7XG4gICAgY29uc3Qgbm9PZk5vZGVCdWNrZXRzID0gc2VsZWN0b3JzID8gc2VsZWN0b3JzLmxlbmd0aCArIDEgOiAxO1xuICAgIGNvbnN0IHBEYXRhOiAoVE5vZGUgfCBudWxsKVtdID0gY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uID1cbiAgICAgICAgbmV3IEFycmF5KG5vT2ZOb2RlQnVja2V0cykuZmlsbChudWxsKTtcbiAgICBjb25zdCB0YWlsczogKFROb2RlIHwgbnVsbClbXSA9IHBEYXRhLnNsaWNlKCk7XG5cbiAgICBsZXQgY29tcG9uZW50Q2hpbGQ6IFROb2RlfG51bGwgPSBjb21wb25lbnROb2RlLmNoaWxkO1xuXG4gICAgd2hpbGUgKGNvbXBvbmVudENoaWxkICE9PSBudWxsKSB7XG4gICAgICBjb25zdCBidWNrZXRJbmRleCA9XG4gICAgICAgICAgc2VsZWN0b3JzID8gbWF0Y2hpbmdTZWxlY3RvckluZGV4KGNvbXBvbmVudENoaWxkLCBzZWxlY3RvcnMsIHRleHRTZWxlY3RvcnMgISkgOiAwO1xuICAgICAgY29uc3QgbmV4dE5vZGUgPSBjb21wb25lbnRDaGlsZC5uZXh0O1xuXG4gICAgICBpZiAodGFpbHNbYnVja2V0SW5kZXhdKSB7XG4gICAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSAhLm5leHQgPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBEYXRhW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuICAgICAgICBjb21wb25lbnRDaGlsZC5uZXh0ID0gbnVsbDtcbiAgICAgIH1cbiAgICAgIHRhaWxzW2J1Y2tldEluZGV4XSA9IGNvbXBvbmVudENoaWxkO1xuXG4gICAgICBjb21wb25lbnRDaGlsZCA9IG5leHROb2RlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN0YWNrIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBwcm9qZWN0aW9uIG5vZGVzIGluIHByb2plY3Rpb24oKSBpbnN0cnVjdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGRlbGliZXJhdGVseSBjcmVhdGVkIG91dHNpZGUgb2YgcHJvamVjdGlvbigpIHRvIGF2b2lkIGFsbG9jYXRpbmdcbiAqIGEgbmV3IGFycmF5IGVhY2ggdGltZSB0aGUgZnVuY3Rpb24gaXMgY2FsbGVkLiBJbnN0ZWFkIHRoZSBhcnJheSB3aWxsIGJlXG4gKiByZS11c2VkIGJ5IGVhY2ggaW52b2NhdGlvbi4gVGhpcyB3b3JrcyBiZWNhdXNlIHRoZSBmdW5jdGlvbiBpcyBub3QgcmVlbnRyYW50LlxuICovXG5jb25zdCBwcm9qZWN0aW9uTm9kZVN0YWNrOiAoTFZpZXcgfCBUTm9kZSlbXSA9IFtdO1xuXG4vKipcbiAqIEluc2VydHMgcHJldmlvdXNseSByZS1kaXN0cmlidXRlZCBwcm9qZWN0ZWQgbm9kZXMuIFRoaXMgaW5zdHJ1Y3Rpb24gbXVzdCBiZSBwcmVjZWRlZCBieSBhIGNhbGxcbiAqIHRvIHRoZSBwcm9qZWN0aW9uRGVmIGluc3RydWN0aW9uLlxuICpcbiAqIEBwYXJhbSBub2RlSW5kZXhcbiAqIEBwYXJhbSBzZWxlY3RvckluZGV4OlxuICogICAgICAgIC0gMCB3aGVuIHRoZSBzZWxlY3RvciBpcyBgKmAgKG9yIHVuc3BlY2lmaWVkIGFzIHRoaXMgaXMgdGhlIGRlZmF1bHQgdmFsdWUpLFxuICogICAgICAgIC0gMSBiYXNlZCBpbmRleCBvZiB0aGUgc2VsZWN0b3IgZnJvbSB0aGUge0BsaW5rIHByb2plY3Rpb25EZWZ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9qZWN0aW9uKG5vZGVJbmRleDogbnVtYmVyLCBzZWxlY3RvckluZGV4OiBudW1iZXIgPSAwLCBhdHRycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFByb2plY3Rpb25Ob2RlID1cbiAgICAgIGNyZWF0ZU5vZGVBdEluZGV4KG5vZGVJbmRleCwgVE5vZGVUeXBlLlByb2plY3Rpb24sIG51bGwsIG51bGwsIGF0dHJzIHx8IG51bGwpO1xuXG4gIC8vIFdlIGNhbid0IHVzZSB2aWV3RGF0YVtIT1NUX05PREVdIGJlY2F1c2UgcHJvamVjdGlvbiBub2RlcyBjYW4gYmUgbmVzdGVkIGluIGVtYmVkZGVkIHZpZXdzLlxuICBpZiAodFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPT09IG51bGwpIHRQcm9qZWN0aW9uTm9kZS5wcm9qZWN0aW9uID0gc2VsZWN0b3JJbmRleDtcblxuICAvLyBgPG5nLWNvbnRlbnQ+YCBoYXMgbm8gY29udGVudFxuICBzZXRJc1BhcmVudChmYWxzZSk7XG5cbiAgLy8gcmUtZGlzdHJpYnV0aW9uIG9mIHByb2plY3RhYmxlIG5vZGVzIGlzIHN0b3JlZCBvbiBhIGNvbXBvbmVudCdzIHZpZXcgbGV2ZWxcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KGxWaWV3KTtcbiAgY29uc3QgY29tcG9uZW50Tm9kZSA9IGNvbXBvbmVudFZpZXdbSE9TVF9OT0RFXSBhcyBURWxlbWVudE5vZGU7XG4gIGxldCBub2RlVG9Qcm9qZWN0ID0gKGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiBhcyhUTm9kZSB8IG51bGwpW10pW3NlbGVjdG9ySW5kZXhdO1xuICBsZXQgcHJvamVjdGVkVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhO1xuICBsZXQgcHJvamVjdGlvbk5vZGVJbmRleCA9IC0xO1xuXG4gIHdoaWxlIChub2RlVG9Qcm9qZWN0KSB7XG4gICAgaWYgKG5vZGVUb1Byb2plY3QudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgIC8vIFRoaXMgbm9kZSBpcyByZS1wcm9qZWN0ZWQsIHNvIHdlIG11c3QgZ28gdXAgdGhlIHRyZWUgdG8gZ2V0IGl0cyBwcm9qZWN0ZWQgbm9kZXMuXG4gICAgICBjb25zdCBjdXJyZW50Q29tcG9uZW50VmlldyA9IGZpbmRDb21wb25lbnRWaWV3KHByb2plY3RlZFZpZXcpO1xuICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudEhvc3QgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgIGNvbnN0IGZpcnN0UHJvamVjdGVkTm9kZSA9XG4gICAgICAgICAgKGN1cnJlbnRDb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVtub2RlVG9Qcm9qZWN0LnByb2plY3Rpb24gYXMgbnVtYmVyXTtcblxuICAgICAgaWYgKGZpcnN0UHJvamVjdGVkTm9kZSkge1xuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBub2RlVG9Qcm9qZWN0O1xuICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBwcm9qZWN0ZWRWaWV3O1xuXG4gICAgICAgIG5vZGVUb1Byb2plY3QgPSBmaXJzdFByb2plY3RlZE5vZGU7XG4gICAgICAgIHByb2plY3RlZFZpZXcgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBUaGlzIGZsYWcgbXVzdCBiZSBzZXQgbm93IG9yIHdlIHdvbid0IGtub3cgdGhhdCB0aGlzIG5vZGUgaXMgcHJvamVjdGVkXG4gICAgICAvLyBpZiB0aGUgbm9kZXMgYXJlIGluc2VydGVkIGludG8gYSBjb250YWluZXIgbGF0ZXIuXG4gICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICBhcHBlbmRQcm9qZWN0ZWROb2RlKG5vZGVUb1Byb2plY3QsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcsIHByb2plY3RlZFZpZXcpO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGFyZSBmaW5pc2hlZCB3aXRoIGEgbGlzdCBvZiByZS1wcm9qZWN0ZWQgbm9kZXMsIHdlIG5lZWQgdG8gZ2V0XG4gICAgLy8gYmFjayB0byB0aGUgcm9vdCBwcm9qZWN0aW9uIG5vZGUgdGhhdCB3YXMgcmUtcHJvamVjdGVkLlxuICAgIGlmIChub2RlVG9Qcm9qZWN0Lm5leHQgPT09IG51bGwgJiYgcHJvamVjdGVkVmlldyAhPT0gY29tcG9uZW50Vmlld1tQQVJFTlRdICEpIHtcbiAgICAgIHByb2plY3RlZFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXc7XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gcHJvamVjdGlvbk5vZGVTdGFja1twcm9qZWN0aW9uTm9kZUluZGV4LS1dIGFzIFROb2RlO1xuICAgIH1cbiAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBzdGF0ZSBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4oXG4gICAgbFZpZXc6IExWaWV3LCBhZGp1c3RlZEhvc3RJbmRleDogbnVtYmVyLCBzdGF0ZTogVCk6IFQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgZmlyc3RUZW1wbGF0ZVBhc3MgPSBnZXRGaXJzdFRlbXBsYXRlUGFzcygpO1xuICBpZiAobFZpZXdbVEFJTF0pIHtcbiAgICBsVmlld1tUQUlMXSAhW05FWFRdID0gc3RhdGU7XG4gIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5jaGlsZEluZGV4ID0gYWRqdXN0ZWRIb3N0SW5kZXg7XG4gIH1cbiAgbFZpZXdbVEFJTF0gPSBzdGF0ZTtcbiAgcmV0dXJuIHN0YXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbi8qKiBXcmFwcyBhbiBldmVudCBsaXN0ZW5lciB3aXRoIHByZXZlbnREZWZhdWx0IGJlaGF2aW9yLiAqL1xuZnVuY3Rpb24gd3JhcExpc3RlbmVyV2l0aFByZXZlbnREZWZhdWx0KGxpc3RlbmVyRm46IChlPzogYW55KSA9PiBhbnkpOiBFdmVudExpc3RlbmVyIHtcbiAgcmV0dXJuIGZ1bmN0aW9uIHdyYXBMaXN0ZW5lckluX3ByZXZlbnREZWZhdWx0KGU6IEV2ZW50KSB7XG4gICAgaWYgKGxpc3RlbmVyRm4oZSkgPT09IGZhbHNlKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAvLyBOZWNlc3NhcnkgZm9yIGxlZ2FjeSBicm93c2VycyB0aGF0IGRvbid0IHN1cHBvcnQgcHJldmVudERlZmF1bHQgKGUuZy4gSUUpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgfVxuICB9O1xufVxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3IHtcbiAgd2hpbGUgKGxWaWV3ICYmICEobFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpKSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgbFZpZXcgPSBsVmlld1tQQVJFTlRdICE7XG4gIH1cbiAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljazxUPihyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVc2VkIHRvIHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVGhpcyBpcyBlcXVpdmFsZW50IHRvIGBkZXRlY3RDaGFuZ2VzYCwgYnV0IGludm9rZWQgb24gcm9vdCBjb21wb25lbnQuIEFkZGl0aW9uYWxseSwgYHRpY2tgXG4gKiBleGVjdXRlcyBsaWZlY3ljbGUgaG9va3MgYW5kIGNvbmRpdGlvbmFsbHkgY2hlY2tzIGNvbXBvbmVudHMgYmFzZWQgb24gdGhlaXJcbiAqIGBDaGFuZ2VEZXRlY3Rpb25TdHJhdGVneWAgYW5kIGRpcnRpbmVzcy5cbiAqXG4gKiBUaGUgcHJlZmVycmVkIHdheSB0byB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24gaXMgdG8gY2FsbCBgbWFya0RpcnR5YC4gYG1hcmtEaXJ0eWAgaW50ZXJuYWxseVxuICogc2NoZWR1bGVzIGB0aWNrYCB1c2luZyBhIHNjaGVkdWxlciBpbiBvcmRlciB0byBjb2FsZXNjZSBtdWx0aXBsZSBgbWFya0RpcnR5YCBjYWxscyBpbnRvIGFcbiAqIHNpbmdsZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi4gQnkgZGVmYXVsdCwgdGhlIHNjaGVkdWxlciBpcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCwgYnV0IGNhblxuICogYmUgY2hhbmdlZCB3aGVuIGNhbGxpbmcgYHJlbmRlckNvbXBvbmVudGAgYW5kIHByb3ZpZGluZyB0aGUgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGljazxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3Qgcm9vdFZpZXcgPSBnZXRSb290Vmlldyhjb21wb25lbnQpO1xuICBjb25zdCByb290Q29udGV4dCA9IHJvb3RWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0O1xuICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xufVxuXG5mdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSAhLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgY29tcG9uZW50IChhbmQgcG9zc2libHkgaXRzIHN1Yi1jb21wb25lbnRzKS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHRyaWdnZXJzIGNoYW5nZSBkZXRlY3Rpb24gaW4gYSBzeW5jaHJvbm91cyB3YXkgb24gYSBjb21wb25lbnQuIFRoZXJlIHNob3VsZFxuICogYmUgdmVyeSBsaXR0bGUgcmVhc29uIHRvIGNhbGwgdGhpcyBmdW5jdGlvbiBkaXJlY3RseSBzaW5jZSBhIHByZWZlcnJlZCB3YXkgdG8gZG8gY2hhbmdlXG4gKiBkZXRlY3Rpb24gaXMgdG8ge0BsaW5rIG1hcmtEaXJ0eX0gdGhlIGNvbXBvbmVudCBhbmQgd2FpdCBmb3IgdGhlIHNjaGVkdWxlciB0byBjYWxsIHRoaXMgbWV0aG9kXG4gKiBhdCBzb21lIGZ1dHVyZSBwb2ludCBpbiB0aW1lLiBUaGlzIGlzIGJlY2F1c2UgYSBzaW5nbGUgdXNlciBhY3Rpb24gb2Z0ZW4gcmVzdWx0cyBpbiBtYW55XG4gKiBjb21wb25lbnRzIGJlaW5nIGludmFsaWRhdGVkIGFuZCBjYWxsaW5nIGNoYW5nZSBkZXRlY3Rpb24gb24gZWFjaCBjb21wb25lbnQgc3luY2hyb25vdXNseVxuICogd291bGQgYmUgaW5lZmZpY2llbnQuIEl0IGlzIGJldHRlciB0byB3YWl0IHVudGlsIGFsbCBjb21wb25lbnRzIGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kXG4gKiB0aGVuIHBlcmZvcm0gc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gYWNyb3NzIGFsbCBvZiB0aGUgY29tcG9uZW50c1xuICpcbiAqIEBwYXJhbSBjb21wb25lbnQgVGhlIGNvbXBvbmVudCB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCkgITtcbiAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHZpZXcsIGNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gdmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcblxuICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICBpZiAoaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgfVxuICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyB1cGRhdGUgbW9kZSBwYXNzXG5cbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlcyhjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tWaWV3PFQ+KGhvc3RWaWV3OiBMVmlldywgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbSE9TVF9OT0RFXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3Qgdmlld1F1ZXJ5ID0gaG9zdFRWaWV3LnZpZXdRdWVyeTtcblxuICB0cnkge1xuICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICBjcmVhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBob3N0VmlldywgY29tcG9uZW50KTtcbiAgICB0ZW1wbGF0ZUZuKGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICB1cGRhdGVWaWV3UXVlcnkodmlld1F1ZXJ5LCBob3N0VmlldywgY29tcG9uZW50KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld1F1ZXJ5PFQ+KHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8e30+fCBudWxsLCB2aWV3OiBMVmlldywgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGlmICh2aWV3UXVlcnkgJiYgaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICB2aWV3UXVlcnkoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb21wb25lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVZpZXdRdWVyeTxUPih2aWV3UXVlcnk6IENvbXBvbmVudFF1ZXJ5PHt9PnwgbnVsbCwgdmlldzogTFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBpZiAodmlld1F1ZXJ5ICYmICFpc0NyZWF0aW9uTW9kZSh2aWV3KSkge1xuICAgIHZpZXdRdWVyeShSZW5kZXJGbGFncy5VcGRhdGUsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCByb290VmlldyA9IG1hcmtWaWV3RGlydHkoZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdFZpZXdbQ09OVEVYVF0sICdyb290Q29udGV4dCBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICBzY2hlZHVsZVRpY2socm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICByZXR1cm4gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGxWaWV3W0JJTkRJTkdfSU5ERVhdKyssIHZhbHVlKSA/IHZhbHVlIDogTk9fQ0hBTkdFO1xufVxuXG4vKipcbiAqIEFsbG9jYXRlcyB0aGUgbmVjZXNzYXJ5IGFtb3VudCBvZiBzbG90cyBmb3IgaG9zdCB2YXJzLlxuICpcbiAqIEBwYXJhbSBjb3VudCBBbW91bnQgb2YgdmFycyB0byBiZSBhbGxvY2F0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jSG9zdFZhcnMoY291bnQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAoIWdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHJldHVybjtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKHRWaWV3LCBnZXRDdXJyZW50RGlyZWN0aXZlRGVmKCkgISwgY291bnQpO1xuICBwcmVmaWxsSG9zdFZhcnModFZpZXcsIGxWaWV3LCBjb3VudCk7XG59XG5cbi8qKlxuICogQ3JlYXRlIGludGVycG9sYXRpb24gYmluZGluZ3Mgd2l0aCBhIHZhcmlhYmxlIG51bWJlciBvZiBleHByZXNzaW9ucy5cbiAqXG4gKiBJZiB0aGVyZSBhcmUgMSB0byA4IGV4cHJlc3Npb25zIGBpbnRlcnBvbGF0aW9uMSgpYCB0byBgaW50ZXJwb2xhdGlvbjgoKWAgc2hvdWxkIGJlIHVzZWQgaW5zdGVhZC5cbiAqIFRob3NlIGFyZSBmYXN0ZXIgYmVjYXVzZSB0aGVyZSBpcyBubyBuZWVkIHRvIGNyZWF0ZSBhbiBhcnJheSBvZiBleHByZXNzaW9ucyBhbmQgaXRlcmF0ZSBvdmVyIGl0LlxuICpcbiAqIGB2YWx1ZXNgOlxuICogLSBoYXMgc3RhdGljIHRleHQgYXQgZXZlbiBpbmRleGVzLFxuICogLSBoYXMgZXZhbHVhdGVkIGV4cHJlc3Npb25zIGF0IG9kZCBpbmRleGVzLlxuICpcbiAqIFJldHVybnMgdGhlIGNvbmNhdGVuYXRlZCBzdHJpbmcgd2hlbiBhbnkgb2YgdGhlIGFyZ3VtZW50cyBjaGFuZ2VzLCBgTk9fQ0hBTkdFYCBvdGhlcndpc2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uVih2YWx1ZXM6IGFueVtdKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMZXNzVGhhbigyLCB2YWx1ZXMubGVuZ3RoLCAnc2hvdWxkIGhhdmUgYXQgbGVhc3QgMyB2YWx1ZXMnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHZhbHVlcy5sZW5ndGggJSAyLCAxLCAnc2hvdWxkIGhhdmUgYW4gb2RkIG51bWJlciBvZiB2YWx1ZXMnKTtcbiAgbGV0IGRpZmZlcmVudCA9IGZhbHNlO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG5cbiAgbGV0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdJbmRleDtcblxuICBpZiAoIWRpZmZlcmVudCkge1xuICAgIHJldHVybiBOT19DSEFOR0U7XG4gIH1cblxuICAvLyBCdWlsZCB0aGUgdXBkYXRlZCBjb250ZW50XG4gIGxldCBjb250ZW50ID0gdmFsdWVzWzBdO1xuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIGNvbnRlbnQgKz0gc3RyaW5naWZ5KHZhbHVlc1tpXSkgKyB2YWx1ZXNbaSArIDFdO1xuICB9XG5cbiAgcmV0dXJuIGNvbnRlbnQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAxIGV4cHJlc3Npb24uXG4gKlxuICogQHBhcmFtIHByZWZpeCBzdGF0aWMgdmFsdWUgdXNlZCBmb3IgY29uY2F0ZW5hdGlvbiBvbmx5LlxuICogQHBhcmFtIHYwIHZhbHVlIGNoZWNrZWQgZm9yIGNoYW5nZS5cbiAqIEBwYXJhbSBzdWZmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24xKHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkKGxWaWV3LCBsVmlld1tCSU5ESU5HX0lOREVYXSwgdjApO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSAxO1xuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCB2MCwgdjEpO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSAyO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyhsVmlldywgbFZpZXdbQklORElOR19JTkRFWF0sIHYwLCB2MSwgdjIpO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSAzO1xuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgc3VmZml4IDpcbiAgICAgICAgICAgICAgICAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZSBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA0IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb240KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBsVmlld1tCSU5ESU5HX0lOREVYXSwgdjAsIHYxLCB2MiwgdjMpO1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA0O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArXG4gICAgICAgICAgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNSBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNShcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDU7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA2IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb242KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDIobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSkgfHwgZGlmZmVyZW50O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA2O1xuXG4gIHJldHVybiBkaWZmZXJlbnQgP1xuICAgICAgcHJlZml4ICsgc3RyaW5naWZ5KHYwKSArIGkwICsgc3RyaW5naWZ5KHYxKSArIGkxICsgc3RyaW5naWZ5KHYyKSArIGkyICsgc3RyaW5naWZ5KHYzKSArIGkzICtcbiAgICAgICAgICBzdHJpbmdpZnkodjQpICsgaTQgKyBzdHJpbmdpZnkodjUpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggNyBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uNyhcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBsZXQgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQzKGxWaWV3LCBiaW5kaW5nSW5kZXggKyA0LCB2NCwgdjUsIHY2KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDc7XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyBzdHJpbmdpZnkodjApICsgaTAgKyBzdHJpbmdpZnkodjEpICsgaTEgKyBzdHJpbmdpZnkodjIpICsgaTIgKyBzdHJpbmdpZnkodjMpICsgaTMgK1xuICAgICAgICAgIHN0cmluZ2lmeSh2NCkgKyBpNCArIHN0cmluZ2lmeSh2NSkgKyBpNSArIHN0cmluZ2lmeSh2NikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA4IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb244KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIGk0OiBzdHJpbmcsIHY1OiBhbnksIGk1OiBzdHJpbmcsIHY2OiBhbnksIGk2OiBzdHJpbmcsIHY3OiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1LCB2NiwgdjcpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gODtcblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHN0cmluZ2lmeSh2MCkgKyBpMCArIHN0cmluZ2lmeSh2MSkgKyBpMSArIHN0cmluZ2lmeSh2MikgKyBpMiArIHN0cmluZ2lmeSh2MykgKyBpMyArXG4gICAgICAgICAgc3RyaW5naWZ5KHY0KSArIGk0ICsgc3RyaW5naWZ5KHY1KSArIGk1ICsgc3RyaW5naWZ5KHY2KSArIGk2ICsgc3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBTdG9yZSBhIHZhbHVlIGluIHRoZSBgZGF0YWAgYXQgYSBnaXZlbiBgaW5kZXhgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlPFQ+KGluZGV4OiBudW1iZXIsIHZhbHVlOiBUKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFdlIGRvbid0IHN0b3JlIGFueSBzdGF0aWMgZGF0YSBmb3IgbG9jYWwgdmFyaWFibGVzLCBzbyB0aGUgZmlyc3QgdGltZVxuICAvLyB3ZSBzZWUgdGhlIHRlbXBsYXRlLCB3ZSBzaG91bGQgc3RvcmUgYXMgbnVsbCB0byBhdm9pZCBhIHNwYXJzZSBhcnJheVxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBpZiAoYWRqdXN0ZWRJbmRleCA+PSB0Vmlldy5kYXRhLmxlbmd0aCkge1xuICAgIHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBudWxsO1xuICB9XG4gIGxWaWV3W2FkanVzdGVkSW5kZXhdID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGEgbG9jYWwgcmVmZXJlbmNlIGZyb20gdGhlIGN1cnJlbnQgY29udGV4dFZpZXdEYXRhLlxuICpcbiAqIElmIHRoZSByZWZlcmVuY2UgdG8gcmV0cmlldmUgaXMgaW4gYSBwYXJlbnQgdmlldywgdGhpcyBpbnN0cnVjdGlvbiBpcyB1c2VkIGluIGNvbmp1bmN0aW9uXG4gKiB3aXRoIGEgbmV4dENvbnRleHQoKSBjYWxsLCB3aGljaCB3YWxrcyB1cCB0aGUgdHJlZSBhbmQgdXBkYXRlcyB0aGUgY29udGV4dFZpZXdEYXRhIGluc3RhbmNlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGxvY2FsIHJlZiBpbiBjb250ZXh0Vmlld0RhdGEuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZlcmVuY2U8VD4oaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBjb250ZXh0TFZpZXcgPSBnZXRDb250ZXh0TFZpZXcoKTtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihjb250ZXh0TFZpZXcsIGluZGV4KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxvYWRRdWVyeUxpc3Q8VD4ocXVlcnlMaXN0SWR4OiBudW1iZXIpOiBRdWVyeUxpc3Q8VD4ge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RGVmaW5lZChcbiAgICAgICAgICBsVmlld1tDT05URU5UX1FVRVJJRVNdLCAnQ29udGVudCBRdWVyeUxpc3QgYXJyYXkgc2hvdWxkIGJlIGRlZmluZWQgaWYgcmVhZGluZyBhIHF1ZXJ5LicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXdbQ09OVEVOVF9RVUVSSUVTXSAhLCBxdWVyeUxpc3RJZHgpO1xuXG4gIHJldHVybiBsVmlld1tDT05URU5UX1FVRVJJRVNdICFbcXVlcnlMaXN0SWR4XTtcbn1cblxuLyoqIFJldHJpZXZlcyBhIHZhbHVlIGZyb20gY3VycmVudCBgdmlld0RhdGFgLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWQ8VD4oaW5kZXg6IG51bWJlcik6IFQge1xuICByZXR1cm4gbG9hZEludGVybmFsPFQ+KGdldExWaWV3KCksIGluZGV4KTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRElcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICB0b2tlbiA9IHJlc29sdmVGb3J3YXJkUmVmKHRva2VuKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgZ2V0TFZpZXcoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBGYWNhZGUgZm9yIHRoZSBhdHRyaWJ1dGUgaW5qZWN0aW9uIGZyb20gREkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICByZXR1cm4gaW5qZWN0QXR0cmlidXRlSW1wbChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgYXR0ck5hbWVUb0luamVjdCk7XG59XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgUXVlcnlMaXN0LCBhc3NvY2lhdGVkIHdpdGggYSBjb250ZW50IHF1ZXJ5LCBmb3IgbGF0ZXIgcmVmcmVzaCAocGFydCBvZiBhIHZpZXdcbiAqIHJlZnJlc2gpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJDb250ZW50UXVlcnk8UT4oXG4gICAgcXVlcnlMaXN0OiBRdWVyeUxpc3Q8UT4sIGN1cnJlbnREaXJlY3RpdmVJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdEYXRhID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSB2aWV3RGF0YVtUVklFV107XG4gIGNvbnN0IHNhdmVkQ29udGVudFF1ZXJpZXNMZW5ndGggPVxuICAgICAgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gfHwgKHZpZXdEYXRhW0NPTlRFTlRfUVVFUklFU10gPSBbXSkpLnB1c2gocXVlcnlMaXN0KTtcbiAgaWYgKGdldEZpcnN0VGVtcGxhdGVQYXNzKCkpIHtcbiAgICBjb25zdCB0Vmlld0NvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXMgfHwgKHRWaWV3LmNvbnRlbnRRdWVyaWVzID0gW10pO1xuICAgIGNvbnN0IGxhc3RTYXZlZERpcmVjdGl2ZUluZGV4ID1cbiAgICAgICAgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoID8gdFZpZXcuY29udGVudFF1ZXJpZXNbdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoIC0gMl0gOiAtMTtcbiAgICBpZiAoY3VycmVudERpcmVjdGl2ZUluZGV4ICE9PSBsYXN0U2F2ZWREaXJlY3RpdmVJbmRleCkge1xuICAgICAgdFZpZXdDb250ZW50UXVlcmllcy5wdXNoKGN1cnJlbnREaXJlY3RpdmVJbmRleCwgc2F2ZWRDb250ZW50UXVlcmllc0xlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGU6IFROb2RlIHwgbnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgLy8gSWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZC5cbiAgaWYgKHROb2RlKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gICAgfVxuICAgIHJldHVybiB0Tm9kZS5pbnB1dHM7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiBnZXRMVmlldygpIGFzIGFueSBhcyBPcGFxdWVWaWV3U3RhdGU7XG59XG5cbmZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG4iXX0=