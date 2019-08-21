/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,constantProperty,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, SimpleChange, WrappedValue } from '../change_detection/change_detection';
import { INJECTOR, Injector, resolveForwardRef } from '../di';
import { ElementRef } from '../linker/element_ref';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { Renderer as RendererV1, Renderer2 } from '../render/api';
import { isObservable } from '../util/lang';
import { stringify } from '../util/stringify';
import { createChangeDetectorRef, createInjector, createRendererV1 } from './refs';
import { Services, asElementData, asProviderData, shouldCallLifecycleInitHook } from './types';
import { calcBindingFlags, checkBinding, dispatchEvent, isComponentView, splitDepsDsl, splitMatchedQueriesDsl, tokenKey, viewParentEl } from './util';
/** @type {?} */
const RendererV1TokenKey = tokenKey(RendererV1);
/** @type {?} */
const Renderer2TokenKey = tokenKey(Renderer2);
/** @type {?} */
const ElementRefTokenKey = tokenKey(ElementRef);
/** @type {?} */
const ViewContainerRefTokenKey = tokenKey(ViewContainerRef);
/** @type {?} */
const TemplateRefTokenKey = tokenKey(TemplateRef);
/** @type {?} */
const ChangeDetectorRefTokenKey = tokenKey(ChangeDetectorRef);
/** @type {?} */
const InjectorRefTokenKey = tokenKey(Injector);
/** @type {?} */
const INJECTORRefTokenKey = tokenKey(INJECTOR);
/**
 * @param {?} checkIndex
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} childCount
 * @param {?} ctor
 * @param {?} deps
 * @param {?=} props
 * @param {?=} outputs
 * @return {?}
 */
export function directiveDef(checkIndex, flags, matchedQueries, childCount, ctor, deps, props, outputs) {
    /** @type {?} */
    const bindings = [];
    if (props) {
        for (let prop in props) {
            const [bindingIndex, nonMinifiedName] = props[prop];
            bindings[bindingIndex] = {
                flags: 8 /* TypeProperty */,
                name: prop, nonMinifiedName,
                ns: null,
                securityContext: null,
                suffix: null
            };
        }
    }
    /** @type {?} */
    const outputDefs = [];
    if (outputs) {
        for (let propName in outputs) {
            outputDefs.push({ type: 1 /* DirectiveOutput */, propName, target: null, eventName: outputs[propName] });
        }
    }
    flags |= 16384 /* TypeDirective */;
    return _def(checkIndex, flags, matchedQueries, childCount, ctor, ctor, deps, bindings, outputDefs);
}
/**
 * @param {?} flags
 * @param {?} ctor
 * @param {?} deps
 * @return {?}
 */
export function pipeDef(flags, ctor, deps) {
    flags |= 16 /* TypePipe */;
    return _def(-1, flags, null, 0, ctor, ctor, deps);
}
/**
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @return {?}
 */
export function providerDef(flags, matchedQueries, token, value, deps) {
    return _def(-1, flags, matchedQueries, 0, token, value, deps);
}
/**
 * @param {?} checkIndex
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} childCount
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @param {?=} bindings
 * @param {?=} outputs
 * @return {?}
 */
export function _def(checkIndex, flags, matchedQueriesDsl, childCount, token, value, deps, bindings, outputs) {
    const { matchedQueries, references, matchedQueryIds } = splitMatchedQueriesDsl(matchedQueriesDsl);
    if (!outputs) {
        outputs = [];
    }
    if (!bindings) {
        bindings = [];
    }
    // Need to resolve forwardRefs as e.g. for `useValue` we
    // lowered the expression and then stopped evaluating it,
    // i.e. also didn't unwrap it.
    value = resolveForwardRef(value);
    /** @type {?} */
    const depDefs = splitDepsDsl(deps, stringify(token));
    return {
        // will bet set by the view definition
        nodeIndex: -1,
        parent: null,
        renderParent: null,
        bindingIndex: -1,
        outputIndex: -1,
        // regular values
        checkIndex,
        flags,
        childFlags: 0,
        directChildFlags: 0,
        childMatchedQueries: 0, matchedQueries, matchedQueryIds, references,
        ngContentIndex: -1, childCount, bindings,
        bindingFlags: calcBindingFlags(bindings), outputs,
        element: null,
        provider: { token, value, deps: depDefs },
        text: null,
        query: null,
        ngContent: null
    };
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createProviderInstance(view, def) {
    return _createProviderInstance(view, def);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createPipeInstance(view, def) {
    // deps are looked up from component.
    /** @type {?} */
    let compView = view;
    while (compView.parent && !isComponentView(compView)) {
        compView = compView.parent;
    }
    // pipes can see the private services of the component
    /** @type {?} */
    const allowPrivateServices = true;
    // pipes are always eager and classes!
    return createClass((/** @type {?} */ (compView.parent)), (/** @type {?} */ (viewParentEl(compView))), allowPrivateServices, (/** @type {?} */ (def.provider)).value, (/** @type {?} */ (def.provider)).deps);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createDirectiveInstance(view, def) {
    // components can see other private services, other directives can't.
    /** @type {?} */
    const allowPrivateServices = (def.flags & 32768 /* Component */) > 0;
    // directives are always eager and classes!
    /** @type {?} */
    const instance = createClass(view, (/** @type {?} */ (def.parent)), allowPrivateServices, (/** @type {?} */ (def.provider)).value, (/** @type {?} */ (def.provider)).deps);
    if (def.outputs.length) {
        for (let i = 0; i < def.outputs.length; i++) {
            /** @type {?} */
            const output = def.outputs[i];
            /** @type {?} */
            const outputObservable = instance[(/** @type {?} */ (output.propName))];
            if (isObservable(outputObservable)) {
                /** @type {?} */
                const subscription = outputObservable.subscribe(eventHandlerClosure(view, (/** @type {?} */ (def.parent)).nodeIndex, output.eventName));
                (/** @type {?} */ (view.disposables))[def.outputIndex + i] = subscription.unsubscribe.bind(subscription);
            }
            else {
                throw new Error(`@Output ${output.propName} not initialized in '${instance.constructor.name}'.`);
            }
        }
    }
    return instance;
}
/**
 * @param {?} view
 * @param {?} index
 * @param {?} eventName
 * @return {?}
 */
function eventHandlerClosure(view, index, eventName) {
    return (/**
     * @param {?} event
     * @return {?}
     */
    (event) => dispatchEvent(view, index, eventName, event));
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} v0
 * @param {?} v1
 * @param {?} v2
 * @param {?} v3
 * @param {?} v4
 * @param {?} v5
 * @param {?} v6
 * @param {?} v7
 * @param {?} v8
 * @param {?} v9
 * @return {?}
 */
export function checkAndUpdateDirectiveInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    /** @type {?} */
    const providerData = asProviderData(view, def.nodeIndex);
    /** @type {?} */
    const directive = providerData.instance;
    /** @type {?} */
    let changed = false;
    /** @type {?} */
    let changes = (/** @type {?} */ (undefined));
    /** @type {?} */
    const bindLen = def.bindings.length;
    if (bindLen > 0 && checkBinding(view, def, 0, v0)) {
        changed = true;
        changes = updateProp(view, providerData, def, 0, v0, changes);
    }
    if (bindLen > 1 && checkBinding(view, def, 1, v1)) {
        changed = true;
        changes = updateProp(view, providerData, def, 1, v1, changes);
    }
    if (bindLen > 2 && checkBinding(view, def, 2, v2)) {
        changed = true;
        changes = updateProp(view, providerData, def, 2, v2, changes);
    }
    if (bindLen > 3 && checkBinding(view, def, 3, v3)) {
        changed = true;
        changes = updateProp(view, providerData, def, 3, v3, changes);
    }
    if (bindLen > 4 && checkBinding(view, def, 4, v4)) {
        changed = true;
        changes = updateProp(view, providerData, def, 4, v4, changes);
    }
    if (bindLen > 5 && checkBinding(view, def, 5, v5)) {
        changed = true;
        changes = updateProp(view, providerData, def, 5, v5, changes);
    }
    if (bindLen > 6 && checkBinding(view, def, 6, v6)) {
        changed = true;
        changes = updateProp(view, providerData, def, 6, v6, changes);
    }
    if (bindLen > 7 && checkBinding(view, def, 7, v7)) {
        changed = true;
        changes = updateProp(view, providerData, def, 7, v7, changes);
    }
    if (bindLen > 8 && checkBinding(view, def, 8, v8)) {
        changed = true;
        changes = updateProp(view, providerData, def, 8, v8, changes);
    }
    if (bindLen > 9 && checkBinding(view, def, 9, v9)) {
        changed = true;
        changes = updateProp(view, providerData, def, 9, v9, changes);
    }
    if (changes) {
        directive.ngOnChanges(changes);
    }
    if ((def.flags & 65536 /* OnInit */) &&
        shouldCallLifecycleInitHook(view, 256 /* InitState_CallingOnInit */, def.nodeIndex)) {
        directive.ngOnInit();
    }
    if (def.flags & 262144 /* DoCheck */) {
        directive.ngDoCheck();
    }
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateDirectiveDynamic(view, def, values) {
    /** @type {?} */
    const providerData = asProviderData(view, def.nodeIndex);
    /** @type {?} */
    const directive = providerData.instance;
    /** @type {?} */
    let changed = false;
    /** @type {?} */
    let changes = (/** @type {?} */ (undefined));
    for (let i = 0; i < values.length; i++) {
        if (checkBinding(view, def, i, values[i])) {
            changed = true;
            changes = updateProp(view, providerData, def, i, values[i], changes);
        }
    }
    if (changes) {
        directive.ngOnChanges(changes);
    }
    if ((def.flags & 65536 /* OnInit */) &&
        shouldCallLifecycleInitHook(view, 256 /* InitState_CallingOnInit */, def.nodeIndex)) {
        directive.ngOnInit();
    }
    if (def.flags & 262144 /* DoCheck */) {
        directive.ngDoCheck();
    }
    return changed;
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
function _createProviderInstance(view, def) {
    // private services can see other private services
    /** @type {?} */
    const allowPrivateServices = (def.flags & 8192 /* PrivateProvider */) > 0;
    /** @type {?} */
    const providerDef = def.provider;
    switch (def.flags & 201347067 /* Types */) {
        case 512 /* TypeClassProvider */:
            return createClass(view, (/** @type {?} */ (def.parent)), allowPrivateServices, (/** @type {?} */ (providerDef)).value, (/** @type {?} */ (providerDef)).deps);
        case 1024 /* TypeFactoryProvider */:
            return callFactory(view, (/** @type {?} */ (def.parent)), allowPrivateServices, (/** @type {?} */ (providerDef)).value, (/** @type {?} */ (providerDef)).deps);
        case 2048 /* TypeUseExistingProvider */:
            return resolveDep(view, (/** @type {?} */ (def.parent)), allowPrivateServices, (/** @type {?} */ (providerDef)).deps[0]);
        case 256 /* TypeValueProvider */:
            return (/** @type {?} */ (providerDef)).value;
    }
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @param {?} ctor
 * @param {?} deps
 * @return {?}
 */
function createClass(view, elDef, allowPrivateServices, ctor, deps) {
    /** @type {?} */
    const len = deps.length;
    switch (len) {
        case 0:
            return new ctor();
        case 1:
            return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]));
        case 2:
            return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
        case 3:
            return new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
        default:
            /** @type {?} */
            const depValues = [];
            for (let i = 0; i < len; i++) {
                depValues.push(resolveDep(view, elDef, allowPrivateServices, deps[i]));
            }
            return new ctor(...depValues);
    }
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @param {?} factory
 * @param {?} deps
 * @return {?}
 */
function callFactory(view, elDef, allowPrivateServices, factory, deps) {
    /** @type {?} */
    const len = deps.length;
    switch (len) {
        case 0:
            return factory();
        case 1:
            return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]));
        case 2:
            return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
        case 3:
            return factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
        default:
            /** @type {?} */
            const depValues = [];
            for (let i = 0; i < len; i++) {
                depValues.push(resolveDep(view, elDef, allowPrivateServices, deps[i]));
            }
            return factory(...depValues);
    }
}
// This default value is when checking the hierarchy for a token.
//
// It means both:
// - the token is not provided by the current injector,
// - only the element injectors should be checked (ie do not check module injectors
//
//          mod1
//         /
//       el1   mod2
//         \  /
//         el2
//
// When requesting el2.injector.get(token), we should check in the following order and return the
// first found value:
// - el2.injector.get(token, default)
// - el1.injector.get(token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) -> do not check the module
// - mod2.injector.get(token, default)
/** @type {?} */
export const NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @param {?} depDef
 * @param {?=} notFoundValue
 * @return {?}
 */
export function resolveDep(view, elDef, allowPrivateServices, depDef, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
    if (depDef.flags & 8 /* Value */) {
        return depDef.token;
    }
    /** @type {?} */
    const startView = view;
    if (depDef.flags & 2 /* Optional */) {
        notFoundValue = null;
    }
    /** @type {?} */
    const tokenKey = depDef.tokenKey;
    if (tokenKey === ChangeDetectorRefTokenKey) {
        // directives on the same element as a component should be able to control the change detector
        // of that component as well.
        allowPrivateServices = !!(elDef && (/** @type {?} */ (elDef.element)).componentView);
    }
    if (elDef && (depDef.flags & 1 /* SkipSelf */)) {
        allowPrivateServices = false;
        elDef = (/** @type {?} */ (elDef.parent));
    }
    /** @type {?} */
    let searchView = view;
    while (searchView) {
        if (elDef) {
            switch (tokenKey) {
                case RendererV1TokenKey: {
                    /** @type {?} */
                    const compView = findCompView(searchView, elDef, allowPrivateServices);
                    return createRendererV1(compView);
                }
                case Renderer2TokenKey: {
                    /** @type {?} */
                    const compView = findCompView(searchView, elDef, allowPrivateServices);
                    return compView.renderer;
                }
                case ElementRefTokenKey:
                    return new ElementRef(asElementData(searchView, elDef.nodeIndex).renderElement);
                case ViewContainerRefTokenKey:
                    return asElementData(searchView, elDef.nodeIndex).viewContainer;
                case TemplateRefTokenKey: {
                    if ((/** @type {?} */ (elDef.element)).template) {
                        return asElementData(searchView, elDef.nodeIndex).template;
                    }
                    break;
                }
                case ChangeDetectorRefTokenKey: {
                    /** @type {?} */
                    let cdView = findCompView(searchView, elDef, allowPrivateServices);
                    return createChangeDetectorRef(cdView);
                }
                case InjectorRefTokenKey:
                case INJECTORRefTokenKey:
                    return createInjector(searchView, elDef);
                default:
                    /** @type {?} */
                    const providerDef = (/** @type {?} */ ((allowPrivateServices ? (/** @type {?} */ (elDef.element)).allProviders :
                        (/** @type {?} */ (elDef.element)).publicProviders)))[tokenKey];
                    if (providerDef) {
                        /** @type {?} */
                        let providerData = asProviderData(searchView, providerDef.nodeIndex);
                        if (!providerData) {
                            providerData = { instance: _createProviderInstance(searchView, providerDef) };
                            searchView.nodes[providerDef.nodeIndex] = (/** @type {?} */ (providerData));
                        }
                        return providerData.instance;
                    }
            }
        }
        allowPrivateServices = isComponentView(searchView);
        elDef = (/** @type {?} */ (viewParentEl(searchView)));
        searchView = (/** @type {?} */ (searchView.parent));
        if (depDef.flags & 4 /* Self */) {
            searchView = null;
        }
    }
    /** @type {?} */
    const value = startView.root.injector.get(depDef.token, NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR);
    if (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR ||
        notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR) {
        // Return the value from the root element injector when
        // - it provides it
        //   (value !== NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
        // - the module injector should not be checked
        //   (notFoundValue === NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR)
        return value;
    }
    return startView.root.ngModule.injector.get(depDef.token, notFoundValue);
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @return {?}
 */
function findCompView(view, elDef, allowPrivateServices) {
    /** @type {?} */
    let compView;
    if (allowPrivateServices) {
        compView = asElementData(view, elDef.nodeIndex).componentView;
    }
    else {
        compView = view;
        while (compView.parent && !isComponentView(compView)) {
            compView = compView.parent;
        }
    }
    return compView;
}
/**
 * @param {?} view
 * @param {?} providerData
 * @param {?} def
 * @param {?} bindingIdx
 * @param {?} value
 * @param {?} changes
 * @return {?}
 */
function updateProp(view, providerData, def, bindingIdx, value, changes) {
    if (def.flags & 32768 /* Component */) {
        /** @type {?} */
        const compView = asElementData(view, (/** @type {?} */ (def.parent)).nodeIndex).componentView;
        if (compView.def.flags & 2 /* OnPush */) {
            compView.state |= 8 /* ChecksEnabled */;
        }
    }
    /** @type {?} */
    const binding = def.bindings[bindingIdx];
    /** @type {?} */
    const propName = (/** @type {?} */ (binding.name));
    // Note: This is still safe with Closure Compiler as
    // the user passed in the property name as an object has to `providerDef`,
    // so Closure Compiler will have renamed the property correctly already.
    providerData.instance[propName] = value;
    if (def.flags & 524288 /* OnChanges */) {
        changes = changes || {};
        /** @type {?} */
        const oldValue = WrappedValue.unwrap(view.oldValues[def.bindingIndex + bindingIdx]);
        /** @type {?} */
        const binding = def.bindings[bindingIdx];
        changes[(/** @type {?} */ (binding.nonMinifiedName))] =
            new SimpleChange(oldValue, value, (view.state & 2 /* FirstCheck */) !== 0);
    }
    view.oldValues[def.bindingIndex + bindingIdx] = value;
    return changes;
}
// This function calls the ngAfterContentCheck, ngAfterContentInit,
// ngAfterViewCheck, and ngAfterViewInit lifecycle hooks (depending on the node
// flags in lifecycle). Unlike ngDoCheck, ngOnChanges and ngOnInit, which are
// called during a pre-order traversal of the view tree (that is calling the
// parent hooks before the child hooks) these events are sent in using a
// post-order traversal of the tree (children before parents). This changes the
// meaning of initIndex in the view state. For ngOnInit, initIndex tracks the
// expected nodeIndex which a ngOnInit should be called. When sending
// ngAfterContentInit and ngAfterViewInit it is the expected count of
// ngAfterContentInit or ngAfterViewInit methods that have been called. This
// ensure that despite being called recursively or after picking up after an
// exception, the ngAfterContentInit or ngAfterViewInit will be called on the
// correct nodes. Consider for example, the following (where E is an element
// and D is a directive)
//  Tree:       pre-order index  post-order index
//    E1        0                6
//      E2      1                1
//       D3     2                0
//      E4      3                5
//       E5     4                4
//        E6    5                2
//        E7    6                3
// As can be seen, the post-order index has an unclear relationship to the
// pre-order index (postOrderIndex === preOrderIndex - parentCount +
// childCount). Since number of calls to ngAfterContentInit and ngAfterViewInit
// are stable (will be the same for the same view regardless of exceptions or
// recursion) we just need to count them which will roughly correspond to the
// post-order index (it skips elements and directives that do not have
// lifecycle hooks).
//
// For example, if an exception is raised in the E6.onAfterViewInit() the
// initIndex is left at 3 (by shouldCallLifecycleInitHook() which set it to
// initIndex + 1). When checkAndUpdateView() is called again D3, E2 and E6 will
// not have their ngAfterViewInit() called but, starting with E7, the rest of
// the view will begin getting ngAfterViewInit() called until a check and
// pass is complete.
//
// This algorthim also handles recursion. Consider if E4's ngAfterViewInit()
// indirectly calls E1's ChangeDetectorRef.detectChanges(). The expected
// initIndex is set to 6, the recusive checkAndUpdateView() starts walk again.
// D3, E2, E6, E7, E5 and E4 are skipped, ngAfterViewInit() is called on E1.
// When the recursion returns the initIndex will be 7 so E1 is skipped as it
// has already been called in the recursively called checkAnUpdateView().
/**
 * @param {?} view
 * @param {?} lifecycles
 * @return {?}
 */
export function callLifecycleHooksChildrenFirst(view, lifecycles) {
    if (!(view.def.nodeFlags & lifecycles)) {
        return;
    }
    /** @type {?} */
    const nodes = view.def.nodes;
    /** @type {?} */
    let initIndex = 0;
    for (let i = 0; i < nodes.length; i++) {
        /** @type {?} */
        const nodeDef = nodes[i];
        /** @type {?} */
        let parent = nodeDef.parent;
        if (!parent && nodeDef.flags & lifecycles) {
            // matching root node (e.g. a pipe)
            callProviderLifecycles(view, i, nodeDef.flags & lifecycles, initIndex++);
        }
        if ((nodeDef.childFlags & lifecycles) === 0) {
            // no child matches one of the lifecycles
            i += nodeDef.childCount;
        }
        while (parent && (parent.flags & 1 /* TypeElement */) &&
            i === parent.nodeIndex + parent.childCount) {
            // last child of an element
            if (parent.directChildFlags & lifecycles) {
                initIndex = callElementProvidersLifecycles(view, parent, lifecycles, initIndex);
            }
            parent = parent.parent;
        }
    }
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} lifecycles
 * @param {?} initIndex
 * @return {?}
 */
function callElementProvidersLifecycles(view, elDef, lifecycles, initIndex) {
    for (let i = elDef.nodeIndex + 1; i <= elDef.nodeIndex + elDef.childCount; i++) {
        /** @type {?} */
        const nodeDef = view.def.nodes[i];
        if (nodeDef.flags & lifecycles) {
            callProviderLifecycles(view, i, nodeDef.flags & lifecycles, initIndex++);
        }
        // only visit direct children
        i += nodeDef.childCount;
    }
    return initIndex;
}
/**
 * @param {?} view
 * @param {?} index
 * @param {?} lifecycles
 * @param {?} initIndex
 * @return {?}
 */
function callProviderLifecycles(view, index, lifecycles, initIndex) {
    /** @type {?} */
    const providerData = asProviderData(view, index);
    if (!providerData) {
        return;
    }
    /** @type {?} */
    const provider = providerData.instance;
    if (!provider) {
        return;
    }
    Services.setCurrentNode(view, index);
    if (lifecycles & 1048576 /* AfterContentInit */ &&
        shouldCallLifecycleInitHook(view, 512 /* InitState_CallingAfterContentInit */, initIndex)) {
        provider.ngAfterContentInit();
    }
    if (lifecycles & 2097152 /* AfterContentChecked */) {
        provider.ngAfterContentChecked();
    }
    if (lifecycles & 4194304 /* AfterViewInit */ &&
        shouldCallLifecycleInitHook(view, 768 /* InitState_CallingAfterViewInit */, initIndex)) {
        provider.ngAfterViewInit();
    }
    if (lifecycles & 8388608 /* AfterViewChecked */) {
        provider.ngAfterViewChecked();
    }
    if (lifecycles & 131072 /* OnDestroy */) {
        provider.ngOnDestroy();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBaUIsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsUUFBUSxJQUFJLFVBQVUsRUFBRSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFDLFlBQVksRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxQyxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFDLHVCQUF1QixFQUFFLGNBQWMsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNqRixPQUFPLEVBQXNILFFBQVEsRUFBa0MsYUFBYSxFQUFFLGNBQWMsRUFBRSwyQkFBMkIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsUCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsWUFBWSxFQUFFLGFBQWEsRUFBRSxlQUFlLEVBQUUsWUFBWSxFQUFFLHNCQUFzQixFQUFFLFFBQVEsRUFBRSxZQUFZLEVBQUMsTUFBTSxRQUFRLENBQUM7O01BRTlJLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUM7O01BQ3pDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUM7O01BQ3ZDLGtC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QUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pE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QztLQUN4QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlcywgV3JhcHBlZFZhbHVlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgSW5qZWN0b3IsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge1JlbmRlcmVyIGFzIFJlbmRlcmVyVjEsIFJlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7Y3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYsIGNyZWF0ZUluamVjdG9yLCBjcmVhdGVSZW5kZXJlclYxfSBmcm9tICcuL3JlZnMnO1xuaW1wb3J0IHtCaW5kaW5nRGVmLCBCaW5kaW5nRmxhZ3MsIERlcERlZiwgRGVwRmxhZ3MsIE5vZGVEZWYsIE5vZGVGbGFncywgT3V0cHV0RGVmLCBPdXRwdXRUeXBlLCBQcm92aWRlckRhdGEsIFF1ZXJ5VmFsdWVUeXBlLCBTZXJ2aWNlcywgVmlld0RhdGEsIFZpZXdGbGFncywgVmlld1N0YXRlLCBhc0VsZW1lbnREYXRhLCBhc1Byb3ZpZGVyRGF0YSwgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y2FsY0JpbmRpbmdGbGFncywgY2hlY2tCaW5kaW5nLCBkaXNwYXRjaEV2ZW50LCBpc0NvbXBvbmVudFZpZXcsIHNwbGl0RGVwc0RzbCwgc3BsaXRNYXRjaGVkUXVlcmllc0RzbCwgdG9rZW5LZXksIHZpZXdQYXJlbnRFbH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgUmVuZGVyZXJWMVRva2VuS2V5ID0gdG9rZW5LZXkoUmVuZGVyZXJWMSk7XG5jb25zdCBSZW5kZXJlcjJUb2tlbktleSA9IHRva2VuS2V5KFJlbmRlcmVyMik7XG5jb25zdCBFbGVtZW50UmVmVG9rZW5LZXkgPSB0b2tlbktleShFbGVtZW50UmVmKTtcbmNvbnN0IFZpZXdDb250YWluZXJSZWZUb2tlbktleSA9IHRva2VuS2V5KFZpZXdDb250YWluZXJSZWYpO1xuY29uc3QgVGVtcGxhdGVSZWZUb2tlbktleSA9IHRva2VuS2V5KFRlbXBsYXRlUmVmKTtcbmNvbnN0IENoYW5nZURldGVjdG9yUmVmVG9rZW5LZXkgPSB0b2tlbktleShDaGFuZ2VEZXRlY3RvclJlZik7XG5jb25zdCBJbmplY3RvclJlZlRva2VuS2V5ID0gdG9rZW5LZXkoSW5qZWN0b3IpO1xuY29uc3QgSU5KRUNUT1JSZWZUb2tlbktleSA9IHRva2VuS2V5KElOSkVDVE9SKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZURlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIGZsYWdzOiBOb2RlRmxhZ3MsXG4gICAgbWF0Y2hlZFF1ZXJpZXM6IG51bGwgfCBbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSwgY2hpbGRDb3VudDogbnVtYmVyLCBjdG9yOiBhbnksXG4gICAgZGVwczogKFtEZXBGbGFncywgYW55XSB8IGFueSlbXSwgcHJvcHM/OiBudWxsIHwge1tuYW1lOiBzdHJpbmddOiBbbnVtYmVyLCBzdHJpbmddfSxcbiAgICBvdXRwdXRzPzogbnVsbCB8IHtbbmFtZTogc3RyaW5nXTogc3RyaW5nfSk6IE5vZGVEZWYge1xuICBjb25zdCBiaW5kaW5nczogQmluZGluZ0RlZltdID0gW107XG4gIGlmIChwcm9wcykge1xuICAgIGZvciAobGV0IHByb3AgaW4gcHJvcHMpIHtcbiAgICAgIGNvbnN0IFtiaW5kaW5nSW5kZXgsIG5vbk1pbmlmaWVkTmFtZV0gPSBwcm9wc1twcm9wXTtcbiAgICAgIGJpbmRpbmdzW2JpbmRpbmdJbmRleF0gPSB7XG4gICAgICAgIGZsYWdzOiBCaW5kaW5nRmxhZ3MuVHlwZVByb3BlcnR5LFxuICAgICAgICBuYW1lOiBwcm9wLCBub25NaW5pZmllZE5hbWUsXG4gICAgICAgIG5zOiBudWxsLFxuICAgICAgICBzZWN1cml0eUNvbnRleHQ6IG51bGwsXG4gICAgICAgIHN1ZmZpeDogbnVsbFxuICAgICAgfTtcbiAgICB9XG4gIH1cbiAgY29uc3Qgb3V0cHV0RGVmczogT3V0cHV0RGVmW10gPSBbXTtcbiAgaWYgKG91dHB1dHMpIHtcbiAgICBmb3IgKGxldCBwcm9wTmFtZSBpbiBvdXRwdXRzKSB7XG4gICAgICBvdXRwdXREZWZzLnB1c2goXG4gICAgICAgICAge3R5cGU6IE91dHB1dFR5cGUuRGlyZWN0aXZlT3V0cHV0LCBwcm9wTmFtZSwgdGFyZ2V0OiBudWxsLCBldmVudE5hbWU6IG91dHB1dHNbcHJvcE5hbWVdfSk7XG4gICAgfVxuICB9XG4gIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlRGlyZWN0aXZlO1xuICByZXR1cm4gX2RlZihcbiAgICAgIGNoZWNrSW5kZXgsIGZsYWdzLCBtYXRjaGVkUXVlcmllcywgY2hpbGRDb3VudCwgY3RvciwgY3RvciwgZGVwcywgYmluZGluZ3MsIG91dHB1dERlZnMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGlwZURlZihmbGFnczogTm9kZUZsYWdzLCBjdG9yOiBhbnksIGRlcHM6IChbRGVwRmxhZ3MsIGFueV0gfCBhbnkpW10pOiBOb2RlRGVmIHtcbiAgZmxhZ3MgfD0gTm9kZUZsYWdzLlR5cGVQaXBlO1xuICByZXR1cm4gX2RlZigtMSwgZmxhZ3MsIG51bGwsIDAsIGN0b3IsIGN0b3IsIGRlcHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJEZWYoXG4gICAgZmxhZ3M6IE5vZGVGbGFncywgbWF0Y2hlZFF1ZXJpZXM6IG51bGwgfCBbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSwgdG9rZW46IGFueSxcbiAgICB2YWx1ZTogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdKTogTm9kZURlZiB7XG4gIHJldHVybiBfZGVmKC0xLCBmbGFncywgbWF0Y2hlZFF1ZXJpZXMsIDAsIHRva2VuLCB2YWx1ZSwgZGVwcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBfZGVmKFxuICAgIGNoZWNrSW5kZXg6IG51bWJlciwgZmxhZ3M6IE5vZGVGbGFncyxcbiAgICBtYXRjaGVkUXVlcmllc0RzbDogW3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10gfCBudWxsLCBjaGlsZENvdW50OiBudW1iZXIsIHRva2VuOiBhbnksXG4gICAgdmFsdWU6IGFueSwgZGVwczogKFtEZXBGbGFncywgYW55XSB8IGFueSlbXSwgYmluZGluZ3M/OiBCaW5kaW5nRGVmW10sXG4gICAgb3V0cHV0cz86IE91dHB1dERlZltdKTogTm9kZURlZiB7XG4gIGNvbnN0IHttYXRjaGVkUXVlcmllcywgcmVmZXJlbmNlcywgbWF0Y2hlZFF1ZXJ5SWRzfSA9IHNwbGl0TWF0Y2hlZFF1ZXJpZXNEc2wobWF0Y2hlZFF1ZXJpZXNEc2wpO1xuICBpZiAoIW91dHB1dHMpIHtcbiAgICBvdXRwdXRzID0gW107XG4gIH1cbiAgaWYgKCFiaW5kaW5ncykge1xuICAgIGJpbmRpbmdzID0gW107XG4gIH1cbiAgLy8gTmVlZCB0byByZXNvbHZlIGZvcndhcmRSZWZzIGFzIGUuZy4gZm9yIGB1c2VWYWx1ZWAgd2VcbiAgLy8gbG93ZXJlZCB0aGUgZXhwcmVzc2lvbiBhbmQgdGhlbiBzdG9wcGVkIGV2YWx1YXRpbmcgaXQsXG4gIC8vIGkuZS4gYWxzbyBkaWRuJ3QgdW53cmFwIGl0LlxuICB2YWx1ZSA9IHJlc29sdmVGb3J3YXJkUmVmKHZhbHVlKTtcblxuICBjb25zdCBkZXBEZWZzID0gc3BsaXREZXBzRHNsKGRlcHMsIHN0cmluZ2lmeSh0b2tlbikpO1xuXG4gIHJldHVybiB7XG4gICAgLy8gd2lsbCBiZXQgc2V0IGJ5IHRoZSB2aWV3IGRlZmluaXRpb25cbiAgICBub2RlSW5kZXg6IC0xLFxuICAgIHBhcmVudDogbnVsbCxcbiAgICByZW5kZXJQYXJlbnQ6IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICBvdXRwdXRJbmRleDogLTEsXG4gICAgLy8gcmVndWxhciB2YWx1ZXNcbiAgICBjaGVja0luZGV4LFxuICAgIGZsYWdzLFxuICAgIGNoaWxkRmxhZ3M6IDAsXG4gICAgZGlyZWN0Q2hpbGRGbGFnczogMCxcbiAgICBjaGlsZE1hdGNoZWRRdWVyaWVzOiAwLCBtYXRjaGVkUXVlcmllcywgbWF0Y2hlZFF1ZXJ5SWRzLCByZWZlcmVuY2VzLFxuICAgIG5nQ29udGVudEluZGV4OiAtMSwgY2hpbGRDb3VudCwgYmluZGluZ3MsXG4gICAgYmluZGluZ0ZsYWdzOiBjYWxjQmluZGluZ0ZsYWdzKGJpbmRpbmdzKSwgb3V0cHV0cyxcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIHByb3ZpZGVyOiB7dG9rZW4sIHZhbHVlLCBkZXBzOiBkZXBEZWZzfSxcbiAgICB0ZXh0OiBudWxsLFxuICAgIHF1ZXJ5OiBudWxsLFxuICAgIG5nQ29udGVudDogbnVsbFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgcmV0dXJuIF9jcmVhdGVQcm92aWRlckluc3RhbmNlKHZpZXcsIGRlZik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQaXBlSW5zdGFuY2UodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIC8vIGRlcHMgYXJlIGxvb2tlZCB1cCBmcm9tIGNvbXBvbmVudC5cbiAgbGV0IGNvbXBWaWV3ID0gdmlldztcbiAgd2hpbGUgKGNvbXBWaWV3LnBhcmVudCAmJiAhaXNDb21wb25lbnRWaWV3KGNvbXBWaWV3KSkge1xuICAgIGNvbXBWaWV3ID0gY29tcFZpZXcucGFyZW50O1xuICB9XG4gIC8vIHBpcGVzIGNhbiBzZWUgdGhlIHByaXZhdGUgc2VydmljZXMgb2YgdGhlIGNvbXBvbmVudFxuICBjb25zdCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IHRydWU7XG4gIC8vIHBpcGVzIGFyZSBhbHdheXMgZWFnZXIgYW5kIGNsYXNzZXMhXG4gIHJldHVybiBjcmVhdGVDbGFzcyhcbiAgICAgIGNvbXBWaWV3LnBhcmVudCAhLCB2aWV3UGFyZW50RWwoY29tcFZpZXcpICEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZWYucHJvdmlkZXIgIS52YWx1ZSxcbiAgICAgIGRlZi5wcm92aWRlciAhLmRlcHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRGlyZWN0aXZlSW5zdGFuY2UodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIC8vIGNvbXBvbmVudHMgY2FuIHNlZSBvdGhlciBwcml2YXRlIHNlcnZpY2VzLCBvdGhlciBkaXJlY3RpdmVzIGNhbid0LlxuICBjb25zdCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KSA+IDA7XG4gIC8vIGRpcmVjdGl2ZXMgYXJlIGFsd2F5cyBlYWdlciBhbmQgY2xhc3NlcyFcbiAgY29uc3QgaW5zdGFuY2UgPSBjcmVhdGVDbGFzcyhcbiAgICAgIHZpZXcsIGRlZi5wYXJlbnQgISwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlZi5wcm92aWRlciAhLnZhbHVlLCBkZWYucHJvdmlkZXIgIS5kZXBzKTtcbiAgaWYgKGRlZi5vdXRwdXRzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGRlZi5vdXRwdXRzW2ldO1xuICAgICAgY29uc3Qgb3V0cHV0T2JzZXJ2YWJsZSA9IGluc3RhbmNlW291dHB1dC5wcm9wTmFtZSAhXTtcbiAgICAgIGlmIChpc09ic2VydmFibGUob3V0cHV0T2JzZXJ2YWJsZSkpIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb3V0cHV0T2JzZXJ2YWJsZS5zdWJzY3JpYmUoXG4gICAgICAgICAgICBldmVudEhhbmRsZXJDbG9zdXJlKHZpZXcsIGRlZi5wYXJlbnQgIS5ub2RlSW5kZXgsIG91dHB1dC5ldmVudE5hbWUpKTtcbiAgICAgICAgdmlldy5kaXNwb3NhYmxlcyAhW2RlZi5vdXRwdXRJbmRleCArIGldID0gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlLmJpbmQoc3Vic2NyaXB0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBAT3V0cHV0ICR7b3V0cHV0LnByb3BOYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7aW5zdGFuY2UuY29uc3RydWN0b3IubmFtZX0nLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGV2ZW50SGFuZGxlckNsb3N1cmUodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiAoZXZlbnQ6IGFueSkgPT4gZGlzcGF0Y2hFdmVudCh2aWV3LCBpbmRleCwgZXZlbnROYW1lLCBldmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZURpcmVjdGl2ZUlubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LFxuICAgIHY3OiBhbnksIHY4OiBhbnksIHY5OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgcHJvdmlkZXJEYXRhID0gYXNQcm92aWRlckRhdGEodmlldywgZGVmLm5vZGVJbmRleCk7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IHByb3ZpZGVyRGF0YS5pbnN0YW5jZTtcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgbGV0IGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMgPSB1bmRlZmluZWQgITtcbiAgY29uc3QgYmluZExlbiA9IGRlZi5iaW5kaW5ncy5sZW5ndGg7XG4gIGlmIChiaW5kTGVuID4gMCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAwLCB2MCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMCwgdjAsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAxLCB2MSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMSwgdjEsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMiAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAyLCB2MikpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMiwgdjIsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMyAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAzLCB2MykpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMywgdjMsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA0LCB2NCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNCwgdjQsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA1LCB2NSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNSwgdjUsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNiAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA2LCB2NikpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNiwgdjYsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNyAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA3LCB2NykpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNywgdjcsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gOCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA4LCB2OCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgOCwgdjgsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gOSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA5LCB2OSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgOSwgdjksIGNoYW5nZXMpO1xuICB9XG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgZGlyZWN0aXZlLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG4gIGlmICgoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uSW5pdCkgJiZcbiAgICAgIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vayh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdPbkluaXQsIGRlZi5ub2RlSW5kZXgpKSB7XG4gICAgZGlyZWN0aXZlLm5nT25Jbml0KCk7XG4gIH1cbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Eb0NoZWNrKSB7XG4gICAgZGlyZWN0aXZlLm5nRG9DaGVjaygpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVEeW5hbWljKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIHZhbHVlczogYW55W10pOiBib29sZWFuIHtcbiAgY29uc3QgcHJvdmlkZXJEYXRhID0gYXNQcm92aWRlckRhdGEodmlldywgZGVmLm5vZGVJbmRleCk7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IHByb3ZpZGVyRGF0YS5pbnN0YW5jZTtcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgbGV0IGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMgPSB1bmRlZmluZWQgITtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgaSwgdmFsdWVzW2ldKSkge1xuICAgICAgY2hhbmdlZCA9IHRydWU7XG4gICAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgaSwgdmFsdWVzW2ldLCBjaGFuZ2VzKTtcbiAgICB9XG4gIH1cbiAgaWYgKGNoYW5nZXMpIHtcbiAgICBkaXJlY3RpdmUubmdPbkNoYW5nZXMoY2hhbmdlcyk7XG4gIH1cbiAgaWYgKChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuT25Jbml0KSAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ09uSW5pdCwgZGVmLm5vZGVJbmRleCkpIHtcbiAgICBkaXJlY3RpdmUubmdPbkluaXQoKTtcbiAgfVxuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkRvQ2hlY2spIHtcbiAgICBkaXJlY3RpdmUubmdEb0NoZWNrKCk7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbmZ1bmN0aW9uIF9jcmVhdGVQcm92aWRlckluc3RhbmNlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICAvLyBwcml2YXRlIHNlcnZpY2VzIGNhbiBzZWUgb3RoZXIgcHJpdmF0ZSBzZXJ2aWNlc1xuICBjb25zdCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuUHJpdmF0ZVByb3ZpZGVyKSA+IDA7XG4gIGNvbnN0IHByb3ZpZGVyRGVmID0gZGVmLnByb3ZpZGVyO1xuICBzd2l0Y2ggKGRlZi5mbGFncyAmIE5vZGVGbGFncy5UeXBlcykge1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVDbGFzc1Byb3ZpZGVyOlxuICAgICAgcmV0dXJuIGNyZWF0ZUNsYXNzKFxuICAgICAgICAgIHZpZXcsIGRlZi5wYXJlbnQgISwgYWxsb3dQcml2YXRlU2VydmljZXMsIHByb3ZpZGVyRGVmICEudmFsdWUsIHByb3ZpZGVyRGVmICEuZGVwcyk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUZhY3RvcnlQcm92aWRlcjpcbiAgICAgIHJldHVybiBjYWxsRmFjdG9yeShcbiAgICAgICAgICB2aWV3LCBkZWYucGFyZW50ICEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBwcm92aWRlckRlZiAhLnZhbHVlLCBwcm92aWRlckRlZiAhLmRlcHMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVVc2VFeGlzdGluZ1Byb3ZpZGVyOlxuICAgICAgcmV0dXJuIHJlc29sdmVEZXAodmlldywgZGVmLnBhcmVudCAhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgcHJvdmlkZXJEZWYgIS5kZXBzWzBdKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVmFsdWVQcm92aWRlcjpcbiAgICAgIHJldHVybiBwcm92aWRlckRlZiAhLnZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZUNsYXNzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgYWxsb3dQcml2YXRlU2VydmljZXM6IGJvb2xlYW4sIGN0b3I6IGFueSwgZGVwczogRGVwRGVmW10pOiBhbnkge1xuICBjb25zdCBsZW4gPSBkZXBzLmxlbmd0aDtcbiAgc3dpdGNoIChsZW4pIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gbmV3IGN0b3IoKTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gbmV3IGN0b3IocmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pKTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gbmV3IGN0b3IoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1sxXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGRlcFZhbHVlcy5wdXNoKHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzW2ldKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGN0b3IoLi4uZGVwVmFsdWVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsRmFjdG9yeShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuLCBmYWN0b3J5OiBhbnksXG4gICAgZGVwczogRGVwRGVmW10pOiBhbnkge1xuICBjb25zdCBsZW4gPSBkZXBzLmxlbmd0aDtcbiAgc3dpdGNoIChsZW4pIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBmYWN0b3J5KHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1syXSkpO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zdCBkZXBWYWx1ZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZGVwVmFsdWVzLnB1c2gocmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmYWN0b3J5KC4uLmRlcFZhbHVlcyk7XG4gIH1cbn1cblxuLy8gVGhpcyBkZWZhdWx0IHZhbHVlIGlzIHdoZW4gY2hlY2tpbmcgdGhlIGhpZXJhcmNoeSBmb3IgYSB0b2tlbi5cbi8vXG4vLyBJdCBtZWFucyBib3RoOlxuLy8gLSB0aGUgdG9rZW4gaXMgbm90IHByb3ZpZGVkIGJ5IHRoZSBjdXJyZW50IGluamVjdG9yLFxuLy8gLSBvbmx5IHRoZSBlbGVtZW50IGluamVjdG9ycyBzaG91bGQgYmUgY2hlY2tlZCAoaWUgZG8gbm90IGNoZWNrIG1vZHVsZSBpbmplY3RvcnNcbi8vXG4vLyAgICAgICAgICBtb2QxXG4vLyAgICAgICAgIC9cbi8vICAgICAgIGVsMSAgIG1vZDJcbi8vICAgICAgICAgXFwgIC9cbi8vICAgICAgICAgZWwyXG4vL1xuLy8gV2hlbiByZXF1ZXN0aW5nIGVsMi5pbmplY3Rvci5nZXQodG9rZW4pLCB3ZSBzaG91bGQgY2hlY2sgaW4gdGhlIGZvbGxvd2luZyBvcmRlciBhbmQgcmV0dXJuIHRoZVxuLy8gZmlyc3QgZm91bmQgdmFsdWU6XG4vLyAtIGVsMi5pbmplY3Rvci5nZXQodG9rZW4sIGRlZmF1bHQpXG4vLyAtIGVsMS5pbmplY3Rvci5nZXQodG9rZW4sIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpIC0+IGRvIG5vdCBjaGVjayB0aGUgbW9kdWxlXG4vLyAtIG1vZDIuaW5qZWN0b3IuZ2V0KHRva2VuLCBkZWZhdWx0KVxuZXhwb3J0IGNvbnN0IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IgPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVEZXAoXG4gICAgdmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbiwgZGVwRGVmOiBEZXBEZWYsXG4gICAgbm90Rm91bmRWYWx1ZTogYW55ID0gSW5qZWN0b3IuVEhST1dfSUZfTk9UX0ZPVU5EKTogYW55IHtcbiAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlZhbHVlKSB7XG4gICAgcmV0dXJuIGRlcERlZi50b2tlbjtcbiAgfVxuICBjb25zdCBzdGFydFZpZXcgPSB2aWV3O1xuICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuT3B0aW9uYWwpIHtcbiAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgfVxuICBjb25zdCB0b2tlbktleSA9IGRlcERlZi50b2tlbktleTtcblxuICBpZiAodG9rZW5LZXkgPT09IENoYW5nZURldGVjdG9yUmVmVG9rZW5LZXkpIHtcbiAgICAvLyBkaXJlY3RpdmVzIG9uIHRoZSBzYW1lIGVsZW1lbnQgYXMgYSBjb21wb25lbnQgc2hvdWxkIGJlIGFibGUgdG8gY29udHJvbCB0aGUgY2hhbmdlIGRldGVjdG9yXG4gICAgLy8gb2YgdGhhdCBjb21wb25lbnQgYXMgd2VsbC5cbiAgICBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9ICEhKGVsRGVmICYmIGVsRGVmLmVsZW1lbnQgIS5jb21wb25lbnRWaWV3KTtcbiAgfVxuXG4gIGlmIChlbERlZiAmJiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgYWxsb3dQcml2YXRlU2VydmljZXMgPSBmYWxzZTtcbiAgICBlbERlZiA9IGVsRGVmLnBhcmVudCAhO1xuICB9XG5cbiAgbGV0IHNlYXJjaFZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoc2VhcmNoVmlldykge1xuICAgIGlmIChlbERlZikge1xuICAgICAgc3dpdGNoICh0b2tlbktleSkge1xuICAgICAgICBjYXNlIFJlbmRlcmVyVjFUb2tlbktleToge1xuICAgICAgICAgIGNvbnN0IGNvbXBWaWV3ID0gZmluZENvbXBWaWV3KHNlYXJjaFZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyk7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZVJlbmRlcmVyVjEoY29tcFZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgUmVuZGVyZXIyVG9rZW5LZXk6IHtcbiAgICAgICAgICBjb25zdCBjb21wVmlldyA9IGZpbmRDb21wVmlldyhzZWFyY2hWaWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMpO1xuICAgICAgICAgIHJldHVybiBjb21wVmlldy5yZW5kZXJlcjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEVsZW1lbnRSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoYXNFbGVtZW50RGF0YShzZWFyY2hWaWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQpO1xuICAgICAgICBjYXNlIFZpZXdDb250YWluZXJSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gYXNFbGVtZW50RGF0YShzZWFyY2hWaWV3LCBlbERlZi5ub2RlSW5kZXgpLnZpZXdDb250YWluZXI7XG4gICAgICAgIGNhc2UgVGVtcGxhdGVSZWZUb2tlbktleToge1xuICAgICAgICAgIGlmIChlbERlZi5lbGVtZW50ICEudGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHNlYXJjaFZpZXcsIGVsRGVmLm5vZGVJbmRleCkudGVtcGxhdGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ2hhbmdlRGV0ZWN0b3JSZWZUb2tlbktleToge1xuICAgICAgICAgIGxldCBjZFZpZXcgPSBmaW5kQ29tcFZpZXcoc2VhcmNoVmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzKTtcbiAgICAgICAgICByZXR1cm4gY3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoY2RWaWV3KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEluamVjdG9yUmVmVG9rZW5LZXk6XG4gICAgICAgIGNhc2UgSU5KRUNUT1JSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSW5qZWN0b3Ioc2VhcmNoVmlldywgZWxEZWYpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnN0IHByb3ZpZGVyRGVmID1cbiAgICAgICAgICAgICAgKGFsbG93UHJpdmF0ZVNlcnZpY2VzID8gZWxEZWYuZWxlbWVudCAhLmFsbFByb3ZpZGVycyA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsRGVmLmVsZW1lbnQgIS5wdWJsaWNQcm92aWRlcnMpICFbdG9rZW5LZXldO1xuICAgICAgICAgIGlmIChwcm92aWRlckRlZikge1xuICAgICAgICAgICAgbGV0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHNlYXJjaFZpZXcsIHByb3ZpZGVyRGVmLm5vZGVJbmRleCk7XG4gICAgICAgICAgICBpZiAoIXByb3ZpZGVyRGF0YSkge1xuICAgICAgICAgICAgICBwcm92aWRlckRhdGEgPSB7aW5zdGFuY2U6IF9jcmVhdGVQcm92aWRlckluc3RhbmNlKHNlYXJjaFZpZXcsIHByb3ZpZGVyRGVmKX07XG4gICAgICAgICAgICAgIHNlYXJjaFZpZXcubm9kZXNbcHJvdmlkZXJEZWYubm9kZUluZGV4XSA9IHByb3ZpZGVyRGF0YSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvdmlkZXJEYXRhLmluc3RhbmNlO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IGlzQ29tcG9uZW50VmlldyhzZWFyY2hWaWV3KTtcbiAgICBlbERlZiA9IHZpZXdQYXJlbnRFbChzZWFyY2hWaWV3KSAhO1xuICAgIHNlYXJjaFZpZXcgPSBzZWFyY2hWaWV3LnBhcmVudCAhO1xuXG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNlbGYpIHtcbiAgICAgIHNlYXJjaFZpZXcgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZhbHVlID0gc3RhcnRWaWV3LnJvb3QuaW5qZWN0b3IuZ2V0KGRlcERlZi50b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUik7XG5cbiAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIHx8XG4gICAgICBub3RGb3VuZFZhbHVlID09PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKSB7XG4gICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAvLyAgICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgLy8gICAobm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gc3RhcnRWaWV3LnJvb3QubmdNb2R1bGUuaW5qZWN0b3IuZ2V0KGRlcERlZi50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRDb21wVmlldyh2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuKSB7XG4gIGxldCBjb21wVmlldzogVmlld0RhdGE7XG4gIGlmIChhbGxvd1ByaXZhdGVTZXJ2aWNlcykge1xuICAgIGNvbXBWaWV3ID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgY29tcFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChjb21wVmlldy5wYXJlbnQgJiYgIWlzQ29tcG9uZW50Vmlldyhjb21wVmlldykpIHtcbiAgICAgIGNvbXBWaWV3ID0gY29tcFZpZXcucGFyZW50O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29tcFZpZXc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVByb3AoXG4gICAgdmlldzogVmlld0RhdGEsIHByb3ZpZGVyRGF0YTogUHJvdmlkZXJEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSxcbiAgICBjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogU2ltcGxlQ2hhbmdlcyB7XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KSB7XG4gICAgY29uc3QgY29tcFZpZXcgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5wYXJlbnQgIS5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gICAgaWYgKGNvbXBWaWV3LmRlZi5mbGFncyAmIFZpZXdGbGFncy5PblB1c2gpIHtcbiAgICAgIGNvbXBWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja3NFbmFibGVkO1xuICAgIH1cbiAgfVxuICBjb25zdCBiaW5kaW5nID0gZGVmLmJpbmRpbmdzW2JpbmRpbmdJZHhdO1xuICBjb25zdCBwcm9wTmFtZSA9IGJpbmRpbmcubmFtZSAhO1xuICAvLyBOb3RlOiBUaGlzIGlzIHN0aWxsIHNhZmUgd2l0aCBDbG9zdXJlIENvbXBpbGVyIGFzXG4gIC8vIHRoZSB1c2VyIHBhc3NlZCBpbiB0aGUgcHJvcGVydHkgbmFtZSBhcyBhbiBvYmplY3QgaGFzIHRvIGBwcm92aWRlckRlZmAsXG4gIC8vIHNvIENsb3N1cmUgQ29tcGlsZXIgd2lsbCBoYXZlIHJlbmFtZWQgdGhlIHByb3BlcnR5IGNvcnJlY3RseSBhbHJlYWR5LlxuICBwcm92aWRlckRhdGEuaW5zdGFuY2VbcHJvcE5hbWVdID0gdmFsdWU7XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuT25DaGFuZ2VzKSB7XG4gICAgY2hhbmdlcyA9IGNoYW5nZXMgfHwge307XG4gICAgY29uc3Qgb2xkVmFsdWUgPSBXcmFwcGVkVmFsdWUudW53cmFwKHZpZXcub2xkVmFsdWVzW2RlZi5iaW5kaW5nSW5kZXggKyBiaW5kaW5nSWR4XSk7XG4gICAgY29uc3QgYmluZGluZyA9IGRlZi5iaW5kaW5nc1tiaW5kaW5nSWR4XTtcbiAgICBjaGFuZ2VzW2JpbmRpbmcubm9uTWluaWZpZWROYW1lICFdID1cbiAgICAgICAgbmV3IFNpbXBsZUNoYW5nZShvbGRWYWx1ZSwgdmFsdWUsICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkZpcnN0Q2hlY2spICE9PSAwKTtcbiAgfVxuICB2aWV3Lm9sZFZhbHVlc1tkZWYuYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeF0gPSB2YWx1ZTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gY2FsbHMgdGhlIG5nQWZ0ZXJDb250ZW50Q2hlY2ssIG5nQWZ0ZXJDb250ZW50SW5pdCxcbi8vIG5nQWZ0ZXJWaWV3Q2hlY2ssIGFuZCBuZ0FmdGVyVmlld0luaXQgbGlmZWN5Y2xlIGhvb2tzIChkZXBlbmRpbmcgb24gdGhlIG5vZGVcbi8vIGZsYWdzIGluIGxpZmVjeWNsZSkuIFVubGlrZSBuZ0RvQ2hlY2ssIG5nT25DaGFuZ2VzIGFuZCBuZ09uSW5pdCwgd2hpY2ggYXJlXG4vLyBjYWxsZWQgZHVyaW5nIGEgcHJlLW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgdmlldyB0cmVlICh0aGF0IGlzIGNhbGxpbmcgdGhlXG4vLyBwYXJlbnQgaG9va3MgYmVmb3JlIHRoZSBjaGlsZCBob29rcykgdGhlc2UgZXZlbnRzIGFyZSBzZW50IGluIHVzaW5nIGFcbi8vIHBvc3Qtb3JkZXIgdHJhdmVyc2FsIG9mIHRoZSB0cmVlIChjaGlsZHJlbiBiZWZvcmUgcGFyZW50cykuIFRoaXMgY2hhbmdlcyB0aGVcbi8vIG1lYW5pbmcgb2YgaW5pdEluZGV4IGluIHRoZSB2aWV3IHN0YXRlLiBGb3IgbmdPbkluaXQsIGluaXRJbmRleCB0cmFja3MgdGhlXG4vLyBleHBlY3RlZCBub2RlSW5kZXggd2hpY2ggYSBuZ09uSW5pdCBzaG91bGQgYmUgY2FsbGVkLiBXaGVuIHNlbmRpbmdcbi8vIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlclZpZXdJbml0IGl0IGlzIHRoZSBleHBlY3RlZCBjb3VudCBvZlxuLy8gbmdBZnRlckNvbnRlbnRJbml0IG9yIG5nQWZ0ZXJWaWV3SW5pdCBtZXRob2RzIHRoYXQgaGF2ZSBiZWVuIGNhbGxlZC4gVGhpc1xuLy8gZW5zdXJlIHRoYXQgZGVzcGl0ZSBiZWluZyBjYWxsZWQgcmVjdXJzaXZlbHkgb3IgYWZ0ZXIgcGlja2luZyB1cCBhZnRlciBhblxuLy8gZXhjZXB0aW9uLCB0aGUgbmdBZnRlckNvbnRlbnRJbml0IG9yIG5nQWZ0ZXJWaWV3SW5pdCB3aWxsIGJlIGNhbGxlZCBvbiB0aGVcbi8vIGNvcnJlY3Qgbm9kZXMuIENvbnNpZGVyIGZvciBleGFtcGxlLCB0aGUgZm9sbG93aW5nICh3aGVyZSBFIGlzIGFuIGVsZW1lbnRcbi8vIGFuZCBEIGlzIGEgZGlyZWN0aXZlKVxuLy8gIFRyZWU6ICAgICAgIHByZS1vcmRlciBpbmRleCAgcG9zdC1vcmRlciBpbmRleFxuLy8gICAgRTEgICAgICAgIDAgICAgICAgICAgICAgICAgNlxuLy8gICAgICBFMiAgICAgIDEgICAgICAgICAgICAgICAgMVxuLy8gICAgICAgRDMgICAgIDIgICAgICAgICAgICAgICAgMFxuLy8gICAgICBFNCAgICAgIDMgICAgICAgICAgICAgICAgNVxuLy8gICAgICAgRTUgICAgIDQgICAgICAgICAgICAgICAgNFxuLy8gICAgICAgIEU2ICAgIDUgICAgICAgICAgICAgICAgMlxuLy8gICAgICAgIEU3ICAgIDYgICAgICAgICAgICAgICAgM1xuLy8gQXMgY2FuIGJlIHNlZW4sIHRoZSBwb3N0LW9yZGVyIGluZGV4IGhhcyBhbiB1bmNsZWFyIHJlbGF0aW9uc2hpcCB0byB0aGVcbi8vIHByZS1vcmRlciBpbmRleCAocG9zdE9yZGVySW5kZXggPT09IHByZU9yZGVySW5kZXggLSBwYXJlbnRDb3VudCArXG4vLyBjaGlsZENvdW50KS4gU2luY2UgbnVtYmVyIG9mIGNhbGxzIHRvIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlclZpZXdJbml0XG4vLyBhcmUgc3RhYmxlICh3aWxsIGJlIHRoZSBzYW1lIGZvciB0aGUgc2FtZSB2aWV3IHJlZ2FyZGxlc3Mgb2YgZXhjZXB0aW9ucyBvclxuLy8gcmVjdXJzaW9uKSB3ZSBqdXN0IG5lZWQgdG8gY291bnQgdGhlbSB3aGljaCB3aWxsIHJvdWdobHkgY29ycmVzcG9uZCB0byB0aGVcbi8vIHBvc3Qtb3JkZXIgaW5kZXggKGl0IHNraXBzIGVsZW1lbnRzIGFuZCBkaXJlY3RpdmVzIHRoYXQgZG8gbm90IGhhdmVcbi8vIGxpZmVjeWNsZSBob29rcykuXG4vL1xuLy8gRm9yIGV4YW1wbGUsIGlmIGFuIGV4Y2VwdGlvbiBpcyByYWlzZWQgaW4gdGhlIEU2Lm9uQWZ0ZXJWaWV3SW5pdCgpIHRoZVxuLy8gaW5pdEluZGV4IGlzIGxlZnQgYXQgMyAoYnkgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKCkgd2hpY2ggc2V0IGl0IHRvXG4vLyBpbml0SW5kZXggKyAxKS4gV2hlbiBjaGVja0FuZFVwZGF0ZVZpZXcoKSBpcyBjYWxsZWQgYWdhaW4gRDMsIEUyIGFuZCBFNiB3aWxsXG4vLyBub3QgaGF2ZSB0aGVpciBuZ0FmdGVyVmlld0luaXQoKSBjYWxsZWQgYnV0LCBzdGFydGluZyB3aXRoIEU3LCB0aGUgcmVzdCBvZlxuLy8gdGhlIHZpZXcgd2lsbCBiZWdpbiBnZXR0aW5nIG5nQWZ0ZXJWaWV3SW5pdCgpIGNhbGxlZCB1bnRpbCBhIGNoZWNrIGFuZFxuLy8gcGFzcyBpcyBjb21wbGV0ZS5cbi8vXG4vLyBUaGlzIGFsZ29ydGhpbSBhbHNvIGhhbmRsZXMgcmVjdXJzaW9uLiBDb25zaWRlciBpZiBFNCdzIG5nQWZ0ZXJWaWV3SW5pdCgpXG4vLyBpbmRpcmVjdGx5IGNhbGxzIEUxJ3MgQ2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpLiBUaGUgZXhwZWN0ZWRcbi8vIGluaXRJbmRleCBpcyBzZXQgdG8gNiwgdGhlIHJlY3VzaXZlIGNoZWNrQW5kVXBkYXRlVmlldygpIHN0YXJ0cyB3YWxrIGFnYWluLlxuLy8gRDMsIEUyLCBFNiwgRTcsIEU1IGFuZCBFNCBhcmUgc2tpcHBlZCwgbmdBZnRlclZpZXdJbml0KCkgaXMgY2FsbGVkIG9uIEUxLlxuLy8gV2hlbiB0aGUgcmVjdXJzaW9uIHJldHVybnMgdGhlIGluaXRJbmRleCB3aWxsIGJlIDcgc28gRTEgaXMgc2tpcHBlZCBhcyBpdFxuLy8gaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQgaW4gdGhlIHJlY3Vyc2l2ZWx5IGNhbGxlZCBjaGVja0FuVXBkYXRlVmlldygpLlxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QodmlldzogVmlld0RhdGEsIGxpZmVjeWNsZXM6IE5vZGVGbGFncykge1xuICBpZiAoISh2aWV3LmRlZi5ub2RlRmxhZ3MgJiBsaWZlY3ljbGVzKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBub2RlcyA9IHZpZXcuZGVmLm5vZGVzO1xuICBsZXQgaW5pdEluZGV4ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSBub2Rlc1tpXTtcbiAgICBsZXQgcGFyZW50ID0gbm9kZURlZi5wYXJlbnQ7XG4gICAgaWYgKCFwYXJlbnQgJiYgbm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgIC8vIG1hdGNoaW5nIHJvb3Qgbm9kZSAoZS5nLiBhIHBpcGUpXG4gICAgICBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKHZpZXcsIGksIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzLCBpbml0SW5kZXgrKyk7XG4gICAgfVxuICAgIGlmICgobm9kZURlZi5jaGlsZEZsYWdzICYgbGlmZWN5Y2xlcykgPT09IDApIHtcbiAgICAgIC8vIG5vIGNoaWxkIG1hdGNoZXMgb25lIG9mIHRoZSBsaWZlY3ljbGVzXG4gICAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgICB9XG4gICAgd2hpbGUgKHBhcmVudCAmJiAocGFyZW50LmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSAmJlxuICAgICAgICAgICBpID09PSBwYXJlbnQubm9kZUluZGV4ICsgcGFyZW50LmNoaWxkQ291bnQpIHtcbiAgICAgIC8vIGxhc3QgY2hpbGQgb2YgYW4gZWxlbWVudFxuICAgICAgaWYgKHBhcmVudC5kaXJlY3RDaGlsZEZsYWdzICYgbGlmZWN5Y2xlcykge1xuICAgICAgICBpbml0SW5kZXggPSBjYWxsRWxlbWVudFByb3ZpZGVyc0xpZmVjeWNsZXModmlldywgcGFyZW50LCBsaWZlY3ljbGVzLCBpbml0SW5kZXgpO1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbEVsZW1lbnRQcm92aWRlcnNMaWZlY3ljbGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgbGlmZWN5Y2xlczogTm9kZUZsYWdzLCBpbml0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBlbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IGVsRGVmLm5vZGVJbmRleCArIGVsRGVmLmNoaWxkQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgIGNhbGxQcm92aWRlckxpZmVjeWNsZXModmlldywgaSwgbm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMsIGluaXRJbmRleCsrKTtcbiAgICB9XG4gICAgLy8gb25seSB2aXNpdCBkaXJlY3QgY2hpbGRyZW5cbiAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgfVxuICByZXR1cm4gaW5pdEluZGV4O1xufVxuXG5mdW5jdGlvbiBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MsIGluaXRJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGluZGV4KTtcbiAgaWYgKCFwcm92aWRlckRhdGEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUodmlldywgaW5kZXgpO1xuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlckNvbnRlbnRJbml0ICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJDb250ZW50SW5pdCwgaW5pdEluZGV4KSkge1xuICAgIHByb3ZpZGVyLm5nQWZ0ZXJDb250ZW50SW5pdCgpO1xuICB9XG4gIGlmIChsaWZlY3ljbGVzICYgTm9kZUZsYWdzLkFmdGVyQ29udGVudENoZWNrZWQpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyQ29udGVudENoZWNrZWQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlclZpZXdJbml0ICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJWaWV3SW5pdCwgaW5pdEluZGV4KSkge1xuICAgIHByb3ZpZGVyLm5nQWZ0ZXJWaWV3SW5pdCgpO1xuICB9XG4gIGlmIChsaWZlY3ljbGVzICYgTm9kZUZsYWdzLkFmdGVyVmlld0NoZWNrZWQpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyVmlld0NoZWNrZWQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5PbkRlc3Ryb3kpIHtcbiAgICBwcm92aWRlci5uZ09uRGVzdHJveSgpO1xuICB9XG59XG4iXX0=