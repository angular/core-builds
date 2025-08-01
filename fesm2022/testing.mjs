/**
 * @license Angular v20.2.0-next.3+sha-3e6e1c1
 * (c) 2010-2025 Google LLC. https://angular.io/
 * License: MIT
 */

import * as i0 from '@angular/core';
import { NgZone, Injectable, DeferBlockState, triggerResourceLoading, renderDeferBlockState, getDeferBlocks, DeferBlockBehavior, NoopNgZone, ApplicationRef, getDebugNode, RendererFactory2, Directive, Component, Pipe, NgModule, ReflectionCapabilities, depsTracker, isComponentDefPendingResolution, resolveComponentResources, NgModuleRef, ApplicationInitStatus, LOCALE_ID, DEFAULT_LOCALE_ID, setLocaleId, ComponentFactory, getAsyncClassMetadataFn, compileComponent, compileDirective, compilePipe, patchComponentDefWithScope, compileNgModuleDefs, clearResolutionOfComponentResourcesQueue, restoreComponentResolutionQueue, internalProvideZoneChangeDetection, ChangeDetectionSchedulerImpl, COMPILER_OPTIONS, generateStandaloneInDeclarationsError, transitiveScopesFor, Compiler, DEFER_BLOCK_CONFIG, ANIMATIONS_DISABLED, NgModuleFactory, ModuleWithComponentFactories, resetCompiledComponents, ɵsetUnknownElementStrictMode as _setUnknownElementStrictMode, ɵsetUnknownPropertyStrictMode as _setUnknownPropertyStrictMode, ɵgetUnknownElementStrictMode as _getUnknownElementStrictMode, ɵgetUnknownPropertyStrictMode as _getUnknownPropertyStrictMode, inferTagNameFromDefinition, flushModuleScopingQueueAsMuchAsPossible, setAllowDuplicateNgModuleIdsForTest } from './debug_node.mjs';
import { Subscription } from 'rxjs';
import { inject as inject$1, EnvironmentInjector, ErrorHandler, CONTAINER_HEADER_OFFSET, InjectionToken, PendingTasksInternal, ZONELESS_ENABLED, ChangeDetectionScheduler, EffectScheduler, stringify, getInjectableDef, resolveForwardRef, NG_COMP_DEF, NG_DIR_DEF, NG_PIPE_DEF, NG_INJ_DEF, NG_MOD_DEF, ENVIRONMENT_INITIALIZER, Injector, isEnvironmentProviders, INTERNAL_APPLICATION_ERROR_HANDLER, runInInjectionContext, getComponentDef as getComponentDef$1 } from './root_effect_scheduler.mjs';
import { ResourceLoader } from '@angular/compiler';
import './signal.mjs';
import '@angular/core/primitives/signals';
import 'rxjs/operators';
import './attribute.mjs';
import './not_found.mjs';
import '@angular/core/primitives/di';

/**
 * Wraps a test function in an asynchronous test zone. The test will automatically
 * complete when all asynchronous calls within this zone are done. Can be used
 * to wrap an {@link inject} call.
 *
 * Example:
 *
 * ```ts
 * it('...', waitForAsync(inject([AClass], (object) => {
 *   object.doSomething.then(() => {
 *     expect(...);
 *   })
 * })));
 * ```
 *
 * @publicApi
 */
function waitForAsync(fn) {
    const _Zone = typeof Zone !== 'undefined' ? Zone : null;
    if (!_Zone) {
        return function () {
            return Promise.reject('Zone is needed for the waitForAsync() test helper but could not be found. ' +
                'Please make sure that your environment includes zone.js');
        };
    }
    const asyncTest = _Zone && _Zone[_Zone.__symbol__('asyncTest')];
    if (typeof asyncTest === 'function') {
        return asyncTest(fn);
    }
    return function () {
        return Promise.reject('zone-testing.js is needed for the async() test helper but could not be found. ' +
            'Please make sure that your environment includes zone.js/testing');
    };
}

const RETHROW_APPLICATION_ERRORS_DEFAULT = true;
class TestBedApplicationErrorHandler {
    zone = inject$1(NgZone);
    injector = inject$1(EnvironmentInjector);
    userErrorHandler;
    whenStableRejectFunctions = new Set();
    handleError(e) {
        try {
            this.zone.runOutsideAngular(() => {
                this.userErrorHandler ??= this.injector.get(ErrorHandler);
                this.userErrorHandler.handleError(e);
            });
        }
        catch (userError) {
            e = userError;
        }
        // Instead of throwing the error when there are outstanding `fixture.whenStable` promises,
        // reject those promises with the error. This allows developers to write
        // expectAsync(fix.whenStable()).toBeRejected();
        if (this.whenStableRejectFunctions.size > 0) {
            for (const fn of this.whenStableRejectFunctions.values()) {
                fn(e);
            }
            this.whenStableRejectFunctions.clear();
        }
        else {
            throw e;
        }
    }
    static ɵfac = function TestBedApplicationErrorHandler_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || TestBedApplicationErrorHandler)(); };
    static ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: TestBedApplicationErrorHandler, factory: TestBedApplicationErrorHandler.ɵfac });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(TestBedApplicationErrorHandler, [{
        type: Injectable
    }], null, null); })();

/**
 * Represents an individual defer block for testing purposes.
 *
 * @publicApi
 */
class DeferBlockFixture {
    block;
    componentFixture;
    /** @docs-private */
    constructor(block, componentFixture) {
        this.block = block;
        this.componentFixture = componentFixture;
    }
    /**
     * Renders the specified state of the defer fixture.
     * @param state the defer state to render
     */
    async render(state) {
        if (!hasStateTemplate(state, this.block)) {
            const stateAsString = getDeferBlockStateNameFromEnum(state);
            throw new Error(`Tried to render this defer block in the \`${stateAsString}\` state, ` +
                `but there was no @${stateAsString.toLowerCase()} block defined in a template.`);
        }
        if (state === DeferBlockState.Complete) {
            await triggerResourceLoading(this.block.tDetails, this.block.lView, this.block.tNode);
        }
        // If the `render` method is used explicitly - skip timer-based scheduling for
        // `@placeholder` and `@loading` blocks and render them immediately.
        const skipTimerScheduling = true;
        renderDeferBlockState(state, this.block.tNode, this.block.lContainer, skipTimerScheduling);
        this.componentFixture.detectChanges();
    }
    /**
     * Retrieves all nested child defer block fixtures
     * in a given defer block.
     */
    getDeferBlocks() {
        const deferBlocks = [];
        // An LContainer that represents a defer block has at most 1 view, which is
        // located right after an LContainer header. Get a hold of that view and inspect
        // it for nested defer blocks.
        const deferBlockFixtures = [];
        if (this.block.lContainer.length >= CONTAINER_HEADER_OFFSET) {
            const lView = this.block.lContainer[CONTAINER_HEADER_OFFSET];
            getDeferBlocks(lView, deferBlocks);
            for (const block of deferBlocks) {
                deferBlockFixtures.push(new DeferBlockFixture(block, this.componentFixture));
            }
        }
        return Promise.resolve(deferBlockFixtures);
    }
}
function hasStateTemplate(state, block) {
    switch (state) {
        case DeferBlockState.Placeholder:
            return block.tDetails.placeholderTmplIndex !== null;
        case DeferBlockState.Loading:
            return block.tDetails.loadingTmplIndex !== null;
        case DeferBlockState.Error:
            return block.tDetails.errorTmplIndex !== null;
        case DeferBlockState.Complete:
            return true;
        default:
            return false;
    }
}
function getDeferBlockStateNameFromEnum(state) {
    switch (state) {
        case DeferBlockState.Placeholder:
            return 'Placeholder';
        case DeferBlockState.Loading:
            return 'Loading';
        case DeferBlockState.Error:
            return 'Error';
        default:
            return 'Main';
    }
}

/** Whether test modules should be torn down by default. */
const TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT = true;
/** Whether unknown elements in templates should throw by default. */
const THROW_ON_UNKNOWN_ELEMENTS_DEFAULT = false;
/** Whether unknown properties in templates should throw by default. */
const THROW_ON_UNKNOWN_PROPERTIES_DEFAULT = false;
/** Whether defer blocks should use manual triggering or play through normally. */
const DEFER_BLOCK_DEFAULT_BEHAVIOR = DeferBlockBehavior.Playthrough;
/** Whether animations are enabled or disabled. */
const ANIMATIONS_ENABLED_DEFAULT = false;
/**
 * An abstract class for inserting the root test component element in a platform independent way.
 *
 * @publicApi
 */
class TestComponentRenderer {
    insertRootElement(rootElementId, tagName) { }
    removeAllRootElements() { }
}
/**
 * @publicApi
 */
const ComponentFixtureAutoDetect = new InjectionToken('ComponentFixtureAutoDetect');
/**
 * @publicApi
 */
const ComponentFixtureNoNgZone = new InjectionToken('ComponentFixtureNoNgZone');

/**
 * Fixture for debugging and testing a component.
 *
 * @publicApi
 */
class ComponentFixture {
    componentRef;
    /**
     * The DebugElement associated with the root element of this component.
     */
    debugElement;
    /**
     * The instance of the root component class.
     */
    componentInstance;
    /**
     * The native element at the root of the component.
     */
    nativeElement;
    /**
     * The ElementRef for the element at the root of the component.
     */
    elementRef;
    /**
     * The ChangeDetectorRef for the component
     */
    changeDetectorRef;
    _renderer;
    _isDestroyed = false;
    /** @internal */
    _noZoneOptionIsSet = inject$1(ComponentFixtureNoNgZone, { optional: true });
    /** @internal */
    _ngZone = this._noZoneOptionIsSet ? new NoopNgZone() : inject$1(NgZone);
    // Inject ApplicationRef to ensure NgZone stableness causes after render hooks to run
    // This will likely happen as a result of fixture.detectChanges because it calls ngZone.run
    // This is a crazy way of doing things but hey, it's the world we live in.
    // The zoneless scheduler should instead do this more imperatively by attaching
    // the `ComponentRef` to `ApplicationRef` and calling `appRef.tick` as the `detectChanges`
    // behavior.
    /** @internal */
    _appRef = inject$1(ApplicationRef);
    _testAppRef = this._appRef;
    pendingTasks = inject$1(PendingTasksInternal);
    appErrorHandler = inject$1(TestBedApplicationErrorHandler);
    zonelessEnabled = inject$1(ZONELESS_ENABLED);
    scheduler = inject$1(ChangeDetectionScheduler);
    rootEffectScheduler = inject$1(EffectScheduler);
    autoDetectDefault = this.zonelessEnabled ? true : false;
    autoDetect = inject$1(ComponentFixtureAutoDetect, { optional: true }) ?? this.autoDetectDefault;
    subscriptions = new Subscription();
    // TODO(atscott): Remove this from public API
    ngZone = this._noZoneOptionIsSet ? null : this._ngZone;
    /** @docs-private */
    constructor(componentRef) {
        this.componentRef = componentRef;
        this.changeDetectorRef = componentRef.changeDetectorRef;
        this.elementRef = componentRef.location;
        this.debugElement = getDebugNode(this.elementRef.nativeElement);
        this.componentInstance = componentRef.instance;
        this.nativeElement = this.elementRef.nativeElement;
        this.componentRef = componentRef;
        this._testAppRef.allTestViews.add(this.componentRef.hostView);
        if (this.autoDetect) {
            this._testAppRef.autoDetectTestViews.add(this.componentRef.hostView);
            this.scheduler?.notify(8 /* ɵNotificationSource.ViewAttached */);
            this.scheduler?.notify(0 /* ɵNotificationSource.MarkAncestorsForTraversal */);
        }
        this.componentRef.hostView.onDestroy(() => {
            this._testAppRef.allTestViews.delete(this.componentRef.hostView);
            this._testAppRef.autoDetectTestViews.delete(this.componentRef.hostView);
        });
        // Create subscriptions outside the NgZone so that the callbacks run outside
        // of NgZone.
        this._ngZone.runOutsideAngular(() => {
            this.subscriptions.add(this._ngZone.onError.subscribe({
                next: (error) => {
                    // The rethrow here is to ensure that errors don't go unreported. Since `NgZone.onHandleError` returns `false`,
                    // ZoneJS will not throw the error coming out of a task. Instead, the handling is defined by
                    // the chain of parent delegates and whether they indicate the error is handled in some way (by returning `false`).
                    // Unfortunately, 'onError' does not forward the information about whether the error was handled by a parent zone
                    // so cannot know here whether throwing is appropriate. As a half-solution, we can check to see if we're inside
                    // a fakeAsync context, which we know has its own error handling.
                    // https://github.com/angular/angular/blob/db2f2d99c82aae52d8a0ae46616c6411d070b35e/packages/zone.js/lib/zone-spec/fake-async-test.ts#L783-L784
                    // https://github.com/angular/angular/blob/db2f2d99c82aae52d8a0ae46616c6411d070b35e/packages/zone.js/lib/zone-spec/fake-async-test.ts#L473-L478
                    if (typeof Zone === 'undefined' || Zone.current.get('FakeAsyncTestZoneSpec')) {
                        return;
                    }
                    throw error;
                },
            }));
        });
    }
    /**
     * Trigger a change detection cycle for the component.
     */
    detectChanges(checkNoChanges = true) {
        const originalCheckNoChanges = this.componentRef.changeDetectorRef.checkNoChanges;
        try {
            if (!checkNoChanges) {
                this.componentRef.changeDetectorRef.checkNoChanges = () => { };
            }
            if (this.zonelessEnabled) {
                try {
                    this._testAppRef.includeAllTestViews = true;
                    this._appRef.tick();
                }
                finally {
                    this._testAppRef.includeAllTestViews = false;
                }
            }
            else {
                // Run the change detection inside the NgZone so that any async tasks as part of the change
                // detection are captured by the zone and can be waited for in isStable.
                this._ngZone.run(() => {
                    // Flush root effects before `detectChanges()`, to emulate the sequencing of `tick()`.
                    this.rootEffectScheduler.flush();
                    this.changeDetectorRef.detectChanges();
                    this.checkNoChanges();
                });
            }
        }
        finally {
            this.componentRef.changeDetectorRef.checkNoChanges = originalCheckNoChanges;
        }
    }
    /**
     * Do a change detection run to make sure there were no changes.
     */
    checkNoChanges() {
        this.changeDetectorRef.checkNoChanges();
    }
    autoDetectChanges(autoDetect = true) {
        if (!autoDetect && this.zonelessEnabled) {
            throw new Error('Cannot set autoDetect to false with zoneless change detection.');
        }
        if (this._noZoneOptionIsSet && !this.zonelessEnabled) {
            throw new Error('Cannot call autoDetectChanges when ComponentFixtureNoNgZone is set.');
        }
        if (autoDetect) {
            this._testAppRef.autoDetectTestViews.add(this.componentRef.hostView);
        }
        else {
            this._testAppRef.autoDetectTestViews.delete(this.componentRef.hostView);
        }
        this.autoDetect = autoDetect;
        this.detectChanges();
    }
    /**
     * Return whether the fixture is currently stable or has async tasks that have not been completed
     * yet.
     */
    isStable() {
        return !this.pendingTasks.hasPendingTasks;
    }
    /**
     * Get a promise that resolves when the fixture is stable.
     *
     * This can be used to resume testing after events have triggered asynchronous activity or
     * asynchronous change detection.
     */
    whenStable() {
        if (this.isStable()) {
            return Promise.resolve(false);
        }
        return new Promise((resolve, reject) => {
            this.appErrorHandler.whenStableRejectFunctions.add(reject);
            this._appRef.whenStable().then(() => {
                this.appErrorHandler.whenStableRejectFunctions.delete(reject);
                resolve(true);
            });
        });
    }
    /**
     * Retrieves all defer block fixtures in the component fixture.
     */
    getDeferBlocks() {
        const deferBlocks = [];
        const lView = this.componentRef.hostView['_lView'];
        getDeferBlocks(lView, deferBlocks);
        const deferBlockFixtures = [];
        for (const block of deferBlocks) {
            deferBlockFixtures.push(new DeferBlockFixture(block, this));
        }
        return Promise.resolve(deferBlockFixtures);
    }
    _getRenderer() {
        if (this._renderer === undefined) {
            this._renderer = this.componentRef.injector.get(RendererFactory2, null);
        }
        return this._renderer;
    }
    /**
     * Get a promise that resolves when the ui state is stable following animations.
     */
    whenRenderingDone() {
        const renderer = this._getRenderer();
        if (renderer && renderer.whenRenderingDone) {
            return renderer.whenRenderingDone();
        }
        return this.whenStable();
    }
    /**
     * Trigger component destruction.
     */
    destroy() {
        this.subscriptions.unsubscribe();
        this._testAppRef.autoDetectTestViews.delete(this.componentRef.hostView);
        this._testAppRef.allTestViews.delete(this.componentRef.hostView);
        if (!this._isDestroyed) {
            this.componentRef.destroy();
            this._isDestroyed = true;
        }
    }
}

const _Zone = typeof Zone !== 'undefined' ? Zone : null;
function getFakeAsyncTestModule() {
    return _Zone && _Zone[_Zone.__symbol__('fakeAsyncTest')];
}
function withFakeAsyncTestModule(fn) {
    const fakeAsyncTestModule = getFakeAsyncTestModule();
    if (!fakeAsyncTestModule) {
        throw new Error(`zone-testing.js is needed for the fakeAsync() test helper but could not be found.
        Please make sure that your environment includes zone.js/testing`);
    }
    return fn(fakeAsyncTestModule);
}
/**
 * Clears out the shared fake async zone for a test.
 * To be called in a global `beforeEach`.
 *
 * @publicApi
 */
function resetFakeAsyncZone() {
    withFakeAsyncTestModule((v) => v.resetFakeAsyncZone());
}
function resetFakeAsyncZoneIfExists() {
    if (getFakeAsyncTestModule() && Zone['ProxyZoneSpec']?.isLoaded()) {
        getFakeAsyncTestModule().resetFakeAsyncZone();
    }
}
/**
 * Wraps a function to be executed in the `fakeAsync` zone:
 * - Microtasks are manually executed by calling `flushMicrotasks()`.
 * - Timers are synchronous; `tick()` simulates the asynchronous passage of time.
 *
 * Can be used to wrap `inject()` calls.
 *
 * @param fn The function that you want to wrap in the `fakeAsync` zone.
 * @param options
 *   - flush: When true, will drain the macrotask queue after the test function completes.
 *     When false, will throw an exception at the end of the function if there are pending timers.
 *
 * @usageNotes
 * ### Example
 *
 * {@example core/testing/ts/fake_async.ts region='basic'}
 *
 *
 * @returns The function wrapped to be executed in the `fakeAsync` zone.
 * Any arguments passed when calling this returned function will be passed through to the `fn`
 * function in the parameters when it is called.
 *
 * @publicApi
 */
function fakeAsync(fn, options) {
    return withFakeAsyncTestModule((v) => v.fakeAsync(fn, options));
}
/**
 * Simulates the asynchronous passage of time for the timers in the `fakeAsync` zone.
 *
 * The microtasks queue is drained at the very start of this function and after any timer callback
 * has been executed.
 *
 * @param millis The number of milliseconds to advance the virtual timer.
 * @param tickOptions The options to pass to the `tick()` function.
 *
 * @usageNotes
 *
 * The `tick()` option is a flag called `processNewMacroTasksSynchronously`,
 * which determines whether or not to invoke new macroTasks.
 *
 * If you provide a `tickOptions` object, but do not specify a
 * `processNewMacroTasksSynchronously` property (`tick(100, {})`),
 * then `processNewMacroTasksSynchronously` defaults to true.
 *
 * If you omit the `tickOptions` parameter (`tick(100))`), then
 * `tickOptions` defaults to `{processNewMacroTasksSynchronously: true}`.
 *
 * ### Example
 *
 * {@example core/testing/ts/fake_async.ts region='basic'}
 *
 * The following example includes a nested timeout (new macroTask), and
 * the `tickOptions` parameter is allowed to default. In this case,
 * `processNewMacroTasksSynchronously` defaults to true, and the nested
 * function is executed on each tick.
 *
 * ```ts
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick();
 *   expect(nestedTimeoutInvoked).toBe(true);
 * }));
 * ```
 *
 * In the following case, `processNewMacroTasksSynchronously` is explicitly
 * set to false, so the nested timeout function is not invoked.
 *
 * ```ts
 * it ('test with nested setTimeout', fakeAsync(() => {
 *   let nestedTimeoutInvoked = false;
 *   function funcWithNestedTimeout() {
 *     setTimeout(() => {
 *       nestedTimeoutInvoked = true;
 *     });
 *   };
 *   setTimeout(funcWithNestedTimeout);
 *   tick(0, {processNewMacroTasksSynchronously: false});
 *   expect(nestedTimeoutInvoked).toBe(false);
 * }));
 * ```
 *
 *
 * @publicApi
 */
function tick(millis = 0, tickOptions = {
    processNewMacroTasksSynchronously: true,
}) {
    return withFakeAsyncTestModule((m) => m.tick(millis, tickOptions));
}
/**
 * Flushes any pending microtasks and simulates the asynchronous passage of time for the timers in
 * the `fakeAsync` zone by
 * draining the macrotask queue until it is empty.
 *
 * @param maxTurns The maximum number of times the scheduler attempts to clear its queue before
 *     throwing an error.
 * @returns The simulated time elapsed, in milliseconds.
 *
 * @publicApi
 */
function flush(maxTurns) {
    return withFakeAsyncTestModule((m) => m.flush(maxTurns));
}
/**
 * Discard all remaining periodic tasks.
 *
 * @publicApi
 */
function discardPeriodicTasks() {
    return withFakeAsyncTestModule((m) => m.discardPeriodicTasks());
}
/**
 * Flush any pending microtasks.
 *
 * @publicApi
 */
function flushMicrotasks() {
    return withFakeAsyncTestModule((m) => m.flushMicrotasks());
}

let _nextReferenceId = 0;
class MetadataOverrider {
    _references = new Map();
    /**
     * Creates a new instance for the given metadata class
     * based on an old instance and overrides.
     */
    overrideMetadata(metadataClass, oldMetadata, override) {
        const props = {};
        if (oldMetadata) {
            _valueProps(oldMetadata).forEach((prop) => (props[prop] = oldMetadata[prop]));
        }
        if (override.set) {
            if (override.remove || override.add) {
                throw new Error(`Cannot set and add/remove ${stringify(metadataClass)} at the same time!`);
            }
            setMetadata(props, override.set);
        }
        if (override.remove) {
            removeMetadata(props, override.remove, this._references);
        }
        if (override.add) {
            addMetadata(props, override.add);
        }
        return new metadataClass(props);
    }
}
function removeMetadata(metadata, remove, references) {
    const removeObjects = new Set();
    for (const prop in remove) {
        const removeValue = remove[prop];
        if (Array.isArray(removeValue)) {
            removeValue.forEach((value) => {
                removeObjects.add(_propHashKey(prop, value, references));
            });
        }
        else {
            removeObjects.add(_propHashKey(prop, removeValue, references));
        }
    }
    for (const prop in metadata) {
        const propValue = metadata[prop];
        if (Array.isArray(propValue)) {
            metadata[prop] = propValue.filter((value) => !removeObjects.has(_propHashKey(prop, value, references)));
        }
        else {
            if (removeObjects.has(_propHashKey(prop, propValue, references))) {
                metadata[prop] = undefined;
            }
        }
    }
}
function addMetadata(metadata, add) {
    for (const prop in add) {
        const addValue = add[prop];
        const propValue = metadata[prop];
        if (propValue != null && Array.isArray(propValue)) {
            metadata[prop] = propValue.concat(addValue);
        }
        else {
            metadata[prop] = addValue;
        }
    }
}
function setMetadata(metadata, set) {
    for (const prop in set) {
        metadata[prop] = set[prop];
    }
}
function _propHashKey(propName, propValue, references) {
    let nextObjectId = 0;
    const objectIds = new Map();
    const replacer = (key, value) => {
        if (value !== null && typeof value === 'object') {
            if (objectIds.has(value)) {
                return objectIds.get(value);
            }
            // Record an id for this object such that any later references use the object's id instead
            // of the object itself, in order to break cyclic pointers in objects.
            objectIds.set(value, `ɵobj#${nextObjectId++}`);
            // The first time an object is seen the object itself is serialized.
            return value;
        }
        else if (typeof value === 'function') {
            value = _serializeReference(value, references);
        }
        return value;
    };
    return `${propName}:${JSON.stringify(propValue, replacer)}`;
}
function _serializeReference(ref, references) {
    let id = references.get(ref);
    if (!id) {
        id = `${stringify(ref)}${_nextReferenceId++}`;
        references.set(ref, id);
    }
    return id;
}
function _valueProps(obj) {
    const props = [];
    // regular public props
    Object.keys(obj).forEach((prop) => {
        if (!prop.startsWith('_')) {
            props.push(prop);
        }
    });
    // getters
    let proto = obj;
    while ((proto = Object.getPrototypeOf(proto))) {
        Object.keys(proto).forEach((protoProp) => {
            const desc = Object.getOwnPropertyDescriptor(proto, protoProp);
            if (!protoProp.startsWith('_') && desc && 'get' in desc) {
                props.push(protoProp);
            }
        });
    }
    return props;
}

const reflection = new ReflectionCapabilities();
/**
 * Allows to override ivy metadata for tests (via the `TestBed`).
 */
class OverrideResolver {
    overrides = new Map();
    resolved = new Map();
    addOverride(type, override) {
        const overrides = this.overrides.get(type) || [];
        overrides.push(override);
        this.overrides.set(type, overrides);
        this.resolved.delete(type);
    }
    setOverrides(overrides) {
        this.overrides.clear();
        overrides.forEach(([type, override]) => {
            this.addOverride(type, override);
        });
    }
    getAnnotation(type) {
        const annotations = reflection.annotations(type);
        // Try to find the nearest known Type annotation and make sure that this annotation is an
        // instance of the type we are looking for, so we can use it for resolution. Note: there might
        // be multiple known annotations found due to the fact that Components can extend Directives (so
        // both Directive and Component annotations would be present), so we always check if the known
        // annotation has the right type.
        for (let i = annotations.length - 1; i >= 0; i--) {
            const annotation = annotations[i];
            const isKnownType = annotation instanceof Directive ||
                annotation instanceof Component ||
                annotation instanceof Pipe ||
                annotation instanceof NgModule;
            if (isKnownType) {
                return annotation instanceof this.type ? annotation : null;
            }
        }
        return null;
    }
    resolve(type) {
        let resolved = this.resolved.get(type) || null;
        if (!resolved) {
            resolved = this.getAnnotation(type);
            if (resolved) {
                const overrides = this.overrides.get(type);
                if (overrides) {
                    const overrider = new MetadataOverrider();
                    overrides.forEach((override) => {
                        resolved = overrider.overrideMetadata(this.type, resolved, override);
                    });
                }
            }
            this.resolved.set(type, resolved);
        }
        return resolved;
    }
}
class DirectiveResolver extends OverrideResolver {
    get type() {
        return Directive;
    }
}
class ComponentResolver extends OverrideResolver {
    get type() {
        return Component;
    }
}
class PipeResolver extends OverrideResolver {
    get type() {
        return Pipe;
    }
}
class NgModuleResolver extends OverrideResolver {
    get type() {
        return NgModule;
    }
}

var TestingModuleOverride;
(function (TestingModuleOverride) {
    TestingModuleOverride[TestingModuleOverride["DECLARATION"] = 0] = "DECLARATION";
    TestingModuleOverride[TestingModuleOverride["OVERRIDE_TEMPLATE"] = 1] = "OVERRIDE_TEMPLATE";
})(TestingModuleOverride || (TestingModuleOverride = {}));
function isTestingModuleOverride(value) {
    return (value === TestingModuleOverride.DECLARATION || value === TestingModuleOverride.OVERRIDE_TEMPLATE);
}
function assertNoStandaloneComponents(types, resolver, location) {
    types.forEach((type) => {
        if (!getAsyncClassMetadataFn(type)) {
            const component = resolver.resolve(type);
            if (component && (component.standalone == null || component.standalone)) {
                throw new Error(generateStandaloneInDeclarationsError(type, location));
            }
        }
    });
}
class TestBedCompiler {
    platform;
    additionalModuleTypes;
    originalComponentResolutionQueue = null;
    // Testing module configuration
    declarations = [];
    imports = [];
    providers = [];
    schemas = [];
    // Queues of components/directives/pipes that should be recompiled.
    pendingComponents = new Set();
    pendingDirectives = new Set();
    pendingPipes = new Set();
    // Set of components with async metadata, i.e. components with `@defer` blocks
    // in their templates.
    componentsWithAsyncMetadata = new Set();
    // Keep track of all components and directives, so we can patch Providers onto defs later.
    seenComponents = new Set();
    seenDirectives = new Set();
    // Keep track of overridden modules, so that we can collect all affected ones in the module tree.
    overriddenModules = new Set();
    // Store resolved styles for Components that have template overrides present and `styleUrls`
    // defined at the same time.
    existingComponentStyles = new Map();
    resolvers = initResolvers();
    // Map of component type to an NgModule that declares it.
    //
    // There are a couple special cases:
    // - for standalone components, the module scope value is `null`
    // - when a component is declared in `TestBed.configureTestingModule()` call or
    //   a component's template is overridden via `TestBed.overrideTemplateUsingTestingModule()`.
    //   we use a special value from the `TestingModuleOverride` enum.
    componentToModuleScope = new Map();
    // Map that keeps initial version of component/directive/pipe defs in case
    // we compile a Type again, thus overriding respective static fields. This is
    // required to make sure we restore defs to their initial states between test runs.
    // Note: one class may have multiple defs (for example: ɵmod and ɵinj in case of an
    // NgModule), store all of them in a map.
    initialNgDefs = new Map();
    // Array that keeps cleanup operations for initial versions of component/directive/pipe/module
    // defs in case TestBed makes changes to the originals.
    defCleanupOps = [];
    _injector = null;
    compilerProviders = null;
    providerOverrides = [];
    rootProviderOverrides = [];
    // Overrides for injectables with `{providedIn: SomeModule}` need to be tracked and added to that
    // module's provider list.
    providerOverridesByModule = new Map();
    providerOverridesByToken = new Map();
    scopesWithOverriddenProviders = new Set();
    testModuleType;
    testModuleRef = null;
    animationsEnabled = ANIMATIONS_ENABLED_DEFAULT;
    deferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
    rethrowApplicationTickErrors = RETHROW_APPLICATION_ERRORS_DEFAULT;
    constructor(platform, additionalModuleTypes) {
        this.platform = platform;
        this.additionalModuleTypes = additionalModuleTypes;
        class DynamicTestModule {
        }
        this.testModuleType = DynamicTestModule;
    }
    setCompilerProviders(providers) {
        this.compilerProviders = providers;
        this._injector = null;
    }
    configureTestingModule(moduleDef) {
        // Enqueue any compilation tasks for the directly declared component.
        if (moduleDef.declarations !== undefined) {
            // Verify that there are no standalone components
            assertNoStandaloneComponents(moduleDef.declarations, this.resolvers.component, '"TestBed.configureTestingModule" call');
            this.queueTypeArray(moduleDef.declarations, TestingModuleOverride.DECLARATION);
            this.declarations.push(...moduleDef.declarations);
        }
        // Enqueue any compilation tasks for imported modules.
        if (moduleDef.imports !== undefined) {
            this.queueTypesFromModulesArray(moduleDef.imports);
            this.imports.push(...moduleDef.imports);
        }
        if (moduleDef.providers !== undefined) {
            this.providers.push(...moduleDef.providers);
        }
        if (moduleDef.schemas !== undefined) {
            this.schemas.push(...moduleDef.schemas);
        }
        this.deferBlockBehavior = moduleDef.deferBlockBehavior ?? DEFER_BLOCK_DEFAULT_BEHAVIOR;
        this.animationsEnabled = moduleDef.animationsEnabled ?? ANIMATIONS_ENABLED_DEFAULT;
        this.rethrowApplicationTickErrors =
            moduleDef.rethrowApplicationErrors ?? RETHROW_APPLICATION_ERRORS_DEFAULT;
    }
    overrideModule(ngModule, override) {
        depsTracker.clearScopeCacheFor(ngModule);
        this.overriddenModules.add(ngModule);
        // Compile the module right away.
        this.resolvers.module.addOverride(ngModule, override);
        const metadata = this.resolvers.module.resolve(ngModule);
        if (metadata === null) {
            throw invalidTypeError(ngModule.name, 'NgModule');
        }
        this.recompileNgModule(ngModule, metadata);
        // At this point, the module has a valid module def (ɵmod), but the override may have introduced
        // new declarations or imported modules. Ingest any possible new types and add them to the
        // current queue.
        this.queueTypesFromModulesArray([ngModule]);
    }
    overrideComponent(component, override) {
        this.verifyNoStandaloneFlagOverrides(component, override);
        this.resolvers.component.addOverride(component, override);
        this.pendingComponents.add(component);
        // If this is a component with async metadata (i.e. a component with a `@defer` block
        // in a template) - store it for future processing.
        this.maybeRegisterComponentWithAsyncMetadata(component);
    }
    overrideDirective(directive, override) {
        this.verifyNoStandaloneFlagOverrides(directive, override);
        this.resolvers.directive.addOverride(directive, override);
        this.pendingDirectives.add(directive);
    }
    overridePipe(pipe, override) {
        this.verifyNoStandaloneFlagOverrides(pipe, override);
        this.resolvers.pipe.addOverride(pipe, override);
        this.pendingPipes.add(pipe);
    }
    verifyNoStandaloneFlagOverrides(type, override) {
        if (override.add?.hasOwnProperty('standalone') ||
            override.set?.hasOwnProperty('standalone') ||
            override.remove?.hasOwnProperty('standalone')) {
            throw new Error(`An override for the ${type.name} class has the \`standalone\` flag. ` +
                `Changing the \`standalone\` flag via TestBed overrides is not supported.`);
        }
    }
    overrideProvider(token, provider) {
        let providerDef;
        if (provider.useFactory !== undefined) {
            providerDef = {
                provide: token,
                useFactory: provider.useFactory,
                deps: provider.deps || [],
                multi: provider.multi,
            };
        }
        else if (provider.useValue !== undefined) {
            providerDef = { provide: token, useValue: provider.useValue, multi: provider.multi };
        }
        else {
            providerDef = { provide: token };
        }
        const injectableDef = typeof token !== 'string' ? getInjectableDef(token) : null;
        const providedIn = injectableDef === null ? null : resolveForwardRef(injectableDef.providedIn);
        const overridesBucket = providedIn === 'root' ? this.rootProviderOverrides : this.providerOverrides;
        overridesBucket.push(providerDef);
        // Keep overrides grouped by token as well for fast lookups using token
        this.providerOverridesByToken.set(token, providerDef);
        if (injectableDef !== null && providedIn !== null && typeof providedIn !== 'string') {
            const existingOverrides = this.providerOverridesByModule.get(providedIn);
            if (existingOverrides !== undefined) {
                existingOverrides.push(providerDef);
            }
            else {
                this.providerOverridesByModule.set(providedIn, [providerDef]);
            }
        }
    }
    overrideTemplateUsingTestingModule(type, template) {
        const def = type[NG_COMP_DEF];
        const hasStyleUrls = () => {
            const metadata = this.resolvers.component.resolve(type);
            return !!metadata.styleUrl || !!metadata.styleUrls?.length;
        };
        const overrideStyleUrls = !!def && !isComponentDefPendingResolution(type) && hasStyleUrls();
        // In Ivy, compiling a component does not require knowing the module providing the
        // component's scope, so overrideTemplateUsingTestingModule can be implemented purely via
        // overrideComponent. Important: overriding template requires full Component re-compilation,
        // which may fail in case styleUrls are also present (thus Component is considered as required
        // resolution). In order to avoid this, we preemptively set styleUrls to an empty array,
        // preserve current styles available on Component def and restore styles back once compilation
        // is complete.
        const override = overrideStyleUrls
            ? { template, styles: [], styleUrls: [], styleUrl: undefined }
            : { template };
        this.overrideComponent(type, { set: override });
        if (overrideStyleUrls && def.styles && def.styles.length > 0) {
            this.existingComponentStyles.set(type, def.styles);
        }
        // Set the component's scope to be the testing module.
        this.componentToModuleScope.set(type, TestingModuleOverride.OVERRIDE_TEMPLATE);
    }
    async resolvePendingComponentsWithAsyncMetadata() {
        if (this.componentsWithAsyncMetadata.size === 0)
            return;
        const promises = [];
        for (const component of this.componentsWithAsyncMetadata) {
            const asyncMetadataFn = getAsyncClassMetadataFn(component);
            if (asyncMetadataFn) {
                promises.push(asyncMetadataFn());
            }
        }
        this.componentsWithAsyncMetadata.clear();
        const resolvedDeps = await Promise.all(promises);
        const flatResolvedDeps = resolvedDeps.flat(2);
        this.queueTypesFromModulesArray(flatResolvedDeps);
        // Loaded standalone components might contain imports of NgModules
        // with providers, make sure we override providers there too.
        for (const component of flatResolvedDeps) {
            this.applyProviderOverridesInScope(component);
        }
    }
    async compileComponents() {
        this.clearComponentResolutionQueue();
        // Wait for all async metadata for components that were
        // overridden, we need resolved metadata to perform an override
        // and re-compile a component.
        await this.resolvePendingComponentsWithAsyncMetadata();
        // Verify that there were no standalone components present in the `declarations` field
        // during the `TestBed.configureTestingModule` call. We perform this check here in addition
        // to the logic in the `configureTestingModule` function, since at this point we have
        // all async metadata resolved.
        assertNoStandaloneComponents(this.declarations, this.resolvers.component, '"TestBed.configureTestingModule" call');
        // Run compilers for all queued types.
        let needsAsyncResources = this.compileTypesSync();
        // compileComponents() should not be async unless it needs to be.
        if (needsAsyncResources) {
            let resourceLoader;
            let resolver = (url) => {
                if (!resourceLoader) {
                    resourceLoader = this.injector.get(ResourceLoader);
                }
                return Promise.resolve(resourceLoader.get(url));
            };
            await resolveComponentResources(resolver);
        }
    }
    finalize() {
        // One last compile
        this.compileTypesSync();
        // Create the testing module itself.
        this.compileTestModule();
        this.applyTransitiveScopes();
        this.applyProviderOverrides();
        // Patch previously stored `styles` Component values (taken from ɵcmp), in case these
        // Components have `styleUrls` fields defined and template override was requested.
        this.patchComponentsWithExistingStyles();
        // Clear the componentToModuleScope map, so that future compilations don't reset the scope of
        // every component.
        this.componentToModuleScope.clear();
        const parentInjector = this.platform.injector;
        this.testModuleRef = new NgModuleRef(this.testModuleType, parentInjector, []);
        // ApplicationInitStatus.runInitializers() is marked @internal to core.
        // Cast it to any before accessing it.
        this.testModuleRef.injector.get(ApplicationInitStatus).runInitializers();
        // Set locale ID after running app initializers, since locale information might be updated while
        // running initializers. This is also consistent with the execution order while bootstrapping an
        // app (see `packages/core/src/application_ref.ts` file).
        const localeId = this.testModuleRef.injector.get(LOCALE_ID, DEFAULT_LOCALE_ID);
        setLocaleId(localeId);
        return this.testModuleRef;
    }
    /**
     * @internal
     */
    _compileNgModuleSync(moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        this.compileTypesSync();
        this.applyProviderOverrides();
        this.applyProviderOverridesInScope(moduleType);
        this.applyTransitiveScopes();
    }
    /**
     * @internal
     */
    async _compileNgModuleAsync(moduleType) {
        this.queueTypesFromModulesArray([moduleType]);
        await this.compileComponents();
        this.applyProviderOverrides();
        this.applyProviderOverridesInScope(moduleType);
        this.applyTransitiveScopes();
    }
    /**
     * @internal
     */
    _getModuleResolver() {
        return this.resolvers.module;
    }
    /**
     * @internal
     */
    _getComponentFactories(moduleType) {
        return maybeUnwrapFn(moduleType.ɵmod.declarations).reduce((factories, declaration) => {
            const componentDef = declaration.ɵcmp;
            componentDef && factories.push(new ComponentFactory(componentDef, this.testModuleRef));
            return factories;
        }, []);
    }
    compileTypesSync() {
        // Compile all queued components, directives, pipes.
        let needsAsyncResources = false;
        this.pendingComponents.forEach((declaration) => {
            if (getAsyncClassMetadataFn(declaration)) {
                throw new Error(`Component '${declaration.name}' has unresolved metadata. ` +
                    `Please call \`await TestBed.compileComponents()\` before running this test.`);
            }
            needsAsyncResources = needsAsyncResources || isComponentDefPendingResolution(declaration);
            const metadata = this.resolvers.component.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Component');
            }
            this.maybeStoreNgDef(NG_COMP_DEF, declaration);
            depsTracker.clearScopeCacheFor(declaration);
            compileComponent(declaration, metadata);
        });
        this.pendingComponents.clear();
        this.pendingDirectives.forEach((declaration) => {
            const metadata = this.resolvers.directive.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Directive');
            }
            this.maybeStoreNgDef(NG_DIR_DEF, declaration);
            compileDirective(declaration, metadata);
        });
        this.pendingDirectives.clear();
        this.pendingPipes.forEach((declaration) => {
            const metadata = this.resolvers.pipe.resolve(declaration);
            if (metadata === null) {
                throw invalidTypeError(declaration.name, 'Pipe');
            }
            this.maybeStoreNgDef(NG_PIPE_DEF, declaration);
            compilePipe(declaration, metadata);
        });
        this.pendingPipes.clear();
        return needsAsyncResources;
    }
    applyTransitiveScopes() {
        if (this.overriddenModules.size > 0) {
            // Module overrides (via `TestBed.overrideModule`) might affect scopes that were previously
            // calculated and stored in `transitiveCompileScopes`. If module overrides are present,
            // collect all affected modules and reset scopes to force their re-calculation.
            const testingModuleDef = this.testModuleType[NG_MOD_DEF];
            const affectedModules = this.collectModulesAffectedByOverrides(testingModuleDef.imports);
            if (affectedModules.size > 0) {
                affectedModules.forEach((moduleType) => {
                    depsTracker.clearScopeCacheFor(moduleType);
                });
            }
        }
        const moduleToScope = new Map();
        const getScopeOfModule = (moduleType) => {
            if (!moduleToScope.has(moduleType)) {
                const isTestingModule = isTestingModuleOverride(moduleType);
                const realType = isTestingModule ? this.testModuleType : moduleType;
                moduleToScope.set(moduleType, transitiveScopesFor(realType));
            }
            return moduleToScope.get(moduleType);
        };
        this.componentToModuleScope.forEach((moduleType, componentType) => {
            if (moduleType !== null) {
                const moduleScope = getScopeOfModule(moduleType);
                this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'directiveDefs');
                this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'pipeDefs');
                patchComponentDefWithScope(getComponentDef(componentType), moduleScope);
            }
            // `tView` that is stored on component def contains information about directives and pipes
            // that are in the scope of this component. Patching component scope will cause `tView` to be
            // changed. Store original `tView` before patching scope, so the `tView` (including scope
            // information) is restored back to its previous/original state before running next test.
            // Resetting `tView` is also needed for cases when we apply provider overrides and those
            // providers are defined on component's level, in which case they may end up included into
            // `tView.blueprint`.
            this.storeFieldOfDefOnType(componentType, NG_COMP_DEF, 'tView');
        });
        this.componentToModuleScope.clear();
    }
    applyProviderOverrides() {
        const maybeApplyOverrides = (field) => (type) => {
            const resolver = field === NG_COMP_DEF ? this.resolvers.component : this.resolvers.directive;
            const metadata = resolver.resolve(type);
            if (this.hasProviderOverrides(metadata.providers)) {
                this.patchDefWithProviderOverrides(type, field);
            }
        };
        this.seenComponents.forEach(maybeApplyOverrides(NG_COMP_DEF));
        this.seenDirectives.forEach(maybeApplyOverrides(NG_DIR_DEF));
        this.seenComponents.clear();
        this.seenDirectives.clear();
    }
    /**
     * Applies provider overrides to a given type (either an NgModule or a standalone component)
     * and all imported NgModules and standalone components recursively.
     */
    applyProviderOverridesInScope(type) {
        const hasScope = isStandaloneComponent(type) || isNgModule(type);
        // The function can be re-entered recursively while inspecting dependencies
        // of an NgModule or a standalone component. Exit early if we come across a
        // type that can not have a scope (directive or pipe) or the type is already
        // processed earlier.
        if (!hasScope || this.scopesWithOverriddenProviders.has(type)) {
            return;
        }
        this.scopesWithOverriddenProviders.add(type);
        // NOTE: the line below triggers JIT compilation of the module injector,
        // which also invokes verification of the NgModule semantics, which produces
        // detailed error messages. The fact that the code relies on this line being
        // present here is suspicious and should be refactored in a way that the line
        // below can be moved (for ex. after an early exit check below).
        const injectorDef = type[NG_INJ_DEF];
        // No provider overrides, exit early.
        if (this.providerOverridesByToken.size === 0)
            return;
        if (isStandaloneComponent(type)) {
            // Visit all component dependencies and override providers there.
            const def = getComponentDef(type);
            const dependencies = maybeUnwrapFn(def.dependencies ?? []);
            for (const dependency of dependencies) {
                this.applyProviderOverridesInScope(dependency);
            }
        }
        else {
            const providers = [
                ...injectorDef.providers,
                ...(this.providerOverridesByModule.get(type) || []),
            ];
            if (this.hasProviderOverrides(providers)) {
                this.maybeStoreNgDef(NG_INJ_DEF, type);
                this.storeFieldOfDefOnType(type, NG_INJ_DEF, 'providers');
                injectorDef.providers = this.getOverriddenProviders(providers);
            }
            // Apply provider overrides to imported modules recursively
            const moduleDef = type[NG_MOD_DEF];
            const imports = maybeUnwrapFn(moduleDef.imports);
            for (const importedModule of imports) {
                this.applyProviderOverridesInScope(importedModule);
            }
            // Also override the providers on any ModuleWithProviders imports since those don't appear in
            // the moduleDef.
            for (const importedModule of flatten(injectorDef.imports)) {
                if (isModuleWithProviders(importedModule)) {
                    this.defCleanupOps.push({
                        object: importedModule,
                        fieldName: 'providers',
                        originalValue: importedModule.providers,
                    });
                    importedModule.providers = this.getOverriddenProviders(importedModule.providers);
                }
            }
        }
    }
    patchComponentsWithExistingStyles() {
        this.existingComponentStyles.forEach((styles, type) => (type[NG_COMP_DEF].styles = styles));
        this.existingComponentStyles.clear();
    }
    queueTypeArray(arr, moduleType) {
        for (const value of arr) {
            if (Array.isArray(value)) {
                this.queueTypeArray(value, moduleType);
            }
            else {
                this.queueType(value, moduleType);
            }
        }
    }
    recompileNgModule(ngModule, metadata) {
        // Cache the initial ngModuleDef as it will be overwritten.
        this.maybeStoreNgDef(NG_MOD_DEF, ngModule);
        this.maybeStoreNgDef(NG_INJ_DEF, ngModule);
        compileNgModuleDefs(ngModule, metadata);
    }
    maybeRegisterComponentWithAsyncMetadata(type) {
        const asyncMetadataFn = getAsyncClassMetadataFn(type);
        if (asyncMetadataFn) {
            this.componentsWithAsyncMetadata.add(type);
        }
    }
    queueType(type, moduleType) {
        // If this is a component with async metadata (i.e. a component with a `@defer` block
        // in a template) - store it for future processing.
        this.maybeRegisterComponentWithAsyncMetadata(type);
        const component = this.resolvers.component.resolve(type);
        if (component) {
            // Check whether a give Type has respective NG def (ɵcmp) and compile if def is
            // missing. That might happen in case a class without any Angular decorators extends another
            // class where Component/Directive/Pipe decorator is defined.
            if (isComponentDefPendingResolution(type) || !type.hasOwnProperty(NG_COMP_DEF)) {
                this.pendingComponents.add(type);
            }
            this.seenComponents.add(type);
            // Keep track of the module which declares this component, so later the component's scope
            // can be set correctly. If the component has already been recorded here, then one of several
            // cases is true:
            // * the module containing the component was imported multiple times (common).
            // * the component is declared in multiple modules (which is an error).
            // * the component was in 'declarations' of the testing module, and also in an imported module
            //   in which case the module scope will be TestingModuleOverride.DECLARATION.
            // * overrideTemplateUsingTestingModule was called for the component in which case the module
            //   scope will be TestingModuleOverride.OVERRIDE_TEMPLATE.
            //
            // If the component was previously in the testing module's 'declarations' (meaning the
            // current value is TestingModuleOverride.DECLARATION), then `moduleType` is the component's
            // real module, which was imported. This pattern is understood to mean that the component
            // should use its original scope, but that the testing module should also contain the
            // component in its scope.
            if (!this.componentToModuleScope.has(type) ||
                this.componentToModuleScope.get(type) === TestingModuleOverride.DECLARATION) {
                this.componentToModuleScope.set(type, moduleType);
            }
            return;
        }
        const directive = this.resolvers.directive.resolve(type);
        if (directive) {
            if (!type.hasOwnProperty(NG_DIR_DEF)) {
                this.pendingDirectives.add(type);
            }
            this.seenDirectives.add(type);
            return;
        }
        const pipe = this.resolvers.pipe.resolve(type);
        if (pipe && !type.hasOwnProperty(NG_PIPE_DEF)) {
            this.pendingPipes.add(type);
            return;
        }
    }
    queueTypesFromModulesArray(arr) {
        // Because we may encounter the same NgModule or a standalone Component while processing
        // the dependencies of an NgModule or a standalone Component, we cache them in this set so we
        // can skip ones that have already been seen encountered. In some test setups, this caching
        // resulted in 10X runtime improvement.
        const processedDefs = new Set();
        const queueTypesFromModulesArrayRecur = (arr) => {
            for (const value of arr) {
                if (Array.isArray(value)) {
                    queueTypesFromModulesArrayRecur(value);
                }
                else if (hasNgModuleDef(value)) {
                    const def = value.ɵmod;
                    if (processedDefs.has(def)) {
                        continue;
                    }
                    processedDefs.add(def);
                    // Look through declarations, imports, and exports, and queue
                    // everything found there.
                    this.queueTypeArray(maybeUnwrapFn(def.declarations), value);
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.imports));
                    queueTypesFromModulesArrayRecur(maybeUnwrapFn(def.exports));
                }
                else if (isModuleWithProviders(value)) {
                    queueTypesFromModulesArrayRecur([value.ngModule]);
                }
                else if (isStandaloneComponent(value)) {
                    this.queueType(value, null);
                    const def = getComponentDef(value);
                    if (processedDefs.has(def)) {
                        continue;
                    }
                    processedDefs.add(def);
                    const dependencies = maybeUnwrapFn(def.dependencies ?? []);
                    dependencies.forEach((dependency) => {
                        // Note: in AOT, the `dependencies` might also contain regular
                        // (NgModule-based) Component, Directive and Pipes, so we handle
                        // them separately and proceed with recursive process for standalone
                        // Components and NgModules only.
                        if (isStandaloneComponent(dependency) || hasNgModuleDef(dependency)) {
                            queueTypesFromModulesArrayRecur([dependency]);
                        }
                        else {
                            this.queueType(dependency, null);
                        }
                    });
                }
            }
        };
        queueTypesFromModulesArrayRecur(arr);
    }
    // When module overrides (via `TestBed.overrideModule`) are present, it might affect all modules
    // that import (even transitively) an overridden one. For all affected modules we need to
    // recalculate their scopes for a given test run and restore original scopes at the end. The goal
    // of this function is to collect all affected modules in a set for further processing. Example:
    // if we have the following module hierarchy: A -> B -> C (where `->` means `imports`) and module
    // `C` is overridden, we consider `A` and `B` as affected, since their scopes might become
    // invalidated with the override.
    collectModulesAffectedByOverrides(arr) {
        const seenModules = new Set();
        const affectedModules = new Set();
        const calcAffectedModulesRecur = (arr, path) => {
            for (const value of arr) {
                if (Array.isArray(value)) {
                    // If the value is an array, just flatten it (by invoking this function recursively),
                    // keeping "path" the same.
                    calcAffectedModulesRecur(value, path);
                }
                else if (hasNgModuleDef(value)) {
                    if (seenModules.has(value)) {
                        // If we've seen this module before and it's included into "affected modules" list, mark
                        // the whole path that leads to that module as affected, but do not descend into its
                        // imports, since we already examined them before.
                        if (affectedModules.has(value)) {
                            path.forEach((item) => affectedModules.add(item));
                        }
                        continue;
                    }
                    seenModules.add(value);
                    if (this.overriddenModules.has(value)) {
                        path.forEach((item) => affectedModules.add(item));
                    }
                    // Examine module imports recursively to look for overridden modules.
                    const moduleDef = value[NG_MOD_DEF];
                    calcAffectedModulesRecur(maybeUnwrapFn(moduleDef.imports), path.concat(value));
                }
            }
        };
        calcAffectedModulesRecur(arr, []);
        return affectedModules;
    }
    /**
     * Preserve an original def (such as ɵmod, ɵinj, etc) before applying an override.
     * Note: one class may have multiple defs (for example: ɵmod and ɵinj in case of
     * an NgModule). If there is a def in a set already, don't override it, since
     * an original one should be restored at the end of a test.
     */
    maybeStoreNgDef(prop, type) {
        if (!this.initialNgDefs.has(type)) {
            this.initialNgDefs.set(type, new Map());
        }
        const currentDefs = this.initialNgDefs.get(type);
        if (!currentDefs.has(prop)) {
            const currentDef = Object.getOwnPropertyDescriptor(type, prop);
            currentDefs.set(prop, currentDef);
        }
    }
    storeFieldOfDefOnType(type, defField, fieldName) {
        const def = type[defField];
        const originalValue = def[fieldName];
        this.defCleanupOps.push({ object: def, fieldName, originalValue });
    }
    /**
     * Clears current components resolution queue, but stores the state of the queue, so we can
     * restore it later. Clearing the queue is required before we try to compile components (via
     * `TestBed.compileComponents`), so that component defs are in sync with the resolution queue.
     */
    clearComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue === null) {
            this.originalComponentResolutionQueue = new Map();
        }
        clearResolutionOfComponentResourcesQueue().forEach((value, key) => this.originalComponentResolutionQueue.set(key, value));
    }
    /*
     * Restores component resolution queue to the previously saved state. This operation is performed
     * as a part of restoring the state after completion of the current set of tests (that might
     * potentially mutate the state).
     */
    restoreComponentResolutionQueue() {
        if (this.originalComponentResolutionQueue !== null) {
            restoreComponentResolutionQueue(this.originalComponentResolutionQueue);
            this.originalComponentResolutionQueue = null;
        }
    }
    restoreOriginalState() {
        // Process cleanup ops in reverse order so the field's original value is restored correctly (in
        // case there were multiple overrides for the same field).
        forEachRight(this.defCleanupOps, (op) => {
            op.object[op.fieldName] = op.originalValue;
        });
        // Restore initial component/directive/pipe defs
        this.initialNgDefs.forEach((defs, type) => {
            depsTracker.clearScopeCacheFor(type);
            defs.forEach((descriptor, prop) => {
                if (!descriptor) {
                    // Delete operations are generally undesirable since they have performance
                    // implications on objects they were applied to. In this particular case, situations
                    // where this code is invoked should be quite rare to cause any noticeable impact,
                    // since it's applied only to some test cases (for example when class with no
                    // annotations extends some @Component) when we need to clear 'ɵcmp' field on a given
                    // class to restore its original state (before applying overrides and running tests).
                    delete type[prop];
                }
                else {
                    Object.defineProperty(type, prop, descriptor);
                }
            });
        });
        this.initialNgDefs.clear();
        this.scopesWithOverriddenProviders.clear();
        this.restoreComponentResolutionQueue();
        // Restore the locale ID to the default value, this shouldn't be necessary but we never know
        setLocaleId(DEFAULT_LOCALE_ID);
    }
    compileTestModule() {
        class RootScopeModule {
        }
        compileNgModuleDefs(RootScopeModule, {
            providers: [
                ...this.rootProviderOverrides,
                internalProvideZoneChangeDetection({}),
                TestBedApplicationErrorHandler,
                { provide: ChangeDetectionScheduler, useExisting: ChangeDetectionSchedulerImpl },
                {
                    provide: ENVIRONMENT_INITIALIZER,
                    multi: true,
                    useValue: () => {
                        inject$1(ErrorHandler);
                    },
                },
            ],
        });
        const providers = [
            { provide: Compiler, useFactory: () => new R3TestCompiler(this) },
            { provide: DEFER_BLOCK_CONFIG, useValue: { behavior: this.deferBlockBehavior } },
            {
                provide: ANIMATIONS_DISABLED,
                useValue: !this.animationsEnabled,
            },
            {
                provide: INTERNAL_APPLICATION_ERROR_HANDLER,
                useFactory: () => {
                    if (this.rethrowApplicationTickErrors) {
                        const handler = inject$1(TestBedApplicationErrorHandler);
                        return (e) => {
                            handler.handleError(e);
                        };
                    }
                    else {
                        const userErrorHandler = inject$1(ErrorHandler);
                        const ngZone = inject$1(NgZone);
                        return (e) => ngZone.runOutsideAngular(() => userErrorHandler.handleError(e));
                    }
                },
            },
            ...this.providers,
            ...this.providerOverrides,
        ];
        const imports = [RootScopeModule, this.additionalModuleTypes, this.imports || []];
        compileNgModuleDefs(this.testModuleType, {
            declarations: this.declarations,
            imports,
            schemas: this.schemas,
            providers,
        }, 
        /* allowDuplicateDeclarationsInRoot */ true);
        this.applyProviderOverridesInScope(this.testModuleType);
    }
    get injector() {
        if (this._injector !== null) {
            return this._injector;
        }
        const providers = [];
        const compilerOptions = this.platform.injector.get(COMPILER_OPTIONS, []);
        compilerOptions.forEach((opts) => {
            if (opts.providers) {
                providers.push(opts.providers);
            }
        });
        if (this.compilerProviders !== null) {
            providers.push(...this.compilerProviders);
        }
        this._injector = Injector.create({ providers, parent: this.platform.injector });
        return this._injector;
    }
    // get overrides for a specific provider (if any)
    getSingleProviderOverrides(provider) {
        const token = getProviderToken(provider);
        return this.providerOverridesByToken.get(token) || null;
    }
    getProviderOverrides(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        // There are two flattening operations here. The inner flattenProviders() operates on the
        // metadata's providers and applies a mapping function which retrieves overrides for each
        // incoming provider. The outer flatten() then flattens the produced overrides array. If this is
        // not done, the array can contain other empty arrays (e.g. `[[], []]`) which leak into the
        // providers array and contaminate any error messages that might be generated.
        return flatten(flattenProviders(providers, (provider) => this.getSingleProviderOverrides(provider) || []));
    }
    getOverriddenProviders(providers) {
        if (!providers || !providers.length || this.providerOverridesByToken.size === 0)
            return [];
        const flattenedProviders = flattenProviders(providers);
        const overrides = this.getProviderOverrides(flattenedProviders);
        const overriddenProviders = [...flattenedProviders, ...overrides];
        const final = [];
        const seenOverriddenProviders = new Set();
        // We iterate through the list of providers in reverse order to make sure provider overrides
        // take precedence over the values defined in provider list. We also filter out all providers
        // that have overrides, keeping overridden values only. This is needed, since presence of a
        // provider with `ngOnDestroy` hook will cause this hook to be registered and invoked later.
        forEachRight(overriddenProviders, (provider) => {
            const token = getProviderToken(provider);
            if (this.providerOverridesByToken.has(token)) {
                if (!seenOverriddenProviders.has(token)) {
                    seenOverriddenProviders.add(token);
                    // Treat all overridden providers as `{multi: false}` (even if it's a multi-provider) to
                    // make sure that provided override takes highest precedence and is not combined with
                    // other instances of the same multi provider.
                    final.unshift({ ...provider, multi: false });
                }
            }
            else {
                final.unshift(provider);
            }
        });
        return final;
    }
    hasProviderOverrides(providers) {
        return this.getProviderOverrides(providers).length > 0;
    }
    patchDefWithProviderOverrides(declaration, field) {
        const def = declaration[field];
        if (def && def.providersResolver) {
            this.maybeStoreNgDef(field, declaration);
            const resolver = def.providersResolver;
            const processProvidersFn = (providers) => this.getOverriddenProviders(providers);
            this.storeFieldOfDefOnType(declaration, field, 'providersResolver');
            def.providersResolver = (ngDef) => resolver(ngDef, processProvidersFn);
        }
    }
}
function initResolvers() {
    return {
        module: new NgModuleResolver(),
        component: new ComponentResolver(),
        directive: new DirectiveResolver(),
        pipe: new PipeResolver(),
    };
}
function isStandaloneComponent(value) {
    const def = getComponentDef(value);
    return !!def?.standalone;
}
function getComponentDef(value) {
    return value.ɵcmp ?? null;
}
function hasNgModuleDef(value) {
    return value.hasOwnProperty('ɵmod');
}
function isNgModule(value) {
    return hasNgModuleDef(value);
}
function maybeUnwrapFn(maybeFn) {
    return maybeFn instanceof Function ? maybeFn() : maybeFn;
}
function flatten(values) {
    const out = [];
    values.forEach((value) => {
        if (Array.isArray(value)) {
            out.push(...flatten(value));
        }
        else {
            out.push(value);
        }
    });
    return out;
}
function identityFn(value) {
    return value;
}
function flattenProviders(providers, mapFn = identityFn) {
    const out = [];
    for (let provider of providers) {
        if (isEnvironmentProviders(provider)) {
            provider = provider.ɵproviders;
        }
        if (Array.isArray(provider)) {
            out.push(...flattenProviders(provider, mapFn));
        }
        else {
            out.push(mapFn(provider));
        }
    }
    return out;
}
function getProviderField(provider, field) {
    return provider && typeof provider === 'object' && provider[field];
}
function getProviderToken(provider) {
    return getProviderField(provider, 'provide') || provider;
}
function isModuleWithProviders(value) {
    return value.hasOwnProperty('ngModule');
}
function forEachRight(values, fn) {
    for (let idx = values.length - 1; idx >= 0; idx--) {
        fn(values[idx], idx);
    }
}
function invalidTypeError(name, expectedType) {
    return new Error(`${name} class doesn't have @${expectedType} decorator or is missing metadata.`);
}
class R3TestCompiler {
    testBed;
    constructor(testBed) {
        this.testBed = testBed;
    }
    compileModuleSync(moduleType) {
        this.testBed._compileNgModuleSync(moduleType);
        return new NgModuleFactory(moduleType);
    }
    async compileModuleAsync(moduleType) {
        await this.testBed._compileNgModuleAsync(moduleType);
        return new NgModuleFactory(moduleType);
    }
    compileModuleAndAllComponentsSync(moduleType) {
        const ngModuleFactory = this.compileModuleSync(moduleType);
        const componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    async compileModuleAndAllComponentsAsync(moduleType) {
        const ngModuleFactory = await this.compileModuleAsync(moduleType);
        const componentFactories = this.testBed._getComponentFactories(moduleType);
        return new ModuleWithComponentFactories(ngModuleFactory, componentFactories);
    }
    clearCache() { }
    clearCacheFor(type) { }
    getModuleId(moduleType) {
        const meta = this.testBed._getModuleResolver().resolve(moduleType);
        return (meta && meta.id) || undefined;
    }
}

// The formatter and CI disagree on how this import statement should be formatted. Both try to keep
// it on one line, too, which has gotten very hard to read & manage. So disable the formatter for
// this statement only.
let _nextRootElementId = 0;
/**
 * Returns a singleton of the `TestBed` class.
 *
 * @publicApi
 */
function getTestBed() {
    return TestBedImpl.INSTANCE;
}
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * TestBed is the primary api for writing unit tests for Angular applications and libraries.
 */
class TestBedImpl {
    static _INSTANCE = null;
    static get INSTANCE() {
        return (TestBedImpl._INSTANCE = TestBedImpl._INSTANCE || new TestBedImpl());
    }
    /**
     * Teardown options that have been configured at the environment level.
     * Used as a fallback if no instance-level options have been provided.
     */
    static _environmentTeardownOptions;
    /**
     * "Error on unknown elements" option that has been configured at the environment level.
     * Used as a fallback if no instance-level option has been provided.
     */
    static _environmentErrorOnUnknownElementsOption;
    /**
     * "Error on unknown properties" option that has been configured at the environment level.
     * Used as a fallback if no instance-level option has been provided.
     */
    static _environmentErrorOnUnknownPropertiesOption;
    /**
     * Teardown options that have been configured at the `TestBed` instance level.
     * These options take precedence over the environment-level ones.
     */
    _instanceTeardownOptions;
    /**
     * Defer block behavior option that specifies whether defer blocks will be triggered manually
     * or set to play through.
     */
    _instanceDeferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
    /**
     * Animations behavior option that specifies whether animations are enabled or disabled.
     */
    _instanceAnimationsEnabled = ANIMATIONS_ENABLED_DEFAULT;
    /**
     * "Error on unknown elements" option that has been configured at the `TestBed` instance level.
     * This option takes precedence over the environment-level one.
     */
    _instanceErrorOnUnknownElementsOption;
    /**
     * "Error on unknown properties" option that has been configured at the `TestBed` instance level.
     * This option takes precedence over the environment-level one.
     */
    _instanceErrorOnUnknownPropertiesOption;
    /**
     * Stores the previous "Error on unknown elements" option value,
     * allowing to restore it in the reset testing module logic.
     */
    _previousErrorOnUnknownElementsOption;
    /**
     * Stores the previous "Error on unknown properties" option value,
     * allowing to restore it in the reset testing module logic.
     */
    _previousErrorOnUnknownPropertiesOption;
    /**
     * Stores the value for `inferTagName` from the testing module.
     */
    _instanceInferTagName;
    /**
     * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
     * angular module. These are common to every test in the suite.
     *
     * This may only be called once, to set up the common providers for the current test
     * suite on the current platform. If you absolutely need to change the providers,
     * first use `resetTestEnvironment`.
     *
     * Test modules and platforms for individual platforms are available from
     * '@angular/<platform_name>/testing'.
     *
     * @publicApi
     */
    static initTestEnvironment(ngModule, platform, options) {
        const testBed = TestBedImpl.INSTANCE;
        testBed.initTestEnvironment(ngModule, platform, options);
        return testBed;
    }
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    static resetTestEnvironment() {
        TestBedImpl.INSTANCE.resetTestEnvironment();
    }
    static configureCompiler(config) {
        return TestBedImpl.INSTANCE.configureCompiler(config);
    }
    /**
     * Allows overriding default providers, directives, pipes, modules of the test injector,
     * which are defined in test_injector.js
     */
    static configureTestingModule(moduleDef) {
        return TestBedImpl.INSTANCE.configureTestingModule(moduleDef);
    }
    /**
     * Compile components with a `templateUrl` for the test's NgModule.
     * It is necessary to call this function
     * as fetching urls is asynchronous.
     */
    static compileComponents() {
        return TestBedImpl.INSTANCE.compileComponents();
    }
    static overrideModule(ngModule, override) {
        return TestBedImpl.INSTANCE.overrideModule(ngModule, override);
    }
    static overrideComponent(component, override) {
        return TestBedImpl.INSTANCE.overrideComponent(component, override);
    }
    static overrideDirective(directive, override) {
        return TestBedImpl.INSTANCE.overrideDirective(directive, override);
    }
    static overridePipe(pipe, override) {
        return TestBedImpl.INSTANCE.overridePipe(pipe, override);
    }
    static overrideTemplate(component, template) {
        return TestBedImpl.INSTANCE.overrideTemplate(component, template);
    }
    /**
     * Overrides the template of the given component, compiling the template
     * in the context of the TestingModule.
     *
     * Note: This works for JIT and AOTed components as well.
     */
    static overrideTemplateUsingTestingModule(component, template) {
        return TestBedImpl.INSTANCE.overrideTemplateUsingTestingModule(component, template);
    }
    static overrideProvider(token, provider) {
        return TestBedImpl.INSTANCE.overrideProvider(token, provider);
    }
    static inject(token, notFoundValue, options) {
        return TestBedImpl.INSTANCE.inject(token, notFoundValue, options);
    }
    /**
     * Runs the given function in the `EnvironmentInjector` context of `TestBed`.
     *
     * @see {@link https://angular.dev/api/core/EnvironmentInjector#runInContext}
     */
    static runInInjectionContext(fn) {
        return TestBedImpl.INSTANCE.runInInjectionContext(fn);
    }
    static createComponent(component, options) {
        return TestBedImpl.INSTANCE.createComponent(component, options);
    }
    static resetTestingModule() {
        return TestBedImpl.INSTANCE.resetTestingModule();
    }
    static execute(tokens, fn, context) {
        return TestBedImpl.INSTANCE.execute(tokens, fn, context);
    }
    static get platform() {
        return TestBedImpl.INSTANCE.platform;
    }
    static get ngModule() {
        return TestBedImpl.INSTANCE.ngModule;
    }
    static flushEffects() {
        return TestBedImpl.INSTANCE.tick();
    }
    static tick() {
        return TestBedImpl.INSTANCE.tick();
    }
    // Properties
    platform = null;
    ngModule = null;
    _compiler = null;
    _testModuleRef = null;
    _activeFixtures = [];
    /**
     * Internal-only flag to indicate whether a module
     * scoping queue has been checked and flushed already.
     * @docs-private
     */
    globalCompilationChecked = false;
    /**
     * Initialize the environment for testing with a compiler factory, a PlatformRef, and an
     * angular module. These are common to every test in the suite.
     *
     * This may only be called once, to set up the common providers for the current test
     * suite on the current platform. If you absolutely need to change the providers,
     * first use `resetTestEnvironment`.
     *
     * Test modules and platforms for individual platforms are available from
     * '@angular/<platform_name>/testing'.
     *
     * @publicApi
     */
    initTestEnvironment(ngModule, platform, options) {
        if (this.platform || this.ngModule) {
            throw new Error('Cannot set base providers because it has already been called');
        }
        TestBedImpl._environmentTeardownOptions = options?.teardown;
        TestBedImpl._environmentErrorOnUnknownElementsOption = options?.errorOnUnknownElements;
        TestBedImpl._environmentErrorOnUnknownPropertiesOption = options?.errorOnUnknownProperties;
        this.platform = platform;
        this.ngModule = ngModule;
        this._compiler = new TestBedCompiler(this.platform, this.ngModule);
        // TestBed does not have an API which can reliably detect the start of a test, and thus could be
        // used to track the state of the NgModule registry and reset it correctly. Instead, when we
        // know we're in a testing scenario, we disable the check for duplicate NgModule registration
        // completely.
        setAllowDuplicateNgModuleIdsForTest(true);
    }
    /**
     * Reset the providers for the test injector.
     *
     * @publicApi
     */
    resetTestEnvironment() {
        this.resetTestingModule();
        this._compiler = null;
        this.platform = null;
        this.ngModule = null;
        TestBedImpl._environmentTeardownOptions = undefined;
        setAllowDuplicateNgModuleIdsForTest(false);
    }
    resetTestingModule() {
        this.checkGlobalCompilationFinished();
        resetCompiledComponents();
        if (this._compiler !== null) {
            this.compiler.restoreOriginalState();
        }
        this._compiler = new TestBedCompiler(this.platform, this.ngModule);
        // Restore the previous value of the "error on unknown elements" option
        _setUnknownElementStrictMode(this._previousErrorOnUnknownElementsOption ?? THROW_ON_UNKNOWN_ELEMENTS_DEFAULT);
        // Restore the previous value of the "error on unknown properties" option
        _setUnknownPropertyStrictMode(this._previousErrorOnUnknownPropertiesOption ?? THROW_ON_UNKNOWN_PROPERTIES_DEFAULT);
        // We have to chain a couple of try/finally blocks, because each step can
        // throw errors and we don't want it to interrupt the next step and we also
        // want an error to be thrown at the end.
        try {
            this.destroyActiveFixtures();
        }
        finally {
            try {
                if (this.shouldTearDownTestingModule()) {
                    this.tearDownTestingModule();
                }
            }
            finally {
                this._testModuleRef = null;
                this._instanceTeardownOptions = undefined;
                this._instanceErrorOnUnknownElementsOption = undefined;
                this._instanceErrorOnUnknownPropertiesOption = undefined;
                this._instanceInferTagName = undefined;
                this._instanceDeferBlockBehavior = DEFER_BLOCK_DEFAULT_BEHAVIOR;
                this._instanceAnimationsEnabled = ANIMATIONS_ENABLED_DEFAULT;
            }
        }
        return this;
    }
    configureCompiler(config) {
        if (config.useJit != null) {
            throw new Error('JIT compiler is not configurable via TestBed APIs.');
        }
        if (config.providers !== undefined) {
            this.compiler.setCompilerProviders(config.providers);
        }
        return this;
    }
    configureTestingModule(moduleDef) {
        this.assertNotInstantiated('TestBed.configureTestingModule', 'configure the test module');
        // Trigger module scoping queue flush before executing other TestBed operations in a test.
        // This is needed for the first test invocation to ensure that globally declared modules have
        // their components scoped properly. See the `checkGlobalCompilationFinished` function
        // description for additional info.
        this.checkGlobalCompilationFinished();
        // Always re-assign the options, even if they're undefined.
        // This ensures that we don't carry them between tests.
        this._instanceTeardownOptions = moduleDef.teardown;
        this._instanceErrorOnUnknownElementsOption = moduleDef.errorOnUnknownElements;
        this._instanceErrorOnUnknownPropertiesOption = moduleDef.errorOnUnknownProperties;
        this._instanceInferTagName = moduleDef.inferTagName;
        this._instanceDeferBlockBehavior = moduleDef.deferBlockBehavior ?? DEFER_BLOCK_DEFAULT_BEHAVIOR;
        this._instanceAnimationsEnabled = moduleDef.animationsEnabled ?? ANIMATIONS_ENABLED_DEFAULT;
        // Store the current value of the strict mode option,
        // so we can restore it later
        this._previousErrorOnUnknownElementsOption = _getUnknownElementStrictMode();
        _setUnknownElementStrictMode(this.shouldThrowErrorOnUnknownElements());
        this._previousErrorOnUnknownPropertiesOption = _getUnknownPropertyStrictMode();
        _setUnknownPropertyStrictMode(this.shouldThrowErrorOnUnknownProperties());
        this.compiler.configureTestingModule(moduleDef);
        return this;
    }
    compileComponents() {
        return this.compiler.compileComponents();
    }
    inject(token, notFoundValue, options) {
        if (token === TestBed) {
            return this;
        }
        const UNDEFINED = {};
        const result = this.testModuleRef.injector.get(token, UNDEFINED, options);
        return result === UNDEFINED
            ? this.compiler.injector.get(token, notFoundValue, options)
            : result;
    }
    runInInjectionContext(fn) {
        return runInInjectionContext(this.inject(EnvironmentInjector), fn);
    }
    execute(tokens, fn, context) {
        const params = tokens.map((t) => this.inject(t));
        return fn.apply(context, params);
    }
    overrideModule(ngModule, override) {
        this.assertNotInstantiated('overrideModule', 'override module metadata');
        this.compiler.overrideModule(ngModule, override);
        return this;
    }
    overrideComponent(component, override) {
        this.assertNotInstantiated('overrideComponent', 'override component metadata');
        this.compiler.overrideComponent(component, override);
        return this;
    }
    overrideTemplateUsingTestingModule(component, template) {
        this.assertNotInstantiated('TestBed.overrideTemplateUsingTestingModule', 'Cannot override template when the test module has already been instantiated');
        this.compiler.overrideTemplateUsingTestingModule(component, template);
        return this;
    }
    overrideDirective(directive, override) {
        this.assertNotInstantiated('overrideDirective', 'override directive metadata');
        this.compiler.overrideDirective(directive, override);
        return this;
    }
    overridePipe(pipe, override) {
        this.assertNotInstantiated('overridePipe', 'override pipe metadata');
        this.compiler.overridePipe(pipe, override);
        return this;
    }
    /**
     * Overwrites all providers for the given token with the given provider definition.
     */
    overrideProvider(token, provider) {
        this.assertNotInstantiated('overrideProvider', 'override provider');
        this.compiler.overrideProvider(token, provider);
        return this;
    }
    overrideTemplate(component, template) {
        return this.overrideComponent(component, { set: { template, templateUrl: null } });
    }
    createComponent(type, options) {
        if (getAsyncClassMetadataFn(type)) {
            throw new Error(`Component '${type.name}' has unresolved metadata. ` +
                `Please call \`await TestBed.compileComponents()\` before running this test.`);
        }
        // Note: injecting the renderer before accessing the definition appears to be load-bearing.
        const testComponentRenderer = this.inject(TestComponentRenderer);
        const shouldInferTagName = options?.inferTagName ?? this._instanceInferTagName ?? false;
        const componentDef = getComponentDef$1(type);
        const rootElId = `root${_nextRootElementId++}`;
        if (!componentDef) {
            throw new Error(`It looks like '${stringify(type)}' has not been compiled.`);
        }
        testComponentRenderer.insertRootElement(rootElId, shouldInferTagName ? inferTagNameFromDefinition(componentDef) : undefined);
        const componentFactory = new ComponentFactory(componentDef);
        const initComponent = () => {
            const componentRef = componentFactory.create(Injector.NULL, [], `#${rootElId}`, this.testModuleRef, undefined, options?.bindings);
            return this.runInInjectionContext(() => new ComponentFixture(componentRef));
        };
        const noNgZone = this.inject(ComponentFixtureNoNgZone, false);
        const ngZone = noNgZone ? null : this.inject(NgZone, null);
        const fixture = ngZone ? ngZone.run(initComponent) : initComponent();
        this._activeFixtures.push(fixture);
        return fixture;
    }
    /**
     * @internal strip this from published d.ts files due to
     * https://github.com/microsoft/TypeScript/issues/36216
     */
    get compiler() {
        if (this._compiler === null) {
            throw new Error(`Need to call TestBed.initTestEnvironment() first`);
        }
        return this._compiler;
    }
    /**
     * @internal strip this from published d.ts files due to
     * https://github.com/microsoft/TypeScript/issues/36216
     */
    get testModuleRef() {
        if (this._testModuleRef === null) {
            this._testModuleRef = this.compiler.finalize();
        }
        return this._testModuleRef;
    }
    assertNotInstantiated(methodName, methodDescription) {
        if (this._testModuleRef !== null) {
            throw new Error(`Cannot ${methodDescription} when the test module has already been instantiated. ` +
                `Make sure you are not using \`inject\` before \`${methodName}\`.`);
        }
    }
    /**
     * Check whether the module scoping queue should be flushed, and flush it if needed.
     *
     * When the TestBed is reset, it clears the JIT module compilation queue, cancelling any
     * in-progress module compilation. This creates a potential hazard - the very first time the
     * TestBed is initialized (or if it's reset without being initialized), there may be pending
     * compilations of modules declared in global scope. These compilations should be finished.
     *
     * To ensure that globally declared modules have their components scoped properly, this function
     * is called whenever TestBed is initialized or reset. The _first_ time that this happens, prior
     * to any other operations, the scoping queue is flushed.
     */
    checkGlobalCompilationFinished() {
        // Checking _testNgModuleRef is null should not be necessary, but is left in as an additional
        // guard that compilations queued in tests (after instantiation) are never flushed accidentally.
        if (!this.globalCompilationChecked && this._testModuleRef === null) {
            flushModuleScopingQueueAsMuchAsPossible();
        }
        this.globalCompilationChecked = true;
    }
    destroyActiveFixtures() {
        let errorCount = 0;
        this._activeFixtures.forEach((fixture) => {
            try {
                fixture.destroy();
            }
            catch (e) {
                errorCount++;
                console.error('Error during cleanup of component', {
                    component: fixture.componentInstance,
                    stacktrace: e,
                });
            }
        });
        this._activeFixtures = [];
        if (errorCount > 0 && this.shouldRethrowTeardownErrors()) {
            throw Error(`${errorCount} ${errorCount === 1 ? 'component' : 'components'} ` +
                `threw errors during cleanup`);
        }
    }
    shouldRethrowTeardownErrors() {
        const instanceOptions = this._instanceTeardownOptions;
        const environmentOptions = TestBedImpl._environmentTeardownOptions;
        // If the new teardown behavior hasn't been configured, preserve the old behavior.
        if (!instanceOptions && !environmentOptions) {
            return TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT;
        }
        // Otherwise use the configured behavior or default to rethrowing.
        return (instanceOptions?.rethrowErrors ??
            environmentOptions?.rethrowErrors ??
            this.shouldTearDownTestingModule());
    }
    shouldThrowErrorOnUnknownElements() {
        // Check if a configuration has been provided to throw when an unknown element is found
        return (this._instanceErrorOnUnknownElementsOption ??
            TestBedImpl._environmentErrorOnUnknownElementsOption ??
            THROW_ON_UNKNOWN_ELEMENTS_DEFAULT);
    }
    shouldThrowErrorOnUnknownProperties() {
        // Check if a configuration has been provided to throw when an unknown property is found
        return (this._instanceErrorOnUnknownPropertiesOption ??
            TestBedImpl._environmentErrorOnUnknownPropertiesOption ??
            THROW_ON_UNKNOWN_PROPERTIES_DEFAULT);
    }
    shouldTearDownTestingModule() {
        return (this._instanceTeardownOptions?.destroyAfterEach ??
            TestBedImpl._environmentTeardownOptions?.destroyAfterEach ??
            TEARDOWN_TESTING_MODULE_ON_DESTROY_DEFAULT);
    }
    getDeferBlockBehavior() {
        return this._instanceDeferBlockBehavior;
    }
    getAnimationsEnabled() {
        return this._instanceAnimationsEnabled;
    }
    tearDownTestingModule() {
        // If the module ref has already been destroyed, we won't be able to get a test renderer.
        if (this._testModuleRef === null) {
            return;
        }
        // Resolve the renderer ahead of time, because we want to remove the root elements as the very
        // last step, but the injector will be destroyed as a part of the module ref destruction.
        const testRenderer = this.inject(TestComponentRenderer);
        try {
            this._testModuleRef.destroy();
        }
        catch (e) {
            if (this.shouldRethrowTeardownErrors()) {
                throw e;
            }
            else {
                console.error('Error during cleanup of a testing module', {
                    component: this._testModuleRef.instance,
                    stacktrace: e,
                });
            }
        }
        finally {
            testRenderer.removeAllRootElements?.();
        }
    }
    /**
     * Execute any pending effects by executing any pending work required to synchronize model to the UI.
     *
     * @deprecated use `TestBed.tick()` instead
     */
    flushEffects() {
        this.tick();
    }
    /**
     * Execute any pending work required to synchronize model to the UI.
     *
     * @publicApi
     */
    tick() {
        const appRef = this.inject(ApplicationRef);
        try {
            // TODO(atscott): ApplicationRef.tick should set includeAllTestViews to true itself rather than doing this here and in ComponentFixture
            // The behavior should be that TestBed.tick, ComponentFixture.detectChanges, and ApplicationRef.tick all result in the test fixtures
            // getting synchronized, regardless of whether they are autoDetect: true.
            // Automatic scheduling (zone or zoneless) will call _tick which will _not_ include fixtures with autoDetect: false
            appRef.includeAllTestViews = true;
            appRef.tick();
        }
        finally {
            appRef.includeAllTestViews = false;
        }
    }
}
/**
 * @description
 * Configures and initializes environment for unit testing and provides methods for
 * creating components and services in unit tests.
 *
 * `TestBed` is the primary api for writing unit tests for Angular applications and libraries.
 *
 * @publicApi
 */
const TestBed = TestBedImpl;
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`. Note: this function
 * (imported from the `@angular/core/testing` package) can **only** be used to inject dependencies
 * in tests. To inject dependencies in your application code, use the [`inject`](api/core/inject)
 * function from the `@angular/core` package instead.
 *
 * Example:
 *
 * ```ts
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * @publicApi
 */
function inject(tokens, fn) {
    const testBed = TestBedImpl.INSTANCE;
    // Not using an arrow function to preserve context passed from call site
    return function () {
        return testBed.execute(tokens, fn, this);
    };
}
/**
 * @publicApi
 */
class InjectSetupWrapper {
    _moduleDef;
    constructor(_moduleDef) {
        this._moduleDef = _moduleDef;
    }
    _addModule() {
        const moduleDef = this._moduleDef();
        if (moduleDef) {
            TestBedImpl.configureTestingModule(moduleDef);
        }
    }
    inject(tokens, fn) {
        const self = this;
        // Not using an arrow function to preserve context passed from call site
        return function () {
            self._addModule();
            return inject(tokens, fn).call(this);
        };
    }
}
function withModule(moduleDef, fn) {
    if (fn) {
        // Not using an arrow function to preserve context passed from call site
        return function () {
            const testBed = TestBedImpl.INSTANCE;
            if (moduleDef) {
                testBed.configureTestingModule(moduleDef);
            }
            return fn.apply(this);
        };
    }
    return new InjectSetupWrapper(() => moduleDef);
}

/**
 * Fake implementation of user agent history and navigation behavior. This is a
 * high-fidelity implementation of browser behavior that attempts to emulate
 * things like traversal delay.
 */
class FakeNavigation {
    /**
     * The fake implementation of an entries array. Only same-document entries
     * allowed.
     */
    entriesArr = [];
    /**
     * The current active entry index into `entriesArr`.
     */
    currentEntryIndex = 0;
    /**
     * The current navigate event.
     * @internal
     */
    navigateEvent = null;
    /**
     * A Map of pending traversals, so that traversals to the same entry can be
     * re-used.
     */
    traversalQueue = new Map();
    /**
     * A Promise that resolves when the previous traversals have finished. Used to
     * simulate the cross-process communication necessary for traversals.
     */
    nextTraversal = Promise.resolve();
    /**
     * A prospective current active entry index, which includes unresolved
     * traversals. Used by `go` to determine where navigations are intended to go.
     */
    prospectiveEntryIndex = 0;
    /**
     * A test-only option to make traversals synchronous, rather than emulate
     * cross-process communication.
     */
    synchronousTraversals = false;
    /** Whether to allow a call to setInitialEntryForTesting. */
    canSetInitialEntry = true;
    /**
     * `EventTarget` to dispatch events.
     * @internal
     */
    eventTarget;
    /** The next unique id for created entries. Replace recreates this id. */
    nextId = 0;
    /** The next unique key for created entries. Replace inherits this id. */
    nextKey = 0;
    /** Whether this fake is disposed. */
    disposed = false;
    /** Equivalent to `navigation.currentEntry`. */
    get currentEntry() {
        return this.entriesArr[this.currentEntryIndex];
    }
    get canGoBack() {
        return this.currentEntryIndex > 0;
    }
    get canGoForward() {
        return this.currentEntryIndex < this.entriesArr.length - 1;
    }
    createEventTarget;
    _window;
    get window() {
        return this._window;
    }
    constructor(doc, startURL) {
        this.createEventTarget = () => {
            try {
                // `document.createElement` because NodeJS `EventTarget` is
                // incompatible with Domino's `Event`. That is, attempting to
                // dispatch an event created by Domino's patched `Event` will
                // throw an error since it is not an instance of a real Node
                // `Event`.
                return doc.createElement('div');
            }
            catch {
                // Fallback to a basic EventTarget if `document.createElement`
                // fails. This can happen with tests that pass in a value for document
                // that is stubbed.
                return new EventTarget();
            }
        };
        this._window = document.defaultView ?? this.createEventTarget();
        this.eventTarget = this.createEventTarget();
        // First entry.
        this.setInitialEntryForTesting(startURL);
    }
    /**
     * Sets the initial entry.
     */
    setInitialEntryForTesting(url, options = { historyState: null }) {
        if (!this.canSetInitialEntry) {
            throw new Error('setInitialEntryForTesting can only be called before any ' + 'navigation has occurred');
        }
        const currentInitialEntry = this.entriesArr[0];
        this.entriesArr[0] = new FakeNavigationHistoryEntry(this.eventTarget, new URL(url).toString(), {
            index: 0,
            key: currentInitialEntry?.key ?? String(this.nextKey++),
            id: currentInitialEntry?.id ?? String(this.nextId++),
            sameDocument: true,
            historyState: options?.historyState,
            state: options.state,
        });
    }
    /** Returns whether the initial entry is still eligible to be set. */
    canSetInitialEntryForTesting() {
        return this.canSetInitialEntry;
    }
    /**
     * Sets whether to emulate traversals as synchronous rather than
     * asynchronous.
     */
    setSynchronousTraversalsForTesting(synchronousTraversals) {
        this.synchronousTraversals = synchronousTraversals;
    }
    /** Equivalent to `navigation.entries()`. */
    entries() {
        return this.entriesArr.slice();
    }
    /** Equivalent to `navigation.navigate()`. */
    navigate(url, options) {
        const fromUrl = new URL(this.currentEntry.url);
        const toUrl = new URL(url, this.currentEntry.url);
        let navigationType;
        if (!options?.history || options.history === 'auto') {
            // Auto defaults to push, but if the URLs are the same, is a replace.
            if (fromUrl.toString() === toUrl.toString()) {
                navigationType = 'replace';
            }
            else {
                navigationType = 'push';
            }
        }
        else {
            navigationType = options.history;
        }
        const hashChange = isHashChange(fromUrl, toUrl);
        const destination = new FakeNavigationDestination({
            url: toUrl.toString(),
            state: options?.state,
            sameDocument: hashChange,
            historyState: null,
        });
        const result = new InternalNavigationResult(this);
        const intercepted = this.userAgentNavigate(destination, result, {
            navigationType,
            cancelable: true,
            canIntercept: true,
            // Always false for navigate().
            userInitiated: false,
            hashChange,
            info: options?.info,
        });
        if (!intercepted) {
            this.updateNavigationEntriesForSameDocumentNavigation(this.navigateEvent);
        }
        return {
            committed: result.committed,
            finished: result.finished,
        };
    }
    /** Equivalent to `history.pushState()`. */
    pushState(data, title, url) {
        this.pushOrReplaceState('push', data, title, url);
    }
    /** Equivalent to `history.replaceState()`. */
    replaceState(data, title, url) {
        this.pushOrReplaceState('replace', data, title, url);
    }
    pushOrReplaceState(navigationType, data, _title, url) {
        const fromUrl = new URL(this.currentEntry.url);
        const toUrl = url ? new URL(url, this.currentEntry.url) : fromUrl;
        const hashChange = isHashChange(fromUrl, toUrl);
        const destination = new FakeNavigationDestination({
            url: toUrl.toString(),
            sameDocument: true, // history.pushState/replaceState are always same-document
            historyState: data,
            state: undefined, // No Navigation API state directly from history.pushState
        });
        const result = new InternalNavigationResult(this);
        const intercepted = this.userAgentNavigate(destination, result, {
            navigationType,
            cancelable: true,
            canIntercept: true,
            // Always false for pushState() or replaceState().
            userInitiated: false,
            hashChange,
        });
        if (intercepted) {
            return;
        }
        this.updateNavigationEntriesForSameDocumentNavigation(this.navigateEvent);
    }
    /** Equivalent to `navigation.traverseTo()`. */
    traverseTo(key, options) {
        const fromUrl = new URL(this.currentEntry.url);
        const entry = this.findEntry(key);
        if (!entry) {
            const domException = new DOMException('Invalid key', 'InvalidStateError');
            const committed = Promise.reject(domException);
            const finished = Promise.reject(domException);
            committed.catch(() => { });
            finished.catch(() => { });
            return {
                committed,
                finished,
            };
        }
        if (entry === this.currentEntry) {
            return {
                committed: Promise.resolve(this.currentEntry),
                finished: Promise.resolve(this.currentEntry),
            };
        }
        if (this.traversalQueue.has(entry.key)) {
            const existingResult = this.traversalQueue.get(entry.key);
            return {
                committed: existingResult.committed,
                finished: existingResult.finished,
            };
        }
        const hashChange = isHashChange(fromUrl, new URL(entry.url, this.currentEntry.url));
        const destination = new FakeNavigationDestination({
            url: entry.url,
            state: entry.getState(),
            historyState: entry.getHistoryState(),
            key: entry.key,
            id: entry.id,
            index: entry.index,
            sameDocument: entry.sameDocument,
        });
        this.prospectiveEntryIndex = entry.index;
        const result = new InternalNavigationResult(this);
        this.traversalQueue.set(entry.key, result);
        this.runTraversal(() => {
            this.traversalQueue.delete(entry.key);
            const intercepted = this.userAgentNavigate(destination, result, {
                navigationType: 'traverse',
                cancelable: true,
                canIntercept: true,
                // Always false for traverseTo().
                userInitiated: false,
                hashChange,
                info: options?.info,
            });
            if (!intercepted) {
                this.userAgentTraverse(this.navigateEvent);
            }
        });
        return {
            committed: result.committed,
            finished: result.finished,
        };
    }
    /** Equivalent to `navigation.back()`. */
    back(options) {
        if (this.currentEntryIndex === 0) {
            const domException = new DOMException('Cannot go back', 'InvalidStateError');
            const committed = Promise.reject(domException);
            const finished = Promise.reject(domException);
            committed.catch(() => { });
            finished.catch(() => { });
            return {
                committed,
                finished,
            };
        }
        const entry = this.entriesArr[this.currentEntryIndex - 1];
        return this.traverseTo(entry.key, options);
    }
    /** Equivalent to `navigation.forward()`. */
    forward(options) {
        if (this.currentEntryIndex === this.entriesArr.length - 1) {
            const domException = new DOMException('Cannot go forward', 'InvalidStateError');
            const committed = Promise.reject(domException);
            const finished = Promise.reject(domException);
            committed.catch(() => { });
            finished.catch(() => { });
            return {
                committed,
                finished,
            };
        }
        const entry = this.entriesArr[this.currentEntryIndex + 1];
        return this.traverseTo(entry.key, options);
    }
    /**
     * Equivalent to `history.go()`.
     * Note that this method does not actually work precisely to how Chrome
     * does, instead choosing a simpler model with less unexpected behavior.
     * Chrome has a few edge case optimizations, for instance with repeated
     * `back(); forward()` chains it collapses certain traversals.
     */
    go(direction) {
        const targetIndex = this.prospectiveEntryIndex + direction;
        if (targetIndex >= this.entriesArr.length || targetIndex < 0) {
            return;
        }
        this.prospectiveEntryIndex = targetIndex;
        this.runTraversal(() => {
            // Check again that destination is in the entries array.
            if (targetIndex >= this.entriesArr.length || targetIndex < 0) {
                return;
            }
            const fromUrl = new URL(this.currentEntry.url);
            const entry = this.entriesArr[targetIndex];
            const hashChange = isHashChange(fromUrl, new URL(entry.url, this.currentEntry.url));
            const destination = new FakeNavigationDestination({
                url: entry.url,
                state: entry.getState(),
                historyState: entry.getHistoryState(),
                key: entry.key,
                id: entry.id,
                index: entry.index,
                sameDocument: entry.sameDocument,
            });
            const result = new InternalNavigationResult(this);
            const intercepted = this.userAgentNavigate(destination, result, {
                navigationType: 'traverse',
                cancelable: true,
                canIntercept: true,
                // Always false for go().
                userInitiated: false,
                hashChange,
            });
            if (!intercepted) {
                this.userAgentTraverse(this.navigateEvent);
            }
        });
    }
    /** Runs a traversal synchronously or asynchronously */
    runTraversal(traversal) {
        if (this.synchronousTraversals) {
            traversal();
            return;
        }
        // Each traversal occupies a single timeout resolution.
        // This means that Promises added to commit and finish should resolve
        // before the next traversal.
        this.nextTraversal = this.nextTraversal.then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                    traversal();
                });
            });
        });
    }
    /** Equivalent to `navigation.addEventListener()`. */
    addEventListener(type, callback, options) {
        this.eventTarget.addEventListener(type, callback, options);
    }
    /** Equivalent to `navigation.removeEventListener()`. */
    removeEventListener(type, callback, options) {
        this.eventTarget.removeEventListener(type, callback, options);
    }
    /** Equivalent to `navigation.dispatchEvent()` */
    dispatchEvent(event) {
        return this.eventTarget.dispatchEvent(event);
    }
    /** Cleans up resources. */
    dispose() {
        // Recreate eventTarget to release current listeners.
        this.eventTarget = this.createEventTarget();
        this.disposed = true;
    }
    /** Returns whether this fake is disposed. */
    isDisposed() {
        return this.disposed;
    }
    abortOngoingNavigation(eventToAbort, reason) {
        if (this.navigateEvent !== eventToAbort) {
            return;
        }
        if (this.navigateEvent.abortController.signal.aborted) {
            return;
        }
        const abortReason = reason ?? new DOMException('Navigation aborted', 'AbortError');
        this.navigateEvent.cancel(abortReason);
    }
    /**
     * Implementation for all navigations and traversals.
     * @returns true if the event was intercepted, otherwise false
     */
    userAgentNavigate(destination, result, options) {
        // The first navigation should disallow any future calls to set the initial
        // entry.
        this.canSetInitialEntry = false;
        if (this.navigateEvent) {
            this.abortOngoingNavigation(this.navigateEvent, new DOMException('Navigation superseded by a new navigation.', 'AbortError'));
        }
        // TODO(atscott): Disposing doesn't really do much because new requests are still processed
        // if (this.disposed) {
        //   return false;
        // }
        const dispatchResultIsTrueIfNoInterception = dispatchNavigateEvent({
            navigationType: options.navigationType,
            cancelable: options.cancelable,
            canIntercept: options.canIntercept,
            userInitiated: options.userInitiated,
            hashChange: options.hashChange,
            destination,
            info: options.info,
            sameDocument: destination.sameDocument,
            result,
        });
        return !dispatchResultIsTrueIfNoInterception;
    }
    /**
     * Implementation for a push or replace navigation.
     * https://whatpr.org/html/10919/browsing-the-web.html#url-and-history-update-steps
     * https://whatpr.org/html/10919/nav-history-apis.html#update-the-navigation-api-entries-for-a-same-document-navigation
     * @internal
     */
    urlAndHistoryUpdateSteps(navigateEvent) {
        this.updateNavigationEntriesForSameDocumentNavigation(navigateEvent);
    }
    /**
     * Implementation for a traverse navigation.
     *
     * https://whatpr.org/html/10919/browsing-the-web.html#apply-the-traverse-history-step
     * ...
     * > Let updateDocument be an algorithm step which performs update document for history step application given targetEntry's document, targetEntry, changingNavigableContinuation's update-only, scriptHistoryLength, scriptHistoryIndex, navigationType, entriesForNavigationAPI, and previousEntry.
     * > If targetEntry's document is equal to displayedDocument, then perform updateDocument.
     * https://whatpr.org/html/10919/browsing-the-web.html#update-document-for-history-step-application
     * which then goes to https://whatpr.org/html/10919/nav-history-apis.html#update-the-navigation-api-entries-for-a-same-document-navigation
     * @internal
     */
    userAgentTraverse(navigateEvent) {
        const oldUrl = this.currentEntry.url;
        this.updateNavigationEntriesForSameDocumentNavigation(navigateEvent);
        // Happens as part of "updating the document" steps https://whatpr.org/html/10919/browsing-the-web.html#updating-the-document
        const popStateEvent = createPopStateEvent({
            state: navigateEvent.destination.getHistoryState(),
        });
        this._window.dispatchEvent(popStateEvent);
        if (navigateEvent.hashChange) {
            const hashchangeEvent = createHashChangeEvent(oldUrl, this.currentEntry.url);
            this._window.dispatchEvent(hashchangeEvent);
        }
    }
    /**
     * https://whatpr.org/html/10919/nav-history-apis.html#update-the-navigation-api-entries-for-a-same-document-navigation
     * @internal
     */
    updateNavigationEntriesForSameDocumentNavigation({ destination, navigationType, result, }) {
        const oldCurrentNHE = this.currentEntry;
        const disposedNHEs = [];
        if (navigationType === 'traverse') {
            this.currentEntryIndex = destination.index;
            if (this.currentEntryIndex === -1) {
                throw new Error('unexpected current entry index');
            }
        }
        else if (navigationType === 'push') {
            this.currentEntryIndex++;
            this.prospectiveEntryIndex = this.currentEntryIndex; // prospectiveEntryIndex isn't in the spec but is an implementation detail
            disposedNHEs.push(...this.entriesArr.splice(this.currentEntryIndex));
        }
        else if (navigationType === 'replace') {
            disposedNHEs.push(oldCurrentNHE);
        }
        if (navigationType === 'push' || navigationType === 'replace') {
            const index = this.currentEntryIndex;
            const key = navigationType === 'push'
                ? String(this.nextKey++)
                : (oldCurrentNHE?.key ?? String(this.nextKey++));
            const newNHE = new FakeNavigationHistoryEntry(this.eventTarget, destination.url, {
                id: String(this.nextId++),
                key,
                index,
                sameDocument: true,
                state: destination.getState(),
                historyState: destination.getHistoryState(),
            });
            this.entriesArr[this.currentEntryIndex] = newNHE;
        }
        result.committedResolve(this.currentEntry);
        const currentEntryChangeEvent = createFakeNavigationCurrentEntryChangeEvent({
            from: oldCurrentNHE,
            navigationType: navigationType,
        });
        this.eventTarget.dispatchEvent(currentEntryChangeEvent);
        for (const disposedNHE of disposedNHEs) {
            disposedNHE.dispose();
        }
    }
    /** Utility method for finding entries with the given `key`. */
    findEntry(key) {
        for (const entry of this.entriesArr) {
            if (entry.key === key)
                return entry;
        }
        return undefined;
    }
    set onnavigate(
    // tslint:disable-next-line:no-any
    _handler) {
        throw new Error('unimplemented');
    }
    // tslint:disable-next-line:no-any
    get onnavigate() {
        throw new Error('unimplemented');
    }
    set oncurrententrychange(_handler) {
        throw new Error('unimplemented');
    }
    get oncurrententrychange() {
        throw new Error('unimplemented');
    }
    set onnavigatesuccess(
    // tslint:disable-next-line:no-any
    _handler) {
        throw new Error('unimplemented');
    }
    // tslint:disable-next-line:no-any
    get onnavigatesuccess() {
        throw new Error('unimplemented');
    }
    set onnavigateerror(
    // tslint:disable-next-line:no-any
    _handler) {
        throw new Error('unimplemented');
    }
    // tslint:disable-next-line:no-any
    get onnavigateerror() {
        throw new Error('unimplemented');
    }
    _transition = null;
    /** @internal */
    set transition(t) {
        this._transition = t;
    }
    get transition() {
        return this._transition;
    }
    updateCurrentEntry(_options) {
        throw new Error('unimplemented');
    }
    reload(_options) {
        throw new Error('unimplemented');
    }
}
/**
 * Fake equivalent of `NavigationHistoryEntry`.
 */
class FakeNavigationHistoryEntry {
    eventTarget;
    url;
    sameDocument;
    id;
    key;
    index;
    state;
    historyState;
    // tslint:disable-next-line:no-any
    ondispose = null;
    constructor(eventTarget, url, { id, key, index, sameDocument, state, historyState, }) {
        this.eventTarget = eventTarget;
        this.url = url;
        this.id = id;
        this.key = key;
        this.index = index;
        this.sameDocument = sameDocument;
        this.state = state;
        this.historyState = historyState;
    }
    getState() {
        // Budget copy.
        return this.state ? JSON.parse(JSON.stringify(this.state)) : this.state;
    }
    getHistoryState() {
        // Budget copy.
        return this.historyState
            ? JSON.parse(JSON.stringify(this.historyState))
            : this.historyState;
    }
    addEventListener(type, callback, options) {
        this.eventTarget.addEventListener(type, callback, options);
    }
    removeEventListener(type, callback, options) {
        this.eventTarget.removeEventListener(type, callback, options);
    }
    dispatchEvent(event) {
        return this.eventTarget.dispatchEvent(event);
    }
    /** internal */
    dispose() {
        const disposeEvent = new Event('disposed');
        this.dispatchEvent(disposeEvent);
        // release current listeners
        this.eventTarget = null;
    }
}
/**
 * Create a fake equivalent of `NavigateEvent`. This is not a class because ES5
 * transpiled JavaScript cannot extend native Event.
 *
 * https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigate-event-firing
 */
function dispatchNavigateEvent({ cancelable, canIntercept, userInitiated, hashChange, navigationType, destination, info, sameDocument, result, }) {
    const { navigation } = result;
    const eventAbortController = new AbortController();
    const event = new Event('navigate', { bubbles: false, cancelable });
    event.navigationType = navigationType;
    event.destination = destination;
    event.canIntercept = canIntercept;
    event.userInitiated = userInitiated;
    event.hashChange = hashChange;
    event.signal = eventAbortController.signal;
    event.abortController = eventAbortController;
    event.info = info;
    event.focusResetBehavior = null;
    event.scrollBehavior = null;
    event.interceptionState = 'none';
    event.downloadRequest = null;
    event.formData = null;
    event.result = result;
    event.sameDocument = sameDocument;
    let precommitHandlers = [];
    let handlers = [];
    // https://whatpr.org/html/10919/nav-history-apis.html#dom-navigateevent-intercept
    event.intercept = function (options) {
        if (!this.canIntercept) {
            throw new DOMException(`Cannot intercept when canIntercept is 'false'`, 'SecurityError');
        }
        this.interceptionState = 'intercepted';
        event.sameDocument = true;
        const precommitHandler = options?.precommitHandler;
        if (precommitHandler) {
            if (!this.cancelable) {
                throw new DOMException(`Cannot use precommitHandler when cancelable is 'false'`, 'InvalidStateError');
            }
            precommitHandlers.push(precommitHandler);
        }
        if (event.interceptionState !== 'none' && event.interceptionState !== 'intercepted') {
            throw new Error('Event interceptionState should be "none" or "intercepted"');
        }
        event.interceptionState = 'intercepted';
        const handler = options?.handler;
        if (handler) {
            handlers.push(handler);
        }
        // override old options with new ones. UA _may_ report a console warning if new options differ from previous
        event.focusResetBehavior = options?.focusReset ?? event.focusResetBehavior;
        event.scrollBehavior = options?.scroll ?? event.scrollBehavior;
    };
    // https://whatpr.org/html/10919/nav-history-apis.html#dom-navigateevent-scroll
    event.scroll = function () {
        if (event.interceptionState !== 'committed') {
            throw new DOMException(`Failed to execute 'scroll' on 'NavigateEvent': scroll() must be ` +
                `called after commit() and interception options must specify manual scroll.`, 'InvalidStateError');
        }
        processScrollBehavior(event);
    };
    // https://whatpr.org/html/10919/nav-history-apis.html#dom-navigationprecommitcontroller-redirect
    function redirect(url, options = {}) {
        if (event.interceptionState === 'none') {
            throw new Error('cannot redirect when event is not intercepted');
        }
        if (event.interceptionState !== 'intercepted') {
            throw new DOMException(`cannot redirect when event is not in 'intercepted' state`, 'InvalidStateError');
        }
        if (event.navigationType !== 'push' && event.navigationType !== 'replace') {
            throw new DOMException(`cannot redirect when navigationType is not 'push' or 'replace`, 'InvalidStateError');
        }
        const destinationUrl = new URL(url, navigation.currentEntry.url);
        if (options.history === 'push' || options.history === 'replace') {
            event.navigationType = options.history;
        }
        if (options.hasOwnProperty('state')) {
            event.destination.state = options.state;
        }
        event.destination.url = destinationUrl.href;
        if (options.hasOwnProperty('info')) {
            event.info = options.info;
        }
    }
    // https://whatpr.org/html/10919/nav-history-apis.html#inner-navigate-event-firing-algorithm
    // "Let commit be the following steps:"
    function commit() {
        if (result.signal.aborted) {
            return;
        }
        navigation.transition?.committedResolve();
        if (event.interceptionState === 'intercepted') {
            event.interceptionState = 'committed';
            switch (event.navigationType) {
                case 'push':
                case 'replace': {
                    navigation.urlAndHistoryUpdateSteps(event);
                    break;
                }
                case 'reload': {
                    navigation.updateNavigationEntriesForSameDocumentNavigation(event);
                    break;
                }
                case 'traverse': {
                    navigation.userAgentTraverse(event);
                    break;
                }
            }
        }
        const promisesList = handlers.map((handler) => handler());
        if (promisesList.length === 0) {
            promisesList.push(Promise.resolve());
        }
        Promise.all(promisesList)
            .then(() => {
            // Follows steps outlined under "Wait for all of promisesList, with the following success steps:"
            // in the spec https://html.spec.whatwg.org/multipage/nav-history-apis.html#navigate-event-firing.
            if (result.signal.aborted) {
                return;
            }
            if (event !== navigation.navigateEvent) {
                if (!result.signal.aborted && result.committedTo) {
                    result.finishedReject(new DOMException('Navigation superseded before handler completion', 'AbortError'));
                }
                return;
            }
            navigation.navigateEvent = null;
            finishNavigationEvent(event, true);
            const navigatesuccessEvent = new Event('navigatesuccess', {
                bubbles: false,
                cancelable: false,
            });
            navigation.eventTarget.dispatchEvent(navigatesuccessEvent);
            result.finishedResolve();
            navigation.transition?.finishedResolve();
            navigation.transition = null;
        })
            .catch((reason) => {
            if (!event.abortController.signal.aborted) {
                event.cancel(reason);
            }
        });
    }
    // Internal only.
    // https://whatpr.org/html/10919/nav-history-apis.html#inner-navigate-event-firing-algorithm
    // "Let cancel be the following steps given reason"
    event.cancel = function (reason) {
        if (result.signal.aborted) {
            return;
        }
        this.abortController.abort(reason);
        const isCurrentGlobalNavigationEvent = this === navigation.navigateEvent;
        if (isCurrentGlobalNavigationEvent) {
            navigation.navigateEvent = null;
        }
        if (this.interceptionState !== 'intercepted' && this.interceptionState !== 'finished') {
            finishNavigationEvent(this, false);
        }
        else if (this.interceptionState === 'intercepted') {
            this.interceptionState = 'finished';
        }
        const navigateerrorEvent = new Event('navigateerror', {
            bubbles: false,
            cancelable,
        });
        navigateerrorEvent.error = reason;
        navigation.eventTarget.dispatchEvent(navigateerrorEvent);
        if (result.committedTo === null && !result.signal.aborted) {
            result.committedReject(reason);
        }
        result.finishedReject(reason);
        const transition = navigation.transition;
        transition?.committedReject(reason);
        transition?.finishedReject(reason);
        navigation.transition = null;
    };
    function dispatch() {
        navigation.navigateEvent = event;
        const dispatchResult = navigation.eventTarget.dispatchEvent(event);
        if (event.interceptionState === 'intercepted') {
            if (!navigation.currentEntry) {
                event.cancel(new DOMException('Cannot create transition without a currentEntry for intercepted navigation.', 'InvalidStateError'));
                return;
            }
            const transition = new InternalNavigationTransition(navigation.currentEntry, navigationType);
            navigation.transition = transition;
            // Mark transition.finished as handled (Spec Step 33.4)
            transition.finished.catch(() => { });
            transition.committed.catch(() => { });
        }
        if (!dispatchResult && event.cancelable) {
            if (!event.abortController.signal.aborted) {
                event.cancel(new DOMException('Navigation prevented by event.preventDefault()', 'AbortError'));
            }
        }
        else {
            if (precommitHandlers.length === 0) {
                commit();
            }
            else {
                const precommitController = { redirect };
                const precommitPromisesList = precommitHandlers.map((handler) => {
                    let p;
                    try {
                        p = handler(precommitController);
                    }
                    catch (e) {
                        p = Promise.reject(e);
                    }
                    p.catch(() => { });
                    return p;
                });
                Promise.all(precommitPromisesList)
                    .then(() => commit())
                    .catch((reason) => {
                    if (event.abortController.signal.aborted) {
                        return;
                    }
                    if (navigation.transition) {
                        navigation.transition.committedReject(reason);
                    }
                    event.cancel(reason);
                });
            }
        }
    }
    dispatch();
    return event.interceptionState === 'none';
}
/** https://whatpr.org/html/10919/nav-history-apis.html#navigateevent-finish */
function finishNavigationEvent(event, didFulfill) {
    if (event.interceptionState === 'finished') {
        throw new Error('Attempting to finish navigation event that was already finished');
    }
    if (event.interceptionState === 'intercepted') {
        if (didFulfill === true) {
            throw new Error('didFulfill should be false');
        }
        event.interceptionState = 'finished';
        return;
    }
    if (event.interceptionState === 'none') {
        return;
    }
    potentiallyResetFocus(event);
    if (didFulfill) {
        potentiallyResetScroll(event);
    }
    event.interceptionState = 'finished';
}
/** https://whatpr.org/html/10919/nav-history-apis.html#potentially-reset-the-focus */
function potentiallyResetFocus(event) {
    if (event.interceptionState !== 'committed' && event.interceptionState !== 'scrolled') {
        throw new Error('cannot reset focus if navigation event is not committed or scrolled');
    }
    if (event.focusResetBehavior === 'manual') {
        return;
    }
    // TODO(atscott): the rest of the steps
}
function potentiallyResetScroll(event) {
    if (event.interceptionState !== 'committed' && event.interceptionState !== 'scrolled') {
        throw new Error('cannot reset scroll if navigation event is not committed or scrolled');
    }
    if (event.interceptionState === 'scrolled' || event.scrollBehavior === 'manual') {
        return;
    }
    processScrollBehavior(event);
}
/* https://whatpr.org/html/10919/nav-history-apis.html#process-scroll-behavior */
function processScrollBehavior(event) {
    if (event.interceptionState !== 'committed') {
        throw new Error('invalid event interception state when processing scroll behavior');
    }
    event.interceptionState = 'scrolled';
    // TODO(atscott): the rest of the steps
}
/**
 * Create a fake equivalent of `NavigationCurrentEntryChange`. This does not use
 * a class because ES5 transpiled JavaScript cannot extend native Event.
 */
function createFakeNavigationCurrentEntryChangeEvent({ from, navigationType, }) {
    const event = new Event('currententrychange', {
        bubbles: false,
        cancelable: false,
    });
    event.from = from;
    event.navigationType = navigationType;
    return event;
}
/**
 * Create a fake equivalent of `PopStateEvent`. This does not use a class
 * because ES5 transpiled JavaScript cannot extend native Event.
 */
function createPopStateEvent({ state }) {
    const event = new Event('popstate', {
        bubbles: false,
        cancelable: false,
    });
    event.state = state;
    return event;
}
function createHashChangeEvent(newURL, oldURL) {
    const event = new Event('hashchange', {
        bubbles: false,
        cancelable: false,
    });
    event.newURL = newURL;
    event.oldURL = oldURL;
    return event;
}
/**
 * Fake equivalent of `NavigationDestination`.
 */
class FakeNavigationDestination {
    url;
    sameDocument;
    key;
    id;
    index;
    state;
    historyState;
    constructor({ url, sameDocument, historyState, state, key = null, id = null, index = -1, }) {
        this.url = url;
        this.sameDocument = sameDocument;
        this.state = state;
        this.historyState = historyState;
        this.key = key;
        this.id = id;
        this.index = index;
    }
    getState() {
        return this.state;
    }
    getHistoryState() {
        return this.historyState;
    }
}
/** Utility function to determine whether two UrlLike have the same hash. */
function isHashChange(from, to) {
    return (to.hash !== from.hash &&
        to.hostname === from.hostname &&
        to.pathname === from.pathname &&
        to.search === from.search);
}
class InternalNavigationTransition {
    from;
    navigationType;
    finished;
    committed;
    finishedResolve;
    finishedReject;
    committedResolve;
    committedReject;
    constructor(from, navigationType) {
        this.from = from;
        this.navigationType = navigationType;
        this.finished = new Promise((resolve, reject) => {
            this.finishedReject = reject;
            this.finishedResolve = resolve;
        });
        this.committed = new Promise((resolve, reject) => {
            this.committedReject = reject;
            this.committedResolve = resolve;
        });
        // All rejections are handled.
        this.finished.catch(() => { });
        this.committed.catch(() => { });
    }
}
/**
 * Internal utility class for representing the result of a navigation.
 * Generally equivalent to the "apiMethodTracker" in the spec.
 */
class InternalNavigationResult {
    navigation;
    committedTo = null;
    committedResolve;
    committedReject;
    finishedResolve;
    finishedReject;
    committed;
    finished;
    get signal() {
        return this.abortController.signal;
    }
    abortController = new AbortController();
    constructor(navigation) {
        this.navigation = navigation;
        this.committed = new Promise((resolve, reject) => {
            this.committedResolve = (entry) => {
                this.committedTo = entry;
                resolve(entry);
            };
            this.committedReject = reject;
        });
        this.finished = new Promise((resolve, reject) => {
            this.finishedResolve = () => {
                if (this.committedTo === null) {
                    throw new Error('NavigateEvent should have been committed before resolving finished promise.');
                }
                resolve(this.committedTo);
            };
            this.finishedReject = (reason) => {
                reject(reason);
                this.abortController.abort(reason);
            };
        });
        // All rejections are handled.
        this.committed.catch(() => { });
        this.finished.catch(() => { });
    }
}

/**
 * Public Test Library for unit testing Angular applications. Assumes that you are running
 * with Jasmine, Mocha, or a similar framework which exports a beforeEach function and
 * allows tests to be asynchronous by either returning a promise or using a 'done' parameter.
 */
// Reset the test providers and the fake async zone before each test.
// We keep a guard because somehow this file can make it into a bundle and be executed
// beforeEach is only defined when executing the tests
globalThis.beforeEach?.(getCleanupHook(false));
// We provide both a `beforeEach` and `afterEach`, because the updated behavior for
// tearing down the module is supposed to run after the test so that we can associate
// teardown errors with the correct test.
// We keep a guard because somehow this file can make it into a bundle and be executed
// afterEach is only defined when executing the tests
globalThis.afterEach?.(getCleanupHook(true));
function getCleanupHook(expectedTeardownValue) {
    return () => {
        const testBed = TestBedImpl.INSTANCE;
        if (testBed.shouldTearDownTestingModule() === expectedTeardownValue) {
            testBed.resetTestingModule();
            resetFakeAsyncZoneIfExists();
        }
    };
}

class Log {
    logItems;
    constructor() {
        this.logItems = [];
    }
    add(value) {
        this.logItems.push(value);
    }
    fn(value) {
        return () => {
            this.logItems.push(value);
        };
    }
    clear() {
        this.logItems = [];
    }
    result() {
        return this.logItems.join('; ');
    }
    static ɵfac = function Log_Factory(__ngFactoryType__) { return new (__ngFactoryType__ || Log)(); };
    static ɵprov = /*@__PURE__*/ i0.ɵɵdefineInjectable({ token: Log, factory: Log.ɵfac });
}
(() => { (typeof ngDevMode === "undefined" || ngDevMode) && i0.ɵsetClassMetadata(Log, [{
        type: Injectable
    }], () => [], null); })();

export { ComponentFixture, ComponentFixtureAutoDetect, ComponentFixtureNoNgZone, DeferBlockBehavior, DeferBlockFixture, DeferBlockState, InjectSetupWrapper, TestBed, TestComponentRenderer, discardPeriodicTasks, fakeAsync, flush, flushMicrotasks, getTestBed, inject, resetFakeAsyncZone, tick, waitForAsync, withModule, FakeNavigation as ɵFakeNavigation, Log as ɵLog, MetadataOverrider as ɵMetadataOverrider, getCleanupHook as ɵgetCleanupHook };
//# sourceMappingURL=testing.mjs.map
