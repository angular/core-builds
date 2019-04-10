/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
import { ErrorHandler } from '../../error_handler';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '../../metadata/schema';
import { validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDataInRange, assertDefined, assertDomNode, assertEqual, assertLessThan, assertNotEqual } from '../../util/assert';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { assertLView, assertPreviousIsParent } from '../assert';
import { attachPatchData, getComponentViewByInstance } from '../context_discovery';
import { attachLContainerDebug, attachLViewDebug } from '../debug';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { executeHooks, executePreOrderHooks, registerPreOrderHooks } from '../hooks';
import { ACTIVE_INDEX, VIEWS } from '../interfaces/container';
import { INJECTOR_BLOOM_PARENT_SIZE, NodeInjectorFactory } from '../interfaces/injector';
import { isProceduralRenderer } from '../interfaces/renderer';
import { BINDING_INDEX, CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_VIEW, FLAGS, HEADER_OFFSET, HOST, INJECTOR, NEXT, PARENT, QUERIES, RENDERER, RENDERER_FACTORY, SANITIZER, TVIEW, T_HOST } from '../interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from '../node_assert';
import { isNodeMatchingSelectorList } from '../node_selector_matcher';
import { enterView, getBindingsEnabled, getCheckNoChangesMode, getIsParent, getLView, getNamespace, getPreviousOrParentTNode, incrementActiveDirectiveId, isCreationMode, leaveView, resetComponentState, setActiveHostElement, setBindingRoot, setCheckNoChangesMode, setCurrentDirectiveDef, setCurrentQueryIndex, setIsParent, setPreviousOrParentTNode, setSelectedIndex, ΔnamespaceHTML } from '../state';
import { initializeStaticContext as initializeStaticStylingContext } from '../styling/class_and_style_bindings';
import { ANIMATION_PROP_PREFIX, isAnimationProp } from '../styling/util';
import { NO_CHANGE } from '../tokens';
import { attrsStylingIndexOf } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER, renderStringify } from '../util/misc_utils';
import { getLViewParent, getRootContext } from '../util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByIndex, getNativeByTNode, getTNode, isComponent, isComponentDef, isContentQueryHost, isRootView, readPatchedLView, resetPreOrderHookFlags, unwrapRNode, viewAttachedToChangeDetector } from '../util/view_utils';
/**
 * A permanent marker promise which signifies that the current CD tree is
 * clean.
 * @type {?}
 */
const _CLEAN_PROMISE = Promise.resolve(null);
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
    setActiveHostElement(null);
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
    const lView = (/** @type {?} */ (tView.blueprint.slice()));
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
 * @param {?} index
 * @param {?} type
 * @param {?} native
 * @param {?} name
 * @param {?} attrs
 * @return {?}
 */
export function createNodeAtIndex(index, type, native, name, attrs) {
    /** @type {?} */
    const lView = getLView();
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const adjustedIndex = index + HEADER_OFFSET;
    ngDevMode &&
        assertLessThan(adjustedIndex, lView.length, `Slot should have been initialized with null`);
    lView[adjustedIndex] = native;
    /** @type {?} */
    const previousOrParentTNode = getPreviousOrParentTNode();
    /** @type {?} */
    const isParent = getIsParent();
    /** @type {?} */
    let tNode = (/** @type {?} */ (tView.data[adjustedIndex]));
    if (tNode == null) {
        /** @type {?} */
        const parent = isParent ? previousOrParentTNode : previousOrParentTNode && previousOrParentTNode.parent;
        // Parents cannot cross component boundaries because components will be used in multiple places,
        // so it's only set if the view is the same.
        /** @type {?} */
        const parentInSameView = parent && parent !== lView[T_HOST];
        /** @type {?} */
        const tParentNode = parentInSameView ? (/** @type {?} */ (parent)) : null;
        tNode = tView.data[adjustedIndex] = createTNode(tParentNode, type, adjustedIndex, name, attrs);
    }
    // Now link ourselves into the tree.
    // We need this even if tNode exists, otherwise we might end up pointing to unexisting tNodes when
    // we use i18n (especially with ICU expressions that update the DOM during the update phase).
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
    if (tView.firstChild == null) {
        tView.firstChild = tNode;
    }
    setPreviousOrParentTNode(tNode);
    setIsParent(true);
    return (/** @type {?} */ (tNode));
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
 *
 * @template T
 * @param {?} hostNode Existing node to render into.
 * @param {?} templateFn Template function with the instructions.
 * @param {?} consts The number of nodes, local refs, and pipes in this template
 * @param {?} vars
 * @param {?} context to pass into the template.
 * @param {?} providedRendererFactory renderer factory to use
 * @param {?} componentView
 * @param {?=} directives Directive defs that should be used for matching
 * @param {?=} pipes Pipe defs that should be used for matching
 * @param {?=} sanitizer
 * @return {?}
 */
export function renderTemplate(hostNode, templateFn, consts, vars, context, providedRendererFactory, componentView, directives, pipes, sanitizer) {
    if (componentView === null) {
        resetComponentState();
        /** @type {?} */
        const renderer = providedRendererFactory.createRenderer(null, null);
        // We need to create a root view so it's possible to look up the host element through its index
        /** @type {?} */
        const hostLView = createLView(null, createTView(-1, null, 1, 0, null, null, null, null), {}, 16 /* CheckAlways */ | 512 /* IsRoot */, null, null, providedRendererFactory, renderer);
        enterView(hostLView, null); // SUSPECT! why do we need to enter the View?
        // SUSPECT! why do we need to enter the View?
        /** @type {?} */
        const componentTView = getOrCreateTView(templateFn, consts, vars, directives || null, pipes || null, null, null);
        /** @type {?} */
        const hostTNode = createNodeAtIndex(0, 3 /* Element */, hostNode, null, null);
        componentView = createLView(hostLView, componentTView, context, 16 /* CheckAlways */, hostNode, hostTNode, providedRendererFactory, renderer, sanitizer);
    }
    renderComponentOrTemplate(componentView, context, templateFn);
    return componentView;
}
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
    setIsParent(true);
    setPreviousOrParentTNode((/** @type {?} */ (null)));
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
    setIsParent(_isParent);
    setPreviousOrParentTNode(_previousOrParentTNode);
    return lView;
}
/**
 * Used for rendering embedded views (e.g. dynamically created views)
 *
 * Dynamically created views must store/retrieve their TViews differently from component views
 * because their template functions are nested in the template functions of their hosts, creating
 * closures. If their host template happens to be an embedded template in a loop (e.g. ngFor inside
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
            setIsParent(true);
            setPreviousOrParentTNode((/** @type {?} */ (null)));
            oldView = enterView(viewToRender, viewToRender[T_HOST]);
            resetPreOrderHookFlags(viewToRender);
            ΔnamespaceHTML();
            // Reset the selected index so we can assert that `select` was called later
            setSelectedIndex(-1);
            (/** @type {?} */ (tView.template))(getRenderFlags(viewToRender), context);
            // This must be set to false immediately after the first creation run because in an
            // ngFor loop, all the views will be created together before update mode runs and turns
            // off firstTemplatePass. If we don't set it here, instances will perform directive
            // matching, etc again and again.
            viewToRender[TVIEW].firstTemplatePass = false;
            refreshDescendantViews(viewToRender);
        }
        finally {
            leaveView((/** @type {?} */ (oldView)));
            setIsParent(_isParent);
            setPreviousOrParentTNode(_previousOrParentTNode);
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
function renderComponentOrTemplate(hostView, context, templateFn) {
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
            if (templateFn) {
                ΔnamespaceHTML();
                // Reset the selected index so we can assert that `select` was called later
                setSelectedIndex(-1);
                templateFn(1 /* Create */, context);
            }
            refreshDescendantViews(hostView);
            hostView[FLAGS] &= ~4 /* CreationMode */;
        }
        // update mode pass
        resetPreOrderHookFlags(hostView);
        templateFn && templateFn(2 /* Update */, context);
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
 * @param {?} templateFn The template from which to get static data
 * @param {?} consts The number of nodes, local refs, and pipes in this view
 * @param {?} vars The number of bindings and pure function bindings in this view
 * @param {?} directives Directive defs that should be saved on TView
 * @param {?} pipes Pipe defs that should be saved on TView
 * @param {?} viewQuery View query that should be saved on TView
 * @param {?} schemas Schemas that should be saved on TView
 * @return {?} TView
 */
export function getOrCreateTView(templateFn, consts, vars, directives, pipes, viewQuery, schemas) {
    // TODO(misko): reading `ngPrivateData` here is problematic for two reasons
    // 1. It is a megamorphic call on each invocation.
    // 2. For nested embedded views (ngFor inside ngFor) the template instance is per
    //    outer template invocation, which means that no such property will exist
    // Correct solution is to only put `ngPrivateData` on the Component template
    // and not on embedded templates.
    return templateFn.ngPrivateData ||
        (templateFn.ngPrivateData = (/** @type {?} */ (createTView(-1, templateFn, consts, vars, directives, pipes, viewQuery, schemas))));
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
    return blueprint[(/** @type {?} */ (TVIEW))] = {
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
    const blueprint = (/** @type {?} */ (new Array(initialViewLength)
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
    return new Error(`Renderer: ${text} [${renderStringify(token)}]`);
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
    if (value === NO_CHANGE)
        return;
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
                setNgReflectProperties(lView, element, tNode.type, dataValue, value);
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
        // It is assumed that the sanitizer is only added when the compiler determines that the property
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
 * @param {?} inputs
 * @param {?} value
 * @return {?}
 */
function setNgReflectProperties(lView, element, type, inputs, value) {
    for (let i = 0; i < inputs.length; i += 3) {
        /** @type {?} */
        const renderer = lView[RENDERER];
        /** @type {?} */
        const attrName = normalizeDebugBindingName((/** @type {?} */ (inputs[i + 2])));
        /** @type {?} */
        const debugValue = normalizeDebugBindingValue(value);
        if (type === 3 /* Element */) {
            isProceduralRenderer(renderer) ?
                renderer.setAttribute(((/** @type {?} */ (element))), attrName, debugValue) :
                ((/** @type {?} */ (element))).setAttribute(attrName, debugValue);
        }
        else if (value !== undefined) {
            /** @type {?} */
            const value = `bindings=${JSON.stringify({ [attrName]: debugValue }, null, 2)}`;
            if (isProceduralRenderer(renderer)) {
                renderer.setValue(((/** @type {?} */ (element))), value);
            }
            else {
                ((/** @type {?} */ (element))).textContent = value;
            }
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
    // Please make sure to have explicit type for `exportsMap`. Inferred type triggers bug in tsickle.
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
    setActiveHostElement(null);
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
                matches || (matches = []);
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
    (tView.components || (tView.components = [])).push(previousOrParentTNode.index);
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
        const localNames = tNode.localNames = [];
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
    const tView = getOrCreateTView(def.template, def.consts, def.vars, def.directiveDefs, def.pipeDefs, def.viewQuery, def.schemas);
    // Only component views should be added to the view tree directly. Embedded views are
    // accessed through their containers because they may be removed / re-added later.
    /** @type {?} */
    const rendererFactory = lView[RENDERER_FACTORY];
    /** @type {?} */
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* Dirty */ : 16 /* CheckAlways */, lView[previousOrParentTNode.index], (/** @type {?} */ (previousOrParentTNode)), rendererFactory, lView[RENDERER_FACTORY].createRenderer((/** @type {?} */ (native)), def)));
    componentView[T_HOST] = (/** @type {?} */ (previousOrParentTNode));
    // Component view will always be created before any injected LContainers,
    // so this is a regular element, wrap it with the component view
    lView[previousOrParentTNode.index] = componentView;
    if (lView[TVIEW].firstTemplatePass) {
        queueComponentIndexForCheck(previousOrParentTNode);
    }
}
/**
 * Sets initial input properties on directive instances from attribute data
 *
 * @template T
 * @param {?} directiveIndex Index of the directive in directives array
 * @param {?} instance Instance of the directive on which to set the initial inputs
 * @param {?} def
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
    const initialInputData = tNode.initialInputs || (tNode.initialInputs = []);
    initialInputData[directiveIndex] = null;
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
        // If we hit any other attribute markers, we're done anyway. None of those are valid inputs.
        if (typeof attrName === 'number')
            break;
        /** @type {?} */
        const minifiedInputName = inputs[attrName];
        /** @type {?} */
        const attrValue = attrs[i + 1];
        if (minifiedInputName !== undefined) {
            /** @type {?} */
            const inputsToStore = initialInputData[directiveIndex] || (initialInputData[directiveIndex] = []);
            inputsToStore.push(attrName, minifiedInputName, (/** @type {?} */ (attrValue)));
        }
        i += 2;
    }
    return initialInputData;
}
//////////////////////////
//// ViewContainer & View
//////////////////////////
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
    /** @type {?} */
    const lContainer = [
        hostNative,
        true,
        isForViewContainerRef ? -1 : 0,
        currentView,
        null,
        null,
        tNode,
        native,
        [],
    ];
    ngDevMode && attachLContainerDebug(lContainer);
    return lContainer;
}
/**
 * Goes over dynamic embedded views (ones created through ViewContainerRef APIs) and refreshes them
 * by executing an associated template function.
 * @param {?} lView
 * @return {?}
 */
function refreshDynamicEmbeddedViews(lView) {
    for (let current = lView[CHILD_HEAD]; current !== null; current = current[NEXT]) {
        // Note: current can be an LView or an LContainer instance, but here we are only interested
        // in LContainer. We can tell it's an LContainer because its length is less than the LView
        // header.
        if (current.length < HEADER_OFFSET && current[ACTIVE_INDEX] === -1) {
            /** @type {?} */
            const container = (/** @type {?} */ (current));
            for (let i = 0; i < container[VIEWS].length; i++) {
                /** @type {?} */
                const dynamicViewData = container[VIEWS][i];
                // The directives and pipes are not needed here as an existing view is only being refreshed.
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
    // TODO(benlesh/misko): This implementation is incorrect, because it always adds the LContainer to
    // the end of the queue, which means if the developer retrieves the LContainers from RNodes out of
    // order, the change detection will run out of order, as the act of retrieving the the LContainer
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
        ΔnamespaceHTML();
        creationMode && executeViewQueryFn(1 /* Create */, hostTView, component);
        // Reset the selected index so we can assert that `select` was called later
        setSelectedIndex(-1);
        templateFn(getRenderFlags(hostView), component);
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
    if (tNode) {
        if (tNode.inputs === undefined) {
            // mark inputs as checked
            tNode.inputs = generatePropertyAliases(tNode, 0 /* Input */);
        }
        return tNode.inputs;
    }
    return null;
}
/**
 * @param {?} view
 * @return {?}
 */
export function getCleanup(view) {
    // top level variables should not be exported for performance reasons (PERF_NOTES.md)
    return view[CLEANUP] || (view[CLEANUP] = []);
}
/**
 * @param {?} view
 * @return {?}
 */
function getTViewCleanup(view) {
    return view[TVIEW].cleanup || (view[TVIEW].cleanup = []);
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
 * @param {?} inputs
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7QUFRQSxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFFakQsT0FBTyxFQUFDLHNCQUFzQixFQUFFLGdCQUFnQixFQUFpQixNQUFNLHVCQUF1QixDQUFDO0FBQy9GLE9BQU8sRUFBQyw4QkFBOEIsRUFBQyxNQUFNLGlDQUFpQyxDQUFDO0FBRS9FLE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxhQUFhLEVBQUUsYUFBYSxFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDL0gsT0FBTyxFQUFDLHlCQUF5QixFQUFFLDBCQUEwQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDNUYsT0FBTyxFQUFDLFdBQVcsRUFBRSxzQkFBc0IsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUM5RCxPQUFPLEVBQUMsZUFBZSxFQUFFLDBCQUEwQixFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDakYsT0FBTyxFQUFDLHFCQUFxQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ2pFLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxpQkFBaUIsRUFBRSw4QkFBOEIsRUFBQyxNQUFNLE9BQU8sQ0FBQztBQUM1RixPQUFPLEVBQUMsMkJBQTJCLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFDdEQsT0FBTyxFQUFDLFlBQVksRUFBRSxvQkFBb0IsRUFBRSxxQkFBcUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNuRixPQUFPLEVBQUMsWUFBWSxFQUFjLEtBQUssRUFBQyxNQUFNLHlCQUF5QixDQUFDO0FBRXhFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLHdCQUF3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QUcsTUFBTSxDQUFDLE1BQU0sR0FBRzs7Y0FDNUIsS0FBSyxHQUFHLG1CQUFBLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFVOztjQUM3QixVQUFVLEdBQUcsbUJBQUEsTUFBTSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQVU7O2NBQ2xDLFdBQVcsR0FBRyxtQkFBQSxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBVTs7Y0FDbkMsUUFBUSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7UUFDN0IsU0FBUyxJQUFJLGlCQUFpQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQzs7Y0FDdkMsR0FBRyxHQUFHLG1CQUFBLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQXFCOztjQUM1QyxRQUFRLEdBQUcsR0FBRyxDQUFDLFFBQVE7UUFDN0IsSUFBSSxRQUFRLEVBQUU7WUFDWixtQkFBQSxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDMUQ7YUFBTTtZQUNMLFFBQVEsQ0FBQyxXQUFXLENBQUMsR0FBRyxLQUFLLENBQUM7U0FDL0I7S0FDRjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi8uLi9kaSc7XG5pbXBvcnQge0Vycm9ySGFuZGxlcn0gZnJvbSAnLi4vLi4vZXJyb3JfaGFuZGxlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uLy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7Q1VTVE9NX0VMRU1FTlRTX1NDSEVNQSwgTk9fRVJST1JTX1NDSEVNQSwgU2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge3ZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllc30gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge1Nhbml0aXplcn0gZnJvbSAnLi4vLi4vc2FuaXRpemF0aW9uL3NlY3VyaXR5JztcbmltcG9ydCB7YXNzZXJ0RGF0YUluUmFuZ2UsIGFzc2VydERlZmluZWQsIGFzc2VydERvbU5vZGUsIGFzc2VydEVxdWFsLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90RXF1YWx9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge2Fzc2VydExWaWV3LCBhc3NlcnRQcmV2aW91c0lzUGFyZW50fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGEsIGdldENvbXBvbmVudFZpZXdCeUluc3RhbmNlfSBmcm9tICcuLi9jb250ZXh0X2Rpc2NvdmVyeSc7XG5pbXBvcnQge2F0dGFjaExDb250YWluZXJEZWJ1ZywgYXR0YWNoTFZpZXdEZWJ1Z30gZnJvbSAnLi4vZGVidWcnO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtleGVjdXRlSG9va3MsIGV4ZWN1dGVQcmVPcmRlckhvb2tzLCByZWdpc3RlclByZU9yZGVySG9va3N9IGZyb20gJy4uL2hvb2tzJztcbmltcG9ydCB7QUNUSVZFX0lOREVYLCBMQ29udGFpbmVyLCBWSUVXU30gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUsIE5vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFByb3BlcnR5QWxpYXNlcywgVEF0dHJpYnV0ZXMsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlLCBUUHJvamVjdGlvbk5vZGUsIFRWaWV3Tm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXN9IGZyb20gJy4uL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJUZXh0LCBSZW5kZXJlcjMsIFJlbmRlcmVyRmFjdG9yeTMsIGlzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7U2FuaXRpemVyRm59IGZyb20gJy4uL2ludGVyZmFjZXMvc2FuaXRpemF0aW9uJztcbmltcG9ydCB7U3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL2ludGVyZmFjZXMvc3R5bGluZyc7XG5pbXBvcnQge0JJTkRJTkdfSU5ERVgsIENISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX1ZJRVcsIEV4cGFuZG9JbnN0cnVjdGlvbnMsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBJTkpFQ1RPUiwgSW5pdFBoYXNlU3RhdGUsIExWaWV3LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFFVRVJJRVMsIFJFTkRFUkVSLCBSRU5ERVJFUl9GQUNUT1JZLCBSb290Q29udGV4dCwgUm9vdENvbnRleHRGbGFncywgU0FOSVRJWkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2lzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0fSBmcm9tICcuLi9ub2RlX3NlbGVjdG9yX21hdGNoZXInO1xuaW1wb3J0IHtlbnRlclZpZXcsIGdldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlLCBnZXRJc1BhcmVudCwgZ2V0TFZpZXcsIGdldE5hbWVzcGFjZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCwgaXNDcmVhdGlvbk1vZGUsIGxlYXZlVmlldywgcmVzZXRDb21wb25lbnRTdGF0ZSwgc2V0QWN0aXZlSG9zdEVsZW1lbnQsIHNldEJpbmRpbmdSb290LCBzZXRDaGVja05vQ2hhbmdlc01vZGUsIHNldEN1cnJlbnREaXJlY3RpdmVEZWYsIHNldEN1cnJlbnRRdWVyeUluZGV4LCBzZXRJc1BhcmVudCwgc2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4LCDOlG5hbWVzcGFjZUhUTUx9IGZyb20gJy4uL3N0YXRlJztcbmltcG9ydCB7aW5pdGlhbGl6ZVN0YXRpY0NvbnRleHQgYXMgaW5pdGlhbGl6ZVN0YXRpY1N0eWxpbmdDb250ZXh0fSBmcm9tICcuLi9zdHlsaW5nL2NsYXNzX2FuZF9zdHlsZV9iaW5kaW5ncyc7XG5pbXBvcnQge0FOSU1BVElPTl9QUk9QX1BSRUZJWCwgaXNBbmltYXRpb25Qcm9wfSBmcm9tICcuLi9zdHlsaW5nL3V0aWwnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge2F0dHJzU3R5bGluZ0luZGV4T2Z9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiwgcmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRMVmlld1BhcmVudCwgZ2V0Um9vdENvbnRleHR9IGZyb20gJy4uL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgZ2V0VE5vZGUsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgaXNDb250ZW50UXVlcnlIb3N0LCBpc1Jvb3RWaWV3LCByZWFkUGF0Y2hlZExWaWV3LCByZXNldFByZU9yZGVySG9va0ZsYWdzLCB1bndyYXBSTm9kZSwgdmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcn0gZnJvbSAnLi4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogQSBwZXJtYW5lbnQgbWFya2VyIHByb21pc2Ugd2hpY2ggc2lnbmlmaWVzIHRoYXQgdGhlIGN1cnJlbnQgQ0QgdHJlZSBpc1xuICogY2xlYW4uXG4gKi9cbmNvbnN0IF9DTEVBTl9QUk9NSVNFID0gUHJvbWlzZS5yZXNvbHZlKG51bGwpO1xuXG5leHBvcnQgY29uc3QgZW51bSBCaW5kaW5nRGlyZWN0aW9uIHtcbiAgSW5wdXQsXG4gIE91dHB1dCxcbn1cblxuLyoqXG4gKiBSZWZyZXNoZXMgdGhlIHZpZXcsIGV4ZWN1dGluZyB0aGUgZm9sbG93aW5nIHN0ZXBzIGluIHRoYXQgb3JkZXI6XG4gKiB0cmlnZ2VycyBpbml0IGhvb2tzLCByZWZyZXNoZXMgZHluYW1pYyBlbWJlZGRlZCB2aWV3cywgdHJpZ2dlcnMgY29udGVudCBob29rcywgc2V0cyBob3N0XG4gKiBiaW5kaW5ncywgcmVmcmVzaGVzIGNoaWxkIGNvbXBvbmVudHMuXG4gKiBOb3RlOiB2aWV3IGhvb2tzIGFyZSB0cmlnZ2VyZWQgbGF0ZXIgd2hlbiBsZWF2aW5nIHRoZSB2aWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaERlc2NlbmRhbnRWaWV3cyhsVmlldzogTFZpZXcpIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGNyZWF0aW9uTW9kZSA9IGlzQ3JlYXRpb25Nb2RlKGxWaWV3KTtcblxuICAvLyBUaGlzIG5lZWRzIHRvIGJlIHNldCBiZWZvcmUgY2hpbGRyZW4gYXJlIHByb2Nlc3NlZCB0byBzdXBwb3J0IHJlY3Vyc2l2ZSBjb21wb25lbnRzXG4gIHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzID0gZmFsc2U7XG5cbiAgLy8gUmVzZXR0aW5nIHRoZSBiaW5kaW5nSW5kZXggb2YgdGhlIGN1cnJlbnQgTFZpZXcgYXMgdGhlIG5leHQgc3RlcHMgbWF5IHRyaWdnZXIgY2hhbmdlIGRldGVjdGlvbi5cbiAgbFZpZXdbQklORElOR19JTkRFWF0gPSB0Vmlldy5iaW5kaW5nU3RhcnRJbmRleDtcblxuICAvLyBJZiB0aGlzIGlzIGEgY3JlYXRpb24gcGFzcywgd2Ugc2hvdWxkIG5vdCBjYWxsIGxpZmVjeWNsZSBob29rcyBvciBldmFsdWF0ZSBiaW5kaW5ncy5cbiAgLy8gVGhpcyB3aWxsIGJlIGRvbmUgaW4gdGhlIHVwZGF0ZSBwYXNzLlxuICBpZiAoIWNyZWF0aW9uTW9kZSkge1xuICAgIGNvbnN0IGNoZWNrTm9DaGFuZ2VzTW9kZSA9IGdldENoZWNrTm9DaGFuZ2VzTW9kZSgpO1xuXG4gICAgZXhlY3V0ZVByZU9yZGVySG9va3MobFZpZXcsIHRWaWV3LCBjaGVja05vQ2hhbmdlc01vZGUsIHVuZGVmaW5lZCk7XG5cbiAgICByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXcpO1xuXG4gICAgLy8gQ29udGVudCBxdWVyeSByZXN1bHRzIG11c3QgYmUgcmVmcmVzaGVkIGJlZm9yZSBjb250ZW50IGhvb2tzIGFyZSBjYWxsZWQuXG4gICAgcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3LCBsVmlldyk7XG5cbiAgICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgICBleGVjdXRlSG9va3MoXG4gICAgICAgIGxWaWV3LCB0Vmlldy5jb250ZW50SG9va3MsIHRWaWV3LmNvbnRlbnRDaGVja0hvb2tzLCBjaGVja05vQ2hhbmdlc01vZGUsXG4gICAgICAgIEluaXRQaGFzZVN0YXRlLkFmdGVyQ29udGVudEluaXRIb29rc1RvQmVSdW4sIHVuZGVmaW5lZCk7XG5cbiAgICBzZXRIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3KTtcbiAgfVxuXG4gIC8vIFdlIHJlc29sdmUgY29udGVudCBxdWVyaWVzIHNwZWNpZmljYWxseSBtYXJrZWQgYXMgYHN0YXRpY2AgaW4gY3JlYXRpb24gbW9kZS4gRHluYW1pY1xuICAvLyBjb250ZW50IHF1ZXJpZXMgYXJlIHJlc29sdmVkIGR1cmluZyBjaGFuZ2UgZGV0ZWN0aW9uIChpLmUuIHVwZGF0ZSBtb2RlKSwgYWZ0ZXIgZW1iZWRkZWRcbiAgLy8gdmlld3MgYXJlIHJlZnJlc2hlZCAoc2VlIGJsb2NrIGFib3ZlKS5cbiAgaWYgKGNyZWF0aW9uTW9kZSAmJiB0Vmlldy5zdGF0aWNDb250ZW50UXVlcmllcykge1xuICAgIHJlZnJlc2hDb250ZW50UXVlcmllcyh0VmlldywgbFZpZXcpO1xuICB9XG5cbiAgcmVmcmVzaENoaWxkQ29tcG9uZW50cyh0Vmlldy5jb21wb25lbnRzKTtcbn1cblxuXG4vKiogU2V0cyB0aGUgaG9zdCBiaW5kaW5ncyBmb3IgdGhlIGN1cnJlbnQgdmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcpOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnMpIHtcbiAgICBsZXQgYmluZGluZ1Jvb3RJbmRleCA9IHZpZXdEYXRhW0JJTkRJTkdfSU5ERVhdID0gdFZpZXcuZXhwYW5kb1N0YXJ0SW5kZXg7XG4gICAgc2V0QmluZGluZ1Jvb3QoYmluZGluZ1Jvb3RJbmRleCk7XG4gICAgbGV0IGN1cnJlbnREaXJlY3RpdmVJbmRleCA9IC0xO1xuICAgIGxldCBjdXJyZW50RWxlbWVudEluZGV4ID0gLTE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBpbnN0cnVjdGlvbiA9IHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbaV07XG4gICAgICBpZiAodHlwZW9mIGluc3RydWN0aW9uID09PSAnbnVtYmVyJykge1xuICAgICAgICBpZiAoaW5zdHJ1Y3Rpb24gPD0gMCkge1xuICAgICAgICAgIC8vIE5lZ2F0aXZlIG51bWJlcnMgbWVhbiB0aGF0IHdlIGFyZSBzdGFydGluZyBuZXcgRVhQQU5ETyBibG9jayBhbmQgbmVlZCB0byB1cGRhdGVcbiAgICAgICAgICAvLyB0aGUgY3VycmVudCBlbGVtZW50IGFuZCBkaXJlY3RpdmUgaW5kZXguXG4gICAgICAgICAgY3VycmVudEVsZW1lbnRJbmRleCA9IC1pbnN0cnVjdGlvbjtcbiAgICAgICAgICBzZXRBY3RpdmVIb3N0RWxlbWVudChjdXJyZW50RWxlbWVudEluZGV4KTtcblxuICAgICAgICAgIC8vIEluamVjdG9yIGJsb2NrIGFuZCBwcm92aWRlcnMgYXJlIHRha2VuIGludG8gYWNjb3VudC5cbiAgICAgICAgICBjb25zdCBwcm92aWRlckNvdW50ID0gKHRWaWV3LmV4cGFuZG9JbnN0cnVjdGlvbnNbKytpXSBhcyBudW1iZXIpO1xuICAgICAgICAgIGJpbmRpbmdSb290SW5kZXggKz0gSU5KRUNUT1JfQkxPT01fUEFSRU5UX1NJWkUgKyBwcm92aWRlckNvdW50O1xuXG4gICAgICAgICAgY3VycmVudERpcmVjdGl2ZUluZGV4ID0gYmluZGluZ1Jvb3RJbmRleDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBUaGlzIGlzIGVpdGhlciB0aGUgaW5qZWN0b3Igc2l6ZSAoc28gdGhlIGJpbmRpbmcgcm9vdCBjYW4gc2tpcCBvdmVyIGRpcmVjdGl2ZXNcbiAgICAgICAgICAvLyBhbmQgZ2V0IHRvIHRoZSBmaXJzdCBzZXQgb2YgaG9zdCBiaW5kaW5ncyBvbiB0aGlzIG5vZGUpIG9yIHRoZSBob3N0IHZhciBjb3VudFxuICAgICAgICAgIC8vICh0byBnZXQgdG8gdGhlIG5leHQgc2V0IG9mIGhvc3QgYmluZGluZ3Mgb24gdGhpcyBub2RlKS5cbiAgICAgICAgICBiaW5kaW5nUm9vdEluZGV4ICs9IGluc3RydWN0aW9uO1xuICAgICAgICB9XG4gICAgICAgIHNldEJpbmRpbmdSb290KGJpbmRpbmdSb290SW5kZXgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgaXQncyBub3QgYSBudW1iZXIsIGl0J3MgYSBob3N0IGJpbmRpbmcgZnVuY3Rpb24gdGhhdCBuZWVkcyB0byBiZSBleGVjdXRlZC5cbiAgICAgICAgaWYgKGluc3RydWN0aW9uICE9PSBudWxsKSB7XG4gICAgICAgICAgdmlld0RhdGFbQklORElOR19JTkRFWF0gPSBiaW5kaW5nUm9vdEluZGV4O1xuICAgICAgICAgIGNvbnN0IGhvc3RDdHggPSB1bndyYXBSTm9kZSh2aWV3RGF0YVtjdXJyZW50RGlyZWN0aXZlSW5kZXhdKTtcbiAgICAgICAgICBpbnN0cnVjdGlvbihSZW5kZXJGbGFncy5VcGRhdGUsIGhvc3RDdHgsIGN1cnJlbnRFbGVtZW50SW5kZXgpO1xuXG4gICAgICAgICAgLy8gRWFjaCBkaXJlY3RpdmUgZ2V0cyBhIHVuaXF1ZUlkIHZhbHVlIHRoYXQgaXMgdGhlIHNhbWUgZm9yIGJvdGhcbiAgICAgICAgICAvLyBjcmVhdGUgYW5kIHVwZGF0ZSBjYWxscyB3aGVuIHRoZSBob3N0QmluZGluZ3MgZnVuY3Rpb24gaXMgY2FsbGVkLiBUaGVcbiAgICAgICAgICAvLyBkaXJlY3RpdmUgdW5pcXVlSWQgaXMgbm90IHNldCBhbnl3aGVyZS0taXQgaXMganVzdCBpbmNyZW1lbnRlZCBiZXR3ZWVuXG4gICAgICAgICAgLy8gZWFjaCBob3N0QmluZGluZ3MgY2FsbCBhbmQgaXMgdXNlZnVsIGZvciBoZWxwaW5nIGluc3RydWN0aW9uIGNvZGVcbiAgICAgICAgICAvLyB1bmlxdWVseSBkZXRlcm1pbmUgd2hpY2ggZGlyZWN0aXZlIGlzIGN1cnJlbnRseSBhY3RpdmUgd2hlbiBleGVjdXRlZC5cbiAgICAgICAgICBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnREaXJlY3RpdmVJbmRleCsrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBzZXRBY3RpdmVIb3N0RWxlbWVudChudWxsKTtcbn1cblxuLyoqIFJlZnJlc2hlcyBjb250ZW50IHF1ZXJpZXMgZm9yIGFsbCBkaXJlY3RpdmVzIGluIHRoZSBnaXZlbiB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGlmICh0Vmlldy5jb250ZW50UXVlcmllcyAhPSBudWxsKSB7XG4gICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0Vmlldy5jb250ZW50UXVlcmllcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuY29udGVudFF1ZXJpZXNbaV07XG4gICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZURlZklkeF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcywgJ2NvbnRlbnRRdWVyaWVzIGZ1bmN0aW9uIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMgIShSZW5kZXJGbGFncy5VcGRhdGUsIGxWaWV3W2RpcmVjdGl2ZURlZklkeF0sIGRpcmVjdGl2ZURlZklkeCk7XG4gICAgfVxuICB9XG59XG5cbi8qKiBSZWZyZXNoZXMgY2hpbGQgY29tcG9uZW50cyBpbiB0aGUgY3VycmVudCB2aWV3LiAqL1xuZnVuY3Rpb24gcmVmcmVzaENoaWxkQ29tcG9uZW50cyhjb21wb25lbnRzOiBudW1iZXJbXSB8IG51bGwpOiB2b2lkIHtcbiAgaWYgKGNvbXBvbmVudHMgIT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgY29tcG9uZW50UmVmcmVzaChjb21wb25lbnRzW2ldKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKipcbiAqIENyZWF0ZXMgYSBuYXRpdmUgZWxlbWVudCBmcm9tIGEgdGFnIG5hbWUsIHVzaW5nIGEgcmVuZGVyZXIuXG4gKiBAcGFyYW0gbmFtZSB0aGUgdGFnIG5hbWVcbiAqIEBwYXJhbSBvdmVycmlkZGVuUmVuZGVyZXIgT3B0aW9uYWwgQSByZW5kZXJlciB0byBvdmVycmlkZSB0aGUgZGVmYXVsdCBvbmVcbiAqIEByZXR1cm5zIHRoZSBlbGVtZW50IGNyZWF0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRDcmVhdGUobmFtZTogc3RyaW5nLCBvdmVycmlkZGVuUmVuZGVyZXI/OiBSZW5kZXJlcjMpOiBSRWxlbWVudCB7XG4gIGxldCBuYXRpdmU6IFJFbGVtZW50O1xuICBjb25zdCByZW5kZXJlclRvVXNlID0gb3ZlcnJpZGRlblJlbmRlcmVyIHx8IGdldExWaWV3KClbUkVOREVSRVJdO1xuXG4gIGNvbnN0IG5hbWVzcGFjZSA9IGdldE5hbWVzcGFjZSgpO1xuXG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlclRvVXNlKSkge1xuICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lLCBuYW1lc3BhY2UpO1xuICB9IGVsc2Uge1xuICAgIGlmIChuYW1lc3BhY2UgPT09IG51bGwpIHtcbiAgICAgIG5hdGl2ZSA9IHJlbmRlcmVyVG9Vc2UuY3JlYXRlRWxlbWVudChuYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmF0aXZlID0gcmVuZGVyZXJUb1VzZS5jcmVhdGVFbGVtZW50TlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG5hdGl2ZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlldyB8IG51bGwsIHRWaWV3OiBUVmlldywgY29udGV4dDogVCB8IG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLFxuICAgIGhvc3Q6IFJFbGVtZW50IHwgbnVsbCwgdEhvc3ROb2RlOiBUVmlld05vZGUgfCBURWxlbWVudE5vZGUgfCBudWxsLFxuICAgIHJlbmRlcmVyRmFjdG9yeT86IFJlbmRlcmVyRmFjdG9yeTMgfCBudWxsLCByZW5kZXJlcj86IFJlbmRlcmVyMyB8IG51bGwsXG4gICAgc2FuaXRpemVyPzogU2FuaXRpemVyIHwgbnVsbCwgaW5qZWN0b3I/OiBJbmplY3RvciB8IG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbUkVOREVSRVJfRkFDVE9SWV0gPSAocmVuZGVyZXJGYWN0b3J5IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSX0ZBQ1RPUlldKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl9GQUNUT1JZXSwgJ1JlbmRlcmVyRmFjdG9yeSBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tSRU5ERVJFUl0gPSAocmVuZGVyZXIgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbUkVOREVSRVJdKSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tTQU5JVElaRVJdID0gc2FuaXRpemVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1NBTklUSVpFUl0gfHwgbnVsbCAhO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhdHRhY2hMVmlld0RlYnVnKGxWaWV3KTtcbiAgcmV0dXJuIGxWaWV3O1xufVxuXG4vKipcbiAqIENyZWF0ZSBhbmQgc3RvcmVzIHRoZSBUTm9kZSwgYW5kIGhvb2tzIGl0IHVwIHRvIHRoZSB0cmVlLlxuICpcbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50LCBuYXRpdmU6IFJFbGVtZW50IHwgUlRleHQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogc3RyaW5nIHwgbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLlByb2plY3Rpb24sIG5hdGl2ZTogbnVsbCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLCBuYXRpdmU6IFJDb21tZW50LCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUF0SW5kZXgoXG4gICAgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkljdUNvbnRhaW5lciwgbmF0aXZlOiBSQ29tbWVudCwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVBdEluZGV4KFxuICAgIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmF0aXZlOiBSVGV4dCB8IFJFbGVtZW50IHwgUkNvbW1lbnQgfCBudWxsLCBuYW1lOiBzdHJpbmcgfCBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlcyB8IG51bGwpOiBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZcbiAgICBUSWN1Q29udGFpbmVyTm9kZSB7XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IGFkanVzdGVkSW5kZXggPSBpbmRleCArIEhFQURFUl9PRkZTRVQ7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oYWRqdXN0ZWRJbmRleCwgbFZpZXcubGVuZ3RoLCBgU2xvdCBzaG91bGQgaGF2ZSBiZWVuIGluaXRpYWxpemVkIHdpdGggbnVsbGApO1xuICBsVmlld1thZGp1c3RlZEluZGV4XSA9IG5hdGl2ZTtcblxuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2FkanVzdGVkSW5kZXhdIGFzIFROb2RlO1xuICBpZiAodE5vZGUgPT0gbnVsbCkge1xuICAgIGNvbnN0IHBhcmVudCA9XG4gICAgICAgIGlzUGFyZW50ID8gcHJldmlvdXNPclBhcmVudFROb2RlIDogcHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5wYXJlbnQ7XG5cbiAgICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcyxcbiAgICAvLyBzbyBpdCdzIG9ubHkgc2V0IGlmIHRoZSB2aWV3IGlzIHRoZSBzYW1lLlxuICAgIGNvbnN0IHBhcmVudEluU2FtZVZpZXcgPSBwYXJlbnQgJiYgcGFyZW50ICE9PSBsVmlld1tUX0hPU1RdO1xuICAgIGNvbnN0IHRQYXJlbnROb2RlID0gcGFyZW50SW5TYW1lVmlldyA/IHBhcmVudCBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSA6IG51bGw7XG5cbiAgICB0Tm9kZSA9IHRWaWV3LmRhdGFbYWRqdXN0ZWRJbmRleF0gPSBjcmVhdGVUTm9kZSh0UGFyZW50Tm9kZSwgdHlwZSwgYWRqdXN0ZWRJbmRleCwgbmFtZSwgYXR0cnMpO1xuICB9XG5cbiAgLy8gTm93IGxpbmsgb3Vyc2VsdmVzIGludG8gdGhlIHRyZWUuXG4gIC8vIFdlIG5lZWQgdGhpcyBldmVuIGlmIHROb2RlIGV4aXN0cywgb3RoZXJ3aXNlIHdlIG1pZ2h0IGVuZCB1cCBwb2ludGluZyB0byB1bmV4aXN0aW5nIHROb2RlcyB3aGVuXG4gIC8vIHdlIHVzZSBpMThuIChlc3BlY2lhbGx5IHdpdGggSUNVIGV4cHJlc3Npb25zIHRoYXQgdXBkYXRlIHRoZSBET00gZHVyaW5nIHRoZSB1cGRhdGUgcGhhc2UpLlxuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlKSB7XG4gICAgaWYgKGlzUGFyZW50ICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9PSBudWxsICYmXG4gICAgICAgICh0Tm9kZS5wYXJlbnQgIT09IG51bGwgfHwgcHJldmlvdXNPclBhcmVudFROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSkge1xuICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgIH0gZWxzZSBpZiAoIWlzUGFyZW50KSB7XG4gICAgICBwcmV2aW91c09yUGFyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgIH1cbiAgfVxuXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09IG51bGwpIHtcbiAgICB0Vmlldy5maXJzdENoaWxkID0gdE5vZGU7XG4gIH1cblxuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUodE5vZGUpO1xuICBzZXRJc1BhcmVudCh0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRWaWV3Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICZcbiAgICAgIFRQcm9qZWN0aW9uTm9kZSAmIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzaWduVFZpZXdOb2RlVG9MVmlldyhcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnROb2RlOiBUTm9kZSB8IG51bGwsIGluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldyk6IFRWaWV3Tm9kZSB7XG4gIC8vIFZpZXcgbm9kZXMgYXJlIG5vdCBzdG9yZWQgaW4gZGF0YSBiZWNhdXNlIHRoZXkgY2FuIGJlIGFkZGVkIC8gcmVtb3ZlZCBhdCBydW50aW1lICh3aGljaFxuICAvLyB3b3VsZCBjYXVzZSBpbmRpY2VzIHRvIGNoYW5nZSkuIFRoZWlyIFROb2RlcyBhcmUgaW5zdGVhZCBzdG9yZWQgaW4gdFZpZXcubm9kZS5cbiAgbGV0IHROb2RlID0gdFZpZXcubm9kZTtcbiAgaWYgKHROb2RlID09IG51bGwpIHtcbiAgICBuZ0Rldk1vZGUgJiYgdFBhcmVudE5vZGUgJiZcbiAgICAgICAgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh0UGFyZW50Tm9kZSwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIHRWaWV3Lm5vZGUgPSB0Tm9kZSA9IGNyZWF0ZVROb2RlKFxuICAgICAgICB0UGFyZW50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IG51bGwsICAvL1xuICAgICAgICBUTm9kZVR5cGUuVmlldywgaW5kZXgsIG51bGwsIG51bGwpIGFzIFRWaWV3Tm9kZTtcbiAgfVxuXG4gIHJldHVybiBsVmlld1tUX0hPU1RdID0gdE5vZGUgYXMgVFZpZXdOb2RlO1xufVxuXG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkgb3IgQ29tcG9uZW50RmFjdG9yeS5jcmVhdGUpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyh2aWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIpIHtcbiAgY29uc3QgdFZpZXcgPSB2aWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgICAgdFZpZXcuYmx1ZXByaW50LnB1c2gobnVsbCk7XG4gICAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gICAgICB2aWV3LnB1c2gobnVsbCk7XG4gICAgfVxuXG4gICAgLy8gV2Ugc2hvdWxkIG9ubHkgaW5jcmVtZW50IHRoZSBleHBhbmRvIHN0YXJ0IGluZGV4IGlmIHRoZXJlIGFyZW4ndCBhbHJlYWR5IGRpcmVjdGl2ZXNcbiAgICAvLyBhbmQgaW5qZWN0b3JzIHNhdmVkIGluIHRoZSBcImV4cGFuZG9cIiBzZWN0aW9uXG4gICAgaWYgKCF0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zKSB7XG4gICAgICB0Vmlldy5leHBhbmRvU3RhcnRJbmRleCArPSBudW1TbG90c1RvQWxsb2M7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNpbmNlIHdlJ3JlIGFkZGluZyB0aGUgZHluYW1pYyBub2RlcyBpbnRvIHRoZSBleHBhbmRvIHNlY3Rpb24sIHdlIG5lZWQgdG8gbGV0IHRoZSBob3N0XG4gICAgICAvLyBiaW5kaW5ncyBrbm93IHRoYXQgdGhleSBzaG91bGQgc2tpcCB4IHNsb3RzXG4gICAgICB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zLnB1c2gobnVtU2xvdHNUb0FsbG9jKTtcbiAgICB9XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBSZW5kZXJcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICpcbiAqIEBwYXJhbSBob3N0Tm9kZSBFeGlzdGluZyBub2RlIHRvIHJlbmRlciBpbnRvLlxuICogQHBhcmFtIHRlbXBsYXRlRm4gVGVtcGxhdGUgZnVuY3Rpb24gd2l0aCB0aGUgaW5zdHJ1Y3Rpb25zLlxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGNvbnRleHQgdG8gcGFzcyBpbnRvIHRoZSB0ZW1wbGF0ZS5cbiAqIEBwYXJhbSBwcm92aWRlZFJlbmRlcmVyRmFjdG9yeSByZW5kZXJlciBmYWN0b3J5IHRvIHVzZVxuICogQHBhcmFtIGhvc3QgVGhlIGhvc3QgZWxlbWVudCBub2RlIHRvIHVzZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgRGlyZWN0aXZlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqIEBwYXJhbSBwaXBlcyBQaXBlIGRlZnMgdGhhdCBzaG91bGQgYmUgdXNlZCBmb3IgbWF0Y2hpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlclRlbXBsYXRlPFQ+KFxuICAgIGhvc3ROb2RlOiBSRWxlbWVudCwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsIGNvbnRleHQ6IFQsXG4gICAgcHJvdmlkZWRSZW5kZXJlckZhY3Rvcnk6IFJlbmRlcmVyRmFjdG9yeTMsIGNvbXBvbmVudFZpZXc6IExWaWV3IHwgbnVsbCxcbiAgICBkaXJlY3RpdmVzPzogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzPzogUGlwZURlZkxpc3RPckZhY3RvcnkgfCBudWxsLFxuICAgIHNhbml0aXplcj86IFNhbml0aXplciB8IG51bGwpOiBMVmlldyB7XG4gIGlmIChjb21wb25lbnRWaWV3ID09PSBudWxsKSB7XG4gICAgcmVzZXRDb21wb25lbnRTdGF0ZSgpO1xuICAgIGNvbnN0IHJlbmRlcmVyID0gcHJvdmlkZWRSZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNyZWF0ZSBhIHJvb3QgdmlldyBzbyBpdCdzIHBvc3NpYmxlIHRvIGxvb2sgdXAgdGhlIGhvc3QgZWxlbWVudCB0aHJvdWdoIGl0cyBpbmRleFxuICAgIGNvbnN0IGhvc3RMVmlldyA9IGNyZWF0ZUxWaWV3KFxuICAgICAgICBudWxsLCBjcmVhdGVUVmlldygtMSwgbnVsbCwgMSwgMCwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCksIHt9LFxuICAgICAgICBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzIHwgTFZpZXdGbGFncy5Jc1Jvb3QsIG51bGwsIG51bGwsIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlcik7XG4gICAgZW50ZXJWaWV3KGhvc3RMVmlldywgbnVsbCk7ICAvLyBTVVNQRUNUISB3aHkgZG8gd2UgbmVlZCB0byBlbnRlciB0aGUgVmlldz9cblxuICAgIGNvbnN0IGNvbXBvbmVudFRWaWV3ID1cbiAgICAgICAgZ2V0T3JDcmVhdGVUVmlldyh0ZW1wbGF0ZUZuLCBjb25zdHMsIHZhcnMsIGRpcmVjdGl2ZXMgfHwgbnVsbCwgcGlwZXMgfHwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgY29uc3QgaG9zdFROb2RlID0gY3JlYXRlTm9kZUF0SW5kZXgoMCwgVE5vZGVUeXBlLkVsZW1lbnQsIGhvc3ROb2RlLCBudWxsLCBudWxsKTtcbiAgICBjb21wb25lbnRWaWV3ID0gY3JlYXRlTFZpZXcoXG4gICAgICAgIGhvc3RMVmlldywgY29tcG9uZW50VFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIGhvc3ROb2RlLCBob3N0VE5vZGUsXG4gICAgICAgIHByb3ZpZGVkUmVuZGVyZXJGYWN0b3J5LCByZW5kZXJlciwgc2FuaXRpemVyKTtcbiAgfVxuICByZW5kZXJDb21wb25lbnRPclRlbXBsYXRlKGNvbXBvbmVudFZpZXcsIGNvbnRleHQsIHRlbXBsYXRlRm4pO1xuICByZXR1cm4gY29tcG9uZW50Vmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciBjcmVhdGluZyB0aGUgTFZpZXdOb2RlIG9mIGEgZHluYW1pYyBlbWJlZGRlZCB2aWV3LFxuICogZWl0aGVyIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKSBvciBUZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoKS5cbiAqIFN1Y2ggbFZpZXdOb2RlIHdpbGwgdGhlbiBiZSByZW5kZXJlciB3aXRoIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUoKSAoc2VlIGJlbG93KS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVtYmVkZGVkVmlld0FuZE5vZGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBULCBkZWNsYXJhdGlvblZpZXc6IExWaWV3LCBxdWVyaWVzOiBMUXVlcmllcyB8IG51bGwsXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyKTogTFZpZXcge1xuICBjb25zdCBfaXNQYXJlbnQgPSBnZXRJc1BhcmVudCgpO1xuICBjb25zdCBfcHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIHNldElzUGFyZW50KHRydWUpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhKTtcblxuICBjb25zdCBsVmlldyA9IGNyZWF0ZUxWaWV3KGRlY2xhcmF0aW9uVmlldywgdFZpZXcsIGNvbnRleHQsIExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG51bGwsIG51bGwpO1xuICBsVmlld1tERUNMQVJBVElPTl9WSUVXXSA9IGRlY2xhcmF0aW9uVmlldztcblxuICBpZiAocXVlcmllcykge1xuICAgIGxWaWV3W1FVRVJJRVNdID0gcXVlcmllcy5jcmVhdGVWaWV3KCk7XG4gIH1cbiAgYXNzaWduVFZpZXdOb2RlVG9MVmlldyh0VmlldywgbnVsbCwgLTEsIGxWaWV3KTtcblxuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Vmlldy5ub2RlICEuaW5qZWN0b3JJbmRleCA9IGluamVjdG9ySW5kZXg7XG4gIH1cblxuICBzZXRJc1BhcmVudChfaXNQYXJlbnQpO1xuICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUoX3ByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHJldHVybiBsVmlldztcbn1cblxuLyoqXG4gKiBVc2VkIGZvciByZW5kZXJpbmcgZW1iZWRkZWQgdmlld3MgKGUuZy4gZHluYW1pY2FsbHkgY3JlYXRlZCB2aWV3cylcbiAqXG4gKiBEeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG11c3Qgc3RvcmUvcmV0cmlldmUgdGhlaXIgVFZpZXdzIGRpZmZlcmVudGx5IGZyb20gY29tcG9uZW50IHZpZXdzXG4gKiBiZWNhdXNlIHRoZWlyIHRlbXBsYXRlIGZ1bmN0aW9ucyBhcmUgbmVzdGVkIGluIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbnMgb2YgdGhlaXIgaG9zdHMsIGNyZWF0aW5nXG4gKiBjbG9zdXJlcy4gSWYgdGhlaXIgaG9zdCB0ZW1wbGF0ZSBoYXBwZW5zIHRvIGJlIGFuIGVtYmVkZGVkIHRlbXBsYXRlIGluIGEgbG9vcCAoZS5nLiBuZ0ZvciBpbnNpZGVcbiAqIGFuIG5nRm9yKSwgdGhlIG5lc3Rpbmcgd291bGQgbWVhbiB3ZSdkIGhhdmUgbXVsdGlwbGUgaW5zdGFuY2VzIG9mIHRoZSB0ZW1wbGF0ZSBmdW5jdGlvbiwgc28gd2VcbiAqIGNhbid0IHN0b3JlIFRWaWV3cyBpbiB0aGUgdGVtcGxhdGUgZnVuY3Rpb24gaXRzZWxmIChhcyB3ZSBkbyBmb3IgY29tcHMpLiBJbnN0ZWFkLCB3ZSBzdG9yZSB0aGVcbiAqIFRWaWV3IGZvciBkeW5hbWljYWxseSBjcmVhdGVkIHZpZXdzIG9uIHRoZWlyIGhvc3QgVE5vZGUsIHdoaWNoIG9ubHkgaGFzIG9uZSBpbnN0YW5jZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlbmRlckVtYmVkZGVkVGVtcGxhdGU8VD4odmlld1RvUmVuZGVyOiBMVmlldywgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IF9pc1BhcmVudCA9IGdldElzUGFyZW50KCk7XG4gIGNvbnN0IF9wcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbGV0IG9sZFZpZXc6IExWaWV3O1xuICBpZiAodmlld1RvUmVuZGVyW0ZMQUdTXSAmIExWaWV3RmxhZ3MuSXNSb290KSB7XG4gICAgLy8gVGhpcyBpcyBhIHJvb3QgdmlldyBpbnNpZGUgdGhlIHZpZXcgdHJlZVxuICAgIHRpY2tSb290Q29udGV4dChnZXRSb290Q29udGV4dCh2aWV3VG9SZW5kZXIpKTtcbiAgfSBlbHNlIHtcbiAgICB0cnkge1xuICAgICAgc2V0SXNQYXJlbnQodHJ1ZSk7XG4gICAgICBzZXRQcmV2aW91c09yUGFyZW50VE5vZGUobnVsbCAhKTtcblxuICAgICAgb2xkVmlldyA9IGVudGVyVmlldyh2aWV3VG9SZW5kZXIsIHZpZXdUb1JlbmRlcltUX0hPU1RdKTtcbiAgICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3Modmlld1RvUmVuZGVyKTtcbiAgICAgIM6UbmFtZXNwYWNlSFRNTCgpO1xuXG4gICAgICAvLyBSZXNldCB0aGUgc2VsZWN0ZWQgaW5kZXggc28gd2UgY2FuIGFzc2VydCB0aGF0IGBzZWxlY3RgIHdhcyBjYWxsZWQgbGF0ZXJcbiAgICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuXG4gICAgICB0Vmlldy50ZW1wbGF0ZSAhKGdldFJlbmRlckZsYWdzKHZpZXdUb1JlbmRlciksIGNvbnRleHQpO1xuICAgICAgLy8gVGhpcyBtdXN0IGJlIHNldCB0byBmYWxzZSBpbW1lZGlhdGVseSBhZnRlciB0aGUgZmlyc3QgY3JlYXRpb24gcnVuIGJlY2F1c2UgaW4gYW5cbiAgICAgIC8vIG5nRm9yIGxvb3AsIGFsbCB0aGUgdmlld3Mgd2lsbCBiZSBjcmVhdGVkIHRvZ2V0aGVyIGJlZm9yZSB1cGRhdGUgbW9kZSBydW5zIGFuZCB0dXJuc1xuICAgICAgLy8gb2ZmIGZpcnN0VGVtcGxhdGVQYXNzLiBJZiB3ZSBkb24ndCBzZXQgaXQgaGVyZSwgaW5zdGFuY2VzIHdpbGwgcGVyZm9ybSBkaXJlY3RpdmVcbiAgICAgIC8vIG1hdGNoaW5nLCBldGMgYWdhaW4gYW5kIGFnYWluLlxuICAgICAgdmlld1RvUmVuZGVyW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyA9IGZhbHNlO1xuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKHZpZXdUb1JlbmRlcik7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGxlYXZlVmlldyhvbGRWaWV3ICEpO1xuICAgICAgc2V0SXNQYXJlbnQoX2lzUGFyZW50KTtcbiAgICAgIHNldFByZXZpb3VzT3JQYXJlbnRUTm9kZShfcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVuZGVyQ29tcG9uZW50T3JUZW1wbGF0ZTxUPihcbiAgICBob3N0VmlldzogTFZpZXcsIGNvbnRleHQ6IFQsIHRlbXBsYXRlRm4/OiBDb21wb25lbnRUZW1wbGF0ZTxUPikge1xuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBob3N0Vmlld1tSRU5ERVJFUl9GQUNUT1JZXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IG5vcm1hbEV4ZWN1dGlvblBhdGggPSAhZ2V0Q2hlY2tOb0NoYW5nZXNNb2RlKCk7XG4gIGNvbnN0IGNyZWF0aW9uTW9kZUlzQWN0aXZlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuICB0cnkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuYmVnaW4pIHtcbiAgICAgIHJlbmRlcmVyRmFjdG9yeS5iZWdpbigpO1xuICAgIH1cblxuICAgIGlmIChjcmVhdGlvbk1vZGVJc0FjdGl2ZSkge1xuICAgICAgLy8gY3JlYXRpb24gbW9kZSBwYXNzXG4gICAgICBpZiAodGVtcGxhdGVGbikge1xuICAgICAgICDOlG5hbWVzcGFjZUhUTUwoKTtcblxuICAgICAgICAvLyBSZXNldCB0aGUgc2VsZWN0ZWQgaW5kZXggc28gd2UgY2FuIGFzc2VydCB0aGF0IGBzZWxlY3RgIHdhcyBjYWxsZWQgbGF0ZXJcbiAgICAgICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG5cbiAgICAgICAgdGVtcGxhdGVGbihSZW5kZXJGbGFncy5DcmVhdGUsIGNvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAgIGhvc3RWaWV3W0ZMQUdTXSAmPSB+TFZpZXdGbGFncy5DcmVhdGlvbk1vZGU7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIG1vZGUgcGFzc1xuICAgIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MoaG9zdFZpZXcpO1xuICAgIHRlbXBsYXRlRm4gJiYgdGVtcGxhdGVGbihSZW5kZXJGbGFncy5VcGRhdGUsIGNvbnRleHQpO1xuICAgIHJlZnJlc2hEZXNjZW5kYW50Vmlld3MoaG9zdFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChub3JtYWxFeGVjdXRpb25QYXRoICYmICFjcmVhdGlvbk1vZGVJc0FjdGl2ZSAmJiByZW5kZXJlckZhY3RvcnkuZW5kKSB7XG4gICAgICByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gICAgfVxuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgZGVmYXVsdCBjb25maWd1cmF0aW9uIG9mIHJlbmRlcmluZyBmbGFncyBkZXBlbmRpbmcgb24gd2hlbiB0aGVcbiAqIHRlbXBsYXRlIGlzIGluIGNyZWF0aW9uIG1vZGUgb3IgdXBkYXRlIG1vZGUuIFVwZGF0ZSBibG9jayBhbmQgY3JlYXRlIGJsb2NrIGFyZVxuICogYWx3YXlzIHJ1biBzZXBhcmF0ZWx5LlxuICovXG5mdW5jdGlvbiBnZXRSZW5kZXJGbGFncyh2aWV3OiBMVmlldyk6IFJlbmRlckZsYWdzIHtcbiAgcmV0dXJuIGlzQ3JlYXRpb25Nb2RlKHZpZXcpID8gUmVuZGVyRmxhZ3MuQ3JlYXRlIDogUmVuZGVyRmxhZ3MuVXBkYXRlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBFbGVtZW50XG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIEFwcHJvcHJpYXRlbHkgc2V0cyBgc3R5bGluZ1RlbXBsYXRlYCBvbiBhIFROb2RlXG4gKlxuICogRG9lcyBub3QgYXBwbHkgc3R5bGVzIHRvIERPTSBub2Rlc1xuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgbm9kZSB3aG9zZSBgc3R5bGluZ1RlbXBsYXRlYCB0byBzZXRcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlIGFycmF5IHNvdXJjZSB0byBzZXQgdGhlIGF0dHJpYnV0ZXMgZnJvbVxuICogQHBhcmFtIGF0dHJzU3RhcnRJbmRleCBPcHRpb25hbCBzdGFydCBpbmRleCB0byBzdGFydCBwcm9jZXNzaW5nIHRoZSBgYXR0cnNgIGZyb21cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNldE5vZGVTdHlsaW5nVGVtcGxhdGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGF0dHJzOiBUQXR0cmlidXRlcywgYXR0cnNTdGFydEluZGV4OiBudW1iZXIpIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzICYmICF0Tm9kZS5zdHlsaW5nVGVtcGxhdGUpIHtcbiAgICBjb25zdCBzdHlsaW5nQXR0cnNTdGFydEluZGV4ID0gYXR0cnNTdHlsaW5nSW5kZXhPZihhdHRycywgYXR0cnNTdGFydEluZGV4KTtcbiAgICBpZiAoc3R5bGluZ0F0dHJzU3RhcnRJbmRleCA+PSAwKSB7XG4gICAgICB0Tm9kZS5zdHlsaW5nVGVtcGxhdGUgPSBpbml0aWFsaXplU3RhdGljU3R5bGluZ0NvbnRleHQoYXR0cnMsIHN0eWxpbmdBdHRyc1N0YXJ0SW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZUNvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpIHtcbiAgaWYgKGlzQ29udGVudFF1ZXJ5SG9zdCh0Tm9kZSkpIHtcbiAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLmNvbnRlbnRRdWVyaWVzKSB7XG4gICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzIGFuZCBwb3B1bGF0ZXMgbG9jYWwgcmVmcy5cbiAqXG4gKiBAcGFyYW0gbG9jYWxSZWZzIExvY2FsIHJlZnMgb2YgdGhlIG5vZGUgaW4gcXVlc3Rpb25cbiAqIEBwYXJhbSBsb2NhbFJlZkV4dHJhY3RvciBtYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZXh0cmFjdHMgbG9jYWwgcmVmIHZhbHVlIGZyb20gVE5vZGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZXNBbmRMb2NhbHMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGxvY2FsUmVmczogc3RyaW5nW10gfCBudWxsIHwgdW5kZWZpbmVkLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpIHtcbiAgaWYgKCFnZXRCaW5kaW5nc0VuYWJsZWQoKSkgcmV0dXJuO1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbmdEZXZNb2RlICYmIG5nRGV2TW9kZS5maXJzdFRlbXBsYXRlUGFzcysrO1xuICAgIHJlc29sdmVEaXJlY3RpdmVzKFxuICAgICAgICB0VmlldywgbFZpZXcsIGZpbmREaXJlY3RpdmVNYXRjaGVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKSxcbiAgICAgICAgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZnMgfHwgbnVsbCk7XG4gIH1cbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlKTtcbiAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIHNhdmVSZXNvbHZlZExvY2Fsc0luRGF0YShsVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlLCBsb2NhbFJlZkV4dHJhY3Rvcik7XG59XG5cbi8qKlxuICogVGFrZXMgYSBsaXN0IG9mIGxvY2FsIG5hbWVzIGFuZCBpbmRpY2VzIGFuZCBwdXNoZXMgdGhlIHJlc29sdmVkIGxvY2FsIHZhcmlhYmxlIHZhbHVlc1xuICogdG8gTFZpZXcgaW4gdGhlIHNhbWUgb3JkZXIgYXMgdGhleSBhcmUgbG9hZGVkIGluIHRoZSB0ZW1wbGF0ZSB3aXRoIGxvYWQoKS5cbiAqL1xuZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFROb2RlLCBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUaGUgdGVtcGxhdGUgZnJvbSB3aGljaCB0byBnZXQgc3RhdGljIGRhdGFcbiAqIEBwYXJhbSBjb25zdHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdmlld1xuICogQHBhcmFtIHZhcnMgVGhlIG51bWJlciBvZiBiaW5kaW5ncyBhbmQgcHVyZSBmdW5jdGlvbiBiaW5kaW5ncyBpbiB0aGlzIHZpZXdcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIERpcmVjdGl2ZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gcGlwZXMgUGlwZSBkZWZzIHRoYXQgc2hvdWxkIGJlIHNhdmVkIG9uIFRWaWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcnkgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEBwYXJhbSBzY2hlbWFzIFNjaGVtYXMgdGhhdCBzaG91bGQgYmUgc2F2ZWQgb24gVFZpZXdcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3KFxuICAgIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT4sIGNvbnN0czogbnVtYmVyLCB2YXJzOiBudW1iZXIsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeSB8IG51bGwsXG4gICAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT58IG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW10gfCBudWxsKTogVFZpZXcge1xuICAvLyBUT0RPKG1pc2tvKTogcmVhZGluZyBgbmdQcml2YXRlRGF0YWAgaGVyZSBpcyBwcm9ibGVtYXRpYyBmb3IgdHdvIHJlYXNvbnNcbiAgLy8gMS4gSXQgaXMgYSBtZWdhbW9ycGhpYyBjYWxsIG9uIGVhY2ggaW52b2NhdGlvbi5cbiAgLy8gMi4gRm9yIG5lc3RlZCBlbWJlZGRlZCB2aWV3cyAobmdGb3IgaW5zaWRlIG5nRm9yKSB0aGUgdGVtcGxhdGUgaW5zdGFuY2UgaXMgcGVyXG4gIC8vICAgIG91dGVyIHRlbXBsYXRlIGludm9jYXRpb24sIHdoaWNoIG1lYW5zIHRoYXQgbm8gc3VjaCBwcm9wZXJ0eSB3aWxsIGV4aXN0XG4gIC8vIENvcnJlY3Qgc29sdXRpb24gaXMgdG8gb25seSBwdXQgYG5nUHJpdmF0ZURhdGFgIG9uIHRoZSBDb21wb25lbnQgdGVtcGxhdGVcbiAgLy8gYW5kIG5vdCBvbiBlbWJlZGRlZCB0ZW1wbGF0ZXMuXG5cbiAgcmV0dXJuIHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSB8fFxuICAgICAgKHRlbXBsYXRlRm4ubmdQcml2YXRlRGF0YSA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgICAtMSwgdGVtcGxhdGVGbiwgY29uc3RzLCB2YXJzLCBkaXJlY3RpdmVzLCBwaXBlcywgdmlld1F1ZXJ5LCBzY2hlbWFzKSBhcyBuZXZlcik7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHZpZXdJbmRleCBUaGUgdmlld0Jsb2NrSWQgZm9yIGlubGluZSB2aWV3cywgb3IgLTEgaWYgaXQncyBhIGNvbXBvbmVudC9keW5hbWljXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGNvbnN0cyBUaGUgbnVtYmVyIG9mIG5vZGVzLCBsb2NhbCByZWZzLCBhbmQgcGlwZXMgaW4gdGhpcyB0ZW1wbGF0ZVxuICogQHBhcmFtIGRpcmVjdGl2ZXMgUmVnaXN0cnkgb2YgZGlyZWN0aXZlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gcGlwZXMgUmVnaXN0cnkgb2YgcGlwZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHZpZXdRdWVyeSBWaWV3IHF1ZXJpZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHNjaGVtYXMgU2NoZW1hcyBmb3IgdGhpcyB2aWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUVmlldyhcbiAgICB2aWV3SW5kZXg6IG51bWJlciwgdGVtcGxhdGVGbjogQ29tcG9uZW50VGVtcGxhdGU8YW55PnwgbnVsbCwgY29uc3RzOiBudW1iZXIsIHZhcnM6IG51bWJlcixcbiAgICBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5IHwgbnVsbCxcbiAgICB2aWV3UXVlcnk6IFZpZXdRdWVyaWVzRnVuY3Rpb248YW55PnwgbnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXSB8IG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgY29uc3RzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIHJldHVybiBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IHtcbiAgICBpZDogdmlld0luZGV4LFxuICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgIHZpZXdRdWVyeTogdmlld1F1ZXJ5LFxuICAgIG5vZGU6IG51bGwgISxcbiAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgdmlld1F1ZXJ5U3RhcnRJbmRleDogaW5pdGlhbFZpZXdMZW5ndGgsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgIGV4cGFuZG9JbnN0cnVjdGlvbnM6IG51bGwsXG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IHRydWUsXG4gICAgc3RhdGljVmlld1F1ZXJpZXM6IGZhbHNlLFxuICAgIHN0YXRpY0NvbnRlbnRRdWVyaWVzOiBmYWxzZSxcbiAgICBwcmVPcmRlckhvb2tzOiBudWxsLFxuICAgIHByZU9yZGVyQ2hlY2tIb29rczogbnVsbCxcbiAgICBjb250ZW50SG9va3M6IG51bGwsXG4gICAgY29udGVudENoZWNrSG9va3M6IG51bGwsXG4gICAgdmlld0hvb2tzOiBudWxsLFxuICAgIHZpZXdDaGVja0hvb2tzOiBudWxsLFxuICAgIGRlc3Ryb3lIb29rczogbnVsbCxcbiAgICBjbGVhbnVwOiBudWxsLFxuICAgIGNvbnRlbnRRdWVyaWVzOiBudWxsLFxuICAgIGNvbXBvbmVudHM6IG51bGwsXG4gICAgZGlyZWN0aXZlUmVnaXN0cnk6IHR5cGVvZiBkaXJlY3RpdmVzID09PSAnZnVuY3Rpb24nID8gZGlyZWN0aXZlcygpIDogZGlyZWN0aXZlcyxcbiAgICBwaXBlUmVnaXN0cnk6IHR5cGVvZiBwaXBlcyA9PT0gJ2Z1bmN0aW9uJyA/IHBpcGVzKCkgOiBwaXBlcyxcbiAgICBmaXJzdENoaWxkOiBudWxsLFxuICAgIHNjaGVtYXM6IHNjaGVtYXMsXG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gbmV3IEFycmF5KGluaXRpYWxWaWV3TGVuZ3RoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLmZpbGwobnVsbCwgMCwgYmluZGluZ1N0YXJ0SW5kZXgpXG4gICAgICAgICAgICAgICAgICAgICAgICAuZmlsbChOT19DSEFOR0UsIGJpbmRpbmdTdGFydEluZGV4KSBhcyBMVmlldztcbiAgYmx1ZXByaW50W0JJTkRJTkdfSU5ERVhdID0gYmluZGluZ1N0YXJ0SW5kZXg7XG4gIHJldHVybiBibHVlcHJpbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFcnJvcih0ZXh0OiBzdHJpbmcsIHRva2VuOiBhbnkpIHtcbiAgcmV0dXJuIG5ldyBFcnJvcihgUmVuZGVyZXI6ICR7dGV4dH0gWyR7cmVuZGVyU3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgZmFjdG9yeTogUmVuZGVyZXJGYWN0b3J5MywgZWxlbWVudE9yU2VsZWN0b3I6IFJFbGVtZW50IHwgc3RyaW5nKTogUkVsZW1lbnR8bnVsbCB7XG4gIGNvbnN0IGRlZmF1bHRSZW5kZXJlciA9IGZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobnVsbCwgbnVsbCk7XG4gIGNvbnN0IHJOb2RlID0gdHlwZW9mIGVsZW1lbnRPclNlbGVjdG9yID09PSAnc3RyaW5nJyA/XG4gICAgICAoaXNQcm9jZWR1cmFsUmVuZGVyZXIoZGVmYXVsdFJlbmRlcmVyKSA/XG4gICAgICAgICAgIGRlZmF1bHRSZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvcikgOlxuICAgICAgICAgICBkZWZhdWx0UmVuZGVyZXIucXVlcnlTZWxlY3RvcihlbGVtZW50T3JTZWxlY3RvcikpIDpcbiAgICAgIGVsZW1lbnRPclNlbGVjdG9yO1xuICBpZiAobmdEZXZNb2RlICYmICFyTm9kZSkge1xuICAgIGlmICh0eXBlb2YgZWxlbWVudE9yU2VsZWN0b3IgPT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBjcmVhdGVFcnJvcignSG9zdCBub2RlIHdpdGggc2VsZWN0b3Igbm90IGZvdW5kOicsIGVsZW1lbnRPclNlbGVjdG9yKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgY3JlYXRlRXJyb3IoJ0hvc3Qgbm9kZSBpcyByZXF1aXJlZDonLCBlbGVtZW50T3JTZWxlY3Rvcik7XG4gICAgfVxuICB9XG4gIHJldHVybiByTm9kZTtcbn1cblxuLyoqXG4gKiBTYXZlcyBjb250ZXh0IGZvciB0aGlzIGNsZWFudXAgZnVuY3Rpb24gaW4gTFZpZXcuY2xlYW51cEluc3RhbmNlcy5cbiAqXG4gKiBPbiB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgc2F2ZXMgaW4gVFZpZXc6XG4gKiAtIENsZWFudXAgZnVuY3Rpb25cbiAqIC0gSW5kZXggb2YgY29udGV4dCB3ZSBqdXN0IHNhdmVkIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0KGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0Q2xlYW51cChsVmlldyk7XG4gIGxDbGVhbnVwLnB1c2goY29udGV4dCk7XG5cbiAgaWYgKGxWaWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cChsVmlldykucHVzaChjbGVhbnVwRm4sIGxDbGVhbnVwLmxlbmd0aCAtIDEpO1xuICB9XG59XG5cbi8qKlxuICogU2F2ZXMgdGhlIGNsZWFudXAgZnVuY3Rpb24gaXRzZWxmIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgZm9yIGZ1bmN0aW9ucyB0aGF0IGFyZSB3cmFwcGVkIHdpdGggdGhlaXIgY29udGV4dHMsIGxpa2UgaW4gcmVuZGVyZXIyXG4gKiBsaXN0ZW5lcnMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmRleCBvZiB0aGUgY2xlYW51cCBmdW5jdGlvbiBpcyBzYXZlZCBpbiBUVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlQ2xlYW51cEZuKHZpZXc6IExWaWV3LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGdldENsZWFudXAodmlldykucHVzaChjbGVhbnVwRm4pO1xuXG4gIGlmICh2aWV3W1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGdldFRWaWV3Q2xlYW51cCh2aWV3KS5wdXNoKHZpZXdbQ0xFQU5VUF0gIS5sZW5ndGggLSAxLCBudWxsKTtcbiAgfVxufVxuXG4vLyBUT0RPOiBSZW1vdmUgdGhpcyB3aGVuIHRoZSBpc3N1ZSBpcyByZXNvbHZlZC5cbi8qKlxuICogVHNpY2tsZSBoYXMgYSBidWcgd2hlcmUgaXQgY3JlYXRlcyBhbiBpbmZpbml0ZSBsb29wIGZvciBhIGZ1bmN0aW9uIHJldHVybmluZyBpdHNlbGYuXG4gKiBUaGlzIGlzIGEgdGVtcG9yYXJ5IHR5cGUgdGhhdCB3aWxsIGJlIHJlbW92ZWQgd2hlbiB0aGUgaXNzdWUgaXMgcmVzb2x2ZWQuXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYW5ndWxhci90c2lja2xlL2lzc3Vlcy8xMDA5KVxuICovXG5leHBvcnQgdHlwZSBUc2lja2xlSXNzdWUxMDA5ID0gYW55O1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYSBUTm9kZSBvYmplY3QgZnJvbSB0aGUgYXJndW1lbnRzLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYWRqdXN0ZWRJbmRleCBUaGUgaW5kZXggb2YgdGhlIFROb2RlIGluIFRWaWV3LmRhdGEsIGFkanVzdGVkIGZvciBIRUFERVJfT0ZGU0VUXG4gKiBAcGFyYW0gdGFnTmFtZSBUaGUgdGFnIG5hbWUgb2YgdGhlIG5vZGVcbiAqIEBwYXJhbSBhdHRycyBUaGUgYXR0cmlidXRlcyBkZWZpbmVkIG9uIHRoaXMgbm9kZVxuICogQHBhcmFtIHRWaWV3cyBBbnkgVFZpZXdzIGF0dGFjaGVkIHRvIHRoaXMgbm9kZVxuICogQHJldHVybnMgdGhlIFROb2RlIG9iamVjdFxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFBhcmVudDogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGFkanVzdGVkSW5kZXg6IG51bWJlcixcbiAgICB0YWdOYW1lOiBzdHJpbmcgfCBudWxsLCBhdHRyczogVEF0dHJpYnV0ZXMgfCBudWxsKTogVE5vZGUge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIHJldHVybiB7XG4gICAgdHlwZTogdHlwZSxcbiAgICBpbmRleDogYWRqdXN0ZWRJbmRleCxcbiAgICBpbmplY3RvckluZGV4OiB0UGFyZW50ID8gdFBhcmVudC5pbmplY3RvckluZGV4IDogLTEsXG4gICAgZGlyZWN0aXZlU3RhcnQ6IC0xLFxuICAgIGRpcmVjdGl2ZUVuZDogLTEsXG4gICAgcHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXg6IC0xLFxuICAgIHByb3BlcnR5TWV0YWRhdGFFbmRJbmRleDogLTEsXG4gICAgZmxhZ3M6IDAsXG4gICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgIHRhZ05hbWU6IHRhZ05hbWUsXG4gICAgYXR0cnM6IGF0dHJzLFxuICAgIGxvY2FsTmFtZXM6IG51bGwsXG4gICAgaW5pdGlhbElucHV0czogdW5kZWZpbmVkLFxuICAgIGlucHV0czogdW5kZWZpbmVkLFxuICAgIG91dHB1dHM6IHVuZGVmaW5lZCxcbiAgICB0Vmlld3M6IG51bGwsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwcm9qZWN0aW9uTmV4dDogbnVsbCxcbiAgICBjaGlsZDogbnVsbCxcbiAgICBwYXJlbnQ6IHRQYXJlbnQsXG4gICAgc3R5bGluZ1RlbXBsYXRlOiBudWxsLFxuICAgIHByb2plY3Rpb246IG51bGwsXG4gICAgb25FbGVtZW50Q3JlYXRpb25GbnM6IG51bGwsXG4gIH07XG59XG5cblxuLyoqXG4gKiBDb25zb2xpZGF0ZXMgYWxsIGlucHV0cyBvciBvdXRwdXRzIG9mIGFsbCBkaXJlY3RpdmVzIG9uIHRoaXMgbG9naWNhbCBub2RlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZUZsYWdzIG5vZGUgZmxhZ3NcbiAqIEBwYXJhbSBkaXJlY3Rpb24gd2hldGhlciB0byBjb25zaWRlciBpbnB1dHMgb3Igb3V0cHV0c1xuICogQHJldHVybnMgUHJvcGVydHlBbGlhc2VzfG51bGwgYWdncmVnYXRlIG9mIGFsbCBwcm9wZXJ0aWVzIGlmIGFueSwgYG51bGxgIG90aGVyd2lzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVQcm9wZXJ0eUFsaWFzZXModE5vZGU6IFROb2RlLCBkaXJlY3Rpb246IEJpbmRpbmdEaXJlY3Rpb24pOiBQcm9wZXJ0eUFsaWFzZXN8XG4gICAgbnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0TFZpZXcoKVtUVklFV107XG4gIGxldCBwcm9wU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcbiAgY29uc3Qgc3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuXG4gIGlmIChlbmQgPiBzdGFydCkge1xuICAgIGNvbnN0IGlzSW5wdXQgPSBkaXJlY3Rpb24gPT09IEJpbmRpbmdEaXJlY3Rpb24uSW5wdXQ7XG4gICAgY29uc3QgZGVmcyA9IHRWaWV3LmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGNvbnN0IHByb3BlcnR5QWxpYXNNYXA6IHtbcHVibGljTmFtZTogc3RyaW5nXTogc3RyaW5nfSA9XG4gICAgICAgICAgaXNJbnB1dCA/IGRpcmVjdGl2ZURlZi5pbnB1dHMgOiBkaXJlY3RpdmVEZWYub3V0cHV0cztcbiAgICAgIGZvciAobGV0IHB1YmxpY05hbWUgaW4gcHJvcGVydHlBbGlhc01hcCkge1xuICAgICAgICBpZiAocHJvcGVydHlBbGlhc01hcC5oYXNPd25Qcm9wZXJ0eShwdWJsaWNOYW1lKSkge1xuICAgICAgICAgIHByb3BTdG9yZSA9IHByb3BTdG9yZSB8fCB7fTtcbiAgICAgICAgICBjb25zdCBpbnRlcm5hbE5hbWUgPSBwcm9wZXJ0eUFsaWFzTWFwW3B1YmxpY05hbWVdO1xuICAgICAgICAgIGNvbnN0IGhhc1Byb3BlcnR5ID0gcHJvcFN0b3JlLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpO1xuICAgICAgICAgIGhhc1Byb3BlcnR5ID8gcHJvcFN0b3JlW3B1YmxpY05hbWVdLnB1c2goaSwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAocHJvcFN0b3JlW3B1YmxpY05hbWVdID0gW2ksIHB1YmxpY05hbWUsIGludGVybmFsTmFtZV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wU3RvcmU7XG59XG5cbi8qKlxuKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiovXG5jb25zdCBBVFRSX1RPX1BST1A6IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSA9IHtcbiAgJ2NsYXNzJzogJ2NsYXNzTmFtZScsXG4gICdmb3InOiAnaHRtbEZvcicsXG4gICdmb3JtYWN0aW9uJzogJ2Zvcm1BY3Rpb24nLFxuICAnaW5uZXJIdG1sJzogJ2lubmVySFRNTCcsXG4gICdyZWFkb25seSc6ICdyZWFkT25seScsXG4gICd0YWJpbmRleCc6ICd0YWJJbmRleCcsXG59O1xuXG5leHBvcnQgZnVuY3Rpb24gZWxlbWVudFByb3BlcnR5SW50ZXJuYWw8VD4oXG4gICAgaW5kZXg6IG51bWJlciwgcHJvcE5hbWU6IHN0cmluZywgdmFsdWU6IFQgfCBOT19DSEFOR0UsIHNhbml0aXplcj86IFNhbml0aXplckZuIHwgbnVsbCxcbiAgICBuYXRpdmVPbmx5PzogYm9vbGVhbixcbiAgICBsb2FkUmVuZGVyZXJGbj86ICgodE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpID0+IFJlbmRlcmVyMykgfCBudWxsKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PT0gTk9fQ0hBTkdFKSByZXR1cm47XG4gIGNvbnN0IGxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgY29uc3QgZWxlbWVudCA9IGdldE5hdGl2ZUJ5SW5kZXgoaW5kZXgsIGxWaWV3KSBhcyBSRWxlbWVudCB8IFJDb21tZW50O1xuICBjb25zdCB0Tm9kZSA9IGdldFROb2RlKGluZGV4LCBsVmlldyk7XG4gIGxldCBpbnB1dERhdGE6IFByb3BlcnR5QWxpYXNlc3xudWxsfHVuZGVmaW5lZDtcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIChpbnB1dERhdGEgPSBpbml0aWFsaXplVE5vZGVJbnB1dHModE5vZGUpKSAmJlxuICAgICAgKGRhdGFWYWx1ZSA9IGlucHV0RGF0YVtwcm9wTmFtZV0pKSB7XG4gICAgc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXcsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudCh0Tm9kZSkpIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3LCBpbmRleCArIEhFQURFUl9PRkZTRVQpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHByb3BOYW1lID0gQVRUUl9UT19QUk9QW3Byb3BOYW1lXSB8fCBwcm9wTmFtZTtcblxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHZhbGlkYXRlQWdhaW5zdEV2ZW50UHJvcGVydGllcyhwcm9wTmFtZSk7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RVbmtub3duUHJvcGVydGllcyhsVmlldywgZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlKTtcbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgc2F2ZVByb3BlcnR5RGVidWdEYXRhKHROb2RlLCBsVmlldywgcHJvcE5hbWUsIGxWaWV3W1RWSUVXXS5kYXRhLCBuYXRpdmVPbmx5KTtcblxuICAgIGNvbnN0IHJlbmRlcmVyID0gbG9hZFJlbmRlcmVyRm4gPyBsb2FkUmVuZGVyZXJGbih0Tm9kZSwgbFZpZXcpIDogbFZpZXdbUkVOREVSRVJdO1xuICAgIC8vIEl0IGlzIGFzc3VtZWQgdGhhdCB0aGUgc2FuaXRpemVyIGlzIG9ubHkgYWRkZWQgd2hlbiB0aGUgY29tcGlsZXIgZGV0ZXJtaW5lcyB0aGF0IHRoZSBwcm9wZXJ0eVxuICAgIC8vIGlzIHJpc2t5LCBzbyBzYW5pdGl6YXRpb24gY2FuIGJlIGRvbmUgd2l0aG91dCBmdXJ0aGVyIGNoZWNrcy5cbiAgICB2YWx1ZSA9IHNhbml0aXplciAhPSBudWxsID8gKHNhbml0aXplcih2YWx1ZSwgdE5vZGUudGFnTmFtZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIH0gZWxzZSBpZiAoIWlzQW5pbWF0aW9uUHJvcChwcm9wTmFtZSkpIHtcbiAgICAgIChlbGVtZW50IGFzIFJFbGVtZW50KS5zZXRQcm9wZXJ0eSA/IChlbGVtZW50IGFzIGFueSkuc2V0UHJvcGVydHkocHJvcE5hbWUsIHZhbHVlKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZWxlbWVudCBhcyBhbnkpW3Byb3BOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXMobFZpZXcsIHROb2RlLnRhZ05hbWUpKSB7XG4gICAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICAgIH1cbiAgfVxufVxuXG4vKiogSWYgbm9kZSBpcyBhbiBPblB1c2ggY29tcG9uZW50LCBtYXJrcyBpdHMgTFZpZXcgZGlydHkuICovXG5mdW5jdGlvbiBtYXJrRGlydHlJZk9uUHVzaChsVmlldzogTFZpZXcsIHZpZXdJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhsVmlldyk7XG4gIGNvbnN0IGNoaWxkQ29tcG9uZW50TFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydGllcyhcbiAgICBsVmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7IGkgKz0gMykge1xuICAgIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICAgIGNvbnN0IGF0dHJOYW1lID0gbm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZShpbnB1dHNbaSArIDJdIGFzIHN0cmluZyk7XG4gICAgY29uc3QgZGVidWdWYWx1ZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ1ZhbHVlKHZhbHVlKTtcbiAgICBpZiAodHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgIGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSA/XG4gICAgICAgICAgcmVuZGVyZXIuc2V0QXR0cmlidXRlKChlbGVtZW50IGFzIFJFbGVtZW50KSwgYXR0ck5hbWUsIGRlYnVnVmFsdWUpIDpcbiAgICAgICAgICAoZWxlbWVudCBhcyBSRWxlbWVudCkuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9IGVsc2UgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYGJpbmRpbmdzPSR7SlNPTi5zdHJpbmdpZnkoe1thdHRyTmFtZV06IGRlYnVnVmFsdWV9LCBudWxsLCAyKX1gO1xuICAgICAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgICAgICByZW5kZXJlci5zZXRWYWx1ZSgoZWxlbWVudCBhcyBSQ29tbWVudCksIHZhbHVlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChlbGVtZW50IGFzIFJDb21tZW50KS50ZXh0Q29udGVudCA9IHZhbHVlO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUFnYWluc3RVbmtub3duUHJvcGVydGllcyhcbiAgICBob3N0VmlldzogTFZpZXcsIGVsZW1lbnQ6IFJFbGVtZW50IHwgUkNvbW1lbnQsIHByb3BOYW1lOiBzdHJpbmcsIHROb2RlOiBUTm9kZSkge1xuICAvLyBJZiB0aGUgdGFnIG1hdGNoZXMgYW55IG9mIHRoZSBzY2hlbWFzIHdlIHNob3VsZG4ndCB0aHJvdy5cbiAgaWYgKG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldywgdE5vZGUudGFnTmFtZSkpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBJZiBwcm9wIGlzIG5vdCBhIGtub3duIHByb3BlcnR5IG9mIHRoZSBIVE1MIGVsZW1lbnQuLi5cbiAgaWYgKCEocHJvcE5hbWUgaW4gZWxlbWVudCkgJiZcbiAgICAgIC8vIGFuZCB3ZSBhcmUgaW4gYSBicm93c2VyIGNvbnRleHQuLi4gKHdlYiB3b3JrZXIgbm9kZXMgc2hvdWxkIGJlIHNraXBwZWQpXG4gICAgICB0eXBlb2YgTm9kZSA9PT0gJ2Z1bmN0aW9uJyAmJiBlbGVtZW50IGluc3RhbmNlb2YgTm9kZSAmJlxuICAgICAgLy8gYW5kIGlzbid0IGEgc3ludGhldGljIGFuaW1hdGlvbiBwcm9wZXJ0eS4uLlxuICAgICAgcHJvcE5hbWVbMF0gIT09IEFOSU1BVElPTl9QUk9QX1BSRUZJWCkge1xuICAgIC8vIC4uLiBpdCBpcyBwcm9iYWJseSBhIHVzZXIgZXJyb3IgYW5kIHdlIHNob3VsZCB0aHJvdy5cbiAgICB0aHJvdyBjcmVhdGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoaW5nU2NoZW1hcyhob3N0VmlldzogTFZpZXcsIHRhZ05hbWU6IHN0cmluZyB8IG51bGwpOiBib29sZWFuIHtcbiAgY29uc3Qgc2NoZW1hcyA9IGhvc3RWaWV3W1RWSUVXXS5zY2hlbWFzO1xuXG4gIGlmIChzY2hlbWFzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzY2hlbWFzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBzY2hlbWEgPSBzY2hlbWFzW2ldO1xuICAgICAgaWYgKHNjaGVtYSA9PT0gTk9fRVJST1JTX1NDSEVNQSB8fFxuICAgICAgICAgIHNjaGVtYSA9PT0gQ1VTVE9NX0VMRU1FTlRTX1NDSEVNQSAmJiB0YWdOYW1lICYmIHRhZ05hbWUuaW5kZXhPZignLScpID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKipcbiogU3RvcmVzIGRlYnVnZ2luZyBkYXRhIGZvciB0aGlzIHByb3BlcnR5IGJpbmRpbmcgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy5cbiogVGhpcyBlbmFibGVzIGZlYXR1cmVzIGxpa2UgRGVidWdFbGVtZW50LnByb3BlcnRpZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZVByb3BlcnR5RGVidWdEYXRhKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCBwcm9wTmFtZTogc3RyaW5nLCB0RGF0YTogVERhdGEsXG4gICAgbmF0aXZlT25seTogYm9vbGVhbiB8IHVuZGVmaW5lZCk6IHZvaWQge1xuICBjb25zdCBsYXN0QmluZGluZ0luZGV4ID0gbFZpZXdbQklORElOR19JTkRFWF0gLSAxO1xuXG4gIC8vIEJpbmQvaW50ZXJwb2xhdGlvbiBmdW5jdGlvbnMgc2F2ZSBiaW5kaW5nIG1ldGFkYXRhIGluIHRoZSBsYXN0IGJpbmRpbmcgaW5kZXgsXG4gIC8vIGJ1dCBsZWF2ZSB0aGUgcHJvcGVydHkgbmFtZSBibGFuay4gSWYgdGhlIGludGVycG9sYXRpb24gZGVsaW1pdGVyIGlzIGF0IHRoZSAwXG4gIC8vIGluZGV4LCB3ZSBrbm93IHRoYXQgdGhpcyBpcyBvdXIgZmlyc3QgcGFzcyBhbmQgdGhlIHByb3BlcnR5IG5hbWUgc3RpbGwgbmVlZHMgdG9cbiAgLy8gYmUgc2V0LlxuICBjb25zdCBiaW5kaW5nTWV0YWRhdGEgPSB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSBhcyBzdHJpbmc7XG4gIGlmIChiaW5kaW5nTWV0YWRhdGFbMF0gPT0gSU5URVJQT0xBVElPTl9ERUxJTUlURVIpIHtcbiAgICB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9IHByb3BOYW1lICsgYmluZGluZ01ldGFkYXRhO1xuXG4gICAgLy8gV2UgZG9uJ3Qgd2FudCB0byBzdG9yZSBpbmRpY2VzIGZvciBob3N0IGJpbmRpbmdzIGJlY2F1c2UgdGhleSBhcmUgc3RvcmVkIGluIGFcbiAgICAvLyBkaWZmZXJlbnQgcGFydCBvZiBMVmlldyAodGhlIGV4cGFuZG8gc2VjdGlvbikuXG4gICAgaWYgKCFuYXRpdmVPbmx5KSB7XG4gICAgICBpZiAodE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPT0gLTEpIHtcbiAgICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YVN0YXJ0SW5kZXggPSBsYXN0QmluZGluZ0luZGV4O1xuICAgICAgfVxuICAgICAgdE5vZGUucHJvcGVydHlNZXRhZGF0YUVuZEluZGV4ID0gbGFzdEJpbmRpbmdJbmRleCArIDE7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuKiBDcmVhdGVzIGFuIGVycm9yIHRoYXQgc2hvdWxkIGJlIHRocm93biB3aGVuIGVuY291bnRlcmluZyBhbiB1bmtub3duIHByb3BlcnR5IG9uIGFuIGVsZW1lbnQuXG4qIEBwYXJhbSBwcm9wTmFtZSBOYW1lIG9mIHRoZSBpbnZhbGlkIHByb3BlcnR5LlxuKiBAcGFyYW0gdE5vZGUgTm9kZSBvbiB3aGljaCB3ZSBlbmNvdW50ZXJlZCB0aGUgZXJyb3IuXG4qL1xuZnVuY3Rpb24gY3JlYXRlVW5rbm93blByb3BlcnR5RXJyb3IocHJvcE5hbWU6IHN0cmluZywgdE5vZGU6IFROb2RlKTogRXJyb3Ige1xuICByZXR1cm4gbmV3IEVycm9yKFxuICAgICAgYFRlbXBsYXRlIGVycm9yOiBDYW4ndCBiaW5kIHRvICcke3Byb3BOYW1lfScgc2luY2UgaXQgaXNuJ3QgYSBrbm93biBwcm9wZXJ0eSBvZiAnJHt0Tm9kZS50YWdOYW1lfScuYCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYSByb290IGNvbXBvbmVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluc3RhbnRpYXRlUm9vdENvbXBvbmVudDxUPihcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGVmOiBDb21wb25lbnREZWY8VD4pOiBUIHtcbiAgY29uc3Qgcm9vdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGlmIChkZWYucHJvdmlkZXJzUmVzb2x2ZXIpIGRlZi5wcm92aWRlcnNSZXNvbHZlcihkZWYpO1xuICAgIGdlbmVyYXRlRXhwYW5kb0luc3RydWN0aW9uQmxvY2sodFZpZXcsIHJvb3RUTm9kZSwgMSk7XG4gICAgYmFzZVJlc29sdmVEaXJlY3RpdmUodFZpZXcsIHZpZXdEYXRhLCBkZWYsIGRlZi5mYWN0b3J5KTtcbiAgfVxuICBjb25zdCBkaXJlY3RpdmUgPVxuICAgICAgZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgdmlld0RhdGEsIHZpZXdEYXRhLmxlbmd0aCAtIDEsIHJvb3RUTm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICBwb3N0UHJvY2Vzc0Jhc2VEaXJlY3RpdmUodmlld0RhdGEsIHJvb3RUTm9kZSwgZGlyZWN0aXZlKTtcbiAgcmV0dXJuIGRpcmVjdGl2ZTtcbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5mdW5jdGlvbiByZXNvbHZlRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIHZpZXdEYXRhOiBMVmlldywgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPGFueT5bXSB8IG51bGwsIHROb2RlOiBUTm9kZSxcbiAgICBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpbiB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdzaG91bGQgcnVuIG9uIGZpcnN0IHRlbXBsYXRlIHBhc3Mgb25seScpO1xuICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn0gfCBudWxsKSA9IGxvY2FsUmVmcyA/IHsnJzogLTF9IDogbnVsbDtcbiAgaWYgKGRpcmVjdGl2ZXMpIHtcbiAgICBpbml0Tm9kZUZsYWdzKHROb2RlLCB0Vmlldy5kYXRhLmxlbmd0aCwgZGlyZWN0aXZlcy5sZW5ndGgpO1xuICAgIC8vIFdoZW4gdGhlIHNhbWUgdG9rZW4gaXMgcHJvdmlkZWQgYnkgc2V2ZXJhbCBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIG5vZGUsIHNvbWUgcnVsZXMgYXBwbHkgaW5cbiAgICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgICAvLyAtIHZpZXdQcm92aWRlcnMgaGF2ZSBwcmlvcml0eSBvdmVyIHByb3ZpZGVyc1xuICAgIC8vIC0gdGhlIGxhc3QgZGlyZWN0aXZlIGluIE5nTW9kdWxlLmRlY2xhcmF0aW9ucyBoYXMgcHJpb3JpdHkgb3ZlciB0aGUgcHJldmlvdXMgb25lXG4gICAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAgIC8vIGltcG9ydGFudC5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnByb3ZpZGVyc1Jlc29sdmVyKSBkZWYucHJvdmlkZXJzUmVzb2x2ZXIoZGVmKTtcbiAgICB9XG4gICAgZ2VuZXJhdGVFeHBhbmRvSW5zdHJ1Y3Rpb25CbG9jayh0VmlldywgdE5vZGUsIGRpcmVjdGl2ZXMubGVuZ3RoKTtcbiAgICBjb25zdCBpbml0aWFsUHJlT3JkZXJIb29rc0xlbmd0aCA9ICh0Vmlldy5wcmVPcmRlckhvb2tzICYmIHRWaWV3LnByZU9yZGVySG9va3MubGVuZ3RoKSB8fCAwO1xuICAgIGNvbnN0IGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGggPVxuICAgICAgICAodFZpZXcucHJlT3JkZXJDaGVja0hvb2tzICYmIHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcy5sZW5ndGgpIHx8IDA7XG4gICAgY29uc3Qgbm9kZUluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gZGlyZWN0aXZlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gdFZpZXcuZGF0YS5sZW5ndGg7XG4gICAgICBiYXNlUmVzb2x2ZURpcmVjdGl2ZSh0Vmlldywgdmlld0RhdGEsIGRlZiwgZGVmLmZhY3RvcnkpO1xuXG4gICAgICBzYXZlTmFtZVRvRXhwb3J0TWFwKHRWaWV3LmRhdGEgIS5sZW5ndGggLSAxLCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgICAvLyBJbml0IGhvb2tzIGFyZSBxdWV1ZWQgbm93IHNvIG5nT25Jbml0IGlzIGNhbGxlZCBpbiBob3N0IGNvbXBvbmVudHMgYmVmb3JlXG4gICAgICAvLyBhbnkgcHJvamVjdGVkIGNvbXBvbmVudHMuXG4gICAgICByZWdpc3RlclByZU9yZGVySG9va3MoXG4gICAgICAgICAgZGlyZWN0aXZlRGVmSWR4LCBkZWYsIHRWaWV3LCBub2RlSW5kZXgsIGluaXRpYWxQcmVPcmRlckhvb2tzTGVuZ3RoLFxuICAgICAgICAgIGluaXRpYWxQcmVPcmRlckNoZWNrSG9va3NMZW5ndGgpO1xuICAgIH1cbiAgfVxuICBpZiAoZXhwb3J0c01hcCkgY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXModE5vZGUsIGxvY2FsUmVmcywgZXhwb3J0c01hcCk7XG59XG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFROb2RlKSB7XG4gIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgaWYgKCF0Vmlldy5maXJzdFRlbXBsYXRlUGFzcyAmJiBzdGFydCA8IGVuZCkge1xuICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3KTtcbiAgfVxuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGFkZENvbXBvbmVudExvZ2ljKGxWaWV3LCB0Tm9kZSwgZGVmIGFzIENvbXBvbmVudERlZjxhbnk+KTtcbiAgICB9XG4gICAgY29uc3QgZGlyZWN0aXZlID0gZ2V0Tm9kZUluamVjdGFibGUodFZpZXcuZGF0YSwgbFZpZXcgISwgaSwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgICBwb3N0UHJvY2Vzc0RpcmVjdGl2ZShsVmlldywgZGlyZWN0aXZlLCBkZWYsIGkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGV4cGFuZG8gPSB0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zICE7XG4gIGNvbnN0IGZpcnN0VGVtcGxhdGVQYXNzID0gdFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3M7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVDtcbiAgc2V0QWN0aXZlSG9zdEVsZW1lbnQoZWxlbWVudEluZGV4KTtcblxuICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgZGlyZWN0aXZlID0gdmlld0RhdGFbaV07XG4gICAgaWYgKGRlZi5ob3N0QmluZGluZ3MpIHtcbiAgICAgIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZiwgZXhwYW5kbywgZGlyZWN0aXZlLCB0Tm9kZSwgZmlyc3RUZW1wbGF0ZVBhc3MpO1xuXG4gICAgICAvLyBFYWNoIGRpcmVjdGl2ZSBnZXRzIGEgdW5pcXVlSWQgdmFsdWUgdGhhdCBpcyB0aGUgc2FtZSBmb3IgYm90aFxuICAgICAgLy8gY3JlYXRlIGFuZCB1cGRhdGUgY2FsbHMgd2hlbiB0aGUgaG9zdEJpbmRpbmdzIGZ1bmN0aW9uIGlzIGNhbGxlZC4gVGhlXG4gICAgICAvLyBkaXJlY3RpdmUgdW5pcXVlSWQgaXMgbm90IHNldCBhbnl3aGVyZS0taXQgaXMganVzdCBpbmNyZW1lbnRlZCBiZXR3ZWVuXG4gICAgICAvLyBlYWNoIGhvc3RCaW5kaW5ncyBjYWxsIGFuZCBpcyB1c2VmdWwgZm9yIGhlbHBpbmcgaW5zdHJ1Y3Rpb24gY29kZVxuICAgICAgLy8gdW5pcXVlbHkgZGV0ZXJtaW5lIHdoaWNoIGRpcmVjdGl2ZSBpcyBjdXJyZW50bHkgYWN0aXZlIHdoZW4gZXhlY3V0ZWQuXG4gICAgICBpbmNyZW1lbnRBY3RpdmVEaXJlY3RpdmVJZCgpO1xuICAgIH0gZWxzZSBpZiAoZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAgIGV4cGFuZG8ucHVzaChudWxsKTtcbiAgICB9XG4gIH1cblxuICBzZXRBY3RpdmVIb3N0RWxlbWVudChudWxsKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGV4cGFuZG86IEV4cGFuZG9JbnN0cnVjdGlvbnMsIGRpcmVjdGl2ZTogYW55LCB0Tm9kZTogVE5vZGUsXG4gICAgZmlyc3RUZW1wbGF0ZVBhc3M6IGJvb2xlYW4pIHtcbiAgY29uc3QgcHJldmlvdXNFeHBhbmRvTGVuZ3RoID0gZXhwYW5kby5sZW5ndGg7XG4gIHNldEN1cnJlbnREaXJlY3RpdmVEZWYoZGVmKTtcbiAgY29uc3QgZWxlbWVudEluZGV4ID0gdE5vZGUuaW5kZXggLSBIRUFERVJfT0ZGU0VUO1xuICBkZWYuaG9zdEJpbmRpbmdzICEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUsIGVsZW1lbnRJbmRleCk7XG4gIHNldEN1cnJlbnREaXJlY3RpdmVEZWYobnVsbCk7XG4gIC8vIGBob3N0QmluZGluZ3NgIGZ1bmN0aW9uIG1heSBvciBtYXkgbm90IGNvbnRhaW4gYGFsbG9jSG9zdFZhcnNgIGNhbGxcbiAgLy8gKGUuZy4gaXQgbWF5IG5vdCBpZiBpdCBvbmx5IGNvbnRhaW5zIGhvc3QgbGlzdGVuZXJzKSwgc28gd2UgbmVlZCB0byBjaGVjayB3aGV0aGVyXG4gIC8vIGBleHBhbmRvSW5zdHJ1Y3Rpb25zYCBoYXMgY2hhbmdlZCBhbmQgaWYgbm90IC0gd2Ugc3RpbGwgcHVzaCBgaG9zdEJpbmRpbmdzYCB0b1xuICAvLyBleHBhbmRvIGJsb2NrLCB0byBtYWtlIHN1cmUgd2UgZXhlY3V0ZSBpdCBmb3IgREkgY3ljbGVcbiAgaWYgKHByZXZpb3VzRXhwYW5kb0xlbmd0aCA9PT0gZXhwYW5kby5sZW5ndGggJiYgZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBleHBhbmRvLnB1c2goZGVmLmhvc3RCaW5kaW5ncyk7XG4gIH1cbn1cblxuLyoqXG4qIEdlbmVyYXRlcyBhIG5ldyBibG9jayBpbiBUVmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIGZvciB0aGlzIG5vZGUuXG4qXG4qIEVhY2ggZXhwYW5kbyBibG9jayBzdGFydHMgd2l0aCB0aGUgZWxlbWVudCBpbmRleCAodHVybmVkIG5lZ2F0aXZlIHNvIHdlIGNhbiBkaXN0aW5ndWlzaFxuKiBpdCBmcm9tIHRoZSBob3N0VmFyIGNvdW50KSBhbmQgdGhlIGRpcmVjdGl2ZSBjb3VudC4gU2VlIG1vcmUgaW4gVklFV19EQVRBLm1kLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUV4cGFuZG9JbnN0cnVjdGlvbkJsb2NrKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVDb3VudDogbnVtYmVyKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICB0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAnRXhwYW5kbyBibG9jayBzaG91bGQgb25seSBiZSBnZW5lcmF0ZWQgb24gZmlyc3QgdGVtcGxhdGUgcGFzcy4nKTtcblxuICBjb25zdCBlbGVtZW50SW5kZXggPSAtKHROb2RlLmluZGV4IC0gSEVBREVSX09GRlNFVCk7XG4gIGNvbnN0IHByb3ZpZGVyU3RhcnRJbmRleCA9IHROb2RlLnByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBwcm92aWRlckNvdW50ID0gdFZpZXcuZGF0YS5sZW5ndGggLSBwcm92aWRlclN0YXJ0SW5kZXg7XG4gICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zIHx8ICh0Vmlldy5leHBhbmRvSW5zdHJ1Y3Rpb25zID0gW1xuICAgXSkpLnB1c2goZWxlbWVudEluZGV4LCBwcm92aWRlckNvdW50LCBkaXJlY3RpdmVDb3VudCk7XG59XG5cbi8qKlxuICogUHJvY2VzcyBhIGRpcmVjdGl2ZSBvbiB0aGUgY3VycmVudCBub2RlIGFmdGVyIGl0cyBjcmVhdGlvbi5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NEaXJlY3RpdmU8VD4oXG4gICAgdmlld0RhdGE6IExWaWV3LCBkaXJlY3RpdmU6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBkaXJlY3RpdmVEZWZJZHg6IG51bWJlcik6IHZvaWQge1xuICBjb25zdCBwcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlKHZpZXdEYXRhLCBwcmV2aW91c09yUGFyZW50VE5vZGUsIGRpcmVjdGl2ZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHByZXZpb3VzT3JQYXJlbnRUTm9kZSwgJ3ByZXZpb3VzT3JQYXJlbnRUTm9kZScpO1xuICBpZiAocHJldmlvdXNPclBhcmVudFROb2RlICYmIHByZXZpb3VzT3JQYXJlbnRUTm9kZS5hdHRycykge1xuICAgIHNldElucHV0c0Zyb21BdHRycyhkaXJlY3RpdmVEZWZJZHgsIGRpcmVjdGl2ZSwgZGVmLCBwcmV2aW91c09yUGFyZW50VE5vZGUpO1xuICB9XG5cbiAgaWYgKHZpZXdEYXRhW1RWSUVXXS5maXJzdFRlbXBsYXRlUGFzcyAmJiBkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICBwcmV2aW91c09yUGFyZW50VE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gIH1cblxuICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkge1xuICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChwcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXgsIHZpZXdEYXRhKTtcbiAgICBjb21wb25lbnRWaWV3W0NPTlRFWFRdID0gZGlyZWN0aXZlO1xuICB9XG59XG5cbi8qKlxuICogQSBsaWdodGVyIHZlcnNpb24gb2YgcG9zdFByb2Nlc3NEaXJlY3RpdmUoKSB0aGF0IGlzIHVzZWQgZm9yIHRoZSByb290IGNvbXBvbmVudC5cbiAqL1xuZnVuY3Rpb24gcG9zdFByb2Nlc3NCYXNlRGlyZWN0aXZlPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgcHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSwgZGlyZWN0aXZlOiBUKTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIGxWaWV3W0JJTkRJTkdfSU5ERVhdLCBsVmlld1tUVklFV10uYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgJ2RpcmVjdGl2ZXMgc2hvdWxkIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBiaW5kaW5ncycpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudChnZXRJc1BhcmVudCgpKTtcblxuICBhdHRhY2hQYXRjaERhdGEoZGlyZWN0aXZlLCBsVmlldyk7XG4gIGlmIChuYXRpdmUpIHtcbiAgICBhdHRhY2hQYXRjaERhdGEobmF0aXZlLCBsVmlldyk7XG4gIH1cbn1cblxuXG5cbi8qKlxuKiBNYXRjaGVzIHRoZSBjdXJyZW50IG5vZGUgYWdhaW5zdCBhbGwgYXZhaWxhYmxlIHNlbGVjdG9ycy5cbiogSWYgYSBjb21wb25lbnQgaXMgbWF0Y2hlZCAoYXQgbW9zdCBvbmUpLCBpdCBpcyByZXR1cm5lZCBpbiBmaXJzdCBwb3NpdGlvbiBpbiB0aGUgYXJyYXkuXG4qL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZU1hdGNoZXModFZpZXc6IFRWaWV3LCB2aWV3RGF0YTogTFZpZXcsIHROb2RlOiBUTm9kZSk6IERpcmVjdGl2ZURlZjxhbnk+W118XG4gICAgbnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ3Nob3VsZCBydW4gb24gZmlyc3QgdGVtcGxhdGUgcGFzcyBvbmx5Jyk7XG4gIGNvbnN0IHJlZ2lzdHJ5ID0gdFZpZXcuZGlyZWN0aXZlUmVnaXN0cnk7XG4gIGxldCBtYXRjaGVzOiBhbnlbXXxudWxsID0gbnVsbDtcbiAgaWYgKHJlZ2lzdHJ5KSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCByZWdpc3RyeS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZGVmID0gcmVnaXN0cnlbaV0gYXMgQ29tcG9uZW50RGVmPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGlzTm9kZU1hdGNoaW5nU2VsZWN0b3JMaXN0KHROb2RlLCBkZWYuc2VsZWN0b3JzICEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG4gICAgICAgIGRpUHVibGljSW5JbmplY3RvcihcbiAgICAgICAgICAgIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgICAgICAgICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICB2aWV3RGF0YSksXG4gICAgICAgICAgICB2aWV3RGF0YSwgZGVmLnR5cGUpO1xuXG4gICAgICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSB7XG4gICAgICAgICAgaWYgKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc0NvbXBvbmVudCkgdGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yKHROb2RlKTtcbiAgICAgICAgICB0Tm9kZS5mbGFncyA9IFROb2RlRmxhZ3MuaXNDb21wb25lbnQ7XG5cbiAgICAgICAgICAvLyBUaGUgY29tcG9uZW50IGlzIGFsd2F5cyBzdG9yZWQgZmlyc3Qgd2l0aCBkaXJlY3RpdmVzIGFmdGVyLlxuICAgICAgICAgIG1hdGNoZXMudW5zaGlmdChkZWYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoZXMucHVzaChkZWYpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBtYXRjaGVzO1xufVxuXG4vKiogU3RvcmVzIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBxdWV1ZUNvbXBvbmVudEluZGV4Rm9yQ2hlY2socHJldmlvdXNPclBhcmVudFROb2RlOiBUTm9kZSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGdldExWaWV3KClbVFZJRVddO1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnU2hvdWxkIG9ubHkgYmUgY2FsbGVkIGluIGZpcnN0IHRlbXBsYXRlIHBhc3MuJyk7XG4gICh0Vmlldy5jb21wb25lbnRzIHx8ICh0Vmlldy5jb21wb25lbnRzID0gW10pKS5wdXNoKHByZXZpb3VzT3JQYXJlbnRUTm9kZS5pbmRleCk7XG59XG5cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdIHwgbnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmcgfCBudW1iZXIpW10gPSB0Tm9kZS5sb2NhbE5hbWVzID0gW107XG5cbiAgICAvLyBMb2NhbCBuYW1lcyBtdXN0IGJlIHN0b3JlZCBpbiB0Tm9kZSBpbiB0aGUgc2FtZSBvcmRlciB0aGF0IGxvY2FsUmVmcyBhcmUgZGVmaW5lZFxuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSB0byBlbnN1cmUgdGhlIGRhdGEgaXMgbG9hZGVkIGluIHRoZSBzYW1lIHNsb3RzIGFzIHRoZWlyIHJlZnNcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgKGZvciB0ZW1wbGF0ZSBxdWVyaWVzKS5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxvY2FsUmVmcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBleHBvcnRzTWFwW2xvY2FsUmVmc1tpICsgMV1dO1xuICAgICAgaWYgKGluZGV4ID09IG51bGwpIHRocm93IG5ldyBFcnJvcihgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4qIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4qIHRvIHRoZWlyIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4qL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBpbmRleDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fCBDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfSB8IG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBpbmRleDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKChkZWYgYXMgQ29tcG9uZW50RGVmPGFueT4pLnRlbXBsYXRlKSBleHBvcnRzTWFwWycnXSA9IGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGZsYWdzIG9uIHRoZSBjdXJyZW50IG5vZGUsIHNldHRpbmcgYWxsIGluZGljZXMgdG8gdGhlIGluaXRpYWwgaW5kZXgsXG4gKiB0aGUgZGlyZWN0aXZlIGNvdW50IHRvIDAsIGFuZCBhZGRpbmcgdGhlIGlzQ29tcG9uZW50IGZsYWcuXG4gKiBAcGFyYW0gaW5kZXggdGhlIGluaXRpYWwgaW5kZXhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluaXROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBjb25zdCBmbGFncyA9IHROb2RlLmZsYWdzO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgZmxhZ3MgPT09IDAgfHwgZmxhZ3MgPT09IFROb2RlRmxhZ3MuaXNDb21wb25lbnQsIHRydWUsXG4gICAgICAgICAgICAgICAgICAgJ2V4cGVjdGVkIG5vZGUgZmxhZ3MgdG8gbm90IGJlIGluaXRpYWxpemVkJyk7XG5cbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZCBvbiBhIG5vZGUsIHNhdmUgdGhlIGluZGV4XG4gIHROb2RlLmZsYWdzID0gZmxhZ3MgJiBUTm9kZUZsYWdzLmlzQ29tcG9uZW50O1xuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbmZ1bmN0aW9uIGJhc2VSZXNvbHZlRGlyZWN0aXZlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdmlld0RhdGE6IExWaWV3LCBkZWY6IERpcmVjdGl2ZURlZjxUPixcbiAgICBkaXJlY3RpdmVGYWN0b3J5OiAodDogVHlwZTxUPnwgbnVsbCkgPT4gYW55KSB7XG4gIHRWaWV3LmRhdGEucHVzaChkZWYpO1xuICBjb25zdCBub2RlSW5qZWN0b3JGYWN0b3J5ID0gbmV3IE5vZGVJbmplY3RvckZhY3RvcnkoZGlyZWN0aXZlRmFjdG9yeSwgaXNDb21wb25lbnREZWYoZGVmKSwgbnVsbCk7XG4gIHRWaWV3LmJsdWVwcmludC5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xuICB2aWV3RGF0YS5wdXNoKG5vZGVJbmplY3RvckZhY3RvcnkpO1xufVxuXG5mdW5jdGlvbiBhZGRDb21wb25lbnRMb2dpYzxUPihcbiAgICBsVmlldzogTFZpZXcsIHByZXZpb3VzT3JQYXJlbnRUTm9kZTogVE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUocHJldmlvdXNPclBhcmVudFROb2RlLCBsVmlldyk7XG5cbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZVRWaWV3KFxuICAgICAgZGVmLnRlbXBsYXRlLCBkZWYuY29uc3RzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSxcbiAgICAgIGRlZi5zY2hlbWFzKTtcblxuICAvLyBPbmx5IGNvbXBvbmVudCB2aWV3cyBzaG91bGQgYmUgYWRkZWQgdG8gdGhlIHZpZXcgdHJlZSBkaXJlY3RseS4gRW1iZWRkZWQgdmlld3MgYXJlXG4gIC8vIGFjY2Vzc2VkIHRocm91Z2ggdGhlaXIgY29udGFpbmVycyBiZWNhdXNlIHRoZXkgbWF5IGJlIHJlbW92ZWQgLyByZS1hZGRlZCBsYXRlci5cbiAgY29uc3QgcmVuZGVyZXJGYWN0b3J5ID0gbFZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG4gIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBhZGRUb1ZpZXdUcmVlKFxuICAgICAgbFZpZXcsIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgICAgICAgICBsVmlldywgdFZpZXcsIG51bGwsIGRlZi5vblB1c2ggPyBMVmlld0ZsYWdzLkRpcnR5IDogTFZpZXdGbGFncy5DaGVja0Fsd2F5cyxcbiAgICAgICAgICAgICAgICAgbFZpZXdbcHJldmlvdXNPclBhcmVudFROb2RlLmluZGV4XSwgcHJldmlvdXNPclBhcmVudFROb2RlIGFzIFRFbGVtZW50Tm9kZSxcbiAgICAgICAgICAgICAgICAgcmVuZGVyZXJGYWN0b3J5LCBsVmlld1tSRU5ERVJFUl9GQUNUT1JZXS5jcmVhdGVSZW5kZXJlcihuYXRpdmUgYXMgUkVsZW1lbnQsIGRlZikpKTtcblxuICBjb21wb25lbnRWaWV3W1RfSE9TVF0gPSBwcmV2aW91c09yUGFyZW50VE5vZGUgYXMgVEVsZW1lbnROb2RlO1xuXG4gIC8vIENvbXBvbmVudCB2aWV3IHdpbGwgYWx3YXlzIGJlIGNyZWF0ZWQgYmVmb3JlIGFueSBpbmplY3RlZCBMQ29udGFpbmVycyxcbiAgLy8gc28gdGhpcyBpcyBhIHJlZ3VsYXIgZWxlbWVudCwgd3JhcCBpdCB3aXRoIHRoZSBjb21wb25lbnQgdmlld1xuICBsVmlld1twcmV2aW91c09yUGFyZW50VE5vZGUuaW5kZXhdID0gY29tcG9uZW50VmlldztcblxuICBpZiAobFZpZXdbVFZJRVddLmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgcXVldWVDb21wb25lbnRJbmRleEZvckNoZWNrKHByZXZpb3VzT3JQYXJlbnRUTm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTZXRzIGluaXRpYWwgaW5wdXQgcHJvcGVydGllcyBvbiBkaXJlY3RpdmUgaW5zdGFuY2VzIGZyb20gYXR0cmlidXRlIGRhdGFcbiAqXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gaW5wdXRzIFRoZSBsaXN0IG9mIGlucHV0cyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGluc3RhbmNlOiBULCBkZWY6IERpcmVjdGl2ZURlZjxUPiwgdE5vZGU6IFROb2RlKTogdm9pZCB7XG4gIGxldCBpbml0aWFsSW5wdXREYXRhID0gdE5vZGUuaW5pdGlhbElucHV0cyBhcyBJbml0aWFsSW5wdXREYXRhIHwgdW5kZWZpbmVkO1xuICBpZiAoaW5pdGlhbElucHV0RGF0YSA9PT0gdW5kZWZpbmVkIHx8IGRpcmVjdGl2ZUluZGV4ID49IGluaXRpYWxJbnB1dERhdGEubGVuZ3RoKSB7XG4gICAgaW5pdGlhbElucHV0RGF0YSA9IGdlbmVyYXRlSW5pdGlhbElucHV0cyhkaXJlY3RpdmVJbmRleCwgZGVmLmlucHV0cywgdE5vZGUpO1xuICB9XG5cbiAgY29uc3QgaW5pdGlhbElucHV0czogSW5pdGlhbElucHV0c3xudWxsID0gaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzKSB7XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuICAgICAgaWYgKHNldElucHV0KSB7XG4gICAgICAgIGRlZi5zZXRJbnB1dCAhKGluc3RhbmNlLCB2YWx1ZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGluc3RhbmNlIGFzIGFueSlbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IHRvIHN0b3JlIHRoZSBpbml0aWFsIGlucHV0IGRhdGFcbiAqIEBwYXJhbSBpbnB1dHMgVGhlIGxpc3Qgb2YgaW5wdXRzIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWZcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgc3RhdGljIGRhdGEgb24gdGhpcyBub2RlXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBpbnB1dHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9LCB0Tm9kZTogVE5vZGUpOiBJbml0aWFsSW5wdXREYXRhIHtcbiAgY29uc3QgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSA9IHROb2RlLmluaXRpYWxJbnB1dHMgfHwgKHROb2RlLmluaXRpYWxJbnB1dHMgPSBbXSk7XG4gIGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gbnVsbDtcblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzICE7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGNvbnN0IG1pbmlmaWVkSW5wdXROYW1lID0gaW5wdXRzW2F0dHJOYW1lXTtcbiAgICBjb25zdCBhdHRyVmFsdWUgPSBhdHRyc1tpICsgMV07XG5cbiAgICBpZiAobWluaWZpZWRJbnB1dE5hbWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgY29uc3QgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0cyA9XG4gICAgICAgICAgaW5pdGlhbElucHV0RGF0YVtkaXJlY3RpdmVJbmRleF0gfHwgKGluaXRpYWxJbnB1dERhdGFbZGlyZWN0aXZlSW5kZXhdID0gW10pO1xuICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKGF0dHJOYW1lLCBtaW5pZmllZElucHV0TmFtZSwgYXR0clZhbHVlIGFzIHN0cmluZyk7XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbml0aWFsSW5wdXREYXRhO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnQgfCBSQ29tbWVudCB8IFN0eWxpbmdDb250ZXh0IHwgTFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCxcbiAgICB0Tm9kZTogVE5vZGUsIGlzRm9yVmlld0NvbnRhaW5lclJlZj86IGJvb2xlYW4pOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERvbU5vZGUobmF0aXZlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IFtcbiAgICBob3N0TmF0aXZlLCAgLy8gaG9zdCBuYXRpdmVcbiAgICB0cnVlLCAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgIGlzRm9yVmlld0NvbnRhaW5lclJlZiA/IC0xIDogMCwgIC8vIGFjdGl2ZSBpbmRleFxuICAgIGN1cnJlbnRWaWV3LCAgICAgICAgICAgICAgICAgICAgIC8vIHBhcmVudFxuICAgIG51bGwsICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIG5leHRcbiAgICBudWxsLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBxdWVyaWVzXG4gICAgdE5vZGUsICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdF9ob3N0XG4gICAgbmF0aXZlLCAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gbmF0aXZlXG4gICAgW10sICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdmlld3NcbiAgXTtcbiAgbmdEZXZNb2RlICYmIGF0dGFjaExDb250YWluZXJEZWJ1ZyhsQ29udGFpbmVyKTtcbiAgcmV0dXJuIGxDb250YWluZXI7XG59XG5cblxuLyoqXG4gKiBHb2VzIG92ZXIgZHluYW1pYyBlbWJlZGRlZCB2aWV3cyAob25lcyBjcmVhdGVkIHRocm91Z2ggVmlld0NvbnRhaW5lclJlZiBBUElzKSBhbmQgcmVmcmVzaGVzIHRoZW1cbiAqIGJ5IGV4ZWN1dGluZyBhbiBhc3NvY2lhdGVkIHRlbXBsYXRlIGZ1bmN0aW9uLlxuICovXG5mdW5jdGlvbiByZWZyZXNoRHluYW1pY0VtYmVkZGVkVmlld3MobFZpZXc6IExWaWV3KSB7XG4gIGZvciAobGV0IGN1cnJlbnQgPSBsVmlld1tDSElMRF9IRUFEXTsgY3VycmVudCAhPT0gbnVsbDsgY3VycmVudCA9IGN1cnJlbnRbTkVYVF0pIHtcbiAgICAvLyBOb3RlOiBjdXJyZW50IGNhbiBiZSBhbiBMVmlldyBvciBhbiBMQ29udGFpbmVyIGluc3RhbmNlLCBidXQgaGVyZSB3ZSBhcmUgb25seSBpbnRlcmVzdGVkXG4gICAgLy8gaW4gTENvbnRhaW5lci4gV2UgY2FuIHRlbGwgaXQncyBhbiBMQ29udGFpbmVyIGJlY2F1c2UgaXRzIGxlbmd0aCBpcyBsZXNzIHRoYW4gdGhlIExWaWV3XG4gICAgLy8gaGVhZGVyLlxuICAgIGlmIChjdXJyZW50Lmxlbmd0aCA8IEhFQURFUl9PRkZTRVQgJiYgY3VycmVudFtBQ1RJVkVfSU5ERVhdID09PSAtMSkge1xuICAgICAgY29uc3QgY29udGFpbmVyID0gY3VycmVudCBhcyBMQ29udGFpbmVyO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250YWluZXJbVklFV1NdLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGR5bmFtaWNWaWV3RGF0YSA9IGNvbnRhaW5lcltWSUVXU11baV07XG4gICAgICAgIC8vIFRoZSBkaXJlY3RpdmVzIGFuZCBwaXBlcyBhcmUgbm90IG5lZWRlZCBoZXJlIGFzIGFuIGV4aXN0aW5nIHZpZXcgaXMgb25seSBiZWluZyByZWZyZXNoZWQuXG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGR5bmFtaWNWaWV3RGF0YVtUVklFV10sICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKGR5bmFtaWNWaWV3RGF0YSwgZHluYW1pY1ZpZXdEYXRhW1RWSUVXXSwgZHluYW1pY1ZpZXdEYXRhW0NPTlRFWFRdICEpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vL1xuXG4vKipcbiAqIFJlZnJlc2hlcyBjb21wb25lbnRzIGJ5IGVudGVyaW5nIHRoZSBjb21wb25lbnQgdmlldyBhbmQgcHJvY2Vzc2luZyBpdHMgYmluZGluZ3MsIHF1ZXJpZXMsIGV0Yy5cbiAqXG4gKiBAcGFyYW0gYWRqdXN0ZWRFbGVtZW50SW5kZXggIEVsZW1lbnQgaW5kZXggaW4gTFZpZXdbXSAoYWRqdXN0ZWQgZm9yIEhFQURFUl9PRkZTRVQpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjb21wb25lbnRSZWZyZXNoKGFkanVzdGVkRWxlbWVudEluZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgY29uc3QgbFZpZXcgPSBnZXRMVmlldygpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGF0YUluUmFuZ2UobFZpZXcsIGFkanVzdGVkRWxlbWVudEluZGV4KTtcbiAgY29uc3QgaG9zdFZpZXcgPSBnZXRDb21wb25lbnRWaWV3QnlJbmRleChhZGp1c3RlZEVsZW1lbnRJbmRleCwgbFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUobFZpZXdbVFZJRVddLmRhdGFbYWRqdXN0ZWRFbGVtZW50SW5kZXhdIGFzIFROb2RlLCBUTm9kZVR5cGUuRWxlbWVudCk7XG5cbiAgLy8gT25seSBjb21wb25lbnRzIGluIGNyZWF0aW9uIG1vZGUsIGF0dGFjaGVkIENoZWNrQWx3YXlzXG4gIC8vIGNvbXBvbmVudHMgb3IgYXR0YWNoZWQsIGRpcnR5IE9uUHVzaCBjb21wb25lbnRzIHNob3VsZCBiZSBjaGVja2VkXG4gIGlmICgodmlld0F0dGFjaGVkVG9DaGFuZ2VEZXRlY3Rvcihob3N0VmlldykgfHwgaXNDcmVhdGlvbk1vZGUobFZpZXcpKSAmJlxuICAgICAgaG9zdFZpZXdbRkxBR1NdICYgKExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMgfCBMVmlld0ZsYWdzLkRpcnR5KSkge1xuICAgIHN5bmNWaWV3V2l0aEJsdWVwcmludChob3N0Vmlldyk7XG4gICAgY2hlY2tWaWV3KGhvc3RWaWV3LCBob3N0Vmlld1tDT05URVhUXSk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jcyBhbiBMVmlldyBpbnN0YW5jZSB3aXRoIGl0cyBibHVlcHJpbnQgaWYgdGhleSBoYXZlIGdvdHRlbiBvdXQgb2Ygc3luYy5cbiAqXG4gKiBUeXBpY2FsbHksIGJsdWVwcmludHMgYW5kIHRoZWlyIHZpZXcgaW5zdGFuY2VzIHNob3VsZCBhbHdheXMgYmUgaW4gc3luYywgc28gdGhlIGxvb3AgaGVyZVxuICogd2lsbCBiZSBza2lwcGVkLiBIb3dldmVyLCBjb25zaWRlciB0aGlzIGNhc2Ugb2YgdHdvIGNvbXBvbmVudHMgc2lkZS1ieS1zaWRlOlxuICpcbiAqIEFwcCB0ZW1wbGF0ZTpcbiAqIGBgYFxuICogPGNvbXA+PC9jb21wPlxuICogPGNvbXA+PC9jb21wPlxuICogYGBgXG4gKlxuICogVGhlIGZvbGxvd2luZyB3aWxsIGhhcHBlbjpcbiAqIDEuIEFwcCB0ZW1wbGF0ZSBiZWdpbnMgcHJvY2Vzc2luZy5cbiAqIDIuIEZpcnN0IDxjb21wPiBpcyBtYXRjaGVkIGFzIGEgY29tcG9uZW50IGFuZCBpdHMgTFZpZXcgaXMgY3JlYXRlZC5cbiAqIDMuIFNlY29uZCA8Y29tcD4gaXMgbWF0Y2hlZCBhcyBhIGNvbXBvbmVudCBhbmQgaXRzIExWaWV3IGlzIGNyZWF0ZWQuXG4gKiA0LiBBcHAgdGVtcGxhdGUgY29tcGxldGVzIHByb2Nlc3NpbmcsIHNvIGl0J3MgdGltZSB0byBjaGVjayBjaGlsZCB0ZW1wbGF0ZXMuXG4gKiA1LiBGaXJzdCA8Y29tcD4gdGVtcGxhdGUgaXMgY2hlY2tlZC4gSXQgaGFzIGEgZGlyZWN0aXZlLCBzbyBpdHMgZGVmIGlzIHB1c2hlZCB0byBibHVlcHJpbnQuXG4gKiA2LiBTZWNvbmQgPGNvbXA+IHRlbXBsYXRlIGlzIGNoZWNrZWQuIEl0cyBibHVlcHJpbnQgaGFzIGJlZW4gdXBkYXRlZCBieSB0aGUgZmlyc3RcbiAqIDxjb21wPiB0ZW1wbGF0ZSwgYnV0IGl0cyBMVmlldyB3YXMgY3JlYXRlZCBiZWZvcmUgdGhpcyB1cGRhdGUsIHNvIGl0IGlzIG91dCBvZiBzeW5jLlxuICpcbiAqIE5vdGUgdGhhdCBlbWJlZGRlZCB2aWV3cyBpbnNpZGUgbmdGb3IgbG9vcHMgd2lsbCBuZXZlciBiZSBvdXQgb2Ygc3luYyBiZWNhdXNlIHRoZXNlIHZpZXdzXG4gKiBhcmUgcHJvY2Vzc2VkIGFzIHNvb24gYXMgdGhleSBhcmUgY3JlYXRlZC5cbiAqXG4gKiBAcGFyYW0gY29tcG9uZW50VmlldyBUaGUgdmlldyB0byBzeW5jXG4gKi9cbmZ1bmN0aW9uIHN5bmNWaWV3V2l0aEJsdWVwcmludChjb21wb25lbnRWaWV3OiBMVmlldykge1xuICBjb25zdCBjb21wb25lbnRUVmlldyA9IGNvbXBvbmVudFZpZXdbVFZJRVddO1xuICBmb3IgKGxldCBpID0gY29tcG9uZW50Vmlldy5sZW5ndGg7IGkgPCBjb21wb25lbnRUVmlldy5ibHVlcHJpbnQubGVuZ3RoOyBpKyspIHtcbiAgICBjb21wb25lbnRWaWV3W2ldID0gY29tcG9uZW50VFZpZXcuYmx1ZXByaW50W2ldO1xuICB9XG59XG5cbi8qKlxuICogQWRkcyBMVmlldyBvciBMQ29udGFpbmVyIHRvIHRoZSBlbmQgb2YgdGhlIGN1cnJlbnQgdmlldyB0cmVlLlxuICpcbiAqIFRoaXMgc3RydWN0dXJlIHdpbGwgYmUgdXNlZCB0byB0cmF2ZXJzZSB0aHJvdWdoIG5lc3RlZCB2aWV3cyB0byByZW1vdmUgbGlzdGVuZXJzXG4gKiBhbmQgY2FsbCBvbkRlc3Ryb3kgY2FsbGJhY2tzLlxuICpcbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3aGVyZSBMVmlldyBvciBMQ29udGFpbmVyIHNob3VsZCBiZSBhZGRlZFxuICogQHBhcmFtIGFkanVzdGVkSG9zdEluZGV4IEluZGV4IG9mIHRoZSB2aWV3J3MgaG9zdCBub2RlIGluIExWaWV3W10sIGFkanVzdGVkIGZvciBoZWFkZXJcbiAqIEBwYXJhbSBsVmlld09yTENvbnRhaW5lciBUaGUgTFZpZXcgb3IgTENvbnRhaW5lciB0byBhZGQgdG8gdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIHN0YXRlIHBhc3NlZCBpblxuICovXG5leHBvcnQgZnVuY3Rpb24gYWRkVG9WaWV3VHJlZTxUIGV4dGVuZHMgTFZpZXd8TENvbnRhaW5lcj4obFZpZXc6IExWaWV3LCBsVmlld09yTENvbnRhaW5lcjogVCk6IFQge1xuICAvLyBUT0RPKGJlbmxlc2gvbWlza28pOiBUaGlzIGltcGxlbWVudGF0aW9uIGlzIGluY29ycmVjdCwgYmVjYXVzZSBpdCBhbHdheXMgYWRkcyB0aGUgTENvbnRhaW5lciB0b1xuICAvLyB0aGUgZW5kIG9mIHRoZSBxdWV1ZSwgd2hpY2ggbWVhbnMgaWYgdGhlIGRldmVsb3BlciByZXRyaWV2ZXMgdGhlIExDb250YWluZXJzIGZyb20gUk5vZGVzIG91dCBvZlxuICAvLyBvcmRlciwgdGhlIGNoYW5nZSBkZXRlY3Rpb24gd2lsbCBydW4gb3V0IG9mIG9yZGVyLCBhcyB0aGUgYWN0IG9mIHJldHJpZXZpbmcgdGhlIHRoZSBMQ29udGFpbmVyXG4gIC8vIGZyb20gdGhlIFJOb2RlIGlzIHdoYXQgYWRkcyBpdCB0byB0aGUgcXVldWUuXG4gIGlmIChsVmlld1tDSElMRF9IRUFEXSkge1xuICAgIGxWaWV3W0NISUxEX1RBSUxdICFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cblxuLyoqXG4gKiBNYXJrcyBjdXJyZW50IHZpZXcgYW5kIGFsbCBhbmNlc3RvcnMgZGlydHkuXG4gKlxuICogUmV0dXJucyB0aGUgcm9vdCB2aWV3IGJlY2F1c2UgaXQgaXMgZm91bmQgYXMgYSBieXByb2R1Y3Qgb2YgbWFya2luZyB0aGUgdmlldyB0cmVlXG4gKiBkaXJ0eSwgYW5kIGNhbiBiZSB1c2VkIGJ5IG1ldGhvZHMgdGhhdCBjb25zdW1lIG1hcmtWaWV3RGlydHkoKSB0byBlYXNpbHkgc2NoZWR1bGVcbiAqIGNoYW5nZSBkZXRlY3Rpb24uIE90aGVyd2lzZSwgc3VjaCBtZXRob2RzIHdvdWxkIG5lZWQgdG8gdHJhdmVyc2UgdXAgdGhlIHZpZXcgdHJlZVxuICogYW4gYWRkaXRpb25hbCB0aW1lIHRvIGdldCB0aGUgcm9vdCB2aWV3IGFuZCBzY2hlZHVsZSBhIHRpY2sgb24gaXQuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBzdGFydGluZyBMVmlldyB0byBtYXJrIGRpcnR5XG4gKiBAcmV0dXJucyB0aGUgcm9vdCBMVmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gbWFya1ZpZXdEaXJ0eShsVmlldzogTFZpZXcpOiBMVmlld3xudWxsIHtcbiAgd2hpbGUgKGxWaWV3KSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gICAgY29uc3QgcGFyZW50ID0gZ2V0TFZpZXdQYXJlbnQobFZpZXcpO1xuICAgIC8vIFN0b3AgdHJhdmVyc2luZyB1cCBhcyBzb29uIGFzIHlvdSBmaW5kIGEgcm9vdCB2aWV3IHRoYXQgd2Fzbid0IGF0dGFjaGVkIHRvIGFueSBjb250YWluZXJcbiAgICBpZiAoaXNSb290VmlldyhsVmlldykgJiYgIXBhcmVudCkge1xuICAgICAgcmV0dXJuIGxWaWV3O1xuICAgIH1cbiAgICAvLyBjb250aW51ZSBvdGhlcndpc2VcbiAgICBsVmlldyA9IHBhcmVudCAhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogVXNlZCB0byBzY2hlZHVsZSBjaGFuZ2UgZGV0ZWN0aW9uIG9uIHRoZSB3aG9sZSBhcHBsaWNhdGlvbi5cbiAqXG4gKiBVbmxpa2UgYHRpY2tgLCBgc2NoZWR1bGVUaWNrYCBjb2FsZXNjZXMgbXVsdGlwbGUgY2FsbHMgaW50byBvbmUgY2hhbmdlIGRldGVjdGlvbiBydW4uXG4gKiBJdCBpcyB1c3VhbGx5IGNhbGxlZCBpbmRpcmVjdGx5IGJ5IGNhbGxpbmcgYG1hcmtEaXJ0eWAgd2hlbiB0aGUgdmlldyBuZWVkcyB0byBiZVxuICogcmUtcmVuZGVyZWQuXG4gKlxuICogVHlwaWNhbGx5IGBzY2hlZHVsZVRpY2tgIHVzZXMgYHJlcXVlc3RBbmltYXRpb25GcmFtZWAgdG8gY29hbGVzY2UgbXVsdGlwbGVcbiAqIGBzY2hlZHVsZVRpY2tgIHJlcXVlc3RzLiBUaGUgc2NoZWR1bGluZyBmdW5jdGlvbiBjYW4gYmUgb3ZlcnJpZGRlbiBpblxuICogYHJlbmRlckNvbXBvbmVudGAncyBgc2NoZWR1bGVyYCBvcHRpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2hlZHVsZVRpY2socm9vdENvbnRleHQ6IFJvb3RDb250ZXh0LCBmbGFnczogUm9vdENvbnRleHRGbGFncykge1xuICBjb25zdCBub3RoaW5nU2NoZWR1bGVkID0gcm9vdENvbnRleHQuZmxhZ3MgPT09IFJvb3RDb250ZXh0RmxhZ3MuRW1wdHk7XG4gIHJvb3RDb250ZXh0LmZsYWdzIHw9IGZsYWdzO1xuXG4gIGlmIChub3RoaW5nU2NoZWR1bGVkICYmIHJvb3RDb250ZXh0LmNsZWFuID09IF9DTEVBTl9QUk9NSVNFKSB7XG4gICAgbGV0IHJlczogbnVsbHwoKHZhbDogbnVsbCkgPT4gdm9pZCk7XG4gICAgcm9vdENvbnRleHQuY2xlYW4gPSBuZXcgUHJvbWlzZTxudWxsPigocikgPT4gcmVzID0gcik7XG4gICAgcm9vdENvbnRleHQuc2NoZWR1bGVyKCgpID0+IHtcbiAgICAgIGlmIChyb290Q29udGV4dC5mbGFncyAmIFJvb3RDb250ZXh0RmxhZ3MuRGV0ZWN0Q2hhbmdlcykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5EZXRlY3RDaGFuZ2VzO1xuICAgICAgICB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQpO1xuICAgICAgfVxuXG4gICAgICBpZiAocm9vdENvbnRleHQuZmxhZ3MgJiBSb290Q29udGV4dEZsYWdzLkZsdXNoUGxheWVycykge1xuICAgICAgICByb290Q29udGV4dC5mbGFncyAmPSB+Um9vdENvbnRleHRGbGFncy5GbHVzaFBsYXllcnM7XG4gICAgICAgIGNvbnN0IHBsYXllckhhbmRsZXIgPSByb290Q29udGV4dC5wbGF5ZXJIYW5kbGVyO1xuICAgICAgICBpZiAocGxheWVySGFuZGxlcikge1xuICAgICAgICAgIHBsYXllckhhbmRsZXIuZmx1c2hQbGF5ZXJzKCk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcm9vdENvbnRleHQuY2xlYW4gPSBfQ0xFQU5fUFJPTUlTRTtcbiAgICAgIHJlcyAhKG51bGwpO1xuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB0aWNrUm9vdENvbnRleHQocm9vdENvbnRleHQ6IFJvb3RDb250ZXh0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgcm9vdENvbnRleHQuY29tcG9uZW50cy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IHJvb3RDb21wb25lbnQgPSByb290Q29udGV4dC5jb21wb25lbnRzW2ldO1xuICAgIHJlbmRlckNvbXBvbmVudE9yVGVtcGxhdGUocmVhZFBhdGNoZWRMVmlldyhyb290Q29tcG9uZW50KSAhLCByb290Q29tcG9uZW50KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZGV0ZWN0Q2hhbmdlc0ludGVybmFsPFQ+KHZpZXc6IExWaWV3LCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IHZpZXdbUkVOREVSRVJfRkFDVE9SWV07XG5cbiAgaWYgKHJlbmRlcmVyRmFjdG9yeS5iZWdpbikgcmVuZGVyZXJGYWN0b3J5LmJlZ2luKCk7XG5cbiAgdHJ5IHtcbiAgICBpZiAoaXNDcmVhdGlvbk1vZGUodmlldykpIHtcbiAgICAgIGNoZWNrVmlldyh2aWV3LCBjb250ZXh0KTsgIC8vIGNyZWF0aW9uIG1vZGUgcGFzc1xuICAgIH1cbiAgICBjaGVja1ZpZXcodmlldywgY29udGV4dCk7ICAvLyB1cGRhdGUgbW9kZSBwYXNzXG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgaGFuZGxlRXJyb3IodmlldywgZXJyb3IpO1xuICAgIHRocm93IGVycm9yO1xuICB9IGZpbmFsbHkge1xuICAgIGlmIChyZW5kZXJlckZhY3RvcnkuZW5kKSByZW5kZXJlckZhY3RvcnkuZW5kKCk7XG4gIH1cbn1cblxuLyoqXG4gKiBTeW5jaHJvbm91c2x5IHBlcmZvcm0gY2hhbmdlIGRldGVjdGlvbiBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBwZXJmb3JtZWQgb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkZXRlY3RDaGFuZ2VzSW5Sb290VmlldyhsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgdGlja1Jvb3RDb250ZXh0KGxWaWV3W0NPTlRFWFRdIGFzIFJvb3RDb250ZXh0KTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB0aGUgY2hhbmdlIGRldGVjdG9yIGFuZCBpdHMgY2hpbGRyZW4sIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlIGRldGVjdGVkLlxuICpcbiAqIFRoaXMgaXMgdXNlZCBpbiBkZXZlbG9wbWVudCBtb2RlIHRvIHZlcmlmeSB0aGF0IHJ1bm5pbmcgY2hhbmdlIGRldGVjdGlvbiBkb2Vzbid0XG4gKiBpbnRyb2R1Y2Ugb3RoZXIgY2hhbmdlcy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrTm9DaGFuZ2VzPFQ+KGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3ID0gZ2V0Q29tcG9uZW50Vmlld0J5SW5zdGFuY2UoY29tcG9uZW50KTtcbiAgY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3LCBjb21wb25lbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJbnRlcm5hbDxUPih2aWV3OiBMVmlldywgY29udGV4dDogVCkge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0ludGVybmFsKHZpZXcsIGNvbnRleHQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDaGVja3MgdGhlIGNoYW5nZSBkZXRlY3RvciBvbiBhIHJvb3QgdmlldyBhbmQgaXRzIGNvbXBvbmVudHMsIGFuZCB0aHJvd3MgaWYgYW55IGNoYW5nZXMgYXJlXG4gKiBkZXRlY3RlZC5cbiAqXG4gKiBUaGlzIGlzIHVzZWQgaW4gZGV2ZWxvcG1lbnQgbW9kZSB0byB2ZXJpZnkgdGhhdCBydW5uaW5nIGNoYW5nZSBkZXRlY3Rpb24gZG9lc24ndFxuICogaW50cm9kdWNlIG90aGVyIGNoYW5nZXMuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoaWNoIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHNob3VsZCBiZSBjaGVja2VkIG9uLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tOb0NoYW5nZXNJblJvb3RWaWV3KGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBzZXRDaGVja05vQ2hhbmdlc01vZGUodHJ1ZSk7XG4gIHRyeSB7XG4gICAgZGV0ZWN0Q2hhbmdlc0luUm9vdFZpZXcobFZpZXcpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldENoZWNrTm9DaGFuZ2VzTW9kZShmYWxzZSk7XG4gIH1cbn1cblxuLyoqIENoZWNrcyB0aGUgdmlldyBvZiB0aGUgY29tcG9uZW50IHByb3ZpZGVkLiBEb2VzIG5vdCBnYXRlIG9uIGRpcnR5IGNoZWNrcyBvciBleGVjdXRlIGRvQ2hlY2suICovXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tWaWV3PFQ+KGhvc3RWaWV3OiBMVmlldywgY29tcG9uZW50OiBUKSB7XG4gIGNvbnN0IGhvc3RUVmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgY29uc3Qgb2xkVmlldyA9IGVudGVyVmlldyhob3N0VmlldywgaG9zdFZpZXdbVF9IT1NUXSk7XG4gIGNvbnN0IHRlbXBsYXRlRm4gPSBob3N0VFZpZXcudGVtcGxhdGUgITtcbiAgY29uc3QgY3JlYXRpb25Nb2RlID0gaXNDcmVhdGlvbk1vZGUoaG9zdFZpZXcpO1xuXG4gIHRyeSB7XG4gICAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhob3N0Vmlldyk7XG4gICAgzpRuYW1lc3BhY2VIVE1MKCk7XG4gICAgY3JlYXRpb25Nb2RlICYmIGV4ZWN1dGVWaWV3UXVlcnlGbihSZW5kZXJGbGFncy5DcmVhdGUsIGhvc3RUVmlldywgY29tcG9uZW50KTtcblxuICAgIC8vIFJlc2V0IHRoZSBzZWxlY3RlZCBpbmRleCBzbyB3ZSBjYW4gYXNzZXJ0IHRoYXQgYHNlbGVjdGAgd2FzIGNhbGxlZCBsYXRlclxuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuXG4gICAgdGVtcGxhdGVGbihnZXRSZW5kZXJGbGFncyhob3N0VmlldyksIGNvbXBvbmVudCk7XG5cbiAgICByZWZyZXNoRGVzY2VuZGFudFZpZXdzKGhvc3RWaWV3KTtcbiAgICAvLyBPbmx5IGNoZWNrIHZpZXcgcXVlcmllcyBhZ2FpbiBpbiBjcmVhdGlvbiBtb2RlIGlmIHRoZXJlIGFyZSBzdGF0aWMgdmlldyBxdWVyaWVzXG4gICAgaWYgKCFjcmVhdGlvbk1vZGUgfHwgaG9zdFRWaWV3LnN0YXRpY1ZpZXdRdWVyaWVzKSB7XG4gICAgICBleGVjdXRlVmlld1F1ZXJ5Rm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCBob3N0VFZpZXcsIGNvbXBvbmVudCk7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGxlYXZlVmlldyhvbGRWaWV3KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oZmxhZ3M6IFJlbmRlckZsYWdzLCB0VmlldzogVFZpZXcsIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBjb25zdCB2aWV3UXVlcnkgPSB0Vmlldy52aWV3UXVlcnk7XG4gIGlmICh2aWV3UXVlcnkpIHtcbiAgICBzZXRDdXJyZW50UXVlcnlJbmRleCh0Vmlldy52aWV3UXVlcnlTdGFydEluZGV4KTtcbiAgICB2aWV3UXVlcnkoZmxhZ3MsIGNvbXBvbmVudCk7XG4gIH1cbn1cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGJpbmRpbmcgbWV0YWRhdGEgZm9yIGEgcGFydGljdWxhciBiaW5kaW5nIGFuZCBzdG9yZXMgaXQgaW5cbiAqIFRWaWV3LmRhdGEuIFRoZXNlIGFyZSBnZW5lcmF0ZWQgaW4gb3JkZXIgdG8gc3VwcG9ydCBEZWJ1Z0VsZW1lbnQucHJvcGVydGllcy5cbiAqXG4gKiBFYWNoIGJpbmRpbmcgLyBpbnRlcnBvbGF0aW9uIHdpbGwgaGF2ZSBvbmUgKGluY2x1ZGluZyBhdHRyaWJ1dGUgYmluZGluZ3MpXG4gKiBiZWNhdXNlIGF0IHRoZSB0aW1lIG9mIGJpbmRpbmcsIHdlIGRvbid0IGtub3cgdG8gd2hpY2ggaW5zdHJ1Y3Rpb24gdGhlIGJpbmRpbmdcbiAqIGJlbG9uZ3MuIEl0IGlzIGFsd2F5cyBzdG9yZWQgaW4gVFZpZXcuZGF0YSBhdCB0aGUgaW5kZXggb2YgdGhlIGxhc3QgYmluZGluZ1xuICogdmFsdWUgaW4gTFZpZXcgKGUuZy4gZm9yIGludGVycG9sYXRpb244LCBpdCB3b3VsZCBiZSBzdG9yZWQgYXQgdGhlIGluZGV4IG9mXG4gKiB0aGUgOHRoIHZhbHVlKS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIExWaWV3IHRoYXQgY29udGFpbnMgdGhlIGN1cnJlbnQgYmluZGluZyBpbmRleC5cbiAqIEBwYXJhbSBwcmVmaXggVGhlIHN0YXRpYyBwcmVmaXggc3RyaW5nXG4gKiBAcGFyYW0gc3VmZml4IFRoZSBzdGF0aWMgc3VmZml4IHN0cmluZ1xuICpcbiAqIEByZXR1cm5zIE5ld2x5IGNyZWF0ZWQgYmluZGluZyBtZXRhZGF0YSBzdHJpbmcgZm9yIHRoaXMgYmluZGluZyBvciBudWxsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUJpbmRpbmdNZXRhZGF0YShsVmlldzogTFZpZXcsIHByZWZpeCA9ICcnLCBzdWZmaXggPSAnJyk6IHN0cmluZ3xudWxsIHtcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgbGFzdEJpbmRpbmdJbmRleCA9IGxWaWV3W0JJTkRJTkdfSU5ERVhdIC0gMTtcbiAgY29uc3QgdmFsdWUgPSBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUiArIHByZWZpeCArIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgc3VmZml4O1xuXG4gIHJldHVybiB0RGF0YVtsYXN0QmluZGluZ0luZGV4XSA9PSBudWxsID8gKHREYXRhW2xhc3RCaW5kaW5nSW5kZXhdID0gdmFsdWUpIDogbnVsbDtcbn1cblxuZXhwb3J0IGNvbnN0IENMRUFOX1BST01JU0UgPSBfQ0xFQU5fUFJPTUlTRTtcblxuZXhwb3J0IGZ1bmN0aW9uIGluaXRpYWxpemVUTm9kZUlucHV0cyh0Tm9kZTogVE5vZGUgfCBudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICAvLyBJZiB0Tm9kZS5pbnB1dHMgaXMgdW5kZWZpbmVkLCBhIGxpc3RlbmVyIGhhcyBjcmVhdGVkIG91dHB1dHMsIGJ1dCBpbnB1dHMgaGF2ZW4ndFxuICAvLyB5ZXQgYmVlbiBjaGVja2VkLlxuICBpZiAodE5vZGUpIHtcbiAgICBpZiAodE5vZGUuaW5wdXRzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIC8vIG1hcmsgaW5wdXRzIGFzIGNoZWNrZWRcbiAgICAgIHROb2RlLmlucHV0cyA9IGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKHROb2RlLCBCaW5kaW5nRGlyZWN0aW9uLklucHV0KTtcbiAgICB9XG4gICAgcmV0dXJuIHROb2RlLmlucHV0cztcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xlYW51cCh2aWV3OiBMVmlldyk6IGFueVtdIHtcbiAgLy8gdG9wIGxldmVsIHZhcmlhYmxlcyBzaG91bGQgbm90IGJlIGV4cG9ydGVkIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIChQRVJGX05PVEVTLm1kKVxuICByZXR1cm4gdmlld1tDTEVBTlVQXSB8fCAodmlld1tDTEVBTlVQXSA9IFtdKTtcbn1cblxuZnVuY3Rpb24gZ2V0VFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3KTogYW55W10ge1xuICByZXR1cm4gdmlld1tUVklFV10uY2xlYW51cCB8fCAodmlld1tUVklFV10uY2xlYW51cCA9IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIzIHtcbiAgY29uc3QgY29tcG9uZW50TFZpZXcgPSBsVmlld1t0Tm9kZS5pbmRleF0gYXMgTFZpZXc7XG4gIHJldHVybiBjb21wb25lbnRMVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgdGhlIGBMVmlld2Agd2hpY2ggY29udGFpbnMgdGhlIGRpcmVjdGl2ZXMuXG4gKiBAcGFyYW0gaW5wdXRBbGlhc2VzIG1hcHBpbmcgYmV0d2VlbiB0aGUgcHVibGljIFwiaW5wdXRcIiBuYW1lIGFuZCBwcml2YXRlbHkta25vd24sXG4gKiBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkobFZpZXc6IExWaWV3LCBpbnB1dHM6IFByb3BlcnR5QWxpYXNWYWx1ZSwgdmFsdWU6IGFueSk6IHZvaWQge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERhdGFJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3Qgc2V0SW5wdXQgPSBkZWYuc2V0SW5wdXQ7XG4gICAgaWYgKHNldElucHV0KSB7XG4gICAgICBkZWYuc2V0SW5wdXQgIShpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaW5zdGFuY2VbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9XG59XG4iXX0=