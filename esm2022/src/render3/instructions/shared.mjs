/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { consumerAfterComputation, consumerBeforeComputation, setActiveConsumer } from '@angular/core/primitives/signals';
import { ErrorHandler } from '../../error_handler';
import { RuntimeError } from '../../errors';
import { hasSkipHydrationAttrOnRElement } from '../../hydration/skip_hydration';
import { PRESERVE_HOST_CONTENT, PRESERVE_HOST_CONTENT_DEFAULT } from '../../hydration/tokens';
import { processTextNodeMarkersBeforeHydration } from '../../hydration/utils';
import { ViewEncapsulation } from '../../metadata/view';
import { validateAgainstEventAttributes, validateAgainstEventProperties } from '../../sanitization/sanitization';
import { assertDefined, assertEqual, assertGreaterThan, assertGreaterThanOrEqual, assertIndexInRange, assertNotEqual, assertNotSame, assertSame, assertString } from '../../util/assert';
import { escapeCommentText } from '../../util/dom';
import { normalizeDebugBindingName, normalizeDebugBindingValue } from '../../util/ng_reflect';
import { stringify } from '../../util/stringify';
import { assertFirstCreatePass, assertFirstUpdatePass, assertLView, assertNoDuplicateDirectives, assertTNodeForLView, assertTNodeForTView } from '../assert';
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
                consumer.dirty = false;
                const prevConsumer = consumerBeforeComputation(consumer);
                try {
                    const context = lView[directiveIdx];
                    hostBindingFn(2 /* RenderFlags.Update */, context);
                }
                finally {
                    consumerAfterComputation(consumer, prevConsumer);
                }
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
        const effectiveConsumer = isUpdatePhase ? consumer : null;
        const prevConsumer = consumerBeforeComputation(effectiveConsumer);
        try {
            if (effectiveConsumer !== null) {
                effectiveConsumer.dirty = false;
            }
            templateFn(rf, context);
        }
        finally {
            consumerAfterComputation(effectiveConsumer, prevConsumer);
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
    if (hasSkipHydrationAttrOnRElement(rootElement)) {
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
    ngDevMode && matches !== null && assertNoDuplicateDirectives(matches);
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
    let lViewFlags = 16 /* LViewFlags.CheckAlways */;
    if (def.signals) {
        lViewFlags = 4096 /* LViewFlags.SignalView */;
    }
    else if (def.onPush) {
        lViewFlags = 64 /* LViewFlags.Dirty */;
    }
    const componentView = addToViewTree(lView, createLView(lView, tView, null, lViewFlags, native, hostTNode, null, rendererFactory.createRenderer(native, def), null, null, null));
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
        const inputTransforms = def.inputTransforms;
        if (inputTransforms !== null && inputTransforms.hasOwnProperty(privateName)) {
            value = inputTransforms[privateName].call(instance, value);
        }
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
        tNode,
        false,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2hhcmVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9pbnN0cnVjdGlvbnMvc2hhcmVkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyx3QkFBd0IsRUFBRSx5QkFBeUIsRUFBRSxpQkFBaUIsRUFBQyxNQUFNLGtDQUFrQyxDQUFDO0FBR3hILE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsWUFBWSxFQUFtQixNQUFNLGNBQWMsQ0FBQztBQUU1RCxPQUFPLEVBQUMsOEJBQThCLEVBQUMsTUFBTSxnQ0FBZ0MsQ0FBQztBQUM5RSxPQUFPLEVBQUMscUJBQXFCLEVBQUUsNkJBQTZCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM1RixPQUFPLEVBQUMscUNBQXFDLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUk1RSxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN0RCxPQUFPLEVBQUMsOEJBQThCLEVBQUUsOEJBQThCLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUMvRyxPQUFPLEVBQUMsYUFBYSxFQUFFLFdBQVcsRUFBRSxpQkFBaUIsRUFBRSx3QkFBd0IsRUFBRSxrQkFBa0IsRUFBRSxjQUFjLEVBQUUsYUFBYSxFQUFFLFVBQVUsRUFBRSxZQUFZLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUN2TCxPQUFPLEVBQUMsaUJBQWlCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUNqRCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUM1RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDL0MsT0FBTyxFQUFDLHFCQUFxQixFQUFFLHFCQUFxQixFQUFFLFdBQVcsRUFBRSwy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QUMvRCxTQUFTLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0lBQ25FLGNBQWMsQ0FBQyxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2xELENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtjb25zdW1lckFmdGVyQ29tcHV0YXRpb24sIGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24sIHNldEFjdGl2ZUNvbnN1bWVyfSBmcm9tICdAYW5ndWxhci9jb3JlL3ByaW1pdGl2ZXMvc2lnbmFscyc7XG5cbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uLy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7RXJyb3JIYW5kbGVyfSBmcm9tICcuLi8uLi9lcnJvcl9oYW5kbGVyJztcbmltcG9ydCB7UnVudGltZUVycm9yLCBSdW50aW1lRXJyb3JDb2RlfSBmcm9tICcuLi8uLi9lcnJvcnMnO1xuaW1wb3J0IHtEZWh5ZHJhdGVkVmlld30gZnJvbSAnLi4vLi4vaHlkcmF0aW9uL2ludGVyZmFjZXMnO1xuaW1wb3J0IHtoYXNTa2lwSHlkcmF0aW9uQXR0ck9uUkVsZW1lbnR9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi9za2lwX2h5ZHJhdGlvbic7XG5pbXBvcnQge1BSRVNFUlZFX0hPU1RfQ09OVEVOVCwgUFJFU0VSVkVfSE9TVF9DT05URU5UX0RFRkFVTFR9IGZyb20gJy4uLy4uL2h5ZHJhdGlvbi90b2tlbnMnO1xuaW1wb3J0IHtwcm9jZXNzVGV4dE5vZGVNYXJrZXJzQmVmb3JlSHlkcmF0aW9ufSBmcm9tICcuLi8uLi9oeWRyYXRpb24vdXRpbHMnO1xuaW1wb3J0IHtEb0NoZWNrLCBPbkNoYW5nZXMsIE9uSW5pdH0gZnJvbSAnLi4vLi4vaW50ZXJmYWNlL2xpZmVjeWNsZV9ob29rcyc7XG5pbXBvcnQge1dyaXRhYmxlfSBmcm9tICcuLi8uLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge1NjaGVtYU1ldGFkYXRhfSBmcm9tICcuLi8uLi9tZXRhZGF0YS9zY2hlbWEnO1xuaW1wb3J0IHtWaWV3RW5jYXBzdWxhdGlvbn0gZnJvbSAnLi4vLi4vbWV0YWRhdGEvdmlldyc7XG5pbXBvcnQge3ZhbGlkYXRlQWdhaW5zdEV2ZW50QXR0cmlidXRlcywgdmFsaWRhdGVBZ2FpbnN0RXZlbnRQcm9wZXJ0aWVzfSBmcm9tICcuLi8uLi9zYW5pdGl6YXRpb24vc2FuaXRpemF0aW9uJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWwsIGFzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwsIGFzc2VydEluZGV4SW5SYW5nZSwgYXNzZXJ0Tm90RXF1YWwsIGFzc2VydE5vdFNhbWUsIGFzc2VydFNhbWUsIGFzc2VydFN0cmluZ30gZnJvbSAnLi4vLi4vdXRpbC9hc3NlcnQnO1xuaW1wb3J0IHtlc2NhcGVDb21tZW50VGV4dH0gZnJvbSAnLi4vLi4vdXRpbC9kb20nO1xuaW1wb3J0IHtub3JtYWxpemVEZWJ1Z0JpbmRpbmdOYW1lLCBub3JtYWxpemVEZWJ1Z0JpbmRpbmdWYWx1ZX0gZnJvbSAnLi4vLi4vdXRpbC9uZ19yZWZsZWN0JztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi8uLi91dGlsL3N0cmluZ2lmeSc7XG5pbXBvcnQge2Fzc2VydEZpcnN0Q3JlYXRlUGFzcywgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzLCBhc3NlcnRMVmlldywgYXNzZXJ0Tm9EdXBsaWNhdGVEaXJlY3RpdmVzLCBhc3NlcnRUTm9kZUZvckxWaWV3LCBhc3NlcnRUTm9kZUZvclRWaWV3fSBmcm9tICcuLi9hc3NlcnQnO1xuaW1wb3J0IHthdHRhY2hQYXRjaERhdGF9IGZyb20gJy4uL2NvbnRleHRfZGlzY292ZXJ5JztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi4vZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7ZGlQdWJsaWNJbkluamVjdG9yLCBnZXROb2RlSW5qZWN0YWJsZSwgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge3Rocm93TXVsdGlwbGVDb21wb25lbnRFcnJvcn0gZnJvbSAnLi4vZXJyb3JzJztcbmltcG9ydCB7Q09OVEFJTkVSX0hFQURFUl9PRkZTRVQsIExDb250YWluZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7Q29tcG9uZW50RGVmLCBDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmLCBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5LCBIb3N0QmluZGluZ3NGdW5jdGlvbiwgSG9zdERpcmVjdGl2ZUJpbmRpbmdNYXAsIEhvc3REaXJlY3RpdmVEZWZzLCBQaXBlRGVmTGlzdE9yRmFjdG9yeSwgUmVuZGVyRmxhZ3MsIFZpZXdRdWVyaWVzRnVuY3Rpb259IGZyb20gJy4uL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge05vZGVJbmplY3RvckZhY3Rvcnl9IGZyb20gJy4uL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtnZXRVbmlxdWVMVmlld0lkfSBmcm9tICcuLi9pbnRlcmZhY2VzL2x2aWV3X3RyYWNraW5nJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBJbml0aWFsSW5wdXREYXRhLCBJbml0aWFsSW5wdXRzLCBMb2NhbFJlZkV4dHJhY3RvciwgUHJvcGVydHlBbGlhc2VzLCBQcm9wZXJ0eUFsaWFzVmFsdWUsIFRBdHRyaWJ1dGVzLCBUQ29uc3RhbnRzT3JGYWN0b3J5LCBUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVEljdUNvbnRhaW5lck5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGUsIFRQcm9qZWN0aW9uTm9kZX0gZnJvbSAnLi4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7UmVuZGVyZXJ9IGZyb20gJy4uL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtSQ29tbWVudCwgUkVsZW1lbnQsIFJOb2RlLCBSVGV4dH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9yZW5kZXJlcl9kb20nO1xuaW1wb3J0IHtTYW5pdGl6ZXJGbn0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zYW5pdGl6YXRpb24nO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZiwgaXNDb21wb25lbnRIb3N0LCBpc0NvbnRlbnRRdWVyeUhvc3R9IGZyb20gJy4uL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtDSElMRF9IRUFELCBDSElMRF9UQUlMLCBDTEVBTlVQLCBDT05URVhULCBERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgRU1CRURERURfVklFV19JTkpFQ1RPUiwgRU5WSVJPTk1FTlQsIEZMQUdTLCBIRUFERVJfT0ZGU0VULCBIT1NULCBIb3N0QmluZGluZ09wQ29kZXMsIEhZRFJBVElPTiwgSUQsIElOSkVDVE9SLCBMVmlldywgTFZpZXdFbnZpcm9ubWVudCwgTFZpZXdGbGFncywgTkVYVCwgUEFSRU5ULCBSRUFDVElWRV9IT1NUX0JJTkRJTkdfQ09OU1VNRVIsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSLCBSRU5ERVJFUiwgVF9IT1NULCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFB1cmVUTm9kZVR5cGUsIGFzc2VydFROb2RlVHlwZX0gZnJvbSAnLi4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtjbGVhckVsZW1lbnRDb250ZW50cywgdXBkYXRlVGV4dE5vZGV9IGZyb20gJy4uL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7aXNJbmxpbmVUZW1wbGF0ZSwgaXNOb2RlTWF0Y2hpbmdTZWxlY3Rvckxpc3R9IGZyb20gJy4uL25vZGVfc2VsZWN0b3JfbWF0Y2hlcic7XG5pbXBvcnQge3Byb2ZpbGVyLCBQcm9maWxlckV2ZW50fSBmcm9tICcuLi9wcm9maWxlcic7XG5pbXBvcnQge2NvbW1pdExWaWV3Q29uc3VtZXJJZkhhc1Byb2R1Y2VycywgZ2V0UmVhY3RpdmVMVmlld0NvbnN1bWVyfSBmcm9tICcuLi9yZWFjdGl2ZV9sdmlld19jb25zdW1lcic7XG5pbXBvcnQge2dldEJpbmRpbmdzRW5hYmxlZCwgZ2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBnZXRDdXJyZW50UGFyZW50VE5vZGUsIGdldEN1cnJlbnRUTm9kZVBsYWNlaG9sZGVyT2ssIGdldFNlbGVjdGVkSW5kZXgsIGlzQ3VycmVudFROb2RlUGFyZW50LCBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlLCBpc0luSTE4bkJsb2NrLCBpc0luU2tpcEh5ZHJhdGlvbkJsb2NrLCBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncywgc2V0Q3VycmVudERpcmVjdGl2ZUluZGV4LCBzZXRDdXJyZW50UXVlcnlJbmRleCwgc2V0Q3VycmVudFROb2RlLCBzZXRTZWxlY3RlZEluZGV4fSBmcm9tICcuLi9zdGF0ZSc7XG5pbXBvcnQge05PX0NIQU5HRX0gZnJvbSAnLi4vdG9rZW5zJztcbmltcG9ydCB7bWVyZ2VIb3N0QXR0cnN9IGZyb20gJy4uL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtJTlRFUlBPTEFUSU9OX0RFTElNSVRFUn0gZnJvbSAnLi4vdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeV91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudExWaWV3QnlJbmRleCwgZ2V0TmF0aXZlQnlJbmRleCwgZ2V0TmF0aXZlQnlUTm9kZSwgcmVzZXRQcmVPcmRlckhvb2tGbGFncywgdW53cmFwTFZpZXd9IGZyb20gJy4uL3V0aWwvdmlld191dGlscyc7XG5cbmltcG9ydCB7c2VsZWN0SW5kZXhJbnRlcm5hbH0gZnJvbSAnLi9hZHZhbmNlJztcbmltcG9ydCB7ybXJtWRpcmVjdGl2ZUluamVjdH0gZnJvbSAnLi9kaSc7XG5pbXBvcnQge2hhbmRsZVVua25vd25Qcm9wZXJ0eUVycm9yLCBpc1Byb3BlcnR5VmFsaWQsIG1hdGNoaW5nU2NoZW1hc30gZnJvbSAnLi9lbGVtZW50X3ZhbGlkYXRpb24nO1xuXG4vKipcbiAqIEludm9rZSBgSG9zdEJpbmRpbmdzRnVuY3Rpb25gcyBmb3Igdmlldy5cbiAqXG4gKiBUaGlzIG1ldGhvZHMgZXhlY3V0ZXMgYFRWaWV3Lmhvc3RCaW5kaW5nT3BDb2Rlc2AuIEl0IGlzIHVzZWQgdG8gZXhlY3V0ZSB0aGVcbiAqIGBIb3N0QmluZGluZ3NGdW5jdGlvbmBzIGFzc29jaWF0ZWQgd2l0aCB0aGUgY3VycmVudCBgTFZpZXdgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBDdXJyZW50IGBUVmlld2AuXG4gKiBAcGFyYW0gbFZpZXcgQ3VycmVudCBgTFZpZXdgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcHJvY2Vzc0hvc3RCaW5kaW5nT3BDb2Rlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldyk6IHZvaWQge1xuICBjb25zdCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gIGlmIChob3N0QmluZGluZ09wQ29kZXMgPT09IG51bGwpIHJldHVybjtcbiAgY29uc3QgY29uc3VtZXIgPSBnZXRSZWFjdGl2ZUxWaWV3Q29uc3VtZXIobFZpZXcsIFJFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUik7XG4gIHRyeSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBob3N0QmluZGluZ09wQ29kZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG9wQ29kZSA9IGhvc3RCaW5kaW5nT3BDb2Rlc1tpXSBhcyBudW1iZXI7XG4gICAgICBpZiAob3BDb2RlIDwgMCkge1xuICAgICAgICAvLyBOZWdhdGl2ZSBudW1iZXJzIGFyZSBlbGVtZW50IGluZGV4ZXMuXG4gICAgICAgIHNldFNlbGVjdGVkSW5kZXgofm9wQ29kZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBQb3NpdGl2ZSBudW1iZXJzIGFyZSBOdW1iZXJUdXBsZSB3aGljaCBzdG9yZSBiaW5kaW5nUm9vdEluZGV4IGFuZCBkaXJlY3RpdmVJbmRleC5cbiAgICAgICAgY29uc3QgZGlyZWN0aXZlSWR4ID0gb3BDb2RlO1xuICAgICAgICBjb25zdCBiaW5kaW5nUm9vdEluZHggPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBudW1iZXI7XG4gICAgICAgIGNvbnN0IGhvc3RCaW5kaW5nRm4gPSBob3N0QmluZGluZ09wQ29kZXNbKytpXSBhcyBIb3N0QmluZGluZ3NGdW5jdGlvbjxhbnk+O1xuICAgICAgICBzZXRCaW5kaW5nUm9vdEZvckhvc3RCaW5kaW5ncyhiaW5kaW5nUm9vdEluZHgsIGRpcmVjdGl2ZUlkeCk7XG4gICAgICAgIGNvbnN1bWVyLmRpcnR5ID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IHByZXZDb25zdW1lciA9IGNvbnN1bWVyQmVmb3JlQ29tcHV0YXRpb24oY29uc3VtZXIpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIGNvbnN0IGNvbnRleHQgPSBsVmlld1tkaXJlY3RpdmVJZHhdO1xuICAgICAgICAgIGhvc3RCaW5kaW5nRm4oUmVuZGVyRmxhZ3MuVXBkYXRlLCBjb250ZXh0KTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBjb25zdW1lckFmdGVyQ29tcHV0YXRpb24oY29uc3VtZXIsIHByZXZDb25zdW1lcik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGxWaWV3W1JFQUNUSVZFX0hPU1RfQklORElOR19DT05TVU1FUl0gPT09IG51bGwpIHtcbiAgICAgIGNvbW1pdExWaWV3Q29uc3VtZXJJZkhhc1Byb2R1Y2VycyhsVmlldywgUkVBQ1RJVkVfSE9TVF9CSU5ESU5HX0NPTlNVTUVSKTtcbiAgICB9XG4gICAgc2V0U2VsZWN0ZWRJbmRleCgtMSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUxWaWV3PFQ+KFxuICAgIHBhcmVudExWaWV3OiBMVmlld3xudWxsLCB0VmlldzogVFZpZXcsIGNvbnRleHQ6IFR8bnVsbCwgZmxhZ3M6IExWaWV3RmxhZ3MsIGhvc3Q6IFJFbGVtZW50fG51bGwsXG4gICAgdEhvc3ROb2RlOiBUTm9kZXxudWxsLCBlbnZpcm9ubWVudDogTFZpZXdFbnZpcm9ubWVudHxudWxsLCByZW5kZXJlcjogUmVuZGVyZXJ8bnVsbCxcbiAgICBpbmplY3RvcjogSW5qZWN0b3J8bnVsbCwgZW1iZWRkZWRWaWV3SW5qZWN0b3I6IEluamVjdG9yfG51bGwsXG4gICAgaHlkcmF0aW9uSW5mbzogRGVoeWRyYXRlZFZpZXd8bnVsbCk6IExWaWV3PFQ+IHtcbiAgY29uc3QgbFZpZXcgPSB0Vmlldy5ibHVlcHJpbnQuc2xpY2UoKSBhcyBMVmlldztcbiAgbFZpZXdbSE9TVF0gPSBob3N0O1xuICBsVmlld1tGTEFHU10gPSBmbGFncyB8IExWaWV3RmxhZ3MuQ3JlYXRpb25Nb2RlIHwgTFZpZXdGbGFncy5BdHRhY2hlZCB8IExWaWV3RmxhZ3MuRmlyc3RMVmlld1Bhc3M7XG4gIGlmIChlbWJlZGRlZFZpZXdJbmplY3RvciAhPT0gbnVsbCB8fFxuICAgICAgKHBhcmVudExWaWV3ICYmIChwYXJlbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0VtYmVkZGVkVmlld0luamVjdG9yKSkpIHtcbiAgICBsVmlld1tGTEFHU10gfD0gTFZpZXdGbGFncy5IYXNFbWJlZGRlZFZpZXdJbmplY3RvcjtcbiAgfVxuICByZXNldFByZU9yZGVySG9va0ZsYWdzKGxWaWV3KTtcbiAgbmdEZXZNb2RlICYmIHRWaWV3LmRlY2xUTm9kZSAmJiBwYXJlbnRMVmlldyAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHRWaWV3LmRlY2xUTm9kZSwgcGFyZW50TFZpZXcpO1xuICBsVmlld1tQQVJFTlRdID0gbFZpZXdbREVDTEFSQVRJT05fVklFV10gPSBwYXJlbnRMVmlldztcbiAgbFZpZXdbQ09OVEVYVF0gPSBjb250ZXh0O1xuICBsVmlld1tFTlZJUk9OTUVOVF0gPSAoZW52aXJvbm1lbnQgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbRU5WSVJPTk1FTlRdKSE7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGxWaWV3W0VOVklST05NRU5UXSwgJ0xWaWV3RW52aXJvbm1lbnQgaXMgcmVxdWlyZWQnKTtcbiAgbFZpZXdbUkVOREVSRVJdID0gKHJlbmRlcmVyIHx8IHBhcmVudExWaWV3ICYmIHBhcmVudExWaWV3W1JFTkRFUkVSXSkhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChsVmlld1tSRU5ERVJFUl0sICdSZW5kZXJlciBpcyByZXF1aXJlZCcpO1xuICBsVmlld1tJTkpFQ1RPUiBhcyBhbnldID0gaW5qZWN0b3IgfHwgcGFyZW50TFZpZXcgJiYgcGFyZW50TFZpZXdbSU5KRUNUT1JdIHx8IG51bGw7XG4gIGxWaWV3W1RfSE9TVF0gPSB0SG9zdE5vZGU7XG4gIGxWaWV3W0lEXSA9IGdldFVuaXF1ZUxWaWV3SWQoKTtcbiAgbFZpZXdbSFlEUkFUSU9OXSA9IGh5ZHJhdGlvbkluZm87XG4gIGxWaWV3W0VNQkVEREVEX1ZJRVdfSU5KRUNUT1IgYXMgYW55XSA9IGVtYmVkZGVkVmlld0luamVjdG9yO1xuXG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyAhPT0gbnVsbCA6IHRydWUsIHRydWUsXG4gICAgICAgICAgJ0VtYmVkZGVkIHZpZXdzIG11c3QgaGF2ZSBwYXJlbnRMVmlldycpO1xuICBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV10gPVxuICAgICAgdFZpZXcudHlwZSA9PSBUVmlld1R5cGUuRW1iZWRkZWQgPyBwYXJlbnRMVmlldyFbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddIDogbFZpZXc7XG4gIHJldHVybiBsVmlldyBhcyBMVmlldzxUPjtcbn1cblxuLyoqXG4gKiBDcmVhdGUgYW5kIHN0b3JlcyB0aGUgVE5vZGUsIGFuZCBob29rcyBpdCB1cCB0byB0aGUgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgYFRWaWV3YC5cbiAqIEBwYXJhbSBpbmRleCBUaGUgaW5kZXggYXQgd2hpY2ggdGhlIFROb2RlIHNob3VsZCBiZSBzYXZlZCAobnVsbCBpZiB2aWV3LCBzaW5jZSB0aGV5IGFyZSBub3RcbiAqIHNhdmVkKS5cbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIFROb2RlIHRvIGNyZWF0ZVxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGVsZW1lbnQgZm9yIHRoaXMgbm9kZSwgaWYgYXBwbGljYWJsZVxuICogQHBhcmFtIG5hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBhc3NvY2lhdGVkIG5hdGl2ZSBlbGVtZW50LCBpZiBhcHBsaWNhYmxlXG4gKiBAcGFyYW0gYXR0cnMgQW55IGF0dHJzIGZvciB0aGUgbmF0aXZlIGVsZW1lbnQsIGlmIGFwcGxpY2FibGVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudHxUTm9kZVR5cGUuVGV4dCwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsIG5hbWU6IHN0cmluZ3xudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLCBuYW1lOiBudWxsLFxuICAgIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVFByb2plY3Rpb25Ob2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0eXBlOiBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lciwgbmFtZTogc3RyaW5nfG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZS5JY3UsIG5hbWU6IG51bGwsXG4gICAgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBURWxlbWVudENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHR5cGU6IFROb2RlVHlwZSwgbmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTpcbiAgICBURWxlbWVudE5vZGUmVENvbnRhaW5lck5vZGUmVEVsZW1lbnRDb250YWluZXJOb2RlJlRQcm9qZWN0aW9uTm9kZSZUSWN1Q29udGFpbmVyTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIC8vIEtlZXAgdGhpcyBmdW5jdGlvbiBzaG9ydCwgc28gdGhhdCB0aGUgVk0gd2lsbCBpbmxpbmUgaXQuXG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQdXJlVE5vZGVUeXBlKHR5cGUpO1xuICBsZXQgdE5vZGUgPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBUTm9kZTtcbiAgaWYgKHROb2RlID09PSBudWxsKSB7XG4gICAgdE5vZGUgPSBjcmVhdGVUTm9kZUF0SW5kZXgodFZpZXcsIGluZGV4LCB0eXBlLCBuYW1lLCBhdHRycyk7XG4gICAgaWYgKGlzSW5JMThuQmxvY2soKSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGluIGkxOG4gYmxvY2sgdGhlbiBhbGwgZWxlbWVudHMgc2hvdWxkIGJlIHByZSBkZWNsYXJlZCB0aHJvdWdoIGBQbGFjZWhvbGRlcmBcbiAgICAgIC8vIFNlZSBgVE5vZGVUeXBlLlBsYWNlaG9sZGVyYCBhbmQgYExGcmFtZS5pbkkxOG5gIGZvciBtb3JlIGNvbnRleHQuXG4gICAgICAvLyBJZiB0aGUgYFROb2RlYCB3YXMgbm90IHByZS1kZWNsYXJlZCB0aGFuIGl0IG1lYW5zIGl0IHdhcyBub3QgbWVudGlvbmVkIHdoaWNoIG1lYW5zIGl0IHdhc1xuICAgICAgLy8gcmVtb3ZlZCwgc28gd2UgbWFyayBpdCBhcyBkZXRhY2hlZC5cbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEZXRhY2hlZDtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSAmIFROb2RlVHlwZS5QbGFjZWhvbGRlcikge1xuICAgIHROb2RlLnR5cGUgPSB0eXBlO1xuICAgIHROb2RlLnZhbHVlID0gbmFtZTtcbiAgICB0Tm9kZS5hdHRycyA9IGF0dHJzO1xuICAgIGNvbnN0IHBhcmVudCA9IGdldEN1cnJlbnRQYXJlbnRUTm9kZSgpO1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBwYXJlbnQgPT09IG51bGwgPyAtMSA6IHBhcmVudC5pbmplY3RvckluZGV4O1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZUZvclRWaWV3KHROb2RlLCB0Vmlldyk7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKGluZGV4LCB0Tm9kZS5pbmRleCwgJ0V4cGVjdGluZyBzYW1lIGluZGV4Jyk7XG4gIH1cbiAgc2V0Q3VycmVudFROb2RlKHROb2RlLCB0cnVlKTtcbiAgcmV0dXJuIHROb2RlIGFzIFRFbGVtZW50Tm9kZSAmIFRDb250YWluZXJOb2RlICYgVEVsZW1lbnRDb250YWluZXJOb2RlICYgVFByb2plY3Rpb25Ob2RlICZcbiAgICAgIFRJY3VDb250YWluZXJOb2RlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGVBdEluZGV4KFxuICAgIHRWaWV3OiBUVmlldywgaW5kZXg6IG51bWJlciwgdHlwZTogVE5vZGVUeXBlLCBuYW1lOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpIHtcbiAgY29uc3QgY3VycmVudFROb2RlID0gZ2V0Q3VycmVudFROb2RlUGxhY2Vob2xkZXJPaygpO1xuICBjb25zdCBpc1BhcmVudCA9IGlzQ3VycmVudFROb2RlUGFyZW50KCk7XG4gIGNvbnN0IHBhcmVudCA9IGlzUGFyZW50ID8gY3VycmVudFROb2RlIDogY3VycmVudFROb2RlICYmIGN1cnJlbnRUTm9kZS5wYXJlbnQ7XG4gIC8vIFBhcmVudHMgY2Fubm90IGNyb3NzIGNvbXBvbmVudCBib3VuZGFyaWVzIGJlY2F1c2UgY29tcG9uZW50cyB3aWxsIGJlIHVzZWQgaW4gbXVsdGlwbGUgcGxhY2VzLlxuICBjb25zdCB0Tm9kZSA9IHRWaWV3LmRhdGFbaW5kZXhdID1cbiAgICAgIGNyZWF0ZVROb2RlKHRWaWV3LCBwYXJlbnQgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUsIHR5cGUsIGluZGV4LCBuYW1lLCBhdHRycyk7XG4gIC8vIEFzc2lnbiBhIHBvaW50ZXIgdG8gdGhlIGZpcnN0IGNoaWxkIG5vZGUgb2YgYSBnaXZlbiB2aWV3LiBUaGUgZmlyc3Qgbm9kZSBpcyBub3QgYWx3YXlzIHRoZSBvbmVcbiAgLy8gYXQgaW5kZXggMCwgaW4gY2FzZSBvZiBpMThuLCBpbmRleCAwIGNhbiBiZSB0aGUgaW5zdHJ1Y3Rpb24gYGkxOG5TdGFydGAgYW5kIHRoZSBmaXJzdCBub2RlIGhhc1xuICAvLyB0aGUgaW5kZXggMSBvciBtb3JlLCBzbyB3ZSBjYW4ndCBqdXN0IGNoZWNrIG5vZGUgaW5kZXguXG4gIGlmICh0Vmlldy5maXJzdENoaWxkID09PSBudWxsKSB7XG4gICAgdFZpZXcuZmlyc3RDaGlsZCA9IHROb2RlO1xuICB9XG4gIGlmIChjdXJyZW50VE5vZGUgIT09IG51bGwpIHtcbiAgICBpZiAoaXNQYXJlbnQpIHtcbiAgICAgIC8vIEZJWE1FKG1pc2tvKTogVGhpcyBsb2dpYyBsb29rcyB1bm5lY2Vzc2FyaWx5IGNvbXBsaWNhdGVkLiBDb3VsZCB3ZSBzaW1wbGlmeT9cbiAgICAgIGlmIChjdXJyZW50VE5vZGUuY2hpbGQgPT0gbnVsbCAmJiB0Tm9kZS5wYXJlbnQgIT09IG51bGwpIHtcbiAgICAgICAgLy8gV2UgYXJlIGluIHRoZSBzYW1lIHZpZXcsIHdoaWNoIG1lYW5zIHdlIGFyZSBhZGRpbmcgY29udGVudCBub2RlIHRvIHRoZSBwYXJlbnQgdmlldy5cbiAgICAgICAgY3VycmVudFROb2RlLmNoaWxkID0gdE5vZGU7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChjdXJyZW50VE5vZGUubmV4dCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiB0aGUgY2FzZSBvZiBpMThuIHRoZSBgY3VycmVudFROb2RlYCBtYXkgYWxyZWFkeSBiZSBsaW5rZWQsIGluIHdoaWNoIGNhc2Ugd2UgZG9uJ3Qgd2FudFxuICAgICAgICAvLyB0byBicmVhayB0aGUgbGlua3Mgd2hpY2ggaTE4biBjcmVhdGVkLlxuICAgICAgICBjdXJyZW50VE5vZGUubmV4dCA9IHROb2RlO1xuICAgICAgICB0Tm9kZS5wcmV2ID0gY3VycmVudFROb2RlO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogV2hlbiBlbGVtZW50cyBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSBhZnRlciBhIHZpZXcgYmx1ZXByaW50IGlzIGNyZWF0ZWQgKGUuZy4gdGhyb3VnaFxuICogaTE4bkFwcGx5KCkpLCB3ZSBuZWVkIHRvIGFkanVzdCB0aGUgYmx1ZXByaW50IGZvciBmdXR1cmVcbiAqIHRlbXBsYXRlIHBhc3Nlcy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCBhc3NvY2lhdGVkIHdpdGggYExWaWV3YFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIGNvbnRhaW5pbmcgdGhlIGJsdWVwcmludCB0byBhZGp1c3RcbiAqIEBwYXJhbSBudW1TbG90c1RvQWxsb2MgVGhlIG51bWJlciBvZiBzbG90cyB0byBhbGxvYyBpbiB0aGUgTFZpZXcsIHNob3VsZCBiZSA+MFxuICogQHBhcmFtIGluaXRpYWxWYWx1ZSBJbml0aWFsIHZhbHVlIHRvIHN0b3JlIGluIGJsdWVwcmludFxuICovXG5leHBvcnQgZnVuY3Rpb24gYWxsb2NFeHBhbmRvKFxuICAgIHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3LCBudW1TbG90c1RvQWxsb2M6IG51bWJlciwgaW5pdGlhbFZhbHVlOiBhbnkpOiBudW1iZXIge1xuICBpZiAobnVtU2xvdHNUb0FsbG9jID09PSAwKSByZXR1cm4gLTE7XG4gIGlmIChuZ0Rldk1vZGUpIHtcbiAgICBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICAgIGFzc2VydFNhbWUodFZpZXcsIGxWaWV3W1RWSUVXXSwgJ2BMVmlld2AgbXVzdCBiZSBhc3NvY2lhdGVkIHdpdGggYFRWaWV3YCEnKTtcbiAgICBhc3NlcnRFcXVhbCh0Vmlldy5kYXRhLmxlbmd0aCwgbFZpZXcubGVuZ3RoLCAnRXhwZWN0aW5nIExWaWV3IHRvIGJlIHNhbWUgc2l6ZSBhcyBUVmlldycpO1xuICAgIGFzc2VydEVxdWFsKFxuICAgICAgICB0Vmlldy5kYXRhLmxlbmd0aCwgdFZpZXcuYmx1ZXByaW50Lmxlbmd0aCwgJ0V4cGVjdGluZyBCbHVlcHJpbnQgdG8gYmUgc2FtZSBzaXplIGFzIFRWaWV3Jyk7XG4gICAgYXNzZXJ0Rmlyc3RVcGRhdGVQYXNzKHRWaWV3KTtcbiAgfVxuICBjb25zdCBhbGxvY0lkeCA9IGxWaWV3Lmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW1TbG90c1RvQWxsb2M7IGkrKykge1xuICAgIGxWaWV3LnB1c2goaW5pdGlhbFZhbHVlKTtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChpbml0aWFsVmFsdWUpO1xuICAgIHRWaWV3LmRhdGEucHVzaChudWxsKTtcbiAgfVxuICByZXR1cm4gYWxsb2NJZHg7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlVGVtcGxhdGU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXc8VD4sIHRlbXBsYXRlRm46IENvbXBvbmVudFRlbXBsYXRlPFQ+LCByZjogUmVuZGVyRmxhZ3MsIGNvbnRleHQ6IFQpIHtcbiAgY29uc3QgY29uc3VtZXIgPSBnZXRSZWFjdGl2ZUxWaWV3Q29uc3VtZXIobFZpZXcsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSKTtcbiAgY29uc3QgcHJldlNlbGVjdGVkSW5kZXggPSBnZXRTZWxlY3RlZEluZGV4KCk7XG4gIGNvbnN0IGlzVXBkYXRlUGhhc2UgPSByZiAmIFJlbmRlckZsYWdzLlVwZGF0ZTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KC0xKTtcbiAgICBpZiAoaXNVcGRhdGVQaGFzZSAmJiBsVmlldy5sZW5ndGggPiBIRUFERVJfT0ZGU0VUKSB7XG4gICAgICAvLyBXaGVuIHdlJ3JlIHVwZGF0aW5nLCBpbmhlcmVudGx5IHNlbGVjdCAwIHNvIHdlIGRvbid0XG4gICAgICAvLyBoYXZlIHRvIGdlbmVyYXRlIHRoYXQgaW5zdHJ1Y3Rpb24gZm9yIG1vc3QgdXBkYXRlIGJsb2Nrcy5cbiAgICAgIHNlbGVjdEluZGV4SW50ZXJuYWwodFZpZXcsIGxWaWV3LCBIRUFERVJfT0ZGU0VULCAhIW5nRGV2TW9kZSAmJiBpc0luQ2hlY2tOb0NoYW5nZXNNb2RlKCkpO1xuICAgIH1cblxuICAgIGNvbnN0IHByZUhvb2tUeXBlID1cbiAgICAgICAgaXNVcGRhdGVQaGFzZSA/IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVVcGRhdGVTdGFydCA6IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVDcmVhdGVTdGFydDtcbiAgICBwcm9maWxlcihwcmVIb29rVHlwZSwgY29udGV4dCBhcyB1bmtub3duIGFzIHt9KTtcbiAgICBjb25zdCBlZmZlY3RpdmVDb25zdW1lciA9IGlzVXBkYXRlUGhhc2UgPyBjb25zdW1lciA6IG51bGw7XG4gICAgY29uc3QgcHJldkNvbnN1bWVyID0gY29uc3VtZXJCZWZvcmVDb21wdXRhdGlvbihlZmZlY3RpdmVDb25zdW1lcik7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChlZmZlY3RpdmVDb25zdW1lciAhPT0gbnVsbCkge1xuICAgICAgICBlZmZlY3RpdmVDb25zdW1lci5kaXJ0eSA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgdGVtcGxhdGVGbihyZiwgY29udGV4dCk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGNvbnN1bWVyQWZ0ZXJDb21wdXRhdGlvbihlZmZlY3RpdmVDb25zdW1lciwgcHJldkNvbnN1bWVyKTtcbiAgICB9XG4gIH0gZmluYWxseSB7XG4gICAgaWYgKGlzVXBkYXRlUGhhc2UgJiYgbFZpZXdbUkVBQ1RJVkVfVEVNUExBVEVfQ09OU1VNRVJdID09PSBudWxsKSB7XG4gICAgICBjb21taXRMVmlld0NvbnN1bWVySWZIYXNQcm9kdWNlcnMobFZpZXcsIFJFQUNUSVZFX1RFTVBMQVRFX0NPTlNVTUVSKTtcbiAgICB9XG4gICAgc2V0U2VsZWN0ZWRJbmRleChwcmV2U2VsZWN0ZWRJbmRleCk7XG5cbiAgICBjb25zdCBwb3N0SG9va1R5cGUgPVxuICAgICAgICBpc1VwZGF0ZVBoYXNlID8gUHJvZmlsZXJFdmVudC5UZW1wbGF0ZVVwZGF0ZUVuZCA6IFByb2ZpbGVyRXZlbnQuVGVtcGxhdGVDcmVhdGVFbmQ7XG4gICAgcHJvZmlsZXIocG9zdEhvb2tUeXBlLCBjb250ZXh0IGFzIHVua25vd24gYXMge30pO1xuICB9XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4vLy8vIEVsZW1lbnRcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbmV4cG9ydCBmdW5jdGlvbiBleGVjdXRlQ29udGVudFF1ZXJpZXModFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldykge1xuICBpZiAoaXNDb250ZW50UXVlcnlIb3N0KHROb2RlKSkge1xuICAgIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICAgICAgY29uc3QgZW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICAgICAgZm9yIChsZXQgZGlyZWN0aXZlSW5kZXggPSBzdGFydDsgZGlyZWN0aXZlSW5kZXggPCBlbmQ7IGRpcmVjdGl2ZUluZGV4KyspIHtcbiAgICAgICAgY29uc3QgZGVmID0gdFZpZXcuZGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgIGlmIChkZWYuY29udGVudFF1ZXJpZXMpIHtcbiAgICAgICAgICBkZWYuY29udGVudFF1ZXJpZXMoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBsVmlld1tkaXJlY3RpdmVJbmRleF0sIGRpcmVjdGl2ZUluZGV4KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlc0luc3RhbmNlcyh0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSkge1xuICBpZiAoIWdldEJpbmRpbmdzRW5hYmxlZCgpKSByZXR1cm47XG4gIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykpO1xuICBpZiAoKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5oYXNIb3N0QmluZGluZ3MpID09PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncykge1xuICAgIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXcsIGxWaWV3LCB0Tm9kZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBUYWtlcyBhIGxpc3Qgb2YgbG9jYWwgbmFtZXMgYW5kIGluZGljZXMgYW5kIHB1c2hlcyB0aGUgcmVzb2x2ZWQgbG9jYWwgdmFyaWFibGUgdmFsdWVzXG4gKiB0byBMVmlldyBpbiB0aGUgc2FtZSBvcmRlciBhcyB0aGV5IGFyZSBsb2FkZWQgaW4gdGhlIHRlbXBsYXRlIHdpdGggbG9hZCgpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2F2ZVJlc29sdmVkTG9jYWxzSW5EYXRhKFxuICAgIHZpZXdEYXRhOiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSxcbiAgICBsb2NhbFJlZkV4dHJhY3RvcjogTG9jYWxSZWZFeHRyYWN0b3IgPSBnZXROYXRpdmVCeVROb2RlKTogdm9pZCB7XG4gIGNvbnN0IGxvY2FsTmFtZXMgPSB0Tm9kZS5sb2NhbE5hbWVzO1xuICBpZiAobG9jYWxOYW1lcyAhPT0gbnVsbCkge1xuICAgIGxldCBsb2NhbEluZGV4ID0gdE5vZGUuaW5kZXggKyAxO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbG9jYWxOYW1lcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgaW5kZXggPSBsb2NhbE5hbWVzW2kgKyAxXSBhcyBudW1iZXI7XG4gICAgICBjb25zdCB2YWx1ZSA9IGluZGV4ID09PSAtMSA/XG4gICAgICAgICAgbG9jYWxSZWZFeHRyYWN0b3IoXG4gICAgICAgICAgICAgIHROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCB2aWV3RGF0YSkgOlxuICAgICAgICAgIHZpZXdEYXRhW2luZGV4XTtcbiAgICAgIHZpZXdEYXRhW2xvY2FsSW5kZXgrK10gPSB2YWx1ZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBHZXRzIFRWaWV3IGZyb20gYSB0ZW1wbGF0ZSBmdW5jdGlvbiBvciBjcmVhdGVzIGEgbmV3IFRWaWV3XG4gKiBpZiBpdCBkb2Vzbid0IGFscmVhZHkgZXhpc3QuXG4gKlxuICogQHBhcmFtIGRlZiBDb21wb25lbnREZWZcbiAqIEByZXR1cm5zIFRWaWV3XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KGRlZjogQ29tcG9uZW50RGVmPGFueT4pOiBUVmlldyB7XG4gIGNvbnN0IHRWaWV3ID0gZGVmLnRWaWV3O1xuXG4gIC8vIENyZWF0ZSBhIFRWaWV3IGlmIHRoZXJlIGlzbid0IG9uZSwgb3IgcmVjcmVhdGUgaXQgaWYgdGhlIGZpcnN0IGNyZWF0ZSBwYXNzIGRpZG4ndFxuICAvLyBjb21wbGV0ZSBzdWNjZXNzZnVsbHkgc2luY2Ugd2UgY2FuJ3Qga25vdyBmb3Igc3VyZSB3aGV0aGVyIGl0J3MgaW4gYSB1c2FibGUgc2hhcGUuXG4gIGlmICh0VmlldyA9PT0gbnVsbCB8fCB0Vmlldy5pbmNvbXBsZXRlRmlyc3RQYXNzKSB7XG4gICAgLy8gRGVjbGFyYXRpb24gbm9kZSBoZXJlIGlzIG51bGwgc2luY2UgdGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBkeW5hbWljYWxseSBjcmVhdGUgYVxuICAgIC8vIGNvbXBvbmVudCBhbmQgaGVuY2UgdGhlcmUgaXMgbm8gZGVjbGFyYXRpb24uXG4gICAgY29uc3QgZGVjbFROb2RlID0gbnVsbDtcbiAgICByZXR1cm4gZGVmLnRWaWV3ID0gY3JlYXRlVFZpZXcoXG4gICAgICAgICAgICAgICBUVmlld1R5cGUuQ29tcG9uZW50LCBkZWNsVE5vZGUsIGRlZi50ZW1wbGF0ZSwgZGVmLmRlY2xzLCBkZWYudmFycywgZGVmLmRpcmVjdGl2ZURlZnMsXG4gICAgICAgICAgICAgICBkZWYucGlwZURlZnMsIGRlZi52aWV3UXVlcnksIGRlZi5zY2hlbWFzLCBkZWYuY29uc3RzLCBkZWYuaWQpO1xuICB9XG5cbiAgcmV0dXJuIHRWaWV3O1xufVxuXG5cbi8qKlxuICogQ3JlYXRlcyBhIFRWaWV3IGluc3RhbmNlXG4gKlxuICogQHBhcmFtIHR5cGUgVHlwZSBvZiBgVFZpZXdgLlxuICogQHBhcmFtIGRlY2xUTm9kZSBEZWNsYXJhdGlvbiBsb2NhdGlvbiBvZiB0aGlzIGBUVmlld2AuXG4gKiBAcGFyYW0gdGVtcGxhdGVGbiBUZW1wbGF0ZSBmdW5jdGlvblxuICogQHBhcmFtIGRlY2xzIFRoZSBudW1iZXIgb2Ygbm9kZXMsIGxvY2FsIHJlZnMsIGFuZCBwaXBlcyBpbiB0aGlzIHRlbXBsYXRlXG4gKiBAcGFyYW0gZGlyZWN0aXZlcyBSZWdpc3RyeSBvZiBkaXJlY3RpdmVzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBwaXBlcyBSZWdpc3RyeSBvZiBwaXBlcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gdmlld1F1ZXJ5IFZpZXcgcXVlcmllcyBmb3IgdGhpcyB2aWV3XG4gKiBAcGFyYW0gc2NoZW1hcyBTY2hlbWFzIGZvciB0aGlzIHZpZXdcbiAqIEBwYXJhbSBjb25zdHMgQ29uc3RhbnRzIGZvciB0aGlzIHZpZXdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRWaWV3KFxuICAgIHR5cGU6IFRWaWV3VHlwZSwgZGVjbFROb2RlOiBUTm9kZXxudWxsLCB0ZW1wbGF0ZUZuOiBDb21wb25lbnRUZW1wbGF0ZTxhbnk+fG51bGwsIGRlY2xzOiBudW1iZXIsXG4gICAgdmFyczogbnVtYmVyLCBkaXJlY3RpdmVzOiBEaXJlY3RpdmVEZWZMaXN0T3JGYWN0b3J5fG51bGwsIHBpcGVzOiBQaXBlRGVmTGlzdE9yRmFjdG9yeXxudWxsLFxuICAgIHZpZXdRdWVyeTogVmlld1F1ZXJpZXNGdW5jdGlvbjxhbnk+fG51bGwsIHNjaGVtYXM6IFNjaGVtYU1ldGFkYXRhW118bnVsbCxcbiAgICBjb25zdHNPckZhY3Rvcnk6IFRDb25zdGFudHNPckZhY3Rvcnl8bnVsbCwgc3NySWQ6IHN0cmluZ3xudWxsKTogVFZpZXcge1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnRWaWV3Kys7XG4gIGNvbnN0IGJpbmRpbmdTdGFydEluZGV4ID0gSEVBREVSX09GRlNFVCArIGRlY2xzO1xuICAvLyBUaGlzIGxlbmd0aCBkb2VzIG5vdCB5ZXQgY29udGFpbiBob3N0IGJpbmRpbmdzIGZyb20gY2hpbGQgZGlyZWN0aXZlcyBiZWNhdXNlIGF0IHRoaXMgcG9pbnQsXG4gIC8vIHdlIGRvbid0IGtub3cgd2hpY2ggZGlyZWN0aXZlcyBhcmUgYWN0aXZlIG9uIHRoaXMgdGVtcGxhdGUuIEFzIHNvb24gYXMgYSBkaXJlY3RpdmUgaXMgbWF0Y2hlZFxuICAvLyB0aGF0IGhhcyBhIGhvc3QgYmluZGluZywgd2Ugd2lsbCB1cGRhdGUgdGhlIGJsdWVwcmludCB3aXRoIHRoYXQgZGVmJ3MgaG9zdFZhcnMgY291bnQuXG4gIGNvbnN0IGluaXRpYWxWaWV3TGVuZ3RoID0gYmluZGluZ1N0YXJ0SW5kZXggKyB2YXJzO1xuICBjb25zdCBibHVlcHJpbnQgPSBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4LCBpbml0aWFsVmlld0xlbmd0aCk7XG4gIGNvbnN0IGNvbnN0cyA9IHR5cGVvZiBjb25zdHNPckZhY3RvcnkgPT09ICdmdW5jdGlvbicgPyBjb25zdHNPckZhY3RvcnkoKSA6IGNvbnN0c09yRmFjdG9yeTtcbiAgY29uc3QgdFZpZXcgPSBibHVlcHJpbnRbVFZJRVcgYXMgYW55XSA9IHtcbiAgICB0eXBlOiB0eXBlLFxuICAgIGJsdWVwcmludDogYmx1ZXByaW50LFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZUZuLFxuICAgIHF1ZXJpZXM6IG51bGwsXG4gICAgdmlld1F1ZXJ5OiB2aWV3UXVlcnksXG4gICAgZGVjbFROb2RlOiBkZWNsVE5vZGUsXG4gICAgZGF0YTogYmx1ZXByaW50LnNsaWNlKCkuZmlsbChudWxsLCBiaW5kaW5nU3RhcnRJbmRleCksXG4gICAgYmluZGluZ1N0YXJ0SW5kZXg6IGJpbmRpbmdTdGFydEluZGV4LFxuICAgIGV4cGFuZG9TdGFydEluZGV4OiBpbml0aWFsVmlld0xlbmd0aCxcbiAgICBob3N0QmluZGluZ09wQ29kZXM6IG51bGwsXG4gICAgZmlyc3RDcmVhdGVQYXNzOiB0cnVlLFxuICAgIGZpcnN0VXBkYXRlUGFzczogdHJ1ZSxcbiAgICBzdGF0aWNWaWV3UXVlcmllczogZmFsc2UsXG4gICAgc3RhdGljQ29udGVudFF1ZXJpZXM6IGZhbHNlLFxuICAgIHByZU9yZGVySG9va3M6IG51bGwsXG4gICAgcHJlT3JkZXJDaGVja0hvb2tzOiBudWxsLFxuICAgIGNvbnRlbnRIb29rczogbnVsbCxcbiAgICBjb250ZW50Q2hlY2tIb29rczogbnVsbCxcbiAgICB2aWV3SG9va3M6IG51bGwsXG4gICAgdmlld0NoZWNrSG9va3M6IG51bGwsXG4gICAgZGVzdHJveUhvb2tzOiBudWxsLFxuICAgIGNsZWFudXA6IG51bGwsXG4gICAgY29udGVudFF1ZXJpZXM6IG51bGwsXG4gICAgY29tcG9uZW50czogbnVsbCxcbiAgICBkaXJlY3RpdmVSZWdpc3RyeTogdHlwZW9mIGRpcmVjdGl2ZXMgPT09ICdmdW5jdGlvbicgPyBkaXJlY3RpdmVzKCkgOiBkaXJlY3RpdmVzLFxuICAgIHBpcGVSZWdpc3RyeTogdHlwZW9mIHBpcGVzID09PSAnZnVuY3Rpb24nID8gcGlwZXMoKSA6IHBpcGVzLFxuICAgIGZpcnN0Q2hpbGQ6IG51bGwsXG4gICAgc2NoZW1hczogc2NoZW1hcyxcbiAgICBjb25zdHM6IGNvbnN0cyxcbiAgICBpbmNvbXBsZXRlRmlyc3RQYXNzOiBmYWxzZSxcbiAgICBzc3JJZCxcbiAgfTtcbiAgaWYgKG5nRGV2TW9kZSkge1xuICAgIC8vIEZvciBwZXJmb3JtYW5jZSByZWFzb25zIGl0IGlzIGltcG9ydGFudCB0aGF0IHRoZSB0VmlldyByZXRhaW5zIHRoZSBzYW1lIHNoYXBlIGR1cmluZyBydW50aW1lLlxuICAgIC8vIChUbyBtYWtlIHN1cmUgdGhhdCBhbGwgb2YgdGhlIGNvZGUgaXMgbW9ub21vcnBoaWMuKSBGb3IgdGhpcyByZWFzb24gd2Ugc2VhbCB0aGUgb2JqZWN0IHRvXG4gICAgLy8gcHJldmVudCBjbGFzcyB0cmFuc2l0aW9ucy5cbiAgICBPYmplY3Quc2VhbCh0Vmlldyk7XG4gIH1cbiAgcmV0dXJuIHRWaWV3O1xufVxuXG5mdW5jdGlvbiBjcmVhdGVWaWV3Qmx1ZXByaW50KGJpbmRpbmdTdGFydEluZGV4OiBudW1iZXIsIGluaXRpYWxWaWV3TGVuZ3RoOiBudW1iZXIpOiBMVmlldyB7XG4gIGNvbnN0IGJsdWVwcmludCA9IFtdO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgaW5pdGlhbFZpZXdMZW5ndGg7IGkrKykge1xuICAgIGJsdWVwcmludC5wdXNoKGkgPCBiaW5kaW5nU3RhcnRJbmRleCA/IG51bGwgOiBOT19DSEFOR0UpO1xuICB9XG5cbiAgcmV0dXJuIGJsdWVwcmludCBhcyBMVmlldztcbn1cblxuLyoqXG4gKiBMb2NhdGVzIHRoZSBob3N0IG5hdGl2ZSBlbGVtZW50LCB1c2VkIGZvciBib290c3RyYXBwaW5nIGV4aXN0aW5nIG5vZGVzIGludG8gcmVuZGVyaW5nIHBpcGVsaW5lLlxuICpcbiAqIEBwYXJhbSByZW5kZXJlciB0aGUgcmVuZGVyZXIgdXNlZCB0byBsb2NhdGUgdGhlIGVsZW1lbnQuXG4gKiBAcGFyYW0gZWxlbWVudE9yU2VsZWN0b3IgUmVuZGVyIGVsZW1lbnQgb3IgQ1NTIHNlbGVjdG9yIHRvIGxvY2F0ZSB0aGUgZWxlbWVudC5cbiAqIEBwYXJhbSBlbmNhcHN1bGF0aW9uIFZpZXcgRW5jYXBzdWxhdGlvbiBkZWZpbmVkIGZvciBjb21wb25lbnQgdGhhdCByZXF1ZXN0cyBob3N0IGVsZW1lbnQuXG4gKiBAcGFyYW0gaW5qZWN0b3IgUm9vdCB2aWV3IGluamVjdG9yIGluc3RhbmNlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlSG9zdEVsZW1lbnQoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50T3JTZWxlY3RvcjogUkVsZW1lbnR8c3RyaW5nLCBlbmNhcHN1bGF0aW9uOiBWaWV3RW5jYXBzdWxhdGlvbixcbiAgICBpbmplY3RvcjogSW5qZWN0b3IpOiBSRWxlbWVudCB7XG4gIC8vIE5vdGU6IHdlIHVzZSBkZWZhdWx0IHZhbHVlIGZvciB0aGUgYFBSRVNFUlZFX0hPU1RfQ09OVEVOVGAgaGVyZSBldmVuIHRob3VnaCBpdCdzIGFcbiAgLy8gdHJlZS1zaGFrYWJsZSBvbmUgKHByb3ZpZGVkSW46J3Jvb3QnKS4gVGhpcyBjb2RlIHBhdGggY2FuIGJlIHRyaWdnZXJlZCBkdXJpbmcgZHluYW1pY1xuICAvLyBjb21wb25lbnQgY3JlYXRpb24gKGFmdGVyIGNhbGxpbmcgVmlld0NvbnRhaW5lclJlZi5jcmVhdGVDb21wb25lbnQpIHdoZW4gYW4gaW5qZWN0b3JcbiAgLy8gaW5zdGFuY2UgY2FuIGJlIHByb3ZpZGVkLiBUaGUgaW5qZWN0b3IgaW5zdGFuY2UgbWlnaHQgYmUgZGlzY29ubmVjdGVkIGZyb20gdGhlIG1haW4gRElcbiAgLy8gdHJlZSwgdGh1cyB0aGUgYFBSRVNFUlZFX0hPU1RfQ09OVEVOVGAgd291bGQgbm90IGJlIGFibGUgdG8gaW5zdGFudGlhdGUuIEluIHRoaXMgY2FzZSwgdGhlXG4gIC8vIGRlZmF1bHQgdmFsdWUgd2lsbCBiZSB1c2VkLlxuICBjb25zdCBwcmVzZXJ2ZUhvc3RDb250ZW50ID0gaW5qZWN0b3IuZ2V0KFBSRVNFUlZFX0hPU1RfQ09OVEVOVCwgUFJFU0VSVkVfSE9TVF9DT05URU5UX0RFRkFVTFQpO1xuXG4gIC8vIFdoZW4gdXNpbmcgbmF0aXZlIFNoYWRvdyBET00sIGRvIG5vdCBjbGVhciBob3N0IGVsZW1lbnQgdG8gYWxsb3cgbmF0aXZlIHNsb3RcbiAgLy8gcHJvamVjdGlvbi5cbiAgY29uc3QgcHJlc2VydmVDb250ZW50ID0gcHJlc2VydmVIb3N0Q29udGVudCB8fCBlbmNhcHN1bGF0aW9uID09PSBWaWV3RW5jYXBzdWxhdGlvbi5TaGFkb3dEb207XG4gIGNvbnN0IHJvb3RFbGVtZW50ID0gcmVuZGVyZXIuc2VsZWN0Um9vdEVsZW1lbnQoZWxlbWVudE9yU2VsZWN0b3IsIHByZXNlcnZlQ29udGVudCk7XG4gIGFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0ocm9vdEVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICByZXR1cm4gcm9vdEVsZW1lbnQ7XG59XG5cbi8qKlxuICogQXBwbGllcyBhbnkgcm9vdCBlbGVtZW50IHRyYW5zZm9ybWF0aW9ucyB0aGF0IGFyZSBuZWVkZWQuIElmIGh5ZHJhdGlvbiBpcyBlbmFibGVkLFxuICogdGhpcyB3aWxsIHByb2Nlc3MgY29ycnVwdGVkIHRleHQgbm9kZXMuXG4gKlxuICogQHBhcmFtIHJvb3RFbGVtZW50IHRoZSBhcHAgcm9vdCBIVE1MIEVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm0ocm9vdEVsZW1lbnQ6IEhUTUxFbGVtZW50KSB7XG4gIF9hcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbChyb290RWxlbWVudCBhcyBIVE1MRWxlbWVudCk7XG59XG5cbi8qKlxuICogUmVmZXJlbmNlIHRvIGEgZnVuY3Rpb24gdGhhdCBhcHBsaWVzIHRyYW5zZm9ybWF0aW9ucyB0byB0aGUgcm9vdCBIVE1MIGVsZW1lbnRcbiAqIG9mIGFuIGFwcC4gV2hlbiBoeWRyYXRpb24gaXMgZW5hYmxlZCwgdGhpcyBwcm9jZXNzZXMgYW55IGNvcnJ1cHQgdGV4dCBub2Rlc1xuICogc28gdGhleSBhcmUgcHJvcGVybHkgaHlkcmF0YWJsZSBvbiB0aGUgY2xpZW50LlxuICpcbiAqIEBwYXJhbSByb290RWxlbWVudCB0aGUgYXBwIHJvb3QgSFRNTCBFbGVtZW50XG4gKi9cbmxldCBfYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGw6IHR5cGVvZiBhcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCA9XG4gICAgKHJvb3RFbGVtZW50OiBIVE1MRWxlbWVudCkgPT4gbnVsbDtcblxuLyoqXG4gKiBQcm9jZXNzZXMgdGV4dCBub2RlIG1hcmtlcnMgYmVmb3JlIGh5ZHJhdGlvbiBiZWdpbnMuIFRoaXMgcmVwbGFjZXMgYW55IHNwZWNpYWwgY29tbWVudFxuICogbm9kZXMgdGhhdCB3ZXJlIGFkZGVkIHByaW9yIHRvIHNlcmlhbGl6YXRpb24gYXJlIHN3YXBwZWQgb3V0IHRvIHJlc3RvcmUgcHJvcGVyIHRleHRcbiAqIG5vZGVzIGJlZm9yZSBoeWRyYXRpb24uXG4gKlxuICogQHBhcmFtIHJvb3RFbGVtZW50IHRoZSBhcHAgcm9vdCBIVE1MIEVsZW1lbnRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsKHJvb3RFbGVtZW50OiBIVE1MRWxlbWVudCkge1xuICBpZiAoaGFzU2tpcEh5ZHJhdGlvbkF0dHJPblJFbGVtZW50KHJvb3RFbGVtZW50KSkge1xuICAgIC8vIEhhbmRsZSBhIHNpdHVhdGlvbiB3aGVuIHRoZSBgbmdTa2lwSHlkcmF0aW9uYCBhdHRyaWJ1dGUgaXMgYXBwbGllZFxuICAgIC8vIHRvIHRoZSByb290IG5vZGUgb2YgYW4gYXBwbGljYXRpb24uIEluIHRoaXMgY2FzZSwgd2Ugc2hvdWxkIGNsZWFyXG4gICAgLy8gdGhlIGNvbnRlbnRzIGFuZCByZW5kZXIgZXZlcnl0aGluZyBmcm9tIHNjcmF0Y2guXG4gICAgY2xlYXJFbGVtZW50Q29udGVudHMocm9vdEVsZW1lbnQgYXMgUkVsZW1lbnQpO1xuICB9IGVsc2Uge1xuICAgIHByb2Nlc3NUZXh0Tm9kZU1hcmtlcnNCZWZvcmVIeWRyYXRpb24ocm9vdEVsZW1lbnQpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyB0aGUgaW1wbGVtZW50YXRpb24gZm9yIHRoZSBgYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybWAgZnVuY3Rpb24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlbmFibGVBcHBseVJvb3RFbGVtZW50VHJhbnNmb3JtSW1wbCgpIHtcbiAgX2FwcGx5Um9vdEVsZW1lbnRUcmFuc2Zvcm1JbXBsID0gYXBwbHlSb290RWxlbWVudFRyYW5zZm9ybUltcGw7XG59XG5cbi8qKlxuICogU2F2ZXMgY29udGV4dCBmb3IgdGhpcyBjbGVhbnVwIGZ1bmN0aW9uIGluIExWaWV3LmNsZWFudXBJbnN0YW5jZXMuXG4gKlxuICogT24gdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHNhdmVzIGluIFRWaWV3OlxuICogLSBDbGVhbnVwIGZ1bmN0aW9uXG4gKiAtIEluZGV4IG9mIGNvbnRleHQgd2UganVzdCBzYXZlZCBpbiBMVmlldy5jbGVhbnVwSW5zdGFuY2VzXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdG9yZUNsZWFudXBXaXRoQ29udGV4dChcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgY29udGV4dDogYW55LCBjbGVhbnVwRm46IEZ1bmN0aW9uKTogdm9pZCB7XG4gIGNvbnN0IGxDbGVhbnVwID0gZ2V0T3JDcmVhdGVMVmlld0NsZWFudXAobFZpZXcpO1xuXG4gIC8vIEhpc3RvcmljYWxseSB0aGUgYHN0b3JlQ2xlYW51cFdpdGhDb250ZXh0YCB3YXMgdXNlZCB0byByZWdpc3RlciBib3RoIGZyYW1ld29yay1sZXZlbCBhbmRcbiAgLy8gdXNlci1kZWZpbmVkIGNsZWFudXAgY2FsbGJhY2tzLCBidXQgb3ZlciB0aW1lIHRob3NlIHR3byB0eXBlcyBvZiBjbGVhbnVwcyB3ZXJlIHNlcGFyYXRlZC5cbiAgLy8gVGhpcyBkZXYgbW9kZSBjaGVja3MgYXNzdXJlcyB0aGF0IHVzZXItbGV2ZWwgY2xlYW51cCBjYWxsYmFja3MgYXJlIF9ub3RfIHN0b3JlZCBpbiBkYXRhXG4gIC8vIHN0cnVjdHVyZXMgcmVzZXJ2ZWQgZm9yIGZyYW1ld29yay1zcGVjaWZpYyBob29rcy5cbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnREZWZpbmVkKFxuICAgICAgICAgIGNvbnRleHQsICdDbGVhbnVwIGNvbnRleHQgaXMgbWFuZGF0b3J5IHdoZW4gcmVnaXN0ZXJpbmcgZnJhbWV3b3JrLWxldmVsIGRlc3Ryb3kgaG9va3MnKTtcbiAgbENsZWFudXAucHVzaChjb250ZXh0KTtcblxuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpLnB1c2goY2xlYW51cEZuLCBsQ2xlYW51cC5sZW5ndGggLSAxKTtcbiAgfSBlbHNlIHtcbiAgICAvLyBNYWtlIHN1cmUgdGhhdCBubyBuZXcgZnJhbWV3b3JrLWxldmVsIGNsZWFudXAgZnVuY3Rpb25zIGFyZSByZWdpc3RlcmVkIGFmdGVyIHRoZSBmaXJzdFxuICAgIC8vIHRlbXBsYXRlIHBhc3MgaXMgZG9uZSAoYW5kIFRWaWV3IGRhdGEgc3RydWN0dXJlcyBhcmUgbWVhbnQgdG8gZnVsbHkgY29uc3RydWN0ZWQpLlxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIE9iamVjdC5mcmVlemUoZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXcpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBDb25zdHJ1Y3RzIGEgVE5vZGUgb2JqZWN0IGZyb20gdGhlIGFyZ3VtZW50cy5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgYFRWaWV3YCB0byB3aGljaCB0aGlzIGBUTm9kZWAgYmVsb25nc1xuICogQHBhcmFtIHRQYXJlbnQgUGFyZW50IGBUTm9kZWBcbiAqIEBwYXJhbSB0eXBlIFRoZSB0eXBlIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gaW5kZXggVGhlIGluZGV4IG9mIHRoZSBUTm9kZSBpbiBUVmlldy5kYXRhLCBhZGp1c3RlZCBmb3IgSEVBREVSX09GRlNFVFxuICogQHBhcmFtIHRhZ05hbWUgVGhlIHRhZyBuYW1lIG9mIHRoZSBub2RlXG4gKiBAcGFyYW0gYXR0cnMgVGhlIGF0dHJpYnV0ZXMgZGVmaW5lZCBvbiB0aGlzIG5vZGVcbiAqIEByZXR1cm5zIHRoZSBUTm9kZSBvYmplY3RcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Db250YWluZXIsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVENvbnRhaW5lck5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLkVsZW1lbnR8VE5vZGVUeXBlLlRleHQsXG4gICAgaW5kZXg6IG51bWJlciwgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVEVsZW1lbnROb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRFbGVtZW50Q29udGFpbmVyTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUuSWN1LCBpbmRleDogbnVtYmVyLFxuICAgIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRJY3VDb250YWluZXJOb2RlO1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVROb2RlKFxuICAgIHRWaWV3OiBUVmlldywgdFBhcmVudDogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfG51bGwsIHR5cGU6IFROb2RlVHlwZS5Qcm9qZWN0aW9uLFxuICAgIGluZGV4OiBudW1iZXIsIHRhZ05hbWU6IHN0cmluZ3xudWxsLCBhdHRyczogVEF0dHJpYnV0ZXN8bnVsbCk6IFRQcm9qZWN0aW9uTm9kZTtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUTm9kZShcbiAgICB0VmlldzogVFZpZXcsIHRQYXJlbnQ6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxudWxsLCB0eXBlOiBUTm9kZVR5cGUsIGluZGV4OiBudW1iZXIsXG4gICAgdGFnTmFtZTogc3RyaW5nfG51bGwsIGF0dHJzOiBUQXR0cmlidXRlc3xudWxsKTogVE5vZGU7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVE5vZGUoXG4gICAgdFZpZXc6IFRWaWV3LCB0UGFyZW50OiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCwgdHlwZTogVE5vZGVUeXBlLCBpbmRleDogbnVtYmVyLFxuICAgIHZhbHVlOiBzdHJpbmd8bnVsbCwgYXR0cnM6IFRBdHRyaWJ1dGVzfG51bGwpOiBUTm9kZSB7XG4gIG5nRGV2TW9kZSAmJiBpbmRleCAhPT0gMCAmJiAgLy8gMCBhcmUgYm9ndXMgbm9kZXMgYW5kIHRoZXkgYXJlIE9LLiBTZWUgYGNyZWF0ZUNvbnRhaW5lclJlZmAgaW5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBgdmlld19lbmdpbmVfY29tcGF0aWJpbGl0eWAgZm9yIGFkZGl0aW9uYWwgY29udGV4dC5cbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuT3JFcXVhbChpbmRleCwgSEVBREVSX09GRlNFVCwgJ1ROb2RlcyBjYW5cXCd0IGJlIGluIHRoZSBMVmlldyBoZWFkZXIuJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKGF0dHJzLCB1bmRlZmluZWQsICdcXCd1bmRlZmluZWRcXCcgaXMgbm90IHZhbGlkIHZhbHVlIGZvciBcXCdhdHRyc1xcJycpO1xuICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnROb2RlKys7XG4gIG5nRGV2TW9kZSAmJiB0UGFyZW50ICYmIGFzc2VydFROb2RlRm9yVFZpZXcodFBhcmVudCwgdFZpZXcpO1xuICBsZXQgaW5qZWN0b3JJbmRleCA9IHRQYXJlbnQgPyB0UGFyZW50LmluamVjdG9ySW5kZXggOiAtMTtcbiAgbGV0IGZsYWdzID0gMDtcbiAgaWYgKGlzSW5Ta2lwSHlkcmF0aW9uQmxvY2soKSkge1xuICAgIGZsYWdzIHw9IFROb2RlRmxhZ3MuaW5Ta2lwSHlkcmF0aW9uQmxvY2s7XG4gIH1cbiAgY29uc3QgdE5vZGUgPSB7XG4gICAgdHlwZSxcbiAgICBpbmRleCxcbiAgICBpbnNlcnRCZWZvcmVJbmRleDogbnVsbCxcbiAgICBpbmplY3RvckluZGV4LFxuICAgIGRpcmVjdGl2ZVN0YXJ0OiAtMSxcbiAgICBkaXJlY3RpdmVFbmQ6IC0xLFxuICAgIGRpcmVjdGl2ZVN0eWxpbmdMYXN0OiAtMSxcbiAgICBjb21wb25lbnRPZmZzZXQ6IC0xLFxuICAgIHByb3BlcnR5QmluZGluZ3M6IG51bGwsXG4gICAgZmxhZ3MsXG4gICAgcHJvdmlkZXJJbmRleGVzOiAwLFxuICAgIHZhbHVlOiB2YWx1ZSxcbiAgICBhdHRyczogYXR0cnMsXG4gICAgbWVyZ2VkQXR0cnM6IG51bGwsXG4gICAgbG9jYWxOYW1lczogbnVsbCxcbiAgICBpbml0aWFsSW5wdXRzOiB1bmRlZmluZWQsXG4gICAgaW5wdXRzOiBudWxsLFxuICAgIG91dHB1dHM6IG51bGwsXG4gICAgdFZpZXc6IG51bGwsXG4gICAgbmV4dDogbnVsbCxcbiAgICBwcmV2OiBudWxsLFxuICAgIHByb2plY3Rpb25OZXh0OiBudWxsLFxuICAgIGNoaWxkOiBudWxsLFxuICAgIHBhcmVudDogdFBhcmVudCxcbiAgICBwcm9qZWN0aW9uOiBudWxsLFxuICAgIHN0eWxlczogbnVsbCxcbiAgICBzdHlsZXNXaXRob3V0SG9zdDogbnVsbCxcbiAgICByZXNpZHVhbFN0eWxlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzZXM6IG51bGwsXG4gICAgY2xhc3Nlc1dpdGhvdXRIb3N0OiBudWxsLFxuICAgIHJlc2lkdWFsQ2xhc3NlczogdW5kZWZpbmVkLFxuICAgIGNsYXNzQmluZGluZ3M6IDAgYXMgYW55LFxuICAgIHN0eWxlQmluZGluZ3M6IDAgYXMgYW55LFxuICB9O1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgLy8gRm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgaXQgaXMgaW1wb3J0YW50IHRoYXQgdGhlIHROb2RlIHJldGFpbnMgdGhlIHNhbWUgc2hhcGUgZHVyaW5nIHJ1bnRpbWUuXG4gICAgLy8gKFRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBvZiB0aGUgY29kZSBpcyBtb25vbW9ycGhpYy4pIEZvciB0aGlzIHJlYXNvbiB3ZSBzZWFsIHRoZSBvYmplY3QgdG9cbiAgICAvLyBwcmV2ZW50IGNsYXNzIHRyYW5zaXRpb25zLlxuICAgIE9iamVjdC5zZWFsKHROb2RlKTtcbiAgfVxuICByZXR1cm4gdE5vZGU7XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIHRoZSBgUHJvcGVydHlBbGlhc2VzYCBkYXRhIHN0cnVjdHVyZSBmcm9tIHRoZSBwcm92aWRlZCBpbnB1dC9vdXRwdXQgbWFwcGluZy5cbiAqIEBwYXJhbSBhbGlhc01hcCBJbnB1dC9vdXRwdXQgbWFwcGluZyBmcm9tIHRoZSBkaXJlY3RpdmUgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCBvZiB0aGUgZGlyZWN0aXZlLlxuICogQHBhcmFtIHByb3BlcnR5QWxpYXNlcyBPYmplY3QgaW4gd2hpY2ggdG8gc3RvcmUgdGhlIHJlc3VsdHMuXG4gKiBAcGFyYW0gaG9zdERpcmVjdGl2ZUFsaWFzTWFwIE9iamVjdCB1c2VkIHRvIGFsaWFzIG9yIGZpbHRlciBvdXQgcHJvcGVydGllcyBmb3IgaG9zdCBkaXJlY3RpdmVzLlxuICogSWYgdGhlIG1hcHBpbmcgaXMgcHJvdmlkZWQsIGl0J2xsIGFjdCBhcyBhbiBhbGxvd2xpc3QsIGFzIHdlbGwgYXMgYSBtYXBwaW5nIG9mIHdoYXQgcHVibGljXG4gKiBuYW1lIGlucHV0cy9vdXRwdXRzIHNob3VsZCBiZSBleHBvc2VkIHVuZGVyLlxuICovXG5mdW5jdGlvbiBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhcbiAgICBhbGlhc01hcDoge1twdWJsaWNOYW1lOiBzdHJpbmddOiBzdHJpbmd9LCBkaXJlY3RpdmVJbmRleDogbnVtYmVyLFxuICAgIHByb3BlcnR5QWxpYXNlczogUHJvcGVydHlBbGlhc2VzfG51bGwsXG4gICAgaG9zdERpcmVjdGl2ZUFsaWFzTWFwOiBIb3N0RGlyZWN0aXZlQmluZGluZ01hcHxudWxsKTogUHJvcGVydHlBbGlhc2VzfG51bGwge1xuICBmb3IgKGxldCBwdWJsaWNOYW1lIGluIGFsaWFzTWFwKSB7XG4gICAgaWYgKGFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICBwcm9wZXJ0eUFsaWFzZXMgPSBwcm9wZXJ0eUFsaWFzZXMgPT09IG51bGwgPyB7fSA6IHByb3BlcnR5QWxpYXNlcztcbiAgICAgIGNvbnN0IGludGVybmFsTmFtZSA9IGFsaWFzTWFwW3B1YmxpY05hbWVdO1xuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gaG9zdCBkaXJlY3RpdmUgbWFwcGluZ3MsIHdlIHdhbnQgdG8gcmVtYXAgdXNpbmcgdGhlIGFsaWFzIG1hcCBmcm9tIHRoZVxuICAgICAgLy8gZGVmaW5pdGlvbiBpdHNlbGYuIElmIHRoZXJlIGlzIGFuIGFsaWFzIG1hcCwgaXQgaGFzIHR3byBmdW5jdGlvbnM6XG4gICAgICAvLyAxLiBJdCBzZXJ2ZXMgYXMgYW4gYWxsb3dsaXN0IG9mIGJpbmRpbmdzIHRoYXQgYXJlIGV4cG9zZWQgYnkgdGhlIGhvc3QgZGlyZWN0aXZlcy4gT25seSB0aGVcbiAgICAgIC8vIG9uZXMgaW5zaWRlIHRoZSBob3N0IGRpcmVjdGl2ZSBtYXAgd2lsbCBiZSBleHBvc2VkIG9uIHRoZSBob3N0LlxuICAgICAgLy8gMi4gVGhlIHB1YmxpYyBuYW1lIG9mIHRoZSBwcm9wZXJ0eSBpcyBhbGlhc2VkIHVzaW5nIHRoZSBob3N0IGRpcmVjdGl2ZSBhbGlhcyBtYXAsIHJhdGhlclxuICAgICAgLy8gdGhhbiB0aGUgYWxpYXMgbWFwIGZyb20gdGhlIGRlZmluaXRpb24uXG4gICAgICBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwID09PSBudWxsKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMocHJvcGVydHlBbGlhc2VzLCBkaXJlY3RpdmVJbmRleCwgcHVibGljTmFtZSwgaW50ZXJuYWxOYW1lKTtcbiAgICAgIH0gZWxzZSBpZiAoaG9zdERpcmVjdGl2ZUFsaWFzTWFwLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgICAgIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgICAgICAgICBwcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4LCBob3N0RGlyZWN0aXZlQWxpYXNNYXBbcHVibGljTmFtZV0sIGludGVybmFsTmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBwcm9wZXJ0eUFsaWFzZXM7XG59XG5cbmZ1bmN0aW9uIGFkZFByb3BlcnR5QWxpYXMoXG4gICAgcHJvcGVydHlBbGlhc2VzOiBQcm9wZXJ0eUFsaWFzZXMsIGRpcmVjdGl2ZUluZGV4OiBudW1iZXIsIHB1YmxpY05hbWU6IHN0cmluZyxcbiAgICBpbnRlcm5hbE5hbWU6IHN0cmluZykge1xuICBpZiAocHJvcGVydHlBbGlhc2VzLmhhc093blByb3BlcnR5KHB1YmxpY05hbWUpKSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdLnB1c2goZGlyZWN0aXZlSW5kZXgsIGludGVybmFsTmFtZSk7XG4gIH0gZWxzZSB7XG4gICAgcHJvcGVydHlBbGlhc2VzW3B1YmxpY05hbWVdID0gW2RpcmVjdGl2ZUluZGV4LCBpbnRlcm5hbE5hbWVdO1xuICB9XG59XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgZGF0YSBzdHJ1Y3R1cmVzIHJlcXVpcmVkIHRvIHdvcmsgd2l0aCBkaXJlY3RpdmUgaW5wdXRzIGFuZCBvdXRwdXRzLlxuICogSW5pdGlhbGl6YXRpb24gaXMgZG9uZSBmb3IgYWxsIGRpcmVjdGl2ZXMgbWF0Y2hlZCBvbiBhIGdpdmVuIFROb2RlLlxuICovXG5mdW5jdGlvbiBpbml0aWFsaXplSW5wdXRBbmRPdXRwdXRBbGlhc2VzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcDogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IHRWaWV3RGF0YSA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgdE5vZGVBdHRycyA9IHROb2RlLmF0dHJzO1xuICBjb25zdCBpbnB1dHNGcm9tQXR0cnM6IEluaXRpYWxJbnB1dERhdGEgPSBbXTtcbiAgbGV0IGlucHV0c1N0b3JlOiBQcm9wZXJ0eUFsaWFzZXN8bnVsbCA9IG51bGw7XG4gIGxldCBvdXRwdXRzU3RvcmU6IFByb3BlcnR5QWxpYXNlc3xudWxsID0gbnVsbDtcblxuICBmb3IgKGxldCBkaXJlY3RpdmVJbmRleCA9IHN0YXJ0OyBkaXJlY3RpdmVJbmRleCA8IGVuZDsgZGlyZWN0aXZlSW5kZXgrKykge1xuICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3RGF0YVtkaXJlY3RpdmVJbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgY29uc3QgYWxpYXNEYXRhID1cbiAgICAgICAgaG9zdERpcmVjdGl2ZURlZmluaXRpb25NYXAgPyBob3N0RGlyZWN0aXZlRGVmaW5pdGlvbk1hcC5nZXQoZGlyZWN0aXZlRGVmKSA6IG51bGw7XG4gICAgY29uc3QgYWxpYXNlZElucHV0cyA9IGFsaWFzRGF0YSA/IGFsaWFzRGF0YS5pbnB1dHMgOiBudWxsO1xuICAgIGNvbnN0IGFsaWFzZWRPdXRwdXRzID0gYWxpYXNEYXRhID8gYWxpYXNEYXRhLm91dHB1dHMgOiBudWxsO1xuXG4gICAgaW5wdXRzU3RvcmUgPVxuICAgICAgICBnZW5lcmF0ZVByb3BlcnR5QWxpYXNlcyhkaXJlY3RpdmVEZWYuaW5wdXRzLCBkaXJlY3RpdmVJbmRleCwgaW5wdXRzU3RvcmUsIGFsaWFzZWRJbnB1dHMpO1xuICAgIG91dHB1dHNTdG9yZSA9XG4gICAgICAgIGdlbmVyYXRlUHJvcGVydHlBbGlhc2VzKGRpcmVjdGl2ZURlZi5vdXRwdXRzLCBkaXJlY3RpdmVJbmRleCwgb3V0cHV0c1N0b3JlLCBhbGlhc2VkT3V0cHV0cyk7XG4gICAgLy8gRG8gbm90IHVzZSB1bmJvdW5kIGF0dHJpYnV0ZXMgYXMgaW5wdXRzIHRvIHN0cnVjdHVyYWwgZGlyZWN0aXZlcywgc2luY2Ugc3RydWN0dXJhbFxuICAgIC8vIGRpcmVjdGl2ZSBpbnB1dHMgY2FuIG9ubHkgYmUgc2V0IHVzaW5nIG1pY3Jvc3ludGF4IChlLmcuIGA8ZGl2ICpkaXI9XCJleHBcIj5gKS5cbiAgICAvLyBUT0RPKEZXLTE5MzApOiBtaWNyb3N5bnRheCBleHByZXNzaW9ucyBtYXkgYWxzbyBjb250YWluIHVuYm91bmQvc3RhdGljIGF0dHJpYnV0ZXMsIHdoaWNoXG4gICAgLy8gc2hvdWxkIGJlIHNldCBmb3IgaW5saW5lIHRlbXBsYXRlcy5cbiAgICBjb25zdCBpbml0aWFsSW5wdXRzID1cbiAgICAgICAgKGlucHV0c1N0b3JlICE9PSBudWxsICYmIHROb2RlQXR0cnMgIT09IG51bGwgJiYgIWlzSW5saW5lVGVtcGxhdGUodE5vZGUpKSA/XG4gICAgICAgIGdlbmVyYXRlSW5pdGlhbElucHV0cyhpbnB1dHNTdG9yZSwgZGlyZWN0aXZlSW5kZXgsIHROb2RlQXR0cnMpIDpcbiAgICAgICAgbnVsbDtcbiAgICBpbnB1dHNGcm9tQXR0cnMucHVzaChpbml0aWFsSW5wdXRzKTtcbiAgfVxuXG4gIGlmIChpbnB1dHNTdG9yZSAhPT0gbnVsbCkge1xuICAgIGlmIChpbnB1dHNTdG9yZS5oYXNPd25Qcm9wZXJ0eSgnY2xhc3MnKSkge1xuICAgICAgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDbGFzc0lucHV0O1xuICAgIH1cbiAgICBpZiAoaW5wdXRzU3RvcmUuaGFzT3duUHJvcGVydHkoJ3N0eWxlJykpIHtcbiAgICAgIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaGFzU3R5bGVJbnB1dDtcbiAgICB9XG4gIH1cblxuICB0Tm9kZS5pbml0aWFsSW5wdXRzID0gaW5wdXRzRnJvbUF0dHJzO1xuICB0Tm9kZS5pbnB1dHMgPSBpbnB1dHNTdG9yZTtcbiAgdE5vZGUub3V0cHV0cyA9IG91dHB1dHNTdG9yZTtcbn1cblxuLyoqXG4gKiBNYXBwaW5nIGJldHdlZW4gYXR0cmlidXRlcyBuYW1lcyB0aGF0IGRvbid0IGNvcnJlc3BvbmQgdG8gdGhlaXIgZWxlbWVudCBwcm9wZXJ0eSBuYW1lcy5cbiAqXG4gKiBQZXJmb3JtYW5jZSBub3RlOiB0aGlzIGZ1bmN0aW9uIGlzIHdyaXR0ZW4gYXMgYSBzZXJpZXMgb2YgaWYgY2hlY2tzIChpbnN0ZWFkIG9mLCBzYXksIGEgcHJvcGVydHlcbiAqIG9iamVjdCBsb29rdXApIGZvciBwZXJmb3JtYW5jZSByZWFzb25zIC0gdGhlIHNlcmllcyBvZiBgaWZgIGNoZWNrcyBzZWVtcyB0byBiZSB0aGUgZmFzdGVzdCB3YXkgb2ZcbiAqIG1hcHBpbmcgcHJvcGVydHkgbmFtZXMuIERvIE5PVCBjaGFuZ2Ugd2l0aG91dCBiZW5jaG1hcmtpbmcuXG4gKlxuICogTm90ZTogdGhpcyBtYXBwaW5nIGhhcyB0byBiZSBrZXB0IGluIHN5bmMgd2l0aCB0aGUgZXF1YWxseSBuYW1lZCBtYXBwaW5nIGluIHRoZSB0ZW1wbGF0ZVxuICogdHlwZS1jaGVja2luZyBtYWNoaW5lcnkgb2Ygbmd0c2MuXG4gKi9cbmZ1bmN0aW9uIG1hcFByb3BOYW1lKG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGlmIChuYW1lID09PSAnY2xhc3MnKSByZXR1cm4gJ2NsYXNzTmFtZSc7XG4gIGlmIChuYW1lID09PSAnZm9yJykgcmV0dXJuICdodG1sRm9yJztcbiAgaWYgKG5hbWUgPT09ICdmb3JtYWN0aW9uJykgcmV0dXJuICdmb3JtQWN0aW9uJztcbiAgaWYgKG5hbWUgPT09ICdpbm5lckh0bWwnKSByZXR1cm4gJ2lubmVySFRNTCc7XG4gIGlmIChuYW1lID09PSAncmVhZG9ubHknKSByZXR1cm4gJ3JlYWRPbmx5JztcbiAgaWYgKG5hbWUgPT09ICd0YWJpbmRleCcpIHJldHVybiAndGFiSW5kZXgnO1xuICByZXR1cm4gbmFtZTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVsZW1lbnRQcm9wZXJ0eUludGVybmFsPFQ+KFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByb3BOYW1lOiBzdHJpbmcsIHZhbHVlOiBULCByZW5kZXJlcjogUmVuZGVyZXIsXG4gICAgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCwgbmF0aXZlT25seTogYm9vbGVhbik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQgfCBSQ29tbWVudDtcbiAgbGV0IGlucHV0RGF0YSA9IHROb2RlLmlucHV0cztcbiAgbGV0IGRhdGFWYWx1ZTogUHJvcGVydHlBbGlhc1ZhbHVlfHVuZGVmaW5lZDtcbiAgaWYgKCFuYXRpdmVPbmx5ICYmIGlucHV0RGF0YSAhPSBudWxsICYmIChkYXRhVmFsdWUgPSBpbnB1dERhdGFbcHJvcE5hbWVdKSkge1xuICAgIHNldElucHV0c0ZvclByb3BlcnR5KHRWaWV3LCBsVmlldywgZGF0YVZhbHVlLCBwcm9wTmFtZSwgdmFsdWUpO1xuICAgIGlmIChpc0NvbXBvbmVudEhvc3QodE5vZGUpKSBtYXJrRGlydHlJZk9uUHVzaChsVmlldywgdE5vZGUuaW5kZXgpO1xuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIHNldE5nUmVmbGVjdFByb3BlcnRpZXMobFZpZXcsIGVsZW1lbnQsIHROb2RlLnR5cGUsIGRhdGFWYWx1ZSwgdmFsdWUpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSB7XG4gICAgcHJvcE5hbWUgPSBtYXBQcm9wTmFtZShwcm9wTmFtZSk7XG5cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICB2YWxpZGF0ZUFnYWluc3RFdmVudFByb3BlcnRpZXMocHJvcE5hbWUpO1xuICAgICAgaWYgKCFpc1Byb3BlcnR5VmFsaWQoZWxlbWVudCwgcHJvcE5hbWUsIHROb2RlLnZhbHVlLCB0Vmlldy5zY2hlbWFzKSkge1xuICAgICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICAgIH1cbiAgICAgIG5nRGV2TW9kZS5yZW5kZXJlclNldFByb3BlcnR5Kys7XG4gICAgfVxuXG4gICAgLy8gSXQgaXMgYXNzdW1lZCB0aGF0IHRoZSBzYW5pdGl6ZXIgaXMgb25seSBhZGRlZCB3aGVuIHRoZSBjb21waWxlciBkZXRlcm1pbmVzIHRoYXQgdGhlXG4gICAgLy8gcHJvcGVydHkgaXMgcmlza3ksIHNvIHNhbml0aXphdGlvbiBjYW4gYmUgZG9uZSB3aXRob3V0IGZ1cnRoZXIgY2hlY2tzLlxuICAgIHZhbHVlID0gc2FuaXRpemVyICE9IG51bGwgPyAoc2FuaXRpemVyKHZhbHVlLCB0Tm9kZS52YWx1ZSB8fCAnJywgcHJvcE5hbWUpIGFzIGFueSkgOiB2YWx1ZTtcbiAgICByZW5kZXJlci5zZXRQcm9wZXJ0eShlbGVtZW50IGFzIFJFbGVtZW50LCBwcm9wTmFtZSwgdmFsdWUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Q29udGFpbmVyKSB7XG4gICAgLy8gSWYgdGhlIG5vZGUgaXMgYSBjb250YWluZXIgYW5kIHRoZSBwcm9wZXJ0eSBkaWRuJ3RcbiAgICAvLyBtYXRjaCBhbnkgb2YgdGhlIGlucHV0cyBvciBzY2hlbWFzIHdlIHNob3VsZCB0aHJvdy5cbiAgICBpZiAobmdEZXZNb2RlICYmICFtYXRjaGluZ1NjaGVtYXModFZpZXcuc2NoZW1hcywgdE5vZGUudmFsdWUpKSB7XG4gICAgICBoYW5kbGVVbmtub3duUHJvcGVydHlFcnJvcihwcm9wTmFtZSwgdE5vZGUudmFsdWUsIHROb2RlLnR5cGUsIGxWaWV3KTtcbiAgICB9XG4gIH1cbn1cblxuLyoqIElmIG5vZGUgaXMgYW4gT25QdXNoIGNvbXBvbmVudCwgbWFya3MgaXRzIExWaWV3IGRpcnR5LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtEaXJ0eUlmT25QdXNoKGxWaWV3OiBMVmlldywgdmlld0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydExWaWV3KGxWaWV3KTtcbiAgY29uc3QgY2hpbGRDb21wb25lbnRMVmlldyA9IGdldENvbXBvbmVudExWaWV3QnlJbmRleCh2aWV3SW5kZXgsIGxWaWV3KTtcbiAgaWYgKCEoY2hpbGRDb21wb25lbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkNoZWNrQWx3YXlzKSkge1xuICAgIGNoaWxkQ29tcG9uZW50TFZpZXdbRkxBR1NdIHw9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2V0TmdSZWZsZWN0UHJvcGVydHkoXG4gICAgbFZpZXc6IExWaWV3LCBlbGVtZW50OiBSRWxlbWVudHxSQ29tbWVudCwgdHlwZTogVE5vZGVUeXBlLCBhdHRyTmFtZTogc3RyaW5nLCB2YWx1ZTogYW55KSB7XG4gIGNvbnN0IHJlbmRlcmVyID0gbFZpZXdbUkVOREVSRVJdO1xuICBhdHRyTmFtZSA9IG5vcm1hbGl6ZURlYnVnQmluZGluZ05hbWUoYXR0ck5hbWUpO1xuICBjb25zdCBkZWJ1Z1ZhbHVlID0gbm9ybWFsaXplRGVidWdCaW5kaW5nVmFsdWUodmFsdWUpO1xuICBpZiAodHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkge1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoKGVsZW1lbnQgYXMgUkVsZW1lbnQpLCBhdHRyTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlbmRlcmVyLnNldEF0dHJpYnV0ZSgoZWxlbWVudCBhcyBSRWxlbWVudCksIGF0dHJOYW1lLCBkZWJ1Z1ZhbHVlKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgdGV4dENvbnRlbnQgPVxuICAgICAgICBlc2NhcGVDb21tZW50VGV4dChgYmluZGluZ3M9JHtKU09OLnN0cmluZ2lmeSh7W2F0dHJOYW1lXTogZGVidWdWYWx1ZX0sIG51bGwsIDIpfWApO1xuICAgIHJlbmRlcmVyLnNldFZhbHVlKChlbGVtZW50IGFzIFJDb21tZW50KSwgdGV4dENvbnRlbnQpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXROZ1JlZmxlY3RQcm9wZXJ0aWVzKFxuICAgIGxWaWV3OiBMVmlldywgZWxlbWVudDogUkVsZW1lbnR8UkNvbW1lbnQsIHR5cGU6IFROb2RlVHlwZSwgZGF0YVZhbHVlOiBQcm9wZXJ0eUFsaWFzVmFsdWUsXG4gICAgdmFsdWU6IGFueSkge1xuICBpZiAodHlwZSAmIChUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQ29udGFpbmVyKSkge1xuICAgIC8qKlxuICAgICAqIGRhdGFWYWx1ZSBpcyBhbiBhcnJheSBjb250YWluaW5nIHJ1bnRpbWUgaW5wdXQgb3Igb3V0cHV0IG5hbWVzIGZvciB0aGUgZGlyZWN0aXZlczpcbiAgICAgKiBpKzA6IGRpcmVjdGl2ZSBpbnN0YW5jZSBpbmRleFxuICAgICAqIGkrMTogcHJpdmF0ZU5hbWVcbiAgICAgKlxuICAgICAqIGUuZy4gWzAsICdjaGFuZ2UnLCAnY2hhbmdlLW1pbmlmaWVkJ11cbiAgICAgKiB3ZSB3YW50IHRvIHNldCB0aGUgcmVmbGVjdGVkIHByb3BlcnR5IHdpdGggdGhlIHByaXZhdGVOYW1lOiBkYXRhVmFsdWVbaSsxXVxuICAgICAqL1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YVZhbHVlLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgZWxlbWVudCwgdHlwZSwgZGF0YVZhbHVlW2kgKyAxXSBhcyBzdHJpbmcsIHZhbHVlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlIHRoZSBtYXRjaGVkIGRpcmVjdGl2ZXMgb24gYSBub2RlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURpcmVjdGl2ZXMoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCk6IHZvaWQge1xuICAvLyBQbGVhc2UgbWFrZSBzdXJlIHRvIGhhdmUgZXhwbGljaXQgdHlwZSBmb3IgYGV4cG9ydHNNYXBgLiBJbmZlcnJlZCB0eXBlIHRyaWdnZXJzIGJ1ZyBpblxuICAvLyB0c2lja2xlLlxuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcblxuICBpZiAoZ2V0QmluZGluZ3NFbmFibGVkKCkpIHtcbiAgICBjb25zdCBleHBvcnRzTWFwOiAoe1trZXk6IHN0cmluZ106IG51bWJlcn18bnVsbCkgPSBsb2NhbFJlZnMgPT09IG51bGwgPyBudWxsIDogeycnOiAtMX07XG4gICAgY29uc3QgbWF0Y2hSZXN1bHQgPSBmaW5kRGlyZWN0aXZlRGVmTWF0Y2hlcyh0VmlldywgdE5vZGUpO1xuICAgIGxldCBkaXJlY3RpdmVEZWZzOiBEaXJlY3RpdmVEZWY8dW5rbm93bj5bXXxudWxsO1xuICAgIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbDtcblxuICAgIGlmIChtYXRjaFJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgZGlyZWN0aXZlRGVmcyA9IGhvc3REaXJlY3RpdmVEZWZzID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgW2RpcmVjdGl2ZURlZnMsIGhvc3REaXJlY3RpdmVEZWZzXSA9IG1hdGNoUmVzdWx0O1xuICAgIH1cblxuICAgIGlmIChkaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICBpbml0aWFsaXplRGlyZWN0aXZlcyh0VmlldywgbFZpZXcsIHROb2RlLCBkaXJlY3RpdmVEZWZzLCBleHBvcnRzTWFwLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgfVxuICAgIGlmIChleHBvcnRzTWFwKSBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyh0Tm9kZSwgbG9jYWxSZWZzLCBleHBvcnRzTWFwKTtcbiAgfVxuICAvLyBNZXJnZSB0aGUgdGVtcGxhdGUgYXR0cnMgbGFzdCBzbyB0aGF0IHRoZXkgaGF2ZSB0aGUgaGlnaGVzdCBwcmlvcml0eS5cbiAgdE5vZGUubWVyZ2VkQXR0cnMgPSBtZXJnZUhvc3RBdHRycyh0Tm9kZS5tZXJnZWRBdHRycywgdE5vZGUuYXR0cnMpO1xufVxuXG4vKiogSW5pdGlhbGl6ZXMgdGhlIGRhdGEgc3RydWN0dXJlcyBuZWNlc3NhcnkgZm9yIGEgbGlzdCBvZiBkaXJlY3RpdmVzIHRvIGJlIGluc3RhbnRpYXRlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0aWFsaXplRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldzx1bmtub3duPiwgdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgZGlyZWN0aXZlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10sIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXI7fXxudWxsLFxuICAgIGhvc3REaXJlY3RpdmVEZWZzOiBIb3N0RGlyZWN0aXZlRGVmc3xudWxsKSB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuXG4gIC8vIFB1Ymxpc2hlcyB0aGUgZGlyZWN0aXZlIHR5cGVzIHRvIERJIHNvIHRoZXkgY2FuIGJlIGluamVjdGVkLiBOZWVkcyB0b1xuICAvLyBoYXBwZW4gaW4gYSBzZXBhcmF0ZSBwYXNzIGJlZm9yZSB0aGUgVE5vZGUgZmxhZ3MgaGF2ZSBiZWVuIGluaXRpYWxpemVkLlxuICBmb3IgKGxldCBpID0gMDsgaSA8IGRpcmVjdGl2ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHROb2RlLCBsVmlldyksIHRWaWV3LCBkaXJlY3RpdmVzW2ldLnR5cGUpO1xuICB9XG5cbiAgaW5pdFROb2RlRmxhZ3ModE5vZGUsIHRWaWV3LmRhdGEubGVuZ3RoLCBkaXJlY3RpdmVzLmxlbmd0aCk7XG5cbiAgLy8gV2hlbiB0aGUgc2FtZSB0b2tlbiBpcyBwcm92aWRlZCBieSBzZXZlcmFsIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgbm9kZSwgc29tZSBydWxlcyBhcHBseSBpblxuICAvLyB0aGUgdmlld0VuZ2luZTpcbiAgLy8gLSB2aWV3UHJvdmlkZXJzIGhhdmUgcHJpb3JpdHkgb3ZlciBwcm92aWRlcnNcbiAgLy8gLSB0aGUgbGFzdCBkaXJlY3RpdmUgaW4gTmdNb2R1bGUuZGVjbGFyYXRpb25zIGhhcyBwcmlvcml0eSBvdmVyIHRoZSBwcmV2aW91cyBvbmVcbiAgLy8gU28gdG8gbWF0Y2ggdGhlc2UgcnVsZXMsIHRoZSBvcmRlciBpbiB3aGljaCBwcm92aWRlcnMgYXJlIGFkZGVkIGluIHRoZSBhcnJheXMgaXMgdmVyeVxuICAvLyBpbXBvcnRhbnQuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgaWYgKGRlZi5wcm92aWRlcnNSZXNvbHZlcikgZGVmLnByb3ZpZGVyc1Jlc29sdmVyKGRlZik7XG4gIH1cbiAgbGV0IHByZU9yZGVySG9va3NGb3VuZCA9IGZhbHNlO1xuICBsZXQgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSBmYWxzZTtcbiAgbGV0IGRpcmVjdGl2ZUlkeCA9IGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIGRpcmVjdGl2ZXMubGVuZ3RoLCBudWxsKTtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRTYW1lKFxuICAgICAgICAgIGRpcmVjdGl2ZUlkeCwgdE5vZGUuZGlyZWN0aXZlU3RhcnQsXG4gICAgICAgICAgJ1ROb2RlLmRpcmVjdGl2ZVN0YXJ0IHNob3VsZCBwb2ludCB0byBqdXN0IGFsbG9jYXRlZCBzcGFjZScpO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZGlyZWN0aXZlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGRlZiA9IGRpcmVjdGl2ZXNbaV07XG4gICAgLy8gTWVyZ2UgdGhlIGF0dHJzIGluIHRoZSBvcmRlciBvZiBtYXRjaGVzLiBUaGlzIGFzc3VtZXMgdGhhdCB0aGUgZmlyc3QgZGlyZWN0aXZlIGlzIHRoZVxuICAgIC8vIGNvbXBvbmVudCBpdHNlbGYsIHNvIHRoYXQgdGhlIGNvbXBvbmVudCBoYXMgdGhlIGxlYXN0IHByaW9yaXR5LlxuICAgIHROb2RlLm1lcmdlZEF0dHJzID0gbWVyZ2VIb3N0QXR0cnModE5vZGUubWVyZ2VkQXR0cnMsIGRlZi5ob3N0QXR0cnMpO1xuXG4gICAgY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmUodFZpZXcsIHROb2RlLCBsVmlldywgZGlyZWN0aXZlSWR4LCBkZWYpO1xuICAgIHNhdmVOYW1lVG9FeHBvcnRNYXAoZGlyZWN0aXZlSWR4LCBkZWYsIGV4cG9ydHNNYXApO1xuXG4gICAgaWYgKGRlZi5jb250ZW50UXVlcmllcyAhPT0gbnVsbCkgdE5vZGUuZmxhZ3MgfD0gVE5vZGVGbGFncy5oYXNDb250ZW50UXVlcnk7XG4gICAgaWYgKGRlZi5ob3N0QmluZGluZ3MgIT09IG51bGwgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDApXG4gICAgICB0Tm9kZS5mbGFncyB8PSBUTm9kZUZsYWdzLmhhc0hvc3RCaW5kaW5ncztcblxuICAgIGNvbnN0IGxpZmVDeWNsZUhvb2tzOiBQYXJ0aWFsPE9uQ2hhbmdlcyZPbkluaXQmRG9DaGVjaz4gPSBkZWYudHlwZS5wcm90b3R5cGU7XG4gICAgLy8gT25seSBwdXNoIGEgbm9kZSBpbmRleCBpbnRvIHRoZSBwcmVPcmRlckhvb2tzIGFycmF5IGlmIHRoaXMgaXMgdGhlIGZpcnN0XG4gICAgLy8gcHJlLW9yZGVyIGhvb2sgZm91bmQgb24gdGhpcyBub2RlLlxuICAgIGlmICghcHJlT3JkZXJIb29rc0ZvdW5kICYmXG4gICAgICAgIChsaWZlQ3ljbGVIb29rcy5uZ09uQ2hhbmdlcyB8fCBsaWZlQ3ljbGVIb29rcy5uZ09uSW5pdCB8fCBsaWZlQ3ljbGVIb29rcy5uZ0RvQ2hlY2spKSB7XG4gICAgICAvLyBXZSB3aWxsIHB1c2ggdGhlIGFjdHVhbCBob29rIGZ1bmN0aW9uIGludG8gdGhpcyBhcnJheSBsYXRlciBkdXJpbmcgZGlyIGluc3RhbnRpYXRpb24uXG4gICAgICAvLyBXZSBjYW5ub3QgZG8gaXQgbm93IGJlY2F1c2Ugd2UgbXVzdCBlbnN1cmUgaG9va3MgYXJlIHJlZ2lzdGVyZWQgaW4gdGhlIHNhbWVcbiAgICAgIC8vIG9yZGVyIHRoYXQgZGlyZWN0aXZlcyBhcmUgY3JlYXRlZCAoaS5lLiBpbmplY3Rpb24gb3JkZXIpLlxuICAgICAgKHRWaWV3LnByZU9yZGVySG9va3MgPz89IFtdKS5wdXNoKHROb2RlLmluZGV4KTtcbiAgICAgIHByZU9yZGVySG9va3NGb3VuZCA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKCFwcmVPcmRlckNoZWNrSG9va3NGb3VuZCAmJiAobGlmZUN5Y2xlSG9va3MubmdPbkNoYW5nZXMgfHwgbGlmZUN5Y2xlSG9va3MubmdEb0NoZWNrKSkge1xuICAgICAgKHRWaWV3LnByZU9yZGVyQ2hlY2tIb29rcyA/Pz0gW10pLnB1c2godE5vZGUuaW5kZXgpO1xuICAgICAgcHJlT3JkZXJDaGVja0hvb2tzRm91bmQgPSB0cnVlO1xuICAgIH1cblxuICAgIGRpcmVjdGl2ZUlkeCsrO1xuICB9XG5cbiAgaW5pdGlhbGl6ZUlucHV0QW5kT3V0cHV0QWxpYXNlcyh0VmlldywgdE5vZGUsIGhvc3REaXJlY3RpdmVEZWZzKTtcbn1cblxuLyoqXG4gKiBBZGQgYGhvc3RCaW5kaW5nc2AgdG8gdGhlIGBUVmlldy5ob3N0QmluZGluZ09wQ29kZXNgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgIHRvIHdoaWNoIHRoZSBgaG9zdEJpbmRpbmdzYCBzaG91bGQgYmUgYWRkZWQuXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0aGUgZWxlbWVudCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlXG4gKiBAcGFyYW0gZGlyZWN0aXZlSWR4IERpcmVjdGl2ZSBpbmRleCBpbiB2aWV3LlxuICogQHBhcmFtIGRpcmVjdGl2ZVZhcnNJZHggV2hlcmUgd2lsbCB0aGUgZGlyZWN0aXZlJ3MgdmFycyBiZSBzdG9yZWRcbiAqIEBwYXJhbSBkZWYgYENvbXBvbmVudERlZmAvYERpcmVjdGl2ZURlZmAsIHdoaWNoIGNvbnRhaW5zIHRoZSBgaG9zdFZhcnNgL2Bob3N0QmluZGluZ3NgIHRvIGFkZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySG9zdEJpbmRpbmdPcENvZGVzKFxuICAgIHRWaWV3OiBUVmlldywgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJZHg6IG51bWJlciwgZGlyZWN0aXZlVmFyc0lkeDogbnVtYmVyLFxuICAgIGRlZjogQ29tcG9uZW50RGVmPGFueT58RGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEZpcnN0Q3JlYXRlUGFzcyh0Vmlldyk7XG5cbiAgY29uc3QgaG9zdEJpbmRpbmdzID0gZGVmLmhvc3RCaW5kaW5ncztcbiAgaWYgKGhvc3RCaW5kaW5ncykge1xuICAgIGxldCBob3N0QmluZGluZ09wQ29kZXMgPSB0Vmlldy5ob3N0QmluZGluZ09wQ29kZXM7XG4gICAgaWYgKGhvc3RCaW5kaW5nT3BDb2RlcyA9PT0gbnVsbCkge1xuICAgICAgaG9zdEJpbmRpbmdPcENvZGVzID0gdFZpZXcuaG9zdEJpbmRpbmdPcENvZGVzID0gW10gYXMgYW55IGFzIEhvc3RCaW5kaW5nT3BDb2RlcztcbiAgICB9XG4gICAgY29uc3QgZWxlbWVudEluZHggPSB+dE5vZGUuaW5kZXg7XG4gICAgaWYgKGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzKSAhPSBlbGVtZW50SW5keCkge1xuICAgICAgLy8gQ29uZGl0aW9uYWxseSBhZGQgc2VsZWN0IGVsZW1lbnQgc28gdGhhdCB3ZSBhcmUgbW9yZSBlZmZpY2llbnQgaW4gZXhlY3V0aW9uLlxuICAgICAgLy8gTk9URTogdGhpcyBpcyBzdHJpY3RseSBub3QgbmVjZXNzYXJ5IGFuZCBpdCB0cmFkZXMgY29kZSBzaXplIGZvciBydW50aW1lIHBlcmYuXG4gICAgICAvLyAoV2UgY291bGQganVzdCBhbHdheXMgYWRkIGl0LilcbiAgICAgIGhvc3RCaW5kaW5nT3BDb2Rlcy5wdXNoKGVsZW1lbnRJbmR4KTtcbiAgICB9XG4gICAgaG9zdEJpbmRpbmdPcENvZGVzLnB1c2goZGlyZWN0aXZlSWR4LCBkaXJlY3RpdmVWYXJzSWR4LCBob3N0QmluZGluZ3MpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbGFzdCBzZWxlY3RlZCBlbGVtZW50IGluZGV4IGluIHRoZSBgSG9zdEJpbmRpbmdPcENvZGVzYFxuICpcbiAqIEZvciBwZXJmIHJlYXNvbnMgd2UgZG9uJ3QgbmVlZCB0byB1cGRhdGUgdGhlIHNlbGVjdGVkIGVsZW1lbnQgaW5kZXggaW4gYEhvc3RCaW5kaW5nT3BDb2Rlc2Agb25seVxuICogaWYgaXQgY2hhbmdlcy4gVGhpcyBtZXRob2QgcmV0dXJucyB0aGUgbGFzdCBpbmRleCAob3IgJzAnIGlmIG5vdCBmb3VuZC4pXG4gKlxuICogU2VsZWN0ZWQgZWxlbWVudCBpbmRleCBhcmUgb25seSB0aGUgb25lcyB3aGljaCBhcmUgbmVnYXRpdmUuXG4gKi9cbmZ1bmN0aW9uIGxhc3RTZWxlY3RlZEVsZW1lbnRJZHgoaG9zdEJpbmRpbmdPcENvZGVzOiBIb3N0QmluZGluZ09wQ29kZXMpOiBudW1iZXIge1xuICBsZXQgaSA9IGhvc3RCaW5kaW5nT3BDb2Rlcy5sZW5ndGg7XG4gIHdoaWxlIChpID4gMCkge1xuICAgIGNvbnN0IHZhbHVlID0gaG9zdEJpbmRpbmdPcENvZGVzWy0taV07XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicgJiYgdmFsdWUgPCAwKSB7XG4gICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxuICB9XG4gIHJldHVybiAwO1xufVxuXG5cbi8qKlxuICogSW5zdGFudGlhdGUgYWxsIHRoZSBkaXJlY3RpdmVzIHRoYXQgd2VyZSBwcmV2aW91c2x5IHJlc29sdmVkIG9uIHRoZSBjdXJyZW50IG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGluc3RhbnRpYXRlQWxsRGlyZWN0aXZlcyhcbiAgICB0VmlldzogVFZpZXcsIGxWaWV3OiBMVmlldywgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSwgbmF0aXZlOiBSTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG5cbiAgLy8gVGhlIGNvbXBvbmVudCB2aWV3IG5lZWRzIHRvIGJlIGNyZWF0ZWQgYmVmb3JlIGNyZWF0aW5nIHRoZSBub2RlIGluamVjdG9yXG4gIC8vIHNpbmNlIGl0IGlzIHVzZWQgdG8gaW5qZWN0IHNvbWUgc3BlY2lhbCBzeW1ib2xzIGxpa2UgYENoYW5nZURldGVjdG9yUmVmYC5cbiAgaWYgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuICAgIGFkZENvbXBvbmVudExvZ2ljKFxuICAgICAgICBsVmlldywgdE5vZGUgYXMgVEVsZW1lbnROb2RlLFxuICAgICAgICB0Vmlldy5kYXRhW3N0YXJ0ICsgdE5vZGUuY29tcG9uZW50T2Zmc2V0XSBhcyBDb21wb25lbnREZWY8dW5rbm93bj4pO1xuICB9XG5cbiAgaWYgKCF0Vmlldy5maXJzdENyZWF0ZVBhc3MpIHtcbiAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodE5vZGUsIGxWaWV3KTtcbiAgfVxuXG4gIGF0dGFjaFBhdGNoRGF0YShuYXRpdmUsIGxWaWV3KTtcblxuICBjb25zdCBpbml0aWFsSW5wdXRzID0gdE5vZGUuaW5pdGlhbElucHV0cztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCB0VmlldywgaSwgdE5vZGUpO1xuICAgIGF0dGFjaFBhdGNoRGF0YShkaXJlY3RpdmUsIGxWaWV3KTtcblxuICAgIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgICBzZXRJbnB1dHNGcm9tQXR0cnMobFZpZXcsIGkgLSBzdGFydCwgZGlyZWN0aXZlLCBkZWYsIHROb2RlLCBpbml0aWFsSW5wdXRzISk7XG4gICAgfVxuXG4gICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgIGNvbnN0IGNvbXBvbmVudFZpZXcgPSBnZXRDb21wb25lbnRMVmlld0J5SW5kZXgodE5vZGUuaW5kZXgsIGxWaWV3KTtcbiAgICAgIGNvbXBvbmVudFZpZXdbQ09OVEVYVF0gPSBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgdFZpZXcsIGksIHROb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGludm9rZURpcmVjdGl2ZXNIb3N0QmluZGluZ3ModFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIHROb2RlOiBUTm9kZSkge1xuICBjb25zdCBzdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBlbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGVsZW1lbnRJbmRleCA9IHROb2RlLmluZGV4O1xuICBjb25zdCBjdXJyZW50RGlyZWN0aXZlSW5kZXggPSBnZXRDdXJyZW50RGlyZWN0aXZlSW5kZXgoKTtcbiAgdHJ5IHtcbiAgICBzZXRTZWxlY3RlZEluZGV4KGVsZW1lbnRJbmRleCk7XG4gICAgZm9yIChsZXQgZGlySW5kZXggPSBzdGFydDsgZGlySW5kZXggPCBlbmQ7IGRpckluZGV4KyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHRWaWV3LmRhdGFbZGlySW5kZXhdIGFzIERpcmVjdGl2ZURlZjx1bmtub3duPjtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZSA9IGxWaWV3W2RpckluZGV4XTtcbiAgICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChkaXJJbmRleCk7XG4gICAgICBpZiAoZGVmLmhvc3RCaW5kaW5ncyAhPT0gbnVsbCB8fCBkZWYuaG9zdFZhcnMgIT09IDAgfHwgZGVmLmhvc3RBdHRycyAhPT0gbnVsbCkge1xuICAgICAgICBpbnZva2VIb3N0QmluZGluZ3NJbkNyZWF0aW9uTW9kZShkZWYsIGRpcmVjdGl2ZSk7XG4gICAgICB9XG4gICAgfVxuICB9IGZpbmFsbHkge1xuICAgIHNldFNlbGVjdGVkSW5kZXgoLTEpO1xuICAgIHNldEN1cnJlbnREaXJlY3RpdmVJbmRleChjdXJyZW50RGlyZWN0aXZlSW5kZXgpO1xuICB9XG59XG5cbi8qKlxuICogSW52b2tlIHRoZSBob3N0IGJpbmRpbmdzIGluIGNyZWF0aW9uIG1vZGUuXG4gKlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYCB3aGljaCBtYXkgY29udGFpbiB0aGUgYGhvc3RCaW5kaW5nc2AgZnVuY3Rpb24uXG4gKiBAcGFyYW0gZGlyZWN0aXZlIEluc3RhbmNlIG9mIGRpcmVjdGl2ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGludm9rZUhvc3RCaW5kaW5nc0luQ3JlYXRpb25Nb2RlKGRlZjogRGlyZWN0aXZlRGVmPGFueT4sIGRpcmVjdGl2ZTogYW55KSB7XG4gIGlmIChkZWYuaG9zdEJpbmRpbmdzICE9PSBudWxsKSB7XG4gICAgZGVmLmhvc3RCaW5kaW5ncyEoUmVuZGVyRmxhZ3MuQ3JlYXRlLCBkaXJlY3RpdmUpO1xuICB9XG59XG5cbi8qKlxuICogTWF0Y2hlcyB0aGUgY3VycmVudCBub2RlIGFnYWluc3QgYWxsIGF2YWlsYWJsZSBzZWxlY3RvcnMuXG4gKiBJZiBhIGNvbXBvbmVudCBpcyBtYXRjaGVkIChhdCBtb3N0IG9uZSksIGl0IGlzIHJldHVybmVkIGluIGZpcnN0IHBvc2l0aW9uIGluIHRoZSBhcnJheS5cbiAqL1xuZnVuY3Rpb24gZmluZERpcmVjdGl2ZURlZk1hdGNoZXMoXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSk6XG4gICAgW21hdGNoZXM6IERpcmVjdGl2ZURlZjx1bmtub3duPltdLCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbF18bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRGaXJzdENyZWF0ZVBhc3ModFZpZXcpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Uk5vZGUgfCBUTm9kZVR5cGUuQW55Q29udGFpbmVyKTtcblxuICBjb25zdCByZWdpc3RyeSA9IHRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5O1xuICBsZXQgbWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W118bnVsbCA9IG51bGw7XG4gIGxldCBob3N0RGlyZWN0aXZlRGVmczogSG9zdERpcmVjdGl2ZURlZnN8bnVsbCA9IG51bGw7XG4gIGlmIChyZWdpc3RyeSkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgcmVnaXN0cnkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGRlZiA9IHJlZ2lzdHJ5W2ldIGFzIENvbXBvbmVudERlZjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChpc05vZGVNYXRjaGluZ1NlbGVjdG9yTGlzdCh0Tm9kZSwgZGVmLnNlbGVjdG9ycyEsIC8qIGlzUHJvamVjdGlvbk1vZGUgKi8gZmFsc2UpKSB7XG4gICAgICAgIG1hdGNoZXMgfHwgKG1hdGNoZXMgPSBbXSk7XG5cbiAgICAgICAgaWYgKGlzQ29tcG9uZW50RGVmKGRlZikpIHtcbiAgICAgICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgICAgICBhc3NlcnRUTm9kZVR5cGUoXG4gICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICAgICAgICAgIGBcIiR7dE5vZGUudmFsdWV9XCIgdGFncyBjYW5ub3QgYmUgdXNlZCBhcyBjb21wb25lbnQgaG9zdHMuIGAgK1xuICAgICAgICAgICAgICAgICAgICBgUGxlYXNlIHVzZSBhIGRpZmZlcmVudCB0YWcgdG8gYWN0aXZhdGUgdGhlICR7c3RyaW5naWZ5KGRlZi50eXBlKX0gY29tcG9uZW50LmApO1xuXG4gICAgICAgICAgICBpZiAoaXNDb21wb25lbnRIb3N0KHROb2RlKSkge1xuICAgICAgICAgICAgICB0aHJvd011bHRpcGxlQ29tcG9uZW50RXJyb3IodE5vZGUsIG1hdGNoZXMuZmluZChpc0NvbXBvbmVudERlZikhLnR5cGUsIGRlZi50eXBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBDb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgZnJvbnQgb2YgdGhlIG1hdGNoZXMgYXJyYXkgc28gdGhhdCB0aGVpciBsaWZlY3ljbGVcbiAgICAgICAgICAvLyBob29rcyBydW4gYmVmb3JlIGFueSBkaXJlY3RpdmUgbGlmZWN5Y2xlIGhvb2tzLiBUaGlzIGFwcGVhcnMgdG8gYmUgZm9yIFZpZXdFbmdpbmVcbiAgICAgICAgICAvLyBjb21wYXRpYmlsaXR5LiBUaGlzIGxvZ2ljIGRvZXNuJ3QgbWFrZSBzZW5zZSB3aXRoIGhvc3QgZGlyZWN0aXZlcywgYmVjYXVzZSBpdFxuICAgICAgICAgIC8vIHdvdWxkIGFsbG93IHRoZSBob3N0IGRpcmVjdGl2ZXMgdG8gdW5kbyBhbnkgb3ZlcnJpZGVzIHRoZSBob3N0IG1heSBoYXZlIG1hZGUuXG4gICAgICAgICAgLy8gVG8gaGFuZGxlIHRoaXMgY2FzZSwgdGhlIGhvc3QgZGlyZWN0aXZlcyBvZiBjb21wb25lbnRzIGFyZSBpbnNlcnRlZCBhdCB0aGUgYmVnaW5uaW5nXG4gICAgICAgICAgLy8gb2YgdGhlIGFycmF5LCBmb2xsb3dlZCBieSB0aGUgY29tcG9uZW50LiBBcyBzdWNoLCB0aGUgaW5zZXJ0aW9uIG9yZGVyIGlzIGFzIGZvbGxvd3M6XG4gICAgICAgICAgLy8gMS4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byB0aGUgc2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMi4gU2VsZWN0b3ItbWF0Y2hlZCBjb21wb25lbnQuXG4gICAgICAgICAgLy8gMy4gSG9zdCBkaXJlY3RpdmVzIGJlbG9uZ2luZyB0byBzZWxlY3Rvci1tYXRjaGVkIGRpcmVjdGl2ZXMuXG4gICAgICAgICAgLy8gNC4gU2VsZWN0b3ItbWF0Y2hlZCBkaXJlY3RpdmVzLlxuICAgICAgICAgIGlmIChkZWYuZmluZEhvc3REaXJlY3RpdmVEZWZzICE9PSBudWxsKSB7XG4gICAgICAgICAgICBjb25zdCBob3N0RGlyZWN0aXZlTWF0Y2hlczogRGlyZWN0aXZlRGVmPHVua25vd24+W10gPSBbXTtcbiAgICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgICAgZGVmLmZpbmRIb3N0RGlyZWN0aXZlRGVmcyhkZWYsIGhvc3REaXJlY3RpdmVNYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmcyk7XG4gICAgICAgICAgICAvLyBBZGQgYWxsIGhvc3QgZGlyZWN0aXZlcyBkZWNsYXJlZCBvbiB0aGlzIGNvbXBvbmVudCwgZm9sbG93ZWQgYnkgdGhlIGNvbXBvbmVudCBpdHNlbGYuXG4gICAgICAgICAgICAvLyBIb3N0IGRpcmVjdGl2ZXMgc2hvdWxkIGV4ZWN1dGUgZmlyc3Qgc28gdGhlIGhvc3QgaGFzIGEgY2hhbmNlIHRvIG92ZXJyaWRlIGNoYW5nZXNcbiAgICAgICAgICAgIC8vIHRvIHRoZSBET00gbWFkZSBieSB0aGVtLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KC4uLmhvc3REaXJlY3RpdmVNYXRjaGVzLCBkZWYpO1xuICAgICAgICAgICAgLy8gQ29tcG9uZW50IGlzIG9mZnNldCBzdGFydGluZyBmcm9tIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGhvc3QgZGlyZWN0aXZlcyBhcnJheS5cbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudE9mZnNldCA9IGhvc3REaXJlY3RpdmVNYXRjaGVzLmxlbmd0aDtcbiAgICAgICAgICAgIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXcsIHROb2RlLCBjb21wb25lbnRPZmZzZXQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBObyBob3N0IGRpcmVjdGl2ZXMgb24gdGhpcyBjb21wb25lbnQsIGp1c3QgYWRkIHRoZVxuICAgICAgICAgICAgLy8gY29tcG9uZW50IGRlZiB0byB0aGUgYmVnaW5uaW5nIG9mIHRoZSBtYXRjaGVzLlxuICAgICAgICAgICAgbWF0Y2hlcy51bnNoaWZ0KGRlZik7XG4gICAgICAgICAgICBtYXJrQXNDb21wb25lbnRIb3N0KHRWaWV3LCB0Tm9kZSwgMCk7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIEFwcGVuZCBhbnkgaG9zdCBkaXJlY3RpdmVzIHRvIHRoZSBtYXRjaGVzIGZpcnN0LlxuICAgICAgICAgIGhvc3REaXJlY3RpdmVEZWZzID0gaG9zdERpcmVjdGl2ZURlZnMgfHwgbmV3IE1hcCgpO1xuICAgICAgICAgIGRlZi5maW5kSG9zdERpcmVjdGl2ZURlZnM/LihkZWYsIG1hdGNoZXMsIGhvc3REaXJlY3RpdmVEZWZzKTtcbiAgICAgICAgICBtYXRjaGVzLnB1c2goZGVmKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBuZ0Rldk1vZGUgJiYgbWF0Y2hlcyAhPT0gbnVsbCAmJiBhc3NlcnROb0R1cGxpY2F0ZURpcmVjdGl2ZXMobWF0Y2hlcyk7XG4gIHJldHVybiBtYXRjaGVzID09PSBudWxsID8gbnVsbCA6IFttYXRjaGVzLCBob3N0RGlyZWN0aXZlRGVmc107XG59XG5cbi8qKlxuICogTWFya3MgYSBnaXZlbiBUTm9kZSBhcyBhIGNvbXBvbmVudCdzIGhvc3QuIFRoaXMgY29uc2lzdHMgb2Y6XG4gKiAtIHNldHRpbmcgdGhlIGNvbXBvbmVudCBvZmZzZXQgb24gdGhlIFROb2RlLlxuICogLSBzdG9yaW5nIGluZGV4IG9mIGNvbXBvbmVudCdzIGhvc3QgZWxlbWVudCBzbyBpdCB3aWxsIGJlIHF1ZXVlZCBmb3IgdmlldyByZWZyZXNoIGR1cmluZyBDRC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG1hcmtBc0NvbXBvbmVudEhvc3QodFZpZXc6IFRWaWV3LCBob3N0VE5vZGU6IFROb2RlLCBjb21wb25lbnRPZmZzZXQ6IG51bWJlcik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Rmlyc3RDcmVhdGVQYXNzKHRWaWV3KTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEdyZWF0ZXJUaGFuKGNvbXBvbmVudE9mZnNldCwgLTEsICdjb21wb25lbnRPZmZzZXQgbXVzdCBiZSBncmVhdCB0aGFuIC0xJyk7XG4gIGhvc3RUTm9kZS5jb21wb25lbnRPZmZzZXQgPSBjb21wb25lbnRPZmZzZXQ7XG4gICh0Vmlldy5jb21wb25lbnRzID8/PSBbXSkucHVzaChob3N0VE5vZGUuaW5kZXgpO1xufVxuXG4vKiogQ2FjaGVzIGxvY2FsIG5hbWVzIGFuZCB0aGVpciBtYXRjaGluZyBkaXJlY3RpdmUgaW5kaWNlcyBmb3IgcXVlcnkgYW5kIHRlbXBsYXRlIGxvb2t1cHMuICovXG5mdW5jdGlvbiBjYWNoZU1hdGNoaW5nTG9jYWxOYW1lcyhcbiAgICB0Tm9kZTogVE5vZGUsIGxvY2FsUmVmczogc3RyaW5nW118bnVsbCwgZXhwb3J0c01hcDoge1trZXk6IHN0cmluZ106IG51bWJlcn0pOiB2b2lkIHtcbiAgaWYgKGxvY2FsUmVmcykge1xuICAgIGNvbnN0IGxvY2FsTmFtZXM6IChzdHJpbmd8bnVtYmVyKVtdID0gdE5vZGUubG9jYWxOYW1lcyA9IFtdO1xuXG4gICAgLy8gTG9jYWwgbmFtZXMgbXVzdCBiZSBzdG9yZWQgaW4gdE5vZGUgaW4gdGhlIHNhbWUgb3JkZXIgdGhhdCBsb2NhbFJlZnMgYXJlIGRlZmluZWRcbiAgICAvLyBpbiB0aGUgdGVtcGxhdGUgdG8gZW5zdXJlIHRoZSBkYXRhIGlzIGxvYWRlZCBpbiB0aGUgc2FtZSBzbG90cyBhcyB0aGVpciByZWZzXG4gICAgLy8gaW4gdGhlIHRlbXBsYXRlIChmb3IgdGVtcGxhdGUgcXVlcmllcykuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsb2NhbFJlZnMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGluZGV4ID0gZXhwb3J0c01hcFtsb2NhbFJlZnNbaSArIDFdXTtcbiAgICAgIGlmIChpbmRleCA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgUnVudGltZUVycm9yKFxuICAgICAgICAgICAgUnVudGltZUVycm9yQ29kZS5FWFBPUlRfTk9UX0ZPVU5ELFxuICAgICAgICAgICAgbmdEZXZNb2RlICYmIGBFeHBvcnQgb2YgbmFtZSAnJHtsb2NhbFJlZnNbaSArIDFdfScgbm90IGZvdW5kIWApO1xuICAgICAgbG9jYWxOYW1lcy5wdXNoKGxvY2FsUmVmc1tpXSwgaW5kZXgpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEJ1aWxkcyB1cCBhbiBleHBvcnQgbWFwIGFzIGRpcmVjdGl2ZXMgYXJlIGNyZWF0ZWQsIHNvIGxvY2FsIHJlZnMgY2FuIGJlIHF1aWNrbHkgbWFwcGVkXG4gKiB0byB0aGVpciBkaXJlY3RpdmUgaW5zdGFuY2VzLlxuICovXG5mdW5jdGlvbiBzYXZlTmFtZVRvRXhwb3J0TWFwKFxuICAgIGRpcmVjdGl2ZUlkeDogbnVtYmVyLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+fENvbXBvbmVudERlZjxhbnk+LFxuICAgIGV4cG9ydHNNYXA6IHtba2V5OiBzdHJpbmddOiBudW1iZXJ9fG51bGwpIHtcbiAgaWYgKGV4cG9ydHNNYXApIHtcbiAgICBpZiAoZGVmLmV4cG9ydEFzKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5leHBvcnRBcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBleHBvcnRzTWFwW2RlZi5leHBvcnRBc1tpXV0gPSBkaXJlY3RpdmVJZHg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChpc0NvbXBvbmVudERlZihkZWYpKSBleHBvcnRzTWFwWycnXSA9IGRpcmVjdGl2ZUlkeDtcbiAgfVxufVxuXG4vKipcbiAqIEluaXRpYWxpemVzIHRoZSBmbGFncyBvbiB0aGUgY3VycmVudCBub2RlLCBzZXR0aW5nIGFsbCBpbmRpY2VzIHRvIHRoZSBpbml0aWFsIGluZGV4LFxuICogdGhlIGRpcmVjdGl2ZSBjb3VudCB0byAwLCBhbmQgYWRkaW5nIHRoZSBpc0NvbXBvbmVudCBmbGFnLlxuICogQHBhcmFtIGluZGV4IHRoZSBpbml0aWFsIGluZGV4XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbml0VE5vZGVGbGFncyh0Tm9kZTogVE5vZGUsIGluZGV4OiBudW1iZXIsIG51bWJlck9mRGlyZWN0aXZlczogbnVtYmVyKSB7XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0Tm90RXF1YWwoXG4gICAgICAgICAgbnVtYmVyT2ZEaXJlY3RpdmVzLCB0Tm9kZS5kaXJlY3RpdmVFbmQgLSB0Tm9kZS5kaXJlY3RpdmVTdGFydCxcbiAgICAgICAgICAnUmVhY2hlZCB0aGUgbWF4IG51bWJlciBvZiBkaXJlY3RpdmVzJyk7XG4gIHROb2RlLmZsYWdzIHw9IFROb2RlRmxhZ3MuaXNEaXJlY3RpdmVIb3N0O1xuICAvLyBXaGVuIHRoZSBmaXJzdCBkaXJlY3RpdmUgaXMgY3JlYXRlZCBvbiBhIG5vZGUsIHNhdmUgdGhlIGluZGV4XG4gIHROb2RlLmRpcmVjdGl2ZVN0YXJ0ID0gaW5kZXg7XG4gIHROb2RlLmRpcmVjdGl2ZUVuZCA9IGluZGV4ICsgbnVtYmVyT2ZEaXJlY3RpdmVzO1xuICB0Tm9kZS5wcm92aWRlckluZGV4ZXMgPSBpbmRleDtcbn1cblxuLyoqXG4gKiBTZXR1cCBkaXJlY3RpdmUgZm9yIGluc3RhbnRpYXRpb24uXG4gKlxuICogV2UgbmVlZCB0byBjcmVhdGUgYSBgTm9kZUluamVjdG9yRmFjdG9yeWAgd2hpY2ggaXMgdGhlbiBpbnNlcnRlZCBpbiBib3RoIHRoZSBgQmx1ZXByaW50YCBhcyB3ZWxsXG4gKiBhcyBgTFZpZXdgLiBgVFZpZXdgIGdldHMgdGhlIGBEaXJlY3RpdmVEZWZgLlxuICpcbiAqIEBwYXJhbSB0VmlldyBgVFZpZXdgXG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYFxuICogQHBhcmFtIGxWaWV3IGBMVmlld2BcbiAqIEBwYXJhbSBkaXJlY3RpdmVJbmRleCBJbmRleCB3aGVyZSB0aGUgZGlyZWN0aXZlIHdpbGwgYmUgc3RvcmVkIGluIHRoZSBFeHBhbmRvLlxuICogQHBhcmFtIGRlZiBgRGlyZWN0aXZlRGVmYFxuICovXG5leHBvcnQgZnVuY3Rpb24gY29uZmlndXJlVmlld1dpdGhEaXJlY3RpdmU8VD4oXG4gICAgdFZpZXc6IFRWaWV3LCB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgZGVmOiBEaXJlY3RpdmVEZWY8VD4pOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmXG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbk9yRXF1YWwoZGlyZWN0aXZlSW5kZXgsIEhFQURFUl9PRkZTRVQsICdNdXN0IGJlIGluIEV4cGFuZG8gc2VjdGlvbicpO1xuICB0Vmlldy5kYXRhW2RpcmVjdGl2ZUluZGV4XSA9IGRlZjtcbiAgY29uc3QgZGlyZWN0aXZlRmFjdG9yeSA9XG4gICAgICBkZWYuZmFjdG9yeSB8fCAoKGRlZiBhcyBXcml0YWJsZTxEaXJlY3RpdmVEZWY8VD4+KS5mYWN0b3J5ID0gZ2V0RmFjdG9yeURlZihkZWYudHlwZSwgdHJ1ZSkpO1xuICAvLyBFdmVuIHRob3VnaCBgZGlyZWN0aXZlRmFjdG9yeWAgd2lsbCBhbHJlYWR5IGJlIHVzaW5nIGDJtcm1ZGlyZWN0aXZlSW5qZWN0YCBpbiBpdHMgZ2VuZXJhdGVkIGNvZGUsXG4gIC8vIHdlIGFsc28gd2FudCB0byBzdXBwb3J0IGBpbmplY3QoKWAgZGlyZWN0bHkgZnJvbSB0aGUgZGlyZWN0aXZlIGNvbnN0cnVjdG9yIGNvbnRleHQgc28gd2Ugc2V0XG4gIC8vIGDJtcm1ZGlyZWN0aXZlSW5qZWN0YCBhcyB0aGUgaW5qZWN0IGltcGxlbWVudGF0aW9uIGhlcmUgdG9vLlxuICBjb25zdCBub2RlSW5qZWN0b3JGYWN0b3J5ID1cbiAgICAgIG5ldyBOb2RlSW5qZWN0b3JGYWN0b3J5KGRpcmVjdGl2ZUZhY3RvcnksIGlzQ29tcG9uZW50RGVmKGRlZiksIMm1ybVkaXJlY3RpdmVJbmplY3QpO1xuICB0Vmlldy5ibHVlcHJpbnRbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcbiAgbFZpZXdbZGlyZWN0aXZlSW5kZXhdID0gbm9kZUluamVjdG9yRmFjdG9yeTtcblxuICByZWdpc3Rlckhvc3RCaW5kaW5nT3BDb2RlcyhcbiAgICAgIHRWaWV3LCB0Tm9kZSwgZGlyZWN0aXZlSW5kZXgsIGFsbG9jRXhwYW5kbyh0VmlldywgbFZpZXcsIGRlZi5ob3N0VmFycywgTk9fQ0hBTkdFKSwgZGVmKTtcbn1cblxuZnVuY3Rpb24gYWRkQ29tcG9uZW50TG9naWM8VD4obFZpZXc6IExWaWV3LCBob3N0VE5vZGU6IFRFbGVtZW50Tm9kZSwgZGVmOiBDb21wb25lbnREZWY8VD4pOiB2b2lkIHtcbiAgY29uc3QgbmF0aXZlID0gZ2V0TmF0aXZlQnlUTm9kZShob3N0VE5vZGUsIGxWaWV3KSBhcyBSRWxlbWVudDtcbiAgY29uc3QgdFZpZXcgPSBnZXRPckNyZWF0ZUNvbXBvbmVudFRWaWV3KGRlZik7XG5cbiAgLy8gT25seSBjb21wb25lbnQgdmlld3Mgc2hvdWxkIGJlIGFkZGVkIHRvIHRoZSB2aWV3IHRyZWUgZGlyZWN0bHkuIEVtYmVkZGVkIHZpZXdzIGFyZVxuICAvLyBhY2Nlc3NlZCB0aHJvdWdoIHRoZWlyIGNvbnRhaW5lcnMgYmVjYXVzZSB0aGV5IG1heSBiZSByZW1vdmVkIC8gcmUtYWRkZWQgbGF0ZXIuXG4gIGNvbnN0IHJlbmRlcmVyRmFjdG9yeSA9IGxWaWV3W0VOVklST05NRU5UXS5yZW5kZXJlckZhY3Rvcnk7XG4gIGxldCBsVmlld0ZsYWdzID0gTFZpZXdGbGFncy5DaGVja0Fsd2F5cztcbiAgaWYgKGRlZi5zaWduYWxzKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuU2lnbmFsVmlldztcbiAgfSBlbHNlIGlmIChkZWYub25QdXNoKSB7XG4gICAgbFZpZXdGbGFncyA9IExWaWV3RmxhZ3MuRGlydHk7XG4gIH1cbiAgY29uc3QgY29tcG9uZW50VmlldyA9IGFkZFRvVmlld1RyZWUoXG4gICAgICBsVmlldyxcbiAgICAgIGNyZWF0ZUxWaWV3KFxuICAgICAgICAgIGxWaWV3LCB0VmlldywgbnVsbCwgbFZpZXdGbGFncywgbmF0aXZlLCBob3N0VE5vZGUgYXMgVEVsZW1lbnROb2RlLCBudWxsLFxuICAgICAgICAgIHJlbmRlcmVyRmFjdG9yeS5jcmVhdGVSZW5kZXJlcihuYXRpdmUsIGRlZiksIG51bGwsIG51bGwsIG51bGwpKTtcblxuICAvLyBDb21wb25lbnQgdmlldyB3aWxsIGFsd2F5cyBiZSBjcmVhdGVkIGJlZm9yZSBhbnkgaW5qZWN0ZWQgTENvbnRhaW5lcnMsXG4gIC8vIHNvIHRoaXMgaXMgYSByZWd1bGFyIGVsZW1lbnQsIHdyYXAgaXQgd2l0aCB0aGUgY29tcG9uZW50IHZpZXdcbiAgbFZpZXdbaG9zdFROb2RlLmluZGV4XSA9IGNvbXBvbmVudFZpZXc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBlbGVtZW50QXR0cmlidXRlSW50ZXJuYWwoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCxcbiAgICBuYW1lc3BhY2U6IHN0cmluZ3xudWxsfHVuZGVmaW5lZCkge1xuICBpZiAobmdEZXZNb2RlKSB7XG4gICAgYXNzZXJ0Tm90U2FtZSh2YWx1ZSwgTk9fQ0hBTkdFIGFzIGFueSwgJ0luY29taW5nIHZhbHVlIHNob3VsZCBuZXZlciBiZSBOT19DSEFOR0UuJyk7XG4gICAgdmFsaWRhdGVBZ2FpbnN0RXZlbnRBdHRyaWJ1dGVzKG5hbWUpO1xuICAgIGFzc2VydFROb2RlVHlwZShcbiAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5FbGVtZW50LFxuICAgICAgICBgQXR0ZW1wdGVkIHRvIHNldCBhdHRyaWJ1dGUgXFxgJHtuYW1lfVxcYCBvbiBhIGNvbnRhaW5lciBub2RlLiBgICtcbiAgICAgICAgICAgIGBIb3N0IGJpbmRpbmdzIGFyZSBub3QgdmFsaWQgb24gbmctY29udGFpbmVyIG9yIG5nLXRlbXBsYXRlLmApO1xuICB9XG4gIGNvbnN0IGVsZW1lbnQgPSBnZXROYXRpdmVCeVROb2RlKHROb2RlLCBsVmlldykgYXMgUkVsZW1lbnQ7XG4gIHNldEVsZW1lbnRBdHRyaWJ1dGUobFZpZXdbUkVOREVSRVJdLCBlbGVtZW50LCBuYW1lc3BhY2UsIHROb2RlLnZhbHVlLCBuYW1lLCB2YWx1ZSwgc2FuaXRpemVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNldEVsZW1lbnRBdHRyaWJ1dGUoXG4gICAgcmVuZGVyZXI6IFJlbmRlcmVyLCBlbGVtZW50OiBSRWxlbWVudCwgbmFtZXNwYWNlOiBzdHJpbmd8bnVsbHx1bmRlZmluZWQsIHRhZ05hbWU6IHN0cmluZ3xudWxsLFxuICAgIG5hbWU6IHN0cmluZywgdmFsdWU6IGFueSwgc2FuaXRpemVyOiBTYW5pdGl6ZXJGbnxudWxsfHVuZGVmaW5lZCkge1xuICBpZiAodmFsdWUgPT0gbnVsbCkge1xuICAgIG5nRGV2TW9kZSAmJiBuZ0Rldk1vZGUucmVuZGVyZXJSZW1vdmVBdHRyaWJ1dGUrKztcbiAgICByZW5kZXJlci5yZW1vdmVBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgbmFtZXNwYWNlKTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgbmdEZXZNb2RlLnJlbmRlcmVyU2V0QXR0cmlidXRlKys7XG4gICAgY29uc3Qgc3RyVmFsdWUgPVxuICAgICAgICBzYW5pdGl6ZXIgPT0gbnVsbCA/IHJlbmRlclN0cmluZ2lmeSh2YWx1ZSkgOiBzYW5pdGl6ZXIodmFsdWUsIHRhZ05hbWUgfHwgJycsIG5hbWUpO1xuXG5cbiAgICByZW5kZXJlci5zZXRBdHRyaWJ1dGUoZWxlbWVudCwgbmFtZSwgc3RyVmFsdWUgYXMgc3RyaW5nLCBuYW1lc3BhY2UpO1xuICB9XG59XG5cbi8qKlxuICogU2V0cyBpbml0aWFsIGlucHV0IHByb3BlcnRpZXMgb24gZGlyZWN0aXZlIGluc3RhbmNlcyBmcm9tIGF0dHJpYnV0ZSBkYXRhXG4gKlxuICogQHBhcmFtIGxWaWV3IEN1cnJlbnQgTFZpZXcgdGhhdCBpcyBiZWluZyBwcm9jZXNzZWQuXG4gKiBAcGFyYW0gZGlyZWN0aXZlSW5kZXggSW5kZXggb2YgdGhlIGRpcmVjdGl2ZSBpbiBkaXJlY3RpdmVzIGFycmF5XG4gKiBAcGFyYW0gaW5zdGFuY2UgSW5zdGFuY2Ugb2YgdGhlIGRpcmVjdGl2ZSBvbiB3aGljaCB0byBzZXQgdGhlIGluaXRpYWwgaW5wdXRzXG4gKiBAcGFyYW0gZGVmIFRoZSBkaXJlY3RpdmUgZGVmIHRoYXQgY29udGFpbnMgdGhlIGxpc3Qgb2YgaW5wdXRzXG4gKiBAcGFyYW0gdE5vZGUgVGhlIHN0YXRpYyBkYXRhIGZvciB0aGlzIG5vZGVcbiAqL1xuZnVuY3Rpb24gc2V0SW5wdXRzRnJvbUF0dHJzPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgaW5zdGFuY2U6IFQsIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCB0Tm9kZTogVE5vZGUsXG4gICAgaW5pdGlhbElucHV0RGF0YTogSW5pdGlhbElucHV0RGF0YSk6IHZvaWQge1xuICBjb25zdCBpbml0aWFsSW5wdXRzOiBJbml0aWFsSW5wdXRzfG51bGwgPSBpbml0aWFsSW5wdXREYXRhIVtkaXJlY3RpdmVJbmRleF07XG4gIGlmIChpbml0aWFsSW5wdXRzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbml0aWFsSW5wdXRzLmxlbmd0aDspIHtcbiAgICAgIGNvbnN0IHB1YmxpY05hbWUgPSBpbml0aWFsSW5wdXRzW2krK107XG4gICAgICBjb25zdCBwcml2YXRlTmFtZSA9IGluaXRpYWxJbnB1dHNbaSsrXTtcbiAgICAgIGNvbnN0IHZhbHVlID0gaW5pdGlhbElucHV0c1tpKytdO1xuXG4gICAgICB3cml0ZVRvRGlyZWN0aXZlSW5wdXQ8VD4oZGVmLCBpbnN0YW5jZSwgcHVibGljTmFtZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcblxuICAgICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgICBjb25zdCBuYXRpdmVFbGVtZW50ID0gZ2V0TmF0aXZlQnlUTm9kZSh0Tm9kZSwgbFZpZXcpIGFzIFJFbGVtZW50O1xuICAgICAgICBzZXROZ1JlZmxlY3RQcm9wZXJ0eShsVmlldywgbmF0aXZlRWxlbWVudCwgdE5vZGUudHlwZSwgcHJpdmF0ZU5hbWUsIHZhbHVlKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVUb0RpcmVjdGl2ZUlucHV0PFQ+KFxuICAgIGRlZjogRGlyZWN0aXZlRGVmPFQ+LCBpbnN0YW5jZTogVCwgcHVibGljTmFtZTogc3RyaW5nLCBwcml2YXRlTmFtZTogc3RyaW5nLCB2YWx1ZTogc3RyaW5nKSB7XG4gIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICB0cnkge1xuICAgIGNvbnN0IGlucHV0VHJhbnNmb3JtcyA9IGRlZi5pbnB1dFRyYW5zZm9ybXM7XG4gICAgaWYgKGlucHV0VHJhbnNmb3JtcyAhPT0gbnVsbCAmJiBpbnB1dFRyYW5zZm9ybXMuaGFzT3duUHJvcGVydHkocHJpdmF0ZU5hbWUpKSB7XG4gICAgICB2YWx1ZSA9IGlucHV0VHJhbnNmb3Jtc1twcml2YXRlTmFtZV0uY2FsbChpbnN0YW5jZSwgdmFsdWUpO1xuICAgIH1cbiAgICBpZiAoZGVmLnNldElucHV0ICE9PSBudWxsKSB7XG4gICAgICBkZWYuc2V0SW5wdXQoaW5zdGFuY2UsIHZhbHVlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIChpbnN0YW5jZSBhcyBhbnkpW3ByaXZhdGVOYW1lXSA9IHZhbHVlO1xuICAgIH1cbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRBY3RpdmVDb25zdW1lcihwcmV2Q29uc3VtZXIpO1xuICB9XG59XG5cbi8qKlxuICogR2VuZXJhdGVzIGluaXRpYWxJbnB1dERhdGEgZm9yIGEgbm9kZSBhbmQgc3RvcmVzIGl0IGluIHRoZSB0ZW1wbGF0ZSdzIHN0YXRpYyBzdG9yYWdlXG4gKiBzbyBzdWJzZXF1ZW50IHRlbXBsYXRlIGludm9jYXRpb25zIGRvbid0IGhhdmUgdG8gcmVjYWxjdWxhdGUgaXQuXG4gKlxuICogaW5pdGlhbElucHV0RGF0YSBpcyBhbiBhcnJheSBjb250YWluaW5nIHZhbHVlcyB0aGF0IG5lZWQgdG8gYmUgc2V0IGFzIGlucHV0IHByb3BlcnRpZXNcbiAqIGZvciBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSwgYnV0IG9ubHkgb25jZSBvbiBjcmVhdGlvbi4gV2UgbmVlZCB0aGlzIGFycmF5IHRvIHN1cHBvcnRcbiAqIHRoZSBjYXNlIHdoZXJlIHlvdSBzZXQgYW4gQElucHV0IHByb3BlcnR5IG9mIGEgZGlyZWN0aXZlIHVzaW5nIGF0dHJpYnV0ZS1saWtlIHN5bnRheC5cbiAqIGUuZy4gaWYgeW91IGhhdmUgYSBgbmFtZWAgQElucHV0LCB5b3UgY2FuIHNldCBpdCBvbmNlIGxpa2UgdGhpczpcbiAqXG4gKiA8bXktY29tcG9uZW50IG5hbWU9XCJCZXNzXCI+PC9teS1jb21wb25lbnQ+XG4gKlxuICogQHBhcmFtIGlucHV0cyBJbnB1dCBhbGlhcyBtYXAgdGhhdCB3YXMgZ2VuZXJhdGVkIGZyb20gdGhlIGRpcmVjdGl2ZSBkZWYgaW5wdXRzLlxuICogQHBhcmFtIGRpcmVjdGl2ZUluZGV4IEluZGV4IG9mIHRoZSBkaXJlY3RpdmUgdGhhdCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlxuICogQHBhcmFtIGF0dHJzIFN0YXRpYyBhdHRycyBvbiB0aGlzIG5vZGUuXG4gKi9cbmZ1bmN0aW9uIGdlbmVyYXRlSW5pdGlhbElucHV0cyhcbiAgICBpbnB1dHM6IFByb3BlcnR5QWxpYXNlcywgZGlyZWN0aXZlSW5kZXg6IG51bWJlciwgYXR0cnM6IFRBdHRyaWJ1dGVzKTogSW5pdGlhbElucHV0c3xudWxsIHtcbiAgbGV0IGlucHV0c1RvU3RvcmU6IEluaXRpYWxJbnB1dHN8bnVsbCA9IG51bGw7XG4gIGxldCBpID0gMDtcbiAgd2hpbGUgKGkgPCBhdHRycy5sZW5ndGgpIHtcbiAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgLy8gV2UgZG8gbm90IGFsbG93IGlucHV0cyBvbiBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMuXG4gICAgICBpICs9IDQ7XG4gICAgICBjb250aW51ZTtcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuUHJvamVjdEFzKSB7XG4gICAgICAvLyBTa2lwIG92ZXIgdGhlIGBuZ1Byb2plY3RBc2AgdmFsdWUuXG4gICAgICBpICs9IDI7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICAvLyBJZiB3ZSBoaXQgYW55IG90aGVyIGF0dHJpYnV0ZSBtYXJrZXJzLCB3ZSdyZSBkb25lIGFueXdheS4gTm9uZSBvZiB0aG9zZSBhcmUgdmFsaWQgaW5wdXRzLlxuICAgIGlmICh0eXBlb2YgYXR0ck5hbWUgPT09ICdudW1iZXInKSBicmVhaztcblxuICAgIGlmIChpbnB1dHMuaGFzT3duUHJvcGVydHkoYXR0ck5hbWUgYXMgc3RyaW5nKSkge1xuICAgICAgaWYgKGlucHV0c1RvU3RvcmUgPT09IG51bGwpIGlucHV0c1RvU3RvcmUgPSBbXTtcblxuICAgICAgLy8gRmluZCB0aGUgaW5wdXQncyBwdWJsaWMgbmFtZSBmcm9tIHRoZSBpbnB1dCBzdG9yZS4gTm90ZSB0aGF0IHdlIGNhbiBiZSBmb3VuZCBlYXNpZXJcbiAgICAgIC8vIHRocm91Z2ggdGhlIGRpcmVjdGl2ZSBkZWYsIGJ1dCB3ZSB3YW50IHRvIGRvIGl0IHVzaW5nIHRoZSBpbnB1dHMgc3RvcmUgc28gdGhhdCBpdCBjYW5cbiAgICAgIC8vIGFjY291bnQgZm9yIGhvc3QgZGlyZWN0aXZlIGFsaWFzZXMuXG4gICAgICBjb25zdCBpbnB1dENvbmZpZyA9IGlucHV0c1thdHRyTmFtZSBhcyBzdHJpbmddO1xuICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBpbnB1dENvbmZpZy5sZW5ndGg7IGogKz0gMikge1xuICAgICAgICBpZiAoaW5wdXRDb25maWdbal0gPT09IGRpcmVjdGl2ZUluZGV4KSB7XG4gICAgICAgICAgaW5wdXRzVG9TdG9yZS5wdXNoKFxuICAgICAgICAgICAgICBhdHRyTmFtZSBhcyBzdHJpbmcsIGlucHV0Q29uZmlnW2ogKyAxXSBhcyBzdHJpbmcsIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmcpO1xuICAgICAgICAgIC8vIEEgZGlyZWN0aXZlIGNhbid0IGhhdmUgbXVsdGlwbGUgaW5wdXRzIHdpdGggdGhlIHNhbWUgbmFtZSBzbyB3ZSBjYW4gYnJlYWsgaGVyZS5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGkgKz0gMjtcbiAgfVxuICByZXR1cm4gaW5wdXRzVG9TdG9yZTtcbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gVmlld0NvbnRhaW5lciAmIFZpZXdcbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIExDb250YWluZXIsIGVpdGhlciBmcm9tIGEgY29udGFpbmVyIGluc3RydWN0aW9uLCBvciBmb3IgYSBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEBwYXJhbSBob3N0TmF0aXZlIFRoZSBob3N0IGVsZW1lbnQgZm9yIHRoZSBMQ29udGFpbmVyXG4gKiBAcGFyYW0gaG9zdFROb2RlIFRoZSBob3N0IFROb2RlIGZvciB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIGN1cnJlbnRWaWV3IFRoZSBwYXJlbnQgdmlldyBvZiB0aGUgTENvbnRhaW5lclxuICogQHBhcmFtIG5hdGl2ZSBUaGUgbmF0aXZlIGNvbW1lbnQgZWxlbWVudFxuICogQHBhcmFtIGlzRm9yVmlld0NvbnRhaW5lclJlZiBPcHRpb25hbCBhIGZsYWcgaW5kaWNhdGluZyB0aGUgVmlld0NvbnRhaW5lclJlZiBjYXNlXG4gKiBAcmV0dXJucyBMQ29udGFpbmVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVMQ29udGFpbmVyKFxuICAgIGhvc3ROYXRpdmU6IFJFbGVtZW50fFJDb21tZW50fExWaWV3LCBjdXJyZW50VmlldzogTFZpZXcsIG5hdGl2ZTogUkNvbW1lbnQsXG4gICAgdE5vZGU6IFROb2RlKTogTENvbnRhaW5lciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRMVmlldyhjdXJyZW50Vmlldyk7XG4gIGNvbnN0IGxDb250YWluZXI6IExDb250YWluZXIgPSBbXG4gICAgaG9zdE5hdGl2ZSwgICAvLyBob3N0IG5hdGl2ZVxuICAgIHRydWUsICAgICAgICAgLy8gQm9vbGVhbiBgdHJ1ZWAgaW4gdGhpcyBwb3NpdGlvbiBzaWduaWZpZXMgdGhhdCB0aGlzIGlzIGFuIGBMQ29udGFpbmVyYFxuICAgIGZhbHNlLCAgICAgICAgLy8gaGFzIHRyYW5zcGxhbnRlZCB2aWV3c1xuICAgIGN1cnJlbnRWaWV3LCAgLy8gcGFyZW50XG4gICAgbnVsbCwgICAgICAgICAvLyBuZXh0XG4gICAgdE5vZGUsICAgICAgICAvLyB0X2hvc3RcbiAgICBmYWxzZSwgICAgICAgIC8vIGhhcyBjaGlsZCB2aWV3cyB0byByZWZyZXNoXG4gICAgbmF0aXZlLCAgICAgICAvLyBuYXRpdmUsXG4gICAgbnVsbCwgICAgICAgICAvLyB2aWV3IHJlZnNcbiAgICBudWxsLCAgICAgICAgIC8vIG1vdmVkIHZpZXdzXG4gICAgbnVsbCwgICAgICAgICAvLyBkZWh5ZHJhdGVkIHZpZXdzXG4gIF07XG4gIG5nRGV2TW9kZSAmJlxuICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgbENvbnRhaW5lci5sZW5ndGgsIENPTlRBSU5FUl9IRUFERVJfT0ZGU0VULFxuICAgICAgICAgICdTaG91bGQgYWxsb2NhdGUgY29ycmVjdCBudW1iZXIgb2Ygc2xvdHMgZm9yIExDb250YWluZXIgaGVhZGVyLicpO1xuICByZXR1cm4gbENvbnRhaW5lcjtcbn1cblxuLyoqIFJlZnJlc2hlcyBhbGwgY29udGVudCBxdWVyaWVzIGRlY2xhcmVkIGJ5IGRpcmVjdGl2ZXMgaW4gYSBnaXZlbiB2aWV3ICovXG5leHBvcnQgZnVuY3Rpb24gcmVmcmVzaENvbnRlbnRRdWVyaWVzKHRWaWV3OiBUVmlldywgbFZpZXc6IExWaWV3KTogdm9pZCB7XG4gIGNvbnN0IGNvbnRlbnRRdWVyaWVzID0gdFZpZXcuY29udGVudFF1ZXJpZXM7XG4gIGlmIChjb250ZW50UXVlcmllcyAhPT0gbnVsbCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgY29udGVudFF1ZXJpZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IHF1ZXJ5U3RhcnRJZHggPSBjb250ZW50UXVlcmllc1tpXTtcbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZklkeCA9IGNvbnRlbnRRdWVyaWVzW2kgKyAxXTtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWZJZHggIT09IC0xKSB7XG4gICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IHRWaWV3LmRhdGFbZGlyZWN0aXZlRGVmSWR4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZGlyZWN0aXZlRGVmLCAnRGlyZWN0aXZlRGVmIG5vdCBmb3VuZC4nKTtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnREZWZpbmVkKGRpcmVjdGl2ZURlZi5jb250ZW50UXVlcmllcywgJ2NvbnRlbnRRdWVyaWVzIGZ1bmN0aW9uIHNob3VsZCBiZSBkZWZpbmVkJyk7XG4gICAgICAgIHNldEN1cnJlbnRRdWVyeUluZGV4KHF1ZXJ5U3RhcnRJZHgpO1xuICAgICAgICBkaXJlY3RpdmVEZWYuY29udGVudFF1ZXJpZXMhKFJlbmRlckZsYWdzLlVwZGF0ZSwgbFZpZXdbZGlyZWN0aXZlRGVmSWR4XSwgZGlyZWN0aXZlRGVmSWR4KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBBZGRzIExWaWV3IG9yIExDb250YWluZXIgdG8gdGhlIGVuZCBvZiB0aGUgY3VycmVudCB2aWV3IHRyZWUuXG4gKlxuICogVGhpcyBzdHJ1Y3R1cmUgd2lsbCBiZSB1c2VkIHRvIHRyYXZlcnNlIHRocm91Z2ggbmVzdGVkIHZpZXdzIHRvIHJlbW92ZSBsaXN0ZW5lcnNcbiAqIGFuZCBjYWxsIG9uRGVzdHJveSBjYWxsYmFja3MuXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdoZXJlIExWaWV3IG9yIExDb250YWluZXIgc2hvdWxkIGJlIGFkZGVkXG4gKiBAcGFyYW0gYWRqdXN0ZWRIb3N0SW5kZXggSW5kZXggb2YgdGhlIHZpZXcncyBob3N0IG5vZGUgaW4gTFZpZXdbXSwgYWRqdXN0ZWQgZm9yIGhlYWRlclxuICogQHBhcmFtIGxWaWV3T3JMQ29udGFpbmVyIFRoZSBMVmlldyBvciBMQ29udGFpbmVyIHRvIGFkZCB0byB0aGUgdmlldyB0cmVlXG4gKiBAcmV0dXJucyBUaGUgc3RhdGUgcGFzc2VkIGluXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhZGRUb1ZpZXdUcmVlPFQgZXh0ZW5kcyBMVmlld3xMQ29udGFpbmVyPihsVmlldzogTFZpZXcsIGxWaWV3T3JMQ29udGFpbmVyOiBUKTogVCB7XG4gIC8vIFRPRE8oYmVubGVzaC9taXNrbyk6IFRoaXMgaW1wbGVtZW50YXRpb24gaXMgaW5jb3JyZWN0LCBiZWNhdXNlIGl0IGFsd2F5cyBhZGRzIHRoZSBMQ29udGFpbmVyXG4gIC8vIHRvIHRoZSBlbmQgb2YgdGhlIHF1ZXVlLCB3aGljaCBtZWFucyBpZiB0aGUgZGV2ZWxvcGVyIHJldHJpZXZlcyB0aGUgTENvbnRhaW5lcnMgZnJvbSBSTm9kZXMgb3V0XG4gIC8vIG9mIG9yZGVyLCB0aGUgY2hhbmdlIGRldGVjdGlvbiB3aWxsIHJ1biBvdXQgb2Ygb3JkZXIsIGFzIHRoZSBhY3Qgb2YgcmV0cmlldmluZyB0aGUgdGhlXG4gIC8vIExDb250YWluZXIgZnJvbSB0aGUgUk5vZGUgaXMgd2hhdCBhZGRzIGl0IHRvIHRoZSBxdWV1ZS5cbiAgaWYgKGxWaWV3W0NISUxEX0hFQURdKSB7XG4gICAgbFZpZXdbQ0hJTERfVEFJTF0hW05FWFRdID0gbFZpZXdPckxDb250YWluZXI7XG4gIH0gZWxzZSB7XG4gICAgbFZpZXdbQ0hJTERfSEVBRF0gPSBsVmlld09yTENvbnRhaW5lcjtcbiAgfVxuICBsVmlld1tDSElMRF9UQUlMXSA9IGxWaWV3T3JMQ29udGFpbmVyO1xuICByZXR1cm4gbFZpZXdPckxDb250YWluZXI7XG59XG5cbi8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy9cbi8vLy8gQ2hhbmdlIGRldGVjdGlvblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuXG5leHBvcnQgZnVuY3Rpb24gZXhlY3V0ZVZpZXdRdWVyeUZuPFQ+KFxuICAgIGZsYWdzOiBSZW5kZXJGbGFncywgdmlld1F1ZXJ5Rm46IFZpZXdRdWVyaWVzRnVuY3Rpb248VD4sIGNvbXBvbmVudDogVCk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh2aWV3UXVlcnlGbiwgJ1ZpZXcgcXVlcmllcyBmdW5jdGlvbiB0byBleGVjdXRlIG11c3QgYmUgZGVmaW5lZC4nKTtcbiAgc2V0Q3VycmVudFF1ZXJ5SW5kZXgoMCk7XG4gIGNvbnN0IHByZXZDb25zdW1lciA9IHNldEFjdGl2ZUNvbnN1bWVyKG51bGwpO1xuICB0cnkge1xuICAgIHZpZXdRdWVyeUZuKGZsYWdzLCBjb21wb25lbnQpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEFjdGl2ZUNvbnN1bWVyKHByZXZDb25zdW1lcik7XG4gIH1cbn1cblxuLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuLy8vLyBCaW5kaW5ncyAmIGludGVycG9sYXRpb25zXG4vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG5cbi8qKlxuICogU3RvcmVzIG1ldGEtZGF0YSBmb3IgYSBwcm9wZXJ0eSBiaW5kaW5nIHRvIGJlIHVzZWQgYnkgVGVzdEJlZCdzIGBEZWJ1Z0VsZW1lbnQucHJvcGVydGllc2AuXG4gKlxuICogSW4gb3JkZXIgdG8gc3VwcG9ydCBUZXN0QmVkJ3MgYERlYnVnRWxlbWVudC5wcm9wZXJ0aWVzYCB3ZSBuZWVkIHRvIHNhdmUsIGZvciBlYWNoIGJpbmRpbmc6XG4gKiAtIGEgYm91bmQgcHJvcGVydHkgbmFtZTtcbiAqIC0gYSBzdGF0aWMgcGFydHMgb2YgaW50ZXJwb2xhdGVkIHN0cmluZ3M7XG4gKlxuICogQSBnaXZlbiBwcm9wZXJ0eSBtZXRhZGF0YSBpcyBzYXZlZCBhdCB0aGUgYmluZGluZydzIGluZGV4IGluIHRoZSBgVFZpZXcuZGF0YWAgKGluIG90aGVyIHdvcmRzLCBhXG4gKiBwcm9wZXJ0eSBiaW5kaW5nIG1ldGFkYXRhIHdpbGwgYmUgc3RvcmVkIGluIGBUVmlldy5kYXRhYCBhdCB0aGUgc2FtZSBpbmRleCBhcyBhIGJvdW5kIHZhbHVlIGluXG4gKiBgTFZpZXdgKS4gTWV0YWRhdGEgYXJlIHJlcHJlc2VudGVkIGFzIGBJTlRFUlBPTEFUSU9OX0RFTElNSVRFUmAtZGVsaW1pdGVkIHN0cmluZyB3aXRoIHRoZVxuICogZm9sbG93aW5nIGZvcm1hdDpcbiAqIC0gYHByb3BlcnR5TmFtZWAgZm9yIGJvdW5kIHByb3BlcnRpZXM7XG4gKiAtIGBwcm9wZXJ0eU5hbWXvv71wcmVmaXjvv71pbnRlcnBvbGF0aW9uX3N0YXRpY19wYXJ0Me+/vS4uaW50ZXJwb2xhdGlvbl9zdGF0aWNfcGFydE7vv71zdWZmaXhgIGZvclxuICogaW50ZXJwb2xhdGVkIHByb3BlcnRpZXMuXG4gKlxuICogQHBhcmFtIHREYXRhIGBURGF0YWAgd2hlcmUgbWV0YS1kYXRhIHdpbGwgYmUgc2F2ZWQ7XG4gKiBAcGFyYW0gdE5vZGUgYFROb2RlYCB0aGF0IGlzIGEgdGFyZ2V0IG9mIHRoZSBiaW5kaW5nO1xuICogQHBhcmFtIHByb3BlcnR5TmFtZSBib3VuZCBwcm9wZXJ0eSBuYW1lO1xuICogQHBhcmFtIGJpbmRpbmdJbmRleCBiaW5kaW5nIGluZGV4IGluIGBMVmlld2BcbiAqIEBwYXJhbSBpbnRlcnBvbGF0aW9uUGFydHMgc3RhdGljIGludGVycG9sYXRpb24gcGFydHMgKGZvciBwcm9wZXJ0eSBpbnRlcnBvbGF0aW9ucylcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHN0b3JlUHJvcGVydHlCaW5kaW5nTWV0YWRhdGEoXG4gICAgdERhdGE6IFREYXRhLCB0Tm9kZTogVE5vZGUsIHByb3BlcnR5TmFtZTogc3RyaW5nLCBiaW5kaW5nSW5kZXg6IG51bWJlcixcbiAgICAuLi5pbnRlcnBvbGF0aW9uUGFydHM6IHN0cmluZ1tdKSB7XG4gIC8vIEJpbmRpbmcgbWV0YS1kYXRhIGFyZSBzdG9yZWQgb25seSB0aGUgZmlyc3QgdGltZSBhIGdpdmVuIHByb3BlcnR5IGluc3RydWN0aW9uIGlzIHByb2Nlc3NlZC5cbiAgLy8gU2luY2Ugd2UgZG9uJ3QgaGF2ZSBhIGNvbmNlcHQgb2YgdGhlIFwiZmlyc3QgdXBkYXRlIHBhc3NcIiB3ZSBuZWVkIHRvIGNoZWNrIGZvciBwcmVzZW5jZSBvZiB0aGVcbiAgLy8gYmluZGluZyBtZXRhLWRhdGEgdG8gZGVjaWRlIGlmIG9uZSBzaG91bGQgYmUgc3RvcmVkIChvciBpZiB3YXMgc3RvcmVkIGFscmVhZHkpLlxuICBpZiAodERhdGFbYmluZGluZ0luZGV4XSA9PT0gbnVsbCkge1xuICAgIGlmICh0Tm9kZS5pbnB1dHMgPT0gbnVsbCB8fCAhdE5vZGUuaW5wdXRzW3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgIGNvbnN0IHByb3BCaW5kaW5nSWR4cyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3MgfHwgKHROb2RlLnByb3BlcnR5QmluZGluZ3MgPSBbXSk7XG4gICAgICBwcm9wQmluZGluZ0lkeHMucHVzaChiaW5kaW5nSW5kZXgpO1xuICAgICAgbGV0IGJpbmRpbmdNZXRhZGF0YSA9IHByb3BlcnR5TmFtZTtcbiAgICAgIGlmIChpbnRlcnBvbGF0aW9uUGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBiaW5kaW5nTWV0YWRhdGEgKz1cbiAgICAgICAgICAgIElOVEVSUE9MQVRJT05fREVMSU1JVEVSICsgaW50ZXJwb2xhdGlvblBhcnRzLmpvaW4oSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgfVxuICAgICAgdERhdGFbYmluZGluZ0luZGV4XSA9IGJpbmRpbmdNZXRhZGF0YTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTFZpZXdDbGVhbnVwKHZpZXc6IExWaWV3KTogYW55W10ge1xuICAvLyB0b3AgbGV2ZWwgdmFyaWFibGVzIHNob3VsZCBub3QgYmUgZXhwb3J0ZWQgZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMgKFBFUkZfTk9URVMubWQpXG4gIHJldHVybiB2aWV3W0NMRUFOVVBdIHx8ICh2aWV3W0NMRUFOVVBdID0gW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUVmlld0NsZWFudXAodFZpZXc6IFRWaWV3KTogYW55W10ge1xuICByZXR1cm4gdFZpZXcuY2xlYW51cCB8fCAodFZpZXcuY2xlYW51cCA9IFtdKTtcbn1cblxuLyoqXG4gKiBUaGVyZSBhcmUgY2FzZXMgd2hlcmUgdGhlIHN1YiBjb21wb25lbnQncyByZW5kZXJlciBuZWVkcyB0byBiZSBpbmNsdWRlZFxuICogaW5zdGVhZCBvZiB0aGUgY3VycmVudCByZW5kZXJlciAoc2VlIHRoZSBjb21wb25lbnRTeW50aGV0aWNIb3N0KiBpbnN0cnVjdGlvbnMpLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9hZENvbXBvbmVudFJlbmRlcmVyKFxuICAgIGN1cnJlbnREZWY6IERpcmVjdGl2ZURlZjxhbnk+fG51bGwsIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVuZGVyZXIge1xuICAvLyBUT0RPKEZXLTIwNDMpOiB0aGUgYGN1cnJlbnREZWZgIGlzIG51bGwgd2hlbiBob3N0IGJpbmRpbmdzIGFyZSBpbnZva2VkIHdoaWxlIGNyZWF0aW5nIHJvb3RcbiAgLy8gY29tcG9uZW50IChzZWUgcGFja2FnZXMvY29yZS9zcmMvcmVuZGVyMy9jb21wb25lbnQudHMpLiBUaGlzIGlzIG5vdCBjb25zaXN0ZW50IHdpdGggdGhlIHByb2Nlc3NcbiAgLy8gb2YgY3JlYXRpbmcgaW5uZXIgY29tcG9uZW50cywgd2hlbiBjdXJyZW50IGRpcmVjdGl2ZSBpbmRleCBpcyBhdmFpbGFibGUgaW4gdGhlIHN0YXRlLiBJbiBvcmRlclxuICAvLyB0byBhdm9pZCByZWx5aW5nIG9uIGN1cnJlbnQgZGVmIGJlaW5nIGBudWxsYCAodGh1cyBzcGVjaWFsLWNhc2luZyByb290IGNvbXBvbmVudCBjcmVhdGlvbiksIHRoZVxuICAvLyBwcm9jZXNzIG9mIGNyZWF0aW5nIHJvb3QgY29tcG9uZW50IHNob3VsZCBiZSB1bmlmaWVkIHdpdGggdGhlIHByb2Nlc3Mgb2YgY3JlYXRpbmcgaW5uZXJcbiAgLy8gY29tcG9uZW50cy5cbiAgaWYgKGN1cnJlbnREZWYgPT09IG51bGwgfHwgaXNDb21wb25lbnREZWYoY3VycmVudERlZikpIHtcbiAgICBsVmlldyA9IHVud3JhcExWaWV3KGxWaWV3W3ROb2RlLmluZGV4XSkhO1xuICB9XG4gIHJldHVybiBsVmlld1tSRU5ERVJFUl07XG59XG5cbi8qKiBIYW5kbGVzIGFuIGVycm9yIHRocm93biBpbiBhbiBMVmlldy4gKi9cbmV4cG9ydCBmdW5jdGlvbiBoYW5kbGVFcnJvcihsVmlldzogTFZpZXcsIGVycm9yOiBhbnkpOiB2b2lkIHtcbiAgY29uc3QgaW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGVycm9ySGFuZGxlciA9IGluamVjdG9yID8gaW5qZWN0b3IuZ2V0KEVycm9ySGFuZGxlciwgbnVsbCkgOiBudWxsO1xuICBlcnJvckhhbmRsZXIgJiYgZXJyb3JIYW5kbGVyLmhhbmRsZUVycm9yKGVycm9yKTtcbn1cblxuLyoqXG4gKiBTZXQgdGhlIGlucHV0cyBvZiBkaXJlY3RpdmVzIGF0IHRoZSBjdXJyZW50IG5vZGUgdG8gY29ycmVzcG9uZGluZyB2YWx1ZS5cbiAqXG4gKiBAcGFyYW0gdFZpZXcgVGhlIGN1cnJlbnQgVFZpZXdcbiAqIEBwYXJhbSBsVmlldyB0aGUgYExWaWV3YCB3aGljaCBjb250YWlucyB0aGUgZGlyZWN0aXZlcy5cbiAqIEBwYXJhbSBpbnB1dHMgbWFwcGluZyBiZXR3ZWVuIHRoZSBwdWJsaWMgXCJpbnB1dFwiIG5hbWUgYW5kIHByaXZhdGVseS1rbm93bixcbiAqICAgICAgICBwb3NzaWJseSBtaW5pZmllZCwgcHJvcGVydHkgbmFtZXMgdG8gd3JpdGUgdG8uXG4gKiBAcGFyYW0gdmFsdWUgVmFsdWUgdG8gc2V0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5wdXRzRm9yUHJvcGVydHkoXG4gICAgdFZpZXc6IFRWaWV3LCBsVmlldzogTFZpZXcsIGlucHV0czogUHJvcGVydHlBbGlhc1ZhbHVlLCBwdWJsaWNOYW1lOiBzdHJpbmcsIHZhbHVlOiBhbnkpOiB2b2lkIHtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbnB1dHMubGVuZ3RoOykge1xuICAgIGNvbnN0IGluZGV4ID0gaW5wdXRzW2krK10gYXMgbnVtYmVyO1xuICAgIGNvbnN0IHByaXZhdGVOYW1lID0gaW5wdXRzW2krK10gYXMgc3RyaW5nO1xuICAgIGNvbnN0IGluc3RhbmNlID0gbFZpZXdbaW5kZXhdO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIGluZGV4KTtcbiAgICBjb25zdCBkZWYgPSB0Vmlldy5kYXRhW2luZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcblxuICAgIHdyaXRlVG9EaXJlY3RpdmVJbnB1dChkZWYsIGluc3RhbmNlLCBwdWJsaWNOYW1lLCBwcml2YXRlTmFtZSwgdmFsdWUpO1xuICB9XG59XG5cbi8qKlxuICogVXBkYXRlcyBhIHRleHQgYmluZGluZyBhdCBhIGdpdmVuIGluZGV4IGluIGEgZ2l2ZW4gTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZXh0QmluZGluZ0ludGVybmFsKGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdmFsdWU6IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0U3RyaW5nKHZhbHVlLCAnVmFsdWUgc2hvdWxkIGJlIGEgc3RyaW5nJyk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3RTYW1lKHZhbHVlLCBOT19DSEFOR0UgYXMgYW55LCAndmFsdWUgc2hvdWxkIG5vdCBiZSBOT19DSEFOR0UnKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEluZGV4SW5SYW5nZShsVmlldywgaW5kZXgpO1xuICBjb25zdCBlbGVtZW50ID0gZ2V0TmF0aXZlQnlJbmRleChpbmRleCwgbFZpZXcpIGFzIGFueSBhcyBSVGV4dDtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoZWxlbWVudCwgJ25hdGl2ZSBlbGVtZW50IHNob3VsZCBleGlzdCcpO1xuICB1cGRhdGVUZXh0Tm9kZShsVmlld1tSRU5ERVJFUl0sIGVsZW1lbnQsIHZhbHVlKTtcbn1cbiJdfQ==