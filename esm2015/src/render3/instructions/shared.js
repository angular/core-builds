/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertNotEqual, assertNotSame } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertFirstCreatePass, assertLContainer, assertLView } from '../assert';
import { attachPatchData } from '../context_discovery';
import { getFactoryDef } from '../definition';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags, registerPreOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponentDef, isComponentHost, isContentQueryHost, isLContainer, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, executeElementExitFn, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getPreviousOrParentTNode, getSelectedIndex, hasActiveElementFlag, incrementActiveDirectiveId, leaveView, leaveViewProcessExit, setActiveHostElement, setBindingIndex, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { renderStylingMap, writeStylingValueDirectly } from '../styling/bindings';
import { NO_CHANGE } from '../tokens';
import { isAnimationProp } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getInitialStylingValue } from '../util/styling_utils';
import { getLViewParent } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, isCreationMode, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeConstructor, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor, attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData } from './lview_debug';
const ɵ0 = /**
 * @return {?}
 */
() => Promise.resolve(null);
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 * @type {?}
 */
const _CLEAN_PROMISE = ((ɵ0))();
/**
 * Sets the host bindings for the current view.
 * @param {?} tView
 * @param {?} lView
 * @return {?}
 */
export function setHostBindings(tView, lView) {
    /** @type {?} */
    const selectedIndex = getSelectedIndex();
    try {
        if (tView.expandoInstructions !== null) {
            /** @type {?} */
            let bindingRootIndex = setBindingIndex(tView.expandoStartIndex);
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
                        // Each directive gets a uniqueId value that is the same for both
                        // create and update calls when the hostBindings function is called. The
                        // directive uniqueId is not set anywhere--it is just incremented between
                        // each hostBindings call and is useful for helping instruction code
                        // uniquely determine which directive is currently active when executed.
                        // It is important that this be called first before the actual instructions
                        // are run because this way the first directive ID value is not zero.
                        incrementActiveDirectiveId();
                        setBindingIndex(bindingRootIndex);
                        /** @type {?} */
                        const hostCtx = unwrapRNode(lView[currentDirectiveIndex]);
                        instruction(2 /* Update */, hostCtx, currentElementIndex);
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
    const lView = ngDevMode ? cloneToLViewFromTViewBlueprint(tView) : (/** @type {?} */ (tView.blueprint.slice()));
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
    ngDevMode && assertEqual(tView.type == 2 /* Embedded */ ? parentLView !== null : true, true, 'Embedded views must have parentLView');
    lView[DECLARATION_COMPONENT_VIEW] =
        tView.type == 2 /* Embedded */ ? (/** @type {?} */ (parentLView))[DECLARATION_COMPONENT_VIEW] : lView;
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
        if (tView.firstCreatePass) {
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
    enterView(lView, lView[T_HOST]);
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
        // off firstCreatePass. If we don't set it here, instances will perform directive
        // matching, etc again and again.
        if (tView.firstCreatePass) {
            tView.firstCreatePass = false;
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
        leaveView();
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
    enterView(lView, lView[T_HOST]);
    /** @type {?} */
    const flags = lView[FLAGS];
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
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
        // Refresh child component views.
        /** @type {?} */
        const components = tView.components;
        if (components !== null) {
            refreshChildComponents(lView, components);
        }
        // View queries must execute after refreshing child components because a template in this view
        // could be inserted in a child component. If the view query executes before child component
        // refresh, the template might not yet be inserted.
        /** @type {?} */
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(2 /* Update */, viewQuery, context);
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
        if (tView.firstUpdatePass === true) {
            tView.firstUpdatePass = false;
        }
        lView[FLAGS] &= ~(64 /* Dirty */ | 8 /* FirstLViewPass */);
        leaveViewProcessExit();
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
    /** @type {?} */
    const prevSelectedIndex = getSelectedIndex();
    try {
        setActiveHostElement(null);
        if (rf & 2 /* Update */ && lView.length > HEADER_OFFSET) {
            // When we're updating, inherently select 0 so we don't
            // have to generate that instruction for most update blocks.
            selectIndexInternal(lView, 0, getCheckNoChangesMode());
        }
        templateFn(rf, context);
    }
    finally {
        if (hasActiveElementFlag(1 /* RunExitFn */)) {
            executeElementExitFn();
        }
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
    instantiateAllDirectives(tView, lView, tNode, getNativeByTNode(tNode, lView));
    if ((tNode.flags & 128 /* hasHostBindings */) === 128 /* hasHostBindings */) {
        invokeDirectivesHostBindings(tView, lView, tNode);
    }
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
export function getOrCreateTComponentView(def) {
    return def.tView ||
        (def.tView = createTView(1 /* Component */, -1, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts));
}
/**
 * Creates a TView instance
 *
 * @param {?} type
 * @param {?} viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param {?} templateFn Template function
 * @param {?} decls The number of nodes, local refs, and pipes in this template
 * @param {?} vars
 * @param {?} directives Registry of directives for this view
 * @param {?} pipes Registry of pipes for this view
 * @param {?} viewQuery View queries for this view
 * @param {?} schemas Schemas for this view
 * @param {?} consts Constants for this view
 * @return {?}
 */
export function createTView(type, viewIndex, templateFn, decls, vars, directives, pipes, viewQuery, schemas, consts) {
    ngDevMode && ngDevMode.tView++;
    /** @type {?} */
    const bindingStartIndex = HEADER_OFFSET + decls;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    /** @type {?} */
    const initialViewLength = bindingStartIndex + vars;
    /** @type {?} */
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[(/** @type {?} */ (TVIEW))] = ngDevMode ?
        new TViewConstructor(type, viewIndex, // id: number,
        blueprint, // blueprint: LView,
        templateFn, // template: ComponentTemplate<{}>|null,
        null, // queries: TQueries|null
        viewQuery, (/** @type {?} */ (null)), // node: TViewNode|TElementNode|null,
        cloneToTViewData(blueprint).fill(null, bindingStartIndex), // data: TData,
        bindingStartIndex, // bindingStartIndex: number,
        initialViewLength, // expandoStartIndex: number,
        null, // expandoInstructions: ExpandoInstructions|null,
        true, // firstCreatePass: boolean,
        true, // firstUpdatePass: boolean,
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
        schemas, // schemas: SchemaMetadata[]|null,
        consts) : // consts: TConstants|null
        {
            type: type,
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
            firstCreatePass: true,
            firstUpdatePass: true,
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
            consts: consts,
        };
}
/**
 * @param {?} bindingStartIndex
 * @param {?} initialViewLength
 * @return {?}
 */
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    /** @type {?} */
    const blueprint = ngDevMode ? new LViewBlueprint() : [];
    for (let i = 0; i < initialViewLength; i++) {
        blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
    }
    return (/** @type {?} */ (blueprint));
}
/**
 * @param {?} text
 * @param {?} token
 * @return {?}
 */
function createError(text, token) {
    return new Error(`Renderer: ${text} [${stringifyForError(token)}]`);
}
/**
 * @param {?} rElement
 * @param {?} elementOrSelector
 * @return {?}
 */
function assertHostNodeExists(rElement, elementOrSelector) {
    if (!rElement) {
        if (typeof elementOrSelector === 'string') {
            throw createError('Host node with selector not found:', elementOrSelector);
        }
        else {
            throw createError('Host node is required:', elementOrSelector);
        }
    }
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param {?} rendererFactory Factory function to create renderer instance.
 * @param {?} elementOrSelector Render element or CSS selector to locate the element.
 * @param {?} encapsulation View Encapsulation defined for component that requests host element.
 * @return {?}
 */
export function locateHostElement(rendererFactory, elementOrSelector, encapsulation) {
    /** @type {?} */
    const renderer = rendererFactory.createRenderer(null, null);
    if (isProceduralRenderer(renderer)) {
        // When using native Shadow DOM, do not clear host element to allow native slot projection
        /** @type {?} */
        const preserveContent = encapsulation === ViewEncapsulation.ShadowDom;
        return renderer.selectRootElement(elementOrSelector, preserveContent);
    }
    /** @type {?} */
    let rElement = typeof elementOrSelector === 'string' ?
        (/** @type {?} */ (renderer.querySelector(elementOrSelector))) :
        elementOrSelector;
    ngDevMode && assertHostNodeExists(rElement, elementOrSelector);
    // Always clear host element's content when Renderer3 is in use. For procedural renderer case we
    // make it depend on whether ShadowDom encapsulation is used (in which case the content should be
    // preserved to allow native slot projection). ShadowDom encapsulation requires procedural
    // renderer, and procedural renderer case is handled above.
    rElement.textContent = '';
    return rElement;
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
    if (lView[TVIEW].firstCreatePass) {
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
    if (view[TVIEW].firstCreatePass) {
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
 * @param {?} inputAliasMap
 * @param {?} directiveDefIdx
 * @param {?} propStore
 * @return {?}
 */
function generatePropertyAliases(inputAliasMap, directiveDefIdx, propStore) {
    for (let publicName in inputAliasMap) {
        if (inputAliasMap.hasOwnProperty(publicName)) {
            propStore = propStore === null ? {} : propStore;
            /** @type {?} */
            const internalName = inputAliasMap[publicName];
            if (propStore.hasOwnProperty(publicName)) {
                propStore[publicName].push(directiveDefIdx, publicName, internalName);
            }
            else {
                (propStore[publicName] = [directiveDefIdx, publicName, internalName]);
            }
        }
    }
    return propStore;
}
/**
 * Initializes data structures required to work with directive outputs and outputs.
 * Initialization is done for all directives matched on a given TNode.
 * @param {?} tView
 * @param {?} tNode
 * @return {?}
 */
function initializeInputAndOutputAliases(tView, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    /** @type {?} */
    const start = tNode.directiveStart;
    /** @type {?} */
    const end = tNode.directiveEnd;
    /** @type {?} */
    const defs = tView.data;
    /** @type {?} */
    const tNodeAttrs = tNode.attrs;
    /** @type {?} */
    const inputsFromAttrs = ngDevMode ? new TNodeInitialInputs() : [];
    /** @type {?} */
    let inputsStore = null;
    /** @type {?} */
    let outputsStore = null;
    for (let i = start; i < end; i++) {
        /** @type {?} */
        const directiveDef = (/** @type {?} */ (defs[i]));
        /** @type {?} */
        const directiveInputs = directiveDef.inputs;
        inputsFromAttrs.push(tNodeAttrs !== null ? generateInitialInputs(directiveInputs, tNodeAttrs) : null);
        inputsStore = generatePropertyAliases(directiveInputs, i, inputsStore);
        outputsStore = generatePropertyAliases(directiveDef.outputs, i, outputsStore);
    }
    if (inputsStore !== null) {
        if (inputsStore.hasOwnProperty('class') || inputsStore.hasOwnProperty('className')) {
            tNode.flags |= 16 /* hasClassInput */;
        }
        if (inputsStore.hasOwnProperty('style')) {
            tNode.flags |= 32 /* hasStyleInput */;
        }
    }
    tNode.initialInputs = inputsFromAttrs;
    tNode.inputs = inputsStore;
    tNode.outputs = outputsStore;
}
/**
 * Mapping between attributes names that don't correspond to their element property names.
 *
 * Performance note: this function is written as a series of if checks (instead of, say, a property
 * object lookup) for performance reasons - the series of `if` checks seems to be the fastest way of
 * mapping property names. Do NOT change without benchmarking.
 *
 * Note: this mapping has to be kept in sync with the equally named mapping in the template
 * type-checking machinery of ngtsc.
 * @param {?} name
 * @return {?}
 */
function mapPropName(name) {
    if (name === 'class')
        return 'className';
    if (name === 'for')
        return 'htmlFor';
    if (name === 'formaction')
        return 'formAction';
    if (name === 'innerHtml')
        return 'innerHTML';
    if (name === 'readonly')
        return 'readOnly';
    if (name === 'tabindex')
        return 'tabIndex';
    return name;
}
/**
 * @template T
 * @param {?} lView
 * @param {?} index
 * @param {?} propName
 * @param {?} value
 * @param {?=} sanitizer
 * @param {?=} nativeOnly
 * @param {?=} loadRendererFn
 * @return {?}
 */
export function elementPropertyInternal(lView, index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    ngDevMode && assertNotSame(value, (/** @type {?} */ (NO_CHANGE)), 'Incoming value should never be NO_CHANGE.');
    /** @type {?} */
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    let inputData = tNode.inputs;
    /** @type {?} */
    let dataValue;
    if (!nativeOnly && inputData != null && (dataValue = inputData[propName])) {
        setInputsForProperty(lView, dataValue, value);
        if (isComponentHost(tNode))
            markDirtyIfOnPush(lView, index + HEADER_OFFSET);
        if (ngDevMode) {
            setNgReflectProperties(lView, element, tNode.type, dataValue, value);
        }
    }
    else if (tNode.type === 3 /* Element */) {
        propName = mapPropName(propName);
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            if (!validateProperty(lView, element, propName, tNode)) {
                // Return here since we only log warnings for unknown properties.
                warnAboutUnknownProperty(propName, tNode);
                return;
            }
            ngDevMode.rendererSetProperty++;
        }
        /** @type {?} */
        const renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property is risky, so sanitization can be done without further checks.
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
            warnAboutUnknownProperty(propName, tNode);
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
    const childComponentLView = getComponentLViewByIndex(viewIndex, lView);
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
function setNgReflectProperty(lView, element, type, attrName, value) {
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
 * @param {?} lView
 * @param {?} element
 * @param {?} type
 * @param {?} dataValue
 * @param {?} value
 * @return {?}
 */
export function setNgReflectProperties(lView, element, type, dataValue, value) {
    if (type === 3 /* Element */ || type === 0 /* Container */) {
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
            setNgReflectProperty(lView, element, type, (/** @type {?} */ (dataValue[i + 2])), value);
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
function validateProperty(hostView, element, propName, tNode) {
    // The property is considered valid if the element matches the schema, it exists on the element
    // or it is synthetic, and we are in a browser context (web worker nodes should be skipped).
    return matchingSchemas(hostView, tNode.tagName) || propName in element ||
        isAnimationProp(propName) || typeof Node !== 'function' || !(element instanceof Node);
}
/**
 * @param {?} hostView
 * @param {?} tagName
 * @return {?}
 */
export function matchingSchemas(hostView, tagName) {
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
 * Logs a warning that a property is not supported on an element.
 * @param {?} propName Name of the invalid property.
 * @param {?} tNode Node on which we encountered the property.
 * @return {?}
 */
function warnAboutUnknownProperty(propName, tNode) {
    console.warn(`Can't bind to '${propName}' since it isn't a known property of '${tNode.tagName}'.`);
}
/**
 * Instantiate a root component.
 * @template T
 * @param {?} tView
 * @param {?} lView
 * @param {?} def
 * @return {?}
 */
export function instantiateRootComponent(tView, lView, def) {
    /** @type {?} */
    const rootTNode = getPreviousOrParentTNode();
    if (tView.firstCreatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        generateExpandoInstructionBlock(tView, rootTNode, 1);
        baseResolveDirective(tView, lView, def);
    }
    /** @type {?} */
    const directive = getNodeInjectable(tView.data, lView, lView.length - 1, (/** @type {?} */ (rootTNode)));
    attachPatchData(directive, lView);
    /** @type {?} */
    const native = getNativeByTNode(rootTNode, lView);
    if (native) {
        attachPatchData(native, lView);
    }
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
    ngDevMode && assertFirstCreatePass(tView);
    if (!getBindingsEnabled())
        return false;
    /** @type {?} */
    const directives = findDirectiveMatches(tView, lView, tNode);
    /** @type {?} */
    const exportsMap = localRefs === null ? null : { '': -1 };
    /** @type {?} */
    let hasDirectives = false;
    if (directives !== null) {
        hasDirectives = true;
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
            if (def.contentQueries !== null)
                tNode.flags |= 8 /* hasContentQuery */;
            if (def.hostBindings !== null)
                tNode.flags |= 128 /* hasHostBindings */;
            // Init hooks are queued now so ngOnInit is called in host components before
            // any projected components.
            registerPreOrderHooks(directiveDefIdx, def, tView, nodeIndex, initialPreOrderHooksLength, initialPreOrderCheckHooksLength);
        }
        initializeInputAndOutputAliases(tView, tNode);
    }
    if (exportsMap)
        cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    return hasDirectives;
}
/**
 * Instantiate all the directives that were previously resolved on the current node.
 * @param {?} tView
 * @param {?} lView
 * @param {?} tNode
 * @param {?} native
 * @return {?}
 */
function instantiateAllDirectives(tView, lView, tNode, native) {
    /** @type {?} */
    const start = tNode.directiveStart;
    /** @type {?} */
    const end = tNode.directiveEnd;
    if (!tView.firstCreatePass) {
        getOrCreateNodeInjectorForNode(tNode, lView);
    }
    attachPatchData(native, lView);
    /** @type {?} */
    const initialInputs = tNode.initialInputs;
    for (let i = start; i < end; i++) {
        /** @type {?} */
        const def = (/** @type {?} */ (tView.data[i]));
        /** @type {?} */
        const isComponent = isComponentDef(def);
        if (isComponent) {
            ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */);
            addComponentLogic(lView, (/** @type {?} */ (tNode)), (/** @type {?} */ (def)));
        }
        /** @type {?} */
        const directive = getNodeInjectable(tView.data, lView, i, tNode);
        attachPatchData(directive, lView);
        if (initialInputs !== null) {
            setInputsFromAttrs(lView, i - start, directive, def, tNode, (/** @type {?} */ (initialInputs)));
        }
        if (isComponent) {
            /** @type {?} */
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            componentView[CONTEXT] = directive;
        }
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
    const firstCreatePass = tView.firstCreatePass;
    /** @type {?} */
    const elementIndex = tNode.index - HEADER_OFFSET;
    try {
        setActiveHostElement(elementIndex);
        for (let i = start; i < end; i++) {
            /** @type {?} */
            const def = (/** @type {?} */ (tView.data[i]));
            /** @type {?} */
            const directive = viewData[i];
            if (def.hostBindings) {
                // It is important that this be called first before the actual instructions
                // are run because this way the first directive ID value is not zero.
                incrementActiveDirectiveId();
                invokeHostBindingsInCreationMode(def, expando, directive, tNode, firstCreatePass);
            }
            else if (firstCreatePass) {
                expando.push(null);
            }
        }
    }
    finally {
        setActiveHostElement(null);
    }
}
/**
 * @param {?} def
 * @param {?} expando
 * @param {?} directive
 * @param {?} tNode
 * @param {?} firstCreatePass
 * @return {?}
 */
export function invokeHostBindingsInCreationMode(def, expando, directive, tNode, firstCreatePass) {
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
    if (previousExpandoLength === expando.length && firstCreatePass) {
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
    ngDevMode && assertEqual(tView.firstCreatePass, true, 'Expando block should only be generated on first create pass.');
    /** @type {?} */
    const elementIndex = -(tNode.index - HEADER_OFFSET);
    /** @type {?} */
    const providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    /** @type {?} */
    const providerCount = tView.data.length - providerStartIndex;
    (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, providerCount, directiveCount);
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
    ngDevMode && assertFirstCreatePass(tView);
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
                matches || (matches = ngDevMode ? new MatchesArray() : []);
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
    ngDevMode && assertFirstCreatePass(tView);
    hostTNode.flags |= 2 /* isComponentHost */;
    (tView.components || (tView.components = ngDevMode ? new TViewComponents() : [])).push(hostTNode.index);
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
            ngDevMode ? new TNodeLocalNames() : [];
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
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    tNode.flags |= 1 /* isDirectiveHost */;
    // When the first directive is created on a node, save the index
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
    const tView = getOrCreateTComponentView(def);
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
 * @param {?} lView Current LView that is being processed.
 * @param {?} directiveIndex Index of the directive in directives array
 * @param {?} instance Instance of the directive on which to set the initial inputs
 * @param {?} def The directive def that contains the list of inputs
 * @param {?} tNode The static data for this node
 * @param {?} initialInputData
 * @return {?}
 */
function setInputsFromAttrs(lView, directiveIndex, instance, def, tNode, initialInputData) {
    /** @type {?} */
    const initialInputs = (/** @type {?} */ (initialInputData))[directiveIndex];
    if (initialInputs !== null) {
        /** @type {?} */
        const setInput = def.setInput;
        for (let i = 0; i < initialInputs.length;) {
            /** @type {?} */
            const publicName = initialInputs[i++];
            /** @type {?} */
            const privateName = initialInputs[i++];
            /** @type {?} */
            const value = initialInputs[i++];
            if (setInput !== null) {
                (/** @type {?} */ (def.setInput))(instance, value, publicName, privateName);
            }
            else {
                ((/** @type {?} */ (instance)))[privateName] = value;
            }
            if (ngDevMode) {
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
 * @param {?} inputs The list of inputs from the directive def
 * @param {?} attrs The static attrs on this node
 * @return {?}
 */
function generateInitialInputs(inputs, attrs) {
    /** @type {?} */
    let inputsToStore = null;
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
        if (inputs.hasOwnProperty((/** @type {?} */ (attrName)))) {
            if (inputsToStore === null)
                inputsToStore = [];
            inputsToStore.push((/** @type {?} */ (attrName)), inputs[(/** @type {?} */ (attrName))], (/** @type {?} */ (attrs[i + 1])));
        }
        i += 2;
    }
    return inputsToStore;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
// Not sure why I need to do `any` here but TS complains later.
/** @type {?} */
const LContainerArray = ((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode()) &&
    createNamedArrayType('LContainer');
/**
 * Creates a LContainer, either from a container instruction, or for a ViewContainerRef.
 *
 * @param {?} hostNative The host element for the LContainer
 * @param {?} currentView The parent view of the LContainer
 * @param {?} native The native comment element
 * @param {?} tNode
 * @return {?} LContainer
 */
export function createLContainer(hostNative, currentView, native, tNode) {
    ngDevMode && assertLView(currentView);
    ngDevMode && !isProceduralRenderer(currentView[RENDERER]) && assertDomNode(native);
    // https://jsperf.com/array-literal-vs-new-array-really
    /** @type {?} */
    const lContainer = new (ngDevMode ? LContainerArray : Array)(hostNative, // host native
    true, // Boolean `true` in this position signifies that this is an `LContainer`
    -1 /* DYNAMIC_EMBEDDED_VIEWS_ONLY */ << 1 /* SHIFT */, // active index
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
        /** @type {?} */
        let activeIndexFlag;
        if (isLContainer(viewOrContainer) &&
            (activeIndexFlag = viewOrContainer[ACTIVE_INDEX]) >> 1 /* SHIFT */ ===
                -1 /* DYNAMIC_EMBEDDED_VIEWS_ONLY */) {
            for (let i = CONTAINER_HEADER_OFFSET; i < viewOrContainer.length; i++) {
                /** @type {?} */
                const embeddedLView = viewOrContainer[i];
                /** @type {?} */
                const embeddedTView = embeddedLView[TVIEW];
                ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
                refreshView(embeddedLView, embeddedTView, embeddedTView.template, (/** @type {?} */ (embeddedLView[CONTEXT])));
            }
            if ((activeIndexFlag & 1 /* HAS_TRANSPLANTED_VIEWS */) !== 0) {
                // We should only CD moved views if the component where they were inserted does not match
                // the component where they were declared and insertion is on-push. Moved views also
                // contains intra component moves, or check-always which need to be skipped.
                refreshTransplantedViews(viewOrContainer, (/** @type {?} */ (lView[DECLARATION_COMPONENT_VIEW])));
            }
        }
        viewOrContainer = viewOrContainer[NEXT];
    }
}
/**
 * Refresh transplanted LViews.
 *
 * See: `ActiveIndexFlag.HAS_TRANSPLANTED_VIEWS` and `LView[DECLARATION_COMPONENT_VIEW]` for
 * explanation of transplanted views.
 *
 * @param {?} lContainer The `LContainer` which has transplanted views.
 * @param {?} declaredComponentLView The `lContainer` parent component `LView`.
 * @return {?}
 */
function refreshTransplantedViews(lContainer, declaredComponentLView) {
    /** @type {?} */
    const movedViews = (/** @type {?} */ (lContainer[MOVED_VIEWS]));
    ngDevMode && assertDefined(movedViews, 'Transplanted View flags set but missing MOVED_VIEWS');
    for (let i = 0; i < movedViews.length; i++) {
        /** @type {?} */
        const movedLView = (/** @type {?} */ (movedViews[i]));
        /** @type {?} */
        const insertionLContainer = (/** @type {?} */ (movedLView[PARENT]));
        ngDevMode && assertLContainer(insertionLContainer);
        /** @type {?} */
        const insertedComponentLView = (/** @type {?} */ (insertionLContainer[PARENT][DECLARATION_COMPONENT_VIEW]));
        ngDevMode && assertDefined(insertedComponentLView, 'Missing LView');
        // Check if we have a transplanted view by compering declaration and insertion location.
        if (insertedComponentLView !== declaredComponentLView) {
            // Yes the `LView` is transplanted.
            // Here we would like to know if the component is `OnPush`. We don't have
            // explicit `OnPush` flag instead we set `CheckAlways` to false (which is `OnPush`)
            // Not to be confused with `ManualOnPush` which is used with wether a DOM event
            // should automatically mark a view as dirty.
            /** @type {?} */
            const insertionComponentIsOnPush = (insertedComponentLView[FLAGS] & 16 /* CheckAlways */) === 0;
            if (insertionComponentIsOnPush) {
                // Here we know that the template has been transplanted across components and is
                // on-push (not just moved within a component). If the insertion is marked dirty, then
                // there is no need to CD here as we will do it again later when we get to insertion
                // point.
                /** @type {?} */
                const movedTView = movedLView[TVIEW];
                ngDevMode && assertDefined(movedTView, 'TView must be allocated');
                refreshView(movedLView, movedTView, movedTView.template, (/** @type {?} */ (movedLView[CONTEXT])));
            }
        }
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
    const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
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
    const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
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
 * @param {?} view
 * @return {?}
 */
export function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = ngDevMode ? new LCleanup() : []);
}
/**
 * @param {?} view
 * @return {?}
 */
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = ngDevMode ? new TCleanup() : []);
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
 * @param {?} append
 * @return {?}
 */
export function renderInitialStyling(renderer, native, tNode, append) {
    if (tNode.classes !== null) {
        if (append) {
            renderStylingMap(renderer, native, tNode.classes, true);
        }
        else {
            /** @type {?} */
            const classes = getInitialStylingValue(tNode.classes);
            writeStylingValueDirectly(renderer, native, classes, true, null);
        }
    }
    if (tNode.styles !== null) {
        if (append) {
            renderStylingMap(renderer, native, tNode.styles, false);
        }
        else {
            /** @type {?} */
            const styles = getInitialStylingValue(tNode.styles);
            writeStylingValueDirectly(renderer, native, styles, false, null);
        }
    }
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQy9GLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQ3RELE9BQU8sRUFBQyw4QkFBOEIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRS9HLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakosT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFPLEVBQUMsaUJBQWlCLEVB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Ozs7Ozs7Ozs7Ozs7OztBQVdELE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsUUFBbUIsRUFBRSxNQUFnQixFQUFFLEtBQVksRUFBRSxNQUFlO0lBQ3RFLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDMUIsSUFBSSxNQUFNLEVBQUU7WUFDVixnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDekQ7YUFBTTs7a0JBQ0MsT0FBTyxHQUFHLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUM7WUFDckQseUJBQXlCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ2xFO0tBQ0Y7SUFDRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFO1FBQ3pCLElBQUksTUFBTSxFQUFFO1lBQ1YsZ0JBQWdCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3pEO2FBQU07O2tCQUNDLE1BQU0sR0FBRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDO1lBQ25ELHlCQUF5QixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNsRTtLQUNGO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi8uLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7Q1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTk9fRVJST1JTX1NDSEVNQSwgU2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzLCB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtTYW5pdGl6ZXJ9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6ZXInO1xuaW1wb3J0IHthc3NlcnREYXRhSW5SYW5nZSwgYXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RG9tTm9kZSwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90U2FtZX0gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtjcmVhdGVOYW1lZEFycmF5VHlwZX0gZnJvbSAnLi4vLi4vdXRpbC9uYW1lZF9hcnJheV90eXBlJztcbmltcG9ydCB7aW5pdE5nRGV2TW9kZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19kZXZfbW9kZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi8uLi91dGlsL25nX3JlZmxlY3QnO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3MsIGFzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbic7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHt0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzLCByZWdpc3RlclByZU9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBBY3RpdmVJbmRleEZsYWcsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHMsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3QsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJTkpFQ1RPUiwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGUsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7QWN0aXZlRWxlbWVudEZsYWdzLCBlbnRlclZpZXcsIGV4ZWN1dGVFbGVtZW50RXhpdEZuLCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgaGFzQWN0aXZlRWxlbWVudEZsYWcsIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkLCBsZWF2ZVZpZXcsIGxlYXZlVmlld1Byb2Nlc3NFeGl0LCBzZXRBY3RpdmVIb3N0RWxlbWVudCwgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdCwgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50RGlyZWN0aXZlRGVmLCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge3JlbmRlclN0eWxpbmdNYXAsIHdyaXRlU3R5bGluZ1ZhbHVlRGlyZWN0bHl9IGZyb20gJy4uL3N0eWxpbmcvYmluZGluZ3MnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2lzQW5pbWF0aW9uUHJvcH0gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRJbml0aWFsU3R5bGluZ1ZhbHVlfSBmcm9tICcuLi91dGlsL3N0eWxpbmdfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCByZWFkUGF0Y2hlZExWaWV3LCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHtMQ2xlYW51cCwgTFZpZXdCbHVlcHJpbnQsIE1hdGNoZXNBcnJheSwgVENsZWFudXAsIFROb2RlQ29uc3RydWN0b3IsIFROb2RlSW5pdGlhbElucHV0cywgVE5vZGVMb2NhbE5hbWVzLCBUVmlld0NvbXBvbmVudHMsIFRWaWV3Q29uc3RydWN0b3IsIGF0dGFjaExDb250YWluZXJEZWJ1ZywgYXR0YWNoTFZpZXdEZWJ1ZywgY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50LCBjbG9uZVRvVFZpZXdEYXRhfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gKCgpID0+IFByb21pc2UucmVzb2x2ZShudWxsKSkoKTtcblxuLyoqIFNldHMgdGhlIGhvc3QgYmluZGluZ3MgZm9yIHRoZSBjdXJyZW50IHZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgaWYgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgIT09IG51bGwpIHtcbiAgICAgIGxldCBiaW5kaW5nUm9vdEluZGV4ID0gc2V0QmluZGluZ0luZGV4KHRWaWV3LmV4cGFuZG9TdGFydEluZGV4KTtcbiAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgaW5zdHJ1Y3Rpb24gPT09ICdudW1iZXInKSB7XG4gICAgICAgICAgaWYgKGluc3RydWN0aW9uIDw9IDApIHtcbiAgICAgICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgbWVhbiB0aGF0IHdlIGFyZSBzdGFydGluZyBuZXcgRVhQQU5ETyBibG9jayBhbmQgbmVlZCB0byB1cGRhdGVcbiAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQgYW5kIGRpcmVjdGl2ZSBpbmRleC5cbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAtaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgICAgLy8gSW5qZWN0b3IgYmxvY2sgYW5kIHByb3ZpZGVycyBhcmUgdGFrZW4gaW50byBhY2NvdW50LlxuICAgICAgICAgICAgY29uc3QgcHJvdmlkZXJDb3VudCA9ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zWysraV0gYXMgbnVtYmVyKTtcbiAgICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAgIC8vIGFuZCBnZXQgdG8gdGhlIGZpcnN0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkgb3IgdGhlIGhvc3QgdmFyIGNvdW50XG4gICAgICAgICAgICAvLyAodG8gZ2V0IHRvIHRoZSBuZXh0IHNldCBvZiBob3N0IGJpbmRpbmdzIG9uIHRoaXMgbm9kZSkuXG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiBpdCdzIG5vdCBhIG51bWJlciwgaXQncyBhIGhvc3QgYmluZGluZyBmdW5jdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGV4ZWN1dGVkLlxuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gRWFjaCBkaXJlY3RpdmUgZ2V0cyBhIHVuaXF1ZUlkIHZhbHVlIHRoYXQgaXMgdGhlIHNhbWUgZm9yIGJvdGhcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhbmQgdXBkYXRlIGNhbGxzIHdoZW4gdGhlIGhvc3RCaW5kaW5ncyBmdW5jdGlvbiBpcyBjYWxsZWQuIFRoZVxuICAgICAgICAgICAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAgICAgICAgICAgLy8gZWFjaCBob3N0QmluZGluZ3MgY2FsbCBhbmQgaXMgdXNlZnVsIGZvciBoZWxwaW5nIGluc3RydWN0aW9uIGNvZGVcbiAgICAgICAgICAgIC8vIHVuaXF1ZWx5IGRldGVybWluZSB3aGljaCBkaXJlY3RpdmUgaXMgY3VycmVudGx5IGFjdGl2ZSB3aGVuIGV4ZWN1dGVkLlxuICAgICAgICAgICAgLy8gSXQgaXMgaW1wb3J0YW50IHRoYXQgdGhpcyBiZSBjYWxsZWQgZmlyc3QgYmVmb3JlIHRoZSBhY3R1YWwgaW5zdHJ1Y3Rpb25zXG4gICAgICAgICAgICAvLyBhcmUgcnVuIGJlY2F1c2UgdGhpcyB3YXkgdGhlIGZpcnN0IGRpcmVjdGl2ZSBJRCB2YWx1ZSBpcyBub3QgemVyby5cbiAgICAgICAgICAgIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG5cbiAgICAgICAgICAgIHNldEJpbmRpbmdJbmRleChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgICAgICAgIGNvbnN0IGhvc3RDdHggPSB1bndyYXBSTm9kZShsVmlld1tjdXJyZW50RGlyZWN0aXZlSW5kZXhdKTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCwgY3VycmVudEVsZW1lbnRJbmRleCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KHNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgYWxsIGNvbnRlbnQgcXVlcmllcyBkZWNsYXJlZCBieSBkaXJlY3RpdmVzIGluIGEgZ2l2ZW4gdmlldyAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXM7XG4gIGlmIChjb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RhcnRJZHggPSBjb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IGNvbnRlbnRRdWVyaWVzW2kgKyAxXTtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZJZHggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcywgJ2NvbnRlbnRRdWVyaWVzIGZ1bmN0aW9uIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5U3RhcnRJZHgpO1xuICAgICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMgIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKiogUmVuZGVycyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKGNyZWF0aW9uIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVuZGVyQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gdXNlXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKFxuICAgIG5hbWU6IHN0cmluZywgcmVuZGVyZXI6IFJlbmRlcmVyMywgbmFtZXNwYWNlOiBzdHJpbmcgfCBudWxsKTogUkVsZW1lbnQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gbmFtZXNwYWNlID09PSBudWxsID8gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnROUyhuYW1lc3BhY2UsIG5hbWUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXcgfCBudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFQgfCBudWxsLCBmbGFnczogTFZpZXdGbGFncyxcbiAgICBob3N0OiBSRWxlbWVudCB8IG51bGwsIHRIb3N0Tm9kZTogVFZpZXdOb2RlIHwgVEVsZW1lbnROb2RlIHwgbnVsbCxcbiAgICByZW5kZXJlckZhY3Rvcnk/OiBSZW5kZXJlckZhY3RvcnkzIHwgbnVsbCwgcmVuZGVyZXI/OiBSZW5kZXJlcjMgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwsIGluamVjdG9yPzogSW5qZWN0b3IgfCBudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9XG4gICAgICBuZ0Rldk1vZGUgPyBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQodFZpZXcpIDogdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSwgJ1JlbmRlcmVyRmFjdG9yeSBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tSRU5ERVJFUl0gPSAocmVuZGVyZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJdKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCAhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3ICE9PSBudWxsIDogdHJ1ZSwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRW1iZWRkZWQgdmlld3MgbXVzdCBoYXZlIHBhcmVudExWaWV3Jyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA9XG4gICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3ICFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddIDogbFZpZXc7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHRIb3N0Tm9kZSBUaGlzIGlzIGEgaGFjayBhbmQgd2Ugc2hvdWxkIG5vdCBoYXZlIHRvIHBhc3MgdGhpcyB2YWx1ZSBpbi4gSXQgaXMgb25seSB1c2VkIHRvXG4gKiBkZXRlcm1pbmUgaWYgdGhlIHBhcmVudCBiZWxvbmdzIHRvIGEgZGlmZmVyZW50IHRWaWV3LiBJbnN0ZWFkIHdlIHNob3VsZCBub3QgaGF2ZSBwYXJlbnRUVmlld1xuICogcG9pbnQgdG8gVFZpZXcgb3RoZXIgdGhlIGN1cnJlbnQgb25lLlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3VDb250YWluZXIsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmXG4gICAgVEljdUNvbnRhaW5lck5vZGUge1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGUgfHxcbiAgICAgIGNyZWF0ZVROb2RlQXRJbmRleCh0VmlldywgdEhvc3ROb2RlLCBhZGp1c3RlZEluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUVmlld05vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmXG4gICAgICBUUHJvamVjdGlvbk5vZGUgJiBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGFkanVzdGVkSW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGlzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIHBhcmVudCAhPT0gdEhvc3ROb2RlO1xuICBjb25zdCB0UGFyZW50Tm9kZSA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgY3JlYXRlVE5vZGUodFZpZXcsIHRQYXJlbnROb2RlLCB0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgKHROb2RlLnBhcmVudCAhPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpKSB7XG4gICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmICghaXNQYXJlbnQpIHtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcpOiBUVmlld05vZGUge1xuICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gIGxldCB0Tm9kZSA9IHRWaWV3Lm5vZGU7XG4gIGlmICh0Tm9kZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIHRQYXJlbnROb2RlICYmXG4gICAgICAgIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModFBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICB0Vmlldy5ub2RlID0gdE5vZGUgPSBjcmVhdGVUTm9kZShcbiAgICAgICAgdFZpZXcsXG4gICAgICAgIHRQYXJlbnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgIC8vXG4gICAgICAgIFROb2RlVHlwZS5WaWV3LCBpbmRleCwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICB9XG5cbiAgcmV0dXJuIGxWaWV3W1RfSE9TVF0gPSB0Tm9kZSBhcyBUVmlld05vZGU7XG59XG5cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSBvciBDb21wb25lbnRGYWN0b3J5LmNyZWF0ZSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICpcbiAqIEBwYXJhbSB2aWV3IFRoZSBMVmlldyBjb250YWluaW5nIHRoZSBibHVlcHJpbnQgdG8gYWRqdXN0XG4gKiBAcGFyYW0gbnVtU2xvdHNUb0FsbG9jIFRoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2MgaW4gdGhlIExWaWV3LCBzaG91bGQgYmUgPjBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKFxuICAgICAgICAgICAgICAgICAgIG51bVNsb3RzVG9BbGxvYywgMCwgJ1RoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2Mgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiAwJyk7XG4gIGlmIChudW1TbG90c1RvQWxsb2MgPiAwKSB7XG4gICAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzVG9BbGxvYzsgaSsrKSB7XG4gICAgICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgICAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgICAgIHZpZXcucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgaW5jcmVtZW50IHRoZSBleHBhbmRvIHN0YXJ0IGluZGV4IGlmIHRoZXJlIGFyZW4ndCBhbHJlYWR5IGRpcmVjdGl2ZXNcbiAgICAgIC8vIGFuZCBpbmplY3RvcnMgc2F2ZWQgaW4gdGhlIFwiZXhwYW5kb1wiIHNlY3Rpb25cbiAgICAgIGlmICghdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCArPSBudW1TbG90c1RvQWxsb2M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTaW5jZSB3ZSdyZSBhZGRpbmcgdGhlIGR5bmFtaWMgbm9kZXMgaW50byB0aGUgZXhwYW5kbyBzZWN0aW9uLCB3ZSBuZWVkIHRvIGxldCB0aGUgaG9zdFxuICAgICAgICAvLyBiaW5kaW5ncyBrbm93IHRoYXQgdGhleSBzaG91bGQgc2tpcCB4IHNsb3RzXG4gICAgICAgIHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMucHVzaChudW1TbG90c1RvQWxsb2MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHRoZSBjcmVhdGlvbiBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGNyZWF0aW5nIHZpZXcgcXVlcnkgZnVuY3Rpb25zIChpZiBhbnkpO1xuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB0aGUgY3JlYXRpb24gbW9kZTtcbiAqIC0gdXBkYXRpbmcgc3RhdGljIHF1ZXJpZXMgKGlmIGFueSk7XG4gKiAtIGNyZWF0aW5nIGNoaWxkIGNvbXBvbmVudHMgZGVmaW5lZCBpbiBhIGdpdmVuIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJWaWV3PFQ+KGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgZW50ZXJWaWV3KGxWaWV3LCBsVmlld1tUX0hPU1RdKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLkNyZWF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdmlldywgaWYgaXQgZXhpc3RzLiBBIHRlbXBsYXRlIGZ1bmN0aW9uIG1pZ2h0IG5vdCBiZVxuICAgIC8vIGRlZmluZWQgZm9yIHRoZSByb290IGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCB0ZW1wbGF0ZUZuID0gdFZpZXcudGVtcGxhdGU7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZShsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzLlxuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgLy8gb2ZmIGZpcnN0Q3JlYXRlUGFzcy4gSWYgd2UgZG9uJ3Qgc2V0IGl0IGhlcmUsIGluc3RhbmNlcyB3aWxsIHBlcmZvcm0gZGlyZWN0aXZlXG4gICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gICAgLy8gY29udGVudCBxdWVyaWVzIGFyZSByZXNvbHZlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiAoaS5lLiB1cGRhdGUgbW9kZSksIGFmdGVyIGVtYmVkZGVkXG4gICAgLy8gdmlld3MgYXJlIHJlZnJlc2hlZCAoc2VlIGJsb2NrIGFib3ZlKS5cbiAgICBpZiAodFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIFdlIG11c3QgbWF0ZXJpYWxpemUgcXVlcnkgcmVzdWx0cyBiZWZvcmUgY2hpbGQgY29tcG9uZW50cyBhcmUgcHJvY2Vzc2VkXG4gICAgLy8gaW4gY2FzZSBhIGNoaWxkIGNvbXBvbmVudCBoYXMgcHJvamVjdGVkIGEgY29udGFpbmVyLiBUaGUgTENvbnRhaW5lciBuZWVkc1xuICAgIC8vIHRvIGV4aXN0IHNvIHRoZSBlbWJlZGRlZCB2aWV3cyBhcmUgcHJvcGVybHkgYXR0YWNoZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAgICBpZiAodFZpZXcuc3RhdGljVmlld1F1ZXJpZXMpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5VcGRhdGUsIHRWaWV3LnZpZXdRdWVyeSAhLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZW5kZXJDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICB9IGZpbmFsbHkge1xuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHVwZGF0ZSBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHVwZGF0ZSBtb2RlO1xuICogLSBleGVjdXRpbmcgaG9va3M7XG4gKiAtIHJlZnJlc2hpbmcgcXVlcmllcztcbiAqIC0gc2V0dGluZyBob3N0IGJpbmRpbmdzO1xuICogLSByZWZyZXNoaW5nIGNoaWxkIChlbWJlZGRlZCBhbmQgY29tcG9uZW50KSB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58IG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGVudGVyVmlldyhsVmlldywgbFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICB0cnkge1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuXG4gICAgc2V0QmluZGluZ0luZGV4KHRWaWV3LmJpbmRpbmdTdGFydEluZGV4KTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hhbmdlcylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXcpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIGNvbnRlbnQgaG9va3MgKEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRDaGVja0hvb2tzID0gdFZpZXcuY29udGVudENoZWNrSG9va3M7XG4gICAgICAgIGlmIChjb250ZW50Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBjb250ZW50Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIb29rcyA9IHRWaWV3LmNvbnRlbnRIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbnRlbnRIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNldEhvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3Qgdmlld0NoZWNrSG9va3MgPSB0Vmlldy52aWV3Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKHZpZXdDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHZpZXdDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdmlld0hvb2tzID0gdFZpZXcudmlld0hvb2tzO1xuICAgICAgICBpZiAodmlld0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCB2aWV3SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzID09PSB0cnVlKSB7XG4gICAgICB0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG4gICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgIGxlYXZlVmlld1Byb2Nlc3NFeGl0KCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgaG9zdFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58IG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gaG9zdFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuICB0cnkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBjb25zdCB0VmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgICBpZiAoY3JlYXRpb25Nb2RlSXNBY3RpdmUpIHtcbiAgICAgIHJlbmRlclZpZXcoaG9zdFZpZXcsIHRWaWV3LCBjb250ZXh0KTtcbiAgICB9XG4gICAgcmVmcmVzaFZpZXcoaG9zdFZpZXcsIHRWaWV3LCB0ZW1wbGF0ZUZuLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVGVtcGxhdGU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSAmJiBsVmlldy5sZW5ndGggPiBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBpbmhlcmVudGx5IHNlbGVjdCAwIHNvIHdlIGRvbid0XG4gICAgICAvLyBoYXZlIHRvIGdlbmVyYXRlIHRoYXQgaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrcy5cbiAgICAgIHNlbGVjdEluZGV4SW50ZXJuYWwobFZpZXcsIDAsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbiAgICB9XG4gICAgdGVtcGxhdGVGbihyZiwgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGhhc0FjdGl2ZUVsZW1lbnRGbGFnKEFjdGl2ZUVsZW1lbnRGbGFncy5SdW5FeGl0Rm4pKSB7XG4gICAgICBleGVjdXRlRWxlbWVudEV4aXRGbigpO1xuICAgIH1cbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkge1xuICBpZiAoIWdldEJpbmRpbmdzRW5hYmxlZCgpKSByZXR1cm47XG4gIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykpO1xuICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpID09PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykge1xuICAgIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlldyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIHJldHVybiBkZWYudFZpZXcgfHxcbiAgICAgIChkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgVFZpZXdUeXBlLkNvbXBvbmVudCwgLTEsIGRlZi50ZW1wbGF0ZSwgZGVmLmRlY2xzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSwgZGVmLnNjaGVtYXMsIGRlZi5jb25zdHMpKTtcbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIHZpZXdCbG9ja0lkIGZvciBpbmxpbmUgdmlld3MsIG9yIC0xIGlmIGl0J3MgYSBjb21wb25lbnQvZHluYW1pY1xuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb25cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gY29uc3RzIENvbnN0YW50cyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB0eXBlOiBUVmlld1R5cGUsIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fCBudWxsLCBkZWNsczogbnVtYmVyLFxuICAgIHZhcnM6IG51bWJlciwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT58IG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW10gfCBudWxsLFxuICAgIGNvbnN0czogVENvbnN0YW50cyB8IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgZGVjbHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgcmV0dXJuIGJsdWVwcmludFtUVklFVyBhcyBhbnldID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUVmlld0NvbnN0cnVjdG9yKFxuICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgdmlld0luZGV4LCAgIC8vIGlkOiBudW1iZXIsXG4gICAgICAgICAgICAgYmx1ZXByaW50LCAgIC8vIGJsdWVwcmludDogTFZpZXcsXG4gICAgICAgICAgICAgdGVtcGxhdGVGbiwgIC8vIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgLy8gcXVlcmllczogVFF1ZXJpZXN8bnVsbFxuICAgICAgICAgICAgIHZpZXdRdWVyeSwgICAvLyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsXG4gICAgICAgICAgICAgbnVsbCAhLCAgICAgIC8vIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCxcbiAgICAgICAgICAgICBjbG9uZVRvVFZpZXdEYXRhKGJsdWVwcmludCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksICAvLyBkYXRhOiBURGF0YSxcbiAgICAgICAgICAgICBiaW5kaW5nU3RhcnRJbmRleCwgIC8vIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgaW5pdGlhbFZpZXdMZW5ndGgsICAvLyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsLFxuICAgICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgLy8gZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgLy8gZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgLy8gc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZGVzdHJveUhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICAgICBjb25zdHMpIDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdHM6IFRDb25zdGFudHN8bnVsbFxuICAgICAge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBpZDogdmlld0luZGV4LFxuICAgICAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgICAgIHF1ZXJpZXM6IG51bGwsXG4gICAgICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgICAgICBub2RlOiBudWxsICEsXG4gICAgICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLFxuICAgICAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICAgICAgZXhwYW5kb0luc3RydWN0aW9uczogbnVsbCxcbiAgICAgICAgZmlyc3RDcmVhdGVQYXNzOiB0cnVlLFxuICAgICAgICBmaXJzdFVwZGF0ZVBhc3M6IHRydWUsXG4gICAgICAgIHN0YXRpY1ZpZXdRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgc3RhdGljQ29udGVudFF1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBwcmVPcmRlckhvb2tzOiBudWxsLFxuICAgICAgICBwcmVPcmRlckNoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdIb29rczogbnVsbCxcbiAgICAgICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICAgICAgY2xlYW51cDogbnVsbCxcbiAgICAgICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgICAgICBmaXJzdENoaWxkOiBudWxsLFxuICAgICAgICBzY2hlbWFzOiBzY2hlbWFzLFxuICAgICAgICBjb25zdHM6IGNvbnN0cyxcbiAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmdEZXZNb2RlID8gbmV3IExWaWV3Qmx1ZXByaW50KCkgOiBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxWaWV3TGVuZ3RoOyBpKyspIHtcbiAgICBibHVlcHJpbnQucHVzaChpIDwgYmluZGluZ1N0YXJ0SW5kZXggPyBudWxsIDogTk9fQ0hBTkdFKTtcbiAgfVxuXG4gIHJldHVybiBibHVlcHJpbnQgYXMgTFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnlGb3JFcnJvcih0b2tlbil9XWApO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIb3N0Tm9kZUV4aXN0cyhyRWxlbWVudDogUkVsZW1lbnQsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZykge1xuICBpZiAoIXJFbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgcmVuZGVyZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbmNhcHN1bGF0aW9uIFZpZXcgRW5jYXBzdWxhdGlvbiBkZWZpbmVkIGZvciBjb21wb25lbnQgdGhhdCByZXF1ZXN0cyBob3N0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZyxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbik6IFJFbGVtZW50IHtcbiAgY29uc3QgcmVuZGVyZXIgPSByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG5cbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIC8vIFdoZW4gdXNpbmcgbmF0aXZlIFNoYWRvdyBET00sIGRvIG5vdCBjbGVhciBob3N0IGVsZW1lbnQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvblxuICAgIGNvbnN0IHByZXNlcnZlQ29udGVudCA9IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgICByZXR1cm4gcmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IsIHByZXNlcnZlQ29udGVudCk7XG4gIH1cblxuICBsZXQgckVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIHJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpICEgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRIb3N0Tm9kZUV4aXN0cyhyRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3IpO1xuXG4gIC8vIEFsd2F5cyBjbGVhciBob3N0IGVsZW1lbnQncyBjb250ZW50IHdoZW4gUmVuZGVyZXIzIGlzIGluIHVzZS4gRm9yIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSB3ZVxuICAvLyBtYWtlIGl0IGRlcGVuZCBvbiB3aGV0aGVyIFNoYWRvd0RvbSBlbmNhcHN1bGF0aW9uIGlzIHVzZWQgKGluIHdoaWNoIGNhc2UgdGhlIGNvbnRlbnQgc2hvdWxkIGJlXG4gIC8vIHByZXNlcnZlZCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uKS4gU2hhZG93RG9tIGVuY2Fwc3VsYXRpb24gcmVxdWlyZXMgcHJvY2VkdXJhbFxuICAvLyByZW5kZXJlciwgYW5kIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSBpcyBoYW5kbGVkIGFib3ZlLlxuICByRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuXG4gIHJldHVybiByRWxlbWVudDtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAobFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih2aWV3OiBMVmlldywgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBnZXRDbGVhbnVwKHZpZXcpLnB1c2goY2xlYW51cEZuKTtcblxuICBpZiAodmlld1tUVklFV10uZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8vIFRPRE86IFJlbW92ZSB0aGlzIHdoZW4gdGhlIGlzc3VlIGlzIHJlc29sdmVkLlxuLyoqXG4gKiBUc2lja2xlIGhhcyBhIGJ1ZyB3aGVyZSBpdCBjcmVhdGVzIGFuIGluZmluaXRlIGxvb3AgZm9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGl0c2VsZi5cbiAqIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0aGF0IHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzEwMDkpXG4gKi9cbmV4cG9ydCB0eXBlIFRzaWNrbGVJc3N1ZTEwMDkgPSBhbnk7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIHJldHVybiBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVDb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIGZsYWdzOiBUTm9kZUZsYWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLCAgICAgICAgLy8gdGFnTmFtZTogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycywgIC8vIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gbmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjaGlsZDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50LCAgICAvLyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gc3R5bGVzOiBUU3R5bGluZ0NvbnRleHR8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNsYXNzZXM6IFRTdHlsaW5nQ29udGV4dHxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgKSA6XG4gICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4OiBpbmplY3RvckluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiBhdHRycyxcbiAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICB0Vmlld3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjaGlsZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0UGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICB9O1xufVxuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIGlucHV0QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSwgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsXG4gICAgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXMgfCBudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIGlucHV0QWxpYXNNYXApIHtcbiAgICBpZiAoaW5wdXRBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlID09PSBudWxsID8ge30gOiBwcm9wU3RvcmU7XG4gICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBpbnB1dEFsaWFzTWFwW3B1YmxpY05hbWVdO1xuXG4gICAgICBpZiAocHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgIHByb3BTdG9yZVtwdWJsaWNOYW1lXS5wdXNoKGRpcmVjdGl2ZURlZklkeCwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbZGlyZWN0aXZlRGVmSWR4LCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWVdKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyBkYXRhIHN0cnVjdHVyZXMgcmVxdWlyZWQgdG8gd29yayB3aXRoIGRpcmVjdGl2ZSBvdXRwdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5mdW5jdGlvbiBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgZGVmcyA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsSW5wdXRzKCkgOiBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGRpcmVjdGl2ZUlucHV0cyA9IGRpcmVjdGl2ZURlZi5pbnB1dHM7XG4gICAgaW5wdXRzRnJvbUF0dHJzLnB1c2goXG4gICAgICAgIHROb2RlQXR0cnMgIT09IG51bGwgPyBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoZGlyZWN0aXZlSW5wdXRzLCB0Tm9kZUF0dHJzKSA6IG51bGwpO1xuICAgIGlucHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlSW5wdXRzLCBpLCBpbnB1dHNTdG9yZSk7XG4gICAgb3V0cHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlRGVmLm91dHB1dHMsIGksIG91dHB1dHNTdG9yZSk7XG4gIH1cblxuICBpZiAoaW5wdXRzU3RvcmUgIT09IG51bGwpIHtcbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykgfHwgaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzTmFtZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnc3R5bGUnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0O1xuICAgIH1cbiAgfVxuXG4gIHROb2RlLmluaXRpYWxJbnB1dHMgPSBpbnB1dHNGcm9tQXR0cnM7XG4gIHROb2RlLmlucHV0cyA9IGlucHV0c1N0b3JlO1xuICB0Tm9kZS5vdXRwdXRzID0gb3V0cHV0c1N0b3JlO1xufVxuXG4vKipcbiAqIE1hcHBpbmcgYmV0d2VlbiBhdHRyaWJ1dGVzIG5hbWVzIHRoYXQgZG9uJ3QgY29ycmVzcG9uZCB0byB0aGVpciBlbGVtZW50IHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIFBlcmZvcm1hbmNlIG5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgd3JpdHRlbiBhcyBhIHNlcmllcyBvZiBpZiBjaGVja3MgKGluc3RlYWQgb2YsIHNheSwgYSBwcm9wZXJ0eVxuICogb2JqZWN0IGxvb2t1cCkgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgLSB0aGUgc2VyaWVzIG9mIGBpZmAgY2hlY2tzIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZXN0IHdheSBvZlxuICogbWFwcGluZyBwcm9wZXJ0eSBuYW1lcy4gRG8gTk9UIGNoYW5nZSB3aXRob3V0IGJlbmNobWFya2luZy5cbiAqXG4gKiBOb3RlOiB0aGlzIG1hcHBpbmcgaGFzIHRvIGJlIGtlcHQgaW4gc3luYyB3aXRoIHRoZSBlcXVhbGx5IG5hbWVkIG1hcHBpbmcgaW4gdGhlIHRlbXBsYXRlXG4gKiB0eXBlLWNoZWNraW5nIG1hY2hpbmVyeSBvZiBuZ3RzYy5cbiAqL1xuZnVuY3Rpb24gbWFwUHJvcE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUgPT09ICdjbGFzcycpIHJldHVybiAnY2xhc3NOYW1lJztcbiAgaWYgKG5hbWUgPT09ICdmb3InKSByZXR1cm4gJ2h0bWxGb3InO1xuICBpZiAobmFtZSA9PT0gJ2Zvcm1hY3Rpb24nKSByZXR1cm4gJ2Zvcm1BY3Rpb24nO1xuICBpZiAobmFtZSA9PT0gJ2lubmVySHRtbCcpIHJldHVybiAnaW5uZXJIVE1MJztcbiAgaWYgKG5hbWUgPT09ICdyZWFkb25seScpIHJldHVybiAncmVhZE9ubHknO1xuICBpZiAobmFtZSA9PT0gJ3RhYmluZGV4JykgcmV0dXJuICd0YWJJbmRleCc7XG4gIHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hdGl2ZU9ubHk/OiBib29sZWFuLFxuICAgIGxvYWRSZW5kZXJlckZuPzogKCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykgPT4gUmVuZGVyZXIzKSB8IG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgbGV0IGlucHV0RGF0YSA9IHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIGlucHV0RGF0YSAhPSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3LCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCF2YWxpZGF0ZVByb3BlcnR5KGxWaWV3LCBlbGVtZW50LCBwcm9wTmFtZSwgdE5vZGUpKSB7XG4gICAgICAgIC8vIFJldHVybiBoZXJlIHNpbmNlIHdlIG9ubHkgbG9nIHdhcm5pbmdzIGZvciB1bmtub3duIHByb3BlcnRpZXMuXG4gICAgICAgIHdhcm5BYm91dFVua25vd25Qcm9wZXJ0eShwcm9wTmFtZSwgdE5vZGUpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5IGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXMobFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICB3YXJuQWJvdXRVbmtub3duUHJvcGVydHkocHJvcE5hbWUsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0eShcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgYXR0ck5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGF0dHJOYW1lKTtcbiAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSkgOlxuICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRlYnVnVmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHRleHRDb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgKGVsZW1lbnQgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gdGV4dENvbnRlbnQ7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZSxcbiAgICB2YWx1ZTogYW55KSB7XG4gIGlmICh0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLyoqXG4gICAgICogZGF0YVZhbHVlIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgcnVudGltZSBpbnB1dCBvciBvdXRwdXQgbmFtZXMgZm9yIHRoZSBkaXJlY3RpdmVzOlxuICAgICAqIGkrMDogZGlyZWN0aXZlIGluc3RhbmNlIGluZGV4XG4gICAgICogaSsxOiBwdWJsaWNOYW1lXG4gICAgICogaSsyOiBwcml2YXRlTmFtZVxuICAgICAqXG4gICAgICogZS5nLiBbMCwgJ2NoYW5nZScsICdjaGFuZ2UtbWluaWZpZWQnXVxuICAgICAqIHdlIHdhbnQgdG8gc2V0IHRoZSByZWZsZWN0ZWQgcHJvcGVydHkgd2l0aCB0aGUgcHJpdmF0ZU5hbWU6IGRhdGFWYWx1ZVtpKzJdXG4gICAgICovXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhVmFsdWUubGVuZ3RoOyBpICs9IDMpIHtcbiAgICAgIHNldE5nUmVmbGVjdFByb3BlcnR5KGxWaWV3LCBlbGVtZW50LCB0eXBlLCBkYXRhVmFsdWVbaSArIDJdIGFzIHN0cmluZywgdmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZVByb3BlcnR5KFxuICAgIGhvc3RWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgcHJvcE5hbWU6IHN0cmluZywgdE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50XG4gIC8vIG9yIGl0IGlzIHN5bnRoZXRpYywgYW5kIHdlIGFyZSBpbiBhIGJyb3dzZXIgY29udGV4dCAod2ViIHdvcmtlciBub2RlcyBzaG91bGQgYmUgc2tpcHBlZCkuXG4gIHJldHVybiBtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXcsIHROb2RlLnRhZ05hbWUpIHx8IHByb3BOYW1lIGluIGVsZW1lbnQgfHxcbiAgICAgIGlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkgfHwgdHlwZW9mIE5vZGUgIT09ICdmdW5jdGlvbicgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgTm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXc6IExWaWV3LCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjaGVtYXMgPSBob3N0Vmlld1tUVklFV10uc2NoZW1hcztcblxuICBpZiAoc2NoZW1hcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZW1hcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NoZW1hID0gc2NoZW1hc1tpXTtcbiAgICAgIGlmIChzY2hlbWEgPT09IE5PX0VSUk9SU19TQ0hFTUEgfHxcbiAgICAgICAgICBzY2hlbWEgPT09IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEgJiYgdGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBMb2dzIGEgd2FybmluZyB0aGF0IGEgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBvbiBhbiBlbGVtZW50LlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHkuXG4gKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIHdhcm5BYm91dFVua25vd25Qcm9wZXJ0eShwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgY29uc29sZS53YXJuKFxuICAgICAgYENhbid0IGJpbmQgdG8gJyR7cHJvcE5hbWV9JyBzaW5jZSBpdCBpc24ndCBhIGtub3duIHByb3BlcnR5IG9mICcke3ROb2RlLnRhZ05hbWV9Jy5gKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBkZWY6IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIGxWaWV3LCBkZWYpO1xuICB9XG4gIGNvbnN0IGRpcmVjdGl2ZSA9XG4gICAgICBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCBsVmlldywgbFZpZXcubGVuZ3RoIC0gMSwgcm9vdFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShyb290VE5vZGUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIG1hdGNoZWQgZGlyZWN0aXZlcyBvbiBhIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluXG4gIC8vIHRzaWNrbGUuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwgPSBmaW5kRGlyZWN0aXZlTWF0Y2hlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG4gIGxldCBoYXNEaXJlY3RpdmVzID0gZmFsc2U7XG5cbiAgaWYgKGRpcmVjdGl2ZXMgIT09IG51bGwpIHtcbiAgICBoYXNEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA9ICh0Vmlldy5wcmVPcmRlckhvb2tzICYmIHRWaWV3LnByZU9yZGVySG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPVxuICAgICAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzICYmIHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcy5sZW5ndGgpIHx8IDA7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0VmlldywgbFZpZXcsIGRlZik7XG5cbiAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAodFZpZXcuZGF0YSAhLmxlbmd0aCAtIDEsIGRlZiwgZXhwb3J0c01hcCk7XG5cbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICAgICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzO1xuXG4gICAgICAvLyBJbml0IGhvb2tzIGFyZSBxdWV1ZWQgbm93IHNvIG5nT25Jbml0IGlzIGNhbGxlZCBpbiBob3N0IGNvbXBvbmVudHMgYmVmb3JlXG4gICAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgICByZWdpc3RlclByZU9yZGVySG9va3MoXG4gICAgICAgICAgZGlyZWN0aXZlRGVmSWR4LCBkZWYsIHRWaWV3LCBub2RlSW5kZXgsIGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoLFxuICAgICAgICAgIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGgpO1xuICAgIH1cblxuICAgIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXcsIHROb2RlKTtcbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG4gIHJldHVybiBoYXNEaXJlY3RpdmVzO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsIG5hdGl2ZTogUk5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIXRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHMgPSB0Tm9kZS5pbml0aWFsSW5wdXRzO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudERlZihkZWYpO1xuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgYWRkQ29tcG9uZW50TG9naWMobFZpZXcsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSwgZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZSh0Vmlldy5kYXRhLCBsVmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzICEpO1xuICAgIH1cblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgITtcbiAgY29uc3QgZmlyc3RDcmVhdGVQYXNzID0gdFZpZXcuZmlyc3RDcmVhdGVQYXNzO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIHRyeSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdmlld0RhdGFbaV07XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgICAvLyBJdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGlzIGJlIGNhbGxlZCBmaXJzdCBiZWZvcmUgdGhlIGFjdHVhbCBpbnN0cnVjdGlvbnNcbiAgICAgICAgLy8gYXJlIHJ1biBiZWNhdXNlIHRoaXMgd2F5IHRoZSBmaXJzdCBkaXJlY3RpdmUgSUQgdmFsdWUgaXMgbm90IHplcm8uXG4gICAgICAgIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgICAgIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZiwgZXhwYW5kbywgZGlyZWN0aXZlLCB0Tm9kZSwgZmlyc3RDcmVhdGVQYXNzKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICAgIGV4cGFuZG8ucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQobnVsbCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGV4cGFuZG86IEV4cGFuZG9JbnN0cnVjdGlvbnMsIGRpcmVjdGl2ZTogYW55LCB0Tm9kZTogVE5vZGUsXG4gICAgZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuKSB7XG4gIGNvbnN0IHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9IGV4cGFuZG8ubGVuZ3RoO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKGRlZik7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgZGVmLmhvc3RCaW5kaW5ncyAhKFJlbmRlckZsYWdzLkNyZWF0ZSwgZGlyZWN0aXZlLCBlbGVtZW50SW5kZXgpO1xuICBzZXRDdXJyZW50RGlyZWN0aXZlRGVmKG51bGwpO1xuICAvLyBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbiBtYXkgb3IgbWF5IG5vdCBjb250YWluIGBhbGxvY0hvc3RWYXJzYCBjYWxsXG4gIC8vIChlLmcuIGl0IG1heSBub3QgaWYgaXQgb25seSBjb250YWlucyBob3N0IGxpc3RlbmVycyksIHNvIHdlIG5lZWQgdG8gY2hlY2sgd2hldGhlclxuICAvLyBgZXhwYW5kb0luc3RydWN0aW9uc2AgaGFzIGNoYW5nZWQgYW5kIGlmIG5vdCAtIHdlIHN0aWxsIHB1c2ggYGhvc3RCaW5kaW5nc2AgdG9cbiAgLy8gZXhwYW5kbyBibG9jaywgdG8gbWFrZSBzdXJlIHdlIGV4ZWN1dGUgaXQgZm9yIERJIGN5Y2xlXG4gIGlmIChwcmV2aW91c0V4cGFuZG9MZW5ndGggPT09IGV4cGFuZG8ubGVuZ3RoICYmIGZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgfVxufVxuXG4vKipcbiogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbipcbiogRWFjaCBleHBhbmRvIGJsb2NrIHN0YXJ0cyB3aXRoIHRoZSBlbGVtZW50IGluZGV4ICh0dXJuZWQgbmVnYXRpdmUgc28gd2UgY2FuIGRpc3Rpbmd1aXNoXG4qIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2soXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHRWaWV3LmZpcnN0Q3JlYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgY3JlYXRlIHBhc3MuJyk7XG5cbiAgY29uc3QgZWxlbWVudEluZGV4ID0gLSh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBwcm92aWRlclN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgcHJvdmlkZXJDb3VudCA9IHRWaWV3LmRhdGEubGVuZ3RoIC0gcHJvdmlkZXJTdGFydEluZGV4O1xuICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtcbiAgIF0pKS5wdXNoKGVsZW1lbnRJbmRleCwgcHJvdmlkZXJDb3VudCwgZGlyZWN0aXZlQ291bnQpO1xufVxuXG4vKipcbiogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4qIElmIGEgY29tcG9uZW50IGlzIG1hdGNoZWQgKGF0IG1vc3Qgb25lKSwgaXQgaXMgcmV0dXJuZWQgaW4gZmlyc3QgcG9zaXRpb24gaW4gdGhlIGFycmF5LlxuKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVNYXRjaGVzKFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSk6IERpcmVjdGl2ZURlZjxhbnk+W118bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXSBhcyBDb21wb25lbnREZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMgISwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyBmYWxzZSkpIHtcbiAgICAgICAgbWF0Y2hlcyB8fCAobWF0Y2hlcyA9IG5nRGV2TW9kZSA/IG5ldyBNYXRjaGVzQXJyYXkoKSA6IFtdKTtcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgdmlld0RhdGEpLCB0VmlldywgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3QpIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSk7XG4gICAgICAgICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUpO1xuICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgaXMgYWx3YXlzIHN0b3JlZCBmaXJzdCB3aXRoIGRpcmVjdGl2ZXMgYWZ0ZXIuXG4gICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKGRlZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbi8qKlxuICogTWFya3MgYSBnaXZlbiBUTm9kZSBhcyBhIGNvbXBvbmVudCdzIGhvc3QuIFRoaXMgY29uc2lzdHMgb2Y6XG4gKiAtIHNldHRpbmcgYXBwcm9wcmlhdGUgVE5vZGUgZmxhZ3M7XG4gKiAtIHN0b3JpbmcgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgaG9zdFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0O1xuICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IG5nRGV2TW9kZSA/IG5ldyBUVmlld0NvbXBvbmVudHMoKSA6IFtcbiAgIF0pKS5wdXNoKGhvc3RUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID1cbiAgICAgICAgbmdEZXZNb2RlID8gbmV3IFROb2RlTG9jYWxOYW1lcygpIDogW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4qIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0O1xuICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZCBvbiBhIG5vZGUsIHNhdmUgdGhlIGluZGV4XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4odFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KSB7XG4gIHRWaWV3LmRhdGEucHVzaChkZWYpO1xuICBjb25zdCBkaXJlY3RpdmVGYWN0b3J5ID0gZGVmLmZhY3RvcnkgfHwgKGRlZi5mYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWYudHlwZSwgdHJ1ZSkpO1xuICBjb25zdCBub2RlSW5qZWN0b3JGYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZGlyZWN0aXZlRmFjdG9yeSwgaXNDb21wb25lbnREZWYoZGVmKSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihsVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbmF0aXZlLFxuICAgICAgICAgIGhvc3RUTm9kZSBhcyBURWxlbWVudE5vZGUsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG5hdGl2ZSwgZGVmKSkpO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBsVmlld1tob3N0VE5vZGUuaW5kZXhdID0gY29tcG9uZW50Vmlldztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRBdHRyaWJ1dGVJbnRlcm5hbChcbiAgICBpbmRleDogbnVtYmVyLCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIGxWaWV3OiBMVmlldywgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLFxuICAgIG5hbWVzcGFjZT86IHN0cmluZykge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZSk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHROb2RlID0gZ2V0VE5vZGUoaW5kZXgsIGxWaWV3KTtcbiAgICBjb25zdCBzdHJWYWx1ZSA9XG4gICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBzdHJWYWx1ZSwgbmFtZXNwYWNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXNwYWNlID8gZWxlbWVudC5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2UsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhICFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGlmIChzZXRJbnB1dCAhPT0gbnVsbCkge1xuICAgICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gYXR0cnMgVGhlIHN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIGF0dHJzOiBUQXR0cmlidXRlcyk6IEluaXRpYWxJbnB1dHN8XG4gICAgbnVsbCB7XG4gIGxldCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzfG51bGwgPSBudWxsO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIFdlIGRvIG5vdCBhbGxvdyBpbnB1dHMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICAgICAgaSArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlByb2plY3RBcykge1xuICAgICAgLy8gU2tpcCBvdmVyIHRoZSBgbmdQcm9qZWN0QXNgIHZhbHVlLlxuICAgICAgaSArPSAyO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGl0IGFueSBvdGhlciBhdHRyaWJ1dGUgbWFya2Vycywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09PSAnbnVtYmVyJykgYnJlYWs7XG5cbiAgICBpZiAoaW5wdXRzLmhhc093blByb3BlcnR5KGF0dHJOYW1lIGFzIHN0cmluZykpIHtcbiAgICAgIGlmIChpbnB1dHNUb1N0b3JlID09PSBudWxsKSBpbnB1dHNUb1N0b3JlID0gW107XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUgYXMgc3RyaW5nLCBpbnB1dHNbYXR0ck5hbWUgYXMgc3RyaW5nXSwgYXR0cnNbaSArIDFdIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbnB1dHNUb1N0b3JlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gTm90IHN1cmUgd2h5IEkgbmVlZCB0byBkbyBgYW55YCBoZXJlIGJ1dCBUUyBjb21wbGFpbnMgbGF0ZXIuXG5jb25zdCBMQ29udGFpbmVyQXJyYXk6IGFueSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpICYmXG4gICAgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb250YWluZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCB8IExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiAhaXNQcm9jZWR1cmFsUmVuZGVyZXIoY3VycmVudFZpZXdbUkVOREVSRVJdKSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZSk7XG4gIC8vIGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS1saXRlcmFsLXZzLW5ldy1hcnJheS1yZWFsbHlcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IG5ldyAobmdEZXZNb2RlID8gTENvbnRhaW5lckFycmF5IDogQXJyYXkpKFxuICAgICAgaG9zdE5hdGl2ZSwgIC8vIGhvc3QgbmF0aXZlXG4gICAgICB0cnVlLCAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgICAgQWN0aXZlSW5kZXhGbGFnLkRZTkFNSUNfRU1CRURERURfVklFV1NfT05MWSA8PCBBY3RpdmVJbmRleEZsYWcuU0hJRlQsICAvLyBhY3RpdmUgaW5kZXhcbiAgICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgICAgdE5vZGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0X2hvc3RcbiAgICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlLFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICAgICk7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcik7XG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG5cbi8qKlxuICogR29lcyBvdmVyIGR5bmFtaWMgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBsZXQgdmlld09yQ29udGFpbmVyID0gbFZpZXdbQ0hJTERfSEVBRF07XG4gIHdoaWxlICh2aWV3T3JDb250YWluZXIgIT09IG51bGwpIHtcbiAgICAvLyBOb3RlOiB2aWV3T3JDb250YWluZXIgY2FuIGJlIGFuIExWaWV3IG9yIGFuIExDb250YWluZXIgaW5zdGFuY2UsIGJ1dCBoZXJlIHdlIGFyZSBvbmx5XG4gICAgLy8gaW50ZXJlc3RlZCBpbiBMQ29udGFpbmVyXG4gICAgbGV0IGFjdGl2ZUluZGV4RmxhZzogQWN0aXZlSW5kZXhGbGFnO1xuICAgIGlmIChpc0xDb250YWluZXIodmlld09yQ29udGFpbmVyKSAmJlxuICAgICAgICAoYWN0aXZlSW5kZXhGbGFnID0gdmlld09yQ29udGFpbmVyW0FDVElWRV9JTkRFWF0pID4+IEFjdGl2ZUluZGV4RmxhZy5TSElGVCA9PT1cbiAgICAgICAgICAgIEFjdGl2ZUluZGV4RmxhZy5EWU5BTUlDX0VNQkVEREVEX1ZJRVdTX09OTFkpIHtcbiAgICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IHZpZXdPckNvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gdmlld09yQ29udGFpbmVyW2ldO1xuICAgICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gZW1iZWRkZWRMVmlld1tUVklFV107XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVtYmVkZGVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZWZyZXNoVmlldyhlbWJlZGRlZExWaWV3LCBlbWJlZGRlZFRWaWV3LCBlbWJlZGRlZFRWaWV3LnRlbXBsYXRlLCBlbWJlZGRlZExWaWV3W0NPTlRFWFRdICEpO1xuICAgICAgfVxuICAgICAgaWYgKChhY3RpdmVJbmRleEZsYWcgJiBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXUykgIT09IDApIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgQ0QgbW92ZWQgdmlld3MgaWYgdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgaW5zZXJ0ZWQgZG9lcyBub3QgbWF0Y2hcbiAgICAgICAgLy8gdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgZGVjbGFyZWQgYW5kIGluc2VydGlvbiBpcyBvbi1wdXNoLiBNb3ZlZCB2aWV3cyBhbHNvXG4gICAgICAgIC8vIGNvbnRhaW5zIGludHJhIGNvbXBvbmVudCBtb3Zlcywgb3IgY2hlY2stYWx3YXlzIHdoaWNoIG5lZWQgdG8gYmUgc2tpcHBlZC5cbiAgICAgICAgcmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdzKHZpZXdPckNvbnRhaW5lciwgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddICEpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSB2aWV3T3JDb250YWluZXJbTkVYVF07XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlZnJlc2ggdHJhbnNwbGFudGVkIExWaWV3cy5cbiAqXG4gKiBTZWU6IGBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXU2AgYW5kIGBMVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11gIGZvclxuICogZXhwbGFuYXRpb24gb2YgdHJhbnNwbGFudGVkIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBgTENvbnRhaW5lcmAgd2hpY2ggaGFzIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqIEBwYXJhbSBkZWNsYXJlZENvbXBvbmVudExWaWV3IFRoZSBgbENvbnRhaW5lcmAgcGFyZW50IGNvbXBvbmVudCBgTFZpZXdgLlxuICovXG5mdW5jdGlvbiByZWZyZXNoVHJhbnNwbGFudGVkVmlld3MobENvbnRhaW5lcjogTENvbnRhaW5lciwgZGVjbGFyZWRDb21wb25lbnRMVmlldzogTFZpZXcpIHtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0gITtcbiAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgY29uc3QgaW5zZXJ0ZWRDb21wb25lbnRMVmlldyA9IGluc2VydGlvbkxDb250YWluZXJbUEFSRU5UXVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChpbnNlcnRlZENvbXBvbmVudExWaWV3LCAnTWlzc2luZyBMVmlldycpO1xuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYSB0cmFuc3BsYW50ZWQgdmlldyBieSBjb21wZXJpbmcgZGVjbGFyYXRpb24gYW5kIGluc2VydGlvbiBsb2NhdGlvbi5cbiAgICBpZiAoaW5zZXJ0ZWRDb21wb25lbnRMVmlldyAhPT0gZGVjbGFyZWRDb21wb25lbnRMVmlldykge1xuICAgICAgLy8gWWVzIHRoZSBgTFZpZXdgIGlzIHRyYW5zcGxhbnRlZC5cbiAgICAgIC8vIEhlcmUgd2Ugd291bGQgbGlrZSB0byBrbm93IGlmIHRoZSBjb21wb25lbnQgaXMgYE9uUHVzaGAuIFdlIGRvbid0IGhhdmVcbiAgICAgIC8vIGV4cGxpY2l0IGBPblB1c2hgIGZsYWcgaW5zdGVhZCB3ZSBzZXQgYENoZWNrQWx3YXlzYCB0byBmYWxzZSAod2hpY2ggaXMgYE9uUHVzaGApXG4gICAgICAvLyBOb3QgdG8gYmUgY29uZnVzZWQgd2l0aCBgTWFudWFsT25QdXNoYCB3aGljaCBpcyB1c2VkIHdpdGggd2V0aGVyIGEgRE9NIGV2ZW50XG4gICAgICAvLyBzaG91bGQgYXV0b21hdGljYWxseSBtYXJrIGEgdmlldyBhcyBkaXJ0eS5cbiAgICAgIGNvbnN0IGluc2VydGlvbkNvbXBvbmVudElzT25QdXNoID1cbiAgICAgICAgICAoaW5zZXJ0ZWRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSA9PT0gMDtcbiAgICAgIGlmIChpbnNlcnRpb25Db21wb25lbnRJc09uUHVzaCkge1xuICAgICAgICAvLyBIZXJlIHdlIGtub3cgdGhhdCB0aGUgdGVtcGxhdGUgaGFzIGJlZW4gdHJhbnNwbGFudGVkIGFjcm9zcyBjb21wb25lbnRzIGFuZCBpc1xuICAgICAgICAvLyBvbi1wdXNoIChub3QganVzdCBtb3ZlZCB3aXRoaW4gYSBjb21wb25lbnQpLiBJZiB0aGUgaW5zZXJ0aW9uIGlzIG1hcmtlZCBkaXJ0eSwgdGhlblxuICAgICAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIENEIGhlcmUgYXMgd2Ugd2lsbCBkbyBpdCBhZ2FpbiBsYXRlciB3aGVuIHdlIGdldCB0byBpbnNlcnRpb25cbiAgICAgICAgLy8gcG9pbnQuXG4gICAgICAgIGNvbnN0IG1vdmVkVFZpZXcgPSBtb3ZlZExWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlZnJlc2hWaWV3KG1vdmVkTFZpZXcsIG1vdmVkVFZpZXcsIG1vdmVkVFZpZXcudGVtcGxhdGUsIG1vdmVkTFZpZXdbQ09OVEVYVF0gISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpICYmXG4gICAgICBjb21wb25lbnRWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBjb25zdCB0VmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICAgIHJlZnJlc2hWaWV3KGNvbXBvbmVudFZpZXcsIHRWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3KTtcbiAgcmVuZGVyVmlldyhjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W1RWSUVXXSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXcgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiAzLiBTZWNvbmQgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXcgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VmlldzogTFZpZXcpIHtcbiAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IGNvbXBvbmVudFZpZXcubGVuZ3RoOyBpIDwgY29tcG9uZW50VFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29tcG9uZW50Vmlldy5wdXNoKGNvbXBvbmVudFRWaWV3LmJsdWVwcmludFtpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3IG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihsVmlldzogTFZpZXcsIGxWaWV3T3JMQ29udGFpbmVyOiBUKTogVCB7XG4gIC8vIFRPRE8oYmVubGVzaC9taXNrbyk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgaW5jb3JyZWN0LCBiZWNhdXNlIGl0IGFsd2F5cyBhZGRzIHRoZSBMQ29udGFpbmVyXG4gIC8vIHRvXG4gIC8vIHRoZSBlbmQgb2YgdGhlIHF1ZXVlLCB3aGljaCBtZWFucyBpZiB0aGUgZGV2ZWxvcGVyIHJldHJpZXZlcyB0aGUgTENvbnRhaW5lcnMgZnJvbSBSTm9kZXMgb3V0XG4gIC8vIG9mXG4gIC8vIG9yZGVyLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biBvdXQgb2Ygb3JkZXIsIGFzIHRoZSBhY3Qgb2YgcmV0cmlldmluZyB0aGUgdGhlXG4gIC8vIExDb250YWluZXJcbiAgLy8gZnJvbSB0aGUgUk5vZGUgaXMgd2hhdCBhZGRzIGl0IHRvIHRoZSBxdWV1ZS5cbiAgaWYgKGxWaWV3W0NISUxEX0hFQURdKSB7XG4gICAgbFZpZXdbQ0hJTERfVEFJTF0gIVtORVhUXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIGxWaWV3W0NISUxEX0hFQURdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH1cbiAgbFZpZXdbQ0hJTERfVEFJTF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICB3aGlsZSAobFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ICE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljayhyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzICEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgY29uc3QgbFZpZXcgPSByZWFkUGF0Y2hlZExWaWV3KHJvb3RDb21wb25lbnQpICE7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZShsVmlldywgdFZpZXcudGVtcGxhdGUsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gdmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgICByZWZyZXNoVmlldyh2aWV3LCB0VmlldywgdFZpZXcudGVtcGxhdGUsIGNvbnRleHQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKHZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodmlldywgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT4sIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UXVlcnlGbiwgJ1ZpZXcgcXVlcmllcyBmdW5jdGlvbiB0byBleGVjdXRlIG11c3QgYmUgZGVmaW5lZC4nKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gIHZpZXdRdWVyeUZuKGZsYWdzLCBjb21wb25lbnQpO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIG5vZGVJbmRleCBpbmRleCBvZiBhIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICAuLi5pbnRlcnBvbGF0aW9uUGFydHM6IHN0cmluZ1tdKSB7XG4gIC8vIEJpbmRpbmcgbWV0YS1kYXRhIGFyZSBzdG9yZWQgb25seSB0aGUgZmlyc3QgdGltZSBhIGdpdmVuIHByb3BlcnR5IGluc3RydWN0aW9uIGlzIHByb2Nlc3NlZC5cbiAgLy8gU2luY2Ugd2UgZG9uJ3QgaGF2ZSBhIGNvbmNlcHQgb2YgdGhlIFwiZmlyc3QgdXBkYXRlIHBhc3NcIiB3ZSBuZWVkIHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiB0aGVcbiAgLy8gYmluZGluZyBtZXRhLWRhdGEgdG8gZGVjaWRlIGlmIG9uZSBzaG91bGQgYmUgc3RvcmVkIChvciBpZiB3YXMgc3RvcmVkIGFscmVhZHkpLlxuICBpZiAodERhdGFbYmluZGluZ0luZGV4XSA9PT0gbnVsbCkge1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbbm9kZUluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PSBudWxsIHx8ICF0Tm9kZS5pbnB1dHNbcHJvcGVydHlOYW1lXSkge1xuICAgICAgY29uc3QgcHJvcEJpbmRpbmdJZHhzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncyB8fCAodE5vZGUucHJvcGVydHlCaW5kaW5ncyA9IFtdKTtcbiAgICAgIHByb3BCaW5kaW5nSWR4cy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICBsZXQgYmluZGluZ01ldGFkYXRhID0gcHJvcGVydHlOYW1lO1xuICAgICAgaWYgKGludGVycG9sYXRpb25QYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGJpbmRpbmdNZXRhZGF0YSArPVxuICAgICAgICAgICAgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBpbnRlcnBvbGF0aW9uUGFydHMuam9pbihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICB9XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gYmluZGluZ01ldGFkYXRhO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IG5nRGV2TW9kZSA/IG5ldyBMQ2xlYW51cCgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwKCkgOiBbXSk7XG59XG5cbi8qKlxuICogVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgbmVlZHMgdG8gYmUgaW5jbHVkZWRcbiAqIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXIgKHNlZSB0aGUgY29tcG9uZW50U3ludGhldGljSG9zdCogaW5zdHJ1Y3Rpb25zKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb21wb25lbnRSZW5kZXJlcih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJlbmRlcmVyMyB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gbFZpZXdbdE5vZGUuaW5kZXhdIGFzIExWaWV3O1xuICByZXR1cm4gY29tcG9uZW50TFZpZXdbUkVOREVSRVJdO1xufVxuXG4vKiogSGFuZGxlcyBhbiBlcnJvciB0aHJvd24gaW4gYW4gTFZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXJyb3IobFZpZXc6IExWaWV3LCBlcnJvcjogYW55KTogdm9pZCB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3RvciA/IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpIDogbnVsbDtcbiAgZXJyb3JIYW5kbGVyICYmIGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBpbnB1dHMgb2YgZGlyZWN0aXZlcyBhdCB0aGUgY3VycmVudCBub2RlIHRvIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGlucHV0cyBtYXBwaW5nIGJldHdlZW4gdGhlIHB1YmxpYyBcImlucHV0XCIgbmFtZSBhbmQgcHJpdmF0ZWx5LWtub3duLFxuICogcG9zc2libHkgbWluaWZpZWQsIHByb3BlcnR5IG5hbWVzIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KGxWaWV3OiBMVmlldywgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBpbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGlmIChzZXRJbnB1dCkge1xuICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0ZXh0IGJpbmRpbmcgYXQgYSBnaXZlbiBpbmRleCBpbiBhIGdpdmVuIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICd2YWx1ZSBzaG91bGQgbm90IGJlIE5PX0NIQU5HRScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgYW55IGFzIFJUZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShlbGVtZW50LCB2YWx1ZSkgOiBlbGVtZW50LnRleHRDb250ZW50ID0gdmFsdWU7XG59XG5cbi8qKlxuICogUmVuZGVycyBhbGwgaW5pdGlhbCBzdHlsaW5nIChjbGFzcyBhbmQgc3R5bGUgdmFsdWVzKSBvbiB0byB0aGUgZWxlbWVudCBmcm9tIHRoZSB0Tm9kZS5cbiAqXG4gKiBBbGwgaW5pdGlhbCBzdHlsaW5nIGRhdGEgKGkuZS4gYW55IHZhbHVlcyBleHRyYWN0ZWQgZnJvbSB0aGUgYHN0eWxlYCBvciBgY2xhc3NgIGF0dHJpYnV0ZXNcbiAqIG9uIGFuIGVsZW1lbnQpIGFyZSBjb2xsZWN0ZWQgaW50byB0aGUgYHROb2RlLnN0eWxlc2AgYW5kIGB0Tm9kZS5jbGFzc2VzYCBkYXRhIHN0cnVjdHVyZXMuXG4gKiBUaGVzZSB2YWx1ZXMgYXJlIHBvcHVsYXRlZCBkdXJpbmcgdGhlIGNyZWF0aW9uIHBoYXNlIG9mIGFuIGVsZW1lbnQgYW5kIGFyZSB0aGVuIGxhdGVyXG4gKiBhcHBsaWVkIG9uY2UgdGhlIGVsZW1lbnQgaXMgaW5zdGFudGlhdGVkLiBUaGlzIGZ1bmN0aW9uIGFwcGxpZXMgZWFjaCBvZiB0aGUgc3RhdGljXG4gKiBzdHlsZSBhbmQgY2xhc3MgZW50cmllcyB0byB0aGUgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckluaXRpYWxTdHlsaW5nKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5hdGl2ZTogUkVsZW1lbnQsIHROb2RlOiBUTm9kZSwgYXBwZW5kOiBib29sZWFuKSB7XG4gIGlmICh0Tm9kZS5jbGFzc2VzICE9PSBudWxsKSB7XG4gICAgaWYgKGFwcGVuZCkge1xuICAgICAgcmVuZGVyU3R5bGluZ01hcChyZW5kZXJlciwgbmF0aXZlLCB0Tm9kZS5jbGFzc2VzLCB0cnVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgY2xhc3NlcyA9IGdldEluaXRpYWxTdHlsaW5nVmFsdWUodE5vZGUuY2xhc3Nlcyk7XG4gICAgICB3cml0ZVN0eWxpbmdWYWx1ZURpcmVjdGx5KHJlbmRlcmVyLCBuYXRpdmUsIGNsYXNzZXMsIHRydWUsIG51bGwpO1xuICAgIH1cbiAgfVxuICBpZiAodE5vZGUuc3R5bGVzICE9PSBudWxsKSB7XG4gICAgaWYgKGFwcGVuZCkge1xuICAgICAgcmVuZGVyU3R5bGluZ01hcChyZW5kZXJlciwgbmF0aXZlLCB0Tm9kZS5zdHlsZXMsIGZhbHNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3Qgc3R5bGVzID0gZ2V0SW5pdGlhbFN0eWxpbmdWYWx1ZSh0Tm9kZS5zdHlsZXMpO1xuICAgICAgd3JpdGVTdHlsaW5nVmFsdWVEaXJlY3RseShyZW5kZXJlciwgbmF0aXZlLCBzdHlsZXMsIGZhbHNlLCBudWxsKTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==