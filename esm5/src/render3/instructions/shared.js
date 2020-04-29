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
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getCurrentDirectiveIndex, getIsParent, getPreviousOrParentTNode, getSelectedIndex, leaveView, setBindingIndex, setBindingRootForHostBindings, setCheckNoChangesMode, setCurrentDirectiveIndex, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex } from '../state';
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
    var tView = def.tView;
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
        // Do not use unbound attributes as inputs to structural directives, since structural
        // directive inputs can only be set using microsyntax (e.g. `<div *dir="exp">`).
        // TODO(FW-1930): microsyntax expressions may also contain unbound/static attributes, which
        // should be set for inline templates.
        var initialInputs = (tNodeAttrs !== null && !isInlineTemplate(tNode)) ?
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
    var currentDirectiveIndex = getCurrentDirectiveIndex();
    try {
        setSelectedIndex(elementIndex);
        for (var dirIndex = start; dirIndex < end; dirIndex++) {
            var def = tView.data[dirIndex];
            var directive = lView[dirIndex];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGlCQUFpQixFQUFFLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDN0osT0FBTyxFQUFDLG9CQUFvQixFQUFDLE1BQU0sNkJBQTZCLENBQUM7QUFDakUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBQ3JELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxxQkFBcUIsRUFBRSxnQkFBZ0IsRUFBRSxXQUFXLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDL0UsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3JELE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDNUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFP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Q0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLEtBQWE7SUFDNUUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBZ0IsRUFBRSwrQkFBK0IsQ0FBQyxDQUFDO0lBQ3JGLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDO0lBQzdELElBQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWlCLENBQUM7SUFDL0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUNuRSxTQUFTLElBQUksU0FBUyxDQUFDLGVBQWUsRUFBRSxDQUFDO0lBQ3pDLElBQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsS0FBSyxDQUFDO0FBQ25HLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5PX0VSUk9SU19TQ0hFTUEsIFNjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9zY2hlbWEnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge3ZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcywgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U2FuaXRpemVyfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemVyJztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGUsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWUsIGFzc2VydFNhbWV9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge2luaXROZ0Rldk1vZGV9IGZyb20gJy4uLy4uL3V0aWwvbmdfZGV2X21vZGUnO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19yZWZsZWN0JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldEZhY3RvcnlEZWZ9IGZyb20gJy4uL2RlZmluaXRpb24nO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlQ2hlY2tIb29rcywgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzLCBpbmNyZW1lbnRJbml0UGhhc2VGbGFnc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtBQ1RJVkVfSU5ERVgsIEFjdGl2ZUluZGV4RmxhZywgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzLCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9CTE9PTV9QQVJFTlRfU0laRSwgTm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBUQXR0cmlidXRlcywgVENvbnN0YW50cywgVENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlLCBUVmlld05vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzUHJvY2VkdXJhbFJlbmRlcmVyLCBSQ29tbWVudCwgUkVsZW1lbnQsIFJlbmRlcmVyMywgUmVuZGVyZXJGYWN0b3J5MywgUk5vZGUsIFJUZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdCwgaXNDb250ZW50UXVlcnlIb3N0LCBpc0xDb250YWluZXIsIGlzUm9vdFZpZXd9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEluaXRQaGFzZVN0YXRlLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2lzSW5saW5lVGVtcGxhdGUsIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgsIGdldElzUGFyZW50LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFNlbGVjdGVkSW5kZXgsIGdldFRWaWV3LCBsZWF2ZVZpZXcsIHNldEJpbmRpbmdJbmRleCwgc2V0QmluZGluZ1Jvb3RGb3JIb3N0QmluZGluZ3MsIHNldENoZWNrTm9DaGFuZ2VzTW9kZSwgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wLCBtZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudH0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ3JlYXRpb25Nb2RlLCByZWFkUGF0Y2hlZExWaWV3LCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB1bndyYXBMVmlldywgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHthdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCwgY2xvbmVUb1RWaWV3RGF0YSwgTENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZURlYnVnLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gKCgpID0+IFByb21pc2UucmVzb2x2ZShudWxsKSkoKTtcblxuLyoqXG4gKiBQcm9jZXNzIHRoZSBgVFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc2AuIChFeGVjdXRlIHRoZSBgaG9zdEJpbmRpbmdzYC4pXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgY29udGFpbmluZyB0aGUgYGV4cGFuZG9JbnN0cnVjdGlvbnNgXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCBhc3NvY2lhdGVkIHdpdGggdGhlIGBUVmlld2BcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5nc0J5RXhlY3V0aW5nRXhwYW5kb0luc3RydWN0aW9ucyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBpcyBub3QgYXNzb2NpYXRlZCB3aXRoIHRoZSBgVFZpZXdgIScpO1xuICB0cnkge1xuICAgIGNvbnN0IGV4cGFuZG9JbnN0cnVjdGlvbnMgPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zO1xuICAgIGlmIChleHBhbmRvSW5zdHJ1Y3Rpb25zICE9PSBudWxsKSB7XG4gICAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHRWaWV3LmV4cGFuZG9TdGFydEluZGV4O1xuICAgICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgICAgbGV0IGN1cnJlbnRFbGVtZW50SW5kZXggPSAtMTtcbiAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIEl0IGlzIHBvc3NpYmxlIHRvIGdldCBoZXJlIHdpdGggYFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNgIGNvbnRhaW5pbmcgbm9cbiAgICAgIC8vIGZ1bmN0aW9ucyB0byBleGVjdXRlLiBUaGlzIGlzIHdhc3RlZnVsIGFzIHRoZXJlIGlzIG5vIHdvcmsgdG8gYmUgZG9uZSwgYnV0IHdlIHN0aWxsIG5lZWRcbiAgICAgIC8vIHRvIGl0ZXJhdGUgb3ZlciB0aGUgaW5zdHJ1Y3Rpb25zLlxuICAgICAgLy8gSW4gZXhhbXBsZSBvZiB0aGlzIGlzIGluIHRoaXMgdGVzdDogYGhvc3RfYmluZGluZ19zcGVjLnRzYFxuICAgICAgLy8gYGZpdCgnc2hvdWxkIG5vdCBjYXVzZSBwcm9ibGVtcyBpZiBkZXRlY3RDaGFuZ2VzIGlzIGNhbGxlZCB3aGVuIGEgcHJvcGVydHkgdXBkYXRlcycsIC4uLmBcbiAgICAgIC8vIEluIHRoZSBhYm92ZSB0ZXN0IHdlIGdldCBoZXJlIHdpdGggZXhwYW5kbyBbMCwgMCwgMV0gd2hpY2ggcmVxdWlyZXMgYSBsb3Qgb2YgcHJvY2Vzc2luZyBidXRcbiAgICAgIC8vIHRoZXJlIGlzIG5vIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSBleHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgICAvLyBJbXBvcnRhbnQ6IEluIEpTIGAteGAgYW5kIGAwLXhgIGlzIG5vdCB0aGUgc2FtZSEgSWYgYHg9PT0wYCB0aGVuIGAteGAgd2lsbCBwcm9kdWNlXG4gICAgICAgICAgICAvLyBgLTBgIHdoaWNoIHJlcXVpcmVzIG5vbiBzdGFuZGFyZCBtYXRoIGFyaXRobWV0aWMgYW5kIGl0IGNhbiBwcmV2ZW50IFZNIG9wdGltaXphdGlvbnMuXG4gICAgICAgICAgICAvLyBgMC0wYCB3aWxsIGFsd2F5cyBwcm9kdWNlIGAwYCBhbmQgd2lsbCBub3QgY2F1c2UgYSBwb3RlbnRpYWwgZGVvcHRpbWl6YXRpb24gaW4gVk0uXG4gICAgICAgICAgICAvLyBUT0RPKG1pc2tvKTogUEVSRiBUaGlzIHNob3VsZCBiZSByZWZhY3RvcmVkIHRvIHVzZSBgfmluc3RydWN0aW9uYCBhcyB0aGF0IGRvZXMgbm90XG4gICAgICAgICAgICAvLyBzdWZmZXIgZnJvbSBgLTBgIGFuZCBpdCBpcyBmYXN0ZXIvbW9yZSBjb21wYWN0LlxuICAgICAgICAgICAgY3VycmVudEVsZW1lbnRJbmRleCA9IDAgLSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICAgIHNldFNlbGVjdGVkSW5kZXgoY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAoZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKGJpbmRpbmdSb290SW5kZXgsIGN1cnJlbnREaXJlY3RpdmVJbmRleCk7XG4gICAgICAgICAgICBjb25zdCBob3N0Q3R4ID0gbFZpZXdbY3VycmVudERpcmVjdGl2ZUluZGV4XTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIFRPRE8obWlza28pOiBQRVJGIFJlbHlpbmcgb24gaW5jcmVtZW50aW5nIHRoZSBgY3VycmVudERpcmVjdGl2ZUluZGV4YCBoZXJlIGlzXG4gICAgICAgICAgLy8gc3ViLW9wdGltYWwuIFRoZSBpbXBsaWNhdGlvbnMgYXJlIHRoYXQgaWYgd2UgaGF2ZSBhIGxvdCBvZiBkaXJlY3RpdmVzIGJ1dCBub25lIG9mIHRoZW1cbiAgICAgICAgICAvLyBoYXZlIGhvc3QgYmluZGluZ3Mgd2UgbmV2ZXJ0aGVsZXNzIG5lZWQgdG8gaXRlcmF0ZSBvdmVyIHRoZSBleHBhbmRvIGluc3RydWN0aW9ucyB0b1xuICAgICAgICAgIC8vIHVwZGF0ZSB0aGUgY291bnRlci4gSXQgd291bGQgYmUgbXVjaCBiZXR0ZXIgaWYgd2UgY291bGQgZW5jb2RlIHRoZVxuICAgICAgICAgIC8vIGBjdXJyZW50RGlyZWN0aXZlSW5kZXhgIGludG8gdGhlIGBleHBhbmRvSW5zdHJ1Y3Rpb25gIGFycmF5IHNvIHRoYXQgd2Ugb25seSBuZWVkIHRvXG4gICAgICAgICAgLy8gaXRlcmF0ZSBvdmVyIHRob3NlIGRpcmVjdGl2ZXMgd2hpY2ggYWN0dWFsbHkgaGF2ZSBgaG9zdEJpbmRpbmdzYC5cbiAgICAgICAgICBjdXJyZW50RGlyZWN0aXZlSW5kZXgrKztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGFsbCBjb250ZW50IHF1ZXJpZXMgZGVjbGFyZWQgYnkgZGlyZWN0aXZlcyBpbiBhIGdpdmVuIHZpZXcgKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzO1xuICBpZiAoY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBxdWVyeVN0YXJ0SWR4ID0gY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSBjb250ZW50UXVlcmllc1tpICsgMV07XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMsICdjb250ZW50UXVlcmllcyBmdW5jdGlvbiBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgICBzZXRDdXJyZW50UXVlcnlJbmRleChxdWVyeVN0YXJ0SWR4KTtcbiAgICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKiogUmVuZGVycyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKGNyZWF0aW9uIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVuZGVyQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIG5hdGl2ZSBlbGVtZW50IGZyb20gYSB0YWcgbmFtZSwgdXNpbmcgYSByZW5kZXJlci5cbiAqIEBwYXJhbSBuYW1lIHRoZSB0YWcgbmFtZVxuICogQHBhcmFtIHJlbmRlcmVyIEEgcmVuZGVyZXIgdG8gdXNlXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKG5hbWU6IHN0cmluZywgcmVuZGVyZXI6IFJlbmRlcmVyMywgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbCk6IFJFbGVtZW50IHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlci5jcmVhdGVFbGVtZW50KG5hbWUsIG5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIG5hbWVzcGFjZSA9PT0gbnVsbCA/IHJlbmRlcmVyLmNyZWF0ZUVsZW1lbnQobmFtZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZW5kZXJlci5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3fG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVHxudWxsLCBmbGFnczogTFZpZXdGbGFncywgaG9zdDogUkVsZW1lbnR8bnVsbCxcbiAgICB0SG9zdE5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCwgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5M3xudWxsLFxuICAgIHJlbmRlcmVyPzogUmVuZGVyZXIzfG51bGwsIHNhbml0aXplcj86IFNhbml0aXplcnxudWxsLCBpbmplY3Rvcj86IEluamVjdG9yfG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIG5nRGV2TW9kZSA/IGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCh0VmlldykgOiB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IHRIb3N0Tm9kZTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3ICE9PSBudWxsIDogdHJ1ZSwgdHJ1ZSxcbiAgICAgICAgICAnRW1iZWRkZWQgdmlld3MgbXVzdCBoYXZlIHBhcmVudExWaWV3Jyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA9XG4gICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3IVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gOiBsVmlldztcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExWaWV3RGVidWcobFZpZXcpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gdEhvc3ROb2RlIFRoaXMgaXMgYSBoYWNrIGFuZCB3ZSBzaG91bGQgbm90IGhhdmUgdG8gcGFzcyB0aGlzIHZhbHVlIGluLiBJdCBpcyBvbmx5IHVzZWQgdG9cbiAqIGRldGVybWluZSBpZiB0aGUgcGFyZW50IGJlbG9uZ3MgdG8gYSBkaWZmZXJlbnQgdFZpZXcuIEluc3RlYWQgd2Ugc2hvdWxkIG5vdCBoYXZlIHBhcmVudFRWaWV3XG4gKiBwb2ludCB0byBUVmlldyBvdGhlciB0aGUgY3VycmVudCBvbmUuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudCwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcixcbiAgICBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmXG4gICAgVEljdUNvbnRhaW5lck5vZGUge1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBjb25zdCBhZGp1c3RlZEluZGV4ID0gaW5kZXggKyBIRUFERVJfT0ZGU0VUO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gYXMgVE5vZGUgfHxcbiAgICAgIGNyZWF0ZVROb2RlQXRJbmRleCh0VmlldywgdEhvc3ROb2RlLCBhZGp1c3RlZEluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUVmlld05vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmXG4gICAgICBUUHJvamVjdGlvbk5vZGUgJiBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBhZGp1c3RlZEluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpIHtcbiAgY29uc3QgcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGNvbnN0IGlzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgcGFyZW50ID1cbiAgICAgIGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLFxuICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICBjb25zdCBwYXJlbnRJblNhbWVWaWV3ID0gcGFyZW50ICYmIHBhcmVudCAhPT0gdEhvc3ROb2RlO1xuICBjb25zdCB0UGFyZW50Tm9kZSA9IHBhcmVudEluU2FtZVZpZXcgPyBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgOiBudWxsO1xuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPVxuICAgICAgY3JlYXRlVE5vZGUodFZpZXcsIHRQYXJlbnROb2RlLCB0eXBlLCBhZGp1c3RlZEluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUpIHtcbiAgICBpZiAoaXNQYXJlbnQgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID09IG51bGwgJiZcbiAgICAgICAgKHROb2RlLnBhcmVudCAhPT0gbnVsbCB8fCBwcmV2aW91c09yUGFyZW50VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpKSB7XG4gICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgfSBlbHNlIGlmICghaXNQYXJlbnQpIHtcbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgfVxuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzc2lnblRWaWV3Tm9kZVRvTFZpZXcoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50Tm9kZTogVE5vZGV8bnVsbCwgaW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3KTogVFZpZXdOb2RlIHtcbiAgLy8gVmlldyBub2RlcyBhcmUgbm90IHN0b3JlZCBpbiBkYXRhIGJlY2F1c2UgdGhleSBjYW4gYmUgYWRkZWQgLyByZW1vdmVkIGF0IHJ1bnRpbWUgKHdoaWNoXG4gIC8vIHdvdWxkIGNhdXNlIGluZGljZXMgdG8gY2hhbmdlKS4gVGhlaXIgVE5vZGVzIGFyZSBpbnN0ZWFkIHN0b3JlZCBpbiB0Vmlldy5ub2RlLlxuICBsZXQgdE5vZGUgPSB0Vmlldy5ub2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiB0UGFyZW50Tm9kZSAmJlxuICAgICAgICBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHRQYXJlbnROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgdFZpZXcubm9kZSA9IHROb2RlID0gY3JlYXRlVE5vZGUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsICAvL1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tUX0hPU1RdID0gdE5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYExWaWV3YFxuICogQHBhcmFtIHZpZXcgVGhlIGBMVmlld2AgY29udGFpbmluZyB0aGUgYmx1ZXByaW50IHRvIGFkanVzdFxuICogQHBhcmFtIG51bVNsb3RzVG9BbGxvYyBUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIGluIHRoZSBMVmlldywgc2hvdWxkIGJlID4wXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIG51bVNsb3RzVG9BbGxvYzogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oXG4gICAgICAgICAgbnVtU2xvdHNUb0FsbG9jLCAwLCAnVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBzaG91bGQgYmUgZ3JlYXRlciB0aGFuIDAnKTtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA+IDApIHtcbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzVG9BbGxvYzsgaSsrKSB7XG4gICAgICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKG51bGwpO1xuICAgICAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgICAgIGxWaWV3LnB1c2gobnVsbCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIHNob3VsZCBvbmx5IGluY3JlbWVudCB0aGUgZXhwYW5kbyBzdGFydCBpbmRleCBpZiB0aGVyZSBhcmVuJ3QgYWxyZWFkeSBkaXJlY3RpdmVzXG4gICAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgICBpZiAoIXRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICAgICAgdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXggKz0gbnVtU2xvdHNUb0FsbG9jO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gU2luY2Ugd2UncmUgYWRkaW5nIHRoZSBkeW5hbWljIG5vZGVzIGludG8gdGhlIGV4cGFuZG8gc2VjdGlvbiwgd2UgbmVlZCB0byBsZXQgdGhlIGhvc3RcbiAgICAgICAgLy8gYmluZGluZ3Mga25vdyB0aGF0IHRoZXkgc2hvdWxkIHNraXAgeCBzbG90c1xuICAgICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB0aGUgY3JlYXRpb24gbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBjcmVhdGluZyB2aWV3IHF1ZXJ5IGZ1bmN0aW9ucyAoaWYgYW55KTtcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdGhlIGNyZWF0aW9uIG1vZGU7XG4gKiAtIHVwZGF0aW5nIHN0YXRpYyBxdWVyaWVzIChpZiBhbnkpO1xuICogLSBjcmVhdGluZyBjaGlsZCBjb21wb25lbnRzIGRlZmluZWQgaW4gYSBnaXZlbiB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVmlldzxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGVudGVyVmlldyhsVmlldywgbFZpZXdbVF9IT1NUXSk7XG4gIHRyeSB7XG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBhIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHZpZXcsIGlmIGl0IGV4aXN0cy4gQSB0ZW1wbGF0ZSBmdW5jdGlvbiBtaWdodCBub3QgYmVcbiAgICAvLyBkZWZpbmVkIGZvciB0aGUgcm9vdCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgdGVtcGxhdGVGbiA9IHRWaWV3LnRlbXBsYXRlO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHMuXG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAvLyBvZmYgZmlyc3RDcmVhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXZSByZXNvbHZlIGNvbnRlbnQgcXVlcmllcyBzcGVjaWZpY2FsbHkgbWFya2VkIGFzIGBzdGF0aWNgIGluIGNyZWF0aW9uIG1vZGUuIER5bmFtaWNcbiAgICAvLyBjb250ZW50IHF1ZXJpZXMgYXJlIHJlc29sdmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIChpLmUuIHVwZGF0ZSBtb2RlKSwgYWZ0ZXIgZW1iZWRkZWRcbiAgICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICAgIGlmICh0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcykge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gV2UgbXVzdCBtYXRlcmlhbGl6ZSBxdWVyeSByZXN1bHRzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRzIGFyZSBwcm9jZXNzZWRcbiAgICAvLyBpbiBjYXNlIGEgY2hpbGQgY29tcG9uZW50IGhhcyBwcm9qZWN0ZWQgYSBjb250YWluZXIuIFRoZSBMQ29udGFpbmVyIG5lZWRzXG4gICAgLy8gdG8gZXhpc3Qgc28gdGhlIGVtYmVkZGVkIHZpZXdzIGFyZSBwcm9wZXJseSBhdHRhY2hlZCBieSB0aGUgY29udGFpbmVyLlxuICAgIGlmICh0Vmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdFZpZXcudmlld1F1ZXJ5ISwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgbWFuYWdlIHRvIGdldCBwYXN0IHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGR1ZSB0b1xuICAgIC8vIGFuIGVycm9yLCBtYXJrIHRoZSB2aWV3IGFzIGNvcnJ1cHRlZCBzbyB3ZSBjYW4gdHJ5IHRvIHJlY292ZXIuXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuaW5jb21wbGV0ZUZpcnN0UGFzcyA9IHRydWU7XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFZpZXc8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgaWYgKChmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSA9PT0gTFZpZXdGbGFncy5EZXN0cm95ZWQpIHJldHVybjtcbiAgZW50ZXJWaWV3KGxWaWV3LCBsVmlld1tUX0hPU1RdKTtcbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hlY2spXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVmcmVzaER5bmFtaWNFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBjb250ZW50Q2hlY2tIb29rcyA9IHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzO1xuICAgICAgICBpZiAoY29udGVudENoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgY29udGVudENoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBjb250ZW50SG9va3MgPSB0Vmlldy5jb250ZW50SG9va3M7XG4gICAgICAgIGlmIChjb250ZW50SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MoXG4gICAgICAgICAgICAgIGxWaWV3LCBjb250ZW50SG9va3MsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzZXRIb3N0QmluZGluZ3NCeUV4ZWN1dGluZ0V4cGFuZG9JbnN0cnVjdGlvbnModFZpZXcsIGxWaWV3KTtcblxuICAgIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBWaWV3IHF1ZXJpZXMgbXVzdCBleGVjdXRlIGFmdGVyIHJlZnJlc2hpbmcgY2hpbGQgY29tcG9uZW50cyBiZWNhdXNlIGEgdGVtcGxhdGUgaW4gdGhpcyB2aWV3XG4gICAgLy8gY291bGQgYmUgaW5zZXJ0ZWQgaW4gYSBjaGlsZCBjb21wb25lbnQuIElmIHRoZSB2aWV3IHF1ZXJ5IGV4ZWN1dGVzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRcbiAgICAvLyByZWZyZXNoLCB0aGUgdGVtcGxhdGUgbWlnaHQgbm90IHlldCBiZSBpbnNlcnRlZC5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIHZpZXcgaG9va3MgKEFmdGVyVmlld0luaXQsIEFmdGVyVmlld0NoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSkge1xuICAgICAgbFZpZXdbRkxBR1NdICY9IH4oTFZpZXdGbGFncy5EaXJ0eSB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3MpO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUobFZpZXcpO1xuICB0cnkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAoY3JlYXRpb25Nb2RlSXNBY3RpdmUpIHtcbiAgICAgIHJlbmRlclZpZXcodFZpZXcsIGxWaWV3LCBjb250ZXh0KTtcbiAgICB9XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobm9ybWFsRXhlY3V0aW9uUGF0aCAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCByZjogUmVuZGVyRmxhZ3MsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcHJldlNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gICAgaWYgKHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlICYmIGxWaWV3Lmxlbmd0aCA+IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIFdoZW4gd2UncmUgdXBkYXRpbmcsIGluaGVyZW50bHkgc2VsZWN0IDAgc28gd2UgZG9uJ3RcbiAgICAgIC8vIGhhdmUgdG8gZ2VuZXJhdGUgdGhhdCBpbnN0cnVjdGlvbiBmb3IgbW9zdCB1cGRhdGUgYmxvY2tzLlxuICAgICAgc2VsZWN0SW5kZXhJbnRlcm5hbCh0VmlldywgbFZpZXcsIDAsIGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbiAgICB9XG4gICAgdGVtcGxhdGVGbihyZiwgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChwcmV2U2VsZWN0ZWRJbmRleCk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gICAgZm9yIChsZXQgZGlyZWN0aXZlSW5kZXggPSBzdGFydDsgZGlyZWN0aXZlSW5kZXggPCBlbmQ7IGRpcmVjdGl2ZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlSW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi5jb250ZW50UXVlcmllcykge1xuICAgICAgICBkZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBsVmlld1tkaXJlY3RpdmVJbmRleF0sIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpKTtcbiAgaWYgKCh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSA9PT0gVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpIHtcbiAgICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsXG4gICAgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yID0gZ2V0TmF0aXZlQnlUTm9kZSk6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICBsZXQgbG9jYWxJbmRleCA9IHROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICAgIGxvY2FsUmVmRXh0cmFjdG9yKFxuICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgdmlld0RhdGEpIDpcbiAgICAgICAgICB2aWV3RGF0YVtpbmRleF07XG4gICAgICB2aWV3RGF0YVtsb2NhbEluZGV4KytdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUQ29tcG9uZW50VmlldyhkZWY6IENvbXBvbmVudERlZjxhbnk+KTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGRlZi50VmlldztcblxuICAvLyBDcmVhdGUgYSBUVmlldyBpZiB0aGVyZSBpc24ndCBvbmUsIG9yIHJlY3JlYXRlIGl0IGlmIHRoZSBmaXJzdCBjcmVhdGUgcGFzcyBkaWRuJ3RcbiAgLy8gY29tcGxldGUgc3VjY2Vzc2Z1bHkgc2luY2Ugd2UgY2FuJ3Qga25vdyBmb3Igc3VyZSB3aGV0aGVyIGl0J3MgaW4gYSB1c2FibGUgc2hhcGUuXG4gIGlmICh0VmlldyA9PT0gbnVsbCB8fCB0Vmlldy5pbmNvbXBsZXRlRmlyc3RQYXNzKSB7XG4gICAgcmV0dXJuIGRlZi50VmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICAgVFZpZXdUeXBlLkNvbXBvbmVudCwgLTEsIGRlZi50ZW1wbGF0ZSwgZGVmLmRlY2xzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgICAgICBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnksIGRlZi5zY2hlbWFzLCBkZWYuY29uc3RzKTtcbiAgfVxuXG4gIHJldHVybiB0Vmlldztcbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB2aWV3SW5kZXggVGhlIHZpZXdCbG9ja0lkIGZvciBpbmxpbmUgdmlld3MsIG9yIC0xIGlmIGl0J3MgYSBjb21wb25lbnQvZHluYW1pY1xuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb25cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gY29uc3RzIENvbnN0YW50cyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB0eXBlOiBUVmlld1R5cGUsIHZpZXdJbmRleDogbnVtYmVyLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fG51bGwsIGRlY2xzOiBudW1iZXIsXG4gICAgdmFyczogbnVtYmVyLCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICBjb25zdHM6IFRDb25zdGFudHN8bnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBkZWNscztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICByZXR1cm4gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSBuZ0Rldk1vZGUgP1xuICAgICAgbmV3IFRWaWV3Q29uc3RydWN0b3IoXG4gICAgICAgICAgICAgdHlwZSxcbiAgICAgICAgICAgICB2aWV3SW5kZXgsICAgLy8gaWQ6IG51bWJlcixcbiAgICAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAvLyBxdWVyaWVzOiBUUXVlcmllc3xudWxsXG4gICAgICAgICAgICAgdmlld1F1ZXJ5LCAgIC8vIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCxcbiAgICAgICAgICAgICBudWxsISwgICAgICAgLy8gbm9kZTogVFZpZXdOb2RlfFRFbGVtZW50Tm9kZXxudWxsLFxuICAgICAgICAgICAgIGNsb25lVG9UVmlld0RhdGEoYmx1ZXByaW50KS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSwgIC8vIGRhdGE6IFREYXRhLFxuICAgICAgICAgICAgIGJpbmRpbmdTdGFydEluZGV4LCAgLy8gYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICAgICBpbml0aWFsVmlld0xlbmd0aCwgIC8vIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBleHBhbmRvSW5zdHJ1Y3Rpb25zOiBFeHBhbmRvSW5zdHJ1Y3Rpb25zfG51bGwsXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAvLyBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgIC8vIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBkZXN0cm95SG9va3M6IERlc3Ryb3lIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6XG4gICAgICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICAgICBjb25zdHMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdHM6IFRDb25zdGFudHN8bnVsbFxuICAgICAgICAgICAgIGZhbHNlICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluY29tcGxldGVGaXJzdFBhc3M6IGJvb2xlYW5cbiAgICAgICAgICAgICApIDpcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgaWQ6IHZpZXdJbmRleCxcbiAgICAgICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgICAgICBxdWVyaWVzOiBudWxsLFxuICAgICAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICAgICAgbm9kZTogbnVsbCEsXG4gICAgICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLFxuICAgICAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICAgICAgZXhwYW5kb0luc3RydWN0aW9uczogbnVsbCxcbiAgICAgICAgZmlyc3RDcmVhdGVQYXNzOiB0cnVlLFxuICAgICAgICBmaXJzdFVwZGF0ZVBhc3M6IHRydWUsXG4gICAgICAgIHN0YXRpY1ZpZXdRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgc3RhdGljQ29udGVudFF1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBwcmVPcmRlckhvb2tzOiBudWxsLFxuICAgICAgICBwcmVPcmRlckNoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdIb29rczogbnVsbCxcbiAgICAgICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICAgICAgY2xlYW51cDogbnVsbCxcbiAgICAgICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgICAgICBmaXJzdENoaWxkOiBudWxsLFxuICAgICAgICBzY2hlbWFzOiBzY2hlbWFzLFxuICAgICAgICBjb25zdHM6IGNvbnN0cyxcbiAgICAgICAgaW5jb21wbGV0ZUZpcnN0UGFzczogZmFsc2VcbiAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmdEZXZNb2RlID8gbmV3IExWaWV3Qmx1ZXByaW50KCkgOiBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxWaWV3TGVuZ3RoOyBpKyspIHtcbiAgICBibHVlcHJpbnQucHVzaChpIDwgYmluZGluZ1N0YXJ0SW5kZXggPyBudWxsIDogTk9fQ0hBTkdFKTtcbiAgfVxuXG4gIHJldHVybiBibHVlcHJpbnQgYXMgTFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnlGb3JFcnJvcih0b2tlbil9XWApO1xufVxuXG5mdW5jdGlvbiBhc3NlcnRIb3N0Tm9kZUV4aXN0cyhyRWxlbWVudDogUkVsZW1lbnQsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudHxzdHJpbmcpIHtcbiAgaWYgKCFyRWxlbWVudCkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTG9jYXRlcyB0aGUgaG9zdCBuYXRpdmUgZWxlbWVudCwgdXNlZCBmb3IgYm9vdHN0cmFwcGluZyBleGlzdGluZyBub2RlcyBpbnRvIHJlbmRlcmluZyBwaXBlbGluZS5cbiAqXG4gKiBAcGFyYW0gcmVuZGVyZXJGYWN0b3J5IEZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIHJlbmRlcmVyIGluc3RhbmNlLlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gZW5jYXBzdWxhdGlvbiBWaWV3IEVuY2Fwc3VsYXRpb24gZGVmaW5lZCBmb3IgY29tcG9uZW50IHRoYXQgcmVxdWVzdHMgaG9zdCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyMywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50fHN0cmluZyxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbik6IFJFbGVtZW50IHtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIC8vIFdoZW4gdXNpbmcgbmF0aXZlIFNoYWRvdyBET00sIGRvIG5vdCBjbGVhciBob3N0IGVsZW1lbnQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvblxuICAgIGNvbnN0IHByZXNlcnZlQ29udGVudCA9IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgICByZXR1cm4gcmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IsIHByZXNlcnZlQ29udGVudCk7XG4gIH1cblxuICBsZXQgckVsZW1lbnQgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIHJlbmRlcmVyLnF1ZXJ5U2VsZWN0b3IoZWxlbWVudE9yU2VsZWN0b3IpISA6XG4gICAgICBlbGVtZW50T3JTZWxlY3RvcjtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEhvc3ROb2RlRXhpc3RzKHJFbGVtZW50LCBlbGVtZW50T3JTZWxlY3Rvcik7XG5cbiAgLy8gQWx3YXlzIGNsZWFyIGhvc3QgZWxlbWVudCdzIGNvbnRlbnQgd2hlbiBSZW5kZXJlcjMgaXMgaW4gdXNlLiBGb3IgcHJvY2VkdXJhbCByZW5kZXJlciBjYXNlIHdlXG4gIC8vIG1ha2UgaXQgZGVwZW5kIG9uIHdoZXRoZXIgU2hhZG93RG9tIGVuY2Fwc3VsYXRpb24gaXMgdXNlZCAoaW4gd2hpY2ggY2FzZSB0aGUgY29udGVudCBzaG91bGQgYmVcbiAgLy8gcHJlc2VydmVkIHRvIGFsbG93IG5hdGl2ZSBzbG90IHByb2plY3Rpb24pLiBTaGFkb3dEb20gZW5jYXBzdWxhdGlvbiByZXF1aXJlcyBwcm9jZWR1cmFsXG4gIC8vIHJlbmRlcmVyLCBhbmQgcHJvY2VkdXJhbCByZW5kZXJlciBjYXNlIGlzIGhhbmRsZWQgYWJvdmUuXG4gIHJFbGVtZW50LnRleHRDb250ZW50ID0gJyc7XG5cbiAgcmV0dXJuIHJFbGVtZW50O1xufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSwgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBjb25zdCBsQ2xlYW51cCA9IGdldExDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHRWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0TENsZWFudXAobFZpZXcpLnB1c2goY2xlYW51cEZuKTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHRWaWV3KS5wdXNoKGxWaWV3W0NMRUFOVVBdIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoaXMgYFROb2RlYCBiZWxvbmdzICh1c2VkIG9ubHkgaW4gYG5nRGV2TW9kZWApXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGFkanVzdGVkSW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZSwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICBsZXQgaW5qZWN0b3JJbmRleCA9IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMTtcbiAgcmV0dXJuIG5nRGV2TW9kZSA/IG5ldyBUTm9kZURlYnVnKFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRWaWV3LCAgICAgICAgICAvLyB0Vmlld186IFRWaWV3XG4gICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSwgICAgICAgICAgIC8vIHR5cGU6IFROb2RlVHlwZVxuICAgICAgICAgICAgICAgICAgICAgICAgIGFkanVzdGVkSW5kZXgsICAvLyBpbmRleDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3JJbmRleCwgIC8vIGluamVjdG9ySW5kZXg6IG51bWJlclxuICAgICAgICAgICAgICAgICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVTdGFydDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZUVuZDogbnVtYmVyXG4gICAgICAgICAgICAgICAgICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiBudW1iZXJcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBmbGFnczogVE5vZGVGbGFnc1xuICAgICAgICAgICAgICAgICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzXG4gICAgICAgICAgICAgICAgICAgICAgICAgdGFnTmFtZSwgICAgICAgIC8vIHRhZ05hbWU6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgYXR0cnMsICAvLyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgIC8vIG1lcmdlZEF0dHJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAvLyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gaW5pdGlhbElucHV0czogKHN0cmluZ1tdfG51bGwpW118bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gbmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICBudWxsLCAgICAgICAvLyBjaGlsZDogSVROb2RlfG51bGxcbiAgICAgICAgICAgICAgICAgICAgICAgICB0UGFyZW50LCAgICAvLyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgbnVsbCwgICAgICAgLy8gc3R5bGVzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIHVuZGVmaW5lZCwgIC8vIHJlc2lkdWFsU3R5bGVzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIG51bGwsICAgICAgIC8vIGNsYXNzZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgICAgICAgICAgICAgICAgdW5kZWZpbmVkLCAgLy8gcmVzaWR1YWxDbGFzc2VzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgICAgICAgICAgICAgICAgIDAgYXMgYW55LCAgIC8vIGNsYXNzQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgMCBhcyBhbnksICAgLy8gc3R5bGVCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICApIDpcbiAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgaW5kZXg6IGFkanVzdGVkSW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgIGluamVjdG9ySW5kZXg6IGluamVjdG9ySW5kZXgsXG4gICAgICAgICAgICAgICAgICAgICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICAgICAgICAgICAgICAgICAgICAgZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IC0xLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eUJpbmRpbmdzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBmbGFnczogMCxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgICAgICAgICAgICAgICAgICAgICB0YWdOYW1lOiB0YWdOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICBhdHRyczogYXR0cnMsXG4gICAgICAgICAgICAgICAgICAgICAgIG1lcmdlZEF0dHJzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgICAgICAgICAgICAgICAgICAgIGlucHV0czogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgdFZpZXdzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICBwcm9qZWN0aW9uTmV4dDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2hpbGQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgIHBhcmVudDogdFBhcmVudCxcbiAgICAgICAgICAgICAgICAgICAgICAgcHJvamVjdGlvbjogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgc3R5bGVzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgICAgICAgICAgICAgICAgICAgICBjbGFzc2VzOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICByZXNpZHVhbENsYXNzZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NCaW5kaW5nczogMCBhcyBhbnksXG4gICAgICAgICAgICAgICAgICAgICAgIHN0eWxlQmluZGluZ3M6IDAgYXMgYW55LFxuICAgICAgICAgICAgICAgICAgICAgfTtcbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBpbnB1dEFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyLFxuICAgIHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGZvciAobGV0IHB1YmxpY05hbWUgaW4gaW5wdXRBbGlhc01hcCkge1xuICAgIGlmIChpbnB1dEFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgPT09IG51bGwgPyB7fSA6IHByb3BTdG9yZTtcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGlucHV0QWxpYXNNYXBbcHVibGljTmFtZV07XG5cbiAgICAgIGlmIChwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlRGVmSWR4LCBpbnRlcm5hbE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGRhdGEgc3RydWN0dXJlcyByZXF1aXJlZCB0byB3b3JrIHdpdGggZGlyZWN0aXZlIG91dHB1dHMgYW5kIG91dHB1dHMuXG4gKiBJbml0aWFsaXphdGlvbiBpcyBkb25lIGZvciBhbGwgZGlyZWN0aXZlcyBtYXRjaGVkIG9uIGEgZ2l2ZW4gVE5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICBjb25zdCB0Tm9kZUF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGNvbnN0IGlucHV0c0Zyb21BdHRyczogSW5pdGlhbElucHV0RGF0YSA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUluaXRpYWxJbnB1dHMoKSA6IFtdO1xuICBsZXQgaW5wdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgbGV0IG91dHB1dHNTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlSW5wdXRzID0gZGlyZWN0aXZlRGVmLmlucHV0cztcbiAgICAvLyBEbyBub3QgdXNlIHVuYm91bmQgYXR0cmlidXRlcyBhcyBpbnB1dHMgdG8gc3RydWN0dXJhbCBkaXJlY3RpdmVzLCBzaW5jZSBzdHJ1Y3R1cmFsXG4gICAgLy8gZGlyZWN0aXZlIGlucHV0cyBjYW4gb25seSBiZSBzZXQgdXNpbmcgbWljcm9zeW50YXggKGUuZy4gYDxkaXYgKmRpcj1cImV4cFwiPmApLlxuICAgIC8vIFRPRE8oRlctMTkzMCk6IG1pY3Jvc3ludGF4IGV4cHJlc3Npb25zIG1heSBhbHNvIGNvbnRhaW4gdW5ib3VuZC9zdGF0aWMgYXR0cmlidXRlcywgd2hpY2hcbiAgICAvLyBzaG91bGQgYmUgc2V0IGZvciBpbmxpbmUgdGVtcGxhdGVzLlxuICAgIGNvbnN0IGluaXRpYWxJbnB1dHMgPSAodE5vZGVBdHRycyAhPT0gbnVsbCAmJiAhaXNJbmxpbmVUZW1wbGF0ZSh0Tm9kZSkpID9cbiAgICAgICAgZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUlucHV0cywgdE5vZGVBdHRycykgOlxuICAgICAgICBudWxsO1xuICAgIGlucHV0c0Zyb21BdHRycy5wdXNoKGluaXRpYWxJbnB1dHMpO1xuICAgIGlucHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlSW5wdXRzLCBpLCBpbnB1dHNTdG9yZSk7XG4gICAgb3V0cHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlRGVmLm91dHB1dHMsIGksIG91dHB1dHNTdG9yZSk7XG4gIH1cblxuICBpZiAoaW5wdXRzU3RvcmUgIT09IG51bGwpIHtcbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgdE5vZGUuaW5pdGlhbElucHV0cyA9IGlucHV0c0Zyb21BdHRycztcbiAgdE5vZGUuaW5wdXRzID0gaW5wdXRzU3RvcmU7XG4gIHROb2RlLm91dHB1dHMgPSBvdXRwdXRzU3RvcmU7XG59XG5cbi8qKlxuICogTWFwcGluZyBiZXR3ZWVuIGF0dHJpYnV0ZXMgbmFtZXMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIHRoZWlyIGVsZW1lbnQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogUGVyZm9ybWFuY2Ugbm90ZTogdGhpcyBmdW5jdGlvbiBpcyB3cml0dGVuIGFzIGEgc2VyaWVzIG9mIGlmIGNoZWNrcyAoaW5zdGVhZCBvZiwgc2F5LCBhIHByb3BlcnR5XG4gKiBvYmplY3QgbG9va3VwKSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAtIHRoZSBzZXJpZXMgb2YgYGlmYCBjaGVja3Mgc2VlbXMgdG8gYmUgdGhlIGZhc3Rlc3Qgd2F5IG9mXG4gKiBtYXBwaW5nIHByb3BlcnR5IG5hbWVzLiBEbyBOT1QgY2hhbmdlIHdpdGhvdXQgYmVuY2htYXJraW5nLlxuICpcbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5mdW5jdGlvbiBtYXBQcm9wTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZSA9PT0gJ2NsYXNzJykgcmV0dXJuICdjbGFzc05hbWUnO1xuICBpZiAobmFtZSA9PT0gJ2ZvcicpIHJldHVybiAnaHRtbEZvcic7XG4gIGlmIChuYW1lID09PSAnZm9ybWFjdGlvbicpIHJldHVybiAnZm9ybUFjdGlvbic7XG4gIGlmIChuYW1lID09PSAnaW5uZXJIdG1sJykgcmV0dXJuICdpbm5lckhUTUwnO1xuICBpZiAobmFtZSA9PT0gJ3JlYWRvbmx5JykgcmV0dXJuICdyZWFkT25seSc7XG4gIGlmIChuYW1lID09PSAndGFiaW5kZXgnKSByZXR1cm4gJ3RhYkluZGV4JztcbiAgcmV0dXJuIG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI6IFNhbml0aXplckZufG51bGx8dW5kZWZpbmVkLCBuYXRpdmVPbmx5OiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBsZXQgaW5wdXREYXRhID0gdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoIW5hdGl2ZU9ubHkgJiYgaW5wdXREYXRhICE9IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkodFZpZXcsIGxWaWV3LCBkYXRhVmFsdWUsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCB0Tm9kZS5pbmRleCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCF2YWxpZGF0ZVByb3BlcnR5KHRWaWV3LCBsVmlldywgZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlKSkge1xuICAgICAgICAvLyBSZXR1cm4gaGVyZSBzaW5jZSB3ZSBvbmx5IGxvZyB3YXJuaW5ncyBmb3IgdW5rbm93biBwcm9wZXJ0aWVzLlxuICAgICAgICB3YXJuQWJvdXRVbmtub3duUHJvcGVydHkocHJvcE5hbWUsIHROb2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICB9XG5cbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eSBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKCFpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0UHJvcGVydHkgPyAoZWxlbWVudCBhcyBhbnkpLnNldFByb3BlcnR5KHByb3BOYW1lLCB2YWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVsZW1lbnQgYXMgYW55KVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIElmIHRoZSBub2RlIGlzIGEgY29udGFpbmVyIGFuZCB0aGUgcHJvcGVydHkgZGlkbid0XG4gICAgLy8gbWF0Y2ggYW55IG9mIHRoZSBpbnB1dHMgb3Igc2NoZW1hcyB3ZSBzaG91bGQgdGhyb3cuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhbWF0Y2hpbmdTY2hlbWFzKHRWaWV3LCBsVmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICAgIHdhcm5BYm91dFVua25vd25Qcm9wZXJ0eShwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgYXR0ck5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGF0dHJOYW1lKTtcbiAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgaWYgKHR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSkgOlxuICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRlYnVnVmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0ZXh0Q29udGVudCA9IGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YDtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHRleHRDb250ZW50KTtcbiAgICB9IGVsc2Uge1xuICAgICAgKGVsZW1lbnQgYXMgUkNvbW1lbnQpLnRleHRDb250ZW50ID0gdGV4dENvbnRlbnQ7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgfHwgdHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8qKlxuICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICAgICAqIGkrMTogcHJpdmF0ZU5hbWVcbiAgICAgKlxuICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsxXVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdHlwZSwgZGF0YVZhbHVlW2kgKyAxXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVQcm9wZXJ0eShcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsXG4gICAgdE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHRWaWV3LnNjaGVtYXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50XG4gIC8vIG9yIGl0IGlzIHN5bnRoZXRpYywgYW5kIHdlIGFyZSBpbiBhIGJyb3dzZXIgY29udGV4dCAod2ViIHdvcmtlciBub2RlcyBzaG91bGQgYmUgc2tpcHBlZCkuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXModFZpZXcsIGxWaWV3LCB0Tm9kZS50YWdOYW1lKSB8fCBwcm9wTmFtZSBpbiBlbGVtZW50IHx8XG4gICAgICBpc0FuaW1hdGlvblByb3AocHJvcE5hbWUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICAvLyBOb3RlOiBgdHlwZW9mIE5vZGVgIHJldHVybnMgJ2Z1bmN0aW9uJyBpbiBtb3N0IGJyb3dzZXJzLCBidXQgb24gSUUgaXQgaXMgJ29iamVjdCcgc28gd2VcbiAgLy8gbmVlZCB0byBhY2NvdW50IGZvciBib3RoIGhlcmUsIHdoaWxlIGJlaW5nIGNhcmVmdWwgZm9yIGB0eXBlb2YgbnVsbGAgYWxzbyByZXR1cm5pbmcgJ29iamVjdCcuXG4gIHJldHVybiB0eXBlb2YgTm9kZSA9PT0gJ3VuZGVmaW5lZCcgfHwgTm9kZSA9PT0gbnVsbCB8fCAhKGVsZW1lbnQgaW5zdGFuY2VvZiBOb2RlKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGFnTmFtZTogc3RyaW5nfG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IHRWaWV3LnNjaGVtYXM7XG5cbiAgaWYgKHNjaGVtYXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVtYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHNjaGVtYXNbaV07XG4gICAgICBpZiAoc2NoZW1hID09PSBOT19FUlJPUlNfU0NIRU1BIHx8XG4gICAgICAgICAgc2NoZW1hID09PSBDVVNUT01fRUxFTUVOVFNfU0NIRU1BICYmIHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogTG9ncyBhIHdhcm5pbmcgdGhhdCBhIHByb3BlcnR5IGlzIG5vdCBzdXBwb3J0ZWQgb24gYW4gZWxlbWVudC5cbiAqIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHRoZSBpbnZhbGlkIHByb3BlcnR5LlxuICogQHBhcmFtIHROb2RlIE5vZGUgb24gd2hpY2ggd2UgZW5jb3VudGVyZWQgdGhlIHByb3BlcnR5LlxuICovXG5mdW5jdGlvbiB3YXJuQWJvdXRVbmtub3duUHJvcGVydHkocHJvcE5hbWU6IHN0cmluZywgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGNvbnNvbGUud2FybihcbiAgICAgIGBDYW4ndCBiaW5kIHRvICcke3Byb3BOYW1lfScgc2luY2UgaXQgaXNuJ3QgYSBrbm93biBwcm9wZXJ0eSBvZiAnJHt0Tm9kZS50YWdOYW1lfScuYCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbnRpYXRlUm9vdENvbXBvbmVudDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCBsVmlldywgZGVmKTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGxWaWV3Lmxlbmd0aCAtIDEsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocm9vdFROb2RlLCBsVmlldyk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCk6IGJvb2xlYW4ge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBsZXQgaGFzRGlyZWN0aXZlcyA9IGZhbHNlO1xuICBpZiAoZ2V0QmluZGluZ3NFbmFibGVkKCkpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwgPSBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmcyAhPT0gbnVsbCkge1xuICAgICAgbGV0IHRvdGFsRGlyZWN0aXZlSG9zdFZhcnMgPSAwO1xuICAgICAgaGFzRGlyZWN0aXZlcyA9IHRydWU7XG4gICAgICBpbml0VE5vZGVGbGFncyh0Tm9kZSwgdFZpZXcuZGF0YS5sZW5ndGgsIGRpcmVjdGl2ZURlZnMubGVuZ3RoKTtcbiAgICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAgIC8vIHRoZSB2aWV3RW5naW5lOlxuICAgICAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAvLyBTbyB0byBtYXRjaCB0aGVzZSBydWxlcywgdGhlIG9yZGVyIGluIHdoaWNoIHByb3ZpZGVycyBhcmUgYWRkZWQgaW4gdGhlIGFycmF5cyBpcyB2ZXJ5XG4gICAgICAvLyBpbXBvcnRhbnQuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZURlZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlRGVmc1tpXTtcbiAgICAgICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgICB9XG4gICAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlRGVmcy5sZW5ndGgpO1xuICAgICAgbGV0IHByZU9yZGVySG9va3NGb3VuZCA9IGZhbHNlO1xuICAgICAgbGV0IHByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZURlZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlRGVmc1tpXTtcbiAgICAgICAgLy8gTWVyZ2UgdGhlIGF0dHJzIGluIHRoZSBvcmRlciBvZiBtYXRjaGVzLiBUaGlzIGFzc3VtZXMgdGhhdCB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgaXRzZWxmLCBzbyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIHRoZSBsZWFzdCBwcmlvcml0eS5cbiAgICAgICAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgZGVmLmhvc3RBdHRycyk7XG5cbiAgICAgICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIGxWaWV3LCBkZWYpO1xuXG4gICAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAodFZpZXcuZGF0YSEubGVuZ3RoIC0gMSwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgICAgICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDApXG4gICAgICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3M7XG5cbiAgICAgICAgLy8gT25seSBwdXNoIGEgbm9kZSBpbmRleCBpbnRvIHRoZSBwcmVPcmRlckhvb2tzIGFycmF5IGlmIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgICAgIC8vIHByZS1vcmRlciBob29rIGZvdW5kIG9uIHRoaXMgbm9kZS5cbiAgICAgICAgaWYgKCFwcmVPcmRlckhvb2tzRm91bmQgJiYgKGRlZi5vbkNoYW5nZXMgfHwgZGVmLm9uSW5pdCB8fCBkZWYuZG9DaGVjaykpIHtcbiAgICAgICAgICAvLyBXZSB3aWxsIHB1c2ggdGhlIGFjdHVhbCBob29rIGZ1bmN0aW9uIGludG8gdGhpcyBhcnJheSBsYXRlciBkdXJpbmcgZGlyIGluc3RhbnRpYXRpb24uXG4gICAgICAgICAgLy8gV2UgY2Fubm90IGRvIGl0IG5vdyBiZWNhdXNlIHdlIG11c3QgZW5zdXJlIGhvb2tzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBzYW1lXG4gICAgICAgICAgLy8gb3JkZXIgdGhhdCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkIChpLmUuIGluamVjdGlvbiBvcmRlcikuXG4gICAgICAgICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2godE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgICAgICAgICBwcmVPcmRlckhvb2tzRm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAoZGVmLm9uQ2hhbmdlcyB8fCBkZWYuZG9DaGVjaykpIHtcbiAgICAgICAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgPSBbXSkpXG4gICAgICAgICAgICAgIC5wdXNoKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gICAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgYWRkSG9zdEJpbmRpbmdzVG9FeHBhbmRvSW5zdHJ1Y3Rpb25zKHRWaWV3LCBkZWYpO1xuICAgICAgICB0b3RhbERpcmVjdGl2ZUhvc3RWYXJzICs9IGRlZi5ob3N0VmFycztcbiAgICAgIH1cblxuICAgICAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldywgdE5vZGUpO1xuICAgICAgZ3Jvd0hvc3RWYXJzU3BhY2UodFZpZXcsIGxWaWV3LCB0b3RhbERpcmVjdGl2ZUhvc3RWYXJzKTtcbiAgICB9XG4gICAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xuICB9XG4gIC8vIE1lcmdlIHRoZSB0ZW1wbGF0ZSBhdHRycyBsYXN0IHNvIHRoYXQgdGhleSBoYXZlIHRoZSBoaWdoZXN0IHByaW9yaXR5LlxuICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCB0Tm9kZS5hdHRycyk7XG4gIHJldHVybiBoYXNEaXJlY3RpdmVzO1xufVxuXG4vKipcbiAqIEFkZCBgaG9zdEJpbmRpbmdzYCB0byB0aGUgYFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoZSBgaG9zdEJpbmRpbmdzYCBzaG91bGQgYmUgYWRkZWQuXG4gKiBAcGFyYW0gZGVmIGBDb21wb25lbnREZWZgL2BEaXJlY3RpdmVEZWZgLCB3aGljaCBjb250YWlucyB0aGUgYGhvc3RWYXJzYC9gaG9zdEJpbmRpbmdzYCB0byBhZGQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRIb3N0QmluZGluZ3NUb0V4cGFuZG9JbnN0cnVjdGlvbnMoXG4gICAgdFZpZXc6IFRWaWV3LCBkZWY6IENvbXBvbmVudERlZjxhbnk+fERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyE7XG4gIC8vIFRPRE8obWlza28pOiBQRVJGIHdlIGFyZSBhZGRpbmcgYGhvc3RCaW5kaW5nc2AgZXZlbiBpZiB0aGVyZSBpcyBub3RoaW5nIHRvIGFkZCEgVGhpcyBpc1xuICAvLyBzdWJvcHRpbWFsIGZvciBwZXJmb3JtYW5jZS4gYGRlZi5ob3N0QmluZGluZ3NgIG1heSBiZSBudWxsLFxuICAvLyBidXQgd2Ugc3RpbGwgbmVlZCB0byBwdXNoIG51bGwgdG8gdGhlIGFycmF5IGFzIGEgcGxhY2Vob2xkZXJcbiAgLy8gdG8gZW5zdXJlIHRoZSBkaXJlY3RpdmUgY291bnRlciBpcyBpbmNyZW1lbnRlZCAoc28gaG9zdFxuICAvLyBiaW5kaW5nIGZ1bmN0aW9ucyBhbHdheXMgbGluZSB1cCB3aXRoIHRoZSBjb3JyZWN0aXZlIGRpcmVjdGl2ZSkuXG4gIC8vIFRoaXMgaXMgc3Vib3B0aW1hbCBmb3IgcGVyZm9ybWFuY2UuIFNlZSBgY3VycmVudERpcmVjdGl2ZUluZGV4YFxuICAvLyAgY29tbWVudCBpbiBgc2V0SG9zdEJpbmRpbmdzQnlFeGVjdXRpbmdFeHBhbmRvSW5zdHJ1Y3Rpb25zYCBmb3IgbW9yZVxuICAvLyBkZXRhaWxzLiAgZXhwYW5kby5wdXNoKGRlZi5ob3N0QmluZGluZ3MpO1xuICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyk7XG4gIGNvbnN0IGhvc3RWYXJzID0gZGVmLmhvc3RWYXJzO1xuICBpZiAoaG9zdFZhcnMgIT09IDApIHtcbiAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RWYXJzKTtcbiAgfVxufVxuXG4vKipcbiAqIEdyb3cgdGhlIGBMVmlld2AsIGJsdWVwcmludCBhbmQgYFRWaWV3LmRhdGFgIHRvIGFjY29tbW9kYXRlIHRoZSBgaG9zdEJpbmRpbmdzYC5cbiAqXG4gKiBUbyBzdXBwb3J0IGxvY2FsaXR5IHdlIGRvbid0IGtub3cgYWhlYWQgb2YgdGltZSBob3cgbWFueSBgaG9zdFZhcnNgIG9mIHRoZSBjb250YWluaW5nIGRpcmVjdGl2ZXNcbiAqIHdlIG5lZWQgdG8gYWxsb2NhdGUuIEZvciB0aGlzIHJlYXNvbiB3ZSBhbGxvdyBncm93aW5nIHRoZXNlIGRhdGEgc3RydWN0dXJlcyBhcyB3ZSBkaXNjb3ZlciBtb3JlXG4gKiBkaXJlY3RpdmVzIHRvIGFjY29tbW9kYXRlIHRoZW0uXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2Agd2hpY2ggbmVlZHMgdG8gYmUgZ3Jvd24uXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YCB3aGljaCBuZWVkcyB0byBiZSBncm93bi5cbiAqIEBwYXJhbSBjb3VudCBTaXplIGJ5IHdoaWNoIHdlIG5lZWQgdG8gZ3JvdyB0aGUgZGF0YSBzdHJ1Y3R1cmVzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ3Jvd0hvc3RWYXJzU3BhY2UodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvdW50OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTYW1lKHRWaWV3LCBsVmlld1tUVklFV10sICdgTFZpZXdgIG11c3QgYmUgYXNzb2NpYXRlZCB3aXRoIGBUVmlld2AhJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY291bnQ7IGkrKykge1xuICAgIGxWaWV3LnB1c2goTk9fQ0hBTkdFKTtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChOT19DSEFOR0UpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgfVxufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsIG5hdGl2ZTogUk5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIXRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHMgPSB0Tm9kZS5pbml0aWFsSW5wdXRzO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudERlZihkZWYpO1xuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgYWRkQ29tcG9uZW50TG9naWMobFZpZXcsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSwgZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGksIHROb2RlKTtcbiAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG5cbiAgICBpZiAoaW5pdGlhbElucHV0cyAhPT0gbnVsbCkge1xuICAgICAgc2V0SW5wdXRzRnJvbUF0dHJzKGxWaWV3LCBpIC0gc3RhcnQsIGRpcmVjdGl2ZSwgZGVmLCB0Tm9kZSwgaW5pdGlhbElucHV0cyEpO1xuICAgIH1cblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgZXhwYW5kbyA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMhO1xuICBjb25zdCBmaXJzdENyZWF0ZVBhc3MgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgY29uc3QgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleChlbGVtZW50SW5kZXgpO1xuICAgIGZvciAobGV0IGRpckluZGV4ID0gc3RhcnQ7IGRpckluZGV4IDwgZW5kOyBkaXJJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpckluZGV4XSBhcyBEaXJlY3RpdmVEZWY8dW5rbm93bj47XG4gICAgICBjb25zdCBkaXJlY3RpdmUgPSBsVmlld1tkaXJJbmRleF07XG4gICAgICBzZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoZGlySW5kZXgpO1xuICAgICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RWYXJzICE9PSAwIHx8IGRlZi5ob3N0QXR0cnMgIT09IG51bGwpIHtcbiAgICAgICAgaW52b2tlSG9zdEJpbmRpbmdzSW5DcmVhdGlvbk1vZGUoZGVmLCBkaXJlY3RpdmUpO1xuICAgICAgfSBlbHNlIGlmIChmaXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgICAgZXhwYW5kby5wdXNoKG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgICBzZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoY3VycmVudERpcmVjdGl2ZUluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIEludm9rZSB0aGUgaG9zdCBiaW5kaW5ncyBpbiBjcmVhdGlvbiBtb2RlLlxuICpcbiAqIEBwYXJhbSBkZWYgYERpcmVjdGl2ZURlZmAgd2hpY2ggbWF5IGNvbnRhaW4gdGhlIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uLlxuICogQHBhcmFtIGRpcmVjdGl2ZSBJbnN0YW5jZSBvZiBkaXJlY3RpdmUuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWY6IERpcmVjdGl2ZURlZjxhbnk+LCBkaXJlY3RpdmU6IGFueSkge1xuICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCkge1xuICAgIGRlZi5ob3N0QmluZGluZ3MhKFJlbmRlckZsYWdzLkNyZWF0ZSwgZGlyZWN0aXZlKTtcbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBhIG5ldyBibG9jayBpbiBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIGZvciB0aGlzIG5vZGUuXG4gKlxuICogRWFjaCBleHBhbmRvIGJsb2NrIHN0YXJ0cyB3aXRoIHRoZSBlbGVtZW50IGluZGV4ICh0dXJuZWQgbmVnYXRpdmUgc28gd2UgY2FuIGRpc3Rpbmd1aXNoXG4gKiBpdCBmcm9tIHRoZSBob3N0VmFyIGNvdW50KSBhbmQgdGhlIGRpcmVjdGl2ZSBjb3VudC4gU2VlIG1vcmUgaW4gVklFV19EQVRBLm1kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlQ291bnQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHRWaWV3LmZpcnN0Q3JlYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgY3JlYXRlIHBhc3MuJyk7XG5cbiAgLy8gSW1wb3J0YW50OiBJbiBKUyBgLXhgIGFuZCBgMC14YCBpcyBub3QgdGhlIHNhbWUhIElmIGB4PT09MGAgdGhlbiBgLXhgIHdpbGwgcHJvZHVjZSBgLTBgIHdoaWNoXG4gIC8vIHJlcXVpcmVzIG5vbiBzdGFuZGFyZCBtYXRoIGFyaXRobWV0aWMgYW5kIGl0IGNhbiBwcmV2ZW50IFZNIG9wdGltaXphdGlvbnMuXG4gIC8vIGAwLTBgIHdpbGwgYWx3YXlzIHByb2R1Y2UgYDBgIGFuZCB3aWxsIG5vdCBjYXVzZSBhIHBvdGVudGlhbCBkZW9wdGltaXphdGlvbiBpbiBWTS5cbiAgY29uc3QgZWxlbWVudEluZGV4ID0gSEVBREVSX09GRlNFVCAtIHROb2RlLmluZGV4O1xuICBjb25zdCBwcm92aWRlclN0YXJ0SW5kZXggPSB0Tm9kZS5wcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgcHJvdmlkZXJDb3VudCA9IHRWaWV3LmRhdGEubGVuZ3RoIC0gcHJvdmlkZXJTdGFydEluZGV4O1xuICAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyB8fCAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyA9IFtdKSlcbiAgICAgIC5wdXNoKGVsZW1lbnRJbmRleCwgcHJvdmlkZXJDb3VudCwgZGlyZWN0aXZlQ291bnQpO1xufVxuXG4vKipcbiAqIE1hdGNoZXMgdGhlIGN1cnJlbnQgbm9kZSBhZ2FpbnN0IGFsbCBhdmFpbGFibGUgc2VsZWN0b3JzLlxuICogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4gKi9cbmZ1bmN0aW9uIGZpbmREaXJlY3RpdmVEZWZNYXRjaGVzKFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LFxuICAgIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXSBhcyBDb21wb25lbnREZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMhLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIGZhbHNlKSkge1xuICAgICAgICBtYXRjaGVzIHx8IChtYXRjaGVzID0gbmdEZXZNb2RlID8gbmV3IE1hdGNoZXNBcnJheSgpIDogW10pO1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCB2aWV3RGF0YSksIHRWaWV3LCBkZWYudHlwZSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSk7XG4gICAgICAgICAgLy8gVGhlIGNvbXBvbmVudCBpcyBhbHdheXMgc3RvcmVkIGZpcnN0IHdpdGggZGlyZWN0aXZlcyBhZnRlci5cbiAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoZGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcztcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGdpdmVuIFROb2RlIGFzIGEgY29tcG9uZW50J3MgaG9zdC4gVGhpcyBjb25zaXN0cyBvZjpcbiAqIC0gc2V0dGluZyBhcHByb3ByaWF0ZSBUTm9kZSBmbGFncztcbiAqIC0gc3RvcmluZyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgaG9zdFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0O1xuICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IG5nRGV2TW9kZSA/IG5ldyBUVmlld0NvbXBvbmVudHMoKSA6IFtdKSlcbiAgICAgIC5wdXNoKGhvc3RUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVMb2NhbE5hbWVzKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkgZXhwb3J0c01hcFsnJ10gPSBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIHRoZSBmbGFncyBvbiB0aGUgY3VycmVudCBub2RlLCBzZXR0aW5nIGFsbCBpbmRpY2VzIHRvIHRoZSBpbml0aWFsIGluZGV4LFxuICogdGhlIGRpcmVjdGl2ZSBjb3VudCB0byAwLCBhbmQgYWRkaW5nIHRoZSBpc0NvbXBvbmVudCBmbGFnLlxuICogQHBhcmFtIGluZGV4IHRoZSBpbml0aWFsIGluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0VE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0O1xuICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZCBvbiBhIG5vZGUsIHNhdmUgdGhlIGluZGV4XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4odFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KSB7XG4gIHRWaWV3LmRhdGEucHVzaChkZWYpO1xuICBjb25zdCBkaXJlY3RpdmVGYWN0b3J5ID1cbiAgICAgIGRlZi5mYWN0b3J5IHx8ICgoZGVmIGFzIHtmYWN0b3J5OiBGdW5jdGlvbn0pLmZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmKGRlZi50eXBlLCB0cnVlKSk7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBudWxsKTtcbiAgdFZpZXcuYmx1ZXByaW50LnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG4gIHZpZXdEYXRhLnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVUQ29tcG9uZW50VmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldyxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBuYXRpdmUsXG4gICAgICAgICAgaG9zdFROb2RlIGFzIFRFbGVtZW50Tm9kZSwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpKSk7XG5cbiAgLy8gQ29tcG9uZW50IHZpZXcgd2lsbCBhbHdheXMgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGluamVjdGVkIExDb250YWluZXJzLFxuICAvLyBzbyB0aGlzIGlzIGEgcmVndWxhciBlbGVtZW50LCB3cmFwIGl0IHdpdGggdGhlIGNvbXBvbmVudCB2aWV3XG4gIGxWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsXG4gICAgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICBjb25zdCBzdHJWYWx1ZSA9XG4gICAgICAgIHNhbml0aXplciA9PSBudWxsID8gcmVuZGVyU3RyaW5naWZ5KHZhbHVlKSA6IHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgbmFtZSk7XG5cblxuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBzdHJWYWx1ZSwgbmFtZXNwYWNlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmFtZXNwYWNlID8gZWxlbWVudC5zZXRBdHRyaWJ1dGVOUyhuYW1lc3BhY2UsIG5hbWUsIHN0clZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCBzdHJWYWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhIVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgaWYgKHNldElucHV0ICE9PSBudWxsKSB7XG4gICAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIG5hdGl2ZUVsZW1lbnQsIHROb2RlLnR5cGUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIGF0dHJzIFRoZSBzdGF0aWMgYXR0cnMgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCBhdHRyczogVEF0dHJpYnV0ZXMpOiBJbml0aWFsSW5wdXRzfFxuICAgIG51bGwge1xuICBsZXQgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0c3xudWxsID0gbnVsbDtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpIHtcbiAgICAgIC8vIFNraXAgb3ZlciB0aGUgYG5nUHJvamVjdEFzYCB2YWx1ZS5cbiAgICAgIGkgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGhpdCBhbnkgb3RoZXIgYXR0cmlidXRlIG1hcmtlcnMsIHdlJ3JlIGRvbmUgYW55d2F5LiBOb25lIG9mIHRob3NlIGFyZSB2YWxpZCBpbnB1dHMuXG4gICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PT0gJ251bWJlcicpIGJyZWFrO1xuXG4gICAgaWYgKGlucHV0cy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSBhcyBzdHJpbmcpKSB7XG4gICAgICBpZiAoaW5wdXRzVG9TdG9yZSA9PT0gbnVsbCkgaW5wdXRzVG9TdG9yZSA9IFtdO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKGF0dHJOYW1lIGFzIHN0cmluZywgaW5wdXRzW2F0dHJOYW1lIGFzIHN0cmluZ10sIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmcpO1xuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5wdXRzVG9TdG9yZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIE5vdCBzdXJlIHdoeSBJIG5lZWQgdG8gZG8gYGFueWAgaGVyZSBidXQgVFMgY29tcGxhaW5zIGxhdGVyLlxuY29uc3QgTENvbnRhaW5lckFycmF5OiBhbnkgPSAoKHR5cGVvZiBuZ0Rldk1vZGUgPT09ICd1bmRlZmluZWQnIHx8IG5nRGV2TW9kZSkgJiYgaW5pdE5nRGV2TW9kZSgpKSAmJlxuICAgIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ29udGFpbmVyJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50fFJDb21tZW50fExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiAhaXNQcm9jZWR1cmFsUmVuZGVyZXIoY3VycmVudFZpZXdbUkVOREVSRVJdKSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZSk7XG4gIC8vIGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS1saXRlcmFsLXZzLW5ldy1hcnJheS1yZWFsbHlcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IG5ldyAobmdEZXZNb2RlID8gTENvbnRhaW5lckFycmF5IDogQXJyYXkpKFxuICAgICAgaG9zdE5hdGl2ZSwgIC8vIGhvc3QgbmF0aXZlXG4gICAgICB0cnVlLCAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgICAgQWN0aXZlSW5kZXhGbGFnLkRZTkFNSUNfRU1CRURERURfVklFV1NfT05MWSA8PCBBY3RpdmVJbmRleEZsYWcuU0hJRlQsICAvLyBhY3RpdmUgaW5kZXhcbiAgICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcGFyZW50XG4gICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcXVlcmllc1xuICAgICAgdE5vZGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0X2hvc3RcbiAgICAgIG5hdGl2ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlLFxuICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgKTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKTtcbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzXG4gKiB0aGVtIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGxldCB2aWV3T3JDb250YWluZXIgPSBsVmlld1tDSElMRF9IRUFEXTtcbiAgd2hpbGUgKHZpZXdPckNvbnRhaW5lciAhPT0gbnVsbCkge1xuICAgIC8vIE5vdGU6IHZpZXdPckNvbnRhaW5lciBjYW4gYmUgYW4gTFZpZXcgb3IgYW4gTENvbnRhaW5lciBpbnN0YW5jZSwgYnV0IGhlcmUgd2UgYXJlIG9ubHlcbiAgICAvLyBpbnRlcmVzdGVkIGluIExDb250YWluZXJcbiAgICBsZXQgYWN0aXZlSW5kZXhGbGFnOiBBY3RpdmVJbmRleEZsYWc7XG4gICAgaWYgKGlzTENvbnRhaW5lcih2aWV3T3JDb250YWluZXIpICYmXG4gICAgICAgIChhY3RpdmVJbmRleEZsYWcgPSB2aWV3T3JDb250YWluZXJbQUNUSVZFX0lOREVYXSkgPj4gQWN0aXZlSW5kZXhGbGFnLlNISUZUID09PVxuICAgICAgICAgICAgQWN0aXZlSW5kZXhGbGFnLkRZTkFNSUNfRU1CRURERURfVklFV1NfT05MWSkge1xuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgdmlld09yQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSB2aWV3T3JDb250YWluZXJbaV0gYXMgTFZpZXc7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSBlbWJlZGRlZExWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGVtYmVkZGVkTFZpZXcpKSB7XG4gICAgICAgICAgcmVmcmVzaFZpZXcoXG4gICAgICAgICAgICAgIGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0hKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKChhY3RpdmVJbmRleEZsYWcgJiBBY3RpdmVJbmRleEZsYWcuSEFTX1RSQU5TUExBTlRFRF9WSUVXUykgIT09IDApIHtcbiAgICAgICAgLy8gV2Ugc2hvdWxkIG9ubHkgQ0QgbW92ZWQgdmlld3MgaWYgdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgaW5zZXJ0ZWQgZG9lcyBub3QgbWF0Y2hcbiAgICAgICAgLy8gdGhlIGNvbXBvbmVudCB3aGVyZSB0aGV5IHdlcmUgZGVjbGFyZWQgYW5kIGluc2VydGlvbiBpcyBvbi1wdXNoLiBNb3ZlZCB2aWV3cyBhbHNvXG4gICAgICAgIC8vIGNvbnRhaW5zIGludHJhIGNvbXBvbmVudCBtb3Zlcywgb3IgY2hlY2stYWx3YXlzIHdoaWNoIG5lZWQgdG8gYmUgc2tpcHBlZC5cbiAgICAgICAgcmVmcmVzaFRyYW5zcGxhbnRlZFZpZXdzKHZpZXdPckNvbnRhaW5lciwgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddISk7XG4gICAgICB9XG4gICAgfVxuICAgIHZpZXdPckNvbnRhaW5lciA9IHZpZXdPckNvbnRhaW5lcltORVhUXTtcbiAgfVxufVxuXG5cbi8qKlxuICogUmVmcmVzaCB0cmFuc3BsYW50ZWQgTFZpZXdzLlxuICpcbiAqIFNlZTogYEFjdGl2ZUluZGV4RmxhZy5IQVNfVFJBTlNQTEFOVEVEX1ZJRVdTYCBhbmQgYExWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXWAgZm9yXG4gKiBleHBsYW5hdGlvbiBvZiB0cmFuc3BsYW50ZWQgdmlld3MuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgVGhlIGBMQ29udGFpbmVyYCB3aGljaCBoYXMgdHJhbnNwbGFudGVkIHZpZXdzLlxuICogQHBhcmFtIGRlY2xhcmVkQ29tcG9uZW50TFZpZXcgVGhlIGBsQ29udGFpbmVyYCBwYXJlbnQgY29tcG9uZW50IGBMVmlld2AuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3cyhsQ29udGFpbmVyOiBMQ29udGFpbmVyLCBkZWNsYXJlZENvbXBvbmVudExWaWV3OiBMVmlldykge1xuICBjb25zdCBtb3ZlZFZpZXdzID0gbENvbnRhaW5lcltNT1ZFRF9WSUVXU10hO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbW92ZWRWaWV3cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG1vdmVkTFZpZXcgPSBtb3ZlZFZpZXdzW2ldITtcbiAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydExDb250YWluZXIoaW5zZXJ0aW9uTENvbnRhaW5lcik7XG4gICAgY29uc3QgaW5zZXJ0ZWRDb21wb25lbnRMVmlldyA9IGluc2VydGlvbkxDb250YWluZXJbUEFSRU5UXVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10hO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGluc2VydGVkQ29tcG9uZW50TFZpZXcsICdNaXNzaW5nIExWaWV3Jyk7XG4gICAgLy8gQ2hlY2sgaWYgd2UgaGF2ZSBhIHRyYW5zcGxhbnRlZCB2aWV3IGJ5IGNvbXBlcmluZyBkZWNsYXJhdGlvbiBhbmQgaW5zZXJ0aW9uIGxvY2F0aW9uLlxuICAgIGlmIChpbnNlcnRlZENvbXBvbmVudExWaWV3ICE9PSBkZWNsYXJlZENvbXBvbmVudExWaWV3KSB7XG4gICAgICAvLyBZZXMgdGhlIGBMVmlld2AgaXMgdHJhbnNwbGFudGVkLlxuICAgICAgLy8gSGVyZSB3ZSB3b3VsZCBsaWtlIHRvIGtub3cgaWYgdGhlIGNvbXBvbmVudCBpcyBgT25QdXNoYC4gV2UgZG9uJ3QgaGF2ZVxuICAgICAgLy8gZXhwbGljaXQgYE9uUHVzaGAgZmxhZyBpbnN0ZWFkIHdlIHNldCBgQ2hlY2tBbHdheXNgIHRvIGZhbHNlICh3aGljaCBpcyBgT25QdXNoYClcbiAgICAgIC8vIE5vdCB0byBiZSBjb25mdXNlZCB3aXRoIGBNYW51YWxPblB1c2hgIHdoaWNoIGlzIHVzZWQgd2l0aCB3ZXRoZXIgYSBET00gZXZlbnRcbiAgICAgIC8vIHNob3VsZCBhdXRvbWF0aWNhbGx5IG1hcmsgYSB2aWV3IGFzIGRpcnR5LlxuICAgICAgY29uc3QgaW5zZXJ0aW9uQ29tcG9uZW50SXNPblB1c2ggPVxuICAgICAgICAgIChpbnNlcnRlZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpID09PSAwO1xuICAgICAgaWYgKGluc2VydGlvbkNvbXBvbmVudElzT25QdXNoKSB7XG4gICAgICAgIC8vIEhlcmUgd2Uga25vdyB0aGF0IHRoZSB0ZW1wbGF0ZSBoYXMgYmVlbiB0cmFuc3BsYW50ZWQgYWNyb3NzIGNvbXBvbmVudHMgYW5kIGlzXG4gICAgICAgIC8vIG9uLXB1c2ggKG5vdCBqdXN0IG1vdmVkIHdpdGhpbiBhIGNvbXBvbmVudCkuIElmIHRoZSBpbnNlcnRpb24gaXMgbWFya2VkIGRpcnR5LCB0aGVuXG4gICAgICAgIC8vIHRoZXJlIGlzIG5vIG5lZWQgdG8gQ0QgaGVyZSBhcyB3ZSB3aWxsIGRvIGl0IGFnYWluIGxhdGVyIHdoZW4gd2UgZ2V0IHRvIGluc2VydGlvblxuICAgICAgICAvLyBwb2ludC5cbiAgICAgICAgY29uc3QgbW92ZWRUVmlldyA9IG1vdmVkTFZpZXdbVFZJRVddO1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFRWaWV3LCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVmcmVzaFZpZXcobW92ZWRUVmlldywgbW92ZWRMVmlldywgbW92ZWRUVmlldy50ZW1wbGF0ZSwgbW92ZWRMVmlld1tDT05URVhUXSEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRIb3N0SWR4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5mdW5jdGlvbiByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSAmJlxuICAgICAgY29tcG9uZW50Vmlld1tGTEFHU10gJiAoTFZpZXdGbGFncy5DaGVja0Fsd2F5cyB8IExWaWV3RmxhZ3MuRGlydHkpKSB7XG4gICAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgICByZWZyZXNoVmlldyhjb21wb25lbnRUVmlldywgY29tcG9uZW50VmlldywgY29tcG9uZW50VFZpZXcudGVtcGxhdGUsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuICByZW5kZXJWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2AgdGhhdCBjb250YWlucyB0aGUgYmx1ZXByaW50IGZvciBzeW5jaW5nXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgaSA9IGxWaWV3Lmxlbmd0aDsgaSA8IHRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGxWaWV3LnB1c2godFZpZXcuYmx1ZXByaW50W2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2Ygb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lciBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljayhyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgcm9vdENvbnRleHQuZmxhZ3MgfD0gZmxhZ3M7XG5cbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzIShudWxsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICBjb25zdCBsVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcocm9vdENvbXBvbmVudCkhO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHRWaWV3OiBUVmlldywgdmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh0VmlldywgdmlldywgY29udGV4dCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIG9uIGEgcm9vdCB2aWV3IGFuZCBpdHMgY29tcG9uZW50cywgYW5kIHRocm93cyBpZiBhbnkgY2hhbmdlcyBhcmVcbiAqIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hpY2ggdGhlIGNoYW5nZSBkZXRlY3Rpb24gc2hvdWxkIGJlIGNoZWNrZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHNldENoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT4sIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UXVlcnlGbiwgJ1ZpZXcgcXVlcmllcyBmdW5jdGlvbiB0byBleGVjdXRlIG11c3QgYmUgZGVmaW5lZC4nKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gIHZpZXdRdWVyeUZuKGZsYWdzLCBjb21wb25lbnQpO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgLi4uaW50ZXJwb2xhdGlvblBhcnRzOiBzdHJpbmdbXSkge1xuICAvLyBCaW5kaW5nIG1ldGEtZGF0YSBhcmUgc3RvcmVkIG9ubHkgdGhlIGZpcnN0IHRpbWUgYSBnaXZlbiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBpcyBwcm9jZXNzZWQuXG4gIC8vIFNpbmNlIHdlIGRvbid0IGhhdmUgYSBjb25jZXB0IG9mIHRoZSBcImZpcnN0IHVwZGF0ZSBwYXNzXCIgd2UgbmVlZCB0byBjaGVjayBmb3IgcHJlc2VuY2Ugb2YgdGhlXG4gIC8vIGJpbmRpbmcgbWV0YS1kYXRhIHRvIGRlY2lkZSBpZiBvbmUgc2hvdWxkIGJlIHN0b3JlZCAob3IgaWYgd2FzIHN0b3JlZCBhbHJlYWR5KS5cbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleF0gPT09IG51bGwpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09IG51bGwgfHwgIXROb2RlLmlucHV0c1twcm9wZXJ0eU5hbWVdKSB7XG4gICAgICBjb25zdCBwcm9wQmluZGluZ0lkeHMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzIHx8ICh0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzID0gW10pO1xuICAgICAgcHJvcEJpbmRpbmdJZHhzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgIGxldCBiaW5kaW5nTWV0YWRhdGEgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICBpZiAoaW50ZXJwb2xhdGlvblBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYmluZGluZ01ldGFkYXRhICs9XG4gICAgICAgICAgICBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIGludGVycG9sYXRpb25QYXJ0cy5qb2luKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIH1cbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBiaW5kaW5nTWV0YWRhdGE7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjb25zdCBDTEVBTl9QUk9NSVNFID0gX0NMRUFOX1BST01JU0U7XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRMQ2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IG5nRGV2TW9kZSA/IG5ldyBMQ2xlYW51cCgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodFZpZXc6IFRWaWV3KTogYW55W10ge1xuICByZXR1cm4gdFZpZXcuY2xlYW51cCB8fCAodFZpZXcuY2xlYW51cCA9IG5nRGV2TW9kZSA/IG5ldyBUQ2xlYW51cCgpIDogW10pO1xufVxuXG4vKipcbiAqIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIG5lZWRzIHRvIGJlIGluY2x1ZGVkXG4gKiBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyIChzZWUgdGhlIGNvbXBvbmVudFN5bnRoZXRpY0hvc3QqIGluc3RydWN0aW9ucykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIoXG4gICAgY3VycmVudERlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlcjMge1xuICAvLyBUT0RPKEZXLTIwNDMpOiB0aGUgYGN1cnJlbnREZWZgIGlzIG51bGwgd2hlbiBob3N0IGJpbmRpbmdzIGFyZSBpbnZva2VkIHdoaWxlIGNyZWF0aW5nIHJvb3RcbiAgLy8gY29tcG9uZW50IChzZWUgcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMpLiBUaGlzIGlzIG5vdCBjb25zaXN0ZW50IHdpdGggdGhlIHByb2Nlc3NcbiAgLy8gb2YgY3JlYXRpbmcgaW5uZXIgY29tcG9uZW50cywgd2hlbiBjdXJyZW50IGRpcmVjdGl2ZSBpbmRleCBpcyBhdmFpbGFibGUgaW4gdGhlIHN0YXRlLiBJbiBvcmRlclxuICAvLyB0byBhdm9pZCByZWx5aW5nIG9uIGN1cnJlbnQgZGVmIGJlaW5nIGBudWxsYCAodGh1cyBzcGVjaWFsLWNhc2luZyByb290IGNvbXBvbmVudCBjcmVhdGlvbiksIHRoZVxuICAvLyBwcm9jZXNzIG9mIGNyZWF0aW5nIHJvb3QgY29tcG9uZW50IHNob3VsZCBiZSB1bmlmaWVkIHdpdGggdGhlIHByb2Nlc3Mgb2YgY3JlYXRpbmcgaW5uZXJcbiAgLy8gY29tcG9uZW50cy5cbiAgaWYgKGN1cnJlbnREZWYgPT09IG51bGwgfHwgaXNDb21wb25lbnREZWYoY3VycmVudERlZikpIHtcbiAgICBsVmlldyA9IHVud3JhcExWaWV3KGxWaWV3W3ROb2RlLmluZGV4XSkhO1xuICB9XG4gIHJldHVybiBsVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dHMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqICAgICAgICBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBwdWJsaWNOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0ZXh0IGJpbmRpbmcgYXQgYSBnaXZlbiBpbmRleCBpbiBhIGdpdmVuIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICd2YWx1ZSBzaG91bGQgbm90IGJlIE5PX0NIQU5HRScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGluZGV4ICsgSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgYW55IGFzIFJUZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRUZXh0Kys7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgPyByZW5kZXJlci5zZXRWYWx1ZShlbGVtZW50LCB2YWx1ZSkgOiBlbGVtZW50LnRleHRDb250ZW50ID0gdmFsdWU7XG59XG4iXX0=