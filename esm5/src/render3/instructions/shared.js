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
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET, MOVED_VIEWS } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponentDef, isComponentHost, isContentQueryHost, isLContainer, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TVIEW } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getPreviousOrParentTNode, getSelectedIndex, leaveView, setBindingIndex, setBindingRootForHostBindings, setCheckNoChangesMode, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { isAnimationProp, mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, isCreationMode, readPatchedLView, resetPreOrderHookFlags, unwrapLView, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData, LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeDebug, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor } from './lview_debug';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = (function () { return Promise.resolve(null); })();
/**
 * Process the `TView.expandoInstructions`. (Execute the `hostBindings`.)
 *
 * @param tView `TView` containing the `expandoInstructions`
 * @param lView `LView` associated with the `TView`
 */
export function setHostBindingsByExecutingExpandoInstructions(tView, lView) {
    ngDevMode && assertSame(tView, lView[TVIEW], '`LView` is not associated with the `TView`!');
    try {
        var expandoInstructions = tView.expandoInstructions;
        if (expandoInstructions !== null) {
            var bindingRootIndex = tView.expandoStartIndex;
            var currentDirectiveIndex = -1;
            var currentElementIndex = -1;
            // TODO(misko): PERF It is possible to get here with `TView.expandoInstructions` containing no
            // functions to execute. This is wasteful as there is no work to be done, but we still need
            // to iterate over the instructions.
            // In example of this is in this test: `host_binding_spec.ts`
            // `fit('should not cause problems if detectChanges is called when a property updates', ...`
            // In the above test we get here with expando [0, 0, 1] which requires a lot of processing but
            // there is no function to execute.
            for (var i = 0; i < expandoInstructions.length; i++) {
                var instruction = expandoInstructions[i];
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
                        var providerCount = expandoInstructions[++i];
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
                        var hostCtx = lView[currentDirectiveIndex];
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
/** Refreshes child components in the current view (update mode). */
function refreshChildComponents(hostLView, components) {
    for (var i = 0; i < components.length; i++) {
        refreshComponent(hostLView, components[i]);
    }
}
/** Renders child components in the current view (creation mode). */
function renderChildComponents(hostLView, components) {
    for (var i = 0; i < components.length; i++) {
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
    var lView = ngDevMode ? cloneToLViewFromTViewBlueprint(tView) : tView.blueprint.slice();
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
    var adjustedIndex = index + HEADER_OFFSET;
    var tNode = tView.data[adjustedIndex] ||
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs);
    setPreviousOrParentTNode(tNode, true);
    return tNode;
}
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs) {
    var previousOrParentTNode = getPreviousOrParentTNode();
    var isParent = getIsParent();
    var parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places,
    // so it's only set if the view is the same.
    var parentInSameView = parent && parent !== tHostNode;
    var tParentNode = parentInSameView ? parent : null;
    var tNode = tView.data[adjustedIndex] =
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
 * @param tView `TView` associated with `LView`
 * @param view The `LView` containing the blueprint to adjust
 * @param numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 */
export function allocExpando(tView, lView, numSlotsToAlloc) {
    ngDevMode &&
        assertGreaterThan(numSlotsToAlloc, 0, 'The number of slots to alloc should be greater than 0');
    if (numSlotsToAlloc > 0) {
        if (tView.firstCreatePass) {
            for (var i = 0; i < numSlotsToAlloc; i++) {
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
        var viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(1 /* Create */, viewQuery, context);
        }
        // Execute a template associated with this view, if it exists. A template function might not be
        // defined for the root component views.
        var templateFn = tView.template;
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
        var components = tView.components;
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
 */
export function refreshView(tView, lView, templateFn, context) {
    ngDevMode && assertEqual(isCreationMode(lView), false, 'Should be run in update mode');
    var flags = lView[FLAGS];
    if ((flags & 256 /* Destroyed */) === 256 /* Destroyed */)
        return;
    enterView(lView, lView[T_HOST]);
    var checkNoChangesMode = getCheckNoChangesMode();
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 2 /* Update */, context);
        }
        var hooksInitPhaseCompleted = (flags & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        // execute pre-order hooks (OnInit, OnChanges, DoCheck)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                var preOrderCheckHooks = tView.preOrderCheckHooks;
                if (preOrderCheckHooks !== null) {
                    executeCheckHooks(lView, preOrderCheckHooks, null);
                }
            }
            else {
                var preOrderHooks = tView.preOrderHooks;
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
                var contentCheckHooks = tView.contentCheckHooks;
                if (contentCheckHooks !== null) {
                    executeCheckHooks(lView, contentCheckHooks);
                }
            }
            else {
                var contentHooks = tView.contentHooks;
                if (contentHooks !== null) {
                    executeInitAndCheckHooks(lView, contentHooks, 1 /* AfterContentInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 1 /* AfterContentInitHooksToBeRun */);
            }
        }
        setHostBindingsByExecutingExpandoInstructions(tView, lView);
        // Refresh child component views.
        var components = tView.components;
        if (components !== null) {
            refreshChildComponents(lView, components);
        }
        // View queries must execute after refreshing child components because a template in this view
        // could be inserted in a child component. If the view query executes before child component
        // refresh, the template might not yet be inserted.
        var viewQuery = tView.viewQuery;
        if (viewQuery !== null) {
            executeViewQueryFn(2 /* Update */, viewQuery, context);
        }
        // execute view hooks (AfterViewInit, AfterViewChecked)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!checkNoChangesMode) {
            if (hooksInitPhaseCompleted) {
                var viewCheckHooks = tView.viewCheckHooks;
                if (viewCheckHooks !== null) {
                    executeCheckHooks(lView, viewCheckHooks);
                }
            }
            else {
                var viewHooks = tView.viewHooks;
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
    }
    finally {
        leaveView();
    }
}
export function renderComponentOrTemplate(tView, lView, templateFn, context) {
    var rendererFactory = lView[RENDERER_FACTORY];
    var normalExecutionPath = !getCheckNoChangesMode();
    var creationModeIsActive = isCreationMode(lView);
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
    var prevSelectedIndex = getSelectedIndex();
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
export function saveResolvedLocalsInData(viewData, tNode, localRefExtractor) {
    if (localRefExtractor === void 0) { localRefExtractor = getNativeByTNode; }
    var localNames = tNode.localNames;
    if (localNames !== null) {
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
export function getOrCreateTComponentView(def) {
    return def.tView ||
        (def.tView = createTView(1 /* Component */, -1, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts));
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
    var bindingStartIndex = HEADER_OFFSET + decls;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    var initialViewLength = bindingStartIndex + vars;
    var blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
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
        consts) : // consts: TConstants|null
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
        };
}
function createViewBlueprint(bindingStartIndex, initialViewLength) {
    var blueprint = ngDevMode ? new LViewBlueprint() : [];
    for (var i = 0; i < initialViewLength; i++) {
        blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
    }
    return blueprint;
}
function createError(text, token) {
    return new Error("Renderer: " + text + " [" + stringifyForError(token) + "]");
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
        var preserveContent = encapsulation === ViewEncapsulation.ShadowDom;
        return renderer.selectRootElement(elementOrSelector, preserveContent);
    }
    var rElement = typeof elementOrSelector === 'string' ?
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
    var lCleanup = getLCleanup(lView);
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
    var injectorIndex = tParent ? tParent.injectorIndex : -1;
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
    undefined, // residualStyles: string|null
    null, // classes: string|null
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
            residualStyles: undefined,
            classes: null,
            residualClasses: undefined,
            classBindings: 0,
            styleBindings: 0,
        };
}
function generatePropertyAliases(inputAliasMap, directiveDefIdx, propStore) {
    for (var publicName in inputAliasMap) {
        if (inputAliasMap.hasOwnProperty(publicName)) {
            propStore = propStore === null ? {} : propStore;
            var internalName = inputAliasMap[publicName];
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
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    var defs = tView.data;
    var tNodeAttrs = tNode.attrs;
    var inputsFromAttrs = ngDevMode ? new TNodeInitialInputs() : [];
    var inputsStore = null;
    var outputsStore = null;
    for (var i = start; i < end; i++) {
        var directiveDef = defs[i];
        var directiveInputs = directiveDef.inputs;
        inputsFromAttrs.push(tNodeAttrs !== null ? generateInitialInputs(directiveInputs, tNodeAttrs) : null);
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
    var element = getNativeByTNode(tNode, lView);
    var inputData = tNode.inputs;
    var dataValue;
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
                warnAboutUnknownProperty(propName, tNode);
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
            warnAboutUnknownProperty(propName, tNode);
        }
    }
}
/** If node is an OnPush component, marks its LView dirty. */
function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    var childComponentLView = getComponentLViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* CheckAlways */)) {
        childComponentLView[FLAGS] |= 64 /* Dirty */;
    }
}
function setNgReflectProperty(lView, element, type, attrName, value) {
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
        for (var i = 0; i < dataValue.length; i += 2) {
            setNgReflectProperty(lView, element, type, dataValue[i + 1], value);
        }
    }
}
function validateProperty(tView, lView, element, propName, tNode) {
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
    var schemas = tView.schemas;
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
 * Logs a warning that a property is not supported on an element.
 * @param propName Name of the invalid property.
 * @param tNode Node on which we encountered the property.
 */
function warnAboutUnknownProperty(propName, tNode) {
    console.warn("Can't bind to '" + propName + "' since it isn't a known property of '" + tNode.tagName + "'.");
}
/**
 * Instantiate a root component.
 */
export function instantiateRootComponent(tView, lView, def) {
    var rootTNode = getPreviousOrParentTNode();
    if (tView.firstCreatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        generateExpandoInstructionBlock(tView, rootTNode, 1);
        baseResolveDirective(tView, lView, def);
    }
    var directive = getNodeInjectable(lView, tView, lView.length - 1, rootTNode);
    attachPatchData(directive, lView);
    var native = getNativeByTNode(rootTNode, lView);
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
    var hasDirectives = false;
    if (getBindingsEnabled()) {
        var directiveDefs = findDirectiveDefMatches(tView, lView, tNode);
        var exportsMap = localRefs === null ? null : { '': -1 };
        if (directiveDefs !== null) {
            var totalDirectiveHostVars = 0;
            hasDirectives = true;
            initTNodeFlags(tNode, tView.data.length, directiveDefs.length);
            // When the same token is provided by several directives on the same node, some rules apply in
            // the viewEngine:
            // - viewProviders have priority over providers
            // - the last directive in NgModule.declarations has priority over the previous one
            // So to match these rules, the order in which providers are added in the arrays is very
            // important.
            for (var i = 0; i < directiveDefs.length; i++) {
                var def = directiveDefs[i];
                if (def.providersResolver)
                    def.providersResolver(def);
            }
            generateExpandoInstructionBlock(tView, tNode, directiveDefs.length);
            var preOrderHooksFound = false;
            var preOrderCheckHooksFound = false;
            for (var i = 0; i < directiveDefs.length; i++) {
                var def = directiveDefs[i];
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
    var expando = tView.expandoInstructions;
    // TODO(misko): PERF we are adding `hostBindings` even if there is nothing to add! This is
    // suboptimal for performance. `def.hostBindings` may be null,
    // but we still need to push null to the array as a placeholder
    // to ensure the directive counter is incremented (so host
    // binding functions always line up with the corrective directive).
    // This is suboptimal for performance. See `currentDirectiveIndex`
    //  comment in `setHostBindingsByExecutingExpandoInstructions` for more
    // details.  expando.push(def.hostBindings);
    expando.push(def.hostBindings);
    var hostVars = def.hostVars;
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
    for (var i = 0; i < count; i++) {
        lView.push(NO_CHANGE);
        tView.blueprint.push(NO_CHANGE);
        tView.data.push(null);
    }
}
/**
 * Instantiate all the directives that were previously resolved on the current node.
 */
function instantiateAllDirectives(tView, lView, tNode, native) {
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    if (!tView.firstCreatePass) {
        getOrCreateNodeInjectorForNode(tNode, lView);
    }
    attachPatchData(native, lView);
    var initialInputs = tNode.initialInputs;
    for (var i = start; i < end; i++) {
        var def = tView.data[i];
        var isComponent = isComponentDef(def);
        if (isComponent) {
            ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */);
            addComponentLogic(lView, tNode, def);
        }
        var directive = getNodeInjectable(lView, tView, i, tNode);
        attachPatchData(directive, lView);
        if (initialInputs !== null) {
            setInputsFromAttrs(lView, i - start, directive, def, tNode, initialInputs);
        }
        if (isComponent) {
            var componentView = getComponentLViewByIndex(tNode.index, lView);
            componentView[CONTEXT] = directive;
        }
    }
}
function invokeDirectivesHostBindings(tView, lView, tNode) {
    var start = tNode.directiveStart;
    var end = tNode.directiveEnd;
    var expando = tView.expandoInstructions;
    var firstCreatePass = tView.firstCreatePass;
    var elementIndex = tNode.index - HEADER_OFFSET;
    try {
        setSelectedIndex(elementIndex);
        for (var i = start; i < end; i++) {
            var def = tView.data[i];
            var directive = lView[i];
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
    var elementIndex = HEADER_OFFSET - tNode.index;
    var providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    var providerCount = tView.data.length - providerStartIndex;
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
    var registry = tView.directiveRegistry;
    var matches = null;
    if (registry) {
        for (var i = 0; i < registry.length; i++) {
            var def = registry[i];
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
        var localNames = tNode.localNames = ngDevMode ? new TNodeLocalNames() : [];
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
    var directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
    var nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
function addComponentLogic(lView, hostTNode, def) {
    var native = getNativeByTNode(hostTNode, lView);
    var tView = getOrCreateTComponentView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    var rendererFactory = lView[RENDERER_FACTORY];
    var componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, native, hostTNode, rendererFactory, rendererFactory.createRenderer(native, def)));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[hostTNode.index] = componentView;
}
export function elementAttributeInternal(tNode, lView, name, value, sanitizer, namespace) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    ngDevMode && validateAgainstEventAttributes(name);
    var element = getNativeByTNode(tNode, lView);
    var renderer = lView[RENDERER];
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
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
 * @param lView Current LView that is being processed.
 * @param directiveIndex Index of the directive in directives array
 * @param instance Instance of the directive on which to set the initial inputs
 * @param def The directive def that contains the list of inputs
 * @param tNode The static data for this node
 */
function setInputsFromAttrs(lView, directiveIndex, instance, def, tNode, initialInputData) {
    var initialInputs = initialInputData[directiveIndex];
    if (initialInputs !== null) {
        var setInput = def.setInput;
        for (var i = 0; i < initialInputs.length;) {
            var publicName = initialInputs[i++];
            var privateName = initialInputs[i++];
            var value = initialInputs[i++];
            if (setInput !== null) {
                def.setInput(instance, value, publicName, privateName);
            }
            else {
                instance[privateName] = value;
            }
            if (ngDevMode) {
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
 * @param inputs The list of inputs from the directive def
 * @param attrs The static attrs on this node
 */
function generateInitialInputs(inputs, attrs) {
    var inputsToStore = null;
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
var LContainerArray = ((typeof ngDevMode === 'undefined' || ngDevMode) && initNgDevMode()) &&
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
    var lContainer = new (ngDevMode ? LContainerArray : Array)(hostNative, // host native
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
 */
function refreshDynamicEmbeddedViews(lView) {
    var viewOrContainer = lView[CHILD_HEAD];
    while (viewOrContainer !== null) {
        // Note: viewOrContainer can be an LView or an LContainer instance, but here we are only
        // interested in LContainer
        var activeIndexFlag = void 0;
        if (isLContainer(viewOrContainer) &&
            (activeIndexFlag = viewOrContainer[ACTIVE_INDEX]) >> 1 /* SHIFT */ ===
                -1 /* DYNAMIC_EMBEDDED_VIEWS_ONLY */) {
            for (var i = CONTAINER_HEADER_OFFSET; i < viewOrContainer.length; i++) {
                var embeddedLView = viewOrContainer[i];
                var embeddedTView = embeddedLView[TVIEW];
                ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
                if (viewAttachedToChangeDetector(embeddedLView)) {
                    refreshView(embeddedTView, embeddedLView, embeddedTView.template, embeddedLView[CONTEXT]);
                }
            }
            if ((activeIndexFlag & 1 /* HAS_TRANSPLANTED_VIEWS */) !== 0) {
                // We should only CD moved views if the component where they were inserted does not match
                // the component where they were declared and insertion is on-push. Moved views also
                // contains intra component moves, or check-always which need to be skipped.
                refreshTransplantedViews(viewOrContainer, lView[DECLARATION_COMPONENT_VIEW]);
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
 * @param lContainer The `LContainer` which has transplanted views.
 * @param declaredComponentLView The `lContainer` parent component `LView`.
 */
function refreshTransplantedViews(lContainer, declaredComponentLView) {
    var movedViews = lContainer[MOVED_VIEWS];
    ngDevMode && assertDefined(movedViews, 'Transplanted View flags set but missing MOVED_VIEWS');
    for (var i = 0; i < movedViews.length; i++) {
        var movedLView = movedViews[i];
        var insertionLContainer = movedLView[PARENT];
        ngDevMode && assertLContainer(insertionLContainer);
        var insertedComponentLView = insertionLContainer[PARENT][DECLARATION_COMPONENT_VIEW];
        ngDevMode && assertDefined(insertedComponentLView, 'Missing LView');
        // Check if we have a transplanted view by compering declaration and insertion location.
        if (insertedComponentLView !== declaredComponentLView) {
            // Yes the `LView` is transplanted.
            // Here we would like to know if the component is `OnPush`. We don't have
            // explicit `OnPush` flag instead we set `CheckAlways` to false (which is `OnPush`)
            // Not to be confused with `ManualOnPush` which is used with wether a DOM event
            // should automatically mark a view as dirty.
            var insertionComponentIsOnPush = (insertedComponentLView[FLAGS] & 16 /* CheckAlways */) === 0;
            if (insertionComponentIsOnPush) {
                // Here we know that the template has been transplanted across components and is
                // on-push (not just moved within a component). If the insertion is marked dirty, then
                // there is no need to CD here as we will do it again later when we get to insertion
                // point.
                var movedTView = movedLView[TVIEW];
                ngDevMode && assertDefined(movedTView, 'TView must be allocated');
                refreshView(movedTView, movedLView, movedTView.template, movedLView[CONTEXT]);
            }
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
    var componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
    // Only attached components that are CheckAlways or OnPush and dirty should be refreshed
    if (viewAttachedToChangeDetector(componentView) &&
        componentView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
        var componentTView = componentView[TVIEW];
        refreshView(componentTView, componentView, componentTView.template, componentView[CONTEXT]);
    }
}
function renderComponent(hostLView, componentHostIdx) {
    ngDevMode && assertEqual(isCreationMode(hostLView), true, 'Should be run in creation mode');
    var componentView = getComponentLViewByIndex(componentHostIdx, hostLView);
    var componentTView = componentView[TVIEW];
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
    for (var i = lView.length; i < tView.blueprint.length; i++) {
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
        var lView = readPatchedLView(rootComponent);
        var tView = lView[TVIEW];
        renderComponentOrTemplate(tView, lView, tView.template, rootComponent);
    }
}
export function detectChangesInternal(tView, lView, context) {
    var rendererFactory = lView[RENDERER_FACTORY];
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
export function storePropertyBindingMetadata(tData, tNode, propertyName, bindingIndex) {
    var interpolationParts = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        interpolationParts[_i - 4] = arguments[_i];
    }
    // Binding meta-data are stored only the first time a given property instruction is processed.
    // Since we don't have a concept of the "first update pass" we need to check for presence of the
    // binding meta-data to decide if one should be stored (or if was stored already).
    if (tData[bindingIndex] === null) {
        if (tNode.inputs == null || !tNode.inputs[propertyName]) {
            var propBindingIdxs = tNode.propertyBindings || (tNode.propertyBindings = []);
            propBindingIdxs.push(bindingIndex);
            var bindingMetadata = propertyName;
            if (interpolationParts.length > 0) {
                bindingMetadata +=
                    INTERPOLATION_DELIMITER + interpolationParts.join(INTERPOLATION_DELIMITER);
            }
            tData[bindingIndex] = bindingMetadata;
        }
    }
}
export var CLEAN_PROMISE = _CLEAN_PROMISE;
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
export function loadComponentRenderer(tNode, lView) {
    var componentLView = unwrapLView(lView[tNode.index]);
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
 * @param tView The current TView
 * @param lView the `LView` which contains the directives.
 * @param inputs mapping between the public "input" name and privately-known,
 *        possibly minified, property names to write to.
 * @param value Value to set.
 */
export function setInputsForProperty(tView, lView, inputs, publicName, value) {
    for (var i = 0; i < inputs.length;) {
        var index = inputs[i++];
        var privateName = inputs[i++];
        var instance = lView[index];
        ngDevMode && assertDataInRange(lView, index);
        var def = tView.data[index];
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
    var element = getNativeByIndex(index, lView);
    ngDevMode && assertDefined(element, 'native element should exist');
    ngDevMode && ngDevMode.rendererSetText++;
    var renderer = lView[RENDERER];
    isProceduralRenderer(renderer) ? renderer.setValue(element, value) : element.textContent = value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0osT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFP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QUFDLEdBQUcsS0FBSyxDQUFDO1NBQy9CO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxLQUFhO0lBQzVFLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUNyRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQztJQUM3RCxJQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFpQixDQUFDO0lBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztJQUN6QyxJQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztBQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydE5vdEVxdWFsLCBhc3NlcnROb3RTYW1lLCBhc3NlcnRTYW1lfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZU5hbWVkQXJyYXlUeXBlfSBmcm9tICcuLi8uLi91dGlsL25hbWVkX2FycmF5X3R5cGUnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBBY3RpdmVJbmRleEZsYWcsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzZXMsIFByb3BlcnR5QWxpYXNWYWx1ZSwgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHMsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc1Byb2NlZHVyYWxSZW5kZXJlciwgUkNvbW1lbnQsIFJFbGVtZW50LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIFJOb2RlLCBSVGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3QsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJbml0UGhhc2VTdGF0ZSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBUX0hPU1QsIFREYXRhLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgZ2V0VFZpZXcsIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wLCBtZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCByZWFkUGF0Y2hlZExWaWV3LCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB1bndyYXBMVmlldywgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHthdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCwgY2xvbmVUb1RWaWV3RGF0YSwgTENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZURlYnVnLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gKCgpID0+IFByb21pc2UucmVzb2x2ZShudWxsKSkoKTtcblxuLyoqXG4gKiBQcm9jZXNzIHRoZSBgVFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc2AuIChFeGVjdXRlIHRoZSBgaG9zdEJpbmRpbmdzYC4pXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgY29udGFpbmluZyB0aGUgYGV4cGFuZG9JbnN0cnVjdGlvbnNgXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIGBUVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9ucyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBgVFZpZXdgIScpO1xuICB0cnkge1xuICAgIGNvbnN0IGV4cGFuZG9JbnN0cnVjdGlvbnMgPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zO1xuICAgIGlmIChleHBhbmRvSW5zdHJ1Y3Rpb25zICE9PSBudWxsKSB7XG4gICAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIEl0IGlzIHBvc3NpYmxlIHRvIGdldCBoZXJlIHdpdGggYFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNgIGNvbnRhaW5pbmcgbm9cbiAgICAgIC8vIGZ1bmN0aW9ucyB0byBleGVjdXRlLiBUaGlzIGlzIHdhc3RlZnVsIGFzIHRoZXJlIGlzIG5vIHdvcmsgdG8gYmUgZG9uZSwgYnV0IHdlIHN0aWxsIG5lZWRcbiAgICAgIC8vIHRvIGl0ZXJhdGUgb3ZlciB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgICAgLy8gSW4gZXhhbXBsZSBvZiB0aGlzIGlzIGluIHRoaXMgdGVzdDogYGhvc3RfYmluZGluZ19zcGVjLnRzYFxuICAgICAgLy8gYGZpdCgnc2hvdWxkIG5vdCBjYXVzZSBwcm9ibGVtcyBpZiBkZXRlY3RDaGFuZ2VzIGlzIGNhbGxlZCB3aGVuIGEgcHJvcGVydHkgdXBkYXRlcycsIC4uLmBcbiAgICAgIC8vIEluIHRoZSBhYm92ZSB0ZXN0IHdlIGdldCBoZXJlIHdpdGggZXhwYW5kbyBbMCwgMCwgMV0gd2hpY2ggcmVxdWlyZXMgYSBsb3Qgb2YgcHJvY2Vzc2luZyBidXRcbiAgICAgIC8vIHRoZXJlIGlzIG5vIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBleHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgICAvLyBJbXBvcnRhbnQ6IEluIEpTIGAteGAgYW5kIGAwLXhgIGlzIG5vdCB0aGUgc2FtZSEgSWYgYHg9PT0wYCB0aGVuIGAteGAgd2lsbCBwcm9kdWNlXG4gICAgICAgICAgICAvLyBgLTBgIHdoaWNoIHJlcXVpcmVzIG5vbiBzdGFuZGFyZCBtYXRoIGFyaXRobWV0aWMgYW5kIGl0IGNhbiBwcmV2ZW50IFZNIG9wdGltaXphdGlvbnMuXG4gICAgICAgICAgICAvLyBgMC0wYCB3aWxsIGFsd2F5cyBwcm9kdWNlIGAwYCBhbmQgd2lsbCBub3QgY2F1c2UgYSBwb3RlbnRpYWwgZGVvcHRpbWl6YXRpb24gaW4gVk0uXG4gICAgICAgICAgICAvLyBUT0RPKG1pc2tvKTogUEVSRiBUaGlzIHNob3VsZCBiZSByZWZhY3RvcmVkIHRvIHVzZSBgfmluc3RydWN0aW9uYCBhcyB0aGF0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdWZmZXIgZnJvbSBgLTBgIGFuZCBpdCBpcyBmYXN0ZXIvbW9yZSBjb21wYWN0LlxuICAgICAgICAgICAgY3VycmVudEVsZW1lbnRJbmRleCA9IDAgLSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkSW5kZXgoY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAoZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKGJpbmRpbmdSb290SW5kZXgsIGN1cnJlbnREaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBob3N0Q3R4ID0gbFZpZXdbY3VycmVudERpcmVjdGl2ZUluZGV4XTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIFJlbHlpbmcgb24gaW5jcmVtZW50aW5nIHRoZSBgY3VycmVudERpcmVjdGl2ZUluZGV4YCBoZXJlIGlzXG4gICAgICAgICAgLy8gc3ViLW9wdGltYWwuIFRoZSBpbXBsaWNhdGlvbnMgYXJlIHRoYXQgaWYgd2UgaGF2ZSBhIGxvdCBvZiBkaXJlY3RpdmVzIGJ1dCBub25lIG9mIHRoZW1cbiAgICAgICAgICAvLyBoYXZlIGhvc3QgYmluZGluZ3Mgd2UgbmV2ZXJ0aGVsZXNzIG5lZWQgdG8gaXRlcmF0ZSBvdmVyIHRoZSBleHBhbmRvIGluc3RydWN0aW9ucyB0b1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY291bnRlci4gSXQgd291bGQgYmUgbXVjaCBiZXR0ZXIgaWYgd2UgY291bGQgZW5jb2RlIHRoZVxuICAgICAgICAgIC8vIGBjdXJyZW50RGlyZWN0aXZlSW5kZXhgIGludG8gdGhlIGBleHBhbmRvSW5zdHJ1Y3Rpb25gIGFycmF5IHNvIHRoYXQgd2Ugb25seSBuZWVkIHRvXG4gICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRob3NlIGRpcmVjdGl2ZXMgd2hpY2ggYWN0dWFsbHkgaGF2ZSBgaG9zdEJpbmRpbmdzYC5cbiAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGFsbCBjb250ZW50IHF1ZXJpZXMgZGVjbGFyZWQgYnkgZGlyZWN0aXZlcyBpbiBhIGdpdmVuIHZpZXcgKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzO1xuICBpZiAoY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBxdWVyeVN0YXJ0SWR4ID0gY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSBjb250ZW50UXVlcmllc1tpICsgMV07XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMsICdjb250ZW50UXVlcmllcyBmdW5jdGlvbiBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgICBzZXRDdXJyZW50UXVlcnlJbmRleChxdWVyeVN0YXJ0SWR4KTtcbiAgICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKiogUmVuZGVycyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKGNyZWF0aW9uIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVuZGVyQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gdXNlXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKG5hbWU6IHN0cmluZywgcmVuZGVyZXI6IFJlbmRlcmVyMywgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbCk6IFJFbGVtZW50IHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZSA9PT0gbnVsbCA/IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3fG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVHxudWxsLCBmbGFnczogTFZpZXdGbGFncywgaG9zdDogUkVsZW1lbnR8bnVsbCxcbiAgICB0SG9zdE5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCwgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5M3xudWxsLFxuICAgIHJlbmRlcmVyPzogUmVuZGVyZXIzfG51bGwsIHNhbml0aXplcj86IFNhbml0aXplcnxudWxsLCBpbmplY3Rvcj86IEluamVjdG9yfG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIG5nRGV2TW9kZSA/IGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCh0VmlldykgOiB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IHRIb3N0Tm9kZTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3ICE9PSBudWxsIDogdHJ1ZSwgdHJ1ZSxcbiAgICAgICAgICAnRW1iZWRkZWQgdmlld3MgbXVzdCBoYXZlIHBhcmVudExWaWV3Jyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA9XG4gICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3IVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gOiBsVmlldztcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExWaWV3RGVidWcobFZpZXcpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdEhvc3ROb2RlIFRoaXMgaXMgYSBoYWNrIGFuZCB3ZSBzaG91bGQgbm90IGhhdmUgdG8gcGFzcyB0aGlzIHZhbHVlIGluLiBJdCBpcyBvbmx5IHVzZWQgdG9cbiAqIGRldGVybWluZSBpZiB0aGUgcGFyZW50IGJlbG9uZ3MgdG8gYSBkaWZmZXJlbnQgdFZpZXcuIEluc3RlYWQgd2Ugc2hvdWxkIG5vdCBoYXZlIHBhcmVudFRWaWV3XG4gKiBwb2ludCB0byBUVmlldyBvdGhlciB0aGUgY3VycmVudCBvbmUuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmXG4gICAgVEljdUNvbnRhaW5lck5vZGUge1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGUgfHxcbiAgICAgIGNyZWF0ZVROb2RlQXRJbmRleCh0VmlldywgdEhvc3ROb2RlLCBhZGp1c3RlZEluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUVmlld05vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmXG4gICAgICBUUHJvamVjdGlvbk5vZGUgJiBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGlzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIHBhcmVudCAhPT0gdEhvc3ROb2RlO1xuICBjb25zdCB0UGFyZW50Tm9kZSA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgY3JlYXRlVE5vZGUodFZpZXcsIHRQYXJlbnROb2RlLCB0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgKHROb2RlLnBhcmVudCAhPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpKSB7XG4gICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmICghaXNQYXJlbnQpIHtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KTogVFZpZXdOb2RlIHtcbiAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICBsZXQgdE5vZGUgPSB0Vmlldy5ub2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiB0UGFyZW50Tm9kZSAmJlxuICAgICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHRQYXJlbnROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgdFZpZXcubm9kZSA9IHROb2RlID0gY3JlYXRlVE5vZGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tUX0hPU1RdID0gdE5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYExWaWV3YFxuICogQHBhcmFtIHZpZXcgVGhlIGBMVmlld2AgY29udGFpbmluZyB0aGUgYmx1ZXByaW50IHRvIGFkanVzdFxuICogQHBhcmFtIG51bVNsb3RzVG9BbGxvYyBUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIGluIHRoZSBMVmlldywgc2hvdWxkIGJlID4wXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIG51bVNsb3RzVG9BbGxvYzogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oXG4gICAgICAgICAgbnVtU2xvdHNUb0FsbG9jLCAwLCAnVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA+IDApIHtcbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzVG9BbGxvYzsgaSsrKSB7XG4gICAgICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgICAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgICAgIGxWaWV3LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHNob3VsZCBvbmx5IGluY3JlbWVudCB0aGUgZXhwYW5kbyBzdGFydCBpbmRleCBpZiB0aGVyZSBhcmVuJ3QgYWxyZWFkeSBkaXJlY3RpdmVzXG4gICAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgICBpZiAoIXRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICAgICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKz0gbnVtU2xvdHNUb0FsbG9jO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2luY2Ugd2UncmUgYWRkaW5nIHRoZSBkeW5hbWljIG5vZGVzIGludG8gdGhlIGV4cGFuZG8gc2VjdGlvbiwgd2UgbmVlZCB0byBsZXQgdGhlIGhvc3RcbiAgICAgICAgLy8gYmluZGluZ3Mga25vdyB0aGF0IHRoZXkgc2hvdWxkIHNraXAgeCBzbG90c1xuICAgICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB0aGUgY3JlYXRpb24gbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBjcmVhdGluZyB2aWV3IHF1ZXJ5IGZ1bmN0aW9ucyAoaWYgYW55KTtcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdGhlIGNyZWF0aW9uIG1vZGU7XG4gKiAtIHVwZGF0aW5nIHN0YXRpYyBxdWVyaWVzIChpZiBhbnkpO1xuICogLSBjcmVhdGluZyBjaGlsZCBjb21wb25lbnRzIGRlZmluZWQgaW4gYSBnaXZlbiB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVmlldzxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGVudGVyVmlldyhsVmlldywgbFZpZXdbVF9IT1NUXSk7XG4gIHRyeSB7XG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBhIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHZpZXcsIGlmIGl0IGV4aXN0cy4gQSB0ZW1wbGF0ZSBmdW5jdGlvbiBtaWdodCBub3QgYmVcbiAgICAvLyBkZWZpbmVkIGZvciB0aGUgcm9vdCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgdGVtcGxhdGVGbiA9IHRWaWV3LnRlbXBsYXRlO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHMuXG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAvLyBvZmYgZmlyc3RDcmVhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXZSByZXNvbHZlIGNvbnRlbnQgcXVlcmllcyBzcGVjaWZpY2FsbHkgbWFya2VkIGFzIGBzdGF0aWNgIGluIGNyZWF0aW9uIG1vZGUuIER5bmFtaWNcbiAgICAvLyBjb250ZW50IHF1ZXJpZXMgYXJlIHJlc29sdmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIChpLmUuIHVwZGF0ZSBtb2RlKSwgYWZ0ZXIgZW1iZWRkZWRcbiAgICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICAgIGlmICh0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcykge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gV2UgbXVzdCBtYXRlcmlhbGl6ZSBxdWVyeSByZXN1bHRzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRzIGFyZSBwcm9jZXNzZWRcbiAgICAvLyBpbiBjYXNlIGEgY2hpbGQgY29tcG9uZW50IGhhcyBwcm9qZWN0ZWQgYSBjb250YWluZXIuIFRoZSBMQ29udGFpbmVyIG5lZWRzXG4gICAgLy8gdG8gZXhpc3Qgc28gdGhlIGVtYmVkZGVkIHZpZXdzIGFyZSBwcm9wZXJseSBhdHRhY2hlZCBieSB0aGUgY29udGFpbmVyLlxuICAgIGlmICh0Vmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdFZpZXcudmlld1F1ZXJ5ISwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuICBlbnRlclZpZXcobFZpZXcsIGxWaWV3W1RfSE9TVF0pO1xuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSBnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJDaGVja0hvb2tzID0gdFZpZXcucHJlT3JkZXJDaGVja0hvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHByZU9yZGVyQ2hlY2tIb29rcywgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVySG9va3MgPSB0Vmlldy5wcmVPcmRlckhvb2tzO1xuICAgICAgICBpZiAocHJlT3JkZXJIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJIb29rcywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuT25Jbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXcpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgaWYgKHRWaWV3LmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIGNvbnRlbnQgaG9va3MgKEFmdGVyQ29udGVudEluaXQsIEFmdGVyQ29udGVudENoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRDaGVja0hvb2tzID0gdFZpZXcuY29udGVudENoZWNrSG9va3M7XG4gICAgICAgIGlmIChjb250ZW50Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBjb250ZW50Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIb29rcyA9IHRWaWV3LmNvbnRlbnRIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbnRlbnRIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9ucyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3Qgdmlld0NoZWNrSG9va3MgPSB0Vmlldy52aWV3Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKHZpZXdDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIHZpZXdDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdmlld0hvb2tzID0gdFZpZXcudmlld0hvb2tzO1xuICAgICAgICBpZiAodmlld0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCB2aWV3SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9PT0gdHJ1ZSkge1xuICAgICAgLy8gV2UgbmVlZCB0byBtYWtlIHN1cmUgdGhhdCB3ZSBvbmx5IGZsaXAgdGhlIGZsYWcgb24gc3VjY2Vzc2Z1bCBgcmVmcmVzaFZpZXdgIG9ubHlcbiAgICAgIC8vIERvbid0IGRvIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrLlxuICAgICAgLy8gSWYgd2UgZGlkIHRoaXMgaW4gYGZpbmFsbHlgIGJsb2NrIHRoZW4gYW4gZXhjZXB0aW9uIGNvdWxkIGJsb2NrIHRoZSBleGVjdXRpb24gb2Ygc3R5bGluZ1xuICAgICAgLy8gaW5zdHJ1Y3Rpb25zIHdoaWNoIGluIHR1cm4gd291bGQgYmUgdW5hYmxlIHRvIGluc2VydCB0aGVtc2VsdmVzIGludG8gdGhlIHN0eWxpbmcgbGlua2VkXG4gICAgICAvLyBsaXN0LiBUaGUgcmVzdWx0IG9mIHRoaXMgd291bGQgYmUgdGhhdCBpZiB0aGUgZXhjZXB0aW9uIHdvdWxkIG5vdCBiZSB0aHJvdyBvbiBzdWJzZXF1ZW50IENEXG4gICAgICAvLyB0aGUgc3R5bGluZyB3b3VsZCBiZSB1bmFibGUgdG8gcHJvY2VzcyBpdCBkYXRhIGFuZCByZWZsZWN0IHRvIHRoZSBET00uXG4gICAgICB0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBEbyBub3QgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIHdoZW4gcnVubmluZyBpbiBjaGVjayBubyBjaGFuZ2VzIG1vZGUuIFdlIGRvbid0IHdhbnQgY29tcG9uZW50c1xuICAgIC8vIHRvIGJlaGF2ZSBkaWZmZXJlbnRseSBkZXBlbmRpbmcgb24gd2hldGhlciBjaGVjayBubyBjaGFuZ2VzIGlzIGVuYWJsZWQgb3Igbm90LiBGb3IgZXhhbXBsZTpcbiAgICAvLyBNYXJraW5nIGFuIE9uUHVzaCBjb21wb25lbnQgYXMgZGlydHkgZnJvbSB3aXRoaW4gdGhlIGBuZ0FmdGVyVmlld0luaXRgIGhvb2sgaW4gb3JkZXIgdG9cbiAgICAvLyByZWZyZXNoIGEgYE5nQ2xhc3NgIGJpbmRpbmcgc2hvdWxkIHdvcmsuIElmIHdlIHdvdWxkIHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSBpbiB0aGUgY2hlY2tcbiAgICAvLyBubyBjaGFuZ2VzIGN5Y2xlLCB0aGUgY29tcG9uZW50IHdvdWxkIGJlIG5vdCBiZSBkaXJ0eSBmb3IgdGhlIG5leHQgdXBkYXRlIHBhc3MuIFRoaXMgd291bGRcbiAgICAvLyBiZSBkaWZmZXJlbnQgaW4gcHJvZHVjdGlvbiBtb2RlIHdoZXJlIHRoZSBjb21wb25lbnQgZGlydHkgc3RhdGUgaXMgbm90IHJlc2V0LlxuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlKSB7XG4gICAgICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3Qgbm9ybWFsRXhlY3V0aW9uUGF0aCA9ICFnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlSXNBY3RpdmUgPSBpc0NyZWF0aW9uTW9kZShsVmlldyk7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmIChjcmVhdGlvbk1vZGVJc0FjdGl2ZSkge1xuICAgICAgcmVuZGVyVmlldyh0VmlldywgbFZpZXcsIGNvbnRleHQpO1xuICAgIH1cbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHJmOiBSZW5kZXJGbGFncywgY29udGV4dDogVCkge1xuICBjb25zdCBwcmV2U2VsZWN0ZWRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgICBpZiAocmYgJiBSZW5kZXJGbGFncy5VcGRhdGUgJiYgbFZpZXcubGVuZ3RoID4gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gV2hlbiB3ZSdyZSB1cGRhdGluZywgaW5oZXJlbnRseSBzZWxlY3QgMCBzbyB3ZSBkb24ndFxuICAgICAgLy8gaGF2ZSB0byBnZW5lcmF0ZSB0aGF0IGluc3RydWN0aW9uIGZvciBtb3N0IHVwZGF0ZSBibG9ja3MuXG4gICAgICBzZWxlY3RJbmRleEludGVybmFsKHRWaWV3LCBsVmlldywgMCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xuICAgIH1cbiAgICB0ZW1wbGF0ZUZuKHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkge1xuICBpZiAoIWdldEJpbmRpbmdzRW5hYmxlZCgpKSByZXR1cm47XG4gIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykpO1xuICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpID09PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykge1xuICAgIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlldyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIHJldHVybiBkZWYudFZpZXcgfHxcbiAgICAgIChkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgVFZpZXdUeXBlLkNvbXBvbmVudCwgLTEsIGRlZi50ZW1wbGF0ZSwgZGVmLmRlY2xzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSwgZGVmLnNjaGVtYXMsIGRlZi5jb25zdHMpKTtcbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIHZpZXdCbG9ja0lkIGZvciBpbmxpbmUgdmlld3MsIG9yIC0xIGlmIGl0J3MgYSBjb21wb25lbnQvZHluYW1pY1xuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb25cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gY29uc3RzIENvbnN0YW50cyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB0eXBlOiBUVmlld1R5cGUsIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fG51bGwsIGRlY2xzOiBudW1iZXIsXG4gICAgdmFyczogbnVtYmVyLCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICBjb25zdHM6IFRDb25zdGFudHN8bnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBkZWNscztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSBuZ0Rldk1vZGUgP1xuICAgICAgbmV3IFRWaWV3Q29uc3RydWN0b3IoXG4gICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICB2aWV3SW5kZXgsICAgLy8gaWQ6IG51bWJlcixcbiAgICAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAvLyBxdWVyaWVzOiBUUXVlcmllc3xudWxsXG4gICAgICAgICAgICAgdmlld1F1ZXJ5LCAgIC8vIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsISwgICAgICAgLy8gbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLFxuICAgICAgICAgICAgIGNsb25lVG9UVmlld0RhdGEoYmx1ZXByaW50KS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSwgIC8vIGRhdGE6IFREYXRhLFxuICAgICAgICAgICAgIGJpbmRpbmdTdGFydEluZGV4LCAgLy8gYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBpbml0aWFsVmlld0xlbmd0aCwgIC8vIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgIC8vIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBkZXN0cm95SG9va3M6IERlc3Ryb3lIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICAgICBjb25zdHMpIDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdHM6IFRDb25zdGFudHN8bnVsbFxuICAgICAge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBpZDogdmlld0luZGV4LFxuICAgICAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgICAgIHF1ZXJpZXM6IG51bGwsXG4gICAgICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgICAgICBub2RlOiBudWxsISxcbiAgICAgICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgICAgIGJpbmRpbmdTdGFydEluZGV4OiBiaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgICAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgICAgICBmaXJzdENyZWF0ZVBhc3M6IHRydWUsXG4gICAgICAgIGZpcnN0VXBkYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgc3RhdGljVmlld1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgICAgIHByZU9yZGVySG9va3M6IG51bGwsXG4gICAgICAgIHByZU9yZGVyQ2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgdmlld0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgICAgICBjbGVhbnVwOiBudWxsLFxuICAgICAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICAgICAgY29tcG9uZW50czogbnVsbCxcbiAgICAgICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICAgICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgICAgIHNjaGVtYXM6IHNjaGVtYXMsXG4gICAgICAgIGNvbnN0czogY29uc3RzLFxuICAgICAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZ0Rldk1vZGUgPyBuZXcgTFZpZXdCbHVlcHJpbnQoKSA6IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbFZpZXdMZW5ndGg7IGkrKykge1xuICAgIGJsdWVwcmludC5wdXNoKGkgPCBiaW5kaW5nU3RhcnRJbmRleCA/IG51bGwgOiBOT19DSEFOR0UpO1xuICB9XG5cbiAgcmV0dXJuIGJsdWVwcmludCBhcyBMVmlldztcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeUZvckVycm9yKHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhvc3ROb2RlRXhpc3RzKHJFbGVtZW50OiBSRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50fHN0cmluZykge1xuICBpZiAoIXJFbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgcmVuZGVyZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbmNhcHN1bGF0aW9uIFZpZXcgRW5jYXBzdWxhdGlvbiBkZWZpbmVkIGZvciBjb21wb25lbnQgdGhhdCByZXF1ZXN0cyBob3N0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnR8c3RyaW5nLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uKTogUkVsZW1lbnQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgLy8gV2hlbiB1c2luZyBuYXRpdmUgU2hhZG93IERPTSwgZG8gbm90IGNsZWFyIGhvc3QgZWxlbWVudCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uXG4gICAgY29uc3QgcHJlc2VydmVDb250ZW50ID0gZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tO1xuICAgIHJldHVybiByZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvciwgcHJlc2VydmVDb250ZW50KTtcbiAgfVxuXG4gIGxldCByRWxlbWVudCA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgcmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikhIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SG9zdE5vZGVFeGlzdHMockVsZW1lbnQsIGVsZW1lbnRPclNlbGVjdG9yKTtcblxuICAvLyBBbHdheXMgY2xlYXIgaG9zdCBlbGVtZW50J3MgY29udGVudCB3aGVuIFJlbmRlcmVyMyBpcyBpbiB1c2UuIEZvciBwcm9jZWR1cmFsIHJlbmRlcmVyIGNhc2Ugd2VcbiAgLy8gbWFrZSBpdCBkZXBlbmQgb24gd2hldGhlciBTaGFkb3dEb20gZW5jYXBzdWxhdGlvbiBpcyB1c2VkIChpbiB3aGljaCBjYXNlIHRoZSBjb250ZW50IHNob3VsZCBiZVxuICAvLyBwcmVzZXJ2ZWQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvbikuIFNoYWRvd0RvbSBlbmNhcHN1bGF0aW9uIHJlcXVpcmVzIHByb2NlZHVyYWxcbiAgLy8gcmVuZGVyZXIsIGFuZCBwcm9jZWR1cmFsIHJlbmRlcmVyIGNhc2UgaXMgaGFuZGxlZCBhYm92ZS5cbiAgckVsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcblxuICByZXR1cm4gckVsZW1lbnQ7XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0TENsZWFudXAobFZpZXcpO1xuICBsQ2xlYW51cC5wdXNoKGNvbnRleHQpO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgfVxufVxuXG4vKipcbiAqIFNhdmVzIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGl0c2VsZiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IGZvciBmdW5jdGlvbnMgdGhhdCBhcmUgd3JhcHBlZCB3aXRoIHRoZWlyIGNvbnRleHRzLCBsaWtlIGluIHJlbmRlcmVyMlxuICogbGlzdGVuZXJzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5kZXggb2YgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXMgc2F2ZWQgaW4gVFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBGbih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBnZXRMQ2xlYW51cChsVmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRUVmlld0NsZWFudXAodFZpZXcpLnB1c2gobFZpZXdbQ0xFQU5VUF0hLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIGxldCBpbmplY3RvckluZGV4ID0gdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xO1xuICByZXR1cm4gbmdEZXZNb2RlID8gbmV3IFROb2RlRGVidWcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgdFZpZXcsICAgICAgICAgIC8vIHRWaWV3XzogVFZpZXdcbiAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlLCAgICAgICAgICAgLy8gdHlwZTogVE5vZGVUeXBlXG4gICAgICAgICAgICAgICAgICAgICAgICAgYWRqdXN0ZWRJbmRleCwgIC8vIGluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4LCAgLy8gaW5qZWN0b3JJbmRleDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlRW5kOiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIGZsYWdzOiBUTm9kZUZsYWdzXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lLCAgICAgICAgLy8gdGFnTmFtZTogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBhdHRycywgIC8vIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbWVyZ2VkQXR0cnNcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgIC8vIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBuZXh0OiBJVE5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHByb2plY3Rpb25OZXh0OiBJVE5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNoaWxkOiBJVE5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRQYXJlbnQsICAgIC8vIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBzdHlsZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gcmVzaWR1YWxTdHlsZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gY2xhc3Nlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyByZXNpZHVhbENsYXNzZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgMCBhcyBhbnksICAgLy8gY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAwIGFzIGFueSwgICAvLyBzdHlsZUJpbmRpbmdzOiBUU3R5bGluZ1JhbmdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICkgOlxuICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICBpbmRleDogYWRqdXN0ZWRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3JJbmRleDogaW5qZWN0b3JJbmRleCxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlU3RhcnQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGZsYWdzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgIGF0dHJzOiBhdHRycyxcbiAgICAgICAgICAgICAgICAgICAgICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5wdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICB0Vmlld3M6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBjaGlsZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50OiB0UGFyZW50LFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHJlc2lkdWFsU3R5bGVzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzZXM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc0JpbmRpbmdzOiAwIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVCaW5kaW5nczogMCBhcyBhbnksXG4gICAgICAgICAgICAgICAgICAgICB9O1xufVxuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIGlucHV0QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSwgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsXG4gICAgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBpbnB1dEFsaWFzTWFwKSB7XG4gICAgaWYgKGlucHV0QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSA9PT0gbnVsbCA/IHt9IDogcHJvcFN0b3JlO1xuICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gaW5wdXRBbGlhc01hcFtwdWJsaWNOYW1lXTtcblxuICAgICAgaWYgKHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZURlZklkeCwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgb3V0cHV0cyBhbmQgb3V0cHV0cy5cbiAqIEluaXRpYWxpemF0aW9uIGlzIGRvbmUgZm9yIGFsbCBkaXJlY3RpdmVzIG1hdGNoZWQgb24gYSBnaXZlbiBUTm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGRlZnMgPSB0Vmlldy5kYXRhO1xuXG4gIGNvbnN0IHROb2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgY29uc3QgaW5wdXRzRnJvbUF0dHJzOiBJbml0aWFsSW5wdXREYXRhID0gbmdEZXZNb2RlID8gbmV3IFROb2RlSW5pdGlhbElucHV0cygpIDogW107XG4gIGxldCBpbnB1dHNTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBsZXQgb3V0cHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBkaXJlY3RpdmVJbnB1dHMgPSBkaXJlY3RpdmVEZWYuaW5wdXRzO1xuICAgIGlucHV0c0Zyb21BdHRycy5wdXNoKFxuICAgICAgICB0Tm9kZUF0dHJzICE9PSBudWxsID8gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUlucHV0cywgdE5vZGVBdHRycykgOiBudWxsKTtcbiAgICBpbnB1dHNTdG9yZSA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKGRpcmVjdGl2ZUlucHV0cywgaSwgaW5wdXRzU3RvcmUpO1xuICAgIG91dHB1dHNTdG9yZSA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKGRpcmVjdGl2ZURlZi5vdXRwdXRzLCBpLCBvdXRwdXRzU3RvcmUpO1xuICB9XG5cbiAgaWYgKGlucHV0c1N0b3JlICE9PSBudWxsKSB7XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdjbGFzcycpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NsYXNzSW5wdXQ7XG4gICAgfVxuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnc3R5bGUnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNTdHlsZUlucHV0O1xuICAgIH1cbiAgfVxuXG4gIHROb2RlLmluaXRpYWxJbnB1dHMgPSBpbnB1dHNGcm9tQXR0cnM7XG4gIHROb2RlLmlucHV0cyA9IGlucHV0c1N0b3JlO1xuICB0Tm9kZS5vdXRwdXRzID0gb3V0cHV0c1N0b3JlO1xufVxuXG4vKipcbiAqIE1hcHBpbmcgYmV0d2VlbiBhdHRyaWJ1dGVzIG5hbWVzIHRoYXQgZG9uJ3QgY29ycmVzcG9uZCB0byB0aGVpciBlbGVtZW50IHByb3BlcnR5IG5hbWVzLlxuICpcbiAqIFBlcmZvcm1hbmNlIG5vdGU6IHRoaXMgZnVuY3Rpb24gaXMgd3JpdHRlbiBhcyBhIHNlcmllcyBvZiBpZiBjaGVja3MgKGluc3RlYWQgb2YsIHNheSwgYSBwcm9wZXJ0eVxuICogb2JqZWN0IGxvb2t1cCkgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgLSB0aGUgc2VyaWVzIG9mIGBpZmAgY2hlY2tzIHNlZW1zIHRvIGJlIHRoZSBmYXN0ZXN0IHdheSBvZlxuICogbWFwcGluZyBwcm9wZXJ0eSBuYW1lcy4gRG8gTk9UIGNoYW5nZSB3aXRob3V0IGJlbmNobWFya2luZy5cbiAqXG4gKiBOb3RlOiB0aGlzIG1hcHBpbmcgaGFzIHRvIGJlIGtlcHQgaW4gc3luYyB3aXRoIHRoZSBlcXVhbGx5IG5hbWVkIG1hcHBpbmcgaW4gdGhlIHRlbXBsYXRlXG4gKiB0eXBlLWNoZWNraW5nIG1hY2hpbmVyeSBvZiBuZ3RzYy5cbiAqL1xuZnVuY3Rpb24gbWFwUHJvcE5hbWUobmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgaWYgKG5hbWUgPT09ICdjbGFzcycpIHJldHVybiAnY2xhc3NOYW1lJztcbiAgaWYgKG5hbWUgPT09ICdmb3InKSByZXR1cm4gJ2h0bWxGb3InO1xuICBpZiAobmFtZSA9PT0gJ2Zvcm1hY3Rpb24nKSByZXR1cm4gJ2Zvcm1BY3Rpb24nO1xuICBpZiAobmFtZSA9PT0gJ2lubmVySHRtbCcpIHJldHVybiAnaW5uZXJIVE1MJztcbiAgaWYgKG5hbWUgPT09ICdyZWFkb25seScpIHJldHVybiAncmVhZE9ubHknO1xuICBpZiAobmFtZSA9PT0gJ3RhYmluZGV4JykgcmV0dXJuICd0YWJJbmRleCc7XG4gIHJldHVybiBuYW1lO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQsIHJlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCwgbmF0aXZlT25seTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgbGV0IGlucHV0RGF0YSA9IHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIGlucHV0RGF0YSAhPSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KHRWaWV3LCBsVmlldywgZGF0YVZhbHVlLCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgdE5vZGUuaW5kZXgpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHByb3BOYW1lID0gbWFwUHJvcE5hbWUocHJvcE5hbWUpO1xuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzKHByb3BOYW1lKTtcbiAgICAgIGlmICghdmFsaWRhdGVQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSkpIHtcbiAgICAgICAgLy8gUmV0dXJuIGhlcmUgc2luY2Ugd2Ugb25seSBsb2cgd2FybmluZ3MgZm9yIHVua25vd24gcHJvcGVydGllcy5cbiAgICAgICAgd2FybkFib3V0VW5rbm93blByb3BlcnR5KHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlXG4gICAgLy8gcHJvcGVydHkgaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBwcm9wTmFtZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvLyBJZiB0aGUgbm9kZSBpcyBhIGNvbnRhaW5lciBhbmQgdGhlIHByb3BlcnR5IGRpZG4ndFxuICAgIC8vIG1hdGNoIGFueSBvZiB0aGUgaW5wdXRzIG9yIHNjaGVtYXMgd2Ugc2hvdWxkIHRocm93LlxuICAgIGlmIChuZ0Rldk1vZGUgJiYgIW1hdGNoaW5nU2NoZW1hcyh0VmlldywgbFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICB3YXJuQWJvdXRVbmtub3duUHJvcGVydHkocHJvcE5hbWUsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0eShcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGF0dHJOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShhdHRyTmFtZSk7XG4gIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gIGlmICh0eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnJlbW92ZUF0dHJpYnV0ZShhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUsIGRlYnVnVmFsdWUpIDpcbiAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPSBgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWA7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB0ZXh0Q29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHRleHRDb250ZW50O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvKipcbiAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgKiBpKzE6IHByaXZhdGVOYW1lXG4gICAgICpcbiAgICAgKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMV1cbiAgICAgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFWYWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHR5cGUsIGRhdGFWYWx1ZVtpICsgMV0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCBwcm9wTmFtZTogc3RyaW5nLFxuICAgIHROb2RlOiBUTm9kZSk6IGJvb2xlYW4ge1xuICAvLyBUaGUgcHJvcGVydHkgaXMgY29uc2lkZXJlZCB2YWxpZCBpZiB0aGUgZWxlbWVudCBtYXRjaGVzIHRoZSBzY2hlbWEsIGl0IGV4aXN0cyBvbiB0aGUgZWxlbWVudFxuICAvLyBvciBpdCBpcyBzeW50aGV0aWMsIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQgKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpLlxuICBpZiAobWF0Y2hpbmdTY2hlbWFzKHRWaWV3LCBsVmlldywgdE5vZGUudGFnTmFtZSkgfHwgcHJvcE5hbWUgaW4gZWxlbWVudCB8fFxuICAgICAgaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgLy8gTm90ZTogYHR5cGVvZiBOb2RlYCByZXR1cm5zICdmdW5jdGlvbicgaW4gbW9zdCBicm93c2VycywgYnV0IG9uIElFIGl0IGlzICdvYmplY3QnIHNvIHdlXG4gIC8vIG5lZWQgdG8gYWNjb3VudCBmb3IgYm90aCBoZXJlLCB3aGlsZSBiZWluZyBjYXJlZnVsIGZvciBgdHlwZW9mIG51bGxgIGFsc28gcmV0dXJuaW5nICdvYmplY3QnLlxuICByZXR1cm4gdHlwZW9mIE5vZGUgPT09ICd1bmRlZmluZWQnIHx8IE5vZGUgPT09IG51bGwgfHwgIShlbGVtZW50IGluc3RhbmNlb2YgTm9kZSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaGluZ1NjaGVtYXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRhZ05hbWU6IHN0cmluZ3xudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjaGVtYXMgPSB0Vmlldy5zY2hlbWFzO1xuXG4gIGlmIChzY2hlbWFzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzY2hlbWEgPSBzY2hlbWFzW2ldO1xuICAgICAgaWYgKHNjaGVtYSA9PT0gTk9fRVJST1JTX1NDSEVNQSB8fFxuICAgICAgICAgIHNjaGVtYSA9PT0gQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSAmJiB0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiAqIExvZ3MgYSB3YXJuaW5nIHRoYXQgYSBwcm9wZXJ0eSBpcyBub3Qgc3VwcG9ydGVkIG9uIGFuIGVsZW1lbnQuXG4gKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiB0aGUgaW52YWxpZCBwcm9wZXJ0eS5cbiAqIEBwYXJhbSB0Tm9kZSBOb2RlIG9uIHdoaWNoIHdlIGVuY291bnRlcmVkIHRoZSBwcm9wZXJ0eS5cbiAqL1xuZnVuY3Rpb24gd2FybkFib3V0VW5rbm93blByb3BlcnR5KHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBjb25zb2xlLndhcm4oXG4gICAgICBgQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dE5vZGUudGFnTmFtZX0nLmApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0Vmlldywgcm9vdFROb2RlLCAxKTtcbiAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0VmlldywgbFZpZXcsIGRlZik7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIHRWaWV3LCBsVmlldy5sZW5ndGggLSAxLCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHJvb3RUTm9kZSwgbFZpZXcpO1xuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwpOiBib29sZWFuIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW5cbiAgLy8gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgbGV0IGhhc0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgaWYgKGdldEJpbmRpbmdzRW5hYmxlZCgpKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsID0gZmluZERpcmVjdGl2ZURlZk1hdGNoZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9fG51bGwpID0gbG9jYWxSZWZzID09PSBudWxsID8gbnVsbCA6IHsnJzogLTF9O1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZnMgIT09IG51bGwpIHtcbiAgICAgIGxldCB0b3RhbERpcmVjdGl2ZUhvc3RWYXJzID0gMDtcbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgICAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVEZWZzLmxlbmd0aCk7XG4gICAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAgIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gICAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgICAgLy8gaW1wb3J0YW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVEZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZURlZnNbaV07XG4gICAgICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgICAgfVxuICAgICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZURlZnMubGVuZ3RoKTtcbiAgICAgIGxldCBwcmVPcmRlckhvb2tzRm91bmQgPSBmYWxzZTtcbiAgICAgIGxldCBwcmVPcmRlckNoZWNrSG9va3NGb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVEZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZURlZnNbaV07XG4gICAgICAgIC8vIE1lcmdlIHRoZSBhdHRycyBpbiB0aGUgb3JkZXIgb2YgbWF0Y2hlcy4gVGhpcyBhc3N1bWVzIHRoYXQgdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyB0aGVcbiAgICAgICAgLy8gY29tcG9uZW50IGl0c2VsZiwgc28gdGhhdCB0aGUgY29tcG9uZW50IGhhcyB0aGUgbGVhc3QgcHJpb3JpdHkuXG4gICAgICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuXG4gICAgICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCBsVmlldywgZGVmKTtcblxuICAgICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKHRWaWV3LmRhdGEhLmxlbmd0aCAtIDEsIGRlZiwgZXhwb3J0c01hcCk7XG5cbiAgICAgICAgaWYgKGRlZi5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gICAgICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsIHx8IGRlZi5ob3N0QXR0cnMgIT09IG51bGwgfHwgZGVmLmhvc3RWYXJzICE9PSAwKVxuICAgICAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzO1xuXG4gICAgICAgIC8vIE9ubHkgcHVzaCBhIG5vZGUgaW5kZXggaW50byB0aGUgcHJlT3JkZXJIb29rcyBhcnJheSBpZiB0aGlzIGlzIHRoZSBmaXJzdFxuICAgICAgICAvLyBwcmUtb3JkZXIgaG9vayBmb3VuZCBvbiB0aGlzIG5vZGUuXG4gICAgICAgIGlmICghcHJlT3JkZXJIb29rc0ZvdW5kICYmIChkZWYub25DaGFuZ2VzIHx8IGRlZi5vbkluaXQgfHwgZGVmLmRvQ2hlY2spKSB7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBwdXNoIHRoZSBhY3R1YWwgaG9vayBmdW5jdGlvbiBpbnRvIHRoaXMgYXJyYXkgbGF0ZXIgZHVyaW5nIGRpciBpbnN0YW50aWF0aW9uLlxuICAgICAgICAgIC8vIFdlIGNhbm5vdCBkbyBpdCBub3cgYmVjYXVzZSB3ZSBtdXN0IGVuc3VyZSBob29rcyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgc2FtZVxuICAgICAgICAgIC8vIG9yZGVyIHRoYXQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCAoaS5lLiBpbmplY3Rpb24gb3JkZXIpLlxuICAgICAgICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgICAgICAgcHJlT3JkZXJIb29rc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgJiYgKGRlZi5vbkNoYW5nZXMgfHwgZGVmLmRvQ2hlY2spKSB7XG4gICAgICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKVxuICAgICAgICAgICAgICAucHVzaCh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgICAgICAgIHByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGFkZEhvc3RCaW5kaW5nc1RvRXhwYW5kb0luc3RydWN0aW9ucyh0VmlldywgZGVmKTtcbiAgICAgICAgdG90YWxEaXJlY3RpdmVIb3N0VmFycyArPSBkZWYuaG9zdFZhcnM7XG4gICAgICB9XG5cbiAgICAgIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXcsIHROb2RlKTtcbiAgICAgIGdyb3dIb3N0VmFyc1NwYWNlKHRWaWV3LCBsVmlldywgdG90YWxEaXJlY3RpdmVIb3N0VmFycyk7XG4gICAgfVxuICAgIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbiAgfVxuICAvLyBNZXJnZSB0aGUgdGVtcGxhdGUgYXR0cnMgbGFzdCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgaGlnaGVzdCBwcmlvcml0eS5cbiAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgdE5vZGUuYXR0cnMpO1xuICByZXR1cm4gaGFzRGlyZWN0aXZlcztcbn1cblxuLyoqXG4gKiBBZGQgYGhvc3RCaW5kaW5nc2AgdG8gdGhlIGBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGUgYGhvc3RCaW5kaW5nc2Agc2hvdWxkIGJlIGFkZGVkLlxuICogQHBhcmFtIGRlZiBgQ29tcG9uZW50RGVmYC9gRGlyZWN0aXZlRGVmYCwgd2hpY2ggY29udGFpbnMgdGhlIGBob3N0VmFyc2AvYGhvc3RCaW5kaW5nc2AgdG8gYWRkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkSG9zdEJpbmRpbmdzVG9FeHBhbmRvSW5zdHJ1Y3Rpb25zKFxuICAgIHRWaWV3OiBUVmlldywgZGVmOiBDb21wb25lbnREZWY8YW55PnxEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMhO1xuICAvLyBUT0RPKG1pc2tvKTogUEVSRiB3ZSBhcmUgYWRkaW5nIGBob3N0QmluZGluZ3NgIGV2ZW4gaWYgdGhlcmUgaXMgbm90aGluZyB0byBhZGQhIFRoaXMgaXNcbiAgLy8gc3Vib3B0aW1hbCBmb3IgcGVyZm9ybWFuY2UuIGBkZWYuaG9zdEJpbmRpbmdzYCBtYXkgYmUgbnVsbCxcbiAgLy8gYnV0IHdlIHN0aWxsIG5lZWQgdG8gcHVzaCBudWxsIHRvIHRoZSBhcnJheSBhcyBhIHBsYWNlaG9sZGVyXG4gIC8vIHRvIGVuc3VyZSB0aGUgZGlyZWN0aXZlIGNvdW50ZXIgaXMgaW5jcmVtZW50ZWQgKHNvIGhvc3RcbiAgLy8gYmluZGluZyBmdW5jdGlvbnMgYWx3YXlzIGxpbmUgdXAgd2l0aCB0aGUgY29ycmVjdGl2ZSBkaXJlY3RpdmUpLlxuICAvLyBUaGlzIGlzIHN1Ym9wdGltYWwgZm9yIHBlcmZvcm1hbmNlLiBTZWUgYGN1cnJlbnREaXJlY3RpdmVJbmRleGBcbiAgLy8gIGNvbW1lbnQgaW4gYHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9uc2AgZm9yIG1vcmVcbiAgLy8gZGV0YWlscy4gIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICBjb25zdCBob3N0VmFycyA9IGRlZi5ob3N0VmFycztcbiAgaWYgKGhvc3RWYXJzICE9PSAwKSB7XG4gICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0VmFycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHcm93IHRoZSBgTFZpZXdgLCBibHVlcHJpbnQgYW5kIGBUVmlldy5kYXRhYCB0byBhY2NvbW1vZGF0ZSB0aGUgYGhvc3RCaW5kaW5nc2AuXG4gKlxuICogVG8gc3VwcG9ydCBsb2NhbGl0eSB3ZSBkb24ndCBrbm93IGFoZWFkIG9mIHRpbWUgaG93IG1hbnkgYGhvc3RWYXJzYCBvZiB0aGUgY29udGFpbmluZyBkaXJlY3RpdmVzXG4gKiB3ZSBuZWVkIHRvIGFsbG9jYXRlLiBGb3IgdGhpcyByZWFzb24gd2UgYWxsb3cgZ3Jvd2luZyB0aGVzZSBkYXRhIHN0cnVjdHVyZXMgYXMgd2UgZGlzY292ZXIgbW9yZVxuICogZGlyZWN0aXZlcyB0byBhY2NvbW1vZGF0ZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGdyb3duLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgZ3Jvd24uXG4gKiBAcGFyYW0gY291bnQgU2l6ZSBieSB3aGljaCB3ZSBuZWVkIHRvIGdyb3cgdGhlIGRhdGEgc3RydWN0dXJlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3dIb3N0VmFyc1NwYWNlKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb3VudDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBtdXN0IGJlIGFzc29jaWF0ZWQgd2l0aCBgVFZpZXdgIScpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBsVmlldy5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLCBuYXRpdmU6IFJOb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGlzQ29tcG9uZW50ID0gaXNDb21wb25lbnREZWYoZGVmKTtcblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKGxWaWV3LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIHRWaWV3LCBpLCB0Tm9kZSk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuXG4gICAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICAgIHNldElucHV0c0Zyb21BdHRycyhsVmlldywgaSAtIHN0YXJ0LCBkaXJlY3RpdmUsIGRlZiwgdE5vZGUsIGluaXRpYWxJbnB1dHMhKTtcbiAgICB9XG5cbiAgICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zITtcbiAgY29uc3QgZmlyc3RDcmVhdGVQYXNzID0gdFZpZXcuZmlyc3RDcmVhdGVQYXNzO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIHRyeSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXgpO1xuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gbFZpZXdbaV07XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9IGVsc2UgaWYgKGZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgICBleHBhbmRvLnB1c2gobnVsbCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbiAqXG4gKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiAqIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICdFeHBhbmRvIGJsb2NrIHNob3VsZCBvbmx5IGJlIGdlbmVyYXRlZCBvbiBmaXJzdCBjcmVhdGUgcGFzcy4nKTtcblxuICAvLyBJbXBvcnRhbnQ6IEluIEpTIGAteGAgYW5kIGAwLXhgIGlzIG5vdCB0aGUgc2FtZSEgSWYgYHg9PT0wYCB0aGVuIGAteGAgd2lsbCBwcm9kdWNlIGAtMGAgd2hpY2hcbiAgLy8gcmVxdWlyZXMgbm9uIHN0YW5kYXJkIG1hdGggYXJpdGhtZXRpYyBhbmQgaXQgY2FuIHByZXZlbnQgVk0gb3B0aW1pemF0aW9ucy5cbiAgLy8gYDAtMGAgd2lsbCBhbHdheXMgcHJvZHVjZSBgMGAgYW5kIHdpbGwgbm90IGNhdXNlIGEgcG90ZW50aWFsIGRlb3B0aW1pemF0aW9uIGluIFZNLlxuICBjb25zdCBlbGVtZW50SW5kZXggPSBIRUFERVJfT0ZGU0VUIC0gdE5vZGUuaW5kZXg7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW10pKVxuICAgICAgLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogYW55W118bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBuZ0Rldk1vZGUgPyBuZXcgTWF0Y2hlc0FycmF5KCkgOiBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdFZpZXcsIGRlZi50eXBlKTtcblxuICAgICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlKTtcbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgZ2l2ZW4gVE5vZGUgYXMgYSBjb21wb25lbnQncyBob3N0LiBUaGlzIGNvbnNpc3RzIG9mOlxuICogLSBzZXR0aW5nIGFwcHJvcHJpYXRlIFROb2RlIGZsYWdzO1xuICogLSBzdG9yaW5nIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXc6IFRWaWV3LCBob3N0VE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBob3N0VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0NvbXBvbmVudEhvc3Q7XG4gICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gbmdEZXZNb2RlID8gbmV3IFRWaWV3Q29tcG9uZW50cygpIDogW10pKVxuICAgICAgLnB1c2goaG9zdFROb2RlLmluZGV4KTtcbn1cblxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUxvY2FsTmFtZXMoKSA6IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRUTm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3Q7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG5mdW5jdGlvbiBiYXNlUmVzb2x2ZURpcmVjdGl2ZTxUPih0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBEaXJlY3RpdmVEZWY8VD4pIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIG51bGwpO1xuICB0Vmlldy5ibHVlcHJpbnQucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbiAgdmlld0RhdGEucHVzaChub2RlSW5qZWN0b3JGYWN0b3J5KTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4obFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRDb21wb25lbnRWaWV3KGRlZik7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG5hdGl2ZSxcbiAgICAgICAgICBob3N0VE5vZGUgYXMgVEVsZW1lbnROb2RlLCByZW5kZXJlckZhY3RvcnksIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihuYXRpdmUsIGRlZikpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIG5nRGV2TW9kZSAmJiB2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMobmFtZSk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgc2FuaXRpemVyID09IG51bGwgPyByZW5kZXJTdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS50YWdOYW1lIHx8ICcnLCBuYW1lKTtcblxuXG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlLCBuYW1lc3BhY2UpO1xuICAgIH0gZWxzZSB7XG4gICAgICBuYW1lc3BhY2UgPyBlbGVtZW50LnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgc3RyVmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgIGVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHN0clZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBMVmlldyB0aGF0IGlzIGJlaW5nIHByb2Nlc3NlZC5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBkZWYgVGhlIGRpcmVjdGl2ZSBkZWYgdGhhdCBjb250YWlucyB0aGUgbGlzdCBvZiBpbnB1dHNcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnN0YW5jZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIHROb2RlOiBUTm9kZSxcbiAgICBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhKTogdm9pZCB7XG4gIGNvbnN0IGluaXRpYWxJbnB1dHM6IEluaXRpYWxJbnB1dHN8bnVsbCA9IGluaXRpYWxJbnB1dERhdGEhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgZGVmLnNldElucHV0IShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgICAgfVxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gYXR0cnMgVGhlIHN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIGF0dHJzOiBUQXR0cmlidXRlcyk6IEluaXRpYWxJbnB1dHN8XG4gICAgbnVsbCB7XG4gIGxldCBpbnB1dHNUb1N0b3JlOiBJbml0aWFsSW5wdXRzfG51bGwgPSBudWxsO1xuICBsZXQgaSA9IDA7XG4gIHdoaWxlIChpIDwgYXR0cnMubGVuZ3RoKSB7XG4gICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgIC8vIFdlIGRvIG5vdCBhbGxvdyBpbnB1dHMgb24gbmFtZXNwYWNlZCBhdHRyaWJ1dGVzLlxuICAgICAgaSArPSA0O1xuICAgICAgY29udGludWU7XG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlByb2plY3RBcykge1xuICAgICAgLy8gU2tpcCBvdmVyIHRoZSBgbmdQcm9qZWN0QXNgIHZhbHVlLlxuICAgICAgaSArPSAyO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gSWYgd2UgaGl0IGFueSBvdGhlciBhdHRyaWJ1dGUgbWFya2Vycywgd2UncmUgZG9uZSBhbnl3YXkuIE5vbmUgb2YgdGhvc2UgYXJlIHZhbGlkIGlucHV0cy5cbiAgICBpZiAodHlwZW9mIGF0dHJOYW1lID09PSAnbnVtYmVyJykgYnJlYWs7XG5cbiAgICBpZiAoaW5wdXRzLmhhc093blByb3BlcnR5KGF0dHJOYW1lIGFzIHN0cmluZykpIHtcbiAgICAgIGlmIChpbnB1dHNUb1N0b3JlID09PSBudWxsKSBpbnB1dHNUb1N0b3JlID0gW107XG4gICAgICBpbnB1dHNUb1N0b3JlLnB1c2goYXR0ck5hbWUgYXMgc3RyaW5nLCBpbnB1dHNbYXR0ck5hbWUgYXMgc3RyaW5nXSwgYXR0cnNbaSArIDFdIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbnB1dHNUb1N0b3JlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLy8gTm90IHN1cmUgd2h5IEkgbmVlZCB0byBkbyBgYW55YCBoZXJlIGJ1dCBUUyBjb21wbGFpbnMgbGF0ZXIuXG5jb25zdCBMQ29udGFpbmVyQXJyYXk6IGFueSA9ICgodHlwZW9mIG5nRGV2TW9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgbmdEZXZNb2RlKSAmJiBpbml0TmdEZXZNb2RlKCkpICYmXG4gICAgY3JlYXRlTmFtZWRBcnJheVR5cGUoJ0xDb250YWluZXInKTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCxcbiAgICB0Tm9kZTogVE5vZGUpOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgbmdEZXZNb2RlICYmICFpc1Byb2NlZHVyYWxSZW5kZXJlcihjdXJyZW50Vmlld1tSRU5ERVJFUl0pICYmIGFzc2VydERvbU5vZGUobmF0aXZlKTtcbiAgLy8gaHR0cHM6Ly9qc3BlcmYuY29tL2FycmF5LWxpdGVyYWwtdnMtbmV3LWFycmF5LXJlYWxseVxuICBjb25zdCBsQ29udGFpbmVyOiBMQ29udGFpbmVyID0gbmV3IChuZ0Rldk1vZGUgPyBMQ29udGFpbmVyQXJyYXkgOiBBcnJheSkoXG4gICAgICBob3N0TmF0aXZlLCAgLy8gaG9zdCBuYXRpdmVcbiAgICAgIHRydWUsICAgICAgICAvLyBCb29sZWFuIGB0cnVlYCBpbiB0aGlzIHBvc2l0aW9uIHNpZ25pZmllcyB0aGF0IHRoaXMgaXMgYW4gYExDb250YWluZXJgXG4gICAgICBBY3RpdmVJbmRleEZsYWcuRFlOQU1JQ19FTUJFRERFRF9WSUVXU19PTkxZIDw8IEFjdGl2ZUluZGV4RmxhZy5TSElGVCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgICAgY3VycmVudFZpZXcsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmV4dFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgICB0Tm9kZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRfaG9zdFxuICAgICAgbmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuYXRpdmUsXG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXcgcmVmc1xuICApO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuXG4vKipcbiAqIEdvZXMgb3ZlciBkeW5hbWljIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgbGV0IHZpZXdPckNvbnRhaW5lciA9IGxWaWV3W0NISUxEX0hFQURdO1xuICB3aGlsZSAodmlld09yQ29udGFpbmVyICE9PSBudWxsKSB7XG4gICAgLy8gTm90ZTogdmlld09yQ29udGFpbmVyIGNhbiBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seVxuICAgIC8vIGludGVyZXN0ZWQgaW4gTENvbnRhaW5lclxuICAgIGxldCBhY3RpdmVJbmRleEZsYWc6IEFjdGl2ZUluZGV4RmxhZztcbiAgICBpZiAoaXNMQ29udGFpbmVyKHZpZXdPckNvbnRhaW5lcikgJiZcbiAgICAgICAgKGFjdGl2ZUluZGV4RmxhZyA9IHZpZXdPckNvbnRhaW5lcltBQ1RJVkVfSU5ERVhdKSA+PiBBY3RpdmVJbmRleEZsYWcuU0hJRlQgPT09XG4gICAgICAgICAgICBBY3RpdmVJbmRleEZsYWcuRFlOQU1JQ19FTUJFRERFRF9WSUVXU19PTkxZKSB7XG4gICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCB2aWV3T3JDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IHZpZXdPckNvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IGVtYmVkZGVkTFZpZXdbVFZJRVddO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbWJlZGRlZFRWaWV3LCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoZW1iZWRkZWRMVmlldykpIHtcbiAgICAgICAgICByZWZyZXNoVmlldyhcbiAgICAgICAgICAgICAgZW1iZWRkZWRUVmlldywgZW1iZWRkZWRMVmlldywgZW1iZWRkZWRUVmlldy50ZW1wbGF0ZSwgZW1iZWRkZWRMVmlld1tDT05URVhUXSEpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoKGFjdGl2ZUluZGV4RmxhZyAmIEFjdGl2ZUluZGV4RmxhZy5IQVNfVFJBTlNQTEFOVEVEX1ZJRVdTKSAhPT0gMCkge1xuICAgICAgICAvLyBXZSBzaG91bGQgb25seSBDRCBtb3ZlZCB2aWV3cyBpZiB0aGUgY29tcG9uZW50IHdoZXJlIHRoZXkgd2VyZSBpbnNlcnRlZCBkb2VzIG5vdCBtYXRjaFxuICAgICAgICAvLyB0aGUgY29tcG9uZW50IHdoZXJlIHRoZXkgd2VyZSBkZWNsYXJlZCBhbmQgaW5zZXJ0aW9uIGlzIG9uLXB1c2guIE1vdmVkIHZpZXdzIGFsc29cbiAgICAgICAgLy8gY29udGFpbnMgaW50cmEgY29tcG9uZW50IG1vdmVzLCBvciBjaGVjay1hbHdheXMgd2hpY2ggbmVlZCB0byBiZSBza2lwcGVkLlxuICAgICAgICByZWZyZXNoVHJhbnNwbGFudGVkVmlld3Modmlld09yQ29udGFpbmVyLCBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10hKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmlld09yQ29udGFpbmVyID0gdmlld09yQ29udGFpbmVyW05FWFRdO1xuICB9XG59XG5cblxuLyoqXG4gKiBSZWZyZXNoIHRyYW5zcGxhbnRlZCBMVmlld3MuXG4gKlxuICogU2VlOiBgQWN0aXZlSW5kZXhGbGFnLkhBU19UUkFOU1BMQU5URURfVklFV1NgIGFuZCBgTFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddYCBmb3JcbiAqIGV4cGxhbmF0aW9uIG9mIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqXG4gKiBAcGFyYW0gbENvbnRhaW5lciBUaGUgYExDb250YWluZXJgIHdoaWNoIGhhcyB0cmFuc3BsYW50ZWQgdmlld3MuXG4gKiBAcGFyYW0gZGVjbGFyZWRDb21wb25lbnRMVmlldyBUaGUgYGxDb250YWluZXJgIHBhcmVudCBjb21wb25lbnQgYExWaWV3YC5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdzKGxDb250YWluZXI6IExDb250YWluZXIsIGRlY2xhcmVkQ29tcG9uZW50TFZpZXc6IExWaWV3KSB7XG4gIGNvbnN0IG1vdmVkVmlld3MgPSBsQ29udGFpbmVyW01PVkVEX1ZJRVdTXSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0hO1xuICAgIGNvbnN0IGluc2VydGlvbkxDb250YWluZXIgPSBtb3ZlZExWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcbiAgICBjb25zdCBpbnNlcnRlZENvbXBvbmVudExWaWV3ID0gaW5zZXJ0aW9uTENvbnRhaW5lcltQQVJFTlRdW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSE7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaW5zZXJ0ZWRDb21wb25lbnRMVmlldywgJ01pc3NpbmcgTFZpZXcnKTtcbiAgICAvLyBDaGVjayBpZiB3ZSBoYXZlIGEgdHJhbnNwbGFudGVkIHZpZXcgYnkgY29tcGVyaW5nIGRlY2xhcmF0aW9uIGFuZCBpbnNlcnRpb24gbG9jYXRpb24uXG4gICAgaWYgKGluc2VydGVkQ29tcG9uZW50TFZpZXcgIT09IGRlY2xhcmVkQ29tcG9uZW50TFZpZXcpIHtcbiAgICAgIC8vIFllcyB0aGUgYExWaWV3YCBpcyB0cmFuc3BsYW50ZWQuXG4gICAgICAvLyBIZXJlIHdlIHdvdWxkIGxpa2UgdG8ga25vdyBpZiB0aGUgY29tcG9uZW50IGlzIGBPblB1c2hgLiBXZSBkb24ndCBoYXZlXG4gICAgICAvLyBleHBsaWNpdCBgT25QdXNoYCBmbGFnIGluc3RlYWQgd2Ugc2V0IGBDaGVja0Fsd2F5c2AgdG8gZmFsc2UgKHdoaWNoIGlzIGBPblB1c2hgKVxuICAgICAgLy8gTm90IHRvIGJlIGNvbmZ1c2VkIHdpdGggYE1hbnVhbE9uUHVzaGAgd2hpY2ggaXMgdXNlZCB3aXRoIHdldGhlciBhIERPTSBldmVudFxuICAgICAgLy8gc2hvdWxkIGF1dG9tYXRpY2FsbHkgbWFyayBhIHZpZXcgYXMgZGlydHkuXG4gICAgICBjb25zdCBpbnNlcnRpb25Db21wb25lbnRJc09uUHVzaCA9XG4gICAgICAgICAgKGluc2VydGVkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykgPT09IDA7XG4gICAgICBpZiAoaW5zZXJ0aW9uQ29tcG9uZW50SXNPblB1c2gpIHtcbiAgICAgICAgLy8gSGVyZSB3ZSBrbm93IHRoYXQgdGhlIHRlbXBsYXRlIGhhcyBiZWVuIHRyYW5zcGxhbnRlZCBhY3Jvc3MgY29tcG9uZW50cyBhbmQgaXNcbiAgICAgICAgLy8gb24tcHVzaCAobm90IGp1c3QgbW92ZWQgd2l0aGluIGEgY29tcG9uZW50KS4gSWYgdGhlIGluc2VydGlvbiBpcyBtYXJrZWQgZGlydHksIHRoZW5cbiAgICAgICAgLy8gdGhlcmUgaXMgbm8gbmVlZCB0byBDRCBoZXJlIGFzIHdlIHdpbGwgZG8gaXQgYWdhaW4gbGF0ZXIgd2hlbiB3ZSBnZXQgdG8gaW5zZXJ0aW9uXG4gICAgICAgIC8vIHBvaW50LlxuICAgICAgICBjb25zdCBtb3ZlZFRWaWV3ID0gbW92ZWRMVmlld1tUVklFV107XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZWZyZXNoVmlldyhtb3ZlZFRWaWV3LCBtb3ZlZExWaWV3LCBtb3ZlZFRWaWV3LnRlbXBsYXRlLCBtb3ZlZExWaWV3W0NPTlRFWFRdISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpICYmXG4gICAgICBjb21wb25lbnRWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICAgIHJlZnJlc2hWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRUVmlldy50ZW1wbGF0ZSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRUVmlldywgY29tcG9uZW50Vmlldyk7XG4gIHJlbmRlclZpZXcoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xufVxuXG4vKipcbiAqIFN5bmNzIGFuIExWaWV3IGluc3RhbmNlIHdpdGggaXRzIGJsdWVwcmludCBpZiB0aGV5IGhhdmUgZ290dGVuIG91dCBvZiBzeW5jLlxuICpcbiAqIFR5cGljYWxseSwgYmx1ZXByaW50cyBhbmQgdGhlaXIgdmlldyBpbnN0YW5jZXMgc2hvdWxkIGFsd2F5cyBiZSBpbiBzeW5jLCBzbyB0aGUgbG9vcCBoZXJlXG4gKiB3aWxsIGJlIHNraXBwZWQuIEhvd2V2ZXIsIGNvbnNpZGVyIHRoaXMgY2FzZSBvZiB0d28gY29tcG9uZW50cyBzaWRlLWJ5LXNpZGU6XG4gKlxuICogQXBwIHRlbXBsYXRlOlxuICogYGBgXG4gKiA8Y29tcD48L2NvbXA+XG4gKiA8Y29tcD48L2NvbXA+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdpbGwgaGFwcGVuOlxuICogMS4gQXBwIHRlbXBsYXRlIGJlZ2lucyBwcm9jZXNzaW5nLlxuICogMi4gRmlyc3QgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogMy4gU2Vjb25kIDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDQuIEFwcCB0ZW1wbGF0ZSBjb21wbGV0ZXMgcHJvY2Vzc2luZywgc28gaXQncyB0aW1lIHRvIGNoZWNrIGNoaWxkIHRlbXBsYXRlcy5cbiAqIDUuIEZpcnN0IDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdCBoYXMgYSBkaXJlY3RpdmUsIHNvIGl0cyBkZWYgaXMgcHVzaGVkIHRvIGJsdWVwcmludC5cbiAqIDYuIFNlY29uZCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXRzIGJsdWVwcmludCBoYXMgYmVlbiB1cGRhdGVkIGJ5IHRoZSBmaXJzdFxuICogPGNvbXA+IHRlbXBsYXRlLCBidXQgaXRzIExWaWV3IHdhcyBjcmVhdGVkIGJlZm9yZSB0aGlzIHVwZGF0ZSwgc28gaXQgaXMgb3V0IG9mIHN5bmMuXG4gKlxuICogTm90ZSB0aGF0IGVtYmVkZGVkIHZpZXdzIGluc2lkZSBuZ0ZvciBsb29wcyB3aWxsIG5ldmVyIGJlIG91dCBvZiBzeW5jIGJlY2F1c2UgdGhlc2Ugdmlld3NcbiAqIGFyZSBwcm9jZXNzZWQgYXMgc29vbiBhcyB0aGV5IGFyZSBjcmVhdGVkLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBibHVlcHJpbnQgZm9yIHN5bmNpbmdcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludCh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBpID0gbFZpZXcubGVuZ3RoOyBpIDwgdFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgbFZpZXcucHVzaCh0Vmlldy5ibHVlcHJpbnRbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4obFZpZXc6IExWaWV3LCBsVmlld09yTENvbnRhaW5lcjogVCk6IFQge1xuICAvLyBUT0RPKGJlbmxlc2gvbWlza28pOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGluY29ycmVjdCwgYmVjYXVzZSBpdCBhbHdheXMgYWRkcyB0aGUgTENvbnRhaW5lclxuICAvLyB0byB0aGUgZW5kIG9mIHRoZSBxdWV1ZSwgd2hpY2ggbWVhbnMgaWYgdGhlIGRldmVsb3BlciByZXRyaWV2ZXMgdGhlIExDb250YWluZXJzIGZyb20gUk5vZGVzIG91dFxuICAvLyBvZiBvcmRlciwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBydW4gb3V0IG9mIG9yZGVyLCBhcyB0aGUgYWN0IG9mIHJldHJpZXZpbmcgdGhlIHRoZVxuICAvLyBMQ29udGFpbmVyIGZyb20gdGhlIFJOb2RlIGlzIHdoYXQgYWRkcyBpdCB0byB0aGUgcXVldWUuXG4gIGlmIChsVmlld1tDSElMRF9IRUFEXSkge1xuICAgIGxWaWV3W0NISUxEX1RBSUxdIVtORVhUXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIGxWaWV3W0NISUxEX0hFQURdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH1cbiAgbFZpZXdbQ0hJTERfVEFJTF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICB3aGlsZSAobFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ITtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0OiBSb290Q29udGV4dCwgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3MpIHtcbiAgY29uc3Qgbm90aGluZ1NjaGVkdWxlZCA9IHJvb3RDb250ZXh0LmZsYWdzID09PSBSb290Q29udGV4dEZsYWdzLkVtcHR5O1xuICByb290Q29udGV4dC5mbGFncyB8PSBmbGFncztcblxuICBpZiAobm90aGluZ1NjaGVkdWxlZCAmJiByb290Q29udGV4dC5jbGVhbiA9PSBfQ0xFQU5fUFJPTUlTRSkge1xuICAgIGxldCByZXM6IG51bGx8KCh2YWw6IG51bGwpID0+IHZvaWQpO1xuICAgIHJvb3RDb250ZXh0LmNsZWFuID0gbmV3IFByb21pc2U8bnVsbD4oKHIpID0+IHJlcyA9IHIpO1xuICAgIHJvb3RDb250ZXh0LnNjaGVkdWxlcigoKSA9PiB7XG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcztcbiAgICAgICAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzO1xuICAgICAgICBjb25zdCBwbGF5ZXJIYW5kbGVyID0gcm9vdENvbnRleHQucGxheWVySGFuZGxlcjtcbiAgICAgICAgaWYgKHBsYXllckhhbmRsZXIpIHtcbiAgICAgICAgICBwbGF5ZXJIYW5kbGVyLmZsdXNoUGxheWVycygpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgICByZXMhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIGNvbnN0IGxWaWV3ID0gcmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSE7XG4gICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBpZiAocmVuZGVyZXJGYWN0b3J5LmJlZ2luKSByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgdHJ5IHtcbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBjb250ZXh0KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBoYW5kbGVFcnJvcihsVmlldywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWw8VD4odFZpZXc6IFRWaWV3LCB2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHRWaWV3LCB2aWV3LCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihcbiAgICBmbGFnczogUmVuZGVyRmxhZ3MsIHZpZXdRdWVyeUZuOiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PiwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdRdWVyeUZuLCAnVmlldyBxdWVyaWVzIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgbXVzdCBiZSBkZWZpbmVkLicpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgdmlld1F1ZXJ5Rm4oZmxhZ3MsIGNvbXBvbmVudCk7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogU3RvcmVzIG1ldGEtZGF0YSBmb3IgYSBwcm9wZXJ0eSBiaW5kaW5nIHRvIGJlIHVzZWQgYnkgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2AuXG4gKlxuICogSW4gb3JkZXIgdG8gc3VwcG9ydCBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYCB3ZSBuZWVkIHRvIHNhdmUsIGZvciBlYWNoIGJpbmRpbmc6XG4gKiAtIGEgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIC0gYSBzdGF0aWMgcGFydHMgb2YgaW50ZXJwb2xhdGVkIHN0cmluZ3M7XG4gKlxuICogQSBnaXZlbiBwcm9wZXJ0eSBtZXRhZGF0YSBpcyBzYXZlZCBhdCB0aGUgYmluZGluZydzIGluZGV4IGluIHRoZSBgVFZpZXcuZGF0YWAgKGluIG90aGVyIHdvcmRzLCBhXG4gKiBwcm9wZXJ0eSBiaW5kaW5nIG1ldGFkYXRhIHdpbGwgYmUgc3RvcmVkIGluIGBUVmlldy5kYXRhYCBhdCB0aGUgc2FtZSBpbmRleCBhcyBhIGJvdW5kIHZhbHVlIGluXG4gKiBgTFZpZXdgKS4gTWV0YWRhdGEgYXJlIHJlcHJlc2VudGVkIGFzIGBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUmAtZGVsaW1pdGVkIHN0cmluZyB3aXRoIHRoZVxuICogZm9sbG93aW5nIGZvcm1hdDpcbiAqIC0gYHByb3BlcnR5TmFtZWAgZm9yIGJvdW5kIHByb3BlcnRpZXM7XG4gKiAtIGBwcm9wZXJ0eU5hbWXvv71wcmVmaXjvv71pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Me+/vS4uaW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydE7vv71zdWZmaXhgIGZvclxuICogaW50ZXJwb2xhdGVkIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgbWV0YS1kYXRhIHdpbGwgYmUgc2F2ZWQ7XG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0aGF0IGlzIGEgdGFyZ2V0IG9mIHRoZSBiaW5kaW5nO1xuICogQHBhcmFtIHByb3BlcnR5TmFtZSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogQHBhcmFtIGJpbmRpbmdJbmRleCBiaW5kaW5nIGluZGV4IGluIGBMVmlld2BcbiAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uUGFydHMgc3RhdGljIGludGVycG9sYXRpb24gcGFydHMgKGZvciBwcm9wZXJ0eSBpbnRlcnBvbGF0aW9ucylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICAuLi5pbnRlcnBvbGF0aW9uUGFydHM6IHN0cmluZ1tdKSB7XG4gIC8vIEJpbmRpbmcgbWV0YS1kYXRhIGFyZSBzdG9yZWQgb25seSB0aGUgZmlyc3QgdGltZSBhIGdpdmVuIHByb3BlcnR5IGluc3RydWN0aW9uIGlzIHByb2Nlc3NlZC5cbiAgLy8gU2luY2Ugd2UgZG9uJ3QgaGF2ZSBhIGNvbmNlcHQgb2YgdGhlIFwiZmlyc3QgdXBkYXRlIHBhc3NcIiB3ZSBuZWVkIHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiB0aGVcbiAgLy8gYmluZGluZyBtZXRhLWRhdGEgdG8gZGVjaWRlIGlmIG9uZSBzaG91bGQgYmUgc3RvcmVkIChvciBpZiB3YXMgc3RvcmVkIGFscmVhZHkpLlxuICBpZiAodERhdGFbYmluZGluZ0luZGV4XSA9PT0gbnVsbCkge1xuICAgIGlmICh0Tm9kZS5pbnB1dHMgPT0gbnVsbCB8fCAhdE5vZGUuaW5wdXRzW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgIGNvbnN0IHByb3BCaW5kaW5nSWR4cyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3MgfHwgKHROb2RlLnByb3BlcnR5QmluZGluZ3MgPSBbXSk7XG4gICAgICBwcm9wQmluZGluZ0lkeHMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgbGV0IGJpbmRpbmdNZXRhZGF0YSA9IHByb3BlcnR5TmFtZTtcbiAgICAgIGlmIChpbnRlcnBvbGF0aW9uUGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBiaW5kaW5nTWV0YWRhdGEgKz1cbiAgICAgICAgICAgIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgaW50ZXJwb2xhdGlvblBhcnRzLmpvaW4oSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgfVxuICAgICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGJpbmRpbmdNZXRhZGF0YTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldExDbGVhbnVwKHZpZXc6IExWaWV3KTogYW55W10ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3W0NMRUFOVVBdIHx8ICh2aWV3W0NMRUFOVVBdID0gbmdEZXZNb2RlID8gbmV3IExDbGVhbnVwKCkgOiBbXSk7XG59XG5cbmZ1bmN0aW9uIGdldFRWaWV3Q2xlYW51cCh0VmlldzogVFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwKCkgOiBbXSk7XG59XG5cbi8qKlxuICogVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgbmVlZHMgdG8gYmUgaW5jbHVkZWRcbiAqIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXIgKHNlZSB0aGUgY29tcG9uZW50U3ludGhldGljSG9zdCogaW5zdHJ1Y3Rpb25zKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb21wb25lbnRSZW5kZXJlcih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJlbmRlcmVyMyB7XG4gIGNvbnN0IGNvbXBvbmVudExWaWV3ID0gdW53cmFwTFZpZXcobFZpZXdbdE5vZGUuaW5kZXhdKSE7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dHMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqICAgICAgICBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBwdWJsaWNOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0ZXh0IGJpbmRpbmcgYXQgYSBnaXZlbiBpbmRleCBpbiBhIGdpdmVuIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICd2YWx1ZSBzaG91bGQgbm90IGJlIE5PX0NIQU5HRScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgYW55IGFzIFJUZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShlbGVtZW50LCB2YWx1ZSkgOiBlbGVtZW50LnRleHRDb250ZW50ID0gdmFsdWU7XG59XG4iXX0=