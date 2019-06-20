/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertNotEqual, assertNotSame } from '../../util/assert';
import { createNamedArrayType } from '../../util/named_array_type';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertLView, assertPreviousIsParent } from '../assert';
import { attachPatchData, getComponentViewByInstance } from '../context_discovery';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeHooks, executePreOrderHooks, registerPreOrderHooks } from '../hooks';
import { ACTIVE_INDEX, CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getLView, getNamespace, getPreviousOrParentTNode, getSelectedIndex, incrementActiveDirectiveId, isCreationMode, leaveView, setActiveHostElement, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setPreviousOrParentTNode, setSelectedIndex, ɵɵnamespaceHTML } from '../state';
import { initializeStaticContext as initializeStaticStylingContext } from '../styling/class_and_style_bindings';
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { attrsStylingIndexOf } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify, stringifyForError } from '../util/misc_utils';
import { getLViewParent, getRootContext } from '../util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, isComponent, isComponentDef, isContentQueryHost, isLContainer, isRootView, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
import { LCleanup, LViewBlueprint, MatchesArray, TCleanup, TNodeInitialData, TNodeInitialInputs, TNodeLocalNames, TViewComponents, TViewConstructor, attachLContainerDebug, attachLViewDebug, cloneToLView, cloneToTViewData } from './lview_debug';
import { selectInternal } from './select';
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
/** @enum {number} */
const BindingDirection = {
    Input: 0,
    Output: 1,
};
export { BindingDirection };
/**
 * Refreshes the view, executing the following steps in that order:
 * triggers init hooks, refreshes dynamic embedded views, triggers content hooks, sets host
 * bindings, refreshes child components.
 * Note: view hooks are triggered later when leaving the view.
 * @param {?} lView
 * @return {?}
 */
export function refreshDescendantViews(lView) {
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const creationMode = isCreationMode(lView);
    // This needs to be set before children are processed to support recursive components
    tView.firstTemplatePass = false;
    // Resetting the bindingIndex of the current LView as the next steps may trigger change detection.
    lView[BINDING_INDEX] = tView.bindingStartIndex;
    // If this is a creation pass, we should not call lifecycle hooks or evaluate bindings.
    // This will be done in the update pass.
    if (!creationMode) {
        /** @type {?} */
        const checkNoChangesMode = getCheckNoChangesMode();
        executePreOrderHooks(lView, tView, checkNoChangesMode, undefined);
        refreshDynamicEmbeddedViews(lView);
        // Content query results must be refreshed before content hooks are called.
        refreshContentQueries(tView, lView);
        resetPreOrderHookFlags(lView);
        executeHooks(lView, tView.contentHooks, tView.contentCheckHooks, checkNoChangesMode, 1 /* AfterContentInitHooksToBeRun */, undefined);
        setHostBindings(tView, lView);
    }
    // We resolve content queries specifically marked as `static` in creation mode. Dynamic
    // content queries are resolved during change detection (i.e. update mode), after embedded
    // views are refreshed (see block above).
    if (creationMode && tView.staticContentQueries) {
        refreshContentQueries(tView, lView);
    }
    refreshChildComponents(tView.components);
}
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
        if (tView.expandoInstructions) {
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
 * Refreshes content queries for all directives in the given view.
 * @param {?} tView
 * @param {?} lView
 * @return {?}
 */
function refreshContentQueries(tView, lView) {
    if (tView.contentQueries != null) {
        setCurrentQueryIndex(0);
        for (let i = 0; i < tView.contentQueries.length; i++) {
            /** @type {?} */
            const directiveDefIdx = tView.contentQueries[i];
            /** @type {?} */
            const directiveDef = (/** @type {?} */ (tView.data[directiveDefIdx]));
            ngDevMode &&
                assertDefined(directiveDef.contentQueries, 'contentQueries function should be defined');
            (/** @type {?} */ (directiveDef.contentQueries))(2 /* Update */, lView[directiveDefIdx], directiveDefIdx);
        }
    }
}
/**
 * Refreshes child components in the current view.
 * @param {?} components
 * @return {?}
 */
function refreshChildComponents(components) {
    if (components != null) {
        for (let i = 0; i < components.length; i++) {
            componentRefresh(components[i]);
        }
    }
}
/**
 * Creates a native element from a tag name, using a renderer.
 * @param {?} name the tag name
 * @param {?=} overriddenRenderer Optional A renderer to override the default one
 * @return {?} the element created
 */
export function elementCreate(name, overriddenRenderer) {
    /** @type {?} */
    let native;
    /** @type {?} */
    const rendererToUse = overriddenRenderer || getLView()[RENDERER];
    /** @type {?} */
    const namespace = getNamespace();
    if (isProceduralRenderer(rendererToUse)) {
        native = rendererToUse.createElement(name, namespace);
    }
    else {
        if (namespace === null) {
            native = rendererToUse.createElement(name);
        }
        else {
            native = rendererToUse.createElementNS(namespace, name);
        }
    }
    return native;
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
        createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index);
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
 * @param {?} index
 * @return {?}
 */
function createTNodeAtIndex(tView, tHostNode, adjustedIndex, type, name, attrs, index) {
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
        createTNode(tParentNode, type, adjustedIndex, name, attrs);
    // The first node is not always the one at index 0, in case of i18n, index 0 can be the
    // instruction `i18nStart` and the first node has the index 1 or more
    if (index === 0 || !tView.firstChild) {
        tView.firstChild = tNode;
    }
    // Now link ourselves into the tree.
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
        tView.node = tNode = (/** @type {?} */ (createTNode((/** @type {?} */ (tParentNode)), //
        2 /* View */, index, null, null)));
    }
    return lView[T_HOST] = (/** @type {?} */ (tNode));
}
/**
 * When elements are created dynamically after a view blueprint is created (e.g. through
 * i18nApply() or ComponentFactory.create), we need to adjust the blueprint for future
 * template passes.
 * @param {?} view
 * @param {?} numSlotsToAlloc
 * @return {?}
 */
export function allocExpando(view, numSlotsToAlloc) {
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
//////////////////////////
//// Render
//////////////////////////
/**
 * Used for creating the LViewNode of a dynamic embedded view,
 * either through ViewContainerRef.createEmbeddedView() or TemplateRef.createEmbeddedView().
 * Such lViewNode will then be renderer with renderEmbeddedTemplate() (see below).
 * @template T
 * @param {?} tView
 * @param {?} context
 * @param {?} declarationView
 * @param {?} queries
 * @param {?} injectorIndex
 * @return {?}
 */
export function createEmbeddedViewAndNode(tView, context, declarationView, queries, injectorIndex) {
    /** @type {?} */
    const _isParent = getIsParent();
    /** @type {?} */
    const _previousOrParentTNode = getPreviousOrParentTNode();
    setPreviousOrParentTNode((/** @type {?} */ (null)), true);
    /** @type {?} */
    const lView = createLView(declarationView, tView, context, 16 /* CheckAlways */, null, null);
    lView[DECLARATION_VIEW] = declarationView;
    if (queries) {
        lView[QUERIES] = queries.createView();
    }
    assignTViewNodeToLView(tView, null, -1, lView);
    if (tView.firstTemplatePass) {
        (/** @type {?} */ (tView.node)).injectorIndex = injectorIndex;
    }
    setPreviousOrParentTNode(_previousOrParentTNode, _isParent);
    return lView;
}
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor
 * inside
 * an ngFor), the nesting would mean we'd have multiple instances of the template function, so we
 * can't store TViews in the template function itself (as we do for comps). Instead, we store the
 * TView for dynamically created views on their host TNode, which only has one instance.
 * @template T
 * @param {?} viewToRender
 * @param {?} tView
 * @param {?} context
 * @return {?}
 */
export function renderEmbeddedTemplate(viewToRender, tView, context) {
    /** @type {?} */
    const _isParent = getIsParent();
    /** @type {?} */
    const _previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    let oldView;
    if (viewToRender[FLAGS] & 512 /* IsRoot */) {
        // This is a root view inside the view tree
        tickRootContext(getRootContext(viewToRender));
    }
    else {
        try {
            setPreviousOrParentTNode((/** @type {?} */ (null)), true);
            oldView = enterView(viewToRender, viewToRender[T_HOST]);
            resetPreOrderHookFlags(viewToRender);
            executeTemplate(viewToRender, (/** @type {?} */ (tView.template)), getRenderFlags(viewToRender), context);
            // This must be set to false immediately after the first creation run because in an
            // ngFor loop, all the views will be created together before update mode runs and turns
            // off firstTemplatePass. If we don't set it here, instances will perform directive
            // matching, etc again and again.
            viewToRender[TVIEW].firstTemplatePass = false;
            refreshDescendantViews(viewToRender);
        }
        finally {
            leaveView((/** @type {?} */ (oldView)));
            setPreviousOrParentTNode(_previousOrParentTNode, _isParent);
        }
    }
}
/**
 * @template T
 * @param {?} hostView
 * @param {?} context
 * @param {?=} templateFn
 * @return {?}
 */
export function renderComponentOrTemplate(hostView, context, templateFn) {
    /** @type {?} */
    const rendererFactory = hostView[RENDERER_FACTORY];
    /** @type {?} */
    const oldView = enterView(hostView, hostView[T_HOST]);
    /** @type {?} */
    const normalExecutionPath = !getCheckNoChangesMode();
    /** @type {?} */
    const creationModeIsActive = isCreationMode(hostView);
    try {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.begin) {
            rendererFactory.begin();
        }
        if (creationModeIsActive) {
            // creation mode pass
            templateFn && executeTemplate(hostView, templateFn, 1 /* Create */, context);
            refreshDescendantViews(hostView);
            hostView[FLAGS] &= ~4 /* CreationMode */;
        }
        // update mode pass
        resetPreOrderHookFlags(hostView);
        templateFn && executeTemplate(hostView, templateFn, 2 /* Update */, context);
        refreshDescendantViews(hostView);
    }
    finally {
        if (normalExecutionPath && !creationModeIsActive && rendererFactory.end) {
            rendererFactory.end();
        }
        leaveView(oldView);
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
    ɵɵnamespaceHTML();
    /** @type {?} */
    const prevSelectedIndex = getSelectedIndex();
    try {
        setActiveHostElement(null);
        if (rf & 2 /* Update */) {
            // When we're updating, have an inherent ɵɵselect(0) so we don't have to generate that
            // instruction for most update blocks
            selectInternal(lView, 0);
        }
        templateFn(rf, context);
    }
    finally {
        setSelectedIndex(prevSelectedIndex);
    }
}
/**
 * This function returns the default configuration of rendering flags depending on when the
 * template is in creation mode or update mode. Update block and create block are
 * always run separately.
 * @param {?} view
 * @return {?}
 */
function getRenderFlags(view) {
    return isCreationMode(view) ? 1 /* Create */ : 2 /* Update */;
}
//////////////////////////
//// Element
//////////////////////////
/**
 * Appropriately sets `stylingTemplate` on a TNode
 *
 * Does not apply styles to DOM nodes
 *
 * @param {?} tView
 * @param {?} tNode The node whose `stylingTemplate` to set
 * @param {?} attrs The attribute array source to set the attributes from
 * @param {?} attrsStartIndex Optional start index to start processing the `attrs` from
 * @return {?}
 */
export function setNodeStylingTemplate(tView, tNode, attrs, attrsStartIndex) {
    if (tView.firstTemplatePass && !tNode.stylingTemplate) {
        /** @type {?} */
        const stylingAttrsStartIndex = attrsStylingIndexOf(attrs, attrsStartIndex);
        if (stylingAttrsStartIndex >= 0) {
            tNode.stylingTemplate = initializeStaticStylingContext(attrs, stylingAttrsStartIndex);
        }
    }
}
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
 * Creates directive instances and populates local refs.
 *
 * @param {?} tView
 * @param {?} lView
 * @param {?} localRefs Local refs of the node in question
 * @param {?=} localRefExtractor mapping function that extracts local ref value from TNode
 * @return {?}
 */
export function createDirectivesAndLocals(tView, lView, localRefs, localRefExtractor = getNativeByTNode) {
    if (!getBindingsEnabled())
        return;
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    if (tView.firstTemplatePass) {
        ngDevMode && ngDevMode.firstTemplatePass++;
        resolveDirectives(tView, lView, findDirectiveMatches(tView, lView, previousOrParentTNode), previousOrParentTNode, localRefs || null);
    }
    instantiateAllDirectives(tView, lView, previousOrParentTNode);
    invokeDirectivesHostBindings(tView, lView, previousOrParentTNode);
    saveResolvedLocalsInData(lView, previousOrParentTNode, localRefExtractor);
    setActiveHostElement(null);
}
/**
 * Takes a list of local names and indices and pushes the resolved local variable values
 * to LView in the same order as they are loaded in the template with load().
 * @param {?} viewData
 * @param {?} tNode
 * @param {?} localRefExtractor
 * @return {?}
 */
function saveResolvedLocalsInData(viewData, tNode, localRefExtractor) {
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
        viewQuery, (/** @type {?} */ (null)), // node: TViewNode|TElementNode|null,
        cloneToTViewData(blueprint).fill(null, bindingStartIndex), // data: TData,
        bindingStartIndex, // bindingStartIndex: number,
        initialViewLength, // viewQueryStartIndex: number,
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
            viewQuery: viewQuery,
            node: (/** @type {?} */ (null)),
            data: blueprint.slice().fill(null, bindingStartIndex),
            bindingStartIndex: bindingStartIndex,
            viewQueryStartIndex: initialViewLength,
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
    const blueprint = (/** @type {?} */ (new (ngDevMode ? (/** @type {?} */ (LViewBlueprint)) : Array)(initialViewLength)
        .fill(null, 0, bindingStartIndex)
        .fill(NO_CHANGE, bindingStartIndex)));
    blueprint[BINDING_INDEX] = bindingStartIndex;
    return blueprint;
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
 * @param {?} tParent
 * @param {?} type The type of the node
 * @param {?} adjustedIndex The index of the TNode in TView.data, adjusted for HEADER_OFFSET
 * @param {?} tagName The tag name of the node
 * @param {?} attrs The attributes defined on this node
 * @return {?} the TNode object
 */
export function createTNode(tParent, type, adjustedIndex, tagName, attrs) {
    ngDevMode && ngDevMode.tNode++;
    return {
        type: type,
        index: adjustedIndex,
        injectorIndex: tParent ? tParent.injectorIndex : -1,
        directiveStart: -1,
        directiveEnd: -1,
        propertyMetadataStartIndex: -1,
        propertyMetadataEndIndex: -1,
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
        stylingTemplate: null,
        projection: null,
        onElementCreationFns: null,
        // TODO (matsko): rename this to `styles` once the old styling impl is gone
        newStyles: null,
        // TODO (matsko): rename this to `classes` once the old styling impl is gone
        newClasses: null,
    };
}
/**
 * Consolidates all inputs or outputs of all directives on this logical node.
 *
 * @param {?} tNode
 * @param {?} direction whether to consider inputs or outputs
 * @return {?} PropertyAliases|null aggregate of all properties if any, `null` otherwise
 */
export function generatePropertyAliases(tNode, direction) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
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
    const element = (/** @type {?} */ (getNativeByIndex(index, lView)));
    /** @type {?} */
    const tNode = getTNode(index, lView);
    /** @type {?} */
    let inputData;
    /** @type {?} */
    let dataValue;
    if (!nativeOnly && (inputData = initializeTNodeInputs(tNode)) &&
        (dataValue = inputData[propName])) {
        setInputsForProperty(lView, dataValue, value);
        if (isComponent(tNode))
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
        savePropertyDebugData(tNode, lView, propName, lView[TVIEW].data, nativeOnly);
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
 * Stores debugging data for this property binding on first template pass.
 * This enables features like DebugElement.properties.
 * @param {?} tNode
 * @param {?} lView
 * @param {?} propName
 * @param {?} tData
 * @param {?} nativeOnly
 * @return {?}
 */
function savePropertyDebugData(tNode, lView, propName, tData, nativeOnly) {
    /** @type {?} */
    const lastBindingIndex = lView[BINDING_INDEX] - 1;
    // Bind/interpolation functions save binding metadata in the last binding index,
    // but leave the property name blank. If the interpolation delimiter is at the 0
    // index, we know that this is our first pass and the property name still needs to
    // be set.
    /** @type {?} */
    const bindingMetadata = (/** @type {?} */ (tData[lastBindingIndex]));
    if (bindingMetadata[0] == INTERPOLATION_DELIMITER) {
        tData[lastBindingIndex] = propName + bindingMetadata;
        // We don't want to store indices for host bindings because they are stored in a
        // different part of LView (the expando section).
        if (!nativeOnly) {
            if (tNode.propertyMetadataStartIndex == -1) {
                tNode.propertyMetadataStartIndex = lastBindingIndex;
            }
            tNode.propertyMetadataEndIndex = lastBindingIndex + 1;
        }
    }
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
        baseResolveDirective(tView, viewData, def, def.factory);
    }
    /** @type {?} */
    const directive = getNodeInjectable(tView.data, viewData, viewData.length - 1, (/** @type {?} */ (rootTNode)));
    postProcessBaseDirective(viewData, rootTNode, directive);
    return directive;
}
/**
 * Resolve the matched directives on a node.
 * @param {?} tView
 * @param {?} viewData
 * @param {?} directives
 * @param {?} tNode
 * @param {?} localRefs
 * @return {?}
 */
function resolveDirectives(tView, viewData, directives, tNode, localRefs) {
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in
    // tsickle.
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
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
            baseResolveDirective(tView, viewData, def, def.factory);
            saveNameToExportMap((/** @type {?} */ (tView.data)).length - 1, def, exportsMap);
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
        postProcessDirective(lView, directive, def, i);
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
 * @param {?} viewData
 * @param {?} directive
 * @param {?} def
 * @param {?} directiveDefIdx
 * @return {?}
 */
function postProcessDirective(viewData, directive, def, directiveDefIdx) {
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    postProcessBaseDirective(viewData, previousOrParentTNode, directive);
    ngDevMode && assertDefined(previousOrParentTNode, 'previousOrParentTNode');
    if (previousOrParentTNode && previousOrParentTNode.attrs) {
        setInputsFromAttrs(directiveDefIdx, directive, def, previousOrParentTNode);
    }
    if (viewData[TVIEW].firstTemplatePass && def.contentQueries) {
        previousOrParentTNode.flags |= 4 /* hasContentQuery */;
    }
    if (isComponentDef(def)) {
        /** @type {?} */
        const componentView = getComponentViewByIndex(previousOrParentTNode.index, viewData);
        componentView[CONTEXT] = directive;
    }
}
/**
 * A lighter version of postProcessDirective() that is used for the root component.
 * @template T
 * @param {?} lView
 * @param {?} previousOrParentTNode
 * @param {?} directive
 * @return {?}
 */
function postProcessBaseDirective(lView, previousOrParentTNode, directive) {
    /** @type {?} */
    const native = getNativeByTNode(previousOrParentTNode, lView);
    ngDevMode && assertEqual(lView[BINDING_INDEX], lView[TVIEW].bindingStartIndex, 'directives should be created before any bindings');
    ngDevMode && assertPreviousIsParent(getIsParent());
    attachPatchData(directive, lView);
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
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'should run on first template pass only');
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
                diPublicInInjector(getOrCreateNodeInjectorForNode((/** @type {?} */ (getPreviousOrParentTNode())), viewData), viewData, def.type);
                if (isComponentDef(def)) {
                    if (tNode.flags & 1 /* isComponent */)
                        throwMultipleComponentError(tNode);
                    tNode.flags = 1 /* isComponent */;
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
 * Stores index of component's host element so it will be queued for view refresh during CD.
 * @param {?} previousOrParentTNode
 * @return {?}
 */
export function queueComponentIndexForCheck(previousOrParentTNode) {
    /** @type {?} */
    const tView = getLView()[TVIEW];
    ngDevMode &&
        assertEqual(tView.firstTemplatePass, true, 'Should only be called in first template pass.');
    (tView.components || (tView.components = ngDevMode ? new (/** @type {?} */ (TViewComponents))() : [])).push(previousOrParentTNode.index);
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
    ngDevMode && assertEqual(flags === 0 || flags === 1 /* isComponent */, true, 'expected node flags to not be initialized');
    ngDevMode && assertNotEqual(numberOfDirectives, tNode.directiveEnd - tNode.directiveStart, 'Reached the max number of directives');
    // When the first directive is created on a node, save the index
    tNode.flags = flags & 1 /* isComponent */;
    tNode.directiveStart = index;
    tNode.directiveEnd = index + numberOfDirectives;
    tNode.providerIndexes = index;
}
/**
 * @template T
 * @param {?} tView
 * @param {?} viewData
 * @param {?} def
 * @param {?} directiveFactory
 * @return {?}
 */
function baseResolveDirective(tView, viewData, def, directiveFactory) {
    tView.data.push(def);
    /** @type {?} */
    const nodeInjectorFactory = new NodeInjectorFactory(directiveFactory, isComponentDef(def), null);
    tView.blueprint.push(nodeInjectorFactory);
    viewData.push(nodeInjectorFactory);
}
/**
 * @template T
 * @param {?} lView
 * @param {?} previousOrParentTNode
 * @param {?} def
 * @return {?}
 */
function addComponentLogic(lView, previousOrParentTNode, def) {
    /** @type {?} */
    const native = getNativeByTNode(previousOrParentTNode, lView);
    /** @type {?} */
    const tView = getOrCreateTView(def);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    /** @type {?} */
    const rendererFactory = lView[RENDERER_FACTORY];
    /** @type {?} */
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, lView[previousOrParentTNode.index], (/** @type {?} */ (previousOrParentTNode)), rendererFactory, rendererFactory.createRenderer((/** @type {?} */ (native)), def)));
    componentView[T_HOST] = (/** @type {?} */ (previousOrParentTNode));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[previousOrParentTNode.index] = componentView;
    if (lView[TVIEW].firstTemplatePass) {
        queueComponentIndexForCheck(previousOrParentTNode);
    }
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
    native);
    ngDevMode && attachLContainerDebug(lContainer);
    return lContainer;
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes
 * them
 * by executing an associated template function.
 * @param {?} lView
 * @return {?}
 */
function refreshDynamicEmbeddedViews(lView) {
    for (let current = lView[CHILD_HEAD]; current !== null; current = current[NEXT]) {
        // Note: current can be an LView or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LView
        // header.
        if (current[ACTIVE_INDEX] === -1 && isLContainer(current)) {
            for (let i = CONTAINER_HEADER_OFFSET; i < current.length; i++) {
                /** @type {?} */
                const dynamicViewData = current[i];
                // The directives and pipes are not needed here as an existing view is only being
                // refreshed.
                ngDevMode && assertDefined(dynamicViewData[TVIEW], 'TView must be allocated');
                renderEmbeddedTemplate(dynamicViewData, dynamicViewData[TVIEW], (/** @type {?} */ (dynamicViewData[CONTEXT])));
            }
        }
    }
}
/////////////
/**
 * Refreshes components by entering the component view and processing its bindings, queries, etc.
 *
 * @param {?} adjustedElementIndex  Element index in LView[] (adjusted for HEADER_OFFSET)
 * @return {?}
 */
export function componentRefresh(adjustedElementIndex) {
    /** @type {?} */
    const lView = getLView();
    ngDevMode && assertDataInRange(lView, adjustedElementIndex);
    /** @type {?} */
    const hostView = getComponentViewByIndex(adjustedElementIndex, lView);
    ngDevMode && assertNodeType((/** @type {?} */ (lView[TVIEW].data[adjustedElementIndex])), 3 /* Element */);
    // Only components in creation mode, attached CheckAlways
    // components or attached, dirty OnPush components should be checked
    if ((viewAttachedToChangeDetector(hostView) || isCreationMode(lView)) &&
        hostView[FLAGS] & (16 /* CheckAlways */ | 64 /* Dirty */)) {
        syncViewWithBlueprint(hostView);
        checkView(hostView, hostView[CONTEXT]);
    }
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
        componentView[i] = componentTView.blueprint[i];
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
        renderComponentOrTemplate((/** @type {?} */ (readPatchedLView(rootComponent))), rootComponent);
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
        if (isCreationMode(view)) {
            checkView(view, context); // creation mode pass
        }
        checkView(view, context); // update mode pass
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
 * Checks the view of the component provided. Does not gate on dirty checks or execute doCheck.
 * @template T
 * @param {?} hostView
 * @param {?} component
 * @return {?}
 */
export function checkView(hostView, component) {
    /** @type {?} */
    const hostTView = hostView[TVIEW];
    /** @type {?} */
    const oldView = enterView(hostView, hostView[T_HOST]);
    /** @type {?} */
    const templateFn = (/** @type {?} */ (hostTView.template));
    /** @type {?} */
    const creationMode = isCreationMode(hostView);
    try {
        resetPreOrderHookFlags(hostView);
        creationMode && executeViewQueryFn(1 /* Create */, hostTView, component);
        executeTemplate(hostView, templateFn, getRenderFlags(hostView), component);
        refreshDescendantViews(hostView);
        // Only check view queries again in creation mode if there are static view queries
        if (!creationMode || hostTView.staticViewQueries) {
            executeViewQueryFn(2 /* Update */, hostTView, component);
        }
    }
    finally {
        leaveView(oldView);
    }
}
/**
 * @template T
 * @param {?} flags
 * @param {?} tView
 * @param {?} component
 * @return {?}
 */
function executeViewQueryFn(flags, tView, component) {
    /** @type {?} */
    const viewQuery = tView.viewQuery;
    if (viewQuery) {
        setCurrentQueryIndex(tView.viewQueryStartIndex);
        viewQuery(flags, component);
    }
}
///////////////////////////////
//// Bindings & interpolations
///////////////////////////////
/**
 * Creates binding metadata for a particular binding and stores it in
 * TView.data. These are generated in order to support DebugElement.properties.
 *
 * Each binding / interpolation will have one (including attribute bindings)
 * because at the time of binding, we don't know to which instruction the binding
 * belongs. It is always stored in TView.data at the index of the last binding
 * value in LView (e.g. for interpolation8, it would be stored at the index of
 * the 8th value).
 *
 * @param {?} lView The LView that contains the current binding index.
 * @param {?=} prefix The static prefix string
 * @param {?=} suffix The static suffix string
 *
 * @return {?} Newly created binding metadata string for this binding or null
 */
export function storeBindingMetadata(lView, prefix = '', suffix = '') {
    /** @type {?} */
    const tData = lView[TVIEW].data;
    /** @type {?} */
    const lastBindingIndex = lView[BINDING_INDEX] - 1;
    /** @type {?} */
    const value = INTERPOLATION_DELIMITER + prefix + INTERPOLATION_DELIMITER + suffix;
    return tData[lastBindingIndex] == null ? (tData[lastBindingIndex] = value) : null;
}
/** @type {?} */
export const CLEAN_PROMISE = _CLEAN_PROMISE;
/**
 * @param {?} tNode
 * @return {?}
 */
export function initializeTNodeInputs(tNode) {
    // If tNode.inputs is undefined, a listener has created outputs, but inputs haven't
    // yet been checked.
    if (tNode.inputs === undefined) {
        // mark inputs as checked
        tNode.inputs = generatePropertyAliases(tNode, 0 /* Input */);
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
export { ɵ0 };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQy9GLE9BQU8sRUFBQyw4QkFBOEIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRS9HLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBa0IsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQzlJLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ2pFLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxXQUFXLEVBQUUsc0JBQXNCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDOUQsT0FBTyxFQUFDLGVBQWUsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBQ2pGLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM1RixPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFFLHVCQUF1QixFQUFhLE1BQU0seUJBQXlCLENBQUM7QUFFMUYsT0FBTyxFQUFDLDBCQUEwQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFHdkYsT0FBTyxFQUF5RCxvQkFBb0IsRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBR3BILE9BQU8sRUFBQyxhQUFhLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLGdCQUFnQixFQUF1QixLQUFLLEVBQUUsYUFBYSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQXFDLElBQUksRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBaUMsU0FBUyxFQUFTLEtBQUssRUFBUyxNQUFNLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUNyVSxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDekUsT0FBTyxFQUFDLDBCQUEwQixFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDcEUsT0FBTyxFQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBRSxxQkFBcUIsRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBRSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSwwQkFBMEIsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFFLG9CQUFvQixFQUFFLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxzQkFBc0IsRUFBRSxvQkFBb0IsRUFBZSx3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxlQUFlLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDM1ksT0FBTyxFQUFDLHVCQUF1QixJQUFJLDhCQUE4QixFQUFDLE1BQU0scUNBQXFDLENBQUM7QUFDOUcsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGVBQWUsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDcEMsT0FBTyxFQUFDLG1CQUFtQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDeEQsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGVBQWUsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLG9CQUFvQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDNUUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsY0FBYyxFQUFFLGtCQUFrQixFQUFFLFlBQVksRUFBRSxVQUFVLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUsV0FBVyxFQUFFLDRCQUE0QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDelEsT0FBTyxFQUFDLFFBQVEsRUFBRSxjQUFjLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRSxnQkFBZ0IsRUFBRSxrQkFBa0IsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLGdCQUFnQixFQUFFLHFCQUFxQixFQUFFLGdCQUFnQixFQUFFLFlBQVksRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUNsUCxPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDOzs7O0FBT2hCLEdBQUcsRUFBRSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDOzs7Ozs7TUFBN0MsY0FBYyxHQUFHLE1BQTZCLEVBQUU7OztJQUdwRCxRQUFLO0lBQ0wsU0FBTTs7Ozs7Ozs7Ozs7QUFTUixNQUFNLFVBQVUsc0JBQXNCLENBQUMsS0FBWTs7VUFDM0MsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O1VBQ3BCLFlBQVksR0FBRyxjQUFjLENBQUMsS0FBSyxDQUFDO0lBRTFDLHFGQUFxRjtJQUNyRixLQUFLLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDO0lBRWhDLGtHQUFrRztJQUNsRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDO0lBRS9DLHVGQUF1RjtJQUN2Rix3Q0FBd0M7SUFDeEMsSUFBSSxDQUFDLFlBQVksRUFBRTs7Y0FDWCxrQkFBa0IsR0FBRyxxQkFBcUIsRUFBRTtRQUVsRCxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLGtCQUFrQixFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBRWxFLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRW5DLDJFQUEyRTtRQUMzRSxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFcEMsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDOUIsWUFBWSxDQUNSLEtBQUssRUFBRSxLQUFLLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxrQkFBa0Isd0NBQ3pCLFNBQVMsQ0FBQyxDQUFDO1FBRTVELGVBQWUsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDL0I7SUFFRCx1RkFBdUY7SUFDdkYsMEZBQTBGO0lBQzFGLHlDQUF5QztJQUN6QyxJQUFJLFlBQVksSUFBSSxLQUFLLENBQUMsb0JBQW9CLEVBQUU7UUFDOUMscUJBQXFCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ3JDO0lBRUQsc0JBQXNCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzNDLENBQUM7Ozs7Ozs7QUFJRCxNQUFNLFVBQVUsZUFBZSxDQUFDLEtBQVksRUFBRSxRQUFlOztVQUNyRCxhQUFhLEdBQUcsZ0JBQWdCLEVBQUU7SUFDeEMsSUFBSTtRQUNGLElBQUksS0FBSyxDQUFDLG1CQUFtQixFQUFFOztnQkFDekIsZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLEtBQUssQ0FBQyxpQkFBaUI7WUFDeEUsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7O2dCQUM3QixxQkFBcUIsR0FBRyxDQUFDLENBQUM7O2dCQUMxQixtQkFBbUIsR0FBRyxDQUFDLENBQUM7WUFDNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O3NCQUNuRCxXQUFXLEdBQUcsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUMsQ0FBQztnQkFDaEQsSUFBSSxPQUFPLFdBQVcsS0FBSyxRQUFRLEVBQUU7b0JBQ25DLElBQUksV0FBVyxJQUFJLENBQUMsRUFBRTt3QkFDcEIsa0ZBQWtGO3dCQUNsRiwyQ0FBMkM7d0JBQzNDLG1CQUFtQixHQUFHLENBQUMsV0FBVyxDQUFDO3dCQUNuQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDOzs7OEJBR3BDLGFBQWEsR0FBRyxDQUFDLG1CQUFBLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFVLENBQUM7d0JBQ2hFLGdCQUFnQixJQUFJLDBCQUEwQixHQUFHLGFBQWEsQ0FBQzt3QkFFL0QscUJBQXFCLEdBQUcsZ0JBQWdCLENBQUM7cUJBQzFDO3lCQUFNO3dCQUNMLGlGQUFpRjt3QkFDakYsZ0ZBQWdGO3dCQUNoRiwwREFBMEQ7d0JBQzFELGdCQUFnQixJQUFJLFdBQVcsQ0FBQztxQkFDakM7b0JBQ0QsY0FBYyxDQUFDLGdCQUFnQixDQUFDLENBQUM7aUJBQ2xDO3FCQUFNO29CQUNMLGdGQUFnRjtvQkFDaEYsSUFBSSxXQUFXLEtBQUssSUFBSSxFQUFFO3dCQUN4QixRQUFRLENBQUMsYUFBYSxDQUFDLEdBQUcsZ0JBQWdCLENBQUM7OzhCQUNyQyxPQUFPLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO3dCQUM1RCxXQUFXLGlCQUFxQixPQUFPLEVBQUUsbUJBQW1CLENBQUMsQ0FBQzt3QkFFOUQsaUVBQWlFO3dCQUNqRSx3RUFBd0U7d0JBQ3hFLHlFQUF5RTt3QkFDekUsb0VBQW9FO3dCQUNwRSx3RUFBd0U7d0JBQ3hFLDBCQUEwQixFQUFFLENBQUM7cUJBQzlCO29CQUNELHFCQUFxQixFQUFFLENBQUM7aUJBQ3pCO2FBQ0Y7U0FDRjtLQUNGO1lBQVM7UUFDUixvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7Ozs7Ozs7QUFHRCxTQUFTLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZO0lBQ3ZELElBQUksS0FBSyxDQUFDLGNBQWMsSUFBSSxJQUFJLEVBQUU7UUFDaEMsb0JBQW9CLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDeEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDOUMsZUFBZSxHQUFHLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQyxDQUFDOztrQkFDekMsWUFBWSxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLEVBQXFCO1lBQ3JFLFNBQVM7Z0JBQ0wsYUFBYSxDQUFDLFlBQVksQ0FBQyxjQUFjLEVBQUUsMkNBQTJDLENBQUMsQ0FBQztZQUM1RixtQkFBQSxZQUFZLENBQUMsY0FBYyxFQUFFLGlCQUFxQixLQUFLLENBQUMsZUFBZSxDQUFDLEVBQUUsZUFBZSxDQUFDLENBQUM7U0FDNUY7S0FDRjtBQUNILENBQUM7Ozs7OztBQUdELFNBQVMsc0JBQXNCLENBQUMsVUFBMkI7SUFDekQsSUFBSSxVQUFVLElBQUksSUFBSSxFQUFFO1FBQ3RCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ2pDO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7O0FBU0QsTUFBTSxVQUFVLGFBQWEsQ0FBQyxJQUFZLEVBQUUsa0JBQThCOztRQUNwRSxNQUFnQjs7VUFDZCxhQUFhLEdBQUcsa0JBQWtCLElBQUksUUFBUSxFQUFFLENBQUMsUUFBUSxDQUFDOztVQUUxRCxTQUFTLEdBQUcsWUFBWSxFQUFFO0lBRWhDLElBQUksb0JBQW9CLENBQUMsYUFBYSxDQUFDLEVBQUU7UUFDdkMsTUFBTSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3ZEO1NBQU07UUFDTCxJQUFJLFNBQVMsS0FBSyxJQUFJLEVBQUU7WUFDdEIsTUFBTSxHQUFHLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDNUM7YUFBTTtZQUNMLE1BQU0sR0FBRyxhQUFhLENBQUMsZUFBZSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUN6RDtLQUNGO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0QsTUFBTSxVQUFVLFdBQVcsQ0FDdkIsV0FBeUIsRUFBRSxLQUFZLEVBQUUsT0FBaUIsRUFBRSxLQUFpQixFQUM3RSxJQUFxQixFQUFFLFNBQTBDLEVBQ2pFLGVBQXlDLEVBQUUsUUFBMkIsRUFDdEUsU0FBNEIsRUFBRSxRQUEwQjs7VUFDcEQsS0FBSyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsRUFBUztJQUMxRixLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDO0lBQ25CLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLHVCQUEwQixxQkFBc0IseUJBQTRCLENBQUM7SUFDakcsc0JBQXNCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDOUIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLFdBQVcsQ0FBQztJQUN0RCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDO0lBQ3pCLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLG1CQUFBLENBQUMsZUFBZSxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFDOUYsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25GLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxtQkFBQSxDQUFDLFFBQVEsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLFFBQVEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUN2RSxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBRSxzQkFBc0IsQ0FBQyxDQUFDO0lBQ3BFLEtBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxTQUFTLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxtQkFBQSxJQUFJLEVBQUUsQ0FBQztJQUNoRixLQUFLLENBQUMsbUJBQUEsUUFBUSxFQUFPLENBQUMsR0FBRyxRQUFRLElBQUksV0FBVyxJQUFJLFdBQVcsQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDbEYsS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUMxQixTQUFTLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDckMsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7Ozs7O0FBK0JELE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsS0FBWSxFQUFFLFNBQXVCLEVBQUUsS0FBYSxFQUFFLElBQWUsRUFBRSxJQUFtQixFQUMxRixLQUF5Qjs7O1VBR3JCLGFBQWEsR0FBRyxLQUFLLEdBQUcsYUFBYTs7VUFDckMsS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQVM7UUFDNUMsa0JBQWtCLENBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDO0lBQ2pGLHdCQUF3QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN0QyxPQUFPLG1CQUFBLEtBQUssRUFDMkIsQ0FBQztBQUMxQyxDQUFDOzs7Ozs7Ozs7OztBQUVELFNBQVMsa0JBQWtCLENBQ3ZCLEtBQVksRUFBRSxTQUF1QixFQUFFLGFBQXFCLEVBQUUsSUFBZSxFQUM3RSxJQUFtQixFQUFFLEtBQXlCLEVBQUUsS0FBYTs7VUFDekQscUJBQXFCLEdBQUcsd0JBQXdCLEVBQUU7O1VBQ2xELFFBQVEsR0FBRyxXQUFXLEVBQUU7O1VBQ3hCLE1BQU0sR0FDUixRQUFRLENBQUMsQ0FBQyxDQUFDLHFCQUFxQixDQUFDLENBQUMsQ0FBQyxxQkFBcUIsSUFBSSxxQkFBcUIsQ0FBQyxNQUFNOzs7O1VBR3RGLGdCQUFnQixHQUFHLE1BQU0sSUFBSSxNQUFNLEtBQUssU0FBUzs7VUFDakQsV0FBVyxHQUFHLGdCQUFnQixDQUFDLENBQUMsQ0FBQyxtQkFBQSxNQUFNLEVBQWlDLENBQUMsQ0FBQyxDQUFDLElBQUk7O1VBQy9FLEtBQUssR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQztRQUNuQyxXQUFXLENBQUMsV0FBVyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQztJQUM5RCx1RkFBdUY7SUFDdkYscUVBQXFFO0lBQ3JFLElBQUksS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEVBQUU7UUFDcEMsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7S0FDMUI7SUFDRCxvQ0FBb0M7SUFDcEMsSUFBSSxxQkFBcUIsRUFBRTtRQUN6QixJQUFJLFFBQVEsSUFBSSxxQkFBcUIsQ0FBQyxLQUFLLElBQUksSUFBSTtZQUMvQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEtBQUssSUFBSSxJQUFJLHFCQUFxQixDQUFDLElBQUksaUJBQW1CLENBQUMsRUFBRTtZQUM1RSxzRkFBc0Y7WUFDdEYscUJBQXFCLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztTQUNyQzthQUFNLElBQUksQ0FBQyxRQUFRLEVBQUU7WUFDcEIscUJBQXFCLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQztTQUNwQztLQUNGO0lBQ0QsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FDbEMsS0FBWSxFQUFFLFdBQXlCLEVBQUUsS0FBYSxFQUFFLEtBQVk7Ozs7UUFHbEUsS0FBSyxHQUFHLEtBQUssQ0FBQyxJQUFJO0lBQ3RCLElBQUksS0FBSyxJQUFJLElBQUksRUFBRTtRQUNqQixTQUFTLElBQUksV0FBVztZQUNwQix5QkFBeUIsQ0FBQyxXQUFXLHFDQUF5QyxDQUFDO1FBQ25GLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxHQUFHLG1CQUFBLFdBQVcsQ0FDNUIsbUJBQUEsV0FBVyxFQUF3QyxFQUFHLEVBQUU7c0JBQ3hDLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQWEsQ0FBQztLQUNyRDtJQUVELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxHQUFHLG1CQUFBLEtBQUssRUFBYSxDQUFDO0FBQzVDLENBQUM7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSxZQUFZLENBQUMsSUFBVyxFQUFFLGVBQXVCOztVQUN6RCxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUN6QixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3hDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQzNCLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDakI7UUFFRCxzRkFBc0Y7UUFDdEYsK0NBQStDO1FBQy9DLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLEVBQUU7WUFDOUIsS0FBSyxDQUFDLGlCQUFpQixJQUFJLGVBQWUsQ0FBQztTQUM1QzthQUFNO1lBQ0wseUZBQXlGO1lBQ3pGLDhDQUE4QztZQUM5QyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO1NBQ2pEO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxLQUFZLEVBQUUsT0FBVSxFQUFFLGVBQXNCLEVBQUUsT0FBd0IsRUFDMUUsYUFBcUI7O1VBQ2pCLFNBQVMsR0FBRyxXQUFXLEVBQUU7O1VBQ3pCLHNCQUFzQixHQUFHLHdCQUF3QixFQUFFO0lBQ3pELHdCQUF3QixDQUFDLG1CQUFBLElBQUksRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDOztVQUVqQyxLQUFLLEdBQUcsV0FBVyxDQUFDLGVBQWUsRUFBRSxLQUFLLEVBQUUsT0FBTyx3QkFBMEIsSUFBSSxFQUFFLElBQUksQ0FBQztJQUM5RixLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxlQUFlLENBQUM7SUFFMUMsSUFBSSxPQUFPLEVBQUU7UUFDWCxLQUFLLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBQ3ZDO0lBQ0Qsc0JBQXNCLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztJQUUvQyxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixtQkFBQSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsYUFBYSxHQUFHLGFBQWEsQ0FBQztLQUM1QztJQUVELHdCQUF3QixDQUFDLHNCQUFzQixFQUFFLFNBQVMsQ0FBQyxDQUFDO0lBQzVELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFhRCxNQUFNLFVBQVUsc0JBQXNCLENBQUksWUFBbUIsRUFBRSxLQUFZLEVBQUUsT0FBVTs7VUFDL0UsU0FBUyxHQUFHLFdBQVcsRUFBRTs7VUFDekIsc0JBQXNCLEdBQUcsd0JBQXdCLEVBQUU7O1FBQ3JELE9BQWM7SUFDbEIsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLG1CQUFvQixFQUFFO1FBQzNDLDJDQUEyQztRQUMzQyxlQUFlLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7S0FDL0M7U0FBTTtRQUNMLElBQUk7WUFDRix3QkFBd0IsQ0FBQyxtQkFBQSxJQUFJLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztZQUV2QyxPQUFPLEdBQUcsU0FBUyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztZQUN4RCxzQkFBc0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztZQUNyQyxlQUFlLENBQUMsWUFBWSxFQUFFLG1CQUFBLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFBRSxjQUFjLENBQUMsWUFBWSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFdkYsbUZBQW1GO1lBQ25GLHVGQUF1RjtZQUN2RixtRkFBbUY7WUFDbkYsaUNBQWlDO1lBQ2pDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsR0FBRyxLQUFLLENBQUM7WUFFOUMsc0JBQXNCLENBQUMsWUFBWSxDQUFDLENBQUM7U0FDdEM7Z0JBQVM7WUFDUixTQUFTLENBQUMsbUJBQUEsT0FBTyxFQUFFLENBQUMsQ0FBQztZQUNyQix3QkFBd0IsQ0FBQyxzQkFBc0IsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUM3RDtLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUseUJBQXlCLENBQ3JDLFFBQWUsRUFBRSxPQUFVLEVBQUUsVUFBaUM7O1VBQzFELGVBQWUsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLENBQUM7O1VBQzVDLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7VUFDL0MsbUJBQW1CLEdBQUcsQ0FBQyxxQkFBcUIsRUFBRTs7VUFDOUMsb0JBQW9CLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQztJQUNyRCxJQUFJO1FBQ0YsSUFBSSxtQkFBbUIsSUFBSSxDQUFDLG9CQUFvQixJQUFJLGVBQWUsQ0FBQyxLQUFLLEVBQUU7WUFDekUsZUFBZSxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ3pCO1FBRUQsSUFBSSxvQkFBb0IsRUFBRTtZQUN4QixxQkFBcUI7WUFDckIsVUFBVSxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsVUFBVSxrQkFBc0IsT0FBTyxDQUFDLENBQUM7WUFFakYsc0JBQXNCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDakMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLHFCQUF3QixDQUFDO1NBQzdDO1FBRUQsbUJBQW1CO1FBQ25CLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLFVBQVUsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLFVBQVUsa0JBQXNCLE9BQU8sQ0FBQyxDQUFDO1FBQ2pGLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ2xDO1lBQVM7UUFDUixJQUFJLG1CQUFtQixJQUFJLENBQUMsb0JBQW9CLElBQUksZUFBZSxDQUFDLEdBQUcsRUFBRTtZQUN2RSxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7U0FDdkI7UUFDRCxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEI7QUFDSCxDQUFDOzs7Ozs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FDcEIsS0FBWSxFQUFFLFVBQWdDLEVBQUUsRUFBZSxFQUFFLE9BQVU7SUFDN0UsZUFBZSxFQUFFLENBQUM7O1VBQ1osaUJBQWlCLEdBQUcsZ0JBQWdCLEVBQUU7SUFDNUMsSUFBSTtRQUNGLG9CQUFvQixDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLElBQUksRUFBRSxpQkFBcUIsRUFBRTtZQUMzQixzRkFBc0Y7WUFDdEYscUNBQXFDO1lBQ3JDLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDMUI7UUFDRCxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3pCO1lBQVM7UUFDUixnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3JDO0FBQ0gsQ0FBQzs7Ozs7Ozs7QUFPRCxTQUFTLGNBQWMsQ0FBQyxJQUFXO0lBQ2pDLE9BQU8sY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsZ0JBQW9CLENBQUMsZUFBbUIsQ0FBQztBQUN4RSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxNQUFNLFVBQVUsc0JBQXNCLENBQ2xDLEtBQVksRUFBRSxLQUFZLEVBQUUsS0FBa0IsRUFBRSxlQUF1QjtJQUN6RSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUU7O2NBQy9DLHNCQUFzQixHQUFHLG1CQUFtQixDQUFDLEtBQUssRUFBRSxlQUFlLENBQUM7UUFDMUUsSUFBSSxzQkFBc0IsSUFBSSxDQUFDLEVBQUU7WUFDL0IsS0FBSyxDQUFDLGVBQWUsR0FBRyw4QkFBOEIsQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztTQUN2RjtLQUNGO0FBQ0gsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVk7SUFDNUUsSUFBSSxrQkFBa0IsQ0FBQyxLQUFLLENBQUMsRUFBRTs7Y0FDdkIsS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjOztjQUM1QixHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVk7UUFDOUIsS0FBSyxJQUFJLGNBQWMsR0FBRyxLQUFLLEVBQUUsY0FBYyxHQUFHLEdBQUcsRUFBRSxjQUFjLEVBQUUsRUFBRTs7a0JBQ2pFLEdBQUcsR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsQ0FBQyxFQUFxQjtZQUMzRCxJQUFJLEdBQUcsQ0FBQyxjQUFjLEVBQUU7Z0JBQ3RCLEdBQUcsQ0FBQyxjQUFjLGlCQUFxQixLQUFLLENBQUMsY0FBYyxDQUFDLEVBQUUsY0FBYyxDQUFDLENBQUM7YUFDL0U7U0FDRjtLQUNGO0FBQ0gsQ0FBQzs7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSx5QkFBeUIsQ0FDckMsS0FBWSxFQUFFLEtBQVksRUFBRSxTQUFzQyxFQUNsRSxvQkFBdUMsZ0JBQWdCO0lBQ3pELElBQUksQ0FBQyxrQkFBa0IsRUFBRTtRQUFFLE9BQU87O1VBQzVCLHFCQUFxQixHQUFHLHdCQUF3QixFQUFFO0lBQ3hELElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLFNBQVMsSUFBSSxTQUFTLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztRQUMzQyxpQkFBaUIsQ0FDYixLQUFLLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUscUJBQXFCLENBQUMsRUFDdkUscUJBQXFCLEVBQUUsU0FBUyxJQUFJLElBQUksQ0FBQyxDQUFDO0tBQy9DO0lBQ0Qsd0JBQXdCLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxxQkFBcUIsQ0FBQyxDQUFDO0lBQzlELDRCQUE0QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUscUJBQXFCLENBQUMsQ0FBQztJQUNsRSx3QkFBd0IsQ0FBQyxLQUFLLEVBQUUscUJBQXFCLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztJQUMxRSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QixDQUFDOzs7Ozs7Ozs7QUFNRCxTQUFTLHdCQUF3QixDQUM3QixRQUFlLEVBQUUsS0FBWSxFQUFFLGlCQUFvQzs7VUFDL0QsVUFBVSxHQUFHLEtBQUssQ0FBQyxVQUFVO0lBQ25DLElBQUksVUFBVSxFQUFFOztZQUNWLFVBQVUsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUM7UUFDaEMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7a0JBQ3ZDLEtBQUssR0FBRyxtQkFBQSxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFVOztrQkFDbkMsS0FBSyxHQUFHLEtBQUssS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUN4QixpQkFBaUIsQ0FDYixtQkFBQSxLQUFLLEVBQXlELEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDL0UsUUFBUSxDQUFDLEtBQUssQ0FBQztZQUNuQixRQUFRLENBQUMsVUFBVSxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDaEM7S0FDRjtBQUNILENBQUM7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLEdBQXNCO0lBQ3JELE9BQU8sR0FBRyxDQUFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUNuQixDQUFDLENBQUMsRUFBRSxHQUFHLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsYUFBYSxFQUFFLEdBQUcsQ0FBQyxRQUFRLEVBQ3ZFLEdBQUcsQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7QUFDeEQsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixTQUFpQixFQUFFLFVBQXdDLEVBQUUsTUFBYyxFQUFFLElBQVksRUFDekYsVUFBNEMsRUFBRSxLQUFrQyxFQUNoRixTQUF5QyxFQUFFLE9BQWdDO0lBQzdFLFNBQVMsSUFBSSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7O1VBQ3pCLGlCQUFpQixHQUFHLGFBQWEsR0FBRyxNQUFNOzs7OztVQUkxQyxpQkFBaUIsR0FBRyxpQkFBaUIsR0FBRyxJQUFJOztVQUM1QyxTQUFTLEdBQUcsbUJBQW1CLENBQUMsaUJBQWlCLEVBQUUsaUJBQWlCLENBQUM7SUFDM0UsT0FBTyxTQUFTLENBQUMsbUJBQUEsS0FBSyxFQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztRQUN4QyxJQUFJLGdCQUFnQixDQUNiLFNBQVMsRUFBSSxjQUFjO1FBQzNCLFNBQVMsRUFBSSxvQkFBb0I7UUFDakMsVUFBVSxFQUFHLHdDQUF3QztRQUNyRCxTQUFTLEVBQ1QsbUJBQUEsSUFBSSxFQUFFLEVBQU8scUNBQXFDO1FBQ2xELGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsaUJBQWlCLENBQUMsRUFBRyxlQUFlO1FBQzNFLGlCQUFpQixFQUFHLDZCQUE2QjtRQUNqRCxpQkFBaUIsRUFBRywrQkFBK0I7UUFDbkQsaUJBQWlCLEVBQUcsNkJBQTZCO1FBQ2pELElBQUksRUFBZ0IsaURBQWlEO1FBQ3JFLElBQUksRUFBZ0IsOEJBQThCO1FBQ2xELEtBQUssRUFBZSw4QkFBOEI7UUFDbEQsS0FBSyxFQUFlLGlDQUFpQztRQUNyRCxJQUFJLEVBQWdCLGdDQUFnQztRQUNwRCxJQUFJLEVBQWdCLHFDQUFxQztRQUN6RCxJQUFJLEVBQWdCLCtCQUErQjtRQUNuRCxJQUFJLEVBQWdCLG9DQUFvQztRQUN4RCxJQUFJLEVBQWdCLDRCQUE0QjtRQUNoRCxJQUFJLEVBQWdCLGlDQUFpQztRQUNyRCxJQUFJLEVBQWdCLCtCQUErQjtRQUNuRCxJQUFJLEVBQWdCLHVCQUF1QjtRQUMzQyxJQUFJLEVBQWdCLGlDQUFpQztRQUNyRCxJQUFJLEVBQWdCLDZCQUE2QjtRQUNqRCxPQUFPLFVBQVUsS0FBSyxVQUFVLENBQUMsQ0FBQztZQUM5QixVQUFVLEVBQUUsQ0FBQyxDQUFDO1lBQ2QsVUFBVSxFQUFHLDRDQUE0QztRQUM3RCxPQUFPLEtBQUssS0FBSyxVQUFVLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUcsa0NBQWtDO1FBQ2xGLElBQUksRUFBNEMsMEJBQTBCO1FBQzFFLE9BQU8sQ0FDTixDQUFDLENBQUM7UUFDVjtZQUNFLEVBQUUsRUFBRSxTQUFTO1lBQ2IsU0FBUyxFQUFFLFNBQVM7WUFDcEIsUUFBUSxFQUFFLFVBQVU7WUFDcEIsU0FBUyxFQUFFLFNBQVM7WUFDcEIsSUFBSSxFQUFFLG1CQUFBLElBQUksRUFBRTtZQUNaLElBQUksRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxpQkFBaUIsQ0FBQztZQUNyRCxpQkFBaUIsRUFBRSxpQkFBaUI7WUFDcEMsbUJBQW1CLEVBQUUsaUJBQWlCO1lBQ3RDLGlCQUFpQixFQUFFLGlCQUFpQjtZQUNwQyxtQkFBbUIsRUFBRSxJQUFJO1lBQ3pCLGlCQUFpQixFQUFFLElBQUk7WUFDdkIsaUJBQWlCLEVBQUUsS0FBSztZQUN4QixvQkFBb0IsRUFBRSxLQUFLO1lBQzNCLGFBQWEsRUFBRSxJQUFJO1lBQ25CLGtCQUFrQixFQUFFLElBQUk7WUFDeEIsWUFBWSxFQUFFLElBQUk7WUFDbEIsaUJBQWlCLEVBQUUsSUFBSTtZQUN2QixTQUFTLEVBQUUsSUFBSTtZQUNmLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLE9BQU8sRUFBRSxJQUFJO1lBQ2IsY0FBYyxFQUFFLElBQUk7WUFDcEIsVUFBVSxFQUFFLElBQUk7WUFDaEIsaUJBQWlCLEVBQUUsT0FBTyxVQUFVLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVTtZQUMvRSxZQUFZLEVBQUUsT0FBTyxLQUFLLEtBQUssVUFBVSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSztZQUMzRCxVQUFVLEVBQUUsSUFBSTtZQUNoQixPQUFPLEVBQUUsT0FBTztTQUNqQixDQUFDO0FBQ1IsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxpQkFBeUIsRUFBRSxpQkFBeUI7O1VBQ3pFLFNBQVMsR0FBRyxtQkFBQSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxjQUFjLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLENBQUM7U0FDeEQsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsaUJBQWlCLENBQUM7U0FDaEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxpQkFBaUIsQ0FBQyxFQUFTO0lBQ2xFLFNBQVMsQ0FBQyxhQUFhLENBQUMsR0FBRyxpQkFBaUIsQ0FBQztJQUM3QyxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDOzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLElBQVksRUFBRSxLQUFVO0lBQ2xELE9BQU8sSUFBSSxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssaUJBQWlCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3RFLENBQUM7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLGlCQUFpQixDQUM3QixPQUF5QixFQUFFLGlCQUFvQzs7VUFDM0QsZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQzs7VUFDcEQsS0FBSyxHQUFHLE9BQU8saUJBQWlCLEtBQUssUUFBUSxDQUFDLENBQUM7UUFDakQsQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO1lBQ25DLGVBQWUsQ0FBQyxpQkFBaUIsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7WUFDdEQsZUFBZSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxpQkFBaUI7SUFDckIsSUFBSSxTQUFTLElBQUksQ0FBQyxLQUFLLEVBQUU7UUFDdkIsSUFBSSxPQUFPLGlCQUFpQixLQUFLLFFBQVEsRUFBRTtZQUN6QyxNQUFNLFdBQVcsQ0FBQyxvQ0FBb0MsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQzVFO2FBQU07WUFDTCxNQUFNLFdBQVcsQ0FBQyx3QkFBd0IsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1NBQ2hFO0tBQ0Y7SUFDRCxPQUFPLEtBQUssQ0FBQztBQUNmLENBQUM7Ozs7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSx1QkFBdUIsQ0FBQyxLQUFZLEVBQUUsT0FBWSxFQUFFLFNBQW1COztVQUMvRSxRQUFRLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQztJQUNsQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBRXZCLElBQUksS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixFQUFFO1FBQ2xDLGVBQWUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7S0FDN0Q7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsY0FBYyxDQUFDLElBQVcsRUFBRSxTQUFtQjtJQUM3RCxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBRWpDLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLGlCQUFpQixFQUFFO1FBQ2pDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsbUJBQUEsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM5RDtBQUNILENBQUM7Ozs7Ozs7Ozs7O0FBb0JELE1BQU0sVUFBVSxXQUFXLENBQ3ZCLE9BQTZDLEVBQUUsSUFBZSxFQUFFLGFBQXFCLEVBQ3JGLE9BQXNCLEVBQUUsS0FBeUI7SUFDbkQsU0FBUyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUMvQixPQUFPO1FBQ0wsSUFBSSxFQUFFLElBQUk7UUFDVixLQUFLLEVBQUUsYUFBYTtRQUNwQixhQUFhLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkQsY0FBYyxFQUFFLENBQUMsQ0FBQztRQUNsQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hCLDBCQUEwQixFQUFFLENBQUMsQ0FBQztRQUM5Qix3QkFBd0IsRUFBRSxDQUFDLENBQUM7UUFDNUIsS0FBSyxFQUFFLENBQUM7UUFDUixlQUFlLEVBQUUsQ0FBQztRQUNsQixPQUFPLEVBQUUsT0FBTztRQUNoQixLQUFLLEVBQUUsS0FBSztRQUNaLFVBQVUsRUFBRSxJQUFJO1FBQ2hCLGFBQWEsRUFBRSxTQUFTO1FBQ3hCLE1BQU0sRUFBRSxTQUFTO1FBQ2pCLE9BQU8sRUFBRSxTQUFTO1FBQ2xCLE1BQU0sRUFBRSxJQUFJO1FBQ1osSUFBSSxFQUFFLElBQUk7UUFDVixjQUFjLEVBQUUsSUFBSTtRQUNwQixLQUFLLEVBQUUsSUFBSTtRQUNYLE1BQU0sRUFBRSxPQUFPO1FBQ2YsZUFBZSxFQUFFLElBQUk7UUFDckIsVUFBVSxFQUFFLElBQUk7UUFDaEIsb0JBQW9CLEVBQUUsSUFBSTs7UUFFMUIsU0FBUyxFQUFFLElBQUk7O1FBRWYsVUFBVSxFQUFFLElBQUk7S0FDakIsQ0FBQztBQUNKLENBQUM7Ozs7Ozs7O0FBVUQsTUFBTSxVQUFVLHVCQUF1QixDQUFDLEtBQVksRUFBRSxTQUEyQjs7VUFFekUsS0FBSyxHQUFHLFFBQVEsRUFBRSxDQUFDLEtBQUssQ0FBQzs7UUFDM0IsU0FBUyxHQUF5QixJQUFJOztVQUNwQyxLQUFLLEdBQUcsS0FBSyxDQUFDLGNBQWM7O1VBQzVCLEdBQUcsR0FBRyxLQUFLLENBQUMsWUFBWTtJQUU5QixJQUFJLEdBQUcsR0FBRyxLQUFLLEVBQUU7O2NBQ1QsT0FBTyxHQUFHLFNBQVMsa0JBQTJCOztjQUM5QyxJQUFJLEdBQUcsS0FBSyxDQUFDLElBQUk7UUFFdkIsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQzFCLFlBQVksR0FBRyxtQkFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQXFCOztrQkFDM0MsZ0JBQWdCLEdBQ2xCLE9BQU8sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLE9BQU87WUFDeEQsS0FBSyxJQUFJLFVBQVUsSUFBSSxnQkFBZ0IsRUFBRTtnQkFDdkMsSUFBSSxnQkFBZ0IsQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7b0JBQy9DLFNBQVMsR0FBRyxTQUFTLElBQUksRUFBRSxDQUFDOzswQkFDdEIsWUFBWSxHQUFHLGdCQUFnQixDQUFDLFVBQVUsQ0FBQzs7MEJBQzNDLFdBQVcsR0FBRyxTQUFTLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztvQkFDeEQsV0FBVyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxVQUFVLEVBQUUsWUFBWSxDQUFDLENBQUMsQ0FBQzt3QkFDekQsQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsVUFBVSxFQUFFLFlBQVksQ0FBQyxDQUFDLENBQUM7aUJBQ3ZFO2FBQ0Y7U0FDRjtLQUNGO0lBQ0QsT0FBTyxTQUFTLENBQUM7QUFDbkIsQ0FBQzs7Ozs7OztNQU9LLFlBQVksR0FBNkI7SUFDN0MsT0FBTyxFQUFFLFdBQVc7SUFDcEIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsWUFBWSxFQUFFLFlBQVk7SUFDMUIsV0FBVyxFQUFFLFdBQVc7SUFDeEIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsVUFBVSxFQUFFLFVBQVU7Q0FDdkI7Ozs7Ozs7Ozs7O0FBRUQsTUFBTSxVQUFVLHVCQUF1QixDQUNuQyxLQUFhLEVBQUUsUUFBZ0IsRUFBRSxLQUFRLEVBQUUsU0FBOEIsRUFBRSxVQUFvQixFQUMvRixjQUFtRTtJQUNyRSxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBQSxTQUFTLEVBQU8sRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDOztVQUMzRixLQUFLLEdBQUcsUUFBUSxFQUFFOztVQUNsQixPQUFPLEdBQUcsbUJBQUEsZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUF1Qjs7VUFDL0QsS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDOztRQUNoQyxTQUF5Qzs7UUFDekMsU0FBdUM7SUFDM0MsSUFBSSxDQUFDLFVBQVUsSUFBSSxDQUFDLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUN6RCxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRTtRQUNyQyxvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzlDLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQztZQUFFLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUM7UUFDeEUsSUFBSSxTQUFTLEVBQUU7WUFDYixJQUFJLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixJQUFJLEtBQUssQ0FBQyxJQUFJLHNCQUF3QixFQUFFO2dCQUMxRTs7Ozs7Ozs7bUJBUUc7Z0JBQ0gsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDNUMsb0JBQW9CLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLG1CQUFBLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztpQkFDckY7YUFDRjtTQUNGO0tBQ0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixFQUFFO1FBQzNDLFFBQVEsR0FBRyxZQUFZLENBQUMsUUFBUSxDQUFDLElBQUksUUFBUSxDQUFDO1FBRTlDLElBQUksU0FBUyxFQUFFO1lBQ2IsOEJBQThCLENBQUMsUUFBUSxDQUFDLENBQUM7WUFDekMsZ0NBQWdDLENBQUMsS0FBSyxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEUsU0FBUyxDQUFDLG1CQUFtQixFQUFFLENBQUM7U0FDakM7UUFFRCxxQkFBcUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDOztjQUV2RSxRQUFRLEdBQUcsY0FBYyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDO1FBQ2hGLHVGQUF1RjtRQUN2RixXQUFXO1FBQ1gsZ0VBQWdFO1FBQ2hFLEtBQUssR0FBRyxTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLG1CQUFBLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQUUsUUFBUSxDQUFDLEVBQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7UUFDN0YsSUFBSSxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNsQyxRQUFRLENBQUMsV0FBVyxDQUFDLG1CQUFBLE9BQU8sRUFBWSxFQUFFLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztTQUM1RDthQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDckMsQ0FBQyxtQkFBQSxPQUFPLEVBQVksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxtQkFBQSxPQUFPLEVBQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQztnQkFDL0MsQ0FBQyxtQkFBQSxPQUFPLEVBQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEtBQUssQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUM3QyxxREFBcUQ7UUFDckQsc0RBQXNEO1FBQ3RELElBQUksU0FBUyxJQUFJLENBQUMsZUFBZSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDdkQsTUFBTSwwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkQ7S0FDRjtBQUNILENBQUM7Ozs7Ozs7QUFHRCxTQUFTLGlCQUFpQixDQUFDLEtBQVksRUFBRSxTQUFpQjtJQUN4RCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDOztVQUMxQixtQkFBbUIsR0FBRyx1QkFBdUIsQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDO0lBQ3JFLElBQUksQ0FBQyxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyx1QkFBeUIsQ0FBQyxFQUFFO1FBQzFELG1CQUFtQixDQUFDLEtBQUssQ0FBQyxrQkFBb0IsQ0FBQztLQUNoRDtBQUNILENBQUM7Ozs7Ozs7OztBQUVELE1BQU0sVUFBVSxvQkFBb0IsQ0FDaEMsS0FBWSxFQUFFLE9BQTRCLEVBQUUsSUFBZSxFQUFFLFFBQWdCLEVBQUUsS0FBVTs7VUFDckYsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDaEMsUUFBUSxHQUFHLHlCQUF5QixDQUFDLFFBQVEsQ0FBQyxDQUFDOztVQUN6QyxVQUFVLEdBQUcsMEJBQTBCLENBQUMsS0FBSyxDQUFDO0lBQ3BELElBQUksSUFBSSxvQkFBc0IsRUFBRTtRQUM5QixJQUFJLEtBQUssSUFBSSxJQUFJLEVBQUU7WUFDakIsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQ0FBQyxtQkFBQSxPQUFPLEVBQVksQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzNELENBQUMsbUJBQUEsT0FBTyxFQUFZLENBQUMsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDbEY7YUFBTTtZQUNMLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQzVCLFFBQVEsQ0FBQyxZQUFZLENBQUMsQ0FBQyxtQkFBQSxPQUFPLEVBQVksQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO2dCQUNwRSxDQUFDLG1CQUFBLE9BQU8sRUFBWSxDQUFDLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztTQUM5RDtLQUNGO1NBQU07O2NBQ0MsV0FBVyxHQUFHLFlBQVksSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBVSxFQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQyxFQUFFO1FBQ25GLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLG1CQUFBLE9BQU8sRUFBWSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdkQ7YUFBTTtZQUNMLENBQUMsbUJBQUEsT0FBTyxFQUFZLENBQUMsQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1NBQ2pEO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsZ0NBQWdDLENBQ3JDLFFBQWUsRUFBRSxPQUE0QixFQUFFLFFBQWdCLEVBQUUsS0FBWTtJQUMvRSw0REFBNEQ7SUFDNUQsSUFBSSxlQUFlLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBRTtRQUM1QyxPQUFPO0tBQ1I7SUFFRCx5REFBeUQ7SUFDekQsSUFBSSxDQUFDLENBQUMsUUFBUSxJQUFJLE9BQU8sQ0FBQztRQUN0QiwwRUFBMEU7UUFDMUUsT0FBTyxJQUFJLEtBQUssVUFBVSxJQUFJLE9BQU8sWUFBWSxJQUFJO1FBQ3JELDhDQUE4QztRQUM5QyxRQUFRLENBQUMsQ0FBQyxDQUFDLEtBQUsscUJBQXFCLEVBQUU7UUFDekMsdURBQXVEO1FBQ3ZELE1BQU0sMEJBQTBCLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQ25EO0FBQ0gsQ0FBQzs7Ozs7O0FBRUQsU0FBUyxlQUFlLENBQUMsUUFBZSxFQUFFLE9BQXNCOztVQUN4RCxPQUFPLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU87SUFFdkMsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDakMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxNQUFNLEtBQUssZ0JBQWdCO2dCQUMzQixNQUFNLEtBQUssc0JBQXNCLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdFLE9BQU8sSUFBSSxDQUFDO2FBQ2I7U0FDRjtLQUNGO0lBRUQsT0FBTyxLQUFLLENBQUM7QUFDZixDQUFDOzs7Ozs7Ozs7OztBQU1ELFNBQVMscUJBQXFCLENBQzFCLEtBQVksRUFBRSxLQUFZLEVBQUUsUUFBZ0IsRUFBRSxLQUFZLEVBQzFELFVBQStCOztVQUMzQixnQkFBZ0IsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQzs7Ozs7O1VBTTNDLGVBQWUsR0FBRyxtQkFBQSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBVTtJQUN6RCxJQUFJLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBSSx1QkFBdUIsRUFBRTtRQUNqRCxLQUFLLENBQUMsZ0JBQWdCLENBQUMsR0FBRyxRQUFRLEdBQUcsZUFBZSxDQUFDO1FBRXJELGdGQUFnRjtRQUNoRixpREFBaUQ7UUFDakQsSUFBSSxDQUFDLFVBQVUsRUFBRTtZQUNmLElBQUksS0FBSyxDQUFDLDBCQUEwQixJQUFJLENBQUMsQ0FBQyxFQUFFO2dCQUMxQyxLQUFLLENBQUMsMEJBQTBCLEdBQUcsZ0JBQWdCLENBQUM7YUFDckQ7WUFDRCxLQUFLLENBQUMsd0JBQXdCLEdBQUcsZ0JBQWdCLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZEO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7O0FBT0QsU0FBUywwQkFBMEIsQ0FBQyxRQUFnQixFQUFFLEtBQVk7SUFDaEUsT0FBTyxJQUFJLEtBQUssQ0FDWixrQ0FBa0MsUUFBUSx5Q0FBeUMsS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUM7QUFDNUcsQ0FBQzs7Ozs7Ozs7O0FBS0QsTUFBTSxVQUFVLHdCQUF3QixDQUNwQyxLQUFZLEVBQUUsUUFBZSxFQUFFLEdBQW9COztVQUMvQyxTQUFTLEdBQUcsd0JBQXdCLEVBQUU7SUFDNUMsSUFBSSxLQUFLLENBQUMsaUJBQWlCLEVBQUU7UUFDM0IsSUFBSSxHQUFHLENBQUMsaUJBQWlCO1lBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RELCtCQUErQixDQUFDLEtBQUssRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDckQsb0JBQW9CLENBQUMsS0FBSyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ3pEOztVQUNLLFNBQVMsR0FDWCxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFFBQVEsRUFBRSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxtQkFBQSxTQUFTLEVBQWdCLENBQUM7SUFDM0Ysd0JBQXdCLENBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN6RCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDOzs7Ozs7Ozs7O0FBS0QsU0FBUyxpQkFBaUIsQ0FDdEIsS0FBWSxFQUFFLFFBQWUsRUFBRSxVQUFzQyxFQUFFLEtBQVksRUFDbkYsU0FBMEI7SUFDNUIseUZBQXlGO0lBQ3pGLFdBQVc7SUFDWCxTQUFTLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQUUsd0NBQXdDLENBQUMsQ0FBQzs7VUFDNUYsVUFBVSxHQUFxQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLElBQUk7SUFDaEYsSUFBSSxVQUFVLEVBQUU7UUFDZCxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMzRCw4RkFBOEY7UUFDOUYsa0JBQWtCO1FBQ2xCLCtDQUErQztRQUMvQyxtRkFBbUY7UUFDbkYsd0ZBQXdGO1FBQ3hGLGFBQWE7UUFDYixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQ3BDLEdBQUcsR0FBRyxtQkFBQSxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQXFCO1lBQzlDLElBQUksR0FBRyxDQUFDLGlCQUFpQjtnQkFBRSxHQUFHLENBQUMsaUJBQWlCLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdkQ7UUFDRCwrQkFBK0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7Y0FDM0QsMEJBQTBCLEdBQUcsQ0FBQyxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzs7Y0FDckYsK0JBQStCLEdBQ2pDLENBQUMsS0FBSyxDQUFDLGtCQUFrQixJQUFJLEtBQUssQ0FBQyxrQkFBa0IsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDOztjQUNoRSxTQUFTLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhO1FBQzdDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFOztrQkFDcEMsR0FBRyxHQUFHLG1CQUFBLFVBQVUsQ0FBQyxDQUFDLENBQUMsRUFBcUI7O2tCQUV4QyxlQUFlLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNO1lBQ3pDLG9CQUFvQixDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztZQUV4RCxtQkFBbUIsQ0FBQyxtQkFBQSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxHQUFHLEVBQUUsVUFBVSxDQUFDLENBQUM7WUFFOUQsNEVBQTRFO1lBQzVFLDRCQUE0QjtZQUM1QixxQkFBcUIsQ0FDakIsZUFBZSxFQUFFLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLDBCQUEwQixFQUNsRSwrQkFBK0IsQ0FBQyxDQUFDO1NBQ3RDO0tBQ0Y7SUFDRCxJQUFJLFVBQVU7UUFBRSx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQ3hFLENBQUM7Ozs7Ozs7O0FBS0QsU0FBUyx3QkFBd0IsQ0FBQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQVk7O1VBQ2xFLEtBQUssR0FBRyxLQUFLLENBQUMsY0FBYzs7VUFDNUIsR0FBRyxHQUFHLEtBQUssQ0FBQyxZQUFZO0lBQzlCLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksS0FBSyxHQUFHLEdBQUcsRUFBRTtRQUMzQyw4QkFBOEIsQ0FDMUIsbUJBQUEsS0FBSyxFQUF5RCxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzVFO0lBQ0QsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs7Y0FDMUIsR0FBRyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQXFCO1FBQzlDLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQ3ZCLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsbUJBQUEsR0FBRyxFQUFxQixDQUFDLENBQUM7U0FDM0Q7O2NBQ0ssU0FBUyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsbUJBQUEsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFLG1CQUFBLEtBQUssRUFBZ0IsQ0FBQztRQUNsRixvQkFBb0IsQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztLQUNoRDtBQUNILENBQUM7Ozs7Ozs7QUFFRCxTQUFTLDRCQUE0QixDQUFDLEtBQVksRUFBRSxRQUFlLEVBQUUsS0FBWTs7VUFDekUsS0FBSyxHQUFHLEtBQUssQ0FBQyxjQUFjOztVQUM1QixHQUFHLEdBQUcsS0FBSyxDQUFDLFlBQVk7O1VBQ3hCLE9BQU8sR0FBRyxtQkFBQSxLQUFLLENBQUMsbUJBQW1CLEVBQUU7O1VBQ3JDLGlCQUFpQixHQUFHLEtBQUssQ0FBQyxpQkFBaUI7O1VBQzNDLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWE7O1VBQzFDLGFBQWEsR0FBRyxnQkFBZ0IsRUFBRTtJQUN4QyxJQUFJO1FBQ0Ysb0JBQW9CLENBQUMsWUFBWSxDQUFDLENBQUM7UUFFbkMsS0FBSyxJQUFJLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQzFCLEdBQUcsR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFxQjs7a0JBQ3hDLFNBQVMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDO1lBQzdCLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRTtnQkFDcEIsZ0NBQWdDLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7Z0JBRXBGLGlFQUFpRTtnQkFDakUsd0VBQXdFO2dCQUN4RSx5RUFBeUU7Z0JBQ3pFLG9FQUFvRTtnQkFDcEUsd0VBQXdFO2dCQUN4RSwwQkFBMEIsRUFBRSxDQUFDO2FBQzlCO2lCQUFNLElBQUksaUJBQWlCLEVBQUU7Z0JBQzVCLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDcEI7U0FDRjtLQUNGO1lBQVM7UUFDUixvQkFBb0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztLQUNyQztBQUNILENBQUM7Ozs7Ozs7OztBQUVELE1BQU0sVUFBVSxnQ0FBZ0MsQ0FDNUMsR0FBc0IsRUFBRSxPQUE0QixFQUFFLFNBQWMsRUFBRSxLQUFZLEVBQ2xGLGlCQUEwQjs7VUFDdEIscUJBQXFCLEdBQUcsT0FBTyxDQUFDLE1BQU07SUFDNUMsc0JBQXNCLENBQUMsR0FBRyxDQUFDLENBQUM7O1VBQ3RCLFlBQVksR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLGFBQWE7SUFDaEQsbUJBQUEsR0FBRyxDQUFDLFlBQVksRUFBRSxpQkFBcUIsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDO0lBQ2hFLHNCQUFzQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQzdCLHNFQUFzRTtJQUN0RSxvRkFBb0Y7SUFDcEYsaUZBQWlGO0lBQ2pGLHlEQUF5RDtJQUN6RCxJQUFJLHFCQUFxQixLQUFLLE9BQU8sQ0FBQyxNQUFNLElBQUksaUJBQWlCLEVBQUU7UUFDakUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDLENBQUM7S0FDaEM7QUFDSCxDQUFDOzs7Ozs7Ozs7OztBQVFELE1BQU0sVUFBVSwrQkFBK0IsQ0FDM0MsS0FBWSxFQUFFLEtBQVksRUFBRSxjQUFzQjtJQUNwRCxTQUFTLElBQUksV0FBVyxDQUNQLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLEVBQzdCLGdFQUFnRSxDQUFDLENBQUM7O1VBRTdFLFlBQVksR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxhQUFhLENBQUM7O1VBQzdDLGtCQUFrQixHQUFHLEtBQUssQ0FBQyxlQUFlLHNDQUErQzs7VUFDekYsYUFBYSxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxHQUFHLGtCQUFrQjtJQUM1RCxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsR0FBRyxFQUN6RCxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxjQUFjLENBQUMsQ0FBQztBQUN6RCxDQUFDOzs7Ozs7Ozs7O0FBS0QsU0FBUyxvQkFBb0IsQ0FDekIsUUFBZSxFQUFFLFNBQVksRUFBRSxHQUFvQixFQUFFLGVBQXVCOztVQUN4RSxxQkFBcUIsR0FBRyx3QkFBd0IsRUFBRTtJQUN4RCx3QkFBd0IsQ0FBQyxRQUFRLEVBQUUscUJBQXFCLEVBQUUsU0FBUyxDQUFDLENBQUM7SUFDckUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxxQkFBcUIsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO0lBQzNFLElBQUkscUJBQXFCLElBQUkscUJBQXFCLENBQUMsS0FBSyxFQUFFO1FBQ3hELGtCQUFrQixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLHFCQUFxQixDQUFDLENBQUM7S0FDNUU7SUFFRCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsSUFBSSxHQUFHLENBQUMsY0FBYyxFQUFFO1FBQzNELHFCQUFxQixDQUFDLEtBQUssMkJBQThCLENBQUM7S0FDM0Q7SUFFRCxJQUFJLGNBQWMsQ0FBQyxHQUFHLENBQUMsRUFBRTs7Y0FDakIsYUFBYSxHQUFHLHVCQUF1QixDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUM7UUFDcEYsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQztLQUNwQztBQUNILENBQUM7Ozs7Ozs7OztBQUtELFNBQVMsd0JBQXdCLENBQzdCLEtBQVksRUFBRSxxQkFBNEIsRUFBRSxTQUFZOztVQUNwRCxNQUFNLEdBQUcsZ0JBQWdCLENBQUMscUJBQXFCLEVBQUUsS0FBSyxDQUFDO0lBRTdELFNBQVMsSUFBSSxXQUFXLENBQ1AsS0FBSyxDQUFDLGFBQWEsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxpQkFBaUIsRUFDcEQsa0RBQWtELENBQUMsQ0FBQztJQUNyRSxTQUFTLElBQUksc0JBQXNCLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUVuRCxlQUFlLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLElBQUksTUFBTSxFQUFFO1FBQ1YsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNoQztBQUNILENBQUM7Ozs7Ozs7OztBQU9ELFNBQVMsb0JBQW9CLENBQUMsS0FBWSxFQUFFLFFBQWUsRUFBRSxLQUFZO0lBRXZFLFNBQVMsSUFBSSxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSx3Q0FBd0MsQ0FBQyxDQUFDOztVQUM1RixRQUFRLEdBQUcsS0FBSyxDQUFDLGlCQUFpQjs7UUFDcEMsT0FBTyxHQUFlLElBQUk7SUFDOUIsSUFBSSxRQUFRLEVBQUU7UUFDWixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7a0JBQ2xDLEdBQUcsR0FBRyxtQkFBQSxRQUFRLENBQUMsQ0FBQyxDQUFDLEVBQXdDO1lBQy9ELElBQUksMEJBQTBCLENBQUMsS0FBSyxFQUFFLG1CQUFBLEdBQUcsQ0FBQyxTQUFTLEVBQUUsRUFBRSxzQkFBc0IsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDcEYsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQkFBQSxZQUFZLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztnQkFDN0Qsa0JBQWtCLENBQ2QsOEJBQThCLENBQzFCLG1CQUFBLHdCQUF3QixFQUFFLEVBQXlELEVBQ25GLFFBQVEsQ0FBQyxFQUNiLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Z0JBRXhCLElBQUksY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFO29CQUN2QixJQUFJLEtBQUssQ0FBQyxLQUFLLHNCQUF5Qjt3QkFBRSwyQkFBMkIsQ0FBQyxLQUFLLENBQUMsQ0FBQztvQkFDN0UsS0FBSyxDQUFDLEtBQUssc0JBQXlCLENBQUM7b0JBRXJDLDhEQUE4RDtvQkFDOUQsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDdEI7cUJBQU07b0JBQ0wsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztpQkFDbkI7YUFDRjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLE9BQU8sQ0FBQztBQUNqQixDQUFDOzs7Ozs7QUFHRCxNQUFNLFVBQVUsMkJBQTJCLENBQUMscUJBQTRCOztVQUNoRSxLQUFLLEdBQUcsUUFBUSxFQUFFLENBQUMsS0FBSyxDQUFDO0lBQy9CLFNBQVM7UUFDTCxXQUFXLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLElBQUksRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO0lBQ2hHLENBQUMsS0FBSyxDQUFDLFVBQVUsSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1CQUFBLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQzdFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUN6QyxDQUFDOzs7Ozs7OztBQUlELFNBQVMsdUJBQXVCLENBQzVCLEtBQVksRUFBRSxTQUEwQixFQUFFLFVBQW1DO0lBQy9FLElBQUksU0FBUyxFQUFFOztjQUNQLFVBQVUsR0FBd0IsS0FBSyxDQUFDLFVBQVU7WUFDcEQsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1CQUFBLGVBQWUsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUU7UUFFNUMsbUZBQW1GO1FBQ25GLCtFQUErRTtRQUMvRSwwQ0FBMEM7UUFDMUMsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRTs7a0JBQ3RDLEtBQUssR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUMxQyxJQUFJLEtBQUssSUFBSSxJQUFJO2dCQUFFLE1BQU0sSUFBSSxLQUFLLENBQUMsbUJBQW1CLFNBQVMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3RGLFVBQVUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3RDO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7QUFNRCxTQUFTLG1CQUFtQixDQUN4QixLQUFhLEVBQUUsR0FBeUMsRUFDeEQsVUFBMEM7SUFDNUMsSUFBSSxVQUFVLEVBQUU7UUFDZCxJQUFJLEdBQUcsQ0FBQyxRQUFRLEVBQUU7WUFDaEIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM1QyxVQUFVLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEtBQUssQ0FBQzthQUNyQztTQUNGO1FBQ0QsSUFBSSxDQUFDLG1CQUFBLEdBQUcsRUFBcUIsQ0FBQyxDQUFDLFFBQVE7WUFBRSxVQUFVLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDO0tBQ2pFO0FBQ0gsQ0FBQzs7Ozs7Ozs7O0FBT0QsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLGtCQUEwQjs7VUFDN0UsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLO0lBQ3pCLFNBQVMsSUFBSSxXQUFXLENBQ1AsS0FBSyxLQUFLLENBQUMsSUFBSSxLQUFLLHdCQUEyQixFQUFFLElBQUksRUFDckQsMkNBQTJDLENBQUMsQ0FBQztJQUU5RCxTQUFTLElBQUksY0FBYyxDQUNWLGtCQUFrQixFQUFFLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDLGNBQWMsRUFDN0Qsc0NBQXNDLENBQUMsQ0FBQztJQUN6RCxnRUFBZ0U7SUFDaEUsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLHNCQUF5QixDQUFDO0lBQzdDLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0lBQzdCLEtBQUssQ0FBQyxZQUFZLEdBQUcsS0FBSyxHQUFHLGtCQUFrQixDQUFDO0lBQ2hELEtBQUssQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO0FBQ2hDLENBQUM7Ozs7Ozs7OztBQUVELFNBQVMsb0JBQW9CLENBQ3pCLEtBQVksRUFBRSxRQUFlLEVBQUUsR0FBb0IsRUFDbkQsZ0JBQTJDO0lBQzdDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztVQUNmLG1CQUFtQixHQUFHLElBQUksbUJBQW1CLENBQUMsZ0JBQWdCLEVBQUUsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQztJQUNoRyxLQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBQzFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyQyxDQUFDOzs7Ozs7OztBQUVELFNBQVMsaUJBQWlCLENBQ3RCLEtBQVksRUFBRSxxQkFBNEIsRUFBRSxHQUFvQjs7VUFDNUQsTUFBTSxHQUFHLGdCQUFnQixDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQzs7VUFFdkQsS0FBSyxHQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQzs7OztVQUk3QixlQUFlLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDOztVQUN6QyxhQUFhLEdBQUcsYUFBYSxDQUMvQixLQUFLLEVBQUUsV0FBVyxDQUNQLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxnQkFBa0IsQ0FBQyxxQkFBdUIsRUFDMUUsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxFQUFFLG1CQUFBLHFCQUFxQixFQUFnQixFQUN6RSxlQUFlLEVBQUUsZUFBZSxDQUFDLGNBQWMsQ0FBQyxtQkFBQSxNQUFNLEVBQVksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBRXpGLGFBQWEsQ0FBQyxNQUFNLENBQUMsR0FBRyxtQkFBQSxxQkFBcUIsRUFBZ0IsQ0FBQztJQUU5RCx5RUFBeUU7SUFDekUsZ0VBQWdFO0lBQ2hFLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsR0FBRyxhQUFhLENBQUM7SUFFbkQsSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsaUJBQWlCLEVBQUU7UUFDbEMsMkJBQTJCLENBQUMscUJBQXFCLENBQUMsQ0FBQztLQUNwRDtBQUNILENBQUM7Ozs7Ozs7Ozs7QUFFRCxNQUFNLFVBQVUsd0JBQXdCLENBQ3BDLEtBQWEsRUFBRSxJQUFZLEVBQUUsS0FBVSxFQUFFLEtBQVksRUFBRSxTQUE4QixFQUNyRixTQUFrQjtJQUNwQixTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssRUFBRSxtQkFBQSxTQUFTLEVBQU8sRUFBRSwyQ0FBMkMsQ0FBQyxDQUFDO0lBQ2pHLFNBQVMsSUFBSSw4QkFBOEIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7VUFDNUMsT0FBTyxHQUFHLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBWTs7VUFDcEQsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDaEMsSUFBSSxLQUFLLElBQUksSUFBSSxFQUFFO1FBQ2pCLFNBQVMsSUFBSSxTQUFTLENBQUMsdUJBQXVCLEVBQUUsQ0FBQztRQUNqRCxvQkFBb0IsQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLGVBQWUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUM7WUFDcEQsT0FBTyxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNoRTtTQUFNO1FBQ0wsU0FBUyxJQUFJLFNBQVMsQ0FBQyxvQkFBb0IsRUFBRSxDQUFDOztjQUN4QyxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUM7O2NBQzlCLFFBQVEsR0FDVixTQUFTLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLE9BQU8sSUFBSSxFQUFFLEVBQUUsSUFBSSxDQUFDO1FBRzVGLElBQUksb0JBQW9CLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDbEMsUUFBUSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUMzRDthQUFNO1lBQ0wsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztnQkFDbkQsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7U0FDbEQ7S0FDRjtBQUNILENBQUM7Ozs7Ozs7Ozs7O0FBVUQsU0FBUyxrQkFBa0IsQ0FDdkIsY0FBc0IsRUFBRSxRQUFXLEVBQUUsR0FBb0IsRUFBRSxLQUFZOztRQUNyRSxnQkFBZ0IsR0FBRyxtQkFBQSxLQUFLLENBQUMsYUFBYSxFQUFnQztJQUMxRSxJQUFJLGdCQUFnQixLQUFLLFNBQVMsSUFBSSxjQUFjLElBQUksZ0JBQWdCLENBQUMsTUFBTSxFQUFFO1FBQy9FLGdCQUFnQixHQUFHLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxHQUFHLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxDQUFDO0tBQzdFOztVQUVLLGFBQWEsR0FBdUIsZ0JBQWdCLENBQUMsY0FBYyxDQUFDO0lBQzFFLElBQUksYUFBYSxFQUFFOztjQUNYLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUTtRQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sR0FBRzs7a0JBQ25DLFVBQVUsR0FBRyxhQUFhLENBQUMsQ0FBQyxFQUFFLENBQUM7O2tCQUMvQixXQUFXLEdBQUcsYUFBYSxDQUFDLENBQUMsRUFBRSxDQUFDOztrQkFDaEMsS0FBSyxHQUFHLGFBQWEsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNoQyxJQUFJLFFBQVEsRUFBRTtnQkFDWixtQkFBQSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7YUFDMUQ7aUJBQU07Z0JBQ0wsQ0FBQyxtQkFBQSxRQUFRLEVBQU8sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLEtBQUssQ0FBQzthQUN4QztZQUNELElBQUksU0FBUyxFQUFFOztzQkFDUCxLQUFLLEdBQUcsUUFBUSxFQUFFOztzQkFDbEIsYUFBYSxHQUFHLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBWTtnQkFDaEUsb0JBQW9CLENBQUMsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRSxLQUFLLENBQUMsQ0FBQzthQUM1RTtTQUNGO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7OztBQWlCRCxTQUFTLHFCQUFxQixDQUMxQixjQUFzQixFQUFFLE1BQStCLEVBQUUsS0FBWTs7VUFDakUsZ0JBQWdCLEdBQ2xCLEtBQUssQ0FBQyxhQUFhLElBQUksQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsSUFBSSxtQkFBQSxrQkFBa0IsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUM5Riw0Q0FBNEM7SUFDNUMsS0FBSyxJQUFJLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxJQUFJLGNBQWMsRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUM5RCxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDN0I7O1VBRUssS0FBSyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxLQUFLLEVBQUU7O1FBQ3ZCLENBQUMsR0FBRyxDQUFDO0lBQ1QsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRTs7Y0FDakIsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7UUFDekIsSUFBSSxRQUFRLHlCQUFpQyxFQUFFO1lBQzdDLG1EQUFtRDtZQUNuRCxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsU0FBUztTQUNWO2FBQU0sSUFBSSxRQUFRLHNCQUE4QixFQUFFO1lBQ2pELHFDQUFxQztZQUNyQyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ1AsU0FBUztTQUNWO1FBRUQsNEZBQTRGO1FBQzVGLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUTtZQUFFLE1BQU07O2NBRWxDLGlCQUFpQixHQUFHLE1BQU0sQ0FBQyxtQkFBQSxRQUFRLEVBQVUsQ0FBQzs7Y0FDOUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBRTlCLElBQUksaUJBQWlCLEtBQUssU0FBUyxFQUFFOztrQkFDN0IsYUFBYSxHQUFrQixnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7Z0JBQ2pFLENBQUMsZ0JBQWdCLENBQUMsY0FBYyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1CQUFBLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO1lBQ2xGLGFBQWEsQ0FBQyxJQUFJLENBQUMsbUJBQUEsUUFBUSxFQUFVLEVBQUUsaUJBQWlCLEVBQUUsbUJBQUEsU0FBUyxFQUFVLENBQUMsQ0FBQztTQUNoRjtRQUVELENBQUMsSUFBSSxDQUFDLENBQUM7S0FDUjtJQUNELE9BQU8sZ0JBQWdCLENBQUM7QUFDMUIsQ0FBQzs7Ozs7O01BT0ssZUFBZSxHQUFRLFNBQVMsSUFBSSxvQkFBb0IsQ0FBQyxZQUFZLENBQUM7Ozs7Ozs7Ozs7O0FBWTVFLE1BQU0sVUFBVSxnQkFBZ0IsQ0FDNUIsVUFBd0QsRUFBRSxXQUFrQixFQUFFLE1BQWdCLEVBQzlGLEtBQVksRUFBRSxxQkFBK0I7SUFDL0MsU0FBUyxJQUFJLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNuQyxTQUFTLElBQUksV0FBVyxDQUFDLFdBQVcsQ0FBQyxDQUFDOzs7VUFFaEMsVUFBVSxHQUFlLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQ3BFLFVBQVUsRUFBRyxjQUFjO0lBQzNCLElBQUksRUFBUyx5RUFBeUU7SUFDdEYscUJBQXFCLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUcsZUFBZTtJQUNoRCxXQUFXLEVBQXNCLFNBQVM7SUFDMUMsSUFBSSxFQUE2QixPQUFPO0lBQ3hDLElBQUksRUFBNkIsVUFBVTtJQUMzQyxLQUFLLEVBQTRCLFNBQVM7SUFDMUMsTUFBTSxDQUNMO0lBQ0wsU0FBUyxJQUFJLHFCQUFxQixDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQy9DLE9BQU8sVUFBVSxDQUFDO0FBQ3BCLENBQUM7Ozs7Ozs7O0FBUUQsU0FBUywyQkFBMkIsQ0FBQyxLQUFZO0lBQy9DLEtBQUssSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE9BQU8sS0FBSyxJQUFJLEVBQUUsT0FBTyxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtRQUMvRSwyRkFBMkY7UUFDM0YsMEZBQTBGO1FBQzFGLFVBQVU7UUFDVixJQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxZQUFZLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDekQsS0FBSyxJQUFJLENBQUMsR0FBRyx1QkFBdUIsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7c0JBQ3ZELGVBQWUsR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxpRkFBaUY7Z0JBQ2pGLGFBQWE7Z0JBQ2IsU0FBUyxJQUFJLGFBQWEsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLEVBQUUseUJBQXlCLENBQUMsQ0FBQztnQkFDOUUsc0JBQXNCLENBQUMsZUFBZSxFQUFFLGVBQWUsQ0FBQyxLQUFLLENBQUMsRUFBRSxtQkFBQSxlQUFlLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQzdGO1NBQ0Y7S0FDRjtBQUNILENBQUM7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLGdCQUFnQixDQUFDLG9CQUE0Qjs7VUFDckQsS0FBSyxHQUFHLFFBQVEsRUFBRTtJQUN4QixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDLENBQUM7O1VBQ3RELFFBQVEsR0FBRyx1QkFBdUIsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUM7SUFDckUsU0FBUyxJQUFJLGNBQWMsQ0FBQyxtQkFBQSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLEVBQVMsa0JBQW9CLENBQUM7SUFFakcseURBQXlEO0lBQ3pELG9FQUFvRTtJQUNwRSxJQUFJLENBQUMsNEJBQTRCLENBQUMsUUFBUSxDQUFDLElBQUksY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2pFLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLHFDQUF5QyxDQUFDLEVBQUU7UUFDakUscUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDaEMsU0FBUyxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUN4QztBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE0QkQsU0FBUyxxQkFBcUIsQ0FBQyxhQUFvQjs7VUFDM0MsY0FBYyxHQUFHLGFBQWEsQ0FBQyxLQUFLLENBQUM7SUFDM0MsS0FBSyxJQUFJLENBQUMsR0FBRyxhQUFhLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxjQUFjLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMzRSxhQUFhLENBQUMsQ0FBQyxDQUFDLEdBQUcsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNoRDtBQUNILENBQUM7Ozs7Ozs7Ozs7OztBQWFELE1BQU0sVUFBVSxhQUFhLENBQTZCLEtBQVksRUFBRSxpQkFBb0I7SUFDMUYsK0ZBQStGO0lBQy9GLEtBQUs7SUFDTCwrRkFBK0Y7SUFDL0YsS0FBSztJQUNMLHNGQUFzRjtJQUN0RixhQUFhO0lBQ2IsK0NBQStDO0lBQy9DLElBQUksS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1FBQ3JCLG1CQUFBLEtBQUssQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLGlCQUFpQixDQUFDO0tBQy9DO1NBQU07UUFDTCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsaUJBQWlCLENBQUM7S0FDdkM7SUFDRCxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsaUJBQWlCLENBQUM7SUFDdEMsT0FBTyxpQkFBaUIsQ0FBQztBQUMzQixDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFrQkQsTUFBTSxVQUFVLGFBQWEsQ0FBQyxLQUFZO0lBQ3hDLE9BQU8sS0FBSyxFQUFFO1FBQ1osS0FBSyxDQUFDLEtBQUssQ0FBQyxrQkFBb0IsQ0FBQzs7Y0FDM0IsTUFBTSxHQUFHLGNBQWMsQ0FBQyxLQUFLLENBQUM7UUFDcEMsMkZBQTJGO1FBQzNGLElBQUksVUFBVSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFO1lBQ2hDLE9BQU8sS0FBSyxDQUFDO1NBQ2Q7UUFDRCxxQkFBcUI7UUFDckIsS0FBSyxHQUFHLG1CQUFBLE1BQU0sRUFBRSxDQUFDO0tBQ2xCO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7QUFjRCxNQUFNLFVBQVUsWUFBWSxDQUFDLFdBQXdCLEVBQUUsS0FBdUI7O1VBQ3RFLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxLQUFLLGtCQUEyQjtJQUNyRSxXQUFXLENBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQztJQUUzQixJQUFJLGdCQUFnQixJQUFJLFdBQVcsQ0FBQyxLQUFLLElBQUksY0FBYyxFQUFFOztZQUN2RCxHQUErQjtRQUNuQyxXQUFXLENBQUMsS0FBSyxHQUFHLElBQUksT0FBTzs7OztRQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxFQUFDLENBQUM7UUFDdEQsV0FBVyxDQUFDLFNBQVM7OztRQUFDLEdBQUcsRUFBRTtZQUN6QixJQUFJLFdBQVcsQ0FBQyxLQUFLLHdCQUFpQyxFQUFFO2dCQUN0RCxXQUFXLENBQUMsS0FBSyxJQUFJLHNCQUErQixDQUFDO2dCQUNyRCxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7YUFDOUI7WUFFRCxJQUFJLFdBQVcsQ0FBQyxLQUFLLHVCQUFnQyxFQUFFO2dCQUNyRCxXQUFXLENBQUMsS0FBSyxJQUFJLHFCQUE4QixDQUFDOztzQkFDOUMsYUFBYSxHQUFHLFdBQVcsQ0FBQyxhQUFhO2dCQUMvQyxJQUFJLGFBQWEsRUFBRTtvQkFDakIsYUFBYSxDQUFDLFlBQVksRUFBRSxDQUFDO2lCQUM5QjthQUNGO1lBRUQsV0FBVyxDQUFDLEtBQUssR0FBRyxjQUFjLENBQUM7WUFDbkMsbUJBQUEsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDZCxDQUFDLEVBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQzs7Ozs7QUFFRCxNQUFNLFVBQVUsZUFBZSxDQUFDLFdBQXdCO0lBQ3RELEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7Y0FDaEQsYUFBYSxHQUFHLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO1FBQy9DLHlCQUF5QixDQUFDLG1CQUFBLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxFQUFFLEVBQUUsYUFBYSxDQUFDLENBQUM7S0FDN0U7QUFDSCxDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLHFCQUFxQixDQUFJLElBQVcsRUFBRSxPQUFVOztVQUN4RCxlQUFlLEdBQUcsSUFBSSxDQUFDLGdCQUFnQixDQUFDO0lBRTlDLElBQUksZUFBZSxDQUFDLEtBQUs7UUFBRSxlQUFlLENBQUMsS0FBSyxFQUFFLENBQUM7SUFFbkQsSUFBSTtRQUNGLElBQUksY0FBYyxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3hCLFNBQVMsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBRSxxQkFBcUI7U0FDakQ7UUFDRCxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUUsbUJBQW1CO0tBQy9DO0lBQUMsT0FBTyxLQUFLLEVBQUU7UUFDZCxXQUFXLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ3pCLE1BQU0sS0FBSyxDQUFDO0tBQ2I7WUFBUztRQUNSLElBQUksZUFBZSxDQUFDLEdBQUc7WUFBRSxlQUFlLENBQUMsR0FBRyxFQUFFLENBQUM7S0FDaEQ7QUFDSCxDQUFDOzs7Ozs7O0FBT0QsTUFBTSxVQUFVLHVCQUF1QixDQUFDLEtBQVk7SUFDbEQsZUFBZSxDQUFDLG1CQUFBLEtBQUssQ0FBQyxPQUFPLENBQUMsRUFBZSxDQUFDLENBQUM7QUFDakQsQ0FBQzs7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSxjQUFjLENBQUksU0FBWTs7VUFDdEMsSUFBSSxHQUFHLDBCQUEwQixDQUFDLFNBQVMsQ0FBQztJQUNsRCxzQkFBc0IsQ0FBSSxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7QUFDN0MsQ0FBQzs7Ozs7OztBQUVELE1BQU0sVUFBVSxzQkFBc0IsQ0FBSSxJQUFXLEVBQUUsT0FBVTtJQUMvRCxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUM1QixJQUFJO1FBQ0YscUJBQXFCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3RDO1lBQVM7UUFDUixxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7Ozs7Ozs7Ozs7O0FBV0QsTUFBTSxVQUFVLHdCQUF3QixDQUFDLEtBQVk7SUFDbkQscUJBQXFCLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDNUIsSUFBSTtRQUNGLHVCQUF1QixDQUFDLEtBQUssQ0FBQyxDQUFDO0tBQ2hDO1lBQVM7UUFDUixxQkFBcUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztLQUM5QjtBQUNILENBQUM7Ozs7Ozs7O0FBSUQsTUFBTSxVQUFVLFNBQVMsQ0FBSSxRQUFlLEVBQUUsU0FBWTs7VUFDbEQsU0FBUyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUM7O1VBQzNCLE9BQU8sR0FBRyxTQUFTLENBQUMsUUFBUSxFQUFFLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7VUFDL0MsVUFBVSxHQUFHLG1CQUFBLFNBQVMsQ0FBQyxRQUFRLEVBQUU7O1VBQ2pDLFlBQVksR0FBRyxjQUFjLENBQUMsUUFBUSxDQUFDO0lBRTdDLElBQUk7UUFDRixzQkFBc0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUNqQyxZQUFZLElBQUksa0JBQWtCLGlCQUFxQixTQUFTLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDN0UsZUFBZSxDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsY0FBYyxDQUFDLFFBQVEsQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQzNFLHNCQUFzQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ2pDLGtGQUFrRjtRQUNsRixJQUFJLENBQUMsWUFBWSxJQUFJLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRTtZQUNoRCxrQkFBa0IsaUJBQXFCLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUM5RDtLQUNGO1lBQVM7UUFDUixTQUFTLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDcEI7QUFDSCxDQUFDOzs7Ozs7OztBQUVELFNBQVMsa0JBQWtCLENBQUksS0FBa0IsRUFBRSxLQUFZLEVBQUUsU0FBWTs7VUFDckUsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTO0lBQ2pDLElBQUksU0FBUyxFQUFFO1FBQ2Isb0JBQW9CLENBQUMsS0FBSyxDQUFDLG1CQUFtQixDQUFDLENBQUM7UUFDaEQsU0FBUyxDQUFDLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztLQUM3QjtBQUNILENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBdUJELE1BQU0sVUFBVSxvQkFBb0IsQ0FBQyxLQUFZLEVBQUUsTUFBTSxHQUFHLEVBQUUsRUFBRSxNQUFNLEdBQUcsRUFBRTs7VUFDbkUsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJOztVQUN6QixnQkFBZ0IsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQzs7VUFDM0MsS0FBSyxHQUFHLHVCQUF1QixHQUFHLE1BQU0sR0FBRyx1QkFBdUIsR0FBRyxNQUFNO0lBRWpGLE9BQU8sS0FBSyxDQUFDLGdCQUFnQixDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxnQkFBZ0IsQ0FBQyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDcEYsQ0FBQzs7QUFFRCxNQUFNLE9BQU8sYUFBYSxHQUFHLGNBQWM7Ozs7O0FBRTNDLE1BQU0sVUFBVSxxQkFBcUIsQ0FBQyxLQUFZO0lBQ2hELG1GQUFtRjtJQUNuRixvQkFBb0I7SUFDcEIsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLFNBQVMsRUFBRTtRQUM5Qix5QkFBeUI7UUFDekIsS0FBSyxDQUFDLE1BQU0sR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLGdCQUF5QixDQUFDO0tBQ3ZFO0lBQ0QsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDO0FBQ3RCLENBQUM7Ozs7O0FBRUQsTUFBTSxVQUFVLFVBQVUsQ0FBQyxJQUFXO0lBQ3BDLHFGQUFxRjtJQUNyRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLElBQUksbUJBQUEsUUFBUSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7QUFDOUUsQ0FBQzs7Ozs7QUFFRCxTQUFTLGVBQWUsQ0FBQyxJQUFXO0lBQ2xDLE9BQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUFJLG1CQUFBLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQzFGLENBQUM7Ozs7Ozs7O0FBTUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQVksRUFBRSxLQUFZOztVQUN4RCxjQUFjLEdBQUcsbUJBQUEsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBUztJQUNsRCxPQUFPLGNBQWMsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNsQyxDQUFDOzs7Ozs7O0FBR0QsTUFBTSxVQUFVLFdBQVcsQ0FBQyxLQUFZLEVBQUUsS0FBVTs7VUFDNUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7O1VBQzFCLFlBQVksR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJO0lBQ3ZFLFlBQVksSUFBSSxZQUFZLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQ2xELENBQUM7Ozs7Ozs7Ozs7QUFVRCxNQUFNLFVBQVUsb0JBQW9CLENBQUMsS0FBWSxFQUFFLE1BQTBCLEVBQUUsS0FBVTs7VUFDakYsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDMUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUc7O2NBQzVCLEtBQUssR0FBRyxtQkFBQSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7Y0FDN0IsVUFBVSxHQUFHLG1CQUFBLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFVOztjQUNsQyxXQUFXLEdBQUcsbUJBQUEsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQVU7O2NBQ25DLFFBQVEsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO1FBQzdCLFNBQVMsSUFBSSxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7O2NBQ3ZDLEdBQUcsR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFxQjs7Y0FDNUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRO1FBQzdCLElBQUksUUFBUSxFQUFFO1lBQ1osbUJBQUEsR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1NBQzFEO2FBQU07WUFDTCxRQUFRLENBQUMsV0FBVyxDQUFDLEdBQUcsS0FBSyxDQUFDO1NBQy9CO0tBQ0Y7QUFDSCxDQUFDOzs7Ozs7OztBQUtELE1BQU0sVUFBVSxtQkFBbUIsQ0FBQyxLQUFZLEVBQUUsS0FBYSxFQUFFLEtBQWE7SUFDNUUsU0FBUyxJQUFJLGFBQWEsQ0FBQyxLQUFLLEVBQUUsbUJBQUEsU0FBUyxFQUFPLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUNyRixTQUFTLElBQUksaUJBQWlCLENBQUMsS0FBSyxFQUFFLEtBQUssR0FBRyxhQUFhLENBQUMsQ0FBQzs7VUFDdkQsT0FBTyxHQUFHLG1CQUFBLG1CQUFBLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsRUFBTyxFQUFTO0lBQzlELFNBQVMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLDZCQUE2QixDQUFDLENBQUM7SUFDbkUsU0FBUyxJQUFJLFNBQVMsQ0FBQyxlQUFlLEVBQUUsQ0FBQzs7VUFDbkMsUUFBUSxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7SUFDaEMsb0JBQW9CLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztBQUNuRyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vLi4vZGknO1xuaW1wb3J0IHtFcnJvckhhbmRsZXJ9IGZyb20gJy4uLy4uL2Vycm9yX2hhbmRsZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge0NVU1RPTV9FTEVNRU5UU19TQ0hFTUEsIE5PX0VSUk9SU19TQ0hFTUEsIFNjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9zY2hlbWEnO1xuaW1wb3J0IHt2YWxpZGF0ZUFnYWluc3RFdmVudEF0dHJpYnV0ZXMsIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGUsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWV9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7Y3JlYXRlTmFtZWRBcnJheVR5cGV9IGZyb20gJy4uLy4uL3V0aWwvbmFtZWRfYXJyYXlfdHlwZSc7XG5pbXBvcnQge25vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUsIG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlfSBmcm9tICcuLi8uLi91dGlsL25nX3JlZmxlY3QnO1xuaW1wb3J0IHthc3NlcnRMVmlldywgYXNzZXJ0UHJldmlvdXNJc1BhcmVudH0gZnJvbSAnLi4vYXNzZXJ0JztcbmltcG9ydCB7YXR0YWNoUGF0Y2hEYXRhLCBnZXRDb21wb25lbnRWaWV3QnlJbnN0YW5jZX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIGV4ZWN1dGVQcmVPcmRlckhvb2tzLCByZWdpc3RlclByZU9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJTkpFQ1RPUiwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldE5hbWVzcGFjZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRTZWxlY3RlZEluZGV4LCBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCwgaXNDcmVhdGlvbk1vZGUsIGxlYXZlVmlldywgc2V0QWN0aXZlSG9zdEVsZW1lbnQsIHNldEJpbmRpbmdSb290LCBzZXRDaGVja05vQ2hhbmdlc01vZGUsIHNldEN1cnJlbnREaXJlY3RpdmVEZWYsIHNldEN1cnJlbnRRdWVyeUluZGV4LCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4LCDJtcm1bmFtZXNwYWNlSFRNTH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtpbml0aWFsaXplU3RhdGljQ29udGV4dCBhcyBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3N0eWxpbmcvY2xhc3NfYW5kX3N0eWxlX2JpbmRpbmdzJztcbmltcG9ydCB7QU5JTUFUSU9OX1BST1BfUFJFRklYLCBpc0FuaW1hdGlvblByb3B9IGZyb20gJy4uL3N0eWxpbmcvdXRpbCc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7YXR0cnNTdHlsaW5nSW5kZXhPZn0gZnJvbSAnLi4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnksIHN0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudCwgZ2V0Um9vdENvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgaXNDb250ZW50UXVlcnlIb3N0LCBpc0xDb250YWluZXIsIGlzUm9vdFZpZXcsIHJlYWRQYXRjaGVkTFZpZXcsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHVud3JhcFJOb2RlLCB2aWV3QXR0YWNoZWRUb0NoYW5nZURldGVjdG9yfSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuaW1wb3J0IHtMQ2xlYW51cCwgTFZpZXdCbHVlcHJpbnQsIE1hdGNoZXNBcnJheSwgVENsZWFudXAsIFROb2RlSW5pdGlhbERhdGEsIFROb2RlSW5pdGlhbElucHV0cywgVE5vZGVMb2NhbE5hbWVzLCBUVmlld0NvbXBvbmVudHMsIFRWaWV3Q29uc3RydWN0b3IsIGF0dGFjaExDb250YWluZXJEZWJ1ZywgYXR0YWNoTFZpZXdEZWJ1ZywgY2xvbmVUb0xWaWV3LCBjbG9uZVRvVFZpZXdEYXRhfSBmcm9tICcuL2x2aWV3X2RlYnVnJztcbmltcG9ydCB7c2VsZWN0SW50ZXJuYWx9IGZyb20gJy4vc2VsZWN0JztcblxuXG4vKipcbiAqIEEgcGVybWFuZW50IG1hcmtlciBwcm9taXNlIHdoaWNoIHNpZ25pZmllcyB0aGF0IHRoZSBjdXJyZW50IENEIHRyZWUgaXNcbiAqIGNsZWFuLlxuICovXG5jb25zdCBfQ0xFQU5fUFJPTUlTRSA9ICgoKSA9PiBQcm9taXNlLnJlc29sdmUobnVsbCkpKCk7XG5cbmV4cG9ydCBjb25zdCBlbnVtIEJpbmRpbmdEaXJlY3Rpb24ge1xuICBJbnB1dCxcbiAgT3V0cHV0LFxufVxuXG4vKipcbiAqIFJlZnJlc2hlcyB0aGUgdmlldywgZXhlY3V0aW5nIHRoZSBmb2xsb3dpbmcgc3RlcHMgaW4gdGhhdCBvcmRlcjpcbiAqIHRyaWdnZXJzIGluaXQgaG9va3MsIHJlZnJlc2hlcyBkeW5hbWljIGVtYmVkZGVkIHZpZXdzLCB0cmlnZ2VycyBjb250ZW50IGhvb2tzLCBzZXRzIGhvc3RcbiAqIGJpbmRpbmdzLCByZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cy5cbiAqIE5vdGU6IHZpZXcgaG9va3MgYXJlIHRyaWdnZXJlZCBsYXRlciB3aGVuIGxlYXZpbmcgdGhlIHZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGxWaWV3OiBMVmlldykge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUobFZpZXcpO1xuXG4gIC8vIFRoaXMgbmVlZHMgdG8gYmUgc2V0IGJlZm9yZSBjaGlsZHJlbiBhcmUgcHJvY2Vzc2VkIHRvIHN1cHBvcnQgcmVjdXJzaXZlIGNvbXBvbmVudHNcbiAgdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgPSBmYWxzZTtcblxuICAvLyBSZXNldHRpbmcgdGhlIGJpbmRpbmdJbmRleCBvZiB0aGUgY3VycmVudCBMVmlldyBhcyB0aGUgbmV4dCBzdGVwcyBtYXkgdHJpZ2dlciBjaGFuZ2UgZGV0ZWN0aW9uLlxuICBsVmlld1tCSU5ESU5HX0lOREVYXSA9IHRWaWV3LmJpbmRpbmdTdGFydEluZGV4O1xuXG4gIC8vIElmIHRoaXMgaXMgYSBjcmVhdGlvbiBwYXNzLCB3ZSBzaG91bGQgbm90IGNhbGwgbGlmZWN5Y2xlIGhvb2tzIG9yIGV2YWx1YXRlIGJpbmRpbmdzLlxuICAvLyBUaGlzIHdpbGwgYmUgZG9uZSBpbiB0aGUgdXBkYXRlIHBhc3MuXG4gIGlmICghY3JlYXRpb25Nb2RlKSB7XG4gICAgY29uc3QgY2hlY2tOb0NoYW5nZXNNb2RlID0gZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG5cbiAgICBleGVjdXRlUHJlT3JkZXJIb29rcyhsVmlldywgdFZpZXcsIGNoZWNrTm9DaGFuZ2VzTW9kZSwgdW5kZWZpbmVkKTtcblxuICAgIHJlZnJlc2hEeW5hbWljRW1iZWRkZWRWaWV3cyhsVmlldyk7XG5cbiAgICAvLyBDb250ZW50IHF1ZXJ5IHJlc3VsdHMgbXVzdCBiZSByZWZyZXNoZWQgYmVmb3JlIGNvbnRlbnQgaG9va3MgYXJlIGNhbGxlZC5cbiAgICByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXcsIGxWaWV3KTtcblxuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MobFZpZXcpO1xuICAgIGV4ZWN1dGVIb29rcyhcbiAgICAgICAgbFZpZXcsIHRWaWV3LmNvbnRlbnRIb29rcywgdFZpZXcuY29udGVudENoZWNrSG9va3MsIGNoZWNrTm9DaGFuZ2VzTW9kZSxcbiAgICAgICAgSW5pdFBoYXNlU3RhdGUuQWZ0ZXJDb250ZW50SW5pdEhvb2tzVG9CZVJ1biwgdW5kZWZpbmVkKTtcblxuICAgIHNldEhvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcpO1xuICB9XG5cbiAgLy8gV2UgcmVzb2x2ZSBjb250ZW50IHF1ZXJpZXMgc3BlY2lmaWNhbGx5IG1hcmtlZCBhcyBgc3RhdGljYCBpbiBjcmVhdGlvbiBtb2RlLiBEeW5hbWljXG4gIC8vIGNvbnRlbnQgcXVlcmllcyBhcmUgcmVzb2x2ZWQgZHVyaW5nIGNoYW5nZSBkZXRlY3Rpb24gKGkuZS4gdXBkYXRlIG1vZGUpLCBhZnRlciBlbWJlZGRlZFxuICAvLyB2aWV3cyBhcmUgcmVmcmVzaGVkIChzZWUgYmxvY2sgYWJvdmUpLlxuICBpZiAoY3JlYXRpb25Nb2RlICYmIHRWaWV3LnN0YXRpY0NvbnRlbnRRdWVyaWVzKSB7XG4gICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG4gIH1cblxuICByZWZyZXNoQ2hpbGRDb21wb25lbnRzKHRWaWV3LmNvbXBvbmVudHMpO1xufVxuXG5cbi8qKiBTZXRzIHRoZSBob3N0IGJpbmRpbmdzIGZvciB0aGUgY3VycmVudCB2aWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldEhvc3RCaW5kaW5ncyh0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBzZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIGlmICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG4gICAgICBzZXRCaW5kaW5nUm9vdChiaW5kaW5nUm9vdEluZGV4KTtcbiAgICAgIGxldCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSAtMTtcbiAgICAgIGxldCBjdXJyZW50RWxlbWVudEluZGV4ID0gLTE7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb24gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zW2ldO1xuICAgICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICAgIGlmIChpbnN0cnVjdGlvbiA8PSAwKSB7XG4gICAgICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIG1lYW4gdGhhdCB3ZSBhcmUgc3RhcnRpbmcgbmV3IEVYUEFORE8gYmxvY2sgYW5kIG5lZWQgdG8gdXBkYXRlXG4gICAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgICBjdXJyZW50RWxlbWVudEluZGV4ID0gLWluc3RydWN0aW9uO1xuICAgICAgICAgICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICAgIGNvbnN0IHByb3ZpZGVyQ291bnQgPSAodFZpZXcuZXhwYW5kb0luc3RydWN0aW9uc1srK2ldIGFzIG51bWJlcik7XG4gICAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IElOSkVDVE9SX0JMT09NX1BBUkVOVF9TSVpFICsgcHJvdmlkZXJDb3VudDtcblxuICAgICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gVGhpcyBpcyBlaXRoZXIgdGhlIGluamVjdG9yIHNpemUgKHNvIHRoZSBiaW5kaW5nIHJvb3QgY2FuIHNraXAgb3ZlciBkaXJlY3RpdmVzXG4gICAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgICAgLy8gKHRvIGdldCB0byB0aGUgbmV4dCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpLlxuICAgICAgICAgICAgYmluZGluZ1Jvb3RJbmRleCArPSBpbnN0cnVjdGlvbjtcbiAgICAgICAgICB9XG4gICAgICAgICAgc2V0QmluZGluZ1Jvb3QoYmluZGluZ1Jvb3RJbmRleCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgICAgIGNvbnN0IGhvc3RDdHggPSB1bndyYXBSTm9kZSh2aWV3RGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdKTtcbiAgICAgICAgICAgIGluc3RydWN0aW9uKFJlbmRlckZsYWdzLlVwZGF0ZSwgaG9zdEN0eCwgY3VycmVudEVsZW1lbnRJbmRleCk7XG5cbiAgICAgICAgICAgIC8vIEVhY2ggZGlyZWN0aXZlIGdldHMgYSB1bmlxdWVJZCB2YWx1ZSB0aGF0IGlzIHRoZSBzYW1lIGZvciBib3RoXG4gICAgICAgICAgICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgICAgICAgICAgIC8vIGRpcmVjdGl2ZSB1bmlxdWVJZCBpcyBub3Qgc2V0IGFueXdoZXJlLS1pdCBpcyBqdXN0IGluY3JlbWVudGVkIGJldHdlZW5cbiAgICAgICAgICAgIC8vIGVhY2ggaG9zdEJpbmRpbmdzIGNhbGwgYW5kIGlzIHVzZWZ1bCBmb3IgaGVscGluZyBpbnN0cnVjdGlvbiBjb2RlXG4gICAgICAgICAgICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgICAgICAgICAgIGluY3JlbWVudEFjdGl2ZURpcmVjdGl2ZUlkKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KHNlbGVjdGVkSW5kZXgpO1xuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY29udGVudCBxdWVyaWVzIGZvciBhbGwgZGlyZWN0aXZlcyBpbiB0aGUgZ2l2ZW4gdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBpZiAodFZpZXcuY29udGVudFF1ZXJpZXMgIT0gbnVsbCkge1xuICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KDApO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdFZpZXcuY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMsICdjb250ZW50UXVlcmllcyBmdW5jdGlvbiBzaG91bGQgYmUgZGVmaW5lZCcpO1xuICAgICAgZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzICEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogUmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMgaW4gdGhlIGN1cnJlbnQgdmlldy4gKi9cbmZ1bmN0aW9uIHJlZnJlc2hDaGlsZENvbXBvbmVudHMoY29tcG9uZW50czogbnVtYmVyW10gfCBudWxsKTogdm9pZCB7XG4gIGlmIChjb21wb25lbnRzICE9IG51bGwpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbXBvbmVudFJlZnJlc2goY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgbmF0aXZlIGVsZW1lbnQgZnJvbSBhIHRhZyBuYW1lLCB1c2luZyBhIHJlbmRlcmVyLlxuICogQHBhcmFtIG5hbWUgdGhlIHRhZyBuYW1lXG4gKiBAcGFyYW0gb3ZlcnJpZGRlblJlbmRlcmVyIE9wdGlvbmFsIEEgcmVuZGVyZXIgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgb25lXG4gKiBAcmV0dXJucyB0aGUgZWxlbWVudCBjcmVhdGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50Q3JlYXRlKG5hbWU6IHN0cmluZywgb3ZlcnJpZGRlblJlbmRlcmVyPzogUmVuZGVyZXIzKTogUkVsZW1lbnQge1xuICBsZXQgbmF0aXZlOiBSRWxlbWVudDtcbiAgY29uc3QgcmVuZGVyZXJUb1VzZSA9IG92ZXJyaWRkZW5SZW5kZXJlciB8fCBnZXRMVmlldygpW1JFTkRFUkVSXTtcblxuICBjb25zdCBuYW1lc3BhY2UgPSBnZXROYW1lc3BhY2UoKTtcblxuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXJUb1VzZSkpIHtcbiAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBpZiAobmFtZXNwYWNlID09PSBudWxsKSB7XG4gICAgICBuYXRpdmUgPSByZW5kZXJlclRvVXNlLmNyZWF0ZUVsZW1lbnQobmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgbmFtZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBuYXRpdmU7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTFZpZXc8VD4oXG4gICAgcGFyZW50TFZpZXc6IExWaWV3IHwgbnVsbCwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUIHwgbnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsXG4gICAgaG9zdDogUkVsZW1lbnQgfCBudWxsLCB0SG9zdE5vZGU6IFRWaWV3Tm9kZSB8IFRFbGVtZW50Tm9kZSB8IG51bGwsXG4gICAgcmVuZGVyZXJGYWN0b3J5PzogUmVuZGVyZXJGYWN0b3J5MyB8IG51bGwsIHJlbmRlcmVyPzogUmVuZGVyZXIzIHwgbnVsbCxcbiAgICBzYW5pdGl6ZXI/OiBTYW5pdGl6ZXIgfCBudWxsLCBpbmplY3Rvcj86IEluamVjdG9yIHwgbnVsbCk6IExWaWV3IHtcbiAgY29uc3QgbFZpZXcgPSBuZ0Rldk1vZGUgPyBjbG9uZVRvTFZpZXcodFZpZXcuYmx1ZXByaW50KSA6IHRWaWV3LmJsdWVwcmludC5zbGljZSgpIGFzIExWaWV3O1xuICBsVmlld1tIT1NUXSA9IGhvc3Q7XG4gIGxWaWV3W0ZMQUdTXSA9IGZsYWdzIHwgTFZpZXdGbGFncy5DcmVhdGlvbk1vZGUgfCBMVmlld0ZsYWdzLkF0dGFjaGVkIHwgTFZpZXdGbGFncy5GaXJzdExWaWV3UGFzcztcbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gIGxWaWV3W1BBUkVOVF0gPSBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IHBhcmVudExWaWV3O1xuICBsVmlld1tDT05URVhUXSA9IGNvbnRleHQ7XG4gIGxWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldID0gKHJlbmRlcmVyRmFjdG9yeSB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl9GQUNUT1JZXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJfRkFDVE9SWV0sICdSZW5kZXJlckZhY3RvcnkgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkgITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbU0FOSVRJWkVSXSA9IHNhbml0aXplciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tTQU5JVElaRVJdIHx8IG51bGwgITtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICBsVmlld1tUX0hPU1RdID0gdEhvc3ROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTFZpZXdEZWJ1ZyhsVmlldyk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSB0SG9zdE5vZGUgVGhpcyBpcyBhIGhhY2sgYW5kIHdlIHNob3VsZCBub3QgaGF2ZSB0byBwYXNzIHRoaXMgdmFsdWUgaW4uIEl0IGlzIG9ubHkgdXNlZCB0b1xuICogZGV0ZXJtaW5lIGlmIHRoZSBwYXJlbnQgYmVsb25ncyB0byBhIGRpZmZlcmVudCB0Vmlldy4gSW5zdGVhZCB3ZSBzaG91bGQgbm90IGhhdmUgcGFyZW50VFZpZXdcbiAqIHBvaW50IHRvIFRWaWV3IG90aGVyIHRoZSBjdXJyZW50IG9uZS5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnQsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdEhvc3ROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIG5hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1Q29udGFpbmVyLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRIb3N0Tm9kZTogVE5vZGUgfCBudWxsLCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZyB8IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCk6IFRFbGVtZW50Tm9kZSZUQ29udGFpbmVyTm9kZSZURWxlbWVudENvbnRhaW5lck5vZGUmVFByb2plY3Rpb25Ob2RlJlxuICAgIFRJY3VDb250YWluZXJOb2RlIHtcbiAgLy8gS2VlcCB0aGlzIGZ1bmN0aW9uIHNob3J0LCBzbyB0aGF0IHRoZSBWTSB3aWxsIGlubGluZSBpdC5cbiAgY29uc3QgYWRqdXN0ZWRJbmRleCA9IGluZGV4ICsgSEVBREVSX09GRlNFVDtcbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlIHx8XG4gICAgICBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIHRIb3N0Tm9kZSwgYWRqdXN0ZWRJbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMsIGluZGV4KTtcbiAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUTm9kZUF0SW5kZXgoXG4gICAgdFZpZXc6IFRWaWV3LCB0SG9zdE5vZGU6IFROb2RlIHwgbnVsbCwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsXG4gICAgbmFtZTogc3RyaW5nIHwgbnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzIHwgbnVsbCwgaW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBwYXJlbnQgPVxuICAgICAgaXNQYXJlbnQgPyBwcmV2aW91c09yUGFyZW50VE5vZGUgOiBwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLnBhcmVudDtcbiAgLy8gUGFyZW50cyBjYW5ub3QgY3Jvc3MgY29tcG9uZW50IGJvdW5kYXJpZXMgYmVjYXVzZSBjb21wb25lbnRzIHdpbGwgYmUgdXNlZCBpbiBtdWx0aXBsZSBwbGFjZXMsXG4gIC8vIHNvIGl0J3Mgb25seSBzZXQgaWYgdGhlIHZpZXcgaXMgdGhlIHNhbWUuXG4gIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgcGFyZW50ICE9PSB0SG9zdE5vZGU7XG4gIGNvbnN0IHRQYXJlbnROb2RlID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG4gIGNvbnN0IHROb2RlID0gdFZpZXcuZGF0YVthZGp1c3RlZEluZGV4XSA9XG4gICAgICBjcmVhdGVUTm9kZSh0UGFyZW50Tm9kZSwgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmUgYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGVcbiAgLy8gaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhcyB0aGUgaW5kZXggMSBvciBtb3JlXG4gIGlmIChpbmRleCA9PT0gMCB8fCAhdFZpZXcuZmlyc3RDaGlsZCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICAvLyBOb3cgbGluayBvdXJzZWx2ZXMgaW50byB0aGUgdHJlZS5cbiAgaWYgKHByZXZpb3VzT3JQYXJlbnRUTm9kZSkge1xuICAgIGlmIChpc1BhcmVudCAmJiBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJlxuICAgICAgICAodE5vZGUucGFyZW50ICE9PSBudWxsIHx8IHByZXZpb3VzT3JQYXJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykpIHtcbiAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuY2hpbGQgPSB0Tm9kZTtcbiAgICB9IGVsc2UgaWYgKCFpc1BhcmVudCkge1xuICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduVFZpZXdOb2RlVG9MVmlldyhcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFRWaWV3Tm9kZSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgbGV0IHROb2RlID0gdFZpZXcubm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdFBhcmVudE5vZGUgJiZcbiAgICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0UGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIHRWaWV3Lm5vZGUgPSB0Tm9kZSA9IGNyZWF0ZVROb2RlKFxuICAgICAgICB0UGFyZW50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsICAvL1xuICAgICAgICBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tUX0hPU1RdID0gdE5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgICB2aWV3LnB1c2gobnVsbCk7XG4gICAgfVxuXG4gICAgLy8gV2Ugc2hvdWxkIG9ubHkgaW5jcmVtZW50IHRoZSBleHBhbmRvIHN0YXJ0IGluZGV4IGlmIHRoZXJlIGFyZW4ndCBhbHJlYWR5IGRpcmVjdGl2ZXNcbiAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgaWYgKCF0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCArPSBudW1TbG90c1RvQWxsb2M7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNpbmNlIHdlJ3JlIGFkZGluZyB0aGUgZHluYW1pYyBub2RlcyBpbnRvIHRoZSBleHBhbmRvIHNlY3Rpb24sIHdlIG5lZWQgdG8gbGV0IHRoZSBob3N0XG4gICAgICAvLyBiaW5kaW5ncyBrbm93IHRoYXQgdGhleSBzaG91bGQgc2tpcCB4IHNsb3RzXG4gICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogVXNlZCBmb3IgY3JlYXRpbmcgdGhlIExWaWV3Tm9kZSBvZiBhIGR5bmFtaWMgZW1iZWRkZWQgdmlldyxcbiAqIGVpdGhlciB0aHJvdWdoIFZpZXdDb250YWluZXJSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkgb3IgVGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KCkuXG4gKiBTdWNoIGxWaWV3Tm9kZSB3aWxsIHRoZW4gYmUgcmVuZGVyZXIgd2l0aCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKCkgKHNlZSBiZWxvdykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgY29udGV4dDogVCwgZGVjbGFyYXRpb25WaWV3OiBMVmlldywgcXVlcmllczogTFF1ZXJpZXMgfCBudWxsLFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgX2lzUGFyZW50ID0gZ2V0SXNQYXJlbnQoKTtcbiAgY29uc3QgX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhLCB0cnVlKTtcblxuICBjb25zdCBsVmlldyA9IGNyZWF0ZUxWaWV3KGRlY2xhcmF0aW9uVmlldywgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG51bGwsIG51bGwpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgYXNzaWduVFZpZXdOb2RlVG9MVmlldyh0VmlldywgbnVsbCwgLTEsIGxWaWV3KTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5ub2RlICEuaW5qZWN0b3JJbmRleCA9IGluamVjdG9ySW5kZXg7XG4gIH1cblxuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSwgX2lzUGFyZW50KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIFVzZWQgZm9yIHJlbmRlcmluZyBlbWJlZGRlZCB2aWV3cyAoZS5nLiBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzKVxuICpcbiAqIER5bmFtaWNhbGx5IGNyZWF0ZWQgdmlld3MgbXVzdCBzdG9yZS9yZXRyaWV2ZSB0aGVpciBUVmlld3MgZGlmZmVyZW50bHkgZnJvbSBjb21wb25lbnQgdmlld3NcbiAqIGJlY2F1c2UgdGhlaXIgdGVtcGxhdGUgZnVuY3Rpb25zIGFyZSBuZXN0ZWQgaW4gdGhlIHRlbXBsYXRlIGZ1bmN0aW9ucyBvZiB0aGVpciBob3N0cywgY3JlYXRpbmdcbiAqIGNsb3N1cmVzLiBJZiB0aGVpciBob3N0IHRlbXBsYXRlIGhhcHBlbnMgdG8gYmUgYW4gZW1iZWRkZWQgdGVtcGxhdGUgaW4gYSBsb29wIChlLmcuIG5nRm9yXG4gKiBpbnNpZGVcbiAqIGFuIG5nRm9yKSwgdGhlIG5lc3Rpbmcgd291bGQgbWVhbiB3ZSdkIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgc28gd2VcbiAqIGNhbid0IHN0b3JlIFRWaWV3cyBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gaXRzZWxmIChhcyB3ZSBkbyBmb3IgY29tcHMpLiBJbnN0ZWFkLCB3ZSBzdG9yZSB0aGVcbiAqIFRWaWV3IGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG9uIHRoZWlyIGhvc3QgVE5vZGUsIHdoaWNoIG9ubHkgaGFzIG9uZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckVtYmVkZGVkVGVtcGxhdGU8VD4odmlld1RvUmVuZGVyOiBMVmlldywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3O1xuICBpZiAodmlld1RvUmVuZGVyW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSB7XG4gICAgLy8gVGhpcyBpcyBhIHJvb3QgdmlldyBpbnNpZGUgdGhlIHZpZXcgdHJlZVxuICAgIHRpY2tSb290Q29udGV4dChnZXRSb290Q29udGV4dCh2aWV3VG9SZW5kZXIpKTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKG51bGwgISwgdHJ1ZSk7XG5cbiAgICAgIG9sZFZpZXcgPSBlbnRlclZpZXcodmlld1RvUmVuZGVyLCB2aWV3VG9SZW5kZXJbVF9IT1NUXSk7XG4gICAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKHZpZXdUb1JlbmRlcik7XG4gICAgICBleGVjdXRlVGVtcGxhdGUodmlld1RvUmVuZGVyLCB0Vmlldy50ZW1wbGF0ZSAhLCBnZXRSZW5kZXJGbGFncyh2aWV3VG9SZW5kZXIpLCBjb250ZXh0KTtcblxuICAgICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEpO1xuICAgICAgc2V0UHJldmlvdXNPclBhcmVudFROb2RlKF9wcmV2aW91c09yUGFyZW50VE5vZGUsIF9pc1BhcmVudCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlPFQ+KFxuICAgIGhvc3RWaWV3OiBMVmlldywgY29udGV4dDogVCwgdGVtcGxhdGVGbj86IENvbXBvbmVudFRlbXBsYXRlPFQ+KSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGhvc3RWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuICBjb25zdCBvbGRWaWV3ID0gZW50ZXJWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tUX0hPU1RdKTtcbiAgY29uc3Qgbm9ybWFsRXhlY3V0aW9uUGF0aCA9ICFnZXRDaGVja05vQ2hhbmdlc01vZGUoKTtcbiAgY29uc3QgY3JlYXRpb25Nb2RlSXNBY3RpdmUgPSBpc0NyZWF0aW9uTW9kZShob3N0Vmlldyk7XG4gIHRyeSB7XG4gICAgaWYgKG5vcm1hbEV4ZWN1dGlvblBhdGggJiYgIWNyZWF0aW9uTW9kZUlzQWN0aXZlICYmIHJlbmRlcmVyRmFjdG9yeS5iZWdpbikge1xuICAgICAgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG4gICAgfVxuXG4gICAgaWYgKGNyZWF0aW9uTW9kZUlzQWN0aXZlKSB7XG4gICAgICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICAgIHRlbXBsYXRlRm4gJiYgZXhlY3V0ZVRlbXBsYXRlKGhvc3RWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAgIGhvc3RWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MoaG9zdFZpZXcpO1xuICAgIHRlbXBsYXRlRm4gJiYgZXhlY3V0ZVRlbXBsYXRlKGhvc3RWaWV3LCB0ZW1wbGF0ZUZuLCBSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVGVtcGxhdGU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIMm1ybVuYW1lc3BhY2VIVE1MKCk7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICB0cnkge1xuICAgIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xuICAgIGlmIChyZiAmIFJlbmRlckZsYWdzLlVwZGF0ZSkge1xuICAgICAgLy8gV2hlbiB3ZSdyZSB1cGRhdGluZywgaGF2ZSBhbiBpbmhlcmVudCDJtcm1c2VsZWN0KDApIHNvIHdlIGRvbid0IGhhdmUgdG8gZ2VuZXJhdGUgdGhhdFxuICAgICAgLy8gaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrc1xuICAgICAgc2VsZWN0SW50ZXJuYWwobFZpZXcsIDApO1xuICAgIH1cbiAgICB0ZW1wbGF0ZUZuKHJmLCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIFVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5LlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXcpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIDogUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIEFwcHJvcHJpYXRlbHkgc2V0cyBgc3R5bGluZ1RlbXBsYXRlYCBvbiBhIFROb2RlXG4gKlxuICogRG9lcyBub3QgYXBwbHkgc3R5bGVzIHRvIERPTSBub2Rlc1xuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSB3aG9zZSBgc3R5bGluZ1RlbXBsYXRlYCB0byBzZXRcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlIGFycmF5IHNvdXJjZSB0byBzZXQgdGhlIGF0dHJpYnV0ZXMgZnJvbVxuICogQHBhcmFtIGF0dHJzU3RhcnRJbmRleCBPcHRpb25hbCBzdGFydCBpbmRleCB0byBzdGFydCBwcm9jZXNzaW5nIHRoZSBgYXR0cnNgIGZyb21cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGVTdHlsaW5nVGVtcGxhdGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgYXR0cnNTdGFydEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmICF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICBjb25zdCBzdHlsaW5nQXR0cnNTdGFydEluZGV4ID0gYXR0cnNTdHlsaW5nSW5kZXhPZihhdHRycywgYXR0cnNTdGFydEluZGV4KTtcbiAgICBpZiAoc3R5bGluZ0F0dHJzU3RhcnRJbmRleCA+PSAwKSB7XG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gVE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgICAgICB0VmlldywgbFZpZXcsIGZpbmREaXJlY3RpdmVNYXRjaGVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKSxcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gIH1cbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG4gIHNldEFjdGl2ZUhvc3RFbGVtZW50KG51bGwpO1xufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmZ1bmN0aW9uIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShcbiAgICB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSwgbG9jYWxSZWZFeHRyYWN0b3I6IExvY2FsUmVmRXh0cmFjdG9yKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcykge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIHJldHVybiBkZWYudFZpZXcgfHwgKGRlZi50VmlldyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgLTEsIGRlZi50ZW1wbGF0ZSwgZGVmLmNvbnN0cywgZGVmLnZhcnMsIGRlZi5kaXJlY3RpdmVEZWZzLCBkZWYucGlwZURlZnMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkZWYudmlld1F1ZXJ5LCBkZWYuc2NoZW1hcykpO1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnwgbnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXSB8IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IG5nRGV2TW9kZSA/XG4gICAgICBuZXcgVFZpZXdDb25zdHJ1Y3RvcihcbiAgICAgICAgICAgICB2aWV3SW5kZXgsICAgLy8gaWQ6IG51bWJlcixcbiAgICAgICAgICAgICBibHVlcHJpbnQsICAgLy8gYmx1ZXByaW50OiBMVmlldyxcbiAgICAgICAgICAgICB0ZW1wbGF0ZUZuLCAgLy8gdGVtcGxhdGU6IENvbXBvbmVudFRlbXBsYXRlPHt9PnxudWxsLFxuICAgICAgICAgICAgIHZpZXdRdWVyeSwgICAvLyB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248e30+fG51bGwsXG4gICAgICAgICAgICAgbnVsbCAhLCAgICAgIC8vIG5vZGU6IFRWaWV3Tm9kZXxURWxlbWVudE5vZGV8bnVsbCxcbiAgICAgICAgICAgICBjbG9uZVRvVFZpZXdEYXRhKGJsdWVwcmludCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksICAvLyBkYXRhOiBURGF0YSxcbiAgICAgICAgICAgICBiaW5kaW5nU3RhcnRJbmRleCwgIC8vIGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgaW5pdGlhbFZpZXdMZW5ndGgsICAvLyB2aWV3UXVlcnlTdGFydEluZGV4OiBudW1iZXIsXG4gICAgICAgICAgICAgaW5pdGlhbFZpZXdMZW5ndGgsICAvLyBleHBhbmRvU3RhcnRJbmRleDogbnVtYmVyLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gZXhwYW5kb0luc3RydWN0aW9uczogRXhwYW5kb0luc3RydWN0aW9uc3xudWxsLFxuICAgICAgICAgICAgIHRydWUsICAgICAgICAgICAgICAgLy8gZmlyc3RUZW1wbGF0ZVBhc3M6IGJvb2xlYW4sXG4gICAgICAgICAgICAgZmFsc2UsICAgICAgICAgICAgICAvLyBzdGF0aWNWaWV3UXVlcmllczogYm9vbGVhbixcbiAgICAgICAgICAgICBmYWxzZSwgICAgICAgICAgICAgIC8vIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBib29sZWFuLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gcHJlT3JkZXJIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIHByZU9yZGVyQ2hlY2tIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRIb29rczogSG9va0RhdGF8bnVsbCxcbiAgICAgICAgICAgICBudWxsLCAgICAgICAgICAgICAgIC8vIGNvbnRlbnRDaGVja0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0hvb2tzOiBIb29rRGF0YXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gdmlld0NoZWNrSG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBkZXN0cm95SG9va3M6IEhvb2tEYXRhfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjbGVhbnVwOiBhbnlbXXxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgLy8gY29udGVudFF1ZXJpZXM6IG51bWJlcltdfG51bGwsXG4gICAgICAgICAgICAgbnVsbCwgICAgICAgICAgICAgICAvLyBjb21wb25lbnRzOiBudW1iZXJbXXxudWxsLFxuICAgICAgICAgICAgIHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID9cbiAgICAgICAgICAgICAgICAgZGlyZWN0aXZlcygpIDpcbiAgICAgICAgICAgICAgICAgZGlyZWN0aXZlcywgIC8vIGRpcmVjdGl2ZVJlZ2lzdHJ5OiBEaXJlY3RpdmVEZWZMaXN0fG51bGwsXG4gICAgICAgICAgICAgdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLCAgLy8gcGlwZVJlZ2lzdHJ5OiBQaXBlRGVmTGlzdHxudWxsLFxuICAgICAgICAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGZpcnN0Q2hpbGQ6IFROb2RlfG51bGwsXG4gICAgICAgICAgICAgc2NoZW1hcywgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgICAgICAgICAgICkgOlxuICAgICAge1xuICAgICAgICBpZDogdmlld0luZGV4LFxuICAgICAgICBibHVlcHJpbnQ6IGJsdWVwcmludCxcbiAgICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgICAgICBub2RlOiBudWxsICEsXG4gICAgICAgIGRhdGE6IGJsdWVwcmludC5zbGljZSgpLmZpbGwobnVsbCwgYmluZGluZ1N0YXJ0SW5kZXgpLFxuICAgICAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgIHZpZXdRdWVyeVN0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgICAgICBleHBhbmRvU3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgICAgIGZpcnN0VGVtcGxhdGVQYXNzOiB0cnVlLFxuICAgICAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICAgICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICAgICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgICAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgICAgIGNsZWFudXA6IG51bGwsXG4gICAgICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgICAgICBjb21wb25lbnRzOiBudWxsLFxuICAgICAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgICAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICAgICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICAgICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICAgIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV3IChuZ0Rldk1vZGUgPyBMVmlld0JsdWVwcmludCAhIDogQXJyYXkpKGluaXRpYWxWaWV3TGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwobnVsbCwgMCwgYmluZGluZ1N0YXJ0SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChOT19DSEFOR0UsIGJpbmRpbmdTdGFydEluZGV4KSBhcyBMVmlldztcbiAgYmx1ZXByaW50W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJldHVybiBibHVlcHJpbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbn1cblxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIGVsZW1lbnRPclNlbGVjdG9yIFJlbmRlciBlbGVtZW50IG9yIENTUyBzZWxlY3RvciB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICBmYWN0b3J5OiBSZW5kZXJlckZhY3RvcnkzLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnQgfCBzdHJpbmcpOiBSRWxlbWVudHxudWxsIHtcbiAgY29uc3QgZGVmYXVsdFJlbmRlcmVyID0gZmFjdG9yeS5jcmVhdGVSZW5kZXJlcihudWxsLCBudWxsKTtcbiAgY29uc3Qgck5vZGUgPSB0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnID9cbiAgICAgIChpc1Byb2NlZHVyYWxSZW5kZXJlcihkZWZhdWx0UmVuZGVyZXIpID9cbiAgICAgICAgICAgZGVmYXVsdFJlbmRlcmVyLnNlbGVjdFJvb3RFbGVtZW50KGVsZW1lbnRPclNlbGVjdG9yKSA6XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5xdWVyeVNlbGVjdG9yKGVsZW1lbnRPclNlbGVjdG9yKSkgOlxuICAgICAgZWxlbWVudE9yU2VsZWN0b3I7XG4gIGlmIChuZ0Rldk1vZGUgJiYgIXJOb2RlKSB7XG4gICAgaWYgKHR5cGVvZiBlbGVtZW50T3JTZWxlY3RvciA9PT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IGNyZWF0ZUVycm9yKCdIb3N0IG5vZGUgd2l0aCBzZWxlY3RvciBub3QgZm91bmQ6JywgZWxlbWVudE9yU2VsZWN0b3IpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIGlzIHJlcXVpcmVkOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHJOb2RlO1xufVxuXG4vKipcbiAqIFNhdmVzIGNvbnRleHQgZm9yIHRoaXMgY2xlYW51cCBmdW5jdGlvbiBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzLlxuICpcbiAqIE9uIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCBzYXZlcyBpbiBUVmlldzpcbiAqIC0gQ2xlYW51cCBmdW5jdGlvblxuICogLSBJbmRleCBvZiBjb250ZXh0IHdlIGp1c3Qgc2F2ZWQgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlc1xuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwV2l0aENvbnRleHQobFZpZXc6IExWaWV3LCBjb250ZXh0OiBhbnksIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgY29uc3QgbENsZWFudXAgPSBnZXRDbGVhbnVwKGxWaWV3KTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKGxWaWV3KS5wdXNoKGNsZWFudXBGbiwgbENsZWFudXAubGVuZ3RoIC0gMSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTYXZlcyB0aGUgY2xlYW51cCBmdW5jdGlvbiBpdHNlbGYgaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSBmb3IgZnVuY3Rpb25zIHRoYXQgYXJlIHdyYXBwZWQgd2l0aCB0aGVpciBjb250ZXh0cywgbGlrZSBpbiByZW5kZXJlcjJcbiAqIGxpc3RlbmVycy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluZGV4IG9mIHRoZSBjbGVhbnVwIGZ1bmN0aW9uIGlzIHNhdmVkIGluIFRWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVDbGVhbnVwRm4odmlldzogTFZpZXcsIGNsZWFudXBGbjogRnVuY3Rpb24pOiB2b2lkIHtcbiAgZ2V0Q2xlYW51cCh2aWV3KS5wdXNoKGNsZWFudXBGbik7XG5cbiAgaWYgKHZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZ2V0VFZpZXdDbGVhbnVwKHZpZXcpLnB1c2godmlld1tDTEVBTlVQXSAhLmxlbmd0aCAtIDEsIG51bGwpO1xuICB9XG59XG5cbi8vIFRPRE86IFJlbW92ZSB0aGlzIHdoZW4gdGhlIGlzc3VlIGlzIHJlc29sdmVkLlxuLyoqXG4gKiBUc2lja2xlIGhhcyBhIGJ1ZyB3aGVyZSBpdCBjcmVhdGVzIGFuIGluZmluaXRlIGxvb3AgZm9yIGEgZnVuY3Rpb24gcmV0dXJuaW5nIGl0c2VsZi5cbiAqIFRoaXMgaXMgYSB0ZW1wb3JhcnkgdHlwZSB0aGF0IHdpbGwgYmUgcmVtb3ZlZCB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hbmd1bGFyL3RzaWNrbGUvaXNzdWVzLzEwMDkpXG4gKi9cbmV4cG9ydCB0eXBlIFRzaWNrbGVJc3N1ZTEwMDkgPSBhbnk7XG5cbi8qKlxuICogQ29uc3RydWN0cyBhIFROb2RlIG9iamVjdCBmcm9tIHRoZSBhcmd1bWVudHMuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIHR5cGUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhZGp1c3RlZEluZGV4IFRoZSBpbmRleCBvZiB0aGUgVE5vZGUgaW4gVFZpZXcuZGF0YSwgYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVRcbiAqIEBwYXJhbSB0YWdOYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgbm9kZVxuICogQHBhcmFtIGF0dHJzIFRoZSBhdHRyaWJ1dGVzIGRlZmluZWQgb24gdGhpcyBub2RlXG4gKiBAcGFyYW0gdFZpZXdzIEFueSBUVmlld3MgYXR0YWNoZWQgdG8gdGhpcyBub2RlXG4gKiBAcmV0dXJucyB0aGUgVE5vZGUgb2JqZWN0XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0UGFyZW50OiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsIHR5cGU6IFROb2RlVHlwZSwgYWRqdXN0ZWRJbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZyB8IG51bGwsIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudE5vZGUrKztcbiAgcmV0dXJuIHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGluZGV4OiBhZGp1c3RlZEluZGV4LFxuICAgIGluamVjdG9ySW5kZXg6IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMSxcbiAgICBkaXJlY3RpdmVTdGFydDogLTEsXG4gICAgZGlyZWN0aXZlRW5kOiAtMSxcbiAgICBwcm9wZXJ0eU1ldGFkYXRhU3RhcnRJbmRleDogLTEsXG4gICAgcHJvcGVydHlNZXRhZGF0YUVuZEluZGV4OiAtMSxcbiAgICBmbGFnczogMCxcbiAgICBwcm92aWRlckluZGV4ZXM6IDAsXG4gICAgdGFnTmFtZTogdGFnTmFtZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiB1bmRlZmluZWQsXG4gICAgb3V0cHV0czogdW5kZWZpbmVkLFxuICAgIHRWaWV3czogbnVsbCxcbiAgICBuZXh0OiBudWxsLFxuICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBzdHlsaW5nVGVtcGxhdGU6IG51bGwsXG4gICAgcHJvamVjdGlvbjogbnVsbCxcbiAgICBvbkVsZW1lbnRDcmVhdGlvbkZuczogbnVsbCxcbiAgICAvLyBUT0RPIChtYXRza28pOiByZW5hbWUgdGhpcyB0byBgc3R5bGVzYCBvbmNlIHRoZSBvbGQgc3R5bGluZyBpbXBsIGlzIGdvbmVcbiAgICBuZXdTdHlsZXM6IG51bGwsXG4gICAgLy8gVE9ETyAobWF0c2tvKTogcmVuYW1lIHRoaXMgdG8gYGNsYXNzZXNgIG9uY2UgdGhlIG9sZCBzdHlsaW5nIGltcGwgaXMgZ29uZVxuICAgIG5ld0NsYXNzZXM6IG51bGwsXG4gIH07XG59XG5cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZVxuICogQHBhcmFtIGRpcmVjdGlvbiB3aGV0aGVyIHRvIGNvbnNpZGVyIGlucHV0cyBvciBvdXRwdXRzXG4gKiBAcmV0dXJucyBQcm9wZXJ0eUFsaWFzZXN8bnVsbCBhZ2dyZWdhdGUgb2YgYWxsIHByb3BlcnRpZXMgaWYgYW55LCBgbnVsbGAgb3RoZXJ3aXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZTogVE5vZGUsIGRpcmVjdGlvbjogQmluZGluZ0RpcmVjdGlvbik6IFByb3BlcnR5QWxpYXNlc3xcbiAgICBudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBnZXRMVmlldygpW1RWSUVXXTtcbiAgbGV0IHByb3BTdG9yZTogUHJvcGVydHlBbGlhc2VzfG51bGwgPSBudWxsO1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgaWYgKGVuZCA+IHN0YXJ0KSB7XG4gICAgY29uc3QgaXNJbnB1dCA9IGRpcmVjdGlvbiA9PT0gQmluZGluZ0RpcmVjdGlvbi5JbnB1dDtcbiAgICBjb25zdCBkZWZzID0gdFZpZXcuZGF0YTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgcHJvcGVydHlBbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9ID1cbiAgICAgICAgICBpc0lucHV0ID8gZGlyZWN0aXZlRGVmLmlucHV0cyA6IGRpcmVjdGl2ZURlZi5vdXRwdXRzO1xuICAgICAgZm9yIChsZXQgcHVibGljTmFtZSBpbiBwcm9wZXJ0eUFsaWFzTWFwKSB7XG4gICAgICAgIGlmIChwcm9wZXJ0eUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgICAgcHJvcFN0b3JlID0gcHJvcFN0b3JlIHx8IHt9O1xuICAgICAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IHByb3BlcnR5QWxpYXNNYXBbcHVibGljTmFtZV07XG4gICAgICAgICAgY29uc3QgaGFzUHJvcGVydHkgPSBwcm9wU3RvcmUuaGFzT3duUHJvcGVydHkocHVibGljTmFtZSk7XG4gICAgICAgICAgaGFzUHJvcGVydHkgPyBwcm9wU3RvcmVbcHVibGljTmFtZV0ucHVzaChpLCBwdWJsaWNOYW1lLCBpbnRlcm5hbE5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgIChwcm9wU3RvcmVbcHVibGljTmFtZV0gPSBbaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lXSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHByb3BTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqIE5vdGU6IHRoaXMgbWFwcGluZyBoYXMgdG8gYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIGVxdWFsbHkgbmFtZWQgbWFwcGluZyBpbiB0aGUgdGVtcGxhdGVcbiAqIHR5cGUtY2hlY2tpbmcgbWFjaGluZXJ5IG9mIG5ndHNjLlxuICovXG5jb25zdCBBVFRSX1RPX1BST1A6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgJ2NsYXNzJzogJ2NsYXNzTmFtZScsXG4gICdmb3InOiAnaHRtbEZvcicsXG4gICdmb3JtYWN0aW9uJzogJ2Zvcm1BY3Rpb24nLFxuICAnaW5uZXJIdG1sJzogJ2lubmVySFRNTCcsXG4gICdyZWFkb25seSc6ICdyZWFkT25seScsXG4gICd0YWJpbmRleCc6ICd0YWJJbmRleCcsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCwgbmF0aXZlT25seT86IGJvb2xlYW4sXG4gICAgbG9hZFJlbmRlcmVyRm4/OiAoKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSA9PiBSZW5kZXJlcjMpIHwgbnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGxldCBpbnB1dERhdGE6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIChpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpKSAmJlxuICAgICAgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBkYXRhVmFsdWUgaXMgYW4gYXJyYXkgY29udGFpbmluZyBydW50aW1lIGlucHV0IG9yIG91dHB1dCBuYW1lcyBmb3IgdGhlIGRpcmVjdGl2ZXM6XG4gICAgICAgICAqIGkrMDogZGlyZWN0aXZlIGluc3RhbmNlIGluZGV4XG4gICAgICAgICAqIGkrMTogcHVibGljTmFtZVxuICAgICAgICAgKiBpKzI6IHByaXZhdGVOYW1lXG4gICAgICAgICAqXG4gICAgICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgICAgICogd2Ugd2FudCB0byBzZXQgdGhlIHJlZmxlY3RlZCBwcm9wZXJ0eSB3aXRoIHRoZSBwcml2YXRlTmFtZTogZGF0YVZhbHVlW2krMl1cbiAgICAgICAgICovXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAzKSB7XG4gICAgICAgICAgc2V0TmdSZWZsZWN0UHJvcGVydHkobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZVtpICsgMl0gYXMgc3RyaW5nLCB2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBwcm9wTmFtZSA9IEFUVFJfVE9fUFJPUFtwcm9wTmFtZV0gfHwgcHJvcE5hbWU7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHByb3BOYW1lLCB0Tm9kZSk7XG4gICAgICBuZ0Rldk1vZGUucmVuZGVyZXJTZXRQcm9wZXJ0eSsrO1xuICAgIH1cblxuICAgIHNhdmVQcm9wZXJ0eURlYnVnRGF0YSh0Tm9kZSwgbFZpZXcsIHByb3BOYW1lLCBsVmlld1tUVklFV10uZGF0YSwgbmF0aXZlT25seSk7XG5cbiAgICBjb25zdCByZW5kZXJlciA9IGxvYWRSZW5kZXJlckZuID8gbG9hZFJlbmRlcmVyRm4odE5vZGUsIGxWaWV3KSA6IGxWaWV3W1JFTkRFUkVSXTtcbiAgICAvLyBJdCBpcyBhc3N1bWVkIHRoYXQgdGhlIHNhbml0aXplciBpcyBvbmx5IGFkZGVkIHdoZW4gdGhlIGNvbXBpbGVyIGRldGVybWluZXMgdGhhdCB0aGVcbiAgICAvLyBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXMobFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldE5nUmVmbGVjdFByb3BlcnR5KFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnQgfCBSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5yZW1vdmVBdHRyaWJ1dGUoYXR0ck5hbWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikgP1xuICAgICAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKSA6XG4gICAgICAgICAgKGVsZW1lbnQgYXMgUkVsZW1lbnQpLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgZGVidWdWYWx1ZSk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID0gYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gO1xuICAgIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICAoZWxlbWVudCBhcyBSQ29tbWVudCkudGV4dENvbnRlbnQgPSB0ZXh0Q29udGVudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsaWRhdGVBZ2FpbnN0VW5rbm93blByb3BlcnRpZXMoXG4gICAgaG9zdFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudCB8IFJDb21tZW50LCBwcm9wTmFtZTogc3RyaW5nLCB0Tm9kZTogVE5vZGUpIHtcbiAgLy8gSWYgdGhlIHRhZyBtYXRjaGVzIGFueSBvZiB0aGUgc2NoZW1hcyB3ZSBzaG91bGRuJ3QgdGhyb3cuXG4gIGlmIChtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gSWYgcHJvcCBpcyBub3QgYSBrbm93biBwcm9wZXJ0eSBvZiB0aGUgSFRNTCBlbGVtZW50Li4uXG4gIGlmICghKHByb3BOYW1lIGluIGVsZW1lbnQpICYmXG4gICAgICAvLyBhbmQgd2UgYXJlIGluIGEgYnJvd3NlciBjb250ZXh0Li4uICh3ZWIgd29ya2VyIG5vZGVzIHNob3VsZCBiZSBza2lwcGVkKVxuICAgICAgdHlwZW9mIE5vZGUgPT09ICdmdW5jdGlvbicgJiYgZWxlbWVudCBpbnN0YW5jZW9mIE5vZGUgJiZcbiAgICAgIC8vIGFuZCBpc24ndCBhIHN5bnRoZXRpYyBhbmltYXRpb24gcHJvcGVydHkuLi5cbiAgICAgIHByb3BOYW1lWzBdICE9PSBBTklNQVRJT05fUFJPUF9QUkVGSVgpIHtcbiAgICAvLyAuLi4gaXQgaXMgcHJvYmFibHkgYSB1c2VyIGVycm9yIGFuZCB3ZSBzaG91bGQgdGhyb3cuXG4gICAgdGhyb3cgY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWUsIHROb2RlKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBtYXRjaGluZ1NjaGVtYXMoaG9zdFZpZXc6IExWaWV3LCB0YWdOYW1lOiBzdHJpbmcgfCBudWxsKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNjaGVtYXMgPSBob3N0Vmlld1tUVklFV10uc2NoZW1hcztcblxuICBpZiAoc2NoZW1hcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2NoZW1hcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3Qgc2NoZW1hID0gc2NoZW1hc1tpXTtcbiAgICAgIGlmIChzY2hlbWEgPT09IE5PX0VSUk9SU19TQ0hFTUEgfHxcbiAgICAgICAgICBzY2hlbWEgPT09IENVU1RPTV9FTEVNRU5UU19TQ0hFTUEgJiYgdGFnTmFtZSAmJiB0YWdOYW1lLmluZGV4T2YoJy0nKSA+IC0xKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4qIFN0b3JlcyBkZWJ1Z2dpbmcgZGF0YSBmb3IgdGhpcyBwcm9wZXJ0eSBiaW5kaW5nIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3MuXG4qIFRoaXMgZW5hYmxlcyBmZWF0dXJlcyBsaWtlIERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzLlxuKi9cbmZ1bmN0aW9uIHNhdmVQcm9wZXJ0eURlYnVnRGF0YShcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgcHJvcE5hbWU6IHN0cmluZywgdERhdGE6IFREYXRhLFxuICAgIG5hdGl2ZU9ubHk6IGJvb2xlYW4gfCB1bmRlZmluZWQpOiB2b2lkIHtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcblxuICAvLyBCaW5kL2ludGVycG9sYXRpb24gZnVuY3Rpb25zIHNhdmUgYmluZGluZyBtZXRhZGF0YSBpbiB0aGUgbGFzdCBiaW5kaW5nIGluZGV4LFxuICAvLyBidXQgbGVhdmUgdGhlIHByb3BlcnR5IG5hbWUgYmxhbmsuIElmIHRoZSBpbnRlcnBvbGF0aW9uIGRlbGltaXRlciBpcyBhdCB0aGUgMFxuICAvLyBpbmRleCwgd2Uga25vdyB0aGF0IHRoaXMgaXMgb3VyIGZpcnN0IHBhc3MgYW5kIHRoZSBwcm9wZXJ0eSBuYW1lIHN0aWxsIG5lZWRzIHRvXG4gIC8vIGJlIHNldC5cbiAgY29uc3QgYmluZGluZ01ldGFkYXRhID0gdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gYXMgc3RyaW5nO1xuICBpZiAoYmluZGluZ01ldGFkYXRhWzBdID09IElOVEVSUE9MQVRJT05fREVMSU1JVEVSKSB7XG4gICAgdERhdGFbbGFzdEJpbmRpbmdJbmRleF0gPSBwcm9wTmFtZSArIGJpbmRpbmdNZXRhZGF0YTtcblxuICAgIC8vIFdlIGRvbid0IHdhbnQgdG8gc3RvcmUgaW5kaWNlcyBmb3IgaG9zdCBiaW5kaW5ncyBiZWNhdXNlIHRoZXkgYXJlIHN0b3JlZCBpbiBhXG4gICAgLy8gZGlmZmVyZW50IHBhcnQgb2YgTFZpZXcgKHRoZSBleHBhbmRvIHNlY3Rpb24pLlxuICAgIGlmICghbmF0aXZlT25seSkge1xuICAgICAgaWYgKHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID09IC0xKSB7XG4gICAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFTdGFydEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleDtcbiAgICAgIH1cbiAgICAgIHROb2RlLnByb3BlcnR5TWV0YWRhdGFFbmRJbmRleCA9IGxhc3RCaW5kaW5nSW5kZXggKyAxO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQ3JlYXRlcyBhbiBlcnJvciB0aGF0IHNob3VsZCBiZSB0aHJvd24gd2hlbiBlbmNvdW50ZXJpbmcgYW4gdW5rbm93biBwcm9wZXJ0eSBvbiBhbiBlbGVtZW50LlxuKiBAcGFyYW0gcHJvcE5hbWUgTmFtZSBvZiB0aGUgaW52YWxpZCBwcm9wZXJ0eS5cbiogQHBhcmFtIHROb2RlIE5vZGUgb24gd2hpY2ggd2UgZW5jb3VudGVyZWQgdGhlIGVycm9yLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZVVua25vd25Qcm9wZXJ0eUVycm9yKHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSk6IEVycm9yIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihcbiAgICAgIGBUZW1wbGF0ZSBlcnJvcjogQ2FuJ3QgYmluZCB0byAnJHtwcm9wTmFtZX0nIHNpbmNlIGl0IGlzbid0IGEga25vd24gcHJvcGVydHkgb2YgJyR7dE5vZGUudGFnTmFtZX0nLmApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGEgcm9vdCBjb21wb25lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW50aWF0ZVJvb3RDb21wb25lbnQ8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogVCB7XG4gIGNvbnN0IHJvb3RUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKHRWaWV3LCByb290VE5vZGUsIDEpO1xuICAgIGJhc2VSZXNvbHZlRGlyZWN0aXZlKHRWaWV3LCB2aWV3RGF0YSwgZGVmLCBkZWYuZmFjdG9yeSk7XG4gIH1cbiAgY29uc3QgZGlyZWN0aXZlID1cbiAgICAgIGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIHZpZXdEYXRhLCB2aWV3RGF0YS5sZW5ndGggLSAxLCByb290VE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCByb290VE5vZGUsIGRpcmVjdGl2ZSk7XG4gIHJldHVybiBkaXJlY3RpdmU7XG59XG5cbi8qKlxuICogUmVzb2x2ZSB0aGUgbWF0Y2hlZCBkaXJlY3RpdmVzIG9uIGEgbm9kZS5cbiAqL1xuZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZjxhbnk+W10gfCBudWxsLCB0Tm9kZTogVE5vZGUsXG4gICAgbG9jYWxSZWZzOiBzdHJpbmdbXSB8IG51bGwpOiB2b2lkIHtcbiAgLy8gUGxlYXNlIG1ha2Ugc3VyZSB0byBoYXZlIGV4cGxpY2l0IHR5cGUgZm9yIGBleHBvcnRzTWFwYC4gSW5mZXJyZWQgdHlwZSB0cmlnZ2VycyBidWcgaW5cbiAgLy8gdHNpY2tsZS5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnc2hvdWxkIHJ1biBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzIG9ubHknKTtcbiAgY29uc3QgZXhwb3J0c01hcDogKHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkgPSBsb2NhbFJlZnMgPyB7Jyc6IC0xfSA6IG51bGw7XG4gIGlmIChkaXJlY3RpdmVzKSB7XG4gICAgaW5pdE5vZGVGbGFncyh0Tm9kZSwgdFZpZXcuZGF0YS5sZW5ndGgsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICAvLyBXaGVuIHRoZSBzYW1lIHRva2VuIGlzIHByb3ZpZGVkIGJ5IHNldmVyYWwgZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBub2RlLCBzb21lIHJ1bGVzIGFwcGx5IGluXG4gICAgLy8gdGhlIHZpZXdFbmdpbmU6XG4gICAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgICAvLyAtIHRoZSBsYXN0IGRpcmVjdGl2ZSBpbiBOZ01vZHVsZS5kZWNsYXJhdGlvbnMgaGFzIHByaW9yaXR5IG92ZXIgdGhlIHByZXZpb3VzIG9uZVxuICAgIC8vIFNvIHRvIG1hdGNoIHRoZXNlIHJ1bGVzLCB0aGUgb3JkZXIgaW4gd2hpY2ggcHJvdmlkZXJzIGFyZSBhZGRlZCBpbiB0aGUgYXJyYXlzIGlzIHZlcnlcbiAgICAvLyBpbXBvcnRhbnQuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaXJlY3RpdmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSBkaXJlY3RpdmVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gICAgfVxuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHROb2RlLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG4gICAgY29uc3QgaW5pdGlhbFByZU9yZGVySG9va3NMZW5ndGggPSAodFZpZXcucHJlT3JkZXJIb29rcyAmJiB0Vmlldy5wcmVPcmRlckhvb2tzLmxlbmd0aCkgfHwgMDtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoID1cbiAgICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyAmJiB0Vmlldy5wcmVPcmRlckNoZWNrSG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IG5vZGVJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IHRWaWV3LmRhdGEubGVuZ3RoO1xuICAgICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcblxuICAgICAgc2F2ZU5hbWVUb0V4cG9ydE1hcCh0Vmlldy5kYXRhICEubGVuZ3RoIC0gMSwgZGVmLCBleHBvcnRzTWFwKTtcblxuICAgICAgLy8gSW5pdCBob29rcyBhcmUgcXVldWVkIG5vdyBzbyBuZ09uSW5pdCBpcyBjYWxsZWQgaW4gaG9zdCBjb21wb25lbnRzIGJlZm9yZVxuICAgICAgLy8gYW55IHByb2plY3RlZCBjb21wb25lbnRzLlxuICAgICAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKFxuICAgICAgICAgIGRpcmVjdGl2ZURlZklkeCwgZGVmLCB0Vmlldywgbm9kZUluZGV4LCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCxcbiAgICAgICAgICBpbml0aWFsUHJlT3JkZXJDaGVja0hvb2tzTGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgaWYgKGV4cG9ydHNNYXApIGNhY2hlTWF0Y2hpbmdMb2NhbE5hbWVzKHROb2RlLCBsb2NhbFJlZnMsIGV4cG9ydHNNYXApO1xufVxuXG4vKipcbiAqIEluc3RhbnRpYXRlIGFsbCB0aGUgZGlyZWN0aXZlcyB0aGF0IHdlcmUgcHJldmlvdXNseSByZXNvbHZlZCBvbiB0aGUgY3VycmVudCBub2RlLlxuICovXG5mdW5jdGlvbiBpbnN0YW50aWF0ZUFsbERpcmVjdGl2ZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGlmICghdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MgJiYgc3RhcnQgPCBlbmQpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldyk7XG4gIH1cbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICBhZGRDb21wb25lbnRMb2dpYyhsVmlldywgdE5vZGUsIGRlZiBhcyBDb21wb25lbnREZWY8YW55Pik7XG4gICAgfVxuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKHRWaWV3LmRhdGEsIGxWaWV3ICEsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgcG9zdFByb2Nlc3NEaXJlY3RpdmUobFZpZXcsIGRpcmVjdGl2ZSwgZGVmLCBpKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpbnZva2VEaXJlY3RpdmVzSG9zdEJpbmRpbmdzKHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVE5vZGUpIHtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBleHBhbmRvID0gdFZpZXcuZXhwYW5kb0luc3RydWN0aW9ucyAhO1xuICBjb25zdCBmaXJzdFRlbXBsYXRlUGFzcyA9IHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGNvbnN0IHNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIHRyeSB7XG4gICAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4KTtcblxuICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgY29uc3QgZGlyZWN0aXZlID0gdmlld0RhdGFbaV07XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncykge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGV4cGFuZG8sIGRpcmVjdGl2ZSwgdE5vZGUsIGZpcnN0VGVtcGxhdGVQYXNzKTtcblxuICAgICAgICAvLyBFYWNoIGRpcmVjdGl2ZSBnZXRzIGEgdW5pcXVlSWQgdmFsdWUgdGhhdCBpcyB0aGUgc2FtZSBmb3IgYm90aFxuICAgICAgICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgICAgICAgLy8gZGlyZWN0aXZlIHVuaXF1ZUlkIGlzIG5vdCBzZXQgYW55d2hlcmUtLWl0IGlzIGp1c3QgaW5jcmVtZW50ZWQgYmV0d2VlblxuICAgICAgICAvLyBlYWNoIGhvc3RCaW5kaW5ncyBjYWxsIGFuZCBpcyB1c2VmdWwgZm9yIGhlbHBpbmcgaW5zdHJ1Y3Rpb24gY29kZVxuICAgICAgICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgICAgICAgaW5jcmVtZW50QWN0aXZlRGlyZWN0aXZlSWQoKTtcbiAgICAgIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgICAgZXhwYW5kby5wdXNoKG51bGwpO1xuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChzZWxlY3RlZEluZGV4KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gaW52b2tlSG9zdEJpbmRpbmdzSW5DcmVhdGlvbk1vZGUoXG4gICAgZGVmOiBEaXJlY3RpdmVEZWY8YW55PiwgZXhwYW5kbzogRXhwYW5kb0luc3RydWN0aW9ucywgZGlyZWN0aXZlOiBhbnksIHROb2RlOiBUTm9kZSxcbiAgICBmaXJzdFRlbXBsYXRlUGFzczogYm9vbGVhbikge1xuICBjb25zdCBwcmV2aW91c0V4cGFuZG9MZW5ndGggPSBleHBhbmRvLmxlbmd0aDtcbiAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihkZWYpO1xuICBjb25zdCBlbGVtZW50SW5kZXggPSB0Tm9kZS5pbmRleCAtIEhFQURFUl9PRkZTRVQ7XG4gIGRlZi5ob3N0QmluZGluZ3MgIShSZW5kZXJGbGFncy5DcmVhdGUsIGRpcmVjdGl2ZSwgZWxlbWVudEluZGV4KTtcbiAgc2V0Q3VycmVudERpcmVjdGl2ZURlZihudWxsKTtcbiAgLy8gYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24gbWF5IG9yIG1heSBub3QgY29udGFpbiBgYWxsb2NIb3N0VmFyc2AgY2FsbFxuICAvLyAoZS5nLiBpdCBtYXkgbm90IGlmIGl0IG9ubHkgY29udGFpbnMgaG9zdCBsaXN0ZW5lcnMpLCBzbyB3ZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXJcbiAgLy8gYGV4cGFuZG9JbnN0cnVjdGlvbnNgIGhhcyBjaGFuZ2VkIGFuZCBpZiBub3QgLSB3ZSBzdGlsbCBwdXNoIGBob3N0QmluZGluZ3NgIHRvXG4gIC8vIGV4cGFuZG8gYmxvY2ssIHRvIG1ha2Ugc3VyZSB3ZSBleGVjdXRlIGl0IGZvciBESSBjeWNsZVxuICBpZiAocHJldmlvdXNFeHBhbmRvTGVuZ3RoID09PSBleHBhbmRvLmxlbmd0aCAmJiBmaXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGV4cGFuZG8ucHVzaChkZWYuaG9zdEJpbmRpbmdzKTtcbiAgfVxufVxuXG4vKipcbiogR2VuZXJhdGVzIGEgbmV3IGJsb2NrIGluIFRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgZm9yIHRoaXMgbm9kZS5cbipcbiogRWFjaCBleHBhbmRvIGJsb2NrIHN0YXJ0cyB3aXRoIHRoZSBlbGVtZW50IGluZGV4ICh0dXJuZWQgbmVnYXRpdmUgc28gd2UgY2FuIGRpc3Rpbmd1aXNoXG4qIGl0IGZyb20gdGhlIGhvc3RWYXIgY291bnQpIGFuZCB0aGUgZGlyZWN0aXZlIGNvdW50LiBTZWUgbW9yZSBpbiBWSUVXX0RBVEEubWQuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2soXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUNvdW50OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICdFeHBhbmRvIGJsb2NrIHNob3VsZCBvbmx5IGJlIGdlbmVyYXRlZCBvbiBmaXJzdCB0ZW1wbGF0ZSBwYXNzLicpO1xuXG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IC0odE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgcHJvdmlkZXJTdGFydEluZGV4ID0gdE5vZGUucHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IHByb3ZpZGVyQ291bnQgPSB0Vmlldy5kYXRhLmxlbmd0aCAtIHByb3ZpZGVyU3RhcnRJbmRleDtcbiAgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgfHwgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMgPSBbXG4gICBdKSkucHVzaChlbGVtZW50SW5kZXgsIHByb3ZpZGVyQ291bnQsIGRpcmVjdGl2ZUNvdW50KTtcbn1cblxuLyoqXG4gKiBQcm9jZXNzIGEgZGlyZWN0aXZlIG9uIHRoZSBjdXJyZW50IG5vZGUgYWZ0ZXIgaXRzIGNyZWF0aW9uLlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZTxUPihcbiAgICB2aWV3RGF0YTogTFZpZXcsIGRpcmVjdGl2ZTogVCwgZGVmOiBEaXJlY3RpdmVEZWY8VD4sIGRpcmVjdGl2ZURlZklkeDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IHByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZGlyZWN0aXZlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQocHJldmlvdXNPclBhcmVudFROb2RlLCAncHJldmlvdXNPclBhcmVudFROb2RlJyk7XG4gIGlmIChwcmV2aW91c09yUGFyZW50VE5vZGUgJiYgcHJldmlvdXNPclBhcmVudFROb2RlLmF0dHJzKSB7XG4gICAgc2V0SW5wdXRzRnJvbUF0dHJzKGRpcmVjdGl2ZURlZklkeCwgZGlyZWN0aXZlLCBkZWYsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cblxuICBpZiAodmlld0RhdGFbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzICYmIGRlZi5jb250ZW50UXVlcmllcykge1xuICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0NvbnRlbnRRdWVyeTtcbiAgfVxuXG4gIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCwgdmlld0RhdGEpO1xuICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBkaXJlY3RpdmU7XG4gIH1cbn1cblxuLyoqXG4gKiBBIGxpZ2h0ZXIgdmVyc2lvbiBvZiBwb3N0UHJvY2Vzc0RpcmVjdGl2ZSgpIHRoYXQgaXMgdXNlZCBmb3IgdGhlIHJvb3QgY29tcG9uZW50LlxuICovXG5mdW5jdGlvbiBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmU8VD4oXG4gICAgbFZpZXc6IExWaWV3LCBwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlLCBkaXJlY3RpdmU6IFQpOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbFZpZXdbQklORElOR19JTkRFWF0sIGxWaWV3W1RWSUVXXS5iaW5kaW5nU3RhcnRJbmRleCxcbiAgICAgICAgICAgICAgICAgICAnZGlyZWN0aXZlcyBzaG91bGQgYmUgY3JlYXRlZCBiZWZvcmUgYW55IGJpbmRpbmdzJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KGdldElzUGFyZW50KCkpO1xuXG4gIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcbiAgaWYgKG5hdGl2ZSkge1xuICAgIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcbiAgfVxufVxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSk6IERpcmVjdGl2ZURlZjxhbnk+W118XG4gICAgbnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBuZ0Rldk1vZGUgPyBuZXcgTWF0Y2hlc0FycmF5ICEoKSA6IFtdKTtcbiAgICAgICAgZGlQdWJsaWNJbkluamVjdG9yKFxuICAgICAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgICAgICAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgICAgICAgICAgIHZpZXdEYXRhKSxcbiAgICAgICAgICAgIHZpZXdEYXRhLCBkZWYudHlwZSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50KSB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUpO1xuICAgICAgICAgIHROb2RlLmZsYWdzID0gVE5vZGVGbGFncy5pc0NvbXBvbmVudDtcblxuICAgICAgICAgIC8vIFRoZSBjb21wb25lbnQgaXMgYWx3YXlzIHN0b3JlZCBmaXJzdCB3aXRoIGRpcmVjdGl2ZXMgYWZ0ZXIuXG4gICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWF0Y2hlcy5wdXNoKGRlZik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG1hdGNoZXM7XG59XG5cbi8qKiBTdG9yZXMgaW5kZXggb2YgY29tcG9uZW50J3MgaG9zdCBlbGVtZW50IHNvIGl0IHdpbGwgYmUgcXVldWVkIGZvciB2aWV3IHJlZnJlc2ggZHVyaW5nIENELiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhwcmV2aW91c09yUGFyZW50VE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdTaG91bGQgb25seSBiZSBjYWxsZWQgaW4gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcbiAgKHRWaWV3LmNvbXBvbmVudHMgfHwgKHRWaWV3LmNvbXBvbmVudHMgPSBuZ0Rldk1vZGUgPyBuZXcgVFZpZXdDb21wb25lbnRzICEoKSA6IFtcbiAgIF0pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID1cbiAgICAgICAgbmdEZXZNb2RlID8gbmV3IFROb2RlTG9jYWxOYW1lcyAhKCkgOiBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbCkgdGhyb3cgbmV3IEVycm9yKGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiogQnVpbGRzIHVwIGFuIGV4cG9ydCBtYXAgYXMgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCwgc28gbG9jYWwgcmVmcyBjYW4gYmUgcXVpY2tseSBtYXBwZWRcbiogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPGFueT58IENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9IHwgbnVsbCkge1xuICBpZiAoZXhwb3J0c01hcCkge1xuICAgIGlmIChkZWYuZXhwb3J0QXMpIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLmV4cG9ydEFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGV4cG9ydHNNYXBbZGVmLmV4cG9ydEFzW2ldXSA9IGluZGV4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoKGRlZiBhcyBDb21wb25lbnREZWY8YW55PikudGVtcGxhdGUpIGV4cG9ydHNNYXBbJyddID0gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIGNvbnN0IGZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICBmbGFncyA9PT0gMCB8fCBmbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnZXhwZWN0ZWQgbm9kZSBmbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcblxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIC8vIFdoZW4gdGhlIGZpcnN0IGRpcmVjdGl2ZSBpcyBjcmVhdGVkIG9uIGEgbm9kZSwgc2F2ZSB0aGUgaW5kZXhcbiAgdE5vZGUuZmxhZ3MgPSBmbGFncyAmIFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuZnVuY3Rpb24gYmFzZVJlc29sdmVEaXJlY3RpdmU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LFxuICAgIGRpcmVjdGl2ZUZhY3Rvcnk6ICh0OiBUeXBlPFQ+fCBudWxsKSA9PiBhbnkpIHtcbiAgdFZpZXcuZGF0YS5wdXNoKGRlZik7XG4gIGNvbnN0IG5vZGVJbmplY3RvckZhY3RvcnkgPSBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCBudWxsKTtcbiAgdFZpZXcuYmx1ZXByaW50LnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG4gIHZpZXdEYXRhLnB1c2gobm9kZUluamVjdG9yRmFjdG9yeSk7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShwcmV2aW91c09yUGFyZW50VE5vZGUsIGxWaWV3KTtcblxuICBjb25zdCB0VmlldyA9IGdldE9yQ3JlYXRlVFZpZXcoZGVmKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICAgICAgICAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSxcbiAgICAgICAgICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlIGFzIFJFbGVtZW50LCBkZWYpKSk7XG5cbiAgY29tcG9uZW50Vmlld1tUX0hPU1RdID0gcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHF1ZXVlQ29tcG9uZW50SW5kZXhGb3JDaGVjayhwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgaW5kZXg6IG51bWJlciwgbmFtZTogc3RyaW5nLCB2YWx1ZTogYW55LCBsVmlldzogTFZpZXcsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmcpIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICdJbmNvbWluZyB2YWx1ZSBzaG91bGQgbmV2ZXIgYmUgTk9fQ0hBTkdFLicpO1xuICBuZ0Rldk1vZGUgJiYgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlciA9IGxWaWV3W1JFTkRFUkVSXTtcbiAgaWYgKHZhbHVlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyUmVtb3ZlQXR0cmlidXRlKys7XG4gICAgaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpID8gcmVuZGVyZXIucmVtb3ZlQXR0cmlidXRlKGVsZW1lbnQsIG5hbWUsIG5hbWVzcGFjZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJTZXRBdHRyaWJ1dGUrKztcbiAgICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHROb2RlLnRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUsIG5hbWVzcGFjZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5hbWVzcGFjZSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lLCBzdHJWYWx1ZSkgOlxuICAgICAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgc3RyVmFsdWUpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNldHMgaW5pdGlhbCBpbnB1dCBwcm9wZXJ0aWVzIG9uIGRpcmVjdGl2ZSBpbnN0YW5jZXMgZnJvbSBhdHRyaWJ1dGUgZGF0YVxuICpcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlIGluIGRpcmVjdGl2ZXMgYXJyYXlcbiAqIEBwYXJhbSBpbnN0YW5jZSBJbnN0YW5jZSBvZiB0aGUgZGlyZWN0aXZlIG9uIHdoaWNoIHRvIHNldCB0aGUgaW5pdGlhbCBpbnB1dHNcbiAqIEBwYXJhbSBkZWYgVGhlIGRpcmVjdGl2ZSBkZWYgdGhhdCBjb250YWlucyB0aGUgbGlzdCBvZiBpbnB1dHNcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgZm9yIHRoaXMgbm9kZVxuICovXG5mdW5jdGlvbiBzZXRJbnB1dHNGcm9tQXR0cnM8VD4oXG4gICAgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUpOiB2b2lkIHtcbiAgbGV0IGluaXRpYWxJbnB1dERhdGEgPSB0Tm9kZS5pbml0aWFsSW5wdXRzIGFzIEluaXRpYWxJbnB1dERhdGEgfCB1bmRlZmluZWQ7XG4gIGlmIChpbml0aWFsSW5wdXREYXRhID09PSB1bmRlZmluZWQgfHwgZGlyZWN0aXZlSW5kZXggPj0gaW5pdGlhbElucHV0RGF0YS5sZW5ndGgpIHtcbiAgICBpbml0aWFsSW5wdXREYXRhID0gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKGRpcmVjdGl2ZUluZGV4LCBkZWYuaW5wdXRzLCB0Tm9kZSk7XG4gIH1cblxuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XTtcbiAgaWYgKGluaXRpYWxJbnB1dHMpIHtcbiAgICBjb25zdCBzZXRJbnB1dCA9IGRlZi5zZXRJbnB1dDtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGluaXRpYWxJbnB1dHMubGVuZ3RoOykge1xuICAgICAgY29uc3QgcHVibGljTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgY29uc3QgdmFsdWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBpZiAoc2V0SW5wdXQpIHtcbiAgICAgICAgZGVmLnNldElucHV0ICEoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoaW5zdGFuY2UgYXMgYW55KVtwcml2YXRlTmFtZV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggdG8gc3RvcmUgdGhlIGluaXRpYWwgaW5wdXQgZGF0YVxuICogQHBhcmFtIGlucHV0cyBUaGUgbGlzdCBvZiBpbnB1dHMgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZlxuICogQHBhcmFtIHROb2RlIFRoZSBzdGF0aWMgZGF0YSBvbiB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGlucHV0czoge1trZXk6IHN0cmluZ106IHN0cmluZ30sIHROb2RlOiBUTm9kZSk6IEluaXRpYWxJbnB1dERhdGEge1xuICBjb25zdCBpbml0aWFsSW5wdXREYXRhOiBJbml0aWFsSW5wdXREYXRhID1cbiAgICAgIHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBuZ0Rldk1vZGUgPyBuZXcgVE5vZGVJbml0aWFsSW5wdXRzICEoKSA6IFtdKTtcbiAgLy8gRW5zdXJlIHRoYXQgd2UgZG9uJ3QgY3JlYXRlIHNwYXJzZSBhcnJheXNcbiAgZm9yIChsZXQgaSA9IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoOyBpIDw9IGRpcmVjdGl2ZUluZGV4OyBpKyspIHtcbiAgICBpbml0aWFsSW5wdXREYXRhLnB1c2gobnVsbCk7XG4gIH1cblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGNvbnN0IG1pbmlmaWVkSW5wdXROYW1lID0gaW5wdXRzW2F0dHJOYW1lIGFzIHN0cmluZ107XG4gICAgY29uc3QgYXR0clZhbHVlID0gYXR0cnNbaSArIDFdO1xuXG4gICAgaWYgKG1pbmlmaWVkSW5wdXROYW1lICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHMgPSBpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSB8fFxuICAgICAgICAgIChpbml0aWFsSW5wdXREYXRhW2RpcmVjdGl2ZUluZGV4XSA9IG5nRGV2TW9kZSA/IG5ldyBUTm9kZUluaXRpYWxEYXRhICEoKSA6IFtdKTtcbiAgICAgIGlucHV0c1RvU3RvcmUucHVzaChhdHRyTmFtZSBhcyBzdHJpbmcsIG1pbmlmaWVkSW5wdXROYW1lLCBhdHRyVmFsdWUgYXMgc3RyaW5nKTtcbiAgICB9XG5cbiAgICBpICs9IDI7XG4gIH1cbiAgcmV0dXJuIGluaXRpYWxJbnB1dERhdGE7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIFZpZXdDb250YWluZXIgJiBWaWV3XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vLyBOb3Qgc3VyZSB3aHkgSSBuZWVkIHRvIGRvIGBhbnlgIGhlcmUgYnV0IFRTIGNvbXBsYWlucyBsYXRlci5cbmNvbnN0IExDb250YWluZXJBcnJheTogYW55ID0gbmdEZXZNb2RlICYmIGNyZWF0ZU5hbWVkQXJyYXlUeXBlKCdMQ29udGFpbmVyJyk7XG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBTdHlsaW5nQ29udGV4dCB8IExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlLCBpc0ZvclZpZXdDb250YWluZXJSZWY/OiBib29sZWFuKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREb21Ob2RlKG5hdGl2ZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIC8vIGh0dHBzOi8vanNwZXJmLmNvbS9hcnJheS1saXRlcmFsLXZzLW5ldy1hcnJheS1yZWFsbHlcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IG5ldyAobmdEZXZNb2RlID8gTENvbnRhaW5lckFycmF5IDogQXJyYXkpKFxuICAgICAgaG9zdE5hdGl2ZSwgIC8vIGhvc3QgbmF0aXZlXG4gICAgICB0cnVlLCAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgICAgaXNGb3JWaWV3Q29udGFpbmVyUmVmID8gLTEgOiAwLCAgLy8gYWN0aXZlIGluZGV4XG4gICAgICBjdXJyZW50VmlldywgICAgICAgICAgICAgICAgICAgICAvLyBwYXJlbnRcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHF1ZXJpZXNcbiAgICAgIHROb2RlLCAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRfaG9zdFxuICAgICAgbmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlXG4gICAgICApO1xuICBuZ0Rldk1vZGUgJiYgYXR0YWNoTENvbnRhaW5lckRlYnVnKGxDb250YWluZXIpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuXG4vKipcbiAqIEdvZXMgb3ZlciBkeW5hbWljIGVtYmVkZGVkIHZpZXdzIChvbmVzIGNyZWF0ZWQgdGhyb3VnaCBWaWV3Q29udGFpbmVyUmVmIEFQSXMpIGFuZCByZWZyZXNoZXNcbiAqIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBsVmlld1tDSElMRF9IRUFEXTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seSBpbnRlcmVzdGVkXG4gICAgLy8gaW4gTENvbnRhaW5lci4gV2UgY2FuIHRlbGwgaXQncyBhbiBMQ29udGFpbmVyIGJlY2F1c2UgaXRzIGxlbmd0aCBpcyBsZXNzIHRoYW4gdGhlIExWaWV3XG4gICAgLy8gaGVhZGVyLlxuICAgIGlmIChjdXJyZW50W0FDVElWRV9JTkRFWF0gPT09IC0xICYmIGlzTENvbnRhaW5lcihjdXJyZW50KSkge1xuICAgICAgZm9yIChsZXQgaSA9IENPTlRBSU5FUl9IRUFERVJfT0ZGU0VUOyBpIDwgY3VycmVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBkeW5hbWljVmlld0RhdGEgPSBjdXJyZW50W2ldO1xuICAgICAgICAvLyBUaGUgZGlyZWN0aXZlcyBhbmQgcGlwZXMgYXJlIG5vdCBuZWVkZWQgaGVyZSBhcyBhbiBleGlzdGluZyB2aWV3IGlzIG9ubHkgYmVpbmdcbiAgICAgICAgLy8gcmVmcmVzaGVkLlxuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkeW5hbWljVmlld0RhdGFbVFZJRVddLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICAgICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShkeW5hbWljVmlld0RhdGEsIGR5bmFtaWNWaWV3RGF0YVtUVklFV10sIGR5bmFtaWNWaWV3RGF0YVtDT05URVhUXSAhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBSZWZyZXNoZXMgY29tcG9uZW50cyBieSBlbnRlcmluZyB0aGUgY29tcG9uZW50IHZpZXcgYW5kIHByb2Nlc3NpbmcgaXRzIGJpbmRpbmdzLCBxdWVyaWVzLCBldGMuXG4gKlxuICogQHBhcmFtIGFkanVzdGVkRWxlbWVudEluZGV4ICBFbGVtZW50IGluZGV4IGluIExWaWV3W10gKGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUKVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcG9uZW50UmVmcmVzaChhZGp1c3RlZEVsZW1lbnRJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBhZGp1c3RlZEVsZW1lbnRJbmRleCk7XG4gIGNvbnN0IGhvc3RWaWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5kZXgoYWRqdXN0ZWRFbGVtZW50SW5kZXgsIGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxWaWV3W1RWSUVXXS5kYXRhW2FkanVzdGVkRWxlbWVudEluZGV4XSBhcyBUTm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50cyBpbiBjcmVhdGlvbiBtb2RlLCBhdHRhY2hlZCBDaGVja0Fsd2F5c1xuICAvLyBjb21wb25lbnRzIG9yIGF0dGFjaGVkLCBkaXJ0eSBPblB1c2ggY29tcG9uZW50cyBzaG91bGQgYmUgY2hlY2tlZFxuICBpZiAoKHZpZXdBdHRhY2hlZFRvQ2hhbmdlRGV0ZWN0b3IoaG9zdFZpZXcpIHx8IGlzQ3JlYXRpb25Nb2RlKGxWaWV3KSkgJiZcbiAgICAgIGhvc3RWaWV3W0ZMQUdTXSAmIChMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5EaXJ0eSkpIHtcbiAgICBzeW5jVmlld1dpdGhCbHVlcHJpbnQoaG9zdFZpZXcpO1xuICAgIGNoZWNrVmlldyhob3N0VmlldywgaG9zdFZpZXdbQ09OVEVYVF0pO1xuICB9XG59XG5cbi8qKlxuICogU3luY3MgYW4gTFZpZXcgaW5zdGFuY2Ugd2l0aCBpdHMgYmx1ZXByaW50IGlmIHRoZXkgaGF2ZSBnb3R0ZW4gb3V0IG9mIHN5bmMuXG4gKlxuICogVHlwaWNhbGx5LCBibHVlcHJpbnRzIGFuZCB0aGVpciB2aWV3IGluc3RhbmNlcyBzaG91bGQgYWx3YXlzIGJlIGluIHN5bmMsIHNvIHRoZSBsb29wIGhlcmVcbiAqIHdpbGwgYmUgc2tpcHBlZC4gSG93ZXZlciwgY29uc2lkZXIgdGhpcyBjYXNlIG9mIHR3byBjb21wb25lbnRzIHNpZGUtYnktc2lkZTpcbiAqXG4gKiBBcHAgdGVtcGxhdGU6XG4gKiBgYGBcbiAqIDxjb21wPjwvY29tcD5cbiAqIDxjb21wPjwvY29tcD5cbiAqIGBgYFxuICpcbiAqIFRoZSBmb2xsb3dpbmcgd2lsbCBoYXBwZW46XG4gKiAxLiBBcHAgdGVtcGxhdGUgYmVnaW5zIHByb2Nlc3NpbmcuXG4gKiAyLiBGaXJzdCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiAzLiBTZWNvbmQgPGNvbXA+IGlzIG1hdGNoZWQgYXMgYSBjb21wb25lbnQgYW5kIGl0cyBMVmlldyBpcyBjcmVhdGVkLlxuICogNC4gQXBwIHRlbXBsYXRlIGNvbXBsZXRlcyBwcm9jZXNzaW5nLCBzbyBpdCdzIHRpbWUgdG8gY2hlY2sgY2hpbGQgdGVtcGxhdGVzLlxuICogNS4gRmlyc3QgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0IGhhcyBhIGRpcmVjdGl2ZSwgc28gaXRzIGRlZiBpcyBwdXNoZWQgdG8gYmx1ZXByaW50LlxuICogNi4gU2Vjb25kIDxjb21wPiB0ZW1wbGF0ZSBpcyBjaGVja2VkLiBJdHMgYmx1ZXByaW50IGhhcyBiZWVuIHVwZGF0ZWQgYnkgdGhlIGZpcnN0XG4gKiA8Y29tcD4gdGVtcGxhdGUsIGJ1dCBpdHMgTFZpZXcgd2FzIGNyZWF0ZWQgYmVmb3JlIHRoaXMgdXBkYXRlLCBzbyBpdCBpcyBvdXQgb2Ygc3luYy5cbiAqXG4gKiBOb3RlIHRoYXQgZW1iZWRkZWQgdmlld3MgaW5zaWRlIG5nRm9yIGxvb3BzIHdpbGwgbmV2ZXIgYmUgb3V0IG9mIHN5bmMgYmVjYXVzZSB0aGVzZSB2aWV3c1xuICogYXJlIHByb2Nlc3NlZCBhcyBzb29uIGFzIHRoZXkgYXJlIGNyZWF0ZWQuXG4gKlxuICogQHBhcmFtIGNvbXBvbmVudFZpZXcgVGhlIHZpZXcgdG8gc3luY1xuICovXG5mdW5jdGlvbiBzeW5jVmlld1dpdGhCbHVlcHJpbnQoY29tcG9uZW50VmlldzogTFZpZXcpIHtcbiAgY29uc3QgY29tcG9uZW50VFZpZXcgPSBjb21wb25lbnRWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IGNvbXBvbmVudFZpZXcubGVuZ3RoOyBpIDwgY29tcG9uZW50VFZpZXcuYmx1ZXByaW50Lmxlbmd0aDsgaSsrKSB7XG4gICAgY29tcG9uZW50Vmlld1tpXSA9IGNvbXBvbmVudFRWaWV3LmJsdWVwcmludFtpXTtcbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG9cbiAgLy8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2ZcbiAgLy8gb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lclxuICAvLyBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSAhW05FWFRdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgbFZpZXdbQ0hJTERfSEVBRF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfVxuICBsVmlld1tDSElMRF9UQUlMXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICByZXR1cm4gbFZpZXdPckxDb250YWluZXI7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5cbi8qKlxuICogTWFya3MgY3VycmVudCB2aWV3IGFuZCBhbGwgYW5jZXN0b3JzIGRpcnR5LlxuICpcbiAqIFJldHVybnMgdGhlIHJvb3QgdmlldyBiZWNhdXNlIGl0IGlzIGZvdW5kIGFzIGEgYnlwcm9kdWN0IG9mIG1hcmtpbmcgdGhlIHZpZXcgdHJlZVxuICogZGlydHksIGFuZCBjYW4gYmUgdXNlZCBieSBtZXRob2RzIHRoYXQgY29uc3VtZSBtYXJrVmlld0RpcnR5KCkgdG8gZWFzaWx5IHNjaGVkdWxlXG4gKiBjaGFuZ2UgZGV0ZWN0aW9uLiBPdGhlcndpc2UsIHN1Y2ggbWV0aG9kcyB3b3VsZCBuZWVkIHRvIHRyYXZlcnNlIHVwIHRoZSB2aWV3IHRyZWVcbiAqIGFuIGFkZGl0aW9uYWwgdGltZSB0byBnZXQgdGhlIHJvb3QgdmlldyBhbmQgc2NoZWR1bGUgYSB0aWNrIG9uIGl0LlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgc3RhcnRpbmcgTFZpZXcgdG8gbWFyayBkaXJ0eVxuICogQHJldHVybnMgdGhlIHJvb3QgTFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtWaWV3RGlydHkobFZpZXc6IExWaWV3KTogTFZpZXd8bnVsbCB7XG4gIHdoaWxlIChsVmlldykge1xuICAgIGxWaWV3W0ZMQUdTXSB8PSBMVmlld0ZsYWdzLkRpcnR5O1xuICAgIGNvbnN0IHBhcmVudCA9IGdldExWaWV3UGFyZW50KGxWaWV3KTtcbiAgICAvLyBTdG9wIHRyYXZlcnNpbmcgdXAgYXMgc29vbiBhcyB5b3UgZmluZCBhIHJvb3QgdmlldyB0aGF0IHdhc24ndCBhdHRhY2hlZCB0byBhbnkgY29udGFpbmVyXG4gICAgaWYgKGlzUm9vdFZpZXcobFZpZXcpICYmICFwYXJlbnQpIHtcbiAgICAgIHJldHVybiBsVmlldztcbiAgICB9XG4gICAgLy8gY29udGludWUgb3RoZXJ3aXNlXG4gICAgbFZpZXcgPSBwYXJlbnQgITtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vKipcbiAqIFVzZWQgdG8gc2NoZWR1bGUgY2hhbmdlIGRldGVjdGlvbiBvbiB0aGUgd2hvbGUgYXBwbGljYXRpb24uXG4gKlxuICogVW5saWtlIGB0aWNrYCwgYHNjaGVkdWxlVGlja2AgY29hbGVzY2VzIG11bHRpcGxlIGNhbGxzIGludG8gb25lIGNoYW5nZSBkZXRlY3Rpb24gcnVuLlxuICogSXQgaXMgdXN1YWxseSBjYWxsZWQgaW5kaXJlY3RseSBieSBjYWxsaW5nIGBtYXJrRGlydHlgIHdoZW4gdGhlIHZpZXcgbmVlZHMgdG8gYmVcbiAqIHJlLXJlbmRlcmVkLlxuICpcbiAqIFR5cGljYWxseSBgc2NoZWR1bGVUaWNrYCB1c2VzIGByZXF1ZXN0QW5pbWF0aW9uRnJhbWVgIHRvIGNvYWxlc2NlIG11bHRpcGxlXG4gKiBgc2NoZWR1bGVUaWNrYCByZXF1ZXN0cy4gVGhlIHNjaGVkdWxpbmcgZnVuY3Rpb24gY2FuIGJlIG92ZXJyaWRkZW4gaW5cbiAqIGByZW5kZXJDb21wb25lbnRgJ3MgYHNjaGVkdWxlcmAgb3B0aW9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2NoZWR1bGVUaWNrKHJvb3RDb250ZXh0OiBSb290Q29udGV4dCwgZmxhZ3M6IFJvb3RDb250ZXh0RmxhZ3MpIHtcbiAgY29uc3Qgbm90aGluZ1NjaGVkdWxlZCA9IHJvb3RDb250ZXh0LmZsYWdzID09PSBSb290Q29udGV4dEZsYWdzLkVtcHR5O1xuICByb290Q29udGV4dC5mbGFncyB8PSBmbGFncztcblxuICBpZiAobm90aGluZ1NjaGVkdWxlZCAmJiByb290Q29udGV4dC5jbGVhbiA9PSBfQ0xFQU5fUFJPTUlTRSkge1xuICAgIGxldCByZXM6IG51bGx8KCh2YWw6IG51bGwpID0+IHZvaWQpO1xuICAgIHJvb3RDb250ZXh0LmNsZWFuID0gbmV3IFByb21pc2U8bnVsbD4oKHIpID0+IHJlcyA9IHIpO1xuICAgIHJvb3RDb250ZXh0LnNjaGVkdWxlcigoKSA9PiB7XG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkRldGVjdENoYW5nZXMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcztcbiAgICAgICAgdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0KTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJvb3RDb250ZXh0LmZsYWdzICYgUm9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnMpIHtcbiAgICAgICAgcm9vdENvbnRleHQuZmxhZ3MgJj0gflJvb3RDb250ZXh0RmxhZ3MuRmx1c2hQbGF5ZXJzO1xuICAgICAgICBjb25zdCBwbGF5ZXJIYW5kbGVyID0gcm9vdENvbnRleHQucGxheWVySGFuZGxlcjtcbiAgICAgICAgaWYgKHBsYXllckhhbmRsZXIpIHtcbiAgICAgICAgICBwbGF5ZXJIYW5kbGVyLmZsdXNoUGxheWVycygpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHJvb3RDb250ZXh0LmNsZWFuID0gX0NMRUFOX1BST01JU0U7XG4gICAgICByZXMgIShudWxsKTtcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGlja1Jvb3RDb250ZXh0KHJvb3RDb250ZXh0OiBSb290Q29udGV4dCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHJvb3RDb250ZXh0LmNvbXBvbmVudHMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCByb290Q29tcG9uZW50ID0gcm9vdENvbnRleHQuY29tcG9uZW50c1tpXTtcbiAgICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKHJlYWRQYXRjaGVkTFZpZXcocm9vdENvbXBvbmVudCkgISwgcm9vdENvbXBvbmVudCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRldGVjdENoYW5nZXNJbnRlcm5hbDxUPih2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSB2aWV3W1JFTkRFUkVSX0ZBQ1RPUlldO1xuXG4gIGlmIChyZW5kZXJlckZhY3RvcnkuYmVnaW4pIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuXG4gIHRyeSB7XG4gICAgaWYgKGlzQ3JlYXRpb25Nb2RlKHZpZXcpKSB7XG4gICAgICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyBjcmVhdGlvbiBtb2RlIHBhc3NcbiAgICB9XG4gICAgY2hlY2tWaWV3KHZpZXcsIGNvbnRleHQpOyAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGhhbmRsZUVycm9yKHZpZXcsIGVycm9yKTtcbiAgICB0aHJvdyBlcnJvcjtcbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAocmVuZGVyZXJGYWN0b3J5LmVuZCkgcmVuZGVyZXJGYWN0b3J5LmVuZCgpO1xuICB9XG59XG5cbi8qKlxuICogU3luY2hyb25vdXNseSBwZXJmb3JtIGNoYW5nZSBkZXRlY3Rpb24gb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgcGVyZm9ybWVkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIHRpY2tSb290Q29udGV4dChsVmlld1tDT05URVhUXSBhcyBSb290Q29udGV4dCk7XG59XG5cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBhbmQgaXRzIGNoaWxkcmVuLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZSBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjaGVja05vQ2hhbmdlczxUPihjb21wb25lbnQ6IFQpOiB2b2lkIHtcbiAgY29uc3QgdmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlKGNvbXBvbmVudCk7XG4gIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWw8VD4odmlldywgY29tcG9uZW50KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW50ZXJuYWw8VD4odmlldzogTFZpZXcsIGNvbnRleHQ6IFQpIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJbnRlcm5hbCh2aWV3LCBjb250ZXh0KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKlxuICogQ2hlY2tzIHRoZSBjaGFuZ2UgZGV0ZWN0b3Igb24gYSByb290IHZpZXcgYW5kIGl0cyBjb21wb25lbnRzLCBhbmQgdGhyb3dzIGlmIGFueSBjaGFuZ2VzIGFyZVxuICogZGV0ZWN0ZWQuXG4gKlxuICogVGhpcyBpcyB1c2VkIGluIGRldmVsb3BtZW50IG1vZGUgdG8gdmVyaWZ5IHRoYXQgcnVubmluZyBjaGFuZ2UgZGV0ZWN0aW9uIGRvZXNuJ3RcbiAqIGludHJvZHVjZSBvdGhlciBjaGFuZ2VzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGljaCB0aGUgY2hhbmdlIGRldGVjdGlvbiBzaG91bGQgYmUgY2hlY2tlZCBvbi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgc2V0Q2hlY2tOb0NoYW5nZXNNb2RlKHRydWUpO1xuICB0cnkge1xuICAgIGRldGVjdENoYW5nZXNJblJvb3RWaWV3KGxWaWV3KTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDaGVja05vQ2hhbmdlc01vZGUoZmFsc2UpO1xuICB9XG59XG5cbi8qKiBDaGVja3MgdGhlIHZpZXcgb2YgdGhlIGNvbXBvbmVudCBwcm92aWRlZC4gRG9lcyBub3QgZ2F0ZSBvbiBkaXJ0eSBjaGVja3Mgb3IgZXhlY3V0ZSBkb0NoZWNrLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tWaWV3PFQ+KGhvc3RWaWV3OiBMVmlldywgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuXG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhob3N0Vmlldyk7XG4gICAgY3JlYXRpb25Nb2RlICYmIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIGhvc3RUVmlldywgY29tcG9uZW50KTtcbiAgICBleGVjdXRlVGVtcGxhdGUoaG9zdFZpZXcsIHRlbXBsYXRlRm4sIGdldFJlbmRlckZsYWdzKGhvc3RWaWV3KSwgY29tcG9uZW50KTtcbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAvLyBPbmx5IGNoZWNrIHZpZXcgcXVlcmllcyBhZ2FpbiBpbiBjcmVhdGlvbiBtb2RlIGlmIHRoZXJlIGFyZSBzdGF0aWMgdmlldyBxdWVyaWVzXG4gICAgaWYgKCFjcmVhdGlvbk1vZGUgfHwgaG9zdFRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCBob3N0VFZpZXcsIGNvbXBvbmVudCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oZmxhZ3M6IFJlbmRlckZsYWdzLCB0VmlldzogVFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gIGlmICh2aWV3UXVlcnkpIHtcbiAgICBzZXRDdXJyZW50UXVlcnlJbmRleCh0Vmlldy52aWV3UXVlcnlTdGFydEluZGV4KTtcbiAgICB2aWV3UXVlcnkoZmxhZ3MsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGJpbmRpbmcgbWV0YWRhdGEgZm9yIGEgcGFydGljdWxhciBiaW5kaW5nIGFuZCBzdG9yZXMgaXQgaW5cbiAqIFRWaWV3LmRhdGEuIFRoZXNlIGFyZSBnZW5lcmF0ZWQgaW4gb3JkZXIgdG8gc3VwcG9ydCBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqXG4gKiBFYWNoIGJpbmRpbmcgLyBpbnRlcnBvbGF0aW9uIHdpbGwgaGF2ZSBvbmUgKGluY2x1ZGluZyBhdHRyaWJ1dGUgYmluZGluZ3MpXG4gKiBiZWNhdXNlIGF0IHRoZSB0aW1lIG9mIGJpbmRpbmcsIHdlIGRvbid0IGtub3cgdG8gd2hpY2ggaW5zdHJ1Y3Rpb24gdGhlIGJpbmRpbmdcbiAqIGJlbG9uZ3MuIEl0IGlzIGFsd2F5cyBzdG9yZWQgaW4gVFZpZXcuZGF0YSBhdCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgYmluZGluZ1xuICogdmFsdWUgaW4gTFZpZXcgKGUuZy4gZm9yIGludGVycG9sYXRpb244LCBpdCB3b3VsZCBiZSBzdG9yZWQgYXQgdGhlIGluZGV4IG9mXG4gKiB0aGUgOHRoIHZhbHVlKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhlIGN1cnJlbnQgYmluZGluZyBpbmRleC5cbiAqIEBwYXJhbSBwcmVmaXggVGhlIHN0YXRpYyBwcmVmaXggc3RyaW5nXG4gKiBAcGFyYW0gc3VmZml4IFRoZSBzdGF0aWMgc3VmZml4IHN0cmluZ1xuICpcbiAqIEByZXR1cm5zIE5ld2x5IGNyZWF0ZWQgYmluZGluZyBtZXRhZGF0YSBzdHJpbmcgZm9yIHRoaXMgYmluZGluZyBvciBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldzogTFZpZXcsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcbiAgY29uc3QgdmFsdWUgPSBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHByZWZpeCArIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgc3VmZml4O1xuXG4gIHJldHVybiB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9PSBudWxsID8gKHREYXRhW2xhc3RCaW5kaW5nSW5kZXhdID0gdmFsdWUpIDogbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZTogVE5vZGUpOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCB7XG4gIC8vIElmIHROb2RlLmlucHV0cyBpcyB1bmRlZmluZWQsIGEgbGlzdGVuZXIgaGFzIGNyZWF0ZWQgb3V0cHV0cywgYnV0IGlucHV0cyBoYXZlbid0XG4gIC8vIHlldCBiZWVuIGNoZWNrZWQuXG4gIGlmICh0Tm9kZS5pbnB1dHMgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICB0Tm9kZS5pbnB1dHMgPSBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyh0Tm9kZSwgQmluZGluZ0RpcmVjdGlvbi5JbnB1dCk7XG4gIH1cbiAgcmV0dXJuIHROb2RlLmlucHV0cztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldENsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBuZ0Rldk1vZGUgPyBuZXcgTENsZWFudXAgISgpIDogW10pO1xufVxuXG5mdW5jdGlvbiBnZXRUVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB2aWV3W1RWSUVXXS5jbGVhbnVwIHx8ICh2aWV3W1RWSUVXXS5jbGVhbnVwID0gbmdEZXZNb2RlID8gbmV3IFRDbGVhbnVwICEoKSA6IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ3ZhbHVlIHNob3VsZCBub3QgYmUgTk9fQ0hBTkdFJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREYXRhSW5SYW5nZShsVmlldywgaW5kZXggKyBIRUFERVJfT0ZGU0VUKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBhbnkgYXMgUlRleHQ7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGVsZW1lbnQsICduYXRpdmUgZWxlbWVudCBzaG91bGQgZXhpc3QnKTtcbiAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5yZW5kZXJlclNldFRleHQrKztcbiAgY29uc3QgcmVuZGVyZXIgPSBsVmlld1tSRU5ERVJFUl07XG4gIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/IHJlbmRlcmVyLnNldFZhbHVlKGVsZW1lbnQsIHZhbHVlKSA6IGVsZW1lbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbn1cbiJdfQ==