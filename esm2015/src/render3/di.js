/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../di/forward_ref';
import { injectRootLimpMode, setInjectImplementation } from '../di/inject_switch';
import { getInjectorDef } from '../di/interface/defs';
import { InjectFlags } from '../di/interface/injector';
import { assertDefined, assertEqual, assertIndexInRange } from '../util/assert';
import { noSideEffects } from '../util/closure';
import { assertDirectiveDef, assertNodeInjector, assertTNodeForLView } from './assert';
import { getFactoryDef } from './definition_factory';
import { throwCyclicDependencyError, throwProviderNotFoundError } from './errors_di';
import { NG_ELEMENT_ID, NG_FACTORY_DEF } from './fields';
import { registerPreOrderHooks } from './hooks';
import { isFactory, NO_PARENT_INJECTOR } from './interfaces/injector';
import { isComponentDef, isComponentHost } from './interfaces/type_checks';
import { DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, INJECTOR, T_HOST, TVIEW } from './interfaces/view';
import { assertTNodeType } from './node_assert';
import { enterDI, getCurrentTNode, getLView, leaveDI } from './state';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { stringifyForError } from './util/stringify_utils';
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
/**
 * The number of bits that is represented by a single bloom bucket. JS bit operations are 32 bits,
 * so each bucket represents 32 distinct tokens which accounts for log2(32) = 5 bits of a bloom hash
 * number.
 */
const BLOOM_BUCKET_BITS = 5;
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
    const bloomHash = id & BLOOM_MASK;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomHash;
    // Each bloom bucket in `tData` represents `BLOOM_BUCKET_BITS` number of bits of `bloomHash`.
    // Any bits in `bloomHash` beyond `BLOOM_BUCKET_BITS` indicate the bucket offset that the mask
    // should be written to.
    tView.data[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)] |= mask;
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
function notFoundValueOrThrow(notFoundValue, token, flags) {
    if (flags & InjectFlags.Optional) {
        return notFoundValue;
    }
    else {
        throwProviderNotFoundError(token, 'NodeInjector');
    }
}
/**
 * Returns the value associated to the given token from the ModuleInjector or throws exception
 *
 * @param lView The `LView` that contains the `tNode`
 * @param token The token to look for
 * @param flags Injection flags
 * @param notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @returns the value from the injector or throws an exception
 */
function lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue) {
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
    return notFoundValueOrThrow(notFoundValue, token, flags);
}
/**
 * Returns the value associated to the given token from the NodeInjectors => ModuleInjector.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * This function patches `token` with `__NG_ELEMENT_ID__` which contains the id for the bloom
 * filter. `-1` is reserved for injecting `Injector` (implemented by `NodeInjector`)
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
            if (!enterDI(lView, tNode, flags)) {
                // Failed to enter DI, try module injector instead. If a token is injected with the @Host
                // flag, the module injector is not searched for that token in Ivy.
                return (flags & InjectFlags.Host) ?
                    notFoundValueOrThrow(notFoundValue, token, flags) :
                    lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue);
            }
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
        else if (typeof bloomHash === 'number') {
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
    return lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue);
}
const NOT_FOUND = {};
export function createNodeInjector() {
    return new NodeInjector(getCurrentTNode(), getLView());
}
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
        const success = enterDI(lView, tNode, InjectFlags.Default);
        ngDevMode &&
            assertEqual(success, true, 'Because flags do not contain \`SkipSelf\' we expect this to always succeed.');
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
    if (typeof tokenId === 'number') {
        if (tokenId >= 0) {
            return tokenId & BLOOM_MASK;
        }
        else {
            ngDevMode &&
                assertEqual(tokenId, -1 /* Injector */, 'Expecting to get Special Injector Id');
            return createNodeInjector;
        }
    }
    else {
        return tokenId;
    }
}
export function bloomHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomHash;
    // Each bloom bucket in `injectorView` represents `BLOOM_BUCKET_BITS` number of bits of
    // `bloomHash`. Any bits in `bloomHash` beyond `BLOOM_BUCKET_BITS` indicate the bucket offset
    // that should be used.
    const value = injectorView[injectorIndex + (bloomHash >> BLOOM_BUCKET_BITS)];
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
export function ɵɵgetInheritedFactory(type) {
    return noSideEffects(() => {
        const ownConstructor = type.prototype.constructor;
        const ownFactory = ownConstructor[NG_FACTORY_DEF] || getFactoryOf(ownConstructor);
        const objectPrototype = Object.prototype;
        let parent = Object.getPrototypeOf(type.prototype).constructor;
        // Go up the prototype until we hit `Object`.
        while (parent && parent !== objectPrototype) {
            const factory = parent[NG_FACTORY_DEF] || getFactoryOf(parent);
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
function getFactoryOf(type) {
    const typeAny = type;
    if (isForwardRef(type)) {
        return (() => {
            const factory = getFactoryOf(resolveForwardRef(typeAny));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUloRixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQVksYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU5QyxPQUFPLEVBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFtRyxNQUFNLHVCQUF1QixDQUFDO0FBRXRLLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDekUsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQVMsS0FBSyxFQUFtQixNQUFNLG1C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LElBQUksT0FBTyxJQUFJLE9BQU8sS0FBSyxVQUFVLEVBQUU7Z0JBQ3JDLE9BQU8sT0FBTyxDQUFDO2FBQ2hCO1lBRUQsTUFBTSxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7U0FDeEM7UUFFRCw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw0QkFBNEI7UUFDNUIsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7SUFDdEIsQ0FBQyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBRUQsU0FBUyxZQUFZLENBQUksSUFBZTtJQUN0QyxNQUFNLE9BQU8sR0FBRyxJQUFXLENBQUM7SUFFNUIsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUU7UUFDdEIsT0FBTyxDQUFDLEdBQUcsRUFBRTtZQUNKLE1BQU0sT0FBTyxHQUFHLFlBQVksQ0FBSSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1lBQzVELE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQ3BDLENBQUMsQ0FBUSxDQUFDO0tBQ2xCO0lBRUQsSUFBSSxPQUFPLEdBQUcsYUFBYSxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBQ3hDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixNQUFNLFdBQVcsR0FBRyxjQUFjLENBQUksT0FBTyxDQUFDLENBQUM7UUFDL0MsT0FBTyxHQUFHLFdBQVcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDO0tBQzlDO0lBQ0QsT0FBTyxPQUFPLElBQUksSUFBSSxDQUFDO0FBQ3pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge2luamVjdFJvb3RMaW1wTW9kZSwgc2V0SW5qZWN0SW1wbGVtZW50YXRpb259IGZyb20gJy4uL2RpL2luamVjdF9zd2l0Y2gnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0b3JNYXJrZXJzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9tYXJrZXInO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7QWJzdHJhY3RUeXBlLCBUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7bm9TaWRlRWZmZWN0c30gZnJvbSAnLi4vdXRpbC9jbG9zdXJlJztcblxuaW1wb3J0IHthc3NlcnREaXJlY3RpdmVEZWYsIGFzc2VydE5vZGVJbmplY3RvciwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtGYWN0b3J5Rm4sIGdldEZhY3RvcnlEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9yc19kaSc7XG5pbXBvcnQge05HX0VMRU1FTlRfSUQsIE5HX0ZBQ1RPUllfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3JlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtpc0ZhY3RvcnksIE5PX1BBUkVOVF9JTkpFQ1RPUiwgTm9kZUluamVjdG9yRmFjdG9yeSwgTm9kZUluamVjdG9yT2Zmc2V0LCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZiwgaXNDb21wb25lbnRIb3N0fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgSU5KRUNUT1IsIExWaWV3LCBUX0hPU1QsIFREYXRhLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtlbnRlckRJLCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBsZWF2ZURJfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcn0gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBEZWZpbmVzIGlmIHRoZSBjYWxsIHRvIGBpbmplY3RgIHNob3VsZCBpbmNsdWRlIGB2aWV3UHJvdmlkZXJzYCBpbiBpdHMgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGlzIHNldCB0byB0cnVlIHdoZW4gd2UgdHJ5IHRvIGluc3RhbnRpYXRlIGEgY29tcG9uZW50LiBUaGlzIHZhbHVlIGlzIHJlc2V0IGluXG4gKiBgZ2V0Tm9kZUluamVjdGFibGVgIHRvIGEgdmFsdWUgd2hpY2ggbWF0Y2hlcyB0aGUgZGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhlIHRva2VuIGFib3V0IHRvIGJlXG4gKiBpbnN0YW50aWF0ZWQuIFRoaXMgaXMgZG9uZSBzbyB0aGF0IGlmIHdlIGFyZSBpbmplY3RpbmcgYSB0b2tlbiB3aGljaCB3YXMgZGVjbGFyZWQgb3V0c2lkZSBvZlxuICogYHZpZXdQcm92aWRlcnNgIHdlIGRvbid0IGFjY2lkZW50YWxseSBwdWxsIGB2aWV3UHJvdmlkZXJzYCBpbi5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgTXlTZXJ2aWNlIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOiBTdHJpbmcpIHt9XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIE15U2VydmljZSxcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3Byb3ZpZGVycycgfVxuICogICBdXG4gKiAgIHZpZXdQcm92aWRlcnM6IFtcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3ZpZXdQcm92aWRlcnMnfVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihteVNlcnZpY2U6IE15U2VydmljZSwgdmFsdWU6IFN0cmluZykge1xuICogICAgIC8vIFdlIGV4cGVjdCB0aGF0IENvbXBvbmVudCBjYW4gc2VlIGludG8gYHZpZXdQcm92aWRlcnNgLlxuICogICAgIGV4cGVjdCh2YWx1ZSkudG9FcXVhbCgndmlld1Byb3ZpZGVycycpO1xuICogICAgIC8vIGBNeVNlcnZpY2VgIHdhcyBub3QgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIGhlbmNlIGl0IGNhbid0IHNlZSBpdC5cbiAqICAgICBleHBlY3QobXlTZXJ2aWNlLnZhbHVlKS50b0VxdWFsKCdwcm92aWRlcnMnKTtcbiAqICAgfVxuICogfVxuICpcbiAqIGBgYFxuICovXG5sZXQgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB0cnVlO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnModjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZSA9IGluY2x1ZGVWaWV3UHJvdmlkZXJzO1xuICBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IHY7XG4gIHJldHVybiBvbGRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBiaXRzIHRoYXQgaXMgcmVwcmVzZW50ZWQgYnkgYSBzaW5nbGUgYmxvb20gYnVja2V0LiBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cyxcbiAqIHNvIGVhY2ggYnVja2V0IHJlcHJlc2VudHMgMzIgZGlzdGluY3QgdG9rZW5zIHdoaWNoIGFjY291bnRzIGZvciBsb2cyKDMyKSA9IDUgYml0cyBvZiBhIGJsb29tIGhhc2hcbiAqIG51bWJlci5cbiAqL1xuY29uc3QgQkxPT01fQlVDS0VUX0JJVFMgPSA1O1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvckluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZSBpbmplY3RvciB3aGVyZSB0aGlzIHRva2VuIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdFZpZXcgVGhlIFRWaWV3IGZvciB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJzXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRva2VuIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIHRWaWV3OiBUVmlldywgdHlwZTogVHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT58c3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdENyZWF0ZVBhc3MsIHRydWUsICdleHBlY3RlZCBmaXJzdENyZWF0ZVBhc3MgdG8gYmUgdHJ1ZScpO1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQ7XG4gIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZCA9IHR5cGUuY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9IGVsc2UgaWYgKHR5cGUuaGFzT3duUHJvcGVydHkoTkdfRUxFTUVOVF9JRCkpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIH1cblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgY29uc3QgYmxvb21IYXNoID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuXG4gIC8vIEVhY2ggYmxvb20gYnVja2V0IGluIGB0RGF0YWAgcmVwcmVzZW50cyBgQkxPT01fQlVDS0VUX0JJVFNgIG51bWJlciBvZiBiaXRzIG9mIGBibG9vbUhhc2hgLlxuICAvLyBBbnkgYml0cyBpbiBgYmxvb21IYXNoYCBiZXlvbmQgYEJMT09NX0JVQ0tFVF9CSVRTYCBpbmRpY2F0ZSB0aGUgYnVja2V0IG9mZnNldCB0aGF0IHRoZSBtYXNrXG4gIC8vIHNob3VsZCBiZSB3cml0dGVuIHRvLlxuICAodFZpZXcuZGF0YSBhcyBudW1iZXJbXSlbaW5qZWN0b3JJbmRleCArIChibG9vbUhhc2ggPj4gQkxPT01fQlVDS0VUX0JJVFMpXSB8PSBtYXNrO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgVmlldyB3aGVyZSB0aGUgbm9kZSBpcyBzdG9yZWRcbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBsVmlldy5sZW5ndGg7XG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuZGF0YSwgdE5vZGUpOyAgLy8gZm91bmRhdGlvbiBmb3Igbm9kZSBibG9vbVxuICAgIGluc2VydEJsb29tKGxWaWV3LCBudWxsKTsgICAgICAgIC8vIGZvdW5kYXRpb24gZm9yIGN1bXVsYXRpdmUgYmxvb21cbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5ibHVlcHJpbnQsIG51bGwpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICAvLyBJZiBhIHBhcmVudCBpbmplY3RvciBjYW4ndCBiZSBmb3VuZCwgaXRzIGxvY2F0aW9uIGlzIHNldCB0byAtMS5cbiAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBuZWVkIHRvIHNldCB1cCBhIGN1bXVsYXRpdmUgYmxvb21cbiAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvYykpIHtcbiAgICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgICBjb25zdCBwYXJlbnRMVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2MsIGxWaWV3KTtcbiAgICBjb25zdCBwYXJlbnREYXRhID0gcGFyZW50TFZpZXdbVFZJRVddLmRhdGEgYXMgYW55O1xuICAgIC8vIENyZWF0ZXMgYSBjdW11bGF0aXZlIGJsb29tIGZpbHRlciB0aGF0IG1lcmdlcyB0aGUgcGFyZW50J3MgYmxvb20gZmlsdGVyXG4gICAgLy8gYW5kIGl0cyBvd24gY3VtdWxhdGl2ZSBibG9vbSAod2hpY2ggY29udGFpbnMgdG9rZW5zIGZvciBhbGwgYW5jZXN0b3JzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTm9kZUluamVjdG9yT2Zmc2V0LkJMT09NX1NJWkU7IGkrKykge1xuICAgICAgbFZpZXdbaW5qZWN0b3JJbmRleCArIGldID0gcGFyZW50TFZpZXdbcGFyZW50SW5kZXggKyBpXSB8IHBhcmVudERhdGFbcGFyZW50SW5kZXggKyBpXTtcbiAgICB9XG4gIH1cblxuICBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF0gPSBwYXJlbnRMb2M7XG4gIHJldHVybiBpbmplY3RvckluZGV4O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRCbG9vbShhcnI6IGFueVtdLCBmb290ZXI6IFROb2RlfG51bGwpOiB2b2lkIHtcbiAgYXJyLnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgZm9vdGVyKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IG51bWJlciB7XG4gIGlmICh0Tm9kZS5pbmplY3RvckluZGV4ID09PSAtMSB8fFxuICAgICAgLy8gSWYgdGhlIGluamVjdG9yIGluZGV4IGlzIHRoZSBzYW1lIGFzIGl0cyBwYXJlbnQncyBpbmplY3RvciBpbmRleCwgdGhlbiB0aGUgaW5kZXggaGFzIGJlZW5cbiAgICAgIC8vIGNvcGllZCBkb3duIGZyb20gdGhlIHBhcmVudCBub2RlLiBObyBpbmplY3RvciBoYXMgYmVlbiBjcmVhdGVkIHlldCBvbiB0aGlzIG5vZGUuXG4gICAgICAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5pbmplY3RvckluZGV4KSB8fFxuICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmplY3RvciBpbmRleCBtaWdodCBleGlzdCBidXQgdGhlIHBhcmVudCB2YWx1ZXNcbiAgICAgIC8vIG1pZ2h0IG5vdCBoYXZlIGJlZW4gY2FsY3VsYXRlZCB5ZXQgZm9yIHRoaXMgaW5zdGFuY2VcbiAgICAgIGxWaWV3W3ROb2RlLmluamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCB0Tm9kZS5pbmplY3RvckluZGV4KTtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICpcbiAqIEByZXR1cm5zIFJldHVybnMgYSBudW1iZXIgdGhhdCBpcyB0aGUgY29tYmluYXRpb24gb2YgdGhlIG51bWJlciBvZiBMVmlld3MgdGhhdCB3ZSBoYXZlIHRvIGdvIHVwXG4gKiB0byBmaW5kIHRoZSBMVmlldyBjb250YWluaW5nIHRoZSBwYXJlbnQgaW5qZWN0IEFORCB0aGUgaW5kZXggb2YgdGhlIGluamVjdG9yIHdpdGhpbiB0aGF0IExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhIHBhcmVudCBgVE5vZGVgIGFuZCB0aGVyZSBpcyBhbiBpbmplY3RvciBhc3NvY2lhdGVkIHdpdGggaXQgd2UgYXJlIGRvbmUsIGJlY2F1c2VcbiAgICAvLyB0aGUgcGFyZW50IGluamVjdG9yIGlzIHdpdGhpbiB0aGUgY3VycmVudCBgTFZpZXdgLlxuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCBhcyBhbnk7ICAvLyBWaWV3T2Zmc2V0IGlzIDBcbiAgfVxuXG4gIC8vIFdoZW4gcGFyZW50IGluamVjdG9yIGxvY2F0aW9uIGlzIGNvbXB1dGVkIGl0IG1heSBiZSBvdXRzaWRlIG9mIHRoZSBjdXJyZW50IHZpZXcuIChpZSBpdCBjb3VsZFxuICAvLyBiZSBwb2ludGluZyB0byBhIGRlY2xhcmVkIHBhcmVudCBsb2NhdGlvbikuIFRoaXMgdmFyaWFibGUgc3RvcmVzIG51bWJlciBvZiBkZWNsYXJhdGlvbiBwYXJlbnRzXG4gIC8vIHdlIG5lZWQgdG8gd2FsayB1cCBpbiBvcmRlciB0byBmaW5kIHRoZSBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24uXG4gIGxldCBkZWNsYXJhdGlvblZpZXdPZmZzZXQgPSAwO1xuICBsZXQgcGFyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgbFZpZXdDdXJzb3I6IExWaWV3fG51bGwgPSBsVmlldztcblxuICAvLyBUaGUgcGFyZW50IGluamVjdG9yIGlzIG5vdCBpbiB0aGUgY3VycmVudCBgTFZpZXdgLiBXZSB3aWxsIGhhdmUgdG8gd2FsayB0aGUgZGVjbGFyZWQgcGFyZW50XG4gIC8vIGBMVmlld2AgaGllcmFyY2h5IGFuZCBsb29rIGZvciBpdC4gSWYgd2Ugd2FsayBvZiB0aGUgdG9wLCB0aGF0IG1lYW5zIHRoYXQgdGhlcmUgaXMgbm8gcGFyZW50XG4gIC8vIGBOb2RlSW5qZWN0b3JgLlxuICB3aGlsZSAobFZpZXdDdXJzb3IgIT09IG51bGwpIHtcbiAgICAvLyBGaXJzdCBkZXRlcm1pbmUgdGhlIGBwYXJlbnRUTm9kZWAgbG9jYXRpb24uIFRoZSBwYXJlbnQgcG9pbnRlciBkaWZmZXJzIGJhc2VkIG9uIGBUVmlldy50eXBlYC5cbiAgICBjb25zdCB0VmlldyA9IGxWaWV3Q3Vyc29yW1RWSUVXXTtcbiAgICBjb25zdCB0Vmlld1R5cGUgPSB0Vmlldy50eXBlO1xuICAgIGlmICh0Vmlld1R5cGUgPT09IFRWaWV3VHlwZS5FbWJlZGRlZCkge1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RGVmaW5lZCh0Vmlldy5kZWNsVE5vZGUsICdFbWJlZGRlZCBUTm9kZXMgc2hvdWxkIGhhdmUgZGVjbGFyYXRpb24gcGFyZW50cy4nKTtcbiAgICAgIHBhcmVudFROb2RlID0gdFZpZXcuZGVjbFROb2RlO1xuICAgIH0gZWxzZSBpZiAodFZpZXdUeXBlID09PSBUVmlld1R5cGUuQ29tcG9uZW50KSB7XG4gICAgICAvLyBDb21wb25lbnRzIGRvbid0IGhhdmUgYFRWaWV3LmRlY2xUTm9kZWAgYmVjYXVzZSBlYWNoIGluc3RhbmNlIG9mIGNvbXBvbmVudCBjb3VsZCBiZVxuICAgICAgLy8gaW5zZXJ0ZWQgaW4gZGlmZmVyZW50IGxvY2F0aW9uLCBoZW5jZSBgVFZpZXcuZGVjbFROb2RlYCBpcyBtZWFuaW5nbGVzcy5cbiAgICAgIHBhcmVudFROb2RlID0gbFZpZXdDdXJzb3JbVF9IT1NUXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LnR5cGUsIFRWaWV3VHlwZS5Sb290LCAnUm9vdCB0eXBlIGV4cGVjdGVkJyk7XG4gICAgICBwYXJlbnRUTm9kZSA9IG51bGw7XG4gICAgfVxuICAgIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBwYXJlbnQsIHRoYW4gd2UgYXJlIGRvbmUuXG4gICAgICByZXR1cm4gTk9fUEFSRU5UX0lOSkVDVE9SO1xuICAgIH1cblxuICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRUTm9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHBhcmVudFROb2RlISwgbFZpZXdDdXJzb3JbREVDTEFSQVRJT05fVklFV10hKTtcbiAgICAvLyBFdmVyeSBpdGVyYXRpb24gb2YgdGhlIGxvb3AgcmVxdWlyZXMgdGhhdCB3ZSBnbyB0byB0aGUgZGVjbGFyZWQgcGFyZW50LlxuICAgIGRlY2xhcmF0aW9uVmlld09mZnNldCsrO1xuICAgIGxWaWV3Q3Vyc29yID0gbFZpZXdDdXJzb3JbREVDTEFSQVRJT05fVklFV107XG5cbiAgICBpZiAocGFyZW50VE5vZGUuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIGZvdW5kIGEgTm9kZUluamVjdG9yIHdoaWNoIHBvaW50cyB0byBzb21ldGhpbmcuXG4gICAgICByZXR1cm4gKHBhcmVudFROb2RlLmluamVjdG9ySW5kZXggfFxuICAgICAgICAgICAgICAoZGVjbGFyYXRpb25WaWV3T2Zmc2V0IDw8IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkpIGFzIGFueTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIE5PX1BBUkVOVF9JTkpFQ1RPUjtcbn1cbi8qKlxuICogTWFrZXMgYSB0eXBlIG9yIGFuIGluamVjdGlvbiB0b2tlbiBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW5cbiAqIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHR5cGUgb3IgdGhlIGluamVjdGlvbiB0b2tlbiB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0b2tlbjogSW5qZWN0aW9uVG9rZW48YW55PnxUeXBlPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoaW5qZWN0b3JJbmRleCwgdFZpZXcsIHRva2VuKTtcbn1cblxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lsm1Y21wID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlSW1wbCh0Tm9kZTogVE5vZGUsIGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3xudWxsIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFROb2RlVHlwZSh0Tm9kZSwgVE5vZGVUeXBlLkFueUNvbnRhaW5lciB8IFROb2RlVHlwZS5BbnlSTm9kZSk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGlmIChhdHRyTmFtZVRvSW5qZWN0ID09PSAnY2xhc3MnKSB7XG4gICAgcmV0dXJuIHROb2RlLmNsYXNzZXM7XG4gIH1cbiAgaWYgKGF0dHJOYW1lVG9JbmplY3QgPT09ICdzdHlsZScpIHtcbiAgICByZXR1cm4gdE5vZGUuc3R5bGVzO1xuICB9XG5cbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgY29uc3QgYXR0cnNMZW5ndGggPSBhdHRycy5sZW5ndGg7XG4gICAgbGV0IGkgPSAwO1xuICAgIHdoaWxlIChpIDwgYXR0cnNMZW5ndGgpIHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYXR0cnNbaV07XG5cbiAgICAgIC8vIElmIHdlIGhpdCBhIGBCaW5kaW5nc2Agb3IgYFRlbXBsYXRlYCBtYXJrZXIgdGhlbiB3ZSBhcmUgZG9uZS5cbiAgICAgIGlmIChpc05hbWVPbmx5QXR0cmlidXRlTWFya2VyKHZhbHVlKSkgYnJlYWs7XG5cbiAgICAgIC8vIFNraXAgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzXG4gICAgICBpZiAodmFsdWUgPT09IEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkkpIHtcbiAgICAgICAgLy8gd2Ugc2tpcCB0aGUgbmV4dCB0d28gdmFsdWVzXG4gICAgICAgIC8vIGFzIG5hbWVzcGFjZWQgYXR0cmlidXRlcyBsb29rcyBsaWtlXG4gICAgICAgIC8vIFsuLi4sIEF0dHJpYnV0ZU1hcmtlci5OYW1lc3BhY2VVUkksICdodHRwOi8vc29tZXVyaS5jb20vdGVzdCcsICd0ZXN0OmV4aXN0JyxcbiAgICAgICAgLy8gJ2V4aXN0VmFsdWUnLCAuLi5dXG4gICAgICAgIGkgPSBpICsgMjtcbiAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJykge1xuICAgICAgICAvLyBTa2lwIHRvIHRoZSBmaXJzdCB2YWx1ZSBvZiB0aGUgbWFya2VkIGF0dHJpYnV0ZS5cbiAgICAgICAgaSsrO1xuICAgICAgICB3aGlsZSAoaSA8IGF0dHJzTGVuZ3RoICYmIHR5cGVvZiBhdHRyc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gaSArIDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbmZ1bmN0aW9uIG5vdEZvdW5kVmFsdWVPclRocm93PFQ+KFxuICAgIG5vdEZvdW5kVmFsdWU6IFR8bnVsbCwgdG9rZW46IFR5cGU8VD58QWJzdHJhY3RUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUfFxuICAgIG51bGwge1xuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkge1xuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuLCAnTm9kZUluamVjdG9yJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBNb2R1bGVJbmplY3RvciBvciB0aHJvd3MgZXhjZXB0aW9uXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGB0Tm9kZWBcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEBwYXJhbSBub3RGb3VuZFZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gd2hlbiB0aGUgaW5qZWN0aW9uIGZsYWdzIGlzIGBJbmplY3RGbGFncy5PcHRpb25hbGBcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciB0aHJvd3MgYW4gZXhjZXB0aW9uXG4gKi9cbmZ1bmN0aW9uIGxvb2t1cFRva2VuVXNpbmdNb2R1bGVJbmplY3RvcjxUPihcbiAgICBsVmlldzogTFZpZXcsIHRva2VuOiBUeXBlPFQ+fEFic3RyYWN0VHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzLFxuICAgIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCAmJiBub3RGb3VuZFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGlzIG11c3QgYmUgc2V0IG9yIHRoZSBOdWxsSW5qZWN0b3Igd2lsbCB0aHJvdyBmb3Igb3B0aW9uYWwgZGVwc1xuICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICB9XG5cbiAgaWYgKChmbGFncyAmIChJbmplY3RGbGFncy5TZWxmIHwgSW5qZWN0RmxhZ3MuSG9zdCkpID09PSAwKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gICAgLy8gc3dpdGNoIHRvIGBpbmplY3RJbmplY3Rvck9ubHlgIGltcGxlbWVudGF0aW9uIGZvciBtb2R1bGUgaW5qZWN0b3IsIHNpbmNlIG1vZHVsZSBpbmplY3RvclxuICAgIC8vIHNob3VsZCBub3QgaGF2ZSBhY2Nlc3MgdG8gQ29tcG9uZW50L0RpcmVjdGl2ZSBESSBzY29wZSAodGhhdCBtYXkgaGFwcGVuIHRocm91Z2hcbiAgICAvLyBgZGlyZWN0aXZlSW5qZWN0YCBpbXBsZW1lbnRhdGlvbilcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgaWYgKG1vZHVsZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm90Rm91bmRWYWx1ZU9yVGhyb3c8VD4obm90Rm91bmRWYWx1ZSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBOb2RlSW5qZWN0b3JzID0+IE1vZHVsZUluamVjdG9yLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcGF0Y2hlcyBgdG9rZW5gIHdpdGggYF9fTkdfRUxFTUVOVF9JRF9fYCB3aGljaCBjb250YWlucyB0aGUgaWQgZm9yIHRoZSBibG9vbVxuICogZmlsdGVyLiBgLTFgIGlzIHJlc2VydmVkIGZvciBpbmplY3RpbmcgYEluamVjdG9yYCAoaW1wbGVtZW50ZWQgYnkgYE5vZGVJbmplY3RvcmApXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBOb2RlIHdoZXJlIHRoZSBzZWFyY2ggZm9yIHRoZSBpbmplY3RvciBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBgdE5vZGVgXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHRva2VuIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcGFyYW0gbm90Rm91bmRWYWx1ZSBUaGUgdmFsdWUgdG8gcmV0dXJuIHdoZW4gdGhlIGluamVjdGlvbiBmbGFncyBpcyBgSW5qZWN0RmxhZ3MuT3B0aW9uYWxgXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3IsIGBudWxsYCB3aGVuIG5vdCBmb3VuZCwgb3IgYG5vdEZvdW5kVmFsdWVgIGlmIHByb3ZpZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZXxudWxsLCBsVmlldzogTFZpZXcsIHRva2VuOiBUeXBlPFQ+fEFic3RyYWN0VHlwZTxUPnxJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0LCBub3RGb3VuZFZhbHVlPzogYW55KTogVHxudWxsIHtcbiAgaWYgKHROb2RlICE9PSBudWxsKSB7XG4gICAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAgIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gICAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGlmICghZW50ZXJESShsVmlldywgdE5vZGUsIGZsYWdzKSkge1xuICAgICAgICAvLyBGYWlsZWQgdG8gZW50ZXIgREksIHRyeSBtb2R1bGUgaW5qZWN0b3IgaW5zdGVhZC4gSWYgYSB0b2tlbiBpcyBpbmplY3RlZCB3aXRoIHRoZSBASG9zdFxuICAgICAgICAvLyBmbGFnLCB0aGUgbW9kdWxlIGluamVjdG9yIGlzIG5vdCBzZWFyY2hlZCBmb3IgdGhhdCB0b2tlbiBpbiBJdnkuXG4gICAgICAgIHJldHVybiAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0KSA/XG4gICAgICAgICAgICBub3RGb3VuZFZhbHVlT3JUaHJvdzxUPihub3RGb3VuZFZhbHVlLCB0b2tlbiwgZmxhZ3MpIDpcbiAgICAgICAgICAgIGxvb2t1cFRva2VuVXNpbmdNb2R1bGVJbmplY3RvcjxUPihsVmlldywgdG9rZW4sIGZsYWdzLCBub3RGb3VuZFZhbHVlKTtcbiAgICAgIH1cbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkpIHtcbiAgICAgICAgICB0aHJvd1Byb3ZpZGVyTm90Rm91bmRFcnJvcih0b2tlbik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICB9IGZpbmFsbHkge1xuICAgICAgICBsZWF2ZURJKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnbnVtYmVyJykge1xuICAgICAgLy8gQSByZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIGluamVjdG9yIFRWaWV3IHRoYXQgd2FzIGZvdW5kIHdoaWxlIGNsaW1iaW5nIHRoZSBlbGVtZW50XG4gICAgICAvLyBpbmplY3RvciB0cmVlLiBUaGlzIGlzIHVzZWQgdG8ga25vdyBpZiB2aWV3UHJvdmlkZXJzIGNhbiBiZSBhY2Nlc3NlZCBvbiB0aGUgY3VycmVudFxuICAgICAgLy8gaW5qZWN0b3IuXG4gICAgICBsZXQgcHJldmlvdXNUVmlldzogVFZpZXd8bnVsbCA9IG51bGw7XG4gICAgICBsZXQgaW5qZWN0b3JJbmRleCA9IGdldEluamVjdG9ySW5kZXgodE5vZGUsIGxWaWV3KTtcbiAgICAgIGxldCBwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gTk9fUEFSRU5UX0lOSkVDVE9SO1xuICAgICAgbGV0IGhvc3RURWxlbWVudE5vZGU6IFROb2RlfG51bGwgPVxuICAgICAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCA/IGxWaWV3W0RFQ0xBUkFUSU9OX0NPTVBPTkVOVF9WSUVXXVtUX0hPU1RdIDogbnVsbDtcblxuICAgICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3Rvciwgb3IgaWYgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlLCBzdGFydCBieVxuICAgICAgLy8gc2VhcmNoaW5nIHRoZSBwYXJlbnQgaW5qZWN0b3IuXG4gICAgICBpZiAoaW5qZWN0b3JJbmRleCA9PT0gLTEgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikge1xuICAgICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXTtcblxuICAgICAgICBpZiAocGFyZW50TG9jYXRpb24gPT09IE5PX1BBUkVOVF9JTkpFQ1RPUiB8fCAhc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzLCBmYWxzZSkpIHtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJldmlvdXNUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmVcbiAgICAgIC8vICppc24ndCogYSBtYXRjaC5cbiAgICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZUluamVjdG9yKGxWaWV3LCBpbmplY3RvckluZGV4KTtcblxuICAgICAgICAvLyBDaGVjayB0aGUgY3VycmVudCBpbmplY3Rvci4gSWYgaXQgbWF0Y2hlcywgc2VlIGlmIGl0IGNvbnRhaW5zIHRva2VuLlxuICAgICAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgICBhc3NlcnRUTm9kZUZvckxWaWV3KFxuICAgICAgICAgICAgICAgIHRWaWV3LmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVE5vZGUsIGxWaWV3KTtcbiAgICAgICAgaWYgKGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCB0Vmlldy5kYXRhKSkge1xuICAgICAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaFxuICAgICAgICAgIC8vIHRoZSBwcm92aWRlcnMgYW5kIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXRcbiAgICAgICAgICAvLyB0aGUgaW5zdGFuY2UuXG4gICAgICAgICAgY29uc3QgaW5zdGFuY2U6IFR8bnVsbCA9IHNlYXJjaFRva2Vuc09uSW5qZWN0b3I8VD4oXG4gICAgICAgICAgICAgIGluamVjdG9ySW5kZXgsIGxWaWV3LCB0b2tlbiwgcHJldmlvdXNUVmlldywgZmxhZ3MsIGhvc3RURWxlbWVudE5vZGUpO1xuICAgICAgICAgIGlmIChpbnN0YW5jZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhcmVudExvY2F0aW9uID0gbFZpZXdbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5QQVJFTlRdO1xuICAgICAgICBpZiAocGFyZW50TG9jYXRpb24gIT09IE5PX1BBUkVOVF9JTkpFQ1RPUiAmJlxuICAgICAgICAgICAgc2hvdWxkU2VhcmNoUGFyZW50KFxuICAgICAgICAgICAgICAgIGZsYWdzLFxuICAgICAgICAgICAgICAgIGxWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdID09PSBob3N0VEVsZW1lbnROb2RlKSAmJlxuICAgICAgICAgICAgYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGxWaWV3KSkge1xuICAgICAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAgICAgLy8gVHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgICAgICBwcmV2aW91c1RWaWV3ID0gdFZpZXc7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gSWYgd2Ugc2hvdWxkIG5vdCBzZWFyY2ggcGFyZW50IE9SIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgZG9lcyBub3QgaGF2ZSB0aGVcbiAgICAgICAgICAvLyBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlIHdlIGNhbiBnaXZlIHVwIG9uIHRyYXZlcnNpbmcgdXAgdG8gZmluZCB0aGUgc3BlY2lmaWNcbiAgICAgICAgICAvLyBpbmplY3Rvci5cbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gbG9va3VwVG9rZW5Vc2luZ01vZHVsZUluamVjdG9yPFQ+KGxWaWV3LCB0b2tlbiwgZmxhZ3MsIG5vdEZvdW5kVmFsdWUpO1xufVxuXG5jb25zdCBOT1RfRk9VTkQgPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVJbmplY3RvcigpOiBJbmplY3RvciB7XG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKGdldEN1cnJlbnRUTm9kZSgpISBhcyBURGlyZWN0aXZlSG9zdE5vZGUsIGdldExWaWV3KCkpIGFzIGFueTtcbn1cblxuZnVuY3Rpb24gc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIGxWaWV3OiBMVmlldywgdG9rZW46IFR5cGU8VD58QWJzdHJhY3RUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LFxuICAgIHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwsIGZsYWdzOiBJbmplY3RGbGFncywgaG9zdFRFbGVtZW50Tm9kZTogVE5vZGV8bnVsbCkge1xuICBjb25zdCBjdXJyZW50VFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHROb2RlID0gY3VycmVudFRWaWV3LmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gYXMgVE5vZGU7XG4gIC8vIEZpcnN0LCB3ZSBuZWVkIHRvIGRldGVybWluZSBpZiB2aWV3IHByb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgYnkgdGhlIHN0YXJ0aW5nIGVsZW1lbnQuXG4gIC8vIFRoZXJlIGFyZSB0d28gcG9zc2liaWxpdGllc1xuICBjb25zdCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID0gcHJldmlvdXNUVmlldyA9PSBudWxsID9cbiAgICAgIC8vIDEpIFRoaXMgaXMgdGhlIGZpcnN0IGludm9jYXRpb24gYHByZXZpb3VzVFZpZXcgPT0gbnVsbGAgd2hpY2ggbWVhbnMgdGhhdCB3ZSBhcmUgYXQgdGhlXG4gICAgICAvLyBgVE5vZGVgIG9mIHdoZXJlIGluamVjdG9yIGlzIHN0YXJ0aW5nIHRvIGxvb2suIEluIHN1Y2ggYSBjYXNlIHRoZSBvbmx5IHRpbWUgd2UgYXJlIGFsbG93ZWRcbiAgICAgIC8vIHRvIGxvb2sgaW50byB0aGUgVmlld1Byb3ZpZGVycyBpcyBpZjpcbiAgICAgIC8vIC0gd2UgYXJlIG9uIGEgY29tcG9uZW50XG4gICAgICAvLyAtIEFORCB0aGUgaW5qZWN0b3Igc2V0IGBpbmNsdWRlVmlld1Byb3ZpZGVyc2AgdG8gdHJ1ZSAoaW1wbHlpbmcgdGhhdCB0aGUgdG9rZW4gY2FuIHNlZVxuICAgICAgLy8gVmlld1Byb3ZpZGVycyBiZWNhdXNlIGl0IGlzIHRoZSBDb21wb25lbnQgb3IgYSBTZXJ2aWNlIHdoaWNoIGl0c2VsZiB3YXMgZGVjbGFyZWQgaW5cbiAgICAgIC8vIFZpZXdQcm92aWRlcnMpXG4gICAgICAoaXNDb21wb25lbnRIb3N0KHROb2RlKSAmJiBpbmNsdWRlVmlld1Byb3ZpZGVycykgOlxuICAgICAgLy8gMikgYHByZXZpb3VzVFZpZXcgIT0gbnVsbGAgd2hpY2ggbWVhbnMgdGhhdCB3ZSBhcmUgbm93IHdhbGtpbmcgYWNyb3NzIHRoZSBwYXJlbnQgbm9kZXMuXG4gICAgICAvLyBJbiBzdWNoIGEgY2FzZSB3ZSBhcmUgb25seSBhbGxvd2VkIHRvIGxvb2sgaW50byB0aGUgVmlld1Byb3ZpZGVycyBpZjpcbiAgICAgIC8vIC0gV2UganVzdCBjcm9zc2VkIGZyb20gY2hpbGQgVmlldyB0byBQYXJlbnQgVmlldyBgcHJldmlvdXNUVmlldyAhPSBjdXJyZW50VFZpZXdgXG4gICAgICAvLyAtIEFORCB0aGUgcGFyZW50IFROb2RlIGlzIGFuIEVsZW1lbnQuXG4gICAgICAvLyBUaGlzIG1lYW5zIHRoYXQgd2UganVzdCBjYW1lIGZyb20gdGhlIENvbXBvbmVudCdzIFZpZXcgYW5kIHRoZXJlZm9yZSBhcmUgYWxsb3dlZCB0byBzZWVcbiAgICAgIC8vIGludG8gdGhlIFZpZXdQcm92aWRlcnMuXG4gICAgICAocHJldmlvdXNUVmlldyAhPSBjdXJyZW50VFZpZXcgJiYgKCh0Tm9kZS50eXBlICYgVE5vZGVUeXBlLkFueVJOb2RlKSAhPT0gMCkpO1xuXG4gIC8vIFRoaXMgc3BlY2lhbCBjYXNlIGhhcHBlbnMgd2hlbiB0aGVyZSBpcyBhIEBob3N0IG9uIHRoZSBpbmplY3QgYW5kIHdoZW4gd2UgYXJlIHNlYXJjaGluZ1xuICAvLyBvbiB0aGUgaG9zdCBlbGVtZW50IG5vZGUuXG4gIGNvbnN0IGlzSG9zdFNwZWNpYWxDYXNlID0gKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCkgJiYgaG9zdFRFbGVtZW50Tm9kZSA9PT0gdE5vZGU7XG5cbiAgY29uc3QgaW5qZWN0YWJsZUlkeCA9IGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXIoXG4gICAgICB0Tm9kZSwgY3VycmVudFRWaWV3LCB0b2tlbiwgY2FuQWNjZXNzVmlld1Byb3ZpZGVycywgaXNIb3N0U3BlY2lhbENhc2UpO1xuICBpZiAoaW5qZWN0YWJsZUlkeCAhPT0gbnVsbCkge1xuICAgIHJldHVybiBnZXROb2RlSW5qZWN0YWJsZShsVmlldywgY3VycmVudFRWaWV3LCBpbmplY3RhYmxlSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBOT1RfRk9VTkQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgdGhlIGdpdmVuIHRva2VuIGFtb25nIHRoZSBub2RlJ3MgZGlyZWN0aXZlcyBhbmQgcHJvdmlkZXJzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSBvbiB3aGljaCBkaXJlY3RpdmVzIGFyZSBwcmVzZW50LlxuICogQHBhcmFtIHRWaWV3IFRoZSB0VmlldyB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSB0b2tlbiBQcm92aWRlciB0b2tlbiBvciB0eXBlIG9mIGEgZGlyZWN0aXZlIHRvIGxvb2sgZm9yLlxuICogQHBhcmFtIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgV2hldGhlciB2aWV3IHByb3ZpZGVycyBzaG91bGQgYmUgY29uc2lkZXJlZC5cbiAqIEBwYXJhbSBpc0hvc3RTcGVjaWFsQ2FzZSBXaGV0aGVyIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLlxuICogQHJldHVybnMgSW5kZXggb2YgYSBmb3VuZCBkaXJlY3RpdmUgb3IgcHJvdmlkZXIsIG9yIG51bGwgd2hlbiBub25lIGZvdW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcjxUPihcbiAgICB0Tm9kZTogVE5vZGUsIHRWaWV3OiBUVmlldywgdG9rZW46IFR5cGU8VD58QWJzdHJhY3RUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+fHN0cmluZyxcbiAgICBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzOiBib29sZWFuLCBpc0hvc3RTcGVjaWFsQ2FzZTogYm9vbGVhbnxudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IG5vZGVQcm92aWRlckluZGV4ZXMgPSB0Tm9kZS5wcm92aWRlckluZGV4ZXM7XG4gIGNvbnN0IHRJbmplY3RhYmxlcyA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgaW5qZWN0YWJsZXNTdGFydCA9IG5vZGVQcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZGlyZWN0aXZlc1N0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgY3B0Vmlld1Byb3ZpZGVyc0NvdW50ID1cbiAgICAgIG5vZGVQcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG4gIGNvbnN0IHN0YXJ0aW5nSW5kZXggPVxuICAgICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA/IGluamVjdGFibGVzU3RhcnQgOiBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50O1xuICAvLyBXaGVuIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLCBvbmx5IHRoZSB2aWV3UHJvdmlkZXJzIGFuZCB0aGUgY29tcG9uZW50IGFyZSB2aXNpYmxlXG4gIGNvbnN0IGVuZEluZGV4ID0gaXNIb3N0U3BlY2lhbENhc2UgPyBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50IDogZGlyZWN0aXZlRW5kO1xuICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlclRva2VuT3JEZWYgPVxuICAgICAgICB0SW5qZWN0YWJsZXNbaV0gYXMgSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+fCBEaXJlY3RpdmVEZWY8YW55Pnwgc3RyaW5nO1xuICAgIGlmIChpIDwgZGlyZWN0aXZlc1N0YXJ0ICYmIHRva2VuID09PSBwcm92aWRlclRva2VuT3JEZWYgfHxcbiAgICAgICAgaSA+PSBkaXJlY3RpdmVzU3RhcnQgJiYgKHByb3ZpZGVyVG9rZW5PckRlZiBhcyBEaXJlY3RpdmVEZWY8YW55PikudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNIb3N0U3BlY2lhbENhc2UpIHtcbiAgICBjb25zdCBkaXJEZWYgPSB0SW5qZWN0YWJsZXNbZGlyZWN0aXZlc1N0YXJ0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGlyRGVmICYmIGlzQ29tcG9uZW50RGVmKGRpckRlZikgJiYgZGlyRGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gZGlyZWN0aXZlc1N0YXJ0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBvciBpbnN0YW50aWF0ZSB0aGUgaW5qZWN0YWJsZSBmcm9tIHRoZSBgTFZpZXdgIGF0IHBhcnRpY3VsYXIgYGluZGV4YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlIHZhbHVlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkIGFuZCBpZiBzbyByZXR1cm5zIHRoZVxuICogY2FjaGVkIGBpbmplY3RhYmxlYC4gT3RoZXJ3aXNlIGlmIGl0IGRldGVjdHMgdGhhdCB0aGUgdmFsdWUgaXMgc3RpbGwgYSBmYWN0b3J5IGl0XG4gKiBpbnN0YW50aWF0ZXMgdGhlIGBpbmplY3RhYmxlYCBhbmQgY2FjaGVzIHRoZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVJbmplY3RhYmxlKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbFZpZXdbaW5kZXhdO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmIChpc0ZhY3RvcnkodmFsdWUpKSB7XG4gICAgY29uc3QgZmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSA9IHZhbHVlO1xuICAgIGlmIChmYWN0b3J5LnJlc29sdmluZykge1xuICAgICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3Ioc3RyaW5naWZ5Rm9yRXJyb3IodERhdGFbaW5kZXhdKSk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMgPSBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhmYWN0b3J5LmNhblNlZVZpZXdQcm92aWRlcnMpO1xuICAgIGZhY3RvcnkucmVzb2x2aW5nID0gdHJ1ZTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID1cbiAgICAgICAgZmFjdG9yeS5pbmplY3RJbXBsID8gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oZmFjdG9yeS5pbmplY3RJbXBsKSA6IG51bGw7XG4gICAgY29uc3Qgc3VjY2VzcyA9IGVudGVyREkobFZpZXcsIHROb2RlLCBJbmplY3RGbGFncy5EZWZhdWx0KTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBzdWNjZXNzLCB0cnVlLFxuICAgICAgICAgICAgJ0JlY2F1c2UgZmxhZ3MgZG8gbm90IGNvbnRhaW4gXFxgU2tpcFNlbGZcXCcgd2UgZXhwZWN0IHRoaXMgdG8gYWx3YXlzIHN1Y2NlZWQuJyk7XG4gICAgdHJ5IHtcbiAgICAgIHZhbHVlID0gbFZpZXdbaW5kZXhdID0gZmFjdG9yeS5mYWN0b3J5KHVuZGVmaW5lZCwgdERhdGEsIGxWaWV3LCB0Tm9kZSk7XG4gICAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBoaXQgZm9yIGJvdGggZGlyZWN0aXZlcyBhbmQgcHJvdmlkZXJzLlxuICAgICAgLy8gRm9yIHBlcmYgcmVhc29ucywgd2Ugd2FudCB0byBhdm9pZCBzZWFyY2hpbmcgZm9yIGhvb2tzIG9uIHByb3ZpZGVycy5cbiAgICAgIC8vIEl0IGRvZXMgbm8gaGFybSB0byB0cnkgKHRoZSBob29rcyBqdXN0IHdvbid0IGV4aXN0KSwgYnV0IHRoZSBleHRyYVxuICAgICAgLy8gY2hlY2tzIGFyZSB1bm5lY2Vzc2FyeSBhbmQgdGhpcyBpcyBhIGhvdCBwYXRoLiBTbyB3ZSBjaGVjayB0byBzZWVcbiAgICAgIC8vIGlmIHRoZSBpbmRleCBvZiB0aGUgZGVwZW5kZW5jeSBpcyBpbiB0aGUgZGlyZWN0aXZlIHJhbmdlIGZvciB0aGlzXG4gICAgICAvLyB0Tm9kZS4gSWYgaXQncyBub3QsIHdlIGtub3cgaXQncyBhIHByb3ZpZGVyIGFuZCBza2lwIGhvb2sgcmVnaXN0cmF0aW9uLlxuICAgICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJiBpbmRleCA+PSB0Tm9kZS5kaXJlY3RpdmVTdGFydCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGlyZWN0aXZlRGVmKHREYXRhW2luZGV4XSk7XG4gICAgICAgIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhpbmRleCwgdERhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+LCB0Vmlldyk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gIT09IG51bGwgJiZcbiAgICAgICAgICBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uKTtcbiAgICAgIHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMpO1xuICAgICAgZmFjdG9yeS5yZXNvbHZpbmcgPSBmYWxzZTtcbiAgICAgIGxlYXZlREkoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlciB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGRpcmVjdGl2ZSBtaWdodCBiZSBwcm92aWRlZCBieSB0aGUgaW5qZWN0b3IuXG4gKlxuICogV2hlbiBhIGRpcmVjdGl2ZSBpcyBwdWJsaWMsIGl0IGlzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIgYW5kIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIFR5cGUuIFdoZW4gdGhlIGRpcmVjdGl2ZSBpc24ndCBwdWJsaWMgb3IgdGhlIHRva2VuIGlzIG5vdCBhIGRpcmVjdGl2ZSBgbnVsbGBcbiAqIGlzIHJldHVybmVkIGFzIHRoZSBub2RlIGluamVjdG9yIGNhbiBub3QgcG9zc2libHkgcHJvdmlkZSB0aGF0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgaW5qZWN0aW9uIHRva2VuXG4gKiBAcmV0dXJucyB0aGUgbWF0Y2hpbmcgYml0IHRvIGNoZWNrIGluIHRoZSBibG9vbSBmaWx0ZXIgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBpcyBub3Qga25vd24uXG4gKiAgIFdoZW4gdGhlIHJldHVybmVkIHZhbHVlIGlzIG5lZ2F0aXZlIHRoZW4gaXQgcmVwcmVzZW50cyBzcGVjaWFsIHZhbHVlcyBzdWNoIGFzIGBJbmplY3RvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW46IFR5cGU8YW55PnxBYnN0cmFjdFR5cGU8YW55PnxJbmplY3Rpb25Ub2tlbjxhbnk+fFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzdHJpbmcpOiBudW1iZXJ8RnVuY3Rpb258dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdG9rZW4uY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPVxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2l0aCBgaGFzT3duUHJvcGVydHlgIHNvIHdlIGRvbid0IGdldCBhbiBpbmhlcml0ZWQgSUQuXG4gICAgICB0b2tlbi5oYXNPd25Qcm9wZXJ0eShOR19FTEVNRU5UX0lEKSA/ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdIDogdW5kZWZpbmVkO1xuICAvLyBOZWdhdGl2ZSB0b2tlbiBJRHMgYXJlIHVzZWQgZm9yIHNwZWNpYWwgb2JqZWN0cyBzdWNoIGFzIGBJbmplY3RvcmBcbiAgaWYgKHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0b2tlbklkID49IDApIHtcbiAgICAgIHJldHVybiB0b2tlbklkICYgQkxPT01fTUFTSztcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwodG9rZW5JZCwgSW5qZWN0b3JNYXJrZXJzLkluamVjdG9yLCAnRXhwZWN0aW5nIHRvIGdldCBTcGVjaWFsIEluamVjdG9yIElkJyk7XG4gICAgICByZXR1cm4gY3JlYXRlTm9kZUluamVjdG9yO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdG9rZW5JZDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3fFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuXG4gIC8vIEVhY2ggYmxvb20gYnVja2V0IGluIGBpbmplY3RvclZpZXdgIHJlcHJlc2VudHMgYEJMT09NX0JVQ0tFVF9CSVRTYCBudW1iZXIgb2YgYml0cyBvZlxuICAvLyBgYmxvb21IYXNoYC4gQW55IGJpdHMgaW4gYGJsb29tSGFzaGAgYmV5b25kIGBCTE9PTV9CVUNLRVRfQklUU2AgaW5kaWNhdGUgdGhlIGJ1Y2tldCBvZmZzZXRcbiAgLy8gdGhhdCBzaG91bGQgYmUgdXNlZC5cbiAgY29uc3QgdmFsdWUgPSBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIChibG9vbUhhc2ggPj4gQkxPT01fQlVDS0VUX0JJVFMpXTtcblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgaXNGaXJzdEhvc3RUTm9kZTogYm9vbGVhbik6IGJvb2xlYW58bnVtYmVyIHtcbiAgcmV0dXJuICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiBpc0ZpcnN0SG9zdFROb2RlKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsLFxuICAgICAgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIHVuZGVmaW5lZCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICByZXR1cm4gbm9TaWRlRWZmZWN0cygoKSA9PiB7XG4gICAgY29uc3Qgb3duQ29uc3RydWN0b3IgPSB0eXBlLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcbiAgICBjb25zdCBvd25GYWN0b3J5ID0gb3duQ29uc3RydWN0b3JbTkdfRkFDVE9SWV9ERUZdIHx8IGdldEZhY3RvcnlPZihvd25Db25zdHJ1Y3Rvcik7XG4gICAgY29uc3Qgb2JqZWN0UHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgICBsZXQgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIEdvIHVwIHRoZSBwcm90b3R5cGUgdW50aWwgd2UgaGl0IGBPYmplY3RgLlxuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBvYmplY3RQcm90b3R5cGUpIHtcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBwYXJlbnRbTkdfRkFDVE9SWV9ERUZdIHx8IGdldEZhY3RvcnlPZihwYXJlbnQpO1xuXG4gICAgICAvLyBJZiB3ZSBoaXQgc29tZXRoaW5nIHRoYXQgaGFzIGEgZmFjdG9yeSBhbmQgdGhlIGZhY3RvcnkgaXNuJ3QgdGhlIHNhbWUgYXMgdGhlIHR5cGUsXG4gICAgICAvLyB3ZSd2ZSBmb3VuZCB0aGUgaW5oZXJpdGVkIGZhY3RvcnkuIE5vdGUgdGhlIGNoZWNrIHRoYXQgdGhlIGZhY3RvcnkgaXNuJ3QgdGhlIHR5cGUnc1xuICAgICAgLy8gb3duIGZhY3RvcnkgaXMgcmVkdW5kYW50IGluIG1vc3QgY2FzZXMsIGJ1dCBpZiB0aGUgdXNlciBoYXMgY3VzdG9tIGRlY29yYXRvcnMgb24gdGhlXG4gICAgICAvLyBjbGFzcywgdGhpcyBsb29rdXAgd2lsbCBzdGFydCBvbmUgbGV2ZWwgZG93biBpbiB0aGUgcHJvdG90eXBlIGNoYWluLCBjYXVzaW5nIHVzIHRvXG4gICAgICAvLyBmaW5kIHRoZSBvd24gZmFjdG9yeSBmaXJzdCBhbmQgcG90ZW50aWFsbHkgdHJpZ2dlcmluZyBhbiBpbmZpbml0ZSBsb29wIGRvd25zdHJlYW0uXG4gICAgICBpZiAoZmFjdG9yeSAmJiBmYWN0b3J5ICE9PSBvd25GYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgICAgfVxuXG4gICAgICBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuIHQgPT4gbmV3IHQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiBGYWN0b3J5Rm48VD58bnVsbCB7XG4gIGNvbnN0IHR5cGVBbnkgPSB0eXBlIGFzIGFueTtcblxuICBpZiAoaXNGb3J3YXJkUmVmKHR5cGUpKSB7XG4gICAgcmV0dXJuICgoKSA9PiB7XG4gICAgICAgICAgICAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlPZjxUPihyZXNvbHZlRm9yd2FyZFJlZih0eXBlQW55KSk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhY3RvcnkgPyBmYWN0b3J5KCkgOiBudWxsO1xuICAgICAgICAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBsZXQgZmFjdG9yeSA9IGdldEZhY3RvcnlEZWY8VD4odHlwZUFueSk7XG4gIGlmIChmYWN0b3J5ID09PSBudWxsKSB7XG4gICAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgICBmYWN0b3J5ID0gaW5qZWN0b3JEZWYgJiYgaW5qZWN0b3JEZWYuZmFjdG9yeTtcbiAgfVxuICByZXR1cm4gZmFjdG9yeSB8fCBudWxsO1xufVxuIl19