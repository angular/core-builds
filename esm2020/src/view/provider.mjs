/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ChangeDetectorRef, SimpleChange } from '../change_detection/change_detection';
import { INJECTOR, Injector, resolveForwardRef } from '../di';
import { ElementRef } from '../linker/element_ref';
import { TemplateRef } from '../linker/template_ref';
import { ViewContainerRef } from '../linker/view_container_ref';
import { Renderer2 } from '../render/api';
import { isObservable } from '../util/lang';
import { stringify } from '../util/stringify';
import { NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR } from './provider_flags';
import { createChangeDetectorRef, createInjector } from './refs';
import { asElementData, asProviderData, Services, shouldCallLifecycleInitHook } from './types';
import { calcBindingFlags, checkBinding, dispatchEvent, isComponentView, splitDepsDsl, splitMatchedQueriesDsl, tokenKey, viewParentEl } from './util';
const Renderer2TokenKey = tokenKey(Renderer2);
const ElementRefTokenKey = tokenKey(ElementRef);
const ViewContainerRefTokenKey = tokenKey(ViewContainerRef);
const TemplateRefTokenKey = tokenKey(TemplateRef);
const ChangeDetectorRefTokenKey = tokenKey(ChangeDetectorRef);
const InjectorRefTokenKey = tokenKey(Injector);
const INJECTORRefTokenKey = tokenKey(INJECTOR);
export function directiveDef(checkIndex, flags, matchedQueries, childCount, ctor, deps, props, outputs) {
    const bindings = [];
    if (props) {
        for (let prop in props) {
            const [bindingIndex, nonMinifiedName] = props[prop];
            bindings[bindingIndex] = {
                flags: 8 /* TypeProperty */,
                name: prop,
                nonMinifiedName,
                ns: null,
                securityContext: null,
                suffix: null
            };
        }
    }
    const outputDefs = [];
    if (outputs) {
        for (let propName in outputs) {
            outputDefs.push({ type: 1 /* DirectiveOutput */, propName, target: null, eventName: outputs[propName] });
        }
    }
    flags |= 16384 /* TypeDirective */;
    return _def(checkIndex, flags, matchedQueries, childCount, ctor, ctor, deps, bindings, outputDefs);
}
export function pipeDef(flags, ctor, deps) {
    flags |= 16 /* TypePipe */;
    return _def(-1, flags, null, 0, ctor, ctor, deps);
}
export function providerDef(flags, matchedQueries, token, value, deps) {
    return _def(-1, flags, matchedQueries, 0, token, value, deps);
}
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
        childMatchedQueries: 0,
        matchedQueries,
        matchedQueryIds,
        references,
        ngContentIndex: -1,
        childCount,
        bindings,
        bindingFlags: calcBindingFlags(bindings),
        outputs,
        element: null,
        provider: { token, value, deps: depDefs },
        text: null,
        query: null,
        ngContent: null
    };
}
export function createProviderInstance(view, def) {
    return _createProviderInstance(view, def);
}
export function createPipeInstance(view, def) {
    // deps are looked up from component.
    let compView = view;
    while (compView.parent && !isComponentView(compView)) {
        compView = compView.parent;
    }
    // pipes can see the private services of the component
    const allowPrivateServices = true;
    // pipes are always eager and classes!
    return createClass(compView.parent, viewParentEl(compView), allowPrivateServices, def.provider.value, def.provider.deps);
}
export function createDirectiveInstance(view, def) {
    // components can see other private services, other directives can't.
    const allowPrivateServices = (def.flags & 32768 /* Component */) > 0;
    // directives are always eager and classes!
    const instance = createClass(view, def.parent, allowPrivateServices, def.provider.value, def.provider.deps);
    if (def.outputs.length) {
        for (let i = 0; i < def.outputs.length; i++) {
            const output = def.outputs[i];
            const outputObservable = instance[output.propName];
            if (isObservable(outputObservable)) {
                const subscription = outputObservable.subscribe(eventHandlerClosure(view, def.parent.nodeIndex, output.eventName));
                view.disposables[def.outputIndex + i] = subscription.unsubscribe.bind(subscription);
            }
            else {
                throw new Error(`@Output ${output.propName} not initialized in '${instance.constructor.name}'.`);
            }
        }
    }
    return instance;
}
function eventHandlerClosure(view, index, eventName) {
    return (event) => dispatchEvent(view, index, eventName, event);
}
export function checkAndUpdateDirectiveInline(view, def, v0, v1, v2, v3, v4, v5, v6, v7, v8, v9) {
    const providerData = asProviderData(view, def.nodeIndex);
    const directive = providerData.instance;
    let changed = false;
    let changes = undefined;
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
export function checkAndUpdateDirectiveDynamic(view, def, values) {
    const providerData = asProviderData(view, def.nodeIndex);
    const directive = providerData.instance;
    let changed = false;
    let changes = undefined;
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
function _createProviderInstance(view, def) {
    // private services can see other private services
    const allowPrivateServices = (def.flags & 8192 /* PrivateProvider */) > 0;
    const providerDef = def.provider;
    switch (def.flags & 201347067 /* Types */) {
        case 512 /* TypeClassProvider */:
            return createClass(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
        case 1024 /* TypeFactoryProvider */:
            return callFactory(view, def.parent, allowPrivateServices, providerDef.value, providerDef.deps);
        case 2048 /* TypeUseExistingProvider */:
            return resolveDep(view, def.parent, allowPrivateServices, providerDef.deps[0]);
        case 256 /* TypeValueProvider */:
            return providerDef.value;
    }
}
function createClass(view, elDef, allowPrivateServices, ctor, deps) {
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
            const depValues = [];
            for (let i = 0; i < len; i++) {
                depValues.push(resolveDep(view, elDef, allowPrivateServices, deps[i]));
            }
            return new ctor(...depValues);
    }
}
function callFactory(view, elDef, allowPrivateServices, factory, deps) {
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
            const depValues = [];
            for (let i = 0; i < len; i++) {
                depValues.push(resolveDep(view, elDef, allowPrivateServices, deps[i]));
            }
            return factory(...depValues);
    }
}
export function resolveDep(view, elDef, allowPrivateServices, depDef, notFoundValue = Injector.THROW_IF_NOT_FOUND) {
    if (depDef.flags & 8 /* Value */) {
        return depDef.token;
    }
    const startView = view;
    if (depDef.flags & 2 /* Optional */) {
        notFoundValue = null;
    }
    const tokenKey = depDef.tokenKey;
    if (tokenKey === ChangeDetectorRefTokenKey) {
        // directives on the same element as a component should be able to control the change detector
        // of that component as well.
        allowPrivateServices = !!(elDef && elDef.element.componentView);
    }
    if (elDef && (depDef.flags & 1 /* SkipSelf */)) {
        allowPrivateServices = false;
        elDef = elDef.parent;
    }
    let searchView = view;
    while (searchView) {
        if (elDef) {
            switch (tokenKey) {
                case Renderer2TokenKey: {
                    const compView = findCompView(searchView, elDef, allowPrivateServices);
                    return compView.renderer;
                }
                case ElementRefTokenKey:
                    return new ElementRef(asElementData(searchView, elDef.nodeIndex).renderElement);
                case ViewContainerRefTokenKey:
                    return asElementData(searchView, elDef.nodeIndex).viewContainer;
                case TemplateRefTokenKey: {
                    if (elDef.element.template) {
                        return asElementData(searchView, elDef.nodeIndex).template;
                    }
                    break;
                }
                case ChangeDetectorRefTokenKey: {
                    let cdView = findCompView(searchView, elDef, allowPrivateServices);
                    return createChangeDetectorRef(cdView);
                }
                case InjectorRefTokenKey:
                case INJECTORRefTokenKey:
                    return createInjector(searchView, elDef);
                default:
                    const providerDef = (allowPrivateServices ? elDef.element.allProviders :
                        elDef.element.publicProviders)[tokenKey];
                    if (providerDef) {
                        let providerData = asProviderData(searchView, providerDef.nodeIndex);
                        if (!providerData) {
                            providerData = { instance: _createProviderInstance(searchView, providerDef) };
                            searchView.nodes[providerDef.nodeIndex] = providerData;
                        }
                        return providerData.instance;
                    }
            }
        }
        allowPrivateServices = isComponentView(searchView);
        elDef = viewParentEl(searchView);
        searchView = searchView.parent;
        if (depDef.flags & 4 /* Self */) {
            searchView = null;
        }
    }
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
function findCompView(view, elDef, allowPrivateServices) {
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
function updateProp(view, providerData, def, bindingIdx, value, changes) {
    if (def.flags & 32768 /* Component */) {
        const compView = asElementData(view, def.parent.nodeIndex).componentView;
        if (compView.def.flags & 2 /* OnPush */) {
            compView.state |= 8 /* ChecksEnabled */;
        }
    }
    const binding = def.bindings[bindingIdx];
    const propName = binding.name;
    // Note: This is still safe with Closure Compiler as
    // the user passed in the property name as an object has to `providerDef`,
    // so Closure Compiler will have renamed the property correctly already.
    providerData.instance[propName] = value;
    if (def.flags & 524288 /* OnChanges */) {
        changes = changes || {};
        const oldValue = view.oldValues[def.bindingIndex + bindingIdx];
        const binding = def.bindings[bindingIdx];
        changes[binding.nonMinifiedName] =
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
export function callLifecycleHooksChildrenFirst(view, lifecycles) {
    if (!(view.def.nodeFlags & lifecycles)) {
        return;
    }
    const nodes = view.def.nodes;
    let initIndex = 0;
    for (let i = 0; i < nodes.length; i++) {
        const nodeDef = nodes[i];
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
function callElementProvidersLifecycles(view, elDef, lifecycles, initIndex) {
    for (let i = elDef.nodeIndex + 1; i <= elDef.nodeIndex + elDef.childCount; i++) {
        const nodeDef = view.def.nodes[i];
        if (nodeDef.flags & lifecycles) {
            callProviderLifecycles(view, i, nodeDef.flags & lifecycles, initIndex++);
        }
        // only visit direct children
        i += nodeDef.childCount;
    }
    return initIndex;
}
function callProviderLifecycles(view, index, lifecycles, initIndex) {
    const providerData = asProviderData(view, index);
    if (!providerData) {
        return;
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxZQUFZLEVBQWdCLE1BQU0sc0NBQXNDLENBQUM7QUFDcEcsT0FBTyxFQUFDLFFBQVEsRUFBRSxRQUFRLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxPQUFPLENBQUM7QUFDNUQsT0FBTyxFQUFDLFVBQVUsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sRUFBQyxXQUFXLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUNuRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUM5RCxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hDLE9BQU8sRUFBQyxZQUFZLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUMsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBRTVDLE9BQU8sRUFBQyxxQ0FBcUMsRUFBQyxNQUFNLGtCQUFrQixDQUFDO0FBQ3ZFLE9BQU8sRUFBQyx1QkFBdUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDL0QsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQXVILFFBQVEsRUFBRSwyQkFBMkIsRUFBaUMsTUFBTSxTQUFTLENBQUM7QUFDbFAsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFlBQVksRUFBRSxhQUFhLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFBRSxzQkFBc0IsRUFBRSxRQUFRLEVBQUUsWUFBWSxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRXBKLE1BQU0saUJBQWlCLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzlDLE1BQU0sa0JBQWtCLEdBQUcsUUFBUSxDQUFD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QUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO1FBQ2pELE9BQU8sR0FBRyxJQUFJLENBQUM7UUFDZixPQUFPLEdBQUcsVUFBVSxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDL0Q7SUFDRCxJQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksWUFBWSxDQUFDLElBQUks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UUFBUSxDQUFDLGtCQUFrQixFQUFFLENBQUM7S0FDL0I7SUFDRCxJQUFJLFVBQVUsb0NBQWdDLEVBQUU7UUFDOUMsUUFBUSxDQUFDLHFCQUFxQixFQUFFLENBQUM7S0FDbEM7SUFDRCxJQUFJLFVBQVUsOEJBQTBCO1FBQ3BDLDJCQUEyQixDQUFDLElBQUksNENBQTRDLFNBQVMsQ0FBQyxFQUFFO1FBQzFGLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQztLQUM1QjtJQUNELElBQUksVUFBVSxpQ0FBNkIsRUFBRTtRQUMzQyxRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztLQUMvQjtJQUNELElBQUksVUFBVSx5QkFBc0IsRUFBRTtRQUNwQyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUM7S0FDeEI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlc30gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0aW9uJztcbmltcG9ydCB7SU5KRUNUT1IsIEluamVjdG9yLCByZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtFbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlci9hcGknO1xuaW1wb3J0IHtpc09ic2VydmFibGV9IGZyb20gJy4uL3V0aWwvbGFuZyc7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi4vdXRpbC9zdHJpbmdpZnknO1xuXG5pbXBvcnQge05PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1J9IGZyb20gJy4vcHJvdmlkZXJfZmxhZ3MnO1xuaW1wb3J0IHtjcmVhdGVDaGFuZ2VEZXRlY3RvclJlZiwgY3JlYXRlSW5qZWN0b3J9IGZyb20gJy4vcmVmcyc7XG5pbXBvcnQge2FzRWxlbWVudERhdGEsIGFzUHJvdmlkZXJEYXRhLCBCaW5kaW5nRGVmLCBCaW5kaW5nRmxhZ3MsIERlcERlZiwgRGVwRmxhZ3MsIE5vZGVEZWYsIE5vZGVGbGFncywgT3V0cHV0RGVmLCBPdXRwdXRUeXBlLCBQcm92aWRlckRhdGEsIFF1ZXJ5VmFsdWVUeXBlLCBTZXJ2aWNlcywgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rLCBWaWV3RGF0YSwgVmlld0ZsYWdzLCBWaWV3U3RhdGV9IGZyb20gJy4vdHlwZXMnO1xuaW1wb3J0IHtjYWxjQmluZGluZ0ZsYWdzLCBjaGVja0JpbmRpbmcsIGRpc3BhdGNoRXZlbnQsIGlzQ29tcG9uZW50Vmlldywgc3BsaXREZXBzRHNsLCBzcGxpdE1hdGNoZWRRdWVyaWVzRHNsLCB0b2tlbktleSwgdmlld1BhcmVudEVsfSBmcm9tICcuL3V0aWwnO1xuXG5jb25zdCBSZW5kZXJlcjJUb2tlbktleSA9IHRva2VuS2V5KFJlbmRlcmVyMik7XG5jb25zdCBFbGVtZW50UmVmVG9rZW5LZXkgPSB0b2tlbktleShFbGVtZW50UmVmKTtcbmNvbnN0IFZpZXdDb250YWluZXJSZWZUb2tlbktleSA9IHRva2VuS2V5KFZpZXdDb250YWluZXJSZWYpO1xuY29uc3QgVGVtcGxhdGVSZWZUb2tlbktleSA9IHRva2VuS2V5KFRlbXBsYXRlUmVmKTtcbmNvbnN0IENoYW5nZURldGVjdG9yUmVmVG9rZW5LZXkgPSB0b2tlbktleShDaGFuZ2VEZXRlY3RvclJlZik7XG5jb25zdCBJbmplY3RvclJlZlRva2VuS2V5ID0gdG9rZW5LZXkoSW5qZWN0b3IpO1xuY29uc3QgSU5KRUNUT1JSZWZUb2tlbktleSA9IHRva2VuS2V5KElOSkVDVE9SKTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZURlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIGZsYWdzOiBOb2RlRmxhZ3MsIG1hdGNoZWRRdWVyaWVzOiBudWxsfFtzdHJpbmcgfCBudW1iZXIsIFF1ZXJ5VmFsdWVUeXBlXVtdLFxuICAgIGNoaWxkQ291bnQ6IG51bWJlciwgY3RvcjogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldfGFueSlbXSxcbiAgICBwcm9wcz86IG51bGx8e1tuYW1lOiBzdHJpbmddOiBbbnVtYmVyLCBzdHJpbmddfSxcbiAgICBvdXRwdXRzPzogbnVsbHx7W25hbWU6IHN0cmluZ106IHN0cmluZ30pOiBOb2RlRGVmIHtcbiAgY29uc3QgYmluZGluZ3M6IEJpbmRpbmdEZWZbXSA9IFtdO1xuICBpZiAocHJvcHMpIHtcbiAgICBmb3IgKGxldCBwcm9wIGluIHByb3BzKSB7XG4gICAgICBjb25zdCBbYmluZGluZ0luZGV4LCBub25NaW5pZmllZE5hbWVdID0gcHJvcHNbcHJvcF07XG4gICAgICBiaW5kaW5nc1tiaW5kaW5nSW5kZXhdID0ge1xuICAgICAgICBmbGFnczogQmluZGluZ0ZsYWdzLlR5cGVQcm9wZXJ0eSxcbiAgICAgICAgbmFtZTogcHJvcCxcbiAgICAgICAgbm9uTWluaWZpZWROYW1lLFxuICAgICAgICBuczogbnVsbCxcbiAgICAgICAgc2VjdXJpdHlDb250ZXh0OiBudWxsLFxuICAgICAgICBzdWZmaXg6IG51bGxcbiAgICAgIH07XG4gICAgfVxuICB9XG4gIGNvbnN0IG91dHB1dERlZnM6IE91dHB1dERlZltdID0gW107XG4gIGlmIChvdXRwdXRzKSB7XG4gICAgZm9yIChsZXQgcHJvcE5hbWUgaW4gb3V0cHV0cykge1xuICAgICAgb3V0cHV0RGVmcy5wdXNoKFxuICAgICAgICAgIHt0eXBlOiBPdXRwdXRUeXBlLkRpcmVjdGl2ZU91dHB1dCwgcHJvcE5hbWUsIHRhcmdldDogbnVsbCwgZXZlbnROYW1lOiBvdXRwdXRzW3Byb3BOYW1lXX0pO1xuICAgIH1cbiAgfVxuICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZURpcmVjdGl2ZTtcbiAgcmV0dXJuIF9kZWYoXG4gICAgICBjaGVja0luZGV4LCBmbGFncywgbWF0Y2hlZFF1ZXJpZXMsIGNoaWxkQ291bnQsIGN0b3IsIGN0b3IsIGRlcHMsIGJpbmRpbmdzLCBvdXRwdXREZWZzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBpcGVEZWYoZmxhZ3M6IE5vZGVGbGFncywgY3RvcjogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldfGFueSlbXSk6IE5vZGVEZWYge1xuICBmbGFncyB8PSBOb2RlRmxhZ3MuVHlwZVBpcGU7XG4gIHJldHVybiBfZGVmKC0xLCBmbGFncywgbnVsbCwgMCwgY3RvciwgY3RvciwgZGVwcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwcm92aWRlckRlZihcbiAgICBmbGFnczogTm9kZUZsYWdzLCBtYXRjaGVkUXVlcmllczogbnVsbHxbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSwgdG9rZW46IGFueSxcbiAgICB2YWx1ZTogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldfGFueSlbXSk6IE5vZGVEZWYge1xuICByZXR1cm4gX2RlZigtMSwgZmxhZ3MsIG1hdGNoZWRRdWVyaWVzLCAwLCB0b2tlbiwgdmFsdWUsIGRlcHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gX2RlZihcbiAgICBjaGVja0luZGV4OiBudW1iZXIsIGZsYWdzOiBOb2RlRmxhZ3MsIG1hdGNoZWRRdWVyaWVzRHNsOiBbc3RyaW5nfG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW118bnVsbCxcbiAgICBjaGlsZENvdW50OiBudW1iZXIsIHRva2VuOiBhbnksIHZhbHVlOiBhbnksIGRlcHM6IChbRGVwRmxhZ3MsIGFueV18YW55KVtdLFxuICAgIGJpbmRpbmdzPzogQmluZGluZ0RlZltdLCBvdXRwdXRzPzogT3V0cHV0RGVmW10pOiBOb2RlRGVmIHtcbiAgY29uc3Qge21hdGNoZWRRdWVyaWVzLCByZWZlcmVuY2VzLCBtYXRjaGVkUXVlcnlJZHN9ID0gc3BsaXRNYXRjaGVkUXVlcmllc0RzbChtYXRjaGVkUXVlcmllc0RzbCk7XG4gIGlmICghb3V0cHV0cykge1xuICAgIG91dHB1dHMgPSBbXTtcbiAgfVxuICBpZiAoIWJpbmRpbmdzKSB7XG4gICAgYmluZGluZ3MgPSBbXTtcbiAgfVxuICAvLyBOZWVkIHRvIHJlc29sdmUgZm9yd2FyZFJlZnMgYXMgZS5nLiBmb3IgYHVzZVZhbHVlYCB3ZVxuICAvLyBsb3dlcmVkIHRoZSBleHByZXNzaW9uIGFuZCB0aGVuIHN0b3BwZWQgZXZhbHVhdGluZyBpdCxcbiAgLy8gaS5lLiBhbHNvIGRpZG4ndCB1bndyYXAgaXQuXG4gIHZhbHVlID0gcmVzb2x2ZUZvcndhcmRSZWYodmFsdWUpO1xuXG4gIGNvbnN0IGRlcERlZnMgPSBzcGxpdERlcHNEc2woZGVwcywgc3RyaW5naWZ5KHRva2VuKSk7XG5cbiAgcmV0dXJuIHtcbiAgICAvLyB3aWxsIGJldCBzZXQgYnkgdGhlIHZpZXcgZGVmaW5pdGlvblxuICAgIG5vZGVJbmRleDogLTEsXG4gICAgcGFyZW50OiBudWxsLFxuICAgIHJlbmRlclBhcmVudDogbnVsbCxcbiAgICBiaW5kaW5nSW5kZXg6IC0xLFxuICAgIG91dHB1dEluZGV4OiAtMSxcbiAgICAvLyByZWd1bGFyIHZhbHVlc1xuICAgIGNoZWNrSW5kZXgsXG4gICAgZmxhZ3MsXG4gICAgY2hpbGRGbGFnczogMCxcbiAgICBkaXJlY3RDaGlsZEZsYWdzOiAwLFxuICAgIGNoaWxkTWF0Y2hlZFF1ZXJpZXM6IDAsXG4gICAgbWF0Y2hlZFF1ZXJpZXMsXG4gICAgbWF0Y2hlZFF1ZXJ5SWRzLFxuICAgIHJlZmVyZW5jZXMsXG4gICAgbmdDb250ZW50SW5kZXg6IC0xLFxuICAgIGNoaWxkQ291bnQsXG4gICAgYmluZGluZ3MsXG4gICAgYmluZGluZ0ZsYWdzOiBjYWxjQmluZGluZ0ZsYWdzKGJpbmRpbmdzKSxcbiAgICBvdXRwdXRzLFxuICAgIGVsZW1lbnQ6IG51bGwsXG4gICAgcHJvdmlkZXI6IHt0b2tlbiwgdmFsdWUsIGRlcHM6IGRlcERlZnN9LFxuICAgIHRleHQ6IG51bGwsXG4gICAgcXVlcnk6IG51bGwsXG4gICAgbmdDb250ZW50OiBudWxsXG4gIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQcm92aWRlckluc3RhbmNlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICByZXR1cm4gX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UodmlldywgZGVmKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVBpcGVJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgLy8gZGVwcyBhcmUgbG9va2VkIHVwIGZyb20gY29tcG9uZW50LlxuICBsZXQgY29tcFZpZXcgPSB2aWV3O1xuICB3aGlsZSAoY29tcFZpZXcucGFyZW50ICYmICFpc0NvbXBvbmVudFZpZXcoY29tcFZpZXcpKSB7XG4gICAgY29tcFZpZXcgPSBjb21wVmlldy5wYXJlbnQ7XG4gIH1cbiAgLy8gcGlwZXMgY2FuIHNlZSB0aGUgcHJpdmF0ZSBzZXJ2aWNlcyBvZiB0aGUgY29tcG9uZW50XG4gIGNvbnN0IGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gdHJ1ZTtcbiAgLy8gcGlwZXMgYXJlIGFsd2F5cyBlYWdlciBhbmQgY2xhc3NlcyFcbiAgcmV0dXJuIGNyZWF0ZUNsYXNzKFxuICAgICAgY29tcFZpZXcucGFyZW50ISwgdmlld1BhcmVudEVsKGNvbXBWaWV3KSEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZWYucHJvdmlkZXIhLnZhbHVlLFxuICAgICAgZGVmLnByb3ZpZGVyIS5kZXBzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZURpcmVjdGl2ZUluc3RhbmNlKHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYpOiBhbnkge1xuICAvLyBjb21wb25lbnRzIGNhbiBzZWUgb3RoZXIgcHJpdmF0ZSBzZXJ2aWNlcywgb3RoZXIgZGlyZWN0aXZlcyBjYW4ndC5cbiAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPSAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkgPiAwO1xuICAvLyBkaXJlY3RpdmVzIGFyZSBhbHdheXMgZWFnZXIgYW5kIGNsYXNzZXMhXG4gIGNvbnN0IGluc3RhbmNlID1cbiAgICAgIGNyZWF0ZUNsYXNzKHZpZXcsIGRlZi5wYXJlbnQhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVmLnByb3ZpZGVyIS52YWx1ZSwgZGVmLnByb3ZpZGVyIS5kZXBzKTtcbiAgaWYgKGRlZi5vdXRwdXRzLmxlbmd0aCkge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVmLm91dHB1dHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGRlZi5vdXRwdXRzW2ldO1xuICAgICAgY29uc3Qgb3V0cHV0T2JzZXJ2YWJsZSA9IGluc3RhbmNlW291dHB1dC5wcm9wTmFtZSFdO1xuICAgICAgaWYgKGlzT2JzZXJ2YWJsZShvdXRwdXRPYnNlcnZhYmxlKSkge1xuICAgICAgICBjb25zdCBzdWJzY3JpcHRpb24gPSBvdXRwdXRPYnNlcnZhYmxlLnN1YnNjcmliZShcbiAgICAgICAgICAgIGV2ZW50SGFuZGxlckNsb3N1cmUodmlldywgZGVmLnBhcmVudCEubm9kZUluZGV4LCBvdXRwdXQuZXZlbnROYW1lKSk7XG4gICAgICAgIHZpZXcuZGlzcG9zYWJsZXMhW2RlZi5vdXRwdXRJbmRleCArIGldID0gc3Vic2NyaXB0aW9uLnVuc3Vic2NyaWJlLmJpbmQoc3Vic2NyaXB0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICAgIGBAT3V0cHV0ICR7b3V0cHV0LnByb3BOYW1lfSBub3QgaW5pdGlhbGl6ZWQgaW4gJyR7aW5zdGFuY2UuY29uc3RydWN0b3IubmFtZX0nLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gaW5zdGFuY2U7XG59XG5cbmZ1bmN0aW9uIGV2ZW50SGFuZGxlckNsb3N1cmUodmlldzogVmlld0RhdGEsIGluZGV4OiBudW1iZXIsIGV2ZW50TmFtZTogc3RyaW5nKSB7XG4gIHJldHVybiAoZXZlbnQ6IGFueSkgPT4gZGlzcGF0Y2hFdmVudCh2aWV3LCBpbmRleCwgZXZlbnROYW1lLCBldmVudCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZURpcmVjdGl2ZUlubGluZShcbiAgICB2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmLCB2MDogYW55LCB2MTogYW55LCB2MjogYW55LCB2MzogYW55LCB2NDogYW55LCB2NTogYW55LCB2NjogYW55LFxuICAgIHY3OiBhbnksIHY4OiBhbnksIHY5OiBhbnkpOiBib29sZWFuIHtcbiAgY29uc3QgcHJvdmlkZXJEYXRhID0gYXNQcm92aWRlckRhdGEodmlldywgZGVmLm5vZGVJbmRleCk7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IHByb3ZpZGVyRGF0YS5pbnN0YW5jZTtcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgbGV0IGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMgPSB1bmRlZmluZWQhO1xuICBjb25zdCBiaW5kTGVuID0gZGVmLmJpbmRpbmdzLmxlbmd0aDtcbiAgaWYgKGJpbmRMZW4gPiAwICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDAsIHYwKSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCAwLCB2MCwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiAxICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDEsIHYxKSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCAxLCB2MSwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiAyICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDIsIHYyKSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCAyLCB2MiwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiAzICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDMsIHYzKSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCAzLCB2MywgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA0ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDQsIHY0KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA0LCB2NCwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA1ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDUsIHY1KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA1LCB2NSwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA2ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDYsIHY2KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA2LCB2NiwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA3ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDcsIHY3KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA3LCB2NywgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA4ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDgsIHY4KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA4LCB2OCwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGJpbmRMZW4gPiA5ICYmIGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIDksIHY5KSkge1xuICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCA5LCB2OSwgY2hhbmdlcyk7XG4gIH1cbiAgaWYgKGNoYW5nZXMpIHtcbiAgICBkaXJlY3RpdmUubmdPbkNoYW5nZXMoY2hhbmdlcyk7XG4gIH1cbiAgaWYgKChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuT25Jbml0KSAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ09uSW5pdCwgZGVmLm5vZGVJbmRleCkpIHtcbiAgICBkaXJlY3RpdmUubmdPbkluaXQoKTtcbiAgfVxuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkRvQ2hlY2spIHtcbiAgICBkaXJlY3RpdmUubmdEb0NoZWNrKCk7XG4gIH1cbiAgcmV0dXJuIGNoYW5nZWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0FuZFVwZGF0ZURpcmVjdGl2ZUR5bmFtaWMoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdmFsdWVzOiBhbnlbXSk6IGJvb2xlYW4ge1xuICBjb25zdCBwcm92aWRlckRhdGEgPSBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBkZWYubm9kZUluZGV4KTtcbiAgY29uc3QgZGlyZWN0aXZlID0gcHJvdmlkZXJEYXRhLmluc3RhbmNlO1xuICBsZXQgY2hhbmdlZCA9IGZhbHNlO1xuICBsZXQgY2hhbmdlczogU2ltcGxlQ2hhbmdlcyA9IHVuZGVmaW5lZCE7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGNoZWNrQmluZGluZyh2aWV3LCBkZWYsIGksIHZhbHVlc1tpXSkpIHtcbiAgICAgIGNoYW5nZWQgPSB0cnVlO1xuICAgICAgY2hhbmdlcyA9IHVwZGF0ZVByb3AodmlldywgcHJvdmlkZXJEYXRhLCBkZWYsIGksIHZhbHVlc1tpXSwgY2hhbmdlcyk7XG4gICAgfVxuICB9XG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgZGlyZWN0aXZlLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG4gIGlmICgoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uSW5pdCkgJiZcbiAgICAgIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vayh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdPbkluaXQsIGRlZi5ub2RlSW5kZXgpKSB7XG4gICAgZGlyZWN0aXZlLm5nT25Jbml0KCk7XG4gIH1cbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Eb0NoZWNrKSB7XG4gICAgZGlyZWN0aXZlLm5nRG9DaGVjaygpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5mdW5jdGlvbiBfY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgLy8gcHJpdmF0ZSBzZXJ2aWNlcyBjYW4gc2VlIG90aGVyIHByaXZhdGUgc2VydmljZXNcbiAgY29uc3QgYWxsb3dQcml2YXRlU2VydmljZXMgPSAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlByaXZhdGVQcm92aWRlcikgPiAwO1xuICBjb25zdCBwcm92aWRlckRlZiA9IGRlZi5wcm92aWRlcjtcbiAgc3dpdGNoIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuVHlwZXMpIHtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlQ2xhc3NQcm92aWRlcjpcbiAgICAgIHJldHVybiBjcmVhdGVDbGFzcyhcbiAgICAgICAgICB2aWV3LCBkZWYucGFyZW50ISwgYWxsb3dQcml2YXRlU2VydmljZXMsIHByb3ZpZGVyRGVmIS52YWx1ZSwgcHJvdmlkZXJEZWYhLmRlcHMpO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVGYWN0b3J5UHJvdmlkZXI6XG4gICAgICByZXR1cm4gY2FsbEZhY3RvcnkoXG4gICAgICAgICAgdmlldywgZGVmLnBhcmVudCEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBwcm92aWRlckRlZiEudmFsdWUsIHByb3ZpZGVyRGVmIS5kZXBzKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVXNlRXhpc3RpbmdQcm92aWRlcjpcbiAgICAgIHJldHVybiByZXNvbHZlRGVwKHZpZXcsIGRlZi5wYXJlbnQhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgcHJvdmlkZXJEZWYhLmRlcHNbMF0pO1xuICAgIGNhc2UgTm9kZUZsYWdzLlR5cGVWYWx1ZVByb3ZpZGVyOlxuICAgICAgcmV0dXJuIHByb3ZpZGVyRGVmIS52YWx1ZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjcmVhdGVDbGFzcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuLCBjdG9yOiBhbnksIGRlcHM6IERlcERlZltdKTogYW55IHtcbiAgY29uc3QgbGVuID0gZGVwcy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSk7XG4gICAgY2FzZSAyOlxuICAgICAgcmV0dXJuIG5ldyBjdG9yKFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1sxXSkpO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBuZXcgY3RvcihcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMV0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzJdKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IGRlcFZhbHVlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBkZXBWYWx1ZXMucHVzaChyZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1tpXSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBjdG9yKC4uLmRlcFZhbHVlcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbEZhY3RvcnkoXG4gICAgdmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbiwgZmFjdG9yeTogYW55LFxuICAgIGRlcHM6IERlcERlZltdKTogYW55IHtcbiAgY29uc3QgbGVuID0gZGVwcy5sZW5ndGg7XG4gIHN3aXRjaCAobGVuKSB7XG4gICAgY2FzZSAwOlxuICAgICAgcmV0dXJuIGZhY3RvcnkoKTtcbiAgICBjYXNlIDE6XG4gICAgICByZXR1cm4gZmFjdG9yeShyZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSkpO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBmYWN0b3J5KFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1sxXSkpO1xuICAgIGNhc2UgMzpcbiAgICAgIHJldHVybiBmYWN0b3J5KFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzBdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1sxXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMl0pKTtcbiAgICBkZWZhdWx0OlxuICAgICAgY29uc3QgZGVwVmFsdWVzID0gW107XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIGRlcFZhbHVlcy5wdXNoKHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzW2ldKSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFjdG9yeSguLi5kZXBWYWx1ZXMpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRGVwKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgYWxsb3dQcml2YXRlU2VydmljZXM6IGJvb2xlYW4sIGRlcERlZjogRGVwRGVmLFxuICAgIG5vdEZvdW5kVmFsdWU6IGFueSA9IEluamVjdG9yLlRIUk9XX0lGX05PVF9GT1VORCk6IGFueSB7XG4gIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5WYWx1ZSkge1xuICAgIHJldHVybiBkZXBEZWYudG9rZW47XG4gIH1cbiAgY29uc3Qgc3RhcnRWaWV3ID0gdmlldztcbiAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLk9wdGlvbmFsKSB7XG4gICAgbm90Rm91bmRWYWx1ZSA9IG51bGw7XG4gIH1cbiAgY29uc3QgdG9rZW5LZXkgPSBkZXBEZWYudG9rZW5LZXk7XG5cbiAgaWYgKHRva2VuS2V5ID09PSBDaGFuZ2VEZXRlY3RvclJlZlRva2VuS2V5KSB7XG4gICAgLy8gZGlyZWN0aXZlcyBvbiB0aGUgc2FtZSBlbGVtZW50IGFzIGEgY29tcG9uZW50IHNob3VsZCBiZSBhYmxlIHRvIGNvbnRyb2wgdGhlIGNoYW5nZSBkZXRlY3RvclxuICAgIC8vIG9mIHRoYXQgY29tcG9uZW50IGFzIHdlbGwuXG4gICAgYWxsb3dQcml2YXRlU2VydmljZXMgPSAhIShlbERlZiAmJiBlbERlZi5lbGVtZW50IS5jb21wb25lbnRWaWV3KTtcbiAgfVxuXG4gIGlmIChlbERlZiAmJiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuU2tpcFNlbGYpKSB7XG4gICAgYWxsb3dQcml2YXRlU2VydmljZXMgPSBmYWxzZTtcbiAgICBlbERlZiA9IGVsRGVmLnBhcmVudCE7XG4gIH1cblxuICBsZXQgc2VhcmNoVmlldzogVmlld0RhdGF8bnVsbCA9IHZpZXc7XG4gIHdoaWxlIChzZWFyY2hWaWV3KSB7XG4gICAgaWYgKGVsRGVmKSB7XG4gICAgICBzd2l0Y2ggKHRva2VuS2V5KSB7XG4gICAgICAgIGNhc2UgUmVuZGVyZXIyVG9rZW5LZXk6IHtcbiAgICAgICAgICBjb25zdCBjb21wVmlldyA9IGZpbmRDb21wVmlldyhzZWFyY2hWaWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMpO1xuICAgICAgICAgIHJldHVybiBjb21wVmlldy5yZW5kZXJlcjtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEVsZW1lbnRSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gbmV3IEVsZW1lbnRSZWYoYXNFbGVtZW50RGF0YShzZWFyY2hWaWV3LCBlbERlZi5ub2RlSW5kZXgpLnJlbmRlckVsZW1lbnQpO1xuICAgICAgICBjYXNlIFZpZXdDb250YWluZXJSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gYXNFbGVtZW50RGF0YShzZWFyY2hWaWV3LCBlbERlZi5ub2RlSW5kZXgpLnZpZXdDb250YWluZXI7XG4gICAgICAgIGNhc2UgVGVtcGxhdGVSZWZUb2tlbktleToge1xuICAgICAgICAgIGlmIChlbERlZi5lbGVtZW50IS50ZW1wbGF0ZSkge1xuICAgICAgICAgICAgcmV0dXJuIGFzRWxlbWVudERhdGEoc2VhcmNoVmlldywgZWxEZWYubm9kZUluZGV4KS50ZW1wbGF0ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBDaGFuZ2VEZXRlY3RvclJlZlRva2VuS2V5OiB7XG4gICAgICAgICAgbGV0IGNkVmlldyA9IGZpbmRDb21wVmlldyhzZWFyY2hWaWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMpO1xuICAgICAgICAgIHJldHVybiBjcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihjZFZpZXcpO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgSW5qZWN0b3JSZWZUb2tlbktleTpcbiAgICAgICAgY2FzZSBJTkpFQ1RPUlJlZlRva2VuS2V5OlxuICAgICAgICAgIHJldHVybiBjcmVhdGVJbmplY3RvcihzZWFyY2hWaWV3LCBlbERlZik7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgY29uc3QgcHJvdmlkZXJEZWYgPVxuICAgICAgICAgICAgICAoYWxsb3dQcml2YXRlU2VydmljZXMgPyBlbERlZi5lbGVtZW50IS5hbGxQcm92aWRlcnMgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbERlZi5lbGVtZW50IS5wdWJsaWNQcm92aWRlcnMpIVt0b2tlbktleV07XG4gICAgICAgICAgaWYgKHByb3ZpZGVyRGVmKSB7XG4gICAgICAgICAgICBsZXQgcHJvdmlkZXJEYXRhID0gYXNQcm92aWRlckRhdGEoc2VhcmNoVmlldywgcHJvdmlkZXJEZWYubm9kZUluZGV4KTtcbiAgICAgICAgICAgIGlmICghcHJvdmlkZXJEYXRhKSB7XG4gICAgICAgICAgICAgIHByb3ZpZGVyRGF0YSA9IHtpbnN0YW5jZTogX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2Uoc2VhcmNoVmlldywgcHJvdmlkZXJEZWYpfTtcbiAgICAgICAgICAgICAgc2VhcmNoVmlldy5ub2Rlc1twcm92aWRlckRlZi5ub2RlSW5kZXhdID0gcHJvdmlkZXJEYXRhIGFzIGFueTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gICAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gaXNDb21wb25lbnRWaWV3KHNlYXJjaFZpZXcpO1xuICAgIGVsRGVmID0gdmlld1BhcmVudEVsKHNlYXJjaFZpZXcpITtcbiAgICBzZWFyY2hWaWV3ID0gc2VhcmNoVmlldy5wYXJlbnQhO1xuXG4gICAgaWYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNlbGYpIHtcbiAgICAgIHNlYXJjaFZpZXcgPSBudWxsO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IHZhbHVlID0gc3RhcnRWaWV3LnJvb3QuaW5qZWN0b3IuZ2V0KGRlcERlZi50b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUik7XG5cbiAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SIHx8XG4gICAgICBub3RGb3VuZFZhbHVlID09PSBOT1RfRk9VTkRfQ0hFQ0tfT05MWV9FTEVNRU5UX0lOSkVDVE9SKSB7XG4gICAgLy8gUmV0dXJuIHRoZSB2YWx1ZSBmcm9tIHRoZSByb290IGVsZW1lbnQgaW5qZWN0b3Igd2hlblxuICAgIC8vIC0gaXQgcHJvdmlkZXMgaXRcbiAgICAvLyAgICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICAvLyAtIHRoZSBtb2R1bGUgaW5qZWN0b3Igc2hvdWxkIG5vdCBiZSBjaGVja2VkXG4gICAgLy8gICAobm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUilcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICByZXR1cm4gc3RhcnRWaWV3LnJvb3QubmdNb2R1bGUuaW5qZWN0b3IuZ2V0KGRlcERlZi50b2tlbiwgbm90Rm91bmRWYWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZpbmRDb21wVmlldyh2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuKSB7XG4gIGxldCBjb21wVmlldzogVmlld0RhdGE7XG4gIGlmIChhbGxvd1ByaXZhdGVTZXJ2aWNlcykge1xuICAgIGNvbXBWaWV3ID0gYXNFbGVtZW50RGF0YSh2aWV3LCBlbERlZi5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gIH0gZWxzZSB7XG4gICAgY29tcFZpZXcgPSB2aWV3O1xuICAgIHdoaWxlIChjb21wVmlldy5wYXJlbnQgJiYgIWlzQ29tcG9uZW50Vmlldyhjb21wVmlldykpIHtcbiAgICAgIGNvbXBWaWV3ID0gY29tcFZpZXcucGFyZW50O1xuICAgIH1cbiAgfVxuICByZXR1cm4gY29tcFZpZXc7XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZVByb3AoXG4gICAgdmlldzogVmlld0RhdGEsIHByb3ZpZGVyRGF0YTogUHJvdmlkZXJEYXRhLCBkZWY6IE5vZGVEZWYsIGJpbmRpbmdJZHg6IG51bWJlciwgdmFsdWU6IGFueSxcbiAgICBjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzKTogU2ltcGxlQ2hhbmdlcyB7XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuQ29tcG9uZW50KSB7XG4gICAgY29uc3QgY29tcFZpZXcgPSBhc0VsZW1lbnREYXRhKHZpZXcsIGRlZi5wYXJlbnQhLm5vZGVJbmRleCkuY29tcG9uZW50VmlldztcbiAgICBpZiAoY29tcFZpZXcuZGVmLmZsYWdzICYgVmlld0ZsYWdzLk9uUHVzaCkge1xuICAgICAgY29tcFZpZXcuc3RhdGUgfD0gVmlld1N0YXRlLkNoZWNrc0VuYWJsZWQ7XG4gICAgfVxuICB9XG4gIGNvbnN0IGJpbmRpbmcgPSBkZWYuYmluZGluZ3NbYmluZGluZ0lkeF07XG4gIGNvbnN0IHByb3BOYW1lID0gYmluZGluZy5uYW1lITtcbiAgLy8gTm90ZTogVGhpcyBpcyBzdGlsbCBzYWZlIHdpdGggQ2xvc3VyZSBDb21waWxlciBhc1xuICAvLyB0aGUgdXNlciBwYXNzZWQgaW4gdGhlIHByb3BlcnR5IG5hbWUgYXMgYW4gb2JqZWN0IGhhcyB0byBgcHJvdmlkZXJEZWZgLFxuICAvLyBzbyBDbG9zdXJlIENvbXBpbGVyIHdpbGwgaGF2ZSByZW5hbWVkIHRoZSBwcm9wZXJ0eSBjb3JyZWN0bHkgYWxyZWFkeS5cbiAgcHJvdmlkZXJEYXRhLmluc3RhbmNlW3Byb3BOYW1lXSA9IHZhbHVlO1xuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uQ2hhbmdlcykge1xuICAgIGNoYW5nZXMgPSBjaGFuZ2VzIHx8IHt9O1xuICAgIGNvbnN0IG9sZFZhbHVlID0gdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdO1xuICAgIGNvbnN0IGJpbmRpbmcgPSBkZWYuYmluZGluZ3NbYmluZGluZ0lkeF07XG4gICAgY2hhbmdlc1tiaW5kaW5nLm5vbk1pbmlmaWVkTmFtZSFdID1cbiAgICAgICAgbmV3IFNpbXBsZUNoYW5nZShvbGRWYWx1ZSwgdmFsdWUsICh2aWV3LnN0YXRlICYgVmlld1N0YXRlLkZpcnN0Q2hlY2spICE9PSAwKTtcbiAgfVxuICB2aWV3Lm9sZFZhbHVlc1tkZWYuYmluZGluZ0luZGV4ICsgYmluZGluZ0lkeF0gPSB2YWx1ZTtcbiAgcmV0dXJuIGNoYW5nZXM7XG59XG5cbi8vIFRoaXMgZnVuY3Rpb24gY2FsbHMgdGhlIG5nQWZ0ZXJDb250ZW50Q2hlY2ssIG5nQWZ0ZXJDb250ZW50SW5pdCxcbi8vIG5nQWZ0ZXJWaWV3Q2hlY2ssIGFuZCBuZ0FmdGVyVmlld0luaXQgbGlmZWN5Y2xlIGhvb2tzIChkZXBlbmRpbmcgb24gdGhlIG5vZGVcbi8vIGZsYWdzIGluIGxpZmVjeWNsZSkuIFVubGlrZSBuZ0RvQ2hlY2ssIG5nT25DaGFuZ2VzIGFuZCBuZ09uSW5pdCwgd2hpY2ggYXJlXG4vLyBjYWxsZWQgZHVyaW5nIGEgcHJlLW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgdmlldyB0cmVlICh0aGF0IGlzIGNhbGxpbmcgdGhlXG4vLyBwYXJlbnQgaG9va3MgYmVmb3JlIHRoZSBjaGlsZCBob29rcykgdGhlc2UgZXZlbnRzIGFyZSBzZW50IGluIHVzaW5nIGFcbi8vIHBvc3Qtb3JkZXIgdHJhdmVyc2FsIG9mIHRoZSB0cmVlIChjaGlsZHJlbiBiZWZvcmUgcGFyZW50cykuIFRoaXMgY2hhbmdlcyB0aGVcbi8vIG1lYW5pbmcgb2YgaW5pdEluZGV4IGluIHRoZSB2aWV3IHN0YXRlLiBGb3IgbmdPbkluaXQsIGluaXRJbmRleCB0cmFja3MgdGhlXG4vLyBleHBlY3RlZCBub2RlSW5kZXggd2hpY2ggYSBuZ09uSW5pdCBzaG91bGQgYmUgY2FsbGVkLiBXaGVuIHNlbmRpbmdcbi8vIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlclZpZXdJbml0IGl0IGlzIHRoZSBleHBlY3RlZCBjb3VudCBvZlxuLy8gbmdBZnRlckNvbnRlbnRJbml0IG9yIG5nQWZ0ZXJWaWV3SW5pdCBtZXRob2RzIHRoYXQgaGF2ZSBiZWVuIGNhbGxlZC4gVGhpc1xuLy8gZW5zdXJlIHRoYXQgZGVzcGl0ZSBiZWluZyBjYWxsZWQgcmVjdXJzaXZlbHkgb3IgYWZ0ZXIgcGlja2luZyB1cCBhZnRlciBhblxuLy8gZXhjZXB0aW9uLCB0aGUgbmdBZnRlckNvbnRlbnRJbml0IG9yIG5nQWZ0ZXJWaWV3SW5pdCB3aWxsIGJlIGNhbGxlZCBvbiB0aGVcbi8vIGNvcnJlY3Qgbm9kZXMuIENvbnNpZGVyIGZvciBleGFtcGxlLCB0aGUgZm9sbG93aW5nICh3aGVyZSBFIGlzIGFuIGVsZW1lbnRcbi8vIGFuZCBEIGlzIGEgZGlyZWN0aXZlKVxuLy8gIFRyZWU6ICAgICAgIHByZS1vcmRlciBpbmRleCAgcG9zdC1vcmRlciBpbmRleFxuLy8gICAgRTEgICAgICAgIDAgICAgICAgICAgICAgICAgNlxuLy8gICAgICBFMiAgICAgIDEgICAgICAgICAgICAgICAgMVxuLy8gICAgICAgRDMgICAgIDIgICAgICAgICAgICAgICAgMFxuLy8gICAgICBFNCAgICAgIDMgICAgICAgICAgICAgICAgNVxuLy8gICAgICAgRTUgICAgIDQgICAgICAgICAgICAgICAgNFxuLy8gICAgICAgIEU2ICAgIDUgICAgICAgICAgICAgICAgMlxuLy8gICAgICAgIEU3ICAgIDYgICAgICAgICAgICAgICAgM1xuLy8gQXMgY2FuIGJlIHNlZW4sIHRoZSBwb3N0LW9yZGVyIGluZGV4IGhhcyBhbiB1bmNsZWFyIHJlbGF0aW9uc2hpcCB0byB0aGVcbi8vIHByZS1vcmRlciBpbmRleCAocG9zdE9yZGVySW5kZXggPT09IHByZU9yZGVySW5kZXggLSBwYXJlbnRDb3VudCArXG4vLyBjaGlsZENvdW50KS4gU2luY2UgbnVtYmVyIG9mIGNhbGxzIHRvIG5nQWZ0ZXJDb250ZW50SW5pdCBhbmQgbmdBZnRlclZpZXdJbml0XG4vLyBhcmUgc3RhYmxlICh3aWxsIGJlIHRoZSBzYW1lIGZvciB0aGUgc2FtZSB2aWV3IHJlZ2FyZGxlc3Mgb2YgZXhjZXB0aW9ucyBvclxuLy8gcmVjdXJzaW9uKSB3ZSBqdXN0IG5lZWQgdG8gY291bnQgdGhlbSB3aGljaCB3aWxsIHJvdWdobHkgY29ycmVzcG9uZCB0byB0aGVcbi8vIHBvc3Qtb3JkZXIgaW5kZXggKGl0IHNraXBzIGVsZW1lbnRzIGFuZCBkaXJlY3RpdmVzIHRoYXQgZG8gbm90IGhhdmVcbi8vIGxpZmVjeWNsZSBob29rcykuXG4vL1xuLy8gRm9yIGV4YW1wbGUsIGlmIGFuIGV4Y2VwdGlvbiBpcyByYWlzZWQgaW4gdGhlIEU2Lm9uQWZ0ZXJWaWV3SW5pdCgpIHRoZVxuLy8gaW5pdEluZGV4IGlzIGxlZnQgYXQgMyAoYnkgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKCkgd2hpY2ggc2V0IGl0IHRvXG4vLyBpbml0SW5kZXggKyAxKS4gV2hlbiBjaGVja0FuZFVwZGF0ZVZpZXcoKSBpcyBjYWxsZWQgYWdhaW4gRDMsIEUyIGFuZCBFNiB3aWxsXG4vLyBub3QgaGF2ZSB0aGVpciBuZ0FmdGVyVmlld0luaXQoKSBjYWxsZWQgYnV0LCBzdGFydGluZyB3aXRoIEU3LCB0aGUgcmVzdCBvZlxuLy8gdGhlIHZpZXcgd2lsbCBiZWdpbiBnZXR0aW5nIG5nQWZ0ZXJWaWV3SW5pdCgpIGNhbGxlZCB1bnRpbCBhIGNoZWNrIGFuZFxuLy8gcGFzcyBpcyBjb21wbGV0ZS5cbi8vXG4vLyBUaGlzIGFsZ29ydGhpbSBhbHNvIGhhbmRsZXMgcmVjdXJzaW9uLiBDb25zaWRlciBpZiBFNCdzIG5nQWZ0ZXJWaWV3SW5pdCgpXG4vLyBpbmRpcmVjdGx5IGNhbGxzIEUxJ3MgQ2hhbmdlRGV0ZWN0b3JSZWYuZGV0ZWN0Q2hhbmdlcygpLiBUaGUgZXhwZWN0ZWRcbi8vIGluaXRJbmRleCBpcyBzZXQgdG8gNiwgdGhlIHJlY3VzaXZlIGNoZWNrQW5kVXBkYXRlVmlldygpIHN0YXJ0cyB3YWxrIGFnYWluLlxuLy8gRDMsIEUyLCBFNiwgRTcsIEU1IGFuZCBFNCBhcmUgc2tpcHBlZCwgbmdBZnRlclZpZXdJbml0KCkgaXMgY2FsbGVkIG9uIEUxLlxuLy8gV2hlbiB0aGUgcmVjdXJzaW9uIHJldHVybnMgdGhlIGluaXRJbmRleCB3aWxsIGJlIDcgc28gRTEgaXMgc2tpcHBlZCBhcyBpdFxuLy8gaGFzIGFscmVhZHkgYmVlbiBjYWxsZWQgaW4gdGhlIHJlY3Vyc2l2ZWx5IGNhbGxlZCBjaGVja0FuVXBkYXRlVmlldygpLlxuZXhwb3J0IGZ1bmN0aW9uIGNhbGxMaWZlY3ljbGVIb29rc0NoaWxkcmVuRmlyc3QodmlldzogVmlld0RhdGEsIGxpZmVjeWNsZXM6IE5vZGVGbGFncykge1xuICBpZiAoISh2aWV3LmRlZi5ub2RlRmxhZ3MgJiBsaWZlY3ljbGVzKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBub2RlcyA9IHZpZXcuZGVmLm5vZGVzO1xuICBsZXQgaW5pdEluZGV4ID0gMDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBub2Rlcy5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSBub2Rlc1tpXTtcbiAgICBsZXQgcGFyZW50ID0gbm9kZURlZi5wYXJlbnQ7XG4gICAgaWYgKCFwYXJlbnQgJiYgbm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgIC8vIG1hdGNoaW5nIHJvb3Qgbm9kZSAoZS5nLiBhIHBpcGUpXG4gICAgICBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKHZpZXcsIGksIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzLCBpbml0SW5kZXgrKyk7XG4gICAgfVxuICAgIGlmICgobm9kZURlZi5jaGlsZEZsYWdzICYgbGlmZWN5Y2xlcykgPT09IDApIHtcbiAgICAgIC8vIG5vIGNoaWxkIG1hdGNoZXMgb25lIG9mIHRoZSBsaWZlY3ljbGVzXG4gICAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgICB9XG4gICAgd2hpbGUgKHBhcmVudCAmJiAocGFyZW50LmZsYWdzICYgTm9kZUZsYWdzLlR5cGVFbGVtZW50KSAmJlxuICAgICAgICAgICBpID09PSBwYXJlbnQubm9kZUluZGV4ICsgcGFyZW50LmNoaWxkQ291bnQpIHtcbiAgICAgIC8vIGxhc3QgY2hpbGQgb2YgYW4gZWxlbWVudFxuICAgICAgaWYgKHBhcmVudC5kaXJlY3RDaGlsZEZsYWdzICYgbGlmZWN5Y2xlcykge1xuICAgICAgICBpbml0SW5kZXggPSBjYWxsRWxlbWVudFByb3ZpZGVyc0xpZmVjeWNsZXModmlldywgcGFyZW50LCBsaWZlY3ljbGVzLCBpbml0SW5kZXgpO1xuICAgICAgfVxuICAgICAgcGFyZW50ID0gcGFyZW50LnBhcmVudDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FsbEVsZW1lbnRQcm92aWRlcnNMaWZlY3ljbGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgbGlmZWN5Y2xlczogTm9kZUZsYWdzLCBpbml0SW5kZXg6IG51bWJlcik6IG51bWJlciB7XG4gIGZvciAobGV0IGkgPSBlbERlZi5ub2RlSW5kZXggKyAxOyBpIDw9IGVsRGVmLm5vZGVJbmRleCArIGVsRGVmLmNoaWxkQ291bnQ7IGkrKykge1xuICAgIGNvbnN0IG5vZGVEZWYgPSB2aWV3LmRlZi5ub2Rlc1tpXTtcbiAgICBpZiAobm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgIGNhbGxQcm92aWRlckxpZmVjeWNsZXModmlldywgaSwgbm9kZURlZi5mbGFncyAmIGxpZmVjeWNsZXMsIGluaXRJbmRleCsrKTtcbiAgICB9XG4gICAgLy8gb25seSB2aXNpdCBkaXJlY3QgY2hpbGRyZW5cbiAgICBpICs9IG5vZGVEZWYuY2hpbGRDb3VudDtcbiAgfVxuICByZXR1cm4gaW5pdEluZGV4O1xufVxuXG5mdW5jdGlvbiBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MsIGluaXRJbmRleDogbnVtYmVyKSB7XG4gIGNvbnN0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGluZGV4KTtcbiAgaWYgKCFwcm92aWRlckRhdGEpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcHJvdmlkZXIgPSBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gIGlmICghcHJvdmlkZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgU2VydmljZXMuc2V0Q3VycmVudE5vZGUodmlldywgaW5kZXgpO1xuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlckNvbnRlbnRJbml0ICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJDb250ZW50SW5pdCwgaW5pdEluZGV4KSkge1xuICAgIHByb3ZpZGVyLm5nQWZ0ZXJDb250ZW50SW5pdCgpO1xuICB9XG4gIGlmIChsaWZlY3ljbGVzICYgTm9kZUZsYWdzLkFmdGVyQ29udGVudENoZWNrZWQpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyQ29udGVudENoZWNrZWQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlclZpZXdJbml0ICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nQWZ0ZXJWaWV3SW5pdCwgaW5pdEluZGV4KSkge1xuICAgIHByb3ZpZGVyLm5nQWZ0ZXJWaWV3SW5pdCgpO1xuICB9XG4gIGlmIChsaWZlY3ljbGVzICYgTm9kZUZsYWdzLkFmdGVyVmlld0NoZWNrZWQpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyVmlld0NoZWNrZWQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5PbkRlc3Ryb3kpIHtcbiAgICBwcm92aWRlci5uZ09uRGVzdHJveSgpO1xuICB9XG59XG4iXX0=