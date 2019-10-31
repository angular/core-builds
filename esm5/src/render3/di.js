/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../di/forward_ref';
import { injectRootLimpMode, setInjectImplementation } from '../di/injector_compatibility';
import { getInjectorDef } from '../di/interface/defs';
import { InjectFlags } from '../di/interface/injector';
import { assertDefined, assertEqual } from '../util/assert';
import { getFactoryDef } from './definition';
import { NG_ELEMENT_ID, NG_FACTORY_DEF } from './fields';
import { NO_PARENT_INJECTOR, PARENT_INJECTOR, TNODE, isFactory } from './interfaces/injector';
import { isComponentDef, isComponentHost } from './interfaces/type_checks';
import { DECLARATION_VIEW, INJECTOR, TVIEW, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { enterDI, leaveDI } from './state';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { stringifyForError } from './util/misc_utils';
import { getInitialStylingValue } from './util/styling_utils';
import { findComponentView } from './util/view_traversal_utils';
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
var includeViewProviders = true;
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
    }
    var parentLoc = getParentInjectorLocation(tNode, hostView);
    var injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (hasParentInjector(parentLoc)) {
        var parentIndex = getParentInjectorIndex(parentLoc);
        var parentLView = getParentInjectorView(parentLoc, hostView);
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
        return tNode.parent.injectorIndex; // ViewOffset is 0
    }
    // For most cases, the parent injector index can be found on the host node (e.g. for component
    // or container), so this loop will be skipped, but we must keep the loop here to support
    // the rarer case of deeply nested <ng-template> tags or inline views.
    var hostTNode = view[T_HOST];
    var viewOffset = 1;
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = view[DECLARATION_VIEW];
        hostTNode = view ? view[T_HOST] : null;
        viewOffset++;
    }
    return hostTNode ?
        hostTNode.injectorIndex | (viewOffset << 16 /* ViewOffsetShift */) :
        -1;
}
/**
 * Makes a type or an injection token public to the DI system by adding it to an
 * injector's bloom filter.
 *
 * @param di The node injector in which a directive will be added
 * @param token The type or the injection token to be made public
 */
export function diPublicInInjector(injectorIndex, tView, token) {
    bloomAdd(injectorIndex, tView, token);
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
 * MyComponent.ɵcmp = defineComponent({
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
    if (attrNameToInject === 'class') {
        return getInitialStylingValue(tNode.classes);
    }
    if (attrNameToInject === 'style') {
        return getInitialStylingValue(tNode.styles);
    }
    var attrs = tNode.attrs;
    if (attrs) {
        var attrsLength = attrs.length;
        var i = 0;
        while (i < attrsLength) {
            var value = attrs[i];
            // If we hit a `Bindings` or `Template` marker then we are done.
            if (isNameOnlyAttributeMarker(value))
                break;
            // Skip namespaced attributes
            if (value === 0 /* NamespaceURI */) {
                // we skip the next two values
                // as namespaced attributes looks like
                // [..., AttributeMarker.NamespaceURI, 'http://someuri.com/test', 'test:exist',
                // 'existValue', ...]
                i = i + 2;
            }
            else if (typeof value === 'number') {
                // Skip to the first value of the marked attribute.
                i++;
                while (i < attrsLength && typeof attrs[i] === 'string') {
                    i++;
                }
            }
            else if (value === attrNameToInject) {
                return attrs[i + 1];
            }
            else {
                i = i + 2;
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
 * This function patches `token` with `__NG_ELEMENT_ID__` which contains the id for the bloom
 * filter. Negative values are reserved for special objects.
 *   - `-1` is reserved for injecting `Injector` (implemented by `NodeInjector`)
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
    if (tNode) {
        var bloomHash = bloomHashBitOrFactory(token);
        // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
        // so just call the factory function to create it.
        if (typeof bloomHash === 'function') {
            enterDI(lView, tNode);
            try {
                var value = bloomHash();
                if (value == null && !(flags & InjectFlags.Optional)) {
                    throw new Error("No provider for " + stringifyForError(token) + "!");
                }
                else {
                    return value;
                }
            }
            finally {
                leaveDI();
            }
        }
        else if (typeof bloomHash == 'number') {
            if (bloomHash === -1) {
                // `-1` is a special value used to identify `Injector` types.
                return new NodeInjector(tNode, lView);
            }
            // If the token has a bloom hash, then it is a token which could be in NodeInjector.
            // A reference to the previous injector TView that was found while climbing the element
            // injector tree. This is used to know if viewProviders can be accessed on the current
            // injector.
            var previousTView = null;
            var injectorIndex = getInjectorIndex(tNode, lView);
            var parentLocation = NO_PARENT_INJECTOR;
            var hostTElementNode = flags & InjectFlags.Host ? findComponentView(lView)[T_HOST] : null;
            // If we should skip this injector, or if there is no injector on this node, start by
            // searching
            // the parent injector.
            if (injectorIndex === -1 || flags & InjectFlags.SkipSelf) {
                parentLocation = injectorIndex === -1 ? getParentInjectorLocation(tNode, lView) :
                    lView[injectorIndex + PARENT_INJECTOR];
                if (!shouldSearchParent(flags, false)) {
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
                    var instance = searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode);
                    if (instance !== NOT_FOUND) {
                        return instance;
                    }
                }
                if (shouldSearchParent(flags, lView[TVIEW].data[injectorIndex + TNODE] === hostTElementNode) &&
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
    }
    if (flags & InjectFlags.Optional && notFoundValue === undefined) {
        // This must be set or the NullInjector will throw for optional deps
        notFoundValue = null;
    }
    if ((flags & (InjectFlags.Self | InjectFlags.Host)) === 0) {
        var moduleInjector = lView[INJECTOR];
        // switch to `injectInjectorOnly` implementation for module injector, since module injector
        // should not have access to Component/Directive DI scope (that may happen through
        // `directiveInject` implementation)
        var previousInjectImplementation = setInjectImplementation(undefined);
        try {
            if (moduleInjector) {
                return moduleInjector.get(token, notFoundValue, flags & InjectFlags.Optional);
            }
            else {
                return injectRootLimpMode(token, notFoundValue, flags & InjectFlags.Optional);
            }
        }
        finally {
            setInjectImplementation(previousInjectImplementation);
        }
    }
    if (flags & InjectFlags.Optional) {
        return notFoundValue;
    }
    else {
        throw new Error("NodeInjector: NOT_FOUND [" + stringifyForError(token) + "]");
    }
}
var NOT_FOUND = {};
function searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode) {
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
        (isComponentHost(tNode) && includeViewProviders) :
        // 2) `previousTView != null` which means that we are now walking across the parent nodes.
        // In such a case we are only allowed to look into the ViewProviders if:
        // - We just crossed from child View to Parent View `previousTView != currentTView`
        // - AND the parent TNode is an Element.
        // This means that we just came from the Component's View and therefore are allowed to see
        // into the ViewProviders.
        (previousTView != currentTView && (tNode.type === 3 /* Element */));
    // This special case happens when there is a @host on the inject and when we are searching
    // on the host element node.
    var isHostSpecialCase = (flags & InjectFlags.Host) && hostTElementNode === tNode;
    var injectableIdx = locateDirectiveOrProvider(tNode, currentTView, token, canAccessViewProviders, isHostSpecialCase);
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
 * @param tView The tView we are currently processing
 * @param token Provider token or type of a directive to look for.
 * @param canAccessViewProviders Whether view providers should be considered.
 * @param isHostSpecialCase Whether the host special case applies.
 * @returns Index of a found directive or provider, or null when none found.
 */
export function locateDirectiveOrProvider(tNode, tView, token, canAccessViewProviders, isHostSpecialCase) {
    var nodeProviderIndexes = tNode.providerIndexes;
    var tInjectables = tView.data;
    var injectablesStart = nodeProviderIndexes & 65535 /* ProvidersStartIndexMask */;
    var directivesStart = tNode.directiveStart;
    var directiveEnd = tNode.directiveEnd;
    var cptViewProvidersCount = nodeProviderIndexes >> 16 /* CptViewProvidersCountShift */;
    var startingIndex = canAccessViewProviders ? injectablesStart : injectablesStart + cptViewProvidersCount;
    // When the host special case applies, only the viewProviders and the component are visible
    var endIndex = isHostSpecialCase ? injectablesStart + cptViewProvidersCount : directiveEnd;
    for (var i = startingIndex; i < endIndex; i++) {
        var providerTokenOrDef = tInjectables[i];
        if (i < directivesStart && token === providerTokenOrDef ||
            i >= directivesStart && providerTokenOrDef.type === token) {
            return i;
        }
    }
    if (isHostSpecialCase) {
        var dirDef = tInjectables[directivesStart];
        if (dirDef && isComponentDef(dirDef) && dirDef.type === token) {
            return directivesStart;
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
export function getNodeInjectable(tData, lView, index, tNode) {
    var value = lView[index];
    if (isFactory(value)) {
        var factory = value;
        if (factory.resolving) {
            throw new Error("Circular dep for " + stringifyForError(tData[index]));
        }
        var previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
        factory.resolving = true;
        var previousInjectImplementation = void 0;
        if (factory.injectImpl) {
            previousInjectImplementation = setInjectImplementation(factory.injectImpl);
        }
        enterDI(lView, tNode);
        try {
            value = lView[index] = factory.factory(undefined, tData, lView, tNode);
        }
        finally {
            if (factory.injectImpl)
                setInjectImplementation(previousInjectImplementation);
            setIncludeViewProviders(previousIncludeViewProviders);
            factory.resolving = false;
            leaveDI();
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
 *   When the returned value is negative then it represents special values such as `Injector`.
 */
export function bloomHashBitOrFactory(token) {
    ngDevMode && assertDefined(token, 'token must be defined');
    if (typeof token === 'string') {
        return token.charCodeAt(0) || 0;
    }
    var tokenId = token[NG_ELEMENT_ID];
    // Negative token IDs are used for special objects such as `Injector`
    return (typeof tokenId === 'number' && tokenId > 0) ? tokenId & BLOOM_MASK : tokenId;
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
function shouldSearchParent(flags, isFirstHostTNode) {
    return !(flags & InjectFlags.Self) && !(flags & InjectFlags.Host && isFirstHostTNode);
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
/**
 * @codeGenApi
 */
export function ɵɵgetFactoryOf(type) {
    var typeAny = type;
    if (isForwardRef(type)) {
        return (function () {
            var factory = ɵɵgetFactoryOf(resolveForwardRef(typeAny));
            return factory ? factory() : null;
        });
    }
    var factory = getFactoryDef(typeAny);
    if (factory === null) {
        var injectorDef = getInjectorDef(typeAny);
        factory = injectorDef && injectorDef.factory;
    }
    return factory || null;
}
/**
 * @codeGenApi
 */
export function ɵɵgetInheritedFactory(type) {
    var proto = Object.getPrototypeOf(type.prototype).constructor;
    var factory = proto[NG_FACTORY_DEF] || ɵɵgetFactoryOf(proto);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdsRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUQsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMzQyxPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUV2RCxPQUFPLEVBQUMsa0JBQWtCLEVBQXVCLGVBQWUsRUFBMkQsS0FBSyxFQUFFLFNBQVMsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBRTFLLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDekUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLFFBQVEsRUFBZ0IsS0FBSyxFQUFTLE1BQU0sRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2pHLE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RCxPQUFPLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUN6QyxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxvQkFBb0IsQ0FBQztBQUM3RCxPQUFPLEVBQUMsc0JBQXNCLEVBQUUscUJBQXFCLEVBQUUsaUJBQWlCLEVBQUMsTUFB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WDtJQUVELElBQUksT0FBTyxHQUFHLGFBQWEsQ0FBSSxPQUFPLENBQUMsQ0FBQztJQUN4QyxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsSUFBTSxXQUFXLEdBQUcsY0FBYyxDQUFJLE9BQU8sQ0FBQyxDQUFDO1FBQy9DLE9BQU8sR0FBRyxXQUFXLElBQUksV0FBVyxDQUFDLE9BQU8sQ0FBQztLQUM5QztJQUNELE9BQU8sT0FBTyxJQUFJLElBQUksQ0FBQztBQUN6QixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUksSUFBZTtJQUN0RCxJQUFNLEtBQUssR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxXQUF3QixDQUFDO0lBQzdFLElBQU0sT0FBTyxHQUFJLEtBQWEsQ0FBQyxjQUFjLENBQUMsSUFBSSxjQUFjLENBQUksS0FBSyxDQUFDLENBQUM7SUFDM0UsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sT0FBTyxDQUFDO0tBQ2hCO1NBQU07UUFDTCw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw0QkFBNEI7UUFDNUIsT0FBTyxVQUFDLENBQUMsSUFBSyxPQUFBLElBQUksQ0FBQyxFQUFFLEVBQVAsQ0FBTyxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtpbmplY3RSb290TGltcE1vZGUsIHNldEluamVjdEltcGxlbWVudGF0aW9ufSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Z2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7SW5qZWN0RmxhZ3N9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9pbmplY3Rvcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL2ludGVyZmFjZS90eXBlJztcbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0RXF1YWx9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcblxuaW1wb3J0IHtnZXRGYWN0b3J5RGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lELCBOR19GQUNUT1JZX0RFRn0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWYsIEZhY3RvcnlGbn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOT19QQVJFTlRfSU5KRUNUT1IsIE5vZGVJbmplY3RvckZhY3RvcnksIFBBUkVOVF9JTkpFQ1RPUiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncywgVE5PREUsIGlzRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVERpcmVjdGl2ZUhvc3ROb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlUHJvdmlkZXJJbmRleGVzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNDb21wb25lbnREZWYsIGlzQ29tcG9uZW50SG9zdH0gZnJvbSAnLi9pbnRlcmZhY2VzL3R5cGVfY2hlY2tzJztcbmltcG9ydCB7REVDTEFSQVRJT05fVklFVywgSU5KRUNUT1IsIExWaWV3LCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUX0hPU1R9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2VudGVyREksIGxlYXZlREl9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuaW1wb3J0IHtnZXRJbml0aWFsU3R5bGluZ1ZhbHVlfSBmcm9tICcuL3V0aWwvc3R5bGluZ191dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBEZWZpbmVzIGlmIHRoZSBjYWxsIHRvIGBpbmplY3RgIHNob3VsZCBpbmNsdWRlIGB2aWV3UHJvdmlkZXJzYCBpbiBpdHMgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGlzIHNldCB0byB0cnVlIHdoZW4gd2UgdHJ5IHRvIGluc3RhbnRpYXRlIGEgY29tcG9uZW50LiBUaGlzIHZhbHVlIGlzIHJlc2V0IGluXG4gKiBgZ2V0Tm9kZUluamVjdGFibGVgIHRvIGEgdmFsdWUgd2hpY2ggbWF0Y2hlcyB0aGUgZGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhlIHRva2VuIGFib3V0IHRvIGJlXG4gKiBpbnN0YW50aWF0ZWQuIFRoaXMgaXMgZG9uZSBzbyB0aGF0IGlmIHdlIGFyZSBpbmplY3RpbmcgYSB0b2tlbiB3aGljaCB3YXMgZGVjbGFyZWQgb3V0c2lkZSBvZlxuICogYHZpZXdQcm92aWRlcnNgIHdlIGRvbid0IGFjY2lkZW50YWxseSBwdWxsIGB2aWV3UHJvdmlkZXJzYCBpbi5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgTXlTZXJ2aWNlIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOiBTdHJpbmcpIHt9XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIE15U2VydmljZSxcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3Byb3ZpZGVycycgfVxuICogICBdXG4gKiAgIHZpZXdQcm92aWRlcnM6IFtcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3ZpZXdQcm92aWRlcnMnfVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihteVNlcnZpY2U6IE15U2VydmljZSwgdmFsdWU6IFN0cmluZykge1xuICogICAgIC8vIFdlIGV4cGVjdCB0aGF0IENvbXBvbmVudCBjYW4gc2VlIGludG8gYHZpZXdQcm92aWRlcnNgLlxuICogICAgIGV4cGVjdCh2YWx1ZSkudG9FcXVhbCgndmlld1Byb3ZpZGVycycpO1xuICogICAgIC8vIGBNeVNlcnZpY2VgIHdhcyBub3QgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIGhlbmNlIGl0IGNhbid0IHNlZSBpdC5cbiAqICAgICBleHBlY3QobXlTZXJ2aWNlLnZhbHVlKS50b0VxdWFsKCdwcm92aWRlcnMnKTtcbiAqICAgfVxuICogfVxuICpcbiAqIGBgYFxuICovXG5sZXQgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB0cnVlO1xuXG5mdW5jdGlvbiBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyh2OiBib29sZWFuKTogYm9vbGVhbiB7XG4gIGNvbnN0IG9sZFZhbHVlID0gaW5jbHVkZVZpZXdQcm92aWRlcnM7XG4gIGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gdjtcbiAgcmV0dXJuIG9sZFZhbHVlO1xufVxuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcbmNvbnN0IEJMT09NX01BU0sgPSBCTE9PTV9TSVpFIC0gMTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3JJbmRleCBUaGUgaW5kZXggb2YgdGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgdGhpcyB0b2tlbiBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHRWaWV3IFRoZSBUVmlldyBmb3IgdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyc1xuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0b2tlbiB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIHR5cGU6IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pnwgc3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcywgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0VGVtcGxhdGVQYXNzIHRvIGJlIHRydWUnKTtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID1cbiAgICAgIHR5cGVvZiB0eXBlICE9PSAnc3RyaW5nJyA/ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gOiB0eXBlLmNoYXJDb2RlQXQoMCkgfHwgMDtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAmIEJMT09NX01BU0s7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcbiAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhIGFzIG51bWJlcltdO1xuXG4gIGlmIChiNykge1xuICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA3XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNl0gfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDRdIHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgM10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDJdIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDFdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXhdIHw9IG1hc2spKTtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaG9zdFZpZXcgVmlldyB3aGVyZSB0aGUgbm9kZSBpcyBzdG9yZWRcbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IG51bWJlciB7XG4gIGNvbnN0IGV4aXN0aW5nSW5qZWN0b3JJbmRleCA9IGdldEluamVjdG9ySW5kZXgodE5vZGUsIGhvc3RWaWV3KTtcbiAgaWYgKGV4aXN0aW5nSW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gZXhpc3RpbmdJbmplY3RvckluZGV4O1xuICB9XG5cbiAgY29uc3QgdFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBob3N0Vmlldy5sZW5ndGg7XG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuZGF0YSwgdE5vZGUpOyAgLy8gZm91bmRhdGlvbiBmb3Igbm9kZSBibG9vbVxuICAgIGluc2VydEJsb29tKGhvc3RWaWV3LCBudWxsKTsgICAgIC8vIGZvdW5kYXRpb24gZm9yIGN1bXVsYXRpdmUgYmxvb21cbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5ibHVlcHJpbnQsIG51bGwpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICAvLyBJZiBhIHBhcmVudCBpbmplY3RvciBjYW4ndCBiZSBmb3VuZCwgaXRzIGxvY2F0aW9uIGlzIHNldCB0byAtMS5cbiAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBuZWVkIHRvIHNldCB1cCBhIGN1bXVsYXRpdmUgYmxvb21cbiAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvYykpIHtcbiAgICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgICBjb25zdCBwYXJlbnRMVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2MsIGhvc3RWaWV3KTtcbiAgICBjb25zdCBwYXJlbnREYXRhID0gcGFyZW50TFZpZXdbVFZJRVddLmRhdGEgYXMgYW55O1xuICAgIC8vIENyZWF0ZXMgYSBjdW11bGF0aXZlIGJsb29tIGZpbHRlciB0aGF0IG1lcmdlcyB0aGUgcGFyZW50J3MgYmxvb20gZmlsdGVyXG4gICAgLy8gYW5kIGl0cyBvd24gY3VtdWxhdGl2ZSBibG9vbSAod2hpY2ggY29udGFpbnMgdG9rZW5zIGZvciBhbGwgYW5jZXN0b3JzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgODsgaSsrKSB7XG4gICAgICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgaV0gPSBwYXJlbnRMVmlld1twYXJlbnRJbmRleCArIGldIHwgcGFyZW50RGF0YVtwYXJlbnRJbmRleCArIGldO1xuICAgIH1cbiAgfVxuXG4gIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdID0gcGFyZW50TG9jO1xuICByZXR1cm4gaW5qZWN0b3JJbmRleDtcbn1cblxuZnVuY3Rpb24gaW5zZXJ0Qmxvb20oYXJyOiBhbnlbXSwgZm9vdGVyOiBUTm9kZSB8IG51bGwpOiB2b2lkIHtcbiAgYXJyLnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgZm9vdGVyKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlldyk6IG51bWJlciB7XG4gIGlmICh0Tm9kZS5pbmplY3RvckluZGV4ID09PSAtMSB8fFxuICAgICAgLy8gSWYgdGhlIGluamVjdG9yIGluZGV4IGlzIHRoZSBzYW1lIGFzIGl0cyBwYXJlbnQncyBpbmplY3RvciBpbmRleCwgdGhlbiB0aGUgaW5kZXggaGFzIGJlZW5cbiAgICAgIC8vIGNvcGllZCBkb3duIGZyb20gdGhlIHBhcmVudCBub2RlLiBObyBpbmplY3RvciBoYXMgYmVlbiBjcmVhdGVkIHlldCBvbiB0aGlzIG5vZGUuXG4gICAgICAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5pbmplY3RvckluZGV4KSB8fFxuICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmplY3RvciBpbmRleCBtaWdodCBleGlzdCBidXQgdGhlIHBhcmVudCB2YWx1ZXNcbiAgICAgIC8vIG1pZ2h0IG5vdCBoYXZlIGJlZW4gY2FsY3VsYXRlZCB5ZXQgZm9yIHRoaXMgaW5zdGFuY2VcbiAgICAgIGhvc3RWaWV3W3ROb2RlLmluamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdID09IG51bGwpIHtcbiAgICByZXR1cm4gLTE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHROb2RlLmluamVjdG9ySW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgaW5kZXggb2YgdGhlIHBhcmVudCBpbmplY3Rvciwgd2l0aCBhIHZpZXcgb2Zmc2V0IGlmIGFwcGxpY2FibGUuIFVzZWQgdG8gc2V0IHRoZVxuICogcGFyZW50IGluamVjdG9yIGluaXRpYWxseS5cbiAqXG4gKiBSZXR1cm5zIGEgY29tYmluYXRpb24gb2YgbnVtYmVyIG9mIGBWaWV3RGF0YWAgd2UgaGF2ZSB0byBnbyB1cCBhbmQgaW5kZXggaW4gdGhhdCBgVmlld2RhdGFgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXcpOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24ge1xuICBpZiAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCBhcyBhbnk7ICAvLyBWaWV3T2Zmc2V0IGlzIDBcbiAgfVxuXG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGluZGV4IGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgc28gdGhpcyBsb29wIHdpbGwgYmUgc2tpcHBlZCwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnRcbiAgLy8gdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZCA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLlxuICBsZXQgaG9zdFROb2RlID0gdmlld1tUX0hPU1RdO1xuICBsZXQgdmlld09mZnNldCA9IDE7XG4gIHdoaWxlIChob3N0VE5vZGUgJiYgaG9zdFROb2RlLmluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgdmlldyA9IHZpZXdbREVDTEFSQVRJT05fVklFV10gITtcbiAgICBob3N0VE5vZGUgPSB2aWV3ID8gdmlld1tUX0hPU1RdIDogbnVsbDtcbiAgICB2aWV3T2Zmc2V0Kys7XG4gIH1cblxuICByZXR1cm4gaG9zdFROb2RlID9cbiAgICAgIGhvc3RUTm9kZS5pbmplY3RvckluZGV4IHwgKHZpZXdPZmZzZXQgPDwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSA6XG4gICAgICAtMSBhcyBhbnk7XG59XG5cbi8qKlxuICogTWFrZXMgYSB0eXBlIG9yIGFuIGluamVjdGlvbiB0b2tlbiBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW5cbiAqIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHR5cGUgb3IgdGhlIGluamVjdGlvbiB0b2tlbiB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0b2tlbjogSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHRWaWV3LCB0b2tlbik7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC7JtWNtcCA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZUltcGwodE5vZGU6IFROb2RlLCBhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBpZiAoYXR0ck5hbWVUb0luamVjdCA9PT0gJ2NsYXNzJykge1xuICAgIHJldHVybiBnZXRJbml0aWFsU3R5bGluZ1ZhbHVlKHROb2RlLmNsYXNzZXMpO1xuICB9XG4gIGlmIChhdHRyTmFtZVRvSW5qZWN0ID09PSAnc3R5bGUnKSB7XG4gICAgcmV0dXJuIGdldEluaXRpYWxTdHlsaW5nVmFsdWUodE5vZGUuc3R5bGVzKTtcbiAgfVxuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGNvbnN0IGF0dHJzTGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGF0dHJzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuXG4gICAgICAvLyBJZiB3ZSBoaXQgYSBgQmluZGluZ3NgIG9yIGBUZW1wbGF0ZWAgbWFya2VyIHRoZW4gd2UgYXJlIGRvbmUuXG4gICAgICBpZiAoaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcih2YWx1ZSkpIGJyZWFrO1xuXG4gICAgICAvLyBTa2lwIG5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgaWYgKHZhbHVlID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIHdlIHNraXAgdGhlIG5leHQgdHdvIHZhbHVlc1xuICAgICAgICAvLyBhcyBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMgbG9va3MgbGlrZVxuICAgICAgICAvLyBbLi4uLCBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJLCAnaHR0cDovL3NvbWV1cmkuY29tL3Rlc3QnLCAndGVzdDpleGlzdCcsXG4gICAgICAgIC8vICdleGlzdFZhbHVlJywgLi4uXVxuICAgICAgICBpID0gaSArIDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gU2tpcCB0byB0aGUgZmlyc3QgdmFsdWUgb2YgdGhlIG1hcmtlZCBhdHRyaWJ1dGUuXG4gICAgICAgIGkrKztcbiAgICAgICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCAmJiB0eXBlb2YgYXR0cnNbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IGkgKyAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIE5vZGVJbmplY3RvcnMgPT4gTW9kdWxlSW5qZWN0b3IuXG4gKlxuICogTG9vayBmb3IgdGhlIGluamVjdG9yIHByb3ZpZGluZyB0aGUgdG9rZW4gYnkgd2Fsa2luZyB1cCB0aGUgbm9kZSBpbmplY3RvciB0cmVlIGFuZCB0aGVuXG4gKiB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBwYXRjaGVzIGB0b2tlbmAgd2l0aCBgX19OR19FTEVNRU5UX0lEX19gIHdoaWNoIGNvbnRhaW5zIHRoZSBpZCBmb3IgdGhlIGJsb29tXG4gKiBmaWx0ZXIuIE5lZ2F0aXZlIHZhbHVlcyBhcmUgcmVzZXJ2ZWQgZm9yIHNwZWNpYWwgb2JqZWN0cy5cbiAqICAgLSBgLTFgIGlzIHJlc2VydmVkIGZvciBpbmplY3RpbmcgYEluamVjdG9yYCAoaW1wbGVtZW50ZWQgYnkgYE5vZGVJbmplY3RvcmApXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBOb2RlIHdoZXJlIHRoZSBzZWFyY2ggZm9yIHRoZSBpbmplY3RvciBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBgdE5vZGVgXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHRva2VuIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcGFyYW0gbm90Rm91bmRWYWx1ZSBUaGUgdmFsdWUgdG8gcmV0dXJuIHdoZW4gdGhlIGluamVjdGlvbiBmbGFncyBpcyBgSW5qZWN0RmxhZ3MuT3B0aW9uYWxgXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3IsIGBudWxsYCB3aGVuIG5vdCBmb3VuZCwgb3IgYG5vdEZvdW5kVmFsdWVgIGlmIHByb3ZpZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgbnVsbCwgbFZpZXc6IExWaWV3LFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCxcbiAgICBub3RGb3VuZFZhbHVlPzogYW55KTogVHxudWxsIHtcbiAgaWYgKHROb2RlKSB7XG4gICAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAgIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gICAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGVudGVyREkobFZpZXcsIHROb2RlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHByb3ZpZGVyIGZvciAke3N0cmluZ2lmeUZvckVycm9yKHRva2VuKX0hYCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBsZWF2ZURJKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYmxvb21IYXNoID09ICdudW1iZXInKSB7XG4gICAgICBpZiAoYmxvb21IYXNoID09PSAtMSkge1xuICAgICAgICAvLyBgLTFgIGlzIGEgc3BlY2lhbCB2YWx1ZSB1c2VkIHRvIGlkZW50aWZ5IGBJbmplY3RvcmAgdHlwZXMuXG4gICAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBsVmlldykgYXMgYW55O1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSB0b2tlbiB3aGljaCBjb3VsZCBiZSBpbiBOb2RlSW5qZWN0b3IuXG5cbiAgICAgIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmV2aW91cyBpbmplY3RvciBUVmlldyB0aGF0IHdhcyBmb3VuZCB3aGlsZSBjbGltYmluZyB0aGUgZWxlbWVudFxuICAgICAgLy8gaW5qZWN0b3IgdHJlZS4gVGhpcyBpcyB1c2VkIHRvIGtub3cgaWYgdmlld1Byb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgb24gdGhlIGN1cnJlbnRcbiAgICAgIC8vIGluamVjdG9yLlxuICAgICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgICAgbGV0IGluamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBsVmlldyk7XG4gICAgICBsZXQgcGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiA9IE5PX1BBUkVOVF9JTkpFQ1RPUjtcbiAgICAgIGxldCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZXxudWxsID1cbiAgICAgICAgICBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgPyBmaW5kQ29tcG9uZW50VmlldyhsVmlldylbVF9IT1NUXSA6IG51bGw7XG5cbiAgICAgIC8vIElmIHdlIHNob3VsZCBza2lwIHRoaXMgaW5qZWN0b3IsIG9yIGlmIHRoZXJlIGlzIG5vIGluamVjdG9yIG9uIHRoaXMgbm9kZSwgc3RhcnQgYnlcbiAgICAgIC8vIHNlYXJjaGluZ1xuICAgICAgLy8gdGhlIHBhcmVudCBpbmplY3Rvci5cbiAgICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSB8fCBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICAgIHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JJbmRleCA9PT0gLTEgPyBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBsVmlldykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG5cbiAgICAgICAgaWYgKCFzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIGZhbHNlKSkge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcmV2aW91c1RWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgICBsVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZVxuICAgICAgLy8gKmlzbid0KiBhIG1hdGNoLlxuICAgICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAgIHBhcmVudExvY2F0aW9uID0gbFZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgaW5qZWN0b3IuIElmIGl0IG1hdGNoZXMsIHNlZSBpZiBpdCBjb250YWlucyB0b2tlbi5cbiAgICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICAgIGlmIChibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgdFZpZXcuZGF0YSkpIHtcbiAgICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgICAvLyB0aGUgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0XG4gICAgICAgICAgLy8gdGhlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPSBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgICAgICAgICAgICBpbmplY3RvckluZGV4LCBsVmlldywgdG9rZW4sIHByZXZpb3VzVFZpZXcsIGZsYWdzLCBob3N0VEVsZW1lbnROb2RlKTtcbiAgICAgICAgICBpZiAoaW5zdGFuY2UgIT09IE5PVF9GT1VORCkge1xuICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2hvdWxkU2VhcmNoUGFyZW50KFxuICAgICAgICAgICAgICAgIGZsYWdzLCBsVmlld1tUVklFV10uZGF0YVtpbmplY3RvckluZGV4ICsgVE5PREVdID09PSBob3N0VEVsZW1lbnROb2RlKSAmJlxuICAgICAgICAgICAgYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGxWaWV3KSkge1xuICAgICAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAgICAgLy8gVHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgICAgICBwcmV2aW91c1RWaWV3ID0gdFZpZXc7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgd2Ugc2hvdWxkIG5vdCBzZWFyY2ggcGFyZW50IE9SIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgZG9lcyBub3QgaGF2ZSB0aGVcbiAgICAgICAgICAvLyBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlIHdlIGNhbiBnaXZlIHVwIG9uIHRyYXZlcnNpbmcgdXAgdG8gZmluZCB0aGUgc3BlY2lmaWNcbiAgICAgICAgICAvLyBpbmplY3Rvci5cbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCAmJiBub3RGb3VuZFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGlzIG11c3QgYmUgc2V0IG9yIHRoZSBOdWxsSW5qZWN0b3Igd2lsbCB0aHJvdyBmb3Igb3B0aW9uYWwgZGVwc1xuICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICB9XG5cbiAgaWYgKChmbGFncyAmIChJbmplY3RGbGFncy5TZWxmIHwgSW5qZWN0RmxhZ3MuSG9zdCkpID09PSAwKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gICAgLy8gc3dpdGNoIHRvIGBpbmplY3RJbmplY3Rvck9ubHlgIGltcGxlbWVudGF0aW9uIGZvciBtb2R1bGUgaW5qZWN0b3IsIHNpbmNlIG1vZHVsZSBpbmplY3RvclxuICAgIC8vIHNob3VsZCBub3QgaGF2ZSBhY2Nlc3MgdG8gQ29tcG9uZW50L0RpcmVjdGl2ZSBESSBzY29wZSAodGhhdCBtYXkgaGFwcGVuIHRocm91Z2hcbiAgICAvLyBgZGlyZWN0aXZlSW5qZWN0YCBpbXBsZW1lbnRhdGlvbilcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgaWYgKG1vZHVsZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkge1xuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm9kZUluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5Rm9yRXJyb3IodG9rZW4pfV1gKTtcbiAgfVxufVxuXG5jb25zdCBOT1RfRk9VTkQgPSB7fTtcblxuZnVuY3Rpb24gc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldywgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LFxuICAgIHByZXZpb3VzVFZpZXc6IFRWaWV3IHwgbnVsbCwgZmxhZ3M6IEluamVjdEZsYWdzLCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZSB8IG51bGwpIHtcbiAgY29uc3QgY3VycmVudFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IGN1cnJlbnRUVmlldy5kYXRhW2luamVjdG9ySW5kZXggKyBUTk9ERV0gYXMgVE5vZGU7XG4gIC8vIEZpcnN0LCB3ZSBuZWVkIHRvIGRldGVybWluZSBpZiB2aWV3IHByb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgYnkgdGhlIHN0YXJ0aW5nIGVsZW1lbnQuXG4gIC8vIFRoZXJlIGFyZSB0d28gcG9zc2liaXRpZXNcbiAgY29uc3QgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA9IHByZXZpb3VzVFZpZXcgPT0gbnVsbCA/XG4gICAgICAvLyAxKSBUaGlzIGlzIHRoZSBmaXJzdCBpbnZvY2F0aW9uIGBwcmV2aW91c1RWaWV3ID09IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIGF0IHRoZVxuICAgICAgLy8gYFROb2RlYCBvZiB3aGVyZSBpbmplY3RvciBpcyBzdGFydGluZyB0byBsb29rLiBJbiBzdWNoIGEgY2FzZSB0aGUgb25seSB0aW1lIHdlIGFyZSBhbGxvd2VkXG4gICAgICAvLyB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaXMgaWY6XG4gICAgICAvLyAtIHdlIGFyZSBvbiBhIGNvbXBvbmVudFxuICAgICAgLy8gLSBBTkQgdGhlIGluamVjdG9yIHNldCBgaW5jbHVkZVZpZXdQcm92aWRlcnNgIHRvIHRydWUgKGltcGx5aW5nIHRoYXQgdGhlIHRva2VuIGNhbiBzZWVcbiAgICAgIC8vIFZpZXdQcm92aWRlcnMgYmVjYXVzZSBpdCBpcyB0aGUgQ29tcG9uZW50IG9yIGEgU2VydmljZSB3aGljaCBpdHNlbGYgd2FzIGRlY2xhcmVkIGluXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzKVxuICAgICAgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkgJiYgaW5jbHVkZVZpZXdQcm92aWRlcnMpIDpcbiAgICAgIC8vIDIpIGBwcmV2aW91c1RWaWV3ICE9IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIG5vdyB3YWxraW5nIGFjcm9zcyB0aGUgcGFyZW50IG5vZGVzLlxuICAgICAgLy8gSW4gc3VjaCBhIGNhc2Ugd2UgYXJlIG9ubHkgYWxsb3dlZCB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaWY6XG4gICAgICAvLyAtIFdlIGp1c3QgY3Jvc3NlZCBmcm9tIGNoaWxkIFZpZXcgdG8gUGFyZW50IFZpZXcgYHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3YFxuICAgICAgLy8gLSBBTkQgdGhlIHBhcmVudCBUTm9kZSBpcyBhbiBFbGVtZW50LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGp1c3QgY2FtZSBmcm9tIHRoZSBDb21wb25lbnQncyBWaWV3IGFuZCB0aGVyZWZvcmUgYXJlIGFsbG93ZWQgdG8gc2VlXG4gICAgICAvLyBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzLlxuICAgICAgKHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkpO1xuXG4gIC8vIFRoaXMgc3BlY2lhbCBjYXNlIGhhcHBlbnMgd2hlbiB0aGVyZSBpcyBhIEBob3N0IG9uIHRoZSBpbmplY3QgYW5kIHdoZW4gd2UgYXJlIHNlYXJjaGluZ1xuICAvLyBvbiB0aGUgaG9zdCBlbGVtZW50IG5vZGUuXG4gIGNvbnN0IGlzSG9zdFNwZWNpYWxDYXNlID0gKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCkgJiYgaG9zdFRFbGVtZW50Tm9kZSA9PT0gdE5vZGU7XG5cbiAgY29uc3QgaW5qZWN0YWJsZUlkeCA9IGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIoXG4gICAgICB0Tm9kZSwgY3VycmVudFRWaWV3LCB0b2tlbiwgY2FuQWNjZXNzVmlld1Byb3ZpZGVycywgaXNIb3N0U3BlY2lhbENhc2UpO1xuICBpZiAoaW5qZWN0YWJsZUlkeCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShjdXJyZW50VFZpZXcuZGF0YSwgbFZpZXcsIGluamVjdGFibGVJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIE5PVF9GT1VORDtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gYW1vbmcgdGhlIG5vZGUncyBkaXJlY3RpdmVzIGFuZCBwcm92aWRlcnMuXG4gKlxuICogQHBhcmFtIHROb2RlIFROb2RlIG9uIHdoaWNoIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQuXG4gKiBAcGFyYW0gdFZpZXcgVGhlIHRWaWV3IHdlIGFyZSBjdXJyZW50bHkgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHRva2VuIFByb3ZpZGVyIHRva2VuIG9yIHR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcGFyYW0gY2FuQWNjZXNzVmlld1Byb3ZpZGVycyBXaGV0aGVyIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBjb25zaWRlcmVkLlxuICogQHBhcmFtIGlzSG9zdFNwZWNpYWxDYXNlIFdoZXRoZXIgdGhlIGhvc3Qgc3BlY2lhbCBjYXNlIGFwcGxpZXMuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBwcm92aWRlciwgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyPFQ+KFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnM6IGJvb2xlYW4sXG4gICAgaXNIb3N0U3BlY2lhbENhc2U6IGJvb2xlYW4gfCBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IG5vZGVQcm92aWRlckluZGV4ZXMgPSB0Tm9kZS5wcm92aWRlckluZGV4ZXM7XG4gIGNvbnN0IHRJbmplY3RhYmxlcyA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgaW5qZWN0YWJsZXNTdGFydCA9IG5vZGVQcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZGlyZWN0aXZlc1N0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgY3B0Vmlld1Byb3ZpZGVyc0NvdW50ID1cbiAgICAgIG5vZGVQcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG4gIGNvbnN0IHN0YXJ0aW5nSW5kZXggPVxuICAgICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA/IGluamVjdGFibGVzU3RhcnQgOiBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50O1xuICAvLyBXaGVuIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLCBvbmx5IHRoZSB2aWV3UHJvdmlkZXJzIGFuZCB0aGUgY29tcG9uZW50IGFyZSB2aXNpYmxlXG4gIGNvbnN0IGVuZEluZGV4ID0gaXNIb3N0U3BlY2lhbENhc2UgPyBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50IDogZGlyZWN0aXZlRW5kO1xuICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlclRva2VuT3JEZWYgPSB0SW5qZWN0YWJsZXNbaV0gYXMgSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+fCBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoaSA8IGRpcmVjdGl2ZXNTdGFydCAmJiB0b2tlbiA9PT0gcHJvdmlkZXJUb2tlbk9yRGVmIHx8XG4gICAgICAgIGkgPj0gZGlyZWN0aXZlc1N0YXJ0ICYmIChwcm92aWRlclRva2VuT3JEZWYgYXMgRGlyZWN0aXZlRGVmPGFueT4pLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgaWYgKGlzSG9zdFNwZWNpYWxDYXNlKSB7XG4gICAgY29uc3QgZGlyRGVmID0gdEluamVjdGFibGVzW2RpcmVjdGl2ZXNTdGFydF0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGRpckRlZiAmJiBpc0NvbXBvbmVudERlZihkaXJEZWYpICYmIGRpckRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgcmV0dXJuIGRpcmVjdGl2ZXNTdGFydDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuKiBSZXRyaWV2ZSBvciBpbnN0YW50aWF0ZSB0aGUgaW5qZWN0YWJsZSBmcm9tIHRoZSBgbERhdGFgIGF0IHBhcnRpY3VsYXIgYGluZGV4YC5cbipcbiogVGhpcyBmdW5jdGlvbiBjaGVja3MgdG8gc2VlIGlmIHRoZSB2YWx1ZSBoYXMgYWxyZWFkeSBiZWVuIGluc3RhbnRpYXRlZCBhbmQgaWYgc28gcmV0dXJucyB0aGVcbiogY2FjaGVkIGBpbmplY3RhYmxlYC4gT3RoZXJ3aXNlIGlmIGl0IGRldGVjdHMgdGhhdCB0aGUgdmFsdWUgaXMgc3RpbGwgYSBmYWN0b3J5IGl0XG4qIGluc3RhbnRpYXRlcyB0aGUgYGluamVjdGFibGVgIGFuZCBjYWNoZXMgdGhlIHZhbHVlLlxuKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROb2RlSW5qZWN0YWJsZShcbiAgICB0RGF0YTogVERhdGEsIGxWaWV3OiBMVmlldywgaW5kZXg6IG51bWJlciwgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZSk6IGFueSB7XG4gIGxldCB2YWx1ZSA9IGxWaWV3W2luZGV4XTtcbiAgaWYgKGlzRmFjdG9yeSh2YWx1ZSkpIHtcbiAgICBjb25zdCBmYWN0b3J5OiBOb2RlSW5qZWN0b3JGYWN0b3J5ID0gdmFsdWU7XG4gICAgaWYgKGZhY3RvcnkucmVzb2x2aW5nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYENpcmN1bGFyIGRlcCBmb3IgJHtzdHJpbmdpZnlGb3JFcnJvcih0RGF0YVtpbmRleF0pfWApO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzID0gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMoZmFjdG9yeS5jYW5TZWVWaWV3UHJvdmlkZXJzKTtcbiAgICBmYWN0b3J5LnJlc29sdmluZyA9IHRydWU7XG4gICAgbGV0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb247XG4gICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkge1xuICAgICAgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKGZhY3RvcnkuaW5qZWN0SW1wbCk7XG4gICAgfVxuICAgIGVudGVyREkobFZpZXcsIHROb2RlKTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBsVmlld1tpbmRleF0gPSBmYWN0b3J5LmZhY3RvcnkodW5kZWZpbmVkLCB0RGF0YSwgbFZpZXcsIHROb2RlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzKTtcbiAgICAgIGZhY3RvcnkucmVzb2x2aW5nID0gZmFsc2U7XG4gICAgICBsZWF2ZURJKCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICogICBXaGVuIHRoZSByZXR1cm5lZCB2YWx1ZSBpcyBuZWdhdGl2ZSB0aGVuIGl0IHJlcHJlc2VudHMgc3BlY2lhbCB2YWx1ZXMgc3VjaCBhcyBgSW5qZWN0b3JgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT58IHN0cmluZyk6IG51bWJlcnxcbiAgICBGdW5jdGlvbnx1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0b2tlbiwgJ3Rva2VuIG11c3QgYmUgZGVmaW5lZCcpO1xuICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0b2tlbi5jaGFyQ29kZUF0KDApIHx8IDA7XG4gIH1cbiAgY29uc3QgdG9rZW5JZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICAvLyBOZWdhdGl2ZSB0b2tlbiBJRHMgYXJlIHVzZWQgZm9yIHNwZWNpYWwgb2JqZWN0cyBzdWNoIGFzIGBJbmplY3RvcmBcbiAgcmV0dXJuICh0eXBlb2YgdG9rZW5JZCA9PT0gJ251bWJlcicgJiYgdG9rZW5JZCA+IDApID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihcbiAgICBibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3IHwgVERhdGEpIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUhhc2g7XG4gIGNvbnN0IGI3ID0gYmxvb21IYXNoICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUhhc2ggJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tSGFzaCAmIDB4MjA7XG5cbiAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICBpZiAoYjcpIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA3XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA1XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNF0pO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDNdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAyXSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDFdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXhdKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgcmV0dXJuICEhKHZhbHVlICYgbWFzayk7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgZmxhZ3MgcHJldmVudCBwYXJlbnQgaW5qZWN0b3IgZnJvbSBiZWluZyBzZWFyY2hlZCBmb3IgdG9rZW5zICovXG5mdW5jdGlvbiBzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3M6IEluamVjdEZsYWdzLCBpc0ZpcnN0SG9zdFROb2RlOiBib29sZWFuKTogYm9vbGVhbnxudW1iZXIge1xuICByZXR1cm4gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmIGlzRmlyc3RIb3N0VE5vZGUpO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGwsXG4gICAgICBwcml2YXRlIF9sVmlldzogTFZpZXcpIHt9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUodGhpcy5fdE5vZGUsIHRoaXMuX2xWaWV3LCB0b2tlbiwgdW5kZWZpbmVkLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Z2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6IEZhY3RvcnlGbjxUPnxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuXG4gIGlmIChpc0ZvcndhcmRSZWYodHlwZSkpIHtcbiAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSDJtcm1Z2V0RmFjdG9yeU9mPFQ+KHJlc29sdmVGb3J3YXJkUmVmKHR5cGVBbnkpKTtcbiAgICAgIHJldHVybiBmYWN0b3J5ID8gZmFjdG9yeSgpIDogbnVsbDtcbiAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBsZXQgZmFjdG9yeSA9IGdldEZhY3RvcnlEZWY8VD4odHlwZUFueSk7XG4gIGlmIChmYWN0b3J5ID09PSBudWxsKSB7XG4gICAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgICBmYWN0b3J5ID0gaW5qZWN0b3JEZWYgJiYgaW5qZWN0b3JEZWYuZmFjdG9yeTtcbiAgfVxuICByZXR1cm4gZmFjdG9yeSB8fCBudWxsO1xufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Z2V0SW5oZXJpdGVkRmFjdG9yeTxUPih0eXBlOiBUeXBlPGFueT4pOiAodHlwZTogVHlwZTxUPikgPT4gVCB7XG4gIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvciBhcyBUeXBlPGFueT47XG4gIGNvbnN0IGZhY3RvcnkgPSAocHJvdG8gYXMgYW55KVtOR19GQUNUT1JZX0RFRl0gfHwgybXJtWdldEZhY3RvcnlPZjxUPihwcm90byk7XG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiAodCkgPT4gbmV3IHQoKTtcbiAgfVxufVxuIl19