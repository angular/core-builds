import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertGreaterThan, assertNotEqual, assertNotSame, assertSame } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { initNgDevMode } from '../../util/ng_dev_mode';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertFirstCreatePass, assertLContainer, assertLView } from '../assert';
import { attachPatchData } from '../context_discovery';
import { getFactoryDef } from '../definition';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponentDef, isComponentHost, isContentQueryHost, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TRANSPLANTED_VIEWS_TO_REFRESH, TVIEW } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getCurrentDirectiveIndex, getIsParent, getPreviousOrParentTNode, getSelectedIndex, leaveView, setBindingIndex, setBindingRootForHostBindings, setCheckNoChangesMode, setCurrentDirectiveIndex, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { isAnimationProp, mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getFirstLContainer, getLViewParent, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, isCreationMode, readPatchedLView, resetPreOrderHookFlags, unwrapLView, updateTransplantedViewCount, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData, LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeDebug, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor } from './lview_debug';
const ɵ0 = () => Promise.resolve(null);
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
const _CLEAN_PROMISE = (ɵ0)();
/**
 * Process the `TView.expandoInstructions`. (Execute the `hostBindings`.)
 *
 * @param tView `TView` containing the `expandoInstructions`
 * @param lView `LView` associated with the `TView`
 */
export function setHostBindingsByExecutingExpandoInstructions(tView, lView) {
    ngDevMode && assertSame(tView, lView[TVIEW], '`LView` is not associated with the `TView`!');
    try {
        const expandoInstructions = tView.expandoInstructions;
        if (expandoInstructions !== null) {
            let bindingRootIndex = tView.expandoStartIndex;
            let currentDirectiveIndex = -1;
            let currentElementIndex = -1;
            // TODO(misko): PERF It is possible to get here with `TView.expandoInstructions` containing no
            // functions to execute. This is wasteful as there is no work to be done, but we still need
            // to iterate over the instructions.
            // In example of this is in this test: `host_binding_spec.ts`
            // `fit('should not cause problems if detectChanges is called when a property updates', ...`
            // In the above test we get here with expando [0, 0, 1] which requires a lot of processing but
            // there is no function to execute.
            for (let i = 0; i < expandoInstructions.length; i++) {
                const instruction = expandoInstructions[i];
                if (typeof instruction === 'number') {
                    if (instruction <= 0) {
                        // Negative numbers mean that we are starting new EXPANDO block and need to update
                        // the current element and directive index.
                        // Important: In JS `-x` and `0-x` is not the same! If `x===0` then `-x` will produce
                        // `-0` which requires non standard math arithmetic and it can prevent VM optimizations.
                        // `0-0` will always produce `0` and will not cause a potential deoptimization in VM.
                        // TODO(misko): PERF This should be refactored to use `~instruction` as that does not
                        // suffer from `-0` and it is faster/more compact.
                        currentElementIndex = 0 - instruction;
                        setSelectedIndex(currentElementIndex);
                        // Injector block and providers are taken into account.
                        const providerCount = expandoInstructions[++i];
                        bindingRootIndex += INJECTOR_BLOOM_PARENT_SIZE + providerCount;
                        currentDirectiveIndex = bindingRootIndex;
                    }
                    else {
                        // This is either the injector size (so the binding root can skip over directives
                        // and get to the first set of host bindings on this node) or the host var count
                        // (to get to the next set of host bindings on this node).
                        bindingRootIndex += instruction;
                    }
                }
                else {
                    // If it's not a number, it's a host binding function that needs to be executed.
                    if (instruction !== null) {
                        setBindingRootForHostBindings(bindingRootIndex, currentDirectiveIndex);
                        const hostCtx = lView[currentDirectiveIndex];
                        instruction(2 /* Update */, hostCtx);
                    }
                    // TODO(misko): PERF Relying on incrementing the `currentDirectiveIndex` here is
                    // sub-optimal. The implications are that if we have a lot of directives but none of them
                    // have host bindings we nevertheless need to iterate over the expando instructions to
                    // update the counter. It would be much better if we could encode the
                    // `currentDirectiveIndex` into the `expandoInstruction` array so that we only need to
                    // iterate over those directives which actually have `hostBindings`.
                    currentDirectiveIndex++;
                }
            }
        }
    }
    finally {
        setSelectedIndex(-1);
    }
}
/** Refreshes all content queries declared by directives in a given view */
function refreshContentQueries(tView, lView) {
    const contentQueries = tView.contentQueries;
    if (contentQueries !== null) {
        for (let i = 0; i < contentQueries.length; i += 2) {
            const queryStartIdx = contentQueries[i];
            const directiveDefIdx = contentQueries[i + 1];
            if (directiveDefIdx !== -1) {
                const directiveDef = tView.data[directiveDefIdx];
                ngDevMode &&
                    assertDefined(directiveDef.contentQueries, 'contentQueries function should be defined');
                setCurrentQueryIndex(queryStartIdx);
                directiveDef.contentQueries(2 /* Update */, lView[directiveDefIdx], directiveDefIdx);
            }
        }
    }
}
/** Refreshes child components in the current view (update mode). */
function refreshChildComponents(hostLView, components) {
    for (let i = 0; i < components.length; i++) {
        refreshComponent(hostLView, components[i]);
    }
}
/** Renders child components in the current view (creation mode). */
function renderChildComponents(hostLView, components) {
    for (let i = 0; i < components.length; i++) {
        renderComponent(hostLView, components[i]);
    }
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param name the tag name
 * @param renderer A renderer to use
 * @returns the element created
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
export function createLView(parentLView, tView, context, flags, host, tHostNode, rendererFactory, renderer, sanitizer, injector) {
    const lView = ngDevMode ? cloneToLViewFromTViewBlueprint(tView) : tView.blueprint.slice();
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
    ngDevMode &&
        assertEqual(tView.type == 2 /* Embedded */ ? parentLView !== null : true, true, 'Embedded views must have parentLView');
    lView[DECLARATION_COMPONENT_VIEW] =
        tView.type == 2 /* Embedded */ ? parentLView[DECLARATION_COMPONENT_VIEW] : lView;
    ngDevMode && attachLViewDebug(lView);
    return lView;
}
export function getOrCreateTNode(tView, tHostNode, index, type, name, attrs) {
    // Keep this function short, so that the VM will inline it.
    const adjustedIndex = index + HEADER_OFFSET;
    const tNode = tView.data[adjustedIndex] ||
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs);
    setPreviousOrParentTNode(tNode, true);
    return tNode;
}
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs) {
    const previousOrParentTNode = getPreviousOrParentTNode();
    const isParent = getIsParent();
    const parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    const parentInSameView = parent && parent !== tHostNode;
    const tParentNode = parentInSameView ? parent : null;
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
export function assignTViewNodeToLView(tView, tParentNode, index, lView) {
    // View nodes are not stored in data because they can be added / removed at runtime (which
    // would cause indices to change). Their TNodes are instead stored in tView.node.
    let tNode = tView.node;
    if (tNode == null) {
        ngDevMode && tParentNode &&
            assertNodeOfPossibleTypes(tParentNode, 3 /* Element */, 0 /* Container */);
        tView.node = tNode = createTNode(tView, tParentNode, //
        2 /* View */, index, null, null);
    }
    lView[T_HOST] = tNode;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 *
 * @param tView `TView` associated with `LView`
 * @param view The `LView` containing the blueprint to adjust
 * @param numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 */
export function allocExpando(tView, lView, numSlotsToAlloc) {
    ngDevMode &&
        assertGreaterThan(numSlotsToAlloc, 0, 'The number of slots to alloc should be greater than 0');
    if (numSlotsToAlloc > 0) {
        if (tView.firstCreatePass) {
            for (let i = 0; i < numSlotsToAlloc; i++) {
                tView.blueprint.push(null);
                tView.data.push(null);
                lView.push(null);
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
 */
export function renderView(tView, lView, context) {
    ngDevMode && assertEqual(isCreationMode(lView), true, 'Should be run in creation mode');
    enterView(lView, lView[T_HOST]);
    try {
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(1 /* Create */, viewQuery, context);
        }
        // Execute a template associated with this view, if it exists. A template function might not be
        // defined for the root component views.
        const templateFn = tView.template;
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 1 /* Create */, context);
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
            executeViewQueryFn(2 /* Update */, tView.viewQuery, context);
        }
        // Render child component views.
        const components = tView.components;
        if (components !== null) {
            renderChildComponents(lView, components);
        }
    }
    catch (error) {
        // If we didn't manage to get past the first template pass due to
        // an error, mark the view as corrupted so we can try to recover.
        if (tView.firstCreatePass) {
            tView.incompleteFirstPass = true;
        }
        throw error;
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
 */
export function refreshView(tView, lView, templateFn, context) {
    ngDevMode && assertEqual(isCreationMode(lView), false, 'Should be run in update mode');
    const flags = lView[FLAGS];
    if ((flags & 256 /* Destroyed */) === 256 /* Destroyed */)
        return;
    enterView(lView, lView[T_HOST]);
    const checkNoChangesMode = getCheckNoChangesMode();
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 2 /* Update */, context);
        }
        const hooksInitPhaseCompleted = (flags & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        // execute pre-order hooks (OnInit, OnChanges, DoCheck)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                const preOrderCheckHooks = tView.preOrderCheckHooks;
                if (preOrderCheckHooks !== null) {
                    executeCheckHooks(lView, preOrderCheckHooks, null);
                }
            }
            else {
                const preOrderHooks = tView.preOrderHooks;
                if (preOrderHooks !== null) {
                    executeInitAndCheckHooks(lView, preOrderHooks, 0 /* OnInitHooksToBeRun */, null);
                }
                incrementInitPhaseFlags(lView, 0 /* OnInitHooksToBeRun */);
            }
        }
        // First mark transplanted views that are declared in this lView as needing a refresh at their
        // insertion points. This is needed to avoid the situation where the template is defined in this
        // `LView` but its declaration appears after the insertion component.
        markTransplantedViewsForRefresh(lView);
        refreshEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        if (tView.contentQueries !== null) {
            refreshContentQueries(tView, lView);
        }
        // execute content hooks (AfterContentInit, AfterContentChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                const contentCheckHooks = tView.contentCheckHooks;
                if (contentCheckHooks !== null) {
                    executeCheckHooks(lView, contentCheckHooks);
                }
            }
            else {
                const contentHooks = tView.contentHooks;
                if (contentHooks !== null) {
                    executeInitAndCheckHooks(lView, contentHooks, 1 /* AfterContentInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 1 /* AfterContentInitHooksToBeRun */);
            }
        }
        setHostBindingsByExecutingExpandoInstructions(tView, lView);
        // Refresh child component views.
        const components = tView.components;
        if (components !== null) {
            refreshChildComponents(lView, components);
        }
        // View queries must execute after refreshing child components because a template in this view
        // could be inserted in a child component. If the view query executes before child component
        // refresh, the template might not yet be inserted.
        const viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(2 /* Update */, viewQuery, context);
        }
        // execute view hooks (AfterViewInit, AfterViewChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                const viewCheckHooks = tView.viewCheckHooks;
                if (viewCheckHooks !== null) {
                    executeCheckHooks(lView, viewCheckHooks);
                }
            }
            else {
                const viewHooks = tView.viewHooks;
                if (viewHooks !== null) {
                    executeInitAndCheckHooks(lView, viewHooks, 2 /* AfterViewInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 2 /* AfterViewInitHooksToBeRun */);
            }
        }
        if (tView.firstUpdatePass === true) {
            // We need to make sure that we only flip the flag on successful `refreshView` only
            // Don't do this in `finally` block.
            // If we did this in `finally` block then an exception could block the execution of styling
            // instructions which in turn would be unable to insert themselves into the styling linked
            // list. The result of this would be that if the exception would not be throw on subsequent CD
            // the styling would be unable to process it data and reflect to the DOM.
            tView.firstUpdatePass = false;
        }
        // Do not reset the dirty state when running in check no changes mode. We don't want components
        // to behave differently depending on whether check no changes is enabled or not. For example:
        // Marking an OnPush component as dirty from within the `ngAfterViewInit` hook in order to
        // refresh a `NgClass` binding should work. If we would reset the dirty state in the check
        // no changes cycle, the component would be not be dirty for the next update pass. This would
        // be different in production mode where the component dirty state is not reset.
        if (!checkNoChangesMode) {
            lView[FLAGS] &= ~(64 /* Dirty */ | 8 /* FirstLViewPass */);
        }
        if (lView[FLAGS] & 1024 /* RefreshTransplantedView */) {
            lView[FLAGS] &= ~1024 /* RefreshTransplantedView */;
            updateTransplantedViewCount(lView[PARENT], -1);
        }
    }
    finally {
        leaveView();
    }
}
export function renderComponentOrTemplate(tView, lView, templateFn, context) {
    const rendererFactory = lView[RENDERER_FACTORY];
    const normalExecutionPath = !getCheckNoChangesMode();
    const creationModeIsActive = isCreationMode(lView);
    try {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (creationModeIsActive) {
            renderView(tView, lView, context);
        }
        refreshView(tView, lView, templateFn, context);
    }
    finally {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
    }
}
function executeTemplate(tView, lView, templateFn, rf, context) {
    const prevSelectedIndex = getSelectedIndex();
    try {
        setSelectedIndex(-1);
        if (rf & 2 /* Update */ && lView.length > HEADER_OFFSET) {
            // When we're updating, inherently select 0 so we don't
            // have to generate that instruction for most update blocks.
            selectIndexInternal(tView, lView, 0, getCheckNoChangesMode());
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
export function executeContentQueries(tView, tNode, lView) {
    if (isContentQueryHost(tNode)) {
        const start = tNode.directiveStart;
        const end = tNode.directiveEnd;
        for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
            const def = tView.data[directiveIndex];
            if (def.contentQueries) {
                def.contentQueries(1 /* Create */, lView[directiveIndex], directiveIndex);
            }
        }
    }
}
/**
 * Creates directive instances.
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
 */
export function saveResolvedLocalsInData(viewData, tNode, localRefExtractor = getNativeByTNode) {
    const localNames = tNode.localNames;
    if (localNames !== null) {
        let localIndex = tNode.index + 1;
        for (let i = 0; i < localNames.length; i += 2) {
            const index = localNames[i + 1];
            const value = index === -1 ?
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
export function getOrCreateTComponentView(def) {
    const tView = def.tView;
    // Create a TView if there isn't one, or recreate it if the first create pass didn't
    // complete successfuly since we can't know for sure whether it's in a usable shape.
    if (tView === null || tView.incompleteFirstPass) {
        return def.tView = createTView(1 /* Component */, -1, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts);
    }
    return tView;
}
/**
 * Creates a TView instance
 *
 * @param viewIndex The viewBlockId for inline views, or -1 if it's a component/dynamic
 * @param templateFn Template function
 * @param decls The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 * @param viewQuery View queries for this view
 * @param schemas Schemas for this view
 * @param consts Constants for this view
 */
export function createTView(type, viewIndex, templateFn, decls, vars, directives, pipes, viewQuery, schemas, consts) {
    ngDevMode && ngDevMode.tView++;
    const bindingStartIndex = HEADER_OFFSET + decls;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    const initialViewLength = bindingStartIndex + vars;
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    return blueprint[TVIEW] = ngDevMode ?
        new TViewConstructor(type, viewIndex, // id: number,
        blueprint, // blueprint: LView,
        templateFn, // template: ComponentTemplate<{}>|null,
        null, // queries: TQueries|null
        viewQuery, // viewQuery: ViewQueriesFunction<{}>|null,
        null, // node: TViewNode|TElementNode|null,
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
        null, // destroyHooks: DestroyHookData|null,
        null, // cleanup: any[]|null,
        null, // contentQueries: number[]|null,
        null, // components: number[]|null,
        typeof directives === 'function' ?
            directives() :
            directives, // directiveRegistry: DirectiveDefList|null,
        typeof pipes === 'function' ? pipes() : pipes, // pipeRegistry: PipeDefList|null,
        null, // firstChild: TNode|null,
        schemas, // schemas: SchemaMetadata[]|null,
        consts, // consts: TConstants|null
        false // incompleteFirstPass: boolean
        ) :
        {
            type: type,
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
            incompleteFirstPass: false
        };
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    const blueprint = ngDevMode ? new LViewBlueprint() : [];
    for (let i = 0; i < initialViewLength; i++) {
        blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
    }
    return blueprint;
}
function createError(text, token) {
    return new Error(`Renderer: ${text} [${stringifyForError(token)}]`);
}
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
 * @param rendererFactory Factory function to create renderer instance.
 * @param elementOrSelector Render element or CSS selector to locate the element.
 * @param encapsulation View Encapsulation defined for component that requests host element.
 */
export function locateHostElement(renderer, elementOrSelector, encapsulation) {
    if (isProceduralRenderer(renderer)) {
        // When using native Shadow DOM, do not clear host element to allow native slot projection
        const preserveContent = encapsulation === ViewEncapsulation.ShadowDom;
        return renderer.selectRootElement(elementOrSelector, preserveContent);
    }
    let rElement = typeof elementOrSelector === 'string' ?
        renderer.querySelector(elementOrSelector) :
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
 */
export function storeCleanupWithContext(tView, lView, context, cleanupFn) {
    const lCleanup = getLCleanup(lView);
    lCleanup.push(context);
    if (tView.firstCreatePass) {
        getTViewCleanup(tView).push(cleanupFn, lCleanup.length - 1);
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
export function storeCleanupFn(tView, lView, cleanupFn) {
    getLCleanup(lView).push(cleanupFn);
    if (tView.firstCreatePass) {
        getTViewCleanup(tView).push(lView[CLEANUP].length - 1, null);
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
    let injectorIndex = tParent ? tParent.injectorIndex : -1;
    return ngDevMode ? new TNodeDebug(tView, // tView_: TView
    type, // type: TNodeType
    adjustedIndex, // index: number
    injectorIndex, // injectorIndex: number
    -1, // directiveStart: number
    -1, // directiveEnd: number
    -1, // directiveStylingLast: number
    null, // propertyBindings: number[]|null
    0, // flags: TNodeFlags
    0, // providerIndexes: TNodeProviderIndexes
    tagName, // tagName: string|null
    attrs, // attrs: (string|AttributeMarker|(string|SelectorFlags)[])[]|null
    null, // mergedAttrs
    null, // localNames: (string|number)[]|null
    undefined, // initialInputs: (string[]|null)[]|null|undefined
    null, // inputs: PropertyAliases|null
    null, // outputs: PropertyAliases|null
    null, // tViews: ITView|ITView[]|null
    null, // next: ITNode|null
    null, // projectionNext: ITNode|null
    null, // child: ITNode|null
    tParent, // parent: TElementNode|TContainerNode|null
    null, // projection: number|(ITNode|RNode[])[]|null
    null, // styles: string|null
    null, // stylesWithoutHost: string|null
    undefined, // residualStyles: string|null
    null, // classes: string|null
    null, // classesWithoutHost: string|null
    undefined, // residualClasses: string|null
    0, // classBindings: TStylingRange;
    0) :
        {
            type: type,
            index: adjustedIndex,
            injectorIndex: injectorIndex,
            directiveStart: -1,
            directiveEnd: -1,
            directiveStylingLast: -1,
            propertyBindings: null,
            flags: 0,
            providerIndexes: 0,
            tagName: tagName,
            attrs: attrs,
            mergedAttrs: null,
            localNames: null,
            initialInputs: undefined,
            inputs: null,
            outputs: null,
            tViews: null,
            next: null,
            projectionNext: null,
            child: null,
            parent: tParent,
            projection: null,
            styles: null,
            stylesWithoutHost: null,
            residualStyles: undefined,
            classes: null,
            classesWithoutHost: null,
            residualClasses: undefined,
            classBindings: 0,
            styleBindings: 0,
        };
}
function generatePropertyAliases(inputAliasMap, directiveDefIdx, propStore) {
    for (let publicName in inputAliasMap) {
        if (inputAliasMap.hasOwnProperty(publicName)) {
            propStore = propStore === null ? {} : propStore;
            const internalName = inputAliasMap[publicName];
            if (propStore.hasOwnProperty(publicName)) {
                propStore[publicName].push(directiveDefIdx, internalName);
            }
            else {
                (propStore[publicName] = [directiveDefIdx, internalName]);
            }
        }
    }
    return propStore;
}
/**
 * Initializes data structures required to work with directive outputs and outputs.
 * Initialization is done for all directives matched on a given TNode.
 */
function initializeInputAndOutputAliases(tView, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const defs = tView.data;
    const tNodeAttrs = tNode.attrs;
    const inputsFromAttrs = ngDevMode ? new TNodeInitialInputs() : [];
    let inputsStore = null;
    let outputsStore = null;
    for (let i = start; i < end; i++) {
        const directiveDef = defs[i];
        const directiveInputs = directiveDef.inputs;
        // Do not use unbound attributes as inputs to structural directives, since structural
        // directive inputs can only be set using microsyntax (e.g. `<div *dir="exp">`).
        // TODO(FW-1930): microsyntax expressions may also contain unbound/static attributes, which
        // should be set for inline templates.
        const initialInputs = (tNodeAttrs !== null && !isInlineTemplate(tNode)) ?
            generateInitialInputs(directiveInputs, tNodeAttrs) :
            null;
        inputsFromAttrs.push(initialInputs);
        inputsStore = generatePropertyAliases(directiveInputs, i, inputsStore);
        outputsStore = generatePropertyAliases(directiveDef.outputs, i, outputsStore);
    }
    if (inputsStore !== null) {
        if (inputsStore.hasOwnProperty('class')) {
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
export function elementPropertyInternal(tView, tNode, lView, propName, value, renderer, sanitizer, nativeOnly) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    const element = getNativeByTNode(tNode, lView);
    let inputData = tNode.inputs;
    let dataValue;
    if (!nativeOnly && inputData != null && (dataValue = inputData[propName])) {
        setInputsForProperty(tView, lView, dataValue, propName, value);
        if (isComponentHost(tNode))
            markDirtyIfOnPush(lView, tNode.index);
        if (ngDevMode) {
            setNgReflectProperties(lView, element, tNode.type, dataValue, value);
        }
    }
    else if (tNode.type === 3 /* Element */) {
        propName = mapPropName(propName);
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            if (!validateProperty(tView, lView, element, propName, tNode)) {
                // Return here since we only log warnings for unknown properties.
                logUnknownPropertyError(propName, tNode);
                return;
            }
            ngDevMode.rendererSetProperty++;
        }
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property is risky, so sanitization can be done without further checks.
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
        if (ngDevMode && !matchingSchemas(tView, lView, tNode.tagName)) {
            logUnknownPropertyError(propName, tNode);
        }
    }
}
/** If node is an OnPush component, marks its LView dirty. */
function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    const childComponentLView = getComponentLViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 64 /* Dirty */;
    }
}
function setNgReflectProperty(lView, element, type, attrName, value) {
    const renderer = lView[RENDERER];
    attrName = normalizeDebugBindingName(attrName);
    const debugValue = normalizeDebugBindingValue(value);
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
        const textContent = `bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`;
        if (isProceduralRenderer(renderer)) {
            renderer.setValue(element, textContent);
        }
        else {
            element.textContent = textContent;
        }
    }
}
export function setNgReflectProperties(lView, element, type, dataValue, value) {
    if (type === 3 /* Element */ || type === 0 /* Container */) {
        /**
         * dataValue is an array containing runtime input or output names for the directives:
         * i+0: directive instance index
         * i+1: privateName
         *
         * e.g. [0, 'change', 'change-minified']
         * we want to set the reflected property with the privateName: dataValue[i+1]
         */
        for (let i = 0; i < dataValue.length; i += 2) {
            setNgReflectProperty(lView, element, type, dataValue[i + 1], value);
        }
    }
}
function validateProperty(tView, lView, element, propName, tNode) {
    // If `schemas` is set to `null`, that's an indication that this Component was compiled in AOT
    // mode where this check happens at compile time. In JIT mode, `schemas` is always present and
    // defined as an array (as an empty array in case `schemas` field is not defined) and we should
    // execute the check below.
    if (tView.schemas === null)
        return true;
    // The property is considered valid if the element matches the schema, it exists on the element
    // or it is synthetic, and we are in a browser context (web worker nodes should be skipped).
    if (matchingSchemas(tView, lView, tNode.tagName) || propName in element ||
        isAnimationProp(propName)) {
        return true;
    }
    // Note: `typeof Node` returns 'function' in most browsers, but on IE it is 'object' so we
    // need to account for both here, while being careful for `typeof null` also returning 'object'.
    return typeof Node === 'undefined' || Node === null || !(element instanceof Node);
}
export function matchingSchemas(tView, lView, tagName) {
    const schemas = tView.schemas;
    if (schemas !== null) {
        for (let i = 0; i < schemas.length; i++) {
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
 * Logs an error that a property is not supported on an element.
 * @param propName Name of the invalid property.
 * @param tNode Node on which we encountered the property.
 */
function logUnknownPropertyError(propName, tNode) {
    console.error(`Can't bind to '${propName}' since it isn't a known property of '${tNode.tagName}'.`);
}
/**
 * Instantiate a root component.
 */
export function instantiateRootComponent(tView, lView, def) {
    const rootTNode = getPreviousOrParentTNode();
    if (tView.firstCreatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        generateExpandoInstructionBlock(tView, rootTNode, 1);
        baseResolveDirective(tView, lView, def);
    }
    const directive = getNodeInjectable(lView, tView, lView.length - 1, rootTNode);
    attachPatchData(directive, lView);
    const native = getNativeByTNode(rootTNode, lView);
    if (native) {
        attachPatchData(native, lView);
    }
    return directive;
}
/**
 * Resolve the matched directives on a node.
 */
export function resolveDirectives(tView, lView, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in
    // tsickle.
    ngDevMode && assertFirstCreatePass(tView);
    let hasDirectives = false;
    if (getBindingsEnabled()) {
        const directiveDefs = findDirectiveDefMatches(tView, lView, tNode);
        const exportsMap = localRefs === null ? null : { '': -1 };
        if (directiveDefs !== null) {
            let totalDirectiveHostVars = 0;
            hasDirectives = true;
            initTNodeFlags(tNode, tView.data.length, directiveDefs.length);
            // When the same token is provided by several directives on the same node, some rules apply in
            // the viewEngine:
            // - viewProviders have priority over providers
            // - the last directive in NgModule.declarations has priority over the previous one
            // So to match these rules, the order in which providers are added in the arrays is very
            // important.
            for (let i = 0; i < directiveDefs.length; i++) {
                const def = directiveDefs[i];
                if (def.providersResolver)
                    def.providersResolver(def);
            }
            generateExpandoInstructionBlock(tView, tNode, directiveDefs.length);
            let preOrderHooksFound = false;
            let preOrderCheckHooksFound = false;
            for (let i = 0; i < directiveDefs.length; i++) {
                const def = directiveDefs[i];
                // Merge the attrs in the order of matches. This assumes that the first directive is the
                // component itself, so that the component has the least priority.
                tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);
                baseResolveDirective(tView, lView, def);
                saveNameToExportMap(tView.data.length - 1, def, exportsMap);
                if (def.contentQueries !== null)
                    tNode.flags |= 8 /* hasContentQuery */;
                if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0)
                    tNode.flags |= 128 /* hasHostBindings */;
                // Only push a node index into the preOrderHooks array if this is the first
                // pre-order hook found on this node.
                if (!preOrderHooksFound && (def.onChanges || def.onInit || def.doCheck)) {
                    // We will push the actual hook function into this array later during dir instantiation.
                    // We cannot do it now because we must ensure hooks are registered in the same
                    // order that directives are created (i.e. injection order).
                    (tView.preOrderHooks || (tView.preOrderHooks = [])).push(tNode.index - HEADER_OFFSET);
                    preOrderHooksFound = true;
                }
                if (!preOrderCheckHooksFound && (def.onChanges || def.doCheck)) {
                    (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = []))
                        .push(tNode.index - HEADER_OFFSET);
                    preOrderCheckHooksFound = true;
                }
                addHostBindingsToExpandoInstructions(tView, def);
                totalDirectiveHostVars += def.hostVars;
            }
            initializeInputAndOutputAliases(tView, tNode);
            growHostVarsSpace(tView, lView, totalDirectiveHostVars);
        }
        if (exportsMap)
            cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    }
    // Merge the template attrs last so that they have the highest priority.
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
    return hasDirectives;
}
/**
 * Add `hostBindings` to the `TView.expandoInstructions`.
 *
 * @param tView `TView` to which the `hostBindings` should be added.
 * @param def `ComponentDef`/`DirectiveDef`, which contains the `hostVars`/`hostBindings` to add.
 */
export function addHostBindingsToExpandoInstructions(tView, def) {
    ngDevMode && assertFirstCreatePass(tView);
    const expando = tView.expandoInstructions;
    // TODO(misko): PERF we are adding `hostBindings` even if there is nothing to add! This is
    // suboptimal for performance. `def.hostBindings` may be null,
    // but we still need to push null to the array as a placeholder
    // to ensure the directive counter is incremented (so host
    // binding functions always line up with the corrective directive).
    // This is suboptimal for performance. See `currentDirectiveIndex`
    //  comment in `setHostBindingsByExecutingExpandoInstructions` for more
    // details.  expando.push(def.hostBindings);
    expando.push(def.hostBindings);
    const hostVars = def.hostVars;
    if (hostVars !== 0) {
        expando.push(def.hostVars);
    }
}
/**
 * Grow the `LView`, blueprint and `TView.data` to accommodate the `hostBindings`.
 *
 * To support locality we don't know ahead of time how many `hostVars` of the containing directives
 * we need to allocate. For this reason we allow growing these data structures as we discover more
 * directives to accommodate them.
 *
 * @param tView `TView` which needs to be grown.
 * @param lView `LView` which needs to be grown.
 * @param count Size by which we need to grow the data structures.
 */
export function growHostVarsSpace(tView, lView, count) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertSame(tView, lView[TVIEW], '`LView` must be associated with `TView`!');
    for (let i = 0; i < count; i++) {
        lView.push(NO_CHANGE);
        tView.blueprint.push(NO_CHANGE);
        tView.data.push(null);
    }
}
/**
 * Instantiate all the directives that were previously resolved on the current node.
 */
function instantiateAllDirectives(tView, lView, tNode, native) {
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    if (!tView.firstCreatePass) {
        getOrCreateNodeInjectorForNode(tNode, lView);
    }
    attachPatchData(native, lView);
    const initialInputs = tNode.initialInputs;
    for (let i = start; i < end; i++) {
        const def = tView.data[i];
        const isComponent = isComponentDef(def);
        if (isComponent) {
            ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */);
            addComponentLogic(lView, tNode, def);
        }
        const directive = getNodeInjectable(lView, tView, i, tNode);
        attachPatchData(directive, lView);
        if (initialInputs !== null) {
            setInputsFromAttrs(lView, i - start, directive, def, tNode, initialInputs);
        }
        if (isComponent) {
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            componentView[CONTEXT] = directive;
        }
    }
}
function invokeDirectivesHostBindings(tView, lView, tNode) {
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const expando = tView.expandoInstructions;
    const firstCreatePass = tView.firstCreatePass;
    const elementIndex = tNode.index - HEADER_OFFSET;
    const currentDirectiveIndex = getCurrentDirectiveIndex();
    try {
        setSelectedIndex(elementIndex);
        for (let dirIndex = start; dirIndex < end; dirIndex++) {
            const def = tView.data[dirIndex];
            const directive = lView[dirIndex];
            setCurrentDirectiveIndex(dirIndex);
            if (def.hostBindings !== null || def.hostVars !== 0 || def.hostAttrs !== null) {
                invokeHostBindingsInCreationMode(def, directive);
            }
            else if (firstCreatePass) {
                expando.push(null);
            }
        }
    }
    finally {
        setSelectedIndex(-1);
        setCurrentDirectiveIndex(currentDirectiveIndex);
    }
}
/**
 * Invoke the host bindings in creation mode.
 *
 * @param def `DirectiveDef` which may contain the `hostBindings` function.
 * @param directive Instance of directive.
 */
export function invokeHostBindingsInCreationMode(def, directive) {
    if (def.hostBindings !== null) {
        def.hostBindings(1 /* Create */, directive);
    }
}
/**
 * Generates a new block in TView.expandoInstructions for this node.
 *
 * Each expando block starts with the element index (turned negative so we can distinguish
 * it from the hostVar count) and the directive count. See more in VIEW_DATA.md.
 */
export function generateExpandoInstructionBlock(tView, tNode, directiveCount) {
    ngDevMode &&
        assertEqual(tView.firstCreatePass, true, 'Expando block should only be generated on first create pass.');
    // Important: In JS `-x` and `0-x` is not the same! If `x===0` then `-x` will produce `-0` which
    // requires non standard math arithmetic and it can prevent VM optimizations.
    // `0-0` will always produce `0` and will not cause a potential deoptimization in VM.
    const elementIndex = HEADER_OFFSET - tNode.index;
    const providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    const providerCount = tView.data.length - providerStartIndex;
    (tView.expandoInstructions || (tView.expandoInstructions = []))
        .push(elementIndex, providerCount, directiveCount);
}
/**
 * Matches the current node against all available selectors.
 * If a component is matched (at most one), it is returned in first position in the array.
 */
function findDirectiveDefMatches(tView, viewData, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode &&
        assertNodeOfPossibleTypes(tNode, 3 /* Element */, 4 /* ElementContainer */, 0 /* Container */);
    const registry = tView.directiveRegistry;
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors, /* isProjectionMode */ false)) {
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
 */
export function markAsComponentHost(tView, hostTNode) {
    ngDevMode && assertFirstCreatePass(tView);
    hostTNode.flags |= 2 /* isComponentHost */;
    (tView.components || (tView.components = ngDevMode ? new TViewComponents() : []))
        .push(hostTNode.index);
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        const localNames = tNode.localNames = ngDevMode ? new TNodeLocalNames() : [];
        // Local names must be stored in tNode in the same order that localRefs are defined
        // in the template to ensure the data is loaded in the same slots as their refs
        // in the template (for template queries).
        for (let i = 0; i < localRefs.length; i += 2) {
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
 */
function saveNameToExportMap(index, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs) {
            for (let i = 0; i < def.exportAs.length; i++) {
                exportsMap[def.exportAs[i]] = index;
            }
        }
        if (isComponentDef(def))
            exportsMap[''] = index;
    }
}
/**
 * Initializes the flags on the current node, setting all indices to the initial index,
 * the directive count to 0, and adding the isComponent flag.
 * @param index the initial index
 */
export function initTNodeFlags(tNode, index, numberOfDirectives) {
    ngDevMode &&
        assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    tNode.flags |= 1 /* isDirectiveHost */;
    // When the first directive is created on a node, save the index
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
    tNode.providerIndexes = index;
}
function baseResolveDirective(tView, viewData, def) {
    tView.data.push(def);
    const directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
function addComponentLogic(lView, hostTNode, def) {
    const native = getNativeByTNode(hostTNode, lView);
    const tView = getOrCreateTComponentView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const rendererFactory = lView[RENDERER_FACTORY];
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, native, hostTNode, rendererFactory, rendererFactory.createRenderer(native, def)));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[hostTNode.index] = componentView;
}
export function elementAttributeInternal(tNode, lView, name, value, sanitizer, namespace) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && validateAgainstEventAttributes(name);
    const element = getNativeByTNode(tNode, lView);
    const renderer = lView[RENDERER];
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
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
 * @param lView Current LView that is being processed.
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param def The directive def that contains the list of inputs
 * @param tNode The static data for this node
 */
function setInputsFromAttrs(lView, directiveIndex, instance, def, tNode, initialInputData) {
    const initialInputs = initialInputData[directiveIndex];
    if (initialInputs !== null) {
        const setInput = def.setInput;
        for (let i = 0; i < initialInputs.length;) {
            const publicName = initialInputs[i++];
            const privateName = initialInputs[i++];
            const value = initialInputs[i++];
            if (setInput !== null) {
                def.setInput(instance, value, publicName, privateName);
            }
            else {
                instance[privateName] = value;
            }
            if (ngDevMode) {
                const nativeElement = getNativeByTNode(tNode, lView);
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
 * @param inputs The list of inputs from the directive def
 * @param attrs The static attrs on this node
 */
function generateInitialInputs(inputs, attrs) {
    let inputsToStore = null;
    let i = 0;
    while (i < attrs.length) {
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
        if (inputs.hasOwnProperty(attrName)) {
            if (inputsToStore === null)
                inputsToStore = [];
            inputsToStore.push(attrName, inputs[attrName], attrs[i + 1]);
        }
        i += 2;
    }
    return inputsToStore;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
// Not sure why I need to do `any` here but TS complains later.
const LContainerArray = ((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode()) &&
    createNamedArrayType('LContainer');
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
export function createLContainer(hostNative, currentView, native, tNode) {
    ngDevMode && assertLView(currentView);
    ngDevMode && !isProceduralRenderer(currentView[RENDERER]) && assertDomNode(native);
    // https://jsperf.com/array-literal-vs-new-array-really
    const lContainer = new (ngDevMode ? LContainerArray : Array)(hostNative, // host native
    true, // Boolean `true` in this position signifies that this is an `LContainer`
    false, // has transplanted views
    currentView, // parent
    null, // next
    0, // transplanted views to refresh count
    tNode, // t_host
    native, // native,
    null, // view refs
    null);
    ngDevMode &&
        assertEqual(lContainer.length, CONTAINER_HEADER_OFFSET, 'Should allocate correct number of slots for LContainer header.');
    ngDevMode && attachLContainerDebug(lContainer);
    return lContainer;
}
/**
 * Goes over embedded views (ones created through ViewContainerRef APIs) and refreshes
 * them by executing an associated template function.
 */
function refreshEmbeddedViews(lView) {
    for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
        for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
            const embeddedLView = lContainer[i];
            const embeddedTView = embeddedLView[TVIEW];
            ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
            if (viewAttachedToChangeDetector(embeddedLView)) {
                refreshView(embeddedTView, embeddedLView, embeddedTView.template, embeddedLView[CONTEXT]);
            }
        }
    }
}
/**
 * Mark transplanted views as needing to be refreshed at their insertion points.
 *
 * @param lView The `LView` that may have transplanted views.
 */
function markTransplantedViewsForRefresh(lView) {
    for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
        if (!lContainer[HAS_TRANSPLANTED_VIEWS])
            continue;
        const movedViews = lContainer[MOVED_VIEWS];
        ngDevMode && assertDefined(movedViews, 'Transplanted View flags set but missing MOVED_VIEWS');
        for (let i = 0; i < movedViews.length; i++) {
            const movedLView = movedViews[i];
            const insertionLContainer = movedLView[PARENT];
            ngDevMode && assertLContainer(insertionLContainer);
            // We don't want to increment the counter if the moved LView was already marked for
            // refresh.
            if ((movedLView[FLAGS] & 1024 /* RefreshTransplantedView */) === 0) {
                updateTransplantedViewCount(insertionLContainer, 1);
            }
            // Note, it is possible that the `movedViews` is tracking views that are transplanted *and*
            // those that aren't (declaration component === insertion component). In the latter case,
            // it's fine to add the flag, as we will clear it immediately in
            // `refreshEmbeddedViews` for the view currently being refreshed.
            movedLView[FLAGS] |= 1024 /* RefreshTransplantedView */;
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param componentHostIdx  Element index in LView[] (adjusted for HEADER_OFFSET)
 */
function refreshComponent(hostLView, componentHostIdx) {
    ngDevMode && assertEqual(isCreationMode(hostLView), false, 'Should be run in update mode');
    const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
    // Only attached components that are CheckAlways or OnPush and dirty should be refreshed
    if (viewAttachedToChangeDetector(componentView)) {
        const tView = componentView[TVIEW];
        if (componentView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
            refreshView(tView, componentView, tView.template, componentView[CONTEXT]);
        }
        else if (componentView[TRANSPLANTED_VIEWS_TO_REFRESH] > 0) {
            // Only attached components that are CheckAlways or OnPush and dirty should be refreshed
            refreshContainsDirtyView(componentView);
        }
    }
}
/**
 * Refreshes all transplanted views marked with `LViewFlags.RefreshTransplantedView` that are
 * children or descendants of the given lView.
 *
 * @param lView The lView which contains descendant transplanted views that need to be refreshed.
 */
function refreshContainsDirtyView(lView) {
    for (let lContainer = getFirstLContainer(lView); lContainer !== null; lContainer = getNextLContainer(lContainer)) {
        for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
            const embeddedLView = lContainer[i];
            if (embeddedLView[FLAGS] & 1024 /* RefreshTransplantedView */) {
                const embeddedTView = embeddedLView[TVIEW];
                ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
                refreshView(embeddedTView, embeddedLView, embeddedTView.template, embeddedLView[CONTEXT]);
            }
            else if (embeddedLView[TRANSPLANTED_VIEWS_TO_REFRESH] > 0) {
                refreshContainsDirtyView(embeddedLView);
            }
        }
    }
    const tView = lView[TVIEW];
    // Refresh child component views.
    const components = tView.components;
    if (components !== null) {
        for (let i = 0; i < components.length; i++) {
            const componentView = getComponentLViewByIndex(components[i], lView);
            // Only attached components that are CheckAlways or OnPush and dirty should be refreshed
            if (viewAttachedToChangeDetector(componentView) &&
                componentView[TRANSPLANTED_VIEWS_TO_REFRESH] > 0) {
                refreshContainsDirtyView(componentView);
            }
        }
    }
}
function renderComponent(hostLView, componentHostIdx) {
    ngDevMode && assertEqual(isCreationMode(hostLView), true, 'Should be run in creation mode');
    const componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
    const componentTView = componentView[TVIEW];
    syncViewWithBlueprint(componentTView, componentView);
    renderView(componentTView, componentView, componentView[CONTEXT]);
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
 * @param tView The `TView` that contains the blueprint for syncing
 * @param lView The view to sync
 */
function syncViewWithBlueprint(tView, lView) {
    for (let i = lView.length; i < tView.blueprint.length; i++) {
        lView.push(tView.blueprint[i]);
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
    // to the end of the queue, which means if the developer retrieves the LContainers from RNodes out
    // of order, the change detection will run out of order, as the act of retrieving the the
    // LContainer from the RNode is what adds it to the queue.
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
        const parent = getLViewParent(lView);
        // Stop traversing up as soon as you find a root view that wasn't attached to any container
        if (isRootView(lView) && !parent) {
            return lView;
        }
        // continue otherwise
        lView = parent;
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
    const nothingScheduled = rootContext.flags === 0 /* Empty */;
    rootContext.flags |= flags;
    if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
        let res;
        rootContext.clean = new Promise((r) => res = r);
        rootContext.scheduler(() => {
            if (rootContext.flags & 1 /* DetectChanges */) {
                rootContext.flags &= ~1 /* DetectChanges */;
                tickRootContext(rootContext);
            }
            if (rootContext.flags & 2 /* FlushPlayers */) {
                rootContext.flags &= ~2 /* FlushPlayers */;
                const playerHandler = rootContext.playerHandler;
                if (playerHandler) {
                    playerHandler.flushPlayers();
                }
            }
            rootContext.clean = _CLEAN_PROMISE;
            res(null);
        });
    }
}
export function tickRootContext(rootContext) {
    for (let i = 0; i < rootContext.components.length; i++) {
        const rootComponent = rootContext.components[i];
        const lView = readPatchedLView(rootComponent);
        const tView = lView[TVIEW];
        renderComponentOrTemplate(tView, lView, tView.template, rootComponent);
    }
}
export function detectChangesInternal(tView, lView, context) {
    const rendererFactory = lView[RENDERER_FACTORY];
    if (rendererFactory.begin)
        rendererFactory.begin();
    try {
        refreshView(tView, lView, tView.template, context);
    }
    catch (error) {
        handleError(lView, error);
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
export function checkNoChangesInternal(tView, view, context) {
    setCheckNoChangesMode(true);
    try {
        detectChangesInternal(tView, view, context);
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
 * @param tData `TData` where meta-data will be saved;
 * @param tNode `TNode` that is a target of the binding;
 * @param propertyName bound property name;
 * @param bindingIndex binding index in `LView`
 * @param interpolationParts static interpolation parts (for property interpolations)
 */
export function storePropertyBindingMetadata(tData, tNode, propertyName, bindingIndex, ...interpolationParts) {
    // Binding meta-data are stored only the first time a given property instruction is processed.
    // Since we don't have a concept of the "first update pass" we need to check for presence of the
    // binding meta-data to decide if one should be stored (or if was stored already).
    if (tData[bindingIndex] === null) {
        if (tNode.inputs == null || !tNode.inputs[propertyName]) {
            const propBindingIdxs = tNode.propertyBindings || (tNode.propertyBindings = []);
            propBindingIdxs.push(bindingIndex);
            let bindingMetadata = propertyName;
            if (interpolationParts.length > 0) {
                bindingMetadata +=
                    INTERPOLATION_DELIMITER + interpolationParts.join(INTERPOLATION_DELIMITER);
            }
            tData[bindingIndex] = bindingMetadata;
        }
    }
}
export const CLEAN_PROMISE = _CLEAN_PROMISE;
export function getLCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = ngDevMode ? new LCleanup() : []);
}
function getTViewCleanup(tView) {
    return tView.cleanup || (tView.cleanup = ngDevMode ? new TCleanup() : []);
}
/**
 * There are cases where the sub component's renderer needs to be included
 * instead of the current renderer (see the componentSyntheticHost* instructions).
 */
export function loadComponentRenderer(currentDef, tNode, lView) {
    // TODO(FW-2043): the `currentDef` is null when host bindings are invoked while creating root
    // component (see packages/core/src/render3/component.ts). This is not consistent with the process
    // of creating inner components, when current directive index is available in the state. In order
    // to avoid relying on current def being `null` (thus special-casing root component creation), the
    // process of creating root component should be unified with the process of creating inner
    // components.
    if (currentDef === null || isComponentDef(currentDef)) {
        lView = unwrapLView(lView[tNode.index]);
    }
    return lView[RENDERER];
}
/** Handles an error thrown in an LView. */
export function handleError(lView, error) {
    const injector = lView[INJECTOR];
    const errorHandler = injector ? injector.get(ErrorHandler, null) : null;
    errorHandler && errorHandler.handleError(error);
}
/**
 * Set the inputs of directives at the current node to corresponding value.
 *
 * @param tView The current TView
 * @param lView the `LView` which contains the directives.
 * @param inputs mapping between the public "input" name and privately-known,
 *        possibly minified, property names to write to.
 * @param value Value to set.
 */
export function setInputsForProperty(tView, lView, inputs, publicName, value) {
    for (let i = 0; i < inputs.length;) {
        const index = inputs[i++];
        const privateName = inputs[i++];
        const instance = lView[index];
        ngDevMode && assertDataInRange(lView, index);
        const def = tView.data[index];
        if (def.setInput !== null) {
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
    const element = getNativeByIndex(index, lView);
    ngDevMode && assertDefined(element, 'native element should exist');
    ngDevMode && ngDevMode.rendererSetText++;
    const renderer = lView[RENDERER];
    isProceduralRenderer(renderer) ? renderer.setValue(element, value) : element.textContent = value;
}
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0osT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUYsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRWpILE9BQU8sRUFBQywwQkFBMEIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRXZGLE9BQU8sRUFBQyxvQkFBb0IsRUFBZ0UsTUFBTSx3QkFBd0IsQ0FBQztBQUUzSCxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBZ0IsVUFBVSxFQUFDLE1BQU0sMkJBQTJCLENBQUM7QUFDeEgsT0FBTyxFQUFDLFVBQVUsRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSwwQkFBMEIsRUFBRSxnQkFBZ0IsRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBa0IsUUFBUSxFQUFxQixJQUFJLEVBQUUsTUFBTSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBaUMsU0FBUyxFQUFFLE1BQU0sRUFBUyw2QkFBNkIsRUFBRSxLQUFLLEVBQW1CLE1BQU0sb0JBQW9CLENBQUM7QUFDOVYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekQsT0FBTyxFQUFDLGdCQUFnQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdEYsT0FBTyxFQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSw2QkFBNkIsRUFBRSxxQkFBcUIsRUFBRSx3QkFBd0IsRUFBRSxvQkFBb0IsRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMvVSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNuRyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLGdCQUFnQixFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWxPLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM5QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsOEJBQThCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO1dBUXRPLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBSm5EOzs7R0FHRztBQUNILE1BQU0sY0FBYyxHQUFHLElBQTZCLEVBQUUsQ0FBQztBQUV2RDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSw2Q0FBNkMsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN0RixTQUFTLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsNkNBQTZDLENBQUMsQ0FBQztJQUM1RixJQUFJO1FBQ0YsTUFBTSxtQkFBbUIsR0FBRyxLQUFLLENBQUMsbUJBQW1CLENBQUM7UUFDdEQsSUFBSSxtQkFBbUIsS0FBSyxJQUFJLEVBQUU7WUFDaEMsSUFBSSxnQkFBZ0IsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7WUFDL0MsSUFBSSxxQkFBcUIsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMvQixJQUFJLG1CQUFtQixHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzdCLDhGQUE4RjtZQUM5RiwyRkFBMkY7WUFDM0Ysb0NBQW9DO1lBQ3BDLDZEQUE2RDtZQUM3RCw0RkFBNEY7WUFDNUYsOEZBQThGO1lBQzlGLG1DQUFtQztZQUNuQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsbUJBQW1CLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUNuRCxNQUFNLFdBQVcsR0FBRyxtQkFBbUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDM0MsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7b0JBQ25DLElBQUksV0FBVyxJQUFJLENBQUMsRUFBRTt3QkFDcEIsa0ZBQWtGO3dCQUNsRiwyQ0FBMkM7d0JBQzNDLHFGQUFxRjt3QkFDckYsd0ZBQXdGO3dCQUN4RixxRkFBcUY7d0JBQ3JGLHFGQUFxRjt3QkFDckYsa0RBQWtEO3dCQUNsRCxtQkFBbUIsR0FBRyxDQUFDLEdBQUcsV0FBVyxDQUFDO3dCQUN0QyxnQkFBZ0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO3dCQUV0Qyx1REFBdUQ7d0JBQ3ZELE1BQU0sYUFBYSxHQUFJLG1CQUFtQixDQUFDLEVBQUUsQ0FBQyxDQUFZLENBQUM7d0JBQzNELGdCQUFnQixJQUFJLDBCQUEwQixHQUFHLGFBQWEsQ0FBQzt3QkFFL0QscUJBQXFCLEdBQUcsZ0JBQWdCLENBQUM7cUJBQzFDO3lCQUFNO3dCQUNMLGlGQUFpRjt3QkFDakYsZ0ZBQWdGO3dCQUNoRiwwREFBMEQ7d0JBQzFELGdCQUFnQixJQUFJLFdBQVcsQ0FBQztxQkFDakM7aUJBQ0Y7cUJBQU07b0JBQ0wsZ0ZBQWdGO29CQUNoRixJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7d0JBQ3hCLDZCQUE2QixDQUFDLGdCQUFnQixFQUFFLHFCQUFxQixDQUFDLENBQUM7d0JBQ3ZFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3dCQUM3QyxXQUFXLGlCQUFxQixPQUFPLENBQUMsQ0FBQztxQkFDMUM7b0JBQ0QsZ0ZBQWdGO29CQUNoRix5RkFBeUY7b0JBQ3pGLHNGQUFzRjtvQkFDdEYscUVBQXFFO29CQUNyRSxzRkFBc0Y7b0JBQ3RGLG9FQUFvRTtvQkFDcEUscUJBQXFCLEVBQUUsQ0FBQztpQkFDekI7YUFDRjtTQUNGO0tBQ0Y7WUFBUztRQUNSLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdEI7QUFDSCxDQUFDO0FBRUQsMkVBQTJFO0FBQzNFLFNBQVMscUJBQXFCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDdkQsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUM1QyxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7UUFDM0IsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUNqRCxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDeEMsTUFBTSxlQUFlLEdBQUcsY0FBYyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM5QyxJQUFJLGVBQWUsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDMUIsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQXNCLENBQUM7Z0JBQ3RFLFNBQVM7b0JBQ0wsYUFBYSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztnQkFDNUYsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7Z0JBQ3BDLFlBQVksQ0FBQyxjQUFlLGlCQUFxQixLQUFLLENBQUMsZUFBZSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7YUFDM0Y7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVELG9FQUFvRTtBQUNwRSxTQUFTLHNCQUFzQixDQUFDLFNBQWdCLEVBQUUsVUFBb0I7SUFDcEUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzVDO0FBQ0gsQ0FBQztBQUVELG9FQUFvRTtBQUNwRSxTQUFTLHFCQUFxQixDQUFDLFNBQWdCLEVBQUUsVUFBb0I7SUFDbkUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUMzQztBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQUMsSUFBWSxFQUFFLFFBQW1CLEVBQUUsU0FBc0I7SUFDckYsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUNsQyxPQUFPLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ2hEO1NBQU07UUFDTCxPQUFPLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztZQUM5QixRQUFRLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUN2RTtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixXQUF1QixFQUFFLEtBQVksRUFBRSxPQUFlLEVBQUUsS0FBaUIsRUFBRSxJQUFtQixFQUM5RixTQUFzQyxFQUFFLGVBQXVDLEVBQy9FLFFBQXlCLEVBQUUsU0FBMEIsRUFBRSxRQUF3QjtJQUNqRixNQUFNLEtBQUssR0FDUCxTQUFTLENBQUMsQ0FBQyxDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBVyxDQUFDO0lBQ3pGLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssdUJBQTBCLHFCQUFzQix5QkFBNEIsQ0FBQztJQUNqRyxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsV0FBVyxDQUFDO0lBQ3RELEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxPQUFPLENBQUM7SUFDekIsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxlQUFlLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFFLENBQUM7SUFDN0YsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25GLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFFBQVEsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFFLENBQUM7SUFDdEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztJQUNwRSxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsU0FBUyxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsU0FBUyxDQUFDLElBQUksSUFBSyxDQUFDO0lBQy9FLEtBQUssQ0FBQyxRQUFlLENBQUMsR0FBRyxRQUFRLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDbEYsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUMxQixTQUFTO1FBQ0wsV0FBVyxDQUNQLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDLENBQUMsQ0FBQyxXQUFXLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUNwRSxzQ0FBc0MsQ0FBQyxDQUFDO0lBQ2hELEtBQUssQ0FBQywwQkFBMEIsQ0FBQztRQUM3QixLQUFLLENBQUMsSUFBSSxvQkFBc0IsQ0FBQyxDQUFDLENBQUMsV0FBWSxDQUFDLDBCQUEwQixDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUN4RixTQUFTLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBK0JELE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsS0FBWSxFQUFFLFNBQXFCLEVBQUUsS0FBYSxFQUFFLElBQWUsRUFBRSxJQUFpQixFQUN0RixLQUF1QjtJQUV6QiwyREFBMkQ7SUFDM0QsTUFBTSxhQUFhLEdBQUcsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUM1QyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBVTtRQUM1QyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLHdCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxPQUFPLEtBQ2dDLENBQUM7QUFDMUMsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQ3ZCLEtBQVksRUFBRSxTQUFxQixFQUFFLGFBQXFCLEVBQUUsSUFBZSxFQUFFLElBQWlCLEVBQzlGLEtBQXVCO0lBQ3pCLE1BQU0scUJBQXFCLEdBQUcsd0JBQXdCLEVBQUUsQ0FBQztJQUN6RCxNQUFNLFFBQVEsR0FBRyxXQUFXLEVBQUUsQ0FBQztJQUMvQixNQUFNLE1BQU0sR0FDUixRQUFRLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxxQkFBcUIsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNLENBQUM7SUFDN0YsZ0dBQWdHO0lBQ2hHLDRDQUE0QztJQUM1QyxNQUFNLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxNQUFNLEtBQUssU0FBUyxDQUFDO0lBQ3hELE1BQU0sV0FBVyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxNQUF1QyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDdEYsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUM7UUFDbkMsV0FBVyxDQUFDLEtBQUssRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdEUsaUdBQWlHO0lBQ2pHLGlHQUFpRztJQUNqRywwREFBMEQ7SUFDMUQsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLElBQUksRUFBRTtRQUM3QixLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztLQUMxQjtJQUNELElBQUkscUJBQXFCLEVBQUU7UUFDekIsSUFBSSxRQUFRLElBQUkscUJBQXFCLENBQUMsS0FBSyxJQUFJLElBQUk7WUFDL0MsQ0FBQyxLQUFLLENBQUMsTUFBTSxLQUFLLElBQUksSUFBSSxxQkFBcUIsQ0FBQyxJQUFJLGlCQUFtQixDQUFDLEVBQUU7WUFDNUUsc0ZBQXNGO1lBQ3RGLHFCQUFxQixDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7U0FDckM7YUFBTSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ3BCLHFCQUFxQixDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7U0FDcEM7S0FDRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsS0FBWSxFQUFFLFdBQXVCLEVBQUUsS0FBYSxFQUFFLEtBQVk7SUFDcEUsMEZBQTBGO0lBQzFGLGlGQUFpRjtJQUNqRixJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBQ3ZCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtRQUNqQixTQUFTLElBQUksV0FBVztZQUNwQix5QkFBeUIsQ0FBQyxXQUFXLHFDQUF5QyxDQUFDO1FBQ25GLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxHQUFHLFdBQVcsQ0FDUCxLQUFLLEVBQ0wsV0FBbUQsRUFBRyxFQUFFO3NCQUN4QyxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBYyxDQUFDO0tBQzFFO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQWtCLENBQUM7QUFDckMsQ0FBQztBQUdEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLGVBQXVCO0lBQzlFLFNBQVM7UUFDTCxpQkFBaUIsQ0FDYixlQUFlLEVBQUUsQ0FBQyxFQUFFLHVEQUF1RCxDQUFDLENBQUM7SUFDckYsSUFBSSxlQUFlLEdBQUcsQ0FBQyxFQUFFO1FBQ3ZCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN4QyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDM0IsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBQ3RCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDbEI7WUFFRCxzRkFBc0Y7WUFDdEYsK0NBQStDO1lBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7Z0JBQzlCLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxlQUFlLENBQUM7YUFDNUM7aUJBQU07Z0JBQ0wseUZBQXlGO2dCQUN6Riw4Q0FBOEM7Z0JBQzlDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDakQ7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUdELDBCQUEwQjtBQUMxQixXQUFXO0FBQ1gsMEJBQTBCO0FBRTFCOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSxVQUFVLENBQUksS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFVO0lBQ2xFLFNBQVMsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLElBQUksRUFBRSxnQ0FBZ0MsQ0FBQyxDQUFDO0lBQ3hGLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDaEMsSUFBSTtRQUNGLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDbEMsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLGtCQUFrQixpQkFBcUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVEO1FBRUQsK0ZBQStGO1FBQy9GLHdDQUF3QztRQUN4QyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2xDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLGtCQUFzQixPQUFPLENBQUMsQ0FBQztTQUN4RTtRQUVELHNGQUFzRjtRQUN0RixtRkFBbUY7UUFDbkYsdUZBQXVGO1FBQ3ZGLGlGQUFpRjtRQUNqRixpQ0FBaUM7UUFDakMsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1lBQ3pCLEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1NBQy9CO1FBRUQsdUZBQXVGO1FBQ3ZGLDBGQUEwRjtRQUMxRix5Q0FBeUM7UUFDekMsSUFBSSxLQUFLLENBQUMsb0JBQW9CLEVBQUU7WUFDOUIscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsMEVBQTBFO1FBQzFFLDRFQUE0RTtRQUM1RSx5RUFBeUU7UUFDekUsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7WUFDM0Isa0JBQWtCLGlCQUFxQixLQUFLLENBQUMsU0FBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ25FO1FBRUQsZ0NBQWdDO1FBQ2hDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDcEMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1lBQ3ZCLHFCQUFxQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztTQUMxQztLQUVGO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxpRUFBaUU7UUFDakUsaUVBQWlFO1FBQ2pFLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6QixLQUFLLENBQUMsbUJBQW1CLEdBQUcsSUFBSSxDQUFDO1NBQ2xDO1FBRUQsTUFBTSxLQUFLLENBQUM7S0FDYjtZQUFTO1FBQ1IsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLHFCQUF3QixDQUFDO1FBQ3pDLFNBQVMsRUFBRSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3ZCLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBc0MsRUFBRSxPQUFVO0lBQ2hGLFNBQVMsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ3ZGLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMzQixJQUFJLENBQUMsS0FBSyxzQkFBdUIsQ0FBQyx3QkFBeUI7UUFBRSxPQUFPO0lBQ3BFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDaEMsTUFBTSxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRSxDQUFDO0lBQ25ELElBQUk7UUFDRixzQkFBc0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU5QixlQUFlLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDekMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1lBQ3ZCLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsa0JBQXNCLE9BQU8sQ0FBQyxDQUFDO1NBQ3hFO1FBRUQsTUFBTSx1QkFBdUIsR0FDekIsQ0FBQyxLQUFLLDZCQUFnQyxDQUFDLCtCQUFzQyxDQUFDO1FBRWxGLHVEQUF1RDtRQUN2RCxzRkFBc0Y7UUFDdEYsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1lBQ3ZCLElBQUksdUJBQXVCLEVBQUU7Z0JBQzNCLE1BQU0sa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixDQUFDO2dCQUNwRCxJQUFJLGtCQUFrQixLQUFLLElBQUksRUFBRTtvQkFDL0IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFLElBQUksQ0FBQyxDQUFDO2lCQUNwRDthQUNGO2lCQUFNO2dCQUNMLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7Z0JBQzFDLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtvQkFDMUIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLGFBQWEsOEJBQXFDLElBQUksQ0FBQyxDQUFDO2lCQUN6RjtnQkFDRCx1QkFBdUIsQ0FBQyxLQUFLLDZCQUFvQyxDQUFDO2FBQ25FO1NBQ0Y7UUFFRCw4RkFBOEY7UUFDOUYsZ0dBQWdHO1FBQ2hHLHFFQUFxRTtRQUNyRSwrQkFBK0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN2QyxvQkFBb0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUU1QiwyRUFBMkU7UUFDM0UsSUFBSSxLQUFLLENBQUMsY0FBYyxLQUFLLElBQUksRUFBRTtZQUNqQyxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDckM7UUFFRCxnRUFBZ0U7UUFDaEUsc0ZBQXNGO1FBQ3RGLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QixJQUFJLHVCQUF1QixFQUFFO2dCQUMzQixNQUFNLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztnQkFDbEQsSUFBSSxpQkFBaUIsS0FBSyxJQUFJLEVBQUU7b0JBQzlCLGlCQUFpQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO2lCQUM3QzthQUNGO2lCQUFNO2dCQUNMLE1BQU0sWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7Z0JBQ3hDLElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtvQkFDekIsd0JBQXdCLENBQ3BCLEtBQUssRUFBRSxZQUFZLHVDQUE4QyxDQUFDO2lCQUN2RTtnQkFDRCx1QkFBdUIsQ0FBQyxLQUFLLHVDQUE4QyxDQUFDO2FBQzdFO1NBQ0Y7UUFFRCw2Q0FBNkMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFNUQsaUNBQWlDO1FBQ2pDLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7UUFDcEMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1lBQ3ZCLHNCQUFzQixDQUFDLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztTQUMzQztRQUVELDhGQUE4RjtRQUM5Riw0RkFBNEY7UUFDNUYsbURBQW1EO1FBQ25ELE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7UUFDbEMsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO1lBQ3RCLGtCQUFrQixpQkFBcUIsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQzVEO1FBRUQsdURBQXVEO1FBQ3ZELHNGQUFzRjtRQUN0RixJQUFJLENBQUMsa0JBQWtCLEVBQUU7WUFDdkIsSUFBSSx1QkFBdUIsRUFBRTtnQkFDM0IsTUFBTSxjQUFjLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztnQkFDNUMsSUFBSSxjQUFjLEtBQUssSUFBSSxFQUFFO29CQUMzQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7aUJBQzFDO2FBQ0Y7aUJBQU07Z0JBQ0wsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztnQkFDbEMsSUFBSSxTQUFTLEtBQUssSUFBSSxFQUFFO29CQUN0Qix3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxvQ0FBMkMsQ0FBQztpQkFDdEY7Z0JBQ0QsdUJBQXVCLENBQUMsS0FBSyxvQ0FBMkMsQ0FBQzthQUMxRTtTQUNGO1FBQ0QsSUFBSSxLQUFLLENBQUMsZUFBZSxLQUFLLElBQUksRUFBRTtZQUNsQyxtRkFBbUY7WUFDbkYsb0NBQW9DO1lBQ3BDLDJGQUEyRjtZQUMzRiwwRkFBMEY7WUFDMUYsOEZBQThGO1lBQzlGLHlFQUF5RTtZQUN6RSxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELCtGQUErRjtRQUMvRiw4RkFBOEY7UUFDOUYsMEZBQTBGO1FBQzFGLDBGQUEwRjtRQUMxRiw2RkFBNkY7UUFDN0YsZ0ZBQWdGO1FBQ2hGLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtZQUN2QixLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLHVDQUE0QyxDQUFDLENBQUM7U0FDakU7UUFDRCxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUU7WUFDckQsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLG1DQUFtQyxDQUFDO1lBQ3BELDJCQUEyQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQzlEO0tBQ0Y7WUFBUztRQUNSLFNBQVMsRUFBRSxDQUFDO0tBQ2I7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxLQUFZLEVBQUUsS0FBWSxFQUFFLFVBQXNDLEVBQUUsT0FBVTtJQUNoRixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNoRCxNQUFNLG1CQUFtQixHQUFHLENBQUMscUJBQXFCLEVBQUUsQ0FBQztJQUNyRCxNQUFNLG9CQUFvQixHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRCxJQUFJO1FBQ0YsSUFBSSxtQkFBbUIsSUFBSSxDQUFDLG9CQUFvQixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUU7WUFDekUsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3pCO1FBQ0QsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixVQUFVLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNuQztRQUNELFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoRDtZQUFTO1FBQ1IsSUFBSSxtQkFBbUIsSUFBSSxDQUFDLG9CQUFvQixJQUFJLGVBQWUsQ0FBQyxHQUFHLEVBQUU7WUFDdkUsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ3ZCO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQ3BCLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBZ0MsRUFBRSxFQUFlLEVBQUUsT0FBVTtJQUMzRixNQUFNLGlCQUFpQixHQUFHLGdCQUFnQixFQUFFLENBQUM7SUFDN0MsSUFBSTtRQUNGLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsSUFBSSxFQUFFLGlCQUFxQixJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFO1lBQzNELHVEQUF1RDtZQUN2RCw0REFBNEQ7WUFDNUQsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUscUJBQXFCLEVBQUUsQ0FBQyxDQUFDO1NBQy9EO1FBQ0QsVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN6QjtZQUFTO1FBQ1IsZ0JBQWdCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7QUFFRCwwQkFBMEI7QUFDMUIsWUFBWTtBQUNaLDBCQUEwQjtBQUUxQixNQUFNLFVBQVUscUJBQXFCLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZO0lBQzVFLElBQUksa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDN0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztRQUNuQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO1FBQy9CLEtBQUssSUFBSSxjQUFjLEdBQUcsS0FBSyxFQUFFLGNBQWMsR0FBRyxHQUFHLEVBQUUsY0FBYyxFQUFFLEVBQUU7WUFDdkUsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQXNCLENBQUM7WUFDNUQsSUFBSSxHQUFHLENBQUMsY0FBYyxFQUFFO2dCQUN0QixHQUFHLENBQUMsY0FBYyxpQkFBcUIsS0FBSyxDQUFDLGNBQWMsQ0FBQyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQy9FO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFHRDs7R0FFRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXlCO0lBQzdGLElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUFFLE9BQU87SUFDbEMsd0JBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFDOUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLDRCQUE2QixDQUFDLDhCQUErQixFQUFFO1FBQzdFLDRCQUE0QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDbkQ7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxRQUFlLEVBQUUsS0FBeUIsRUFDMUMsb0JBQXVDLGdCQUFnQjtJQUN6RCxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixJQUFJLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQztRQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzdDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLENBQUM7WUFDMUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hCLGlCQUFpQixDQUNiLEtBQThELEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDL0UsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3BCLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUNoQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxHQUFzQjtJQUM5RCxNQUFNLEtBQUssR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDO0lBRXhCLG9GQUFvRjtJQUNwRixvRkFBb0Y7SUFDcEYsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssQ0FBQyxtQkFBbUIsRUFBRTtRQUMvQyxPQUFPLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxvQkFDRSxDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsYUFBYSxFQUM3RSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7S0FDbEU7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFHRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3ZCLElBQWUsRUFBRSxTQUFpQixFQUFFLFVBQXVDLEVBQUUsS0FBYSxFQUMxRixJQUFZLEVBQUUsVUFBMEMsRUFBRSxLQUFnQyxFQUMxRixTQUF3QyxFQUFFLE9BQThCLEVBQ3hFLE1BQXVCO0lBQ3pCLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQ2hELDhGQUE4RjtJQUM5RixnR0FBZ0c7SUFDaEcsd0ZBQXdGO0lBQ3hGLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ25ELE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDNUUsT0FBTyxTQUFTLENBQUMsS0FBWSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDeEMsSUFBSSxnQkFBZ0IsQ0FDYixJQUFJLEVBQ0osU0FBUyxFQUFJLGNBQWM7UUFDM0IsU0FBUyxFQUFJLG9CQUFvQjtRQUNqQyxVQUFVLEVBQUcsd0NBQXdDO1FBQ3JELElBQUksRUFBUyx5QkFBeUI7UUFDdEMsU0FBUyxFQUFJLDJDQUEyQztRQUN4RCxJQUFLLEVBQVEscUNBQXFDO1FBQ2xELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsRUFBRyxlQUFlO1FBQzNFLGlCQUFpQixFQUFHLDZCQUE2QjtRQUNqRCxpQkFBaUIsRUFBRyw2QkFBNkI7UUFDakQsSUFBSSxFQUFnQixpREFBaUQ7UUFDckUsSUFBSSxFQUFnQiw0QkFBNEI7UUFDaEQsSUFBSSxFQUFnQiw0QkFBNEI7UUFDaEQsS0FBSyxFQUFlLDhCQUE4QjtRQUNsRCxLQUFLLEVBQWUsaUNBQWlDO1FBQ3JELElBQUksRUFBZ0IsZ0NBQWdDO1FBQ3BELElBQUksRUFBZ0IscUNBQXFDO1FBQ3pELElBQUksRUFBZ0IsK0JBQStCO1FBQ25ELElBQUksRUFBZ0Isb0NBQW9DO1FBQ3hELElBQUksRUFBZ0IsNEJBQTRCO1FBQ2hELElBQUksRUFBZ0IsaUNBQWlDO1FBQ3JELElBQUksRUFBZ0Isc0NBQXNDO1FBQzFELElBQUksRUFBZ0IsdUJBQXVCO1FBQzNDLElBQUksRUFBZ0IsaUNBQWlDO1FBQ3JELElBQUksRUFBZ0IsNkJBQTZCO1FBQ2pELE9BQU8sVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDO1lBQzlCLFVBQVUsRUFBRSxDQUFDLENBQUM7WUFDZCxVQUFVLEVBQUcsNENBQTRDO1FBQzdELE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRyxrQ0FBa0M7UUFDbEYsSUFBSSxFQUE0QywwQkFBMEI7UUFDMUUsT0FBTyxFQUF5QyxrQ0FBa0M7UUFDbEYsTUFBTSxFQUEwQywwQkFBMEI7UUFDMUUsS0FBSyxDQUEyQywrQkFBK0I7U0FDOUUsQ0FBQyxDQUFDO1FBQ1Y7WUFDRSxJQUFJLEVBQUUsSUFBSTtZQUNWLEVBQUUsRUFBRSxTQUFTO1lBQ2IsU0FBUyxFQUFFLFNBQVM7WUFDcEIsUUFBUSxFQUFFLFVBQVU7WUFDcEIsT0FBTyxFQUFFLElBQUk7WUFDYixTQUFTLEVBQUUsU0FBUztZQUNwQixJQUFJLEVBQUUsSUFBSztZQUNYLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztZQUNyRCxpQkFBaUIsRUFBRSxpQkFBaUI7WUFDcEMsaUJBQWlCLEVBQUUsaUJBQWlCO1lBQ3BDLG1CQUFtQixFQUFFLElBQUk7WUFDekIsZUFBZSxFQUFFLElBQUk7WUFDckIsZUFBZSxFQUFFLElBQUk7WUFDckIsaUJBQWlCLEVBQUUsS0FBSztZQUN4QixvQkFBb0IsRUFBRSxLQUFLO1lBQzNCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsY0FBYyxFQUFFLElBQUk7WUFDcEIsVUFBVSxFQUFFLElBQUk7WUFDaEIsaUJBQWlCLEVBQUUsT0FBTyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUMvRSxZQUFZLEVBQUUsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztZQUMzRCxVQUFVLEVBQUUsSUFBSTtZQUNoQixPQUFPLEVBQUUsT0FBTztZQUNoQixNQUFNLEVBQUUsTUFBTTtZQUNkLG1CQUFtQixFQUFFLEtBQUs7U0FDM0IsQ0FBQztBQUNSLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLGlCQUF5QixFQUFFLGlCQUF5QjtJQUMvRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUV4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxPQUFPLFNBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLElBQVksRUFBRSxLQUFVO0lBQzNDLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLFFBQWtCLEVBQUUsaUJBQWtDO0lBQ2xGLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFO1lBQ3pDLE1BQU0sV0FBVyxDQUFDLG9DQUFvQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDNUU7YUFBTTtZQUNMLE1BQU0sV0FBVyxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDaEU7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFFBQW1CLEVBQUUsaUJBQWtDLEVBQ3ZELGFBQWdDO0lBQ2xDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsMEZBQTBGO1FBQzFGLE1BQU0sZUFBZSxHQUFHLGFBQWEsS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7UUFDdEUsT0FBTyxRQUFRLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDdkU7SUFFRCxJQUFJLFFBQVEsR0FBRyxPQUFPLGlCQUFpQixLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDO1FBQzVDLGlCQUFpQixDQUFDO0lBQ3RCLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUUvRCxnR0FBZ0c7SUFDaEcsaUdBQWlHO0lBQ2pHLDBGQUEwRjtJQUMxRiwyREFBMkQ7SUFDM0QsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFFMUIsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFZLEVBQUUsU0FBbUI7SUFDL0QsTUFBTSxRQUFRLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3BDLFFBQVEsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdkIsSUFBSSxLQUFLLENBQUMsZUFBZSxFQUFFO1FBQ3pCLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxTQUFtQjtJQUM1RSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRW5DLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN6QixlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQy9EO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUN2QixLQUFZLEVBQUUsT0FBeUMsRUFBRSxJQUFlLEVBQUUsYUFBcUIsRUFDL0YsT0FBb0IsRUFBRSxLQUF1QjtJQUMvQyxTQUFTLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQy9CLElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekQsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksVUFBVSxDQUNWLEtBQUssRUFBVyxnQkFBZ0I7SUFDaEMsSUFBSSxFQUFZLGtCQUFrQjtJQUNsQyxhQUFhLEVBQUcsZ0JBQWdCO0lBQ2hDLGFBQWEsRUFBRyx3QkFBd0I7SUFDeEMsQ0FBQyxDQUFDLEVBQWMseUJBQXlCO0lBQ3pDLENBQUMsQ0FBQyxFQUFjLHVCQUF1QjtJQUN2QyxDQUFDLENBQUMsRUFBYywrQkFBK0I7SUFDL0MsSUFBSSxFQUFZLGtDQUFrQztJQUNsRCxDQUFDLEVBQWUsb0JBQW9CO0lBQ3BDLENBQUMsRUFBZSx3Q0FBd0M7SUFDeEQsT0FBTyxFQUFTLHVCQUF1QjtJQUN2QyxLQUFLLEVBQUcsa0VBQWtFO0lBQzFFLElBQUksRUFBSSxjQUFjO0lBQ3RCLElBQUksRUFBSSxxQ0FBcUM7SUFDN0MsU0FBUyxFQUFHLGtEQUFrRDtJQUM5RCxJQUFJLEVBQVEsK0JBQStCO0lBQzNDLElBQUksRUFBUSxnQ0FBZ0M7SUFDNUMsSUFBSSxFQUFRLCtCQUErQjtJQUMzQyxJQUFJLEVBQVEsb0JBQW9CO0lBQ2hDLElBQUksRUFBUSw4QkFBOEI7SUFDMUMsSUFBSSxFQUFRLHFCQUFxQjtJQUNqQyxPQUFPLEVBQUssMkNBQTJDO0lBQ3ZELElBQUksRUFBUSw2Q0FBNkM7SUFDekQsSUFBSSxFQUFRLHNCQUFzQjtJQUNsQyxJQUFJLEVBQVEsaUNBQWlDO0lBQzdDLFNBQVMsRUFBRyw4QkFBOEI7SUFDMUMsSUFBSSxFQUFRLHVCQUF1QjtJQUNuQyxJQUFJLEVBQVEsa0NBQWtDO0lBQzlDLFNBQVMsRUFBRywrQkFBK0I7SUFDM0MsQ0FBUSxFQUFJLGdDQUFnQztJQUM1QyxDQUFRLENBQ1AsQ0FBQyxDQUFDO1FBQ1A7WUFDRSxJQUFJLEVBQUUsSUFBSTtZQUNWLEtBQUssRUFBRSxhQUFhO1lBQ3BCLGFBQWEsRUFBRSxhQUFhO1lBQzVCLGNBQWMsRUFBRSxDQUFDLENBQUM7WUFDbEIsWUFBWSxFQUFFLENBQUMsQ0FBQztZQUNoQixvQkFBb0IsRUFBRSxDQUFDLENBQUM7WUFDeEIsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixLQUFLLEVBQUUsQ0FBQztZQUNSLGVBQWUsRUFBRSxDQUFDO1lBQ2xCLE9BQU8sRUFBRSxPQUFPO1lBQ2hCLEtBQUssRUFBRSxLQUFLO1lBQ1osV0FBVyxFQUFFLElBQUk7WUFDakIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLFNBQVM7WUFDeEIsTUFBTSxFQUFFLElBQUk7WUFDWixPQUFPLEVBQUUsSUFBSTtZQUNiLE1BQU0sRUFBRSxJQUFJO1lBQ1osSUFBSSxFQUFFLElBQUk7WUFDVixjQUFjLEVBQUUsSUFBSTtZQUNwQixLQUFLLEVBQUUsSUFBSTtZQUNYLE1BQU0sRUFBRSxPQUFPO1lBQ2YsVUFBVSxFQUFFLElBQUk7WUFDaEIsTUFBTSxFQUFFLElBQUk7WUFDWixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGNBQWMsRUFBRSxTQUFTO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2Isa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixlQUFlLEVBQUUsU0FBUztZQUMxQixhQUFhLEVBQUUsQ0FBUTtZQUN2QixhQUFhLEVBQUUsQ0FBUTtTQUN4QixDQUFDO0FBQ3ZCLENBQUM7QUFHRCxTQUFTLHVCQUF1QixDQUM1QixhQUE2QyxFQUFFLGVBQXVCLEVBQ3RFLFNBQStCO0lBQ2pDLEtBQUssSUFBSSxVQUFVLElBQUksYUFBYSxFQUFFO1FBQ3BDLElBQUksYUFBYSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtZQUM1QyxTQUFTLEdBQUcsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUM7WUFDaEQsTUFBTSxZQUFZLEdBQUcsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBRS9DLElBQUksU0FBUyxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDeEMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7YUFDM0Q7aUJBQU07Z0JBQ0wsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzthQUMzRDtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUywrQkFBK0IsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUNqRSxTQUFTLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFMUMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUNuQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBQy9CLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFFeEIsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUMvQixNQUFNLGVBQWUsR0FBcUIsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLGtCQUFrQixFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUNwRixJQUFJLFdBQVcsR0FBeUIsSUFBSSxDQUFDO0lBQzdDLElBQUksWUFBWSxHQUF5QixJQUFJLENBQUM7SUFDOUMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoQyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFzQixDQUFDO1FBQ2xELE1BQU0sZUFBZSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUM7UUFDNUMscUZBQXFGO1FBQ3JGLGdGQUFnRjtRQUNoRiwyRkFBMkY7UUFDM0Ysc0NBQXNDO1FBQ3RDLE1BQU0sYUFBYSxHQUFHLENBQUMsVUFBVSxLQUFLLElBQUksSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNyRSxxQkFBcUIsQ0FBQyxlQUFlLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNwRCxJQUFJLENBQUM7UUFDVCxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3BDLFdBQVcsR0FBRyx1QkFBdUIsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBQ3ZFLFlBQVksR0FBRyx1QkFBdUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLENBQUMsRUFBRSxZQUFZLENBQUMsQ0FBQztLQUMvRTtJQUVELElBQUksV0FBVyxLQUFLLElBQUksRUFBRTtRQUN4QixJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdkMsS0FBSyxDQUFDLEtBQUssMEJBQTRCLENBQUM7U0FDekM7UUFDRCxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdkMsS0FBSyxDQUFDLEtBQUssMEJBQTRCLENBQUM7U0FDekM7S0FDRjtJQUVELEtBQUssQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDO0lBQ3RDLEtBQUssQ0FBQyxNQUFNLEdBQUcsV0FBVyxDQUFDO0lBQzNCLEtBQUssQ0FBQyxPQUFPLEdBQUcsWUFBWSxDQUFDO0FBQy9CLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLFdBQVcsQ0FBQyxJQUFZO0lBQy9CLElBQUksSUFBSSxLQUFLLE9BQU87UUFBRSxPQUFPLFdBQVcsQ0FBQztJQUN6QyxJQUFJLElBQUksS0FBSyxLQUFLO1FBQUUsT0FBTyxTQUFTLENBQUM7SUFDckMsSUFBSSxJQUFJLEtBQUssWUFBWTtRQUFFLE9BQU8sWUFBWSxDQUFDO0lBQy9DLElBQUksSUFBSSxLQUFLLFdBQVc7UUFBRSxPQUFPLFdBQVcsQ0FBQztJQUM3QyxJQUFJLElBQUksS0FBSyxVQUFVO1FBQUUsT0FBTyxVQUFVLENBQUM7SUFDM0MsSUFBSSxJQUFJLEtBQUssVUFBVTtRQUFFLE9BQU8sVUFBVSxDQUFDO0lBQzNDLE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVELE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZLEVBQUUsUUFBZ0IsRUFBRSxLQUFRLEVBQUUsUUFBbUIsRUFDekYsU0FBcUMsRUFBRSxVQUFtQjtJQUM1RCxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFnQixFQUFFLDJDQUEyQyxDQUFDLENBQUM7SUFDakcsTUFBTSxPQUFPLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBd0IsQ0FBQztJQUN0RSxJQUFJLFNBQVMsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDO0lBQzdCLElBQUksU0FBdUMsQ0FBQztJQUM1QyxJQUFJLENBQUMsVUFBVSxJQUFJLFNBQVMsSUFBSSxJQUFJLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUU7UUFDekUsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9ELElBQUksZUFBZSxDQUFDLEtBQUssQ0FBQztZQUFFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbEUsSUFBSSxTQUFTLEVBQUU7WUFDYixzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3RFO0tBQ0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixFQUFFO1FBQzNDLFFBQVEsR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7UUFFakMsSUFBSSxTQUFTLEVBQUU7WUFDYiw4QkFBOEIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUN6QyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUM3RCxpRUFBaUU7Z0JBQ2pFLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDekMsT0FBTzthQUNSO1lBQ0QsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7U0FDakM7UUFFRCx1RkFBdUY7UUFDdkYseUVBQXlFO1FBQ3pFLEtBQUssR0FBRyxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDN0YsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQW1CLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVEO2FBQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNwQyxPQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUUsT0FBZSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsT0FBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUM3QyxxREFBcUQ7UUFDckQsc0RBQXNEO1FBQ3RELElBQUksU0FBUyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQzlELHVCQUF1QixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMxQztLQUNGO0FBQ0gsQ0FBQztBQUVELDZEQUE2RDtBQUM3RCxTQUFTLGlCQUFpQixDQUFDLEtBQVksRUFBRSxTQUFpQjtJQUN4RCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2hDLE1BQU0sbUJBQW1CLEdBQUcsd0JBQXdCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3ZFLElBQUksQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyx1QkFBeUIsQ0FBQyxFQUFFO1FBQzFELG1CQUFtQixDQUFDLEtBQUssQ0FBQyxrQkFBb0IsQ0FBQztLQUNoRDtBQUNILENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUN6QixLQUFZLEVBQUUsT0FBMEIsRUFBRSxJQUFlLEVBQUUsUUFBZ0IsRUFBRSxLQUFVO0lBQ3pGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxRQUFRLEdBQUcseUJBQXlCLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0MsTUFBTSxVQUFVLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckQsSUFBSSxJQUFJLG9CQUFzQixFQUFFO1FBQzlCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtZQUNqQixvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBRSxPQUFvQixFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzFELE9BQW9CLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1NBQ2xGO2FBQU07WUFDTCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUM1QixRQUFRLENBQUMsWUFBWSxDQUFFLE9BQW9CLEVBQUUsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7Z0JBQ25FLE9BQW9CLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUM5RDtLQUNGO1NBQU07UUFDTCxNQUFNLFdBQVcsR0FBRyxZQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsRUFBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3BGLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxDQUFDLFFBQVEsQ0FBRSxPQUFvQixFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3ZEO2FBQU07WUFDSixPQUFvQixDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7U0FDakQ7S0FDRjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLEtBQVksRUFBRSxPQUEwQixFQUFFLElBQWUsRUFBRSxTQUE2QixFQUN4RixLQUFVO0lBQ1osSUFBSSxJQUFJLG9CQUFzQixJQUFJLElBQUksc0JBQXdCLEVBQUU7UUFDOUQ7Ozs7Ozs7V0FPRztRQUNILEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvRTtLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQ3JCLEtBQVksRUFBRSxLQUFZLEVBQUUsT0FBMEIsRUFBRSxRQUFnQixFQUN4RSxLQUFZO0lBQ2QsOEZBQThGO0lBQzlGLDhGQUE4RjtJQUM5RiwrRkFBK0Y7SUFDL0YsMkJBQTJCO0lBQzNCLElBQUksS0FBSyxDQUFDLE9BQU8sS0FBSyxJQUFJO1FBQUUsT0FBTyxJQUFJLENBQUM7SUFFeEMsK0ZBQStGO0lBQy9GLDRGQUE0RjtJQUM1RixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxRQUFRLElBQUksT0FBTztRQUNuRSxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDN0IsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUVELDBGQUEwRjtJQUMxRixnR0FBZ0c7SUFDaEcsT0FBTyxPQUFPLElBQUksS0FBSyxXQUFXLElBQUksSUFBSSxLQUFLLElBQUksSUFBSSxDQUFDLENBQUMsT0FBTyxZQUFZLElBQUksQ0FBQyxDQUFDO0FBQ3BGLENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsT0FBb0I7SUFDOUUsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQztJQUU5QixJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDdkMsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFCLElBQUksTUFBTSxLQUFLLGdCQUFnQjtnQkFDM0IsTUFBTSxLQUFLLHNCQUFzQixJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFO2dCQUM3RSxPQUFPLElBQUksQ0FBQzthQUNiO1NBQ0Y7S0FDRjtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFTLHVCQUF1QixDQUFDLFFBQWdCLEVBQUUsS0FBWTtJQUM3RCxPQUFPLENBQUMsS0FBSyxDQUNULGtCQUFrQixRQUFRLHlDQUF5QyxLQUFLLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQztBQUM1RixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUksS0FBWSxFQUFFLEtBQVksRUFBRSxHQUFvQjtJQUMxRixNQUFNLFNBQVMsR0FBRyx3QkFBd0IsRUFBRSxDQUFDO0lBQzdDLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUN6QixJQUFJLEdBQUcsQ0FBQyxpQkFBaUI7WUFBRSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDdEQsK0JBQStCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUNyRCxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQ3pDO0lBQ0QsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxTQUF5QixDQUFDLENBQUM7SUFDL0YsZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEQsSUFBSSxNQUFNLEVBQUU7UUFDVixlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2hDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXdELEVBQ3BGLFNBQXdCO0lBQzFCLHlGQUF5RjtJQUN6RixXQUFXO0lBQ1gsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQztJQUMxQixJQUFJLGtCQUFrQixFQUFFLEVBQUU7UUFDeEIsTUFBTSxhQUFhLEdBQTZCLHVCQUF1QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0YsTUFBTSxVQUFVLEdBQW1DLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQztRQUV4RixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7WUFDMUIsSUFBSSxzQkFBc0IsR0FBRyxDQUFDLENBQUM7WUFDL0IsYUFBYSxHQUFHLElBQUksQ0FBQztZQUNyQixjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvRCw4RkFBOEY7WUFDOUYsa0JBQWtCO1lBQ2xCLCtDQUErQztZQUMvQyxtRkFBbUY7WUFDbkYsd0ZBQXdGO1lBQ3hGLGFBQWE7WUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLEdBQUcsQ0FBQyxpQkFBaUI7b0JBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZEO1lBQ0QsK0JBQStCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDcEUsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDcEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzdDLE1BQU0sR0FBRyxHQUFHLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDN0Isd0ZBQXdGO2dCQUN4RixrRUFBa0U7Z0JBQ2xFLEtBQUssQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUVyRSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUV4QyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsSUFBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO2dCQUU3RCxJQUFJLEdBQUcsQ0FBQyxjQUFjLEtBQUssSUFBSTtvQkFBRSxLQUFLLENBQUMsS0FBSywyQkFBOEIsQ0FBQztnQkFDM0UsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUM7b0JBQzNFLEtBQUssQ0FBQyxLQUFLLDZCQUE4QixDQUFDO2dCQUU1QywyRUFBMkU7Z0JBQzNFLHFDQUFxQztnQkFDckMsSUFBSSxDQUFDLGtCQUFrQixJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsRUFBRTtvQkFDdkUsd0ZBQXdGO29CQUN4Riw4RUFBOEU7b0JBQzlFLDREQUE0RDtvQkFDNUQsQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO29CQUN0RixrQkFBa0IsR0FBRyxJQUFJLENBQUM7aUJBQzNCO2dCQUVELElBQUksQ0FBQyx1QkFBdUIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxFQUFFO29CQUM5RCxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUMsQ0FBQzt5QkFDeEQsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUM7b0JBQ3ZDLHVCQUF1QixHQUFHLElBQUksQ0FBQztpQkFDaEM7Z0JBRUQsb0NBQW9DLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxDQUFDO2dCQUNqRCxzQkFBc0IsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDO2FBQ3hDO1lBRUQsK0JBQStCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQzlDLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztTQUN6RDtRQUNELElBQUksVUFBVTtZQUFFLHVCQUF1QixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDdkU7SUFDRCx3RUFBd0U7SUFDeEUsS0FBSyxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbkUsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLG9DQUFvQyxDQUNoRCxLQUFZLEVBQUUsR0FBd0M7SUFDeEQsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxtQkFBb0IsQ0FBQztJQUMzQywwRkFBMEY7SUFDMUYsOERBQThEO0lBQzlELCtEQUErRDtJQUMvRCwwREFBMEQ7SUFDMUQsbUVBQW1FO0lBQ25FLGtFQUFrRTtJQUNsRSx1RUFBdUU7SUFDdkUsNENBQTRDO0lBQzVDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQy9CLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDOUIsSUFBSSxRQUFRLEtBQUssQ0FBQyxFQUFFO1FBQ2xCLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzVCO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFhO0lBQ3pFLFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxTQUFTLElBQUksVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsMENBQTBDLENBQUMsQ0FBQztJQUN6RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzlCLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDdEIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDaEMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLHdCQUF3QixDQUM3QixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXlCLEVBQUUsTUFBYTtJQUN0RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDMUIsOEJBQThCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzlDO0lBRUQsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUvQixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0lBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQXNCLENBQUM7UUFDL0MsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhDLElBQUksV0FBVyxFQUFFO1lBQ2YsU0FBUyxJQUFJLHlCQUF5QixDQUFDLEtBQUssa0JBQW9CLENBQUM7WUFDakUsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQXFCLEVBQUUsR0FBd0IsQ0FBQyxDQUFDO1NBQzNFO1FBRUQsTUFBTSxTQUFTLEdBQUcsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDNUQsZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUVsQyxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7WUFDMUIsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsYUFBYyxDQUFDLENBQUM7U0FDN0U7UUFFRCxJQUFJLFdBQVcsRUFBRTtZQUNmLE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQztTQUNwQztLQUNGO0FBQ0gsQ0FBQztBQUVELFNBQVMsNEJBQTRCLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZO0lBQzVFLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7SUFDbkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUMvQixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsbUJBQW9CLENBQUM7SUFDM0MsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUM5QyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztJQUNqRCxNQUFNLHFCQUFxQixHQUFHLHdCQUF3QixFQUFFLENBQUM7SUFDekQsSUFBSTtRQUNGLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9CLEtBQUssSUFBSSxRQUFRLEdBQUcsS0FBSyxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDckQsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQTBCLENBQUM7WUFDMUQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7Z0JBQzdFLGdDQUFnQyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUNsRDtpQkFBTSxJQUFJLGVBQWUsRUFBRTtnQkFDMUIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtTQUNGO0tBQ0Y7WUFBUztRQUNSLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUNqRDtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQ0FBZ0MsQ0FBQyxHQUFzQixFQUFFLFNBQWM7SUFDckYsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRTtRQUM3QixHQUFHLENBQUMsWUFBYSxpQkFBcUIsU0FBUyxDQUFDLENBQUM7S0FDbEQ7QUFDSCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUsK0JBQStCLENBQzNDLEtBQVksRUFBRSxLQUFZLEVBQUUsY0FBc0I7SUFDcEQsU0FBUztRQUNMLFdBQVcsQ0FDUCxLQUFLLENBQUMsZUFBZSxFQUFFLElBQUksRUFDM0IsOERBQThELENBQUMsQ0FBQztJQUV4RSxnR0FBZ0c7SUFDaEcsNkVBQTZFO0lBQzdFLHFGQUFxRjtJQUNyRixNQUFNLFlBQVksR0FBRyxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUNqRCxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxlQUFlLHNDQUErQyxDQUFDO0lBQ2hHLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFrQixDQUFDO0lBQzdELENBQUMsS0FBSyxDQUFDLG1CQUFtQixJQUFJLENBQUMsS0FBSyxDQUFDLG1CQUFtQixHQUFHLEVBQUUsQ0FBQyxDQUFDO1NBQzFELElBQUksQ0FBQyxZQUFZLEVBQUUsYUFBYSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0FBQ3pELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUM1QixLQUFZLEVBQUUsUUFBZSxFQUM3QixLQUF3RDtJQUMxRCxTQUFTLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsU0FBUztRQUNMLHlCQUF5QixDQUNyQixLQUFLLCtEQUFxRSxDQUFDO0lBQ25GLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUN6QyxJQUFJLE9BQU8sR0FBZSxJQUFJLENBQUM7SUFDL0IsSUFBSSxRQUFRLEVBQUU7UUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN4QyxNQUFNLEdBQUcsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUF5QyxDQUFDO1lBQ2hFLElBQUksMEJBQTBCLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxTQUFVLEVBQUUsc0JBQXNCLENBQUMsS0FBSyxDQUFDLEVBQUU7Z0JBQ25GLE9BQU8sSUFBSSxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksWUFBWSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2dCQUMzRCxrQkFBa0IsQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFFckYsSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUU7b0JBQ3ZCLElBQUksS0FBSyxDQUFDLEtBQUssMEJBQTZCO3dCQUFFLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNqRixtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7b0JBQ2xDLDhEQUE4RDtvQkFDOUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDbkI7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsU0FBZ0I7SUFDaEUsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFDLFNBQVMsQ0FBQyxLQUFLLDJCQUE4QixDQUFDO0lBQzlDLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUM1RSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzdCLENBQUM7QUFHRCw4RkFBOEY7QUFDOUYsU0FBUyx1QkFBdUIsQ0FDNUIsS0FBWSxFQUFFLFNBQXdCLEVBQUUsVUFBbUM7SUFDN0UsSUFBSSxTQUFTLEVBQUU7UUFDYixNQUFNLFVBQVUsR0FBc0IsS0FBSyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksZUFBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztRQUVoRyxtRkFBbUY7UUFDbkYsK0VBQStFO1FBQy9FLDBDQUEwQztRQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzVDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtnQkFBRSxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0RixVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsbUJBQW1CLENBQ3hCLEtBQWEsRUFBRSxHQUF3QyxFQUN2RCxVQUF3QztJQUMxQyxJQUFJLFVBQVUsRUFBRTtRQUNkLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRTtZQUNoQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVDLFVBQVUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxDQUFDO2FBQ3JDO1NBQ0Y7UUFDRCxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUM7WUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQ2pEO0FBQ0gsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsY0FBYyxDQUFDLEtBQVksRUFBRSxLQUFhLEVBQUUsa0JBQTBCO0lBQ3BGLFNBQVM7UUFDTCxjQUFjLENBQ1Ysa0JBQWtCLEVBQUUsS0FBSyxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUMsY0FBYyxFQUM3RCxzQ0FBc0MsQ0FBQyxDQUFDO0lBQ2hELEtBQUssQ0FBQyxLQUFLLDJCQUE4QixDQUFDO0lBQzFDLGdFQUFnRTtJQUNoRSxLQUFLLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztJQUM3QixLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssR0FBRyxrQkFBa0IsQ0FBQztJQUNoRCxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztBQUNoQyxDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBSSxLQUFZLEVBQUUsUUFBZSxFQUFFLEdBQW9CO0lBQ2xGLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ3JCLE1BQU0sZ0JBQWdCLEdBQ2xCLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBRSxHQUEyQixDQUFDLE9BQU8sR0FBRyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBQzFGLE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDakcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztJQUMxQyxRQUFRLENBQUMsSUFBSSxDQUFDLG1CQUFtQixDQUFDLENBQUM7QUFDckMsQ0FBQztBQUVELFNBQVMsaUJBQWlCLENBQUksS0FBWSxFQUFFLFNBQXVCLEVBQUUsR0FBb0I7SUFDdkYsTUFBTSxNQUFNLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBYSxDQUFDO0lBQzlELE1BQU0sS0FBSyxHQUFHLHlCQUF5QixDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBRTdDLHFGQUFxRjtJQUNyRixrRkFBa0Y7SUFDbEYsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUM7SUFDaEQsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUMvQixLQUFLLEVBQ0wsV0FBVyxDQUNQLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBa0IsQ0FBQyxxQkFBdUIsRUFBRSxNQUFNLEVBQ2xGLFNBQXlCLEVBQUUsZUFBZSxFQUFFLGVBQWUsQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVsRyx5RUFBeUU7SUFDekUsZ0VBQWdFO0lBQ2hFLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsYUFBYSxDQUFDO0FBQ3pDLENBQUM7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLEtBQVksRUFBRSxLQUFZLEVBQUUsSUFBWSxFQUFFLEtBQVUsRUFBRSxTQUFxQyxFQUMzRixTQUFnQztJQUNsQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFnQixFQUFFLDJDQUEyQyxDQUFDLENBQUM7SUFDakcsU0FBUyxJQUFJLDhCQUE4QixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ2xELE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWEsQ0FBQztJQUMzRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1FBQ2pCLFNBQVMsSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNqRCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNoRTtTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzlDLE1BQU0sUUFBUSxHQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUc3RixJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDM0Q7YUFBTTtZQUNMLFNBQVMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ25ELE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2xEO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFTLGtCQUFrQixDQUN2QixLQUFZLEVBQUUsY0FBc0IsRUFBRSxRQUFXLEVBQUUsR0FBb0IsRUFBRSxLQUFZLEVBQ3JGLGdCQUFrQztJQUNwQyxNQUFNLGFBQWEsR0FBdUIsZ0JBQWlCLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDNUUsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO1FBQzFCLE1BQU0sUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7UUFDOUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGFBQWEsQ0FBQyxNQUFNLEdBQUc7WUFDekMsTUFBTSxVQUFVLEdBQUcsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdEMsTUFBTSxXQUFXLEdBQUcsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDdkMsTUFBTSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDakMsSUFBSSxRQUFRLEtBQUssSUFBSSxFQUFFO2dCQUNyQixHQUFHLENBQUMsUUFBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO2FBQ3pEO2lCQUFNO2dCQUNKLFFBQWdCLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO2FBQ3hDO1lBQ0QsSUFBSSxTQUFTLEVBQUU7Z0JBQ2IsTUFBTSxhQUFhLEdBQUcsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBYSxDQUFDO2dCQUNqRSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsV0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQzVFO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7Ozs7OztHQWFHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxNQUErQixFQUFFLEtBQWtCO0lBRWhGLElBQUksYUFBYSxHQUF1QixJQUFJLENBQUM7SUFDN0MsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTtRQUN2QixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxRQUFRLHlCQUFpQyxFQUFFO1lBQzdDLG1EQUFtRDtZQUNuRCxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsU0FBUztTQUNWO2FBQU0sSUFBSSxRQUFRLHNCQUE4QixFQUFFO1lBQ2pELHFDQUFxQztZQUNyQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsU0FBUztTQUNWO1FBRUQsNEZBQTRGO1FBQzVGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUTtZQUFFLE1BQU07UUFFeEMsSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLFFBQWtCLENBQUMsRUFBRTtZQUM3QyxJQUFJLGFBQWEsS0FBSyxJQUFJO2dCQUFFLGFBQWEsR0FBRyxFQUFFLENBQUM7WUFDL0MsYUFBYSxDQUFDLElBQUksQ0FBQyxRQUFrQixFQUFFLE1BQU0sQ0FBQyxRQUFrQixDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsQ0FBQyxDQUFDO1NBQzVGO1FBRUQsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNSO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVELDBCQUEwQjtBQUMxQix5QkFBeUI7QUFDekIsMEJBQTBCO0FBRTFCLCtEQUErRDtBQUMvRCxNQUFNLGVBQWUsR0FBUSxDQUFDLENBQUMsT0FBTyxTQUFTLEtBQUssV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLGFBQWEsRUFBRSxDQUFDO0lBQzdGLG9CQUFvQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBRXZDOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsVUFBbUMsRUFBRSxXQUFrQixFQUFFLE1BQWdCLEVBQ3pFLEtBQVk7SUFDZCxTQUFTLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDLFNBQVMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRix1REFBdUQ7SUFDdkQsTUFBTSxVQUFVLEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FDcEUsVUFBVSxFQUFJLGNBQWM7SUFDNUIsSUFBSSxFQUFVLHlFQUF5RTtJQUN2RixLQUFLLEVBQVMseUJBQXlCO0lBQ3ZDLFdBQVcsRUFBRyxTQUFTO0lBQ3ZCLElBQUksRUFBVSxPQUFPO0lBQ3JCLENBQUMsRUFBYSxzQ0FBc0M7SUFDcEQsS0FBSyxFQUFTLFNBQVM7SUFDdkIsTUFBTSxFQUFRLFVBQVU7SUFDeEIsSUFBSSxFQUFVLFlBQVk7SUFDMUIsSUFBSSxDQUNQLENBQUM7SUFDRixTQUFTO1FBQ0wsV0FBVyxDQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsdUJBQXVCLEVBQzFDLGdFQUFnRSxDQUFDLENBQUM7SUFDMUUsU0FBUyxJQUFJLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9DLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQVk7SUFDeEMsS0FBSyxJQUFJLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLEtBQUssSUFBSSxFQUMvRCxVQUFVLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoRSxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLFNBQVMsSUFBSSxhQUFhLENBQUMsYUFBYSxFQUFFLHlCQUF5QixDQUFDLENBQUM7WUFDckUsSUFBSSw0QkFBNEIsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDL0MsV0FBVyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQzthQUM1RjtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsK0JBQStCLENBQUMsS0FBWTtJQUNuRCxLQUFLLElBQUksVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLEVBQy9ELFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDO1lBQUUsU0FBUztRQUVsRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFFLENBQUM7UUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUUscURBQXFELENBQUMsQ0FBQztRQUM5RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDbEMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFlLENBQUM7WUFDN0QsU0FBUyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkQsbUZBQW1GO1lBQ25GLFdBQVc7WUFDWCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbEUsMkJBQTJCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDckQ7WUFDRCwyRkFBMkY7WUFDM0YseUZBQXlGO1lBQ3pGLGdFQUFnRTtZQUNoRSxpRUFBaUU7WUFDakUsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQztTQUN6RDtLQUNGO0FBQ0gsQ0FBQztBQUVELGFBQWE7QUFFYjs7OztHQUlHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxTQUFnQixFQUFFLGdCQUF3QjtJQUNsRSxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUMzRixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RSx3RkFBd0Y7SUFDeEYsSUFBSSw0QkFBNEIsQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUMvQyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxxQ0FBeUMsQ0FBQyxFQUFFO1lBQ3RFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDM0U7YUFBTSxJQUFJLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMzRCx3RkFBd0Y7WUFDeEYsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDekM7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsd0JBQXdCLENBQUMsS0FBWTtJQUM1QyxLQUFLLElBQUksVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLEVBQy9ELFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQyxLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hFLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUU7Z0JBQzdELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0MsU0FBUyxJQUFJLGFBQWEsQ0FBQyxhQUFhLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDckUsV0FBVyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQzthQUM1RjtpQkFBTSxJQUFJLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDM0Qsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7YUFDekM7U0FDRjtLQUNGO0lBRUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLGlDQUFpQztJQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsd0ZBQXdGO1lBQ3hGLElBQUksNEJBQTRCLENBQUMsYUFBYSxDQUFDO2dCQUMzQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3BELHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUFnQixFQUFFLGdCQUF3QjtJQUNqRSxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztJQUM1RixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RSxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3JELFVBQVUsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFDSCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQTZCLEtBQVksRUFBRSxpQkFBb0I7SUFDMUYsK0ZBQStGO0lBQy9GLGtHQUFrRztJQUNsRyx5RkFBeUY7SUFDekYsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3JCLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztLQUM5QztTQUFNO1FBQ0wsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0tBQ3ZDO0lBQ0QsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0lBQ3RDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELCtCQUErQjtBQUMvQixxQkFBcUI7QUFDckIsK0JBQStCO0FBRy9COzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVk7SUFDeEMsT0FBTyxLQUFLLEVBQUU7UUFDWixLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFvQixDQUFDO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQywyRkFBMkY7UUFDM0YsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDaEMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELHFCQUFxQjtRQUNyQixLQUFLLEdBQUcsTUFBTyxDQUFDO0tBQ2pCO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0Q7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsV0FBd0IsRUFBRSxLQUF1QjtJQUM1RSxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxLQUFLLGtCQUEyQixDQUFDO0lBQ3RFLFdBQVcsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDO0lBRTNCLElBQUksZ0JBQWdCLElBQUksV0FBVyxDQUFDLEtBQUssSUFBSSxjQUFjLEVBQUU7UUFDM0QsSUFBSSxHQUErQixDQUFDO1FBQ3BDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsSUFBSSxPQUFPLENBQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUN0RCxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRTtZQUN6QixJQUFJLFdBQVcsQ0FBQyxLQUFLLHdCQUFpQyxFQUFFO2dCQUN0RCxXQUFXLENBQUMsS0FBSyxJQUFJLHNCQUErQixDQUFDO2dCQUNyRCxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDOUI7WUFFRCxJQUFJLFdBQVcsQ0FBQyxLQUFLLHVCQUFnQyxFQUFFO2dCQUNyRCxXQUFXLENBQUMsS0FBSyxJQUFJLHFCQUE4QixDQUFDO2dCQUNwRCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsYUFBYSxDQUFDO2dCQUNoRCxJQUFJLGFBQWEsRUFBRTtvQkFDakIsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO2lCQUM5QjthQUNGO1lBRUQsV0FBVyxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUM7WUFDbkMsR0FBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ2IsQ0FBQyxDQUFDLENBQUM7S0FDSjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLFdBQXdCO0lBQ3RELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0RCxNQUFNLGFBQWEsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hELE1BQU0sS0FBSyxHQUFHLGdCQUFnQixDQUFDLGFBQWEsQ0FBRSxDQUFDO1FBQy9DLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUMzQix5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDeEU7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHFCQUFxQixDQUFJLEtBQVksRUFBRSxLQUFZLEVBQUUsT0FBVTtJQUM3RSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNoRCxJQUFJLGVBQWUsQ0FBQyxLQUFLO1FBQUUsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQ25ELElBQUk7UUFDRixXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3BEO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzFCLE1BQU0sS0FBSyxDQUFDO0tBQ2I7WUFBUztRQUNSLElBQUksZUFBZSxDQUFDLEdBQUc7WUFBRSxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDaEQ7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxLQUFZO0lBQ2xELGVBQWUsQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFnQixDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBSSxLQUFZLEVBQUUsSUFBVyxFQUFFLE9BQVU7SUFDN0UscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsSUFBSTtRQUNGLHFCQUFxQixDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDN0M7WUFBUztRQUNSLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzlCO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLHdCQUF3QixDQUFDLEtBQVk7SUFDbkQscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsSUFBSTtRQUNGLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2hDO1lBQVM7UUFDUixxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUN2QixLQUFrQixFQUFFLFdBQW9DLEVBQUUsU0FBWTtJQUN4RSxTQUFTLElBQUksYUFBYSxDQUFDLFdBQVcsRUFBRSxtREFBbUQsQ0FBQyxDQUFDO0lBQzdGLG9CQUFvQixDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3hCLFdBQVcsQ0FBQyxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDaEMsQ0FBQztBQUdELCtCQUErQjtBQUMvQiw4QkFBOEI7QUFDOUIsK0JBQStCO0FBRS9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW9CRztBQUNILE1BQU0sVUFBVSw0QkFBNEIsQ0FDeEMsS0FBWSxFQUFFLEtBQVksRUFBRSxZQUFvQixFQUFFLFlBQW9CLEVBQ3RFLEdBQUcsa0JBQTRCO0lBQ2pDLDhGQUE4RjtJQUM5RixnR0FBZ0c7SUFDaEcsa0ZBQWtGO0lBQ2xGLElBQUksS0FBSyxDQUFDLFlBQVksQ0FBQyxLQUFLLElBQUksRUFBRTtRQUNoQyxJQUFJLEtBQUssQ0FBQyxNQUFNLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsRUFBRTtZQUN2RCxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLElBQUksQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDLENBQUM7WUFDaEYsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNuQyxJQUFJLGVBQWUsR0FBRyxZQUFZLENBQUM7WUFDbkMsSUFBSSxrQkFBa0IsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNqQyxlQUFlO29CQUNYLHVCQUF1QixHQUFHLGtCQUFrQixDQUFDLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO2FBQ2hGO1lBQ0QsS0FBSyxDQUFDLFlBQVksQ0FBQyxHQUFHLGVBQWUsQ0FBQztTQUN2QztLQUNGO0FBQ0gsQ0FBQztBQUVELE1BQU0sQ0FBQyxNQUFNLGFBQWEsR0FBRyxjQUFjLENBQUM7QUFFNUMsTUFBTSxVQUFVLFdBQVcsQ0FBQyxJQUFXO0lBQ3JDLHFGQUFxRjtJQUNyRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxLQUFZO0lBQ25DLE9BQU8sS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1RSxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLHFCQUFxQixDQUNqQyxVQUFrQyxFQUFFLEtBQVksRUFBRSxLQUFZO0lBQ2hFLDZGQUE2RjtJQUM3RixrR0FBa0c7SUFDbEcsaUdBQWlHO0lBQ2pHLGtHQUFrRztJQUNsRywwRkFBMEY7SUFDMUYsY0FBYztJQUNkLElBQUksVUFBVSxLQUFLLElBQUksSUFBSSxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDckQsS0FBSyxHQUFHLFdBQVcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFFLENBQUM7S0FDMUM7SUFDRCxPQUFPLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6QixDQUFDO0FBRUQsMkNBQTJDO0FBQzNDLE1BQU0sVUFBVSxXQUFXLENBQUMsS0FBWSxFQUFFLEtBQVU7SUFDbEQsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN4RSxZQUFZLElBQUksWUFBWSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsb0JBQW9CLENBQ2hDLEtBQVksRUFBRSxLQUFZLEVBQUUsTUFBMEIsRUFBRSxVQUFrQixFQUFFLEtBQVU7SUFDeEYsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUc7UUFDbEMsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFXLENBQUM7UUFDcEMsTUFBTSxXQUFXLEdBQUcsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFXLENBQUM7UUFDMUMsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzlCLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQXNCLENBQUM7UUFDbkQsSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLElBQUksRUFBRTtZQUN6QixHQUFHLENBQUMsUUFBUyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQ3pEO2FBQU07WUFDTCxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQy9CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxLQUFhO0lBQzVFLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUNyRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztJQUM3RCxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFpQixDQUFDO0lBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUN6QyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztBQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydE5vdEVxdWFsLCBhc3NlcnROb3RTYW1lLCBhc3NlcnRTYW1lfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZU5hbWVkQXJyYXlUeXBlfSBmcm9tICcuLi8uLi91dGlsL25hbWVkX2FycmF5X3R5cGUnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIEhBU19UUkFOU1BMQU5URURfVklFV1MsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzLCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSwgTm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBUQXR0cmlidXRlcywgVENvbnN0YW50cywgVENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzUHJvY2VkdXJhbFJlbmRlcmVyLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgUk5vZGUsIFJUZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdCwgaXNDb250ZW50UXVlcnlIb3N0LCBpc0xDb250YWluZXIsIGlzUm9vdFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEluaXRQaGFzZVN0YXRlLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNILCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc0lubGluZVRlbXBsYXRlLCBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBnZXRJc1BhcmVudCwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4LCBsZWF2ZVZpZXcsIHNldEJpbmRpbmdJbmRleCwgc2V0QmluZGluZ1Jvb3RGb3JIb3N0QmluZGluZ3MsIHNldENoZWNrTm9DaGFuZ2VzTW9kZSwgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wLCBtZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRGaXJzdExDb250YWluZXIsIGdldExWaWV3UGFyZW50LCBnZXROZXh0TENvbnRhaW5lcn0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaXNDcmVhdGlvbk1vZGUsIHJlYWRQYXRjaGVkTFZpZXcsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHVud3JhcExWaWV3LCB1cGRhdGVUcmFuc3BsYW50ZWRWaWV3Q291bnQsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2VsZWN0SW5kZXhJbnRlcm5hbH0gZnJvbSAnLi9hZHZhbmNlJztcbmltcG9ydCB7YXR0YWNoTENvbnRhaW5lckRlYnVnLCBhdHRhY2hMVmlld0RlYnVnLCBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQsIGNsb25lVG9UVmlld0RhdGEsIExDbGVhbnVwLCBMVmlld0JsdWVwcmludCwgTWF0Y2hlc0FycmF5LCBUQ2xlYW51cCwgVE5vZGVEZWJ1ZywgVE5vZGVJbml0aWFsSW5wdXRzLCBUTm9kZUxvY2FsTmFtZXMsIFRWaWV3Q29tcG9uZW50cywgVFZpZXdDb25zdHJ1Y3Rvcn0gZnJvbSAnLi9sdmlld19kZWJ1Zyc7XG5cblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9ICgoKSA9PiBQcm9taXNlLnJlc29sdmUobnVsbCkpKCk7XG5cbi8qKlxuICogUHJvY2VzcyB0aGUgYFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNgLiAoRXhlY3V0ZSB0aGUgYGhvc3RCaW5kaW5nc2AuKVxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIGNvbnRhaW5pbmcgdGhlIGBleHBhbmRvSW5zdHJ1Y3Rpb25zYFxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgYXNzb2NpYXRlZCB3aXRoIHRoZSBgVFZpZXdgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIb3N0QmluZGluZ3NCeUV4ZWN1dGluZ0V4cGFuZG9JbnN0cnVjdGlvbnModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFNhbWUodFZpZXcsIGxWaWV3W1RWSUVXXSwgJ2BMVmlld2AgaXMgbm90IGFzc29jaWF0ZWQgd2l0aCB0aGUgYFRWaWV3YCEnKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBleHBhbmRvSW5zdHJ1Y3Rpb25zID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucztcbiAgICBpZiAoZXhwYW5kb0luc3RydWN0aW9ucyAhPT0gbnVsbCkge1xuICAgICAgbGV0IGJpbmRpbmdSb290SW5kZXggPSB0Vmlldy5leHBhbmRvU3RhcnRJbmRleDtcbiAgICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICAgIGxldCBjdXJyZW50RWxlbWVudEluZGV4ID0gLTE7XG4gICAgICAvLyBUT0RPKG1pc2tvKTogUEVSRiBJdCBpcyBwb3NzaWJsZSB0byBnZXQgaGVyZSB3aXRoIGBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zYCBjb250YWluaW5nIG5vXG4gICAgICAvLyBmdW5jdGlvbnMgdG8gZXhlY3V0ZS4gVGhpcyBpcyB3YXN0ZWZ1bCBhcyB0aGVyZSBpcyBubyB3b3JrIHRvIGJlIGRvbmUsIGJ1dCB3ZSBzdGlsbCBuZWVkXG4gICAgICAvLyB0byBpdGVyYXRlIG92ZXIgdGhlIGluc3RydWN0aW9ucy5cbiAgICAgIC8vIEluIGV4YW1wbGUgb2YgdGhpcyBpcyBpbiB0aGlzIHRlc3Q6IGBob3N0X2JpbmRpbmdfc3BlYy50c2BcbiAgICAgIC8vIGBmaXQoJ3Nob3VsZCBub3QgY2F1c2UgcHJvYmxlbXMgaWYgZGV0ZWN0Q2hhbmdlcyBpcyBjYWxsZWQgd2hlbiBhIHByb3BlcnR5IHVwZGF0ZXMnLCAuLi5gXG4gICAgICAvLyBJbiB0aGUgYWJvdmUgdGVzdCB3ZSBnZXQgaGVyZSB3aXRoIGV4cGFuZG8gWzAsIDAsIDFdIHdoaWNoIHJlcXVpcmVzIGEgbG90IG9mIHByb2Nlc3NpbmcgYnV0XG4gICAgICAvLyB0aGVyZSBpcyBubyBmdW5jdGlvbiB0byBleGVjdXRlLlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBleHBhbmRvSW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGluc3RydWN0aW9uID0gZXhwYW5kb0luc3RydWN0aW9uc1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiBpbnN0cnVjdGlvbiA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gPD0gMCkge1xuICAgICAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBtZWFuIHRoYXQgd2UgYXJlIHN0YXJ0aW5nIG5ldyBFWFBBTkRPIGJsb2NrIGFuZCBuZWVkIHRvIHVwZGF0ZVxuICAgICAgICAgICAgLy8gdGhlIGN1cnJlbnQgZWxlbWVudCBhbmQgZGlyZWN0aXZlIGluZGV4LlxuICAgICAgICAgICAgLy8gSW1wb3J0YW50OiBJbiBKUyBgLXhgIGFuZCBgMC14YCBpcyBub3QgdGhlIHNhbWUhIElmIGB4PT09MGAgdGhlbiBgLXhgIHdpbGwgcHJvZHVjZVxuICAgICAgICAgICAgLy8gYC0wYCB3aGljaCByZXF1aXJlcyBub24gc3RhbmRhcmQgbWF0aCBhcml0aG1ldGljIGFuZCBpdCBjYW4gcHJldmVudCBWTSBvcHRpbWl6YXRpb25zLlxuICAgICAgICAgICAgLy8gYDAtMGAgd2lsbCBhbHdheXMgcHJvZHVjZSBgMGAgYW5kIHdpbGwgbm90IGNhdXNlIGEgcG90ZW50aWFsIGRlb3B0aW1pemF0aW9uIGluIFZNLlxuICAgICAgICAgICAgLy8gVE9ETyhtaXNrbyk6IFBFUkYgVGhpcyBzaG91bGQgYmUgcmVmYWN0b3JlZCB0byB1c2UgYH5pbnN0cnVjdGlvbmAgYXMgdGhhdCBkb2VzIG5vdFxuICAgICAgICAgICAgLy8gc3VmZmVyIGZyb20gYC0wYCBhbmQgaXQgaXMgZmFzdGVyL21vcmUgY29tcGFjdC5cbiAgICAgICAgICAgIGN1cnJlbnRFbGVtZW50SW5kZXggPSAwIC0gaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgICBzZXRTZWxlY3RlZEluZGV4KGN1cnJlbnRFbGVtZW50SW5kZXgpO1xuXG4gICAgICAgICAgICAvLyBJbmplY3RvciBibG9jayBhbmQgcHJvdmlkZXJzIGFyZSB0YWtlbiBpbnRvIGFjY291bnQuXG4gICAgICAgICAgICBjb25zdCBwcm92aWRlckNvdW50ID0gKGV4cGFuZG9JbnN0cnVjdGlvbnNbKytpXSBhcyBudW1iZXIpO1xuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSArIHByb3ZpZGVyQ291bnQ7XG5cbiAgICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IGJpbmRpbmdSb290SW5kZXg7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoaXMgaXMgZWl0aGVyIHRoZSBpbmplY3RvciBzaXplIChzbyB0aGUgYmluZGluZyByb290IGNhbiBza2lwIG92ZXIgZGlyZWN0aXZlc1xuICAgICAgICAgICAgLy8gYW5kIGdldCB0byB0aGUgZmlyc3Qgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKSBvciB0aGUgaG9zdCB2YXIgY291bnRcbiAgICAgICAgICAgIC8vICh0byBnZXQgdG8gdGhlIG5leHQgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKS5cbiAgICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gaW5zdHJ1Y3Rpb247XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIGl0J3Mgbm90IGEgbnVtYmVyLCBpdCdzIGEgaG9zdCBiaW5kaW5nIGZ1bmN0aW9uIHRoYXQgbmVlZHMgdG8gYmUgZXhlY3V0ZWQuXG4gICAgICAgICAgaWYgKGluc3RydWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgICBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyhiaW5kaW5nUm9vdEluZGV4LCBjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICAgICAgY29uc3QgaG9zdEN0eCA9IGxWaWV3W2N1cnJlbnREaXJlY3RpdmVJbmRleF07XG4gICAgICAgICAgICBpbnN0cnVjdGlvbihSZW5kZXJGbGFncy5VcGRhdGUsIGhvc3RDdHgpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyBUT0RPKG1pc2tvKTogUEVSRiBSZWx5aW5nIG9uIGluY3JlbWVudGluZyB0aGUgYGN1cnJlbnREaXJlY3RpdmVJbmRleGAgaGVyZSBpc1xuICAgICAgICAgIC8vIHN1Yi1vcHRpbWFsLiBUaGUgaW1wbGljYXRpb25zIGFyZSB0aGF0IGlmIHdlIGhhdmUgYSBsb3Qgb2YgZGlyZWN0aXZlcyBidXQgbm9uZSBvZiB0aGVtXG4gICAgICAgICAgLy8gaGF2ZSBob3N0IGJpbmRpbmdzIHdlIG5ldmVydGhlbGVzcyBuZWVkIHRvIGl0ZXJhdGUgb3ZlciB0aGUgZXhwYW5kbyBpbnN0cnVjdGlvbnMgdG9cbiAgICAgICAgICAvLyB1cGRhdGUgdGhlIGNvdW50ZXIuIEl0IHdvdWxkIGJlIG11Y2ggYmV0dGVyIGlmIHdlIGNvdWxkIGVuY29kZSB0aGVcbiAgICAgICAgICAvLyBgY3VycmVudERpcmVjdGl2ZUluZGV4YCBpbnRvIHRoZSBgZXhwYW5kb0luc3RydWN0aW9uYCBhcnJheSBzbyB0aGF0IHdlIG9ubHkgbmVlZCB0b1xuICAgICAgICAgIC8vIGl0ZXJhdGUgb3ZlciB0aG9zZSBkaXJlY3RpdmVzIHdoaWNoIGFjdHVhbGx5IGhhdmUgYGhvc3RCaW5kaW5nc2AuXG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4Kys7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuLyoqIFJlbmRlcnMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3IChjcmVhdGlvbiBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlbmRlckNoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZW5kZXJDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIHVzZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShuYW1lOiBzdHJpbmcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5hbWVzcGFjZTogc3RyaW5nfG51bGwpOiBSRWxlbWVudCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBuYW1lc3BhY2UgPT09IG51bGwgPyByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVuZGVyZXIuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlld3xudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFR8bnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGhvc3Q6IFJFbGVtZW50fG51bGwsXG4gICAgdEhvc3ROb2RlOiBUVmlld05vZGV8VEVsZW1lbnROb2RlfG51bGwsIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTN8bnVsbCxcbiAgICByZW5kZXJlcj86IFJlbmRlcmVyM3xudWxsLCBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXJ8bnVsbCwgaW5qZWN0b3I/OiBJbmplY3RvcnxudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9XG4gICAgICBuZ0Rldk1vZGUgPyBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQodFZpZXcpIDogdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLCAnUmVuZGVyZXJGYWN0b3J5IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhPT0gbnVsbCA6IHRydWUsIHRydWUsXG4gICAgICAgICAgJ0VtYmVkZGVkIHZpZXdzIG11c3QgaGF2ZSBwYXJlbnRMVmlldycpO1xuICBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gPVxuICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddIDogbFZpZXc7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIHRIb3N0Tm9kZSBUaGlzIGlzIGEgaGFjayBhbmQgd2Ugc2hvdWxkIG5vdCBoYXZlIHRvIHBhc3MgdGhpcyB2YWx1ZSBpbi4gSXQgaXMgb25seSB1c2VkIHRvXG4gKiBkZXRlcm1pbmUgaWYgdGhlIHBhcmVudCBiZWxvbmdzIHRvIGEgZGlmZmVyZW50IHRWaWV3LiBJbnN0ZWFkIHdlIHNob3VsZCBub3QgaGF2ZSBwYXJlbnRUVmlld1xuICogcG9pbnQgdG8gVFZpZXcgb3RoZXIgdGhlIGN1cnJlbnQgb25lLlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlfG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlfG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3VDb250YWluZXIsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlxuICAgIFRJY3VDb250YWluZXJOb2RlIHtcbiAgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uIHNob3J0LCBzbyB0aGF0IHRoZSBWTSB3aWxsIGlubGluZSBpdC5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlIHx8XG4gICAgICBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIHRIb3N0Tm9kZSwgYWRqdXN0ZWRJbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUsIHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlICYgVEljdUNvbnRhaW5lck5vZGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBpc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9XG4gICAgICBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiBwYXJlbnQgIT09IHRIb3N0Tm9kZTtcbiAgY29uc3QgdFBhcmVudE5vZGUgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCB0UGFyZW50Tm9kZSwgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBBc3NpZ24gYSBwb2ludGVyIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIG9mIGEgZ2l2ZW4gdmlldy4gVGhlIGZpcnN0IG5vZGUgaXMgbm90IGFsd2F5cyB0aGUgb25lXG4gIC8vIGF0IGluZGV4IDAsIGluIGNhc2Ugb2YgaTE4biwgaW5kZXggMCBjYW4gYmUgdGhlIGluc3RydWN0aW9uIGBpMThuU3RhcnRgIGFuZCB0aGUgZmlyc3Qgbm9kZSBoYXNcbiAgLy8gdGhlIGluZGV4IDEgb3IgbW9yZSwgc28gd2UgY2FuJ3QganVzdCBjaGVjayBub2RlIGluZGV4LlxuICBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmXG4gICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25UVmlld05vZGVUb0xWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudE5vZGU6IFROb2RlfG51bGwsIGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICAvLyBWaWV3IG5vZGVzIGFyZSBub3Qgc3RvcmVkIGluIGRhdGEgYmVjYXVzZSB0aGV5IGNhbiBiZSBhZGRlZCAvIHJlbW92ZWQgYXQgcnVudGltZSAod2hpY2hcbiAgLy8gd291bGQgY2F1c2UgaW5kaWNlcyB0byBjaGFuZ2UpLiBUaGVpciBUTm9kZXMgYXJlIGluc3RlYWQgc3RvcmVkIGluIHRWaWV3Lm5vZGUuXG4gIGxldCB0Tm9kZSA9IHRWaWV3Lm5vZGU7XG4gIGlmICh0Tm9kZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIHRQYXJlbnROb2RlICYmXG4gICAgICAgIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModFBhcmVudE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICB0Vmlldy5ub2RlID0gdE5vZGUgPSBjcmVhdGVUTm9kZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdFZpZXcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRQYXJlbnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgbnVsbCwgIC8vXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIFROb2RlVHlwZS5WaWV3LCBpbmRleCwgbnVsbCwgbnVsbCkgYXMgVFZpZXdOb2RlO1xuICB9XG5cbiAgbFZpZXdbVF9IT1NUXSA9IHROb2RlIGFzIFRWaWV3Tm9kZTtcbn1cblxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpIG9yIENvbXBvbmVudEZhY3RvcnkuY3JlYXRlKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIGBMVmlld2BcbiAqIEBwYXJhbSB2aWV3IFRoZSBgTFZpZXdgIGNvbnRhaW5pbmcgdGhlIGJsdWVwcmludCB0byBhZGp1c3RcbiAqIEBwYXJhbSBudW1TbG90c1RvQWxsb2MgVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBpbiB0aGUgTFZpZXcsIHNob3VsZCBiZSA+MFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBudW1TbG90c1RvQWxsb2M6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKFxuICAgICAgICAgIG51bVNsb3RzVG9BbGxvYywgMCwgJ1RoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2Mgc2hvdWxkIGJlIGdyZWF0ZXIgdGhhbiAwJyk7XG4gIGlmIChudW1TbG90c1RvQWxsb2MgPiAwKSB7XG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgICAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICAgICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICAgICAgICBsVmlldy5wdXNoKG51bGwpO1xuICAgICAgfVxuXG4gICAgICAvLyBXZSBzaG91bGQgb25seSBpbmNyZW1lbnQgdGhlIGV4cGFuZG8gc3RhcnQgaW5kZXggaWYgdGhlcmUgYXJlbid0IGFscmVhZHkgZGlyZWN0aXZlc1xuICAgICAgLy8gYW5kIGluamVjdG9ycyBzYXZlZCBpbiB0aGUgXCJleHBhbmRvXCIgc2VjdGlvblxuICAgICAgaWYgKCF0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICAgIHRWaWV3LmV4cGFuZG9TdGFydEluZGV4ICs9IG51bVNsb3RzVG9BbGxvYztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFNpbmNlIHdlJ3JlIGFkZGluZyB0aGUgZHluYW1pYyBub2RlcyBpbnRvIHRoZSBleHBhbmRvIHNlY3Rpb24sIHdlIG5lZWQgdG8gbGV0IHRoZSBob3N0XG4gICAgICAgIC8vIGJpbmRpbmdzIGtub3cgdGhhdCB0aGV5IHNob3VsZCBza2lwIHggc2xvdHNcbiAgICAgICAgdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucy5wdXNoKG51bVNsb3RzVG9BbGxvYyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdGhlIGNyZWF0aW9uIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gY3JlYXRpbmcgdmlldyBxdWVyeSBmdW5jdGlvbnMgKGlmIGFueSk7XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHRoZSBjcmVhdGlvbiBtb2RlO1xuICogLSB1cGRhdGluZyBzdGF0aWMgcXVlcmllcyAoaWYgYW55KTtcbiAqIC0gY3JlYXRpbmcgY2hpbGQgY29tcG9uZW50cyBkZWZpbmVkIGluIGEgZ2l2ZW4gdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclZpZXc8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IFQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBlbnRlclZpZXcobFZpZXcsIGxWaWV3W1RfSE9TVF0pO1xuICB0cnkge1xuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuQ3JlYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIEV4ZWN1dGUgYSB0ZW1wbGF0ZSBhc3NvY2lhdGVkIHdpdGggdGhpcyB2aWV3LCBpZiBpdCBleGlzdHMuIEEgdGVtcGxhdGUgZnVuY3Rpb24gbWlnaHQgbm90IGJlXG4gICAgLy8gZGVmaW5lZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IHRlbXBsYXRlRm4gPSB0Vmlldy50ZW1wbGF0ZTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzLlxuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgLy8gb2ZmIGZpcnN0Q3JlYXRlUGFzcy4gSWYgd2UgZG9uJ3Qgc2V0IGl0IGhlcmUsIGluc3RhbmNlcyB3aWxsIHBlcmZvcm0gZGlyZWN0aXZlXG4gICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gICAgLy8gY29udGVudCBxdWVyaWVzIGFyZSByZXNvbHZlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiAoaS5lLiB1cGRhdGUgbW9kZSksIGFmdGVyIGVtYmVkZGVkXG4gICAgLy8gdmlld3MgYXJlIHJlZnJlc2hlZCAoc2VlIGJsb2NrIGFib3ZlKS5cbiAgICBpZiAodFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIFdlIG11c3QgbWF0ZXJpYWxpemUgcXVlcnkgcmVzdWx0cyBiZWZvcmUgY2hpbGQgY29tcG9uZW50cyBhcmUgcHJvY2Vzc2VkXG4gICAgLy8gaW4gY2FzZSBhIGNoaWxkIGNvbXBvbmVudCBoYXMgcHJvamVjdGVkIGEgY29udGFpbmVyLiBUaGUgTENvbnRhaW5lciBuZWVkc1xuICAgIC8vIHRvIGV4aXN0IHNvIHRoZSBlbWJlZGRlZCB2aWV3cyBhcmUgcHJvcGVybHkgYXR0YWNoZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAgICBpZiAodFZpZXcuc3RhdGljVmlld1F1ZXJpZXMpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5VcGRhdGUsIHRWaWV3LnZpZXdRdWVyeSEsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlbmRlckNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cyk7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gSWYgd2UgZGlkbid0IG1hbmFnZSB0byBnZXQgcGFzdCB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBkdWUgdG9cbiAgICAvLyBhbiBlcnJvciwgbWFyayB0aGUgdmlldyBhcyBjb3JydXB0ZWQgc28gd2UgY2FuIHRyeSB0byByZWNvdmVyLlxuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIHRWaWV3LmluY29tcGxldGVGaXJzdFBhc3MgPSB0cnVlO1xuICAgIH1cblxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHVwZGF0ZSBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHVwZGF0ZSBtb2RlO1xuICogLSBleGVjdXRpbmcgaG9va3M7XG4gKiAtIHJlZnJlc2hpbmcgcXVlcmllcztcbiAqIC0gc2V0dGluZyBob3N0IGJpbmRpbmdzO1xuICogLSByZWZyZXNoaW5nIGNoaWxkIChlbWJlZGRlZCBhbmQgY29tcG9uZW50KSB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkKSByZXR1cm47XG4gIGVudGVyVmlldyhsVmlldywgbFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICB0cnkge1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuXG4gICAgc2V0QmluZGluZ0luZGV4KHRWaWV3LmJpbmRpbmdTdGFydEluZGV4KTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlKHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICBjb25zdCBob29rc0luaXRQaGFzZUNvbXBsZXRlZCA9XG4gICAgICAgIChmbGFncyAmIExWaWV3RmxhZ3MuSW5pdFBoYXNlU3RhdGVNYXNrKSA9PT0gSW5pdFBoYXNlU3RhdGUuSW5pdFBoYXNlQ29tcGxldGVkO1xuXG4gICAgLy8gZXhlY3V0ZSBwcmUtb3JkZXIgaG9va3MgKE9uSW5pdCwgT25DaGFuZ2VzLCBEb0NoZWNrKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpcnN0IG1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgYXJlIGRlY2xhcmVkIGluIHRoaXMgbFZpZXcgYXMgbmVlZGluZyBhIHJlZnJlc2ggYXQgdGhlaXJcbiAgICAvLyBpbnNlcnRpb24gcG9pbnRzLiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZSB0ZW1wbGF0ZSBpcyBkZWZpbmVkIGluIHRoaXNcbiAgICAvLyBgTFZpZXdgIGJ1dCBpdHMgZGVjbGFyYXRpb24gYXBwZWFycyBhZnRlciB0aGUgaW5zZXJ0aW9uIGNvbXBvbmVudC5cbiAgICBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3KTtcbiAgICByZWZyZXNoRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgY29udGVudCBob29rcyAoQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJDb250ZW50Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgc2V0SG9zdEJpbmRpbmdzQnlFeGVjdXRpbmdFeHBhbmRvSW5zdHJ1Y3Rpb25zKHRWaWV3LCBsVmlldyk7XG5cbiAgICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cyk7XG4gICAgfVxuXG4gICAgLy8gVmlldyBxdWVyaWVzIG11c3QgZXhlY3V0ZSBhZnRlciByZWZyZXNoaW5nIGNoaWxkIGNvbXBvbmVudHMgYmVjYXVzZSBhIHRlbXBsYXRlIGluIHRoaXMgdmlld1xuICAgIC8vIGNvdWxkIGJlIGluc2VydGVkIGluIGEgY2hpbGQgY29tcG9uZW50LiBJZiB0aGUgdmlldyBxdWVyeSBleGVjdXRlcyBiZWZvcmUgY2hpbGQgY29tcG9uZW50XG4gICAgLy8gcmVmcmVzaCwgdGhlIHRlbXBsYXRlIG1pZ2h0IG5vdCB5ZXQgYmUgaW5zZXJ0ZWQuXG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5VcGRhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSB2aWV3IGhvb2tzIChBZnRlclZpZXdJbml0LCBBZnRlclZpZXdDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCB2aWV3Q2hlY2tIb29rcyA9IHRWaWV3LnZpZXdDaGVja0hvb2tzO1xuICAgICAgICBpZiAodmlld0NoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgdmlld0NoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2aWV3SG9va3MgPSB0Vmlldy52aWV3SG9va3M7XG4gICAgICAgIGlmICh2aWV3SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHZpZXdIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzID09PSB0cnVlKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIG9ubHkgZmxpcCB0aGUgZmxhZyBvbiBzdWNjZXNzZnVsIGByZWZyZXNoVmlld2Agb25seVxuICAgICAgLy8gRG9uJ3QgZG8gdGhpcyBpbiBgZmluYWxseWAgYmxvY2suXG4gICAgICAvLyBJZiB3ZSBkaWQgdGhpcyBpbiBgZmluYWxseWAgYmxvY2sgdGhlbiBhbiBleGNlcHRpb24gY291bGQgYmxvY2sgdGhlIGV4ZWN1dGlvbiBvZiBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgd2hpY2ggaW4gdHVybiB3b3VsZCBiZSB1bmFibGUgdG8gaW5zZXJ0IHRoZW1zZWx2ZXMgaW50byB0aGUgc3R5bGluZyBsaW5rZWRcbiAgICAgIC8vIGxpc3QuIFRoZSByZXN1bHQgb2YgdGhpcyB3b3VsZCBiZSB0aGF0IGlmIHRoZSBleGNlcHRpb24gd291bGQgbm90IGJlIHRocm93IG9uIHN1YnNlcXVlbnQgQ0RcbiAgICAgIC8vIHRoZSBzdHlsaW5nIHdvdWxkIGJlIHVuYWJsZSB0byBwcm9jZXNzIGl0IGRhdGEgYW5kIHJlZmxlY3QgdG8gdGhlIERPTS5cbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIERvIG5vdCByZXNldCB0aGUgZGlydHkgc3RhdGUgd2hlbiBydW5uaW5nIGluIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4gV2UgZG9uJ3Qgd2FudCBjb21wb25lbnRzXG4gICAgLy8gdG8gYmVoYXZlIGRpZmZlcmVudGx5IGRlcGVuZGluZyBvbiB3aGV0aGVyIGNoZWNrIG5vIGNoYW5nZXMgaXMgZW5hYmxlZCBvciBub3QuIEZvciBleGFtcGxlOlxuICAgIC8vIE1hcmtpbmcgYW4gT25QdXNoIGNvbXBvbmVudCBhcyBkaXJ0eSBmcm9tIHdpdGhpbiB0aGUgYG5nQWZ0ZXJWaWV3SW5pdGAgaG9vayBpbiBvcmRlciB0b1xuICAgIC8vIHJlZnJlc2ggYSBgTmdDbGFzc2AgYmluZGluZyBzaG91bGQgd29yay4gSWYgd2Ugd291bGQgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIGluIHRoZSBjaGVja1xuICAgIC8vIG5vIGNoYW5nZXMgY3ljbGUsIHRoZSBjb21wb25lbnQgd291bGQgYmUgbm90IGJlIGRpcnR5IGZvciB0aGUgbmV4dCB1cGRhdGUgcGFzcy4gVGhpcyB3b3VsZFxuICAgIC8vIGJlIGRpZmZlcmVudCBpbiBwcm9kdWN0aW9uIG1vZGUgd2hlcmUgdGhlIGNvbXBvbmVudCBkaXJ0eSBzdGF0ZSBpcyBub3QgcmVzZXQuXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gICAgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXIsIC0xKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCBjcmVhdGlvbk1vZGVJc0FjdGl2ZSA9IGlzQ3JlYXRpb25Nb2RlKGxWaWV3KTtcbiAgdHJ5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICByZW5kZXJWaWV3KHRWaWV3LCBsVmlldywgY29udGV4dCk7XG4gICAgfVxuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSAmJiBsVmlldy5sZW5ndGggPiBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBpbmhlcmVudGx5IHNlbGVjdCAwIHNvIHdlIGRvbid0XG4gICAgICAvLyBoYXZlIHRvIGdlbmVyYXRlIHRoYXQgaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrcy5cbiAgICAgIHNlbGVjdEluZGV4SW50ZXJuYWwodFZpZXcsIGxWaWV3LCAwLCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG4gICAgfVxuICAgIHRlbXBsYXRlRm4ocmYsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgocHJldlNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSk7XG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgPT09IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSB7XG4gICAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgY29uc3QgdFZpZXcgPSBkZWYudFZpZXc7XG5cbiAgLy8gQ3JlYXRlIGEgVFZpZXcgaWYgdGhlcmUgaXNuJ3Qgb25lLCBvciByZWNyZWF0ZSBpdCBpZiB0aGUgZmlyc3QgY3JlYXRlIHBhc3MgZGlkbid0XG4gIC8vIGNvbXBsZXRlIHN1Y2Nlc3NmdWx5IHNpbmNlIHdlIGNhbid0IGtub3cgZm9yIHN1cmUgd2hldGhlciBpdCdzIGluIGEgdXNhYmxlIHNoYXBlLlxuICBpZiAodFZpZXcgPT09IG51bGwgfHwgdFZpZXcuaW5jb21wbGV0ZUZpcnN0UGFzcykge1xuICAgIHJldHVybiBkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgIFRWaWV3VHlwZS5Db21wb25lbnQsIC0xLCBkZWYudGVtcGxhdGUsIGRlZi5kZWNscywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLFxuICAgICAgICAgICAgICAgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5LCBkZWYuc2NoZW1hcywgZGVmLmNvbnN0cyk7XG4gIH1cblxuICByZXR1cm4gdFZpZXc7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdmlld0luZGV4IFRoZSB2aWV3QmxvY2tJZCBmb3IgaW5saW5lIHZpZXdzLCBvciAtMSBpZiBpdCdzIGEgY29tcG9uZW50L2R5bmFtaWNcbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHBpcGVzIFJlZ2lzdHJ5IG9mIHBpcGVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2aWV3UXVlcnkgVmlldyBxdWVyaWVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBzY2hlbWFzIFNjaGVtYXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIGNvbnN0cyBDb25zdGFudHMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdHlwZTogVFZpZXdUeXBlLCB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnxudWxsLCBkZWNsczogbnVtYmVyLFxuICAgIHZhcnM6IG51bWJlciwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnxudWxsLCBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgY29uc3RzOiBUQ29uc3RhbnRzfG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgZGVjbHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgcmV0dXJuIGJsdWVwcmludFtUVklFVyBhcyBhbnldID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUVmlld0NvbnN0cnVjdG9yKFxuICAgICAgICAgICAgIHR5cGUsXG4gICAgICAgICAgICAgdmlld0luZGV4LCAgIC8vIGlkOiBudW1iZXIsXG4gICAgICAgICAgICAgYmx1ZXByaW50LCAgIC8vIGJsdWVwcmludDogTFZpZXcsXG4gICAgICAgICAgICAgdGVtcGxhdGVGbiwgIC8vIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgLy8gcXVlcmllczogVFF1ZXJpZXN8bnVsbFxuICAgICAgICAgICAgIHZpZXdRdWVyeSwgICAvLyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsXG4gICAgICAgICAgICAgbnVsbCEsICAgICAgIC8vIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCxcbiAgICAgICAgICAgICBjbG9uZVRvVFZpZXdEYXRhKGJsdWVwcmludCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksICAvLyBkYXRhOiBURGF0YSxcbiAgICAgICAgICAgICBiaW5kaW5nU3RhcnRJbmRleCwgIC8vIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgaW5pdGlhbFZpZXdMZW5ndGgsICAvLyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsLFxuICAgICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgLy8gZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgLy8gZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgLy8gc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNsZWFudXA6IGFueVtdfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgICAgdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgP1xuICAgICAgICAgICAgICAgICBkaXJlY3RpdmVzKCkgOlxuICAgICAgICAgICAgICAgICBkaXJlY3RpdmVzLCAgLy8gZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsICAvLyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3RDaGlsZDogVE5vZGV8bnVsbCxcbiAgICAgICAgICAgICBzY2hlbWFzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgICAgICAgICAgY29uc3RzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3RzOiBUQ29uc3RhbnRzfG51bGxcbiAgICAgICAgICAgICBmYWxzZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmNvbXBsZXRlRmlyc3RQYXNzOiBib29sZWFuXG4gICAgICAgICAgICAgKSA6XG4gICAgICB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICAgICAgcXVlcmllczogbnVsbCxcbiAgICAgICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgICAgIG5vZGU6IG51bGwhLFxuICAgICAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgICAgIGZpcnN0Q3JlYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgZmlyc3RVcGRhdGVQYXNzOiB0cnVlLFxuICAgICAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgICAgIGNsZWFudXA6IG51bGwsXG4gICAgICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgICAgICBjb21wb25lbnRzOiBudWxsLFxuICAgICAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgICAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICAgICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICAgICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICAgICAgY29uc3RzOiBjb25zdHMsXG4gICAgICAgIGluY29tcGxldGVGaXJzdFBhc3M6IGZhbHNlXG4gICAgICB9O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5nRGV2TW9kZSA/IG5ldyBMVmlld0JsdWVwcmludCgpIDogW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsVmlld0xlbmd0aDsgaSsrKSB7XG4gICAgYmx1ZXByaW50LnB1c2goaSA8IGJpbmRpbmdTdGFydEluZGV4ID8gbnVsbCA6IE5PX0NIQU5HRSk7XG4gIH1cblxuICByZXR1cm4gYmx1ZXByaW50IGFzIExWaWV3O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbn1cblxuZnVuY3Rpb24gYXNzZXJ0SG9zdE5vZGVFeGlzdHMockVsZW1lbnQ6IFJFbGVtZW50LCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnR8c3RyaW5nKSB7XG4gIGlmICghckVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyRmFjdG9yeSBGYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSByZW5kZXJlciBpbnN0YW5jZS5cbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGVuY2Fwc3VsYXRpb24gVmlldyBFbmNhcHN1bGF0aW9uIGRlZmluZWQgZm9yIGNvbXBvbmVudCB0aGF0IHJlcXVlc3RzIGhvc3QgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudHxzdHJpbmcsXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24pOiBSRWxlbWVudCB7XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAvLyBXaGVuIHVzaW5nIG5hdGl2ZSBTaGFkb3cgRE9NLCBkbyBub3QgY2xlYXIgaG9zdCBlbGVtZW50IHRvIGFsbG93IG5hdGl2ZSBzbG90IHByb2plY3Rpb25cbiAgICBjb25zdCBwcmVzZXJ2ZUNvbnRlbnQgPSBlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb207XG4gICAgcmV0dXJuIHJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yLCBwcmVzZXJ2ZUNvbnRlbnQpO1xuICB9XG5cbiAgbGV0IHJFbGVtZW50ID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICByZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSEgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRIb3N0Tm9kZUV4aXN0cyhyRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3IpO1xuXG4gIC8vIEFsd2F5cyBjbGVhciBob3N0IGVsZW1lbnQncyBjb250ZW50IHdoZW4gUmVuZGVyZXIzIGlzIGluIHVzZS4gRm9yIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSB3ZVxuICAvLyBtYWtlIGl0IGRlcGVuZCBvbiB3aGV0aGVyIFNoYWRvd0RvbSBlbmNhcHN1bGF0aW9uIGlzIHVzZWQgKGluIHdoaWNoIGNhc2UgdGhlIGNvbnRlbnQgc2hvdWxkIGJlXG4gIC8vIHByZXNlcnZlZCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uKS4gU2hhZG93RG9tIGVuY2Fwc3VsYXRpb24gcmVxdWlyZXMgcHJvY2VkdXJhbFxuICAvLyByZW5kZXJlciwgYW5kIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSBpcyBoYW5kbGVkIGFib3ZlLlxuICByRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuXG4gIHJldHVybiByRWxlbWVudDtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRMQ2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh0VmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldExDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh0VmlldykucHVzaChsVmlld1tDTEVBTlVQXSEubGVuZ3RoIC0gMSwgbnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGlzIGBUTm9kZWAgYmVsb25ncyAodXNlZCBvbmx5IGluIGBuZ0Rldk1vZGVgKVxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhZGp1c3RlZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGFkanVzdGVkSW5kZXg6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIHJldHVybiBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVEZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVTdHlsaW5nTGFzdDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gZmxhZ3M6IFROb2RlRmxhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlc1xuICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsICAgICAgICAvLyB0YWdOYW1lOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLCAgLy8gYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAvLyBtZXJnZWRBdHRyc1xuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gY2hpbGQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdFBhcmVudCwgICAgLy8gcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBzdHlsZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyByZXNpZHVhbFN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjbGFzc2VzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNsYXNzZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyByZXNpZHVhbENsYXNzZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCBhcyBhbnksICAgLy8gY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAwIGFzIGFueSwgICAvLyBzdHlsZUJpbmRpbmdzOiBUU3R5bGluZ1JhbmdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogYWRqdXN0ZWRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3JJbmRleDogaW5qZWN0b3JJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlU3RhcnQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiBhdHRycyxcbiAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICB0Vmlld3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjaGlsZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0UGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHN0eWxlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzV2l0aG91dEhvc3Q6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc0JpbmRpbmdzOiAwIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVCaW5kaW5nczogMCBhcyBhbnksXG4gICAgICAgICAgICAgICAgICAgICB9O1xufVxuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIGlucHV0QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSwgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsXG4gICAgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBpbnB1dEFsaWFzTWFwKSB7XG4gICAgaWYgKGlucHV0QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSA9PT0gbnVsbCA/IHt9IDogcHJvcFN0b3JlO1xuICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gaW5wdXRBbGlhc01hcFtwdWJsaWNOYW1lXTtcblxuICAgICAgaWYgKHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZURlZklkeCwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgb3V0cHV0cyBhbmQgb3V0cHV0cy5cbiAqIEluaXRpYWxpemF0aW9uIGlzIGRvbmUgZm9yIGFsbCBkaXJlY3RpdmVzIG1hdGNoZWQgb24gYSBnaXZlbiBUTm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGRlZnMgPSB0Vmlldy5kYXRhO1xuXG4gIGNvbnN0IHROb2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgY29uc3QgaW5wdXRzRnJvbUF0dHJzOiBJbml0aWFsSW5wdXREYXRhID0gbmdEZXZNb2RlID8gbmV3IFROb2RlSW5pdGlhbElucHV0cygpIDogW107XG4gIGxldCBpbnB1dHNTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBsZXQgb3V0cHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBkaXJlY3RpdmVJbnB1dHMgPSBkaXJlY3RpdmVEZWYuaW5wdXRzO1xuICAgIC8vIERvIG5vdCB1c2UgdW5ib3VuZCBhdHRyaWJ1dGVzIGFzIGlucHV0cyB0byBzdHJ1Y3R1cmFsIGRpcmVjdGl2ZXMsIHNpbmNlIHN0cnVjdHVyYWxcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXRzIGNhbiBvbmx5IGJlIHNldCB1c2luZyBtaWNyb3N5bnRheCAoZS5nLiBgPGRpdiAqZGlyPVwiZXhwXCI+YCkuXG4gICAgLy8gVE9ETyhGVy0xOTMwKTogbWljcm9zeW50YXggZXhwcmVzc2lvbnMgbWF5IGFsc28gY29udGFpbiB1bmJvdW5kL3N0YXRpYyBhdHRyaWJ1dGVzLCB3aGljaFxuICAgIC8vIHNob3VsZCBiZSBzZXQgZm9yIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgY29uc3QgaW5pdGlhbElucHV0cyA9ICh0Tm9kZUF0dHJzICE9PSBudWxsICYmICFpc0lubGluZVRlbXBsYXRlKHROb2RlKSkgP1xuICAgICAgICBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoZGlyZWN0aXZlSW5wdXRzLCB0Tm9kZUF0dHJzKSA6XG4gICAgICAgIG51bGw7XG4gICAgaW5wdXRzRnJvbUF0dHJzLnB1c2goaW5pdGlhbElucHV0cyk7XG4gICAgaW5wdXRzU3RvcmUgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVJbnB1dHMsIGksIGlucHV0c1N0b3JlKTtcbiAgICBvdXRwdXRzU3RvcmUgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYub3V0cHV0cywgaSwgb3V0cHV0c1N0b3JlKTtcbiAgfVxuXG4gIGlmIChpbnB1dHNTdG9yZSAhPT0gbnVsbCkge1xuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ3N0eWxlJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dDtcbiAgICB9XG4gIH1cblxuICB0Tm9kZS5pbml0aWFsSW5wdXRzID0gaW5wdXRzRnJvbUF0dHJzO1xuICB0Tm9kZS5pbnB1dHMgPSBpbnB1dHNTdG9yZTtcbiAgdE5vZGUub3V0cHV0cyA9IG91dHB1dHNTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBQZXJmb3JtYW5jZSBub3RlOiB0aGlzIGZ1bmN0aW9uIGlzIHdyaXR0ZW4gYXMgYSBzZXJpZXMgb2YgaWYgY2hlY2tzIChpbnN0ZWFkIG9mLCBzYXksIGEgcHJvcGVydHlcbiAqIG9iamVjdCBsb29rdXApIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIC0gdGhlIHNlcmllcyBvZiBgaWZgIGNoZWNrcyBzZWVtcyB0byBiZSB0aGUgZmFzdGVzdCB3YXkgb2ZcbiAqIG1hcHBpbmcgcHJvcGVydHkgbmFtZXMuIERvIE5PVCBjaGFuZ2Ugd2l0aG91dCBiZW5jaG1hcmtpbmcuXG4gKlxuICogTm90ZTogdGhpcyBtYXBwaW5nIGhhcyB0byBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgZXF1YWxseSBuYW1lZCBtYXBwaW5nIGluIHRoZSB0ZW1wbGF0ZVxuICogdHlwZS1jaGVja2luZyBtYWNoaW5lcnkgb2Ygbmd0c2MuXG4gKi9cbmZ1bmN0aW9uIG1hcFByb3BOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChuYW1lID09PSAnY2xhc3MnKSByZXR1cm4gJ2NsYXNzTmFtZSc7XG4gIGlmIChuYW1lID09PSAnZm9yJykgcmV0dXJuICdodG1sRm9yJztcbiAgaWYgKG5hbWUgPT09ICdmb3JtYWN0aW9uJykgcmV0dXJuICdmb3JtQWN0aW9uJztcbiAgaWYgKG5hbWUgPT09ICdpbm5lckh0bWwnKSByZXR1cm4gJ2lubmVySFRNTCc7XG4gIGlmIChuYW1lID09PSAncmVhZG9ubHknKSByZXR1cm4gJ3JlYWRPbmx5JztcbiAgaWYgKG5hbWUgPT09ICd0YWJpbmRleCcpIHJldHVybiAndGFiSW5kZXgnO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCByZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsIG5hdGl2ZU9ubHk6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gIGxldCBpbnB1dERhdGEgPSB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiBpbnB1dERhdGEgIT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGRhdGFWYWx1ZSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIHROb2RlLmluZGV4KTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBwcm9wTmFtZSA9IG1hcFByb3BOYW1lKHByb3BOYW1lKTtcblxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllcyhwcm9wTmFtZSk7XG4gICAgICBpZiAoIXZhbGlkYXRlUHJvcGVydHkodFZpZXcsIGxWaWV3LCBlbGVtZW50LCBwcm9wTmFtZSwgdE5vZGUpKSB7XG4gICAgICAgIC8vIFJldHVybiBoZXJlIHNpbmNlIHdlIG9ubHkgbG9nIHdhcm5pbmdzIGZvciB1bmtub3duIHByb3BlcnRpZXMuXG4gICAgICAgIGxvZ1Vua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlXG4gICAgLy8gcHJvcGVydHkgaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBwcm9wTmFtZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBhIGNvbnRhaW5lciBhbmQgdGhlIHByb3BlcnR5IGRpZG4ndFxuICAgIC8vIG1hdGNoIGFueSBvZiB0aGUgaW5wdXRzIG9yIHNjaGVtYXMgd2Ugc2hvdWxkIHRocm93LlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgIW1hdGNoaW5nU2NoZW1hcyh0VmlldywgbFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICBsb2dVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgYXR0ck5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGF0dHJOYW1lKTtcbiAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSkgOlxuICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRlYnVnVmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHRleHRDb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgKGVsZW1lbnQgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gdGV4dENvbnRlbnQ7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8qKlxuICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICAgICAqIGkrMTogcHJpdmF0ZU5hbWVcbiAgICAgKlxuICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsxXVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdHlwZSwgZGF0YVZhbHVlW2kgKyAxXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm9wZXJ0eShcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsXG4gICAgdE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHRWaWV3LnNjaGVtYXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50XG4gIC8vIG9yIGl0IGlzIHN5bnRoZXRpYywgYW5kIHdlIGFyZSBpbiBhIGJyb3dzZXIgY29udGV4dCAod2ViIHdvcmtlciBub2RlcyBzaG91bGQgYmUgc2tpcHBlZCkuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXModFZpZXcsIGxWaWV3LCB0Tm9kZS50YWdOYW1lKSB8fCBwcm9wTmFtZSBpbiBlbGVtZW50IHx8XG4gICAgICBpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBOb3RlOiBgdHlwZW9mIE5vZGVgIHJldHVybnMgJ2Z1bmN0aW9uJyBpbiBtb3N0IGJyb3dzZXJzLCBidXQgb24gSUUgaXQgaXMgJ29iamVjdCcgc28gd2VcbiAgLy8gbmVlZCB0byBhY2NvdW50IGZvciBib3RoIGhlcmUsIHdoaWxlIGJlaW5nIGNhcmVmdWwgZm9yIGB0eXBlb2YgbnVsbGAgYWxzbyByZXR1cm5pbmcgJ29iamVjdCcuXG4gIHJldHVybiB0eXBlb2YgTm9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgTm9kZSA9PT0gbnVsbCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGFnTmFtZTogc3RyaW5nfG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IHRWaWV3LnNjaGVtYXM7XG5cbiAgaWYgKHNjaGVtYXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVtYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHNjaGVtYXNbaV07XG4gICAgICBpZiAoc2NoZW1hID09PSBOT19FUlJPUlNfU0NIRU1BIHx8XG4gICAgICAgICAgc2NoZW1hID09PSBDVVNUT01fRUxFTUVOVFNfU0NIRU1BICYmIHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogTG9ncyBhbiBlcnJvciB0aGF0IGEgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBvbiBhbiBlbGVtZW50LlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHkuXG4gKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIGxvZ1Vua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBjb25zb2xlLmVycm9yKFxuICAgICAgYENhbid0IGJpbmQgdG8gJyR7cHJvcE5hbWV9JyBzaW5jZSBpdCBpc24ndCBhIGtub3duIHByb3BlcnR5IG9mICcke3ROb2RlLnRhZ05hbWV9Jy5gKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBkZWY6IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIGxWaWV3LCBkZWYpO1xuICB9XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgbFZpZXcubGVuZ3RoIC0gMSwgcm9vdFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShyb290VE5vZGUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIG1hdGNoZWQgZGlyZWN0aXZlcyBvbiBhIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXXxudWxsKTogYm9vbGVhbiB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluXG4gIC8vIHRzaWNrbGUuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIGxldCBoYXNEaXJlY3RpdmVzID0gZmFsc2U7XG4gIGlmIChnZXRCaW5kaW5nc0VuYWJsZWQoKSkge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZnM6IERpcmVjdGl2ZURlZjxhbnk+W118bnVsbCA9IGZpbmREaXJlY3RpdmVEZWZNYXRjaGVzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSA9IGxvY2FsUmVmcyA9PT0gbnVsbCA/IG51bGwgOiB7Jyc6IC0xfTtcblxuICAgIGlmIChkaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICBsZXQgdG90YWxEaXJlY3RpdmVIb3N0VmFycyA9IDA7XG4gICAgICBoYXNEaXJlY3RpdmVzID0gdHJ1ZTtcbiAgICAgIGluaXRUTm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlRGVmcy5sZW5ndGgpO1xuICAgICAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAgICAgLy8gdGhlIHZpZXdFbmdpbmU6XG4gICAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgICAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgICAgIC8vIFNvIHRvIG1hdGNoIHRoZXNlIHJ1bGVzLCB0aGUgb3JkZXIgaW4gd2hpY2ggcHJvdmlkZXJzIGFyZSBhZGRlZCBpbiB0aGUgYXJyYXlzIGlzIHZlcnlcbiAgICAgIC8vIGltcG9ydGFudC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlRGVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVEZWZzW2ldO1xuICAgICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICAgIH1cbiAgICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHROb2RlLCBkaXJlY3RpdmVEZWZzLmxlbmd0aCk7XG4gICAgICBsZXQgcHJlT3JkZXJIb29rc0ZvdW5kID0gZmFsc2U7XG4gICAgICBsZXQgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSBmYWxzZTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlRGVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVEZWZzW2ldO1xuICAgICAgICAvLyBNZXJnZSB0aGUgYXR0cnMgaW4gdGhlIG9yZGVyIG9mIG1hdGNoZXMuIFRoaXMgYXNzdW1lcyB0aGF0IHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBpdHNlbGYsIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgdGhlIGxlYXN0IHByaW9yaXR5LlxuICAgICAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcblxuICAgICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0VmlldywgbFZpZXcsIGRlZik7XG5cbiAgICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcCh0Vmlldy5kYXRhIS5sZW5ndGggLSAxLCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICAgICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdEF0dHJzICE9PSBudWxsIHx8IGRlZi5ob3N0VmFycyAhPT0gMClcbiAgICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgICAgICAvLyBPbmx5IHB1c2ggYSBub2RlIGluZGV4IGludG8gdGhlIHByZU9yZGVySG9va3MgYXJyYXkgaWYgdGhpcyBpcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgICAgICBpZiAoIXByZU9yZGVySG9va3NGb3VuZCAmJiAoZGVmLm9uQ2hhbmdlcyB8fCBkZWYub25Jbml0IHx8IGRlZi5kb0NoZWNrKSkge1xuICAgICAgICAgIC8vIFdlIHdpbGwgcHVzaCB0aGUgYWN0dWFsIGhvb2sgZnVuY3Rpb24gaW50byB0aGlzIGFycmF5IGxhdGVyIGR1cmluZyBkaXIgaW5zdGFudGlhdGlvbi5cbiAgICAgICAgICAvLyBXZSBjYW5ub3QgZG8gaXQgbm93IGJlY2F1c2Ugd2UgbXVzdCBlbnN1cmUgaG9va3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIHNhbWVcbiAgICAgICAgICAvLyBvcmRlciB0aGF0IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgKGkuZS4gaW5qZWN0aW9uIG9yZGVyKS5cbiAgICAgICAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaCh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgICAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kICYmIChkZWYub25DaGFuZ2VzIHx8IGRlZi5kb0NoZWNrKSkge1xuICAgICAgICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtdKSlcbiAgICAgICAgICAgICAgLnB1c2godE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICAgICAgICBwcmVPcmRlckNoZWNrSG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRIb3N0QmluZGluZ3NUb0V4cGFuZG9JbnN0cnVjdGlvbnModFZpZXcsIGRlZik7XG4gICAgICAgIHRvdGFsRGlyZWN0aXZlSG9zdFZhcnMgKz0gZGVmLmhvc3RWYXJzO1xuICAgICAgfVxuXG4gICAgICBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICBncm93SG9zdFZhcnNTcGFjZSh0VmlldywgbFZpZXcsIHRvdGFsRGlyZWN0aXZlSG9zdFZhcnMpO1xuICAgIH1cbiAgICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG4gIH1cbiAgLy8gTWVyZ2UgdGhlIHRlbXBsYXRlIGF0dHJzIGxhc3Qgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGhpZ2hlc3QgcHJpb3JpdHkuXG4gIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIHROb2RlLmF0dHJzKTtcbiAgcmV0dXJuIGhhc0RpcmVjdGl2ZXM7XG59XG5cbi8qKlxuICogQWRkIGBob3N0QmluZGluZ3NgIHRvIHRoZSBgVFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhlIGBob3N0QmluZGluZ3NgIHNob3VsZCBiZSBhZGRlZC5cbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEhvc3RCaW5kaW5nc1RvRXhwYW5kb0luc3RydWN0aW9ucyhcbiAgICB0VmlldzogVFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPGFueT58RGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zITtcbiAgLy8gVE9ETyhtaXNrbyk6IFBFUkYgd2UgYXJlIGFkZGluZyBgaG9zdEJpbmRpbmdzYCBldmVuIGlmIHRoZXJlIGlzIG5vdGhpbmcgdG8gYWRkISBUaGlzIGlzXG4gIC8vIHN1Ym9wdGltYWwgZm9yIHBlcmZvcm1hbmNlLiBgZGVmLmhvc3RCaW5kaW5nc2AgbWF5IGJlIG51bGwsXG4gIC8vIGJ1dCB3ZSBzdGlsbCBuZWVkIHRvIHB1c2ggbnVsbCB0byB0aGUgYXJyYXkgYXMgYSBwbGFjZWhvbGRlclxuICAvLyB0byBlbnN1cmUgdGhlIGRpcmVjdGl2ZSBjb3VudGVyIGlzIGluY3JlbWVudGVkIChzbyBob3N0XG4gIC8vIGJpbmRpbmcgZnVuY3Rpb25zIGFsd2F5cyBsaW5lIHVwIHdpdGggdGhlIGNvcnJlY3RpdmUgZGlyZWN0aXZlKS5cbiAgLy8gVGhpcyBpcyBzdWJvcHRpbWFsIGZvciBwZXJmb3JtYW5jZS4gU2VlIGBjdXJyZW50RGlyZWN0aXZlSW5kZXhgXG4gIC8vICBjb21tZW50IGluIGBzZXRIb3N0QmluZGluZ3NCeUV4ZWN1dGluZ0V4cGFuZG9JbnN0cnVjdGlvbnNgIGZvciBtb3JlXG4gIC8vIGRldGFpbHMuICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyk7XG4gIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgY29uc3QgaG9zdFZhcnMgPSBkZWYuaG9zdFZhcnM7XG4gIGlmIChob3N0VmFycyAhPT0gMCkge1xuICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdFZhcnMpO1xuICB9XG59XG5cbi8qKlxuICogR3JvdyB0aGUgYExWaWV3YCwgYmx1ZXByaW50IGFuZCBgVFZpZXcuZGF0YWAgdG8gYWNjb21tb2RhdGUgdGhlIGBob3N0QmluZGluZ3NgLlxuICpcbiAqIFRvIHN1cHBvcnQgbG9jYWxpdHkgd2UgZG9uJ3Qga25vdyBhaGVhZCBvZiB0aW1lIGhvdyBtYW55IGBob3N0VmFyc2Agb2YgdGhlIGNvbnRhaW5pbmcgZGlyZWN0aXZlc1xuICogd2UgbmVlZCB0byBhbGxvY2F0ZS4gRm9yIHRoaXMgcmVhc29uIHdlIGFsbG93IGdyb3dpbmcgdGhlc2UgZGF0YSBzdHJ1Y3R1cmVzIGFzIHdlIGRpc2NvdmVyIG1vcmVcbiAqIGRpcmVjdGl2ZXMgdG8gYWNjb21tb2RhdGUgdGhlbS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB3aGljaCBuZWVkcyB0byBiZSBncm93bi5cbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGdyb3duLlxuICogQHBhcmFtIGNvdW50IFNpemUgYnkgd2hpY2ggd2UgbmVlZCB0byBncm93IHRoZSBkYXRhIHN0cnVjdHVyZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBncm93SG9zdFZhcnNTcGFjZSh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY291bnQ6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFNhbWUodFZpZXcsIGxWaWV3W1RWSUVXXSwgJ2BMVmlld2AgbXVzdCBiZSBhc3NvY2lhdGVkIHdpdGggYFRWaWV3YCEnKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgbFZpZXcucHVzaChOT19DSEFOR0UpO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSwgbmF0aXZlOiBSTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghdFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG5cbiAgY29uc3QgaW5pdGlhbElucHV0cyA9IHROb2RlLmluaXRpYWxJbnB1dHM7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBpc0NvbXBvbmVudCA9IGlzQ29tcG9uZW50RGVmKGRlZik7XG5cbiAgICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUgYXMgVEVsZW1lbnROb2RlLCBkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyE7XG4gIGNvbnN0IGZpcnN0Q3JlYXRlUGFzcyA9IHRWaWV3LmZpcnN0Q3JlYXRlUGFzcztcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgICBleHBhbmRvLnB1c2gobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbiAqXG4gKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiAqIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICdFeHBhbmRvIGJsb2NrIHNob3VsZCBvbmx5IGJlIGdlbmVyYXRlZCBvbiBmaXJzdCBjcmVhdGUgcGFzcy4nKTtcblxuICAvLyBJbXBvcnRhbnQ6IEluIEpTIGAteGAgYW5kIGAwLXhgIGlzIG5vdCB0aGUgc2FtZSEgSWYgYHg9PT0wYCB0aGVuIGAteGAgd2lsbCBwcm9kdWNlIGAtMGAgd2hpY2hcbiAgLy8gcmVxdWlyZXMgbm9uIHN0YW5kYXJkIG1hdGggYXJpdGhtZXRpYyBhbmQgaXQgY2FuIHByZXZlbnQgVk0gb3B0aW1pemF0aW9ucy5cbiAgLy8gYDAtMGAgd2lsbCBhbHdheXMgcHJvZHVjZSBgMGAgYW5kIHdpbGwgbm90IGNhdXNlIGEgcG90ZW50aWFsIGRlb3B0aW1pemF0aW9uIGluIFZNLlxuICBjb25zdCBlbGVtZW50SW5kZXggPSBIRUFERVJfT0ZGU0VUIC0gdE5vZGUuaW5kZXg7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW10pKVxuICAgICAgLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBuZ0Rldk1vZGUgPyBuZXcgTWF0Y2hlc0FycmF5KCkgOiBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdFZpZXcsIGRlZi50eXBlKTtcblxuICAgICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlKTtcbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgZ2l2ZW4gVE5vZGUgYXMgYSBjb21wb25lbnQncyBob3N0LiBUaGlzIGNvbnNpc3RzIG9mOlxuICogLSBzZXR0aW5nIGFwcHJvcHJpYXRlIFROb2RlIGZsYWdzO1xuICogLSBzdG9yaW5nIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXc6IFRWaWV3LCBob3N0VE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBob3N0VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3Q7XG4gICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gbmdEZXZNb2RlID8gbmV3IFRWaWV3Q29tcG9uZW50cygpIDogW10pKVxuICAgICAgLnB1c2goaG9zdFROb2RlLmluZGV4KTtcbn1cblxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUxvY2FsTmFtZXMoKSA6IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRUTm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3Q7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPih0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4pIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIG51bGwpO1xuICB0Vmlldy5ibHVlcHJpbnQucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbiAgdmlld0RhdGEucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4obFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZik7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG5hdGl2ZSxcbiAgICAgICAgICBob3N0VE5vZGUgYXMgVEVsZW1lbnROb2RlLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihuYXRpdmUsIGRlZikpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZSk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgc2FuaXRpemVyID09IG51bGwgPyByZW5kZXJTdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBuYW1lKTtcblxuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlLCBuYW1lc3BhY2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lc3BhY2UgPyBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBMVmlldyB0aGF0IGlzIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBkZWYgVGhlIGRpcmVjdGl2ZSBkZWYgdGhhdCBjb250YWlucyB0aGUgbGlzdCBvZiBpbnB1dHNcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIHROb2RlOiBUTm9kZSxcbiAgICBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhKTogdm9pZCB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGEhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgZGVmLnNldElucHV0IShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gYXR0cnMgVGhlIHN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIGF0dHJzOiBUQXR0cmlidXRlcyk6IEluaXRpYWxJbnB1dHN8XG4gICAgbnVsbCB7XG4gIGxldCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzfG51bGwgPSBudWxsO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIFdlIGRvIG5vdCBhbGxvdyBpbnB1dHMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICAgICAgaSArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlByb2plY3RBcykge1xuICAgICAgLy8gU2tpcCBvdmVyIHRoZSBgbmdQcm9qZWN0QXNgIHZhbHVlLlxuICAgICAgaSArPSAyO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGl0IGFueSBvdGhlciBhdHRyaWJ1dGUgbWFya2Vycywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09PSAnbnVtYmVyJykgYnJlYWs7XG5cbiAgICBpZiAoaW5wdXRzLmhhc093blByb3BlcnR5KGF0dHJOYW1lIGFzIHN0cmluZykpIHtcbiAgICAgIGlmIChpbnB1dHNUb1N0b3JlID09PSBudWxsKSBpbnB1dHNUb1N0b3JlID0gW107XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUgYXMgc3RyaW5nLCBpbnB1dHNbYXR0ck5hbWUgYXMgc3RyaW5nXSwgYXR0cnNbaSArIDFdIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbnB1dHNUb1N0b3JlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gTm90IHN1cmUgd2h5IEkgbmVlZCB0byBkbyBgYW55YCBoZXJlIGJ1dCBUUyBjb21wbGFpbnMgbGF0ZXIuXG5jb25zdCBMQ29udGFpbmVyQXJyYXk6IGFueSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpICYmXG4gICAgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb250YWluZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCxcbiAgICB0Tm9kZTogVE5vZGUpOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgbmdEZXZNb2RlICYmICFpc1Byb2NlZHVyYWxSZW5kZXJlcihjdXJyZW50Vmlld1tSRU5ERVJFUl0pICYmIGFzc2VydERvbU5vZGUobmF0aXZlKTtcbiAgLy8gaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LWxpdGVyYWwtdnMtbmV3LWFycmF5LXJlYWxseVxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gbmV3IChuZ0Rldk1vZGUgPyBMQ29udGFpbmVyQXJyYXkgOiBBcnJheSkoXG4gICAgICBob3N0TmF0aXZlLCAgIC8vIGhvc3QgbmF0aXZlXG4gICAgICB0cnVlLCAgICAgICAgIC8vIEJvb2xlYW4gYHRydWVgIGluIHRoaXMgcG9zaXRpb24gc2lnbmlmaWVzIHRoYXQgdGhpcyBpcyBhbiBgTENvbnRhaW5lcmBcbiAgICAgIGZhbHNlLCAgICAgICAgLy8gaGFzIHRyYW5zcGxhbnRlZCB2aWV3c1xuICAgICAgY3VycmVudFZpZXcsICAvLyBwYXJlbnRcbiAgICAgIG51bGwsICAgICAgICAgLy8gbmV4dFxuICAgICAgMCwgICAgICAgICAgICAvLyB0cmFuc3BsYW50ZWQgdmlld3MgdG8gcmVmcmVzaCBjb3VudFxuICAgICAgdE5vZGUsICAgICAgICAvLyB0X2hvc3RcbiAgICAgIG5hdGl2ZSwgICAgICAgLy8gbmF0aXZlLFxuICAgICAgbnVsbCwgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICAgIG51bGwsICAgICAgICAgLy8gbW92ZWQgdmlld3NcbiAgKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBsQ29udGFpbmVyLmxlbmd0aCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsXG4gICAgICAgICAgJ1Nob3VsZCBhbGxvY2F0ZSBjb3JyZWN0IG51bWJlciBvZiBzbG90cyBmb3IgTENvbnRhaW5lciBoZWFkZXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMQ29udGFpbmVyRGVidWcobENvbnRhaW5lcik7XG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG4vKipcbiAqIEdvZXMgb3ZlciBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzXG4gKiB0aGVtIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gZW1iZWRkZWRMVmlld1tUVklFV107XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbWJlZGRlZFRWaWV3LCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGVtYmVkZGVkTFZpZXcpKSB7XG4gICAgICAgIHJlZnJlc2hWaWV3KGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0hKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXJrIHRyYW5zcGxhbnRlZCB2aWV3cyBhcyBuZWVkaW5nIHRvIGJlIHJlZnJlc2hlZCBhdCB0aGVpciBpbnNlcnRpb24gcG9pbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IG1heSBoYXZlIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqL1xuZnVuY3Rpb24gbWFya1RyYW5zcGxhbnRlZFZpZXdzRm9yUmVmcmVzaChsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgaWYgKCFsQ29udGFpbmVyW0hBU19UUkFOU1BMQU5URURfVklFV1NdKSBjb250aW51ZTtcblxuICAgIGNvbnN0IG1vdmVkVmlld3MgPSBsQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRWaWV3cywgJ1RyYW5zcGxhbnRlZCBWaWV3IGZsYWdzIHNldCBidXQgbWlzc2luZyBNT1ZFRF9WSUVXUycpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbW92ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0hO1xuICAgICAgY29uc3QgaW5zZXJ0aW9uTENvbnRhaW5lciA9IG1vdmVkTFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgICAvLyBXZSBkb24ndCB3YW50IHRvIGluY3JlbWVudCB0aGUgY291bnRlciBpZiB0aGUgbW92ZWQgTFZpZXcgd2FzIGFscmVhZHkgbWFya2VkIGZvclxuICAgICAgLy8gcmVmcmVzaC5cbiAgICAgIGlmICgobW92ZWRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3KSA9PT0gMCkge1xuICAgICAgICB1cGRhdGVUcmFuc3BsYW50ZWRWaWV3Q291bnQoaW5zZXJ0aW9uTENvbnRhaW5lciwgMSk7XG4gICAgICB9XG4gICAgICAvLyBOb3RlLCBpdCBpcyBwb3NzaWJsZSB0aGF0IHRoZSBgbW92ZWRWaWV3c2AgaXMgdHJhY2tpbmcgdmlld3MgdGhhdCBhcmUgdHJhbnNwbGFudGVkICphbmQqXG4gICAgICAvLyB0aG9zZSB0aGF0IGFyZW4ndCAoZGVjbGFyYXRpb24gY29tcG9uZW50ID09PSBpbnNlcnRpb24gY29tcG9uZW50KS4gSW4gdGhlIGxhdHRlciBjYXNlLFxuICAgICAgLy8gaXQncyBmaW5lIHRvIGFkZCB0aGUgZmxhZywgYXMgd2Ugd2lsbCBjbGVhciBpdCBpbW1lZGlhdGVseSBpblxuICAgICAgLy8gYHJlZnJlc2hFbWJlZGRlZFZpZXdzYCBmb3IgdGhlIHZpZXcgY3VycmVudGx5IGJlaW5nIHJlZnJlc2hlZC5cbiAgICAgIG1vdmVkTFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXc7XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpKSB7XG4gICAgY29uc3QgdFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgICBpZiAoY29tcG9uZW50Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgICByZWZyZXNoVmlldyh0VmlldywgY29tcG9uZW50VmlldywgdFZpZXcudGVtcGxhdGUsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xuICAgIH0gZWxzZSBpZiAoY29tcG9uZW50Vmlld1tUUkFOU1BMQU5URURfVklFV1NfVE9fUkVGUkVTSF0gPiAwKSB7XG4gICAgICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gICAgICByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcoY29tcG9uZW50Vmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVmcmVzaGVzIGFsbCB0cmFuc3BsYW50ZWQgdmlld3MgbWFya2VkIHdpdGggYExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdgIHRoYXQgYXJlXG4gKiBjaGlsZHJlbiBvciBkZXNjZW5kYW50cyBvZiB0aGUgZ2l2ZW4gbFZpZXcuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBsVmlldyB3aGljaCBjb250YWlucyBkZXNjZW5kYW50IHRyYW5zcGxhbnRlZCB2aWV3cyB0aGF0IG5lZWQgdG8gYmUgcmVmcmVzaGVkLlxuICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgICAgaWYgKGVtYmVkZGVkTFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldykge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gZW1iZWRkZWRMVmlld1tUVklFV107XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVtYmVkZGVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZWZyZXNoVmlldyhlbWJlZGRlZFRWaWV3LCBlbWJlZGRlZExWaWV3LCBlbWJlZGRlZFRWaWV3LnRlbXBsYXRlLCBlbWJlZGRlZExWaWV3W0NPTlRFWFRdISk7XG4gICAgICB9IGVsc2UgaWYgKGVtYmVkZGVkTFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgICByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcoZW1iZWRkZWRMVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50c1tpXSwgbFZpZXcpO1xuICAgICAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoY29tcG9uZW50VmlldykgJiZcbiAgICAgICAgICBjb21wb25lbnRWaWV3W1RSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNIXSA+IDApIHtcbiAgICAgICAgcmVmcmVzaENvbnRhaW5zRGlydHlWaWV3KGNvbXBvbmVudFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiByZW5kZXJDb21wb25lbnQoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgc3luY1ZpZXdXaXRoQmx1ZXByaW50KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3KTtcbiAgcmVuZGVyVmlldyhjb21wb25lbnRUVmlldywgY29tcG9uZW50VmlldywgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXcgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiAzLiBTZWNvbmQgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXcgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBgVFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGJsdWVwcmludCBmb3Igc3luY2luZ1xuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHRvIHN5bmNcbiAqL1xuZnVuY3Rpb24gc3luY1ZpZXdXaXRoQmx1ZXByaW50KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGkgPSBsVmlldy5sZW5ndGg7IGkgPCB0Vmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBsVmlldy5wdXNoKHRWaWV3LmJsdWVwcmludFtpXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3IG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihsVmlldzogTFZpZXcsIGxWaWV3T3JMQ29udGFpbmVyOiBUKTogVCB7XG4gIC8vIFRPRE8oYmVubGVzaC9taXNrbyk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgaW5jb3JyZWN0LCBiZWNhdXNlIGl0IGFsd2F5cyBhZGRzIHRoZSBMQ29udGFpbmVyXG4gIC8vIHRvIHRoZSBlbmQgb2YgdGhlIHF1ZXVlLCB3aGljaCBtZWFucyBpZiB0aGUgZGV2ZWxvcGVyIHJldHJpZXZlcyB0aGUgTENvbnRhaW5lcnMgZnJvbSBSTm9kZXMgb3V0XG4gIC8vIG9mIG9yZGVyLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biBvdXQgb2Ygb3JkZXIsIGFzIHRoZSBhY3Qgb2YgcmV0cmlldmluZyB0aGUgdGhlXG4gIC8vIExDb250YWluZXIgZnJvbSB0aGUgUk5vZGUgaXMgd2hhdCBhZGRzIGl0IHRvIHRoZSBxdWV1ZS5cbiAgaWYgKGxWaWV3W0NISUxEX0hFQURdKSB7XG4gICAgbFZpZXdbQ0hJTERfVEFJTF0hW05FWFRdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgbFZpZXdbQ0hJTERfSEVBRF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfVxuICBsVmlld1tDSElMRF9UQUlMXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICByZXR1cm4gbFZpZXdPckxDb250YWluZXI7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8qKlxuICogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5LlxuICpcbiAqIFJldHVybnMgdGhlIHJvb3QgdmlldyBiZWNhdXNlIGl0IGlzIGZvdW5kIGFzIGEgYnlwcm9kdWN0IG9mIG1hcmtpbmcgdGhlIHZpZXcgdHJlZVxuICogZGlydHksIGFuZCBjYW4gYmUgdXNlZCBieSBtZXRob2RzIHRoYXQgY29uc3VtZSBtYXJrVmlld0RpcnR5KCkgdG8gZWFzaWx5IHNjaGVkdWxlXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uLiBPdGhlcndpc2UsIHN1Y2ggbWV0aG9kcyB3b3VsZCBuZWVkIHRvIHRyYXZlcnNlIHVwIHRoZSB2aWV3IHRyZWVcbiAqIGFuIGFkZGl0aW9uYWwgdGltZSB0byBnZXQgdGhlIHJvb3QgdmlldyBhbmQgc2NoZWR1bGUgYSB0aWNrIG9uIGl0LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgc3RhcnRpbmcgTFZpZXcgdG8gbWFyayBkaXJ0eVxuICogQHJldHVybnMgdGhlIHJvb3QgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkobFZpZXc6IExWaWV3KTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChsVmlldykge1xuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGNvbnN0IHBhcmVudCA9IGdldExWaWV3UGFyZW50KGxWaWV3KTtcbiAgICAvLyBTdG9wIHRyYXZlcnNpbmcgdXAgYXMgc29vbiBhcyB5b3UgZmluZCBhIHJvb3QgdmlldyB0aGF0IHdhc24ndCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyXG4gICAgaWYgKGlzUm9vdFZpZXcobFZpZXcpICYmICFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBsVmlldztcbiAgICB9XG4gICAgLy8gY29udGludWUgb3RoZXJ3aXNlXG4gICAgbFZpZXcgPSBwYXJlbnQhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2socm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyEobnVsbCk7XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dDogUm9vdENvbnRleHQpIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCByb290Q29udGV4dC5jb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3Qgcm9vdENvbXBvbmVudCA9IHJvb3RDb250ZXh0LmNvbXBvbmVudHNbaV07XG4gICAgY29uc3QgbFZpZXcgPSByZWFkUGF0Y2hlZExWaWV3KHJvb3RDb21wb25lbnQpITtcbiAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIHJvb3RDb21wb25lbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW50ZXJuYWw8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICB0cnkge1xuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIGNvbnRleHQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgfVxufVxuXG4vKipcbiAqIFN5bmNocm9ub3VzbHkgcGVyZm9ybSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIHBlcmZvcm1lZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICB0aWNrUm9vdENvbnRleHQobFZpZXdbQ09OVEVYVF0gYXMgUm9vdENvbnRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih0VmlldzogVFZpZXcsIHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodFZpZXcsIHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFxuICAgIGZsYWdzOiBSZW5kZXJGbGFncywgdmlld1F1ZXJ5Rm46IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+LCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1F1ZXJ5Rm4sICdWaWV3IHF1ZXJpZXMgZnVuY3Rpb24gdG8gZXhlY3V0ZSBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KDApO1xuICB2aWV3UXVlcnlGbihmbGFncywgY29tcG9uZW50KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBTdG9yZXMgbWV0YS1kYXRhIGZvciBhIHByb3BlcnR5IGJpbmRpbmcgdG8gYmUgdXNlZCBieSBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYC5cbiAqXG4gKiBJbiBvcmRlciB0byBzdXBwb3J0IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgIHdlIG5lZWQgdG8gc2F2ZSwgZm9yIGVhY2ggYmluZGluZzpcbiAqIC0gYSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogLSBhIHN0YXRpYyBwYXJ0cyBvZiBpbnRlcnBvbGF0ZWQgc3RyaW5ncztcbiAqXG4gKiBBIGdpdmVuIHByb3BlcnR5IG1ldGFkYXRhIGlzIHNhdmVkIGF0IHRoZSBiaW5kaW5nJ3MgaW5kZXggaW4gdGhlIGBUVmlldy5kYXRhYCAoaW4gb3RoZXIgd29yZHMsIGFcbiAqIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEgd2lsbCBiZSBzdG9yZWQgaW4gYFRWaWV3LmRhdGFgIGF0IHRoZSBzYW1lIGluZGV4IGFzIGEgYm91bmQgdmFsdWUgaW5cbiAqIGBMVmlld2ApLiBNZXRhZGF0YSBhcmUgcmVwcmVzZW50ZWQgYXMgYElOVEVSUE9MQVRJT05fREVMSU1JVEVSYC1kZWxpbWl0ZWQgc3RyaW5nIHdpdGggdGhlXG4gKiBmb2xsb3dpbmcgZm9ybWF0OlxuICogLSBgcHJvcGVydHlOYW1lYCBmb3IgYm91bmQgcHJvcGVydGllcztcbiAqIC0gYHByb3BlcnR5TmFtZe+/vXByZWZpeO+/vWludGVycG9sYXRpb25fc3RhdGljX3BhcnQx77+9Li5pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Tu+/vXN1ZmZpeGAgZm9yXG4gKiBpbnRlcnBvbGF0ZWQgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSBtZXRhLWRhdGEgd2lsbCBiZSBzYXZlZDtcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRoYXQgaXMgYSB0YXJnZXQgb2YgdGhlIGJpbmRpbmc7XG4gKiBAcGFyYW0gcHJvcGVydHlOYW1lIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGJpbmRpbmcgaW5kZXggaW4gYExWaWV3YFxuICogQHBhcmFtIGludGVycG9sYXRpb25QYXJ0cyBzdGF0aWMgaW50ZXJwb2xhdGlvbiBwYXJ0cyAoZm9yIHByb3BlcnR5IGludGVycG9sYXRpb25zKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIC4uLmludGVycG9sYXRpb25QYXJ0czogc3RyaW5nW10pIHtcbiAgLy8gQmluZGluZyBtZXRhLWRhdGEgYXJlIHN0b3JlZCBvbmx5IHRoZSBmaXJzdCB0aW1lIGEgZ2l2ZW4gcHJvcGVydHkgaW5zdHJ1Y3Rpb24gaXMgcHJvY2Vzc2VkLlxuICAvLyBTaW5jZSB3ZSBkb24ndCBoYXZlIGEgY29uY2VwdCBvZiB0aGUgXCJmaXJzdCB1cGRhdGUgcGFzc1wiIHdlIG5lZWQgdG8gY2hlY2sgZm9yIHByZXNlbmNlIG9mIHRoZVxuICAvLyBiaW5kaW5nIG1ldGEtZGF0YSB0byBkZWNpZGUgaWYgb25lIHNob3VsZCBiZSBzdG9yZWQgKG9yIGlmIHdhcyBzdG9yZWQgYWxyZWFkeSkuXG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXhdID09PSBudWxsKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PSBudWxsIHx8ICF0Tm9kZS5pbnB1dHNbcHJvcGVydHlOYW1lXSkge1xuICAgICAgY29uc3QgcHJvcEJpbmRpbmdJZHhzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncyB8fCAodE5vZGUucHJvcGVydHlCaW5kaW5ncyA9IFtdKTtcbiAgICAgIHByb3BCaW5kaW5nSWR4cy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICBsZXQgYmluZGluZ01ldGFkYXRhID0gcHJvcGVydHlOYW1lO1xuICAgICAgaWYgKGludGVycG9sYXRpb25QYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGJpbmRpbmdNZXRhZGF0YSArPVxuICAgICAgICAgICAgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBpbnRlcnBvbGF0aW9uUGFydHMuam9pbihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICB9XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gYmluZGluZ01ldGFkYXRhO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAoKSA6IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHRWaWV3OiBUVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBuZ0Rldk1vZGUgPyBuZXcgVENsZWFudXAoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKFxuICAgIGN1cnJlbnREZWY6IERpcmVjdGl2ZURlZjxhbnk+fG51bGwsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgLy8gVE9ETyhGVy0yMDQzKTogdGhlIGBjdXJyZW50RGVmYCBpcyBudWxsIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgaW52b2tlZCB3aGlsZSBjcmVhdGluZyByb290XG4gIC8vIGNvbXBvbmVudCAoc2VlIHBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50LnRzKS4gVGhpcyBpcyBub3QgY29uc2lzdGVudCB3aXRoIHRoZSBwcm9jZXNzXG4gIC8vIG9mIGNyZWF0aW5nIGlubmVyIGNvbXBvbmVudHMsIHdoZW4gY3VycmVudCBkaXJlY3RpdmUgaW5kZXggaXMgYXZhaWxhYmxlIGluIHRoZSBzdGF0ZS4gSW4gb3JkZXJcbiAgLy8gdG8gYXZvaWQgcmVseWluZyBvbiBjdXJyZW50IGRlZiBiZWluZyBgbnVsbGAgKHRodXMgc3BlY2lhbC1jYXNpbmcgcm9vdCBjb21wb25lbnQgY3JlYXRpb24pLCB0aGVcbiAgLy8gcHJvY2VzcyBvZiBjcmVhdGluZyByb290IGNvbXBvbmVudCBzaG91bGQgYmUgdW5pZmllZCB3aXRoIHRoZSBwcm9jZXNzIG9mIGNyZWF0aW5nIGlubmVyXG4gIC8vIGNvbXBvbmVudHMuXG4gIGlmIChjdXJyZW50RGVmID09PSBudWxsIHx8IGlzQ29tcG9uZW50RGVmKGN1cnJlbnREZWYpKSB7XG4gICAgbFZpZXcgPSB1bndyYXBMVmlldyhsVmlld1t0Tm9kZS5pbmRleF0pITtcbiAgfVxuICByZXR1cm4gbFZpZXdbUkVOREVSRVJdO1xufVxuXG4vKiogSGFuZGxlcyBhbiBlcnJvciB0aHJvd24gaW4gYW4gTFZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXJyb3IobFZpZXc6IExWaWV3LCBlcnJvcjogYW55KTogdm9pZCB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3RvciA/IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpIDogbnVsbDtcbiAgZXJyb3JIYW5kbGVyICYmIGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBpbnB1dHMgb2YgZGlyZWN0aXZlcyBhdCB0aGUgY3VycmVudCBub2RlIHRvIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiAgICAgICAgcG9zc2libHkgbWluaWZpZWQsIHByb3BlcnR5IG5hbWVzIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgcHVibGljTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBpbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGlucHV0c1tpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBpbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGVmLnNldElucHV0ICE9PSBudWxsKSB7XG4gICAgICBkZWYuc2V0SW5wdXQhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdGV4dCBiaW5kaW5nIGF0IGEgZ2l2ZW4gaW5kZXggaW4gYSBnaXZlbiBMVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAndmFsdWUgc2hvdWxkIG5vdCBiZSBOT19DSEFOR0UnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgdmFsdWUpIDogZWxlbWVudC50ZXh0Q29udGVudCA9IHZhbHVlO1xufVxuIl19