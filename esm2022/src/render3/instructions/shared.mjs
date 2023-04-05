/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ErrorHandler } from '../../error_handler';
import { RuntimeError } from '../../errors';
import { SKIP_HYDRATION_ATTR_NAME } from '../../hydration/skip_hydration';
import { PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT } from '../../hydration/tokens';
import { processTextNodeMarkersBeforeHydration, retrieveHydrationInfo } from '../../hydration/utils';
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
import { isComponentDef, isComponentHost, isContentQueryHost } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, EMBEDDED_VIEW_INJECTOR, ENVIRONMENT, FLAGS, HEADER_OFFSET, HOST, HYDRATION, ID, INJECTOR, NEXT, PARENT, REACTIVE_HOST_BINDING_CONSUMER, REACTIVE_TEMPLATE_CONSUMER, RENDERER, T_HOST, TRANSPLANTED_VIEWS_TO_REFRESH, TVIEW } from '../interfaces/view';
import { assertPureTNodeType, assertTNodeType } from '../node_assert';
import { clearElementContents, updateTextNode } from '../node_manipulation';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { profiler } from '../profiler';
import { commitLViewConsumerIfHasProducers, getReactiveLViewConsumer } from '../reactive_lview_consumer';
import { enterView, getBindingsEnabled, getCurrentDirectiveIndex, getCurrentParentTNode, getCurrentTNodePlaceholderOk, getSelectedIndex, isCurrentTNodeParent, isInCheckNoChangesMode, isInI18nBlock, leaveView, setBindingIndex, setBindingRootForHostBindings, setCurrentDirectiveIndex, setCurrentQueryIndex, setCurrentTNode, setIsInCheckNoChangesMode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER } from '../util/misc_utils';
import { renderStringify } from '../util/stringify_utils';
import { getFirstLContainer, getNextLContainer } from '../util/view_traversal_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, isCreationMode, resetPreOrderHookFlags, unwrapLView, updateTransplantedViewCount, viewAttachedToChangeDetector } from '../util/view_utils';
import { selectIndexInternal } from './advance';
import { ɵɵdirectiveInject } from './di';
import { handleUnknownPropertyError, isPropertyValid, matchingSchemas } from './element_validation';
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
    const consumer = getReactiveLViewConsumer(lView, REACTIVE_HOST_BINDING_CONSUMER);
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
                consumer.runInContext(hostBindingFn, 2 /* RenderFlags.Update */, context);
            }
        }
    }
    finally {
        lView[REACTIVE_HOST_BINDING_CONSUMER] === null &&
            commitLViewConsumerIfHasProducers(lView, REACTIVE_HOST_BINDING_CONSUMER);
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
export function createLView(parentLView, tView, context, flags, host, tHostNode, environment, renderer, injector, embeddedViewInjector, hydrationInfo) {
    const lView = tView.blueprint.slice();
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
    lView[ENVIRONMENT] = (environment || parentLView && parentLView[ENVIRONMENT]);
    ngDevMode && assertDefined(lView[ENVIRONMENT], 'LViewEnvironment is required');
    lView[RENDERER] = (renderer || parentLView && parentLView[RENDERER]);
    ngDevMode && assertDefined(lView[RENDERER], 'Renderer is required');
    lView[INJECTOR] = injector || parentLView && parentLView[INJECTOR] || null;
    lView[T_HOST] = tHostNode;
    lView[ID] = getUniqueLViewId();
    lView[HYDRATION] = hydrationInfo;
    lView[EMBEDDED_VIEW_INJECTOR] = embeddedViewInjector;
    lView[REACTIVE_TEMPLATE_CONSUMER] = null;
    ngDevMode &&
        assertEqual(tView.type == 2 /* TViewType.Embedded */ ? parentLView !== null : true, true, 'Embedded views must have parentLView');
    lView[DECLARATION_COMPONENT_VIEW] =
        tView.type == 2 /* TViewType.Embedded */ ? parentLView[DECLARATION_COMPONENT_VIEW] : lView;
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
                tNode.prev = currentTNode;
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
    // Check no changes mode is a dev only mode used to verify that bindings have not changed
    // since they were assigned. We do not want to execute lifecycle hooks in that mode.
    const isInCheckNoChangesPass = ngDevMode && isInCheckNoChangesMode();
    !isInCheckNoChangesPass && lView[ENVIRONMENT].effectManager?.flush();
    enterView(lView);
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
    const consumer = getReactiveLViewConsumer(lView, REACTIVE_TEMPLATE_CONSUMER);
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
        consumer.runInContext(templateFn, rf, context);
    }
    finally {
        if (lView[REACTIVE_TEMPLATE_CONSUMER] === null) {
            commitLViewConsumerIfHasProducers(lView, REACTIVE_TEMPLATE_CONSUMER);
        }
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
        return def.tView = createTView(1 /* TViewType.Component */, declTNode, def.template, def.decls, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas, def.consts, def.id);
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
export function createTView(type, declTNode, templateFn, decls, vars, directives, pipes, viewQuery, schemas, constsOrFactory, ssrId) {
    ngDevMode && ngDevMode.tView++;
    const bindingStartIndex = HEADER_OFFSET + decls;
    // This length does not yet contain host bindings from child directives because at this point,
    // we don't know which directives are active on this template. As soon as a directive is matched
    // that has a host binding, we will update the blueprint with that def's hostVars count.
    const initialViewLength = bindingStartIndex + vars;
    const blueprint = createViewBlueprint(bindingStartIndex, initialViewLength);
    const consts = typeof constsOrFactory === 'function' ? constsOrFactory() : constsOrFactory;
    const tView = blueprint[TVIEW] = {
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
        incompleteFirstPass: false,
        ssrId,
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
    const blueprint = [];
    for (let i = 0; i < initialViewLength; i++) {
        blueprint.push(i < bindingStartIndex ? null : NO_CHANGE);
    }
    return blueprint;
}
/**
 * Locates the host native element, used for bootstrapping existing nodes into rendering pipeline.
 *
 * @param renderer the renderer used to locate the element.
 * @param elementOrSelector Render element or CSS selector to locate the element.
 * @param encapsulation View Encapsulation defined for component that requests host element.
 * @param injector Root view injector instance.
 */
export function locateHostElement(renderer, elementOrSelector, encapsulation, injector) {
    // Note: we use default value for the `PRESERVE_HOST_CONTENT` here even though it's a
    // tree-shakable one (providedIn:'root'). This code path can be triggered during dynamic
    // component creation (after calling ViewContainerRef.createComponent) when an injector
    // instance can be provided. The injector instance might be disconnected from the main DI
    // tree, thus the `PRESERVE_HOST_CONTENT` would not be able to instantiate. In this case, the
    // default value will be used.
    const preserveHostContent = injector.get(PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT);
    // When using native Shadow DOM, do not clear host element to allow native slot
    // projection.
    const preserveContent = preserveHostContent || encapsulation === ViewEncapsulation.ShadowDom;
    const rootElement = renderer.selectRootElement(elementOrSelector, preserveContent);
    applyRootElementTransform(rootElement);
    return rootElement;
}
/**
 * Applies any root element transformations that are needed. If hydration is enabled,
 * this will process corrupted text nodes.
 *
 * @param rootElement the app root HTML Element
 */
export function applyRootElementTransform(rootElement) {
    _applyRootElementTransformImpl(rootElement);
}
/**
 * Reference to a function that applies transformations to the root HTML element
 * of an app. When hydration is enabled, this processes any corrupt text nodes
 * so they are properly hydratable on the client.
 *
 * @param rootElement the app root HTML Element
 */
let _applyRootElementTransformImpl = (rootElement) => null;
/**
 * Processes text node markers before hydration begins. This replaces any special comment
 * nodes that were added prior to serialization are swapped out to restore proper text
 * nodes before hydration.
 *
 * @param rootElement the app root HTML Element
 */
export function applyRootElementTransformImpl(rootElement) {
    if (rootElement.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
        // Handle a situation when the `ngSkipHydration` attribute is applied
        // to the root node of an application. In this case, we should clear
        // the contents and render everything from scratch.
        clearElementContents(rootElement);
    }
    else {
        processTextNodeMarkersBeforeHydration(rootElement);
    }
}
/**
 * Sets the implementation for the `applyRootElementTransform` function.
 */
export function enableApplyRootElementTransformImpl() {
    _applyRootElementTransformImpl = applyRootElementTransformImpl;
}
/**
 * Saves context for this cleanup function in LView.cleanupInstances.
 *
 * On the first template pass, saves in TView:
 * - Cleanup function
 * - Index of context we just saved in LView.cleanupInstances
 */
export function storeCleanupWithContext(tView, lView, context, cleanupFn) {
    const lCleanup = getOrCreateLViewCleanup(lView);
    // Historically the `storeCleanupWithContext` was used to register both framework-level and
    // user-defined cleanup callbacks, but over time those two types of cleanups were separated.
    // This dev mode checks assures that user-level cleanup callbacks are _not_ stored in data
    // structures reserved for framework-specific hooks.
    ngDevMode &&
        assertDefined(context, 'Cleanup context is mandatory when registering framework-level destroy hooks');
    lCleanup.push(context);
    if (tView.firstCreatePass) {
        getOrCreateTViewCleanup(tView).push(cleanupFn, lCleanup.length - 1);
    }
    else {
        // Make sure that no new framework-level cleanup functions are registered after the first
        // template pass is done (and TView data structures are meant to fully constructed).
        if (ngDevMode) {
            Object.freeze(getOrCreateTViewCleanup(tView));
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
    const tNode = {
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
        tView: null,
        next: null,
        prev: null,
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
function initializeInputAndOutputAliases(tView, tNode, hostDirectiveDefinitionMap) {
    ngDevMode && assertFirstCreatePass(tView);
    const start = tNode.directiveStart;
    const end = tNode.directiveEnd;
    const tViewData = tView.data;
    const tNodeAttrs = tNode.attrs;
    const inputsFromAttrs = [];
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
    if (getBindingsEnabled()) {
        const exportsMap = localRefs === null ? null : { '': -1 };
        const matchResult = findDirectiveDefMatches(tView, tNode);
        let directiveDefs;
        let hostDirectiveDefs;
        if (matchResult === null) {
            directiveDefs = hostDirectiveDefs = null;
        }
        else {
            [directiveDefs, hostDirectiveDefs] = matchResult;
        }
        if (directiveDefs !== null) {
            initializeDirectives(tView, lView, tNode, directiveDefs, exportsMap, hostDirectiveDefs);
        }
        if (exportsMap)
            cacheMatchingLocalNames(tNode, localRefs, exportsMap);
    }
    // Merge the template attrs last so that they have the highest priority.
    tNode.mergedAttrs = mergeHostAttrs(tNode.mergedAttrs, tNode.attrs);
}
/** Initializes the data structures necessary for a list of directives to be instantiated. */
export function initializeDirectives(tView, lView, tNode, directives, exportsMap, hostDirectiveDefs) {
    ngDevMode && assertFirstCreatePass(tView);
    // Publishes the directive types to DI so they can be injected. Needs to
    // happen in a separate pass before the TNode flags have been initialized.
    for (let i = 0; i < directives.length; i++) {
        diPublicInInjector(getOrCreateNodeInjectorForNode(tNode, lView), tView, directives[i].type);
    }
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
            (tView.preOrderHooks ??= []).push(tNode.index);
            preOrderHooksFound = true;
        }
        if (!preOrderCheckHooksFound && (lifeCycleHooks.ngOnChanges || lifeCycleHooks.ngDoCheck)) {
            (tView.preOrderCheckHooks ??= []).push(tNode.index);
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
    // The component view needs to be created before creating the node injector
    // since it is used to inject some special symbols like `ChangeDetectorRef`.
    if (isComponentHost(tNode)) {
        ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */);
        addComponentLogic(lView, tNode, tView.data[start + tNode.componentOffset]);
    }
    if (!tView.firstCreatePass) {
        getOrCreateNodeInjectorForNode(tNode, lView);
    }
    attachPatchData(native, lView);
    const initialInputs = tNode.initialInputs;
    for (let i = start; i < end; i++) {
        const def = tView.data[i];
        const directive = getNodeInjectable(lView, tView, i, tNode);
        attachPatchData(directive, lView);
        if (initialInputs !== null) {
            setInputsFromAttrs(lView, i - start, directive, def, tNode, initialInputs);
        }
        if (isComponentDef(def)) {
            const componentView = getComponentLViewByIndex(tNode.index, lView);
            componentView[CONTEXT] = getNodeInjectable(lView, tView, i, tNode);
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
function findDirectiveDefMatches(tView, tNode) {
    ngDevMode && assertFirstCreatePass(tView);
    ngDevMode && assertTNodeType(tNode, 3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */);
    const registry = tView.directiveRegistry;
    let matches = null;
    let hostDirectiveDefs = null;
    if (registry) {
        for (let i = 0; i < registry.length; i++) {
            const def = registry[i];
            if (isNodeMatchingSelectorList(tNode, def.selectors, /* isProjectionMode */ false)) {
                matches || (matches = []);
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
    (tView.components ??= []).push(hostTNode.index);
}
/** Caches local names and their matching directive indices for query and template lookups. */
function cacheMatchingLocalNames(tNode, localRefs, exportsMap) {
    if (localRefs) {
        const localNames = tNode.localNames = [];
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
    const rendererFactory = lView[ENVIRONMENT].rendererFactory;
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 32 /* LViewFlags.Dirty */ : 16 /* LViewFlags.CheckAlways */, native, hostTNode, null, rendererFactory.createRenderer(native, def), null, null, null));
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
    const lContainer = [
        hostNative,
        true,
        false,
        currentView,
        null,
        0,
        tNode,
        native,
        null,
        null,
        null, // dehydrated views
    ];
    ngDevMode &&
        assertEqual(lContainer.length, CONTAINER_HEADER_OFFSET, 'Should allocate correct number of slots for LContainer header.');
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
    const hostRNode = componentView[HOST];
    // Populate an LView with hydration info retrieved from the DOM via TransferState.
    if (hostRNode !== null && componentView[HYDRATION] === null) {
        componentView[HYDRATION] = retrieveHydrationInfo(hostRNode, componentView[INJECTOR]);
    }
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
export function detectChangesInternal(tView, lView, context, notifyErrorHandler = true) {
    const rendererFactory = lView[ENVIRONMENT].rendererFactory;
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
        // One final flush of the effects queue to catch any effects created in `ngAfterViewInit` or
        // other post-order hooks.
        !checkNoChangesMode && lView[ENVIRONMENT].effectManager?.flush();
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
    return view[CLEANUP] || (view[CLEANUP] = []);
}
export function getOrCreateTViewCleanup(tView) {
    return tView.cleanup || (tView.cleanup = []);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUU1RCxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUN4RSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RixPQUFPLEVBQUMscUNBQXFDLEVBQUUscUJBQXFCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUduRyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsOEJBQThCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2TCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFdBQVcsRUFBRSxtQkFBbUIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNoSixPQUFPLEVBQUMsZUFBZSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDckQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ3BELE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM1RixPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEQsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLHVCQUF1QixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzlGLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxzQkFBc0IsRUFBYyxXQUFXLEVBQUMsTUFBTSx5QkFBeUIsQ0FBQztBQUVqSCxPQUFPLEVBQUMsbUJBQW1CLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUs5RCxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBRSxrQkFBa0IsRUFBYSxNQUFNLDJCQUEyQixDQUFDO0FBQzFHLE9BQU8sRUFBQyxVQUFVLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsMEJBQTBCLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFzQixTQUFTLEVBQUUsRUFBRSxFQUFrQixRQUFRLEVBQXVDLElBQUksRUFBb0IsTUFBTSxFQUFFLDhCQUE4QixFQUFFLDBCQUEwQixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQVMsNkJBQTZCLEVBQUUsS0FBSyxFQUFtQixNQUFNLG9CQUFvQixDQUFDO0FBQzFjLE9BQU8sRUFBQyxtQkFBbUIsRUFBRSxlQUFlLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNwRSxPQUFPLEVBQUMsb0JBQW9CLEVBQUUsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDMUUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDdEYsT0FBTyxFQUFDLFFBQVEsRUFBZ0IsTUFBTSxhQUFhLENBQUM7QUFDcEQsT0FBTyxFQUFDLGlDQUFpQyxFQUFFLHdCQUF3QixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDdkcsT0FBTyxFQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSx3QkFBd0IsRUFBRSxxQkFBcUIsRUFBRSw0QkFBNEIsRUFBRSxnQkFBZ0IsRUFBRSxvQkFBb0IsRUFBRSxzQkFBc0IsRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSw2QkFBNkIsRUFBRSx3QkFBd0IsRUFBRSxvQkFBb0IsRUFBRSxlQUFlLEVBQUUseUJBQXlCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDOVgsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUNwQyxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDbkQsT0FBTyxFQUFDLHVCQUF1QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDM0QsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBQ3hELE9BQU8sRUFBQyxrQkFBa0IsRUFBa0IsaUJBQWlCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUNuRyxPQUFPLEVBQUMsd0JBQXdCLEVBQUUsZ0JBQWdCLEVBQUUsZ0JBQWdCLEVBQUUsY0FBYyxFQUFFLHNCQUFzQixFQUFFLFdBQVcsRUFBRSwyQkFBMkIsRUFBRSw0QkFBNEIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBRWhOLE9BQU8sRUFBQyxtQkFBbUIsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM5QyxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxNQUFNLENBQUM7QUFDdkMsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGVBQWUsRUFBRSxlQUFlLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUVsRzs7Ozs7Ozs7R0FRRztBQUNILE1BQU0sVUFBVSx5QkFBeUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUNsRSxNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztJQUNwRCxJQUFJLGtCQUFrQixLQUFLLElBQUk7UUFBRSxPQUFPO0lBQ3hDLE1BQU0sUUFBUSxHQUFHLHdCQUF3QixDQUFDLEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQ2pGLElBQUk7UUFDRixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsa0JBQWtCLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2xELE1BQU0sTUFBTSxHQUFHLGtCQUFrQixDQUFDLENBQUMsQ0FBVyxDQUFDO1lBQy9DLElBQUksTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDZCx3Q0FBd0M7Z0JBQ3hDLGdCQUFnQixDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDM0I7aUJBQU07Z0JBQ0wsb0ZBQW9GO2dCQUNwRixNQUFNLFlBQVksR0FBRyxNQUFNLENBQUM7Z0JBQzVCLE1BQU0sZUFBZSxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUFXLENBQUM7Z0JBQzFELE1BQU0sYUFBYSxHQUFHLGtCQUFrQixDQUFDLEVBQUUsQ0FBQyxDQUE4QixDQUFDO2dCQUMzRSw2QkFBNkIsQ0FBQyxlQUFlLEVBQUUsWUFBWSxDQUFDLENBQUM7Z0JBQzdELE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDcEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxhQUFhLDhCQUFzQixPQUFPLENBQUMsQ0FBQzthQUNuRTtTQUNGO0tBQ0Y7WUFBUztRQUNSLEtBQUssQ0FBQyw4QkFBOEIsQ0FBQyxLQUFLLElBQUk7WUFDMUMsaUNBQWlDLENBQUMsS0FBSyxFQUFFLDhCQUE4QixDQUFDLENBQUM7UUFDN0UsZ0JBQWdCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN0QjtBQUNILENBQUM7QUFHRCwyRUFBMkU7QUFDM0UsU0FBUyxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWTtJQUN2RCxNQUFNLGNBQWMsR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQzVDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ2pELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4QyxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQzlDLElBQUksZUFBZSxLQUFLLENBQUMsQ0FBQyxFQUFFO2dCQUMxQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBc0IsQ0FBQztnQkFDdEUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxZQUFZLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDcEUsU0FBUztvQkFDTCxhQUFhLENBQUMsWUFBWSxDQUFDLGNBQWMsRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO2dCQUM1RixvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDcEMsWUFBWSxDQUFDLGNBQWUsNkJBQXFCLEtBQUssQ0FBQyxlQUFlLENBQUMsRUFBRSxlQUFlLENBQUMsQ0FBQzthQUMzRjtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQVMsc0JBQXNCLENBQUMsU0FBZ0IsRUFBRSxVQUFvQjtJQUNwRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDNUM7QUFDSCxDQUFDO0FBRUQsb0VBQW9FO0FBQ3BFLFNBQVMscUJBQXFCLENBQUMsU0FBZ0IsRUFBRSxVQUFvQjtJQUNuRSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxlQUFlLENBQUMsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzNDO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLFdBQXVCLEVBQUUsS0FBWSxFQUFFLE9BQWUsRUFBRSxLQUFpQixFQUFFLElBQW1CLEVBQzlGLFNBQXFCLEVBQUUsV0FBa0MsRUFBRSxRQUF1QixFQUNsRixRQUF1QixFQUFFLG9CQUFtQyxFQUM1RCxhQUFrQztJQUNwQyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBVyxDQUFDO0lBQy9DLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7SUFDbkIsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssa0NBQTBCLCtCQUFzQixvQ0FBNEIsQ0FBQztJQUNqRyxJQUFJLG9CQUFvQixLQUFLLElBQUk7UUFDN0IsQ0FBQyxXQUFXLElBQUksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLGdEQUFxQyxDQUFDLENBQUMsRUFBRTtRQUM5RSxLQUFLLENBQUMsS0FBSyxDQUFDLGlEQUFzQyxDQUFDO0tBQ3BEO0lBQ0Qsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsU0FBUyxJQUFJLEtBQUssQ0FBQyxTQUFTLElBQUksV0FBVyxJQUFJLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsV0FBVyxDQUFDLENBQUM7SUFDakcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQztJQUN0RCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLEtBQUssQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFFLENBQUM7SUFDL0UsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUMvRSxLQUFLLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxRQUFRLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBRSxDQUFDO0lBQ3RFLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7SUFDcEUsS0FBSyxDQUFDLFFBQWUsQ0FBQyxHQUFHLFFBQVEsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUNsRixLQUFLLENBQUMsTUFBTSxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQzFCLEtBQUssQ0FBQyxFQUFFLENBQUMsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQy9CLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxhQUFhLENBQUM7SUFDakMsS0FBSyxDQUFDLHNCQUE2QixDQUFDLEdBQUcsb0JBQW9CLENBQUM7SUFDNUQsS0FBSyxDQUFDLDBCQUEwQixDQUFDLEdBQUcsSUFBSSxDQUFDO0lBRXpDLFNBQVM7UUFDTCxXQUFXLENBQ1AsS0FBSyxDQUFDLElBQUksOEJBQXNCLENBQUMsQ0FBQyxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQ3BFLHNDQUFzQyxDQUFDLENBQUM7SUFDaEQsS0FBSyxDQUFDLDBCQUEwQixDQUFDO1FBQzdCLEtBQUssQ0FBQyxJQUFJLDhCQUFzQixDQUFDLENBQUMsQ0FBQyxXQUFZLENBQUMsMEJBQTBCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0lBQ3hGLE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQTRCRCxNQUFNLFVBQVUsZ0JBQWdCLENBQzVCLEtBQVksRUFBRSxLQUFhLEVBQUUsSUFBZSxFQUFFLElBQWlCLEVBQUUsS0FBdUI7SUFFMUYsU0FBUyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUssaUVBQWlFO1FBQ2pFLHNEQUFzRDtRQUMvRSx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDNUYsMkRBQTJEO0lBQzNELFNBQVMsSUFBSSxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxJQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBVSxDQUFDO0lBQ3ZDLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNsQixLQUFLLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVELElBQUksYUFBYSxFQUFFLEVBQUU7WUFDbkIseUZBQXlGO1lBQ3pGLG9FQUFvRTtZQUNwRSw0RkFBNEY7WUFDNUYsc0NBQXNDO1lBQ3RDLEtBQUssQ0FBQyxLQUFLLGtDQUF5QixDQUFDO1NBQ3RDO0tBQ0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLGlDQUF3QixFQUFFO1FBQzdDLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO1FBQ25CLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO1FBQ3BCLE1BQU0sTUFBTSxHQUFHLHFCQUFxQixFQUFFLENBQUM7UUFDdkMsS0FBSyxDQUFDLGFBQWEsR0FBRyxNQUFNLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQztRQUNsRSxTQUFTLElBQUksbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQy9DLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztLQUN0RTtJQUNELGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDN0IsT0FBTyxLQUNjLENBQUM7QUFDeEIsQ0FBQztBQUVELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsS0FBWSxFQUFFLEtBQWEsRUFBRSxJQUFlLEVBQUUsSUFBaUIsRUFBRSxLQUF1QjtJQUMxRixNQUFNLFlBQVksR0FBRyw0QkFBNEIsRUFBRSxDQUFDO0lBQ3BELE1BQU0sUUFBUSxHQUFHLG9CQUFvQixFQUFFLENBQUM7SUFDeEMsTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxDQUFDO0lBQzdFLGdHQUFnRztJQUNoRyxNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUMzQixXQUFXLENBQUMsS0FBSyxFQUFFLE1BQXVDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDMUYsaUdBQWlHO0lBQ2pHLGlHQUFpRztJQUNqRywwREFBMEQ7SUFDMUQsSUFBSSxLQUFLLENBQUMsVUFBVSxLQUFLLElBQUksRUFBRTtRQUM3QixLQUFLLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztLQUMxQjtJQUNELElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtRQUN6QixJQUFJLFFBQVEsRUFBRTtZQUNaLCtFQUErRTtZQUMvRSxJQUFJLFlBQVksQ0FBQyxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssSUFBSSxFQUFFO2dCQUN2RCxzRkFBc0Y7Z0JBQ3RGLFlBQVksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO2FBQzVCO1NBQ0Y7YUFBTTtZQUNMLElBQUksWUFBWSxDQUFDLElBQUksS0FBSyxJQUFJLEVBQUU7Z0JBQzlCLDRGQUE0RjtnQkFDNUYseUNBQXlDO2dCQUN6QyxZQUFZLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztnQkFDMUIsS0FBSyxDQUFDLElBQUksR0FBRyxZQUFZLENBQUM7YUFDM0I7U0FDRjtLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQ7Ozs7Ozs7OztHQVNHO0FBQ0gsTUFBTSxVQUFVLFlBQVksQ0FDeEIsS0FBWSxFQUFFLEtBQVksRUFBRSxlQUF1QixFQUFFLFlBQWlCO0lBQ3hFLElBQUksZUFBZSxLQUFLLENBQUM7UUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLElBQUksU0FBUyxFQUFFO1FBQ2IscUJBQXFCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDN0IsVUFBVSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUUsMENBQTBDLENBQUMsQ0FBQztRQUM1RSxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sRUFBRSwwQ0FBMEMsQ0FBQyxDQUFDO1FBQ3pGLFdBQVcsQ0FDUCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSw4Q0FBOEMsQ0FBQyxDQUFDO1FBQy9GLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQzlCO0lBQ0QsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztJQUM5QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQ3hDLEtBQUssQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDekIsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDbkMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDdkI7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBR0QsMEJBQTBCO0FBQzFCLFdBQVc7QUFDWCwwQkFBMEI7QUFFMUI7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLFVBQVUsQ0FBSSxLQUFZLEVBQUUsS0FBZSxFQUFFLE9BQVU7SUFDckUsU0FBUyxJQUFJLFdBQVcsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQUUsSUFBSSxFQUFFLGdDQUFnQyxDQUFDLENBQUM7SUFDeEYsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2pCLElBQUk7UUFDRixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2xDLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixrQkFBa0IsNkJBQXdCLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvRDtRQUVELCtGQUErRjtRQUMvRix3Q0FBd0M7UUFDeEMsTUFBTSxVQUFVLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQztRQUNsQyxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7WUFDdkIsZUFBZSxDQUFJLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSw4QkFBc0IsT0FBTyxDQUFDLENBQUM7U0FDM0U7UUFFRCxzRkFBc0Y7UUFDdEYsbUZBQW1GO1FBQ25GLHVGQUF1RjtRQUN2RixpRkFBaUY7UUFDakYsaUNBQWlDO1FBQ2pDLElBQUksS0FBSyxDQUFDLGVBQWUsRUFBRTtZQUN6QixLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELHVGQUF1RjtRQUN2RiwwRkFBMEY7UUFDMUYseUNBQXlDO1FBQ3pDLElBQUksS0FBSyxDQUFDLG9CQUFvQixFQUFFO1lBQzlCLHFCQUFxQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNyQztRQUVELDBFQUEwRTtRQUMxRSw0RUFBNEU7UUFDNUUseUVBQXlFO1FBQ3pFLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNCLGtCQUFrQiw2QkFBd0IsS0FBSyxDQUFDLFNBQVUsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN0RTtRQUVELGdDQUFnQztRQUNoQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDMUM7S0FFRjtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsaUVBQWlFO1FBQ2pFLGlFQUFpRTtRQUNqRSxJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7WUFDekIsS0FBSyxDQUFDLG1CQUFtQixHQUFHLElBQUksQ0FBQztZQUNqQyxLQUFLLENBQUMsZUFBZSxHQUFHLEtBQUssQ0FBQztTQUMvQjtRQUVELE1BQU0sS0FBSyxDQUFDO0tBQ2I7WUFBUztRQUNSLEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSxnQ0FBd0IsQ0FBQztRQUN6QyxTQUFTLEVBQUUsQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxNQUFNLFVBQVUsV0FBVyxDQUN2QixLQUFZLEVBQUUsS0FBWSxFQUFFLFVBQXNDLEVBQUUsT0FBVTtJQUNoRixTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsRUFBRSxLQUFLLEVBQUUsOEJBQThCLENBQUMsQ0FBQztJQUN2RixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDM0IsSUFBSSxDQUFDLEtBQUssaUNBQXVCLENBQUMsbUNBQXlCO1FBQUUsT0FBTztJQUVwRSx5RkFBeUY7SUFDekYsb0ZBQW9GO0lBQ3BGLE1BQU0sc0JBQXNCLEdBQUcsU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUM7SUFFckUsQ0FBQyxzQkFBc0IsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDO0lBRXJFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNqQixJQUFJO1FBQ0Ysc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFOUIsZUFBZSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3pDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixlQUFlLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxVQUFVLDhCQUFzQixPQUFPLENBQUMsQ0FBQztTQUN4RTtRQUVELE1BQU0sdUJBQXVCLEdBQ3pCLENBQUMsS0FBSyx3Q0FBZ0MsQ0FBQyw4Q0FBc0MsQ0FBQztRQUVsRix1REFBdUQ7UUFDdkQsc0ZBQXNGO1FBQ3RGLElBQUksQ0FBQyxzQkFBc0IsRUFBRTtZQUMzQixJQUFJLHVCQUF1QixFQUFFO2dCQUMzQixNQUFNLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQztnQkFDcEQsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7b0JBQy9CLGlCQUFpQixDQUFDLEtBQUssRUFBRSxrQkFBa0IsRUFBRSxJQUFJLENBQUMsQ0FBQztpQkFDcEQ7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO2dCQUMxQyxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7b0JBQzFCLHdCQUF3QixDQUFDLEtBQUssRUFBRSxhQUFhLDZDQUFxQyxJQUFJLENBQUMsQ0FBQztpQkFDekY7Z0JBQ0QsdUJBQXVCLENBQUMsS0FBSyw0Q0FBb0MsQ0FBQzthQUNuRTtTQUNGO1FBRUQsOEZBQThGO1FBQzlGLGdHQUFnRztRQUNoRyxxRUFBcUU7UUFDckUsK0JBQStCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdkMsb0JBQW9CLENBQUMsS0FBSyxDQUFDLENBQUM7UUFFNUIsMkVBQTJFO1FBQzNFLElBQUksS0FBSyxDQUFDLGNBQWMsS0FBSyxJQUFJLEVBQUU7WUFDakMscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3JDO1FBRUQsZ0VBQWdFO1FBQ2hFLHNGQUFzRjtRQUN0RixJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDM0IsSUFBSSx1QkFBdUIsRUFBRTtnQkFDM0IsTUFBTSxpQkFBaUIsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUM7Z0JBQ2xELElBQUksaUJBQWlCLEtBQUssSUFBSSxFQUFFO29CQUM5QixpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztpQkFDN0M7YUFDRjtpQkFBTTtnQkFDTCxNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO2dCQUN4QyxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7b0JBQ3pCLHdCQUF3QixDQUNwQixLQUFLLEVBQUUsWUFBWSxzREFBOEMsQ0FBQztpQkFDdkU7Z0JBQ0QsdUJBQXVCLENBQUMsS0FBSyxzREFBOEMsQ0FBQzthQUM3RTtTQUNGO1FBRUQseUJBQXlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhDLGlDQUFpQztRQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO1FBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtZQUN2QixzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDM0M7UUFFRCw4RkFBOEY7UUFDOUYsNEZBQTRGO1FBQzVGLG1EQUFtRDtRQUNuRCxNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsU0FBUyxDQUFDO1FBQ2xDLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtZQUN0QixrQkFBa0IsNkJBQXdCLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUMvRDtRQUVELHVEQUF1RDtRQUN2RCxzRkFBc0Y7UUFDdEYsSUFBSSxDQUFDLHNCQUFzQixFQUFFO1lBQzNCLElBQUksdUJBQXVCLEVBQUU7Z0JBQzNCLE1BQU0sY0FBYyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7Z0JBQzVDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtvQkFDM0IsaUJBQWlCLENBQUMsS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDO2lCQUMxQzthQUNGO2lCQUFNO2dCQUNMLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7Z0JBQ2xDLElBQUksU0FBUyxLQUFLLElBQUksRUFBRTtvQkFDdEIsd0JBQXdCLENBQUMsS0FBSyxFQUFFLFNBQVMsbURBQTJDLENBQUM7aUJBQ3RGO2dCQUNELHVCQUF1QixDQUFDLEtBQUssbURBQTJDLENBQUM7YUFDMUU7U0FDRjtRQUNELElBQUksS0FBSyxDQUFDLGVBQWUsS0FBSyxJQUFJLEVBQUU7WUFDbEMsbUZBQW1GO1lBQ25GLG9DQUFvQztZQUNwQywyRkFBMkY7WUFDM0YsMEZBQTBGO1lBQzFGLDhGQUE4RjtZQUM5Rix5RUFBeUU7WUFDekUsS0FBSyxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7U0FDL0I7UUFFRCwrRkFBK0Y7UUFDL0YsOEZBQThGO1FBQzlGLDBGQUEwRjtRQUMxRiwwRkFBMEY7UUFDMUYsNkZBQTZGO1FBQzdGLGdGQUFnRjtRQUNoRixJQUFJLENBQUMsc0JBQXNCLEVBQUU7WUFDM0IsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyw2REFBNEMsQ0FBQyxDQUFDO1NBQ2pFO1FBQ0QsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLCtDQUFxQyxFQUFFO1lBQ3JELEtBQUssQ0FBQyxLQUFLLENBQUMsSUFBSSw2Q0FBbUMsQ0FBQztZQUNwRCwyQkFBMkIsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUM5RDtLQUNGO1lBQVM7UUFDUixTQUFTLEVBQUUsQ0FBQztLQUNiO0FBQ0gsQ0FBQztBQUVELFNBQVMsZUFBZSxDQUNwQixLQUFZLEVBQUUsS0FBZSxFQUFFLFVBQWdDLEVBQUUsRUFBZSxFQUFFLE9BQVU7SUFDOUYsTUFBTSxRQUFRLEdBQUcsd0JBQXdCLENBQUMsS0FBSyxFQUFFLDBCQUEwQixDQUFDLENBQUM7SUFDN0UsTUFBTSxpQkFBaUIsR0FBRyxnQkFBZ0IsRUFBRSxDQUFDO0lBQzdDLE1BQU0sYUFBYSxHQUFHLEVBQUUsNkJBQXFCLENBQUM7SUFDOUMsSUFBSTtRQUNGLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsSUFBSSxhQUFhLElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxhQUFhLEVBQUU7WUFDakQsdURBQXVEO1lBQ3ZELDREQUE0RDtZQUM1RCxtQkFBbUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxDQUFDLENBQUMsU0FBUyxJQUFJLHNCQUFzQixFQUFFLENBQUMsQ0FBQztTQUMzRjtRQUVELE1BQU0sV0FBVyxHQUNiLGFBQWEsQ0FBQyxDQUFDLDJDQUFtQyxDQUFDLDBDQUFrQyxDQUFDO1FBQzFGLFFBQVEsQ0FBQyxXQUFXLEVBQUUsT0FBd0IsQ0FBQyxDQUFDO1FBQ2hELFFBQVEsQ0FBQyxZQUFZLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoRDtZQUFTO1FBQ1IsSUFBSSxLQUFLLENBQUMsMEJBQTBCLENBQUMsS0FBSyxJQUFJLEVBQUU7WUFDOUMsaUNBQWlDLENBQUMsS0FBSyxFQUFFLDBCQUEwQixDQUFDLENBQUM7U0FDdEU7UUFDRCxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXBDLE1BQU0sWUFBWSxHQUNkLGFBQWEsQ0FBQyxDQUFDLHlDQUFpQyxDQUFDLHdDQUFnQyxDQUFDO1FBQ3RGLFFBQVEsQ0FBQyxZQUFZLEVBQUUsT0FBd0IsQ0FBQyxDQUFDO0tBQ2xEO0FBQ0gsQ0FBQztBQUVELDBCQUEwQjtBQUMxQixZQUFZO0FBQ1osMEJBQTBCO0FBRTFCLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVk7SUFDNUUsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUM3QixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO1FBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7UUFDL0IsS0FBSyxJQUFJLGNBQWMsR0FBRyxLQUFLLEVBQUUsY0FBYyxHQUFHLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRTtZQUN2RSxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBc0IsQ0FBQztZQUM1RCxJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUU7Z0JBQ3RCLEdBQUcsQ0FBQyxjQUFjLDZCQUFxQixLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDL0U7U0FDRjtLQUNGO0FBQ0gsQ0FBQztBQUdEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBeUI7SUFDN0YsSUFBSSxDQUFDLGtCQUFrQixFQUFFO1FBQUUsT0FBTztJQUNsQyx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztJQUM5RSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssc0NBQTZCLENBQUMsd0NBQStCLEVBQUU7UUFDN0UsNEJBQTRCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNuRDtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLFFBQWUsRUFBRSxLQUF5QixFQUMxQyxvQkFBdUMsZ0JBQWdCO0lBQ3pELE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUM7SUFDcEMsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO1FBQ3ZCLElBQUksVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO1FBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDN0MsTUFBTSxLQUFLLEdBQUcsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsQ0FBQztZQUMxQyxNQUFNLEtBQUssR0FBRyxLQUFLLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztnQkFDeEIsaUJBQWlCLENBQ2IsS0FBOEQsRUFBRSxRQUFRLENBQUMsQ0FBQyxDQUFDO2dCQUMvRSxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDcEIsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQ2hDO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEdBQXNCO0lBQzlELE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUM7SUFFeEIsb0ZBQW9GO0lBQ3BGLHFGQUFxRjtJQUNyRixJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxDQUFDLG1CQUFtQixFQUFFO1FBQy9DLDJGQUEyRjtRQUMzRiwrQ0FBK0M7UUFDL0MsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDO1FBQ3ZCLE9BQU8sR0FBRyxDQUFDLEtBQUssR0FBRyxXQUFXLDhCQUNFLFNBQVMsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsYUFBYSxFQUNwRixHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQztLQUMxRTtJQUVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUdEOzs7Ozs7Ozs7Ozs7R0FZRztBQUNILE1BQU0sVUFBVSxXQUFXLENBQ3ZCLElBQWUsRUFBRSxTQUFxQixFQUFFLFVBQXVDLEVBQUUsS0FBYSxFQUM5RixJQUFZLEVBQUUsVUFBMEMsRUFBRSxLQUFnQyxFQUMxRixTQUF3QyxFQUFFLE9BQThCLEVBQ3hFLGVBQXlDLEVBQUUsS0FBa0I7SUFDL0QsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQixNQUFNLGlCQUFpQixHQUFHLGFBQWEsR0FBRyxLQUFLLENBQUM7SUFDaEQsOEZBQThGO0lBQzlGLGdHQUFnRztJQUNoRyx3RkFBd0Y7SUFDeEYsTUFBTSxpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyxJQUFJLENBQUM7SUFDbkQsTUFBTSxTQUFTLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUM1RSxNQUFNLE1BQU0sR0FBRyxPQUFPLGVBQWUsS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUM7SUFDM0YsTUFBTSxLQUFLLEdBQUcsU0FBUyxDQUFDLEtBQVksQ0FBQyxHQUFHO1FBQ3RDLElBQUksRUFBRSxJQUFJO1FBQ1YsU0FBUyxFQUFFLFNBQVM7UUFDcEIsUUFBUSxFQUFFLFVBQVU7UUFDcEIsT0FBTyxFQUFFLElBQUk7UUFDYixTQUFTLEVBQUUsU0FBUztRQUNwQixTQUFTLEVBQUUsU0FBUztRQUNwQixJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUM7UUFDckQsaUJBQWlCLEVBQUUsaUJBQWlCO1FBQ3BDLGlCQUFpQixFQUFFLGlCQUFpQjtRQUNwQyxrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGVBQWUsRUFBRSxJQUFJO1FBQ3JCLGlCQUFpQixFQUFFLEtBQUs7UUFDeEIsb0JBQW9CLEVBQUUsS0FBSztRQUMzQixhQUFhLEVBQUUsSUFBSTtRQUNuQixrQkFBa0IsRUFBRSxJQUFJO1FBQ3hCLFlBQVksRUFBRSxJQUFJO1FBQ2xCLGlCQUFpQixFQUFFLElBQUk7UUFDdkIsU0FBUyxFQUFFLElBQUk7UUFDZixjQUFjLEVBQUUsSUFBSTtRQUNwQixZQUFZLEVBQUUsSUFBSTtRQUNsQixPQUFPLEVBQUUsSUFBSTtRQUNiLGNBQWMsRUFBRSxJQUFJO1FBQ3BCLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGlCQUFpQixFQUFFLE9BQU8sVUFBVSxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsVUFBVSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVU7UUFDL0UsWUFBWSxFQUFFLE9BQU8sS0FBSyxLQUFLLFVBQVUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUs7UUFDM0QsVUFBVSxFQUFFLElBQUk7UUFDaEIsT0FBTyxFQUFFLE9BQU87UUFDaEIsTUFBTSxFQUFFLE1BQU07UUFDZCxtQkFBbUIsRUFBRSxLQUFLO1FBQzFCLEtBQUs7S0FDTixDQUFDO0lBQ0YsSUFBSSxTQUFTLEVBQUU7UUFDYixnR0FBZ0c7UUFDaEcsNEZBQTRGO1FBQzVGLDZCQUE2QjtRQUM3QixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ3BCO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxpQkFBeUIsRUFBRSxpQkFBeUI7SUFDL0UsTUFBTSxTQUFTLEdBQUcsRUFBRSxDQUFDO0lBRXJCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxpQkFBaUIsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUMxRDtJQUVELE9BQU8sU0FBa0IsQ0FBQztBQUM1QixDQUFDO0FBRUQ7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsUUFBa0IsRUFBRSxpQkFBa0MsRUFBRSxhQUFnQyxFQUN4RixRQUFrQjtJQUNwQixxRkFBcUY7SUFDckYsd0ZBQXdGO0lBQ3hGLHVGQUF1RjtJQUN2Rix5RkFBeUY7SUFDekYsNkZBQTZGO0lBQzdGLDhCQUE4QjtJQUM5QixNQUFNLG1CQUFtQixHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMscUJBQXFCLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUUvRiwrRUFBK0U7SUFDL0UsY0FBYztJQUNkLE1BQU0sZUFBZSxHQUFHLG1CQUFtQixJQUFJLGFBQWEsS0FBSyxpQkFBaUIsQ0FBQyxTQUFTLENBQUM7SUFDN0YsTUFBTSxXQUFXLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO0lBQ25GLHlCQUF5QixDQUFDLFdBQTBCLENBQUMsQ0FBQztJQUN0RCxPQUFPLFdBQVcsQ0FBQztBQUNyQixDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsV0FBd0I7SUFDaEUsOEJBQThCLENBQUMsV0FBMEIsQ0FBQyxDQUFDO0FBQzdELENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxJQUFJLDhCQUE4QixHQUM5QixDQUFDLFdBQXdCLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQztBQUV2Qzs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsNkJBQTZCLENBQUMsV0FBd0I7SUFDcEUsSUFBSSxXQUFXLENBQUMsWUFBWSxDQUFDLHdCQUF3QixDQUFDLEVBQUU7UUFDdEQscUVBQXFFO1FBQ3JFLG9FQUFvRTtRQUNwRSxtREFBbUQ7UUFDbkQsb0JBQW9CLENBQUMsV0FBdUIsQ0FBQyxDQUFDO0tBQy9DO1NBQU07UUFDTCxxQ0FBcUMsQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNwRDtBQUNILENBQUM7QUFFRDs7R0FFRztBQUNILE1BQU0sVUFBVSxtQ0FBbUM7SUFDakQsOEJBQThCLEdBQUcsNkJBQTZCLENBQUM7QUFDakUsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILE1BQU0sVUFBVSx1QkFBdUIsQ0FDbkMsS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFZLEVBQUUsU0FBbUI7SUFDL0QsTUFBTSxRQUFRLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFFaEQsMkZBQTJGO0lBQzNGLDRGQUE0RjtJQUM1RiwwRkFBMEY7SUFDMUYsb0RBQW9EO0lBQ3BELFNBQVM7UUFDTCxhQUFhLENBQ1QsT0FBTyxFQUFFLDZFQUE2RSxDQUFDLENBQUM7SUFDaEcsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUV2QixJQUFJLEtBQUssQ0FBQyxlQUFlLEVBQUU7UUFDekIsdUJBQXVCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0tBQ3JFO1NBQU07UUFDTCx5RkFBeUY7UUFDekYsb0ZBQW9GO1FBQ3BGLElBQUksU0FBUyxFQUFFO1lBQ2IsTUFBTSxDQUFDLE1BQU0sQ0FBQyx1QkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1NBQy9DO0tBQ0Y7QUFDSCxDQUFDO0FBK0JELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLEtBQVksRUFBRSxPQUF5QyxFQUFFLElBQWUsRUFBRSxLQUFhLEVBQ3ZGLEtBQWtCLEVBQUUsS0FBdUI7SUFDN0MsU0FBUyxJQUFJLEtBQUssS0FBSyxDQUFDLElBQUssaUVBQWlFO1FBQ2pFLHNEQUFzRDtRQUMvRSx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDNUYsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLGdEQUFnRCxDQUFDLENBQUM7SUFDL0YsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQixTQUFTLElBQUksT0FBTyxJQUFJLG1CQUFtQixDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM1RCxJQUFJLGFBQWEsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sS0FBSyxHQUFHO1FBQ1osSUFBSTtRQUNKLEtBQUs7UUFDTCxpQkFBaUIsRUFBRSxJQUFJO1FBQ3ZCLGFBQWE7UUFDYixjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ2xCLFlBQVksRUFBRSxDQUFDLENBQUM7UUFDaEIsb0JBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBQ3hCLGVBQWUsRUFBRSxDQUFDLENBQUM7UUFDbkIsZ0JBQWdCLEVBQUUsSUFBSTtRQUN0QixLQUFLLEVBQUUsQ0FBQztRQUNSLGVBQWUsRUFBRSxDQUFDO1FBQ2xCLEtBQUssRUFBRSxLQUFLO1FBQ1osS0FBSyxFQUFFLEtBQUs7UUFDWixXQUFXLEVBQUUsSUFBSTtRQUNqQixVQUFVLEVBQUUsSUFBSTtRQUNoQixhQUFhLEVBQUUsU0FBUztRQUN4QixNQUFNLEVBQUUsSUFBSTtRQUNaLE9BQU8sRUFBRSxJQUFJO1FBQ2IsS0FBSyxFQUFFLElBQUk7UUFDWCxJQUFJLEVBQUUsSUFBSTtRQUNWLElBQUksRUFBRSxJQUFJO1FBQ1YsY0FBYyxFQUFFLElBQUk7UUFDcEIsS0FBSyxFQUFFLElBQUk7UUFDWCxNQUFNLEVBQUUsT0FBTztRQUNmLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLE1BQU0sRUFBRSxJQUFJO1FBQ1osaUJBQWlCLEVBQUUsSUFBSTtRQUN2QixjQUFjLEVBQUUsU0FBUztRQUN6QixPQUFPLEVBQUUsSUFBSTtRQUNiLGtCQUFrQixFQUFFLElBQUk7UUFDeEIsZUFBZSxFQUFFLFNBQVM7UUFDMUIsYUFBYSxFQUFFLENBQVE7UUFDdkIsYUFBYSxFQUFFLENBQVE7S0FDeEIsQ0FBQztJQUNGLElBQUksU0FBUyxFQUFFO1FBQ2IsZ0dBQWdHO1FBQ2hHLDRGQUE0RjtRQUM1Riw2QkFBNkI7UUFDN0IsTUFBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUNwQjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsUUFBd0MsRUFBRSxjQUFzQixFQUNoRSxlQUFxQyxFQUNyQyxxQkFBbUQ7SUFDckQsS0FBSyxJQUFJLFVBQVUsSUFBSSxRQUFRLEVBQUU7UUFDL0IsSUFBSSxRQUFRLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZDLGVBQWUsR0FBRyxlQUFlLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQztZQUNsRSxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7WUFFMUMseUZBQXlGO1lBQ3pGLHFFQUFxRTtZQUNyRSw2RkFBNkY7WUFDN0Ysa0VBQWtFO1lBQ2xFLDJGQUEyRjtZQUMzRiwwQ0FBMEM7WUFDMUMsSUFBSSxxQkFBcUIsS0FBSyxJQUFJLEVBQUU7Z0JBQ2xDLGdCQUFnQixDQUFDLGVBQWUsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQzdFO2lCQUFNLElBQUkscUJBQXFCLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUMzRCxnQkFBZ0IsQ0FDWixlQUFlLEVBQUUsY0FBYyxFQUFFLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxFQUFFLFlBQVksQ0FBQyxDQUFDO2FBQ3ZGO1NBQ0Y7S0FDRjtJQUNELE9BQU8sZUFBZSxDQUFDO0FBQ3pCLENBQUM7QUFFRCxTQUFTLGdCQUFnQixDQUNyQixlQUFnQyxFQUFFLGNBQXNCLEVBQUUsVUFBa0IsRUFDNUUsWUFBb0I7SUFDdEIsSUFBSSxlQUFlLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQzlDLGVBQWUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ2hFO1NBQU07UUFDTCxlQUFlLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7S0FDOUQ7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUywrQkFBK0IsQ0FDcEMsS0FBWSxFQUFFLEtBQVksRUFBRSwwQkFBa0Q7SUFDaEYsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLE1BQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUM7SUFDbkMsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBQztJQUMvQixNQUFNLFNBQVMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDO0lBRTdCLE1BQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDL0IsTUFBTSxlQUFlLEdBQXFCLEVBQUUsQ0FBQztJQUM3QyxJQUFJLFdBQVcsR0FBeUIsSUFBSSxDQUFDO0lBQzdDLElBQUksWUFBWSxHQUF5QixJQUFJLENBQUM7SUFFOUMsS0FBSyxJQUFJLGNBQWMsR0FBRyxLQUFLLEVBQUUsY0FBYyxHQUFHLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRTtRQUN2RSxNQUFNLFlBQVksR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFzQixDQUFDO1FBQ3BFLE1BQU0sU0FBUyxHQUNYLDBCQUEwQixDQUFDLENBQUMsQ0FBQywwQkFBMEIsQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUNyRixNQUFNLGFBQWEsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUMxRCxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztRQUU1RCxXQUFXO1lBQ1AsdUJBQXVCLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsV0FBVyxFQUFFLGFBQWEsQ0FBQyxDQUFDO1FBQzdGLFlBQVk7WUFDUix1QkFBdUIsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLGNBQWMsRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDaEcscUZBQXFGO1FBQ3JGLGdGQUFnRjtRQUNoRiwyRkFBMkY7UUFDM0Ysc0NBQXNDO1FBQ3RDLE1BQU0sYUFBYSxHQUNmLENBQUMsV0FBVyxLQUFLLElBQUksSUFBSSxVQUFVLEtBQUssSUFBSSxJQUFJLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzNFLHFCQUFxQixDQUFDLFdBQVcsRUFBRSxjQUFjLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztZQUNoRSxJQUFJLENBQUM7UUFDVCxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO1FBQ3hCLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN2QyxLQUFLLENBQUMsS0FBSyxvQ0FBNEIsQ0FBQztTQUN6QztRQUNELElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN2QyxLQUFLLENBQUMsS0FBSyxxQ0FBNEIsQ0FBQztTQUN6QztLQUNGO0lBRUQsS0FBSyxDQUFDLGFBQWEsR0FBRyxlQUFlLENBQUM7SUFDdEMsS0FBSyxDQUFDLE1BQU0sR0FBRyxXQUFXLENBQUM7SUFDM0IsS0FBSyxDQUFDLE9BQU8sR0FBRyxZQUFZLENBQUM7QUFDL0IsQ0FBQztBQUVEOzs7Ozs7Ozs7R0FTRztBQUNILFNBQVMsV0FBVyxDQUFDLElBQVk7SUFDL0IsSUFBSSxJQUFJLEtBQUssT0FBTztRQUFFLE9BQU8sV0FBVyxDQUFDO0lBQ3pDLElBQUksSUFBSSxLQUFLLEtBQUs7UUFBRSxPQUFPLFNBQVMsQ0FBQztJQUNyQyxJQUFJLElBQUksS0FBSyxZQUFZO1FBQUUsT0FBTyxZQUFZLENBQUM7SUFDL0MsSUFBSSxJQUFJLEtBQUssV0FBVztRQUFFLE9BQU8sV0FBVyxDQUFDO0lBQzdDLElBQUksSUFBSSxLQUFLLFVBQVU7UUFBRSxPQUFPLFVBQVUsQ0FBQztJQUMzQyxJQUFJLElBQUksS0FBSyxVQUFVO1FBQUUsT0FBTyxVQUFVLENBQUM7SUFDM0MsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFBRSxRQUFnQixFQUFFLEtBQVEsRUFBRSxRQUFrQixFQUN4RixTQUFxQyxFQUFFLFVBQW1CO0lBQzVELFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztJQUNqRyxNQUFNLE9BQU8sR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUF3QixDQUFDO0lBQ3RFLElBQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFDN0IsSUFBSSxTQUF1QyxDQUFDO0lBQzVDLElBQUksQ0FBQyxVQUFVLElBQUksU0FBUyxJQUFJLElBQUksSUFBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtRQUN6RSxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDL0QsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQUUsaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNsRSxJQUFJLFNBQVMsRUFBRTtZQUNiLHNCQUFzQixDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDdEU7S0FDRjtTQUFNLElBQUksS0FBSyxDQUFDLElBQUksNkJBQXFCLEVBQUU7UUFDMUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUVqQyxJQUFJLFNBQVMsRUFBRTtZQUNiLDhCQUE4QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ3pDLElBQUksQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtnQkFDbkUsMEJBQTBCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQzthQUN0RTtZQUNELFNBQVMsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO1NBQ2pDO1FBRUQsdUZBQXVGO1FBQ3ZGLHlFQUF5RTtRQUN6RSxLQUFLLEdBQUcsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxJQUFJLEVBQUUsRUFBRSxRQUFRLENBQVMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO1FBQzNGLFFBQVEsQ0FBQyxXQUFXLENBQUMsT0FBbUIsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDNUQ7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLGtDQUF5QixFQUFFO1FBQzlDLHFEQUFxRDtRQUNyRCxzREFBc0Q7UUFDdEQsSUFBSSxTQUFTLElBQUksQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDN0QsMEJBQTBCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0RTtLQUNGO0FBQ0gsQ0FBQztBQUVELDZEQUE2RDtBQUM3RCxNQUFNLFVBQVUsaUJBQWlCLENBQUMsS0FBWSxFQUFFLFNBQWlCO0lBQy9ELFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsTUFBTSxtQkFBbUIsR0FBRyx3QkFBd0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDdkUsSUFBSSxDQUFDLENBQUMsbUJBQW1CLENBQUMsS0FBSyxDQUFDLGtDQUF5QixDQUFDLEVBQUU7UUFDMUQsbUJBQW1CLENBQUMsS0FBSyxDQUFDLDZCQUFvQixDQUFDO0tBQ2hEO0FBQ0gsQ0FBQztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxPQUEwQixFQUFFLElBQWUsRUFBRSxRQUFnQixFQUFFLEtBQVU7SUFDekYsTUFBTSxRQUFRLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2pDLFFBQVEsR0FBRyx5QkFBeUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUMvQyxNQUFNLFVBQVUsR0FBRywwQkFBMEIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyRCxJQUFJLElBQUksNkJBQXFCLEVBQUU7UUFDN0IsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1lBQ2pCLFFBQVEsQ0FBQyxlQUFlLENBQUUsT0FBb0IsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMzRDthQUFNO1lBQ0wsUUFBUSxDQUFDLFlBQVksQ0FBRSxPQUFvQixFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUNwRTtLQUNGO1NBQU07UUFDTCxNQUFNLFdBQVcsR0FDYixpQkFBaUIsQ0FBQyxZQUFZLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFVBQVUsRUFBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDdkYsUUFBUSxDQUFDLFFBQVEsQ0FBRSxPQUFvQixFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3ZEO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsS0FBWSxFQUFFLE9BQTBCLEVBQUUsSUFBZSxFQUFFLFNBQTZCLEVBQ3hGLEtBQVU7SUFDWixJQUFJLElBQUksR0FBRyxDQUFDLHdEQUF3QyxDQUFDLEVBQUU7UUFDckQ7Ozs7Ozs7V0FPRztRQUNILEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDNUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUMvRTtLQUNGO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQXdELEVBQ3BGLFNBQXdCO0lBQzFCLHlGQUF5RjtJQUN6RixXQUFXO0lBQ1gsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLElBQUksa0JBQWtCLEVBQUUsRUFBRTtRQUN4QixNQUFNLFVBQVUsR0FBbUMsU0FBUyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBQyxDQUFDO1FBQ3hGLE1BQU0sV0FBVyxHQUFHLHVCQUF1QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMxRCxJQUFJLGFBQTJDLENBQUM7UUFDaEQsSUFBSSxpQkFBeUMsQ0FBQztRQUU5QyxJQUFJLFdBQVcsS0FBSyxJQUFJLEVBQUU7WUFDeEIsYUFBYSxHQUFHLGlCQUFpQixHQUFHLElBQUksQ0FBQztTQUMxQzthQUFNO1lBQ0wsQ0FBQyxhQUFhLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxXQUFXLENBQUM7U0FDbEQ7UUFFRCxJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7WUFDMUIsb0JBQW9CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQ3pGO1FBQ0QsSUFBSSxVQUFVO1lBQUUsdUJBQXVCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxVQUFVLENBQUMsQ0FBQztLQUN2RTtJQUNELHdFQUF3RTtJQUN4RSxLQUFLLENBQUMsV0FBVyxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNyRSxDQUFDO0FBRUQsNkZBQTZGO0FBQzdGLE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsS0FBWSxFQUFFLEtBQXFCLEVBQUUsS0FBd0QsRUFDN0YsVUFBbUMsRUFBRSxVQUF5QyxFQUM5RSxpQkFBeUM7SUFDM0MsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLHdFQUF3RTtJQUN4RSwwRUFBMEU7SUFDMUUsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUMsa0JBQWtCLENBQUMsOEJBQThCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDN0Y7SUFFRCxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUU1RCw4RkFBOEY7SUFDOUYsa0JBQWtCO0lBQ2xCLCtDQUErQztJQUMvQyxtRkFBbUY7SUFDbkYsd0ZBQXdGO0lBQ3hGLGFBQWE7SUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMxQyxNQUFNLEdBQUcsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUIsSUFBSSxHQUFHLENBQUMsaUJBQWlCO1lBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQ3ZEO0lBQ0QsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUM7SUFDL0IsSUFBSSx1QkFBdUIsR0FBRyxLQUFLLENBQUM7SUFDcEMsSUFBSSxZQUFZLEdBQUcsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsVUFBVSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN2RSxTQUFTO1FBQ0wsVUFBVSxDQUNOLFlBQVksRUFBRSxLQUFLLENBQUMsY0FBYyxFQUNsQywyREFBMkQsQ0FBQyxDQUFDO0lBRXJFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1FBQzFDLE1BQU0sR0FBRyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQix3RkFBd0Y7UUFDeEYsa0VBQWtFO1FBQ2xFLEtBQUssQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLEtBQUssQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRXJFLDBCQUEwQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBRSxHQUFHLENBQUMsQ0FBQztRQUNuRSxtQkFBbUIsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1FBRW5ELElBQUksR0FBRyxDQUFDLGNBQWMsS0FBSyxJQUFJO1lBQUUsS0FBSyxDQUFDLEtBQUssc0NBQThCLENBQUM7UUFDM0UsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsU0FBUyxLQUFLLElBQUksSUFBSSxHQUFHLENBQUMsUUFBUSxLQUFLLENBQUM7WUFDM0UsS0FBSyxDQUFDLEtBQUssdUNBQThCLENBQUM7UUFFNUMsTUFBTSxjQUFjLEdBQXNDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO1FBQzdFLDJFQUEyRTtRQUMzRSxxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLGtCQUFrQjtZQUNuQixDQUFDLGNBQWMsQ0FBQyxXQUFXLElBQUksY0FBYyxDQUFDLFFBQVEsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDdkYsd0ZBQXdGO1lBQ3hGLDhFQUE4RTtZQUM5RSw0REFBNEQ7WUFDNUQsQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDL0Msa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1NBQzNCO1FBRUQsSUFBSSxDQUFDLHVCQUF1QixJQUFJLENBQUMsY0FBYyxDQUFDLFdBQVcsSUFBSSxjQUFjLENBQUMsU0FBUyxDQUFDLEVBQUU7WUFDeEYsQ0FBQyxLQUFLLENBQUMsa0JBQWtCLEtBQUssRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUNwRCx1QkFBdUIsR0FBRyxJQUFJLENBQUM7U0FDaEM7UUFFRCxZQUFZLEVBQUUsQ0FBQztLQUNoQjtJQUVELCtCQUErQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNuRSxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUsMEJBQTBCLENBQ3RDLEtBQVksRUFBRSxLQUFZLEVBQUUsWUFBb0IsRUFBRSxnQkFBd0IsRUFDMUUsR0FBd0M7SUFDMUMsU0FBUyxJQUFJLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRTFDLE1BQU0sWUFBWSxHQUFHLEdBQUcsQ0FBQyxZQUFZLENBQUM7SUFDdEMsSUFBSSxZQUFZLEVBQUU7UUFDaEIsSUFBSSxrQkFBa0IsR0FBRyxLQUFLLENBQUMsa0JBQWtCLENBQUM7UUFDbEQsSUFBSSxrQkFBa0IsS0FBSyxJQUFJLEVBQUU7WUFDL0Isa0JBQWtCLEdBQUcsS0FBSyxDQUFDLGtCQUFrQixHQUFHLEVBQStCLENBQUM7U0FDakY7UUFDRCxNQUFNLFdBQVcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDakMsSUFBSSxzQkFBc0IsQ0FBQyxrQkFBa0IsQ0FBQyxJQUFJLFdBQVcsRUFBRTtZQUM3RCwrRUFBK0U7WUFDL0UsaUZBQWlGO1lBQ2pGLGlDQUFpQztZQUNqQyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDdEM7UUFDRCxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGdCQUFnQixFQUFFLFlBQVksQ0FBQyxDQUFDO0tBQ3ZFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLHNCQUFzQixDQUFDLGtCQUFzQztJQUNwRSxJQUFJLENBQUMsR0FBRyxrQkFBa0IsQ0FBQyxNQUFNLENBQUM7SUFDbEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1FBQ1osTUFBTSxLQUFLLEdBQUcsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUN0QyxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUFFO1lBQzFDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7S0FDRjtJQUNELE9BQU8sQ0FBQyxDQUFDO0FBQ1gsQ0FBQztBQUdEOztHQUVHO0FBQ0gsU0FBUyx3QkFBd0IsQ0FDN0IsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUF5QixFQUFFLE1BQWE7SUFDdEUsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQztJQUNuQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDO0lBRS9CLDJFQUEyRTtJQUMzRSw0RUFBNEU7SUFDNUUsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDMUIsU0FBUyxJQUFJLGVBQWUsQ0FBQyxLQUFLLDZCQUFxQixDQUFDO1FBQ3hELGlCQUFpQixDQUNiLEtBQUssRUFBRSxLQUFxQixFQUM1QixLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsZUFBZSxDQUEwQixDQUFDLENBQUM7S0FDekU7SUFFRCxJQUFJLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRTtRQUMxQiw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDOUM7SUFFRCxlQUFlLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRS9CLE1BQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUM7SUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUNoQyxNQUFNLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBc0IsQ0FBQztRQUMvQyxNQUFNLFNBQVMsR0FBRyxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUM1RCxlQUFlLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRWxDLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtZQUMxQixrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEtBQUssRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxhQUFjLENBQUMsQ0FBQztTQUM3RTtRQUVELElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbkUsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3BFO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsTUFBTSxVQUFVLDRCQUE0QixDQUFDLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUNuRixNQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYyxDQUFDO0lBQ25DLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZLENBQUM7SUFDL0IsTUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUNqQyxNQUFNLHFCQUFxQixHQUFHLHdCQUF3QixFQUFFLENBQUM7SUFDekQsSUFBSTtRQUNGLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDO1FBQy9CLEtBQUssSUFBSSxRQUFRLEdBQUcsS0FBSyxFQUFFLFFBQVEsR0FBRyxHQUFHLEVBQUUsUUFBUSxFQUFFLEVBQUU7WUFDckQsTUFBTSxHQUFHLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQTBCLENBQUM7WUFDMUQsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xDLHdCQUF3QixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ25DLElBQUksR0FBRyxDQUFDLFlBQVksS0FBSyxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxDQUFDLElBQUksR0FBRyxDQUFDLFNBQVMsS0FBSyxJQUFJLEVBQUU7Z0JBQzdFLGdDQUFnQyxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsQ0FBQzthQUNsRDtTQUNGO0tBQ0Y7WUFBUztRQUNSLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckIsd0JBQXdCLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUNqRDtBQUNILENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQU0sVUFBVSxnQ0FBZ0MsQ0FBQyxHQUFzQixFQUFFLFNBQWM7SUFDckYsSUFBSSxHQUFHLENBQUMsWUFBWSxLQUFLLElBQUksRUFBRTtRQUM3QixHQUFHLENBQUMsWUFBYSw2QkFBcUIsU0FBUyxDQUFDLENBQUM7S0FDbEQ7QUFDSCxDQUFDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsS0FBWSxFQUFFLEtBQXdEO0lBRXhFLFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxTQUFTLElBQUksZUFBZSxDQUFDLEtBQUssRUFBRSw0REFBMkMsQ0FBQyxDQUFDO0lBRWpGLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQztJQUN6QyxJQUFJLE9BQU8sR0FBaUMsSUFBSSxDQUFDO0lBQ2pELElBQUksaUJBQWlCLEdBQTJCLElBQUksQ0FBQztJQUNyRCxJQUFJLFFBQVEsRUFBRTtRQUNaLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLE1BQU0sR0FBRyxHQUFHLFFBQVEsQ0FBQyxDQUFDLENBQXlDLENBQUM7WUFDaEUsSUFBSSwwQkFBMEIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLFNBQVUsRUFBRSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbkYsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQyxDQUFDO2dCQUUxQixJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDdkIsSUFBSSxTQUFTLEVBQUU7d0JBQ2IsZUFBZSxDQUNYLEtBQUssNkJBQ0wsSUFBSSxLQUFLLENBQUMsS0FBSyw0Q0FBNEM7NEJBQ3ZELDhDQUE4QyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQzt3QkFFeEYsSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUU7NEJBQzFCLDJCQUEyQixDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBRSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7eUJBQ2xGO3FCQUNGO29CQUVELG9GQUFvRjtvQkFDcEYsb0ZBQW9GO29CQUNwRixnRkFBZ0Y7b0JBQ2hGLGdGQUFnRjtvQkFDaEYsdUZBQXVGO29CQUN2Rix1RkFBdUY7b0JBQ3ZGLGtFQUFrRTtvQkFDbEUsaUNBQWlDO29CQUNqQywrREFBK0Q7b0JBQy9ELGtDQUFrQztvQkFDbEMsSUFBSSxHQUFHLENBQUMscUJBQXFCLEtBQUssSUFBSSxFQUFFO3dCQUN0QyxNQUFNLG9CQUFvQixHQUE0QixFQUFFLENBQUM7d0JBQ3pELGlCQUFpQixHQUFHLGlCQUFpQixJQUFJLElBQUksR0FBRyxFQUFFLENBQUM7d0JBQ25ELEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsb0JBQW9CLEVBQUUsaUJBQWlCLENBQUMsQ0FBQzt3QkFDeEUsd0ZBQXdGO3dCQUN4RixvRkFBb0Y7d0JBQ3BGLDJCQUEyQjt3QkFDM0IsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxDQUFDO3dCQUM5QyxnRkFBZ0Y7d0JBQ2hGLE1BQU0sZUFBZSxHQUFHLG9CQUFvQixDQUFDLE1BQU0sQ0FBQzt3QkFDcEQsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztxQkFDcEQ7eUJBQU07d0JBQ0wscURBQXFEO3dCQUNyRCxpREFBaUQ7d0JBQ2pELE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ3JCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7cUJBQ3RDO2lCQUNGO3FCQUFNO29CQUNMLG1EQUFtRDtvQkFDbkQsaUJBQWlCLEdBQUcsaUJBQWlCLElBQUksSUFBSSxHQUFHLEVBQUUsQ0FBQztvQkFDbkQsR0FBRyxDQUFDLHFCQUFxQixFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUM3RCxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2lCQUNuQjthQUNGO1NBQ0Y7S0FDRjtJQUNELE9BQU8sT0FBTyxLQUFLLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ2hFLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVksRUFBRSxTQUFnQixFQUFFLGVBQXVCO0lBQ3pGLFNBQVMsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUMxQyxTQUFTLElBQUksaUJBQWlCLENBQUMsZUFBZSxFQUFFLENBQUMsQ0FBQyxFQUFFLHVDQUF1QyxDQUFDLENBQUM7SUFDN0YsU0FBUyxDQUFDLGVBQWUsR0FBRyxlQUFlLENBQUM7SUFDNUMsQ0FBQyxLQUFLLENBQUMsVUFBVSxLQUFLLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVELDhGQUE4RjtBQUM5RixTQUFTLHVCQUF1QixDQUM1QixLQUFZLEVBQUUsU0FBd0IsRUFBRSxVQUFtQztJQUM3RSxJQUFJLFNBQVMsRUFBRTtRQUNiLE1BQU0sVUFBVSxHQUFzQixLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztRQUU1RCxtRkFBbUY7UUFDbkYsK0VBQStFO1FBQy9FLDBDQUEwQztRQUMxQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzVDLE1BQU0sS0FBSyxHQUFHLFVBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDM0MsSUFBSSxLQUFLLElBQUksSUFBSTtnQkFDZixNQUFNLElBQUksWUFBWSwrQ0FFbEIsU0FBUyxJQUFJLG1CQUFtQixTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxjQUFjLENBQUMsQ0FBQztZQUN0RSxVQUFVLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUN0QztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsbUJBQW1CLENBQ3hCLFlBQW9CLEVBQUUsR0FBd0MsRUFDOUQsVUFBd0M7SUFDMUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUU7WUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQzthQUM1QztTQUNGO1FBQ0QsSUFBSSxjQUFjLENBQUMsR0FBRyxDQUFDO1lBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHLFlBQVksQ0FBQztLQUN4RDtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLGNBQWMsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLGtCQUEwQjtJQUNwRixTQUFTO1FBQ0wsY0FBYyxDQUNWLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFDN0Qsc0NBQXNDLENBQUMsQ0FBQztJQUNoRCxLQUFLLENBQUMsS0FBSyxzQ0FBOEIsQ0FBQztJQUMxQyxnRUFBZ0U7SUFDaEUsS0FBSyxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDN0IsS0FBSyxDQUFDLFlBQVksR0FBRyxLQUFLLEdBQUcsa0JBQWtCLENBQUM7SUFDaEQsS0FBSyxDQUFDLGVBQWUsR0FBRyxLQUFLLENBQUM7QUFDaEMsQ0FBQztBQUVEOzs7Ozs7Ozs7OztHQVdHO0FBQ0gsTUFBTSxVQUFVLDBCQUEwQixDQUN0QyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVksRUFBRSxjQUFzQixFQUFFLEdBQW9CO0lBQ3hGLFNBQVM7UUFDTCx3QkFBd0IsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLDRCQUE0QixDQUFDLENBQUM7SUFDMUYsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsR0FBRyxHQUFHLENBQUM7SUFDakMsTUFBTSxnQkFBZ0IsR0FDbEIsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFFLEdBQTJCLENBQUMsT0FBTyxHQUFHLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDMUYsa0dBQWtHO0lBQ2xHLCtGQUErRjtJQUMvRiw2REFBNkQ7SUFDN0QsTUFBTSxtQkFBbUIsR0FDckIsSUFBSSxtQkFBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUN0RixLQUFLLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxHQUFHLG1CQUFtQixDQUFDO0lBQ3RELEtBQUssQ0FBQyxjQUFjLENBQUMsR0FBRyxtQkFBbUIsQ0FBQztJQUU1QywwQkFBMEIsQ0FDdEIsS0FBSyxFQUFFLEtBQUssRUFBRSxjQUFjLEVBQUUsWUFBWSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUM5RixDQUFDO0FBRUQsU0FBUyxpQkFBaUIsQ0FBSSxLQUFZLEVBQUUsU0FBdUIsRUFBRSxHQUFvQjtJQUN2RixNQUFNLE1BQU0sR0FBRyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFhLENBQUM7SUFDOUQsTUFBTSxLQUFLLEdBQUcseUJBQXlCLENBQUMsR0FBRyxDQUFDLENBQUM7SUFFN0MscUZBQXFGO0lBQ3JGLGtGQUFrRjtJQUNsRixNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBQzNELE1BQU0sYUFBYSxHQUFHLGFBQWEsQ0FDL0IsS0FBSyxFQUNMLFdBQVcsQ0FDUCxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUMsMkJBQWtCLENBQUMsZ0NBQXVCLEVBQUUsTUFBTSxFQUNsRixTQUF5QixFQUFFLElBQUksRUFBRSxlQUFlLENBQUMsY0FBYyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUN4RixJQUFJLENBQUMsQ0FBQyxDQUFDO0lBRWYseUVBQXlFO0lBQ3pFLGdFQUFnRTtJQUNoRSxLQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLGFBQWEsQ0FBQztBQUN6QyxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxLQUFZLEVBQUUsS0FBWSxFQUFFLElBQVksRUFBRSxLQUFVLEVBQUUsU0FBcUMsRUFDM0YsU0FBZ0M7SUFDbEMsSUFBSSxTQUFTLEVBQUU7UUFDYixhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztRQUNwRiw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQyxlQUFlLENBQ1gsS0FBSyw2QkFDTCxnQ0FBZ0MsSUFBSSwwQkFBMEI7WUFDMUQsNkRBQTZELENBQUMsQ0FBQztLQUN4RTtJQUNELE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWEsQ0FBQztJQUMzRCxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDaEcsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FDL0IsUUFBa0IsRUFBRSxPQUFpQixFQUFFLFNBQWdDLEVBQUUsT0FBb0IsRUFDN0YsSUFBWSxFQUFFLEtBQVUsRUFBRSxTQUFxQztJQUNqRSxJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7UUFDakIsU0FBUyxJQUFJLFNBQVMsQ0FBQyx1QkFBdUIsRUFBRSxDQUFDO1FBQ2pELFFBQVEsQ0FBQyxlQUFlLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNwRDtTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQzlDLE1BQU0sUUFBUSxHQUNWLFNBQVMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxPQUFPLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBR3ZGLFFBQVEsQ0FBQyxZQUFZLENBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxRQUFrQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3JFO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsU0FBUyxrQkFBa0IsQ0FDdkIsS0FBWSxFQUFFLGNBQXNCLEVBQUUsUUFBVyxFQUFFLEdBQW9CLEVBQUUsS0FBWSxFQUNyRixnQkFBa0M7SUFDcEMsTUFBTSxhQUFhLEdBQXVCLGdCQUFpQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzVFLElBQUksYUFBYSxLQUFLLElBQUksRUFBRTtRQUMxQixNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzlCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxHQUFHO1lBQ3pDLE1BQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3RDLE1BQU0sV0FBVyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ2pDLElBQUksUUFBUSxLQUFLLElBQUksRUFBRTtnQkFDckIsR0FBRyxDQUFDLFFBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQzthQUN6RDtpQkFBTTtnQkFDSixRQUFnQixDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQzthQUN4QztZQUNELElBQUksU0FBUyxFQUFFO2dCQUNiLE1BQU0sYUFBYSxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWEsQ0FBQztnQkFDakUsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUM1RTtTQUNGO0tBQ0Y7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxTQUFTLHFCQUFxQixDQUMxQixNQUF1QixFQUFFLGNBQXNCLEVBQUUsS0FBa0I7SUFDckUsSUFBSSxhQUFhLEdBQXVCLElBQUksQ0FBQztJQUM3QyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDVixPQUFPLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO1FBQ3ZCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxQixJQUFJLFFBQVEseUNBQWlDLEVBQUU7WUFDN0MsbURBQW1EO1lBQ25ELENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTO1NBQ1Y7YUFBTSxJQUFJLFFBQVEsc0NBQThCLEVBQUU7WUFDakQscUNBQXFDO1lBQ3JDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDUCxTQUFTO1NBQ1Y7UUFFRCw0RkFBNEY7UUFDNUYsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRO1lBQUUsTUFBTTtRQUV4QyxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsUUFBa0IsQ0FBQyxFQUFFO1lBQzdDLElBQUksYUFBYSxLQUFLLElBQUk7Z0JBQUUsYUFBYSxHQUFHLEVBQUUsQ0FBQztZQUUvQyxzRkFBc0Y7WUFDdEYsd0ZBQXdGO1lBQ3hGLHNDQUFzQztZQUN0QyxNQUFNLFdBQVcsR0FBRyxNQUFNLENBQUMsUUFBa0IsQ0FBQyxDQUFDO1lBQy9DLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQzlDLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxLQUFLLGNBQWMsRUFBRTtvQkFDckMsYUFBYSxDQUFDLElBQUksQ0FDZCxRQUFrQixFQUFFLFdBQVcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFXLEVBQUUsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsQ0FBQyxDQUFDO29CQUM5RSxrRkFBa0Y7b0JBQ2xGLE1BQU07aUJBQ1A7YUFDRjtTQUNGO1FBRUQsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNSO0lBQ0QsT0FBTyxhQUFhLENBQUM7QUFDdkIsQ0FBQztBQUVELDBCQUEwQjtBQUMxQix5QkFBeUI7QUFDekIsMEJBQTBCO0FBRTFCOzs7Ozs7Ozs7R0FTRztBQUNILE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsVUFBbUMsRUFBRSxXQUFrQixFQUFFLE1BQWdCLEVBQ3pFLEtBQVk7SUFDZCxTQUFTLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sVUFBVSxHQUFlO1FBQzdCLFVBQVU7UUFDVixJQUFJO1FBQ0osS0FBSztRQUNMLFdBQVc7UUFDWCxJQUFJO1FBQ0osQ0FBQztRQUNELEtBQUs7UUFDTCxNQUFNO1FBQ04sSUFBSTtRQUNKLElBQUk7UUFDSixJQUFJLEVBQVUsbUJBQW1CO0tBQ2xDLENBQUM7SUFDRixTQUFTO1FBQ0wsV0FBVyxDQUNQLFVBQVUsQ0FBQyxNQUFNLEVBQUUsdUJBQXVCLEVBQzFDLGdFQUFnRSxDQUFDLENBQUM7SUFDMUUsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVEOzs7R0FHRztBQUNILFNBQVMsb0JBQW9CLENBQUMsS0FBWTtJQUN4QyxLQUFLLElBQUksVUFBVSxHQUFHLGtCQUFrQixDQUFDLEtBQUssQ0FBQyxFQUFFLFVBQVUsS0FBSyxJQUFJLEVBQy9ELFVBQVUsR0FBRyxpQkFBaUIsQ0FBQyxVQUFVLENBQUMsRUFBRTtRQUMvQyxLQUFLLElBQUksQ0FBQyxHQUFHLHVCQUF1QixFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hFLE1BQU0sYUFBYSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNwQyxNQUFNLGFBQWEsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDM0MsU0FBUyxJQUFJLGFBQWEsQ0FBQyxhQUFhLEVBQUUseUJBQXlCLENBQUMsQ0FBQztZQUNyRSxJQUFJLDRCQUE0QixDQUFDLGFBQWEsQ0FBQyxFQUFFO2dCQUMvQyxXQUFXLENBQUMsYUFBYSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO2FBQzVGO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUywrQkFBK0IsQ0FBQyxLQUFZO0lBQ25ELEtBQUssSUFBSSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBVSxLQUFLLElBQUksRUFDL0QsVUFBVSxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQy9DLElBQUksQ0FBQyxVQUFVLENBQUMsc0JBQXNCLENBQUM7WUFBRSxTQUFTO1FBRWxELE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUUsQ0FBQztRQUM1QyxTQUFTLElBQUksYUFBYSxDQUFDLFVBQVUsRUFBRSxxREFBcUQsQ0FBQyxDQUFDO1FBQzlGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFDLE1BQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUUsQ0FBQztZQUNsQyxNQUFNLG1CQUFtQixHQUFHLFVBQVUsQ0FBQyxNQUFNLENBQWUsQ0FBQztZQUM3RCxTQUFTLElBQUksZ0JBQWdCLENBQUMsbUJBQW1CLENBQUMsQ0FBQztZQUNuRCxtRkFBbUY7WUFDbkYsV0FBVztZQUNYLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLCtDQUFxQyxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNsRSwyQkFBMkIsQ0FBQyxtQkFBbUIsRUFBRSxDQUFDLENBQUMsQ0FBQzthQUNyRDtZQUNELDJGQUEyRjtZQUMzRix5RkFBeUY7WUFDekYsZ0VBQWdFO1lBQ2hFLGlFQUFpRTtZQUNqRSxVQUFVLENBQUMsS0FBSyxDQUFDLGdEQUFzQyxDQUFDO1NBQ3pEO0tBQ0Y7QUFDSCxDQUFDO0FBRUQsYUFBYTtBQUViOzs7O0dBSUc7QUFDSCxTQUFTLGdCQUFnQixDQUFDLFNBQWdCLEVBQUUsZ0JBQXdCO0lBQ2xFLFNBQVMsSUFBSSxXQUFXLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxFQUFFLEtBQUssRUFBRSw4QkFBOEIsQ0FBQyxDQUFDO0lBQzNGLE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVFLHdGQUF3RjtJQUN4RixJQUFJLDRCQUE0QixDQUFDLGFBQWEsQ0FBQyxFQUFFO1FBQy9DLE1BQU0sS0FBSyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLDJEQUF5QyxDQUFDLEVBQUU7WUFDdEUsV0FBVyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxhQUFhLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztTQUMzRTthQUFNLElBQUksYUFBYSxDQUFDLDZCQUE2QixDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNELHdGQUF3RjtZQUN4Rix3QkFBd0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztTQUN6QztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyx3QkFBd0IsQ0FBQyxLQUFZO0lBQzVDLEtBQUssSUFBSSxVQUFVLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBVSxLQUFLLElBQUksRUFDL0QsVUFBVSxHQUFHLGlCQUFpQixDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQy9DLEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDaEUsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3BDLElBQUksNEJBQTRCLENBQUMsYUFBYSxDQUFDLEVBQUU7Z0JBQy9DLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQywrQ0FBcUMsRUFBRTtvQkFDN0QsTUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO29CQUMzQyxTQUFTLElBQUksYUFBYSxDQUFDLGFBQWEsRUFBRSx5QkFBeUIsQ0FBQyxDQUFDO29CQUNyRSxXQUFXLENBQ1AsYUFBYSxFQUFFLGFBQWEsRUFBRSxhQUFhLENBQUMsUUFBUSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUUsQ0FBQyxDQUFDO2lCQUVwRjtxQkFBTSxJQUFJLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxHQUFHLENBQUMsRUFBRTtvQkFDM0Qsd0JBQXdCLENBQUMsYUFBYSxDQUFDLENBQUM7aUJBQ3pDO2FBQ0Y7U0FDRjtLQUNGO0lBRUQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLGlDQUFpQztJQUNqQyxNQUFNLFVBQVUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDO0lBQ3BDLElBQUksVUFBVSxLQUFLLElBQUksRUFBRTtRQUN2QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUMxQyxNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckUsd0ZBQXdGO1lBQ3hGLElBQUksNEJBQTRCLENBQUMsYUFBYSxDQUFDO2dCQUMzQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsR0FBRyxDQUFDLEVBQUU7Z0JBQ3BELHdCQUF3QixDQUFDLGFBQWEsQ0FBQyxDQUFDO2FBQ3pDO1NBQ0Y7S0FDRjtBQUNILENBQUM7QUFFRCxTQUFTLGVBQWUsQ0FBQyxTQUFnQixFQUFFLGdCQUF3QjtJQUNqRSxTQUFTLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsRUFBRSxJQUFJLEVBQUUsZ0NBQWdDLENBQUMsQ0FBQztJQUM1RixNQUFNLGFBQWEsR0FBRyx3QkFBd0IsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUM1RSxNQUFNLGNBQWMsR0FBRyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUMscUJBQXFCLENBQUMsY0FBYyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0lBRXJELE1BQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN0QyxrRkFBa0Y7SUFDbEYsSUFBSSxTQUFTLEtBQUssSUFBSSxJQUFJLGFBQWEsQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDM0QsYUFBYSxDQUFDLFNBQVMsQ0FBQyxHQUFHLHFCQUFxQixDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsUUFBUSxDQUFFLENBQUMsQ0FBQztLQUN2RjtJQUVELFVBQVUsQ0FBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLENBQUM7QUFFRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkc7QUFDSCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDMUQsS0FBSyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILE1BQU0sVUFBVSxhQUFhLENBQTZCLEtBQVksRUFBRSxpQkFBb0I7SUFDMUYsK0ZBQStGO0lBQy9GLGtHQUFrRztJQUNsRyx5RkFBeUY7SUFDekYsMERBQTBEO0lBQzFELElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3JCLEtBQUssQ0FBQyxVQUFVLENBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztLQUM5QztTQUFNO1FBQ0wsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0tBQ3ZDO0lBQ0QsS0FBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0lBQ3RDLE9BQU8saUJBQWlCLENBQUM7QUFDM0IsQ0FBQztBQUVELCtCQUErQjtBQUMvQixxQkFBcUI7QUFDckIsK0JBQStCO0FBQy9CLE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFVLEVBQUUsa0JBQWtCLEdBQUcsSUFBSTtJQUNuRSxNQUFNLGVBQWUsR0FBRyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsZUFBZSxDQUFDO0lBRTNELHlGQUF5RjtJQUN6Riw2RkFBNkY7SUFDN0Ysc0NBQXNDO0lBQ3RDLE1BQU0sa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBRW5FLElBQUksQ0FBQyxrQkFBa0IsSUFBSSxlQUFlLENBQUMsS0FBSztRQUFFLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMxRSxJQUFJO1FBQ0YsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNwRDtJQUFDLE9BQU8sS0FBSyxFQUFFO1FBQ2QsSUFBSSxrQkFBa0IsRUFBRTtZQUN0QixXQUFXLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzNCO1FBQ0QsTUFBTSxLQUFLLENBQUM7S0FDYjtZQUFTO1FBQ1IsSUFBSSxDQUFDLGtCQUFrQixJQUFJLGVBQWUsQ0FBQyxHQUFHO1lBQUUsZUFBZSxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBRXRFLDRGQUE0RjtRQUM1RiwwQkFBMEI7UUFDMUIsQ0FBQyxrQkFBa0IsSUFBSSxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsYUFBYSxFQUFFLEtBQUssRUFBRSxDQUFDO0tBQ2xFO0FBQ0gsQ0FBQztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsS0FBWSxFQUFFLEtBQVksRUFBRSxPQUFVLEVBQUUsa0JBQWtCLEdBQUcsSUFBSTtJQUNuRSx5QkFBeUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNoQyxJQUFJO1FBQ0YscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsa0JBQWtCLENBQUMsQ0FBQztLQUNsRTtZQUFTO1FBQ1IseUJBQXlCLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEM7QUFDSCxDQUFDO0FBRUQsU0FBUyxrQkFBa0IsQ0FDdkIsS0FBa0IsRUFBRSxXQUFtQyxFQUFFLFNBQVk7SUFDdkUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxXQUFXLEVBQUUsbURBQW1ELENBQUMsQ0FBQztJQUM3RixvQkFBb0IsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN4QixXQUFXLENBQUMsS0FBSyxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQ2hDLENBQUM7QUFFRCwrQkFBK0I7QUFDL0IsOEJBQThCO0FBQzlCLCtCQUErQjtBQUUvQjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0FvQkc7QUFDSCxNQUFNLFVBQVUsNEJBQTRCLENBQ3hDLEtBQVksRUFBRSxLQUFZLEVBQUUsWUFBb0IsRUFBRSxZQUFvQixFQUN0RSxHQUFHLGtCQUE0QjtJQUNqQyw4RkFBOEY7SUFDOUYsZ0dBQWdHO0lBQ2hHLGtGQUFrRjtJQUNsRixJQUFJLEtBQUssQ0FBQyxZQUFZLENBQUMsS0FBSyxJQUFJLEVBQUU7UUFDaEMsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUU7WUFDdkQsTUFBTSxlQUFlLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixJQUFJLENBQUMsS0FBSyxDQUFDLGdCQUFnQixHQUFHLEVBQUUsQ0FBQyxDQUFDO1lBQ2hGLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDbkMsSUFBSSxlQUFlLEdBQUcsWUFBWSxDQUFDO1lBQ25DLElBQUksa0JBQWtCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDakMsZUFBZTtvQkFDWCx1QkFBdUIsR0FBRyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsdUJBQXVCLENBQUMsQ0FBQzthQUNoRjtZQUNELEtBQUssQ0FBQyxZQUFZLENBQUMsR0FBRyxlQUFlLENBQUM7U0FDdkM7S0FDRjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBVztJQUNqRCxxRkFBcUY7SUFDckYsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxLQUFZO0lBQ2xELE9BQU8sS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDL0MsQ0FBQztBQUVEOzs7R0FHRztBQUNILE1BQU0sVUFBVSxxQkFBcUIsQ0FDakMsVUFBa0MsRUFBRSxLQUFZLEVBQUUsS0FBWTtJQUNoRSw2RkFBNkY7SUFDN0Ysa0dBQWtHO0lBQ2xHLGlHQUFpRztJQUNqRyxrR0FBa0c7SUFDbEcsMEZBQTBGO0lBQzFGLGNBQWM7SUFDZCxJQUFJLFVBQVUsS0FBSyxJQUFJLElBQUksY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3JELEtBQUssR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBRSxDQUFDO0tBQzFDO0lBQ0QsT0FBTyxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDekIsQ0FBQztBQUVELDJDQUEyQztBQUMzQyxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVksRUFBRSxLQUFVO0lBQ2xELE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNqQyxNQUFNLFlBQVksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDeEUsWUFBWSxJQUFJLFlBQVksQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDbEQsQ0FBQztBQUVEOzs7Ozs7OztHQVFHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUNoQyxLQUFZLEVBQUUsS0FBWSxFQUFFLE1BQTBCLEVBQUUsVUFBa0IsRUFBRSxLQUFVO0lBQ3hGLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxHQUFHO1FBQ2xDLE1BQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBVyxDQUFDO1FBQ3BDLE1BQU0sV0FBVyxHQUFHLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBVyxDQUFDO1FBQzFDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUM5QixTQUFTLElBQUksa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLE1BQU0sR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFzQixDQUFDO1FBQ25ELElBQUksR0FBRyxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUU7WUFDekIsR0FBRyxDQUFDLFFBQVMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztTQUN6RDthQUFNO1lBQ0wsUUFBUSxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUMvQjtLQUNGO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVksRUFBRSxLQUFhLEVBQUUsS0FBYTtJQUM1RSxTQUFTLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQzdELFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUNyRixTQUFTLElBQUksa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlDLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWlCLENBQUM7SUFDL0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUNuRSxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi8uLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtTS0lQX0hZRFJBVElPTl9BVFRSX05BTUV9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge1BSRVNFUlZFX0hPU1RfQ09OVEVOVCwgUFJFU0VSVkVfSE9TVF9DT05URU5UX0RFRkFVTFR9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi90b2tlbnMnO1xuaW1wb3J0IHtwcm9jZXNzVGV4dE5vZGVNYXJrZXJzQmVmb3JlSHlkcmF0aW9uLCByZXRyaWV2ZUh5ZHJhdGlvbkluZm99IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi91dGlscyc7XG5pbXBvcnQge0RvQ2hlY2ssIE9uQ2hhbmdlcywgT25Jbml0fSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7U2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzLCB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbCwgYXNzZXJ0SW5kZXhJblJhbmdlLCBhc3NlcnROb3RFcXVhbCwgYXNzZXJ0Tm90U2FtZSwgYXNzZXJ0U2FtZSwgYXNzZXJ0U3RyaW5nfSBmcm9tICcuLi8uLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge2VzY2FwZUNvbW1lbnRUZXh0fSBmcm9tICcuLi8uLi91dGlsL2RvbSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi8uLi91dGlsL25nX3JlZmxlY3QnO1xuaW1wb3J0IHtzdHJpbmdpZnl9IGZyb20gJy4uLy4uL3V0aWwvc3RyaW5naWZ5JztcbmltcG9ydCB7YXNzZXJ0Rmlyc3RDcmVhdGVQYXNzLCBhc3NlcnRGaXJzdFVwZGF0ZVBhc3MsIGFzc2VydExDb250YWluZXIsIGFzc2VydExWaWV3LCBhc3NlcnRUTm9kZUZvckxWaWV3LCBhc3NlcnRUTm9kZUZvclRWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7ZXhlY3V0ZUNoZWNrSG9va3MsIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcywgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIEhBU19UUkFOU1BMQU5URURfVklFV1MsIExDb250YWluZXIsIE1PVkVEX1ZJRVdTfSBmcm9tICcuLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudERlZiwgQ29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZiwgRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSwgSG9zdEJpbmRpbmdzRnVuY3Rpb24sIEhvc3REaXJlY3RpdmVCaW5kaW5nTWFwLCBIb3N0RGlyZWN0aXZlRGVmcywgUGlwZURlZkxpc3RPckZhY3RvcnksIFJlbmRlckZsYWdzLCBWaWV3UXVlcmllc0Z1bmN0aW9ufSBmcm9tICcuLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOb2RlSW5qZWN0b3JGYWN0b3J5fSBmcm9tICcuLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7Z2V0VW5pcXVlTFZpZXdJZH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9sdmlld190cmFja2luZyc7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgSW5pdGlhbElucHV0RGF0YSwgSW5pdGlhbElucHV0cywgTG9jYWxSZWZFeHRyYWN0b3IsIFByb3BlcnR5QWxpYXNlcywgUHJvcGVydHlBbGlhc1ZhbHVlLCBUQXR0cmlidXRlcywgVENvbnN0YW50c09yRmFjdG9yeSwgVENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFRJY3VDb250YWluZXJOb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGV9IGZyb20gJy4uL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1JlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7UkNvbW1lbnQsIFJFbGVtZW50LCBSTm9kZSwgUlRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXJfZG9tJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdCwgaXNDb250ZW50UXVlcnlIb3N0LCBpc1Jvb3RWaWV3fSBmcm9tICcuLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7Q0hJTERfSEVBRCwgQ0hJTERfVEFJTCwgQ0xFQU5VUCwgQ09OVEVYVCwgREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVcsIERFQ0xBUkFUSU9OX1ZJRVcsIEVNQkVEREVEX1ZJRVdfSU5KRUNUT1IsIEVOVklST05NRU5ULCBGTEFHUywgSEVBREVSX09GRlNFVCwgSE9TVCwgSG9zdEJpbmRpbmdPcENvZGVzLCBIWURSQVRJT04sIElELCBJbml0UGhhc2VTdGF0ZSwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0Vudmlyb25tZW50LCBMVmlld0ZsYWdzLCBORVhULCBPTl9ERVNUUk9ZX0hPT0tTLCBQQVJFTlQsIFJFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUiwgUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVIsIFJFTkRFUkVSLCBUX0hPU1QsIFREYXRhLCBUUkFOU1BMQU5URURfVklFV1NfVE9fUkVGUkVTSCwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFB1cmVUTm9kZVR5cGUsIGFzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtjbGVhckVsZW1lbnRDb250ZW50cywgdXBkYXRlVGV4dE5vZGV9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNJbmxpbmVUZW1wbGF0ZSwgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge3Byb2ZpbGVyLCBQcm9maWxlckV2ZW50fSBmcm9tICcuLi9wcm9maWxlcic7XG5pbXBvcnQge2NvbW1pdExWaWV3Q29uc3VtZXJJZkhhc1Byb2R1Y2VycywgZ2V0UmVhY3RpdmVMVmlld0NvbnN1bWVyfSBmcm9tICcuLi9yZWFjdGl2ZV9sdmlld19jb25zdW1lcic7XG5pbXBvcnQge2VudGVyVmlldywgZ2V0QmluZGluZ3NFbmFibGVkLCBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgsIGdldEN1cnJlbnRQYXJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaywgZ2V0U2VsZWN0ZWRJbmRleCwgaXNDdXJyZW50VE5vZGVQYXJlbnQsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGlzSW5JMThuQmxvY2ssIGxlYXZlVmlldywgc2V0QmluZGluZ0luZGV4LCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0Q3VycmVudFROb2RlLCBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7bWVyZ2VIb3N0QXR0cnN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldEZpcnN0TENvbnRhaW5lciwgZ2V0TFZpZXdQYXJlbnQsIGdldE5leHRMQ29udGFpbmVyfSBmcm9tICcuLi91dGlsL3ZpZXdfdHJhdmVyc2FsX3V0aWxzJztcbmltcG9ydCB7Z2V0Q29tcG9uZW50TFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlLCBpc0NyZWF0aW9uTW9kZSwgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwTFZpZXcsIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudCwgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuaW1wb3J0IHtzZWxlY3RJbmRleEludGVybmFsfSBmcm9tICcuL2FkdmFuY2UnO1xuaW1wb3J0IHvJtcm1ZGlyZWN0aXZlSW5qZWN0fSBmcm9tICcuL2RpJztcbmltcG9ydCB7aGFuZGxlVW5rbm93blByb3BlcnR5RXJyb3IsIGlzUHJvcGVydHlWYWxpZCwgbWF0Y2hpbmdTY2hlbWFzfSBmcm9tICcuL2VsZW1lbnRfdmFsaWRhdGlvbic7XG5cbi8qKlxuICogSW52b2tlIGBIb3N0QmluZGluZ3NGdW5jdGlvbmBzIGZvciB2aWV3LlxuICpcbiAqIFRoaXMgbWV0aG9kcyBleGVjdXRlcyBgVFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzYC4gSXQgaXMgdXNlZCB0byBleGVjdXRlIHRoZVxuICogYEhvc3RCaW5kaW5nc0Z1bmN0aW9uYHMgYXNzb2NpYXRlZCB3aXRoIHRoZSBjdXJyZW50IGBMVmlld2AuXG4gKlxuICogQHBhcmFtIHRWaWV3IEN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSBsVmlldyBDdXJyZW50IGBMVmlld2AuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwcm9jZXNzSG9zdEJpbmRpbmdPcENvZGVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGhvc3RCaW5kaW5nT3BDb2RlcyA9IHRWaWV3Lmhvc3RCaW5kaW5nT3BDb2RlcztcbiAgaWYgKGhvc3RCaW5kaW5nT3BDb2RlcyA9PT0gbnVsbCkgcmV0dXJuO1xuICBjb25zdCBjb25zdW1lciA9IGdldFJlYWN0aXZlTFZpZXdDb25zdW1lcihsVmlldywgUkVBQ1RJVkVfSE9TVF9CSU5ESU5HX0NPTlNVTUVSKTtcbiAgdHJ5IHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgb3BDb2RlID0gaG9zdEJpbmRpbmdPcENvZGVzW2ldIGFzIG51bWJlcjtcbiAgICAgIGlmIChvcENvZGUgPCAwKSB7XG4gICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgYXJlIGVsZW1lbnQgaW5kZXhlcy5cbiAgICAgICAgc2V0U2VsZWN0ZWRJbmRleCh+b3BDb2RlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFBvc2l0aXZlIG51bWJlcnMgYXJlIE51bWJlclR1cGxlIHdoaWNoIHN0b3JlIGJpbmRpbmdSb290SW5kZXggYW5kIGRpcmVjdGl2ZUluZGV4LlxuICAgICAgICBjb25zdCBkaXJlY3RpdmVJZHggPSBvcENvZGU7XG4gICAgICAgIGNvbnN0IGJpbmRpbmdSb290SW5keCA9IGhvc3RCaW5kaW5nT3BDb2Rlc1srK2ldIGFzIG51bWJlcjtcbiAgICAgICAgY29uc3QgaG9zdEJpbmRpbmdGbiA9IGhvc3RCaW5kaW5nT3BDb2Rlc1srK2ldIGFzIEhvc3RCaW5kaW5nc0Z1bmN0aW9uPGFueT47XG4gICAgICAgIHNldEJpbmRpbmdSb290Rm9ySG9zdEJpbmRpbmdzKGJpbmRpbmdSb290SW5keCwgZGlyZWN0aXZlSWR4KTtcbiAgICAgICAgY29uc3QgY29udGV4dCA9IGxWaWV3W2RpcmVjdGl2ZUlkeF07XG4gICAgICAgIGNvbnN1bWVyLnJ1bkluQ29udGV4dChob3N0QmluZGluZ0ZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBsVmlld1tSRUFDVElWRV9IT1NUX0JJTkRJTkdfQ09OU1VNRVJdID09PSBudWxsICYmXG4gICAgICAgIGNvbW1pdExWaWV3Q29uc3VtZXJJZkhhc1Byb2R1Y2VycyhsVmlldywgUkVBQ1RJVkVfSE9TVF9CSU5ESU5HX0NPTlNVTUVSKTtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgfVxufVxuXG5cbi8qKiBSZWZyZXNoZXMgYWxsIGNvbnRlbnQgcXVlcmllcyBkZWNsYXJlZCBieSBkaXJlY3RpdmVzIGluIGEgZ2l2ZW4gdmlldyAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXM7XG4gIGlmIChjb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RhcnRJZHggPSBjb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IGNvbnRlbnRRdWVyaWVzW2kgKyAxXTtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZJZHggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLCAnRGlyZWN0aXZlRGVmIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcywgJ2NvbnRlbnRRdWVyaWVzIGZ1bmN0aW9uIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5U3RhcnRJZHgpO1xuICAgICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMhKFJlbmRlckZsYWdzLlVwZGF0ZSwgbFZpZXdbZGlyZWN0aXZlRGVmSWR4XSwgZGlyZWN0aXZlRGVmSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlZnJlc2hlcyBjaGlsZCBjb21wb25lbnRzIGluIHRoZSBjdXJyZW50IHZpZXcgKHVwZGF0ZSBtb2RlKS4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50czogbnVtYmVyW10pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVmcmVzaENvbXBvbmVudChob3N0TFZpZXcsIGNvbXBvbmVudHNbaV0pO1xuICB9XG59XG5cbi8qKiBSZW5kZXJzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldyAoY3JlYXRpb24gbW9kZSkuICovXG5mdW5jdGlvbiByZW5kZXJDaGlsZENvbXBvbmVudHMoaG9zdExWaWV3OiBMVmlldywgY29tcG9uZW50czogbnVtYmVyW10pOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldywgY29tcG9uZW50c1tpXSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlld3xudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFR8bnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGhvc3Q6IFJFbGVtZW50fG51bGwsXG4gICAgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBlbnZpcm9ubWVudDogTFZpZXdFbnZpcm9ubWVudHxudWxsLCByZW5kZXJlcjogUmVuZGVyZXJ8bnVsbCxcbiAgICBpbmplY3RvcjogSW5qZWN0b3J8bnVsbCwgZW1iZWRkZWRWaWV3SW5qZWN0b3I6IEluamVjdG9yfG51bGwsXG4gICAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXd8bnVsbCk6IExWaWV3IHtcbiAgY29uc3QgbFZpZXcgPSB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIGlmIChlbWJlZGRlZFZpZXdJbmplY3RvciAhPT0gbnVsbCB8fFxuICAgICAgKHBhcmVudExWaWV3ICYmIChwYXJlbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0VtYmVkZGVkVmlld0luamVjdG9yKSkpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5IYXNFbWJlZGRlZFZpZXdJbmplY3RvcjtcbiAgfVxuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIHRWaWV3LmRlY2xUTm9kZSAmJiBwYXJlbnRMVmlldyAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHRWaWV3LmRlY2xUTm9kZSwgcGFyZW50TFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tFTlZJUk9OTUVOVF0gPSAoZW52aXJvbm1lbnQgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbRU5WSVJPTk1FTlRdKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W0VOVklST05NRU5UXSwgJ0xWaWV3RW52aXJvbm1lbnQgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIGxWaWV3W0lEXSA9IGdldFVuaXF1ZUxWaWV3SWQoKTtcbiAgbFZpZXdbSFlEUkFUSU9OXSA9IGh5ZHJhdGlvbkluZm87XG4gIGxWaWV3W0VNQkVEREVEX1ZJRVdfSU5KRUNUT1IgYXMgYW55XSA9IGVtYmVkZGVkVmlld0luamVjdG9yO1xuICBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl0gPSBudWxsO1xuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhPT0gbnVsbCA6IHRydWUsIHRydWUsXG4gICAgICAgICAgJ0VtYmVkZGVkIHZpZXdzIG11c3QgaGF2ZSBwYXJlbnRMVmlldycpO1xuICBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gPVxuICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddIDogbFZpZXc7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudHxUTm9kZVR5cGUuVGV4dCwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3UsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTpcbiAgICBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZUSWN1Q29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIC8vIEtlZXAgdGhpcyBmdW5jdGlvbiBzaG9ydCwgc28gdGhhdCB0aGUgVk0gd2lsbCBpbmxpbmUgaXQuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQdXJlVE5vZGVUeXBlKHR5cGUpO1xuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09PSBudWxsKSB7XG4gICAgdE5vZGUgPSBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIGluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gICAgaWYgKGlzSW5JMThuQmxvY2soKSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGluIGkxOG4gYmxvY2sgdGhlbiBhbGwgZWxlbWVudHMgc2hvdWxkIGJlIHByZSBkZWNsYXJlZCB0aHJvdWdoIGBQbGFjZWhvbGRlcmBcbiAgICAgIC8vIFNlZSBgVE5vZGVUeXBlLlBsYWNlaG9sZGVyYCBhbmQgYExGcmFtZS5pbkkxOG5gIGZvciBtb3JlIGNvbnRleHQuXG4gICAgICAvLyBJZiB0aGUgYFROb2RlYCB3YXMgbm90IHByZS1kZWNsYXJlZCB0aGFuIGl0IG1lYW5zIGl0IHdhcyBub3QgbWVudGlvbmVkIHdoaWNoIG1lYW5zIGl0IHdhc1xuICAgICAgLy8gcmVtb3ZlZCwgc28gd2UgbWFyayBpdCBhcyBkZXRhY2hlZC5cbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5QbGFjZWhvbGRlcikge1xuICAgIHROb2RlLnR5cGUgPSB0eXBlO1xuICAgIHROb2RlLnZhbHVlID0gbmFtZTtcbiAgICB0Tm9kZS5hdHRycyA9IGF0dHJzO1xuICAgIGNvbnN0IHBhcmVudCA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBwYXJlbnQgPT09IG51bGwgPyAtMSA6IHBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHROb2RlLCB0Vmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGluZGV4LCB0Tm9kZS5pbmRleCwgJ0V4cGVjdGluZyBzYW1lIGluZGV4Jyk7XG4gIH1cbiAgc2V0Q3VycmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICYgVFByb2plY3Rpb25Ob2RlICZcbiAgICAgIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpIHtcbiAgY29uc3QgY3VycmVudFROb2RlID0gZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaygpO1xuICBjb25zdCBpc1BhcmVudCA9IGlzQ3VycmVudFROb2RlUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9IGlzUGFyZW50ID8gY3VycmVudFROb2RlIDogY3VycmVudFROb2RlICYmIGN1cnJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLlxuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUsIHR5cGUsIGluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChjdXJyZW50VE5vZGUgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIC8vIEZJWE1FKG1pc2tvKTogVGhpcyBsb2dpYyBsb29rcyB1bm5lY2Vzc2FyaWx5IGNvbXBsaWNhdGVkLiBDb3VsZCB3ZSBzaW1wbGlmeT9cbiAgICAgIGlmIChjdXJyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJiB0Tm9kZS5wYXJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgICAgY3VycmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50VE5vZGUubmV4dCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiB0aGUgY2FzZSBvZiBpMThuIHRoZSBgY3VycmVudFROb2RlYCBtYXkgYWxyZWFkeSBiZSBsaW5rZWQsIGluIHdoaWNoIGNhc2Ugd2UgZG9uJ3Qgd2FudFxuICAgICAgICAvLyB0byBicmVhayB0aGUgbGlua3Mgd2hpY2ggaTE4biBjcmVhdGVkLlxuICAgICAgICBjdXJyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICB0Tm9kZS5wcmV2ID0gY3VycmVudFROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYExWaWV3YFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIGNvbnRhaW5pbmcgdGhlIGJsdWVwcmludCB0byBhZGp1c3RcbiAqIEBwYXJhbSBudW1TbG90c1RvQWxsb2MgVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBpbiB0aGUgTFZpZXcsIHNob3VsZCBiZSA+MFxuICogQHBhcmFtIGluaXRpYWxWYWx1ZSBJbml0aWFsIHZhbHVlIHRvIHN0b3JlIGluIGJsdWVwcmludFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBudW1TbG90c1RvQWxsb2M6IG51bWJlciwgaW5pdGlhbFZhbHVlOiBhbnkpOiBudW1iZXIge1xuICBpZiAobnVtU2xvdHNUb0FsbG9jID09PSAwKSByZXR1cm4gLTE7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICAgIGFzc2VydFNhbWUodFZpZXcsIGxWaWV3W1RWSUVXXSwgJ2BMVmlld2AgbXVzdCBiZSBhc3NvY2lhdGVkIHdpdGggYFRWaWV3YCEnKTtcbiAgICBhc3NlcnRFcXVhbCh0Vmlldy5kYXRhLmxlbmd0aCwgbFZpZXcubGVuZ3RoLCAnRXhwZWN0aW5nIExWaWV3IHRvIGJlIHNhbWUgc2l6ZSBhcyBUVmlldycpO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICB0Vmlldy5kYXRhLmxlbmd0aCwgdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCwgJ0V4cGVjdGluZyBCbHVlcHJpbnQgdG8gYmUgc2FtZSBzaXplIGFzIFRWaWV3Jyk7XG4gICAgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzKHRWaWV3KTtcbiAgfVxuICBjb25zdCBhbGxvY0lkeCA9IGxWaWV3Lmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgIGxWaWV3LnB1c2goaW5pdGlhbFZhbHVlKTtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChpbml0aWFsVmFsdWUpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgfVxuICByZXR1cm4gYWxsb2NJZHg7XG59XG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gUmVuZGVyXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdGhlIGNyZWF0aW9uIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gY3JlYXRpbmcgdmlldyBxdWVyeSBmdW5jdGlvbnMgKGlmIGFueSk7XG4gKiAtIGV4ZWN1dGluZyBhIHRlbXBsYXRlIGZ1bmN0aW9uIGluIHRoZSBjcmVhdGlvbiBtb2RlO1xuICogLSB1cGRhdGluZyBzdGF0aWMgcXVlcmllcyAoaWYgYW55KTtcbiAqIC0gY3JlYXRpbmcgY2hpbGQgY29tcG9uZW50cyBkZWZpbmVkIGluIGEgZ2l2ZW4gdmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclZpZXc8VD4odFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXc8VD4sIGNvbnRleHQ6IFQpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBlbnRlclZpZXcobFZpZXcpO1xuICB0cnkge1xuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuQ3JlYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIEV4ZWN1dGUgYSB0ZW1wbGF0ZSBhc3NvY2lhdGVkIHdpdGggdGhpcyB2aWV3LCBpZiBpdCBleGlzdHMuIEEgdGVtcGxhdGUgZnVuY3Rpb24gbWlnaHQgbm90IGJlXG4gICAgLy8gZGVmaW5lZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50IHZpZXdzLlxuICAgIGNvbnN0IHRlbXBsYXRlRm4gPSB0Vmlldy50ZW1wbGF0ZTtcbiAgICBpZiAodGVtcGxhdGVGbiAhPT0gbnVsbCkge1xuICAgICAgZXhlY3V0ZVRlbXBsYXRlPFQ+KHRWaWV3LCBsVmlldywgdGVtcGxhdGVGbiwgUmVuZGVyRmxhZ3MuQ3JlYXRlLCBjb250ZXh0KTtcbiAgICB9XG5cbiAgICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzLlxuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgdG8gZmFsc2UgaW1tZWRpYXRlbHkgYWZ0ZXIgdGhlIGZpcnN0IGNyZWF0aW9uIHJ1biBiZWNhdXNlIGluIGFuXG4gICAgLy8gbmdGb3IgbG9vcCwgYWxsIHRoZSB2aWV3cyB3aWxsIGJlIGNyZWF0ZWQgdG9nZXRoZXIgYmVmb3JlIHVwZGF0ZSBtb2RlIHJ1bnMgYW5kIHR1cm5zXG4gICAgLy8gb2ZmIGZpcnN0Q3JlYXRlUGFzcy4gSWYgd2UgZG9uJ3Qgc2V0IGl0IGhlcmUsIGluc3RhbmNlcyB3aWxsIHBlcmZvcm0gZGlyZWN0aXZlXG4gICAgLy8gbWF0Y2hpbmcsIGV0YyBhZ2FpbiBhbmQgYWdhaW4uXG4gICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gICAgLy8gY29udGVudCBxdWVyaWVzIGFyZSByZXNvbHZlZCBkdXJpbmcgY2hhbmdlIGRldGVjdGlvbiAoaS5lLiB1cGRhdGUgbW9kZSksIGFmdGVyIGVtYmVkZGVkXG4gICAgLy8gdmlld3MgYXJlIHJlZnJlc2hlZCAoc2VlIGJsb2NrIGFib3ZlKS5cbiAgICBpZiAodFZpZXcuc3RhdGljQ29udGVudFF1ZXJpZXMpIHtcbiAgICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICAgIH1cblxuICAgIC8vIFdlIG11c3QgbWF0ZXJpYWxpemUgcXVlcnkgcmVzdWx0cyBiZWZvcmUgY2hpbGQgY29tcG9uZW50cyBhcmUgcHJvY2Vzc2VkXG4gICAgLy8gaW4gY2FzZSBhIGNoaWxkIGNvbXBvbmVudCBoYXMgcHJvamVjdGVkIGEgY29udGFpbmVyLiBUaGUgTENvbnRhaW5lciBuZWVkc1xuICAgIC8vIHRvIGV4aXN0IHNvIHRoZSBlbWJlZGRlZCB2aWV3cyBhcmUgcHJvcGVybHkgYXR0YWNoZWQgYnkgdGhlIGNvbnRhaW5lci5cbiAgICBpZiAodFZpZXcuc3RhdGljVmlld1F1ZXJpZXMpIHtcbiAgICAgIGV4ZWN1dGVWaWV3UXVlcnlGbjxUPihSZW5kZXJGbGFncy5VcGRhdGUsIHRWaWV3LnZpZXdRdWVyeSEsIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlbmRlckNoaWxkQ29tcG9uZW50cyhsVmlldywgY29tcG9uZW50cyk7XG4gICAgfVxuXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gSWYgd2UgZGlkbid0IG1hbmFnZSB0byBnZXQgcGFzdCB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcyBkdWUgdG9cbiAgICAvLyBhbiBlcnJvciwgbWFyayB0aGUgdmlldyBhcyBjb3JydXB0ZWQgc28gd2UgY2FuIHRyeSB0byByZWNvdmVyLlxuICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICAgIHRWaWV3LmluY29tcGxldGVGaXJzdFBhc3MgPSB0cnVlO1xuICAgICAgdFZpZXcuZmlyc3RDcmVhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgdGhyb3cgZXJyb3I7XG4gIH0gZmluYWxseSB7XG4gICAgbFZpZXdbRkxBR1NdICY9IH5MVmlld0ZsYWdzLkNyZWF0aW9uTW9kZTtcbiAgICBsZWF2ZVZpZXcoKTtcbiAgfVxufVxuXG4vKipcbiAqIFByb2Nlc3NlcyBhIHZpZXcgaW4gdXBkYXRlIG1vZGUuIFRoaXMgaW5jbHVkZXMgYSBudW1iZXIgb2Ygc3RlcHMgaW4gYSBzcGVjaWZpYyBvcmRlcjpcbiAqIC0gZXhlY3V0aW5nIGEgdGVtcGxhdGUgZnVuY3Rpb24gaW4gdXBkYXRlIG1vZGU7XG4gKiAtIGV4ZWN1dGluZyBob29rcztcbiAqIC0gcmVmcmVzaGluZyBxdWVyaWVzO1xuICogLSBzZXR0aW5nIGhvc3QgYmluZGluZ3M7XG4gKiAtIHJlZnJlc2hpbmcgY2hpbGQgKGVtYmVkZGVkIGFuZCBjb21wb25lbnQpIHZpZXdzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaFZpZXc8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLCBjb250ZXh0OiBUKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpc0NyZWF0aW9uTW9kZShsVmlldyksIGZhbHNlLCAnU2hvdWxkIGJlIHJ1biBpbiB1cGRhdGUgbW9kZScpO1xuICBjb25zdCBmbGFncyA9IGxWaWV3W0ZMQUdTXTtcbiAgaWYgKChmbGFncyAmIExWaWV3RmxhZ3MuRGVzdHJveWVkKSA9PT0gTFZpZXdGbGFncy5EZXN0cm95ZWQpIHJldHVybjtcblxuICAvLyBDaGVjayBubyBjaGFuZ2VzIG1vZGUgaXMgYSBkZXYgb25seSBtb2RlIHVzZWQgdG8gdmVyaWZ5IHRoYXQgYmluZGluZ3MgaGF2ZSBub3QgY2hhbmdlZFxuICAvLyBzaW5jZSB0aGV5IHdlcmUgYXNzaWduZWQuIFdlIGRvIG5vdCB3YW50IHRvIGV4ZWN1dGUgbGlmZWN5Y2xlIGhvb2tzIGluIHRoYXQgbW9kZS5cbiAgY29uc3QgaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcyA9IG5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MgJiYgbFZpZXdbRU5WSVJPTk1FTlRdLmVmZmVjdE1hbmFnZXI/LmZsdXNoKCk7XG5cbiAgZW50ZXJWaWV3KGxWaWV3KTtcbiAgdHJ5IHtcbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcblxuICAgIHNldEJpbmRpbmdJbmRleCh0Vmlldy5iaW5kaW5nU3RhcnRJbmRleCk7XG4gICAgaWYgKHRlbXBsYXRlRm4gIT09IG51bGwpIHtcbiAgICAgIGV4ZWN1dGVUZW1wbGF0ZSh0VmlldywgbFZpZXcsIHRlbXBsYXRlRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9va3NJbml0UGhhc2VDb21wbGV0ZWQgPVxuICAgICAgICAoZmxhZ3MgJiBMVmlld0ZsYWdzLkluaXRQaGFzZVN0YXRlTWFzaykgPT09IEluaXRQaGFzZVN0YXRlLkluaXRQaGFzZUNvbXBsZXRlZDtcblxuICAgIC8vIGV4ZWN1dGUgcHJlLW9yZGVyIGhvb2tzIChPbkluaXQsIE9uQ2hhbmdlcywgRG9DaGVjaylcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHByZU9yZGVyQ2hlY2tIb29rcyA9IHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVyQ2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCBwcmVPcmRlckNoZWNrSG9va3MsIG51bGwpO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCBwcmVPcmRlckhvb2tzID0gdFZpZXcucHJlT3JkZXJIb29rcztcbiAgICAgICAgaWYgKHByZU9yZGVySG9va3MgIT09IG51bGwpIHtcbiAgICAgICAgICBleGVjdXRlSW5pdEFuZENoZWNrSG9va3MobFZpZXcsIHByZU9yZGVySG9va3MsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1biwgbnVsbCk7XG4gICAgICAgIH1cbiAgICAgICAgaW5jcmVtZW50SW5pdFBoYXNlRmxhZ3MobFZpZXcsIEluaXRQaGFzZVN0YXRlLk9uSW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRmlyc3QgbWFyayB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBhcmUgZGVjbGFyZWQgaW4gdGhpcyBsVmlldyBhcyBuZWVkaW5nIGEgcmVmcmVzaCBhdCB0aGVpclxuICAgIC8vIGluc2VydGlvbiBwb2ludHMuIFRoaXMgaXMgbmVlZGVkIHRvIGF2b2lkIHRoZSBzaXR1YXRpb24gd2hlcmUgdGhlIHRlbXBsYXRlIGlzIGRlZmluZWQgaW4gdGhpc1xuICAgIC8vIGBMVmlld2AgYnV0IGl0cyBkZWNsYXJhdGlvbiBhcHBlYXJzIGFmdGVyIHRoZSBpbnNlcnRpb24gY29tcG9uZW50LlxuICAgIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXcpO1xuICAgIHJlZnJlc2hFbWJlZGRlZFZpZXdzKGxWaWV3KTtcblxuICAgIC8vIENvbnRlbnQgcXVlcnkgcmVzdWx0cyBtdXN0IGJlIHJlZnJlc2hlZCBiZWZvcmUgY29udGVudCBob29rcyBhcmUgY2FsbGVkLlxuICAgIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gICAgfVxuXG4gICAgLy8gZXhlY3V0ZSBjb250ZW50IGhvb2tzIChBZnRlckNvbnRlbnRJbml0LCBBZnRlckNvbnRlbnRDaGVja2VkKVxuICAgIC8vIFBFUkYgV0FSTklORzogZG8gTk9UIGV4dHJhY3QgdGhpcyB0byBhIHNlcGFyYXRlIGZ1bmN0aW9uIHdpdGhvdXQgcnVubmluZyBiZW5jaG1hcmtzXG4gICAgaWYgKCFpc0luQ2hlY2tOb0NoYW5nZXNQYXNzKSB7XG4gICAgICBpZiAoaG9va3NJbml0UGhhc2VDb21wbGV0ZWQpIHtcbiAgICAgICAgY29uc3QgY29udGVudENoZWNrSG9va3MgPSB0Vmlldy5jb250ZW50Q2hlY2tIb29rcztcbiAgICAgICAgaWYgKGNvbnRlbnRDaGVja0hvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUNoZWNrSG9va3MobFZpZXcsIGNvbnRlbnRDaGVja0hvb2tzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgY29udGVudEhvb2tzID0gdFZpZXcuY29udGVudEhvb2tzO1xuICAgICAgICBpZiAoY29udGVudEhvb2tzICE9PSBudWxsKSB7XG4gICAgICAgICAgZXhlY3V0ZUluaXRBbmRDaGVja0hvb2tzKFxuICAgICAgICAgICAgICBsVmlldywgY29udGVudEhvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlckNvbnRlbnRJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldywgbFZpZXcpO1xuXG4gICAgLy8gUmVmcmVzaCBjaGlsZCBjb21wb25lbnQgdmlld3MuXG4gICAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gICAgaWYgKGNvbXBvbmVudHMgIT09IG51bGwpIHtcbiAgICAgIHJlZnJlc2hDaGlsZENvbXBvbmVudHMobFZpZXcsIGNvbXBvbmVudHMpO1xuICAgIH1cblxuICAgIC8vIFZpZXcgcXVlcmllcyBtdXN0IGV4ZWN1dGUgYWZ0ZXIgcmVmcmVzaGluZyBjaGlsZCBjb21wb25lbnRzIGJlY2F1c2UgYSB0ZW1wbGF0ZSBpbiB0aGlzIHZpZXdcbiAgICAvLyBjb3VsZCBiZSBpbnNlcnRlZCBpbiBhIGNoaWxkIGNvbXBvbmVudC4gSWYgdGhlIHZpZXcgcXVlcnkgZXhlY3V0ZXMgYmVmb3JlIGNoaWxkIGNvbXBvbmVudFxuICAgIC8vIHJlZnJlc2gsIHRoZSB0ZW1wbGF0ZSBtaWdodCBub3QgeWV0IGJlIGluc2VydGVkLlxuICAgIGNvbnN0IHZpZXdRdWVyeSA9IHRWaWV3LnZpZXdRdWVyeTtcbiAgICBpZiAodmlld1F1ZXJ5ICE9PSBudWxsKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oUmVuZGVyRmxhZ3MuVXBkYXRlLCB2aWV3UXVlcnksIGNvbnRleHQpO1xuICAgIH1cblxuICAgIC8vIGV4ZWN1dGUgdmlldyBob29rcyAoQWZ0ZXJWaWV3SW5pdCwgQWZ0ZXJWaWV3Q2hlY2tlZClcbiAgICAvLyBQRVJGIFdBUk5JTkc6IGRvIE5PVCBleHRyYWN0IHRoaXMgdG8gYSBzZXBhcmF0ZSBmdW5jdGlvbiB3aXRob3V0IHJ1bm5pbmcgYmVuY2htYXJrc1xuICAgIGlmICghaXNJbkNoZWNrTm9DaGFuZ2VzUGFzcykge1xuICAgICAgaWYgKGhvb2tzSW5pdFBoYXNlQ29tcGxldGVkKSB7XG4gICAgICAgIGNvbnN0IHZpZXdDaGVja0hvb2tzID0gdFZpZXcudmlld0NoZWNrSG9va3M7XG4gICAgICAgIGlmICh2aWV3Q2hlY2tIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVDaGVja0hvb2tzKGxWaWV3LCB2aWV3Q2hlY2tIb29rcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IHZpZXdIb29rcyA9IHRWaWV3LnZpZXdIb29rcztcbiAgICAgICAgaWYgKHZpZXdIb29rcyAhPT0gbnVsbCkge1xuICAgICAgICAgIGV4ZWN1dGVJbml0QW5kQ2hlY2tIb29rcyhsVmlldywgdmlld0hvb2tzLCBJbml0UGhhc2VTdGF0ZS5BZnRlclZpZXdJbml0SG9va3NUb0JlUnVuKTtcbiAgICAgICAgfVxuICAgICAgICBpbmNyZW1lbnRJbml0UGhhc2VGbGFncyhsVmlldywgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJWaWV3SW5pdEhvb2tzVG9CZVJ1bik7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0Vmlldy5maXJzdFVwZGF0ZVBhc3MgPT09IHRydWUpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gbWFrZSBzdXJlIHRoYXQgd2Ugb25seSBmbGlwIHRoZSBmbGFnIG9uIHN1Y2Nlc3NmdWwgYHJlZnJlc2hWaWV3YCBvbmx5XG4gICAgICAvLyBEb24ndCBkbyB0aGlzIGluIGBmaW5hbGx5YCBibG9jay5cbiAgICAgIC8vIElmIHdlIGRpZCB0aGlzIGluIGBmaW5hbGx5YCBibG9jayB0aGVuIGFuIGV4Y2VwdGlvbiBjb3VsZCBibG9jayB0aGUgZXhlY3V0aW9uIG9mIHN0eWxpbmdcbiAgICAgIC8vIGluc3RydWN0aW9ucyB3aGljaCBpbiB0dXJuIHdvdWxkIGJlIHVuYWJsZSB0byBpbnNlcnQgdGhlbXNlbHZlcyBpbnRvIHRoZSBzdHlsaW5nIGxpbmtlZFxuICAgICAgLy8gbGlzdC4gVGhlIHJlc3VsdCBvZiB0aGlzIHdvdWxkIGJlIHRoYXQgaWYgdGhlIGV4Y2VwdGlvbiB3b3VsZCBub3QgYmUgdGhyb3cgb24gc3Vic2VxdWVudCBDRFxuICAgICAgLy8gdGhlIHN0eWxpbmcgd291bGQgYmUgdW5hYmxlIHRvIHByb2Nlc3MgaXQgZGF0YSBhbmQgcmVmbGVjdCB0byB0aGUgRE9NLlxuICAgICAgdFZpZXcuZmlyc3RVcGRhdGVQYXNzID0gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gRG8gbm90IHJlc2V0IHRoZSBkaXJ0eSBzdGF0ZSB3aGVuIHJ1bm5pbmcgaW4gY2hlY2sgbm8gY2hhbmdlcyBtb2RlLiBXZSBkb24ndCB3YW50IGNvbXBvbmVudHNcbiAgICAvLyB0byBiZWhhdmUgZGlmZmVyZW50bHkgZGVwZW5kaW5nIG9uIHdoZXRoZXIgY2hlY2sgbm8gY2hhbmdlcyBpcyBlbmFibGVkIG9yIG5vdC4gRm9yIGV4YW1wbGU6XG4gICAgLy8gTWFya2luZyBhbiBPblB1c2ggY29tcG9uZW50IGFzIGRpcnR5IGZyb20gd2l0aGluIHRoZSBgbmdBZnRlclZpZXdJbml0YCBob29rIGluIG9yZGVyIHRvXG4gICAgLy8gcmVmcmVzaCBhIGBOZ0NsYXNzYCBiaW5kaW5nIHNob3VsZCB3b3JrLiBJZiB3ZSB3b3VsZCByZXNldCB0aGUgZGlydHkgc3RhdGUgaW4gdGhlIGNoZWNrXG4gICAgLy8gbm8gY2hhbmdlcyBjeWNsZSwgdGhlIGNvbXBvbmVudCB3b3VsZCBiZSBub3QgYmUgZGlydHkgZm9yIHRoZSBuZXh0IHVwZGF0ZSBwYXNzLiBUaGlzIHdvdWxkXG4gICAgLy8gYmUgZGlmZmVyZW50IGluIHByb2R1Y3Rpb24gbW9kZSB3aGVyZSB0aGUgY29tcG9uZW50IGRpcnR5IHN0YXRlIGlzIG5vdCByZXNldC5cbiAgICBpZiAoIWlzSW5DaGVja05vQ2hhbmdlc1Bhc3MpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+KExWaWV3RmxhZ3MuRGlydHkgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzKTtcbiAgICB9XG4gICAgaWYgKGxWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgIGxWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldztcbiAgICAgIHVwZGF0ZVRyYW5zcGxhbnRlZFZpZXdDb3VudChsVmlld1tQQVJFTlRdIGFzIExDb250YWluZXIsIC0xKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgbGVhdmVWaWV3KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3PFQ+LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IGNvbnN1bWVyID0gZ2V0UmVhY3RpdmVMVmlld0NvbnN1bWVyKGxWaWV3LCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUik7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBpc1VwZGF0ZVBoYXNlID0gcmYgJiBSZW5kZXJGbGFncy5VcGRhdGU7XG4gIHRyeSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gICAgaWYgKGlzVXBkYXRlUGhhc2UgJiYgbFZpZXcubGVuZ3RoID4gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gV2hlbiB3ZSdyZSB1cGRhdGluZywgaW5oZXJlbnRseSBzZWxlY3QgMCBzbyB3ZSBkb24ndFxuICAgICAgLy8gaGF2ZSB0byBnZW5lcmF0ZSB0aGF0IGluc3RydWN0aW9uIGZvciBtb3N0IHVwZGF0ZSBibG9ja3MuXG4gICAgICBzZWxlY3RJbmRleEludGVybmFsKHRWaWV3LCBsVmlldywgSEVBREVSX09GRlNFVCwgISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVIb29rVHlwZSA9XG4gICAgICAgIGlzVXBkYXRlUGhhc2UgPyBQcm9maWxlckV2ZW50LlRlbXBsYXRlVXBkYXRlU3RhcnQgOiBQcm9maWxlckV2ZW50LlRlbXBsYXRlQ3JlYXRlU3RhcnQ7XG4gICAgcHJvZmlsZXIocHJlSG9va1R5cGUsIGNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gICAgY29uc3VtZXIucnVuSW5Db250ZXh0KHRlbXBsYXRlRm4sIHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAobFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdID09PSBudWxsKSB7XG4gICAgICBjb21taXRMVmlld0NvbnN1bWVySWZIYXNQcm9kdWNlcnMobFZpZXcsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSKTtcbiAgICB9XG4gICAgc2V0U2VsZWN0ZWRJbmRleChwcmV2U2VsZWN0ZWRJbmRleCk7XG5cbiAgICBjb25zdCBwb3N0SG9va1R5cGUgPVxuICAgICAgICBpc1VwZGF0ZVBoYXNlID8gUHJvZmlsZXJFdmVudC5UZW1wbGF0ZVVwZGF0ZUVuZCA6IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVDcmVhdGVFbmQ7XG4gICAgcHJvZmlsZXIocG9zdEhvb2tUeXBlLCBjb250ZXh0IGFzIHVua25vd24gYXMge30pO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgIGZvciAobGV0IGRpcmVjdGl2ZUluZGV4ID0gc3RhcnQ7IGRpcmVjdGl2ZUluZGV4IDwgZW5kOyBkaXJlY3RpdmVJbmRleCsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgZGVmLmNvbnRlbnRRdWVyaWVzKFJlbmRlckZsYWdzLkNyZWF0ZSwgbFZpZXdbZGlyZWN0aXZlSW5kZXhdLCBkaXJlY3RpdmVJbmRleCk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSk7XG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgPT09IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSB7XG4gICAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgY29uc3QgdFZpZXcgPSBkZWYudFZpZXc7XG5cbiAgLy8gQ3JlYXRlIGEgVFZpZXcgaWYgdGhlcmUgaXNuJ3Qgb25lLCBvciByZWNyZWF0ZSBpdCBpZiB0aGUgZmlyc3QgY3JlYXRlIHBhc3MgZGlkbid0XG4gIC8vIGNvbXBsZXRlIHN1Y2Nlc3NmdWxseSBzaW5jZSB3ZSBjYW4ndCBrbm93IGZvciBzdXJlIHdoZXRoZXIgaXQncyBpbiBhIHVzYWJsZSBzaGFwZS5cbiAgaWYgKHRWaWV3ID09PSBudWxsIHx8IHRWaWV3LmluY29tcGxldGVGaXJzdFBhc3MpIHtcbiAgICAvLyBEZWNsYXJhdGlvbiBub2RlIGhlcmUgaXMgbnVsbCBzaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHdlIGR5bmFtaWNhbGx5IGNyZWF0ZSBhXG4gICAgLy8gY29tcG9uZW50IGFuZCBoZW5jZSB0aGVyZSBpcyBubyBkZWNsYXJhdGlvbi5cbiAgICBjb25zdCBkZWNsVE5vZGUgPSBudWxsO1xuICAgIHJldHVybiBkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgIFRWaWV3VHlwZS5Db21wb25lbnQsIGRlY2xUTm9kZSwgZGVmLnRlbXBsYXRlLCBkZWYuZGVjbHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICAgICAgIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSwgZGVmLnNjaGVtYXMsIGRlZi5jb25zdHMsIGRlZi5pZCk7XG4gIH1cblxuICByZXR1cm4gdFZpZXc7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGBUVmlld2AuXG4gKiBAcGFyYW0gZGVjbFROb2RlIERlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoaXMgYFRWaWV3YC5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHBpcGVzIFJlZ2lzdHJ5IG9mIHBpcGVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2aWV3UXVlcnkgVmlldyBxdWVyaWVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBzY2hlbWFzIFNjaGVtYXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIGNvbnN0cyBDb25zdGFudHMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdHlwZTogVFZpZXdUeXBlLCBkZWNsVE5vZGU6IFROb2RlfG51bGwsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58bnVsbCwgZGVjbHM6IG51bWJlcixcbiAgICB2YXJzOiBudW1iZXIsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3Rvcnl8bnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5fG51bGwsXG4gICAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT58bnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgIGNvbnN0c09yRmFjdG9yeTogVENvbnN0YW50c09yRmFjdG9yeXxudWxsLCBzc3JJZDogc3RyaW5nfG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgZGVjbHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgY29uc3QgY29uc3RzID0gdHlwZW9mIGNvbnN0c09yRmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJyA/IGNvbnN0c09yRmFjdG9yeSgpIDogY29uc3RzT3JGYWN0b3J5O1xuICBjb25zdCB0VmlldyA9IGJsdWVwcmludFtUVklFVyBhcyBhbnldID0ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgcXVlcmllczogbnVsbCxcbiAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICBkZWNsVE5vZGU6IGRlY2xUTm9kZSxcbiAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgIGhvc3RCaW5kaW5nT3BDb2RlczogbnVsbCxcbiAgICBmaXJzdENyZWF0ZVBhc3M6IHRydWUsXG4gICAgZmlyc3RVcGRhdGVQYXNzOiB0cnVlLFxuICAgIHN0YXRpY1ZpZXdRdWVyaWVzOiBmYWxzZSxcbiAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICBwcmVPcmRlckNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICBzY2hlbWFzOiBzY2hlbWFzLFxuICAgIGNvbnN0czogY29uc3RzLFxuICAgIGluY29tcGxldGVGaXJzdFBhc3M6IGZhbHNlLFxuICAgIHNzcklkLFxuICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHRWaWV3IHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHRWaWV3KTtcbiAgfVxuICByZXR1cm4gdFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsVmlld0xlbmd0aDsgaSsrKSB7XG4gICAgYmx1ZXByaW50LnB1c2goaSA8IGJpbmRpbmdTdGFydEluZGV4ID8gbnVsbCA6IE5PX0NIQU5HRSk7XG4gIH1cblxuICByZXR1cm4gYmx1ZXByaW50IGFzIExWaWV3O1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB1c2VkIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGVuY2Fwc3VsYXRpb24gVmlldyBFbmNhcHN1bGF0aW9uIGRlZmluZWQgZm9yIGNvbXBvbmVudCB0aGF0IHJlcXVlc3RzIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBpbmplY3RvciBSb290IHZpZXcgaW5qZWN0b3IgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudHxzdHJpbmcsIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLFxuICAgIGluamVjdG9yOiBJbmplY3Rvcik6IFJFbGVtZW50IHtcbiAgLy8gTm90ZTogd2UgdXNlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBgUFJFU0VSVkVfSE9TVF9DT05URU5UYCBoZXJlIGV2ZW4gdGhvdWdoIGl0J3MgYVxuICAvLyB0cmVlLXNoYWthYmxlIG9uZSAocHJvdmlkZWRJbjoncm9vdCcpLiBUaGlzIGNvZGUgcGF0aCBjYW4gYmUgdHJpZ2dlcmVkIGR1cmluZyBkeW5hbWljXG4gIC8vIGNvbXBvbmVudCBjcmVhdGlvbiAoYWZ0ZXIgY2FsbGluZyBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudCkgd2hlbiBhbiBpbmplY3RvclxuICAvLyBpbnN0YW5jZSBjYW4gYmUgcHJvdmlkZWQuIFRoZSBpbmplY3RvciBpbnN0YW5jZSBtaWdodCBiZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgbWFpbiBESVxuICAvLyB0cmVlLCB0aHVzIHRoZSBgUFJFU0VSVkVfSE9TVF9DT05URU5UYCB3b3VsZCBub3QgYmUgYWJsZSB0byBpbnN0YW50aWF0ZS4gSW4gdGhpcyBjYXNlLCB0aGVcbiAgLy8gZGVmYXVsdCB2YWx1ZSB3aWxsIGJlIHVzZWQuXG4gIGNvbnN0IHByZXNlcnZlSG9zdENvbnRlbnQgPSBpbmplY3Rvci5nZXQoUFJFU0VSVkVfSE9TVF9DT05URU5ULCBQUkVTRVJWRV9IT1NUX0NPTlRFTlRfREVGQVVMVCk7XG5cbiAgLy8gV2hlbiB1c2luZyBuYXRpdmUgU2hhZG93IERPTSwgZG8gbm90IGNsZWFyIGhvc3QgZWxlbWVudCB0byBhbGxvdyBuYXRpdmUgc2xvdFxuICAvLyBwcm9qZWN0aW9uLlxuICBjb25zdCBwcmVzZXJ2ZUNvbnRlbnQgPSBwcmVzZXJ2ZUhvc3RDb250ZW50IHx8IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgY29uc3Qgcm9vdEVsZW1lbnQgPSByZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvciwgcHJlc2VydmVDb250ZW50KTtcbiAgYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShyb290RWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gIHJldHVybiByb290RWxlbWVudDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFueSByb290IGVsZW1lbnQgdHJhbnNmb3JtYXRpb25zIHRoYXQgYXJlIG5lZWRlZC4gSWYgaHlkcmF0aW9uIGlzIGVuYWJsZWQsXG4gKiB0aGlzIHdpbGwgcHJvY2VzcyBjb3JydXB0ZWQgdGV4dCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gcm9vdEVsZW1lbnQgdGhlIGFwcCByb290IEhUTUwgRWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShyb290RWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKHJvb3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgdHJhbnNmb3JtYXRpb25zIHRvIHRoZSByb290IEhUTUwgZWxlbWVudFxuICogb2YgYW4gYXBwLiBXaGVuIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCB0aGlzIHByb2Nlc3NlcyBhbnkgY29ycnVwdCB0ZXh0IG5vZGVzXG4gKiBzbyB0aGV5IGFyZSBwcm9wZXJseSBoeWRyYXRhYmxlIG9uIHRoZSBjbGllbnQuXG4gKlxuICogQHBhcmFtIHJvb3RFbGVtZW50IHRoZSBhcHAgcm9vdCBIVE1MIEVsZW1lbnRcbiAqL1xubGV0IF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbDogdHlwZW9mIGFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsID1cbiAgICAocm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiBudWxsO1xuXG4vKipcbiAqIFByb2Nlc3NlcyB0ZXh0IG5vZGUgbWFya2VycyBiZWZvcmUgaHlkcmF0aW9uIGJlZ2lucy4gVGhpcyByZXBsYWNlcyBhbnkgc3BlY2lhbCBjb21tZW50XG4gKiBub2RlcyB0aGF0IHdlcmUgYWRkZWQgcHJpb3IgdG8gc2VyaWFsaXphdGlvbiBhcmUgc3dhcHBlZCBvdXQgdG8gcmVzdG9yZSBwcm9wZXIgdGV4dFxuICogbm9kZXMgYmVmb3JlIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gcm9vdEVsZW1lbnQgdGhlIGFwcCByb290IEhUTUwgRWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGwocm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIGlmIChyb290RWxlbWVudC5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgIC8vIEhhbmRsZSBhIHNpdHVhdGlvbiB3aGVuIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgaXMgYXBwbGllZFxuICAgIC8vIHRvIHRoZSByb290IG5vZGUgb2YgYW4gYXBwbGljYXRpb24uIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNsZWFyXG4gICAgLy8gdGhlIGNvbnRlbnRzIGFuZCByZW5kZXIgZXZlcnl0aGluZyBmcm9tIHNjcmF0Y2guXG4gICAgY2xlYXJFbGVtZW50Q29udGVudHMocm9vdEVsZW1lbnQgYXMgUkVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHByb2Nlc3NUZXh0Tm9kZU1hcmtlcnNCZWZvcmVIeWRyYXRpb24ocm9vdEVsZW1lbnQpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBgYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybWAgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpIHtcbiAgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsID0gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGw7XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAobFZpZXcpO1xuXG4gIC8vIEhpc3RvcmljYWxseSB0aGUgYHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0YCB3YXMgdXNlZCB0byByZWdpc3RlciBib3RoIGZyYW1ld29yay1sZXZlbCBhbmRcbiAgLy8gdXNlci1kZWZpbmVkIGNsZWFudXAgY2FsbGJhY2tzLCBidXQgb3ZlciB0aW1lIHRob3NlIHR3byB0eXBlcyBvZiBjbGVhbnVwcyB3ZXJlIHNlcGFyYXRlZC5cbiAgLy8gVGhpcyBkZXYgbW9kZSBjaGVja3MgYXNzdXJlcyB0aGF0IHVzZXItbGV2ZWwgY2xlYW51cCBjYWxsYmFja3MgYXJlIF9ub3RfIHN0b3JlZCBpbiBkYXRhXG4gIC8vIHN0cnVjdHVyZXMgcmVzZXJ2ZWQgZm9yIGZyYW1ld29yay1zcGVjaWZpYyBob29rcy5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGNvbnRleHQsICdDbGVhbnVwIGNvbnRleHQgaXMgbWFuZGF0b3J5IHdoZW4gcmVnaXN0ZXJpbmcgZnJhbWV3b3JrLWxldmVsIGRlc3Ryb3kgaG9va3MnKTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBuZXcgZnJhbWV3b3JrLWxldmVsIGNsZWFudXAgZnVuY3Rpb25zIGFyZSByZWdpc3RlcmVkIGFmdGVyIHRoZSBmaXJzdFxuICAgIC8vIHRlbXBsYXRlIHBhc3MgaXMgZG9uZSAoYW5kIFRWaWV3IGRhdGEgc3RydWN0dXJlcyBhcmUgbWVhbnQgdG8gZnVsbHkgY29uc3RydWN0ZWQpLlxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIE9iamVjdC5mcmVlemUoZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGlzIGBUTm9kZWAgYmVsb25nc1xuICogQHBhcmFtIHRQYXJlbnQgUGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBpbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRJY3VDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKGF0dHJzLCB1bmRlZmluZWQsICdcXCd1bmRlZmluZWRcXCcgaXMgbm90IHZhbGlkIHZhbHVlIGZvciBcXCdhdHRyc1xcJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiB0UGFyZW50ICYmIGFzc2VydFROb2RlRm9yVFZpZXcodFBhcmVudCwgdFZpZXcpO1xuICBsZXQgaW5qZWN0b3JJbmRleCA9IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMTtcbiAgY29uc3QgdE5vZGUgPSB7XG4gICAgdHlwZSxcbiAgICBpbmRleCxcbiAgICBpbnNlcnRCZWZvcmVJbmRleDogbnVsbCxcbiAgICBpbmplY3RvckluZGV4LFxuICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiAtMSxcbiAgICBjb21wb25lbnRPZmZzZXQ6IC0xLFxuICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgZmxhZ3M6IDAsXG4gICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiBudWxsLFxuICAgIG91dHB1dHM6IG51bGwsXG4gICAgdFZpZXc6IG51bGwsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwcmV2OiBudWxsLFxuICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgIHN0eWxlczogbnVsbCxcbiAgICBzdHlsZXNXaXRob3V0SG9zdDogbnVsbCxcbiAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzZXM6IG51bGwsXG4gICAgY2xhc3Nlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzQmluZGluZ3M6IDAgYXMgYW55LFxuICAgIHN0eWxlQmluZGluZ3M6IDAgYXMgYW55LFxuICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHROb2RlIHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHROb2RlKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBgUHJvcGVydHlBbGlhc2VzYCBkYXRhIHN0cnVjdHVyZSBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dC9vdXRwdXQgbWFwcGluZy5cbiAqIEBwYXJhbSBhbGlhc01hcCBJbnB1dC9vdXRwdXQgbWFwcGluZyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlLlxuICogQHBhcmFtIHByb3BlcnR5QWxpYXNlcyBPYmplY3QgaW4gd2hpY2ggdG8gc3RvcmUgdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gaG9zdERpcmVjdGl2ZUFsaWFzTWFwIE9iamVjdCB1c2VkIHRvIGFsaWFzIG9yIGZpbHRlciBvdXQgcHJvcGVydGllcyBmb3IgaG9zdCBkaXJlY3RpdmVzLlxuICogSWYgdGhlIG1hcHBpbmcgaXMgcHJvdmlkZWQsIGl0J2xsIGFjdCBhcyBhbiBhbGxvd2xpc3QsIGFzIHdlbGwgYXMgYSBtYXBwaW5nIG9mIHdoYXQgcHVibGljXG4gKiBuYW1lIGlucHV0cy9vdXRwdXRzIHNob3VsZCBiZSBleHBvc2VkIHVuZGVyLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBhbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3BlcnR5QWxpYXNlczogUHJvcGVydHlBbGlhc2VzfG51bGwsXG4gICAgaG9zdERpcmVjdGl2ZUFsaWFzTWFwOiBIb3N0RGlyZWN0aXZlQmluZGluZ01hcHxudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIGFsaWFzTWFwKSB7XG4gICAgaWYgKGFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wZXJ0eUFsaWFzZXMgPSBwcm9wZXJ0eUFsaWFzZXMgPT09IG51bGwgPyB7fSA6IHByb3BlcnR5QWxpYXNlcztcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGFsaWFzTWFwW3B1YmxpY05hbWVdO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gaG9zdCBkaXJlY3RpdmUgbWFwcGluZ3MsIHdlIHdhbnQgdG8gcmVtYXAgdXNpbmcgdGhlIGFsaWFzIG1hcCBmcm9tIHRoZVxuICAgICAgLy8gZGVmaW5pdGlvbiBpdHNlbGYuIElmIHRoZXJlIGlzIGFuIGFsaWFzIG1hcCwgaXQgaGFzIHR3byBmdW5jdGlvbnM6XG4gICAgICAvLyAxLiBJdCBzZXJ2ZXMgYXMgYW4gYWxsb3dsaXN0IG9mIGJpbmRpbmdzIHRoYXQgYXJlIGV4cG9zZWQgYnkgdGhlIGhvc3QgZGlyZWN0aXZlcy4gT25seSB0aGVcbiAgICAgIC8vIG9uZXMgaW5zaWRlIHRoZSBob3N0IGRpcmVjdGl2ZSBtYXAgd2lsbCBiZSBleHBvc2VkIG9uIHRoZSBob3N0LlxuICAgICAgLy8gMi4gVGhlIHB1YmxpYyBuYW1lIG9mIHRoZSBwcm9wZXJ0eSBpcyBhbGlhc2VkIHVzaW5nIHRoZSBob3N0IGRpcmVjdGl2ZSBhbGlhcyBtYXAsIHJhdGhlclxuICAgICAgLy8gdGhhbiB0aGUgYWxpYXMgbWFwIGZyb20gdGhlIGRlZmluaXRpb24uXG4gICAgICBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwID09PSBudWxsKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMocHJvcGVydHlBbGlhc2VzLCBkaXJlY3RpdmVJbmRleCwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgICAgICAgICBwcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4LCBob3N0RGlyZWN0aXZlQWxpYXNNYXBbcHVibGljTmFtZV0sIGludGVybmFsTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0eUFsaWFzZXM7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgcHJvcGVydHlBbGlhc2VzOiBQcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHB1YmxpY05hbWU6IHN0cmluZyxcbiAgICBpbnRlcm5hbE5hbWU6IHN0cmluZykge1xuICBpZiAocHJvcGVydHlBbGlhc2VzLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlSW5kZXgsIGludGVybmFsTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZUluZGV4LCBpbnRlcm5hbE5hbWVdO1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5mdW5jdGlvbiBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcDogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IHRWaWV3RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3RGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgYWxpYXNEYXRhID1cbiAgICAgICAgaG9zdERpcmVjdGl2ZURlZmluaXRpb25NYXAgPyBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcC5nZXQoZGlyZWN0aXZlRGVmKSA6IG51bGw7XG4gICAgY29uc3QgYWxpYXNlZElucHV0cyA9IGFsaWFzRGF0YSA/IGFsaWFzRGF0YS5pbnB1dHMgOiBudWxsO1xuICAgIGNvbnN0IGFsaWFzZWRPdXRwdXRzID0gYWxpYXNEYXRhID8gYWxpYXNEYXRhLm91dHB1dHMgOiBudWxsO1xuXG4gICAgaW5wdXRzU3RvcmUgPVxuICAgICAgICBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYuaW5wdXRzLCBkaXJlY3RpdmVJbmRleCwgaW5wdXRzU3RvcmUsIGFsaWFzZWRJbnB1dHMpO1xuICAgIG91dHB1dHNTdG9yZSA9XG4gICAgICAgIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKGRpcmVjdGl2ZURlZi5vdXRwdXRzLCBkaXJlY3RpdmVJbmRleCwgb3V0cHV0c1N0b3JlLCBhbGlhc2VkT3V0cHV0cyk7XG4gICAgLy8gRG8gbm90IHVzZSB1bmJvdW5kIGF0dHJpYnV0ZXMgYXMgaW5wdXRzIHRvIHN0cnVjdHVyYWwgZGlyZWN0aXZlcywgc2luY2Ugc3RydWN0dXJhbFxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dHMgY2FuIG9ubHkgYmUgc2V0IHVzaW5nIG1pY3Jvc3ludGF4IChlLmcuIGA8ZGl2ICpkaXI9XCJleHBcIj5gKS5cbiAgICAvLyBUT0RPKEZXLTE5MzApOiBtaWNyb3N5bnRheCBleHByZXNzaW9ucyBtYXkgYWxzbyBjb250YWluIHVuYm91bmQvc3RhdGljIGF0dHJpYnV0ZXMsIHdoaWNoXG4gICAgLy8gc2hvdWxkIGJlIHNldCBmb3IgaW5saW5lIHRlbXBsYXRlcy5cbiAgICBjb25zdCBpbml0aWFsSW5wdXRzID1cbiAgICAgICAgKGlucHV0c1N0b3JlICE9PSBudWxsICYmIHROb2RlQXR0cnMgIT09IG51bGwgJiYgIWlzSW5saW5lVGVtcGxhdGUodE5vZGUpKSA/XG4gICAgICAgIGdlbmVyYXRlSW5pdGlhbElucHV0cyhpbnB1dHNTdG9yZSwgZGlyZWN0aXZlSW5kZXgsIHROb2RlQXR0cnMpIDpcbiAgICAgICAgbnVsbDtcbiAgICBpbnB1dHNGcm9tQXR0cnMucHVzaChpbml0aWFsSW5wdXRzKTtcbiAgfVxuXG4gIGlmIChpbnB1dHNTdG9yZSAhPT0gbnVsbCkge1xuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ3N0eWxlJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dDtcbiAgICB9XG4gIH1cblxuICB0Tm9kZS5pbml0aWFsSW5wdXRzID0gaW5wdXRzRnJvbUF0dHJzO1xuICB0Tm9kZS5pbnB1dHMgPSBpbnB1dHNTdG9yZTtcbiAgdE5vZGUub3V0cHV0cyA9IG91dHB1dHNTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBQZXJmb3JtYW5jZSBub3RlOiB0aGlzIGZ1bmN0aW9uIGlzIHdyaXR0ZW4gYXMgYSBzZXJpZXMgb2YgaWYgY2hlY2tzIChpbnN0ZWFkIG9mLCBzYXksIGEgcHJvcGVydHlcbiAqIG9iamVjdCBsb29rdXApIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIC0gdGhlIHNlcmllcyBvZiBgaWZgIGNoZWNrcyBzZWVtcyB0byBiZSB0aGUgZmFzdGVzdCB3YXkgb2ZcbiAqIG1hcHBpbmcgcHJvcGVydHkgbmFtZXMuIERvIE5PVCBjaGFuZ2Ugd2l0aG91dCBiZW5jaG1hcmtpbmcuXG4gKlxuICogTm90ZTogdGhpcyBtYXBwaW5nIGhhcyB0byBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgZXF1YWxseSBuYW1lZCBtYXBwaW5nIGluIHRoZSB0ZW1wbGF0ZVxuICogdHlwZS1jaGVja2luZyBtYWNoaW5lcnkgb2Ygbmd0c2MuXG4gKi9cbmZ1bmN0aW9uIG1hcFByb3BOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChuYW1lID09PSAnY2xhc3MnKSByZXR1cm4gJ2NsYXNzTmFtZSc7XG4gIGlmIChuYW1lID09PSAnZm9yJykgcmV0dXJuICdodG1sRm9yJztcbiAgaWYgKG5hbWUgPT09ICdmb3JtYWN0aW9uJykgcmV0dXJuICdmb3JtQWN0aW9uJztcbiAgaWYgKG5hbWUgPT09ICdpbm5lckh0bWwnKSByZXR1cm4gJ2lubmVySFRNTCc7XG4gIGlmIChuYW1lID09PSAncmVhZG9ubHknKSByZXR1cm4gJ3JlYWRPbmx5JztcbiAgaWYgKG5hbWUgPT09ICd0YWJpbmRleCcpIHJldHVybiAndGFiSW5kZXgnO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCByZW5kZXJlcjogUmVuZGVyZXIsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCwgbmF0aXZlT25seTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgbGV0IGlucHV0RGF0YSA9IHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIGlucHV0RGF0YSAhPSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KHRWaWV3LCBsVmlldywgZGF0YVZhbHVlLCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgdE5vZGUuaW5kZXgpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCFpc1Byb3BlcnR5VmFsaWQoZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Vmlldy5zY2hlbWFzKSkge1xuICAgICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlXG4gICAgLy8gcHJvcGVydHkgaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS52YWx1ZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXModFZpZXcuc2NoZW1hcywgdE5vZGUudmFsdWUpKSB7XG4gICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydHkoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPVxuICAgICAgICBlc2NhcGVDb21tZW50VGV4dChgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWApO1xuICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBpZiAodHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKSkge1xuICAgIC8qKlxuICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICAgICAqIGkrMTogcHJpdmF0ZU5hbWVcbiAgICAgKlxuICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsxXVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdHlwZSwgZGF0YVZhbHVlW2kgKyAxXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBpZiAoZ2V0QmluZGluZ3NFbmFibGVkKCkpIHtcbiAgICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyh0VmlldywgdE5vZGUpO1xuICAgIGxldCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXXxudWxsO1xuICAgIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbDtcblxuICAgIGlmIChtYXRjaFJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgZGlyZWN0aXZlRGVmcyA9IGhvc3REaXJlY3RpdmVEZWZzID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgW2RpcmVjdGl2ZURlZnMsIGhvc3REaXJlY3RpdmVEZWZzXSA9IG1hdGNoUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICBpbml0aWFsaXplRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBkaXJlY3RpdmVEZWZzLCBleHBvcnRzTWFwLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgfVxuICAgIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbiAgfVxuICAvLyBNZXJnZSB0aGUgdGVtcGxhdGUgYXR0cnMgbGFzdCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgaGlnaGVzdCBwcmlvcml0eS5cbiAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgdE5vZGUuYXR0cnMpO1xufVxuXG4vKiogSW5pdGlhbGl6ZXMgdGhlIGRhdGEgc3RydWN0dXJlcyBuZWNlc3NhcnkgZm9yIGEgbGlzdCBvZiBkaXJlY3RpdmVzIHRvIGJlIGluc3RhbnRpYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx1bmtub3duPiwgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXI7fXxudWxsLFxuICAgIGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIC8vIFB1Ymxpc2hlcyB0aGUgZGlyZWN0aXZlIHR5cGVzIHRvIERJIHNvIHRoZXkgY2FuIGJlIGluamVjdGVkLiBOZWVkcyB0b1xuICAvLyBoYXBwZW4gaW4gYSBzZXBhcmF0ZSBwYXNzIGJlZm9yZSB0aGUgVE5vZGUgZmxhZ3MgaGF2ZSBiZWVuIGluaXRpYWxpemVkLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCBsVmlldyksIHRWaWV3LCBkaXJlY3RpdmVzW2ldLnR5cGUpO1xuICB9XG5cbiAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG5cbiAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAvLyBpbXBvcnRhbnQuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gIH1cbiAgbGV0IHByZU9yZGVySG9va3NGb3VuZCA9IGZhbHNlO1xuICBsZXQgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSBmYWxzZTtcbiAgbGV0IGRpcmVjdGl2ZUlkeCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIGRpcmVjdGl2ZXMubGVuZ3RoLCBudWxsKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRTYW1lKFxuICAgICAgICAgIGRpcmVjdGl2ZUlkeCwgdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1ROb2RlLmRpcmVjdGl2ZVN0YXJ0IHNob3VsZCBwb2ludCB0byBqdXN0IGFsbG9jYXRlZCBzcGFjZScpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgLy8gTWVyZ2UgdGhlIGF0dHJzIGluIHRoZSBvcmRlciBvZiBtYXRjaGVzLiBUaGlzIGFzc3VtZXMgdGhhdCB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIHRoZVxuICAgIC8vIGNvbXBvbmVudCBpdHNlbGYsIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgdGhlIGxlYXN0IHByaW9yaXR5LlxuICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuXG4gICAgY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmUodFZpZXcsIHROb2RlLCBsVmlldywgZGlyZWN0aXZlSWR4LCBkZWYpO1xuICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAoZGlyZWN0aXZlSWR4LCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgaWYgKGRlZi5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDApXG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgIGNvbnN0IGxpZmVDeWNsZUhvb2tzOiBQYXJ0aWFsPE9uQ2hhbmdlcyZPbkluaXQmRG9DaGVjaz4gPSBkZWYudHlwZS5wcm90b3R5cGU7XG4gICAgLy8gT25seSBwdXNoIGEgbm9kZSBpbmRleCBpbnRvIHRoZSBwcmVPcmRlckhvb2tzIGFycmF5IGlmIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgIGlmICghcHJlT3JkZXJIb29rc0ZvdW5kICYmXG4gICAgICAgIChsaWZlQ3ljbGVIb29rcy5uZ09uQ2hhbmdlcyB8fCBsaWZlQ3ljbGVIb29rcy5uZ09uSW5pdCB8fCBsaWZlQ3ljbGVIb29rcy5uZ0RvQ2hlY2spKSB7XG4gICAgICAvLyBXZSB3aWxsIHB1c2ggdGhlIGFjdHVhbCBob29rIGZ1bmN0aW9uIGludG8gdGhpcyBhcnJheSBsYXRlciBkdXJpbmcgZGlyIGluc3RhbnRpYXRpb24uXG4gICAgICAvLyBXZSBjYW5ub3QgZG8gaXQgbm93IGJlY2F1c2Ugd2UgbXVzdCBlbnN1cmUgaG9va3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIHNhbWVcbiAgICAgIC8vIG9yZGVyIHRoYXQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCAoaS5lLiBpbmplY3Rpb24gb3JkZXIpLlxuICAgICAgKHRWaWV3LnByZU9yZGVySG9va3MgPz89IFtdKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA/Pz0gW10pLnB1c2godE5vZGUuaW5kZXgpO1xuICAgICAgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSB0cnVlO1xuICAgIH1cblxuICAgIGRpcmVjdGl2ZUlkeCsrO1xuICB9XG5cbiAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldywgdE5vZGUsIGhvc3REaXJlY3RpdmVEZWZzKTtcbn1cblxuLyoqXG4gKiBBZGQgYGhvc3RCaW5kaW5nc2AgdG8gdGhlIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoZSBgaG9zdEJpbmRpbmdzYCBzaG91bGQgYmUgYWRkZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0aGUgZWxlbWVudCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlXG4gKiBAcGFyYW0gZGlyZWN0aXZlSWR4IERpcmVjdGl2ZSBpbmRleCBpbiB2aWV3LlxuICogQHBhcmFtIGRpcmVjdGl2ZVZhcnNJZHggV2hlcmUgd2lsbCB0aGUgZGlyZWN0aXZlJ3MgdmFycyBiZSBzdG9yZWRcbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGlyZWN0aXZlVmFyc0lkeDogbnVtYmVyLFxuICAgIGRlZjogQ29tcG9uZW50RGVmPGFueT58RGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzID0gZGVmLmhvc3RCaW5kaW5ncztcbiAgaWYgKGhvc3RCaW5kaW5ncykge1xuICAgIGxldCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gICAgaWYgKGhvc3RCaW5kaW5nT3BDb2RlcyA9PT0gbnVsbCkge1xuICAgICAgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzID0gW10gYXMgYW55IGFzIEhvc3RCaW5kaW5nT3BDb2RlcztcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudEluZHggPSB+dE5vZGUuaW5kZXg7XG4gICAgaWYgKGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzKSAhPSBlbGVtZW50SW5keCkge1xuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgc2VsZWN0IGVsZW1lbnQgc28gdGhhdCB3ZSBhcmUgbW9yZSBlZmZpY2llbnQgaW4gZXhlY3V0aW9uLlxuICAgICAgLy8gTk9URTogdGhpcyBpcyBzdHJpY3RseSBub3QgbmVjZXNzYXJ5IGFuZCBpdCB0cmFkZXMgY29kZSBzaXplIGZvciBydW50aW1lIHBlcmYuXG4gICAgICAvLyAoV2UgY291bGQganVzdCBhbHdheXMgYWRkIGl0LilcbiAgICAgIGhvc3RCaW5kaW5nT3BDb2Rlcy5wdXNoKGVsZW1lbnRJbmR4KTtcbiAgICB9XG4gICAgaG9zdEJpbmRpbmdPcENvZGVzLnB1c2goZGlyZWN0aXZlSWR4LCBkaXJlY3RpdmVWYXJzSWR4LCBob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbGFzdCBzZWxlY3RlZCBlbGVtZW50IGluZGV4IGluIHRoZSBgSG9zdEJpbmRpbmdPcENvZGVzYFxuICpcbiAqIEZvciBwZXJmIHJlYXNvbnMgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaW5kZXggaW4gYEhvc3RCaW5kaW5nT3BDb2Rlc2Agb25seVxuICogaWYgaXQgY2hhbmdlcy4gVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgbGFzdCBpbmRleCAob3IgJzAnIGlmIG5vdCBmb3VuZC4pXG4gKlxuICogU2VsZWN0ZWQgZWxlbWVudCBpbmRleCBhcmUgb25seSB0aGUgb25lcyB3aGljaCBhcmUgbmVnYXRpdmUuXG4gKi9cbmZ1bmN0aW9uIGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXMpOiBudW1iZXIge1xuICBsZXQgaSA9IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7XG4gIHdoaWxlIChpID4gMCkge1xuICAgIGNvbnN0IHZhbHVlID0gaG9zdEJpbmRpbmdPcENvZGVzWy0taV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPCAwKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSwgbmF0aXZlOiBSTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgLy8gVGhlIGNvbXBvbmVudCB2aWV3IG5lZWRzIHRvIGJlIGNyZWF0ZWQgYmVmb3JlIGNyZWF0aW5nIHRoZSBub2RlIGluamVjdG9yXG4gIC8vIHNpbmNlIGl0IGlzIHVzZWQgdG8gaW5qZWN0IHNvbWUgc3BlY2lhbCBzeW1ib2xzIGxpa2UgYENoYW5nZURldGVjdG9yUmVmYC5cbiAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuICAgIGFkZENvbXBvbmVudExvZ2ljKFxuICAgICAgICBsVmlldywgdE5vZGUgYXMgVEVsZW1lbnROb2RlLFxuICAgICAgICB0Vmlldy5kYXRhW3N0YXJ0ICsgdE5vZGUuY29tcG9uZW50T2Zmc2V0XSBhcyBDb21wb25lbnREZWY8dW5rbm93bj4pO1xuICB9XG5cbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGksIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6XG4gICAgW21hdGNoZXM6IERpcmVjdGl2ZURlZjx1bmtub3duPltdLCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbF18bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcblxuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W118bnVsbCA9IG51bGw7XG4gIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICAgICAgICAgIGBcIiR7dE5vZGUudmFsdWV9XCIgdGFncyBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgaG9zdHMuIGAgK1xuICAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHVzZSBhIGRpZmZlcmVudCB0YWcgdG8gYWN0aXZhdGUgdGhlICR7c3RyaW5naWZ5KGRlZi50eXBlKX0gY29tcG9uZW50LmApO1xuXG4gICAgICAgICAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkge1xuICAgICAgICAgICAgICB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUsIG1hdGNoZXMuZmluZChpc0NvbXBvbmVudERlZikhLnR5cGUsIGRlZi50eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgZnJvbnQgb2YgdGhlIG1hdGNoZXMgYXJyYXkgc28gdGhhdCB0aGVpciBsaWZlY3ljbGVcbiAgICAgICAgICAvLyBob29rcyBydW4gYmVmb3JlIGFueSBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzLiBUaGlzIGFwcGVhcnMgdG8gYmUgZm9yIFZpZXdFbmdpbmVcbiAgICAgICAgICAvLyBjb21wYXRpYmlsaXR5LiBUaGlzIGxvZ2ljIGRvZXNuJ3QgbWFrZSBzZW5zZSB3aXRoIGhvc3QgZGlyZWN0aXZlcywgYmVjYXVzZSBpdFxuICAgICAgICAgIC8vIHdvdWxkIGFsbG93IHRoZSBob3N0IGRpcmVjdGl2ZXMgdG8gdW5kbyBhbnkgb3ZlcnJpZGVzIHRoZSBob3N0IG1heSBoYXZlIG1hZGUuXG4gICAgICAgICAgLy8gVG8gaGFuZGxlIHRoaXMgY2FzZSwgdGhlIGhvc3QgZGlyZWN0aXZlcyBvZiBjb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAgLy8gb2YgdGhlIGFycmF5LCBmb2xsb3dlZCBieSB0aGUgY29tcG9uZW50LiBBcyBzdWNoLCB0aGUgaW5zZXJ0aW9uIG9yZGVyIGlzIGFzIGZvbGxvd3M6XG4gICAgICAgICAgLy8gMS4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byB0aGUgc2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMi4gU2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMy4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byBzZWxlY3Rvci1tYXRjaGVkIGRpcmVjdGl2ZXMuXG4gICAgICAgICAgLy8gNC4gU2VsZWN0b3ItbWF0Y2hlZCBkaXJlY3RpdmVzLlxuICAgICAgICAgIGlmIChkZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBob3N0RGlyZWN0aXZlTWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10gPSBbXTtcbiAgICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgICAgZGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcyhkZWYsIGhvc3REaXJlY3RpdmVNYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgICAgICAgICAvLyBBZGQgYWxsIGhvc3QgZGlyZWN0aXZlcyBkZWNsYXJlZCBvbiB0aGlzIGNvbXBvbmVudCwgZm9sbG93ZWQgYnkgdGhlIGNvbXBvbmVudCBpdHNlbGYuXG4gICAgICAgICAgICAvLyBIb3N0IGRpcmVjdGl2ZXMgc2hvdWxkIGV4ZWN1dGUgZmlyc3Qgc28gdGhlIGhvc3QgaGFzIGEgY2hhbmNlIHRvIG92ZXJyaWRlIGNoYW5nZXNcbiAgICAgICAgICAgIC8vIHRvIHRoZSBET00gbWFkZSBieSB0aGVtLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KC4uLmhvc3REaXJlY3RpdmVNYXRjaGVzLCBkZWYpO1xuICAgICAgICAgICAgLy8gQ29tcG9uZW50IGlzIG9mZnNldCBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGhvc3QgZGlyZWN0aXZlcyBhcnJheS5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE9mZnNldCA9IGhvc3REaXJlY3RpdmVNYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCBjb21wb25lbnRPZmZzZXQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBObyBob3N0IGRpcmVjdGl2ZXMgb24gdGhpcyBjb21wb25lbnQsIGp1c3QgYWRkIHRoZVxuICAgICAgICAgICAgLy8gY29tcG9uZW50IGRlZiB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtYXRjaGVzLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgICAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFwcGVuZCBhbnkgaG9zdCBkaXJlY3RpdmVzIHRvIHRoZSBtYXRjaGVzIGZpcnN0LlxuICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgIGRlZi5maW5kSG9zdERpcmVjdGl2ZURlZnM/LihkZWYsIG1hdGNoZXMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyA9PT0gbnVsbCA/IG51bGwgOiBbbWF0Y2hlcywgaG9zdERpcmVjdGl2ZURlZnNdO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgZ2l2ZW4gVE5vZGUgYXMgYSBjb21wb25lbnQncyBob3N0LiBUaGlzIGNvbnNpc3RzIG9mOlxuICogLSBzZXR0aW5nIHRoZSBjb21wb25lbnQgb2Zmc2V0IG9uIHRoZSBUTm9kZS5cbiAqIC0gc3RvcmluZyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSwgY29tcG9uZW50T2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihjb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBob3N0VE5vZGUuY29tcG9uZW50T2Zmc2V0ID0gY29tcG9uZW50T2Zmc2V0O1xuICAodFZpZXcuY29tcG9uZW50cyA/Pz0gW10pLnB1c2goaG9zdFROb2RlLmluZGV4KTtcbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuRVhQT1JUX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gZGlyZWN0aXZlSWR4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkgZXhwb3J0c01hcFsnJ10gPSBkaXJlY3RpdmVJZHg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0dXAgZGlyZWN0aXZlIGZvciBpbnN0YW50aWF0aW9uLlxuICpcbiAqIFdlIG5lZWQgdG8gY3JlYXRlIGEgYE5vZGVJbmplY3RvckZhY3RvcnlgIHdoaWNoIGlzIHRoZW4gaW5zZXJ0ZWQgaW4gYm90aCB0aGUgYEJsdWVwcmludGAgYXMgd2VsbFxuICogYXMgYExWaWV3YC4gYFRWaWV3YCBnZXRzIHRoZSBgRGlyZWN0aXZlRGVmYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YFxuICogQHBhcmFtIHROb2RlIGBUTm9kZWBcbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggd2hlcmUgdGhlIGRpcmVjdGl2ZSB3aWxsIGJlIHN0b3JlZCBpbiB0aGUgRXhwYW5kby5cbiAqIEBwYXJhbSBkZWYgYERpcmVjdGl2ZURlZmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZVZpZXdXaXRoRGlyZWN0aXZlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGRpcmVjdGl2ZUluZGV4LCBIRUFERVJfT0ZGU0VULCAnTXVzdCBiZSBpbiBFeHBhbmRvIHNlY3Rpb24nKTtcbiAgdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gPSBkZWY7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgLy8gRXZlbiB0aG91Z2ggYGRpcmVjdGl2ZUZhY3RvcnlgIHdpbGwgYWxyZWFkeSBiZSB1c2luZyBgybXJtWRpcmVjdGl2ZUluamVjdGAgaW4gaXRzIGdlbmVyYXRlZCBjb2RlLFxuICAvLyB3ZSBhbHNvIHdhbnQgdG8gc3VwcG9ydCBgaW5qZWN0KClgIGRpcmVjdGx5IGZyb20gdGhlIGRpcmVjdGl2ZSBjb25zdHJ1Y3RvciBjb250ZXh0IHNvIHdlIHNldFxuICAvLyBgybXJtWRpcmVjdGl2ZUluamVjdGAgYXMgdGhlIGluamVjdCBpbXBsZW1lbnRhdGlvbiBoZXJlIHRvby5cbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCDJtcm1ZGlyZWN0aXZlSW5qZWN0KTtcbiAgdFZpZXcuYmx1ZXByaW50W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG4gIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG5cbiAgcmVnaXN0ZXJIb3N0QmluZGluZ09wQ29kZXMoXG4gICAgICB0VmlldywgdE5vZGUsIGRpcmVjdGl2ZUluZGV4LCBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkZWYuaG9zdFZhcnMsIE5PX0NIQU5HRSksIGRlZik7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tFTlZJUk9OTUVOVF0ucmVuZGVyZXJGYWN0b3J5O1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG5hdGl2ZSxcbiAgICAgICAgICBob3N0VE5vZGUgYXMgVEVsZW1lbnROb2RlLCBudWxsLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpLCBudWxsLCBudWxsLFxuICAgICAgICAgIG51bGwpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICBgQXR0ZW1wdGVkIHRvIHNldCBhdHRyaWJ1dGUgXFxgJHtuYW1lfVxcYCBvbiBhIGNvbnRhaW5lciBub2RlLiBgICtcbiAgICAgICAgICAgIGBIb3N0IGJpbmRpbmdzIGFyZSBub3QgdmFsaWQgb24gbmctY29udGFpbmVyIG9yIG5nLXRlbXBsYXRlLmApO1xuICB9XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIHNldEVsZW1lbnRBdHRyaWJ1dGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCBuYW1lc3BhY2UsIHROb2RlLnZhbHVlLCBuYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQsIHRhZ05hbWU6IHN0cmluZ3xudWxsLFxuICAgIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUgYXMgc3RyaW5nLCBuYW1lc3BhY2UpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhIVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgaWYgKHNldElucHV0ICE9PSBudWxsKSB7XG4gICAgICAgIGRlZi5zZXRJbnB1dCEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIG5hdGl2ZUVsZW1lbnQsIHROb2RlLnR5cGUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGlucHV0cyBJbnB1dCBhbGlhcyBtYXAgdGhhdCB3YXMgZ2VuZXJhdGVkIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWYgaW5wdXRzLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGF0dHJzIFN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlcywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogSW5pdGlhbElucHV0c3xudWxsIHtcbiAgbGV0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHN8bnVsbCA9IG51bGw7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGlmIChpbnB1dHMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUgYXMgc3RyaW5nKSkge1xuICAgICAgaWYgKGlucHV0c1RvU3RvcmUgPT09IG51bGwpIGlucHV0c1RvU3RvcmUgPSBbXTtcblxuICAgICAgLy8gRmluZCB0aGUgaW5wdXQncyBwdWJsaWMgbmFtZSBmcm9tIHRoZSBpbnB1dCBzdG9yZS4gTm90ZSB0aGF0IHdlIGNhbiBiZSBmb3VuZCBlYXNpZXJcbiAgICAgIC8vIHRocm91Z2ggdGhlIGRpcmVjdGl2ZSBkZWYsIGJ1dCB3ZSB3YW50IHRvIGRvIGl0IHVzaW5nIHRoZSBpbnB1dHMgc3RvcmUgc28gdGhhdCBpdCBjYW5cbiAgICAgIC8vIGFjY291bnQgZm9yIGhvc3QgZGlyZWN0aXZlIGFsaWFzZXMuXG4gICAgICBjb25zdCBpbnB1dENvbmZpZyA9IGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbnB1dENvbmZpZy5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICBpZiAoaW5wdXRDb25maWdbal0gPT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKFxuICAgICAgICAgICAgICBhdHRyTmFtZSBhcyBzdHJpbmcsIGlucHV0Q29uZmlnW2ogKyAxXSBhcyBzdHJpbmcsIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmcpO1xuICAgICAgICAgIC8vIEEgZGlyZWN0aXZlIGNhbid0IGhhdmUgbXVsdGlwbGUgaW5wdXRzIHdpdGggdGhlIHNhbWUgbmFtZSBzbyB3ZSBjYW4gYnJlYWsgaGVyZS5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5wdXRzVG9TdG9yZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50fFJDb21tZW50fExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBbXG4gICAgaG9zdE5hdGl2ZSwgICAvLyBob3N0IG5hdGl2ZVxuICAgIHRydWUsICAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgIGZhbHNlLCAgICAgICAgLy8gaGFzIHRyYW5zcGxhbnRlZCB2aWV3c1xuICAgIGN1cnJlbnRWaWV3LCAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAvLyBuZXh0XG4gICAgMCwgICAgICAgICAgICAvLyB0cmFuc3BsYW50ZWQgdmlld3MgdG8gcmVmcmVzaCBjb3VudFxuICAgIHROb2RlLCAgICAgICAgLy8gdF9ob3N0XG4gICAgbmF0aXZlLCAgICAgICAvLyBuYXRpdmUsXG4gICAgbnVsbCwgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICBudWxsLCAgICAgICAgIC8vIG1vdmVkIHZpZXdzXG4gICAgbnVsbCwgICAgICAgICAvLyBkZWh5ZHJhdGVkIHZpZXdzXG4gIF07XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgbENvbnRhaW5lci5sZW5ndGgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULFxuICAgICAgICAgICdTaG91bGQgYWxsb2NhdGUgY29ycmVjdCBudW1iZXIgb2Ygc2xvdHMgZm9yIExDb250YWluZXIgaGVhZGVyLicpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuLyoqXG4gKiBHb2VzIG92ZXIgZW1iZWRkZWQgdmlld3MgKG9uZXMgY3JlYXRlZCB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYgQVBJcykgYW5kIHJlZnJlc2hlc1xuICogdGhlbSBieSBleGVjdXRpbmcgYW4gYXNzb2NpYXRlZCB0ZW1wbGF0ZSBmdW5jdGlvbi5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaEVtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGZvciAobGV0IGkgPSBDT05UQUlORVJfSEVBREVSX09GRlNFVDsgaSA8IGxDb250YWluZXIubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGVtYmVkZGVkTFZpZXcgPSBsQ29udGFpbmVyW2ldO1xuICAgICAgY29uc3QgZW1iZWRkZWRUVmlldyA9IGVtYmVkZGVkTFZpZXdbVFZJRVddO1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3RvcihlbWJlZGRlZExWaWV3KSkge1xuICAgICAgICByZWZyZXNoVmlldyhlbWJlZGRlZFRWaWV3LCBlbWJlZGRlZExWaWV3LCBlbWJlZGRlZFRWaWV3LnRlbXBsYXRlLCBlbWJlZGRlZExWaWV3W0NPTlRFWFRdISk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogTWFyayB0cmFuc3BsYW50ZWQgdmlld3MgYXMgbmVlZGluZyB0byBiZSByZWZyZXNoZWQgYXQgdGhlaXIgaW5zZXJ0aW9uIHBvaW50cy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBtYXkgaGF2ZSB0cmFuc3BsYW50ZWQgdmlld3MuXG4gKi9cbmZ1bmN0aW9uIG1hcmtUcmFuc3BsYW50ZWRWaWV3c0ZvclJlZnJlc2gobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGxDb250YWluZXIgPSBnZXRGaXJzdExDb250YWluZXIobFZpZXcpOyBsQ29udGFpbmVyICE9PSBudWxsO1xuICAgICAgIGxDb250YWluZXIgPSBnZXROZXh0TENvbnRhaW5lcihsQ29udGFpbmVyKSkge1xuICAgIGlmICghbENvbnRhaW5lcltIQVNfVFJBTlNQTEFOVEVEX1ZJRVdTXSkgY29udGludWU7XG5cbiAgICBjb25zdCBtb3ZlZFZpZXdzID0gbENvbnRhaW5lcltNT1ZFRF9WSUVXU10hO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKG1vdmVkVmlld3MsICdUcmFuc3BsYW50ZWQgVmlldyBmbGFncyBzZXQgYnV0IG1pc3NpbmcgTU9WRURfVklFV1MnKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1vdmVkVmlld3MubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG1vdmVkTFZpZXcgPSBtb3ZlZFZpZXdzW2ldITtcbiAgICAgIGNvbnN0IGluc2VydGlvbkxDb250YWluZXIgPSBtb3ZlZExWaWV3W1BBUkVOVF0gYXMgTENvbnRhaW5lcjtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRMQ29udGFpbmVyKGluc2VydGlvbkxDb250YWluZXIpO1xuICAgICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBpbmNyZW1lbnQgdGhlIGNvdW50ZXIgaWYgdGhlIG1vdmVkIExWaWV3IHdhcyBhbHJlYWR5IG1hcmtlZCBmb3JcbiAgICAgIC8vIHJlZnJlc2guXG4gICAgICBpZiAoKG1vdmVkTFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5SZWZyZXNoVHJhbnNwbGFudGVkVmlldykgPT09IDApIHtcbiAgICAgICAgdXBkYXRlVHJhbnNwbGFudGVkVmlld0NvdW50KGluc2VydGlvbkxDb250YWluZXIsIDEpO1xuICAgICAgfVxuICAgICAgLy8gTm90ZSwgaXQgaXMgcG9zc2libGUgdGhhdCB0aGUgYG1vdmVkVmlld3NgIGlzIHRyYWNraW5nIHZpZXdzIHRoYXQgYXJlIHRyYW5zcGxhbnRlZCAqYW5kKlxuICAgICAgLy8gdGhvc2UgdGhhdCBhcmVuJ3QgKGRlY2xhcmF0aW9uIGNvbXBvbmVudCA9PT0gaW5zZXJ0aW9uIGNvbXBvbmVudCkuIEluIHRoZSBsYXR0ZXIgY2FzZSxcbiAgICAgIC8vIGl0J3MgZmluZSB0byBhZGQgdGhlIGZsYWcsIGFzIHdlIHdpbGwgY2xlYXIgaXQgaW1tZWRpYXRlbHkgaW5cbiAgICAgIC8vIGByZWZyZXNoRW1iZWRkZWRWaWV3c2AgZm9yIHRoZSB2aWV3IGN1cnJlbnRseSBiZWluZyByZWZyZXNoZWQuXG4gICAgICBtb3ZlZExWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3O1xuICAgIH1cbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogUmVmcmVzaGVzIGNvbXBvbmVudHMgYnkgZW50ZXJpbmcgdGhlIGNvbXBvbmVudCB2aWV3IGFuZCBwcm9jZXNzaW5nIGl0cyBiaW5kaW5ncywgcXVlcmllcywgZXRjLlxuICpcbiAqIEBwYXJhbSBjb21wb25lbnRIb3N0SWR4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5mdW5jdGlvbiByZWZyZXNoQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgZmFsc2UsICdTaG91bGQgYmUgcnVuIGluIHVwZGF0ZSBtb2RlJyk7XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgoY29tcG9uZW50SG9zdElkeCwgaG9zdExWaWV3KTtcbiAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICBpZiAodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihjb21wb25lbnRWaWV3KSkge1xuICAgIGNvbnN0IHRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gICAgaWYgKGNvbXBvbmVudFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgICAgcmVmcmVzaFZpZXcodFZpZXcsIGNvbXBvbmVudFZpZXcsIHRWaWV3LnRlbXBsYXRlLCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbiAgICB9IGVsc2UgaWYgKGNvbXBvbmVudFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgLy8gT25seSBhdHRhY2hlZCBjb21wb25lbnRzIHRoYXQgYXJlIENoZWNrQWx3YXlzIG9yIE9uUHVzaCBhbmQgZGlydHkgc2hvdWxkIGJlIHJlZnJlc2hlZFxuICAgICAgcmVmcmVzaENvbnRhaW5zRGlydHlWaWV3KGNvbXBvbmVudFZpZXcpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyBhbGwgdHJhbnNwbGFudGVkIHZpZXdzIG1hcmtlZCB3aXRoIGBMVmlld0ZsYWdzLlJlZnJlc2hUcmFuc3BsYW50ZWRWaWV3YCB0aGF0IGFyZVxuICogY2hpbGRyZW4gb3IgZGVzY2VuZGFudHMgb2YgdGhlIGdpdmVuIGxWaWV3LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgbFZpZXcgd2hpY2ggY29udGFpbnMgZGVzY2VuZGFudCB0cmFuc3BsYW50ZWQgdmlld3MgdGhhdCBuZWVkIHRvIGJlIHJlZnJlc2hlZC5cbiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRhaW5zRGlydHlWaWV3KGxWaWV3OiBMVmlldykge1xuICBmb3IgKGxldCBsQ29udGFpbmVyID0gZ2V0Rmlyc3RMQ29udGFpbmVyKGxWaWV3KTsgbENvbnRhaW5lciAhPT0gbnVsbDtcbiAgICAgICBsQ29udGFpbmVyID0gZ2V0TmV4dExDb250YWluZXIobENvbnRhaW5lcikpIHtcbiAgICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZExWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGVtYmVkZGVkTFZpZXcpKSB7XG4gICAgICAgIGlmIChlbWJlZGRlZExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuUmVmcmVzaFRyYW5zcGxhbnRlZFZpZXcpIHtcbiAgICAgICAgICBjb25zdCBlbWJlZGRlZFRWaWV3ID0gZW1iZWRkZWRMVmlld1tUVklFV107XG4gICAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZW1iZWRkZWRUVmlldywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgICAgICAgcmVmcmVzaFZpZXcoXG4gICAgICAgICAgICAgIGVtYmVkZGVkVFZpZXcsIGVtYmVkZGVkTFZpZXcsIGVtYmVkZGVkVFZpZXcudGVtcGxhdGUsIGVtYmVkZGVkTFZpZXdbQ09OVEVYVF0hKTtcblxuICAgICAgICB9IGVsc2UgaWYgKGVtYmVkZGVkTFZpZXdbVFJBTlNQTEFOVEVEX1ZJRVdTX1RPX1JFRlJFU0hdID4gMCkge1xuICAgICAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5VmlldyhlbWJlZGRlZExWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAvLyBSZWZyZXNoIGNoaWxkIGNvbXBvbmVudCB2aWV3cy5cbiAgY29uc3QgY29tcG9uZW50cyA9IHRWaWV3LmNvbXBvbmVudHM7XG4gIGlmIChjb21wb25lbnRzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb21wb25lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudHNbaV0sIGxWaWV3KTtcbiAgICAgIC8vIE9ubHkgYXR0YWNoZWQgY29tcG9uZW50cyB0aGF0IGFyZSBDaGVja0Fsd2F5cyBvciBPblB1c2ggYW5kIGRpcnR5IHNob3VsZCBiZSByZWZyZXNoZWRcbiAgICAgIGlmICh2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yKGNvbXBvbmVudFZpZXcpICYmXG4gICAgICAgICAgY29tcG9uZW50Vmlld1tUUkFOU1BMQU5URURfVklFV1NfVE9fUkVGUkVTSF0gPiAwKSB7XG4gICAgICAgIHJlZnJlc2hDb250YWluc0RpcnR5Vmlldyhjb21wb25lbnRWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50KGhvc3RMVmlldzogTFZpZXcsIGNvbXBvbmVudEhvc3RJZHg6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoaXNDcmVhdGlvbk1vZGUoaG9zdExWaWV3KSwgdHJ1ZSwgJ1Nob3VsZCBiZSBydW4gaW4gY3JlYXRpb24gbW9kZScpO1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gZ2V0Q29tcG9uZW50TFZpZXdCeUluZGV4KGNvbXBvbmVudEhvc3RJZHgsIGhvc3RMVmlldyk7XG4gIGNvbnN0IGNvbXBvbmVudFRWaWV3ID0gY29tcG9uZW50Vmlld1tUVklFV107XG4gIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRUVmlldywgY29tcG9uZW50Vmlldyk7XG5cbiAgY29uc3QgaG9zdFJOb2RlID0gY29tcG9uZW50Vmlld1tIT1NUXTtcbiAgLy8gUG9wdWxhdGUgYW4gTFZpZXcgd2l0aCBoeWRyYXRpb24gaW5mbyByZXRyaWV2ZWQgZnJvbSB0aGUgRE9NIHZpYSBUcmFuc2ZlclN0YXRlLlxuICBpZiAoaG9zdFJOb2RlICE9PSBudWxsICYmIGNvbXBvbmVudFZpZXdbSFlEUkFUSU9OXSA9PT0gbnVsbCkge1xuICAgIGNvbXBvbmVudFZpZXdbSFlEUkFUSU9OXSA9IHJldHJpZXZlSHlkcmF0aW9uSW5mbyhob3N0Uk5vZGUsIGNvbXBvbmVudFZpZXdbSU5KRUNUT1JdISk7XG4gIH1cblxuICByZW5kZXJWaWV3KGNvbXBvbmVudFRWaWV3LCBjb21wb25lbnRWaWV3LCBjb21wb25lbnRWaWV3W0NPTlRFWFRdKTtcbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGBUVmlld2AgdGhhdCBjb250YWlucyB0aGUgYmx1ZXByaW50IGZvciBzeW5jaW5nXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQodFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpIHtcbiAgZm9yIChsZXQgaSA9IGxWaWV3Lmxlbmd0aDsgaSA8IHRWaWV3LmJsdWVwcmludC5sZW5ndGg7IGkrKykge1xuICAgIGxWaWV3LnB1c2godFZpZXcuYmx1ZXByaW50W2ldKTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2Ygb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lciBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W0VOVklST05NRU5UXS5yZW5kZXJlckZhY3Rvcnk7XG5cbiAgLy8gQ2hlY2sgbm8gY2hhbmdlcyBtb2RlIGlzIGEgZGV2IG9ubHkgbW9kZSB1c2VkIHRvIHZlcmlmeSB0aGF0IGJpbmRpbmdzIGhhdmUgbm90IGNoYW5nZWRcbiAgLy8gc2luY2UgdGhleSB3ZXJlIGFzc2lnbmVkLiBXZSBkbyBub3Qgd2FudCB0byBpbnZva2UgcmVuZGVyZXIgZmFjdG9yeSBmdW5jdGlvbnMgaW4gdGhhdCBtb2RlXG4gIC8vIHRvIGF2b2lkIGFueSBwb3NzaWJsZSBzaWRlLWVmZmVjdHMuXG4gIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9ICEhbmdEZXZNb2RlICYmIGlzSW5DaGVja05vQ2hhbmdlc01vZGUoKTtcblxuICBpZiAoIWNoZWNrTm9DaGFuZ2VzTW9kZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICB0cnkge1xuICAgIHJlZnJlc2hWaWV3KHRWaWV3LCBsVmlldywgdFZpZXcudGVtcGxhdGUsIGNvbnRleHQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGlmIChub3RpZnlFcnJvckhhbmRsZXIpIHtcbiAgICAgIGhhbmRsZUVycm9yKGxWaWV3LCBlcnJvcik7XG4gICAgfVxuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmICghY2hlY2tOb0NoYW5nZXNNb2RlICYmIHJlbmRlcmVyRmFjdG9yeS5lbmQpIHJlbmRlcmVyRmFjdG9yeS5lbmQoKTtcblxuICAgIC8vIE9uZSBmaW5hbCBmbHVzaCBvZiB0aGUgZWZmZWN0cyBxdWV1ZSB0byBjYXRjaCBhbnkgZWZmZWN0cyBjcmVhdGVkIGluIGBuZ0FmdGVyVmlld0luaXRgIG9yXG4gICAgLy8gb3RoZXIgcG9zdC1vcmRlciBob29rcy5cbiAgICAhY2hlY2tOb0NoYW5nZXNNb2RlICYmIGxWaWV3W0VOVklST05NRU5UXS5lZmZlY3RNYW5hZ2VyPy5mbHVzaCgpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlc0ludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBjb250ZXh0OiBULCBub3RpZnlFcnJvckhhbmRsZXIgPSB0cnVlKSB7XG4gIHNldElzSW5DaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHRWaWV3LCBsVmlldywgY29udGV4dCwgbm90aWZ5RXJyb3JIYW5kbGVyKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRJc0luQ2hlY2tOb0NoYW5nZXNNb2RlKGZhbHNlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjxUPiwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdRdWVyeUZuLCAnVmlldyBxdWVyaWVzIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgbXVzdCBiZSBkZWZpbmVkLicpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgdmlld1F1ZXJ5Rm4oZmxhZ3MsIGNvbXBvbmVudCk7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQmluZGluZ3MgJiBpbnRlcnBvbGF0aW9uc1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFN0b3JlcyBtZXRhLWRhdGEgZm9yIGEgcHJvcGVydHkgYmluZGluZyB0byBiZSB1c2VkIGJ5IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgLlxuICpcbiAqIEluIG9yZGVyIHRvIHN1cHBvcnQgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2Agd2UgbmVlZCB0byBzYXZlLCBmb3IgZWFjaCBiaW5kaW5nOlxuICogLSBhIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiAtIGEgc3RhdGljIHBhcnRzIG9mIGludGVycG9sYXRlZCBzdHJpbmdzO1xuICpcbiAqIEEgZ2l2ZW4gcHJvcGVydHkgbWV0YWRhdGEgaXMgc2F2ZWQgYXQgdGhlIGJpbmRpbmcncyBpbmRleCBpbiB0aGUgYFRWaWV3LmRhdGFgIChpbiBvdGhlciB3b3JkcywgYVxuICogcHJvcGVydHkgYmluZGluZyBtZXRhZGF0YSB3aWxsIGJlIHN0b3JlZCBpbiBgVFZpZXcuZGF0YWAgYXQgdGhlIHNhbWUgaW5kZXggYXMgYSBib3VuZCB2YWx1ZSBpblxuICogYExWaWV3YCkuIE1ldGFkYXRhIGFyZSByZXByZXNlbnRlZCBhcyBgSU5URVJQT0xBVElPTl9ERUxJTUlURVJgLWRlbGltaXRlZCBzdHJpbmcgd2l0aCB0aGVcbiAqIGZvbGxvd2luZyBmb3JtYXQ6XG4gKiAtIGBwcm9wZXJ0eU5hbWVgIGZvciBib3VuZCBwcm9wZXJ0aWVzO1xuICogLSBgcHJvcGVydHlOYW1l77+9cHJlZml477+9aW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydDHvv70uLmludGVycG9sYXRpb25fc3RhdGljX3BhcnRO77+9c3VmZml4YCBmb3JcbiAqIGludGVycG9sYXRlZCBwcm9wZXJ0aWVzLlxuICpcbiAqIEBwYXJhbSB0RGF0YSBgVERhdGFgIHdoZXJlIG1ldGEtZGF0YSB3aWxsIGJlIHNhdmVkO1xuICogQHBhcmFtIHROb2RlIGBUTm9kZWAgdGhhdCBpcyBhIHRhcmdldCBvZiB0aGUgYmluZGluZztcbiAqIEBwYXJhbSBwcm9wZXJ0eU5hbWUgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIEBwYXJhbSBiaW5kaW5nSW5kZXggYmluZGluZyBpbmRleCBpbiBgTFZpZXdgXG4gKiBAcGFyYW0gaW50ZXJwb2xhdGlvblBhcnRzIHN0YXRpYyBpbnRlcnBvbGF0aW9uIHBhcnRzIChmb3IgcHJvcGVydHkgaW50ZXJwb2xhdGlvbnMpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZVByb3BlcnR5QmluZGluZ01ldGFkYXRhKFxuICAgIHREYXRhOiBURGF0YSwgdE5vZGU6IFROb2RlLCBwcm9wZXJ0eU5hbWU6IHN0cmluZywgYmluZGluZ0luZGV4OiBudW1iZXIsXG4gICAgLi4uaW50ZXJwb2xhdGlvblBhcnRzOiBzdHJpbmdbXSkge1xuICAvLyBCaW5kaW5nIG1ldGEtZGF0YSBhcmUgc3RvcmVkIG9ubHkgdGhlIGZpcnN0IHRpbWUgYSBnaXZlbiBwcm9wZXJ0eSBpbnN0cnVjdGlvbiBpcyBwcm9jZXNzZWQuXG4gIC8vIFNpbmNlIHdlIGRvbid0IGhhdmUgYSBjb25jZXB0IG9mIHRoZSBcImZpcnN0IHVwZGF0ZSBwYXNzXCIgd2UgbmVlZCB0byBjaGVjayBmb3IgcHJlc2VuY2Ugb2YgdGhlXG4gIC8vIGJpbmRpbmcgbWV0YS1kYXRhIHRvIGRlY2lkZSBpZiBvbmUgc2hvdWxkIGJlIHN0b3JlZCAob3IgaWYgd2FzIHN0b3JlZCBhbHJlYWR5KS5cbiAgaWYgKHREYXRhW2JpbmRpbmdJbmRleF0gPT09IG51bGwpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09IG51bGwgfHwgIXROb2RlLmlucHV0c1twcm9wZXJ0eU5hbWVdKSB7XG4gICAgICBjb25zdCBwcm9wQmluZGluZ0lkeHMgPSB0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzIHx8ICh0Tm9kZS5wcm9wZXJ0eUJpbmRpbmdzID0gW10pO1xuICAgICAgcHJvcEJpbmRpbmdJZHhzLnB1c2goYmluZGluZ0luZGV4KTtcbiAgICAgIGxldCBiaW5kaW5nTWV0YWRhdGEgPSBwcm9wZXJ0eU5hbWU7XG4gICAgICBpZiAoaW50ZXJwb2xhdGlvblBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgYmluZGluZ01ldGFkYXRhICs9XG4gICAgICAgICAgICBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIGludGVycG9sYXRpb25QYXJ0cy5qb2luKElOVEVSUE9MQVRJT05fREVMSU1JVEVSKTtcbiAgICAgIH1cbiAgICAgIHREYXRhW2JpbmRpbmdJbmRleF0gPSBiaW5kaW5nTWV0YWRhdGE7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUxWaWV3Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVFZpZXdDbGVhbnVwKHRWaWV3OiBUVmlldyk6IGFueVtdIHtcbiAgcmV0dXJuIHRWaWV3LmNsZWFudXAgfHwgKHRWaWV3LmNsZWFudXAgPSBbXSk7XG59XG5cbi8qKlxuICogVGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBzdWIgY29tcG9uZW50J3MgcmVuZGVyZXIgbmVlZHMgdG8gYmUgaW5jbHVkZWRcbiAqIGluc3RlYWQgb2YgdGhlIGN1cnJlbnQgcmVuZGVyZXIgKHNlZSB0aGUgY29tcG9uZW50U3ludGhldGljSG9zdCogaW5zdHJ1Y3Rpb25zKS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvYWRDb21wb25lbnRSZW5kZXJlcihcbiAgICBjdXJyZW50RGVmOiBEaXJlY3RpdmVEZWY8YW55PnxudWxsLCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJlbmRlcmVyIHtcbiAgLy8gVE9ETyhGVy0yMDQzKTogdGhlIGBjdXJyZW50RGVmYCBpcyBudWxsIHdoZW4gaG9zdCBiaW5kaW5ncyBhcmUgaW52b2tlZCB3aGlsZSBjcmVhdGluZyByb290XG4gIC8vIGNvbXBvbmVudCAoc2VlIHBhY2thZ2VzL2NvcmUvc3JjL3JlbmRlcjMvY29tcG9uZW50LnRzKS4gVGhpcyBpcyBub3QgY29uc2lzdGVudCB3aXRoIHRoZSBwcm9jZXNzXG4gIC8vIG9mIGNyZWF0aW5nIGlubmVyIGNvbXBvbmVudHMsIHdoZW4gY3VycmVudCBkaXJlY3RpdmUgaW5kZXggaXMgYXZhaWxhYmxlIGluIHRoZSBzdGF0ZS4gSW4gb3JkZXJcbiAgLy8gdG8gYXZvaWQgcmVseWluZyBvbiBjdXJyZW50IGRlZiBiZWluZyBgbnVsbGAgKHRodXMgc3BlY2lhbC1jYXNpbmcgcm9vdCBjb21wb25lbnQgY3JlYXRpb24pLCB0aGVcbiAgLy8gcHJvY2VzcyBvZiBjcmVhdGluZyByb290IGNvbXBvbmVudCBzaG91bGQgYmUgdW5pZmllZCB3aXRoIHRoZSBwcm9jZXNzIG9mIGNyZWF0aW5nIGlubmVyXG4gIC8vIGNvbXBvbmVudHMuXG4gIGlmIChjdXJyZW50RGVmID09PSBudWxsIHx8IGlzQ29tcG9uZW50RGVmKGN1cnJlbnREZWYpKSB7XG4gICAgbFZpZXcgPSB1bndyYXBMVmlldyhsVmlld1t0Tm9kZS5pbmRleF0pITtcbiAgfVxuICByZXR1cm4gbFZpZXdbUkVOREVSRVJdO1xufVxuXG4vKiogSGFuZGxlcyBhbiBlcnJvciB0aHJvd24gaW4gYW4gTFZpZXcuICovXG5leHBvcnQgZnVuY3Rpb24gaGFuZGxlRXJyb3IobFZpZXc6IExWaWV3LCBlcnJvcjogYW55KTogdm9pZCB7XG4gIGNvbnN0IGluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBlcnJvckhhbmRsZXIgPSBpbmplY3RvciA/IGluamVjdG9yLmdldChFcnJvckhhbmRsZXIsIG51bGwpIDogbnVsbDtcbiAgZXJyb3JIYW5kbGVyICYmIGVycm9ySGFuZGxlci5oYW5kbGVFcnJvcihlcnJvcik7XG59XG5cbi8qKlxuICogU2V0IHRoZSBpbnB1dHMgb2YgZGlyZWN0aXZlcyBhdCB0aGUgY3VycmVudCBub2RlIHRvIGNvcnJlc3BvbmRpbmcgdmFsdWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IFRWaWV3XG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiAgICAgICAgcG9zc2libHkgbWluaWZpZWQsIHByb3BlcnR5IG5hbWVzIHRvIHdyaXRlIHRvLlxuICogQHBhcmFtIHZhbHVlIFZhbHVlIHRvIHNldC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldElucHV0c0ZvclByb3BlcnR5KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgcHVibGljTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KTogdm9pZCB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5wdXRzLmxlbmd0aDspIHtcbiAgICBjb25zdCBpbmRleCA9IGlucHV0c1tpKytdIGFzIG51bWJlcjtcbiAgICBjb25zdCBwcml2YXRlTmFtZSA9IGlucHV0c1tpKytdIGFzIHN0cmluZztcbiAgICBjb25zdCBpbnN0YW5jZSA9IGxWaWV3W2luZGV4XTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGRlZi5zZXRJbnB1dCAhPT0gbnVsbCkge1xuICAgICAgZGVmLnNldElucHV0IShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKHZhbHVlLCAnVmFsdWUgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAndmFsdWUgc2hvdWxkIG5vdCBiZSBOT19DSEFOR0UnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICB1cGRhdGVUZXh0Tm9kZShsVmlld1tSRU5ERVJFUl0sIGVsZW1lbnQsIHZhbHVlKTtcbn1cbiJdfQ==