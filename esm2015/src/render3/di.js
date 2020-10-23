/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../di/forward_ref';
import { injectRootLimpMode, setInjectImplementation } from '../di/injector_compatibility';
import { getInjectorDef } from '../di/interface/defs';
import { InjectFlags } from '../di/interface/injector';
import { assertDefined, assertEqual, assertIndexInRange } from '../util/assert';
import { noSideEffects } from '../util/closure';
import { assertDirectiveDef, assertNodeInjector, assertTNodeForLView } from './assert';
import { getFactoryDef } from './definition';
import { throwCyclicDependencyError, throwProviderNotFoundError } from './errors';
import { NG_ELEMENT_ID, NG_FACTORY_DEF } from './fields';
import { registerPreOrderHooks } from './hooks';
import { isFactory, NO_PARENT_INJECTOR } from './interfaces/injector';
import { isComponentDef, isComponentHost } from './interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, INJECTOR, T_HOST, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { enterDI, leaveDI } from './state';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { stringifyForError } from './util/misc_utils';
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
let includeViewProviders = true;
export function setIncludeViewProviders(v) {
    const oldValue = includeViewProviders;
    includeViewProviders = v;
    return oldValue;
}
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
const BLOOM_SIZE = 256;
const BLOOM_MASK = BLOOM_SIZE - 1;
/** Counter used to generate unique IDs for directives. */
let nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injectorIndex The index of the node injector where this token should be registered
 * @param tView The TView for the injector's bloom filters
 * @param type The directive token to register
 */
export function bloomAdd(injectorIndex, tView, type) {
    ngDevMode && assertEqual(tView.firstCreatePass, true, 'expected firstCreatePass to be true');
    let id;
    if (typeof type === 'string') {
        id = type.charCodeAt(0) || 0;
    }
    else if (type.hasOwnProperty(NG_ELEMENT_ID)) {
        id = type[NG_ELEMENT_ID];
    }
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = type[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    const bloomBit = id & BLOOM_MASK;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomBit;
    // Use the raw bloomBit number to determine which bloom filter bucket we should check
    // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
    const b7 = bloomBit & 0x80;
    const b6 = bloomBit & 0x40;
    const b5 = bloomBit & 0x20;
    const tData = tView.data;
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
 * @param lView View where the node is stored
 * @returns Node injector
 */
export function getOrCreateNodeInjectorForNode(tNode, lView) {
    const existingInjectorIndex = getInjectorIndex(tNode, lView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    const tView = lView[TVIEW];
    if (tView.firstCreatePass) {
        tNode.injectorIndex = lView.length;
        insertBloom(tView.data, tNode); // foundation for node bloom
        insertBloom(lView, null); // foundation for cumulative bloom
        insertBloom(tView.blueprint, null);
    }
    const parentLoc = getParentInjectorLocation(tNode, lView);
    const injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (hasParentInjector(parentLoc)) {
        const parentIndex = getParentInjectorIndex(parentLoc);
        const parentLView = getParentInjectorView(parentLoc, lView);
        const parentData = parentLView[TVIEW].data;
        // Creates a cumulative bloom filter that merges the parent's bloom filter
        // and its own cumulative bloom (which contains tokens for all ancestors)
        for (let i = 0; i < 8 /* BLOOM_SIZE */; i++) {
            lView[injectorIndex + i] = parentLView[parentIndex + i] | parentData[parentIndex + i];
        }
    }
    lView[injectorIndex + 8 /* PARENT */] = parentLoc;
    return injectorIndex;
}
function insertBloom(arr, footer) {
    arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}
export function getInjectorIndex(tNode, lView) {
    if (tNode.injectorIndex === -1 ||
        // If the injector index is the same as its parent's injector index, then the index has been
        // copied down from the parent node. No injector has been created yet on this node.
        (tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) ||
        // After the first template pass, the injector index might exist but the parent values
        // might not have been calculated yet for this instance
        lView[tNode.injectorIndex + 8 /* PARENT */] === null) {
        return -1;
    }
    else {
        ngDevMode && assertIndexInRange(lView, tNode.injectorIndex);
        return tNode.injectorIndex;
    }
}
/**
 * Finds the index of the parent injector, with a view offset if applicable. Used to set the
 * parent injector initially.
 *
 * @returns Returns a number that is the combination of the number of LViews that we have to go up
 * to find the LView containing the parent inject AND the index of the injector within that LView.
 */
export function getParentInjectorLocation(tNode, lView) {
    if (tNode.parent && tNode.parent.injectorIndex !== -1) {
        // If we have a parent `TNode` and there is an injector associated with it we are done, because
        // the parent injector is within the current `LView`.
        return tNode.parent.injectorIndex; // ViewOffset is 0
    }
    // When parent injector location is computed it may be outside of the current view. (ie it could
    // be pointing to a declared parent location). This variable stores number of declaration parents
    // we need to walk up in order to find the parent injector location.
    let declarationViewOffset = 0;
    let parentTNode = null;
    let lViewCursor = lView;
    // The parent injector is not in the current `LView`. We will have to walk the declared parent
    // `LView` hierarchy and look for it. If we walk of the top, that means that there is no parent
    // `NodeInjector`.
    while (lViewCursor !== null) {
        // First determine the `parentTNode` location. The parent pointer differs based on `TView.type`.
        const tView = lViewCursor[TVIEW];
        const tViewType = tView.type;
        if (tViewType === 2 /* Embedded */) {
            ngDevMode &&
                assertDefined(tView.declTNode, 'Embedded TNodes should have declaration parents.');
            parentTNode = tView.declTNode;
        }
        else if (tViewType === 1 /* Component */) {
            // Components don't have `TView.declTNode` because each instance of component could be
            // inserted in different location, hence `TView.declTNode` is meaningless.
            parentTNode = lViewCursor[T_HOST];
        }
        else {
            ngDevMode && assertEqual(tView.type, 0 /* Root */, 'Root type expected');
            parentTNode = null;
        }
        if (parentTNode === null) {
            // If we have no parent, than we are done.
            return NO_PARENT_INJECTOR;
        }
        ngDevMode && parentTNode && assertTNodeForLView(parentTNode, lViewCursor[DECLARATION_VIEW]);
        // Every iteration of the loop requires that we go to the declared parent.
        declarationViewOffset++;
        lViewCursor = lViewCursor[DECLARATION_VIEW];
        if (parentTNode.injectorIndex !== -1) {
            // We found a NodeInjector which points to something.
            return (parentTNode.injectorIndex |
                (declarationViewOffset << 16 /* ViewOffsetShift */));
        }
    }
    return NO_PARENT_INJECTOR;
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
    ngDevMode && assertTNodeType(tNode, 12 /* AnyContainer */ | 3 /* AnyRNode */);
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    if (attrNameToInject === 'class') {
        return tNode.classes;
    }
    if (attrNameToInject === 'style') {
        return tNode.styles;
    }
    const attrs = tNode.attrs;
    if (attrs) {
        const attrsLength = attrs.length;
        let i = 0;
        while (i < attrsLength) {
            const value = attrs[i];
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
export function getOrCreateInjectable(tNode, lView, token, flags = InjectFlags.Default, notFoundValue) {
    if (tNode !== null) {
        const bloomHash = bloomHashBitOrFactory(token);
        // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
        // so just call the factory function to create it.
        if (typeof bloomHash === 'function') {
            enterDI(lView, tNode);
            try {
                const value = bloomHash();
                if (value == null && !(flags & InjectFlags.Optional)) {
                    throwProviderNotFoundError(token);
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
            let previousTView = null;
            let injectorIndex = getInjectorIndex(tNode, lView);
            let parentLocation = NO_PARENT_INJECTOR;
            let hostTElementNode = flags & InjectFlags.Host ? lView[DECLARATION_COMPONENT_VIEW][T_HOST] : null;
            // If we should skip this injector, or if there is no injector on this node, start by
            // searching the parent injector.
            if (injectorIndex === -1 || flags & InjectFlags.SkipSelf) {
                parentLocation = injectorIndex === -1 ? getParentInjectorLocation(tNode, lView) :
                    lView[injectorIndex + 8 /* PARENT */];
                if (parentLocation === NO_PARENT_INJECTOR || !shouldSearchParent(flags, false)) {
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
                ngDevMode && assertNodeInjector(lView, injectorIndex);
                // Check the current injector. If it matches, see if it contains token.
                const tView = lView[TVIEW];
                ngDevMode &&
                    assertTNodeForLView(tView.data[injectorIndex + 8 /* TNODE */], lView);
                if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
                    // At this point, we have an injector which *may* contain the token, so we step through
                    // the providers and directives associated with the injector's corresponding node to get
                    // the instance.
                    const instance = searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode);
                    if (instance !== NOT_FOUND) {
                        return instance;
                    }
                }
                parentLocation = lView[injectorIndex + 8 /* PARENT */];
                if (parentLocation !== NO_PARENT_INJECTOR &&
                    shouldSearchParent(flags, lView[TVIEW].data[injectorIndex + 8 /* TNODE */] === hostTElementNode) &&
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
        const moduleInjector = lView[INJECTOR];
        // switch to `injectInjectorOnly` implementation for module injector, since module injector
        // should not have access to Component/Directive DI scope (that may happen through
        // `directiveInject` implementation)
        const previousInjectImplementation = setInjectImplementation(undefined);
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
        throwProviderNotFoundError(token, 'NodeInjector');
    }
}
const NOT_FOUND = {};
function searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode) {
    const currentTView = lView[TVIEW];
    const tNode = currentTView.data[injectorIndex + 8 /* TNODE */];
    // First, we need to determine if view providers can be accessed by the starting element.
    // There are two possibilities
    const canAccessViewProviders = previousTView == null ?
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
        (previousTView != currentTView && ((tNode.type & 3 /* AnyRNode */) !== 0));
    // This special case happens when there is a @host on the inject and when we are searching
    // on the host element node.
    const isHostSpecialCase = (flags & InjectFlags.Host) && hostTElementNode === tNode;
    const injectableIdx = locateDirectiveOrProvider(tNode, currentTView, token, canAccessViewProviders, isHostSpecialCase);
    if (injectableIdx !== null) {
        return getNodeInjectable(lView, currentTView, injectableIdx, tNode);
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
    const nodeProviderIndexes = tNode.providerIndexes;
    const tInjectables = tView.data;
    const injectablesStart = nodeProviderIndexes & 1048575 /* ProvidersStartIndexMask */;
    const directivesStart = tNode.directiveStart;
    const directiveEnd = tNode.directiveEnd;
    const cptViewProvidersCount = nodeProviderIndexes >> 20 /* CptViewProvidersCountShift */;
    const startingIndex = canAccessViewProviders ? injectablesStart : injectablesStart + cptViewProvidersCount;
    // When the host special case applies, only the viewProviders and the component are visible
    const endIndex = isHostSpecialCase ? injectablesStart + cptViewProvidersCount : directiveEnd;
    for (let i = startingIndex; i < endIndex; i++) {
        const providerTokenOrDef = tInjectables[i];
        if (i < directivesStart && token === providerTokenOrDef ||
            i >= directivesStart && providerTokenOrDef.type === token) {
            return i;
        }
    }
    if (isHostSpecialCase) {
        const dirDef = tInjectables[directivesStart];
        if (dirDef && isComponentDef(dirDef) && dirDef.type === token) {
            return directivesStart;
        }
    }
    return null;
}
/**
 * Retrieve or instantiate the injectable from the `LView` at particular `index`.
 *
 * This function checks to see if the value has already been instantiated and if so returns the
 * cached `injectable`. Otherwise if it detects that the value is still a factory it
 * instantiates the `injectable` and caches the value.
 */
export function getNodeInjectable(lView, tView, index, tNode) {
    let value = lView[index];
    const tData = tView.data;
    if (isFactory(value)) {
        const factory = value;
        if (factory.resolving) {
            throwCyclicDependencyError(stringifyForError(tData[index]));
        }
        const previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
        factory.resolving = true;
        const previousInjectImplementation = factory.injectImpl ? setInjectImplementation(factory.injectImpl) : null;
        enterDI(lView, tNode);
        try {
            value = lView[index] = factory.factory(undefined, tData, lView, tNode);
            // This code path is hit for both directives and providers.
            // For perf reasons, we want to avoid searching for hooks on providers.
            // It does no harm to try (the hooks just won't exist), but the extra
            // checks are unnecessary and this is a hot path. So we check to see
            // if the index of the dependency is in the directive range for this
            // tNode. If it's not, we know it's a provider and skip hook registration.
            if (tView.firstCreatePass && index >= tNode.directiveStart) {
                ngDevMode && assertDirectiveDef(tData[index]);
                registerPreOrderHooks(index, tData[index], tView);
            }
        }
        finally {
            previousInjectImplementation !== null &&
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
    const tokenId = 
    // First check with `hasOwnProperty` so we don't get an inherited ID.
    token.hasOwnProperty(NG_ELEMENT_ID) ? token[NG_ELEMENT_ID] : undefined;
    // Negative token IDs are used for special objects such as `Injector`
    return (typeof tokenId === 'number' && tokenId > 0) ? tokenId & BLOOM_MASK : tokenId;
}
export function bloomHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomHash;
    const b7 = bloomHash & 0x80;
    const b6 = bloomHash & 0x40;
    const b5 = bloomHash & 0x20;
    // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
    // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
    // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
    let value;
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
export class NodeInjector {
    constructor(_tNode, _lView) {
        this._tNode = _tNode;
        this._lView = _lView;
    }
    get(token, notFoundValue) {
        return getOrCreateInjectable(this._tNode, this._lView, token, undefined, notFoundValue);
    }
}
/**
 * @codeGenApi
 */
export function ɵɵgetFactoryOf(type) {
    const typeAny = type;
    if (isForwardRef(type)) {
        return (() => {
            const factory = ɵɵgetFactoryOf(resolveForwardRef(typeAny));
            return factory ? factory() : null;
        });
    }
    let factory = getFactoryDef(typeAny);
    if (factory === null) {
        const injectorDef = getInjectorDef(typeAny);
        factory = injectorDef && injectorDef.factory;
    }
    return factory || null;
}
/**
 * @codeGenApi
 */
export function ɵɵgetInheritedFactory(type) {
    return noSideEffects(() => {
        const ownConstructor = type.prototype.constructor;
        const ownFactory = ownConstructor[NG_FACTORY_DEF] || ɵɵgetFactoryOf(ownConstructor);
        const objectPrototype = Object.prototype;
        let parent = Object.getPrototypeOf(type.prototype).constructor;
        // Go up the prototype until we hit `Object`.
        while (parent && parent !== objectPrototype) {
            const factory = parent[NG_FACTORY_DEF] || ɵɵgetFactoryOf(parent);
            // If we hit something that has a factory and the factory isn't the same as the type,
            // we've found the inherited factory. Note the check that the factory isn't the type's
            // own factory is redundant in most cases, but if the user has custom decorators on the
            // class, this lookup will start one level down in the prototype chain, causing us to
            // find the own factory first and potentially triggering an infinite loop downstream.
            if (factory && factory !== ownFactory) {
                return factory;
            }
            parent = Object.getPrototypeOf(parent);
        }
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return t => new t();
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUdsRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUN6RixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzNDLE9BQU8sRUFBQywwQkFBMEIsRUFBRSwwQkFBMEIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNoRixPQUFPLEVBQUMsYUFBYSxFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2RCxPQUFPLEVBQUMscUJBQXFCLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFFOUMsT0FBTyxFQUFDLFNBQVMsRUFBRSxrQkFBa0IsRUFBbUcsTUFBTSx1QkFBdUIsQ0FBQztBQUV0SyxPQUFPLEVBQUMsY0FBYyxFQUFFLGVBQWUsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBQ3pFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxnQkFBZ0IsRUFBRSxRQUFRLEVBQVMsTUFBTSxFQUFTLEtBQUssRUFBbUIsTUFBTSxtQkFB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Q0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxDQUFDO1FBRS9ELDZDQUE2QztRQUM3QyxPQUFPLE1BQU0sSUFBSSxNQUFNLEtBQUssZUFBZSxFQUFFO1lBQzNDLE1BQU0sT0FBTyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7WUFFakUscUZBQXFGO1lBQ3JGLHNGQUFzRjtZQUN0Rix1RkFBdUY7WUFDdkYscUZBQXFGO1lBQ3JGLHFGQUFxRjtZQUNyRixJQUFJLE9BQU8sSUFBSSxPQUFPLEtBQUssVUFBVSxFQUFFO2dCQUNyQyxPQUFPLE9BQU8sQ0FBQzthQUNoQjtZQUVELE1BQU0sR0FBRyxNQUFNLENBQUMsY0FBYyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1NBQ3hDO1FBRUQsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNEJBQTRCO1FBQzVCLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0lBQ3RCLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge2lzRm9yd2FyZFJlZiwgcmVzb2x2ZUZvcndhcmRSZWZ9IGZyb20gJy4uL2RpL2ZvcndhcmRfcmVmJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge2luamVjdFJvb3RMaW1wTW9kZSwgc2V0SW5qZWN0SW1wbGVtZW50YXRpb259IGZyb20gJy4uL2RpL2luamVjdG9yX2NvbXBhdGliaWxpdHknO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbCwgYXNzZXJ0SW5kZXhJblJhbmdlfSBmcm9tICcuLi91dGlsL2Fzc2VydCc7XG5pbXBvcnQge25vU2lkZUVmZmVjdHN9IGZyb20gJy4uL3V0aWwvY2xvc3VyZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGlyZWN0aXZlRGVmLCBhc3NlcnROb2RlSW5qZWN0b3IsIGFzc2VydFROb2RlRm9yTFZpZXd9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0RmFjdG9yeURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9ycyc7XG5pbXBvcnQge05HX0VMRU1FTlRfSUQsIE5HX0ZBQ1RPUllfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3JlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZiwgRmFjdG9yeUZufSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge2lzRmFjdG9yeSwgTk9fUEFSRU5UX0lOSkVDVE9SLCBOb2RlSW5qZWN0b3JGYWN0b3J5LCBOb2RlSW5qZWN0b3JPZmZzZXQsIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVENvbnRhaW5lck5vZGUsIFREaXJlY3RpdmVIb3N0Tm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzQ29tcG9uZW50RGVmLCBpc0NvbXBvbmVudEhvc3R9IGZyb20gJy4vaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXLCBERUNMQVJBVElPTl9WSUVXLCBJTkpFQ1RPUiwgTFZpZXcsIFRfSE9TVCwgVERhdGEsIFRWSUVXLCBUVmlldywgVFZpZXdUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydFROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2VudGVyREksIGxlYXZlREl9IGZyb20gJy4vc3RhdGUnO1xuaW1wb3J0IHtpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyfSBmcm9tICcuL3V0aWwvYXR0cnNfdXRpbHMnO1xuaW1wb3J0IHtnZXRQYXJlbnRJbmplY3RvckluZGV4LCBnZXRQYXJlbnRJbmplY3RvclZpZXcsIGhhc1BhcmVudEluamVjdG9yfSBmcm9tICcuL3V0aWwvaW5qZWN0b3JfdXRpbHMnO1xuaW1wb3J0IHtzdHJpbmdpZnlGb3JFcnJvcn0gZnJvbSAnLi91dGlsL21pc2NfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBEZWZpbmVzIGlmIHRoZSBjYWxsIHRvIGBpbmplY3RgIHNob3VsZCBpbmNsdWRlIGB2aWV3UHJvdmlkZXJzYCBpbiBpdHMgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGlzIHNldCB0byB0cnVlIHdoZW4gd2UgdHJ5IHRvIGluc3RhbnRpYXRlIGEgY29tcG9uZW50LiBUaGlzIHZhbHVlIGlzIHJlc2V0IGluXG4gKiBgZ2V0Tm9kZUluamVjdGFibGVgIHRvIGEgdmFsdWUgd2hpY2ggbWF0Y2hlcyB0aGUgZGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhlIHRva2VuIGFib3V0IHRvIGJlXG4gKiBpbnN0YW50aWF0ZWQuIFRoaXMgaXMgZG9uZSBzbyB0aGF0IGlmIHdlIGFyZSBpbmplY3RpbmcgYSB0b2tlbiB3aGljaCB3YXMgZGVjbGFyZWQgb3V0c2lkZSBvZlxuICogYHZpZXdQcm92aWRlcnNgIHdlIGRvbid0IGFjY2lkZW50YWxseSBwdWxsIGB2aWV3UHJvdmlkZXJzYCBpbi5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgTXlTZXJ2aWNlIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOiBTdHJpbmcpIHt9XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIE15U2VydmljZSxcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3Byb3ZpZGVycycgfVxuICogICBdXG4gKiAgIHZpZXdQcm92aWRlcnM6IFtcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3ZpZXdQcm92aWRlcnMnfVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihteVNlcnZpY2U6IE15U2VydmljZSwgdmFsdWU6IFN0cmluZykge1xuICogICAgIC8vIFdlIGV4cGVjdCB0aGF0IENvbXBvbmVudCBjYW4gc2VlIGludG8gYHZpZXdQcm92aWRlcnNgLlxuICogICAgIGV4cGVjdCh2YWx1ZSkudG9FcXVhbCgndmlld1Byb3ZpZGVycycpO1xuICogICAgIC8vIGBNeVNlcnZpY2VgIHdhcyBub3QgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIGhlbmNlIGl0IGNhbid0IHNlZSBpdC5cbiAqICAgICBleHBlY3QobXlTZXJ2aWNlLnZhbHVlKS50b0VxdWFsKCdwcm92aWRlcnMnKTtcbiAqICAgfVxuICogfVxuICpcbiAqIGBgYFxuICovXG5sZXQgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB0cnVlO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnModjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZSA9IGluY2x1ZGVWaWV3UHJvdmlkZXJzO1xuICBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IHY7XG4gIHJldHVybiBvbGRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PnxzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcywgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0Q3JlYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZDtcbiAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGlkID0gdHlwZS5jaGFyQ29kZUF0KDApIHx8IDA7XG4gIH0gZWxzZSBpZiAodHlwZS5oYXNPd25Qcm9wZXJ0eShOR19FTEVNRU5UX0lEKSkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgfVxuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGEgYXMgbnVtYmVyW107XG5cbiAgaWYgKGI3KSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDddIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA2XSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA1XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNF0gfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAzXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMl0gfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleF0gfD0gbWFzaykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldzogTFZpZXcpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBsVmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGxWaWV3Lmxlbmd0aDtcbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5kYXRhLCB0Tm9kZSk7ICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20obFZpZXcsIG51bGwpOyAgICAgICAgLy8gZm91bmRhdGlvbiBmb3IgY3VtdWxhdGl2ZSBibG9vbVxuICAgIGluc2VydEJsb29tKHRWaWV3LmJsdWVwcmludCwgbnVsbCk7XG4gIH1cblxuICBjb25zdCBwYXJlbnRMb2MgPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IGluamVjdG9ySW5kZXggPSB0Tm9kZS5pbmplY3RvckluZGV4O1xuXG4gIC8vIElmIGEgcGFyZW50IGluamVjdG9yIGNhbid0IGJlIGZvdW5kLCBpdHMgbG9jYXRpb24gaXMgc2V0IHRvIC0xLlxuICAvLyBJbiB0aGF0IGNhc2UsIHdlIGRvbid0IG5lZWQgdG8gc2V0IHVwIGEgY3VtdWxhdGl2ZSBibG9vbVxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jKSkge1xuICAgIGNvbnN0IHBhcmVudEluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2MpO1xuICAgIGNvbnN0IHBhcmVudExWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgbFZpZXcpO1xuICAgIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRMVmlld1tUVklFV10uZGF0YSBhcyBhbnk7XG4gICAgLy8gQ3JlYXRlcyBhIGN1bXVsYXRpdmUgYmxvb20gZmlsdGVyIHRoYXQgbWVyZ2VzIHRoZSBwYXJlbnQncyBibG9vbSBmaWx0ZXJcbiAgICAvLyBhbmQgaXRzIG93biBjdW11bGF0aXZlIGJsb29tICh3aGljaCBjb250YWlucyB0b2tlbnMgZm9yIGFsbCBhbmNlc3RvcnMpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOb2RlSW5qZWN0b3JPZmZzZXQuQkxPT01fU0laRTsgaSsrKSB7XG4gICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgaV0gPSBwYXJlbnRMVmlld1twYXJlbnRJbmRleCArIGldIHwgcGFyZW50RGF0YVtwYXJlbnRJbmRleCArIGldO1xuICAgIH1cbiAgfVxuXG4gIGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJsb29tKGFycjogYW55W10sIGZvb3RlcjogVE5vZGV8bnVsbCk6IHZvaWQge1xuICBhcnIucHVzaCgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCBmb290ZXIpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvckluZGV4KHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgbFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5QQVJFTlRdID09PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIHROb2RlLmluamVjdG9ySW5kZXgpO1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKlxuICogQHJldHVybnMgUmV0dXJucyBhIG51bWJlciB0aGF0IGlzIHRoZSBjb21iaW5hdGlvbiBvZiB0aGUgbnVtYmVyIG9mIExWaWV3cyB0aGF0IHdlIGhhdmUgdG8gZ28gdXBcbiAqIHRvIGZpbmQgdGhlIExWaWV3IGNvbnRhaW5pbmcgdGhlIHBhcmVudCBpbmplY3QgQU5EIHRoZSBpbmRleCBvZiB0aGUgaW5qZWN0b3Igd2l0aGluIHRoYXQgTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGFyZW50IGBUTm9kZWAgYW5kIHRoZXJlIGlzIGFuIGluamVjdG9yIGFzc29jaWF0ZWQgd2l0aCBpdCB3ZSBhcmUgZG9uZSwgYmVjYXVzZVxuICAgIC8vIHRoZSBwYXJlbnQgaW5qZWN0b3IgaXMgd2l0aGluIHRoZSBjdXJyZW50IGBMVmlld2AuXG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4IGFzIGFueTsgIC8vIFZpZXdPZmZzZXQgaXMgMFxuICB9XG5cbiAgLy8gV2hlbiBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24gaXMgY29tcHV0ZWQgaXQgbWF5IGJlIG91dHNpZGUgb2YgdGhlIGN1cnJlbnQgdmlldy4gKGllIGl0IGNvdWxkXG4gIC8vIGJlIHBvaW50aW5nIHRvIGEgZGVjbGFyZWQgcGFyZW50IGxvY2F0aW9uKS4gVGhpcyB2YXJpYWJsZSBzdG9yZXMgbnVtYmVyIG9mIGRlY2xhcmF0aW9uIHBhcmVudHNcbiAgLy8gd2UgbmVlZCB0byB3YWxrIHVwIGluIG9yZGVyIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbi5cbiAgbGV0IGRlY2xhcmF0aW9uVmlld09mZnNldCA9IDA7XG4gIGxldCBwYXJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBsVmlld0N1cnNvcjogTFZpZXd8bnVsbCA9IGxWaWV3O1xuXG4gIC8vIFRoZSBwYXJlbnQgaW5qZWN0b3IgaXMgbm90IGluIHRoZSBjdXJyZW50IGBMVmlld2AuIFdlIHdpbGwgaGF2ZSB0byB3YWxrIHRoZSBkZWNsYXJlZCBwYXJlbnRcbiAgLy8gYExWaWV3YCBoaWVyYXJjaHkgYW5kIGxvb2sgZm9yIGl0LiBJZiB3ZSB3YWxrIG9mIHRoZSB0b3AsIHRoYXQgbWVhbnMgdGhhdCB0aGVyZSBpcyBubyBwYXJlbnRcbiAgLy8gYE5vZGVJbmplY3RvcmAuXG4gIHdoaWxlIChsVmlld0N1cnNvciAhPT0gbnVsbCkge1xuICAgIC8vIEZpcnN0IGRldGVybWluZSB0aGUgYHBhcmVudFROb2RlYCBsb2NhdGlvbi4gVGhlIHBhcmVudCBwb2ludGVyIGRpZmZlcnMgYmFzZWQgb24gYFRWaWV3LnR5cGVgLlxuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdDdXJzb3JbVFZJRVddO1xuICAgIGNvbnN0IHRWaWV3VHlwZSA9IHRWaWV3LnR5cGU7XG4gICAgaWYgKHRWaWV3VHlwZSA9PT0gVFZpZXdUeXBlLkVtYmVkZGVkKSB7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnREZWZpbmVkKHRWaWV3LmRlY2xUTm9kZSwgJ0VtYmVkZGVkIFROb2RlcyBzaG91bGQgaGF2ZSBkZWNsYXJhdGlvbiBwYXJlbnRzLicpO1xuICAgICAgcGFyZW50VE5vZGUgPSB0Vmlldy5kZWNsVE5vZGU7XG4gICAgfSBlbHNlIGlmICh0Vmlld1R5cGUgPT09IFRWaWV3VHlwZS5Db21wb25lbnQpIHtcbiAgICAgIC8vIENvbXBvbmVudHMgZG9uJ3QgaGF2ZSBgVFZpZXcuZGVjbFROb2RlYCBiZWNhdXNlIGVhY2ggaW5zdGFuY2Ugb2YgY29tcG9uZW50IGNvdWxkIGJlXG4gICAgICAvLyBpbnNlcnRlZCBpbiBkaWZmZXJlbnQgbG9jYXRpb24sIGhlbmNlIGBUVmlldy5kZWNsVE5vZGVgIGlzIG1lYW5pbmdsZXNzLlxuICAgICAgcGFyZW50VE5vZGUgPSBsVmlld0N1cnNvcltUX0hPU1RdO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcudHlwZSwgVFZpZXdUeXBlLlJvb3QsICdSb290IHR5cGUgZXhwZWN0ZWQnKTtcbiAgICAgIHBhcmVudFROb2RlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBhcmVudFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIG5vIHBhcmVudCwgdGhhbiB3ZSBhcmUgZG9uZS5cbiAgICAgIHJldHVybiBOT19QQVJFTlRfSU5KRUNUT1I7XG4gICAgfVxuXG4gICAgbmdEZXZNb2RlICYmIHBhcmVudFROb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcocGFyZW50VE5vZGUhLCBsVmlld0N1cnNvcltERUNMQVJBVElPTl9WSUVXXSEpO1xuICAgIC8vIEV2ZXJ5IGl0ZXJhdGlvbiBvZiB0aGUgbG9vcCByZXF1aXJlcyB0aGF0IHdlIGdvIHRvIHRoZSBkZWNsYXJlZCBwYXJlbnQuXG4gICAgZGVjbGFyYXRpb25WaWV3T2Zmc2V0Kys7XG4gICAgbFZpZXdDdXJzb3IgPSBsVmlld0N1cnNvcltERUNMQVJBVElPTl9WSUVXXTtcblxuICAgIGlmIChwYXJlbnRUTm9kZS5pbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgLy8gV2UgZm91bmQgYSBOb2RlSW5qZWN0b3Igd2hpY2ggcG9pbnRzIHRvIHNvbWV0aGluZy5cbiAgICAgIHJldHVybiAocGFyZW50VE5vZGUuaW5qZWN0b3JJbmRleCB8XG4gICAgICAgICAgICAgIChkZWNsYXJhdGlvblZpZXdPZmZzZXQgPDwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSkgYXMgYW55O1xuICAgIH1cbiAgfVxuICByZXR1cm4gTk9fUEFSRU5UX0lOSkVDVE9SO1xufVxuLyoqXG4gKiBNYWtlcyBhIHR5cGUgb3IgYW4gaW5qZWN0aW9uIHRva2VuIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhblxuICogaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdHlwZSBvciB0aGUgaW5qZWN0aW9uIHRva2VuIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIHRva2VuOiBJbmplY3Rpb25Ub2tlbjxhbnk+fFR5cGU8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChpbmplY3RvckluZGV4LCB0VmlldywgdG9rZW4pO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQuybVjbXAgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGVJbXBsKHROb2RlOiBUTm9kZSwgYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLkFueVJOb2RlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgaWYgKGF0dHJOYW1lVG9JbmplY3QgPT09ICdjbGFzcycpIHtcbiAgICByZXR1cm4gdE5vZGUuY2xhc3NlcztcbiAgfVxuICBpZiAoYXR0ck5hbWVUb0luamVjdCA9PT0gJ3N0eWxlJykge1xuICAgIHJldHVybiB0Tm9kZS5zdHlsZXM7XG4gIH1cblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBjb25zdCBhdHRyc0xlbmd0aCA9IGF0dHJzLmxlbmd0aDtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcblxuICAgICAgLy8gSWYgd2UgaGl0IGEgYEJpbmRpbmdzYCBvciBgVGVtcGxhdGVgIG1hcmtlciB0aGVuIHdlIGFyZSBkb25lLlxuICAgICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIodmFsdWUpKSBicmVhaztcblxuICAgICAgLy8gU2tpcCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgIGlmICh2YWx1ZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyB3ZSBza2lwIHRoZSBuZXh0IHR3byB2YWx1ZXNcbiAgICAgICAgLy8gYXMgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzIGxvb2tzIGxpa2VcbiAgICAgICAgLy8gWy4uLiwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSwgJ2h0dHA6Ly9zb21ldXJpLmNvbS90ZXN0JywgJ3Rlc3Q6ZXhpc3QnLFxuICAgICAgICAvLyAnZXhpc3RWYWx1ZScsIC4uLl1cbiAgICAgICAgaSA9IGkgKyAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFNraXAgdG8gdGhlIGZpcnN0IHZhbHVlIG9mIHRoZSBtYXJrZWQgYXR0cmlidXRlLlxuICAgICAgICBpKys7XG4gICAgICAgIHdoaWxlIChpIDwgYXR0cnNMZW5ndGggJiYgdHlwZW9mIGF0dHJzW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBpICsgMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBOb2RlSW5qZWN0b3JzID0+IE1vZHVsZUluamVjdG9yLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcGF0Y2hlcyBgdG9rZW5gIHdpdGggYF9fTkdfRUxFTUVOVF9JRF9fYCB3aGljaCBjb250YWlucyB0aGUgaWQgZm9yIHRoZSBibG9vbVxuICogZmlsdGVyLiBOZWdhdGl2ZSB2YWx1ZXMgYXJlIHJlc2VydmVkIGZvciBzcGVjaWFsIG9iamVjdHMuXG4gKiAgIC0gYC0xYCBpcyByZXNlcnZlZCBmb3IgaW5qZWN0aW5nIGBJbmplY3RvcmAgKGltcGxlbWVudGVkIGJ5IGBOb2RlSW5qZWN0b3JgKVxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgTm9kZSB3aGVyZSB0aGUgc2VhcmNoIGZvciB0aGUgaW5qZWN0b3Igc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBjb250YWlucyB0aGUgYHROb2RlYFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiB3aGVuIHRoZSBpbmplY3Rpb24gZmxhZ3MgaXMgYEluamVjdEZsYWdzLk9wdGlvbmFsYFxuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yLCBgbnVsbGAgd2hlbiBub3QgZm91bmQsIG9yIGBub3RGb3VuZFZhbHVlYCBpZiBwcm92aWRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGV8bnVsbCwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0LCBub3RGb3VuZFZhbHVlPzogYW55KTogVHxudWxsIHtcbiAgaWYgKHROb2RlICE9PSBudWxsKSB7XG4gICAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAgIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gICAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGVudGVyREkobFZpZXcsIHROb2RlKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkpIHtcbiAgICAgICAgICB0aHJvd1Byb3ZpZGVyTm90Rm91bmRFcnJvcih0b2tlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBsZWF2ZURJKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYmxvb21IYXNoID09ICdudW1iZXInKSB7XG4gICAgICBpZiAoYmxvb21IYXNoID09PSAtMSkge1xuICAgICAgICAvLyBgLTFgIGlzIGEgc3BlY2lhbCB2YWx1ZSB1c2VkIHRvIGlkZW50aWZ5IGBJbmplY3RvcmAgdHlwZXMuXG4gICAgICAgIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBsVmlldykgYXMgYW55O1xuICAgICAgfVxuICAgICAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSB0b2tlbiB3aGljaCBjb3VsZCBiZSBpbiBOb2RlSW5qZWN0b3IuXG5cbiAgICAgIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmV2aW91cyBpbmplY3RvciBUVmlldyB0aGF0IHdhcyBmb3VuZCB3aGlsZSBjbGltYmluZyB0aGUgZWxlbWVudFxuICAgICAgLy8gaW5qZWN0b3IgdHJlZS4gVGhpcyBpcyB1c2VkIHRvIGtub3cgaWYgdmlld1Byb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgb24gdGhlIGN1cnJlbnRcbiAgICAgIC8vIGluamVjdG9yLlxuICAgICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgICAgbGV0IGluamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBsVmlldyk7XG4gICAgICBsZXQgcGFyZW50TG9jYXRpb246IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiA9IE5PX1BBUkVOVF9JTkpFQ1RPUjtcbiAgICAgIGxldCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZXxudWxsID1cbiAgICAgICAgICBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgPyBsVmlld1tERUNMQVJBVElPTl9DT01QT05FTlRfVklFV11bVF9IT1NUXSA6IG51bGw7XG5cbiAgICAgIC8vIElmIHdlIHNob3VsZCBza2lwIHRoaXMgaW5qZWN0b3IsIG9yIGlmIHRoZXJlIGlzIG5vIGluamVjdG9yIG9uIHRoaXMgbm9kZSwgc3RhcnQgYnlcbiAgICAgIC8vIHNlYXJjaGluZyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgICAgaWYgKGluamVjdG9ySW5kZXggPT09IC0xIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYpIHtcbiAgICAgICAgcGFyZW50TG9jYXRpb24gPSBpbmplY3RvckluZGV4ID09PSAtMSA/IGdldFBhcmVudEluamVjdG9yTG9jYXRpb24odE5vZGUsIGxWaWV3KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF07XG5cbiAgICAgICAgaWYgKHBhcmVudExvY2F0aW9uID09PSBOT19QQVJFTlRfSU5KRUNUT1IgfHwgIXNob3VsZFNlYXJjaFBhcmVudChmbGFncywgZmFsc2UpKSB7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHByZXZpb3VzVFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlXG4gICAgICAvLyAqaXNuJ3QqIGEgbWF0Y2guXG4gICAgICB3aGlsZSAoaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihsVmlldywgaW5qZWN0b3JJbmRleCk7XG5cbiAgICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgaW5qZWN0b3IuIElmIGl0IG1hdGNoZXMsIHNlZSBpZiBpdCBjb250YWlucyB0b2tlbi5cbiAgICAgICAgY29uc3QgdFZpZXcgPSBsVmlld1tUVklFV107XG4gICAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgICAgYXNzZXJ0VE5vZGVGb3JMVmlldyhcbiAgICAgICAgICAgICAgICB0Vmlldy5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlLCBsVmlldyk7XG4gICAgICAgIGlmIChibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgdFZpZXcuZGF0YSkpIHtcbiAgICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgICAvLyB0aGUgcHJvdmlkZXJzIGFuZCBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0XG4gICAgICAgICAgLy8gdGhlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPSBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgICAgICAgICAgICBpbmplY3RvckluZGV4LCBsVmlldywgdG9rZW4sIHByZXZpb3VzVFZpZXcsIGZsYWdzLCBob3N0VEVsZW1lbnROb2RlKTtcbiAgICAgICAgICBpZiAoaW5zdGFuY2UgIT09IE5PVF9GT1VORCkge1xuICAgICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBwYXJlbnRMb2NhdGlvbiA9IGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXTtcbiAgICAgICAgaWYgKHBhcmVudExvY2F0aW9uICE9PSBOT19QQVJFTlRfSU5KRUNUT1IgJiZcbiAgICAgICAgICAgIHNob3VsZFNlYXJjaFBhcmVudChcbiAgICAgICAgICAgICAgICBmbGFncyxcbiAgICAgICAgICAgICAgICBsVmlld1tUVklFV10uZGF0YVtpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSA9PT0gaG9zdFRFbGVtZW50Tm9kZSkgJiZcbiAgICAgICAgICAgIGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCBsVmlldykpIHtcbiAgICAgICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICAgICAgcHJldmlvdXNUVmlldyA9IHRWaWV3O1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgICBsVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHdlIHNob3VsZCBub3Qgc2VhcmNoIHBhcmVudCBPUiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGRvZXMgbm90IGhhdmUgdGhlXG4gICAgICAgICAgLy8gYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSB3ZSBjYW4gZ2l2ZSB1cCBvbiB0cmF2ZXJzaW5nIHVwIHRvIGZpbmQgdGhlIHNwZWNpZmljXG4gICAgICAgICAgLy8gaW5qZWN0b3IuXG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwgJiYgbm90Rm91bmRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCBvciB0aGUgTnVsbEluamVjdG9yIHdpbGwgdGhyb3cgZm9yIG9wdGlvbmFsIGRlcHNcbiAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgfVxuXG4gIGlmICgoZmxhZ3MgJiAoSW5qZWN0RmxhZ3MuU2VsZiB8IEluamVjdEZsYWdzLkhvc3QpKSA9PT0gMCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICAgIC8vIHN3aXRjaCB0byBgaW5qZWN0SW5qZWN0b3JPbmx5YCBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kdWxlIGluamVjdG9yLCBzaW5jZSBtb2R1bGUgaW5qZWN0b3JcbiAgICAvLyBzaG91bGQgbm90IGhhdmUgYWNjZXNzIHRvIENvbXBvbmVudC9EaXJlY3RpdmUgREkgc2NvcGUgKHRoYXQgbWF5IGhhcHBlbiB0aHJvdWdoXG4gICAgLy8gYGRpcmVjdGl2ZUluamVjdGAgaW1wbGVtZW50YXRpb24pXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKHVuZGVmaW5lZCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChtb2R1bGVJbmplY3Rvcikge1xuICAgICAgICByZXR1cm4gbW9kdWxlSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uKTtcbiAgICB9XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHtcbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvd1Byb3ZpZGVyTm90Rm91bmRFcnJvcih0b2tlbiwgJ05vZGVJbmplY3RvcicpO1xuICB9XG59XG5cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBwcmV2aW91c1RWaWV3OiBUVmlld3xudWxsLCBmbGFnczogSW5qZWN0RmxhZ3MsIGhvc3RURWxlbWVudE5vZGU6IFROb2RlfG51bGwpIHtcbiAgY29uc3QgY3VycmVudFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IGN1cnJlbnRUVmlldy5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAvLyBGaXJzdCwgd2UgbmVlZCB0byBkZXRlcm1pbmUgaWYgdmlldyBwcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIGJ5IHRoZSBzdGFydGluZyBlbGVtZW50LlxuICAvLyBUaGVyZSBhcmUgdHdvIHBvc3NpYmlsaXRpZXNcbiAgY29uc3QgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA9IHByZXZpb3VzVFZpZXcgPT0gbnVsbCA/XG4gICAgICAvLyAxKSBUaGlzIGlzIHRoZSBmaXJzdCBpbnZvY2F0aW9uIGBwcmV2aW91c1RWaWV3ID09IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIGF0IHRoZVxuICAgICAgLy8gYFROb2RlYCBvZiB3aGVyZSBpbmplY3RvciBpcyBzdGFydGluZyB0byBsb29rLiBJbiBzdWNoIGEgY2FzZSB0aGUgb25seSB0aW1lIHdlIGFyZSBhbGxvd2VkXG4gICAgICAvLyB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaXMgaWY6XG4gICAgICAvLyAtIHdlIGFyZSBvbiBhIGNvbXBvbmVudFxuICAgICAgLy8gLSBBTkQgdGhlIGluamVjdG9yIHNldCBgaW5jbHVkZVZpZXdQcm92aWRlcnNgIHRvIHRydWUgKGltcGx5aW5nIHRoYXQgdGhlIHRva2VuIGNhbiBzZWVcbiAgICAgIC8vIFZpZXdQcm92aWRlcnMgYmVjYXVzZSBpdCBpcyB0aGUgQ29tcG9uZW50IG9yIGEgU2VydmljZSB3aGljaCBpdHNlbGYgd2FzIGRlY2xhcmVkIGluXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzKVxuICAgICAgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkgJiYgaW5jbHVkZVZpZXdQcm92aWRlcnMpIDpcbiAgICAgIC8vIDIpIGBwcmV2aW91c1RWaWV3ICE9IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIG5vdyB3YWxraW5nIGFjcm9zcyB0aGUgcGFyZW50IG5vZGVzLlxuICAgICAgLy8gSW4gc3VjaCBhIGNhc2Ugd2UgYXJlIG9ubHkgYWxsb3dlZCB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaWY6XG4gICAgICAvLyAtIFdlIGp1c3QgY3Jvc3NlZCBmcm9tIGNoaWxkIFZpZXcgdG8gUGFyZW50IFZpZXcgYHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3YFxuICAgICAgLy8gLSBBTkQgdGhlIHBhcmVudCBUTm9kZSBpcyBhbiBFbGVtZW50LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGp1c3QgY2FtZSBmcm9tIHRoZSBDb21wb25lbnQncyBWaWV3IGFuZCB0aGVyZWZvcmUgYXJlIGFsbG93ZWQgdG8gc2VlXG4gICAgICAvLyBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzLlxuICAgICAgKHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmICgodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkgIT09IDApKTtcblxuICAvLyBUaGlzIHNwZWNpYWwgY2FzZSBoYXBwZW5zIHdoZW4gdGhlcmUgaXMgYSBAaG9zdCBvbiB0aGUgaW5qZWN0IGFuZCB3aGVuIHdlIGFyZSBzZWFyY2hpbmdcbiAgLy8gb24gdGhlIGhvc3QgZWxlbWVudCBub2RlLlxuICBjb25zdCBpc0hvc3RTcGVjaWFsQ2FzZSA9IChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QpICYmIGhvc3RURWxlbWVudE5vZGUgPT09IHROb2RlO1xuXG4gIGNvbnN0IGluamVjdGFibGVJZHggPSBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKFxuICAgICAgdE5vZGUsIGN1cnJlbnRUVmlldywgdG9rZW4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMsIGlzSG9zdFNwZWNpYWxDYXNlKTtcbiAgaWYgKGluamVjdGFibGVJZHggIT09IG51bGwpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIGN1cnJlbnRUVmlldywgaW5qZWN0YWJsZUlkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gTk9UX0ZPVU5EO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIHRoZSBnaXZlbiB0b2tlbiBhbW9uZyB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVycy5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSB0VmlldyBUaGUgdFZpZXcgd2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nXG4gKiBAcGFyYW0gdG9rZW4gUHJvdmlkZXIgdG9rZW4gb3IgdHlwZSBvZiBhIGRpcmVjdGl2ZSB0byBsb29rIGZvci5cbiAqIEBwYXJhbSBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzIFdoZXRoZXIgdmlldyBwcm92aWRlcnMgc2hvdWxkIGJlIGNvbnNpZGVyZWQuXG4gKiBAcGFyYW0gaXNIb3N0U3BlY2lhbENhc2UgV2hldGhlciB0aGUgaG9zdCBzcGVjaWFsIGNhc2UgYXBwbGllcy5cbiAqIEByZXR1cm5zIEluZGV4IG9mIGEgZm91bmQgZGlyZWN0aXZlIG9yIHByb3ZpZGVyLCBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXI8VD4oXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIHRva2VuOiBUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fHN0cmluZyxcbiAgICBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzOiBib29sZWFuLCBpc0hvc3RTcGVjaWFsQ2FzZTogYm9vbGVhbnxudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IG5vZGVQcm92aWRlckluZGV4ZXMgPSB0Tm9kZS5wcm92aWRlckluZGV4ZXM7XG4gIGNvbnN0IHRJbmplY3RhYmxlcyA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgaW5qZWN0YWJsZXNTdGFydCA9IG5vZGVQcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZGlyZWN0aXZlc1N0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgY3B0Vmlld1Byb3ZpZGVyc0NvdW50ID1cbiAgICAgIG5vZGVQcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG4gIGNvbnN0IHN0YXJ0aW5nSW5kZXggPVxuICAgICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA/IGluamVjdGFibGVzU3RhcnQgOiBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50O1xuICAvLyBXaGVuIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLCBvbmx5IHRoZSB2aWV3UHJvdmlkZXJzIGFuZCB0aGUgY29tcG9uZW50IGFyZSB2aXNpYmxlXG4gIGNvbnN0IGVuZEluZGV4ID0gaXNIb3N0U3BlY2lhbENhc2UgPyBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50IDogZGlyZWN0aXZlRW5kO1xuICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlclRva2VuT3JEZWYgPVxuICAgICAgICB0SW5qZWN0YWJsZXNbaV0gYXMgSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+fCBEaXJlY3RpdmVEZWY8YW55Pnwgc3RyaW5nO1xuICAgIGlmIChpIDwgZGlyZWN0aXZlc1N0YXJ0ICYmIHRva2VuID09PSBwcm92aWRlclRva2VuT3JEZWYgfHxcbiAgICAgICAgaSA+PSBkaXJlY3RpdmVzU3RhcnQgJiYgKHByb3ZpZGVyVG9rZW5PckRlZiBhcyBEaXJlY3RpdmVEZWY8YW55PikudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNIb3N0U3BlY2lhbENhc2UpIHtcbiAgICBjb25zdCBkaXJEZWYgPSB0SW5qZWN0YWJsZXNbZGlyZWN0aXZlc1N0YXJ0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGlyRGVmICYmIGlzQ29tcG9uZW50RGVmKGRpckRlZikgJiYgZGlyRGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gZGlyZWN0aXZlc1N0YXJ0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBvciBpbnN0YW50aWF0ZSB0aGUgaW5qZWN0YWJsZSBmcm9tIHRoZSBgTFZpZXdgIGF0IHBhcnRpY3VsYXIgYGluZGV4YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlIHZhbHVlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkIGFuZCBpZiBzbyByZXR1cm5zIHRoZVxuICogY2FjaGVkIGBpbmplY3RhYmxlYC4gT3RoZXJ3aXNlIGlmIGl0IGRldGVjdHMgdGhhdCB0aGUgdmFsdWUgaXMgc3RpbGwgYSBmYWN0b3J5IGl0XG4gKiBpbnN0YW50aWF0ZXMgdGhlIGBpbmplY3RhYmxlYCBhbmQgY2FjaGVzIHRoZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVJbmplY3RhYmxlKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbFZpZXdbaW5kZXhdO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmIChpc0ZhY3RvcnkodmFsdWUpKSB7XG4gICAgY29uc3QgZmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSA9IHZhbHVlO1xuICAgIGlmIChmYWN0b3J5LnJlc29sdmluZykge1xuICAgICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3Ioc3RyaW5naWZ5Rm9yRXJyb3IodERhdGFbaW5kZXhdKSk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMgPSBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhmYWN0b3J5LmNhblNlZVZpZXdQcm92aWRlcnMpO1xuICAgIGZhY3RvcnkucmVzb2x2aW5nID0gdHJ1ZTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID1cbiAgICAgICAgZmFjdG9yeS5pbmplY3RJbXBsID8gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oZmFjdG9yeS5pbmplY3RJbXBsKSA6IG51bGw7XG4gICAgZW50ZXJESShsVmlldywgdE5vZGUpO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGxWaWV3W2luZGV4XSA9IGZhY3RvcnkuZmFjdG9yeSh1bmRlZmluZWQsIHREYXRhLCBsVmlldywgdE5vZGUpO1xuICAgICAgLy8gVGhpcyBjb2RlIHBhdGggaXMgaGl0IGZvciBib3RoIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVycy5cbiAgICAgIC8vIEZvciBwZXJmIHJlYXNvbnMsIHdlIHdhbnQgdG8gYXZvaWQgc2VhcmNoaW5nIGZvciBob29rcyBvbiBwcm92aWRlcnMuXG4gICAgICAvLyBJdCBkb2VzIG5vIGhhcm0gdG8gdHJ5ICh0aGUgaG9va3MganVzdCB3b24ndCBleGlzdCksIGJ1dCB0aGUgZXh0cmFcbiAgICAgIC8vIGNoZWNrcyBhcmUgdW5uZWNlc3NhcnkgYW5kIHRoaXMgaXMgYSBob3QgcGF0aC4gU28gd2UgY2hlY2sgdG8gc2VlXG4gICAgICAvLyBpZiB0aGUgaW5kZXggb2YgdGhlIGRlcGVuZGVuY3kgaXMgaW4gdGhlIGRpcmVjdGl2ZSByYW5nZSBmb3IgdGhpc1xuICAgICAgLy8gdE5vZGUuIElmIGl0J3Mgbm90LCB3ZSBrbm93IGl0J3MgYSBwcm92aWRlciBhbmQgc2tpcCBob29rIHJlZ2lzdHJhdGlvbi5cbiAgICAgIGlmICh0Vmlldy5maXJzdENyZWF0ZVBhc3MgJiYgaW5kZXggPj0gdE5vZGUuZGlyZWN0aXZlU3RhcnQpIHtcbiAgICAgICAgbmdEZXZNb2RlICYmIGFzc2VydERpcmVjdGl2ZURlZih0RGF0YVtpbmRleF0pO1xuICAgICAgICByZWdpc3RlclByZU9yZGVySG9va3MoaW5kZXgsIHREYXRhW2luZGV4XSBhcyBEaXJlY3RpdmVEZWY8YW55PiwgdFZpZXcpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uICE9PSBudWxsICYmXG4gICAgICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzKTtcbiAgICAgIGZhY3RvcnkucmVzb2x2aW5nID0gZmFsc2U7XG4gICAgICBsZWF2ZURJKCk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICogICBXaGVuIHRoZSByZXR1cm5lZCB2YWx1ZSBpcyBuZWdhdGl2ZSB0aGVuIGl0IHJlcHJlc2VudHMgc3BlY2lhbCB2YWx1ZXMgc3VjaCBhcyBgSW5qZWN0b3JgLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PnxzdHJpbmcpOiBudW1iZXJ8RnVuY3Rpb258XG4gICAgdW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdG9rZW4uY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPVxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2l0aCBgaGFzT3duUHJvcGVydHlgIHNvIHdlIGRvbid0IGdldCBhbiBpbmhlcml0ZWQgSUQuXG4gICAgICB0b2tlbi5oYXNPd25Qcm9wZXJ0eShOR19FTEVNRU5UX0lEKSA/ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdIDogdW5kZWZpbmVkO1xuICAvLyBOZWdhdGl2ZSB0b2tlbiBJRHMgYXJlIHVzZWQgZm9yIHNwZWNpYWwgb2JqZWN0cyBzdWNoIGFzIGBJbmplY3RvcmBcbiAgcmV0dXJuICh0eXBlb2YgdG9rZW5JZCA9PT0gJ251bWJlcicgJiYgdG9rZW5JZCA+IDApID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3fFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuICBjb25zdCBiNyA9IGJsb29tSGFzaCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21IYXNoICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUhhc2ggJiAweDIwO1xuXG4gIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgaWYgKGI3KSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgN10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDZdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDRdKTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAzXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAxXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4XSk7XG4gIH1cblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgaXNGaXJzdEhvc3RUTm9kZTogYm9vbGVhbik6IGJvb2xlYW58bnVtYmVyIHtcbiAgcmV0dXJuICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiBpc0ZpcnN0SG9zdFROb2RlKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsLFxuICAgICAgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIHVuZGVmaW5lZCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiBGYWN0b3J5Rm48VD58bnVsbCB7XG4gIGNvbnN0IHR5cGVBbnkgPSB0eXBlIGFzIGFueTtcblxuICBpZiAoaXNGb3J3YXJkUmVmKHR5cGUpKSB7XG4gICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICAgY29uc3QgZmFjdG9yeSA9IMm1ybVnZXRGYWN0b3J5T2Y8VD4ocmVzb2x2ZUZvcndhcmRSZWYodHlwZUFueSkpO1xuICAgICAgICAgICAgIHJldHVybiBmYWN0b3J5ID8gZmFjdG9yeSgpIDogbnVsbDtcbiAgICAgICAgICAgfSkgYXMgYW55O1xuICB9XG5cbiAgbGV0IGZhY3RvcnkgPSBnZXRGYWN0b3J5RGVmPFQ+KHR5cGVBbnkpO1xuICBpZiAoZmFjdG9yeSA9PT0gbnVsbCkge1xuICAgIGNvbnN0IGluamVjdG9yRGVmID0gZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gICAgZmFjdG9yeSA9IGluamVjdG9yRGVmICYmIGluamVjdG9yRGVmLmZhY3Rvcnk7XG4gIH1cbiAgcmV0dXJuIGZhY3RvcnkgfHwgbnVsbDtcbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICByZXR1cm4gbm9TaWRlRWZmZWN0cygoKSA9PiB7XG4gICAgY29uc3Qgb3duQ29uc3RydWN0b3IgPSB0eXBlLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcbiAgICBjb25zdCBvd25GYWN0b3J5ID0gb3duQ29uc3RydWN0b3JbTkdfRkFDVE9SWV9ERUZdIHx8IMm1ybVnZXRGYWN0b3J5T2Yob3duQ29uc3RydWN0b3IpO1xuICAgIGNvbnN0IG9iamVjdFByb3RvdHlwZSA9IE9iamVjdC5wcm90b3R5cGU7XG4gICAgbGV0IHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3I7XG5cbiAgICAvLyBHbyB1cCB0aGUgcHJvdG90eXBlIHVudGlsIHdlIGhpdCBgT2JqZWN0YC5cbiAgICB3aGlsZSAocGFyZW50ICYmIHBhcmVudCAhPT0gb2JqZWN0UHJvdG90eXBlKSB7XG4gICAgICBjb25zdCBmYWN0b3J5ID0gcGFyZW50W05HX0ZBQ1RPUllfREVGXSB8fCDJtcm1Z2V0RmFjdG9yeU9mKHBhcmVudCk7XG5cbiAgICAgIC8vIElmIHdlIGhpdCBzb21ldGhpbmcgdGhhdCBoYXMgYSBmYWN0b3J5IGFuZCB0aGUgZmFjdG9yeSBpc24ndCB0aGUgc2FtZSBhcyB0aGUgdHlwZSxcbiAgICAgIC8vIHdlJ3ZlIGZvdW5kIHRoZSBpbmhlcml0ZWQgZmFjdG9yeS4gTm90ZSB0aGUgY2hlY2sgdGhhdCB0aGUgZmFjdG9yeSBpc24ndCB0aGUgdHlwZSdzXG4gICAgICAvLyBvd24gZmFjdG9yeSBpcyByZWR1bmRhbnQgaW4gbW9zdCBjYXNlcywgYnV0IGlmIHRoZSB1c2VyIGhhcyBjdXN0b20gZGVjb3JhdG9ycyBvbiB0aGVcbiAgICAgIC8vIGNsYXNzLCB0aGlzIGxvb2t1cCB3aWxsIHN0YXJ0IG9uZSBsZXZlbCBkb3duIGluIHRoZSBwcm90b3R5cGUgY2hhaW4sIGNhdXNpbmcgdXMgdG9cbiAgICAgIC8vIGZpbmQgdGhlIG93biBmYWN0b3J5IGZpcnN0IGFuZCBwb3RlbnRpYWxseSB0cmlnZ2VyaW5nIGFuIGluZmluaXRlIGxvb3AgZG93bnN0cmVhbS5cbiAgICAgIGlmIChmYWN0b3J5ICYmIGZhY3RvcnkgIT09IG93bkZhY3RvcnkpIHtcbiAgICAgICAgcmV0dXJuIGZhY3Rvcnk7XG4gICAgICB9XG5cbiAgICAgIHBhcmVudCA9IE9iamVjdC5nZXRQcm90b3R5cGVPZihwYXJlbnQpO1xuICAgIH1cblxuICAgIC8vIFRoZXJlIGlzIG5vIGZhY3RvcnkgZGVmaW5lZC4gRWl0aGVyIHRoaXMgd2FzIGltcHJvcGVyIHVzYWdlIG9mIGluaGVyaXRhbmNlXG4gICAgLy8gKG5vIEFuZ3VsYXIgZGVjb3JhdG9yIG9uIHRoZSBzdXBlcmNsYXNzKSBvciB0aGVyZSBpcyBubyBjb25zdHJ1Y3RvciBhdCBhbGxcbiAgICAvLyBpbiB0aGUgaW5oZXJpdGFuY2UgY2hhaW4uIFNpbmNlIHRoZSB0d28gY2FzZXMgY2Fubm90IGJlIGRpc3Rpbmd1aXNoZWQsIHRoZVxuICAgIC8vIGxhdHRlciBoYXMgdG8gYmUgYXNzdW1lZC5cbiAgICByZXR1cm4gdCA9PiBuZXcgdCgpO1xuICB9KTtcbn1cbiJdfQ==