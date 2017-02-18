/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, SimpleChange } from '../change_detection/change_detection';
import { Injector } from '../di';
import { ElementRef } from '../linker/element_ref';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { Renderer as RendererV1, RendererV2 } from '../render/api';
import { createChangeDetectorRef, createInjector, createRendererV1, createTemplateRef, createViewContainerRef } from './refs';
import { BindingType, DepFlags, NodeFlags, NodeType, ProviderType, Services, ViewFlags, ViewState, asElementData, asProviderData } from './types';
import { checkAndUpdateBinding, dispatchEvent, isComponentView, splitMatchedQueriesDsl, tokenKey, viewParentEl } from './util';
var /** @type {?} */ RendererV1TokenKey = tokenKey(RendererV1);
var /** @type {?} */ RendererV2TokenKey = tokenKey(RendererV2);
var /** @type {?} */ ElementRefTokenKey = tokenKey(ElementRef);
var /** @type {?} */ ViewContainerRefTokenKey = tokenKey(ViewContainerRef);
var /** @type {?} */ TemplateRefTokenKey = tokenKey(TemplateRef);
var /** @type {?} */ ChangeDetectorRefTokenKey = tokenKey(ChangeDetectorRef);
var /** @type {?} */ InjectorRefTokenKey = tokenKey(Injector);
var /** @type {?} */ NOT_CREATED = new Object();
/**
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} childCount
 * @param {?} ctor
 * @param {?} deps
 * @param {?=} props
 * @param {?=} outputs
 * @param {?=} component
 * @param {?=} rendererType
 * @return {?}
 */
export function directiveDef(flags, matchedQueries, childCount, ctor, deps, props, outputs, component, rendererType) {
    var /** @type {?} */ bindings = [];
    if (props) {
        for (var /** @type {?} */ prop in props) {
            var _a = props[prop], bindingIndex = _a[0], nonMinifiedName = _a[1];
            bindings[bindingIndex] = {
                type: BindingType.DirectiveProperty,
                name: prop, nonMinifiedName: nonMinifiedName,
                ns: undefined,
                securityContext: undefined,
                suffix: undefined
            };
        }
    }
    var /** @type {?} */ outputDefs = [];
    if (outputs) {
        for (var /** @type {?} */ propName in outputs) {
            outputDefs.push({ propName: propName, eventName: outputs[propName] });
        }
    }
    return _def(NodeType.Directive, flags, matchedQueries, childCount, ProviderType.Class, ctor, ctor, deps, bindings, outputDefs, component, rendererType);
}
/**
 * @param {?} flags
 * @param {?} ctor
 * @param {?} deps
 * @return {?}
 */
export function pipeDef(flags, ctor, deps) {
    return _def(NodeType.Pipe, flags, null, 0, ProviderType.Class, ctor, ctor, deps);
}
/**
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} type
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @return {?}
 */
export function providerDef(flags, matchedQueries, type, token, value, deps) {
    return _def(NodeType.Provider, flags, matchedQueries, 0, type, token, value, deps);
}
/**
 * @param {?} type
 * @param {?} flags
 * @param {?} matchedQueriesDsl
 * @param {?} childCount
 * @param {?} providerType
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @param {?=} bindings
 * @param {?=} outputs
 * @param {?=} component
 * @param {?=} rendererType
 * @return {?}
 */
export function _def(type, flags, matchedQueriesDsl, childCount, providerType, token, value, deps, bindings, outputs, component, rendererType) {
    var _a = splitMatchedQueriesDsl(matchedQueriesDsl), matchedQueries = _a.matchedQueries, references = _a.references, matchedQueryIds = _a.matchedQueryIds;
    // This is needed as the jit compiler always uses an empty hash as default RendererTypeV2,
    // which is not filled for host views.
    if (rendererType && rendererType.encapsulation == null) {
        rendererType = null;
    }
    if (!outputs) {
        outputs = [];
    }
    if (!bindings) {
        bindings = [];
    }
    var /** @type {?} */ depDefs = deps.map(function (value) {
        var /** @type {?} */ token;
        var /** @type {?} */ flags;
        if (Array.isArray(value)) {
            flags = value[0], token = value[1];
        }
        else {
            flags = DepFlags.None;
            token = value;
        }
        return { flags: flags, token: token, tokenKey: tokenKey(token) };
    });
    if (component) {
        flags = flags | NodeFlags.HasComponent;
    }
    return {
        type: type,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        renderParent: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags: flags,
        childFlags: 0,
        childMatchedQueries: 0, matchedQueries: matchedQueries, matchedQueryIds: matchedQueryIds, references: references,
        ngContentIndex: undefined, childCount: childCount, bindings: bindings,
        disposableCount: outputs.length,
        element: undefined,
        provider: {
            type: providerType,
            token: token,
            tokenKey: tokenKey(token), value: value,
            deps: depDefs, outputs: outputs, component: component, rendererType: rendererType
        },
        text: undefined,
        pureExpression: undefined,
        query: undefined,
        ngContent: undefined
    };
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createProviderInstance(view, def) {
    return def.flags & NodeFlags.LazyProvider ? NOT_CREATED : _createProviderInstance(view, def);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createPipeInstance(view, def) {
    // deps are looked up from component.
    var /** @type {?} */ compView = view;
    while (compView.parent && !isComponentView(compView)) {
        compView = compView.parent;
    }
    // pipes can see the private services of the component
    var /** @type {?} */ allowPrivateServices = true;
    // pipes are always eager and classes!
    return createClass(compView.parent, viewParentEl(compView), allowPrivateServices, def.provider.value, def.provider.deps);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createDirectiveInstance(view, def) {
    // components can see other private services, other directives can't.
    var /** @type {?} */ allowPrivateServices = (def.flags & NodeFlags.HasComponent) > 0;
    var /** @type {?} */ providerDef = def.provider;
    // directives are always eager and classes!
    var /** @type {?} */ instance = createClass(view, def.parent, allowPrivateServices, def.provider.value, def.provider.deps);
    if (providerDef.outputs.length) {
        for (var /** @type {?} */ i = 0; i < providerDef.outputs.length; i++) {
            var /** @type {?} */ output = providerDef.outputs[i];
            var /** @type {?} */ subscription = instance[output.propName].subscribe(eventHandlerClosure(view, def.parent.index, output.eventName));
            view.disposables[def.disposableIndex + i] = subscription.unsubscribe.bind(subscription);
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
    return function (event) { return dispatchEvent(view, index, eventName, event); };
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
    var /** @type {?} */ providerData = asProviderData(view, def.index);
    var /** @type {?} */ directive = providerData.instance;
    var /** @type {?} */ changes;
    // Note: fallthrough is intended!
    switch (def.bindings.length) {
        case 10:
            changes = checkAndUpdateProp(view, providerData, def, 9, v9, changes);
        case 9:
            changes = checkAndUpdateProp(view, providerData, def, 8, v8, changes);
        case 8:
            changes = checkAndUpdateProp(view, providerData, def, 7, v7, changes);
        case 7:
            changes = checkAndUpdateProp(view, providerData, def, 6, v6, changes);
        case 6:
            changes = checkAndUpdateProp(view, providerData, def, 5, v5, changes);
        case 5:
            changes = checkAndUpdateProp(view, providerData, def, 4, v4, changes);
        case 4:
            changes = checkAndUpdateProp(view, providerData, def, 3, v3, changes);
        case 3:
            changes = checkAndUpdateProp(view, providerData, def, 2, v2, changes);
        case 2:
            changes = checkAndUpdateProp(view, providerData, def, 1, v1, changes);
        case 1:
            changes = checkAndUpdateProp(view, providerData, def, 0, v0, changes);
    }
    if (changes) {
        directive.ngOnChanges(changes);
    }
    if ((view.state & ViewState.FirstCheck) && (def.flags & NodeFlags.OnInit)) {
        directive.ngOnInit();
    }
    if (def.flags & NodeFlags.DoCheck) {
        directive.ngDoCheck();
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @param {?} values
 * @return {?}
 */
export function checkAndUpdateDirectiveDynamic(view, def, values) {
    var /** @type {?} */ providerData = asProviderData(view, def.index);
    var /** @type {?} */ directive = providerData.instance;
    var /** @type {?} */ changes;
    for (var /** @type {?} */ i = 0; i < values.length; i++) {
        changes = checkAndUpdateProp(view, providerData, def, i, values[i], changes);
    }
    if (changes) {
        directive.ngOnChanges(changes);
    }
    if ((view.state & ViewState.FirstCheck) && (def.flags & NodeFlags.OnInit)) {
        directive.ngOnInit();
    }
    if (def.flags & NodeFlags.DoCheck) {
        directive.ngDoCheck();
    }
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
function _createProviderInstance(view, def) {
    // private services can see other private services
    var /** @type {?} */ allowPrivateServices = (def.flags & NodeFlags.PrivateProvider) > 0;
    var /** @type {?} */ providerDef = def.provider;
    var /** @type {?} */ injectable;
    switch (providerDef.type) {
        case ProviderType.Class:
            injectable =
                createClass(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
            break;
        case ProviderType.Factory:
            injectable =
                callFactory(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
            break;
        case ProviderType.UseExisting:
            injectable = resolveDep(view, def.parent, allowPrivateServices, providerDef.deps[0]);
            break;
        case ProviderType.Value:
            injectable = providerDef.value;
            break;
    }
    return injectable;
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
    var /** @type {?} */ len = deps.length;
    var /** @type {?} */ injectable;
    switch (len) {
        case 0:
            injectable = new ctor();
            break;
        case 1:
            injectable = new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]));
            break;
        case 2:
            injectable = new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
            break;
        case 3:
            injectable = new ctor(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
            break;
        default:
            var /** @type {?} */ depValues = new Array(len);
            for (var /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
            }
            injectable = new (ctor.bind.apply(ctor, [void 0].concat(depValues)))();
    }
    return injectable;
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
    var /** @type {?} */ len = deps.length;
    var /** @type {?} */ injectable;
    switch (len) {
        case 0:
            injectable = factory();
            break;
        case 1:
            injectable = factory(resolveDep(view, elDef, allowPrivateServices, deps[0]));
            break;
        case 2:
            injectable = factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]));
            break;
        case 3:
            injectable = factory(resolveDep(view, elDef, allowPrivateServices, deps[0]), resolveDep(view, elDef, allowPrivateServices, deps[1]), resolveDep(view, elDef, allowPrivateServices, deps[2]));
            break;
        default:
            var /** @type {?} */ depValues = Array(len);
            for (var /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, elDef, allowPrivateServices, deps[i]);
            }
            injectable = factory.apply(void 0, depValues);
    }
    return injectable;
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @param {?} depDef
 * @param {?=} notFoundValue
 * @return {?}
 */
export function resolveDep(view, elDef, allowPrivateServices, depDef, notFoundValue) {
    if (notFoundValue === void 0) { notFoundValue = Injector.THROW_IF_NOT_FOUND; }
    if (depDef.flags & DepFlags.Value) {
        return depDef.token;
    }
    var /** @type {?} */ startView = view;
    if (depDef.flags & DepFlags.Optional) {
        notFoundValue = null;
    }
    var /** @type {?} */ tokenKey = depDef.tokenKey;
    if (depDef.flags & DepFlags.SkipSelf) {
        allowPrivateServices = false;
        elDef = elDef.parent;
    }
    while (view) {
        if (elDef) {
            switch (tokenKey) {
                case RendererV1TokenKey: {
                    var /** @type {?} */ compView = findCompView(view, elDef, allowPrivateServices);
                    return createRendererV1(compView);
                }
                case RendererV2TokenKey: {
                    var /** @type {?} */ compView = findCompView(view, elDef, allowPrivateServices);
                    return compView.renderer;
                }
                case ElementRefTokenKey:
                    return new ElementRef(asElementData(view, elDef.index).renderElement);
                case ViewContainerRefTokenKey:
                    return createViewContainerRef(view, elDef);
                case TemplateRefTokenKey: {
                    if (elDef.element.template) {
                        return createTemplateRef(view, elDef);
                    }
                    break;
                }
                case ChangeDetectorRefTokenKey: {
                    var /** @type {?} */ cdView = findCompView(view, elDef, allowPrivateServices);
                    return createChangeDetectorRef(cdView);
                }
                case InjectorRefTokenKey:
                    return createInjector(view, elDef);
                default:
                    var /** @type {?} */ providerDef_1 = (allowPrivateServices ? elDef.element.allProviders :
                        elDef.element.publicProviders)[tokenKey];
                    if (providerDef_1) {
                        var /** @type {?} */ providerData = asProviderData(view, providerDef_1.index);
                        if (providerData.instance === NOT_CREATED) {
                            providerData.instance = _createProviderInstance(view, providerDef_1);
                        }
                        return providerData.instance;
                    }
            }
        }
        allowPrivateServices = isComponentView(view);
        elDef = viewParentEl(view);
        view = view.parent;
    }
    return startView.root.injector.get(depDef.token, notFoundValue);
}
/**
 * @param {?} view
 * @param {?} elDef
 * @param {?} allowPrivateServices
 * @return {?}
 */
function findCompView(view, elDef, allowPrivateServices) {
    var /** @type {?} */ compView;
    if (allowPrivateServices) {
        compView = asProviderData(view, elDef.element.component.index).componentView;
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
function checkAndUpdateProp(view, providerData, def, bindingIdx, value, changes) {
    var /** @type {?} */ change;
    var /** @type {?} */ changed;
    if (def.flags & NodeFlags.OnChanges) {
        var /** @type {?} */ oldValue = view.oldValues[def.bindingIndex + bindingIdx];
        changed = checkAndUpdateBinding(view, def, bindingIdx, value);
        change = changed ?
            new SimpleChange(oldValue, value, (view.state & ViewState.FirstCheck) !== 0) :
            null;
    }
    else {
        changed = checkAndUpdateBinding(view, def, bindingIdx, value);
    }
    if (changed) {
        if (def.flags & NodeFlags.HasComponent) {
            var /** @type {?} */ compView = providerData.componentView;
            if (compView.def.flags & ViewFlags.OnPush) {
                compView.state |= ViewState.ChecksEnabled;
            }
        }
        var /** @type {?} */ binding = def.bindings[bindingIdx];
        var /** @type {?} */ propName = binding.name;
        // Note: This is still safe with Closure Compiler as
        // the user passed in the property name as an object has to `providerDef`,
        // so Closure Compiler will have renamed the property correctly already.
        providerData.instance[propName] = value;
        if (change) {
            changes = changes || {};
            changes[binding.nonMinifiedName] = change;
        }
    }
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
    var /** @type {?} */ len = view.def.nodes.length;
    for (var /** @type {?} */ i = 0; i < len; i++) {
        // We use the reverse child oreder to call providers of children first.
        var /** @type {?} */ nodeDef = view.def.reverseChildNodes[i];
        var /** @type {?} */ nodeIndex = nodeDef.index;
        if (nodeDef.flags & lifecycles) {
            // a leaf
            Services.setCurrentNode(view, nodeIndex);
            callProviderLifecycles(asProviderData(view, nodeIndex).instance, nodeDef.flags & lifecycles);
        }
        else if ((nodeDef.childFlags & lifecycles) === 0) {
            // a parent with leafs
            // no child matches one of the lifecycles,
            // then skip the children
            i += nodeDef.childCount;
        }
    }
}
/**
 * @param {?} provider
 * @param {?} lifecycles
 * @return {?}
 */
function callProviderLifecycles(provider, lifecycles) {
    if (lifecycles & NodeFlags.AfterContentInit) {
        provider.ngAfterContentInit();
    }
    if (lifecycles & NodeFlags.AfterContentChecked) {
        provider.ngAfterContentChecked();
    }
    if (lifecycles & NodeFlags.AfterViewInit) {
        provider.ngAfterViewInit();
    }
    if (lifecycles & NodeFlags.AfterViewChecked) {
        provider.ngAfterViewChecked();
    }
    if (lifecycles & NodeFlags.OnDestroy) {
        provider.ngOnDestroy();
    }
}
//# sourceMappingURL=provider.js.map