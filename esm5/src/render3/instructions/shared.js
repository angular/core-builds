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
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getPreviousOrParentTNode, getSelectedIndex, leaveView, setBindingIndex, setBindingRootForHostBindings, setCheckNoChangesMode, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { isAnimationProp, mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, isCreationMode, readPatchedLView, resetPreOrderHookFlags, unwrapLView, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeDebug, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor, attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData } from './lview_debug';
var ɵ0 = function () { return Promise.resolve(null); };
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
var _CLEAN_PROMISE = (ɵ0)();
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
    ngDevMode && assertEqual(tView.type == 2 /* Embedded */ ? parentLView !== null : true, true, 'Embedded views must have parentLView');
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
    ngDevMode && assertGreaterThan(numSlotsToAlloc, 0, 'The number of slots to alloc should be greater than 0');
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
export function elementPropertyInternal(tView, lView, index, propName, value, sanitizer, nativeOnly, loadRendererFn) {
    ngDevMode && assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
    var element = getNativeByIndex(index, lView);
    var tNode = getTNode(tView, index);
    var inputData = tNode.inputs;
    var dataValue;
    if (!nativeOnly && inputData != null && (dataValue = inputData[propName])) {
        setInputsForProperty(tView, lView, dataValue, propName, value);
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
            if (!validateProperty(tView, lView, element, propName, tNode)) {
                // Return here since we only log warnings for unknown properties.
                warnAboutUnknownProperty(propName, tNode);
                return;
            }
            ngDevMode.rendererSetProperty++;
        }
        var renderer = loadRendererFn ? loadRendererFn(tNode, lView) : lView[RENDERER];
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
                    (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = [])).push(tNode.index - HEADER_OFFSET);
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
    ngDevMode && assertEqual(tView.firstCreatePass, true, 'Expando block should only be generated on first create pass.');
    // Important: In JS `-x` and `0-x` is not the same! If `x===0` then `-x` will produce `-0` which
    // requires non standard math arithmetic and it can prevent VM optimizations.
    // `0-0` will always produce `0` and will not cause a potential deoptimization in VM.
    var elementIndex = HEADER_OFFSET - tNode.index;
    var providerStartIndex = tNode.providerIndexes & 65535 /* ProvidersStartIndexMask */;
    var providerCount = tView.data.length - providerStartIndex;
    (tView.expandoInstructions || (tView.expandoInstructions = [])).push(elementIndex, providerCount, directiveCount);
}
/**
* Matches the current node against all available selectors.
* If a component is matched (at most one), it is returned in first position in the array.
*/
function findDirectiveDefMatches(tView, viewData, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertNodeOfPossibleTypes(tNode, 3 /* Element */, 4 /* ElementContainer */, 0 /* Container */);
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
    (tView.components || (tView.components = ngDevMode ? new TViewComponents() : [])).push(hostTNode.index);
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
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
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
export function elementAttributeInternal(index, name, value, tView, lView, sanitizer, namespace) {
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
        var tNode = getTNode(tView, index);
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
 * @param nodeIndex index of a `TNode` that is a target of the binding;
 * @param propertyName bound property name;
 * @param bindingIndex binding index in `LView`
 * @param interpolationParts static interpolation parts (for property interpolations)
 */
export function storePropertyBindingMetadata(tData, nodeIndex, propertyName, bindingIndex) {
    var interpolationParts = [];
    for (var _i = 4; _i < arguments.length; _i++) {
        interpolationParts[_i - 4] = arguments[_i];
    }
    // Binding meta-data are stored only the first time a given property instruction is processed.
    // Since we don't have a concept of the "first update pass" we need to check for presence of the
    // binding meta-data to decide if one should be stored (or if was stored already).
    if (tData[bindingIndex] === null) {
        var tNode = tData[nodeIndex + HEADER_OFFSET];
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
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0osT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFP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QUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERhdGFJblJhbmdlLCBhc3NlcnREZWZpbmVkLCBhc3NlcnREb21Ob2RlLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydE5vdEVxdWFsLCBhc3NlcnROb3RTYW1lLCBhc3NlcnRTYW1lfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2NyZWF0ZU5hbWVkQXJyYXlUeXBlfSBmcm9tICcuLi8uLi91dGlsL25hbWVkX2FycmF5X3R5cGUnO1xuaW1wb3J0IHtpbml0TmdEZXZNb2RlfSBmcm9tICcuLi8uLi91dGlsL25nX2Rldl9tb2RlJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uJztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBBY3RpdmVJbmRleEZsYWcsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHMsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZSwgVFZpZXdOb2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dCwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzLCBpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3QsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNMQ29udGFpbmVyLCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJTkpFQ1RPUiwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGUsIFRfSE9TVH0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7ZW50ZXJWaWV3LCBnZXRCaW5kaW5nc0VuYWJsZWQsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSwgZ2V0SXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0U2VsZWN0ZWRJbmRleCwgZ2V0VFZpZXcsIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wLCBtZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCByZWFkUGF0Y2hlZExWaWV3LCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB1bndyYXBMVmlldywgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHtMQ2xlYW51cCwgTFZpZXdCbHVlcHJpbnQsIE1hdGNoZXNBcnJheSwgVENsZWFudXAsIFROb2RlRGVidWcsIFROb2RlSW5pdGlhbElucHV0cywgVE5vZGVMb2NhbE5hbWVzLCBUVmlld0NvbXBvbmVudHMsIFRWaWV3Q29uc3RydWN0b3IsIGF0dGFjaExDb250YWluZXJEZWJ1ZywgYXR0YWNoTFZpZXdEZWJ1ZywgY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50LCBjbG9uZVRvVFZpZXdEYXRhfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gKCgpID0+IFByb21pc2UucmVzb2x2ZShudWxsKSkoKTtcblxuLyoqXG4gKiBQcm9jZXNzIHRoZSBgVFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc2AuIChFeGVjdXRlIHRoZSBgaG9zdEJpbmRpbmdzYC4pXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgY29udGFpbmluZyB0aGUgYGV4cGFuZG9JbnN0cnVjdGlvbnNgXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIGBUVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9ucyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBgVFZpZXdgIScpO1xuICB0cnkge1xuICAgIGNvbnN0IGV4cGFuZG9JbnN0cnVjdGlvbnMgPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zO1xuICAgIGlmIChleHBhbmRvSW5zdHJ1Y3Rpb25zICE9PSBudWxsKSB7XG4gICAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIEl0IGlzIHBvc3NpYmxlIHRvIGdldCBoZXJlIHdpdGggYFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNgIGNvbnRhaW5pbmcgbm9cbiAgICAgIC8vIGZ1bmN0aW9ucyB0byBleGVjdXRlLiBUaGlzIGlzIHdhc3RlZnVsIGFzIHRoZXJlIGlzIG5vIHdvcmsgdG8gYmUgZG9uZSwgYnV0IHdlIHN0aWxsIG5lZWRcbiAgICAgIC8vIHRvIGl0ZXJhdGUgb3ZlciB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgICAgLy8gSW4gZXhhbXBsZSBvZiB0aGlzIGlzIGluIHRoaXMgdGVzdDogYGhvc3RfYmluZGluZ19zcGVjLnRzYFxuICAgICAgLy8gYGZpdCgnc2hvdWxkIG5vdCBjYXVzZSBwcm9ibGVtcyBpZiBkZXRlY3RDaGFuZ2VzIGlzIGNhbGxlZCB3aGVuIGEgcHJvcGVydHkgdXBkYXRlcycsIC4uLmBcbiAgICAgIC8vIEluIHRoZSBhYm92ZSB0ZXN0IHdlIGdldCBoZXJlIHdpdGggZXhwYW5kbyBbMCwgMCwgMV0gd2hpY2ggcmVxdWlyZXMgYSBsb3Qgb2YgcHJvY2Vzc2luZyBidXRcbiAgICAgIC8vIHRoZXJlIGlzIG5vIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBleHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgICAvLyBJbXBvcnRhbnQ6IEluIEpTIGAteGAgYW5kIGAwLXhgIGlzIG5vdCB0aGUgc2FtZSEgSWYgYHg9PT0wYCB0aGVuIGAteGAgd2lsbCBwcm9kdWNlXG4gICAgICAgICAgICAvLyBgLTBgIHdoaWNoIHJlcXVpcmVzIG5vbiBzdGFuZGFyZCBtYXRoIGFyaXRobWV0aWMgYW5kIGl0IGNhbiBwcmV2ZW50IFZNIG9wdGltaXphdGlvbnMuXG4gICAgICAgICAgICAvLyBgMC0wYCB3aWxsIGFsd2F5cyBwcm9kdWNlIGAwYCBhbmQgd2lsbCBub3QgY2F1c2UgYSBwb3RlbnRpYWwgZGVvcHRpbWl6YXRpb24gaW4gVk0uXG4gICAgICAgICAgICAvLyBUT0RPKG1pc2tvKTogUEVSRiBUaGlzIHNob3VsZCBiZSByZWZhY3RvcmVkIHRvIHVzZSBgfmluc3RydWN0aW9uYCBhcyB0aGF0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdWZmZXIgZnJvbSBgLTBgIGFuZCBpdCBpcyBmYXN0ZXIvbW9yZSBjb21wYWN0LlxuICAgICAgICAgICAgY3VycmVudEVsZW1lbnRJbmRleCA9IDAgLSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkSW5kZXgoY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAoZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKGJpbmRpbmdSb290SW5kZXgsIGN1cnJlbnREaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBob3N0Q3R4ID0gbFZpZXdbY3VycmVudERpcmVjdGl2ZUluZGV4XTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIFJlbHlpbmcgb24gaW5jcmVtZW50aW5nIHRoZSBgY3VycmVudERpcmVjdGl2ZUluZGV4YCBoZXJlIGlzXG4gICAgICAgICAgLy8gc3ViLW9wdGltYWwuIFRoZSBpbXBsaWNhdGlvbnMgYXJlIHRoYXQgaWYgd2UgaGF2ZSBhIGxvdCBvZiBkaXJlY3RpdmVzIGJ1dCBub25lIG9mIHRoZW1cbiAgICAgICAgICAvLyBoYXZlIGhvc3QgYmluZGluZ3Mgd2UgbmV2ZXJ0aGVsZXNzIG5lZWQgdG8gaXRlcmF0ZSBvdmVyIHRoZSBleHBhbmRvIGluc3RydWN0aW9ucyB0b1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY291bnRlci4gSXQgd291bGQgYmUgbXVjaCBiZXR0ZXIgaWYgd2UgY291bGQgZW5jb2RlIHRoZVxuICAgICAgICAgIC8vIGBjdXJyZW50RGlyZWN0aXZlSW5kZXhgIGludG8gdGhlIGBleHBhbmRvSW5zdHJ1Y3Rpb25gIGFycmF5IHNvIHRoYXQgd2Ugb25seSBuZWVkIHRvXG4gICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRob3NlIGRpcmVjdGl2ZXMgd2hpY2ggYWN0dWFsbHkgaGF2ZSBgaG9zdEJpbmRpbmdzYC5cbiAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGFsbCBjb250ZW50IHF1ZXJpZXMgZGVjbGFyZWQgYnkgZGlyZWN0aXZlcyBpbiBhIGdpdmVuIHZpZXcgKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzO1xuICBpZiAoY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBxdWVyeVN0YXJ0SWR4ID0gY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSBjb250ZW50UXVlcmllc1tpICsgMV07XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMsICdjb250ZW50UXVlcmllcyBmdW5jdGlvbiBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgICBzZXRDdXJyZW50UXVlcnlJbmRleChxdWVyeVN0YXJ0SWR4KTtcbiAgICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzICEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuLyoqIFJlbmRlcnMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3IChjcmVhdGlvbiBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlbmRlckNoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZW5kZXJDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSByZW5kZXJlciBBIHJlbmRlcmVyIHRvIHVzZVxuICogQHJldHVybnMgdGhlIGVsZW1lbnQgY3JlYXRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudENyZWF0ZShcbiAgICBuYW1lOiBzdHJpbmcsIHJlbmRlcmVyOiBSZW5kZXJlcjMsIG5hbWVzcGFjZTogc3RyaW5nIHwgbnVsbCk6IFJFbGVtZW50IHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZSA9PT0gbnVsbCA/IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3IHwgbnVsbCwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgaG9zdDogUkVsZW1lbnQgfCBudWxsLCB0SG9zdE5vZGU6IFRWaWV3Tm9kZSB8IFRFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MyB8IG51bGwsIHJlbmRlcmVyPzogUmVuZGVyZXIzIHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsLCBpbmplY3Rvcj86IEluamVjdG9yIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3QgbFZpZXcgPVxuICAgICAgbmdEZXZNb2RlID8gY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50KHRWaWV3KSA6IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3O1xuICBsVmlld1tIT1NUXSA9IGhvc3Q7XG4gIGxWaWV3W0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcztcbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gIGxWaWV3W1BBUkVOVF0gPSBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IHBhcmVudExWaWV3O1xuICBsVmlld1tDT05URVhUXSA9IGNvbnRleHQ7XG4gIGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldID0gKHJlbmRlcmVyRmFjdG9yeSB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl9GQUNUT1JZXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwgITtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICBsVmlld1tUX0hPU1RdID0gdEhvc3ROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhPT0gbnVsbCA6IHRydWUsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ0VtYmVkZGVkIHZpZXdzIG11c3QgaGF2ZSBwYXJlbnRMVmlldycpO1xuICBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gPVxuICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA6IGxWaWV3O1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0SG9zdE5vZGUgVGhpcyBpcyBhIGhhY2sgYW5kIHdlIHNob3VsZCBub3QgaGF2ZSB0byBwYXNzIHRoaXMgdmFsdWUgaW4uIEl0IGlzIG9ubHkgdXNlZCB0b1xuICogZGV0ZXJtaW5lIGlmIHRoZSBwYXJlbnQgYmVsb25ncyB0byBhIGRpZmZlcmVudCB0Vmlldy4gSW5zdGVhZCB3ZSBzaG91bGQgbm90IGhhdmUgcGFyZW50VFZpZXdcbiAqIHBvaW50IHRvIFRWaWV3IG90aGVyIHRoZSBjdXJyZW50IG9uZS5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlxuICAgIFRJY3VDb250YWluZXJOb2RlIHtcbiAgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uIHNob3J0LCBzbyB0aGF0IHRoZSBWTSB3aWxsIGlubGluZSBpdC5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlIHx8XG4gICAgICBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIHRIb3N0Tm9kZSwgYWRqdXN0ZWRJbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUsIHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVFZpZXdOb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJlxuICAgICAgVFByb2plY3Rpb25Ob2RlICYgVEljdUNvbnRhaW5lck5vZGU7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBuYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKSB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBjb25zdCBpc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9XG4gICAgICBpc1BhcmVudCA/IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA6IHByZXZpb3VzT3JQYXJlbnRUTm9kZSAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUucGFyZW50O1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgLy8gc28gaXQncyBvbmx5IHNldCBpZiB0aGUgdmlldyBpcyB0aGUgc2FtZS5cbiAgY29uc3QgcGFyZW50SW5TYW1lVmlldyA9IHBhcmVudCAmJiBwYXJlbnQgIT09IHRIb3N0Tm9kZTtcbiAgY29uc3QgdFBhcmVudE5vZGUgPSBwYXJlbnRJblNhbWVWaWV3ID8gcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIDogbnVsbDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCB0UGFyZW50Tm9kZSwgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBBc3NpZ24gYSBwb2ludGVyIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIG9mIGEgZ2l2ZW4gdmlldy4gVGhlIGZpcnN0IG5vZGUgaXMgbm90IGFsd2F5cyB0aGUgb25lXG4gIC8vIGF0IGluZGV4IDAsIGluIGNhc2Ugb2YgaTE4biwgaW5kZXggMCBjYW4gYmUgdGhlIGluc3RydWN0aW9uIGBpMThuU3RhcnRgIGFuZCB0aGUgZmlyc3Qgbm9kZSBoYXNcbiAgLy8gdGhlIGluZGV4IDEgb3IgbW9yZSwgc28gd2UgY2FuJ3QganVzdCBjaGVjayBub2RlIGluZGV4LlxuICBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmXG4gICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ25UVmlld05vZGVUb0xWaWV3KFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KTogVFZpZXdOb2RlIHtcbiAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICBsZXQgdE5vZGUgPSB0Vmlldy5ub2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiB0UGFyZW50Tm9kZSAmJlxuICAgICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHRQYXJlbnROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgdFZpZXcubm9kZSA9IHROb2RlID0gY3JlYXRlVE5vZGUoXG4gICAgICAgIHRWaWV3LFxuICAgICAgICB0UGFyZW50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsICAvL1xuICAgICAgICBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tUX0hPU1RdID0gdE5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYExWaWV3YFxuICogQHBhcmFtIHZpZXcgVGhlIGBMVmlld2AgY29udGFpbmluZyB0aGUgYmx1ZXByaW50IHRvIGFkanVzdFxuICogQHBhcmFtIG51bVNsb3RzVG9BbGxvYyBUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIGluIHRoZSBMVmlldywgc2hvdWxkIGJlID4wXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIG51bVNsb3RzVG9BbGxvYzogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihcbiAgICAgICAgICAgICAgICAgICBudW1TbG90c1RvQWxsb2MsIDAsICdUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIHNob3VsZCBiZSBncmVhdGVyIHRoYW4gMCcpO1xuICBpZiAobnVtU2xvdHNUb0FsbG9jID4gMCkge1xuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHNUb0FsbG9jOyBpKyspIHtcbiAgICAgICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgICAgICAgbFZpZXcucHVzaChudWxsKTtcbiAgICAgIH1cblxuICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgaW5jcmVtZW50IHRoZSBleHBhbmRvIHN0YXJ0IGluZGV4IGlmIHRoZXJlIGFyZW4ndCBhbHJlYWR5IGRpcmVjdGl2ZXNcbiAgICAgIC8vIGFuZCBpbmplY3RvcnMgc2F2ZWQgaW4gdGhlIFwiZXhwYW5kb1wiIHNlY3Rpb25cbiAgICAgIGlmICghdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucykge1xuICAgICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCArPSBudW1TbG90c1RvQWxsb2M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBTaW5jZSB3ZSdyZSBhZGRpbmcgdGhlIGR5bmFtaWMgbm9kZXMgaW50byB0aGUgZXhwYW5kbyBzZWN0aW9uLCB3ZSBuZWVkIHRvIGxldCB0aGUgaG9zdFxuICAgICAgICAvLyBiaW5kaW5ncyBrbm93IHRoYXQgdGhleSBzaG91bGQgc2tpcCB4IHNsb3RzXG4gICAgICAgIHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMucHVzaChudW1TbG90c1RvQWxsb2MpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHRoZSBjcmVhdGlvbiBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGNyZWF0aW5nIHZpZXcgcXVlcnkgZnVuY3Rpb25zIChpZiBhbnkpO1xuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB0aGUgY3JlYXRpb24gbW9kZTtcbiAqIC0gdXBkYXRpbmcgc3RhdGljIHF1ZXJpZXMgKGlmIGFueSk7XG4gKiAtIGNyZWF0aW5nIGNoaWxkIGNvbXBvbmVudHMgZGVmaW5lZCBpbiBhIGdpdmVuIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJWaWV3PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgZW50ZXJWaWV3KGxWaWV3LCBsVmlld1tUX0hPU1RdKTtcbiAgdHJ5IHtcbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLkNyZWF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdmlldywgaWYgaXQgZXhpc3RzLiBBIHRlbXBsYXRlIGZ1bmN0aW9uIG1pZ2h0IG5vdCBiZVxuICAgIC8vIGRlZmluZWQgZm9yIHRoZSByb290IGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCB0ZW1wbGF0ZUZuID0gdFZpZXcudGVtcGxhdGU7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLkNyZWF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50cy5cbiAgICAvLyBUaGlzIG11c3QgYmUgc2V0IHRvIGZhbHNlIGltbWVkaWF0ZWx5IGFmdGVyIHRoZSBmaXJzdCBjcmVhdGlvbiBydW4gYmVjYXVzZSBpbiBhblxuICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgIC8vIG9mZiBmaXJzdENyZWF0ZVBhc3MuIElmIHdlIGRvbid0IHNldCBpdCBoZXJlLCBpbnN0YW5jZXMgd2lsbCBwZXJmb3JtIGRpcmVjdGl2ZVxuICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFdlIHJlc29sdmUgY29udGVudCBxdWVyaWVzIHNwZWNpZmljYWxseSBtYXJrZWQgYXMgYHN0YXRpY2AgaW4gY3JlYXRpb24gbW9kZS4gRHluYW1pY1xuICAgIC8vIGNvbnRlbnQgcXVlcmllcyBhcmUgcmVzb2x2ZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gKGkuZS4gdXBkYXRlIG1vZGUpLCBhZnRlciBlbWJlZGRlZFxuICAgIC8vIHZpZXdzIGFyZSByZWZyZXNoZWQgKHNlZSBibG9jayBhYm92ZSkuXG4gICAgaWYgKHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBXZSBtdXN0IG1hdGVyaWFsaXplIHF1ZXJ5IHJlc3VsdHMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudHMgYXJlIHByb2Nlc3NlZFxuICAgIC8vIGluIGNhc2UgYSBjaGlsZCBjb21wb25lbnQgaGFzIHByb2plY3RlZCBhIGNvbnRhaW5lci4gVGhlIExDb250YWluZXIgbmVlZHNcbiAgICAvLyB0byBleGlzdCBzbyB0aGUgZW1iZWRkZWQgdmlld3MgYXJlIHByb3Blcmx5IGF0dGFjaGVkIGJ5IHRoZSBjb250YWluZXIuXG4gICAgaWYgKHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB0Vmlldy52aWV3UXVlcnkgISwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgfSBmaW5hbGx5IHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fCBudWxsLCBjb250ZXh0OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgaWYgKChmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSA9PT0gTFZpZXdGbGFncy5EZXN0cm95ZWQpIHJldHVybjtcbiAgZW50ZXJWaWV3KGxWaWV3LCBsVmlld1tUX0hPU1RdKTtcbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hlY2spXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjb250ZW50Q2hlY2tIb29rcyA9IHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzO1xuICAgICAgICBpZiAoY29udGVudENoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgY29udGVudENoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb250ZW50SG9va3MgPSB0Vmlldy5jb250ZW50SG9va3M7XG4gICAgICAgIGlmIChjb250ZW50SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb250ZW50SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRIb3N0QmluZGluZ3NCeUV4ZWN1dGluZ0V4cGFuZG9JbnN0cnVjdGlvbnModFZpZXcsIGxWaWV3KTtcblxuICAgIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBWaWV3IHF1ZXJpZXMgbXVzdCBleGVjdXRlIGFmdGVyIHJlZnJlc2hpbmcgY2hpbGQgY29tcG9uZW50cyBiZWNhdXNlIGEgdGVtcGxhdGUgaW4gdGhpcyB2aWV3XG4gICAgLy8gY291bGQgYmUgaW5zZXJ0ZWQgaW4gYSBjaGlsZCBjb21wb25lbnQuIElmIHRoZSB2aWV3IHF1ZXJ5IGV4ZWN1dGVzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRcbiAgICAvLyByZWZyZXNoLCB0aGUgdGVtcGxhdGUgbWlnaHQgbm90IHlldCBiZSBpbnNlcnRlZC5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIHZpZXcgaG9va3MgKEFmdGVyVmlld0luaXQsIEFmdGVyVmlld0NoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fCBudWxsLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuICBjb25zdCBjcmVhdGlvbk1vZGVJc0FjdGl2ZSA9IGlzQ3JlYXRpb25Nb2RlKGxWaWV3KTtcbiAgdHJ5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuYmVnaW4oKTtcbiAgICB9XG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICByZW5kZXJWaWV3KHRWaWV3LCBsVmlldywgY29udGV4dCk7XG4gICAgfVxuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5lbmQpIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSAmJiBsVmlldy5sZW5ndGggPiBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBpbmhlcmVudGx5IHNlbGVjdCAwIHNvIHdlIGRvbid0XG4gICAgICAvLyBoYXZlIHRvIGdlbmVyYXRlIHRoYXQgaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrcy5cbiAgICAgIHNlbGVjdEluZGV4SW50ZXJuYWwodFZpZXcsIGxWaWV3LCAwLCBnZXRDaGVja05vQ2hhbmdlc01vZGUoKSk7XG4gICAgfVxuICAgIHRlbXBsYXRlRm4ocmYsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgocHJldlNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSk7XG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgPT09IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSB7XG4gICAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgcmV0dXJuIGRlZi50VmlldyB8fFxuICAgICAgKGRlZi50VmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICBUVmlld1R5cGUuQ29tcG9uZW50LCAtMSwgZGVmLnRlbXBsYXRlLCBkZWYuZGVjbHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICAgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5LCBkZWYuc2NoZW1hcywgZGVmLmNvbnN0cykpO1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcmllcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gc2NoZW1hcyBTY2hlbWFzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBjb25zdHMgQ29uc3RhbnRzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHR5cGU6IFRWaWV3VHlwZSwgdmlld0luZGV4OiBudW1iZXIsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58IG51bGwsIGRlY2xzOiBudW1iZXIsXG4gICAgdmFyczogbnVtYmVyLCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnwgbnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXSB8IG51bGwsXG4gICAgY29uc3RzOiBUQ29uc3RhbnRzIHwgbnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBkZWNscztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSBuZ0Rldk1vZGUgP1xuICAgICAgbmV3IFRWaWV3Q29uc3RydWN0b3IoXG4gICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICB2aWV3SW5kZXgsICAgLy8gaWQ6IG51bWJlcixcbiAgICAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAvLyBxdWVyaWVzOiBUUXVlcmllc3xudWxsXG4gICAgICAgICAgICAgdmlld1F1ZXJ5LCAgIC8vIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsICEsICAgICAgLy8gbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLFxuICAgICAgICAgICAgIGNsb25lVG9UVmlld0RhdGEoYmx1ZXByaW50KS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSwgIC8vIGRhdGE6IFREYXRhLFxuICAgICAgICAgICAgIGJpbmRpbmdTdGFydEluZGV4LCAgLy8gYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBpbml0aWFsVmlld0xlbmd0aCwgIC8vIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgIC8vIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjbGVhbnVwOiBhbnlbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgICAgICAgZGlyZWN0aXZlcygpIDpcbiAgICAgICAgICAgICAgICAgZGlyZWN0aXZlcywgIC8vIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgICAgdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLCAgLy8gcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsXG4gICAgICAgICAgICAgc2NoZW1hcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgICAgICAgICAgIGNvbnN0cykgOiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0czogVENvbnN0YW50c3xudWxsXG4gICAgICB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGlkOiB2aWV3SW5kZXgsXG4gICAgICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICAgICAgcXVlcmllczogbnVsbCxcbiAgICAgICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgICAgIG5vZGU6IG51bGwgISxcbiAgICAgICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgICAgIGJpbmRpbmdTdGFydEluZGV4OiBiaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgICAgICBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBudWxsLFxuICAgICAgICBmaXJzdENyZWF0ZVBhc3M6IHRydWUsXG4gICAgICAgIGZpcnN0VXBkYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgc3RhdGljVmlld1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgICAgIHByZU9yZGVySG9va3M6IG51bGwsXG4gICAgICAgIHByZU9yZGVyQ2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgdmlld0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgICAgICBjbGVhbnVwOiBudWxsLFxuICAgICAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICAgICAgY29tcG9uZW50czogbnVsbCxcbiAgICAgICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICAgICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgICAgIHNjaGVtYXM6IHNjaGVtYXMsXG4gICAgICAgIGNvbnN0czogY29uc3RzLFxuICAgICAgfTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZ0Rldk1vZGUgPyBuZXcgTFZpZXdCbHVlcHJpbnQoKSA6IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbFZpZXdMZW5ndGg7IGkrKykge1xuICAgIGJsdWVwcmludC5wdXNoKGkgPCBiaW5kaW5nU3RhcnRJbmRleCA/IG51bGwgOiBOT19DSEFOR0UpO1xuICB9XG5cbiAgcmV0dXJuIGJsdWVwcmludCBhcyBMVmlldztcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeUZvckVycm9yKHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhvc3ROb2RlRXhpc3RzKHJFbGVtZW50OiBSRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKSB7XG4gIGlmICghckVsZW1lbnQpIHtcbiAgICBpZiAodHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJykge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSB3aXRoIHNlbGVjdG9yIG5vdCBmb3VuZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgaXMgcmVxdWlyZWQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyRmFjdG9yeSBGYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSByZW5kZXJlciBpbnN0YW5jZS5cbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGVuY2Fwc3VsYXRpb24gVmlldyBFbmNhcHN1bGF0aW9uIGRlZmluZWQgZm9yIGNvbXBvbmVudCB0aGF0IHJlcXVlc3RzIGhvc3QgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudCB8IHN0cmluZyxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbik6IFJFbGVtZW50IHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIC8vIFdoZW4gdXNpbmcgbmF0aXZlIFNoYWRvdyBET00sIGRvIG5vdCBjbGVhciBob3N0IGVsZW1lbnQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvblxuICAgIGNvbnN0IHByZXNlcnZlQ29udGVudCA9IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgICByZXR1cm4gcmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IsIHByZXNlcnZlQ29udGVudCk7XG4gIH1cblxuICBsZXQgckVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIHJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpICEgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRIb3N0Tm9kZUV4aXN0cyhyRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3IpO1xuXG4gIC8vIEFsd2F5cyBjbGVhciBob3N0IGVsZW1lbnQncyBjb250ZW50IHdoZW4gUmVuZGVyZXIzIGlzIGluIHVzZS4gRm9yIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSB3ZVxuICAvLyBtYWtlIGl0IGRlcGVuZCBvbiB3aGV0aGVyIFNoYWRvd0RvbSBlbmNhcHN1bGF0aW9uIGlzIHVzZWQgKGluIHdoaWNoIGNhc2UgdGhlIGNvbnRlbnQgc2hvdWxkIGJlXG4gIC8vIHByZXNlcnZlZCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uKS4gU2hhZG93RG9tIGVuY2Fwc3VsYXRpb24gcmVxdWlyZXMgcHJvY2VkdXJhbFxuICAvLyByZW5kZXJlciwgYW5kIHByb2NlZHVyYWwgcmVuZGVyZXIgY2FzZSBpcyBoYW5kbGVkIGFib3ZlLlxuICByRWxlbWVudC50ZXh0Q29udGVudCA9ICcnO1xuXG4gIHJldHVybiByRWxlbWVudDtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRMQ2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh0VmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldExDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh0VmlldykucHVzaChsVmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSxcbiAgICBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIHJldHVybiBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVEZWJ1ZyhcbiAgICAgICAgICAgICAgICAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICAgICAgICAgICAgICAgICBhZGp1c3RlZEluZGV4LCAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVTdHlsaW5nTGFzdDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gZmxhZ3M6IFROb2RlRmxhZ3NcbiAgICAgICAgICAgICAgICAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlc1xuICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ05hbWUsICAgICAgICAvLyB0YWdOYW1lOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIGF0dHJzLCAgLy8gYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAvLyBtZXJnZWRBdHRyc1xuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIG5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gY2hpbGQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdFBhcmVudCwgICAgLy8gcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIHN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQsICAvLyByZXNpZHVhbFN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjbGFzc2VzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIHJlc2lkdWFsQ2xhc3Nlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICAwIGFzIGFueSwgICAvLyBjbGFzc0JpbmRpbmdzOiBUU3R5bGluZ1JhbmdlO1xuICAgICAgICAgICAgICAgICAgICAgICAgIDAgYXMgYW55LCAgIC8vIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgKSA6XG4gICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvckluZGV4OiBpbmplY3RvckluZGV4LFxuICAgICAgICAgICAgICAgICAgICAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlCaW5kaW5nczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgZmxhZ3M6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGVySW5kZXhlczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgYXR0cnM6IGF0dHJzLFxuICAgICAgICAgICAgICAgICAgICAgICBtZXJnZWRBdHRyczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBpbnB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHRWaWV3czogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGlvbk5leHQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIGNoaWxkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgICAgICAgICAgICAgICAgICAgIHByb2plY3Rpb246IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHN0eWxlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcmVzaWR1YWxTdHlsZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NlczogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgcmVzaWR1YWxDbGFzc2VzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIGNsYXNzQmluZGluZ3M6IDAgYXMgYW55LFxuICAgICAgICAgICAgICAgICAgICAgICBzdHlsZUJpbmRpbmdzOiAwIGFzIGFueSxcbiAgICAgICAgICAgICAgICAgICAgIH07XG59XG5cblxuZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoXG4gICAgaW5wdXRBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCBkaXJlY3RpdmVEZWZJZHg6IG51bWJlcixcbiAgICBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlcyB8IG51bGwpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGZvciAobGV0IHB1YmxpY05hbWUgaW4gaW5wdXRBbGlhc01hcCkge1xuICAgIGlmIChpbnB1dEFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgPT09IG51bGwgPyB7fSA6IHByb3BTdG9yZTtcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGlucHV0QWxpYXNNYXBbcHVibGljTmFtZV07XG5cbiAgICAgIGlmIChwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlRGVmSWR4LCBpbnRlcm5hbE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGRhdGEgc3RydWN0dXJlcyByZXF1aXJlZCB0byB3b3JrIHdpdGggZGlyZWN0aXZlIG91dHB1dHMgYW5kIG91dHB1dHMuXG4gKiBJbml0aWFsaXphdGlvbiBpcyBkb25lIGZvciBhbGwgZGlyZWN0aXZlcyBtYXRjaGVkIG9uIGEgZ2l2ZW4gVE5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICBjb25zdCB0Tm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGNvbnN0IGlucHV0c0Zyb21BdHRyczogSW5pdGlhbElucHV0RGF0YSA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUluaXRpYWxJbnB1dHMoKSA6IFtdO1xuICBsZXQgaW5wdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgbGV0IG91dHB1dHNTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlSW5wdXRzID0gZGlyZWN0aXZlRGVmLmlucHV0cztcbiAgICBpbnB1dHNGcm9tQXR0cnMucHVzaChcbiAgICAgICAgdE5vZGVBdHRycyAhPT0gbnVsbCA/IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbnB1dHMsIHROb2RlQXR0cnMpIDogbnVsbCk7XG4gICAgaW5wdXRzU3RvcmUgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVJbnB1dHMsIGksIGlucHV0c1N0b3JlKTtcbiAgICBvdXRwdXRzU3RvcmUgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYub3V0cHV0cywgaSwgb3V0cHV0c1N0b3JlKTtcbiAgfVxuXG4gIGlmIChpbnB1dHNTdG9yZSAhPT0gbnVsbCkge1xuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSB8fCBpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3NOYW1lJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgdE5vZGUuaW5pdGlhbElucHV0cyA9IGlucHV0c0Zyb21BdHRycztcbiAgdE5vZGUuaW5wdXRzID0gaW5wdXRzU3RvcmU7XG4gIHROb2RlLm91dHB1dHMgPSBvdXRwdXRzU3RvcmU7XG59XG5cbi8qKlxuICogTWFwcGluZyBiZXR3ZWVuIGF0dHJpYnV0ZXMgbmFtZXMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIHRoZWlyIGVsZW1lbnQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogUGVyZm9ybWFuY2Ugbm90ZTogdGhpcyBmdW5jdGlvbiBpcyB3cml0dGVuIGFzIGEgc2VyaWVzIG9mIGlmIGNoZWNrcyAoaW5zdGVhZCBvZiwgc2F5LCBhIHByb3BlcnR5XG4gKiBvYmplY3QgbG9va3VwKSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAtIHRoZSBzZXJpZXMgb2YgYGlmYCBjaGVja3Mgc2VlbXMgdG8gYmUgdGhlIGZhc3Rlc3Qgd2F5IG9mXG4gKiBtYXBwaW5nIHByb3BlcnR5IG5hbWVzLiBEbyBOT1QgY2hhbmdlIHdpdGhvdXQgYmVuY2htYXJraW5nLlxuICpcbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5mdW5jdGlvbiBtYXBQcm9wTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZSA9PT0gJ2NsYXNzJykgcmV0dXJuICdjbGFzc05hbWUnO1xuICBpZiAobmFtZSA9PT0gJ2ZvcicpIHJldHVybiAnaHRtbEZvcic7XG4gIGlmIChuYW1lID09PSAnZm9ybWFjdGlvbicpIHJldHVybiAnZm9ybUFjdGlvbic7XG4gIGlmIChuYW1lID09PSAnaW5uZXJIdG1sJykgcmV0dXJuICdpbm5lckhUTUwnO1xuICBpZiAobmFtZSA9PT0gJ3JlYWRvbmx5JykgcmV0dXJuICdyZWFkT25seSc7XG4gIGlmIChuYW1lID09PSAndGFiaW5kZXgnKSByZXR1cm4gJ3RhYkluZGV4JztcbiAgcmV0dXJuIG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLCBuYXRpdmVPbmx5PzogYm9vbGVhbixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHRWaWV3LCBpbmRleCk7XG4gIGxldCBpbnB1dERhdGEgPSB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiBpbnB1dERhdGEgIT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGRhdGFWYWx1ZSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCF2YWxpZGF0ZVByb3BlcnR5KHRWaWV3LCBsVmlldywgZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlKSkge1xuICAgICAgICAvLyBSZXR1cm4gaGVyZSBzaW5jZSB3ZSBvbmx5IGxvZyB3YXJuaW5ncyBmb3IgdW5rbm93biBwcm9wZXJ0aWVzLlxuICAgICAgICB3YXJuQWJvdXRVbmtub3duUHJvcGVydHkocHJvcE5hbWUsIHROb2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICB9XG5cbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eSBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKCFpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0UHJvcGVydHkgPyAoZWxlbWVudCBhcyBhbnkpLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIElmIHRoZSBub2RlIGlzIGEgY29udGFpbmVyIGFuZCB0aGUgcHJvcGVydHkgZGlkbid0XG4gICAgLy8gbWF0Y2ggYW55IG9mIHRoZSBpbnB1dHMgb3Igc2NoZW1hcyB3ZSBzaG91bGQgdGhyb3cuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhbWF0Y2hpbmdTY2hlbWFzKHRWaWV3LCBsVmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICAgIHdhcm5BYm91dFVua25vd25Qcm9wZXJ0eShwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID0gYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudDtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnRpZXMoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAvKipcbiAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgKiBpKzE6IHByaXZhdGVOYW1lXG4gICAgICpcbiAgICAgKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMV1cbiAgICAgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFWYWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHR5cGUsIGRhdGFWYWx1ZVtpICsgMV0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsXG4gICAgdE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50XG4gIC8vIG9yIGl0IGlzIHN5bnRoZXRpYywgYW5kIHdlIGFyZSBpbiBhIGJyb3dzZXIgY29udGV4dCAod2ViIHdvcmtlciBub2RlcyBzaG91bGQgYmUgc2tpcHBlZCkuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXModFZpZXcsIGxWaWV3LCB0Tm9kZS50YWdOYW1lKSB8fCBwcm9wTmFtZSBpbiBlbGVtZW50IHx8XG4gICAgICBpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBOb3RlOiBgdHlwZW9mIE5vZGVgIHJldHVybnMgJ2Z1bmN0aW9uJyBpbiBtb3N0IGJyb3dzZXJzLCBidXQgb24gSUUgaXQgaXMgJ29iamVjdCcgc28gd2VcbiAgLy8gbmVlZCB0byBhY2NvdW50IGZvciBib3RoIGhlcmUsIHdoaWxlIGJlaW5nIGNhcmVmdWwgZm9yIGB0eXBlb2YgbnVsbGAgYWxzbyByZXR1cm5pbmcgJ29iamVjdCcuXG4gIHJldHVybiB0eXBlb2YgTm9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgTm9kZSA9PT0gbnVsbCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGFnTmFtZTogc3RyaW5nIHwgbnVsbCk6IGJvb2xlYW4ge1xuICBjb25zdCBzY2hlbWFzID0gdFZpZXcuc2NoZW1hcztcblxuICBpZiAoc2NoZW1hcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZW1hcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NoZW1hID0gc2NoZW1hc1tpXTtcbiAgICAgIGlmIChzY2hlbWEgPT09IE5PX0VSUk9SU19TQ0hFTUEgfHxcbiAgICAgICAgICBzY2hlbWEgPT09IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEgJiYgdGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBMb2dzIGEgd2FybmluZyB0aGF0IGEgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBvbiBhbiBlbGVtZW50LlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHkuXG4gKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIHdhcm5BYm91dFVua25vd25Qcm9wZXJ0eShwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgY29uc29sZS53YXJuKFxuICAgICAgYENhbid0IGJpbmQgdG8gJyR7cHJvcE5hbWV9JyBzaW5jZSBpdCBpc24ndCBhIGtub3duIHByb3BlcnR5IG9mICcke3ROb2RlLnRhZ05hbWV9Jy5gKTtcbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhIHJvb3QgY29tcG9uZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5zdGFudGlhdGVSb290Q29tcG9uZW50PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBkZWY6IENvbXBvbmVudERlZjxUPik6IFQge1xuICBjb25zdCByb290VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIGxWaWV3LCBkZWYpO1xuICB9XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgbFZpZXcubGVuZ3RoIC0gMSwgcm9vdFROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShyb290VE5vZGUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxuICByZXR1cm4gZGlyZWN0aXZlO1xufVxuXG4vKipcbiAqIFJlc29sdmUgdGhlIG1hdGNoZWQgZGlyZWN0aXZlcyBvbiBhIG5vZGUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsKTogYm9vbGVhbiB7XG4gIC8vIFBsZWFzZSBtYWtlIHN1cmUgdG8gaGF2ZSBleHBsaWNpdCB0eXBlIGZvciBgZXhwb3J0c01hcGAuIEluZmVycmVkIHR5cGUgdHJpZ2dlcnMgYnVnIGluXG4gIC8vIHRzaWNrbGUuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIGxldCBoYXNEaXJlY3RpdmVzID0gZmFsc2U7XG4gIGlmIChnZXRCaW5kaW5nc0VuYWJsZWQoKSkge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZnM6IERpcmVjdGl2ZURlZjxhbnk+W118bnVsbCA9IGZpbmREaXJlY3RpdmVEZWZNYXRjaGVzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICAgIGNvbnN0IGV4cG9ydHNNYXA6ICh7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpID0gbG9jYWxSZWZzID09PSBudWxsID8gbnVsbCA6IHsnJzogLTF9O1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZnMgIT09IG51bGwpIHtcbiAgICAgIGxldCB0b3RhbERpcmVjdGl2ZUhvc3RWYXJzID0gMDtcbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgICAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVEZWZzLmxlbmd0aCk7XG4gICAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAgIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gICAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgICAgLy8gaW1wb3J0YW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVEZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZURlZnNbaV07XG4gICAgICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgICAgfVxuICAgICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZURlZnMubGVuZ3RoKTtcbiAgICAgIGxldCBwcmVPcmRlckhvb2tzRm91bmQgPSBmYWxzZTtcbiAgICAgIGxldCBwcmVPcmRlckNoZWNrSG9va3NGb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVEZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZURlZnNbaV07XG4gICAgICAgIC8vIE1lcmdlIHRoZSBhdHRycyBpbiB0aGUgb3JkZXIgb2YgbWF0Y2hlcy4gVGhpcyBhc3N1bWVzIHRoYXQgdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyB0aGVcbiAgICAgICAgLy8gY29tcG9uZW50IGl0c2VsZiwgc28gdGhhdCB0aGUgY29tcG9uZW50IGhhcyB0aGUgbGVhc3QgcHJpb3JpdHkuXG4gICAgICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuXG4gICAgICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCBsVmlldywgZGVmKTtcblxuICAgICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKHRWaWV3LmRhdGEgIS5sZW5ndGggLSAxLCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICAgICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdEF0dHJzICE9PSBudWxsIHx8IGRlZi5ob3N0VmFycyAhPT0gMClcbiAgICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgICAgICAvLyBPbmx5IHB1c2ggYSBub2RlIGluZGV4IGludG8gdGhlIHByZU9yZGVySG9va3MgYXJyYXkgaWYgdGhpcyBpcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgICAgICBpZiAoIXByZU9yZGVySG9va3NGb3VuZCAmJiAoZGVmLm9uQ2hhbmdlcyB8fCBkZWYub25Jbml0IHx8IGRlZi5kb0NoZWNrKSkge1xuICAgICAgICAgIC8vIFdlIHdpbGwgcHVzaCB0aGUgYWN0dWFsIGhvb2sgZnVuY3Rpb24gaW50byB0aGlzIGFycmF5IGxhdGVyIGR1cmluZyBkaXIgaW5zdGFudGlhdGlvbi5cbiAgICAgICAgICAvLyBXZSBjYW5ub3QgZG8gaXQgbm93IGJlY2F1c2Ugd2UgbXVzdCBlbnN1cmUgaG9va3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIHNhbWVcbiAgICAgICAgICAvLyBvcmRlciB0aGF0IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgKGkuZS4gaW5qZWN0aW9uIG9yZGVyKS5cbiAgICAgICAgICAodFZpZXcucHJlT3JkZXJIb29rcyB8fCAodFZpZXcucHJlT3JkZXJIb29rcyA9IFtdKSkucHVzaCh0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQpO1xuICAgICAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kICYmIChkZWYub25DaGFuZ2VzIHx8IGRlZi5kb0NoZWNrKSkge1xuICAgICAgICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtcbiAgICAgICAgICAgXSkpLnB1c2godE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICAgICAgICBwcmVPcmRlckNoZWNrSG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBhZGRIb3N0QmluZGluZ3NUb0V4cGFuZG9JbnN0cnVjdGlvbnModFZpZXcsIGRlZik7XG4gICAgICAgIHRvdGFsRGlyZWN0aXZlSG9zdFZhcnMgKz0gZGVmLmhvc3RWYXJzO1xuICAgICAgfVxuXG4gICAgICBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKHRWaWV3LCB0Tm9kZSk7XG4gICAgICBncm93SG9zdFZhcnNTcGFjZSh0VmlldywgbFZpZXcsIHRvdGFsRGlyZWN0aXZlSG9zdFZhcnMpO1xuICAgIH1cbiAgICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG4gIH1cbiAgLy8gTWVyZ2UgdGhlIHRlbXBsYXRlIGF0dHJzIGxhc3Qgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGhpZ2hlc3QgcHJpb3JpdHkuXG4gIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIHROb2RlLmF0dHJzKTtcbiAgcmV0dXJuIGhhc0RpcmVjdGl2ZXM7XG59XG5cbi8qKlxuICogQWRkIGBob3N0QmluZGluZ3NgIHRvIHRoZSBgVFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhlIGBob3N0QmluZGluZ3NgIHNob3VsZCBiZSBhZGRlZC5cbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZEhvc3RCaW5kaW5nc1RvRXhwYW5kb0luc3RydWN0aW9ucyhcbiAgICB0VmlldzogVFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICAvLyBUT0RPKG1pc2tvKTogUEVSRiB3ZSBhcmUgYWRkaW5nIGBob3N0QmluZGluZ3NgIGV2ZW4gaWYgdGhlcmUgaXMgbm90aGluZyB0byBhZGQhIFRoaXMgaXNcbiAgLy8gc3Vib3B0aW1hbCBmb3IgcGVyZm9ybWFuY2UuIGBkZWYuaG9zdEJpbmRpbmdzYCBtYXkgYmUgbnVsbCxcbiAgLy8gYnV0IHdlIHN0aWxsIG5lZWQgdG8gcHVzaCBudWxsIHRvIHRoZSBhcnJheSBhcyBhIHBsYWNlaG9sZGVyXG4gIC8vIHRvIGVuc3VyZSB0aGUgZGlyZWN0aXZlIGNvdW50ZXIgaXMgaW5jcmVtZW50ZWQgKHNvIGhvc3RcbiAgLy8gYmluZGluZyBmdW5jdGlvbnMgYWx3YXlzIGxpbmUgdXAgd2l0aCB0aGUgY29ycmVjdGl2ZSBkaXJlY3RpdmUpLlxuICAvLyBUaGlzIGlzIHN1Ym9wdGltYWwgZm9yIHBlcmZvcm1hbmNlLiBTZWUgYGN1cnJlbnREaXJlY3RpdmVJbmRleGBcbiAgLy8gIGNvbW1lbnQgaW4gYHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9uc2AgZm9yIG1vcmVcbiAgLy8gZGV0YWlscy4gIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICBjb25zdCBob3N0VmFycyA9IGRlZi5ob3N0VmFycztcbiAgaWYgKGhvc3RWYXJzICE9PSAwKSB7XG4gICAgZXhwYW5kby5wdXNoKGRlZi5ob3N0VmFycyk7XG4gIH1cbn1cblxuLyoqXG4gKiBHcm93IHRoZSBgTFZpZXdgLCBibHVlcHJpbnQgYW5kIGBUVmlldy5kYXRhYCB0byBhY2NvbW1vZGF0ZSB0aGUgYGhvc3RCaW5kaW5nc2AuXG4gKlxuICogVG8gc3VwcG9ydCBsb2NhbGl0eSB3ZSBkb24ndCBrbm93IGFoZWFkIG9mIHRpbWUgaG93IG1hbnkgYGhvc3RWYXJzYCBvZiB0aGUgY29udGFpbmluZyBkaXJlY3RpdmVzXG4gKiB3ZSBuZWVkIHRvIGFsbG9jYXRlLiBGb3IgdGhpcyByZWFzb24gd2UgYWxsb3cgZ3Jvd2luZyB0aGVzZSBkYXRhIHN0cnVjdHVyZXMgYXMgd2UgZGlzY292ZXIgbW9yZVxuICogZGlyZWN0aXZlcyB0byBhY2NvbW1vZGF0ZSB0aGVtLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHdoaWNoIG5lZWRzIHRvIGJlIGdyb3duLlxuICogQHBhcmFtIGxWaWV3IGBMVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgZ3Jvd24uXG4gKiBAcGFyYW0gY291bnQgU2l6ZSBieSB3aGljaCB3ZSBuZWVkIHRvIGdyb3cgdGhlIGRhdGEgc3RydWN0dXJlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdyb3dIb3N0VmFyc1NwYWNlKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb3VudDogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBtdXN0IGJlIGFzc29jaWF0ZWQgd2l0aCBgVFZpZXdgIScpO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvdW50OyBpKyspIHtcbiAgICBsVmlldy5wdXNoKE5PX0NIQU5HRSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLCBuYXRpdmU6IFJOb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGlzQ29tcG9uZW50ID0gaXNDb21wb25lbnREZWYoZGVmKTtcblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModE5vZGUsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKGxWaWV3LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIHRWaWV3LCBpLCB0Tm9kZSk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuXG4gICAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICAgIHNldElucHV0c0Zyb21BdHRycyhsVmlldywgaSAtIHN0YXJ0LCBkaXJlY3RpdmUsIGRlZiwgdE5vZGUsIGluaXRpYWxJbnB1dHMgISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdENyZWF0ZVBhc3MgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSBsVmlld1tpXTtcbiAgICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsIHx8IGRlZi5ob3N0VmFycyAhPT0gMCB8fCBkZWYuaG9zdEF0dHJzICE9PSBudWxsKSB7XG4gICAgICAgIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZiwgZGlyZWN0aXZlKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICAgIGV4cGFuZG8ucHVzaChudWxsKTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBJbnZva2UgdGhlIGhvc3QgYmluZGluZ3MgaW4gY3JlYXRpb24gbW9kZS5cbiAqXG4gKiBAcGFyYW0gZGVmIGBEaXJlY3RpdmVEZWZgIHdoaWNoIG1heSBjb250YWluIHRoZSBgaG9zdEJpbmRpbmdzYCBmdW5jdGlvbi5cbiAqIEBwYXJhbSBkaXJlY3RpdmUgSW5zdGFuY2Ugb2YgZGlyZWN0aXZlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlSG9zdEJpbmRpbmdzSW5DcmVhdGlvbk1vZGUoZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgZGlyZWN0aXZlOiBhbnkpIHtcbiAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwpIHtcbiAgICBkZWYuaG9zdEJpbmRpbmdzICEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbiAqXG4gKiBFYWNoIGV4cGFuZG8gYmxvY2sgc3RhcnRzIHdpdGggdGhlIGVsZW1lbnQgaW5kZXggKHR1cm5lZCBuZWdhdGl2ZSBzbyB3ZSBjYW4gZGlzdGluZ3Vpc2hcbiAqIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ0V4cGFuZG8gYmxvY2sgc2hvdWxkIG9ubHkgYmUgZ2VuZXJhdGVkIG9uIGZpcnN0IGNyZWF0ZSBwYXNzLicpO1xuXG4gIC8vIEltcG9ydGFudDogSW4gSlMgYC14YCBhbmQgYDAteGAgaXMgbm90IHRoZSBzYW1lISBJZiBgeD09PTBgIHRoZW4gYC14YCB3aWxsIHByb2R1Y2UgYC0wYCB3aGljaFxuICAvLyByZXF1aXJlcyBub24gc3RhbmRhcmQgbWF0aCBhcml0aG1ldGljIGFuZCBpdCBjYW4gcHJldmVudCBWTSBvcHRpbWl6YXRpb25zLlxuICAvLyBgMC0wYCB3aWxsIGFsd2F5cyBwcm9kdWNlIGAwYCBhbmQgd2lsbCBub3QgY2F1c2UgYSBwb3RlbnRpYWwgZGVvcHRpbWl6YXRpb24gaW4gVk0uXG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IEhFQURFUl9PRkZTRVQgLSB0Tm9kZS5pbmRleDtcbiAgY29uc3QgcHJvdmlkZXJTdGFydEluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IHByb3ZpZGVyQ291bnQgPSB0Vmlldy5kYXRhLmxlbmd0aCAtIHByb3ZpZGVyU3RhcnRJbmRleDtcbiAgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgfHwgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgPSBbXG4gICBdKSkucHVzaChlbGVtZW50SW5kZXgsIHByb3ZpZGVyQ291bnQsIGRpcmVjdGl2ZUNvdW50KTtcbn1cblxuLyoqXG4qIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLlxuKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiovXG5mdW5jdGlvbiBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyhcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyxcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBuZ0Rldk1vZGUgPyBuZXcgTWF0Y2hlc0FycmF5KCkgOiBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIHZpZXdEYXRhKSwgdFZpZXcsIGRlZi50eXBlKTtcblxuICAgICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgICAgIGlmICh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlKTtcbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgZ2l2ZW4gVE5vZGUgYXMgYSBjb21wb25lbnQncyBob3N0LiBUaGlzIGNvbnNpc3RzIG9mOlxuICogLSBzZXR0aW5nIGFwcHJvcHJpYXRlIFROb2RlIGZsYWdzO1xuICogLSBzdG9yaW5nIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC5cbiovXG5leHBvcnQgZnVuY3Rpb24gbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldzogVFZpZXcsIGhvc3RUTm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIGhvc3RUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdDtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBuZ0Rldk1vZGUgPyBuZXcgVFZpZXdDb21wb25lbnRzKCkgOiBbXG4gICBdKSkucHVzaChob3N0VE5vZGUuaW5kZXgpO1xufVxuXG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nIHwgbnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9XG4gICAgICAgIG5nRGV2TW9kZSA/IG5ldyBUTm9kZUxvY2FsTmFtZXMoKSA6IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKSB0aHJvdyBuZXcgRXJyb3IoYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgaW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnwgQ29tcG9uZW50RGVmPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gaW5kZXg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRUTm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIGJhc2VSZXNvbHZlRGlyZWN0aXZlPFQ+KHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkZWY6IERpcmVjdGl2ZURlZjxUPikge1xuICB0Vmlldy5kYXRhLnB1c2goZGVmKTtcbiAgY29uc3QgZGlyZWN0aXZlRmFjdG9yeSA9XG4gICAgICBkZWYuZmFjdG9yeSB8fCAoKGRlZiBhc3tmYWN0b3J5OiBGdW5jdGlvbn0pLmZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmKGRlZi50eXBlLCB0cnVlKSk7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBudWxsKTtcbiAgdFZpZXcuYmx1ZXByaW50LnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG4gIHZpZXdEYXRhLnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUQ29tcG9uZW50VmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldyxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBuYXRpdmUsXG4gICAgICAgICAgaG9zdFROb2RlIGFzIFRFbGVtZW50Tm9kZSwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpKSk7XG5cbiAgLy8gQ29tcG9uZW50IHZpZXcgd2lsbCBhbHdheXMgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGluamVjdGVkIExDb250YWluZXJzLFxuICAvLyBzbyB0aGlzIGlzIGEgcmVndWxhciBlbGVtZW50LCB3cmFwIGl0IHdpdGggdGhlIGNvbXBvbmVudCB2aWV3XG4gIGxWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKFxuICAgIGluZGV4OiBudW1iZXIsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyRm4gfCBudWxsLCBuYW1lc3BhY2U/OiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKHRWaWV3LCBpbmRleCk7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVzcGFjZSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IExWaWV3IHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGRlZiBUaGUgZGlyZWN0aXZlIGRlZiB0aGF0IGNvbnRhaW5zIHRoZSBsaXN0IG9mIGlucHV0c1xuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgdE5vZGU6IFROb2RlLFxuICAgIGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEpOiB2b2lkIHtcbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YSAhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIG5hdGl2ZUVsZW1lbnQsIHROb2RlLnR5cGUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIGF0dHJzIFRoZSBzdGF0aWMgYXR0cnMgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBhdHRyczogVEF0dHJpYnV0ZXMpOiBJbml0aWFsSW5wdXRzfFxuICAgIG51bGwge1xuICBsZXQgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0c3xudWxsID0gbnVsbDtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpIHtcbiAgICAgIC8vIFNraXAgb3ZlciB0aGUgYG5nUHJvamVjdEFzYCB2YWx1ZS5cbiAgICAgIGkgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGhpdCBhbnkgb3RoZXIgYXR0cmlidXRlIG1hcmtlcnMsIHdlJ3JlIGRvbmUgYW55d2F5LiBOb25lIG9mIHRob3NlIGFyZSB2YWxpZCBpbnB1dHMuXG4gICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PT0gJ251bWJlcicpIGJyZWFrO1xuXG4gICAgaWYgKGlucHV0cy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSBhcyBzdHJpbmcpKSB7XG4gICAgICBpZiAoaW5wdXRzVG9TdG9yZSA9PT0gbnVsbCkgaW5wdXRzVG9TdG9yZSA9IFtdO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKGF0dHJOYW1lIGFzIHN0cmluZywgaW5wdXRzW2F0dHJOYW1lIGFzIHN0cmluZ10sIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5wdXRzVG9TdG9yZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIE5vdCBzdXJlIHdoeSBJIG5lZWQgdG8gZG8gYGFueWAgaGVyZSBidXQgVFMgY29tcGxhaW5zIGxhdGVyLlxuY29uc3QgTENvbnRhaW5lckFycmF5OiBhbnkgPSAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpKSAmJlxuICAgIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ29udGFpbmVyJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBMVmlldywgY3VycmVudFZpZXc6IExWaWV3LCBuYXRpdmU6IFJDb21tZW50LFxuICAgIHROb2RlOiBUTm9kZSk6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgIWlzUHJvY2VkdXJhbFJlbmRlcmVyKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSkgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmUpO1xuICAvLyBodHRwczovL2pzcGVyZi5jb20vYXJyYXktbGl0ZXJhbC12cy1uZXctYXJyYXktcmVhbGx5XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBuZXcgKG5nRGV2TW9kZSA/IExDb250YWluZXJBcnJheSA6IEFycmF5KShcbiAgICAgIGhvc3ROYXRpdmUsICAvLyBob3N0IG5hdGl2ZVxuICAgICAgdHJ1ZSwgICAgICAgIC8vIEJvb2xlYW4gYHRydWVgIGluIHRoaXMgcG9zaXRpb24gc2lnbmlmaWVzIHRoYXQgdGhpcyBpcyBhbiBgTENvbnRhaW5lcmBcbiAgICAgIEFjdGl2ZUluZGV4RmxhZy5EWU5BTUlDX0VNQkVEREVEX1ZJRVdTX09OTFkgPDwgQWN0aXZlSW5kZXhGbGFnLlNISUZULCAgLy8gYWN0aXZlIGluZGV4XG4gICAgICBjdXJyZW50VmlldywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZXh0XG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICAgIHROb2RlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdF9ob3N0XG4gICAgICBuYXRpdmUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5hdGl2ZSxcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlldyByZWZzXG4gICAgICApO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuXG4vKipcbiAqIEdvZXMgb3ZlciBkeW5hbWljIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgbGV0IHZpZXdPckNvbnRhaW5lciA9IGxWaWV3W0NISUxEX0hFQURdO1xuICB3aGlsZSAodmlld09yQ29udGFpbmVyICE9PSBudWxsKSB7XG4gICAgLy8gTm90ZTogdmlld09yQ29udGFpbmVyIGNhbiBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seVxuICAgIC8vIGludGVyZXN0ZWQgaW4gTENvbnRhaW5lclxuICAgIGxldCBhY3RpdmVJbmRleEZsYWc6IEFjdGl2ZUluZGV4RmxhZztcbiAgICBpZiAoaXNMQ29udGFpbmVyKHZpZXdPckNvbnRhaW5lcikgJiZcbiAgICAgICAgKGFjdGl2ZUluZGV4RmxhZyA9IHZpZXdPckNvbnRhaW5lcltBQ1RJVkVfSU5ERVhdKSA+PiBBY3RpdmVJbmRleEZsYWcuU0hJRlQgPT09XG4gICAgICAgICAgICBBY3RpdmVJbmRleEZsYWcuRFlOQU1JQ19FTUJFRERFRF9WSUVXU19PTkxZKSB7XG4gICAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCB2aWV3T3JDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IHZpZXdPckNvbnRhaW5lcltpXSBhcyBMVmlldztcbiAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IGVtYmVkZGVkTFZpZXdbVFZJRVddO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbWJlZGRlZFRWaWV3LCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoZW1iZWRkZWRMVmlldykpIHtcbiAgICAgICAgICByZWZyZXNoVmlldyhcbiAgICAgICAgICAgICAgZW1iZWRkZWRUVmlldywgZW1iZWRkZWRMVmlldywgZW1iZWRkZWRUVmlldy50ZW1wbGF0ZSwgZW1iZWRkZWRMVmlld1tDT05URVhUXSAhKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKChhY3RpdmVJbmRleEZsYWcgJiBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXUykgIT09IDApIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgQ0QgbW92ZWQgdmlld3MgaWYgdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgaW5zZXJ0ZWQgZG9lcyBub3QgbWF0Y2hcbiAgICAgICAgLy8gdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgZGVjbGFyZWQgYW5kIGluc2VydGlvbiBpcyBvbi1wdXNoLiBNb3ZlZCB2aWV3cyBhbHNvXG4gICAgICAgIC8vIGNvbnRhaW5zIGludHJhIGNvbXBvbmVudCBtb3Zlcywgb3IgY2hlY2stYWx3YXlzIHdoaWNoIG5lZWQgdG8gYmUgc2tpcHBlZC5cbiAgICAgICAgcmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdzKHZpZXdPckNvbnRhaW5lciwgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddICEpO1xuICAgICAgfVxuICAgIH1cbiAgICB2aWV3T3JDb250YWluZXIgPSB2aWV3T3JDb250YWluZXJbTkVYVF07XG4gIH1cbn1cblxuXG4vKipcbiAqIFJlZnJlc2ggdHJhbnNwbGFudGVkIExWaWV3cy5cbiAqXG4gKiBTZWU6IGBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXU2AgYW5kIGBMVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11gIGZvclxuICogZXhwbGFuYXRpb24gb2YgdHJhbnNwbGFudGVkIHZpZXdzLlxuICpcbiAqIEBwYXJhbSBsQ29udGFpbmVyIFRoZSBgTENvbnRhaW5lcmAgd2hpY2ggaGFzIHRyYW5zcGxhbnRlZCB2aWV3cy5cbiAqIEBwYXJhbSBkZWNsYXJlZENvbXBvbmVudExWaWV3IFRoZSBgbENvbnRhaW5lcmAgcGFyZW50IGNvbXBvbmVudCBgTFZpZXdgLlxuICovXG5mdW5jdGlvbiByZWZyZXNoVHJhbnNwbGFudGVkVmlld3MobENvbnRhaW5lcjogTENvbnRhaW5lciwgZGVjbGFyZWRDb21wb25lbnRMVmlldzogTFZpZXcpIHtcbiAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdICE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgbW92ZWRMVmlldyA9IG1vdmVkVmlld3NbaV0gITtcbiAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgY29uc3QgaW5zZXJ0ZWRDb21wb25lbnRMVmlldyA9IGluc2VydGlvbkxDb250YWluZXJbUEFSRU5UXVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChpbnNlcnRlZENvbXBvbmVudExWaWV3LCAnTWlzc2luZyBMVmlldycpO1xuICAgIC8vIENoZWNrIGlmIHdlIGhhdmUgYSB0cmFuc3BsYW50ZWQgdmlldyBieSBjb21wZXJpbmcgZGVjbGFyYXRpb24gYW5kIGluc2VydGlvbiBsb2NhdGlvbi5cbiAgICBpZiAoaW5zZXJ0ZWRDb21wb25lbnRMVmlldyAhPT0gZGVjbGFyZWRDb21wb25lbnRMVmlldykge1xuICAgICAgLy8gWWVzIHRoZSBgTFZpZXdgIGlzIHRyYW5zcGxhbnRlZC5cbiAgICAgIC8vIEhlcmUgd2Ugd291bGQgbGlrZSB0byBrbm93IGlmIHRoZSBjb21wb25lbnQgaXMgYE9uUHVzaGAuIFdlIGRvbid0IGhhdmVcbiAgICAgIC8vIGV4cGxpY2l0IGBPblB1c2hgIGZsYWcgaW5zdGVhZCB3ZSBzZXQgYENoZWNrQWx3YXlzYCB0byBmYWxzZSAod2hpY2ggaXMgYE9uUHVzaGApXG4gICAgICAvLyBOb3QgdG8gYmUgY29uZnVzZWQgd2l0aCBgTWFudWFsT25QdXNoYCB3aGljaCBpcyB1c2VkIHdpdGggd2V0aGVyIGEgRE9NIGV2ZW50XG4gICAgICAvLyBzaG91bGQgYXV0b21hdGljYWxseSBtYXJrIGEgdmlldyBhcyBkaXJ0eS5cbiAgICAgIGNvbnN0IGluc2VydGlvbkNvbXBvbmVudElzT25QdXNoID1cbiAgICAgICAgICAoaW5zZXJ0ZWRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSA9PT0gMDtcbiAgICAgIGlmIChpbnNlcnRpb25Db21wb25lbnRJc09uUHVzaCkge1xuICAgICAgICAvLyBIZXJlIHdlIGtub3cgdGhhdCB0aGUgdGVtcGxhdGUgaGFzIGJlZW4gdHJhbnNwbGFudGVkIGFjcm9zcyBjb21wb25lbnRzIGFuZCBpc1xuICAgICAgICAvLyBvbi1wdXNoIChub3QganVzdCBtb3ZlZCB3aXRoaW4gYSBjb21wb25lbnQpLiBJZiB0aGUgaW5zZXJ0aW9uIGlzIG1hcmtlZCBkaXJ0eSwgdGhlblxuICAgICAgICAvLyB0aGVyZSBpcyBubyBuZWVkIHRvIENEIGhlcmUgYXMgd2Ugd2lsbCBkbyBpdCBhZ2FpbiBsYXRlciB3aGVuIHdlIGdldCB0byBpbnNlcnRpb25cbiAgICAgICAgLy8gcG9pbnQuXG4gICAgICAgIGNvbnN0IG1vdmVkVFZpZXcgPSBtb3ZlZExWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobW92ZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlZnJlc2hWaWV3KG1vdmVkVFZpZXcsIG1vdmVkTFZpZXcsIG1vdmVkVFZpZXcudGVtcGxhdGUsIG1vdmVkTFZpZXdbQ09OVEVYVF0gISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudEhvc3RJZHggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50SG9zdElkeDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShob3N0TFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpICYmXG4gICAgICBjb21wb25lbnRWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICAgIHJlZnJlc2hWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRUVmlldy50ZW1wbGF0ZSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRUVmlldywgY29tcG9uZW50Vmlldyk7XG4gIHJlbmRlclZpZXcoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xufVxuXG4vKipcbiAqIFN5bmNzIGFuIExWaWV3IGluc3RhbmNlIHdpdGggaXRzIGJsdWVwcmludCBpZiB0aGV5IGhhdmUgZ290dGVuIG91dCBvZiBzeW5jLlxuICpcbiAqIFR5cGljYWxseSwgYmx1ZXByaW50cyBhbmQgdGhlaXIgdmlldyBpbnN0YW5jZXMgc2hvdWxkIGFsd2F5cyBiZSBpbiBzeW5jLCBzbyB0aGUgbG9vcCBoZXJlXG4gKiB3aWxsIGJlIHNraXBwZWQuIEhvd2V2ZXIsIGNvbnNpZGVyIHRoaXMgY2FzZSBvZiB0d28gY29tcG9uZW50cyBzaWRlLWJ5LXNpZGU6XG4gKlxuICogQXBwIHRlbXBsYXRlOlxuICogYGBgXG4gKiA8Y29tcD48L2NvbXA+XG4gKiA8Y29tcD48L2NvbXA+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdpbGwgaGFwcGVuOlxuICogMS4gQXBwIHRlbXBsYXRlIGJlZ2lucyBwcm9jZXNzaW5nLlxuICogMi4gRmlyc3QgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogMy4gU2Vjb25kIDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDQuIEFwcCB0ZW1wbGF0ZSBjb21wbGV0ZXMgcHJvY2Vzc2luZywgc28gaXQncyB0aW1lIHRvIGNoZWNrIGNoaWxkIHRlbXBsYXRlcy5cbiAqIDUuIEZpcnN0IDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdCBoYXMgYSBkaXJlY3RpdmUsIHNvIGl0cyBkZWYgaXMgcHVzaGVkIHRvIGJsdWVwcmludC5cbiAqIDYuIFNlY29uZCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXRzIGJsdWVwcmludCBoYXMgYmVlbiB1cGRhdGVkIGJ5IHRoZSBmaXJzdFxuICogPGNvbXA+IHRlbXBsYXRlLCBidXQgaXRzIExWaWV3IHdhcyBjcmVhdGVkIGJlZm9yZSB0aGlzIHVwZGF0ZSwgc28gaXQgaXMgb3V0IG9mIHN5bmMuXG4gKlxuICogTm90ZSB0aGF0IGVtYmVkZGVkIHZpZXdzIGluc2lkZSBuZ0ZvciBsb29wcyB3aWxsIG5ldmVyIGJlIG91dCBvZiBzeW5jIGJlY2F1c2UgdGhlc2Ugdmlld3NcbiAqIGFyZSBwcm9jZXNzZWQgYXMgc29vbiBhcyB0aGV5IGFyZSBjcmVhdGVkLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBibHVlcHJpbnQgZm9yIHN5bmNpbmdcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludCh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBpID0gbFZpZXcubGVuZ3RoOyBpIDwgdFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgbFZpZXcucHVzaCh0Vmlldy5ibHVlcHJpbnRbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4obFZpZXc6IExWaWV3LCBsVmlld09yTENvbnRhaW5lcjogVCk6IFQge1xuICAvLyBUT0RPKGJlbmxlc2gvbWlza28pOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGluY29ycmVjdCwgYmVjYXVzZSBpdCBhbHdheXMgYWRkcyB0aGUgTENvbnRhaW5lclxuICAvLyB0byB0aGUgZW5kIG9mIHRoZSBxdWV1ZSwgd2hpY2ggbWVhbnMgaWYgdGhlIGRldmVsb3BlciByZXRyaWV2ZXMgdGhlIExDb250YWluZXJzIGZyb20gUk5vZGVzIG91dFxuICAvLyBvZiBvcmRlciwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBydW4gb3V0IG9mIG9yZGVyLCBhcyB0aGUgYWN0IG9mIHJldHJpZXZpbmcgdGhlIHRoZVxuICAvLyBMQ29udGFpbmVyIGZyb20gdGhlIFJOb2RlIGlzIHdoYXQgYWRkcyBpdCB0byB0aGUgcXVldWUuXG4gIGlmIChsVmlld1tDSElMRF9IRUFEXSkge1xuICAgIGxWaWV3W0NISUxEX1RBSUxdICFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCAhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2socm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIGNvbnN0IGxWaWV3ID0gcmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSAhO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHRWaWV3OiBUVmlldywgdmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0VmlldywgdmlldywgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT4sIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UXVlcnlGbiwgJ1ZpZXcgcXVlcmllcyBmdW5jdGlvbiB0byBleGVjdXRlIG11c3QgYmUgZGVmaW5lZC4nKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gIHZpZXdRdWVyeUZuKGZsYWdzLCBjb21wb25lbnQpO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIG5vZGVJbmRleCBpbmRleCBvZiBhIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgbm9kZUluZGV4OiBudW1iZXIsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICAuLi5pbnRlcnBvbGF0aW9uUGFydHM6IHN0cmluZ1tdKSB7XG4gIC8vIEJpbmRpbmcgbWV0YS1kYXRhIGFyZSBzdG9yZWQgb25seSB0aGUgZmlyc3QgdGltZSBhIGdpdmVuIHByb3BlcnR5IGluc3RydWN0aW9uIGlzIHByb2Nlc3NlZC5cbiAgLy8gU2luY2Ugd2UgZG9uJ3QgaGF2ZSBhIGNvbmNlcHQgb2YgdGhlIFwiZmlyc3QgdXBkYXRlIHBhc3NcIiB3ZSBuZWVkIHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiB0aGVcbiAgLy8gYmluZGluZyBtZXRhLWRhdGEgdG8gZGVjaWRlIGlmIG9uZSBzaG91bGQgYmUgc3RvcmVkIChvciBpZiB3YXMgc3RvcmVkIGFscmVhZHkpLlxuICBpZiAodERhdGFbYmluZGluZ0luZGV4XSA9PT0gbnVsbCkge1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbbm9kZUluZGV4ICsgSEVBREVSX09GRlNFVF0gYXMgVE5vZGU7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PSBudWxsIHx8ICF0Tm9kZS5pbnB1dHNbcHJvcGVydHlOYW1lXSkge1xuICAgICAgY29uc3QgcHJvcEJpbmRpbmdJZHhzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncyB8fCAodE5vZGUucHJvcGVydHlCaW5kaW5ncyA9IFtdKTtcbiAgICAgIHByb3BCaW5kaW5nSWR4cy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICBsZXQgYmluZGluZ01ldGFkYXRhID0gcHJvcGVydHlOYW1lO1xuICAgICAgaWYgKGludGVycG9sYXRpb25QYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGJpbmRpbmdNZXRhZGF0YSArPVxuICAgICAgICAgICAgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBpbnRlcnBvbGF0aW9uUGFydHMuam9pbihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICB9XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gYmluZGluZ01ldGFkYXRhO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAoKSA6IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHRWaWV3OiBUVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBuZ0Rldk1vZGUgPyBuZXcgVENsZWFudXAoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSB1bndyYXBMVmlldyhsVmlld1t0Tm9kZS5pbmRleF0pICE7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dHMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqICAgICAgICBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBwdWJsaWNOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dCAhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpbnN0YW5jZVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdGV4dCBiaW5kaW5nIGF0IGEgZ2l2ZW4gaW5kZXggaW4gYSBnaXZlbiBMVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAndmFsdWUgc2hvdWxkIG5vdCBiZSBOT19DSEFOR0UnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0VGV4dCsrO1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIuc2V0VmFsdWUoZWxlbWVudCwgdmFsdWUpIDogZWxlbWVudC50ZXh0Q29udGVudCA9IHZhbHVlO1xufVxuIl19