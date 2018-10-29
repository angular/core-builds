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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHNUQsT0FBTyxFQUFjLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEcsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUF1QixlQUFlLEVBQTJELEtBQUssRUFBRSxTQUFTLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxSyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBb0IsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDeEcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQyx3QkFBd0IsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDbkYsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFFaEg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0dBbUNHO0FBQ0gsSUFBSSxvQkFBb0IsR0FBRyxLQUFLLENBQUM7QUFFakMsU0FBUyx1QkFBdUIsQ0FBQyxDQUFVO0lBQ3pDLElBQU0sUUFBUSxHQUFHLG9CQUFv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QUFNLE9BQU8sR0FBRyxZQUFZLENBQUksS0FBSyxDQUFDLENBQUM7SUFDdkMsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sT0FBTyxDQUFDO0tBQ2hCO1NBQU07UUFDTCw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw0QkFBNEI7UUFDNUIsT0FBTyxVQUFDLENBQUMsSUFBSyxPQUFBLElBQUksQ0FBQyxFQUFFLEVBQVAsQ0FBTyxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFncywgaW5qZWN0Um9vdExpbXBNb2RlLCBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbn0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOT19QQVJFTlRfSU5KRUNUT1IsIE5vZGVJbmplY3RvckZhY3RvcnksIFBBUkVOVF9JTkpFQ1RPUiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncywgVE5PREUsIGlzRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX1ZJRVcsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRWaWV3RGF0YSwgc2V0VE5vZGVBbmRWaWV3RGF0YX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3IsIGlzQ29tcG9uZW50LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogRGVmaW5lcyBpZiB0aGUgY2FsbCB0byBgaW5qZWN0YCBzaG91bGQgaW5jbHVkZSBgdmlld1Byb3ZpZGVyc2AgaW4gaXRzIHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHdlIHRyeSB0byBpbnN0YW50aWF0ZSBhIGNvbXBvbmVudC4gVGhpcyB2YWx1ZSBpcyByZXNldCBpblxuICogYGdldE5vZGVJbmplY3RhYmxlYCB0byBhIHZhbHVlIHdoaWNoIG1hdGNoZXMgdGhlIGRlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoZSB0b2tlbiBhYm91dCB0byBiZVxuICogaW5zdGFudGlhdGVkLiBUaGlzIGlzIGRvbmUgc28gdGhhdCBpZiB3ZSBhcmUgaW5qZWN0aW5nIGEgdG9rZW4gd2hpY2ggd2FzIGRlY2xhcmVkIG91dHNpZGUgb2ZcbiAqIGB2aWV3UHJvdmlkZXJzYCB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcHVsbCBgdmlld1Byb3ZpZGVyc2AgaW4uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogU3RyaW5nKSB7fVxuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBNeVNlcnZpY2UsXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICdwcm92aWRlcnMnIH1cbiAqICAgXVxuICogICB2aWV3UHJvdmlkZXJzOiBbXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICd2aWV3UHJvdmlkZXJzJ31cbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IobXlTZXJ2aWNlOiBNeVNlcnZpY2UsIHZhbHVlOiBTdHJpbmcpIHtcbiAqICAgICAvLyBXZSBleHBlY3QgdGhhdCBDb21wb25lbnQgY2FuIHNlZSBpbnRvIGB2aWV3UHJvdmlkZXJzYC5cbiAqICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ3ZpZXdQcm92aWRlcnMnKTtcbiAqICAgICAvLyBgTXlTZXJ2aWNlYCB3YXMgbm90IGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCBoZW5jZSBpdCBjYW4ndCBzZWUgaXQuXG4gKiAgICAgZXhwZWN0KG15U2VydmljZS52YWx1ZSkudG9FcXVhbCgncHJvdmlkZXJzJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBgYGBcbiAqL1xubGV0IGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gZmFsc2U7XG5cbmZ1bmN0aW9uIHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKHY6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBpbmNsdWRlVmlld1Byb3ZpZGVycztcbiAgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB2O1xuICByZXR1cm4gb2xkVmFsdWU7XG59XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuY29uc3QgQkxPT01fTUFTSyA9IEJMT09NX1NJWkUgLSAxO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvckluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZSBpbmplY3RvciB3aGVyZSB0aGlzIHRva2VuIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdFZpZXcgVGhlIFRWaWV3IGZvciB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJzXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRva2VuIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIHRWaWV3OiBUVmlldywgdHlwZTogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0VGVtcGxhdGVQYXNzIHRvIGJlIHRydWUnKTtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAmIEJMT09NX01BU0s7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhIGFzIG51bWJlcltdO1xuXG4gIGlmIChiNykge1xuICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA3XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNl0gfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDRdIHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgM10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDJdIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDFdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXhdIHw9IG1hc2spKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaG9zdFZpZXcgVmlldyB3aGVyZSB0aGUgbm9kZSBpcyBzdG9yZWRcbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBob3N0Vmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gaG9zdFZpZXcubGVuZ3RoO1xuICAgIGluc2VydEJsb29tKHRWaWV3LmRhdGEsIHROb2RlKTsgIC8vIGZvdW5kYXRpb24gZm9yIG5vZGUgYmxvb21cbiAgICBpbnNlcnRCbG9vbShob3N0VmlldywgbnVsbCk7ICAgICAvLyBmb3VuZGF0aW9uIGZvciBjdW11bGF0aXZlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuYmx1ZXByaW50LCBudWxsKTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLmZsYWdzID09PSAwIHx8IHROb2RlLmZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgJ2V4cGVjdGVkIHROb2RlLmZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgY29uc3QgcGFyZW50VmlldzogTFZpZXdEYXRhID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgaG9zdFZpZXcpO1xuXG4gIGNvbnN0IGluamVjdG9ySW5kZXggPSB0Tm9kZS5pbmplY3RvckluZGV4O1xuXG4gIC8vIElmIGEgcGFyZW50IGluamVjdG9yIGNhbid0IGJlIGZvdW5kLCBpdHMgbG9jYXRpb24gaXMgc2V0IHRvIC0xLlxuICAvLyBJbiB0aGF0IGNhc2UsIHdlIGRvbid0IG5lZWQgdG8gc2V0IHVwIGEgY3VtdWxhdGl2ZSBibG9vbVxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jKSkge1xuICAgIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhIGFzIGFueTtcbiAgICAvLyBDcmVhdGVzIGEgY3VtdWxhdGl2ZSBibG9vbSBmaWx0ZXIgdGhhdCBtZXJnZXMgdGhlIHBhcmVudCdzIGJsb29tIGZpbHRlclxuICAgIC8vIGFuZCBpdHMgb3duIGN1bXVsYXRpdmUgYmxvb20gKHdoaWNoIGNvbnRhaW5zIHRva2VucyBmb3IgYWxsIGFuY2VzdG9ycylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIGldID0gcGFyZW50Vmlld1twYXJlbnRJbmRleCArIGldIHwgcGFyZW50RGF0YVtwYXJlbnRJbmRleCArIGldO1xuICAgIH1cbiAgfVxuXG4gIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdID0gcGFyZW50TG9jO1xuICByZXR1cm4gaW5qZWN0b3JJbmRleDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Qmxvb20oYXJyOiBhbnlbXSwgZm9vdGVyOiBUTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgYXJyLnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgZm9vdGVyKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBudW1iZXIge1xuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIC8vIElmIHRoZSBpbmplY3RvciBpbmRleCBpcyB0aGUgc2FtZSBhcyBpdHMgcGFyZW50J3MgaW5qZWN0b3IgaW5kZXgsIHRoZW4gdGhlIGluZGV4IGhhcyBiZWVuXG4gICAgICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICAgICAgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkgfHxcbiAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5qZWN0b3IgaW5kZXggbWlnaHQgZXhpc3QgYnV0IHRoZSBwYXJlbnQgdmFsdWVzXG4gICAgICAvLyBtaWdodCBub3QgaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgeWV0IGZvciB0aGlzIGluc3RhbmNlXG4gICAgICBob3N0Vmlld1t0Tm9kZS5pbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKlxuICogUmV0dXJucyBhIGNvbWJpbmF0aW9uIG9mIG51bWJlciBvZiBgVmlld0RhdGFgIHdlIGhhdmUgdG8gZ28gdXAgYW5kIGluZGV4IGluIHRoYXQgYFZpZXdkYXRhYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3RGF0YSk6IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4IGFzIGFueTsgIC8vIFZpZXdPZmZzZXQgaXMgMCwgQWNyb3NzSG9zdEJvdW5kYXJ5IGlzIDBcbiAgfVxuXG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgc28gdGhpcyBsb29wIHdpbGwgYmUgc2tpcHBlZCwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnRcbiAgLy8gdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZCA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLlxuICBsZXQgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdO1xuICBsZXQgdmlld09mZnNldCA9IDE7XG4gIHdoaWxlIChob3N0VE5vZGUgJiYgaG9zdFROb2RlLmluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgdmlldyA9IHZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBob3N0VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV0gITtcbiAgICB2aWV3T2Zmc2V0Kys7XG4gIH1cbiAgY29uc3QgYWNyb3NzSG9zdEJvdW5kYXJ5ID0gaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/XG4gICAgICBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncy5BY3Jvc3NIb3N0Qm91bmRhcnkgOlxuICAgICAgMDtcblxuICByZXR1cm4gaG9zdFROb2RlID9cbiAgICAgIGhvc3RUTm9kZS5pbmplY3RvckluZGV4IHwgKHZpZXdPZmZzZXQgPDwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSB8XG4gICAgICAgICAgYWNyb3NzSG9zdEJvdW5kYXJ5IDpcbiAgICAgIC0xIGFzIGFueTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIHR5cGUgb3IgYW4gaW5qZWN0aW9uIHRva2VuIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhblxuICogaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdHlwZSBvciB0aGUgaW5qZWN0aW9uIHRva2VuIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB2aWV3OiBMVmlld0RhdGEsIHRva2VuOiBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUeXBlPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoaW5qZWN0b3JJbmRleCwgdmlld1tUVklFV10sIHRva2VuKTtcbn1cblxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlSW1wbCh0Tm9kZTogVE5vZGUsIGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBOb2RlSW5qZWN0b3JzID0+IE1vZHVsZUluamVjdG9yLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXdEYXRhOiBMVmlld0RhdGEsXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0LFxuICAgIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW4pO1xuICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAvLyBzbyBqdXN0IGNhbGwgdGhlIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIGl0LlxuICBpZiAodHlwZW9mIGJsb29tSGFzaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNvbnN0IHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBzYXZlVmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICAgIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGUsIGxWaWV3RGF0YSk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX1gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0VE5vZGVBbmRWaWV3RGF0YShzYXZlUHJldmlvdXNPclBhcmVudFROb2RlLCBzYXZlVmlld0RhdGEpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgYmxvb21IYXNoID09ICdudW1iZXInKSB7XG4gICAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSB0b2tlbiB3aGljaCBjb3VsZCBiZSBpbiBOb2RlSW5qZWN0b3IuXG5cbiAgICAvLyBBIHJlZmVyZW5jZSB0byB0aGUgcHJldmlvdXMgaW5qZWN0b3IgVFZpZXcgdGhhdCB3YXMgZm91bmQgd2hpbGUgY2xpbWJpbmcgdGhlIGVsZW1lbnQgaW5qZWN0b3JcbiAgICAvLyB0cmVlLiBUaGlzIGlzIHVzZWQgdG8ga25vdyBpZiB2aWV3UHJvdmlkZXJzIGNhbiBiZSBhY2Nlc3NlZCBvbiB0aGUgY3VycmVudCBpbmplY3Rvci5cbiAgICBsZXQgcHJldmlvdXNUVmlldzogVFZpZXd8bnVsbCA9IG51bGw7XG4gICAgbGV0IGluamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBsVmlld0RhdGEpO1xuICAgIGxldCBwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gTk9fUEFSRU5UX0lOSkVDVE9SO1xuXG4gICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3Rvciwgc3RhcnQgYnkgc2VhcmNoaW5nIHRoZSBwYXJlbnQgaW5qZWN0b3IuXG4gICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpIHtcbiAgICAgIHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JJbmRleCA9PT0gLTEgPyBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBsVmlld0RhdGEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlld0RhdGFbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG5cbiAgICAgIGlmICghc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzLCBwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcHJldmlvdXNUVmlldyA9IGxWaWV3RGF0YVtUVklFV107XG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXdEYXRhID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlld0RhdGEpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZVxuICAgIC8vICppc24ndCogYSBtYXRjaC5cbiAgICB3aGlsZSAoaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIHBhcmVudExvY2F0aW9uID0gbFZpZXdEYXRhW2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuXG4gICAgICAvLyBDaGVjayB0aGUgY3VycmVudCBpbmplY3Rvci4gSWYgaXQgbWF0Y2hlcywgc2VlIGlmIGl0IGNvbnRhaW5zIHRva2VuLlxuICAgICAgY29uc3QgdFZpZXcgPSBsVmlld0RhdGFbVFZJRVddO1xuICAgICAgaWYgKGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCB0Vmlldy5kYXRhKSkge1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAvLyB0aGUgaW5zdGFuY2UuXG4gICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPVxuICAgICAgICAgICAgc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihpbmplY3RvckluZGV4LCBsVmlld0RhdGEsIHRva2VuLCBwcmV2aW91c1RWaWV3KTtcbiAgICAgICAgaWYgKGluc3RhbmNlICE9PSBOT1RfRk9VTkQpIHtcbiAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIHBhcmVudExvY2F0aW9uKSAmJlxuICAgICAgICAgIGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCBsVmlld0RhdGEpKSB7XG4gICAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICAgIHByZXZpb3VzVFZpZXcgPSB0VmlldztcbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICBsVmlld0RhdGEgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3RGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBJZiB3ZSBzaG91bGQgbm90IHNlYXJjaCBwYXJlbnQgT1IgSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBkb2VzIG5vdCBoYXZlIHRoZVxuICAgICAgICAvLyBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlIHdlIGNhbiBnaXZlIHVwIG9uIHRyYXZlcnNpbmcgdXAgdG8gZmluZCB0aGUgc3BlY2lmaWNcbiAgICAgICAgLy8gaW5qZWN0b3IuXG4gICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoKGZsYWdzICYgKEluamVjdEZsYWdzLlNlbGYgfCBJbmplY3RGbGFncy5Ib3N0KSkgPT09IDApIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGxWaWV3RGF0YVtJTkpFQ1RPUl07XG4gICAgaWYgKG1vZHVsZUluamVjdG9yKSB7XG4gICAgICByZXR1cm4gbW9kdWxlSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgfVxuICB9XG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSB7XG4gICAgcmV0dXJuIG5vdEZvdW5kVmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBOb2RlSW5qZWN0b3I6IE5PVF9GT1VORCBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbiAgfVxufVxuXG5jb25zdCBOT1RfRk9VTkQgPSB7fTtcblxuZnVuY3Rpb24gc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIGluamVjdG9yVmlldzogTFZpZXdEYXRhLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgcHJldmlvdXNUVmlldzogVFZpZXcgfCBudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUVmlldyA9IGluamVjdG9yVmlld1tUVklFV107XG4gIGNvbnN0IHROb2RlID0gY3VycmVudFRWaWV3LmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSBhcyBUTm9kZTtcbiAgY29uc3Qgbm9kZUZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIGNvbnN0IG5vZGVQcm92aWRlckluZGV4ZXMgPSB0Tm9kZS5wcm92aWRlckluZGV4ZXM7XG4gIGNvbnN0IHRJbmplY3RhYmxlcyA9IGN1cnJlbnRUVmlldy5kYXRhO1xuICAvLyBGaXJzdCwgd2Ugc3RlcCB0aHJvdWdoIHByb3ZpZGVyc1xuICBsZXQgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA9IGZhbHNlO1xuICAvLyBXZSBuZWVkIHRvIGRldGVybWluZSBpZiB2aWV3IHByb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgYnkgdGhlIHN0YXJ0aW5nIGVsZW1lbnQuXG4gIC8vIEl0IGhhcHBlbnMgaW4gMiBjYXNlczpcbiAgLy8gMSkgT24gdGhlIGluaXRpYWwgZWxlbWVudCBpbmplY3RvciAsIGlmIHdlIGFyZSBpbnN0YW50aWF0aW5nIGEgdG9rZW4gd2hpY2ggY2FuIHNlZSB0aGVcbiAgLy8gdmlld1Byb3ZpZGVycyBvZiB0aGUgY29tcG9uZW50IG9mIHRoYXQgZWxlbWVudC4gU3VjaCB0b2tlbiBhcmU6XG4gIC8vIC0gdGhlIGNvbXBvbmVudCBpdHNlbGYgKGJ1dCBub3Qgb3RoZXIgZGlyZWN0aXZlcylcbiAgLy8gLSB2aWV3UHJvdmlkZXJzIHRva2VucyBvZiB0aGUgY29tcG9uZW50IChidXQgbm90IHByb3ZpZGVycyB0b2tlbnMpXG4gIC8vIDIpIFVwcGVyIGluIHRoZSBlbGVtZW50IGluamVjdG9yIHRyZWUsIGlmIHRoZSBzdGFydGluZyBlbGVtZW50IGlzIGFjdHVhbGx5IGluIHRoZSB2aWV3IG9mXG4gIC8vIHRoZSBjdXJyZW50IGVsZW1lbnQuIFRvIGRldGVybWluZSB0aGlzLCB3ZSB0cmFjayB0aGUgdHJhbnNpdGlvbiBvZiB2aWV3IGR1cmluZyB0aGUgY2xpbWIsXG4gIC8vIGFuZCBjaGVjayB0aGUgaG9zdCBub2RlIG9mIHRoZSBjdXJyZW50IHZpZXcgdG8gaWRlbnRpZnkgY29tcG9uZW50IHZpZXdzLlxuICBpZiAocHJldmlvdXNUVmlldyA9PSBudWxsICYmIGlzQ29tcG9uZW50KHROb2RlKSAmJiBpbmNsdWRlVmlld1Byb3ZpZGVycyB8fFxuICAgICAgcHJldmlvdXNUVmlldyAhPSBudWxsICYmIHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmXG4gICAgICAgICAgKGN1cnJlbnRUVmlldy5ub2RlID09IG51bGwgfHwgY3VycmVudFRWaWV3Lm5vZGUgIS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkpIHtcbiAgICBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID0gdHJ1ZTtcbiAgfVxuICBjb25zdCBzdGFydEluamVjdGFibGVzID0gbm9kZVByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBzdGFydERpcmVjdGl2ZXMgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gIGNvbnN0IGNwdFZpZXdQcm92aWRlcnNDb3VudCA9XG4gICAgICBub2RlUHJvdmlkZXJJbmRleGVzID4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0O1xuICBjb25zdCBzdGFydGluZ0luZGV4ID1cbiAgICAgIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPyBzdGFydEluamVjdGFibGVzIDogc3RhcnRJbmplY3RhYmxlcyArIGNwdFZpZXdQcm92aWRlcnNDb3VudDtcbiAgY29uc3QgZGlyZWN0aXZlQ291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcbiAgZm9yIChsZXQgaSA9IHN0YXJ0aW5nSW5kZXg7IGkgPCBzdGFydERpcmVjdGl2ZXMgKyBkaXJlY3RpdmVDb3VudDsgaSsrKSB7XG4gICAgY29uc3QgcHJvdmlkZXJUb2tlbk9yRGVmID0gdEluamVjdGFibGVzW2ldIGFzIEluamVjdGlvblRva2VuPGFueT58IFR5cGU8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGkgPCBzdGFydERpcmVjdGl2ZXMgJiYgdG9rZW4gPT09IHByb3ZpZGVyVG9rZW5PckRlZiB8fFxuICAgICAgICBpID49IHN0YXJ0RGlyZWN0aXZlcyAmJiAocHJvdmlkZXJUb2tlbk9yRGVmIGFzIERpcmVjdGl2ZURlZjxhbnk+KS50eXBlID09PSB0b2tlbikge1xuICAgICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKHRJbmplY3RhYmxlcywgaW5qZWN0b3JWaWV3LCBpLCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gTk9UX0ZPVU5EO1xufVxuXG4vKipcbiogUmV0cmlldmUgb3IgaW5zdGFudGlhdGUgdGhlIGluamVjdGFibGUgZnJvbSB0aGUgYGxEYXRhYCBhdCBwYXJ0aWN1bGFyIGBpbmRleGAuXG4qXG4qIFRoaXMgZnVuY3Rpb24gY2hlY2tzIHRvIHNlZSBpZiB0aGUgdmFsdWUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQgYW5kIGlmIHNvIHJldHVybnMgdGhlXG4qIGNhY2hlZCBgaW5qZWN0YWJsZWAuIE90aGVyd2lzZSBpZiBpdCBkZXRlY3RzIHRoYXQgdGhlIHZhbHVlIGlzIHN0aWxsIGEgZmFjdG9yeSBpdFxuKiBpbnN0YW50aWF0ZXMgdGhlIGBpbmplY3RhYmxlYCBhbmQgY2FjaGVzIHRoZSB2YWx1ZS5cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXdEYXRhLCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVEVsZW1lbnROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbERhdGFbaW5kZXhdO1xuICBpZiAoaXNGYWN0b3J5KHZhbHVlKSkge1xuICAgIGNvbnN0IGZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnkgPSB2YWx1ZTtcbiAgICBpZiAoZmFjdG9yeS5yZXNvbHZpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2lyY3VsYXIgZGVwIGZvciAke3N0cmluZ2lmeSh0RGF0YVtpbmRleF0pfWApO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzID0gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMoZmFjdG9yeS5jYW5TZWVWaWV3UHJvdmlkZXJzKTtcbiAgICBmYWN0b3J5LnJlc29sdmluZyA9IHRydWU7XG4gICAgbGV0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb247XG4gICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkge1xuICAgICAgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKGZhY3RvcnkuaW5qZWN0SW1wbCk7XG4gICAgfVxuICAgIGNvbnN0IHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBzYXZlVmlld0RhdGEgPSBnZXRWaWV3RGF0YSgpO1xuICAgIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGUsIGxEYXRhKTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBsRGF0YVtpbmRleF0gPSBmYWN0b3J5LmZhY3RvcnkobnVsbCwgdERhdGEsIGxEYXRhLCB0Tm9kZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChmYWN0b3J5LmluamVjdEltcGwpIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgICAgc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMocHJldmlvdXNJbmNsdWRlVmlld1Byb3ZpZGVycyk7XG4gICAgICBmYWN0b3J5LnJlc29sdmluZyA9IGZhbHNlO1xuICAgICAgc2V0VE5vZGVBbmRWaWV3RGF0YShzYXZlUHJldmlvdXNPclBhcmVudFROb2RlLCBzYXZlVmlld0RhdGEpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogbnVtYmVyfEZ1bmN0aW9ufFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJyA/IHRva2VuSWQgJiBCTE9PTV9NQVNLIDogdG9rZW5JZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzVG9rZW4oXG4gICAgYmxvb21IYXNoOiBudW1iZXIsIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlld0RhdGEgfCBURGF0YSkge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tSGFzaDtcbiAgY29uc3QgYjcgPSBibG9vbUhhc2ggJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tSGFzaCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21IYXNoICYgMHgyMDtcblxuICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gIGxldCB2YWx1ZTogbnVtYmVyO1xuXG4gIGlmIChiNykge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDddIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA2XSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDVdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA0XSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgM10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDJdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleF0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICByZXR1cm4gISEodmFsdWUgJiBtYXNrKTtcbn1cblxuLyoqIFJldHVybnMgdHJ1ZSBpZiBmbGFncyBwcmV2ZW50IHBhcmVudCBpbmplY3RvciBmcm9tIGJlaW5nIHNlYXJjaGVkIGZvciB0b2tlbnMgKi9cbmZ1bmN0aW9uIHNob3VsZFNlYXJjaFBhcmVudChmbGFnczogSW5qZWN0RmxhZ3MsIHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24pOiBib29sZWFufFxuICAgIG51bWJlciB7XG4gIHJldHVybiAhKFxuICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8XG4gICAgICAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmXG4gICAgICAgKChwYXJlbnRMb2NhdGlvbiBhcyBhbnkgYXMgbnVtYmVyKSAmIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkFjcm9zc0hvc3RCb3VuZGFyeSkpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEluamVjdG9yKCkge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSwgZ2V0Vmlld0RhdGEoKSk7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHByaXZhdGUgX2luamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge1xuICAgIHRoaXMuX2luamVjdG9ySW5kZXggPSBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoX3ROb2RlLCBfaG9zdFZpZXcpO1xuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnkpOiBhbnkge1xuICAgIHNldFROb2RlQW5kVmlld0RhdGEodGhpcy5fdE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9ob3N0VmlldywgdG9rZW4pO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlOiBUeXBlPFQ+fCBudWxsKSA9PiBUKXxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWY8VD4odHlwZUFueSkgfHwgZ2V0RGlyZWN0aXZlRGVmPFQ+KHR5cGVBbnkpIHx8XG4gICAgICBnZXRQaXBlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdGFibGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gIGlmICghZGVmIHx8IGRlZi5mYWN0b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGVmLmZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmhlcml0ZWRGYWN0b3J5PFQ+KHR5cGU6IFR5cGU8YW55Pik6ICh0eXBlOiBUeXBlPFQ+KSA9PiBUIHtcbiAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yIGFzIFR5cGU8YW55PjtcbiAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlPZjxUPihwcm90byk7XG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiAodCkgPT4gbmV3IHQoKTtcbiAgfVxufVxuIl19