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
import { assertDefined, assertEqual, assertGreaterThanOrEqual, assertIndexInRange, assertNotEqual, assertNotSame, assertSame, assertString } from '../../util/assert';
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
import { getUniqueLViewId } from '../interfaces/lview_tracking';
import { isComponentDef, isComponentHost, isContentQueryHost, isRootView } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, EMBEDDED_VIEW_INJECTOR, FLAGS, HEADER_OFFSET, HOST, ID, INJECTOR, NEXT, PARENT, RENDERER, RENDERER_FACTORY, SANITIZER, T_HOST, TRANSPLANTED_VIEWS_TO_REFRESH, TVIEW } from '../interfaces/view';
import { assertPureTNodeType, assertTNodeType } from '../node_assert';
import { updateTextNode } from '../node_manipulation';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { profiler } from '../profiler';
import { enterView, getBindingsEnabled, getCurrentDirectiveIndex, getCurrentParentTNode, getCurrentTNode, getCurrentTNodePlaceholderOk, getSelectedIndex, isCurrentTNodeParent, isInCheckNoChangesMode, isInI18nBlock, leaveView, setBindingIndex, setBindingRootForHostBindings, setCurrentDirectiveIndex, setCurrentQueryIndex, setCurrentTNode, setIsInCheckNoChangesMode, setSelectedIndex } from '../state';
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
            tNode.flags |= 64 /* TNodeFlags.isDetached */;
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
export function renderComponentOrTemplate(tView, lView, templateFn, context) {
    const rendererFactory = lView[RENDERER_FACTORY];
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to invoke renderer factory functions in that mode
    // to avoid any possible side-effects.
    const checkNoChangesMode = !!ngDevMode && isInCheckNoChangesMode();
    const creationModeIsActive = isCreationMode(lView);
    try {
        if (!checkNoChangesMode && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (creationModeIsActive) {
            renderView(tView, lView, context);
        }
        refreshView(tView, lView, templateFn, context);
    }
    finally {
        if (!checkNoChangesMode && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
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
    if ((tNode.flags & 128 /* TNodeFlags.hasHostBindings */) === 128 /* TNodeFlags.hasHostBindings */) {
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
export function initializeInputAndOutputAliases(tView, tNode) {
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
            tNode.flags |= 16 /* TNodeFlags.hasClassInput */;
        }
        if (inputsStore.hasOwnProperty('style')) {
            tNode.flags |= 32 /* TNodeFlags.hasStyleInput */;
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
        initializeInputAndOutputAliases(tView, rootTNode);
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
                    tNode.flags |= 8 /* TNodeFlags.hasContentQuery */;
                if (def.hostBindings !== null || def.hostAttrs !== null || def.hostVars !== 0)
                    tNode.flags |= 128 /* TNodeFlags.hasHostBindings */;
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
function invokeDirectivesHostBindings(tView, lView, tNode) {
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
function findDirectiveDefMatches(tView, viewData, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
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
                        assertTNodeType(tNode, 2 /* TNodeType.Element */, `"${tNode.value}" tags cannot be used as component hosts. ` +
                            `Please use a different tag to activate the ${stringify(def.type)} component.`);
                        if (tNode.flags & 2 /* TNodeFlags.isComponentHost */) {
                            // If another component has been matched previously, it's the first element in the
                            // `matches` array, see how we store components/directives in `matches` below.
                            throwMultipleComponentError(tNode, matches[0].type, def.type);
                        }
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
    hostTNode.flags |= 2 /* TNodeFlags.isComponentHost */;
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
function configureViewWithDirective(tView, tNode, lView, directiveIndex, def) {
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
    registerHostBindingOpCodes(tView, tNode, lView, directiveIndex, allocExpando(tView, lView, def.hostVars, NO_CHANGE), def);
}
function addComponentLogic(lView, hostTNode, def) {
    const native = getNativeByTNode(hostTNode, lView);
    const tView = getOrCreateTComponentView(def);
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
 * @param inputs The list of inputs from the directive def
 * @param attrs The static attrs on this node
 */
function generateInitialInputs(inputs, attrs) {
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
export function tickRootContext(rootContext) {
    for (let i = 0; i < rootContext.components.length; i++) {
        const rootComponent = rootContext.components[i];
        const lView = readPatchedLView(rootComponent);
        // We might not have an `LView` if the component was destroyed.
        if (lView !== null) {
            const tView = lView[TVIEW];
            renderComponentOrTemplate(tView, lView, tView.template, rootComponent);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUc1RCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsOEJBQThCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUUvRyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNwSyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoSixPQUFPLEVBQUMsZUFBZSxFQUFFLGdCQUFnQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDdkUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM1RixPQUFPLEVB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QWE7SUFDNUUsU0FBUyxJQUFJLFlBQVksQ0FBQyxLQUFLLEVBQUUsMEJBQTBCLENBQUMsQ0FBQztJQUM3RCxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxTQUFnQixFQUFFLCtCQUErQixDQUFDLENBQUM7SUFDckYsU0FBUyxJQUFJLGtCQUFrQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM5QyxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFpQixDQUFDO0lBQy9ELFNBQVMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkUsY0FBYyxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEQsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1J1bnRpbWVFcnJvciwgUnVudGltZUVycm9yQ29kZX0gZnJvbSAnLi4vLi4vZXJyb3JzJztcbmltcG9ydCB7RG9DaGVjaywgT25DaGFuZ2VzLCBPbkluaXR9IGZyb20gJy4uLy4uL2ludGVyZmFjZS9saWZlY3ljbGVfaG9va3MnO1xuaW1wb3J0IHtTY2hlbWFNZXRhZGF0YX0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvc2NoZW1hJztcbmltcG9ydCB7Vmlld0VuY2Fwc3VsYXRpb259IGZyb20gJy4uLy4uL21ldGFkYXRhL3ZpZXcnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXplcic7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwsIGFzc2VydEluZGV4SW5SYW5nZSwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWUsIGFzc2VydFNhbWUsIGFzc2VydFN0cmluZ30gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtlc2NhcGVDb21tZW50VGV4dH0gZnJvbSAnLi4vLi4vdXRpbC9kb20nO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19yZWZsZWN0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzLCBhc3NlcnRMQ29udGFpbmVyLCBhc3NlcnRMVmlldywgYXNzZXJ0VE5vZGVGb3JMVmlldywgYXNzZXJ0VE5vZGVGb3JUVmlld30gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCByZWFkUGF0Y2hlZExWaWV3fSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2dldEZhY3RvcnlEZWZ9IGZyb20gJy4uL2RlZmluaXRpb25fZmFjdG9yeSc7XG5pbXBvcnQge2RpUHVibGljSW5JbmplY3RvciwgZ2V0Tm9kZUluamVjdGFibGUsIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZX0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHt0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3J9IGZyb20gJy4uL2Vycm9ycyc7XG5pbXBvcnQge2V4ZWN1dGVDaGVja0hvb2tzLCBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MsIGluY3JlbWVudEluaXRQaGFzZUZsYWdzfSBmcm9tICcuLi9ob29rcyc7XG5pbXBvcnQge0NPTlRBSU5FUl9IRUFERVJfT0ZGU0VULCBIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTLCBMQ29udGFpbmVyLCBNT1ZFRF9WSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRVbmlxdWVMVmlld0lkfSBmcm9tICcuLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc2VzLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFRBdHRyaWJ1dGVzLCBUQ29uc3RhbnRzT3JGYWN0b3J5LCBUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UmVuZGVyZXIsIFJlbmRlcmVyRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3QsIGlzQ29udGVudFF1ZXJ5SG9zdCwgaXNSb290Vmlld30gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBERUNMQVJBVElPTl9WSUVXLCBFTUJFRERFRF9WSUVXX0lOSkVDVE9SLCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSG9zdEJpbmRpbmdPcENvZGVzLCBJRCwgSW5pdFBoYXNlU3RhdGUsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBSRU5ERVJFUiwgUkVOREVSRVJfRkFDVE9SWSwgUm9vdENvbnRleHQsIFNBTklUSVpFUiwgVF9IT1NULCBURGF0YSwgVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0gsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRQdXJlVE5vZGVUeXBlLCBhc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4uL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7dXBkYXRlVGV4dE5vZGV9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNJbmxpbmVUZW1wbGF0ZSwgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge3Byb2ZpbGVyLCBQcm9maWxlckV2ZW50fSBmcm9tICcuLi9wcm9maWxlcic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0QmluZGluZ3NFbmFibGVkLCBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgsIGdldEN1cnJlbnRQYXJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlLCBnZXRDdXJyZW50VE5vZGVQbGFjZWhvbGRlck9rLCBnZXRTZWxlY3RlZEluZGV4LCBpc0N1cnJlbnRUTm9kZVBhcmVudCwgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSwgaXNJbkkxOG5CbG9jaywgbGVhdmVWaWV3LCBzZXRCaW5kaW5nSW5kZXgsIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzLCBzZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgsIHNldEN1cnJlbnRRdWVyeUluZGV4LCBzZXRDdXJyZW50VE5vZGUsIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUsIHNldFNlbGVjdGVkSW5kZXh9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7Tk9fQ0hBTkdFfSBmcm9tICcuLi90b2tlbnMnO1xuaW1wb3J0IHttZXJnZUhvc3RBdHRyc30gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtyZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TFZpZXdQYXJlbnQsIGdldE5leHRMQ29udGFpbmVyfSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBpc0NyZWF0aW9uTW9kZSwgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwTFZpZXcsIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudCwgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHvJtcm1ZGlyZWN0aXZlSW5qZWN0fSBmcm9tICcuL2RpJztcbmltcG9ydCB7aGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IsIGlzUHJvcGVydHlWYWxpZCwgbWF0Y2hpbmdTY2hlbWFzfSBmcm9tICcuL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5pbXBvcnQge2F0dGFjaExDb250YWluZXJEZWJ1ZywgYXR0YWNoTFZpZXdEZWJ1ZywgY2xvbmVUb0xWaWV3RnJvbVRWaWV3Qmx1ZXByaW50LCBjbG9uZVRvVFZpZXdEYXRhLCBMQ2xlYW51cCwgTFZpZXdCbHVlcHJpbnQsIE1hdGNoZXNBcnJheSwgVENsZWFudXAsIFROb2RlRGVidWcsIFROb2RlSW5pdGlhbElucHV0cywgVE5vZGVMb2NhbE5hbWVzLCBUVmlld0NvbXBvbmVudHMsIFRWaWV3Q29uc3RydWN0b3J9IGZyb20gJy4vbHZpZXdfZGVidWcnO1xuXG4vKipcbiAqIEludm9rZSBgSG9zdEJpbmRpbmdzRnVuY3Rpb25gcyBmb3Igdmlldy5cbiAqXG4gKiBUaGlzIG1ldGhvZHMgZXhlY3V0ZXMgYFRWaWV3Lmhvc3RCaW5kaW5nT3BDb2Rlc2AuIEl0IGlzIHVzZWQgdG8gZXhlY3V0ZSB0aGVcbiAqIGBIb3N0QmluZGluZ3NGdW5jdGlvbmBzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gIGlmIChob3N0QmluZGluZ09wQ29kZXMgPT09IG51bGwpIHJldHVybjtcbiAgdHJ5IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgb3BDb2RlID0gaG9zdEJpbmRpbmdPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgYXJlIGVsZW1lbnQgaW5kZXhlcy5cbiAgICAgICAgc2V0U2VsZWN0ZWRJbmRleCh+b3BDb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFBvc2l0aXZlIG51bWJlcnMgYXJlIE51bWJlclR1cGxlIHdoaWNoIHN0b3JlIGJpbmRpbmdSb290SW5kZXggYW5kIGRpcmVjdGl2ZUluZGV4LlxuICAgICAgICBjb25zdCBkaXJlY3RpdmVJZHggPSBvcENvZGU7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdSb290SW5keCA9IGhvc3RCaW5kaW5nT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgaG9zdEJpbmRpbmdGbiA9IGhvc3RCaW5kaW5nT3BDb2Rlc1srK2ldIGFzIEhvc3RCaW5kaW5nc0Z1bmN0aW9uPGFueT47XG4gICAgICAgIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKGJpbmRpbmdSb290SW5keCwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxWaWV3W2RpcmVjdGl2ZUlkeF07XG4gICAgICAgIGhvc3RCaW5kaW5nRm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0KTtcbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gIH1cbn1cblxuXG4vKiogUmVmcmVzaGVzIGFsbCBjb250ZW50IHF1ZXJpZXMgZGVjbGFyZWQgYnkgZGlyZWN0aXZlcyBpbiBhIGdpdmVuIHZpZXcgKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBjb250ZW50UXVlcmllcyA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzO1xuICBpZiAoY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRlbnRRdWVyaWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBxdWVyeVN0YXJ0SWR4ID0gY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWZJZHggPSBjb250ZW50UXVlcmllc1tpICsgMV07XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmSWR4ICE9PSAtMSkge1xuICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZiwgJ0RpcmVjdGl2ZURlZiBub3QgZm91bmQuJyk7XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMsICdjb250ZW50UXVlcmllcyBmdW5jdGlvbiBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgICBzZXRDdXJyZW50UXVlcnlJbmRleChxdWVyeVN0YXJ0SWR4KTtcbiAgICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3ICh1cGRhdGUgbW9kZSkuICovXG5mdW5jdGlvbiByZWZyZXNoQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlZnJlc2hDb21wb25lbnQoaG9zdExWaWV3LCBjb21wb25lbnRzW2ldKTtcbiAgfVxufVxuXG4vKiogUmVuZGVycyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKGNyZWF0aW9uIG1vZGUpLiAqL1xuZnVuY3Rpb24gcmVuZGVyQ2hpbGRDb21wb25lbnRzKGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudHM6IG51bWJlcltdKTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXd8bnVsbCwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUfG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLCBob3N0OiBSRWxlbWVudHxudWxsLFxuICAgIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgcmVuZGVyZXJGYWN0b3J5OiBSZW5kZXJlckZhY3Rvcnl8bnVsbCwgcmVuZGVyZXI6IFJlbmRlcmVyfG51bGwsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJ8bnVsbCwgaW5qZWN0b3I6IEluamVjdG9yfG51bGwsXG4gICAgZW1iZWRkZWRWaWV3SW5qZWN0b3I6IEluamVjdG9yfG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID1cbiAgICAgIG5nRGV2TW9kZSA/IGNsb25lVG9MVmlld0Zyb21UVmlld0JsdWVwcmludCh0VmlldykgOiB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIGlmIChlbWJlZGRlZFZpZXdJbmplY3RvciAhPT0gbnVsbCB8fFxuICAgICAgKHBhcmVudExWaWV3ICYmIChwYXJlbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0VtYmVkZGVkVmlld0luamVjdG9yKSkpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5IYXNFbWJlZGRlZFZpZXdJbmplY3RvcjtcbiAgfVxuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIHRWaWV3LmRlY2xUTm9kZSAmJiBwYXJlbnRMVmlldyAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHRWaWV3LmRlY2xUTm9kZSwgcGFyZW50TFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSA9IChyZW5kZXJlckZhY3RvcnkgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJfRkFDVE9SWV0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCE7XG4gIGxWaWV3W0lOSkVDVE9SIGFzIGFueV0gPSBpbmplY3RvciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tJTkpFQ1RPUl0gfHwgbnVsbDtcbiAgbFZpZXdbVF9IT1NUXSA9IHRIb3N0Tm9kZTtcbiAgbFZpZXdbSURdID0gZ2V0VW5pcXVlTFZpZXdJZCgpO1xuICBsVmlld1tFTUJFRERFRF9WSUVXX0lOSkVDVE9SIGFzIGFueV0gPSBlbWJlZGRlZFZpZXdJbmplY3RvcjtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3ICE9PSBudWxsIDogdHJ1ZSwgdHJ1ZSxcbiAgICAgICAgICAnRW1iZWRkZWQgdmlld3MgbXVzdCBoYXZlIHBhcmVudExWaWV3Jyk7XG4gIGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA9XG4gICAgICB0Vmlldy50eXBlID09IFRWaWV3VHlwZS5FbWJlZGRlZCA/IHBhcmVudExWaWV3IVtERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gOiBsVmlldztcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExWaWV3RGVidWcobFZpZXcpO1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6XG4gICAgVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmVEljdUNvbnRhaW5lck5vZGUge1xuICBuZ0Rldk1vZGUgJiYgaW5kZXggIT09IDAgJiYgIC8vIDAgYXJlIGJvZ3VzIG5vZGVzIGFuZCB0aGV5IGFyZSBPSy4gU2VlIGBjcmVhdGVDb250YWluZXJSZWZgIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYHZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHlgIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoaW5kZXgsIEhFQURFUl9PRkZTRVQsICdUTm9kZXMgY2FuXFwndCBiZSBpbiB0aGUgTFZpZXcgaGVhZGVyLicpO1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHVyZVROb2RlVHlwZSh0eXBlKTtcbiAgbGV0IHROb2RlID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSA9PT0gbnVsbCkge1xuICAgIHROb2RlID0gY3JlYXRlVE5vZGVBdEluZGV4KHRWaWV3LCBpbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMpO1xuICAgIGlmIChpc0luSTE4bkJsb2NrKCkpIHtcbiAgICAgIC8vIElmIHdlIGFyZSBpbiBpMThuIGJsb2NrIHRoZW4gYWxsIGVsZW1lbnRzIHNob3VsZCBiZSBwcmUgZGVjbGFyZWQgdGhyb3VnaCBgUGxhY2Vob2xkZXJgXG4gICAgICAvLyBTZWUgYFROb2RlVHlwZS5QbGFjZWhvbGRlcmAgYW5kIGBMRnJhbWUuaW5JMThuYCBmb3IgbW9yZSBjb250ZXh0LlxuICAgICAgLy8gSWYgdGhlIGBUTm9kZWAgd2FzIG5vdCBwcmUtZGVjbGFyZWQgdGhhbiBpdCBtZWFucyBpdCB3YXMgbm90IG1lbnRpb25lZCB3aGljaCBtZWFucyBpdCB3YXNcbiAgICAgIC8vIHJlbW92ZWQsIHNvIHdlIG1hcmsgaXQgYXMgZGV0YWNoZWQuXG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQ7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUGxhY2Vob2xkZXIpIHtcbiAgICB0Tm9kZS50eXBlID0gdHlwZTtcbiAgICB0Tm9kZS52YWx1ZSA9IG5hbWU7XG4gICAgdE5vZGUuYXR0cnMgPSBhdHRycztcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRDdXJyZW50UGFyZW50VE5vZGUoKTtcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gcGFyZW50ID09PSBudWxsID8gLTEgOiBwYXJlbnQuaW5qZWN0b3JJbmRleDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JUVmlldyh0Tm9kZSwgdFZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpbmRleCwgdE5vZGUuaW5kZXgsICdFeHBlY3Rpbmcgc2FtZSBpbmRleCcpO1xuICB9XG4gIHNldEN1cnJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmIFRQcm9qZWN0aW9uTm9kZSAmXG4gICAgICBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUTm9kZSA9IGdldEN1cnJlbnRUTm9kZVBsYWNlaG9sZGVyT2soKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBpc0N1cnJlbnRUTm9kZVBhcmVudCgpO1xuICBjb25zdCBwYXJlbnQgPSBpc1BhcmVudCA/IGN1cnJlbnRUTm9kZSA6IGN1cnJlbnRUTm9kZSAmJiBjdXJyZW50VE5vZGUucGFyZW50O1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcy5cbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2luZGV4XSA9XG4gICAgICBjcmVhdGVUTm9kZSh0VmlldywgcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlLCB0eXBlLCBpbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBBc3NpZ24gYSBwb2ludGVyIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIG9mIGEgZ2l2ZW4gdmlldy4gVGhlIGZpcnN0IG5vZGUgaXMgbm90IGFsd2F5cyB0aGUgb25lXG4gIC8vIGF0IGluZGV4IDAsIGluIGNhc2Ugb2YgaTE4biwgaW5kZXggMCBjYW4gYmUgdGhlIGluc3RydWN0aW9uIGBpMThuU3RhcnRgIGFuZCB0aGUgZmlyc3Qgbm9kZSBoYXNcbiAgLy8gdGhlIGluZGV4IDEgb3IgbW9yZSwgc28gd2UgY2FuJ3QganVzdCBjaGVjayBub2RlIGluZGV4LlxuICBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICBpZiAoY3VycmVudFROb2RlICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICAvLyBGSVhNRShtaXNrbyk6IFRoaXMgbG9naWMgbG9va3MgdW5uZWNlc3NhcmlseSBjb21wbGljYXRlZC4gQ291bGQgd2Ugc2ltcGxpZnk/XG4gICAgICBpZiAoY3VycmVudFROb2RlLmNoaWxkID09IG51bGwgJiYgdE5vZGUucGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICAgIGN1cnJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VycmVudFROb2RlLm5leHQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgaTE4biB0aGUgYGN1cnJlbnRUTm9kZWAgbWF5IGFscmVhZHkgYmUgbGlua2VkLCBpbiB3aGljaCBjYXNlIHdlIGRvbid0IHdhbnRcbiAgICAgICAgLy8gdG8gYnJlYWsgdGhlIGxpbmtzIHdoaWNoIGkxOG4gY3JlYXRlZC5cbiAgICAgICAgY3VycmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIGBMVmlld2BcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCBjb250YWluaW5nIHRoZSBibHVlcHJpbnQgdG8gYWRqdXN0XG4gKiBAcGFyYW0gbnVtU2xvdHNUb0FsbG9jIFRoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2MgaW4gdGhlIExWaWV3LCBzaG91bGQgYmUgPjBcbiAqIEBwYXJhbSBpbml0aWFsVmFsdWUgSW5pdGlhbCB2YWx1ZSB0byBzdG9yZSBpbiBibHVlcHJpbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIsIGluaXRpYWxWYWx1ZTogYW55KTogbnVtYmVyIHtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA9PT0gMCkgcmV0dXJuIC0xO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgICBhc3NlcnRTYW1lKHRWaWV3LCBsVmlld1tUVklFV10sICdgTFZpZXdgIG11c3QgYmUgYXNzb2NpYXRlZCB3aXRoIGBUVmlld2AhJyk7XG4gICAgYXNzZXJ0RXF1YWwodFZpZXcuZGF0YS5sZW5ndGgsIGxWaWV3Lmxlbmd0aCwgJ0V4cGVjdGluZyBMVmlldyB0byBiZSBzYW1lIHNpemUgYXMgVFZpZXcnKTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgdFZpZXcuZGF0YS5sZW5ndGgsIHRWaWV3LmJsdWVwcmludC5sZW5ndGgsICdFeHBlY3RpbmcgQmx1ZXByaW50IHRvIGJlIHNhbWUgc2l6ZSBhcyBUVmlldycpO1xuICAgIGFzc2VydEZpcnN0VXBkYXRlUGFzcyh0Vmlldyk7XG4gIH1cbiAgY29uc3QgYWxsb2NJZHggPSBsVmlldy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHNUb0FsbG9jOyBpKyspIHtcbiAgICBsVmlldy5wdXNoKGluaXRpYWxWYWx1ZSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goaW5pdGlhbFZhbHVlKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbiAgcmV0dXJuIGFsbG9jSWR4O1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFJlbmRlclxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHRoZSBjcmVhdGlvbiBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGNyZWF0aW5nIHZpZXcgcXVlcnkgZnVuY3Rpb25zIChpZiBhbnkpO1xuICogLSBleGVjdXRpbmcgYSB0ZW1wbGF0ZSBmdW5jdGlvbiBpbiB0aGUgY3JlYXRpb24gbW9kZTtcbiAqIC0gdXBkYXRpbmcgc3RhdGljIHF1ZXJpZXMgKGlmIGFueSk7XG4gKiAtIGNyZWF0aW5nIGNoaWxkIGNvbXBvbmVudHMgZGVmaW5lZCBpbiBhIGdpdmVuIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJWaWV3PFQ+KHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3PFQ+LCBjb250ZXh0OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgZW50ZXJWaWV3KGxWaWV3KTtcbiAgdHJ5IHtcbiAgICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gICAgaWYgKHZpZXdRdWVyeSAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFJlbmRlckZsYWdzLkNyZWF0ZSwgdmlld1F1ZXJ5LCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIGEgdGVtcGxhdGUgYXNzb2NpYXRlZCB3aXRoIHRoaXMgdmlldywgaWYgaXQgZXhpc3RzLiBBIHRlbXBsYXRlIGZ1bmN0aW9uIG1pZ2h0IG5vdCBiZVxuICAgIC8vIGRlZmluZWQgZm9yIHRoZSByb290IGNvbXBvbmVudCB2aWV3cy5cbiAgICBjb25zdCB0ZW1wbGF0ZUZuID0gdFZpZXcudGVtcGxhdGU7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZTxUPih0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLkNyZWF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgLy8gVGhpcyBuZWVkcyB0byBiZSBzZXQgYmVmb3JlIGNoaWxkcmVuIGFyZSBwcm9jZXNzZWQgdG8gc3VwcG9ydCByZWN1cnNpdmUgY29tcG9uZW50cy5cbiAgICAvLyBUaGlzIG11c3QgYmUgc2V0IHRvIGZhbHNlIGltbWVkaWF0ZWx5IGFmdGVyIHRoZSBmaXJzdCBjcmVhdGlvbiBydW4gYmVjYXVzZSBpbiBhblxuICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgIC8vIG9mZiBmaXJzdENyZWF0ZVBhc3MuIElmIHdlIGRvbid0IHNldCBpdCBoZXJlLCBpbnN0YW5jZXMgd2lsbCBwZXJmb3JtIGRpcmVjdGl2ZVxuICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8vIFdlIHJlc29sdmUgY29udGVudCBxdWVyaWVzIHNwZWNpZmljYWxseSBtYXJrZWQgYXMgYHN0YXRpY2AgaW4gY3JlYXRpb24gbW9kZS4gRHluYW1pY1xuICAgIC8vIGNvbnRlbnQgcXVlcmllcyBhcmUgcmVzb2x2ZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gKGkuZS4gdXBkYXRlIG1vZGUpLCBhZnRlciBlbWJlZGRlZFxuICAgIC8vIHZpZXdzIGFyZSByZWZyZXNoZWQgKHNlZSBibG9jayBhYm92ZSkuXG4gICAgaWYgKHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcbiAgICB9XG5cbiAgICAvLyBXZSBtdXN0IG1hdGVyaWFsaXplIHF1ZXJ5IHJlc3VsdHMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudHMgYXJlIHByb2Nlc3NlZFxuICAgIC8vIGluIGNhc2UgYSBjaGlsZCBjb21wb25lbnQgaGFzIHByb2plY3RlZCBhIGNvbnRhaW5lci4gVGhlIExDb250YWluZXIgbmVlZHNcbiAgICAvLyB0byBleGlzdCBzbyB0aGUgZW1iZWRkZWQgdmlld3MgYXJlIHByb3Blcmx5IGF0dGFjaGVkIGJ5IHRoZSBjb250YWluZXIuXG4gICAgaWYgKHRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB0Vmlldy52aWV3UXVlcnkhLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBSZW5kZXIgY2hpbGQgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICAgIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgICByZW5kZXJDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIC8vIElmIHdlIGRpZG4ndCBtYW5hZ2UgdG8gZ2V0IHBhc3QgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MgZHVlIHRvXG4gICAgLy8gYW4gZXJyb3IsIG1hcmsgdGhlIHZpZXcgYXMgY29ycnVwdGVkIHNvIHdlIGNhbiB0cnkgdG8gcmVjb3Zlci5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICB0Vmlldy5pbmNvbXBsZXRlRmlyc3RQYXNzID0gdHJ1ZTtcbiAgICAgIHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyA9IGZhbHNlO1xuICAgIH1cblxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzZXMgYSB2aWV3IGluIHVwZGF0ZSBtb2RlLiBUaGlzIGluY2x1ZGVzIGEgbnVtYmVyIG9mIHN0ZXBzIGluIGEgc3BlY2lmaWMgb3JkZXI6XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHVwZGF0ZSBtb2RlO1xuICogLSBleGVjdXRpbmcgaG9va3M7XG4gKiAtIHJlZnJlc2hpbmcgcXVlcmllcztcbiAqIC0gc2V0dGluZyBob3N0IGJpbmRpbmdzO1xuICogLSByZWZyZXNoaW5nIGNoaWxkIChlbWJlZGRlZCBhbmQgY29tcG9uZW50KSB2aWV3cy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZnJlc2hWaWV3PFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTx7fT58bnVsbCwgY29udGV4dDogVCkge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUobFZpZXcpLCBmYWxzZSwgJ1Nob3VsZCBiZSBydW4gaW4gdXBkYXRlIG1vZGUnKTtcbiAgY29uc3QgZmxhZ3MgPSBsVmlld1tGTEFHU107XG4gIGlmICgoZmxhZ3MgJiBMVmlld0ZsYWdzLkRlc3Ryb3llZCkgPT09IExWaWV3RmxhZ3MuRGVzdHJveWVkKSByZXR1cm47XG4gIGVudGVyVmlldyhsVmlldyk7XG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gZXhlY3V0ZSBsaWZlY3ljbGUgaG9va3MgaW4gdGhhdCBtb2RlLlxuICBjb25zdCBpc0luQ2hlY2tOb0NoYW5nZXNQYXNzID0gbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlyc3QgbWFyayB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBhcmUgZGVjbGFyZWQgaW4gdGhpcyBsVmlldyBhcyBuZWVkaW5nIGEgcmVmcmVzaCBhdCB0aGVpclxuICAgIC8vIGluc2VydGlvbiBwb2ludHMuIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlIHRlbXBsYXRlIGlzIGRlZmluZWQgaW4gdGhpc1xuICAgIC8vIGBMVmlld2AgYnV0IGl0cyBkZWNsYXJhdGlvbiBhcHBlYXJzIGFmdGVyIHRoZSBpbnNlcnRpb24gY29tcG9uZW50LlxuICAgIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXcpO1xuICAgIHJlZnJlc2hFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gICAgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXIsIC0xKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuXG4gIC8vIENoZWNrIG5vIGNoYW5nZXMgbW9kZSBpcyBhIGRldiBvbmx5IG1vZGUgdXNlZCB0byB2ZXJpZnkgdGhhdCBiaW5kaW5ncyBoYXZlIG5vdCBjaGFuZ2VkXG4gIC8vIHNpbmNlIHRoZXkgd2VyZSBhc3NpZ25lZC4gV2UgZG8gbm90IHdhbnQgdG8gaW52b2tlIHJlbmRlcmVyIGZhY3RvcnkgZnVuY3Rpb25zIGluIHRoYXQgbW9kZVxuICAvLyB0byBhdm9pZCBhbnkgcG9zc2libGUgc2lkZS1lZmZlY3RzLlxuICBjb25zdCBjaGVja05vQ2hhbmdlc01vZGUgPSAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUobFZpZXcpO1xuICB0cnkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cbiAgICBpZiAoY3JlYXRpb25Nb2RlSXNBY3RpdmUpIHtcbiAgICAgIHJlbmRlclZpZXcodFZpZXcsIGxWaWV3LCBjb250ZXh0KTtcbiAgICB9XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0ZW1wbGF0ZUZuLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSAmJiAhY3JlYXRpb25Nb2RlSXNBY3RpdmUgJiYgcmVuZGVyZXJGYWN0b3J5LmVuZCkge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXc8VD4sIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCByZjogUmVuZGVyRmxhZ3MsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgcHJldlNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGlzVXBkYXRlUGhhc2UgPSByZiAmIFJlbmRlckZsYWdzLlVwZGF0ZTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgICBpZiAoaXNVcGRhdGVQaGFzZSAmJiBsVmlldy5sZW5ndGggPiBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBpbmhlcmVudGx5IHNlbGVjdCAwIHNvIHdlIGRvbid0XG4gICAgICAvLyBoYXZlIHRvIGdlbmVyYXRlIHRoYXQgaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrcy5cbiAgICAgIHNlbGVjdEluZGV4SW50ZXJuYWwodFZpZXcsIGxWaWV3LCBIRUFERVJfT0ZGU0VULCAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHByZUhvb2tUeXBlID1cbiAgICAgICAgaXNVcGRhdGVQaGFzZSA/IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVVcGRhdGVTdGFydCA6IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVDcmVhdGVTdGFydDtcbiAgICBwcm9maWxlcihwcmVIb29rVHlwZSwgY29udGV4dCBhcyB1bmtub3duIGFzIHt9KTtcbiAgICB0ZW1wbGF0ZUZuKHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcblxuICAgIGNvbnN0IHBvc3RIb29rVHlwZSA9XG4gICAgICAgIGlzVXBkYXRlUGhhc2UgPyBQcm9maWxlckV2ZW50LlRlbXBsYXRlVXBkYXRlRW5kIDogUHJvZmlsZXJFdmVudC5UZW1wbGF0ZUNyZWF0ZUVuZDtcbiAgICBwcm9maWxlcihwb3N0SG9va1R5cGUsIGNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpKSB7XG4gICAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gICAgZm9yIChsZXQgZGlyZWN0aXZlSW5kZXggPSBzdGFydDsgZGlyZWN0aXZlSW5kZXggPCBlbmQ7IGRpcmVjdGl2ZUluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlSW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi5jb250ZW50UXVlcmllcykge1xuICAgICAgICBkZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBsVmlld1tkaXJlY3RpdmVJbmRleF0sIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNJbnN0YW5jZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXcsIGxWaWV3LCB0Tm9kZSwgZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpKTtcbiAgaWYgKCh0Tm9kZS5mbGFncyAmIFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSA9PT0gVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpIHtcbiAgICBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3LCBsVmlldywgdE5vZGUpO1xuICB9XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsXG4gICAgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yID0gZ2V0TmF0aXZlQnlUTm9kZSk6IHZvaWQge1xuICBjb25zdCBsb2NhbE5hbWVzID0gdE5vZGUubG9jYWxOYW1lcztcbiAgaWYgKGxvY2FsTmFtZXMgIT09IG51bGwpIHtcbiAgICBsZXQgbG9jYWxJbmRleCA9IHROb2RlLmluZGV4ICsgMTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsTmFtZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gbG9jYWxOYW1lc1tpICsgMV0gYXMgbnVtYmVyO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbmRleCA9PT0gLTEgP1xuICAgICAgICAgIGxvY2FsUmVmRXh0cmFjdG9yKFxuICAgICAgICAgICAgICB0Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgdmlld0RhdGEpIDpcbiAgICAgICAgICB2aWV3RGF0YVtpbmRleF07XG4gICAgICB2aWV3RGF0YVtsb2NhbEluZGV4KytdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2V0cyBUVmlldyBmcm9tIGEgdGVtcGxhdGUgZnVuY3Rpb24gb3IgY3JlYXRlcyBhIG5ldyBUVmlld1xuICogaWYgaXQgZG9lc24ndCBhbHJlYWR5IGV4aXN0LlxuICpcbiAqIEBwYXJhbSBkZWYgQ29tcG9uZW50RGVmXG4gKiBAcmV0dXJucyBUVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUQ29tcG9uZW50VmlldyhkZWY6IENvbXBvbmVudERlZjxhbnk+KTogVFZpZXcge1xuICBjb25zdCB0VmlldyA9IGRlZi50VmlldztcblxuICAvLyBDcmVhdGUgYSBUVmlldyBpZiB0aGVyZSBpc24ndCBvbmUsIG9yIHJlY3JlYXRlIGl0IGlmIHRoZSBmaXJzdCBjcmVhdGUgcGFzcyBkaWRuJ3RcbiAgLy8gY29tcGxldGUgc3VjY2Vzc2Z1bGx5IHNpbmNlIHdlIGNhbid0IGtub3cgZm9yIHN1cmUgd2hldGhlciBpdCdzIGluIGEgdXNhYmxlIHNoYXBlLlxuICBpZiAodFZpZXcgPT09IG51bGwgfHwgdFZpZXcuaW5jb21wbGV0ZUZpcnN0UGFzcykge1xuICAgIC8vIERlY2xhcmF0aW9uIG5vZGUgaGVyZSBpcyBudWxsIHNpbmNlIHRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gd2UgZHluYW1pY2FsbHkgY3JlYXRlIGFcbiAgICAvLyBjb21wb25lbnQgYW5kIGhlbmNlIHRoZXJlIGlzIG5vIGRlY2xhcmF0aW9uLlxuICAgIGNvbnN0IGRlY2xUTm9kZSA9IG51bGw7XG4gICAgcmV0dXJuIGRlZi50VmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICAgVFZpZXdUeXBlLkNvbXBvbmVudCwgZGVjbFROb2RlLCBkZWYudGVtcGxhdGUsIGRlZi5kZWNscywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLFxuICAgICAgICAgICAgICAgZGVmLnBpcGVEZWZzLCBkZWYudmlld1F1ZXJ5LCBkZWYuc2NoZW1hcywgZGVmLmNvbnN0cyk7XG4gIH1cblxuICByZXR1cm4gdFZpZXc7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGBUVmlld2AuXG4gKiBAcGFyYW0gZGVjbFROb2RlIERlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoaXMgYFRWaWV3YC5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHBpcGVzIFJlZ2lzdHJ5IG9mIHBpcGVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2aWV3UXVlcnkgVmlldyBxdWVyaWVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBzY2hlbWFzIFNjaGVtYXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIGNvbnN0cyBDb25zdGFudHMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdHlwZTogVFZpZXdUeXBlLCBkZWNsVE5vZGU6IFROb2RlfG51bGwsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58bnVsbCwgZGVjbHM6IG51bWJlcixcbiAgICB2YXJzOiBudW1iZXIsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3Rvcnl8bnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5fG51bGwsXG4gICAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT58bnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgIGNvbnN0c09yRmFjdG9yeTogVENvbnN0YW50c09yRmFjdG9yeXxudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGRlY2xzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIGNvbnN0IGNvbnN0cyA9IHR5cGVvZiBjb25zdHNPckZhY3RvcnkgPT09ICdmdW5jdGlvbicgPyBjb25zdHNPckZhY3RvcnkoKSA6IGNvbnN0c09yRmFjdG9yeTtcbiAgY29uc3QgdFZpZXcgPSBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IG5nRGV2TW9kZSA/XG4gICAgICBuZXcgVFZpZXdDb25zdHJ1Y3RvcihcbiAgICAgICAgICB0eXBlLCAgICAgICAgLy8gdHlwZTogVFZpZXdUeXBlLFxuICAgICAgICAgIGJsdWVwcmludCwgICAvLyBibHVlcHJpbnQ6IExWaWV3LFxuICAgICAgICAgIHRlbXBsYXRlRm4sICAvLyB0ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8e30+fG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgIC8vIHF1ZXJpZXM6IFRRdWVyaWVzfG51bGxcbiAgICAgICAgICB2aWV3UXVlcnksICAgLy8gdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPHt9PnxudWxsLFxuICAgICAgICAgIGRlY2xUTm9kZSwgICAvLyBkZWNsVE5vZGU6IFROb2RlfG51bGwsXG4gICAgICAgICAgY2xvbmVUb1RWaWV3RGF0YShibHVlcHJpbnQpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLCAgLy8gZGF0YTogVERhdGEsXG4gICAgICAgICAgYmluZGluZ1N0YXJ0SW5kZXgsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlcixcbiAgICAgICAgICBpbml0aWFsVmlld0xlbmd0aCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGhvc3RCaW5kaW5nT3BDb2RlczogSG9zdEJpbmRpbmdPcENvZGVzLFxuICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0Q3JlYXRlUGFzczogYm9vbGVhbixcbiAgICAgICAgICB0cnVlLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmaXJzdFVwZGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RhdGljVmlld1F1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc3RhdGljQ29udGVudFF1ZXJpZXM6IGJvb2xlYW4sXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBwcmVPcmRlckNoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGVudEhvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHZpZXdIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB2aWV3Q2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBkZXN0cm95SG9va3M6IERlc3Ryb3lIb29rRGF0YXxudWxsLFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGNsZWFudXA6IGFueVtdfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29tcG9uZW50czogbnVtYmVyW118bnVsbCxcbiAgICAgICAgICB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/ICAvL1xuICAgICAgICAgICAgICBkaXJlY3RpdmVzKCkgOiAgICAgICAgICAgICAgICAgIC8vXG4gICAgICAgICAgICAgIGRpcmVjdGl2ZXMsICAgICAgICAgICAgICAgICAgICAgLy8gZGlyZWN0aXZlUmVnaXN0cnk6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCxcbiAgICAgICAgICB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsICAvLyBwaXBlUmVnaXN0cnk6IFBpcGVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZmlyc3RDaGlsZDogVE5vZGV8bnVsbCxcbiAgICAgICAgICBzY2hlbWFzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzY2hlbWFzOiBTY2hlbWFNZXRhZGF0YVtdfG51bGwsXG4gICAgICAgICAgY29uc3RzLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gY29uc3RzOiBUQ29uc3RhbnRzfG51bGxcbiAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBpbmNvbXBsZXRlRmlyc3RQYXNzOiBib29sZWFuXG4gICAgICAgICAgZGVjbHMsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmdEZXZNb2RlIG9ubHk6IGRlY2xzXG4gICAgICAgICAgdmFycywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmdEZXZNb2RlIG9ubHk6IHZhcnNcbiAgICAgICAgICApIDpcbiAgICAgIHtcbiAgICAgICAgdHlwZTogdHlwZSxcbiAgICAgICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgICAgICBxdWVyaWVzOiBudWxsLFxuICAgICAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICAgICAgZGVjbFROb2RlOiBkZWNsVE5vZGUsXG4gICAgICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLFxuICAgICAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICAgICAgaG9zdEJpbmRpbmdPcENvZGVzOiBudWxsLFxuICAgICAgICBmaXJzdENyZWF0ZVBhc3M6IHRydWUsXG4gICAgICAgIGZpcnN0VXBkYXRlUGFzczogdHJ1ZSxcbiAgICAgICAgc3RhdGljVmlld1F1ZXJpZXM6IGZhbHNlLFxuICAgICAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgICAgIHByZU9yZGVySG9va3M6IG51bGwsXG4gICAgICAgIHByZU9yZGVyQ2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgdmlld0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICAgICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgICAgICBjbGVhbnVwOiBudWxsLFxuICAgICAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICAgICAgY29tcG9uZW50czogbnVsbCxcbiAgICAgICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICAgICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgICAgIHNjaGVtYXM6IHNjaGVtYXMsXG4gICAgICAgIGNvbnN0czogY29uc3RzLFxuICAgICAgICBpbmNvbXBsZXRlRmlyc3RQYXNzOiBmYWxzZVxuICAgICAgfTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIGl0IGlzIGltcG9ydGFudCB0aGF0IHRoZSB0VmlldyByZXRhaW5zIHRoZSBzYW1lIHNoYXBlIGR1cmluZyBydW50aW1lLlxuICAgIC8vIChUbyBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIGNvZGUgaXMgbW9ub21vcnBoaWMuKSBGb3IgdGhpcyByZWFzb24gd2Ugc2VhbCB0aGUgb2JqZWN0IHRvXG4gICAgLy8gcHJldmVudCBjbGFzcyB0cmFuc2l0aW9ucy5cbiAgICBPYmplY3Quc2VhbCh0Vmlldyk7XG4gIH1cbiAgcmV0dXJuIHRWaWV3O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IGJsdWVwcmludCA9IG5nRGV2TW9kZSA/IG5ldyBMVmlld0JsdWVwcmludCgpIDogW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsVmlld0xlbmd0aDsgaSsrKSB7XG4gICAgYmx1ZXByaW50LnB1c2goaSA8IGJpbmRpbmdTdGFydEluZGV4ID8gbnVsbCA6IE5PX0NIQU5HRSk7XG4gIH1cblxuICByZXR1cm4gYmx1ZXByaW50IGFzIExWaWV3O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlckZhY3RvcnkgRmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgcmVuZGVyZXIgaW5zdGFuY2UuXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbmNhcHN1bGF0aW9uIFZpZXcgRW5jYXBzdWxhdGlvbiBkZWZpbmVkIGZvciBjb21wb25lbnQgdGhhdCByZXF1ZXN0cyBob3N0IGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudHxzdHJpbmcsXG4gICAgZW5jYXBzdWxhdGlvbjogVmlld0VuY2Fwc3VsYXRpb24pOiBSRWxlbWVudCB7XG4gIC8vIFdoZW4gdXNpbmcgbmF0aXZlIFNoYWRvdyBET00sIGRvIG5vdCBjbGVhciBob3N0IGVsZW1lbnQgdG8gYWxsb3cgbmF0aXZlIHNsb3QgcHJvamVjdGlvblxuICBjb25zdCBwcmVzZXJ2ZUNvbnRlbnQgPSBlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb207XG4gIHJldHVybiByZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvciwgcHJlc2VydmVDb250ZW50KTtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGNhbiBhbHNvIGJlIHVzZWQgdG8gc3RvcmUgaW5zdGFuY2Ugc3BlY2lmaWMgY2xlYW51cCBmbnMuIEluIHRoYXQgY2FzZSB0aGUgYGNvbnRleHRgXG4gKiBpcyBgbnVsbGAgYW5kIHRoZSBmdW5jdGlvbiBpcyBzdG9yZSBpbiBgTFZpZXdgIChyYXRoZXIgdGhhbiBpdCBgVFZpZXdgKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRPckNyZWF0ZUxWaWV3Q2xlYW51cChsVmlldyk7XG4gIGlmIChjb250ZXh0ID09PSBudWxsKSB7XG4gICAgLy8gSWYgY29udGV4dCBpcyBudWxsIHRoYXQgdGhpcyBpcyBpbnN0YW5jZSBzcGVjaWZpYyBjYWxsYmFjay4gVGhlc2UgY2FsbGJhY2tzIGNhbiBvbmx5IGJlXG4gICAgLy8gaW5zZXJ0ZWQgYWZ0ZXIgdGVtcGxhdGUgc2hhcmVkIGluc3RhbmNlcy4gRm9yIHRoaXMgcmVhc29uIGluIG5nRGV2TW9kZSB3ZSBmcmVlemUgdGhlIFRWaWV3LlxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIE9iamVjdC5mcmVlemUoZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpKTtcbiAgICB9XG4gICAgbENsZWFudXAucHVzaChjbGVhbnVwRm4pO1xuICB9IGVsc2Uge1xuICAgIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgICBnZXRPckNyZWF0ZVRWaWV3Q2xlYW51cCh0VmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoaXMgYFROb2RlYCBiZWxvbmdzICh1c2VkIG9ubHkgaW4gYG5nRGV2TW9kZWApXG4gKiBAcGFyYW0gdFBhcmVudCBQYXJlbnQgYFROb2RlYFxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lcixcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUQ29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudHxUTm9kZVR5cGUuVGV4dCxcbiAgICBpbmRleDogbnVtYmVyLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5JY3UsIGluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEljdUNvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZSwgaW5kZXg6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGluZGV4OiBudW1iZXIsXG4gICAgdmFsdWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFROb2RlIHtcbiAgbmdEZXZNb2RlICYmIGluZGV4ICE9PSAwICYmICAvLyAwIGFyZSBib2d1cyBub2RlcyBhbmQgdGhleSBhcmUgT0suIFNlZSBgY3JlYXRlQ29udGFpbmVyUmVmYCBpblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGB2aWV3X2VuZ2luZV9jb21wYXRpYmlsaXR5YCBmb3IgYWRkaXRpb25hbCBjb250ZXh0LlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGluZGV4LCBIRUFERVJfT0ZGU0VULCAnVE5vZGVzIGNhblxcJ3QgYmUgaW4gdGhlIExWaWV3IGhlYWRlci4nKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUoYXR0cnMsIHVuZGVmaW5lZCwgJ1xcJ3VuZGVmaW5lZFxcJyBpcyBub3QgdmFsaWQgdmFsdWUgZm9yIFxcJ2F0dHJzXFwnJyk7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgbmdEZXZNb2RlICYmIHRQYXJlbnQgJiYgYXNzZXJ0VE5vZGVGb3JUVmlldyh0UGFyZW50LCB0Vmlldyk7XG4gIGxldCBpbmplY3RvckluZGV4ID0gdFBhcmVudCA/IHRQYXJlbnQuaW5qZWN0b3JJbmRleCA6IC0xO1xuICBjb25zdCB0Tm9kZSA9IG5nRGV2TW9kZSA/XG4gICAgICBuZXcgVE5vZGVEZWJ1ZyhcbiAgICAgICAgICB0VmlldywgICAgICAgICAgLy8gdFZpZXdfOiBUVmlld1xuICAgICAgICAgIHR5cGUsICAgICAgICAgICAvLyB0eXBlOiBUTm9kZVR5cGVcbiAgICAgICAgICBpbmRleCwgICAgICAgICAgLy8gaW5kZXg6IG51bWJlclxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBpbnNlcnRCZWZvcmVJbmRleDogbnVsbHwtMXxudW1iZXJ8bnVtYmVyW11cbiAgICAgICAgICBpbmplY3RvckluZGV4LCAgLy8gaW5qZWN0b3JJbmRleDogbnVtYmVyXG4gICAgICAgICAgLTEsICAgICAgICAgICAgIC8vIGRpcmVjdGl2ZVN0YXJ0OiBudW1iZXJcbiAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlRW5kOiBudW1iZXJcbiAgICAgICAgICAtMSwgICAgICAgICAgICAgLy8gZGlyZWN0aXZlU3R5bGluZ0xhc3Q6IG51bWJlclxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9wZXJ0eUJpbmRpbmdzOiBudW1iZXJbXXxudWxsXG4gICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIGZsYWdzOiBUTm9kZUZsYWdzXG4gICAgICAgICAgMCwgICAgICAgICAgICAgIC8vIHByb3ZpZGVySW5kZXhlczogVE5vZGVQcm92aWRlckluZGV4ZXNcbiAgICAgICAgICB2YWx1ZSwgICAgICAgICAgLy8gdmFsdWU6IHN0cmluZ3xudWxsXG4gICAgICAgICAgYXR0cnMsICAgICAgICAgIC8vIGF0dHJzOiAoc3RyaW5nfEF0dHJpYnV0ZU1hcmtlcnwoc3RyaW5nfFNlbGVjdG9yRmxhZ3MpW10pW118bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBtZXJnZWRBdHRyc1xuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXXxudWxsXG4gICAgICAgICAgdW5kZWZpbmVkLCAgICAgIC8vIGluaXRpYWxJbnB1dHM6IChzdHJpbmdbXXxudWxsKVtdfG51bGx8dW5kZWZpbmVkXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIGlucHV0czogUHJvcGVydHlBbGlhc2VzfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gb3V0cHV0czogUHJvcGVydHlBbGlhc2VzfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gdFZpZXdzOiBJVFZpZXd8SVRWaWV3W118bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBuZXh0OiBJVE5vZGV8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBwcm9qZWN0aW9uTmV4dDogSVROb2RlfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gY2hpbGQ6IElUTm9kZXxudWxsXG4gICAgICAgICAgdFBhcmVudCwgICAgICAgIC8vIHBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gcHJvamVjdGlvbjogbnVtYmVyfChJVE5vZGV8Uk5vZGVbXSlbXXxudWxsXG4gICAgICAgICAgbnVsbCwgICAgICAgICAgIC8vIHN0eWxlczogc3RyaW5nfG51bGxcbiAgICAgICAgICBudWxsLCAgICAgICAgICAgLy8gc3R5bGVzV2l0aG91dEhvc3Q6IHN0cmluZ3xudWxsXG4gICAgICAgICAgdW5kZWZpbmVkLCAgICAgIC8vIHJlc2lkdWFsU3R5bGVzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBjbGFzc2VzOiBzdHJpbmd8bnVsbFxuICAgICAgICAgIG51bGwsICAgICAgICAgICAvLyBjbGFzc2VzV2l0aG91dEhvc3Q6IHN0cmluZ3xudWxsXG4gICAgICAgICAgdW5kZWZpbmVkLCAgICAgIC8vIHJlc2lkdWFsQ2xhc3Nlczogc3RyaW5nfG51bGxcbiAgICAgICAgICAwIGFzIGFueSwgICAgICAgLy8gY2xhc3NCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcbiAgICAgICAgICAwIGFzIGFueSwgICAgICAgLy8gc3R5bGVCaW5kaW5nczogVFN0eWxpbmdSYW5nZTtcbiAgICAgICAgICApIDpcbiAgICAgIHtcbiAgICAgICAgdHlwZSxcbiAgICAgICAgaW5kZXgsXG4gICAgICAgIGluc2VydEJlZm9yZUluZGV4OiBudWxsLFxuICAgICAgICBpbmplY3RvckluZGV4LFxuICAgICAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiAtMSxcbiAgICAgICAgcHJvcGVydHlCaW5kaW5nczogbnVsbCxcbiAgICAgICAgZmxhZ3M6IDAsXG4gICAgICAgIHByb3ZpZGVySW5kZXhlczogMCxcbiAgICAgICAgdmFsdWU6IHZhbHVlLFxuICAgICAgICBhdHRyczogYXR0cnMsXG4gICAgICAgIG1lcmdlZEF0dHJzOiBudWxsLFxuICAgICAgICBsb2NhbE5hbWVzOiBudWxsLFxuICAgICAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgICAgIGlucHV0czogbnVsbCxcbiAgICAgICAgb3V0cHV0czogbnVsbCxcbiAgICAgICAgdFZpZXdzOiBudWxsLFxuICAgICAgICBuZXh0OiBudWxsLFxuICAgICAgICBwcm9qZWN0aW9uTmV4dDogbnVsbCxcbiAgICAgICAgY2hpbGQ6IG51bGwsXG4gICAgICAgIHBhcmVudDogdFBhcmVudCxcbiAgICAgICAgcHJvamVjdGlvbjogbnVsbCxcbiAgICAgICAgc3R5bGVzOiBudWxsLFxuICAgICAgICBzdHlsZXNXaXRob3V0SG9zdDogbnVsbCxcbiAgICAgICAgcmVzaWR1YWxTdHlsZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgY2xhc3NlczogbnVsbCxcbiAgICAgICAgY2xhc3Nlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgICAgICByZXNpZHVhbENsYXNzZXM6IHVuZGVmaW5lZCxcbiAgICAgICAgY2xhc3NCaW5kaW5nczogMCBhcyBhbnksXG4gICAgICAgIHN0eWxlQmluZGluZ3M6IDAgYXMgYW55LFxuICAgICAgfTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIGl0IGlzIGltcG9ydGFudCB0aGF0IHRoZSB0Tm9kZSByZXRhaW5zIHRoZSBzYW1lIHNoYXBlIGR1cmluZyBydW50aW1lLlxuICAgIC8vIChUbyBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIGNvZGUgaXMgbW9ub21vcnBoaWMuKSBGb3IgdGhpcyByZWFzb24gd2Ugc2VhbCB0aGUgb2JqZWN0IHRvXG4gICAgLy8gcHJldmVudCBjbGFzcyB0cmFuc2l0aW9ucy5cbiAgICBPYmplY3Quc2VhbCh0Tm9kZSk7XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5cbmZ1bmN0aW9uIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKFxuICAgIGlucHV0QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSwgZGlyZWN0aXZlRGVmSWR4OiBudW1iZXIsXG4gICAgcHJvcFN0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCk6IFByb3BlcnR5QWxpYXNlc3xudWxsIHtcbiAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBpbnB1dEFsaWFzTWFwKSB7XG4gICAgaWYgKGlucHV0QWxpYXNNYXAuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSkpIHtcbiAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSA9PT0gbnVsbCA/IHt9IDogcHJvcFN0b3JlO1xuICAgICAgY29uc3QgaW50ZXJuYWxOYW1lID0gaW5wdXRBbGlhc01hcFtwdWJsaWNOYW1lXTtcblxuICAgICAgaWYgKHByb3BTdG9yZS5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChkaXJlY3RpdmVEZWZJZHgsIGludGVybmFsTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZURlZklkeCwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IHRWaWV3RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsSW5wdXRzKCkgOiBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlld0RhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlSW5wdXRzID0gZGlyZWN0aXZlRGVmLmlucHV0cztcbiAgICAvLyBEbyBub3QgdXNlIHVuYm91bmQgYXR0cmlidXRlcyBhcyBpbnB1dHMgdG8gc3RydWN0dXJhbCBkaXJlY3RpdmVzLCBzaW5jZSBzdHJ1Y3R1cmFsXG4gICAgLy8gZGlyZWN0aXZlIGlucHV0cyBjYW4gb25seSBiZSBzZXQgdXNpbmcgbWljcm9zeW50YXggKGUuZy4gYDxkaXYgKmRpcj1cImV4cFwiPmApLlxuICAgIC8vIFRPRE8oRlctMTkzMCk6IG1pY3Jvc3ludGF4IGV4cHJlc3Npb25zIG1heSBhbHNvIGNvbnRhaW4gdW5ib3VuZC9zdGF0aWMgYXR0cmlidXRlcywgd2hpY2hcbiAgICAvLyBzaG91bGQgYmUgc2V0IGZvciBpbmxpbmUgdGVtcGxhdGVzLlxuICAgIGNvbnN0IGluaXRpYWxJbnB1dHMgPSAodE5vZGVBdHRycyAhPT0gbnVsbCAmJiAhaXNJbmxpbmVUZW1wbGF0ZSh0Tm9kZSkpID9cbiAgICAgICAgZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUlucHV0cywgdE5vZGVBdHRycykgOlxuICAgICAgICBudWxsO1xuICAgIGlucHV0c0Zyb21BdHRycy5wdXNoKGluaXRpYWxJbnB1dHMpO1xuICAgIGlucHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlSW5wdXRzLCBpLCBpbnB1dHNTdG9yZSk7XG4gICAgb3V0cHV0c1N0b3JlID0gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXMoZGlyZWN0aXZlRGVmLm91dHB1dHMsIGksIG91dHB1dHNTdG9yZSk7XG4gIH1cblxuICBpZiAoaW5wdXRzU3RvcmUgIT09IG51bGwpIHtcbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ2NsYXNzJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ2xhc3NJbnB1dDtcbiAgICB9XG4gICAgaWYgKGlucHV0c1N0b3JlLmhhc093blByb3BlcnR5KCdzdHlsZScpKSB7XG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc1N0eWxlSW5wdXQ7XG4gICAgfVxuICB9XG5cbiAgdE5vZGUuaW5pdGlhbElucHV0cyA9IGlucHV0c0Zyb21BdHRycztcbiAgdE5vZGUuaW5wdXRzID0gaW5wdXRzU3RvcmU7XG4gIHROb2RlLm91dHB1dHMgPSBvdXRwdXRzU3RvcmU7XG59XG5cbi8qKlxuICogTWFwcGluZyBiZXR3ZWVuIGF0dHJpYnV0ZXMgbmFtZXMgdGhhdCBkb24ndCBjb3JyZXNwb25kIHRvIHRoZWlyIGVsZW1lbnQgcHJvcGVydHkgbmFtZXMuXG4gKlxuICogUGVyZm9ybWFuY2Ugbm90ZTogdGhpcyBmdW5jdGlvbiBpcyB3cml0dGVuIGFzIGEgc2VyaWVzIG9mIGlmIGNoZWNrcyAoaW5zdGVhZCBvZiwgc2F5LCBhIHByb3BlcnR5XG4gKiBvYmplY3QgbG9va3VwKSBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAtIHRoZSBzZXJpZXMgb2YgYGlmYCBjaGVja3Mgc2VlbXMgdG8gYmUgdGhlIGZhc3Rlc3Qgd2F5IG9mXG4gKiBtYXBwaW5nIHByb3BlcnR5IG5hbWVzLiBEbyBOT1QgY2hhbmdlIHdpdGhvdXQgYmVuY2htYXJraW5nLlxuICpcbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5mdW5jdGlvbiBtYXBQcm9wTmFtZShuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAobmFtZSA9PT0gJ2NsYXNzJykgcmV0dXJuICdjbGFzc05hbWUnO1xuICBpZiAobmFtZSA9PT0gJ2ZvcicpIHJldHVybiAnaHRtbEZvcic7XG4gIGlmIChuYW1lID09PSAnZm9ybWFjdGlvbicpIHJldHVybiAnZm9ybUFjdGlvbic7XG4gIGlmIChuYW1lID09PSAnaW5uZXJIdG1sJykgcmV0dXJuICdpbm5lckhUTUwnO1xuICBpZiAobmFtZSA9PT0gJ3JlYWRvbmx5JykgcmV0dXJuICdyZWFkT25seSc7XG4gIGlmIChuYW1lID09PSAndGFiaW5kZXgnKSByZXR1cm4gJ3RhYkluZGV4JztcbiAgcmV0dXJuIG5hbWU7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50UHJvcGVydHlJbnRlcm5hbDxUPihcbiAgICB0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB2YWx1ZTogVCwgcmVuZGVyZXI6IFJlbmRlcmVyLFxuICAgIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsIG5hdGl2ZU9ubHk6IGJvb2xlYW4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50IHwgUkNvbW1lbnQ7XG4gIGxldCBpbnB1dERhdGEgPSB0Tm9kZS5pbnB1dHM7XG4gIGxldCBkYXRhVmFsdWU6IFByb3BlcnR5QWxpYXNWYWx1ZXx1bmRlZmluZWQ7XG4gIGlmICghbmF0aXZlT25seSAmJiBpbnB1dERhdGEgIT0gbnVsbCAmJiAoZGF0YVZhbHVlID0gaW5wdXREYXRhW3Byb3BOYW1lXSkpIHtcbiAgICBzZXRJbnB1dHNGb3JQcm9wZXJ0eSh0VmlldywgbFZpZXcsIGRhdGFWYWx1ZSwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkgbWFya0RpcnR5SWZPblB1c2gobFZpZXcsIHROb2RlLmluZGV4KTtcbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKGxWaWV3LCBlbGVtZW50LCB0Tm9kZS50eXBlLCBkYXRhVmFsdWUsIHZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgIHByb3BOYW1lID0gbWFwUHJvcE5hbWUocHJvcE5hbWUpO1xuXG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzKHByb3BOYW1lKTtcbiAgICAgIGlmICghaXNQcm9wZXJ0eVZhbGlkKGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZS52YWx1ZSwgdFZpZXcuc2NoZW1hcykpIHtcbiAgICAgICAgaGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Tm9kZS50eXBlLCBsVmlldyk7XG4gICAgICB9XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZVxuICAgIC8vIHByb3BlcnR5IGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudmFsdWUgfHwgJycsIHByb3BOYW1lKSBhcyBhbnkpIDogdmFsdWU7XG4gICAgcmVuZGVyZXIuc2V0UHJvcGVydHkoZWxlbWVudCBhcyBSRWxlbWVudCwgcHJvcE5hbWUsIHZhbHVlKTtcbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueUNvbnRhaW5lcikge1xuICAgIC8vIElmIHRoZSBub2RlIGlzIGEgY29udGFpbmVyIGFuZCB0aGUgcHJvcGVydHkgZGlkbid0XG4gICAgLy8gbWF0Y2ggYW55IG9mIHRoZSBpbnB1dHMgb3Igc2NoZW1hcyB3ZSBzaG91bGQgdGhyb3cuXG4gICAgaWYgKG5nRGV2TW9kZSAmJiAhbWF0Y2hpbmdTY2hlbWFzKHRWaWV3LnNjaGVtYXMsIHROb2RlLnZhbHVlKSkge1xuICAgICAgaGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Tm9kZS50eXBlLCBsVmlldyk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBJZiBub2RlIGlzIGFuIE9uUHVzaCBjb21wb25lbnQsIG1hcmtzIGl0cyBMVmlldyBkaXJ0eS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodmlld0luZGV4LCBsVmlldyk7XG4gIGlmICghKGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5DaGVja0Fsd2F5cykpIHtcbiAgICBjaGlsZENvbXBvbmVudExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgYXR0ck5hbWU6IHN0cmluZywgdmFsdWU6IGFueSkge1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgYXR0ck5hbWUgPSBub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lKGF0dHJOYW1lKTtcbiAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgaWYgKHR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID1cbiAgICAgICAgZXNjYXBlQ29tbWVudFRleHQoYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gKTtcbiAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHRleHRDb250ZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50fFJDb21tZW50LCB0eXBlOiBUTm9kZVR5cGUsIGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlLFxuICAgIHZhbHVlOiBhbnkpIHtcbiAgaWYgKHR5cGUgJiAoVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkNvbnRhaW5lcikpIHtcbiAgICAvKipcbiAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICogaSswOiBkaXJlY3RpdmUgaW5zdGFuY2UgaW5kZXhcbiAgICAgKiBpKzE6IHByaXZhdGVOYW1lXG4gICAgICpcbiAgICAgKiBlLmcuIFswLCAnY2hhbmdlJywgJ2NoYW5nZS1taW5pZmllZCddXG4gICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMV1cbiAgICAgKi9cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGFWYWx1ZS5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHR5cGUsIGRhdGFWYWx1ZVtpICsgMV0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbnRpYXRlUm9vdENvbXBvbmVudDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0Q3VycmVudFROb2RlKCkhO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgY29uc3QgZGlyZWN0aXZlSW5kZXggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCAxLCBudWxsKTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBkaXJlY3RpdmVJbmRleCwgcm9vdFROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgJ0JlY2F1c2UgdGhpcyBpcyBhIHJvb3QgY29tcG9uZW50IHRoZSBhbGxvY2F0ZWQgZXhwYW5kbyBzaG91bGQgbWF0Y2ggdGhlIFROb2RlIGNvbXBvbmVudC4nKTtcbiAgICBjb25maWd1cmVWaWV3V2l0aERpcmVjdGl2ZSh0Vmlldywgcm9vdFROb2RlLCBsVmlldywgZGlyZWN0aXZlSW5kZXgsIGRlZik7XG4gICAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0Vmlldywgcm9vdFROb2RlKTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPVxuICAgICAgZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIHRWaWV3LCByb290VE5vZGUuZGlyZWN0aXZlU3RhcnQsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocm9vdFROb2RlLCBsVmlldyk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCk6IGJvb2xlYW4ge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBsZXQgaGFzRGlyZWN0aXZlcyA9IGZhbHNlO1xuICBpZiAoZ2V0QmluZGluZ3NFbmFibGVkKCkpIHtcbiAgICBjb25zdCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwgPSBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG5cbiAgICBpZiAoZGlyZWN0aXZlRGVmcyAhPT0gbnVsbCkge1xuICAgICAgaGFzRGlyZWN0aXZlcyA9IHRydWU7XG4gICAgICBpbml0VE5vZGVGbGFncyh0Tm9kZSwgdFZpZXcuZGF0YS5sZW5ndGgsIGRpcmVjdGl2ZURlZnMubGVuZ3RoKTtcbiAgICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAgIC8vIHRoZSB2aWV3RW5naW5lOlxuICAgICAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgICAvLyBTbyB0byBtYXRjaCB0aGVzZSBydWxlcywgdGhlIG9yZGVyIGluIHdoaWNoIHByb3ZpZGVycyBhcmUgYWRkZWQgaW4gdGhlIGFycmF5cyBpcyB2ZXJ5XG4gICAgICAvLyBpbXBvcnRhbnQuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZURlZnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlRGVmc1tpXTtcbiAgICAgICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgICB9XG4gICAgICBsZXQgcHJlT3JkZXJIb29rc0ZvdW5kID0gZmFsc2U7XG4gICAgICBsZXQgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSBmYWxzZTtcbiAgICAgIGxldCBkaXJlY3RpdmVJZHggPSBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkaXJlY3RpdmVEZWZzLmxlbmd0aCwgbnVsbCk7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnRTYW1lKFxuICAgICAgICAgICAgICBkaXJlY3RpdmVJZHgsIHROb2RlLmRpcmVjdGl2ZVN0YXJ0LFxuICAgICAgICAgICAgICAnVE5vZGUuZGlyZWN0aXZlU3RhcnQgc2hvdWxkIHBvaW50IHRvIGp1c3QgYWxsb2NhdGVkIHNwYWNlJyk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlRGVmcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVEZWZzW2ldO1xuICAgICAgICAvLyBNZXJnZSB0aGUgYXR0cnMgaW4gdGhlIG9yZGVyIG9mIG1hdGNoZXMuIFRoaXMgYXNzdW1lcyB0aGF0IHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgdGhlXG4gICAgICAgIC8vIGNvbXBvbmVudCBpdHNlbGYsIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgdGhlIGxlYXN0IHByaW9yaXR5LlxuICAgICAgICB0Tm9kZS5tZXJnZWRBdHRycyA9IG1lcmdlSG9zdEF0dHJzKHROb2RlLm1lcmdlZEF0dHJzLCBkZWYuaG9zdEF0dHJzKTtcblxuICAgICAgICBjb25maWd1cmVWaWV3V2l0aERpcmVjdGl2ZSh0VmlldywgdE5vZGUsIGxWaWV3LCBkaXJlY3RpdmVJZHgsIGRlZik7XG4gICAgICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAoZGlyZWN0aXZlSWR4LCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMgIT09IG51bGwpIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzQ29udGVudFF1ZXJ5O1xuICAgICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdEF0dHJzICE9PSBudWxsIHx8IGRlZi5ob3N0VmFycyAhPT0gMClcbiAgICAgICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgICAgICBjb25zdCBsaWZlQ3ljbGVIb29rczogT25DaGFuZ2VzJk9uSW5pdCZEb0NoZWNrID0gZGVmLnR5cGUucHJvdG90eXBlO1xuICAgICAgICAvLyBPbmx5IHB1c2ggYSBub2RlIGluZGV4IGludG8gdGhlIHByZU9yZGVySG9va3MgYXJyYXkgaWYgdGhpcyBpcyB0aGUgZmlyc3RcbiAgICAgICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgICAgICBpZiAoIXByZU9yZGVySG9va3NGb3VuZCAmJlxuICAgICAgICAgICAgKGxpZmVDeWNsZUhvb2tzLm5nT25DaGFuZ2VzIHx8IGxpZmVDeWNsZUhvb2tzLm5nT25Jbml0IHx8IGxpZmVDeWNsZUhvb2tzLm5nRG9DaGVjaykpIHtcbiAgICAgICAgICAvLyBXZSB3aWxsIHB1c2ggdGhlIGFjdHVhbCBob29rIGZ1bmN0aW9uIGludG8gdGhpcyBhcnJheSBsYXRlciBkdXJpbmcgZGlyIGluc3RhbnRpYXRpb24uXG4gICAgICAgICAgLy8gV2UgY2Fubm90IGRvIGl0IG5vdyBiZWNhdXNlIHdlIG11c3QgZW5zdXJlIGhvb2tzIGFyZSByZWdpc3RlcmVkIGluIHRoZSBzYW1lXG4gICAgICAgICAgLy8gb3JkZXIgdGhhdCBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkIChpLmUuIGluamVjdGlvbiBvcmRlcikuXG4gICAgICAgICAgKHRWaWV3LnByZU9yZGVySG9va3MgfHwgKHRWaWV3LnByZU9yZGVySG9va3MgPSBbXSkpLnB1c2godE5vZGUuaW5kZXgpO1xuICAgICAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXByZU9yZGVyQ2hlY2tIb29rc0ZvdW5kICYmIChsaWZlQ3ljbGVIb29rcy5uZ09uQ2hhbmdlcyB8fCBsaWZlQ3ljbGVIb29rcy5uZ0RvQ2hlY2spKSB7XG4gICAgICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyB8fCAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzID0gW10pKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgICAgICBwcmVPcmRlckNoZWNrSG9va3NGb3VuZCA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBkaXJlY3RpdmVJZHgrKztcbiAgICAgIH1cblxuICAgICAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldywgdE5vZGUpO1xuICAgIH1cbiAgICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG4gIH1cbiAgLy8gTWVyZ2UgdGhlIHRlbXBsYXRlIGF0dHJzIGxhc3Qgc28gdGhhdCB0aGV5IGhhdmUgdGhlIGhpZ2hlc3QgcHJpb3JpdHkuXG4gIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIHROb2RlLmF0dHJzKTtcbiAgcmV0dXJuIGhhc0RpcmVjdGl2ZXM7XG59XG5cbi8qKlxuICogQWRkIGBob3N0QmluZGluZ3NgIHRvIHRoZSBgVFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGUgYGhvc3RCaW5kaW5nc2Agc2hvdWxkIGJlIGFkZGVkLlxuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhlIGVsZW1lbnQgd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZVxuICogQHBhcmFtIGxWaWV3IGBMVmlld2AgY3VycmVudCBgTFZpZXdgXG4gKiBAcGFyYW0gZGlyZWN0aXZlSWR4IERpcmVjdGl2ZSBpbmRleCBpbiB2aWV3LlxuICogQHBhcmFtIGRpcmVjdGl2ZVZhcnNJZHggV2hlcmUgd2lsbCB0aGUgZGlyZWN0aXZlJ3MgdmFycyBiZSBzdG9yZWRcbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUlkeDogbnVtYmVyLCBkaXJlY3RpdmVWYXJzSWR4OiBudW1iZXIsXG4gICAgZGVmOiBDb21wb25lbnREZWY8YW55PnxEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBob3N0QmluZGluZ3MgPSBkZWYuaG9zdEJpbmRpbmdzO1xuICBpZiAoaG9zdEJpbmRpbmdzKSB7XG4gICAgbGV0IGhvc3RCaW5kaW5nT3BDb2RlcyA9IHRWaWV3Lmhvc3RCaW5kaW5nT3BDb2RlcztcbiAgICBpZiAoaG9zdEJpbmRpbmdPcENvZGVzID09PSBudWxsKSB7XG4gICAgICBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXMgPSBbXSBhcyBhbnkgYXMgSG9zdEJpbmRpbmdPcENvZGVzO1xuICAgIH1cbiAgICBjb25zdCBlbGVtZW50SW5keCA9IH50Tm9kZS5pbmRleDtcbiAgICBpZiAobGFzdFNlbGVjdGVkRWxlbWVudElkeChob3N0QmluZGluZ09wQ29kZXMpICE9IGVsZW1lbnRJbmR4KSB7XG4gICAgICAvLyBDb25kaXRpb25hbGx5IGFkZCBzZWxlY3QgZWxlbWVudCBzbyB0aGF0IHdlIGFyZSBtb3JlIGVmZmljaWVudCBpbiBleGVjdXRpb24uXG4gICAgICAvLyBOT1RFOiB0aGlzIGlzIHN0cmljdGx5IG5vdCBuZWNlc3NhcnkgYW5kIGl0IHRyYWRlcyBjb2RlIHNpemUgZm9yIHJ1bnRpbWUgcGVyZi5cbiAgICAgIC8vIChXZSBjb3VsZCBqdXN0IGFsd2F5cyBhZGQgaXQuKVxuICAgICAgaG9zdEJpbmRpbmdPcENvZGVzLnB1c2goZWxlbWVudEluZHgpO1xuICAgIH1cbiAgICBob3N0QmluZGluZ09wQ29kZXMucHVzaChkaXJlY3RpdmVJZHgsIGRpcmVjdGl2ZVZhcnNJZHgsIGhvc3RCaW5kaW5ncyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBsYXN0IHNlbGVjdGVkIGVsZW1lbnQgaW5kZXggaW4gdGhlIGBIb3N0QmluZGluZ09wQ29kZXNgXG4gKlxuICogRm9yIHBlcmYgcmVhc29ucyB3ZSBkb24ndCBuZWVkIHRvIHVwZGF0ZSB0aGUgc2VsZWN0ZWQgZWxlbWVudCBpbmRleCBpbiBgSG9zdEJpbmRpbmdPcENvZGVzYCBvbmx5XG4gKiBpZiBpdCBjaGFuZ2VzLiBUaGlzIG1ldGhvZCByZXR1cm5zIHRoZSBsYXN0IGluZGV4IChvciAnMCcgaWYgbm90IGZvdW5kLilcbiAqXG4gKiBTZWxlY3RlZCBlbGVtZW50IGluZGV4IGFyZSBvbmx5IHRoZSBvbmVzIHdoaWNoIGFyZSBuZWdhdGl2ZS5cbiAqL1xuZnVuY3Rpb24gbGFzdFNlbGVjdGVkRWxlbWVudElkeChob3N0QmluZGluZ09wQ29kZXM6IEhvc3RCaW5kaW5nT3BDb2Rlcyk6IG51bWJlciB7XG4gIGxldCBpID0gaG9zdEJpbmRpbmdPcENvZGVzLmxlbmd0aDtcbiAgd2hpbGUgKGkgPiAwKSB7XG4gICAgY29uc3QgdmFsdWUgPSBob3N0QmluZGluZ09wQ29kZXNbLS1pXTtcbiAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJyAmJiB2YWx1ZSA8IDApIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cblxuLyoqXG4gKiBJbnN0YW50aWF0ZSBhbGwgdGhlIGRpcmVjdGl2ZXMgdGhhdCB3ZXJlIHByZXZpb3VzbHkgcmVzb2x2ZWQgb24gdGhlIGN1cnJlbnQgbm9kZS5cbiAqL1xuZnVuY3Rpb24gaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLCBuYXRpdmU6IFJOb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGlzQ29tcG9uZW50ID0gaXNDb21wb25lbnREZWYoZGVmKTtcblxuICAgIGlmIChpc0NvbXBvbmVudCkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlKTtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKGxWaWV3LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuXG4gICAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIHRWaWV3LCBpLCB0Tm9kZSk7XG4gICAgYXR0YWNoUGF0Y2hEYXRhKGRpcmVjdGl2ZSwgbFZpZXcpO1xuXG4gICAgaWYgKGluaXRpYWxJbnB1dHMgIT09IG51bGwpIHtcbiAgICAgIHNldElucHV0c0Zyb21BdHRycyhsVmlldywgaSAtIHN0YXJ0LCBkaXJlY3RpdmUsIGRlZiwgdE5vZGUsIGluaXRpYWxJbnB1dHMhKTtcbiAgICB9XG5cbiAgICBpZiAoaXNDb21wb25lbnQpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUpOiBEaXJlY3RpdmVEZWY8YW55PltdfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueVJOb2RlIHwgVE5vZGVUeXBlLkFueUNvbnRhaW5lcik7XG5cbiAgY29uc3QgcmVnaXN0cnkgPSB0Vmlldy5kaXJlY3RpdmVSZWdpc3RyeTtcbiAgbGV0IG1hdGNoZXM6IGFueVtdfG51bGwgPSBudWxsO1xuICBpZiAocmVnaXN0cnkpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHJlZ2lzdHJ5Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSByZWdpc3RyeVtpXSBhcyBDb21wb25lbnREZWY8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3QodE5vZGUsIGRlZi5zZWxlY3RvcnMhLCAvKiBpc1Byb2plY3Rpb25Nb2RlICovIGZhbHNlKSkge1xuICAgICAgICBtYXRjaGVzIHx8IChtYXRjaGVzID0gbmdEZXZNb2RlID8gbmV3IE1hdGNoZXNBcnJheSgpIDogW10pO1xuICAgICAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCB2aWV3RGF0YSksIHRWaWV3LCBkZWYudHlwZSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICAgICAgICAgIGBcIiR7dE5vZGUudmFsdWV9XCIgdGFncyBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgaG9zdHMuIGAgK1xuICAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHVzZSBhIGRpZmZlcmVudCB0YWcgdG8gYWN0aXZhdGUgdGhlICR7c3RyaW5naWZ5KGRlZi50eXBlKX0gY29tcG9uZW50LmApO1xuXG4gICAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50SG9zdCkge1xuICAgICAgICAgICAgICAvLyBJZiBhbm90aGVyIGNvbXBvbmVudCBoYXMgYmVlbiBtYXRjaGVkIHByZXZpb3VzbHksIGl0J3MgdGhlIGZpcnN0IGVsZW1lbnQgaW4gdGhlXG4gICAgICAgICAgICAgIC8vIGBtYXRjaGVzYCBhcnJheSwgc2VlIGhvdyB3ZSBzdG9yZSBjb21wb25lbnRzL2RpcmVjdGl2ZXMgaW4gYG1hdGNoZXNgIGJlbG93LlxuICAgICAgICAgICAgICB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUsIG1hdGNoZXNbMF0udHlwZSwgZGVmLnR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSk7XG4gICAgICAgICAgLy8gVGhlIGNvbXBvbmVudCBpcyBhbHdheXMgc3RvcmVkIGZpcnN0IHdpdGggZGlyZWN0aXZlcyBhZnRlci5cbiAgICAgICAgICBtYXRjaGVzLnVuc2hpZnQoZGVmKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcztcbn1cblxuLyoqXG4gKiBNYXJrcyBhIGdpdmVuIFROb2RlIGFzIGEgY29tcG9uZW50J3MgaG9zdC4gVGhpcyBjb25zaXN0cyBvZjpcbiAqIC0gc2V0dGluZyBhcHByb3ByaWF0ZSBUTm9kZSBmbGFncztcbiAqIC0gc3RvcmluZyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgaG9zdFROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNDb21wb25lbnRIb3N0O1xuICAodFZpZXcuY29tcG9uZW50cyB8fCAodFZpZXcuY29tcG9uZW50cyA9IG5nRGV2TW9kZSA/IG5ldyBUVmlld0NvbXBvbmVudHMoKSA6IFtdKSlcbiAgICAgIC5wdXNoKGhvc3RUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVMb2NhbE5hbWVzKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuRVhQT1JUX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gZGlyZWN0aXZlSWR4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkgZXhwb3J0c01hcFsnJ10gPSBkaXJlY3RpdmVJZHg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0dXAgZGlyZWN0aXZlIGZvciBpbnN0YW50aWF0aW9uLlxuICpcbiAqIFdlIG5lZWQgdG8gY3JlYXRlIGEgYE5vZGVJbmplY3RvckZhY3RvcnlgIHdoaWNoIGlzIHRoZW4gaW5zZXJ0ZWQgaW4gYm90aCB0aGUgYEJsdWVwcmludGAgYXMgd2VsbFxuICogYXMgYExWaWV3YC4gYFRWaWV3YCBnZXRzIHRoZSBgRGlyZWN0aXZlRGVmYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YFxuICogQHBhcmFtIHROb2RlIGBUTm9kZWBcbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggd2hlcmUgdGhlIGRpcmVjdGl2ZSB3aWxsIGJlIHN0b3JlZCBpbiB0aGUgRXhwYW5kby5cbiAqIEBwYXJhbSBkZWYgYERpcmVjdGl2ZURlZmBcbiAqL1xuZnVuY3Rpb24gY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoZGlyZWN0aXZlSW5kZXgsIEhFQURFUl9PRkZTRVQsICdNdXN0IGJlIGluIEV4cGFuZG8gc2VjdGlvbicpO1xuICB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSA9IGRlZjtcbiAgY29uc3QgZGlyZWN0aXZlRmFjdG9yeSA9XG4gICAgICBkZWYuZmFjdG9yeSB8fCAoKGRlZiBhcyB7ZmFjdG9yeTogRnVuY3Rpb259KS5mYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWYudHlwZSwgdHJ1ZSkpO1xuICAvLyBFdmVuIHRob3VnaCBgZGlyZWN0aXZlRmFjdG9yeWAgd2lsbCBhbHJlYWR5IGJlIHVzaW5nIGDJtcm1ZGlyZWN0aXZlSW5qZWN0YCBpbiBpdHMgZ2VuZXJhdGVkIGNvZGUsXG4gIC8vIHdlIGFsc28gd2FudCB0byBzdXBwb3J0IGBpbmplY3QoKWAgZGlyZWN0bHkgZnJvbSB0aGUgZGlyZWN0aXZlIGNvbnN0cnVjdG9yIGNvbnRleHQgc28gd2Ugc2V0XG4gIC8vIGDJtcm1ZGlyZWN0aXZlSW5qZWN0YCBhcyB0aGUgaW5qZWN0IGltcGxlbWVudGF0aW9uIGhlcmUgdG9vLlxuICBjb25zdCBub2RlSW5qZWN0b3JGYWN0b3J5ID1cbiAgICAgIG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICB0Vmlldy5ibHVlcHJpbnRbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcbiAgbFZpZXdbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcblxuICByZWdpc3Rlckhvc3RCaW5kaW5nT3BDb2RlcyhcbiAgICAgIHRWaWV3LCB0Tm9kZSwgbFZpZXcsIGRpcmVjdGl2ZUluZGV4LCBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkZWYuaG9zdFZhcnMsIE5PX0NIQU5HRSksXG4gICAgICBkZWYpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihsVmlldzogTFZpZXcsIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlLCBkZWY6IENvbXBvbmVudERlZjxUPik6IHZvaWQge1xuICBjb25zdCBuYXRpdmUgPSBnZXROYXRpdmVCeVROb2RlKGhvc3RUTm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVENvbXBvbmVudFZpZXcoZGVmKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsXG4gICAgICBjcmVhdGVMVmlldyhcbiAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cywgbmF0aXZlLFxuICAgICAgICAgIGhvc3RUTm9kZSBhcyBURWxlbWVudE5vZGUsIHJlbmRlcmVyRmFjdG9yeSwgcmVuZGVyZXJGYWN0b3J5LmNyZWF0ZVJlbmRlcmVyKG5hdGl2ZSwgZGVmKSxcbiAgICAgICAgICBudWxsLCBudWxsLCBudWxsKSk7XG5cbiAgLy8gQ29tcG9uZW50IHZpZXcgd2lsbCBhbHdheXMgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGluamVjdGVkIExDb250YWluZXJzLFxuICAvLyBzbyB0aGlzIGlzIGEgcmVndWxhciBlbGVtZW50LCB3cmFwIGl0IHdpdGggdGhlIGNvbXBvbmVudCB2aWV3XG4gIGxWaWV3W2hvc3RUTm9kZS5pbmRleF0gPSBjb21wb25lbnRWaWV3O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudEF0dHJpYnV0ZUludGVybmFsKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQsXG4gICAgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQpIHtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcyhuYW1lKTtcbiAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgIHROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCxcbiAgICAgICAgYEF0dGVtcHRlZCB0byBzZXQgYXR0cmlidXRlIFxcYCR7bmFtZX1cXGAgb24gYSBjb250YWluZXIgbm9kZS4gYCArXG4gICAgICAgICAgICBgSG9zdCBiaW5kaW5ncyBhcmUgbm90IHZhbGlkIG9uIG5nLWNvbnRhaW5lciBvciBuZy10ZW1wbGF0ZS5gKTtcbiAgfVxuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBzZXRFbGVtZW50QXR0cmlidXRlKGxWaWV3W1JFTkRFUkVSXSwgZWxlbWVudCwgbmFtZXNwYWNlLCB0Tm9kZS52YWx1ZSwgbmFtZSwgdmFsdWUsIHNhbml0aXplcik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRFbGVtZW50QXR0cmlidXRlKFxuICAgIHJlbmRlcmVyOiBSZW5kZXJlciwgZWxlbWVudDogUkVsZW1lbnQsIG5hbWVzcGFjZTogc3RyaW5nfG51bGx8dW5kZWZpbmVkLCB0YWdOYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBuYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnksIHNhbml0aXplcjogU2FuaXRpemVyRm58bnVsbHx1bmRlZmluZWQpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSk7XG4gIH0gZWxzZSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldEF0dHJpYnV0ZSsrO1xuICAgIGNvbnN0IHN0clZhbHVlID1cbiAgICAgICAgc2FuaXRpemVyID09IG51bGwgPyByZW5kZXJTdHJpbmdpZnkodmFsdWUpIDogc2FuaXRpemVyKHZhbHVlLCB0YWdOYW1lIHx8ICcnLCBuYW1lKTtcblxuXG4gICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIHN0clZhbHVlIGFzIHN0cmluZywgbmFtZXNwYWNlKTtcbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IExWaWV3IHRoYXQgaXMgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgaW4gZGlyZWN0aXZlcyBhcnJheVxuICogQHBhcmFtIGluc3RhbmNlIEluc3RhbmNlIG9mIHRoZSBkaXJlY3RpdmUgb24gd2hpY2ggdG8gc2V0IHRoZSBpbml0aWFsIGlucHV0c1xuICogQHBhcmFtIGRlZiBUaGUgZGlyZWN0aXZlIGRlZiB0aGF0IGNvbnRhaW5zIHRoZSBsaXN0IG9mIGlucHV0c1xuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBmb3IgdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIHNldElucHV0c0Zyb21BdHRyczxUPihcbiAgICBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgdE5vZGU6IFROb2RlLFxuICAgIGluaXRpYWxJbnB1dERhdGE6IEluaXRpYWxJbnB1dERhdGEpOiB2b2lkIHtcbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YSFbZGlyZWN0aXZlSW5kZXhdO1xuICBpZiAoaW5pdGlhbElucHV0cyAhPT0gbnVsbCkge1xuICAgIGNvbnN0IHNldElucHV0ID0gZGVmLnNldElucHV0O1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbElucHV0cy5sZW5ndGg7KSB7XG4gICAgICBjb25zdCBwdWJsaWNOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCB2YWx1ZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGlmIChzZXRJbnB1dCAhPT0gbnVsbCkge1xuICAgICAgICBkZWYuc2V0SW5wdXQhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGluc3RhbmNlIGFzIGFueSlbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gICAgICAgIHNldE5nUmVmbGVjdFByb3BlcnR5KGxWaWV3LCBuYXRpdmVFbGVtZW50LCB0Tm9kZS50eXBlLCBwcml2YXRlTmFtZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdlbmVyYXRlcyBpbml0aWFsSW5wdXREYXRhIGZvciBhIG5vZGUgYW5kIHN0b3JlcyBpdCBpbiB0aGUgdGVtcGxhdGUncyBzdGF0aWMgc3RvcmFnZVxuICogc28gc3Vic2VxdWVudCB0ZW1wbGF0ZSBpbnZvY2F0aW9ucyBkb24ndCBoYXZlIHRvIHJlY2FsY3VsYXRlIGl0LlxuICpcbiAqIGluaXRpYWxJbnB1dERhdGEgaXMgYW4gYXJyYXkgY29udGFpbmluZyB2YWx1ZXMgdGhhdCBuZWVkIHRvIGJlIHNldCBhcyBpbnB1dCBwcm9wZXJ0aWVzXG4gKiBmb3IgZGlyZWN0aXZlcyBvbiB0aGlzIG5vZGUsIGJ1dCBvbmx5IG9uY2Ugb24gY3JlYXRpb24uIFdlIG5lZWQgdGhpcyBhcnJheSB0byBzdXBwb3J0XG4gKiB0aGUgY2FzZSB3aGVyZSB5b3Ugc2V0IGFuIEBJbnB1dCBwcm9wZXJ0eSBvZiBhIGRpcmVjdGl2ZSB1c2luZyBhdHRyaWJ1dGUtbGlrZSBzeW50YXguXG4gKiBlLmcuIGlmIHlvdSBoYXZlIGEgYG5hbWVgIEBJbnB1dCwgeW91IGNhbiBzZXQgaXQgb25jZSBsaWtlIHRoaXM6XG4gKlxuICogPG15LWNvbXBvbmVudCBuYW1lPVwiQmVzc1wiPjwvbXktY29tcG9uZW50PlxuICpcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSBhdHRycyBUaGUgc3RhdGljIGF0dHJzIG9uIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZUluaXRpYWxJbnB1dHMoaW5wdXRzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogSW5pdGlhbElucHV0c3xcbiAgICBudWxsIHtcbiAgbGV0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHN8bnVsbCA9IG51bGw7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGlmIChpbnB1dHMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUgYXMgc3RyaW5nKSkge1xuICAgICAgaWYgKGlucHV0c1RvU3RvcmUgPT09IG51bGwpIGlucHV0c1RvU3RvcmUgPSBbXTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChhdHRyTmFtZSBhcyBzdHJpbmcsIGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddLCBhdHRyc1tpICsgMV0gYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGlucHV0c1RvU3RvcmU7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBOb3Qgc3VyZSB3aHkgSSBuZWVkIHRvIGRvIGBhbnlgIGhlcmUgYnV0IFRTIGNvbXBsYWlucyBsYXRlci5cbmNvbnN0IExDb250YWluZXJBcnJheTogYW55ID0gY2xhc3MgTENvbnRhaW5lciBleHRlbmRzIEFycmF5IHt9O1xuXG4vKipcbiAqIENyZWF0ZXMgYSBMQ29udGFpbmVyLCBlaXRoZXIgZnJvbSBhIGNvbnRhaW5lciBpbnN0cnVjdGlvbiwgb3IgZm9yIGEgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcGFyYW0gaG9zdE5hdGl2ZSBUaGUgaG9zdCBlbGVtZW50IGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGhvc3RUTm9kZSBUaGUgaG9zdCBUTm9kZSBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBjdXJyZW50VmlldyBUaGUgcGFyZW50IHZpZXcgb2YgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBjb21tZW50IGVsZW1lbnRcbiAqIEBwYXJhbSBpc0ZvclZpZXdDb250YWluZXJSZWYgT3B0aW9uYWwgYSBmbGFnIGluZGljYXRpbmcgdGhlIFZpZXdDb250YWluZXJSZWYgY2FzZVxuICogQHJldHVybnMgTENvbnRhaW5lclxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTENvbnRhaW5lcihcbiAgICBob3N0TmF0aXZlOiBSRWxlbWVudHxSQ29tbWVudHxMVmlldywgY3VycmVudFZpZXc6IExWaWV3LCBuYXRpdmU6IFJDb21tZW50LFxuICAgIHROb2RlOiBUTm9kZSk6IExDb250YWluZXIge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TFZpZXcoY3VycmVudFZpZXcpO1xuICAvLyBodHRwczovL2pzcGVyZi5jb20vYXJyYXktbGl0ZXJhbC12cy1uZXctYXJyYXktcmVhbGx5XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBuZXcgKG5nRGV2TW9kZSA/IExDb250YWluZXJBcnJheSA6IEFycmF5KShcbiAgICAgIGhvc3ROYXRpdmUsICAgLy8gaG9zdCBuYXRpdmVcbiAgICAgIHRydWUsICAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgICAgZmFsc2UsICAgICAgICAvLyBoYXMgdHJhbnNwbGFudGVkIHZpZXdzXG4gICAgICBjdXJyZW50VmlldywgIC8vIHBhcmVudFxuICAgICAgbnVsbCwgICAgICAgICAvLyBuZXh0XG4gICAgICAwLCAgICAgICAgICAgIC8vIHRyYW5zcGxhbnRlZCB2aWV3cyB0byByZWZyZXNoIGNvdW50XG4gICAgICB0Tm9kZSwgICAgICAgIC8vIHRfaG9zdFxuICAgICAgbmF0aXZlLCAgICAgICAvLyBuYXRpdmUsXG4gICAgICBudWxsLCAgICAgICAgIC8vIHZpZXcgcmVmc1xuICAgICAgbnVsbCwgICAgICAgICAvLyBtb3ZlZCB2aWV3c1xuICApO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIGxDb250YWluZXIubGVuZ3RoLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCxcbiAgICAgICAgICAnU2hvdWxkIGFsbG9jYXRlIGNvcnJlY3QgbnVtYmVyIG9mIHNsb3RzIGZvciBMQ29udGFpbmVyIGhlYWRlci4nKTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKTtcbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cbi8qKlxuICogR29lcyBvdmVyIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW0gYnkgZXhlY3V0aW5nIGFuIGFzc29jaWF0ZWQgdGVtcGxhdGUgZnVuY3Rpb24uXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hFbWJlZGRlZFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGNvbnN0IGVtYmVkZGVkVFZpZXcgPSBlbWJlZGRlZExWaWV3W1RWSUVXXTtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVtYmVkZGVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoZW1iZWRkZWRMVmlldykpIHtcbiAgICAgICAgcmVmcmVzaFZpZXcoZW1iZWRkZWRUVmlldywgZW1iZWRkZWRMVmlldywgZW1iZWRkZWRUVmlldy50ZW1wbGF0ZSwgZW1iZWRkZWRMVmlld1tDT05URVhUXSEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIE1hcmsgdHJhbnNwbGFudGVkIHZpZXdzIGFzIG5lZWRpbmcgdG8gYmUgcmVmcmVzaGVkIGF0IHRoZWlyIGluc2VydGlvbiBwb2ludHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgbWF5IGhhdmUgdHJhbnNwbGFudGVkIHZpZXdzLlxuICovXG5mdW5jdGlvbiBtYXJrVHJhbnNwbGFudGVkVmlld3NGb3JSZWZyZXNoKGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBpZiAoIWxDb250YWluZXJbSEFTX1RSQU5TUExBTlRFRF9WSUVXU10pIGNvbnRpbnVlO1xuXG4gICAgY29uc3QgbW92ZWRWaWV3cyA9IGxDb250YWluZXJbTU9WRURfVklFV1NdITtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChtb3ZlZFZpZXdzLCAnVHJhbnNwbGFudGVkIFZpZXcgZmxhZ3Mgc2V0IGJ1dCBtaXNzaW5nIE1PVkVEX1ZJRVdTJyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtb3ZlZFZpZXdzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBtb3ZlZExWaWV3ID0gbW92ZWRWaWV3c1tpXSE7XG4gICAgICBjb25zdCBpbnNlcnRpb25MQ29udGFpbmVyID0gbW92ZWRMVmlld1tQQVJFTlRdIGFzIExDb250YWluZXI7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0TENvbnRhaW5lcihpbnNlcnRpb25MQ29udGFpbmVyKTtcbiAgICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gaW5jcmVtZW50IHRoZSBjb3VudGVyIGlmIHRoZSBtb3ZlZCBMVmlldyB3YXMgYWxyZWFkeSBtYXJrZWQgZm9yXG4gICAgICAvLyByZWZyZXNoLlxuICAgICAgaWYgKChtb3ZlZExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpID09PSAwKSB7XG4gICAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChpbnNlcnRpb25MQ29udGFpbmVyLCAxKTtcbiAgICAgIH1cbiAgICAgIC8vIE5vdGUsIGl0IGlzIHBvc3NpYmxlIHRoYXQgdGhlIGBtb3ZlZFZpZXdzYCBpcyB0cmFja2luZyB2aWV3cyB0aGF0IGFyZSB0cmFuc3BsYW50ZWQgKmFuZCpcbiAgICAgIC8vIHRob3NlIHRoYXQgYXJlbid0IChkZWNsYXJhdGlvbiBjb21wb25lbnQgPT09IGluc2VydGlvbiBjb21wb25lbnQpLiBJbiB0aGUgbGF0dGVyIGNhc2UsXG4gICAgICAvLyBpdCdzIGZpbmUgdG8gYWRkIHRoZSBmbGFnLCBhcyB3ZSB3aWxsIGNsZWFyIGl0IGltbWVkaWF0ZWx5IGluXG4gICAgICAvLyBgcmVmcmVzaEVtYmVkZGVkVmlld3NgIGZvciB0aGUgdmlldyBjdXJyZW50bHkgYmVpbmcgcmVmcmVzaGVkLlxuICAgICAgbW92ZWRMVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICB9XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50SG9zdElkeCAgRWxlbWVudCBpbmRleCBpbiBMVmlld1tdIChhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVClcbiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgaWYgKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoY29tcG9uZW50VmlldykpIHtcbiAgICBjb25zdCB0VmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICAgIGlmIChjb21wb25lbnRWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBjb21wb25lbnRWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29tcG9uZW50Vmlld1tDT05URVhUXSk7XG4gICAgfSBlbHNlIGlmIChjb21wb25lbnRWaWV3W1RSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNIXSA+IDApIHtcbiAgICAgIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5Vmlldyhjb21wb25lbnRWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgYWxsIHRyYW5zcGxhbnRlZCB2aWV3cyBtYXJrZWQgd2l0aCBgTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlld2AgdGhhdCBhcmVcbiAqIGNoaWxkcmVuIG9yIGRlc2NlbmRhbnRzIG9mIHRoZSBnaXZlbiBsVmlldy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGxWaWV3IHdoaWNoIGNvbnRhaW5zIGRlc2NlbmRhbnQgdHJhbnNwbGFudGVkIHZpZXdzIHRoYXQgbmVlZCB0byBiZSByZWZyZXNoZWQuXG4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250YWluc0RpcnR5VmlldyhsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgbENvbnRhaW5lciA9IGdldEZpcnN0TENvbnRhaW5lcihsVmlldyk7IGxDb250YWluZXIgIT09IG51bGw7XG4gICAgICAgbENvbnRhaW5lciA9IGdldE5leHRMQ29udGFpbmVyKGxDb250YWluZXIpKSB7XG4gICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgbENvbnRhaW5lci5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZW1iZWRkZWRMVmlldyA9IGxDb250YWluZXJbaV07XG4gICAgICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihlbWJlZGRlZExWaWV3KSkge1xuICAgICAgICBpZiAoZW1iZWRkZWRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3KSB7XG4gICAgICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IGVtYmVkZGVkTFZpZXdbVFZJRVddO1xuICAgICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVtYmVkZGVkVFZpZXcsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICAgIHJlZnJlc2hWaWV3KFxuICAgICAgICAgICAgICBlbWJlZGRlZFRWaWV3LCBlbWJlZGRlZExWaWV3LCBlbWJlZGRlZFRWaWV3LnRlbXBsYXRlLCBlbWJlZGRlZExWaWV3W0NPTlRFWFRdISk7XG5cbiAgICAgICAgfSBlbHNlIGlmIChlbWJlZGRlZExWaWV3W1RSQU5TUExBTlRFRF9WSUVXU19UT19SRUZSRVNIXSA+IDApIHtcbiAgICAgICAgICByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcoZW1iZWRkZWRMVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gIGNvbnN0IGNvbXBvbmVudHMgPSB0Vmlldy5jb21wb25lbnRzO1xuICBpZiAoY29tcG9uZW50cyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRzW2ldLCBsVmlldyk7XG4gICAgICAvLyBPbmx5IGF0dGFjaGVkIGNvbXBvbmVudHMgdGhhdCBhcmUgQ2hlY2tBbHdheXMgb3IgT25QdXNoIGFuZCBkaXJ0eSBzaG91bGQgYmUgcmVmcmVzaGVkXG4gICAgICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSAmJlxuICAgICAgICAgIGNvbXBvbmVudFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgICByZWZyZXNoQ29udGFpbnNEaXJ0eVZpZXcoY29tcG9uZW50Vmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNvbXBvbmVudChob3N0TFZpZXc6IExWaWV3LCBjb21wb25lbnRIb3N0SWR4OiBudW1iZXIpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGhvc3RMVmlldyksIHRydWUsICdTaG91bGQgYmUgcnVuIGluIGNyZWF0aW9uIG1vZGUnKTtcbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleChjb21wb25lbnRIb3N0SWR4LCBob3N0TFZpZXcpO1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VFZpZXcsIGNvbXBvbmVudFZpZXcpO1xuICByZW5kZXJWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2AgdGhhdCBjb250YWlucyB0aGUgYmx1ZXByaW50IGZvciBzeW5jaW5nXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgaSA9IGxWaWV3Lmxlbmd0aDsgaSA8IHRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGxWaWV3LnB1c2godFZpZXcuYmx1ZXByaW50W2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2Ygb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lciBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCE7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIGNvbnN0IGxWaWV3ID0gcmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KTtcbiAgICAvLyBXZSBtaWdodCBub3QgaGF2ZSBhbiBgTFZpZXdgIGlmIHRoZSBjb21wb25lbnQgd2FzIGRlc3Ryb3llZC5cbiAgICBpZiAobFZpZXcgIT09IG51bGwpIHtcbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRWaWV3LnRlbXBsYXRlLCByb290Q29tcG9uZW50KTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gIHRyeSB7XG4gICAgcmVmcmVzaFZpZXcodFZpZXcsIGxWaWV3LCB0Vmlldy50ZW1wbGF0ZSwgY29udGV4dCk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IobFZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KHRWaWV3OiBUVmlldywgdmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW50ZXJuYWwodFZpZXcsIHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSh0cnVlKTtcbiAgdHJ5IHtcbiAgICBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0SXNJbkNoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFxuICAgIGZsYWdzOiBSZW5kZXJGbGFncywgdmlld1F1ZXJ5Rm46IFZpZXdRdWVyaWVzRnVuY3Rpb248VD4sIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UXVlcnlGbiwgJ1ZpZXcgcXVlcmllcyBmdW5jdGlvbiB0byBleGVjdXRlIG11c3QgYmUgZGVmaW5lZC4nKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gIHZpZXdRdWVyeUZuKGZsYWdzLCBjb21wb25lbnQpO1xufVxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgLi4uaW50ZXJwb2xhdGlvblBhcnRzOiBzdHJpbmdbXSkge1xuICAvLyBCaW5kaW5nIG1ldGEtZGF0YSBhcmUgc3RvcmVkIG9ubHkgdGhlIGZpcnN0IHRpbWUgYSBnaXZlbiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBpcyBwcm9jZXNzZWQuXG4gIC8vIFNpbmNlIHdlIGRvbid0IGhhdmUgYSBjb25jZXB0IG9mIHRoZSBcImZpcnN0IHVwZGF0ZSBwYXNzXCIgd2UgbmVlZCB0byBjaGVjayBmb3IgcHJlc2VuY2Ugb2YgdGhlXG4gIC8vIGJpbmRpbmcgbWV0YS1kYXRhIHRvIGRlY2lkZSBpZiBvbmUgc2hvdWxkIGJlIHN0b3JlZCAob3IgaWYgd2FzIHN0b3JlZCBhbHJlYWR5KS5cbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleF0gPT09IG51bGwpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09IG51bGwgfHwgIXROb2RlLmlucHV0c1twcm9wZXJ0eU5hbWVdKSB7XG4gICAgICBjb25zdCBwcm9wQmluZGluZ0lkeHMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzIHx8ICh0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzID0gW10pO1xuICAgICAgcHJvcEJpbmRpbmdJZHhzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgIGxldCBiaW5kaW5nTWV0YWRhdGEgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICBpZiAoaW50ZXJwb2xhdGlvblBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYmluZGluZ01ldGFkYXRhICs9XG4gICAgICAgICAgICBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIGludGVycG9sYXRpb25QYXJ0cy5qb2luKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIH1cbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBiaW5kaW5nTWV0YWRhdGE7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUxWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IG5nRGV2TW9kZSA/IG5ldyBMQ2xlYW51cCgpIDogW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXc6IFRWaWV3KTogYW55W10ge1xuICByZXR1cm4gdFZpZXcuY2xlYW51cCB8fCAodFZpZXcuY2xlYW51cCA9IG5nRGV2TW9kZSA/IG5ldyBUQ2xlYW51cCgpIDogW10pO1xufVxuXG4vKipcbiAqIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIG5lZWRzIHRvIGJlIGluY2x1ZGVkXG4gKiBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyIChzZWUgdGhlIGNvbXBvbmVudFN5bnRoZXRpY0hvc3QqIGluc3RydWN0aW9ucykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIoXG4gICAgY3VycmVudERlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlciB7XG4gIC8vIFRPRE8oRlctMjA0Myk6IHRoZSBgY3VycmVudERlZmAgaXMgbnVsbCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGludm9rZWQgd2hpbGUgY3JlYXRpbmcgcm9vdFxuICAvLyBjb21wb25lbnQgKHNlZSBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbXBvbmVudC50cykuIFRoaXMgaXMgbm90IGNvbnNpc3RlbnQgd2l0aCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBjcmVhdGluZyBpbm5lciBjb21wb25lbnRzLCB3aGVuIGN1cnJlbnQgZGlyZWN0aXZlIGluZGV4IGlzIGF2YWlsYWJsZSBpbiB0aGUgc3RhdGUuIEluIG9yZGVyXG4gIC8vIHRvIGF2b2lkIHJlbHlpbmcgb24gY3VycmVudCBkZWYgYmVpbmcgYG51bGxgICh0aHVzIHNwZWNpYWwtY2FzaW5nIHJvb3QgY29tcG9uZW50IGNyZWF0aW9uKSwgdGhlXG4gIC8vIHByb2Nlc3Mgb2YgY3JlYXRpbmcgcm9vdCBjb21wb25lbnQgc2hvdWxkIGJlIHVuaWZpZWQgd2l0aCB0aGUgcHJvY2VzcyBvZiBjcmVhdGluZyBpbm5lclxuICAvLyBjb21wb25lbnRzLlxuICBpZiAoY3VycmVudERlZiA9PT0gbnVsbCB8fCBpc0NvbXBvbmVudERlZihjdXJyZW50RGVmKSkge1xuICAgIGxWaWV3ID0gdW53cmFwTFZpZXcobFZpZXdbdE5vZGUuaW5kZXhdKSE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3W1JFTkRFUkVSXTtcbn1cblxuLyoqIEhhbmRsZXMgYW4gZXJyb3IgdGhyb3duIGluIGFuIExWaWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUVycm9yKGxWaWV3OiBMVmlldywgZXJyb3I6IGFueSk6IHZvaWQge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXTtcbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gaW5qZWN0b3IgPyBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKSA6IG51bGw7XG4gIGVycm9ySGFuZGxlciAmJiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpO1xufVxuXG4vKipcbiAqIFNldCB0aGUgaW5wdXRzIG9mIGRpcmVjdGl2ZXMgYXQgdGhlIGN1cnJlbnQgbm9kZSB0byBjb3JyZXNwb25kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGlucHV0cyBtYXBwaW5nIGJldHdlZW4gdGhlIHB1YmxpYyBcImlucHV0XCIgbmFtZSBhbmQgcHJpdmF0ZWx5LWtub3duLFxuICogICAgICAgIHBvc3NpYmx5IG1pbmlmaWVkLCBwcm9wZXJ0eSBuYW1lcyB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHB1YmxpY05hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7KSB7XG4gICAgY29uc3QgaW5kZXggPSBpbnB1dHNbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGluc3RhbmNlW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFVwZGF0ZXMgYSB0ZXh0IGJpbmRpbmcgYXQgYSBnaXZlbiBpbmRleCBpbiBhIGdpdmVuIExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGV4dEJpbmRpbmdJbnRlcm5hbChsVmlldzogTFZpZXcsIGluZGV4OiBudW1iZXIsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFN0cmluZyh2YWx1ZSwgJ1ZhbHVlIHNob3VsZCBiZSBhIHN0cmluZycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgdXBkYXRlVGV4dE5vZGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCB2YWx1ZSk7XG59XG4iXX0=