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
import { Renderer2 } from '../render/api';
import { isObservable } from '../util/lang';
import { stringify } from '../util/stringify';
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
export const NOT_FOUND_CHECK_ONLY_ELEMENT_INJECTOR = {};
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
        const oldValue = WrappedValue.unwrap(view.oldValues[def.bindingIndex + bindingIdx]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvdmlkZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy92aWV3L3Byb3ZpZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxpQkFBaUIsRUFBRSxZQUFZLEVBQWlCLFlBQVksRUFBQyxNQUFNLHNDQUFzQyxDQUFDO0FBQ2xILE9BQU8sRUFBQyxRQUFRLEVBQUUsUUFBUSxFQUFFLGlCQUFpQixFQUFDLE1BQU0sT0FBTyxDQUFDO0FBQzVELE9BQU8sRUFBQyxVQUFVLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUNqRCxPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDbkQsT0FBTyxFQUFDLGdCQUFnQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDOUQsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4QyxPQUFPLEVBQUMsWUFBWSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFDLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUU1QyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsY0FBYyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQy9ELE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUF1SCxRQUFRLEVBQUUsMkJBQTJCLEVBQWlDLE1BQU0sU0FBUyxDQUFDO0FBQ2xQLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxZQUFZLEVBQUUsYUFBYSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUUsc0JBQXNCLEVBQUUsUUFBUSxFQUFFLFlBQVksRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUVwSixNQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM5QyxNQUFNLGtCQUFrQixHQUFHLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNoRCxNQUFNLHdCQUF3QixHQUFHLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBQzVELE1BQU0sbUJBQW1CLEdBQUcsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2xELE1BQU0seUJBQXlCLEdBQUcsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDOUQsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDL0MsTUFBTSxtQkFBbUIsR0FBRyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUM7QUFFL0MsTUFBTSxVQUFVLFlBQVksQ0FDeEIsVUFBa0IsRUFBRSxLQUFnQixFQUFFLGNBQXdELEVBQzlGLFVBQWtCLEVBQUUsSUFBUyxFQUFFLElBQTZCLEVBQzVELEtBQStDLEVBQy9DLE9BQXVDO0lBQ3pDLE1BQU0sUUFBUSxHQUFpQixFQUFFLENBQUM7SUFDbEMsSUFBSSxLQUFLLEVBQUU7UUFDVCxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssRUFBRTtZQUN0QixNQUFNLENBQUMsWUFBWSxFQUFFLGVBQWUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNwRCxRQUFRLENBQUMsWUFBWSxDQUFDLEdBQUc7Z0JBQ3ZCLEtBQUssc0JBQTJCO2dCQUNoQyxJQUFJLEVBQUUsSUFBSTtnQkFDVixlQUFlO2dCQUNmLEVBQUUsRUFBRSxJQUFJO2dCQUNSLGVBQWUsRUFBRSxJQUFJO2dCQUNyQixNQUFNLEVBQUUsSUFBSTthQUNiLENBQUM7U0FDSDtLQUNGO0lBQ0QsTUFBTSxVQUFVLEdBQWdCLEVBQUUsQ0FBQztJQUNuQyxJQUFJLE9BQU8sRUFBRTtRQUNYLEtBQUssSUFBSSxRQUFRLElBQUksT0FBTyxFQUFFO1lBQzVCLFVBQVUsQ0FBQyxJQUFJLENBQ1gsRUFBQyxJQUFJLHlCQUE0QixFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUMsUUFBUSxDQUFDLEVBQUMsQ0FBQyxDQUFDO1NBQy9GO0tBQ0Y7SUFDRCxLQUFLLDZCQUEyQixDQUFDO0lBQ2pDLE9BQU8sSUFBSSxDQUNQLFVBQVUsRUFBRSxLQUFLLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELE1BQU0sVUFBVSxPQUFPLENBQUMsS0FBZ0IsRUFBRSxJQUFTLEVBQUUsSUFBNkI7SUFDaEYsS0FBSyxxQkFBc0IsQ0FBQztJQUM1QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3BELENBQUM7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUN2QixLQUFnQixFQUFFLGNBQXdELEVBQUUsS0FBVSxFQUN0RixLQUFVLEVBQUUsSUFBNkI7SUFDM0MsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNoRSxDQUFDO0FBRUQsTUFBTSxVQUFVLElBQUksQ0FDaEIsVUFBa0IsRUFBRSxLQUFnQixFQUFFLGlCQUF5RCxFQUMvRixVQUFrQixFQUFFLEtBQVUsRUFBRSxLQUFVLEVBQUUsSUFBNkIsRUFDekUsUUFBdUIsRUFBRSxPQUFxQjtJQUNoRCxNQUFNLEVBQUMsY0FBYyxFQUFFLFVBQVUsRUFBRSxlQUFlLEVBQUMsR0FBRyxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0lBQ2hHLElBQUksQ0FBQyxPQUFPLEVBQUU7UUFDWixPQUFPLEdBQUcsRUFBRSxDQUFDO0tBQ2Q7SUFDRCxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsUUFBUSxHQUFHLEVBQUUsQ0FBQztLQUNmO0lBQ0Qsd0RBQXdEO0lBQ3hELHlEQUF5RDtJQUN6RCw4QkFBOEI7SUFDOUIsS0FBSyxHQUFHLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRWpDLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7SUFFckQsT0FBTztRQUNMLHNDQUFzQztRQUN0QyxTQUFTLEVBQUUsQ0FBQyxDQUFDO1FBQ2IsTUFBTSxFQUFFLElBQUk7UUFDWixZQUFZLEVBQUUsSUFBSTtRQUNsQixZQUFZLEVBQUUsQ0FBQyxDQUFDO1FBQ2hCLFdBQVcsRUFBRSxDQUFDLENBQUM7UUFDZixpQkFBaUI7UUFDakIsVUFBVTtRQUNWLEtBQUs7UUFDTCxVQUFVLEVBQUUsQ0FBQztRQUNiLGdCQUFnQixFQUFFLENBQUM7UUFDbkIsbUJBQW1CLEVBQUUsQ0FBQztRQUN0QixjQUFjO1FBQ2QsZUFBZTtRQUNmLFVBQVU7UUFDVixjQUFjLEVBQUUsQ0FBQyxDQUFDO1FBQ2xCLFVBQVU7UUFDVixRQUFRO1FBQ1IsWUFBWSxFQUFFLGdCQUFnQixDQUFDLFFBQVEsQ0FBQztRQUN4QyxPQUFPO1FBQ1AsT0FBTyxFQUFFLElBQUk7UUFDYixRQUFRLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUM7UUFDdkMsSUFBSSxFQUFFLElBQUk7UUFDVixLQUFLLEVBQUUsSUFBSTtRQUNYLFNBQVMsRUFBRSxJQUFJO0tBQ2hCLENBQUM7QUFDSixDQUFDO0FBRUQsTUFBTSxVQUFVLHNCQUFzQixDQUFDLElBQWMsRUFBRSxHQUFZO0lBQ2pFLE9BQU8sdUJBQXVCLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQzVDLENBQUM7QUFFRCxNQUFNLFVBQVUsa0JBQWtCLENBQUMsSUFBYyxFQUFFLEdBQVk7SUFDN0QscUNBQXFDO0lBQ3JDLElBQUksUUFBUSxHQUFHLElBQUksQ0FBQztJQUNwQixPQUFPLFFBQVEsQ0FBQyxNQUFNLElBQUksQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLEVBQUU7UUFDcEQsUUFBUSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7S0FDNUI7SUFDRCxzREFBc0Q7SUFDdEQsTUFBTSxvQkFBb0IsR0FBRyxJQUFJLENBQUM7SUFDbEMsc0NBQXNDO0lBQ3RDLE9BQU8sV0FBVyxDQUNkLFFBQVEsQ0FBQyxNQUFPLEVBQUUsWUFBWSxDQUFDLFFBQVEsQ0FBRSxFQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFTLENBQUMsS0FBSyxFQUNwRixHQUFHLENBQUMsUUFBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCLENBQUMsSUFBYyxFQUFFLEdBQVk7SUFDbEUscUVBQXFFO0lBQ3JFLE1BQU0sb0JBQW9CLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyx3QkFBc0IsQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNuRSwyQ0FBMkM7SUFDM0MsTUFBTSxRQUFRLEdBQ1YsV0FBVyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTyxFQUFFLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxRQUFTLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxRQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDbEcsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRTtRQUN0QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFDM0MsTUFBTSxNQUFNLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUM5QixNQUFNLGdCQUFnQixHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsUUFBUyxDQUFDLENBQUM7WUFDcEQsSUFBSSxZQUFZLENBQUMsZ0JBQWdCLENBQUMsRUFBRTtnQkFDbEMsTUFBTSxZQUFZLEdBQUcsZ0JBQWdCLENBQUMsU0FBUyxDQUMzQyxtQkFBbUIsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLE1BQU8sQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3hFLElBQUksQ0FBQyxXQUFZLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN0RjtpQkFBTTtnQkFDTCxNQUFNLElBQUksS0FBSyxDQUNYLFdBQVcsTUFBTSxDQUFDLFFBQVEsd0JBQXdCLFFBQVEsQ0FBQyxXQUFXLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQzthQUN0RjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBRUQsU0FBUyxtQkFBbUIsQ0FBQyxJQUFjLEVBQUUsS0FBYSxFQUFFLFNBQWlCO0lBQzNFLE9BQU8sQ0FBQyxLQUFVLEVBQUUsRUFBRSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN0RSxDQUFDO0FBRUQsTUFBTSxVQUFVLDZCQUE2QixDQUN6QyxJQUFjLEVBQUUsR0FBWSxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPLEVBQUUsRUFBTyxFQUFFLEVBQU8sRUFDM0YsRUFBTyxFQUFFLEVBQU8sRUFBRSxFQUFPO0lBQzNCLE1BQU0sWUFBWSxHQUFHLGNBQWMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3pELE1BQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxRQUFRLENBQUM7SUFDeEMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0lBQ3BCLElBQUksT0FBTyxHQUFrQixTQUFVLENBQUM7SUFDeEMsTUFBTSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUM7SUFDcEMsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtRQUNqRCxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ2YsT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLEVBQUUsWUFBWSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQy9EO0lBQ0QsSUFBSSxPQUFPLEdBQUcsQ0FBQyxJQUFJLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMs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Q0FBQyxZQUFZLEVBQUU7UUFDakIsT0FBTztLQUNSO0lBQ0QsTUFBTSxRQUFRLEdBQUcsWUFBWSxDQUFDLFFBQVEsQ0FBQztJQUN2QyxJQUFJLENBQUMsUUFBUSxFQUFFO1FBQ2IsT0FBTztLQUNSO0lBQ0QsUUFBUSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDckMsSUFBSSxVQUFVLGlDQUE2QjtRQUN2QywyQkFBMkIsQ0FBQyxJQUFJLCtDQUErQyxTQUFTLENBQUMsRUFBRTtRQUM3RixRQUFRLENBQUMsa0JBQWtCLEVBQUUsQ0FBQztLQUMvQjtJQUNELElBQUksVUFBVSxvQ0FBZ0MsRUFBRTtRQUM5QyxRQUFRLENBQUMscUJBQXFCLEVBQUUsQ0FBQztLQUNsQztJQUNELElBQUksVUFBVSw4QkFBMEI7UUFDcEMsMkJBQTJCLENBQUMsSUFBSSw0Q0FBNEMsU0FBUyxDQUFDLEVBQUU7UUFDMUYsUUFBUSxDQUFDLGVBQWUsRUFBRSxDQUFDO0tBQzVCO0lBQ0QsSUFBSSxVQUFVLGlDQUE2QixFQUFFO1FBQzNDLFFBQVEsQ0FBQyxrQkFBa0IsRUFBRSxDQUFDO0tBQy9CO0lBQ0QsSUFBSSxVQUFVLHlCQUFzQixFQUFFO1FBQ3BDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQztLQUN4QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYsIFNpbXBsZUNoYW5nZSwgU2ltcGxlQ2hhbmdlcywgV3JhcHBlZFZhbHVlfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUiwgSW5qZWN0b3IsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaSc7XG5pbXBvcnQge0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyL2FwaSc7XG5pbXBvcnQge2lzT2JzZXJ2YWJsZX0gZnJvbSAnLi4vdXRpbC9sYW5nJztcbmltcG9ydCB7c3RyaW5naWZ5fSBmcm9tICcuLi91dGlsL3N0cmluZ2lmeSc7XG5cbmltcG9ydCB7Y3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYsIGNyZWF0ZUluamVjdG9yfSBmcm9tICcuL3JlZnMnO1xuaW1wb3J0IHthc0VsZW1lbnREYXRhLCBhc1Byb3ZpZGVyRGF0YSwgQmluZGluZ0RlZiwgQmluZGluZ0ZsYWdzLCBEZXBEZWYsIERlcEZsYWdzLCBOb2RlRGVmLCBOb2RlRmxhZ3MsIE91dHB1dERlZiwgT3V0cHV0VHlwZSwgUHJvdmlkZXJEYXRhLCBRdWVyeVZhbHVlVHlwZSwgU2VydmljZXMsIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vaywgVmlld0RhdGEsIFZpZXdGbGFncywgVmlld1N0YXRlfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7Y2FsY0JpbmRpbmdGbGFncywgY2hlY2tCaW5kaW5nLCBkaXNwYXRjaEV2ZW50LCBpc0NvbXBvbmVudFZpZXcsIHNwbGl0RGVwc0RzbCwgc3BsaXRNYXRjaGVkUXVlcmllc0RzbCwgdG9rZW5LZXksIHZpZXdQYXJlbnRFbH0gZnJvbSAnLi91dGlsJztcblxuY29uc3QgUmVuZGVyZXIyVG9rZW5LZXkgPSB0b2tlbktleShSZW5kZXJlcjIpO1xuY29uc3QgRWxlbWVudFJlZlRva2VuS2V5ID0gdG9rZW5LZXkoRWxlbWVudFJlZik7XG5jb25zdCBWaWV3Q29udGFpbmVyUmVmVG9rZW5LZXkgPSB0b2tlbktleShWaWV3Q29udGFpbmVyUmVmKTtcbmNvbnN0IFRlbXBsYXRlUmVmVG9rZW5LZXkgPSB0b2tlbktleShUZW1wbGF0ZVJlZik7XG5jb25zdCBDaGFuZ2VEZXRlY3RvclJlZlRva2VuS2V5ID0gdG9rZW5LZXkoQ2hhbmdlRGV0ZWN0b3JSZWYpO1xuY29uc3QgSW5qZWN0b3JSZWZUb2tlbktleSA9IHRva2VuS2V5KEluamVjdG9yKTtcbmNvbnN0IElOSkVDVE9SUmVmVG9rZW5LZXkgPSB0b2tlbktleShJTkpFQ1RPUik7XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVEZWYoXG4gICAgY2hlY2tJbmRleDogbnVtYmVyLCBmbGFnczogTm9kZUZsYWdzLCBtYXRjaGVkUXVlcmllczogbnVsbHxbc3RyaW5nIHwgbnVtYmVyLCBRdWVyeVZhbHVlVHlwZV1bXSxcbiAgICBjaGlsZENvdW50OiBudW1iZXIsIGN0b3I6IGFueSwgZGVwczogKFtEZXBGbGFncywgYW55XXxhbnkpW10sXG4gICAgcHJvcHM/OiBudWxsfHtbbmFtZTogc3RyaW5nXTogW251bWJlciwgc3RyaW5nXX0sXG4gICAgb3V0cHV0cz86IG51bGx8e1tuYW1lOiBzdHJpbmddOiBzdHJpbmd9KTogTm9kZURlZiB7XG4gIGNvbnN0IGJpbmRpbmdzOiBCaW5kaW5nRGVmW10gPSBbXTtcbiAgaWYgKHByb3BzKSB7XG4gICAgZm9yIChsZXQgcHJvcCBpbiBwcm9wcykge1xuICAgICAgY29uc3QgW2JpbmRpbmdJbmRleCwgbm9uTWluaWZpZWROYW1lXSA9IHByb3BzW3Byb3BdO1xuICAgICAgYmluZGluZ3NbYmluZGluZ0luZGV4XSA9IHtcbiAgICAgICAgZmxhZ3M6IEJpbmRpbmdGbGFncy5UeXBlUHJvcGVydHksXG4gICAgICAgIG5hbWU6IHByb3AsXG4gICAgICAgIG5vbk1pbmlmaWVkTmFtZSxcbiAgICAgICAgbnM6IG51bGwsXG4gICAgICAgIHNlY3VyaXR5Q29udGV4dDogbnVsbCxcbiAgICAgICAgc3VmZml4OiBudWxsXG4gICAgICB9O1xuICAgIH1cbiAgfVxuICBjb25zdCBvdXRwdXREZWZzOiBPdXRwdXREZWZbXSA9IFtdO1xuICBpZiAob3V0cHV0cykge1xuICAgIGZvciAobGV0IHByb3BOYW1lIGluIG91dHB1dHMpIHtcbiAgICAgIG91dHB1dERlZnMucHVzaChcbiAgICAgICAgICB7dHlwZTogT3V0cHV0VHlwZS5EaXJlY3RpdmVPdXRwdXQsIHByb3BOYW1lLCB0YXJnZXQ6IG51bGwsIGV2ZW50TmFtZTogb3V0cHV0c1twcm9wTmFtZV19KTtcbiAgICB9XG4gIH1cbiAgZmxhZ3MgfD0gTm9kZUZsYWdzLlR5cGVEaXJlY3RpdmU7XG4gIHJldHVybiBfZGVmKFxuICAgICAgY2hlY2tJbmRleCwgZmxhZ3MsIG1hdGNoZWRRdWVyaWVzLCBjaGlsZENvdW50LCBjdG9yLCBjdG9yLCBkZXBzLCBiaW5kaW5ncywgb3V0cHV0RGVmcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwaXBlRGVmKGZsYWdzOiBOb2RlRmxhZ3MsIGN0b3I6IGFueSwgZGVwczogKFtEZXBGbGFncywgYW55XXxhbnkpW10pOiBOb2RlRGVmIHtcbiAgZmxhZ3MgfD0gTm9kZUZsYWdzLlR5cGVQaXBlO1xuICByZXR1cm4gX2RlZigtMSwgZmxhZ3MsIG51bGwsIDAsIGN0b3IsIGN0b3IsIGRlcHMpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcHJvdmlkZXJEZWYoXG4gICAgZmxhZ3M6IE5vZGVGbGFncywgbWF0Y2hlZFF1ZXJpZXM6IG51bGx8W3N0cmluZyB8IG51bWJlciwgUXVlcnlWYWx1ZVR5cGVdW10sIHRva2VuOiBhbnksXG4gICAgdmFsdWU6IGFueSwgZGVwczogKFtEZXBGbGFncywgYW55XXxhbnkpW10pOiBOb2RlRGVmIHtcbiAgcmV0dXJuIF9kZWYoLTEsIGZsYWdzLCBtYXRjaGVkUXVlcmllcywgMCwgdG9rZW4sIHZhbHVlLCBkZXBzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIF9kZWYoXG4gICAgY2hlY2tJbmRleDogbnVtYmVyLCBmbGFnczogTm9kZUZsYWdzLCBtYXRjaGVkUXVlcmllc0RzbDogW3N0cmluZ3xudW1iZXIsIFF1ZXJ5VmFsdWVUeXBlXVtdfG51bGwsXG4gICAgY2hpbGRDb3VudDogbnVtYmVyLCB0b2tlbjogYW55LCB2YWx1ZTogYW55LCBkZXBzOiAoW0RlcEZsYWdzLCBhbnldfGFueSlbXSxcbiAgICBiaW5kaW5ncz86IEJpbmRpbmdEZWZbXSwgb3V0cHV0cz86IE91dHB1dERlZltdKTogTm9kZURlZiB7XG4gIGNvbnN0IHttYXRjaGVkUXVlcmllcywgcmVmZXJlbmNlcywgbWF0Y2hlZFF1ZXJ5SWRzfSA9IHNwbGl0TWF0Y2hlZFF1ZXJpZXNEc2wobWF0Y2hlZFF1ZXJpZXNEc2wpO1xuICBpZiAoIW91dHB1dHMpIHtcbiAgICBvdXRwdXRzID0gW107XG4gIH1cbiAgaWYgKCFiaW5kaW5ncykge1xuICAgIGJpbmRpbmdzID0gW107XG4gIH1cbiAgLy8gTmVlZCB0byByZXNvbHZlIGZvcndhcmRSZWZzIGFzIGUuZy4gZm9yIGB1c2VWYWx1ZWAgd2VcbiAgLy8gbG93ZXJlZCB0aGUgZXhwcmVzc2lvbiBhbmQgdGhlbiBzdG9wcGVkIGV2YWx1YXRpbmcgaXQsXG4gIC8vIGkuZS4gYWxzbyBkaWRuJ3QgdW53cmFwIGl0LlxuICB2YWx1ZSA9IHJlc29sdmVGb3J3YXJkUmVmKHZhbHVlKTtcblxuICBjb25zdCBkZXBEZWZzID0gc3BsaXREZXBzRHNsKGRlcHMsIHN0cmluZ2lmeSh0b2tlbikpO1xuXG4gIHJldHVybiB7XG4gICAgLy8gd2lsbCBiZXQgc2V0IGJ5IHRoZSB2aWV3IGRlZmluaXRpb25cbiAgICBub2RlSW5kZXg6IC0xLFxuICAgIHBhcmVudDogbnVsbCxcbiAgICByZW5kZXJQYXJlbnQ6IG51bGwsXG4gICAgYmluZGluZ0luZGV4OiAtMSxcbiAgICBvdXRwdXRJbmRleDogLTEsXG4gICAgLy8gcmVndWxhciB2YWx1ZXNcbiAgICBjaGVja0luZGV4LFxuICAgIGZsYWdzLFxuICAgIGNoaWxkRmxhZ3M6IDAsXG4gICAgZGlyZWN0Q2hpbGRGbGFnczogMCxcbiAgICBjaGlsZE1hdGNoZWRRdWVyaWVzOiAwLFxuICAgIG1hdGNoZWRRdWVyaWVzLFxuICAgIG1hdGNoZWRRdWVyeUlkcyxcbiAgICByZWZlcmVuY2VzLFxuICAgIG5nQ29udGVudEluZGV4OiAtMSxcbiAgICBjaGlsZENvdW50LFxuICAgIGJpbmRpbmdzLFxuICAgIGJpbmRpbmdGbGFnczogY2FsY0JpbmRpbmdGbGFncyhiaW5kaW5ncyksXG4gICAgb3V0cHV0cyxcbiAgICBlbGVtZW50OiBudWxsLFxuICAgIHByb3ZpZGVyOiB7dG9rZW4sIHZhbHVlLCBkZXBzOiBkZXBEZWZzfSxcbiAgICB0ZXh0OiBudWxsLFxuICAgIHF1ZXJ5OiBudWxsLFxuICAgIG5nQ29udGVudDogbnVsbFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlUHJvdmlkZXJJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgcmV0dXJuIF9jcmVhdGVQcm92aWRlckluc3RhbmNlKHZpZXcsIGRlZik7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVQaXBlSW5zdGFuY2UodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIC8vIGRlcHMgYXJlIGxvb2tlZCB1cCBmcm9tIGNvbXBvbmVudC5cbiAgbGV0IGNvbXBWaWV3ID0gdmlldztcbiAgd2hpbGUgKGNvbXBWaWV3LnBhcmVudCAmJiAhaXNDb21wb25lbnRWaWV3KGNvbXBWaWV3KSkge1xuICAgIGNvbXBWaWV3ID0gY29tcFZpZXcucGFyZW50O1xuICB9XG4gIC8vIHBpcGVzIGNhbiBzZWUgdGhlIHByaXZhdGUgc2VydmljZXMgb2YgdGhlIGNvbXBvbmVudFxuICBjb25zdCBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IHRydWU7XG4gIC8vIHBpcGVzIGFyZSBhbHdheXMgZWFnZXIgYW5kIGNsYXNzZXMhXG4gIHJldHVybiBjcmVhdGVDbGFzcyhcbiAgICAgIGNvbXBWaWV3LnBhcmVudCEsIHZpZXdQYXJlbnRFbChjb21wVmlldykhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVmLnByb3ZpZGVyIS52YWx1ZSxcbiAgICAgIGRlZi5wcm92aWRlciEuZGVwcyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVEaXJlY3RpdmVJbnN0YW5jZSh2aWV3OiBWaWV3RGF0YSwgZGVmOiBOb2RlRGVmKTogYW55IHtcbiAgLy8gY29tcG9uZW50cyBjYW4gc2VlIG90aGVyIHByaXZhdGUgc2VydmljZXMsIG90aGVyIGRpcmVjdGl2ZXMgY2FuJ3QuXG4gIGNvbnN0IGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Db21wb25lbnQpID4gMDtcbiAgLy8gZGlyZWN0aXZlcyBhcmUgYWx3YXlzIGVhZ2VyIGFuZCBjbGFzc2VzIVxuICBjb25zdCBpbnN0YW5jZSA9XG4gICAgICBjcmVhdGVDbGFzcyh2aWV3LCBkZWYucGFyZW50ISwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlZi5wcm92aWRlciEudmFsdWUsIGRlZi5wcm92aWRlciEuZGVwcyk7XG4gIGlmIChkZWYub3V0cHV0cy5sZW5ndGgpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRlZi5vdXRwdXRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBvdXRwdXQgPSBkZWYub3V0cHV0c1tpXTtcbiAgICAgIGNvbnN0IG91dHB1dE9ic2VydmFibGUgPSBpbnN0YW5jZVtvdXRwdXQucHJvcE5hbWUhXTtcbiAgICAgIGlmIChpc09ic2VydmFibGUob3V0cHV0T2JzZXJ2YWJsZSkpIHtcbiAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9uID0gb3V0cHV0T2JzZXJ2YWJsZS5zdWJzY3JpYmUoXG4gICAgICAgICAgICBldmVudEhhbmRsZXJDbG9zdXJlKHZpZXcsIGRlZi5wYXJlbnQhLm5vZGVJbmRleCwgb3V0cHV0LmV2ZW50TmFtZSkpO1xuICAgICAgICB2aWV3LmRpc3Bvc2FibGVzIVtkZWYub3V0cHV0SW5kZXggKyBpXSA9IHN1YnNjcmlwdGlvbi51bnN1YnNjcmliZS5iaW5kKHN1YnNjcmlwdGlvbik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICBgQE91dHB1dCAke291dHB1dC5wcm9wTmFtZX0gbm90IGluaXRpYWxpemVkIGluICcke2luc3RhbmNlLmNvbnN0cnVjdG9yLm5hbWV9Jy5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIGluc3RhbmNlO1xufVxuXG5mdW5jdGlvbiBldmVudEhhbmRsZXJDbG9zdXJlKHZpZXc6IFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCBldmVudE5hbWU6IHN0cmluZykge1xuICByZXR1cm4gKGV2ZW50OiBhbnkpID0+IGRpc3BhdGNoRXZlbnQodmlldywgaW5kZXgsIGV2ZW50TmFtZSwgZXZlbnQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVJbmxpbmUoXG4gICAgdmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZiwgdjA6IGFueSwgdjE6IGFueSwgdjI6IGFueSwgdjM6IGFueSwgdjQ6IGFueSwgdjU6IGFueSwgdjY6IGFueSxcbiAgICB2NzogYW55LCB2ODogYW55LCB2OTogYW55KTogYm9vbGVhbiB7XG4gIGNvbnN0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHZpZXcsIGRlZi5ub2RlSW5kZXgpO1xuICBjb25zdCBkaXJlY3RpdmUgPSBwcm92aWRlckRhdGEuaW5zdGFuY2U7XG4gIGxldCBjaGFuZ2VkID0gZmFsc2U7XG4gIGxldCBjaGFuZ2VzOiBTaW1wbGVDaGFuZ2VzID0gdW5kZWZpbmVkITtcbiAgY29uc3QgYmluZExlbiA9IGRlZi5iaW5kaW5ncy5sZW5ndGg7XG4gIGlmIChiaW5kTGVuID4gMCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAwLCB2MCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMCwgdjAsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAxLCB2MSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMSwgdjEsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMiAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAyLCB2MikpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMiwgdjIsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gMyAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCAzLCB2MykpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgMywgdjMsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA0LCB2NCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNCwgdjQsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA1LCB2NSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNSwgdjUsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNiAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA2LCB2NikpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNiwgdjYsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gNyAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA3LCB2NykpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgNywgdjcsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gOCAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA4LCB2OCkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgOCwgdjgsIGNoYW5nZXMpO1xuICB9XG4gIGlmIChiaW5kTGVuID4gOSAmJiBjaGVja0JpbmRpbmcodmlldywgZGVmLCA5LCB2OSkpIHtcbiAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICBjaGFuZ2VzID0gdXBkYXRlUHJvcCh2aWV3LCBwcm92aWRlckRhdGEsIGRlZiwgOSwgdjksIGNoYW5nZXMpO1xuICB9XG4gIGlmIChjaGFuZ2VzKSB7XG4gICAgZGlyZWN0aXZlLm5nT25DaGFuZ2VzKGNoYW5nZXMpO1xuICB9XG4gIGlmICgoZGVmLmZsYWdzICYgTm9kZUZsYWdzLk9uSW5pdCkgJiZcbiAgICAgIHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vayh2aWV3LCBWaWV3U3RhdGUuSW5pdFN0YXRlX0NhbGxpbmdPbkluaXQsIGRlZi5ub2RlSW5kZXgpKSB7XG4gICAgZGlyZWN0aXZlLm5nT25Jbml0KCk7XG4gIH1cbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Eb0NoZWNrKSB7XG4gICAgZGlyZWN0aXZlLm5nRG9DaGVjaygpO1xuICB9XG4gIHJldHVybiBjaGFuZ2VkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2hlY2tBbmRVcGRhdGVEaXJlY3RpdmVEeW5hbWljKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBkZWY6IE5vZGVEZWYsIHZhbHVlczogYW55W10pOiBib29sZWFuIHtcbiAgY29uc3QgcHJvdmlkZXJEYXRhID0gYXNQcm92aWRlckRhdGEodmlldywgZGVmLm5vZGVJbmRleCk7XG4gIGNvbnN0IGRpcmVjdGl2ZSA9IHByb3ZpZGVyRGF0YS5pbnN0YW5jZTtcbiAgbGV0IGNoYW5nZWQgPSBmYWxzZTtcbiAgbGV0IGNoYW5nZXM6IFNpbXBsZUNoYW5nZXMgPSB1bmRlZmluZWQhO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgIGlmIChjaGVja0JpbmRpbmcodmlldywgZGVmLCBpLCB2YWx1ZXNbaV0pKSB7XG4gICAgICBjaGFuZ2VkID0gdHJ1ZTtcbiAgICAgIGNoYW5nZXMgPSB1cGRhdGVQcm9wKHZpZXcsIHByb3ZpZGVyRGF0YSwgZGVmLCBpLCB2YWx1ZXNbaV0sIGNoYW5nZXMpO1xuICAgIH1cbiAgfVxuICBpZiAoY2hhbmdlcykge1xuICAgIGRpcmVjdGl2ZS5uZ09uQ2hhbmdlcyhjaGFuZ2VzKTtcbiAgfVxuICBpZiAoKGRlZi5mbGFncyAmIE5vZGVGbGFncy5PbkluaXQpICYmXG4gICAgICBzaG91bGRDYWxsTGlmZWN5Y2xlSW5pdEhvb2sodmlldywgVmlld1N0YXRlLkluaXRTdGF0ZV9DYWxsaW5nT25Jbml0LCBkZWYubm9kZUluZGV4KSkge1xuICAgIGRpcmVjdGl2ZS5uZ09uSW5pdCgpO1xuICB9XG4gIGlmIChkZWYuZmxhZ3MgJiBOb2RlRmxhZ3MuRG9DaGVjaykge1xuICAgIGRpcmVjdGl2ZS5uZ0RvQ2hlY2soKTtcbiAgfVxuICByZXR1cm4gY2hhbmdlZDtcbn1cblxuZnVuY3Rpb24gX2NyZWF0ZVByb3ZpZGVySW5zdGFuY2UodmlldzogVmlld0RhdGEsIGRlZjogTm9kZURlZik6IGFueSB7XG4gIC8vIHByaXZhdGUgc2VydmljZXMgY2FuIHNlZSBvdGhlciBwcml2YXRlIHNlcnZpY2VzXG4gIGNvbnN0IGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gKGRlZi5mbGFncyAmIE5vZGVGbGFncy5Qcml2YXRlUHJvdmlkZXIpID4gMDtcbiAgY29uc3QgcHJvdmlkZXJEZWYgPSBkZWYucHJvdmlkZXI7XG4gIHN3aXRjaCAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLlR5cGVzKSB7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZUNsYXNzUHJvdmlkZXI6XG4gICAgICByZXR1cm4gY3JlYXRlQ2xhc3MoXG4gICAgICAgICAgdmlldywgZGVmLnBhcmVudCEsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBwcm92aWRlckRlZiEudmFsdWUsIHByb3ZpZGVyRGVmIS5kZXBzKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlRmFjdG9yeVByb3ZpZGVyOlxuICAgICAgcmV0dXJuIGNhbGxGYWN0b3J5KFxuICAgICAgICAgIHZpZXcsIGRlZi5wYXJlbnQhLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgcHJvdmlkZXJEZWYhLnZhbHVlLCBwcm92aWRlckRlZiEuZGVwcyk7XG4gICAgY2FzZSBOb2RlRmxhZ3MuVHlwZVVzZUV4aXN0aW5nUHJvdmlkZXI6XG4gICAgICByZXR1cm4gcmVzb2x2ZURlcCh2aWV3LCBkZWYucGFyZW50ISwgYWxsb3dQcml2YXRlU2VydmljZXMsIHByb3ZpZGVyRGVmIS5kZXBzWzBdKTtcbiAgICBjYXNlIE5vZGVGbGFncy5UeXBlVmFsdWVQcm92aWRlcjpcbiAgICAgIHJldHVybiBwcm92aWRlckRlZiEudmFsdWU7XG4gIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlQ2xhc3MoXG4gICAgdmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbiwgY3RvcjogYW55LCBkZXBzOiBEZXBEZWZbXSk6IGFueSB7XG4gIGNvbnN0IGxlbiA9IGRlcHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBuZXcgY3RvcigpO1xuICAgIGNhc2UgMTpcbiAgICAgIHJldHVybiBuZXcgY3RvcihyZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSkpO1xuICAgIGNhc2UgMjpcbiAgICAgIHJldHVybiBuZXcgY3RvcihcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMV0pKTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gbmV3IGN0b3IoXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzFdKSxcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1syXSkpO1xuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zdCBkZXBWYWx1ZXMgPSBbXTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgZGVwVmFsdWVzLnB1c2gocmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbaV0pKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgY3RvciguLi5kZXBWYWx1ZXMpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxGYWN0b3J5KFxuICAgIHZpZXc6IFZpZXdEYXRhLCBlbERlZjogTm9kZURlZiwgYWxsb3dQcml2YXRlU2VydmljZXM6IGJvb2xlYW4sIGZhY3Rvcnk6IGFueSxcbiAgICBkZXBzOiBEZXBEZWZbXSk6IGFueSB7XG4gIGNvbnN0IGxlbiA9IGRlcHMubGVuZ3RoO1xuICBzd2l0Y2ggKGxlbikge1xuICAgIGNhc2UgMDpcbiAgICAgIHJldHVybiBmYWN0b3J5KCk7XG4gICAgY2FzZSAxOlxuICAgICAgcmV0dXJuIGZhY3RvcnkocmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMF0pKTtcbiAgICBjYXNlIDI6XG4gICAgICByZXR1cm4gZmFjdG9yeShcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMV0pKTtcbiAgICBjYXNlIDM6XG4gICAgICByZXR1cm4gZmFjdG9yeShcbiAgICAgICAgICByZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1swXSksXG4gICAgICAgICAgcmVzb2x2ZURlcCh2aWV3LCBlbERlZiwgYWxsb3dQcml2YXRlU2VydmljZXMsIGRlcHNbMV0pLFxuICAgICAgICAgIHJlc29sdmVEZXAodmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzLCBkZXBzWzJdKSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIGNvbnN0IGRlcFZhbHVlcyA9IFtdO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBkZXBWYWx1ZXMucHVzaChyZXNvbHZlRGVwKHZpZXcsIGVsRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlcywgZGVwc1tpXSkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZhY3RvcnkoLi4uZGVwVmFsdWVzKTtcbiAgfVxufVxuXG4vLyBUaGlzIGRlZmF1bHQgdmFsdWUgaXMgd2hlbiBjaGVja2luZyB0aGUgaGllcmFyY2h5IGZvciBhIHRva2VuLlxuLy9cbi8vIEl0IG1lYW5zIGJvdGg6XG4vLyAtIHRoZSB0b2tlbiBpcyBub3QgcHJvdmlkZWQgYnkgdGhlIGN1cnJlbnQgaW5qZWN0b3IsXG4vLyAtIG9ubHkgdGhlIGVsZW1lbnQgaW5qZWN0b3JzIHNob3VsZCBiZSBjaGVja2VkIChpZSBkbyBub3QgY2hlY2sgbW9kdWxlIGluamVjdG9yc1xuLy9cbi8vICAgICAgICAgIG1vZDFcbi8vICAgICAgICAgL1xuLy8gICAgICAgZWwxICAgbW9kMlxuLy8gICAgICAgICBcXCAgL1xuLy8gICAgICAgICBlbDJcbi8vXG4vLyBXaGVuIHJlcXVlc3RpbmcgZWwyLmluamVjdG9yLmdldCh0b2tlbiksIHdlIHNob3VsZCBjaGVjayBpbiB0aGUgZm9sbG93aW5nIG9yZGVyIGFuZCByZXR1cm4gdGhlXG4vLyBmaXJzdCBmb3VuZCB2YWx1ZTpcbi8vIC0gZWwyLmluamVjdG9yLmdldCh0b2tlbiwgZGVmYXVsdClcbi8vIC0gZWwxLmluamVjdG9yLmdldCh0b2tlbiwgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikgLT4gZG8gbm90IGNoZWNrIHRoZSBtb2R1bGVcbi8vIC0gbW9kMi5pbmplY3Rvci5nZXQodG9rZW4sIGRlZmF1bHQpXG5leHBvcnQgY29uc3QgTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZURlcChcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzOiBib29sZWFuLCBkZXBEZWY6IERlcERlZixcbiAgICBub3RGb3VuZFZhbHVlOiBhbnkgPSBJbmplY3Rvci5USFJPV19JRl9OT1RfRk9VTkQpOiBhbnkge1xuICBpZiAoZGVwRGVmLmZsYWdzICYgRGVwRmxhZ3MuVmFsdWUpIHtcbiAgICByZXR1cm4gZGVwRGVmLnRva2VuO1xuICB9XG4gIGNvbnN0IHN0YXJ0VmlldyA9IHZpZXc7XG4gIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5PcHRpb25hbCkge1xuICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICB9XG4gIGNvbnN0IHRva2VuS2V5ID0gZGVwRGVmLnRva2VuS2V5O1xuXG4gIGlmICh0b2tlbktleSA9PT0gQ2hhbmdlRGV0ZWN0b3JSZWZUb2tlbktleSkge1xuICAgIC8vIGRpcmVjdGl2ZXMgb24gdGhlIHNhbWUgZWxlbWVudCBhcyBhIGNvbXBvbmVudCBzaG91bGQgYmUgYWJsZSB0byBjb250cm9sIHRoZSBjaGFuZ2UgZGV0ZWN0b3JcbiAgICAvLyBvZiB0aGF0IGNvbXBvbmVudCBhcyB3ZWxsLlxuICAgIGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gISEoZWxEZWYgJiYgZWxEZWYuZWxlbWVudCEuY29tcG9uZW50Vmlldyk7XG4gIH1cblxuICBpZiAoZWxEZWYgJiYgKGRlcERlZi5mbGFncyAmIERlcEZsYWdzLlNraXBTZWxmKSkge1xuICAgIGFsbG93UHJpdmF0ZVNlcnZpY2VzID0gZmFsc2U7XG4gICAgZWxEZWYgPSBlbERlZi5wYXJlbnQhO1xuICB9XG5cbiAgbGV0IHNlYXJjaFZpZXc6IFZpZXdEYXRhfG51bGwgPSB2aWV3O1xuICB3aGlsZSAoc2VhcmNoVmlldykge1xuICAgIGlmIChlbERlZikge1xuICAgICAgc3dpdGNoICh0b2tlbktleSkge1xuICAgICAgICBjYXNlIFJlbmRlcmVyMlRva2VuS2V5OiB7XG4gICAgICAgICAgY29uc3QgY29tcFZpZXcgPSBmaW5kQ29tcFZpZXcoc2VhcmNoVmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzKTtcbiAgICAgICAgICByZXR1cm4gY29tcFZpZXcucmVuZGVyZXI7XG4gICAgICAgIH1cbiAgICAgICAgY2FzZSBFbGVtZW50UmVmVG9rZW5LZXk6XG4gICAgICAgICAgcmV0dXJuIG5ldyBFbGVtZW50UmVmKGFzRWxlbWVudERhdGEoc2VhcmNoVmlldywgZWxEZWYubm9kZUluZGV4KS5yZW5kZXJFbGVtZW50KTtcbiAgICAgICAgY2FzZSBWaWV3Q29udGFpbmVyUmVmVG9rZW5LZXk6XG4gICAgICAgICAgcmV0dXJuIGFzRWxlbWVudERhdGEoc2VhcmNoVmlldywgZWxEZWYubm9kZUluZGV4KS52aWV3Q29udGFpbmVyO1xuICAgICAgICBjYXNlIFRlbXBsYXRlUmVmVG9rZW5LZXk6IHtcbiAgICAgICAgICBpZiAoZWxEZWYuZWxlbWVudCEudGVtcGxhdGUpIHtcbiAgICAgICAgICAgIHJldHVybiBhc0VsZW1lbnREYXRhKHNlYXJjaFZpZXcsIGVsRGVmLm5vZGVJbmRleCkudGVtcGxhdGU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGNhc2UgQ2hhbmdlRGV0ZWN0b3JSZWZUb2tlbktleToge1xuICAgICAgICAgIGxldCBjZFZpZXcgPSBmaW5kQ29tcFZpZXcoc2VhcmNoVmlldywgZWxEZWYsIGFsbG93UHJpdmF0ZVNlcnZpY2VzKTtcbiAgICAgICAgICByZXR1cm4gY3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoY2RWaWV3KTtcbiAgICAgICAgfVxuICAgICAgICBjYXNlIEluamVjdG9yUmVmVG9rZW5LZXk6XG4gICAgICAgIGNhc2UgSU5KRUNUT1JSZWZUb2tlbktleTpcbiAgICAgICAgICByZXR1cm4gY3JlYXRlSW5qZWN0b3Ioc2VhcmNoVmlldywgZWxEZWYpO1xuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgIGNvbnN0IHByb3ZpZGVyRGVmID1cbiAgICAgICAgICAgICAgKGFsbG93UHJpdmF0ZVNlcnZpY2VzID8gZWxEZWYuZWxlbWVudCEuYWxsUHJvdmlkZXJzIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxEZWYuZWxlbWVudCEucHVibGljUHJvdmlkZXJzKSFbdG9rZW5LZXldO1xuICAgICAgICAgIGlmIChwcm92aWRlckRlZikge1xuICAgICAgICAgICAgbGV0IHByb3ZpZGVyRGF0YSA9IGFzUHJvdmlkZXJEYXRhKHNlYXJjaFZpZXcsIHByb3ZpZGVyRGVmLm5vZGVJbmRleCk7XG4gICAgICAgICAgICBpZiAoIXByb3ZpZGVyRGF0YSkge1xuICAgICAgICAgICAgICBwcm92aWRlckRhdGEgPSB7aW5zdGFuY2U6IF9jcmVhdGVQcm92aWRlckluc3RhbmNlKHNlYXJjaFZpZXcsIHByb3ZpZGVyRGVmKX07XG4gICAgICAgICAgICAgIHNlYXJjaFZpZXcubm9kZXNbcHJvdmlkZXJEZWYubm9kZUluZGV4XSA9IHByb3ZpZGVyRGF0YSBhcyBhbnk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcHJvdmlkZXJEYXRhLmluc3RhbmNlO1xuICAgICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBhbGxvd1ByaXZhdGVTZXJ2aWNlcyA9IGlzQ29tcG9uZW50VmlldyhzZWFyY2hWaWV3KTtcbiAgICBlbERlZiA9IHZpZXdQYXJlbnRFbChzZWFyY2hWaWV3KSE7XG4gICAgc2VhcmNoVmlldyA9IHNlYXJjaFZpZXcucGFyZW50ITtcblxuICAgIGlmIChkZXBEZWYuZmxhZ3MgJiBEZXBGbGFncy5TZWxmKSB7XG4gICAgICBzZWFyY2hWaWV3ID0gbnVsbDtcbiAgICB9XG4gIH1cblxuICBjb25zdCB2YWx1ZSA9IHN0YXJ0Vmlldy5yb290LmluamVjdG9yLmdldChkZXBEZWYudG9rZW4sIE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpO1xuXG4gIGlmICh2YWx1ZSAhPT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUiB8fFxuICAgICAgbm90Rm91bmRWYWx1ZSA9PT0gTk9UX0ZPVU5EX0NIRUNLX09OTFlfRUxFTUVOVF9JTkpFQ1RPUikge1xuICAgIC8vIFJldHVybiB0aGUgdmFsdWUgZnJvbSB0aGUgcm9vdCBlbGVtZW50IGluamVjdG9yIHdoZW5cbiAgICAvLyAtIGl0IHByb3ZpZGVzIGl0XG4gICAgLy8gICAodmFsdWUgIT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgLy8gLSB0aGUgbW9kdWxlIGluamVjdG9yIHNob3VsZCBub3QgYmUgY2hlY2tlZFxuICAgIC8vICAgKG5vdEZvdW5kVmFsdWUgPT09IE5PVF9GT1VORF9DSEVDS19PTkxZX0VMRU1FTlRfSU5KRUNUT1IpXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9XG5cbiAgcmV0dXJuIHN0YXJ0Vmlldy5yb290Lm5nTW9kdWxlLmluamVjdG9yLmdldChkZXBEZWYudG9rZW4sIG5vdEZvdW5kVmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmaW5kQ29tcFZpZXcodmlldzogVmlld0RhdGEsIGVsRGVmOiBOb2RlRGVmLCBhbGxvd1ByaXZhdGVTZXJ2aWNlczogYm9vbGVhbikge1xuICBsZXQgY29tcFZpZXc6IFZpZXdEYXRhO1xuICBpZiAoYWxsb3dQcml2YXRlU2VydmljZXMpIHtcbiAgICBjb21wVmlldyA9IGFzRWxlbWVudERhdGEodmlldywgZWxEZWYubm9kZUluZGV4KS5jb21wb25lbnRWaWV3O1xuICB9IGVsc2Uge1xuICAgIGNvbXBWaWV3ID0gdmlldztcbiAgICB3aGlsZSAoY29tcFZpZXcucGFyZW50ICYmICFpc0NvbXBvbmVudFZpZXcoY29tcFZpZXcpKSB7XG4gICAgICBjb21wVmlldyA9IGNvbXBWaWV3LnBhcmVudDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbXBWaWV3O1xufVxuXG5mdW5jdGlvbiB1cGRhdGVQcm9wKFxuICAgIHZpZXc6IFZpZXdEYXRhLCBwcm92aWRlckRhdGE6IFByb3ZpZGVyRGF0YSwgZGVmOiBOb2RlRGVmLCBiaW5kaW5nSWR4OiBudW1iZXIsIHZhbHVlOiBhbnksXG4gICAgY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IFNpbXBsZUNoYW5nZXMge1xuICBpZiAoZGVmLmZsYWdzICYgTm9kZUZsYWdzLkNvbXBvbmVudCkge1xuICAgIGNvbnN0IGNvbXBWaWV3ID0gYXNFbGVtZW50RGF0YSh2aWV3LCBkZWYucGFyZW50IS5ub2RlSW5kZXgpLmNvbXBvbmVudFZpZXc7XG4gICAgaWYgKGNvbXBWaWV3LmRlZi5mbGFncyAmIFZpZXdGbGFncy5PblB1c2gpIHtcbiAgICAgIGNvbXBWaWV3LnN0YXRlIHw9IFZpZXdTdGF0ZS5DaGVja3NFbmFibGVkO1xuICAgIH1cbiAgfVxuICBjb25zdCBiaW5kaW5nID0gZGVmLmJpbmRpbmdzW2JpbmRpbmdJZHhdO1xuICBjb25zdCBwcm9wTmFtZSA9IGJpbmRpbmcubmFtZSE7XG4gIC8vIE5vdGU6IFRoaXMgaXMgc3RpbGwgc2FmZSB3aXRoIENsb3N1cmUgQ29tcGlsZXIgYXNcbiAgLy8gdGhlIHVzZXIgcGFzc2VkIGluIHRoZSBwcm9wZXJ0eSBuYW1lIGFzIGFuIG9iamVjdCBoYXMgdG8gYHByb3ZpZGVyRGVmYCxcbiAgLy8gc28gQ2xvc3VyZSBDb21waWxlciB3aWxsIGhhdmUgcmVuYW1lZCB0aGUgcHJvcGVydHkgY29ycmVjdGx5IGFscmVhZHkuXG4gIHByb3ZpZGVyRGF0YS5pbnN0YW5jZVtwcm9wTmFtZV0gPSB2YWx1ZTtcbiAgaWYgKGRlZi5mbGFncyAmIE5vZGVGbGFncy5PbkNoYW5nZXMpIHtcbiAgICBjaGFuZ2VzID0gY2hhbmdlcyB8fCB7fTtcbiAgICBjb25zdCBvbGRWYWx1ZSA9IFdyYXBwZWRWYWx1ZS51bndyYXAodmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdKTtcbiAgICBjb25zdCBiaW5kaW5nID0gZGVmLmJpbmRpbmdzW2JpbmRpbmdJZHhdO1xuICAgIGNoYW5nZXNbYmluZGluZy5ub25NaW5pZmllZE5hbWUhXSA9XG4gICAgICAgIG5ldyBTaW1wbGVDaGFuZ2Uob2xkVmFsdWUsIHZhbHVlLCAodmlldy5zdGF0ZSAmIFZpZXdTdGF0ZS5GaXJzdENoZWNrKSAhPT0gMCk7XG4gIH1cbiAgdmlldy5vbGRWYWx1ZXNbZGVmLmJpbmRpbmdJbmRleCArIGJpbmRpbmdJZHhdID0gdmFsdWU7XG4gIHJldHVybiBjaGFuZ2VzO1xufVxuXG4vLyBUaGlzIGZ1bmN0aW9uIGNhbGxzIHRoZSBuZ0FmdGVyQ29udGVudENoZWNrLCBuZ0FmdGVyQ29udGVudEluaXQsXG4vLyBuZ0FmdGVyVmlld0NoZWNrLCBhbmQgbmdBZnRlclZpZXdJbml0IGxpZmVjeWNsZSBob29rcyAoZGVwZW5kaW5nIG9uIHRoZSBub2RlXG4vLyBmbGFncyBpbiBsaWZlY3ljbGUpLiBVbmxpa2UgbmdEb0NoZWNrLCBuZ09uQ2hhbmdlcyBhbmQgbmdPbkluaXQsIHdoaWNoIGFyZVxuLy8gY2FsbGVkIGR1cmluZyBhIHByZS1vcmRlciB0cmF2ZXJzYWwgb2YgdGhlIHZpZXcgdHJlZSAodGhhdCBpcyBjYWxsaW5nIHRoZVxuLy8gcGFyZW50IGhvb2tzIGJlZm9yZSB0aGUgY2hpbGQgaG9va3MpIHRoZXNlIGV2ZW50cyBhcmUgc2VudCBpbiB1c2luZyBhXG4vLyBwb3N0LW9yZGVyIHRyYXZlcnNhbCBvZiB0aGUgdHJlZSAoY2hpbGRyZW4gYmVmb3JlIHBhcmVudHMpLiBUaGlzIGNoYW5nZXMgdGhlXG4vLyBtZWFuaW5nIG9mIGluaXRJbmRleCBpbiB0aGUgdmlldyBzdGF0ZS4gRm9yIG5nT25Jbml0LCBpbml0SW5kZXggdHJhY2tzIHRoZVxuLy8gZXhwZWN0ZWQgbm9kZUluZGV4IHdoaWNoIGEgbmdPbkluaXQgc2hvdWxkIGJlIGNhbGxlZC4gV2hlbiBzZW5kaW5nXG4vLyBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJWaWV3SW5pdCBpdCBpcyB0aGUgZXhwZWN0ZWQgY291bnQgb2Zcbi8vIG5nQWZ0ZXJDb250ZW50SW5pdCBvciBuZ0FmdGVyVmlld0luaXQgbWV0aG9kcyB0aGF0IGhhdmUgYmVlbiBjYWxsZWQuIFRoaXNcbi8vIGVuc3VyZSB0aGF0IGRlc3BpdGUgYmVpbmcgY2FsbGVkIHJlY3Vyc2l2ZWx5IG9yIGFmdGVyIHBpY2tpbmcgdXAgYWZ0ZXIgYW5cbi8vIGV4Y2VwdGlvbiwgdGhlIG5nQWZ0ZXJDb250ZW50SW5pdCBvciBuZ0FmdGVyVmlld0luaXQgd2lsbCBiZSBjYWxsZWQgb24gdGhlXG4vLyBjb3JyZWN0IG5vZGVzLiBDb25zaWRlciBmb3IgZXhhbXBsZSwgdGhlIGZvbGxvd2luZyAod2hlcmUgRSBpcyBhbiBlbGVtZW50XG4vLyBhbmQgRCBpcyBhIGRpcmVjdGl2ZSlcbi8vICBUcmVlOiAgICAgICBwcmUtb3JkZXIgaW5kZXggIHBvc3Qtb3JkZXIgaW5kZXhcbi8vICAgIEUxICAgICAgICAwICAgICAgICAgICAgICAgIDZcbi8vICAgICAgRTIgICAgICAxICAgICAgICAgICAgICAgIDFcbi8vICAgICAgIEQzICAgICAyICAgICAgICAgICAgICAgIDBcbi8vICAgICAgRTQgICAgICAzICAgICAgICAgICAgICAgIDVcbi8vICAgICAgIEU1ICAgICA0ICAgICAgICAgICAgICAgIDRcbi8vICAgICAgICBFNiAgICA1ICAgICAgICAgICAgICAgIDJcbi8vICAgICAgICBFNyAgICA2ICAgICAgICAgICAgICAgIDNcbi8vIEFzIGNhbiBiZSBzZWVuLCB0aGUgcG9zdC1vcmRlciBpbmRleCBoYXMgYW4gdW5jbGVhciByZWxhdGlvbnNoaXAgdG8gdGhlXG4vLyBwcmUtb3JkZXIgaW5kZXggKHBvc3RPcmRlckluZGV4ID09PSBwcmVPcmRlckluZGV4IC0gcGFyZW50Q291bnQgK1xuLy8gY2hpbGRDb3VudCkuIFNpbmNlIG51bWJlciBvZiBjYWxscyB0byBuZ0FmdGVyQ29udGVudEluaXQgYW5kIG5nQWZ0ZXJWaWV3SW5pdFxuLy8gYXJlIHN0YWJsZSAod2lsbCBiZSB0aGUgc2FtZSBmb3IgdGhlIHNhbWUgdmlldyByZWdhcmRsZXNzIG9mIGV4Y2VwdGlvbnMgb3Jcbi8vIHJlY3Vyc2lvbikgd2UganVzdCBuZWVkIHRvIGNvdW50IHRoZW0gd2hpY2ggd2lsbCByb3VnaGx5IGNvcnJlc3BvbmQgdG8gdGhlXG4vLyBwb3N0LW9yZGVyIGluZGV4IChpdCBza2lwcyBlbGVtZW50cyBhbmQgZGlyZWN0aXZlcyB0aGF0IGRvIG5vdCBoYXZlXG4vLyBsaWZlY3ljbGUgaG9va3MpLlxuLy9cbi8vIEZvciBleGFtcGxlLCBpZiBhbiBleGNlcHRpb24gaXMgcmFpc2VkIGluIHRoZSBFNi5vbkFmdGVyVmlld0luaXQoKSB0aGVcbi8vIGluaXRJbmRleCBpcyBsZWZ0IGF0IDMgKGJ5IHNob3VsZENhbGxMaWZlY3ljbGVJbml0SG9vaygpIHdoaWNoIHNldCBpdCB0b1xuLy8gaW5pdEluZGV4ICsgMSkuIFdoZW4gY2hlY2tBbmRVcGRhdGVWaWV3KCkgaXMgY2FsbGVkIGFnYWluIEQzLCBFMiBhbmQgRTYgd2lsbFxuLy8gbm90IGhhdmUgdGhlaXIgbmdBZnRlclZpZXdJbml0KCkgY2FsbGVkIGJ1dCwgc3RhcnRpbmcgd2l0aCBFNywgdGhlIHJlc3Qgb2Zcbi8vIHRoZSB2aWV3IHdpbGwgYmVnaW4gZ2V0dGluZyBuZ0FmdGVyVmlld0luaXQoKSBjYWxsZWQgdW50aWwgYSBjaGVjayBhbmRcbi8vIHBhc3MgaXMgY29tcGxldGUuXG4vL1xuLy8gVGhpcyBhbGdvcnRoaW0gYWxzbyBoYW5kbGVzIHJlY3Vyc2lvbi4gQ29uc2lkZXIgaWYgRTQncyBuZ0FmdGVyVmlld0luaXQoKVxuLy8gaW5kaXJlY3RseSBjYWxscyBFMSdzIENoYW5nZURldGVjdG9yUmVmLmRldGVjdENoYW5nZXMoKS4gVGhlIGV4cGVjdGVkXG4vLyBpbml0SW5kZXggaXMgc2V0IHRvIDYsIHRoZSByZWN1c2l2ZSBjaGVja0FuZFVwZGF0ZVZpZXcoKSBzdGFydHMgd2FsayBhZ2Fpbi5cbi8vIEQzLCBFMiwgRTYsIEU3LCBFNSBhbmQgRTQgYXJlIHNraXBwZWQsIG5nQWZ0ZXJWaWV3SW5pdCgpIGlzIGNhbGxlZCBvbiBFMS5cbi8vIFdoZW4gdGhlIHJlY3Vyc2lvbiByZXR1cm5zIHRoZSBpbml0SW5kZXggd2lsbCBiZSA3IHNvIEUxIGlzIHNraXBwZWQgYXMgaXRcbi8vIGhhcyBhbHJlYWR5IGJlZW4gY2FsbGVkIGluIHRoZSByZWN1cnNpdmVseSBjYWxsZWQgY2hlY2tBblVwZGF0ZVZpZXcoKS5cbmV4cG9ydCBmdW5jdGlvbiBjYWxsTGlmZWN5Y2xlSG9va3NDaGlsZHJlbkZpcnN0KHZpZXc6IFZpZXdEYXRhLCBsaWZlY3ljbGVzOiBOb2RlRmxhZ3MpIHtcbiAgaWYgKCEodmlldy5kZWYubm9kZUZsYWdzICYgbGlmZWN5Y2xlcykpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3Qgbm9kZXMgPSB2aWV3LmRlZi5ub2RlcztcbiAgbGV0IGluaXRJbmRleCA9IDA7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbm9kZXMubGVuZ3RoOyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gbm9kZXNbaV07XG4gICAgbGV0IHBhcmVudCA9IG5vZGVEZWYucGFyZW50O1xuICAgIGlmICghcGFyZW50ICYmIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzKSB7XG4gICAgICAvLyBtYXRjaGluZyByb290IG5vZGUgKGUuZy4gYSBwaXBlKVxuICAgICAgY2FsbFByb3ZpZGVyTGlmZWN5Y2xlcyh2aWV3LCBpLCBub2RlRGVmLmZsYWdzICYgbGlmZWN5Y2xlcywgaW5pdEluZGV4KyspO1xuICAgIH1cbiAgICBpZiAoKG5vZGVEZWYuY2hpbGRGbGFncyAmIGxpZmVjeWNsZXMpID09PSAwKSB7XG4gICAgICAvLyBubyBjaGlsZCBtYXRjaGVzIG9uZSBvZiB0aGUgbGlmZWN5Y2xlc1xuICAgICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gICAgfVxuICAgIHdoaWxlIChwYXJlbnQgJiYgKHBhcmVudC5mbGFncyAmIE5vZGVGbGFncy5UeXBlRWxlbWVudCkgJiZcbiAgICAgICAgICAgaSA9PT0gcGFyZW50Lm5vZGVJbmRleCArIHBhcmVudC5jaGlsZENvdW50KSB7XG4gICAgICAvLyBsYXN0IGNoaWxkIG9mIGFuIGVsZW1lbnRcbiAgICAgIGlmIChwYXJlbnQuZGlyZWN0Q2hpbGRGbGFncyAmIGxpZmVjeWNsZXMpIHtcbiAgICAgICAgaW5pdEluZGV4ID0gY2FsbEVsZW1lbnRQcm92aWRlcnNMaWZlY3ljbGVzKHZpZXcsIHBhcmVudCwgbGlmZWN5Y2xlcywgaW5pdEluZGV4KTtcbiAgICAgIH1cbiAgICAgIHBhcmVudCA9IHBhcmVudC5wYXJlbnQ7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNhbGxFbGVtZW50UHJvdmlkZXJzTGlmZWN5Y2xlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgZWxEZWY6IE5vZGVEZWYsIGxpZmVjeWNsZXM6IE5vZGVGbGFncywgaW5pdEluZGV4OiBudW1iZXIpOiBudW1iZXIge1xuICBmb3IgKGxldCBpID0gZWxEZWYubm9kZUluZGV4ICsgMTsgaSA8PSBlbERlZi5ub2RlSW5kZXggKyBlbERlZi5jaGlsZENvdW50OyBpKyspIHtcbiAgICBjb25zdCBub2RlRGVmID0gdmlldy5kZWYubm9kZXNbaV07XG4gICAgaWYgKG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzKSB7XG4gICAgICBjYWxsUHJvdmlkZXJMaWZlY3ljbGVzKHZpZXcsIGksIG5vZGVEZWYuZmxhZ3MgJiBsaWZlY3ljbGVzLCBpbml0SW5kZXgrKyk7XG4gICAgfVxuICAgIC8vIG9ubHkgdmlzaXQgZGlyZWN0IGNoaWxkcmVuXG4gICAgaSArPSBub2RlRGVmLmNoaWxkQ291bnQ7XG4gIH1cbiAgcmV0dXJuIGluaXRJbmRleDtcbn1cblxuZnVuY3Rpb24gY2FsbFByb3ZpZGVyTGlmZWN5Y2xlcyhcbiAgICB2aWV3OiBWaWV3RGF0YSwgaW5kZXg6IG51bWJlciwgbGlmZWN5Y2xlczogTm9kZUZsYWdzLCBpbml0SW5kZXg6IG51bWJlcikge1xuICBjb25zdCBwcm92aWRlckRhdGEgPSBhc1Byb3ZpZGVyRGF0YSh2aWV3LCBpbmRleCk7XG4gIGlmICghcHJvdmlkZXJEYXRhKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IHByb3ZpZGVyID0gcHJvdmlkZXJEYXRhLmluc3RhbmNlO1xuICBpZiAoIXByb3ZpZGVyKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIFNlcnZpY2VzLnNldEN1cnJlbnROb2RlKHZpZXcsIGluZGV4KTtcbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuQWZ0ZXJDb250ZW50SW5pdCAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ0FmdGVyQ29udGVudEluaXQsIGluaXRJbmRleCkpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyQ29udGVudEluaXQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlckNvbnRlbnRDaGVja2VkKSB7XG4gICAgcHJvdmlkZXIubmdBZnRlckNvbnRlbnRDaGVja2VkKCk7XG4gIH1cbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuQWZ0ZXJWaWV3SW5pdCAmJlxuICAgICAgc2hvdWxkQ2FsbExpZmVjeWNsZUluaXRIb29rKHZpZXcsIFZpZXdTdGF0ZS5Jbml0U3RhdGVfQ2FsbGluZ0FmdGVyVmlld0luaXQsIGluaXRJbmRleCkpIHtcbiAgICBwcm92aWRlci5uZ0FmdGVyVmlld0luaXQoKTtcbiAgfVxuICBpZiAobGlmZWN5Y2xlcyAmIE5vZGVGbGFncy5BZnRlclZpZXdDaGVja2VkKSB7XG4gICAgcHJvdmlkZXIubmdBZnRlclZpZXdDaGVja2VkKCk7XG4gIH1cbiAgaWYgKGxpZmVjeWNsZXMgJiBOb2RlRmxhZ3MuT25EZXN0cm95KSB7XG4gICAgcHJvdmlkZXIubmdPbkRlc3Ryb3koKTtcbiAgfVxufVxuIl19