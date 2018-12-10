/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { getInjectableDef, getInjectorDef } from '../di/defs';
import { InjectFlags, injectRootLimpMode, setInjectImplementation } from '../di/injector_compatibility';
import { assertDefined, assertEqual } from './assert';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { NG_ELEMENT_ID } from './fields';
import { NO_PARENT_INJECTOR, PARENT_INJECTOR, TNODE, isFactory } from './interfaces/injector';
import { DECLARATION_VIEW, HOST_NODE, INJECTOR, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { getLView, getPreviousOrParentTNode, setTNodeAndViewData } from './state';
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
    var id = typeof type !== 'string' ? type[NG_ELEMENT_ID] : type.charCodeAt(0) || 0;
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
        ngDevMode && assertEqual(tNode.flags === 0 || tNode.flags === 1 /* isComponent */, true, 'expected tNode.flags to not be initialized');
    }
    var parentLoc = getParentInjectorLocation(tNode, hostView);
    var parentIndex = getParentInjectorIndex(parentLoc);
    var parentLView = getParentInjectorView(parentLoc, hostView);
    var injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (hasParentInjector(parentLoc)) {
        var parentData = parentLView[TVIEW].data;
        // Creates a cumulative bloom filter that merges the parent's bloom filter
        // and its own cumulative bloom (which contains tokens for all ancestors)
        for (var i = 0; i < 8; i++) {
            hostView[injectorIndex + i] = parentLView[parentIndex + i] | parentData[parentIndex + i];
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
    return null;
}
/**
 * Returns the value associated to the given token from the NodeInjectors => ModuleInjector.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @param tNode The Node where the search for the injector should start
 * @param lView The `LView` that contains the `tNode`
 * @param token The token to look for
 * @param flags Injection flags
 * @param notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @returns the value from the injector, `null` when not found, or `notFoundValue` if provided
 */
export function getOrCreateInjectable(tNode, lView, token, flags, notFoundValue) {
    if (flags === void 0) { flags = InjectFlags.Default; }
    var bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function') {
        var savePreviousOrParentTNode = getPreviousOrParentTNode();
        var saveLView = getLView();
        setTNodeAndViewData(tNode, lView);
        try {
            var value = bloomHash();
            if (value == null && !(flags & InjectFlags.Optional)) {
                throw new Error("No provider for " + stringify(token));
            }
            else {
                return value;
            }
        }
        finally {
            setTNodeAndViewData(savePreviousOrParentTNode, saveLView);
        }
    }
    else if (typeof bloomHash == 'number') {
        // If the token has a bloom hash, then it is a token which could be in NodeInjector.
        // A reference to the previous injector TView that was found while climbing the element injector
        // tree. This is used to know if viewProviders can be accessed on the current injector.
        var previousTView = null;
        var injectorIndex = getInjectorIndex(tNode, lView);
        var parentLocation = NO_PARENT_INJECTOR;
        // If we should skip this injector, or if there is no injector on this node, start by searching
        // the parent injector.
        if (injectorIndex === -1 || flags & InjectFlags.SkipSelf) {
            parentLocation = injectorIndex === -1 ? getParentInjectorLocation(tNode, lView) :
                lView[injectorIndex + PARENT_INJECTOR];
            if (!shouldSearchParent(flags, parentLocation)) {
                injectorIndex = -1;
            }
            else {
                previousTView = lView[TVIEW];
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
        }
        // Traverse up the injector tree until we find a potential match or until we know there
        // *isn't* a match.
        while (injectorIndex !== -1) {
            parentLocation = lView[injectorIndex + PARENT_INJECTOR];
            // Check the current injector. If it matches, see if it contains token.
            var tView = lView[TVIEW];
            if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
                // At this point, we have an injector which *may* contain the token, so we step through
                // the providers and directives associated with the injector's corresponding node to get
                // the instance.
                var instance = searchTokensOnInjector(injectorIndex, lView, token, previousTView);
                if (instance !== NOT_FOUND) {
                    return instance;
                }
            }
            if (shouldSearchParent(flags, parentLocation) &&
                bloomHasToken(bloomHash, injectorIndex, lView)) {
                // The def wasn't found anywhere on this node, so it was a false positive.
                // Traverse up the tree and continue searching.
                previousTView = tView;
                injectorIndex = getParentInjectorIndex(parentLocation);
                lView = getParentInjectorView(parentLocation, lView);
            }
            else {
                // If we should not search parent OR If the ancestor bloom filter value does not have the
                // bit corresponding to the directive we can give up on traversing up to find the specific
                // injector.
                injectorIndex = -1;
            }
        }
    }
    if (flags & InjectFlags.Optional && notFoundValue === undefined) {
        // This must be set or the NullInjector will throw for optional deps
        notFoundValue = null;
    }
    if ((flags & (InjectFlags.Self | InjectFlags.Host)) === 0) {
        var moduleInjector = lView[INJECTOR];
        if (moduleInjector) {
            return moduleInjector.get(token, notFoundValue, flags & InjectFlags.Optional);
        }
        else {
            return injectRootLimpMode(token, notFoundValue, flags & InjectFlags.Optional);
        }
    }
    if (flags & InjectFlags.Optional) {
        return notFoundValue;
    }
    else {
        throw new Error("NodeInjector: NOT_FOUND [" + stringify(token) + "]");
    }
}
var NOT_FOUND = {};
function searchTokensOnInjector(injectorIndex, lView, token, previousTView) {
    var currentTView = lView[TVIEW];
    var tNode = currentTView.data[injectorIndex + TNODE];
    // First, we need to determine if view providers can be accessed by the starting element.
    // There are two possibities
    var canAccessViewProviders = previousTView == null ?
        // 1) This is the first invocation `previousTView == null` which means that we are at the
        // `TNode` of where injector is starting to look. In such a case the only time we are allowed
        // to look into the ViewProviders is if:
        // - we are on a component
        // - AND the injector set `includeViewProviders` to true (implying that the token can see
        // ViewProviders because it is the Component or a Service which itself was declared in
        // ViewProviders)
        (isComponent(tNode) && includeViewProviders) :
        // 2) `previousTView != null` which means that we are now walking across the parent nodes.
        // In such a case we are only allowed to look into the ViewProviders if:
        // - We just crossed from child View to Parent View `previousTView != currentTView`
        // - AND the parent TNode is an Element.
        // This means that we just came from the Component's View and therefore are allowed to see
        // into the ViewProviders.
        (previousTView != currentTView && (tNode.type === 3 /* Element */));
    var injectableIdx = locateDirectiveOrProvider(tNode, lView, token, canAccessViewProviders);
    if (injectableIdx !== null) {
        return getNodeInjectable(currentTView.data, lView, injectableIdx, tNode);
    }
    else {
        return NOT_FOUND;
    }
}
/**
 * Searches for the given token among the node's directives and providers.
 *
 * @param tNode TNode on which directives are present.
 * @param lView The view we are currently processing
 * @param token Provider token or type of a directive to look for.
 * @param canAccessViewProviders Whether view providers should be considered.
 * @returns Index of a found directive or provider, or null when none found.
 */
export function locateDirectiveOrProvider(tNode, lView, token, canAccessViewProviders) {
    var tView = lView[TVIEW];
    var nodeFlags = tNode.flags;
    var nodeProviderIndexes = tNode.providerIndexes;
    var tInjectables = tView.data;
    var injectablesStart = nodeProviderIndexes & 65535 /* ProvidersStartIndexMask */;
    var directivesStart = tNode.directiveStart;
    var directiveEnd = tNode.directiveEnd;
    var cptViewProvidersCount = nodeProviderIndexes >> 16 /* CptViewProvidersCountShift */;
    var startingIndex = canAccessViewProviders ? injectablesStart : injectablesStart + cptViewProvidersCount;
    for (var i = startingIndex; i < directiveEnd; i++) {
        var providerTokenOrDef = tInjectables[i];
        if (i < directivesStart && token === providerTokenOrDef ||
            i >= directivesStart && providerTokenOrDef.type === token) {
            return i;
        }
    }
    return null;
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
        var saveLView = getLView();
        setTNodeAndViewData(tNode, lData);
        try {
            value = lData[index] = factory.factory(null, tData, lData, tNode);
        }
        finally {
            if (factory.injectImpl)
                setInjectImplementation(previousInjectImplementation);
            setIncludeViewProviders(previousIncludeViewProviders);
            factory.resolving = false;
            setTNodeAndViewData(savePreviousOrParentTNode, saveLView);
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
    if (typeof token === 'string') {
        return token.charCodeAt(0) || 0;
    }
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
    return !(flags & InjectFlags.Self ||
        (flags & InjectFlags.Host &&
            (parentLocation & 32768 /* AcrossHostBoundary */)));
}
export function injectInjector() {
    var tNode = getPreviousOrParentTNode();
    return new NodeInjector(tNode, getLView());
}
var NodeInjector = /** @class */ (function () {
    function NodeInjector(_tNode, _lView) {
        this._tNode = _tNode;
        this._lView = _lView;
    }
    NodeInjector.prototype.get = function (token, notFoundValue) {
        return getOrCreateInjectable(this._tNode, this._lView, token, undefined, notFoundValue);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFHNUQsT0FBTyxFQUFDLFdBQVcsRUFBRSxrQkFBa0IsRUFBRSx1QkFBdUIsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBR3RHLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3BELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxRSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBRXZDLE9BQU8sRUFBQyxrQkFBa0IsRUFBdUIsZUFBZSxFQUEyRCxLQUFLLEVBQUUsU0FBUyxFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFFMUssT0FBTyxFQUFDLGdCQUFnQixFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQWdCLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQ3BHLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQUMsUUFBUSxFQUFFLHdCQUF3QixFQUFFLG1CQUFtQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBQ2hGLE9BQU8sRUFBQyxzQkFBc0IsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBRWhIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQW1DRztBQUNILElBQUksb0JBQW9CLEdBQUcsS0FBSyxDQUFDO0FBRWpDLFNBQVMsdUJBQXVCLENBQUMsQ0FBVTtJQUN6QyxJQUFNLFFBQVEs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QUFDLElBQUssT0FBQSxJQUFJLENBQUMsRUFBRSxFQUFQLENBQU8sQ0FBQztLQUN2QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2RlZnMnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIGluamVjdFJvb3RMaW1wTW9kZSwgc2V0SW5qZWN0SW1wbGVtZW50YXRpb259IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7Tk9fUEFSRU5UX0lOSkVDVE9SLCBOb2RlSW5qZWN0b3JGYWN0b3J5LCBQQVJFTlRfSU5KRUNUT1IsIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MsIFROT0RFLCBpc0ZhY3Rvcnl9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlldywgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0TFZpZXcsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2V0VE5vZGVBbmRWaWV3RGF0YX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3IsIGlzQ29tcG9uZW50LCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5cbi8qKlxuICogRGVmaW5lcyBpZiB0aGUgY2FsbCB0byBgaW5qZWN0YCBzaG91bGQgaW5jbHVkZSBgdmlld1Byb3ZpZGVyc2AgaW4gaXRzIHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHdlIHRyeSB0byBpbnN0YW50aWF0ZSBhIGNvbXBvbmVudC4gVGhpcyB2YWx1ZSBpcyByZXNldCBpblxuICogYGdldE5vZGVJbmplY3RhYmxlYCB0byBhIHZhbHVlIHdoaWNoIG1hdGNoZXMgdGhlIGRlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoZSB0b2tlbiBhYm91dCB0byBiZVxuICogaW5zdGFudGlhdGVkLiBUaGlzIGlzIGRvbmUgc28gdGhhdCBpZiB3ZSBhcmUgaW5qZWN0aW5nIGEgdG9rZW4gd2hpY2ggd2FzIGRlY2xhcmVkIG91dHNpZGUgb2ZcbiAqIGB2aWV3UHJvdmlkZXJzYCB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcHVsbCBgdmlld1Byb3ZpZGVyc2AgaW4uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogU3RyaW5nKSB7fVxuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBNeVNlcnZpY2UsXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICdwcm92aWRlcnMnIH1cbiAqICAgXVxuICogICB2aWV3UHJvdmlkZXJzOiBbXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICd2aWV3UHJvdmlkZXJzJ31cbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IobXlTZXJ2aWNlOiBNeVNlcnZpY2UsIHZhbHVlOiBTdHJpbmcpIHtcbiAqICAgICAvLyBXZSBleHBlY3QgdGhhdCBDb21wb25lbnQgY2FuIHNlZSBpbnRvIGB2aWV3UHJvdmlkZXJzYC5cbiAqICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ3ZpZXdQcm92aWRlcnMnKTtcbiAqICAgICAvLyBgTXlTZXJ2aWNlYCB3YXMgbm90IGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCBoZW5jZSBpdCBjYW4ndCBzZWUgaXQuXG4gKiAgICAgZXhwZWN0KG15U2VydmljZS52YWx1ZSkudG9FcXVhbCgncHJvdmlkZXJzJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBgYGBcbiAqL1xubGV0IGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gZmFsc2U7XG5cbmZ1bmN0aW9uIHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKHY6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBpbmNsdWRlVmlld1Byb3ZpZGVycztcbiAgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB2O1xuICByZXR1cm4gb2xkVmFsdWU7XG59XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuY29uc3QgQkxPT01fTUFTSyA9IEJMT09NX1NJWkUgLSAxO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvckluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZSBpbmplY3RvciB3aGVyZSB0aGlzIHRva2VuIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdFZpZXcgVGhlIFRWaWV3IGZvciB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJzXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRva2VuIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIHRWaWV3OiBUVmlldywgdHlwZTogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzLCB0cnVlLCAnZXhwZWN0ZWQgZmlyc3RUZW1wbGF0ZVBhc3MgdG8gYmUgdHJ1ZScpO1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPVxuICAgICAgdHlwZW9mIHR5cGUgIT09ICdzdHJpbmcnID8gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA6IHR5cGUuY2hhckNvZGVBdCgwKSB8fCAwO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGEgYXMgbnVtYmVyW107XG5cbiAgaWYgKGI3KSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDddIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA2XSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA1XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNF0gfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAzXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMl0gfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleF0gfD0gbWFzaykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBob3N0VmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgaG9zdFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGhvc3RWaWV3Lmxlbmd0aDtcbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5kYXRhLCB0Tm9kZSk7ICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20oaG9zdFZpZXcsIG51bGwpOyAgICAgLy8gZm91bmRhdGlvbiBmb3IgY3VtdWxhdGl2ZSBibG9vbVxuICAgIGluc2VydEJsb29tKHRWaWV3LmJsdWVwcmludCwgbnVsbCk7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICAgICAgICAgICB0Tm9kZS5mbGFncyA9PT0gMCB8fCB0Tm9kZS5mbGFncyA9PT0gVE5vZGVGbGFncy5pc0NvbXBvbmVudCwgdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgICdleHBlY3RlZCB0Tm9kZS5mbGFncyB0byBub3QgYmUgaW5pdGlhbGl6ZWQnKTtcbiAgfVxuXG4gIGNvbnN0IHBhcmVudExvYyA9IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odE5vZGUsIGhvc3RWaWV3KTtcbiAgY29uc3QgcGFyZW50SW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvYyk7XG4gIGNvbnN0IHBhcmVudExWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgaG9zdFZpZXcpO1xuXG4gIGNvbnN0IGluamVjdG9ySW5kZXggPSB0Tm9kZS5pbmplY3RvckluZGV4O1xuXG4gIC8vIElmIGEgcGFyZW50IGluamVjdG9yIGNhbid0IGJlIGZvdW5kLCBpdHMgbG9jYXRpb24gaXMgc2V0IHRvIC0xLlxuICAvLyBJbiB0aGF0IGNhc2UsIHdlIGRvbid0IG5lZWQgdG8gc2V0IHVwIGEgY3VtdWxhdGl2ZSBibG9vbVxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jKSkge1xuICAgIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRMVmlld1tUVklFV10uZGF0YSBhcyBhbnk7XG4gICAgLy8gQ3JlYXRlcyBhIGN1bXVsYXRpdmUgYmxvb20gZmlsdGVyIHRoYXQgbWVyZ2VzIHRoZSBwYXJlbnQncyBibG9vbSBmaWx0ZXJcbiAgICAvLyBhbmQgaXRzIG93biBjdW11bGF0aXZlIGJsb29tICh3aGljaCBjb250YWlucyB0b2tlbnMgZm9yIGFsbCBhbmNlc3RvcnMpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCA4OyBpKyspIHtcbiAgICAgIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBpXSA9IHBhcmVudExWaWV3W3BhcmVudEluZGV4ICsgaV0gfCBwYXJlbnREYXRhW3BhcmVudEluZGV4ICsgaV07XG4gICAgfVxuICB9XG5cbiAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPSBwYXJlbnRMb2M7XG4gIHJldHVybiBpbmplY3RvckluZGV4O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRCbG9vbShhcnI6IGFueVtdLCBmb290ZXI6IFROb2RlIHwgbnVsbCk6IHZvaWQge1xuICBhcnIucHVzaCgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCBmb290ZXIpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvckluZGV4KHROb2RlOiBUTm9kZSwgaG9zdFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgaG9zdFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICpcbiAqIFJldHVybnMgYSBjb21iaW5hdGlvbiBvZiBudW1iZXIgb2YgYFZpZXdEYXRhYCB3ZSBoYXZlIHRvIGdvIHVwIGFuZCBpbmRleCBpbiB0aGF0IGBWaWV3ZGF0YWBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odE5vZGU6IFROb2RlLCB2aWV3OiBMVmlldyk6IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4IGFzIGFueTsgIC8vIFZpZXdPZmZzZXQgaXMgMCwgQWNyb3NzSG9zdEJvdW5kYXJ5IGlzIDBcbiAgfVxuXG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgc28gdGhpcyBsb29wIHdpbGwgYmUgc2tpcHBlZCwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnRcbiAgLy8gdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZCA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLlxuICBsZXQgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdO1xuICBsZXQgdmlld09mZnNldCA9IDE7XG4gIHdoaWxlIChob3N0VE5vZGUgJiYgaG9zdFROb2RlLmluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgdmlldyA9IHZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBob3N0VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV0gITtcbiAgICB2aWV3T2Zmc2V0Kys7XG4gIH1cbiAgY29uc3QgYWNyb3NzSG9zdEJvdW5kYXJ5ID0gaG9zdFROb2RlICYmIGhvc3RUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCA/XG4gICAgICBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncy5BY3Jvc3NIb3N0Qm91bmRhcnkgOlxuICAgICAgMDtcblxuICByZXR1cm4gaG9zdFROb2RlID9cbiAgICAgIGhvc3RUTm9kZS5pbmplY3RvckluZGV4IHwgKHZpZXdPZmZzZXQgPDwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSB8XG4gICAgICAgICAgYWNyb3NzSG9zdEJvdW5kYXJ5IDpcbiAgICAgIC0xIGFzIGFueTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIHR5cGUgb3IgYW4gaW5qZWN0aW9uIHRva2VuIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhblxuICogaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdHlwZSBvciB0aGUgaW5qZWN0aW9uIHRva2VuIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB2aWV3OiBMVmlldywgdG9rZW46IEluamVjdGlvblRva2VuPGFueT58IFR5cGU8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChpbmplY3RvckluZGV4LCB2aWV3W1RWSUVXXSwgdG9rZW4pO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGVJbXBsKHROb2RlOiBUTm9kZSwgYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgTm9kZUluamVjdG9ycyA9PiBNb2R1bGVJbmplY3Rvci5cbiAqXG4gKiBMb29rIGZvciB0aGUgaW5qZWN0b3IgcHJvdmlkaW5nIHRoZSB0b2tlbiBieSB3YWxraW5nIHVwIHRoZSBub2RlIGluamVjdG9yIHRyZWUgYW5kIHRoZW5cbiAqIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIE5vZGUgd2hlcmUgdGhlIHNlYXJjaCBmb3IgdGhlIGluamVjdG9yIHNob3VsZCBzdGFydFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGB0Tm9kZWBcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEBwYXJhbSBub3RGb3VuZFZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gd2hlbiB0aGUgaW5qZWN0aW9uIGZsYWdzIGlzIGBJbmplY3RGbGFncy5PcHRpb25hbGBcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciwgYG51bGxgIHdoZW4gbm90IGZvdW5kLCBvciBgbm90Rm91bmRWYWx1ZWAgaWYgcHJvdmlkZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGxWaWV3OiBMVmlldyxcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQsXG4gICAgbm90Rm91bmRWYWx1ZT86IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbik7XG4gIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY29uc3Qgc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgIGNvbnN0IHNhdmVMVmlldyA9IGdldExWaWV3KCk7XG4gICAgc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZSwgbFZpZXcpO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGJsb29tSGFzaCgpO1xuICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeSh0b2tlbil9YCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFROb2RlQW5kVmlld0RhdGEoc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2F2ZUxWaWV3KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJsb29tSGFzaCA9PSAnbnVtYmVyJykge1xuICAgIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgdG9rZW4gd2hpY2ggY291bGQgYmUgaW4gTm9kZUluamVjdG9yLlxuXG4gICAgLy8gQSByZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIGluamVjdG9yIFRWaWV3IHRoYXQgd2FzIGZvdW5kIHdoaWxlIGNsaW1iaW5nIHRoZSBlbGVtZW50IGluamVjdG9yXG4gICAgLy8gdHJlZS4gVGhpcyBpcyB1c2VkIHRvIGtub3cgaWYgdmlld1Byb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgb24gdGhlIGN1cnJlbnQgaW5qZWN0b3IuXG4gICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICAgIGxldCBwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gTk9fUEFSRU5UX0lOSkVDVE9SO1xuXG4gICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3Rvciwgb3IgaWYgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlLCBzdGFydCBieSBzZWFyY2hpbmdcbiAgICAvLyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSB8fCBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcblxuICAgICAgaWYgKCFzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIHBhcmVudExvY2F0aW9uKSkge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aW91c1RWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlXG4gICAgLy8gKmlzbid0KiBhIG1hdGNoLlxuICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgcGFyZW50TG9jYXRpb24gPSBsVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcblxuICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgaW5qZWN0b3IuIElmIGl0IG1hdGNoZXMsIHNlZSBpZiBpdCBjb250YWlucyB0b2tlbi5cbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgaWYgKGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCB0Vmlldy5kYXRhKSkge1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAvLyB0aGUgaW5zdGFuY2UuXG4gICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPVxuICAgICAgICAgICAgc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihpbmplY3RvckluZGV4LCBsVmlldywgdG9rZW4sIHByZXZpb3VzVFZpZXcpO1xuICAgICAgICBpZiAoaW5zdGFuY2UgIT09IE5PVF9GT1VORCkge1xuICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKHNob3VsZFNlYXJjaFBhcmVudChmbGFncywgcGFyZW50TG9jYXRpb24pICYmXG4gICAgICAgICAgYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGxWaWV3KSkge1xuICAgICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgICBwcmV2aW91c1RWaWV3ID0gdFZpZXc7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHdlIHNob3VsZCBub3Qgc2VhcmNoIHBhcmVudCBPUiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGRvZXMgbm90IGhhdmUgdGhlXG4gICAgICAgIC8vIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUgd2UgY2FuIGdpdmUgdXAgb24gdHJhdmVyc2luZyB1cCB0byBmaW5kIHRoZSBzcGVjaWZpY1xuICAgICAgICAvLyBpbmplY3Rvci5cbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsICYmIG5vdEZvdW5kVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgb3IgdGhlIE51bGxJbmplY3RvciB3aWxsIHRocm93IGZvciBvcHRpb25hbCBkZXBzXG4gICAgbm90Rm91bmRWYWx1ZSA9IG51bGw7XG4gIH1cblxuICBpZiAoKGZsYWdzICYgKEluamVjdEZsYWdzLlNlbGYgfCBJbmplY3RGbGFncy5Ib3N0KSkgPT09IDApIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXTtcbiAgICBpZiAobW9kdWxlSW5qZWN0b3IpIHtcbiAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gaW5qZWN0Um9vdExpbXBNb2RlKHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICB9XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHtcbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGVJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xuICB9XG59XG5cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgcHJldmlvdXNUVmlldzogVFZpZXcgfCBudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBjdXJyZW50VFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgVE5PREVdIGFzIFROb2RlO1xuICAvLyBGaXJzdCwgd2UgbmVlZCB0byBkZXRlcm1pbmUgaWYgdmlldyBwcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIGJ5IHRoZSBzdGFydGluZyBlbGVtZW50LlxuICAvLyBUaGVyZSBhcmUgdHdvIHBvc3NpYml0aWVzXG4gIGNvbnN0IGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPSBwcmV2aW91c1RWaWV3ID09IG51bGwgP1xuICAgICAgLy8gMSkgVGhpcyBpcyB0aGUgZmlyc3QgaW52b2NhdGlvbiBgcHJldmlvdXNUVmlldyA9PSBudWxsYCB3aGljaCBtZWFucyB0aGF0IHdlIGFyZSBhdCB0aGVcbiAgICAgIC8vIGBUTm9kZWAgb2Ygd2hlcmUgaW5qZWN0b3IgaXMgc3RhcnRpbmcgdG8gbG9vay4gSW4gc3VjaCBhIGNhc2UgdGhlIG9ubHkgdGltZSB3ZSBhcmUgYWxsb3dlZFxuICAgICAgLy8gdG8gbG9vayBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzIGlzIGlmOlxuICAgICAgLy8gLSB3ZSBhcmUgb24gYSBjb21wb25lbnRcbiAgICAgIC8vIC0gQU5EIHRoZSBpbmplY3RvciBzZXQgYGluY2x1ZGVWaWV3UHJvdmlkZXJzYCB0byB0cnVlIChpbXBseWluZyB0aGF0IHRoZSB0b2tlbiBjYW4gc2VlXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzIGJlY2F1c2UgaXQgaXMgdGhlIENvbXBvbmVudCBvciBhIFNlcnZpY2Ugd2hpY2ggaXRzZWxmIHdhcyBkZWNsYXJlZCBpblxuICAgICAgLy8gVmlld1Byb3ZpZGVycylcbiAgICAgIChpc0NvbXBvbmVudCh0Tm9kZSkgJiYgaW5jbHVkZVZpZXdQcm92aWRlcnMpIDpcbiAgICAgIC8vIDIpIGBwcmV2aW91c1RWaWV3ICE9IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIG5vdyB3YWxraW5nIGFjcm9zcyB0aGUgcGFyZW50IG5vZGVzLlxuICAgICAgLy8gSW4gc3VjaCBhIGNhc2Ugd2UgYXJlIG9ubHkgYWxsb3dlZCB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaWY6XG4gICAgICAvLyAtIFdlIGp1c3QgY3Jvc3NlZCBmcm9tIGNoaWxkIFZpZXcgdG8gUGFyZW50IFZpZXcgYHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3YFxuICAgICAgLy8gLSBBTkQgdGhlIHBhcmVudCBUTm9kZSBpcyBhbiBFbGVtZW50LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGp1c3QgY2FtZSBmcm9tIHRoZSBDb21wb25lbnQncyBWaWV3IGFuZCB0aGVyZWZvcmUgYXJlIGFsbG93ZWQgdG8gc2VlXG4gICAgICAvLyBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzLlxuICAgICAgKHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkpO1xuXG4gIGNvbnN0IGluamVjdGFibGVJZHggPSBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCBsVmlldywgdG9rZW4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMpO1xuICBpZiAoaW5qZWN0YWJsZUlkeCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShjdXJyZW50VFZpZXcuZGF0YSwgbFZpZXcsIGluamVjdGFibGVJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIE5PVF9GT1VORDtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gYW1vbmcgdGhlIG5vZGUncyBkaXJlY3RpdmVzIGFuZCBwcm92aWRlcnMuXG4gKlxuICogQHBhcmFtIHROb2RlIFROb2RlIG9uIHdoaWNoIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQuXG4gKiBAcGFyYW0gbFZpZXcgVGhlIHZpZXcgd2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nXG4gKiBAcGFyYW0gdG9rZW4gUHJvdmlkZXIgdG9rZW4gb3IgdHlwZSBvZiBhIGRpcmVjdGl2ZSB0byBsb29rIGZvci5cbiAqIEBwYXJhbSBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzIFdoZXRoZXIgdmlldyBwcm92aWRlcnMgc2hvdWxkIGJlIGNvbnNpZGVyZWQuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBwcm92aWRlciwgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyPFQ+KFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVyczogYm9vbGVhbik6IG51bWJlcnxudWxsIHtcbiAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IG5vZGVGbGFncyA9IHROb2RlLmZsYWdzO1xuICBjb25zdCBub2RlUHJvdmlkZXJJbmRleGVzID0gdE5vZGUucHJvdmlkZXJJbmRleGVzO1xuICBjb25zdCB0SW5qZWN0YWJsZXMgPSB0Vmlldy5kYXRhO1xuXG4gIGNvbnN0IGluamVjdGFibGVzU3RhcnQgPSBub2RlUHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IGRpcmVjdGl2ZXNTdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGNwdFZpZXdQcm92aWRlcnNDb3VudCA9XG4gICAgICBub2RlUHJvdmlkZXJJbmRleGVzID4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0O1xuICBjb25zdCBzdGFydGluZ0luZGV4ID1cbiAgICAgIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPyBpbmplY3RhYmxlc1N0YXJ0IDogaW5qZWN0YWJsZXNTdGFydCArIGNwdFZpZXdQcm92aWRlcnNDb3VudDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0aW5nSW5kZXg7IGkgPCBkaXJlY3RpdmVFbmQ7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyVG9rZW5PckRlZiA9IHRJbmplY3RhYmxlc1tpXSBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUeXBlPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpIDwgZGlyZWN0aXZlc1N0YXJ0ICYmIHRva2VuID09PSBwcm92aWRlclRva2VuT3JEZWYgfHxcbiAgICAgICAgaSA+PSBkaXJlY3RpdmVzU3RhcnQgJiYgKHByb3ZpZGVyVG9rZW5PckRlZiBhcyBEaXJlY3RpdmVEZWY8YW55PikudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4qIFJldHJpZXZlIG9yIGluc3RhbnRpYXRlIHRoZSBpbmplY3RhYmxlIGZyb20gdGhlIGBsRGF0YWAgYXQgcGFydGljdWxhciBgaW5kZXhgLlxuKlxuKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlIHZhbHVlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkIGFuZCBpZiBzbyByZXR1cm5zIHRoZVxuKiBjYWNoZWQgYGluamVjdGFibGVgLiBPdGhlcndpc2UgaWYgaXQgZGV0ZWN0cyB0aGF0IHRoZSB2YWx1ZSBpcyBzdGlsbCBhIGZhY3RvcnkgaXRcbiogaW5zdGFudGlhdGVzIHRoZSBgaW5qZWN0YWJsZWAgYW5kIGNhY2hlcyB0aGUgdmFsdWUuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVJbmplY3RhYmxlKFxuICAgIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVEVsZW1lbnROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbERhdGFbaW5kZXhdO1xuICBpZiAoaXNGYWN0b3J5KHZhbHVlKSkge1xuICAgIGNvbnN0IGZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnkgPSB2YWx1ZTtcbiAgICBpZiAoZmFjdG9yeS5yZXNvbHZpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2lyY3VsYXIgZGVwIGZvciAke3N0cmluZ2lmeSh0RGF0YVtpbmRleF0pfWApO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzID0gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMoZmFjdG9yeS5jYW5TZWVWaWV3UHJvdmlkZXJzKTtcbiAgICBmYWN0b3J5LnJlc29sdmluZyA9IHRydWU7XG4gICAgbGV0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb247XG4gICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkge1xuICAgICAgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKGZhY3RvcnkuaW5qZWN0SW1wbCk7XG4gICAgfVxuICAgIGNvbnN0IHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBzYXZlTFZpZXcgPSBnZXRMVmlldygpO1xuICAgIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGUsIGxEYXRhKTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBsRGF0YVtpbmRleF0gPSBmYWN0b3J5LmZhY3RvcnkobnVsbCwgdERhdGEsIGxEYXRhLCB0Tm9kZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChmYWN0b3J5LmluamVjdEltcGwpIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgICAgc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMocHJldmlvdXNJbmNsdWRlVmlld1Byb3ZpZGVycyk7XG4gICAgICBmYWN0b3J5LnJlc29sdmluZyA9IGZhbHNlO1xuICAgICAgc2V0VE5vZGVBbmRWaWV3RGF0YShzYXZlUHJldmlvdXNPclBhcmVudFROb2RlLCBzYXZlTFZpZXcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBzdHJpbmcpOiBudW1iZXJ8XG4gICAgRnVuY3Rpb258dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdG9rZW4uY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJyA/IHRva2VuSWQgJiBCTE9PTV9NQVNLIDogdG9rZW5JZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzVG9rZW4oXG4gICAgYmxvb21IYXNoOiBudW1iZXIsIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlldyB8IFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuICBjb25zdCBiNyA9IGJsb29tSGFzaCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21IYXNoICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUhhc2ggJiAweDIwO1xuXG4gIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgaWYgKGI3KSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgN10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDZdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDRdKTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAzXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAxXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4XSk7XG4gIH1cblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgcGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbik6IGJvb2xlYW58XG4gICAgbnVtYmVyIHtcbiAgcmV0dXJuICEoXG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHxcbiAgICAgIChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiZcbiAgICAgICAoKHBhcmVudExvY2F0aW9uIGFzIGFueSBhcyBudW1iZXIpICYgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuQWNyb3NzSG9zdEJvdW5kYXJ5KSkpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3IoKSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIHVuZGVmaW5lZCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU6IFR5cGU8VD58IG51bGwpID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=