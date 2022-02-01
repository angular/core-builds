import { ErrorHandler } from '../../error_handler';
import { formatRuntimeError, RuntimeError } from '../../errors';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDefined, assertDomNode, assertEqual, assertGreaterThanOrEqual, assertIndexInRange, assertNotEqual, assertNotSame, assertSame, assertString } from '../../util/assert';
import { escapeCommentText } from '../../util/dom';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { stringify } from '../../util/stringify';
import { assertFirstCreatePass, assertFirstUpdatePass, assertLContainer, assertLView, assertTNodeForLView, assertTNodeForTView } from '../assert';
import { attachPatchData, readPatchedLView } from '../context_discovery';
import { getFactoryDef } from '../definition_factory';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS } from '../interfaces/container';
import { NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { isComponentDef, isComponentHost, isContentQueryHost, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TRANSPLANTED_VIEWS_TO_REFRESH, TVIEW } from '../interfaces/view';
import { assertPureTNodeType, assertTNodeType } from '../node_assert';
import { updateTextNode } from '../node_manipulation';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { profiler } from '../profiler';
import { enterView, getBindingsEnabled, getCurrentDirectiveIndex, getCurrentParentTNode, getCurrentTNode, getCurrentTNodePlaceholderOk, getSelectedIndex, isCurrentTNodeParent, isInCheckNoChangesMode, isInI18nBlock, leaveView, setBindingIndex, setBindingRootForHostBindings, setCurrentDirectiveIndex, setCurrentQueryIndex, setCurrentTNode, setIsInCheckNoChangesMode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { isAnimationProp, mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER } from '../util/misc_utils';
import { renderStringify, stringifyForError } from '../util/stringify_utils';
import { getFirstLContainer, getLViewParent, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, isCreationMode, resetPreOrderHookFlags, unwrapLView, updateTransplantedViewCount, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData, LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeDebug, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor } from './lview_debug';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 */
const _CLEAN_PROMISE = (() => Promise.resolve(null))();
/**
 * Invoke `HostBindingsFunction`s for view.
 *
 * This methods executes `TView.hostBindingOpCodes`. It is used to execute the
 * `HostBindingsFunction`s associated with the current `LView`.
 *
 * @param tView Current `TView`.
 * @param lView Current `LView`.
 */
export function processHostBindingOpCodes(tView, lView) {
    const hostBindingOpCodes = tView.hostBindingOpCodes;
    if (hostBindingOpCodes === null)
        return;
    try {
        for (let i = 0; i < hostBindingOpCodes.length; i++) {
            const opCode = hostBindingOpCodes[i];
            if (opCode < 0) {
                // Negative numbers are element indexes.
                setSelectedIndex(~opCode);
            }
            else {
                // Positive numbers are NumberTuple which store bindingRootIndex and directiveIndex.
                const directiveIdx = opCode;
                const bindingRootIndx = hostBindingOpCodes[++i];
                const hostBindingFn = hostBindingOpCodes[++i];
                setBindingRootForHostBindings(bindingRootIndx, directiveIdx);
                const context = lView[directiveIdx];
                hostBindingFn(2 /* Update */, context);
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
                ngDevMode && assertDefined(directiveDef, 'DirectiveDef not found.');
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
export function createLView(parentLView, tView, context, flags, host, tHostNode, rendererFactory, renderer, sanitizer, injector) {
    const lView = ngDevMode ? cloneToLViewFromTViewBlueprint(tView) : tView.blueprint.slice();
    lView[HOST] = host;
    lView[FLAGS] = flags | 4 /* CreationMode */ | 128 /* Attached */ | 8 /* FirstLViewPass */;
    resetPreOrderHookFlags(lView);
    ngDevMode && tView.declTNode && parentLView && assertTNodeForLView(tView.declTNode, parentLView);
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
export function getOrCreateTNode(tView, index, type, name, attrs) {
    ngDevMode && index !== 0 && // 0 are bogus nodes and they are OK. See `createContainerRef` in
        // `view_engine_compatibility` for additional context.
        assertGreaterThanOrEqual(index, HEADER_OFFSET, 'TNodes can\'t be in the LView header.');
    // Keep this function short, so that the VM will inline it.
    ngDevMode && assertPureTNodeType(type);
    let tNode = tView.data[index];
    if (tNode === null) {
        tNode = createTNodeAtIndex(tView, index, type, name, attrs);
        if (isInI18nBlock()) {
            // If we are in i18n block then all elements should be pre declared through `Placeholder`
            // See `TNodeType.Placeholder` and `LFrame.inI18n` for more context.
            // If the `TNode` was not pre-declared than it means it was not mentioned which means it was
            // removed, so we mark it as detached.
            tNode.flags |= 64 /* isDetached */;
        }
    }
    else if (tNode.type & 64 /* Placeholder */) {
        tNode.type = type;
        tNode.value = name;
        tNode.attrs = attrs;
        const parent = getCurrentParentTNode();
        tNode.injectorIndex = parent === null ? -1 : parent.injectorIndex;
        ngDevMode && assertTNodeForTView(tNode, tView);
        ngDevMode && assertEqual(index, tNode.index, 'Expecting same index');
    }
    setCurrentTNode(tNode, true);
    return tNode;
}
export function createTNodeAtIndex(tView, index, type, name, attrs) {
    const currentTNode = getCurrentTNodePlaceholderOk();
    const isParent = isCurrentTNodeParent();
    const parent = isParent ? currentTNode : currentTNode && currentTNode.parent;
    // Parents cannot cross component boundaries because components will be used in multiple places.
    const tNode = tView.data[index] =
        createTNode(tView, parent, type, index, name, attrs);
    // Assign a pointer to the first child node of a given view. The first node is not always the one
    // at index 0, in case of i18n, index 0 can be the instruction `i18nStart` and the first node has
    // the index 1 or more, so we can't just check node index.
    if (tView.firstChild === null) {
        tView.firstChild = tNode;
    }
    if (currentTNode !== null) {
        if (isParent) {
            // FIXME(misko): This logic looks unnecessarily complicated. Could we simplify?
            if (currentTNode.child == null && tNode.parent !== null) {
                // We are in the same view, which means we are adding content node to the parent view.
                currentTNode.child = tNode;
            }
        }
        else {
            if (currentTNode.next === null) {
                // In the case of i18n the `currentTNode` may already be linked, in which case we don't want
                // to break the links which i18n created.
                currentTNode.next = tNode;
            }
        }
    }
    return tNode;
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply()), we need to adjust the blueprint for future
 * template passes.
 *
 * @param tView `TView` associated with `LView`
 * @param lView The `LView` containing the blueprint to adjust
 * @param numSlotsToAlloc The number of slots to alloc in the LView, should be >0
 * @param initialValue Initial value to store in blueprint
 */
export function allocExpando(tView, lView, numSlotsToAlloc, initialValue) {
    if (numSlotsToAlloc === 0)
        return -1;
    if (ngDevMode) {
        assertFirstCreatePass(tView);
        assertSame(tView, lView[TVIEW], '`LView` must be associated with `TView`!');
        assertEqual(tView.data.length, lView.length, 'Expecting LView to be same size as TView');
        assertEqual(tView.data.length, tView.blueprint.length, 'Expecting Blueprint to be same size as TView');
        assertFirstUpdatePass(tView);
    }
    const allocIdx = lView.length;
    for (let i = 0; i < numSlotsToAlloc; i++) {
        lView.push(initialValue);
        tView.blueprint.push(initialValue);
        tView.data.push(null);
    }
    return allocIdx;
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
    enterView(lView);
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
            tView.firstCreatePass = false;
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
    enterView(lView);
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to execute lifecycle hooks in that mode.
    const isInCheckNoChangesPass = isInCheckNoChangesMode();
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 2 /* Update */, context);
        }
        const hooksInitPhaseCompleted = (flags & 3 /* InitPhaseStateMask */) === 3 /* InitPhaseCompleted */;
        // execute pre-order hooks (OnInit, OnChanges, DoCheck)
        // PERF WARNING: do NOT extract this to a separate function without running benchmarks
        if (!isInCheckNoChangesPass) {
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
        if (!isInCheckNoChangesPass) {
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
        processHostBindingOpCodes(tView, lView);
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
        if (!isInCheckNoChangesPass) {
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
        if (!isInCheckNoChangesPass) {
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
    const normalExecutionPath = !isInCheckNoChangesMode();
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
    const isUpdatePhase = rf & 2 /* Update */;
    try {
        setSelectedIndex(-1);
        if (isUpdatePhase && lView.length > HEADER_OFFSET) {
            // When we're updating, inherently select 0 so we don't
            // have to generate that instruction for most update blocks.
            selectIndexInternal(tView, lView, HEADER_OFFSET, isInCheckNoChangesMode());
        }
        const preHookType = isUpdatePhase ? 2 /* TemplateUpdateStart */ : 0 /* TemplateCreateStart */;
        profiler(preHookType, context);
        templateFn(rf, context);
    }
    finally {
        setSelectedIndex(prevSelectedIndex);
        const postHookType = isUpdatePhase ? 3 /* TemplateUpdateEnd */ : 1 /* TemplateCreateEnd */;
        profiler(postHookType, context);
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
    // complete successfully since we can't know for sure whether it's in a usable shape.
    if (tView === null || tView.incompleteFirstPass) {
        // Declaration node here is null since this function is called when we dynamically create a
        // component and hence there is no declaration.
        const declTNode = null;
        return def.tView = createTView(1 /* Component */, declTNode, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts);
    }
    return tView;
}
/**
 * Creates a TView instance
 *
 * @param type Type of `TView`.
 * @param declTNode Declaration location of this `TView`.
 * @param templateFn Template function
 * @param decls The number of nodes, local refs, and pipes in this template
 * @param directives Registry of directives for this view
 * @param pipes Registry of pipes for this view
 * @param viewQuery View queries for this view
 * @param schemas Schemas for this view
 * @param consts Constants for this view
 */
export function createTView(type, declTNode, templateFn, decls, vars, directives, pipes, viewQuery, schemas, constsOrFactory) {
    ngDevMode && ngDevMode.tView++;
    const bindingStartIndex = HEADER_OFFSET + decls;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    const initialViewLength = bindingStartIndex + vars;
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    const consts = typeof constsOrFactory === 'function' ? constsOrFactory() : constsOrFactory;
    const tView = blueprint[TVIEW] = ngDevMode ?
        new TViewConstructor(type, // type: TViewType,
        blueprint, // blueprint: LView,
        templateFn, // template: ComponentTemplate<{}>|null,
        null, // queries: TQueries|null
        viewQuery, // viewQuery: ViewQueriesFunction<{}>|null,
        declTNode, // declTNode: TNode|null,
        cloneToTViewData(blueprint).fill(null, bindingStartIndex), // data: TData,
        bindingStartIndex, // bindingStartIndex: number,
        initialViewLength, // expandoStartIndex: number,
        null, // hostBindingOpCodes: HostBindingOpCodes,
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
        typeof directives === 'function' ? //
            directives() : //
            directives, // directiveRegistry: DirectiveDefList|null,
        typeof pipes === 'function' ? pipes() : pipes, // pipeRegistry: PipeDefList|null,
        null, // firstChild: TNode|null,
        schemas, // schemas: SchemaMetadata[]|null,
        consts, // consts: TConstants|null
        false, // incompleteFirstPass: boolean
        decls, // ngDevMode only: decls
        vars) :
        {
            type: type,
            blueprint: blueprint,
            template: templateFn,
            queries: null,
            viewQuery: viewQuery,
            declTNode: declTNode,
            data: blueprint.slice().fill(null, bindingStartIndex),
            bindingStartIndex: bindingStartIndex,
            expandoStartIndex: initialViewLength,
            hostBindingOpCodes: null,
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
    if (ngDevMode) {
        // For performance reasons it is important that the tView retains the same shape during runtime.
        // (To make sure that all of the code is monomorphic.) For this reason we seal the object to
        // prevent class transitions.
        Object.seal(tView);
    }
    return tView;
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
 *
 * This function can also be used to store instance specific cleanup fns. In that case the `context`
 * is `null` and the function is store in `LView` (rather than it `TView`).
 */
export function storeCleanupWithContext(tView, lView, context, cleanupFn) {
    const lCleanup = getOrCreateLViewCleanup(lView);
    if (context === null) {
        // If context is null that this is instance specific callback. These callbacks can only be
        // inserted after template shared instances. For this reason in ngDevMode we freeze the TView.
        if (ngDevMode) {
            Object.freeze(getOrCreateTViewCleanup(tView));
        }
        lCleanup.push(cleanupFn);
    }
    else {
        lCleanup.push(context);
        if (tView.firstCreatePass) {
            getOrCreateTViewCleanup(tView).push(cleanupFn, lCleanup.length - 1);
        }
    }
}
export function createTNode(tView, tParent, type, index, value, attrs) {
    ngDevMode && index !== 0 && // 0 are bogus nodes and they are OK. See `createContainerRef` in
        // `view_engine_compatibility` for additional context.
        assertGreaterThanOrEqual(index, HEADER_OFFSET, 'TNodes can\'t be in the LView header.');
    ngDevMode && assertNotSame(attrs, undefined, '\'undefined\' is not valid value for \'attrs\'');
    ngDevMode && ngDevMode.tNode++;
    ngDevMode && tParent && assertTNodeForTView(tParent, tView);
    let injectorIndex = tParent ? tParent.injectorIndex : -1;
    const tNode = ngDevMode ?
        new TNodeDebug(tView, // tView_: TView
        type, // type: TNodeType
        index, // index: number
        null, // insertBeforeIndex: null|-1|number|number[]
        injectorIndex, // injectorIndex: number
        -1, // directiveStart: number
        -1, // directiveEnd: number
        -1, // directiveStylingLast: number
        null, // propertyBindings: number[]|null
        0, // flags: TNodeFlags
        0, // providerIndexes: TNodeProviderIndexes
        value, // value: string|null
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
            type,
            index,
            insertBeforeIndex: null,
            injectorIndex,
            directiveStart: -1,
            directiveEnd: -1,
            directiveStylingLast: -1,
            propertyBindings: null,
            flags: 0,
            providerIndexes: 0,
            value: value,
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
    if (ngDevMode) {
        // For performance reasons it is important that the tNode retains the same shape during runtime.
        // (To make sure that all of the code is monomorphic.) For this reason we seal the object to
        // prevent class transitions.
        Object.seal(tNode);
    }
    return tNode;
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
 * Initializes data structures required to work with directive inputs and outputs.
 * Initialization is done for all directives matched on a given TNode.
 */
function initializeInputAndOutputAliases(tView, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const tViewData = tView.data;
    const tNodeAttrs = tNode.attrs;
    const inputsFromAttrs = ngDevMode ? new TNodeInitialInputs() : [];
    let inputsStore = null;
    let outputsStore = null;
    for (let i = start; i < end; i++) {
        const directiveDef = tViewData[i];
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
    else if (tNode.type & 3 /* AnyRNode */) {
        propName = mapPropName(propName);
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            if (!validateProperty(tView, element, propName, tNode)) {
                // Return here since we only log warnings for unknown properties.
                logUnknownPropertyError(propName, tNode);
                return;
            }
            ngDevMode.rendererSetProperty++;
        }
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value, tNode.value || '', propName) : value;
        if (isProceduralRenderer(renderer)) {
            renderer.setProperty(element, propName, value);
        }
        else if (!isAnimationProp(propName)) {
            element.setProperty ? element.setProperty(propName, value) :
                element[propName] = value;
        }
    }
    else if (tNode.type & 12 /* AnyContainer */) {
        // If the node is a container and the property didn't
        // match any of the inputs or schemas we should throw.
        if (ngDevMode && !matchingSchemas(tView, tNode.value)) {
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
    if (type & 3 /* AnyRNode */) {
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
        const textContent = escapeCommentText(`bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`);
        if (isProceduralRenderer(renderer)) {
            renderer.setValue(element, textContent);
        }
        else {
            element.textContent = textContent;
        }
    }
}
export function setNgReflectProperties(lView, element, type, dataValue, value) {
    if (type & (3 /* AnyRNode */ | 4 /* Container */)) {
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
function validateProperty(tView, element, propName, tNode) {
    // If `schemas` is set to `null`, that's an indication that this Component was compiled in AOT
    // mode where this check happens at compile time. In JIT mode, `schemas` is always present and
    // defined as an array (as an empty array in case `schemas` field is not defined) and we should
    // execute the check below.
    if (tView.schemas === null)
        return true;
    // The property is considered valid if the element matches the schema, it exists on the element
    // or it is synthetic, and we are in a browser context (web worker nodes should be skipped).
    if (matchingSchemas(tView, tNode.value) || propName in element || isAnimationProp(propName)) {
        return true;
    }
    // Note: `typeof Node` returns 'function' in most browsers, but on IE it is 'object' so we
    // need to account for both here, while being careful for `typeof null` also returning 'object'.
    return typeof Node === 'undefined' || Node === null || !(element instanceof Node);
}
export function matchingSchemas(tView, tagName) {
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
    let message = `Can't bind to '${propName}' since it isn't a known property of '${tNode.value}'.`;
    console.error(formatRuntimeError(303 /* UNKNOWN_BINDING */, message));
}
/**
 * Instantiate a root component.
 */
export function instantiateRootComponent(tView, lView, def) {
    const rootTNode = getCurrentTNode();
    if (tView.firstCreatePass) {
        if (def.providersResolver)
            def.providersResolver(def);
        const directiveIndex = allocExpando(tView, lView, 1, null);
        ngDevMode &&
            assertEqual(directiveIndex, rootTNode.directiveStart, 'Because this is a root component the allocated expando should match the TNode component.');
        configureViewWithDirective(tView, rootTNode, lView, directiveIndex, def);
    }
    const directive = getNodeInjectable(lView, tView, rootTNode.directiveStart, rootTNode);
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
            let preOrderHooksFound = false;
            let preOrderCheckHooksFound = false;
            let directiveIdx = allocExpando(tView, lView, directiveDefs.length, null);
            ngDevMode &&
                assertSame(directiveIdx, tNode.directiveStart, 'TNode.directiveStart should point to just allocated space');
            for (let i = 0; i < directiveDefs.length; i++) {
                const def = directiveDefs[i];
                // Merge the attrs in the order of matches. This assumes that the first directive is the
                // component itself, so that the component has the least priority.
                tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);
                configureViewWithDirective(tView, tNode, lView, directiveIdx, def);
                saveNameToExportMap(directiveIdx, def, exportsMap);
                if (def.contentQueries !== null)
                    tNode.flags |= 8 /* hasContentQuery */;
                if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0)
                    tNode.flags |= 128 /* hasHostBindings */;
                const lifeCycleHooks = def.type.prototype;
                // Only push a node index into the preOrderHooks array if this is the first
                // pre-order hook found on this node.
                if (!preOrderHooksFound &&
                    (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngOnInit || lifeCycleHooks.ngDoCheck)) {
                    // We will push the actual hook function into this array later during dir instantiation.
                    // We cannot do it now because we must ensure hooks are registered in the same
                    // order that directives are created (i.e. injection order).
                    (tView.preOrderHooks || (tView.preOrderHooks = [])).push(tNode.index);
                    preOrderHooksFound = true;
                }
                if (!preOrderCheckHooksFound && (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngDoCheck)) {
                    (tView.preOrderCheckHooks || (tView.preOrderCheckHooks = [])).push(tNode.index);
                    preOrderCheckHooksFound = true;
                }
                directiveIdx++;
            }
            initializeInputAndOutputAliases(tView, tNode);
        }
        if (exportsMap)
            cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    }
    // Merge the template attrs last so that they have the highest priority.
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
    return hasDirectives;
}
/**
 * Add `hostBindings` to the `TView.hostBindingOpCodes`.
 *
 * @param tView `TView` to which the `hostBindings` should be added.
 * @param tNode `TNode` the element which contains the directive
 * @param lView `LView` current `LView`
 * @param directiveIdx Directive index in view.
 * @param directiveVarsIdx Where will the directive's vars be stored
 * @param def `ComponentDef`/`DirectiveDef`, which contains the `hostVars`/`hostBindings` to add.
 */
export function registerHostBindingOpCodes(tView, tNode, lView, directiveIdx, directiveVarsIdx, def) {
    ngDevMode && assertFirstCreatePass(tView);
    const hostBindings = def.hostBindings;
    if (hostBindings) {
        let hostBindingOpCodes = tView.hostBindingOpCodes;
        if (hostBindingOpCodes === null) {
            hostBindingOpCodes = tView.hostBindingOpCodes = [];
        }
        const elementIndx = ~tNode.index;
        if (lastSelectedElementIdx(hostBindingOpCodes) != elementIndx) {
            // Conditionally add select element so that we are more efficient in execution.
            // NOTE: this is strictly not necessary and it trades code size for runtime perf.
            // (We could just always add it.)
            hostBindingOpCodes.push(elementIndx);
        }
        hostBindingOpCodes.push(directiveIdx, directiveVarsIdx, hostBindings);
    }
}
/**
 * Returns the last selected element index in the `HostBindingOpCodes`
 *
 * For perf reasons we don't need to update the selected element index in `HostBindingOpCodes` only
 * if it changes. This method returns the last index (or '0' if not found.)
 *
 * Selected element index are only the ones which are negative.
 */
function lastSelectedElementIdx(hostBindingOpCodes) {
    let i = hostBindingOpCodes.length;
    while (i > 0) {
        const value = hostBindingOpCodes[--i];
        if (typeof value === 'number' && value < 0) {
            return value;
        }
    }
    return 0;
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
            ngDevMode && assertTNodeType(tNode, 3 /* AnyRNode */);
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
    const firstCreatePass = tView.firstCreatePass;
    const elementIndex = tNode.index;
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
 * Matches the current node against all available selectors.
 * If a component is matched (at most one), it is returned in first position in the array.
 */
function findDirectiveDefMatches(tView, viewData, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertTNodeType(tNode, 3 /* AnyRNode */ | 12 /* AnyContainer */);
    const registry = tView.directiveRegistry;
    let matches = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors, /* isProjectionMode */ false)) {
                matches || (matches = ngDevMode ? new MatchesArray() : []);
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, viewData), tView, def.type);
                if (isComponentDef(def)) {
                    if (ngDevMode) {
                        assertTNodeType(tNode, 2 /* Element */, `"${tNode.value}" tags cannot be used as component hosts. ` +
                            `Please use a different tag to activate the ${stringify(def.type)} component.`);
                        if (tNode.flags & 2 /* isComponentHost */)
                            throwMultipleComponentError(tNode);
                    }
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
                throw new RuntimeError(-301 /* EXPORT_NOT_FOUND */, ngDevMode && `Export of name '${localRefs[i + 1]}' not found!`);
            localNames.push(localRefs[i], index);
        }
    }
}
/**
 * Builds up an export map as directives are created, so local refs can be quickly mapped
 * to their directive instances.
 */
function saveNameToExportMap(directiveIdx, def, exportsMap) {
    if (exportsMap) {
        if (def.exportAs) {
            for (let i = 0; i < def.exportAs.length; i++) {
                exportsMap[def.exportAs[i]] = directiveIdx;
            }
        }
        if (isComponentDef(def))
            exportsMap[''] = directiveIdx;
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
/**
 * Setup directive for instantiation.
 *
 * We need to create a `NodeInjectorFactory` which is then inserted in both the `Blueprint` as well
 * as `LView`. `TView` gets the `DirectiveDef`.
 *
 * @param tView `TView`
 * @param tNode `TNode`
 * @param lView `LView`
 * @param directiveIndex Index where the directive will be stored in the Expando.
 * @param def `DirectiveDef`
 */
function configureViewWithDirective(tView, tNode, lView, directiveIndex, def) {
    ngDevMode &&
        assertGreaterThanOrEqual(directiveIndex, HEADER_OFFSET, 'Must be in Expando section');
    tView.data[directiveIndex] = def;
    const directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint[directiveIndex] = nodeInjectorFactory;
    lView[directiveIndex] = nodeInjectorFactory;
    registerHostBindingOpCodes(tView, tNode, lView, directiveIndex, allocExpando(tView, lView, def.hostVars, NO_CHANGE), def);
}
function addComponentLogic(lView, hostTNode, def) {
    const native = getNativeByTNode(hostTNode, lView);
    const tView = getOrCreateTComponentView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const rendererFactory = lView[RENDERER_FACTORY];
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, native, hostTNode, rendererFactory, rendererFactory.createRenderer(native, def), null, null));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[hostTNode.index] = componentView;
}
export function elementAttributeInternal(tNode, lView, name, value, sanitizer, namespace) {
    if (ngDevMode) {
        assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
        validateAgainstEventAttributes(name);
        assertTNodeType(tNode, 2 /* Element */, `Attempted to set attribute \`${name}\` on a container node. ` +
            `Host bindings are not valid on ng-container or ng-template.`);
    }
    const element = getNativeByTNode(tNode, lView);
    setElementAttribute(lView[RENDERER], element, namespace, tNode.value, name, value, sanitizer);
}
export function setElementAttribute(renderer, element, namespace, tagName, name, value, sanitizer) {
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        isProceduralRenderer(renderer) ? renderer.removeAttribute(element, name, namespace) :
            element.removeAttribute(name);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
        const strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tagName || '', name);
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
const LContainerArray = class LContainer extends Array {
};
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
    if (nothingScheduled && rootContext.clean == _CLEAN_PROMISE) {
        // https://github.com/angular/angular/issues/39296
        // should only attach the flags when really scheduling a tick
        rootContext.flags |= flags;
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
    setIsInCheckNoChangesMode(true);
    try {
        detectChangesInternal(tView, view, context);
    }
    finally {
        setIsInCheckNoChangesMode(false);
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
    setIsInCheckNoChangesMode(true);
    try {
        detectChangesInRootView(lView);
    }
    finally {
        setIsInCheckNoChangesMode(false);
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
export function getOrCreateLViewCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = ngDevMode ? new LCleanup() : []);
}
export function getOrCreateTViewCleanup(tView) {
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
        ngDevMode && assertIndexInRange(lView, index);
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
    ngDevMode && assertString(value, 'Value should be a string');
    ngDevMode && assertNotSame(value, NO_CHANGE, 'value should not be NO_CHANGE');
    ngDevMode && assertIndexInRange(lView, index);
    const element = getNativeByIndex(index, lView);
    ngDevMode && assertDefined(element, 'native element should exist');
    updateTextNode(lView[RENDERER], element, value);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFBLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUVoRixPQUFPLEVBQUMsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQWlCLE1BQU0sdUJBQXVCLENBQUM7QUFDL0YsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFFL0csT0FBTyxFQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsV0FBVyxFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ25MLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ2hKLE9BQU8sRUFBQyxlQUFlLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUN2RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDcEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGlCQUFpQixFQUFFLDhCQUE4QixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVGLE9BQU8sRUFBQywyQkFBMkIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUN0RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUUsd0JBQXdCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOUYsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFjLFdBQVcsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRWpILE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBRTNELE9BQU8sRUFBQyxvQkFBb0IsRUFBOEIsTUFBTSx3QkFBd0IsQ0FBQztBQUd6RixPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUMsTUFBTSwyQkFBMkIsQ0FBQztBQUMxRyxPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLDBCQUEwQixFQUFFLGdCQUFnQixFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFzQyxRQUFRLEVBQXFCLElBQUksRUFBRSxNQUFNLEVBQUUsUUFBUSxFQUFFLGdCQUFnQixFQUFpQyxTQUFTLEVBQUUsTUFBTSxFQUFTLDZCQUE2QixFQUFFLEtBQUssRUFBbUIsTUFBTSxvQkFBb0IsQ0FBQztBQUNsWCxPQUFPLEVBQUMsbUJBQW1CLEVBQUUsZUFBZSxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDcEUsT0FBTyxFQUFDLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ3BELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3RGLE9BQU8sRUFBQyxRQUFRLEVBQWdCLE1BQU0sYUFBYSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxTQUFTLEVBQUUsa0JBQWtCLEVBQUUsd0JBQXdCLEVBQUUscUJBQXFCLEVBQUUsZUFBZSxFQUFFLDRCQUE0QixFQUFFLGdCQUFnQixFQUFFLG9CQUFvQixFQUFFLHNCQUFzQixFQUFFLGFBQWEsRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLDZCQUE2QixFQUFFLHdCQUF3QixFQUFFLG9CQUFvQixFQUFFLGVBQWUsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMvWSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBQ3BDLE9BQU8sRUFBQyxlQUFlLEVBQUUsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDcEUsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDM0QsT0FBTyxFQUFDLGVBQWUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQzNFLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNuRyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWhOLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM5QyxPQUFPLEVBQUMscUJBQXFCLEVBQUUsZ0JBQWdCLEVBQUUsOEJBQThCLEVBQUUsZ0JBQWdCLEVBQUUsUUFBUSxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBSTlQOzs7R0FHRztBQUNILE1BQU0sY0FBYyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFFdkQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDbEUsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7SUFDcEQsSUFBSSxrQkFBa0IsS0FBSyxJQUFJO1FBQUUsT0FBTztJQUN4QyxJQUFJO1FBQ0YsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNsRCxNQUFNLE1BQU0sR0FBRyxrQkFBa0IsQ0FBQyxDQUFDLENBQVcsQ0FBQztZQUMvQyxJQUFJLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2Qsd0NBQXdDO2dCQUN4QyxnQkFBZ0IsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQzNCO2lCQUFNO2dCQUNMLG9GQUFvRjtnQkFDcEYsTUFBTSxZQUFZLEdBQUcsTUFBTSxDQUFDO2dCQUM1QixNQUFNLGVBQWUsR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBVyxDQUFDO2dCQUMxRCxNQUFNLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBOEIsQ0FBQztnQkFDM0UsNkJBQTZCLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO2dCQUM3RCxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7Z0JBQ3BDLGFBQWEsaUJBQXFCLE9BQU8sQ0FBQyxDQUFDO2FBQzVDO1NBQ0Y7S0FDRjtZQUFTO1FBQ1IsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QjtBQUNILENBQUM7QUFHRCwyRUFBMkU7QUFDM0UsU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN2RCxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQzVDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2pELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBc0IsQ0FBQztnQkFDdEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxZQUFZLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDcEUsU0FBUztvQkFDTCxhQUFhLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO2dCQUM1RixvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDcEMsWUFBWSxDQUFDLGNBQWUsaUJBQXFCLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQzthQUMzRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQVMsc0JBQXNCLENBQUMsU0FBZ0IsRUFBRSxVQUFvQjtJQUNwRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQVMscUJBQXFCLENBQUMsU0FBZ0IsRUFBRSxVQUFvQjtJQUNuRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxlQUFlLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFdBQXVCLEVBQUUsS0FBWSxFQUFFLE9BQWUsRUFBRSxLQUFpQixFQUFFLElBQW1CLEVBQzlGLFNBQXFCLEVBQUUsZUFBc0MsRUFBRSxRQUF3QixFQUN2RixTQUF5QixFQUFFLFFBQXVCO0lBQ3BELE1BQU0sS0FBSyxHQUNQLFNBQVMsQ0FBQyxDQUFDLENBQUMsOEJBQThCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFXLENBQUM7SUFDekYsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztJQUNuQixLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyx1QkFBMEIscUJBQXNCLHlCQUE0QixDQUFDO0lBQ2pHLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLFNBQVMsSUFBSSxLQUFLLENBQUMsU0FBUyxJQUFJLFdBQVcsSUFBSSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQ2pHLEtBQUssQ0FBQyxNQUFNLENBQUMsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxXQUFXLENBQUM7SUFDdEQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLE9BQU8sQ0FBQztJQUN6QixLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxDQUFDLGVBQWUsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLGdCQUFnQixDQUFDLENBQUUsQ0FBQztJQUM3RixTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkYsS0FBSyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsUUFBUSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUUsQ0FBQztJQUN0RSxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3BFLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxTQUFTLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxJQUFLLENBQUM7SUFDL0UsS0FBSyxDQUFDLFFBQWUsQ0FBQyxHQUFHLFFBQVEsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUNsRixLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQzFCLFNBQVM7UUFDTCxXQUFXLENBQ1AsS0FBSyxDQUFDLElBQUksb0JBQXNCLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQ3BFLHNDQUFzQyxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLDBCQUEwQixDQUFDO1FBQzdCLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDLENBQUMsQ0FBQyxXQUFZLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3hGLFNBQVMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUE0QkQsTUFBTSxVQUFVLGdCQUFnQixDQUM1QixLQUFZLEVBQUUsS0FBYSxFQUFFLElBQWUsRUFBRSxJQUFpQixFQUFFLEtBQXVCO0lBRTFGLFNBQVMsSUFBSSxLQUFLLEtBQUssQ0FBQyxJQUFLLGlFQUFpRTtRQUNqRSxzREFBc0Q7UUFDL0Usd0JBQXdCLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSx1Q0FBdUMsQ0FBQyxDQUFDO0lBQzVGLDJEQUEyRDtJQUMzRCxTQUFTLElBQUksbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkMsSUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQVUsQ0FBQztJQUN2QyxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDbEIsS0FBSyxHQUFHLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxJQUFJLGFBQWEsRUFBRSxFQUFFO1lBQ25CLHlGQUF5RjtZQUN6RixvRUFBb0U7WUFDcEUsNEZBQTRGO1lBQzVGLHNDQUFzQztZQUN0QyxLQUFLLENBQUMsS0FBSyx1QkFBeUIsQ0FBQztTQUN0QztLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSx1QkFBd0IsRUFBRTtRQUM3QyxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNsQixLQUFLLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztRQUNuQixLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztRQUNwQixNQUFNLE1BQU0sR0FBRyxxQkFBcUIsRUFBRSxDQUFDO1FBQ3ZDLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUM7UUFDbEUsU0FBUyxJQUFJLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvQyxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLHNCQUFzQixDQUFDLENBQUM7S0FDdEU7SUFDRCxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzdCLE9BQU8sS0FDYyxDQUFDO0FBQ3hCLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQzlCLEtBQVksRUFBRSxLQUFhLEVBQUUsSUFBZSxFQUFFLElBQWlCLEVBQUUsS0FBdUI7SUFDMUYsTUFBTSxZQUFZLEdBQUcsNEJBQTRCLEVBQUUsQ0FBQztJQUNwRCxNQUFNLFFBQVEsR0FBRyxvQkFBb0IsRUFBRSxDQUFDO0lBQ3hDLE1BQU0sTUFBTSxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxZQUFZLElBQUksWUFBWSxDQUFDLE1BQU0sQ0FBQztJQUM3RSxnR0FBZ0c7SUFDaEcsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7UUFDM0IsV0FBVyxDQUFDLEtBQUssRUFBRSxNQUF1QyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzFGLGlHQUFpRztJQUNqRyxpR0FBaUc7SUFDakcsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLFVBQVUsS0FBSyxJQUFJLEVBQUU7UUFDN0IsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7S0FDMUI7SUFDRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7UUFDekIsSUFBSSxRQUFRLEVBQUU7WUFDWiwrRUFBK0U7WUFDL0UsSUFBSSxZQUFZLENBQUMsS0FBSyxJQUFJLElBQUksSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLElBQUksRUFBRTtnQkFDdkQsc0ZBQXNGO2dCQUN0RixZQUFZLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQzthQUM1QjtTQUNGO2FBQU07WUFDTCxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssSUFBSSxFQUFFO2dCQUM5Qiw0RkFBNEY7Z0JBQzVGLHlDQUF5QztnQkFDekMsWUFBWSxDQUFDLElBQUksR0FBRyxLQUFLLENBQUM7YUFDM0I7U0FDRjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBR0Q7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FDeEIsS0FBWSxFQUFFLEtBQVksRUFBRSxlQUF1QixFQUFFLFlBQWlCO0lBQ3hFLElBQUksZUFBZSxLQUFLLENBQUM7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksU0FBUyxFQUFFO1FBQ2IscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsMENBQTBDLENBQUMsQ0FBQztRQUM1RSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1FBQ3pGLFdBQVcsQ0FDUCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1FBQy9GLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzlCO0lBQ0QsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBR0QsMEJBQTBCO0FBQzFCLFdBQVc7QUFDWCwwQkFBMEI7QUFFMUI7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FBSSxLQUFZLEVBQUUsS0FBWSxFQUFFLE9BQVU7SUFDbEUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7SUFDeEYsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLElBQUk7UUFDRixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2xDLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixrQkFBa0IsaUJBQXFCLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUM1RDtRQUVELCtGQUErRjtRQUMvRix3Q0FBd0M7UUFDeEMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNsQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7WUFDdkIsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxrQkFBc0IsT0FBTyxDQUFDLENBQUM7U0FDeEU7UUFFRCxzRkFBc0Y7UUFDdEYsbUZBQW1GO1FBQ25GLHVGQUF1RjtRQUN2RixpRkFBaUY7UUFDakYsaUNBQWlDO1FBQ2pDLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6QixLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELHVGQUF1RjtRQUN2RiwwRkFBMEY7UUFDMUYseUNBQXlDO1FBQ3pDLElBQUksS0FBSyxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyQztRQUVELDBFQUEwRTtRQUMxRSw0RUFBNEU7UUFDNUUseUVBQXlFO1FBQ3pFLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLGtCQUFrQixpQkFBcUIsS0FBSyxDQUFDLFNBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUNuRTtRQUVELGdDQUFnQztRQUNoQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDMUM7S0FFRjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsaUVBQWlFO1FBQ2pFLGlFQUFpRTtRQUNqRSxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7WUFDekIsS0FBSyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztZQUNqQyxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELE1BQU0sS0FBSyxDQUFDO0tBQ2I7WUFBUztRQUNSLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxxQkFBd0IsQ0FBQztRQUN6QyxTQUFTLEVBQUUsQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUN2QixLQUFZLEVBQUUsS0FBWSxFQUFFLFVBQXNDLEVBQUUsT0FBVTtJQUNoRixTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUN2RixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsSUFBSSxDQUFDLEtBQUssc0JBQXVCLENBQUMsd0JBQXlCO1FBQUUsT0FBTztJQUNwRSxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDakIseUZBQXlGO0lBQ3pGLG9GQUFvRjtJQUNwRixNQUFNLHNCQUFzQixHQUFHLHNCQUFzQixFQUFFLENBQUM7SUFDeEQsSUFBSTtRQUNGLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTlCLGVBQWUsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztRQUN6QyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7WUFDdkIsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxrQkFBc0IsT0FBTyxDQUFDLENBQUM7U0FDeEU7UUFFRCxNQUFNLHVCQUF1QixHQUN6QixDQUFDLEtBQUssNkJBQWdDLENBQUMsK0JBQXNDLENBQUM7UUFFbEYsdURBQXVEO1FBQ3ZELHNGQUFzRjtRQUN0RixJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDM0IsSUFBSSx1QkFBdUIsRUFBRTtnQkFDM0IsTUFBTSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7Z0JBQ3BELElBQUksa0JBQWtCLEtBQUssSUFBSSxFQUFFO29CQUMvQixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLENBQUM7aUJBQ3BEO2FBQ0Y7aUJBQU07Z0JBQ0wsTUFBTSxhQUFhLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQztnQkFDMUMsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO29CQUMxQix3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSw4QkFBcUMsSUFBSSxDQUFDLENBQUM7aUJBQ3pGO2dCQUNELHVCQUF1QixDQUFDLEtBQUssNkJBQW9DLENBQUM7YUFDbkU7U0FDRjtRQUVELDhGQUE4RjtRQUM5RixnR0FBZ0c7UUFDaEcscUVBQXFFO1FBQ3JFLCtCQUErQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ3ZDLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRTVCLDJFQUEyRTtRQUMzRSxJQUFJLEtBQUssQ0FBQyxjQUFjLEtBQUssSUFBSSxFQUFFO1lBQ2pDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyQztRQUVELGdFQUFnRTtRQUNoRSxzRkFBc0Y7UUFDdEYsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQzNCLElBQUksdUJBQXVCLEVBQUU7Z0JBQzNCLE1BQU0saUJBQWlCLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO2dCQUNsRCxJQUFJLGlCQUFpQixLQUFLLElBQUksRUFBRTtvQkFDOUIsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7aUJBQzdDO2FBQ0Y7aUJBQU07Z0JBQ0wsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztnQkFDeEMsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO29CQUN6Qix3QkFBd0IsQ0FDcEIsS0FBSyxFQUFFLFlBQVksdUNBQThDLENBQUM7aUJBQ3ZFO2dCQUNELHVCQUF1QixDQUFDLEtBQUssdUNBQThDLENBQUM7YUFDN0U7U0FDRjtRQUVELHlCQUF5QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QyxpQ0FBaUM7UUFDakMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztRQUNwQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7WUFDdkIsc0JBQXNCLENBQUMsS0FBSyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzNDO1FBRUQsOEZBQThGO1FBQzlGLDRGQUE0RjtRQUM1RixtREFBbUQ7UUFDbkQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNsQyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsa0JBQWtCLGlCQUFxQixTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDNUQ7UUFFRCx1REFBdUQ7UUFDdkQsc0ZBQXNGO1FBQ3RGLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUMzQixJQUFJLHVCQUF1QixFQUFFO2dCQUMzQixNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO2dCQUM1QyxJQUFJLGNBQWMsS0FBSyxJQUFJLEVBQUU7b0JBQzNCLGlCQUFpQixDQUFDLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQztpQkFDMUM7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO2dCQUNsQyxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7b0JBQ3RCLHdCQUF3QixDQUFDLEtBQUssRUFBRSxTQUFTLG9DQUEyQyxDQUFDO2lCQUN0RjtnQkFDRCx1QkFBdUIsQ0FBQyxLQUFLLG9DQUEyQyxDQUFDO2FBQzFFO1NBQ0Y7UUFDRCxJQUFJLEtBQUssQ0FBQyxlQUFlLEtBQUssSUFBSSxFQUFFO1lBQ2xDLG1GQUFtRjtZQUNuRixvQ0FBb0M7WUFDcEMsMkZBQTJGO1lBQzNGLDBGQUEwRjtZQUMxRiw4RkFBOEY7WUFDOUYseUVBQXlFO1lBQ3pFLEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1NBQy9CO1FBRUQsK0ZBQStGO1FBQy9GLDhGQUE4RjtRQUM5RiwwRkFBMEY7UUFDMUYsMEZBQTBGO1FBQzFGLDZGQUE2RjtRQUM3RixnRkFBZ0Y7UUFDaEYsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQzNCLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsdUNBQTRDLENBQUMsQ0FBQztTQUNqRTtRQUNELElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsRUFBRTtZQUNyRCxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksbUNBQW1DLENBQUM7WUFDcEQsMkJBQTJCLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBZSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDOUQ7S0FDRjtZQUFTO1FBQ1IsU0FBUyxFQUFFLENBQUM7S0FDYjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLEtBQVksRUFBRSxLQUFZLEVBQUUsVUFBc0MsRUFBRSxPQUFVO0lBQ2hGLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2hELE1BQU0sbUJBQW1CLEdBQUcsQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RELE1BQU0sb0JBQW9CLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ25ELElBQUk7UUFDRixJQUFJLG1CQUFtQixJQUFJLENBQUMsb0JBQW9CLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRTtZQUN6RSxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDekI7UUFDRCxJQUFJLG9CQUFvQixFQUFFO1lBQ3hCLFVBQVUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ25DO1FBQ0QsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ2hEO1lBQVM7UUFDUixJQUFJLG1CQUFtQixJQUFJLENBQUMsb0JBQW9CLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRTtZQUN2RSxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdkI7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FDcEIsS0FBWSxFQUFFLEtBQVksRUFBRSxVQUFnQyxFQUFFLEVBQWUsRUFBRSxPQUFVO0lBQzNGLE1BQU0saUJBQWlCLEdBQUcsZ0JBQWdCLEVBQUUsQ0FBQztJQUM3QyxNQUFNLGFBQWEsR0FBRyxFQUFFLGlCQUFxQixDQUFDO0lBQzlDLElBQUk7UUFDRixnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLElBQUksYUFBYSxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsYUFBYSxFQUFFO1lBQ2pELHVEQUF1RDtZQUN2RCw0REFBNEQ7WUFDNUQsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsc0JBQXNCLEVBQUUsQ0FBQyxDQUFDO1NBQzVFO1FBRUQsTUFBTSxXQUFXLEdBQ2IsYUFBYSxDQUFDLENBQUMsNkJBQW1DLENBQUMsNEJBQWtDLENBQUM7UUFDMUYsUUFBUSxDQUFDLFdBQVcsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUMvQixVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3pCO1lBQVM7UUFDUixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXBDLE1BQU0sWUFBWSxHQUNkLGFBQWEsQ0FBQyxDQUFDLDJCQUFpQyxDQUFDLDBCQUFnQyxDQUFDO1FBQ3RGLFFBQVEsQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDakM7QUFDSCxDQUFDO0FBRUQsMEJBQTBCO0FBQzFCLFlBQVk7QUFDWiwwQkFBMEI7QUFFMUIsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUM1RSxJQUFJLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQzdCLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7UUFDbkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztRQUMvQixLQUFLLElBQUksY0FBYyxHQUFHLEtBQUssRUFBRSxjQUFjLEdBQUcsR0FBRyxFQUFFLGNBQWMsRUFBRSxFQUFFO1lBQ3ZFLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFzQixDQUFDO1lBQzVELElBQUksR0FBRyxDQUFDLGNBQWMsRUFBRTtnQkFDdEIsR0FBRyxDQUFDLGNBQWMsaUJBQXFCLEtBQUssQ0FBQyxjQUFjLENBQUMsRUFBRSxjQUFjLENBQUMsQ0FBQzthQUMvRTtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBR0Q7O0dBRUc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUF5QjtJQUM3RixJQUFJLENBQUMsa0JBQWtCLEVBQUU7UUFBRSxPQUFPO0lBQ2xDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQzlFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyw0QkFBNkIsQ0FBQyw4QkFBK0IsRUFBRTtRQUM3RSw0QkFBNEIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ25EO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsUUFBZSxFQUFFLEtBQXlCLEVBQzFDLG9CQUF1QyxnQkFBZ0I7SUFDekQsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQztJQUNwQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7UUFDdkIsSUFBSSxVQUFVLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLENBQUM7UUFDakMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM3QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDO1lBQzFDLE1BQU0sS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixpQkFBaUIsQ0FDYixLQUE4RCxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQy9FLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwQixRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDaEM7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsR0FBc0I7SUFDOUQsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztJQUV4QixvRkFBb0Y7SUFDcEYscUZBQXFGO0lBQ3JGLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsbUJBQW1CLEVBQUU7UUFDL0MsMkZBQTJGO1FBQzNGLCtDQUErQztRQUMvQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUM7UUFDdkIsT0FBTyxHQUFHLENBQUMsS0FBSyxHQUFHLFdBQVcsb0JBQ0UsU0FBUyxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxhQUFhLEVBQ3BGLEdBQUcsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUNsRTtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUdEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3ZCLElBQWUsRUFBRSxTQUFxQixFQUFFLFVBQXVDLEVBQUUsS0FBYSxFQUM5RixJQUFZLEVBQUUsVUFBMEMsRUFBRSxLQUFnQyxFQUMxRixTQUF3QyxFQUFFLE9BQThCLEVBQ3hFLGVBQXlDO0lBQzNDLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDL0IsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLEdBQUcsS0FBSyxDQUFDO0lBQ2hELDhGQUE4RjtJQUM5RixnR0FBZ0c7SUFDaEcsd0ZBQXdGO0lBQ3hGLE1BQU0saUJBQWlCLEdBQUcsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO0lBQ25ELE1BQU0sU0FBUyxHQUFHLG1CQUFtQixDQUFDLGlCQUFpQixFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDNUUsTUFBTSxNQUFNLEdBQUcsT0FBTyxlQUFlLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBQzNGLE1BQU0sS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFZLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUMvQyxJQUFJLGdCQUFnQixDQUNoQixJQUFJLEVBQVMsbUJBQW1CO1FBQ2hDLFNBQVMsRUFBSSxvQkFBb0I7UUFDakMsVUFBVSxFQUFHLHdDQUF3QztRQUNyRCxJQUFJLEVBQVMseUJBQXlCO1FBQ3RDLFNBQVMsRUFBSSwyQ0FBMkM7UUFDeEQsU0FBUyxFQUFJLHlCQUF5QjtRQUN0QyxnQkFBZ0IsQ0FBQyxTQUFTLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLGlCQUFpQixDQUFDLEVBQUcsZUFBZTtRQUMzRSxpQkFBaUIsRUFBMkMsNkJBQTZCO1FBQ3pGLGlCQUFpQixFQUEyQyw2QkFBNkI7UUFDekYsSUFBSSxFQUFnQywwQ0FBMEM7UUFDOUUsSUFBSSxFQUFnQyw0QkFBNEI7UUFDaEUsSUFBSSxFQUFnQyw0QkFBNEI7UUFDaEUsS0FBSyxFQUErQiw4QkFBOEI7UUFDbEUsS0FBSyxFQUErQixpQ0FBaUM7UUFDckUsSUFBSSxFQUFnQyxnQ0FBZ0M7UUFDcEUsSUFBSSxFQUFnQyxxQ0FBcUM7UUFDekUsSUFBSSxFQUFnQywrQkFBK0I7UUFDbkUsSUFBSSxFQUFnQyxvQ0FBb0M7UUFDeEUsSUFBSSxFQUFnQyw0QkFBNEI7UUFDaEUsSUFBSSxFQUFnQyxpQ0FBaUM7UUFDckUsSUFBSSxFQUFnQyxzQ0FBc0M7UUFDMUUsSUFBSSxFQUFnQyx1QkFBdUI7UUFDM0QsSUFBSSxFQUFnQyxpQ0FBaUM7UUFDckUsSUFBSSxFQUFnQyw2QkFBNkI7UUFDakUsT0FBTyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBRSxFQUFFO1lBQ2xDLFVBQVUsRUFBRSxDQUFDLENBQUMsQ0FBa0IsRUFBRTtZQUNsQyxVQUFVLEVBQXNCLDRDQUE0QztRQUNoRixPQUFPLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUcsa0NBQWtDO1FBQ2xGLElBQUksRUFBNEMsMEJBQTBCO1FBQzFFLE9BQU8sRUFBeUMsa0NBQWtDO1FBQ2xGLE1BQU0sRUFBMEMsMEJBQTBCO1FBQzFFLEtBQUssRUFBMkMsK0JBQStCO1FBQy9FLEtBQUssRUFBMkMsd0JBQXdCO1FBQ3hFLElBQUksQ0FDSCxDQUFDLENBQUM7UUFDUDtZQUNFLElBQUksRUFBRSxJQUFJO1lBQ1YsU0FBUyxFQUFFLFNBQVM7WUFDcEIsUUFBUSxFQUFFLFVBQVU7WUFDcEIsT0FBTyxFQUFFLElBQUk7WUFDYixTQUFTLEVBQUUsU0FBUztZQUNwQixTQUFTLEVBQUUsU0FBUztZQUNwQixJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7WUFDckQsaUJBQWlCLEVBQUUsaUJBQWlCO1lBQ3BDLGlCQUFpQixFQUFFLGlCQUFpQjtZQUNwQyxrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGVBQWUsRUFBRSxJQUFJO1lBQ3JCLGlCQUFpQixFQUFFLEtBQUs7WUFDeEIsb0JBQW9CLEVBQUUsS0FBSztZQUMzQixhQUFhLEVBQUUsSUFBSTtZQUNuQixrQkFBa0IsRUFBRSxJQUFJO1lBQ3hCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsU0FBUyxFQUFFLElBQUk7WUFDZixjQUFjLEVBQUUsSUFBSTtZQUNwQixZQUFZLEVBQUUsSUFBSTtZQUNsQixPQUFPLEVBQUUsSUFBSTtZQUNiLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGlCQUFpQixFQUFFLE9BQU8sVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVU7WUFDL0UsWUFBWSxFQUFFLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7WUFDM0QsVUFBVSxFQUFFLElBQUk7WUFDaEIsT0FBTyxFQUFFLE9BQU87WUFDaEIsTUFBTSxFQUFFLE1BQU07WUFDZCxtQkFBbUIsRUFBRSxLQUFLO1NBQzNCLENBQUM7SUFDTixJQUFJLFNBQVMsRUFBRTtRQUNiLGdHQUFnRztRQUNoRyw0RkFBNEY7UUFDNUYsNkJBQTZCO1FBQzdCLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDcEI7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRCxTQUFTLG1CQUFtQixDQUFDLGlCQUF5QixFQUFFLGlCQUF5QjtJQUMvRSxNQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksY0FBYyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUV4RCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsaUJBQWlCLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUM7S0FDMUQ7SUFFRCxPQUFPLFNBQWtCLENBQUM7QUFDNUIsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFDLElBQVksRUFBRSxLQUFVO0lBQzNDLE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxTQUFTLG9CQUFvQixDQUFDLFFBQWtCLEVBQUUsaUJBQWtDO0lBQ2xGLElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDYixJQUFJLE9BQU8saUJBQWlCLEtBQUssUUFBUSxFQUFFO1lBQ3pDLE1BQU0sV0FBVyxDQUFDLG9DQUFvQyxFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDNUU7YUFBTTtZQUNMLE1BQU0sV0FBVyxDQUFDLHdCQUF3QixFQUFFLGlCQUFpQixDQUFDLENBQUM7U0FDaEU7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsaUJBQWlCLENBQzdCLFFBQW1CLEVBQUUsaUJBQWtDLEVBQ3ZELGFBQWdDO0lBQ2xDLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDbEMsMEZBQTBGO1FBQzFGLE1BQU0sZUFBZSxHQUFHLGFBQWEsS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7UUFDdEUsT0FBTyxRQUFRLENBQUMsaUJBQWlCLENBQUMsaUJBQWlCLEVBQUUsZUFBZSxDQUFDLENBQUM7S0FDdkU7SUFFRCxJQUFJLFFBQVEsR0FBRyxPQUFPLGlCQUFpQixLQUFLLFFBQVEsQ0FBQyxDQUFDO1FBQ2xELFFBQVEsQ0FBQyxhQUFhLENBQUMsaUJBQWlCLENBQUUsQ0FBQyxDQUFDO1FBQzVDLGlCQUFpQixDQUFDO0lBQ3RCLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUUvRCxnR0FBZ0c7SUFDaEcsaUdBQWlHO0lBQ2pHLDBGQUEwRjtJQUMxRiwyREFBMkQ7SUFDM0QsUUFBUSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7SUFFMUIsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFZLEVBQUUsU0FBbUI7SUFDL0QsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEQsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLDBGQUEwRjtRQUMxRiw4RkFBOEY7UUFDOUYsSUFBSSxTQUFTLEVBQUU7WUFDYixNQUFNLENBQUMsTUFBTSxDQUFDLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7U0FDL0M7UUFDRCxRQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0tBQzFCO1NBQU07UUFDTCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBRXZCLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6Qix1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDckU7S0FDRjtBQUNILENBQUM7QUFnQ0QsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsS0FBWSxFQUFFLE9BQXlDLEVBQUUsSUFBZSxFQUFFLEtBQWEsRUFDdkYsS0FBa0IsRUFBRSxLQUF1QjtJQUM3QyxTQUFTLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSyxpRUFBaUU7UUFDakUsc0RBQXNEO1FBQy9FLHdCQUF3QixDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsdUNBQXVDLENBQUMsQ0FBQztJQUM1RixTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsZ0RBQWdELENBQUMsQ0FBQztJQUMvRixTQUFTLElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0lBQy9CLFNBQVMsSUFBSSxPQUFPLElBQUksbUJBQW1CLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzVELElBQUksYUFBYSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekQsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLENBQUM7UUFDckIsSUFBSSxVQUFVLENBQ1YsS0FBSyxFQUFXLGdCQUFnQjtRQUNoQyxJQUFJLEVBQVksa0JBQWtCO1FBQ2xDLEtBQUssRUFBVyxnQkFBZ0I7UUFDaEMsSUFBSSxFQUFZLDZDQUE2QztRQUM3RCxhQUFhLEVBQUcsd0JBQXdCO1FBQ3hDLENBQUMsQ0FBQyxFQUFjLHlCQUF5QjtRQUN6QyxDQUFDLENBQUMsRUFBYyx1QkFBdUI7UUFDdkMsQ0FBQyxDQUFDLEVBQWMsK0JBQStCO1FBQy9DLElBQUksRUFBWSxrQ0FBa0M7UUFDbEQsQ0FBQyxFQUFlLG9CQUFvQjtRQUNwQyxDQUFDLEVBQWUsd0NBQXdDO1FBQ3hELEtBQUssRUFBVyxxQkFBcUI7UUFDckMsS0FBSyxFQUFXLGtFQUFrRTtRQUNsRixJQUFJLEVBQVksY0FBYztRQUM5QixJQUFJLEVBQVkscUNBQXFDO1FBQ3JELFNBQVMsRUFBTyxrREFBa0Q7UUFDbEUsSUFBSSxFQUFZLCtCQUErQjtRQUMvQyxJQUFJLEVBQVksZ0NBQWdDO1FBQ2hELElBQUksRUFBWSwrQkFBK0I7UUFDL0MsSUFBSSxFQUFZLG9CQUFvQjtRQUNwQyxJQUFJLEVBQVksOEJBQThCO1FBQzlDLElBQUksRUFBWSxxQkFBcUI7UUFDckMsT0FBTyxFQUFTLDJDQUEyQztRQUMzRCxJQUFJLEVBQVksNkNBQTZDO1FBQzdELElBQUksRUFBWSxzQkFBc0I7UUFDdEMsSUFBSSxFQUFZLGlDQUFpQztRQUNqRCxTQUFTLEVBQU8sOEJBQThCO1FBQzlDLElBQUksRUFBWSx1QkFBdUI7UUFDdkMsSUFBSSxFQUFZLGtDQUFrQztRQUNsRCxTQUFTLEVBQU8sK0JBQStCO1FBQy9DLENBQVEsRUFBUSxnQ0FBZ0M7UUFDaEQsQ0FBUSxDQUNQLENBQUMsQ0FBQztRQUNQO1lBQ0UsSUFBSTtZQUNKLEtBQUs7WUFDTCxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWE7WUFDYixjQUFjLEVBQUUsQ0FBQyxDQUFDO1lBQ2xCLFlBQVksRUFBRSxDQUFDLENBQUM7WUFDaEIsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsS0FBSyxFQUFFLENBQUM7WUFDUixlQUFlLEVBQUUsQ0FBQztZQUNsQixLQUFLLEVBQUUsS0FBSztZQUNaLEtBQUssRUFBRSxLQUFLO1lBQ1osV0FBVyxFQUFFLElBQUk7WUFDakIsVUFBVSxFQUFFLElBQUk7WUFDaEIsYUFBYSxFQUFFLFNBQVM7WUFDeEIsTUFBTSxFQUFFLElBQUk7WUFDWixPQUFPLEVBQUUsSUFBSTtZQUNiLE1BQU0sRUFBRSxJQUFJO1lBQ1osSUFBSSxFQUFFLElBQUk7WUFDVixjQUFjLEVBQUUsSUFBSTtZQUNwQixLQUFLLEVBQUUsSUFBSTtZQUNYLE1BQU0sRUFBRSxPQUFPO1lBQ2YsVUFBVSxFQUFFLElBQUk7WUFDaEIsTUFBTSxFQUFFLElBQUk7WUFDWixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGNBQWMsRUFBRSxTQUFTO1lBQ3pCLE9BQU8sRUFBRSxJQUFJO1lBQ2Isa0JBQWtCLEVBQUUsSUFBSTtZQUN4QixlQUFlLEVBQUUsU0FBUztZQUMxQixhQUFhLEVBQUUsQ0FBUTtZQUN2QixhQUFhLEVBQUUsQ0FBUTtTQUN4QixDQUFDO0lBQ04sSUFBSSxTQUFTLEVBQUU7UUFDYixnR0FBZ0c7UUFDaEcsNEZBQTRGO1FBQzVGLDZCQUE2QjtRQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBR0QsU0FBUyx1QkFBdUIsQ0FDNUIsYUFBNkMsRUFBRSxlQUF1QixFQUN0RSxTQUErQjtJQUNqQyxLQUFLLElBQUksVUFBVSxJQUFJLGFBQWEsRUFBRTtRQUNwQyxJQUFJLGFBQWEsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDNUMsU0FBUyxHQUFHLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDO1lBQ2hELE1BQU0sWUFBWSxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUUvQyxJQUFJLFNBQVMsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQ3hDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzNEO2lCQUFNO2dCQUNMLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsZUFBZSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7YUFDM0Q7U0FDRjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsK0JBQStCLENBQUMsS0FBWSxFQUFFLEtBQVk7SUFDakUsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7SUFDbkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUMvQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBRTdCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDL0IsTUFBTSxlQUFlLEdBQXFCLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxrQkFBa0IsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDcEYsSUFBSSxXQUFXLEdBQXlCLElBQUksQ0FBQztJQUM3QyxJQUFJLFlBQVksR0FBeUIsSUFBSSxDQUFDO0lBQzlDLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEMsTUFBTSxZQUFZLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBc0IsQ0FBQztRQUN2RCxNQUFNLGVBQWUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQzVDLHFGQUFxRjtRQUNyRixnRkFBZ0Y7UUFDaEYsMkZBQTJGO1FBQzNGLHNDQUFzQztRQUN0QyxNQUFNLGFBQWEsR0FBRyxDQUFDLFVBQVUsS0FBSyxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDckUscUJBQXFCLENBQUMsZUFBZSxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7WUFDcEQsSUFBSSxDQUFDO1FBQ1QsZUFBZSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUNwQyxXQUFXLEdBQUcsdUJBQXVCLENBQUMsZUFBZSxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUN2RSxZQUFZLEdBQUcsdUJBQXVCLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDL0U7SUFFRCxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7UUFDeEIsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZDLEtBQUssQ0FBQyxLQUFLLDBCQUE0QixDQUFDO1NBQ3pDO1FBQ0QsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3ZDLEtBQUssQ0FBQyxLQUFLLDBCQUE0QixDQUFDO1NBQ3pDO0tBQ0Y7SUFFRCxLQUFLLENBQUMsYUFBYSxHQUFHLGVBQWUsQ0FBQztJQUN0QyxLQUFLLENBQUMsTUFBTSxHQUFHLFdBQVcsQ0FBQztJQUMzQixLQUFLLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQztBQUMvQixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsU0FBUyxXQUFXLENBQUMsSUFBWTtJQUMvQixJQUFJLElBQUksS0FBSyxPQUFPO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDekMsSUFBSSxJQUFJLEtBQUssS0FBSztRQUFFLE9BQU8sU0FBUyxDQUFDO0lBQ3JDLElBQUksSUFBSSxLQUFLLFlBQVk7UUFBRSxPQUFPLFlBQVksQ0FBQztJQUMvQyxJQUFJLElBQUksS0FBSyxXQUFXO1FBQUUsT0FBTyxXQUFXLENBQUM7SUFDN0MsSUFBSSxJQUFJLEtBQUssVUFBVTtRQUFFLE9BQU8sVUFBVSxDQUFDO0lBQzNDLElBQUksSUFBSSxLQUFLLFVBQVU7UUFBRSxPQUFPLFVBQVUsQ0FBQztJQUMzQyxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQ25DLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWSxFQUFFLFFBQWdCLEVBQUUsS0FBUSxFQUFFLFFBQW1CLEVBQ3pGLFNBQXFDLEVBQUUsVUFBbUI7SUFDNUQsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBZ0IsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0lBQ2pHLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQXdCLENBQUM7SUFDdEUsSUFBSSxTQUFTLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM3QixJQUFJLFNBQXVDLENBQUM7SUFDNUMsSUFBSSxDQUFDLFVBQVUsSUFBSSxTQUFTLElBQUksSUFBSSxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFO1FBQ3pFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMvRCxJQUFJLGVBQWUsQ0FBQyxLQUFLLENBQUM7WUFBRSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xFLElBQUksU0FBUyxFQUFFO1lBQ2Isc0JBQXNCLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxtQkFBcUIsRUFBRTtRQUMxQyxRQUFRLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRWpDLElBQUksU0FBUyxFQUFFO1lBQ2IsOEJBQThCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxFQUFFO2dCQUN0RCxpRUFBaUU7Z0JBQ2pFLHVCQUF1QixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDekMsT0FBTzthQUNSO1lBQ0QsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7U0FDakM7UUFFRCx1RkFBdUY7UUFDdkYseUVBQXlFO1FBQ3pFLEtBQUssR0FBRyxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLElBQUksRUFBRSxFQUFFLFFBQVEsQ0FBUyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDM0YsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxRQUFRLENBQUMsV0FBVyxDQUFDLE9BQW1CLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVEO2FBQU0sSUFBSSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNwQyxPQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUUsT0FBZSxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDOUMsT0FBZSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSx3QkFBeUIsRUFBRTtRQUM5QyxxREFBcUQ7UUFDckQsc0RBQXNEO1FBQ3RELElBQUksU0FBUyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDckQsdUJBQXVCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzFDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsNkRBQTZEO0FBQzdELFNBQVMsaUJBQWlCLENBQUMsS0FBWSxFQUFFLFNBQWlCO0lBQ3hELFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsTUFBTSxtQkFBbUIsR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkUsSUFBSSxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLHVCQUF5QixDQUFDLEVBQUU7UUFDMUQsbUJBQW1CLENBQUMsS0FBSyxDQUFDLGtCQUFvQixDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxPQUEwQixFQUFFLElBQWUsRUFBRSxRQUFnQixFQUFFLEtBQVU7SUFDekYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsR0FBRyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRCxJQUFJLElBQUksbUJBQXFCLEVBQUU7UUFDN0IsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ2pCLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFFLE9BQW9CLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDMUQsT0FBb0IsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbEY7YUFBTTtZQUNMLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxZQUFZLENBQUUsT0FBb0IsRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztnQkFDbkUsT0FBb0IsQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQzlEO0tBQ0Y7U0FBTTtRQUNMLE1BQU0sV0FBVyxHQUNiLGlCQUFpQixDQUFDLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBVSxFQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUN2RixJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQ2xDLFFBQVEsQ0FBQyxRQUFRLENBQUUsT0FBb0IsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUN2RDthQUFNO1lBQ0osT0FBb0IsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1NBQ2pEO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUNsQyxLQUFZLEVBQUUsT0FBMEIsRUFBRSxJQUFlLEVBQUUsU0FBNkIsRUFDeEYsS0FBVTtJQUNaLElBQUksSUFBSSxHQUFHLENBQUMsb0NBQXdDLENBQUMsRUFBRTtRQUNyRDs7Ozs7OztXQU9HO1FBQ0gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9FO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FDckIsS0FBWSxFQUFFLE9BQTBCLEVBQUUsUUFBZ0IsRUFBRSxLQUFZO0lBQzFFLDhGQUE4RjtJQUM5Riw4RkFBOEY7SUFDOUYsK0ZBQStGO0lBQy9GLDJCQUEyQjtJQUMzQixJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssSUFBSTtRQUFFLE9BQU8sSUFBSSxDQUFDO0lBRXhDLCtGQUErRjtJQUMvRiw0RkFBNEY7SUFDNUYsSUFBSSxlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxRQUFRLElBQUksT0FBTyxJQUFJLGVBQWUsQ0FBQyxRQUFRLENBQUMsRUFBRTtRQUMzRixPQUFPLElBQUksQ0FBQztLQUNiO0lBRUQsMEZBQTBGO0lBQzFGLGdHQUFnRztJQUNoRyxPQUFPLE9BQU8sSUFBSSxLQUFLLFdBQVcsSUFBSSxJQUFJLEtBQUssSUFBSSxJQUFJLENBQUMsQ0FBQyxPQUFPLFlBQVksSUFBSSxDQUFDLENBQUM7QUFDcEYsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsS0FBWSxFQUFFLE9BQW9CO0lBQ2hFLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUM7SUFFOUIsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3ZDLE1BQU0sTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLE1BQU0sS0FBSyxnQkFBZ0I7Z0JBQzNCLE1BQU0sS0FBSyxzQkFBc0IsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRTtnQkFDN0UsT0FBTyxJQUFJLENBQUM7YUFDYjtTQUNGO0tBQ0Y7SUFFRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FBQyxRQUFnQixFQUFFLEtBQVk7SUFDN0QsSUFBSSxPQUFPLEdBQUcsa0JBQWtCLFFBQVEseUNBQXlDLEtBQUssQ0FBQyxLQUFLLElBQUksQ0FBQztJQUNqRyxPQUFPLENBQUMsS0FBSyxDQUFDLGtCQUFrQiw0QkFBbUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUMvRSxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUksS0FBWSxFQUFFLEtBQVksRUFBRSxHQUFvQjtJQUMxRixNQUFNLFNBQVMsR0FBRyxlQUFlLEVBQUcsQ0FBQztJQUNyQyxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsSUFBSSxHQUFHLENBQUMsaUJBQWlCO1lBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUMzRCxTQUFTO1lBQ0wsV0FBVyxDQUNQLGNBQWMsRUFBRSxTQUFTLENBQUMsY0FBYyxFQUN4QywwRkFBMEYsQ0FBQyxDQUFDO1FBQ3BHLDBCQUEwQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxHQUFHLENBQUMsQ0FBQztLQUMxRTtJQUNELE1BQU0sU0FBUyxHQUNYLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLGNBQWMsRUFBRSxTQUF5QixDQUFDLENBQUM7SUFDekYsZUFBZSxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUNsQyxNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDbEQsSUFBSSxNQUFNLEVBQUU7UUFDVixlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ2hDO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXdELEVBQ3BGLFNBQXdCO0lBQzFCLHlGQUF5RjtJQUN6RixXQUFXO0lBQ1gsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLElBQUksYUFBYSxHQUFHLEtBQUssQ0FBQztJQUMxQixJQUFJLGtCQUFrQixFQUFFLEVBQUU7UUFDeEIsTUFBTSxhQUFhLEdBQTZCLHVCQUF1QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0YsTUFBTSxVQUFVLEdBQW1DLFNBQVMsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUMsQ0FBQztRQUV4RixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7WUFDMUIsYUFBYSxHQUFHLElBQUksQ0FBQztZQUNyQixjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUMvRCw4RkFBOEY7WUFDOUYsa0JBQWtCO1lBQ2xCLCtDQUErQztZQUMvQyxtRkFBbUY7WUFDbkYsd0ZBQXdGO1lBQ3hGLGFBQWE7WUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixJQUFJLEdBQUcsQ0FBQyxpQkFBaUI7b0JBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3ZEO1lBQ0QsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7WUFDL0IsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7WUFDcEMsSUFBSSxZQUFZLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUMxRSxTQUFTO2dCQUNMLFVBQVUsQ0FDTixZQUFZLEVBQUUsS0FBSyxDQUFDLGNBQWMsRUFDbEMsMkRBQTJELENBQUMsQ0FBQztZQUVyRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDN0MsTUFBTSxHQUFHLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3Qix3RkFBd0Y7Z0JBQ3hGLGtFQUFrRTtnQkFDbEUsS0FBSyxDQUFDLFdBQVcsR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBRXJFLDBCQUEwQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztnQkFDbkUsbUJBQW1CLENBQUMsWUFBWSxFQUFFLEdBQUcsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFFbkQsSUFBSSxHQUFHLENBQUMsY0FBYyxLQUFLLElBQUk7b0JBQUUsS0FBSyxDQUFDLEtBQUssMkJBQThCLENBQUM7Z0JBQzNFLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLFNBQVMsS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDO29CQUMzRSxLQUFLLENBQUMsS0FBSyw2QkFBOEIsQ0FBQztnQkFFNUMsTUFBTSxjQUFjLEdBQTZCLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNwRSwyRUFBMkU7Z0JBQzNFLHFDQUFxQztnQkFDckMsSUFBSSxDQUFDLGtCQUFrQjtvQkFDbkIsQ0FBQyxjQUFjLENBQUMsV0FBVyxJQUFJLGNBQWMsQ0FBQyxRQUFRLElBQUksY0FBYyxDQUFDLFNBQVMsQ0FBQyxFQUFFO29CQUN2Rix3RkFBd0Y7b0JBQ3hGLDhFQUE4RTtvQkFDOUUsNERBQTREO29CQUM1RCxDQUFDLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDdEUsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2lCQUMzQjtnQkFFRCxJQUFJLENBQUMsdUJBQXVCLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxJQUFJLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRTtvQkFDeEYsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLElBQUksQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUNoRix1QkFBdUIsR0FBRyxJQUFJLENBQUM7aUJBQ2hDO2dCQUVELFlBQVksRUFBRSxDQUFDO2FBQ2hCO1lBRUQsK0JBQStCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQy9DO1FBQ0QsSUFBSSxVQUFVO1lBQUUsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN2RTtJQUNELHdFQUF3RTtJQUN4RSxLQUFLLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNuRSxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFBRSxZQUFvQixFQUFFLGdCQUF3QixFQUN4RixHQUF3QztJQUMxQyxTQUFTLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFMUMsTUFBTSxZQUFZLEdBQUcsR0FBRyxDQUFDLFlBQVksQ0FBQztJQUN0QyxJQUFJLFlBQVksRUFBRTtRQUNoQixJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztRQUNsRCxJQUFJLGtCQUFrQixLQUFLLElBQUksRUFBRTtZQUMvQixrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLEdBQUcsRUFBK0IsQ0FBQztTQUNqRjtRQUNELE1BQU0sV0FBVyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQztRQUNqQyxJQUFJLHNCQUFzQixDQUFDLGtCQUFrQixDQUFDLElBQUksV0FBVyxFQUFFO1lBQzdELCtFQUErRTtZQUMvRSxpRkFBaUY7WUFDakYsaUNBQWlDO1lBQ2pDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztTQUN0QztRQUNELGtCQUFrQixDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsZ0JBQWdCLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDdkU7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILFNBQVMsc0JBQXNCLENBQUMsa0JBQXNDO0lBQ3BFLElBQUksQ0FBQyxHQUFHLGtCQUFrQixDQUFDLE1BQU0sQ0FBQztJQUNsQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7UUFDWixNQUFNLEtBQUssR0FBRyxrQkFBa0IsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3RDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7WUFDMUMsT0FBTyxLQUFLLENBQUM7U0FDZDtLQUNGO0lBQ0QsT0FBTyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBR0Q7O0dBRUc7QUFDSCxTQUFTLHdCQUF3QixDQUM3QixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXlCLEVBQUUsTUFBYTtJQUN0RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDL0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDMUIsOEJBQThCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzlDO0lBRUQsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUvQixNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0lBQzFDLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQXNCLENBQUM7UUFDL0MsTUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRXhDLElBQUksV0FBVyxFQUFFO1lBQ2YsU0FBUyxJQUFJLGVBQWUsQ0FBQyxLQUFLLG1CQUFxQixDQUFDO1lBQ3hELGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFxQixFQUFFLEdBQXdCLENBQUMsQ0FBQztTQUMzRTtRQUVELE1BQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELGVBQWUsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFbEMsSUFBSSxhQUFhLEtBQUssSUFBSSxFQUFFO1lBQzFCLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLGFBQWMsQ0FBQyxDQUFDO1NBQzdFO1FBRUQsSUFBSSxXQUFXLEVBQUU7WUFDZixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ25FLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUM7U0FDcEM7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLDRCQUE0QixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUM1RSxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDL0IsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQztJQUM5QyxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQ2pDLE1BQU0scUJBQXFCLEdBQUcsd0JBQXdCLEVBQUUsQ0FBQztJQUN6RCxJQUFJO1FBQ0YsZ0JBQWdCLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDL0IsS0FBSyxJQUFJLFFBQVEsR0FBRyxLQUFLLEVBQUUsUUFBUSxHQUFHLEdBQUcsRUFBRSxRQUFRLEVBQUUsRUFBRTtZQUNyRCxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBMEIsQ0FBQztZQUMxRCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbEMsd0JBQXdCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDbkMsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLElBQUksRUFBRTtnQkFDN0UsZ0NBQWdDLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ2xEO1NBQ0Y7S0FDRjtZQUFTO1FBQ1IsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNyQix3QkFBd0IsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0tBQ2pEO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGdDQUFnQyxDQUFDLEdBQXNCLEVBQUUsU0FBYztJQUNyRixJQUFJLEdBQUcsQ0FBQyxZQUFZLEtBQUssSUFBSSxFQUFFO1FBQzdCLEdBQUcsQ0FBQyxZQUFhLGlCQUFxQixTQUFTLENBQUMsQ0FBQztLQUNsRDtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLHVCQUF1QixDQUM1QixLQUFZLEVBQUUsUUFBZSxFQUM3QixLQUF3RDtJQUMxRCxTQUFTLElBQUkscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDMUMsU0FBUyxJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUUsd0NBQTJDLENBQUMsQ0FBQztJQUVqRixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7SUFDekMsSUFBSSxPQUFPLEdBQWUsSUFBSSxDQUFDO0lBQy9CLElBQUksUUFBUSxFQUFFO1FBQ1osS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDeEMsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBeUMsQ0FBQztZQUNoRSxJQUFJLDBCQUEwQixDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsU0FBVSxFQUFFLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNuRixPQUFPLElBQUksQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFlBQVksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDM0Qsa0JBQWtCLENBQUMsOEJBQThCLENBQUMsS0FBSyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXJGLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN2QixJQUFJLFNBQVMsRUFBRTt3QkFDYixlQUFlLENBQ1gsS0FBSyxtQkFDTCxJQUFJLEtBQUssQ0FBQyxLQUFLLDRDQUE0Qzs0QkFDdkQsOENBQThDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO3dCQUV4RixJQUFJLEtBQUssQ0FBQyxLQUFLLDBCQUE2Qjs0QkFBRSwyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztxQkFDbEY7b0JBQ0QsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO29CQUNsQyw4REFBOEQ7b0JBQzlELE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ3RCO3FCQUFNO29CQUNMLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7aUJBQ25CO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsT0FBTyxPQUFPLENBQUM7QUFDakIsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsbUJBQW1CLENBQUMsS0FBWSxFQUFFLFNBQWdCO0lBQ2hFLFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxTQUFTLENBQUMsS0FBSywyQkFBOEIsQ0FBQztJQUM5QyxDQUFDLEtBQUssQ0FBQyxVQUFVLElBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDNUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM3QixDQUFDO0FBR0QsOEZBQThGO0FBQzlGLFNBQVMsdUJBQXVCLENBQzVCLEtBQVksRUFBRSxTQUF3QixFQUFFLFVBQW1DO0lBQzdFLElBQUksU0FBUyxFQUFFO1FBQ2IsTUFBTSxVQUFVLEdBQXNCLEtBQUssQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7UUFFaEcsbUZBQW1GO1FBQ25GLCtFQUErRTtRQUMvRSwwQ0FBMEM7UUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtZQUM1QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNDLElBQUksS0FBSyxJQUFJLElBQUk7Z0JBQ2YsTUFBTSxJQUFJLFlBQVksOEJBRWxCLFNBQVMsSUFBSSxtQkFBbUIsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7WUFDdEUsVUFBVSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdEM7S0FDRjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLG1CQUFtQixDQUN4QixZQUFvQixFQUFFLEdBQXdDLEVBQzlELFVBQXdDO0lBQzFDLElBQUksVUFBVSxFQUFFO1FBQ2QsSUFBSSxHQUFHLENBQUMsUUFBUSxFQUFFO1lBQ2hCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDNUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUM7YUFDNUM7U0FDRjtRQUNELElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQztZQUFFLFVBQVUsQ0FBQyxFQUFFLENBQUMsR0FBRyxZQUFZLENBQUM7S0FDeEQ7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxjQUFjLENBQUMsS0FBWSxFQUFFLEtBQWEsRUFBRSxrQkFBMEI7SUFDcEYsU0FBUztRQUNMLGNBQWMsQ0FDVixrQkFBa0IsRUFBRSxLQUFLLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQyxjQUFjLEVBQzdELHNDQUFzQyxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLEtBQUssMkJBQThCLENBQUM7SUFDMUMsZ0VBQWdFO0lBQ2hFLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzdCLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxHQUFHLGtCQUFrQixDQUFDO0lBQ2hELEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQ2hDLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7R0FXRztBQUNILFNBQVMsMEJBQTBCLENBQy9CLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWSxFQUFFLGNBQXNCLEVBQUUsR0FBb0I7SUFDeEYsU0FBUztRQUNMLHdCQUF3QixDQUFDLGNBQWMsRUFBRSxhQUFhLEVBQUUsNEJBQTRCLENBQUMsQ0FBQztJQUMxRixLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztJQUNqQyxNQUFNLGdCQUFnQixHQUNsQixHQUFHLENBQUMsT0FBTyxJQUFJLENBQUUsR0FBMkIsQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQztJQUMxRixNQUFNLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ2pHLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLEdBQUcsbUJBQW1CLENBQUM7SUFDdEQsS0FBSyxDQUFDLGNBQWMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0lBRTVDLDBCQUEwQixDQUN0QixLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFDeEYsR0FBRyxDQUFDLENBQUM7QUFDWCxDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBSSxLQUFZLEVBQUUsU0FBdUIsRUFBRSxHQUFvQjtJQUN2RixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFhLENBQUM7SUFDOUQsTUFBTSxLQUFLLEdBQUcseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFN0MscUZBQXFGO0lBQ3JGLGtGQUFrRjtJQUNsRixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztJQUNoRCxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQy9CLEtBQUssRUFDTCxXQUFXLENBQ1AsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLGdCQUFrQixDQUFDLHFCQUF1QixFQUFFLE1BQU0sRUFDbEYsU0FBeUIsRUFBRSxlQUFlLEVBQUUsZUFBZSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLEVBQ3ZGLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRXJCLHlFQUF5RTtJQUN6RSxnRUFBZ0U7SUFDaEUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxhQUFhLENBQUM7QUFDekMsQ0FBQztBQUVELE1BQU0sVUFBVSx3QkFBd0IsQ0FDcEMsS0FBWSxFQUFFLEtBQVksRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLFNBQXFDLEVBQzNGLFNBQWdDO0lBQ2xDLElBQUksU0FBUyxFQUFFO1FBQ2IsYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFnQixFQUFFLDJDQUEyQyxDQUFDLENBQUM7UUFDcEYsOEJBQThCLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDckMsZUFBZSxDQUNYLEtBQUssbUJBQ0wsZ0NBQWdDLElBQUksMEJBQTBCO1lBQzFELDZEQUE2RCxDQUFDLENBQUM7S0FDeEU7SUFDRCxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFhLENBQUM7SUFDM0QsbUJBQW1CLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2hHLENBQUM7QUFFRCxNQUFNLFVBQVUsbUJBQW1CLENBQy9CLFFBQW1CLEVBQUUsT0FBaUIsRUFBRSxTQUFnQyxFQUFFLE9BQW9CLEVBQzlGLElBQVksRUFBRSxLQUFVLEVBQUUsU0FBcUM7SUFDakUsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1FBQ2pCLFNBQVMsSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNqRCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNoRTtTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzlDLE1BQU0sUUFBUSxHQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBR3ZGLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUMzRDthQUFNO1lBQ0wsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbEQ7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsa0JBQWtCLENBQ3ZCLEtBQVksRUFBRSxjQUFzQixFQUFFLFFBQVcsRUFBRSxHQUFvQixFQUFFLEtBQVksRUFDckYsZ0JBQWtDO0lBQ3BDLE1BQU0sYUFBYSxHQUF1QixnQkFBaUIsQ0FBQyxjQUFjLENBQUMsQ0FBQztJQUM1RSxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7UUFDMUIsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQztRQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sR0FBRztZQUN6QyxNQUFNLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN0QyxNQUFNLFdBQVcsR0FBRyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUN2QyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqQyxJQUFJLFFBQVEsS0FBSyxJQUFJLEVBQUU7Z0JBQ3JCLEdBQUcsQ0FBQyxRQUFTLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDekQ7aUJBQU07Z0JBQ0osUUFBZ0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxLQUFLLENBQUM7YUFDeEM7WUFDRCxJQUFJLFNBQVMsRUFBRTtnQkFDYixNQUFNLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFhLENBQUM7Z0JBQ2pFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDNUU7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7O0dBYUc7QUFDSCxTQUFTLHFCQUFxQixDQUFDLE1BQStCLEVBQUUsS0FBa0I7SUFFaEYsSUFBSSxhQUFhLEdBQXVCLElBQUksQ0FBQztJQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ3ZCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixJQUFJLFFBQVEseUJBQWlDLEVBQUU7WUFDN0MsbURBQW1EO1lBQ25ELENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTO1NBQ1Y7YUFBTSxJQUFJLFFBQVEsc0JBQThCLEVBQUU7WUFDakQscUNBQXFDO1lBQ3JDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTO1NBQ1Y7UUFFRCw0RkFBNEY7UUFDNUYsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRO1lBQUUsTUFBTTtRQUV4QyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBa0IsQ0FBQyxFQUFFO1lBQzdDLElBQUksYUFBYSxLQUFLLElBQUk7Z0JBQUUsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUMvQyxhQUFhLENBQUMsSUFBSSxDQUFDLFFBQWtCLEVBQUUsTUFBTSxDQUFDLFFBQWtCLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBVyxDQUFDLENBQUM7U0FDNUY7UUFFRCxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQ1I7SUFDRCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDO0FBRUQsMEJBQTBCO0FBQzFCLHlCQUF5QjtBQUN6QiwwQkFBMEI7QUFFMUIsK0RBQStEO0FBQy9ELE1BQU0sZUFBZSxHQUFRLE1BQU0sVUFBVyxTQUFRLEtBQUs7Q0FBRyxDQUFDO0FBRS9EOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsVUFBbUMsRUFBRSxXQUFrQixFQUFFLE1BQWdCLEVBQ3pFLEtBQVk7SUFDZCxTQUFTLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDLFNBQVMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuRix1REFBdUQ7SUFDdkQsTUFBTSxVQUFVLEdBQWUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FDcEUsVUFBVSxFQUFJLGNBQWM7SUFDNUIsSUFBSSxFQUFVLHlFQUF5RTtJQUN2RixLQUFLLEVBQVMseUJBQXlCO0lBQ3ZDLFdBQVcsRUFBRyxTQUFTO0lBQ3ZCLElBQUksRUFBVSxPQUFPO0lBQ3JCLENBQUMsRUFBYSxzQ0FBc0M7SUFDcEQsS0FBSyxFQUFTLFNBQVM7SUFDdkIsTUFBTSxFQUFRLFVBQVU7SUFDeEIsSUFBSSxFQUFVLFlBQVk7SUFDMUIsSUFBSSxDQUNQLENBQUM7SUFDRixTQUFTO1FBQ0wsV0FBVyxDQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsdUJBQXVCLEVBQzFDLGdFQUFnRSxDQUFDLENBQUM7SUFDMUUsU0FBUyxJQUFJLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9DLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxTQUFTLG9CQUFvQixDQUFDLEtBQVk7SUFDeEMsS0FBSyxJQUFJLFVBQVUsR0FBRyxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRSxVQUFVLEtBQUssSUFBSSxFQUMvRCxVQUFVLEdBQUcsaUJBQWlCLENBQUMsVUFBVSxDQUFDLEVBQUU7UUFDL0MsS0FBSyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNoRSxNQUFNLGFBQWEsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDcEMsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQzNDLFNBQVMsSUFBSSxhQUFhLENBQUMsYUFBYSxFQUFFLHlCQUF5QixDQUFDLENBQUM7WUFDckUsSUFBSSw0QkFBNEIsQ0FBQyxhQUFhLENBQUMsRUFBRTtnQkFDL0MsV0FBVyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQzthQUM1RjtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7R0FJRztBQUNILFNBQVMsK0JBQStCLENBQUMsS0FBWTtJQUNuRCxLQUFLLElBQUksVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLEVBQy9ELFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQyxJQUFJLENBQUMsVUFBVSxDQUFDLHNCQUFzQixDQUFDO1lBQUUsU0FBUztRQUVsRCxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFFLENBQUM7UUFDNUMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLEVBQUUscURBQXFELENBQUMsQ0FBQztRQUM5RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLFVBQVUsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFFLENBQUM7WUFDbEMsTUFBTSxtQkFBbUIsR0FBRyxVQUFVLENBQUMsTUFBTSxDQUFlLENBQUM7WUFDN0QsU0FBUyxJQUFJLGdCQUFnQixDQUFDLG1CQUFtQixDQUFDLENBQUM7WUFDbkQsbUZBQW1GO1lBQ25GLFdBQVc7WUFDWCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxxQ0FBcUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbEUsMkJBQTJCLENBQUMsbUJBQW1CLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDckQ7WUFDRCwyRkFBMkY7WUFDM0YseUZBQXlGO1lBQ3pGLGdFQUFnRTtZQUNoRSxpRUFBaUU7WUFDakUsVUFBVSxDQUFDLEtBQUssQ0FBQyxzQ0FBc0MsQ0FBQztTQUN6RDtLQUNGO0FBQ0gsQ0FBQztBQUVELGFBQWE7QUFFYjs7OztHQUlHO0FBQ0gsU0FBUyxnQkFBZ0IsQ0FBQyxTQUFnQixFQUFFLGdCQUF3QjtJQUNsRSxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUMzRixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RSx3RkFBd0Y7SUFDeEYsSUFBSSw0QkFBNEIsQ0FBQyxhQUFhLENBQUMsRUFBRTtRQUMvQyxNQUFNLEtBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkMsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxxQ0FBeUMsQ0FBQyxFQUFFO1lBQ3RFLFdBQVcsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7U0FDM0U7YUFBTSxJQUFJLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMzRCx3RkFBd0Y7WUFDeEYsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDekM7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsd0JBQXdCLENBQUMsS0FBWTtJQUM1QyxLQUFLLElBQUksVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLEVBQy9ELFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQyxLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hFLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMscUNBQXFDLEVBQUU7Z0JBQzdELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDM0MsU0FBUyxJQUFJLGFBQWEsQ0FBQyxhQUFhLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDckUsV0FBVyxDQUFDLGFBQWEsRUFBRSxhQUFhLEVBQUUsYUFBYSxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFFLENBQUMsQ0FBQzthQUM1RjtpQkFBTSxJQUFJLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDM0Qsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7YUFDekM7U0FDRjtLQUNGO0lBRUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLGlDQUFpQztJQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsd0ZBQXdGO1lBQ3hGLElBQUksNEJBQTRCLENBQUMsYUFBYSxDQUFDO2dCQUMzQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3BELHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUFnQixFQUFFLGdCQUF3QjtJQUNqRSxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztJQUM1RixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RSxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBQ3JELFVBQVUsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFDSCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQTZCLEtBQVksRUFBRSxpQkFBb0I7SUFDMUYsK0ZBQStGO0lBQy9GLGtHQUFrRztJQUNsRyx5RkFBeUY7SUFDekYsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3JCLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztLQUM5QztTQUFNO1FBQ0wsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0tBQ3ZDO0lBQ0QsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0lBQ3RDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELCtCQUErQjtBQUMvQixxQkFBcUI7QUFDckIsK0JBQStCO0FBRy9COzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUsYUFBYSxDQUFDLEtBQVk7SUFDeEMsT0FBTyxLQUFLLEVBQUU7UUFDWixLQUFLLENBQUMsS0FBSyxDQUFDLGtCQUFvQixDQUFDO1FBQ2pDLE1BQU0sTUFBTSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNyQywyRkFBMkY7UUFDM0YsSUFBSSxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUU7WUFDaEMsT0FBTyxLQUFLLENBQUM7U0FDZDtRQUNELHFCQUFxQjtRQUNyQixLQUFLLEdBQUcsTUFBTyxDQUFDO0tBQ2pCO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBR0Q7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsV0FBd0IsRUFBRSxLQUF1QjtJQUM1RSxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxLQUFLLGtCQUEyQixDQUFDO0lBQ3RFLElBQUksZ0JBQWdCLElBQUksV0FBVyxDQUFDLEtBQUssSUFBSSxjQUFjLEVBQUU7UUFDM0Qsa0RBQWtEO1FBQ2xELDZEQUE2RDtRQUM3RCxXQUFXLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQztRQUMzQixJQUFJLEdBQStCLENBQUM7UUFDcEMsV0FBVyxDQUFDLEtBQUssR0FBRyxJQUFJLE9BQU8sQ0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ3RELFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFO1lBQ3pCLElBQUksV0FBVyxDQUFDLEtBQUssd0JBQWlDLEVBQUU7Z0JBQ3RELFdBQVcsQ0FBQyxLQUFLLElBQUksc0JBQStCLENBQUM7Z0JBQ3JELGVBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQzthQUM5QjtZQUVELElBQUksV0FBVyxDQUFDLEtBQUssdUJBQWdDLEVBQUU7Z0JBQ3JELFdBQVcsQ0FBQyxLQUFLLElBQUkscUJBQThCLENBQUM7Z0JBQ3BELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxhQUFhLENBQUM7Z0JBQ2hELElBQUksYUFBYSxFQUFFO29CQUNqQixhQUFhLENBQUMsWUFBWSxFQUFFLENBQUM7aUJBQzlCO2FBQ0Y7WUFFRCxXQUFXLENBQUMsS0FBSyxHQUFHLGNBQWMsQ0FBQztZQUNuQyxHQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDYixDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlLENBQUMsV0FBd0I7SUFDdEQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3RELE1BQU0sYUFBYSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQUcsZ0JBQWdCLENBQUMsYUFBYSxDQUFFLENBQUM7UUFDL0MsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQzNCLHlCQUF5QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsQ0FBQztLQUN4RTtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUscUJBQXFCLENBQUksS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFVO0lBQzdFLE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0lBQ2hELElBQUksZUFBZSxDQUFDLEtBQUs7UUFBRSxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDbkQsSUFBSTtRQUNGLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDcEQ7SUFBQyxPQUFPLEtBQUssRUFBRTtRQUNkLFdBQVcsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDMUIsTUFBTSxLQUFLLENBQUM7S0FDYjtZQUFTO1FBQ1IsSUFBSSxlQUFlLENBQUMsR0FBRztZQUFFLGVBQWUsQ0FBQyxHQUFHLEVBQUUsQ0FBQztLQUNoRDtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLHVCQUF1QixDQUFDLEtBQVk7SUFDbEQsZUFBZSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQWdCLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFJLEtBQVksRUFBRSxJQUFXLEVBQUUsT0FBVTtJQUM3RSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxJQUFJO1FBQ0YscUJBQXFCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztLQUM3QztZQUFTO1FBQ1IseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQUMsS0FBWTtJQUNuRCx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxJQUFJO1FBQ0YsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDaEM7WUFBUztRQUNSLHlCQUF5QixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2xDO0FBQ0gsQ0FBQztBQUVELFNBQVMsa0JBQWtCLENBQ3ZCLEtBQWtCLEVBQUUsV0FBb0MsRUFBRSxTQUFZO0lBQ3hFLFNBQVMsSUFBSSxhQUFhLENBQUMsV0FBVyxFQUFFLG1EQUFtRCxDQUFDLENBQUM7SUFDN0Ysb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDeEIsV0FBVyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNoQyxDQUFDO0FBR0QsK0JBQStCO0FBQy9CLDhCQUE4QjtBQUM5QiwrQkFBK0I7QUFFL0I7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBb0JHO0FBQ0gsTUFBTSxVQUFVLDRCQUE0QixDQUN4QyxLQUFZLEVBQUUsS0FBWSxFQUFFLFlBQW9CLEVBQUUsWUFBb0IsRUFDdEUsR0FBRyxrQkFBNEI7SUFDakMsOEZBQThGO0lBQzlGLGdHQUFnRztJQUNoRyxrRkFBa0Y7SUFDbEYsSUFBSSxLQUFLLENBQUMsWUFBWSxDQUFDLEtBQUssSUFBSSxFQUFFO1FBQ2hDLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFO1lBQ3ZELE1BQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsQ0FBQztZQUNoRixlQUFlLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQ25DLElBQUksZUFBZSxHQUFHLFlBQVksQ0FBQztZQUNuQyxJQUFJLGtCQUFrQixDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ2pDLGVBQWU7b0JBQ1gsdUJBQXVCLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLENBQUM7YUFDaEY7WUFDRCxLQUFLLENBQUMsWUFBWSxDQUFDLEdBQUcsZUFBZSxDQUFDO1NBQ3ZDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxDQUFDLE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQztBQUU1QyxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBVztJQUNqRCxxRkFBcUY7SUFDckYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUM1RSxDQUFDO0FBRUQsTUFBTSxVQUFVLHVCQUF1QixDQUFDLEtBQVk7SUFDbEQsT0FBTyxLQUFLLENBQUMsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLFVBQWtDLEVBQUUsS0FBWSxFQUFFLEtBQVk7SUFDaEUsNkZBQTZGO0lBQzdGLGtHQUFrRztJQUNsRyxpR0FBaUc7SUFDakcsa0dBQWtHO0lBQ2xHLDBGQUEwRjtJQUMxRixjQUFjO0lBQ2QsSUFBSSxVQUFVLEtBQUssSUFBSSxJQUFJLGNBQWMsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUNyRCxLQUFLLEdBQUcsV0FBVyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUUsQ0FBQztLQUMxQztJQUNELE9BQU8sS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pCLENBQUM7QUFFRCwyQ0FBMkM7QUFDM0MsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFZLEVBQUUsS0FBVTtJQUNsRCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDakMsTUFBTSxZQUFZLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3hFLFlBQVksSUFBSSxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xELENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsS0FBWSxFQUFFLEtBQVksRUFBRSxNQUEwQixFQUFFLFVBQWtCLEVBQUUsS0FBVTtJQUN4RixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRztRQUNsQyxNQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztRQUNwQyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQVcsQ0FBQztRQUMxQyxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsU0FBUyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM5QyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBc0IsQ0FBQztRQUNuRCxJQUFJLEdBQUcsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFO1lBQ3pCLEdBQUcsQ0FBQyxRQUFTLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDekQ7YUFBTTtZQUNMLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDL0I7S0FDRjtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLEtBQWE7SUFDNUUsU0FBUyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUM3RCxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFnQixFQUFFLCtCQUErQixDQUFDLENBQUM7SUFDckYsU0FBUyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5QyxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFpQixDQUFDO0lBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkUsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtmb3JtYXRSdW50aW1lRXJyb3IsIFJ1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7RG9DaGVjaywgT25DaGFuZ2VzLCBPbkluaXR9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtDVVNUT01fRUxFTUVOVFNfU0NIRU1BLCBOT19FUlJPUlNfU0NIRU1BLCBTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGUsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwsIGFzc2VydEluZGV4SW5SYW5nZSwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWUsIGFzc2VydFNhbWUsIGFzc2VydFN0cmluZ30gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtlc2NhcGVDb21tZW50VGV4dH0gZnJvbSAnLi4vLi4vdXRpbC9kb20nO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19yZWZsZWN0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGVGb3JMVmlldywgYXNzZXJ0VE5vZGVGb3JUVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCByZWFkUGF0Y2hlZExWaWV3fSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldEZhY3RvcnlEZWZ9IGZyb20gJy4uL2RlZmluaXRpb25fZmFjdG9yeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHt0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzZXMsIFByb3BlcnR5QWxpYXNWYWx1ZSwgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHNPckZhY3RvcnksIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc1Byb2NlZHVyYWxSZW5kZXJlciwgUmVuZGVyZXIzLCBSZW5kZXJlckZhY3RvcnkzfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdCwgaXNDb250ZW50UXVlcnlIb3N0LCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb3N0QmluZGluZ09wQ29kZXMsIEluaXRQaGFzZVN0YXRlLCBJTkpFQ1RPUiwgTFZpZXcsIExWaWV3RmxhZ3MsIE5FWFQsIFBBUkVOVCwgUkVOREVSRVIsIFJFTkRFUkVSX0ZBQ1RPUlksIFJvb3RDb250ZXh0LCBSb290Q29udGV4dEZsYWdzLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNILCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0UHVyZVROb2RlVHlwZSwgYXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge3VwZGF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzSW5saW5lVGVtcGxhdGUsIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtwcm9maWxlciwgUHJvZmlsZXJFdmVudH0gZnJvbSAnLi4vcHJvZmlsZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBnZXRDdXJyZW50UGFyZW50VE5vZGUsIGdldEN1cnJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaywgZ2V0U2VsZWN0ZWRJbmRleCwgaXNDdXJyZW50VE5vZGVQYXJlbnQsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGlzSW5JMThuQmxvY2ssIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0Q3VycmVudFROb2RlLCBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7aXNBbmltYXRpb25Qcm9wLCBtZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TFZpZXdQYXJlbnQsIGdldE5leHRMQ29udGFpbmVyfSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBpc0NyZWF0aW9uTW9kZSwgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwTFZpZXcsIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudCwgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHthdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCwgY2xvbmVUb1RWaWV3RGF0YSwgTENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZURlYnVnLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gKCgpID0+IFByb21pc2UucmVzb2x2ZShudWxsKSkoKTtcblxuLyoqXG4gKiBJbnZva2UgYEhvc3RCaW5kaW5nc0Z1bmN0aW9uYHMgZm9yIHZpZXcuXG4gKlxuICogVGhpcyBtZXRob2RzIGV4ZWN1dGVzIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLiBJdCBpcyB1c2VkIHRvIGV4ZWN1dGUgdGhlXG4gKiBgSG9zdEJpbmRpbmdzRnVuY3Rpb25gcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzO1xuICBpZiAoaG9zdEJpbmRpbmdPcENvZGVzID09PSBudWxsKSByZXR1cm47XG4gIHRyeSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0QmluZGluZ09wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IGhvc3RCaW5kaW5nT3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIGFyZSBlbGVtZW50IGluZGV4ZXMuXG4gICAgICAgIHNldFNlbGVjdGVkSW5kZXgofm9wQ29kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBQb3NpdGl2ZSBudW1iZXJzIGFyZSBOdW1iZXJUdXBsZSB3aGljaCBzdG9yZSBiaW5kaW5nUm9vdEluZGV4IGFuZCBkaXJlY3RpdmVJbmRleC5cbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gb3BDb2RlO1xuICAgICAgICBjb25zdCBiaW5kaW5nUm9vdEluZHggPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IGhvc3RCaW5kaW5nRm4gPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+O1xuICAgICAgICBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyhiaW5kaW5nUm9vdEluZHgsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tkaXJlY3RpdmVJZHhdO1xuICAgICAgICBob3N0QmluZGluZ0ZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICB9XG59XG5cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYsICdEaXJlY3RpdmVEZWYgbm90IGZvdW5kLicpO1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuLyoqIFJlbmRlcnMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3IChjcmVhdGlvbiBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlbmRlckNoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZW5kZXJDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3fG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVHxudWxsLCBmbGFnczogTFZpZXdGbGFncywgaG9zdDogUkVsZW1lbnR8bnVsbCxcbiAgICB0SG9zdE5vZGU6IFROb2RlfG51bGwsIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5M3xudWxsLCByZW5kZXJlcjogUmVuZGVyZXIzfG51bGwsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJ8bnVsbCwgaW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIG5nRGV2TW9kZSA/IGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCh0VmlldykgOiB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgdFZpZXcuZGVjbFROb2RlICYmIHBhcmVudExWaWV3ICYmIGFzc2VydFROb2RlRm9yTFZpZXcodFZpZXcuZGVjbFROb2RlLCBwYXJlbnRMVmlldyk7XG4gIGxWaWV3W1BBUkVOVF0gPSBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IHBhcmVudExWaWV3O1xuICBsVmlld1tDT05URVhUXSA9IGNvbnRleHQ7XG4gIGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldID0gKHJlbmRlcmVyRmFjdG9yeSB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl9GQUNUT1JZXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSwgJ1JlbmRlcmVyRmFjdG9yeSBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tSRU5ERVJFUl0gPSAocmVuZGVyZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJdKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSXSwgJ1JlbmRlcmVyIGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1NBTklUSVpFUl0gPSBzYW5pdGl6ZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbU0FOSVRJWkVSXSB8fCBudWxsITtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICBsVmlld1tUX0hPU1RdID0gdEhvc3ROb2RlO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHRWaWV3LnR5cGUgPT0gVFZpZXdUeXBlLkVtYmVkZGVkID8gcGFyZW50TFZpZXcgIT09IG51bGwgOiB0cnVlLCB0cnVlLFxuICAgICAgICAgICdFbWJlZGRlZCB2aWV3cyBtdXN0IGhhdmUgcGFyZW50TFZpZXcnKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddID1cbiAgICAgIHRWaWV3LnR5cGUgPT0gVFZpZXdUeXBlLkVtYmVkZGVkID8gcGFyZW50TFZpZXchW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA6IGxWaWV3O1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudHxUTm9kZVR5cGUuVGV4dCwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3UsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTpcbiAgICBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZUSWN1Q29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIC8vIEtlZXAgdGhpcyBmdW5jdGlvbiBzaG9ydCwgc28gdGhhdCB0aGUgVk0gd2lsbCBpbmxpbmUgaXQuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQdXJlVE5vZGVUeXBlKHR5cGUpO1xuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09PSBudWxsKSB7XG4gICAgdE5vZGUgPSBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIGluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gICAgaWYgKGlzSW5JMThuQmxvY2soKSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGluIGkxOG4gYmxvY2sgdGhlbiBhbGwgZWxlbWVudHMgc2hvdWxkIGJlIHByZSBkZWNsYXJlZCB0aHJvdWdoIGBQbGFjZWhvbGRlcmBcbiAgICAgIC8vIFNlZSBgVE5vZGVUeXBlLlBsYWNlaG9sZGVyYCBhbmQgYExGcmFtZS5pbkkxOG5gIGZvciBtb3JlIGNvbnRleHQuXG4gICAgICAvLyBJZiB0aGUgYFROb2RlYCB3YXMgbm90IHByZS1kZWNsYXJlZCB0aGFuIGl0IG1lYW5zIGl0IHdhcyBub3QgbWVudGlvbmVkIHdoaWNoIG1lYW5zIGl0IHdhc1xuICAgICAgLy8gcmVtb3ZlZCwgc28gd2UgbWFyayBpdCBhcyBkZXRhY2hlZC5cbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5QbGFjZWhvbGRlcikge1xuICAgIHROb2RlLnR5cGUgPSB0eXBlO1xuICAgIHROb2RlLnZhbHVlID0gbmFtZTtcbiAgICB0Tm9kZS5hdHRycyA9IGF0dHJzO1xuICAgIGNvbnN0IHBhcmVudCA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBwYXJlbnQgPT09IG51bGwgPyAtMSA6IHBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHROb2RlLCB0Vmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGluZGV4LCB0Tm9kZS5pbmRleCwgJ0V4cGVjdGluZyBzYW1lIGluZGV4Jyk7XG4gIH1cbiAgc2V0Q3VycmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICYgVFByb2plY3Rpb25Ob2RlICZcbiAgICAgIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpIHtcbiAgY29uc3QgY3VycmVudFROb2RlID0gZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaygpO1xuICBjb25zdCBpc1BhcmVudCA9IGlzQ3VycmVudFROb2RlUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9IGlzUGFyZW50ID8gY3VycmVudFROb2RlIDogY3VycmVudFROb2RlICYmIGN1cnJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLlxuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUsIHR5cGUsIGluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChjdXJyZW50VE5vZGUgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIC8vIEZJWE1FKG1pc2tvKTogVGhpcyBsb2dpYyBsb29rcyB1bm5lY2Vzc2FyaWx5IGNvbXBsaWNhdGVkLiBDb3VsZCB3ZSBzaW1wbGlmeT9cbiAgICAgIGlmIChjdXJyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJiB0Tm9kZS5wYXJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgICAgY3VycmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50VE5vZGUubmV4dCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiB0aGUgY2FzZSBvZiBpMThuIHRoZSBgY3VycmVudFROb2RlYCBtYXkgYWxyZWFkeSBiZSBsaW5rZWQsIGluIHdoaWNoIGNhc2Ugd2UgZG9uJ3Qgd2FudFxuICAgICAgICAvLyB0byBicmVhayB0aGUgbGlua3Mgd2hpY2ggaTE4biBjcmVhdGVkLlxuICAgICAgICBjdXJyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIGFzc29jaWF0ZWQgd2l0aCBgTFZpZXdgXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgY29udGFpbmluZyB0aGUgYmx1ZXByaW50IHRvIGFkanVzdFxuICogQHBhcmFtIG51bVNsb3RzVG9BbGxvYyBUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIGluIHRoZSBMVmlldywgc2hvdWxkIGJlID4wXG4gKiBAcGFyYW0gaW5pdGlhbFZhbHVlIEluaXRpYWwgdmFsdWUgdG8gc3RvcmUgaW4gYmx1ZXByaW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIG51bVNsb3RzVG9BbGxvYzogbnVtYmVyLCBpbml0aWFsVmFsdWU6IGFueSk6IG51bWJlciB7XG4gIGlmIChudW1TbG90c1RvQWxsb2MgPT09IDApIHJldHVybiAtMTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gICAgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBtdXN0IGJlIGFzc29jaWF0ZWQgd2l0aCBgVFZpZXdgIScpO1xuICAgIGFzc2VydEVxdWFsKHRWaWV3LmRhdGEubGVuZ3RoLCBsVmlldy5sZW5ndGgsICdFeHBlY3RpbmcgTFZpZXcgdG8gYmUgc2FtZSBzaXplIGFzIFRWaWV3Jyk7XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHRWaWV3LmRhdGEubGVuZ3RoLCB0Vmlldy5ibHVlcHJpbnQubGVuZ3RoLCAnRXhwZWN0aW5nIEJsdWVwcmludCB0byBiZSBzYW1lIHNpemUgYXMgVFZpZXcnKTtcbiAgICBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICB9XG4gIGNvbnN0IGFsbG9jSWR4ID0gbFZpZXcubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzVG9BbGxvYzsgaSsrKSB7XG4gICAgbFZpZXcucHVzaChpbml0aWFsVmFsdWUpO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKGluaXRpYWxWYWx1ZSk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICB9XG4gIHJldHVybiBhbGxvY0lkeDtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB0aGUgY3JlYXRpb24gbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBjcmVhdGluZyB2aWV3IHF1ZXJ5IGZ1bmN0aW9ucyAoaWYgYW55KTtcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdGhlIGNyZWF0aW9uIG1vZGU7XG4gKiAtIHVwZGF0aW5nIHN0YXRpYyBxdWVyaWVzIChpZiBhbnkpO1xuICogLSBjcmVhdGluZyBjaGlsZCBjb21wb25lbnRzIGRlZmluZWQgaW4gYSBnaXZlbiB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVmlldzxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGVudGVyVmlldyhsVmlldyk7XG4gIHRyeSB7XG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBhIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHZpZXcsIGlmIGl0IGV4aXN0cy4gQSB0ZW1wbGF0ZSBmdW5jdGlvbiBtaWdodCBub3QgYmVcbiAgICAvLyBkZWZpbmVkIGZvciB0aGUgcm9vdCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgdGVtcGxhdGVGbiA9IHRWaWV3LnRlbXBsYXRlO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHMuXG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAvLyBvZmYgZmlyc3RDcmVhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXZSByZXNvbHZlIGNvbnRlbnQgcXVlcmllcyBzcGVjaWZpY2FsbHkgbWFya2VkIGFzIGBzdGF0aWNgIGluIGNyZWF0aW9uIG1vZGUuIER5bmFtaWNcbiAgICAvLyBjb250ZW50IHF1ZXJpZXMgYXJlIHJlc29sdmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIChpLmUuIHVwZGF0ZSBtb2RlKSwgYWZ0ZXIgZW1iZWRkZWRcbiAgICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICAgIGlmICh0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcykge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gV2UgbXVzdCBtYXRlcmlhbGl6ZSBxdWVyeSByZXN1bHRzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRzIGFyZSBwcm9jZXNzZWRcbiAgICAvLyBpbiBjYXNlIGEgY2hpbGQgY29tcG9uZW50IGhhcyBwcm9qZWN0ZWQgYSBjb250YWluZXIuIFRoZSBMQ29udGFpbmVyIG5lZWRzXG4gICAgLy8gdG8gZXhpc3Qgc28gdGhlIGVtYmVkZGVkIHZpZXdzIGFyZSBwcm9wZXJseSBhdHRhY2hlZCBieSB0aGUgY29udGFpbmVyLlxuICAgIGlmICh0Vmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgdFZpZXcudmlld1F1ZXJ5ISwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgbWFuYWdlIHRvIGdldCBwYXN0IHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGR1ZSB0b1xuICAgIC8vIGFuIGVycm9yLCBtYXJrIHRoZSB2aWV3IGFzIGNvcnJ1cHRlZCBzbyB3ZSBjYW4gdHJ5IHRvIHJlY292ZXIuXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuaW5jb21wbGV0ZUZpcnN0UGFzcyA9IHRydWU7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuICBlbnRlclZpZXcobFZpZXcpO1xuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGV4ZWN1dGUgbGlmZWN5Y2xlIGhvb2tzIGluIHRoYXQgbW9kZS5cbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlyc3QgbWFyayB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBhcmUgZGVjbGFyZWQgaW4gdGhpcyBsVmlldyBhcyBuZWVkaW5nIGEgcmVmcmVzaCBhdCB0aGVpclxuICAgIC8vIGluc2VydGlvbiBwb2ludHMuIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlIHRlbXBsYXRlIGlzIGRlZmluZWQgaW4gdGhpc1xuICAgIC8vIGBMVmlld2AgYnV0IGl0cyBkZWNsYXJhdGlvbiBhcHBlYXJzIGFmdGVyIHRoZSBpbnNlcnRpb24gY29tcG9uZW50LlxuICAgIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXcpO1xuICAgIHJlZnJlc2hFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gICAgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXIsIC0xKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBub3JtYWxFeGVjdXRpb25QYXRoID0gIWlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlSXNBY3RpdmUgPSBpc0NyZWF0aW9uTW9kZShsVmlldyk7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuICAgIGlmIChjcmVhdGlvbk1vZGVJc0FjdGl2ZSkge1xuICAgICAgcmVuZGVyVmlldyh0VmlldywgbFZpZXcsIGNvbnRleHQpO1xuICAgIH1cbiAgICByZWZyZXNoVmlldyh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHJmOiBSZW5kZXJGbGFncywgY29udGV4dDogVCkge1xuICBjb25zdCBwcmV2U2VsZWN0ZWRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgaXNVcGRhdGVQaGFzZSA9IHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlO1xuICB0cnkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIGlmIChpc1VwZGF0ZVBoYXNlICYmIGxWaWV3Lmxlbmd0aCA+IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIFdoZW4gd2UncmUgdXBkYXRpbmcsIGluaGVyZW50bHkgc2VsZWN0IDAgc28gd2UgZG9uJ3RcbiAgICAgIC8vIGhhdmUgdG8gZ2VuZXJhdGUgdGhhdCBpbnN0cnVjdGlvbiBmb3IgbW9zdCB1cGRhdGUgYmxvY2tzLlxuICAgICAgc2VsZWN0SW5kZXhJbnRlcm5hbCh0VmlldywgbFZpZXcsIEhFQURFUl9PRkZTRVQsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKSk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJlSG9va1R5cGUgPVxuICAgICAgICBpc1VwZGF0ZVBoYXNlID8gUHJvZmlsZXJFdmVudC5UZW1wbGF0ZVVwZGF0ZVN0YXJ0IDogUHJvZmlsZXJFdmVudC5UZW1wbGF0ZUNyZWF0ZVN0YXJ0O1xuICAgIHByb2ZpbGVyKHByZUhvb2tUeXBlLCBjb250ZXh0KTtcbiAgICB0ZW1wbGF0ZUZuKHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcblxuICAgIGNvbnN0IHBvc3RIb29rVHlwZSA9XG4gICAgICAgIGlzVXBkYXRlUGhhc2UgPyBQcm9maWxlckV2ZW50LlRlbXBsYXRlVXBkYXRlRW5kIDogUHJvZmlsZXJFdmVudC5UZW1wbGF0ZUNyZWF0ZUVuZDtcbiAgICBwcm9maWxlcihwb3N0SG9va1R5cGUsIGNvbnRleHQpO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSk7XG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgPT09IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSB7XG4gICAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgY29uc3QgdFZpZXcgPSBkZWYudFZpZXc7XG5cbiAgLy8gQ3JlYXRlIGEgVFZpZXcgaWYgdGhlcmUgaXNuJ3Qgb25lLCBvciByZWNyZWF0ZSBpdCBpZiB0aGUgZmlyc3QgY3JlYXRlIHBhc3MgZGlkbid0XG4gIC8vIGNvbXBsZXRlIHN1Y2Nlc3NmdWxseSBzaW5jZSB3ZSBjYW4ndCBrbm93IGZvciBzdXJlIHdoZXRoZXIgaXQncyBpbiBhIHVzYWJsZSBzaGFwZS5cbiAgaWYgKHRWaWV3ID09PSBudWxsIHx8IHRWaWV3LmluY29tcGxldGVGaXJzdFBhc3MpIHtcbiAgICAvLyBEZWNsYXJhdGlvbiBub2RlIGhlcmUgaXMgbnVsbCBzaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHdlIGR5bmFtaWNhbGx5IGNyZWF0ZSBhXG4gICAgLy8gY29tcG9uZW50IGFuZCBoZW5jZSB0aGVyZSBpcyBubyBkZWNsYXJhdGlvbi5cbiAgICBjb25zdCBkZWNsVE5vZGUgPSBudWxsO1xuICAgIHJldHVybiBkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgIFRWaWV3VHlwZS5Db21wb25lbnQsIGRlY2xUTm9kZSwgZGVmLnRlbXBsYXRlLCBkZWYuZGVjbHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICAgICAgIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSwgZGVmLnNjaGVtYXMsIGRlZi5jb25zdHMpO1xuICB9XG5cbiAgcmV0dXJuIHRWaWV3O1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHR5cGUgVHlwZSBvZiBgVFZpZXdgLlxuICogQHBhcmFtIGRlY2xUTm9kZSBEZWNsYXJhdGlvbiBsb2NhdGlvbiBvZiB0aGlzIGBUVmlld2AuXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcmllcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gc2NoZW1hcyBTY2hlbWFzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBjb25zdHMgQ29uc3RhbnRzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHR5cGU6IFRWaWV3VHlwZSwgZGVjbFROb2RlOiBUTm9kZXxudWxsLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fG51bGwsIGRlY2xzOiBudW1iZXIsXG4gICAgdmFyczogbnVtYmVyLCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICBjb25zdHNPckZhY3Rvcnk6IFRDb25zdGFudHNPckZhY3Rvcnl8bnVsbCk6IFRWaWV3IHtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50VmlldysrO1xuICBjb25zdCBiaW5kaW5nU3RhcnRJbmRleCA9IEhFQURFUl9PRkZTRVQgKyBkZWNscztcbiAgLy8gVGhpcyBsZW5ndGggZG9lcyBub3QgeWV0IGNvbnRhaW4gaG9zdCBiaW5kaW5ncyBmcm9tIGNoaWxkIGRpcmVjdGl2ZXMgYmVjYXVzZSBhdCB0aGlzIHBvaW50LFxuICAvLyB3ZSBkb24ndCBrbm93IHdoaWNoIGRpcmVjdGl2ZXMgYXJlIGFjdGl2ZSBvbiB0aGlzIHRlbXBsYXRlLiBBcyBzb29uIGFzIGEgZGlyZWN0aXZlIGlzIG1hdGNoZWRcbiAgLy8gdGhhdCBoYXMgYSBob3N0IGJpbmRpbmcsIHdlIHdpbGwgdXBkYXRlIHRoZSBibHVlcHJpbnQgd2l0aCB0aGF0IGRlZidzIGhvc3RWYXJzIGNvdW50LlxuICBjb25zdCBpbml0aWFsVmlld0xlbmd0aCA9IGJpbmRpbmdTdGFydEluZGV4ICsgdmFycztcbiAgY29uc3QgYmx1ZXByaW50ID0gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleCwgaW5pdGlhbFZpZXdMZW5ndGgpO1xuICBjb25zdCBjb25zdHMgPSB0eXBlb2YgY29uc3RzT3JGYWN0b3J5ID09PSAnZnVuY3Rpb24nID8gY29uc3RzT3JGYWN0b3J5KCkgOiBjb25zdHNPckZhY3Rvcnk7XG4gIGNvbnN0IHRWaWV3ID0gYmx1ZXByaW50W1RWSUVXIGFzIGFueV0gPSBuZ0Rldk1vZGUgP1xuICAgICAgbmV3IFRWaWV3Q29uc3RydWN0b3IoXG4gICAgICAgICAgdHlwZSwgICAgICAgIC8vIHR5cGU6IFRWaWV3VHlwZSxcbiAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAvLyBxdWVyaWVzOiBUUXVlcmllc3xudWxsXG4gICAgICAgICAgdmlld1F1ZXJ5LCAgIC8vIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjx7fT58bnVsbCxcbiAgICAgICAgICBkZWNsVE5vZGUsICAgLy8gZGVjbFROb2RlOiBUTm9kZXxudWxsLFxuICAgICAgICAgIGNsb25lVG9UVmlld0RhdGEoYmx1ZXByaW50KS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSwgIC8vIGRhdGE6IFREYXRhLFxuICAgICAgICAgIGJpbmRpbmdTdGFydEluZGV4LCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgaW5pdGlhbFZpZXdMZW5ndGgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZXhwYW5kb1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBob3N0QmluZGluZ09wQ29kZXM6IEhvc3RCaW5kaW5nT3BDb2RlcyxcbiAgICAgICAgICB0cnVlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENyZWF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3RVcGRhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0YXRpY1ZpZXdRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZU9yZGVySG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250ZW50Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZGVzdHJveUhvb2tzOiBEZXN0cm95SG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjbGVhbnVwOiBhbnlbXXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnRRdWVyaWVzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbXBvbmVudHM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyAgLy9cbiAgICAgICAgICAgICAgZGlyZWN0aXZlcygpIDogICAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICBkaXJlY3RpdmVzLCAgICAgICAgICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLCAgLy8gcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsXG4gICAgICAgICAgc2NoZW1hcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgICAgICAgIGNvbnN0cywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnN0czogVENvbnN0YW50c3xudWxsXG4gICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5jb21wbGV0ZUZpcnN0UGFzczogYm9vbGVhblxuICAgICAgICAgIGRlY2xzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5nRGV2TW9kZSBvbmx5OiBkZWNsc1xuICAgICAgICAgIHZhcnMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5nRGV2TW9kZSBvbmx5OiB2YXJzXG4gICAgICAgICAgKSA6XG4gICAgICB7XG4gICAgICAgIHR5cGU6IHR5cGUsXG4gICAgICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVGbixcbiAgICAgICAgcXVlcmllczogbnVsbCxcbiAgICAgICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgICAgIGRlY2xUTm9kZTogZGVjbFROb2RlLFxuICAgICAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgICAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgICAgIGhvc3RCaW5kaW5nT3BDb2RlczogbnVsbCxcbiAgICAgICAgZmlyc3RDcmVhdGVQYXNzOiB0cnVlLFxuICAgICAgICBmaXJzdFVwZGF0ZVBhc3M6IHRydWUsXG4gICAgICAgIHN0YXRpY1ZpZXdRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgc3RhdGljQ29udGVudFF1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBwcmVPcmRlckhvb2tzOiBudWxsLFxuICAgICAgICBwcmVPcmRlckNoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdIb29rczogbnVsbCxcbiAgICAgICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICAgICAgY2xlYW51cDogbnVsbCxcbiAgICAgICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgICAgICBmaXJzdENoaWxkOiBudWxsLFxuICAgICAgICBzY2hlbWFzOiBzY2hlbWFzLFxuICAgICAgICBjb25zdHM6IGNvbnN0cyxcbiAgICAgICAgaW5jb21wbGV0ZUZpcnN0UGFzczogZmFsc2VcbiAgICAgIH07XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGUgdFZpZXcgcmV0YWlucyB0aGUgc2FtZSBzaGFwZSBkdXJpbmcgcnVudGltZS5cbiAgICAvLyAoVG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZSBjb2RlIGlzIG1vbm9tb3JwaGljLikgRm9yIHRoaXMgcmVhc29uIHdlIHNlYWwgdGhlIG9iamVjdCB0b1xuICAgIC8vIHByZXZlbnQgY2xhc3MgdHJhbnNpdGlvbnMuXG4gICAgT2JqZWN0LnNlYWwodFZpZXcpO1xuICB9XG4gIHJldHVybiB0Vmlldztcbn1cblxuZnVuY3Rpb24gY3JlYXRlVmlld0JsdWVwcmludChiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLCBpbml0aWFsVmlld0xlbmd0aDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBibHVlcHJpbnQgPSBuZ0Rldk1vZGUgPyBuZXcgTFZpZXdCbHVlcHJpbnQoKSA6IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbFZpZXdMZW5ndGg7IGkrKykge1xuICAgIGJsdWVwcmludC5wdXNoKGkgPCBiaW5kaW5nU3RhcnRJbmRleCA/IG51bGwgOiBOT19DSEFOR0UpO1xuICB9XG5cbiAgcmV0dXJuIGJsdWVwcmludCBhcyBMVmlldztcbn1cblxuZnVuY3Rpb24gY3JlYXRlRXJyb3IodGV4dDogc3RyaW5nLCB0b2tlbjogYW55KSB7XG4gIHJldHVybiBuZXcgRXJyb3IoYFJlbmRlcmVyOiAke3RleHR9IFske3N0cmluZ2lmeUZvckVycm9yKHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIGFzc2VydEhvc3ROb2RlRXhpc3RzKHJFbGVtZW50OiBSRWxlbWVudCwgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50fHN0cmluZykge1xuICBpZiAoIXJFbGVtZW50KSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgcmVuZGVyZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbmNhcHN1bGF0aW9uIFZpZXcgRW5jYXBzdWxhdGlvbiBkZWZpbmVkIGZvciBjb21wb25lbnQgdGhhdCByZXF1ZXN0cyBob3N0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnR8c3RyaW5nLFxuICAgIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uKTogUkVsZW1lbnQge1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgLy8gV2hlbiB1c2luZyBuYXRpdmUgU2hhZG93IERPTSwgZG8gbm90IGNsZWFyIGhvc3QgZWxlbWVudCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uXG4gICAgY29uc3QgcHJlc2VydmVDb250ZW50ID0gZW5jYXBzdWxhdGlvbiA9PT0gVmlld0VuY2Fwc3VsYXRpb24uU2hhZG93RG9tO1xuICAgIHJldHVybiByZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvciwgcHJlc2VydmVDb250ZW50KTtcbiAgfVxuXG4gIGxldCByRWxlbWVudCA9IHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycgP1xuICAgICAgcmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikhIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SG9zdE5vZGVFeGlzdHMockVsZW1lbnQsIGVsZW1lbnRPclNlbGVjdG9yKTtcblxuICAvLyBBbHdheXMgY2xlYXIgaG9zdCBlbGVtZW50J3MgY29udGVudCB3aGVuIFJlbmRlcmVyMyBpcyBpbiB1c2UuIEZvciBwcm9jZWR1cmFsIHJlbmRlcmVyIGNhc2Ugd2VcbiAgLy8gbWFrZSBpdCBkZXBlbmQgb24gd2hldGhlciBTaGFkb3dEb20gZW5jYXBzdWxhdGlvbiBpcyB1c2VkIChpbiB3aGljaCBjYXNlIHRoZSBjb250ZW50IHNob3VsZCBiZVxuICAvLyBwcmVzZXJ2ZWQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvbikuIFNoYWRvd0RvbSBlbmNhcHN1bGF0aW9uIHJlcXVpcmVzIHByb2NlZHVyYWxcbiAgLy8gcmVuZGVyZXIsIGFuZCBwcm9jZWR1cmFsIHJlbmRlcmVyIGNhc2UgaXMgaGFuZGxlZCBhYm92ZS5cbiAgckVsZW1lbnQudGV4dENvbnRlbnQgPSAnJztcblxuICByZXR1cm4gckVsZW1lbnQ7XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKlxuICogVGhpcyBmdW5jdGlvbiBjYW4gYWxzbyBiZSB1c2VkIHRvIHN0b3JlIGluc3RhbmNlIHNwZWNpZmljIGNsZWFudXAgZm5zLiBJbiB0aGF0IGNhc2UgdGhlIGBjb250ZXh0YFxuICogaXMgYG51bGxgIGFuZCB0aGUgZnVuY3Rpb24gaXMgc3RvcmUgaW4gYExWaWV3YCAocmF0aGVyIHRoYW4gaXQgYFRWaWV3YCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAobFZpZXcpO1xuICBpZiAoY29udGV4dCA9PT0gbnVsbCkge1xuICAgIC8vIElmIGNvbnRleHQgaXMgbnVsbCB0aGF0IHRoaXMgaXMgaW5zdGFuY2Ugc3BlY2lmaWMgY2FsbGJhY2suIFRoZXNlIGNhbGxiYWNrcyBjYW4gb25seSBiZVxuICAgIC8vIGluc2VydGVkIGFmdGVyIHRlbXBsYXRlIHNoYXJlZCBpbnN0YW5jZXMuIEZvciB0aGlzIHJlYXNvbiBpbiBuZ0Rldk1vZGUgd2UgZnJlZXplIHRoZSBUVmlldy5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBPYmplY3QuZnJlZXplKGdldE9yQ3JlYXRlVFZpZXdDbGVhbnVwKHRWaWV3KSk7XG4gICAgfVxuICAgIGxDbGVhbnVwLnB1c2goY2xlYW51cEZuKTtcbiAgfSBlbHNlIHtcbiAgICBsQ2xlYW51cC5wdXNoKGNvbnRleHQpO1xuXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGlzIGBUTm9kZWAgYmVsb25ncyAodXNlZCBvbmx5IGluIGBuZ0Rldk1vZGVgKVxuICogQHBhcmFtIHRQYXJlbnQgUGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEBwYXJhbSB0Vmlld3MgQW55IFRWaWV3cyBhdHRhY2hlZCB0byB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBpbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRJY3VDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKGF0dHJzLCB1bmRlZmluZWQsICdcXCd1bmRlZmluZWRcXCcgaXMgbm90IHZhbGlkIHZhbHVlIGZvciBcXCdhdHRyc1xcJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiB0UGFyZW50ICYmIGFzc2VydFROb2RlRm9yVFZpZXcodFBhcmVudCwgdFZpZXcpO1xuICBsZXQgaW5qZWN0b3JJbmRleCA9IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMTtcbiAgY29uc3QgdE5vZGUgPSBuZ0Rldk1vZGUgP1xuICAgICAgbmV3IFROb2RlRGVidWcoXG4gICAgICAgICAgdFZpZXcsICAgICAgICAgIC8vIHRWaWV3XzogVFZpZXdcbiAgICAgICAgICB0eXBlLCAgICAgICAgICAgLy8gdHlwZTogVE5vZGVUeXBlXG4gICAgICAgICAgaW5kZXgsICAgICAgICAgIC8vIGluZGV4OiBudW1iZXJcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gaW5zZXJ0QmVmb3JlSW5kZXg6IG51bGx8LTF8bnVtYmVyfG51bWJlcltdXG4gICAgICAgICAgaW5qZWN0b3JJbmRleCwgIC8vIGluamVjdG9ySW5kZXg6IG51bWJlclxuICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVTdGFydDogbnVtYmVyXG4gICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZUVuZDogbnVtYmVyXG4gICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiBudW1iZXJcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gcHJvcGVydHlCaW5kaW5nczogbnVtYmVyW118bnVsbFxuICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBmbGFnczogVE5vZGVGbGFnc1xuICAgICAgICAgIDAsICAgICAgICAgICAgICAvLyBwcm92aWRlckluZGV4ZXM6IFROb2RlUHJvdmlkZXJJbmRleGVzXG4gICAgICAgICAgdmFsdWUsICAgICAgICAgIC8vIHZhbHVlOiBzdHJpbmd8bnVsbFxuICAgICAgICAgIGF0dHJzLCAgICAgICAgICAvLyBhdHRyczogKHN0cmluZ3xBdHRyaWJ1dGVNYXJrZXJ8KHN0cmluZ3xTZWxlY3RvckZsYWdzKVtdKVtdfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gbWVyZ2VkQXR0cnNcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW118bnVsbFxuICAgICAgICAgIHVuZGVmaW5lZCwgICAgICAvLyBpbml0aWFsSW5wdXRzOiAoc3RyaW5nW118bnVsbClbXXxudWxsfHVuZGVmaW5lZFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBpbnB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIG91dHB1dHM6IFByb3BlcnR5QWxpYXNlc3xudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHRWaWV3czogSVRWaWV3fElUVmlld1tdfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gbmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gcHJvamVjdGlvbk5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGNoaWxkOiBJVE5vZGV8bnVsbFxuICAgICAgICAgIHRQYXJlbnQsICAgICAgICAvLyBwYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHByb2plY3Rpb246IG51bWJlcnwoSVROb2RlfFJOb2RlW10pW118bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBzdHlsZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHN0eWxlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbFxuICAgICAgICAgIHVuZGVmaW5lZCwgICAgICAvLyByZXNpZHVhbFN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gY2xhc3Nlczogc3RyaW5nfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gY2xhc3Nlc1dpdGhvdXRIb3N0OiBzdHJpbmd8bnVsbFxuICAgICAgICAgIHVuZGVmaW5lZCwgICAgICAvLyByZXNpZHVhbENsYXNzZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgMCBhcyBhbnksICAgICAgIC8vIGNsYXNzQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG4gICAgICAgICAgMCBhcyBhbnksICAgICAgIC8vIHN0eWxlQmluZGluZ3M6IFRTdHlsaW5nUmFuZ2U7XG4gICAgICAgICAgKSA6XG4gICAgICB7XG4gICAgICAgIHR5cGUsXG4gICAgICAgIGluZGV4LFxuICAgICAgICBpbnNlcnRCZWZvcmVJbmRleDogbnVsbCxcbiAgICAgICAgaW5qZWN0b3JJbmRleCxcbiAgICAgICAgZGlyZWN0aXZlU3RhcnQ6IC0xLFxuICAgICAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgICAgICBkaXJlY3RpdmVTdHlsaW5nTGFzdDogLTEsXG4gICAgICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgICAgIGZsYWdzOiAwLFxuICAgICAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgICAgIHZhbHVlOiB2YWx1ZSxcbiAgICAgICAgYXR0cnM6IGF0dHJzLFxuICAgICAgICBtZXJnZWRBdHRyczogbnVsbCxcbiAgICAgICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICAgICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgICAgICBpbnB1dHM6IG51bGwsXG4gICAgICAgIG91dHB1dHM6IG51bGwsXG4gICAgICAgIHRWaWV3czogbnVsbCxcbiAgICAgICAgbmV4dDogbnVsbCxcbiAgICAgICAgcHJvamVjdGlvbk5leHQ6IG51bGwsXG4gICAgICAgIGNoaWxkOiBudWxsLFxuICAgICAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgICAgIHByb2plY3Rpb246IG51bGwsXG4gICAgICAgIHN0eWxlczogbnVsbCxcbiAgICAgICAgc3R5bGVzV2l0aG91dEhvc3Q6IG51bGwsXG4gICAgICAgIHJlc2lkdWFsU3R5bGVzOiB1bmRlZmluZWQsXG4gICAgICAgIGNsYXNzZXM6IG51bGwsXG4gICAgICAgIGNsYXNzZXNXaXRob3V0SG9zdDogbnVsbCxcbiAgICAgICAgcmVzaWR1YWxDbGFzc2VzOiB1bmRlZmluZWQsXG4gICAgICAgIGNsYXNzQmluZGluZ3M6IDAgYXMgYW55LFxuICAgICAgICBzdHlsZUJpbmRpbmdzOiAwIGFzIGFueSxcbiAgICAgIH07XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAvLyBGb3IgcGVyZm9ybWFuY2UgcmVhc29ucyBpdCBpcyBpbXBvcnRhbnQgdGhhdCB0aGUgdE5vZGUgcmV0YWlucyB0aGUgc2FtZSBzaGFwZSBkdXJpbmcgcnVudGltZS5cbiAgICAvLyAoVG8gbWFrZSBzdXJlIHRoYXQgYWxsIG9mIHRoZSBjb2RlIGlzIG1vbm9tb3JwaGljLikgRm9yIHRoaXMgcmVhc29uIHdlIHNlYWwgdGhlIG9iamVjdCB0b1xuICAgIC8vIHByZXZlbnQgY2xhc3MgdHJhbnNpdGlvbnMuXG4gICAgT2JqZWN0LnNlYWwodE5vZGUpO1xuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBpbnB1dEFsaWFzTWFwOiB7W3B1YmxpY05hbWU6IHN0cmluZ106IHN0cmluZ30sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyLFxuICAgIHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIGZvciAobGV0IHB1YmxpY05hbWUgaW4gaW5wdXRBbGlhc01hcCkge1xuICAgIGlmIChpbnB1dEFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wU3RvcmUgPSBwcm9wU3RvcmUgPT09IG51bGwgPyB7fSA6IHByb3BTdG9yZTtcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGlucHV0QWxpYXNNYXBbcHVibGljTmFtZV07XG5cbiAgICAgIGlmIChwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgICAgcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlRGVmSWR4LCBpbnRlcm5hbE5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKHByb3BTdG9yZVtwdWJsaWNOYW1lXSA9IFtkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZV0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gcHJvcFN0b3JlO1xufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIGRhdGEgc3RydWN0dXJlcyByZXF1aXJlZCB0byB3b3JrIHdpdGggZGlyZWN0aXZlIGlucHV0cyBhbmQgb3V0cHV0cy5cbiAqIEluaXRpYWxpemF0aW9uIGlzIGRvbmUgZm9yIGFsbCBkaXJlY3RpdmVzIG1hdGNoZWQgb24gYSBnaXZlbiBUTm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IHRWaWV3RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsSW5wdXRzKCkgOiBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlld0RhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlSW5wdXRzID0gZGlyZWN0aXZlRGVmLmlucHV0cztcbiAgICAvLyBEbyBub3QgdXNlIHVuYm91bmQgYXR0cmlidXRlcyBhcyBpbnB1dHMgdG8gc3RydWN0dXJhbCBkaXJlY3RpdmVzLCBzaW5jZSBzdHJ1Y3R1cmFsXG4gICAgLy8gZGlyZWN0aXZlIGlucHV0cyBjYW4gb25seSBiZSBzZXQgdXNpbmcgbWljcm9zeW50YXggKGUuZy4gYDxkaXYgKmRpcj1cImV4cFwiPmApLlxuICAgIC8vIFRPRE8oRlctMTkzMCk6IG1pY3Jvc3ludGF4IGV4cHJlc3Npb25zIG1heSBhbHNvIGNvbnRhaW4gdW5ib3VuZC9zdGF0aWMgYXR0cmlidXRlcywgd2hpY2hcbiAgICAvLyBzaG91bGQgYmUgc2V0IGZvciBpbmxpbmUgdGVtcGxhdGVzLlxuICAgIGNvbnN0IGluaXRpYWxJbnB1dHMgPSAodE5vZGVBdHRycyAhPT0gbnVsbCAmJiAhaXNJbmxpbmVUZW1wbGF0ZSh0Tm9kZSkpID9cbiAgICAgICAgZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUlucHV0cywgdE5vZGVBdHRycykgOlxuICAgICAgICBudWxsO1xuICAgIGlucHV0c0Zyb21BdHRycy5wdXNoKGluaXRpYWxJbnB1dHMpO1xuICAgIGlucHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlSW5wdXRzLCBpLCBpbnB1dHNTdG9yZSk7XG4gICAgb3V0cHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlRGVmLm91dHB1dHMsIGksIG91dHB1dHNTdG9yZSk7XG4gIH1cblxuICBpZiAoaW5wdXRzU3RvcmUgIT09IG51bGwpIHtcbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgdE5vZGUuaW5pdGlhbElucHV0cyA9IGlucHV0c0Zyb21BdHRycztcbiAgdE5vZGUuaW5wdXRzID0gaW5wdXRzU3RvcmU7XG4gIHROb2RlLm91dHB1dHMgPSBvdXRwdXRzU3RvcmU7XG59XG5cbi8qKlxuICogTWFwcGluZyBiZXR3ZWVuIGF0dHJpYnV0ZXMgbmFtZXMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIHRoZWlyIGVsZW1lbnQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogUGVyZm9ybWFuY2Ugbm90ZTogdGhpcyBmdW5jdGlvbiBpcyB3cml0dGVuIGFzIGEgc2VyaWVzIG9mIGlmIGNoZWNrcyAoaW5zdGVhZCBvZiwgc2F5LCBhIHByb3BlcnR5XG4gKiBvYmplY3QgbG9va3VwKSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAtIHRoZSBzZXJpZXMgb2YgYGlmYCBjaGVja3Mgc2VlbXMgdG8gYmUgdGhlIGZhc3Rlc3Qgd2F5IG9mXG4gKiBtYXBwaW5nIHByb3BlcnR5IG5hbWVzLiBEbyBOT1QgY2hhbmdlIHdpdGhvdXQgYmVuY2htYXJraW5nLlxuICpcbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5mdW5jdGlvbiBtYXBQcm9wTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZSA9PT0gJ2NsYXNzJykgcmV0dXJuICdjbGFzc05hbWUnO1xuICBpZiAobmFtZSA9PT0gJ2ZvcicpIHJldHVybiAnaHRtbEZvcic7XG4gIGlmIChuYW1lID09PSAnZm9ybWFjdGlvbicpIHJldHVybiAnZm9ybUFjdGlvbic7XG4gIGlmIChuYW1lID09PSAnaW5uZXJIdG1sJykgcmV0dXJuICdpbm5lckhUTUwnO1xuICBpZiAobmFtZSA9PT0gJ3JlYWRvbmx5JykgcmV0dXJuICdyZWFkT25seSc7XG4gIGlmIChuYW1lID09PSAndGFiaW5kZXgnKSByZXR1cm4gJ3RhYkluZGV4JztcbiAgcmV0dXJuIG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICBzYW5pdGl6ZXI6IFNhbml0aXplckZufG51bGx8dW5kZWZpbmVkLCBuYXRpdmVPbmx5OiBib29sZWFuKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAnSW5jb21pbmcgdmFsdWUgc2hvdWxkIG5ldmVyIGJlIE5PX0NIQU5HRS4nKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBsZXQgaW5wdXREYXRhID0gdE5vZGUuaW5wdXRzO1xuICBsZXQgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWV8dW5kZWZpbmVkO1xuICBpZiAoIW5hdGl2ZU9ubHkgJiYgaW5wdXREYXRhICE9IG51bGwgJiYgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkodFZpZXcsIGxWaWV3LCBkYXRhVmFsdWUsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCB0Tm9kZS5pbmRleCk7XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgdE5vZGUudHlwZSwgZGF0YVZhbHVlLCB2YWx1ZSk7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpIHtcbiAgICBwcm9wTmFtZSA9IG1hcFByb3BOYW1lKHByb3BOYW1lKTtcblxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllcyhwcm9wTmFtZSk7XG4gICAgICBpZiAoIXZhbGlkYXRlUHJvcGVydHkodFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSkpIHtcbiAgICAgICAgLy8gUmV0dXJuIGhlcmUgc2luY2Ugd2Ugb25seSBsb2cgd2FybmluZ3MgZm9yIHVua25vd24gcHJvcGVydGllcy5cbiAgICAgICAgbG9nVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgbmdEZXZNb2RlLnJlbmRlcmVyU2V0UHJvcGVydHkrKztcbiAgICB9XG5cbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eSBpcyByaXNreSwgc28gc2FuaXRpemF0aW9uIGNhbiBiZSBkb25lIHdpdGhvdXQgZnVydGhlciBjaGVja3MuXG4gICAgdmFsdWUgPSBzYW5pdGl6ZXIgIT0gbnVsbCA/IChzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnZhbHVlIHx8ICcnLCBwcm9wTmFtZSkgYXMgYW55KSA6IHZhbHVlO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFByb3BlcnR5KGVsZW1lbnQgYXMgUkVsZW1lbnQsIHByb3BOYW1lLCB2YWx1ZSk7XG4gICAgfSBlbHNlIGlmICghaXNBbmltYXRpb25Qcm9wKHByb3BOYW1lKSkge1xuICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldFByb3BlcnR5ID8gKGVsZW1lbnQgYXMgYW55KS5zZXRQcm9wZXJ0eShwcm9wTmFtZSwgdmFsdWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIGFueSlbcHJvcE5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXModFZpZXcsIHROb2RlLnZhbHVlKSkge1xuICAgICAgbG9nVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZnVuY3Rpb24gbWFya0RpcnR5SWZPblB1c2gobFZpZXc6IExWaWV3LCB2aWV3SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcobFZpZXcpO1xuICBjb25zdCBjaGlsZENvbXBvbmVudExWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHZpZXdJbmRleCwgbFZpZXcpO1xuICBpZiAoIShjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMpKSB7XG4gICAgY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0eShcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGF0dHJOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShhdHRyTmFtZSk7XG4gIGNvbnN0IGRlYnVnVmFsdWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZSh2YWx1ZSk7XG4gIGlmICh0eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkucmVtb3ZlQXR0cmlidXRlKGF0dHJOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID9cbiAgICAgICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSkgOlxuICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRlYnVnVmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBjb25zdCB0ZXh0Q29udGVudCA9XG4gICAgICAgIGVzY2FwZUNvbW1lbnRUZXh0KGBiaW5kaW5ncz0ke0pTT04uc3RyaW5naWZ5KHtbYXR0ck5hbWVdOiBkZWJ1Z1ZhbHVlfSwgbnVsbCwgMil9YCk7XG4gICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgcmVuZGVyZXIuc2V0VmFsdWUoKGVsZW1lbnQgYXMgUkNvbW1lbnQpLCB0ZXh0Q29udGVudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHRleHRDb250ZW50O1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcikpIHtcbiAgICAvKipcbiAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgKiBpKzE6IHByaXZhdGVOYW1lXG4gICAgICpcbiAgICAgKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMV1cbiAgICAgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFWYWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHR5cGUsIGRhdGFWYWx1ZVtpICsgMV0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHZhbGlkYXRlUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgcHJvcE5hbWU6IHN0cmluZywgdE5vZGU6IFROb2RlKTogYm9vbGVhbiB7XG4gIC8vIElmIGBzY2hlbWFzYCBpcyBzZXQgdG8gYG51bGxgLCB0aGF0J3MgYW4gaW5kaWNhdGlvbiB0aGF0IHRoaXMgQ29tcG9uZW50IHdhcyBjb21waWxlZCBpbiBBT1RcbiAgLy8gbW9kZSB3aGVyZSB0aGlzIGNoZWNrIGhhcHBlbnMgYXQgY29tcGlsZSB0aW1lLiBJbiBKSVQgbW9kZSwgYHNjaGVtYXNgIGlzIGFsd2F5cyBwcmVzZW50IGFuZFxuICAvLyBkZWZpbmVkIGFzIGFuIGFycmF5IChhcyBhbiBlbXB0eSBhcnJheSBpbiBjYXNlIGBzY2hlbWFzYCBmaWVsZCBpcyBub3QgZGVmaW5lZCkgYW5kIHdlIHNob3VsZFxuICAvLyBleGVjdXRlIHRoZSBjaGVjayBiZWxvdy5cbiAgaWYgKHRWaWV3LnNjaGVtYXMgPT09IG51bGwpIHJldHVybiB0cnVlO1xuXG4gIC8vIFRoZSBwcm9wZXJ0eSBpcyBjb25zaWRlcmVkIHZhbGlkIGlmIHRoZSBlbGVtZW50IG1hdGNoZXMgdGhlIHNjaGVtYSwgaXQgZXhpc3RzIG9uIHRoZSBlbGVtZW50XG4gIC8vIG9yIGl0IGlzIHN5bnRoZXRpYywgYW5kIHdlIGFyZSBpbiBhIGJyb3dzZXIgY29udGV4dCAod2ViIHdvcmtlciBub2RlcyBzaG91bGQgYmUgc2tpcHBlZCkuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXModFZpZXcsIHROb2RlLnZhbHVlKSB8fCBwcm9wTmFtZSBpbiBlbGVtZW50IHx8IGlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICByZXR1cm4gdHJ1ZTtcbiAgfVxuXG4gIC8vIE5vdGU6IGB0eXBlb2YgTm9kZWAgcmV0dXJucyAnZnVuY3Rpb24nIGluIG1vc3QgYnJvd3NlcnMsIGJ1dCBvbiBJRSBpdCBpcyAnb2JqZWN0JyBzbyB3ZVxuICAvLyBuZWVkIHRvIGFjY291bnQgZm9yIGJvdGggaGVyZSwgd2hpbGUgYmVpbmcgY2FyZWZ1bCBmb3IgYHR5cGVvZiBudWxsYCBhbHNvIHJldHVybmluZyAnb2JqZWN0Jy5cbiAgcmV0dXJuIHR5cGVvZiBOb2RlID09PSAndW5kZWZpbmVkJyB8fCBOb2RlID09PSBudWxsIHx8ICEoZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWF0Y2hpbmdTY2hlbWFzKHRWaWV3OiBUVmlldywgdGFnTmFtZTogc3RyaW5nfG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IHRWaWV3LnNjaGVtYXM7XG5cbiAgaWYgKHNjaGVtYXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNjaGVtYXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IHNjaGVtYXNbaV07XG4gICAgICBpZiAoc2NoZW1hID09PSBOT19FUlJPUlNfU0NIRU1BIHx8XG4gICAgICAgICAgc2NoZW1hID09PSBDVVNUT01fRUxFTUVOVFNfU0NIRU1BICYmIHRhZ05hbWUgJiYgdGFnTmFtZS5pbmRleE9mKCctJykgPiAtMSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8qKlxuICogTG9ncyBhbiBlcnJvciB0aGF0IGEgcHJvcGVydHkgaXMgbm90IHN1cHBvcnRlZCBvbiBhbiBlbGVtZW50LlxuICogQHBhcmFtIHByb3BOYW1lIE5hbWUgb2YgdGhlIGludmFsaWQgcHJvcGVydHkuXG4gKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgcHJvcGVydHkuXG4gKi9cbmZ1bmN0aW9uIGxvZ1Vua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBsZXQgbWVzc2FnZSA9IGBDYW4ndCBiaW5kIHRvICcke3Byb3BOYW1lfScgc2luY2UgaXQgaXNuJ3QgYSBrbm93biBwcm9wZXJ0eSBvZiAnJHt0Tm9kZS52YWx1ZX0nLmA7XG4gIGNvbnNvbGUuZXJyb3IoZm9ybWF0UnVudGltZUVycm9yKFJ1bnRpbWVFcnJvckNvZGUuVU5LTk9XTl9CSU5ESU5HLCBtZXNzYWdlKSk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbnRpYXRlUm9vdENvbXBvbmVudDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCAxLCBudWxsKTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBkaXJlY3RpdmVJbmRleCwgcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgJ0JlY2F1c2UgdGhpcyBpcyBhIHJvb3QgY29tcG9uZW50IHRoZSBhbGxvY2F0ZWQgZXhwYW5kbyBzaG91bGQgbWF0Y2ggdGhlIFROb2RlIGNvbXBvbmVudC4nKTtcbiAgICBjb25maWd1cmVWaWV3V2l0aERpcmVjdGl2ZSh0Vmlldywgcm9vdFROb2RlLCBsVmlldywgZGlyZWN0aXZlSW5kZXgsIGRlZik7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID1cbiAgICAgIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0Vmlldywgcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0LCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKHJvb3RUTm9kZSwgbFZpZXcpO1xuICBpZiAobmF0aXZlKSB7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuICB9XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwpOiBib29sZWFuIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW5cbiAgLy8gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgbGV0IGhhc0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgaWYgKGdldEJpbmRpbmdzRW5hYmxlZCgpKSB7XG4gICAgY29uc3QgZGlyZWN0aXZlRGVmczogRGlyZWN0aXZlRGVmPGFueT5bXXxudWxsID0gZmluZERpcmVjdGl2ZURlZk1hdGNoZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gICAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9fG51bGwpID0gbG9jYWxSZWZzID09PSBudWxsID8gbnVsbCA6IHsnJzogLTF9O1xuXG4gICAgaWYgKGRpcmVjdGl2ZURlZnMgIT09IG51bGwpIHtcbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgICAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVEZWZzLmxlbmd0aCk7XG4gICAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAgIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gICAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgICAgLy8gaW1wb3J0YW50LlxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVEZWZzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZURlZnNbaV07XG4gICAgICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgICAgfVxuICAgICAgbGV0IHByZU9yZGVySG9va3NGb3VuZCA9IGZhbHNlO1xuICAgICAgbGV0IHByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kID0gZmFsc2U7XG4gICAgICBsZXQgZGlyZWN0aXZlSWR4ID0gYWxsb2NFeHBhbmRvKHRWaWV3LCBsVmlldywgZGlyZWN0aXZlRGVmcy5sZW5ndGgsIG51bGwpO1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0U2FtZShcbiAgICAgICAgICAgICAgZGlyZWN0aXZlSWR4LCB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAgICAgJ1ROb2RlLmRpcmVjdGl2ZVN0YXJ0IHNob3VsZCBwb2ludCB0byBqdXN0IGFsbG9jYXRlZCBzcGFjZScpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZURlZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlRGVmc1tpXTtcbiAgICAgICAgLy8gTWVyZ2UgdGhlIGF0dHJzIGluIHRoZSBvcmRlciBvZiBtYXRjaGVzLiBUaGlzIGFzc3VtZXMgdGhhdCB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIHRoZVxuICAgICAgICAvLyBjb21wb25lbnQgaXRzZWxmLCBzbyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIHRoZSBsZWFzdCBwcmlvcml0eS5cbiAgICAgICAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgZGVmLmhvc3RBdHRycyk7XG5cbiAgICAgICAgY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmUodFZpZXcsIHROb2RlLCBsVmlldywgZGlyZWN0aXZlSWR4LCBkZWYpO1xuICAgICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKGRpcmVjdGl2ZUlkeCwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgICAgICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDApXG4gICAgICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3M7XG5cbiAgICAgICAgY29uc3QgbGlmZUN5Y2xlSG9va3M6IE9uQ2hhbmdlcyZPbkluaXQmRG9DaGVjayA9IGRlZi50eXBlLnByb3RvdHlwZTtcbiAgICAgICAgLy8gT25seSBwdXNoIGEgbm9kZSBpbmRleCBpbnRvIHRoZSBwcmVPcmRlckhvb2tzIGFycmF5IGlmIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgICAgIC8vIHByZS1vcmRlciBob29rIGZvdW5kIG9uIHRoaXMgbm9kZS5cbiAgICAgICAgaWYgKCFwcmVPcmRlckhvb2tzRm91bmQgJiZcbiAgICAgICAgICAgIChsaWZlQ3ljbGVIb29rcy5uZ09uQ2hhbmdlcyB8fCBsaWZlQ3ljbGVIb29rcy5uZ09uSW5pdCB8fCBsaWZlQ3ljbGVIb29rcy5uZ0RvQ2hlY2spKSB7XG4gICAgICAgICAgLy8gV2Ugd2lsbCBwdXNoIHRoZSBhY3R1YWwgaG9vayBmdW5jdGlvbiBpbnRvIHRoaXMgYXJyYXkgbGF0ZXIgZHVyaW5nIGRpciBpbnN0YW50aWF0aW9uLlxuICAgICAgICAgIC8vIFdlIGNhbm5vdCBkbyBpdCBub3cgYmVjYXVzZSB3ZSBtdXN0IGVuc3VyZSBob29rcyBhcmUgcmVnaXN0ZXJlZCBpbiB0aGUgc2FtZVxuICAgICAgICAgIC8vIG9yZGVyIHRoYXQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCAoaS5lLiBpbmplY3Rpb24gb3JkZXIpLlxuICAgICAgICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgICAgICBwcmVPcmRlckhvb2tzRm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgICAgICh0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MgfHwgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA9IFtdKSkucHVzaCh0Tm9kZS5pbmRleCk7XG4gICAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGlyZWN0aXZlSWR4Kys7XG4gICAgICB9XG5cbiAgICAgIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXcsIHROb2RlKTtcbiAgICB9XG4gICAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xuICB9XG4gIC8vIE1lcmdlIHRoZSB0ZW1wbGF0ZSBhdHRycyBsYXN0IHNvIHRoYXQgdGhleSBoYXZlIHRoZSBoaWdoZXN0IHByaW9yaXR5LlxuICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCB0Tm9kZS5hdHRycyk7XG4gIHJldHVybiBoYXNEaXJlY3RpdmVzO1xufVxuXG4vKipcbiAqIEFkZCBgaG9zdEJpbmRpbmdzYCB0byB0aGUgYFRWaWV3Lmhvc3RCaW5kaW5nT3BDb2Rlc2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhlIGBob3N0QmluZGluZ3NgIHNob3VsZCBiZSBhZGRlZC5cbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRoZSBlbGVtZW50IHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVcbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgIGN1cnJlbnQgYExWaWV3YFxuICogQHBhcmFtIGRpcmVjdGl2ZUlkeCBEaXJlY3RpdmUgaW5kZXggaW4gdmlldy5cbiAqIEBwYXJhbSBkaXJlY3RpdmVWYXJzSWR4IFdoZXJlIHdpbGwgdGhlIGRpcmVjdGl2ZSdzIHZhcnMgYmUgc3RvcmVkXG4gKiBAcGFyYW0gZGVmIGBDb21wb25lbnREZWZgL2BEaXJlY3RpdmVEZWZgLCB3aGljaCBjb250YWlucyB0aGUgYGhvc3RWYXJzYC9gaG9zdEJpbmRpbmdzYCB0byBhZGQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlckhvc3RCaW5kaW5nT3BDb2RlcyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGlyZWN0aXZlVmFyc0lkeDogbnVtYmVyLFxuICAgIGRlZjogQ29tcG9uZW50RGVmPGFueT58RGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzID0gZGVmLmhvc3RCaW5kaW5ncztcbiAgaWYgKGhvc3RCaW5kaW5ncykge1xuICAgIGxldCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gICAgaWYgKGhvc3RCaW5kaW5nT3BDb2RlcyA9PT0gbnVsbCkge1xuICAgICAgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzID0gW10gYXMgYW55IGFzIEhvc3RCaW5kaW5nT3BDb2RlcztcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudEluZHggPSB+dE5vZGUuaW5kZXg7XG4gICAgaWYgKGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzKSAhPSBlbGVtZW50SW5keCkge1xuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgc2VsZWN0IGVsZW1lbnQgc28gdGhhdCB3ZSBhcmUgbW9yZSBlZmZpY2llbnQgaW4gZXhlY3V0aW9uLlxuICAgICAgLy8gTk9URTogdGhpcyBpcyBzdHJpY3RseSBub3QgbmVjZXNzYXJ5IGFuZCBpdCB0cmFkZXMgY29kZSBzaXplIGZvciBydW50aW1lIHBlcmYuXG4gICAgICAvLyAoV2UgY291bGQganVzdCBhbHdheXMgYWRkIGl0LilcbiAgICAgIGhvc3RCaW5kaW5nT3BDb2Rlcy5wdXNoKGVsZW1lbnRJbmR4KTtcbiAgICB9XG4gICAgaG9zdEJpbmRpbmdPcENvZGVzLnB1c2goZGlyZWN0aXZlSWR4LCBkaXJlY3RpdmVWYXJzSWR4LCBob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbGFzdCBzZWxlY3RlZCBlbGVtZW50IGluZGV4IGluIHRoZSBgSG9zdEJpbmRpbmdPcENvZGVzYFxuICpcbiAqIEZvciBwZXJmIHJlYXNvbnMgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaW5kZXggaW4gYEhvc3RCaW5kaW5nT3BDb2Rlc2Agb25seVxuICogaWYgaXQgY2hhbmdlcy4gVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgbGFzdCBpbmRleCAob3IgJzAnIGlmIG5vdCBmb3VuZC4pXG4gKlxuICogU2VsZWN0ZWQgZWxlbWVudCBpbmRleCBhcmUgb25seSB0aGUgb25lcyB3aGljaCBhcmUgbmVnYXRpdmUuXG4gKi9cbmZ1bmN0aW9uIGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXMpOiBudW1iZXIge1xuICBsZXQgaSA9IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7XG4gIHdoaWxlIChpID4gMCkge1xuICAgIGNvbnN0IHZhbHVlID0gaG9zdEJpbmRpbmdPcENvZGVzWy0taV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPCAwKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSwgbmF0aXZlOiBSTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghdFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCBsVmlldyk7XG4gIH1cblxuICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG5cbiAgY29uc3QgaW5pdGlhbElucHV0cyA9IHROb2RlLmluaXRpYWxJbnB1dHM7XG4gIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBjb25zdCBpc0NvbXBvbmVudCA9IGlzQ29tcG9uZW50RGVmKGRlZik7XG5cbiAgICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5BbnlSTm9kZSk7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUgYXMgVEVsZW1lbnROb2RlLCBkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pO1xuICAgIH1cblxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBmaXJzdENyZWF0ZVBhc3MgPSB0Vmlldy5maXJzdENyZWF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lcik7XG5cbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXSBhcyBDb21wb25lbnREZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMhLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIGZhbHNlKSkge1xuICAgICAgICBtYXRjaGVzIHx8IChtYXRjaGVzID0gbmdEZXZNb2RlID8gbmV3IE1hdGNoZXNBcnJheSgpIDogW10pO1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCB2aWV3RGF0YSksIHRWaWV3LCBkZWYudHlwZSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICAgICAgICAgIGBcIiR7dE5vZGUudmFsdWV9XCIgdGFncyBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgaG9zdHMuIGAgK1xuICAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHVzZSBhIGRpZmZlcmVudCB0YWcgdG8gYWN0aXZhdGUgdGhlICR7c3RyaW5naWZ5KGRlZi50eXBlKX0gY29tcG9uZW50LmApO1xuXG4gICAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUpO1xuICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgaXMgYWx3YXlzIHN0b3JlZCBmaXJzdCB3aXRoIGRpcmVjdGl2ZXMgYWZ0ZXIuXG4gICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKGRlZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbi8qKlxuICogTWFya3MgYSBnaXZlbiBUTm9kZSBhcyBhIGNvbXBvbmVudCdzIGhvc3QuIFRoaXMgY29uc2lzdHMgb2Y6XG4gKiAtIHNldHRpbmcgYXBwcm9wcmlhdGUgVE5vZGUgZmxhZ3M7XG4gKiAtIHN0b3JpbmcgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELlxuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldzogVFZpZXcsIGhvc3RUTm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIGhvc3RUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdDtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBuZ0Rldk1vZGUgPyBuZXcgVFZpZXdDb21wb25lbnRzKCkgOiBbXSkpXG4gICAgICAucHVzaChob3N0VE5vZGUuaW5kZXgpO1xufVxuXG5cbi8qKiBDYWNoZXMgbG9jYWwgbmFtZXMgYW5kIHRoZWlyIG1hdGNoaW5nIGRpcmVjdGl2ZSBpbmRpY2VzIGZvciBxdWVyeSBhbmQgdGVtcGxhdGUgbG9va3Vwcy4gKi9cbmZ1bmN0aW9uIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKFxuICAgIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZzOiBzdHJpbmdbXXxudWxsLCBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSk6IHZvaWQge1xuICBpZiAobG9jYWxSZWZzKSB7XG4gICAgY29uc3QgbG9jYWxOYW1lczogKHN0cmluZ3xudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gbmdEZXZNb2RlID8gbmV3IFROb2RlTG9jYWxOYW1lcygpIDogW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpXG4gICAgICAgIHRocm93IG5ldyBSdW50aW1lRXJyb3IoXG4gICAgICAgICAgICBSdW50aW1lRXJyb3JDb2RlLkVYUE9SVF9OT1RfRk9VTkQsXG4gICAgICAgICAgICBuZ0Rldk1vZGUgJiYgYEV4cG9ydCBvZiBuYW1lICcke2xvY2FsUmVmc1tpICsgMV19JyBub3QgZm91bmQhYCk7XG4gICAgICBsb2NhbE5hbWVzLnB1c2gobG9jYWxSZWZzW2ldLCBpbmRleCk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiAqIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmZ1bmN0aW9uIHNhdmVOYW1lVG9FeHBvcnRNYXAoXG4gICAgZGlyZWN0aXZlSWR4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58Q29tcG9uZW50RGVmPGFueT4sXG4gICAgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGRpcmVjdGl2ZUlkeDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIGV4cG9ydHNNYXBbJyddID0gZGlyZWN0aXZlSWR4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRUTm9kZUZsYWdzKHROb2RlOiBUTm9kZSwgaW5kZXg6IG51bWJlciwgbnVtYmVyT2ZEaXJlY3RpdmVzOiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnROb3RFcXVhbChcbiAgICAgICAgICBudW1iZXJPZkRpcmVjdGl2ZXMsIHROb2RlLmRpcmVjdGl2ZUVuZCAtIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICdSZWFjaGVkIHRoZSBtYXggbnVtYmVyIG9mIGRpcmVjdGl2ZXMnKTtcbiAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RpcmVjdGl2ZUhvc3Q7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZGlyZWN0aXZlU3RhcnQgPSBpbmRleDtcbiAgdE5vZGUuZGlyZWN0aXZlRW5kID0gaW5kZXggKyBudW1iZXJPZkRpcmVjdGl2ZXM7XG4gIHROb2RlLnByb3ZpZGVySW5kZXhlcyA9IGluZGV4O1xufVxuXG4vKipcbiAqIFNldHVwIGRpcmVjdGl2ZSBmb3IgaW5zdGFudGlhdGlvbi5cbiAqXG4gKiBXZSBuZWVkIHRvIGNyZWF0ZSBhIGBOb2RlSW5qZWN0b3JGYWN0b3J5YCB3aGljaCBpcyB0aGVuIGluc2VydGVkIGluIGJvdGggdGhlIGBCbHVlcHJpbnRgIGFzIHdlbGxcbiAqIGFzIGBMVmlld2AuIGBUVmlld2AgZ2V0cyB0aGUgYERpcmVjdGl2ZURlZmAuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2BcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgXG4gKiBAcGFyYW0gbFZpZXcgYExWaWV3YFxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHdoZXJlIHRoZSBkaXJlY3RpdmUgd2lsbCBiZSBzdG9yZWQgaW4gdGhlIEV4cGFuZG8uXG4gKiBAcGFyYW0gZGVmIGBEaXJlY3RpdmVEZWZgXG4gKi9cbmZ1bmN0aW9uIGNvbmZpZ3VyZVZpZXdXaXRoRGlyZWN0aXZlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGRpcmVjdGl2ZUluZGV4LCBIRUFERVJfT0ZGU0VULCAnTXVzdCBiZSBpbiBFeHBhbmRvIHNlY3Rpb24nKTtcbiAgdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gPSBkZWY7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9IG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIG51bGwpO1xuICB0Vmlldy5ibHVlcHJpbnRbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcbiAgbFZpZXdbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcblxuICByZWdpc3Rlckhvc3RCaW5kaW5nT3BDb2RlcyhcbiAgICAgIHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGRpcmVjdGl2ZUluZGV4LCBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkZWYuaG9zdFZhcnMsIE5PX0NIQU5HRSksXG4gICAgICBkZWYpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihsVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbmF0aXZlLFxuICAgICAgICAgIGhvc3RUTm9kZSBhcyBURWxlbWVudE5vZGUsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG5hdGl2ZSwgZGVmKSxcbiAgICAgICAgICBudWxsLCBudWxsKSk7XG5cbiAgLy8gQ29tcG9uZW50IHZpZXcgd2lsbCBhbHdheXMgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGluamVjdGVkIExDb250YWluZXJzLFxuICAvLyBzbyB0aGlzIGlzIGEgcmVndWxhciBlbGVtZW50LCB3cmFwIGl0IHdpdGggdGhlIGNvbXBvbmVudCB2aWV3XG4gIGxWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsXG4gICAgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQpIHtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcyhuYW1lKTtcbiAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCxcbiAgICAgICAgYEF0dGVtcHRlZCB0byBzZXQgYXR0cmlidXRlIFxcYCR7bmFtZX1cXGAgb24gYSBjb250YWluZXIgbm9kZS4gYCArXG4gICAgICAgICAgICBgSG9zdCBiaW5kaW5ncyBhcmUgbm90IHZhbGlkIG9uIG5nLWNvbnRhaW5lciBvciBuZy10ZW1wbGF0ZS5gKTtcbiAgfVxuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBzZXRFbGVtZW50QXR0cmlidXRlKGxWaWV3W1JFTkRFUkVSXSwgZWxlbWVudCwgbmFtZXNwYWNlLCB0Tm9kZS52YWx1ZSwgbmFtZSwgdmFsdWUsIHNhbml0aXplcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbGVtZW50QXR0cmlidXRlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlcjMsIGVsZW1lbnQ6IFJFbGVtZW50LCBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCwgdGFnTmFtZTogc3RyaW5nfG51bGwsXG4gICAgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBzYW5pdGl6ZXI6IFNhbml0aXplckZufG51bGx8dW5kZWZpbmVkKSB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclJlbW92ZUF0dHJpYnV0ZSsrO1xuICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnJlbW92ZUF0dHJpYnV0ZShlbGVtZW50LCBuYW1lLCBuYW1lc3BhY2UpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVzcGFjZSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IExWaWV3IHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGRlZiBUaGUgZGlyZWN0aXZlIGRlZiB0aGF0IGNvbnRhaW5zIHRoZSBsaXN0IG9mIGlucHV0c1xuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgdE5vZGU6IFROb2RlLFxuICAgIGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEpOiB2b2lkIHtcbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YSFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGlmIChzZXRJbnB1dCAhPT0gbnVsbCkge1xuICAgICAgICBkZWYuc2V0SW5wdXQhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGluc3RhbmNlIGFzIGFueSlbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgICAgIHNldE5nUmVmbGVjdFByb3BlcnR5KGxWaWV3LCBuYXRpdmVFbGVtZW50LCB0Tm9kZS50eXBlLCBwcml2YXRlTmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSBhdHRycyBUaGUgc3RhdGljIGF0dHJzIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogSW5pdGlhbElucHV0c3xcbiAgICBudWxsIHtcbiAgbGV0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHN8bnVsbCA9IG51bGw7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGlmIChpbnB1dHMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUgYXMgc3RyaW5nKSkge1xuICAgICAgaWYgKGlucHV0c1RvU3RvcmUgPT09IG51bGwpIGlucHV0c1RvU3RvcmUgPSBbXTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChhdHRyTmFtZSBhcyBzdHJpbmcsIGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddLCBhdHRyc1tpICsgMV0gYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGlucHV0c1RvU3RvcmU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBOb3Qgc3VyZSB3aHkgSSBuZWVkIHRvIGRvIGBhbnlgIGhlcmUgYnV0IFRTIGNvbXBsYWlucyBsYXRlci5cbmNvbnN0IExDb250YWluZXJBcnJheTogYW55ID0gY2xhc3MgTENvbnRhaW5lciBleHRlbmRzIEFycmF5IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldywgY3VycmVudFZpZXc6IExWaWV3LCBuYXRpdmU6IFJDb21tZW50LFxuICAgIHROb2RlOiBUTm9kZSk6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgIWlzUHJvY2VkdXJhbFJlbmRlcmVyKGN1cnJlbnRWaWV3W1JFTkRFUkVSXSkgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmUpO1xuICAvLyBodHRwczovL2pzcGVyZi5jb20vYXJyYXktbGl0ZXJhbC12cy1uZXctYXJyYXktcmVhbGx5XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBuZXcgKG5nRGV2TW9kZSA/IExDb250YWluZXJBcnJheSA6IEFycmF5KShcbiAgICAgIGhvc3ROYXRpdmUsICAgLy8gaG9zdCBuYXRpdmVcbiAgICAgIHRydWUsICAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgICAgZmFsc2UsICAgICAgICAvLyBoYXMgdHJhbnNwbGFudGVkIHZpZXdzXG4gICAgICBjdXJyZW50VmlldywgIC8vIHBhcmVudFxuICAgICAgbnVsbCwgICAgICAgICAvLyBuZXh0XG4gICAgICAwLCAgICAgICAgICAgIC8vIHRyYW5zcGxhbnRlZCB2aWV3cyB0byByZWZyZXNoIGNvdW50XG4gICAgICB0Tm9kZSwgICAgICAgIC8vIHRfaG9zdFxuICAgICAgbmF0aXZlLCAgICAgICAvLyBuYXRpdmUsXG4gICAgICBudWxsLCAgICAgICAgIC8vIHZpZXcgcmVmc1xuICAgICAgbnVsbCwgICAgICAgICAvLyBtb3ZlZCB2aWV3c1xuICApO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGxDb250YWluZXIubGVuZ3RoLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCxcbiAgICAgICAgICAnU2hvdWxkIGFsbG9jYXRlIGNvcnJlY3QgbnVtYmVyIG9mIHNsb3RzIGZvciBMQ29udGFpbmVyIGhlYWRlci4nKTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKTtcbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSBlbWJlZGRlZExWaWV3W1RWSUVXXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVtYmVkZGVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoZW1iZWRkZWRMVmlldykpIHtcbiAgICAgICAgcmVmcmVzaFZpZXcoZW1iZWRkZWRUVmlldywgZW1iZWRkZWRMVmlldywgZW1iZWRkZWRUVmlldy50ZW1wbGF0ZSwgZW1iZWRkZWRMVmlld1tDT05URVhUXSEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIGFzIG5lZWRpbmcgdG8gYmUgcmVmcmVzaGVkIGF0IHRoZWlyIGluc2VydGlvbiBwb2ludHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgbWF5IGhhdmUgdHJhbnNwbGFudGVkIHZpZXdzLlxuICovXG5mdW5jdGlvbiBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBpZiAoIWxDb250YWluZXJbSEFTX1RSQU5TUExBTlRFRF9WSUVXU10pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb3ZlZExWaWV3ID0gbW92ZWRWaWV3c1tpXSE7XG4gICAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcbiAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gaW5jcmVtZW50IHRoZSBjb3VudGVyIGlmIHRoZSBtb3ZlZCBMVmlldyB3YXMgYWxyZWFkeSBtYXJrZWQgZm9yXG4gICAgICAvLyByZWZyZXNoLlxuICAgICAgaWYgKChtb3ZlZExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpID09PSAwKSB7XG4gICAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChpbnNlcnRpb25MQ29udGFpbmVyLCAxKTtcbiAgICAgIH1cbiAgICAgIC8vIE5vdGUsIGl0IGlzIHBvc3NpYmxlIHRoYXQgdGhlIGBtb3ZlZFZpZXdzYCBpcyB0cmFja2luZyB2aWV3cyB0aGF0IGFyZSB0cmFuc3BsYW50ZWQgKmFuZCpcbiAgICAgIC8vIHRob3NlIHRoYXQgYXJlbid0IChkZWNsYXJhdGlvbiBjb21wb25lbnQgPT09IGluc2VydGlvbiBjb21wb25lbnQpLiBJbiB0aGUgbGF0dGVyIGNhc2UsXG4gICAgICAvLyBpdCdzIGZpbmUgdG8gYWRkIHRoZSBmbGFnLCBhcyB3ZSB3aWxsIGNsZWFyIGl0IGltbWVkaWF0ZWx5IGluXG4gICAgICAvLyBgcmVmcmVzaEVtYmVkZGVkVmlld3NgIGZvciB0aGUgdmlldyBjdXJyZW50bHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgbW92ZWRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICB9XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SG9zdElkeCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoY29tcG9uZW50VmlldykpIHtcbiAgICBjb25zdCB0VmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICAgIGlmIChjb21wb25lbnRWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBjb21wb25lbnRWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG4gICAgfSBlbHNlIGlmIChjb21wb25lbnRWaWV3W1RSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNIXSA+IDApIHtcbiAgICAgIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5Vmlldyhjb21wb25lbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYWxsIHRyYW5zcGxhbnRlZCB2aWV3cyBtYXJrZWQgd2l0aCBgTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlld2AgdGhhdCBhcmVcbiAqIGNoaWxkcmVuIG9yIGRlc2NlbmRhbnRzIG9mIHRoZSBnaXZlbiBsVmlldy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGxWaWV3IHdoaWNoIGNvbnRhaW5zIGRlc2NlbmRhbnQgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250YWluc0RpcnR5VmlldyhsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgICBpZiAoZW1iZWRkZWRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3KSB7XG4gICAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSBlbWJlZGRlZExWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgIHJlZnJlc2hWaWV3KGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0hKTtcbiAgICAgIH0gZWxzZSBpZiAoZW1iZWRkZWRMVmlld1tUUkFOU1BMQU5URURfVklFV1NfVE9fUkVGUkVTSF0gPiAwKSB7XG4gICAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5VmlldyhlbWJlZGRlZExWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRzW2ldLCBsVmlldyk7XG4gICAgICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gICAgICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSAmJlxuICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgICByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcoY29tcG9uZW50Vmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuICByZW5kZXJWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2AgdGhhdCBjb250YWlucyB0aGUgYmx1ZXByaW50IGZvciBzeW5jaW5nXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgaSA9IGxWaWV3Lmxlbmd0aDsgaSA8IHRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGxWaWV3LnB1c2godFZpZXcuYmx1ZXByaW50W2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2Ygb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lciBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBVc2VkIHRvIHNjaGVkdWxlIGNoYW5nZSBkZXRlY3Rpb24gb24gdGhlIHdob2xlIGFwcGxpY2F0aW9uLlxuICpcbiAqIFVubGlrZSBgdGlja2AsIGBzY2hlZHVsZVRpY2tgIGNvYWxlc2NlcyBtdWx0aXBsZSBjYWxscyBpbnRvIG9uZSBjaGFuZ2UgZGV0ZWN0aW9uIHJ1bi5cbiAqIEl0IGlzIHVzdWFsbHkgY2FsbGVkIGluZGlyZWN0bHkgYnkgY2FsbGluZyBgbWFya0RpcnR5YCB3aGVuIHRoZSB2aWV3IG5lZWRzIHRvIGJlXG4gKiByZS1yZW5kZXJlZC5cbiAqXG4gKiBUeXBpY2FsbHkgYHNjaGVkdWxlVGlja2AgdXNlcyBgcmVxdWVzdEFuaW1hdGlvbkZyYW1lYCB0byBjb2FsZXNjZSBtdWx0aXBsZVxuICogYHNjaGVkdWxlVGlja2AgcmVxdWVzdHMuIFRoZSBzY2hlZHVsaW5nIGZ1bmN0aW9uIGNhbiBiZSBvdmVycmlkZGVuIGluXG4gKiBgcmVuZGVyQ29tcG9uZW50YCdzIGBzY2hlZHVsZXJgIG9wdGlvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjaGVkdWxlVGljayhyb290Q29udGV4dDogUm9vdENvbnRleHQsIGZsYWdzOiBSb290Q29udGV4dEZsYWdzKSB7XG4gIGNvbnN0IG5vdGhpbmdTY2hlZHVsZWQgPSByb290Q29udGV4dC5mbGFncyA9PT0gUm9vdENvbnRleHRGbGFncy5FbXB0eTtcbiAgaWYgKG5vdGhpbmdTY2hlZHVsZWQgJiYgcm9vdENvbnRleHQuY2xlYW4gPT0gX0NMRUFOX1BST01JU0UpIHtcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci9hbmd1bGFyL2lzc3Vlcy8zOTI5NlxuICAgIC8vIHNob3VsZCBvbmx5IGF0dGFjaCB0aGUgZmxhZ3Mgd2hlbiByZWFsbHkgc2NoZWR1bGluZyBhIHRpY2tcbiAgICByb290Q29udGV4dC5mbGFncyB8PSBmbGFncztcbiAgICBsZXQgcmVzOiBudWxsfCgodmFsOiBudWxsKSA9PiB2b2lkKTtcbiAgICByb290Q29udGV4dC5jbGVhbiA9IG5ldyBQcm9taXNlPG51bGw+KChyKSA9PiByZXMgPSByKTtcbiAgICByb290Q29udGV4dC5zY2hlZHVsZXIoKCkgPT4ge1xuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXM7XG4gICAgICAgIHRpY2tSb290Q29udGV4dChyb290Q29udGV4dCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzKSB7XG4gICAgICAgIHJvb3RDb250ZXh0LmZsYWdzICY9IH5Sb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycztcbiAgICAgICAgY29uc3QgcGxheWVySGFuZGxlciA9IHJvb3RDb250ZXh0LnBsYXllckhhbmRsZXI7XG4gICAgICAgIGlmIChwbGF5ZXJIYW5kbGVyKSB7XG4gICAgICAgICAgcGxheWVySGFuZGxlci5mbHVzaFBsYXllcnMoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByb290Q29udGV4dC5jbGVhbiA9IF9DTEVBTl9QUk9NSVNFO1xuICAgICAgcmVzIShudWxsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICBjb25zdCBsVmlldyA9IHJlYWRQYXRjaGVkTFZpZXcocm9vdENvbXBvbmVudCkhO1xuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHRWaWV3OiBUVmlldywgdmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodFZpZXcsIHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFxuICAgIGZsYWdzOiBSZW5kZXJGbGFncywgdmlld1F1ZXJ5Rm46IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+LCBjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodmlld1F1ZXJ5Rm4sICdWaWV3IHF1ZXJpZXMgZnVuY3Rpb24gdG8gZXhlY3V0ZSBtdXN0IGJlIGRlZmluZWQuJyk7XG4gIHNldEN1cnJlbnRRdWVyeUluZGV4KDApO1xuICB2aWV3UXVlcnlGbihmbGFncywgY29tcG9uZW50KTtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBTdG9yZXMgbWV0YS1kYXRhIGZvciBhIHByb3BlcnR5IGJpbmRpbmcgdG8gYmUgdXNlZCBieSBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYC5cbiAqXG4gKiBJbiBvcmRlciB0byBzdXBwb3J0IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgIHdlIG5lZWQgdG8gc2F2ZSwgZm9yIGVhY2ggYmluZGluZzpcbiAqIC0gYSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogLSBhIHN0YXRpYyBwYXJ0cyBvZiBpbnRlcnBvbGF0ZWQgc3RyaW5ncztcbiAqXG4gKiBBIGdpdmVuIHByb3BlcnR5IG1ldGFkYXRhIGlzIHNhdmVkIGF0IHRoZSBiaW5kaW5nJ3MgaW5kZXggaW4gdGhlIGBUVmlldy5kYXRhYCAoaW4gb3RoZXIgd29yZHMsIGFcbiAqIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEgd2lsbCBiZSBzdG9yZWQgaW4gYFRWaWV3LmRhdGFgIGF0IHRoZSBzYW1lIGluZGV4IGFzIGEgYm91bmQgdmFsdWUgaW5cbiAqIGBMVmlld2ApLiBNZXRhZGF0YSBhcmUgcmVwcmVzZW50ZWQgYXMgYElOVEVSUE9MQVRJT05fREVMSU1JVEVSYC1kZWxpbWl0ZWQgc3RyaW5nIHdpdGggdGhlXG4gKiBmb2xsb3dpbmcgZm9ybWF0OlxuICogLSBgcHJvcGVydHlOYW1lYCBmb3IgYm91bmQgcHJvcGVydGllcztcbiAqIC0gYHByb3BlcnR5TmFtZe+/vXByZWZpeO+/vWludGVycG9sYXRpb25fc3RhdGljX3BhcnQx77+9Li5pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Tu+/vXN1ZmZpeGAgZm9yXG4gKiBpbnRlcnBvbGF0ZWQgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSBtZXRhLWRhdGEgd2lsbCBiZSBzYXZlZDtcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRoYXQgaXMgYSB0YXJnZXQgb2YgdGhlIGJpbmRpbmc7XG4gKiBAcGFyYW0gcHJvcGVydHlOYW1lIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGJpbmRpbmcgaW5kZXggaW4gYExWaWV3YFxuICogQHBhcmFtIGludGVycG9sYXRpb25QYXJ0cyBzdGF0aWMgaW50ZXJwb2xhdGlvbiBwYXJ0cyAoZm9yIHByb3BlcnR5IGludGVycG9sYXRpb25zKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIC4uLmludGVycG9sYXRpb25QYXJ0czogc3RyaW5nW10pIHtcbiAgLy8gQmluZGluZyBtZXRhLWRhdGEgYXJlIHN0b3JlZCBvbmx5IHRoZSBmaXJzdCB0aW1lIGEgZ2l2ZW4gcHJvcGVydHkgaW5zdHJ1Y3Rpb24gaXMgcHJvY2Vzc2VkLlxuICAvLyBTaW5jZSB3ZSBkb24ndCBoYXZlIGEgY29uY2VwdCBvZiB0aGUgXCJmaXJzdCB1cGRhdGUgcGFzc1wiIHdlIG5lZWQgdG8gY2hlY2sgZm9yIHByZXNlbmNlIG9mIHRoZVxuICAvLyBiaW5kaW5nIG1ldGEtZGF0YSB0byBkZWNpZGUgaWYgb25lIHNob3VsZCBiZSBzdG9yZWQgKG9yIGlmIHdhcyBzdG9yZWQgYWxyZWFkeSkuXG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXhdID09PSBudWxsKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PSBudWxsIHx8ICF0Tm9kZS5pbnB1dHNbcHJvcGVydHlOYW1lXSkge1xuICAgICAgY29uc3QgcHJvcEJpbmRpbmdJZHhzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncyB8fCAodE5vZGUucHJvcGVydHlCaW5kaW5ncyA9IFtdKTtcbiAgICAgIHByb3BCaW5kaW5nSWR4cy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICBsZXQgYmluZGluZ01ldGFkYXRhID0gcHJvcGVydHlOYW1lO1xuICAgICAgaWYgKGludGVycG9sYXRpb25QYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGJpbmRpbmdNZXRhZGF0YSArPVxuICAgICAgICAgICAgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBpbnRlcnBvbGF0aW9uUGFydHMuam9pbihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICB9XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gYmluZGluZ01ldGFkYXRhO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY29uc3QgQ0xFQU5fUFJPTUlTRSA9IF9DTEVBTl9QUk9NSVNFO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAoKSA6IFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVFZpZXdDbGVhbnVwKHRWaWV3OiBUVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBuZ0Rldk1vZGUgPyBuZXcgVENsZWFudXAoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKFxuICAgIGN1cnJlbnREZWY6IERpcmVjdGl2ZURlZjxhbnk+fG51bGwsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgLy8gVE9ETyhGVy0yMDQzKTogdGhlIGBjdXJyZW50RGVmYCBpcyBudWxsIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgaW52b2tlZCB3aGlsZSBjcmVhdGluZyByb290XG4gIC8vIGNvbXBvbmVudCAoc2VlIHBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50LnRzKS4gVGhpcyBpcyBub3QgY29uc2lzdGVudCB3aXRoIHRoZSBwcm9jZXNzXG4gIC8vIG9mIGNyZWF0aW5nIGlubmVyIGNvbXBvbmVudHMsIHdoZW4gY3VycmVudCBkaXJlY3RpdmUgaW5kZXggaXMgYXZhaWxhYmxlIGluIHRoZSBzdGF0ZS4gSW4gb3JkZXJcbiAgLy8gdG8gYXZvaWQgcmVseWluZyBvbiBjdXJyZW50IGRlZiBiZWluZyBgbnVsbGAgKHRodXMgc3BlY2lhbC1jYXNpbmcgcm9vdCBjb21wb25lbnQgY3JlYXRpb24pLCB0aGVcbiAgLy8gcHJvY2VzcyBvZiBjcmVhdGluZyByb290IGNvbXBvbmVudCBzaG91bGQgYmUgdW5pZmllZCB3aXRoIHRoZSBwcm9jZXNzIG9mIGNyZWF0aW5nIGlubmVyXG4gIC8vIGNvbXBvbmVudHMuXG4gIGlmIChjdXJyZW50RGVmID09PSBudWxsIHx8IGlzQ29tcG9uZW50RGVmKGN1cnJlbnREZWYpKSB7XG4gICAgbFZpZXcgPSB1bndyYXBMVmlldyhsVmlld1t0Tm9kZS5pbmRleF0pITtcbiAgfVxuICByZXR1cm4gbFZpZXdbUkVOREVSRVJdO1xufVxuXG4vKiogSGFuZGxlcyBhbiBlcnJvciB0aHJvd24gaW4gYW4gTFZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXJyb3IobFZpZXc6IExWaWV3LCBlcnJvcjogYW55KTogdm9pZCB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3RvciA/IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpIDogbnVsbDtcbiAgZXJyb3JIYW5kbGVyICYmIGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBpbnB1dHMgb2YgZGlyZWN0aXZlcyBhdCB0aGUgY3VycmVudCBub2RlIHRvIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiAgICAgICAgcG9zc2libHkgbWluaWZpZWQsIHByb3BlcnR5IG5hbWVzIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgcHVibGljTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBpbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGlucHV0c1tpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBpbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGRlZi5zZXRJbnB1dCAhPT0gbnVsbCkge1xuICAgICAgZGVmLnNldElucHV0IShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKHZhbHVlLCAnVmFsdWUgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAndmFsdWUgc2hvdWxkIG5vdCBiZSBOT19DSEFOR0UnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICB1cGRhdGVUZXh0Tm9kZShsVmlld1tSRU5ERVJFUl0sIGVsZW1lbnQsIHZhbHVlKTtcbn1cbiJdfQ==