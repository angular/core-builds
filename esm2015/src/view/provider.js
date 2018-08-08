/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
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
import { stringify } from '../util';
import { isObservable } from '../util/lang';
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
    /** @type {?} */
    let compView = view;
    while (compView.parent && !isComponentView(compView)) {
        compView = compView.parent;
    }
    /** @type {?} */
    const allowPrivateServices = true;
    // pipes are always eager and classes!
    return createClass(/** @type {?} */ ((compView.parent)), /** @type {?} */ ((viewParentEl(compView))), allowPrivateServices, /** @type {?} */ ((def.provider)).value, /** @type {?} */ ((def.provider)).deps);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createDirectiveInstance(view, def) {
    /** @type {?} */
    const allowPrivateServices = (def.flags & 32768 /* Component */) > 0;
    /** @type {?} */
    const instance = createClass(view, /** @type {?} */ ((def.parent)), allowPrivateServices, /** @type {?} */ ((def.provider)).value, /** @type {?} */ ((def.provider)).deps);
    if (def.outputs.length) {
        for (let i = 0; i < def.outputs.length; i++) {
            /** @type {?} */
            const output = def.outputs[i];
            /** @type {?} */
            const outputObservable = instance[/** @type {?} */ ((output.propName))];
            if (isObservable(outputObservable)) {
                /** @type {?} */
                const subscription = outputObservable.subscribe(eventHandlerClosure(view, /** @type {?} */ ((def.parent)).nodeIndex, output.eventName)); /** @type {?} */
                ((view.disposables))[def.outputIndex + i] = subscription.unsubscribe.bind(subscription);
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
    return (event) => dispatchEvent(view, index, eventName, event);
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
    let changes = /** @type {?} */ ((undefined));
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
    let changes = /** @type {?} */ ((undefined));
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
    /** @type {?} */
    const allowPrivateServices = (def.flags & 8192 /* PrivateProvider */) > 0;
    /** @type {?} */
    const providerDef = def.provider;
    switch (def.flags & 201347067 /* Types */) {
        case 512 /* TypeClassProvider */:
            return createClass(view, /** @type {?} */ ((def.parent)), allowPrivateServices, /** @type {?} */ ((providerDef)).value, /** @type {?} */ ((providerDef)).deps);
        case 1024 /* TypeFactoryProvider */:
            return callFactory(view, /** @type {?} */ ((def.parent)), allowPrivateServices, /** @type {?} */ ((providerDef)).value, /** @type {?} */ ((providerDef)).deps);
        case 2048 /* TypeUseExistingProvider */:
            return resolveDep(view, /** @type {?} */ ((def.parent)), allowPrivateServices, /** @type {?} */ ((providerDef)).deps[0]);
        case 256 /* TypeValueProvider */:
            return /** @type {?} */ ((providerDef)).value;
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
            const depValues = new Array(len);
            for (let i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
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
            const depValues = Array(len);
            for (let i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
            }
            return factory(...depValues);
    }
}
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
        allowPrivateServices = !!(elDef && /** @type {?} */ ((elDef.element)).componentView);
    }
    if (elDef && (depDef.flags & 1 /* SkipSelf */)) {
        allowPrivateServices = false;
        elDef = /** @type {?} */ ((elDef.parent));
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
                    if (/** @type {?} */ ((elDef.element)).template) {
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
                    const providerDef = /** @type {?} */ (((allowPrivateServices ? /** @type {?} */ ((elDef.element)).allProviders : /** @type {?} */ ((elDef.element)).publicProviders)))[tokenKey];
                    if (providerDef) {
                        /** @type {?} */
                        let providerData = asProviderData(searchView, providerDef.nodeIndex);
                        if (!providerData) {
                            providerData = { instance: _createProviderInstance(searchView, providerDef) };
                            searchView.nodes[providerDef.nodeIndex] = /** @type {?} */ (providerData);
                        }
                        return providerData.instance;
                    }
            }
        }
        allowPrivateServices = isComponentView(searchView);
        elDef = /** @type {?} */ ((viewParentEl(searchView)));
        searchView = /** @type {?} */ ((searchView.parent));
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
        const compView = asElementData(view, /** @type {?} */ ((def.parent)).nodeIndex).componentView;
        if (compView.def.flags & 2 /* OnPush */) {
            compView.state |= 8 /* ChecksEnabled */;
        }
    }
    /** @type {?} */
    const binding = def.bindings[bindingIdx];
    /** @type {?} */
    const propName = /** @type {?} */ ((binding.name));
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
        changes[/** @type {?} */ ((binding.nonMinifiedName))] =
            new SimpleChange(oldValue, value, (view.state & 2 /* FirstCheck */) !== 0);
    }
    view.oldValues[def.bindingIndex + bindingIdx] = value;
    return changes;
}
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGlCQUFpQixFQUFFLFlBQVksRUFBaUIsWUFBWSxFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDbEgsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsUUFBUSxJQUFJLFVBQVUsRUFBRSxTQUFTLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDaEUsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUNsQyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBRTFDLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxjQUFjLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDakYsT0FBTyxFQUFzSCxRQUFRLEVBQWtDLGFBQWEsRUFBRSxjQUFjLEVBQUUsMkJBQTJCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbFAsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDOztBQUVwSixNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzs7QUFDaEQsTUFBTSxpQkFBaUIsR0FBRyxRQUFRLENBQUMsU0FBUyxD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LENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxHQUFHLENBQUMsSUFBSSxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7UUFDakQsT0FBTyxHQUFHLElBQUksQ0FBQztRQUNmLE9BQU8sR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUMvRDtJQUNELElBQUksT0FBTyxFQUFFO1FBQ1gsU0FBUyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztLQUNoQztJQUNELElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxxQkFBbUIsQ0FBQztRQUM5QiwyQkFBMkIsQ0FBQyxJQUFJLHFDQUFxQyxHQUFHLENBQUMsU0FBUyxDQUFDLEVBQUU7UUFDdkYsU0FBUyxDQUFDLFFBQVEsRUFBRSxDQUFDO0tBQ3RCO0lBQ0QsSUFBSSxHQUFHLENBQUMsS0FBSyx1QkFBb0IsRUFBRTtRQUNqQyxTQUFTLENBQUMsU0FBUyxFQUFFLENBQUM7S0FDdkI7SUFDRCxPQUFPLE9BQU8sQ0FBQztDQUNoQjs7Ozs7OztBQUVELE1BQU0seUNBQ0YsSUFBYyxFQUFFLEdBQVksRUFBRSxNQUFhOztJQUM3QyxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7SUFDekQsTUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQzs7SUFDeEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDOztJQUNwQixJQUFJLE9BQU8sc0JBQWtCLFNBQVMsR0FBRztJQUN6QyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUN0QyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtZQUN6QyxPQUFPLEdBQUcsSUFBSSxDQUFDO1lBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1NBQ3RFO0tBQ0Y7SUFDRCxJQUFJLE9BQU8sRUFBRTtRQUNYLFNBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7S0FDaEM7SUFDRCxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUsscUJBQW1CLENBQUM7UUFDOUIsMkJBQTJCLENBQUMsSUFBSSxxQ0FBcUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1FBQ3ZGLFNBQVMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztLQUN0QjtJQUNELElBQUksR0FBRyxDQUFDLEtBQUssdUJBQW9CLEVBQUU7UUFDakMsU0FBUyxDQUFDLFNBQVMsRUFBRSxDQUFDO0tBQ3ZCO0lBQ0QsT0FBTyxPQUFPLENBQUM7Q0FDaEI7Ozs7OztBQUVELGlDQUFpQyxJQUFjLEVBQUUsR0FBWTs7SUFFM0QsTUFBTSxvQkFBb0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLDZCQUE0QixDQUFDLEdBQUcsQ0FBQyxDQUFDOztJQUN6RSxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO0lBQ2pDLFFBQVEsR0FBRyxDQUFDLEtBQUssd0JBQWtCLEVBQUU7UUFDbkM7WUFDRSxPQUFPLFdBQVcsQ0FDZCxJQUFJLHFCQUFFLEdBQUcsQ0FBQyxNQUFNLElBQUksb0JBQW9CLHFCQUFFLFdBQVcsR0FBRyxLQUFLLHFCQUFFLFdBQVcsR0FBRyxJQUFJLENBQUMsQ0FBQztRQUN6RjtZQUNFLE9BQU8sV0FBVyxDQUNkLElBQUkscUJBQUUsR0FBRyxDQUFDLE1BQU0sSUFBSSxvQkFBb0IscUJBQUUsV0FBVyxHQUFHLEtBQUsscUJBQUUsV0FBVyxHQUFHLElBQUksQ0FBQyxDQUFDO1FBQ3pGO1lBQ0UsT0FBTyxVQUFVLENBQUMsSUFBSSxxQkFBRSxHQUFHLENBQUMsTUFBTSxJQUFJLG9CQUFvQixxQkFBRSxXQUFXLEdBQUcsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDO1FBQ3JGO1lBQ0UsMEJBQU8sV0FBVyxHQUFHLEtBQUssQ0FBQztLQUM5QjtDQUNGOzs7Ozs7Ozs7QUFFRCxxQkFDSSxJQUFjLEVBQUUsS0FBYyxFQUFFLG9CQUE2QixFQUFFLElBQVMsRUFBRSxJQUFjOztJQUMxRixNQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0lBQ3hCLFFBQVEsR0FBRyxFQUFFO1FBQ1gsS0FBSyxDQUFDO1lBQ0osT0FBTyxJQUFJLElBQUksRUFBRSxDQUFDO1FBQ3BCLEtBQUssQ0FBQztZQUNKLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRSxLQUFLLENBQUM7WUFDSixPQUFPLElBQUksSUFBSSxDQUNYLFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN0RCxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlELEtBQUssQ0FBQztZQUNKLE9BQU8sSUFBSSxJQUFJLENBQ1gsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3RELFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUN0RCxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzlEOztZQUNFLE1BQU0sU0FBUyxHQUFHLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ2pDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVCLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2RTtZQUNELE9BQU8sSUFBSSxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztLQUNqQztDQUNGOzs7Ozs7Ozs7QUFFRCxxQkFDSSxJQUFjLEVBQUUsS0FBYyxFQUFFLG9CQUE2QixFQUFFLE9BQVksRUFDM0UsSUFBYzs7SUFDaEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztJQUN4QixRQUFRLEdBQUcsRUFBRTtRQUNYLEtBQUssQ0FBQztZQUNKLE9BQU8sT0FBTyxFQUFFLENBQUM7UUFDbkIsS0FBSyxDQUFDO1lBQ0osT0FBTyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RSxLQUFLLENBQUM7WUFDSixPQUFPLE9BQU8sQ0FDVixVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdEQsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM5RCxLQUFLLENBQUM7WUFDSixPQUFPLE9BQU8sQ0FDVixVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFDdEQsVUFBVSxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQ3RELFVBQVUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLG9CQUFvQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDOUQ7O1lBQ0UsTUFBTSxTQUFTLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQzdCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzVCLFNBQVMsQ0FBQyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUN2RTtZQUNELE9BQU8sT0FBTyxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUM7S0FDaEM7Q0FDRjs7QUFtQkQsYUFBYSxxQ0FBcUMsR0FBRyxFQUFFLENBQUM7Ozs7Ozs7OztBQUV4RCxNQUFNLHFCQUNGLElBQWMsRUFBRSxLQUFjLEVBQUUsb0JBQTZCLEVBQUUsTUFBYyxFQUM3RSxnQkFBcUIsUUFBUSxDQUFDLGtCQUFrQjtJQUNsRCxJQUFJLE1BQU0sQ0FBQyxLQUFLLGdCQUFpQixFQUFFO1FBQ2pDLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQztLQUNyQjs7SUFDRCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDdkIsSUFBSSxNQUFNLENBQUMsS0FBSyxtQkFBb0IsRUFBRTtRQUNwQyxhQUFhLEdBQUcsSUFBSSxDQUFDO0tBQ3RCOztJQUNELE1BQU0sUUFBUSxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUM7SUFFakMsSUFBSSxRQUFRLEtBQUsseUJBQXlCLEVBQUU7OztRQUcxQyxvQkFBb0IsR0FBRyxDQUFDLENBQUMsQ0FBQyxLQUFLLHVCQUFJLEtBQUssQ0FBQyxPQUFPLEdBQUcsYUFBYSxDQUFDLENBQUM7S0FDbkU7SUFFRCxJQUFJLEtBQUssSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLG1CQUFvQixDQUFDLEVBQUU7UUFDL0Msb0JBQW9CLEdBQUcsS0FBSyxDQUFDO1FBQzdCLEtBQUssc0JBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO0tBQ3hCOztJQUVELElBQUksVUFBVSxHQUFrQixJQUFJLENBQUM7SUFDckMsT0FBTyxVQUFVLEVBQUU7UUFDakIsSUFBSSxLQUFLLEVBQUU7WUFDVCxRQUFRLFFBQVEsRUFBRTtnQkFDaEIsS0FBSyxrQkFBa0IsQ0FBQyxDQUFDOztvQkFDdkIsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztvQkFDdkUsT0FBTyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztpQkFDbkM7Z0JBQ0QsS0FBSyxpQkFBaUIsQ0FBQyxDQUFDOztvQkFDdEIsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFVBQVUsRUFBRSxLQUFLLEVBQUUsb0JBQW9CLENBQUMsQ0FBQztvQkFDdkUsT0FBTyxRQUFRLENBQUMsUUFBUSxDQUFDO2lCQUMxQjtnQkFDRCxLQUFLLGtCQUFrQjtvQkFDckIsT0FBTyxJQUFJLFVBQVUsQ0FBQyxhQUFhLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQztnQkFDbEYsS0FBSyx3QkFBd0I7b0JBQzNCLE9BQU8sYUFBYSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsYUFBYSxDQUFDO2dCQUNsRSxLQUFLLG1CQUFtQixDQUFDLENBQUM7b0JBQ3hCLHVCQUFJLEtBQUssQ0FBQyxPQUFPLEdBQUcsUUFBUSxFQUFFO3dCQUM1QixPQUFPLGFBQWEsQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFFBQVEsQ0FBQztxQkFDNUQ7b0JBQ0QsTUFBTTtpQkFDUDtnQkFDRCxLQUFLLHlCQUF5QixDQUFDLENBQUM7O29CQUM5QixJQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsVUFBVSxFQUFFLEtBQUssRUFBRSxvQkFBb0IsQ0FBQyxDQUFDO29CQUNuRSxPQUFPLHVCQUF1QixDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUN4QztnQkFDRCxLQUFLLG1CQUFtQixDQUFDO2dCQUN6QixLQUFLLG1CQUFtQjtvQkFDdEIsT0FBTyxjQUFjLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO2dCQUMzQzs7b0JBQ0UsTUFBTSxXQUFXLHNCQUNiLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxvQkFBQyxLQUFLLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQyxDQUFDLG9CQUM5QixLQUFLLENBQUMsT0FBTyxHQUFHLGVBQWUsQ0FBQyxHQUFHLFFBQVEsRUFBRTtvQkFDekUsSUFBSSxXQUFXLEVBQUU7O3dCQUNmLElBQUksWUFBWSxHQUFHLGNBQWMsQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO3dCQUNyRSxJQUFJLENBQUMsWUFBWSxFQUFFOzRCQUNqQixZQUFZLEdBQUcsRUFBQyxRQUFRLEVBQUUsdUJBQXVCLENBQUMsVUFBVSxFQUFFLFdBQVcsQ0FBQyxFQUFDLENBQUM7NEJBQzVFLFVBQVUsQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxxQkFBRyxZQUFtQixDQUFBLENBQUM7eUJBQy9EO3dCQUNELE9BQU8sWUFBWSxDQUFDLFFBQVEsQ0FBQztxQkFDOUI7YUFDSjtTQUNGO1FBRUQsb0JBQW9CLEdBQUcsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ25ELEtBQUssc0JBQUcsWUFBWSxDQUFDLFVBQVUsQ0FBQyxFQUFFLENBQUM7UUFDbkMsVUFBVSxzQkFBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFakMsSUFBSSxNQUFNLENBQUMsS0FBSyxlQUFnQixFQUFFO1lBQ2hDLFVBQVUsR0FBRyxJQUFJLENBQUM7U0FDbkI7S0FDRjs7SUFFRCxNQUFNLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxxQ0FBcUMsQ0FBQyxDQUFDO0lBRS9GLElBQUksS0FBSyxLQUFLLHFDQUFxQztRQUMvQyxhQUFhLEtBQUsscUNBQXFDLEVBQUU7Ozs7OztRQU0zRCxPQUFPLEtBQUssQ0FBQztLQUNkO0lBRUQsT0FBTyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsYUFBYSxDQUFDLENBQUM7Q0FDMUU7Ozs7Ozs7QUFFRCxzQkFBc0IsSUFBYyxFQUFFLEtBQWMsRUFBRSxvQkFBNkI7O0lBQ2pGLElBQUksUUFBUSxDQUFXO0lBQ3ZCLElBQUksb0JBQW9CLEVBQUU7UUFDeEIsUUFBUSxHQUFHLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztLQUMvRDtTQUFNO1FBQ0wsUUFBUSxHQUFHLElBQUksQ0FBQztRQUNoQixPQUFPLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7WUFDcEQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7U0FDNUI7S0FDRjtJQUNELE9BQU8sUUFBUSxDQUFDO0NBQ2pCOzs7Ozs7Ozs7O0FBRUQsb0JBQ0ksSUFBYyxFQUFFLFlBQTBCLEVBQUUsR0FBWSxFQUFFLFVBQWtCLEVBQUUsS0FBVSxFQUN4RixPQUFzQjtJQUN4QixJQUFJLEdBQUcsQ0FBQyxLQUFLLHdCQUFzQixFQUFFOztRQUNuQyxNQUFNLFFBQVEsR0FBRyxhQUFhLENBQUMsSUFBSSxxQkFBRSxHQUFHLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLGFBQWEsQ0FBQztRQUMzRSxJQUFJLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxpQkFBbUIsRUFBRTtZQUN6QyxRQUFRLENBQUMsS0FBSyx5QkFBMkIsQ0FBQztTQUMzQztLQUNGOztJQUNELE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7O0lBQ3pDLE1BQU0sUUFBUSxzQkFBRyxPQUFPLENBQUMsSUFBSSxHQUFHOzs7O0lBSWhDLFlBQVksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsS0FBSyxDQUFDO0lBQ3hDLElBQUksR0FBRyxDQUFDLEtBQUsseUJBQXNCLEVBQUU7UUFDbkMsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7O1FBQ3hCLE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUM7O1FBQ3BGLE1BQU0sT0FBTyxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekMsT0FBTyxvQkFBQyxPQUFPLENBQUMsZUFBZSxHQUFHO1lBQzlCLElBQUksWUFBWSxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxxQkFBdUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0tBQ2xGO0lBQ0QsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsWUFBWSxHQUFHLFVBQVUsQ0FBQyxHQUFHLEtBQUssQ0FBQztJQUN0RCxPQUFPLE9BQU8sQ0FBQztDQUNoQjs7Ozs7O0FBNkNELE1BQU0sMENBQTBDLElBQWMsRUFBRSxVQUFxQjtJQUNuRixJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsR0FBRyxVQUFVLENBQUMsRUFBRTtRQUN0QyxPQUFPO0tBQ1I7O0lBQ0QsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUM7O0lBQzdCLElBQUksU0FBUyxHQUFHLENBQUMsQ0FBQztJQUNsQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTs7UUFDckMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDOztRQUN6QixJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsTUFBTSxDQUFDO1FBQzVCLElBQUksQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLEVBQUU7O1lBRXpDLHNCQUFzQixDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztTQUMxRTtRQUNELElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsRUFBRTs7WUFFM0MsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUM7U0FDekI7UUFDRCxPQUFPLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLHNCQUF3QixDQUFDO1lBQ2hELENBQUMsS0FBSyxNQUFNLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxVQUFVLEVBQUU7O1lBRWpELElBQUksTUFBTSxDQUFDLGdCQUFnQixHQUFHLFVBQVUsRUFBRTtnQkFDeEMsU0FBUyxHQUFHLDhCQUE4QixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO2FBQ2pGO1lBQ0QsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUM7U0FDeEI7S0FDRjtDQUNGOzs7Ozs7OztBQUVELHdDQUNJLElBQWMsRUFBRSxLQUFjLEVBQUUsVUFBcUIsRUFBRSxTQUFpQjtJQUMxRSxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxTQUFTLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxVQUFVLEVBQUUsQ0FBQyxFQUFFLEVBQUU7O1FBQzlFLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xDLElBQUksT0FBTyxDQUFDLEtBQUssR0FBRyxVQUFVLEVBQUU7WUFDOUIsc0JBQXNCLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxHQUFHLFVBQVUsRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO1NBQzFFOztRQUVELENBQUMsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDO0tBQ3pCO0lBQ0QsT0FBTyxTQUFTLENBQUM7Q0FDbEI7Ozs7Ozs7O0FBRUQsZ0NBQ0ksSUFBYyxFQUFFLEtBQWEsRUFBRSxVQUFxQixFQUFFLFNBQWlCOztJQUN6RSxNQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ2pELElBQUksQ0FBQyxZQUFZLEVBQUU7UUFDakIsT0FBTztLQUNSOztJQUNELE1BQU0sUUFBUSxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNiLE9BQU87S0FDUjtJQUNELFFBQVEsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3JDLElBQUksVUFBVSxpQ0FBNkI7UUFDdkMsMkJBQTJCLENBQUMsSUFBSSwrQ0FBK0MsU0FBUyxDQUFDLEVBQUU7UUFDN0YsUUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7S0FDL0I7SUFDRCxJQUFJLFVBQVUsb0NBQWdDLEVBQUU7UUFDOUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUM7S0FDbEM7SUFDRCxJQUFJLFVBQVUsOEJBQTBCO1FBQ3BDLDJCQUEyQixDQUFDLElBQUksNENBQTRDLFNBQVMsQ0FBQyxFQUFFO1FBQzFGLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUM1QjtJQUNELElBQUksVUFBVSxpQ0FBNkIsRUFBRTtRQUMzQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztLQUMvQjtJQUNELElBQUksVUFBVSx5QkFBc0IsRUFBRTtRQUNwQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDeEI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiwgU2ltcGxlQ2hhbmdlLCBTaW1wbGVDaGFuZ2VzLCBXcmFwcGVkVmFsdWV9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0lOSkVDVE9SLCBJbmplY3RvciwgcmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2RpJztcbmltcG9ydCB7RWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7VGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIgYXMgUmVuZGVyZXJWMSwgUmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXIvYXBpJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsJztcbmltcG9ydCB7aXNPYnNlcnZhYmxlfSBmcm9tICcuLi91dGlsL2xhbmcnO1xuXG5pbXBvcnQge2NyZWF0ZUNoYW5nZURldGVjdG9yUmVmLCBjcmVhdGVJbmplY3RvciwgY3JlYXRlUmVuZGVyZXJWMX0gZnJvbSAnLi9yZWZzJztcbmltcG9ydCB7QmluZGluZ0RlZiwgQmluZGluZ0ZsYWdzLCBEZXBEZWYsIERlcEZsYWdzLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE91dHB1dERlZiwgT3V0cHV0VHlwZSwgUHJvdmlkZXJEYXRhLCBRdWVyeVZhbHVlVHlwZSwgU2VydmljZXMsIFZpZXdEYXRhLCBWaWV3RmxhZ3MsIFZpZXdTdGF0ZSwgYXNFbGVtZW50RGF0YSwgYXNQcm92aWRlckRhdGEsIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9va30gZnJvbSAnLi90eXBlcyc7XG5pbXBvcnQge2NhbGNCaW5kaW5nRmxhZ3MsIGNoZWNrQmluZGluZywgZGlzcGF0Y2hFdmVudCwgaXNDb21wb25lbnRWaWV3LCBzcGxpdERlcHNEc2wsIHNwbGl0TWF0Y2hlZFF1ZXJpZXNEc2wsIHRva2VuS2V5LCB2aWV3UGFyZW50RWx9IGZyb20gJy4vdXRpbCc7XG5cbmNvbnN0IFJlbmRlcmVyVjFUb2tlbktleSA9IHRva2VuS2V5KFJlbmRlcmVyVjEpO1xuY29uc3QgUmVuZGVyZXIyVG9rZW5LZXkgPSB0b2tlbktleShSZW5kZXJlcjIpO1xuY29uc3QgRWxlbWVudFJlZlRva2VuS2V5ID0gdG9rZW5LZXkoRWxlbWVudFJlZik7XG5jb25zdCBWaWV3Q29udGFpbmVyUmVmVG9rZW5LZXkgPSB0b2tlbktleShWaWV3Q29udGFpbmVyUmVmKTtcbmNvbnN0IFRlbXBsYXRlUmVmVG9rZW5LZXkgPSB0b2tlbktleShUZW1wbGF0ZVJlZik7XG5jb25zdCBDaGFuZ2VEZXRlY3RvclJlZlRva2VuS2V5ID0gdG9rZW5LZXkoQ2hhbmdlRGV0ZWN0b3JSZWYpO1xuY29uc3QgSW5qZWN0b3JSZWZUb2tlbktleSA9IHRva2VuS2V5KEluamVjdG9yKTtcbmNvbnN0IElOSkVDVE9SUmVmVG9rZW5LZXkgPSB0b2tlbktleShJTkpFQ1RPUik7XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVEZWYoXG4gICAgY2hlY2tJbmRleDogbnVtYmVyLCBmbGFnczogTm9kZUZsYWdzLFxuICAgIG1hdGNoZWRRdWVyaWVzOiBudWxsIHwgW3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10sIGNoaWxkQ291bnQ6IG51bWJlciwgY3RvcjogYW55LFxuICAgIGRlcHM6IChbRGVwRmxhZ3MsIGFueV0gfCBhbnkpW10sIHByb3BzPzogbnVsbCB8IHtbbmFtZTogc3RyaW5nXTogW251bWJlciwgc3RyaW5nXX0sXG4gICAgb3V0cHV0cz86IG51bGwgfCB7W25hbWU6IHN0cmluZ106IHN0cmluZ30pOiBOb2RlRGVmIHtcbiAgY29uc3QgYmluZGluZ3M6IEJpbmRpbmdEZWZbXSA9IFtdO1xuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIHByb3BzKSB7XG4gICAgICBjb25zdCBbYmluZGluZ0luZGV4LCBub25NaW5pZmllZE5hbWVdID0gcHJvcHNbcHJvcF07XG4gICAgICBiaW5kaW5nc1tiaW5kaW5nSW5kZXhdID0ge1xuICAgICAgICBmbGFnczogQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSxcbiAgICAgICAgbmFtZTogcHJvcCwgbm9uTWluaWZpZWROYW1lLFxuICAgICAgICBuczogbnVsbCxcbiAgICAgICAgc2VjdXJpdHlDb250ZXh0OiBudWxsLFxuICAgICAgICBzdWZmaXg6IG51bGxcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGNvbnN0IG91dHB1dERlZnM6IE91dHB1dERlZltdID0gW107XG4gIGlmIChvdXRwdXRzKSB7XG4gICAgZm9yIChsZXQgcHJvcE5hbWUgaW4gb3V0cHV0cykge1xuICAgICAgb3V0cHV0RGVmcy5wdXNoKFxuICAgICAgICAgIHt0eXBlOiBPdXRwdXRUeXBlLkRpcmVjdGl2ZU91dHB1dCwgcHJvcE5hbWUsIHRhcmdldDogbnVsbCwgZXZlbnROYW1lOiBvdXRwdXRzW3Byb3BOYW1lXX0pO1xuICAgIH1cbiAgfVxuICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZTtcbiAgcmV0dXJuIF9kZWYoXG4gICAgICBjaGVja0luZGV4LCBmbGFncywgbWF0Y2hlZFF1ZXJpZXMsIGNoaWxkQ291bnQsIGN0b3IsIGN0b3IsIGRlcHMsIGJpbmRpbmdzLCBvdXRwdXREZWZzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpcGVEZWYoZmxhZ3M6IE5vZGVGbGFncywgY3RvcjogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldIHwgYW55KVtdKTogTm9kZURlZiB7XG4gIGZsYWdzIHw9IE5vZGVGbGFncy5UeXBlUGlwZTtcbiAgcmV0dXJuIF9kZWYoLTEsIGZsYWdzLCBudWxsLCAwLCBjdG9yLCBjdG9yLCBkZXBzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHByb3ZpZGVyRGVmKFxuICAgIGZsYWdzOiBOb2RlRmxhZ3MsIG1hdGNoZWRRdWVyaWVzOiBudWxsIHwgW3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10sIHRva2VuOiBhbnksXG4gICAgdmFsdWU6IGFueSwgZGVwczogKFtEZXBGbGFncywgYW55XSB8IGFueSlbXSk6IE5vZGVEZWYge1xuICByZXR1cm4gX2RlZigtMSwgZmxhZ3MsIG1hdGNoZWRRdWVyaWVzLCAwLCB0b2tlbiwgdmFsdWUsIGRlcHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2RlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIGZsYWdzOiBOb2RlRmxhZ3MsXG4gICAgbWF0Y2hlZFF1ZXJpZXNEc2w6IFtzdHJpbmcgfCBudW1iZXIsIFF1ZXJ5VmFsdWVUeXBlXVtdIHwgbnVsbCwgY2hpbGRDb3VudDogbnVtYmVyLCB0b2tlbjogYW55LFxuICAgIHZhbHVlOiBhbnksIGRlcHM6IChbRGVwRmxhZ3MsIGFueV0gfCBhbnkpW10sIGJpbmRpbmdzPzogQmluZGluZ0RlZltdLFxuICAgIG91dHB1dHM/OiBPdXRwdXREZWZbXSk6IE5vZGVEZWYge1xuICBjb25zdCB7bWF0Y2hlZFF1ZXJpZXMsIHJlZmVyZW5jZXMsIG1hdGNoZWRRdWVyeUlkc30gPSBzcGxpdE1hdGNoZWRRdWVyaWVzRHNsKG1hdGNoZWRRdWVyaWVzRHNsKTtcbiAgaWYgKCFvdXRwdXRzKSB7XG4gICAgb3V0cHV0cyA9IFtdO1xuICB9XG4gIGlmICghYmluZGluZ3MpIHtcbiAgICBiaW5kaW5ncyA9IFtdO1xuICB9XG4gIC8vIE5lZWQgdG8gcmVzb2x2ZSBmb3J3YXJkUmVmcyBhcyBlLmcuIGZvciBgdXNlVmFsdWVgIHdlXG4gIC8vIGxvd2VyZWQgdGhlIGV4cHJlc3Npb24gYW5kIHRoZW4gc3RvcHBlZCBldmFsdWF0aW5nIGl0LFxuICAvLyBpLmUuIGFsc28gZGlkbid0IHVud3JhcCBpdC5cbiAgdmFsdWUgPSByZXNvbHZlRm9yd2FyZFJlZih2YWx1ZSk7XG5cbiAgY29uc3QgZGVwRGVmcyA9IHNwbGl0RGVwc0RzbChkZXBzLCBzdHJpbmdpZnkodG9rZW4pKTtcblxuICByZXR1cm4ge1xuICAgIC8vIHdpbGwgYmV0IHNldCBieSB0aGUgdmlldyBkZWZpbml0aW9uXG4gICAgbm9kZUluZGV4OiAtMSxcbiAgICBwYXJlbnQ6IG51bGwsXG4gICAgcmVuZGVyUGFyZW50OiBudWxsLFxuICAgIGJpbmRpbmdJbmRleDogLTEsXG4gICAgb3V0cHV0SW5kZXg6IC0xLFxuICAgIC8vIHJlZ3VsYXIgdmFsdWVzXG4gICAgY2hlY2tJbmRleCxcbiAgICBmbGFncyxcbiAgICBjaGlsZEZsYWdzOiAwLFxuICAgIGRpcmVjdENoaWxkRmxhZ3M6IDAsXG4gICAgY2hpbGRNYXRjaGVkUXVlcmllczogMCwgbWF0Y2hlZFF1ZXJpZXMsIG1hdGNoZWRRdWVyeUlkcywgcmVmZXJlbmNlcyxcbiAgICBuZ0NvbnRlbnRJbmRleDogLTEsIGNoaWxkQ291bnQsIGJpbmRpbmdzLFxuICAgIGJpbmRpbmdGbGFnczogY2FsY0JpbmRpbmdGbGFncyhiaW5kaW5ncyksIG91dHB1dHMsXG4gICAgZWxlbWVudDogbnVsbCxcbiAgICBwcm92aWRlcjoge3Rva2VuLCB2YWx1ZSwgZGVwczogZGVwRGVmc30sXG4gICAgdGV4dDogbnVsbCxcbiAgICBxdWVyeTogbnVsbCxcbiAgICBuZ0NvbnRlbnQ6IG51bGxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVByb3ZpZGVySW5zdGFuY2UodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIHJldHVybiBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3LCBkZWYpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUGlwZUluc3RhbmNlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICAvLyBkZXBzIGFyZSBsb29rZWQgdXAgZnJvbSBjb21wb25lbnQuXG4gIGxldCBjb21wVmlldyA9IHZpZXc7XG4gIHdoaWxlIChjb21wVmlldy5wYXJlbnQgJiYgIWlzQ29tcG9uZW50Vmlldyhjb21wVmlldykpIHtcbiAgICBjb21wVmlldyA9IGNvbXBWaWV3LnBhcmVudDtcbiAgfVxuICAvLyBwaXBlcyBjYW4gc2VlIHRoZSBwcml2YXRlIHNlcnZpY2VzIG9mIHRoZSBjb21wb25lbnRcbiAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPSB0cnVlO1xuICAvLyBwaXBlcyBhcmUgYWx3YXlzIGVhZ2VyIGFuZCBjbGFzc2VzIVxuICByZXR1cm4gY3JlYXRlQ2xhc3MoXG4gICAgICBjb21wVmlldy5wYXJlbnQgISwgdmlld1BhcmVudEVsKGNvbXBWaWV3KSAhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVmLnByb3ZpZGVyICEudmFsdWUsXG4gICAgICBkZWYucHJvdmlkZXIgIS5kZXBzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZUluc3RhbmNlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICAvLyBjb21wb25lbnRzIGNhbiBzZWUgb3RoZXIgcHJpdmF0ZSBzZXJ2aWNlcywgb3RoZXIgZGlyZWN0aXZlcyBjYW4ndC5cbiAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPSAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkgPiAwO1xuICAvLyBkaXJlY3RpdmVzIGFyZSBhbHdheXMgZWFnZXIgYW5kIGNsYXNzZXMhXG4gIGNvbnN0IGluc3RhbmNlID0gY3JlYXRlQ2xhc3MoXG4gICAgICB2aWV3LCBkZWYucGFyZW50ICEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZWYucHJvdmlkZXIgIS52YWx1ZSwgZGVmLnByb3ZpZGVyICEuZGVwcyk7XG4gIGlmIChkZWYub3V0cHV0cy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvdXRwdXQgPSBkZWYub3V0cHV0c1tpXTtcbiAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBpbnN0YW5jZVtvdXRwdXQucHJvcE5hbWUgIV07XG4gICAgICBpZiAoaXNPYnNlcnZhYmxlKG91dHB1dE9ic2VydmFibGUpKSB7XG4gICAgICAgIGNvbnN0IHN1YnNjcmlwdGlvbiA9IG91dHB1dE9ic2VydmFibGUuc3Vic2NyaWJlKFxuICAgICAgICAgICAgZXZlbnRIYW5kbGVyQ2xvc3VyZSh2aWV3LCBkZWYucGFyZW50ICEubm9kZUluZGV4LCBvdXRwdXQuZXZlbnROYW1lKSk7XG4gICAgICAgIHZpZXcuZGlzcG9zYWJsZXMgIVtkZWYub3V0cHV0SW5kZXggKyBpXSA9IHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZS5iaW5kKHN1YnNjcmlwdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgQE91dHB1dCAke291dHB1dC5wcm9wTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2luc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBldmVudEhhbmRsZXJDbG9zdXJlKHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZykge1xuICByZXR1cm4gKGV2ZW50OiBhbnkpID0+IGRpc3BhdGNoRXZlbnQodmlldywgaW5kZXgsIGV2ZW50TmFtZSwgZXZlbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVJbmxpbmUoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSxcbiAgICB2NzogYW55LCB2ODogYW55LCB2OTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICBjb25zdCBkaXJlY3RpdmUgPSBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGxldCBjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzID0gdW5kZWZpbmVkICE7XG4gIGNvbnN0IGJpbmRMZW4gPSBkZWYuYmluZGluZ3MubGVuZ3RoO1xuICBpZiAoYmluZExlbiA+IDAgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgMCwgdjApKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDAsIHYwLCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDEgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgMSwgdjEpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDEsIHYxLCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDIgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgMiwgdjIpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDIsIHYyLCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDMgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgMywgdjMpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDMsIHYzLCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDQgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgNCwgdjQpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDQsIHY0LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDUgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgNSwgdjUpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDUsIHY1LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDYgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgNiwgdjYpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDYsIHY2LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDcgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgNywgdjcpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDcsIHY3LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDggJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgOCwgdjgpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDgsIHY4LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoYmluZExlbiA+IDkgJiYgY2hlY2tCaW5kaW5nKHZpZXcsIGRlZiwgOSwgdjkpKSB7XG4gICAgY2hhbmdlZCA9IHRydWU7XG4gICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIDksIHY5LCBjaGFuZ2VzKTtcbiAgfVxuICBpZiAoY2hhbmdlcykge1xuICAgIGRpcmVjdGl2ZS5uZ09uQ2hhbmdlcyhjaGFuZ2VzKTtcbiAgfVxuICBpZiAoKGRlZi5mbGFncyAmIE5vZGVGbGFncy5PbkluaXQpICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nT25Jbml0LCBkZWYubm9kZUluZGV4KSkge1xuICAgIGRpcmVjdGl2ZS5uZ09uSW5pdCgpO1xuICB9XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuRG9DaGVjaykge1xuICAgIGRpcmVjdGl2ZS5uZ0RvQ2hlY2soKTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrQW5kVXBkYXRlRGlyZWN0aXZlRHluYW1pYyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2YWx1ZXM6IGFueVtdKTogYm9vbGVhbiB7XG4gIGNvbnN0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICBjb25zdCBkaXJlY3RpdmUgPSBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGxldCBjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzID0gdW5kZWZpbmVkICE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIGksIHZhbHVlc1tpXSkpIHtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIGksIHZhbHVlc1tpXSwgY2hhbmdlcyk7XG4gICAgfVxuICB9XG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgZGlyZWN0aXZlLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG4gIGlmICgoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uSW5pdCkgJiZcbiAgICAgIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vayh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdPbkluaXQsIGRlZi5ub2RlSW5kZXgpKSB7XG4gICAgZGlyZWN0aXZlLm5nT25Jbml0KCk7XG4gIH1cbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Eb0NoZWNrKSB7XG4gICAgZGlyZWN0aXZlLm5nRG9DaGVjaygpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgLy8gcHJpdmF0ZSBzZXJ2aWNlcyBjYW4gc2VlIG90aGVyIHByaXZhdGUgc2VydmljZXNcbiAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPSAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlByaXZhdGVQcm92aWRlcikgPiAwO1xuICBjb25zdCBwcm92aWRlckRlZiA9IGRlZi5wcm92aWRlcjtcbiAgc3dpdGNoIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlQ2xhc3NQcm92aWRlcjpcbiAgICAgIHJldHVybiBjcmVhdGVDbGFzcyhcbiAgICAgICAgICB2aWV3LCBkZWYucGFyZW50ICEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBwcm92aWRlckRlZiAhLnZhbHVlLCBwcm92aWRlckRlZiAhLmRlcHMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVGYWN0b3J5UHJvdmlkZXI6XG4gICAgICByZXR1cm4gY2FsbEZhY3RvcnkoXG4gICAgICAgICAgdmlldywgZGVmLnBhcmVudCAhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgcHJvdmlkZXJEZWYgIS52YWx1ZSwgcHJvdmlkZXJEZWYgIS5kZXBzKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVXNlRXhpc3RpbmdQcm92aWRlcjpcbiAgICAgIHJldHVybiByZXNvbHZlRGVwKHZpZXcsIGRlZi5wYXJlbnQgISwgYWxsb3dQcml2YXRlU2VydmljZXMsIHByb3ZpZGVyRGVmICEuZGVwc1swXSk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVZhbHVlUHJvdmlkZXI6XG4gICAgICByZXR1cm4gcHJvdmlkZXJEZWYgIS52YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDbGFzcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuLCBjdG9yOiBhbnksIGRlcHM6IERlcERlZltdKTogYW55IHtcbiAgY29uc3QgbGVuID0gZGVwcy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1sxXSkpO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBuZXcgY3RvcihcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMV0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzJdKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IGRlcFZhbHVlcyA9IG5ldyBBcnJheShsZW4pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBkZXBWYWx1ZXNbaV0gPSByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gbmV3IGN0b3IoLi4uZGVwVmFsdWVzKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYWxsRmFjdG9yeShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuLCBmYWN0b3J5OiBhbnksXG4gICAgZGVwczogRGVwRGVmW10pOiBhbnkge1xuICBjb25zdCBsZW4gPSBkZXBzLmxlbmd0aDtcbiAgc3dpdGNoIChsZW4pIHtcbiAgICBjYXNlIDA6XG4gICAgICByZXR1cm4gZmFjdG9yeSgpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBmYWN0b3J5KHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSk7XG4gICAgY2FzZSAzOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1syXSkpO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zdCBkZXBWYWx1ZXMgPSBBcnJheShsZW4pO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBkZXBWYWx1ZXNbaV0gPSByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1tpXSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFjdG9yeSguLi5kZXBWYWx1ZXMpO1xuICB9XG59XG5cbi8vIFRoaXMgZGVmYXVsdCB2YWx1ZSBpcyB3aGVuIGNoZWNraW5nIHRoZSBoaWVyYXJjaHkgZm9yIGEgdG9rZW4uXG4vL1xuLy8gSXQgbWVhbnMgYm90aDpcbi8vIC0gdGhlIHRva2VuIGlzIG5vdCBwcm92aWRlZCBieSB0aGUgY3VycmVudCBpbmplY3Rvcixcbi8vIC0gb25seSB0aGUgZWxlbWVudCBpbmplY3RvcnMgc2hvdWxkIGJlIGNoZWNrZWQgKGllIGRvIG5vdCBjaGVjayBtb2R1bGUgaW5qZWN0b3JzXG4vL1xuLy8gICAgICAgICAgbW9kMVxuLy8gICAgICAgICAvXG4vLyAgICAgICBlbDEgICBtb2QyXG4vLyAgICAgICAgIFxcICAvXG4vLyAgICAgICAgIGVsMlxuLy9cbi8vIFdoZW4gcmVxdWVzdGluZyBlbDIuaW5qZWN0b3IuZ2V0KHRva2VuKSwgd2Ugc2hvdWxkIGNoZWNrIGluIHRoZSBmb2xsb3dpbmcgb3JkZXIgYW5kIHJldHVybiB0aGVcbi8vIGZpcnN0IGZvdW5kIHZhbHVlOlxuLy8gLSBlbDIuaW5qZWN0b3IuZ2V0KHRva2VuLCBkZWZhdWx0KVxuLy8gLSBlbDEuaW5qZWN0b3IuZ2V0KHRva2VuLCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKSAtPiBkbyBub3QgY2hlY2sgdGhlIG1vZHVsZVxuLy8gLSBtb2QyLmluamVjdG9yLmdldCh0b2tlbiwgZGVmYXVsdClcbmV4cG9ydCBjb25zdCBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGVwKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgYWxsb3dQcml2YXRlU2VydmljZXM6IGJvb2xlYW4sIGRlcERlZjogRGVwRGVmLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5WYWx1ZSkge1xuICAgIHJldHVybiBkZXBEZWYudG9rZW47XG4gIH1cbiAgY29uc3Qgc3RhcnRWaWV3ID0gdmlldztcbiAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLk9wdGlvbmFsKSB7XG4gICAgbm90Rm91bmRWYWx1ZSA9IG51bGw7XG4gIH1cbiAgY29uc3QgdG9rZW5LZXkgPSBkZXBEZWYudG9rZW5LZXk7XG5cbiAgaWYgKHRva2VuS2V5ID09PSBDaGFuZ2VEZXRlY3RvclJlZlRva2VuS2V5KSB7XG4gICAgLy8gZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBlbGVtZW50IGFzIGEgY29tcG9uZW50IHNob3VsZCBiZSBhYmxlIHRvIGNvbnRyb2wgdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgIC8vIG9mIHRoYXQgY29tcG9uZW50IGFzIHdlbGwuXG4gICAgYWxsb3dQcml2YXRlU2VydmljZXMgPSAhIShlbERlZiAmJiBlbERlZi5lbGVtZW50ICEuY29tcG9uZW50Vmlldyk7XG4gIH1cblxuICBpZiAoZWxEZWYgJiYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNraXBTZWxmKSkge1xuICAgIGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gZmFsc2U7XG4gICAgZWxEZWYgPSBlbERlZi5wYXJlbnQgITtcbiAgfVxuXG4gIGxldCBzZWFyY2hWaWV3OiBWaWV3RGF0YXxudWxsID0gdmlldztcbiAgd2hpbGUgKHNlYXJjaFZpZXcpIHtcbiAgICBpZiAoZWxEZWYpIHtcbiAgICAgIHN3aXRjaCAodG9rZW5LZXkpIHtcbiAgICAgICAgY2FzZSBSZW5kZXJlclYxVG9rZW5LZXk6IHtcbiAgICAgICAgICBjb25zdCBjb21wVmlldyA9IGZpbmRDb21wVmlldyhzZWFyY2hWaWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMpO1xuICAgICAgICAgIHJldHVybiBjcmVhdGVSZW5kZXJlclYxKGNvbXBWaWV3KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIFJlbmRlcmVyMlRva2VuS2V5OiB7XG4gICAgICAgICAgY29uc3QgY29tcFZpZXcgPSBmaW5kQ29tcFZpZXcoc2VhcmNoVmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzKTtcbiAgICAgICAgICByZXR1cm4gY29tcFZpZXcucmVuZGVyZXI7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBFbGVtZW50UmVmVG9rZW5LZXk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50UmVmKGFzRWxlbWVudERhdGEoc2VhcmNoVmlldywgZWxEZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50KTtcbiAgICAgICAgY2FzZSBWaWV3Q29udGFpbmVyUmVmVG9rZW5LZXk6XG4gICAgICAgICAgcmV0dXJuIGFzRWxlbWVudERhdGEoc2VhcmNoVmlldywgZWxEZWYubm9kZUluZGV4KS52aWV3Q29udGFpbmVyO1xuICAgICAgICBjYXNlIFRlbXBsYXRlUmVmVG9rZW5LZXk6IHtcbiAgICAgICAgICBpZiAoZWxEZWYuZWxlbWVudCAhLnRlbXBsYXRlKSB7XG4gICAgICAgICAgICByZXR1cm4gYXNFbGVtZW50RGF0YShzZWFyY2hWaWV3LCBlbERlZi5ub2RlSW5kZXgpLnRlbXBsYXRlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgICBjYXNlIENoYW5nZURldGVjdG9yUmVmVG9rZW5LZXk6IHtcbiAgICAgICAgICBsZXQgY2RWaWV3ID0gZmluZENvbXBWaWV3KHNlYXJjaFZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyk7XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKGNkVmlldyk7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBJbmplY3RvclJlZlRva2VuS2V5OlxuICAgICAgICBjYXNlIElOSkVDVE9SUmVmVG9rZW5LZXk6XG4gICAgICAgICAgcmV0dXJuIGNyZWF0ZUluamVjdG9yKHNlYXJjaFZpZXcsIGVsRGVmKTtcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICBjb25zdCBwcm92aWRlckRlZiA9XG4gICAgICAgICAgICAgIChhbGxvd1ByaXZhdGVTZXJ2aWNlcyA/IGVsRGVmLmVsZW1lbnQgIS5hbGxQcm92aWRlcnMgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERlZi5lbGVtZW50ICEucHVibGljUHJvdmlkZXJzKSAhW3Rva2VuS2V5XTtcbiAgICAgICAgICBpZiAocHJvdmlkZXJEZWYpIHtcbiAgICAgICAgICAgIGxldCBwcm92aWRlckRhdGEgPSBhc1Byb3ZpZGVyRGF0YShzZWFyY2hWaWV3LCBwcm92aWRlckRlZi5ub2RlSW5kZXgpO1xuICAgICAgICAgICAgaWYgKCFwcm92aWRlckRhdGEpIHtcbiAgICAgICAgICAgICAgcHJvdmlkZXJEYXRhID0ge2luc3RhbmNlOiBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZShzZWFyY2hWaWV3LCBwcm92aWRlckRlZil9O1xuICAgICAgICAgICAgICBzZWFyY2hWaWV3Lm5vZGVzW3Byb3ZpZGVyRGVmLm5vZGVJbmRleF0gPSBwcm92aWRlckRhdGEgYXMgYW55O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHByb3ZpZGVyRGF0YS5pbnN0YW5jZTtcbiAgICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgYWxsb3dQcml2YXRlU2VydmljZXMgPSBpc0NvbXBvbmVudFZpZXcoc2VhcmNoVmlldyk7XG4gICAgZWxEZWYgPSB2aWV3UGFyZW50RWwoc2VhcmNoVmlldykgITtcbiAgICBzZWFyY2hWaWV3ID0gc2VhcmNoVmlldy5wYXJlbnQgITtcblxuICAgIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5TZWxmKSB7XG4gICAgICBzZWFyY2hWaWV3ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBjb25zdCB2YWx1ZSA9IHN0YXJ0Vmlldy5yb290LmluamVjdG9yLmdldChkZXBEZWYudG9rZW4sIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpO1xuXG4gIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikge1xuICAgIC8vIFJldHVybiB0aGUgdmFsdWUgZnJvbSB0aGUgcm9vdCBlbGVtZW50IGluamVjdG9yIHdoZW5cbiAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgLy8gLSB0aGUgbW9kdWxlIGluamVjdG9yIHNob3VsZCBub3QgYmUgY2hlY2tlZFxuICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHN0YXJ0Vmlldy5yb290Lm5nTW9kdWxlLmluamVjdG9yLmdldChkZXBEZWYudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmaW5kQ29tcFZpZXcodmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbikge1xuICBsZXQgY29tcFZpZXc6IFZpZXdEYXRhO1xuICBpZiAoYWxsb3dQcml2YXRlU2VydmljZXMpIHtcbiAgICBjb21wVmlldyA9IGFzRWxlbWVudERhdGEodmlldywgZWxEZWYubm9kZUluZGV4KS5jb21wb25lbnRWaWV3O1xuICB9IGVsc2Uge1xuICAgIGNvbXBWaWV3ID0gdmlldztcbiAgICB3aGlsZSAoY29tcFZpZXcucGFyZW50ICYmICFpc0NvbXBvbmVudFZpZXcoY29tcFZpZXcpKSB7XG4gICAgICBjb21wVmlldyA9IGNvbXBWaWV3LnBhcmVudDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbXBWaWV3O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVQcm9wKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBwcm92aWRlckRhdGE6IFByb3ZpZGVyRGF0YSwgZGVmOiBOb2RlRGVmLCBiaW5kaW5nSWR4OiBudW1iZXIsIHZhbHVlOiBhbnksXG4gICAgY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IFNpbXBsZUNoYW5nZXMge1xuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvbXBWaWV3ID0gYXNFbGVtZW50RGF0YSh2aWV3LCBkZWYucGFyZW50ICEubm9kZUluZGV4KS5jb21wb25lbnRWaWV3O1xuICAgIGlmIChjb21wVmlldy5kZWYuZmxhZ3MgJiBWaWV3RmxhZ3MuT25QdXNoKSB7XG4gICAgICBjb21wVmlldy5zdGF0ZSB8PSBWaWV3U3RhdGUuQ2hlY2tzRW5hYmxlZDtcbiAgICB9XG4gIH1cbiAgY29uc3QgYmluZGluZyA9IGRlZi5iaW5kaW5nc1tiaW5kaW5nSWR4XTtcbiAgY29uc3QgcHJvcE5hbWUgPSBiaW5kaW5nLm5hbWUgITtcbiAgLy8gTm90ZTogVGhpcyBpcyBzdGlsbCBzYWZlIHdpdGggQ2xvc3VyZSBDb21waWxlciBhc1xuICAvLyB0aGUgdXNlciBwYXNzZWQgaW4gdGhlIHByb3BlcnR5IG5hbWUgYXMgYW4gb2JqZWN0IGhhcyB0byBgcHJvdmlkZXJEZWZgLFxuICAvLyBzbyBDbG9zdXJlIENvbXBpbGVyIHdpbGwgaGF2ZSByZW5hbWVkIHRoZSBwcm9wZXJ0eSBjb3JyZWN0bHkgYWxyZWFkeS5cbiAgcHJvdmlkZXJEYXRhLmluc3RhbmNlW3Byb3BOYW1lXSA9IHZhbHVlO1xuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uQ2hhbmdlcykge1xuICAgIGNoYW5nZXMgPSBjaGFuZ2VzIHx8IHt9O1xuICAgIGNvbnN0IG9sZFZhbHVlID0gV3JhcHBlZFZhbHVlLnVud3JhcCh2aWV3Lm9sZFZhbHVlc1tkZWYuYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeF0pO1xuICAgIGNvbnN0IGJpbmRpbmcgPSBkZWYuYmluZGluZ3NbYmluZGluZ0lkeF07XG4gICAgY2hhbmdlc1tiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSAhXSA9XG4gICAgICAgIG5ldyBTaW1wbGVDaGFuZ2Uob2xkVmFsdWUsIHZhbHVlLCAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5GaXJzdENoZWNrKSAhPT0gMCk7XG4gIH1cbiAgdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdID0gdmFsdWU7XG4gIHJldHVybiBjaGFuZ2VzO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGNhbGxzIHRoZSBuZ0FmdGVyQ29udGVudENoZWNrLCBuZ0FmdGVyQ29udGVudEluaXQsXG4vLyBuZ0FmdGVyVmlld0NoZWNrLCBhbmQgbmdBZnRlclZpZXdJbml0IGxpZmVjeWNsZSBob29rcyAoZGVwZW5kaW5nIG9uIHRoZSBub2RlXG4vLyBmbGFncyBpbiBsaWZlY3ljbGUpLiBVbmxpa2UgbmdEb0NoZWNrLCBuZ09uQ2hhbmdlcyBhbmQgbmdPbkluaXQsIHdoaWNoIGFyZVxuLy8gY2FsbGVkIGR1cmluZyBhIHByZS1vcmRlciB0cmF2ZXJzYWwgb2YgdGhlIHZpZXcgdHJlZSAodGhhdCBpcyBjYWxsaW5nIHRoZVxuLy8gcGFyZW50IGhvb2tzIGJlZm9yZSB0aGUgY2hpbGQgaG9va3MpIHRoZXNlIGV2ZW50cyBhcmUgc2VudCBpbiB1c2luZyBhXG4vLyBwb3N0LW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgdHJlZSAoY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMpLiBUaGlzIGNoYW5nZXMgdGhlXG4vLyBtZWFuaW5nIG9mIGluaXRJbmRleCBpbiB0aGUgdmlldyBzdGF0ZS4gRm9yIG5nT25Jbml0LCBpbml0SW5kZXggdHJhY2tzIHRoZVxuLy8gZXhwZWN0ZWQgbm9kZUluZGV4IHdoaWNoIGEgbmdPbkluaXQgc2hvdWxkIGJlIGNhbGxlZC4gV2hlbiBzZW5kaW5nXG4vLyBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJWaWV3SW5pdCBpdCBpcyB0aGUgZXhwZWN0ZWQgY291bnQgb2Zcbi8vIG5nQWZ0ZXJDb250ZW50SW5pdCBvciBuZ0FmdGVyVmlld0luaXQgbWV0aG9kcyB0aGF0IGhhdmUgYmVlbiBjYWxsZWQuIFRoaXNcbi8vIGVuc3VyZSB0aGF0IGRlc3BpdGUgYmVpbmcgY2FsbGVkIHJlY3Vyc2l2ZWx5IG9yIGFmdGVyIHBpY2tpbmcgdXAgYWZ0ZXIgYW5cbi8vIGV4Y2VwdGlvbiwgdGhlIG5nQWZ0ZXJDb250ZW50SW5pdCBvciBuZ0FmdGVyVmlld0luaXQgd2lsbCBiZSBjYWxsZWQgb24gdGhlXG4vLyBjb3JyZWN0IG5vZGVzLiBDb25zaWRlciBmb3IgZXhhbXBsZSwgdGhlIGZvbGxvd2luZyAod2hlcmUgRSBpcyBhbiBlbGVtZW50XG4vLyBhbmQgRCBpcyBhIGRpcmVjdGl2ZSlcbi8vICBUcmVlOiAgICAgICBwcmUtb3JkZXIgaW5kZXggIHBvc3Qtb3JkZXIgaW5kZXhcbi8vICAgIEUxICAgICAgICAwICAgICAgICAgICAgICAgIDZcbi8vICAgICAgRTIgICAgICAxICAgICAgICAgICAgICAgIDFcbi8vICAgICAgIEQzICAgICAyICAgICAgICAgICAgICAgIDBcbi8vICAgICAgRTQgICAgICAzICAgICAgICAgICAgICAgIDVcbi8vICAgICAgIEU1ICAgICA0ICAgICAgICAgICAgICAgIDRcbi8vICAgICAgICBFNiAgICA1ICAgICAgICAgICAgICAgIDJcbi8vICAgICAgICBFNyAgICA2ICAgICAgICAgICAgICAgIDNcbi8vIEFzIGNhbiBiZSBzZWVuLCB0aGUgcG9zdC1vcmRlciBpbmRleCBoYXMgYW4gdW5jbGVhciByZWxhdGlvbnNoaXAgdG8gdGhlXG4vLyBwcmUtb3JkZXIgaW5kZXggKHBvc3RPcmRlckluZGV4ID09PSBwcmVPcmRlckluZGV4IC0gcGFyZW50Q291bnQgK1xuLy8gY2hpbGRDb3VudCkuIFNpbmNlIG51bWJlciBvZiBjYWxscyB0byBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJWaWV3SW5pdFxuLy8gYXJlIHN0YWJsZSAod2lsbCBiZSB0aGUgc2FtZSBmb3IgdGhlIHNhbWUgdmlldyByZWdhcmRsZXNzIG9mIGV4Y2VwdGlvbnMgb3Jcbi8vIHJlY3Vyc2lvbikgd2UganVzdCBuZWVkIHRvIGNvdW50IHRoZW0gd2hpY2ggd2lsbCByb3VnaGx5IGNvcnJlc3BvbmQgdG8gdGhlXG4vLyBwb3N0LW9yZGVyIGluZGV4IChpdCBza2lwcyBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcyB0aGF0IGRvIG5vdCBoYXZlXG4vLyBsaWZlY3ljbGUgaG9va3MpLlxuLy9cbi8vIEZvciBleGFtcGxlLCBpZiBhbiBleGNlcHRpb24gaXMgcmFpc2VkIGluIHRoZSBFNi5vbkFmdGVyVmlld0luaXQoKSB0aGVcbi8vIGluaXRJbmRleCBpcyBsZWZ0IGF0IDMgKGJ5IHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vaygpIHdoaWNoIHNldCBpdCB0b1xuLy8gaW5pdEluZGV4ICsgMSkuIFdoZW4gY2hlY2tBbmRVcGRhdGVWaWV3KCkgaXMgY2FsbGVkIGFnYWluIEQzLCBFMiBhbmQgRTYgd2lsbFxuLy8gbm90IGhhdmUgdGhlaXIgbmdBZnRlclZpZXdJbml0KCkgY2FsbGVkIGJ1dCwgc3RhcnRpbmcgd2l0aCBFNywgdGhlIHJlc3Qgb2Zcbi8vIHRoZSB2aWV3IHdpbGwgYmVnaW4gZ2V0dGluZyBuZ0FmdGVyVmlld0luaXQoKSBjYWxsZWQgdW50aWwgYSBjaGVjayBhbmRcbi8vIHBhc3MgaXMgY29tcGxldGUuXG4vL1xuLy8gVGhpcyBhbGdvcnRoaW0gYWxzbyBoYW5kbGVzIHJlY3Vyc2lvbi4gQ29uc2lkZXIgaWYgRTQncyBuZ0FmdGVyVmlld0luaXQoKVxuLy8gaW5kaXJlY3RseSBjYWxscyBFMSdzIENoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKS4gVGhlIGV4cGVjdGVkXG4vLyBpbml0SW5kZXggaXMgc2V0IHRvIDYsIHRoZSByZWN1c2l2ZSBjaGVja0FuZFVwZGF0ZVZpZXcoKSBzdGFydHMgd2FsayBhZ2Fpbi5cbi8vIEQzLCBFMiwgRTYsIEU3LCBFNSBhbmQgRTQgYXJlIHNraXBwZWQsIG5nQWZ0ZXJWaWV3SW5pdCgpIGlzIGNhbGxlZCBvbiBFMS5cbi8vIFdoZW4gdGhlIHJlY3Vyc2lvbiByZXR1cm5zIHRoZSBpbml0SW5kZXggd2lsbCBiZSA3IHNvIEUxIGlzIHNraXBwZWQgYXMgaXRcbi8vIGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkIGluIHRoZSByZWN1cnNpdmVseSBjYWxsZWQgY2hlY2tBblVwZGF0ZVZpZXcoKS5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsTGlmZWN5Y2xlSG9va3NDaGlsZHJlbkZpcnN0KHZpZXc6IFZpZXdEYXRhLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MpIHtcbiAgaWYgKCEodmlldy5kZWYubm9kZUZsYWdzICYgbGlmZWN5Y2xlcykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9kZXMgPSB2aWV3LmRlZi5ub2RlcztcbiAgbGV0IGluaXRJbmRleCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gbm9kZXNbaV07XG4gICAgbGV0IHBhcmVudCA9IG5vZGVEZWYucGFyZW50O1xuICAgIGlmICghcGFyZW50ICYmIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzKSB7XG4gICAgICAvLyBtYXRjaGluZyByb290IG5vZGUgKGUuZy4gYSBwaXBlKVxuICAgICAgY2FsbFByb3ZpZGVyTGlmZWN5Y2xlcyh2aWV3LCBpLCBub2RlRGVmLmZsYWdzICYgbGlmZWN5Y2xlcywgaW5pdEluZGV4KyspO1xuICAgIH1cbiAgICBpZiAoKG5vZGVEZWYuY2hpbGRGbGFncyAmIGxpZmVjeWNsZXMpID09PSAwKSB7XG4gICAgICAvLyBubyBjaGlsZCBtYXRjaGVzIG9uZSBvZiB0aGUgbGlmZWN5Y2xlc1xuICAgICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gICAgfVxuICAgIHdoaWxlIChwYXJlbnQgJiYgKHBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgJiZcbiAgICAgICAgICAgaSA9PT0gcGFyZW50Lm5vZGVJbmRleCArIHBhcmVudC5jaGlsZENvdW50KSB7XG4gICAgICAvLyBsYXN0IGNoaWxkIG9mIGFuIGVsZW1lbnRcbiAgICAgIGlmIChwYXJlbnQuZGlyZWN0Q2hpbGRGbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgICAgaW5pdEluZGV4ID0gY2FsbEVsZW1lbnRQcm92aWRlcnNMaWZlY3ljbGVzKHZpZXcsIHBhcmVudCwgbGlmZWN5Y2xlcywgaW5pdEluZGV4KTtcbiAgICAgIH1cbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxFbGVtZW50UHJvdmlkZXJzTGlmZWN5Y2xlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGxpZmVjeWNsZXM6IE5vZGVGbGFncywgaW5pdEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSBlbERlZi5ub2RlSW5kZXggKyBlbERlZi5jaGlsZENvdW50OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzKSB7XG4gICAgICBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKHZpZXcsIGksIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzLCBpbml0SW5kZXgrKyk7XG4gICAgfVxuICAgIC8vIG9ubHkgdmlzaXQgZGlyZWN0IGNoaWxkcmVuXG4gICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gIH1cbiAgcmV0dXJuIGluaXRJbmRleDtcbn1cblxuZnVuY3Rpb24gY2FsbFByb3ZpZGVyTGlmZWN5Y2xlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlciwgbGlmZWN5Y2xlczogTm9kZUZsYWdzLCBpbml0SW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwcm92aWRlckRhdGEgPSBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBpbmRleCk7XG4gIGlmICghcHJvdmlkZXJEYXRhKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJEYXRhLmluc3RhbmNlO1xuICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFNlcnZpY2VzLnNldEN1cnJlbnROb2RlKHZpZXcsIGluZGV4KTtcbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuQWZ0ZXJDb250ZW50SW5pdCAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ0FmdGVyQ29udGVudEluaXQsIGluaXRJbmRleCkpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyQ29udGVudEluaXQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlckNvbnRlbnRDaGVja2VkKSB7XG4gICAgcHJvdmlkZXIubmdBZnRlckNvbnRlbnRDaGVja2VkKCk7XG4gIH1cbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuQWZ0ZXJWaWV3SW5pdCAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ0FmdGVyVmlld0luaXQsIGluaXRJbmRleCkpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyVmlld0luaXQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlclZpZXdDaGVja2VkKSB7XG4gICAgcHJvdmlkZXIubmdBZnRlclZpZXdDaGVja2VkKCk7XG4gIH1cbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuT25EZXN0cm95KSB7XG4gICAgcHJvdmlkZXIubmdPbkRlc3Ryb3koKTtcbiAgfVxufVxuIl19