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
import { processTextNodeMarkersBeforeHydration } from '../../hydration/utils';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { setActiveConsumer } from '../../signals';
import { assertDefined, assertEqual, assertGreaterThan, assertGreaterThanOrEqual, assertIndexInRange, assertNotEqual, assertNotSame, assertSame, assertString } from '../../util/assert';
import { escapeCommentText } from '../../util/dom';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { stringify } from '../../util/stringify';
import { assertFirstCreatePass, assertFirstUpdatePass, assertLView, assertTNodeForLView, assertTNodeForTView } from '../assert';
import { attachPatchData } from '../context_discovery';
import { getFactoryDef } from '../definition_factory';
import { diPublicInInjector, getNodeInjectable, getOrCreateNodeInjectorForNode } from '../di';
import { throwMultipleComponentError } from '../errors';
import { CONTAINER_HEADER_OFFSET } from '../interfaces/container';
import { NodeInjectorFactory } from '../interfaces/injector';
import { getUniqueLViewId } from '../interfaces/lview_tracking';
import { isComponentDef, isComponentHost, isContentQueryHost } from '../interfaces/type_checks';
import { CHILD_HEAD, CHILD_TAIL, CLEANUP, CONTEXT, DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, EMBEDDED_VIEW_INJECTOR, ENVIRONMENT, FLAGS, HEADER_OFFSET, HOST, HYDRATION, ID, INJECTOR, NEXT, PARENT, REACTIVE_HOST_BINDING_CONSUMER, REACTIVE_TEMPLATE_CONSUMER, RENDERER, T_HOST, TVIEW } from '../interfaces/view';
import { assertPureTNodeType, assertTNodeType } from '../node_assert';
import { clearElementContents, updateTextNode } from '../node_manipulation';
import { isInlineTemplate, isNodeMatchingSelectorList } from '../node_selector_matcher';
import { profiler } from '../profiler';
import { commitLViewConsumerIfHasProducers, getReactiveLViewConsumer } from '../reactive_lview_consumer';
import { getBindingsEnabled, getCurrentDirectiveIndex, getCurrentParentTNode, getCurrentTNodePlaceholderOk, getSelectedIndex, isCurrentTNodeParent, isInCheckNoChangesMode, isInI18nBlock, isInSkipHydrationBlock, setBindingRootForHostBindings, setCurrentDirectiveIndex, setCurrentQueryIndex, setCurrentTNode, setSelectedIndex } from '../state';
import { NO_CHANGE } from '../tokens';
import { mergeHostAttrs } from '../util/attrs_utils';
import { INTERPOLATION_DELIMITER } from '../util/misc_utils';
import { renderStringify } from '../util/stringify_utils';
import { getComponentLViewByIndex, getNativeByIndex, getNativeByTNode, resetPreOrderHookFlags, unwrapLView } from '../util/view_utils';
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
        if (lView[REACTIVE_HOST_BINDING_CONSUMER] === null) {
            commitLViewConsumerIfHasProducers(lView, REACTIVE_HOST_BINDING_CONSUMER);
        }
        setSelectedIndex(-1);
    }
}
export function createLView(parentLView, tView, context, flags, host, tHostNode, environment, renderer, injector, embeddedViewInjector, hydrationInfo) {
    const lView = tView.blueprint.slice();
    lView[HOST] = host;
    lView[FLAGS] = flags | 4 /* LViewFlags.CreationMode */ | 128 /* LViewFlags.Attached */ | 8 /* LViewFlags.FirstLViewPass */;
    if (embeddedViewInjector !== null ||
        (parentLView && (parentLView[FLAGS] & 2048 /* LViewFlags.HasEmbeddedViewInjector */))) {
        lView[FLAGS] |= 2048 /* LViewFlags.HasEmbeddedViewInjector */;
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
export function executeTemplate(tView, lView, templateFn, rf, context) {
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
        if (isUpdatePhase) {
            consumer.runInContext(templateFn, rf, context);
        }
        else {
            const prevConsumer = setActiveConsumer(null);
            try {
                templateFn(rf, context);
            }
            finally {
                setActiveConsumer(prevConsumer);
            }
        }
    }
    finally {
        if (isUpdatePhase && lView[REACTIVE_TEMPLATE_CONSUMER] === null) {
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
        const prevConsumer = setActiveConsumer(null);
        try {
            const start = tNode.directiveStart;
            const end = tNode.directiveEnd;
            for (let directiveIndex = start; directiveIndex < end; directiveIndex++) {
                const def = tView.data[directiveIndex];
                if (def.contentQueries) {
                    def.contentQueries(1 /* RenderFlags.Create */, lView[directiveIndex], directiveIndex);
                }
            }
        }
        finally {
            setActiveConsumer(prevConsumer);
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
    let flags = 0;
    if (isInSkipHydrationBlock()) {
        flags |= 128 /* TNodeFlags.inSkipHydrationBlock */;
    }
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
        flags,
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
        childComponentLView[FLAGS] |= 64 /* LViewFlags.Dirty */;
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
    const componentView = addToViewTree(lView, createLView(lView, tView, null, def.onPush ? 64 /* LViewFlags.Dirty */ : 16 /* LViewFlags.CheckAlways */, native, hostTNode, null, rendererFactory.createRenderer(native, def), null, null, null));
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
        for (let i = 0; i < initialInputs.length;) {
            const publicName = initialInputs[i++];
            const privateName = initialInputs[i++];
            const value = initialInputs[i++];
            writeToDirectiveInput(def, instance, publicName, privateName, value);
            if (ngDevMode) {
                const nativeElement = getNativeByTNode(tNode, lView);
                setNgReflectProperty(lView, nativeElement, tNode.type, privateName, value);
            }
        }
    }
}
function writeToDirectiveInput(def, instance, publicName, privateName, value) {
    const prevConsumer = setActiveConsumer(null);
    try {
        if (def.setInput !== null) {
            def.setInput(instance, value, publicName, privateName);
        }
        else {
            instance[privateName] = value;
        }
    }
    finally {
        setActiveConsumer(prevConsumer);
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
/** Refreshes all content queries declared by directives in a given view */
export function refreshContentQueries(tView, lView) {
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
export function executeViewQueryFn(flags, viewQueryFn, component) {
    ngDevMode && assertDefined(viewQueryFn, 'View queries function to execute must be defined.');
    setCurrentQueryIndex(0);
    const prevConsumer = setActiveConsumer(null);
    try {
        viewQueryFn(flags, component);
    }
    finally {
        setActiveConsumer(prevConsumer);
    }
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
        writeToDirectiveInput(def, instance, publicName, privateName, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUdILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUU1RCxPQUFPLEVBQThCLHdCQUF3QixFQUFDLE1BQU0sZ0NBQWdDLENBQUM7QUFDckcsT0FBTyxFQUFDLHFCQUFxQixFQUFFLDZCQUE2QixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDNUYsT0FBTyxFQUFDLHFDQUFxQyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFHNUUsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDdEQsT0FBTyxFQUFDLDhCQUE4QixFQUFFLDhCQUE4QixFQUFDLE1BQU0saUNBQWlDLENBQUM7QUFDL0csT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ2hELE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGlCQUFpQixFQUFFLHdCQUF3QixFQUFFLGtCQUFrQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUUsVUFBVSxFQUFFLFlBQVksRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ3ZMLE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2pELE9BQU8sRUFBQyx5QkFBeUIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzVGLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUMvQyxPQUFPLEVBQUMscUJBQXFCLEVBQUUscUJBQXFCLEVBQUUsV0FBVyxFQUFFLG1CQUFtQixFQUFFLG1CQUFtQixFQUFDLE1B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O0tBQ3RFO0FBQ0gsQ0FBQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVksRUFBRSxLQUFhLEVBQUUsS0FBYTtJQUM1RSxTQUFTLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSwwQkFBMEIsQ0FBQyxDQUFDO0lBQzdELFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLFNBQWdCLEVBQUUsK0JBQStCLENBQUMsQ0FBQztJQUNyRixTQUFTLElBQUksa0JBQWtCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzlDLE1BQU0sT0FBTyxHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQWlCLENBQUM7SUFDL0QsU0FBUyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsNkJBQTZCLENBQUMsQ0FBQztJQUNuRSxjQUFjLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNsRCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi8uLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtoYXNJblNraXBIeWRyYXRpb25CbG9ja0ZsYWcsIFNLSVBfSFlEUkFUSU9OX0FUVFJfTkFNRX0gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3NraXBfaHlkcmF0aW9uJztcbmltcG9ydCB7UFJFU0VSVkVfSE9TVF9DT05URU5ULCBQUkVTRVJWRV9IT1NUX0NPTlRFTlRfREVGQVVMVH0gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL3Rva2Vucyc7XG5pbXBvcnQge3Byb2Nlc3NUZXh0Tm9kZU1hcmtlcnNCZWZvcmVIeWRyYXRpb259IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi91dGlscyc7XG5pbXBvcnQge0RvQ2hlY2ssIE9uQ2hhbmdlcywgT25Jbml0fSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvbGlmZWN5Y2xlX2hvb2tzJztcbmltcG9ydCB7U2NoZW1hTWV0YWRhdGF9IGZyb20gJy4uLy4uL21ldGFkYXRhL3NjaGVtYSc7XG5pbXBvcnQge1ZpZXdFbmNhcHN1bGF0aW9ufSBmcm9tICcuLi8uLi9tZXRhZGF0YS92aWV3JztcbmltcG9ydCB7dmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzLCB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXN9IGZyb20gJy4uLy4uL3Nhbml0aXphdGlvbi9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtzZXRBY3RpdmVDb25zdW1lcn0gZnJvbSAnLi4vLi4vc2lnbmFscyc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsLCBhc3NlcnRJbmRleEluUmFuZ2UsIGFzc2VydE5vdEVxdWFsLCBhc3NlcnROb3RTYW1lLCBhc3NlcnRTYW1lLCBhc3NlcnRTdHJpbmd9IGZyb20gJy4uLy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7ZXNjYXBlQ29tbWVudFRleHR9IGZyb20gJy4uLy4uL3V0aWwvZG9tJztcbmltcG9ydCB7bm9ybWFsaXplRGVidWdCaW5kaW5nTmFtZSwgbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWV9IGZyb20gJy4uLy4uL3V0aWwvbmdfcmVmbGVjdCc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vLi4vdXRpbC9zdHJpbmdpZnknO1xuaW1wb3J0IHthc3NlcnRGaXJzdENyZWF0ZVBhc3MsIGFzc2VydEZpcnN0VXBkYXRlUGFzcywgYXNzZXJ0TFZpZXcsIGFzc2VydFROb2RlRm9yTFZpZXcsIGFzc2VydFROb2RlRm9yVFZpZXd9IGZyb20gJy4uL2Fzc2VydCc7XG5pbXBvcnQge2F0dGFjaFBhdGNoRGF0YX0gZnJvbSAnLi4vY29udGV4dF9kaXNjb3ZlcnknO1xuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuLi9kZWZpbml0aW9uX2ZhY3RvcnknO1xuaW1wb3J0IHtkaVB1YmxpY0luSW5qZWN0b3IsIGdldE5vZGVJbmplY3RhYmxlLCBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGV9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7dGhyb3dNdWx0aXBsZUNvbXBvbmVudEVycm9yfSBmcm9tICcuLi9lcnJvcnMnO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnREZWYsIENvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3RPckZhY3RvcnksIEhvc3RCaW5kaW5nc0Z1bmN0aW9uLCBIb3N0RGlyZWN0aXZlQmluZGluZ01hcCwgSG9zdERpcmVjdGl2ZURlZnMsIFBpcGVEZWZMaXN0T3JGYWN0b3J5LCBSZW5kZXJGbGFncywgVmlld1F1ZXJpZXNGdW5jdGlvbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tm9kZUluamVjdG9yRmFjdG9yeX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge2dldFVuaXF1ZUxWaWV3SWR9IGZyb20gJy4uL2ludGVyZmFjZXMvbHZpZXdfdHJhY2tpbmcnO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIEluaXRpYWxJbnB1dERhdGEsIEluaXRpYWxJbnB1dHMsIExvY2FsUmVmRXh0cmFjdG9yLCBQcm9wZXJ0eUFsaWFzZXMsIFByb3BlcnR5QWxpYXNWYWx1ZSwgVEF0dHJpYnV0ZXMsIFRDb25zdGFudHNPckZhY3RvcnksIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUSWN1Q29udGFpbmVyTm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZSwgVFByb2plY3Rpb25Ob2RlfSBmcm9tICcuLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtSZW5kZXJlcn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge1JDb21tZW50LCBSRWxlbWVudCwgUk5vZGUsIFJUZXh0fSBmcm9tICcuLi9pbnRlcmZhY2VzL3JlbmRlcmVyX2RvbSc7XG5pbXBvcnQge1Nhbml0aXplckZufSBmcm9tICcuLi9pbnRlcmZhY2VzL3Nhbml0aXphdGlvbic7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3QsIGlzQ29udGVudFF1ZXJ5SG9zdH0gZnJvbSAnLi4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0NISUxEX0hFQUQsIENISUxEX1RBSUwsIENMRUFOVVAsIENPTlRFWFQsIERFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBERUNMQVJBVElPTl9WSUVXLCBFTUJFRERFRF9WSUVXX0lOSkVDVE9SLCBFTlZJUk9OTUVOVCwgRkxBR1MsIEhFQURFUl9PRkZTRVQsIEhPU1QsIEhvc3RCaW5kaW5nT3BDb2RlcywgSFlEUkFUSU9OLCBJRCwgSU5KRUNUT1IsIExWaWV3LCBMVmlld0Vudmlyb25tZW50LCBMVmlld0ZsYWdzLCBORVhULCBQQVJFTlQsIFJFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUiwgUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVIsIFJFTkRFUkVSLCBUX0hPU1QsIFREYXRhLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0UHVyZVROb2RlVHlwZSwgYXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2NsZWFyRWxlbWVudENvbnRlbnRzLCB1cGRhdGVUZXh0Tm9kZX0gZnJvbSAnLi4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtpc0lubGluZVRlbXBsYXRlLCBpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdH0gZnJvbSAnLi4vbm9kZV9zZWxlY3Rvcl9tYXRjaGVyJztcbmltcG9ydCB7cHJvZmlsZXIsIFByb2ZpbGVyRXZlbnR9IGZyb20gJy4uL3Byb2ZpbGVyJztcbmltcG9ydCB7Y29tbWl0TFZpZXdDb25zdW1lcklmSGFzUHJvZHVjZXJzLCBnZXRSZWFjdGl2ZUxWaWV3Q29uc3VtZXJ9IGZyb20gJy4uL3JlYWN0aXZlX2x2aWV3X2NvbnN1bWVyJztcbmltcG9ydCB7Z2V0QmluZGluZ3NFbmFibGVkLCBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgsIGdldEN1cnJlbnRQYXJlbnRUTm9kZSwgZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaywgZ2V0U2VsZWN0ZWRJbmRleCwgaXNDdXJyZW50VE5vZGVQYXJlbnQsIGlzSW5DaGVja05vQ2hhbmdlc01vZGUsIGlzSW5JMThuQmxvY2ssIGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2ssIGxlYXZlVmlldywgc2V0QmluZGluZ1Jvb3RGb3JIb3N0QmluZGluZ3MsIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleCwgc2V0Q3VycmVudFF1ZXJ5SW5kZXgsIHNldEN1cnJlbnRUTm9kZSwgc2V0U2VsZWN0ZWRJbmRleH0gZnJvbSAnLi4vc3RhdGUnO1xuaW1wb3J0IHtOT19DSEFOR0V9IGZyb20gJy4uL3Rva2Vucyc7XG5pbXBvcnQge21lcmdlSG9zdEF0dHJzfSBmcm9tICcuLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7SU5URVJQT0xBVElPTl9ERUxJTUlURVJ9IGZyb20gJy4uL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge3JlbmRlclN0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuaW1wb3J0IHtnZXRDb21wb25lbnRMVmlld0J5SW5kZXgsIGdldE5hdGl2ZUJ5SW5kZXgsIGdldE5hdGl2ZUJ5VE5vZGUsIHJlc2V0UHJlT3JkZXJIb29rRmxhZ3MsIHVud3JhcExWaWV3fSBmcm9tICcuLi91dGlsL3ZpZXdfdXRpbHMnO1xuXG5pbXBvcnQge3NlbGVjdEluZGV4SW50ZXJuYWx9IGZyb20gJy4vYWR2YW5jZSc7XG5pbXBvcnQge8m1ybVkaXJlY3RpdmVJbmplY3R9IGZyb20gJy4vZGknO1xuaW1wb3J0IHtoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvciwgaXNQcm9wZXJ0eVZhbGlkLCBtYXRjaGluZ1NjaGVtYXN9IGZyb20gJy4vZWxlbWVudF92YWxpZGF0aW9uJztcblxuLyoqXG4gKiBJbnZva2UgYEhvc3RCaW5kaW5nc0Z1bmN0aW9uYHMgZm9yIHZpZXcuXG4gKlxuICogVGhpcyBtZXRob2RzIGV4ZWN1dGVzIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLiBJdCBpcyB1c2VkIHRvIGV4ZWN1dGUgdGhlXG4gKiBgSG9zdEJpbmRpbmdzRnVuY3Rpb25gcyBhc3NvY2lhdGVkIHdpdGggdGhlIGN1cnJlbnQgYExWaWV3YC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgQ3VycmVudCBgVFZpZXdgLlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgYExWaWV3YC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHByb2Nlc3NIb3N0QmluZGluZ09wQ29kZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzO1xuICBpZiAoaG9zdEJpbmRpbmdPcENvZGVzID09PSBudWxsKSByZXR1cm47XG4gIGNvbnN0IGNvbnN1bWVyID0gZ2V0UmVhY3RpdmVMVmlld0NvbnN1bWVyKGxWaWV3LCBSRUFDVElWRV9IT1NUX0JJTkRJTkdfQ09OU1VNRVIpO1xuICB0cnkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaG9zdEJpbmRpbmdPcENvZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvcENvZGUgPSBob3N0QmluZGluZ09wQ29kZXNbaV0gYXMgbnVtYmVyO1xuICAgICAgaWYgKG9wQ29kZSA8IDApIHtcbiAgICAgICAgLy8gTmVnYXRpdmUgbnVtYmVycyBhcmUgZWxlbWVudCBpbmRleGVzLlxuICAgICAgICBzZXRTZWxlY3RlZEluZGV4KH5vcENvZGUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gUG9zaXRpdmUgbnVtYmVycyBhcmUgTnVtYmVyVHVwbGUgd2hpY2ggc3RvcmUgYmluZGluZ1Jvb3RJbmRleCBhbmQgZGlyZWN0aXZlSW5kZXguXG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZUlkeCA9IG9wQ29kZTtcbiAgICAgICAgY29uc3QgYmluZGluZ1Jvb3RJbmR4ID0gaG9zdEJpbmRpbmdPcENvZGVzWysraV0gYXMgbnVtYmVyO1xuICAgICAgICBjb25zdCBob3N0QmluZGluZ0ZuID0gaG9zdEJpbmRpbmdPcENvZGVzWysraV0gYXMgSG9zdEJpbmRpbmdzRnVuY3Rpb248YW55PjtcbiAgICAgICAgc2V0QmluZGluZ1Jvb3RGb3JIb3N0QmluZGluZ3MoYmluZGluZ1Jvb3RJbmR4LCBkaXJlY3RpdmVJZHgpO1xuICAgICAgICBjb25zdCBjb250ZXh0ID0gbFZpZXdbZGlyZWN0aXZlSWR4XTtcbiAgICAgICAgY29uc3VtZXIucnVuSW5Db250ZXh0KGhvc3RCaW5kaW5nRm4sIFJlbmRlckZsYWdzLlVwZGF0ZSwgY29udGV4dCk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIGlmIChsVmlld1tSRUFDVElWRV9IT1NUX0JJTkRJTkdfQ09OU1VNRVJdID09PSBudWxsKSB7XG4gICAgICBjb21taXRMVmlld0NvbnN1bWVySWZIYXNQcm9kdWNlcnMobFZpZXcsIFJFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUik7XG4gICAgfVxuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMVmlldzxUPihcbiAgICBwYXJlbnRMVmlldzogTFZpZXd8bnVsbCwgdFZpZXc6IFRWaWV3LCBjb250ZXh0OiBUfG51bGwsIGZsYWdzOiBMVmlld0ZsYWdzLCBob3N0OiBSRWxlbWVudHxudWxsLFxuICAgIHRIb3N0Tm9kZTogVE5vZGV8bnVsbCwgZW52aXJvbm1lbnQ6IExWaWV3RW52aXJvbm1lbnR8bnVsbCwgcmVuZGVyZXI6IFJlbmRlcmVyfG51bGwsXG4gICAgaW5qZWN0b3I6IEluamVjdG9yfG51bGwsIGVtYmVkZGVkVmlld0luamVjdG9yOiBJbmplY3RvcnxudWxsLFxuICAgIGh5ZHJhdGlvbkluZm86IERlaHlkcmF0ZWRWaWV3fG51bGwpOiBMVmlldyB7XG4gIGNvbnN0IGxWaWV3ID0gdFZpZXcuYmx1ZXByaW50LnNsaWNlKCkgYXMgTFZpZXc7XG4gIGxWaWV3W0hPU1RdID0gaG9zdDtcbiAgbFZpZXdbRkxBR1NdID0gZmxhZ3MgfCBMVmlld0ZsYWdzLkNyZWF0aW9uTW9kZSB8IExWaWV3RmxhZ3MuQXR0YWNoZWQgfCBMVmlld0ZsYWdzLkZpcnN0TFZpZXdQYXNzO1xuICBpZiAoZW1iZWRkZWRWaWV3SW5qZWN0b3IgIT09IG51bGwgfHxcbiAgICAgIChwYXJlbnRMVmlldyAmJiAocGFyZW50TFZpZXdbRkxBR1NdICYgTFZpZXdGbGFncy5IYXNFbWJlZGRlZFZpZXdJbmplY3RvcikpKSB7XG4gICAgbFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuSGFzRW1iZWRkZWRWaWV3SW5qZWN0b3I7XG4gIH1cbiAgcmVzZXRQcmVPcmRlckhvb2tGbGFncyhsVmlldyk7XG4gIG5nRGV2TW9kZSAmJiB0Vmlldy5kZWNsVE5vZGUgJiYgcGFyZW50TFZpZXcgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyh0Vmlldy5kZWNsVE5vZGUsIHBhcmVudExWaWV3KTtcbiAgbFZpZXdbUEFSRU5UXSA9IGxWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddID0gcGFyZW50TFZpZXc7XG4gIGxWaWV3W0NPTlRFWFRdID0gY29udGV4dDtcbiAgbFZpZXdbRU5WSVJPTk1FTlRdID0gKGVudmlyb25tZW50IHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0VOVklST05NRU5UXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tFTlZJUk9OTUVOVF0sICdMVmlld0Vudmlyb25tZW50IGlzIHJlcXVpcmVkJyk7XG4gIGxWaWV3W1JFTkRFUkVSXSA9IChyZW5kZXJlciB8fCBwYXJlbnRMVmlldyAmJiBwYXJlbnRMVmlld1tSRU5ERVJFUl0pITtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQobFZpZXdbUkVOREVSRVJdLCAnUmVuZGVyZXIgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbSU5KRUNUT1IgYXMgYW55XSA9IGluamVjdG9yIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W0lOSkVDVE9SXSB8fCBudWxsO1xuICBsVmlld1tUX0hPU1RdID0gdEhvc3ROb2RlO1xuICBsVmlld1tJRF0gPSBnZXRVbmlxdWVMVmlld0lkKCk7XG4gIGxWaWV3W0hZRFJBVElPTl0gPSBoeWRyYXRpb25JbmZvO1xuICBsVmlld1tFTUJFRERFRF9WSUVXX0lOSkVDVE9SIGFzIGFueV0gPSBlbWJlZGRlZFZpZXdJbmplY3RvcjtcblxuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydEVxdWFsKFxuICAgICAgICAgIHRWaWV3LnR5cGUgPT0gVFZpZXdUeXBlLkVtYmVkZGVkID8gcGFyZW50TFZpZXcgIT09IG51bGwgOiB0cnVlLCB0cnVlLFxuICAgICAgICAgICdFbWJlZGRlZCB2aWV3cyBtdXN0IGhhdmUgcGFyZW50TFZpZXcnKTtcbiAgbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddID1cbiAgICAgIHRWaWV3LnR5cGUgPT0gVFZpZXdUeXBlLkVtYmVkZGVkID8gcGFyZW50TFZpZXchW0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXSA6IGxWaWV3O1xuICByZXR1cm4gbFZpZXc7XG59XG5cbi8qKlxuICogQ3JlYXRlIGFuZCBzdG9yZXMgdGhlIFROb2RlLCBhbmQgaG9va3MgaXQgdXAgdG8gdGhlIHRyZWUuXG4gKlxuICogQHBhcmFtIHRWaWV3IFRoZSBjdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IGF0IHdoaWNoIHRoZSBUTm9kZSBzaG91bGQgYmUgc2F2ZWQgKG51bGwgaWYgdmlldywgc2luY2UgdGhleSBhcmUgbm90XG4gKiBzYXZlZCkuXG4gKiBAcGFyYW0gdHlwZSBUaGUgdHlwZSBvZiBUTm9kZSB0byBjcmVhdGVcbiAqIEBwYXJhbSBuYXRpdmUgVGhlIG5hdGl2ZSBlbGVtZW50IGZvciB0aGlzIG5vZGUsIGlmIGFwcGxpY2FibGVcbiAqIEBwYXJhbSBuYW1lIFRoZSB0YWcgbmFtZSBvZiB0aGUgYXNzb2NpYXRlZCBuYXRpdmUgZWxlbWVudCwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIGF0dHJzIEFueSBhdHRycyBmb3IgdGhlIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuQ29udGFpbmVyLCBuYW1lOiBzdHJpbmd8bnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuUHJvamVjdGlvbiwgbmFtZTogbnVsbCxcbiAgICBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnRDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUsIG5hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6XG4gICAgVEVsZW1lbnROb2RlJlRDb250YWluZXJOb2RlJlRFbGVtZW50Q29udGFpbmVyTm9kZSZUUHJvamVjdGlvbk5vZGUmVEljdUNvbnRhaW5lck5vZGUge1xuICBuZ0Rldk1vZGUgJiYgaW5kZXggIT09IDAgJiYgIC8vIDAgYXJlIGJvZ3VzIG5vZGVzIGFuZCB0aGV5IGFyZSBPSy4gU2VlIGBjcmVhdGVDb250YWluZXJSZWZgIGluXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gYHZpZXdfZW5naW5lX2NvbXBhdGliaWxpdHlgIGZvciBhZGRpdGlvbmFsIGNvbnRleHQuXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoaW5kZXgsIEhFQURFUl9PRkZTRVQsICdUTm9kZXMgY2FuXFwndCBiZSBpbiB0aGUgTFZpZXcgaGVhZGVyLicpO1xuICAvLyBLZWVwIHRoaXMgZnVuY3Rpb24gc2hvcnQsIHNvIHRoYXQgdGhlIFZNIHdpbGwgaW5saW5lIGl0LlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHVyZVROb2RlVHlwZSh0eXBlKTtcbiAgbGV0IHROb2RlID0gdFZpZXcuZGF0YVtpbmRleF0gYXMgVE5vZGU7XG4gIGlmICh0Tm9kZSA9PT0gbnVsbCkge1xuICAgIHROb2RlID0gY3JlYXRlVE5vZGVBdEluZGV4KHRWaWV3LCBpbmRleCwgdHlwZSwgbmFtZSwgYXR0cnMpO1xuICAgIGlmIChpc0luSTE4bkJsb2NrKCkpIHtcbiAgICAgIC8vIElmIHdlIGFyZSBpbiBpMThuIGJsb2NrIHRoZW4gYWxsIGVsZW1lbnRzIHNob3VsZCBiZSBwcmUgZGVjbGFyZWQgdGhyb3VnaCBgUGxhY2Vob2xkZXJgXG4gICAgICAvLyBTZWUgYFROb2RlVHlwZS5QbGFjZWhvbGRlcmAgYW5kIGBMRnJhbWUuaW5JMThuYCBmb3IgbW9yZSBjb250ZXh0LlxuICAgICAgLy8gSWYgdGhlIGBUTm9kZWAgd2FzIG5vdCBwcmUtZGVjbGFyZWQgdGhhbiBpdCBtZWFucyBpdCB3YXMgbm90IG1lbnRpb25lZCB3aGljaCBtZWFucyBpdCB3YXNcbiAgICAgIC8vIHJlbW92ZWQsIHNvIHdlIG1hcmsgaXQgYXMgZGV0YWNoZWQuXG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGV0YWNoZWQ7XG4gICAgfVxuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuUGxhY2Vob2xkZXIpIHtcbiAgICB0Tm9kZS50eXBlID0gdHlwZTtcbiAgICB0Tm9kZS52YWx1ZSA9IG5hbWU7XG4gICAgdE5vZGUuYXR0cnMgPSBhdHRycztcbiAgICBjb25zdCBwYXJlbnQgPSBnZXRDdXJyZW50UGFyZW50VE5vZGUoKTtcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gcGFyZW50ID09PSBudWxsID8gLTEgOiBwYXJlbnQuaW5qZWN0b3JJbmRleDtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JUVmlldyh0Tm9kZSwgdFZpZXcpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChpbmRleCwgdE5vZGUuaW5kZXgsICdFeHBlY3Rpbmcgc2FtZSBpbmRleCcpO1xuICB9XG4gIHNldEN1cnJlbnRUTm9kZSh0Tm9kZSwgdHJ1ZSk7XG4gIHJldHVybiB0Tm9kZSBhcyBURWxlbWVudE5vZGUgJiBUQ29udGFpbmVyTm9kZSAmIFRFbGVtZW50Q29udGFpbmVyTm9kZSAmIFRQcm9qZWN0aW9uTm9kZSAmXG4gICAgICBUSWN1Q29udGFpbmVyTm9kZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlQXRJbmRleChcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUTm9kZSA9IGdldEN1cnJlbnRUTm9kZVBsYWNlaG9sZGVyT2soKTtcbiAgY29uc3QgaXNQYXJlbnQgPSBpc0N1cnJlbnRUTm9kZVBhcmVudCgpO1xuICBjb25zdCBwYXJlbnQgPSBpc1BhcmVudCA/IGN1cnJlbnRUTm9kZSA6IGN1cnJlbnRUTm9kZSAmJiBjdXJyZW50VE5vZGUucGFyZW50O1xuICAvLyBQYXJlbnRzIGNhbm5vdCBjcm9zcyBjb21wb25lbnQgYm91bmRhcmllcyBiZWNhdXNlIGNvbXBvbmVudHMgd2lsbCBiZSB1c2VkIGluIG11bHRpcGxlIHBsYWNlcy5cbiAgY29uc3QgdE5vZGUgPSB0Vmlldy5kYXRhW2luZGV4XSA9XG4gICAgICBjcmVhdGVUTm9kZSh0VmlldywgcGFyZW50IGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlLCB0eXBlLCBpbmRleCwgbmFtZSwgYXR0cnMpO1xuICAvLyBBc3NpZ24gYSBwb2ludGVyIHRvIHRoZSBmaXJzdCBjaGlsZCBub2RlIG9mIGEgZ2l2ZW4gdmlldy4gVGhlIGZpcnN0IG5vZGUgaXMgbm90IGFsd2F5cyB0aGUgb25lXG4gIC8vIGF0IGluZGV4IDAsIGluIGNhc2Ugb2YgaTE4biwgaW5kZXggMCBjYW4gYmUgdGhlIGluc3RydWN0aW9uIGBpMThuU3RhcnRgIGFuZCB0aGUgZmlyc3Qgbm9kZSBoYXNcbiAgLy8gdGhlIGluZGV4IDEgb3IgbW9yZSwgc28gd2UgY2FuJ3QganVzdCBjaGVjayBub2RlIGluZGV4LlxuICBpZiAodFZpZXcuZmlyc3RDaGlsZCA9PT0gbnVsbCkge1xuICAgIHRWaWV3LmZpcnN0Q2hpbGQgPSB0Tm9kZTtcbiAgfVxuICBpZiAoY3VycmVudFROb2RlICE9PSBudWxsKSB7XG4gICAgaWYgKGlzUGFyZW50KSB7XG4gICAgICAvLyBGSVhNRShtaXNrbyk6IFRoaXMgbG9naWMgbG9va3MgdW5uZWNlc3NhcmlseSBjb21wbGljYXRlZC4gQ291bGQgd2Ugc2ltcGxpZnk/XG4gICAgICBpZiAoY3VycmVudFROb2RlLmNoaWxkID09IG51bGwgJiYgdE5vZGUucGFyZW50ICE9PSBudWxsKSB7XG4gICAgICAgIC8vIFdlIGFyZSBpbiB0aGUgc2FtZSB2aWV3LCB3aGljaCBtZWFucyB3ZSBhcmUgYWRkaW5nIGNvbnRlbnQgbm9kZSB0byB0aGUgcGFyZW50IHZpZXcuXG4gICAgICAgIGN1cnJlbnRUTm9kZS5jaGlsZCA9IHROb2RlO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoY3VycmVudFROb2RlLm5leHQgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gdGhlIGNhc2Ugb2YgaTE4biB0aGUgYGN1cnJlbnRUTm9kZWAgbWF5IGFscmVhZHkgYmUgbGlua2VkLCBpbiB3aGljaCBjYXNlIHdlIGRvbid0IHdhbnRcbiAgICAgICAgLy8gdG8gYnJlYWsgdGhlIGxpbmtzIHdoaWNoIGkxOG4gY3JlYXRlZC5cbiAgICAgICAgY3VycmVudFROb2RlLm5leHQgPSB0Tm9kZTtcbiAgICAgICAgdE5vZGUucHJldiA9IGN1cnJlbnRUTm9kZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHROb2RlO1xufVxuXG4vKipcbiAqIFdoZW4gZWxlbWVudHMgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgYWZ0ZXIgYSB2aWV3IGJsdWVwcmludCBpcyBjcmVhdGVkIChlLmcuIHRocm91Z2hcbiAqIGkxOG5BcHBseSgpKSwgd2UgbmVlZCB0byBhZGp1c3QgdGhlIGJsdWVwcmludCBmb3IgZnV0dXJlXG4gKiB0ZW1wbGF0ZSBwYXNzZXMuXG4gKlxuICogQHBhcmFtIHRWaWV3IGBUVmlld2AgYXNzb2NpYXRlZCB3aXRoIGBMVmlld2BcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCBjb250YWluaW5nIHRoZSBibHVlcHJpbnQgdG8gYWRqdXN0XG4gKiBAcGFyYW0gbnVtU2xvdHNUb0FsbG9jIFRoZSBudW1iZXIgb2Ygc2xvdHMgdG8gYWxsb2MgaW4gdGhlIExWaWV3LCBzaG91bGQgYmUgPjBcbiAqIEBwYXJhbSBpbml0aWFsVmFsdWUgSW5pdGlhbCB2YWx1ZSB0byBzdG9yZSBpbiBibHVlcHJpbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFsbG9jRXhwYW5kbyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgbnVtU2xvdHNUb0FsbG9jOiBudW1iZXIsIGluaXRpYWxWYWx1ZTogYW55KTogbnVtYmVyIHtcbiAgaWYgKG51bVNsb3RzVG9BbGxvYyA9PT0gMCkgcmV0dXJuIC0xO1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgICBhc3NlcnRTYW1lKHRWaWV3LCBsVmlld1tUVklFV10sICdgTFZpZXdgIG11c3QgYmUgYXNzb2NpYXRlZCB3aXRoIGBUVmlld2AhJyk7XG4gICAgYXNzZXJ0RXF1YWwodFZpZXcuZGF0YS5sZW5ndGgsIGxWaWV3Lmxlbmd0aCwgJ0V4cGVjdGluZyBMVmlldyB0byBiZSBzYW1lIHNpemUgYXMgVFZpZXcnKTtcbiAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgdFZpZXcuZGF0YS5sZW5ndGgsIHRWaWV3LmJsdWVwcmludC5sZW5ndGgsICdFeHBlY3RpbmcgQmx1ZXByaW50IHRvIGJlIHNhbWUgc2l6ZSBhcyBUVmlldycpO1xuICAgIGFzc2VydEZpcnN0VXBkYXRlUGFzcyh0Vmlldyk7XG4gIH1cbiAgY29uc3QgYWxsb2NJZHggPSBsVmlldy5sZW5ndGg7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtU2xvdHNUb0FsbG9jOyBpKyspIHtcbiAgICBsVmlldy5wdXNoKGluaXRpYWxWYWx1ZSk7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goaW5pdGlhbFZhbHVlKTtcbiAgICB0Vmlldy5kYXRhLnB1c2gobnVsbCk7XG4gIH1cbiAgcmV0dXJuIGFsbG9jSWR4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVRlbXBsYXRlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3PFQ+LCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcmY6IFJlbmRlckZsYWdzLCBjb250ZXh0OiBUKSB7XG4gIGNvbnN0IGNvbnN1bWVyID0gZ2V0UmVhY3RpdmVMVmlld0NvbnN1bWVyKGxWaWV3LCBSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUik7XG4gIGNvbnN0IHByZXZTZWxlY3RlZEluZGV4ID0gZ2V0U2VsZWN0ZWRJbmRleCgpO1xuICBjb25zdCBpc1VwZGF0ZVBoYXNlID0gcmYgJiBSZW5kZXJGbGFncy5VcGRhdGU7XG4gIHRyeSB7XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gICAgaWYgKGlzVXBkYXRlUGhhc2UgJiYgbFZpZXcubGVuZ3RoID4gSEVBREVSX09GRlNFVCkge1xuICAgICAgLy8gV2hlbiB3ZSdyZSB1cGRhdGluZywgaW5oZXJlbnRseSBzZWxlY3QgMCBzbyB3ZSBkb24ndFxuICAgICAgLy8gaGF2ZSB0byBnZW5lcmF0ZSB0aGF0IGluc3RydWN0aW9uIGZvciBtb3N0IHVwZGF0ZSBibG9ja3MuXG4gICAgICBzZWxlY3RJbmRleEludGVybmFsKHRWaWV3LCBsVmlldywgSEVBREVSX09GRlNFVCwgISFuZ0Rldk1vZGUgJiYgaXNJbkNoZWNrTm9DaGFuZ2VzTW9kZSgpKTtcbiAgICB9XG5cbiAgICBjb25zdCBwcmVIb29rVHlwZSA9XG4gICAgICAgIGlzVXBkYXRlUGhhc2UgPyBQcm9maWxlckV2ZW50LlRlbXBsYXRlVXBkYXRlU3RhcnQgOiBQcm9maWxlckV2ZW50LlRlbXBsYXRlQ3JlYXRlU3RhcnQ7XG4gICAgcHJvZmlsZXIocHJlSG9va1R5cGUsIGNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gICAgaWYgKGlzVXBkYXRlUGhhc2UpIHtcbiAgICAgIGNvbnN1bWVyLnJ1bkluQ29udGV4dCh0ZW1wbGF0ZUZuLCByZiwgY29udGV4dCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGVtcGxhdGVGbihyZiwgY29udGV4dCk7XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgICAgfVxuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBpZiAoaXNVcGRhdGVQaGFzZSAmJiBsVmlld1tSRUFDVElWRV9URU1QTEFURV9DT05TVU1FUl0gPT09IG51bGwpIHtcbiAgICAgIGNvbW1pdExWaWV3Q29uc3VtZXJJZkhhc1Byb2R1Y2VycyhsVmlldywgUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVIpO1xuICAgIH1cbiAgICBzZXRTZWxlY3RlZEluZGV4KHByZXZTZWxlY3RlZEluZGV4KTtcblxuICAgIGNvbnN0IHBvc3RIb29rVHlwZSA9XG4gICAgICAgIGlzVXBkYXRlUGhhc2UgPyBQcm9maWxlckV2ZW50LlRlbXBsYXRlVXBkYXRlRW5kIDogUHJvZmlsZXJFdmVudC5UZW1wbGF0ZUNyZWF0ZUVuZDtcbiAgICBwcm9maWxlcihwb3N0SG9va1R5cGUsIGNvbnRleHQgYXMgdW5rbm93biBhcyB7fSk7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gRWxlbWVudFxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuZXhwb3J0IGZ1bmN0aW9uIGV4ZWN1dGVDb250ZW50UXVlcmllcyh0VmlldzogVFZpZXcsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KSB7XG4gIGlmIChpc0NvbnRlbnRRdWVyeUhvc3QodE5vZGUpKSB7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHN0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gICAgICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gICAgICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgICAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgICAgaWYgKGRlZi5jb250ZW50UXVlcmllcykge1xuICAgICAgICAgIGRlZi5jb250ZW50UXVlcmllcyhSZW5kZXJGbGFncy5DcmVhdGUsIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSwgZGlyZWN0aXZlSW5kZXgpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGRpcmVjdGl2ZSBpbnN0YW5jZXMuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVzSW5zdGFuY2VzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKSB7XG4gIGlmICghZ2V0QmluZGluZ3NFbmFibGVkKCkpIHJldHVybjtcbiAgaW5zdGFudGlhdGVBbGxEaXJlY3RpdmVzKHRWaWV3LCBsVmlldywgdE5vZGUsIGdldE5hdGl2ZUJ5VE5vZGUodE5vZGUsIGxWaWV3KSk7XG4gIGlmICgodE5vZGUuZmxhZ3MgJiBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykgPT09IFROb2RlRmxhZ3MuaGFzSG9zdEJpbmRpbmdzKSB7XG4gICAgaW52b2tlRGlyZWN0aXZlc0hvc3RCaW5kaW5ncyh0VmlldywgbFZpZXcsIHROb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIFRha2VzIGEgbGlzdCBvZiBsb2NhbCBuYW1lcyBhbmQgaW5kaWNlcyBhbmQgcHVzaGVzIHRoZSByZXNvbHZlZCBsb2NhbCB2YXJpYWJsZSB2YWx1ZXNcbiAqIHRvIExWaWV3IGluIHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgYXJlIGxvYWRlZCBpbiB0aGUgdGVtcGxhdGUgd2l0aCBsb2FkKCkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzYXZlUmVzb2x2ZWRMb2NhbHNJbkRhdGEoXG4gICAgdmlld0RhdGE6IExWaWV3LCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLFxuICAgIGxvY2FsUmVmRXh0cmFjdG9yOiBMb2NhbFJlZkV4dHJhY3RvciA9IGdldE5hdGl2ZUJ5VE5vZGUpOiB2b2lkIHtcbiAgY29uc3QgbG9jYWxOYW1lcyA9IHROb2RlLmxvY2FsTmFtZXM7XG4gIGlmIChsb2NhbE5hbWVzICE9PSBudWxsKSB7XG4gICAgbGV0IGxvY2FsSW5kZXggPSB0Tm9kZS5pbmRleCArIDE7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbE5hbWVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGxvY2FsTmFtZXNbaSArIDFdIGFzIG51bWJlcjtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5kZXggPT09IC0xID9cbiAgICAgICAgICBsb2NhbFJlZkV4dHJhY3RvcihcbiAgICAgICAgICAgICAgdE5vZGUgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIHZpZXdEYXRhKSA6XG4gICAgICAgICAgdmlld0RhdGFbaW5kZXhdO1xuICAgICAgdmlld0RhdGFbbG9jYWxJbmRleCsrXSA9IHZhbHVlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEdldHMgVFZpZXcgZnJvbSBhIHRlbXBsYXRlIGZ1bmN0aW9uIG9yIGNyZWF0ZXMgYSBuZXcgVFZpZXdcbiAqIGlmIGl0IGRvZXNuJ3QgYWxyZWFkeSBleGlzdC5cbiAqXG4gKiBAcGFyYW0gZGVmIENvbXBvbmVudERlZlxuICogQHJldHVybnMgVFZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29tcG9uZW50VFZpZXcoZGVmOiBDb21wb25lbnREZWY8YW55Pik6IFRWaWV3IHtcbiAgY29uc3QgdFZpZXcgPSBkZWYudFZpZXc7XG5cbiAgLy8gQ3JlYXRlIGEgVFZpZXcgaWYgdGhlcmUgaXNuJ3Qgb25lLCBvciByZWNyZWF0ZSBpdCBpZiB0aGUgZmlyc3QgY3JlYXRlIHBhc3MgZGlkbid0XG4gIC8vIGNvbXBsZXRlIHN1Y2Nlc3NmdWxseSBzaW5jZSB3ZSBjYW4ndCBrbm93IGZvciBzdXJlIHdoZXRoZXIgaXQncyBpbiBhIHVzYWJsZSBzaGFwZS5cbiAgaWYgKHRWaWV3ID09PSBudWxsIHx8IHRWaWV3LmluY29tcGxldGVGaXJzdFBhc3MpIHtcbiAgICAvLyBEZWNsYXJhdGlvbiBub2RlIGhlcmUgaXMgbnVsbCBzaW5jZSB0aGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHdlIGR5bmFtaWNhbGx5IGNyZWF0ZSBhXG4gICAgLy8gY29tcG9uZW50IGFuZCBoZW5jZSB0aGVyZSBpcyBubyBkZWNsYXJhdGlvbi5cbiAgICBjb25zdCBkZWNsVE5vZGUgPSBudWxsO1xuICAgIHJldHVybiBkZWYudFZpZXcgPSBjcmVhdGVUVmlldyhcbiAgICAgICAgICAgICAgIFRWaWV3VHlwZS5Db21wb25lbnQsIGRlY2xUTm9kZSwgZGVmLnRlbXBsYXRlLCBkZWYuZGVjbHMsIGRlZi52YXJzLCBkZWYuZGlyZWN0aXZlRGVmcyxcbiAgICAgICAgICAgICAgIGRlZi5waXBlRGVmcywgZGVmLnZpZXdRdWVyeSwgZGVmLnNjaGVtYXMsIGRlZi5jb25zdHMsIGRlZi5pZCk7XG4gIH1cblxuICByZXR1cm4gdFZpZXc7XG59XG5cblxuLyoqXG4gKiBDcmVhdGVzIGEgVFZpZXcgaW5zdGFuY2VcbiAqXG4gKiBAcGFyYW0gdHlwZSBUeXBlIG9mIGBUVmlld2AuXG4gKiBAcGFyYW0gZGVjbFROb2RlIERlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoaXMgYFRWaWV3YC5cbiAqIEBwYXJhbSB0ZW1wbGF0ZUZuIFRlbXBsYXRlIGZ1bmN0aW9uXG4gKiBAcGFyYW0gZGVjbHMgVGhlIG51bWJlciBvZiBub2RlcywgbG9jYWwgcmVmcywgYW5kIHBpcGVzIGluIHRoaXMgdGVtcGxhdGVcbiAqIEBwYXJhbSBkaXJlY3RpdmVzIFJlZ2lzdHJ5IG9mIGRpcmVjdGl2ZXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIHBpcGVzIFJlZ2lzdHJ5IG9mIHBpcGVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSB2aWV3UXVlcnkgVmlldyBxdWVyaWVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBzY2hlbWFzIFNjaGVtYXMgZm9yIHRoaXMgdmlld1xuICogQHBhcmFtIGNvbnN0cyBDb25zdGFudHMgZm9yIHRoaXMgdmlld1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVFZpZXcoXG4gICAgdHlwZTogVFZpZXdUeXBlLCBkZWNsVE5vZGU6IFROb2RlfG51bGwsIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPGFueT58bnVsbCwgZGVjbHM6IG51bWJlcixcbiAgICB2YXJzOiBudW1iZXIsIGRpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3RPckZhY3Rvcnl8bnVsbCwgcGlwZXM6IFBpcGVEZWZMaXN0T3JGYWN0b3J5fG51bGwsXG4gICAgdmlld1F1ZXJ5OiBWaWV3UXVlcmllc0Z1bmN0aW9uPGFueT58bnVsbCwgc2NoZW1hczogU2NoZW1hTWV0YWRhdGFbXXxudWxsLFxuICAgIGNvbnN0c09yRmFjdG9yeTogVENvbnN0YW50c09yRmFjdG9yeXxudWxsLCBzc3JJZDogc3RyaW5nfG51bGwpOiBUVmlldyB7XG4gIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUudFZpZXcrKztcbiAgY29uc3QgYmluZGluZ1N0YXJ0SW5kZXggPSBIRUFERVJfT0ZGU0VUICsgZGVjbHM7XG4gIC8vIFRoaXMgbGVuZ3RoIGRvZXMgbm90IHlldCBjb250YWluIGhvc3QgYmluZGluZ3MgZnJvbSBjaGlsZCBkaXJlY3RpdmVzIGJlY2F1c2UgYXQgdGhpcyBwb2ludCxcbiAgLy8gd2UgZG9uJ3Qga25vdyB3aGljaCBkaXJlY3RpdmVzIGFyZSBhY3RpdmUgb24gdGhpcyB0ZW1wbGF0ZS4gQXMgc29vbiBhcyBhIGRpcmVjdGl2ZSBpcyBtYXRjaGVkXG4gIC8vIHRoYXQgaGFzIGEgaG9zdCBiaW5kaW5nLCB3ZSB3aWxsIHVwZGF0ZSB0aGUgYmx1ZXByaW50IHdpdGggdGhhdCBkZWYncyBob3N0VmFycyBjb3VudC5cbiAgY29uc3QgaW5pdGlhbFZpZXdMZW5ndGggPSBiaW5kaW5nU3RhcnRJbmRleCArIHZhcnM7XG4gIGNvbnN0IGJsdWVwcmludCA9IGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXgsIGluaXRpYWxWaWV3TGVuZ3RoKTtcbiAgY29uc3QgY29uc3RzID0gdHlwZW9mIGNvbnN0c09yRmFjdG9yeSA9PT0gJ2Z1bmN0aW9uJyA/IGNvbnN0c09yRmFjdG9yeSgpIDogY29uc3RzT3JGYWN0b3J5O1xuICBjb25zdCB0VmlldyA9IGJsdWVwcmludFtUVklFVyBhcyBhbnldID0ge1xuICAgIHR5cGU6IHR5cGUsXG4gICAgYmx1ZXByaW50OiBibHVlcHJpbnQsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlRm4sXG4gICAgcXVlcmllczogbnVsbCxcbiAgICB2aWV3UXVlcnk6IHZpZXdRdWVyeSxcbiAgICBkZWNsVE5vZGU6IGRlY2xUTm9kZSxcbiAgICBkYXRhOiBibHVlcHJpbnQuc2xpY2UoKS5maWxsKG51bGwsIGJpbmRpbmdTdGFydEluZGV4KSxcbiAgICBiaW5kaW5nU3RhcnRJbmRleDogYmluZGluZ1N0YXJ0SW5kZXgsXG4gICAgZXhwYW5kb1N0YXJ0SW5kZXg6IGluaXRpYWxWaWV3TGVuZ3RoLFxuICAgIGhvc3RCaW5kaW5nT3BDb2RlczogbnVsbCxcbiAgICBmaXJzdENyZWF0ZVBhc3M6IHRydWUsXG4gICAgZmlyc3RVcGRhdGVQYXNzOiB0cnVlLFxuICAgIHN0YXRpY1ZpZXdRdWVyaWVzOiBmYWxzZSxcbiAgICBzdGF0aWNDb250ZW50UXVlcmllczogZmFsc2UsXG4gICAgcHJlT3JkZXJIb29rczogbnVsbCxcbiAgICBwcmVPcmRlckNoZWNrSG9va3M6IG51bGwsXG4gICAgY29udGVudEhvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRDaGVja0hvb2tzOiBudWxsLFxuICAgIHZpZXdIb29rczogbnVsbCxcbiAgICB2aWV3Q2hlY2tIb29rczogbnVsbCxcbiAgICBkZXN0cm95SG9va3M6IG51bGwsXG4gICAgY2xlYW51cDogbnVsbCxcbiAgICBjb250ZW50UXVlcmllczogbnVsbCxcbiAgICBjb21wb25lbnRzOiBudWxsLFxuICAgIGRpcmVjdGl2ZVJlZ2lzdHJ5OiB0eXBlb2YgZGlyZWN0aXZlcyA9PT0gJ2Z1bmN0aW9uJyA/IGRpcmVjdGl2ZXMoKSA6IGRpcmVjdGl2ZXMsXG4gICAgcGlwZVJlZ2lzdHJ5OiB0eXBlb2YgcGlwZXMgPT09ICdmdW5jdGlvbicgPyBwaXBlcygpIDogcGlwZXMsXG4gICAgZmlyc3RDaGlsZDogbnVsbCxcbiAgICBzY2hlbWFzOiBzY2hlbWFzLFxuICAgIGNvbnN0czogY29uc3RzLFxuICAgIGluY29tcGxldGVGaXJzdFBhc3M6IGZhbHNlLFxuICAgIHNzcklkLFxuICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHRWaWV3IHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHRWaWV3KTtcbiAgfVxuICByZXR1cm4gdFZpZXc7XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVZpZXdCbHVlcHJpbnQoYmluZGluZ1N0YXJ0SW5kZXg6IG51bWJlciwgaW5pdGlhbFZpZXdMZW5ndGg6IG51bWJlcik6IExWaWV3IHtcbiAgY29uc3QgYmx1ZXByaW50ID0gW107XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsVmlld0xlbmd0aDsgaSsrKSB7XG4gICAgYmx1ZXByaW50LnB1c2goaSA8IGJpbmRpbmdTdGFydEluZGV4ID8gbnVsbCA6IE5PX0NIQU5HRSk7XG4gIH1cblxuICByZXR1cm4gYmx1ZXByaW50IGFzIExWaWV3O1xufVxuXG4vKipcbiAqIExvY2F0ZXMgdGhlIGhvc3QgbmF0aXZlIGVsZW1lbnQsIHVzZWQgZm9yIGJvb3RzdHJhcHBpbmcgZXhpc3Rpbmcgbm9kZXMgaW50byByZW5kZXJpbmcgcGlwZWxpbmUuXG4gKlxuICogQHBhcmFtIHJlbmRlcmVyIHRoZSByZW5kZXJlciB1c2VkIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbGVtZW50T3JTZWxlY3RvciBSZW5kZXIgZWxlbWVudCBvciBDU1Mgc2VsZWN0b3IgdG8gbG9jYXRlIHRoZSBlbGVtZW50LlxuICogQHBhcmFtIGVuY2Fwc3VsYXRpb24gVmlldyBFbmNhcHN1bGF0aW9uIGRlZmluZWQgZm9yIGNvbXBvbmVudCB0aGF0IHJlcXVlc3RzIGhvc3QgZWxlbWVudC5cbiAqIEBwYXJhbSBpbmplY3RvciBSb290IHZpZXcgaW5qZWN0b3IgaW5zdGFuY2UuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVIb3N0RWxlbWVudChcbiAgICByZW5kZXJlcjogUmVuZGVyZXIsIGVsZW1lbnRPclNlbGVjdG9yOiBSRWxlbWVudHxzdHJpbmcsIGVuY2Fwc3VsYXRpb246IFZpZXdFbmNhcHN1bGF0aW9uLFxuICAgIGluamVjdG9yOiBJbmplY3Rvcik6IFJFbGVtZW50IHtcbiAgLy8gTm90ZTogd2UgdXNlIGRlZmF1bHQgdmFsdWUgZm9yIHRoZSBgUFJFU0VSVkVfSE9TVF9DT05URU5UYCBoZXJlIGV2ZW4gdGhvdWdoIGl0J3MgYVxuICAvLyB0cmVlLXNoYWthYmxlIG9uZSAocHJvdmlkZWRJbjoncm9vdCcpLiBUaGlzIGNvZGUgcGF0aCBjYW4gYmUgdHJpZ2dlcmVkIGR1cmluZyBkeW5hbWljXG4gIC8vIGNvbXBvbmVudCBjcmVhdGlvbiAoYWZ0ZXIgY2FsbGluZyBWaWV3Q29udGFpbmVyUmVmLmNyZWF0ZUNvbXBvbmVudCkgd2hlbiBhbiBpbmplY3RvclxuICAvLyBpbnN0YW5jZSBjYW4gYmUgcHJvdmlkZWQuIFRoZSBpbmplY3RvciBpbnN0YW5jZSBtaWdodCBiZSBkaXNjb25uZWN0ZWQgZnJvbSB0aGUgbWFpbiBESVxuICAvLyB0cmVlLCB0aHVzIHRoZSBgUFJFU0VSVkVfSE9TVF9DT05URU5UYCB3b3VsZCBub3QgYmUgYWJsZSB0byBpbnN0YW50aWF0ZS4gSW4gdGhpcyBjYXNlLCB0aGVcbiAgLy8gZGVmYXVsdCB2YWx1ZSB3aWxsIGJlIHVzZWQuXG4gIGNvbnN0IHByZXNlcnZlSG9zdENvbnRlbnQgPSBpbmplY3Rvci5nZXQoUFJFU0VSVkVfSE9TVF9DT05URU5ULCBQUkVTRVJWRV9IT1NUX0NPTlRFTlRfREVGQVVMVCk7XG5cbiAgLy8gV2hlbiB1c2luZyBuYXRpdmUgU2hhZG93IERPTSwgZG8gbm90IGNsZWFyIGhvc3QgZWxlbWVudCB0byBhbGxvdyBuYXRpdmUgc2xvdFxuICAvLyBwcm9qZWN0aW9uLlxuICBjb25zdCBwcmVzZXJ2ZUNvbnRlbnQgPSBwcmVzZXJ2ZUhvc3RDb250ZW50IHx8IGVuY2Fwc3VsYXRpb24gPT09IFZpZXdFbmNhcHN1bGF0aW9uLlNoYWRvd0RvbTtcbiAgY29uc3Qgcm9vdEVsZW1lbnQgPSByZW5kZXJlci5zZWxlY3RSb290RWxlbWVudChlbGVtZW50T3JTZWxlY3RvciwgcHJlc2VydmVDb250ZW50KTtcbiAgYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShyb290RWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG4gIHJldHVybiByb290RWxlbWVudDtcbn1cblxuLyoqXG4gKiBBcHBsaWVzIGFueSByb290IGVsZW1lbnQgdHJhbnNmb3JtYXRpb25zIHRoYXQgYXJlIG5lZWRlZC4gSWYgaHlkcmF0aW9uIGlzIGVuYWJsZWQsXG4gKiB0aGlzIHdpbGwgcHJvY2VzcyBjb3JydXB0ZWQgdGV4dCBub2Rlcy5cbiAqXG4gKiBAcGFyYW0gcm9vdEVsZW1lbnQgdGhlIGFwcCByb290IEhUTUwgRWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybShyb290RWxlbWVudDogSFRNTEVsZW1lbnQpIHtcbiAgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKHJvb3RFbGVtZW50IGFzIEhUTUxFbGVtZW50KTtcbn1cblxuLyoqXG4gKiBSZWZlcmVuY2UgdG8gYSBmdW5jdGlvbiB0aGF0IGFwcGxpZXMgdHJhbnNmb3JtYXRpb25zIHRvIHRoZSByb290IEhUTUwgZWxlbWVudFxuICogb2YgYW4gYXBwLiBXaGVuIGh5ZHJhdGlvbiBpcyBlbmFibGVkLCB0aGlzIHByb2Nlc3NlcyBhbnkgY29ycnVwdCB0ZXh0IG5vZGVzXG4gKiBzbyB0aGV5IGFyZSBwcm9wZXJseSBoeWRyYXRhYmxlIG9uIHRoZSBjbGllbnQuXG4gKlxuICogQHBhcmFtIHJvb3RFbGVtZW50IHRoZSBhcHAgcm9vdCBIVE1MIEVsZW1lbnRcbiAqL1xubGV0IF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbDogdHlwZW9mIGFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsID1cbiAgICAocm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50KSA9PiBudWxsO1xuXG4vKipcbiAqIFByb2Nlc3NlcyB0ZXh0IG5vZGUgbWFya2VycyBiZWZvcmUgaHlkcmF0aW9uIGJlZ2lucy4gVGhpcyByZXBsYWNlcyBhbnkgc3BlY2lhbCBjb21tZW50XG4gKiBub2RlcyB0aGF0IHdlcmUgYWRkZWQgcHJpb3IgdG8gc2VyaWFsaXphdGlvbiBhcmUgc3dhcHBlZCBvdXQgdG8gcmVzdG9yZSBwcm9wZXIgdGV4dFxuICogbm9kZXMgYmVmb3JlIGh5ZHJhdGlvbi5cbiAqXG4gKiBAcGFyYW0gcm9vdEVsZW1lbnQgdGhlIGFwcCByb290IEhUTUwgRWxlbWVudFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGwocm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIGlmIChyb290RWxlbWVudC5oYXNBdHRyaWJ1dGUoU0tJUF9IWURSQVRJT05fQVRUUl9OQU1FKSkge1xuICAgIC8vIEhhbmRsZSBhIHNpdHVhdGlvbiB3aGVuIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgaXMgYXBwbGllZFxuICAgIC8vIHRvIHRoZSByb290IG5vZGUgb2YgYW4gYXBwbGljYXRpb24uIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNsZWFyXG4gICAgLy8gdGhlIGNvbnRlbnRzIGFuZCByZW5kZXIgZXZlcnl0aGluZyBmcm9tIHNjcmF0Y2guXG4gICAgY2xlYXJFbGVtZW50Q29udGVudHMocm9vdEVsZW1lbnQgYXMgUkVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHByb2Nlc3NUZXh0Tm9kZU1hcmtlcnNCZWZvcmVIeWRyYXRpb24ocm9vdEVsZW1lbnQpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBgYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybWAgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpIHtcbiAgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsID0gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGw7XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAobFZpZXcpO1xuXG4gIC8vIEhpc3RvcmljYWxseSB0aGUgYHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0YCB3YXMgdXNlZCB0byByZWdpc3RlciBib3RoIGZyYW1ld29yay1sZXZlbCBhbmRcbiAgLy8gdXNlci1kZWZpbmVkIGNsZWFudXAgY2FsbGJhY2tzLCBidXQgb3ZlciB0aW1lIHRob3NlIHR3byB0eXBlcyBvZiBjbGVhbnVwcyB3ZXJlIHNlcGFyYXRlZC5cbiAgLy8gVGhpcyBkZXYgbW9kZSBjaGVja3MgYXNzdXJlcyB0aGF0IHVzZXItbGV2ZWwgY2xlYW51cCBjYWxsYmFja3MgYXJlIF9ub3RfIHN0b3JlZCBpbiBkYXRhXG4gIC8vIHN0cnVjdHVyZXMgcmVzZXJ2ZWQgZm9yIGZyYW1ld29yay1zcGVjaWZpYyBob29rcy5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGNvbnRleHQsICdDbGVhbnVwIGNvbnRleHQgaXMgbWFuZGF0b3J5IHdoZW4gcmVnaXN0ZXJpbmcgZnJhbWV3b3JrLWxldmVsIGRlc3Ryb3kgaG9va3MnKTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBuZXcgZnJhbWV3b3JrLWxldmVsIGNsZWFudXAgZnVuY3Rpb25zIGFyZSByZWdpc3RlcmVkIGFmdGVyIHRoZSBmaXJzdFxuICAgIC8vIHRlbXBsYXRlIHBhc3MgaXMgZG9uZSAoYW5kIFRWaWV3IGRhdGEgc3RydWN0dXJlcyBhcmUgbWVhbnQgdG8gZnVsbHkgY29uc3RydWN0ZWQpLlxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIE9iamVjdC5mcmVlemUoZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGlzIGBUTm9kZWAgYmVsb25nc1xuICogQHBhcmFtIHRQYXJlbnQgUGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBpbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRJY3VDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKGF0dHJzLCB1bmRlZmluZWQsICdcXCd1bmRlZmluZWRcXCcgaXMgbm90IHZhbGlkIHZhbHVlIGZvciBcXCdhdHRyc1xcJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiB0UGFyZW50ICYmIGFzc2VydFROb2RlRm9yVFZpZXcodFBhcmVudCwgdFZpZXcpO1xuICBsZXQgaW5qZWN0b3JJbmRleCA9IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMTtcbiAgbGV0IGZsYWdzID0gMDtcbiAgaWYgKGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soKSkge1xuICAgIGZsYWdzIHw9IFROb2RlRmxhZ3MuaW5Ta2lwSHlkcmF0aW9uQmxvY2s7XG4gIH1cbiAgY29uc3QgdE5vZGUgPSB7XG4gICAgdHlwZSxcbiAgICBpbmRleCxcbiAgICBpbnNlcnRCZWZvcmVJbmRleDogbnVsbCxcbiAgICBpbmplY3RvckluZGV4LFxuICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiAtMSxcbiAgICBjb21wb25lbnRPZmZzZXQ6IC0xLFxuICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgZmxhZ3MsXG4gICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiBudWxsLFxuICAgIG91dHB1dHM6IG51bGwsXG4gICAgdFZpZXc6IG51bGwsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwcmV2OiBudWxsLFxuICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgIHN0eWxlczogbnVsbCxcbiAgICBzdHlsZXNXaXRob3V0SG9zdDogbnVsbCxcbiAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzZXM6IG51bGwsXG4gICAgY2xhc3Nlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzQmluZGluZ3M6IDAgYXMgYW55LFxuICAgIHN0eWxlQmluZGluZ3M6IDAgYXMgYW55LFxuICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHROb2RlIHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHROb2RlKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBgUHJvcGVydHlBbGlhc2VzYCBkYXRhIHN0cnVjdHVyZSBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dC9vdXRwdXQgbWFwcGluZy5cbiAqIEBwYXJhbSBhbGlhc01hcCBJbnB1dC9vdXRwdXQgbWFwcGluZyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlLlxuICogQHBhcmFtIHByb3BlcnR5QWxpYXNlcyBPYmplY3QgaW4gd2hpY2ggdG8gc3RvcmUgdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gaG9zdERpcmVjdGl2ZUFsaWFzTWFwIE9iamVjdCB1c2VkIHRvIGFsaWFzIG9yIGZpbHRlciBvdXQgcHJvcGVydGllcyBmb3IgaG9zdCBkaXJlY3RpdmVzLlxuICogSWYgdGhlIG1hcHBpbmcgaXMgcHJvdmlkZWQsIGl0J2xsIGFjdCBhcyBhbiBhbGxvd2xpc3QsIGFzIHdlbGwgYXMgYSBtYXBwaW5nIG9mIHdoYXQgcHVibGljXG4gKiBuYW1lIGlucHV0cy9vdXRwdXRzIHNob3VsZCBiZSBleHBvc2VkIHVuZGVyLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBhbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3BlcnR5QWxpYXNlczogUHJvcGVydHlBbGlhc2VzfG51bGwsXG4gICAgaG9zdERpcmVjdGl2ZUFsaWFzTWFwOiBIb3N0RGlyZWN0aXZlQmluZGluZ01hcHxudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIGFsaWFzTWFwKSB7XG4gICAgaWYgKGFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wZXJ0eUFsaWFzZXMgPSBwcm9wZXJ0eUFsaWFzZXMgPT09IG51bGwgPyB7fSA6IHByb3BlcnR5QWxpYXNlcztcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGFsaWFzTWFwW3B1YmxpY05hbWVdO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gaG9zdCBkaXJlY3RpdmUgbWFwcGluZ3MsIHdlIHdhbnQgdG8gcmVtYXAgdXNpbmcgdGhlIGFsaWFzIG1hcCBmcm9tIHRoZVxuICAgICAgLy8gZGVmaW5pdGlvbiBpdHNlbGYuIElmIHRoZXJlIGlzIGFuIGFsaWFzIG1hcCwgaXQgaGFzIHR3byBmdW5jdGlvbnM6XG4gICAgICAvLyAxLiBJdCBzZXJ2ZXMgYXMgYW4gYWxsb3dsaXN0IG9mIGJpbmRpbmdzIHRoYXQgYXJlIGV4cG9zZWQgYnkgdGhlIGhvc3QgZGlyZWN0aXZlcy4gT25seSB0aGVcbiAgICAgIC8vIG9uZXMgaW5zaWRlIHRoZSBob3N0IGRpcmVjdGl2ZSBtYXAgd2lsbCBiZSBleHBvc2VkIG9uIHRoZSBob3N0LlxuICAgICAgLy8gMi4gVGhlIHB1YmxpYyBuYW1lIG9mIHRoZSBwcm9wZXJ0eSBpcyBhbGlhc2VkIHVzaW5nIHRoZSBob3N0IGRpcmVjdGl2ZSBhbGlhcyBtYXAsIHJhdGhlclxuICAgICAgLy8gdGhhbiB0aGUgYWxpYXMgbWFwIGZyb20gdGhlIGRlZmluaXRpb24uXG4gICAgICBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwID09PSBudWxsKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMocHJvcGVydHlBbGlhc2VzLCBkaXJlY3RpdmVJbmRleCwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgICAgICAgICBwcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4LCBob3N0RGlyZWN0aXZlQWxpYXNNYXBbcHVibGljTmFtZV0sIGludGVybmFsTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0eUFsaWFzZXM7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgcHJvcGVydHlBbGlhc2VzOiBQcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHB1YmxpY05hbWU6IHN0cmluZyxcbiAgICBpbnRlcm5hbE5hbWU6IHN0cmluZykge1xuICBpZiAocHJvcGVydHlBbGlhc2VzLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlSW5kZXgsIGludGVybmFsTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZUluZGV4LCBpbnRlcm5hbE5hbWVdO1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5mdW5jdGlvbiBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcDogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IHRWaWV3RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3RGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgYWxpYXNEYXRhID1cbiAgICAgICAgaG9zdERpcmVjdGl2ZURlZmluaXRpb25NYXAgPyBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcC5nZXQoZGlyZWN0aXZlRGVmKSA6IG51bGw7XG4gICAgY29uc3QgYWxpYXNlZElucHV0cyA9IGFsaWFzRGF0YSA/IGFsaWFzRGF0YS5pbnB1dHMgOiBudWxsO1xuICAgIGNvbnN0IGFsaWFzZWRPdXRwdXRzID0gYWxpYXNEYXRhID8gYWxpYXNEYXRhLm91dHB1dHMgOiBudWxsO1xuXG4gICAgaW5wdXRzU3RvcmUgPVxuICAgICAgICBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYuaW5wdXRzLCBkaXJlY3RpdmVJbmRleCwgaW5wdXRzU3RvcmUsIGFsaWFzZWRJbnB1dHMpO1xuICAgIG91dHB1dHNTdG9yZSA9XG4gICAgICAgIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKGRpcmVjdGl2ZURlZi5vdXRwdXRzLCBkaXJlY3RpdmVJbmRleCwgb3V0cHV0c1N0b3JlLCBhbGlhc2VkT3V0cHV0cyk7XG4gICAgLy8gRG8gbm90IHVzZSB1bmJvdW5kIGF0dHJpYnV0ZXMgYXMgaW5wdXRzIHRvIHN0cnVjdHVyYWwgZGlyZWN0aXZlcywgc2luY2Ugc3RydWN0dXJhbFxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dHMgY2FuIG9ubHkgYmUgc2V0IHVzaW5nIG1pY3Jvc3ludGF4IChlLmcuIGA8ZGl2ICpkaXI9XCJleHBcIj5gKS5cbiAgICAvLyBUT0RPKEZXLTE5MzApOiBtaWNyb3N5bnRheCBleHByZXNzaW9ucyBtYXkgYWxzbyBjb250YWluIHVuYm91bmQvc3RhdGljIGF0dHJpYnV0ZXMsIHdoaWNoXG4gICAgLy8gc2hvdWxkIGJlIHNldCBmb3IgaW5saW5lIHRlbXBsYXRlcy5cbiAgICBjb25zdCBpbml0aWFsSW5wdXRzID1cbiAgICAgICAgKGlucHV0c1N0b3JlICE9PSBudWxsICYmIHROb2RlQXR0cnMgIT09IG51bGwgJiYgIWlzSW5saW5lVGVtcGxhdGUodE5vZGUpKSA/XG4gICAgICAgIGdlbmVyYXRlSW5pdGlhbElucHV0cyhpbnB1dHNTdG9yZSwgZGlyZWN0aXZlSW5kZXgsIHROb2RlQXR0cnMpIDpcbiAgICAgICAgbnVsbDtcbiAgICBpbnB1dHNGcm9tQXR0cnMucHVzaChpbml0aWFsSW5wdXRzKTtcbiAgfVxuXG4gIGlmIChpbnB1dHNTdG9yZSAhPT0gbnVsbCkge1xuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ3N0eWxlJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dDtcbiAgICB9XG4gIH1cblxuICB0Tm9kZS5pbml0aWFsSW5wdXRzID0gaW5wdXRzRnJvbUF0dHJzO1xuICB0Tm9kZS5pbnB1dHMgPSBpbnB1dHNTdG9yZTtcbiAgdE5vZGUub3V0cHV0cyA9IG91dHB1dHNTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBQZXJmb3JtYW5jZSBub3RlOiB0aGlzIGZ1bmN0aW9uIGlzIHdyaXR0ZW4gYXMgYSBzZXJpZXMgb2YgaWYgY2hlY2tzIChpbnN0ZWFkIG9mLCBzYXksIGEgcHJvcGVydHlcbiAqIG9iamVjdCBsb29rdXApIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIC0gdGhlIHNlcmllcyBvZiBgaWZgIGNoZWNrcyBzZWVtcyB0byBiZSB0aGUgZmFzdGVzdCB3YXkgb2ZcbiAqIG1hcHBpbmcgcHJvcGVydHkgbmFtZXMuIERvIE5PVCBjaGFuZ2Ugd2l0aG91dCBiZW5jaG1hcmtpbmcuXG4gKlxuICogTm90ZTogdGhpcyBtYXBwaW5nIGhhcyB0byBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgZXF1YWxseSBuYW1lZCBtYXBwaW5nIGluIHRoZSB0ZW1wbGF0ZVxuICogdHlwZS1jaGVja2luZyBtYWNoaW5lcnkgb2Ygbmd0c2MuXG4gKi9cbmZ1bmN0aW9uIG1hcFByb3BOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChuYW1lID09PSAnY2xhc3MnKSByZXR1cm4gJ2NsYXNzTmFtZSc7XG4gIGlmIChuYW1lID09PSAnZm9yJykgcmV0dXJuICdodG1sRm9yJztcbiAgaWYgKG5hbWUgPT09ICdmb3JtYWN0aW9uJykgcmV0dXJuICdmb3JtQWN0aW9uJztcbiAgaWYgKG5hbWUgPT09ICdpbm5lckh0bWwnKSByZXR1cm4gJ2lubmVySFRNTCc7XG4gIGlmIChuYW1lID09PSAncmVhZG9ubHknKSByZXR1cm4gJ3JlYWRPbmx5JztcbiAgaWYgKG5hbWUgPT09ICd0YWJpbmRleCcpIHJldHVybiAndGFiSW5kZXgnO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCByZW5kZXJlcjogUmVuZGVyZXIsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCwgbmF0aXZlT25seTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgbGV0IGlucHV0RGF0YSA9IHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIGlucHV0RGF0YSAhPSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KHRWaWV3LCBsVmlldywgZGF0YVZhbHVlLCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgdE5vZGUuaW5kZXgpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCFpc1Byb3BlcnR5VmFsaWQoZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Vmlldy5zY2hlbWFzKSkge1xuICAgICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlXG4gICAgLy8gcHJvcGVydHkgaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS52YWx1ZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXModFZpZXcuc2NoZW1hcywgdE5vZGUudmFsdWUpKSB7XG4gICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydHkoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPVxuICAgICAgICBlc2NhcGVDb21tZW50VGV4dChgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWApO1xuICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBpZiAodHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKSkge1xuICAgIC8qKlxuICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICAgICAqIGkrMTogcHJpdmF0ZU5hbWVcbiAgICAgKlxuICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsxXVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdHlwZSwgZGF0YVZhbHVlW2kgKyAxXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBpZiAoZ2V0QmluZGluZ3NFbmFibGVkKCkpIHtcbiAgICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyh0VmlldywgdE5vZGUpO1xuICAgIGxldCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXXxudWxsO1xuICAgIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbDtcblxuICAgIGlmIChtYXRjaFJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgZGlyZWN0aXZlRGVmcyA9IGhvc3REaXJlY3RpdmVEZWZzID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgW2RpcmVjdGl2ZURlZnMsIGhvc3REaXJlY3RpdmVEZWZzXSA9IG1hdGNoUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICBpbml0aWFsaXplRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBkaXJlY3RpdmVEZWZzLCBleHBvcnRzTWFwLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgfVxuICAgIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbiAgfVxuICAvLyBNZXJnZSB0aGUgdGVtcGxhdGUgYXR0cnMgbGFzdCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgaGlnaGVzdCBwcmlvcml0eS5cbiAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgdE5vZGUuYXR0cnMpO1xufVxuXG4vKiogSW5pdGlhbGl6ZXMgdGhlIGRhdGEgc3RydWN0dXJlcyBuZWNlc3NhcnkgZm9yIGEgbGlzdCBvZiBkaXJlY3RpdmVzIHRvIGJlIGluc3RhbnRpYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx1bmtub3duPiwgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXI7fXxudWxsLFxuICAgIGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIC8vIFB1Ymxpc2hlcyB0aGUgZGlyZWN0aXZlIHR5cGVzIHRvIERJIHNvIHRoZXkgY2FuIGJlIGluamVjdGVkLiBOZWVkcyB0b1xuICAvLyBoYXBwZW4gaW4gYSBzZXBhcmF0ZSBwYXNzIGJlZm9yZSB0aGUgVE5vZGUgZmxhZ3MgaGF2ZSBiZWVuIGluaXRpYWxpemVkLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCBsVmlldyksIHRWaWV3LCBkaXJlY3RpdmVzW2ldLnR5cGUpO1xuICB9XG5cbiAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG5cbiAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAvLyBpbXBvcnRhbnQuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gIH1cbiAgbGV0IHByZU9yZGVySG9va3NGb3VuZCA9IGZhbHNlO1xuICBsZXQgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSBmYWxzZTtcbiAgbGV0IGRpcmVjdGl2ZUlkeCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIGRpcmVjdGl2ZXMubGVuZ3RoLCBudWxsKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRTYW1lKFxuICAgICAgICAgIGRpcmVjdGl2ZUlkeCwgdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1ROb2RlLmRpcmVjdGl2ZVN0YXJ0IHNob3VsZCBwb2ludCB0byBqdXN0IGFsbG9jYXRlZCBzcGFjZScpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgLy8gTWVyZ2UgdGhlIGF0dHJzIGluIHRoZSBvcmRlciBvZiBtYXRjaGVzLiBUaGlzIGFzc3VtZXMgdGhhdCB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIHRoZVxuICAgIC8vIGNvbXBvbmVudCBpdHNlbGYsIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgdGhlIGxlYXN0IHByaW9yaXR5LlxuICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuXG4gICAgY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmUodFZpZXcsIHROb2RlLCBsVmlldywgZGlyZWN0aXZlSWR4LCBkZWYpO1xuICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAoZGlyZWN0aXZlSWR4LCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgaWYgKGRlZi5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDApXG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgIGNvbnN0IGxpZmVDeWNsZUhvb2tzOiBQYXJ0aWFsPE9uQ2hhbmdlcyZPbkluaXQmRG9DaGVjaz4gPSBkZWYudHlwZS5wcm90b3R5cGU7XG4gICAgLy8gT25seSBwdXNoIGEgbm9kZSBpbmRleCBpbnRvIHRoZSBwcmVPcmRlckhvb2tzIGFycmF5IGlmIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgIGlmICghcHJlT3JkZXJIb29rc0ZvdW5kICYmXG4gICAgICAgIChsaWZlQ3ljbGVIb29rcy5uZ09uQ2hhbmdlcyB8fCBsaWZlQ3ljbGVIb29rcy5uZ09uSW5pdCB8fCBsaWZlQ3ljbGVIb29rcy5uZ0RvQ2hlY2spKSB7XG4gICAgICAvLyBXZSB3aWxsIHB1c2ggdGhlIGFjdHVhbCBob29rIGZ1bmN0aW9uIGludG8gdGhpcyBhcnJheSBsYXRlciBkdXJpbmcgZGlyIGluc3RhbnRpYXRpb24uXG4gICAgICAvLyBXZSBjYW5ub3QgZG8gaXQgbm93IGJlY2F1c2Ugd2UgbXVzdCBlbnN1cmUgaG9va3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIHNhbWVcbiAgICAgIC8vIG9yZGVyIHRoYXQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCAoaS5lLiBpbmplY3Rpb24gb3JkZXIpLlxuICAgICAgKHRWaWV3LnByZU9yZGVySG9va3MgPz89IFtdKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA/Pz0gW10pLnB1c2godE5vZGUuaW5kZXgpO1xuICAgICAgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSB0cnVlO1xuICAgIH1cblxuICAgIGRpcmVjdGl2ZUlkeCsrO1xuICB9XG5cbiAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldywgdE5vZGUsIGhvc3REaXJlY3RpdmVEZWZzKTtcbn1cblxuLyoqXG4gKiBBZGQgYGhvc3RCaW5kaW5nc2AgdG8gdGhlIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoZSBgaG9zdEJpbmRpbmdzYCBzaG91bGQgYmUgYWRkZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0aGUgZWxlbWVudCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlXG4gKiBAcGFyYW0gZGlyZWN0aXZlSWR4IERpcmVjdGl2ZSBpbmRleCBpbiB2aWV3LlxuICogQHBhcmFtIGRpcmVjdGl2ZVZhcnNJZHggV2hlcmUgd2lsbCB0aGUgZGlyZWN0aXZlJ3MgdmFycyBiZSBzdG9yZWRcbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGlyZWN0aXZlVmFyc0lkeDogbnVtYmVyLFxuICAgIGRlZjogQ29tcG9uZW50RGVmPGFueT58RGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzID0gZGVmLmhvc3RCaW5kaW5ncztcbiAgaWYgKGhvc3RCaW5kaW5ncykge1xuICAgIGxldCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gICAgaWYgKGhvc3RCaW5kaW5nT3BDb2RlcyA9PT0gbnVsbCkge1xuICAgICAgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzID0gW10gYXMgYW55IGFzIEhvc3RCaW5kaW5nT3BDb2RlcztcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudEluZHggPSB+dE5vZGUuaW5kZXg7XG4gICAgaWYgKGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzKSAhPSBlbGVtZW50SW5keCkge1xuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgc2VsZWN0IGVsZW1lbnQgc28gdGhhdCB3ZSBhcmUgbW9yZSBlZmZpY2llbnQgaW4gZXhlY3V0aW9uLlxuICAgICAgLy8gTk9URTogdGhpcyBpcyBzdHJpY3RseSBub3QgbmVjZXNzYXJ5IGFuZCBpdCB0cmFkZXMgY29kZSBzaXplIGZvciBydW50aW1lIHBlcmYuXG4gICAgICAvLyAoV2UgY291bGQganVzdCBhbHdheXMgYWRkIGl0LilcbiAgICAgIGhvc3RCaW5kaW5nT3BDb2Rlcy5wdXNoKGVsZW1lbnRJbmR4KTtcbiAgICB9XG4gICAgaG9zdEJpbmRpbmdPcENvZGVzLnB1c2goZGlyZWN0aXZlSWR4LCBkaXJlY3RpdmVWYXJzSWR4LCBob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbGFzdCBzZWxlY3RlZCBlbGVtZW50IGluZGV4IGluIHRoZSBgSG9zdEJpbmRpbmdPcENvZGVzYFxuICpcbiAqIEZvciBwZXJmIHJlYXNvbnMgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaW5kZXggaW4gYEhvc3RCaW5kaW5nT3BDb2Rlc2Agb25seVxuICogaWYgaXQgY2hhbmdlcy4gVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgbGFzdCBpbmRleCAob3IgJzAnIGlmIG5vdCBmb3VuZC4pXG4gKlxuICogU2VsZWN0ZWQgZWxlbWVudCBpbmRleCBhcmUgb25seSB0aGUgb25lcyB3aGljaCBhcmUgbmVnYXRpdmUuXG4gKi9cbmZ1bmN0aW9uIGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXMpOiBudW1iZXIge1xuICBsZXQgaSA9IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7XG4gIHdoaWxlIChpID4gMCkge1xuICAgIGNvbnN0IHZhbHVlID0gaG9zdEJpbmRpbmdPcENvZGVzWy0taV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPCAwKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSwgbmF0aXZlOiBSTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgLy8gVGhlIGNvbXBvbmVudCB2aWV3IG5lZWRzIHRvIGJlIGNyZWF0ZWQgYmVmb3JlIGNyZWF0aW5nIHRoZSBub2RlIGluamVjdG9yXG4gIC8vIHNpbmNlIGl0IGlzIHVzZWQgdG8gaW5qZWN0IHNvbWUgc3BlY2lhbCBzeW1ib2xzIGxpa2UgYENoYW5nZURldGVjdG9yUmVmYC5cbiAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuICAgIGFkZENvbXBvbmVudExvZ2ljKFxuICAgICAgICBsVmlldywgdE5vZGUgYXMgVEVsZW1lbnROb2RlLFxuICAgICAgICB0Vmlldy5kYXRhW3N0YXJ0ICsgdE5vZGUuY29tcG9uZW50T2Zmc2V0XSBhcyBDb21wb25lbnREZWY8dW5rbm93bj4pO1xuICB9XG5cbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGksIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6XG4gICAgW21hdGNoZXM6IERpcmVjdGl2ZURlZjx1bmtub3duPltdLCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbF18bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcblxuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W118bnVsbCA9IG51bGw7XG4gIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICAgICAgICAgIGBcIiR7dE5vZGUudmFsdWV9XCIgdGFncyBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgaG9zdHMuIGAgK1xuICAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHVzZSBhIGRpZmZlcmVudCB0YWcgdG8gYWN0aXZhdGUgdGhlICR7c3RyaW5naWZ5KGRlZi50eXBlKX0gY29tcG9uZW50LmApO1xuXG4gICAgICAgICAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkge1xuICAgICAgICAgICAgICB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUsIG1hdGNoZXMuZmluZChpc0NvbXBvbmVudERlZikhLnR5cGUsIGRlZi50eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgZnJvbnQgb2YgdGhlIG1hdGNoZXMgYXJyYXkgc28gdGhhdCB0aGVpciBsaWZlY3ljbGVcbiAgICAgICAgICAvLyBob29rcyBydW4gYmVmb3JlIGFueSBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzLiBUaGlzIGFwcGVhcnMgdG8gYmUgZm9yIFZpZXdFbmdpbmVcbiAgICAgICAgICAvLyBjb21wYXRpYmlsaXR5LiBUaGlzIGxvZ2ljIGRvZXNuJ3QgbWFrZSBzZW5zZSB3aXRoIGhvc3QgZGlyZWN0aXZlcywgYmVjYXVzZSBpdFxuICAgICAgICAgIC8vIHdvdWxkIGFsbG93IHRoZSBob3N0IGRpcmVjdGl2ZXMgdG8gdW5kbyBhbnkgb3ZlcnJpZGVzIHRoZSBob3N0IG1heSBoYXZlIG1hZGUuXG4gICAgICAgICAgLy8gVG8gaGFuZGxlIHRoaXMgY2FzZSwgdGhlIGhvc3QgZGlyZWN0aXZlcyBvZiBjb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAgLy8gb2YgdGhlIGFycmF5LCBmb2xsb3dlZCBieSB0aGUgY29tcG9uZW50LiBBcyBzdWNoLCB0aGUgaW5zZXJ0aW9uIG9yZGVyIGlzIGFzIGZvbGxvd3M6XG4gICAgICAgICAgLy8gMS4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byB0aGUgc2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMi4gU2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMy4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byBzZWxlY3Rvci1tYXRjaGVkIGRpcmVjdGl2ZXMuXG4gICAgICAgICAgLy8gNC4gU2VsZWN0b3ItbWF0Y2hlZCBkaXJlY3RpdmVzLlxuICAgICAgICAgIGlmIChkZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBob3N0RGlyZWN0aXZlTWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10gPSBbXTtcbiAgICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgICAgZGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcyhkZWYsIGhvc3REaXJlY3RpdmVNYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgICAgICAgICAvLyBBZGQgYWxsIGhvc3QgZGlyZWN0aXZlcyBkZWNsYXJlZCBvbiB0aGlzIGNvbXBvbmVudCwgZm9sbG93ZWQgYnkgdGhlIGNvbXBvbmVudCBpdHNlbGYuXG4gICAgICAgICAgICAvLyBIb3N0IGRpcmVjdGl2ZXMgc2hvdWxkIGV4ZWN1dGUgZmlyc3Qgc28gdGhlIGhvc3QgaGFzIGEgY2hhbmNlIHRvIG92ZXJyaWRlIGNoYW5nZXNcbiAgICAgICAgICAgIC8vIHRvIHRoZSBET00gbWFkZSBieSB0aGVtLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KC4uLmhvc3REaXJlY3RpdmVNYXRjaGVzLCBkZWYpO1xuICAgICAgICAgICAgLy8gQ29tcG9uZW50IGlzIG9mZnNldCBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGhvc3QgZGlyZWN0aXZlcyBhcnJheS5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE9mZnNldCA9IGhvc3REaXJlY3RpdmVNYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCBjb21wb25lbnRPZmZzZXQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBObyBob3N0IGRpcmVjdGl2ZXMgb24gdGhpcyBjb21wb25lbnQsIGp1c3QgYWRkIHRoZVxuICAgICAgICAgICAgLy8gY29tcG9uZW50IGRlZiB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtYXRjaGVzLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgICAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFwcGVuZCBhbnkgaG9zdCBkaXJlY3RpdmVzIHRvIHRoZSBtYXRjaGVzIGZpcnN0LlxuICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgIGRlZi5maW5kSG9zdERpcmVjdGl2ZURlZnM/LihkZWYsIG1hdGNoZXMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbWF0Y2hlcyA9PT0gbnVsbCA/IG51bGwgOiBbbWF0Y2hlcywgaG9zdERpcmVjdGl2ZURlZnNdO1xufVxuXG4vKipcbiAqIE1hcmtzIGEgZ2l2ZW4gVE5vZGUgYXMgYSBjb21wb25lbnQncyBob3N0LiBUaGlzIGNvbnNpc3RzIG9mOlxuICogLSBzZXR0aW5nIHRoZSBjb21wb25lbnQgb2Zmc2V0IG9uIHRoZSBUTm9kZS5cbiAqIC0gc3RvcmluZyBpbmRleCBvZiBjb21wb25lbnQncyBob3N0IGVsZW1lbnQgc28gaXQgd2lsbCBiZSBxdWV1ZWQgZm9yIHZpZXcgcmVmcmVzaCBkdXJpbmcgQ0QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3OiBUVmlldywgaG9zdFROb2RlOiBUTm9kZSwgY29tcG9uZW50T2Zmc2V0OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRHcmVhdGVyVGhhbihjb21wb25lbnRPZmZzZXQsIC0xLCAnY29tcG9uZW50T2Zmc2V0IG11c3QgYmUgZ3JlYXQgdGhhbiAtMScpO1xuICBob3N0VE5vZGUuY29tcG9uZW50T2Zmc2V0ID0gY29tcG9uZW50T2Zmc2V0O1xuICAodFZpZXcuY29tcG9uZW50cyA/Pz0gW10pLnB1c2goaG9zdFROb2RlLmluZGV4KTtcbn1cblxuLyoqIENhY2hlcyBsb2NhbCBuYW1lcyBhbmQgdGhlaXIgbWF0Y2hpbmcgZGlyZWN0aXZlIGluZGljZXMgZm9yIHF1ZXJ5IGFuZCB0ZW1wbGF0ZSBsb29rdXBzLiAqL1xuZnVuY3Rpb24gY2FjaGVNYXRjaGluZ0xvY2FsTmFtZXMoXG4gICAgdE5vZGU6IFROb2RlLCBsb2NhbFJlZnM6IHN0cmluZ1tdfG51bGwsIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9KTogdm9pZCB7XG4gIGlmIChsb2NhbFJlZnMpIHtcbiAgICBjb25zdCBsb2NhbE5hbWVzOiAoc3RyaW5nfG51bWJlcilbXSA9IHROb2RlLmxvY2FsTmFtZXMgPSBbXTtcblxuICAgIC8vIExvY2FsIG5hbWVzIG11c3QgYmUgc3RvcmVkIGluIHROb2RlIGluIHRoZSBzYW1lIG9yZGVyIHRoYXQgbG9jYWxSZWZzIGFyZSBkZWZpbmVkXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIHRvIGVuc3VyZSB0aGUgZGF0YSBpcyBsb2FkZWQgaW4gdGhlIHNhbWUgc2xvdHMgYXMgdGhlaXIgcmVmc1xuICAgIC8vIGluIHRoZSB0ZW1wbGF0ZSAoZm9yIHRlbXBsYXRlIHF1ZXJpZXMpLlxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxSZWZzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBpbmRleCA9IGV4cG9ydHNNYXBbbG9jYWxSZWZzW2kgKyAxXV07XG4gICAgICBpZiAoaW5kZXggPT0gbnVsbClcbiAgICAgICAgdGhyb3cgbmV3IFJ1bnRpbWVFcnJvcihcbiAgICAgICAgICAgIFJ1bnRpbWVFcnJvckNvZGUuRVhQT1JUX05PVF9GT1VORCxcbiAgICAgICAgICAgIG5nRGV2TW9kZSAmJiBgRXhwb3J0IG9mIG5hbWUgJyR7bG9jYWxSZWZzW2kgKyAxXX0nIG5vdCBmb3VuZCFgKTtcbiAgICAgIGxvY2FsTmFtZXMucHVzaChsb2NhbFJlZnNbaV0sIGluZGV4KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBCdWlsZHMgdXAgYW4gZXhwb3J0IG1hcCBhcyBkaXJlY3RpdmVzIGFyZSBjcmVhdGVkLCBzbyBsb2NhbCByZWZzIGNhbiBiZSBxdWlja2x5IG1hcHBlZFxuICogdG8gdGhlaXIgZGlyZWN0aXZlIGluc3RhbmNlcy5cbiAqL1xuZnVuY3Rpb24gc2F2ZU5hbWVUb0V4cG9ydE1hcChcbiAgICBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55PnxDb21wb25lbnREZWY8YW55PixcbiAgICBleHBvcnRzTWFwOiB7W2tleTogc3RyaW5nXTogbnVtYmVyfXxudWxsKSB7XG4gIGlmIChleHBvcnRzTWFwKSB7XG4gICAgaWYgKGRlZi5leHBvcnRBcykge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZWYuZXhwb3J0QXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgZXhwb3J0c01hcFtkZWYuZXhwb3J0QXNbaV1dID0gZGlyZWN0aXZlSWR4O1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoaXNDb21wb25lbnREZWYoZGVmKSkgZXhwb3J0c01hcFsnJ10gPSBkaXJlY3RpdmVJZHg7XG4gIH1cbn1cblxuLyoqXG4gKiBJbml0aWFsaXplcyB0aGUgZmxhZ3Mgb24gdGhlIGN1cnJlbnQgbm9kZSwgc2V0dGluZyBhbGwgaW5kaWNlcyB0byB0aGUgaW5pdGlhbCBpbmRleCxcbiAqIHRoZSBkaXJlY3RpdmUgY291bnQgdG8gMCwgYW5kIGFkZGluZyB0aGUgaXNDb21wb25lbnQgZmxhZy5cbiAqIEBwYXJhbSBpbmRleCB0aGUgaW5pdGlhbCBpbmRleFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5pdFROb2RlRmxhZ3ModE5vZGU6IFROb2RlLCBpbmRleDogbnVtYmVyLCBudW1iZXJPZkRpcmVjdGl2ZXM6IG51bWJlcikge1xuICBuZ0Rldk1vZGUgJiZcbiAgICAgIGFzc2VydE5vdEVxdWFsKFxuICAgICAgICAgIG51bWJlck9mRGlyZWN0aXZlcywgdE5vZGUuZGlyZWN0aXZlRW5kIC0gdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1JlYWNoZWQgdGhlIG1heCBudW1iZXIgb2YgZGlyZWN0aXZlcycpO1xuICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmlzRGlyZWN0aXZlSG9zdDtcbiAgLy8gV2hlbiB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIGNyZWF0ZWQgb24gYSBub2RlLCBzYXZlIHRoZSBpbmRleFxuICB0Tm9kZS5kaXJlY3RpdmVTdGFydCA9IGluZGV4O1xuICB0Tm9kZS5kaXJlY3RpdmVFbmQgPSBpbmRleCArIG51bWJlck9mRGlyZWN0aXZlcztcbiAgdE5vZGUucHJvdmlkZXJJbmRleGVzID0gaW5kZXg7XG59XG5cbi8qKlxuICogU2V0dXAgZGlyZWN0aXZlIGZvciBpbnN0YW50aWF0aW9uLlxuICpcbiAqIFdlIG5lZWQgdG8gY3JlYXRlIGEgYE5vZGVJbmplY3RvckZhY3RvcnlgIHdoaWNoIGlzIHRoZW4gaW5zZXJ0ZWQgaW4gYm90aCB0aGUgYEJsdWVwcmludGAgYXMgd2VsbFxuICogYXMgYExWaWV3YC4gYFRWaWV3YCBnZXRzIHRoZSBgRGlyZWN0aXZlRGVmYC5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YFxuICogQHBhcmFtIHROb2RlIGBUTm9kZWBcbiAqIEBwYXJhbSBsVmlldyBgTFZpZXdgXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggd2hlcmUgdGhlIGRpcmVjdGl2ZSB3aWxsIGJlIHN0b3JlZCBpbiB0aGUgRXhwYW5kby5cbiAqIEBwYXJhbSBkZWYgYERpcmVjdGl2ZURlZmBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbmZpZ3VyZVZpZXdXaXRoRGlyZWN0aXZlPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIGRlZjogRGlyZWN0aXZlRGVmPFQ+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0R3JlYXRlclRoYW5PckVxdWFsKGRpcmVjdGl2ZUluZGV4LCBIRUFERVJfT0ZGU0VULCAnTXVzdCBiZSBpbiBFeHBhbmRvIHNlY3Rpb24nKTtcbiAgdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gPSBkZWY7XG4gIGNvbnN0IGRpcmVjdGl2ZUZhY3RvcnkgPVxuICAgICAgZGVmLmZhY3RvcnkgfHwgKChkZWYgYXMge2ZhY3Rvcnk6IEZ1bmN0aW9ufSkuZmFjdG9yeSA9IGdldEZhY3RvcnlEZWYoZGVmLnR5cGUsIHRydWUpKTtcbiAgLy8gRXZlbiB0aG91Z2ggYGRpcmVjdGl2ZUZhY3RvcnlgIHdpbGwgYWxyZWFkeSBiZSB1c2luZyBgybXJtWRpcmVjdGl2ZUluamVjdGAgaW4gaXRzIGdlbmVyYXRlZCBjb2RlLFxuICAvLyB3ZSBhbHNvIHdhbnQgdG8gc3VwcG9ydCBgaW5qZWN0KClgIGRpcmVjdGx5IGZyb20gdGhlIGRpcmVjdGl2ZSBjb25zdHJ1Y3RvciBjb250ZXh0IHNvIHdlIHNldFxuICAvLyBgybXJtWRpcmVjdGl2ZUluamVjdGAgYXMgdGhlIGluamVjdCBpbXBsZW1lbnRhdGlvbiBoZXJlIHRvby5cbiAgY29uc3Qgbm9kZUluamVjdG9yRmFjdG9yeSA9XG4gICAgICBuZXcgTm9kZUluamVjdG9yRmFjdG9yeShkaXJlY3RpdmVGYWN0b3J5LCBpc0NvbXBvbmVudERlZihkZWYpLCDJtcm1ZGlyZWN0aXZlSW5qZWN0KTtcbiAgdFZpZXcuYmx1ZXByaW50W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG4gIGxWaWV3W2RpcmVjdGl2ZUluZGV4XSA9IG5vZGVJbmplY3RvckZhY3Rvcnk7XG5cbiAgcmVnaXN0ZXJIb3N0QmluZGluZ09wQ29kZXMoXG4gICAgICB0VmlldywgdE5vZGUsIGRpcmVjdGl2ZUluZGV4LCBhbGxvY0V4cGFuZG8odFZpZXcsIGxWaWV3LCBkZWYuaG9zdFZhcnMsIE5PX0NIQU5HRSksIGRlZik7XG59XG5cbmZ1bmN0aW9uIGFkZENvbXBvbmVudExvZ2ljPFQ+KGxWaWV3OiBMVmlldywgaG9zdFROb2RlOiBURWxlbWVudE5vZGUsIGRlZjogQ29tcG9uZW50RGVmPFQ+KTogdm9pZCB7XG4gIGNvbnN0IG5hdGl2ZSA9IGdldE5hdGl2ZUJ5VE5vZGUoaG9zdFROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIGNvbnN0IHRWaWV3ID0gZ2V0T3JDcmVhdGVDb21wb25lbnRUVmlldyhkZWYpO1xuXG4gIC8vIE9ubHkgY29tcG9uZW50IHZpZXdzIHNob3VsZCBiZSBhZGRlZCB0byB0aGUgdmlldyB0cmVlIGRpcmVjdGx5LiBFbWJlZGRlZCB2aWV3cyBhcmVcbiAgLy8gYWNjZXNzZWQgdGhyb3VnaCB0aGVpciBjb250YWluZXJzIGJlY2F1c2UgdGhleSBtYXkgYmUgcmVtb3ZlZCAvIHJlLWFkZGVkIGxhdGVyLlxuICBjb25zdCByZW5kZXJlckZhY3RvcnkgPSBsVmlld1tFTlZJUk9OTUVOVF0ucmVuZGVyZXJGYWN0b3J5O1xuICBjb25zdCBjb21wb25lbnRWaWV3ID0gYWRkVG9WaWV3VHJlZShcbiAgICAgIGxWaWV3LFxuICAgICAgY3JlYXRlTFZpZXcoXG4gICAgICAgICAgbFZpZXcsIHRWaWV3LCBudWxsLCBkZWYub25QdXNoID8gTFZpZXdGbGFncy5EaXJ0eSA6IExWaWV3RmxhZ3MuQ2hlY2tBbHdheXMsIG5hdGl2ZSxcbiAgICAgICAgICBob3N0VE5vZGUgYXMgVEVsZW1lbnROb2RlLCBudWxsLCByZW5kZXJlckZhY3RvcnkuY3JlYXRlUmVuZGVyZXIobmF0aXZlLCBkZWYpLCBudWxsLCBudWxsLFxuICAgICAgICAgIG51bGwpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICBgQXR0ZW1wdGVkIHRvIHNldCBhdHRyaWJ1dGUgXFxgJHtuYW1lfVxcYCBvbiBhIGNvbnRhaW5lciBub2RlLiBgICtcbiAgICAgICAgICAgIGBIb3N0IGJpbmRpbmdzIGFyZSBub3QgdmFsaWQgb24gbmctY29udGFpbmVyIG9yIG5nLXRlbXBsYXRlLmApO1xuICB9XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIHNldEVsZW1lbnRBdHRyaWJ1dGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCBuYW1lc3BhY2UsIHROb2RlLnZhbHVlLCBuYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQsIHRhZ05hbWU6IHN0cmluZ3xudWxsLFxuICAgIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUgYXMgc3RyaW5nLCBuYW1lc3BhY2UpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhIVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuXG4gICAgICB3cml0ZVRvRGlyZWN0aXZlSW5wdXQ8VD4oZGVmLCBpbnN0YW5jZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcblxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVUb0RpcmVjdGl2ZUlucHV0PFQ+KFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljTmFtZTogc3RyaW5nLCBwcml2YXRlTmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICB0cnkge1xuICAgIGlmIChkZWYuc2V0SW5wdXQgIT09IG51bGwpIHtcbiAgICAgIGRlZi5zZXRJbnB1dChpbnN0YW5jZSwgdmFsdWUsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKGluc3RhbmNlIGFzIGFueSlbcHJpdmF0ZU5hbWVdID0gdmFsdWU7XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gIH1cbn1cblxuLyoqXG4gKiBHZW5lcmF0ZXMgaW5pdGlhbElucHV0RGF0YSBmb3IgYSBub2RlIGFuZCBzdG9yZXMgaXQgaW4gdGhlIHRlbXBsYXRlJ3Mgc3RhdGljIHN0b3JhZ2VcbiAqIHNvIHN1YnNlcXVlbnQgdGVtcGxhdGUgaW52b2NhdGlvbnMgZG9uJ3QgaGF2ZSB0byByZWNhbGN1bGF0ZSBpdC5cbiAqXG4gKiBpbml0aWFsSW5wdXREYXRhIGlzIGFuIGFycmF5IGNvbnRhaW5pbmcgdmFsdWVzIHRoYXQgbmVlZCB0byBiZSBzZXQgYXMgaW5wdXQgcHJvcGVydGllc1xuICogZm9yIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlLCBidXQgb25seSBvbmNlIG9uIGNyZWF0aW9uLiBXZSBuZWVkIHRoaXMgYXJyYXkgdG8gc3VwcG9ydFxuICogdGhlIGNhc2Ugd2hlcmUgeW91IHNldCBhbiBASW5wdXQgcHJvcGVydHkgb2YgYSBkaXJlY3RpdmUgdXNpbmcgYXR0cmlidXRlLWxpa2Ugc3ludGF4LlxuICogZS5nLiBpZiB5b3UgaGF2ZSBhIGBuYW1lYCBASW5wdXQsIHlvdSBjYW4gc2V0IGl0IG9uY2UgbGlrZSB0aGlzOlxuICpcbiAqIDxteS1jb21wb25lbnQgbmFtZT1cIkJlc3NcIj48L215LWNvbXBvbmVudD5cbiAqXG4gKiBAcGFyYW0gaW5wdXRzIElucHV0IGFsaWFzIG1hcCB0aGF0IHdhcyBnZW5lcmF0ZWQgZnJvbSB0aGUgZGlyZWN0aXZlIGRlZiBpbnB1dHMuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSB0aGF0IGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gYXR0cnMgU3RhdGljIGF0dHJzIG9uIHRoaXMgbm9kZS5cbiAqL1xuZnVuY3Rpb24gZ2VuZXJhdGVJbml0aWFsSW5wdXRzKFxuICAgIGlucHV0czogUHJvcGVydHlBbGlhc2VzLCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLCBhdHRyczogVEF0dHJpYnV0ZXMpOiBJbml0aWFsSW5wdXRzfG51bGwge1xuICBsZXQgaW5wdXRzVG9TdG9yZTogSW5pdGlhbElucHV0c3xudWxsID0gbnVsbDtcbiAgbGV0IGkgPSAwO1xuICB3aGlsZSAoaSA8IGF0dHJzLmxlbmd0aCkge1xuICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAvLyBXZSBkbyBub3QgYWxsb3cgaW5wdXRzIG9uIG5hbWVzcGFjZWQgYXR0cmlidXRlcy5cbiAgICAgIGkgKz0gNDtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5Qcm9qZWN0QXMpIHtcbiAgICAgIC8vIFNraXAgb3ZlciB0aGUgYG5nUHJvamVjdEFzYCB2YWx1ZS5cbiAgICAgIGkgKz0gMjtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cblxuICAgIC8vIElmIHdlIGhpdCBhbnkgb3RoZXIgYXR0cmlidXRlIG1hcmtlcnMsIHdlJ3JlIGRvbmUgYW55d2F5LiBOb25lIG9mIHRob3NlIGFyZSB2YWxpZCBpbnB1dHMuXG4gICAgaWYgKHR5cGVvZiBhdHRyTmFtZSA9PT0gJ251bWJlcicpIGJyZWFrO1xuXG4gICAgaWYgKGlucHV0cy5oYXNPd25Qcm9wZXJ0eShhdHRyTmFtZSBhcyBzdHJpbmcpKSB7XG4gICAgICBpZiAoaW5wdXRzVG9TdG9yZSA9PT0gbnVsbCkgaW5wdXRzVG9TdG9yZSA9IFtdO1xuXG4gICAgICAvLyBGaW5kIHRoZSBpbnB1dCdzIHB1YmxpYyBuYW1lIGZyb20gdGhlIGlucHV0IHN0b3JlLiBOb3RlIHRoYXQgd2UgY2FuIGJlIGZvdW5kIGVhc2llclxuICAgICAgLy8gdGhyb3VnaCB0aGUgZGlyZWN0aXZlIGRlZiwgYnV0IHdlIHdhbnQgdG8gZG8gaXQgdXNpbmcgdGhlIGlucHV0cyBzdG9yZSBzbyB0aGF0IGl0IGNhblxuICAgICAgLy8gYWNjb3VudCBmb3IgaG9zdCBkaXJlY3RpdmUgYWxpYXNlcy5cbiAgICAgIGNvbnN0IGlucHV0Q29uZmlnID0gaW5wdXRzW2F0dHJOYW1lIGFzIHN0cmluZ107XG4gICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGlucHV0Q29uZmlnLmxlbmd0aDsgaiArPSAyKSB7XG4gICAgICAgIGlmIChpbnB1dENvbmZpZ1tqXSA9PT0gZGlyZWN0aXZlSW5kZXgpIHtcbiAgICAgICAgICBpbnB1dHNUb1N0b3JlLnB1c2goXG4gICAgICAgICAgICAgIGF0dHJOYW1lIGFzIHN0cmluZywgaW5wdXRDb25maWdbaiArIDFdIGFzIHN0cmluZywgYXR0cnNbaSArIDFdIGFzIHN0cmluZyk7XG4gICAgICAgICAgLy8gQSBkaXJlY3RpdmUgY2FuJ3QgaGF2ZSBtdWx0aXBsZSBpbnB1dHMgd2l0aCB0aGUgc2FtZSBuYW1lIHNvIHdlIGNhbiBicmVhayBoZXJlLlxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaSArPSAyO1xuICB9XG4gIHJldHVybiBpbnB1dHNUb1N0b3JlO1xufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBWaWV3Q29udGFpbmVyICYgVmlld1xuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgTENvbnRhaW5lciwgZWl0aGVyIGZyb20gYSBjb250YWluZXIgaW5zdHJ1Y3Rpb24sIG9yIGZvciBhIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHBhcmFtIGhvc3ROYXRpdmUgVGhlIGhvc3QgZWxlbWVudCBmb3IgdGhlIExDb250YWluZXJcbiAqIEBwYXJhbSBob3N0VE5vZGUgVGhlIGhvc3QgVE5vZGUgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gY3VycmVudFZpZXcgVGhlIHBhcmVudCB2aWV3IG9mIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gbmF0aXZlIFRoZSBuYXRpdmUgY29tbWVudCBlbGVtZW50XG4gKiBAcGFyYW0gaXNGb3JWaWV3Q29udGFpbmVyUmVmIE9wdGlvbmFsIGEgZmxhZyBpbmRpY2F0aW5nIHRoZSBWaWV3Q29udGFpbmVyUmVmIGNhc2VcbiAqIEByZXR1cm5zIExDb250YWluZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxDb250YWluZXIoXG4gICAgaG9zdE5hdGl2ZTogUkVsZW1lbnR8UkNvbW1lbnR8TFZpZXcsIGN1cnJlbnRWaWV3OiBMVmlldywgbmF0aXZlOiBSQ29tbWVudCxcbiAgICB0Tm9kZTogVE5vZGUpOiBMQ29udGFpbmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGN1cnJlbnRWaWV3KTtcbiAgY29uc3QgbENvbnRhaW5lcjogTENvbnRhaW5lciA9IFtcbiAgICBob3N0TmF0aXZlLCAgIC8vIGhvc3QgbmF0aXZlXG4gICAgdHJ1ZSwgICAgICAgICAvLyBCb29sZWFuIGB0cnVlYCBpbiB0aGlzIHBvc2l0aW9uIHNpZ25pZmllcyB0aGF0IHRoaXMgaXMgYW4gYExDb250YWluZXJgXG4gICAgZmFsc2UsICAgICAgICAvLyBoYXMgdHJhbnNwbGFudGVkIHZpZXdzXG4gICAgY3VycmVudFZpZXcsICAvLyBwYXJlbnRcbiAgICBudWxsLCAgICAgICAgIC8vIG5leHRcbiAgICAwLCAgICAgICAgICAgIC8vIHRyYW5zcGxhbnRlZCB2aWV3cyB0byByZWZyZXNoIGNvdW50XG4gICAgdE5vZGUsICAgICAgICAvLyB0X2hvc3RcbiAgICBuYXRpdmUsICAgICAgIC8vIG5hdGl2ZSxcbiAgICBudWxsLCAgICAgICAgIC8vIHZpZXcgcmVmc1xuICAgIG51bGwsICAgICAgICAgLy8gbW92ZWQgdmlld3NcbiAgICBudWxsLCAgICAgICAgIC8vIGRlaHlkcmF0ZWQgdmlld3NcbiAgXTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICBsQ29udGFpbmVyLmxlbmd0aCwgQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQsXG4gICAgICAgICAgJ1Nob3VsZCBhbGxvY2F0ZSBjb3JyZWN0IG51bWJlciBvZiBzbG90cyBmb3IgTENvbnRhaW5lciBoZWFkZXIuJyk7XG4gIHJldHVybiBsQ29udGFpbmVyO1xufVxuXG4vKiogUmVmcmVzaGVzIGFsbCBjb250ZW50IHF1ZXJpZXMgZGVjbGFyZWQgYnkgZGlyZWN0aXZlcyBpbiBhIGdpdmVuIHZpZXcgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWZyZXNoQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcpOiB2b2lkIHtcbiAgY29uc3QgY29udGVudFF1ZXJpZXMgPSB0Vmlldy5jb250ZW50UXVlcmllcztcbiAgaWYgKGNvbnRlbnRRdWVyaWVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb250ZW50UXVlcmllcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgcXVlcnlTdGFydElkeCA9IGNvbnRlbnRRdWVyaWVzW2ldO1xuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmSWR4ID0gY29udGVudFF1ZXJpZXNbaSArIDFdO1xuICAgICAgaWYgKGRpcmVjdGl2ZURlZklkeCAhPT0gLTEpIHtcbiAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVEZWZJZHhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChkaXJlY3RpdmVEZWYsICdEaXJlY3RpdmVEZWYgbm90IGZvdW5kLicpO1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLmNvbnRlbnRRdWVyaWVzLCAnY29udGVudFF1ZXJpZXMgZnVuY3Rpb24gc2hvdWxkIGJlIGRlZmluZWQnKTtcbiAgICAgICAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgocXVlcnlTdGFydElkeCk7XG4gICAgICAgIGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcyEoUmVuZGVyRmxhZ3MuVXBkYXRlLCBsVmlld1tkaXJlY3RpdmVEZWZJZHhdLCBkaXJlY3RpdmVEZWZJZHgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEFkZHMgTFZpZXcgb3IgTENvbnRhaW5lciB0byB0aGUgZW5kIG9mIHRoZSBjdXJyZW50IHZpZXcgdHJlZS5cbiAqXG4gKiBUaGlzIHN0cnVjdHVyZSB3aWxsIGJlIHVzZWQgdG8gdHJhdmVyc2UgdGhyb3VnaCBuZXN0ZWQgdmlld3MgdG8gcmVtb3ZlIGxpc3RlbmVyc1xuICogYW5kIGNhbGwgb25EZXN0cm95IGNhbGxiYWNrcy5cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2hlcmUgTFZpZXcgb3IgTENvbnRhaW5lciBzaG91bGQgYmUgYWRkZWRcbiAqIEBwYXJhbSBhZGp1c3RlZEhvc3RJbmRleCBJbmRleCBvZiB0aGUgdmlldydzIGhvc3Qgbm9kZSBpbiBMVmlld1tdLCBhZGp1c3RlZCBmb3IgaGVhZGVyXG4gKiBAcGFyYW0gbFZpZXdPckxDb250YWluZXIgVGhlIExWaWV3IG9yIExDb250YWluZXIgdG8gYWRkIHRvIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBzdGF0ZSBwYXNzZWQgaW5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFRvVmlld1RyZWU8VCBleHRlbmRzIExWaWV3fExDb250YWluZXI+KGxWaWV3OiBMVmlldywgbFZpZXdPckxDb250YWluZXI6IFQpOiBUIHtcbiAgLy8gVE9ETyhiZW5sZXNoL21pc2tvKTogVGhpcyBpbXBsZW1lbnRhdGlvbiBpcyBpbmNvcnJlY3QsIGJlY2F1c2UgaXQgYWx3YXlzIGFkZHMgdGhlIExDb250YWluZXJcbiAgLy8gdG8gdGhlIGVuZCBvZiB0aGUgcXVldWUsIHdoaWNoIG1lYW5zIGlmIHRoZSBkZXZlbG9wZXIgcmV0cmlldmVzIHRoZSBMQ29udGFpbmVycyBmcm9tIFJOb2RlcyBvdXRcbiAgLy8gb2Ygb3JkZXIsIHRoZSBjaGFuZ2UgZGV0ZWN0aW9uIHdpbGwgcnVuIG91dCBvZiBvcmRlciwgYXMgdGhlIGFjdCBvZiByZXRyaWV2aW5nIHRoZSB0aGVcbiAgLy8gTENvbnRhaW5lciBmcm9tIHRoZSBSTm9kZSBpcyB3aGF0IGFkZHMgaXQgdG8gdGhlIHF1ZXVlLlxuICBpZiAobFZpZXdbQ0hJTERfSEVBRF0pIHtcbiAgICBsVmlld1tDSElMRF9UQUlMXSFbTkVYVF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfSBlbHNlIHtcbiAgICBsVmlld1tDSElMRF9IRUFEXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICB9XG4gIGxWaWV3W0NISUxEX1RBSUxdID0gbFZpZXdPckxDb250YWluZXI7XG4gIHJldHVybiBsVmlld09yTENvbnRhaW5lcjtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBDaGFuZ2UgZGV0ZWN0aW9uXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVmlld1F1ZXJ5Rm48VD4oXG4gICAgZmxhZ3M6IFJlbmRlckZsYWdzLCB2aWV3UXVlcnlGbjogVmlld1F1ZXJpZXNGdW5jdGlvbjxUPiwgY29tcG9uZW50OiBUKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHZpZXdRdWVyeUZuLCAnVmlldyBxdWVyaWVzIGZ1bmN0aW9uIHRvIGV4ZWN1dGUgbXVzdCBiZSBkZWZpbmVkLicpO1xuICBzZXRDdXJyZW50UXVlcnlJbmRleCgwKTtcbiAgY29uc3QgcHJldkNvbnN1bWVyID0gc2V0QWN0aXZlQ29uc3VtZXIobnVsbCk7XG4gIHRyeSB7XG4gICAgdmlld1F1ZXJ5Rm4oZmxhZ3MsIGNvbXBvbmVudCk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0QWN0aXZlQ29uc3VtZXIocHJldkNvbnN1bWVyKTtcbiAgfVxufVxuXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEJpbmRpbmdzICYgaW50ZXJwb2xhdGlvbnNcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cblxuLyoqXG4gKiBTdG9yZXMgbWV0YS1kYXRhIGZvciBhIHByb3BlcnR5IGJpbmRpbmcgdG8gYmUgdXNlZCBieSBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYC5cbiAqXG4gKiBJbiBvcmRlciB0byBzdXBwb3J0IFRlc3RCZWQncyBgRGVidWdFbGVtZW50LnByb3BlcnRpZXNgIHdlIG5lZWQgdG8gc2F2ZSwgZm9yIGVhY2ggYmluZGluZzpcbiAqIC0gYSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogLSBhIHN0YXRpYyBwYXJ0cyBvZiBpbnRlcnBvbGF0ZWQgc3RyaW5ncztcbiAqXG4gKiBBIGdpdmVuIHByb3BlcnR5IG1ldGFkYXRhIGlzIHNhdmVkIGF0IHRoZSBiaW5kaW5nJ3MgaW5kZXggaW4gdGhlIGBUVmlldy5kYXRhYCAoaW4gb3RoZXIgd29yZHMsIGFcbiAqIHByb3BlcnR5IGJpbmRpbmcgbWV0YWRhdGEgd2lsbCBiZSBzdG9yZWQgaW4gYFRWaWV3LmRhdGFgIGF0IHRoZSBzYW1lIGluZGV4IGFzIGEgYm91bmQgdmFsdWUgaW5cbiAqIGBMVmlld2ApLiBNZXRhZGF0YSBhcmUgcmVwcmVzZW50ZWQgYXMgYElOVEVSUE9MQVRJT05fREVMSU1JVEVSYC1kZWxpbWl0ZWQgc3RyaW5nIHdpdGggdGhlXG4gKiBmb2xsb3dpbmcgZm9ybWF0OlxuICogLSBgcHJvcGVydHlOYW1lYCBmb3IgYm91bmQgcHJvcGVydGllcztcbiAqIC0gYHByb3BlcnR5TmFtZe+/vXByZWZpeO+/vWludGVycG9sYXRpb25fc3RhdGljX3BhcnQx77+9Li5pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Tu+/vXN1ZmZpeGAgZm9yXG4gKiBpbnRlcnBvbGF0ZWQgcHJvcGVydGllcy5cbiAqXG4gKiBAcGFyYW0gdERhdGEgYFREYXRhYCB3aGVyZSBtZXRhLWRhdGEgd2lsbCBiZSBzYXZlZDtcbiAqIEBwYXJhbSB0Tm9kZSBgVE5vZGVgIHRoYXQgaXMgYSB0YXJnZXQgb2YgdGhlIGJpbmRpbmc7XG4gKiBAcGFyYW0gcHJvcGVydHlOYW1lIGJvdW5kIHByb3BlcnR5IG5hbWU7XG4gKiBAcGFyYW0gYmluZGluZ0luZGV4IGJpbmRpbmcgaW5kZXggaW4gYExWaWV3YFxuICogQHBhcmFtIGludGVycG9sYXRpb25QYXJ0cyBzdGF0aWMgaW50ZXJwb2xhdGlvbiBwYXJ0cyAoZm9yIHByb3BlcnR5IGludGVycG9sYXRpb25zKVxuICovXG5leHBvcnQgZnVuY3Rpb24gc3RvcmVQcm9wZXJ0eUJpbmRpbmdNZXRhZGF0YShcbiAgICB0RGF0YTogVERhdGEsIHROb2RlOiBUTm9kZSwgcHJvcGVydHlOYW1lOiBzdHJpbmcsIGJpbmRpbmdJbmRleDogbnVtYmVyLFxuICAgIC4uLmludGVycG9sYXRpb25QYXJ0czogc3RyaW5nW10pIHtcbiAgLy8gQmluZGluZyBtZXRhLWRhdGEgYXJlIHN0b3JlZCBvbmx5IHRoZSBmaXJzdCB0aW1lIGEgZ2l2ZW4gcHJvcGVydHkgaW5zdHJ1Y3Rpb24gaXMgcHJvY2Vzc2VkLlxuICAvLyBTaW5jZSB3ZSBkb24ndCBoYXZlIGEgY29uY2VwdCBvZiB0aGUgXCJmaXJzdCB1cGRhdGUgcGFzc1wiIHdlIG5lZWQgdG8gY2hlY2sgZm9yIHByZXNlbmNlIG9mIHRoZVxuICAvLyBiaW5kaW5nIG1ldGEtZGF0YSB0byBkZWNpZGUgaWYgb25lIHNob3VsZCBiZSBzdG9yZWQgKG9yIGlmIHdhcyBzdG9yZWQgYWxyZWFkeSkuXG4gIGlmICh0RGF0YVtiaW5kaW5nSW5kZXhdID09PSBudWxsKSB7XG4gICAgaWYgKHROb2RlLmlucHV0cyA9PSBudWxsIHx8ICF0Tm9kZS5pbnB1dHNbcHJvcGVydHlOYW1lXSkge1xuICAgICAgY29uc3QgcHJvcEJpbmRpbmdJZHhzID0gdE5vZGUucHJvcGVydHlCaW5kaW5ncyB8fCAodE5vZGUucHJvcGVydHlCaW5kaW5ncyA9IFtdKTtcbiAgICAgIHByb3BCaW5kaW5nSWR4cy5wdXNoKGJpbmRpbmdJbmRleCk7XG4gICAgICBsZXQgYmluZGluZ01ldGFkYXRhID0gcHJvcGVydHlOYW1lO1xuICAgICAgaWYgKGludGVycG9sYXRpb25QYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGJpbmRpbmdNZXRhZGF0YSArPVxuICAgICAgICAgICAgSU5URVJQT0xBVElPTl9ERUxJTUlURVIgKyBpbnRlcnBvbGF0aW9uUGFydHMuam9pbihJTlRFUlBPTEFUSU9OX0RFTElNSVRFUik7XG4gICAgICB9XG4gICAgICB0RGF0YVtiaW5kaW5nSW5kZXhdID0gYmluZGluZ01ldGFkYXRhO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAodmlldzogTFZpZXcpOiBhbnlbXSB7XG4gIC8vIHRvcCBsZXZlbCB2YXJpYWJsZXMgc2hvdWxkIG5vdCBiZSBleHBvcnRlZCBmb3IgcGVyZm9ybWFuY2UgcmVhc29ucyAoUEVSRl9OT1RFUy5tZClcbiAgcmV0dXJuIHZpZXdbQ0xFQU5VUF0gfHwgKHZpZXdbQ0xFQU5VUF0gPSBbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRWaWV3Q2xlYW51cCh0VmlldzogVFZpZXcpOiBhbnlbXSB7XG4gIHJldHVybiB0Vmlldy5jbGVhbnVwIHx8ICh0Vmlldy5jbGVhbnVwID0gW10pO1xufVxuXG4vKipcbiAqIFRoZXJlIGFyZSBjYXNlcyB3aGVyZSB0aGUgc3ViIGNvbXBvbmVudCdzIHJlbmRlcmVyIG5lZWRzIHRvIGJlIGluY2x1ZGVkXG4gKiBpbnN0ZWFkIG9mIHRoZSBjdXJyZW50IHJlbmRlcmVyIChzZWUgdGhlIGNvbXBvbmVudFN5bnRoZXRpY0hvc3QqIGluc3RydWN0aW9ucykuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2FkQ29tcG9uZW50UmVuZGVyZXIoXG4gICAgY3VycmVudERlZjogRGlyZWN0aXZlRGVmPGFueT58bnVsbCwgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcpOiBSZW5kZXJlciB7XG4gIC8vIFRPRE8oRlctMjA0Myk6IHRoZSBgY3VycmVudERlZmAgaXMgbnVsbCB3aGVuIGhvc3QgYmluZGluZ3MgYXJlIGludm9rZWQgd2hpbGUgY3JlYXRpbmcgcm9vdFxuICAvLyBjb21wb25lbnQgKHNlZSBwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2NvbXBvbmVudC50cykuIFRoaXMgaXMgbm90IGNvbnNpc3RlbnQgd2l0aCB0aGUgcHJvY2Vzc1xuICAvLyBvZiBjcmVhdGluZyBpbm5lciBjb21wb25lbnRzLCB3aGVuIGN1cnJlbnQgZGlyZWN0aXZlIGluZGV4IGlzIGF2YWlsYWJsZSBpbiB0aGUgc3RhdGUuIEluIG9yZGVyXG4gIC8vIHRvIGF2b2lkIHJlbHlpbmcgb24gY3VycmVudCBkZWYgYmVpbmcgYG51bGxgICh0aHVzIHNwZWNpYWwtY2FzaW5nIHJvb3QgY29tcG9uZW50IGNyZWF0aW9uKSwgdGhlXG4gIC8vIHByb2Nlc3Mgb2YgY3JlYXRpbmcgcm9vdCBjb21wb25lbnQgc2hvdWxkIGJlIHVuaWZpZWQgd2l0aCB0aGUgcHJvY2VzcyBvZiBjcmVhdGluZyBpbm5lclxuICAvLyBjb21wb25lbnRzLlxuICBpZiAoY3VycmVudERlZiA9PT0gbnVsbCB8fCBpc0NvbXBvbmVudERlZihjdXJyZW50RGVmKSkge1xuICAgIGxWaWV3ID0gdW53cmFwTFZpZXcobFZpZXdbdE5vZGUuaW5kZXhdKSE7XG4gIH1cbiAgcmV0dXJuIGxWaWV3W1JFTkRFUkVSXTtcbn1cblxuLyoqIEhhbmRsZXMgYW4gZXJyb3IgdGhyb3duIGluIGFuIExWaWV3LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhbmRsZUVycm9yKGxWaWV3OiBMVmlldywgZXJyb3I6IGFueSk6IHZvaWQge1xuICBjb25zdCBpbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXTtcbiAgY29uc3QgZXJyb3JIYW5kbGVyID0gaW5qZWN0b3IgPyBpbmplY3Rvci5nZXQoRXJyb3JIYW5kbGVyLCBudWxsKSA6IG51bGw7XG4gIGVycm9ySGFuZGxlciAmJiBlcnJvckhhbmRsZXIuaGFuZGxlRXJyb3IoZXJyb3IpO1xufVxuXG4vKipcbiAqIFNldCB0aGUgaW5wdXRzIG9mIGRpcmVjdGl2ZXMgYXQgdGhlIGN1cnJlbnQgbm9kZSB0byBjb3JyZXNwb25kaW5nIHZhbHVlLlxuICpcbiAqIEBwYXJhbSB0VmlldyBUaGUgY3VycmVudCBUVmlld1xuICogQHBhcmFtIGxWaWV3IHRoZSBgTFZpZXdgIHdoaWNoIGNvbnRhaW5zIHRoZSBkaXJlY3RpdmVzLlxuICogQHBhcmFtIGlucHV0cyBtYXBwaW5nIGJldHdlZW4gdGhlIHB1YmxpYyBcImlucHV0XCIgbmFtZSBhbmQgcHJpdmF0ZWx5LWtub3duLFxuICogICAgICAgIHBvc3NpYmx5IG1pbmlmaWVkLCBwcm9wZXJ0eSBuYW1lcyB0byB3cml0ZSB0by5cbiAqIEBwYXJhbSB2YWx1ZSBWYWx1ZSB0byBzZXQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzZXRJbnB1dHNGb3JQcm9wZXJ0eShcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgaW5wdXRzOiBQcm9wZXJ0eUFsaWFzVmFsdWUsIHB1YmxpY05hbWU6IHN0cmluZywgdmFsdWU6IGFueSk6IHZvaWQge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0cy5sZW5ndGg7KSB7XG4gICAgY29uc3QgaW5kZXggPSBpbnB1dHNbaSsrXSBhcyBudW1iZXI7XG4gICAgY29uc3QgcHJpdmF0ZU5hbWUgPSBpbnB1dHNbaSsrXSBhcyBzdHJpbmc7XG4gICAgY29uc3QgaW5zdGFuY2UgPSBsVmlld1tpbmRleF07XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuXG4gICAgd3JpdGVUb0RpcmVjdGl2ZUlucHV0KGRlZiwgaW5zdGFuY2UsIHB1YmxpY05hbWUsIHByaXZhdGVOYW1lLCB2YWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBVcGRhdGVzIGEgdGV4dCBiaW5kaW5nIGF0IGEgZ2l2ZW4gaW5kZXggaW4gYSBnaXZlbiBMVmlldy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRleHRCaW5kaW5nSW50ZXJuYWwobFZpZXc6IExWaWV3LCBpbmRleDogbnVtYmVyLCB2YWx1ZTogc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRTdHJpbmcodmFsdWUsICdWYWx1ZSBzaG91bGQgYmUgYSBzdHJpbmcnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdFNhbWUodmFsdWUsIE5PX0NIQU5HRSBhcyBhbnksICd2YWx1ZSBzaG91bGQgbm90IGJlIE5PX0NIQU5HRScpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCBpbmRleCk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeUluZGV4KGluZGV4LCBsVmlldykgYXMgYW55IGFzIFJUZXh0O1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChlbGVtZW50LCAnbmF0aXZlIGVsZW1lbnQgc2hvdWxkIGV4aXN0Jyk7XG4gIHVwZGF0ZVRleHROb2RlKGxWaWV3W1JFTkRFUkVSXSwgZWxlbWVudCwgdmFsdWUpO1xufVxuIl19