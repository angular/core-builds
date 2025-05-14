/**
 * @license Angular v20.1.0-next.0+sha-d835a44
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import { RuntimeError, InjectionToken, getCurrentTNode, assertInInjectionContext, signalAsReadonlyFn, assertNgModuleType, Injector, inject, ɵɵdefineInjectable as __defineInjectable, formatRuntimeError, INTERNAL_APPLICATION_ERROR_HANDLER, PROVIDED_ZONELESS, stringify, ɵɵinject as __inject, ChangeDetectionScheduler, errorHandlerEnvironmentInitializer, makeEnvironmentProviders, runInInjectionContext, INJECTOR_SCOPE, provideEnvironmentInitializer, ErrorHandler, _global, isComponentHost, getComponentLViewByIndex, DECLARATION_COMPONENT_VIEW, getLView, ɵɵdefineInjector as __defineInjector, ENVIRONMENT_INITIALIZER, unwrapRNode, CLEANUP, isLContainer, unwrapLView, hasI18n, RENDERER, HOST, getComponentDef, assertTNode, isProjectionTNode, PARENT, CONTEXT, HEADER_OFFSET, TVIEW, isRootView, CONTAINER_HEADER_OFFSET, isLView, getTNode, assertNotInReactiveContext, ViewContext, DestroyRef, getNullInjector } from './root_effect_scheduler-DpIexjmQ.mjs';
export { DOCUMENT, EnvironmentInjector, INJECTOR, PendingTasks, defineInjectable, forwardRef, importProvidersFrom, isSignal, isStandalone, provideBrowserGlobalErrorListeners, resolveForwardRef, signal, EffectScheduler as ɵEffectScheduler, NG_COMP_DEF as ɵNG_COMP_DEF, NG_DIR_DEF as ɵNG_DIR_DEF, NG_ELEMENT_ID as ɵNG_ELEMENT_ID, NG_INJ_DEF as ɵNG_INJ_DEF, NG_MOD_DEF as ɵNG_MOD_DEF, NG_PIPE_DEF as ɵNG_PIPE_DEF, NG_PROV_DEF as ɵNG_PROV_DEF, PendingTasksInternal as ɵPendingTasksInternal, XSS_SECURITY_URL as ɵXSS_SECURITY_URL, ZONELESS_ENABLED as ɵZONELESS_ENABLED, convertToBitFlags as ɵconvertToBitFlags, createInjector as ɵcreateInjector, getInjectableDef as ɵgetInjectableDef, isEnvironmentProviders as ɵisEnvironmentProviders, isInjectable as ɵisInjectable, setInjectorProfilerContext as ɵsetInjectorProfilerContext, truncateMiddle as ɵtruncateMiddle, ɵunwrapWritableSignal, ɵɵdisableBindings, ɵɵenableBindings, ɵɵinvalidFactoryDep, ɵɵnamespaceHTML, ɵɵnamespaceMathML, ɵɵnamespaceSVG, ɵɵresetView, ɵɵrestoreView } from './root_effect_scheduler-DpIexjmQ.mjs';
import { SIGNAL_NODE, signalSetFn, SIGNAL, producerAccessed, consumerPollProducersForChange, consumerBeforeComputation, consumerAfterComputation } from './signal-ePSl6jXn.mjs';
import { ɵɵinjectAttribute as __injectAttribute, createMultiResultQuerySignalFn, createSingleResultRequiredQuerySignalFn, createSingleResultOptionalQuerySignalFn, makePropDecorator, NgModuleFactory, COMPILER_OPTIONS, setJitOptions, isComponentResourceResolutionQueueEmpty, getCompilerFacade, resolveComponentResources, IMAGE_CONFIG, getDocument, setClassMetadata, Injectable, NgZone, PROVIDED_NG_ZONE, remove, isPromise, ApplicationInitStatus, LOCALE_ID, DEFAULT_LOCALE_ID, setLocaleId, ApplicationRef, createNgModuleRefWithProviders, optionsReducer, internalProvideZoneChangeDetection, ChangeDetectionSchedulerImpl, getNgZone, getNgZoneOptions, publishDefaultGlobalUtils, PLATFORM_INITIALIZER, publishSignalConfiguration, checkNoChangesInternal, UseExhaustiveCheckNoChanges, getRegisteredNgModuleType, ViewRef as ViewRef$1, isListLikeIterable, iterateListLike, isJsObject, SkipSelf, Optional, ɵɵdefineNgModule as __defineNgModule, NgModule, profiler, assertStandaloneComponentType, EnvironmentNgModuleRefAdapter, IS_EVENT_REPLAY_ENABLED, JSACTION_BLOCK_ELEMENT_MAP, APP_ID, setStashFn, APP_BOOTSTRAP_LISTENER, clearStashFn, JSACTION_EVENT_CONTRACT, removeListeners, isIncrementalHydrationEnabled, performanceMarkFeature, EVENT_REPLAY_ENABLED_DEFAULT, DEFER_BLOCK_SSR_ID_ATTRIBUTE, invokeListeners, triggerHydrationFromBlockName, sharedStashFunction, sharedMapFunction, isI18nHydrationEnabled, TransferState, NGH_DATA_KEY, NGH_DEFER_BLOCKS_KEY, getLNodeForHydration, NGH_ATTR_NAME, SKIP_HYDRATION_ATTR_NAME, isI18nHydrationSupportEnabled, ViewEncapsulation as ViewEncapsulation$1, getOrComputeI18nChildren, trySerializeI18nBlock, I18N_DATA, isTNodeShape, isDetachedByI18n, isDisconnectedNode, isInSkipHydrationBlock, unsupportedProjectionOfDomNodes, TEMPLATES, CONTAINERS, isLetDeclaration, ELEMENT_CONTAINERS, processTextNodeBeforeSerialization, setJSActionAttributes, DISCONNECTED_NODES, NODES, calcPathForNode, NUM_ROOT_NODES, TEMPLATE_ID, isDeferBlock, getLDeferBlockDetails, getTDeferBlockDetails, collectNativeNodesInLContainer, validateNodeExists, validateMatchingNode, DEFER_BLOCK_ID, DEFER_BLOCK_STATE, DEFER_BLOCK_STATE$1, MULTIPLIER, collectNativeNodes, convertHydrateTriggersToJsAction, DEFER_HYDRATE_TRIGGERS, DEFER_PARENT_BLOCK_ID, IS_HYDRATION_DOM_REUSE_ENABLED, IS_I18N_HYDRATION_ENABLED, IS_INCREMENTAL_HYDRATION_ENABLED, DehydratedBlockRegistry, DEHYDRATED_BLOCK_REGISTRY, processBlockData, gatherDeferBlocksCommentNodes, processAndInitTriggers, appendDeferBlocksToJSActionMap, verifySsrContentsIntegrity, Console, enableRetrieveHydrationInfoImpl, enableLocateOrCreateElementNodeImpl, enableLocateOrCreateTextNodeImpl, enableLocateOrCreateElementContainerNodeImpl, enableLocateOrCreateContainerAnchorImpl, enableLocateOrCreateContainerRefImpl, enableFindMatchingDehydratedViewImpl, enableApplyRootElementTransformImpl, setIsI18nHydrationSupportEnabled, PRESERVE_HOST_CONTENT, cleanupDehydratedViews, countBlocksSkippedByHydration, enableLocateOrCreateI18nNodeImpl, enablePrepareI18nBlockForHydrationImpl, enableClaimDehydratedIcuCaseImpl, enableRetrieveDeferBlockDataImpl, readPatchedLView, setClassMetadataAsync, angularCoreEnv, NOOP_AFTER_RENDER_REF, AfterRenderManager, TracingService, AfterRenderImpl, AfterRenderSequence, AFTER_RENDER_PHASES, assertComponentDef, ComponentFactory } from './debug_node-FPqH5owt.mjs';
export { ANIMATION_MODULE_TYPE, APP_INITIALIZER, Attribute, CSP_NONCE, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, Compiler, CompilerFactory, Component, ComponentFactory$1 as ComponentFactory, ComponentFactoryResolver, ComponentRef, DEFAULT_CURRENCY_CODE, DebugElement, DebugEventListener, DebugNode, Directive, ElementRef, EventEmitter, Host, HostBinding, HostListener, Inject, Input, MissingTranslationStrategy, ModuleWithComponentFactories, NO_ERRORS_SCHEMA, NgModuleFactory$1 as NgModuleFactory, NgModuleRef$1 as NgModuleRef, NgProbeToken, Output, PACKAGE_ROOT_URL, PLATFORM_ID, Pipe, QueryList, Renderer2, RendererFactory2, RendererStyleFlags2, Sanitizer, SecurityContext, Self, SimpleChange, TRANSLATIONS, TRANSLATIONS_FORMAT, TemplateRef, Testability, TestabilityRegistry, Type, ViewContainerRef, afterEveryRender, afterNextRender, asNativeElements, createEnvironmentInjector, createNgModule, createNgModuleRef, getDebugNode, inputBinding, makeStateKey, outputBinding, provideAppInitializer, provideNgReflectAttributes, provideZoneChangeDetection, provideZonelessChangeDetection, setTestabilityGetter, twoWayBinding, AcxChangeDetectionStrategy as ɵAcxChangeDetectionStrategy, AcxViewEncapsulation as ɵAcxViewEncapsulation, ComponentFactory$1 as ɵComponentFactory, DEFER_BLOCK_CONFIG as ɵDEFER_BLOCK_CONFIG, DEFER_BLOCK_DEPENDENCY_INTERCEPTOR as ɵDEFER_BLOCK_DEPENDENCY_INTERCEPTOR, DeferBlockBehavior as ɵDeferBlockBehavior, DeferBlockState as ɵDeferBlockState, Framework as ɵFramework, IMAGE_CONFIG_DEFAULTS as ɵIMAGE_CONFIG_DEFAULTS, LContext as ɵLContext, LocaleDataIndex as ɵLocaleDataIndex, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR as ɵNOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR, NO_CHANGE as ɵNO_CHANGE, NoopNgZone as ɵNoopNgZone, ReflectionCapabilities as ɵReflectionCapabilities, ComponentRef$1 as ɵRender3ComponentRef, NgModuleRef as ɵRender3NgModuleRef, SSR_CONTENT_INTEGRITY_MARKER as ɵSSR_CONTENT_INTEGRITY_MARKER, TESTABILITY as ɵTESTABILITY, TESTABILITY_GETTER as ɵTESTABILITY_GETTER, TracingAction as ɵTracingAction, _sanitizeHtml as ɵ_sanitizeHtml, _sanitizeUrl as ɵ_sanitizeUrl, allowSanitizationBypassAndThrow as ɵallowSanitizationBypassAndThrow, bypassSanitizationTrustHtml as ɵbypassSanitizationTrustHtml, bypassSanitizationTrustResourceUrl as ɵbypassSanitizationTrustResourceUrl, bypassSanitizationTrustScript as ɵbypassSanitizationTrustScript, bypassSanitizationTrustStyle as ɵbypassSanitizationTrustStyle, bypassSanitizationTrustUrl as ɵbypassSanitizationTrustUrl, clearResolutionOfComponentResourcesQueue as ɵclearResolutionOfComponentResourcesQueue, compileComponent as ɵcompileComponent, compileDirective as ɵcompileDirective, compileNgModule as ɵcompileNgModule, compileNgModuleDefs as ɵcompileNgModuleDefs, compilePipe as ɵcompilePipe, depsTracker as ɵdepsTracker, devModeEqual as ɵdevModeEqual, findLocaleData as ɵfindLocaleData, flushModuleScopingQueueAsMuchAsPossible as ɵflushModuleScopingQueueAsMuchAsPossible, generateStandaloneInDeclarationsError as ɵgenerateStandaloneInDeclarationsError, getAsyncClassMetadataFn as ɵgetAsyncClassMetadataFn, getDebugNode as ɵgetDebugNode, getDeferBlocks as ɵgetDeferBlocks, getDirectives as ɵgetDirectives, getHostElement as ɵgetHostElement, getLContext as ɵgetLContext, getLocaleCurrencyCode as ɵgetLocaleCurrencyCode, getLocalePluralCase as ɵgetLocalePluralCase, getSanitizationBypassType as ɵgetSanitizationBypassType, ɵgetUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode, isBoundToModule as ɵisBoundToModule, isComponentDefPendingResolution as ɵisComponentDefPendingResolution, isNgModule as ɵisNgModule, isSubscribable as ɵisSubscribable, isViewDirty as ɵisViewDirty, markForRefresh as ɵmarkForRefresh, noSideEffects as ɵnoSideEffects, patchComponentDefWithScope as ɵpatchComponentDefWithScope, publishExternalGlobalUtil as ɵpublishExternalGlobalUtil, readHydrationInfo as ɵreadHydrationInfo, registerLocaleData as ɵregisterLocaleData, renderDeferBlockState as ɵrenderDeferBlockState, resetCompiledComponents as ɵresetCompiledComponents, resetJitOptions as ɵresetJitOptions, restoreComponentResolutionQueue as ɵrestoreComponentResolutionQueue, setAllowDuplicateNgModuleIdsForTest as ɵsetAllowDuplicateNgModuleIdsForTest, ɵsetClassDebugInfo, setDocument as ɵsetDocument, ɵsetUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode, store as ɵstore, transitiveScopesFor as ɵtransitiveScopesFor, triggerResourceLoading as ɵtriggerResourceLoading, unregisterAllLocaleData as ɵunregisterLocaleData, unwrapSafeValue as ɵunwrapSafeValue, ɵɵCopyDefinitionFeature, ɵɵExternalStylesFeature, ɵɵHostDirectivesFeature, ɵɵInheritDefinitionFeature, ɵɵNgOnChangesFeature, ɵɵProvidersFeature, ɵɵadvance, ɵɵattachSourceLocations, ɵɵattribute, ɵɵattributeInterpolate1, ɵɵattributeInterpolate2, ɵɵattributeInterpolate3, ɵɵattributeInterpolate4, ɵɵattributeInterpolate5, ɵɵattributeInterpolate6, ɵɵattributeInterpolate7, ɵɵattributeInterpolate8, ɵɵattributeInterpolateV, ɵɵclassMap, ɵɵclassMapInterpolate1, ɵɵclassMapInterpolate2, ɵɵclassMapInterpolate3, ɵɵclassMapInterpolate4, ɵɵclassMapInterpolate5, ɵɵclassMapInterpolate6, ɵɵclassMapInterpolate7, ɵɵclassMapInterpolate8, ɵɵclassMapInterpolateV, ɵɵclassProp, ɵɵcomponentInstance, ɵɵconditional, ɵɵconditionalBranchCreate, ɵɵconditionalCreate, ɵɵcontentQuery, ɵɵcontentQuerySignal, ɵɵdeclareLet, ɵɵdefer, ɵɵdeferEnableTimerScheduling, ɵɵdeferHydrateNever, ɵɵdeferHydrateOnHover, ɵɵdeferHydrateOnIdle, ɵɵdeferHydrateOnImmediate, ɵɵdeferHydrateOnInteraction, ɵɵdeferHydrateOnTimer, ɵɵdeferHydrateOnViewport, ɵɵdeferHydrateWhen, ɵɵdeferOnHover, ɵɵdeferOnIdle, ɵɵdeferOnImmediate, ɵɵdeferOnInteraction, ɵɵdeferOnTimer, ɵɵdeferOnViewport, ɵɵdeferPrefetchOnHover, ɵɵdeferPrefetchOnIdle, ɵɵdeferPrefetchOnImmediate, ɵɵdeferPrefetchOnInteraction, ɵɵdeferPrefetchOnTimer, ɵɵdeferPrefetchOnViewport, ɵɵdeferPrefetchWhen, ɵɵdeferWhen, ɵɵdefineComponent, ɵɵdefineDirective, ɵɵdefinePipe, ɵɵdirectiveInject, ɵɵdomProperty, ɵɵelement, ɵɵelementContainer, ɵɵelementContainerEnd, ɵɵelementContainerStart, ɵɵelementEnd, ɵɵelementStart, ɵɵgetComponentDepsFactory, ɵɵgetCurrentView, ɵɵgetInheritedFactory, ɵɵi18n, ɵɵi18nApply, ɵɵi18nAttributes, ɵɵi18nEnd, ɵɵi18nExp, ɵɵi18nPostprocess, ɵɵi18nStart, ɵɵinvalidFactory, ɵɵlistener, ɵɵloadQuery, ɵɵnextContext, ɵɵpipe, ɵɵpipeBind1, ɵɵpipeBind2, ɵɵpipeBind3, ɵɵpipeBind4, ɵɵpipeBindV, ɵɵprojection, ɵɵprojectionDef, ɵɵproperty, ɵɵpropertyInterpolate, ɵɵpropertyInterpolate1, ɵɵpropertyInterpolate2, ɵɵpropertyInterpolate3, ɵɵpropertyInterpolate4, ɵɵpropertyInterpolate5, ɵɵpropertyInterpolate6, ɵɵpropertyInterpolate7, ɵɵpropertyInterpolate8, ɵɵpropertyInterpolateV, ɵɵpureFunction0, ɵɵpureFunction1, ɵɵpureFunction2, ɵɵpureFunction3, ɵɵpureFunction4, ɵɵpureFunction5, ɵɵpureFunction6, ɵɵpureFunction7, ɵɵpureFunction8, ɵɵpureFunctionV, ɵɵqueryAdvance, ɵɵqueryRefresh, ɵɵreadContextLet, ɵɵreference, registerNgModuleType as ɵɵregisterNgModuleType, ɵɵrepeater, ɵɵrepeaterCreate, ɵɵrepeaterTrackByIdentity, ɵɵrepeaterTrackByIndex, ɵɵreplaceMetadata, ɵɵresolveBody, ɵɵresolveDocument, ɵɵresolveWindow, ɵɵsanitizeHtml, ɵɵsanitizeResourceUrl, ɵɵsanitizeScript, ɵɵsanitizeStyle, ɵɵsanitizeUrl, ɵɵsanitizeUrlOrResourceUrl, ɵɵsetComponentScope, ɵɵsetNgModuleScope, ɵɵstoreLet, ɵɵstyleMap, ɵɵstyleMapInterpolate1, ɵɵstyleMapInterpolate2, ɵɵstyleMapInterpolate3, ɵɵstyleMapInterpolate4, ɵɵstyleMapInterpolate5, ɵɵstyleMapInterpolate6, ɵɵstyleMapInterpolate7, ɵɵstyleMapInterpolate8, ɵɵstyleMapInterpolateV, ɵɵstyleProp, ɵɵstylePropInterpolate1, ɵɵstylePropInterpolate2, ɵɵstylePropInterpolate3, ɵɵstylePropInterpolate4, ɵɵstylePropInterpolate5, ɵɵstylePropInterpolate6, ɵɵstylePropInterpolate7, ɵɵstylePropInterpolate8, ɵɵstylePropInterpolateV, ɵɵsyntheticHostListener, ɵɵsyntheticHostProperty, ɵɵtemplate, ɵɵtemplateRefExtractor, ɵɵtext, ɵɵtextInterpolate, ɵɵtextInterpolate1, ɵɵtextInterpolate2, ɵɵtextInterpolate3, ɵɵtextInterpolate4, ɵɵtextInterpolate5, ɵɵtextInterpolate6, ɵɵtextInterpolate7, ɵɵtextInterpolate8, ɵɵtextInterpolateV, ɵɵtrustConstantHtml, ɵɵtrustConstantResourceUrl, ɵɵtwoWayBindingSet, ɵɵtwoWayListener, ɵɵtwoWayProperty, ɵɵvalidateIframeAttribute, ɵɵviewQuery, ɵɵviewQuerySignal } from './debug_node-FPqH5owt.mjs';
import { OutputEmitterRef } from './resource-Bcr5cyx4.mjs';
export { computed, effect, linkedSignal, resource, untracked, ResourceImpl as ɵResourceImpl, getOutputDestroyRef as ɵgetOutputDestroyRef } from './resource-Bcr5cyx4.mjs';
export { setAlternateWeakRefImpl as ɵsetAlternateWeakRefImpl } from './weak_ref-BaIq-pgY.mjs';
export { setCurrentInjector as ɵsetCurrentInjector } from './primitives/di.mjs';
import { clearAppScopedEarlyEventContract, EventContract, EventContractContainer, getAppScopedQueuedEventInfos, EventDispatcher, registerDispatcher, EventPhase, isEarlyEventType, isCaptureEventType } from './primitives/event-dispatch.mjs';
import 'rxjs';
import '@angular/core/primitives/di';
import '@angular/core/primitives/signals';
import 'rxjs/operators';
import './attribute-BWp59EjE.mjs';
import './untracked-2ouAFbCz.mjs';

const REQUIRED_UNSET_VALUE = /* @__PURE__ */ Symbol('InputSignalNode#UNSET');
// Note: Using an IIFE here to ensure that the spread assignment is not considered
// a side-effect, ending up preserving `COMPUTED_NODE` and `REACTIVE_NODE`.
// TODO: remove when https://github.com/evanw/esbuild/issues/3392 is resolved.
const INPUT_SIGNAL_NODE = /* @__PURE__ */ (() => {
    return {
        ...SIGNAL_NODE,
        transformFn: undefined,
        applyValueToInputSignal(node, value) {
            signalSetFn(node, value);
        },
    };
})();

const ɵINPUT_SIGNAL_BRAND_WRITE_TYPE = /* @__PURE__ */ Symbol();
/**
 * Creates an input signal.
 *
 * @param initialValue The initial value.
 *   Can be set to {@link REQUIRED_UNSET_VALUE} for required inputs.
 * @param options Additional options for the input. e.g. a transform, or an alias.
 */
function createInputSignal(initialValue, options) {
    const node = Object.create(INPUT_SIGNAL_NODE);
    node.value = initialValue;
    // Perf note: Always set `transformFn` here to ensure that `node` always
    // has the same v8 class shape, allowing monomorphic reads on input signals.
    node.transformFn = options?.transform;
    function inputValueFn() {
        // Record that someone looked at this signal.
        producerAccessed(node);
        if (node.value === REQUIRED_UNSET_VALUE) {
            let message = null;
            if (ngDevMode) {
                const name = options?.debugName ?? options?.alias;
                message = `Input${name ? ` "${name}"` : ''} is required but no value is available yet.`;
            }
            throw new RuntimeError(-950 /* RuntimeErrorCode.REQUIRED_INPUT_NO_VALUE */, message);
        }
        return node.value;
    }
    inputValueFn[SIGNAL] = node;
    if (ngDevMode) {
        inputValueFn.toString = () => `[Input Signal: ${inputValueFn()}]`;
        node.debugName = options?.debugName;
    }
    return inputValueFn;
}

var FactoryTarget;
(function (FactoryTarget) {
    FactoryTarget[FactoryTarget["Directive"] = 0] = "Directive";
    FactoryTarget[FactoryTarget["Component"] = 1] = "Component";
    FactoryTarget[FactoryTarget["Injectable"] = 2] = "Injectable";
    FactoryTarget[FactoryTarget["Pipe"] = 3] = "Pipe";
    FactoryTarget[FactoryTarget["NgModule"] = 4] = "NgModule";
})(FactoryTarget || (FactoryTarget = {}));
var R3TemplateDependencyKind;
(function (R3TemplateDependencyKind) {
    R3TemplateDependencyKind[R3TemplateDependencyKind["Directive"] = 0] = "Directive";
    R3TemplateDependencyKind[R3TemplateDependencyKind["Pipe"] = 1] = "Pipe";
    R3TemplateDependencyKind[R3TemplateDependencyKind["NgModule"] = 2] = "NgModule";
})(R3TemplateDependencyKind || (R3TemplateDependencyKind = {}));
var ViewEncapsulation;
(function (ViewEncapsulation) {
    ViewEncapsulation[ViewEncapsulation["Emulated"] = 0] = "Emulated";
    // Historically the 1 value was for `Native` encapsulation which has been removed as of v11.
    ViewEncapsulation[ViewEncapsulation["None"] = 2] = "None";
    ViewEncapsulation[ViewEncapsulation["ShadowDom"] = 3] = "ShadowDom";
})(ViewEncapsulation || (ViewEncapsulation = {}));

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Creates a token that can be used to inject static attributes of the host node.
 *
 * @usageNotes
 * ### Injecting an attribute that is known to exist
 * ```ts
 * @Directive()
 * class MyDir {
 *   attr: string = inject(new HostAttributeToken('some-attr'));
 * }
 * ```
 *
 * ### Optionally injecting an attribute
 * ```ts
 * @Directive()
 * class MyDir {
 *   attr: string | null = inject(new HostAttributeToken('some-attr'), {optional: true});
 * }
 * ```
 * @publicApi
 */
class HostAttributeToken {
    attributeName;
    constructor(attributeName) {
        this.attributeName = attributeName;
    }
    /** @internal */
    __NG_ELEMENT_ID__ = () => __injectAttribute(this.attributeName);
    toString() {
        return `HostAttributeToken ${this.attributeName}`;
    }
}

/**
 * A token that can be used to inject the tag name of the host node.
 *
 * @usageNotes
 * ### Injecting a tag name that is known to exist
 * ```ts
 * @Directive()
 * class MyDir {
 *   tagName: string = inject(HOST_TAG_NAME);
 * }
 * ```
 *
 * ### Optionally injecting a tag name
 * ```ts
 * @Directive()
 * class MyDir {
 *   tagName: string | null = inject(HOST_TAG_NAME, {optional: true});
 * }
 * ```
 * @publicApi
 */
const HOST_TAG_NAME = new InjectionToken(ngDevMode ? 'HOST_TAG_NAME' : '');
// HOST_TAG_NAME should be resolved at the current node, similar to e.g. ElementRef,
// so we manually specify __NG_ELEMENT_ID__ here, instead of using a factory.
// tslint:disable-next-line:no-toplevel-property-access
HOST_TAG_NAME.__NG_ELEMENT_ID__ = (flags) => {
    const tNode = getCurrentTNode();
    if (tNode === null) {
        throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode &&
            'HOST_TAG_NAME can only be injected in directives and components ' +
                'during construction time (in a class constructor or as a class field initializer)');
    }
    if (tNode.type & 2 /* TNodeType.Element */) {
        return tNode.value;
    }
    if (flags & 8 /* InternalInjectFlags.Optional */) {
        return null;
    }
    throw new RuntimeError(204 /* RuntimeErrorCode.INVALID_INJECTION_TOKEN */, ngDevMode &&
        `HOST_TAG_NAME was used on ${getDevModeNodeName(tNode)} which doesn't have an underlying element in the DOM. ` +
            `This is invalid, and so the dependency should be marked as optional.`);
};
function getDevModeNodeName(tNode) {
    if (tNode.type & 8 /* TNodeType.ElementContainer */) {
        return 'an <ng-container>';
    }
    else if (tNode.type & 4 /* TNodeType.Container */) {
        return 'an <ng-template>';
    }
    else if (tNode.type & 128 /* TNodeType.LetDeclaration */) {
        return 'an @let declaration';
    }
    else {
        return 'a node';
    }
}

/**
 * The `output` function allows declaration of Angular outputs in
 * directives and components.
 *
 * You can use outputs to emit values to parent directives and component.
 * Parents can subscribe to changes via:
 *
 * - template event bindings. For example, `(myOutput)="doSomething($event)"`
 * - programmatic subscription by using `OutputRef#subscribe`.
 *
 * @usageNotes
 *
 * To use `output()`, import the function from `@angular/core`.
 *
 * ```ts
 * import {output} from '@angular/core';
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `output`.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   nameChange = output<string>();    // OutputEmitterRef<string>
 *   onClick    = output();            // OutputEmitterRef<void>
 * }
 * ```
 *
 * You can emit values to consumers of your directive, by using
 * the `emit` method from `OutputEmitterRef`.
 *
 * ```ts
 * updateName(newName: string): void {
 *   this.nameChange.emit(newName);
 * }
 * ```
 * @initializerApiFunction {"showTypesInSignaturePreview": true}
 * @publicApi 19.0
 */
function output(opts) {
    ngDevMode && assertInInjectionContext(output);
    return new OutputEmitterRef();
}

function inputFunction(initialValue, opts) {
    ngDevMode && assertInInjectionContext(input);
    return createInputSignal(initialValue, opts);
}
function inputRequiredFunction(opts) {
    ngDevMode && assertInInjectionContext(input);
    return createInputSignal(REQUIRED_UNSET_VALUE, opts);
}
/**
 * The `input` function allows declaration of Angular inputs in directives
 * and components.
 *
 * There are two variants of inputs that can be declared:
 *
 *   1. **Optional inputs** with an initial value.
 *   2. **Required inputs** that consumers need to set.
 *
 * By default, the `input` function will declare optional inputs that
 * always have an initial value. Required inputs can be declared
 * using the `input.required()` function.
 *
 * Inputs are signals. The values of an input are exposed as a `Signal`.
 * The signal always holds the latest value of the input that is bound
 * from the parent.
 *
 * @usageNotes
 * To use signal-based inputs, import `input` from `@angular/core`.
 *
 * ```ts
 * import {input} from '@angular/core`;
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `input` or `input.required`.
 *
 * ```ts
 * @Component({
 *   ...
 * })
 * export class UserProfileComponent {
 *   firstName = input<string>();             // Signal<string|undefined>
 *   lastName  = input.required<string>();    // Signal<string>
 *   age       = input(0)                     // Signal<number>
 * }
 * ```
 *
 * Inside your component template, you can display values of the inputs
 * by calling the signal.
 *
 * ```html
 * <span>{{firstName()}}</span>
 * ```
 *
 * @publicAPI
 * @initializerApiFunction
 */
const input = (() => {
    // Note: This may be considered a side-effect, but nothing will depend on
    // this assignment, unless this `input` constant export is accessed. It's a
    // self-contained side effect that is local to the user facing`input` export.
    inputFunction.required = inputRequiredFunction;
    return inputFunction;
})();

function viewChildFn(locator, opts) {
    ngDevMode && assertInInjectionContext(viewChild);
    return createSingleResultOptionalQuerySignalFn(opts);
}
function viewChildRequiredFn(locator, opts) {
    ngDevMode && assertInInjectionContext(viewChild);
    return createSingleResultRequiredQuerySignalFn(opts);
}
/**
 * Initializes a view child query.
 *
 * Consider using `viewChild.required` for queries that should always match.
 *
 * @usageNotes
 * Create a child query in your component by declaring a
 * class field and initializing it with the `viewChild()` function.
 *
 * ```angular-ts
 * @Component({template: '<div #el></div><my-component #cmp />'})
 * export class TestComponent {
 *   divEl = viewChild<ElementRef>('el');                   // Signal<ElementRef|undefined>
 *   divElRequired = viewChild.required<ElementRef>('el');  // Signal<ElementRef>
 *   cmp = viewChild(MyComponent);                          // Signal<MyComponent|undefined>
 *   cmpRequired = viewChild.required(MyComponent);         // Signal<MyComponent>
 * }
 * ```
 *
 * @publicApi 19.0
 * @initializerApiFunction
 */
const viewChild = (() => {
    // Note: This may be considered a side-effect, but nothing will depend on
    // this assignment, unless this `viewChild` constant export is accessed. It's a
    // self-contained side effect that is local to the user facing `viewChild` export.
    viewChildFn.required = viewChildRequiredFn;
    return viewChildFn;
})();
/**
 * Initializes a view children query.
 *
 * Query results are represented as a signal of a read-only collection containing all matched
 * elements.
 *
 * @usageNotes
 * Create a children query in your component by declaring a
 * class field and initializing it with the `viewChildren()` function.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   divEls = viewChildren<ElementRef>('el');   // Signal<ReadonlyArray<ElementRef>>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicApi 19.0
 */
function viewChildren(locator, opts) {
    ngDevMode && assertInInjectionContext(viewChildren);
    return createMultiResultQuerySignalFn(opts);
}
function contentChildFn(locator, opts) {
    ngDevMode && assertInInjectionContext(contentChild);
    return createSingleResultOptionalQuerySignalFn(opts);
}
function contentChildRequiredFn(locator, opts) {
    ngDevMode && assertInInjectionContext(contentChildren);
    return createSingleResultRequiredQuerySignalFn(opts);
}
/**
 * Initializes a content child query. Consider using `contentChild.required` for queries that should
 * always match.
 *
 * @usageNotes
 * Create a child query in your component by declaring a
 * class field and initializing it with the `contentChild()` function.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   headerEl = contentChild<ElementRef>('h');                    // Signal<ElementRef|undefined>
 *   headerElElRequired = contentChild.required<ElementRef>('h'); // Signal<ElementRef>
 *   header = contentChild(MyHeader);                             // Signal<MyHeader|undefined>
 *   headerRequired = contentChild.required(MyHeader);            // Signal<MyHeader>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicApi 19.0
 */
const contentChild = (() => {
    // Note: This may be considered a side-effect, but nothing will depend on
    // this assignment, unless this `viewChild` constant export is accessed. It's a
    // self-contained side effect that is local to the user facing `viewChild` export.
    contentChildFn.required = contentChildRequiredFn;
    return contentChildFn;
})();
/**
 * Initializes a content children query.
 *
 * Query results are represented as a signal of a read-only collection containing all matched
 * elements.
 *
 * @usageNotes
 * Create a children query in your component by declaring a
 * class field and initializing it with the `contentChildren()` function.
 *
 * ```ts
 * @Component({...})
 * export class TestComponent {
 *   headerEl = contentChildren<ElementRef>('h');   // Signal<ReadonlyArray<ElementRef>>
 * }
 * ```
 *
 * @initializerApiFunction
 * @publicApi 19.0
 */
function contentChildren(locator, opts) {
    return createMultiResultQuerySignalFn(opts);
}

/**
 * Creates a model signal.
 *
 * @param initialValue The initial value.
 *   Can be set to {@link REQUIRED_UNSET_VALUE} for required model signals.
 * @param options Additional options for the model.
 */
function createModelSignal(initialValue, opts) {
    const node = Object.create(INPUT_SIGNAL_NODE);
    const emitterRef = new OutputEmitterRef();
    node.value = initialValue;
    function getter() {
        producerAccessed(node);
        assertModelSet(node.value);
        return node.value;
    }
    getter[SIGNAL] = node;
    getter.asReadonly = signalAsReadonlyFn.bind(getter);
    // TODO: Should we throw an error when updating a destroyed model?
    getter.set = (newValue) => {
        if (!node.equal(node.value, newValue)) {
            signalSetFn(node, newValue);
            emitterRef.emit(newValue);
        }
    };
    getter.update = (updateFn) => {
        assertModelSet(node.value);
        getter.set(updateFn(node.value));
    };
    getter.subscribe = emitterRef.subscribe.bind(emitterRef);
    getter.destroyRef = emitterRef.destroyRef;
    if (ngDevMode) {
        getter.toString = () => `[Model Signal: ${getter()}]`;
        node.debugName = opts?.debugName;
    }
    return getter;
}
/** Asserts that a model's value is set. */
function assertModelSet(value) {
    if (value === REQUIRED_UNSET_VALUE) {
        throw new RuntimeError(952 /* RuntimeErrorCode.REQUIRED_MODEL_NO_VALUE */, ngDevMode && 'Model is required but no value is available yet.');
    }
}

function modelFunction(initialValue, opts) {
    ngDevMode && assertInInjectionContext(model);
    return createModelSignal(initialValue, opts);
}
function modelRequiredFunction(opts) {
    ngDevMode && assertInInjectionContext(model);
    return createModelSignal(REQUIRED_UNSET_VALUE, opts);
}
/**
 * `model` declares a writeable signal that is exposed as an input/output
 * pair on the containing directive.
 *
 * The input name is taken either from the class member or from the `alias` option.
 * The output name is generated by taking the input name and appending `Change`.
 *
 * @usageNotes
 *
 * To use `model()`, import the function from `@angular/core`.
 *
 * ```ts
 * import {model} from '@angular/core`;
 * ```
 *
 * Inside your component, introduce a new class member and initialize
 * it with a call to `model` or `model.required`.
 *
 * ```ts
 * @Directive({
 *   ...
 * })
 * export class MyDir {
 *   firstName = model<string>();            // ModelSignal<string|undefined>
 *   lastName  = model.required<string>();   // ModelSignal<string>
 *   age       = model(0);                   // ModelSignal<number>
 * }
 * ```
 *
 * Inside your component template, you can display the value of a `model`
 * by calling the signal.
 *
 * ```html
 * <span>{{firstName()}}</span>
 * ```
 *
 * Updating the `model` is equivalent to updating a writable signal.
 *
 * ```ts
 * updateName(newFirstName: string): void {
 *   this.firstName.set(newFirstName);
 * }
 * ```
 *
 * @publicApi 19.0
 * @initializerApiFunction
 */
const model = (() => {
    // Note: This may be considered a side-effect, but nothing will depend on
    // this assignment, unless this `model` constant export is accessed. It's a
    // self-contained side effect that is local to the user facing `model` export.
    modelFunction.required = modelRequiredFunction;
    return modelFunction;
})();

// Stores the default value of `emitDistinctChangesOnly` when the `emitDistinctChangesOnly` is not
// explicitly set.
const emitDistinctChangesOnlyDefaultValue = true;
/**
 * Base class for query metadata.
 *
 * @see {@link ContentChildren}
 * @see {@link ContentChild}
 * @see {@link ViewChildren}
 * @see {@link ViewChild}
 *
 * @publicApi
 */
class Query {
}
/**
 * ContentChildren decorator and metadata.
 *
 *
 * @Annotation
 * @publicApi
 */
const ContentChildren = makePropDecorator('ContentChildren', (selector, opts = {}) => ({
    selector,
    first: false,
    isViewQuery: false,
    descendants: false,
    emitDistinctChangesOnly: emitDistinctChangesOnlyDefaultValue,
    ...opts,
}), Query);
/**
 * ContentChild decorator and metadata.
 *
 *
 * @Annotation
 *
 * @publicApi
 */
const ContentChild = makePropDecorator('ContentChild', (selector, opts = {}) => ({
    selector,
    first: true,
    isViewQuery: false,
    descendants: true,
    ...opts,
}), Query);
/**
 * ViewChildren decorator and metadata.
 *
 * @Annotation
 * @publicApi
 */
const ViewChildren = makePropDecorator('ViewChildren', (selector, opts = {}) => ({
    selector,
    first: false,
    isViewQuery: true,
    descendants: true,
    emitDistinctChangesOnly: emitDistinctChangesOnlyDefaultValue,
    ...opts,
}), Query);
/**
 * ViewChild decorator and metadata.
 *
 * @Annotation
 * @publicApi
 */
const ViewChild = makePropDecorator('ViewChild', (selector, opts) => ({
    selector,
    first: true,
    isViewQuery: true,
    descendants: true,
    ...opts,
}), Query);

/**
 * @description Represents the version of Angular
 *
 * @publicApi
 */
class Version {
    full;
    major;
    minor;
    patch;
    constructor(full) {
        this.full = full;
        const parts = full.split('.');
        this.major = parts[0];
        this.minor = parts[1];
        this.patch = parts.slice(2).join('.');
    }
}
/**
 * @publicApi
 */
const VERSION = new Version('20.1.0-next.0+sha-d835a44');

function compileNgModuleFactory(injector, options, moduleType) {
    ngDevMode && assertNgModuleType(moduleType);
    const moduleFactory = new NgModuleFactory(moduleType);
    // All of the logic below is irrelevant for AOT-compiled code.
    if (typeof ngJitMode !== 'undefined' && !ngJitMode) {
        return Promise.resolve(moduleFactory);
    }
    const compilerOptions = injector.get(COMPILER_OPTIONS, []).concat(options);
    // Configure the compiler to use the provided options. This call may fail when multiple modules
    // are bootstrapped with incompatible options, as a component can only be compiled according to
    // a single set of options.
    setJitOptions({
        defaultEncapsulation: _lastDefined(compilerOptions.map((opts) => opts.defaultEncapsulation)),
        preserveWhitespaces: _lastDefined(compilerOptions.map((opts) => opts.preserveWhitespaces)),
    });
    if (isComponentResourceResolutionQueueEmpty()) {
        return Promise.resolve(moduleFactory);
    }
    const compilerProviders = compilerOptions.flatMap((option) => option.providers ?? []);
    // In case there are no compiler providers, we just return the module factory as
    // there won't be any resource loader. This can happen with Ivy, because AOT compiled
    // modules can be still passed through "bootstrapModule". In that case we shouldn't
    // unnecessarily require the JIT compiler.
    if (compilerProviders.length === 0) {
        return Promise.resolve(moduleFactory);
    }
    const compiler = getCompilerFacade({
        usage: 0 /* JitCompilerUsage.Decorator */,
        kind: 'NgModule',
        type: moduleType,
    });
    const compilerInjector = Injector.create({ providers: compilerProviders });
    const resourceLoader = compilerInjector.get(compiler.ResourceLoader);
    // The resource loader can also return a string while the "resolveComponentResources"
    // always expects a promise. Therefore we need to wrap the returned value in a promise.
    return resolveComponentResources((url) => Promise.resolve(resourceLoader.get(url))).then(() => moduleFactory);
}
function _lastDefined(args) {
    for (let i = args.length - 1; i >= 0; i--) {
        if (args[i] !== undefined) {
            return args[i];
        }
    }
    return undefined;
}

// A delay in milliseconds before the scan is run after onLoad, to avoid any
// potential race conditions with other LCP-related functions. This delay
// happens outside of the main JavaScript execution and will only effect the timing
// on when the warning becomes visible in the console.
const SCAN_DELAY = 200;
const OVERSIZED_IMAGE_TOLERANCE = 1200;
class ImagePerformanceWarning {
    // Map of full image URLs -> original `ngSrc` values.
    window = null;
    observer = null;
    options = inject(IMAGE_CONFIG);
    lcpImageUrl;
    start() {
        if ((typeof ngServerMode !== 'undefined' && ngServerMode) ||
            typeof PerformanceObserver === 'undefined' ||
            (this.options?.disableImageSizeWarning && this.options?.disableImageLazyLoadWarning)) {
            return;
        }
        this.observer = this.initPerformanceObserver();
        const doc = getDocument();
        const win = doc.defaultView;
        if (win) {
            this.window = win;
            // Wait to avoid race conditions where LCP image triggers
            // load event before it's recorded by the performance observer
            const waitToScan = () => {
                setTimeout(this.scanImages.bind(this), SCAN_DELAY);
            };
            const setup = () => {
                // Consider the case when the application is created and destroyed multiple times.
                // Typically, applications are created instantly once the page is loaded, and the
                // `window.load` listener is always triggered. However, the `window.load` event will never
                // be fired if the page is loaded, and the application is created later. Checking for
                // `readyState` is the easiest way to determine whether the page has been loaded or not.
                if (doc.readyState === 'complete') {
                    waitToScan();
                }
                else {
                    this.window?.addEventListener('load', waitToScan, { once: true });
                }
            };
            // Angular doesn't have to run change detection whenever any asynchronous tasks are invoked in
            // the scope of this functionality.
            if (typeof Zone !== 'undefined') {
                Zone.root.run(() => setup());
            }
            else {
                setup();
            }
        }
    }
    ngOnDestroy() {
        this.observer?.disconnect();
    }
    initPerformanceObserver() {
        if (typeof PerformanceObserver === 'undefined') {
            return null;
        }
        const observer = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            if (entries.length === 0)
                return;
            // We use the latest entry produced by the `PerformanceObserver` as the best
            // signal on which element is actually an LCP one. As an example, the first image to load on
            // a page, by virtue of being the only thing on the page so far, is often a LCP candidate
            // and gets reported by PerformanceObserver, but isn't necessarily the LCP element.
            const lcpElement = entries[entries.length - 1];
            // Cast to `any` due to missing `element` on the `LargestContentfulPaint` type of entry.
            // See https://developer.mozilla.org/en-US/docs/Web/API/LargestContentfulPaint
            const imgSrc = lcpElement.element?.src ?? '';
            // Exclude `data:` and `blob:` URLs, since they are fetched resources.
            if (imgSrc.startsWith('data:') || imgSrc.startsWith('blob:'))
                return;
            this.lcpImageUrl = imgSrc;
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        return observer;
    }
    scanImages() {
        const images = getDocument().querySelectorAll('img');
        let lcpElementFound, lcpElementLoadedCorrectly = false;
        images.forEach((image) => {
            if (!this.options?.disableImageSizeWarning) {
                // Image elements using the NgOptimizedImage directive are excluded,
                // as that directive has its own version of this check.
                if (!image.getAttribute('ng-img') && this.isOversized(image)) {
                    logOversizedImageWarning(image.src);
                }
            }
            if (!this.options?.disableImageLazyLoadWarning && this.lcpImageUrl) {
                if (image.src === this.lcpImageUrl) {
                    lcpElementFound = true;
                    if (image.loading !== 'lazy' || image.getAttribute('ng-img')) {
                        // This variable is set to true and never goes back to false to account
                        // for the case where multiple images have the same src url, and some
                        // have lazy loading while others don't.
                        // Also ignore NgOptimizedImage because there's a different warning for that.
                        lcpElementLoadedCorrectly = true;
                    }
                }
            }
        });
        if (lcpElementFound &&
            !lcpElementLoadedCorrectly &&
            this.lcpImageUrl &&
            !this.options?.disableImageLazyLoadWarning) {
            logLazyLCPWarning(this.lcpImageUrl);
        }
    }
    isOversized(image) {
        if (!this.window) {
            return false;
        }
        // The `isOversized` check may not be applicable or may require adjustments
        // for several types of image formats or scenarios. Currently, we specify only
        // `svg`, but this may also include `gif` since their quality isn’t tied to
        // dimensions in the same way as raster images.
        const nonOversizedImageExtentions = [
            // SVG images are vector-based, which means they can scale
            // to any size without losing quality.
            '.svg',
        ];
        // Convert it to lowercase because this may have uppercase
        // extensions, such as `IMAGE.SVG`.
        // We fallback to an empty string because `src` may be `undefined`
        // if it is explicitly set to `null` by some third-party code
        // (e.g., `image.src = null`).
        const imageSource = (image.src || '').toLowerCase();
        if (nonOversizedImageExtentions.some((extension) => imageSource.endsWith(extension))) {
            return false;
        }
        const computedStyle = this.window.getComputedStyle(image);
        let renderedWidth = parseFloat(computedStyle.getPropertyValue('width'));
        let renderedHeight = parseFloat(computedStyle.getPropertyValue('height'));
        const boxSizing = computedStyle.getPropertyValue('box-sizing');
        const objectFit = computedStyle.getPropertyValue('object-fit');
        if (objectFit === `cover`) {
            // Object fit cover may indicate a use case such as a sprite sheet where
            // this warning does not apply.
            return false;
        }
        if (boxSizing === 'border-box') {
            // If the image `box-sizing` is set to `border-box`, we adjust the rendered
            // dimensions by subtracting padding values.
            const paddingTop = computedStyle.getPropertyValue('padding-top');
            const paddingRight = computedStyle.getPropertyValue('padding-right');
            const paddingBottom = computedStyle.getPropertyValue('padding-bottom');
            const paddingLeft = computedStyle.getPropertyValue('padding-left');
            renderedWidth -= parseFloat(paddingRight) + parseFloat(paddingLeft);
            renderedHeight -= parseFloat(paddingTop) + parseFloat(paddingBottom);
        }
        const intrinsicWidth = image.naturalWidth;
        const intrinsicHeight = image.naturalHeight;
        const recommendedWidth = this.window.devicePixelRatio * renderedWidth;
        const recommendedHeight = this.window.devicePixelRatio * renderedHeight;
        const oversizedWidth = intrinsicWidth - recommendedWidth >= OVERSIZED_IMAGE_TOLERANCE;
        const oversizedHeight = intrinsicHeight - recommendedHeight >= OVERSIZED_IMAGE_TOLERANCE;
        return oversizedWidth || oversizedHeight;
    }
    static ɵfac = function ImagePerformanceWarning_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ImagePerformanceWarning)(); };
    static ɵprov = /*@__PURE__*/ __defineInjectable({ token: ImagePerformanceWarning, factory: ImagePerformanceWarning.ɵfac, providedIn: 'root' });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ImagePerformanceWarning, [{
        type: Injectable,
        args: [{ providedIn: 'root' }]
    }], null, null); })();
function logLazyLCPWarning(src) {
    console.warn(formatRuntimeError(-913 /* RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING */, `An image with src ${src} is the Largest Contentful Paint (LCP) element ` +
        `but was given a "loading" value of "lazy", which can negatively impact ` +
        `application loading performance. This warning can be addressed by ` +
        `changing the loading value of the LCP image to "eager", or by using the ` +
        `NgOptimizedImage directive's prioritization utilities. For more ` +
        `information about addressing or disabling this warning, see ` +
        `https://angular.dev/errors/NG0913`));
}
function logOversizedImageWarning(src) {
    console.warn(formatRuntimeError(-913 /* RuntimeErrorCode.IMAGE_PERFORMANCE_WARNING */, `An image with src ${src} has intrinsic file dimensions much larger than its ` +
        `rendered size. This can negatively impact application loading performance. ` +
        `For more information about addressing or disabling this warning, see ` +
        `https://angular.dev/errors/NG0913`));
}

/**
 * Internal token that allows to register extra callbacks that should be invoked during the
 * `PlatformRef.destroy` operation. This token is needed to avoid a direct reference to the
 * `PlatformRef` class (i.e. register the callback via `PlatformRef.onDestroy`), thus making the
 * entire class tree-shakeable.
 */
const PLATFORM_DESTROY_LISTENERS = new InjectionToken(ngDevMode ? 'PlatformDestroyListeners' : '');

/**
 * InjectionToken to control root component bootstrap behavior.
 *
 * This token is primarily used in Angular's server-side rendering (SSR) scenarios,
 * particularly by the `@angular/ssr` package, to manage whether the root component
 * should be bootstrapped during the application initialization process.
 *
 * ## Purpose:
 * During SSR route extraction, setting this token to `false` prevents Angular from
 * bootstrapping the root component. This avoids unnecessary component rendering,
 * enabling route extraction without requiring additional APIs or triggering
 * component logic.
 *
 * ## Behavior:
 * - **`false`**: Prevents the root component from being bootstrapped.
 * - **`true`** (default): Proceeds with the normal root component bootstrap process.
 *
 * This mechanism ensures SSR can efficiently separate route extraction logic
 * from component rendering.
 */
const ENABLE_ROOT_COMPONENT_BOOTSTRAP = new InjectionToken(ngDevMode ? 'ENABLE_ROOT_COMPONENT_BOOTSTRAP' : '');
function isApplicationBootstrapConfig(config) {
    return !config.moduleRef;
}
function bootstrap(config) {
    const envInjector = isApplicationBootstrapConfig(config)
        ? config.r3Injector
        : config.moduleRef.injector;
    const ngZone = envInjector.get(NgZone);
    return ngZone.run(() => {
        if (isApplicationBootstrapConfig(config)) {
            config.r3Injector.resolveInjectorInitializers();
        }
        else {
            config.moduleRef.resolveInjectorInitializers();
        }
        const exceptionHandler = envInjector.get(INTERNAL_APPLICATION_ERROR_HANDLER);
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            if (envInjector.get(PROVIDED_ZONELESS) && envInjector.get(PROVIDED_NG_ZONE)) {
                throw new RuntimeError(408 /* RuntimeErrorCode.PROVIDED_BOTH_ZONE_AND_ZONELESS */, 'Invalid change detection configuration: ' +
                    'provideZoneChangeDetection and provideZonelessChangeDetection cannot be used together.');
            }
        }
        let onErrorSubscription;
        ngZone.runOutsideAngular(() => {
            onErrorSubscription = ngZone.onError.subscribe({
                next: exceptionHandler,
            });
        });
        // If the whole platform is destroyed, invoke the `destroy` method
        // for all bootstrapped applications as well.
        if (isApplicationBootstrapConfig(config)) {
            const destroyListener = () => envInjector.destroy();
            const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
            onPlatformDestroyListeners.add(destroyListener);
            envInjector.onDestroy(() => {
                onErrorSubscription.unsubscribe();
                onPlatformDestroyListeners.delete(destroyListener);
            });
        }
        else {
            const destroyListener = () => config.moduleRef.destroy();
            const onPlatformDestroyListeners = config.platformInjector.get(PLATFORM_DESTROY_LISTENERS);
            onPlatformDestroyListeners.add(destroyListener);
            config.moduleRef.onDestroy(() => {
                remove(config.allPlatformModules, config.moduleRef);
                onErrorSubscription.unsubscribe();
                onPlatformDestroyListeners.delete(destroyListener);
            });
        }
        return _callAndReportToErrorHandler(exceptionHandler, ngZone, () => {
            const initStatus = envInjector.get(ApplicationInitStatus);
            initStatus.runInitializers();
            return initStatus.donePromise.then(() => {
                // If the `LOCALE_ID` provider is defined at bootstrap then we set the value for ivy
                const localeId = envInjector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
                setLocaleId(localeId || DEFAULT_LOCALE_ID);
                const enableRootComponentBoostrap = envInjector.get(ENABLE_ROOT_COMPONENT_BOOTSTRAP, true);
                if (!enableRootComponentBoostrap) {
                    if (isApplicationBootstrapConfig(config)) {
                        return envInjector.get(ApplicationRef);
                    }
                    config.allPlatformModules.push(config.moduleRef);
                    return config.moduleRef;
                }
                if (typeof ngDevMode === 'undefined' || ngDevMode) {
                    const imagePerformanceService = envInjector.get(ImagePerformanceWarning);
                    imagePerformanceService.start();
                }
                if (isApplicationBootstrapConfig(config)) {
                    const appRef = envInjector.get(ApplicationRef);
                    if (config.rootComponent !== undefined) {
                        appRef.bootstrap(config.rootComponent);
                    }
                    return appRef;
                }
                else {
                    moduleBootstrapImpl?.(config.moduleRef, config.allPlatformModules);
                    return config.moduleRef;
                }
            });
        });
    });
}
/**
 * Having a separate symbol for the module boostrap implementation allows us to
 * tree shake the module based boostrap implementation in standalone apps.
 */
let moduleBootstrapImpl;
/**
 * Set the implementation of the module based bootstrap.
 */
function setModuleBootstrapImpl() {
    moduleBootstrapImpl = _moduleDoBootstrap;
}
function _moduleDoBootstrap(moduleRef, allPlatformModules) {
    const appRef = moduleRef.injector.get(ApplicationRef);
    if (moduleRef._bootstrapComponents.length > 0) {
        moduleRef._bootstrapComponents.forEach((f) => appRef.bootstrap(f));
    }
    else if (moduleRef.instance.ngDoBootstrap) {
        moduleRef.instance.ngDoBootstrap(appRef);
    }
    else {
        throw new RuntimeError(-403 /* RuntimeErrorCode.BOOTSTRAP_COMPONENTS_NOT_FOUND */, ngDevMode &&
            `The module ${stringify(moduleRef.instance.constructor)} was bootstrapped, ` +
                `but it does not declare "@NgModule.bootstrap" components nor a "ngDoBootstrap" method. ` +
                `Please define one of these.`);
    }
    allPlatformModules.push(moduleRef);
}
function _callAndReportToErrorHandler(errorHandler, ngZone, callback) {
    try {
        const result = callback();
        if (isPromise(result)) {
            return result.catch((e) => {
                ngZone.runOutsideAngular(() => errorHandler(e));
                // rethrow as the exception handler might not do it
                throw e;
            });
        }
        return result;
    }
    catch (e) {
        ngZone.runOutsideAngular(() => errorHandler(e));
        // rethrow as the exception handler might not do it
        throw e;
    }
}

/**
 * The Angular platform is the entry point for Angular on a web page.
 * Each page has exactly one platform. Services (such as reflection) which are common
 * to every Angular application running on the page are bound in its scope.
 * A page's platform is initialized implicitly when a platform is created using a platform
 * factory such as `PlatformBrowser`, or explicitly by calling the `createPlatform()` function.
 *
 * @publicApi
 */
class PlatformRef {
    _injector;
    _modules = [];
    _destroyListeners = [];
    _destroyed = false;
    /** @internal */
    constructor(_injector) {
        this._injector = _injector;
    }
    /**
     * Creates an instance of an `@NgModule` for the given platform.
     *
     * @deprecated Passing NgModule factories as the `PlatformRef.bootstrapModuleFactory` function
     *     argument is deprecated. Use the `PlatformRef.bootstrapModule` API instead.
     */
    bootstrapModuleFactory(moduleFactory, options) {
        const scheduleInRootZone = options?.scheduleInRootZone;
        const ngZoneFactory = () => getNgZone(options?.ngZone, {
            ...getNgZoneOptions({
                eventCoalescing: options?.ngZoneEventCoalescing,
                runCoalescing: options?.ngZoneRunCoalescing,
            }),
            scheduleInRootZone,
        });
        const ignoreChangesOutsideZone = options?.ignoreChangesOutsideZone;
        const allAppProviders = [
            internalProvideZoneChangeDetection({
                ngZoneFactory,
                ignoreChangesOutsideZone,
            }),
            { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
            errorHandlerEnvironmentInitializer,
        ];
        const moduleRef = createNgModuleRefWithProviders(moduleFactory.moduleType, this.injector, allAppProviders);
        setModuleBootstrapImpl();
        return bootstrap({
            moduleRef,
            allPlatformModules: this._modules,
            platformInjector: this.injector,
        });
    }
    /**
     * Creates an instance of an `@NgModule` for a given platform.
     *
     * @usageNotes
     * ### Simple Example
     *
     * ```ts
     * @NgModule({
     *   imports: [BrowserModule]
     * })
     * class MyModule {}
     *
     * let moduleRef = platformBrowser().bootstrapModule(MyModule);
     * ```
     *
     */
    bootstrapModule(moduleType, compilerOptions = []) {
        const options = optionsReducer({}, compilerOptions);
        setModuleBootstrapImpl();
        return compileNgModuleFactory(this.injector, options, moduleType).then((moduleFactory) => this.bootstrapModuleFactory(moduleFactory, options));
    }
    /**
     * Registers a listener to be called when the platform is destroyed.
     */
    onDestroy(callback) {
        this._destroyListeners.push(callback);
    }
    /**
     * Retrieves the platform {@link Injector}, which is the parent injector for
     * every Angular application on the page and provides singleton providers.
     */
    get injector() {
        return this._injector;
    }
    /**
     * Destroys the current Angular platform and all Angular applications on the page.
     * Destroys all modules and listeners registered with the platform.
     */
    destroy() {
        if (this._destroyed) {
            throw new RuntimeError(404 /* RuntimeErrorCode.PLATFORM_ALREADY_DESTROYED */, ngDevMode && 'The platform has already been destroyed!');
        }
        this._modules.slice().forEach((module) => module.destroy());
        this._destroyListeners.forEach((listener) => listener());
        const destroyListeners = this._injector.get(PLATFORM_DESTROY_LISTENERS, null);
        if (destroyListeners) {
            destroyListeners.forEach((listener) => listener());
            destroyListeners.clear();
        }
        this._destroyed = true;
    }
    /**
     * Indicates whether this instance was destroyed.
     */
    get destroyed() {
        return this._destroyed;
    }
    static ɵfac = function PlatformRef_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || PlatformRef)(__inject(Injector)); };
    static ɵprov = /*@__PURE__*/ __defineInjectable({ token: PlatformRef, factory: PlatformRef.ɵfac, providedIn: 'platform' });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(PlatformRef, [{
        type: Injectable,
        args: [{ providedIn: 'platform' }]
    }], () => [{ type: Injector }], null); })();

let _platformInjector = null;
/**
 * Internal token to indicate whether having multiple bootstrapped platform should be allowed (only
 * one bootstrapped platform is allowed by default). This token helps to support SSR scenarios.
 */
const ALLOW_MULTIPLE_PLATFORMS = new InjectionToken(ngDevMode ? 'AllowMultipleToken' : '');
/**
 * Creates a platform.
 * Platforms must be created on launch using this function.
 *
 * @publicApi
 */
function createPlatform(injector) {
    if (_platformInjector && !_platformInjector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
        throw new RuntimeError(400 /* RuntimeErrorCode.MULTIPLE_PLATFORMS */, ngDevMode && 'There can be only one platform. Destroy the previous one to create a new one.');
    }
    publishDefaultGlobalUtils();
    publishSignalConfiguration();
    _platformInjector = injector;
    const platform = injector.get(PlatformRef);
    runPlatformInitializers(injector);
    return platform;
}
/**
 * Creates a factory for a platform. Can be used to provide or override `Providers` specific to
 * your application's runtime needs, such as `PLATFORM_INITIALIZER` and `PLATFORM_ID`.
 * @param parentPlatformFactory Another platform factory to modify. Allows you to compose factories
 * to build up configurations that might be required by different libraries or parts of the
 * application.
 * @param name Identifies the new platform factory.
 * @param providers A set of dependency providers for platforms created with the new factory.
 *
 * @publicApi
 */
function createPlatformFactory(parentPlatformFactory, name, providers = []) {
    const desc = `Platform: ${name}`;
    const marker = new InjectionToken(desc);
    return (extraProviders = []) => {
        let platform = getPlatform();
        if (!platform || platform.injector.get(ALLOW_MULTIPLE_PLATFORMS, false)) {
            const platformProviders = [
                ...providers,
                ...extraProviders,
                { provide: marker, useValue: true },
            ];
            if (parentPlatformFactory) {
                parentPlatformFactory(platformProviders);
            }
            else {
                createPlatform(createPlatformInjector(platformProviders, desc));
            }
        }
        return assertPlatform(marker);
    };
}
/**
 * Helper function to create an instance of a platform injector (that maintains the 'platform'
 * scope).
 */
function createPlatformInjector(providers = [], name) {
    return Injector.create({
        name,
        providers: [
            { provide: INJECTOR_SCOPE, useValue: 'platform' },
            { provide: PLATFORM_DESTROY_LISTENERS, useValue: new Set([() => (_platformInjector = null)]) },
            ...providers,
        ],
    });
}
/**
 * Checks that there is currently a platform that contains the given token as a provider.
 *
 * @publicApi
 */
function assertPlatform(requiredToken) {
    const platform = getPlatform();
    if (!platform) {
        throw new RuntimeError(401 /* RuntimeErrorCode.PLATFORM_NOT_FOUND */, ngDevMode && 'No platform exists!');
    }
    if ((typeof ngDevMode === 'undefined' || ngDevMode) &&
        !platform.injector.get(requiredToken, null)) {
        throw new RuntimeError(400 /* RuntimeErrorCode.MULTIPLE_PLATFORMS */, 'A platform with a different configuration has been created. Please destroy it first.');
    }
    return platform;
}
/**
 * Returns the current platform.
 *
 * @publicApi
 */
function getPlatform() {
    return _platformInjector?.get(PlatformRef) ?? null;
}
/**
 * Destroys the current Angular platform and all Angular applications on the page.
 * Destroys all modules and listeners registered with the platform.
 *
 * @publicApi
 */
function destroyPlatform() {
    getPlatform()?.destroy();
}
/**
 * The goal of this function is to bootstrap a platform injector,
 * but avoid referencing `PlatformRef` class.
 * This function is needed for bootstrapping a Standalone Component.
 */
function createOrReusePlatformInjector(providers = []) {
    // If a platform injector already exists, it means that the platform
    // is already bootstrapped and no additional actions are required.
    if (_platformInjector)
        return _platformInjector;
    publishDefaultGlobalUtils();
    // Otherwise, setup a new platform injector and run platform initializers.
    const injector = createPlatformInjector(providers);
    _platformInjector = injector;
    publishSignalConfiguration();
    runPlatformInitializers(injector);
    return injector;
}
/**
 * @description
 * This function is used to provide initialization functions that will be executed upon
 * initialization of the platform injector.
 *
 * Note that the provided initializer is run in the injection context.
 *
 * Previously, this was achieved using the `PLATFORM_INITIALIZER` token which is now deprecated.
 *
 * @see {@link PLATFORM_INITIALIZER}
 *
 * @publicApi
 */
function providePlatformInitializer(initializerFn) {
    return makeEnvironmentProviders([
        {
            provide: PLATFORM_INITIALIZER,
            useValue: initializerFn,
            multi: true,
        },
    ]);
}
function runPlatformInitializers(injector) {
    const inits = injector.get(PLATFORM_INITIALIZER, null);
    runInInjectionContext(injector, () => {
        inits?.forEach((init) => init());
    });
}

function exhaustiveCheckNoChangesInterval(interval) {
    return provideEnvironmentInitializer(() => {
        const applicationRef = inject(ApplicationRef);
        const errorHandler = inject(ErrorHandler);
        const scheduler = inject(ChangeDetectionSchedulerImpl);
        const ngZone = inject(NgZone);
        function scheduleCheckNoChanges() {
            ngZone.runOutsideAngular(() => {
                setTimeout(() => {
                    if (applicationRef.destroyed) {
                        return;
                    }
                    if (scheduler.pendingRenderTaskId || scheduler.runningTick) {
                        scheduleCheckNoChanges();
                        return;
                    }
                    for (const view of applicationRef.allViews) {
                        try {
                            checkNoChangesInternal(view._lView, true /** exhaustive */);
                        }
                        catch (e) {
                            errorHandler.handleError(e);
                        }
                    }
                    scheduleCheckNoChanges();
                }, interval);
            });
        }
        scheduleCheckNoChanges();
    });
}

function provideCheckNoChangesConfig(options) {
    return makeEnvironmentProviders(typeof ngDevMode === 'undefined' || ngDevMode
        ? [
            {
                provide: UseExhaustiveCheckNoChanges,
                useValue: options.exhaustive,
            },
            options?.interval !== undefined ? exhaustiveCheckNoChangesInterval(options.interval) : [],
        ]
        : []);
}

/**
 * Returns whether Angular is in development mode.
 *
 * By default, this is true, unless `enableProdMode` is invoked prior to calling this method or the
 * application is built using the Angular CLI with the `optimization` option.
 * @see {@link /cli/build ng build}
 *
 * @publicApi
 */
function isDevMode() {
    return typeof ngDevMode === 'undefined' || !!ngDevMode;
}
/**
 * Disable Angular's development mode, which turns off assertions and other
 * checks within the framework.
 *
 * One important assertion this disables verifies that a change detection pass
 * does not result in additional changes to any bindings (also known as
 * unidirectional data flow).
 *
 * Using this method is discouraged as the Angular CLI will set production mode when using the
 * `optimization` option.
 * @see {@link /cli/build ng build}
 *
 * @publicApi
 */
function enableProdMode() {
    // The below check is there so when ngDevMode is set via terser
    // `global['ngDevMode'] = false;` is also dropped.
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
        _global['ngDevMode'] = false;
    }
}

/**
 * Returns the NgModuleFactory with the given id (specified using [@NgModule.id
 * field](api/core/NgModule#id)), if it exists and has been loaded. Factories for NgModules that do
 * not specify an `id` cannot be retrieved. Throws if an NgModule cannot be found.
 * @publicApi
 * @deprecated Use `getNgModuleById` instead.
 */
function getModuleFactory(id) {
    const type = getRegisteredNgModuleType(id);
    if (!type)
        throw noModuleError(id);
    return new NgModuleFactory(type);
}
/**
 * Returns the NgModule class with the given id (specified using [@NgModule.id
 * field](api/core/NgModule#id)), if it exists and has been loaded. Classes for NgModules that do
 * not specify an `id` cannot be retrieved. Throws if an NgModule cannot be found.
 * @publicApi
 */
function getNgModuleById(id) {
    const type = getRegisteredNgModuleType(id);
    if (!type)
        throw noModuleError(id);
    return type;
}
function noModuleError(id) {
    return new Error(`No module with ID ${id} loaded`);
}

/**
 * Base class that provides change detection functionality.
 * A change-detection tree collects all views that are to be checked for changes.
 * Use the methods to add and remove views from the tree, initiate change-detection,
 * and explicitly mark views as _dirty_, meaning that they have changed and need to be re-rendered.
 *
 * @see [Using change detection hooks](guide/components/lifecycle#using-change-detection-hooks)
 * @see [Defining custom change detection](guide/components/lifecycle#defining-custom-change-detection)
 *
 * @usageNotes
 *
 * The following examples demonstrate how to modify default change-detection behavior
 * to perform explicit detection when needed.
 *
 * ### Use `markForCheck()` with `CheckOnce` strategy
 *
 * The following example sets the `OnPush` change-detection strategy for a component
 * (`CheckOnce`, rather than the default `CheckAlways`), then forces a second check
 * after an interval.
 *
 * {@example core/ts/change_detect/change-detection.ts region='mark-for-check'}
 *
 * ### Detach change detector to limit how often check occurs
 *
 * The following example defines a component with a large list of read-only data
 * that is expected to change constantly, many times per second.
 * To improve performance, we want to check and update the list
 * less often than the changes actually occur. To do that, we detach
 * the component's change detector and perform an explicit local check every five seconds.
 *
 * {@example core/ts/change_detect/change-detection.ts region='detach'}
 *
 *
 * ### Reattaching a detached component
 *
 * The following example creates a component displaying live data.
 * The component detaches its change detector from the main change detector tree
 * when the `live` property is set to false, and reattaches it when the property
 * becomes true.
 *
 * {@example core/ts/change_detect/change-detection.ts region='reattach'}
 *
 * @publicApi
 */
class ChangeDetectorRef {
    /**
     * @internal
     * @nocollapse
     */
    static __NG_ELEMENT_ID__ = injectChangeDetectorRef;
}
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
function injectChangeDetectorRef(flags) {
    return createViewRef(getCurrentTNode(), getLView(), (flags & 16 /* InternalInjectFlags.ForPipe */) === 16 /* InternalInjectFlags.ForPipe */);
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 *
 * @param tNode The node that is requesting a ChangeDetectorRef
 * @param lView The view to which the node belongs
 * @param isPipe Whether the view is being injected into a pipe.
 * @returns The ChangeDetectorRef to use
 */
function createViewRef(tNode, lView, isPipe) {
    if (isComponentHost(tNode) && !isPipe) {
        // The LView represents the location where the component is declared.
        // Instead we want the LView for the component View and so we need to look it up.
        const componentView = getComponentLViewByIndex(tNode.index, lView); // look down
        return new ViewRef$1(componentView, componentView);
    }
    else if (tNode.type &
        (3 /* TNodeType.AnyRNode */ | 12 /* TNodeType.AnyContainer */ | 32 /* TNodeType.Icu */ | 128 /* TNodeType.LetDeclaration */)) {
        // The LView represents the location where the injection is requested from.
        // We need to locate the containing LView (in case where the `lView` is an embedded view)
        const hostComponentView = lView[DECLARATION_COMPONENT_VIEW]; // look up
        return new ViewRef$1(hostComponentView, lView);
    }
    return null;
}

/**
 * Represents an Angular view.
 *
 * @see {@link /api/core/ChangeDetectorRef?tab=usage-notes Change detection usage}
 *
 * @publicApi
 */
class ViewRef extends ChangeDetectorRef {
}
/**
 * Represents an Angular view in a view container.
 * An embedded view can be referenced from a component
 * other than the hosting component whose template defines it, or it can be defined
 * independently by a `TemplateRef`.
 *
 * Properties of elements in a view can change, but the structure (number and order) of elements in
 * a view cannot. Change the structure of elements by inserting, moving, or
 * removing nested views in a view container.
 *
 * @see {@link ViewContainerRef}
 *
 * @usageNotes
 *
 * The following template breaks down into two separate `TemplateRef` instances,
 * an outer one and an inner one.
 *
 * ```html
 * Count: {{items.length}}
 * <ul>
 *   <li *ngFor="let  item of items">{{item}}</li>
 * </ul>
 * ```
 *
 * This is the outer `TemplateRef`:
 *
 * ```html
 * Count: {{items.length}}
 * <ul>
 *   <ng-template ngFor let-item [ngForOf]="items"></ng-template>
 * </ul>
 * ```
 *
 * This is the inner `TemplateRef`:
 *
 * ```html
 *   <li>{{item}}</li>
 * ```
 *
 * The outer and inner `TemplateRef` instances are assembled into views as follows:
 *
 * ```html
 * <!-- ViewRef: outer-0 -->
 * Count: 2
 * <ul>
 *   <ng-template view-container-ref></ng-template>
 *   <!-- ViewRef: inner-1 --><li>first</li><!-- /ViewRef: inner-1 -->
 *   <!-- ViewRef: inner-2 --><li>second</li><!-- /ViewRef: inner-2 -->
 * </ul>
 * <!-- /ViewRef: outer-0 -->
 * ```
 * @publicApi
 */
class EmbeddedViewRef extends ViewRef {
}

class DefaultIterableDifferFactory {
    constructor() { }
    supports(obj) {
        return isListLikeIterable(obj);
    }
    create(trackByFn) {
        return new DefaultIterableDiffer(trackByFn);
    }
}
const trackByIdentity = (index, item) => item;
/**
 * @deprecated v4.0.0 - Should not be part of public API.
 * @publicApi
 */
class DefaultIterableDiffer {
    length = 0;
    // TODO: confirm the usage of `collection` as it's unused, readonly and on a non public API.
    collection;
    // Keeps track of the used records at any point in time (during & across `_check()` calls)
    _linkedRecords = null;
    // Keeps track of the removed records at any point in time during `_check()` calls.
    _unlinkedRecords = null;
    _previousItHead = null;
    _itHead = null;
    _itTail = null;
    _additionsHead = null;
    _additionsTail = null;
    _movesHead = null;
    _movesTail = null;
    _removalsHead = null;
    _removalsTail = null;
    // Keeps track of records where custom track by is the same, but item identity has changed
    _identityChangesHead = null;
    _identityChangesTail = null;
    _trackByFn;
    constructor(trackByFn) {
        this._trackByFn = trackByFn || trackByIdentity;
    }
    forEachItem(fn) {
        let record;
        for (record = this._itHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    forEachOperation(fn) {
        let nextIt = this._itHead;
        let nextRemove = this._removalsHead;
        let addRemoveOffset = 0;
        let moveOffsets = null;
        while (nextIt || nextRemove) {
            // Figure out which is the next record to process
            // Order: remove, add, move
            const record = !nextRemove ||
                (nextIt &&
                    nextIt.currentIndex < getPreviousIndex(nextRemove, addRemoveOffset, moveOffsets))
                ? nextIt
                : nextRemove;
            const adjPreviousIndex = getPreviousIndex(record, addRemoveOffset, moveOffsets);
            const currentIndex = record.currentIndex;
            // consume the item, and adjust the addRemoveOffset and update moveDistance if necessary
            if (record === nextRemove) {
                addRemoveOffset--;
                nextRemove = nextRemove._nextRemoved;
            }
            else {
                nextIt = nextIt._next;
                if (record.previousIndex == null) {
                    addRemoveOffset++;
                }
                else {
                    // INVARIANT:  currentIndex < previousIndex
                    if (!moveOffsets)
                        moveOffsets = [];
                    const localMovePreviousIndex = adjPreviousIndex - addRemoveOffset;
                    const localCurrentIndex = currentIndex - addRemoveOffset;
                    if (localMovePreviousIndex != localCurrentIndex) {
                        for (let i = 0; i < localMovePreviousIndex; i++) {
                            const offset = i < moveOffsets.length ? moveOffsets[i] : (moveOffsets[i] = 0);
                            const index = offset + i;
                            if (localCurrentIndex <= index && index < localMovePreviousIndex) {
                                moveOffsets[i] = offset + 1;
                            }
                        }
                        const previousIndex = record.previousIndex;
                        moveOffsets[previousIndex] = localCurrentIndex - localMovePreviousIndex;
                    }
                }
            }
            if (adjPreviousIndex !== currentIndex) {
                fn(record, adjPreviousIndex, currentIndex);
            }
        }
    }
    forEachPreviousItem(fn) {
        let record;
        for (record = this._previousItHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    }
    forEachAddedItem(fn) {
        let record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    }
    forEachMovedItem(fn) {
        let record;
        for (record = this._movesHead; record !== null; record = record._nextMoved) {
            fn(record);
        }
    }
    forEachRemovedItem(fn) {
        let record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    }
    forEachIdentityChange(fn) {
        let record;
        for (record = this._identityChangesHead; record !== null; record = record._nextIdentityChange) {
            fn(record);
        }
    }
    diff(collection) {
        if (collection == null)
            collection = [];
        if (!isListLikeIterable(collection)) {
            throw new RuntimeError(900 /* RuntimeErrorCode.INVALID_DIFFER_INPUT */, ngDevMode &&
                `Error trying to diff '${stringify(collection)}'. Only arrays and iterables are allowed`);
        }
        if (this.check(collection)) {
            return this;
        }
        else {
            return null;
        }
    }
    onDestroy() { }
    check(collection) {
        this._reset();
        let record = this._itHead;
        let mayBeDirty = false;
        let index;
        let item;
        let itemTrackBy;
        if (Array.isArray(collection)) {
            this.length = collection.length;
            for (let index = 0; index < this.length; index++) {
                item = collection[index];
                itemTrackBy = this._trackByFn(index, item);
                if (record === null || !Object.is(record.trackById, itemTrackBy)) {
                    record = this._mismatch(record, item, itemTrackBy, index);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = this._verifyReinsertion(record, item, itemTrackBy, index);
                    }
                    if (!Object.is(record.item, item))
                        this._addIdentityChange(record, item);
                }
                record = record._next;
            }
        }
        else {
            index = 0;
            iterateListLike(collection, (item) => {
                itemTrackBy = this._trackByFn(index, item);
                if (record === null || !Object.is(record.trackById, itemTrackBy)) {
                    record = this._mismatch(record, item, itemTrackBy, index);
                    mayBeDirty = true;
                }
                else {
                    if (mayBeDirty) {
                        // TODO(misko): can we limit this to duplicates only?
                        record = this._verifyReinsertion(record, item, itemTrackBy, index);
                    }
                    if (!Object.is(record.item, item))
                        this._addIdentityChange(record, item);
                }
                record = record._next;
                index++;
            });
            this.length = index;
        }
        this._truncate(record);
        this.collection = collection;
        return this.isDirty;
    }
    /* CollectionChanges is considered dirty if it has any additions, moves, removals, or identity
     * changes.
     */
    get isDirty() {
        return (this._additionsHead !== null ||
            this._movesHead !== null ||
            this._removalsHead !== null ||
            this._identityChangesHead !== null);
    }
    /**
     * Reset the state of the change objects to show no changes. This means set previousKey to
     * currentKey, and clear all of the queues (additions, moves, removals).
     * Set the previousIndexes of moved and added items to their currentIndexes
     * Reset the list of additions, moves and removals
     *
     * @internal
     */
    _reset() {
        if (this.isDirty) {
            let record;
            for (record = this._previousItHead = this._itHead; record !== null; record = record._next) {
                record._nextPrevious = record._next;
            }
            for (record = this._additionsHead; record !== null; record = record._nextAdded) {
                record.previousIndex = record.currentIndex;
            }
            this._additionsHead = this._additionsTail = null;
            for (record = this._movesHead; record !== null; record = record._nextMoved) {
                record.previousIndex = record.currentIndex;
            }
            this._movesHead = this._movesTail = null;
            this._removalsHead = this._removalsTail = null;
            this._identityChangesHead = this._identityChangesTail = null;
            // TODO(vicb): when assert gets supported
            // assert(!this.isDirty);
        }
    }
    /**
     * This is the core function which handles differences between collections.
     *
     * - `record` is the record which we saw at this position last time. If null then it is a new
     *   item.
     * - `item` is the current item in the collection
     * - `index` is the position of the item in the collection
     *
     * @internal
     */
    _mismatch(record, item, itemTrackBy, index) {
        // The previous record after which we will append the current one.
        let previousRecord;
        if (record === null) {
            previousRecord = this._itTail;
        }
        else {
            previousRecord = record._prev;
            // Remove the record from the collection since we know it does not match the item.
            this._remove(record);
        }
        // See if we have evicted the item, which used to be at some anterior position of _itHead list.
        record = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
        if (record !== null) {
            // It is an item which we have evicted earlier: reinsert it back into the list.
            // But first we need to check if identity changed, so we can update in view if necessary.
            if (!Object.is(record.item, item))
                this._addIdentityChange(record, item);
            this._reinsertAfter(record, previousRecord, index);
        }
        else {
            // Attempt to see if the item is at some posterior position of _itHead list.
            record = this._linkedRecords === null ? null : this._linkedRecords.get(itemTrackBy, index);
            if (record !== null) {
                // We have the item in _itHead at/after `index` position. We need to move it forward in the
                // collection.
                // But first we need to check if identity changed, so we can update in view if necessary.
                if (!Object.is(record.item, item))
                    this._addIdentityChange(record, item);
                this._moveAfter(record, previousRecord, index);
            }
            else {
                // It is a new item: add it.
                record = this._addAfter(new IterableChangeRecord_(item, itemTrackBy), previousRecord, index);
            }
        }
        return record;
    }
    /**
     * This check is only needed if an array contains duplicates. (Short circuit of nothing dirty)
     *
     * Use case: `[a, a]` => `[b, a, a]`
     *
     * If we did not have this check then the insertion of `b` would:
     *   1) evict first `a`
     *   2) insert `b` at `0` index.
     *   3) leave `a` at index `1` as is. <-- this is wrong!
     *   3) reinsert `a` at index 2. <-- this is wrong!
     *
     * The correct behavior is:
     *   1) evict first `a`
     *   2) insert `b` at `0` index.
     *   3) reinsert `a` at index 1.
     *   3) move `a` at from `1` to `2`.
     *
     *
     * Double check that we have not evicted a duplicate item. We need to check if the item type may
     * have already been removed:
     * The insertion of b will evict the first 'a'. If we don't reinsert it now it will be reinserted
     * at the end. Which will show up as the two 'a's switching position. This is incorrect, since a
     * better way to think of it is as insert of 'b' rather then switch 'a' with 'b' and then add 'a'
     * at the end.
     *
     * @internal
     */
    _verifyReinsertion(record, item, itemTrackBy, index) {
        let reinsertRecord = this._unlinkedRecords === null ? null : this._unlinkedRecords.get(itemTrackBy, null);
        if (reinsertRecord !== null) {
            record = this._reinsertAfter(reinsertRecord, record._prev, index);
        }
        else if (record.currentIndex != index) {
            record.currentIndex = index;
            this._addToMoves(record, index);
        }
        return record;
    }
    /**
     * Get rid of any excess {@link IterableChangeRecord_}s from the previous collection
     *
     * - `record` The first excess {@link IterableChangeRecord_}.
     *
     * @internal
     */
    _truncate(record) {
        // Anything after that needs to be removed;
        while (record !== null) {
            const nextRecord = record._next;
            this._addToRemovals(this._unlink(record));
            record = nextRecord;
        }
        if (this._unlinkedRecords !== null) {
            this._unlinkedRecords.clear();
        }
        if (this._additionsTail !== null) {
            this._additionsTail._nextAdded = null;
        }
        if (this._movesTail !== null) {
            this._movesTail._nextMoved = null;
        }
        if (this._itTail !== null) {
            this._itTail._next = null;
        }
        if (this._removalsTail !== null) {
            this._removalsTail._nextRemoved = null;
        }
        if (this._identityChangesTail !== null) {
            this._identityChangesTail._nextIdentityChange = null;
        }
    }
    /** @internal */
    _reinsertAfter(record, prevRecord, index) {
        if (this._unlinkedRecords !== null) {
            this._unlinkedRecords.remove(record);
        }
        const prev = record._prevRemoved;
        const next = record._nextRemoved;
        if (prev === null) {
            this._removalsHead = next;
        }
        else {
            prev._nextRemoved = next;
        }
        if (next === null) {
            this._removalsTail = prev;
        }
        else {
            next._prevRemoved = prev;
        }
        this._insertAfter(record, prevRecord, index);
        this._addToMoves(record, index);
        return record;
    }
    /** @internal */
    _moveAfter(record, prevRecord, index) {
        this._unlink(record);
        this._insertAfter(record, prevRecord, index);
        this._addToMoves(record, index);
        return record;
    }
    /** @internal */
    _addAfter(record, prevRecord, index) {
        this._insertAfter(record, prevRecord, index);
        if (this._additionsTail === null) {
            // TODO(vicb):
            // assert(this._additionsHead === null);
            this._additionsTail = this._additionsHead = record;
        }
        else {
            // TODO(vicb):
            // assert(_additionsTail._nextAdded === null);
            // assert(record._nextAdded === null);
            this._additionsTail = this._additionsTail._nextAdded = record;
        }
        return record;
    }
    /** @internal */
    _insertAfter(record, prevRecord, index) {
        // TODO(vicb):
        // assert(record != prevRecord);
        // assert(record._next === null);
        // assert(record._prev === null);
        const next = prevRecord === null ? this._itHead : prevRecord._next;
        // TODO(vicb):
        // assert(next != record);
        // assert(prevRecord != record);
        record._next = next;
        record._prev = prevRecord;
        if (next === null) {
            this._itTail = record;
        }
        else {
            next._prev = record;
        }
        if (prevRecord === null) {
            this._itHead = record;
        }
        else {
            prevRecord._next = record;
        }
        if (this._linkedRecords === null) {
            this._linkedRecords = new _DuplicateMap();
        }
        this._linkedRecords.put(record);
        record.currentIndex = index;
        return record;
    }
    /** @internal */
    _remove(record) {
        return this._addToRemovals(this._unlink(record));
    }
    /** @internal */
    _unlink(record) {
        if (this._linkedRecords !== null) {
            this._linkedRecords.remove(record);
        }
        const prev = record._prev;
        const next = record._next;
        // TODO(vicb):
        // assert((record._prev = null) === null);
        // assert((record._next = null) === null);
        if (prev === null) {
            this._itHead = next;
        }
        else {
            prev._next = next;
        }
        if (next === null) {
            this._itTail = prev;
        }
        else {
            next._prev = prev;
        }
        return record;
    }
    /** @internal */
    _addToMoves(record, toIndex) {
        // TODO(vicb):
        // assert(record._nextMoved === null);
        if (record.previousIndex === toIndex) {
            return record;
        }
        if (this._movesTail === null) {
            // TODO(vicb):
            // assert(_movesHead === null);
            this._movesTail = this._movesHead = record;
        }
        else {
            // TODO(vicb):
            // assert(_movesTail._nextMoved === null);
            this._movesTail = this._movesTail._nextMoved = record;
        }
        return record;
    }
    _addToRemovals(record) {
        if (this._unlinkedRecords === null) {
            this._unlinkedRecords = new _DuplicateMap();
        }
        this._unlinkedRecords.put(record);
        record.currentIndex = null;
        record._nextRemoved = null;
        if (this._removalsTail === null) {
            // TODO(vicb):
            // assert(_removalsHead === null);
            this._removalsTail = this._removalsHead = record;
            record._prevRemoved = null;
        }
        else {
            // TODO(vicb):
            // assert(_removalsTail._nextRemoved === null);
            // assert(record._nextRemoved === null);
            record._prevRemoved = this._removalsTail;
            this._removalsTail = this._removalsTail._nextRemoved = record;
        }
        return record;
    }
    /** @internal */
    _addIdentityChange(record, item) {
        record.item = item;
        if (this._identityChangesTail === null) {
            this._identityChangesTail = this._identityChangesHead = record;
        }
        else {
            this._identityChangesTail = this._identityChangesTail._nextIdentityChange = record;
        }
        return record;
    }
}
class IterableChangeRecord_ {
    item;
    trackById;
    currentIndex = null;
    previousIndex = null;
    /** @internal */
    _nextPrevious = null;
    /** @internal */
    _prev = null;
    /** @internal */
    _next = null;
    /** @internal */
    _prevDup = null;
    /** @internal */
    _nextDup = null;
    /** @internal */
    _prevRemoved = null;
    /** @internal */
    _nextRemoved = null;
    /** @internal */
    _nextAdded = null;
    /** @internal */
    _nextMoved = null;
    /** @internal */
    _nextIdentityChange = null;
    constructor(item, trackById) {
        this.item = item;
        this.trackById = trackById;
    }
}
// A linked list of IterableChangeRecords with the same IterableChangeRecord_.item
class _DuplicateItemRecordList {
    /** @internal */
    _head = null;
    /** @internal */
    _tail = null;
    /**
     * Append the record to the list of duplicates.
     *
     * Note: by design all records in the list of duplicates hold the same value in record.item.
     */
    add(record) {
        if (this._head === null) {
            this._head = this._tail = record;
            record._nextDup = null;
            record._prevDup = null;
        }
        else {
            // TODO(vicb):
            // assert(record.item ==  _head.item ||
            //       record.item is num && record.item.isNaN && _head.item is num && _head.item.isNaN);
            this._tail._nextDup = record;
            record._prevDup = this._tail;
            record._nextDup = null;
            this._tail = record;
        }
    }
    // Returns a IterableChangeRecord_ having IterableChangeRecord_.trackById == trackById and
    // IterableChangeRecord_.currentIndex >= atOrAfterIndex
    get(trackById, atOrAfterIndex) {
        let record;
        for (record = this._head; record !== null; record = record._nextDup) {
            if ((atOrAfterIndex === null || atOrAfterIndex <= record.currentIndex) &&
                Object.is(record.trackById, trackById)) {
                return record;
            }
        }
        return null;
    }
    /**
     * Remove one {@link IterableChangeRecord_} from the list of duplicates.
     *
     * Returns whether the list of duplicates is empty.
     */
    remove(record) {
        // TODO(vicb):
        // assert(() {
        //  // verify that the record being removed is in the list.
        //  for (IterableChangeRecord_ cursor = _head; cursor != null; cursor = cursor._nextDup) {
        //    if (identical(cursor, record)) return true;
        //  }
        //  return false;
        //});
        const prev = record._prevDup;
        const next = record._nextDup;
        if (prev === null) {
            this._head = next;
        }
        else {
            prev._nextDup = next;
        }
        if (next === null) {
            this._tail = prev;
        }
        else {
            next._prevDup = prev;
        }
        return this._head === null;
    }
}
class _DuplicateMap {
    map = new Map();
    put(record) {
        const key = record.trackById;
        let duplicates = this.map.get(key);
        if (!duplicates) {
            duplicates = new _DuplicateItemRecordList();
            this.map.set(key, duplicates);
        }
        duplicates.add(record);
    }
    /**
     * Retrieve the `value` using key. Because the IterableChangeRecord_ value may be one which we
     * have already iterated over, we use the `atOrAfterIndex` to pretend it is not there.
     *
     * Use case: `[a, b, c, a, a]` if we are at index `3` which is the second `a` then asking if we
     * have any more `a`s needs to return the second `a`.
     */
    get(trackById, atOrAfterIndex) {
        const key = trackById;
        const recordList = this.map.get(key);
        return recordList ? recordList.get(trackById, atOrAfterIndex) : null;
    }
    /**
     * Removes a {@link IterableChangeRecord_} from the list of duplicates.
     *
     * The list of duplicates also is removed from the map if it gets empty.
     */
    remove(record) {
        const key = record.trackById;
        const recordList = this.map.get(key);
        // Remove the list of duplicates when it gets empty
        if (recordList.remove(record)) {
            this.map.delete(key);
        }
        return record;
    }
    get isEmpty() {
        return this.map.size === 0;
    }
    clear() {
        this.map.clear();
    }
}
function getPreviousIndex(item, addRemoveOffset, moveOffsets) {
    const previousIndex = item.previousIndex;
    if (previousIndex === null)
        return previousIndex;
    let moveOffset = 0;
    if (moveOffsets && previousIndex < moveOffsets.length) {
        moveOffset = moveOffsets[previousIndex];
    }
    return previousIndex + addRemoveOffset + moveOffset;
}

class DefaultKeyValueDifferFactory {
    constructor() { }
    supports(obj) {
        return obj instanceof Map || isJsObject(obj);
    }
    create() {
        return new DefaultKeyValueDiffer();
    }
}
class DefaultKeyValueDiffer {
    _records = new Map();
    _mapHead = null;
    // _appendAfter is used in the check loop
    _appendAfter = null;
    _previousMapHead = null;
    _changesHead = null;
    _changesTail = null;
    _additionsHead = null;
    _additionsTail = null;
    _removalsHead = null;
    _removalsTail = null;
    get isDirty() {
        return (this._additionsHead !== null || this._changesHead !== null || this._removalsHead !== null);
    }
    forEachItem(fn) {
        let record;
        for (record = this._mapHead; record !== null; record = record._next) {
            fn(record);
        }
    }
    forEachPreviousItem(fn) {
        let record;
        for (record = this._previousMapHead; record !== null; record = record._nextPrevious) {
            fn(record);
        }
    }
    forEachChangedItem(fn) {
        let record;
        for (record = this._changesHead; record !== null; record = record._nextChanged) {
            fn(record);
        }
    }
    forEachAddedItem(fn) {
        let record;
        for (record = this._additionsHead; record !== null; record = record._nextAdded) {
            fn(record);
        }
    }
    forEachRemovedItem(fn) {
        let record;
        for (record = this._removalsHead; record !== null; record = record._nextRemoved) {
            fn(record);
        }
    }
    diff(map) {
        if (!map) {
            map = new Map();
        }
        else if (!(map instanceof Map || isJsObject(map))) {
            throw new RuntimeError(900 /* RuntimeErrorCode.INVALID_DIFFER_INPUT */, ngDevMode && `Error trying to diff '${stringify(map)}'. Only maps and objects are allowed`);
        }
        return this.check(map) ? this : null;
    }
    onDestroy() { }
    /**
     * Check the current state of the map vs the previous.
     * The algorithm is optimised for when the keys do no change.
     */
    check(map) {
        this._reset();
        let insertBefore = this._mapHead;
        this._appendAfter = null;
        this._forEach(map, (value, key) => {
            if (insertBefore && insertBefore.key === key) {
                this._maybeAddToChanges(insertBefore, value);
                this._appendAfter = insertBefore;
                insertBefore = insertBefore._next;
            }
            else {
                const record = this._getOrCreateRecordForKey(key, value);
                insertBefore = this._insertBeforeOrAppend(insertBefore, record);
            }
        });
        // Items remaining at the end of the list have been deleted
        if (insertBefore) {
            if (insertBefore._prev) {
                insertBefore._prev._next = null;
            }
            this._removalsHead = insertBefore;
            for (let record = insertBefore; record !== null; record = record._nextRemoved) {
                if (record === this._mapHead) {
                    this._mapHead = null;
                }
                this._records.delete(record.key);
                record._nextRemoved = record._next;
                record.previousValue = record.currentValue;
                record.currentValue = null;
                record._prev = null;
                record._next = null;
            }
        }
        // Make sure tails have no next records from previous runs
        if (this._changesTail)
            this._changesTail._nextChanged = null;
        if (this._additionsTail)
            this._additionsTail._nextAdded = null;
        return this.isDirty;
    }
    /**
     * Inserts a record before `before` or append at the end of the list when `before` is null.
     *
     * Notes:
     * - This method appends at `this._appendAfter`,
     * - This method updates `this._appendAfter`,
     * - The return value is the new value for the insertion pointer.
     */
    _insertBeforeOrAppend(before, record) {
        if (before) {
            const prev = before._prev;
            record._next = before;
            record._prev = prev;
            before._prev = record;
            if (prev) {
                prev._next = record;
            }
            if (before === this._mapHead) {
                this._mapHead = record;
            }
            this._appendAfter = before;
            return before;
        }
        if (this._appendAfter) {
            this._appendAfter._next = record;
            record._prev = this._appendAfter;
        }
        else {
            this._mapHead = record;
        }
        this._appendAfter = record;
        return null;
    }
    _getOrCreateRecordForKey(key, value) {
        if (this._records.has(key)) {
            const record = this._records.get(key);
            this._maybeAddToChanges(record, value);
            const prev = record._prev;
            const next = record._next;
            if (prev) {
                prev._next = next;
            }
            if (next) {
                next._prev = prev;
            }
            record._next = null;
            record._prev = null;
            return record;
        }
        const record = new KeyValueChangeRecord_(key);
        this._records.set(key, record);
        record.currentValue = value;
        this._addToAdditions(record);
        return record;
    }
    /** @internal */
    _reset() {
        if (this.isDirty) {
            let record;
            // let `_previousMapHead` contain the state of the map before the changes
            this._previousMapHead = this._mapHead;
            for (record = this._previousMapHead; record !== null; record = record._next) {
                record._nextPrevious = record._next;
            }
            // Update `record.previousValue` with the value of the item before the changes
            // We need to update all changed items (that's those which have been added and changed)
            for (record = this._changesHead; record !== null; record = record._nextChanged) {
                record.previousValue = record.currentValue;
            }
            for (record = this._additionsHead; record != null; record = record._nextAdded) {
                record.previousValue = record.currentValue;
            }
            this._changesHead = this._changesTail = null;
            this._additionsHead = this._additionsTail = null;
            this._removalsHead = null;
        }
    }
    // Add the record or a given key to the list of changes only when the value has actually changed
    _maybeAddToChanges(record, newValue) {
        if (!Object.is(newValue, record.currentValue)) {
            record.previousValue = record.currentValue;
            record.currentValue = newValue;
            this._addToChanges(record);
        }
    }
    _addToAdditions(record) {
        if (this._additionsHead === null) {
            this._additionsHead = this._additionsTail = record;
        }
        else {
            this._additionsTail._nextAdded = record;
            this._additionsTail = record;
        }
    }
    _addToChanges(record) {
        if (this._changesHead === null) {
            this._changesHead = this._changesTail = record;
        }
        else {
            this._changesTail._nextChanged = record;
            this._changesTail = record;
        }
    }
    /** @internal */
    _forEach(obj, fn) {
        if (obj instanceof Map) {
            obj.forEach(fn);
        }
        else {
            Object.keys(obj).forEach((k) => fn(obj[k], k));
        }
    }
}
class KeyValueChangeRecord_ {
    key;
    previousValue = null;
    currentValue = null;
    /** @internal */
    _nextPrevious = null;
    /** @internal */
    _next = null;
    /** @internal */
    _prev = null;
    /** @internal */
    _nextAdded = null;
    /** @internal */
    _nextRemoved = null;
    /** @internal */
    _nextChanged = null;
    constructor(key) {
        this.key = key;
    }
}

function defaultIterableDiffersFactory() {
    return new IterableDiffers([new DefaultIterableDifferFactory()]);
}
/**
 * A repository of different iterable diffing strategies used by NgFor, NgClass, and others.
 *
 * @publicApi
 */
class IterableDiffers {
    factories;
    /** @nocollapse */
    static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ __defineInjectable({
        token: IterableDiffers,
        providedIn: 'root',
        factory: defaultIterableDiffersFactory,
    });
    constructor(factories) {
        this.factories = factories;
    }
    static create(factories, parent) {
        if (parent != null) {
            const copied = parent.factories.slice();
            factories = factories.concat(copied);
        }
        return new IterableDiffers(factories);
    }
    /**
     * Takes an array of {@link IterableDifferFactory} and returns a provider used to extend the
     * inherited {@link IterableDiffers} instance with the provided factories and return a new
     * {@link IterableDiffers} instance.
     *
     * @usageNotes
     * ### Example
     *
     * The following example shows how to extend an existing list of factories,
     * which will only be applied to the injector for this component and its children.
     * This step is all that's required to make a new {@link IterableDiffer} available.
     *
     * ```ts
     * @Component({
     *   viewProviders: [
     *     IterableDiffers.extend([new ImmutableListDiffer()])
     *   ]
     * })
     * ```
     */
    static extend(factories) {
        return {
            provide: IterableDiffers,
            useFactory: (parent) => {
                // if parent is null, it means that we are in the root injector and we have just overridden
                // the default injection mechanism for IterableDiffers, in such a case just assume
                // `defaultIterableDiffersFactory`.
                return IterableDiffers.create(factories, parent || defaultIterableDiffersFactory());
            },
            // Dependency technically isn't optional, but we can provide a better error message this way.
            deps: [[IterableDiffers, new SkipSelf(), new Optional()]],
        };
    }
    find(iterable) {
        const factory = this.factories.find((f) => f.supports(iterable));
        if (factory != null) {
            return factory;
        }
        else {
            throw new RuntimeError(901 /* RuntimeErrorCode.NO_SUPPORTING_DIFFER_FACTORY */, ngDevMode &&
                `Cannot find a differ supporting object '${iterable}' of type '${getTypeNameForDebugging(iterable)}'`);
        }
    }
}
function getTypeNameForDebugging(type) {
    return type['name'] || typeof type;
}

function defaultKeyValueDiffersFactory() {
    return new KeyValueDiffers([new DefaultKeyValueDifferFactory()]);
}
/**
 * A repository of different Map diffing strategies used by NgClass, NgStyle, and others.
 *
 * @publicApi
 */
class KeyValueDiffers {
    /** @nocollapse */
    static ɵprov = /** @pureOrBreakMyCode */ /* @__PURE__ */ __defineInjectable({
        token: KeyValueDiffers,
        providedIn: 'root',
        factory: defaultKeyValueDiffersFactory,
    });
    factories;
    constructor(factories) {
        this.factories = factories;
    }
    static create(factories, parent) {
        if (parent) {
            const copied = parent.factories.slice();
            factories = factories.concat(copied);
        }
        return new KeyValueDiffers(factories);
    }
    /**
     * Takes an array of {@link KeyValueDifferFactory} and returns a provider used to extend the
     * inherited {@link KeyValueDiffers} instance with the provided factories and return a new
     * {@link KeyValueDiffers} instance.
     *
     * @usageNotes
     * ### Example
     *
     * The following example shows how to extend an existing list of factories,
     * which will only be applied to the injector for this component and its children.
     * This step is all that's required to make a new {@link KeyValueDiffer} available.
     *
     * ```ts
     * @Component({
     *   viewProviders: [
     *     KeyValueDiffers.extend([new ImmutableMapDiffer()])
     *   ]
     * })
     * ```
     */
    static extend(factories) {
        return {
            provide: KeyValueDiffers,
            useFactory: (parent) => {
                // if parent is null, it means that we are in the root injector and we have just overridden
                // the default injection mechanism for KeyValueDiffers, in such a case just assume
                // `defaultKeyValueDiffersFactory`.
                return KeyValueDiffers.create(factories, parent || defaultKeyValueDiffersFactory());
            },
            // Dependency technically isn't optional, but we can provide a better error message this way.
            deps: [[KeyValueDiffers, new SkipSelf(), new Optional()]],
        };
    }
    find(kv) {
        const factory = this.factories.find((f) => f.supports(kv));
        if (factory) {
            return factory;
        }
        throw new RuntimeError(901 /* RuntimeErrorCode.NO_SUPPORTING_DIFFER_FACTORY */, ngDevMode && `Cannot find a differ supporting object '${kv}'`);
    }
}

/**
 * Structural diffing for `Object`s and `Map`s.
 */
const keyValDiff = [new DefaultKeyValueDifferFactory()];
/**
 * Structural diffing for `Iterable` types such as `Array`s.
 */
const iterableDiff = [new DefaultIterableDifferFactory()];
const defaultIterableDiffers = new IterableDiffers(iterableDiff);
const defaultKeyValueDiffers = new KeyValueDiffers(keyValDiff);

/**
 * This platform has to be included in any other platform
 *
 * @publicApi
 */
const platformCore = createPlatformFactory(null, 'core', []);

/**
 * Re-exported by `BrowserModule`, which is included automatically in the root
 * `AppModule` when you create a new app with the CLI `new` command. Eagerly injects
 * `ApplicationRef` to instantiate it.
 *
 * @publicApi
 */
class ApplicationModule {
    // Inject ApplicationRef to make it eager...
    constructor(appRef) { }
    static ɵfac = function ApplicationModule_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || ApplicationModule)(__inject(ApplicationRef)); };
    static ɵmod = /*@__PURE__*/ __defineNgModule({ type: ApplicationModule });
    static ɵinj = /*@__PURE__*/ __defineInjector({});
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(ApplicationModule, [{
        type: NgModule
    }], () => [{ type: ApplicationRef }], null); })();

/**
 * Internal create application API that implements the core application creation logic and optional
 * bootstrap logic.
 *
 * Platforms (such as `platform-browser`) may require different set of application and platform
 * providers for an application to function correctly. As a result, platforms may use this function
 * internally and supply the necessary providers during the bootstrap, while exposing
 * platform-specific APIs as a part of their public API.
 *
 * @returns A promise that returns an `ApplicationRef` instance once resolved.
 */
function internalCreateApplication(config) {
    profiler(8 /* ProfilerEvent.BootstrapApplicationStart */);
    try {
        const { rootComponent, appProviders, platformProviders } = config;
        if ((typeof ngDevMode === 'undefined' || ngDevMode) && rootComponent !== undefined) {
            assertStandaloneComponentType(rootComponent);
        }
        const platformInjector = createOrReusePlatformInjector(platformProviders);
        // Create root application injector based on a set of providers configured at the platform
        // bootstrap level as well as providers passed to the bootstrap call by a user.
        const allAppProviders = [
            internalProvideZoneChangeDetection({}),
            { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
            errorHandlerEnvironmentInitializer,
            ...(appProviders || []),
        ];
        const adapter = new EnvironmentNgModuleRefAdapter({
            providers: allAppProviders,
            parent: platformInjector,
            debugName: typeof ngDevMode === 'undefined' || ngDevMode ? 'Environment Injector' : '',
            // We skip environment initializers because we need to run them inside the NgZone, which
            // happens after we get the NgZone instance from the Injector.
            runEnvironmentInitializers: false,
        });
        return bootstrap({
            r3Injector: adapter.injector,
            platformInjector,
            rootComponent,
        });
    }
    catch (e) {
        return Promise.reject(e);
    }
    finally {
        profiler(9 /* ProfilerEvent.BootstrapApplicationEnd */);
    }
}

/** Apps in which we've enabled event replay.
 *  This is to prevent initializing event replay more than once per app.
 */
const appsWithEventReplay = new WeakSet();
/**
 * The key that represents all replayable elements that are not in defer blocks.
 */
const EAGER_CONTENT_LISTENERS_KEY = '';
/**
 * A list of block events that need to be replayed
 */
let blockEventQueue = [];
/**
 * Determines whether Event Replay feature should be activated on the client.
 */
function shouldEnableEventReplay(injector) {
    return injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
}
/**
 * Returns a set of providers required to setup support for event replay.
 * Requires hydration to be enabled separately.
 */
function withEventReplay() {
    const providers = [
        {
            provide: IS_EVENT_REPLAY_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (typeof ngServerMode === 'undefined' || !ngServerMode) {
                    // Note: globalThis[CONTRACT_PROPERTY] may be undefined in case Event Replay feature
                    // is enabled, but there are no events configured in this application, in which case
                    // we don't activate this feature, since there are no events to replay.
                    const appId = inject(APP_ID);
                    isEnabled = !!window._ejsas?.[appId];
                }
                if (isEnabled) {
                    performanceMarkFeature('NgEventReplay');
                }
                return isEnabled;
            },
        },
    ];
    if (typeof ngServerMode === 'undefined' || !ngServerMode) {
        providers.push({
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                const appRef = inject(ApplicationRef);
                const { injector } = appRef;
                // We have to check for the appRef here due to the possibility of multiple apps
                // being present on the same page. We only want to enable event replay for the
                // apps that actually want it.
                if (!appsWithEventReplay.has(appRef)) {
                    const jsActionMap = inject(JSACTION_BLOCK_ELEMENT_MAP);
                    if (shouldEnableEventReplay(injector)) {
                        const appId = injector.get(APP_ID);
                        setStashFn(appId, (rEl, eventName, listenerFn) => {
                            // If a user binds to a ng-container and uses a directive that binds using a host listener,
                            // this element could be a comment node. So we need to ensure we have an actual element
                            // node before stashing anything.
                            if (rEl.nodeType !== Node.ELEMENT_NODE)
                                return;
                            sharedStashFunction(rEl, eventName, listenerFn);
                            sharedMapFunction(rEl, jsActionMap);
                        });
                    }
                }
            },
            multi: true,
        }, {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                const appRef = inject(ApplicationRef);
                const { injector } = appRef;
                return () => {
                    // We have to check for the appRef here due to the possibility of multiple apps
                    // being present on the same page. We only want to enable event replay for the
                    // apps that actually want it.
                    if (!shouldEnableEventReplay(injector) || appsWithEventReplay.has(appRef)) {
                        return;
                    }
                    appsWithEventReplay.add(appRef);
                    appRef.onDestroy(() => {
                        appsWithEventReplay.delete(appRef);
                        // Ensure that we're always safe calling this in the browser.
                        if (typeof ngServerMode !== 'undefined' && !ngServerMode) {
                            const appId = injector.get(APP_ID);
                            // `_ejsa` should be deleted when the app is destroyed, ensuring that
                            // no elements are still captured in the global list and are not prevented
                            // from being garbage collected.
                            clearAppScopedEarlyEventContract(appId);
                            // Clean up the reference to the function set by the environment initializer,
                            // as the function closure may capture injected elements and prevent them
                            // from being properly garbage collected.
                            clearStashFn(appId);
                        }
                    });
                    // Kick off event replay logic once hydration for the initial part
                    // of the application is completed. This timing is similar to the unclaimed
                    // dehydrated views cleanup timing.
                    appRef.whenStable().then(() => {
                        // Note: we have to check whether the application is destroyed before
                        // performing other operations with the `injector`.
                        // The application may be destroyed **before** it becomes stable, so when
                        // the `whenStable` resolves, the injector might already be in
                        // a destroyed state. Thus, calling `injector.get` would throw an error
                        // indicating that the injector has already been destroyed.
                        if (appRef.destroyed) {
                            return;
                        }
                        const eventContractDetails = injector.get(JSACTION_EVENT_CONTRACT);
                        initEventReplay(eventContractDetails, injector);
                        const jsActionMap = injector.get(JSACTION_BLOCK_ELEMENT_MAP);
                        jsActionMap.get(EAGER_CONTENT_LISTENERS_KEY)?.forEach(removeListeners);
                        jsActionMap.delete(EAGER_CONTENT_LISTENERS_KEY);
                        const eventContract = eventContractDetails.instance;
                        // This removes event listeners registered through the container manager,
                        // as listeners registered on `document.body` might never be removed if we
                        // don't clean up the contract.
                        if (isIncrementalHydrationEnabled(injector)) {
                            // When incremental hydration is enabled, we cannot clean up the event
                            // contract immediately because we're unaware if there are any deferred
                            // blocks to hydrate. We can only schedule a contract cleanup when the
                            // app is destroyed.
                            appRef.onDestroy(() => eventContract.cleanUp());
                        }
                        else {
                            eventContract.cleanUp();
                        }
                    });
                };
            },
            multi: true,
        });
    }
    return providers;
}
const initEventReplay = (eventDelegation, injector) => {
    const appId = injector.get(APP_ID);
    // This is set in packages/platform-server/src/utils.ts
    const earlyJsactionData = window._ejsas[appId];
    const eventContract = (eventDelegation.instance = new EventContract(new EventContractContainer(earlyJsactionData.c)));
    for (const et of earlyJsactionData.et) {
        eventContract.addEvent(et);
    }
    for (const et of earlyJsactionData.etc) {
        eventContract.addEvent(et);
    }
    const eventInfos = getAppScopedQueuedEventInfos(appId);
    eventContract.replayEarlyEventInfos(eventInfos);
    clearAppScopedEarlyEventContract(appId);
    const dispatcher = new EventDispatcher((event) => {
        invokeRegisteredReplayListeners(injector, event, event.currentTarget);
    });
    registerDispatcher(eventContract, dispatcher);
};
/**
 * Extracts information about all DOM events (added in a template) registered on elements in a give
 * LView. Maps collected events to a corresponding DOM element (an element is used as a key).
 */
function collectDomEventsInfo(tView, lView, eventTypesToReplay) {
    const domEventsInfo = new Map();
    const lCleanup = lView[CLEANUP];
    const tCleanup = tView.cleanup;
    if (!tCleanup || !lCleanup) {
        return domEventsInfo;
    }
    for (let i = 0; i < tCleanup.length;) {
        const firstParam = tCleanup[i++];
        const secondParam = tCleanup[i++];
        if (typeof firstParam !== 'string') {
            continue;
        }
        const eventType = firstParam;
        if (!isEarlyEventType(eventType)) {
            continue;
        }
        if (isCaptureEventType(eventType)) {
            eventTypesToReplay.capture.add(eventType);
        }
        else {
            eventTypesToReplay.regular.add(eventType);
        }
        const listenerElement = unwrapRNode(lView[secondParam]);
        i++; // move the cursor to the next position (location of the listener idx)
        const useCaptureOrIndx = tCleanup[i++];
        // if useCaptureOrIndx is boolean then report it as is.
        // if useCaptureOrIndx is positive number then it in unsubscribe method
        // if useCaptureOrIndx is negative number then it is a Subscription
        const isDomEvent = typeof useCaptureOrIndx === 'boolean' || useCaptureOrIndx >= 0;
        if (!isDomEvent) {
            continue;
        }
        if (!domEventsInfo.has(listenerElement)) {
            domEventsInfo.set(listenerElement, [eventType]);
        }
        else {
            domEventsInfo.get(listenerElement).push(eventType);
        }
    }
    return domEventsInfo;
}
function invokeRegisteredReplayListeners(injector, event, currentTarget) {
    const blockName = (currentTarget && currentTarget.getAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE)) ?? '';
    if (/d\d+/.test(blockName)) {
        hydrateAndInvokeBlockListeners(blockName, injector, event, currentTarget);
    }
    else if (event.eventPhase === EventPhase.REPLAY) {
        invokeListeners(event, currentTarget);
    }
}
function hydrateAndInvokeBlockListeners(blockName, injector, event, currentTarget) {
    blockEventQueue.push({ event, currentTarget });
    triggerHydrationFromBlockName(injector, blockName, replayQueuedBlockEvents);
}
function replayQueuedBlockEvents(hydratedBlocks) {
    // clone the queue
    const queue = [...blockEventQueue];
    const hydrated = new Set(hydratedBlocks);
    // empty it
    blockEventQueue = [];
    for (let { event, currentTarget } of queue) {
        const blockName = currentTarget.getAttribute(DEFER_BLOCK_SSR_ID_ATTRIBUTE);
        if (hydrated.has(blockName)) {
            invokeListeners(event, currentTarget);
        }
        else {
            // requeue events that weren't yet hydrated
            blockEventQueue.push({ event, currentTarget });
        }
    }
}

/**
 * A collection that tracks all serialized views (`ngh` DOM annotations)
 * to avoid duplication. An attempt to add a duplicate view results in the
 * collection returning the index of the previously collected serialized view.
 * This reduces the number of annotations needed for a given page.
 */
class SerializedViewCollection {
    views = [];
    indexByContent = new Map();
    add(serializedView) {
        const viewAsString = JSON.stringify(serializedView);
        if (!this.indexByContent.has(viewAsString)) {
            const index = this.views.length;
            this.views.push(serializedView);
            this.indexByContent.set(viewAsString, index);
            return index;
        }
        return this.indexByContent.get(viewAsString);
    }
    getAll() {
        return this.views;
    }
}
/**
 * Global counter that is used to generate a unique id for TViews
 * during the serialization process.
 */
let tViewSsrId = 0;
/**
 * Generates a unique id for a given TView and returns this id.
 * The id is also stored on this instance of a TView and reused in
 * subsequent calls.
 *
 * This id is needed to uniquely identify and pick up dehydrated views
 * at runtime.
 */
function getSsrId(tView) {
    if (!tView.ssrId) {
        tView.ssrId = `t${tViewSsrId++}`;
    }
    return tView.ssrId;
}
/**
 * Computes the number of root nodes in a given view
 * (or child nodes in a given container if a tNode is provided).
 */
function calcNumRootNodes(tView, lView, tNode) {
    const rootNodes = [];
    collectNativeNodes(tView, lView, tNode, rootNodes);
    return rootNodes.length;
}
/**
 * Computes the number of root nodes in all views in a given LContainer.
 */
function calcNumRootNodesInLContainer(lContainer) {
    const rootNodes = [];
    collectNativeNodesInLContainer(lContainer, rootNodes);
    return rootNodes.length;
}
/**
 * Annotates root level component's LView for hydration,
 * see `annotateHostElementForHydration` for additional information.
 */
function annotateComponentLViewForHydration(lView, context, injector) {
    const hostElement = lView[HOST];
    // Root elements might also be annotated with the `ngSkipHydration` attribute,
    // check if it's present before starting the serialization process.
    if (hostElement && !hostElement.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
        return annotateHostElementForHydration(hostElement, lView, null, context);
    }
    return null;
}
/**
 * Annotates root level LContainer for hydration. This happens when a root component
 * injects ViewContainerRef, thus making the component an anchor for a view container.
 * This function serializes the component itself as well as all views from the view
 * container.
 */
function annotateLContainerForHydration(lContainer, context, injector) {
    const componentLView = unwrapLView(lContainer[HOST]);
    // Serialize the root component itself.
    const componentLViewNghIndex = annotateComponentLViewForHydration(componentLView, context);
    if (componentLViewNghIndex === null) {
        // Component was not serialized (for example, if hydration was skipped by adding
        // the `ngSkipHydration` attribute or this component uses i18n blocks in the template,
        // but `withI18nSupport()` was not added), avoid annotating host element with the `ngh`
        // attribute.
        return;
    }
    const hostElement = unwrapRNode(componentLView[HOST]);
    // Serialize all views within this view container.
    const rootLView = lContainer[PARENT];
    const rootLViewNghIndex = annotateHostElementForHydration(hostElement, rootLView, null, context);
    const renderer = componentLView[RENDERER];
    // For cases when a root component also acts as an anchor node for a ViewContainerRef
    // (for example, when ViewContainerRef is injected in a root component), there is a need
    // to serialize information about the component itself, as well as an LContainer that
    // represents this ViewContainerRef. Effectively, we need to serialize 2 pieces of info:
    // (1) hydration info for the root component itself and (2) hydration info for the
    // ViewContainerRef instance (an LContainer). Each piece of information is included into
    // the hydration data (in the TransferState object) separately, thus we end up with 2 ids.
    // Since we only have 1 root element, we encode both bits of info into a single string:
    // ids are separated by the `|` char (e.g. `10|25`, where `10` is the ngh for a component view
    // and 25 is the `ngh` for a root view which holds LContainer).
    const finalIndex = `${componentLViewNghIndex}|${rootLViewNghIndex}`;
    renderer.setAttribute(hostElement, NGH_ATTR_NAME, finalIndex);
}
/**
 * Annotates all components bootstrapped in a given ApplicationRef
 * with info needed for hydration.
 *
 * @param appRef An instance of an ApplicationRef.
 * @param doc A reference to the current Document instance.
 * @return event types that need to be replayed
 */
function annotateForHydration(appRef, doc) {
    const injector = appRef.injector;
    const isI18nHydrationEnabledVal = isI18nHydrationEnabled(injector);
    const isIncrementalHydrationEnabledVal = isIncrementalHydrationEnabled(injector);
    const serializedViewCollection = new SerializedViewCollection();
    const corruptedTextNodes = new Map();
    const viewRefs = appRef._views;
    const shouldReplayEvents = injector.get(IS_EVENT_REPLAY_ENABLED, EVENT_REPLAY_ENABLED_DEFAULT);
    const eventTypesToReplay = {
        regular: new Set(),
        capture: new Set(),
    };
    const deferBlocks = new Map();
    appRef.injector.get(APP_ID);
    for (const viewRef of viewRefs) {
        const lNode = getLNodeForHydration(viewRef);
        // An `lView` might be `null` if a `ViewRef` represents
        // an embedded view (not a component view).
        if (lNode !== null) {
            const context = {
                serializedViewCollection,
                corruptedTextNodes,
                isI18nHydrationEnabled: isI18nHydrationEnabledVal,
                isIncrementalHydrationEnabled: isIncrementalHydrationEnabledVal,
                i18nChildren: new Map(),
                eventTypesToReplay,
                shouldReplayEvents,
                deferBlocks,
            };
            if (isLContainer(lNode)) {
                annotateLContainerForHydration(lNode, context);
            }
            else {
                annotateComponentLViewForHydration(lNode, context);
            }
            insertCorruptedTextNodeMarkers(corruptedTextNodes, doc);
        }
    }
    // Note: we *always* include hydration info key and a corresponding value
    // into the TransferState, even if the list of serialized views is empty.
    // This is needed as a signal to the client that the server part of the
    // hydration logic was setup and enabled correctly. Otherwise, if a client
    // hydration doesn't find a key in the transfer state - an error is produced.
    const serializedViews = serializedViewCollection.getAll();
    const transferState = injector.get(TransferState);
    transferState.set(NGH_DATA_KEY, serializedViews);
    if (deferBlocks.size > 0) {
        const blocks = {};
        for (const [id, info] of deferBlocks.entries()) {
            blocks[id] = info;
        }
        transferState.set(NGH_DEFER_BLOCKS_KEY, blocks);
    }
    return eventTypesToReplay;
}
/**
 * Serializes the lContainer data into a list of SerializedView objects,
 * that represent views within this lContainer.
 *
 * @param lContainer the lContainer we are serializing
 * @param tNode the TNode that contains info about this LContainer
 * @param lView that hosts this LContainer
 * @param parentDeferBlockId the defer block id of the parent if it exists
 * @param context the hydration context
 * @returns an array of the `SerializedView` objects
 */
function serializeLContainer(lContainer, tNode, lView, parentDeferBlockId, context) {
    const views = [];
    let lastViewAsString = '';
    for (let i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        let childLView = lContainer[i];
        let template;
        let numRootNodes;
        let serializedView;
        if (isRootView(childLView)) {
            // If this is a root view, get an LView for the underlying component,
            // because it contains information about the view to serialize.
            childLView = childLView[HEADER_OFFSET];
            // If we have an LContainer at this position, this indicates that the
            // host element was used as a ViewContainerRef anchor (e.g. a `ViewContainerRef`
            // was injected within the component class). This case requires special handling.
            if (isLContainer(childLView)) {
                // Calculate the number of root nodes in all views in a given container
                // and increment by one to account for an anchor node itself, i.e. in this
                // scenario we'll have a layout that would look like this:
                // `<app-root /><#VIEW1><#VIEW2>...<!--container-->`
                // The `+1` is to capture the `<app-root />` element.
                numRootNodes = calcNumRootNodesInLContainer(childLView) + 1;
                annotateLContainerForHydration(childLView, context);
                const componentLView = unwrapLView(childLView[HOST]);
                serializedView = {
                    [TEMPLATE_ID]: componentLView[TVIEW].ssrId,
                    [NUM_ROOT_NODES]: numRootNodes,
                };
            }
        }
        if (!serializedView) {
            const childTView = childLView[TVIEW];
            if (childTView.type === 1 /* TViewType.Component */) {
                template = childTView.ssrId;
                // This is a component view, thus it has only 1 root node: the component
                // host node itself (other nodes would be inside that host node).
                numRootNodes = 1;
            }
            else {
                template = getSsrId(childTView);
                numRootNodes = calcNumRootNodes(childTView, childLView, childTView.firstChild);
            }
            serializedView = {
                [TEMPLATE_ID]: template,
                [NUM_ROOT_NODES]: numRootNodes,
            };
            let isHydrateNeverBlock = false;
            // If this is a defer block, serialize extra info.
            if (isDeferBlock(lView[TVIEW], tNode)) {
                const lDetails = getLDeferBlockDetails(lView, tNode);
                const tDetails = getTDeferBlockDetails(lView[TVIEW], tNode);
                if (context.isIncrementalHydrationEnabled && tDetails.hydrateTriggers !== null) {
                    const deferBlockId = `d${context.deferBlocks.size}`;
                    if (tDetails.hydrateTriggers.has(7 /* DeferBlockTrigger.Never */)) {
                        isHydrateNeverBlock = true;
                    }
                    let rootNodes = [];
                    collectNativeNodesInLContainer(lContainer, rootNodes);
                    // Add defer block into info context.deferBlocks
                    const deferBlockInfo = {
                        [NUM_ROOT_NODES]: rootNodes.length,
                        [DEFER_BLOCK_STATE]: lDetails[DEFER_BLOCK_STATE$1],
                    };
                    const serializedTriggers = serializeHydrateTriggers(tDetails.hydrateTriggers);
                    if (serializedTriggers.length > 0) {
                        deferBlockInfo[DEFER_HYDRATE_TRIGGERS] = serializedTriggers;
                    }
                    if (parentDeferBlockId !== null) {
                        // Serialize parent id only when it's present.
                        deferBlockInfo[DEFER_PARENT_BLOCK_ID] = parentDeferBlockId;
                    }
                    context.deferBlocks.set(deferBlockId, deferBlockInfo);
                    const node = unwrapRNode(lContainer);
                    if (node !== undefined) {
                        if (node.nodeType === Node.COMMENT_NODE) {
                            annotateDeferBlockAnchorForHydration(node, deferBlockId);
                        }
                    }
                    else {
                        ngDevMode && validateNodeExists(node, childLView, tNode);
                        ngDevMode &&
                            validateMatchingNode(node, Node.COMMENT_NODE, null, childLView, tNode, true);
                        annotateDeferBlockAnchorForHydration(node, deferBlockId);
                    }
                    if (!isHydrateNeverBlock) {
                        // Add JSAction attributes for root nodes that use some hydration triggers
                        annotateDeferBlockRootNodesWithJsAction(tDetails, rootNodes, deferBlockId, context);
                    }
                    // Use current block id as parent for nested routes.
                    parentDeferBlockId = deferBlockId;
                    // Serialize extra info into the view object.
                    // TODO(incremental-hydration): this should be serialized and included at a different level
                    // (not at the view level).
                    serializedView[DEFER_BLOCK_ID] = deferBlockId;
                }
                // DEFER_BLOCK_STATE is used for reconciliation in hydration, both regular and incremental.
                // We need to know which template is rendered when hydrating. So we serialize this state
                // regardless of hydration type.
                serializedView[DEFER_BLOCK_STATE] = lDetails[DEFER_BLOCK_STATE$1];
            }
            if (!isHydrateNeverBlock) {
                Object.assign(serializedView, serializeLView(lContainer[i], parentDeferBlockId, context));
            }
        }
        // Check if the previous view has the same shape (for example, it was
        // produced by the *ngFor), in which case bump the counter on the previous
        // view instead of including the same information again.
        const currentViewAsString = JSON.stringify(serializedView);
        if (views.length > 0 && currentViewAsString === lastViewAsString) {
            const previousView = views[views.length - 1];
            previousView[MULTIPLIER] ??= 1;
            previousView[MULTIPLIER]++;
        }
        else {
            // Record this view as most recently added.
            lastViewAsString = currentViewAsString;
            views.push(serializedView);
        }
    }
    return views;
}
function serializeHydrateTriggers(triggerMap) {
    const serializableDeferBlockTrigger = new Set([
        0 /* DeferBlockTrigger.Idle */,
        1 /* DeferBlockTrigger.Immediate */,
        2 /* DeferBlockTrigger.Viewport */,
        5 /* DeferBlockTrigger.Timer */,
    ]);
    let triggers = [];
    for (let [trigger, details] of triggerMap) {
        if (serializableDeferBlockTrigger.has(trigger)) {
            if (details === null) {
                triggers.push(trigger);
            }
            else {
                triggers.push({ trigger, delay: details.delay });
            }
        }
    }
    return triggers;
}
/**
 * Helper function to produce a node path (which navigation steps runtime logic
 * needs to take to locate a node) and stores it in the `NODES` section of the
 * current serialized view.
 */
function appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes) {
    const noOffsetIndex = tNode.index - HEADER_OFFSET;
    ngh[NODES] ??= {};
    // Ensure we don't calculate the path multiple times.
    ngh[NODES][noOffsetIndex] ??= calcPathForNode(tNode, lView, excludedParentNodes);
}
/**
 * Helper function to append information about a disconnected node.
 * This info is needed at runtime to avoid DOM lookups for this element
 * and instead, the element would be created from scratch.
 */
function appendDisconnectedNodeIndex(ngh, tNodeOrNoOffsetIndex) {
    const noOffsetIndex = typeof tNodeOrNoOffsetIndex === 'number'
        ? tNodeOrNoOffsetIndex
        : tNodeOrNoOffsetIndex.index - HEADER_OFFSET;
    ngh[DISCONNECTED_NODES] ??= [];
    if (!ngh[DISCONNECTED_NODES].includes(noOffsetIndex)) {
        ngh[DISCONNECTED_NODES].push(noOffsetIndex);
    }
}
/**
 * Serializes the lView data into a SerializedView object that will later be added
 * to the TransferState storage and referenced using the `ngh` attribute on a host
 * element.
 *
 * @param lView the lView we are serializing
 * @param context the hydration context
 * @returns the `SerializedView` object containing the data to be added to the host node
 */
function serializeLView(lView, parentDeferBlockId = null, context) {
    const ngh = {};
    const tView = lView[TVIEW];
    const i18nChildren = getOrComputeI18nChildren(tView, context);
    const nativeElementsToEventTypes = context.shouldReplayEvents
        ? collectDomEventsInfo(tView, lView, context.eventTypesToReplay)
        : null;
    // Iterate over DOM element references in an LView.
    for (let i = HEADER_OFFSET; i < tView.bindingStartIndex; i++) {
        const tNode = tView.data[i];
        const noOffsetIndex = i - HEADER_OFFSET;
        // Attempt to serialize any i18n data for the given slot. We do this first, as i18n
        // has its own process for serialization.
        const i18nData = trySerializeI18nBlock(lView, i, context);
        if (i18nData) {
            ngh[I18N_DATA] ??= {};
            ngh[I18N_DATA][noOffsetIndex] = i18nData.caseQueue;
            for (const nodeNoOffsetIndex of i18nData.disconnectedNodes) {
                appendDisconnectedNodeIndex(ngh, nodeNoOffsetIndex);
            }
            for (const nodeNoOffsetIndex of i18nData.disjointNodes) {
                const tNode = tView.data[nodeNoOffsetIndex + HEADER_OFFSET];
                ngDevMode && assertTNode(tNode);
                appendSerializedNodePath(ngh, tNode, lView, i18nChildren);
            }
            continue;
        }
        // Skip processing of a given slot in the following cases:
        // - Local refs (e.g. <div #localRef>) take up an extra slot in LViews
        //   to store the same element. In this case, there is no information in
        //   a corresponding slot in TNode data structure.
        // - When a slot contains something other than a TNode. For example, there
        //   might be some metadata information about a defer block or a control flow block.
        if (!isTNodeShape(tNode)) {
            continue;
        }
        // Skip any nodes that are in an i18n block but are considered detached (i.e. not
        // present in the template). These nodes are disconnected from the DOM tree, and
        // so we don't want to serialize any information about them.
        if (isDetachedByI18n(tNode)) {
            continue;
        }
        // Check if a native node that represents a given TNode is disconnected from the DOM tree.
        // Such nodes must be excluded from the hydration (since the hydration won't be able to
        // find them), so the TNode ids are collected and used at runtime to skip the hydration.
        //
        // This situation may happen during the content projection, when some nodes don't make it
        // into one of the content projection slots (for example, when there is no default
        // <ng-content /> slot in projector component's template).
        if (isDisconnectedNode(tNode, lView) && isContentProjectedNode(tNode)) {
            appendDisconnectedNodeIndex(ngh, tNode);
            continue;
        }
        if (Array.isArray(tNode.projection)) {
            for (const projectionHeadTNode of tNode.projection) {
                // We may have `null`s in slots with no projected content.
                if (!projectionHeadTNode)
                    continue;
                if (!Array.isArray(projectionHeadTNode)) {
                    // If we process re-projected content (i.e. `<ng-content>`
                    // appears at projection location), skip annotations for this content
                    // since all DOM nodes in this projection were handled while processing
                    // a parent lView, which contains those nodes.
                    if (!isProjectionTNode(projectionHeadTNode) &&
                        !isInSkipHydrationBlock(projectionHeadTNode)) {
                        if (isDisconnectedNode(projectionHeadTNode, lView)) {
                            // Check whether this node is connected, since we may have a TNode
                            // in the data structure as a projection segment head, but the
                            // content projection slot might be disabled (e.g.
                            // <ng-content *ngIf="false" />).
                            appendDisconnectedNodeIndex(ngh, projectionHeadTNode);
                        }
                        else {
                            appendSerializedNodePath(ngh, projectionHeadTNode, lView, i18nChildren);
                        }
                    }
                }
                else {
                    // If a value is an array, it means that we are processing a projection
                    // where projectable nodes were passed in as DOM nodes (for example, when
                    // calling `ViewContainerRef.createComponent(CmpA, {projectableNodes: [...]})`).
                    //
                    // In this scenario, nodes can come from anywhere (either created manually,
                    // accessed via `document.querySelector`, etc) and may be in any state
                    // (attached or detached from the DOM tree). As a result, we can not reliably
                    // restore the state for such cases during hydration.
                    throw unsupportedProjectionOfDomNodes(unwrapRNode(lView[i]));
                }
            }
        }
        conditionallyAnnotateNodePath(ngh, tNode, lView, i18nChildren);
        if (isLContainer(lView[i])) {
            // Serialize information about a template.
            const embeddedTView = tNode.tView;
            if (embeddedTView !== null) {
                ngh[TEMPLATES] ??= {};
                ngh[TEMPLATES][noOffsetIndex] = getSsrId(embeddedTView);
            }
            // Serialize views within this LContainer.
            const hostNode = lView[i][HOST]; // host node of this container
            // LView[i][HOST] can be of 2 different types:
            // - either a DOM node
            // - or an array that represents an LView of a component
            if (Array.isArray(hostNode)) {
                // This is a component, serialize info about it.
                const targetNode = unwrapRNode(hostNode);
                if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                    annotateHostElementForHydration(targetNode, hostNode, parentDeferBlockId, context);
                }
            }
            ngh[CONTAINERS] ??= {};
            ngh[CONTAINERS][noOffsetIndex] = serializeLContainer(lView[i], tNode, lView, parentDeferBlockId, context);
        }
        else if (Array.isArray(lView[i]) && !isLetDeclaration(tNode)) {
            // This is a component, annotate the host node with an `ngh` attribute.
            // Note: Let declarations that return an array are also storing an array in the LView,
            // we need to exclude them.
            const targetNode = unwrapRNode(lView[i][HOST]);
            if (!targetNode.hasAttribute(SKIP_HYDRATION_ATTR_NAME)) {
                annotateHostElementForHydration(targetNode, lView[i], parentDeferBlockId, context);
            }
        }
        else {
            // <ng-container> case
            if (tNode.type & 8 /* TNodeType.ElementContainer */) {
                // An <ng-container> is represented by the number of
                // top-level nodes. This information is needed to skip over
                // those nodes to reach a corresponding anchor node (comment node).
                ngh[ELEMENT_CONTAINERS] ??= {};
                ngh[ELEMENT_CONTAINERS][noOffsetIndex] = calcNumRootNodes(tView, lView, tNode.child);
            }
            else if (tNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                // Current TNode represents an `<ng-content>` slot or `@let` declaration,
                // thus it has no DOM elements associated with it, so the **next sibling**
                // node would not be able to find an anchor. In this case, use full path instead.
                let nextTNode = tNode.next;
                // Skip over all `<ng-content>` slots and `@let` declarations in a row.
                while (nextTNode !== null &&
                    nextTNode.type & (16 /* TNodeType.Projection */ | 128 /* TNodeType.LetDeclaration */)) {
                    nextTNode = nextTNode.next;
                }
                if (nextTNode && !isInSkipHydrationBlock(nextTNode)) {
                    // Handle a tNode after the `<ng-content>` slot.
                    appendSerializedNodePath(ngh, nextTNode, lView, i18nChildren);
                }
            }
            else if (tNode.type & 1 /* TNodeType.Text */) {
                const rNode = unwrapRNode(lView[i]);
                processTextNodeBeforeSerialization(context, rNode);
            }
        }
        // Attach `jsaction` attribute to elements that have registered listeners,
        // thus potentially having a need to do an event replay.
        if (nativeElementsToEventTypes && tNode.type & 2 /* TNodeType.Element */) {
            const nativeElement = unwrapRNode(lView[i]);
            if (nativeElementsToEventTypes.has(nativeElement)) {
                setJSActionAttributes(nativeElement, nativeElementsToEventTypes.get(nativeElement), parentDeferBlockId);
            }
        }
    }
    return ngh;
}
/**
 * Serializes node location in cases when it's needed, specifically:
 *
 *  1. If `tNode.projectionNext` is different from `tNode.next` - it means that
 *     the next `tNode` after projection is different from the one in the original
 *     template. Since hydration relies on `tNode.next`, this serialized info
 *     is required to help runtime code find the node at the correct location.
 *  2. In certain content projection-based use-cases, it's possible that only
 *     a content of a projected element is rendered. In this case, content nodes
 *     require an extra annotation, since runtime logic can't rely on parent-child
 *     connection to identify the location of a node.
 */
function conditionallyAnnotateNodePath(ngh, tNode, lView, excludedParentNodes) {
    if (isProjectionTNode(tNode)) {
        // Do not annotate projection nodes (<ng-content />), since
        // they don't have a corresponding DOM node representing them.
        return;
    }
    // Handle case #1 described above.
    if (tNode.projectionNext &&
        tNode.projectionNext !== tNode.next &&
        !isInSkipHydrationBlock(tNode.projectionNext)) {
        appendSerializedNodePath(ngh, tNode.projectionNext, lView, excludedParentNodes);
    }
    // Handle case #2 described above.
    // Note: we only do that for the first node (i.e. when `tNode.prev === null`),
    // the rest of the nodes would rely on the current node location, so no extra
    // annotation is needed.
    if (tNode.prev === null &&
        tNode.parent !== null &&
        isDisconnectedNode(tNode.parent, lView) &&
        !isDisconnectedNode(tNode, lView)) {
        appendSerializedNodePath(ngh, tNode, lView, excludedParentNodes);
    }
}
/**
 * Determines whether a component instance that is represented
 * by a given LView uses `ViewEncapsulation.ShadowDom`.
 */
function componentUsesShadowDomEncapsulation(lView) {
    const instance = lView[CONTEXT];
    return instance?.constructor
        ? getComponentDef(instance.constructor)?.encapsulation === ViewEncapsulation$1.ShadowDom
        : false;
}
/**
 * Annotates component host element for hydration:
 * - by either adding the `ngh` attribute and collecting hydration-related info
 *   for the serialization and transferring to the client
 * - or by adding the `ngSkipHydration` attribute in case Angular detects that
 *   component contents is not compatible with hydration.
 *
 * @param element The Host element to be annotated
 * @param lView The associated LView
 * @param context The hydration context
 * @returns An index of serialized view from the transfer state object
 *          or `null` when a given component can not be serialized.
 */
function annotateHostElementForHydration(element, lView, parentDeferBlockId, context) {
    const renderer = lView[RENDERER];
    if ((hasI18n(lView) && !isI18nHydrationSupportEnabled()) ||
        componentUsesShadowDomEncapsulation(lView)) {
        // Attach the skip hydration attribute if this component:
        // - either has i18n blocks, since hydrating such blocks is not yet supported
        // - or uses ShadowDom view encapsulation, since Domino doesn't support
        //   shadow DOM, so we can not guarantee that client and server representations
        //   would exactly match
        renderer.setAttribute(element, SKIP_HYDRATION_ATTR_NAME, '');
        return null;
    }
    else {
        const ngh = serializeLView(lView, parentDeferBlockId, context);
        const index = context.serializedViewCollection.add(ngh);
        renderer.setAttribute(element, NGH_ATTR_NAME, index.toString());
        return index;
    }
}
/**
 * Annotates defer block comment node for hydration:
 *
 * @param comment The Host element to be annotated
 * @param deferBlockId the id of the target defer block
 */
function annotateDeferBlockAnchorForHydration(comment, deferBlockId) {
    comment.textContent = `ngh=${deferBlockId}`;
}
/**
 * Physically inserts the comment nodes to ensure empty text nodes and adjacent
 * text node separators are preserved after server serialization of the DOM.
 * These get swapped back for empty text nodes or separators once hydration happens
 * on the client.
 *
 * @param corruptedTextNodes The Map of text nodes to be replaced with comments
 * @param doc The document
 */
function insertCorruptedTextNodeMarkers(corruptedTextNodes, doc) {
    for (const [textNode, marker] of corruptedTextNodes) {
        textNode.after(doc.createComment(marker));
    }
}
/**
 * Detects whether a given TNode represents a node that
 * is being content projected.
 */
function isContentProjectedNode(tNode) {
    let currentTNode = tNode;
    while (currentTNode != null) {
        // If we come across a component host node in parent nodes -
        // this TNode is in the content projection section.
        if (isComponentHost(currentTNode)) {
            return true;
        }
        currentTNode = currentTNode.parent;
    }
    return false;
}
/**
 * Incremental hydration requires that any defer block root node
 * with interaction or hover triggers have all of their root nodes
 * trigger hydration with those events. So we need to make sure all
 * the root nodes of that block have the proper jsaction attribute
 * to ensure hydration is triggered, since the content is dehydrated
 */
function annotateDeferBlockRootNodesWithJsAction(tDetails, rootNodes, parentDeferBlockId, context) {
    const actionList = convertHydrateTriggersToJsAction(tDetails.hydrateTriggers);
    for (let et of actionList) {
        context.eventTypesToReplay.regular.add(et);
    }
    if (actionList.length > 0) {
        const elementNodes = rootNodes.filter((rn) => rn.nodeType === Node.ELEMENT_NODE);
        for (let rNode of elementNodes) {
            setJSActionAttributes(rNode, actionList, parentDeferBlockId);
        }
    }
}

/**
 * Indicates whether the hydration-related code was added,
 * prevents adding it multiple times.
 */
let isHydrationSupportEnabled = false;
/**
 * Indicates whether the i18n-related code was added,
 * prevents adding it multiple times.
 *
 * Note: This merely controls whether the code is loaded,
 * while `setIsI18nHydrationSupportEnabled` determines
 * whether i18n blocks are serialized or hydrated.
 */
let isI18nHydrationRuntimeSupportEnabled = false;
/**
 * Indicates whether the incremental hydration code was added,
 * prevents adding it multiple times.
 */
let isIncrementalHydrationRuntimeSupportEnabled = false;
/**
 * Defines a period of time that Angular waits for the `ApplicationRef.isStable` to emit `true`.
 * If there was no event with the `true` value during this time, Angular reports a warning.
 */
const APPLICATION_IS_STABLE_TIMEOUT = 10_000;
/**
 * Brings the necessary hydration code in tree-shakable manner.
 * The code is only present when the `provideClientHydration` is
 * invoked. Otherwise, this code is tree-shaken away during the
 * build optimization step.
 *
 * This technique allows us to swap implementations of methods so
 * tree shaking works appropriately when hydration is disabled or
 * enabled. It brings in the appropriate version of the method that
 * supports hydration only when enabled.
 */
function enableHydrationRuntimeSupport() {
    if (!isHydrationSupportEnabled) {
        isHydrationSupportEnabled = true;
        enableRetrieveHydrationInfoImpl();
        enableLocateOrCreateElementNodeImpl();
        enableLocateOrCreateTextNodeImpl();
        enableLocateOrCreateElementContainerNodeImpl();
        enableLocateOrCreateContainerAnchorImpl();
        enableLocateOrCreateContainerRefImpl();
        enableFindMatchingDehydratedViewImpl();
        enableApplyRootElementTransformImpl();
    }
}
/**
 * Brings the necessary i18n hydration code in tree-shakable manner.
 * Similar to `enableHydrationRuntimeSupport`, the code is only
 * present when `withI18nSupport` is invoked.
 */
function enableI18nHydrationRuntimeSupport() {
    if (!isI18nHydrationRuntimeSupportEnabled) {
        isI18nHydrationRuntimeSupportEnabled = true;
        enableLocateOrCreateI18nNodeImpl();
        enablePrepareI18nBlockForHydrationImpl();
        enableClaimDehydratedIcuCaseImpl();
    }
}
/**
 * Brings the necessary incremental hydration code in tree-shakable manner.
 * Similar to `enableHydrationRuntimeSupport`, the code is only
 * present when `enableIncrementalHydrationRuntimeSupport` is invoked.
 */
function enableIncrementalHydrationRuntimeSupport() {
    if (!isIncrementalHydrationRuntimeSupportEnabled) {
        isIncrementalHydrationRuntimeSupportEnabled = true;
        enableRetrieveDeferBlockDataImpl();
    }
}
/**
 * Outputs a message with hydration stats into a console.
 */
function printHydrationStats(injector) {
    const console = injector.get(Console);
    const message = `Angular hydrated ${ngDevMode.hydratedComponents} component(s) ` +
        `and ${ngDevMode.hydratedNodes} node(s), ` +
        `${ngDevMode.componentsSkippedHydration} component(s) were skipped. ` +
        (isIncrementalHydrationEnabled(injector)
            ? `${ngDevMode.deferBlocksWithIncrementalHydration} defer block(s) were configured to use incremental hydration. `
            : '') +
        `Learn more at https://angular.dev/guide/hydration.`;
    // tslint:disable-next-line:no-console
    console.log(message);
}
/**
 * Returns a Promise that is resolved when an application becomes stable.
 */
function whenStableWithTimeout(appRef) {
    const whenStablePromise = appRef.whenStable();
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
        const timeoutTime = APPLICATION_IS_STABLE_TIMEOUT;
        const console = appRef.injector.get(Console);
        const ngZone = appRef.injector.get(NgZone);
        // The following call should not and does not prevent the app to become stable
        // We cannot use RxJS timer here because the app would remain unstable.
        // This also avoids an extra change detection cycle.
        const timeoutId = ngZone.runOutsideAngular(() => {
            return setTimeout(() => logWarningOnStableTimedout(timeoutTime, console), timeoutTime);
        });
        whenStablePromise.finally(() => clearTimeout(timeoutId));
    }
    return whenStablePromise;
}
/**
 * Defines a name of an attribute that is added to the <body> tag
 * in the `index.html` file in case a given route was configured
 * with `RenderMode.Client`. 'cm' is an abbreviation for "Client Mode".
 */
const CLIENT_RENDER_MODE_FLAG = 'ngcm';
/**
 * Checks whether the `RenderMode.Client` was defined for the current route.
 */
function isClientRenderModeEnabled() {
    const doc = getDocument();
    return ((typeof ngServerMode === 'undefined' || !ngServerMode) &&
        doc.body.hasAttribute(CLIENT_RENDER_MODE_FLAG));
}
/**
 * Returns a set of providers required to setup hydration support
 * for an application that is server side rendered. This function is
 * included into the `provideClientHydration` public API function from
 * the `platform-browser` package.
 *
 * The function sets up an internal flag that would be recognized during
 * the server side rendering time as well, so there is no need to
 * configure or change anything in NgUniversal to enable the feature.
 */
function withDomHydration() {
    const providers = [
        {
            provide: IS_HYDRATION_DOM_REUSE_ENABLED,
            useFactory: () => {
                let isEnabled = true;
                if (typeof ngServerMode === 'undefined' || !ngServerMode) {
                    // On the client, verify that the server response contains
                    // hydration annotations. Otherwise, keep hydration disabled.
                    const transferState = inject(TransferState, { optional: true });
                    isEnabled = !!transferState?.get(NGH_DATA_KEY, null);
                }
                if (isEnabled) {
                    performanceMarkFeature('NgHydration');
                }
                return isEnabled;
            },
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                // i18n support is enabled by calling withI18nSupport(), but there's
                // no way to turn it off (e.g. for tests), so we turn it off by default.
                setIsI18nHydrationSupportEnabled(false);
                if (typeof ngServerMode !== 'undefined' && ngServerMode) {
                    // Since this function is used across both server and client,
                    // make sure that the runtime code is only added when invoked
                    // on the client (see the `enableHydrationRuntimeSupport` function
                    // call below).
                    return;
                }
                if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    verifySsrContentsIntegrity(getDocument());
                    enableHydrationRuntimeSupport();
                }
                else if (typeof ngDevMode !== 'undefined' && ngDevMode && !isClientRenderModeEnabled()) {
                    const console = inject(Console);
                    const message = formatRuntimeError(-505 /* RuntimeErrorCode.MISSING_HYDRATION_ANNOTATIONS */, 'Angular hydration was requested on the client, but there was no ' +
                        'serialized information present in the server response, ' +
                        'thus hydration was not enabled. ' +
                        'Make sure the `provideClientHydration()` is included into the list ' +
                        'of providers in the server part of the application configuration.');
                    console.warn(message);
                }
            },
            multi: true,
        },
    ];
    if (typeof ngServerMode === 'undefined' || !ngServerMode) {
        providers.push({
            provide: PRESERVE_HOST_CONTENT,
            useFactory: () => {
                // Preserve host element content only in a browser
                // environment and when hydration is configured properly.
                // On a server, an application is rendered from scratch,
                // so the host content needs to be empty.
                return inject(IS_HYDRATION_DOM_REUSE_ENABLED);
            },
        }, {
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    const appRef = inject(ApplicationRef);
                    return () => {
                        // Wait until an app becomes stable and cleanup all views that
                        // were not claimed during the application bootstrap process.
                        // The timing is similar to when we start the serialization process
                        // on the server.
                        //
                        // Note: the cleanup task *MUST* be scheduled within the Angular zone in Zone apps
                        // to ensure that change detection is properly run afterward.
                        whenStableWithTimeout(appRef).then(() => {
                            // Note: we have to check whether the application is destroyed before
                            // performing other operations with the `injector`.
                            // The application may be destroyed **before** it becomes stable, so when
                            // the `whenStableWithTimeout` resolves, the injector might already be in
                            // a destroyed state. Thus, calling `injector.get` would throw an error
                            // indicating that the injector has already been destroyed.
                            if (appRef.destroyed) {
                                return;
                            }
                            cleanupDehydratedViews(appRef);
                            if (typeof ngDevMode !== 'undefined' && ngDevMode) {
                                countBlocksSkippedByHydration(appRef.injector);
                                printHydrationStats(appRef.injector);
                            }
                        });
                    };
                }
                return () => { }; // noop
            },
            multi: true,
        });
    }
    return makeEnvironmentProviders(providers);
}
/**
 * Returns a set of providers required to setup support for i18n hydration.
 * Requires hydration to be enabled separately.
 */
function withI18nSupport() {
    return [
        {
            provide: IS_I18N_HYDRATION_ENABLED,
            useFactory: () => inject(IS_HYDRATION_DOM_REUSE_ENABLED),
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                if (inject(IS_HYDRATION_DOM_REUSE_ENABLED)) {
                    enableI18nHydrationRuntimeSupport();
                    setIsI18nHydrationSupportEnabled(true);
                    performanceMarkFeature('NgI18nHydration');
                }
            },
            multi: true,
        },
    ];
}
/**
 * Returns a set of providers required to setup support for incremental hydration.
 * Requires hydration to be enabled separately.
 * Enabling incremental hydration also enables event replay for the entire app.
 */
function withIncrementalHydration() {
    const providers = [
        withEventReplay(),
        {
            provide: IS_INCREMENTAL_HYDRATION_ENABLED,
            useValue: true,
        },
        {
            provide: DEHYDRATED_BLOCK_REGISTRY,
            useClass: DehydratedBlockRegistry,
        },
        {
            provide: ENVIRONMENT_INITIALIZER,
            useValue: () => {
                enableIncrementalHydrationRuntimeSupport();
                performanceMarkFeature('NgIncrementalHydration');
            },
            multi: true,
        },
    ];
    if (typeof ngServerMode === 'undefined' || !ngServerMode) {
        providers.push({
            provide: APP_BOOTSTRAP_LISTENER,
            useFactory: () => {
                const injector = inject(Injector);
                const doc = getDocument();
                return () => {
                    const deferBlockData = processBlockData(injector);
                    const commentsByBlockId = gatherDeferBlocksCommentNodes(doc, doc.body);
                    processAndInitTriggers(injector, deferBlockData, commentsByBlockId);
                    appendDeferBlocksToJSActionMap(doc, injector);
                };
            },
            multi: true,
        });
    }
    return providers;
}
/**
 *
 * @param time The time in ms until the stable timedout warning message is logged
 */
function logWarningOnStableTimedout(time, console) {
    const message = `Angular hydration expected the ApplicationRef.isStable() to emit \`true\`, but it ` +
        `didn't happen within ${time}ms. Angular hydration logic depends on the application becoming stable ` +
        `as a signal to complete hydration process.`;
    console.warn(formatRuntimeError(-506 /* RuntimeErrorCode.HYDRATION_STABLE_TIMEDOUT */, message));
}

/**
 * Transforms a value (typically a string) to a boolean.
 * Intended to be used as a transform function of an input.
 *
 *  @usageNotes
 *  ```ts
 *  @Input({ transform: booleanAttribute }) status!: boolean;
 *  ```
 * @param value Value to be transformed.
 *
 * @publicApi
 */
function booleanAttribute(value) {
    return typeof value === 'boolean' ? value : value != null && value !== 'false';
}
/**
 * Transforms a value (typically a string) to a number.
 * Intended to be used as a transform function of an input.
 * @param value Value to be transformed.
 * @param fallbackValue Value to use if the provided value can't be parsed as a number.
 *
 *  @usageNotes
 *  ```ts
 *  @Input({ transform: numberAttribute }) id!: number;
 *  ```
 *
 * @publicApi
 */
function numberAttribute(value, fallbackValue = NaN) {
    // parseFloat(value) handles most of the cases we're interested in (it treats null, empty string,
    // and other non-number values as NaN, where Number just uses 0) but it considers the string
    // '123hello' to be a valid number. Therefore we also check if Number(value) is NaN.
    const isNumberValue = !isNaN(parseFloat(value)) && !isNaN(Number(value));
    return isNumberValue ? Number(value) : fallbackValue;
}

const PERFORMANCE_MARK_PREFIX = '🅰️';
let enablePerfLogging = false;
/**
 * Function that will start measuring against the performance API
 * Should be used in pair with stopMeasuring
 */
function startMeasuring(label) {
    if (!enablePerfLogging) {
        return;
    }
    const { startLabel } = labels(label);
    /* tslint:disable:ban */
    performance.mark(startLabel);
    /* tslint:enable:ban */
}
/**
 * Function that will stop measuring against the performance API
 * Should be used in pair with stopMeasuring
 */
function stopMeasuring(label) {
    if (!enablePerfLogging) {
        return;
    }
    const { startLabel, labelName, endLabel } = labels(label);
    /* tslint:disable:ban */
    performance.mark(endLabel);
    performance.measure(labelName, startLabel, endLabel);
    performance.clearMarks(startLabel);
    performance.clearMarks(endLabel);
    /* tslint:enable:ban */
}
function labels(label) {
    const labelName = `${PERFORMANCE_MARK_PREFIX}:${label}`;
    return {
        labelName,
        startLabel: `start:${labelName}`,
        endLabel: `end:${labelName}`,
    };
}
let warningLogged = false;
/**
 * This enables an internal performance profiler
 *
 * It should not be imported in application code
 */
function enableProfiling() {
    if (!warningLogged &&
        (typeof performance === 'undefined' || !performance.mark || !performance.measure)) {
        warningLogged = true;
        console.warn('Performance API is not supported on this platform');
        return;
    }
    enablePerfLogging = true;
}
function disableProfiling() {
    enablePerfLogging = false;
}

/*!
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
/**
 * Gets the class name of the closest component to a node.
 * Warning! this function will return minified names if the name of the component is minified. The
 * consumer of the function is responsible for resolving the minified name to its original name.
 * @param node Node from which to start the search.
 */
function getClosestComponentName(node) {
    let currentNode = node;
    while (currentNode) {
        const lView = readPatchedLView(currentNode);
        if (lView !== null) {
            for (let i = HEADER_OFFSET; i < lView.length; i++) {
                const current = lView[i];
                if ((!isLView(current) && !isLContainer(current)) || current[HOST] !== currentNode) {
                    continue;
                }
                const tView = lView[TVIEW];
                const tNode = getTNode(tView, i);
                if (isComponentHost(tNode)) {
                    const def = tView.data[tNode.directiveStart + tNode.componentOffset];
                    const name = def.debugInfo?.className || def.type.name;
                    // Note: the name may be an empty string if the class name is
                    // dropped due to minification. In such cases keep going up the tree.
                    if (name) {
                        return name;
                    }
                    else {
                        break;
                    }
                }
            }
        }
        currentNode = currentNode.parentNode;
    }
    return null;
}

/**
 * Compiles a partial directive declaration object into a full directive definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareDirective(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'directive',
        type: decl.type,
    });
    return compiler.compileDirectiveDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵfac.js`, decl);
}
/**
 * Evaluates the class metadata declaration.
 *
 * @codeGenApi
 */
function ɵɵngDeclareClassMetadata(decl) {
    setClassMetadata(decl.type, decl.decorators, decl.ctorParameters ?? null, decl.propDecorators ?? null);
}
/**
 * Evaluates the class metadata of a component that contains deferred blocks.
 *
 * @codeGenApi
 */
function ɵɵngDeclareClassMetadataAsync(decl) {
    setClassMetadataAsync(decl.type, decl.resolveDeferredDeps, (...types) => {
        const meta = decl.resolveMetadata(...types);
        setClassMetadata(decl.type, meta.decorators, meta.ctorParameters, meta.propDecorators);
    });
}
/**
 * Compiles a partial component declaration object into a full component definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareComponent(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'component',
        type: decl.type,
    });
    return compiler.compileComponentDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵcmp.js`, decl);
}
/**
 * Compiles a partial pipe declaration object into a full pipe definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareFactory(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: getFactoryKind(decl.target),
        type: decl.type,
    });
    return compiler.compileFactoryDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵfac.js`, decl);
}
function getFactoryKind(target) {
    switch (target) {
        case FactoryTarget.Directive:
            return 'directive';
        case FactoryTarget.Component:
            return 'component';
        case FactoryTarget.Injectable:
            return 'injectable';
        case FactoryTarget.Pipe:
            return 'pipe';
        case FactoryTarget.NgModule:
            return 'NgModule';
    }
}
/**
 * Compiles a partial injectable declaration object into a full injectable definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareInjectable(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'injectable',
        type: decl.type,
    });
    return compiler.compileInjectableDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵprov.js`, decl);
}
/**
 * Compiles a partial injector declaration object into a full injector definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareInjector(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'NgModule',
        type: decl.type,
    });
    return compiler.compileInjectorDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵinj.js`, decl);
}
/**
 * Compiles a partial NgModule declaration object into a full NgModule definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclareNgModule(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'NgModule',
        type: decl.type,
    });
    return compiler.compileNgModuleDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵmod.js`, decl);
}
/**
 * Compiles a partial pipe declaration object into a full pipe definition object.
 *
 * @codeGenApi
 */
function ɵɵngDeclarePipe(decl) {
    const compiler = getCompilerFacade({
        usage: 1 /* JitCompilerUsage.PartialDeclaration */,
        kind: 'pipe',
        type: decl.type,
    });
    return compiler.compilePipeDeclaration(angularCoreEnv, `ng:///${decl.type.name}/ɵpipe.js`, decl);
}

const NOT_SET = /* @__PURE__ */ Symbol('NOT_SET');
const EMPTY_CLEANUP_SET = /* @__PURE__ */ new Set();
const AFTER_RENDER_PHASE_EFFECT_NODE = /* @__PURE__ */ (() => ({
    ...SIGNAL_NODE,
    consumerIsAlwaysLive: true,
    consumerAllowSignalWrites: true,
    value: NOT_SET,
    cleanup: null,
    /** Called when the effect becomes dirty */
    consumerMarkedDirty() {
        if (this.sequence.impl.executing) {
            // If hooks are in the middle of executing, then it matters whether this node has yet been
            // executed within its sequence. If not, then we don't want to notify the scheduler since
            // this node will be reached naturally.
            if (this.sequence.lastPhase === null || this.sequence.lastPhase < this.phase) {
                return;
            }
            // If during the execution of a later phase an earlier phase became dirty, then we should not
            // run any further phases until the earlier one reruns.
            this.sequence.erroredOrDestroyed = true;
        }
        // Either hooks are not running, or we're marking a node dirty that has already run within its
        // sequence.
        this.sequence.scheduler.notify(7 /* NotificationSource.RenderHook */);
    },
    phaseFn(previousValue) {
        this.sequence.lastPhase = this.phase;
        if (!this.dirty) {
            return this.signal;
        }
        this.dirty = false;
        if (this.value !== NOT_SET && !consumerPollProducersForChange(this)) {
            // None of our producers report a change since the last time they were read, so no
            // recomputation of our value is necessary.
            return this.signal;
        }
        // Run any needed cleanup functions.
        try {
            for (const cleanupFn of this.cleanup ?? EMPTY_CLEANUP_SET) {
                cleanupFn();
            }
        }
        finally {
            // Even if a cleanup function errors, ensure it's cleared.
            this.cleanup?.clear();
        }
        // Prepare to call the user's effect callback. If there was a previous phase, then it gave us
        // its value as a `Signal`, otherwise `previousValue` will be `undefined`.
        const args = [];
        if (previousValue !== undefined) {
            args.push(previousValue);
        }
        args.push(this.registerCleanupFn);
        // Call the user's callback in our reactive context.
        const prevConsumer = consumerBeforeComputation(this);
        let newValue;
        try {
            newValue = this.userFn.apply(null, args);
        }
        finally {
            consumerAfterComputation(this, prevConsumer);
        }
        if (this.value === NOT_SET || !this.equal(this.value, newValue)) {
            this.value = newValue;
            this.version++;
        }
        return this.signal;
    },
}))();
/**
 * An `AfterRenderSequence` that manages an `afterRenderEffect`'s phase effects.
 */
class AfterRenderEffectSequence extends AfterRenderSequence {
    scheduler;
    /**
     * While this sequence is executing, this tracks the last phase which was called by the
     * `afterRender` machinery.
     *
     * When a phase effect is marked dirty, this is used to determine whether it's already run or not.
     */
    lastPhase = null;
    /**
     * The reactive nodes for each phase, if a phase effect is defined for that phase.
     *
     * These are initialized to `undefined` but set in the constructor.
     */
    nodes = [undefined, undefined, undefined, undefined];
    constructor(impl, effectHooks, view, scheduler, destroyRef, snapshot = null) {
        // Note that we also initialize the underlying `AfterRenderSequence` hooks to `undefined` and
        // populate them as we create reactive nodes below.
        super(impl, [undefined, undefined, undefined, undefined], view, false, destroyRef, snapshot);
        this.scheduler = scheduler;
        // Setup a reactive node for each phase.
        for (const phase of AFTER_RENDER_PHASES) {
            const effectHook = effectHooks[phase];
            if (effectHook === undefined) {
                continue;
            }
            const node = Object.create(AFTER_RENDER_PHASE_EFFECT_NODE);
            node.sequence = this;
            node.phase = phase;
            node.userFn = effectHook;
            node.dirty = true;
            node.signal = (() => {
                producerAccessed(node);
                return node.value;
            });
            node.signal[SIGNAL] = node;
            node.registerCleanupFn = (fn) => (node.cleanup ??= new Set()).add(fn);
            this.nodes[phase] = node;
            // Install the upstream hook which runs the `phaseFn` for this phase.
            this.hooks[phase] = (value) => node.phaseFn(value);
        }
    }
    afterRun() {
        super.afterRun();
        // We're done running this sequence, so reset `lastPhase`.
        this.lastPhase = null;
    }
    destroy() {
        super.destroy();
        // Run the cleanup functions for each node.
        for (const node of this.nodes) {
            for (const fn of node?.cleanup ?? EMPTY_CLEANUP_SET) {
                fn();
            }
        }
    }
}
/**
 * @publicApi
 */
function afterRenderEffect(callbackOrSpec, options) {
    ngDevMode &&
        assertNotInReactiveContext(afterRenderEffect, 'Call `afterRenderEffect` outside of a reactive context. For example, create the render ' +
            'effect inside the component constructor`.');
    !options?.injector && assertInInjectionContext(afterRenderEffect);
    if (typeof ngServerMode !== 'undefined' && ngServerMode) {
        return NOOP_AFTER_RENDER_REF;
    }
    const injector = options?.injector ?? inject(Injector);
    const scheduler = injector.get(ChangeDetectionScheduler);
    const manager = injector.get(AfterRenderManager);
    const tracing = injector.get(TracingService, null, { optional: true });
    manager.impl ??= injector.get(AfterRenderImpl);
    let spec = callbackOrSpec;
    if (typeof spec === 'function') {
        spec = { mixedReadWrite: callbackOrSpec };
    }
    const viewContext = injector.get(ViewContext, null, { optional: true });
    const sequence = new AfterRenderEffectSequence(manager.impl, [spec.earlyRead, spec.write, spec.mixedReadWrite, spec.read], viewContext?.view, scheduler, injector.get(DestroyRef), tracing?.snapshot(null));
    manager.impl.register(sequence);
    return sequence;
}

/**
 * Creates a `ComponentRef` instance based on provided component type and a set of options.
 *
 * @usageNotes
 *
 * The example below demonstrates how the `createComponent` function can be used
 * to create an instance of a ComponentRef dynamically and attach it to an ApplicationRef,
 * so that it gets included into change detection cycles.
 *
 * Note: the example uses standalone components, but the function can also be used for
 * non-standalone components (declared in an NgModule) as well.
 *
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   template: `Hello {{ name }}!`
 * })
 * class HelloComponent {
 *   name = 'Angular';
 * }
 *
 * @Component({
 *   standalone: true,
 *   template: `<div id="hello-component-host"></div>`
 * })
 * class RootComponent {}
 *
 * // Bootstrap an application.
 * const applicationRef = await bootstrapApplication(RootComponent);
 *
 * // Locate a DOM node that would be used as a host.
 * const hostElement = document.getElementById('hello-component-host');
 *
 * // Get an `EnvironmentInjector` instance from the `ApplicationRef`.
 * const environmentInjector = applicationRef.injector;
 *
 * // We can now create a `ComponentRef` instance.
 * const componentRef = createComponent(HelloComponent, {hostElement, environmentInjector});
 *
 * // Last step is to register the newly created ref using the `ApplicationRef` instance
 * // to include the component view into change detection cycles.
 * applicationRef.attachView(componentRef.hostView);
 * componentRef.changeDetectorRef.detectChanges();
 * ```
 *
 * @param component Component class reference.
 * @param options Set of options to use:
 *  * `environmentInjector`: An `EnvironmentInjector` instance to be used for the component.
 *  * `hostElement` (optional): A DOM node that should act as a host node for the component. If not
 * provided, Angular creates one based on the tag name used in the component selector (and falls
 * back to using `div` if selector doesn't have tag name info).
 *  * `elementInjector` (optional): An `ElementInjector` instance, see additional info about it
 * [here](guide/di/hierarchical-dependency-injection#elementinjector).
 *  * `projectableNodes` (optional): A list of DOM nodes that should be projected through
 * [`<ng-content>`](api/core/ng-content) of the new component instance, e.g.,
 * `[[element1, element2]]`: projects `element1` and `element2` into the same `<ng-content>`.
 * `[[element1, element2], [element3]]`: projects `element1` and `element2` into one `<ng-content>`,
 * and `element3` into a separate `<ng-content>`.
 *  * `directives` (optional): Directives that should be applied to the component.
 *  * `binding` (optional): Bindings to apply to the root component.
 * @returns ComponentRef instance that represents a given Component.
 *
 * @publicApi
 */
function createComponent(component, options) {
    ngDevMode && assertComponentDef(component);
    const componentDef = getComponentDef(component);
    const elementInjector = options.elementInjector || getNullInjector();
    const factory = new ComponentFactory(componentDef);
    return factory.create(elementInjector, options.projectableNodes, options.hostElement, options.environmentInjector, options.directives, options.bindings);
}
/**
 * Creates an object that allows to retrieve component metadata.
 *
 * @usageNotes
 *
 * The example below demonstrates how to use the function and how the fields
 * of the returned object map to the component metadata.
 *
 * ```angular-ts
 * @Component({
 *   standalone: true,
 *   selector: 'foo-component',
 *   template: `
 *     <ng-content></ng-content>
 *     <ng-content select="content-selector-a"></ng-content>
 *   `,
 * })
 * class FooComponent {
 *   @Input('inputName') inputPropName: string;
 *   @Output('outputName') outputPropName = new EventEmitter<void>();
 * }
 *
 * const mirror = reflectComponentType(FooComponent);
 * expect(mirror.type).toBe(FooComponent);
 * expect(mirror.selector).toBe('foo-component');
 * expect(mirror.isStandalone).toBe(true);
 * expect(mirror.inputs).toEqual([{propName: 'inputName', templateName: 'inputPropName'}]);
 * expect(mirror.outputs).toEqual([{propName: 'outputName', templateName: 'outputPropName'}]);
 * expect(mirror.ngContentSelectors).toEqual([
 *   '*',                 // first `<ng-content>` in a template, the selector defaults to `*`
 *   'content-selector-a' // second `<ng-content>` in a template
 * ]);
 * ```
 *
 * @param component Component class reference.
 * @returns An object that allows to retrieve component metadata.
 *
 * @publicApi
 */
function reflectComponentType(component) {
    const componentDef = getComponentDef(component);
    if (!componentDef)
        return null;
    const factory = new ComponentFactory(componentDef);
    return {
        get selector() {
            return factory.selector;
        },
        get type() {
            return factory.componentType;
        },
        get inputs() {
            return factory.inputs;
        },
        get outputs() {
            return factory.outputs;
        },
        get ngContentSelectors() {
            return factory.ngContentSelectors;
        },
        get isStandalone() {
            return componentDef.standalone;
        },
        get isSignal() {
            return componentDef.signals;
        },
    };
}

/**
 * Merge multiple application configurations from left to right.
 *
 * @param configs Two or more configurations to be merged.
 * @returns A merged [ApplicationConfig](api/core/ApplicationConfig).
 *
 * @publicApi
 */
function mergeApplicationConfig(...configs) {
    return configs.reduce((prev, curr) => {
        return Object.assign(prev, curr, { providers: [...prev.providers, ...curr.providers] });
    }, { providers: [] });
}

/**
 * Injection token representing the current HTTP request object.
 *
 * Use this token to access the current request when handling server-side
 * rendering (SSR).
 *
 * @remarks
 * This token may be `null` in the following scenarios:
 *
 * * During the build processes.
 * * When the application is rendered in the browser (client-side rendering).
 * * When performing static site generation (SSG).
 * * During route extraction in development (at the time of the request).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request `Request` on MDN}
 *
 * @publicApi
 */
const REQUEST = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'REQUEST' : '', {
    providedIn: 'platform',
    factory: () => null,
});
/**
 * Injection token for response initialization options.
 *
 * Use this token to provide response options for configuring or initializing
 * HTTP responses in server-side rendering or API endpoints.
 *
 * @remarks
 * This token may be `null` in the following scenarios:
 *
 * * During the build processes.
 * * When the application is rendered in the browser (client-side rendering).
 * * When performing static site generation (SSG).
 * * During route extraction in development (at the time of the request).
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response/Response `ResponseInit` on MDN}
 *
 * @publicApi
 */
const RESPONSE_INIT = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'RESPONSE_INIT' : '', {
    providedIn: 'platform',
    factory: () => null,
});
/**
 * Injection token for additional request context.
 *
 * Use this token to pass custom metadata or context related to the current request in server-side rendering.
 *
 * @remarks
 * This token is only available during server-side rendering and will be `null` in other contexts.
 *
 * @publicApi
 */
const REQUEST_CONTEXT = new InjectionToken(typeof ngDevMode === 'undefined' || ngDevMode ? 'REQUEST_CONTEXT' : '', {
    providedIn: 'platform',
    factory: () => null,
});

export { APP_BOOTSTRAP_LISTENER, APP_ID, ApplicationInitStatus, ApplicationModule, ApplicationRef, COMPILER_OPTIONS, ChangeDetectorRef, ContentChild, ContentChildren, DefaultIterableDiffer, DestroyRef, ENVIRONMENT_INITIALIZER, EmbeddedViewRef, ErrorHandler, HOST_TAG_NAME, HostAttributeToken, Injectable, InjectionToken, Injector, IterableDiffers, KeyValueDiffers, LOCALE_ID, NgModule, NgZone, Optional, OutputEmitterRef, PLATFORM_INITIALIZER, PlatformRef, Query, REQUEST, REQUEST_CONTEXT, RESPONSE_INIT, SkipSelf, TransferState, VERSION, Version, ViewChild, ViewChildren, ViewEncapsulation$1 as ViewEncapsulation, ViewRef, afterRenderEffect, assertInInjectionContext, assertNotInReactiveContext, assertPlatform, booleanAttribute, contentChild, contentChildren, createComponent, createPlatform, createPlatformFactory, destroyPlatform, enableProdMode, getModuleFactory, getNgModuleById, getPlatform, inject, input, isDevMode, makeEnvironmentProviders, mergeApplicationConfig, model, numberAttribute, output, platformCore, provideCheckNoChangesConfig, provideEnvironmentInitializer, providePlatformInitializer, reflectComponentType, runInInjectionContext, viewChild, viewChildren, ALLOW_MULTIPLE_PLATFORMS as ɵALLOW_MULTIPLE_PLATFORMS, AfterRenderManager as ɵAfterRenderManager, CONTAINER_HEADER_OFFSET as ɵCONTAINER_HEADER_OFFSET, ChangeDetectionScheduler as ɵChangeDetectionScheduler, ChangeDetectionSchedulerImpl as ɵChangeDetectionSchedulerImpl, Console as ɵConsole, DEFAULT_LOCALE_ID as ɵDEFAULT_LOCALE_ID, ENABLE_ROOT_COMPONENT_BOOTSTRAP as ɵENABLE_ROOT_COMPONENT_BOOTSTRAP, IMAGE_CONFIG as ɵIMAGE_CONFIG, INJECTOR_SCOPE as ɵINJECTOR_SCOPE, ɵINPUT_SIGNAL_BRAND_WRITE_TYPE, INTERNAL_APPLICATION_ERROR_HANDLER as ɵINTERNAL_APPLICATION_ERROR_HANDLER, IS_HYDRATION_DOM_REUSE_ENABLED as ɵIS_HYDRATION_DOM_REUSE_ENABLED, IS_INCREMENTAL_HYDRATION_ENABLED as ɵIS_INCREMENTAL_HYDRATION_ENABLED, JSACTION_EVENT_CONTRACT as ɵJSACTION_EVENT_CONTRACT, NgModuleFactory as ɵNgModuleFactory, PERFORMANCE_MARK_PREFIX as ɵPERFORMANCE_MARK_PREFIX, PROVIDED_NG_ZONE as ɵPROVIDED_NG_ZONE, ComponentFactory as ɵRender3ComponentFactory, RuntimeError as ɵRuntimeError, SIGNAL as ɵSIGNAL, TracingService as ɵTracingService, ViewRef$1 as ɵViewRef, annotateForHydration as ɵannotateForHydration, compileNgModuleFactory as ɵcompileNgModuleFactory, defaultIterableDiffers as ɵdefaultIterableDiffers, defaultKeyValueDiffers as ɵdefaultKeyValueDiffers, disableProfiling as ɵdisableProfiling, enableProfiling as ɵenableProfiling, formatRuntimeError as ɵformatRuntimeError, getClosestComponentName as ɵgetClosestComponentName, _global as ɵglobal, injectChangeDetectorRef as ɵinjectChangeDetectorRef, internalCreateApplication as ɵinternalCreateApplication, internalProvideZoneChangeDetection as ɵinternalProvideZoneChangeDetection, isPromise as ɵisPromise, performanceMarkFeature as ɵperformanceMarkFeature, resolveComponentResources as ɵresolveComponentResources, setClassMetadata as ɵsetClassMetadata, setClassMetadataAsync as ɵsetClassMetadataAsync, setLocaleId as ɵsetLocaleId, startMeasuring as ɵstartMeasuring, stopMeasuring as ɵstopMeasuring, stringify as ɵstringify, withDomHydration as ɵwithDomHydration, withEventReplay as ɵwithEventReplay, withI18nSupport as ɵwithI18nSupport, withIncrementalHydration as ɵwithIncrementalHydration, FactoryTarget as ɵɵFactoryTarget, __defineInjectable as ɵɵdefineInjectable, __defineInjector as ɵɵdefineInjector, __defineNgModule as ɵɵdefineNgModule, __inject as ɵɵinject, __injectAttribute as ɵɵinjectAttribute, ɵɵngDeclareClassMetadata, ɵɵngDeclareClassMetadataAsync, ɵɵngDeclareComponent, ɵɵngDeclareDirective, ɵɵngDeclareFactory, ɵɵngDeclareInjectable, ɵɵngDeclareInjector, ɵɵngDeclareNgModule, ɵɵngDeclarePipe };
//# sourceMappingURL=core.mjs.map
