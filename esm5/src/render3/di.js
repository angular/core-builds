/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getInjectableDef, getInjectorDef } from '../di/defs';
import { injectRootLimpMode, setInjectImplementation } from '../di/injector_compatibility';
import { assertDefined, assertEqual } from './assert';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { NG_ELEMENT_ID } from './fields';
import { NO_PARENT_INJECTOR, PARENT_INJECTOR, TNODE, isFactory } from './interfaces/injector';
import { DECLARATION_VIEW, HOST_NODE, INJECTOR, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { getPreviousOrParentTNode, getViewData, setTNodeAndViewData } from './state';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector, isComponent, stringify } from './util';
/**
 * Defines if the call to `inject` should include `viewProviders` in its resolution.
 *
 * This is set to true when we try to instantiate a component. This value is reset in
 * `getNodeInjectable` to a value which matches the declaration location of the token about to be
 * instantiated. This is done so that if we are injecting a token which was declared outside of
 * `viewProviders` we don't accidentally pull `viewProviders` in.
 *
 * Example:
 *
 * ```
 * @Injectable()
 * class MyService {
 *   constructor(public value: String) {}
 * }
 *
 * @Component({
 *   providers: [
 *     MyService,
 *     {provide: String, value: 'providers' }
 *   ]
 *   viewProviders: [
 *     {provide: String, value: 'viewProviders'}
 *   ]
 * })
 * class MyComponent {
 *   constructor(myService: MyService, value: String) {
 *     // We expect that Component can see into `viewProviders`.
 *     expect(value).toEqual('viewProviders');
 *     // `MyService` was not declared in `viewProviders` hence it can't see it.
 *     expect(myService.value).toEqual('providers');
 *   }
 * }
 *
 * ```
 */
var includeViewProviders = false;
function setIncludeViewProviders(v) {
    var oldValue = includeViewProviders;
    includeViewProviders = v;
    return oldValue;
}
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
var BLOOM_SIZE = 256;
var BLOOM_MASK = BLOOM_SIZE - 1;
/** Counter used to generate unique IDs for directives. */
var nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injectorIndex The index of the node injector where this token should be registered
 * @param tView The TView for the injector's bloom filters
 * @param type The directive token to register
 */
export function bloomAdd(injectorIndex, tView, type) {
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'expected firstTemplatePass to be true');
    var id = type[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = type[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    var bloomBit = id & BLOOM_MASK;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var mask = 1 << bloomBit;
    // Use the raw bloomBit number to determine which bloom filter bucket we should check
    // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
    var b7 = bloomBit & 0x80;
    var b6 = bloomBit & 0x40;
    var b5 = bloomBit & 0x20;
    var tData = tView.data;
    if (b7) {
        b6 ? (b5 ? (tData[injectorIndex + 7] |= mask) : (tData[injectorIndex + 6] |= mask)) :
            (b5 ? (tData[injectorIndex + 5] |= mask) : (tData[injectorIndex + 4] |= mask));
    }
    else {
        b6 ? (b5 ? (tData[injectorIndex + 3] |= mask) : (tData[injectorIndex + 2] |= mask)) :
            (b5 ? (tData[injectorIndex + 1] |= mask) : (tData[injectorIndex] |= mask));
    }
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param tNode for which an injector should be retrieved / created.
 * @param hostView View where the node is stored
 * @returns Node injector
 */
export function getOrCreateNodeInjectorForNode(tNode, hostView) {
    var existingInjectorIndex = getInjectorIndex(tNode, hostView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    var tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        tNode.injectorIndex = hostView.length;
        insertBloom(tView.data, tNode); // foundation for node bloom
        insertBloom(hostView, null); // foundation for cumulative bloom
        insertBloom(tView.blueprint, null);
        ngDevMode && assertEqual(tNode.flags === 0 || tNode.flags === 4096 /* isComponent */, true, 'expected tNode.flags to not be initialized');
    }
    var parentLoc = getParentInjectorLocation(tNode, hostView);
    var parentIndex = getParentInjectorIndex(parentLoc);
    var parentView = getParentInjectorView(parentLoc, hostView);
    var injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (hasParentInjector(parentLoc)) {
        var parentData = parentView[TVIEW].data;
        // Creates a cumulative bloom filter that merges the parent's bloom filter
        // and its own cumulative bloom (which contains tokens for all ancestors)
        for (var i = 0; i < 8; i++) {
            hostView[injectorIndex + i] = parentView[parentIndex + i] | parentData[parentIndex + i];
        }
    }
    hostView[injectorIndex + PARENT_INJECTOR] = parentLoc;
    return injectorIndex;
}
function insertBloom(arr, footer) {
    arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}
export function getInjectorIndex(tNode, hostView) {
    if (tNode.injectorIndex === -1 ||
        // If the injector index is the same as its parent's injector index, then the index has been
        // copied down from the parent node. No injector has been created yet on this node.
        (tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) ||
        // After the first template pass, the injector index might exist but the parent values
        // might not have been calculated yet for this instance
        hostView[tNode.injectorIndex + PARENT_INJECTOR] == null) {
        return -1;
    }
    else {
        return tNode.injectorIndex;
    }
}
/**
 * Finds the index of the parent injector, with a view offset if applicable. Used to set the
 * parent injector initially.
 *
 * Returns a combination of number of `ViewData` we have to go up and index in that `Viewdata`
 */
export function getParentInjectorLocation(tNode, view) {
    if (tNode.parent && tNode.parent.injectorIndex !== -1) {
        return tNode.parent.injectorIndex; // ViewOffset is 0, AcrossHostBoundary is 0
    }
    // For most cases, the parent injector index can be found on the host node (e.g. for component
    // or container), so this loop will be skipped, but we must keep the loop here to support
    // the rarer case of deeply nested <ng-template> tags or inline views.
    var hostTNode = view[HOST_NODE];
    var viewOffset = 1;
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = view[DECLARATION_VIEW];
        hostTNode = view[HOST_NODE];
        viewOffset++;
    }
    var acrossHostBoundary = hostTNode && hostTNode.type === 3 /* Element */ ?
        32768 /* AcrossHostBoundary */ :
        0;
    return hostTNode ?
        hostTNode.injectorIndex | (viewOffset << 16 /* ViewOffsetShift */) |
            acrossHostBoundary :
        -1;
}
/**
 * Makes a type or an injection token public to the DI system by adding it to an
 * injector's bloom filter.
 *
 * @param di The node injector in which a directive will be added
 * @param token The type or the injection token to be made public
 */
export function diPublicInInjector(injectorIndex, view, token) {
    bloomAdd(injectorIndex, view[TVIEW], token);
}
/**
 * Inject static attribute value into directive constructor.
 *
 * This method is used with `factory` functions which are generated as part of
 * `defineDirective` or `defineComponent`. The method retrieves the static value
 * of an attribute. (Dynamic attributes are not supported since they are not resolved
 *  at the time of injection and can change over time.)
 *
 * # Example
 * Given:
 * ```
 * @Component(...)
 * class MyComponent {
 *   constructor(@Attribute('title') title: string) { ... }
 * }
 * ```
 * When instantiated with
 * ```
 * <my-component title="Hello"></my-component>
 * ```
 *
 * Then factory method generated is:
 * ```
 * MyComponent.ngComponentDef = defineComponent({
 *   factory: () => new MyComponent(injectAttribute('title'))
 *   ...
 * })
 * ```
 *
 * @publicApi
 */
export function injectAttributeImpl(tNode, attrNameToInject) {
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    var attrs = tNode.attrs;
    if (attrs) {
        for (var i = 0; i < attrs.length; i = i + 2) {
            var attrName = attrs[i];
            if (attrName === 1 /* SelectOnly */)
                break;
            if (attrName == attrNameToInject) {
                return attrs[i + 1];
            }
        }
    }
    return undefined;
}
/**
 * Returns the value associated to the given token from the NodeInjectors => ModuleInjector.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @param nodeInjector Node injector where the search should start
 * @param token The token to look for
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export function getOrCreateInjectable(tNode, lViewData, token, flags, notFoundValue) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function') {
        var savePreviousOrParentTNode = getPreviousOrParentTNode();
        var saveViewData = getViewData();
        setTNodeAndViewData(tNode, lViewData);
        try {
            var value = bloomHash();
            if (value == null && !(flags & 8 /* Optional */)) {
                throw new Error("No provider for " + stringify(token));
            }
            else {
                return value;
            }
        }
        finally {
            setTNodeAndViewData(savePreviousOrParentTNode, saveViewData);
        }
    }
    else if (typeof bloomHash == 'number') {
        // If the token has a bloom hash, then it is a token which could be in NodeInjector.
        // A reference to the previous injector TView that was found while climbing the element injector
        // tree. This is used to know if viewProviders can be accessed on the current injector.
        var previousTView = null;
        var injectorIndex = getInjectorIndex(tNode, lViewData);
        var parentLocation = NO_PARENT_INJECTOR;
        // If we should skip this injector, start by searching the parent injector.
        if (flags & 4 /* SkipSelf */) {
            parentLocation = injectorIndex === -1 ? getParentInjectorLocation(tNode, lViewData) :
                lViewData[injectorIndex + PARENT_INJECTOR];
            if (!shouldSearchParent(flags, parentLocation)) {
                injectorIndex = -1;
            }
            else {
                previousTView = lViewData[TVIEW];
                injectorIndex = getParentInjectorIndex(parentLocation);
                lViewData = getParentInjectorView(parentLocation, lViewData);
            }
        }
        // Traverse up the injector tree until we find a potential match or until we know there
        // *isn't* a match.
        while (injectorIndex !== -1) {
            parentLocation = lViewData[injectorIndex + PARENT_INJECTOR];
            // Check the current injector. If it matches, see if it contains token.
            var tView = lViewData[TVIEW];
            if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
                // At this point, we have an injector which *may* contain the token, so we step through
                // the providers and directives associated with the injector's corresponding node to get
                // the instance.
                var instance = searchTokensOnInjector(injectorIndex, lViewData, token, previousTView);
                if (instance !== NOT_FOUND) {
                    return instance;
                }
            }
            if (shouldSearchParent(flags, parentLocation) &&
                bloomHasToken(bloomHash, injectorIndex, lViewData)) {
                // The def wasn't found anywhere on this node, so it was a false positive.
                // Traverse up the tree and continue searching.
                previousTView = tView;
                injectorIndex = getParentInjectorIndex(parentLocation);
                lViewData = getParentInjectorView(parentLocation, lViewData);
            }
            else {
                // If we should not search parent OR If the ancestor bloom filter value does not have the
                // bit corresponding to the directive we can give up on traversing up to find the specific
                // injector.
                injectorIndex = -1;
            }
        }
    }
    if (flags & 8 /* Optional */ && notFoundValue === undefined) {
        // This must be set or the NullInjector will throw for optional deps
        notFoundValue = null;
    }
    if ((flags & (2 /* Self */ | 1 /* Host */)) === 0) {
        var moduleInjector = lViewData[INJECTOR];
        if (moduleInjector) {
            return moduleInjector.get(token, notFoundValue, flags & 8 /* Optional */);
        }
        else {
            return injectRootLimpMode(token, notFoundValue, flags & 8 /* Optional */);
        }
    }
    if (flags & 8 /* Optional */) {
        return notFoundValue;
    }
    else {
        throw new Error("NodeInjector: NOT_FOUND [" + stringify(token) + "]");
    }
}
var NOT_FOUND = {};
function searchTokensOnInjector(injectorIndex, injectorView, token, previousTView) {
    var currentTView = injectorView[TVIEW];
    var tNode = currentTView.data[injectorIndex + TNODE];
    var nodeFlags = tNode.flags;
    var nodeProviderIndexes = tNode.providerIndexes;
    var tInjectables = currentTView.data;
    // First, we step through providers
    var canAccessViewProviders = false;
    // We need to determine if view providers can be accessed by the starting element.
    // It happens in 2 cases:
    // 1) On the initial element injector , if we are instantiating a token which can see the
    // viewProviders of the component of that element. Such token are:
    // - the component itself (but not other directives)
    // - viewProviders tokens of the component (but not providers tokens)
    // 2) Upper in the element injector tree, if the starting element is actually in the view of
    // the current element. To determine this, we track the transition of view during the climb,
    // and check the host node of the current view to identify component views.
    if (previousTView == null && isComponent(tNode) && includeViewProviders ||
        previousTView != null && previousTView != currentTView &&
            (currentTView.node == null || currentTView.node.type === 3 /* Element */)) {
        canAccessViewProviders = true;
    }
    var startInjectables = nodeProviderIndexes & 65535 /* ProvidersStartIndexMask */;
    var startDirectives = nodeFlags >> 16 /* DirectiveStartingIndexShift */;
    var cptViewProvidersCount = nodeProviderIndexes >> 16 /* CptViewProvidersCountShift */;
    var startingIndex = canAccessViewProviders ? startInjectables : startInjectables + cptViewProvidersCount;
    var directiveCount = nodeFlags & 4095 /* DirectiveCountMask */;
    for (var i = startingIndex; i < startDirectives + directiveCount; i++) {
        var providerTokenOrDef = tInjectables[i];
        if (i < startDirectives && token === providerTokenOrDef ||
            i >= startDirectives && providerTokenOrDef.type === token) {
            return getNodeInjectable(tInjectables, injectorView, i, tNode);
        }
    }
    return NOT_FOUND;
}
/**
* Retrieve or instantiate the injectable from the `lData` at particular `index`.
*
* This function checks to see if the value has already been instantiated and if so returns the
* cached `injectable`. Otherwise if it detects that the value is still a factory it
* instantiates the `injectable` and caches the value.
*/
export function getNodeInjectable(tData, lData, index, tNode) {
    var value = lData[index];
    if (isFactory(value)) {
        var factory = value;
        if (factory.resolving) {
            throw new Error("Circular dep for " + stringify(tData[index]));
        }
        var previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
        factory.resolving = true;
        var previousInjectImplementation = void 0;
        if (factory.injectImpl) {
            previousInjectImplementation = setInjectImplementation(factory.injectImpl);
        }
        var savePreviousOrParentTNode = getPreviousOrParentTNode();
        var saveViewData = getViewData();
        setTNodeAndViewData(tNode, lData);
        try {
            value = lData[index] = factory.factory(null, tData, lData, tNode);
        }
        finally {
            if (factory.injectImpl)
                setInjectImplementation(previousInjectImplementation);
            setIncludeViewProviders(previousIncludeViewProviders);
            factory.resolving = false;
            setTNodeAndViewData(savePreviousOrParentTNode, saveViewData);
        }
    }
    return value;
}
/**
 * Returns the bit in an injector's bloom filter that should be used to determine whether or not
 * the directive might be provided by the injector.
 *
 * When a directive is public, it is added to the bloom filter and given a unique ID that can be
 * retrieved on the Type. When the directive isn't public or the token is not a directive `null`
 * is returned as the node injector can not possibly provide that token.
 *
 * @param token the injection token
 * @returns the matching bit to check in the bloom filter or `null` if the token is not known.
 */
export function bloomHashBitOrFactory(token) {
    ngDevMode && assertDefined(token, 'token must be defined');
    var tokenId = token[NG_ELEMENT_ID];
    return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
}
export function bloomHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var mask = 1 << bloomHash;
    var b7 = bloomHash & 0x80;
    var b6 = bloomHash & 0x40;
    var b5 = bloomHash & 0x20;
    // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
    // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
    // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
    var value;
    if (b7) {
        value = b6 ? (b5 ? injectorView[injectorIndex + 7] : injectorView[injectorIndex + 6]) :
            (b5 ? injectorView[injectorIndex + 5] : injectorView[injectorIndex + 4]);
    }
    else {
        value = b6 ? (b5 ? injectorView[injectorIndex + 3] : injectorView[injectorIndex + 2]) :
            (b5 ? injectorView[injectorIndex + 1] : injectorView[injectorIndex]);
    }
    // If the bloom filter value has the bit corresponding to the directive's bloomBit flipped on,
    // this injector is a potential match.
    return !!(value & mask);
}
/** Returns true if flags prevent parent injector from being searched for tokens */
function shouldSearchParent(flags, parentLocation) {
    return !(flags & 2 /* Self */ ||
        (flags & 1 /* Host */ &&
            (parentLocation & 32768 /* AcrossHostBoundary */)));
}
export function injectInjector() {
    var tNode = getPreviousOrParentTNode();
    return new NodeInjector(tNode, getViewData());
}
var NodeInjector = /** @class */ (function () {
    function NodeInjector(_tNode, _hostView) {
        this._tNode = _tNode;
        this._hostView = _hostView;
        this._injectorIndex = getOrCreateNodeInjectorForNode(_tNode, _hostView);
    }
    NodeInjector.prototype.get = function (token) {
        setTNodeAndViewData(this._tNode, this._hostView);
        return getOrCreateInjectable(this._tNode, this._hostView, token);
    };
    return NodeInjector;
}());
export { NodeInjector };
export function getFactoryOf(type) {
    var typeAny = type;
    var def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
        getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
export function getInheritedFactory(type) {
    var proto = Object.getPrototypeOf(type.prototype).constructor;
    var factory = getFactoryOf(proto);
    if (factory !== null) {
        return factory;
    }
    else {
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return function (t) { return new t(); };
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHNUQsT0FBTyxFQUFjLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEcsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUF1QixlQUFlLEVBQTJELEtBQUssRUFBRSxTQUFTLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxSyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBb0IsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDeEcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbkYsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFaEg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUNHO0FBQ0gsSUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7QUFFakMsU0FBUyx1QkFBdUIsQ0FBQyxDQUFVO0lBQ3pDLElBQU0sUUFBUSxHQUFHLG9CQUFv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QUcsQ0FBQyxPQUFPLENBQUM7QUFDckIsQ0FBQztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBSSxJQUFlO0lBQ3BELElBQU0sS0FBSyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLFdBQXdCLENBQUM7SUFDN0UsSUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFJLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixPQUFPLE9BQU8sQ0FBQztLQUNoQjtTQUFNO1FBQ0wsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNEJBQTRCO1FBQzVCLE9BQU8sVUFBQyxDQUFDLElBQUssT0FBQSxJQUFJLENBQUMsRUFBRSxFQUFQLENBQU8sQ0FBQztLQUN2QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2RlZnMnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIGluamVjdFJvb3RMaW1wTW9kZSwgc2V0SW5qZWN0SW1wbGVtZW50YXRpb259IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tk9fUEFSRU5UX0lOSkVDVE9SLCBOb2RlSW5qZWN0b3JGYWN0b3J5LCBQQVJFTlRfSU5KRUNUT1IsIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MsIFROT0RFLCBpc0ZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgZ2V0Vmlld0RhdGEsIHNldFROb2RlQW5kVmlld0RhdGF9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yLCBpc0NvbXBvbmVudCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG4vKipcbiAqIERlZmluZXMgaWYgdGhlIGNhbGwgdG8gYGluamVjdGAgc2hvdWxkIGluY2x1ZGUgYHZpZXdQcm92aWRlcnNgIGluIGl0cyByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgaXMgc2V0IHRvIHRydWUgd2hlbiB3ZSB0cnkgdG8gaW5zdGFudGlhdGUgYSBjb21wb25lbnQuIFRoaXMgdmFsdWUgaXMgcmVzZXQgaW5cbiAqIGBnZXROb2RlSW5qZWN0YWJsZWAgdG8gYSB2YWx1ZSB3aGljaCBtYXRjaGVzIHRoZSBkZWNsYXJhdGlvbiBsb2NhdGlvbiBvZiB0aGUgdG9rZW4gYWJvdXQgdG8gYmVcbiAqIGluc3RhbnRpYXRlZC4gVGhpcyBpcyBkb25lIHNvIHRoYXQgaWYgd2UgYXJlIGluamVjdGluZyBhIHRva2VuIHdoaWNoIHdhcyBkZWNsYXJlZCBvdXRzaWRlIG9mXG4gKiBgdmlld1Byb3ZpZGVyc2Agd2UgZG9uJ3QgYWNjaWRlbnRhbGx5IHB1bGwgYHZpZXdQcm92aWRlcnNgIGluLlxuICpcbiAqIEV4YW1wbGU6XG4gKlxuICogYGBgXG4gKiBASW5qZWN0YWJsZSgpXG4gKiBjbGFzcyBNeVNlcnZpY2Uge1xuICogICBjb25zdHJ1Y3RvcihwdWJsaWMgdmFsdWU6IFN0cmluZykge31cbiAqIH1cbiAqXG4gKiBAQ29tcG9uZW50KHtcbiAqICAgcHJvdmlkZXJzOiBbXG4gKiAgICAgTXlTZXJ2aWNlLFxuICogICAgIHtwcm92aWRlOiBTdHJpbmcsIHZhbHVlOiAncHJvdmlkZXJzJyB9XG4gKiAgIF1cbiAqICAgdmlld1Byb3ZpZGVyczogW1xuICogICAgIHtwcm92aWRlOiBTdHJpbmcsIHZhbHVlOiAndmlld1Byb3ZpZGVycyd9XG4gKiAgIF1cbiAqIH0pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKG15U2VydmljZTogTXlTZXJ2aWNlLCB2YWx1ZTogU3RyaW5nKSB7XG4gKiAgICAgLy8gV2UgZXhwZWN0IHRoYXQgQ29tcG9uZW50IGNhbiBzZWUgaW50byBgdmlld1Byb3ZpZGVyc2AuXG4gKiAgICAgZXhwZWN0KHZhbHVlKS50b0VxdWFsKCd2aWV3UHJvdmlkZXJzJyk7XG4gKiAgICAgLy8gYE15U2VydmljZWAgd2FzIG5vdCBkZWNsYXJlZCBpbiBgdmlld1Byb3ZpZGVyc2AgaGVuY2UgaXQgY2FuJ3Qgc2VlIGl0LlxuICogICAgIGV4cGVjdChteVNlcnZpY2UudmFsdWUpLnRvRXF1YWwoJ3Byb3ZpZGVycycpO1xuICogICB9XG4gKiB9XG4gKlxuICogYGBgXG4gKi9cbmxldCBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyh2OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9sZFZhbHVlID0gaW5jbHVkZVZpZXdQcm92aWRlcnM7XG4gIGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gdjtcbiAgcmV0dXJuIG9sZFZhbHVlO1xufVxuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcbmNvbnN0IEJMT09NX01BU0sgPSBCTE9PTV9TSVpFIC0gMTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3JJbmRleCBUaGUgaW5kZXggb2YgdGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgdGhpcyB0b2tlbiBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHRWaWV3IFRoZSBUVmlldyBmb3IgdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyc1xuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0b2tlbiB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIHR5cGU6IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdleHBlY3RlZCBmaXJzdFRlbXBsYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YSBhcyBudW1iZXJbXTtcblxuICBpZiAoYjcpIHtcbiAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgN10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDZdIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDVdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA0XSB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDNdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyAyXSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAxXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4XSB8PSBtYXNrKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIGhvc3RWaWV3IFZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgaG9zdFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGhvc3RWaWV3Lmxlbmd0aDtcbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5kYXRhLCB0Tm9kZSk7ICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20oaG9zdFZpZXcsIG51bGwpOyAgICAgLy8gZm91bmRhdGlvbiBmb3IgY3VtdWxhdGl2ZSBibG9vbVxuICAgIGluc2VydEJsb29tKHRWaWV3LmJsdWVwcmludCwgbnVsbCk7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICB0Tm9kZS5mbGFncyA9PT0gMCB8fCB0Tm9kZS5mbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCB0Tm9kZS5mbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmVudExvYyA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odE5vZGUsIGhvc3RWaWV3KTtcbiAgY29uc3QgcGFyZW50SW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvYyk7XG4gIGNvbnN0IHBhcmVudFZpZXc6IExWaWV3RGF0YSA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2MsIGhvc3RWaWV3KTtcblxuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICAvLyBJZiBhIHBhcmVudCBpbmplY3RvciBjYW4ndCBiZSBmb3VuZCwgaXRzIGxvY2F0aW9uIGlzIHNldCB0byAtMS5cbiAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBuZWVkIHRvIHNldCB1cCBhIGN1bXVsYXRpdmUgYmxvb21cbiAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvYykpIHtcbiAgICBjb25zdCBwYXJlbnREYXRhID0gcGFyZW50Vmlld1tUVklFV10uZGF0YSBhcyBhbnk7XG4gICAgLy8gQ3JlYXRlcyBhIGN1bXVsYXRpdmUgYmxvb20gZmlsdGVyIHRoYXQgbWVyZ2VzIHRoZSBwYXJlbnQncyBibG9vbSBmaWx0ZXJcbiAgICAvLyBhbmQgaXRzIG93biBjdW11bGF0aXZlIGJsb29tICh3aGljaCBjb250YWlucyB0b2tlbnMgZm9yIGFsbCBhbmNlc3RvcnMpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBpXSA9IHBhcmVudFZpZXdbcGFyZW50SW5kZXggKyBpXSB8IHBhcmVudERhdGFbcGFyZW50SW5kZXggKyBpXTtcbiAgICB9XG4gIH1cblxuICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJsb29tKGFycjogYW55W10sIGZvb3RlcjogVE5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGFyci5wdXNoKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIGZvb3Rlcik7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9ySW5kZXgodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgaG9zdFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICpcbiAqIFJldHVybnMgYSBjb21iaW5hdGlvbiBvZiBudW1iZXIgb2YgYFZpZXdEYXRhYCB3ZSBoYXZlIHRvIGdvIHVwIGFuZCBpbmRleCBpbiB0aGF0IGBWaWV3ZGF0YWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odE5vZGU6IFROb2RlLCB2aWV3OiBMVmlld0RhdGEpOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24ge1xuICBpZiAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCBhcyBhbnk7ICAvLyBWaWV3T2Zmc2V0IGlzIDAsIEFjcm9zc0hvc3RCb3VuZGFyeSBpcyAwXG4gIH1cblxuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIHNvIHRoaXMgbG9vcCB3aWxsIGJlIHNraXBwZWQsIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0XG4gIC8vIHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWQgPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXTtcbiAgbGV0IHZpZXdPZmZzZXQgPSAxO1xuICB3aGlsZSAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS5pbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgIHZpZXcgPSB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdICE7XG4gICAgdmlld09mZnNldCsrO1xuICB9XG4gIGNvbnN0IGFjcm9zc0hvc3RCb3VuZGFyeSA9IGhvc3RUTm9kZSAmJiBob3N0VE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQgP1xuICAgICAgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuQWNyb3NzSG9zdEJvdW5kYXJ5IDpcbiAgICAgIDA7XG5cbiAgcmV0dXJuIGhvc3RUTm9kZSA/XG4gICAgICBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCB8ICh2aWV3T2Zmc2V0IDw8IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgfFxuICAgICAgICAgIGFjcm9zc0hvc3RCb3VuZGFyeSA6XG4gICAgICAtMSBhcyBhbnk7XG59XG5cbi8qKlxuICogTWFrZXMgYSB0eXBlIG9yIGFuIGluamVjdGlvbiB0b2tlbiBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW5cbiAqIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHR5cGUgb3IgdGhlIGluamVjdGlvbiB0b2tlbiB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhLCB0b2tlbjogSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHZpZXdbVFZJRVddLCB0b2tlbik7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZUltcGwodE5vZGU6IFROb2RlLCBhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgTm9kZUluamVjdG9ycyA9PiBNb2R1bGVJbmplY3Rvci5cbiAqXG4gKiBMb29rIGZvciB0aGUgaW5qZWN0b3IgcHJvdmlkaW5nIHRoZSB0b2tlbiBieSB3YWxraW5nIHVwIHRoZSBub2RlIGluamVjdG9yIHRyZWUgYW5kIHRoZW5cbiAqIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBAcGFyYW0gbm9kZUluamVjdG9yIE5vZGUgaW5qZWN0b3Igd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciBgbnVsbGAgd2hlbiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3RGF0YTogTFZpZXdEYXRhLFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCxcbiAgICBub3RGb3VuZFZhbHVlPzogYW55KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgLy8gSWYgdGhlIElEIHN0b3JlZCBoZXJlIGlzIGEgZnVuY3Rpb24sIHRoaXMgaXMgYSBzcGVjaWFsIG9iamVjdCBsaWtlIEVsZW1lbnRSZWYgb3IgVGVtcGxhdGVSZWZcbiAgLy8gc28ganVzdCBjYWxsIHRoZSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBpdC5cbiAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCBzYXZlUHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gICAgY29uc3Qgc2F2ZVZpZXdEYXRhID0gZ2V0Vmlld0RhdGEoKTtcbiAgICBzZXRUTm9kZUFuZFZpZXdEYXRhKHROb2RlLCBsVmlld0RhdGEpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGJsb29tSGFzaCgpO1xuICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFROb2RlQW5kVmlld0RhdGEoc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2F2ZVZpZXdEYXRhKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJsb29tSGFzaCA9PSAnbnVtYmVyJykge1xuICAgIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgdG9rZW4gd2hpY2ggY291bGQgYmUgaW4gTm9kZUluamVjdG9yLlxuXG4gICAgLy8gQSByZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIGluamVjdG9yIFRWaWV3IHRoYXQgd2FzIGZvdW5kIHdoaWxlIGNsaW1iaW5nIHRoZSBlbGVtZW50IGluamVjdG9yXG4gICAgLy8gdHJlZS4gVGhpcyBpcyB1c2VkIHRvIGtub3cgaWYgdmlld1Byb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgb24gdGhlIGN1cnJlbnQgaW5qZWN0b3IuXG4gICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXdEYXRhKTtcbiAgICBsZXQgcGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiA9IE5PX1BBUkVOVF9JTkpFQ1RPUjtcblxuICAgIC8vIElmIHdlIHNob3VsZCBza2lwIHRoaXMgaW5qZWN0b3IsIHN0YXJ0IGJ5IHNlYXJjaGluZyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXdEYXRhKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXdEYXRhW2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuXG4gICAgICBpZiAoIXNob3VsZFNlYXJjaFBhcmVudChmbGFncywgcGFyZW50TG9jYXRpb24pKSB7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHByZXZpb3VzVFZpZXcgPSBsVmlld0RhdGFbVFZJRVddO1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3RGF0YSA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXdEYXRhKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmVcbiAgICAvLyAqaXNuJ3QqIGEgbWF0Y2guXG4gICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGxWaWV3RGF0YVtpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcblxuICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgaW5qZWN0b3IuIElmIGl0IG1hdGNoZXMsIHNlZSBpZiBpdCBjb250YWlucyB0b2tlbi5cbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdEYXRhW1RWSUVXXTtcbiAgICAgIGlmIChibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgdFZpZXcuZGF0YSkpIHtcbiAgICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoXG4gICAgICAgIC8vIHRoZSBwcm92aWRlcnMgYW5kIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXRcbiAgICAgICAgLy8gdGhlIGluc3RhbmNlLlxuICAgICAgICBjb25zdCBpbnN0YW5jZTogVHxudWxsID1cbiAgICAgICAgICAgIHNlYXJjaFRva2Vuc09uSW5qZWN0b3I8VD4oaW5qZWN0b3JJbmRleCwgbFZpZXdEYXRhLCB0b2tlbiwgcHJldmlvdXNUVmlldyk7XG4gICAgICAgIGlmIChpbnN0YW5jZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzLCBwYXJlbnRMb2NhdGlvbikgJiZcbiAgICAgICAgICBibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgbFZpZXdEYXRhKSkge1xuICAgICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgICBwcmV2aW91c1RWaWV3ID0gdFZpZXc7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXdEYXRhID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlld0RhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgd2Ugc2hvdWxkIG5vdCBzZWFyY2ggcGFyZW50IE9SIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgZG9lcyBub3QgaGF2ZSB0aGVcbiAgICAgICAgLy8gYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSB3ZSBjYW4gZ2l2ZSB1cCBvbiB0cmF2ZXJzaW5nIHVwIHRvIGZpbmQgdGhlIHNwZWNpZmljXG4gICAgICAgIC8vIGluamVjdG9yLlxuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwgJiYgbm90Rm91bmRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCBvciB0aGUgTnVsbEluamVjdG9yIHdpbGwgdGhyb3cgZm9yIG9wdGlvbmFsIGRlcHNcbiAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgfVxuXG4gIGlmICgoZmxhZ3MgJiAoSW5qZWN0RmxhZ3MuU2VsZiB8IEluamVjdEZsYWdzLkhvc3QpKSA9PT0gMCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gbFZpZXdEYXRhW0lOSkVDVE9SXTtcbiAgICBpZiAobW9kdWxlSW5qZWN0b3IpIHtcbiAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaW5qZWN0Um9vdExpbXBNb2RlKHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICB9XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHtcbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGVJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xuICB9XG59XG5cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlld0RhdGEsIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBwcmV2aW91c1RWaWV3OiBUVmlldyB8IG51bGwpIHtcbiAgY29uc3QgY3VycmVudFRWaWV3ID0gaW5qZWN0b3JWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBjdXJyZW50VFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgVE5PREVdIGFzIFROb2RlO1xuICBjb25zdCBub2RlRmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgY29uc3Qgbm9kZVByb3ZpZGVySW5kZXhlcyA9IHROb2RlLnByb3ZpZGVySW5kZXhlcztcbiAgY29uc3QgdEluamVjdGFibGVzID0gY3VycmVudFRWaWV3LmRhdGE7XG4gIC8vIEZpcnN0LCB3ZSBzdGVwIHRocm91Z2ggcHJvdmlkZXJzXG4gIGxldCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID0gZmFsc2U7XG4gIC8vIFdlIG5lZWQgdG8gZGV0ZXJtaW5lIGlmIHZpZXcgcHJvdmlkZXJzIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgc3RhcnRpbmcgZWxlbWVudC5cbiAgLy8gSXQgaGFwcGVucyBpbiAyIGNhc2VzOlxuICAvLyAxKSBPbiB0aGUgaW5pdGlhbCBlbGVtZW50IGluamVjdG9yICwgaWYgd2UgYXJlIGluc3RhbnRpYXRpbmcgYSB0b2tlbiB3aGljaCBjYW4gc2VlIHRoZVxuICAvLyB2aWV3UHJvdmlkZXJzIG9mIHRoZSBjb21wb25lbnQgb2YgdGhhdCBlbGVtZW50LiBTdWNoIHRva2VuIGFyZTpcbiAgLy8gLSB0aGUgY29tcG9uZW50IGl0c2VsZiAoYnV0IG5vdCBvdGhlciBkaXJlY3RpdmVzKVxuICAvLyAtIHZpZXdQcm92aWRlcnMgdG9rZW5zIG9mIHRoZSBjb21wb25lbnQgKGJ1dCBub3QgcHJvdmlkZXJzIHRva2VucylcbiAgLy8gMikgVXBwZXIgaW4gdGhlIGVsZW1lbnQgaW5qZWN0b3IgdHJlZSwgaWYgdGhlIHN0YXJ0aW5nIGVsZW1lbnQgaXMgYWN0dWFsbHkgaW4gdGhlIHZpZXcgb2ZcbiAgLy8gdGhlIGN1cnJlbnQgZWxlbWVudC4gVG8gZGV0ZXJtaW5lIHRoaXMsIHdlIHRyYWNrIHRoZSB0cmFuc2l0aW9uIG9mIHZpZXcgZHVyaW5nIHRoZSBjbGltYixcbiAgLy8gYW5kIGNoZWNrIHRoZSBob3N0IG5vZGUgb2YgdGhlIGN1cnJlbnQgdmlldyB0byBpZGVudGlmeSBjb21wb25lbnQgdmlld3MuXG4gIGlmIChwcmV2aW91c1RWaWV3ID09IG51bGwgJiYgaXNDb21wb25lbnQodE5vZGUpICYmIGluY2x1ZGVWaWV3UHJvdmlkZXJzIHx8XG4gICAgICBwcmV2aW91c1RWaWV3ICE9IG51bGwgJiYgcHJldmlvdXNUVmlldyAhPSBjdXJyZW50VFZpZXcgJiZcbiAgICAgICAgICAoY3VycmVudFRWaWV3Lm5vZGUgPT0gbnVsbCB8fCBjdXJyZW50VFZpZXcubm9kZSAhLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSkge1xuICAgIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPSB0cnVlO1xuICB9XG4gIGNvbnN0IHN0YXJ0SW5qZWN0YWJsZXMgPSBub2RlUHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IHN0YXJ0RGlyZWN0aXZlcyA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgY29uc3QgY3B0Vmlld1Byb3ZpZGVyc0NvdW50ID1cbiAgICAgIG5vZGVQcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG4gIGNvbnN0IHN0YXJ0aW5nSW5kZXggPVxuICAgICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA/IHN0YXJ0SW5qZWN0YWJsZXMgOiBzdGFydEluamVjdGFibGVzICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50O1xuICBjb25zdCBkaXJlY3RpdmVDb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IHN0YXJ0RGlyZWN0aXZlcyArIGRpcmVjdGl2ZUNvdW50OyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlclRva2VuT3JEZWYgPSB0SW5qZWN0YWJsZXNbaV0gYXMgSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoaSA8IHN0YXJ0RGlyZWN0aXZlcyAmJiB0b2tlbiA9PT0gcHJvdmlkZXJUb2tlbk9yRGVmIHx8XG4gICAgICAgIGkgPj0gc3RhcnREaXJlY3RpdmVzICYmIChwcm92aWRlclRva2VuT3JEZWYgYXMgRGlyZWN0aXZlRGVmPGFueT4pLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUodEluamVjdGFibGVzLCBpbmplY3RvclZpZXcsIGksIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gICAgfVxuICB9XG4gIHJldHVybiBOT1RfRk9VTkQ7XG59XG5cbi8qKlxuKiBSZXRyaWV2ZSBvciBpbnN0YW50aWF0ZSB0aGUgaW5qZWN0YWJsZSBmcm9tIHRoZSBgbERhdGFgIGF0IHBhcnRpY3VsYXIgYGluZGV4YC5cbipcbiogVGhpcyBmdW5jdGlvbiBjaGVja3MgdG8gc2VlIGlmIHRoZSB2YWx1ZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCBhbmQgaWYgc28gcmV0dXJucyB0aGVcbiogY2FjaGVkIGBpbmplY3RhYmxlYC4gT3RoZXJ3aXNlIGlmIGl0IGRldGVjdHMgdGhhdCB0aGUgdmFsdWUgaXMgc3RpbGwgYSBmYWN0b3J5IGl0XG4qIGluc3RhbnRpYXRlcyB0aGUgYGluamVjdGFibGVgIGFuZCBjYWNoZXMgdGhlIHZhbHVlLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlSW5qZWN0YWJsZShcbiAgICB0RGF0YTogVERhdGEsIGxEYXRhOiBMVmlld0RhdGEsIGluZGV4OiBudW1iZXIsIHROb2RlOiBURWxlbWVudE5vZGUpOiBhbnkge1xuICBsZXQgdmFsdWUgPSBsRGF0YVtpbmRleF07XG4gIGlmIChpc0ZhY3RvcnkodmFsdWUpKSB7XG4gICAgY29uc3QgZmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSA9IHZhbHVlO1xuICAgIGlmIChmYWN0b3J5LnJlc29sdmluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaXJjdWxhciBkZXAgZm9yICR7c3RyaW5naWZ5KHREYXRhW2luZGV4XSl9YCk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMgPSBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhmYWN0b3J5LmNhblNlZVZpZXdQcm92aWRlcnMpO1xuICAgIGZhY3RvcnkucmVzb2x2aW5nID0gdHJ1ZTtcbiAgICBsZXQgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgICBpZiAoZmFjdG9yeS5pbmplY3RJbXBsKSB7XG4gICAgICBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oZmFjdG9yeS5pbmplY3RJbXBsKTtcbiAgICB9XG4gICAgY29uc3Qgc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgIGNvbnN0IHNhdmVWaWV3RGF0YSA9IGdldFZpZXdEYXRhKCk7XG4gICAgc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZSwgbERhdGEpO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGxEYXRhW2luZGV4XSA9IGZhY3RvcnkuZmFjdG9yeShudWxsLCB0RGF0YSwgbERhdGEsIHROb2RlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzKTtcbiAgICAgIGZhY3RvcnkucmVzb2x2aW5nID0gZmFsc2U7XG4gICAgICBzZXRUTm9kZUFuZFZpZXdEYXRhKHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUsIHNhdmVWaWV3RGF0YSk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiBudW1iZXJ8RnVuY3Rpb258XG4gICAgdW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgY29uc3QgdG9rZW5JZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihcbiAgICBibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3RGF0YSB8IFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuICBjb25zdCBiNyA9IGJsb29tSGFzaCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21IYXNoICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUhhc2ggJiAweDIwO1xuXG4gIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgaWYgKGI3KSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgN10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDZdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDRdKTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAzXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAxXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4XSk7XG4gIH1cblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgcGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IGJvb2xlYW58XG4gICAgbnVtYmVyIHtcbiAgcmV0dXJuICEoXG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHxcbiAgICAgIChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiZcbiAgICAgICAoKHBhcmVudExvY2F0aW9uIGFzIGFueSBhcyBudW1iZXIpICYgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuQWNyb3NzSG9zdEJvdW5kYXJ5KSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3IoKSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBnZXRWaWV3RGF0YSgpKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0VmlldzogTFZpZXdEYXRhKSB7XG4gICAgdGhpcy5faW5qZWN0b3JJbmRleCA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShfdE5vZGUsIF9ob3N0Vmlldyk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSk6IGFueSB7XG4gICAgc2V0VE5vZGVBbmRWaWV3RGF0YSh0aGlzLl90Tm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUodGhpcy5fdE5vZGUsIHRoaXMuX2hvc3RWaWV3LCB0b2tlbik7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU6IFR5cGU8VD58IG51bGwpID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=