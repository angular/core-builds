/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingOverride,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { InjectFlags } from '../di';
import { injectRootLimpMode, setInjectImplementation } from '../di/injector_compatibility';
import { getInjectableDef, getInjectorDef } from '../di/interface/defs';
import { assertDefined, assertEqual } from '../util/assert';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { NG_ELEMENT_ID } from './fields';
import { NO_PARENT_INJECTOR, PARENT_INJECTOR, TNODE, isFactory } from './interfaces/injector';
import { DECLARATION_VIEW, INJECTOR, TVIEW, T_HOST } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
import { getLView, getPreviousOrParentTNode, setTNodeAndViewData } from './state';
import { isNameOnlyAttributeMarker } from './util/attrs_utils';
import { getParentInjectorIndex, getParentInjectorView, hasParentInjector } from './util/injector_utils';
import { renderStringify } from './util/misc_utils';
import { findComponentView } from './util/view_traversal_utils';
import { isComponent, isComponentDef } from './util/view_utils';
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
 * \@Injectable()
 * class MyService {
 *   constructor(public value: String) {}
 * }
 *
 * \@Component({
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
 * @type {?}
 */
let includeViewProviders = true;
/**
 * @param {?} v
 * @return {?}
 */
function setIncludeViewProviders(v) {
    /** @type {?} */
    const oldValue = includeViewProviders;
    includeViewProviders = v;
    return oldValue;
}
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 * @type {?}
 */
const BLOOM_SIZE = 256;
/** @type {?} */
const BLOOM_MASK = BLOOM_SIZE - 1;
/**
 * Counter used to generate unique IDs for directives.
 * @type {?}
 */
let nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param {?} injectorIndex The index of the node injector where this token should be registered
 * @param {?} tView The TView for the injector's bloom filters
 * @param {?} type The directive token to register
 * @return {?}
 */
export function bloomAdd(injectorIndex, tView, type) {
    ngDevMode && assertEqual(tView.firstTemplatePass, true, 'expected firstTemplatePass to be true');
    /** @type {?} */
    let id = typeof type !== 'string' ? ((/** @type {?} */ (type)))[NG_ELEMENT_ID] : type.charCodeAt(0) || 0;
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = ((/** @type {?} */ (type)))[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    /** @type {?} */
    const bloomBit = id & BLOOM_MASK;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    /** @type {?} */
    const mask = 1 << bloomBit;
    // Use the raw bloomBit number to determine which bloom filter bucket we should check
    // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
    /** @type {?} */
    const b7 = bloomBit & 0x80;
    /** @type {?} */
    const b6 = bloomBit & 0x40;
    /** @type {?} */
    const b5 = bloomBit & 0x20;
    /** @type {?} */
    const tData = (/** @type {?} */ (tView.data));
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
 * @param {?} tNode for which an injector should be retrieved / created.
 * @param {?} hostView View where the node is stored
 * @return {?} Node injector
 */
export function getOrCreateNodeInjectorForNode(tNode, hostView) {
    /** @type {?} */
    const existingInjectorIndex = getInjectorIndex(tNode, hostView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    /** @type {?} */
    const tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        tNode.injectorIndex = hostView.length;
        insertBloom(tView.data, tNode); // foundation for node bloom
        insertBloom(hostView, null); // foundation for cumulative bloom
        insertBloom(tView.blueprint, null);
        ngDevMode && assertEqual(tNode.flags === 0 || tNode.flags === 1 /* isComponent */, true, 'expected tNode.flags to not be initialized');
    }
    /** @type {?} */
    const parentLoc = getParentInjectorLocation(tNode, hostView);
    /** @type {?} */
    const parentIndex = getParentInjectorIndex(parentLoc);
    /** @type {?} */
    const parentLView = getParentInjectorView(parentLoc, hostView);
    /** @type {?} */
    const injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (hasParentInjector(parentLoc)) {
        /** @type {?} */
        const parentData = (/** @type {?} */ (parentLView[TVIEW].data));
        // Creates a cumulative bloom filter that merges the parent's bloom filter
        // and its own cumulative bloom (which contains tokens for all ancestors)
        for (let i = 0; i < 8; i++) {
            hostView[injectorIndex + i] = parentLView[parentIndex + i] | parentData[parentIndex + i];
        }
    }
    hostView[injectorIndex + PARENT_INJECTOR] = parentLoc;
    return injectorIndex;
}
/**
 * @param {?} arr
 * @param {?} footer
 * @return {?}
 */
function insertBloom(arr, footer) {
    arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}
/**
 * @param {?} tNode
 * @param {?} hostView
 * @return {?}
 */
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
 * @param {?} tNode
 * @param {?} view
 * @return {?}
 */
export function getParentInjectorLocation(tNode, view) {
    if (tNode.parent && tNode.parent.injectorIndex !== -1) {
        return (/** @type {?} */ (tNode.parent.injectorIndex)); // ViewOffset is 0
    }
    // For most cases, the parent injector index can be found on the host node (e.g. for component
    // or container), so this loop will be skipped, but we must keep the loop here to support
    // the rarer case of deeply nested <ng-template> tags or inline views.
    /** @type {?} */
    let hostTNode = view[T_HOST];
    /** @type {?} */
    let viewOffset = 1;
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = (/** @type {?} */ (view[DECLARATION_VIEW]));
        hostTNode = view ? view[T_HOST] : null;
        viewOffset++;
    }
    return hostTNode ?
        hostTNode.injectorIndex | (viewOffset << 16 /* ViewOffsetShift */) :
        (/** @type {?} */ (-1));
}
/**
 * Makes a type or an injection token public to the DI system by adding it to an
 * injector's bloom filter.
 *
 * @param {?} injectorIndex
 * @param {?} view
 * @param {?} token The type or the injection token to be made public
 * @return {?}
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
 * \@Component(...)
 * class MyComponent {
 *   constructor(\@Attribute('title') title: string) { ... }
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
 * \@publicApi
 * @param {?} tNode
 * @param {?} attrNameToInject
 * @return {?}
 */
export function injectAttributeImpl(tNode, attrNameToInject) {
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    /** @type {?} */
    const attrs = tNode.attrs;
    if (attrs) {
        /** @type {?} */
        const attrsLength = attrs.length;
        /** @type {?} */
        let i = 0;
        while (i < attrsLength) {
            /** @type {?} */
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
                if (value === 1 /* Classes */ && attrNameToInject === 'class') {
                    /** @type {?} */
                    let accumulatedClasses = '';
                    while (i < attrsLength && typeof attrs[i] === 'string') {
                        accumulatedClasses += ' ' + attrs[i++];
                    }
                    return accumulatedClasses.trim();
                }
                else if (value === 2 /* Styles */ && attrNameToInject === 'style') {
                    /** @type {?} */
                    let accumulatedStyles = '';
                    while (i < attrsLength && typeof attrs[i] === 'string') {
                        accumulatedStyles += `${attrs[i++]}: ${attrs[i++]}; `;
                    }
                    return accumulatedStyles.trim();
                }
                else {
                    while (i < attrsLength && typeof attrs[i] === 'string') {
                        i++;
                    }
                }
            }
            else if (value === attrNameToInject) {
                return (/** @type {?} */ (attrs[i + 1]));
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
 * @template T
 * @param {?} tNode The Node where the search for the injector should start
 * @param {?} lView The `LView` that contains the `tNode`
 * @param {?} token The token to look for
 * @param {?=} flags Injection flags
 * @param {?=} notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @return {?} the value from the injector, `null` when not found, or `notFoundValue` if provided
 */
export function getOrCreateInjectable(tNode, lView, token, flags = InjectFlags.Default, notFoundValue) {
    if (tNode) {
        /** @type {?} */
        const bloomHash = bloomHashBitOrFactory(token);
        // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
        // so just call the factory function to create it.
        if (typeof bloomHash === 'function') {
            /** @type {?} */
            const savePreviousOrParentTNode = getPreviousOrParentTNode();
            /** @type {?} */
            const saveLView = getLView();
            setTNodeAndViewData(tNode, lView);
            try {
                /** @type {?} */
                const value = bloomHash();
                if (value == null && !(flags & InjectFlags.Optional)) {
                    throw new Error(`No provider for ${renderStringify(token)}!`);
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
            if (bloomHash === -1) {
                // `-1` is a special value used to identify `Injector` types.
                return (/** @type {?} */ (new NodeInjector(tNode, lView)));
            }
            // If the token has a bloom hash, then it is a token which could be in NodeInjector.
            // A reference to the previous injector TView that was found while climbing the element
            // injector tree. This is used to know if viewProviders can be accessed on the current
            // injector.
            /** @type {?} */
            let previousTView = null;
            /** @type {?} */
            let injectorIndex = getInjectorIndex(tNode, lView);
            /** @type {?} */
            let parentLocation = NO_PARENT_INJECTOR;
            /** @type {?} */
            let hostTElementNode = flags & InjectFlags.Host ? findComponentView(lView)[T_HOST] : null;
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
                /** @type {?} */
                const tView = lView[TVIEW];
                if (bloomHasToken(bloomHash, injectorIndex, tView.data)) {
                    // At this point, we have an injector which *may* contain the token, so we step through
                    // the providers and directives associated with the injector's corresponding node to get
                    // the instance.
                    /** @type {?} */
                    const instance = searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode);
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
        /** @type {?} */
        const moduleInjector = lView[INJECTOR];
        // switch to `injectInjectorOnly` implementation for module injector, since module injector
        // should not have access to Component/Directive DI scope (that may happen through
        // `directiveInject` implementation)
        /** @type {?} */
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
        throw new Error(`NodeInjector: NOT_FOUND [${renderStringify(token)}]`);
    }
}
/** @type {?} */
const NOT_FOUND = {};
/**
 * @template T
 * @param {?} injectorIndex
 * @param {?} lView
 * @param {?} token
 * @param {?} previousTView
 * @param {?} flags
 * @param {?} hostTElementNode
 * @return {?}
 */
function searchTokensOnInjector(injectorIndex, lView, token, previousTView, flags, hostTElementNode) {
    /** @type {?} */
    const currentTView = lView[TVIEW];
    /** @type {?} */
    const tNode = (/** @type {?} */ (currentTView.data[injectorIndex + TNODE]));
    // First, we need to determine if view providers can be accessed by the starting element.
    // There are two possibities
    /** @type {?} */
    const canAccessViewProviders = previousTView == null ?
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
    // This special case happens when there is a @host on the inject and when we are searching
    // on the host element node.
    /** @type {?} */
    const isHostSpecialCase = (flags & InjectFlags.Host) && hostTElementNode === tNode;
    /** @type {?} */
    const injectableIdx = locateDirectiveOrProvider(tNode, lView, token, canAccessViewProviders, isHostSpecialCase);
    if (injectableIdx !== null) {
        return getNodeInjectable(currentTView.data, lView, injectableIdx, (/** @type {?} */ (tNode)));
    }
    else {
        return NOT_FOUND;
    }
}
/**
 * Searches for the given token among the node's directives and providers.
 *
 * @template T
 * @param {?} tNode TNode on which directives are present.
 * @param {?} lView The view we are currently processing
 * @param {?} token Provider token or type of a directive to look for.
 * @param {?} canAccessViewProviders Whether view providers should be considered.
 * @param {?} isHostSpecialCase Whether the host special case applies.
 * @return {?} Index of a found directive or provider, or null when none found.
 */
export function locateDirectiveOrProvider(tNode, lView, token, canAccessViewProviders, isHostSpecialCase) {
    /** @type {?} */
    const tView = lView[TVIEW];
    /** @type {?} */
    const nodeProviderIndexes = tNode.providerIndexes;
    /** @type {?} */
    const tInjectables = tView.data;
    /** @type {?} */
    const injectablesStart = nodeProviderIndexes & 65535 /* ProvidersStartIndexMask */;
    /** @type {?} */
    const directivesStart = tNode.directiveStart;
    /** @type {?} */
    const directiveEnd = tNode.directiveEnd;
    /** @type {?} */
    const cptViewProvidersCount = nodeProviderIndexes >> 16 /* CptViewProvidersCountShift */;
    /** @type {?} */
    const startingIndex = canAccessViewProviders ? injectablesStart : injectablesStart + cptViewProvidersCount;
    // When the host special case applies, only the viewProviders and the component are visible
    /** @type {?} */
    const endIndex = isHostSpecialCase ? injectablesStart + cptViewProvidersCount : directiveEnd;
    for (let i = startingIndex; i < endIndex; i++) {
        /** @type {?} */
        const providerTokenOrDef = (/** @type {?} */ (tInjectables[i]));
        if (i < directivesStart && token === providerTokenOrDef ||
            i >= directivesStart && ((/** @type {?} */ (providerTokenOrDef))).type === token) {
            return i;
        }
    }
    if (isHostSpecialCase) {
        /** @type {?} */
        const dirDef = (/** @type {?} */ (tInjectables[directivesStart]));
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
 * @param {?} tData
 * @param {?} lData
 * @param {?} index
 * @param {?} tNode
 * @return {?}
 */
export function getNodeInjectable(tData, lData, index, tNode) {
    /** @type {?} */
    let value = lData[index];
    if (isFactory(value)) {
        /** @type {?} */
        const factory = value;
        if (factory.resolving) {
            throw new Error(`Circular dep for ${renderStringify(tData[index])}`);
        }
        /** @type {?} */
        const previousIncludeViewProviders = setIncludeViewProviders(factory.canSeeViewProviders);
        factory.resolving = true;
        /** @type {?} */
        let previousInjectImplementation;
        if (factory.injectImpl) {
            previousInjectImplementation = setInjectImplementation(factory.injectImpl);
        }
        /** @type {?} */
        const savePreviousOrParentTNode = getPreviousOrParentTNode();
        /** @type {?} */
        const saveLView = getLView();
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
 * @param {?} token the injection token
 * @return {?} the matching bit to check in the bloom filter or `null` if the token is not known.
 *   When the returned value is negative then it represents special values such as `Injector`.
 */
export function bloomHashBitOrFactory(token) {
    ngDevMode && assertDefined(token, 'token must be defined');
    if (typeof token === 'string') {
        return token.charCodeAt(0) || 0;
    }
    /** @type {?} */
    const tokenId = ((/** @type {?} */ (token)))[NG_ELEMENT_ID];
    // Negative token IDs are used for special objects such as `Injector`
    return (typeof tokenId === 'number' && tokenId > 0) ? tokenId & BLOOM_MASK : tokenId;
}
/**
 * @param {?} bloomHash
 * @param {?} injectorIndex
 * @param {?} injectorView
 * @return {?}
 */
export function bloomHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    /** @type {?} */
    const mask = 1 << bloomHash;
    /** @type {?} */
    const b7 = bloomHash & 0x80;
    /** @type {?} */
    const b6 = bloomHash & 0x40;
    /** @type {?} */
    const b5 = bloomHash & 0x20;
    // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
    // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
    // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
    /** @type {?} */
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
/**
 * Returns true if flags prevent parent injector from being searched for tokens
 * @param {?} flags
 * @param {?} isFirstHostTNode
 * @return {?}
 */
function shouldSearchParent(flags, isFirstHostTNode) {
    return !(flags & InjectFlags.Self) && !(flags & InjectFlags.Host && isFirstHostTNode);
}
export class NodeInjector {
    /**
     * @param {?} _tNode
     * @param {?} _lView
     */
    constructor(_tNode, _lView) {
        this._tNode = _tNode;
        this._lView = _lView;
    }
    /**
     * @param {?} token
     * @param {?=} notFoundValue
     * @return {?}
     */
    get(token, notFoundValue) {
        return getOrCreateInjectable(this._tNode, this._lView, token, undefined, notFoundValue);
    }
}
if (false) {
    /**
     * @type {?}
     * @private
     */
    NodeInjector.prototype._tNode;
    /**
     * @type {?}
     * @private
     */
    NodeInjector.prototype._lView;
}
/**
 * \@codeGenApi
 * @template T
 * @param {?} type
 * @return {?}
 */
export function ΔgetFactoryOf(type) {
    /** @type {?} */
    const typeAny = (/** @type {?} */ (type));
    /** @type {?} */
    const def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
        getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
/**
 * \@codeGenApi
 * @template T
 * @param {?} type
 * @return {?}
 */
export function ΔgetInheritedFactory(type) {
    /** @type {?} */
    const proto = (/** @type {?} */ (Object.getPrototypeOf(type.prototype).constructor));
    /** @type {?} */
    const factory = ΔgetFactoryOf(proto);
    if (factory !== null) {
        return factory;
    }
    else {
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return (/**
         * @param {?} t
         * @return {?}
         */
        (t) => new t());
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLFdBQVcsRUFBaUIsTUFBTSxPQUFPLENBQUM7QUFFbEQsT0FBTyxFQUFDLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFDekYsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLHNCQUFzQixDQUFDO0FBRXRFLE9BQU8sRUFBQyxhQUFhLEVBQUUsV0FBVyxFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFFMUQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUF1QixlQUFlLEVBQTJELEtBQUssRUFBRSxTQUFTLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxSyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsUUFBUSxFQUFnQixLQUFLLEVBQVMsTUFBTSxFQUFDLE1BQU0sbUJBQW1CLENBQUM7QUFDakcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDaEYsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sb0JBQW9CLENBQUM7QUFDN0QsT0FBTyxFQUFDLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDdkcsT0FBTyxFQUFDLGVBQWUsRUFBQyxNQUFNLG1CQUFtQixDQUFDO0FBQ2xELE9BQU8sRUFBQyxpQkFBaUIsRUFBQyxN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QUFTLENBQUMsQ0FBQyxXQUFXLEVBQWE7O1VBQ3RFLE9BQU8sR0FBRyxhQUFhLENBQUksS0FBSyxDQUFDO0lBQ3ZDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixPQUFPLE9BQU8sQ0FBQztLQUNoQjtTQUFNO1FBQ0wsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNEJBQTRCO1FBQzVCOzs7O1FBQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUM7S0FDdkI7QUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtpbmplY3RSb290TGltcE1vZGUsIHNldEluamVjdEltcGxlbWVudGF0aW9ufSBmcm9tICcuLi9kaS9pbmplY3Rvcl9jb21wYXRpYmlsaXR5JztcbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2ludGVyZmFjZS9kZWZzJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vaW50ZXJmYWNlL3R5cGUnO1xuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRFcXVhbH0gZnJvbSAnLi4vdXRpbC9hc3NlcnQnO1xuXG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOT19QQVJFTlRfSU5KRUNUT1IsIE5vZGVJbmplY3RvckZhY3RvcnksIFBBUkVOVF9JTkpFQ1RPUiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncywgVE5PREUsIGlzRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX1ZJRVcsIElOSkVDVE9SLCBMVmlldywgVERhdGEsIFRWSUVXLCBUVmlldywgVF9IT1NUfSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRUTm9kZUFuZFZpZXdEYXRhfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7aXNOYW1lT25seUF0dHJpYnV0ZU1hcmtlcn0gZnJvbSAnLi91dGlsL2F0dHJzX3V0aWxzJztcbmltcG9ydCB7Z2V0UGFyZW50SW5qZWN0b3JJbmRleCwgZ2V0UGFyZW50SW5qZWN0b3JWaWV3LCBoYXNQYXJlbnRJbmplY3Rvcn0gZnJvbSAnLi91dGlsL2luamVjdG9yX3V0aWxzJztcbmltcG9ydCB7cmVuZGVyU3RyaW5naWZ5fSBmcm9tICcuL3V0aWwvbWlzY191dGlscyc7XG5pbXBvcnQge2ZpbmRDb21wb25lbnRWaWV3fSBmcm9tICcuL3V0aWwvdmlld190cmF2ZXJzYWxfdXRpbHMnO1xuaW1wb3J0IHtpc0NvbXBvbmVudCwgaXNDb21wb25lbnREZWZ9IGZyb20gJy4vdXRpbC92aWV3X3V0aWxzJztcblxuXG5cbi8qKlxuICogRGVmaW5lcyBpZiB0aGUgY2FsbCB0byBgaW5qZWN0YCBzaG91bGQgaW5jbHVkZSBgdmlld1Byb3ZpZGVyc2AgaW4gaXRzIHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHdlIHRyeSB0byBpbnN0YW50aWF0ZSBhIGNvbXBvbmVudC4gVGhpcyB2YWx1ZSBpcyByZXNldCBpblxuICogYGdldE5vZGVJbmplY3RhYmxlYCB0byBhIHZhbHVlIHdoaWNoIG1hdGNoZXMgdGhlIGRlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoZSB0b2tlbiBhYm91dCB0byBiZVxuICogaW5zdGFudGlhdGVkLiBUaGlzIGlzIGRvbmUgc28gdGhhdCBpZiB3ZSBhcmUgaW5qZWN0aW5nIGEgdG9rZW4gd2hpY2ggd2FzIGRlY2xhcmVkIG91dHNpZGUgb2ZcbiAqIGB2aWV3UHJvdmlkZXJzYCB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcHVsbCBgdmlld1Byb3ZpZGVyc2AgaW4uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogU3RyaW5nKSB7fVxuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBNeVNlcnZpY2UsXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICdwcm92aWRlcnMnIH1cbiAqICAgXVxuICogICB2aWV3UHJvdmlkZXJzOiBbXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICd2aWV3UHJvdmlkZXJzJ31cbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IobXlTZXJ2aWNlOiBNeVNlcnZpY2UsIHZhbHVlOiBTdHJpbmcpIHtcbiAqICAgICAvLyBXZSBleHBlY3QgdGhhdCBDb21wb25lbnQgY2FuIHNlZSBpbnRvIGB2aWV3UHJvdmlkZXJzYC5cbiAqICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ3ZpZXdQcm92aWRlcnMnKTtcbiAqICAgICAvLyBgTXlTZXJ2aWNlYCB3YXMgbm90IGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCBoZW5jZSBpdCBjYW4ndCBzZWUgaXQuXG4gKiAgICAgZXhwZWN0KG15U2VydmljZS52YWx1ZSkudG9FcXVhbCgncHJvdmlkZXJzJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBgYGBcbiAqL1xubGV0IGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gdHJ1ZTtcblxuZnVuY3Rpb24gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnModjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZSA9IGluY2x1ZGVWaWV3UHJvdmlkZXJzO1xuICBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IHY7XG4gIHJldHVybiBvbGRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT58IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdleHBlY3RlZCBmaXJzdFRlbXBsYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9XG4gICAgICB0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycgPyAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdIDogdHlwZS5jaGFyQ29kZUF0KDApIHx8IDA7XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YSBhcyBudW1iZXJbXTtcblxuICBpZiAoYjcpIHtcbiAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgN10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDZdIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDVdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA0XSB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDNdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyAyXSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAxXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4XSB8PSBtYXNrKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIGhvc3RWaWV3IFZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXcpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBob3N0Vmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gaG9zdFZpZXcubGVuZ3RoO1xuICAgIGluc2VydEJsb29tKHRWaWV3LmRhdGEsIHROb2RlKTsgIC8vIGZvdW5kYXRpb24gZm9yIG5vZGUgYmxvb21cbiAgICBpbnNlcnRCbG9vbShob3N0VmlldywgbnVsbCk7ICAgICAvLyBmb3VuZGF0aW9uIGZvciBjdW11bGF0aXZlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuYmx1ZXByaW50LCBudWxsKTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLmZsYWdzID09PSAwIHx8IHROb2RlLmZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgJ2V4cGVjdGVkIHROb2RlLmZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgY29uc3QgcGFyZW50TFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jLCBob3N0Vmlldyk7XG5cbiAgY29uc3QgaW5qZWN0b3JJbmRleCA9IHROb2RlLmluamVjdG9ySW5kZXg7XG5cbiAgLy8gSWYgYSBwYXJlbnQgaW5qZWN0b3IgY2FuJ3QgYmUgZm91bmQsIGl0cyBsb2NhdGlvbiBpcyBzZXQgdG8gLTEuXG4gIC8vIEluIHRoYXQgY2FzZSwgd2UgZG9uJ3QgbmVlZCB0byBzZXQgdXAgYSBjdW11bGF0aXZlIGJsb29tXG4gIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2MpKSB7XG4gICAgY29uc3QgcGFyZW50RGF0YSA9IHBhcmVudExWaWV3W1RWSUVXXS5kYXRhIGFzIGFueTtcbiAgICAvLyBDcmVhdGVzIGEgY3VtdWxhdGl2ZSBibG9vbSBmaWx0ZXIgdGhhdCBtZXJnZXMgdGhlIHBhcmVudCdzIGJsb29tIGZpbHRlclxuICAgIC8vIGFuZCBpdHMgb3duIGN1bXVsYXRpdmUgYmxvb20gKHdoaWNoIGNvbnRhaW5zIHRva2VucyBmb3IgYWxsIGFuY2VzdG9ycylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIGldID0gcGFyZW50TFZpZXdbcGFyZW50SW5kZXggKyBpXSB8IHBhcmVudERhdGFbcGFyZW50SW5kZXggKyBpXTtcbiAgICB9XG4gIH1cblxuICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJsb29tKGFycjogYW55W10sIGZvb3RlcjogVE5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGFyci5wdXNoKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIGZvb3Rlcik7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9ySW5kZXgodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcpOiBudW1iZXIge1xuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIC8vIElmIHRoZSBpbmplY3RvciBpbmRleCBpcyB0aGUgc2FtZSBhcyBpdHMgcGFyZW50J3MgaW5qZWN0b3IgaW5kZXgsIHRoZW4gdGhlIGluZGV4IGhhcyBiZWVuXG4gICAgICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICAgICAgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkgfHxcbiAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5qZWN0b3IgaW5kZXggbWlnaHQgZXhpc3QgYnV0IHRoZSBwYXJlbnQgdmFsdWVzXG4gICAgICAvLyBtaWdodCBub3QgaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgeWV0IGZvciB0aGlzIGluc3RhbmNlXG4gICAgICBob3N0Vmlld1t0Tm9kZS5pbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKlxuICogUmV0dXJucyBhIGNvbWJpbmF0aW9uIG9mIG51bWJlciBvZiBgVmlld0RhdGFgIHdlIGhhdmUgdG8gZ28gdXAgYW5kIGluZGV4IGluIHRoYXQgYFZpZXdkYXRhYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KTogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggYXMgYW55OyAgLy8gVmlld09mZnNldCBpcyAwXG4gIH1cblxuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIHNvIHRoaXMgbG9vcCB3aWxsIGJlIHNraXBwZWQsIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0XG4gIC8vIHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWQgPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbVF9IT1NUXTtcbiAgbGV0IHZpZXdPZmZzZXQgPSAxO1xuICB3aGlsZSAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS5pbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgIHZpZXcgPSB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgaG9zdFROb2RlID0gdmlldyA/IHZpZXdbVF9IT1NUXSA6IG51bGw7XG4gICAgdmlld09mZnNldCsrO1xuICB9XG5cbiAgcmV0dXJuIGhvc3RUTm9kZSA/XG4gICAgICBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCB8ICh2aWV3T2Zmc2V0IDw8IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgOlxuICAgICAgLTEgYXMgYW55O1xufVxuXG4vKipcbiAqIE1ha2VzIGEgdHlwZSBvciBhbiBpbmplY3Rpb24gdG9rZW4gcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuXG4gKiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIHRva2VuIFRoZSB0eXBlIG9yIHRoZSBpbmplY3Rpb24gdG9rZW4gdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljSW5JbmplY3RvcihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIHZpZXc6IExWaWV3LCB0b2tlbjogSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHZpZXdbVFZJRVddLCB0b2tlbik7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZUltcGwodE5vZGU6IFROb2RlLCBhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBjb25zdCBhdHRyc0xlbmd0aCA9IGF0dHJzLmxlbmd0aDtcbiAgICBsZXQgaSA9IDA7XG4gICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCkge1xuICAgICAgY29uc3QgdmFsdWUgPSBhdHRyc1tpXTtcblxuICAgICAgLy8gSWYgd2UgaGl0IGEgYEJpbmRpbmdzYCBvciBgVGVtcGxhdGVgIG1hcmtlciB0aGVuIHdlIGFyZSBkb25lLlxuICAgICAgaWYgKGlzTmFtZU9ubHlBdHRyaWJ1dGVNYXJrZXIodmFsdWUpKSBicmVhaztcblxuICAgICAgLy8gU2tpcCBuYW1lc3BhY2VkIGF0dHJpYnV0ZXNcbiAgICAgIGlmICh2YWx1ZSA9PT0gQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSkge1xuICAgICAgICAvLyB3ZSBza2lwIHRoZSBuZXh0IHR3byB2YWx1ZXNcbiAgICAgICAgLy8gYXMgbmFtZXNwYWNlZCBhdHRyaWJ1dGVzIGxvb2tzIGxpa2VcbiAgICAgICAgLy8gWy4uLiwgQXR0cmlidXRlTWFya2VyLk5hbWVzcGFjZVVSSSwgJ2h0dHA6Ly9zb21ldXJpLmNvbS90ZXN0JywgJ3Rlc3Q6ZXhpc3QnLFxuICAgICAgICAvLyAnZXhpc3RWYWx1ZScsIC4uLl1cbiAgICAgICAgaSA9IGkgKyAyO1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInKSB7XG4gICAgICAgIC8vIFNraXAgdG8gdGhlIGZpcnN0IHZhbHVlIG9mIHRoZSBtYXJrZWQgYXR0cmlidXRlLlxuICAgICAgICBpKys7XG4gICAgICAgIGlmICh2YWx1ZSA9PT0gQXR0cmlidXRlTWFya2VyLkNsYXNzZXMgJiYgYXR0ck5hbWVUb0luamVjdCA9PT0gJ2NsYXNzJykge1xuICAgICAgICAgIGxldCBhY2N1bXVsYXRlZENsYXNzZXMgPSAnJztcbiAgICAgICAgICB3aGlsZSAoaSA8IGF0dHJzTGVuZ3RoICYmIHR5cGVvZiBhdHRyc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGFjY3VtdWxhdGVkQ2xhc3NlcyArPSAnICcgKyBhdHRyc1tpKytdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gYWNjdW11bGF0ZWRDbGFzc2VzLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PT0gQXR0cmlidXRlTWFya2VyLlN0eWxlcyAmJiBhdHRyTmFtZVRvSW5qZWN0ID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgbGV0IGFjY3VtdWxhdGVkU3R5bGVzID0gJyc7XG4gICAgICAgICAgd2hpbGUgKGkgPCBhdHRyc0xlbmd0aCAmJiB0eXBlb2YgYXR0cnNbaV0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBhY2N1bXVsYXRlZFN0eWxlcyArPSBgJHthdHRyc1tpKytdfTogJHthdHRyc1tpKytdfTsgYDtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGFjY3VtdWxhdGVkU3R5bGVzLnRyaW0oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB3aGlsZSAoaSA8IGF0dHJzTGVuZ3RoICYmIHR5cGVvZiBhdHRyc1tpXSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAodmFsdWUgPT09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpID0gaSArIDI7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgTm9kZUluamVjdG9ycyA9PiBNb2R1bGVJbmplY3Rvci5cbiAqXG4gKiBMb29rIGZvciB0aGUgaW5qZWN0b3IgcHJvdmlkaW5nIHRoZSB0b2tlbiBieSB3YWxraW5nIHVwIHRoZSBub2RlIGluamVjdG9yIHRyZWUgYW5kIHRoZW5cbiAqIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBUaGlzIGZ1bmN0aW9uIHBhdGNoZXMgYHRva2VuYCB3aXRoIGBfX05HX0VMRU1FTlRfSURfX2Agd2hpY2ggY29udGFpbnMgdGhlIGlkIGZvciB0aGUgYmxvb21cbiAqIGZpbHRlci4gTmVnYXRpdmUgdmFsdWVzIGFyZSByZXNlcnZlZCBmb3Igc3BlY2lhbCBvYmplY3RzLlxuICogICAtIGAtMWAgaXMgcmVzZXJ2ZWQgZm9yIGluamVjdGluZyBgSW5qZWN0b3JgIChpbXBsZW1lbnRlZCBieSBgTm9kZUluamVjdG9yYClcbiAqXG4gKiBAcGFyYW0gdE5vZGUgVGhlIE5vZGUgd2hlcmUgdGhlIHNlYXJjaCBmb3IgdGhlIGluamVjdG9yIHNob3VsZCBzdGFydFxuICogQHBhcmFtIGxWaWV3IFRoZSBgTFZpZXdgIHRoYXQgY29udGFpbnMgdGhlIGB0Tm9kZWBcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEBwYXJhbSBub3RGb3VuZFZhbHVlIFRoZSB2YWx1ZSB0byByZXR1cm4gd2hlbiB0aGUgaW5qZWN0aW9uIGZsYWdzIGlzIGBJbmplY3RGbGFncy5PcHRpb25hbGBcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciwgYG51bGxgIHdoZW4gbm90IGZvdW5kLCBvciBgbm90Rm91bmRWYWx1ZWAgaWYgcHJvdmlkZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBudWxsLCBsVmlldzogTFZpZXcsXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0LFxuICAgIG5vdEZvdW5kVmFsdWU/OiBhbnkpOiBUfG51bGwge1xuICBpZiAodE5vZGUpIHtcbiAgICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW4pO1xuICAgIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gICAgLy8gc28ganVzdCBjYWxsIHRoZSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBpdC5cbiAgICBpZiAodHlwZW9mIGJsb29tSGFzaCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgY29uc3Qgc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgICAgY29uc3Qgc2F2ZUxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICAgIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGUsIGxWaWV3KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICAgIGlmICh2YWx1ZSA9PSBudWxsICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIHByb3ZpZGVyIGZvciAke3JlbmRlclN0cmluZ2lmeSh0b2tlbil9IWApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgc2V0VE5vZGVBbmRWaWV3RGF0YShzYXZlUHJldmlvdXNPclBhcmVudFROb2RlLCBzYXZlTFZpZXcpO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAodHlwZW9mIGJsb29tSGFzaCA9PSAnbnVtYmVyJykge1xuICAgICAgaWYgKGJsb29tSGFzaCA9PT0gLTEpIHtcbiAgICAgICAgLy8gYC0xYCBpcyBhIHNwZWNpYWwgdmFsdWUgdXNlZCB0byBpZGVudGlmeSBgSW5qZWN0b3JgIHR5cGVzLlxuICAgICAgICByZXR1cm4gbmV3IE5vZGVJbmplY3Rvcih0Tm9kZSwgbFZpZXcpIGFzIGFueTtcbiAgICAgIH1cbiAgICAgIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgdG9rZW4gd2hpY2ggY291bGQgYmUgaW4gTm9kZUluamVjdG9yLlxuXG4gICAgICAvLyBBIHJlZmVyZW5jZSB0byB0aGUgcHJldmlvdXMgaW5qZWN0b3IgVFZpZXcgdGhhdCB3YXMgZm91bmQgd2hpbGUgY2xpbWJpbmcgdGhlIGVsZW1lbnRcbiAgICAgIC8vIGluamVjdG9yIHRyZWUuIFRoaXMgaXMgdXNlZCB0byBrbm93IGlmIHZpZXdQcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIG9uIHRoZSBjdXJyZW50XG4gICAgICAvLyBpbmplY3Rvci5cbiAgICAgIGxldCBwcmV2aW91c1RWaWV3OiBUVmlld3xudWxsID0gbnVsbDtcbiAgICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICAgICAgbGV0IHBhcmVudExvY2F0aW9uOiBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb24gPSBOT19QQVJFTlRfSU5KRUNUT1I7XG4gICAgICBsZXQgaG9zdFRFbGVtZW50Tm9kZTogVE5vZGV8bnVsbCA9XG4gICAgICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ID8gZmluZENvbXBvbmVudFZpZXcobFZpZXcpW1RfSE9TVF0gOiBudWxsO1xuXG4gICAgICAvLyBJZiB3ZSBzaG91bGQgc2tpcCB0aGlzIGluamVjdG9yLCBvciBpZiB0aGVyZSBpcyBubyBpbmplY3RvciBvbiB0aGlzIG5vZGUsIHN0YXJ0IGJ5XG4gICAgICAvLyBzZWFyY2hpbmdcbiAgICAgIC8vIHRoZSBwYXJlbnQgaW5qZWN0b3IuXG4gICAgICBpZiAoaW5qZWN0b3JJbmRleCA9PT0gLTEgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikge1xuICAgICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuXG4gICAgICAgIGlmICghc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzLCBmYWxzZSkpIHtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHJldmlvdXNUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgICAgbFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGxWaWV3KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmVcbiAgICAgIC8vICppc24ndCogYSBtYXRjaC5cbiAgICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgICBwYXJlbnRMb2NhdGlvbiA9IGxWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuXG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IGluamVjdG9yLiBJZiBpdCBtYXRjaGVzLCBzZWUgaWYgaXQgY29udGFpbnMgdG9rZW4uXG4gICAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICBpZiAoYmxvb21IYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIHRWaWV3LmRhdGEpKSB7XG4gICAgICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoXG4gICAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAgIC8vIHRoZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBpbnN0YW5jZTogVHxudWxsID0gc2VhcmNoVG9rZW5zT25JbmplY3RvcjxUPihcbiAgICAgICAgICAgICAgaW5qZWN0b3JJbmRleCwgbFZpZXcsIHRva2VuLCBwcmV2aW91c1RWaWV3LCBmbGFncywgaG9zdFRFbGVtZW50Tm9kZSk7XG4gICAgICAgICAgaWYgKGluc3RhbmNlICE9PSBOT1RfRk9VTkQpIHtcbiAgICAgICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNob3VsZFNlYXJjaFBhcmVudChcbiAgICAgICAgICAgICAgICBmbGFncywgbFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSA9PT0gaG9zdFRFbGVtZW50Tm9kZSkgJiZcbiAgICAgICAgICAgIGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCBsVmlldykpIHtcbiAgICAgICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICAgICAgcHJldmlvdXNUVmlldyA9IHRWaWV3O1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSBnZXRQYXJlbnRJbmplY3RvckluZGV4KHBhcmVudExvY2F0aW9uKTtcbiAgICAgICAgICBsVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIElmIHdlIHNob3VsZCBub3Qgc2VhcmNoIHBhcmVudCBPUiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGRvZXMgbm90IGhhdmUgdGhlXG4gICAgICAgICAgLy8gYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSB3ZSBjYW4gZ2l2ZSB1cCBvbiB0cmF2ZXJzaW5nIHVwIHRvIGZpbmQgdGhlIHNwZWNpZmljXG4gICAgICAgICAgLy8gaW5qZWN0b3IuXG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwgJiYgbm90Rm91bmRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCBvciB0aGUgTnVsbEluamVjdG9yIHdpbGwgdGhyb3cgZm9yIG9wdGlvbmFsIGRlcHNcbiAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgfVxuXG4gIGlmICgoZmxhZ3MgJiAoSW5qZWN0RmxhZ3MuU2VsZiB8IEluamVjdEZsYWdzLkhvc3QpKSA9PT0gMCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICAgIC8vIHN3aXRjaCB0byBgaW5qZWN0SW5qZWN0b3JPbmx5YCBpbXBsZW1lbnRhdGlvbiBmb3IgbW9kdWxlIGluamVjdG9yLCBzaW5jZSBtb2R1bGUgaW5qZWN0b3JcbiAgICAvLyBzaG91bGQgbm90IGhhdmUgYWNjZXNzIHRvIENvbXBvbmVudC9EaXJlY3RpdmUgREkgc2NvcGUgKHRoYXQgbWF5IGhhcHBlbiB0aHJvdWdoXG4gICAgLy8gYGRpcmVjdGl2ZUluamVjdGAgaW1wbGVtZW50YXRpb24pXG4gICAgY29uc3QgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKHVuZGVmaW5lZCk7XG4gICAgdHJ5IHtcbiAgICAgIGlmIChtb2R1bGVJbmplY3Rvcikge1xuICAgICAgICByZXR1cm4gbW9kdWxlSW5qZWN0b3IuZ2V0KHRva2VuLCBub3RGb3VuZFZhbHVlLCBmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbihwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uKTtcbiAgICB9XG4gIH1cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHtcbiAgICByZXR1cm4gbm90Rm91bmRWYWx1ZTtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYE5vZGVJbmplY3RvcjogTk9UX0ZPVU5EIFske3JlbmRlclN0cmluZ2lmeSh0b2tlbil9XWApO1xuICB9XG59XG5cbmNvbnN0IE5PVF9GT1VORCA9IHt9O1xuXG5mdW5jdGlvbiBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgcHJldmlvdXNUVmlldzogVFZpZXcgfCBudWxsLCBmbGFnczogSW5qZWN0RmxhZ3MsIGhvc3RURWxlbWVudE5vZGU6IFROb2RlIHwgbnVsbCkge1xuICBjb25zdCBjdXJyZW50VFZpZXcgPSBsVmlld1tUVklFV107XG4gIGNvbnN0IHROb2RlID0gY3VycmVudFRWaWV3LmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSBhcyBUTm9kZTtcbiAgLy8gRmlyc3QsIHdlIG5lZWQgdG8gZGV0ZXJtaW5lIGlmIHZpZXcgcHJvdmlkZXJzIGNhbiBiZSBhY2Nlc3NlZCBieSB0aGUgc3RhcnRpbmcgZWxlbWVudC5cbiAgLy8gVGhlcmUgYXJlIHR3byBwb3NzaWJpdGllc1xuICBjb25zdCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID0gcHJldmlvdXNUVmlldyA9PSBudWxsID9cbiAgICAgIC8vIDEpIFRoaXMgaXMgdGhlIGZpcnN0IGludm9jYXRpb24gYHByZXZpb3VzVFZpZXcgPT0gbnVsbGAgd2hpY2ggbWVhbnMgdGhhdCB3ZSBhcmUgYXQgdGhlXG4gICAgICAvLyBgVE5vZGVgIG9mIHdoZXJlIGluamVjdG9yIGlzIHN0YXJ0aW5nIHRvIGxvb2suIEluIHN1Y2ggYSBjYXNlIHRoZSBvbmx5IHRpbWUgd2UgYXJlIGFsbG93ZWRcbiAgICAgIC8vIHRvIGxvb2sgaW50byB0aGUgVmlld1Byb3ZpZGVycyBpcyBpZjpcbiAgICAgIC8vIC0gd2UgYXJlIG9uIGEgY29tcG9uZW50XG4gICAgICAvLyAtIEFORCB0aGUgaW5qZWN0b3Igc2V0IGBpbmNsdWRlVmlld1Byb3ZpZGVyc2AgdG8gdHJ1ZSAoaW1wbHlpbmcgdGhhdCB0aGUgdG9rZW4gY2FuIHNlZVxuICAgICAgLy8gVmlld1Byb3ZpZGVycyBiZWNhdXNlIGl0IGlzIHRoZSBDb21wb25lbnQgb3IgYSBTZXJ2aWNlIHdoaWNoIGl0c2VsZiB3YXMgZGVjbGFyZWQgaW5cbiAgICAgIC8vIFZpZXdQcm92aWRlcnMpXG4gICAgICAoaXNDb21wb25lbnQodE5vZGUpICYmIGluY2x1ZGVWaWV3UHJvdmlkZXJzKSA6XG4gICAgICAvLyAyKSBgcHJldmlvdXNUVmlldyAhPSBudWxsYCB3aGljaCBtZWFucyB0aGF0IHdlIGFyZSBub3cgd2Fsa2luZyBhY3Jvc3MgdGhlIHBhcmVudCBub2Rlcy5cbiAgICAgIC8vIEluIHN1Y2ggYSBjYXNlIHdlIGFyZSBvbmx5IGFsbG93ZWQgdG8gbG9vayBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzIGlmOlxuICAgICAgLy8gLSBXZSBqdXN0IGNyb3NzZWQgZnJvbSBjaGlsZCBWaWV3IHRvIFBhcmVudCBWaWV3IGBwcmV2aW91c1RWaWV3ICE9IGN1cnJlbnRUVmlld2BcbiAgICAgIC8vIC0gQU5EIHRoZSBwYXJlbnQgVE5vZGUgaXMgYW4gRWxlbWVudC5cbiAgICAgIC8vIFRoaXMgbWVhbnMgdGhhdCB3ZSBqdXN0IGNhbWUgZnJvbSB0aGUgQ29tcG9uZW50J3MgVmlldyBhbmQgdGhlcmVmb3JlIGFyZSBhbGxvd2VkIHRvIHNlZVxuICAgICAgLy8gaW50byB0aGUgVmlld1Byb3ZpZGVycy5cbiAgICAgIChwcmV2aW91c1RWaWV3ICE9IGN1cnJlbnRUVmlldyAmJiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpKTtcblxuICAvLyBUaGlzIHNwZWNpYWwgY2FzZSBoYXBwZW5zIHdoZW4gdGhlcmUgaXMgYSBAaG9zdCBvbiB0aGUgaW5qZWN0IGFuZCB3aGVuIHdlIGFyZSBzZWFyY2hpbmdcbiAgLy8gb24gdGhlIGhvc3QgZWxlbWVudCBub2RlLlxuICBjb25zdCBpc0hvc3RTcGVjaWFsQ2FzZSA9IChmbGFncyAmIEluamVjdEZsYWdzLkhvc3QpICYmIGhvc3RURWxlbWVudE5vZGUgPT09IHROb2RlO1xuXG4gIGNvbnN0IGluamVjdGFibGVJZHggPVxuICAgICAgbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcih0Tm9kZSwgbFZpZXcsIHRva2VuLCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzLCBpc0hvc3RTcGVjaWFsQ2FzZSk7XG4gIGlmIChpbmplY3RhYmxlSWR4ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGdldE5vZGVJbmplY3RhYmxlKGN1cnJlbnRUVmlldy5kYXRhLCBsVmlldywgaW5qZWN0YWJsZUlkeCwgdE5vZGUgYXMgVEVsZW1lbnROb2RlKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gTk9UX0ZPVU5EO1xuICB9XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIHRoZSBnaXZlbiB0b2tlbiBhbW9uZyB0aGUgbm9kZSdzIGRpcmVjdGl2ZXMgYW5kIHByb3ZpZGVycy5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgVE5vZGUgb24gd2hpY2ggZGlyZWN0aXZlcyBhcmUgcHJlc2VudC5cbiAqIEBwYXJhbSBsVmlldyBUaGUgdmlldyB3ZSBhcmUgY3VycmVudGx5IHByb2Nlc3NpbmdcbiAqIEBwYXJhbSB0b2tlbiBQcm92aWRlciB0b2tlbiBvciB0eXBlIG9mIGEgZGlyZWN0aXZlIHRvIGxvb2sgZm9yLlxuICogQHBhcmFtIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgV2hldGhlciB2aWV3IHByb3ZpZGVycyBzaG91bGQgYmUgY29uc2lkZXJlZC5cbiAqIEBwYXJhbSBpc0hvc3RTcGVjaWFsQ2FzZSBXaGV0aGVyIHRoZSBob3N0IHNwZWNpYWwgY2FzZSBhcHBsaWVzLlxuICogQHJldHVybnMgSW5kZXggb2YgYSBmb3VuZCBkaXJlY3RpdmUgb3IgcHJvdmlkZXIsIG9yIG51bGwgd2hlbiBub25lIGZvdW5kLlxuICovXG5leHBvcnQgZnVuY3Rpb24gbG9jYXRlRGlyZWN0aXZlT3JQcm92aWRlcjxUPihcbiAgICB0Tm9kZTogVE5vZGUsIGxWaWV3OiBMVmlldywgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzOiBib29sZWFuLFxuICAgIGlzSG9zdFNwZWNpYWxDYXNlOiBib29sZWFuIHwgbnVtYmVyKTogbnVtYmVyfG51bGwge1xuICBjb25zdCB0VmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3Qgbm9kZVByb3ZpZGVySW5kZXhlcyA9IHROb2RlLnByb3ZpZGVySW5kZXhlcztcbiAgY29uc3QgdEluamVjdGFibGVzID0gdFZpZXcuZGF0YTtcblxuICBjb25zdCBpbmplY3RhYmxlc1N0YXJ0ID0gbm9kZVByb3ZpZGVySW5kZXhlcyAmIFROb2RlUHJvdmlkZXJJbmRleGVzLlByb3ZpZGVyc1N0YXJ0SW5kZXhNYXNrO1xuICBjb25zdCBkaXJlY3RpdmVzU3RhcnQgPSB0Tm9kZS5kaXJlY3RpdmVTdGFydDtcbiAgY29uc3QgZGlyZWN0aXZlRW5kID0gdE5vZGUuZGlyZWN0aXZlRW5kO1xuICBjb25zdCBjcHRWaWV3UHJvdmlkZXJzQ291bnQgPVxuICAgICAgbm9kZVByb3ZpZGVySW5kZXhlcyA+PiBUTm9kZVByb3ZpZGVySW5kZXhlcy5DcHRWaWV3UHJvdmlkZXJzQ291bnRTaGlmdDtcbiAgY29uc3Qgc3RhcnRpbmdJbmRleCA9XG4gICAgICBjYW5BY2Nlc3NWaWV3UHJvdmlkZXJzID8gaW5qZWN0YWJsZXNTdGFydCA6IGluamVjdGFibGVzU3RhcnQgKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQ7XG4gIC8vIFdoZW4gdGhlIGhvc3Qgc3BlY2lhbCBjYXNlIGFwcGxpZXMsIG9ubHkgdGhlIHZpZXdQcm92aWRlcnMgYW5kIHRoZSBjb21wb25lbnQgYXJlIHZpc2libGVcbiAgY29uc3QgZW5kSW5kZXggPSBpc0hvc3RTcGVjaWFsQ2FzZSA/IGluamVjdGFibGVzU3RhcnQgKyBjcHRWaWV3UHJvdmlkZXJzQ291bnQgOiBkaXJlY3RpdmVFbmQ7XG4gIGZvciAobGV0IGkgPSBzdGFydGluZ0luZGV4OyBpIDwgZW5kSW5kZXg7IGkrKykge1xuICAgIGNvbnN0IHByb3ZpZGVyVG9rZW5PckRlZiA9IHRJbmplY3RhYmxlc1tpXSBhcyBJbmplY3Rpb25Ub2tlbjxhbnk+fCBUeXBlPGFueT58IERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChpIDwgZGlyZWN0aXZlc1N0YXJ0ICYmIHRva2VuID09PSBwcm92aWRlclRva2VuT3JEZWYgfHxcbiAgICAgICAgaSA+PSBkaXJlY3RpdmVzU3RhcnQgJiYgKHByb3ZpZGVyVG9rZW5PckRlZiBhcyBEaXJlY3RpdmVEZWY8YW55PikudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICBpZiAoaXNIb3N0U3BlY2lhbENhc2UpIHtcbiAgICBjb25zdCBkaXJEZWYgPSB0SW5qZWN0YWJsZXNbZGlyZWN0aXZlc1N0YXJ0XSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICBpZiAoZGlyRGVmICYmIGlzQ29tcG9uZW50RGVmKGRpckRlZikgJiYgZGlyRGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICByZXR1cm4gZGlyZWN0aXZlc1N0YXJ0O1xuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4qIFJldHJpZXZlIG9yIGluc3RhbnRpYXRlIHRoZSBpbmplY3RhYmxlIGZyb20gdGhlIGBsRGF0YWAgYXQgcGFydGljdWxhciBgaW5kZXhgLlxuKlxuKiBUaGlzIGZ1bmN0aW9uIGNoZWNrcyB0byBzZWUgaWYgdGhlIHZhbHVlIGhhcyBhbHJlYWR5IGJlZW4gaW5zdGFudGlhdGVkIGFuZCBpZiBzbyByZXR1cm5zIHRoZVxuKiBjYWNoZWQgYGluamVjdGFibGVgLiBPdGhlcndpc2UgaWYgaXQgZGV0ZWN0cyB0aGF0IHRoZSB2YWx1ZSBpcyBzdGlsbCBhIGZhY3RvcnkgaXRcbiogaW5zdGFudGlhdGVzIHRoZSBgaW5qZWN0YWJsZWAgYW5kIGNhY2hlcyB0aGUgdmFsdWUuXG4qL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE5vZGVJbmplY3RhYmxlKFxuICAgIHREYXRhOiBURGF0YSwgbERhdGE6IExWaWV3LCBpbmRleDogbnVtYmVyLCB0Tm9kZTogVEVsZW1lbnROb2RlKTogYW55IHtcbiAgbGV0IHZhbHVlID0gbERhdGFbaW5kZXhdO1xuICBpZiAoaXNGYWN0b3J5KHZhbHVlKSkge1xuICAgIGNvbnN0IGZhY3Rvcnk6IE5vZGVJbmplY3RvckZhY3RvcnkgPSB2YWx1ZTtcbiAgICBpZiAoZmFjdG9yeS5yZXNvbHZpbmcpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQ2lyY3VsYXIgZGVwIGZvciAke3JlbmRlclN0cmluZ2lmeSh0RGF0YVtpbmRleF0pfWApO1xuICAgIH1cbiAgICBjb25zdCBwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzID0gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMoZmFjdG9yeS5jYW5TZWVWaWV3UHJvdmlkZXJzKTtcbiAgICBmYWN0b3J5LnJlc29sdmluZyA9IHRydWU7XG4gICAgbGV0IHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb247XG4gICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkge1xuICAgICAgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbiA9IHNldEluamVjdEltcGxlbWVudGF0aW9uKGZhY3RvcnkuaW5qZWN0SW1wbCk7XG4gICAgfVxuICAgIGNvbnN0IHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgICBjb25zdCBzYXZlTFZpZXcgPSBnZXRMVmlldygpO1xuICAgIHNldFROb2RlQW5kVmlld0RhdGEodE5vZGUsIGxEYXRhKTtcbiAgICB0cnkge1xuICAgICAgdmFsdWUgPSBsRGF0YVtpbmRleF0gPSBmYWN0b3J5LmZhY3RvcnkobnVsbCwgdERhdGEsIGxEYXRhLCB0Tm9kZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChmYWN0b3J5LmluamVjdEltcGwpIHNldEluamVjdEltcGxlbWVudGF0aW9uKHByZXZpb3VzSW5qZWN0SW1wbGVtZW50YXRpb24pO1xuICAgICAgc2V0SW5jbHVkZVZpZXdQcm92aWRlcnMocHJldmlvdXNJbmNsdWRlVmlld1Byb3ZpZGVycyk7XG4gICAgICBmYWN0b3J5LnJlc29sdmluZyA9IGZhbHNlO1xuICAgICAgc2V0VE5vZGVBbmRWaWV3RGF0YShzYXZlUHJldmlvdXNPclBhcmVudFROb2RlLCBzYXZlTFZpZXcpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gdmFsdWU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqICAgV2hlbiB0aGUgcmV0dXJuZWQgdmFsdWUgaXMgbmVnYXRpdmUgdGhlbiBpdCByZXByZXNlbnRzIHNwZWNpYWwgdmFsdWVzIHN1Y2ggYXMgYEluamVjdG9yYC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+fCBzdHJpbmcpOiBudW1iZXJ8XG4gICAgRnVuY3Rpb258dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodG9rZW4sICd0b2tlbiBtdXN0IGJlIGRlZmluZWQnKTtcbiAgaWYgKHR5cGVvZiB0b2tlbiA9PT0gJ3N0cmluZycpIHtcbiAgICByZXR1cm4gdG9rZW4uY2hhckNvZGVBdCgwKSB8fCAwO1xuICB9XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgLy8gTmVnYXRpdmUgdG9rZW4gSURzIGFyZSB1c2VkIGZvciBzcGVjaWFsIG9iamVjdHMgc3VjaCBhcyBgSW5qZWN0b3JgXG4gIHJldHVybiAodHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInICYmIHRva2VuSWQgPiAwKSA/IHRva2VuSWQgJiBCTE9PTV9NQVNLIDogdG9rZW5JZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzVG9rZW4oXG4gICAgYmxvb21IYXNoOiBudW1iZXIsIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlldyB8IFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuICBjb25zdCBiNyA9IGJsb29tSGFzaCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21IYXNoICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUhhc2ggJiAweDIwO1xuXG4gIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgaWYgKGI3KSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgN10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDZdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDRdKTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAzXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAxXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4XSk7XG4gIH1cblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkU2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgaXNGaXJzdEhvc3RUTm9kZTogYm9vbGVhbik6IGJvb2xlYW58bnVtYmVyIHtcbiAgcmV0dXJuICEoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmKSAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiBpc0ZpcnN0SG9zdFROb2RlKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZXxudWxsLFxuICAgICAgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIHVuZGVmaW5lZCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuLyoqXG4gKiBAY29kZUdlbkFwaVxuICovXG5leHBvcnQgZnVuY3Rpb24gzpRnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlOiBUeXBlPFQ+fCBudWxsKSA9PiBUKXxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWY8VD4odHlwZUFueSkgfHwgZ2V0RGlyZWN0aXZlRGVmPFQ+KHR5cGVBbnkpIHx8XG4gICAgICBnZXRQaXBlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdGFibGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gIGlmICghZGVmIHx8IGRlZi5mYWN0b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGVmLmZhY3Rvcnk7XG59XG5cbi8qKlxuICogQGNvZGVHZW5BcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIM6UZ2V0SW5oZXJpdGVkRmFjdG9yeTxUPih0eXBlOiBUeXBlPGFueT4pOiAodHlwZTogVHlwZTxUPikgPT4gVCB7XG4gIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvciBhcyBUeXBlPGFueT47XG4gIGNvbnN0IGZhY3RvcnkgPSDOlGdldEZhY3RvcnlPZjxUPihwcm90byk7XG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiAodCkgPT4gbmV3IHQoKTtcbiAgfVxufVxuIl19