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
import { BINDING_INDEX, CLEANUP, CONTAINER_INDEX, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, HOST_NODE, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TAIL, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, appendProjectedNode, createTextNode, getLViewChild, insertView, removeView } from './node_manipulation';
import { isNodeMatchingSelectorList, matchingSelectorIndex } from './node_selector_matcher';
import { decreaseElementDepthCount, enterView, getBindingsEnabled, getCheckNoChangesMode, getContextLView, getCurrentDirectiveDef, getElementDepthCount, getIsParent, getLView, getPreviousOrParentTNode, increaseElementDepthCount, isCreationMode, leaveView, nextContextImpl, resetComponentState, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setIsParent, setPreviousOrParentTNode } from './state';
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
    // Resetting the bindingIndex of the current LView as the next steps may trigger change detection.
    lView[BINDING_INDEX] = tView.bindingStartIndex;
    // If this is a creation pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update pass.
    if (!isCreationMode(lView)) {
        var checkNoChangesMode = getCheckNoChangesMode();
        executeInitHooks(lView, tView, checkNoChangesMode);
        refreshDynamicEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView);
        executeHooks(lView, tView.contentHooks, tView.contentCheckHooks, checkNoChangesMode, 1 /* AfterContentInitHooksToBeRun */);
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
        setCurrentQueryIndex(0);
        for (var i = 0; i < tView.contentQueries.length; i++) {
            var directiveDefIdx = tView.contentQueries[i];
            var directiveDef = tView.data[directiveDefIdx];
            directiveDef.contentQueriesRefresh(directiveDefIdx - HEADER_OFFSET);
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
    lView[FLAGS] = flags | 4 /* CreationMode */ | 64 /* Attached */ | 8 /* FirstLViewPass */;
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
    var previousOrParentTNode = getPreviousOrParentTNode();
    var isParent = getIsParent();
    var tNode = tView.data[adjustedIndex];
    if (tNode == null) {
        var parent_1 = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
        // Parents cannot cross component boundaries because components will be used in multiple places,
        // so it's only set if the view is the same.
        var parentInSameView = parent_1 && parent_1 !== lView[HOST_NODE];
        var tParentNode = parentInSameView ? parent_1 : null;
        tNode = tView.data[adjustedIndex] = createTNode(tParentNode, type, adjustedIndex, name, attrs);
    }
    // Now link ourselves into the tree.
    // We need this even if tNode exists, otherwise we might end up pointing to unexisting tNodes when
    // we use i18n (especially with ICU expressions that update the DOM during the update phase).
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
export function assignTViewNodeToLView(tView, tParentNode, index, lView) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    var tNode = tView.node;
    if (tNode == null) {
        ngDevMode && tParentNode &&
            assertNodeOfPossibleTypes(tParentNode, 3 /* Element */, 0 /* Container */);
        tView.node = tNode = createTNode(tParentNode, //
        2 /* View */, index, null, null);
    }
    return lView[HOST_NODE] = tNode;
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
        var hostLView = createLView(null, createTView(-1, null, 1, 0, null, null, null), {}, 16 /* CheckAlways */ | 256 /* IsRoot */, providedRendererFactory, renderer);
        enterView(hostLView, null); // SUSPECT! why do we need to enter the View?
        var componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null);
        hostView = createLView(hostLView, componentTView, context, 16 /* CheckAlways */, providedRendererFactory, renderer, sanitizer);
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
export function createEmbeddedViewAndNode(tView, context, declarationView, queries, injectorIndex) {
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    setIsParent(true);
    setPreviousOrParentTNode(null);
    var lView = createLView(declarationView, tView, context, 16 /* CheckAlways */);
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    assignTViewNodeToLView(tView, null, -1, lView);
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
    if (viewToRender[FLAGS] & 256 /* IsRoot */) {
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
            hostView[FLAGS] &= ~4 /* CreationMode */;
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
    if (tView.firstTemplatePass) {
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
export function createTNode(tParent, type, adjustedIndex, tagName, attrs) {
    ngDevMode && ngDevMode.tNode++;
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
        tViews: null,
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
    var isFirstRender = (lView[FLAGS] & 8 /* FirstLViewPass */) !== 0;
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
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
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
    if (!tView.firstTemplatePass && start < end) {
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
    var firstTemplatePass = tView.firstTemplatePass;
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
        assertEqual(tView.firstTemplatePass, true, 'Should only be called in first template pass.');
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
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
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
    var tView = getLView()[TVIEW];
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
}
/**
 * Stores host binding fn and number of host vars so it will be queued for binding refresh during
 * CD.
*/
function queueHostBindingForCheck(tView, def, hostVars) {
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called in first template pass.');
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
    var componentView = addToViewTree(lView, previousOrParentTNode.index, createLView(lView, tView, null, def.onPush ? 32 /* Dirty */ : 16 /* CheckAlways */, rendererFactory, lView[RENDERER_FACTORY].createRenderer(native, def)));
    componentView[HOST_NODE] = previousOrParentTNode;
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    componentView[HOST] = lView[previousOrParentTNode.index];
    lView[previousOrParentTNode.index] = componentView;
    if (lView[TVIEW].firstTemplatePass) {
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
    var tContainerNode = containerInternal(index, tagName || null, attrs || null);
    if (tView.firstTemplatePass) {
        tContainerNode.tViews = createTView(-1, templateFn, consts, vars, tView.directiveRegistry, tView.pipeRegistry, null);
    }
    createDirectivesAndLocals(tView, lView, localRefs, localRefExtractor);
    addTContainerToQueries(lView, tContainerNode);
    attachPatchData(getNativeByTNode(tContainerNode, lView), lView);
    registerPostOrderHooks(tView, tContainerNode);
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
    var lView = getLView();
    if (lView[TVIEW].firstTemplatePass) {
        tNode.tViews = [];
    }
    addTContainerToQueries(lView, tNode);
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
    ngDevMode && assertNodeType(getPreviousOrParentTNode(), 0 /* Container */);
    return tNode;
}
/**
 * Reporting a TContainer node queries is a 2-step process as we need to:
 * - check if the container node itself is matching (query might match a <ng-template> node);
 * - prepare room for nodes from views that might be created based on the TemplateRef linked to this
 * container.
 *
 * Those 2 operations need to happen in the specific order (match the container node itself, then
 * prepare space for nodes from views).
 */
function addTContainerToQueries(lView, tContainerNode) {
    var queries = lView[QUERIES];
    if (queries) {
        lView[QUERIES] = queries.addNode(tContainerNode);
        var lContainer = lView[tContainerNode.index];
        lContainer[QUERIES] = queries.container();
    }
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
        viewToRender = createLView(lView, getOrCreateEmbeddedTView(viewBlockId, consts, vars, containerTNode), null, 16 /* CheckAlways */);
        if (lContainer[QUERIES]) {
            viewToRender[QUERIES] = lContainer[QUERIES].createView();
        }
        var tParentNode = getIsParent() ? previousOrParentTNode :
            previousOrParentTNode && previousOrParentTNode.parent;
        assignTViewNodeToLView(viewToRender[TVIEW], tParentNode, viewBlockId, viewToRender);
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
        lView[FLAGS] &= ~4 /* CreationMode */;
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
    if (viewAttached(hostView) && hostView[FLAGS] & (16 /* CheckAlways */ | 32 /* Dirty */)) {
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
    return (view[FLAGS] & 64 /* Attached */) === 64 /* Attached */;
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
    if (lView[TAIL]) {
        lView[TAIL][NEXT] = state;
    }
    else if (tView.firstTemplatePass) {
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
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 32 /* Dirty */;
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
    while (lView && !(lView[FLAGS] & 256 /* IsRoot */)) {
        lView[FLAGS] |= 32 /* Dirty */;
        lView = lView[PARENT];
    }
    lView[FLAGS] |= 32 /* Dirty */;
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
        setCurrentQueryIndex(tView.viewQueryStartIndex);
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
    var lView = getLView();
    var tView = lView[TVIEW];
    if (!tView.firstTemplatePass)
        return;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zdHJ1Y3Rpb25zLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HO0FBRUgsT0FBTyxFQUFDLFdBQVcsRUFBMkIsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFcEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHakYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzdHLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFFekYsT0FBTyxFQUFDLGVBQWUsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNqRSxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBQzdGLE9BQU8sRUFBQyxlQUFlLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNoRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUscUJBQXFCLEVBQUUsOEJBQThCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkksT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JELE9BQU8sRUFBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDdEcs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UUFBUSxFQUE0QixDQUFDO0FBQzlDLENBQUM7QUFFRCxTQUFTLFVBQVUsQ0FBQyxJQUFXO0lBQzdCLHFGQUFxRjtJQUNyRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQztBQUMvQyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUMsSUFBVztJQUNsQyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0FBQzNELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELElBQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFVLENBQUM7SUFDbkQsT0FBTyxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDbEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0aW9uVG9rZW4sIEluamVjdG9yfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Jlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7dmFsaWRhdGVBdHRyaWJ1dGUsIHZhbGlkYXRlUHJvcGVydHl9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uL3Nhbml0aXphdGlvbi9zZWN1cml0eSc7XG5pbXBvcnQge1N0eWxlU2FuaXRpemVGbn0gZnJvbSAnLi4vc2FuaXRpemF0aW9uL3N0eWxlX3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdEVxdWFsfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5cbmltcG9ydCB7YXNzZXJ0SGFzUGFyZW50LCBhc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2JpbmRpbmdVcGRhdGVkLCBiaW5kaW5nVXBkYXRlZDIsIGJpbmRpbmdVcGRhdGVkMywgYmluZGluZ1VwZGF0ZWQ0fSBmcm9tICcuL2JpbmRpbmdzJztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlLCBpbmplY3RBdHRyaWJ1dGVJbXBsfSBmcm9tICcuL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZUluaXRIb29rcywgcmVnaXN0ZXJQb3N0T3JkZXJIb29rcywgcmVnaXN0ZXJQcmVPcmRlckhvb2tzfSBmcm9tICcuL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50UXVlcnksIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSwgTm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UGxheWVyRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL3BsYXllcic7XG5pbXBvcnQge0Nzc1NlbGVjdG9yTGlzdCwgTkdfUFJPSkVDVF9BU19BVFRSX05BTUV9IGZyb20gJy4vaW50ZXJmYWNlcy9wcm9qZWN0aW9uJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge0dsb2JhbFRhcmdldFJlc29sdmVyLCBQcm9jZWR1cmFsUmVuZGVyZXIzLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENMRUFOVVAsIENPTlRBSU5FUl9JTkRFWCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgT3BhcXVlVmlld1N0YXRlLCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBUQUlMLCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGFwcGVuZFByb2plY3RlZE5vZGUsIGNyZWF0ZVRleHROb2RlLCBnZXRMVmlld0NoaWxkLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QsIG1hdGNoaW5nU2VsZWN0b3JJbmRleH0gZnJvbSAnLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtkZWNyZWFzZUVsZW1lbnREZXB0aENvdW50LCBlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRDb250ZXh0TFZpZXcsIGdldEN1cnJlbnREaXJlY3RpdmVEZWYsIGdldEVsZW1lbnREZXB0aENvdW50LCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCwgaXNDcmVhdGlvbk1vZGUsIGxlYXZlVmlldywgbmV4dENvbnRleHRJbXBsLCByZXNldENvbXBvbmVudFN0YXRlLCBzZXRCaW5kaW5nUm9vdCwgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0SXNQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldEluaXRpYWxDbGFzc05hbWVWYWx1ZSwgaW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQgYXMgaW5pdGlhbGl6ZVN0YXRpY1N0eWxpbmdDb250ZXh0LCBwYXRjaENvbnRleHRXaXRoU3RhdGljQXR0cnMsIHJlbmRlckluaXRpYWxTdHlsZXNBbmRDbGFzc2VzLCByZW5kZXJTdHlsaW5nLCB1cGRhdGVDbGFzc1Byb3AgYXMgdXBkYXRlRWxlbWVudENsYXNzUHJvcCwgdXBkYXRlQ29udGV4dFdpdGhCaW5kaW5ncywgdXBkYXRlU3R5bGVQcm9wIGFzIHVwZGF0ZUVsZW1lbnRTdHlsZVByb3AsIHVwZGF0ZVN0eWxpbmdNYXB9IGZyb20gJy4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtCb3VuZFBsYXllckZhY3Rvcnl9IGZyb20gJy4vc3R5bGluZy9wbGF5ZXJfZmFjdG9yeSc7XG5pbXBvcnQge2NyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQsIGdldFN0eWxpbmdDb250ZXh0LCBoYXNDbGFzc0lucHV0LCBoYXNTdHlsaW5nLCBpc0FuaW1hdGlvblByb3B9IGZyb20gJy4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuL3Rva2Vucyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCBmaW5kQ29tcG9uZW50VmlldywgZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIGdldFJvb3RDb250ZXh0LCBnZXRSb290VmlldywgZ2V0VE5vZGUsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgaXNDb250ZW50UXVlcnlIb3N0LCBsb2FkSW50ZXJuYWwsIHJlYWRFbGVtZW50VmFsdWUsIHJlYWRQYXRjaGVkTFZpZXcsIHJlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG5jb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50c1xuICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gIC8vIFJlc2V0dGluZyB0aGUgYmluZGluZ0luZGV4IG9mIHRoZSBjdXJyZW50IExWaWV3IGFzIHRoZSBuZXh0IHN0ZXBzIG1heSB0cmlnZ2VyIGNoYW5nZSBkZXRlY3Rpb24uXG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXg7XG5cbiAgLy8gSWYgdGhpcyBpcyBhIGNyZWF0aW9uIHBhc3MsIHdlIHNob3VsZCBub3QgY2FsbCBsaWZlY3ljbGUgaG9va3Mgb3IgZXZhbHVhdGUgYmluZGluZ3MuXG4gIC8vIFRoaXMgd2lsbCBiZSBkb25lIGluIHRoZSB1cGRhdGUgcGFzcy5cbiAgaWYgKCFpc0NyZWF0aW9uTW9kZShsVmlldykpIHtcbiAgICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICAgIGV4ZWN1dGVJbml0SG9va3MobFZpZXcsIHRWaWV3LCBjaGVja05vQ2hhbmdlc01vZGUpO1xuXG4gICAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0Vmlldyk7XG5cbiAgICBleGVjdXRlSG9va3MoXG4gICAgICAgIGxWaWV3LCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUsXG4gICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuXG4gICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICBsZXQgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gLTE7XG4gICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGluc3RydWN0aW9uID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1tpXTtcbiAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBtZWFuIHRoYXQgd2UgYXJlIHN0YXJ0aW5nIG5ldyBFWFBBTkRPIGJsb2NrIGFuZCBuZWVkIHRvIHVwZGF0ZVxuICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICBjdXJyZW50RWxlbWVudEluZGV4ID0gLWluc3RydWN0aW9uO1xuICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICBjb25zdCBwcm92aWRlckNvdW50ID0gKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbKytpXSBhcyBudW1iZXIpO1xuICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgIC8vICh0byBnZXQgdG8gdGhlIG5leHQgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKS5cbiAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgaWYgKGluc3RydWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIGluc3RydWN0aW9uKFxuICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGUsIHJlYWRFbGVtZW50VmFsdWUodmlld0RhdGFbY3VycmVudERpcmVjdGl2ZUluZGV4XSksXG4gICAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXgpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNvbnRlbnQgcXVlcmllcyBmb3IgYWxsIGRpcmVjdGl2ZXMgaW4gdGhlIGdpdmVuIHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXNSZWZyZXNoICEoZGlyZWN0aXZlRGVmSWR4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlldyB8IG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTMgfCBudWxsLCByZW5kZXJlcj86IFJlbmRlcmVyMyB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCwgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcztcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSwgJ1JlbmRlcmVyRmFjdG9yeSBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tSRU5ERVJFUl0gPSAocmVuZGVyZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJdKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCAhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmF0aXZlOiBSRWxlbWVudCB8IFJUZXh0IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYXRpdmU6IG51bGwsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3VDb250YWluZXIsIG5hdGl2ZTogUkNvbW1lbnQsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb2RlQXRJbmRleChcbiAgICBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hdGl2ZTogUlRleHQgfCBSRWxlbWVudCB8IFJDb21tZW50IHwgbnVsbCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmXG4gICAgVEljdUNvbnRhaW5lck5vZGUge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydExlc3NUaGFuKGFkanVzdGVkSW5kZXgsIGxWaWV3Lmxlbmd0aCwgYFNsb3Qgc2hvdWxkIGhhdmUgYmVlbiBpbml0aWFsaXplZCB3aXRoIG51bGxgKTtcbiAgbFZpZXdbYWRqdXN0ZWRJbmRleF0gPSBuYXRpdmU7XG5cbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGlzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgbGV0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBjb25zdCBwYXJlbnQgPVxuICAgICAgICBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuXG4gICAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gICAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIHBhcmVudCAhPT0gbFZpZXdbSE9TVF9OT0RFXTtcbiAgICBjb25zdCB0UGFyZW50Tm9kZSA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuXG4gICAgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID0gY3JlYXRlVE5vZGUodFBhcmVudE5vZGUsIHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzKTtcbiAgfVxuXG4gIC8vIE5vdyBsaW5rIG91cnNlbHZlcyBpbnRvIHRoZSB0cmVlLlxuICAvLyBXZSBuZWVkIHRoaXMgZXZlbiBpZiB0Tm9kZSBleGlzdHMsIG90aGVyd2lzZSB3ZSBtaWdodCBlbmQgdXAgcG9pbnRpbmcgdG8gdW5leGlzdGluZyB0Tm9kZXMgd2hlblxuICAvLyB3ZSB1c2UgaTE4biAoZXNwZWNpYWxseSB3aXRoIElDVSBleHByZXNzaW9ucyB0aGF0IHVwZGF0ZSB0aGUgRE9NIGR1cmluZyB0aGUgdXBkYXRlIHBoYXNlKS5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJlxuICAgICAgICAodE5vZGUucGFyZW50ICE9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykpIHtcbiAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICB9IGVsc2UgaWYgKCFpc1BhcmVudCkge1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICB9XG4gIH1cblxuICBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG5cbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlKTtcbiAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUVmlld05vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmXG4gICAgICBUUHJvamVjdGlvbk5vZGUgJiBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiBUVmlld05vZGUge1xuICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gIGxldCB0Tm9kZSA9IHRWaWV3Lm5vZGU7XG4gIGlmICh0Tm9kZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIHRQYXJlbnROb2RlICYmXG4gICAgICAgIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModFBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICB0Vmlldy5ub2RlID0gdE5vZGUgPSBjcmVhdGVUTm9kZShcbiAgICAgICAgdFBhcmVudE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCAgLy9cbiAgICAgICAgVE5vZGVUeXBlLlZpZXcsIGluZGV4LCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gIH1cblxuICByZXR1cm4gbFZpZXdbSE9TVF9OT0RFXSA9IHROb2RlIGFzIFRWaWV3Tm9kZTtcbn1cblxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpIG9yIENvbXBvbmVudEZhY3RvcnkuY3JlYXRlKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8odmlldzogTFZpZXcpIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXgrKztcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgdmlldy5wdXNoKG51bGwpO1xuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqXG4gKiBAcGFyYW0gaG9zdE5vZGUgRXhpc3Rpbmcgbm9kZSB0byByZW5kZXIgaW50by5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uIHdpdGggdGhlIGluc3RydWN0aW9ucy5cbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBjb250ZXh0IHRvIHBhc3MgaW50byB0aGUgdGVtcGxhdGUuXG4gKiBAcGFyYW0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkgcmVuZGVyZXIgZmFjdG9yeSB0byB1c2VcbiAqIEBwYXJhbSBob3N0IFRoZSBob3N0IGVsZW1lbnQgbm9kZSB0byB1c2VcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIG1hdGNoaW5nXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJUZW1wbGF0ZTxUPihcbiAgICBob3N0Tm9kZTogUkVsZW1lbnQsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLCBjb250ZXh0OiBULFxuICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBob3N0VmlldzogTFZpZXcgfCBudWxsLFxuICAgIGRpcmVjdGl2ZXM/OiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM/OiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCk6IExWaWV3IHtcbiAgaWYgKGhvc3RWaWV3ID09IG51bGwpIHtcbiAgICByZXNldENvbXBvbmVudFN0YXRlKCk7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcblxuICAgIC8vIFdlIG5lZWQgdG8gY3JlYXRlIGEgcm9vdCB2aWV3IHNvIGl0J3MgcG9zc2libGUgdG8gbG9vayB1cCB0aGUgaG9zdCBlbGVtZW50IHRocm91Z2ggaXRzIGluZGV4XG4gICAgY29uc3QgaG9zdExWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIG51bGwsIGNyZWF0ZVRWaWV3KC0xLCBudWxsLCAxLCAwLCBudWxsLCBudWxsLCBudWxsKSwge30sXG4gICAgICAgIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLklzUm9vdCwgcHJvdmlkZWRSZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyKTtcbiAgICBlbnRlclZpZXcoaG9zdExWaWV3LCBudWxsKTsgIC8vIFNVU1BFQ1QhIHdoeSBkbyB3ZSBuZWVkIHRvIGVudGVyIHRoZSBWaWV3P1xuXG4gICAgY29uc3QgY29tcG9uZW50VFZpZXcgPVxuICAgICAgICBnZXRPckNyZWF0ZVRWaWV3KHRlbXBsYXRlRm4sIGNvbnN0cywgdmFycywgZGlyZWN0aXZlcyB8fCBudWxsLCBwaXBlcyB8fCBudWxsLCBudWxsKTtcbiAgICBob3N0VmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBob3N0TFZpZXcsIGNvbXBvbmVudFRWaWV3LCBjb250ZXh0LCBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSxcbiAgICAgICAgcmVuZGVyZXIsIHNhbml0aXplcik7XG4gICAgaG9zdFZpZXdbSE9TVF9OT0RFXSA9IGNyZWF0ZU5vZGVBdEluZGV4KDAsIFROb2RlVHlwZS5FbGVtZW50LCBob3N0Tm9kZSwgbnVsbCwgbnVsbCk7XG4gIH1cbiAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShob3N0VmlldywgY29udGV4dCwgdGVtcGxhdGVGbik7XG4gIHJldHVybiBob3N0Vmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3LCBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBfaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIHNldElzUGFyZW50KHRydWUpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhKTtcblxuICBjb25zdCBsVmlldyA9IGNyZWF0ZUxWaWV3KGRlY2xhcmF0aW9uVmlldywgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgYXNzaWduVFZpZXdOb2RlVG9MVmlldyh0VmlldywgbnVsbCwgLTEsIGxWaWV3KTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5ub2RlICEuaW5qZWN0b3JJbmRleCA9IGluamVjdG9ySW5kZXg7XG4gIH1cblxuICBzZXRJc1BhcmVudChfaXNQYXJlbnQpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciByZW5kZXJpbmcgZW1iZWRkZWQgdmlld3MgKGUuZy4gZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cylcbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG11c3Qgc3RvcmUvcmV0cmlldmUgdGhlaXIgVFZpZXdzIGRpZmZlcmVudGx5IGZyb20gY29tcG9uZW50IHZpZXdzXG4gKiBiZWNhdXNlIHRoZWlyIHRlbXBsYXRlIGZ1bmN0aW9ucyBhcmUgbmVzdGVkIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgb2YgdGhlaXIgaG9zdHMsIGNyZWF0aW5nXG4gKiBjbG9zdXJlcy4gSWYgdGhlaXIgaG9zdCB0ZW1wbGF0ZSBoYXBwZW5zIHRvIGJlIGFuIGVtYmVkZGVkIHRlbXBsYXRlIGluIGEgbG9vcCAoZS5nLiBuZ0ZvciBpbnNpZGVcbiAqIGFuIG5nRm9yKSwgdGhlIG5lc3Rpbmcgd291bGQgbWVhbiB3ZSdkIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgc28gd2VcbiAqIGNhbid0IHN0b3JlIFRWaWV3cyBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gaXRzZWxmIChhcyB3ZSBkbyBmb3IgY29tcHMpLiBJbnN0ZWFkLCB3ZSBzdG9yZSB0aGVcbiAqIFRWaWV3IGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG9uIHRoZWlyIGhvc3QgVE5vZGUsIHdoaWNoIG9ubHkgaGFzIG9uZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckVtYmVkZGVkVGVtcGxhdGU8VD4odmlld1RvUmVuZGVyOiBMVmlldywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3O1xuICBpZiAodmlld1RvUmVuZGVyW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSB7XG4gICAgLy8gVGhpcyBpcyBhIHJvb3QgdmlldyBpbnNpZGUgdGhlIHZpZXcgdHJlZVxuICAgIHRpY2tSb290Q29udGV4dChnZXRSb290Q29udGV4dCh2aWV3VG9SZW5kZXIpKTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhKTtcblxuICAgICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltIT1NUX05PREVdKTtcbiAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgIHRWaWV3LnRlbXBsYXRlICEoZ2V0UmVuZGVyRmxhZ3Modmlld1RvUmVuZGVyKSwgY29udGV4dCk7XG4gICAgICAvLyBUaGlzIG11c3QgYmUgc2V0IHRvIGZhbHNlIGltbWVkaWF0ZWx5IGFmdGVyIHRoZSBmaXJzdCBjcmVhdGlvbiBydW4gYmVjYXVzZSBpbiBhblxuICAgICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgICAvLyBvZmYgZmlyc3RUZW1wbGF0ZVBhc3MuIElmIHdlIGRvbid0IHNldCBpdCBoZXJlLCBpbnN0YW5jZXMgd2lsbCBwZXJmb3JtIGRpcmVjdGl2ZVxuICAgICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgICB2aWV3VG9SZW5kZXJbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3Modmlld1RvUmVuZGVyKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVWaWV3KG9sZFZpZXcgISk7XG4gICAgICBzZXRJc1BhcmVudChfaXNQYXJlbnQpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKF9wcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGNvbnRleHQgYXQgdGhlIGxldmVsIHNwZWNpZmllZCBhbmQgc2F2ZXMgaXQgYXMgdGhlIGdsb2JhbCwgY29udGV4dFZpZXdEYXRhLlxuICogV2lsbCBnZXQgdGhlIG5leHQgbGV2ZWwgdXAgaWYgbGV2ZWwgaXMgbm90IHNwZWNpZmllZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgdG8gc2F2ZSBjb250ZXh0cyBvZiBwYXJlbnQgdmlld3Mgc28gdGhleSBjYW4gYmUgYm91bmQgaW4gZW1iZWRkZWQgdmlld3MsIG9yXG4gKiBpbiBjb25qdW5jdGlvbiB3aXRoIHJlZmVyZW5jZSgpIHRvIGJpbmQgYSByZWYgZnJvbSBhIHBhcmVudCB2aWV3LlxuICpcbiAqIEBwYXJhbSBsZXZlbCBUaGUgcmVsYXRpdmUgbGV2ZWwgb2YgdGhlIHZpZXcgZnJvbSB3aGljaCB0byBncmFiIGNvbnRleHQgY29tcGFyZWQgdG8gY29udGV4dFZld0RhdGFcbiAqIEByZXR1cm5zIGNvbnRleHRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5leHRDb250ZXh0PFQgPSBhbnk+KGxldmVsOiBudW1iZXIgPSAxKTogVCB7XG4gIHJldHVybiBuZXh0Q29udGV4dEltcGwobGV2ZWwpO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlldywgY29udGV4dDogVCwgdGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGhvc3RWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tIT1NUX05PREVdKTtcbiAgY29uc3Qgbm9ybWFsRXhlY3V0aW9uUGF0aCA9ICFnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlSXNBY3RpdmUgPSBpc0NyZWF0aW9uTW9kZShob3N0Vmlldyk7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuXG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICAgIGlmICh0ZW1wbGF0ZUZuKSB7XG4gICAgICAgIG5hbWVzcGFjZUhUTUwoKTtcbiAgICAgICAgdGVtcGxhdGVGbihSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQgISk7XG4gICAgICB9XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICAgICAgaG9zdFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gICAgdGVtcGxhdGVGbiAmJiB0ZW1wbGF0ZUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCAhKTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcob2xkVmlldyk7XG4gIH1cbn1cblxuLyoqXG4gKiBUaGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGRlZmF1bHQgY29uZmlndXJhdGlvbiBvZiByZW5kZXJpbmcgZmxhZ3MgZGVwZW5kaW5nIG9uIHdoZW4gdGhlXG4gKiB0ZW1wbGF0ZSBpcyBpbiBjcmVhdGlvbiBtb2RlIG9yIHVwZGF0ZSBtb2RlLiBVcGRhdGUgYmxvY2sgYW5kIGNyZWF0ZSBibG9jayBhcmVcbiAqIGFsd2F5cyBydW4gc2VwYXJhdGVseS5cbiAqL1xuZnVuY3Rpb24gZ2V0UmVuZGVyRmxhZ3ModmlldzogTFZpZXcpOiBSZW5kZXJGbGFncyB7XG4gIHJldHVybiBpc0NyZWF0aW9uTW9kZSh2aWV3KSA/IFJlbmRlckZsYWdzLkNyZWF0ZSA6IFJlbmRlckZsYWdzLlVwZGF0ZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gTmFtZXNwYWNlXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5sZXQgX2N1cnJlbnROYW1lc3BhY2U6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuZXhwb3J0IGZ1bmN0aW9uIG5hbWVzcGFjZVNWRygpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlTWF0aE1MKCkge1xuICBfY3VycmVudE5hbWVzcGFjZSA9ICdodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGhNTC8nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbmFtZXNwYWNlSFRNTCgpIHtcbiAgX2N1cnJlbnROYW1lc3BhY2UgPSBudWxsO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYW4gZW1wdHkgZWxlbWVudCB1c2luZyB7QGxpbmsgZWxlbWVudFN0YXJ0fSBhbmQge0BsaW5rIGVsZW1lbnRFbmR9XG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnQoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIGVsZW1lbnRTdGFydChpbmRleCwgbmFtZSwgYXR0cnMsIGxvY2FsUmVmcyk7XG4gIGVsZW1lbnRFbmQoKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbG9naWNhbCBjb250YWluZXIgZm9yIG90aGVyIG5vZGVzICg8bmctY29udGFpbmVyPikgYmFja2VkIGJ5IGEgY29tbWVudCBub2RlIGluIHRoZSBET00uXG4gKiBUaGUgaW5zdHJ1Y3Rpb24gbXVzdCBsYXRlciBiZSBmb2xsb3dlZCBieSBgZWxlbWVudENvbnRhaW5lckVuZCgpYCBjYWxsLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCBpbiB0aGUgTFZpZXcgYXJyYXlcbiAqIEBwYXJhbSBhdHRycyBTZXQgb2YgYXR0cmlidXRlcyB0byBiZSB1c2VkIHdoZW4gbWF0Y2hpbmcgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBsb2NhbFJlZnMgQSBzZXQgb2YgbG9jYWwgcmVmZXJlbmNlIGJpbmRpbmdzIG9uIHRoZSBlbGVtZW50LlxuICpcbiAqIEV2ZW4gaWYgdGhpcyBpbnN0cnVjdGlvbiBhY2NlcHRzIGEgc2V0IG9mIGF0dHJpYnV0ZXMgbm8gYWN0dWFsIGF0dHJpYnV0ZSB2YWx1ZXMgYXJlIHByb3BhZ2F0ZWQgdG9cbiAqIHRoZSBET00gKGFzIGEgY29tbWVudCBub2RlIGNhbid0IGhhdmUgYXR0cmlidXRlcykuIEF0dHJpYnV0ZXMgYXJlIGhlcmUgb25seSBmb3IgZGlyZWN0aXZlXG4gKiBtYXRjaGluZyBwdXJwb3NlcyBhbmQgc2V0dGluZyBpbml0aWFsIGlucHV0cyBvZiBkaXJlY3RpdmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENvbnRhaW5lclN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIGF0dHJzPzogVEF0dHJpYnV0ZXMgfCBudWxsLCBsb2NhbFJlZnM/OiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGNvbnN0IHRhZ05hbWUgPSAnbmctY29udGFpbmVyJztcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZWxlbWVudCBjb250YWluZXJzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcblxuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCBuYXRpdmUgPSByZW5kZXJlci5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/IHRhZ05hbWUgOiAnJyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCAtIDEpO1xuICBjb25zdCB0Tm9kZSA9XG4gICAgICBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hdGl2ZSwgdGFnTmFtZSwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgYXBwZW5kQ2hpbGQobmF0aXZlLCB0Tm9kZSwgbFZpZXcpO1xuICBjcmVhdGVEaXJlY3RpdmVzQW5kTG9jYWxzKHRWaWV3LCBsVmlldywgbG9jYWxSZWZzKTtcbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuXG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUodE5vZGUpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIDxuZy1jb250YWluZXI+LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDb250YWluZXJFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEhhc1BhcmVudChnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSk7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlID0gcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhO1xuICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBjb25zdCBjdXJyZW50UXVlcmllcyA9IGxWaWV3W1FVRVJJRVNdO1xuICBpZiAoY3VycmVudFF1ZXJpZXMpIHtcbiAgICBsVmlld1tRVUVSSUVTXSA9XG4gICAgICAgIGlzQ29udGVudFF1ZXJ5SG9zdChwcmV2aW91c09yUGFyZW50VE5vZGUpID8gY3VycmVudFF1ZXJpZXMucGFyZW50IDogY3VycmVudFF1ZXJpZXM7XG4gIH1cblxuICByZWdpc3RlclBvc3RPcmRlckhvb2tzKHRWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZSBET00gZWxlbWVudC4gVGhlIGluc3RydWN0aW9uIG11c3QgbGF0ZXIgYmUgZm9sbG93ZWQgYnkgYGVsZW1lbnRFbmQoKWAgY2FsbC5cbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQgaW4gdGhlIExWaWV3IGFycmF5XG4gKiBAcGFyYW0gbmFtZSBOYW1lIG9mIHRoZSBET00gTm9kZVxuICogQHBhcmFtIGF0dHJzIFN0YXRpY2FsbHkgYm91bmQgc2V0IG9mIGF0dHJpYnV0ZXMsIGNsYXNzZXMsIGFuZCBzdHlsZXMgdG8gYmUgd3JpdHRlbiBpbnRvIHRoZSBET01cbiAqICAgICAgICAgICAgICBlbGVtZW50IG9uIGNyZWF0aW9uLiBVc2UgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gZGVub3RlIHRoZSBtZWFuaW5nIG9mIHRoaXMgYXJyYXkuXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqXG4gKiBBdHRyaWJ1dGVzIGFuZCBsb2NhbFJlZnMgYXJlIHBhc3NlZCBhcyBhbiBhcnJheSBvZiBzdHJpbmdzIHdoZXJlIGVsZW1lbnRzIHdpdGggYW4gZXZlbiBpbmRleFxuICogaG9sZCBhbiBhdHRyaWJ1dGUgbmFtZSBhbmQgZWxlbWVudHMgd2l0aCBhbiBvZGQgaW5kZXggaG9sZCBhbiBhdHRyaWJ1dGUgdmFsdWUsIGV4LjpcbiAqIFsnaWQnLCAnd2FybmluZzUnLCAnY2xhc3MnLCAnYWxlcnQnXVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0YXJ0KFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgYXR0cnM/OiBUQXR0cmlidXRlcyB8IG51bGwsIGxvY2FsUmVmcz86IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIHRWaWV3LmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdlbGVtZW50cyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzICcpO1xuXG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJDcmVhdGVFbGVtZW50Kys7XG5cbiAgY29uc3QgbmF0aXZlID0gZWxlbWVudENyZWF0ZShuYW1lKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4IC0gMSk7XG5cbiAgY29uc3QgdE5vZGUgPSBjcmVhdGVOb2RlQXRJbmRleChpbmRleCwgVE5vZGVUeXBlLkVsZW1lbnQsIG5hdGl2ZSAhLCBuYW1lLCBhdHRycyB8fCBudWxsKTtcblxuICBpZiAoYXR0cnMpIHtcbiAgICAvLyBpdCdzIGltcG9ydGFudCB0byBvbmx5IHByZXBhcmUgc3R5bGluZy1yZWxhdGVkIGRhdGFzdHJ1Y3R1cmVzIG9uY2UgZm9yIGEgZ2l2ZW5cbiAgICAvLyB0Tm9kZSBhbmQgbm90IGVhY2ggdGltZSBhbiBlbGVtZW50IGlzIGNyZWF0ZWQuIEFsc28sIHRoZSBzdHlsaW5nIGNvZGUgaXMgZGVzaWduZWRcbiAgICAvLyB0byBiZSBwYXRjaGVkIGFuZCBjb25zdHJ1Y3RlZCBhdCB2YXJpb3VzIHBvaW50cywgYnV0IG9ubHkgdXAgdW50aWwgdGhlIGZpcnN0IGVsZW1lbnRcbiAgICAvLyBpcyBjcmVhdGVkLiBUaGVuIHRoZSBzdHlsaW5nIGNvbnRleHQgaXMgbG9ja2VkIGFuZCBjYW4gb25seSBiZSBpbnN0YW50aWF0ZWQgZm9yIGVhY2hcbiAgICAvLyBzdWNjZXNzaXZlIGVsZW1lbnQgdGhhdCBpcyBjcmVhdGVkLlxuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiAhdE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmIGhhc1N0eWxpbmcoYXR0cnMpKSB7XG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMpO1xuICAgIH1cbiAgICBzZXRVcEF0dHJpYnV0ZXMobmF0aXZlLCBhdHRycyk7XG4gIH1cblxuICBhcHBlbmRDaGlsZChuYXRpdmUsIHROb2RlLCBsVmlldyk7XG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMpO1xuXG4gIC8vIGFueSBpbW1lZGlhdGUgY2hpbGRyZW4gb2YgYSBjb21wb25lbnQgb3IgdGVtcGxhdGUgY29udGFpbmVyIG11c3QgYmUgcHJlLWVtcHRpdmVseVxuICAvLyBtb25rZXktcGF0Y2hlZCB3aXRoIHRoZSBjb21wb25lbnQgdmlldyBkYXRhIHNvIHRoYXQgdGhlIGVsZW1lbnQgY2FuIGJlIGluc3BlY3RlZFxuICAvLyBsYXRlciBvbiB1c2luZyBhbnkgZWxlbWVudCBkaXNjb3ZlcnkgdXRpbGl0eSBtZXRob2RzIChzZWUgYGVsZW1lbnRfZGlzY292ZXJ5LnRzYClcbiAgaWYgKGdldEVsZW1lbnREZXB0aENvdW50KCkgPT09IDApIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgaW5jcmVhc2VFbGVtZW50RGVwdGhDb3VudCgpO1xuXG4gIC8vIGlmIGEgZGlyZWN0aXZlIGNvbnRhaW5zIGEgaG9zdCBiaW5kaW5nIGZvciBcImNsYXNzXCIgdGhlbiBhbGwgY2xhc3MtYmFzZWQgZGF0YSB3aWxsXG4gIC8vIGZsb3cgdGhyb3VnaCB0aGF0IChleGNlcHQgZm9yIGBbY2xhc3MucHJvcF1gIGJpbmRpbmdzKS4gVGhpcyBhbHNvIGluY2x1ZGVzIGluaXRpYWxcbiAgLy8gc3RhdGljIGNsYXNzIHZhbHVlcyBhcyB3ZWxsLiAoTm90ZSB0aGF0IHRoaXMgd2lsbCBiZSBmaXhlZCBvbmNlIG1hcC1iYXNlZCBgW3N0eWxlXWBcbiAgLy8gYW5kIGBbY2xhc3NdYCBiaW5kaW5ncyB3b3JrIGZvciBtdWx0aXBsZSBkaXJlY3RpdmVzLilcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgY29uc3QgaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKTtcbiAgICBpZiAoaW5wdXREYXRhICYmIGlucHV0RGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgfVxuXG4gIC8vIFRoZXJlIGlzIG5vIHBvaW50IGluIHJlbmRlcmluZyBzdHlsZXMgd2hlbiBhIGNsYXNzIGRpcmVjdGl2ZSBpcyBwcmVzZW50IHNpbmNlXG4gIC8vIGl0IHdpbGwgdGFrZSB0aGF0IG92ZXIgZm9yIHVzICh0aGlzIHdpbGwgYmUgcmVtb3ZlZCBvbmNlICNGVy04ODIgaXMgaW4pLlxuICBpZiAodE5vZGUuc3R5bGluZ1RlbXBsYXRlICYmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dCkgPT09IDApIHtcbiAgICByZW5kZXJJbml0aWFsU3R5bGVzQW5kQ2xhc3NlcyhuYXRpdmUsIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgbFZpZXdbUkVOREVSRVJdKTtcbiAgfVxuXG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGN1cnJlbnRRdWVyaWVzLmFkZE5vZGUodE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIG92ZXJyaWRkZW5SZW5kZXJlciBPcHRpb25hbCBBIHJlbmRlcmVyIHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IG9uZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIG92ZXJyaWRkZW5SZW5kZXJlcj86IFJlbmRlcmVyMyk6IFJFbGVtZW50IHtcbiAgbGV0IG5hdGl2ZTogUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyVG9Vc2UgPSBvdmVycmlkZGVuUmVuZGVyZXIgfHwgZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyVG9Vc2UpKSB7XG4gICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50KG5hbWUsIF9jdXJyZW50TmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAoX2N1cnJlbnROYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMoX2N1cnJlbnROYW1lc3BhY2UsIG5hbWUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbmF0aXZlO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcyBhbmQgcG9wdWxhdGVzIGxvY2FsIHJlZnMuXG4gKlxuICogQHBhcmFtIGxvY2FsUmVmcyBMb2NhbCByZWZzIG9mIHRoZSBub2RlIGluIHF1ZXN0aW9uXG4gKiBAcGFyYW0gbG9jYWxSZWZFeHRyYWN0b3IgbWFwcGluZyBmdW5jdGlvbiB0aGF0IGV4dHJhY3RzIGxvY2FsIHJlZiB2YWx1ZSBmcm9tIFROb2RlXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuXG4gICAgcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgICAgIHRWaWV3LCBsVmlldywgZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXcsIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUpLFxuICAgICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUsIGxvY2FsUmVmcyB8fCBudWxsKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBEdXJpbmcgZmlyc3QgdGVtcGxhdGUgcGFzcywgcXVlcmllcyBhcmUgY3JlYXRlZCBvciBjbG9uZWQgd2hlbiBmaXJzdCByZXF1ZXN0ZWRcbiAgICAvLyB1c2luZyBgZ2V0T3JDcmVhdGVDdXJyZW50UXVlcmllc2AuIEZvciBzdWJzZXF1ZW50IHRlbXBsYXRlIHBhc3Nlcywgd2UgY2xvbmVcbiAgICAvLyBhbnkgY3VycmVudCBMUXVlcmllcyBoZXJlIHVwLWZyb250IGlmIHRoZSBjdXJyZW50IG5vZGUgaG9zdHMgYSBjb250ZW50IHF1ZXJ5LlxuICAgIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkpICYmIGxWaWV3W1FVRVJJRVNdKSB7XG4gICAgICBsVmlld1tRVUVSSUVTXSA9IGxWaWV3W1FVRVJJRVNdICEuY2xvbmUoKTtcbiAgICB9XG4gIH1cbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+LCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogQ29tcG9uZW50UXVlcnk8YW55PnwgbnVsbCk6IFRWaWV3IHtcbiAgLy8gVE9ETyhtaXNrbyk6IHJlYWRpbmcgYG5nUHJpdmF0ZURhdGFgIGhlcmUgaXMgcHJvYmxlbWF0aWMgZm9yIHR3byByZWFzb25zXG4gIC8vIDEuIEl0IGlzIGEgbWVnYW1vcnBoaWMgY2FsbCBvbiBlYWNoIGludm9jYXRpb24uXG4gIC8vIDIuIEZvciBuZXN0ZWQgZW1iZWRkZWQgdmlld3MgKG5nRm9yIGluc2lkZSBuZ0ZvcikgdGhlIHRlbXBsYXRlIGluc3RhbmNlIGlzIHBlclxuICAvLyAgICBvdXRlciB0ZW1wbGF0ZSBpbnZvY2F0aW9uLCB3aGljaCBtZWFucyB0aGF0IG5vIHN1Y2ggcHJvcGVydHkgd2lsbCBleGlzdFxuICAvLyBDb3JyZWN0IHNvbHV0aW9uIGlzIHRvIG9ubHkgcHV0IGBuZ1ByaXZhdGVEYXRhYCBvbiB0aGUgQ29tcG9uZW50IHRlbXBsYXRlXG4gIC8vIGFuZCBub3Qgb24gZW1iZWRkZWQgdGVtcGxhdGVzLlxuXG4gIHJldHVybiB0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgfHxcbiAgICAgICh0ZW1wbGF0ZUZuLm5nUHJpdmF0ZURhdGEgPVxuICAgICAgICAgICBjcmVhdGVUVmlldygtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5KSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBDb21wb25lbnRRdWVyeTxhbnk+fCBudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGNvbnN0cztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSB7XG4gICAgaWQ6IHZpZXdJbmRleCxcbiAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICBub2RlOiBudWxsICEsXG4gICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgY2hpbGRJbmRleDogLTEsICAvLyBDaGlsZHJlbiBzZXQgaW4gYWRkVG9WaWV3VHJlZSgpLCBpZiBhbnlcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgdmlld1F1ZXJ5U3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IHRydWUsXG4gICAgaW5pdEhvb2tzOiBudWxsLFxuICAgIGNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZXcgQXJyYXkoaW5pdGlhbFZpZXdMZW5ndGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChudWxsLCAwLCBiaW5kaW5nU3RhcnRJbmRleClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKE5PX0NIQU5HRSwgYmluZGluZ1N0YXJ0SW5kZXgpIGFzIExWaWV3O1xuICBibHVlcHJpbnRbQ09OVEFJTkVSX0lOREVYXSA9IC0xO1xuICBibHVlcHJpbnRbQklORElOR19JTkRFWF0gPSBiaW5kaW5nU3RhcnRJbmRleDtcbiAgcmV0dXJuIGJsdWVwcmludDtcbn1cblxuLyoqXG4gKiBBc3NpZ25zIGFsbCBhdHRyaWJ1dGUgdmFsdWVzIHRvIHRoZSBwcm92aWRlZCBlbGVtZW50IHZpYSB0aGUgaW5mZXJyZWQgcmVuZGVyZXIuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBhY2NlcHRzIHR3byBmb3JtcyBvZiBhdHRyaWJ1dGUgZW50cmllczpcbiAqXG4gKiBkZWZhdWx0OiAoa2V5LCB2YWx1ZSk6XG4gKiAgYXR0cnMgPSBba2V5MSwgdmFsdWUxLCBrZXkyLCB2YWx1ZTJdXG4gKlxuICogbmFtZXNwYWNlZDogKE5BTUVTUEFDRV9NQVJLRVIsIHVyaSwgbmFtZSwgdmFsdWUpXG4gKiAgYXR0cnMgPSBbTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZSwgTkFNRVNQQUNFX01BUktFUiwgdXJpLCBuYW1lLCB2YWx1ZV1cbiAqXG4gKiBUaGUgYGF0dHJzYCBhcnJheSBjYW4gY29udGFpbiBhIG1peCBvZiBib3RoIHRoZSBkZWZhdWx0IGFuZCBuYW1lc3BhY2VkIGVudHJpZXMuXG4gKiBUaGUgXCJkZWZhdWx0XCIgdmFsdWVzIGFyZSBzZXQgd2l0aG91dCBhIG1hcmtlciwgYnV0IGlmIHRoZSBmdW5jdGlvbiBjb21lcyBhY3Jvc3NcbiAqIGEgbWFya2VyIHZhbHVlIHRoZW4gaXQgd2lsbCBhdHRlbXB0IHRvIHNldCBhIG5hbWVzcGFjZWQgdmFsdWUuIElmIHRoZSBtYXJrZXIgaXNcbiAqIG5vdCBvZiBhIG5hbWVzcGFjZWQgdmFsdWUgdGhlbiB0aGUgZnVuY3Rpb24gd2lsbCBxdWl0IGFuZCByZXR1cm4gdGhlIGluZGV4IHZhbHVlXG4gKiB3aGVyZSBpdCBzdG9wcGVkIGR1cmluZyB0aGUgaXRlcmF0aW9uIG9mIHRoZSBhdHRycyBhcnJheS5cbiAqXG4gKiBTZWUgW0F0dHJpYnV0ZU1hcmtlcl0gdG8gdW5kZXJzdGFuZCB3aGF0IHRoZSBuYW1lc3BhY2UgbWFya2VyIHZhbHVlIGlzLlxuICpcbiAqIE5vdGUgdGhhdCB0aGlzIGluc3RydWN0aW9uIGRvZXMgbm90IHN1cHBvcnQgYXNzaWduaW5nIHN0eWxlIGFuZCBjbGFzcyB2YWx1ZXMgdG9cbiAqIGFuIGVsZW1lbnQuIFNlZSBgZWxlbWVudFN0YXJ0YCBhbmQgYGVsZW1lbnRIb3N0QXR0cnNgIHRvIGxlYXJuIGhvdyBzdHlsaW5nIHZhbHVlc1xuICogYXJlIGFwcGxpZWQgdG8gYW4gZWxlbWVudC5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBlbGVtZW50IHRoYXQgdGhlIGF0dHJpYnV0ZXMgd2lsbCBiZSBhc3NpZ25lZCB0b1xuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGUgYXJyYXkgb2YgdmFsdWVzIHRoYXQgd2lsbCBiZSBhc3NpZ25lZCB0byB0aGUgZWxlbWVudFxuICogQHJldHVybnMgdGhlIGluZGV4IHZhbHVlIHRoYXQgd2FzIGxhc3QgYWNjZXNzZWQgaW4gdGhlIGF0dHJpYnV0ZXMgYXJyYXlcbiAqL1xuZnVuY3Rpb24gc2V0VXBBdHRyaWJ1dGVzKG5hdGl2ZTogUkVsZW1lbnQsIGF0dHJzOiBUQXR0cmlidXRlcyk6IG51bWJlciB7XG4gIGNvbnN0IHJlbmRlcmVyID0gZ2V0TFZpZXcoKVtSRU5ERVJFUl07XG4gIGNvbnN0IGlzUHJvYyA9IGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKTtcblxuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gb25seSBuYW1lc3BhY2VzIGFyZSBzdXBwb3J0ZWQuIE90aGVyIHZhbHVlIHR5cGVzIChzdWNoIGFzIHN0eWxlL2NsYXNzXG4gICAgICAvLyBlbnRyaWVzKSBhcmUgbm90IHN1cHBvcnRlZCBpbiB0aGlzIGZ1bmN0aW9uLlxuICAgICAgaWYgKHZhbHVlICE9PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyB3ZSBqdXN0IGxhbmRlZCBvbiB0aGUgbWFya2VyIHZhbHVlIC4uLiB0aGVyZWZvcmVcbiAgICAgIC8vIHdlIHNob3VsZCBza2lwIHRvIHRoZSBuZXh0IGVudHJ5XG4gICAgICBpKys7XG5cbiAgICAgIGNvbnN0IG5hbWVzcGFjZVVSSSA9IGF0dHJzW2krK10gYXMgc3RyaW5nO1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1tpKytdIGFzIHN0cmluZztcbiAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgKHJlbmRlcmVyIGFzIFByb2NlZHVyYWxSZW5kZXJlcjMpLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lLCBhdHRyVmFsLCBuYW1lc3BhY2VVUkkpIDpcbiAgICAgICAgICBuYXRpdmUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlVVJJLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vLyBhdHRyTmFtZSBpcyBzdHJpbmc7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IHZhbHVlIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IGF0dHJWYWwgPSBhdHRyc1srK2ldO1xuICAgICAgaWYgKGF0dHJOYW1lICE9PSBOR19QUk9KRUNUX0FTX0FUVFJfTkFNRSkge1xuICAgICAgICAvLyBTdGFuZGFyZCBhdHRyaWJ1dGVzXG4gICAgICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICAgICAgaWYgKGlzQW5pbWF0aW9uUHJvcChhdHRyTmFtZSkpIHtcbiAgICAgICAgICBpZiAoaXNQcm9jKSB7XG4gICAgICAgICAgICAocmVuZGVyZXIgYXMgUHJvY2VkdXJhbFJlbmRlcmVyMykuc2V0UHJvcGVydHkobmF0aXZlLCBhdHRyTmFtZSwgYXR0clZhbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGlzUHJvYyA/XG4gICAgICAgICAgICAgIChyZW5kZXJlciBhcyBQcm9jZWR1cmFsUmVuZGVyZXIzKVxuICAgICAgICAgICAgICAgICAgLnNldEF0dHJpYnV0ZShuYXRpdmUsIGF0dHJOYW1lIGFzIHN0cmluZywgYXR0clZhbCBhcyBzdHJpbmcpIDpcbiAgICAgICAgICAgICAgbmF0aXZlLnNldEF0dHJpYnV0ZShhdHRyTmFtZSBhcyBzdHJpbmcsIGF0dHJWYWwgYXMgc3RyaW5nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIC8vIGFub3RoZXIgcGllY2Ugb2YgY29kZSBtYXkgaXRlcmF0ZSBvdmVyIHRoZSBzYW1lIGF0dHJpYnV0ZXMgYXJyYXkuIFRoZXJlZm9yZVxuICAvLyBpdCBtYXkgYmUgaGVscGZ1bCB0byByZXR1cm4gdGhlIGV4YWN0IHNwb3Qgd2hlcmUgdGhlIGF0dHJpYnV0ZXMgYXJyYXkgZXhpdGVkXG4gIC8vIHdoZXRoZXIgYnkgcnVubmluZyBpbnRvIGFuIHVuc3VwcG9ydGVkIG1hcmtlciBvciBpZiBhbGwgdGhlIHN0YXRpYyB2YWx1ZXMgd2VyZVxuICAvLyBpdGVyYXRlZCBvdmVyLlxuICByZXR1cm4gaTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtyZW5kZXJTdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIEFkZHMgYW4gZXZlbnQgbGlzdGVuZXIgdG8gdGhlIGN1cnJlbnQgbm9kZS5cbiAqXG4gKiBJZiBhbiBvdXRwdXQgZXhpc3RzIG9uIG9uZSBvZiB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMsIGl0IGFsc28gc3Vic2NyaWJlcyB0byB0aGUgb3V0cHV0XG4gKiBhbmQgc2F2ZXMgdGhlIHN1YnNjcmlwdGlvbiBmb3IgbGF0ZXIgY2xlYW51cC5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxpc3RlbmVyKFxuICAgIGV2ZW50TmFtZTogc3RyaW5nLCBsaXN0ZW5lckZuOiAoZT86IGFueSkgPT4gYW55LCB1c2VDYXB0dXJlID0gZmFsc2UsXG4gICAgZXZlbnRUYXJnZXRSZXNvbHZlcj86IEdsb2JhbFRhcmdldFJlc29sdmVyKTogdm9pZCB7XG4gIGxpc3RlbmVySW50ZXJuYWwoZXZlbnROYW1lLCBsaXN0ZW5lckZuLCB1c2VDYXB0dXJlLCBldmVudFRhcmdldFJlc29sdmVyKTtcbn1cblxuLyoqXG4gKiBSZWdpc3RlcnMgYSBzeW50aGV0aWMgaG9zdCBsaXN0ZW5lciAoZS5nLiBgKEBmb28uc3RhcnQpYCkgb24gYSBjb21wb25lbnQuXG4gKlxuICogVGhpcyBpbnN0cnVjdGlvbiBpcyBmb3IgY29tcGF0aWJpbGl0eSBwdXJwb3NlcyBhbmQgaXMgZGVzaWduZWQgdG8gZW5zdXJlIHRoYXQgYVxuICogc3ludGhldGljIGhvc3QgbGlzdGVuZXIgKGUuZy4gYEBIb3N0TGlzdGVuZXIoJ0Bmb28uc3RhcnQnKWApIHByb3Blcmx5IGdldHMgcmVuZGVyZWRcbiAqIGluIHRoZSBjb21wb25lbnQncyByZW5kZXJlci4gTm9ybWFsbHkgYWxsIGhvc3QgbGlzdGVuZXJzIGFyZSBldmFsdWF0ZWQgd2l0aCB0aGVcbiAqIHBhcmVudCBjb21wb25lbnQncyByZW5kZXJlciwgYnV0LCBpbiB0aGUgY2FzZSBvZiBhbmltYXRpb24gQHRyaWdnZXJzLCB0aGV5IG5lZWRcbiAqIHRvIGJlIGV2YWx1YXRlZCB3aXRoIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgKGJlY2F1c2UgdGhhdCdzIHdoZXJlIHRoZVxuICogYW5pbWF0aW9uIHRyaWdnZXJzIGFyZSBkZWZpbmVkKS5cbiAqXG4gKiBEbyBub3QgdXNlIHRoaXMgaW5zdHJ1Y3Rpb24gYXMgYSByZXBsYWNlbWVudCBmb3IgYGxpc3RlbmVyYC4gVGhpcyBpbnN0cnVjdGlvblxuICogb25seSBleGlzdHMgdG8gZW5zdXJlIGNvbXBhdGliaWxpdHkgd2l0aCB0aGUgVmlld0VuZ2luZSdzIGhvc3QgYmluZGluZyBiZWhhdmlvci5cbiAqXG4gKiBAcGFyYW0gZXZlbnROYW1lIE5hbWUgb2YgdGhlIGV2ZW50XG4gKiBAcGFyYW0gbGlzdGVuZXJGbiBUaGUgZnVuY3Rpb24gdG8gYmUgY2FsbGVkIHdoZW4gZXZlbnQgZW1pdHNcbiAqIEBwYXJhbSB1c2VDYXB0dXJlIFdoZXRoZXIgb3Igbm90IHRvIHVzZSBjYXB0dXJlIGluIGV2ZW50IGxpc3RlbmVyXG4gKiBAcGFyYW0gZXZlbnRUYXJnZXRSZXNvbHZlciBGdW5jdGlvbiB0aGF0IHJldHVybnMgZ2xvYmFsIHRhcmdldCBpbmZvcm1hdGlvbiBpbiBjYXNlIHRoaXMgbGlzdGVuZXJcbiAqIHNob3VsZCBiZSBhdHRhY2hlZCB0byBhIGdsb2JhbCBvYmplY3QgbGlrZSB3aW5kb3csIGRvY3VtZW50IG9yIGJvZHlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudEhvc3RTeW50aGV0aWNMaXN0ZW5lcjxUPihcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcik6IHZvaWQge1xuICBsaXN0ZW5lckludGVybmFsKGV2ZW50TmFtZSwgbGlzdGVuZXJGbiwgdXNlQ2FwdHVyZSwgZXZlbnRUYXJnZXRSZXNvbHZlciwgbG9hZENvbXBvbmVudFJlbmRlcmVyKTtcbn1cblxuZnVuY3Rpb24gbGlzdGVuZXJJbnRlcm5hbChcbiAgICBldmVudE5hbWU6IHN0cmluZywgbGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSwgdXNlQ2FwdHVyZSA9IGZhbHNlLFxuICAgIGV2ZW50VGFyZ2V0UmVzb2x2ZXI/OiBHbG9iYWxUYXJnZXRSZXNvbHZlcixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IHRDbGVhbnVwOiBmYWxzZXxhbnlbXSA9IGZpcnN0VGVtcGxhdGVQYXNzICYmICh0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgLy8gYWRkIG5hdGl2ZSBldmVudCBsaXN0ZW5lciAtIGFwcGxpY2FibGUgdG8gZWxlbWVudHMgb25seVxuICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgY29uc3QgcmVzb2x2ZWQgPSBldmVudFRhcmdldFJlc29sdmVyID8gZXZlbnRUYXJnZXRSZXNvbHZlcihuYXRpdmUpIDoge30gYXMgYW55O1xuICAgIGNvbnN0IHRhcmdldCA9IHJlc29sdmVkLnRhcmdldCB8fCBuYXRpdmU7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlckFkZEV2ZW50TGlzdGVuZXIrKztcbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgIGNvbnN0IGxDbGVhbnVwSW5kZXggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgbGV0IHVzZUNhcHR1cmVPclN1YklkeDogYm9vbGVhbnxudW1iZXIgPSB1c2VDYXB0dXJlO1xuXG4gICAgLy8gSW4gb3JkZXIgdG8gbWF0Y2ggY3VycmVudCBiZWhhdmlvciwgbmF0aXZlIERPTSBldmVudCBsaXN0ZW5lcnMgbXVzdCBiZSBhZGRlZCBmb3IgYWxsXG4gICAgLy8gZXZlbnRzIChpbmNsdWRpbmcgb3V0cHV0cykuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgLy8gVGhlIGZpcnN0IGFyZ3VtZW50IG9mIGBsaXN0ZW5gIGZ1bmN0aW9uIGluIFByb2NlZHVyYWwgUmVuZGVyZXIgaXM6XG4gICAgICAvLyAtIGVpdGhlciBhIHRhcmdldCBuYW1lIChhcyBhIHN0cmluZykgaW4gY2FzZSBvZiBnbG9iYWwgdGFyZ2V0ICh3aW5kb3csIGRvY3VtZW50LCBib2R5KVxuICAgICAgLy8gLSBvciBlbGVtZW50IHJlZmVyZW5jZSAoaW4gYWxsIG90aGVyIGNhc2VzKVxuICAgICAgY29uc3QgY2xlYW51cEZuID0gcmVuZGVyZXIubGlzdGVuKHJlc29sdmVkLm5hbWUgfHwgdGFyZ2V0LCBldmVudE5hbWUsIGxpc3RlbmVyRm4pO1xuICAgICAgbENsZWFudXAucHVzaChsaXN0ZW5lckZuLCBjbGVhbnVwRm4pO1xuICAgICAgdXNlQ2FwdHVyZU9yU3ViSWR4ID0gbENsZWFudXBJbmRleCArIDE7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHdyYXBwZWRMaXN0ZW5lciA9IHdyYXBMaXN0ZW5lcldpdGhQcmV2ZW50RGVmYXVsdChsaXN0ZW5lckZuKTtcbiAgICAgIHRhcmdldC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgd3JhcHBlZExpc3RlbmVyLCB1c2VDYXB0dXJlKTtcbiAgICAgIGxDbGVhbnVwLnB1c2god3JhcHBlZExpc3RlbmVyKTtcbiAgICB9XG5cbiAgICBjb25zdCBpZHhPclRhcmdldEdldHRlciA9IGV2ZW50VGFyZ2V0UmVzb2x2ZXIgP1xuICAgICAgICAoX2xWaWV3OiBMVmlldykgPT4gZXZlbnRUYXJnZXRSZXNvbHZlcihyZWFkRWxlbWVudFZhbHVlKF9sVmlld1t0Tm9kZS5pbmRleF0pKS50YXJnZXQgOlxuICAgICAgICB0Tm9kZS5pbmRleDtcbiAgICB0Q2xlYW51cCAmJiB0Q2xlYW51cC5wdXNoKGV2ZW50TmFtZSwgaWR4T3JUYXJnZXRHZXR0ZXIsIGxDbGVhbnVwSW5kZXgsIHVzZUNhcHR1cmVPclN1YklkeCk7XG4gIH1cblxuICAvLyBzdWJzY3JpYmUgdG8gZGlyZWN0aXZlIG91dHB1dHNcbiAgaWYgKHROb2RlLm91dHB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIGlmIHdlIGNyZWF0ZSBUTm9kZSBoZXJlLCBpbnB1dHMgbXVzdCBiZSB1bmRlZmluZWQgc28gd2Uga25vdyB0aGV5IHN0aWxsIG5lZWQgdG8gYmVcbiAgICAvLyBjaGVja2VkXG4gICAgdE5vZGUub3V0cHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLk91dHB1dCk7XG4gIH1cblxuICBjb25zdCBvdXRwdXRzID0gdE5vZGUub3V0cHV0cztcbiAgbGV0IHByb3BzOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAob3V0cHV0cyAmJiAocHJvcHMgPSBvdXRwdXRzW2V2ZW50TmFtZV0pKSB7XG4gICAgY29uc3QgcHJvcHNMZW5ndGggPSBwcm9wcy5sZW5ndGg7XG4gICAgaWYgKHByb3BzTGVuZ3RoKSB7XG4gICAgICBjb25zdCBsQ2xlYW51cCA9IGdldENsZWFudXAobFZpZXcpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBwcm9wc0xlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgIGNvbnN0IGluZGV4ID0gcHJvcHNbaV0gYXMgbnVtYmVyO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICAgICAgY29uc3QgbWluaWZpZWROYW1lID0gcHJvcHNbaSArIDJdO1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVJbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICAgICAgY29uc3Qgb3V0cHV0ID0gZGlyZWN0aXZlSW5zdGFuY2VbbWluaWZpZWROYW1lXTtcblxuICAgICAgICBpZiAobmdEZXZNb2RlICYmICFpc09ic2VydmFibGUob3V0cHV0KSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgICAgYEBPdXRwdXQgJHttaW5pZmllZE5hbWV9IG5vdCBpbml0aWFsaXplZCBpbiAnJHtkaXJlY3RpdmVJbnN0YW5jZS5jb25zdHJ1Y3Rvci5uYW1lfScuYCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvdXRwdXQuc3Vic2NyaWJlKGxpc3RlbmVyRm4pO1xuICAgICAgICBjb25zdCBpZHggPSBsQ2xlYW51cC5sZW5ndGg7XG4gICAgICAgIGxDbGVhbnVwLnB1c2gobGlzdGVuZXJGbiwgc3Vic2NyaXB0aW9uKTtcbiAgICAgICAgdENsZWFudXAgJiYgdENsZWFudXAucHVzaChldmVudE5hbWUsIHROb2RlLmluZGV4LCBpZHgsIC0oaWR4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKiBNYXJrIHRoZSBlbmQgb2YgdGhlIGVsZW1lbnQuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEVuZCgpOiB2b2lkIHtcbiAgbGV0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoZ2V0SXNQYXJlbnQoKSkge1xuICAgIHNldElzUGFyZW50KGZhbHNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SGFzUGFyZW50KGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGN1cnJlbnRRdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChjdXJyZW50UXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID1cbiAgICAgICAgaXNDb250ZW50UXVlcnlIb3N0KHByZXZpb3VzT3JQYXJlbnRUTm9kZSkgPyBjdXJyZW50UXVlcmllcy5wYXJlbnQgOiBjdXJyZW50UXVlcmllcztcbiAgfVxuXG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3MoZ2V0TFZpZXcoKVtUVklFV10sIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIGRlY3JlYXNlRWxlbWVudERlcHRoQ291bnQoKTtcblxuICAvLyB0aGlzIGlzIGZpcmVkIGF0IHRoZSBlbmQgb2YgZWxlbWVudEVuZCBiZWNhdXNlIEFMTCBvZiB0aGUgc3R5bGluZ0JpbmRpbmdzIGNvZGVcbiAgLy8gKGZvciBkaXJlY3RpdmVzIGFuZCB0aGUgdGVtcGxhdGUpIGhhdmUgbm93IGV4ZWN1dGVkIHdoaWNoIG1lYW5zIHRoZSBzdHlsaW5nXG4gIC8vIGNvbnRleHQgY2FuIGJlIGluc3RhbnRpYXRlZCBwcm9wZXJseS5cbiAgaWYgKGhhc0NsYXNzSW5wdXQocHJldmlvdXNPclBhcmVudFROb2RlKSkge1xuICAgIGNvbnN0IHN0eWxpbmdDb250ZXh0ID0gZ2V0U3R5bGluZ0NvbnRleHQocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgICAgIGxWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGUuaW5wdXRzICFbJ2NsYXNzJ10gISwgZ2V0SW5pdGlhbENsYXNzTmFtZVZhbHVlKHN0eWxpbmdDb250ZXh0KSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIHRoZSB2YWx1ZSBvZiByZW1vdmVzIGFuIGF0dHJpYnV0ZSBvbiBhbiBFbGVtZW50LlxuICpcbiAqIEBwYXJhbSBudW1iZXIgaW5kZXggVGhlIGluZGV4IG9mIHRoZSBlbGVtZW50IGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gbmFtZSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBhdHRyaWJ1dGUuXG4gKiBAcGFyYW0gdmFsdWUgdmFsdWUgVGhlIGF0dHJpYnV0ZSBpcyByZW1vdmVkIHdoZW4gdmFsdWUgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLlxuICogICAgICAgICAgICAgICAgICBPdGhlcndpc2UgdGhlIGF0dHJpYnV0ZSB2YWx1ZSBpcyBzZXQgdG8gdGhlIHN0cmluZ2lmaWVkIHZhbHVlLlxuICogQHBhcmFtIHNhbml0aXplciBBbiBvcHRpb25hbCBmdW5jdGlvbiB1c2VkIHRvIHNhbml0aXplIHRoZSB2YWx1ZS5cbiAqIEBwYXJhbSBuYW1lc3BhY2UgT3B0aW9uYWwgbmFtZXNwYWNlIHRvIHVzZSB3aGVuIHNldHRpbmcgdGhlIGF0dHJpYnV0ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgbmdEZXZNb2RlICYmIHZhbGlkYXRlQXR0cmlidXRlKG5hbWUpO1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBuYW1lc3BhY2UgPyBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZSBhIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQuXG4gKlxuICogSWYgdGhlIHByb3BlcnR5IG5hbWUgYWxzbyBleGlzdHMgYXMgYW4gaW5wdXQgcHJvcGVydHkgb24gb25lIG9mIHRoZSBlbGVtZW50J3MgZGlyZWN0aXZlcyxcbiAqIHRoZSBjb21wb25lbnQgcHJvcGVydHkgd2lsbCBiZSBzZXQgaW5zdGVhZCBvZiB0aGUgZWxlbWVudCBwcm9wZXJ0eS4gVGhpcyBjaGVjayBtdXN0XG4gKiBiZSBjb25kdWN0ZWQgYXQgcnVudGltZSBzbyBjaGlsZCBjb21wb25lbnRzIHRoYXQgYWRkIG5ldyBASW5wdXRzIGRvbid0IGhhdmUgdG8gYmUgcmUtY29tcGlsZWQuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgZWxlbWVudCB0byB1cGRhdGUgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHByb3BlcnR5LiBCZWNhdXNlIGl0IGlzIGdvaW5nIHRvIERPTSwgdGhpcyBpcyBub3Qgc3ViamVjdCB0b1xuICogICAgICAgIHJlbmFtaW5nIGFzIHBhcnQgb2YgbWluaWZpY2F0aW9uLlxuICogQHBhcmFtIHZhbHVlIE5ldyB2YWx1ZSB0byB3cml0ZS5cbiAqIEBwYXJhbSBzYW5pdGl6ZXIgQW4gb3B0aW9uYWwgZnVuY3Rpb24gdXNlZCB0byBzYW5pdGl6ZSB0aGUgdmFsdWUuXG4gKiBAcGFyYW0gbmF0aXZlT25seSBXaGV0aGVyIG9yIG5vdCB3ZSBzaG91bGQgb25seSBzZXQgbmF0aXZlIHByb3BlcnRpZXMgYW5kIHNraXAgaW5wdXQgY2hlY2tcbiAqICh0aGlzIGlzIG5lY2Vzc2FyeSBmb3IgaG9zdCBwcm9wZXJ0eSBiaW5kaW5ncylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eTxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hdGl2ZU9ubHk/OiBib29sZWFuKTogdm9pZCB7XG4gIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsKGluZGV4LCBwcm9wTmFtZSwgdmFsdWUsIHNhbml0aXplciwgbmF0aXZlT25seSk7XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHN5bnRoZXRpYyBob3N0IGJpbmRpbmcgKGUuZy4gYFtAZm9vXWApIG9uIGEgY29tcG9uZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgZm9yIGNvbXBhdGliaWxpdHkgcHVycG9zZXMgYW5kIGlzIGRlc2lnbmVkIHRvIGVuc3VyZSB0aGF0IGFcbiAqIHN5bnRoZXRpYyBob3N0IGJpbmRpbmcgKGUuZy4gYEBIb3N0QmluZGluZygnQGZvbycpYCkgcHJvcGVybHkgZ2V0cyByZW5kZXJlZCBpblxuICogdGhlIGNvbXBvbmVudCdzIHJlbmRlcmVyLiBOb3JtYWxseSBhbGwgaG9zdCBiaW5kaW5ncyBhcmUgZXZhbHVhdGVkIHdpdGggdGhlIHBhcmVudFxuICogY29tcG9uZW50J3MgcmVuZGVyZXIsIGJ1dCwgaW4gdGhlIGNhc2Ugb2YgYW5pbWF0aW9uIEB0cmlnZ2VycywgdGhleSBuZWVkIHRvIGJlXG4gKiBldmFsdWF0ZWQgd2l0aCB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIChiZWNhdXNlIHRoYXQncyB3aGVyZSB0aGUgYW5pbWF0aW9uXG4gKiB0cmlnZ2VycyBhcmUgZGVmaW5lZCkuXG4gKlxuICogRG8gbm90IHVzZSB0aGlzIGluc3RydWN0aW9uIGFzIGEgcmVwbGFjZW1lbnQgZm9yIGBlbGVtZW50UHJvcGVydHlgLiBUaGlzIGluc3RydWN0aW9uXG4gKiBvbmx5IGV4aXN0cyB0byBlbnN1cmUgY29tcGF0aWJpbGl0eSB3aXRoIHRoZSBWaWV3RW5naW5lJ3MgaG9zdCBiaW5kaW5nIGJlaGF2aW9yLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIGVsZW1lbnQgdG8gdXBkYXRlIGluIHRoZSBkYXRhIGFycmF5XG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiBwcm9wZXJ0eS4gQmVjYXVzZSBpdCBpcyBnb2luZyB0byBET00sIHRoaXMgaXMgbm90IHN1YmplY3QgdG9cbiAqICAgICAgICByZW5hbWluZyBhcyBwYXJ0IG9mIG1pbmlmaWNhdGlvbi5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUuXG4gKiBAcGFyYW0gc2FuaXRpemVyIEFuIG9wdGlvbmFsIGZ1bmN0aW9uIHVzZWQgdG8gc2FuaXRpemUgdGhlIHZhbHVlLlxuICogQHBhcmFtIG5hdGl2ZU9ubHkgV2hldGhlciBvciBub3Qgd2Ugc2hvdWxkIG9ubHkgc2V0IG5hdGl2ZSBwcm9wZXJ0aWVzIGFuZCBza2lwIGlucHV0IGNoZWNrXG4gKiAodGhpcyBpcyBuZWNlc3NhcnkgZm9yIGhvc3QgcHJvcGVydHkgYmluZGluZ3MpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRIb3N0U3ludGhldGljUHJvcGVydHk8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYXRpdmVPbmx5PzogYm9vbGVhbikge1xuICBlbGVtZW50UHJvcGVydHlJbnRlcm5hbChpbmRleCwgcHJvcE5hbWUsIHZhbHVlLCBzYW5pdGl6ZXIsIG5hdGl2ZU9ubHksIGxvYWRDb21wb25lbnRSZW5kZXJlcik7XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIGluZGV4OiBudW1iZXIsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBUIHwgTk9fQ0hBTkdFLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBpZiAodmFsdWUgPT09IE5PX0NIQU5HRSkgcmV0dXJuO1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBsZXQgaW5wdXREYXRhOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiAoaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHROb2RlKSkgJiZcbiAgICAgIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnQodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZVByb3BlcnR5KHByb3BOYW1lKTtcbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgc2F2ZVByb3BlcnR5RGVidWdEYXRhKHROb2RlLCBsVmlldywgcHJvcE5hbWUsIGxWaWV3W1RWSUVXXS5kYXRhLCBuYXRpdmVPbmx5KTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFN0b3JlcyBkZWJ1Z2dpbmcgZGF0YSBmb3IgdGhpcyBwcm9wZXJ0eSBiaW5kaW5nIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4gKiBUaGlzIGVuYWJsZXMgZmVhdHVyZXMgbGlrZSBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZVByb3BlcnR5RGVidWdEYXRhKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB0RGF0YTogVERhdGEsXG4gICAgbmF0aXZlT25seTogYm9vbGVhbiB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICBjb25zdCBsYXN0QmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSAxO1xuXG4gIC8vIEJpbmQvaW50ZXJwb2xhdGlvbiBmdW5jdGlvbnMgc2F2ZSBiaW5kaW5nIG1ldGFkYXRhIGluIHRoZSBsYXN0IGJpbmRpbmcgaW5kZXgsXG4gIC8vIGJ1dCBsZWF2ZSB0aGUgcHJvcGVydHkgbmFtZSBibGFuay4gSWYgdGhlIGludGVycG9sYXRpb24gZGVsaW1pdGVyIGlzIGF0IHRoZSAwXG4gIC8vIGluZGV4LCB3ZSBrbm93IHRoYXQgdGhpcyBpcyBvdXIgZmlyc3QgcGFzcyBhbmQgdGhlIHByb3BlcnR5IG5hbWUgc3RpbGwgbmVlZHMgdG9cbiAgLy8gYmUgc2V0LlxuICBjb25zdCBiaW5kaW5nTWV0YWRhdGEgPSB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gIGlmIChiaW5kaW5nTWV0YWRhdGFbMF0gPT0gSU5URVJQT0xBVElPTl9ERUxJTUlURVIpIHtcbiAgICB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9IHByb3BOYW1lICsgYmluZGluZ01ldGFkYXRhO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzdG9yZSBpbmRpY2VzIGZvciBob3N0IGJpbmRpbmdzIGJlY2F1c2UgdGhleSBhcmUgc3RvcmVkIGluIGFcbiAgICAvLyBkaWZmZXJlbnQgcGFydCBvZiBMVmlldyAodGhlIGV4cGFuZG8gc2VjdGlvbikuXG4gICAgaWYgKCFuYXRpdmVPbmx5KSB7XG4gICAgICBpZiAodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPSBsYXN0QmluZGluZ0luZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleCArIDE7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhZGp1c3RlZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGluamVjdG9ySW5kZXg6IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMSxcbiAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICBwcm9wZXJ0eU1ldGFkYXRhU3RhcnRJbmRleDogLTEsXG4gICAgcHJvcGVydHlNZXRhZGF0YUVuZEluZGV4OiAtMSxcbiAgICBmbGFnczogMCxcbiAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogbnVsbCxcbiAgICBuZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBkZXRhY2hlZDogbnVsbCxcbiAgICBzdHlsaW5nVGVtcGxhdGU6IG51bGwsXG4gICAgcHJvamVjdGlvbjogbnVsbFxuICB9O1xufVxuXG4vKipcbiAqIFNldCB0aGUgaW5wdXRzIG9mIGRpcmVjdGl2ZXMgYXQgdGhlIGN1cnJlbnQgbm9kZSB0byBjb3JyZXNwb25kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dEFsaWFzZXMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqIHBvc3NpYmx5IG1pbmlmaWVkLCBwcm9wZXJ0eSBuYW1lcyB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBzZXQuXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3OiBMVmlldywgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBpbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGlmIChzZXRJbnB1dCkge1xuICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSxcbiAgICB2YWx1ZTogYW55KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgY29uc3QgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGlucHV0c1tpICsgMl0gYXMgc3RyaW5nKTtcbiAgICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICAgIGlmICh0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSkgOlxuICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRlYnVnVmFsdWUpO1xuICAgIH0gZWxzZSBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWA7XG4gICAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdmFsdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGVsZW1lbnQgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGVGbGFncyBub2RlIGZsYWdzXG4gKiBAcGFyYW0gZGlyZWN0aW9uIHdoZXRoZXIgdG8gY29uc2lkZXIgaW5wdXRzIG9yIG91dHB1dHNcbiAqIEByZXR1cm5zIFByb3BlcnR5QWxpYXNlc3xudWxsIGFnZ3JlZ2F0ZSBvZiBhbGwgcHJvcGVydGllcyBpZiBhbnksIGBudWxsYCBvdGhlcndpc2VcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXModE5vZGU6IFROb2RlLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuXG4gIGlmIChlbmQgPiBzdGFydCkge1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIHB1YmxpY05hbWUsIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogQXNzaWduIGFueSBpbmxpbmUgc3R5bGUgdmFsdWVzIHRvIHRoZSBlbGVtZW50IGR1cmluZyBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgY2FsbGVkIGR1cmluZyBjcmVhdGlvbiBtb2RlIHRvIHJlZ2lzdGVyIGFsbFxuICogZHluYW1pYyBzdHlsZSBhbmQgY2xhc3MgYmluZGluZ3Mgb24gdGhlIGVsZW1lbnQuIE5vdGUgZm9yIHN0YXRpYyB2YWx1ZXMgKG5vIGJpbmRpbmcpXG4gKiBzZWUgYGVsZW1lbnRTdGFydGAgYW5kIGBlbGVtZW50SG9zdEF0dHJzYC5cbiAqXG4gKiBAcGFyYW0gY2xhc3NCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBjbGFzcyBuYW1lcy5cbiAqICAgICAgICBUaGUgYGVsZW1lbnRDbGFzc1Byb3BgIHJlZmVycyB0byB0aGUgY2xhc3MgbmFtZSBieSBpbmRleCBpbiB0aGlzIGFycmF5LlxuICogICAgICAgIChpLmUuIGBbJ2ZvbycsICdiYXInXWAgbWVhbnMgYGZvbz0wYCBhbmQgYGJhcj0xYCkuXG4gKiBAcGFyYW0gc3R5bGVCaW5kaW5nTmFtZXMgQW4gYXJyYXkgY29udGFpbmluZyBiaW5kYWJsZSBzdHlsZSBwcm9wZXJ0aWVzLlxuICogICAgICAgIFRoZSBgZWxlbWVudFN0eWxlUHJvcGAgcmVmZXJzIHRvIHRoZSBjbGFzcyBuYW1lIGJ5IGluZGV4IGluIHRoaXMgYXJyYXkuXG4gKiAgICAgICAgKGkuZS4gYFsnd2lkdGgnLCAnaGVpZ2h0J11gIG1lYW5zIGB3aWR0aD0wYCBhbmQgYGhlaWdodD0xYCkuXG4gKiBAcGFyYW0gc3R5bGVTYW5pdGl6ZXIgQW4gb3B0aW9uYWwgc2FuaXRpemVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBiZSB1c2VkIHRvIHNhbml0aXplIGFueSBDU1NcbiAqICAgICAgICBwcm9wZXJ0eSB2YWx1ZXMgdGhhdCBhcmUgYXBwbGllZCB0byB0aGUgZWxlbWVudCAoZHVyaW5nIHJlbmRlcmluZykuXG4gKiAgICAgICAgTm90ZSB0aGF0IHRoZSBzYW5pdGl6ZXIgaW5zdGFuY2UgaXRzZWxmIGlzIHRpZWQgdG8gdGhlIGBkaXJlY3RpdmVgIChpZiAgcHJvdmlkZWQpLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBBIGRpcmVjdGl2ZSBpbnN0YW5jZSB0aGUgc3R5bGluZyBpcyBhc3NvY2lhdGVkIHdpdGguIElmIG5vdCBwcm92aWRlZFxuICogICAgICAgIGN1cnJlbnQgdmlldydzIGNvbnRyb2xsZXIgaW5zdGFuY2UgaXMgYXNzdW1lZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZyhcbiAgICBjbGFzc0JpbmRpbmdOYW1lcz86IHN0cmluZ1tdIHwgbnVsbCwgc3R5bGVCaW5kaW5nTmFtZXM/OiBzdHJpbmdbXSB8IG51bGwsXG4gICAgc3R5bGVTYW5pdGl6ZXI/OiBTdHlsZVNhbml0aXplRm4gfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAoIXROb2RlLnN0eWxpbmdUZW1wbGF0ZSkge1xuICAgIHROb2RlLnN0eWxpbmdUZW1wbGF0ZSA9IGNyZWF0ZUVtcHR5U3R5bGluZ0NvbnRleHQoKTtcbiAgfVxuICB1cGRhdGVDb250ZXh0V2l0aEJpbmRpbmdzKFxuICAgICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlICEsIGRpcmVjdGl2ZSB8fCBudWxsLCBjbGFzc0JpbmRpbmdOYW1lcywgc3R5bGVCaW5kaW5nTmFtZXMsXG4gICAgICBzdHlsZVNhbml0aXplciwgaGFzQ2xhc3NJbnB1dCh0Tm9kZSkpO1xufVxuXG4vKipcbiAqIEFzc2lnbiBzdGF0aWMgYXR0cmlidXRlIHZhbHVlcyB0byBhIGhvc3QgZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIHdpbGwgYXNzaWduIHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWVzIGFzIHdlbGwgYXMgY2xhc3MgYW5kIHN0eWxlXG4gKiB2YWx1ZXMgdG8gYW4gZWxlbWVudCB3aXRoaW4gdGhlIGhvc3QgYmluZGluZ3MgZnVuY3Rpb24uIFNpbmNlIGF0dHJpYnV0ZSB2YWx1ZXNcbiAqIGNhbiBjb25zaXN0IG9mIGRpZmZlcmVudCB0eXBlcyBvZiB2YWx1ZXMsIHRoZSBgYXR0cnNgIGFycmF5IG11c3QgaW5jbHVkZSB0aGUgdmFsdWVzIGluXG4gKiB0aGUgZm9sbG93aW5nIGZvcm1hdDpcbiAqXG4gKiBhdHRycyA9IFtcbiAqICAgLy8gc3RhdGljIGF0dHJpYnV0ZXMgKGxpa2UgYHRpdGxlYCwgYG5hbWVgLCBgaWRgLi4uKVxuICogICBhdHRyMSwgdmFsdWUxLCBhdHRyMiwgdmFsdWUsXG4gKlxuICogICAvLyBhIHNpbmdsZSBuYW1lc3BhY2UgdmFsdWUgKGxpa2UgYHg6aWRgKVxuICogICBOQU1FU1BBQ0VfTUFSS0VSLCBuYW1lc3BhY2VVcmkxLCBuYW1lMSwgdmFsdWUxLFxuICpcbiAqICAgLy8gYW5vdGhlciBzaW5nbGUgbmFtZXNwYWNlIHZhbHVlIChsaWtlIGB4Om5hbWVgKVxuICogICBOQU1FU1BBQ0VfTUFSS0VSLCBuYW1lc3BhY2VVcmkyLCBuYW1lMiwgdmFsdWUyLFxuICpcbiAqICAgLy8gYSBzZXJpZXMgb2YgQ1NTIGNsYXNzZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgKG5vIHNwYWNlcylcbiAqICAgQ0xBU1NFU19NQVJLRVIsIGNsYXNzMSwgY2xhc3MyLCBjbGFzczMsXG4gKlxuICogICAvLyBhIHNlcmllcyBvZiBDU1Mgc3R5bGVzIChwcm9wZXJ0eSArIHZhbHVlKSB0aGF0IHdpbGwgYmUgYXBwbGllZCB0byB0aGUgZWxlbWVudFxuICogICBTVFlMRVNfTUFSS0VSLCBwcm9wMSwgdmFsdWUxLCBwcm9wMiwgdmFsdWUyXG4gKiBdXG4gKlxuICogQWxsIG5vbi1jbGFzcyBhbmQgbm9uLXN0eWxlIGF0dHJpYnV0ZXMgbXVzdCBiZSBkZWZpbmVkIGF0IHRoZSBzdGFydCBvZiB0aGUgbGlzdFxuICogZmlyc3QgYmVmb3JlIGFsbCBjbGFzcyBhbmQgc3R5bGUgdmFsdWVzIGFyZSBzZXQuIFdoZW4gdGhlcmUgaXMgYSBjaGFuZ2UgaW4gdmFsdWVcbiAqIHR5cGUgKGxpa2Ugd2hlbiBjbGFzc2VzIGFuZCBzdHlsZXMgYXJlIGludHJvZHVjZWQpIGEgbWFya2VyIG11c3QgYmUgdXNlZCB0byBzZXBhcmF0ZVxuICogdGhlIGVudHJpZXMuIFRoZSBtYXJrZXIgdmFsdWVzIHRoZW1zZWx2ZXMgYXJlIHNldCB2aWEgZW50cmllcyBmb3VuZCBpbiB0aGVcbiAqIFtBdHRyaWJ1dGVNYXJrZXJdIGVudW0uXG4gKlxuICogTk9URTogVGhpcyBpbnN0cnVjdGlvbiBpcyBtZWFudCB0byB1c2VkIGZyb20gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gb25seS5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEEgZGlyZWN0aXZlIGluc3RhbmNlIHRoZSBzdHlsaW5nIGlzIGFzc29jaWF0ZWQgd2l0aC5cbiAqIEBwYXJhbSBhdHRycyBBbiBhcnJheSBvZiBzdGF0aWMgdmFsdWVzIChhdHRyaWJ1dGVzLCBjbGFzc2VzIGFuZCBzdHlsZXMpIHdpdGggdGhlIGNvcnJlY3QgbWFya2VyXG4gKiB2YWx1ZXMuXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEhvc3RBdHRycyhkaXJlY3RpdmU6IGFueSwgYXR0cnM6IFRBdHRyaWJ1dGVzKSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICghdE5vZGUuc3R5bGluZ1RlbXBsYXRlKSB7XG4gICAgdE5vZGUuc3R5bGluZ1RlbXBsYXRlID0gaW5pdGlhbGl6ZVN0YXRpY1N0eWxpbmdDb250ZXh0KGF0dHJzKTtcbiAgfVxuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgaSA9IHNldFVwQXR0cmlidXRlcyhuYXRpdmUsIGF0dHJzKTtcbiAgcGF0Y2hDb250ZXh0V2l0aFN0YXRpY0F0dHJzKHROb2RlLnN0eWxpbmdUZW1wbGF0ZSwgYXR0cnMsIGksIGRpcmVjdGl2ZSk7XG59XG5cbi8qKlxuICogQXBwbHkgc3R5bGluZyBiaW5kaW5nIHRvIHRoZSBlbGVtZW50LlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgdG8gYmUgcnVuIGFmdGVyIGBlbGVtZW50U3R5bGVgIGFuZC9vciBgZWxlbWVudFN0eWxlUHJvcGAuXG4gKiBpZiBhbnkgc3R5bGluZyBiaW5kaW5ncyBoYXZlIGNoYW5nZWQgdGhlbiB0aGUgY2hhbmdlcyBhcmUgZmx1c2hlZCB0byB0aGUgZWxlbWVudC5cbiAqXG4gKlxuICogQHBhcmFtIGluZGV4IEluZGV4IG9mIHRoZSBlbGVtZW50J3Mgd2l0aCB3aGljaCBzdHlsaW5nIGlzIGFzc29jaWF0ZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIERpcmVjdGl2ZSBpbnN0YW5jZSB0aGF0IGlzIGF0dGVtcHRpbmcgdG8gY2hhbmdlIHN0eWxpbmcuIChEZWZhdWx0cyB0byB0aGVcbiAqICAgICAgICBjb21wb25lbnQgb2YgdGhlIGN1cnJlbnQgdmlldykuXG5jb21wb25lbnRzXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxpbmdBcHBseShpbmRleDogbnVtYmVyLCBkaXJlY3RpdmU/OiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBpc0ZpcnN0UmVuZGVyID0gKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpICE9PSAwO1xuICBjb25zdCB0b3RhbFBsYXllcnNRdWV1ZWQgPSByZW5kZXJTdHlsaW5nKFxuICAgICAgZ2V0U3R5bGluZ0NvbnRleHQoaW5kZXggKyBIRUFERVJfT0ZGU0VULCBsVmlldyksIGxWaWV3W1JFTkRFUkVSXSwgbFZpZXcsIGlzRmlyc3RSZW5kZXIsIG51bGwsXG4gICAgICBudWxsLCBkaXJlY3RpdmUpO1xuICBpZiAodG90YWxQbGF5ZXJzUXVldWVkID4gMCkge1xuICAgIGNvbnN0IHJvb3RDb250ZXh0ID0gZ2V0Um9vdENvbnRleHQobFZpZXcpO1xuICAgIHNjaGVkdWxlVGljayhyb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlIGEgc3R5bGUgYmluZGluZ3MgdmFsdWUgb24gYW4gZWxlbWVudC5cbiAqXG4gKiBJZiB0aGUgc3R5bGUgdmFsdWUgaXMgYG51bGxgIHRoZW4gaXQgd2lsbCBiZSByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnRcbiAqIChvciBhc3NpZ25lZCBhIGRpZmZlcmVudCB2YWx1ZSBkZXBlbmRpbmcgaWYgdGhlcmUgYXJlIGFueSBzdHlsZXMgcGxhY2VkXG4gKiBvbiB0aGUgZWxlbWVudCB3aXRoIGBlbGVtZW50U3R5bGVgIG9yIGFueSBzdHlsZXMgdGhhdCBhcmUgcHJlc2VudFxuICogZnJvbSB3aGVuIHRoZSBlbGVtZW50IHdhcyBjcmVhdGVkICh3aXRoIGBlbGVtZW50U3R5bGluZ2ApLlxuICpcbiAqIChOb3RlIHRoYXQgdGhlIHN0eWxpbmcgZWxlbWVudCBpcyB1cGRhdGVkIGFzIHBhcnQgb2YgYGVsZW1lbnRTdHlsaW5nQXBwbHlgLilcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIGVsZW1lbnQncyB3aXRoIHdoaWNoIHN0eWxpbmcgaXMgYXNzb2NpYXRlZC5cbiAqIEBwYXJhbSBzdHlsZUluZGV4IEluZGV4IG9mIHN0eWxlIHRvIHVwZGF0ZS4gVGhpcyBpbmRleCB2YWx1ZSByZWZlcnMgdG8gdGhlXG4gKiAgICAgICAgaW5kZXggb2YgdGhlIHN0eWxlIGluIHRoZSBzdHlsZSBiaW5kaW5ncyBhcnJheSB0aGF0IHdhcyBwYXNzZWQgaW50b1xuICogICAgICAgIGBlbGVtZW50U3RseWluZ0JpbmRpbmdzYC5cbiAqIEBwYXJhbSB2YWx1ZSBOZXcgdmFsdWUgdG8gd3JpdGUgKG51bGwgdG8gcmVtb3ZlKS4gTm90ZSB0aGF0IGlmIGEgZGlyZWN0aXZlIGFsc29cbiAqICAgICAgICBhdHRlbXB0cyB0byB3cml0ZSB0byB0aGUgc2FtZSBiaW5kaW5nIHZhbHVlIHRoZW4gaXQgd2lsbCBvbmx5IGJlIGFibGUgdG9cbiAqICAgICAgICBkbyBzbyBpZiB0aGUgdGVtcGxhdGUgYmluZGluZyB2YWx1ZSBpcyBgbnVsbGAgKG9yIGRvZXNuJ3QgZXhpc3QgYXQgYWxsKS5cbiAqIEBwYXJhbSBzdWZmaXggT3B0aW9uYWwgc3VmZml4LiBVc2VkIHdpdGggc2NhbGFyIHZhbHVlcyB0byBhZGQgdW5pdCBzdWNoIGFzIGBweGAuXG4gKiAgICAgICAgTm90ZSB0aGF0IHdoZW4gYSBzdWZmaXggaXMgcHJvdmlkZWQgdGhlbiB0aGUgdW5kZXJseWluZyBzYW5pdGl6ZXIgd2lsbFxuICogICAgICAgIGJlIGlnbm9yZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlIERpcmVjdGl2ZSBpbnN0YW5jZSB0aGF0IGlzIGF0dGVtcHRpbmcgdG8gY2hhbmdlIHN0eWxpbmcuIChEZWZhdWx0cyB0byB0aGVcbiAqICAgICAgICBjb21wb25lbnQgb2YgdGhlIGN1cnJlbnQgdmlldykuXG5jb21wb25lbnRzXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFN0eWxlUHJvcChcbiAgICBpbmRleDogbnVtYmVyLCBzdHlsZUluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcgfCBudW1iZXIgfCBTdHJpbmcgfCBQbGF5ZXJGYWN0b3J5IHwgbnVsbCxcbiAgICBzdWZmaXg/OiBzdHJpbmcgfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICBsZXQgdmFsdWVUb0FkZDogc3RyaW5nfG51bGwgPSBudWxsO1xuICBpZiAodmFsdWUgIT09IG51bGwpIHtcbiAgICBpZiAoc3VmZml4KSB7XG4gICAgICAvLyB3aGVuIGEgc3VmZml4IGlzIGFwcGxpZWQgdGhlbiBpdCB3aWxsIGJ5cGFzc1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGVudGlyZWx5IChiL2MgYSBuZXcgc3RyaW5nIGlzIGNyZWF0ZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSArIHN1ZmZpeDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gc2FuaXRpemF0aW9uIGhhcHBlbnMgYnkgZGVhbGluZyB3aXRoIGEgU3RyaW5nIHZhbHVlXG4gICAgICAvLyB0aGlzIG1lYW5zIHRoYXQgdGhlIHN0cmluZyB2YWx1ZSB3aWxsIGJlIHBhc3NlZCB0aHJvdWdoXG4gICAgICAvLyBpbnRvIHRoZSBzdHlsZSByZW5kZXJpbmcgbGF0ZXIgKHdoaWNoIGlzIHdoZXJlIHRoZSB2YWx1ZVxuICAgICAgLy8gd2lsbCBiZSBzYW5pdGl6ZWQgYmVmb3JlIGl0IGlzIGFwcGxpZWQpXG4gICAgICB2YWx1ZVRvQWRkID0gdmFsdWUgYXMgYW55IGFzIHN0cmluZztcbiAgICB9XG4gIH1cbiAgdXBkYXRlRWxlbWVudFN0eWxlUHJvcChcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgZ2V0TFZpZXcoKSksIHN0eWxlSW5kZXgsIHZhbHVlVG9BZGQsIGRpcmVjdGl2ZSk7XG59XG5cbi8qKlxuICogQWRkIG9yIHJlbW92ZSBhIGNsYXNzIHZpYSBhIGNsYXNzIGJpbmRpbmcgb24gYSBET00gZWxlbWVudC5cbiAqXG4gKiBUaGlzIGluc3RydWN0aW9uIGlzIG1lYW50IHRvIGhhbmRsZSB0aGUgW2NsYXNzLmZvb109XCJleHBcIiBjYXNlIGFuZCwgdGhlcmVmb3JlLFxuICogdGhlIGNsYXNzIGl0c2VsZiBtdXN0IGFscmVhZHkgYmUgYXBwbGllZCB1c2luZyBgZWxlbWVudFN0eWxpbmdgIHdpdGhpblxuICogdGhlIGNyZWF0aW9uIGJsb2NrLlxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGNsYXNzSW5kZXggSW5kZXggb2YgY2xhc3MgdG8gdG9nZ2xlLiBUaGlzIGluZGV4IHZhbHVlIHJlZmVycyB0byB0aGVcbiAqICAgICAgICBpbmRleCBvZiB0aGUgY2xhc3MgaW4gdGhlIGNsYXNzIGJpbmRpbmdzIGFycmF5IHRoYXQgd2FzIHBhc3NlZCBpbnRvXG4gKiAgICAgICAgYGVsZW1lbnRTdGx5aW5nQmluZGluZ3NgICh3aGljaCBpcyBtZWFudCB0byBiZSBjYWxsZWQgYmVmb3JlIHRoaXNcbiAqICAgICAgICBmdW5jdGlvbiBpcykuXG4gKiBAcGFyYW0gdmFsdWUgQSB0cnVlL2ZhbHNlIHZhbHVlIHdoaWNoIHdpbGwgdHVybiB0aGUgY2xhc3Mgb24gb3Igb2ZmLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBEaXJlY3RpdmUgaW5zdGFuY2UgdGhhdCBpcyBhdHRlbXB0aW5nIHRvIGNoYW5nZSBzdHlsaW5nLiAoRGVmYXVsdHMgdG8gdGhlXG4gKiAgICAgICAgY29tcG9uZW50IG9mIHRoZSBjdXJyZW50IHZpZXcpLlxuY29tcG9uZW50c1xuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDbGFzc1Byb3AoXG4gICAgaW5kZXg6IG51bWJlciwgY2xhc3NJbmRleDogbnVtYmVyLCB2YWx1ZTogYm9vbGVhbiB8IFBsYXllckZhY3RvcnksIGRpcmVjdGl2ZT86IHt9KTogdm9pZCB7XG4gIGNvbnN0IG9uT3JPZmZDbGFzc1ZhbHVlID1cbiAgICAgICh2YWx1ZSBpbnN0YW5jZW9mIEJvdW5kUGxheWVyRmFjdG9yeSkgPyAodmFsdWUgYXMgQm91bmRQbGF5ZXJGYWN0b3J5PGJvb2xlYW4+KSA6ICghIXZhbHVlKTtcbiAgdXBkYXRlRWxlbWVudENsYXNzUHJvcChcbiAgICAgIGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgZ2V0TFZpZXcoKSksIGNsYXNzSW5kZXgsIG9uT3JPZmZDbGFzc1ZhbHVlLFxuICAgICAgZGlyZWN0aXZlKTtcbn1cblxuLyoqXG4gKiBVcGRhdGUgc3R5bGUgYW5kL29yIGNsYXNzIGJpbmRpbmdzIHVzaW5nIG9iamVjdCBsaXRlcmFsLlxuICpcbiAqIFRoaXMgaW5zdHJ1Y3Rpb24gaXMgbWVhbnQgYXBwbHkgc3R5bGluZyB2aWEgdGhlIGBbc3R5bGVdPVwiZXhwXCJgIGFuZCBgW2NsYXNzXT1cImV4cFwiYCB0ZW1wbGF0ZVxuICogYmluZGluZ3MuIFdoZW4gc3R5bGVzIGFyZSBhcHBsaWVkIHRvIHRoZSBFbGVtZW50IHRoZXkgd2lsbCB0aGVuIGJlIHBsYWNlZCB3aXRoIHJlc3BlY3QgdG9cbiAqIGFueSBzdHlsZXMgc2V0IHdpdGggYGVsZW1lbnRTdHlsZVByb3BgLiBJZiBhbnkgc3R5bGVzIGFyZSBzZXQgdG8gYG51bGxgIHRoZW4gdGhleSB3aWxsIGJlXG4gKiByZW1vdmVkIGZyb20gdGhlIGVsZW1lbnQuXG4gKlxuICogKE5vdGUgdGhhdCB0aGUgc3R5bGluZyBpbnN0cnVjdGlvbiB3aWxsIG5vdCBiZSBhcHBsaWVkIHVudGlsIGBlbGVtZW50U3R5bGluZ0FwcGx5YCBpcyBjYWxsZWQuKVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgZWxlbWVudCdzIHdpdGggd2hpY2ggc3R5bGluZyBpcyBhc3NvY2lhdGVkLlxuICogQHBhcmFtIGNsYXNzZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIENTUyBjbGFzc2VzIHRoYXQgd2lsbCBiZSBhZGRlZCB0byB0aGUgZ2l2ZW4gZWxlbWVudC5cbiAqICAgICAgICBBbnkgbWlzc2luZyBjbGFzc2VzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3MgbGlzdCBvZiBDU1MgY2xhc3Nlcy5cbiAqIEBwYXJhbSBzdHlsZXMgQSBrZXkvdmFsdWUgc3R5bGUgbWFwIG9mIHRoZSBzdHlsZXMgdGhhdCB3aWxsIGJlIGFwcGxpZWQgdG8gdGhlIGdpdmVuIGVsZW1lbnQuXG4gKiAgICAgICAgQW55IG1pc3Npbmcgc3R5bGVzICh0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIGFwcGxpZWQgdG8gdGhlIGVsZW1lbnQgYmVmb3JlaGFuZCkgd2lsbCBiZVxuICogICAgICAgIHJlbW92ZWQgKHVuc2V0KSBmcm9tIHRoZSBlbGVtZW50J3Mgc3R5bGluZy5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgRGlyZWN0aXZlIGluc3RhbmNlIHRoYXQgaXMgYXR0ZW1wdGluZyB0byBjaGFuZ2Ugc3R5bGluZy4gKERlZmF1bHRzIHRvIHRoZVxuICogICAgICAgIGNvbXBvbmVudCBvZiB0aGUgY3VycmVudCB2aWV3KS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50U3R5bGluZ01hcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICBpZiAoZGlyZWN0aXZlICE9IHVuZGVmaW5lZClcbiAgICByZXR1cm4gaGFja0ltcGxlbWVudGF0aW9uT2ZFbGVtZW50U3R5bGluZ01hcChcbiAgICAgICAgaW5kZXgsIGNsYXNzZXMsIHN0eWxlcywgZGlyZWN0aXZlKTsgIC8vIHN1cHBvcnRlZCBpbiBuZXh0IFBSXG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBjb25zdCBzdHlsaW5nQ29udGV4dCA9IGdldFN0eWxpbmdDb250ZXh0KGluZGV4ICsgSEVBREVSX09GRlNFVCwgbFZpZXcpO1xuICBpZiAoaGFzQ2xhc3NJbnB1dCh0Tm9kZSkgJiYgY2xhc3NlcyAhPT0gTk9fQ0hBTkdFKSB7XG4gICAgY29uc3QgaW5pdGlhbENsYXNzZXMgPSBnZXRJbml0aWFsQ2xhc3NOYW1lVmFsdWUoc3R5bGluZ0NvbnRleHQpO1xuICAgIGNvbnN0IGNsYXNzSW5wdXRWYWwgPVxuICAgICAgICAoaW5pdGlhbENsYXNzZXMubGVuZ3RoID8gKGluaXRpYWxDbGFzc2VzICsgJyAnKSA6ICcnKSArIChjbGFzc2VzIGFzIHN0cmluZyk7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIHROb2RlLmlucHV0cyAhWydjbGFzcyddICEsIGNsYXNzSW5wdXRWYWwpO1xuICB9IGVsc2Uge1xuICAgIHVwZGF0ZVN0eWxpbmdNYXAoc3R5bGluZ0NvbnRleHQsIGNsYXNzZXMsIHN0eWxlcyk7XG4gIH1cbn1cblxuLyogU1RBUlQgT0YgSEFDSyBCTE9DSyAqL1xuZnVuY3Rpb24gaGFja0ltcGxlbWVudGF0aW9uT2ZFbGVtZW50U3R5bGluZ01hcDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYW55fSB8IHN0cmluZyB8IE5PX0NIQU5HRSB8IG51bGwsXG4gICAgc3R5bGVzPzoge1tzdHlsZU5hbWU6IHN0cmluZ106IGFueX0gfCBOT19DSEFOR0UgfCBudWxsLCBkaXJlY3RpdmU/OiB7fSk6IHZvaWQge1xuICB0aHJvdyBuZXcgRXJyb3IoJ3VuaW1wbGVtZW50ZWQuIFNob3VsZCBub3QgYmUgbmVlZGVkIGJ5IFZpZXdFbmdpbmUgY29tcGF0aWJpbGl0eScpO1xufVxuLyogRU5EIE9GIEhBQ0sgQkxPQ0sgKi9cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVGV4dFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGUgc3RhdGljIHRleHQgbm9kZVxuICpcbiAqIEBwYXJhbSBpbmRleCBJbmRleCBvZiB0aGUgbm9kZSBpbiB0aGUgZGF0YSBhcnJheVxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHdyaXRlLiBUaGlzIHZhbHVlIHdpbGwgYmUgc3RyaW5naWZpZWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0KGluZGV4OiBudW1iZXIsIHZhbHVlPzogYW55KTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ3RleHQgbm9kZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlVGV4dE5vZGUrKztcbiAgY29uc3QgdGV4dE5hdGl2ZSA9IGNyZWF0ZVRleHROb2RlKHZhbHVlLCBsVmlld1tSRU5ERVJFUl0pO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuRWxlbWVudCwgdGV4dE5hdGl2ZSwgbnVsbCwgbnVsbCk7XG5cbiAgLy8gVGV4dCBub2RlcyBhcmUgc2VsZiBjbG9zaW5nLlxuICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIGFwcGVuZENoaWxkKHRleHROYXRpdmUsIHROb2RlLCBsVmlldyk7XG59XG5cbi8qKlxuICogQ3JlYXRlIHRleHQgbm9kZSB3aXRoIGJpbmRpbmdcbiAqIEJpbmRpbmdzIHNob3VsZCBiZSBoYW5kbGVkIGV4dGVybmFsbHkgd2l0aCB0aGUgcHJvcGVyIGludGVycG9sYXRpb24oMS04KSBtZXRob2RcbiAqXG4gKiBAcGFyYW0gaW5kZXggSW5kZXggb2YgdGhlIG5vZGUgaW4gdGhlIGRhdGEgYXJyYXkuXG4gKiBAcGFyYW0gdmFsdWUgU3RyaW5naWZpZWQgdmFsdWUgdG8gd3JpdGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZzxUPihpbmRleDogbnVtYmVyLCB2YWx1ZTogVCB8IE5PX0NIQU5HRSk6IHZvaWQge1xuICBpZiAodmFsdWUgIT09IE5PX0NIQU5HRSkge1xuICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gICAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQudGV4dENvbnRlbnQgPSByZW5kZXJTdHJpbmdpZnkodmFsdWUpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERpcmVjdGl2ZVxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkZWY6IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0Vmlldywgcm9vdFROb2RlLCAxKTtcbiAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0Vmlldywgdmlld0RhdGEsIGRlZiwgZGVmLmZhY3RvcnkpO1xuICB9XG4gIGNvbnN0IGRpcmVjdGl2ZSA9XG4gICAgICBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCB2aWV3RGF0YSwgdmlld0RhdGEubGVuZ3RoIC0gMSwgcm9vdFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZSh2aWV3RGF0YSwgcm9vdFROb2RlLCBkaXJlY3RpdmUsIGRlZiBhcyBEaXJlY3RpdmVEZWY8VD4pO1xuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIG1hdGNoZWQgZGlyZWN0aXZlcyBvbiBhIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdIHwgbnVsbCwgdE5vZGU6IFROb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogdm9pZCB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluIHRzaWNrbGUuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuICBpZiAoZGlyZWN0aXZlcykge1xuICAgIGluaXROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG4gICAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAgIC8vIHRoZSB2aWV3RW5naW5lOlxuICAgIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gICAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAvLyBTbyB0byBtYXRjaCB0aGVzZSBydWxlcywgdGhlIG9yZGVyIGluIHdoaWNoIHByb3ZpZGVycyBhcmUgYWRkZWQgaW4gdGhlIGFycmF5cyBpcyB2ZXJ5XG4gICAgLy8gaW1wb3J0YW50LlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIH1cbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0Vmlldywgdmlld0RhdGEsIGRlZiwgZGVmLmZhY3RvcnkpO1xuXG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKHRWaWV3LmRhdGEgIS5sZW5ndGggLSAxLCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAvLyBJbml0IGhvb2tzIGFyZSBxdWV1ZWQgbm93IHNvIG5nT25Jbml0IGlzIGNhbGxlZCBpbiBob3N0IGNvbXBvbmVudHMgYmVmb3JlXG4gICAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgICByZWdpc3RlclByZU9yZGVySG9va3MoZGlyZWN0aXZlRGVmSWR4LCBkZWYsIHRWaWV3KTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgc3RhcnQgPCBlbmQpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGxWaWV3ICEsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgcG9zdFByb2Nlc3NEaXJlY3RpdmUobFZpZXcsIGRpcmVjdGl2ZSwgZGVmLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlID0gdmlld0RhdGFbaV07XG4gICAgaWYgKGRlZi5ob3N0QmluZGluZ3MpIHtcbiAgICAgIGNvbnN0IHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9IGV4cGFuZG8ubGVuZ3RoO1xuICAgICAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihkZWYpO1xuICAgICAgZGVmLmhvc3RCaW5kaW5ncyAhKFJlbmRlckZsYWdzLkNyZWF0ZSwgZGlyZWN0aXZlLCB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgICAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihudWxsKTtcbiAgICAgIC8vIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG1heSBvciBtYXkgbm90IGNvbnRhaW4gYGFsbG9jSG9zdFZhcnNgIGNhbGxcbiAgICAgIC8vIChlLmcuIGl0IG1heSBub3QgaWYgaXQgb25seSBjb250YWlucyBob3N0IGxpc3RlbmVycyksIHNvIHdlIG5lZWQgdG8gY2hlY2sgd2hldGhlclxuICAgICAgLy8gYGV4cGFuZG9JbnN0cnVjdGlvbnNgIGhhcyBjaGFuZ2VkIGFuZCBpZiBub3QgLSB3ZSBzdGlsbCBwdXNoIGBob3N0QmluZGluZ3NgIHRvXG4gICAgICAvLyBleHBhbmRvIGJsb2NrLCB0byBtYWtlIHN1cmUgd2UgZXhlY3V0ZSBpdCBmb3IgREkgY3ljbGVcbiAgICAgIGlmIChwcmV2aW91c0V4cGFuZG9MZW5ndGggPT09IGV4cGFuZG8ubGVuZ3RoICYmIGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgICBleHBhbmRvLnB1c2gobnVsbCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuKiBHZW5lcmF0ZXMgYSBuZXcgYmxvY2sgaW4gVFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyBmb3IgdGhpcyBub2RlLlxuKlxuKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiogaXQgZnJvbSB0aGUgaG9zdFZhciBjb3VudCkgYW5kIHRoZSBkaXJlY3RpdmUgY291bnQuIFNlZSBtb3JlIGluIFZJRVdfREFUQS5tZC5cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlQ291bnQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ0V4cGFuZG8gYmxvY2sgc2hvdWxkIG9ubHkgYmUgZ2VuZXJhdGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG5cbiAgY29uc3QgZWxlbWVudEluZGV4ID0gLSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBwcm92aWRlclN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgcHJvdmlkZXJDb3VudCA9IHRWaWV3LmRhdGEubGVuZ3RoIC0gcHJvdmlkZXJTdGFydEluZGV4O1xuICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtcbiAgIF0pKS5wdXNoKGVsZW1lbnRJbmRleCwgcHJvdmlkZXJDb3VudCwgZGlyZWN0aXZlQ291bnQpO1xufVxuXG4vKipcbiogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHdlIG5lZWQgdG8gcmVzZXJ2ZSBzcGFjZSBmb3IgaG9zdCBiaW5kaW5nIHZhbHVlc1xuKiBhZnRlciBkaXJlY3RpdmVzIGFyZSBtYXRjaGVkIChzbyBhbGwgZGlyZWN0aXZlcyBhcmUgc2F2ZWQsIHRoZW4gYmluZGluZ3MpLlxuKiBCZWNhdXNlIHdlIGFyZSB1cGRhdGluZyB0aGUgYmx1ZXByaW50LCB3ZSBvbmx5IG5lZWQgdG8gZG8gdGhpcyBvbmNlLlxuKi9cbmZ1bmN0aW9uIHByZWZpbGxIb3N0VmFycyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdG90YWxIb3N0VmFyczogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB0b3RhbEhvc3RWYXJzOyBpKyspIHtcbiAgICBsVmlldy5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIGEgZGlyZWN0aXZlIG9uIHRoZSBjdXJyZW50IG5vZGUgYWZ0ZXIgaXRzIGNyZWF0aW9uLlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZTxUPihcbiAgICB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZGlyZWN0aXZlLCBkZWYpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdwcmV2aW91c09yUGFyZW50VE5vZGUnKTtcbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRlZiwgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBkZWYuY29udGVudFF1ZXJpZXMoZGlyZWN0aXZlRGVmSWR4KTtcbiAgfVxuXG4gIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCwgdmlld0RhdGEpO1xuICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkaXJlY3RpdmU6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcblxuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbn1cblxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSk6IERpcmVjdGl2ZURlZjxhbnk+W118XG4gICAgbnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gW10pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG59XG5cbi8qKlxuICogU3RvcmVzIGhvc3QgYmluZGluZyBmbiBhbmQgbnVtYmVyIG9mIGhvc3QgdmFycyBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgYmluZGluZyByZWZyZXNoIGR1cmluZ1xuICogQ0QuXG4qL1xuZnVuY3Rpb24gcXVldWVIb3N0QmluZGluZ0ZvckNoZWNrKFxuICAgIHRWaWV3OiBUVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sIGhvc3RWYXJzOiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBsZW5ndGggPSBleHBhbmRvLmxlbmd0aDtcbiAgLy8gQ2hlY2sgd2hldGhlciBhIGdpdmVuIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIGFscmVhZHkgZXhpc3RzIGluIGV4cGFuZG9JbnN0cnVjdGlvbnMsXG4gIC8vIHdoaWNoIGNhbiBoYXBwZW4gaW4gY2FzZSBkaXJlY3RpdmUgZGVmaW5pdGlvbiB3YXMgZXh0ZW5kZWQgZnJvbSBiYXNlIGRlZmluaXRpb24gKGFzIGEgcGFydCBvZlxuICAvLyB0aGUgYEluaGVyaXREZWZpbml0aW9uRmVhdHVyZWAgbG9naWMpLiBJZiB3ZSBmb3VuZCB0aGUgc2FtZSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBpbiB0aGVcbiAgLy8gbGlzdCwgd2UganVzdCBpbmNyZWFzZSB0aGUgbnVtYmVyIG9mIGhvc3QgdmFycyBhc3NvY2lhdGVkIHdpdGggdGhhdCBmdW5jdGlvbiwgYnV0IGRvIG5vdCBhZGQgaXRcbiAgLy8gaW50byB0aGUgbGlzdCBhZ2Fpbi5cbiAgaWYgKGxlbmd0aCA+PSAyICYmIGV4cGFuZG9bbGVuZ3RoIC0gMl0gPT09IGRlZi5ob3N0QmluZGluZ3MpIHtcbiAgICBleHBhbmRvW2xlbmd0aCAtIDFdID0gKGV4cGFuZG9bbGVuZ3RoIC0gMV0gYXMgbnVtYmVyKSArIGhvc3RWYXJzO1xuICB9IGVsc2Uge1xuICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzICEsIGhvc3RWYXJzKTtcbiAgfVxufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmbGFncyA9PT0gMCB8fCBmbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnZXhwZWN0ZWQgbm9kZSBmbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZmxhZ3MgPSBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LFxuICAgIGRpcmVjdGl2ZUZhY3Rvcnk6ICh0OiBUeXBlPFQ+fCBudWxsKSA9PiBhbnkpIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPVxuICAgICAgbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZGlyZWN0aXZlRmFjdG9yeSwgaXNDb21wb25lbnREZWYoZGVmKSwgZmFsc2UsIG51bGwpO1xuICB0Vmlldy5ibHVlcHJpbnQucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbiAgdmlld0RhdGEucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbFZpZXcpO1xuXG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhcbiAgICAgIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnkpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4IGFzIG51bWJlcixcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeSwgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0uY3JlYXRlUmVuZGVyZXIobmF0aXZlIGFzIFJFbGVtZW50LCBkZWYpKSk7XG5cbiAgY29tcG9uZW50Vmlld1tIT1NUX05PREVdID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgY29tcG9uZW50Vmlld1tIT1NUXSA9IGxWaWV3W3ByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleF07XG4gIGxWaWV3W3ByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xuXG4gIGlmIChsVmlld1tUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQpIHtcbiAgICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IFtdKTtcbiAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBudWxsO1xuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgLy8gSWYgd2UgaGl0IFNlbGVjdC1Pbmx5LCBDbGFzc2VzIG9yIFN0eWxlcywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5IHx8IGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuQ2xhc3NlcyB8fFxuICAgICAgICBhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcylcbiAgICAgIGJyZWFrO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWVdO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID1cbiAgICAgICAgICBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fCAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUsIG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICByZXR1cm4gW1xuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIFtdLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICBob3N0TmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0IG5hdGl2ZVxuICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZVxuICBdO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgYW4gbmctdGVtcGxhdGUgKGR5bmFtaWNhbGx5LWluc2VydGVkIHZpZXcpLCBlLmcuXG4gKlxuICogPG5nLXRlbXBsYXRlICNmb28+XG4gKiAgICA8ZGl2PjwvZGl2PlxuICogPC9uZy10ZW1wbGF0ZT5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBjb250YWluZXIgaW4gdGhlIGRhdGEgYXJyYXlcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIElubGluZSB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB2YXJzIFRoZSBudW1iZXIgb2YgYmluZGluZ3MgZm9yIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250YWluZXIgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRycyBhdHRhY2hlZCB0byB0aGUgY29udGFpbmVyLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbG9jYWxSZWZzIEEgc2V0IG9mIGxvY2FsIHJlZmVyZW5jZSBiaW5kaW5ncyBvbiB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBBIGZ1bmN0aW9uIHdoaWNoIGV4dHJhY3RzIGxvY2FsLXJlZnMgdmFsdWVzIGZyb20gdGhlIHRlbXBsYXRlLlxuICogICAgICAgIERlZmF1bHRzIHRvIHRoZSBjdXJyZW50IGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoZSBsb2NhbC1yZWYuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZShcbiAgICBpbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIHRhZ05hbWU/OiBzdHJpbmcgfCBudWxsLCBhdHRycz86IFRBdHRyaWJ1dGVzIHwgbnVsbCwgbG9jYWxSZWZzPzogc3RyaW5nW10gfCBudWxsLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yPzogTG9jYWxSZWZFeHRyYWN0b3IpIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcblxuICAvLyBUT0RPOiBjb25zaWRlciBhIHNlcGFyYXRlIG5vZGUgdHlwZSBmb3IgdGVtcGxhdGVzXG4gIGNvbnN0IHRDb250YWluZXJOb2RlID0gY29udGFpbmVySW50ZXJuYWwoaW5kZXgsIHRhZ05hbWUgfHwgbnVsbCwgYXR0cnMgfHwgbnVsbCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRDb250YWluZXJOb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgdFZpZXcucGlwZVJlZ2lzdHJ5LCBudWxsKTtcbiAgfVxuXG4gIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHModFZpZXcsIGxWaWV3LCBsb2NhbFJlZnMsIGxvY2FsUmVmRXh0cmFjdG9yKTtcbiAgYWRkVENvbnRhaW5lclRvUXVlcmllcyhsVmlldywgdENvbnRhaW5lck5vZGUpO1xuICBhdHRhY2hQYXRjaERhdGEoZ2V0TmF0aXZlQnlUTm9kZSh0Q29udGFpbmVyTm9kZSwgbFZpZXcpLCBsVmlldyk7XG4gIHJlZ2lzdGVyUG9zdE9yZGVySG9va3ModFZpZXcsIHRDb250YWluZXJOb2RlKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gTENvbnRhaW5lciBmb3IgaW5saW5lIHZpZXdzLCBlLmcuXG4gKlxuICogJSBpZiAoc2hvd2luZykge1xuICogICA8ZGl2PjwvZGl2PlxuICogJSB9XG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXIoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCB0Tm9kZSA9IGNvbnRhaW5lckludGVybmFsKGluZGV4LCBudWxsLCBudWxsKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUudFZpZXdzID0gW107XG4gIH1cbiAgYWRkVENvbnRhaW5lclRvUXVlcmllcyhsVmlldywgdE5vZGUpO1xuICBzZXRJc1BhcmVudChmYWxzZSk7XG59XG5cbmZ1bmN0aW9uIGNvbnRhaW5lckludGVybmFsKFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2NvbnRhaW5lciBub2RlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgY29tbWVudCA9IGxWaWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyQ3JlYXRlQ29tbWVudCsrO1xuICBjb25zdCB0Tm9kZSA9IGNyZWF0ZU5vZGVBdEluZGV4KGluZGV4LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBjb21tZW50LCB0YWdOYW1lLCBhdHRycyk7XG4gIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1thZGp1c3RlZEluZGV4XSA9IGNyZWF0ZUxDb250YWluZXIobFZpZXdbYWRqdXN0ZWRJbmRleF0sIGxWaWV3LCBjb21tZW50KTtcblxuICBhcHBlbmRDaGlsZChjb21tZW50LCB0Tm9kZSwgbFZpZXcpO1xuXG4gIC8vIENvbnRhaW5lcnMgYXJlIGFkZGVkIHRvIHRoZSBjdXJyZW50IHZpZXcgdHJlZSBpbnN0ZWFkIG9mIHRoZWlyIGVtYmVkZGVkIHZpZXdzXG4gIC8vIGJlY2F1c2Ugdmlld3MgY2FuIGJlIHJlbW92ZWQgYW5kIHJlLWluc2VydGVkLlxuICBhZGRUb1ZpZXdUcmVlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQsIGxDb250YWluZXIpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBSZXBvcnRpbmcgYSBUQ29udGFpbmVyIG5vZGUgcXVlcmllcyBpcyBhIDItc3RlcCBwcm9jZXNzIGFzIHdlIG5lZWQgdG86XG4gKiAtIGNoZWNrIGlmIHRoZSBjb250YWluZXIgbm9kZSBpdHNlbGYgaXMgbWF0Y2hpbmcgKHF1ZXJ5IG1pZ2h0IG1hdGNoIGEgPG5nLXRlbXBsYXRlPiBub2RlKTtcbiAqIC0gcHJlcGFyZSByb29tIGZvciBub2RlcyBmcm9tIHZpZXdzIHRoYXQgbWlnaHQgYmUgY3JlYXRlZCBiYXNlZCBvbiB0aGUgVGVtcGxhdGVSZWYgbGlua2VkIHRvIHRoaXNcbiAqIGNvbnRhaW5lci5cbiAqXG4gKiBUaG9zZSAyIG9wZXJhdGlvbnMgbmVlZCB0byBoYXBwZW4gaW4gdGhlIHNwZWNpZmljIG9yZGVyIChtYXRjaCB0aGUgY29udGFpbmVyIG5vZGUgaXRzZWxmLCB0aGVuXG4gKiBwcmVwYXJlIHNwYWNlIGZvciBub2RlcyBmcm9tIHZpZXdzKS5cbiAqL1xuZnVuY3Rpb24gYWRkVENvbnRhaW5lclRvUXVlcmllcyhsVmlldzogTFZpZXcsIHRDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSk6IHZvaWQge1xuICBjb25zdCBxdWVyaWVzID0gbFZpZXdbUVVFUklFU107XG4gIGlmIChxdWVyaWVzKSB7XG4gICAgbFZpZXdbUVVFUklFU10gPSBxdWVyaWVzLmFkZE5vZGUodENvbnRhaW5lck5vZGUpO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Q29udGFpbmVyTm9kZS5pbmRleF07XG4gICAgbENvbnRhaW5lcltRVUVSSUVTXSA9IHF1ZXJpZXMuY29udGFpbmVyKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGEgY29udGFpbmVyIHVwIHRvIHJlY2VpdmUgdmlld3MuXG4gKlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgY29udGFpbmVyIGluIHRoZSBkYXRhIGFycmF5XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb250YWluZXJSZWZyZXNoU3RhcnQoaW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBsZXQgcHJldmlvdXNPclBhcmVudFROb2RlID0gbG9hZEludGVybmFsKHRWaWV3LmRhdGEsIGluZGV4KSBhcyBUTm9kZTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIHNldElzUGFyZW50KHRydWUpO1xuXG4gIGxWaWV3W2luZGV4ICsgSEVBREVSX09GRlNFVF1bQUNUSVZFX0lOREVYXSA9IDA7XG5cbiAgLy8gV2UgbmVlZCB0byBleGVjdXRlIGluaXQgaG9va3MgaGVyZSBzbyBuZ09uSW5pdCBob29rcyBhcmUgY2FsbGVkIGluIHRvcCBsZXZlbCB2aWV3c1xuICAvLyBiZWZvcmUgdGhleSBhcmUgY2FsbGVkIGluIGVtYmVkZGVkIHZpZXdzIChmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkpLlxuICBleGVjdXRlSW5pdEhvb2tzKGxWaWV3LCB0VmlldywgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBlbmQgb2YgdGhlIExDb250YWluZXIuXG4gKlxuICogTWFya2luZyB0aGUgZW5kIG9mIExDb250YWluZXIgaXMgdGhlIHRpbWUgd2hlbiB0byBjaGlsZCB2aWV3cyBnZXQgaW5zZXJ0ZWQgb3IgcmVtb3ZlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbnRhaW5lclJlZnJlc2hFbmQoKTogdm9pZCB7XG4gIGxldCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKGdldElzUGFyZW50KCkpIHtcbiAgICBzZXRJc1BhcmVudChmYWxzZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgVE5vZGVUeXBlLlZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRIYXNQYXJlbnQocHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50ICE7XG4gICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUocHJldmlvdXNPclBhcmVudFROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcblxuICBjb25zdCBsQ29udGFpbmVyID0gZ2V0TFZpZXcoKVtwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdO1xuICBjb25zdCBuZXh0SW5kZXggPSBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF07XG5cbiAgLy8gcmVtb3ZlIGV4dHJhIHZpZXdzIGF0IHRoZSBlbmQgb2YgdGhlIGNvbnRhaW5lclxuICB3aGlsZSAobmV4dEluZGV4IDwgbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgcmVtb3ZlVmlldyhsQ29udGFpbmVyLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVENvbnRhaW5lck5vZGUsIG5leHRJbmRleCk7XG4gIH1cbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBnZXRMVmlld0NoaWxkKGxWaWV3KTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seSBpbnRlcmVzdGVkXG4gICAgLy8gaW4gTENvbnRhaW5lci4gV2UgY2FuIHRlbGwgaXQncyBhbiBMQ29udGFpbmVyIGJlY2F1c2UgaXRzIGxlbmd0aCBpcyBsZXNzIHRoYW4gdGhlIExWaWV3XG4gICAgLy8gaGVhZGVyLlxuICAgIGlmIChjdXJyZW50Lmxlbmd0aCA8IEhFQURFUl9PRkZTRVQgJiYgY3VycmVudFtBQ1RJVkVfSU5ERVhdID09PSAtMSkge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gY3VycmVudCBhcyBMQ29udGFpbmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250YWluZXJbVklFV1NdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGR5bmFtaWNWaWV3RGF0YSA9IGNvbnRhaW5lcltWSUVXU11baV07XG4gICAgICAgIC8vIFRoZSBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmUgbm90IG5lZWRlZCBoZXJlIGFzIGFuIGV4aXN0aW5nIHZpZXcgaXMgb25seSBiZWluZyByZWZyZXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGR5bmFtaWNWaWV3RGF0YVtUVklFV10sICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGR5bmFtaWNWaWV3RGF0YSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogTG9va3MgZm9yIGEgdmlldyB3aXRoIGEgZ2l2ZW4gdmlldyBibG9jayBpZCBpbnNpZGUgYSBwcm92aWRlZCBMQ29udGFpbmVyLlxuICogUmVtb3ZlcyB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgZGVsZXRlZCBpbiB0aGUgcHJvY2Vzcy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciB0byBzZWFyY2ggZm9yIHZpZXdzXG4gKiBAcGFyYW0gdENvbnRhaW5lck5vZGUgdG8gc2VhcmNoIGZvciB2aWV3c1xuICogQHBhcmFtIHN0YXJ0SWR4IHN0YXJ0aW5nIGluZGV4IGluIHRoZSB2aWV3cyBhcnJheSB0byBzZWFyY2ggZnJvbVxuICogQHBhcmFtIHZpZXdCbG9ja0lkIGV4YWN0IHZpZXcgYmxvY2sgaWQgdG8gbG9vayBmb3JcbiAqIEByZXR1cm5zIGluZGV4IG9mIGEgZm91bmQgdmlldyBvciAtMSBpZiBub3QgZm91bmRcbiAqL1xuZnVuY3Rpb24gc2NhbkZvclZpZXcoXG4gICAgbENvbnRhaW5lcjogTENvbnRhaW5lciwgdENvbnRhaW5lck5vZGU6IFRDb250YWluZXJOb2RlLCBzdGFydElkeDogbnVtYmVyLFxuICAgIHZpZXdCbG9ja0lkOiBudW1iZXIpOiBMVmlld3xudWxsIHtcbiAgY29uc3Qgdmlld3MgPSBsQ29udGFpbmVyW1ZJRVdTXTtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0SWR4OyBpIDwgdmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCB2aWV3QXRQb3NpdGlvbklkID0gdmlld3NbaV1bVFZJRVddLmlkO1xuICAgIGlmICh2aWV3QXRQb3NpdGlvbklkID09PSB2aWV3QmxvY2tJZCkge1xuICAgICAgcmV0dXJuIHZpZXdzW2ldO1xuICAgIH0gZWxzZSBpZiAodmlld0F0UG9zaXRpb25JZCA8IHZpZXdCbG9ja0lkKSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgdGhhdCBzaG91bGQgbm90IGJlIGF0IHRoaXMgcG9zaXRpb24gLSByZW1vdmVcbiAgICAgIHJlbW92ZVZpZXcobENvbnRhaW5lciwgdENvbnRhaW5lck5vZGUsIGkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBmb3VuZCBhIHZpZXcgd2l0aCBpZCBncmVhdGVyIHRoYW4gdGhlIG9uZSB3ZSBhcmUgc2VhcmNoaW5nIGZvclxuICAgICAgLy8gd2hpY2ggbWVhbnMgdGhhdCByZXF1aXJlZCB2aWV3IGRvZXNuJ3QgZXhpc3QgYW5kIGNhbid0IGJlIGZvdW5kIGF0XG4gICAgICAvLyBsYXRlciBwb3NpdGlvbnMgaW4gdGhlIHZpZXdzIGFycmF5IC0gc3RvcCB0aGUgc2VhcmNoZGVmLmNvbnQgaGVyZVxuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIE1hcmtzIHRoZSBzdGFydCBvZiBhbiBlbWJlZGRlZCB2aWV3LlxuICpcbiAqIEBwYXJhbSB2aWV3QmxvY2tJZCBUaGUgSUQgb2YgdGhpcyB2aWV3XG4gKiBAcmV0dXJuIGJvb2xlYW4gV2hldGhlciBvciBub3QgdGhpcyB2aWV3IGlzIGluIGNyZWF0aW9uIG1vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld1N0YXJ0KHZpZXdCbG9ja0lkOiBudW1iZXIsIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIpOiBSZW5kZXJGbGFncyB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIC8vIFRoZSBwcmV2aW91cyBub2RlIGNhbiBiZSBhIHZpZXcgbm9kZSBpZiB3ZSBhcmUgcHJvY2Vzc2luZyBhbiBpbmxpbmUgZm9yIGxvb3BcbiAgY29uc3QgY29udGFpbmVyVE5vZGUgPSBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcgP1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudCAhIDpcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZTtcbiAgY29uc3QgbENvbnRhaW5lciA9IGxWaWV3W2NvbnRhaW5lclROb2RlLmluZGV4XSBhcyBMQ29udGFpbmVyO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShjb250YWluZXJUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGxldCB2aWV3VG9SZW5kZXIgPSBzY2FuRm9yVmlldyhcbiAgICAgIGxDb250YWluZXIsIGNvbnRhaW5lclROb2RlIGFzIFRDb250YWluZXJOb2RlLCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgdmlld0Jsb2NrSWQpO1xuXG4gIGlmICh2aWV3VG9SZW5kZXIpIHtcbiAgICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgICBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVFZJRVddLm5vZGUpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdoZW4gd2UgY3JlYXRlIGEgbmV3IExWaWV3LCB3ZSBhbHdheXMgcmVzZXQgdGhlIHN0YXRlIG9mIHRoZSBpbnN0cnVjdGlvbnMuXG4gICAgdmlld1RvUmVuZGVyID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIGxWaWV3LFxuICAgICAgICBnZXRPckNyZWF0ZUVtYmVkZGVkVFZpZXcodmlld0Jsb2NrSWQsIGNvbnN0cywgdmFycywgY29udGFpbmVyVE5vZGUgYXMgVENvbnRhaW5lck5vZGUpLCBudWxsLFxuICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKTtcblxuICAgIGlmIChsQ29udGFpbmVyW1FVRVJJRVNdKSB7XG4gICAgICB2aWV3VG9SZW5kZXJbUVVFUklFU10gPSBsQ29udGFpbmVyW1FVRVJJRVNdICEuY3JlYXRlVmlldygpO1xuICAgIH1cblxuICAgIGNvbnN0IHRQYXJlbnROb2RlID0gZ2V0SXNQYXJlbnQoKSA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gICAgYXNzaWduVFZpZXdOb2RlVG9MVmlldyh2aWV3VG9SZW5kZXJbVFZJRVddLCB0UGFyZW50Tm9kZSwgdmlld0Jsb2NrSWQsIHZpZXdUb1JlbmRlcik7XG4gICAgZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RWSUVXXS5ub2RlKTtcbiAgfVxuICBpZiAobENvbnRhaW5lcikge1xuICAgIGlmIChpc0NyZWF0aW9uTW9kZSh2aWV3VG9SZW5kZXIpKSB7XG4gICAgICAvLyBpdCBpcyBhIG5ldyB2aWV3LCBpbnNlcnQgaXQgaW50byBjb2xsZWN0aW9uIG9mIHZpZXdzIGZvciBhIGdpdmVuIGNvbnRhaW5lclxuICAgICAgaW5zZXJ0Vmlldyh2aWV3VG9SZW5kZXIsIGxDb250YWluZXIsIGxWaWV3LCBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISwgLTEpO1xuICAgIH1cbiAgICBsQ29udGFpbmVyW0FDVElWRV9JTkRFWF0gISsrO1xuICB9XG4gIHJldHVybiBpc0NyZWF0aW9uTW9kZSh2aWV3VG9SZW5kZXIpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIHwgUmVuZGVyRmxhZ3MuVXBkYXRlIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZSB0aGUgVFZpZXcgKGUuZy4gc3RhdGljIGRhdGEpIGZvciB0aGUgYWN0aXZlIGVtYmVkZGVkIHZpZXcuXG4gKlxuICogRWFjaCBlbWJlZGRlZCB2aWV3IGJsb2NrIG11c3QgY3JlYXRlIG9yIHJldHJpZXZlIGl0cyBvd24gVFZpZXcuIE90aGVyd2lzZSwgdGhlIGVtYmVkZGVkIHZpZXcnc1xuICogc3RhdGljIGRhdGEgZm9yIGEgcGFydGljdWxhciBub2RlIHdvdWxkIG92ZXJ3cml0ZSB0aGUgc3RhdGljIGRhdGEgZm9yIGEgbm9kZSBpbiB0aGUgdmlldyBhYm92ZVxuICogaXQgd2l0aCB0aGUgc2FtZSBpbmRleCAoc2luY2UgaXQncyBpbiB0aGUgc2FtZSB0ZW1wbGF0ZSkuXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgaW5kZXggb2YgdGhlIFRWaWV3IGluIFROb2RlLnRWaWV3c1xuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gY29udGFpbmVyIFRoZSBwYXJlbnQgY29udGFpbmVyIGluIHdoaWNoIHRvIGxvb2sgZm9yIHRoZSB2aWV3J3Mgc3RhdGljIGRhdGFcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlRW1iZWRkZWRUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlciwgcGFyZW50OiBUQ29udGFpbmVyTm9kZSk6IFRWaWV3IHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKHBhcmVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IGNvbnRhaW5lclRWaWV3cyA9IHBhcmVudC50Vmlld3MgYXMgVFZpZXdbXTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoY29udGFpbmVyVFZpZXdzLCAnVFZpZXcgZXhwZWN0ZWQnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKEFycmF5LmlzQXJyYXkoY29udGFpbmVyVFZpZXdzKSwgdHJ1ZSwgJ1RWaWV3cyBzaG91bGQgYmUgaW4gYW4gYXJyYXknKTtcbiAgaWYgKHZpZXdJbmRleCA+PSBjb250YWluZXJUVmlld3MubGVuZ3RoIHx8IGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdID09IG51bGwpIHtcbiAgICBjb250YWluZXJUVmlld3Nbdmlld0luZGV4XSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICB2aWV3SW5kZXgsIG51bGwsIGNvbnN0cywgdmFycywgdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIHRWaWV3LnBpcGVSZWdpc3RyeSwgbnVsbCk7XG4gIH1cbiAgcmV0dXJuIGNvbnRhaW5lclRWaWV3c1t2aWV3SW5kZXhdO1xufVxuXG4vKiogTWFya3MgdGhlIGVuZCBvZiBhbiBlbWJlZGRlZCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVtYmVkZGVkVmlld0VuZCgpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB2aWV3SG9zdCA9IGxWaWV3W0hPU1RfTk9ERV07XG5cbiAgaWYgKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSkge1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MobFZpZXcpOyAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgfVxuICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3KTsgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcbiAgbGVhdmVWaWV3KGxWaWV3W1BBUkVOVF0gISk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh2aWV3SG9zdCAhKTtcbiAgc2V0SXNQYXJlbnQoZmFsc2UpO1xufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBhZGp1c3RlZEVsZW1lbnRJbmRleCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2g8VD4oYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgYWRqdXN0ZWRFbGVtZW50SW5kZXgpO1xuICBjb25zdCBob3N0VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGFkanVzdGVkRWxlbWVudEluZGV4LCBsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsVmlld1tUVklFV10uZGF0YVthZGp1c3RlZEVsZW1lbnRJbmRleF0gYXMgVE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcblxuICAvLyBPbmx5IGF0dGFjaGVkIENoZWNrQWx3YXlzIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICh2aWV3QXR0YWNoZWQoaG9zdFZpZXcpICYmIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBzeW5jVmlld1dpdGhCbHVlcHJpbnQoaG9zdFZpZXcpO1xuICAgIGNoZWNrVmlldyhob3N0VmlldywgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXcgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiAzLiBTZWNvbmQgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXcgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VmlldzogTFZpZXcpIHtcbiAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IGNvbXBvbmVudFZpZXcubGVuZ3RoOyBpIDwgY29tcG9uZW50VFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29tcG9uZW50Vmlld1tpXSA9IGNvbXBvbmVudFRWaWV3LmJsdWVwcmludFtpXTtcbiAgfVxufVxuXG4vKiogUmV0dXJucyBhIGJvb2xlYW4gZm9yIHdoZXRoZXIgdGhlIHZpZXcgaXMgYXR0YWNoZWQgKi9cbmV4cG9ydCBmdW5jdGlvbiB2aWV3QXR0YWNoZWQodmlldzogTFZpZXcpOiBib29sZWFuIHtcbiAgcmV0dXJuICh2aWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQXR0YWNoZWQpID09PSBMVmlld0ZsYWdzLkF0dGFjaGVkO1xufVxuXG4vKipcbiAqIEluc3RydWN0aW9uIHRvIGRpc3RyaWJ1dGUgcHJvamVjdGFibGUgbm9kZXMgYW1vbmcgPG5nLWNvbnRlbnQ+IG9jY3VycmVuY2VzIGluIGEgZ2l2ZW4gdGVtcGxhdGUuXG4gKiBJdCB0YWtlcyBhbGwgdGhlIHNlbGVjdG9ycyBmcm9tIHRoZSBlbnRpcmUgY29tcG9uZW50J3MgdGVtcGxhdGUgYW5kIGRlY2lkZXMgd2hlcmVcbiAqIGVhY2ggcHJvamVjdGVkIG5vZGUgYmVsb25ncyAoaXQgcmUtZGlzdHJpYnV0ZXMgbm9kZXMgYW1vbmcgXCJidWNrZXRzXCIgd2hlcmUgZWFjaCBcImJ1Y2tldFwiIGlzXG4gKiBiYWNrZWQgYnkgYSBzZWxlY3RvcikuXG4gKlxuICogVGhpcyBmdW5jdGlvbiByZXF1aXJlcyBDU1Mgc2VsZWN0b3JzIHRvIGJlIHByb3ZpZGVkIGluIDIgZm9ybXM6IHBhcnNlZCAoYnkgYSBjb21waWxlcikgYW5kIHRleHQsXG4gKiB1bi1wYXJzZWQgZm9ybS5cbiAqXG4gKiBUaGUgcGFyc2VkIGZvcm0gaXMgbmVlZGVkIGZvciBlZmZpY2llbnQgbWF0Y2hpbmcgb2YgYSBub2RlIGFnYWluc3QgYSBnaXZlbiBDU1Mgc2VsZWN0b3IuXG4gKiBUaGUgdW4tcGFyc2VkLCB0ZXh0dWFsIGZvcm0gaXMgbmVlZGVkIGZvciBzdXBwb3J0IG9mIHRoZSBuZ1Byb2plY3RBcyBhdHRyaWJ1dGUuXG4gKlxuICogSGF2aW5nIGEgQ1NTIHNlbGVjdG9yIGluIDIgZGlmZmVyZW50IGZvcm1hdHMgaXMgbm90IGlkZWFsLCBidXQgYWx0ZXJuYXRpdmVzIGhhdmUgZXZlbiBtb3JlXG4gKiBkcmF3YmFja3M6XG4gKiAtIGhhdmluZyBvbmx5IGEgdGV4dHVhbCBmb3JtIHdvdWxkIHJlcXVpcmUgcnVudGltZSBwYXJzaW5nIG9mIENTUyBzZWxlY3RvcnM7XG4gKiAtIHdlIGNhbid0IGhhdmUgb25seSBhIHBhcnNlZCBhcyB3ZSBjYW4ndCByZS1jb25zdHJ1Y3QgdGV4dHVhbCBmb3JtIGZyb20gaXQgKGFzIGVudGVyZWQgYnkgYVxuICogdGVtcGxhdGUgYXV0aG9yKS5cbiAqXG4gKiBAcGFyYW0gc2VsZWN0b3JzIEEgY29sbGVjdGlvbiBvZiBwYXJzZWQgQ1NTIHNlbGVjdG9yc1xuICogQHBhcmFtIHJhd1NlbGVjdG9ycyBBIGNvbGxlY3Rpb24gb2YgQ1NTIHNlbGVjdG9ycyBpbiB0aGUgcmF3LCB1bi1wYXJzZWQgZm9ybVxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvamVjdGlvbkRlZihzZWxlY3RvcnM/OiBDc3NTZWxlY3Rvckxpc3RbXSwgdGV4dFNlbGVjdG9ycz86IHN0cmluZ1tdKTogdm9pZCB7XG4gIGNvbnN0IGNvbXBvbmVudE5vZGUgPSBmaW5kQ29tcG9uZW50VmlldyhnZXRMVmlldygpKVtIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcblxuICBpZiAoIWNvbXBvbmVudE5vZGUucHJvamVjdGlvbikge1xuICAgIGNvbnN0IG5vT2ZOb2RlQnVja2V0cyA9IHNlbGVjdG9ycyA/IHNlbGVjdG9ycy5sZW5ndGggKyAxIDogMTtcbiAgICBjb25zdCBwRGF0YTogKFROb2RlIHwgbnVsbClbXSA9IGNvbXBvbmVudE5vZGUucHJvamVjdGlvbiA9XG4gICAgICAgIG5ldyBBcnJheShub09mTm9kZUJ1Y2tldHMpLmZpbGwobnVsbCk7XG4gICAgY29uc3QgdGFpbHM6IChUTm9kZSB8IG51bGwpW10gPSBwRGF0YS5zbGljZSgpO1xuXG4gICAgbGV0IGNvbXBvbmVudENoaWxkOiBUTm9kZXxudWxsID0gY29tcG9uZW50Tm9kZS5jaGlsZDtcblxuICAgIHdoaWxlIChjb21wb25lbnRDaGlsZCAhPT0gbnVsbCkge1xuICAgICAgY29uc3QgYnVja2V0SW5kZXggPVxuICAgICAgICAgIHNlbGVjdG9ycyA/IG1hdGNoaW5nU2VsZWN0b3JJbmRleChjb21wb25lbnRDaGlsZCwgc2VsZWN0b3JzLCB0ZXh0U2VsZWN0b3JzICEpIDogMDtcbiAgICAgIGNvbnN0IG5leHROb2RlID0gY29tcG9uZW50Q2hpbGQubmV4dDtcblxuICAgICAgaWYgKHRhaWxzW2J1Y2tldEluZGV4XSkge1xuICAgICAgICB0YWlsc1tidWNrZXRJbmRleF0gIS5uZXh0ID0gY29tcG9uZW50Q2hpbGQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwRGF0YVtidWNrZXRJbmRleF0gPSBjb21wb25lbnRDaGlsZDtcbiAgICAgIH1cbiAgICAgIGNvbXBvbmVudENoaWxkLm5leHQgPSBudWxsO1xuICAgICAgdGFpbHNbYnVja2V0SW5kZXhdID0gY29tcG9uZW50Q2hpbGQ7XG5cbiAgICAgIGNvbXBvbmVudENoaWxkID0gbmV4dE5vZGU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU3RhY2sgdXNlZCB0byBrZWVwIHRyYWNrIG9mIHByb2plY3Rpb24gbm9kZXMgaW4gcHJvamVjdGlvbigpIGluc3RydWN0aW9uLlxuICpcbiAqIFRoaXMgaXMgZGVsaWJlcmF0ZWx5IGNyZWF0ZWQgb3V0c2lkZSBvZiBwcm9qZWN0aW9uKCkgdG8gYXZvaWQgYWxsb2NhdGluZ1xuICogYSBuZXcgYXJyYXkgZWFjaCB0aW1lIHRoZSBmdW5jdGlvbiBpcyBjYWxsZWQuIEluc3RlYWQgdGhlIGFycmF5IHdpbGwgYmVcbiAqIHJlLXVzZWQgYnkgZWFjaCBpbnZvY2F0aW9uLiBUaGlzIHdvcmtzIGJlY2F1c2UgdGhlIGZ1bmN0aW9uIGlzIG5vdCByZWVudHJhbnQuXG4gKi9cbmNvbnN0IHByb2plY3Rpb25Ob2RlU3RhY2s6IChMVmlldyB8IFROb2RlKVtdID0gW107XG5cbi8qKlxuICogSW5zZXJ0cyBwcmV2aW91c2x5IHJlLWRpc3RyaWJ1dGVkIHByb2plY3RlZCBub2Rlcy4gVGhpcyBpbnN0cnVjdGlvbiBtdXN0IGJlIHByZWNlZGVkIGJ5IGEgY2FsbFxuICogdG8gdGhlIHByb2plY3Rpb25EZWYgaW5zdHJ1Y3Rpb24uXG4gKlxuICogQHBhcmFtIG5vZGVJbmRleFxuICogQHBhcmFtIHNlbGVjdG9ySW5kZXg6XG4gKiAgICAgICAgLSAwIHdoZW4gdGhlIHNlbGVjdG9yIGlzIGAqYCAob3IgdW5zcGVjaWZpZWQgYXMgdGhpcyBpcyB0aGUgZGVmYXVsdCB2YWx1ZSksXG4gKiAgICAgICAgLSAxIGJhc2VkIGluZGV4IG9mIHRoZSBzZWxlY3RvciBmcm9tIHRoZSB7QGxpbmsgcHJvamVjdGlvbkRlZn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2plY3Rpb24obm9kZUluZGV4OiBudW1iZXIsIHNlbGVjdG9ySW5kZXg6IG51bWJlciA9IDAsIGF0dHJzPzogc3RyaW5nW10pOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0UHJvamVjdGlvbk5vZGUgPVxuICAgICAgY3JlYXRlTm9kZUF0SW5kZXgobm9kZUluZGV4LCBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbnVsbCwgbnVsbCwgYXR0cnMgfHwgbnVsbCk7XG5cbiAgLy8gV2UgY2FuJ3QgdXNlIHZpZXdEYXRhW0hPU1RfTk9ERV0gYmVjYXVzZSBwcm9qZWN0aW9uIG5vZGVzIGNhbiBiZSBuZXN0ZWQgaW4gZW1iZWRkZWQgdmlld3MuXG4gIGlmICh0UHJvamVjdGlvbk5vZGUucHJvamVjdGlvbiA9PT0gbnVsbCkgdFByb2plY3Rpb25Ob2RlLnByb2plY3Rpb24gPSBzZWxlY3RvckluZGV4O1xuXG4gIC8vIGA8bmctY29udGVudD5gIGhhcyBubyBjb250ZW50XG4gIHNldElzUGFyZW50KGZhbHNlKTtcblxuICAvLyByZS1kaXN0cmlidXRpb24gb2YgcHJvamVjdGFibGUgbm9kZXMgaXMgc3RvcmVkIG9uIGEgY29tcG9uZW50J3MgdmlldyBsZXZlbFxuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcobFZpZXcpO1xuICBjb25zdCBjb21wb25lbnROb2RlID0gY29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgbGV0IG5vZGVUb1Byb2plY3QgPSAoY29tcG9uZW50Tm9kZS5wcm9qZWN0aW9uIGFzKFROb2RlIHwgbnVsbClbXSlbc2VsZWN0b3JJbmRleF07XG4gIGxldCBwcm9qZWN0ZWRWaWV3ID0gY29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gIGxldCBwcm9qZWN0aW9uTm9kZUluZGV4ID0gLTE7XG5cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZVRvUHJvamVjdCkpIHtcbiAgICBhcHBlbmRDaGlsZChub2RlVG9Qcm9qZWN0LCB0UHJvamVjdGlvbk5vZGUsIGxWaWV3KTtcbiAgfSBlbHNlIHtcbiAgICB3aGlsZSAobm9kZVRvUHJvamVjdCkge1xuICAgICAgaWYgKG5vZGVUb1Byb2plY3QudHlwZSA9PT0gVE5vZGVUeXBlLlByb2plY3Rpb24pIHtcbiAgICAgICAgLy8gVGhpcyBub2RlIGlzIHJlLXByb2plY3RlZCwgc28gd2UgbXVzdCBnbyB1cCB0aGUgdHJlZSB0byBnZXQgaXRzIHByb2plY3RlZCBub2Rlcy5cbiAgICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudFZpZXcgPSBmaW5kQ29tcG9uZW50Vmlldyhwcm9qZWN0ZWRWaWV3KTtcbiAgICAgICAgY29uc3QgY3VycmVudENvbXBvbmVudEhvc3QgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tIT1NUX05PREVdIGFzIFRFbGVtZW50Tm9kZTtcbiAgICAgICAgY29uc3QgZmlyc3RQcm9qZWN0ZWROb2RlID0gKGN1cnJlbnRDb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoXG4gICAgICAgICAgICBUTm9kZSB8IG51bGwpW10pW25vZGVUb1Byb2plY3QucHJvamVjdGlvbiBhcyBudW1iZXJdO1xuXG4gICAgICAgIGlmIChmaXJzdFByb2plY3RlZE5vZGUpIHtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShmaXJzdFByb2plY3RlZE5vZGUpKSB7XG4gICAgICAgICAgICBhcHBlbmRDaGlsZChmaXJzdFByb2plY3RlZE5vZGUsIHRQcm9qZWN0aW9uTm9kZSwgbFZpZXcpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBwcm9qZWN0aW9uTm9kZVN0YWNrWysrcHJvamVjdGlvbk5vZGVJbmRleF0gPSBub2RlVG9Qcm9qZWN0O1xuICAgICAgICAgICAgcHJvamVjdGlvbk5vZGVTdGFja1srK3Byb2plY3Rpb25Ob2RlSW5kZXhdID0gcHJvamVjdGVkVmlldztcblxuICAgICAgICAgICAgbm9kZVRvUHJvamVjdCA9IGZpcnN0UHJvamVjdGVkTm9kZTtcbiAgICAgICAgICAgIHByb2plY3RlZFZpZXcgPSBjdXJyZW50Q29tcG9uZW50Vmlld1tQQVJFTlRdICE7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFRoaXMgZmxhZyBtdXN0IGJlIHNldCBub3cgb3Igd2Ugd29uJ3Qga25vdyB0aGF0IHRoaXMgbm9kZSBpcyBwcm9qZWN0ZWRcbiAgICAgICAgLy8gaWYgdGhlIG5vZGVzIGFyZSBpbnNlcnRlZCBpbnRvIGEgY29udGFpbmVyIGxhdGVyLlxuICAgICAgICBub2RlVG9Qcm9qZWN0LmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNQcm9qZWN0ZWQ7XG4gICAgICAgIGFwcGVuZFByb2plY3RlZE5vZGUobm9kZVRvUHJvamVjdCwgdFByb2plY3Rpb25Ob2RlLCBsVmlldywgcHJvamVjdGVkVmlldyk7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlIGFyZSBmaW5pc2hlZCB3aXRoIGEgbGlzdCBvZiByZS1wcm9qZWN0ZWQgbm9kZXMsIHdlIG5lZWQgdG8gZ2V0XG4gICAgICAvLyBiYWNrIHRvIHRoZSByb290IHByb2plY3Rpb24gbm9kZSB0aGF0IHdhcyByZS1wcm9qZWN0ZWQuXG4gICAgICBpZiAobm9kZVRvUHJvamVjdC5uZXh0ID09PSBudWxsICYmIHByb2plY3RlZFZpZXcgIT09IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhKSB7XG4gICAgICAgIHByb2plY3RlZFZpZXcgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgTFZpZXc7XG4gICAgICAgIG5vZGVUb1Byb2plY3QgPSBwcm9qZWN0aW9uTm9kZVN0YWNrW3Byb2plY3Rpb25Ob2RlSW5kZXgtLV0gYXMgVE5vZGU7XG4gICAgICB9XG4gICAgICBub2RlVG9Qcm9qZWN0ID0gbm9kZVRvUHJvamVjdC5uZXh0O1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gc3RhdGUgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KFxuICAgIGxWaWV3OiBMVmlldywgYWRqdXN0ZWRIb3N0SW5kZXg6IG51bWJlciwgc3RhdGU6IFQpOiBUIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGlmIChsVmlld1tUQUlMXSkge1xuICAgIGxWaWV3W1RBSUxdICFbTkVYVF0gPSBzdGF0ZTtcbiAgfSBlbHNlIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3LmNoaWxkSW5kZXggPSBhZGp1c3RlZEhvc3RJbmRleDtcbiAgfVxuICBsVmlld1tUQUlMXSA9IHN0YXRlO1xuICByZXR1cm4gc3RhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuLyoqIFdyYXBzIGFuIGV2ZW50IGxpc3RlbmVyIHdpdGggcHJldmVudERlZmF1bHQgYmVoYXZpb3IuICovXG5mdW5jdGlvbiB3cmFwTGlzdGVuZXJXaXRoUHJldmVudERlZmF1bHQobGlzdGVuZXJGbjogKGU/OiBhbnkpID0+IGFueSk6IEV2ZW50TGlzdGVuZXIge1xuICByZXR1cm4gZnVuY3Rpb24gd3JhcExpc3RlbmVySW5fcHJldmVudERlZmF1bHQoZTogRXZlbnQpIHtcbiAgICBpZiAobGlzdGVuZXJGbihlKSA9PT0gZmFsc2UpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgbGVnYWN5IGJyb3dzZXJzIHRoYXQgZG9uJ3Qgc3VwcG9ydCBwcmV2ZW50RGVmYXVsdCAoZS5nLiBJRSlcbiAgICAgIGUucmV0dXJuVmFsdWUgPSBmYWxzZTtcbiAgICB9XG4gIH07XG59XG5cbi8qKlxuICogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5LlxuICpcbiAqIFJldHVybnMgdGhlIHJvb3QgdmlldyBiZWNhdXNlIGl0IGlzIGZvdW5kIGFzIGEgYnlwcm9kdWN0IG9mIG1hcmtpbmcgdGhlIHZpZXcgdHJlZVxuICogZGlydHksIGFuZCBjYW4gYmUgdXNlZCBieSBtZXRob2RzIHRoYXQgY29uc3VtZSBtYXJrVmlld0RpcnR5KCkgdG8gZWFzaWx5IHNjaGVkdWxlXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uLiBPdGhlcndpc2UsIHN1Y2ggbWV0aG9kcyB3b3VsZCBuZWVkIHRvIHRyYXZlcnNlIHVwIHRoZSB2aWV3IHRyZWVcbiAqIGFuIGFkZGl0aW9uYWwgdGltZSB0byBnZXQgdGhlIHJvb3QgdmlldyBhbmQgc2NoZWR1bGUgYSB0aWNrIG9uIGl0LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgc3RhcnRpbmcgTFZpZXcgdG8gbWFyayBkaXJ0eVxuICogQHJldHVybnMgdGhlIHJvb3QgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkobFZpZXc6IExWaWV3KTogTFZpZXcge1xuICB3aGlsZSAobFZpZXcgJiYgIShsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBsVmlldyA9IGxWaWV3W1BBUkVOVF0gITtcbiAgfVxuICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrPFQ+KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCwgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3MpIHtcbiAgY29uc3Qgbm90aGluZ1NjaGVkdWxlZCA9IHJvb3RDb250ZXh0LmZsYWdzID09PSBSb290Q29udGV4dEZsYWdzLkVtcHR5O1xuICByb290Q29udGV4dC5mbGFncyB8PSBmbGFncztcblxuICBpZiAobm90aGluZ1NjaGVkdWxlZCAmJiByb290Q29udGV4dC5jbGVhbiA9PSBfQ0xFQU5fUFJPTUlTRSkge1xuICAgIGxldCByZXM6IG51bGx8KCh2YWw6IG51bGwpID0+IHZvaWQpO1xuICAgIHJvb3RDb250ZXh0LmNsZWFuID0gbmV3IFByb21pc2U8bnVsbD4oKHIpID0+IHJlcyA9IHIpO1xuICAgIHJvb3RDb250ZXh0LnNjaGVkdWxlcigoKSA9PiB7XG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcztcbiAgICAgICAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzO1xuICAgICAgICBjb25zdCBwbGF5ZXJIYW5kbGVyID0gcm9vdENvbnRleHQucGxheWVySGFuZGxlcjtcbiAgICAgICAgaWYgKHBsYXllckhhbmRsZXIpIHtcbiAgICAgICAgICBwbGF5ZXJIYW5kbGVyLmZsdXNoUGxheWVycygpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgICByZXMgIShudWxsKTtcbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIFVzZWQgdG8gcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gYGRldGVjdENoYW5nZXNgLCBidXQgaW52b2tlZCBvbiByb290IGNvbXBvbmVudC4gQWRkaXRpb25hbGx5LCBgdGlja2BcbiAqIGV4ZWN1dGVzIGxpZmVjeWNsZSBob29rcyBhbmQgY29uZGl0aW9uYWxseSBjaGVja3MgY29tcG9uZW50cyBiYXNlZCBvbiB0aGVpclxuICogYENoYW5nZURldGVjdGlvblN0cmF0ZWd5YCBhbmQgZGlydGluZXNzLlxuICpcbiAqIFRoZSBwcmVmZXJyZWQgd2F5IHRvIHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbiBpcyB0byBjYWxsIGBtYXJrRGlydHlgLiBgbWFya0RpcnR5YCBpbnRlcm5hbGx5XG4gKiBzY2hlZHVsZXMgYHRpY2tgIHVzaW5nIGEgc2NoZWR1bGVyIGluIG9yZGVyIHRvIGNvYWxlc2NlIG11bHRpcGxlIGBtYXJrRGlydHlgIGNhbGxzIGludG8gYVxuICogc2luZ2xlIGNoYW5nZSBkZXRlY3Rpb24gcnVuLiBCeSBkZWZhdWx0LCB0aGUgc2NoZWR1bGVyIGlzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgLCBidXQgY2FuXG4gKiBiZSBjaGFuZ2VkIHdoZW4gY2FsbGluZyBgcmVuZGVyQ29tcG9uZW50YCBhbmQgcHJvdmlkaW5nIHRoZSBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0aWNrPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCByb290VmlldyA9IGdldFJvb3RWaWV3KGNvbXBvbmVudCk7XG4gIGNvbnN0IHJvb3RDb250ZXh0ID0gcm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQ7XG4gIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG59XG5cbmZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShyZWFkUGF0Y2hlZExWaWV3KHJvb3RDb21wb25lbnQpICEsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSBjb21wb25lbnQgKGFuZCBwb3NzaWJseSBpdHMgc3ViLWNvbXBvbmVudHMpLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gdHJpZ2dlcnMgY2hhbmdlIGRldGVjdGlvbiBpbiBhIHN5bmNocm9ub3VzIHdheSBvbiBhIGNvbXBvbmVudC4gVGhlcmUgc2hvdWxkXG4gKiBiZSB2ZXJ5IGxpdHRsZSByZWFzb24gdG8gY2FsbCB0aGlzIGZ1bmN0aW9uIGRpcmVjdGx5IHNpbmNlIGEgcHJlZmVycmVkIHdheSB0byBkbyBjaGFuZ2VcbiAqIGRldGVjdGlvbiBpcyB0byB7QGxpbmsgbWFya0RpcnR5fSB0aGUgY29tcG9uZW50IGFuZCB3YWl0IGZvciB0aGUgc2NoZWR1bGVyIHRvIGNhbGwgdGhpcyBtZXRob2RcbiAqIGF0IHNvbWUgZnV0dXJlIHBvaW50IGluIHRpbWUuIFRoaXMgaXMgYmVjYXVzZSBhIHNpbmdsZSB1c2VyIGFjdGlvbiBvZnRlbiByZXN1bHRzIGluIG1hbnlcbiAqIGNvbXBvbmVudHMgYmVpbmcgaW52YWxpZGF0ZWQgYW5kIGNhbGxpbmcgY2hhbmdlIGRldGVjdGlvbiBvbiBlYWNoIGNvbXBvbmVudCBzeW5jaHJvbm91c2x5XG4gKiB3b3VsZCBiZSBpbmVmZmljaWVudC4gSXQgaXMgYmV0dGVyIHRvIHdhaXQgdW50aWwgYWxsIGNvbXBvbmVudHMgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmRcbiAqIHRoZW4gcGVyZm9ybSBzaW5nbGUgY2hhbmdlIGRldGVjdGlvbiBhY3Jvc3MgYWxsIG9mIHRoZSBjb21wb25lbnRzXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBUaGUgY29tcG9uZW50IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KSAhO1xuICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldywgY29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSB2aWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuXG4gIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gIGlmIChpc0NyZWF0aW9uTW9kZSh2aWV3KSkge1xuICAgIGNoZWNrVmlldyh2aWV3LCBjb250ZXh0KTsgIC8vIGNyZWF0aW9uIG1vZGUgcGFzc1xuICB9XG4gIGNoZWNrVmlldyh2aWV3LCBjb250ZXh0KTsgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcblxuICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzKGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKiogQ2hlY2tzIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgcHJvdmlkZWQuIERvZXMgbm90IGdhdGUgb24gZGlydHkgY2hlY2tzIG9yIGV4ZWN1dGUgZG9DaGVjay4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1ZpZXc8VD4oaG9zdFZpZXc6IExWaWV3LCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tIT1NUX05PREVdKTtcbiAgY29uc3QgdGVtcGxhdGVGbiA9IGhvc3RUVmlldy50ZW1wbGF0ZSAhO1xuICBjb25zdCBjcmVhdGlvbk1vZGUgPSBpc0NyZWF0aW9uTW9kZShob3N0Vmlldyk7XG5cbiAgdHJ5IHtcbiAgICBuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRpb25Nb2RlICYmIGV4ZWN1dGVWaWV3UXVlcnlGbihob3N0VmlldywgaG9zdFRWaWV3LCBjb21wb25lbnQpO1xuICAgIHRlbXBsYXRlRm4oZ2V0UmVuZGVyRmxhZ3MoaG9zdFZpZXcpLCBjb21wb25lbnQpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICAgICFjcmVhdGlvbk1vZGUgJiYgZXhlY3V0ZVZpZXdRdWVyeUZuKGhvc3RWaWV3LCBob3N0VFZpZXcsIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgaWYgKHZpZXdRdWVyeSkge1xuICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KHRWaWV3LnZpZXdRdWVyeVN0YXJ0SW5kZXgpO1xuICAgIHZpZXdRdWVyeShnZXRSZW5kZXJGbGFncyhsVmlldyksIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vKipcbiAqIE1hcmsgdGhlIGNvbXBvbmVudCBhcyBkaXJ0eSAobmVlZGluZyBjaGFuZ2UgZGV0ZWN0aW9uKS5cbiAqXG4gKiBNYXJraW5nIGEgY29tcG9uZW50IGRpcnR5IHdpbGwgc2NoZWR1bGUgYSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoaXNcbiAqIGNvbXBvbmVudCBhdCBzb21lIHBvaW50IGluIHRoZSBmdXR1cmUuIE1hcmtpbmcgYW4gYWxyZWFkeSBkaXJ0eVxuICogY29tcG9uZW50IGFzIGRpcnR5IGlzIGEgbm9vcC4gT25seSBvbmUgb3V0c3RhbmRpbmcgY2hhbmdlIGRldGVjdGlvblxuICogY2FuIGJlIHNjaGVkdWxlZCBwZXIgY29tcG9uZW50IHRyZWUuIChUd28gY29tcG9uZW50cyBib290c3RyYXBwZWQgd2l0aFxuICogc2VwYXJhdGUgYHJlbmRlckNvbXBvbmVudGAgd2lsbCBoYXZlIHNlcGFyYXRlIHNjaGVkdWxlcnMpXG4gKlxuICogV2hlbiB0aGUgcm9vdCBjb21wb25lbnQgaXMgYm9vdHN0cmFwcGVkIHdpdGggYHJlbmRlckNvbXBvbmVudGAsIGEgc2NoZWR1bGVyXG4gKiBjYW4gYmUgcHJvdmlkZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudCBDb21wb25lbnQgdG8gbWFyayBhcyBkaXJ0eS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHk8VD4oY29tcG9uZW50OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGNvbXBvbmVudCwgJ2NvbXBvbmVudCcpO1xuICBjb25zdCByb290VmlldyA9IG1hcmtWaWV3RGlydHkoZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KSk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocm9vdFZpZXdbQ09OVEVYVF0sICdyb290Q29udGV4dCBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICBzY2hlZHVsZVRpY2socm9vdFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcyk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBzaW5nbGUgdmFsdWUgYmluZGluZy5cbiAqXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gZGlmZlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmluZDxUPih2YWx1ZTogVCk6IFR8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXSsrO1xuICBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldyk7XG4gIHJldHVybiBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4LCB2YWx1ZSkgPyB2YWx1ZSA6IE5PX0NIQU5HRTtcbn1cblxuLyoqXG4gKiBBbGxvY2F0ZXMgdGhlIG5lY2Vzc2FyeSBhbW91bnQgb2Ygc2xvdHMgZm9yIGhvc3QgdmFycy5cbiAqXG4gKiBAcGFyYW0gY291bnQgQW1vdW50IG9mIHZhcnMgdG8gYmUgYWxsb2NhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0hvc3RWYXJzKGNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKCF0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykgcmV0dXJuO1xuICBxdWV1ZUhvc3RCaW5kaW5nRm9yQ2hlY2sodFZpZXcsIGdldEN1cnJlbnREaXJlY3RpdmVEZWYoKSAhLCBjb3VudCk7XG4gIHByZWZpbGxIb3N0VmFycyh0VmlldywgbFZpZXcsIGNvdW50KTtcbn1cblxuLyoqXG4gKiBDcmVhdGUgaW50ZXJwb2xhdGlvbiBiaW5kaW5ncyB3aXRoIGEgdmFyaWFibGUgbnVtYmVyIG9mIGV4cHJlc3Npb25zLlxuICpcbiAqIElmIHRoZXJlIGFyZSAxIHRvIDggZXhwcmVzc2lvbnMgYGludGVycG9sYXRpb24xKClgIHRvIGBpbnRlcnBvbGF0aW9uOCgpYCBzaG91bGQgYmUgdXNlZCBpbnN0ZWFkLlxuICogVGhvc2UgYXJlIGZhc3RlciBiZWNhdXNlIHRoZXJlIGlzIG5vIG5lZWQgdG8gY3JlYXRlIGFuIGFycmF5IG9mIGV4cHJlc3Npb25zIGFuZCBpdGVyYXRlIG92ZXIgaXQuXG4gKlxuICogYHZhbHVlc2A6XG4gKiAtIGhhcyBzdGF0aWMgdGV4dCBhdCBldmVuIGluZGV4ZXMsXG4gKiAtIGhhcyBldmFsdWF0ZWQgZXhwcmVzc2lvbnMgYXQgb2RkIGluZGV4ZXMuXG4gKlxuICogUmV0dXJucyB0aGUgY29uY2F0ZW5hdGVkIHN0cmluZyB3aGVuIGFueSBvZiB0aGUgYXJndW1lbnRzIGNoYW5nZXMsIGBOT19DSEFOR0VgIG90aGVyd2lzZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb25WKHZhbHVlczogYW55W10pOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExlc3NUaGFuKDIsIHZhbHVlcy5sZW5ndGgsICdzaG91bGQgaGF2ZSBhdCBsZWFzdCAzIHZhbHVlcycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodmFsdWVzLmxlbmd0aCAlIDIsIDEsICdzaG91bGQgaGF2ZSBhbiBvZGQgbnVtYmVyIG9mIHZhbHVlcycpO1xuICBsZXQgZGlmZmVyZW50ID0gZmFsc2U7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgbGV0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuXG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXhdID09IG51bGwpIHtcbiAgICAvLyAyIGlzIHRoZSBpbmRleCBvZiB0aGUgZmlyc3Qgc3RhdGljIGludGVyc3RpdGlhbCB2YWx1ZSAoaWUuIG5vdCBwcmVmaXgpXG4gICAgZm9yIChsZXQgaSA9IDI7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleCsrXSA9IHZhbHVlc1tpXTtcbiAgICB9XG4gICAgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIH1cblxuICBmb3IgKGxldCBpID0gMTsgaSA8IHZhbHVlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgIC8vIENoZWNrIGlmIGJpbmRpbmdzIChvZGQgaW5kZXhlcykgaGF2ZSBjaGFuZ2VkXG4gICAgYmluZGluZ1VwZGF0ZWQobFZpZXcsIGJpbmRpbmdJbmRleCsrLCB2YWx1ZXNbaV0pICYmIChkaWZmZXJlbnQgPSB0cnVlKTtcbiAgfVxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdJbmRleDtcbiAgc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHZhbHVlc1swXSwgdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSAxXSk7XG5cbiAgaWYgKCFkaWZmZXJlbnQpIHtcbiAgICByZXR1cm4gTk9fQ0hBTkdFO1xuICB9XG5cbiAgLy8gQnVpbGQgdGhlIHVwZGF0ZWQgY29udGVudFxuICBsZXQgY29udGVudCA9IHZhbHVlc1swXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICBjb250ZW50ICs9IHJlbmRlclN0cmluZ2lmeSh2YWx1ZXNbaV0pICsgdmFsdWVzW2kgKyAxXTtcbiAgfVxuXG4gIHJldHVybiBjb250ZW50O1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMSBleHByZXNzaW9uLlxuICpcbiAqIEBwYXJhbSBwcmVmaXggc3RhdGljIHZhbHVlIHVzZWQgZm9yIGNvbmNhdGVuYXRpb24gb25seS5cbiAqIEBwYXJhbSB2MCB2YWx1ZSBjaGVja2VkIGZvciBjaGFuZ2UuXG4gKiBAcGFyYW0gc3VmZml4IHN0YXRpYyB2YWx1ZSB1c2VkIGZvciBjb25jYXRlbmF0aW9uIG9ubHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMShwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgbFZpZXdbQklORElOR19JTkRFWF0rKywgdjApO1xuICBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICByZXR1cm4gZGlmZmVyZW50ID8gcHJlZml4ICsgcmVuZGVyU3RyaW5naWZ5KHYwKSArIHN1ZmZpeCA6IE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggMiBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uMihcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQyKGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSk7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDI7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGxWaWV3W1RWSUVXXS5kYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgfVxuXG4gIHJldHVybiBkaWZmZXJlbnQgPyBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgc3VmZml4IDogTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCAzIGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb24zKFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBzdWZmaXg6IHN0cmluZyk6IHN0cmluZ3xcbiAgICBOT19DSEFOR0Uge1xuICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gIGNvbnN0IGJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdO1xuICBjb25zdCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDMobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2Mik7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDM7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDQgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjQoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgY29uc3QgZGlmZmVyZW50ID0gYmluZGluZ1VwZGF0ZWQ0KGxWaWV3LCBiaW5kaW5nSW5kZXgsIHYwLCB2MSwgdjIsIHYzKTtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNDtcblxuICAvLyBPbmx5IHNldCBzdGF0aWMgc3RyaW5ncyB0aGUgZmlyc3QgdGltZSAoZGF0YSB3aWxsIGJlIG51bGwgc3Vic2VxdWVudCBydW5zKS5cbiAgY29uc3QgZGF0YSA9IHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCBwcmVmaXgsIHN1ZmZpeCk7XG4gIGlmIChkYXRhKSB7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMV0gPSBpMTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAyXSA9IGkyO1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBzdWZmaXggOlxuICAgICAgTk9fQ0hBTkdFO1xufVxuXG4vKiogQ3JlYXRlcyBhbiBpbnRlcnBvbGF0aW9uIGJpbmRpbmcgd2l0aCA1IGV4cHJlc3Npb25zLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludGVycG9sYXRpb241KFxuICAgIHByZWZpeDogc3RyaW5nLCB2MDogYW55LCBpMDogc3RyaW5nLCB2MTogYW55LCBpMTogc3RyaW5nLCB2MjogYW55LCBpMjogc3RyaW5nLCB2MzogYW55LFxuICAgIGkzOiBzdHJpbmcsIHY0OiBhbnksIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZChsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQpIHx8IGRpZmZlcmVudDtcbiAgbFZpZXdbQklORElOR19JTkRFWF0gKz0gNTtcblxuICAvLyBPbmx5IHNldCBzdGF0aWMgc3RyaW5ncyB0aGUgZmlyc3QgdGltZSAoZGF0YSB3aWxsIGJlIG51bGwgc3Vic2VxdWVudCBydW5zKS5cbiAgY29uc3QgZGF0YSA9IHN0b3JlQmluZGluZ01ldGFkYXRhKGxWaWV3LCBwcmVmaXgsIHN1ZmZpeCk7XG4gIGlmIChkYXRhKSB7XG4gICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gaTA7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMV0gPSBpMTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAyXSA9IGkyO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDNdID0gaTM7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDYgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjYoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8Tk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMihsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDY7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAzXSA9IGkzO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDRdID0gaTQ7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKiBDcmVhdGVzIGFuIGludGVycG9sYXRpb24gYmluZGluZyB3aXRoIDcgZXhwcmVzc2lvbnMuICovXG5leHBvcnQgZnVuY3Rpb24gaW50ZXJwb2xhdGlvbjcoXG4gICAgcHJlZml4OiBzdHJpbmcsIHYwOiBhbnksIGkwOiBzdHJpbmcsIHYxOiBhbnksIGkxOiBzdHJpbmcsIHYyOiBhbnksIGkyOiBzdHJpbmcsIHYzOiBhbnksXG4gICAgaTM6IHN0cmluZywgdjQ6IGFueSwgaTQ6IHN0cmluZywgdjU6IGFueSwgaTU6IHN0cmluZywgdjY6IGFueSwgc3VmZml4OiBzdHJpbmcpOiBzdHJpbmd8XG4gICAgTk9fQ0hBTkdFIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBiaW5kaW5nSW5kZXggPSBsVmlld1tCSU5ESU5HX0lOREVYXTtcbiAgbGV0IGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkNChsVmlldywgYmluZGluZ0luZGV4LCB2MCwgdjEsIHYyLCB2Myk7XG4gIGRpZmZlcmVudCA9IGJpbmRpbmdVcGRhdGVkMyhsVmlldywgYmluZGluZ0luZGV4ICsgNCwgdjQsIHY1LCB2NikgfHwgZGlmZmVyZW50O1xuICBsVmlld1tCSU5ESU5HX0lOREVYXSArPSA3O1xuXG4gIC8vIE9ubHkgc2V0IHN0YXRpYyBzdHJpbmdzIHRoZSBmaXJzdCB0aW1lIChkYXRhIHdpbGwgYmUgbnVsbCBzdWJzZXF1ZW50IHJ1bnMpLlxuICBjb25zdCBkYXRhID0gc3RvcmVCaW5kaW5nTWV0YWRhdGEobFZpZXcsIHByZWZpeCwgc3VmZml4KTtcbiAgaWYgKGRhdGEpIHtcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBpMDtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAxXSA9IGkxO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDJdID0gaTI7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgM10gPSBpMztcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA0XSA9IGk0O1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDVdID0gaTU7XG4gIH1cblxuICByZXR1cm4gZGlmZmVyZW50ID9cbiAgICAgIHByZWZpeCArIHJlbmRlclN0cmluZ2lmeSh2MCkgKyBpMCArIHJlbmRlclN0cmluZ2lmeSh2MSkgKyBpMSArIHJlbmRlclN0cmluZ2lmeSh2MikgKyBpMiArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHYzKSArIGkzICsgcmVuZGVyU3RyaW5naWZ5KHY0KSArIGk0ICsgcmVuZGVyU3RyaW5naWZ5KHY1KSArIGk1ICtcbiAgICAgICAgICByZW5kZXJTdHJpbmdpZnkodjYpICsgc3VmZml4IDpcbiAgICAgIE5PX0NIQU5HRTtcbn1cblxuLyoqIENyZWF0ZXMgYW4gaW50ZXJwb2xhdGlvbiBiaW5kaW5nIHdpdGggOCBleHByZXNzaW9ucy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnRlcnBvbGF0aW9uOChcbiAgICBwcmVmaXg6IHN0cmluZywgdjA6IGFueSwgaTA6IHN0cmluZywgdjE6IGFueSwgaTE6IHN0cmluZywgdjI6IGFueSwgaTI6IHN0cmluZywgdjM6IGFueSxcbiAgICBpMzogc3RyaW5nLCB2NDogYW55LCBpNDogc3RyaW5nLCB2NTogYW55LCBpNTogc3RyaW5nLCB2NjogYW55LCBpNjogc3RyaW5nLCB2NzogYW55LFxuICAgIHN1ZmZpeDogc3RyaW5nKTogc3RyaW5nfE5PX0NIQU5HRSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgYmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF07XG4gIGxldCBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCwgdjAsIHYxLCB2MiwgdjMpO1xuICBkaWZmZXJlbnQgPSBiaW5kaW5nVXBkYXRlZDQobFZpZXcsIGJpbmRpbmdJbmRleCArIDQsIHY0LCB2NSwgdjYsIHY3KSB8fCBkaWZmZXJlbnQ7XG4gIGxWaWV3W0JJTkRJTkdfSU5ERVhdICs9IDg7XG5cbiAgLy8gT25seSBzZXQgc3RhdGljIHN0cmluZ3MgdGhlIGZpcnN0IHRpbWUgKGRhdGEgd2lsbCBiZSBudWxsIHN1YnNlcXVlbnQgcnVucykuXG4gIGNvbnN0IGRhdGEgPSBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldywgcHJlZml4LCBzdWZmaXgpO1xuICBpZiAoZGF0YSkge1xuICAgIGNvbnN0IHREYXRhID0gbFZpZXdbVFZJRVddLmRhdGE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGkwO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDFdID0gaTE7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgMl0gPSBpMjtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyAzXSA9IGkzO1xuICAgIHREYXRhW2JpbmRpbmdJbmRleCArIDRdID0gaTQ7XG4gICAgdERhdGFbYmluZGluZ0luZGV4ICsgNV0gPSBpNTtcbiAgICB0RGF0YVtiaW5kaW5nSW5kZXggKyA2XSA9IGk2O1xuICB9XG5cbiAgcmV0dXJuIGRpZmZlcmVudCA/XG4gICAgICBwcmVmaXggKyByZW5kZXJTdHJpbmdpZnkodjApICsgaTAgKyByZW5kZXJTdHJpbmdpZnkodjEpICsgaTEgKyByZW5kZXJTdHJpbmdpZnkodjIpICsgaTIgK1xuICAgICAgICAgIHJlbmRlclN0cmluZ2lmeSh2MykgKyBpMyArIHJlbmRlclN0cmluZ2lmeSh2NCkgKyBpNCArIHJlbmRlclN0cmluZ2lmeSh2NSkgKyBpNSArXG4gICAgICAgICAgcmVuZGVyU3RyaW5naWZ5KHY2KSArIGk2ICsgcmVuZGVyU3RyaW5naWZ5KHY3KSArIHN1ZmZpeCA6XG4gICAgICBOT19DSEFOR0U7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBiaW5kaW5nIG1ldGFkYXRhIGZvciBhIHBhcnRpY3VsYXIgYmluZGluZyBhbmQgc3RvcmVzIGl0IGluXG4gKiBUVmlldy5kYXRhLiBUaGVzZSBhcmUgZ2VuZXJhdGVkIGluIG9yZGVyIHRvIHN1cHBvcnQgRGVidWdFbGVtZW50LnByb3BlcnRpZXMuXG4gKlxuICogRWFjaCBiaW5kaW5nIC8gaW50ZXJwb2xhdGlvbiB3aWxsIGhhdmUgb25lIChpbmNsdWRpbmcgYXR0cmlidXRlIGJpbmRpbmdzKVxuICogYmVjYXVzZSBhdCB0aGUgdGltZSBvZiBiaW5kaW5nLCB3ZSBkb24ndCBrbm93IHRvIHdoaWNoIGluc3RydWN0aW9uIHRoZSBiaW5kaW5nXG4gKiBiZWxvbmdzLiBJdCBpcyBhbHdheXMgc3RvcmVkIGluIFRWaWV3LmRhdGEgYXQgdGhlIGluZGV4IG9mIHRoZSBsYXN0IGJpbmRpbmdcbiAqIHZhbHVlIGluIExWaWV3IChlLmcuIGZvciBpbnRlcnBvbGF0aW9uOCwgaXQgd291bGQgYmUgc3RvcmVkIGF0IHRoZSBpbmRleCBvZlxuICogdGhlIDh0aCB2YWx1ZSkuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBMVmlldyB0aGF0IGNvbnRhaW5zIHRoZSBjdXJyZW50IGJpbmRpbmcgaW5kZXguXG4gKiBAcGFyYW0gcHJlZml4IFRoZSBzdGF0aWMgcHJlZml4IHN0cmluZ1xuICogQHBhcmFtIHN1ZmZpeCBUaGUgc3RhdGljIHN1ZmZpeCBzdHJpbmdcbiAqXG4gKiBAcmV0dXJucyBOZXdseSBjcmVhdGVkIGJpbmRpbmcgbWV0YWRhdGEgc3RyaW5nIGZvciB0aGlzIGJpbmRpbmcgb3IgbnVsbFxuICovXG5mdW5jdGlvbiBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldzogTFZpZXcsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcbiAgY29uc3QgdmFsdWUgPSBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHByZWZpeCArIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgc3VmZml4O1xuXG4gIHJldHVybiB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9PSBudWxsID8gKHREYXRhW2xhc3RCaW5kaW5nSW5kZXhdID0gdmFsdWUpIDogbnVsbDtcbn1cblxuLyoqIFN0b3JlIGEgdmFsdWUgaW4gdGhlIGBkYXRhYCBhdCBhIGdpdmVuIGBpbmRleGAuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmU8VD4oaW5kZXg6IG51bWJlciwgdmFsdWU6IFQpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gV2UgZG9uJ3Qgc3RvcmUgYW55IHN0YXRpYyBkYXRhIGZvciBsb2NhbCB2YXJpYWJsZXMsIHNvIHRoZSBmaXJzdCB0aW1lXG4gIC8vIHdlIHNlZSB0aGUgdGVtcGxhdGUsIHdlIHNob3VsZCBzdG9yZSBhcyBudWxsIHRvIGF2b2lkIGEgc3BhcnNlIGFycmF5XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGlmIChhZGp1c3RlZEluZGV4ID49IHRWaWV3LmRhdGEubGVuZ3RoKSB7XG4gICAgdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9IG51bGw7XG4gICAgdFZpZXcuYmx1ZXByaW50W2FkanVzdGVkSW5kZXhdID0gbnVsbDtcbiAgfVxuICBsVmlld1thZGp1c3RlZEluZGV4XSA9IHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHJpZXZlcyBhIGxvY2FsIHJlZmVyZW5jZSBmcm9tIHRoZSBjdXJyZW50IGNvbnRleHRWaWV3RGF0YS5cbiAqXG4gKiBJZiB0aGUgcmVmZXJlbmNlIHRvIHJldHJpZXZlIGlzIGluIGEgcGFyZW50IHZpZXcsIHRoaXMgaW5zdHJ1Y3Rpb24gaXMgdXNlZCBpbiBjb25qdW5jdGlvblxuICogd2l0aCBhIG5leHRDb250ZXh0KCkgY2FsbCwgd2hpY2ggd2Fsa3MgdXAgdGhlIHRyZWUgYW5kIHVwZGF0ZXMgdGhlIGNvbnRleHRWaWV3RGF0YSBpbnN0YW5jZS5cbiAqXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBsb2NhbCByZWYgaW4gY29udGV4dFZpZXdEYXRhLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmZXJlbmNlPFQ+KGluZGV4OiBudW1iZXIpIHtcbiAgY29uc3QgY29udGV4dExWaWV3ID0gZ2V0Q29udGV4dExWaWV3KCk7XG4gIHJldHVybiBsb2FkSW50ZXJuYWw8VD4oY29udGV4dExWaWV3LCBpbmRleCk7XG59XG5cbi8qKiBSZXRyaWV2ZXMgYSB2YWx1ZSBmcm9tIGN1cnJlbnQgYHZpZXdEYXRhYC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkPFQ+KGluZGV4OiBudW1iZXIpOiBUIHtcbiAgcmV0dXJuIGxvYWRJbnRlcm5hbDxUPihnZXRMVmlldygpLCBpbmRleCk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIERJXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIGBkaXJlY3RpdmVJbmplY3RgIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGRpcmVjdGl2ZSwgY29tcG9uZW50IGFuZCBwaXBlIGZhY3Rvcmllcy5cbiAqICBBbGwgb3RoZXIgaW5qZWN0aW9uIHVzZSBgaW5qZWN0YCB3aGljaCBkb2VzIG5vdCB3YWxrIHRoZSBub2RlIGluamVjdG9yIHRyZWUuXG4gKlxuICogVXNhZ2UgZXhhbXBsZSAoaW4gZmFjdG9yeSBmdW5jdGlvbik6XG4gKlxuICogY2xhc3MgU29tZURpcmVjdGl2ZSB7XG4gKiAgIGNvbnN0cnVjdG9yKGRpcmVjdGl2ZTogRGlyZWN0aXZlQSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0RpcmVjdGl2ZURlZiA9IGRlZmluZURpcmVjdGl2ZSh7XG4gKiAgICAgdHlwZTogU29tZURpcmVjdGl2ZSxcbiAqICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU29tZURpcmVjdGl2ZShkaXJlY3RpdmVJbmplY3QoRGlyZWN0aXZlQSkpXG4gKiAgIH0pO1xuICogfVxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgdHlwZSBvciB0b2tlbiB0byBpbmplY3RcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciBgbnVsbGAgd2hlbiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgdG9rZW4gPSByZXNvbHZlRm9yd2FyZFJlZih0b2tlbik7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIGdldExWaWV3KCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogRmFjYWRlIGZvciB0aGUgYXR0cmlidXRlIGluamVjdGlvbiBmcm9tIERJLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgcmV0dXJuIGluamVjdEF0dHJpYnV0ZUltcGwoZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCksIGF0dHJOYW1lVG9JbmplY3QpO1xufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5mdW5jdGlvbiBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGU6IFROb2RlIHwgbnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgLy8gSWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZC5cbiAgaWYgKHROb2RlKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAvLyBtYXJrIGlucHV0cyBhcyBjaGVja2VkXG4gICAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gICAgfVxuICAgIHJldHVybiB0Tm9kZS5pbnB1dHM7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBjdXJyZW50IE9wYXF1ZVZpZXdTdGF0ZSBpbnN0YW5jZS5cbiAqXG4gKiBVc2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIHJlc3RvcmVWaWV3KCkgaW5zdHJ1Y3Rpb24gdG8gc2F2ZSBhIHNuYXBzaG90XG4gKiBvZiB0aGUgY3VycmVudCB2aWV3IGFuZCByZXN0b3JlIGl0IHdoZW4gbGlzdGVuZXJzIGFyZSBpbnZva2VkLiBUaGlzIGFsbG93c1xuICogd2Fsa2luZyB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIGluIGxpc3RlbmVycyB0byBnZXQgdmFycyBmcm9tIHBhcmVudCB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnJlbnRWaWV3KCk6IE9wYXF1ZVZpZXdTdGF0ZSB7XG4gIHJldHVybiBnZXRMVmlldygpIGFzIGFueSBhcyBPcGFxdWVWaWV3U3RhdGU7XG59XG5cbmZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHZpZXdbVFZJRVddLmNsZWFudXAgfHwgKHZpZXdbVFZJRVddLmNsZWFudXAgPSBbXSk7XG59XG5cbi8qKlxuICogVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgbmVlZHMgdG8gYmUgaW5jbHVkZWRcbiAqIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXIgKHNlZSB0aGUgY29tcG9uZW50U3ludGhldGljSG9zdCogaW5zdHJ1Y3Rpb25zKS5cbiAqL1xuZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG4iXX0=