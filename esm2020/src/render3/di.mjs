/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { isForwardRef, resolveForwardRef } from '../di/forward_ref';
import { injectRootLimpMode, setInjectImplementation } from '../di/inject_switch';
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
import { DECLARATION_COMPONENT_VIEW, DECLARATION_VIEW, EMBEDDED_VIEW_INJECTOR, FLAGS, INJECTOR, T_HOST, TVIEW } from './interfaces/view';
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
/** Value used when something wasn't found by an injector. */
const NOT_FOUND = {};
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
        parentTNode = getTNodeFromLView(lViewCursor);
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
        // If the view or any of its ancestors have an embedded
        // view injector, we have to look it up there first.
        if (lView[FLAGS] & 2048 /* HasEmbeddedViewInjector */) {
            const embeddedInjectorValue = lookupTokenUsingEmbeddedInjector(tNode, lView, token, flags, NOT_FOUND);
            if (embeddedInjectorValue !== NOT_FOUND) {
                return embeddedInjectorValue;
            }
        }
        // Otherwise try the node injector.
        const value = lookupTokenUsingNodeInjector(tNode, lView, token, flags, NOT_FOUND);
        if (value !== NOT_FOUND) {
            return value;
        }
    }
    // Finally, fall back to the module injector.
    return lookupTokenUsingModuleInjector(lView, token, flags, notFoundValue);
}
/**
 * Returns the value associated to the given token from the node injector.
 *
 * @param tNode The Node where the search for the injector should start
 * @param lView The `LView` that contains the `tNode`
 * @param token The token to look for
 * @param flags Injection flags
 * @param notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @returns the value from the injector, `null` when not found, or `notFoundValue` if provided
 */
function lookupTokenUsingNodeInjector(tNode, lView, token, flags, notFoundValue) {
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
            const value = bloomHash(flags);
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
    return notFoundValue;
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
    get(token, notFoundValue, flags) {
        return getOrCreateInjectable(this._tNode, this._lView, token, flags, notFoundValue);
    }
}
/** Creates a `NodeInjector` for the current node. */
export function createNodeInjector() {
    return new NodeInjector(getCurrentTNode(), getLView());
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
    if (isForwardRef(type)) {
        return () => {
            const factory = getFactoryOf(resolveForwardRef(type));
            return factory && factory();
        };
    }
    return getFactoryDef(type);
}
/**
 * Returns a value from the closest embedded or node injector.
 *
 * @param tNode The Node where the search for the injector should start
 * @param lView The `LView` that contains the `tNode`
 * @param token The token to look for
 * @param flags Injection flags
 * @param notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @returns the value from the injector, `null` when not found, or `notFoundValue` if provided
 */
function lookupTokenUsingEmbeddedInjector(tNode, lView, token, flags, notFoundValue) {
    let currentTNode = tNode;
    let currentLView = lView;
    // When an LView with an embedded view injector is inserted, it'll likely be interlaced with
    // nodes who may have injectors (e.g. node injector -> embedded view injector -> node injector).
    // Since the bloom filters for the node injectors have already been constructed and we don't
    // have a way of extracting the records from an injector, the only way to maintain the correct
    // hierarchy when resolving the value is to walk it node-by-node while attempting to resolve
    // the token at each level.
    while (currentTNode !== null && currentLView !== null &&
        (currentLView[FLAGS] & 2048 /* HasEmbeddedViewInjector */) &&
        !(currentLView[FLAGS] & 512 /* IsRoot */)) {
        ngDevMode && assertTNodeForLView(currentTNode, currentLView);
        // Note that this lookup on the node injector is using the `Self` flag, because
        // we don't want the node injector to look at any parent injectors since we
        // may hit the embedded view injector first.
        const nodeInjectorValue = lookupTokenUsingNodeInjector(currentTNode, currentLView, token, flags | InjectFlags.Self, NOT_FOUND);
        if (nodeInjectorValue !== NOT_FOUND) {
            return nodeInjectorValue;
        }
        // Has an explicit type due to a TS bug: https://github.com/microsoft/TypeScript/issues/33191
        let parentTNode = currentTNode.parent;
        // `TNode.parent` includes the parent within the current view only. If it doesn't exist,
        // it means that we've hit the view boundary and we need to go up to the next view.
        if (!parentTNode) {
            // Before we go to the next LView, check if the token exists on the current embedded injector.
            const embeddedViewInjector = currentLView[EMBEDDED_VIEW_INJECTOR];
            if (embeddedViewInjector) {
                const embeddedViewInjectorValue = embeddedViewInjector.get(token, NOT_FOUND, flags);
                if (embeddedViewInjectorValue !== NOT_FOUND) {
                    return embeddedViewInjectorValue;
                }
            }
            // Otherwise keep going up the tree.
            parentTNode = getTNodeFromLView(currentLView);
            currentLView = currentLView[DECLARATION_VIEW];
        }
        currentTNode = parentTNode;
    }
    return notFoundValue;
}
/** Gets the TNode associated with an LView inside of the declaration view. */
function getTNodeFromLView(lView) {
    const tView = lView[TVIEW];
    const tViewType = tView.type;
    // The parent pointer differs based on `TView.type`.
    if (tViewType === 2 /* Embedded */) {
        ngDevMode && assertDefined(tView.declTNode, 'Embedded TNodes should have declaration parents.');
        return tView.declTNode;
    }
    else if (tViewType === 1 /* Component */) {
        // Components don't have `TView.declTNode` because each instance of component could be
        // inserted in different location, hence `TView.declTNode` is meaningless.
        return lView[T_HOST];
    }
    return null;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUdoRixPQUFPLEVBQUMsV0FBVyxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFHckQsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM5RSxPQUFPLEVBQUMsYUFBYSxFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFFOUMsT0FBTyxFQUFDLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3JGLE9BQU8sRUFBWSxhQUFhLEVBQUMsTUFBTSxzQkFBc0IsQ0FBQztBQUM5RCxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsMEJBQTBCLEVBQUMsTUFBTSxhQUFhLENBQUM7QUFDbkYsT0FBTyxFQUFDLGFBQWEsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDdkQsT0FBTyxFQUFDLHFCQUFxQixFQUFDLE1BQU0sU0FBUyxDQUFDO0FBRTlDLE9BQU8sRUFBQyxTQUFTLEVBQUUsa0JBQWtCLEVBQW1HLE1BQU0sdUJBQXVCLENBQUM7QUFFdEssT0FBTyxFQUFDLGNBQWMsRUFBRSxlQUFlLEVBQUMsTUFBTSwwQkFBMEIsQ0FBQztBQUN6RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsZ0JBQWdCLEVBQUUsc0JBQXNCLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBcUIsTUFBTSxFQUFTLEtBQUssRUFBbUIsTUFBTSxtQkFBbUIsQ0FBQztBQUNuTCxPQUFP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QUFTLGlCQUFpQixDQUFDLEtBQVk7SUFDckMsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzNCLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUM7SUFFN0Isb0RBQW9EO0lBQ3BELElBQUksU0FBUyxxQkFBdUIsRUFBRTtRQUNwQyxTQUFTLElBQUksYUFBYSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsa0RBQWtELENBQUMsQ0FBQztRQUNoRyxPQUFPLEtBQUssQ0FBQyxTQUFrQyxDQUFDO0tBQ2pEO1NBQU0sSUFBSSxTQUFTLHNCQUF3QixFQUFFO1FBQzVDLHNGQUFzRjtRQUN0RiwwRUFBMEU7UUFDMUUsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFpQixDQUFDO0tBQ3RDO0lBRUQsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBMTEMgQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7aXNGb3J3YXJkUmVmLCByZXNvbHZlRm9yd2FyZFJlZn0gZnJvbSAnLi4vZGkvZm9yd2FyZF9yZWYnO1xuaW1wb3J0IHtpbmplY3RSb290TGltcE1vZGUsIHNldEluamVjdEltcGxlbWVudGF0aW9ufSBmcm9tICcuLi9kaS9pbmplY3Rfc3dpdGNoJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0b3JNYXJrZXJzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9tYXJrZXInO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7UHJvdmlkZXJUb2tlbn0gZnJvbSAnLi4vZGkvcHJvdmlkZXJfdG9rZW4nO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7bm9TaWRlRWZmZWN0c30gZnJvbSAnLi4vdXRpbC9jbG9zdXJlJztcblxuaW1wb3J0IHthc3NlcnREaXJlY3RpdmVEZWYsIGFzc2VydE5vZGVJbmplY3RvciwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtGYWN0b3J5Rm4sIGdldEZhY3RvcnlEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9yc19kaSc7XG5pbXBvcnQge05HX0VMRU1FTlRfSUQsIE5HX0ZBQ1RPUllfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3JlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtpc0ZhY3RvcnksIE5PX1BBUkVOVF9JTkpFQ1RPUiwgTm9kZUluamVjdG9yRmFjdG9yeSwgTm9kZUluamVjdG9yT2Zmc2V0LCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZiwgaXNDb21wb25lbnRIb3N0fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgRU1CRURERURfVklFV19JTkpFQ1RPUiwgRkxBR1MsIElOSkVDVE9SLCBMVmlldywgTFZpZXdGbGFncywgVF9IT1NULCBURGF0YSwgVFZJRVcsIFRWaWV3LCBUVmlld1R5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0VE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZW50ZXJESSwgZ2V0Q3VycmVudFROb2RlLCBnZXRMVmlldywgbGVhdmVESX0gZnJvbSAnLi9zdGF0ZSc7XG5pbXBvcnQge2lzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXJ9IGZyb20gJy4vdXRpbC9hdHRyc191dGlscyc7XG5pbXBvcnQge2dldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3J9IGZyb20gJy4vdXRpbC9pbmplY3Rvcl91dGlscyc7XG5pbXBvcnQge3N0cmluZ2lmeUZvckVycm9yfSBmcm9tICcuL3V0aWwvc3RyaW5naWZ5X3V0aWxzJztcblxuXG5cbi8qKlxuICogRGVmaW5lcyBpZiB0aGUgY2FsbCB0byBgaW5qZWN0YCBzaG91bGQgaW5jbHVkZSBgdmlld1Byb3ZpZGVyc2AgaW4gaXRzIHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHdlIHRyeSB0byBpbnN0YW50aWF0ZSBhIGNvbXBvbmVudC4gVGhpcyB2YWx1ZSBpcyByZXNldCBpblxuICogYGdldE5vZGVJbmplY3RhYmxlYCB0byBhIHZhbHVlIHdoaWNoIG1hdGNoZXMgdGhlIGRlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoZSB0b2tlbiBhYm91dCB0byBiZVxuICogaW5zdGFudGlhdGVkLiBUaGlzIGlzIGRvbmUgc28gdGhhdCBpZiB3ZSBhcmUgaW5qZWN0aW5nIGEgdG9rZW4gd2hpY2ggd2FzIGRlY2xhcmVkIG91dHNpZGUgb2ZcbiAqIGB2aWV3UHJvdmlkZXJzYCB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcHVsbCBgdmlld1Byb3ZpZGVyc2AgaW4uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogU3RyaW5nKSB7fVxuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBNeVNlcnZpY2UsXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICdwcm92aWRlcnMnIH1cbiAqICAgXVxuICogICB2aWV3UHJvdmlkZXJzOiBbXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICd2aWV3UHJvdmlkZXJzJ31cbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IobXlTZXJ2aWNlOiBNeVNlcnZpY2UsIHZhbHVlOiBTdHJpbmcpIHtcbiAqICAgICAvLyBXZSBleHBlY3QgdGhhdCBDb21wb25lbnQgY2FuIHNlZSBpbnRvIGB2aWV3UHJvdmlkZXJzYC5cbiAqICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ3ZpZXdQcm92aWRlcnMnKTtcbiAqICAgICAvLyBgTXlTZXJ2aWNlYCB3YXMgbm90IGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCBoZW5jZSBpdCBjYW4ndCBzZWUgaXQuXG4gKiAgICAgZXhwZWN0KG15U2VydmljZS52YWx1ZSkudG9FcXVhbCgncHJvdmlkZXJzJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBgYGBcbiAqL1xubGV0IGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gdHJ1ZTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKHY6IGJvb2xlYW4pOiBib29sZWFuIHtcbiAgY29uc3Qgb2xkVmFsdWUgPSBpbmNsdWRlVmlld1Byb3ZpZGVycztcbiAgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB2O1xuICByZXR1cm4gb2xkVmFsdWU7XG59XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuY29uc3QgQkxPT01fTUFTSyA9IEJMT09NX1NJWkUgLSAxO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2YgYml0cyB0aGF0IGlzIHJlcHJlc2VudGVkIGJ5IGEgc2luZ2xlIGJsb29tIGJ1Y2tldC4gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsXG4gKiBzbyBlYWNoIGJ1Y2tldCByZXByZXNlbnRzIDMyIGRpc3RpbmN0IHRva2VucyB3aGljaCBhY2NvdW50cyBmb3IgbG9nMigzMikgPSA1IGJpdHMgb2YgYSBibG9vbSBoYXNoXG4gKiBudW1iZXIuXG4gKi9cbmNvbnN0IEJMT09NX0JVQ0tFVF9CSVRTID0gNTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKiBWYWx1ZSB1c2VkIHdoZW4gc29tZXRoaW5nIHdhc24ndCBmb3VuZCBieSBhbiBpbmplY3Rvci4gKi9cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBQcm92aWRlclRva2VuPGFueT58c3RyaW5nKTogdm9pZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbCh0Vmlldy5maXJzdENyZWF0ZVBhc3MsIHRydWUsICdleHBlY3RlZCBmaXJzdENyZWF0ZVBhc3MgdG8gYmUgdHJ1ZScpO1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQ7XG4gIGlmICh0eXBlb2YgdHlwZSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZCA9IHR5cGUuY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9IGVsc2UgaWYgKHR5cGUuaGFzT3duUHJvcGVydHkoTkdfRUxFTUVOVF9JRCkpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIH1cblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgY29uc3QgYmxvb21IYXNoID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuXG4gIC8vIEVhY2ggYmxvb20gYnVja2V0IGluIGB0RGF0YWAgcmVwcmVzZW50cyBgQkxPT01fQlVDS0VUX0JJVFNgIG51bWJlciBvZiBiaXRzIG9mIGBibG9vbUhhc2hgLlxuICAvLyBBbnkgYml0cyBpbiBgYmxvb21IYXNoYCBiZXlvbmQgYEJMT09NX0JVQ0tFVF9CSVRTYCBpbmRpY2F0ZSB0aGUgYnVja2V0IG9mZnNldCB0aGF0IHRoZSBtYXNrXG4gIC8vIHNob3VsZCBiZSB3cml0dGVuIHRvLlxuICAodFZpZXcuZGF0YSBhcyBudW1iZXJbXSlbaW5qZWN0b3JJbmRleCArIChibG9vbUhhc2ggPj4gQkxPT01fQlVDS0VUX0JJVFMpXSB8PSBtYXNrO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcGFyYW0gbFZpZXcgVmlldyB3aGVyZSB0aGUgbm9kZSBpcyBzdG9yZWRcbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcykge1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBsVmlldy5sZW5ndGg7XG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuZGF0YSwgdE5vZGUpOyAgLy8gZm91bmRhdGlvbiBmb3Igbm9kZSBibG9vbVxuICAgIGluc2VydEJsb29tKGxWaWV3LCBudWxsKTsgICAgICAgIC8vIGZvdW5kYXRpb24gZm9yIGN1bXVsYXRpdmUgYmxvb21cbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5ibHVlcHJpbnQsIG51bGwpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpO1xuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICAvLyBJZiBhIHBhcmVudCBpbmplY3RvciBjYW4ndCBiZSBmb3VuZCwgaXRzIGxvY2F0aW9uIGlzIHNldCB0byAtMS5cbiAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBuZWVkIHRvIHNldCB1cCBhIGN1bXVsYXRpdmUgYmxvb21cbiAgaWYgKGhhc1BhcmVudEluamVjdG9yKHBhcmVudExvYykpIHtcbiAgICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgICBjb25zdCBwYXJlbnRMVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2MsIGxWaWV3KTtcbiAgICBjb25zdCBwYXJlbnREYXRhID0gcGFyZW50TFZpZXdbVFZJRVddLmRhdGEgYXMgYW55O1xuICAgIC8vIENyZWF0ZXMgYSBjdW11bGF0aXZlIGJsb29tIGZpbHRlciB0aGF0IG1lcmdlcyB0aGUgcGFyZW50J3MgYmxvb20gZmlsdGVyXG4gICAgLy8gYW5kIGl0cyBvd24gY3VtdWxhdGl2ZSBibG9vbSAod2hpY2ggY29udGFpbnMgdG9rZW5zIGZvciBhbGwgYW5jZXN0b3JzKVxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgTm9kZUluamVjdG9yT2Zmc2V0LkJMT09NX1NJWkU7IGkrKykge1xuICAgICAgbFZpZXdbaW5qZWN0b3JJbmRleCArIGldID0gcGFyZW50TFZpZXdbcGFyZW50SW5kZXggKyBpXSB8IHBhcmVudERhdGFbcGFyZW50SW5kZXggKyBpXTtcbiAgICB9XG4gIH1cblxuICBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF0gPSBwYXJlbnRMb2M7XG4gIHJldHVybiBpbmplY3RvckluZGV4O1xufVxuXG5mdW5jdGlvbiBpbnNlcnRCbG9vbShhcnI6IGFueVtdLCBmb290ZXI6IFROb2RlfG51bGwpOiB2b2lkIHtcbiAgYXJyLnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgZm9vdGVyKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IG51bWJlciB7XG4gIGlmICh0Tm9kZS5pbmplY3RvckluZGV4ID09PSAtMSB8fFxuICAgICAgLy8gSWYgdGhlIGluamVjdG9yIGluZGV4IGlzIHRoZSBzYW1lIGFzIGl0cyBwYXJlbnQncyBpbmplY3RvciBpbmRleCwgdGhlbiB0aGUgaW5kZXggaGFzIGJlZW5cbiAgICAgIC8vIGNvcGllZCBkb3duIGZyb20gdGhlIHBhcmVudCBub2RlLiBObyBpbmplY3RvciBoYXMgYmVlbiBjcmVhdGVkIHlldCBvbiB0aGlzIG5vZGUuXG4gICAgICAodE5vZGUucGFyZW50ICYmIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4ID09PSB0Tm9kZS5pbmplY3RvckluZGV4KSB8fFxuICAgICAgLy8gQWZ0ZXIgdGhlIGZpcnN0IHRlbXBsYXRlIHBhc3MsIHRoZSBpbmplY3RvciBpbmRleCBtaWdodCBleGlzdCBidXQgdGhlIHBhcmVudCB2YWx1ZXNcbiAgICAgIC8vIG1pZ2h0IG5vdCBoYXZlIGJlZW4gY2FsY3VsYXRlZCB5ZXQgZm9yIHRoaXMgaW5zdGFuY2VcbiAgICAgIGxWaWV3W3ROb2RlLmluamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXSA9PT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0SW5kZXhJblJhbmdlKGxWaWV3LCB0Tm9kZS5pbmplY3RvckluZGV4KTtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICpcbiAqIEByZXR1cm5zIFJldHVybnMgYSBudW1iZXIgdGhhdCBpcyB0aGUgY29tYmluYXRpb24gb2YgdGhlIG51bWJlciBvZiBMVmlld3MgdGhhdCB3ZSBoYXZlIHRvIGdvIHVwXG4gKiB0byBmaW5kIHRoZSBMVmlldyBjb250YWluaW5nIHRoZSBwYXJlbnQgaW5qZWN0IEFORCB0aGUgaW5kZXggb2YgdGhlIGluamVjdG9yIHdpdGhpbiB0aGF0IExWaWV3LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldyk6IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbiB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhIHBhcmVudCBgVE5vZGVgIGFuZCB0aGVyZSBpcyBhbiBpbmplY3RvciBhc3NvY2lhdGVkIHdpdGggaXQgd2UgYXJlIGRvbmUsIGJlY2F1c2VcbiAgICAvLyB0aGUgcGFyZW50IGluamVjdG9yIGlzIHdpdGhpbiB0aGUgY3VycmVudCBgTFZpZXdgLlxuICAgIHJldHVybiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCBhcyBhbnk7ICAvLyBWaWV3T2Zmc2V0IGlzIDBcbiAgfVxuXG4gIC8vIFdoZW4gcGFyZW50IGluamVjdG9yIGxvY2F0aW9uIGlzIGNvbXB1dGVkIGl0IG1heSBiZSBvdXRzaWRlIG9mIHRoZSBjdXJyZW50IHZpZXcuIChpZSBpdCBjb3VsZFxuICAvLyBiZSBwb2ludGluZyB0byBhIGRlY2xhcmVkIHBhcmVudCBsb2NhdGlvbikuIFRoaXMgdmFyaWFibGUgc3RvcmVzIG51bWJlciBvZiBkZWNsYXJhdGlvbiBwYXJlbnRzXG4gIC8vIHdlIG5lZWQgdG8gd2FsayB1cCBpbiBvcmRlciB0byBmaW5kIHRoZSBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24uXG4gIGxldCBkZWNsYXJhdGlvblZpZXdPZmZzZXQgPSAwO1xuICBsZXQgcGFyZW50VE5vZGU6IFROb2RlfG51bGwgPSBudWxsO1xuICBsZXQgbFZpZXdDdXJzb3I6IExWaWV3fG51bGwgPSBsVmlldztcblxuICAvLyBUaGUgcGFyZW50IGluamVjdG9yIGlzIG5vdCBpbiB0aGUgY3VycmVudCBgTFZpZXdgLiBXZSB3aWxsIGhhdmUgdG8gd2FsayB0aGUgZGVjbGFyZWQgcGFyZW50XG4gIC8vIGBMVmlld2AgaGllcmFyY2h5IGFuZCBsb29rIGZvciBpdC4gSWYgd2Ugd2FsayBvZiB0aGUgdG9wLCB0aGF0IG1lYW5zIHRoYXQgdGhlcmUgaXMgbm8gcGFyZW50XG4gIC8vIGBOb2RlSW5qZWN0b3JgLlxuICB3aGlsZSAobFZpZXdDdXJzb3IgIT09IG51bGwpIHtcbiAgICBwYXJlbnRUTm9kZSA9IGdldFROb2RlRnJvbUxWaWV3KGxWaWV3Q3Vyc29yKTtcblxuICAgIGlmIChwYXJlbnRUTm9kZSA9PT0gbnVsbCkge1xuICAgICAgLy8gSWYgd2UgaGF2ZSBubyBwYXJlbnQsIHRoYW4gd2UgYXJlIGRvbmUuXG4gICAgICByZXR1cm4gTk9fUEFSRU5UX0lOSkVDVE9SO1xuICAgIH1cblxuICAgIG5nRGV2TW9kZSAmJiBwYXJlbnRUTm9kZSAmJiBhc3NlcnRUTm9kZUZvckxWaWV3KHBhcmVudFROb2RlISwgbFZpZXdDdXJzb3JbREVDTEFSQVRJT05fVklFV10hKTtcbiAgICAvLyBFdmVyeSBpdGVyYXRpb24gb2YgdGhlIGxvb3AgcmVxdWlyZXMgdGhhdCB3ZSBnbyB0byB0aGUgZGVjbGFyZWQgcGFyZW50LlxuICAgIGRlY2xhcmF0aW9uVmlld09mZnNldCsrO1xuICAgIGxWaWV3Q3Vyc29yID0gbFZpZXdDdXJzb3JbREVDTEFSQVRJT05fVklFV107XG5cbiAgICBpZiAocGFyZW50VE5vZGUuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIGZvdW5kIGEgTm9kZUluamVjdG9yIHdoaWNoIHBvaW50cyB0byBzb21ldGhpbmcuXG4gICAgICByZXR1cm4gKHBhcmVudFROb2RlLmluamVjdG9ySW5kZXggfFxuICAgICAgICAgICAgICAoZGVjbGFyYXRpb25WaWV3T2Zmc2V0IDw8IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkpIGFzIGFueTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIE5PX1BBUkVOVF9JTkpFQ1RPUjtcbn1cbi8qKlxuICogTWFrZXMgYSB0eXBlIG9yIGFuIGluamVjdGlvbiB0b2tlbiBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW5cbiAqIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHR5cGUgb3IgdGhlIGluamVjdGlvbiB0b2tlbiB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0b2tlbjogUHJvdmlkZXJUb2tlbjxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHRWaWV3LCB0b2tlbik7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC7JtWNtcCA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZUltcGwodE5vZGU6IFROb2RlLCBhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRUTm9kZVR5cGUodE5vZGUsIFROb2RlVHlwZS5BbnlDb250YWluZXIgfCBUTm9kZVR5cGUuQW55Uk5vZGUpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBpZiAoYXR0ck5hbWVUb0luamVjdCA9PT0gJ2NsYXNzJykge1xuICAgIHJldHVybiB0Tm9kZS5jbGFzc2VzO1xuICB9XG4gIGlmIChhdHRyTmFtZVRvSW5qZWN0ID09PSAnc3R5bGUnKSB7XG4gICAgcmV0dXJuIHROb2RlLnN0eWxlcztcbiAgfVxuXG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGNvbnN0IGF0dHJzTGVuZ3RoID0gYXR0cnMubGVuZ3RoO1xuICAgIGxldCBpID0gMDtcbiAgICB3aGlsZSAoaSA8IGF0dHJzTGVuZ3RoKSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGF0dHJzW2ldO1xuXG4gICAgICAvLyBJZiB3ZSBoaXQgYSBgQmluZGluZ3NgIG9yIGBUZW1wbGF0ZWAgbWFya2VyIHRoZW4gd2UgYXJlIGRvbmUuXG4gICAgICBpZiAoaXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcih2YWx1ZSkpIGJyZWFrO1xuXG4gICAgICAvLyBTa2lwIG5hbWVzcGFjZWQgYXR0cmlidXRlc1xuICAgICAgaWYgKHZhbHVlID09PSBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJKSB7XG4gICAgICAgIC8vIHdlIHNraXAgdGhlIG5leHQgdHdvIHZhbHVlc1xuICAgICAgICAvLyBhcyBuYW1lc3BhY2VkIGF0dHJpYnV0ZXMgbG9va3MgbGlrZVxuICAgICAgICAvLyBbLi4uLCBBdHRyaWJ1dGVNYXJrZXIuTmFtZXNwYWNlVVJJLCAnaHR0cDovL3NvbWV1cmkuY29tL3Rlc3QnLCAndGVzdDpleGlzdCcsXG4gICAgICAgIC8vICdleGlzdFZhbHVlJywgLi4uXVxuICAgICAgICBpID0gaSArIDI7XG4gICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgLy8gU2tpcCB0byB0aGUgZmlyc3QgdmFsdWUgb2YgdGhlIG1hcmtlZCBhdHRyaWJ1dGUuXG4gICAgICAgIGkrKztcbiAgICAgICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCAmJiB0eXBlb2YgYXR0cnNbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHZhbHVlID09PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaSA9IGkgKyAyO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBub3RGb3VuZFZhbHVlT3JUaHJvdzxUPihcbiAgICBub3RGb3VuZFZhbHVlOiBUfG51bGwsIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUfG51bGwge1xuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkge1xuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuLCAnTm9kZUluamVjdG9yJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBNb2R1bGVJbmplY3RvciBvciB0aHJvd3MgZXhjZXB0aW9uXG4gKlxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGB0Tm9kZWBcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEBwYXJhbSBub3RGb3VuZFZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gd2hlbiB0aGUgaW5qZWN0aW9uIGZsYWdzIGlzIGBJbmplY3RGbGFncy5PcHRpb25hbGBcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciB0aHJvd3MgYW4gZXhjZXB0aW9uXG4gKi9cbmZ1bmN0aW9uIGxvb2t1cFRva2VuVXNpbmdNb2R1bGVJbmplY3RvcjxUPihcbiAgICBsVmlldzogTFZpZXcsIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MsIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCAmJiBub3RGb3VuZFZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAvLyBUaGlzIG11c3QgYmUgc2V0IG9yIHRoZSBOdWxsSW5qZWN0b3Igd2lsbCB0aHJvdyBmb3Igb3B0aW9uYWwgZGVwc1xuICAgIG5vdEZvdW5kVmFsdWUgPSBudWxsO1xuICB9XG5cbiAgaWYgKChmbGFncyAmIChJbmplY3RGbGFncy5TZWxmIHwgSW5qZWN0RmxhZ3MuSG9zdCkpID09PSAwKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBsVmlld1tJTkpFQ1RPUl07XG4gICAgLy8gc3dpdGNoIHRvIGBpbmplY3RJbmplY3Rvck9ubHlgIGltcGxlbWVudGF0aW9uIGZvciBtb2R1bGUgaW5qZWN0b3IsIHNpbmNlIG1vZHVsZSBpbmplY3RvclxuICAgIC8vIHNob3VsZCBub3QgaGF2ZSBhY2Nlc3MgdG8gQ29tcG9uZW50L0RpcmVjdGl2ZSBESSBzY29wZSAodGhhdCBtYXkgaGFwcGVuIHRocm91Z2hcbiAgICAvLyBgZGlyZWN0aXZlSW5qZWN0YCBpbXBsZW1lbnRhdGlvbilcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24odW5kZWZpbmVkKTtcbiAgICB0cnkge1xuICAgICAgaWYgKG1vZHVsZUluamVjdG9yKSB7XG4gICAgICAgIHJldHVybiBtb2R1bGVJbmplY3Rvci5nZXQodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGluamVjdFJvb3RMaW1wTW9kZSh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbm90Rm91bmRWYWx1ZU9yVGhyb3c8VD4obm90Rm91bmRWYWx1ZSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBOb2RlSW5qZWN0b3JzID0+IE1vZHVsZUluamVjdG9yLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gcGF0Y2hlcyBgdG9rZW5gIHdpdGggYF9fTkdfRUxFTUVOVF9JRF9fYCB3aGljaCBjb250YWlucyB0aGUgaWQgZm9yIHRoZSBibG9vbVxuICogZmlsdGVyLiBgLTFgIGlzIHJlc2VydmVkIGZvciBpbmplY3RpbmcgYEluamVjdG9yYCAoaW1wbGVtZW50ZWQgYnkgYE5vZGVJbmplY3RvcmApXG4gKlxuICogQHBhcmFtIHROb2RlIFRoZSBOb2RlIHdoZXJlIHRoZSBzZWFyY2ggZm9yIHRoZSBpbmplY3RvciBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSBsVmlldyBUaGUgYExWaWV3YCB0aGF0IGNvbnRhaW5zIHRoZSBgdE5vZGVgXG4gKiBAcGFyYW0gdG9rZW4gVGhlIHRva2VuIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcGFyYW0gbm90Rm91bmRWYWx1ZSBUaGUgdmFsdWUgdG8gcmV0dXJuIHdoZW4gdGhlIGluamVjdGlvbiBmbGFncyBpcyBgSW5qZWN0RmxhZ3MuT3B0aW9uYWxgXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3IsIGBudWxsYCB3aGVuIG5vdCBmb3VuZCwgb3IgYG5vdEZvdW5kVmFsdWVgIGlmIHByb3ZpZGVkXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgdE5vZGU6IFREaXJlY3RpdmVIb3N0Tm9kZXxudWxsLCBsVmlldzogTFZpZXcsIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LFxuICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQsIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICAvLyBJZiB0aGUgdmlldyBvciBhbnkgb2YgaXRzIGFuY2VzdG9ycyBoYXZlIGFuIGVtYmVkZGVkXG4gICAgLy8gdmlldyBpbmplY3Rvciwgd2UgaGF2ZSB0byBsb29rIGl0IHVwIHRoZXJlIGZpcnN0LlxuICAgIGlmIChsVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLkhhc0VtYmVkZGVkVmlld0luamVjdG9yKSB7XG4gICAgICBjb25zdCBlbWJlZGRlZEluamVjdG9yVmFsdWUgPVxuICAgICAgICAgIGxvb2t1cFRva2VuVXNpbmdFbWJlZGRlZEluamVjdG9yKHROb2RlLCBsVmlldywgdG9rZW4sIGZsYWdzLCBOT1RfRk9VTkQpO1xuICAgICAgaWYgKGVtYmVkZGVkSW5qZWN0b3JWYWx1ZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgIHJldHVybiBlbWJlZGRlZEluamVjdG9yVmFsdWU7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gT3RoZXJ3aXNlIHRyeSB0aGUgbm9kZSBpbmplY3Rvci5cbiAgICBjb25zdCB2YWx1ZSA9IGxvb2t1cFRva2VuVXNpbmdOb2RlSW5qZWN0b3IodE5vZGUsIGxWaWV3LCB0b2tlbiwgZmxhZ3MsIE5PVF9GT1VORCk7XG4gICAgaWYgKHZhbHVlICE9PSBOT1RfRk9VTkQpIHtcbiAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG4gIH1cblxuICAvLyBGaW5hbGx5LCBmYWxsIGJhY2sgdG8gdGhlIG1vZHVsZSBpbmplY3Rvci5cbiAgcmV0dXJuIGxvb2t1cFRva2VuVXNpbmdNb2R1bGVJbmplY3RvcjxUPihsVmlldywgdG9rZW4sIGZsYWdzLCBub3RGb3VuZFZhbHVlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBub2RlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgTm9kZSB3aGVyZSB0aGUgc2VhcmNoIGZvciB0aGUgaW5qZWN0b3Igc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBjb250YWlucyB0aGUgYHROb2RlYFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiB3aGVuIHRoZSBpbmplY3Rpb24gZmxhZ3MgaXMgYEluamVjdEZsYWdzLk9wdGlvbmFsYFxuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yLCBgbnVsbGAgd2hlbiBub3QgZm91bmQsIG9yIGBub3RGb3VuZFZhbHVlYCBpZiBwcm92aWRlZFxuICovXG5mdW5jdGlvbiBsb29rdXBUb2tlblVzaW5nTm9kZUluamVjdG9yPFQ+KFxuICAgIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUsIGxWaWV3OiBMVmlldywgdG9rZW46IFByb3ZpZGVyVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyxcbiAgICBub3RGb3VuZFZhbHVlPzogYW55KSB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbik7XG4gIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnZnVuY3Rpb24nKSB7XG4gICAgaWYgKCFlbnRlckRJKGxWaWV3LCB0Tm9kZSwgZmxhZ3MpKSB7XG4gICAgICAvLyBGYWlsZWQgdG8gZW50ZXIgREksIHRyeSBtb2R1bGUgaW5qZWN0b3IgaW5zdGVhZC4gSWYgYSB0b2tlbiBpcyBpbmplY3RlZCB3aXRoIHRoZSBASG9zdFxuICAgICAgLy8gZmxhZywgdGhlIG1vZHVsZSBpbmplY3RvciBpcyBub3Qgc2VhcmNoZWQgZm9yIHRoYXQgdG9rZW4gaW4gSXZ5LlxuICAgICAgcmV0dXJuIChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QpID9cbiAgICAgICAgICBub3RGb3VuZFZhbHVlT3JUaHJvdzxUPihub3RGb3VuZFZhbHVlLCB0b2tlbiwgZmxhZ3MpIDpcbiAgICAgICAgICBsb29rdXBUb2tlblVzaW5nTW9kdWxlSW5qZWN0b3I8VD4obFZpZXcsIHRva2VuLCBmbGFncywgbm90Rm91bmRWYWx1ZSk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCB2YWx1ZSA9IGJsb29tSGFzaChmbGFncyk7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpKSB7XG4gICAgICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgbGVhdmVESSgpO1xuICAgIH1cbiAgfSBlbHNlIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnbnVtYmVyJykge1xuICAgIC8vIEEgcmVmZXJlbmNlIHRvIHRoZSBwcmV2aW91cyBpbmplY3RvciBUVmlldyB0aGF0IHdhcyBmb3VuZCB3aGlsZSBjbGltYmluZyB0aGUgZWxlbWVudFxuICAgIC8vIGluamVjdG9yIHRyZWUuIFRoaXMgaXMgdXNlZCB0byBrbm93IGlmIHZpZXdQcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIG9uIHRoZSBjdXJyZW50XG4gICAgLy8gaW5qZWN0b3IuXG4gICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICAgIGxldCBwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gTk9fUEFSRU5UX0lOSkVDVE9SO1xuICAgIGxldCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZXxudWxsID1cbiAgICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ID8gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW1RfSE9TVF0gOiBudWxsO1xuXG4gICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3Rvciwgb3IgaWYgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlLCBzdGFydCBieVxuICAgIC8vIHNlYXJjaGluZyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSB8fCBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF07XG5cbiAgICAgIGlmIChwYXJlbnRMb2NhdGlvbiA9PT0gTk9fUEFSRU5UX0lOSkVDVE9SIHx8ICFzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIGZhbHNlKSkge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aW91c1RWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlXG4gICAgLy8gKmlzbid0KiBhIG1hdGNoLlxuICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVJbmplY3RvcihsVmlldywgaW5qZWN0b3JJbmRleCk7XG5cbiAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IGluamVjdG9yLiBJZiBpdCBtYXRjaGVzLCBzZWUgaWYgaXQgY29udGFpbnMgdG9rZW4uXG4gICAgICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydFROb2RlRm9yTFZpZXcodFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSBhcyBUTm9kZSwgbFZpZXcpO1xuICAgICAgaWYgKGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCB0Vmlldy5kYXRhKSkge1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAvLyB0aGUgaW5zdGFuY2UuXG4gICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPSBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgICAgICAgICAgaW5qZWN0b3JJbmRleCwgbFZpZXcsIHRva2VuLCBwcmV2aW91c1RWaWV3LCBmbGFncywgaG9zdFRFbGVtZW50Tm9kZSk7XG4gICAgICAgIGlmIChpbnN0YW5jZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXTtcbiAgICAgIGlmIChwYXJlbnRMb2NhdGlvbiAhPT0gTk9fUEFSRU5UX0lOSkVDVE9SICYmXG4gICAgICAgICAgc2hvdWxkU2VhcmNoUGFyZW50KFxuICAgICAgICAgICAgICBmbGFncyxcbiAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gPT09IGhvc3RURWxlbWVudE5vZGUpICYmXG4gICAgICAgICAgYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGxWaWV3KSkge1xuICAgICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgICBwcmV2aW91c1RWaWV3ID0gdFZpZXc7XG4gICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIElmIHdlIHNob3VsZCBub3Qgc2VhcmNoIHBhcmVudCBPUiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGRvZXMgbm90IGhhdmUgdGhlXG4gICAgICAgIC8vIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUgd2UgY2FuIGdpdmUgdXAgb24gdHJhdmVyc2luZyB1cCB0byBmaW5kIHRoZSBzcGVjaWZpY1xuICAgICAgICAvLyBpbmplY3Rvci5cbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBub3RGb3VuZFZhbHVlO1xufVxuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCB0b2tlbjogUHJvdmlkZXJUb2tlbjxUPiwgcHJldmlvdXNUVmlldzogVFZpZXd8bnVsbCxcbiAgICBmbGFnczogSW5qZWN0RmxhZ3MsIGhvc3RURWxlbWVudE5vZGU6IFROb2RlfG51bGwpIHtcbiAgY29uc3QgY3VycmVudFRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCB0Tm9kZSA9IGN1cnJlbnRUVmlldy5kYXRhW2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuVE5PREVdIGFzIFROb2RlO1xuICAvLyBGaXJzdCwgd2UgbmVlZCB0byBkZXRlcm1pbmUgaWYgdmlldyBwcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIGJ5IHRoZSBzdGFydGluZyBlbGVtZW50LlxuICAvLyBUaGVyZSBhcmUgdHdvIHBvc3NpYmlsaXRpZXNcbiAgY29uc3QgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA9IHByZXZpb3VzVFZpZXcgPT0gbnVsbCA/XG4gICAgICAvLyAxKSBUaGlzIGlzIHRoZSBmaXJzdCBpbnZvY2F0aW9uIGBwcmV2aW91c1RWaWV3ID09IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIGF0IHRoZVxuICAgICAgLy8gYFROb2RlYCBvZiB3aGVyZSBpbmplY3RvciBpcyBzdGFydGluZyB0byBsb29rLiBJbiBzdWNoIGEgY2FzZSB0aGUgb25seSB0aW1lIHdlIGFyZSBhbGxvd2VkXG4gICAgICAvLyB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaXMgaWY6XG4gICAgICAvLyAtIHdlIGFyZSBvbiBhIGNvbXBvbmVudFxuICAgICAgLy8gLSBBTkQgdGhlIGluamVjdG9yIHNldCBgaW5jbHVkZVZpZXdQcm92aWRlcnNgIHRvIHRydWUgKGltcGx5aW5nIHRoYXQgdGhlIHRva2VuIGNhbiBzZWVcbiAgICAgIC8vIFZpZXdQcm92aWRlcnMgYmVjYXVzZSBpdCBpcyB0aGUgQ29tcG9uZW50IG9yIGEgU2VydmljZSB3aGljaCBpdHNlbGYgd2FzIGRlY2xhcmVkIGluXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzKVxuICAgICAgKGlzQ29tcG9uZW50SG9zdCh0Tm9kZSkgJiYgaW5jbHVkZVZpZXdQcm92aWRlcnMpIDpcbiAgICAgIC8vIDIpIGBwcmV2aW91c1RWaWV3ICE9IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIG5vdyB3YWxraW5nIGFjcm9zcyB0aGUgcGFyZW50IG5vZGVzLlxuICAgICAgLy8gSW4gc3VjaCBhIGNhc2Ugd2UgYXJlIG9ubHkgYWxsb3dlZCB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaWY6XG4gICAgICAvLyAtIFdlIGp1c3QgY3Jvc3NlZCBmcm9tIGNoaWxkIFZpZXcgdG8gUGFyZW50IFZpZXcgYHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3YFxuICAgICAgLy8gLSBBTkQgdGhlIHBhcmVudCBUTm9kZSBpcyBhbiBFbGVtZW50LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGp1c3QgY2FtZSBmcm9tIHRoZSBDb21wb25lbnQncyBWaWV3IGFuZCB0aGVyZWZvcmUgYXJlIGFsbG93ZWQgdG8gc2VlXG4gICAgICAvLyBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzLlxuICAgICAgKHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmICgodE5vZGUudHlwZSAmIFROb2RlVHlwZS5BbnlSTm9kZSkgIT09IDApKTtcblxuICAvLyBUaGlzIHNwZWNpYWwgY2FzZSBoYXBwZW5zIHdoZW4gdGhlcmUgaXMgYSBAaG9zdCBvbiB0aGUgaW5qZWN0IGFuZCB3aGVuIHdlIGFyZSBzZWFyY2hpbmdcbiAgLy8gb24gdGhlIGhvc3QgZWxlbWVudCBub2RlLlxuICBjb25zdCBpc0hvc3RTcGVjaWFsQ2FzZSA9IChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QpICYmIGhvc3RURWxlbWVudE5vZGUgPT09IHROb2RlO1xuXG4gIGNvbnN0IGluamVjdGFibGVJZHggPSBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKFxuICAgICAgdE5vZGUsIGN1cnJlbnRUVmlldywgdG9rZW4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMsIGlzSG9zdFNwZWNpYWxDYXNlKTtcbiAgaWYgKGluamVjdGFibGVJZHggIT09IG51bGwpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUobFZpZXcsIGN1cnJlbnRUVmlldywgaW5qZWN0YWJsZUlkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gTk9UX0ZPVU5EO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIHRoZSBnaXZlbiB0b2tlbiBhbW9uZyB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVycy5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSB0VmlldyBUaGUgdFZpZXcgd2UgYXJlIGN1cnJlbnRseSBwcm9jZXNzaW5nXG4gKiBAcGFyYW0gdG9rZW4gUHJvdmlkZXIgdG9rZW4gb3IgdHlwZSBvZiBhIGRpcmVjdGl2ZSB0byBsb29rIGZvci5cbiAqIEBwYXJhbSBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzIFdoZXRoZXIgdmlldyBwcm92aWRlcnMgc2hvdWxkIGJlIGNvbnNpZGVyZWQuXG4gKiBAcGFyYW0gaXNIb3N0U3BlY2lhbENhc2UgV2hldGhlciB0aGUgaG9zdCBzcGVjaWFsIGNhc2UgYXBwbGllcy5cbiAqIEByZXR1cm5zIEluZGV4IG9mIGEgZm91bmQgZGlyZWN0aXZlIG9yIHByb3ZpZGVyLCBvciBudWxsIHdoZW4gbm9uZSBmb3VuZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGxvY2F0ZURpcmVjdGl2ZU9yUHJvdmlkZXI8VD4oXG4gICAgdE5vZGU6IFROb2RlLCB0VmlldzogVFZpZXcsIHRva2VuOiBQcm92aWRlclRva2VuPFQ+fHN0cmluZywgY2FuQWNjZXNzVmlld1Byb3ZpZGVyczogYm9vbGVhbixcbiAgICBpc0hvc3RTcGVjaWFsQ2FzZTogYm9vbGVhbnxudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IG5vZGVQcm92aWRlckluZGV4ZXMgPSB0Tm9kZS5wcm92aWRlckluZGV4ZXM7XG4gIGNvbnN0IHRJbmplY3RhYmxlcyA9IHRWaWV3LmRhdGE7XG5cbiAgY29uc3QgaW5qZWN0YWJsZXNTdGFydCA9IG5vZGVQcm92aWRlckluZGV4ZXMgJiBUTm9kZVByb3ZpZGVySW5kZXhlcy5Qcm92aWRlcnNTdGFydEluZGV4TWFzaztcbiAgY29uc3QgZGlyZWN0aXZlc1N0YXJ0ID0gdE5vZGUuZGlyZWN0aXZlU3RhcnQ7XG4gIGNvbnN0IGRpcmVjdGl2ZUVuZCA9IHROb2RlLmRpcmVjdGl2ZUVuZDtcbiAgY29uc3QgY3B0Vmlld1Byb3ZpZGVyc0NvdW50ID1cbiAgICAgIG5vZGVQcm92aWRlckluZGV4ZXMgPj4gVE5vZGVQcm92aWRlckluZGV4ZXMuQ3B0Vmlld1Byb3ZpZGVyc0NvdW50U2hpZnQ7XG4gIGNvbnN0IHN0YXJ0aW5nSW5kZXggPVxuICAgICAgY2FuQWNjZXNzVmlld1Byb3ZpZGVycyA/IGluamVjdGFibGVzU3RhcnQgOiBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50O1xuICAvLyBXaGVuIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLCBvbmx5IHRoZSB2aWV3UHJvdmlkZXJzIGFuZCB0aGUgY29tcG9uZW50IGFyZSB2aXNpYmxlXG4gIGNvbnN0IGVuZEluZGV4ID0gaXNIb3N0U3BlY2lhbENhc2UgPyBpbmplY3RhYmxlc1N0YXJ0ICsgY3B0Vmlld1Byb3ZpZGVyc0NvdW50IDogZGlyZWN0aXZlRW5kO1xuICBmb3IgKGxldCBpID0gc3RhcnRpbmdJbmRleDsgaSA8IGVuZEluZGV4OyBpKyspIHtcbiAgICBjb25zdCBwcm92aWRlclRva2VuT3JEZWYgPSB0SW5qZWN0YWJsZXNbaV0gYXMgUHJvdmlkZXJUb2tlbjxhbnk+fCBEaXJlY3RpdmVEZWY8YW55Pnwgc3RyaW5nO1xuICAgIGlmIChpIDwgZGlyZWN0aXZlc1N0YXJ0ICYmIHRva2VuID09PSBwcm92aWRlclRva2VuT3JEZWYgfHxcbiAgICAgICAgaSA+PSBkaXJlY3RpdmVzU3RhcnQgJiYgKHByb3ZpZGVyVG9rZW5PckRlZiBhcyBEaXJlY3RpdmVEZWY8YW55PikudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNIb3N0U3BlY2lhbENhc2UpIHtcbiAgICBjb25zdCBkaXJEZWYgPSB0SW5qZWN0YWJsZXNbZGlyZWN0aXZlc1N0YXJ0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGlyRGVmICYmIGlzQ29tcG9uZW50RGVmKGRpckRlZikgJiYgZGlyRGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gZGlyZWN0aXZlc1N0YXJ0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXRyaWV2ZSBvciBpbnN0YW50aWF0ZSB0aGUgaW5qZWN0YWJsZSBmcm9tIHRoZSBgTFZpZXdgIGF0IHBhcnRpY3VsYXIgYGluZGV4YC5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlIHZhbHVlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkIGFuZCBpZiBzbyByZXR1cm5zIHRoZVxuICogY2FjaGVkIGBpbmplY3RhYmxlYC4gT3RoZXJ3aXNlIGlmIGl0IGRldGVjdHMgdGhhdCB0aGUgdmFsdWUgaXMgc3RpbGwgYSBmYWN0b3J5IGl0XG4gKiBpbnN0YW50aWF0ZXMgdGhlIGBpbmplY3RhYmxlYCBhbmQgY2FjaGVzIHRoZSB2YWx1ZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVJbmplY3RhYmxlKFxuICAgIGxWaWV3OiBMVmlldywgdFZpZXc6IFRWaWV3LCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbFZpZXdbaW5kZXhdO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGE7XG4gIGlmIChpc0ZhY3RvcnkodmFsdWUpKSB7XG4gICAgY29uc3QgZmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSA9IHZhbHVlO1xuICAgIGlmIChmYWN0b3J5LnJlc29sdmluZykge1xuICAgICAgdGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3Ioc3RyaW5naWZ5Rm9yRXJyb3IodERhdGFbaW5kZXhdKSk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMgPSBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhmYWN0b3J5LmNhblNlZVZpZXdQcm92aWRlcnMpO1xuICAgIGZhY3RvcnkucmVzb2x2aW5nID0gdHJ1ZTtcbiAgICBjb25zdCBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID1cbiAgICAgICAgZmFjdG9yeS5pbmplY3RJbXBsID8gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oZmFjdG9yeS5pbmplY3RJbXBsKSA6IG51bGw7XG4gICAgY29uc3Qgc3VjY2VzcyA9IGVudGVyREkobFZpZXcsIHROb2RlLCBJbmplY3RGbGFncy5EZWZhdWx0KTtcbiAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgYXNzZXJ0RXF1YWwoXG4gICAgICAgICAgICBzdWNjZXNzLCB0cnVlLFxuICAgICAgICAgICAgJ0JlY2F1c2UgZmxhZ3MgZG8gbm90IGNvbnRhaW4gXFxgU2tpcFNlbGZcXCcgd2UgZXhwZWN0IHRoaXMgdG8gYWx3YXlzIHN1Y2NlZWQuJyk7XG4gICAgdHJ5IHtcbiAgICAgIHZhbHVlID0gbFZpZXdbaW5kZXhdID0gZmFjdG9yeS5mYWN0b3J5KHVuZGVmaW5lZCwgdERhdGEsIGxWaWV3LCB0Tm9kZSk7XG4gICAgICAvLyBUaGlzIGNvZGUgcGF0aCBpcyBoaXQgZm9yIGJvdGggZGlyZWN0aXZlcyBhbmQgcHJvdmlkZXJzLlxuICAgICAgLy8gRm9yIHBlcmYgcmVhc29ucywgd2Ugd2FudCB0byBhdm9pZCBzZWFyY2hpbmcgZm9yIGhvb2tzIG9uIHByb3ZpZGVycy5cbiAgICAgIC8vIEl0IGRvZXMgbm8gaGFybSB0byB0cnkgKHRoZSBob29rcyBqdXN0IHdvbid0IGV4aXN0KSwgYnV0IHRoZSBleHRyYVxuICAgICAgLy8gY2hlY2tzIGFyZSB1bm5lY2Vzc2FyeSBhbmQgdGhpcyBpcyBhIGhvdCBwYXRoLiBTbyB3ZSBjaGVjayB0byBzZWVcbiAgICAgIC8vIGlmIHRoZSBpbmRleCBvZiB0aGUgZGVwZW5kZW5jeSBpcyBpbiB0aGUgZGlyZWN0aXZlIHJhbmdlIGZvciB0aGlzXG4gICAgICAvLyB0Tm9kZS4gSWYgaXQncyBub3QsIHdlIGtub3cgaXQncyBhIHByb3ZpZGVyIGFuZCBza2lwIGhvb2sgcmVnaXN0cmF0aW9uLlxuICAgICAgaWYgKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcyAmJiBpbmRleCA+PSB0Tm9kZS5kaXJlY3RpdmVTdGFydCkge1xuICAgICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGlyZWN0aXZlRGVmKHREYXRhW2luZGV4XSk7XG4gICAgICAgIHJlZ2lzdGVyUHJlT3JkZXJIb29rcyhpbmRleCwgdERhdGFbaW5kZXhdIGFzIERpcmVjdGl2ZURlZjxhbnk+LCB0Vmlldyk7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gIT09IG51bGwgJiZcbiAgICAgICAgICBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uKTtcbiAgICAgIHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMpO1xuICAgICAgZmFjdG9yeS5yZXNvbHZpbmcgPSBmYWxzZTtcbiAgICAgIGxlYXZlREkoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHZhbHVlO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlciB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGRpcmVjdGl2ZSBtaWdodCBiZSBwcm92aWRlZCBieSB0aGUgaW5qZWN0b3IuXG4gKlxuICogV2hlbiBhIGRpcmVjdGl2ZSBpcyBwdWJsaWMsIGl0IGlzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIgYW5kIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIFR5cGUuIFdoZW4gdGhlIGRpcmVjdGl2ZSBpc24ndCBwdWJsaWMgb3IgdGhlIHRva2VuIGlzIG5vdCBhIGRpcmVjdGl2ZSBgbnVsbGBcbiAqIGlzIHJldHVybmVkIGFzIHRoZSBub2RlIGluamVjdG9yIGNhbiBub3QgcG9zc2libHkgcHJvdmlkZSB0aGF0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgaW5qZWN0aW9uIHRva2VuXG4gKiBAcmV0dXJucyB0aGUgbWF0Y2hpbmcgYml0IHRvIGNoZWNrIGluIHRoZSBibG9vbSBmaWx0ZXIgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBpcyBub3Qga25vd24uXG4gKiAgIFdoZW4gdGhlIHJldHVybmVkIHZhbHVlIGlzIG5lZ2F0aXZlIHRoZW4gaXQgcmVwcmVzZW50cyBzcGVjaWFsIHZhbHVlcyBzdWNoIGFzIGBJbmplY3RvcmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW46IFByb3ZpZGVyVG9rZW48YW55PnxzdHJpbmcpOiBudW1iZXJ8RnVuY3Rpb258dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdG9rZW4uY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPVxuICAgICAgLy8gRmlyc3QgY2hlY2sgd2l0aCBgaGFzT3duUHJvcGVydHlgIHNvIHdlIGRvbid0IGdldCBhbiBpbmhlcml0ZWQgSUQuXG4gICAgICB0b2tlbi5oYXNPd25Qcm9wZXJ0eShOR19FTEVNRU5UX0lEKSA/ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdIDogdW5kZWZpbmVkO1xuICAvLyBOZWdhdGl2ZSB0b2tlbiBJRHMgYXJlIHVzZWQgZm9yIHNwZWNpYWwgb2JqZWN0cyBzdWNoIGFzIGBJbmplY3RvcmBcbiAgaWYgKHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJykge1xuICAgIGlmICh0b2tlbklkID49IDApIHtcbiAgICAgIHJldHVybiB0b2tlbklkICYgQkxPT01fTUFTSztcbiAgICB9IGVsc2Uge1xuICAgICAgbmdEZXZNb2RlICYmXG4gICAgICAgICAgYXNzZXJ0RXF1YWwodG9rZW5JZCwgSW5qZWN0b3JNYXJrZXJzLkluamVjdG9yLCAnRXhwZWN0aW5nIHRvIGdldCBTcGVjaWFsIEluamVjdG9yIElkJyk7XG4gICAgICByZXR1cm4gY3JlYXRlTm9kZUluamVjdG9yO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdG9rZW5JZDtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3fFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuXG4gIC8vIEVhY2ggYmxvb20gYnVja2V0IGluIGBpbmplY3RvclZpZXdgIHJlcHJlc2VudHMgYEJMT09NX0JVQ0tFVF9CSVRTYCBudW1iZXIgb2YgYml0cyBvZlxuICAvLyBgYmxvb21IYXNoYC4gQW55IGJpdHMgaW4gYGJsb29tSGFzaGAgYmV5b25kIGBCTE9PTV9CVUNLRVRfQklUU2AgaW5kaWNhdGUgdGhlIGJ1Y2tldCBvZmZzZXRcbiAgLy8gdGhhdCBzaG91bGQgYmUgdXNlZC5cbiAgY29uc3QgdmFsdWUgPSBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIChibG9vbUhhc2ggPj4gQkxPT01fQlVDS0VUX0JJVFMpXTtcblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgaXNGaXJzdEhvc3RUTm9kZTogYm9vbGVhbik6IGJvb2xlYW58bnVtYmVyIHtcbiAgcmV0dXJuICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiBpc0ZpcnN0SG9zdFROb2RlKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsLFxuICAgICAgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55LCBmbGFncz86IEluamVjdEZsYWdzKTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIGZsYWdzLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxufVxuXG4vKiogQ3JlYXRlcyBhIGBOb2RlSW5qZWN0b3JgIGZvciB0aGUgY3VycmVudCBub2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vZGVJbmplY3RvcigpOiBJbmplY3RvciB7XG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKGdldEN1cnJlbnRUTm9kZSgpISBhcyBURGlyZWN0aXZlSG9zdE5vZGUsIGdldExWaWV3KCkpIGFzIGFueTtcbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gybXJtWdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICByZXR1cm4gbm9TaWRlRWZmZWN0cygoKSA9PiB7XG4gICAgY29uc3Qgb3duQ29uc3RydWN0b3IgPSB0eXBlLnByb3RvdHlwZS5jb25zdHJ1Y3RvcjtcbiAgICBjb25zdCBvd25GYWN0b3J5ID0gb3duQ29uc3RydWN0b3JbTkdfRkFDVE9SWV9ERUZdIHx8IGdldEZhY3RvcnlPZihvd25Db25zdHJ1Y3Rvcik7XG4gICAgY29uc3Qgb2JqZWN0UHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgICBsZXQgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIEdvIHVwIHRoZSBwcm90b3R5cGUgdW50aWwgd2UgaGl0IGBPYmplY3RgLlxuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBvYmplY3RQcm90b3R5cGUpIHtcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBwYXJlbnRbTkdfRkFDVE9SWV9ERUZdIHx8IGdldEZhY3RvcnlPZihwYXJlbnQpO1xuXG4gICAgICAvLyBJZiB3ZSBoaXQgc29tZXRoaW5nIHRoYXQgaGFzIGEgZmFjdG9yeSBhbmQgdGhlIGZhY3RvcnkgaXNuJ3QgdGhlIHNhbWUgYXMgdGhlIHR5cGUsXG4gICAgICAvLyB3ZSd2ZSBmb3VuZCB0aGUgaW5oZXJpdGVkIGZhY3RvcnkuIE5vdGUgdGhlIGNoZWNrIHRoYXQgdGhlIGZhY3RvcnkgaXNuJ3QgdGhlIHR5cGUnc1xuICAgICAgLy8gb3duIGZhY3RvcnkgaXMgcmVkdW5kYW50IGluIG1vc3QgY2FzZXMsIGJ1dCBpZiB0aGUgdXNlciBoYXMgY3VzdG9tIGRlY29yYXRvcnMgb24gdGhlXG4gICAgICAvLyBjbGFzcywgdGhpcyBsb29rdXAgd2lsbCBzdGFydCBvbmUgbGV2ZWwgZG93biBpbiB0aGUgcHJvdG90eXBlIGNoYWluLCBjYXVzaW5nIHVzIHRvXG4gICAgICAvLyBmaW5kIHRoZSBvd24gZmFjdG9yeSBmaXJzdCBhbmQgcG90ZW50aWFsbHkgdHJpZ2dlcmluZyBhbiBpbmZpbml0ZSBsb29wIGRvd25zdHJlYW0uXG4gICAgICBpZiAoZmFjdG9yeSAmJiBmYWN0b3J5ICE9PSBvd25GYWN0b3J5KSB7XG4gICAgICAgIHJldHVybiBmYWN0b3J5O1xuICAgICAgfVxuXG4gICAgICBwYXJlbnQgPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YocGFyZW50KTtcbiAgICB9XG5cbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuIHQgPT4gbmV3IHQoKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU/OiBUeXBlPFQ+KSA9PiBUIHwgbnVsbCl8bnVsbCB7XG4gIGlmIChpc0ZvcndhcmRSZWYodHlwZSkpIHtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlPZjxUPihyZXNvbHZlRm9yd2FyZFJlZih0eXBlKSk7XG4gICAgICByZXR1cm4gZmFjdG9yeSAmJiBmYWN0b3J5KCk7XG4gICAgfTtcbiAgfVxuICByZXR1cm4gZ2V0RmFjdG9yeURlZjxUPih0eXBlKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGEgdmFsdWUgZnJvbSB0aGUgY2xvc2VzdCBlbWJlZGRlZCBvciBub2RlIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgTm9kZSB3aGVyZSB0aGUgc2VhcmNoIGZvciB0aGUgaW5qZWN0b3Igc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBjb250YWlucyB0aGUgYHROb2RlYFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiB3aGVuIHRoZSBpbmplY3Rpb24gZmxhZ3MgaXMgYEluamVjdEZsYWdzLk9wdGlvbmFsYFxuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yLCBgbnVsbGAgd2hlbiBub3QgZm91bmQsIG9yIGBub3RGb3VuZFZhbHVlYCBpZiBwcm92aWRlZFxuICovXG5mdW5jdGlvbiBsb29rdXBUb2tlblVzaW5nRW1iZWRkZWRJbmplY3RvcjxUPihcbiAgICB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlLCBsVmlldzogTFZpZXcsIHRva2VuOiBQcm92aWRlclRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MsXG4gICAgbm90Rm91bmRWYWx1ZT86IGFueSkge1xuICBsZXQgY3VycmVudFROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGV8bnVsbCA9IHROb2RlO1xuICBsZXQgY3VycmVudExWaWV3OiBMVmlld3xudWxsID0gbFZpZXc7XG5cbiAgLy8gV2hlbiBhbiBMVmlldyB3aXRoIGFuIGVtYmVkZGVkIHZpZXcgaW5qZWN0b3IgaXMgaW5zZXJ0ZWQsIGl0J2xsIGxpa2VseSBiZSBpbnRlcmxhY2VkIHdpdGhcbiAgLy8gbm9kZXMgd2hvIG1heSBoYXZlIGluamVjdG9ycyAoZS5nLiBub2RlIGluamVjdG9yIC0+IGVtYmVkZGVkIHZpZXcgaW5qZWN0b3IgLT4gbm9kZSBpbmplY3RvcikuXG4gIC8vIFNpbmNlIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgbm9kZSBpbmplY3RvcnMgaGF2ZSBhbHJlYWR5IGJlZW4gY29uc3RydWN0ZWQgYW5kIHdlIGRvbid0XG4gIC8vIGhhdmUgYSB3YXkgb2YgZXh0cmFjdGluZyB0aGUgcmVjb3JkcyBmcm9tIGFuIGluamVjdG9yLCB0aGUgb25seSB3YXkgdG8gbWFpbnRhaW4gdGhlIGNvcnJlY3RcbiAgLy8gaGllcmFyY2h5IHdoZW4gcmVzb2x2aW5nIHRoZSB2YWx1ZSBpcyB0byB3YWxrIGl0IG5vZGUtYnktbm9kZSB3aGlsZSBhdHRlbXB0aW5nIHRvIHJlc29sdmVcbiAgLy8gdGhlIHRva2VuIGF0IGVhY2ggbGV2ZWwuXG4gIHdoaWxlIChjdXJyZW50VE5vZGUgIT09IG51bGwgJiYgY3VycmVudExWaWV3ICE9PSBudWxsICYmXG4gICAgICAgICAoY3VycmVudExWaWV3W0ZMQUdTXSAmIExWaWV3RmxhZ3MuSGFzRW1iZWRkZWRWaWV3SW5qZWN0b3IpICYmXG4gICAgICAgICAhKGN1cnJlbnRMVmlld1tGTEFHU10gJiBMVmlld0ZsYWdzLklzUm9vdCkpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVGb3JMVmlldyhjdXJyZW50VE5vZGUsIGN1cnJlbnRMVmlldyk7XG5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBsb29rdXAgb24gdGhlIG5vZGUgaW5qZWN0b3IgaXMgdXNpbmcgdGhlIGBTZWxmYCBmbGFnLCBiZWNhdXNlXG4gICAgLy8gd2UgZG9uJ3Qgd2FudCB0aGUgbm9kZSBpbmplY3RvciB0byBsb29rIGF0IGFueSBwYXJlbnQgaW5qZWN0b3JzIHNpbmNlIHdlXG4gICAgLy8gbWF5IGhpdCB0aGUgZW1iZWRkZWQgdmlldyBpbmplY3RvciBmaXJzdC5cbiAgICBjb25zdCBub2RlSW5qZWN0b3JWYWx1ZSA9IGxvb2t1cFRva2VuVXNpbmdOb2RlSW5qZWN0b3IoXG4gICAgICAgIGN1cnJlbnRUTm9kZSwgY3VycmVudExWaWV3LCB0b2tlbiwgZmxhZ3MgfCBJbmplY3RGbGFncy5TZWxmLCBOT1RfRk9VTkQpO1xuICAgIGlmIChub2RlSW5qZWN0b3JWYWx1ZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICByZXR1cm4gbm9kZUluamVjdG9yVmFsdWU7XG4gICAgfVxuXG4gICAgLy8gSGFzIGFuIGV4cGxpY2l0IHR5cGUgZHVlIHRvIGEgVFMgYnVnOiBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzMzMTkxXG4gICAgbGV0IHBhcmVudFROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8bnVsbCA9IGN1cnJlbnRUTm9kZS5wYXJlbnQ7XG5cbiAgICAvLyBgVE5vZGUucGFyZW50YCBpbmNsdWRlcyB0aGUgcGFyZW50IHdpdGhpbiB0aGUgY3VycmVudCB2aWV3IG9ubHkuIElmIGl0IGRvZXNuJ3QgZXhpc3QsXG4gICAgLy8gaXQgbWVhbnMgdGhhdCB3ZSd2ZSBoaXQgdGhlIHZpZXcgYm91bmRhcnkgYW5kIHdlIG5lZWQgdG8gZ28gdXAgdG8gdGhlIG5leHQgdmlldy5cbiAgICBpZiAoIXBhcmVudFROb2RlKSB7XG4gICAgICAvLyBCZWZvcmUgd2UgZ28gdG8gdGhlIG5leHQgTFZpZXcsIGNoZWNrIGlmIHRoZSB0b2tlbiBleGlzdHMgb24gdGhlIGN1cnJlbnQgZW1iZWRkZWQgaW5qZWN0b3IuXG4gICAgICBjb25zdCBlbWJlZGRlZFZpZXdJbmplY3RvciA9IGN1cnJlbnRMVmlld1tFTUJFRERFRF9WSUVXX0lOSkVDVE9SXTtcbiAgICAgIGlmIChlbWJlZGRlZFZpZXdJbmplY3Rvcikge1xuICAgICAgICBjb25zdCBlbWJlZGRlZFZpZXdJbmplY3RvclZhbHVlID0gZW1iZWRkZWRWaWV3SW5qZWN0b3IuZ2V0KHRva2VuLCBOT1RfRk9VTkQgYXMgVCwgZmxhZ3MpO1xuICAgICAgICBpZiAoZW1iZWRkZWRWaWV3SW5qZWN0b3JWYWx1ZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGVtYmVkZGVkVmlld0luamVjdG9yVmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gT3RoZXJ3aXNlIGtlZXAgZ29pbmcgdXAgdGhlIHRyZWUuXG4gICAgICBwYXJlbnRUTm9kZSA9IGdldFROb2RlRnJvbUxWaWV3KGN1cnJlbnRMVmlldyk7XG4gICAgICBjdXJyZW50TFZpZXcgPSBjdXJyZW50TFZpZXdbREVDTEFSQVRJT05fVklFV107XG4gICAgfVxuXG4gICAgY3VycmVudFROb2RlID0gcGFyZW50VE5vZGU7XG4gIH1cblxuICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbn1cblxuLyoqIEdldHMgdGhlIFROb2RlIGFzc29jaWF0ZWQgd2l0aCBhbiBMVmlldyBpbnNpZGUgb2YgdGhlIGRlY2xhcmF0aW9uIHZpZXcuICovXG5mdW5jdGlvbiBnZXRUTm9kZUZyb21MVmlldyhsVmlldzogTFZpZXcpOiBURWxlbWVudE5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGwge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdFZpZXdUeXBlID0gdFZpZXcudHlwZTtcblxuICAvLyBUaGUgcGFyZW50IHBvaW50ZXIgZGlmZmVycyBiYXNlZCBvbiBgVFZpZXcudHlwZWAuXG4gIGlmICh0Vmlld1R5cGUgPT09IFRWaWV3VHlwZS5FbWJlZGRlZCkge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRWaWV3LmRlY2xUTm9kZSwgJ0VtYmVkZGVkIFROb2RlcyBzaG91bGQgaGF2ZSBkZWNsYXJhdGlvbiBwYXJlbnRzLicpO1xuICAgIHJldHVybiB0Vmlldy5kZWNsVE5vZGUgYXMgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuICB9IGVsc2UgaWYgKHRWaWV3VHlwZSA9PT0gVFZpZXdUeXBlLkNvbXBvbmVudCkge1xuICAgIC8vIENvbXBvbmVudHMgZG9uJ3QgaGF2ZSBgVFZpZXcuZGVjbFROb2RlYCBiZWNhdXNlIGVhY2ggaW5zdGFuY2Ugb2YgY29tcG9uZW50IGNvdWxkIGJlXG4gICAgLy8gaW5zZXJ0ZWQgaW4gZGlmZmVyZW50IGxvY2F0aW9uLCBoZW5jZSBgVFZpZXcuZGVjbFROb2RlYCBpcyBtZWFuaW5nbGVzcy5cbiAgICByZXR1cm4gbFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cbiJdfQ==