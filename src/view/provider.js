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
import * as v1renderer from '../render/api';
import { createChangeDetectorRef, createInjector, createTemplateRef, createViewContainerRef } from './refs';
import { BindingType, DepFlags, NodeFlags, NodeType, ProviderType, Services, ViewFlags, ViewState, asElementData, asProviderData } from './types';
import { checkAndUpdateBinding, dispatchEvent, isComponentView, tokenKey, viewParentElIndex } from './util';
const /** @type {?} */ RendererV1TokenKey = tokenKey(v1renderer.Renderer);
const /** @type {?} */ ElementRefTokenKey = tokenKey(ElementRef);
const /** @type {?} */ ViewContainerRefTokenKey = tokenKey(ViewContainerRef);
const /** @type {?} */ TemplateRefTokenKey = tokenKey(TemplateRef);
const /** @type {?} */ ChangeDetectorRefTokenKey = tokenKey(ChangeDetectorRef);
const /** @type {?} */ InjectorRefTokenKey = tokenKey(Injector);
const /** @type {?} */ NOT_CREATED = new Object();
/**
 * @param {?} flags
 * @param {?} matchedQueries
 * @param {?} childCount
 * @param {?} ctor
 * @param {?} deps
 * @param {?=} props
 * @param {?=} outputs
 * @param {?=} component
 * @return {?}
 */
export function directiveDef(flags, matchedQueries, childCount, ctor, deps, props, outputs, component) {
    const /** @type {?} */ bindings = [];
    if (props) {
        for (let /** @type {?} */ prop in props) {
            const [bindingIndex, nonMinifiedName] = props[prop];
            bindings[bindingIndex] = {
                type: BindingType.DirectiveProperty,
                name: prop, nonMinifiedName,
                securityContext: undefined,
                suffix: undefined
            };
        }
    }
    const /** @type {?} */ outputDefs = [];
    if (outputs) {
        for (let /** @type {?} */ propName in outputs) {
            outputDefs.push({ propName, eventName: outputs[propName] });
        }
    }
    return _def(NodeType.Directive, flags, matchedQueries, childCount, ProviderType.Class, ctor, ctor, deps, bindings, outputDefs, component);
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
 * @param {?} matchedQueries
 * @param {?} childCount
 * @param {?} providerType
 * @param {?} token
 * @param {?} value
 * @param {?} deps
 * @param {?=} bindings
 * @param {?=} outputs
 * @param {?=} component
 * @return {?}
 */
export function _def(type, flags, matchedQueries, childCount, providerType, token, value, deps, bindings, outputs, component) {
    const /** @type {?} */ matchedQueryDefs = {};
    if (matchedQueries) {
        matchedQueries.forEach(([queryId, valueType]) => { matchedQueryDefs[queryId] = valueType; });
    }
    if (!outputs) {
        outputs = [];
    }
    if (!bindings) {
        bindings = [];
    }
    const /** @type {?} */ depDefs = deps.map(value => {
        let /** @type {?} */ token;
        let /** @type {?} */ flags;
        if (Array.isArray(value)) {
            [flags, token] = value;
        }
        else {
            flags = DepFlags.None;
            token = value;
        }
        return { flags, token, tokenKey: tokenKey(token) };
    });
    if (component) {
        flags = flags | NodeFlags.HasComponent;
    }
    return {
        type,
        // will bet set by the view definition
        index: undefined,
        reverseChildIndex: undefined,
        parent: undefined,
        childFlags: undefined,
        childMatchedQueries: undefined,
        bindingIndex: undefined,
        disposableIndex: undefined,
        // regular values
        flags,
        matchedQueries: matchedQueryDefs,
        ngContentIndex: undefined, childCount, bindings,
        disposableCount: outputs.length,
        element: undefined,
        provider: {
            type: providerType,
            token,
            tokenKey: tokenKey(token), value,
            deps: depDefs, outputs, component
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
    let /** @type {?} */ compView = view;
    while (compView.parent && !isComponentView(compView)) {
        compView = compView.parent;
    }
    // pipes are always eager and classes!
    return createClass(compView.parent, compView.parentIndex, viewParentElIndex(compView), def.provider.value, def.provider.deps);
}
/**
 * @param {?} view
 * @param {?} def
 * @return {?}
 */
export function createDirectiveInstance(view, def) {
    const /** @type {?} */ providerDef = def.provider;
    // directives are always eager and classes!
    const /** @type {?} */ instance = createClass(view, def.index, def.parent, def.provider.value, def.provider.deps);
    if (providerDef.outputs.length) {
        for (let /** @type {?} */ i = 0; i < providerDef.outputs.length; i++) {
            const /** @type {?} */ output = providerDef.outputs[i];
            const /** @type {?} */ subscription = instance[output.propName].subscribe(eventHandlerClosure(view, def.parent, output.eventName));
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
    const /** @type {?} */ providerData = asProviderData(view, def.index);
    const /** @type {?} */ directive = providerData.instance;
    let /** @type {?} */ changes;
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
    const /** @type {?} */ providerData = asProviderData(view, def.index);
    const /** @type {?} */ directive = providerData.instance;
    let /** @type {?} */ changes;
    for (let /** @type {?} */ i = 0; i < values.length; i++) {
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
    const /** @type {?} */ providerDef = def.provider;
    let /** @type {?} */ injectable;
    switch (providerDef.type) {
        case ProviderType.Class:
            injectable = createClass(view, def.index, def.parent, providerDef.value, providerDef.deps);
            break;
        case ProviderType.Factory:
            injectable = callFactory(view, def.index, def.parent, providerDef.value, providerDef.deps);
            break;
        case ProviderType.UseExisting:
            injectable = resolveDep(view, def.index, def.parent, providerDef.deps[0]);
            break;
        case ProviderType.Value:
            injectable = providerDef.value;
            break;
    }
    return injectable;
}
/**
 * @param {?} view
 * @param {?} requestorNodeIndex
 * @param {?} elIndex
 * @param {?} ctor
 * @param {?} deps
 * @return {?}
 */
function createClass(view, requestorNodeIndex, elIndex, ctor, deps) {
    const /** @type {?} */ len = deps.length;
    let /** @type {?} */ injectable;
    switch (len) {
        case 0:
            injectable = new ctor();
            break;
        case 1:
            injectable = new ctor(resolveDep(view, requestorNodeIndex, elIndex, deps[0]));
            break;
        case 2:
            injectable = new ctor(resolveDep(view, requestorNodeIndex, elIndex, deps[0]), resolveDep(view, requestorNodeIndex, elIndex, deps[1]));
            break;
        case 3:
            injectable = new ctor(resolveDep(view, requestorNodeIndex, elIndex, deps[0]), resolveDep(view, requestorNodeIndex, elIndex, deps[1]), resolveDep(view, requestorNodeIndex, elIndex, deps[2]));
            break;
        default:
            const /** @type {?} */ depValues = new Array(len);
            for (let /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, requestorNodeIndex, elIndex, deps[i]);
            }
            injectable = new ctor(...depValues);
    }
    return injectable;
}
/**
 * @param {?} view
 * @param {?} requestorNodeIndex
 * @param {?} elIndex
 * @param {?} factory
 * @param {?} deps
 * @return {?}
 */
function callFactory(view, requestorNodeIndex, elIndex, factory, deps) {
    const /** @type {?} */ len = deps.length;
    let /** @type {?} */ injectable;
    switch (len) {
        case 0:
            injectable = factory();
            break;
        case 1:
            injectable = factory(resolveDep(view, requestorNodeIndex, elIndex, deps[0]));
            break;
        case 2:
            injectable = factory(resolveDep(view, requestorNodeIndex, elIndex, deps[0]), resolveDep(view, requestorNodeIndex, elIndex, deps[1]));
            break;
        case 3:
            injectable = factory(resolveDep(view, requestorNodeIndex, elIndex, deps[0]), resolveDep(view, requestorNodeIndex, elIndex, deps[1]), resolveDep(view, requestorNodeIndex, elIndex, deps[2]));
            break;
        default:
            const /** @type {?} */ depValues = Array(len);
            for (let /** @type {?} */ i = 0; i < len; i++) {
                depValues[i] = resolveDep(view, requestorNodeIndex, elIndex, deps[i]);
            }
            injectable = factory(...depValues);
    }
    return injectable;
}
/**
 * @param {?} view
 * @param {?} requestNodeIndex
 * @param {?} elIndex
 * @param {?} depDef
 * @param {?=} notFoundValue
 * @return {?}
 */
export function resolveDep(view, requestNodeIndex, elIndex, depDef, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
    if (depDef.flags & DepFlags.Value) {
        return depDef.token;
    }
    const /** @type {?} */ startView = view;
    if (depDef.flags & DepFlags.Optional) {
        notFoundValue = null;
    }
    const /** @type {?} */ tokenKey = depDef.tokenKey;
    if (depDef.flags & DepFlags.SkipSelf) {
        requestNodeIndex = null;
        elIndex = view.def.nodes[elIndex].parent;
        while (elIndex == null && view) {
            elIndex = viewParentElIndex(view);
            view = view.parent;
        }
    }
    while (view) {
        const /** @type {?} */ elDef = view.def.nodes[elIndex];
        switch (tokenKey) {
            case RendererV1TokenKey: {
                let /** @type {?} */ compView = view;
                while (compView && !isComponentView(compView)) {
                    compView = compView.parent;
                }
                const /** @type {?} */ rootRenderer = view.root.injector.get(v1renderer.RootRenderer);
                // Note: Don't fill in the styles as they have been installed already!
                return rootRenderer.renderComponent(new v1renderer.RenderComponentType(view.def.component.id, '', 0, view.def.component.encapsulation, [], {}));
            }
            case ElementRefTokenKey:
                return new ElementRef(asElementData(view, elIndex).renderElement);
            case ViewContainerRefTokenKey:
                return createViewContainerRef(view, elIndex);
            case TemplateRefTokenKey:
                return createTemplateRef(view, elDef);
            case ChangeDetectorRefTokenKey:
                let /** @type {?} */ cdView = view;
                // If we are still checking dependencies on the initial element...
                if (requestNodeIndex != null) {
                    const /** @type {?} */ requestorNodeDef = view.def.nodes[requestNodeIndex];
                    if (requestorNodeDef.flags & NodeFlags.HasComponent) {
                        cdView = asProviderData(view, requestNodeIndex).componentView;
                    }
                }
                return createChangeDetectorRef(cdView);
            case InjectorRefTokenKey:
                return createInjector(view, elIndex);
            default:
                const /** @type {?} */ providerIndex = elDef.element.providerIndices[tokenKey];
                if (providerIndex != null) {
                    const /** @type {?} */ providerData = asProviderData(view, providerIndex);
                    if (providerData.instance === NOT_CREATED) {
                        providerData.instance = _createProviderInstance(view, view.def.nodes[providerIndex]);
                    }
                    return providerData.instance;
                }
        }
        requestNodeIndex = null;
        elIndex = viewParentElIndex(view);
        view = view.parent;
    }
    return startView.root.injector.get(depDef.token, notFoundValue);
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
    let /** @type {?} */ change;
    let /** @type {?} */ changed;
    if (def.flags & NodeFlags.OnChanges) {
        const /** @type {?} */ oldValue = view.oldValues[def.bindingIndex + bindingIdx];
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
            const /** @type {?} */ compView = providerData.componentView;
            if (compView.def.flags & ViewFlags.OnPush) {
                compView.state |= ViewState.ChecksEnabled;
            }
        }
        const /** @type {?} */ binding = def.bindings[bindingIdx];
        const /** @type {?} */ propName = binding.name;
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
    const /** @type {?} */ len = view.def.nodes.length;
    for (let /** @type {?} */ i = 0; i < len; i++) {
        // We use the reverse child oreder to call providers of children first.
        const /** @type {?} */ nodeDef = view.def.reverseChildNodes[i];
        const /** @type {?} */ nodeIndex = nodeDef.index;
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