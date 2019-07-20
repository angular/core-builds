/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../styling/util';
import { renderStylingMap } from '../styling_next/bindings';
import { NO_CHANGE } from '../tokens';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent, getRootContext } from '../util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
import { LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeConstructor, TNodeInitialData, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor, attachLContainerDebug, attachLViewDebug, cloneToLView, cloneToTViewData } from './lview_debug';
import { selectInternal } from './select';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 * @type {?}
 */
const _CLEAN_PROMISE = ((/**
 * @return {?}
 */
() => Promise.resolve(null)))();
/** @enum {number} */
const BindingDirection = {
    Input: 0,
    Output: 1,
};
export { BindingDirection };
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * @param {?} lView
 * @return {?}
 */
export function refreshDescendantViews(lView) {
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const creationMode = isCreationMode(lView);
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = false;
    // Resetting the bindingIndex of the current LView as the next steps may trigger change detection.
    lView[BINDING_INDEX] = tView.bindingStartIndex;
    // If this is a creation pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update pass.
    if (!creationMode) {
        /** @type {?} */
        const checkNoChangesMode = getCheckNoChangesMode();
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
    refreshChildComponents(tView.components);
}
/**
 * Sets the host bindings for the current view.
 * @param {?} tView
 * @param {?} viewData
 * @return {?}
 */
export function setHostBindings(tView, viewData) {
    /** @type {?} */
    const selectedIndex = getSelectedIndex();
    try {
        if (tView.expandoInstructions) {
            /** @type {?} */
            let bindingRootIndex = viewData[BINDING_INDEX] = tView.expandoStartIndex;
            setBindingRoot(bindingRootIndex);
            /** @type {?} */
            let currentDirectiveIndex = -1;
            /** @type {?} */
            let currentElementIndex = -1;
            for (let i = 0; i < tView.expandoInstructions.length; i++) {
                /** @type {?} */
                const instruction = tView.expandoInstructions[i];
                if (typeof instruction === 'number') {
                    if (instruction <= 0) {
                        // Negative numbers mean that we are starting new EXPANDO block and need to update
                        // the current element and directive index.
                        currentElementIndex = -instruction;
                        setActiveHostElement(currentElementIndex);
                        // Injector block and providers are taken into account.
                        /** @type {?} */
                        const providerCount = ((/** @type {?} */ (tView.expandoInstructions[++i])));
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
                        /** @type {?} */
                        const hostCtx = unwrapRNode(viewData[currentDirectiveIndex]);
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
/**
 * Refreshes all content queries declared by directives in a given view
 * @param {?} tView
 * @param {?} lView
 * @return {?}
 */
function refreshContentQueries(tView, lView) {
    /** @type {?} */
    const contentQueries = tView.contentQueries;
    if (contentQueries !== null) {
        for (let i = 0; i < contentQueries.length; i += 2) {
            /** @type {?} */
            const queryStartIdx = contentQueries[i];
            /** @type {?} */
            const directiveDefIdx = contentQueries[i + 1];
            if (directiveDefIdx !== -1) {
                /** @type {?} */
                const directiveDef = (/** @type {?} */ (tView.data[directiveDefIdx]));
                ngDevMode &&
                    assertDefined(directiveDef.contentQueries, 'contentQueries function should be defined');
                setCurrentQueryIndex(queryStartIdx);
                (/** @type {?} */ (directiveDef.contentQueries))(2 /* Update */, lView[directiveDefIdx], directiveDefIdx);
            }
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
        for (let i = 0; i < components.length; i++) {
            componentRefresh(components[i]);
        }
    }
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param {?} name the tag name
 * @param {?=} overriddenRenderer Optional A renderer to override the default one
 * @return {?} the element created
 */
export function elementCreate(name, overriddenRenderer) {
    /** @type {?} */
    let native;
    /** @type {?} */
    const rendererToUse = overriddenRenderer || getLView()[RENDERER];
    /** @type {?} */
    const namespace = getNamespace();
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
/**
 * @template T
 * @param {?} parentLView
 * @param {?} tView
 * @param {?} context
 * @param {?} flags
 * @param {?} host
 * @param {?} tHostNode
 * @param {?=} rendererFactory
 * @param {?=} renderer
 * @param {?=} sanitizer
 * @param {?=} injector
 * @return {?}
 */
export function createLView(parentLView, tView, context, flags, host, tHostNode, rendererFactory, renderer, sanitizer, injector) {
    /** @type {?} */
    const lView = ngDevMode ? cloneToLView(tView.blueprint) : (/** @type {?} */ (tView.blueprint.slice()));
    lView[HOST] = host;
    lView[FLAGS] = flags | 4 /* CreationMode */ | 128 /* Attached */ | 8 /* FirstLViewPass */;
    resetPreOrderHookFlags(lView);
    lView[PARENT] = lView[DECLARATION_VIEW] = parentLView;
    lView[CONTEXT] = context;
    lView[RENDERER_FACTORY] = (/** @type {?} */ ((rendererFactory || parentLView && parentLView[RENDERER_FACTORY])));
    ngDevMode && assertDefined(lView[RENDERER_FACTORY], 'RendererFactory is required');
    lView[RENDERER] = (/** @type {?} */ ((renderer || parentLView && parentLView[RENDERER])));
    ngDevMode && assertDefined(lView[RENDERER], 'Renderer is required');
    lView[SANITIZER] = sanitizer || parentLView && parentLView[SANITIZER] || (/** @type {?} */ (null));
    lView[(/** @type {?} */ (INJECTOR))] = injector || parentLView && parentLView[INJECTOR] || null;
    lView[T_HOST] = tHostNode;
    ngDevMode && attachLViewDebug(lView);
    return lView;
}
/**
 * @param {?} tView
 * @param {?} tHostNode
 * @param {?} index
 * @param {?} type
 * @param {?} name
 * @param {?} attrs
 * @return {?}
 */
export function getOrCreateTNode(tView, tHostNode, index, type, name, attrs) {
    // Keep this function short, so that the VM will inline it.
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    /** @type {?} */
    const tNode = (/** @type {?} */ (tView.data[adjustedIndex])) ||
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index);
    setPreviousOrParentTNode(tNode, true);
    return (/** @type {?} */ (tNode));
}
/**
 * @param {?} tView
 * @param {?} tHostNode
 * @param {?} adjustedIndex
 * @param {?} type
 * @param {?} name
 * @param {?} attrs
 * @param {?} index
 * @return {?}
 */
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index) {
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const isParent = getIsParent();
    /** @type {?} */
    const parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    /** @type {?} */
    const parentInSameView = parent && parent !== tHostNode;
    /** @type {?} */
    const tParentNode = parentInSameView ? (/** @type {?} */ (parent)) : null;
    /** @type {?} */
    const tNode = tView.data[adjustedIndex] =
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
/**
 * @param {?} tView
 * @param {?} tParentNode
 * @param {?} index
 * @param {?} lView
 * @return {?}
 */
export function assignTViewNodeToLView(tView, tParentNode, index, lView) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    /** @type {?} */
    let tNode = tView.node;
    if (tNode == null) {
        ngDevMode && tParentNode &&
            assertNodeOfPossibleTypes(tParentNode, 3 /* Element */, 0 /* Container */);
        tView.node = tNode = (/** @type {?} */ (createTNode(tView, (/** @type {?} */ (tParentNode)), //
        2 /* View */, index, null, null)));
    }
    return lView[T_HOST] = (/** @type {?} */ (tNode));
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 *
 * @param {?} view The LView containing the blueprint to adjust
 * @param {?} numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 * @return {?}
 */
export function allocExpando(view, numSlotsToAlloc) {
    ngDevMode && assertGreaterThan(numSlotsToAlloc, 0, 'The number of slots to alloc should be greater than 0');
    if (numSlotsToAlloc > 0) {
        /** @type {?} */
        const tView = view[TVIEW];
        if (tView.firstTemplatePass) {
            for (let i = 0; i < numSlotsToAlloc; i++) {
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
 * @template T
 * @param {?} tView
 * @param {?} context
 * @param {?} declarationView
 * @param {?} injectorIndex
 * @return {?}
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, injectorIndex) {
    /** @type {?} */
    const _isParent = getIsParent();
    /** @type {?} */
    const _previousOrParentTNode = getPreviousOrParentTNode();
    setPreviousOrParentTNode((/** @type {?} */ (null)), true);
    /** @type {?} */
    const lView = createLView(declarationView, tView, context, 16 /* CheckAlways */, null, null);
    lView[DECLARATION_VIEW] = declarationView;
    assignTViewNodeToLView(tView, null, -1, lView);
    if (tView.firstTemplatePass) {
        (/** @type {?} */ (tView.node)).injectorIndex = injectorIndex;
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
 * @template T
 * @param {?} viewToRender
 * @param {?} tView
 * @param {?} context
 * @return {?}
 */
export function renderEmbeddedTemplate(viewToRender, tView, context) {
    /** @type {?} */
    const _isParent = getIsParent();
    /** @type {?} */
    const _previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    let oldView;
    if (viewToRender[FLAGS] & 512 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(getRootContext(viewToRender));
    }
    else {
        // Will become true if the `try` block executes with no errors.
        /** @type {?} */
        let safeToRunHooks = false;
        try {
            setPreviousOrParentTNode((/** @type {?} */ (null)), true);
            oldView = enterView(viewToRender, viewToRender[T_HOST]);
            resetPreOrderHookFlags(viewToRender);
            executeTemplate(viewToRender, (/** @type {?} */ (tView.template)), getRenderFlags(viewToRender), context);
            // This must be set to false immediately after the first creation run because in an
            // ngFor loop, all the views will be created together before update mode runs and turns
            // off firstTemplatePass. If we don't set it here, instances will perform directive
            // matching, etc again and again.
            viewToRender[TVIEW].firstTemplatePass = false;
            refreshDescendantViews(viewToRender);
            safeToRunHooks = true;
        }
        finally {
            leaveView((/** @type {?} */ (oldView)), safeToRunHooks);
            setPreviousOrParentTNode(_previousOrParentTNode, _isParent);
        }
    }
}
/**
 * @template T
 * @param {?} hostView
 * @param {?} context
 * @param {?=} templateFn
 * @return {?}
 */
export function renderComponentOrTemplate(hostView, context, templateFn) {
    /** @type {?} */
    const rendererFactory = hostView[RENDERER_FACTORY];
    /** @type {?} */
    const oldView = enterView(hostView, hostView[T_HOST]);
    /** @type {?} */
    const normalExecutionPath = !getCheckNoChangesMode();
    /** @type {?} */
    const creationModeIsActive = isCreationMode(hostView);
    // Will become true if the `try` block executes with no errors.
    /** @type {?} */
    let safeToRunHooks = false;
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
/**
 * @template T
 * @param {?} lView
 * @param {?} templateFn
 * @param {?} rf
 * @param {?} context
 * @return {?}
 */
function executeTemplate(lView, templateFn, rf, context) {
    namespaceHTMLInternal();
    /** @type {?} */
    const prevSelectedIndex = getSelectedIndex();
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
 * @param {?} view
 * @return {?}
 */
function getRenderFlags(view) {
    return isCreationMode(view) ? 1 /* Create */ : 2 /* Update */;
}
//////////////////////////
//// Element
//////////////////////////
/**
 * @param {?} tView
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function executeContentQueries(tView, tNode, lView) {
    if (isContentQueryHost(tNode)) {
        /** @type {?} */
        const start = tNode.directiveStart;
        /** @type {?} */
        const end = tNode.directiveEnd;
        for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
            /** @type {?} */
            const def = (/** @type {?} */ (tView.data[directiveIndex]));
            if (def.contentQueries) {
                def.contentQueries(1 /* Create */, lView[directiveIndex], directiveIndex);
            }
        }
    }
}
/**
 * Creates directive instances and populates local refs.
 *
 * @param {?} tView
 * @param {?} lView
 * @param {?} tNode
 * @param {?=} localRefExtractor mapping function that extracts local ref value from TNode
 * @return {?}
 */
export function createDirectivesAndLocals(tView, lView, tNode, localRefExtractor = getNativeByTNode) {
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
 * @param {?} viewData
 * @param {?} tNode
 * @param {?} localRefExtractor
 * @return {?}
 */
function saveResolvedLocalsInData(viewData, tNode, localRefExtractor) {
    /** @type {?} */
    const localNames = tNode.localNames;
    if (localNames) {
        /** @type {?} */
        let localIndex = tNode.index + 1;
        for (let i = 0; i < localNames.length; i += 2) {
            /** @type {?} */
            const index = (/** @type {?} */ (localNames[i + 1]));
            /** @type {?} */
            const value = index === -1 ?
                localRefExtractor((/** @type {?} */ (tNode)), viewData) :
                viewData[index];
            viewData[localIndex++] = value;
        }
    }
}
/**
 * Gets TView from a template function or creates a new TView
 * if it doesn't already exist.
 *
 * @param {?} def ComponentDef
 * @return {?} TView
 */
export function getOrCreateTView(def) {
    return def.tView || (def.tView = createTView(-1, def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas));
}
/**
 * Creates a TView instance
 *
 * @param {?} viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param {?} templateFn Template function
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars
 * @param {?} directives Registry of directives for this view
 * @param {?} pipes Registry of pipes for this view
 * @param {?} viewQuery View queries for this view
 * @param {?} schemas Schemas for this view
 * @return {?}
 */
export function createTView(viewIndex, templateFn, consts, vars, directives, pipes, viewQuery, schemas) {
    ngDevMode && ngDevMode.tView++;
    /** @type {?} */
    const bindingStartIndex = HEADER_OFFSET + consts;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    /** @type {?} */
    const initialViewLength = bindingStartIndex + vars;
    /** @type {?} */
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[(/** @type {?} */ (TVIEW))] = ngDevMode ?
        new TViewConstructor(viewIndex, // id: number,
        blueprint, // blueprint: LView,
        templateFn, // template: ComponentTemplate<{}>|null,
        null, // queries: TQueries|null
        viewQuery, (/** @type {?} */ (null)), // node: TViewNode|TElementNode|null,
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
            node: (/** @type {?} */ (null)),
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
/**
 * @param {?} bindingStartIndex
 * @param {?} initialViewLength
 * @return {?}
 */
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    /** @type {?} */
    const blueprint = (/** @type {?} */ (new (ngDevMode ? (/** @type {?} */ (LViewBlueprint)) : Array)(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex)));
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
}
/**
 * @param {?} text
 * @param {?} token
 * @return {?}
 */
export function createError(text, token) {
    return new Error(`Renderer: ${text} [${stringifyForError(token)}]`);
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param {?} factory
 * @param {?} elementOrSelector Render element or CSS selector to locate the element.
 * @return {?}
 */
export function locateHostElement(factory, elementOrSelector) {
    /** @type {?} */
    const defaultRenderer = factory.createRenderer(null, null);
    /** @type {?} */
    const rNode = typeof elementOrSelector === 'string' ?
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
 * @param {?} lView
 * @param {?} context
 * @param {?} cleanupFn
 * @return {?}
 */
export function storeCleanupWithContext(lView, context, cleanupFn) {
    /** @type {?} */
    const lCleanup = getCleanup(lView);
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
 * @param {?} view
 * @param {?} cleanupFn
 * @return {?}
 */
export function storeCleanupFn(view, cleanupFn) {
    getCleanup(view).push(cleanupFn);
    if (view[TVIEW].firstTemplatePass) {
        getTViewCleanup(view).push((/** @type {?} */ (view[CLEANUP])).length - 1, null);
    }
}
/**
 * Constructs a TNode object from the arguments.
 *
 * @param {?} tView `TView` to which this `TNode` belongs (used only in `ngDevMode`)
 * @param {?} tParent
 * @param {?} type The type of the node
 * @param {?} adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param {?} tagName The tag name of the node
 * @param {?} attrs The attributes defined on this node
 * @return {?} the TNode object
 */
export function createTNode(tView, tParent, type, adjustedIndex, tagName, attrs) {
    ngDevMode && ngDevMode.tNode++;
    /** @type {?} */
    let injectorIndex = tParent ? tParent.injectorIndex : -1;
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
    null, // stylingTemplate: StylingContext|null
    null, // projection: number|(ITNode|RNode[])[]|null
    null, // onElementCreationFns: Function[]|null
    null, // newStyles: TStylingContext|null
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
            stylingTemplate: null,
            projection: null,
            onElementCreationFns: null,
            styles: null,
            classes: null,
        };
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param {?} tNode
 * @param {?} direction whether to consider inputs or outputs
 * @return {?} PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
export function generatePropertyAliases(tNode, direction) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    /** @type {?} */
    let propStore = null;
    /** @type {?} */
    const start = tNode.directiveStart;
    /** @type {?} */
    const end = tNode.directiveEnd;
    if (end > start) {
        /** @type {?} */
        const isInput = direction === 0 /* Input */;
        /** @type {?} */
        const defs = tView.data;
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const directiveDef = (/** @type {?} */ (defs[i]));
            /** @type {?} */
            const propertyAliasMap = isInput ? directiveDef.inputs : directiveDef.outputs;
            for (let publicName in propertyAliasMap) {
                if (propertyAliasMap.hasOwnProperty(publicName)) {
                    propStore = propStore || {};
                    /** @type {?} */
                    const internalName = propertyAliasMap[publicName];
                    /** @type {?} */
                    const hasProperty = propStore.hasOwnProperty(publicName);
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
 * @type {?}
 */
const ATTR_TO_PROP = {
    'class': 'className',
    'for': 'htmlFor',
    'formaction': 'formAction',
    'innerHtml': 'innerHTML',
    'readonly': 'readOnly',
    'tabindex': 'tabIndex',
};
/**
 * @template T
 * @param {?} index
 * @param {?} propName
 * @param {?} value
 * @param {?=} sanitizer
 * @param {?=} nativeOnly
 * @param {?=} loadRendererFn
 * @return {?}
 */
export function elementPropertyInternal(index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    ngDevMode && assertNotSame(value, (/** @type {?} */ (NO_CHANGE)), 'Incoming value should never be NO_CHANGE.');
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    let inputData;
    /** @type {?} */
    let dataValue;
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
                for (let i = 0; i < dataValue.length; i += 3) {
                    setNgReflectProperty(lView, element, tNode.type, (/** @type {?} */ (dataValue[i + 2])), value);
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
        /** @type {?} */
        const renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property
        // is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? ((/** @type {?} */ (sanitizer(value, tNode.tagName || '', propName)))) : value;
        if (isProceduralRenderer(renderer)) {
            renderer.setProperty((/** @type {?} */ (element)), propName, value);
        }
        else if (!isAnimationProp(propName)) {
            ((/** @type {?} */ (element))).setProperty ? ((/** @type {?} */ (element))).setProperty(propName, value) :
                ((/** @type {?} */ (element)))[propName] = value;
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
/**
 * If node is an OnPush component, marks its LView dirty.
 * @param {?} lView
 * @param {?} viewIndex
 * @return {?}
 */
function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    /** @type {?} */
    const childComponentLView = getComponentViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 64 /* Dirty */;
    }
}
/**
 * @param {?} lView
 * @param {?} element
 * @param {?} type
 * @param {?} attrName
 * @param {?} value
 * @return {?}
 */
export function setNgReflectProperty(lView, element, type, attrName, value) {
    /** @type {?} */
    const renderer = lView[RENDERER];
    attrName = normalizeDebugBindingName(attrName);
    /** @type {?} */
    const debugValue = normalizeDebugBindingValue(value);
    if (type === 3 /* Element */) {
        if (value == null) {
            isProceduralRenderer(renderer) ? renderer.removeAttribute(((/** @type {?} */ (element))), attrName) :
                ((/** @type {?} */ (element))).removeAttribute(attrName);
        }
        else {
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(((/** @type {?} */ (element))), attrName, debugValue) :
                ((/** @type {?} */ (element))).setAttribute(attrName, debugValue);
        }
    }
    else {
        /** @type {?} */
        const textContent = `bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`;
        if (isProceduralRenderer(renderer)) {
            renderer.setValue(((/** @type {?} */ (element))), textContent);
        }
        else {
            ((/** @type {?} */ (element))).textContent = textContent;
        }
    }
}
/**
 * @param {?} hostView
 * @param {?} element
 * @param {?} propName
 * @param {?} tNode
 * @return {?}
 */
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
/**
 * @param {?} hostView
 * @param {?} tagName
 * @return {?}
 */
function matchingSchemas(hostView, tagName) {
    /** @type {?} */
    const schemas = hostView[TVIEW].schemas;
    if (schemas !== null) {
        for (let i = 0; i < schemas.length; i++) {
            /** @type {?} */
            const schema = schemas[i];
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
 * @param {?} tNode
 * @param {?} lView
 * @param {?} propName
 * @param {?} tData
 * @param {?} nativeOnly
 * @return {?}
 */
function savePropertyDebugData(tNode, lView, propName, tData, nativeOnly) {
    /** @type {?} */
    const lastBindingIndex = lView[BINDING_INDEX] - 1;
    // Bind/interpolation functions save binding metadata in the last binding index,
    // but leave the property name blank. If the interpolation delimiter is at the 0
    // index, we know that this is our first pass and the property name still needs to
    // be set.
    /** @type {?} */
    const bindingMetadata = (/** @type {?} */ (tData[lastBindingIndex]));
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
 * @param {?} propName Name of the invalid property.
 * @param {?} tNode Node on which we encountered the error.
 * @return {?}
 */
function createUnknownPropertyError(propName, tNode) {
    return new Error(`Template error: Can't bind to '${propName}' since it isn't a known property of '${tNode.tagName}'.`);
}
/**
 * Instantiate a root component.
 * @template T
 * @param {?} tView
 * @param {?} viewData
 * @param {?} def
 * @return {?}
 */
export function instantiateRootComponent(tView, viewData, def) {
    /** @type {?} */
    const rootTNode = getPreviousOrParentTNode();
    if (tView.firstTemplatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        generateExpandoInstructionBlock(tView, rootTNode, 1);
        baseResolveDirective(tView, viewData, def, def.factory);
    }
    /** @type {?} */
    const directive = getNodeInjectable(tView.data, viewData, viewData.length - 1, (/** @type {?} */ (rootTNode)));
    postProcessBaseDirective(viewData, rootTNode, directive);
    return directive;
}
/**
 * Resolve the matched directives on a node.
 * @param {?} tView
 * @param {?} lView
 * @param {?} tNode
 * @param {?} localRefs
 * @return {?}
 */
export function resolveDirectives(tView, lView, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in
    // tsickle.
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
    if (!getBindingsEnabled())
        return;
    /** @type {?} */
    const directives = findDirectiveMatches(tView, lView, tNode);
    /** @type {?} */
    const exportsMap = localRefs ? { '': -1 } : null;
    if (directives) {
        initNodeFlags(tNode, tView.data.length, directives.length);
        // When the same token is provided by several directives on the same node, some rules apply in
        // the viewEngine:
        // - viewProviders have priority over providers
        // - the last directive in NgModule.declarations has priority over the previous one
        // So to match these rules, the order in which providers are added in the arrays is very
        // important.
        for (let i = 0; i < directives.length; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (directives[i]));
            if (def.providersResolver)
                def.providersResolver(def);
        }
        generateExpandoInstructionBlock(tView, tNode, directives.length);
        /** @type {?} */
        const initialPreOrderHooksLength = (tView.preOrderHooks && tView.preOrderHooks.length) || 0;
        /** @type {?} */
        const initialPreOrderCheckHooksLength = (tView.preOrderCheckHooks && tView.preOrderCheckHooks.length) || 0;
        /** @type {?} */
        const nodeIndex = tNode.index - HEADER_OFFSET;
        for (let i = 0; i < directives.length; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (directives[i]));
            /** @type {?} */
            const directiveDefIdx = tView.data.length;
            baseResolveDirective(tView, lView, def, def.factory);
            saveNameToExportMap((/** @type {?} */ (tView.data)).length - 1, def, exportsMap);
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
 * @param {?} tView
 * @param {?} lView
 * @param {?} tNode
 * @return {?}
 */
function instantiateAllDirectives(tView, lView, tNode) {
    /** @type {?} */
    const start = tNode.directiveStart;
    /** @type {?} */
    const end = tNode.directiveEnd;
    if (!tView.firstTemplatePass && start < end) {
        getOrCreateNodeInjectorForNode((/** @type {?} */ (tNode)), lView);
    }
    for (let i = start; i < end; i++) {
        /** @type {?} */
        const def = (/** @type {?} */ (tView.data[i]));
        if (isComponentDef(def)) {
            addComponentLogic(lView, tNode, (/** @type {?} */ (def)));
        }
        /** @type {?} */
        const directive = getNodeInjectable(tView.data, (/** @type {?} */ (lView)), i, (/** @type {?} */ (tNode)));
        postProcessDirective(lView, directive, def, i);
    }
}
/**
 * @param {?} tView
 * @param {?} viewData
 * @param {?} tNode
 * @return {?}
 */
function invokeDirectivesHostBindings(tView, viewData, tNode) {
    /** @type {?} */
    const start = tNode.directiveStart;
    /** @type {?} */
    const end = tNode.directiveEnd;
    /** @type {?} */
    const expando = (/** @type {?} */ (tView.expandoInstructions));
    /** @type {?} */
    const firstTemplatePass = tView.firstTemplatePass;
    /** @type {?} */
    const elementIndex = tNode.index - HEADER_OFFSET;
    /** @type {?} */
    const selectedIndex = getSelectedIndex();
    try {
        setActiveHostElement(elementIndex);
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (tView.data[i]));
            /** @type {?} */
            const directive = viewData[i];
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
/**
 * @param {?} def
 * @param {?} expando
 * @param {?} directive
 * @param {?} tNode
 * @param {?} firstTemplatePass
 * @return {?}
 */
export function invokeHostBindingsInCreationMode(def, expando, directive, tNode, firstTemplatePass) {
    /** @type {?} */
    const previousExpandoLength = expando.length;
    setCurrentDirectiveDef(def);
    /** @type {?} */
    const elementIndex = tNode.index - HEADER_OFFSET;
    (/** @type {?} */ (def.hostBindings))(1 /* Create */, directive, elementIndex);
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
 * @param {?} tView
 * @param {?} tNode
 * @param {?} directiveCount
 * @return {?}
 */
export function generateExpandoInstructionBlock(tView, tNode, directiveCount) {
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'Expando block should only be generated on first template pass.');
    /** @type {?} */
    const elementIndex = -(tNode.index - HEADER_OFFSET);
    /** @type {?} */
    const providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    /** @type {?} */
    const providerCount = tView.data.length - providerStartIndex;
    (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, providerCount, directiveCount);
}
/**
 * Process a directive on the current node after its creation.
 * @template T
 * @param {?} viewData
 * @param {?} directive
 * @param {?} def
 * @param {?} directiveDefIdx
 * @return {?}
 */
function postProcessDirective(viewData, directive, def, directiveDefIdx) {
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    postProcessBaseDirective(viewData, previousOrParentTNode, directive);
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, directive, def, previousOrParentTNode);
    }
    if (viewData[TVIEW].firstTemplatePass && def.contentQueries) {
        previousOrParentTNode.flags |= 4 /* hasContentQuery */;
    }
    if (isComponentDef(def)) {
        /** @type {?} */
        const componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
        componentView[CONTEXT] = directive;
    }
}
/**
 * A lighter version of postProcessDirective() that is used for the root component.
 * @template T
 * @param {?} lView
 * @param {?} previousOrParentTNode
 * @param {?} directive
 * @return {?}
 */
function postProcessBaseDirective(lView, previousOrParentTNode, directive) {
    /** @type {?} */
    const native = getNativeByTNode(previousOrParentTNode, lView);
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
 * @param {?} tView
 * @param {?} viewData
 * @param {?} tNode
 * @return {?}
 */
function findDirectiveMatches(tView, viewData, tNode) {
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
    /** @type {?} */
    const registry = tView.directiveRegistry;
    /** @type {?} */
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (registry[i]));
            if (isNodeMatchingSelectorList(tNode, (/** @type {?} */ (def.selectors)), /* isProjectionMode */ false)) {
                matches || (matches = ngDevMode ? new (/** @type {?} */ (MatchesArray))() : []);
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
/**
 * Stores index of component's host element so it will be queued for view refresh during CD.
 * @param {?} previousOrParentTNode
 * @return {?}
 */
export function queueComponentIndexForCheck(previousOrParentTNode) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.components || (tView.components = ngDevMode ? new (/** @type {?} */ (TViewComponents))() : [])).push(previousOrParentTNode.index);
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
        /** @type {?} */
        const localNames = tNode.localNames =
            ngDevMode ? new (/** @type {?} */ (TNodeLocalNames))() : [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let i = 0; i < localRefs.length; i += 2) {
            /** @type {?} */
            const index = exportsMap[localRefs[i + 1]];
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
        if (def.exportAs) {
            for (let i = 0; i < def.exportAs.length; i++) {
                exportsMap[def.exportAs[i]] = index;
            }
        }
        if (((/** @type {?} */ (def))).template)
            exportsMap[''] = index;
    }
}
/**
 * Initializes the flags on the current node, setting all indices to the initial index,
 * the directive count to 0, and adding the isComponent flag.
 * @param {?} tNode
 * @param {?} index the initial index
 * @param {?} numberOfDirectives
 * @return {?}
 */
export function initNodeFlags(tNode, index, numberOfDirectives) {
    /** @type {?} */
    const flags = tNode.flags;
    ngDevMode && assertEqual(flags === 0 || flags === 1 /* isComponent */, true, 'expected node flags to not be initialized');
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    // When the first directive is created on a node, save the index
    tNode.flags = flags & 1 /* isComponent */;
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
    tNode.providerIndexes = index;
}
/**
 * @template T
 * @param {?} tView
 * @param {?} viewData
 * @param {?} def
 * @param {?} directiveFactory
 * @return {?}
 */
function baseResolveDirective(tView, viewData, def, directiveFactory) {
    tView.data.push(def);
    /** @type {?} */
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} previousOrParentTNode
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(lView, previousOrParentTNode, def) {
    /** @type {?} */
    const native = getNativeByTNode(previousOrParentTNode, lView);
    /** @type {?} */
    const tView = getOrCreateTView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    /** @type {?} */
    const rendererFactory = lView[RENDERER_FACTORY];
    /** @type {?} */
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, lView[previousOrParentTNode.index], (/** @type {?} */ (previousOrParentTNode)), rendererFactory, rendererFactory.createRenderer((/** @type {?} */ (native)), def)));
    componentView[T_HOST] = (/** @type {?} */ (previousOrParentTNode));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[previousOrParentTNode.index] = componentView;
    if (lView[TVIEW].firstTemplatePass) {
        queueComponentIndexForCheck(previousOrParentTNode);
    }
}
/**
 * @param {?} index
 * @param {?} name
 * @param {?} value
 * @param {?} lView
 * @param {?=} sanitizer
 * @param {?=} namespace
 * @return {?}
 */
export function elementAttributeInternal(index, name, value, lView, sanitizer, namespace) {
    ngDevMode && assertNotSame(value, (/** @type {?} */ (NO_CHANGE)), 'Incoming value should never be NO_CHANGE.');
    ngDevMode && validateAgainstEventAttributes(name);
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const renderer = lView[RENDERER];
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
        /** @type {?} */
        const tNode = getTNode(index, lView);
        /** @type {?} */
        const strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tNode.tagName || '', name);
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
 * @template T
 * @param {?} directiveIndex Index of the directive in directives array
 * @param {?} instance Instance of the directive on which to set the initial inputs
 * @param {?} def The directive def that contains the list of inputs
 * @param {?} tNode The static data for this node
 * @return {?}
 */
function setInputsFromAttrs(directiveIndex, instance, def, tNode) {
    /** @type {?} */
    let initialInputData = (/** @type {?} */ (tNode.initialInputs));
    if (initialInputData === undefined || directiveIndex >= initialInputData.length) {
        initialInputData = generateInitialInputs(directiveIndex, def.inputs, tNode);
    }
    /** @type {?} */
    const initialInputs = initialInputData[directiveIndex];
    if (initialInputs) {
        /** @type {?} */
        const setInput = def.setInput;
        for (let i = 0; i < initialInputs.length;) {
            /** @type {?} */
            const publicName = initialInputs[i++];
            /** @type {?} */
            const privateName = initialInputs[i++];
            /** @type {?} */
            const value = initialInputs[i++];
            if (setInput) {
                (/** @type {?} */ (def.setInput))(instance, value, publicName, privateName);
            }
            else {
                ((/** @type {?} */ (instance)))[privateName] = value;
            }
            if (ngDevMode) {
                /** @type {?} */
                const lView = getLView();
                /** @type {?} */
                const nativeElement = (/** @type {?} */ (getNativeByTNode(tNode, lView)));
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
    /** @type {?} */
    const initialInputData = tNode.initialInputs || (tNode.initialInputs = ngDevMode ? new (/** @type {?} */ (TNodeInitialInputs))() : []);
    // Ensure that we don't create sparse arrays
    for (let i = initialInputData.length; i <= directiveIndex; i++) {
        initialInputData.push(null);
    }
    /** @type {?} */
    const attrs = (/** @type {?} */ (tNode.attrs));
    /** @type {?} */
    let i = 0;
    while (i < attrs.length) {
        /** @type {?} */
        const attrName = attrs[i];
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
        /** @type {?} */
        const minifiedInputName = inputs[(/** @type {?} */ (attrName))];
        /** @type {?} */
        const attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            /** @type {?} */
            const inputsToStore = initialInputData[directiveIndex] ||
                (initialInputData[directiveIndex] = ngDevMode ? new (/** @type {?} */ (TNodeInitialData))() : []);
            inputsToStore.push((/** @type {?} */ (attrName)), minifiedInputName, (/** @type {?} */ (attrValue)));
        }
        i += 2;
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
// Not sure why I need to do `any` here but TS complains later.
/** @type {?} */
const LContainerArray = ngDevMode && createNamedArrayType('LContainer');
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param {?} hostNative The host element for the LContainer
 * @param {?} currentView The parent view of the LContainer
 * @param {?} native The native comment element
 * @param {?} tNode
 * @param {?=} isForViewContainerRef Optional a flag indicating the ViewContainerRef case
 * @return {?} LContainer
 */
export function createLContainer(hostNative, currentView, native, tNode, isForViewContainerRef) {
    ngDevMode && assertDomNode(native);
    ngDevMode && assertLView(currentView);
    // https://jsperf.com/array-literal-vs-new-array-really
    /** @type {?} */
    const lContainer = new (ngDevMode ? LContainerArray : Array)(hostNative, // host native
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
 * @param {?} lView
 * @return {?}
 */
function refreshDynamicEmbeddedViews(lView) {
    for (let current = lView[CHILD_HEAD]; current !== null; current = current[NEXT]) {
        // Note: current can be an LView or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LView
        // header.
        if (current[ACTIVE_INDEX] === -1 && isLContainer(current)) {
            for (let i = CONTAINER_HEADER_OFFSET; i < current.length; i++) {
                /** @type {?} */
                const dynamicViewData = current[i];
                // The directives and pipes are not needed here as an existing view is only being
                // refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], (/** @type {?} */ (dynamicViewData[CONTEXT])));
            }
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param {?} adjustedElementIndex  Element index in LView[] (adjusted for HEADER_OFFSET)
 * @return {?}
 */
export function componentRefresh(adjustedElementIndex) {
    /** @type {?} */
    const lView = getLView();
    ngDevMode && assertDataInRange(lView, adjustedElementIndex);
    /** @type {?} */
    const hostView = getComponentViewByIndex(adjustedElementIndex, lView);
    ngDevMode && assertNodeType((/** @type {?} */ (lView[TVIEW].data[adjustedElementIndex])), 3 /* Element */);
    // Only components in creation mode, attached CheckAlways
    // components or attached, dirty OnPush components should be checked
    if ((viewAttachedToChangeDetector(hostView) || isCreationMode(lView)) &&
        hostView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
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
 * @param {?} componentView The view to sync
 * @return {?}
 */
function syncViewWithBlueprint(componentView) {
    /** @type {?} */
    const componentTView = componentView[TVIEW];
    for (let i = componentView.length; i < componentTView.blueprint.length; i++) {
        componentView[i] = componentTView.blueprint[i];
    }
}
/**
 * Adds LView or LContainer to the end of the current view tree.
 *
 * This structure will be used to traverse through nested views to remove listeners
 * and call onDestroy callbacks.
 *
 * @template T
 * @param {?} lView The view where LView or LContainer should be added
 * @param {?} lViewOrLContainer The LView or LContainer to add to the view tree
 * @return {?} The state passed in
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
        (/** @type {?} */ (lView[CHILD_TAIL]))[NEXT] = lViewOrLContainer;
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
 * @param {?} lView The starting LView to mark dirty
 * @return {?} the root LView
 */
export function markViewDirty(lView) {
    while (lView) {
        lView[FLAGS] |= 64 /* Dirty */;
        /** @type {?} */
        const parent = getLViewParent(lView);
        // Stop traversing up as soon as you find a root view that wasn't attached to any container
        if (isRootView(lView) && !parent) {
            return lView;
        }
        // continue otherwise
        lView = (/** @type {?} */ (parent));
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
 * @param {?} rootContext
 * @param {?} flags
 * @return {?}
 */
export function scheduleTick(rootContext, flags) {
    /** @type {?} */
    const nothingScheduled = rootContext.flags === 0 /* Empty */;
    rootContext.flags |= flags;
    if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
        /** @type {?} */
        let res;
        rootContext.clean = new Promise((/**
         * @param {?} r
         * @return {?}
         */
        (r) => res = r));
        rootContext.scheduler((/**
         * @return {?}
         */
        () => {
            if (rootContext.flags & 1 /* DetectChanges */) {
                rootContext.flags &= ~1 /* DetectChanges */;
                tickRootContext(rootContext);
            }
            if (rootContext.flags & 2 /* FlushPlayers */) {
                rootContext.flags &= ~2 /* FlushPlayers */;
                /** @type {?} */
                const playerHandler = rootContext.playerHandler;
                if (playerHandler) {
                    playerHandler.flushPlayers();
                }
            }
            rootContext.clean = _CLEAN_PROMISE;
            (/** @type {?} */ (res))(null);
        }));
    }
}
/**
 * @param {?} rootContext
 * @return {?}
 */
export function tickRootContext(rootContext) {
    for (let i = 0; i < rootContext.components.length; i++) {
        /** @type {?} */
        const rootComponent = rootContext.components[i];
        renderComponentOrTemplate((/** @type {?} */ (readPatchedLView(rootComponent))), rootComponent);
    }
}
/**
 * @template T
 * @param {?} view
 * @param {?} context
 * @return {?}
 */
export function detectChangesInternal(view, context) {
    /** @type {?} */
    const rendererFactory = view[RENDERER_FACTORY];
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
 * @param {?} lView The view which the change detection should be performed on.
 * @return {?}
 */
export function detectChangesInRootView(lView) {
    tickRootContext((/** @type {?} */ (lView[CONTEXT])));
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
    /** @type {?} */
    const view = getComponentViewByInstance(component);
    checkNoChangesInternal(view, component);
}
/**
 * @template T
 * @param {?} view
 * @param {?} context
 * @return {?}
 */
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
 * @param {?} lView The view which the change detection should be checked on.
 * @return {?}
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
/**
 * Checks the view of the component provided. Does not gate on dirty checks or execute doCheck.
 * @template T
 * @param {?} hostView
 * @param {?} component
 * @return {?}
 */
export function checkView(hostView, component) {
    /** @type {?} */
    const hostTView = hostView[TVIEW];
    /** @type {?} */
    const oldView = enterView(hostView, hostView[T_HOST]);
    /** @type {?} */
    const templateFn = (/** @type {?} */ (hostTView.template));
    /** @type {?} */
    const creationMode = isCreationMode(hostView);
    // Will become true if the `try` block executes with no errors.
    /** @type {?} */
    let safeToRunHooks = false;
    try {
        resetPreOrderHookFlags(hostView);
        creationMode && executeViewQueryFn(1 /* Create */, hostTView, component);
        executeTemplate(hostView, templateFn, getRenderFlags(hostView), component);
        refreshDescendantViews(hostView);
        // Only check view queries again in creation mode if there are static view queries
        if (!creationMode || hostTView.staticViewQueries) {
            executeViewQueryFn(2 /* Update */, hostTView, component);
        }
        safeToRunHooks = true;
    }
    finally {
        leaveView(oldView, safeToRunHooks);
    }
}
/**
 * @template T
 * @param {?} flags
 * @param {?} tView
 * @param {?} component
 * @return {?}
 */
function executeViewQueryFn(flags, tView, component) {
    /** @type {?} */
    const viewQuery = tView.viewQuery;
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
 * @param {?} lView The LView that contains the current binding index.
 * @param {?=} prefix The static prefix string
 * @param {?=} suffix The static suffix string
 *
 * @return {?} Newly created binding metadata string for this binding or null
 */
export function storeBindingMetadata(lView, prefix = '', suffix = '') {
    /** @type {?} */
    const tData = lView[TVIEW].data;
    /** @type {?} */
    const lastBindingIndex = lView[BINDING_INDEX] - 1;
    /** @type {?} */
    const value = INTERPOLATION_DELIMITER + prefix + INTERPOLATION_DELIMITER + suffix;
    return tData[lastBindingIndex] == null ? (tData[lastBindingIndex] = value) : null;
}
/** @type {?} */
export const CLEAN_PROMISE = _CLEAN_PROMISE;
/**
 * @param {?} tNode
 * @return {?}
 */
export function initializeTNodeInputs(tNode) {
    // If tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked.
    if (tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode, 0 /* Input */);
    }
    return tNode.inputs;
}
/**
 * @param {?} view
 * @return {?}
 */
export function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = ngDevMode ? new (/** @type {?} */ (LCleanup))() : []);
}
/**
 * @param {?} view
 * @return {?}
 */
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = ngDevMode ? new (/** @type {?} */ (TCleanup))() : []);
}
/**
 * There are cases where the sub component's renderer needs to be included
 * instead of the current renderer (see the componentSyntheticHost* instructions).
 * @param {?} tNode
 * @param {?} lView
 * @return {?}
 */
export function loadComponentRenderer(tNode, lView) {
    /** @type {?} */
    const componentLView = (/** @type {?} */ (lView[tNode.index]));
    return componentLView[RENDERER];
}
/**
 * Handles an error thrown in an LView.
 * @param {?} lView
 * @param {?} error
 * @return {?}
 */
export function handleError(lView, error) {
    /** @type {?} */
    const injector = lView[INJECTOR];
    /** @type {?} */
    const errorHandler = injector ? injector.get(ErrorHandler, null) : null;
    errorHandler && errorHandler.handleError(error);
}
/**
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param {?} lView the `LView` which contains the directives.
 * @param {?} inputs mapping between the public "input" name and privately-known,
 * possibly minified, property names to write to.
 * @param {?} value Value to set.
 * @return {?}
 */
export function setInputsForProperty(lView, inputs, value) {
    /** @type {?} */
    const tView = lView[TVIEW];
    for (let i = 0; i < inputs.length;) {
        /** @type {?} */
        const index = (/** @type {?} */ (inputs[i++]));
        /** @type {?} */
        const publicName = (/** @type {?} */ (inputs[i++]));
        /** @type {?} */
        const privateName = (/** @type {?} */ (inputs[i++]));
        /** @type {?} */
        const instance = lView[index];
        ngDevMode && assertDataInRange(lView, index);
        /** @type {?} */
        const def = (/** @type {?} */ (tView.data[index]));
        /** @type {?} */
        const setInput = def.setInput;
        if (setInput) {
            (/** @type {?} */ (def.setInput))(instance, value, publicName, privateName);
        }
        else {
            instance[privateName] = value;
        }
    }
}
/**
 * Updates a text binding at a given index in a given LView.
 * @param {?} lView
 * @param {?} index
 * @param {?} value
 * @return {?}
 */
export function textBindingInternal(lView, index, value) {
    ngDevMode && assertNotSame(value, (/** @type {?} */ (NO_CHANGE)), 'value should not be NO_CHANGE');
    ngDevMode && assertDataInRange(lView, index + HEADER_OFFSET);
    /** @type {?} */
    const element = (/** @type {?} */ ((/** @type {?} */ (getNativeByIndex(index, lView)))));
    ngDevMode && assertDefined(element, 'native element should exist');
    ngDevMode && ngDevMode.rendererSetText++;
    /** @type {?} */
    const renderer = lView[RENDERER];
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
 * @param {?} renderer
 * @param {?} native
 * @param {?} tNode
 * @return {?}
 */
export function renderInitialStyling(renderer, native, tNode) {
    renderStylingMap(renderer, native, tNode.classes, true);
    renderStylingMap(renderer, native, tNode.styles, false);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQy9GLE9BQU8sRUFBQyw4QkFBOEIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRS9HLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakosT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM5RCxPQUFPLEVBQUMsZUFBZSxFQUFFLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakYsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFPLEVBQUMsWUFBWSxFQUFFLG9CQUFvQixFQUFFLHFCQUFxQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ25GLE9BQU8sRUFBQyxZQUFZLEVBQUUsdUJBQXVCLEVBQWEsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRixPQUFPLEVBQUMsMEJBQTBCLEVBQUUsbUJBQW1C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QUMsQ0FBQztBQUMxRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5PX0VSUk9SU19TQ0hFTUEsIFNjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9zY2hlbWEnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGUsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWV9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi8uLi91dGlsL25nX3JlZmxlY3QnO1xuaW1wb3J0IHthc3NlcnRMVmlldywgYXNzZXJ0UHJldmlvdXNJc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIGV4ZWN1dGVQcmVPcmRlckhvb2tzLCByZWdpc3RlclByZU9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEZhY3RvcnlGbiwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzLCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSwgTm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNWYWx1ZSwgUHJvcGVydHlBbGlhc2VzLCBUQXR0cmlidXRlcywgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge2lzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgaXNDb250ZW50UXVlcnlIb3N0LCBpc0xDb250YWluZXIsIGlzUm9vdFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtCSU5ESU5HX0lOREVYLCBDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9WSUVXLCBFeHBhbmRvSW5zdHJ1Y3Rpb25zLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSU5KRUNUT1IsIEluaXRQaGFzZVN0YXRlLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBRVUVSSUVTLCBSRU5ERVJFUiwgUkVOREVSRVJfRkFDVE9SWSwgUm9vdENvbnRleHQsIFJvb3RDb250ZXh0RmxhZ3MsIFNBTklUSVpFUiwgVERhdGEsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldExWaWV3LCBnZXROYW1lc3BhY2UsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQsIGlzQ3JlYXRpb25Nb2RlLCBsZWF2ZVZpZXcsIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCwgc2V0QWN0aXZlSG9zdEVsZW1lbnQsIHNldEJpbmRpbmdSb290LCBzZXRDaGVja05vQ2hhbmdlc01vZGUsIHNldEN1cnJlbnREaXJlY3RpdmVEZWYsIHNldEN1cnJlbnRRdWVyeUluZGV4LCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge2luaXRpYWxpemVTdGF0aWNDb250ZXh0IGFzIGluaXRpYWxpemVTdGF0aWNTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vc3R5bGluZy9jbGFzc19hbmRfc3R5bGVfYmluZGluZ3MnO1xuaW1wb3J0IHtBTklNQVRJT05fUFJPUF9QUkVGSVgsIGlzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vc3R5bGluZy91dGlsJztcbmltcG9ydCB7cmVuZGVyU3R5bGluZ01hcH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2JpbmRpbmdzJztcbmltcG9ydCB7Z2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSwgZ2V0U3R5bGluZ01hcEFycmF5fSBmcm9tICcuLi9zdHlsaW5nX25leHQvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVIsIHJlbmRlclN0cmluZ2lmeSwgc3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2dldExWaWV3UGFyZW50LCBnZXRSb290Q29udGV4dH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgcmVhZFBhdGNoZWRMVmlldywgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwUk5vZGUsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7TENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZUNvbnN0cnVjdG9yLCBUTm9kZUluaXRpYWxEYXRhLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yLCBhdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlldywgY2xvbmVUb1RWaWV3RGF0YX0gZnJvbSAnLi9sdmlld19kZWJ1Zyc7XG5pbXBvcnQge3NlbGVjdEludGVybmFsfSBmcm9tICcuL3NlbGVjdCc7XG5cblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9ICgoKSA9PiBQcm9taXNlLnJlc29sdmUobnVsbCkpKCk7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUobFZpZXcpO1xuXG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICAvLyBSZXNldHRpbmcgdGhlIGJpbmRpbmdJbmRleCBvZiB0aGUgY3VycmVudCBMVmlldyBhcyB0aGUgbmV4dCBzdGVwcyBtYXkgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLlxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuXG4gIC8vIElmIHRoaXMgaXMgYSBjcmVhdGlvbiBwYXNzLCB3ZSBzaG91bGQgbm90IGNhbGwgbGlmZWN5Y2xlIGhvb2tzIG9yIGV2YWx1YXRlIGJpbmRpbmdzLlxuICAvLyBUaGlzIHdpbGwgYmUgZG9uZSBpbiB0aGUgdXBkYXRlIHBhc3MuXG4gIGlmICghY3JlYXRpb25Nb2RlKSB7XG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgICBleGVjdXRlUHJlT3JkZXJIb29rcyhsVmlldywgdFZpZXcsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdW5kZWZpbmVkKTtcblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcblxuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgbFZpZXcsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1biwgdW5kZWZpbmVkKTtcblxuICAgIHNldEhvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcpO1xuICB9XG5cbiAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gIC8vIGNvbnRlbnQgcXVlcmllcyBhcmUgcmVzb2x2ZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gKGkuZS4gdXBkYXRlIG1vZGUpLCBhZnRlciBlbWJlZGRlZFxuICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICBpZiAoY3JlYXRpb25Nb2RlICYmIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBzZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIGlmICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG4gICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICAgIGxldCBjdXJyZW50RWxlbWVudEluZGV4ID0gLTE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgICBjdXJyZW50RWxlbWVudEluZGV4ID0gLWluc3RydWN0aW9uO1xuICAgICAgICAgICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0QmluZGluZ1Jvb3QoYmluZGluZ1Jvb3RJbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICAgIGNvbnN0IGhvc3RDdHggPSB1bndyYXBSTm9kZSh2aWV3RGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdKTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCwgY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEVhY2ggZGlyZWN0aXZlIGdldHMgYSB1bmlxdWVJZCB2YWx1ZSB0aGF0IGlzIHRoZSBzYW1lIGZvciBib3RoXG4gICAgICAgICAgICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgICAgICAgICAgIC8vIGRpcmVjdGl2ZSB1bmlxdWVJZCBpcyBub3Qgc2V0IGFueXdoZXJlLS1pdCBpcyBqdXN0IGluY3JlbWVudGVkIGJldHdlZW5cbiAgICAgICAgICAgIC8vIGVhY2ggaG9zdEJpbmRpbmdzIGNhbGwgYW5kIGlzIHVzZWZ1bCBmb3IgaGVscGluZyBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAgICAgICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgICAgICAgICAgIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KHNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgYWxsIGNvbnRlbnQgcXVlcmllcyBkZWNsYXJlZCBieSBkaXJlY3RpdmVzIGluIGEgZ2l2ZW4gdmlldyAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXM7XG4gIGlmIChjb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RhcnRJZHggPSBjb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IGNvbnRlbnRRdWVyaWVzW2kgKyAxXTtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZJZHggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcywgJ2NvbnRlbnRRdWVyaWVzIGZ1bmN0aW9uIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5U3RhcnRJZHgpO1xuICAgICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMgIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IGdldExWaWV3KClbUkVOREVSRVJdO1xuXG4gIGNvbnN0IG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZSgpO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIGlmIChuYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXcgfCBudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncyxcbiAgICBob3N0OiBSRWxlbWVudCB8IG51bGwsIHRIb3N0Tm9kZTogVFZpZXdOb2RlIHwgVEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzIHwgbnVsbCwgcmVuZGVyZXI/OiBSZW5kZXJlcjMgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwsIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9IG5nRGV2TW9kZSA/IGNsb25lVG9MVmlldyh0Vmlldy5ibHVlcHJpbnQpIDogdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSwgJ1JlbmRlcmVyRmFjdG9yeSBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tSRU5ERVJFUl0gPSAocmVuZGVyZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJdKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCAhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHRIb3N0Tm9kZSBUaGlzIGlzIGEgaGFjayBhbmQgd2Ugc2hvdWxkIG5vdCBoYXZlIHRvIHBhc3MgdGhpcyB2YWx1ZSBpbi4gSXQgaXMgb25seSB1c2VkIHRvXG4gKiBkZXRlcm1pbmUgaWYgdGhlIHBhcmVudCBiZWxvbmdzIHRvIGEgZGlmZmVyZW50IHRWaWV3LiBJbnN0ZWFkIHdlIHNob3VsZCBub3QgaGF2ZSBwYXJlbnRUVmlld1xuICogcG9pbnQgdG8gVFZpZXcgb3RoZXIgdGhlIGN1cnJlbnQgb25lLlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3VDb250YWluZXIsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmXG4gICAgVEljdUNvbnRhaW5lck5vZGUge1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGUgfHxcbiAgICAgIGNyZWF0ZVROb2RlQXRJbmRleCh0VmlldywgdEhvc3ROb2RlLCBhZGp1c3RlZEluZGV4LCB0eXBlLCBuYW1lLCBhdHRycywgaW5kZXgpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUsIHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlICYgVEljdUNvbnRhaW5lck5vZGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsLCBpbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBpc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9XG4gICAgICBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiBwYXJlbnQgIT09IHRIb3N0Tm9kZTtcbiAgY29uc3QgdFBhcmVudE5vZGUgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCB0UGFyZW50Tm9kZSwgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmUgYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGVcbiAgLy8gaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhcyB0aGUgaW5kZXggMSBvciBtb3JlXG4gIGlmIChpbmRleCA9PT0gMCB8fCAhdFZpZXcuZmlyc3RDaGlsZCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJlxuICAgICAgICAodE5vZGUucGFyZW50ICE9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykpIHtcbiAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICB9IGVsc2UgaWYgKCFpc1BhcmVudCkge1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduVFZpZXdOb2RlVG9MVmlldyhcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFRWaWV3Tm9kZSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgbGV0IHROb2RlID0gdFZpZXcubm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdFBhcmVudE5vZGUgJiZcbiAgICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0UGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIHRWaWV3Lm5vZGUgPSB0Tm9kZSA9IGNyZWF0ZVROb2RlKFxuICAgICAgICB0VmlldyxcbiAgICAgICAgdFBhcmVudE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCAgLy9cbiAgICAgICAgVE5vZGVUeXBlLlZpZXcsIGluZGV4LCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gIH1cblxuICByZXR1cm4gbFZpZXdbVF9IT1NUXSA9IHROb2RlIGFzIFRWaWV3Tm9kZTtcbn1cblxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpIG9yIENvbXBvbmVudEZhY3RvcnkuY3JlYXRlKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IGNvbnRhaW5pbmcgdGhlIGJsdWVwcmludCB0byBhZGp1c3RcbiAqIEBwYXJhbSBudW1TbG90c1RvQWxsb2MgVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBpbiB0aGUgTFZpZXcsIHNob3VsZCBiZSA+MFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKHZpZXc6IExWaWV3LCBudW1TbG90c1RvQWxsb2M6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oXG4gICAgICAgICAgICAgICAgICAgbnVtU2xvdHNUb0FsbG9jLCAwLCAnVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA+IDApIHtcbiAgICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgICAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICAgICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICAgICAgICB2aWV3LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHNob3VsZCBvbmx5IGluY3JlbWVudCB0aGUgZXhwYW5kbyBzdGFydCBpbmRleCBpZiB0aGVyZSBhcmVuJ3QgYWxyZWFkeSBkaXJlY3RpdmVzXG4gICAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgICBpZiAoIXRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICAgICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKz0gbnVtU2xvdHNUb0FsbG9jO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2luY2Ugd2UncmUgYWRkaW5nIHRoZSBkeW5hbWljIG5vZGVzIGludG8gdGhlIGV4cGFuZG8gc2VjdGlvbiwgd2UgbmVlZCB0byBsZXQgdGhlIGhvc3RcbiAgICAgICAgLy8gYmluZGluZ3Mga25vdyB0aGF0IHRoZXkgc2hvdWxkIHNraXAgeCBzbG90c1xuICAgICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogVXNlZCBmb3IgY3JlYXRpbmcgdGhlIExWaWV3Tm9kZSBvZiBhIGR5bmFtaWMgZW1iZWRkZWQgdmlldyxcbiAqIGVpdGhlciB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkgb3IgVGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkuXG4gKiBTdWNoIGxWaWV3Tm9kZSB3aWxsIHRoZW4gYmUgcmVuZGVyZXIgd2l0aCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgKHNlZSBiZWxvdykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgZGVjbGFyYXRpb25WaWV3OiBMVmlldywgaW5qZWN0b3JJbmRleDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBfaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEsIHRydWUpO1xuXG4gIGNvbnN0IGxWaWV3ID0gY3JlYXRlTFZpZXcoZGVjbGFyYXRpb25WaWV3LCB0VmlldywgY29udGV4dCwgTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbnVsbCwgbnVsbCk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gZGVjbGFyYXRpb25WaWV3O1xuXG4gIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcodFZpZXcsIG51bGwsIC0xLCBsVmlldyk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdFZpZXcubm9kZSAhLmluamVjdG9ySW5kZXggPSBpbmplY3RvckluZGV4O1xuICB9XG5cbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKF9wcmV2aW91c09yUGFyZW50VE5vZGUsIF9pc1BhcmVudCk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciByZW5kZXJpbmcgZW1iZWRkZWQgdmlld3MgKGUuZy4gZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cylcbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG11c3Qgc3RvcmUvcmV0cmlldmUgdGhlaXIgVFZpZXdzIGRpZmZlcmVudGx5IGZyb20gY29tcG9uZW50IHZpZXdzXG4gKiBiZWNhdXNlIHRoZWlyIHRlbXBsYXRlIGZ1bmN0aW9ucyBhcmUgbmVzdGVkIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgb2YgdGhlaXIgaG9zdHMsIGNyZWF0aW5nXG4gKiBjbG9zdXJlcy4gSWYgdGhlaXIgaG9zdCB0ZW1wbGF0ZSBoYXBwZW5zIHRvIGJlIGFuIGVtYmVkZGVkIHRlbXBsYXRlIGluIGEgbG9vcCAoZS5nLiBuZ0ZvclxuICogaW5zaWRlXG4gKiBhbiBuZ0ZvciksIHRoZSBuZXN0aW5nIHdvdWxkIG1lYW4gd2UnZCBoYXZlIG11bHRpcGxlIGluc3RhbmNlcyBvZiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24sIHNvIHdlXG4gKiBjYW4ndCBzdG9yZSBUVmlld3MgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9uIGl0c2VsZiAoYXMgd2UgZG8gZm9yIGNvbXBzKS4gSW5zdGVhZCwgd2Ugc3RvcmUgdGhlXG4gKiBUVmlldyBmb3IgZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cyBvbiB0aGVpciBob3N0IFROb2RlLCB3aGljaCBvbmx5IGhhcyBvbmUgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJFbWJlZGRlZFRlbXBsYXRlPFQ+KHZpZXdUb1JlbmRlcjogTFZpZXcsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCBfaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGxldCBvbGRWaWV3OiBMVmlldztcbiAgaWYgKHZpZXdUb1JlbmRlcltGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkge1xuICAgIC8vIFRoaXMgaXMgYSByb290IHZpZXcgaW5zaWRlIHRoZSB2aWV3IHRyZWVcbiAgICB0aWNrUm9vdENvbnRleHQoZ2V0Um9vdENvbnRleHQodmlld1RvUmVuZGVyKSk7XG4gIH0gZWxzZSB7XG4gICAgLy8gV2lsbCBiZWNvbWUgdHJ1ZSBpZiB0aGUgYHRyeWAgYmxvY2sgZXhlY3V0ZXMgd2l0aCBubyBlcnJvcnMuXG4gICAgbGV0IHNhZmVUb1J1bkhvb2tzID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShudWxsICEsIHRydWUpO1xuXG4gICAgICBvbGRWaWV3ID0gZW50ZXJWaWV3KHZpZXdUb1JlbmRlciwgdmlld1RvUmVuZGVyW1RfSE9TVF0pO1xuICAgICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyh2aWV3VG9SZW5kZXIpO1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKHZpZXdUb1JlbmRlciwgdFZpZXcudGVtcGxhdGUgISwgZ2V0UmVuZGVyRmxhZ3Modmlld1RvUmVuZGVyKSwgY29udGV4dCk7XG5cbiAgICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAgIC8vIG9mZiBmaXJzdFRlbXBsYXRlUGFzcy4gSWYgd2UgZG9uJ3Qgc2V0IGl0IGhlcmUsIGluc3RhbmNlcyB3aWxsIHBlcmZvcm0gZGlyZWN0aXZlXG4gICAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICAgIHZpZXdUb1JlbmRlcltUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICAgICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyh2aWV3VG9SZW5kZXIpO1xuICAgICAgc2FmZVRvUnVuSG9va3MgPSB0cnVlO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBsZWF2ZVZpZXcob2xkVmlldyAhLCBzYWZlVG9SdW5Ib29rcyk7XG4gICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSwgX2lzUGFyZW50KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgaG9zdFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCB0ZW1wbGF0ZUZuPzogQ29tcG9uZW50VGVtcGxhdGU8VD4pIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gaG9zdFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IG9sZFZpZXcgPSBlbnRlclZpZXcoaG9zdFZpZXcsIGhvc3RWaWV3W1RfSE9TVF0pO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCBjcmVhdGlvbk1vZGVJc0FjdGl2ZSA9IGlzQ3JlYXRpb25Nb2RlKGhvc3RWaWV3KTtcblxuICAvLyBXaWxsIGJlY29tZSB0cnVlIGlmIHRoZSBgdHJ5YCBibG9jayBleGVjdXRlcyB3aXRoIG5vIGVycm9ycy5cbiAgbGV0IHNhZmVUb1J1bkhvb2tzID0gZmFsc2U7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuXG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICAgIHRlbXBsYXRlRm4gJiYgZXhlY3V0ZVRlbXBsYXRlKGhvc3RWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAgIGhvc3RWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MoaG9zdFZpZXcpO1xuICAgIHRlbXBsYXRlRm4gJiYgZXhlY3V0ZVRlbXBsYXRlKGhvc3RWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICAgIHNhZmVUb1J1bkhvb2tzID0gdHJ1ZTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgICBsZWF2ZVZpZXcob2xkVmlldywgc2FmZVRvUnVuSG9va3MpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZTxUPihcbiAgICBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCByZjogUmVuZGVyRmxhZ3MsIGNvbnRleHQ6IFQpIHtcbiAgbmFtZXNwYWNlSFRNTEludGVybmFsKCk7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgLy8gV2hlbiB3ZSdyZSB1cGRhdGluZywgaGF2ZSBhbiBpbmhlcmVudCDJtcm1c2VsZWN0KDApIHNvIHdlIGRvbid0IGhhdmUgdG8gZ2VuZXJhdGUgdGhhdFxuICAgICAgLy8gaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrc1xuICAgICAgc2VsZWN0SW50ZXJuYWwobFZpZXcsIDApO1xuICAgIH1cbiAgICB0ZW1wbGF0ZUZuKHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIFVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5LlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXcpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIDogUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gVE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEobFZpZXcsIHROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIHJldHVybiBkZWYudFZpZXcgfHwgKGRlZi50VmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEsIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYudmlld1F1ZXJ5LCBkZWYuc2NoZW1hcykpO1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnwgbnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXSB8IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IG5nRGV2TW9kZSA/XG4gICAgICBuZXcgVFZpZXdDb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICB2aWV3SW5kZXgsICAgLy8gaWQ6IG51bWJlcixcbiAgICAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAvLyBxdWVyaWVzOiBUUXVlcmllc3xudWxsXG4gICAgICAgICAgICAgdmlld1F1ZXJ5LCAgIC8vIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsICEsICAgICAgLy8gbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLFxuICAgICAgICAgICAgIGNsb25lVG9UVmlld0RhdGEoYmx1ZXByaW50KS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSwgIC8vIGRhdGE6IFREYXRhLFxuICAgICAgICAgICAgIGJpbmRpbmdTdGFydEluZGV4LCAgLy8gYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBpbml0aWFsVmlld0xlbmd0aCwgIC8vIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbixcbiAgICAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgIC8vIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgLy8gc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGRlc3Ryb3lIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNsZWFudXA6IGFueVtdfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgICAgdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICAgICBkaXJlY3RpdmVzKCkgOlxuICAgICAgICAgICAgICAgICBkaXJlY3RpdmVzLCAgLy8gZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsICAvLyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3RDaGlsZDogVE5vZGV8bnVsbCxcbiAgICAgICAgICAgICBzY2hlbWFzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgICAgICAgICAgKSA6XG4gICAgICB7XG4gICAgICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICAgICAgcXVlcmllczogbnVsbCxcbiAgICAgICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgICAgIG5vZGU6IG51bGwgISxcbiAgICAgICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgICAgIGJpbmRpbmdTdGFydEluZGV4OiBiaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgICAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgICAgICBmaXJzdFRlbXBsYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgc3RhdGljVmlld1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgICAgIHByZU9yZGVySG9va3M6IG51bGwsXG4gICAgICAgIHByZU9yZGVyQ2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgdmlld0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgICAgICBjbGVhbnVwOiBudWxsLFxuICAgICAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICAgICAgY29tcG9uZW50czogbnVsbCxcbiAgICAgICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICAgICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgICAgIHNjaGVtYXM6IHNjaGVtYXMsXG4gICAgICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5ldyAobmdEZXZNb2RlID8gTFZpZXdCbHVlcHJpbnQgISA6IEFycmF5KShpbml0aWFsVmlld0xlbmd0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5maWxsKG51bGwsIDAsIGJpbmRpbmdTdGFydEluZGV4KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwoTk9fQ0hBTkdFLCBiaW5kaW5nU3RhcnRJbmRleCkgYXMgTFZpZXc7XG4gIGJsdWVwcmludFtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdTdGFydEluZGV4O1xuICByZXR1cm4gYmx1ZXByaW50O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeUZvckVycm9yKHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cChsVmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHZpZXc6IExWaWV3LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vLyBUT0RPOiBSZW1vdmUgdGhpcyB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbi8qKlxuICogVHNpY2tsZSBoYXMgYSBidWcgd2hlcmUgaXQgY3JlYXRlcyBhbiBpbmZpbml0ZSBsb29wIGZvciBhIGZ1bmN0aW9uIHJldHVybmluZyBpdHNlbGYuXG4gKiBUaGlzIGlzIGEgdGVtcG9yYXJ5IHR5cGUgdGhhdCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgaXNzdWUgaXMgcmVzb2x2ZWQuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci90c2lja2xlL2lzc3Vlcy8xMDA5KVxuICovXG5leHBvcnQgdHlwZSBUc2lja2xlSXNzdWUxMDA5ID0gYW55O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoaXMgYFROb2RlYCBiZWxvbmdzICh1c2VkIG9ubHkgaW4gYG5nRGV2TW9kZWApXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGFkanVzdGVkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCB0eXBlOiBUTm9kZVR5cGUsXG4gICAgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIGxldCBpbmplY3RvckluZGV4ID0gdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xO1xuICByZXR1cm4gbmdEZXZNb2RlID8gbmV3IFROb2RlQ29uc3RydWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgdFZpZXcsICAgICAgICAgIC8vIHRWaWV3XzogVFZpZXdcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlLCAgICAgICAgICAgLy8gdHlwZTogVE5vZGVUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRJbmRleCwgIC8vIGluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4LCAgLy8gaW5qZWN0b3JJbmRleDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlRW5kOiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gcHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBwcm9wZXJ0eU1ldGFkYXRhRW5kSW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBmbGFnczogVE5vZGVGbGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSwgICAgICAgIC8vIHRhZ05hbWU6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnMsICAvLyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgIC8vIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gY2hpbGQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdFBhcmVudCwgICAgLy8gcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHN0eWxpbmdUZW1wbGF0ZTogU3R5bGluZ0NvbnRleHR8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG9uRWxlbWVudENyZWF0aW9uRm5zOiBGdW5jdGlvbltdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBuZXdTdHlsZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gbmV3Q2xhc3NlczogVFN0eWxpbmdDb250ZXh0fG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICApIDpcbiAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXg6IGluamVjdG9ySW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXg6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eU1ldGFkYXRhRW5kSW5kZXg6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFnczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICBhdHRyczogYXR0cnMsXG4gICAgICAgICAgICAgICAgICAgICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgdFZpZXdzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uTmV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogdFBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBvbkVsZW1lbnRDcmVhdGlvbkZuczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgfTtcbn1cblxuXG4vKipcbiAqIENvbnNvbGlkYXRlcyBhbGwgaW5wdXRzIG9yIG91dHB1dHMgb2YgYWxsIGRpcmVjdGl2ZXMgb24gdGhpcyBsb2dpY2FsIG5vZGUuXG4gKlxuICogQHBhcmFtIHROb2RlXG4gKiBAcGFyYW0gZGlyZWN0aW9uIHdoZXRoZXIgdG8gY29uc2lkZXIgaW5wdXRzIG9yIG91dHB1dHNcbiAqIEByZXR1cm5zIFByb3BlcnR5QWxpYXNlc3xudWxsIGFnZ3JlZ2F0ZSBvZiBhbGwgcHJvcGVydGllcyBpZiBhbnksIGBudWxsYCBvdGhlcndpc2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlOiBUTm9kZSwgZGlyZWN0aW9uOiBCaW5kaW5nRGlyZWN0aW9uKTogUHJvcGVydHlBbGlhc2VzfFxuICAgIG51bGwge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBsZXQgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcblxuICBpZiAoZW5kID4gc3RhcnQpIHtcbiAgICBjb25zdCBpc0lucHV0ID0gZGlyZWN0aW9uID09PSBCaW5kaW5nRGlyZWN0aW9uLklucHV0O1xuICAgIGNvbnN0IGRlZnMgPSB0Vmlldy5kYXRhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBwcm9wZXJ0eUFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30gPVxuICAgICAgICAgIGlzSW5wdXQgPyBkaXJlY3RpdmVEZWYuaW5wdXRzIDogZGlyZWN0aXZlRGVmLm91dHB1dHM7XG4gICAgICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIHByb3BlcnR5QWxpYXNNYXApIHtcbiAgICAgICAgaWYgKHByb3BlcnR5QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgfHwge307XG4gICAgICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gcHJvcGVydHlBbGlhc01hcFtwdWJsaWNOYW1lXTtcbiAgICAgICAgICBjb25zdCBoYXNQcm9wZXJ0eSA9IHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKTtcbiAgICAgICAgICBoYXNQcm9wZXJ0eSA/IHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGksIHB1YmxpY05hbWUsIGludGVybmFsTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtpLCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIE1hcHBpbmcgYmV0d2VlbiBhdHRyaWJ1dGVzIG5hbWVzIHRoYXQgZG9uJ3QgY29ycmVzcG9uZCB0byB0aGVpciBlbGVtZW50IHByb3BlcnR5IG5hbWVzLlxuICogTm90ZTogdGhpcyBtYXBwaW5nIGhhcyB0byBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgZXF1YWxseSBuYW1lZCBtYXBwaW5nIGluIHRoZSB0ZW1wbGF0ZVxuICogdHlwZS1jaGVja2luZyBtYWNoaW5lcnkgb2Ygbmd0c2MuXG4gKi9cbmNvbnN0IEFUVFJfVE9fUFJPUDoge1tuYW1lOiBzdHJpbmddOiBzdHJpbmd9ID0ge1xuICAnY2xhc3MnOiAnY2xhc3NOYW1lJyxcbiAgJ2Zvcic6ICdodG1sRm9yJyxcbiAgJ2Zvcm1hY3Rpb24nOiAnZm9ybUFjdGlvbicsXG4gICdpbm5lckh0bWwnOiAnaW5uZXJIVE1MJyxcbiAgJ3JlYWRvbmx5JzogJ3JlYWRPbmx5JyxcbiAgJ3RhYmluZGV4JzogJ3RhYkluZGV4Jyxcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLCBuYXRpdmVPbmx5PzogYm9vbGVhbixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgbGV0IGlucHV0RGF0YTogUHJvcGVydHlBbGlhc2VzfG51bGx8dW5kZWZpbmVkO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoIW5hdGl2ZU9ubHkgJiYgKGlucHV0RGF0YSA9IGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZSkpICYmXG4gICAgICAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgICAgICogaSsxOiBwdWJsaWNOYW1lXG4gICAgICAgICAqIGkrMjogcHJpdmF0ZU5hbWVcbiAgICAgICAgICpcbiAgICAgICAgICogZS5nLiBbMCwgJ2NoYW5nZScsICdjaGFuZ2UtbWluaWZpZWQnXVxuICAgICAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsyXVxuICAgICAgICAgKi9cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhVmFsdWUubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlW2kgKyAyXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHByb3BOYW1lID0gQVRUUl9UT19QUk9QW3Byb3BOYW1lXSB8fCBwcm9wTmFtZTtcblxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllcyhwcm9wTmFtZSk7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RVbmtub3duUHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlKTtcbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgc2F2ZVByb3BlcnR5RGVidWdEYXRhKHROb2RlLCBsVmlldywgcHJvcE5hbWUsIGxWaWV3W1RWSUVXXS5kYXRhLCBuYXRpdmVPbmx5KTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5XG4gICAgLy8gaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBwcm9wTmFtZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBhIGNvbnRhaW5lciBhbmQgdGhlIHByb3BlcnR5IGRpZG4ndFxuICAgIC8vIG1hdGNoIGFueSBvZiB0aGUgaW5wdXRzIG9yIHNjaGVtYXMgd2Ugc2hvdWxkIHRocm93LlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgIW1hdGNoaW5nU2NoZW1hcyhsVmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICAgIHRocm93IGNyZWF0ZVVua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlldyBkaXJ0eS4gKi9cbmZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydHkoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGF0dHJOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShhdHRyTmFtZSk7XG4gIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gIGlmICh0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUsIGRlYnVnVmFsdWUpIDpcbiAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPSBgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWA7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB0ZXh0Q29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHRleHRDb250ZW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RVbmtub3duUHJvcGVydGllcyhcbiAgICBob3N0VmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSkge1xuICAvLyBJZiB0aGUgdGFnIG1hdGNoZXMgYW55IG9mIHRoZSBzY2hlbWFzIHdlIHNob3VsZG4ndCB0aHJvdy5cbiAgaWYgKG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBwcm9wIGlzIG5vdCBhIGtub3duIHByb3BlcnR5IG9mIHRoZSBIVE1MIGVsZW1lbnQuLi5cbiAgaWYgKCEocHJvcE5hbWUgaW4gZWxlbWVudCkgJiZcbiAgICAgIC8vIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQuLi4gKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpXG4gICAgICB0eXBlb2YgTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBlbGVtZW50IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgLy8gYW5kIGlzbid0IGEgc3ludGhldGljIGFuaW1hdGlvbiBwcm9wZXJ0eS4uLlxuICAgICAgcHJvcE5hbWVbMF0gIT09IEFOSU1BVElPTl9QUk9QX1BSRUZJWCkge1xuICAgIC8vIC4uLiBpdCBpcyBwcm9iYWJseSBhIHVzZXIgZXJyb3IgYW5kIHdlIHNob3VsZCB0aHJvdy5cbiAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldzogTFZpZXcsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IGhvc3RWaWV3W1RWSUVXXS5zY2hlbWFzO1xuXG4gIGlmIChzY2hlbWFzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzY2hlbWEgPSBzY2hlbWFzW2ldO1xuICAgICAgaWYgKHNjaGVtYSA9PT0gTk9fRVJST1JTX1NDSEVNQSB8fFxuICAgICAgICAgIHNjaGVtYSA9PT0gQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSAmJiB0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiogU3RvcmVzIGRlYnVnZ2luZyBkYXRhIGZvciB0aGlzIHByb3BlcnR5IGJpbmRpbmcgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy5cbiogVGhpcyBlbmFibGVzIGZlYXR1cmVzIGxpa2UgRGVidWdFbGVtZW50LnByb3BlcnRpZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZVByb3BlcnR5RGVidWdEYXRhKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB0RGF0YTogVERhdGEsXG4gICAgbmF0aXZlT25seTogYm9vbGVhbiB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICBjb25zdCBsYXN0QmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSAxO1xuXG4gIC8vIEJpbmQvaW50ZXJwb2xhdGlvbiBmdW5jdGlvbnMgc2F2ZSBiaW5kaW5nIG1ldGFkYXRhIGluIHRoZSBsYXN0IGJpbmRpbmcgaW5kZXgsXG4gIC8vIGJ1dCBsZWF2ZSB0aGUgcHJvcGVydHkgbmFtZSBibGFuay4gSWYgdGhlIGludGVycG9sYXRpb24gZGVsaW1pdGVyIGlzIGF0IHRoZSAwXG4gIC8vIGluZGV4LCB3ZSBrbm93IHRoYXQgdGhpcyBpcyBvdXIgZmlyc3QgcGFzcyBhbmQgdGhlIHByb3BlcnR5IG5hbWUgc3RpbGwgbmVlZHMgdG9cbiAgLy8gYmUgc2V0LlxuICBjb25zdCBiaW5kaW5nTWV0YWRhdGEgPSB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gIGlmIChiaW5kaW5nTWV0YWRhdGFbMF0gPT0gSU5URVJQT0xBVElPTl9ERUxJTUlURVIpIHtcbiAgICB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9IHByb3BOYW1lICsgYmluZGluZ01ldGFkYXRhO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzdG9yZSBpbmRpY2VzIGZvciBob3N0IGJpbmRpbmdzIGJlY2F1c2UgdGhleSBhcmUgc3RvcmVkIGluIGFcbiAgICAvLyBkaWZmZXJlbnQgcGFydCBvZiBMVmlldyAodGhlIGV4cGFuZG8gc2VjdGlvbikuXG4gICAgaWYgKCFuYXRpdmVPbmx5KSB7XG4gICAgICBpZiAodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPSBsYXN0QmluZGluZ0luZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleCArIDE7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuKiBDcmVhdGVzIGFuIGVycm9yIHRoYXQgc2hvdWxkIGJlIHRocm93biB3aGVuIGVuY291bnRlcmluZyBhbiB1bmtub3duIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQuXG4qIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHRoZSBpbnZhbGlkIHByb3BlcnR5LlxuKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgZXJyb3IuXG4qL1xuZnVuY3Rpb24gY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWU6IHN0cmluZywgdE5vZGU6IFROb2RlKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgYFRlbXBsYXRlIGVycm9yOiBDYW4ndCBiaW5kIHRvICcke3Byb3BOYW1lfScgc2luY2UgaXQgaXNuJ3QgYSBrbm93biBwcm9wZXJ0eSBvZiAnJHt0Tm9kZS50YWdOYW1lfScuYCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbnRpYXRlUm9vdENvbXBvbmVudDxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPVxuICAgICAgZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgdmlld0RhdGEsIHZpZXdEYXRhLmxlbmd0aCAtIDEsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHJvb3RUTm9kZSwgZGlyZWN0aXZlKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuXG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcblxuICBjb25zdCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG5cbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA9ICh0Vmlldy5wcmVPcmRlckhvb2tzICYmIHRWaWV3LnByZU9yZGVySG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPVxuICAgICAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzICYmIHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcy5sZW5ndGgpIHx8IDA7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0VmlldywgbFZpZXcsIGRlZiwgZGVmLmZhY3RvcnkpO1xuXG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKHRWaWV3LmRhdGEgIS5sZW5ndGggLSAxLCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAvLyBJbml0IGhvb2tzIGFyZSBxdWV1ZWQgbm93IHNvIG5nT25Jbml0IGlzIGNhbGxlZCBpbiBob3N0IGNvbXBvbmVudHMgYmVmb3JlXG4gICAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgICByZWdpc3RlclByZU9yZGVySG9va3MoXG4gICAgICAgICAgZGlyZWN0aXZlRGVmSWR4LCBkZWYsIHRWaWV3LCBub2RlSW5kZXgsIGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoLFxuICAgICAgICAgIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGgpO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCF0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiBzdGFydCA8IGVuZCkge1xuICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgfVxuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKGxWaWV3LCB0Tm9kZSwgZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICB9XG4gICAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgbFZpZXcgISwgaSwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgICBwb3N0UHJvY2Vzc0RpcmVjdGl2ZShsVmlldywgZGlyZWN0aXZlLCBkZWYsIGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICE7XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSB2aWV3RGF0YVtpXTtcbiAgICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZiwgZXhwYW5kbywgZGlyZWN0aXZlLCB0Tm9kZSwgZmlyc3RUZW1wbGF0ZVBhc3MpO1xuXG4gICAgICAgIC8vIEVhY2ggZGlyZWN0aXZlIGdldHMgYSB1bmlxdWVJZCB2YWx1ZSB0aGF0IGlzIHRoZSBzYW1lIGZvciBib3RoXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAgICAgICAvLyBkaXJlY3RpdmUgdW5pcXVlSWQgaXMgbm90IHNldCBhbnl3aGVyZS0taXQgaXMganVzdCBpbmNyZW1lbnRlZCBiZXR3ZWVuXG4gICAgICAgIC8vIGVhY2ggaG9zdEJpbmRpbmdzIGNhbGwgYW5kIGlzIHVzZWZ1bCBmb3IgaGVscGluZyBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAgIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICAgICAgICBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBleHBhbmRvLnB1c2gobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KHNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCBleHBhbmRvOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zLCBkaXJlY3RpdmU6IGFueSwgdE5vZGU6IFROb2RlLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuKSB7XG4gIGNvbnN0IHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9IGV4cGFuZG8ubGVuZ3RoO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZik7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgZGVmLmhvc3RCaW5kaW5ncyAhKFJlbmRlckZsYWdzLkNyZWF0ZSwgZGlyZWN0aXZlLCBlbGVtZW50SW5kZXgpO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKG51bGwpO1xuICAvLyBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBtYXkgb3IgbWF5IG5vdCBjb250YWluIGBhbGxvY0hvc3RWYXJzYCBjYWxsXG4gIC8vIChlLmcuIGl0IG1heSBub3QgaWYgaXQgb25seSBjb250YWlucyBob3N0IGxpc3RlbmVycyksIHNvIHdlIG5lZWQgdG8gY2hlY2sgd2hldGhlclxuICAvLyBgZXhwYW5kb0luc3RydWN0aW9uc2AgaGFzIGNoYW5nZWQgYW5kIGlmIG5vdCAtIHdlIHN0aWxsIHB1c2ggYGhvc3RCaW5kaW5nc2AgdG9cbiAgLy8gZXhwYW5kbyBibG9jaywgdG8gbWFrZSBzdXJlIHdlIGV4ZWN1dGUgaXQgZm9yIERJIGN5Y2xlXG4gIGlmIChwcmV2aW91c0V4cGFuZG9MZW5ndGggPT09IGV4cGFuZG8ubGVuZ3RoICYmIGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuKiBHZW5lcmF0ZXMgYSBuZXcgYmxvY2sgaW4gVFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyBmb3IgdGhpcyBub2RlLlxuKlxuKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiogaXQgZnJvbSB0aGUgaG9zdFZhciBjb3VudCkgYW5kIHRoZSBkaXJlY3RpdmUgY291bnQuIFNlZSBtb3JlIGluIFZJRVdfREFUQS5tZC5cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlQ291bnQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ0V4cGFuZG8gYmxvY2sgc2hvdWxkIG9ubHkgYmUgZ2VuZXJhdGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG5cbiAgY29uc3QgZWxlbWVudEluZGV4ID0gLSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBwcm92aWRlclN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgcHJvdmlkZXJDb3VudCA9IHRWaWV3LmRhdGEubGVuZ3RoIC0gcHJvdmlkZXJTdGFydEluZGV4O1xuICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtcbiAgIF0pKS5wdXNoKGVsZW1lbnRJbmRleCwgcHJvdmlkZXJDb3VudCwgZGlyZWN0aXZlQ291bnQpO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgYSBkaXJlY3RpdmUgb24gdGhlIGN1cnJlbnQgbm9kZSBhZnRlciBpdHMgY3JlYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzRGlyZWN0aXZlPFQ+KFxuICAgIHZpZXdEYXRhOiBMVmlldywgZGlyZWN0aXZlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZSh2aWV3RGF0YSwgcHJldmlvdXNPclBhcmVudFROb2RlLCBkaXJlY3RpdmUpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChwcmV2aW91c09yUGFyZW50VE5vZGUsICdwcmV2aW91c09yUGFyZW50VE5vZGUnKTtcbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuYXR0cnMpIHtcbiAgICBzZXRJbnB1dHNGcm9tQXR0cnMoZGlyZWN0aXZlRGVmSWR4LCBkaXJlY3RpdmUsIGRlZiwgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgfVxuXG4gIGlmICh2aWV3RGF0YVtUVklFV10uZmlyc3RUZW1wbGF0ZVBhc3MgJiYgZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgcHJldmlvdXNPclBhcmVudFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICB9XG5cbiAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4LCB2aWV3RGF0YSk7XG4gICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgfVxufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIHBvc3RQcm9jZXNzRGlyZWN0aXZlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnQuXG4gKi9cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZTxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRpcmVjdGl2ZTogVCk6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbFZpZXcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBsVmlld1tCSU5ESU5HX0lOREVYXSwgbFZpZXdbVFZJRVddLmJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICAgICAgICAgICAgICdkaXJlY3RpdmVzIHNob3VsZCBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgYmluZGluZ3MnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoZ2V0SXNQYXJlbnQoKSk7XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG59XG5cblxuLyoqXG4qIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLlxuKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlTWF0Y2hlcyhcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyxcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyAhLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIGZhbHNlKSkge1xuICAgICAgICBtYXRjaGVzIHx8IChtYXRjaGVzID0gbmdEZXZNb2RlID8gbmV3IE1hdGNoZXNBcnJheSAhKCkgOiBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdFZpZXcsIGRlZi50eXBlKTtcblxuICAgICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgdE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuXG4gICAgICAgICAgLy8gVGhlIGNvbXBvbmVudCBpcyBhbHdheXMgc3RvcmVkIGZpcnN0IHdpdGggZGlyZWN0aXZlcyBhZnRlci5cbiAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoZGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcztcbn1cblxuLyoqIFN0b3JlcyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuICovXG5leHBvcnQgZnVuY3Rpb24gcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ1Nob3VsZCBvbmx5IGJlIGNhbGxlZCBpbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IG5nRGV2TW9kZSA/IG5ldyBUVmlld0NvbXBvbmVudHMgISgpIDogW1xuICAgXSkpLnB1c2gocHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4KTtcbn1cblxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZyB8IG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPVxuICAgICAgICBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVMb2NhbE5hbWVzICEoKSA6IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICgoZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KS50ZW1wbGF0ZSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIHRoZSBmbGFncyBvbiB0aGUgY3VycmVudCBub2RlLCBzZXR0aW5nIGFsbCBpbmRpY2VzIHRvIHRoZSBpbml0aWFsIGluZGV4LFxuICogdGhlIGRpcmVjdGl2ZSBjb3VudCB0byAwLCBhbmQgYWRkaW5nIHRoZSBpc0NvbXBvbmVudCBmbGFnLlxuICogQHBhcmFtIGluZGV4IHRoZSBpbml0aWFsIGluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0Tm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgY29uc3QgZmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGZsYWdzID09PSAwIHx8IGZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCBub2RlIGZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5mbGFncyA9IGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZUZhY3Rvcnk6IEZhY3RvcnlGbjxUPikge1xuICB0Vmlldy5kYXRhLnB1c2goZGVmKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIG51bGwpO1xuICB0Vmlldy5ibHVlcHJpbnQucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbiAgdmlld0RhdGEucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgbFZpZXcpO1xuXG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldywgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLFxuICAgICAgICAgICAgICAgICBsVmlld1twcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdLCBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlLFxuICAgICAgICAgICAgICAgICByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihuYXRpdmUgYXMgUkVsZW1lbnQsIGRlZikpKTtcblxuICBjb21wb25lbnRWaWV3W1RfSE9TVF0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBsVmlld1twcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdID0gY29tcG9uZW50VmlldztcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIGxWaWV3OiBMVmlldywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hbWVzcGFjZT86IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZSk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICBjb25zdCBzdHJWYWx1ZSA9XG4gICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBzdHJWYWx1ZSwgbmFtZXNwYWNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXNwYWNlID8gZWxlbWVudC5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2UsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGRlZiBUaGUgZGlyZWN0aXZlIGRlZiB0aGF0IGNvbnRhaW5zIHRoZSBsaXN0IG9mIGlucHV0c1xuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBsZXQgaW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgYXMgSW5pdGlhbElucHV0RGF0YSB8IHVuZGVmaW5lZDtcbiAgaWYgKGluaXRpYWxJbnB1dERhdGEgPT09IHVuZGVmaW5lZCB8fCBkaXJlY3RpdmVJbmRleCA+PSBpbml0aWFsSW5wdXREYXRhLmxlbmd0aCkge1xuICAgIGluaXRpYWxJbnB1dERhdGEgPSBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoZGlyZWN0aXZlSW5kZXgsIGRlZi5pbnB1dHMsIHROb2RlKTtcbiAgfVxuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cykge1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGlmIChzZXRJbnB1dCkge1xuICAgICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBsVmlldyA9IGdldExWaWV3KCk7XG4gICAgICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgICAgIHNldE5nUmVmbGVjdFByb3BlcnR5KGxWaWV3LCBuYXRpdmVFbGVtZW50LCB0Tm9kZS50eXBlLCBwcml2YXRlTmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB0byBzdG9yZSB0aGUgaW5pdGlhbCBpbnB1dCBkYXRhXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgdE5vZGU6IFROb2RlKTogSW5pdGlhbElucHV0RGF0YSB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEgPVxuICAgICAgdE5vZGUuaW5pdGlhbElucHV0cyB8fCAodE5vZGUuaW5pdGlhbElucHV0cyA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUluaXRpYWxJbnB1dHMgISgpIDogW10pO1xuICAvLyBFbnN1cmUgdGhhdCB3ZSBkb24ndCBjcmVhdGUgc3BhcnNlIGFycmF5c1xuICBmb3IgKGxldCBpID0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGg7IGkgPD0gZGlyZWN0aXZlSW5kZXg7IGkrKykge1xuICAgIGluaXRpYWxJbnB1dERhdGEucHVzaChudWxsKTtcbiAgfVxuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnMgITtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpIHtcbiAgICAgIC8vIFNraXAgb3ZlciB0aGUgYG5nUHJvamVjdEFzYCB2YWx1ZS5cbiAgICAgIGkgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGhpdCBhbnkgb3RoZXIgYXR0cmlidXRlIG1hcmtlcnMsIHdlJ3JlIGRvbmUgYW55d2F5LiBOb25lIG9mIHRob3NlIGFyZSB2YWxpZCBpbnB1dHMuXG4gICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PT0gJ251bWJlcicpIGJyZWFrO1xuXG4gICAgY29uc3QgbWluaWZpZWRJbnB1dE5hbWUgPSBpbnB1dHNbYXR0ck5hbWUgYXMgc3RyaW5nXTtcbiAgICBjb25zdCBhdHRyVmFsdWUgPSBhdHRyc1tpICsgMV07XG5cbiAgICBpZiAobWluaWZpZWRJbnB1dE5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0cyA9IGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdIHx8XG4gICAgICAgICAgKGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbmdEZXZNb2RlID8gbmV3IFROb2RlSW5pdGlhbERhdGEgISgpIDogW10pO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKGF0dHJOYW1lIGFzIHN0cmluZywgbWluaWZpZWRJbnB1dE5hbWUsIGF0dHJWYWx1ZSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5pdGlhbElucHV0RGF0YTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIE5vdCBzdXJlIHdoeSBJIG5lZWQgdG8gZG8gYGFueWAgaGVyZSBidXQgVFMgY29tcGxhaW5zIGxhdGVyLlxuY29uc3QgTENvbnRhaW5lckFycmF5OiBhbnkgPSBuZ0Rldk1vZGUgJiYgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb250YWluZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCB8IFN0eWxpbmdDb250ZXh0IHwgTFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCxcbiAgICB0Tm9kZTogVE5vZGUsIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobmF0aXZlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgLy8gaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LWxpdGVyYWwtdnMtbmV3LWFycmF5LXJlYWxseVxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gbmV3IChuZ0Rldk1vZGUgPyBMQ29udGFpbmVyQXJyYXkgOiBBcnJheSkoXG4gICAgICBob3N0TmF0aXZlLCAgLy8gaG9zdCBuYXRpdmVcbiAgICAgIHRydWUsICAgICAgICAvLyBCb29sZWFuIGB0cnVlYCBpbiB0aGlzIHBvc2l0aW9uIHNpZ25pZmllcyB0aGF0IHRoaXMgaXMgYW4gYExDb250YWluZXJgXG4gICAgICBpc0ZvclZpZXdDb250YWluZXJSZWYgPyAtMSA6IDAsICAvLyBhY3RpdmUgaW5kZXhcbiAgICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgICAgdE5vZGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdF9ob3N0XG4gICAgICBuYXRpdmUsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuYXRpdmUsXG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICAgICk7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcik7XG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbVxuICogYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgY3VycmVudCA9IGxWaWV3W0NISUxEX0hFQURdOyBjdXJyZW50ICE9PSBudWxsOyBjdXJyZW50ID0gY3VycmVudFtORVhUXSkge1xuICAgIC8vIE5vdGU6IGN1cnJlbnQgY2FuIGJlIGFuIExWaWV3IG9yIGFuIExDb250YWluZXIgaW5zdGFuY2UsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5IGludGVyZXN0ZWRcbiAgICAvLyBpbiBMQ29udGFpbmVyLiBXZSBjYW4gdGVsbCBpdCdzIGFuIExDb250YWluZXIgYmVjYXVzZSBpdHMgbGVuZ3RoIGlzIGxlc3MgdGhhbiB0aGUgTFZpZXdcbiAgICAvLyBoZWFkZXIuXG4gICAgaWYgKGN1cnJlbnRbQUNUSVZFX0lOREVYXSA9PT0gLTEgJiYgaXNMQ29udGFpbmVyKGN1cnJlbnQpKSB7XG4gICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBjdXJyZW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGR5bmFtaWNWaWV3RGF0YSA9IGN1cnJlbnRbaV07XG4gICAgICAgIC8vIFRoZSBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmUgbm90IG5lZWRlZCBoZXJlIGFzIGFuIGV4aXN0aW5nIHZpZXcgaXMgb25seSBiZWluZ1xuICAgICAgICAvLyByZWZyZXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGR5bmFtaWNWaWV3RGF0YVtUVklFV10sICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGR5bmFtaWNWaWV3RGF0YSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gYWRqdXN0ZWRFbGVtZW50SW5kZXggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoKGFkanVzdGVkRWxlbWVudEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgaG9zdFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChhZGp1c3RlZEVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUobFZpZXdbVFZJRVddLmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgLy8gT25seSBjb21wb25lbnRzIGluIGNyZWF0aW9uIG1vZGUsIGF0dGFjaGVkIENoZWNrQWx3YXlzXG4gIC8vIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICgodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihob3N0VmlldykgfHwgaXNDcmVhdGlvbk1vZGUobFZpZXcpKSAmJlxuICAgICAgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIHN5bmNWaWV3V2l0aEJsdWVwcmludChob3N0Vmlldyk7XG4gICAgY2hlY2tWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3OiBMVmlldykge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4obFZpZXc6IExWaWV3LCBsVmlld09yTENvbnRhaW5lcjogVCk6IFQge1xuICAvLyBUT0RPKGJlbmxlc2gvbWlza28pOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGluY29ycmVjdCwgYmVjYXVzZSBpdCBhbHdheXMgYWRkcyB0aGUgTENvbnRhaW5lclxuICAvLyB0b1xuICAvLyB0aGUgZW5kIG9mIHRoZSBxdWV1ZSwgd2hpY2ggbWVhbnMgaWYgdGhlIGRldmVsb3BlciByZXRyaWV2ZXMgdGhlIExDb250YWluZXJzIGZyb20gUk5vZGVzIG91dFxuICAvLyBvZlxuICAvLyBvcmRlciwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBydW4gb3V0IG9mIG9yZGVyLCBhcyB0aGUgYWN0IG9mIHJldHJpZXZpbmcgdGhlIHRoZVxuICAvLyBMQ29udGFpbmVyXG4gIC8vIGZyb20gdGhlIFJOb2RlIGlzIHdoYXQgYWRkcyBpdCB0byB0aGUgcXVldWUuXG4gIGlmIChsVmlld1tDSElMRF9IRUFEXSkge1xuICAgIGxWaWV3W0NISUxEX1RBSUxdICFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCAhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2socm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSAhLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG5cbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgdHJ5IHtcbiAgICBpZiAoaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICAgIGNoZWNrVmlldyh2aWV3LCBjb250ZXh0KTsgIC8vIGNyZWF0aW9uIG1vZGUgcGFzc1xuICAgIH1cbiAgICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IodmlldywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KTtcbiAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3LCBjb21wb25lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja1ZpZXc8VD4oaG9zdFZpZXc6IExWaWV3LCBjb21wb25lbnQ6IFQpIHtcbiAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tUX0hPU1RdKTtcbiAgY29uc3QgdGVtcGxhdGVGbiA9IGhvc3RUVmlldy50ZW1wbGF0ZSAhO1xuICBjb25zdCBjcmVhdGlvbk1vZGUgPSBpc0NyZWF0aW9uTW9kZShob3N0Vmlldyk7XG5cbiAgLy8gV2lsbCBiZWNvbWUgdHJ1ZSBpZiB0aGUgYHRyeWAgYmxvY2sgZXhlY3V0ZXMgd2l0aCBubyBlcnJvcnMuXG4gIGxldCBzYWZlVG9SdW5Ib29rcyA9IGZhbHNlO1xuICB0cnkge1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MoaG9zdFZpZXcpO1xuICAgIGNyZWF0aW9uTW9kZSAmJiBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuQ3JlYXRlLCBob3N0VFZpZXcsIGNvbXBvbmVudCk7XG4gICAgZXhlY3V0ZVRlbXBsYXRlKGhvc3RWaWV3LCB0ZW1wbGF0ZUZuLCBnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG4gICAgcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhob3N0Vmlldyk7XG4gICAgLy8gT25seSBjaGVjayB2aWV3IHF1ZXJpZXMgYWdhaW4gaW4gY3JlYXRpb24gbW9kZSBpZiB0aGVyZSBhcmUgc3RhdGljIHZpZXcgcXVlcmllc1xuICAgIGlmICghY3JlYXRpb25Nb2RlIHx8IGhvc3RUVmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdFRWaWV3LCBjb21wb25lbnQpO1xuICAgIH1cbiAgICBzYWZlVG9SdW5Ib29rcyA9IHRydWU7XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KG9sZFZpZXcsIHNhZmVUb1J1bkhvb2tzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oZmxhZ3M6IFJlbmRlckZsYWdzLCB0VmlldzogVFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgICB2aWV3UXVlcnkoZmxhZ3MsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGJpbmRpbmcgbWV0YWRhdGEgZm9yIGEgcGFydGljdWxhciBiaW5kaW5nIGFuZCBzdG9yZXMgaXQgaW5cbiAqIFRWaWV3LmRhdGEuIFRoZXNlIGFyZSBnZW5lcmF0ZWQgaW4gb3JkZXIgdG8gc3VwcG9ydCBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqXG4gKiBFYWNoIGJpbmRpbmcgLyBpbnRlcnBvbGF0aW9uIHdpbGwgaGF2ZSBvbmUgKGluY2x1ZGluZyBhdHRyaWJ1dGUgYmluZGluZ3MpXG4gKiBiZWNhdXNlIGF0IHRoZSB0aW1lIG9mIGJpbmRpbmcsIHdlIGRvbid0IGtub3cgdG8gd2hpY2ggaW5zdHJ1Y3Rpb24gdGhlIGJpbmRpbmdcbiAqIGJlbG9uZ3MuIEl0IGlzIGFsd2F5cyBzdG9yZWQgaW4gVFZpZXcuZGF0YSBhdCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgYmluZGluZ1xuICogdmFsdWUgaW4gTFZpZXcgKGUuZy4gZm9yIGludGVycG9sYXRpb244LCBpdCB3b3VsZCBiZSBzdG9yZWQgYXQgdGhlIGluZGV4IG9mXG4gKiB0aGUgOHRoIHZhbHVlKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhlIGN1cnJlbnQgYmluZGluZyBpbmRleC5cbiAqIEBwYXJhbSBwcmVmaXggVGhlIHN0YXRpYyBwcmVmaXggc3RyaW5nXG4gKiBAcGFyYW0gc3VmZml4IFRoZSBzdGF0aWMgc3VmZml4IHN0cmluZ1xuICpcbiAqIEByZXR1cm5zIE5ld2x5IGNyZWF0ZWQgYmluZGluZyBtZXRhZGF0YSBzdHJpbmcgZm9yIHRoaXMgYmluZGluZyBvciBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldzogTFZpZXcsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcbiAgY29uc3QgdmFsdWUgPSBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHByZWZpeCArIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgc3VmZml4O1xuXG4gIHJldHVybiB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9PSBudWxsID8gKHREYXRhW2xhc3RCaW5kaW5nSW5kZXhdID0gdmFsdWUpIDogbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZTogVE5vZGUpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIC8vIElmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWQuXG4gIGlmICh0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cbiAgcmV0dXJuIHROb2RlLmlucHV0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAgISgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwICEoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGVsZW1lbnQsIHZhbHVlKSA6IGVsZW1lbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgKGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMpIG9uIHRvIHRoZSBlbGVtZW50IGZyb20gdGhlIHROb2RlLlxuICpcbiAqIEFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSAoaS5lLiBhbnkgdmFsdWVzIGV4dHJhY3RlZCBmcm9tIHRoZSBgc3R5bGVgIG9yIGBjbGFzc2AgYXR0cmlidXRlc1xuICogb24gYW4gZWxlbWVudCkgYXJlIGNvbGxlY3RlZCBpbnRvIHRoZSBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGRhdGEgc3RydWN0dXJlcy5cbiAqIFRoZXNlIHZhbHVlcyBhcmUgcG9wdWxhdGVkIGR1cmluZyB0aGUgY3JlYXRpb24gcGhhc2Ugb2YgYW4gZWxlbWVudCBhbmQgYXJlIHRoZW4gbGF0ZXJcbiAqIGFwcGxpZWQgb25jZSB0aGUgZWxlbWVudCBpcyBpbnN0YW50aWF0ZWQuIFRoaXMgZnVuY3Rpb24gYXBwbGllcyBlYWNoIG9mIHRoZSBzdGF0aWNcbiAqIHN0eWxlIGFuZCBjbGFzcyBlbnRyaWVzIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbmF0aXZlOiBSRWxlbWVudCwgdE5vZGU6IFROb2RlKSB7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuY2xhc3NlcywgdHJ1ZSk7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuc3R5bGVzLCBmYWxzZSk7XG59XG4iXX0=