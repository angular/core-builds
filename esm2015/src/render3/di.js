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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILE9BQU8sRUFBQyxZQUFZLEVBQUUsaUJBQWlCLEVBQUMsTUFBTSxtQkFBbUIsQ0FBQztBQUNsRSxPQUFPLEVBQUMsa0JBQWtCLEVBQUUsdUJBQXVCLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUloRixPQUFPLEVBQUMsY0FBYyxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDcEQsT0FBTyxFQUFDLFdBQVcsRUFBQyxNQUFNLDBCQUEwQixDQUFDO0FBRXJELE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDOUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBRTlDLE9BQU8sRUFBQyxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxtQkFBbUIsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUNyRixPQUFPLEVBQVksYUFBYSxFQUFDLE1BQU0sc0JBQXNCLENBQUM7QUFDOUQsT0FBTyxFQUFDLDBCQUEwQixFQUFFLDBCQUEwQixFQUFDLE1BQU0sYUFBYSxDQUFDO0FBQ25GLE9BQU8sRUFBQyxhQUFhLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQ3ZELE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLFNBQVMsQ0FBQztBQUU5QyxPQUFPLEVBQUMsU0FBUyxFQUFFLGtCQUFrQixFQUFtRyxNQUFNLHVCQUF1QixDQUFDO0FBRXRLLE9BQU8sRUFBQyxjQUFjLEVBQUUsZUFBZSxFQUFDLE1BQU0sMEJBQTBCLENBQUM7QUFDekUsT0FBTyxFQUFDLDBCQUEwQixFQUFFLGdCQUFnQixFQUFFLFFBQVEsRUFBUyxNQUFNLEVBQVMsS0FBSyxFQUFtQixNQUFNLG1C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RkFBc0Y7WUFDdEYsdUZBQXVGO1lBQ3ZGLHFGQUFxRjtZQUNyRixxRkFBcUY7WUFDckYsSUFBSSxPQUFPLElBQUksT0FBTyxLQUFLLFVBQVUsRUFBRTtnQkFDckMsT0FBTyxPQUFPLENBQUM7YUFDaEI7WUFFRCxNQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQztTQUN4QztRQUVELDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztJQUN0QixDQUFDLENBQUMsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIExMQyBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtpc0ZvcndhcmRSZWYsIHJlc29sdmVGb3J3YXJkUmVmfSBmcm9tICcuLi9kaS9mb3J3YXJkX3JlZic7XG5pbXBvcnQge2luamVjdFJvb3RMaW1wTW9kZSwgc2V0SW5qZWN0SW1wbGVtZW50YXRpb259IGZyb20gJy4uL2RpL2luamVjdF9zd2l0Y2gnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7SW5qZWN0b3JNYXJrZXJzfSBmcm9tICcuLi9kaS9pbmplY3Rvcl9tYXJrZXInO1xuaW1wb3J0IHtnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2RlZnMnO1xuaW1wb3J0IHtJbmplY3RGbGFnc30gZnJvbSAnLi4vZGkvaW50ZXJmYWNlL2luamVjdG9yJztcbmltcG9ydCB7QWJzdHJhY3RUeXBlLCBUeXBlfSBmcm9tICcuLi9pbnRlcmZhY2UvdHlwZSc7XG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsLCBhc3NlcnRJbmRleEluUmFuZ2V9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7bm9TaWRlRWZmZWN0c30gZnJvbSAnLi4vdXRpbC9jbG9zdXJlJztcblxuaW1wb3J0IHthc3NlcnREaXJlY3RpdmVEZWYsIGFzc2VydE5vZGVJbmplY3RvciwgYXNzZXJ0VE5vZGVGb3JMVmlld30gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtGYWN0b3J5Rm4sIGdldEZhY3RvcnlEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbl9mYWN0b3J5JztcbmltcG9ydCB7dGhyb3dDeWNsaWNEZXBlbmRlbmN5RXJyb3IsIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yfSBmcm9tICcuL2Vycm9yc19kaSc7XG5pbXBvcnQge05HX0VMRU1FTlRfSUQsIE5HX0ZBQ1RPUllfREVGfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge3JlZ2lzdGVyUHJlT3JkZXJIb29rc30gZnJvbSAnLi9ob29rcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtpc0ZhY3RvcnksIE5PX1BBUkVOVF9JTkpFQ1RPUiwgTm9kZUluamVjdG9yRmFjdG9yeSwgTm9kZUluamVjdG9yT2Zmc2V0LCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24sIFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRDb250YWluZXJOb2RlLCBURGlyZWN0aXZlSG9zdE5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVQcm92aWRlckluZGV4ZXMsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc0NvbXBvbmVudERlZiwgaXNDb21wb25lbnRIb3N0fSBmcm9tICcuL2ludGVyZmFjZXMvdHlwZV9jaGVja3MnO1xuaW1wb3J0IHtERUNMQVJBVElPTl9DT01QT05FTlRfVklFVywgREVDTEFSQVRJT05fVklFVywgSU5KRUNUT1IsIExWaWV3LCBUX0hPU1QsIFREYXRhLCBUVklFVywgVFZpZXcsIFRWaWV3VHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnRUTm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtlbnRlckRJLCBnZXRDdXJyZW50VE5vZGUsIGdldExWaWV3LCBsZWF2ZURJfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcn0gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7c3RyaW5naWZ5Rm9yRXJyb3J9IGZyb20gJy4vdXRpbC9zdHJpbmdpZnlfdXRpbHMnO1xuXG5cblxuLyoqXG4gKiBEZWZpbmVzIGlmIHRoZSBjYWxsIHRvIGBpbmplY3RgIHNob3VsZCBpbmNsdWRlIGB2aWV3UHJvdmlkZXJzYCBpbiBpdHMgcmVzb2x1dGlvbi5cbiAqXG4gKiBUaGlzIGlzIHNldCB0byB0cnVlIHdoZW4gd2UgdHJ5IHRvIGluc3RhbnRpYXRlIGEgY29tcG9uZW50LiBUaGlzIHZhbHVlIGlzIHJlc2V0IGluXG4gKiBgZ2V0Tm9kZUluamVjdGFibGVgIHRvIGEgdmFsdWUgd2hpY2ggbWF0Y2hlcyB0aGUgZGVjbGFyYXRpb24gbG9jYXRpb24gb2YgdGhlIHRva2VuIGFib3V0IHRvIGJlXG4gKiBpbnN0YW50aWF0ZWQuIFRoaXMgaXMgZG9uZSBzbyB0aGF0IGlmIHdlIGFyZSBpbmplY3RpbmcgYSB0b2tlbiB3aGljaCB3YXMgZGVjbGFyZWQgb3V0c2lkZSBvZlxuICogYHZpZXdQcm92aWRlcnNgIHdlIGRvbid0IGFjY2lkZW50YWxseSBwdWxsIGB2aWV3UHJvdmlkZXJzYCBpbi5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogQEluamVjdGFibGUoKVxuICogY2xhc3MgTXlTZXJ2aWNlIHtcbiAqICAgY29uc3RydWN0b3IocHVibGljIHZhbHVlOiBTdHJpbmcpIHt9XG4gKiB9XG4gKlxuICogQENvbXBvbmVudCh7XG4gKiAgIHByb3ZpZGVyczogW1xuICogICAgIE15U2VydmljZSxcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3Byb3ZpZGVycycgfVxuICogICBdXG4gKiAgIHZpZXdQcm92aWRlcnM6IFtcbiAqICAgICB7cHJvdmlkZTogU3RyaW5nLCB2YWx1ZTogJ3ZpZXdQcm92aWRlcnMnfVxuICogICBdXG4gKiB9KVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihteVNlcnZpY2U6IE15U2VydmljZSwgdmFsdWU6IFN0cmluZykge1xuICogICAgIC8vIFdlIGV4cGVjdCB0aGF0IENvbXBvbmVudCBjYW4gc2VlIGludG8gYHZpZXdQcm92aWRlcnNgLlxuICogICAgIGV4cGVjdCh2YWx1ZSkudG9FcXVhbCgndmlld1Byb3ZpZGVycycpO1xuICogICAgIC8vIGBNeVNlcnZpY2VgIHdhcyBub3QgZGVjbGFyZWQgaW4gYHZpZXdQcm92aWRlcnNgIGhlbmNlIGl0IGNhbid0IHNlZSBpdC5cbiAqICAgICBleHBlY3QobXlTZXJ2aWNlLnZhbHVlKS50b0VxdWFsKCdwcm92aWRlcnMnKTtcbiAqICAgfVxuICogfVxuICpcbiAqIGBgYFxuICovXG5sZXQgaW5jbHVkZVZpZXdQcm92aWRlcnMgPSB0cnVlO1xuXG5leHBvcnQgZnVuY3Rpb24gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnModjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZSA9IGluY2x1ZGVWaWV3UHJvdmlkZXJzO1xuICBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IHY7XG4gIHJldHVybiBvbGRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT58SW5qZWN0aW9uVG9rZW48YW55PnxzdHJpbmcpOiB2b2lkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydEVxdWFsKHRWaWV3LmZpcnN0Q3JlYXRlUGFzcywgdHJ1ZSwgJ2V4cGVjdGVkIGZpcnN0Q3JlYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZDtcbiAgaWYgKHR5cGVvZiB0eXBlID09PSAnc3RyaW5nJykge1xuICAgIGlkID0gdHlwZS5jaGFyQ29kZUF0KDApIHx8IDA7XG4gIH0gZWxzZSBpZiAodHlwZS5oYXNPd25Qcm9wZXJ0eShOR19FTEVNRU5UX0lEKSkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgfVxuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGEgYXMgbnVtYmVyW107XG5cbiAgaWYgKGI3KSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDddIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA2XSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA1XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNF0gfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAzXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMl0gfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleF0gfD0gbWFzaykpO1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBsVmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIHROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLCBsVmlldzogTFZpZXcpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBsVmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzKSB7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGxWaWV3Lmxlbmd0aDtcbiAgICBpbnNlcnRCbG9vbSh0Vmlldy5kYXRhLCB0Tm9kZSk7ICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20obFZpZXcsIG51bGwpOyAgICAgICAgLy8gZm91bmRhdGlvbiBmb3IgY3VtdWxhdGl2ZSBibG9vbVxuICAgIGluc2VydEJsb29tKHRWaWV3LmJsdWVwcmludCwgbnVsbCk7XG4gIH1cblxuICBjb25zdCBwYXJlbnRMb2MgPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBsVmlldyk7XG4gIGNvbnN0IGluamVjdG9ySW5kZXggPSB0Tm9kZS5pbmplY3RvckluZGV4O1xuXG4gIC8vIElmIGEgcGFyZW50IGluamVjdG9yIGNhbid0IGJlIGZvdW5kLCBpdHMgbG9jYXRpb24gaXMgc2V0IHRvIC0xLlxuICAvLyBJbiB0aGF0IGNhc2UsIHdlIGRvbid0IG5lZWQgdG8gc2V0IHVwIGEgY3VtdWxhdGl2ZSBibG9vbVxuICBpZiAoaGFzUGFyZW50SW5qZWN0b3IocGFyZW50TG9jKSkge1xuICAgIGNvbnN0IHBhcmVudEluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2MpO1xuICAgIGNvbnN0IHBhcmVudExWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgbFZpZXcpO1xuICAgIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRMVmlld1tUVklFV10uZGF0YSBhcyBhbnk7XG4gICAgLy8gQ3JlYXRlcyBhIGN1bXVsYXRpdmUgYmxvb20gZmlsdGVyIHRoYXQgbWVyZ2VzIHRoZSBwYXJlbnQncyBibG9vbSBmaWx0ZXJcbiAgICAvLyBhbmQgaXRzIG93biBjdW11bGF0aXZlIGJsb29tICh3aGljaCBjb250YWlucyB0b2tlbnMgZm9yIGFsbCBhbmNlc3RvcnMpXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBOb2RlSW5qZWN0b3JPZmZzZXQuQkxPT01fU0laRTsgaSsrKSB7XG4gICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgaV0gPSBwYXJlbnRMVmlld1twYXJlbnRJbmRleCArIGldIHwgcGFyZW50RGF0YVtwYXJlbnRJbmRleCArIGldO1xuICAgIH1cbiAgfVxuXG4gIGxWaWV3W2luamVjdG9ySW5kZXggKyBOb2RlSW5qZWN0b3JPZmZzZXQuUEFSRU5UXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJsb29tKGFycjogYW55W10sIGZvb3RlcjogVE5vZGV8bnVsbCk6IHZvaWQge1xuICBhcnIucHVzaCgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCBmb290ZXIpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmplY3RvckluZGV4KHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgbFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5QQVJFTlRdID09PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRJbmRleEluUmFuZ2UobFZpZXcsIHROb2RlLmluamVjdG9ySW5kZXgpO1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKlxuICogQHJldHVybnMgUmV0dXJucyBhIG51bWJlciB0aGF0IGlzIHRoZSBjb21iaW5hdGlvbiBvZiB0aGUgbnVtYmVyIG9mIExWaWV3cyB0aGF0IHdlIGhhdmUgdG8gZ28gdXBcbiAqIHRvIGZpbmQgdGhlIExWaWV3IGNvbnRhaW5pbmcgdGhlIHBhcmVudCBpbmplY3QgQU5EIHRoZSBpbmRleCBvZiB0aGUgaW5qZWN0b3Igd2l0aGluIHRoYXQgTFZpZXcuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3KTogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAvLyBJZiB3ZSBoYXZlIGEgcGFyZW50IGBUTm9kZWAgYW5kIHRoZXJlIGlzIGFuIGluamVjdG9yIGFzc29jaWF0ZWQgd2l0aCBpdCB3ZSBhcmUgZG9uZSwgYmVjYXVzZVxuICAgIC8vIHRoZSBwYXJlbnQgaW5qZWN0b3IgaXMgd2l0aGluIHRoZSBjdXJyZW50IGBMVmlld2AuXG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4IGFzIGFueTsgIC8vIFZpZXdPZmZzZXQgaXMgMFxuICB9XG5cbiAgLy8gV2hlbiBwYXJlbnQgaW5qZWN0b3IgbG9jYXRpb24gaXMgY29tcHV0ZWQgaXQgbWF5IGJlIG91dHNpZGUgb2YgdGhlIGN1cnJlbnQgdmlldy4gKGllIGl0IGNvdWxkXG4gIC8vIGJlIHBvaW50aW5nIHRvIGEgZGVjbGFyZWQgcGFyZW50IGxvY2F0aW9uKS4gVGhpcyB2YXJpYWJsZSBzdG9yZXMgbnVtYmVyIG9mIGRlY2xhcmF0aW9uIHBhcmVudHNcbiAgLy8gd2UgbmVlZCB0byB3YWxrIHVwIGluIG9yZGVyIHRvIGZpbmQgdGhlIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbi5cbiAgbGV0IGRlY2xhcmF0aW9uVmlld09mZnNldCA9IDA7XG4gIGxldCBwYXJlbnRUTm9kZTogVE5vZGV8bnVsbCA9IG51bGw7XG4gIGxldCBsVmlld0N1cnNvcjogTFZpZXd8bnVsbCA9IGxWaWV3O1xuXG4gIC8vIFRoZSBwYXJlbnQgaW5qZWN0b3IgaXMgbm90IGluIHRoZSBjdXJyZW50IGBMVmlld2AuIFdlIHdpbGwgaGF2ZSB0byB3YWxrIHRoZSBkZWNsYXJlZCBwYXJlbnRcbiAgLy8gYExWaWV3YCBoaWVyYXJjaHkgYW5kIGxvb2sgZm9yIGl0LiBJZiB3ZSB3YWxrIG9mIHRoZSB0b3AsIHRoYXQgbWVhbnMgdGhhdCB0aGVyZSBpcyBubyBwYXJlbnRcbiAgLy8gYE5vZGVJbmplY3RvcmAuXG4gIHdoaWxlIChsVmlld0N1cnNvciAhPT0gbnVsbCkge1xuICAgIC8vIEZpcnN0IGRldGVybWluZSB0aGUgYHBhcmVudFROb2RlYCBsb2NhdGlvbi4gVGhlIHBhcmVudCBwb2ludGVyIGRpZmZlcnMgYmFzZWQgb24gYFRWaWV3LnR5cGVgLlxuICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdDdXJzb3JbVFZJRVddO1xuICAgIGNvbnN0IHRWaWV3VHlwZSA9IHRWaWV3LnR5cGU7XG4gICAgaWYgKHRWaWV3VHlwZSA9PT0gVFZpZXdUeXBlLkVtYmVkZGVkKSB7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnREZWZpbmVkKHRWaWV3LmRlY2xUTm9kZSwgJ0VtYmVkZGVkIFROb2RlcyBzaG91bGQgaGF2ZSBkZWNsYXJhdGlvbiBwYXJlbnRzLicpO1xuICAgICAgcGFyZW50VE5vZGUgPSB0Vmlldy5kZWNsVE5vZGU7XG4gICAgfSBlbHNlIGlmICh0Vmlld1R5cGUgPT09IFRWaWV3VHlwZS5Db21wb25lbnQpIHtcbiAgICAgIC8vIENvbXBvbmVudHMgZG9uJ3QgaGF2ZSBgVFZpZXcuZGVjbFROb2RlYCBiZWNhdXNlIGVhY2ggaW5zdGFuY2Ugb2YgY29tcG9uZW50IGNvdWxkIGJlXG4gICAgICAvLyBpbnNlcnRlZCBpbiBkaWZmZXJlbnQgbG9jYXRpb24sIGhlbmNlIGBUVmlldy5kZWNsVE5vZGVgIGlzIG1lYW5pbmdsZXNzLlxuICAgICAgcGFyZW50VE5vZGUgPSBsVmlld0N1cnNvcltUX0hPU1RdO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcudHlwZSwgVFZpZXdUeXBlLlJvb3QsICdSb290IHR5cGUgZXhwZWN0ZWQnKTtcbiAgICAgIHBhcmVudFROb2RlID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHBhcmVudFROb2RlID09PSBudWxsKSB7XG4gICAgICAvLyBJZiB3ZSBoYXZlIG5vIHBhcmVudCwgdGhhbiB3ZSBhcmUgZG9uZS5cbiAgICAgIHJldHVybiBOT19QQVJFTlRfSU5KRUNUT1I7XG4gICAgfVxuXG4gICAgbmdEZXZNb2RlICYmIHBhcmVudFROb2RlICYmIGFzc2VydFROb2RlRm9yTFZpZXcocGFyZW50VE5vZGUhLCBsVmlld0N1cnNvcltERUNMQVJBVElPTl9WSUVXXSEpO1xuICAgIC8vIEV2ZXJ5IGl0ZXJhdGlvbiBvZiB0aGUgbG9vcCByZXF1aXJlcyB0aGF0IHdlIGdvIHRvIHRoZSBkZWNsYXJlZCBwYXJlbnQuXG4gICAgZGVjbGFyYXRpb25WaWV3T2Zmc2V0Kys7XG4gICAgbFZpZXdDdXJzb3IgPSBsVmlld0N1cnNvcltERUNMQVJBVElPTl9WSUVXXTtcblxuICAgIGlmIChwYXJlbnRUTm9kZS5pbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgLy8gV2UgZm91bmQgYSBOb2RlSW5qZWN0b3Igd2hpY2ggcG9pbnRzIHRvIHNvbWV0aGluZy5cbiAgICAgIHJldHVybiAocGFyZW50VE5vZGUuaW5qZWN0b3JJbmRleCB8XG4gICAgICAgICAgICAgIChkZWNsYXJhdGlvblZpZXdPZmZzZXQgPDwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSkgYXMgYW55O1xuICAgIH1cbiAgfVxuICByZXR1cm4gTk9fUEFSRU5UX0lOSkVDVE9SO1xufVxuLyoqXG4gKiBNYWtlcyBhIHR5cGUgb3IgYW4gaW5qZWN0aW9uIHRva2VuIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhblxuICogaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdHlwZSBvciB0aGUgaW5qZWN0aW9uIHRva2VuIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIHRva2VuOiBJbmplY3Rpb25Ub2tlbjxhbnk+fFR5cGU8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChpbmplY3RvckluZGV4LCB0VmlldywgdG9rZW4pO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQuybVjbXAgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGVJbXBsKHROb2RlOiBUTm9kZSwgYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfG51bGwge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0VE5vZGVUeXBlKHROb2RlLCBUTm9kZVR5cGUuQW55Q29udGFpbmVyIHwgVE5vZGVUeXBlLkFueVJOb2RlKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgaWYgKGF0dHJOYW1lVG9JbmplY3QgPT09ICdjbGFzcycpIHtcbiAgICByZXR1cm4gdE5vZGUuY2xhc3NlcztcbiAgfVxuICBpZiAoYXR0ck5hbWVUb0luamVjdCA9PT0gJ3N0eWxlJykge1xuICAgIHJldHVybiB0Tm9kZS5zdHlsZXM7XG4gIH1cblxuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBjb25zdCBhdHRyc0xlbmd0aCA9IGF0dHJzLmxlbmd0aDtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcblxuICAgICAgLy8gSWYgd2UgaGl0IGEgYEJpbmRpbmdzYCBvciBgVGVtcGxhdGVgIG1hcmtlciB0aGVuIHdlIGFyZSBkb25lLlxuICAgICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIodmFsdWUpKSBicmVhaztcblxuICAgICAgLy8gU2tpcCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgIGlmICh2YWx1ZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyB3ZSBza2lwIHRoZSBuZXh0IHR3byB2YWx1ZXNcbiAgICAgICAgLy8gYXMgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzIGxvb2tzIGxpa2VcbiAgICAgICAgLy8gWy4uLiwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSwgJ2h0dHA6Ly9zb21ldXJpLmNvbS90ZXN0JywgJ3Rlc3Q6ZXhpc3QnLFxuICAgICAgICAvLyAnZXhpc3RWYWx1ZScsIC4uLl1cbiAgICAgICAgaSA9IGkgKyAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFNraXAgdG8gdGhlIGZpcnN0IHZhbHVlIG9mIHRoZSBtYXJrZWQgYXR0cmlidXRlLlxuICAgICAgICBpKys7XG4gICAgICAgIHdoaWxlIChpIDwgYXR0cnNMZW5ndGggJiYgdHlwZW9mIGF0dHJzW2ldID09PSAnc3RyaW5nJykge1xuICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGkgPSBpICsgMjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuZnVuY3Rpb24gbm90Rm91bmRWYWx1ZU9yVGhyb3c8VD4oXG4gICAgbm90Rm91bmRWYWx1ZTogVHxudWxsLCB0b2tlbjogVHlwZTxUPnxBYnN0cmFjdFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFR8XG4gICAgbnVsbCB7XG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSB7XG4gICAgcmV0dXJuIG5vdEZvdW5kVmFsdWU7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3dQcm92aWRlck5vdEZvdW5kRXJyb3IodG9rZW4sICdOb2RlSW5qZWN0b3InKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIE1vZHVsZUluamVjdG9yIG9yIHRocm93cyBleGNlcHRpb25cbiAqXG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBjb250YWlucyB0aGUgYHROb2RlYFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiB3aGVuIHRoZSBpbmplY3Rpb24gZmxhZ3MgaXMgYEluamVjdEZsYWdzLk9wdGlvbmFsYFxuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIHRocm93cyBhbiBleGNlcHRpb25cbiAqL1xuZnVuY3Rpb24gbG9va3VwVG9rZW5Vc2luZ01vZHVsZUluamVjdG9yPFQ+KFxuICAgIGxWaWV3OiBMVmlldywgdG9rZW46IFR5cGU8VD58QWJzdHJhY3RUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MsXG4gICAgbm90Rm91bmRWYWx1ZT86IGFueSk6IFR8bnVsbCB7XG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsICYmIG5vdEZvdW5kVmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIFRoaXMgbXVzdCBiZSBzZXQgb3IgdGhlIE51bGxJbmplY3RvciB3aWxsIHRocm93IGZvciBvcHRpb25hbCBkZXBzXG4gICAgbm90Rm91bmRWYWx1ZSA9IG51bGw7XG4gIH1cblxuICBpZiAoKGZsYWdzICYgKEluamVjdEZsYWdzLlNlbGYgfCBJbmplY3RGbGFncy5Ib3N0KSkgPT09IDApIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGxWaWV3W0lOSkVDVE9SXTtcbiAgICAvLyBzd2l0Y2ggdG8gYGluamVjdEluamVjdG9yT25seWAgaW1wbGVtZW50YXRpb24gZm9yIG1vZHVsZSBpbmplY3Rvciwgc2luY2UgbW9kdWxlIGluamVjdG9yXG4gICAgLy8gc2hvdWxkIG5vdCBoYXZlIGFjY2VzcyB0byBDb21wb25lbnQvRGlyZWN0aXZlIERJIHNjb3BlICh0aGF0IG1heSBoYXBwZW4gdGhyb3VnaFxuICAgIC8vIGBkaXJlY3RpdmVJbmplY3RgIGltcGxlbWVudGF0aW9uKVxuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gPSBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbih1bmRlZmluZWQpO1xuICAgIHRyeSB7XG4gICAgICBpZiAobW9kdWxlSW5qZWN0b3IpIHtcbiAgICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gaW5qZWN0Um9vdExpbXBNb2RlKHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgfVxuICB9XG4gIHJldHVybiBub3RGb3VuZFZhbHVlT3JUaHJvdzxUPihub3RGb3VuZFZhbHVlLCB0b2tlbiwgZmxhZ3MpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIE5vZGVJbmplY3RvcnMgPT4gTW9kdWxlSW5qZWN0b3IuXG4gKlxuICogTG9vayBmb3IgdGhlIGluamVjdG9yIHByb3ZpZGluZyB0aGUgdG9rZW4gYnkgd2Fsa2luZyB1cCB0aGUgbm9kZSBpbmplY3RvciB0cmVlIGFuZCB0aGVuXG4gKiB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUuXG4gKlxuICogVGhpcyBmdW5jdGlvbiBwYXRjaGVzIGB0b2tlbmAgd2l0aCBgX19OR19FTEVNRU5UX0lEX19gIHdoaWNoIGNvbnRhaW5zIHRoZSBpZCBmb3IgdGhlIGJsb29tXG4gKiBmaWx0ZXIuIGAtMWAgaXMgcmVzZXJ2ZWQgZm9yIGluamVjdGluZyBgSW5qZWN0b3JgIChpbXBsZW1lbnRlZCBieSBgTm9kZUluamVjdG9yYClcbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIE5vZGUgd2hlcmUgdGhlIHNlYXJjaCBmb3IgdGhlIGluamVjdG9yIHNob3VsZCBzdGFydFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGB0Tm9kZWBcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEBwYXJhbSBub3RGb3VuZFZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gd2hlbiB0aGUgaW5qZWN0aW9uIGZsYWdzIGlzIGBJbmplY3RGbGFncy5PcHRpb25hbGBcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciwgYG51bGxgIHdoZW4gbm90IGZvdW5kLCBvciBgbm90Rm91bmRWYWx1ZWAgaWYgcHJvdmlkZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICB0Tm9kZTogVERpcmVjdGl2ZUhvc3ROb2RlfG51bGwsIGxWaWV3OiBMVmlldywgdG9rZW46IFR5cGU8VD58QWJzdHJhY3RUeXBlPFQ+fEluamVjdGlvblRva2VuPFQ+LFxuICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQsIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBpZiAodE5vZGUgIT09IG51bGwpIHtcbiAgICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW4pO1xuICAgIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gICAgLy8gc28ganVzdCBjYWxsIHRoZSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBpdC5cbiAgICBpZiAodHlwZW9mIGJsb29tSGFzaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgaWYgKCFlbnRlckRJKGxWaWV3LCB0Tm9kZSwgZmxhZ3MpKSB7XG4gICAgICAgIC8vIEZhaWxlZCB0byBlbnRlciBESSwgdHJ5IG1vZHVsZSBpbmplY3RvciBpbnN0ZWFkLiBJZiBhIHRva2VuIGlzIGluamVjdGVkIHdpdGggdGhlIEBIb3N0XG4gICAgICAgIC8vIGZsYWcsIHRoZSBtb2R1bGUgaW5qZWN0b3IgaXMgbm90IHNlYXJjaGVkIGZvciB0aGF0IHRva2VuIGluIEl2eS5cbiAgICAgICAgcmV0dXJuIChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QpID9cbiAgICAgICAgICAgIG5vdEZvdW5kVmFsdWVPclRocm93PFQ+KG5vdEZvdW5kVmFsdWUsIHRva2VuLCBmbGFncykgOlxuICAgICAgICAgICAgbG9va3VwVG9rZW5Vc2luZ01vZHVsZUluamVjdG9yPFQ+KGxWaWV3LCB0b2tlbiwgZmxhZ3MsIG5vdEZvdW5kVmFsdWUpO1xuICAgICAgfVxuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgdmFsdWUgPSBibG9vbUhhc2goKTtcbiAgICAgICAgaWYgKHZhbHVlID09IG51bGwgJiYgIShmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSkge1xuICAgICAgICAgIHRocm93UHJvdmlkZXJOb3RGb3VuZEVycm9yKHRva2VuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH0gZmluYWxseSB7XG4gICAgICAgIGxlYXZlREkoKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdudW1iZXInKSB7XG4gICAgICAvLyBBIHJlZmVyZW5jZSB0byB0aGUgcHJldmlvdXMgaW5qZWN0b3IgVFZpZXcgdGhhdCB3YXMgZm91bmQgd2hpbGUgY2xpbWJpbmcgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGluamVjdG9yIHRyZWUuIFRoaXMgaXMgdXNlZCB0byBrbm93IGlmIHZpZXdQcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIG9uIHRoZSBjdXJyZW50XG4gICAgICAvLyBpbmplY3Rvci5cbiAgICAgIGxldCBwcmV2aW91c1RWaWV3OiBUVmlld3xudWxsID0gbnVsbDtcbiAgICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICAgICAgbGV0IHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24gPSBOT19QQVJFTlRfSU5KRUNUT1I7XG4gICAgICBsZXQgaG9zdFRFbGVtZW50Tm9kZTogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ID8gbFZpZXdbREVDTEFSQVRJT05fQ09NUE9ORU5UX1ZJRVddW1RfSE9TVF0gOiBudWxsO1xuXG4gICAgICAvLyBJZiB3ZSBzaG91bGQgc2tpcCB0aGlzIGluamVjdG9yLCBvciBpZiB0aGVyZSBpcyBubyBpbmplY3RvciBvbiB0aGlzIG5vZGUsIHN0YXJ0IGJ5XG4gICAgICAvLyBzZWFyY2hpbmcgdGhlIHBhcmVudCBpbmplY3Rvci5cbiAgICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSB8fCBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICAgIHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JJbmRleCA9PT0gLTEgPyBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBsVmlldykgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbFZpZXdbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5QQVJFTlRdO1xuXG4gICAgICAgIGlmIChwYXJlbnRMb2NhdGlvbiA9PT0gTk9fUEFSRU5UX0lOSkVDVE9SIHx8ICFzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIGZhbHNlKSkge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBwcmV2aW91c1RWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgICBsVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZVxuICAgICAgLy8gKmlzbid0KiBhIG1hdGNoLlxuICAgICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlSW5qZWN0b3IobFZpZXcsIGluamVjdG9ySW5kZXgpO1xuXG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IGluamVjdG9yLiBJZiBpdCBtYXRjaGVzLCBzZWUgaWYgaXQgY29udGFpbnMgdG9rZW4uXG4gICAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICAgIGFzc2VydFROb2RlRm9yTFZpZXcoXG4gICAgICAgICAgICAgICAgdFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSBhcyBUTm9kZSwgbFZpZXcpO1xuICAgICAgICBpZiAoYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIHRWaWV3LmRhdGEpKSB7XG4gICAgICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoXG4gICAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAgIC8vIHRoZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBpbnN0YW5jZTogVHxudWxsID0gc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihcbiAgICAgICAgICAgICAgaW5qZWN0b3JJbmRleCwgbFZpZXcsIHRva2VuLCBwcmV2aW91c1RWaWV3LCBmbGFncywgaG9zdFRFbGVtZW50Tm9kZSk7XG4gICAgICAgICAgaWYgKGluc3RhbmNlICE9PSBOT1RfRk9VTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGFyZW50TG9jYXRpb24gPSBsVmlld1tpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlBBUkVOVF07XG4gICAgICAgIGlmIChwYXJlbnRMb2NhdGlvbiAhPT0gTk9fUEFSRU5UX0lOSkVDVE9SICYmXG4gICAgICAgICAgICBzaG91bGRTZWFyY2hQYXJlbnQoXG4gICAgICAgICAgICAgICAgZmxhZ3MsXG4gICAgICAgICAgICAgICAgbFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIE5vZGVJbmplY3Rvck9mZnNldC5UTk9ERV0gPT09IGhvc3RURWxlbWVudE5vZGUpICYmXG4gICAgICAgICAgICBibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgbFZpZXcpKSB7XG4gICAgICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgICAgIHByZXZpb3VzVFZpZXcgPSB0VmlldztcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBJZiB3ZSBzaG91bGQgbm90IHNlYXJjaCBwYXJlbnQgT1IgSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBkb2VzIG5vdCBoYXZlIHRoZVxuICAgICAgICAgIC8vIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUgd2UgY2FuIGdpdmUgdXAgb24gdHJhdmVyc2luZyB1cCB0byBmaW5kIHRoZSBzcGVjaWZpY1xuICAgICAgICAgIC8vIGluamVjdG9yLlxuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsb29rdXBUb2tlblVzaW5nTW9kdWxlSW5qZWN0b3I8VD4obFZpZXcsIHRva2VuLCBmbGFncywgbm90Rm91bmRWYWx1ZSk7XG59XG5cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm9kZUluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IoZ2V0Q3VycmVudFROb2RlKCkhIGFzIFREaXJlY3RpdmVIb3N0Tm9kZSwgZ2V0TFZpZXcoKSkgYXMgYW55O1xufVxuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnxBYnN0cmFjdFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD4sXG4gICAgcHJldmlvdXNUVmlldzogVFZpZXd8bnVsbCwgZmxhZ3M6IEluamVjdEZsYWdzLCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZXxudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBjdXJyZW50VFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgTm9kZUluamVjdG9yT2Zmc2V0LlROT0RFXSBhcyBUTm9kZTtcbiAgLy8gRmlyc3QsIHdlIG5lZWQgdG8gZGV0ZXJtaW5lIGlmIHZpZXcgcHJvdmlkZXJzIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgc3RhcnRpbmcgZWxlbWVudC5cbiAgLy8gVGhlcmUgYXJlIHR3byBwb3NzaWJpbGl0aWVzXG4gIGNvbnN0IGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPSBwcmV2aW91c1RWaWV3ID09IG51bGwgP1xuICAgICAgLy8gMSkgVGhpcyBpcyB0aGUgZmlyc3QgaW52b2NhdGlvbiBgcHJldmlvdXNUVmlldyA9PSBudWxsYCB3aGljaCBtZWFucyB0aGF0IHdlIGFyZSBhdCB0aGVcbiAgICAgIC8vIGBUTm9kZWAgb2Ygd2hlcmUgaW5qZWN0b3IgaXMgc3RhcnRpbmcgdG8gbG9vay4gSW4gc3VjaCBhIGNhc2UgdGhlIG9ubHkgdGltZSB3ZSBhcmUgYWxsb3dlZFxuICAgICAgLy8gdG8gbG9vayBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzIGlzIGlmOlxuICAgICAgLy8gLSB3ZSBhcmUgb24gYSBjb21wb25lbnRcbiAgICAgIC8vIC0gQU5EIHRoZSBpbmplY3RvciBzZXQgYGluY2x1ZGVWaWV3UHJvdmlkZXJzYCB0byB0cnVlIChpbXBseWluZyB0aGF0IHRoZSB0b2tlbiBjYW4gc2VlXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzIGJlY2F1c2UgaXQgaXMgdGhlIENvbXBvbmVudCBvciBhIFNlcnZpY2Ugd2hpY2ggaXRzZWxmIHdhcyBkZWNsYXJlZCBpblxuICAgICAgLy8gVmlld1Byb3ZpZGVycylcbiAgICAgIChpc0NvbXBvbmVudEhvc3QodE5vZGUpICYmIGluY2x1ZGVWaWV3UHJvdmlkZXJzKSA6XG4gICAgICAvLyAyKSBgcHJldmlvdXNUVmlldyAhPSBudWxsYCB3aGljaCBtZWFucyB0aGF0IHdlIGFyZSBub3cgd2Fsa2luZyBhY3Jvc3MgdGhlIHBhcmVudCBub2Rlcy5cbiAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHdlIGFyZSBvbmx5IGFsbG93ZWQgdG8gbG9vayBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzIGlmOlxuICAgICAgLy8gLSBXZSBqdXN0IGNyb3NzZWQgZnJvbSBjaGlsZCBWaWV3IHRvIFBhcmVudCBWaWV3IGBwcmV2aW91c1RWaWV3ICE9IGN1cnJlbnRUVmlld2BcbiAgICAgIC8vIC0gQU5EIHRoZSBwYXJlbnQgVE5vZGUgaXMgYW4gRWxlbWVudC5cbiAgICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBqdXN0IGNhbWUgZnJvbSB0aGUgQ29tcG9uZW50J3MgVmlldyBhbmQgdGhlcmVmb3JlIGFyZSBhbGxvd2VkIHRvIHNlZVxuICAgICAgLy8gaW50byB0aGUgVmlld1Byb3ZpZGVycy5cbiAgICAgIChwcmV2aW91c1RWaWV3ICE9IGN1cnJlbnRUVmlldyAmJiAoKHROb2RlLnR5cGUgJiBUTm9kZVR5cGUuQW55Uk5vZGUpICE9PSAwKSk7XG5cbiAgLy8gVGhpcyBzcGVjaWFsIGNhc2UgaGFwcGVucyB3aGVuIHRoZXJlIGlzIGEgQGhvc3Qgb24gdGhlIGluamVjdCBhbmQgd2hlbiB3ZSBhcmUgc2VhcmNoaW5nXG4gIC8vIG9uIHRoZSBob3N0IGVsZW1lbnQgbm9kZS5cbiAgY29uc3QgaXNIb3N0U3BlY2lhbENhc2UgPSAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0KSAmJiBob3N0VEVsZW1lbnROb2RlID09PSB0Tm9kZTtcblxuICBjb25zdCBpbmplY3RhYmxlSWR4ID0gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcihcbiAgICAgIHROb2RlLCBjdXJyZW50VFZpZXcsIHRva2VuLCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzLCBpc0hvc3RTcGVjaWFsQ2FzZSk7XG4gIGlmIChpbmplY3RhYmxlSWR4ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGxWaWV3LCBjdXJyZW50VFZpZXcsIGluamVjdGFibGVJZHgsIHROb2RlIGFzIFRFbGVtZW50Tm9kZSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIE5PVF9GT1VORDtcbiAgfVxufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciB0aGUgZ2l2ZW4gdG9rZW4gYW1vbmcgdGhlIG5vZGUncyBkaXJlY3RpdmVzIGFuZCBwcm92aWRlcnMuXG4gKlxuICogQHBhcmFtIHROb2RlIFROb2RlIG9uIHdoaWNoIGRpcmVjdGl2ZXMgYXJlIHByZXNlbnQuXG4gKiBAcGFyYW0gdFZpZXcgVGhlIHRWaWV3IHdlIGFyZSBjdXJyZW50bHkgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHRva2VuIFByb3ZpZGVyIHRva2VuIG9yIHR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcGFyYW0gY2FuQWNjZXNzVmlld1Byb3ZpZGVycyBXaGV0aGVyIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBjb25zaWRlcmVkLlxuICogQHBhcmFtIGlzSG9zdFNwZWNpYWxDYXNlIFdoZXRoZXIgdGhlIGhvc3Qgc3BlY2lhbCBjYXNlIGFwcGxpZXMuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBwcm92aWRlciwgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyPFQ+KFxuICAgIHROb2RlOiBUTm9kZSwgdFZpZXc6IFRWaWV3LCB0b2tlbjogVHlwZTxUPnxBYnN0cmFjdFR5cGU8VD58SW5qZWN0aW9uVG9rZW48VD58c3RyaW5nLFxuICAgIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnM6IGJvb2xlYW4sIGlzSG9zdFNwZWNpYWxDYXNlOiBib29sZWFufG51bWJlcik6IG51bWJlcnxudWxsIHtcbiAgY29uc3Qgbm9kZVByb3ZpZGVySW5kZXhlcyA9IHROb2RlLnByb3ZpZGVySW5kZXhlcztcbiAgY29uc3QgdEluamVjdGFibGVzID0gdFZpZXcuZGF0YTtcblxuICBjb25zdCBpbmplY3RhYmxlc1N0YXJ0ID0gbm9kZVByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBkaXJlY3RpdmVzU3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZGlyZWN0aXZlRW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgbm9kZVByb3ZpZGVySW5kZXhlcyA+PiBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdDtcbiAgY29uc3Qgc3RhcnRpbmdJbmRleCA9XG4gICAgICBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID8gaW5qZWN0YWJsZXNTdGFydCA6IGluamVjdGFibGVzU3RhcnQgKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQ7XG4gIC8vIFdoZW4gdGhlIGhvc3Qgc3BlY2lhbCBjYXNlIGFwcGxpZXMsIG9ubHkgdGhlIHZpZXdQcm92aWRlcnMgYW5kIHRoZSBjb21wb25lbnQgYXJlIHZpc2libGVcbiAgY29uc3QgZW5kSW5kZXggPSBpc0hvc3RTcGVjaWFsQ2FzZSA/IGluamVjdGFibGVzU3RhcnQgKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQgOiBkaXJlY3RpdmVFbmQ7XG4gIGZvciAobGV0IGkgPSBzdGFydGluZ0luZGV4OyBpIDwgZW5kSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyVG9rZW5PckRlZiA9XG4gICAgICAgIHRJbmplY3RhYmxlc1tpXSBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUeXBlPGFueT58IERpcmVjdGl2ZURlZjxhbnk+fCBzdHJpbmc7XG4gICAgaWYgKGkgPCBkaXJlY3RpdmVzU3RhcnQgJiYgdG9rZW4gPT09IHByb3ZpZGVyVG9rZW5PckRlZiB8fFxuICAgICAgICBpID49IGRpcmVjdGl2ZXNTdGFydCAmJiAocHJvdmlkZXJUb2tlbk9yRGVmIGFzIERpcmVjdGl2ZURlZjxhbnk+KS50eXBlID09PSB0b2tlbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIGlmIChpc0hvc3RTcGVjaWFsQ2FzZSkge1xuICAgIGNvbnN0IGRpckRlZiA9IHRJbmplY3RhYmxlc1tkaXJlY3RpdmVzU3RhcnRdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkaXJEZWYgJiYgaXNDb21wb25lbnREZWYoZGlyRGVmKSAmJiBkaXJEZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBkaXJlY3RpdmVzU3RhcnQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHJpZXZlIG9yIGluc3RhbnRpYXRlIHRoZSBpbmplY3RhYmxlIGZyb20gdGhlIGBMVmlld2AgYXQgcGFydGljdWxhciBgaW5kZXhgLlxuICpcbiAqIFRoaXMgZnVuY3Rpb24gY2hlY2tzIHRvIHNlZSBpZiB0aGUgdmFsdWUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQgYW5kIGlmIHNvIHJldHVybnMgdGhlXG4gKiBjYWNoZWQgYGluamVjdGFibGVgLiBPdGhlcndpc2UgaWYgaXQgZGV0ZWN0cyB0aGF0IHRoZSB2YWx1ZSBpcyBzdGlsbCBhIGZhY3RvcnkgaXRcbiAqIGluc3RhbnRpYXRlcyB0aGUgYGluamVjdGFibGVgIGFuZCBjYWNoZXMgdGhlIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgbFZpZXc6IExWaWV3LCB0VmlldzogVFZpZXcsIGluZGV4OiBudW1iZXIsIHROb2RlOiBURGlyZWN0aXZlSG9zdE5vZGUpOiBhbnkge1xuICBsZXQgdmFsdWUgPSBsVmlld1tpbmRleF07XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YTtcbiAgaWYgKGlzRmFjdG9yeSh2YWx1ZSkpIHtcbiAgICBjb25zdCBmYWN0b3J5OiBOb2RlSW5qZWN0b3JGYWN0b3J5ID0gdmFsdWU7XG4gICAgaWYgKGZhY3RvcnkucmVzb2x2aW5nKSB7XG4gICAgICB0aHJvd0N5Y2xpY0RlcGVuZGVuY3lFcnJvcihzdHJpbmdpZnlGb3JFcnJvcih0RGF0YVtpbmRleF0pKTtcbiAgICB9XG4gICAgY29uc3QgcHJldmlvdXNJbmNsdWRlVmlld1Byb3ZpZGVycyA9IHNldEluY2x1ZGVWaWV3UHJvdmlkZXJzKGZhY3RvcnkuY2FuU2VlVmlld1Byb3ZpZGVycyk7XG4gICAgZmFjdG9yeS5yZXNvbHZpbmcgPSB0cnVlO1xuICAgIGNvbnN0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24gPVxuICAgICAgICBmYWN0b3J5LmluamVjdEltcGwgPyBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihmYWN0b3J5LmluamVjdEltcGwpIDogbnVsbDtcbiAgICBjb25zdCBzdWNjZXNzID0gZW50ZXJESShsVmlldywgdE5vZGUsIEluamVjdEZsYWdzLkRlZmF1bHQpO1xuICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgIHN1Y2Nlc3MsIHRydWUsXG4gICAgICAgICAgICAnQmVjYXVzZSBmbGFncyBkbyBub3QgY29udGFpbiBcXGBTa2lwU2VsZlxcJyB3ZSBleHBlY3QgdGhpcyB0byBhbHdheXMgc3VjY2VlZC4nKTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBsVmlld1tpbmRleF0gPSBmYWN0b3J5LmZhY3RvcnkodW5kZWZpbmVkLCB0RGF0YSwgbFZpZXcsIHROb2RlKTtcbiAgICAgIC8vIFRoaXMgY29kZSBwYXRoIGlzIGhpdCBmb3IgYm90aCBkaXJlY3RpdmVzIGFuZCBwcm92aWRlcnMuXG4gICAgICAvLyBGb3IgcGVyZiByZWFzb25zLCB3ZSB3YW50IHRvIGF2b2lkIHNlYXJjaGluZyBmb3IgaG9va3Mgb24gcHJvdmlkZXJzLlxuICAgICAgLy8gSXQgZG9lcyBubyBoYXJtIHRvIHRyeSAodGhlIGhvb2tzIGp1c3Qgd29uJ3QgZXhpc3QpLCBidXQgdGhlIGV4dHJhXG4gICAgICAvLyBjaGVja3MgYXJlIHVubmVjZXNzYXJ5IGFuZCB0aGlzIGlzIGEgaG90IHBhdGguIFNvIHdlIGNoZWNrIHRvIHNlZVxuICAgICAgLy8gaWYgdGhlIGluZGV4IG9mIHRoZSBkZXBlbmRlbmN5IGlzIGluIHRoZSBkaXJlY3RpdmUgcmFuZ2UgZm9yIHRoaXNcbiAgICAgIC8vIHROb2RlLiBJZiBpdCdzIG5vdCwgd2Uga25vdyBpdCdzIGEgcHJvdmlkZXIgYW5kIHNraXAgaG9vayByZWdpc3RyYXRpb24uXG4gICAgICBpZiAodFZpZXcuZmlyc3RDcmVhdGVQYXNzICYmIGluZGV4ID49IHROb2RlLmRpcmVjdGl2ZVN0YXJ0KSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREaXJlY3RpdmVEZWYodERhdGFbaW5kZXhdKTtcbiAgICAgICAgcmVnaXN0ZXJQcmVPcmRlckhvb2tzKGluZGV4LCB0RGF0YVtpbmRleF0gYXMgRGlyZWN0aXZlRGVmPGFueT4sIHRWaWV3KTtcbiAgICAgIH1cbiAgICB9IGZpbmFsbHkge1xuICAgICAgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiAhPT0gbnVsbCAmJlxuICAgICAgICAgIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgICAgc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMocHJldmlvdXNJbmNsdWRlVmlld1Byb3ZpZGVycyk7XG4gICAgICBmYWN0b3J5LnJlc29sdmluZyA9IGZhbHNlO1xuICAgICAgbGVhdmVESSgpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqICAgV2hlbiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgbmVnYXRpdmUgdGhlbiBpdCByZXByZXNlbnRzIHNwZWNpYWwgdmFsdWVzIHN1Y2ggYXMgYEluamVjdG9yYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fEFic3RyYWN0VHlwZTxhbnk+fEluamVjdGlvblRva2VuPGFueT58XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0cmluZyk6IG51bWJlcnxGdW5jdGlvbnx1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0b2tlbiwgJ3Rva2VuIG11c3QgYmUgZGVmaW5lZCcpO1xuICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0b2tlbi5jaGFyQ29kZUF0KDApIHx8IDA7XG4gIH1cbiAgY29uc3QgdG9rZW5JZDogbnVtYmVyfHVuZGVmaW5lZCA9XG4gICAgICAvLyBGaXJzdCBjaGVjayB3aXRoIGBoYXNPd25Qcm9wZXJ0eWAgc28gd2UgZG9uJ3QgZ2V0IGFuIGluaGVyaXRlZCBJRC5cbiAgICAgIHRva2VuLmhhc093blByb3BlcnR5KE5HX0VMRU1FTlRfSUQpID8gKHRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gOiB1bmRlZmluZWQ7XG4gIC8vIE5lZ2F0aXZlIHRva2VuIElEcyBhcmUgdXNlZCBmb3Igc3BlY2lhbCBvYmplY3RzIHN1Y2ggYXMgYEluamVjdG9yYFxuICBpZiAodHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInKSB7XG4gICAgaWYgKHRva2VuSWQgPj0gMCkge1xuICAgICAgcmV0dXJuIHRva2VuSWQgJiBCTE9PTV9NQVNLO1xuICAgIH0gZWxzZSB7XG4gICAgICBuZ0Rldk1vZGUgJiZcbiAgICAgICAgICBhc3NlcnRFcXVhbCh0b2tlbklkLCBJbmplY3Rvck1hcmtlcnMuSW5qZWN0b3IsICdFeHBlY3RpbmcgdG8gZ2V0IFNwZWNpYWwgSW5qZWN0b3IgSWQnKTtcbiAgICAgIHJldHVybiBjcmVhdGVOb2RlSW5qZWN0b3I7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHJldHVybiB0b2tlbklkO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUhhc1Rva2VuKGJsb29tSGFzaDogbnVtYmVyLCBpbmplY3RvckluZGV4OiBudW1iZXIsIGluamVjdG9yVmlldzogTFZpZXd8VERhdGEpIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUhhc2g7XG4gIGNvbnN0IGI3ID0gYmxvb21IYXNoICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUhhc2ggJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tSGFzaCAmIDB4MjA7XG5cbiAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICBpZiAoYjcpIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA3XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA1XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNF0pO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDNdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAyXSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDFdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXhdKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgcmV0dXJuICEhKHZhbHVlICYgbWFzayk7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgZmxhZ3MgcHJldmVudCBwYXJlbnQgaW5qZWN0b3IgZnJvbSBiZWluZyBzZWFyY2hlZCBmb3IgdG9rZW5zICovXG5mdW5jdGlvbiBzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3M6IEluamVjdEZsYWdzLCBpc0ZpcnN0SG9zdFROb2RlOiBib29sZWFuKTogYm9vbGVhbnxudW1iZXIge1xuICByZXR1cm4gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmIGlzRmlyc3RIb3N0VE5vZGUpO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlfG51bGwsXG4gICAgICBwcml2YXRlIF9sVmlldzogTFZpZXcpIHt9XG5cbiAgZ2V0KHRva2VuOiBhbnksIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBhbnkge1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUodGhpcy5fdE5vZGUsIHRoaXMuX2xWaWV3LCB0b2tlbiwgdW5kZWZpbmVkLCBub3RGb3VuZFZhbHVlKTtcbiAgfVxufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Z2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6IEZhY3RvcnlGbjxUPnxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuXG4gIGlmIChpc0ZvcndhcmRSZWYodHlwZSkpIHtcbiAgICByZXR1cm4gKCgpID0+IHtcbiAgICAgICAgICAgICBjb25zdCBmYWN0b3J5ID0gybXJtWdldEZhY3RvcnlPZjxUPihyZXNvbHZlRm9yd2FyZFJlZih0eXBlQW55KSk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhY3RvcnkgPyBmYWN0b3J5KCkgOiBudWxsO1xuICAgICAgICAgICB9KSBhcyBhbnk7XG4gIH1cblxuICBsZXQgZmFjdG9yeSA9IGdldEZhY3RvcnlEZWY8VD4odHlwZUFueSk7XG4gIGlmIChmYWN0b3J5ID09PSBudWxsKSB7XG4gICAgY29uc3QgaW5qZWN0b3JEZWYgPSBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgICBmYWN0b3J5ID0gaW5qZWN0b3JEZWYgJiYgaW5qZWN0b3JEZWYuZmFjdG9yeTtcbiAgfVxuICByZXR1cm4gZmFjdG9yeSB8fCBudWxsO1xufVxuXG4vKipcbiAqIEBjb2RlR2VuQXBpXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiDJtcm1Z2V0SW5oZXJpdGVkRmFjdG9yeTxUPih0eXBlOiBUeXBlPGFueT4pOiAodHlwZTogVHlwZTxUPikgPT4gVCB7XG4gIHJldHVybiBub1NpZGVFZmZlY3RzKCgpID0+IHtcbiAgICBjb25zdCBvd25Db25zdHJ1Y3RvciA9IHR5cGUucHJvdG90eXBlLmNvbnN0cnVjdG9yO1xuICAgIGNvbnN0IG93bkZhY3RvcnkgPSBvd25Db25zdHJ1Y3RvcltOR19GQUNUT1JZX0RFRl0gfHwgybXJtWdldEZhY3RvcnlPZihvd25Db25zdHJ1Y3Rvcik7XG4gICAgY29uc3Qgb2JqZWN0UHJvdG90eXBlID0gT2JqZWN0LnByb3RvdHlwZTtcbiAgICBsZXQgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvcjtcblxuICAgIC8vIEdvIHVwIHRoZSBwcm90b3R5cGUgdW50aWwgd2UgaGl0IGBPYmplY3RgLlxuICAgIHdoaWxlIChwYXJlbnQgJiYgcGFyZW50ICE9PSBvYmplY3RQcm90b3R5cGUpIHtcbiAgICAgIGNvbnN0IGZhY3RvcnkgPSBwYXJlbnRbTkdfRkFDVE9SWV9ERUZdIHx8IMm1ybVnZXRGYWN0b3J5T2YocGFyZW50KTtcblxuICAgICAgLy8gSWYgd2UgaGl0IHNvbWV0aGluZyB0aGF0IGhhcyBhIGZhY3RvcnkgYW5kIHRoZSBmYWN0b3J5IGlzbid0IHRoZSBzYW1lIGFzIHRoZSB0eXBlLFxuICAgICAgLy8gd2UndmUgZm91bmQgdGhlIGluaGVyaXRlZCBmYWN0b3J5LiBOb3RlIHRoZSBjaGVjayB0aGF0IHRoZSBmYWN0b3J5IGlzbid0IHRoZSB0eXBlJ3NcbiAgICAgIC8vIG93biBmYWN0b3J5IGlzIHJlZHVuZGFudCBpbiBtb3N0IGNhc2VzLCBidXQgaWYgdGhlIHVzZXIgaGFzIGN1c3RvbSBkZWNvcmF0b3JzIG9uIHRoZVxuICAgICAgLy8gY2xhc3MsIHRoaXMgbG9va3VwIHdpbGwgc3RhcnQgb25lIGxldmVsIGRvd24gaW4gdGhlIHByb3RvdHlwZSBjaGFpbiwgY2F1c2luZyB1cyB0b1xuICAgICAgLy8gZmluZCB0aGUgb3duIGZhY3RvcnkgZmlyc3QgYW5kIHBvdGVudGlhbGx5IHRyaWdnZXJpbmcgYW4gaW5maW5pdGUgbG9vcCBkb3duc3RyZWFtLlxuICAgICAgaWYgKGZhY3RvcnkgJiYgZmFjdG9yeSAhPT0gb3duRmFjdG9yeSkge1xuICAgICAgICByZXR1cm4gZmFjdG9yeTtcbiAgICAgIH1cblxuICAgICAgcGFyZW50ID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHBhcmVudCk7XG4gICAgfVxuXG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiB0ID0+IG5ldyB0KCk7XG4gIH0pO1xufVxuIl19