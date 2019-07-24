import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertNotEqual, assertNotSame } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertLView, assertPreviousIsParent } from '../assert';
import { attachPatchData, getComponentViewByInstance } from '../context_discovery';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeHooks, executePreOrderHooks, registerPreOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponent, isComponentDef, isContentQueryHost, isLContainer, isRootView } from '../interfaces/type_checks';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getLView, getNamespace, getPreviousOrParentTNode, getSelectedIndex, incrementActiveDirectiveId, isCreationMode, leaveView, namespaceHTMLInternal, setActiveHostElement, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { renderStylingMap } from '../styling_next/bindings';
import { NO_CHANGE } from '../tokens';
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent, getRootContext } from '../util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
import { LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeConstructor, TNodeInitialData, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor, attachLContainerDebug, attachLViewDebug, cloneToLView, cloneToTViewData } from './lview_debug';
import { selectInternal } from './select';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = (function () { return Promise.resolve(null); })();
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 */
export function refreshDescendantViews(lView) {
    var tView = lView[TVIEW];
    var creationMode = isCreationMode(lView);
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = false;
    // Resetting the bindingIndex of the current LView as the next steps may trigger change detection.
    lView[BINDING_INDEX] = tView.bindingStartIndex;
    // If this is a creation pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update pass.
    if (!creationMode) {
        var checkNoChangesMode = getCheckNoChangesMode();
        executePreOrderHooks(lView, tView, checkNoChangesMode, undefined);
        refreshDynamicEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView, lView);
        resetPreOrderHookFlags(lView);
        executeHooks(lView, tView.contentHooks, tView.contentCheckHooks, checkNoChangesMode, 1 /* AfterContentInitHooksToBeRun */, undefined);
        setHostBindings(tView, lView);
    }
    // We resolve content queries specifically marked as `static` in creation mode. Dynamic
    // content queries are resolved during change detection (i.e. update mode), after embedded
    // views are refreshed (see block above).
    if (creationMode && tView.staticContentQueries) {
        refreshContentQueries(tView, lView);
    }
    // We must materialize query results before child components are processed
    // in case a child component has projected a container. The LContainer needs
    // to exist so the embedded views are properly attached by the container.
    if (!creationMode || tView.staticViewQueries) {
        executeViewQueryFn(2 /* Update */, tView, lView[CONTEXT]);
    }
    refreshChildComponents(lView, tView.components);
}
/** Sets the host bindings for the current view. */
export function setHostBindings(tView, viewData) {
    var selectedIndex = getSelectedIndex();
    try {
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
                        setActiveHostElement(currentElementIndex);
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
                        var hostCtx = unwrapRNode(viewData[currentDirectiveIndex]);
                        instruction(2 /* Update */, hostCtx, currentElementIndex);
                        // Each directive gets a uniqueId value that is the same for both
                        // create and update calls when the hostBindings function is called. The
                        // directive uniqueId is not set anywhere--it is just incremented between
                        // each hostBindings call and is useful for helping instruction code
                        // uniquely determine which directive is currently active when executed.
                        incrementActiveDirectiveId();
                    }
                    currentDirectiveIndex++;
                }
            }
        }
    }
    finally {
        setActiveHostElement(selectedIndex);
    }
}
/** Refreshes all content queries declared by directives in a given view */
function refreshContentQueries(tView, lView) {
    var contentQueries = tView.contentQueries;
    if (contentQueries !== null) {
        for (var i = 0; i < contentQueries.length; i += 2) {
            var queryStartIdx = contentQueries[i];
            var directiveDefIdx = contentQueries[i + 1];
            if (directiveDefIdx !== -1) {
                var directiveDef = tView.data[directiveDefIdx];
                ngDevMode &&
                    assertDefined(directiveDef.contentQueries, 'contentQueries function should be defined');
                setCurrentQueryIndex(queryStartIdx);
                directiveDef.contentQueries(2 /* Update */, lView[directiveDefIdx], directiveDefIdx);
            }
        }
    }
}
/** Refreshes child components in the current view. */
function refreshChildComponents(hostLView, components) {
    if (components != null) {
        for (var i = 0; i < components.length; i++) {
            componentRefresh(hostLView, components[i]);
        }
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
    var namespace = getNamespace();
    if (isProceduralRenderer(rendererToUse)) {
        native = rendererToUse.createElement(name, namespace);
    }
    else {
        if (namespace === null) {
            native = rendererToUse.createElement(name);
        }
        else {
            native = rendererToUse.createElementNS(namespace, name);
        }
    }
    return native;
}
export function createLView(parentLView, tView, context, flags, host, tHostNode, rendererFactory, renderer, sanitizer, injector) {
    var lView = ngDevMode ? cloneToLView(tView.blueprint) : tView.blueprint.slice();
    lView[HOST] = host;
    lView[FLAGS] = flags | 4 /* CreationMode */ | 128 /* Attached */ | 8 /* FirstLViewPass */;
    resetPreOrderHookFlags(lView);
    lView[PARENT] = lView[DECLARATION_VIEW] = parentLView;
    lView[CONTEXT] = context;
    lView[RENDERER_FACTORY] = (rendererFactory || parentLView && parentLView[RENDERER_FACTORY]);
    ngDevMode && assertDefined(lView[RENDERER_FACTORY], 'RendererFactory is required');
    lView[RENDERER] = (renderer || parentLView && parentLView[RENDERER]);
    ngDevMode && assertDefined(lView[RENDERER], 'Renderer is required');
    lView[SANITIZER] = sanitizer || parentLView && parentLView[SANITIZER] || null;
    lView[INJECTOR] = injector || parentLView && parentLView[INJECTOR] || null;
    lView[T_HOST] = tHostNode;
    ngDevMode && attachLViewDebug(lView);
    return lView;
}
export function getOrCreateTNode(tView, tHostNode, index, type, name, attrs) {
    // Keep this function short, so that the VM will inline it.
    var adjustedIndex = index + HEADER_OFFSET;
    var tNode = tView.data[adjustedIndex] ||
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index);
    setPreviousOrParentTNode(tNode, true);
    return tNode;
}
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    var isParent = getIsParent();
    var parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && parent !== tHostNode;
    var tParentNode = parentInSameView ? parent : null;
    var tNode = tView.data[adjustedIndex] =
        createTNode(tView, tParentNode, type, adjustedIndex, name, attrs);
    // The first node is not always the one at index 0, in case of i18n, index 0 can be the
    // instruction `i18nStart` and the first node has the index 1 or more
    if (index === 0 || !tView.firstChild) {
        tView.firstChild = tNode;
    }
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
    return tNode;
}
export function assignTViewNodeToLView(tView, tParentNode, index, lView) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    var tNode = tView.node;
    if (tNode == null) {
        ngDevMode && tParentNode &&
            assertNodeOfPossibleTypes(tParentNode, 3 /* Element */, 0 /* Container */);
        tView.node = tNode = createTNode(tView, tParentNode, //
        2 /* View */, index, null, null);
    }
    return lView[T_HOST] = tNode;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 *
 * @param view The LView containing the blueprint to adjust
 * @param numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 */
export function allocExpando(view, numSlotsToAlloc) {
    ngDevMode && assertGreaterThan(numSlotsToAlloc, 0, 'The number of slots to alloc should be greater than 0');
    if (numSlotsToAlloc > 0) {
        var tView = view[TVIEW];
        if (tView.firstTemplatePass) {
            for (var i = 0; i < numSlotsToAlloc; i++) {
                tView.blueprint.push(null);
                tView.data.push(null);
                view.push(null);
            }
            // We should only increment the expando start index if there aren't already directives
            // and injectors saved in the "expando" section
            if (!tView.expandoInstructions) {
                tView.expandoStartIndex += numSlotsToAlloc;
            }
            else {
                // Since we're adding the dynamic nodes into the expando section, we need to let the host
                // bindings know that they should skip x slots
                tView.expandoInstructions.push(numSlotsToAlloc);
            }
        }
    }
}
//////////////////////////
//// Render
//////////////////////////
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, injectorIndex) {
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    setPreviousOrParentTNode(null, true);
    var lView = createLView(declarationView, tView, context, 16 /* CheckAlways */, null, null);
    lView[DECLARATION_VIEW] = declarationView;
    assignTViewNodeToLView(tView, null, -1, lView);
    if (tView.firstTemplatePass) {
        tView.node.injectorIndex = injectorIndex;
    }
    setPreviousOrParentTNode(_previousOrParentTNode, _isParent);
    return lView;
}
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor
 * inside
 * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
 * can't store TViews in the template function itself (as we do for comps). Instead, we store the
 * TView for dynamically created views on their host TNode, which only has one instance.
 */
export function renderEmbeddedTemplate(viewToRender, tView, context) {
    var _isParent = getIsParent();
    var _previousOrParentTNode = getPreviousOrParentTNode();
    var oldView;
    if (viewToRender[FLAGS] & 512 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(getRootContext(viewToRender));
    }
    else {
        // Will become true if the `try` block executes with no errors.
        var safeToRunHooks = false;
        try {
            setPreviousOrParentTNode(null, true);
            oldView = enterView(viewToRender, viewToRender[T_HOST]);
            resetPreOrderHookFlags(viewToRender);
            executeTemplate(viewToRender, tView.template, getRenderFlags(viewToRender), context);
            // This must be set to false immediately after the first creation run because in an
            // ngFor loop, all the views will be created together before update mode runs and turns
            // off firstTemplatePass. If we don't set it here, instances will perform directive
            // matching, etc again and again.
            tView.firstTemplatePass = false;
            refreshDescendantViews(viewToRender);
            safeToRunHooks = true;
        }
        finally {
            leaveView(oldView, safeToRunHooks);
            setPreviousOrParentTNode(_previousOrParentTNode, _isParent);
        }
    }
}
export function renderComponentOrTemplate(hostView, context, templateFn) {
    var rendererFactory = hostView[RENDERER_FACTORY];
    var oldView = enterView(hostView, hostView[T_HOST]);
    var normalExecutionPath = !getCheckNoChangesMode();
    var creationModeIsActive = isCreationMode(hostView);
    // Will become true if the `try` block executes with no errors.
    var safeToRunHooks = false;
    try {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (creationModeIsActive) {
            // creation mode pass
            templateFn && executeTemplate(hostView, templateFn, 1 /* Create */, context);
            refreshDescendantViews(hostView);
            hostView[FLAGS] &= ~4 /* CreationMode */;
        }
        // update mode pass
        resetPreOrderHookFlags(hostView);
        templateFn && executeTemplate(hostView, templateFn, 2 /* Update */, context);
        refreshDescendantViews(hostView);
        safeToRunHooks = true;
    }
    finally {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView, safeToRunHooks);
    }
}
function executeTemplate(lView, templateFn, rf, context) {
    namespaceHTMLInternal();
    var prevSelectedIndex = getSelectedIndex();
    try {
        setActiveHostElement(null);
        if (rf & 2 /* Update */) {
            // When we're updating, have an inherent ɵɵselect(0) so we don't have to generate that
            // instruction for most update blocks
            selectInternal(lView, 0);
        }
        templateFn(rf, context);
    }
    finally {
        setSelectedIndex(prevSelectedIndex);
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
//// Element
//////////////////////////
export function executeContentQueries(tView, tNode, lView) {
    if (isContentQueryHost(tNode)) {
        var start = tNode.directiveStart;
        var end = tNode.directiveEnd;
        for (var directiveIndex = start; directiveIndex < end; directiveIndex++) {
            var def = tView.data[directiveIndex];
            if (def.contentQueries) {
                def.contentQueries(1 /* Create */, lView[directiveIndex], directiveIndex);
            }
        }
    }
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param localRefs Local refs of the node in question
 * @param localRefExtractor mapping function that extracts local ref value from TNode
 */
export function createDirectivesAndLocals(tView, lView, tNode, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
    if (!getBindingsEnabled())
        return;
    instantiateAllDirectives(tView, lView, tNode);
    invokeDirectivesHostBindings(tView, lView, tNode);
    saveResolvedLocalsInData(lView, tNode, localRefExtractor);
    setActiveHostElement(null);
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
 * @param def ComponentDef
 * @returns TView
 */
export function getOrCreateTView(def) {
    return def.tView || (def.tView = createTView(-1, def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas));
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param templateFn Template function
 * @param consts The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 * @param viewQuery View queries for this view
 * @param schemas Schemas for this view
 */
export function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery, schemas) {
    ngDevMode && ngDevMode.tView++;
    var bindingStartIndex = HEADER_OFFSET + consts;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    var initialViewLength = bindingStartIndex + vars;
    var blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[TVIEW] = ngDevMode ?
        new TViewConstructor(viewIndex, // id: number,
        blueprint, // blueprint: LView,
        templateFn, // template: ComponentTemplate<{}>|null,
        null, // queries: TQueries|null
        viewQuery, // viewQuery: ViewQueriesFunction<{}>|null,
        null, // node: TViewNode|TElementNode|null,
        cloneToTViewData(blueprint).fill(null, bindingStartIndex), // data: TData,
        bindingStartIndex, // bindingStartIndex: number,
        initialViewLength, // expandoStartIndex: number,
        null, // expandoInstructions: ExpandoInstructions|null,
        true, // firstTemplatePass: boolean,
        false, // staticViewQueries: boolean,
        false, // staticContentQueries: boolean,
        null, // preOrderHooks: HookData|null,
        null, // preOrderCheckHooks: HookData|null,
        null, // contentHooks: HookData|null,
        null, // contentCheckHooks: HookData|null,
        null, // viewHooks: HookData|null,
        null, // viewCheckHooks: HookData|null,
        null, // destroyHooks: HookData|null,
        null, // cleanup: any[]|null,
        null, // contentQueries: number[]|null,
        null, // components: number[]|null,
        typeof directives === 'function' ?
            directives() :
            directives, // directiveRegistry: DirectiveDefList|null,
        typeof pipes === 'function' ? pipes() : pipes, // pipeRegistry: PipeDefList|null,
        null, // firstChild: TNode|null,
        schemas) :
        {
            id: viewIndex,
            blueprint: blueprint,
            template: templateFn,
            queries: null,
            viewQuery: viewQuery,
            node: null,
            data: blueprint.slice().fill(null, bindingStartIndex),
            bindingStartIndex: bindingStartIndex,
            expandoStartIndex: initialViewLength,
            expandoInstructions: null,
            firstTemplatePass: true,
            staticViewQueries: false,
            staticContentQueries: false,
            preOrderHooks: null,
            preOrderCheckHooks: null,
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
            schemas: schemas,
        };
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    var blueprint = new (ngDevMode ? LViewBlueprint : Array)(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex);
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
export function createError(text, token) {
    return new Error("Renderer: " + text + " [" + stringifyForError(token) + "]");
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
/**
 * Constructs a TNode object from the arguments.
 *
 * @param tView `TView` to which this `TNode` belongs (used only in `ngDevMode`)
 * @param type The type of the node
 * @param adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param tagName The tag name of the node
 * @param attrs The attributes defined on this node
 * @param tViews Any TViews attached to this node
 * @returns the TNode object
 */
export function createTNode(tView, tParent, type, adjustedIndex, tagName, attrs) {
    ngDevMode && ngDevMode.tNode++;
    var injectorIndex = tParent ? tParent.injectorIndex : -1;
    return ngDevMode ? new TNodeConstructor(tView, // tView_: TView
    type, // type: TNodeType
    adjustedIndex, // index: number
    injectorIndex, // injectorIndex: number
    -1, // directiveStart: number
    -1, // directiveEnd: number
    -1, // propertyMetadataStartIndex: number
    -1, // propertyMetadataEndIndex: number
    0, // flags: TNodeFlags
    0, // providerIndexes: TNodeProviderIndexes
    tagName, // tagName: string|null
    attrs, // attrs: (string|AttributeMarker|(string|SelectorFlags)[])[]|null
    null, // localNames: (string|number)[]|null
    undefined, // initialInputs: (string[]|null)[]|null|undefined
    undefined, // inputs: PropertyAliases|null|undefined
    undefined, // outputs: PropertyAliases|null|undefined
    null, // tViews: ITView|ITView[]|null
    null, // next: ITNode|null
    null, // projectionNext: ITNode|null
    null, // child: ITNode|null
    tParent, // parent: TElementNode|TContainerNode|null
    null, // projection: number|(ITNode|RNode[])[]|null
    null, // styles: TStylingContext|null
    null) :
        {
            type: type,
            index: adjustedIndex,
            injectorIndex: injectorIndex,
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
            projectionNext: null,
            child: null,
            parent: tParent,
            projection: null,
            styles: null,
            classes: null,
        };
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param tNode
 * @param direction whether to consider inputs or outputs
 * @returns PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
export function generatePropertyAliases(tNode, direction) {
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
 * Mapping between attributes names that don't correspond to their element property names.
 * Note: this mapping has to be kept in sync with the equally named mapping in the template
 * type-checking machinery of ngtsc.
 */
var ATTR_TO_PROP = {
    'class': 'className',
    'for': 'htmlFor',
    'formaction': 'formAction',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
};
export function elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
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
                /**
                 * dataValue is an array containing runtime input or output names for the directives:
                 * i+0: directive instance index
                 * i+1: publicName
                 * i+2: privateName
                 *
                 * e.g. [0, 'change', 'change-minified']
                 * we want to set the reflected property with the privateName: dataValue[i+2]
                 */
                for (var i = 0; i < dataValue.length; i += 3) {
                    setNgReflectProperty(lView, element, tNode.type, dataValue[i + 2], value);
                }
            }
        }
    }
    else if (tNode.type === 3 /* Element */) {
        propName = ATTR_TO_PROP[propName] || propName;
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            validateAgainstUnknownProperties(lView, element, propName, tNode);
            ngDevMode.rendererSetProperty++;
        }
        savePropertyDebugData(tNode, lView, propName, lView[TVIEW].data, nativeOnly);
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property
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
    else if (tNode.type === 0 /* Container */) {
        // If the node is a container and the property didn't
        // match any of the inputs or schemas we should throw.
        if (ngDevMode && !matchingSchemas(lView, tNode.tagName)) {
            throw createUnknownPropertyError(propName, tNode);
        }
    }
}
/** If node is an OnPush component, marks its LView dirty. */
function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    var childComponentLView = getComponentViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 64 /* Dirty */;
    }
}
export function setNgReflectProperty(lView, element, type, attrName, value) {
    var _a;
    var renderer = lView[RENDERER];
    attrName = normalizeDebugBindingName(attrName);
    var debugValue = normalizeDebugBindingValue(value);
    if (type === 3 /* Element */) {
        if (value == null) {
            isProceduralRenderer(renderer) ? renderer.removeAttribute(element, attrName) :
                element.removeAttribute(attrName);
        }
        else {
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(element, attrName, debugValue) :
                element.setAttribute(attrName, debugValue);
        }
    }
    else {
        var textContent = "bindings=" + JSON.stringify((_a = {}, _a[attrName] = debugValue, _a), null, 2);
        if (isProceduralRenderer(renderer)) {
            renderer.setValue(element, textContent);
        }
        else {
            element.textContent = textContent;
        }
    }
}
function validateAgainstUnknownProperties(hostView, element, propName, tNode) {
    // If the tag matches any of the schemas we shouldn't throw.
    if (matchingSchemas(hostView, tNode.tagName)) {
        return;
    }
    // If prop is not a known property of the HTML element...
    if (!(propName in element) &&
        // and we are in a browser context... (web worker nodes should be skipped)
        typeof Node === 'function' && element instanceof Node &&
        // and isn't a synthetic animation property...
        propName[0] !== ANIMATION_PROP_PREFIX) {
        // ... it is probably a user error and we should throw.
        throw createUnknownPropertyError(propName, tNode);
    }
}
function matchingSchemas(hostView, tagName) {
    var schemas = hostView[TVIEW].schemas;
    if (schemas !== null) {
        for (var i = 0; i < schemas.length; i++) {
            var schema = schemas[i];
            if (schema === NO_ERRORS_SCHEMA ||
                schema === CUSTOM_ELEMENTS_SCHEMA && tagName && tagName.indexOf('-') > -1) {
                return true;
            }
        }
    }
    return false;
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
* Creates an error that should be thrown when encountering an unknown property on an element.
* @param propName Name of the invalid property.
* @param tNode Node on which we encountered the error.
*/
function createUnknownPropertyError(propName, tNode) {
    return new Error("Template error: Can't bind to '" + propName + "' since it isn't a known property of '" + tNode.tagName + "'.");
}
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
    postProcessBaseDirective(viewData, rootTNode, directive);
    return directive;
}
/**
 * Resolve the matched directives on a node.
 */
export function resolveDirectives(tView, lView, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in
    // tsickle.
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
    if (!getBindingsEnabled())
        return;
    var directives = findDirectiveMatches(tView, lView, tNode);
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
        var initialPreOrderHooksLength = (tView.preOrderHooks && tView.preOrderHooks.length) || 0;
        var initialPreOrderCheckHooksLength = (tView.preOrderCheckHooks && tView.preOrderCheckHooks.length) || 0;
        var nodeIndex = tNode.index - HEADER_OFFSET;
        for (var i = 0; i < directives.length; i++) {
            var def = directives[i];
            var directiveDefIdx = tView.data.length;
            baseResolveDirective(tView, lView, def, def.factory);
            saveNameToExportMap(tView.data.length - 1, def, exportsMap);
            // Init hooks are queued now so ngOnInit is called in host components before
            // any projected components.
            registerPreOrderHooks(directiveDefIdx, def, tView, nodeIndex, initialPreOrderHooksLength, initialPreOrderCheckHooksLength);
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
    var elementIndex = tNode.index - HEADER_OFFSET;
    var selectedIndex = getSelectedIndex();
    try {
        setActiveHostElement(elementIndex);
        for (var i = start; i < end; i++) {
            var def = tView.data[i];
            var directive = viewData[i];
            if (def.hostBindings) {
                invokeHostBindingsInCreationMode(def, expando, directive, tNode, firstTemplatePass);
                // Each directive gets a uniqueId value that is the same for both
                // create and update calls when the hostBindings function is called. The
                // directive uniqueId is not set anywhere--it is just incremented between
                // each hostBindings call and is useful for helping instruction code
                // uniquely determine which directive is currently active when executed.
                incrementActiveDirectiveId();
            }
            else if (firstTemplatePass) {
                expando.push(null);
            }
        }
    }
    finally {
        setActiveHostElement(selectedIndex);
    }
}
export function invokeHostBindingsInCreationMode(def, expando, directive, tNode, firstTemplatePass) {
    var previousExpandoLength = expando.length;
    setCurrentDirectiveDef(def);
    var elementIndex = tNode.index - HEADER_OFFSET;
    def.hostBindings(1 /* Create */, directive, elementIndex);
    setCurrentDirectiveDef(null);
    // `hostBindings` function may or may not contain `allocHostVars` call
    // (e.g. it may not if it only contains host listeners), so we need to check whether
    // `expandoInstructions` has changed and if not - we still push `hostBindings` to
    // expando block, to make sure we execute it for DI cycle
    if (previousExpandoLength === expando.length && firstTemplatePass) {
        expando.push(def.hostBindings);
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
 * Process a directive on the current node after its creation.
 */
function postProcessDirective(viewData, directive, def, directiveDefIdx) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    postProcessBaseDirective(viewData, previousOrParentTNode, directive);
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, directive, def, previousOrParentTNode);
    }
    if (viewData[TVIEW].firstTemplatePass && def.contentQueries) {
        previousOrParentTNode.flags |= 4 /* hasContentQuery */;
    }
    if (isComponentDef(def)) {
        var componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
        componentView[CONTEXT] = directive;
    }
}
/**
 * A lighter version of postProcessDirective() that is used for the root component.
 */
function postProcessBaseDirective(lView, previousOrParentTNode, directive) {
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
                matches || (matches = ngDevMode ? new MatchesArray() : []);
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, viewData), tView, def.type);
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
    (tView.components || (tView.components = ngDevMode ? new TViewComponents() : [])).push(previousOrParentTNode.index);
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        var localNames = tNode.localNames =
            ngDevMode ? new TNodeLocalNames() : [];
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
    var nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
function addComponentLogic(lView, previousOrParentTNode, def) {
    var native = getNativeByTNode(previousOrParentTNode, lView);
    var tView = getOrCreateTView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var rendererFactory = lView[RENDERER_FACTORY];
    var componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, lView[previousOrParentTNode.index], previousOrParentTNode, rendererFactory, rendererFactory.createRenderer(native, def)));
    componentView[T_HOST] = previousOrParentTNode;
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[previousOrParentTNode.index] = componentView;
    if (lView[TVIEW].firstTemplatePass) {
        queueComponentIndexForCheck(previousOrParentTNode);
    }
}
export function elementAttributeInternal(index, name, value, lView, sanitizer, namespace) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && validateAgainstEventAttributes(name);
    var element = getNativeByIndex(index, lView);
    var renderer = lView[RENDERER];
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
        var tNode = getTNode(index, lView);
        var strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tNode.tagName || '', name);
        if (isProceduralRenderer(renderer)) {
            renderer.setAttribute(element, name, strValue, namespace);
        }
        else {
            namespace ? element.setAttributeNS(namespace, name, strValue) :
                element.setAttribute(name, strValue);
        }
    }
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param def The directive def that contains the list of inputs
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
            if (ngDevMode) {
                var lView = getLView();
                var nativeElement = getNativeByTNode(tNode, lView);
                setNgReflectProperty(lView, nativeElement, tNode.type, privateName, value);
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
    var initialInputData = tNode.initialInputs || (tNode.initialInputs = ngDevMode ? new TNodeInitialInputs() : []);
    // Ensure that we don't create sparse arrays
    for (var i_1 = initialInputData.length; i_1 <= directiveIndex; i_1++) {
        initialInputData.push(null);
    }
    var attrs = tNode.attrs;
    var i = 0;
    while (i < attrs.length) {
        var attrName = attrs[i];
        if (attrName === 0 /* NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        else if (attrName === 5 /* ProjectAs */) {
            // Skip over the `ngProjectAs` value.
            i += 2;
            continue;
        }
        // If we hit any other attribute markers, we're done anyway. None of those are valid inputs.
        if (typeof attrName === 'number')
            break;
        var minifiedInputName = inputs[attrName];
        var attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            var inputsToStore = initialInputData[directiveIndex] ||
                (initialInputData[directiveIndex] = ngDevMode ? new TNodeInitialData() : []);
            inputsToStore.push(attrName, minifiedInputName, attrValue);
        }
        i += 2;
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
// Not sure why I need to do `any` here but TS complains later.
var LContainerArray = ngDevMode && createNamedArrayType('LContainer');
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
export function createLContainer(hostNative, currentView, native, tNode, isForViewContainerRef) {
    ngDevMode && assertDomNode(native);
    ngDevMode && assertLView(currentView);
    // https://jsperf.com/array-literal-vs-new-array-really
    var lContainer = new (ngDevMode ? LContainerArray : Array)(hostNative, // host native
    true, // Boolean `true` in this position signifies that this is an `LContainer`
    isForViewContainerRef ? -1 : 0, // active index
    currentView, // parent
    null, // next
    null, // queries
    tNode, // t_host
    native, // native,
    null);
    ngDevMode && attachLContainerDebug(lContainer);
    return lContainer;
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes
 * them
 * by executing an associated template function.
 */
function refreshDynamicEmbeddedViews(lView) {
    for (var current = lView[CHILD_HEAD]; current !== null; current = current[NEXT]) {
        // Note: current can be an LView or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LView
        // header.
        if (current[ACTIVE_INDEX] === -1 && isLContainer(current)) {
            for (var i = CONTAINER_HEADER_OFFSET; i < current.length; i++) {
                var dynamicViewData = current[i];
                // The directives and pipes are not needed here as an existing view is only being
                // refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], dynamicViewData[CONTEXT]);
            }
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param adjustedElementIndex  Element index in LView[] (adjusted for HEADER_OFFSET)
 */
export function componentRefresh(hostLView, adjustedElementIndex) {
    ngDevMode && assertDataInRange(hostLView, adjustedElementIndex);
    var componentView = getComponentViewByIndex(adjustedElementIndex, hostLView);
    ngDevMode &&
        assertNodeType(hostLView[TVIEW].data[adjustedElementIndex], 3 /* Element */);
    // Only components in creation mode, attached CheckAlways
    // components or attached, dirty OnPush components should be checked
    if ((viewAttachedToChangeDetector(componentView) || isCreationMode(hostLView)) &&
        componentView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
        syncViewWithBlueprint(componentView);
        checkView(componentView, componentView[CONTEXT]);
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
/**
 * Adds LView or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @param lView The view where LView or LContainer should be added
 * @param adjustedHostIndex Index of the view's host node in LView[], adjusted for header
 * @param lViewOrLContainer The LView or LContainer to add to the view tree
 * @returns The state passed in
 */
export function addToViewTree(lView, lViewOrLContainer) {
    // TODO(benlesh/misko): This implementation is incorrect, because it always adds the LContainer
    // to
    // the end of the queue, which means if the developer retrieves the LContainers from RNodes out
    // of
    // order, the change detection will run out of order, as the act of retrieving the the
    // LContainer
    // from the RNode is what adds it to the queue.
    if (lView[CHILD_HEAD]) {
        lView[CHILD_TAIL][NEXT] = lViewOrLContainer;
    }
    else {
        lView[CHILD_HEAD] = lViewOrLContainer;
    }
    lView[CHILD_TAIL] = lViewOrLContainer;
    return lViewOrLContainer;
}
///////////////////////////////
//// Change detection
///////////////////////////////
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
    while (lView) {
        lView[FLAGS] |= 64 /* Dirty */;
        var parent_1 = getLViewParent(lView);
        // Stop traversing up as soon as you find a root view that wasn't attached to any container
        if (isRootView(lView) && !parent_1) {
            return lView;
        }
        // continue otherwise
        lView = parent_1;
    }
    return null;
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
export function tickRootContext(rootContext) {
    for (var i = 0; i < rootContext.components.length; i++) {
        var rootComponent = rootContext.components[i];
        renderComponentOrTemplate(readPatchedLView(rootComponent), rootComponent);
    }
}
export function detectChangesInternal(view, context) {
    var rendererFactory = view[RENDERER_FACTORY];
    if (rendererFactory.begin)
        rendererFactory.begin();
    try {
        if (isCreationMode(view)) {
            checkView(view, context); // creation mode pass
        }
        checkView(view, context); // update mode pass
    }
    catch (error) {
        handleError(view, error);
        throw error;
    }
    finally {
        if (rendererFactory.end)
            rendererFactory.end();
    }
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
    var view = getComponentViewByInstance(component);
    checkNoChangesInternal(view, component);
}
export function checkNoChangesInternal(view, context) {
    setCheckNoChangesMode(true);
    try {
        detectChangesInternal(view, context);
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
/** Checks the view of the component provided. Does not gate on dirty checks or execute doCheck.
 */
export function checkView(hostView, component) {
    var hostTView = hostView[TVIEW];
    var oldView = enterView(hostView, hostView[T_HOST]);
    var templateFn = hostTView.template;
    var creationMode = isCreationMode(hostView);
    // Will become true if the `try` block executes with no errors.
    var safeToRunHooks = false;
    try {
        resetPreOrderHookFlags(hostView);
        creationMode && executeViewQueryFn(1 /* Create */, hostTView, component);
        executeTemplate(hostView, templateFn, getRenderFlags(hostView), component);
        refreshDescendantViews(hostView);
        safeToRunHooks = true;
    }
    finally {
        leaveView(oldView, safeToRunHooks);
    }
}
function executeViewQueryFn(flags, tView, component) {
    var viewQuery = tView.viewQuery;
    if (viewQuery !== null) {
        setCurrentQueryIndex(0);
        viewQuery(flags, component);
    }
}
///////////////////////////////
//// Bindings & interpolations
///////////////////////////////
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
export function storeBindingMetadata(lView, prefix, suffix) {
    if (prefix === void 0) { prefix = ''; }
    if (suffix === void 0) { suffix = ''; }
    var tData = lView[TVIEW].data;
    var lastBindingIndex = lView[BINDING_INDEX] - 1;
    var value = INTERPOLATION_DELIMITER + prefix + INTERPOLATION_DELIMITER + suffix;
    return tData[lastBindingIndex] == null ? (tData[lastBindingIndex] = value) : null;
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
export function initializeTNodeInputs(tNode) {
    // If tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked.
    if (tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode, 0 /* Input */);
    }
    return tNode.inputs;
}
export function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = ngDevMode ? new LCleanup() : []);
}
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = ngDevMode ? new TCleanup() : []);
}
/**
 * There are cases where the sub component's renderer needs to be included
 * instead of the current renderer (see the componentSyntheticHost* instructions).
 */
export function loadComponentRenderer(tNode, lView) {
    var componentLView = lView[tNode.index];
    return componentLView[RENDERER];
}
/** Handles an error thrown in an LView. */
export function handleError(lView, error) {
    var injector = lView[INJECTOR];
    var errorHandler = injector ? injector.get(ErrorHandler, null) : null;
    errorHandler && errorHandler.handleError(error);
}
/**
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param lView the `LView` which contains the directives.
 * @param inputs mapping between the public "input" name and privately-known,
 * possibly minified, property names to write to.
 * @param value Value to set.
 */
export function setInputsForProperty(lView, inputs, value) {
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
/**
 * Updates a text binding at a given index in a given LView.
 */
export function textBindingInternal(lView, index, value) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'value should not be NO_CHANGE');
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    var element = getNativeByIndex(index, lView);
    ngDevMode && assertDefined(element, 'native element should exist');
    ngDevMode && ngDevMode.rendererSetText++;
    var renderer = lView[RENDERER];
    isProceduralRenderer(renderer) ? renderer.setValue(element, value) : element.textContent = value;
}
/**
 * Renders all initial styling (class and style values) on to the element from the tNode.
 *
 * All initial styling data (i.e. any values extracted from the `style` or `class` attributes
 * on an element) are collected into the `tNode.styles` and `tNode.classes` data structures.
 * These values are populated during the creation phase of an element and are then later
 * applied once the element is instantiated. This function applies each of the static
 * style and class entries to the element.
 */
export function renderInitialStyling(renderer, native, tNode) {
    renderStylingMap(renderer, native, tNode.classes, true);
    renderStylingMap(renderer, native, tNode.styles, false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUVqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNqSixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNqRSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsV0FBVyxFQUFFLHNCQUFzQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQzlELE9BQU8sRUFBQyxlQUFlLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUNqRixPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUYsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3RELE9BQU8sRUFBQyxZQUFZLEVBQUUsb0JBQW9CLEVBQUUscUJBQXFCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDbkYsT0FBTyxFQUFDLFlBQVksRUFBRSx1QkFBdUIsRUFBYSxNQUFNLHlCQUF5QixDQUFDO0FBRTFGLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxt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QUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTk9fRVJST1JTX1NDSEVNQSwgU2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge3ZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcywgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2VjdXJpdHknO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90U2FtZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydExWaWV3LCBhc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGEsIGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHt0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVIb29rcywgZXhlY3V0ZVByZU9yZGVySG9va3MsIHJlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgRmFjdG9yeUZuLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFLCBOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtpc0NvbXBvbmVudCwgaXNDb21wb25lbnREZWYsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7QklORElOR19JTkRFWCwgQ0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fVklFVywgRXhwYW5kb0luc3RydWN0aW9ucywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIElOSkVDVE9SLCBJbml0UGhhc2VTdGF0ZSwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUVVFUklFUywgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFREYXRhLCBUVklFVywgVFZpZXcsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0QmluZGluZ3NFbmFibGVkLCBnZXRDaGVja05vQ2hhbmdlc01vZGUsIGdldElzUGFyZW50LCBnZXRMVmlldywgZ2V0TmFtZXNwYWNlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXgsIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkLCBpc0NyZWF0aW9uTW9kZSwgbGVhdmVWaWV3LCBuYW1lc3BhY2VIVE1MSW50ZXJuYWwsIHNldEFjdGl2ZUhvc3RFbGVtZW50LCBzZXRCaW5kaW5nUm9vdCwgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0SXNQYXJlbnQsIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtyZW5kZXJTdHlsaW5nTWFwfSBmcm9tICcuLi9zdHlsaW5nX25leHQvYmluZGluZ3MnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge0FOSU1BVElPTl9QUk9QX1BSRUZJWCwgaXNBbmltYXRpb25Qcm9wfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVIsIHJlbmRlclN0cmluZ2lmeSwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldExWaWV3UGFyZW50LCBnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgcmVhZFBhdGNoZWRMVmlldywgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwUk5vZGUsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7TENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZUNvbnN0cnVjdG9yLCBUTm9kZUluaXRpYWxEYXRhLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yLCBhdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlldywgY2xvbmVUb1RWaWV3RGF0YX0gZnJvbSAnLi9sdmlld19kZWJ1Zyc7XG5pbXBvcnQge3NlbGVjdEludGVybmFsfSBmcm9tICcuL3NlbGVjdCc7XG5cblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9ICgoKSA9PiBQcm9taXNlLnJlc29sdmUobnVsbCkpKCk7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUobFZpZXcpO1xuXG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICAvLyBSZXNldHRpbmcgdGhlIGJpbmRpbmdJbmRleCBvZiB0aGUgY3VycmVudCBMVmlldyBhcyB0aGUgbmV4dCBzdGVwcyBtYXkgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLlxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuXG4gIC8vIElmIHRoaXMgaXMgYSBjcmVhdGlvbiBwYXNzLCB3ZSBzaG91bGQgbm90IGNhbGwgbGlmZWN5Y2xlIGhvb2tzIG9yIGV2YWx1YXRlIGJpbmRpbmdzLlxuICAvLyBUaGlzIHdpbGwgYmUgZG9uZSBpbiB0aGUgdXBkYXRlIHBhc3MuXG4gIGlmICghY3JlYXRpb25Nb2RlKSB7XG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgICBleGVjdXRlUHJlT3JkZXJIb29rcyhsVmlldywgdFZpZXcsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdW5kZWZpbmVkKTtcblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcblxuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgbFZpZXcsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1biwgdW5kZWZpbmVkKTtcblxuICAgIHNldEhvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcpO1xuICB9XG5cbiAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gIC8vIGNvbnRlbnQgcXVlcmllcyBhcmUgcmVzb2x2ZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gKGkuZS4gdXBkYXRlIG1vZGUpLCBhZnRlciBlbWJlZGRlZFxuICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICBpZiAoY3JlYXRpb25Nb2RlICYmIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICAvLyBXZSBtdXN0IG1hdGVyaWFsaXplIHF1ZXJ5IHJlc3VsdHMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudHMgYXJlIHByb2Nlc3NlZFxuICAvLyBpbiBjYXNlIGEgY2hpbGQgY29tcG9uZW50IGhhcyBwcm9qZWN0ZWQgYSBjb250YWluZXIuIFRoZSBMQ29udGFpbmVyIG5lZWRzXG4gIC8vIHRvIGV4aXN0IHNvIHRoZSBlbWJlZGRlZCB2aWV3cyBhcmUgcHJvcGVybHkgYXR0YWNoZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAgaWYgKCFjcmVhdGlvbk1vZGUgfHwgdFZpZXcuc3RhdGljVmlld1F1ZXJpZXMpIHtcbiAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB0VmlldywgbFZpZXdbQ09OVEVYVF0pO1xuICB9XG5cbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyhsVmlldywgdFZpZXcuY29tcG9uZW50cyk7XG59XG5cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgaWYgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgbWVhbiB0aGF0IHdlIGFyZSBzdGFydGluZyBuZXcgRVhQQU5ETyBibG9jayBhbmQgbmVlZCB0byB1cGRhdGVcbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgICAgLy8gSW5qZWN0b3IgYmxvY2sgYW5kIHByb3ZpZGVycyBhcmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgICAgICAgICAgY29uc3QgcHJvdmlkZXJDb3VudCA9ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zWysraV0gYXMgbnVtYmVyKTtcbiAgICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAgIC8vIGFuZCBnZXQgdG8gdGhlIGZpcnN0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkgb3IgdGhlIGhvc3QgdmFyIGNvdW50XG4gICAgICAgICAgICAvLyAodG8gZ2V0IHRvIHRoZSBuZXh0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkuXG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBpdCdzIG5vdCBhIG51bWJlciwgaXQncyBhIGhvc3QgYmluZGluZyBmdW5jdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGV4ZWN1dGVkLlxuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgICAgY29uc3QgaG9zdEN0eCA9IHVud3JhcFJOb2RlKHZpZXdEYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF0pO1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb24oUmVuZGVyRmxhZ3MuVXBkYXRlLCBob3N0Q3R4LCBjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgICAgLy8gRWFjaCBkaXJlY3RpdmUgZ2V0cyBhIHVuaXF1ZUlkIHZhbHVlIHRoYXQgaXMgdGhlIHNhbWUgZm9yIGJvdGhcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAgICAgICAgICAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAgICAgICAgICAgLy8gZWFjaCBob3N0QmluZGluZ3MgY2FsbCBhbmQgaXMgdXNlZnVsIGZvciBoZWxwaW5nIGluc3RydWN0aW9uIGNvZGVcbiAgICAgICAgICAgIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICAgICAgICAgICAgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoc2VsZWN0ZWRJbmRleCk7XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyAhKFJlbmRlckZsYWdzLlVwZGF0ZSwgbFZpZXdbZGlyZWN0aXZlRGVmSWR4XSwgZGlyZWN0aXZlRGVmSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdIHwgbnVsbCk6IHZvaWQge1xuICBpZiAoY29tcG9uZW50cyAhPSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb21wb25lbnRSZWZyZXNoKGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmF0aXZlIGVsZW1lbnQgZnJvbSBhIHRhZyBuYW1lLCB1c2luZyBhIHJlbmRlcmVyLlxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gb3ZlcnJpZGRlblJlbmRlcmVyIE9wdGlvbmFsIEEgcmVuZGVyZXIgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb25lXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKG5hbWU6IHN0cmluZywgb3ZlcnJpZGRlblJlbmRlcmVyPzogUmVuZGVyZXIzKTogUkVsZW1lbnQge1xuICBsZXQgbmF0aXZlOiBSRWxlbWVudDtcbiAgY29uc3QgcmVuZGVyZXJUb1VzZSA9IG92ZXJyaWRkZW5SZW5kZXJlciB8fCBnZXRMVmlldygpW1JFTkRFUkVSXTtcblxuICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2UoKTtcblxuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXJUb1VzZSkpIHtcbiAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmU7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3IHwgbnVsbCwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgaG9zdDogUkVsZW1lbnQgfCBudWxsLCB0SG9zdE5vZGU6IFRWaWV3Tm9kZSB8IFRFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MyB8IG51bGwsIHJlbmRlcmVyPzogUmVuZGVyZXIzIHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsLCBpbmplY3Rvcj86IEluamVjdG9yIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3QgbFZpZXcgPSBuZ0Rldk1vZGUgPyBjbG9uZVRvTFZpZXcodFZpZXcuYmx1ZXByaW50KSA6IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3O1xuICBsVmlld1tIT1NUXSA9IGhvc3Q7XG4gIGxWaWV3W0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcztcbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gIGxWaWV3W1BBUkVOVF0gPSBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IHBhcmVudExWaWV3O1xuICBsVmlld1tDT05URVhUXSA9IGNvbnRleHQ7XG4gIGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldID0gKHJlbmRlcmVyRmFjdG9yeSB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl9GQUNUT1JZXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwgITtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICBsVmlld1tUX0hPU1RdID0gdEhvc3ROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0SG9zdE5vZGUgVGhpcyBpcyBhIGhhY2sgYW5kIHdlIHNob3VsZCBub3QgaGF2ZSB0byBwYXNzIHRoaXMgdmFsdWUgaW4uIEl0IGlzIG9ubHkgdXNlZCB0b1xuICogZGV0ZXJtaW5lIGlmIHRoZSBwYXJlbnQgYmVsb25ncyB0byBhIGRpZmZlcmVudCB0Vmlldy4gSW5zdGVhZCB3ZSBzaG91bGQgbm90IGhhdmUgcGFyZW50VFZpZXdcbiAqIHBvaW50IHRvIFRWaWV3IG90aGVyIHRoZSBjdXJyZW50IG9uZS5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlxuICAgIFRJY3VDb250YWluZXJOb2RlIHtcbiAgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uIHNob3J0LCBzbyB0aGF0IHRoZSBWTSB3aWxsIGlubGluZSBpdC5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlIHx8XG4gICAgICBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIHRIb3N0Tm9kZSwgYWRqdXN0ZWRJbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMsIGluZGV4KTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUTm9kZUF0SW5kZXgoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgcGFyZW50ICE9PSB0SG9zdE5vZGU7XG4gIGNvbnN0IHRQYXJlbnROb2RlID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICBjcmVhdGVUTm9kZSh0VmlldywgdFBhcmVudE5vZGUsIHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzKTtcbiAgLy8gVGhlIGZpcnN0IG5vZGUgaXMgbm90IGFsd2F5cyB0aGUgb25lIGF0IGluZGV4IDAsIGluIGNhc2Ugb2YgaTE4biwgaW5kZXggMCBjYW4gYmUgdGhlXG4gIC8vIGluc3RydWN0aW9uIGBpMThuU3RhcnRgIGFuZCB0aGUgZmlyc3Qgbm9kZSBoYXMgdGhlIGluZGV4IDEgb3IgbW9yZVxuICBpZiAoaW5kZXggPT09IDAgfHwgIXRWaWV3LmZpcnN0Q2hpbGQpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cbiAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgKHROb2RlLnBhcmVudCAhPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpKSB7XG4gICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmICghaXNQYXJlbnQpIHtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiBUVmlld05vZGUge1xuICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gIGxldCB0Tm9kZSA9IHRWaWV3Lm5vZGU7XG4gIGlmICh0Tm9kZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIHRQYXJlbnROb2RlICYmXG4gICAgICAgIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModFBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICB0Vmlldy5ub2RlID0gdE5vZGUgPSBjcmVhdGVUTm9kZShcbiAgICAgICAgdFZpZXcsXG4gICAgICAgIHRQYXJlbnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgIC8vXG4gICAgICAgIFROb2RlVHlwZS5WaWV3LCBpbmRleCwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICB9XG5cbiAgcmV0dXJuIGxWaWV3W1RfSE9TVF0gPSB0Tm9kZSBhcyBUVmlld05vZGU7XG59XG5cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSBvciBDb21wb25lbnRGYWN0b3J5LmNyZWF0ZSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyBjb250YWluaW5nIHRoZSBibHVlcHJpbnQgdG8gYWRqdXN0XG4gKiBAcGFyYW0gbnVtU2xvdHNUb0FsbG9jIFRoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2MgaW4gdGhlIExWaWV3LCBzaG91bGQgYmUgPjBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKFxuICAgICAgICAgICAgICAgICAgIG51bVNsb3RzVG9BbGxvYywgMCwgJ1RoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2Mgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiAwJyk7XG4gIGlmIChudW1TbG90c1RvQWxsb2MgPiAwKSB7XG4gICAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHNUb0FsbG9jOyBpKyspIHtcbiAgICAgICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgICAgICAgdmlldy5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBzaG91bGQgb25seSBpbmNyZW1lbnQgdGhlIGV4cGFuZG8gc3RhcnQgaW5kZXggaWYgdGhlcmUgYXJlbid0IGFscmVhZHkgZGlyZWN0aXZlc1xuICAgICAgLy8gYW5kIGluamVjdG9ycyBzYXZlZCBpbiB0aGUgXCJleHBhbmRvXCIgc2VjdGlvblxuICAgICAgaWYgKCF0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICs9IG51bVNsb3RzVG9BbGxvYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNpbmNlIHdlJ3JlIGFkZGluZyB0aGUgZHluYW1pYyBub2RlcyBpbnRvIHRoZSBleHBhbmRvIHNlY3Rpb24sIHdlIG5lZWQgdG8gbGV0IHRoZSBob3N0XG4gICAgICAgIC8vIGJpbmRpbmdzIGtub3cgdGhhdCB0aGV5IHNob3VsZCBza2lwIHggc2xvdHNcbiAgICAgICAgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5wdXNoKG51bVNsb3RzVG9BbGxvYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFVzZWQgZm9yIGNyZWF0aW5nIHRoZSBMVmlld05vZGUgb2YgYSBkeW5hbWljIGVtYmVkZGVkIHZpZXcsXG4gKiBlaXRoZXIgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpIG9yIFRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldygpLlxuICogU3VjaCBsVmlld05vZGUgd2lsbCB0aGVuIGJlIHJlbmRlcmVyIHdpdGggcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSgpIChzZWUgYmVsb3cpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW1iZWRkZWRWaWV3QW5kTm9kZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQsIGRlY2xhcmF0aW9uVmlldzogTFZpZXcsIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhLCB0cnVlKTtcblxuICBjb25zdCBsVmlldyA9IGNyZWF0ZUxWaWV3KGRlY2xhcmF0aW9uVmlldywgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG51bGwsIG51bGwpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBhc3NpZ25UVmlld05vZGVUb0xWaWV3KHRWaWV3LCBudWxsLCAtMSwgbFZpZXcpO1xuXG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHRWaWV3Lm5vZGUgIS5pbmplY3RvckluZGV4ID0gaW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlLCBfaXNQYXJlbnQpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogVXNlZCBmb3IgcmVuZGVyaW5nIGVtYmVkZGVkIHZpZXdzIChlLmcuIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MpXG4gKlxuICogRHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBtdXN0IHN0b3JlL3JldHJpZXZlIHRoZWlyIFRWaWV3cyBkaWZmZXJlbnRseSBmcm9tIGNvbXBvbmVudCB2aWV3c1xuICogYmVjYXVzZSB0aGVpciB0ZW1wbGF0ZSBmdW5jdGlvbnMgYXJlIG5lc3RlZCBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb25zIG9mIHRoZWlyIGhvc3RzLCBjcmVhdGluZ1xuICogY2xvc3VyZXMuIElmIHRoZWlyIGhvc3QgdGVtcGxhdGUgaGFwcGVucyB0byBiZSBhbiBlbWJlZGRlZCB0ZW1wbGF0ZSBpbiBhIGxvb3AgKGUuZy4gbmdGb3JcbiAqIGluc2lkZVxuICogYW4gbmdGb3IpLCB0aGUgbmVzdGluZyB3b3VsZCBtZWFuIHdlJ2QgaGF2ZSBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgdGhlIHRlbXBsYXRlIGZ1bmN0aW9uLCBzbyB3ZVxuICogY2FuJ3Qgc3RvcmUgVFZpZXdzIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiBpdHNlbGYgKGFzIHdlIGRvIGZvciBjb21wcykuIEluc3RlYWQsIHdlIHN0b3JlIHRoZVxuICogVFZpZXcgZm9yIGR5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3Mgb24gdGhlaXIgaG9zdCBUTm9kZSwgd2hpY2ggb25seSBoYXMgb25lIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZTxUPih2aWV3VG9SZW5kZXI6IExWaWV3LCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBsZXQgb2xkVmlldzogTFZpZXc7XG4gIGlmICh2aWV3VG9SZW5kZXJbRkxBR1NdICYgTFZpZXdGbGFncy5Jc1Jvb3QpIHtcbiAgICAvLyBUaGlzIGlzIGEgcm9vdCB2aWV3IGluc2lkZSB0aGUgdmlldyB0cmVlXG4gICAgdGlja1Jvb3RDb250ZXh0KGdldFJvb3RDb250ZXh0KHZpZXdUb1JlbmRlcikpO1xuICB9IGVsc2Uge1xuICAgIC8vIFdpbGwgYmVjb21lIHRydWUgaWYgdGhlIGB0cnlgIGJsb2NrIGV4ZWN1dGVzIHdpdGggbm8gZXJyb3JzLlxuICAgIGxldCBzYWZlVG9SdW5Ib29rcyA9IGZhbHNlO1xuICAgIHRyeSB7XG4gICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhLCB0cnVlKTtcblxuICAgICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUX0hPU1RdKTtcbiAgICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3Modmlld1RvUmVuZGVyKTtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh2aWV3VG9SZW5kZXIsIHRWaWV3LnRlbXBsYXRlICEsIGdldFJlbmRlckZsYWdzKHZpZXdUb1JlbmRlciksIGNvbnRleHQpO1xuXG4gICAgICAvLyBUaGlzIG11c3QgYmUgc2V0IHRvIGZhbHNlIGltbWVkaWF0ZWx5IGFmdGVyIHRoZSBmaXJzdCBjcmVhdGlvbiBydW4gYmVjYXVzZSBpbiBhblxuICAgICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgICAvLyBvZmYgZmlyc3RUZW1wbGF0ZVBhc3MuIElmIHdlIGRvbid0IHNldCBpdCBoZXJlLCBpbnN0YW5jZXMgd2lsbCBwZXJmb3JtIGRpcmVjdGl2ZVxuICAgICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlcik7XG4gICAgICBzYWZlVG9SdW5Ib29rcyA9IHRydWU7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEsIHNhZmVUb1J1bkhvb2tzKTtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlLCBfaXNQYXJlbnQpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIHRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBob3N0Vmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuXG4gIC8vIFdpbGwgYmVjb21lIHRydWUgaWYgdGhlIGB0cnlgIGJsb2NrIGV4ZWN1dGVzIHdpdGggbm8gZXJyb3JzLlxuICBsZXQgc2FmZVRvUnVuSG9va3MgPSBmYWxzZTtcbiAgdHJ5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG5cbiAgICBpZiAoY3JlYXRpb25Nb2RlSXNBY3RpdmUpIHtcbiAgICAgIC8vIGNyZWF0aW9uIG1vZGUgcGFzc1xuICAgICAgdGVtcGxhdGVGbiAmJiBleGVjdXRlVGVtcGxhdGUoaG9zdFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLkNyZWF0ZSwgY29udGV4dCk7XG5cbiAgICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICAgICAgaG9zdFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICB9XG5cbiAgICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhob3N0Vmlldyk7XG4gICAgdGVtcGxhdGVGbiAmJiBleGVjdXRlVGVtcGxhdGUoaG9zdFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0Vmlldyk7XG4gICAgc2FmZVRvUnVuSG9va3MgPSB0cnVlO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3LCBzYWZlVG9SdW5Ib29rcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHJmOiBSZW5kZXJGbGFncywgY29udGV4dDogVCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbiAgY29uc3QgcHJldlNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG4gICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBoYXZlIGFuIGluaGVyZW50IMm1ybVzZWxlY3QoMCkgc28gd2UgZG9uJ3QgaGF2ZSB0byBnZW5lcmF0ZSB0aGF0XG4gICAgICAvLyBpbnN0cnVjdGlvbiBmb3IgbW9zdCB1cGRhdGUgYmxvY2tzXG4gICAgICBzZWxlY3RJbnRlcm5hbChsVmlldywgMCk7XG4gICAgfVxuICAgIHRlbXBsYXRlRm4ocmYsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgocHJldlNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogVGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24gb2YgcmVuZGVyaW5nIGZsYWdzIGRlcGVuZGluZyBvbiB3aGVuIHRoZVxuICogdGVtcGxhdGUgaXMgaW4gY3JlYXRpb24gbW9kZSBvciB1cGRhdGUgbW9kZS4gVXBkYXRlIGJsb2NrIGFuZCBjcmVhdGUgYmxvY2sgYXJlXG4gKiBhbHdheXMgcnVuIHNlcGFyYXRlbHkuXG4gKi9cbmZ1bmN0aW9uIGdldFJlbmRlckZsYWdzKHZpZXc6IExWaWV3KTogUmVuZGVyRmxhZ3Mge1xuICByZXR1cm4gaXNDcmVhdGlvbk1vZGUodmlldykgPyBSZW5kZXJGbGFncy5DcmVhdGUgOiBSZW5kZXJGbGFncy5VcGRhdGU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMgYW5kIHBvcHVsYXRlcyBsb2NhbCByZWZzLlxuICpcbiAqIEBwYXJhbSBsb2NhbFJlZnMgTG9jYWwgcmVmcyBvZiB0aGUgbm9kZSBpbiBxdWVzdGlvblxuICogQHBhcmFtIGxvY2FsUmVmRXh0cmFjdG9yIG1hcHBpbmcgZnVuY3Rpb24gdGhhdCBleHRyYWN0cyBsb2NhbCByZWYgdmFsdWUgZnJvbSBUTm9kZVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0FuZExvY2FscyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgdE5vZGUsIGxvY2FsUmVmRXh0cmFjdG9yKTtcbiAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgcmV0dXJuIGRlZi50VmlldyB8fCAoZGVmLnRWaWV3ID0gY3JlYXRlVFZpZXcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi52aWV3UXVlcnksIGRlZi5zY2hlbWFzKSk7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcmllcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gc2NoZW1hcyBTY2hlbWFzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fCBudWxsLCBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdIHwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBjb25zdHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgcmV0dXJuIGJsdWVwcmludFtUVklFVyBhcyBhbnldID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUVmlld0NvbnN0cnVjdG9yKFxuICAgICAgICAgICAgIHZpZXdJbmRleCwgICAvLyBpZDogbnVtYmVyLFxuICAgICAgICAgICAgIGJsdWVwcmludCwgICAvLyBibHVlcHJpbnQ6IExWaWV3LFxuICAgICAgICAgICAgIHRlbXBsYXRlRm4sICAvLyB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgIC8vIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGxcbiAgICAgICAgICAgICB2aWV3UXVlcnksICAgLy8gdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwgISwgICAgICAvLyBub2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGwsXG4gICAgICAgICAgICAgY2xvbmVUb1RWaWV3RGF0YShibHVlcHJpbnQpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLCAgLy8gZGF0YTogVERhdGEsXG4gICAgICAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXgsICAvLyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgIGluaXRpYWxWaWV3TGVuZ3RoLCAgLy8gZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGV4cGFuZG9JbnN0cnVjdGlvbnM6IEV4cGFuZG9JbnN0cnVjdGlvbnN8bnVsbCxcbiAgICAgICAgICAgICB0cnVlLCAgICAgICAgICAgICAgIC8vIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgLy8gc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICAgICApIDpcbiAgICAgIHtcbiAgICAgICAgaWQ6IHZpZXdJbmRleCxcbiAgICAgICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgICAgICBxdWVyaWVzOiBudWxsLFxuICAgICAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICAgICAgbm9kZTogbnVsbCAhLFxuICAgICAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgICAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgICAgIGNsZWFudXA6IG51bGwsXG4gICAgICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgICAgICBjb21wb25lbnRzOiBudWxsLFxuICAgICAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgICAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICAgICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICAgICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV3IChuZ0Rldk1vZGUgPyBMVmlld0JsdWVwcmludCAhIDogQXJyYXkpKGluaXRpYWxWaWV3TGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwobnVsbCwgMCwgYmluZGluZ1N0YXJ0SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChOT19DSEFOR0UsIGJpbmRpbmdTdGFydEluZGV4KSBhcyBMVmlldztcbiAgYmx1ZXByaW50W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJldHVybiBibHVlcHJpbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8vIFRPRE86IFJlbW92ZSB0aGlzIHdoZW4gdGhlIGlzc3VlIGlzIHJlc29sdmVkLlxuLyoqXG4gKiBUc2lja2xlIGhhcyBhIGJ1ZyB3aGVyZSBpdCBjcmVhdGVzIGFuIGluZmluaXRlIGxvb3AgZm9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGl0c2VsZi5cbiAqIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0aGF0IHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzEwMDkpXG4gKi9cbmV4cG9ydCB0eXBlIFRzaWNrbGVJc3N1ZTEwMDkgPSBhbnk7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIHJldHVybiBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVDb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBwcm9wZXJ0eU1ldGFkYXRhU3RhcnRJbmRleDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIHByb3BlcnR5TWV0YWRhdGFFbmRJbmRleDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIGZsYWdzOiBUTm9kZUZsYWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLCAgICAgICAgLy8gdGFnTmFtZTogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycywgIC8vIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gbmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjaGlsZDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50LCAgICAvLyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKSA6XG4gICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4OiBpbmplY3RvckluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlNZXRhZGF0YUVuZEluZGV4OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVySW5kZXhlczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IGF0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIHRWaWV3czogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGlvbk5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGNoaWxkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb246IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHN0eWxlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgIH07XG59XG5cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZTogVE5vZGUsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xcbiAgICBudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5jb25zdCBBVFRSX1RPX1BST1A6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgJ2NsYXNzJzogJ2NsYXNzTmFtZScsXG4gICdmb3InOiAnaHRtbEZvcicsXG4gICdmb3JtYWN0aW9uJzogJ2Zvcm1BY3Rpb24nLFxuICAnaW5uZXJIdG1sJzogJ2lubmVySFRNTCcsXG4gICdyZWFkb25seSc6ICdyZWFkT25seScsXG4gICd0YWJpbmRleCc6ICd0YWJJbmRleCcsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCwgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGxldCBpbnB1dERhdGE6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIChpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpKSAmJlxuICAgICAgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICAgICAqIGkrMDogZGlyZWN0aXZlIGluc3RhbmNlIGluZGV4XG4gICAgICAgICAqIGkrMTogcHVibGljTmFtZVxuICAgICAgICAgKiBpKzI6IHByaXZhdGVOYW1lXG4gICAgICAgICAqXG4gICAgICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMl1cbiAgICAgICAgICovXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZVtpICsgMl0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBwcm9wTmFtZSA9IEFUVFJfVE9fUFJPUFtwcm9wTmFtZV0gfHwgcHJvcE5hbWU7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIHNhdmVQcm9wZXJ0eURlYnVnRGF0YSh0Tm9kZSwgbFZpZXcsIHByb3BOYW1lLCBsVmlld1tUVklFV10uZGF0YSwgbmF0aXZlT25seSk7XG5cbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXMobFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID0gYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMoXG4gICAgaG9zdFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCBwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpIHtcbiAgLy8gSWYgdGhlIHRhZyBtYXRjaGVzIGFueSBvZiB0aGUgc2NoZW1hcyB3ZSBzaG91bGRuJ3QgdGhyb3cuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgcHJvcCBpcyBub3QgYSBrbm93biBwcm9wZXJ0eSBvZiB0aGUgSFRNTCBlbGVtZW50Li4uXG4gIGlmICghKHByb3BOYW1lIGluIGVsZW1lbnQpICYmXG4gICAgICAvLyBhbmQgd2UgYXJlIGluIGEgYnJvd3NlciBjb250ZXh0Li4uICh3ZWIgd29ya2VyIG5vZGVzIHNob3VsZCBiZSBza2lwcGVkKVxuICAgICAgdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgIC8vIGFuZCBpc24ndCBhIHN5bnRoZXRpYyBhbmltYXRpb24gcHJvcGVydHkuLi5cbiAgICAgIHByb3BOYW1lWzBdICE9PSBBTklNQVRJT05fUFJPUF9QUkVGSVgpIHtcbiAgICAvLyAuLi4gaXQgaXMgcHJvYmFibHkgYSB1c2VyIGVycm9yIGFuZCB3ZSBzaG91bGQgdGhyb3cuXG4gICAgdGhyb3cgY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXc6IExWaWV3LCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjaGVtYXMgPSBob3N0Vmlld1tUVklFV10uc2NoZW1hcztcblxuICBpZiAoc2NoZW1hcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZW1hcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NoZW1hID0gc2NoZW1hc1tpXTtcbiAgICAgIGlmIChzY2hlbWEgPT09IE5PX0VSUk9SU19TQ0hFTUEgfHxcbiAgICAgICAgICBzY2hlbWEgPT09IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEgJiYgdGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4qIFN0b3JlcyBkZWJ1Z2dpbmcgZGF0YSBmb3IgdGhpcyBwcm9wZXJ0eSBiaW5kaW5nIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4qIFRoaXMgZW5hYmxlcyBmZWF0dXJlcyBsaWtlIERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzLlxuKi9cbmZ1bmN0aW9uIHNhdmVQcm9wZXJ0eURlYnVnRGF0YShcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJvcE5hbWU6IHN0cmluZywgdERhdGE6IFREYXRhLFxuICAgIG5hdGl2ZU9ubHk6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcblxuICAvLyBCaW5kL2ludGVycG9sYXRpb24gZnVuY3Rpb25zIHNhdmUgYmluZGluZyBtZXRhZGF0YSBpbiB0aGUgbGFzdCBiaW5kaW5nIGluZGV4LFxuICAvLyBidXQgbGVhdmUgdGhlIHByb3BlcnR5IG5hbWUgYmxhbmsuIElmIHRoZSBpbnRlcnBvbGF0aW9uIGRlbGltaXRlciBpcyBhdCB0aGUgMFxuICAvLyBpbmRleCwgd2Uga25vdyB0aGF0IHRoaXMgaXMgb3VyIGZpcnN0IHBhc3MgYW5kIHRoZSBwcm9wZXJ0eSBuYW1lIHN0aWxsIG5lZWRzIHRvXG4gIC8vIGJlIHNldC5cbiAgY29uc3QgYmluZGluZ01ldGFkYXRhID0gdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICBpZiAoYmluZGluZ01ldGFkYXRhWzBdID09IElOVEVSUE9MQVRJT05fREVMSU1JVEVSKSB7XG4gICAgdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gPSBwcm9wTmFtZSArIGJpbmRpbmdNZXRhZGF0YTtcblxuICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gc3RvcmUgaW5kaWNlcyBmb3IgaG9zdCBiaW5kaW5ncyBiZWNhdXNlIHRoZXkgYXJlIHN0b3JlZCBpbiBhXG4gICAgLy8gZGlmZmVyZW50IHBhcnQgb2YgTFZpZXcgKHRoZSBleHBhbmRvIHNlY3Rpb24pLlxuICAgIGlmICghbmF0aXZlT25seSkge1xuICAgICAgaWYgKHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID09IC0xKSB7XG4gICAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleDtcbiAgICAgIH1cbiAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCA9IGxhc3RCaW5kaW5nSW5kZXggKyAxO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQ3JlYXRlcyBhbiBlcnJvciB0aGF0IHNob3VsZCBiZSB0aHJvd24gd2hlbiBlbmNvdW50ZXJpbmcgYW4gdW5rbm93biBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50LlxuKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiB0aGUgaW52YWxpZCBwcm9wZXJ0eS5cbiogQHBhcmFtIHROb2RlIE5vZGUgb24gd2hpY2ggd2UgZW5jb3VudGVyZWQgdGhlIGVycm9yLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZVVua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgIGBUZW1wbGF0ZSBlcnJvcjogQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dE5vZGUudGFnTmFtZX0nLmApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmLCBkZWYuZmFjdG9yeSk7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID1cbiAgICAgIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIHZpZXdEYXRhLCB2aWV3RGF0YS5sZW5ndGggLSAxLCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCByb290VE5vZGUsIGRpcmVjdGl2ZSk7XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW5cbiAgLy8gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnc2hvdWxkIHJ1biBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcblxuICBpZiAoIWdldEJpbmRpbmdzRW5hYmxlZCgpKSByZXR1cm47XG5cbiAgY29uc3QgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsID0gZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID8geycnOiAtMX0gOiBudWxsO1xuXG4gIGlmIChkaXJlY3RpdmVzKSB7XG4gICAgaW5pdE5vZGVGbGFncyh0Tm9kZSwgdFZpZXcuZGF0YS5sZW5ndGgsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgLy8gdGhlIHZpZXdFbmdpbmU6XG4gICAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgIC8vIFNvIHRvIG1hdGNoIHRoZXNlIHJ1bGVzLCB0aGUgb3JkZXIgaW4gd2hpY2ggcHJvdmlkZXJzIGFyZSBhZGRlZCBpbiB0aGUgYXJyYXlzIGlzIHZlcnlcbiAgICAvLyBpbXBvcnRhbnQuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgfVxuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHROb2RlLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG4gICAgY29uc3QgaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGggPSAodFZpZXcucHJlT3JkZXJIb29rcyAmJiB0Vmlldy5wcmVPcmRlckhvb2tzLmxlbmd0aCkgfHwgMDtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoID1cbiAgICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyAmJiB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmRhdGEubGVuZ3RoO1xuICAgICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIGxWaWV3LCBkZWYsIGRlZi5mYWN0b3J5KTtcblxuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcCh0Vmlldy5kYXRhICEubGVuZ3RoIC0gMSwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgICAgLy8gYW55IHByb2plY3RlZCBjb21wb25lbnRzLlxuICAgICAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKFxuICAgICAgICAgIGRpcmVjdGl2ZURlZklkeCwgZGVmLCB0Vmlldywgbm9kZUluZGV4LCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCxcbiAgICAgICAgICBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgc3RhcnQgPCBlbmQpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGxWaWV3ICEsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgcG9zdFByb2Nlc3NEaXJlY3RpdmUobFZpZXcsIGRpcmVjdGl2ZSwgZGVmLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdmlld0RhdGFbaV07XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGV4cGFuZG8sIGRpcmVjdGl2ZSwgdE5vZGUsIGZpcnN0VGVtcGxhdGVQYXNzKTtcblxuICAgICAgICAvLyBFYWNoIGRpcmVjdGl2ZSBnZXRzIGEgdW5pcXVlSWQgdmFsdWUgdGhhdCBpcyB0aGUgc2FtZSBmb3IgYm90aFxuICAgICAgICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgICAgICAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAgICAgICAvLyBlYWNoIGhvc3RCaW5kaW5ncyBjYWxsIGFuZCBpcyB1c2VmdWwgZm9yIGhlbHBpbmcgaW5zdHJ1Y3Rpb24gY29kZVxuICAgICAgICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgICAgICAgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgICAgZXhwYW5kby5wdXNoKG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChzZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlSG9zdEJpbmRpbmdzSW5DcmVhdGlvbk1vZGUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgZXhwYW5kbzogRXhwYW5kb0luc3RydWN0aW9ucywgZGlyZWN0aXZlOiBhbnksIHROb2RlOiBUTm9kZSxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbikge1xuICBjb25zdCBwcmV2aW91c0V4cGFuZG9MZW5ndGggPSBleHBhbmRvLmxlbmd0aDtcbiAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihkZWYpO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGRlZi5ob3N0QmluZGluZ3MgIShSZW5kZXJGbGFncy5DcmVhdGUsIGRpcmVjdGl2ZSwgZWxlbWVudEluZGV4KTtcbiAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihudWxsKTtcbiAgLy8gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gbWF5IG9yIG1heSBub3QgY29udGFpbiBgYWxsb2NIb3N0VmFyc2AgY2FsbFxuICAvLyAoZS5nLiBpdCBtYXkgbm90IGlmIGl0IG9ubHkgY29udGFpbnMgaG9zdCBsaXN0ZW5lcnMpLCBzbyB3ZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXJcbiAgLy8gYGV4cGFuZG9JbnN0cnVjdGlvbnNgIGhhcyBjaGFuZ2VkIGFuZCBpZiBub3QgLSB3ZSBzdGlsbCBwdXNoIGBob3N0QmluZGluZ3NgIHRvXG4gIC8vIGV4cGFuZG8gYmxvY2ssIHRvIG1ha2Ugc3VyZSB3ZSBleGVjdXRlIGl0IGZvciBESSBjeWNsZVxuICBpZiAocHJldmlvdXNFeHBhbmRvTGVuZ3RoID09PSBleHBhbmRvLmxlbmd0aCAmJiBmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgfVxufVxuXG4vKipcbiogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbipcbiogRWFjaCBleHBhbmRvIGJsb2NrIHN0YXJ0cyB3aXRoIHRoZSBlbGVtZW50IGluZGV4ICh0dXJuZWQgbmVnYXRpdmUgc28gd2UgY2FuIGRpc3Rpbmd1aXNoXG4qIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2soXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdFeHBhbmRvIGJsb2NrIHNob3VsZCBvbmx5IGJlIGdlbmVyYXRlZCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuXG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IC0odE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgcHJvdmlkZXJTdGFydEluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IHByb3ZpZGVyQ291bnQgPSB0Vmlldy5kYXRhLmxlbmd0aCAtIHByb3ZpZGVyU3RhcnRJbmRleDtcbiAgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgfHwgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgPSBbXG4gICBdKSkucHVzaChlbGVtZW50SW5kZXgsIHByb3ZpZGVyQ291bnQsIGRpcmVjdGl2ZUNvdW50KTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIGEgZGlyZWN0aXZlIG9uIHRoZSBjdXJyZW50IG5vZGUgYWZ0ZXIgaXRzIGNyZWF0aW9uLlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZTxUPihcbiAgICB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZGlyZWN0aXZlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlJyk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkZWYsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAodmlld0RhdGFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzICYmIGRlZi5jb250ZW50UXVlcmllcykge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgfVxuXG4gIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCwgdmlld0RhdGEpO1xuICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkaXJlY3RpdmU6IFQpOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KGdldElzUGFyZW50KCkpO1xuXG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxufVxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlKTogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnc2hvdWxkIHJ1biBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXSBhcyBDb21wb25lbnREZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyBmYWxzZSkpIHtcbiAgICAgICAgbWF0Y2hlcyB8fCAobWF0Y2hlcyA9IG5nRGV2TW9kZSA/IG5ldyBNYXRjaGVzQXJyYXkgISgpIDogW10pO1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCB2aWV3RGF0YSksIHRWaWV3LCBkZWYudHlwZSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcblxuICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgaXMgYWx3YXlzIHN0b3JlZCBmaXJzdCB3aXRoIGRpcmVjdGl2ZXMgYWZ0ZXIuXG4gICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKGRlZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBuZ0Rldk1vZGUgPyBuZXcgVFZpZXdDb21wb25lbnRzICEoKSA6IFtcbiAgIF0pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID1cbiAgICAgICAgbmdEZXZNb2RlID8gbmV3IFROb2RlTG9jYWxOYW1lcyAhKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmbGFncyA9PT0gMCB8fCBmbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnZXhwZWN0ZWQgbm9kZSBmbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZmxhZ3MgPSBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBkaXJlY3RpdmVGYWN0b3J5OiBGYWN0b3J5Rm48VD4pIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBudWxsKTtcbiAgdFZpZXcuYmx1ZXByaW50LnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG4gIHZpZXdEYXRhLnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcblxuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcoZGVmKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICAgICAgICAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSxcbiAgICAgICAgICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlIGFzIFJFbGVtZW50LCBkZWYpKSk7XG5cbiAgY29tcG9uZW50Vmlld1tUX0hPU1RdID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBsVmlldzogTFZpZXcsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVzcGFjZSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBkZWYgVGhlIGRpcmVjdGl2ZSBkZWYgdGhhdCBjb250YWlucyB0aGUgbGlzdCBvZiBpbnB1dHNcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQpIHtcbiAgICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID1cbiAgICAgIHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsSW5wdXRzICEoKSA6IFtdKTtcbiAgLy8gRW5zdXJlIHRoYXQgd2UgZG9uJ3QgY3JlYXRlIHNwYXJzZSBhcnJheXNcbiAgZm9yIChsZXQgaSA9IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoOyBpIDw9IGRpcmVjdGl2ZUluZGV4OyBpKyspIHtcbiAgICBpbml0aWFsSW5wdXREYXRhLnB1c2gobnVsbCk7XG4gIH1cblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGNvbnN0IG1pbmlmaWVkSW5wdXROYW1lID0gaW5wdXRzW2F0dHJOYW1lIGFzIHN0cmluZ107XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fFxuICAgICAgICAgIChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUluaXRpYWxEYXRhICEoKSA6IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChhdHRyTmFtZSBhcyBzdHJpbmcsIG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBOb3Qgc3VyZSB3aHkgSSBuZWVkIHRvIGRvIGBhbnlgIGhlcmUgYnV0IFRTIGNvbXBsYWlucyBsYXRlci5cbmNvbnN0IExDb250YWluZXJBcnJheTogYW55ID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ29udGFpbmVyJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMVmlldywgY3VycmVudFZpZXc6IExWaWV3LCBuYXRpdmU6IFJDb21tZW50LCB0Tm9kZTogVE5vZGUsXG4gICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmPzogYm9vbGVhbik6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmUpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICAvLyBodHRwczovL2pzcGVyZi5jb20vYXJyYXktbGl0ZXJhbC12cy1uZXctYXJyYXktcmVhbGx5XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBuZXcgKG5nRGV2TW9kZSA/IExDb250YWluZXJBcnJheSA6IEFycmF5KShcbiAgICAgIGhvc3ROYXRpdmUsICAvLyBob3N0IG5hdGl2ZVxuICAgICAgdHJ1ZSwgICAgICAgIC8vIEJvb2xlYW4gYHRydWVgIGluIHRoaXMgcG9zaXRpb24gc2lnbmlmaWVzIHRoYXQgdGhpcyBpcyBhbiBgTENvbnRhaW5lcmBcbiAgICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgICB0Tm9kZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0X2hvc3RcbiAgICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSxcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXcgcmVmc1xuICAgICAgKTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKTtcbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzXG4gKiB0aGVtXG4gKiBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBjdXJyZW50ID0gbFZpZXdbQ0hJTERfSEVBRF07IGN1cnJlbnQgIT09IG51bGw7IGN1cnJlbnQgPSBjdXJyZW50W05FWFRdKSB7XG4gICAgLy8gTm90ZTogY3VycmVudCBjYW4gYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHkgaW50ZXJlc3RlZFxuICAgIC8vIGluIExDb250YWluZXIuIFdlIGNhbiB0ZWxsIGl0J3MgYW4gTENvbnRhaW5lciBiZWNhdXNlIGl0cyBsZW5ndGggaXMgbGVzcyB0aGFuIHRoZSBMVmlld1xuICAgIC8vIGhlYWRlci5cbiAgICBpZiAoY3VycmVudFtBQ1RJVkVfSU5ERVhdID09PSAtMSAmJiBpc0xDb250YWluZXIoY3VycmVudCkpIHtcbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGN1cnJlbnQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZHluYW1pY1ZpZXdEYXRhID0gY3VycmVudFtpXTtcbiAgICAgICAgLy8gVGhlIGRpcmVjdGl2ZXMgYW5kIHBpcGVzIGFyZSBub3QgbmVlZGVkIGhlcmUgYXMgYW4gZXhpc3RpbmcgdmlldyBpcyBvbmx5IGJlaW5nXG4gICAgICAgIC8vIHJlZnJlc2hlZC5cbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoZHluYW1pY1ZpZXdEYXRhLCBkeW5hbWljVmlld0RhdGFbVFZJRVddLCBkeW5hbWljVmlld0RhdGFbQ09OVEVYVF0gISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBhZGp1c3RlZEVsZW1lbnRJbmRleCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXBvbmVudFJlZnJlc2goaG9zdExWaWV3OiBMVmlldywgYWRqdXN0ZWRFbGVtZW50SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UoaG9zdExWaWV3LCBhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChhZGp1c3RlZEVsZW1lbnRJbmRleCwgaG9zdExWaWV3KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb2RlVHlwZShob3N0TFZpZXdbVFZJRVddLmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgLy8gT25seSBjb21wb25lbnRzIGluIGNyZWF0aW9uIG1vZGUsIGF0dGFjaGVkIENoZWNrQWx3YXlzXG4gIC8vIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICgodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSB8fCBpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpKSAmJlxuICAgICAgY29tcG9uZW50Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgc3luY1ZpZXdXaXRoQmx1ZXByaW50KGNvbXBvbmVudFZpZXcpO1xuICAgIGNoZWNrVmlldyhjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNzIGFuIExWaWV3IGluc3RhbmNlIHdpdGggaXRzIGJsdWVwcmludCBpZiB0aGV5IGhhdmUgZ290dGVuIG91dCBvZiBzeW5jLlxuICpcbiAqIFR5cGljYWxseSwgYmx1ZXByaW50cyBhbmQgdGhlaXIgdmlldyBpbnN0YW5jZXMgc2hvdWxkIGFsd2F5cyBiZSBpbiBzeW5jLCBzbyB0aGUgbG9vcCBoZXJlXG4gKiB3aWxsIGJlIHNraXBwZWQuIEhvd2V2ZXIsIGNvbnNpZGVyIHRoaXMgY2FzZSBvZiB0d28gY29tcG9uZW50cyBzaWRlLWJ5LXNpZGU6XG4gKlxuICogQXBwIHRlbXBsYXRlOlxuICogYGBgXG4gKiA8Y29tcD48L2NvbXA+XG4gKiA8Y29tcD48L2NvbXA+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdpbGwgaGFwcGVuOlxuICogMS4gQXBwIHRlbXBsYXRlIGJlZ2lucyBwcm9jZXNzaW5nLlxuICogMi4gRmlyc3QgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogMy4gU2Vjb25kIDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDQuIEFwcCB0ZW1wbGF0ZSBjb21wbGV0ZXMgcHJvY2Vzc2luZywgc28gaXQncyB0aW1lIHRvIGNoZWNrIGNoaWxkIHRlbXBsYXRlcy5cbiAqIDUuIEZpcnN0IDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdCBoYXMgYSBkaXJlY3RpdmUsIHNvIGl0cyBkZWYgaXMgcHVzaGVkIHRvIGJsdWVwcmludC5cbiAqIDYuIFNlY29uZCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXRzIGJsdWVwcmludCBoYXMgYmVlbiB1cGRhdGVkIGJ5IHRoZSBmaXJzdFxuICogPGNvbXA+IHRlbXBsYXRlLCBidXQgaXRzIExWaWV3IHdhcyBjcmVhdGVkIGJlZm9yZSB0aGlzIHVwZGF0ZSwgc28gaXQgaXMgb3V0IG9mIHN5bmMuXG4gKlxuICogTm90ZSB0aGF0IGVtYmVkZGVkIHZpZXdzIGluc2lkZSBuZ0ZvciBsb29wcyB3aWxsIG5ldmVyIGJlIG91dCBvZiBzeW5jIGJlY2F1c2UgdGhlc2Ugdmlld3NcbiAqIGFyZSBwcm9jZXNzZWQgYXMgc29vbiBhcyB0aGV5IGFyZSBjcmVhdGVkLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRWaWV3IFRoZSB2aWV3IHRvIHN5bmNcbiAqL1xuZnVuY3Rpb24gc3luY1ZpZXdXaXRoQmx1ZXByaW50KGNvbXBvbmVudFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSBjb21wb25lbnRWaWV3Lmxlbmd0aDsgaSA8IGNvbXBvbmVudFRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGNvbXBvbmVudFZpZXdbaV0gPSBjb21wb25lbnRUVmlldy5ibHVlcHJpbnRbaV07XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3IG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihsVmlldzogTFZpZXcsIGxWaWV3T3JMQ29udGFpbmVyOiBUKTogVCB7XG4gIC8vIFRPRE8oYmVubGVzaC9taXNrbyk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgaW5jb3JyZWN0LCBiZWNhdXNlIGl0IGFsd2F5cyBhZGRzIHRoZSBMQ29udGFpbmVyXG4gIC8vIHRvXG4gIC8vIHRoZSBlbmQgb2YgdGhlIHF1ZXVlLCB3aGljaCBtZWFucyBpZiB0aGUgZGV2ZWxvcGVyIHJldHJpZXZlcyB0aGUgTENvbnRhaW5lcnMgZnJvbSBSTm9kZXMgb3V0XG4gIC8vIG9mXG4gIC8vIG9yZGVyLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biBvdXQgb2Ygb3JkZXIsIGFzIHRoZSBhY3Qgb2YgcmV0cmlldmluZyB0aGUgdGhlXG4gIC8vIExDb250YWluZXJcbiAgLy8gZnJvbSB0aGUgUk5vZGUgaXMgd2hhdCBhZGRzIGl0IHRvIHRoZSBxdWV1ZS5cbiAgaWYgKGxWaWV3W0NISUxEX0hFQURdKSB7XG4gICAgbFZpZXdbQ0hJTERfVEFJTF0gIVtORVhUXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIGxWaWV3W0NISUxEX0hFQURdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH1cbiAgbFZpZXdbQ0hJTERfVEFJTF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICB3aGlsZSAobFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ICE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljayhyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShyZWFkUGF0Y2hlZExWaWV3KHJvb3RDb21wb25lbnQpICEsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gdmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcblxuICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcblxuICB0cnkge1xuICAgIGlmIChpc0NyZWF0aW9uTW9kZSh2aWV3KSkge1xuICAgICAgY2hlY2tWaWV3KHZpZXcsIGNvbnRleHQpOyAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gICAgfVxuICAgIGNoZWNrVmlldyh2aWV3LCBjb250ZXh0KTsgIC8vIHVwZGF0ZSBtb2RlIHBhc3NcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBoYW5kbGVFcnJvcih2aWV3LCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3IgYW5kIGl0cyBjaGlsZHJlbiwgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmUgZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXM8VD4oY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIGNvbnN0IHZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZShjb21wb25lbnQpO1xuICBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHZpZXcsIGNvbXBvbmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodmlldywgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKiogQ2hlY2tzIHRoZSB2aWV3IG9mIHRoZSBjb21wb25lbnQgcHJvdmlkZWQuIERvZXMgbm90IGdhdGUgb24gZGlydHkgY2hlY2tzIG9yIGV4ZWN1dGUgZG9DaGVjay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrVmlldzxUPihob3N0VmlldzogTFZpZXcsIGNvbXBvbmVudDogVCkge1xuICBjb25zdCBob3N0VFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W1RfSE9TVF0pO1xuICBjb25zdCB0ZW1wbGF0ZUZuID0gaG9zdFRWaWV3LnRlbXBsYXRlICE7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZSA9IGlzQ3JlYXRpb25Nb2RlKGhvc3RWaWV3KTtcblxuICAvLyBXaWxsIGJlY29tZSB0cnVlIGlmIHRoZSBgdHJ5YCBibG9jayBleGVjdXRlcyB3aXRoIG5vIGVycm9ycy5cbiAgbGV0IHNhZmVUb1J1bkhvb2tzID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhob3N0Vmlldyk7XG4gICAgY3JlYXRpb25Nb2RlICYmIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIGhvc3RUVmlldywgY29tcG9uZW50KTtcbiAgICBleGVjdXRlVGVtcGxhdGUoaG9zdFZpZXcsIHRlbXBsYXRlRm4sIGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICBzYWZlVG9SdW5Ib29rcyA9IHRydWU7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcsIHNhZmVUb1J1bkhvb2tzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oZmxhZ3M6IFJlbmRlckZsYWdzLCB0VmlldzogVFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgICB2aWV3UXVlcnkoZmxhZ3MsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGJpbmRpbmcgbWV0YWRhdGEgZm9yIGEgcGFydGljdWxhciBiaW5kaW5nIGFuZCBzdG9yZXMgaXQgaW5cbiAqIFRWaWV3LmRhdGEuIFRoZXNlIGFyZSBnZW5lcmF0ZWQgaW4gb3JkZXIgdG8gc3VwcG9ydCBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqXG4gKiBFYWNoIGJpbmRpbmcgLyBpbnRlcnBvbGF0aW9uIHdpbGwgaGF2ZSBvbmUgKGluY2x1ZGluZyBhdHRyaWJ1dGUgYmluZGluZ3MpXG4gKiBiZWNhdXNlIGF0IHRoZSB0aW1lIG9mIGJpbmRpbmcsIHdlIGRvbid0IGtub3cgdG8gd2hpY2ggaW5zdHJ1Y3Rpb24gdGhlIGJpbmRpbmdcbiAqIGJlbG9uZ3MuIEl0IGlzIGFsd2F5cyBzdG9yZWQgaW4gVFZpZXcuZGF0YSBhdCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgYmluZGluZ1xuICogdmFsdWUgaW4gTFZpZXcgKGUuZy4gZm9yIGludGVycG9sYXRpb244LCBpdCB3b3VsZCBiZSBzdG9yZWQgYXQgdGhlIGluZGV4IG9mXG4gKiB0aGUgOHRoIHZhbHVlKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhlIGN1cnJlbnQgYmluZGluZyBpbmRleC5cbiAqIEBwYXJhbSBwcmVmaXggVGhlIHN0YXRpYyBwcmVmaXggc3RyaW5nXG4gKiBAcGFyYW0gc3VmZml4IFRoZSBzdGF0aWMgc3VmZml4IHN0cmluZ1xuICpcbiAqIEByZXR1cm5zIE5ld2x5IGNyZWF0ZWQgYmluZGluZyBtZXRhZGF0YSBzdHJpbmcgZm9yIHRoaXMgYmluZGluZyBvciBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldzogTFZpZXcsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcbiAgY29uc3QgdmFsdWUgPSBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHByZWZpeCArIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgc3VmZml4O1xuXG4gIHJldHVybiB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9PSBudWxsID8gKHREYXRhW2xhc3RCaW5kaW5nSW5kZXhdID0gdmFsdWUpIDogbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZTogVE5vZGUpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIC8vIElmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWQuXG4gIGlmICh0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cbiAgcmV0dXJuIHROb2RlLmlucHV0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAgISgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwICEoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGVsZW1lbnQsIHZhbHVlKSA6IGVsZW1lbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgKGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMpIG9uIHRvIHRoZSBlbGVtZW50IGZyb20gdGhlIHROb2RlLlxuICpcbiAqIEFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSAoaS5lLiBhbnkgdmFsdWVzIGV4dHJhY3RlZCBmcm9tIHRoZSBgc3R5bGVgIG9yIGBjbGFzc2AgYXR0cmlidXRlc1xuICogb24gYW4gZWxlbWVudCkgYXJlIGNvbGxlY3RlZCBpbnRvIHRoZSBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGRhdGEgc3RydWN0dXJlcy5cbiAqIFRoZXNlIHZhbHVlcyBhcmUgcG9wdWxhdGVkIGR1cmluZyB0aGUgY3JlYXRpb24gcGhhc2Ugb2YgYW4gZWxlbWVudCBhbmQgYXJlIHRoZW4gbGF0ZXJcbiAqIGFwcGxpZWQgb25jZSB0aGUgZWxlbWVudCBpcyBpbnN0YW50aWF0ZWQuIFRoaXMgZnVuY3Rpb24gYXBwbGllcyBlYWNoIG9mIHRoZSBzdGF0aWNcbiAqIHN0eWxlIGFuZCBjbGFzcyBlbnRyaWVzIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbmF0aXZlOiBSRWxlbWVudCwgdE5vZGU6IFROb2RlKSB7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuY2xhc3NlcywgdHJ1ZSk7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuc3R5bGVzLCBmYWxzZSk7XG59XG4iXX0=