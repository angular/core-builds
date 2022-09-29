/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ErrorHandler } from '../../error_handler';
import { RuntimeError } from '../../errors';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDefined, assertEqual, assertGreaterThan, assertGreaterThanOrEqual, assertIndexInRange, assertNotEqual, assertNotSame, assertSame, assertString } from '../../util/assert';
import { escapeCommentText } from '../../util/dom';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { stringify } from '../../util/stringify';
import { assertFirstCreatePass, assertFirstUpdatePass, assertLContainer, assertLView, assertTNodeForLView, assertTNodeForTView } from '../assert';
import { attachPatchData } from '../context_discovery';
import { getFactoryDef } from '../definition_factory';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeCheckHooks, executeInitAndCheckHooks, incrementInitPhaseFlags } from '../hooks';
import { CONTAINER_HEADER_OFFSET, HAS_TRANSPLANTED_VIEWS, MOVED_VIEWS } from '../interfaces/container';
import { NodeInjectorFactory } from '../interfaces/injector';
import { getUniqueLViewId } from '../interfaces/lview_tracking';
import { isComponentDef, isComponentHost, isContentQueryHost, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, EMBEDDED_VIEW_INJECTOR, FLAGS, HEADER_OFFSET, HOST, ID, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TRANSPLANTED_VIEWS_TO_REFRESH, TVIEW } from '../interfaces/view';
import { assertPureTNodeType, assertTNodeType } from '../node_assert';
import { updateTextNode } from '../node_manipulation';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { profiler } from '../profiler';
import { enterView, getBindingsEnabled, getCurrentDirectiveIndex, getCurrentParentTNode, getCurrentTNodePlaceholderOk, getSelectedIndex, isCurrentTNodeParent, isInCheckNoChangesMode, isInI18nBlock, leaveView, setBindingIndex, setBindingRootForHostBindings, setCurrentDirectiveIndex, setCurrentQueryIndex, setCurrentTNode, setIsInCheckNoChangesMode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER } from '../util/misc_utils';
import { renderStringify, stringifyForError } from '../util/stringify_utils';
import { getFirstLContainer, getLViewParent, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, isCreationMode, resetPreOrderHookFlags, unwrapLView, updateTransplantedViewCount, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { ɵɵdirectiveInject } from './di';
import { handleUnknownPropertyError, isPropertyValid, matchingSchemas } from './element_validation';
import { attachLContainerDebug, attachLViewDebug, cloneToLViewFromTViewBlueprint, cloneToTViewData, LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeDebug, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor } from './lview_debug';
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
                hostBindingFn(2 /* RenderFlags.Update */, context);
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
                directiveDef.contentQueries(2 /* RenderFlags.Update */, lView[directiveDefIdx], directiveDefIdx);
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
export function createLView(parentLView, tView, context, flags, host, tHostNode, rendererFactory, renderer, sanitizer, injector, embeddedViewInjector) {
    const lView = ngDevMode ? cloneToLViewFromTViewBlueprint(tView) : tView.blueprint.slice();
    lView[HOST] = host;
    lView[FLAGS] = flags | 4 /* LViewFlags.CreationMode */ | 64 /* LViewFlags.Attached */ | 8 /* LViewFlags.FirstLViewPass */;
    if (embeddedViewInjector !== null ||
        (parentLView && (parentLView[FLAGS] & 1024 /* LViewFlags.HasEmbeddedViewInjector */))) {
        lView[FLAGS] |= 1024 /* LViewFlags.HasEmbeddedViewInjector */;
    }
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
    lView[ID] = getUniqueLViewId();
    lView[EMBEDDED_VIEW_INJECTOR] = embeddedViewInjector;
    ngDevMode &&
        assertEqual(tView.type == 2 /* TViewType.Embedded */ ? parentLView !== null : true, true, 'Embedded views must have parentLView');
    lView[DECLARATION_COMPONENT_VIEW] =
        tView.type == 2 /* TViewType.Embedded */ ? parentLView[DECLARATION_COMPONENT_VIEW] : lView;
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
            tNode.flags |= 32 /* TNodeFlags.isDetached */;
        }
    }
    else if (tNode.type & 64 /* TNodeType.Placeholder */) {
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
            executeViewQueryFn(1 /* RenderFlags.Create */, viewQuery, context);
        }
        // Execute a template associated with this view, if it exists. A template function might not be
        // defined for the root component views.
        const templateFn = tView.template;
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 1 /* RenderFlags.Create */, context);
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
            executeViewQueryFn(2 /* RenderFlags.Update */, tView.viewQuery, context);
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
        lView[FLAGS] &= ~4 /* LViewFlags.CreationMode */;
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
    if ((flags & 128 /* LViewFlags.Destroyed */) === 128 /* LViewFlags.Destroyed */)
        return;
    enterView(lView);
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to execute lifecycle hooks in that mode.
    const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
    try {
        resetPreOrderHookFlags(lView);
        setBindingIndex(tView.bindingStartIndex);
        if (templateFn !== null) {
            executeTemplate(tView, lView, templateFn, 2 /* RenderFlags.Update */, context);
        }
        const hooksInitPhaseCompleted = (flags & 3 /* LViewFlags.InitPhaseStateMask */) === 3 /* InitPhaseState.InitPhaseCompleted */;
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
                    executeInitAndCheckHooks(lView, preOrderHooks, 0 /* InitPhaseState.OnInitHooksToBeRun */, null);
                }
                incrementInitPhaseFlags(lView, 0 /* InitPhaseState.OnInitHooksToBeRun */);
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
                    executeInitAndCheckHooks(lView, contentHooks, 1 /* InitPhaseState.AfterContentInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 1 /* InitPhaseState.AfterContentInitHooksToBeRun */);
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
            executeViewQueryFn(2 /* RenderFlags.Update */, viewQuery, context);
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
                    executeInitAndCheckHooks(lView, viewHooks, 2 /* InitPhaseState.AfterViewInitHooksToBeRun */);
                }
                incrementInitPhaseFlags(lView, 2 /* InitPhaseState.AfterViewInitHooksToBeRun */);
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
            lView[FLAGS] &= ~(32 /* LViewFlags.Dirty */ | 8 /* LViewFlags.FirstLViewPass */);
        }
        if (lView[FLAGS] & 512 /* LViewFlags.RefreshTransplantedView */) {
            lView[FLAGS] &= ~512 /* LViewFlags.RefreshTransplantedView */;
            updateTransplantedViewCount(lView[PARENT], -1);
        }
    }
    finally {
        leaveView();
    }
}
function executeTemplate(tView, lView, templateFn, rf, context) {
    const prevSelectedIndex = getSelectedIndex();
    const isUpdatePhase = rf & 2 /* RenderFlags.Update */;
    try {
        setSelectedIndex(-1);
        if (isUpdatePhase && lView.length > HEADER_OFFSET) {
            // When we're updating, inherently select 0 so we don't
            // have to generate that instruction for most update blocks.
            selectIndexInternal(tView, lView, HEADER_OFFSET, !!ngDevMode && isInCheckNoChangesMode());
        }
        const preHookType = isUpdatePhase ? 2 /* ProfilerEvent.TemplateUpdateStart */ : 0 /* ProfilerEvent.TemplateCreateStart */;
        profiler(preHookType, context);
        templateFn(rf, context);
    }
    finally {
        setSelectedIndex(prevSelectedIndex);
        const postHookType = isUpdatePhase ? 3 /* ProfilerEvent.TemplateUpdateEnd */ : 1 /* ProfilerEvent.TemplateCreateEnd */;
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
                def.contentQueries(1 /* RenderFlags.Create */, lView[directiveIndex], directiveIndex);
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
    if ((tNode.flags & 64 /* TNodeFlags.hasHostBindings */) === 64 /* TNodeFlags.hasHostBindings */) {
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
export function getOrCreateComponentTView(def) {
    const tView = def.tView;
    // Create a TView if there isn't one, or recreate it if the first create pass didn't
    // complete successfully since we can't know for sure whether it's in a usable shape.
    if (tView === null || tView.incompleteFirstPass) {
        // Declaration node here is null since this function is called when we dynamically create a
        // component and hence there is no declaration.
        const declTNode = null;
        return def.tView = createTView(1 /* TViewType.Component */, declTNode, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts);
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
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param rendererFactory Factory function to create renderer instance.
 * @param elementOrSelector Render element or CSS selector to locate the element.
 * @param encapsulation View Encapsulation defined for component that requests host element.
 */
export function locateHostElement(renderer, elementOrSelector, encapsulation) {
    // When using native Shadow DOM, do not clear host element to allow native slot projection
    const preserveContent = encapsulation === ViewEncapsulation.ShadowDom;
    return renderer.selectRootElement(elementOrSelector, preserveContent);
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
        -1, // componentOffset: number
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
            componentOffset: -1,
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
/**
 * Generates the `PropertyAliases` data structure from the provided input/output mapping.
 * @param aliasMap Input/output mapping from the directive definition.
 * @param directiveIndex Index of the directive.
 * @param propertyAliases Object in which to store the results.
 * @param hostDirectiveAliasMap Object used to alias or filter out properties for host directives.
 * If the mapping is provided, it'll act as an allowlist, as well as a mapping of what public
 * name inputs/outputs should be exposed under.
 */
function generatePropertyAliases(aliasMap, directiveIndex, propertyAliases, hostDirectiveAliasMap) {
    for (let publicName in aliasMap) {
        if (aliasMap.hasOwnProperty(publicName)) {
            propertyAliases = propertyAliases === null ? {} : propertyAliases;
            const internalName = aliasMap[publicName];
            // If there are no host directive mappings, we want to remap using the alias map from the
            // definition itself. If there is an alias map, it has two functions:
            // 1. It serves as an allowlist of bindings that are exposed by the host directives. Only the
            // ones inside the host directive map will be exposed on the host.
            // 2. The public name of the property is aliased using the host directive alias map, rather
            // than the alias map from the definition.
            if (hostDirectiveAliasMap === null) {
                addPropertyAlias(propertyAliases, directiveIndex, publicName, internalName);
            }
            else if (hostDirectiveAliasMap.hasOwnProperty(publicName)) {
                addPropertyAlias(propertyAliases, directiveIndex, hostDirectiveAliasMap[publicName], internalName);
            }
        }
    }
    return propertyAliases;
}
function addPropertyAlias(propertyAliases, directiveIndex, publicName, internalName) {
    if (propertyAliases.hasOwnProperty(publicName)) {
        propertyAliases[publicName].push(directiveIndex, internalName);
    }
    else {
        propertyAliases[publicName] = [directiveIndex, internalName];
    }
}
/**
 * Initializes data structures required to work with directive inputs and outputs.
 * Initialization is done for all directives matched on a given TNode.
 */
export function initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefinitionMap) {
    ngDevMode && assertFirstCreatePass(tView);
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const tViewData = tView.data;
    const tNodeAttrs = tNode.attrs;
    const inputsFromAttrs = ngDevMode ? new TNodeInitialInputs() : [];
    let inputsStore = null;
    let outputsStore = null;
    for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
        const directiveDef = tViewData[directiveIndex];
        const aliasData = hostDirectiveDefinitionMap ? hostDirectiveDefinitionMap.get(directiveDef) : null;
        const aliasedInputs = aliasData ? aliasData.inputs : null;
        const aliasedOutputs = aliasData ? aliasData.outputs : null;
        inputsStore =
            generatePropertyAliases(directiveDef.inputs, directiveIndex, inputsStore, aliasedInputs);
        outputsStore =
            generatePropertyAliases(directiveDef.outputs, directiveIndex, outputsStore, aliasedOutputs);
        // Do not use unbound attributes as inputs to structural directives, since structural
        // directive inputs can only be set using microsyntax (e.g. `<div *dir="exp">`).
        // TODO(FW-1930): microsyntax expressions may also contain unbound/static attributes, which
        // should be set for inline templates.
        const initialInputs = (inputsStore !== null && tNodeAttrs !== null && !isInlineTemplate(tNode)) ?
            generateInitialInputs(inputsStore, directiveIndex, tNodeAttrs) :
            null;
        inputsFromAttrs.push(initialInputs);
    }
    if (inputsStore !== null) {
        if (inputsStore.hasOwnProperty('class')) {
            tNode.flags |= 8 /* TNodeFlags.hasClassInput */;
        }
        if (inputsStore.hasOwnProperty('style')) {
            tNode.flags |= 16 /* TNodeFlags.hasStyleInput */;
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
    else if (tNode.type & 3 /* TNodeType.AnyRNode */) {
        propName = mapPropName(propName);
        if (ngDevMode) {
            validateAgainstEventProperties(propName);
            if (!isPropertyValid(element, propName, tNode.value, tView.schemas)) {
                handleUnknownPropertyError(propName, tNode.value, tNode.type, lView);
            }
            ngDevMode.rendererSetProperty++;
        }
        // It is assumed that the sanitizer is only added when the compiler determines that the
        // property is risky, so sanitization can be done without further checks.
        value = sanitizer != null ? sanitizer(value, tNode.value || '', propName) : value;
        renderer.setProperty(element, propName, value);
    }
    else if (tNode.type & 12 /* TNodeType.AnyContainer */) {
        // If the node is a container and the property didn't
        // match any of the inputs or schemas we should throw.
        if (ngDevMode && !matchingSchemas(tView.schemas, tNode.value)) {
            handleUnknownPropertyError(propName, tNode.value, tNode.type, lView);
        }
    }
}
/** If node is an OnPush component, marks its LView dirty. */
export function markDirtyIfOnPush(lView, viewIndex) {
    ngDevMode && assertLView(lView);
    const childComponentLView = getComponentLViewByIndex(viewIndex, lView);
    if (!(childComponentLView[FLAGS] & 16 /* LViewFlags.CheckAlways */)) {
        childComponentLView[FLAGS] |= 32 /* LViewFlags.Dirty */;
    }
}
function setNgReflectProperty(lView, element, type, attrName, value) {
    const renderer = lView[RENDERER];
    attrName = normalizeDebugBindingName(attrName);
    const debugValue = normalizeDebugBindingValue(value);
    if (type & 3 /* TNodeType.AnyRNode */) {
        if (value == null) {
            renderer.removeAttribute(element, attrName);
        }
        else {
            renderer.setAttribute(element, attrName, debugValue);
        }
    }
    else {
        const textContent = escapeCommentText(`bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`);
        renderer.setValue(element, textContent);
    }
}
export function setNgReflectProperties(lView, element, type, dataValue, value) {
    if (type & (3 /* TNodeType.AnyRNode */ | 4 /* TNodeType.Container */)) {
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
/**
 * Resolve the matched directives on a node.
 */
export function resolveDirectives(tView, lView, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in
    // tsickle.
    ngDevMode && assertFirstCreatePass(tView);
    let hasDirectives = false;
    if (getBindingsEnabled()) {
        const exportsMap = localRefs === null ? null : { '': -1 };
        const matchResult = findDirectiveDefMatches(tView, lView, tNode);
        let directiveDefs;
        let hostDirectiveDefs;
        if (matchResult === null) {
            directiveDefs = hostDirectiveDefs = null;
        }
        else {
            [directiveDefs, hostDirectiveDefs] = matchResult;
        }
        if (directiveDefs !== null) {
            // Publishes the directive types to DI so they can be injected. Needs to
            // happen in a separate pass before the TNode flags have been initialized.
            for (let i = 0; i < directiveDefs.length; i++) {
                diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, directiveDefs[i].type);
            }
            hasDirectives = true;
            initializeDirectives(tView, lView, tNode, directiveDefs, exportsMap, hostDirectiveDefs);
        }
        if (exportsMap)
            cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    }
    // Merge the template attrs last so that they have the highest priority.
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
    return hasDirectives;
}
/** Initializes the data structures necessary for a list of directives to be instantiated. */
export function initializeDirectives(tView, lView, tNode, directives, exportsMap, hostDirectiveDefs) {
    ngDevMode && assertFirstCreatePass(tView);
    initTNodeFlags(tNode, tView.data.length, directives.length);
    // When the same token is provided by several directives on the same node, some rules apply in
    // the viewEngine:
    // - viewProviders have priority over providers
    // - the last directive in NgModule.declarations has priority over the previous one
    // So to match these rules, the order in which providers are added in the arrays is very
    // important.
    for (let i = 0; i < directives.length; i++) {
        const def = directives[i];
        if (def.providersResolver)
            def.providersResolver(def);
    }
    let preOrderHooksFound = false;
    let preOrderCheckHooksFound = false;
    let directiveIdx = allocExpando(tView, lView, directives.length, null);
    ngDevMode &&
        assertSame(directiveIdx, tNode.directiveStart, 'TNode.directiveStart should point to just allocated space');
    for (let i = 0; i < directives.length; i++) {
        const def = directives[i];
        // Merge the attrs in the order of matches. This assumes that the first directive is the
        // component itself, so that the component has the least priority.
        tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, def.hostAttrs);
        configureViewWithDirective(tView, tNode, lView, directiveIdx, def);
        saveNameToExportMap(directiveIdx, def, exportsMap);
        if (def.contentQueries !== null)
            tNode.flags |= 4 /* TNodeFlags.hasContentQuery */;
        if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0)
            tNode.flags |= 64 /* TNodeFlags.hasHostBindings */;
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
    initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefs);
}
/**
 * Add `hostBindings` to the `TView.hostBindingOpCodes`.
 *
 * @param tView `TView` to which the `hostBindings` should be added.
 * @param tNode `TNode` the element which contains the directive
 * @param directiveIdx Directive index in view.
 * @param directiveVarsIdx Where will the directive's vars be stored
 * @param def `ComponentDef`/`DirectiveDef`, which contains the `hostVars`/`hostBindings` to add.
 */
export function registerHostBindingOpCodes(tView, tNode, directiveIdx, directiveVarsIdx, def) {
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
            ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */);
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
export function invokeDirectivesHostBindings(tView, lView, tNode) {
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
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
        def.hostBindings(1 /* RenderFlags.Create */, directive);
    }
}
/**
 * Matches the current node against all available selectors.
 * If a component is matched (at most one), it is returned in first position in the array.
 */
function findDirectiveDefMatches(tView, lView, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
    const registry = tView.directiveRegistry;
    let matches = null;
    let hostDirectiveDefs = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors, /* isProjectionMode */ false)) {
                matches || (matches = ngDevMode ? new MatchesArray() : []);
                if (isComponentDef(def)) {
                    if (ngDevMode) {
                        assertTNodeType(tNode, 2 /* TNodeType.Element */, `"${tNode.value}" tags cannot be used as component hosts. ` +
                            `Please use a different tag to activate the ${stringify(def.type)} component.`);
                        if (isComponentHost(tNode)) {
                            throwMultipleComponentError(tNode, matches.find(isComponentDef).type, def.type);
                        }
                    }
                    // Components are inserted at the front of the matches array so that their lifecycle
                    // hooks run before any directive lifecycle hooks. This appears to be for ViewEngine
                    // compatibility. This logic doesn't make sense with host directives, because it
                    // would allow the host directives to undo any overrides the host may have made.
                    // To handle this case, the host directives of components are inserted at the beginning
                    // of the array, followed by the component. As such, the insertion order is as follows:
                    // 1. Host directives belonging to the selector-matched component.
                    // 2. Selector-matched component.
                    // 3. Host directives belonging to selector-matched directives.
                    // 4. Selector-matched directives.
                    if (def.findHostDirectiveDefs !== null) {
                        const hostDirectiveMatches = [];
                        hostDirectiveDefs = hostDirectiveDefs || new Map();
                        def.findHostDirectiveDefs(def, hostDirectiveMatches, hostDirectiveDefs);
                        // Add all host directives declared on this component, followed by the component itself.
                        // Host directives should execute first so the host has a chance to override changes
                        // to the DOM made by them.
                        matches.unshift(...hostDirectiveMatches, def);
                        // Component is offset starting from the beginning of the host directives array.
                        const componentOffset = hostDirectiveMatches.length;
                        markAsComponentHost(tView, tNode, componentOffset);
                    }
                    else {
                        // No host directives on this component, just add the
                        // component def to the beginning of the matches.
                        matches.unshift(def);
                        markAsComponentHost(tView, tNode, 0);
                    }
                }
                else {
                    // Append any host directives to the matches first.
                    hostDirectiveDefs = hostDirectiveDefs || new Map();
                    def.findHostDirectiveDefs?.(def, matches, hostDirectiveDefs);
                    matches.push(def);
                }
            }
        }
    }
    return matches === null ? null : [matches, hostDirectiveDefs];
}
/**
 * Marks a given TNode as a component's host. This consists of:
 * - setting the component offset on the TNode.
 * - storing index of component's host element so it will be queued for view refresh during CD.
 */
export function markAsComponentHost(tView, hostTNode, componentOffset) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertGreaterThan(componentOffset, -1, 'componentOffset must be great than -1');
    hostTNode.componentOffset = componentOffset;
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
                throw new RuntimeError(-301 /* RuntimeErrorCode.EXPORT_NOT_FOUND */, ngDevMode && `Export of name '${localRefs[i + 1]}' not found!`);
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
    tNode.flags |= 1 /* TNodeFlags.isDirectiveHost */;
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
export function configureViewWithDirective(tView, tNode, lView, directiveIndex, def) {
    ngDevMode &&
        assertGreaterThanOrEqual(directiveIndex, HEADER_OFFSET, 'Must be in Expando section');
    tView.data[directiveIndex] = def;
    const directiveFactory = def.factory || (def.factory = getFactoryDef(def.type, true));
    // Even though `directiveFactory` will already be using `ɵɵdirectiveInject` in its generated code,
    // we also want to support `inject()` directly from the directive constructor context so we set
    // `ɵɵdirectiveInject` as the inject implementation here too.
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), ɵɵdirectiveInject);
    tView.blueprint[directiveIndex] = nodeInjectorFactory;
    lView[directiveIndex] = nodeInjectorFactory;
    registerHostBindingOpCodes(tView, tNode, directiveIndex, allocExpando(tView, lView, def.hostVars, NO_CHANGE), def);
}
function addComponentLogic(lView, hostTNode, def) {
    const native = getNativeByTNode(hostTNode, lView);
    const tView = getOrCreateComponentTView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    const rendererFactory = lView[RENDERER_FACTORY];
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 32 /* LViewFlags.Dirty */ : 16 /* LViewFlags.CheckAlways */, native, hostTNode, rendererFactory, rendererFactory.createRenderer(native, def), null, null, null));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[hostTNode.index] = componentView;
}
export function elementAttributeInternal(tNode, lView, name, value, sanitizer, namespace) {
    if (ngDevMode) {
        assertNotSame(value, NO_CHANGE, 'Incoming value should never be NO_CHANGE.');
        validateAgainstEventAttributes(name);
        assertTNodeType(tNode, 2 /* TNodeType.Element */, `Attempted to set attribute \`${name}\` on a container node. ` +
            `Host bindings are not valid on ng-container or ng-template.`);
    }
    const element = getNativeByTNode(tNode, lView);
    setElementAttribute(lView[RENDERER], element, namespace, tNode.value, name, value, sanitizer);
}
export function setElementAttribute(renderer, element, namespace, tagName, name, value, sanitizer) {
    if (value == null) {
        ngDevMode && ngDevMode.rendererRemoveAttribute++;
        renderer.removeAttribute(element, name, namespace);
    }
    else {
        ngDevMode && ngDevMode.rendererSetAttribute++;
        const strValue = sanitizer == null ? renderStringify(value) : sanitizer(value, tagName || '', name);
        renderer.setAttribute(element, name, strValue, namespace);
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
 * @param inputs Input alias map that was generated from the directive def inputs.
 * @param directiveIndex Index of the directive that is currently being processed.
 * @param attrs Static attrs on this node.
 */
function generateInitialInputs(inputs, directiveIndex, attrs) {
    let inputsToStore = null;
    let i = 0;
    while (i < attrs.length) {
        const attrName = attrs[i];
        if (attrName === 0 /* AttributeMarker.NamespaceURI */) {
            // We do not allow inputs on namespaced attributes.
            i += 4;
            continue;
        }
        else if (attrName === 5 /* AttributeMarker.ProjectAs */) {
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
            // Find the input's public name from the input store. Note that we can be found easier
            // through the directive def, but we want to do it using the inputs store so that it can
            // account for host directive aliases.
            const inputConfig = inputs[attrName];
            for (let j = 0; j < inputConfig.length; j += 2) {
                if (inputConfig[j] === directiveIndex) {
                    inputsToStore.push(attrName, inputConfig[j + 1], attrs[i + 1]);
                    // A directive can't have multiple inputs with the same name so we can break here.
                    break;
                }
            }
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
            if ((movedLView[FLAGS] & 512 /* LViewFlags.RefreshTransplantedView */) === 0) {
                updateTransplantedViewCount(insertionLContainer, 1);
            }
            // Note, it is possible that the `movedViews` is tracking views that are transplanted *and*
            // those that aren't (declaration component === insertion component). In the latter case,
            // it's fine to add the flag, as we will clear it immediately in
            // `refreshEmbeddedViews` for the view currently being refreshed.
            movedLView[FLAGS] |= 512 /* LViewFlags.RefreshTransplantedView */;
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
        if (componentView[FLAGS] & (16 /* LViewFlags.CheckAlways */ | 32 /* LViewFlags.Dirty */)) {
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
            if (viewAttachedToChangeDetector(embeddedLView)) {
                if (embeddedLView[FLAGS] & 512 /* LViewFlags.RefreshTransplantedView */) {
                    const embeddedTView = embeddedLView[TVIEW];
                    ngDevMode && assertDefined(embeddedTView, 'TView must be allocated');
                    refreshView(embeddedTView, embeddedLView, embeddedTView.template, embeddedLView[CONTEXT]);
                }
                else if (embeddedLView[TRANSPLANTED_VIEWS_TO_REFRESH] > 0) {
                    refreshContainsDirtyView(embeddedLView);
                }
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
        lView[FLAGS] |= 32 /* LViewFlags.Dirty */;
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
export function detectChangesInternal(tView, lView, context, notifyErrorHandler = true) {
    const rendererFactory = lView[RENDERER_FACTORY];
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to invoke renderer factory functions in that mode
    // to avoid any possible side-effects.
    const checkNoChangesMode = !!ngDevMode && isInCheckNoChangesMode();
    if (!checkNoChangesMode && rendererFactory.begin)
        rendererFactory.begin();
    try {
        refreshView(tView, lView, tView.template, context);
    }
    catch (error) {
        if (notifyErrorHandler) {
            handleError(lView, error);
        }
        throw error;
    }
    finally {
        if (!checkNoChangesMode && rendererFactory.end)
            rendererFactory.end();
    }
}
export function checkNoChangesInternal(tView, lView, context, notifyErrorHandler = true) {
    setIsInCheckNoChangesMode(true);
    try {
        detectChangesInternal(tView, lView, context, notifyErrorHandler);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsOEJBQThCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUUvRyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2TCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoSixPQUFPLEVBQUMsZUFBZSxFQUFtQixNQUFNLHNCQUFzQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNwRCxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsaUJBQWlCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUYsT0FBTyxF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QUUsS0FBSyxDQUFDLENBQUM7QUFDbEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7RG9DaGVjaywgT25DaGFuZ2VzLCBPbkluaXR9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRJbmRleEluUmFuZ2UsIGFzc2VydE5vdEVxdWFsLCBhc3NlcnROb3RTYW1lLCBhc3NlcnRTYW1lLCBhc3NlcnRTdHJpbmd9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXNjYXBlQ29tbWVudFRleHR9IGZyb20gJy4uLy4uL3V0aWwvZG9tJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3MsIGFzc2VydEZpcnN0VXBkYXRlUGFzcywgYXNzZXJ0TENvbnRhaW5lciwgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlRm9yTFZpZXcsIGFzc2VydFROb2RlRm9yVFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YSwgcmVhZFBhdGNoZWRMVmlld30gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uX2ZhY3RvcnknO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlQ2hlY2tIb29rcywgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzLCBpbmNyZW1lbnRJbml0UGhhc2VGbGFnc30gZnJvbSAnLi4vaG9va3MnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgSEFTX1RSQU5TUExBTlRFRF9WSUVXUywgTENvbnRhaW5lciwgTU9WRURfVklFV1N9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgSG9zdERpcmVjdGl2ZURlZnMsIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge2dldFVuaXF1ZUxWaWV3SWR9IGZyb20gJy4uL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzZXMsIFByb3BlcnR5QWxpYXNWYWx1ZSwgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHNPckZhY3RvcnksIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlciwgUmVuZGVyZXJGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdCwgaXNDb250ZW50UXVlcnlIb3N0LCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEVNQkVEREVEX1ZJRVdfSU5KRUNUT1IsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb3N0QmluZGluZ09wQ29kZXMsIElELCBJbml0UGhhc2VTdGF0ZSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBTQU5JVElaRVIsIFRfSE9TVCwgVERhdGEsIFRSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNILCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0UHVyZVROb2RlVHlwZSwgYXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge3VwZGF0ZVRleHROb2RlfSBmcm9tICcuLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2lzSW5saW5lVGVtcGxhdGUsIGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtwcm9maWxlciwgUHJvZmlsZXJFdmVudH0gZnJvbSAnLi4vcHJvZmlsZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBnZXRDdXJyZW50UGFyZW50VE5vZGUsIGdldEN1cnJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaywgZ2V0U2VsZWN0ZWRJbmRleCwgaXNDdXJyZW50VE5vZGVQYXJlbnQsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGlzSW5JMThuQmxvY2ssIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0Q3VycmVudFROb2RlLCBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7bWVyZ2VIb3N0QXR0cnN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5LCBzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXRGaXJzdExDb250YWluZXIsIGdldExWaWV3UGFyZW50LCBnZXROZXh0TENvbnRhaW5lcn0gZnJvbSAnLi4vdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgaXNDcmVhdGlvbk1vZGUsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHVud3JhcExWaWV3LCB1cGRhdGVUcmFuc3BsYW50ZWRWaWV3Q291bnQsIHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3J9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2VsZWN0SW5kZXhJbnRlcm5hbH0gZnJvbSAnLi9hZHZhbmNlJztcbmltcG9ydCB7ybXJtWRpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2hhbmRsZVVua25vd25Qcm9wZXJ0eUVycm9yLCBpc1Byb3BlcnR5VmFsaWQsIG1hdGNoaW5nU2NoZW1hc30gZnJvbSAnLi9lbGVtZW50X3ZhbGlkYXRpb24nO1xuaW1wb3J0IHthdHRhY2hMQ29udGFpbmVyRGVidWcsIGF0dGFjaExWaWV3RGVidWcsIGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCwgY2xvbmVUb1RWaWV3RGF0YSwgTENsZWFudXAsIExWaWV3Qmx1ZXByaW50LCBNYXRjaGVzQXJyYXksIFRDbGVhbnVwLCBUTm9kZURlYnVnLCBUTm9kZUluaXRpYWxJbnB1dHMsIFROb2RlTG9jYWxOYW1lcywgVFZpZXdDb21wb25lbnRzLCBUVmlld0NvbnN0cnVjdG9yfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcblxuLyoqXG4gKiBJbnZva2UgYEhvc3RCaW5kaW5nc0Z1bmN0aW9uYHMgZm9yIHZpZXcuXG4gKlxuICogVGhpcyBtZXRob2RzIGV4ZWN1dGVzIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLiBJdCBpcyB1c2VkIHRvIGV4ZWN1dGUgdGhlXG4gKiBgSG9zdEJpbmRpbmdzRnVuY3Rpb25gcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzO1xuICBpZiAoaG9zdEJpbmRpbmdPcENvZGVzID09PSBudWxsKSByZXR1cm47XG4gIHRyeSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0QmluZGluZ09wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IGhvc3RCaW5kaW5nT3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIGFyZSBlbGVtZW50IGluZGV4ZXMuXG4gICAgICAgIHNldFNlbGVjdGVkSW5kZXgofm9wQ29kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBQb3NpdGl2ZSBudW1iZXJzIGFyZSBOdW1iZXJUdXBsZSB3aGljaCBzdG9yZSBiaW5kaW5nUm9vdEluZGV4IGFuZCBkaXJlY3RpdmVJbmRleC5cbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gb3BDb2RlO1xuICAgICAgICBjb25zdCBiaW5kaW5nUm9vdEluZHggPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IGhvc3RCaW5kaW5nRm4gPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+O1xuICAgICAgICBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyhiaW5kaW5nUm9vdEluZHgsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tkaXJlY3RpdmVJZHhdO1xuICAgICAgICBob3N0QmluZGluZ0ZuKFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICB9XG59XG5cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5mdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYsICdEaXJlY3RpdmVEZWYgbm90IGZvdW5kLicpO1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAodXBkYXRlIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuLyoqIFJlbmRlcnMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3IChjcmVhdGlvbiBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlbmRlckNoaWxkQ29tcG9uZW50cyhob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRzOiBudW1iZXJbXSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICByZW5kZXJDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3fG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVHxudWxsLCBmbGFnczogTFZpZXdGbGFncywgaG9zdDogUkVsZW1lbnR8bnVsbCxcbiAgICB0SG9zdE5vZGU6IFROb2RlfG51bGwsIHJlbmRlcmVyRmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5fG51bGwsIHJlbmRlcmVyOiBSZW5kZXJlcnxudWxsLFxuICAgIHNhbml0aXplcjogU2FuaXRpemVyfG51bGwsIGluamVjdG9yOiBJbmplY3RvcnxudWxsLFxuICAgIGVtYmVkZGVkVmlld0luamVjdG9yOiBJbmplY3RvcnxudWxsKTogTFZpZXcge1xuICBjb25zdCBsVmlldyA9XG4gICAgICBuZ0Rldk1vZGUgPyBjbG9uZVRvTFZpZXdGcm9tVFZpZXdCbHVlcHJpbnQodFZpZXcpIDogdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICBpZiAoZW1iZWRkZWRWaWV3SW5qZWN0b3IgIT09IG51bGwgfHxcbiAgICAgIChwYXJlbnRMVmlldyAmJiAocGFyZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5IYXNFbWJlZGRlZFZpZXdJbmplY3RvcikpKSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuSGFzRW1iZWRkZWRWaWV3SW5qZWN0b3I7XG4gIH1cbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiB0Vmlldy5kZWNsVE5vZGUgJiYgcGFyZW50TFZpZXcgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Vmlldy5kZWNsVE5vZGUsIHBhcmVudExWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldLCAnUmVuZGVyZXJGYWN0b3J5IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIGxWaWV3W0lEXSA9IGdldFVuaXF1ZUxWaWV3SWQoKTtcbiAgbFZpZXdbRU1CRURERURfVklFV19JTkpFQ1RPUiBhcyBhbnldID0gZW1iZWRkZWRWaWV3SW5qZWN0b3I7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhPT0gbnVsbCA6IHRydWUsIHRydWUsXG4gICAgICAgICAgJ0VtYmVkZGVkIHZpZXdzIG11c3QgaGF2ZSBwYXJlbnRMVmlldycpO1xuICBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gPVxuICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddIDogbFZpZXc7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBhdCB3aGljaCB0aGUgVE5vZGUgc2hvdWxkIGJlIHNhdmVkIChudWxsIGlmIHZpZXcsIHNpbmNlIHRoZXkgYXJlIG5vdFxuICogc2F2ZWQpLlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgVE5vZGUgdG8gY3JlYXRlXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgZWxlbWVudCBmb3IgdGhpcyBub2RlLCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gbmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIGFzc29jaWF0ZWQgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBhdHRycyBBbnkgYXR0cnMgZm9yIHRoZSBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50fFROb2RlVHlwZS5UZXh0LCBuYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdSwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOlxuICAgIFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlRJY3VDb250YWluZXJOb2RlIHtcbiAgbmdEZXZNb2RlICYmIGluZGV4ICE9PSAwICYmICAvLyAwIGFyZSBib2d1cyBub2RlcyBhbmQgdGhleSBhcmUgT0suIFNlZSBgY3JlYXRlQ29udGFpbmVyUmVmYCBpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGB2aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5YCBmb3IgYWRkaXRpb25hbCBjb250ZXh0LlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGluZGV4LCBIRUFERVJfT0ZGU0VULCAnVE5vZGVzIGNhblxcJ3QgYmUgaW4gdGhlIExWaWV3IGhlYWRlci4nKTtcbiAgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uIHNob3J0LCBzbyB0aGF0IHRoZSBWTSB3aWxsIGlubGluZSBpdC5cbiAgbmdEZXZNb2RlICYmIGFzc2VydFB1cmVUTm9kZVR5cGUodHlwZSk7XG4gIGxldCB0Tm9kZSA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgPT09IG51bGwpIHtcbiAgICB0Tm9kZSA9IGNyZWF0ZVROb2RlQXRJbmRleCh0VmlldywgaW5kZXgsIHR5cGUsIG5hbWUsIGF0dHJzKTtcbiAgICBpZiAoaXNJbkkxOG5CbG9jaygpKSB7XG4gICAgICAvLyBJZiB3ZSBhcmUgaW4gaTE4biBibG9jayB0aGVuIGFsbCBlbGVtZW50cyBzaG91bGQgYmUgcHJlIGRlY2xhcmVkIHRocm91Z2ggYFBsYWNlaG9sZGVyYFxuICAgICAgLy8gU2VlIGBUTm9kZVR5cGUuUGxhY2Vob2xkZXJgIGFuZCBgTEZyYW1lLmluSTE4bmAgZm9yIG1vcmUgY29udGV4dC5cbiAgICAgIC8vIElmIHRoZSBgVE5vZGVgIHdhcyBub3QgcHJlLWRlY2xhcmVkIHRoYW4gaXQgbWVhbnMgaXQgd2FzIG5vdCBtZW50aW9uZWQgd2hpY2ggbWVhbnMgaXQgd2FzXG4gICAgICAvLyByZW1vdmVkLCBzbyB3ZSBtYXJrIGl0IGFzIGRldGFjaGVkLlxuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5pc0RldGFjaGVkO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLlBsYWNlaG9sZGVyKSB7XG4gICAgdE5vZGUudHlwZSA9IHR5cGU7XG4gICAgdE5vZGUudmFsdWUgPSBuYW1lO1xuICAgIHROb2RlLmF0dHJzID0gYXR0cnM7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0Q3VycmVudFBhcmVudFROb2RlKCk7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IHBhcmVudCA9PT0gbnVsbCA/IC0xIDogcGFyZW50LmluamVjdG9ySW5kZXg7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlRm9yVFZpZXcodE5vZGUsIHRWaWV3KTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaW5kZXgsIHROb2RlLmluZGV4LCAnRXhwZWN0aW5nIHNhbWUgaW5kZXgnKTtcbiAgfVxuICBzZXRDdXJyZW50VE5vZGUodE5vZGUsIHRydWUpO1xuICByZXR1cm4gdE5vZGUgYXMgVEVsZW1lbnROb2RlICYgVENvbnRhaW5lck5vZGUgJiBURWxlbWVudENvbnRhaW5lck5vZGUgJiBUUHJvamVjdGlvbk5vZGUgJlxuICAgICAgVEljdUNvbnRhaW5lck5vZGU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZUF0SW5kZXgoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCkge1xuICBjb25zdCBjdXJyZW50VE5vZGUgPSBnZXRDdXJyZW50VE5vZGVQbGFjZWhvbGRlck9rKCk7XG4gIGNvbnN0IGlzUGFyZW50ID0gaXNDdXJyZW50VE5vZGVQYXJlbnQoKTtcbiAgY29uc3QgcGFyZW50ID0gaXNQYXJlbnQgPyBjdXJyZW50VE5vZGUgOiBjdXJyZW50VE5vZGUgJiYgY3VycmVudFROb2RlLnBhcmVudDtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMuXG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVtpbmRleF0gPVxuICAgICAgY3JlYXRlVE5vZGUodFZpZXcsIHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSwgdHlwZSwgaW5kZXgsIG5hbWUsIGF0dHJzKTtcbiAgLy8gQXNzaWduIGEgcG9pbnRlciB0byB0aGUgZmlyc3QgY2hpbGQgbm9kZSBvZiBhIGdpdmVuIHZpZXcuIFRoZSBmaXJzdCBub2RlIGlzIG5vdCBhbHdheXMgdGhlIG9uZVxuICAvLyBhdCBpbmRleCAwLCBpbiBjYXNlIG9mIGkxOG4sIGluZGV4IDAgY2FuIGJlIHRoZSBpbnN0cnVjdGlvbiBgaTE4blN0YXJ0YCBhbmQgdGhlIGZpcnN0IG5vZGUgaGFzXG4gIC8vIHRoZSBpbmRleCAxIG9yIG1vcmUsIHNvIHdlIGNhbid0IGp1c3QgY2hlY2sgbm9kZSBpbmRleC5cbiAgaWYgKHRWaWV3LmZpcnN0Q2hpbGQgPT09IG51bGwpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cbiAgaWYgKGN1cnJlbnRUTm9kZSAhPT0gbnVsbCkge1xuICAgIGlmIChpc1BhcmVudCkge1xuICAgICAgLy8gRklYTUUobWlza28pOiBUaGlzIGxvZ2ljIGxvb2tzIHVubmVjZXNzYXJpbHkgY29tcGxpY2F0ZWQuIENvdWxkIHdlIHNpbXBsaWZ5P1xuICAgICAgaWYgKGN1cnJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmIHROb2RlLnBhcmVudCAhPT0gbnVsbCkge1xuICAgICAgICAvLyBXZSBhcmUgaW4gdGhlIHNhbWUgdmlldywgd2hpY2ggbWVhbnMgd2UgYXJlIGFkZGluZyBjb250ZW50IG5vZGUgdG8gdGhlIHBhcmVudCB2aWV3LlxuICAgICAgICBjdXJyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGN1cnJlbnRUTm9kZS5uZXh0ID09PSBudWxsKSB7XG4gICAgICAgIC8vIEluIHRoZSBjYXNlIG9mIGkxOG4gdGhlIGBjdXJyZW50VE5vZGVgIG1heSBhbHJlYWR5IGJlIGxpbmtlZCwgaW4gd2hpY2ggY2FzZSB3ZSBkb24ndCB3YW50XG4gICAgICAgIC8vIHRvIGJyZWFrIHRoZSBsaW5rcyB3aGljaCBpMThuIGNyZWF0ZWQuXG4gICAgICAgIGN1cnJlbnRUTm9kZS5uZXh0ID0gdE5vZGU7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB0Tm9kZTtcbn1cblxuLyoqXG4gKiBXaGVuIGVsZW1lbnRzIGFyZSBjcmVhdGVkIGR5bmFtaWNhbGx5IGFmdGVyIGEgdmlldyBibHVlcHJpbnQgaXMgY3JlYXRlZCAoZS5nLiB0aHJvdWdoXG4gKiBpMThuQXBwbHkoKSksIHdlIG5lZWQgdG8gYWRqdXN0IHRoZSBibHVlcHJpbnQgZm9yIGZ1dHVyZVxuICogdGVtcGxhdGUgcGFzc2VzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIGFzc29jaWF0ZWQgd2l0aCBgTFZpZXdgXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgY29udGFpbmluZyB0aGUgYmx1ZXByaW50IHRvIGFkanVzdFxuICogQHBhcmFtIG51bVNsb3RzVG9BbGxvYyBUaGUgbnVtYmVyIG9mIHNsb3RzIHRvIGFsbG9jIGluIHRoZSBMVmlldywgc2hvdWxkIGJlID4wXG4gKiBAcGFyYW0gaW5pdGlhbFZhbHVlIEluaXRpYWwgdmFsdWUgdG8gc3RvcmUgaW4gYmx1ZXByaW50XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhbGxvY0V4cGFuZG8oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIG51bVNsb3RzVG9BbGxvYzogbnVtYmVyLCBpbml0aWFsVmFsdWU6IGFueSk6IG51bWJlciB7XG4gIGlmIChudW1TbG90c1RvQWxsb2MgPT09IDApIHJldHVybiAtMTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gICAgYXNzZXJ0U2FtZSh0VmlldywgbFZpZXdbVFZJRVddLCAnYExWaWV3YCBtdXN0IGJlIGFzc29jaWF0ZWQgd2l0aCBgVFZpZXdgIScpO1xuICAgIGFzc2VydEVxdWFsKHRWaWV3LmRhdGEubGVuZ3RoLCBsVmlldy5sZW5ndGgsICdFeHBlY3RpbmcgTFZpZXcgdG8gYmUgc2FtZSBzaXplIGFzIFRWaWV3Jyk7XG4gICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgIHRWaWV3LmRhdGEubGVuZ3RoLCB0Vmlldy5ibHVlcHJpbnQubGVuZ3RoLCAnRXhwZWN0aW5nIEJsdWVwcmludCB0byBiZSBzYW1lIHNpemUgYXMgVFZpZXcnKTtcbiAgICBhc3NlcnRGaXJzdFVwZGF0ZVBhc3ModFZpZXcpO1xuICB9XG4gIGNvbnN0IGFsbG9jSWR4ID0gbFZpZXcubGVuZ3RoO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG51bVNsb3RzVG9BbGxvYzsgaSsrKSB7XG4gICAgbFZpZXcucHVzaChpbml0aWFsVmFsdWUpO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKGluaXRpYWxWYWx1ZSk7XG4gICAgdFZpZXcuZGF0YS5wdXNoKG51bGwpO1xuICB9XG4gIHJldHVybiBhbGxvY0lkeDtcbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB0aGUgY3JlYXRpb24gbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBjcmVhdGluZyB2aWV3IHF1ZXJ5IGZ1bmN0aW9ucyAoaWYgYW55KTtcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdGhlIGNyZWF0aW9uIG1vZGU7XG4gKiAtIHVwZGF0aW5nIHN0YXRpYyBxdWVyaWVzIChpZiBhbnkpO1xuICogLSBjcmVhdGluZyBjaGlsZCBjb21wb25lbnRzIGRlZmluZWQgaW4gYSBnaXZlbiB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVuZGVyVmlldzxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzxUPiwgY29udGV4dDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCB0cnVlLCAnU2hvdWxkIGJlIHJ1biBpbiBjcmVhdGlvbiBtb2RlJyk7XG4gIGVudGVyVmlldyhsVmlldyk7XG4gIHRyeSB7XG4gICAgY29uc3Qgdmlld1F1ZXJ5ID0gdFZpZXcudmlld1F1ZXJ5O1xuICAgIGlmICh2aWV3UXVlcnkgIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihSZW5kZXJGbGFncy5DcmVhdGUsIHZpZXdRdWVyeSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gRXhlY3V0ZSBhIHRlbXBsYXRlIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHZpZXcsIGlmIGl0IGV4aXN0cy4gQSB0ZW1wbGF0ZSBmdW5jdGlvbiBtaWdodCBub3QgYmVcbiAgICAvLyBkZWZpbmVkIGZvciB0aGUgcm9vdCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgdGVtcGxhdGVGbiA9IHRWaWV3LnRlbXBsYXRlO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGU8VD4odFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHMuXG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAvLyBuZ0ZvciBsb29wLCBhbGwgdGhlIHZpZXdzIHdpbGwgYmUgY3JlYXRlZCB0b2dldGhlciBiZWZvcmUgdXBkYXRlIG1vZGUgcnVucyBhbmQgdHVybnNcbiAgICAvLyBvZmYgZmlyc3RDcmVhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAvLyBtYXRjaGluZywgZXRjIGFnYWluIGFuZCBhZ2Fpbi5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBXZSByZXNvbHZlIGNvbnRlbnQgcXVlcmllcyBzcGVjaWZpY2FsbHkgbWFya2VkIGFzIGBzdGF0aWNgIGluIGNyZWF0aW9uIG1vZGUuIER5bmFtaWNcbiAgICAvLyBjb250ZW50IHF1ZXJpZXMgYXJlIHJlc29sdmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIChpLmUuIHVwZGF0ZSBtb2RlKSwgYWZ0ZXIgZW1iZWRkZWRcbiAgICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICAgIGlmICh0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcykge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gV2UgbXVzdCBtYXRlcmlhbGl6ZSBxdWVyeSByZXN1bHRzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRzIGFyZSBwcm9jZXNzZWRcbiAgICAvLyBpbiBjYXNlIGEgY2hpbGQgY29tcG9uZW50IGhhcyBwcm9qZWN0ZWQgYSBjb250YWluZXIuIFRoZSBMQ29udGFpbmVyIG5lZWRzXG4gICAgLy8gdG8gZXhpc3Qgc28gdGhlIGVtYmVkZGVkIHZpZXdzIGFyZSBwcm9wZXJseSBhdHRhY2hlZCBieSB0aGUgY29udGFpbmVyLlxuICAgIGlmICh0Vmlldy5zdGF0aWNWaWV3UXVlcmllcykge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFJlbmRlckZsYWdzLlVwZGF0ZSwgdFZpZXcudmlld1F1ZXJ5ISwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gUmVuZGVyIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCBjb21wb25lbnRzID0gdFZpZXcuY29tcG9uZW50cztcbiAgICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgICAgcmVuZGVyQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBJZiB3ZSBkaWRuJ3QgbWFuYWdlIHRvIGdldCBwYXN0IHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzIGR1ZSB0b1xuICAgIC8vIGFuIGVycm9yLCBtYXJrIHRoZSB2aWV3IGFzIGNvcnJ1cHRlZCBzbyB3ZSBjYW4gdHJ5IHRvIHJlY292ZXIuXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuaW5jb21wbGV0ZUZpcnN0UGFzcyA9IHRydWU7XG4gICAgICB0Vmlldy5maXJzdENyZWF0ZVBhc3MgPSBmYWxzZTtcbiAgICB9XG5cbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlO1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbi8qKlxuICogUHJvY2Vzc2VzIGEgdmlldyBpbiB1cGRhdGUgbW9kZS4gVGhpcyBpbmNsdWRlcyBhIG51bWJlciBvZiBzdGVwcyBpbiBhIHNwZWNpZmljIG9yZGVyOlxuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB1cGRhdGUgbW9kZTtcbiAqIC0gZXhlY3V0aW5nIGhvb2tzO1xuICogLSByZWZyZXNoaW5nIHF1ZXJpZXM7XG4gKiAtIHNldHRpbmcgaG9zdCBiaW5kaW5ncztcbiAqIC0gcmVmcmVzaGluZyBjaGlsZCAoZW1iZWRkZWQgYW5kIGNvbXBvbmVudCkgdmlld3MuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoVmlldzxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsIGNvbnRleHQ6IFQpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGZsYWdzID0gbFZpZXdbRkxBR1NdO1xuICBpZiAoKGZsYWdzICYgTFZpZXdGbGFncy5EZXN0cm95ZWQpID09PSBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgcmV0dXJuO1xuICBlbnRlclZpZXcobFZpZXcpO1xuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGV4ZWN1dGUgbGlmZWN5Y2xlIGhvb2tzIGluIHRoYXQgbW9kZS5cbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IG5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG5cbiAgICBzZXRCaW5kaW5nSW5kZXgodFZpZXcuYmluZGluZ1N0YXJ0SW5kZXgpO1xuICAgIGlmICh0ZW1wbGF0ZUZuICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkID1cbiAgICAgICAgKGZsYWdzICYgTFZpZXdGbGFncy5Jbml0UGhhc2VTdGF0ZU1hc2spID09PSBJbml0UGhhc2VTdGF0ZS5Jbml0UGhhc2VDb21wbGV0ZWQ7XG5cbiAgICAvLyBleGVjdXRlIHByZS1vcmRlciBob29rcyAoT25Jbml0LCBPbkNoYW5nZXMsIERvQ2hlY2spXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCBwcmVPcmRlckNoZWNrSG9va3MgPSB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckNoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgcHJlT3JkZXJDaGVja0hvb2tzLCBudWxsKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgcHJlT3JkZXJIb29rcyA9IHRWaWV3LnByZU9yZGVySG9va3M7XG4gICAgICAgIGlmIChwcmVPcmRlckhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckhvb2tzLCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4sIG51bGwpO1xuICAgICAgICB9XG4gICAgICAgIGluY3JlbWVudEluaXRQaGFzZUZsYWdzKGxWaWV3LCBJbml0UGhhc2VTdGF0ZS5PbkluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIEZpcnN0IG1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgYXJlIGRlY2xhcmVkIGluIHRoaXMgbFZpZXcgYXMgbmVlZGluZyBhIHJlZnJlc2ggYXQgdGhlaXJcbiAgICAvLyBpbnNlcnRpb24gcG9pbnRzLiBUaGlzIGlzIG5lZWRlZCB0byBhdm9pZCB0aGUgc2l0dWF0aW9uIHdoZXJlIHRoZSB0ZW1wbGF0ZSBpcyBkZWZpbmVkIGluIHRoaXNcbiAgICAvLyBgTFZpZXdgIGJ1dCBpdHMgZGVjbGFyYXRpb24gYXBwZWFycyBhZnRlciB0aGUgaW5zZXJ0aW9uIGNvbXBvbmVudC5cbiAgICBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3KTtcbiAgICByZWZyZXNoRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgY29udGVudCBob29rcyAoQWZ0ZXJDb250ZW50SW5pdCwgQWZ0ZXJDb250ZW50Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRDaGVja0hvb2tzID0gdFZpZXcuY29udGVudENoZWNrSG9va3M7XG4gICAgICAgIGlmIChjb250ZW50Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBjb250ZW50Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IGNvbnRlbnRIb29rcyA9IHRWaWV3LmNvbnRlbnRIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhcbiAgICAgICAgICAgICAgbFZpZXcsIGNvbnRlbnRIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXcsIGxWaWV3KTtcblxuICAgIC8vIFJlZnJlc2ggY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGxWaWV3LCBjb21wb25lbnRzKTtcbiAgICB9XG5cbiAgICAvLyBWaWV3IHF1ZXJpZXMgbXVzdCBleGVjdXRlIGFmdGVyIHJlZnJlc2hpbmcgY2hpbGQgY29tcG9uZW50cyBiZWNhdXNlIGEgdGVtcGxhdGUgaW4gdGhpcyB2aWV3XG4gICAgLy8gY291bGQgYmUgaW5zZXJ0ZWQgaW4gYSBjaGlsZCBjb21wb25lbnQuIElmIHRoZSB2aWV3IHF1ZXJ5IGV4ZWN1dGVzIGJlZm9yZSBjaGlsZCBjb21wb25lbnRcbiAgICAvLyByZWZyZXNoLCB0aGUgdGVtcGxhdGUgbWlnaHQgbm90IHlldCBiZSBpbnNlcnRlZC5cbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFJlbmRlckZsYWdzLlVwZGF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBleGVjdXRlIHZpZXcgaG9va3MgKEFmdGVyVmlld0luaXQsIEFmdGVyVmlld0NoZWNrZWQpXG4gICAgLy8gUEVSRiBXQVJOSU5HOiBkbyBOT1QgZXh0cmFjdCB0aGlzIHRvIGEgc2VwYXJhdGUgZnVuY3Rpb24gd2l0aG91dCBydW5uaW5nIGJlbmNobWFya3NcbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGlmIChob29rc0luaXRQaGFzZUNvbXBsZXRlZCkge1xuICAgICAgICBjb25zdCB2aWV3Q2hlY2tIb29rcyA9IHRWaWV3LnZpZXdDaGVja0hvb2tzO1xuICAgICAgICBpZiAodmlld0NoZWNrSG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlQ2hlY2tIb29rcyhsVmlldywgdmlld0NoZWNrSG9va3MpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2aWV3SG9va3MgPSB0Vmlldy52aWV3SG9va3M7XG4gICAgICAgIGlmICh2aWV3SG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHZpZXdIb29rcywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLkFmdGVyVmlld0luaXRIb29rc1RvQmVSdW4pO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAodFZpZXcuZmlyc3RVcGRhdGVQYXNzID09PSB0cnVlKSB7XG4gICAgICAvLyBXZSBuZWVkIHRvIG1ha2Ugc3VyZSB0aGF0IHdlIG9ubHkgZmxpcCB0aGUgZmxhZyBvbiBzdWNjZXNzZnVsIGByZWZyZXNoVmlld2Agb25seVxuICAgICAgLy8gRG9uJ3QgZG8gdGhpcyBpbiBgZmluYWxseWAgYmxvY2suXG4gICAgICAvLyBJZiB3ZSBkaWQgdGhpcyBpbiBgZmluYWxseWAgYmxvY2sgdGhlbiBhbiBleGNlcHRpb24gY291bGQgYmxvY2sgdGhlIGV4ZWN1dGlvbiBvZiBzdHlsaW5nXG4gICAgICAvLyBpbnN0cnVjdGlvbnMgd2hpY2ggaW4gdHVybiB3b3VsZCBiZSB1bmFibGUgdG8gaW5zZXJ0IHRoZW1zZWx2ZXMgaW50byB0aGUgc3R5bGluZyBsaW5rZWRcbiAgICAgIC8vIGxpc3QuIFRoZSByZXN1bHQgb2YgdGhpcyB3b3VsZCBiZSB0aGF0IGlmIHRoZSBleGNlcHRpb24gd291bGQgbm90IGJlIHRocm93IG9uIHN1YnNlcXVlbnQgQ0RcbiAgICAgIC8vIHRoZSBzdHlsaW5nIHdvdWxkIGJlIHVuYWJsZSB0byBwcm9jZXNzIGl0IGRhdGEgYW5kIHJlZmxlY3QgdG8gdGhlIERPTS5cbiAgICAgIHRWaWV3LmZpcnN0VXBkYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIERvIG5vdCByZXNldCB0aGUgZGlydHkgc3RhdGUgd2hlbiBydW5uaW5nIGluIGNoZWNrIG5vIGNoYW5nZXMgbW9kZS4gV2UgZG9uJ3Qgd2FudCBjb21wb25lbnRzXG4gICAgLy8gdG8gYmVoYXZlIGRpZmZlcmVudGx5IGRlcGVuZGluZyBvbiB3aGV0aGVyIGNoZWNrIG5vIGNoYW5nZXMgaXMgZW5hYmxlZCBvciBub3QuIEZvciBleGFtcGxlOlxuICAgIC8vIE1hcmtpbmcgYW4gT25QdXNoIGNvbXBvbmVudCBhcyBkaXJ0eSBmcm9tIHdpdGhpbiB0aGUgYG5nQWZ0ZXJWaWV3SW5pdGAgaG9vayBpbiBvcmRlciB0b1xuICAgIC8vIHJlZnJlc2ggYSBgTmdDbGFzc2AgYmluZGluZyBzaG91bGQgd29yay4gSWYgd2Ugd291bGQgcmVzZXQgdGhlIGRpcnR5IHN0YXRlIGluIHRoZSBjaGVja1xuICAgIC8vIG5vIGNoYW5nZXMgY3ljbGUsIHRoZSBjb21wb25lbnQgd291bGQgYmUgbm90IGJlIGRpcnR5IGZvciB0aGUgbmV4dCB1cGRhdGUgcGFzcy4gVGhpcyB3b3VsZFxuICAgIC8vIGJlIGRpZmZlcmVudCBpbiBwcm9kdWN0aW9uIG1vZGUgd2hlcmUgdGhlIGNvbXBvbmVudCBkaXJ0eSBzdGF0ZSBpcyBub3QgcmVzZXQuXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBsVmlld1tGTEFHU10gJj0gfihMVmlld0ZsYWdzLkRpcnR5IHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcyk7XG4gICAgfVxuICAgIGlmIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3KSB7XG4gICAgICBsVmlld1tGTEFHU10gJj0gfkxWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXc7XG4gICAgICB1cGRhdGVUcmFuc3BsYW50ZWRWaWV3Q291bnQobFZpZXdbUEFSRU5UXSBhcyBMQ29udGFpbmVyLCAtMSk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldygpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGV4ZWN1dGVUZW1wbGF0ZTxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzxUPiwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHJmOiBSZW5kZXJGbGFncywgY29udGV4dDogVCkge1xuICBjb25zdCBwcmV2U2VsZWN0ZWRJbmRleCA9IGdldFNlbGVjdGVkSW5kZXgoKTtcbiAgY29uc3QgaXNVcGRhdGVQaGFzZSA9IHJmICYgUmVuZGVyRmxhZ3MuVXBkYXRlO1xuICB0cnkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIGlmIChpc1VwZGF0ZVBoYXNlICYmIGxWaWV3Lmxlbmd0aCA+IEhFQURFUl9PRkZTRVQpIHtcbiAgICAgIC8vIFdoZW4gd2UncmUgdXBkYXRpbmcsIGluaGVyZW50bHkgc2VsZWN0IDAgc28gd2UgZG9uJ3RcbiAgICAgIC8vIGhhdmUgdG8gZ2VuZXJhdGUgdGhhdCBpbnN0cnVjdGlvbiBmb3IgbW9zdCB1cGRhdGUgYmxvY2tzLlxuICAgICAgc2VsZWN0SW5kZXhJbnRlcm5hbCh0VmlldywgbFZpZXcsIEhFQURFUl9PRkZTRVQsICEhbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKSk7XG4gICAgfVxuXG4gICAgY29uc3QgcHJlSG9va1R5cGUgPVxuICAgICAgICBpc1VwZGF0ZVBoYXNlID8gUHJvZmlsZXJFdmVudC5UZW1wbGF0ZVVwZGF0ZVN0YXJ0IDogUHJvZmlsZXJFdmVudC5UZW1wbGF0ZUNyZWF0ZVN0YXJ0O1xuICAgIHByb2ZpbGVyKHByZUhvb2tUeXBlLCBjb250ZXh0IGFzIHVua25vd24gYXMge30pO1xuICAgIHRlbXBsYXRlRm4ocmYsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgocHJldlNlbGVjdGVkSW5kZXgpO1xuXG4gICAgY29uc3QgcG9zdEhvb2tUeXBlID1cbiAgICAgICAgaXNVcGRhdGVQaGFzZSA/IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVVcGRhdGVFbmQgOiBQcm9maWxlckV2ZW50LlRlbXBsYXRlQ3JlYXRlRW5kO1xuICAgIHByb2ZpbGVyKHBvc3RIb29rVHlwZSwgY29udGV4dCBhcyB1bmtub3duIGFzIHt9KTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkge1xuICBpZiAoIWdldEJpbmRpbmdzRW5hYmxlZCgpKSByZXR1cm47XG4gIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykpO1xuICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpID09PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykge1xuICAgIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlldyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gZGVmLnRWaWV3O1xuXG4gIC8vIENyZWF0ZSBhIFRWaWV3IGlmIHRoZXJlIGlzbid0IG9uZSwgb3IgcmVjcmVhdGUgaXQgaWYgdGhlIGZpcnN0IGNyZWF0ZSBwYXNzIGRpZG4ndFxuICAvLyBjb21wbGV0ZSBzdWNjZXNzZnVsbHkgc2luY2Ugd2UgY2FuJ3Qga25vdyBmb3Igc3VyZSB3aGV0aGVyIGl0J3MgaW4gYSB1c2FibGUgc2hhcGUuXG4gIGlmICh0VmlldyA9PT0gbnVsbCB8fCB0Vmlldy5pbmNvbXBsZXRlRmlyc3RQYXNzKSB7XG4gICAgLy8gRGVjbGFyYXRpb24gbm9kZSBoZXJlIGlzIG51bGwgc2luY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBkeW5hbWljYWxseSBjcmVhdGUgYVxuICAgIC8vIGNvbXBvbmVudCBhbmQgaGVuY2UgdGhlcmUgaXMgbm8gZGVjbGFyYXRpb24uXG4gICAgY29uc3QgZGVjbFROb2RlID0gbnVsbDtcbiAgICByZXR1cm4gZGVmLnRWaWV3ID0gY3JlYXRlVFZpZXcoXG4gICAgICAgICAgICAgICBUVmlld1R5cGUuQ29tcG9uZW50LCBkZWNsVE5vZGUsIGRlZi50ZW1wbGF0ZSwgZGVmLmRlY2xzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgICAgICBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnksIGRlZi5zY2hlbWFzLCBkZWYuY29uc3RzKTtcbiAgfVxuXG4gIHJldHVybiB0Vmlldztcbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBUVmlldyBpbnN0YW5jZVxuICpcbiAqIEBwYXJhbSB0eXBlIFR5cGUgb2YgYFRWaWV3YC5cbiAqIEBwYXJhbSBkZWNsVE5vZGUgRGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhpcyBgVFZpZXdgLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb25cbiAqIEBwYXJhbSBkZWNscyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gY29uc3RzIENvbnN0YW50cyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB0eXBlOiBUVmlld1R5cGUsIGRlY2xUTm9kZTogVE5vZGV8bnVsbCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnxudWxsLCBkZWNsczogbnVtYmVyLFxuICAgIHZhcnM6IG51bWJlciwgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeXxudWxsLCBwaXBlczogUGlwZURlZkxpc3RPckZhY3Rvcnl8bnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnxudWxsLCBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgY29uc3RzT3JGYWN0b3J5OiBUQ29uc3RhbnRzT3JGYWN0b3J5fG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgZGVjbHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgY29uc3QgY29uc3RzID0gdHlwZW9mIGNvbnN0c09yRmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJyA/IGNvbnN0c09yRmFjdG9yeSgpIDogY29uc3RzT3JGYWN0b3J5O1xuICBjb25zdCB0VmlldyA9IGJsdWVwcmludFtUVklFVyBhcyBhbnldID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUVmlld0NvbnN0cnVjdG9yKFxuICAgICAgICAgIHR5cGUsICAgICAgICAvLyB0eXBlOiBUVmlld1R5cGUsXG4gICAgICAgICAgYmx1ZXByaW50LCAgIC8vIGJsdWVwcmludDogTFZpZXcsXG4gICAgICAgICAgdGVtcGxhdGVGbiwgIC8vIHRlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgLy8gcXVlcmllczogVFF1ZXJpZXN8bnVsbFxuICAgICAgICAgIHZpZXdRdWVyeSwgICAvLyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsXG4gICAgICAgICAgZGVjbFROb2RlLCAgIC8vIGRlY2xUTm9kZTogVE5vZGV8bnVsbCxcbiAgICAgICAgICBjbG9uZVRvVFZpZXdEYXRhKGJsdWVwcmludCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksICAvLyBkYXRhOiBURGF0YSxcbiAgICAgICAgICBiaW5kaW5nU3RhcnRJbmRleCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBiaW5kaW5nU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgIGluaXRpYWxWaWV3TGVuZ3RoLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGV4cGFuZG9TdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXMsXG4gICAgICAgICAgdHJ1ZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3RDcmVhdGVQYXNzOiBib29sZWFuLFxuICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0VXBkYXRlUGFzczogYm9vbGVhbixcbiAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzdGF0aWNDb250ZW50UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwcmVPcmRlckhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250ZW50SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGVudENoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlc3Ryb3lIb29rczogRGVzdHJveUhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2xlYW51cDogYW55W118bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb250ZW50UXVlcmllczogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgIHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gIC8vXG4gICAgICAgICAgICAgIGRpcmVjdGl2ZXMoKSA6ICAgICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgZGlyZWN0aXZlcywgICAgICAgICAgICAgICAgICAgICAvLyBkaXJlY3RpdmVSZWdpc3RyeTogRGlyZWN0aXZlRGVmTGlzdHxudWxsLFxuICAgICAgICAgIHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcywgIC8vIHBpcGVSZWdpc3RyeTogUGlwZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdENoaWxkOiBUTm9kZXxudWxsLFxuICAgICAgICAgIHNjaGVtYXMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICAgICAgICBjb25zdHMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBjb25zdHM6IFRDb25zdGFudHN8bnVsbFxuICAgICAgICAgIGZhbHNlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGluY29tcGxldGVGaXJzdFBhc3M6IGJvb2xlYW5cbiAgICAgICAgICBkZWNscywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZ0Rldk1vZGUgb25seTogZGVjbHNcbiAgICAgICAgICB2YXJzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBuZ0Rldk1vZGUgb25seTogdmFyc1xuICAgICAgICAgICkgOlxuICAgICAge1xuICAgICAgICB0eXBlOiB0eXBlLFxuICAgICAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgICAgIHF1ZXJpZXM6IG51bGwsXG4gICAgICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgICAgICBkZWNsVE5vZGU6IGRlY2xUTm9kZSxcbiAgICAgICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgICAgIGJpbmRpbmdTdGFydEluZGV4OiBiaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgICAgICBob3N0QmluZGluZ09wQ29kZXM6IG51bGwsXG4gICAgICAgIGZpcnN0Q3JlYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgZmlyc3RVcGRhdGVQYXNzOiB0cnVlLFxuICAgICAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgICAgIGNsZWFudXA6IG51bGwsXG4gICAgICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgICAgICBjb21wb25lbnRzOiBudWxsLFxuICAgICAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgICAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICAgICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICAgICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICAgICAgY29uc3RzOiBjb25zdHMsXG4gICAgICAgIGluY29tcGxldGVGaXJzdFBhc3M6IGZhbHNlXG4gICAgICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHRWaWV3IHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHRWaWV3KTtcbiAgfVxuICByZXR1cm4gdFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmdEZXZNb2RlID8gbmV3IExWaWV3Qmx1ZXByaW50KCkgOiBbXTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxWaWV3TGVuZ3RoOyBpKyspIHtcbiAgICBibHVlcHJpbnQucHVzaChpIDwgYmluZGluZ1N0YXJ0SW5kZXggPyBudWxsIDogTk9fQ0hBTkdFKTtcbiAgfVxuXG4gIHJldHVybiBibHVlcHJpbnQgYXMgTFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUVycm9yKHRleHQ6IHN0cmluZywgdG9rZW46IGFueSkge1xuICByZXR1cm4gbmV3IEVycm9yKGBSZW5kZXJlcjogJHt0ZXh0fSBbJHtzdHJpbmdpZnlGb3JFcnJvcih0b2tlbil9XWApO1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyRmFjdG9yeSBGYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSByZW5kZXJlciBpbnN0YW5jZS5cbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGVuY2Fwc3VsYXRpb24gVmlldyBFbmNhcHN1bGF0aW9uIGRlZmluZWQgZm9yIGNvbXBvbmVudCB0aGF0IHJlcXVlc3RzIGhvc3QgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZUhvc3RFbGVtZW50KFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50fHN0cmluZyxcbiAgICBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbik6IFJFbGVtZW50IHtcbiAgLy8gV2hlbiB1c2luZyBuYXRpdmUgU2hhZG93IERPTSwgZG8gbm90IGNsZWFyIGhvc3QgZWxlbWVudCB0byBhbGxvdyBuYXRpdmUgc2xvdCBwcm9qZWN0aW9uXG4gIGNvbnN0IHByZXNlcnZlQ29udGVudCA9IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgcmV0dXJuIHJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yLCBwcmVzZXJ2ZUNvbnRlbnQpO1xufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICpcbiAqIFRoaXMgZnVuY3Rpb24gY2FuIGFsc28gYmUgdXNlZCB0byBzdG9yZSBpbnN0YW5jZSBzcGVjaWZpYyBjbGVhbnVwIGZucy4gSW4gdGhhdCBjYXNlIHRoZSBgY29udGV4dGBcbiAqIGlzIGBudWxsYCBhbmQgdGhlIGZ1bmN0aW9uIGlzIHN0b3JlIGluIGBMVmlld2AgKHJhdGhlciB0aGFuIGl0IGBUVmlld2ApLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGNvbnRleHQ6IGFueSwgY2xlYW51cEZuOiBGdW5jdGlvbik6IHZvaWQge1xuICBjb25zdCBsQ2xlYW51cCA9IGdldE9yQ3JlYXRlTFZpZXdDbGVhbnVwKGxWaWV3KTtcbiAgaWYgKGNvbnRleHQgPT09IG51bGwpIHtcbiAgICAvLyBJZiBjb250ZXh0IGlzIG51bGwgdGhhdCB0aGlzIGlzIGluc3RhbmNlIHNwZWNpZmljIGNhbGxiYWNrLiBUaGVzZSBjYWxsYmFja3MgY2FuIG9ubHkgYmVcbiAgICAvLyBpbnNlcnRlZCBhZnRlciB0ZW1wbGF0ZSBzaGFyZWQgaW5zdGFuY2VzLiBGb3IgdGhpcyByZWFzb24gaW4gbmdEZXZNb2RlIHdlIGZyZWV6ZSB0aGUgVFZpZXcuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgT2JqZWN0LmZyZWV6ZShnZXRPckNyZWF0ZVRWaWV3Q2xlYW51cCh0VmlldykpO1xuICAgIH1cbiAgICBsQ2xlYW51cC5wdXNoKGNsZWFudXBGbik7XG4gIH0gZWxzZSB7XG4gICAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIGdldE9yQ3JlYXRlVFZpZXdDbGVhbnVwKHRWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgdG8gd2hpY2ggdGhpcyBgVE5vZGVgIGJlbG9uZ3MgKHVzZWQgb25seSBpbiBgbmdEZXZNb2RlYClcbiAqIEBwYXJhbSB0UGFyZW50IFBhcmVudCBgVE5vZGVgXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50fFROb2RlVHlwZS5UZXh0LFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcixcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkljdSwgaW5kZXg6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUSWN1Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbixcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUUHJvamVjdGlvbk5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZSwgaW5kZXg6IG51bWJlcixcbiAgICB2YWx1ZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgaW5kZXggIT09IDAgJiYgIC8vIDAgYXJlIGJvZ3VzIG5vZGVzIGFuZCB0aGV5IGFyZSBPSy4gU2VlIGBjcmVhdGVDb250YWluZXJSZWZgIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYHZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHlgIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoaW5kZXgsIEhFQURFUl9PRkZTRVQsICdUTm9kZXMgY2FuXFwndCBiZSBpbiB0aGUgTFZpZXcgaGVhZGVyLicpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZShhdHRycywgdW5kZWZpbmVkLCAnXFwndW5kZWZpbmVkXFwnIGlzIG5vdCB2YWxpZCB2YWx1ZSBmb3IgXFwnYXR0cnNcXCcnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS50Tm9kZSsrO1xuICBuZ0Rldk1vZGUgJiYgdFBhcmVudCAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHRQYXJlbnQsIHRWaWV3KTtcbiAgbGV0IGluamVjdG9ySW5kZXggPSB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTE7XG4gIGNvbnN0IHROb2RlID0gbmdEZXZNb2RlID9cbiAgICAgIG5ldyBUTm9kZURlYnVnKFxuICAgICAgICAgIHRWaWV3LCAgICAgICAgICAvLyB0Vmlld186IFRWaWV3XG4gICAgICAgICAgdHlwZSwgICAgICAgICAgIC8vIHR5cGU6IFROb2RlVHlwZVxuICAgICAgICAgIGluZGV4LCAgICAgICAgICAvLyBpbmRleDogbnVtYmVyXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGluc2VydEJlZm9yZUluZGV4OiBudWxsfC0xfG51bWJlcnxudW1iZXJbXVxuICAgICAgICAgIGluamVjdG9ySW5kZXgsICAvLyBpbmplY3RvckluZGV4OiBudW1iZXJcbiAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gY29tcG9uZW50T2Zmc2V0OiBudW1iZXJcbiAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3RhcnQ6IG51bWJlclxuICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVFbmQ6IG51bWJlclxuICAgICAgICAgIC0xLCAgICAgICAgICAgICAvLyBkaXJlY3RpdmVTdHlsaW5nTGFzdDogbnVtYmVyXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHByb3BlcnR5QmluZGluZ3M6IG51bWJlcltdfG51bGxcbiAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gZmxhZ3M6IFROb2RlRmxhZ3NcbiAgICAgICAgICAwLCAgICAgICAgICAgICAgLy8gcHJvdmlkZXJJbmRleGVzOiBUTm9kZVByb3ZpZGVySW5kZXhlc1xuICAgICAgICAgIHZhbHVlLCAgICAgICAgICAvLyB2YWx1ZTogc3RyaW5nfG51bGxcbiAgICAgICAgICBhdHRycywgICAgICAgICAgLy8gYXR0cnM6IChzdHJpbmd8QXR0cmlidXRlTWFya2VyfChzdHJpbmd8U2VsZWN0b3JGbGFncylbXSlbXXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIG1lcmdlZEF0dHJzXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdfG51bGxcbiAgICAgICAgICB1bmRlZmluZWQsICAgICAgLy8gaW5pdGlhbElucHV0czogKHN0cmluZ1tdfG51bGwpW118bnVsbHx1bmRlZmluZWRcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gaW5wdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBvdXRwdXRzOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyB0Vmlld3M6IElUVmlld3xJVFZpZXdbXXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIG5leHQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHByb2plY3Rpb25OZXh0OiBJVE5vZGV8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBjaGlsZDogSVROb2RlfG51bGxcbiAgICAgICAgICB0UGFyZW50LCAgICAgICAgLy8gcGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9qZWN0aW9uOiBudW1iZXJ8KElUTm9kZXxSTm9kZVtdKVtdfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gc3R5bGVzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBzdHlsZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGxcbiAgICAgICAgICB1bmRlZmluZWQsICAgICAgLy8gcmVzaWR1YWxTdHlsZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGNsYXNzZXM6IHN0cmluZ3xudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGNsYXNzZXNXaXRob3V0SG9zdDogc3RyaW5nfG51bGxcbiAgICAgICAgICB1bmRlZmluZWQsICAgICAgLy8gcmVzaWR1YWxDbGFzc2VzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgIDAgYXMgYW55LCAgICAgICAvLyBjbGFzc0JpbmRpbmdzOiBUU3R5bGluZ1JhbmdlO1xuICAgICAgICAgIDAgYXMgYW55LCAgICAgICAvLyBzdHlsZUJpbmRpbmdzOiBUU3R5bGluZ1JhbmdlO1xuICAgICAgICAgICkgOlxuICAgICAge1xuICAgICAgICB0eXBlLFxuICAgICAgICBpbmRleCxcbiAgICAgICAgaW5zZXJ0QmVmb3JlSW5kZXg6IG51bGwsXG4gICAgICAgIGluamVjdG9ySW5kZXgsXG4gICAgICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICAgICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICAgICAgZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IC0xLFxuICAgICAgICBjb21wb25lbnRPZmZzZXQ6IC0xLFxuICAgICAgICBwcm9wZXJ0eUJpbmRpbmdzOiBudWxsLFxuICAgICAgICBmbGFnczogMCxcbiAgICAgICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgICAgICB2YWx1ZTogdmFsdWUsXG4gICAgICAgIGF0dHJzOiBhdHRycyxcbiAgICAgICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgICAgIGluaXRpYWxJbnB1dHM6IHVuZGVmaW5lZCxcbiAgICAgICAgaW5wdXRzOiBudWxsLFxuICAgICAgICBvdXRwdXRzOiBudWxsLFxuICAgICAgICB0Vmlld3M6IG51bGwsXG4gICAgICAgIG5leHQ6IG51bGwsXG4gICAgICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgICAgICBjaGlsZDogbnVsbCxcbiAgICAgICAgcGFyZW50OiB0UGFyZW50LFxuICAgICAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgICAgICBzdHlsZXM6IG51bGwsXG4gICAgICAgIHN0eWxlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgICAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgICAgICBjbGFzc2VzOiBudWxsLFxuICAgICAgICBjbGFzc2VzV2l0aG91dEhvc3Q6IG51bGwsXG4gICAgICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgICAgICBjbGFzc0JpbmRpbmdzOiAwIGFzIGFueSxcbiAgICAgICAgc3R5bGVCaW5kaW5nczogMCBhcyBhbnksXG4gICAgICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHROb2RlIHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHROb2RlKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBgUHJvcGVydHlBbGlhc2VzYCBkYXRhIHN0cnVjdHVyZSBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dC9vdXRwdXQgbWFwcGluZy5cbiAqIEBwYXJhbSBhbGlhc01hcCBJbnB1dC9vdXRwdXQgbWFwcGluZyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlLlxuICogQHBhcmFtIHByb3BlcnR5QWxpYXNlcyBPYmplY3QgaW4gd2hpY2ggdG8gc3RvcmUgdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gaG9zdERpcmVjdGl2ZUFsaWFzTWFwIE9iamVjdCB1c2VkIHRvIGFsaWFzIG9yIGZpbHRlciBvdXQgcHJvcGVydGllcyBmb3IgaG9zdCBkaXJlY3RpdmVzLlxuICogSWYgdGhlIG1hcHBpbmcgaXMgcHJvdmlkZWQsIGl0J2xsIGFjdCBhcyBhbiBhbGxvd2xpc3QsIGFzIHdlbGwgYXMgYSBtYXBwaW5nIG9mIHdoYXQgcHVibGljXG4gKiBuYW1lIGlucHV0cy9vdXRwdXRzIHNob3VsZCBiZSBleHBvc2VkIHVuZGVyLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBhbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3BlcnR5QWxpYXNlczogUHJvcGVydHlBbGlhc2VzfG51bGwsXG4gICAgaG9zdERpcmVjdGl2ZUFsaWFzTWFwOiB7W2ludGVybmFsTmFtZTogc3RyaW5nXTogc3RyaW5nfXxudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIGFsaWFzTWFwKSB7XG4gICAgaWYgKGFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wZXJ0eUFsaWFzZXMgPSBwcm9wZXJ0eUFsaWFzZXMgPT09IG51bGwgPyB7fSA6IHByb3BlcnR5QWxpYXNlcztcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGFsaWFzTWFwW3B1YmxpY05hbWVdO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gaG9zdCBkaXJlY3RpdmUgbWFwcGluZ3MsIHdlIHdhbnQgdG8gcmVtYXAgdXNpbmcgdGhlIGFsaWFzIG1hcCBmcm9tIHRoZVxuICAgICAgLy8gZGVmaW5pdGlvbiBpdHNlbGYuIElmIHRoZXJlIGlzIGFuIGFsaWFzIG1hcCwgaXQgaGFzIHR3byBmdW5jdGlvbnM6XG4gICAgICAvLyAxLiBJdCBzZXJ2ZXMgYXMgYW4gYWxsb3dsaXN0IG9mIGJpbmRpbmdzIHRoYXQgYXJlIGV4cG9zZWQgYnkgdGhlIGhvc3QgZGlyZWN0aXZlcy4gT25seSB0aGVcbiAgICAgIC8vIG9uZXMgaW5zaWRlIHRoZSBob3N0IGRpcmVjdGl2ZSBtYXAgd2lsbCBiZSBleHBvc2VkIG9uIHRoZSBob3N0LlxuICAgICAgLy8gMi4gVGhlIHB1YmxpYyBuYW1lIG9mIHRoZSBwcm9wZXJ0eSBpcyBhbGlhc2VkIHVzaW5nIHRoZSBob3N0IGRpcmVjdGl2ZSBhbGlhcyBtYXAsIHJhdGhlclxuICAgICAgLy8gdGhhbiB0aGUgYWxpYXMgbWFwIGZyb20gdGhlIGRlZmluaXRpb24uXG4gICAgICBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwID09PSBudWxsKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMocHJvcGVydHlBbGlhc2VzLCBkaXJlY3RpdmVJbmRleCwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgICAgICAgICBwcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4LCBob3N0RGlyZWN0aXZlQWxpYXNNYXBbcHVibGljTmFtZV0sIGludGVybmFsTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0eUFsaWFzZXM7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgcHJvcGVydHlBbGlhc2VzOiBQcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHB1YmxpY05hbWU6IHN0cmluZyxcbiAgICBpbnRlcm5hbE5hbWU6IHN0cmluZykge1xuICBpZiAocHJvcGVydHlBbGlhc2VzLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlSW5kZXgsIGludGVybmFsTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZUluZGV4LCBpbnRlcm5hbE5hbWVdO1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgaG9zdERpcmVjdGl2ZURlZmluaXRpb25NYXA6IEhvc3REaXJlY3RpdmVEZWZzfG51bGwpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCB0Vmlld0RhdGEgPSB0Vmlldy5kYXRhO1xuXG4gIGNvbnN0IHROb2RlQXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgY29uc3QgaW5wdXRzRnJvbUF0dHJzOiBJbml0aWFsSW5wdXREYXRhID0gbmdEZXZNb2RlID8gbmV3IFROb2RlSW5pdGlhbElucHV0cygpIDogW107XG4gIGxldCBpbnB1dHNTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBsZXQgb3V0cHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG5cbiAgZm9yIChsZXQgZGlyZWN0aXZlSW5kZXggPSBzdGFydDsgZGlyZWN0aXZlSW5kZXggPCBlbmQ7IGRpcmVjdGl2ZUluZGV4KyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlld0RhdGFbZGlyZWN0aXZlSW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGFsaWFzRGF0YSA9XG4gICAgICAgIGhvc3REaXJlY3RpdmVEZWZpbml0aW9uTWFwID8gaG9zdERpcmVjdGl2ZURlZmluaXRpb25NYXAuZ2V0KGRpcmVjdGl2ZURlZikgOiBudWxsO1xuICAgIGNvbnN0IGFsaWFzZWRJbnB1dHMgPSBhbGlhc0RhdGEgPyBhbGlhc0RhdGEuaW5wdXRzIDogbnVsbDtcbiAgICBjb25zdCBhbGlhc2VkT3V0cHV0cyA9IGFsaWFzRGF0YSA/IGFsaWFzRGF0YS5vdXRwdXRzIDogbnVsbDtcblxuICAgIGlucHV0c1N0b3JlID1cbiAgICAgICAgZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlRGVmLmlucHV0cywgZGlyZWN0aXZlSW5kZXgsIGlucHV0c1N0b3JlLCBhbGlhc2VkSW5wdXRzKTtcbiAgICBvdXRwdXRzU3RvcmUgPVxuICAgICAgICBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYub3V0cHV0cywgZGlyZWN0aXZlSW5kZXgsIG91dHB1dHNTdG9yZSwgYWxpYXNlZE91dHB1dHMpO1xuICAgIC8vIERvIG5vdCB1c2UgdW5ib3VuZCBhdHRyaWJ1dGVzIGFzIGlucHV0cyB0byBzdHJ1Y3R1cmFsIGRpcmVjdGl2ZXMsIHNpbmNlIHN0cnVjdHVyYWxcbiAgICAvLyBkaXJlY3RpdmUgaW5wdXRzIGNhbiBvbmx5IGJlIHNldCB1c2luZyBtaWNyb3N5bnRheCAoZS5nLiBgPGRpdiAqZGlyPVwiZXhwXCI+YCkuXG4gICAgLy8gVE9ETyhGVy0xOTMwKTogbWljcm9zeW50YXggZXhwcmVzc2lvbnMgbWF5IGFsc28gY29udGFpbiB1bmJvdW5kL3N0YXRpYyBhdHRyaWJ1dGVzLCB3aGljaFxuICAgIC8vIHNob3VsZCBiZSBzZXQgZm9yIGlubGluZSB0ZW1wbGF0ZXMuXG4gICAgY29uc3QgaW5pdGlhbElucHV0cyA9XG4gICAgICAgIChpbnB1dHNTdG9yZSAhPT0gbnVsbCAmJiB0Tm9kZUF0dHJzICE9PSBudWxsICYmICFpc0lubGluZVRlbXBsYXRlKHROb2RlKSkgP1xuICAgICAgICBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoaW5wdXRzU3RvcmUsIGRpcmVjdGl2ZUluZGV4LCB0Tm9kZUF0dHJzKSA6XG4gICAgICAgIG51bGw7XG4gICAgaW5wdXRzRnJvbUF0dHJzLnB1c2goaW5pdGlhbElucHV0cyk7XG4gIH1cblxuICBpZiAoaW5wdXRzU3RvcmUgIT09IG51bGwpIHtcbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgdE5vZGUuaW5pdGlhbElucHV0cyA9IGlucHV0c0Zyb21BdHRycztcbiAgdE5vZGUuaW5wdXRzID0gaW5wdXRzU3RvcmU7XG4gIHROb2RlLm91dHB1dHMgPSBvdXRwdXRzU3RvcmU7XG59XG5cbi8qKlxuICogTWFwcGluZyBiZXR3ZWVuIGF0dHJpYnV0ZXMgbmFtZXMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIHRoZWlyIGVsZW1lbnQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogUGVyZm9ybWFuY2Ugbm90ZTogdGhpcyBmdW5jdGlvbiBpcyB3cml0dGVuIGFzIGEgc2VyaWVzIG9mIGlmIGNoZWNrcyAoaW5zdGVhZCBvZiwgc2F5LCBhIHByb3BlcnR5XG4gKiBvYmplY3QgbG9va3VwKSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAtIHRoZSBzZXJpZXMgb2YgYGlmYCBjaGVja3Mgc2VlbXMgdG8gYmUgdGhlIGZhc3Rlc3Qgd2F5IG9mXG4gKiBtYXBwaW5nIHByb3BlcnR5IG5hbWVzLiBEbyBOT1QgY2hhbmdlIHdpdGhvdXQgYmVuY2htYXJraW5nLlxuICpcbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5mdW5jdGlvbiBtYXBQcm9wTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZSA9PT0gJ2NsYXNzJykgcmV0dXJuICdjbGFzc05hbWUnO1xuICBpZiAobmFtZSA9PT0gJ2ZvcicpIHJldHVybiAnaHRtbEZvcic7XG4gIGlmIChuYW1lID09PSAnZm9ybWFjdGlvbicpIHJldHVybiAnZm9ybUFjdGlvbic7XG4gIGlmIChuYW1lID09PSAnaW5uZXJIdG1sJykgcmV0dXJuICdpbm5lckhUTUwnO1xuICBpZiAobmFtZSA9PT0gJ3JlYWRvbmx5JykgcmV0dXJuICdyZWFkT25seSc7XG4gIGlmIChuYW1lID09PSAndGFiaW5kZXgnKSByZXR1cm4gJ3RhYkluZGV4JztcbiAgcmV0dXJuIG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICAgIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsIG5hdGl2ZU9ubHk6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gIGxldCBpbnB1dERhdGEgPSB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiBpbnB1dERhdGEgIT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGRhdGFWYWx1ZSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIHROb2RlLmluZGV4KTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgIHByb3BOYW1lID0gbWFwUHJvcE5hbWUocHJvcE5hbWUpO1xuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzKHByb3BOYW1lKTtcbiAgICAgIGlmICghaXNQcm9wZXJ0eVZhbGlkKGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZS52YWx1ZSwgdFZpZXcuc2NoZW1hcykpIHtcbiAgICAgICAgaGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Tm9kZS50eXBlLCBsVmlldyk7XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5IGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudmFsdWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueUNvbnRhaW5lcikge1xuICAgIC8vIElmIHRoZSBub2RlIGlzIGEgY29udGFpbmVyIGFuZCB0aGUgcHJvcGVydHkgZGlkbid0XG4gICAgLy8gbWF0Y2ggYW55IG9mIHRoZSBpbnB1dHMgb3Igc2NoZW1hcyB3ZSBzaG91bGQgdGhyb3cuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhbWF0Y2hpbmdTY2hlbWFzKHRWaWV3LnNjaGVtYXMsIHROb2RlLnZhbHVlKSkge1xuICAgICAgaGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Tm9kZS50eXBlLCBsVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlldyBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgYXR0ck5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGF0dHJOYW1lKTtcbiAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgaWYgKHR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID1cbiAgICAgICAgZXNjYXBlQ29tbWVudFRleHQoYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gKTtcbiAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHRleHRDb250ZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcikpIHtcbiAgICAvKipcbiAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgKiBpKzE6IHByaXZhdGVOYW1lXG4gICAgICpcbiAgICAgKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMV1cbiAgICAgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFWYWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHR5cGUsIGRhdGFWYWx1ZVtpICsgMV0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwpOiBib29sZWFuIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW5cbiAgLy8gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgbGV0IGhhc0RpcmVjdGl2ZXMgPSBmYWxzZTtcbiAgaWYgKGdldEJpbmRpbmdzRW5hYmxlZCgpKSB7XG4gICAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9fG51bGwpID0gbG9jYWxSZWZzID09PSBudWxsID8gbnVsbCA6IHsnJzogLTF9O1xuICAgIGNvbnN0IG1hdGNoUmVzdWx0ID0gZmluZERpcmVjdGl2ZURlZk1hdGNoZXModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gICAgbGV0IGRpcmVjdGl2ZURlZnM6IERpcmVjdGl2ZURlZjx1bmtub3duPltdfG51bGw7XG4gICAgbGV0IGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsO1xuXG4gICAgaWYgKG1hdGNoUmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBkaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICBbZGlyZWN0aXZlRGVmcywgaG9zdERpcmVjdGl2ZURlZnNdID0gbWF0Y2hSZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGRpcmVjdGl2ZURlZnMgIT09IG51bGwpIHtcbiAgICAgIC8vIFB1Ymxpc2hlcyB0aGUgZGlyZWN0aXZlIHR5cGVzIHRvIERJIHNvIHRoZXkgY2FuIGJlIGluamVjdGVkLiBOZWVkcyB0b1xuICAgICAgLy8gaGFwcGVuIGluIGEgc2VwYXJhdGUgcGFzcyBiZWZvcmUgdGhlIFROb2RlIGZsYWdzIGhhdmUgYmVlbiBpbml0aWFsaXplZC5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlRGVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KSwgdFZpZXcsIGRpcmVjdGl2ZURlZnNbaV0udHlwZSk7XG4gICAgICB9XG5cbiAgICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgICAgaW5pdGlhbGl6ZURpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlRGVmcywgZXhwb3J0c01hcCwgaG9zdERpcmVjdGl2ZURlZnMpO1xuICAgIH1cbiAgICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG4gIH1cbiAgLy8gTWVyZ2UgdGhlIHRlbXBsYXRlIGF0dHJzIGxhc3Qgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGhpZ2hlc3QgcHJpb3JpdHkuXG4gIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIHROb2RlLmF0dHJzKTtcbiAgcmV0dXJuIGhhc0RpcmVjdGl2ZXM7XG59XG5cbi8qKiBJbml0aWFsaXplcyB0aGUgZGF0YSBzdHJ1Y3R1cmVzIG5lY2Vzc2FyeSBmb3IgYSBsaXN0IG9mIGRpcmVjdGl2ZXMgdG8gYmUgaW5zdGFudGlhdGVkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3PHVua25vd24+LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXSwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcjt9fG51bGwsXG4gICAgaG9zdERpcmVjdGl2ZURlZnM6IEhvc3REaXJlY3RpdmVEZWZzfG51bGwpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIGluaXRUTm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuXG4gIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgLy8gdGhlIHZpZXdFbmdpbmU6XG4gIC8vIC0gdmlld1Byb3ZpZGVycyBoYXZlIHByaW9yaXR5IG92ZXIgcHJvdmlkZXJzXG4gIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gIC8vIFNvIHRvIG1hdGNoIHRoZXNlIHJ1bGVzLCB0aGUgb3JkZXIgaW4gd2hpY2ggcHJvdmlkZXJzIGFyZSBhZGRlZCBpbiB0aGUgYXJyYXlzIGlzIHZlcnlcbiAgLy8gaW1wb3J0YW50LlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldO1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICB9XG4gIGxldCBwcmVPcmRlckhvb2tzRm91bmQgPSBmYWxzZTtcbiAgbGV0IHByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kID0gZmFsc2U7XG4gIGxldCBkaXJlY3RpdmVJZHggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkaXJlY3RpdmVzLmxlbmd0aCwgbnVsbCk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0U2FtZShcbiAgICAgICAgICBkaXJlY3RpdmVJZHgsIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICdUTm9kZS5kaXJlY3RpdmVTdGFydCBzaG91bGQgcG9pbnQgdG8ganVzdCBhbGxvY2F0ZWQgc3BhY2UnKTtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldO1xuICAgIC8vIE1lcmdlIHRoZSBhdHRycyBpbiB0aGUgb3JkZXIgb2YgbWF0Y2hlcy4gVGhpcyBhc3N1bWVzIHRoYXQgdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyB0aGVcbiAgICAvLyBjb21wb25lbnQgaXRzZWxmLCBzbyB0aGF0IHRoZSBjb21wb25lbnQgaGFzIHRoZSBsZWFzdCBwcmlvcml0eS5cbiAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcblxuICAgIGNvbmZpZ3VyZVZpZXdXaXRoRGlyZWN0aXZlKHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGRpcmVjdGl2ZUlkeCwgZGVmKTtcbiAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKGRpcmVjdGl2ZUlkeCwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICAgIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsIHx8IGRlZi5ob3N0QXR0cnMgIT09IG51bGwgfHwgZGVmLmhvc3RWYXJzICE9PSAwKVxuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3M7XG5cbiAgICBjb25zdCBsaWZlQ3ljbGVIb29rczogT25DaGFuZ2VzJk9uSW5pdCZEb0NoZWNrID0gZGVmLnR5cGUucHJvdG90eXBlO1xuICAgIC8vIE9ubHkgcHVzaCBhIG5vZGUgaW5kZXggaW50byB0aGUgcHJlT3JkZXJIb29rcyBhcnJheSBpZiB0aGlzIGlzIHRoZSBmaXJzdFxuICAgIC8vIHByZS1vcmRlciBob29rIGZvdW5kIG9uIHRoaXMgbm9kZS5cbiAgICBpZiAoIXByZU9yZGVySG9va3NGb3VuZCAmJlxuICAgICAgICAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdPbkluaXQgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgLy8gV2Ugd2lsbCBwdXNoIHRoZSBhY3R1YWwgaG9vayBmdW5jdGlvbiBpbnRvIHRoaXMgYXJyYXkgbGF0ZXIgZHVyaW5nIGRpciBpbnN0YW50aWF0aW9uLlxuICAgICAgLy8gV2UgY2Fubm90IGRvIGl0IG5vdyBiZWNhdXNlIHdlIG11c3QgZW5zdXJlIGhvb2tzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBzYW1lXG4gICAgICAvLyBvcmRlciB0aGF0IGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQgKGkuZS4gaW5qZWN0aW9uIG9yZGVyKS5cbiAgICAgICh0Vmlldy5wcmVPcmRlckhvb2tzIHx8ICh0Vmlldy5wcmVPcmRlckhvb2tzID0gW10pKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgIHByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBkaXJlY3RpdmVJZHgrKztcbiAgfVxuXG4gIGluaXRpYWxpemVJbnB1dEFuZE91dHB1dEFsaWFzZXModFZpZXcsIHROb2RlLCBob3N0RGlyZWN0aXZlRGVmcyk7XG59XG5cbi8qKlxuICogQWRkIGBob3N0QmluZGluZ3NgIHRvIHRoZSBgVFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGUgYGhvc3RCaW5kaW5nc2Agc2hvdWxkIGJlIGFkZGVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhlIGVsZW1lbnQgd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZVxuICogQHBhcmFtIGRpcmVjdGl2ZUlkeCBEaXJlY3RpdmUgaW5kZXggaW4gdmlldy5cbiAqIEBwYXJhbSBkaXJlY3RpdmVWYXJzSWR4IFdoZXJlIHdpbGwgdGhlIGRpcmVjdGl2ZSdzIHZhcnMgYmUgc3RvcmVkXG4gKiBAcGFyYW0gZGVmIGBDb21wb25lbnREZWZgL2BEaXJlY3RpdmVEZWZgLCB3aGljaCBjb250YWlucyB0aGUgYGhvc3RWYXJzYC9gaG9zdEJpbmRpbmdzYCB0byBhZGQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3Rlckhvc3RCaW5kaW5nT3BDb2RlcyhcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIsIGRpcmVjdGl2ZVZhcnNJZHg6IG51bWJlcixcbiAgICBkZWY6IENvbXBvbmVudERlZjxhbnk+fERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIGNvbnN0IGhvc3RCaW5kaW5ncyA9IGRlZi5ob3N0QmluZGluZ3M7XG4gIGlmIChob3N0QmluZGluZ3MpIHtcbiAgICBsZXQgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzO1xuICAgIGlmIChob3N0QmluZGluZ09wQ29kZXMgPT09IG51bGwpIHtcbiAgICAgIGhvc3RCaW5kaW5nT3BDb2RlcyA9IHRWaWV3Lmhvc3RCaW5kaW5nT3BDb2RlcyA9IFtdIGFzIGFueSBhcyBIb3N0QmluZGluZ09wQ29kZXM7XG4gICAgfVxuICAgIGNvbnN0IGVsZW1lbnRJbmR4ID0gfnROb2RlLmluZGV4O1xuICAgIGlmIChsYXN0U2VsZWN0ZWRFbGVtZW50SWR4KGhvc3RCaW5kaW5nT3BDb2RlcykgIT0gZWxlbWVudEluZHgpIHtcbiAgICAgIC8vIENvbmRpdGlvbmFsbHkgYWRkIHNlbGVjdCBlbGVtZW50IHNvIHRoYXQgd2UgYXJlIG1vcmUgZWZmaWNpZW50IGluIGV4ZWN1dGlvbi5cbiAgICAgIC8vIE5PVEU6IHRoaXMgaXMgc3RyaWN0bHkgbm90IG5lY2Vzc2FyeSBhbmQgaXQgdHJhZGVzIGNvZGUgc2l6ZSBmb3IgcnVudGltZSBwZXJmLlxuICAgICAgLy8gKFdlIGNvdWxkIGp1c3QgYWx3YXlzIGFkZCBpdC4pXG4gICAgICBob3N0QmluZGluZ09wQ29kZXMucHVzaChlbGVtZW50SW5keCk7XG4gICAgfVxuICAgIGhvc3RCaW5kaW5nT3BDb2Rlcy5wdXNoKGRpcmVjdGl2ZUlkeCwgZGlyZWN0aXZlVmFyc0lkeCwgaG9zdEJpbmRpbmdzKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGxhc3Qgc2VsZWN0ZWQgZWxlbWVudCBpbmRleCBpbiB0aGUgYEhvc3RCaW5kaW5nT3BDb2Rlc2BcbiAqXG4gKiBGb3IgcGVyZiByZWFzb25zIHdlIGRvbid0IG5lZWQgdG8gdXBkYXRlIHRoZSBzZWxlY3RlZCBlbGVtZW50IGluZGV4IGluIGBIb3N0QmluZGluZ09wQ29kZXNgIG9ubHlcbiAqIGlmIGl0IGNoYW5nZXMuIFRoaXMgbWV0aG9kIHJldHVybnMgdGhlIGxhc3QgaW5kZXggKG9yICcwJyBpZiBub3QgZm91bmQuKVxuICpcbiAqIFNlbGVjdGVkIGVsZW1lbnQgaW5kZXggYXJlIG9ubHkgdGhlIG9uZXMgd2hpY2ggYXJlIG5lZ2F0aXZlLlxuICovXG5mdW5jdGlvbiBsYXN0U2VsZWN0ZWRFbGVtZW50SWR4KGhvc3RCaW5kaW5nT3BDb2RlczogSG9zdEJpbmRpbmdPcENvZGVzKTogbnVtYmVyIHtcbiAgbGV0IGkgPSBob3N0QmluZGluZ09wQ29kZXMubGVuZ3RoO1xuICB3aGlsZSAoaSA+IDApIHtcbiAgICBjb25zdCB2YWx1ZSA9IGhvc3RCaW5kaW5nT3BDb2Rlc1stLWldO1xuICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInICYmIHZhbHVlIDwgMCkge1xuICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbiAgfVxuICByZXR1cm4gMDtcbn1cblxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsIG5hdGl2ZTogUk5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBpZiAoIXRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0Tm9kZSwgbFZpZXcpO1xuICB9XG5cbiAgYXR0YWNoUGF0Y2hEYXRhKG5hdGl2ZSwgbFZpZXcpO1xuXG4gIGNvbnN0IGluaXRpYWxJbnB1dHMgPSB0Tm9kZS5pbml0aWFsSW5wdXRzO1xuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgaXNDb21wb25lbnQgPSBpc0NvbXBvbmVudERlZihkZWYpO1xuXG4gICAgaWYgKGlzQ29tcG9uZW50KSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuICAgICAgYWRkQ29tcG9uZW50TG9naWMobFZpZXcsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSwgZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICB9XG5cbiAgICBjb25zdCBkaXJlY3RpdmUgPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGksIHROb2RlKTtcbiAgICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG5cbiAgICBpZiAoaW5pdGlhbElucHV0cyAhPT0gbnVsbCkge1xuICAgICAgc2V0SW5wdXRzRnJvbUF0dHJzKGxWaWV3LCBpIC0gc3RhcnQsIGRpcmVjdGl2ZSwgZGVmLCB0Tm9kZSwgaW5pdGlhbElucHV0cyEpO1xuICAgIH1cblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh0Tm9kZS5pbmRleCwgbFZpZXcpO1xuICAgICAgY29tcG9uZW50Vmlld1tDT05URVhUXSA9IGRpcmVjdGl2ZTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlKTpcbiAgICBbbWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sIGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsXXxudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5BbnlSTm9kZSB8IFROb2RlVHlwZS5BbnlDb250YWluZXIpO1xuXG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXXxudWxsID0gbnVsbDtcbiAgbGV0IGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzISwgLyogaXNQcm9qZWN0aW9uTW9kZSAqLyBmYWxzZSkpIHtcbiAgICAgICAgbWF0Y2hlcyB8fCAobWF0Y2hlcyA9IG5nRGV2TW9kZSA/IG5ldyBNYXRjaGVzQXJyYXkoKSA6IFtdKTtcblxuICAgICAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgICAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsXG4gICAgICAgICAgICAgICAgYFwiJHt0Tm9kZS52YWx1ZX1cIiB0YWdzIGNhbm5vdCBiZSB1c2VkIGFzIGNvbXBvbmVudCBob3N0cy4gYCArXG4gICAgICAgICAgICAgICAgICAgIGBQbGVhc2UgdXNlIGEgZGlmZmVyZW50IHRhZyB0byBhY3RpdmF0ZSB0aGUgJHtzdHJpbmdpZnkoZGVmLnR5cGUpfSBjb21wb25lbnQuYCk7XG5cbiAgICAgICAgICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSB7XG4gICAgICAgICAgICAgIHRocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcih0Tm9kZSwgbWF0Y2hlcy5maW5kKGlzQ29tcG9uZW50RGVmKSEudHlwZSwgZGVmLnR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIENvbXBvbmVudHMgYXJlIGluc2VydGVkIGF0IHRoZSBmcm9udCBvZiB0aGUgbWF0Y2hlcyBhcnJheSBzbyB0aGF0IHRoZWlyIGxpZmVjeWNsZVxuICAgICAgICAgIC8vIGhvb2tzIHJ1biBiZWZvcmUgYW55IGRpcmVjdGl2ZSBsaWZlY3ljbGUgaG9va3MuIFRoaXMgYXBwZWFycyB0byBiZSBmb3IgVmlld0VuZ2luZVxuICAgICAgICAgIC8vIGNvbXBhdGliaWxpdHkuIFRoaXMgbG9naWMgZG9lc24ndCBtYWtlIHNlbnNlIHdpdGggaG9zdCBkaXJlY3RpdmVzLCBiZWNhdXNlIGl0XG4gICAgICAgICAgLy8gd291bGQgYWxsb3cgdGhlIGhvc3QgZGlyZWN0aXZlcyB0byB1bmRvIGFueSBvdmVycmlkZXMgdGhlIGhvc3QgbWF5IGhhdmUgbWFkZS5cbiAgICAgICAgICAvLyBUbyBoYW5kbGUgdGhpcyBjYXNlLCB0aGUgaG9zdCBkaXJlY3RpdmVzIG9mIGNvbXBvbmVudHMgYXJlIGluc2VydGVkIGF0IHRoZSBiZWdpbm5pbmdcbiAgICAgICAgICAvLyBvZiB0aGUgYXJyYXksIGZvbGxvd2VkIGJ5IHRoZSBjb21wb25lbnQuIEFzIHN1Y2gsIHRoZSBpbnNlcnRpb24gb3JkZXIgaXMgYXMgZm9sbG93czpcbiAgICAgICAgICAvLyAxLiBIb3N0IGRpcmVjdGl2ZXMgYmVsb25naW5nIHRvIHRoZSBzZWxlY3Rvci1tYXRjaGVkIGNvbXBvbmVudC5cbiAgICAgICAgICAvLyAyLiBTZWxlY3Rvci1tYXRjaGVkIGNvbXBvbmVudC5cbiAgICAgICAgICAvLyAzLiBIb3N0IGRpcmVjdGl2ZXMgYmVsb25naW5nIHRvIHNlbGVjdG9yLW1hdGNoZWQgZGlyZWN0aXZlcy5cbiAgICAgICAgICAvLyA0LiBTZWxlY3Rvci1tYXRjaGVkIGRpcmVjdGl2ZXMuXG4gICAgICAgICAgaWYgKGRlZi5maW5kSG9zdERpcmVjdGl2ZURlZnMgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGNvbnN0IGhvc3REaXJlY3RpdmVNYXRjaGVzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXSA9IFtdO1xuICAgICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMgPSBob3N0RGlyZWN0aXZlRGVmcyB8fCBuZXcgTWFwKCk7XG4gICAgICAgICAgICBkZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzKGRlZiwgaG9zdERpcmVjdGl2ZU1hdGNoZXMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgICAgICAgIC8vIEFkZCBhbGwgaG9zdCBkaXJlY3RpdmVzIGRlY2xhcmVkIG9uIHRoaXMgY29tcG9uZW50LCBmb2xsb3dlZCBieSB0aGUgY29tcG9uZW50IGl0c2VsZi5cbiAgICAgICAgICAgIC8vIEhvc3QgZGlyZWN0aXZlcyBzaG91bGQgZXhlY3V0ZSBmaXJzdCBzbyB0aGUgaG9zdCBoYXMgYSBjaGFuY2UgdG8gb3ZlcnJpZGUgY2hhbmdlc1xuICAgICAgICAgICAgLy8gdG8gdGhlIERPTSBtYWRlIGJ5IHRoZW0uXG4gICAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoLi4uaG9zdERpcmVjdGl2ZU1hdGNoZXMsIGRlZik7XG4gICAgICAgICAgICAvLyBDb21wb25lbnQgaXMgb2Zmc2V0IHN0YXJ0aW5nIGZyb20gdGhlIGJlZ2lubmluZyBvZiB0aGUgaG9zdCBkaXJlY3RpdmVzIGFycmF5LlxuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50T2Zmc2V0ID0gaG9zdERpcmVjdGl2ZU1hdGNoZXMubGVuZ3RoO1xuICAgICAgICAgICAgbWFya0FzQ29tcG9uZW50SG9zdCh0VmlldywgdE5vZGUsIGNvbXBvbmVudE9mZnNldCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIE5vIGhvc3QgZGlyZWN0aXZlcyBvbiB0aGlzIGNvbXBvbmVudCwganVzdCBhZGQgdGhlXG4gICAgICAgICAgICAvLyBjb21wb25lbnQgZGVmIHRvIHRoZSBiZWdpbm5pbmcgb2YgdGhlIG1hdGNoZXMuXG4gICAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoZGVmKTtcbiAgICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCAwKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gQXBwZW5kIGFueSBob3N0IGRpcmVjdGl2ZXMgdG8gdGhlIG1hdGNoZXMgZmlyc3QuXG4gICAgICAgICAgaG9zdERpcmVjdGl2ZURlZnMgPSBob3N0RGlyZWN0aXZlRGVmcyB8fCBuZXcgTWFwKCk7XG4gICAgICAgICAgZGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcz8uKGRlZiwgbWF0Y2hlcywgaG9zdERpcmVjdGl2ZURlZnMpO1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzID09PSBudWxsID8gbnVsbCA6IFttYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmc107XG59XG5cbi8qKlxuICogTWFya3MgYSBnaXZlbiBUTm9kZSBhcyBhIGNvbXBvbmVudCdzIGhvc3QuIFRoaXMgY29uc2lzdHMgb2Y6XG4gKiAtIHNldHRpbmcgdGhlIGNvbXBvbmVudCBvZmZzZXQgb24gdGhlIFROb2RlLlxuICogLSBzdG9yaW5nIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXc6IFRWaWV3LCBob3N0VE5vZGU6IFROb2RlLCBjb21wb25lbnRPZmZzZXQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGNvbXBvbmVudE9mZnNldCwgLTEsICdjb21wb25lbnRPZmZzZXQgbXVzdCBiZSBncmVhdCB0aGFuIC0xJyk7XG4gIGhvc3RUTm9kZS5jb21wb25lbnRPZmZzZXQgPSBjb21wb25lbnRPZmZzZXQ7XG4gICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gbmdEZXZNb2RlID8gbmV3IFRWaWV3Q29tcG9uZW50cygpIDogW10pKVxuICAgICAgLnB1c2goaG9zdFROb2RlLmluZGV4KTtcbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVMb2NhbE5hbWVzKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuRVhQT1JUX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gZGlyZWN0aXZlSWR4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkgZXhwb3J0c01hcFsnJ10gPSBkaXJlY3RpdmVJZHg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0dXAgZGlyZWN0aXZlIGZvciBpbnN0YW50aWF0aW9uLlxuICpcbiAqIFdlIG5lZWQgdG8gY3JlYXRlIGEgYE5vZGVJbmplY3RvckZhY3RvcnlgIHdoaWNoIGlzIHRoZW4gaW5zZXJ0ZWQgaW4gYm90aCB0aGUgYEJsdWVwcmludGAgYXMgd2VsbFxuICogYXMgYExWaWV3YC4gYFRWaWV3YCBnZXRzIHRoZSBgRGlyZWN0aXZlRGVmYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YFxuICogQHBhcmFtIHROb2RlIGBUTm9kZWBcbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggd2hlcmUgdGhlIGRpcmVjdGl2ZSB3aWxsIGJlIHN0b3JlZCBpbiB0aGUgRXhwYW5kby5cbiAqIEBwYXJhbSBkZWYgYERpcmVjdGl2ZURlZmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZVZpZXdXaXRoRGlyZWN0aXZlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGRpcmVjdGl2ZUluZGV4LCBIRUFERVJfT0ZGU0VULCAnTXVzdCBiZSBpbiBFeHBhbmRvIHNlY3Rpb24nKTtcbiAgdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gPSBkZWY7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgLy8gRXZlbiB0aG91Z2ggYGRpcmVjdGl2ZUZhY3RvcnlgIHdpbGwgYWxyZWFkeSBiZSB1c2luZyBgybXJtWRpcmVjdGl2ZUluamVjdGAgaW4gaXRzIGdlbmVyYXRlZCBjb2RlLFxuICAvLyB3ZSBhbHNvIHdhbnQgdG8gc3VwcG9ydCBgaW5qZWN0KClgIGRpcmVjdGx5IGZyb20gdGhlIGRpcmVjdGl2ZSBjb25zdHJ1Y3RvciBjb250ZXh0IHNvIHdlIHNldFxuICAvLyBgybXJtWRpcmVjdGl2ZUluamVjdGAgYXMgdGhlIGluamVjdCBpbXBsZW1lbnRhdGlvbiBoZXJlIHRvby5cbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCDJtcm1ZGlyZWN0aXZlSW5qZWN0KTtcbiAgdFZpZXcuYmx1ZXByaW50W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG4gIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG5cbiAgcmVnaXN0ZXJIb3N0QmluZGluZ09wQ29kZXMoXG4gICAgICB0VmlldywgdE5vZGUsIGRpcmVjdGl2ZUluZGV4LCBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkZWYuaG9zdFZhcnMsIE5PX0NIQU5HRSksIGRlZik7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldyxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgZGVmLm9uUHVzaCA/IExWaWV3RmxhZ3MuRGlydHkgOiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzLCBuYXRpdmUsXG4gICAgICAgICAgaG9zdFROb2RlIGFzIFRFbGVtZW50Tm9kZSwgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpLFxuICAgICAgICAgIG51bGwsIG51bGwsIG51bGwpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICBgQXR0ZW1wdGVkIHRvIHNldCBhdHRyaWJ1dGUgXFxgJHtuYW1lfVxcYCBvbiBhIGNvbnRhaW5lciBub2RlLiBgICtcbiAgICAgICAgICAgIGBIb3N0IGJpbmRpbmdzIGFyZSBub3QgdmFsaWQgb24gbmctY29udGFpbmVyIG9yIG5nLXRlbXBsYXRlLmApO1xuICB9XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIHNldEVsZW1lbnRBdHRyaWJ1dGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCBuYW1lc3BhY2UsIHROb2RlLnZhbHVlLCBuYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQsIHRhZ05hbWU6IHN0cmluZ3xudWxsLFxuICAgIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUgYXMgc3RyaW5nLCBuYW1lc3BhY2UpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhIVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgaWYgKHNldElucHV0ICE9PSBudWxsKSB7XG4gICAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIG5hdGl2ZUVsZW1lbnQsIHROb2RlLnR5cGUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGlucHV0cyBJbnB1dCBhbGlhcyBtYXAgdGhhdCB3YXMgZ2VuZXJhdGVkIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWYgaW5wdXRzLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGF0dHJzIFN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlcywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogSW5pdGlhbElucHV0c3xudWxsIHtcbiAgbGV0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHN8bnVsbCA9IG51bGw7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGlmIChpbnB1dHMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUgYXMgc3RyaW5nKSkge1xuICAgICAgaWYgKGlucHV0c1RvU3RvcmUgPT09IG51bGwpIGlucHV0c1RvU3RvcmUgPSBbXTtcblxuICAgICAgLy8gRmluZCB0aGUgaW5wdXQncyBwdWJsaWMgbmFtZSBmcm9tIHRoZSBpbnB1dCBzdG9yZS4gTm90ZSB0aGF0IHdlIGNhbiBiZSBmb3VuZCBlYXNpZXJcbiAgICAgIC8vIHRocm91Z2ggdGhlIGRpcmVjdGl2ZSBkZWYsIGJ1dCB3ZSB3YW50IHRvIGRvIGl0IHVzaW5nIHRoZSBpbnB1dHMgc3RvcmUgc28gdGhhdCBpdCBjYW5cbiAgICAgIC8vIGFjY291bnQgZm9yIGhvc3QgZGlyZWN0aXZlIGFsaWFzZXMuXG4gICAgICBjb25zdCBpbnB1dENvbmZpZyA9IGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbnB1dENvbmZpZy5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICBpZiAoaW5wdXRDb25maWdbal0gPT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKFxuICAgICAgICAgICAgICBhdHRyTmFtZSBhcyBzdHJpbmcsIGlucHV0Q29uZmlnW2ogKyAxXSBhcyBzdHJpbmcsIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmcpO1xuICAgICAgICAgIC8vIEEgZGlyZWN0aXZlIGNhbid0IGhhdmUgbXVsdGlwbGUgaW5wdXRzIHdpdGggdGhlIHNhbWUgbmFtZSBzbyB3ZSBjYW4gYnJlYWsgaGVyZS5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5wdXRzVG9TdG9yZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8vIE5vdCBzdXJlIHdoeSBJIG5lZWQgdG8gZG8gYGFueWAgaGVyZSBidXQgVFMgY29tcGxhaW5zIGxhdGVyLlxuY29uc3QgTENvbnRhaW5lckFycmF5OiBhbnkgPSBjbGFzcyBMQ29udGFpbmVyIGV4dGVuZHMgQXJyYXkge307XG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50fFJDb21tZW50fExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIC8vIGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS1saXRlcmFsLXZzLW5ldy1hcnJheS1yZWFsbHlcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IG5ldyAobmdEZXZNb2RlID8gTENvbnRhaW5lckFycmF5IDogQXJyYXkpKFxuICAgICAgaG9zdE5hdGl2ZSwgICAvLyBob3N0IG5hdGl2ZVxuICAgICAgdHJ1ZSwgICAgICAgICAvLyBCb29sZWFuIGB0cnVlYCBpbiB0aGlzIHBvc2l0aW9uIHNpZ25pZmllcyB0aGF0IHRoaXMgaXMgYW4gYExDb250YWluZXJgXG4gICAgICBmYWxzZSwgICAgICAgIC8vIGhhcyB0cmFuc3BsYW50ZWQgdmlld3NcbiAgICAgIGN1cnJlbnRWaWV3LCAgLy8gcGFyZW50XG4gICAgICBudWxsLCAgICAgICAgIC8vIG5leHRcbiAgICAgIDAsICAgICAgICAgICAgLy8gdHJhbnNwbGFudGVkIHZpZXdzIHRvIHJlZnJlc2ggY291bnRcbiAgICAgIHROb2RlLCAgICAgICAgLy8gdF9ob3N0XG4gICAgICBuYXRpdmUsICAgICAgIC8vIG5hdGl2ZSxcbiAgICAgIG51bGwsICAgICAgICAgLy8gdmlldyByZWZzXG4gICAgICBudWxsLCAgICAgICAgIC8vIG1vdmVkIHZpZXdzXG4gICk7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgbENvbnRhaW5lci5sZW5ndGgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULFxuICAgICAgICAgICdTaG91bGQgYWxsb2NhdGUgY29ycmVjdCBudW1iZXIgb2Ygc2xvdHMgZm9yIExDb250YWluZXIgaGVhZGVyLicpO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaEVtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IGVtYmVkZGVkTFZpZXdbVFZJRVddO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihlbWJlZGRlZExWaWV3KSkge1xuICAgICAgICByZWZyZXNoVmlldyhlbWJlZGRlZFRWaWV3LCBlbWJlZGRlZExWaWV3LCBlbWJlZGRlZFRWaWV3LnRlbXBsYXRlLCBlbWJlZGRlZExWaWV3W0NPTlRFWFRdISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFyayB0cmFuc3BsYW50ZWQgdmlld3MgYXMgbmVlZGluZyB0byBiZSByZWZyZXNoZWQgYXQgdGhlaXIgaW5zZXJ0aW9uIHBvaW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBtYXkgaGF2ZSB0cmFuc3BsYW50ZWQgdmlld3MuXG4gKi9cbmZ1bmN0aW9uIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGlmICghbENvbnRhaW5lcltIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTXSkgY29udGludWU7XG5cbiAgICBjb25zdCBtb3ZlZFZpZXdzID0gbENvbnRhaW5lcltNT1ZFRF9WSUVXU10hO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vdmVkVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1vdmVkTFZpZXcgPSBtb3ZlZFZpZXdzW2ldITtcbiAgICAgIGNvbnN0IGluc2VydGlvbkxDb250YWluZXIgPSBtb3ZlZExWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGluc2VydGlvbkxDb250YWluZXIpO1xuICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBpbmNyZW1lbnQgdGhlIGNvdW50ZXIgaWYgdGhlIG1vdmVkIExWaWV3IHdhcyBhbHJlYWR5IG1hcmtlZCBmb3JcbiAgICAgIC8vIHJlZnJlc2guXG4gICAgICBpZiAoKG1vdmVkTFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldykgPT09IDApIHtcbiAgICAgICAgdXBkYXRlVHJhbnNwbGFudGVkVmlld0NvdW50KGluc2VydGlvbkxDb250YWluZXIsIDEpO1xuICAgICAgfVxuICAgICAgLy8gTm90ZSwgaXQgaXMgcG9zc2libGUgdGhhdCB0aGUgYG1vdmVkVmlld3NgIGlzIHRyYWNraW5nIHZpZXdzIHRoYXQgYXJlIHRyYW5zcGxhbnRlZCAqYW5kKlxuICAgICAgLy8gdGhvc2UgdGhhdCBhcmVuJ3QgKGRlY2xhcmF0aW9uIGNvbXBvbmVudCA9PT0gaW5zZXJ0aW9uIGNvbXBvbmVudCkuIEluIHRoZSBsYXR0ZXIgY2FzZSxcbiAgICAgIC8vIGl0J3MgZmluZSB0byBhZGQgdGhlIGZsYWcsIGFzIHdlIHdpbGwgY2xlYXIgaXQgaW1tZWRpYXRlbHkgaW5cbiAgICAgIC8vIGByZWZyZXNoRW1iZWRkZWRWaWV3c2AgZm9yIHRoZSB2aWV3IGN1cnJlbnRseSBiZWluZyByZWZyZXNoZWQuXG4gICAgICBtb3ZlZExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3O1xuICAgIH1cbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRIb3N0SWR4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5mdW5jdGlvbiByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSkge1xuICAgIGNvbnN0IHRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gICAgaWYgKGNvbXBvbmVudFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgICAgcmVmcmVzaFZpZXcodFZpZXcsIGNvbXBvbmVudFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbiAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICAgICAgcmVmcmVzaENvbnRhaW5zRGlydHlWaWV3KGNvbXBvbmVudFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhbGwgdHJhbnNwbGFudGVkIHZpZXdzIG1hcmtlZCB3aXRoIGBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3YCB0aGF0IGFyZVxuICogY2hpbGRyZW4gb3IgZGVzY2VuZGFudHMgb2YgdGhlIGdpdmVuIGxWaWV3LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgbFZpZXcgd2hpY2ggY29udGFpbnMgZGVzY2VuZGFudCB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZC5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRhaW5zRGlydHlWaWV3KGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGVtYmVkZGVkTFZpZXcpKSB7XG4gICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gZW1iZWRkZWRMVmlld1tUVklFV107XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgICAgcmVmcmVzaFZpZXcoXG4gICAgICAgICAgICAgIGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0hKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGVtYmVkZGVkTFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5VmlldyhlbWJlZGRlZExWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudHNbaV0sIGxWaWV3KTtcbiAgICAgIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpICYmXG4gICAgICAgICAgY29tcG9uZW50Vmlld1tUUkFOU1BMQU5URURfVklFV1NfVE9fUkVGUkVTSF0gPiAwKSB7XG4gICAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5Vmlldyhjb21wb25lbnRWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRUVmlldywgY29tcG9uZW50Vmlldyk7XG4gIHJlbmRlclZpZXcoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcsIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xufVxuXG4vKipcbiAqIFN5bmNzIGFuIExWaWV3IGluc3RhbmNlIHdpdGggaXRzIGJsdWVwcmludCBpZiB0aGV5IGhhdmUgZ290dGVuIG91dCBvZiBzeW5jLlxuICpcbiAqIFR5cGljYWxseSwgYmx1ZXByaW50cyBhbmQgdGhlaXIgdmlldyBpbnN0YW5jZXMgc2hvdWxkIGFsd2F5cyBiZSBpbiBzeW5jLCBzbyB0aGUgbG9vcCBoZXJlXG4gKiB3aWxsIGJlIHNraXBwZWQuIEhvd2V2ZXIsIGNvbnNpZGVyIHRoaXMgY2FzZSBvZiB0d28gY29tcG9uZW50cyBzaWRlLWJ5LXNpZGU6XG4gKlxuICogQXBwIHRlbXBsYXRlOlxuICogYGBgXG4gKiA8Y29tcD48L2NvbXA+XG4gKiA8Y29tcD48L2NvbXA+XG4gKiBgYGBcbiAqXG4gKiBUaGUgZm9sbG93aW5nIHdpbGwgaGFwcGVuOlxuICogMS4gQXBwIHRlbXBsYXRlIGJlZ2lucyBwcm9jZXNzaW5nLlxuICogMi4gRmlyc3QgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogMy4gU2Vjb25kIDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDQuIEFwcCB0ZW1wbGF0ZSBjb21wbGV0ZXMgcHJvY2Vzc2luZywgc28gaXQncyB0aW1lIHRvIGNoZWNrIGNoaWxkIHRlbXBsYXRlcy5cbiAqIDUuIEZpcnN0IDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdCBoYXMgYSBkaXJlY3RpdmUsIHNvIGl0cyBkZWYgaXMgcHVzaGVkIHRvIGJsdWVwcmludC5cbiAqIDYuIFNlY29uZCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXRzIGJsdWVwcmludCBoYXMgYmVlbiB1cGRhdGVkIGJ5IHRoZSBmaXJzdFxuICogPGNvbXA+IHRlbXBsYXRlLCBidXQgaXRzIExWaWV3IHdhcyBjcmVhdGVkIGJlZm9yZSB0aGlzIHVwZGF0ZSwgc28gaXQgaXMgb3V0IG9mIHN5bmMuXG4gKlxuICogTm90ZSB0aGF0IGVtYmVkZGVkIHZpZXdzIGluc2lkZSBuZ0ZvciBsb29wcyB3aWxsIG5ldmVyIGJlIG91dCBvZiBzeW5jIGJlY2F1c2UgdGhlc2Ugdmlld3NcbiAqIGFyZSBwcm9jZXNzZWQgYXMgc29vbiBhcyB0aGV5IGFyZSBjcmVhdGVkLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgYFRWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBibHVlcHJpbnQgZm9yIHN5bmNpbmdcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludCh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBpID0gbFZpZXcubGVuZ3RoOyBpIDwgdFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgbFZpZXcucHVzaCh0Vmlldy5ibHVlcHJpbnRbaV0pO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4obFZpZXc6IExWaWV3LCBsVmlld09yTENvbnRhaW5lcjogVCk6IFQge1xuICAvLyBUT0RPKGJlbmxlc2gvbWlza28pOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGluY29ycmVjdCwgYmVjYXVzZSBpdCBhbHdheXMgYWRkcyB0aGUgTENvbnRhaW5lclxuICAvLyB0byB0aGUgZW5kIG9mIHRoZSBxdWV1ZSwgd2hpY2ggbWVhbnMgaWYgdGhlIGRldmVsb3BlciByZXRyaWV2ZXMgdGhlIExDb250YWluZXJzIGZyb20gUk5vZGVzIG91dFxuICAvLyBvZiBvcmRlciwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBydW4gb3V0IG9mIG9yZGVyLCBhcyB0aGUgYWN0IG9mIHJldHJpZXZpbmcgdGhlIHRoZVxuICAvLyBMQ29udGFpbmVyIGZyb20gdGhlIFJOb2RlIGlzIHdoYXQgYWRkcyBpdCB0byB0aGUgcXVldWUuXG4gIGlmIChsVmlld1tDSElMRF9IRUFEXSkge1xuICAgIGxWaWV3W0NISUxEX1RBSUxdIVtORVhUXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9IGVsc2Uge1xuICAgIGxWaWV3W0NISUxEX0hFQURdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH1cbiAgbFZpZXdbQ0hJTERfVEFJTF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgcmV0dXJuIGxWaWV3T3JMQ29udGFpbmVyO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIENoYW5nZSBkZXRlY3Rpb25cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuXG4vKipcbiAqIE1hcmtzIGN1cnJlbnQgdmlldyBhbmQgYWxsIGFuY2VzdG9ycyBkaXJ0eS5cbiAqXG4gKiBSZXR1cm5zIHRoZSByb290IHZpZXcgYmVjYXVzZSBpdCBpcyBmb3VuZCBhcyBhIGJ5cHJvZHVjdCBvZiBtYXJraW5nIHRoZSB2aWV3IHRyZWVcbiAqIGRpcnR5LCBhbmQgY2FuIGJlIHVzZWQgYnkgbWV0aG9kcyB0aGF0IGNvbnN1bWUgbWFya1ZpZXdEaXJ0eSgpIHRvIGVhc2lseSBzY2hlZHVsZVxuICogY2hhbmdlIGRldGVjdGlvbi4gT3RoZXJ3aXNlLCBzdWNoIG1ldGhvZHMgd291bGQgbmVlZCB0byB0cmF2ZXJzZSB1cCB0aGUgdmlldyB0cmVlXG4gKiBhbiBhZGRpdGlvbmFsIHRpbWUgdG8gZ2V0IHRoZSByb290IHZpZXcgYW5kIHNjaGVkdWxlIGEgdGljayBvbiBpdC5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHN0YXJ0aW5nIExWaWV3IHRvIG1hcmsgZGlydHlcbiAqIEByZXR1cm5zIHRoZSByb290IExWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrVmlld0RpcnR5KGxWaWV3OiBMVmlldyk6IExWaWV3fG51bGwge1xuICB3aGlsZSAobFZpZXcpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5EaXJ0eTtcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRMVmlld1BhcmVudChsVmlldyk7XG4gICAgLy8gU3RvcCB0cmF2ZXJzaW5nIHVwIGFzIHNvb24gYXMgeW91IGZpbmQgYSByb290IHZpZXcgdGhhdCB3YXNuJ3QgYXR0YWNoZWQgdG8gYW55IGNvbnRhaW5lclxuICAgIGlmIChpc1Jvb3RWaWV3KGxWaWV3KSAmJiAhcGFyZW50KSB7XG4gICAgICByZXR1cm4gbFZpZXc7XG4gICAgfVxuICAgIC8vIGNvbnRpbnVlIG90aGVyd2lzZVxuICAgIGxWaWV3ID0gcGFyZW50ITtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCwgbm90aWZ5RXJyb3JIYW5kbGVyID0gdHJ1ZSkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGludm9rZSByZW5kZXJlciBmYWN0b3J5IGZ1bmN0aW9ucyBpbiB0aGF0IG1vZGVcbiAgLy8gdG8gYXZvaWQgYW55IHBvc3NpYmxlIHNpZGUtZWZmZWN0cy5cbiAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaWYgKG5vdGlmeUVycm9ySGFuZGxlcikge1xuICAgICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB9XG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKCFjaGVja05vQ2hhbmdlc01vZGUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHRWaWV3LCBsVmlldywgY29udGV4dCwgbm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjxUPiwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdRdWVyeUZuLCAnVmlldyBxdWVyaWVzIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgbXVzdCBiZSBkZWZpbmVkLicpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgdmlld1F1ZXJ5Rm4oZmxhZ3MsIGNvbXBvbmVudCk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgLi4uaW50ZXJwb2xhdGlvblBhcnRzOiBzdHJpbmdbXSkge1xuICAvLyBCaW5kaW5nIG1ldGEtZGF0YSBhcmUgc3RvcmVkIG9ubHkgdGhlIGZpcnN0IHRpbWUgYSBnaXZlbiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBpcyBwcm9jZXNzZWQuXG4gIC8vIFNpbmNlIHdlIGRvbid0IGhhdmUgYSBjb25jZXB0IG9mIHRoZSBcImZpcnN0IHVwZGF0ZSBwYXNzXCIgd2UgbmVlZCB0byBjaGVjayBmb3IgcHJlc2VuY2Ugb2YgdGhlXG4gIC8vIGJpbmRpbmcgbWV0YS1kYXRhIHRvIGRlY2lkZSBpZiBvbmUgc2hvdWxkIGJlIHN0b3JlZCAob3IgaWYgd2FzIHN0b3JlZCBhbHJlYWR5KS5cbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleF0gPT09IG51bGwpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09IG51bGwgfHwgIXROb2RlLmlucHV0c1twcm9wZXJ0eU5hbWVdKSB7XG4gICAgICBjb25zdCBwcm9wQmluZGluZ0lkeHMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzIHx8ICh0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzID0gW10pO1xuICAgICAgcHJvcEJpbmRpbmdJZHhzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgIGxldCBiaW5kaW5nTWV0YWRhdGEgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICBpZiAoaW50ZXJwb2xhdGlvblBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYmluZGluZ01ldGFkYXRhICs9XG4gICAgICAgICAgICBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIGludGVycG9sYXRpb25QYXJ0cy5qb2luKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIH1cbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBiaW5kaW5nTWV0YWRhdGE7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUxWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IG5nRGV2TW9kZSA/IG5ldyBMQ2xlYW51cCgpIDogW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXc6IFRWaWV3KTogYW55W10ge1xuICByZXR1cm4gdFZpZXcuY2xlYW51cCB8fCAodFZpZXcuY2xlYW51cCA9IG5nRGV2TW9kZSA/IG5ldyBUQ2xlYW51cCgpIDogW10pO1xufVxuXG4vKipcbiAqIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIG5lZWRzIHRvIGJlIGluY2x1ZGVkXG4gKiBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyIChzZWUgdGhlIGNvbXBvbmVudFN5bnRoZXRpY0hvc3QqIGluc3RydWN0aW9ucykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIoXG4gICAgY3VycmVudERlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlciB7XG4gIC8vIFRPRE8oRlctMjA0Myk6IHRoZSBgY3VycmVudERlZmAgaXMgbnVsbCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGludm9rZWQgd2hpbGUgY3JlYXRpbmcgcm9vdFxuICAvLyBjb21wb25lbnQgKHNlZSBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbXBvbmVudC50cykuIFRoaXMgaXMgbm90IGNvbnNpc3RlbnQgd2l0aCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBjcmVhdGluZyBpbm5lciBjb21wb25lbnRzLCB3aGVuIGN1cnJlbnQgZGlyZWN0aXZlIGluZGV4IGlzIGF2YWlsYWJsZSBpbiB0aGUgc3RhdGUuIEluIG9yZGVyXG4gIC8vIHRvIGF2b2lkIHJlbHlpbmcgb24gY3VycmVudCBkZWYgYmVpbmcgYG51bGxgICh0aHVzIHNwZWNpYWwtY2FzaW5nIHJvb3QgY29tcG9uZW50IGNyZWF0aW9uKSwgdGhlXG4gIC8vIHByb2Nlc3Mgb2YgY3JlYXRpbmcgcm9vdCBjb21wb25lbnQgc2hvdWxkIGJlIHVuaWZpZWQgd2l0aCB0aGUgcHJvY2VzcyBvZiBjcmVhdGluZyBpbm5lclxuICAvLyBjb21wb25lbnRzLlxuICBpZiAoY3VycmVudERlZiA9PT0gbnVsbCB8fCBpc0NvbXBvbmVudERlZihjdXJyZW50RGVmKSkge1xuICAgIGxWaWV3ID0gdW53cmFwTFZpZXcobFZpZXdbdE5vZGUuaW5kZXhdKSE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3W1JFTkRFUkVSXTtcbn1cblxuLyoqIEhhbmRsZXMgYW4gZXJyb3IgdGhyb3duIGluIGFuIExWaWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUVycm9yKGxWaWV3OiBMVmlldywgZXJyb3I6IGFueSk6IHZvaWQge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXTtcbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gaW5qZWN0b3IgPyBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKSA6IG51bGw7XG4gIGVycm9ySGFuZGxlciAmJiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpO1xufVxuXG4vKipcbiAqIFNldCB0aGUgaW5wdXRzIG9mIGRpcmVjdGl2ZXMgYXQgdGhlIGN1cnJlbnQgbm9kZSB0byBjb3JyZXNwb25kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGlucHV0cyBtYXBwaW5nIGJldHdlZW4gdGhlIHB1YmxpYyBcImlucHV0XCIgbmFtZSBhbmQgcHJpdmF0ZWx5LWtub3duLFxuICogICAgICAgIHBvc3NpYmx5IG1pbmlmaWVkLCBwcm9wZXJ0eSBuYW1lcyB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHB1YmxpY05hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7KSB7XG4gICAgY29uc3QgaW5kZXggPSBpbnB1dHNbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0ZXh0IGJpbmRpbmcgYXQgYSBnaXZlbiBpbmRleCBpbiBhIGdpdmVuIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyh2YWx1ZSwgJ1ZhbHVlIHNob3VsZCBiZSBhIHN0cmluZycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgdXBkYXRlVGV4dE5vZGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCB2YWx1ZSk7XG59XG4iXX0=