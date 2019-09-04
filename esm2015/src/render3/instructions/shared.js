/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertNotEqual, assertNotSame } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertFirstTemplatePass, assertLView } from '../assert';
import { attachPatchData, getComponentViewByInstance } from '../context_discovery';
import { getFactoryDef } from '../definition';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags, registerPreOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponentDef, isComponentHost, isContentQueryHost, isLContainer, isRootView } from '../interfaces/type_checks';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { getBindingsEnabled, getCheckNoChangesMode, getIsParent, getLView, getPreviousOrParentTNode, getSelectedIndex, incrementActiveDirectiveId, namespaceHTMLInternal, selectView, setActiveHostElement, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { renderStylingMap } from '../styling_next/bindings';
import { NO_CHANGE } from '../tokens';
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent } from '../util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, isCreationMode, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
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
 * Sets the host bindings for the current view.
 * @param {?} tView
 * @param {?} viewData
 * @return {?}
 */
export function setHostBindings(tView, viewData) {
    /** @type {?} */
    const selectedIndex = getSelectedIndex();
    try {
        if (tView.expandoInstructions !== null) {
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
 * Refreshes child components in the current view (update mode).
 * @param {?} hostLView
 * @param {?} components
 * @return {?}
 */
function refreshChildComponents(hostLView, components) {
    for (let i = 0; i < components.length; i++) {
        refreshComponent(hostLView, components[i]);
    }
}
/**
 * Renders child components in the current view (creation mode).
 * @param {?} hostLView
 * @param {?} components
 * @return {?}
 */
function renderChildComponents(hostLView, components) {
    for (let i = 0; i < components.length; i++) {
        renderComponent(hostLView, components[i]);
    }
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param {?} name the tag name
 * @param {?} renderer A renderer to use
 * @param {?} namespace
 * @return {?} the element created
 */
export function elementCreate(name, renderer, namespace) {
    if (isProceduralRenderer(renderer)) {
        return renderer.createElement(name, namespace);
    }
    else {
        return namespace === null ? renderer.createElement(name) :
            renderer.createElementNS(namespace, name);
    }
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
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs);
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
 * @return {?}
 */
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs) {
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
    // Assign a pointer to the first child node of a given view. The first node is not always the one
    // at index 0, in case of i18n, index 0 can be the instruction `i18nStart` and the first node has
    // the index 1 or more, so we can't just check node index.
    if (tView.firstChild === null) {
        tView.firstChild = tNode;
    }
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
 * Processes a view in the creation mode. This includes a number of steps in a specific order:
 * - creating view query functions (if any);
 * - executing a template function in the creation mode;
 * - updating static queries (if any);
 * - creating child components defined in a given view.
 * @template T
 * @param {?} lView
 * @param {?} tView
 * @param {?} context
 * @return {?}
 */
export function renderView(lView, tView, context) {
    ngDevMode && assertEqual(isCreationMode(lView), true, 'Should be run in creation mode');
    /** @type {?} */
    const oldView = selectView(lView, lView[T_HOST]);
    try {
        /** @type {?} */
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(1 /* Create */, viewQuery, context);
        }
        // Execute a template associated with this view, if it exists. A template function might not be
        // defined for the root component views.
        /** @type {?} */
        const templateFn = tView.template;
        if (templateFn !== null) {
            executeTemplate(lView, templateFn, 1 /* Create */, context);
        }
        // This needs to be set before children are processed to support recursive components.
        // This must be set to false immediately after the first creation run because in an
        // ngFor loop, all the views will be created together before update mode runs and turns
        // off firstTemplatePass. If we don't set it here, instances will perform directive
        // matching, etc again and again.
        if (tView.firstTemplatePass) {
            tView.firstTemplatePass = false;
        }
        // We resolve content queries specifically marked as `static` in creation mode. Dynamic
        // content queries are resolved during change detection (i.e. update mode), after embedded
        // views are refreshed (see block above).
        if (tView.staticContentQueries) {
            refreshContentQueries(tView, lView);
        }
        // We must materialize query results before child components are processed
        // in case a child component has projected a container. The LContainer needs
        // to exist so the embedded views are properly attached by the container.
        if (tView.staticViewQueries) {
            executeViewQueryFn(2 /* Update */, (/** @type {?} */ (tView.viewQuery)), context);
        }
        // Render child component views.
        /** @type {?} */
        const components = tView.components;
        if (components !== null) {
            renderChildComponents(lView, components);
        }
    }
    finally {
        lView[FLAGS] &= ~4 /* CreationMode */;
        selectView(oldView, null);
    }
}
/**
 * Processes a view in update mode. This includes a number of steps in a specific order:
 * - executing a template function in update mode;
 * - executing hooks;
 * - refreshing queries;
 * - setting host bindings;
 * - refreshing child (embedded and component) views.
 * @template T
 * @param {?} lView
 * @param {?} tView
 * @param {?} templateFn
 * @param {?} context
 * @return {?}
 */
export function refreshView(lView, tView, templateFn, context) {
    ngDevMode && assertEqual(isCreationMode(lView), false, 'Should be run in update mode');
    /** @type {?} */
    const oldView = selectView(lView, lView[T_HOST]);
    /** @type {?} */
    const flags = lView[FLAGS];
    try {
        resetPreOrderHookFlags(lView);
        setBindingRoot(lView[BINDING_INDEX] = tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(lView, templateFn, 2 /* Update */, context);
        }
        /** @type {?} */
        const checkNoChangesMode = getCheckNoChangesMode();
        /** @type {?} */
        const hooksInitPhaseCompleted = (flags & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        // execute pre-order hooks (OnInit, OnChanges, DoChanges)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                /** @type {?} */
                const preOrderCheckHooks = tView.preOrderCheckHooks;
                if (preOrderCheckHooks !== null) {
                    executeCheckHooks(lView, preOrderCheckHooks, null);
                }
            }
            else {
                /** @type {?} */
                const preOrderHooks = tView.preOrderHooks;
                if (preOrderHooks !== null) {
                    executeInitAndCheckHooks(lView, preOrderHooks, 0 /* OnInitHooksToBeRun */, null);
                }
                incrementInitPhaseFlags(lView, 0 /* OnInitHooksToBeRun */);
            }
        }
        refreshDynamicEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        if (tView.contentQueries !== null) {
            refreshContentQueries(tView, lView);
        }
        // execute content hooks (AfterContentInit, AfterContentChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                /** @type {?} */
                const contentCheckHooks = tView.contentCheckHooks;
                if (contentCheckHooks !== null) {
                    executeCheckHooks(lView, contentCheckHooks);
                }
            }
            else {
                /** @type {?} */
                const contentHooks = tView.contentHooks;
                if (contentHooks !== null) {
                    executeInitAndCheckHooks(lView, contentHooks, 1 /* AfterContentInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 1 /* AfterContentInitHooksToBeRun */);
            }
        }
        setHostBindings(tView, lView);
        /** @type {?} */
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(2 /* Update */, viewQuery, context);
        }
        // Refresh child component views.
        /** @type {?} */
        const components = tView.components;
        if (components !== null) {
            refreshChildComponents(lView, components);
        }
        // execute view hooks (AfterViewInit, AfterViewChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                /** @type {?} */
                const viewCheckHooks = tView.viewCheckHooks;
                if (viewCheckHooks !== null) {
                    executeCheckHooks(lView, viewCheckHooks);
                }
            }
            else {
                /** @type {?} */
                const viewHooks = tView.viewHooks;
                if (viewHooks !== null) {
                    executeInitAndCheckHooks(lView, viewHooks, 2 /* AfterViewInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 2 /* AfterViewInitHooksToBeRun */);
            }
        }
    }
    finally {
        lView[FLAGS] &= ~(64 /* Dirty */ | 8 /* FirstLViewPass */);
        selectView(oldView, null);
    }
}
/**
 * @template T
 * @param {?} hostView
 * @param {?} templateFn
 * @param {?} context
 * @return {?}
 */
export function renderComponentOrTemplate(hostView, templateFn, context) {
    /** @type {?} */
    const rendererFactory = hostView[RENDERER_FACTORY];
    /** @type {?} */
    const normalExecutionPath = !getCheckNoChangesMode();
    /** @type {?} */
    const creationModeIsActive = isCreationMode(hostView);
    try {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        /** @type {?} */
        const tView = hostView[TVIEW];
        if (creationModeIsActive) {
            renderView(hostView, tView, context);
        }
        refreshView(hostView, tView, templateFn, context);
    }
    finally {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
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
        if (rf & 2 /* Update */ && lView.length > HEADER_OFFSET) {
            // When we're updating, have an inherent ɵɵselect(0) so we don't have to generate that
            // instruction for most update blocks
            selectInternal(lView, 0, getCheckNoChangesMode());
        }
        templateFn(rf, context);
    }
    finally {
        setSelectedIndex(prevSelectedIndex);
    }
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
 * Creates directive instances.
 * @param {?} tView
 * @param {?} lView
 * @param {?} tNode
 * @return {?}
 */
export function createDirectivesInstances(tView, lView, tNode) {
    if (!getBindingsEnabled())
        return;
    instantiateAllDirectives(tView, lView, tNode);
    invokeDirectivesHostBindings(tView, lView, tNode);
    setActiveHostElement(null);
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LView in the same order as they are loaded in the template with load().
 * @param {?} viewData
 * @param {?} tNode
 * @param {?=} localRefExtractor
 * @return {?}
 */
export function saveResolvedLocalsInData(viewData, tNode, localRefExtractor = getNativeByTNode) {
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
    const blueprint = ngDevMode ? new (/** @type {?} */ (LViewBlueprint))() : [];
    for (let i = 0; i < initialViewLength; i++) {
        blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
    }
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return (/** @type {?} */ (blueprint));
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
    null, // propertyBindings: number[]|null
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
            propertyBindings: null,
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
 * @param {?} tView
 * @param {?} tNode
 * @param {?} direction whether to consider inputs or outputs
 * @return {?} PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
export function generatePropertyAliases(tView, tNode, direction) {
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
    const tView = lView[TVIEW];
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    let inputData;
    /** @type {?} */
    let dataValue;
    if (!nativeOnly && (inputData = initializeTNodeInputs(tView, tNode)) &&
        (dataValue = inputData[propName])) {
        setInputsForProperty(lView, dataValue, value);
        if (isComponentHost(tNode))
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
        baseResolveDirective(tView, viewData, def);
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
    ngDevMode && assertFirstTemplatePass(tView);
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
            baseResolveDirective(tView, lView, def);
            saveNameToExportMap((/** @type {?} */ (tView.data)).length - 1, def, exportsMap);
            if (def.contentQueries) {
                tNode.flags |= 8 /* hasContentQuery */;
            }
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
        postProcessDirective(lView, tNode, directive, def, i);
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
 * @param {?} lView
 * @param {?} hostTNode
 * @param {?} directive
 * @param {?} def
 * @param {?} directiveDefIdx
 * @return {?}
 */
function postProcessDirective(lView, hostTNode, directive, def, directiveDefIdx) {
    postProcessBaseDirective(lView, hostTNode, directive);
    if (hostTNode.attrs !== null) {
        setInputsFromAttrs(directiveDefIdx, directive, def, hostTNode);
    }
    if (isComponentDef(def)) {
        /** @type {?} */
        const componentView = getComponentViewByIndex(hostTNode.index, lView);
        componentView[CONTEXT] = directive;
    }
}
/**
 * A lighter version of postProcessDirective() that is used for the root component.
 * @template T
 * @param {?} lView
 * @param {?} hostTNode
 * @param {?} directive
 * @return {?}
 */
function postProcessBaseDirective(lView, hostTNode, directive) {
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'directives should be created before any bindings');
    attachPatchData(directive, lView);
    /** @type {?} */
    const native = getNativeByTNode(hostTNode, lView);
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
    ngDevMode && assertFirstTemplatePass(tView);
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 4 /* ElementContainer */, 0 /* Container */);
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
                    if (tNode.flags & 2 /* isComponentHost */)
                        throwMultipleComponentError(tNode);
                    markAsComponentHost(tView, tNode);
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
 * Marks a given TNode as a component's host. This consists of:
 * - setting appropriate TNode flags;
 * - storing index of component's host element so it will be queued for view refresh during CD.
 * @param {?} tView
 * @param {?} hostTNode
 * @return {?}
 */
export function markAsComponentHost(tView, hostTNode) {
    ngDevMode && assertFirstTemplatePass(tView);
    hostTNode.flags = 2 /* isComponentHost */;
    (tView.components || (tView.components = ngDevMode ? new (/** @type {?} */ (TViewComponents))() : [])).push(hostTNode.index);
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
    ngDevMode && assertEqual(flags === 0 || flags === 2 /* isComponentHost */, true, 'expected node flags to not be initialized');
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    // When the first directive is created on a node, save the index
    tNode.flags = (flags & 2 /* isComponentHost */) | 1 /* isDirectiveHost */;
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
    tNode.providerIndexes = index;
}
/**
 * @template T
 * @param {?} tView
 * @param {?} viewData
 * @param {?} def
 * @return {?}
 */
function baseResolveDirective(tView, viewData, def) {
    tView.data.push(def);
    /** @type {?} */
    const directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
    /** @type {?} */
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} hostTNode
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(lView, hostTNode, def) {
    /** @type {?} */
    const native = (/** @type {?} */ (getNativeByTNode(hostTNode, lView)));
    /** @type {?} */
    const tView = getOrCreateTView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    /** @type {?} */
    const rendererFactory = lView[RENDERER_FACTORY];
    /** @type {?} */
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, native, (/** @type {?} */ (hostTNode)), rendererFactory, rendererFactory.createRenderer(native, def)));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[hostTNode.index] = componentView;
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
 * them by executing an associated template function.
 * @param {?} lView
 * @return {?}
 */
function refreshDynamicEmbeddedViews(lView) {
    /** @type {?} */
    let viewOrContainer = lView[CHILD_HEAD];
    while (viewOrContainer !== null) {
        // Note: viewOrContainer can be an LView or an LContainer instance, but here we are only
        // interested in LContainer
        if (isLContainer(viewOrContainer) && viewOrContainer[ACTIVE_INDEX] === -1) {
            for (let i = CONTAINER_HEADER_OFFSET; i < viewOrContainer.length; i++) {
                /** @type {?} */
                const embeddedLView = viewOrContainer[i];
                /** @type {?} */
                const embeddedTView = embeddedLView[TVIEW];
                ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
                refreshView(embeddedLView, embeddedTView, embeddedTView.template, (/** @type {?} */ (embeddedLView[CONTEXT])));
            }
        }
        viewOrContainer = viewOrContainer[NEXT];
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param {?} hostLView
 * @param {?} componentHostIdx  Element index in LView[] (adjusted for HEADER_OFFSET)
 * @return {?}
 */
function refreshComponent(hostLView, componentHostIdx) {
    ngDevMode && assertEqual(isCreationMode(hostLView), false, 'Should be run in update mode');
    /** @type {?} */
    const componentView = getComponentViewByIndex(componentHostIdx, hostLView);
    // Only attached components that are CheckAlways or OnPush and dirty should be refreshed
    if (viewAttachedToChangeDetector(componentView) &&
        componentView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
        /** @type {?} */
        const tView = componentView[TVIEW];
        refreshView(componentView, tView, tView.template, componentView[CONTEXT]);
    }
}
/**
 * @param {?} hostLView
 * @param {?} componentHostIdx
 * @return {?}
 */
function renderComponent(hostLView, componentHostIdx) {
    ngDevMode && assertEqual(isCreationMode(hostLView), true, 'Should be run in creation mode');
    /** @type {?} */
    const componentView = getComponentViewByIndex(componentHostIdx, hostLView);
    syncViewWithBlueprint(componentView);
    renderView(componentView, componentView[TVIEW], componentView[CONTEXT]);
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
        componentView.push(componentTView.blueprint[i]);
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
        /** @type {?} */
        const lView = (/** @type {?} */ (readPatchedLView(rootComponent)));
        /** @type {?} */
        const tView = lView[TVIEW];
        renderComponentOrTemplate(lView, tView.template, rootComponent);
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
        /** @type {?} */
        const tView = view[TVIEW];
        refreshView(view, tView, tView.template, context);
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
 * @template T
 * @param {?} flags
 * @param {?} viewQueryFn
 * @param {?} component
 * @return {?}
 */
function executeViewQueryFn(flags, viewQueryFn, component) {
    ngDevMode && assertDefined(viewQueryFn, 'View queries function to execute must be defined.');
    setCurrentQueryIndex(0);
    viewQueryFn(flags, component);
}
///////////////////////////////
//// Bindings & interpolations
///////////////////////////////
/**
 * Stores meta-data for a property binding to be used by TestBed's `DebugElement.properties`.
 *
 * In order to support TestBed's `DebugElement.properties` we need to save, for each binding:
 * - a bound property name;
 * - a static parts of interpolated strings;
 *
 * A given property metadata is saved at the binding's index in the `TView.data` (in other words, a
 * property binding metadata will be stored in `TView.data` at the same index as a bound value in
 * `LView`). Metadata are represented as `INTERPOLATION_DELIMITER`-delimited string with the
 * following format:
 * - `propertyName` for bound properties;
 * - `propertyName�prefix�interpolation_static_part1�..interpolation_static_partN�suffix` for
 * interpolated properties.
 *
 * @param {?} tData `TData` where meta-data will be saved;
 * @param {?} nodeIndex index of a `TNode` that is a target of the binding;
 * @param {?} propertyName bound property name;
 * @param {?} bindingIndex binding index in `LView`
 * @param {...?} interpolationParts static interpolation parts (for property interpolations)
 * @return {?}
 */
export function storePropertyBindingMetadata(tData, nodeIndex, propertyName, bindingIndex, ...interpolationParts) {
    // Binding meta-data are stored only the first time a given property instruction is processed.
    // Since we don't have a concept of the "first update pass" we need to check for presence of the
    // binding meta-data to decide if one should be stored (or if was stored already).
    if (tData[bindingIndex] === null) {
        /** @type {?} */
        const tNode = (/** @type {?} */ (tData[nodeIndex + HEADER_OFFSET]));
        if (tNode.inputs == null || !tNode.inputs[propertyName]) {
            /** @type {?} */
            const propBindingIdxs = tNode.propertyBindings || (tNode.propertyBindings = []);
            propBindingIdxs.push(bindingIndex);
            /** @type {?} */
            let bindingMetadata = propertyName;
            if (interpolationParts.length > 0) {
                bindingMetadata +=
                    INTERPOLATION_DELIMITER + interpolationParts.join(INTERPOLATION_DELIMITER);
            }
            tData[bindingIndex] = bindingMetadata;
        }
    }
}
/** @type {?} */
export const CLEAN_PROMISE = _CLEAN_PROMISE;
/**
 * @param {?} tView
 * @param {?} tNode
 * @return {?}
 */
export function initializeTNodeInputs(tView, tNode) {
    // If tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked.
    if (tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tView, tNode, 0 /* Input */);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQy9GLE9BQU8sRUFBQyw4QkFBOEIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRS9HLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakosT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLHVCQUF1QixFQUFFLFdBQVcsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUMvRCxPQUFPLEVBQUMsZUFBZSxFQUFFLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakYsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUM1QyxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUYsT0FBTyxFQUFDLDJCQUEyQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3RELE9BQU8sRUFBQyxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSx1QkFBdUIsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNySCxPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixF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RUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25FLFNBQVMsSUFBSSxTQUFTLENBQUMsZUFBZSxFQUFFLENBQUM7O1VBQ25DLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO0lBQ2hDLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7QUFDbkcsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFXRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVk7SUFDdEYsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3hELGdCQUFnQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzLCB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90U2FtZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydEZpcnN0VGVtcGxhdGVQYXNzLCBhc3NlcnRMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MsIHJlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgRmFjdG9yeUZuLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0lOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFLCBOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc1ZhbHVlLCBQcm9wZXJ0eUFsaWFzZXMsIFRBdHRyaWJ1dGVzLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUlRleHQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZiwgaXNDb21wb25lbnRIb3N0LCBpc0NvbnRlbnRRdWVyeUhvc3QsIGlzTENvbnRhaW5lciwgaXNSb290Vmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJTkpFQ1RPUiwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7aXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge2dldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQsIG5hbWVzcGFjZUhUTUxJbnRlcm5hbCwgc2VsZWN0Vmlldywgc2V0QWN0aXZlSG9zdEVsZW1lbnQsIHNldEJpbmRpbmdSb290LCBzZXRDaGVja05vQ2hhbmdlc01vZGUsIHNldEN1cnJlbnREaXJlY3RpdmVEZWYsIHNldEN1cnJlbnRRdWVyeUluZGV4LCBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHNldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7cmVuZGVyU3R5bGluZ01hcH0gZnJvbSAnLi4vc3R5bGluZ19uZXh0L2JpbmRpbmdzJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHtBTklNQVRJT05fUFJPUF9QUkVGSVgsIGlzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBnZXRUTm9kZSwgaXNDcmVhdGlvbk1vZGUsIHJlYWRQYXRjaGVkTFZpZXcsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHVud3JhcFJOb2RlLCB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge0xDbGVhbnVwLCBMVmlld0JsdWVwcmludCwgTWF0Y2hlc0FycmF5LCBUQ2xlYW51cCwgVE5vZGVDb25zdHJ1Y3RvciwgVE5vZGVJbml0aWFsRGF0YSwgVE5vZGVJbml0aWFsSW5wdXRzLCBUTm9kZUxvY2FsTmFtZXMsIFRWaWV3Q29tcG9uZW50cywgVFZpZXdDb25zdHJ1Y3RvciwgYXR0YWNoTENvbnRhaW5lckRlYnVnLCBhdHRhY2hMVmlld0RlYnVnLCBjbG9uZVRvTFZpZXcsIGNsb25lVG9UVmlld0RhdGF9IGZyb20gJy4vbHZpZXdfZGVidWcnO1xuaW1wb3J0IHtzZWxlY3RJbnRlcm5hbH0gZnJvbSAnLi9zZWxlY3QnO1xuXG5cblxuLyoqXG4gKiBBIHBlcm1hbmVudCBtYXJrZXIgcHJvbWlzZSB3aGljaCBzaWduaWZpZXMgdGhhdCB0aGUgY3VycmVudCBDRCB0cmVlIGlzXG4gKiBjbGVhbi5cbiAqL1xuY29uc3QgX0NMRUFOX1BST01JU0UgPSAoKCkgPT4gUHJvbWlzZS5yZXNvbHZlKG51bGwpKSgpO1xuXG5leHBvcnQgY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgaWYgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgIT09IG51bGwpIHtcbiAgICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gdmlld0RhdGFbQklORElOR19JTkRFWF0gPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgbWVhbiB0aGF0IHdlIGFyZSBzdGFydGluZyBuZXcgRVhQQU5ETyBibG9jayBhbmQgbmVlZCB0byB1cGRhdGVcbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgICAgLy8gSW5qZWN0b3IgYmxvY2sgYW5kIHByb3ZpZGVycyBhcmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgICAgICAgICAgY29uc3QgcHJvdmlkZXJDb3VudCA9ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zWysraV0gYXMgbnVtYmVyKTtcbiAgICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAgIC8vIGFuZCBnZXQgdG8gdGhlIGZpcnN0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkgb3IgdGhlIGhvc3QgdmFyIGNvdW50XG4gICAgICAgICAgICAvLyAodG8gZ2V0IHRvIHRoZSBuZXh0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkuXG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBpdCdzIG5vdCBhIG51bWJlciwgaXQncyBhIGhvc3QgYmluZGluZyBmdW5jdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGV4ZWN1dGVkLlxuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgICAgY29uc3QgaG9zdEN0eCA9IHVud3JhcFJOb2RlKHZpZXdEYXRhW2N1cnJlbnREaXJlY3RpdmVJbmRleF0pO1xuICAgICAgICAgICAgaW5zdHJ1Y3Rpb24oUmVuZGVyRmxhZ3MuVXBkYXRlLCBob3N0Q3R4LCBjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgICAgLy8gRWFjaCBkaXJlY3RpdmUgZ2V0cyBhIHVuaXF1ZUlkIHZhbHVlIHRoYXQgaXMgdGhlIHNhbWUgZm9yIGJvdGhcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAgICAgICAgICAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAgICAgICAgICAgLy8gZWFjaCBob3N0QmluZGluZ3MgY2FsbCBhbmQgaXMgdXNlZnVsIGZvciBoZWxwaW5nIGluc3RydWN0aW9uIGNvZGVcbiAgICAgICAgICAgIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICAgICAgICAgICAgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoc2VsZWN0ZWRJbmRleCk7XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyAhKFJlbmRlckZsYWdzLlVwZGF0ZSwgbFZpZXdbZGlyZWN0aXZlRGVmSWR4XSwgZGlyZWN0aXZlRGVmSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKHVwZGF0ZSBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50czogbnVtYmVyW10pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVmcmVzaENvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbi8qKiBSZW5kZXJzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAoY3JlYXRpb24gbW9kZSkuICovXG5mdW5jdGlvbiByZW5kZXJDaGlsZENvbXBvbmVudHMoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50czogbnVtYmVyW10pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmF0aXZlIGVsZW1lbnQgZnJvbSBhIHRhZyBuYW1lLCB1c2luZyBhIHJlbmRlcmVyLlxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gcmVuZGVyZXIgQSByZW5kZXJlciB0byB1c2VcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUoXG4gICAgbmFtZTogc3RyaW5nLCByZW5kZXJlcjogUmVuZGVyZXIzLCBuYW1lc3BhY2U6IHN0cmluZyB8IG51bGwpOiBSRWxlbWVudCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuYW1lc3BhY2UgPT09IG51bGwgPyByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlldyB8IG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIGhvc3Q6IFJFbGVtZW50IHwgbnVsbCwgdEhvc3ROb2RlOiBUVmlld05vZGUgfCBURWxlbWVudE5vZGUgfCBudWxsLFxuICAgIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTMgfCBudWxsLCByZW5kZXJlcj86IFJlbmRlcmVyMyB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCwgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID0gbmdEZXZNb2RlID8gY2xvbmVUb0xWaWV3KHRWaWV3LmJsdWVwcmludCkgOiB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLCAnUmVuZGVyZXJGYWN0b3J5IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSXSwgJ1JlbmRlcmVyIGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbU0FOSVRJWkVSXSB8fCBudWxsICE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IHRIb3N0Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExWaWV3RGVidWcobFZpZXcpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdEhvc3ROb2RlIFRoaXMgaXMgYSBoYWNrIGFuZCB3ZSBzaG91bGQgbm90IGhhdmUgdG8gcGFzcyB0aGlzIHZhbHVlIGluLiBJdCBpcyBvbmx5IHVzZWQgdG9cbiAqIGRldGVybWluZSBpZiB0aGUgcGFyZW50IGJlbG9uZ3MgdG8gYSBkaWZmZXJlbnQgdFZpZXcuIEluc3RlYWQgd2Ugc2hvdWxkIG5vdCBoYXZlIHBhcmVudFRWaWV3XG4gKiBwb2ludCB0byBUVmlldyBvdGhlciB0aGUgY3VycmVudCBvbmUuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZcbiAgICBUSWN1Q29udGFpbmVyTm9kZSB7XG4gIC8vIEtlZXAgdGhpcyBmdW5jdGlvbiBzaG9ydCwgc28gdGhhdCB0aGUgVk0gd2lsbCBpbmxpbmUgaXQuXG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSBhcyBUTm9kZSB8fFxuICAgICAgY3JlYXRlVE5vZGVBdEluZGV4KHRWaWV3LCB0SG9zdE5vZGUsIGFkanVzdGVkSW5kZXgsIHR5cGUsIG5hbWUsIGF0dHJzKTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUTm9kZUF0SW5kZXgoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCkge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgcGFyZW50ICE9PSB0SG9zdE5vZGU7XG4gIGNvbnN0IHRQYXJlbnROb2RlID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICBjcmVhdGVUTm9kZSh0VmlldywgdFBhcmVudE5vZGUsIHR5cGUsIGFkanVzdGVkSW5kZXgsIG5hbWUsIGF0dHJzKTtcbiAgLy8gQXNzaWduIGEgcG9pbnRlciB0byB0aGUgZmlyc3QgY2hpbGQgbm9kZSBvZiBhIGdpdmVuIHZpZXcuIFRoZSBmaXJzdCBub2RlIGlzIG5vdCBhbHdheXMgdGhlIG9uZVxuICAvLyBhdCBpbmRleCAwLCBpbiBjYXNlIG9mIGkxOG4sIGluZGV4IDAgY2FuIGJlIHRoZSBpbnN0cnVjdGlvbiBgaTE4blN0YXJ0YCBhbmQgdGhlIGZpcnN0IG5vZGUgaGFzXG4gIC8vIHRoZSBpbmRleCAxIG9yIG1vcmUsIHNvIHdlIGNhbid0IGp1c3QgY2hlY2sgbm9kZSBpbmRleC5cbiAgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT09IG51bGwpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJlxuICAgICAgICAodE5vZGUucGFyZW50ICE9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykpIHtcbiAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICB9IGVsc2UgaWYgKCFpc1BhcmVudCkge1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduVFZpZXdOb2RlVG9MVmlldyhcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFRWaWV3Tm9kZSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgbGV0IHROb2RlID0gdFZpZXcubm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdFBhcmVudE5vZGUgJiZcbiAgICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0UGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIHRWaWV3Lm5vZGUgPSB0Tm9kZSA9IGNyZWF0ZVROb2RlKFxuICAgICAgICB0VmlldyxcbiAgICAgICAgdFBhcmVudE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCAgLy9cbiAgICAgICAgVE5vZGVUeXBlLlZpZXcsIGluZGV4LCBudWxsLCBudWxsKSBhcyBUVmlld05vZGU7XG4gIH1cblxuICByZXR1cm4gbFZpZXdbVF9IT1NUXSA9IHROb2RlIGFzIFRWaWV3Tm9kZTtcbn1cblxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpIG9yIENvbXBvbmVudEZhY3RvcnkuY3JlYXRlKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKlxuICogQHBhcmFtIHZpZXcgVGhlIExWaWV3IGNvbnRhaW5pbmcgdGhlIGJsdWVwcmludCB0byBhZGp1c3RcbiAqIEBwYXJhbSBudW1TbG90c1RvQWxsb2MgVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBpbiB0aGUgTFZpZXcsIHNob3VsZCBiZSA+MFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKHZpZXc6IExWaWV3LCBudW1TbG90c1RvQWxsb2M6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0R3JlYXRlclRoYW4oXG4gICAgICAgICAgICAgICAgICAgbnVtU2xvdHNUb0FsbG9jLCAwLCAnVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA+IDApIHtcbiAgICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICAgIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgICAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICAgICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICAgICAgICB2aWV3LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHNob3VsZCBvbmx5IGluY3JlbWVudCB0aGUgZXhwYW5kbyBzdGFydCBpbmRleCBpZiB0aGVyZSBhcmVuJ3QgYWxyZWFkeSBkaXJlY3RpdmVzXG4gICAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgICBpZiAoIXRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICAgICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKz0gbnVtU2xvdHNUb0FsbG9jO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2luY2Ugd2UncmUgYWRkaW5nIHRoZSBkeW5hbWljIG5vZGVzIGludG8gdGhlIGV4cGFuZG8gc2VjdGlvbiwgd2UgbmVlZCB0byBsZXQgdGhlIGhvc3RcbiAgICAgICAgLy8gYmluZGluZ3Mga25vdyB0aGF0IHRoZXkgc2hvdWxkIHNraXAgeCBzbG90c1xuICAgICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB0aGUgY3JlYXRpb24gbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBjcmVhdGluZyB2aWV3IHF1ZXJ5IGZ1bmN0aW9ucyAoaWYgYW55KTtcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdGhlIGNyZWF0aW9uIG1vZGU7XG4gKiAtIHVwZGF0aW5nIHN0YXRpYyBxdWVyaWVzIChpZiBhbnkpO1xuICogLSBjcmVhdGluZyBjaGlsZCBjb21wb25lbnRzIGRlZmluZWQgaW4gYSBnaXZlbiB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVmlldzxUPihsVmlldzogTFZpZXcsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGNvbnN0IG9sZFZpZXcgPSBzZWxlY3RWaWV3KGxWaWV3LCBsVmlld1tUX0hPU1RdKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLkNyZWF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdmlldywgaWYgaXQgZXhpc3RzLiBBIHRlbXBsYXRlIGZ1bmN0aW9uIG1pZ2h0IG5vdCBiZVxuICAgIC8vIGRlZmluZWQgZm9yIHRoZSByb290IGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCB0ZW1wbGF0ZUZuID0gdFZpZXcudGVtcGxhdGU7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZShsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzLlxuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gICAgLy8gY29udGVudCBxdWVyaWVzIGFyZSByZXNvbHZlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiAoaS5lLiB1cGRhdGUgbW9kZSksIGFmdGVyIGVtYmVkZGVkXG4gICAgLy8gdmlld3MgYXJlIHJlZnJlc2hlZCAoc2VlIGJsb2NrIGFib3ZlKS5cbiAgICBpZiAodFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIFdlIG11c3QgbWF0ZXJpYWxpemUgcXVlcnkgcmVzdWx0cyBiZWZvcmUgY2hpbGQgY29tcG9uZW50cyBhcmUgcHJvY2Vzc2VkXG4gICAgLy8gaW4gY2FzZSBhIGNoaWxkIGNvbXBvbmVudCBoYXMgcHJvamVjdGVkIGEgY29udGFpbmVyLiBUaGUgTENvbnRhaW5lciBuZWVkc1xuICAgIC8vIHRvIGV4aXN0IHNvIHRoZSBlbWJlZGRlZCB2aWV3cyBhcmUgcHJvcGVybHkgYXR0YWNoZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAgICBpZiAodFZpZXcuc3RhdGljVmlld1F1ZXJpZXMpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5VcGRhdGUsIHRWaWV3LnZpZXdRdWVyeSAhLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZW5kZXJDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICB9IGZpbmFsbHkge1xuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgc2VsZWN0VmlldyhvbGRWaWV3LCBudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFZpZXc8VD4oXG4gICAgbFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnwgbnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3Qgb2xkVmlldyA9IHNlbGVjdFZpZXcobFZpZXcsIGxWaWV3W1RfSE9TVF0pO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdSb290KGxWaWV3W0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUobFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGFuZ2VzKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgY29udGVudCBob29rcyAoQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJDb250ZW50Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2V0SG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldyk7XG5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSB2aWV3IGhvb2tzIChBZnRlclZpZXdJbml0LCBBZnRlclZpZXdDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCB2aWV3Q2hlY2tIb29rcyA9IHRWaWV3LnZpZXdDaGVja0hvb2tzO1xuICAgICAgICBpZiAodmlld0NoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgdmlld0NoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2aWV3SG9va3MgPSB0Vmlldy52aWV3SG9va3M7XG4gICAgICAgIGlmICh2aWV3SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHZpZXdIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICB9IGZpbmFsbHkge1xuICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICBzZWxlY3RWaWV3KG9sZFZpZXcsIG51bGwpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fCBudWxsLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGhvc3RWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCBjcmVhdGlvbk1vZGVJc0FjdGl2ZSA9IGlzQ3JlYXRpb25Nb2RlKGhvc3RWaWV3KTtcbiAgdHJ5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG4gICAgY29uc3QgdFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICByZW5kZXJWaWV3KGhvc3RWaWV3LCB0VmlldywgY29udGV4dCk7XG4gICAgfVxuICAgIHJlZnJlc2hWaWV3KGhvc3RWaWV3LCB0VmlldywgdGVtcGxhdGVGbiwgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHJmOiBSZW5kZXJGbGFncywgY29udGV4dDogVCkge1xuICBuYW1lc3BhY2VIVE1MSW50ZXJuYWwoKTtcbiAgY29uc3QgcHJldlNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG4gICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlICYmIGxWaWV3Lmxlbmd0aCA+IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIFdoZW4gd2UncmUgdXBkYXRpbmcsIGhhdmUgYW4gaW5oZXJlbnQgybXJtXNlbGVjdCgwKSBzbyB3ZSBkb24ndCBoYXZlIHRvIGdlbmVyYXRlIHRoYXRcbiAgICAgIC8vIGluc3RydWN0aW9uIGZvciBtb3N0IHVwZGF0ZSBibG9ja3NcbiAgICAgIHNlbGVjdEludGVybmFsKGxWaWV3LCAwLCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG4gICAgfVxuICAgIHRlbXBsYXRlRm4ocmYsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgocHJldlNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgcmV0dXJuIGRlZi50VmlldyB8fCAoZGVmLnRWaWV3ID0gY3JlYXRlVFZpZXcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZi52aWV3UXVlcnksIGRlZi5zY2hlbWFzKSk7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gY29uc3RzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcmllcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gc2NoZW1hcyBTY2hlbWFzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBjb25zdHM6IG51bWJlciwgdmFyczogbnVtYmVyLFxuICAgIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fCBudWxsLCBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdIHwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBjb25zdHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgcmV0dXJuIGJsdWVwcmludFtUVklFVyBhcyBhbnldID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUVmlld0NvbnN0cnVjdG9yKFxuICAgICAgICAgICAgIHZpZXdJbmRleCwgICAvLyBpZDogbnVtYmVyLFxuICAgICAgICAgICAgIGJsdWVwcmludCwgICAvLyBibHVlcHJpbnQ6IExWaWV3LFxuICAgICAgICAgICAgIHRlbXBsYXRlRm4sICAvLyB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgIC8vIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGxcbiAgICAgICAgICAgICB2aWV3UXVlcnksICAgLy8gdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwgISwgICAgICAvLyBub2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGwsXG4gICAgICAgICAgICAgY2xvbmVUb1RWaWV3RGF0YShibHVlcHJpbnQpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLCAgLy8gZGF0YTogVERhdGEsXG4gICAgICAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXgsICAvLyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgIGluaXRpYWxWaWV3TGVuZ3RoLCAgLy8gZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGV4cGFuZG9JbnN0cnVjdGlvbnM6IEV4cGFuZG9JbnN0cnVjdGlvbnN8bnVsbCxcbiAgICAgICAgICAgICB0cnVlLCAgICAgICAgICAgICAgIC8vIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgLy8gc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICAgICApIDpcbiAgICAgIHtcbiAgICAgICAgaWQ6IHZpZXdJbmRleCxcbiAgICAgICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgICAgICBxdWVyaWVzOiBudWxsLFxuICAgICAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICAgICAgbm9kZTogbnVsbCAhLFxuICAgICAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgICAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgICAgIGNsZWFudXA6IG51bGwsXG4gICAgICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgICAgICBjb21wb25lbnRzOiBudWxsLFxuICAgICAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgICAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICAgICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICAgICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmdEZXZNb2RlID8gbmV3IExWaWV3Qmx1ZXByaW50ICEoKSA6IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbFZpZXdMZW5ndGg7IGkrKykge1xuICAgIGJsdWVwcmludC5wdXNoKGkgPCBiaW5kaW5nU3RhcnRJbmRleCA/IG51bGwgOiBOT19DSEFOR0UpO1xuICB9XG4gIGJsdWVwcmludFtCSU5ESU5HX0lOREVYXSA9IGJpbmRpbmdTdGFydEluZGV4O1xuXG4gIHJldHVybiBibHVlcHJpbnQgYXMgTFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8vIFRPRE86IFJlbW92ZSB0aGlzIHdoZW4gdGhlIGlzc3VlIGlzIHJlc29sdmVkLlxuLyoqXG4gKiBUc2lja2xlIGhhcyBhIGJ1ZyB3aGVyZSBpdCBjcmVhdGVzIGFuIGluZmluaXRlIGxvb3AgZm9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGl0c2VsZi5cbiAqIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0aGF0IHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzEwMDkpXG4gKi9cbmV4cG9ydCB0eXBlIFRzaWNrbGVJc3N1ZTEwMDkgPSBhbnk7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIHJldHVybiBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVDb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIGZsYWdzOiBUTm9kZUZsYWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLCAgICAgICAgLy8gdGFnTmFtZTogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycywgIC8vIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gbmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjaGlsZDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50LCAgICAvLyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKSA6XG4gICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4OiBpbmplY3RvckluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiBhdHRycyxcbiAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICB0Vmlld3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjaGlsZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0UGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICB9O1xufVxuXG5cbi8qKlxuICogQ29uc29saWRhdGVzIGFsbCBpbnB1dHMgb3Igb3V0cHV0cyBvZiBhbGwgZGlyZWN0aXZlcyBvbiB0aGlzIGxvZ2ljYWwgbm9kZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGVcbiAqIEBwYXJhbSBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5jb25zdCBBVFRSX1RPX1BST1A6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgJ2NsYXNzJzogJ2NsYXNzTmFtZScsXG4gICdmb3InOiAnaHRtbEZvcicsXG4gICdmb3JtYWN0aW9uJzogJ2Zvcm1BY3Rpb24nLFxuICAnaW5uZXJIdG1sJzogJ2lubmVySFRNTCcsXG4gICdyZWFkb25seSc6ICdyZWFkT25seScsXG4gICd0YWJpbmRleCc6ICd0YWJJbmRleCcsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCwgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICBsZXQgaW5wdXREYXRhOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWQ7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiAoaW5wdXREYXRhID0gaW5pdGlhbGl6ZVROb2RlSW5wdXRzKHRWaWV3LCB0Tm9kZSkpICYmXG4gICAgICAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eShsVmlldywgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICAgICAqIGkrMDogZGlyZWN0aXZlIGluc3RhbmNlIGluZGV4XG4gICAgICAgICAqIGkrMTogcHVibGljTmFtZVxuICAgICAgICAgKiBpKzI6IHByaXZhdGVOYW1lXG4gICAgICAgICAqXG4gICAgICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMl1cbiAgICAgICAgICovXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZVtpICsgMl0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBwcm9wTmFtZSA9IEFUVFJfVE9fUFJPUFtwcm9wTmFtZV0gfHwgcHJvcE5hbWU7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5XG4gICAgLy8gaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBwcm9wTmFtZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBhIGNvbnRhaW5lciBhbmQgdGhlIHByb3BlcnR5IGRpZG4ndFxuICAgIC8vIG1hdGNoIGFueSBvZiB0aGUgaW5wdXRzIG9yIHNjaGVtYXMgd2Ugc2hvdWxkIHRocm93LlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgIW1hdGNoaW5nU2NoZW1hcyhsVmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICAgIHRocm93IGNyZWF0ZVVua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlldyBkaXJ0eS4gKi9cbmZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydHkoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGF0dHJOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShhdHRyTmFtZSk7XG4gIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gIGlmICh0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUsIGRlYnVnVmFsdWUpIDpcbiAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPSBgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWA7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB0ZXh0Q29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHRleHRDb250ZW50O1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RVbmtub3duUHJvcGVydGllcyhcbiAgICBob3N0VmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSkge1xuICAvLyBJZiB0aGUgdGFnIG1hdGNoZXMgYW55IG9mIHRoZSBzY2hlbWFzIHdlIHNob3VsZG4ndCB0aHJvdy5cbiAgaWYgKG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBwcm9wIGlzIG5vdCBhIGtub3duIHByb3BlcnR5IG9mIHRoZSBIVE1MIGVsZW1lbnQuLi5cbiAgaWYgKCEocHJvcE5hbWUgaW4gZWxlbWVudCkgJiZcbiAgICAgIC8vIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQuLi4gKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpXG4gICAgICB0eXBlb2YgTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBlbGVtZW50IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgLy8gYW5kIGlzbid0IGEgc3ludGhldGljIGFuaW1hdGlvbiBwcm9wZXJ0eS4uLlxuICAgICAgcHJvcE5hbWVbMF0gIT09IEFOSU1BVElPTl9QUk9QX1BSRUZJWCkge1xuICAgIC8vIC4uLiBpdCBpcyBwcm9iYWJseSBhIHVzZXIgZXJyb3IgYW5kIHdlIHNob3VsZCB0aHJvdy5cbiAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldzogTFZpZXcsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IGhvc3RWaWV3W1RWSUVXXS5zY2hlbWFzO1xuXG4gIGlmIChzY2hlbWFzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzY2hlbWEgPSBzY2hlbWFzW2ldO1xuICAgICAgaWYgKHNjaGVtYSA9PT0gTk9fRVJST1JTX1NDSEVNQSB8fFxuICAgICAgICAgIHNjaGVtYSA9PT0gQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSAmJiB0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiogQ3JlYXRlcyBhbiBlcnJvciB0aGF0IHNob3VsZCBiZSB0aHJvd24gd2hlbiBlbmNvdW50ZXJpbmcgYW4gdW5rbm93biBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50LlxuKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiB0aGUgaW52YWxpZCBwcm9wZXJ0eS5cbiogQHBhcmFtIHROb2RlIE5vZGUgb24gd2hpY2ggd2UgZW5jb3VudGVyZWQgdGhlIGVycm9yLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZVVua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgIGBUZW1wbGF0ZSBlcnJvcjogQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dE5vZGUudGFnTmFtZX0nLmApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmKTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPVxuICAgICAgZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgdmlld0RhdGEsIHZpZXdEYXRhLmxlbmd0aCAtIDEsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHJvb3RUTm9kZSwgZGlyZWN0aXZlKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3ModFZpZXcpO1xuXG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcblxuICBjb25zdCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG5cbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA9ICh0Vmlldy5wcmVPcmRlckhvb2tzICYmIHRWaWV3LnByZU9yZGVySG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPVxuICAgICAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzICYmIHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcy5sZW5ndGgpIHx8IDA7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0VmlldywgbFZpZXcsIGRlZik7XG5cbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAodFZpZXcuZGF0YSAhLmxlbmd0aCAtIDEsIGRlZiwgZXhwb3J0c01hcCk7XG5cbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluaXQgaG9va3MgYXJlIHF1ZXVlZCBub3cgc28gbmdPbkluaXQgaXMgY2FsbGVkIGluIGhvc3QgY29tcG9uZW50cyBiZWZvcmVcbiAgICAgIC8vIGFueSBwcm9qZWN0ZWQgY29tcG9uZW50cy5cbiAgICAgIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhcbiAgICAgICAgICBkaXJlY3RpdmVEZWZJZHgsIGRlZiwgdFZpZXcsIG5vZGVJbmRleCwgaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGgsXG4gICAgICAgICAgaW5pdGlhbFByZU9yZGVyQ2hlY2tIb29rc0xlbmd0aCk7XG4gICAgfVxuICB9XG4gIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIXRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmIHN0YXJ0IDwgZW5kKSB7XG4gICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXcpO1xuICB9XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgYWRkQ29tcG9uZW50TG9naWMobFZpZXcsIHROb2RlLCBkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pO1xuICAgIH1cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCBsVmlldyAhLCBpLCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICAgIHBvc3RQcm9jZXNzRGlyZWN0aXZlKGxWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlLCBkZWYsIGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICE7XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3Qgc2VsZWN0ZWRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChlbGVtZW50SW5kZXgpO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSB2aWV3RGF0YVtpXTtcbiAgICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzKSB7XG4gICAgICAgIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZiwgZXhwYW5kbywgZGlyZWN0aXZlLCB0Tm9kZSwgZmlyc3RUZW1wbGF0ZVBhc3MpO1xuXG4gICAgICAgIC8vIEVhY2ggZGlyZWN0aXZlIGdldHMgYSB1bmlxdWVJZCB2YWx1ZSB0aGF0IGlzIHRoZSBzYW1lIGZvciBib3RoXG4gICAgICAgIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAgICAgICAvLyBkaXJlY3RpdmUgdW5pcXVlSWQgaXMgbm90IHNldCBhbnl3aGVyZS0taXQgaXMganVzdCBpbmNyZW1lbnRlZCBiZXR3ZWVuXG4gICAgICAgIC8vIGVhY2ggaG9zdEJpbmRpbmdzIGNhbGwgYW5kIGlzIHVzZWZ1bCBmb3IgaGVscGluZyBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAgIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICAgICAgICBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgICAgICBleHBhbmRvLnB1c2gobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KHNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShcbiAgICBkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCBleHBhbmRvOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zLCBkaXJlY3RpdmU6IGFueSwgdE5vZGU6IFROb2RlLFxuICAgIGZpcnN0VGVtcGxhdGVQYXNzOiBib29sZWFuKSB7XG4gIGNvbnN0IHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9IGV4cGFuZG8ubGVuZ3RoO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZik7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgZGVmLmhvc3RCaW5kaW5ncyAhKFJlbmRlckZsYWdzLkNyZWF0ZSwgZGlyZWN0aXZlLCBlbGVtZW50SW5kZXgpO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKG51bGwpO1xuICAvLyBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBtYXkgb3IgbWF5IG5vdCBjb250YWluIGBhbGxvY0hvc3RWYXJzYCBjYWxsXG4gIC8vIChlLmcuIGl0IG1heSBub3QgaWYgaXQgb25seSBjb250YWlucyBob3N0IGxpc3RlbmVycyksIHNvIHdlIG5lZWQgdG8gY2hlY2sgd2hldGhlclxuICAvLyBgZXhwYW5kb0luc3RydWN0aW9uc2AgaGFzIGNoYW5nZWQgYW5kIGlmIG5vdCAtIHdlIHN0aWxsIHB1c2ggYGhvc3RCaW5kaW5nc2AgdG9cbiAgLy8gZXhwYW5kbyBibG9jaywgdG8gbWFrZSBzdXJlIHdlIGV4ZWN1dGUgaXQgZm9yIERJIGN5Y2xlXG4gIGlmIChwcmV2aW91c0V4cGFuZG9MZW5ndGggPT09IGV4cGFuZG8ubGVuZ3RoICYmIGZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuKiBHZW5lcmF0ZXMgYSBuZXcgYmxvY2sgaW4gVFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyBmb3IgdGhpcyBub2RlLlxuKlxuKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiogaXQgZnJvbSB0aGUgaG9zdFZhciBjb3VudCkgYW5kIHRoZSBkaXJlY3RpdmUgY291bnQuIFNlZSBtb3JlIGluIFZJRVdfREFUQS5tZC5cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlQ291bnQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ0V4cGFuZG8gYmxvY2sgc2hvdWxkIG9ubHkgYmUgZ2VuZXJhdGVkIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG5cbiAgY29uc3QgZWxlbWVudEluZGV4ID0gLSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBwcm92aWRlclN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgcHJvdmlkZXJDb3VudCA9IHRWaWV3LmRhdGEubGVuZ3RoIC0gcHJvdmlkZXJTdGFydEluZGV4O1xuICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtcbiAgIF0pKS5wdXNoKGVsZW1lbnRJbmRleCwgcHJvdmlkZXJDb3VudCwgZGlyZWN0aXZlQ291bnQpO1xufVxuXG4vKipcbiAqIFByb2Nlc3MgYSBkaXJlY3RpdmUgb24gdGhlIGN1cnJlbnQgbm9kZSBhZnRlciBpdHMgY3JlYXRpb24uXG4gKi9cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzRGlyZWN0aXZlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBUTm9kZSwgZGlyZWN0aXZlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPixcbiAgICBkaXJlY3RpdmVEZWZJZHg6IG51bWJlcik6IHZvaWQge1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUobFZpZXcsIGhvc3RUTm9kZSwgZGlyZWN0aXZlKTtcbiAgaWYgKGhvc3RUTm9kZS5hdHRycyAhPT0gbnVsbCkge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZSwgZGVmLCBob3N0VE5vZGUpO1xuICB9XG5cbiAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoaG9zdFROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgfVxufVxuXG4vKipcbiAqIEEgbGlnaHRlciB2ZXJzaW9uIG9mIHBvc3RQcm9jZXNzRGlyZWN0aXZlKCkgdGhhdCBpcyB1c2VkIGZvciB0aGUgcm9vdCBjb21wb25lbnQuXG4gKi9cbmZ1bmN0aW9uIHBvc3RQcm9jZXNzQmFzZURpcmVjdGl2ZTxUPihsVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVE5vZGUsIGRpcmVjdGl2ZTogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxufVxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlKTogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0VGVtcGxhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBuZ0Rldk1vZGUgPyBuZXcgTWF0Y2hlc0FycmF5ICEoKSA6IFtdKTtcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgdmlld0RhdGEpLCB0VmlldywgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUpO1xuICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgaXMgYWx3YXlzIHN0b3JlZCBmaXJzdCB3aXRoIGRpcmVjdGl2ZXMgYWZ0ZXIuXG4gICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKGRlZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbi8qKlxuICogTWFya3MgYSBnaXZlbiBUTm9kZSBhcyBhIGNvbXBvbmVudCdzIGhvc3QuIFRoaXMgY29uc2lzdHMgb2Y6XG4gKiAtIHNldHRpbmcgYXBwcm9wcmlhdGUgVE5vZGUgZmxhZ3M7XG4gKiAtIHN0b3JpbmcgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RUZW1wbGF0ZVBhc3ModFZpZXcpO1xuICBob3N0VE5vZGUuZmxhZ3MgPSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdDtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBuZ0Rldk1vZGUgPyBuZXcgVFZpZXdDb21wb25lbnRzICEoKSA6IFtcbiAgIF0pKS5wdXNoKGhvc3RUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID1cbiAgICAgICAgbmdEZXZNb2RlID8gbmV3IFROb2RlTG9jYWxOYW1lcyAhKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmbGFncyA9PT0gMCB8fCBmbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ2V4cGVjdGVkIG5vZGUgZmxhZ3MgdG8gbm90IGJlIGluaXRpYWxpemVkJyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZCBvbiBhIG5vZGUsIHNhdmUgdGhlIGluZGV4XG4gIHROb2RlLmZsYWdzID0gKGZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIHwgVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3Q7XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4odFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KSB7XG4gIHRWaWV3LmRhdGEucHVzaChkZWYpO1xuICBjb25zdCBkaXJlY3RpdmVGYWN0b3J5ID0gZGVmLmZhY3RvcnkgfHwgKGRlZi5mYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWYudHlwZSwgdHJ1ZSkpO1xuICBjb25zdCBub2RlSW5qZWN0b3JGYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZGlyZWN0aXZlRmFjdG9yeSwgaXNDb21wb25lbnREZWYoZGVmKSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihsVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUVmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldyxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBuYXRpdmUsXG4gICAgICAgICAgaG9zdFROb2RlIGFzIFRFbGVtZW50Tm9kZSwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpKSk7XG5cbiAgLy8gQ29tcG9uZW50IHZpZXcgd2lsbCBhbHdheXMgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGluamVjdGVkIExDb250YWluZXJzLFxuICAvLyBzbyB0aGlzIGlzIGEgcmVndWxhciBlbGVtZW50LCB3cmFwIGl0IHdpdGggdGhlIGNvbXBvbmVudCB2aWV3XG4gIGxWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgbFZpZXc6IExWaWV3LCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJGbiB8IG51bGwsXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgbmdEZXZNb2RlICYmIHZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcyhuYW1lKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBuYW1lc3BhY2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3QgdE5vZGUgPSBnZXRUTm9kZShpbmRleCwgbFZpZXcpO1xuICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgc2FuaXRpemVyID09IG51bGwgPyByZW5kZXJTdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBuYW1lKTtcblxuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlLCBuYW1lc3BhY2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lc3BhY2UgPyBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgZGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzKSB7XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgaWYgKHNldElucHV0KSB7XG4gICAgICAgIGRlZi5zZXRJbnB1dCAhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGluc3RhbmNlIGFzIGFueSlbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIG5hdGl2ZUVsZW1lbnQsIHROb2RlLnR5cGUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9XG4gICAgICB0Tm9kZS5pbml0aWFsSW5wdXRzIHx8ICh0Tm9kZS5pbml0aWFsSW5wdXRzID0gbmdEZXZNb2RlID8gbmV3IFROb2RlSW5pdGlhbElucHV0cyAhKCkgOiBbXSk7XG4gIC8vIEVuc3VyZSB0aGF0IHdlIGRvbid0IGNyZWF0ZSBzcGFyc2UgYXJyYXlzXG4gIGZvciAobGV0IGkgPSBpbml0aWFsSW5wdXREYXRhLmxlbmd0aDsgaSA8PSBkaXJlY3RpdmVJbmRleDsgaSsrKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YS5wdXNoKG51bGwpO1xuICB9XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycyAhO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIFdlIGRvIG5vdCBhbGxvdyBpbnB1dHMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICAgICAgaSArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlByb2plY3RBcykge1xuICAgICAgLy8gU2tpcCBvdmVyIHRoZSBgbmdQcm9qZWN0QXNgIHZhbHVlLlxuICAgICAgaSArPSAyO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGl0IGFueSBvdGhlciBhdHRyaWJ1dGUgbWFya2Vycywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09PSAnbnVtYmVyJykgYnJlYWs7XG5cbiAgICBjb25zdCBtaW5pZmllZElucHV0TmFtZSA9IGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddO1xuICAgIGNvbnN0IGF0dHJWYWx1ZSA9IGF0dHJzW2kgKyAxXTtcblxuICAgIGlmIChtaW5pZmllZElucHV0TmFtZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBjb25zdCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzID0gaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gfHxcbiAgICAgICAgICAoaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsRGF0YSAhKCkgOiBbXSk7XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUgYXMgc3RyaW5nLCBtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gTm90IHN1cmUgd2h5IEkgbmVlZCB0byBkbyBgYW55YCBoZXJlIGJ1dCBUUyBjb21wbGFpbnMgbGF0ZXIuXG5jb25zdCBMQ29udGFpbmVyQXJyYXk6IGFueSA9IG5nRGV2TW9kZSAmJiBjcmVhdGVOYW1lZEFycmF5VHlwZSgnTENvbnRhaW5lcicpO1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudCB8IFJDb21tZW50IHwgTFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCwgdE5vZGU6IFROb2RlLFxuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobmF0aXZlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgLy8gaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LWxpdGVyYWwtdnMtbmV3LWFycmF5LXJlYWxseVxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gbmV3IChuZ0Rldk1vZGUgPyBMQ29udGFpbmVyQXJyYXkgOiBBcnJheSkoXG4gICAgICBob3N0TmF0aXZlLCAgLy8gaG9zdCBuYXRpdmVcbiAgICAgIHRydWUsICAgICAgICAvLyBCb29sZWFuIGB0cnVlYCBpbiB0aGlzIHBvc2l0aW9uIHNpZ25pZmllcyB0aGF0IHRoaXMgaXMgYW4gYExDb250YWluZXJgXG4gICAgICBpc0ZvclZpZXdDb250YWluZXJSZWYgPyAtMSA6IDAsICAvLyBhY3RpdmUgaW5kZXhcbiAgICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgICAgdE5vZGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdF9ob3N0XG4gICAgICBuYXRpdmUsICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuYXRpdmUsXG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICAgICk7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcik7XG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBsZXQgdmlld09yQ29udGFpbmVyID0gbFZpZXdbQ0hJTERfSEVBRF07XG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIgIT09IG51bGwpIHtcbiAgICAvLyBOb3RlOiB2aWV3T3JDb250YWluZXIgY2FuIGJlIGFuIExWaWV3IG9yIGFuIExDb250YWluZXIgaW5zdGFuY2UsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5XG4gICAgLy8gaW50ZXJlc3RlZCBpbiBMQ29udGFpbmVyXG4gICAgaWYgKGlzTENvbnRhaW5lcih2aWV3T3JDb250YWluZXIpICYmIHZpZXdPckNvbnRhaW5lcltBQ1RJVkVfSU5ERVhdID09PSAtMSkge1xuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgdmlld09yQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSB2aWV3T3JDb250YWluZXJbaV07XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSBlbWJlZGRlZExWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlZnJlc2hWaWV3KGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0gISk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lcltORVhUXTtcbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SG9zdElkeCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSAmJlxuICAgICAgY29tcG9uZW50Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgICByZWZyZXNoVmlldyhjb21wb25lbnRWaWV3LCB0VmlldywgdFZpZXcudGVtcGxhdGUsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3KTtcbiAgcmVuZGVyVmlldyhjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W1RWSUVXXSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXcgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiAzLiBTZWNvbmQgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXcgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VmlldzogTFZpZXcpIHtcbiAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IGNvbXBvbmVudFZpZXcubGVuZ3RoOyBpIDwgY29tcG9uZW50VFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29tcG9uZW50Vmlldy5wdXNoKGNvbXBvbmVudFRWaWV3LmJsdWVwcmludFtpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3IG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihsVmlldzogTFZpZXcsIGxWaWV3T3JMQ29udGFpbmVyOiBUKTogVCB7XG4gIC8vIFRPRE8oYmVubGVzaC9taXNrbyk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgaW5jb3JyZWN0LCBiZWNhdXNlIGl0IGFsd2F5cyBhZGRzIHRoZSBMQ29udGFpbmVyXG4gIC8vIHRvXG4gIC8vIHRoZSBlbmQgb2YgdGhlIHF1ZXVlLCB3aGljaCBtZWFucyBpZiB0aGUgZGV2ZWxvcGVyIHJldHJpZXZlcyB0aGUgTENvbnRhaW5lcnMgZnJvbSBSTm9kZXMgb3V0XG4gIC8vIG9mXG4gIC8vIG9yZGVyLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biBvdXQgb2Ygb3JkZXIsIGFzIHRoZSBhY3Qgb2YgcmV0cmlldmluZyB0aGUgdGhlXG4gIC8vIExDb250YWluZXJcbiAgLy8gZnJvbSB0aGUgUk5vZGUgaXMgd2hhdCBhZGRzIGl0IHRvIHRoZSBxdWV1ZS5cbiAgaWYgKGxWaWV3W0NISUxEX0hFQURdKSB7XG4gICAgbFZpZXdbQ0hJTERfVEFJTF0gIVtORVhUXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIGxWaWV3W0NISUxEX0hFQURdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH1cbiAgbFZpZXdbQ0hJTERfVEFJTF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICB3aGlsZSAobFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ICE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljayhyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgY29uc3QgbFZpZXcgPSByZWFkUGF0Y2hlZExWaWV3KHJvb3RDb21wb25lbnQpICE7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShsVmlldywgdFZpZXcudGVtcGxhdGUsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gdmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcblxuICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB0VmlldyA9IHZpZXdbVFZJRVddO1xuICAgIHJlZnJlc2hWaWV3KHZpZXcsIHRWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IodmlldywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KTtcbiAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3LCBjb21wb25lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFxuICAgIGZsYWdzOiBSZW5kZXJGbGFncywgdmlld1F1ZXJ5Rm46IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+LCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1F1ZXJ5Rm4sICdWaWV3IHF1ZXJpZXMgZnVuY3Rpb24gdG8gZXhlY3V0ZSBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KDApO1xuICB2aWV3UXVlcnlGbihmbGFncywgY29tcG9uZW50KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBTdG9yZXMgbWV0YS1kYXRhIGZvciBhIHByb3BlcnR5IGJpbmRpbmcgdG8gYmUgdXNlZCBieSBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYC5cbiAqXG4gKiBJbiBvcmRlciB0byBzdXBwb3J0IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgIHdlIG5lZWQgdG8gc2F2ZSwgZm9yIGVhY2ggYmluZGluZzpcbiAqIC0gYSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogLSBhIHN0YXRpYyBwYXJ0cyBvZiBpbnRlcnBvbGF0ZWQgc3RyaW5ncztcbiAqXG4gKiBBIGdpdmVuIHByb3BlcnR5IG1ldGFkYXRhIGlzIHNhdmVkIGF0IHRoZSBiaW5kaW5nJ3MgaW5kZXggaW4gdGhlIGBUVmlldy5kYXRhYCAoaW4gb3RoZXIgd29yZHMsIGFcbiAqIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEgd2lsbCBiZSBzdG9yZWQgaW4gYFRWaWV3LmRhdGFgIGF0IHRoZSBzYW1lIGluZGV4IGFzIGEgYm91bmQgdmFsdWUgaW5cbiAqIGBMVmlld2ApLiBNZXRhZGF0YSBhcmUgcmVwcmVzZW50ZWQgYXMgYElOVEVSUE9MQVRJT05fREVMSU1JVEVSYC1kZWxpbWl0ZWQgc3RyaW5nIHdpdGggdGhlXG4gKiBmb2xsb3dpbmcgZm9ybWF0OlxuICogLSBgcHJvcGVydHlOYW1lYCBmb3IgYm91bmQgcHJvcGVydGllcztcbiAqIC0gYHByb3BlcnR5TmFtZe+/vXByZWZpeO+/vWludGVycG9sYXRpb25fc3RhdGljX3BhcnQx77+9Li5pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Tu+/vXN1ZmZpeGAgZm9yXG4gKiBpbnRlcnBvbGF0ZWQgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSBtZXRhLWRhdGEgd2lsbCBiZSBzYXZlZDtcbiAqIEBwYXJhbSBub2RlSW5kZXggaW5kZXggb2YgYSBgVE5vZGVgIHRoYXQgaXMgYSB0YXJnZXQgb2YgdGhlIGJpbmRpbmc7XG4gKiBAcGFyYW0gcHJvcGVydHlOYW1lIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGJpbmRpbmcgaW5kZXggaW4gYExWaWV3YFxuICogQHBhcmFtIGludGVycG9sYXRpb25QYXJ0cyBzdGF0aWMgaW50ZXJwb2xhdGlvbiBwYXJ0cyAoZm9yIHByb3BlcnR5IGludGVycG9sYXRpb25zKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICB0RGF0YTogVERhdGEsIG5vZGVJbmRleDogbnVtYmVyLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgLi4uaW50ZXJwb2xhdGlvblBhcnRzOiBzdHJpbmdbXSkge1xuICAvLyBCaW5kaW5nIG1ldGEtZGF0YSBhcmUgc3RvcmVkIG9ubHkgdGhlIGZpcnN0IHRpbWUgYSBnaXZlbiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBpcyBwcm9jZXNzZWQuXG4gIC8vIFNpbmNlIHdlIGRvbid0IGhhdmUgYSBjb25jZXB0IG9mIHRoZSBcImZpcnN0IHVwZGF0ZSBwYXNzXCIgd2UgbmVlZCB0byBjaGVjayBmb3IgcHJlc2VuY2Ugb2YgdGhlXG4gIC8vIGJpbmRpbmcgbWV0YS1kYXRhIHRvIGRlY2lkZSBpZiBvbmUgc2hvdWxkIGJlIHN0b3JlZCAob3IgaWYgd2FzIHN0b3JlZCBhbHJlYWR5KS5cbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleF0gPT09IG51bGwpIHtcbiAgICBjb25zdCB0Tm9kZSA9IHREYXRhW25vZGVJbmRleCArIEhFQURFUl9PRkZTRVRdIGFzIFROb2RlO1xuICAgIGlmICh0Tm9kZS5pbnB1dHMgPT0gbnVsbCB8fCAhdE5vZGUuaW5wdXRzW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgIGNvbnN0IHByb3BCaW5kaW5nSWR4cyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3MgfHwgKHROb2RlLnByb3BlcnR5QmluZGluZ3MgPSBbXSk7XG4gICAgICBwcm9wQmluZGluZ0lkeHMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgbGV0IGJpbmRpbmdNZXRhZGF0YSA9IHByb3BlcnR5TmFtZTtcbiAgICAgIGlmIChpbnRlcnBvbGF0aW9uUGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBiaW5kaW5nTWV0YWRhdGEgKz1cbiAgICAgICAgICAgIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgaW50ZXJwb2xhdGlvblBhcnRzLmpvaW4oSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgfVxuICAgICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGJpbmRpbmdNZXRhZGF0YTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgLy8gSWYgdE5vZGUuaW5wdXRzIGlzIHVuZGVmaW5lZCwgYSBsaXN0ZW5lciBoYXMgY3JlYXRlZCBvdXRwdXRzLCBidXQgaW5wdXRzIGhhdmVuJ3RcbiAgLy8geWV0IGJlZW4gY2hlY2tlZC5cbiAgaWYgKHROb2RlLmlucHV0cyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gbWFyayBpbnB1dHMgYXMgY2hlY2tlZFxuICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHRWaWV3LCB0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cbiAgcmV0dXJuIHROb2RlLmlucHV0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAgISgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwICEoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGVsZW1lbnQsIHZhbHVlKSA6IGVsZW1lbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIGFsbCBpbml0aWFsIHN0eWxpbmcgKGNsYXNzIGFuZCBzdHlsZSB2YWx1ZXMpIG9uIHRvIHRoZSBlbGVtZW50IGZyb20gdGhlIHROb2RlLlxuICpcbiAqIEFsbCBpbml0aWFsIHN0eWxpbmcgZGF0YSAoaS5lLiBhbnkgdmFsdWVzIGV4dHJhY3RlZCBmcm9tIHRoZSBgc3R5bGVgIG9yIGBjbGFzc2AgYXR0cmlidXRlc1xuICogb24gYW4gZWxlbWVudCkgYXJlIGNvbGxlY3RlZCBpbnRvIHRoZSBgdE5vZGUuc3R5bGVzYCBhbmQgYHROb2RlLmNsYXNzZXNgIGRhdGEgc3RydWN0dXJlcy5cbiAqIFRoZXNlIHZhbHVlcyBhcmUgcG9wdWxhdGVkIGR1cmluZyB0aGUgY3JlYXRpb24gcGhhc2Ugb2YgYW4gZWxlbWVudCBhbmQgYXJlIHRoZW4gbGF0ZXJcbiAqIGFwcGxpZWQgb25jZSB0aGUgZWxlbWVudCBpcyBpbnN0YW50aWF0ZWQuIFRoaXMgZnVuY3Rpb24gYXBwbGllcyBlYWNoIG9mIHRoZSBzdGF0aWNcbiAqIHN0eWxlIGFuZCBjbGFzcyBlbnRyaWVzIHRvIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVySW5pdGlhbFN0eWxpbmcocmVuZGVyZXI6IFJlbmRlcmVyMywgbmF0aXZlOiBSRWxlbWVudCwgdE5vZGU6IFROb2RlKSB7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuY2xhc3NlcywgdHJ1ZSk7XG4gIHJlbmRlclN0eWxpbmdNYXAocmVuZGVyZXIsIG5hdGl2ZSwgdE5vZGUuc3R5bGVzLCBmYWxzZSk7XG59XG4iXX0=