/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,missingReturn,unusedPrivateMembers,uselessCode} checked by tsc
 */
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
import { findComponentView, getParentInjectorIndex, getParentInjectorView, hasParentInjector, isComponent, isComponentDef, stringify } from './util';
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
    let hostTNode = view[HOST_NODE];
    /** @type {?} */
    let viewOffset = 1;
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = (/** @type {?} */ (view[DECLARATION_VIEW]));
        hostTNode = (/** @type {?} */ (view[HOST_NODE]));
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
        for (let i = 0; i < attrs.length; i = i + 2) {
            /** @type {?} */
            const attrName = attrs[i];
            if (attrName === 3 /* SelectOnly */)
                break;
            if (attrName == attrNameToInject) {
                return (/** @type {?} */ (attrs[i + 1]));
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
 * @template T
 * @param {?} tNode The Node where the search for the injector should start
 * @param {?} lView The `LView` that contains the `tNode`
 * @param {?} token The token to look for
 * @param {?=} flags Injection flags
 * @param {?=} notFoundValue The value to return when the injection flags is `InjectFlags.Optional`
 * @return {?} the value from the injector, `null` when not found, or `notFoundValue` if provided
 */
export function getOrCreateInjectable(tNode, lView, token, flags = InjectFlags.Default, notFoundValue) {
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
                throw new Error(`No provider for ${stringify(token)}!`);
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
        /** @type {?} */
        let previousTView = null;
        /** @type {?} */
        let injectorIndex = getInjectorIndex(tNode, lView);
        /** @type {?} */
        let parentLocation = NO_PARENT_INJECTOR;
        /** @type {?} */
        let hostTElementNode = flags & InjectFlags.Host ? findComponentView(lView)[HOST_NODE] : null;
        // If we should skip this injector, or if there is no injector on this node, start by searching
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
    if (flags & InjectFlags.Optional && notFoundValue === undefined) {
        // This must be set or the NullInjector will throw for optional deps
        notFoundValue = null;
    }
    if ((flags & (InjectFlags.Self | InjectFlags.Host)) === 0) {
        /** @type {?} */
        const moduleInjector = lView[INJECTOR];
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
        throw new Error(`NodeInjector: NOT_FOUND [${stringify(token)}]`);
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
            throw new Error(`Circular dep for ${stringify(tData[index])}`);
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
 */
export function bloomHashBitOrFactory(token) {
    ngDevMode && assertDefined(token, 'token must be defined');
    if (typeof token === 'string') {
        return token.charCodeAt(0) || 0;
    }
    /** @type {?} */
    const tokenId = ((/** @type {?} */ (token)))[NG_ELEMENT_ID];
    return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
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
/**
 * @return {?}
 */
export function injectInjector() {
    /** @type {?} */
    const tNode = (/** @type {?} */ (getPreviousOrParentTNode()));
    return new NodeInjector(tNode, getLView());
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
 * @template T
 * @param {?} type
 * @return {?}
 */
export function getFactoryOf(type) {
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
 * @template T
 * @param {?} type
 * @return {?}
 */
export function getInheritedFactory(type) {
    /** @type {?} */
    const proto = (/** @type {?} */ (Object.getPrototypeOf(type.prototype).constructor));
    /** @type {?} */
    const factory = getFactoryOf(proto);
    if (factory !== null) {
        return factory;
    }
    else {
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return (t) => new t();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiLi4vLi4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBUUEsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUc1RCxPQUFPLEVBQUMsV0FBVyxFQUFFLGtCQUFrQixFQUFFLHVCQUF1QixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFHdEcsT0FBTyxFQUFDLGFBQWEsRUFBRSxXQUFXLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDcEQsT0FBTyxFQUFDLGVBQWUsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFDLE1BQU0sY0FBYyxDQUFDO0FBQzFFLE9BQU8sRUFBQyxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFFdkMsT0FBTyxFQUFDLGtCQUFrQixFQUF1QixlQUFlLEVBQTJELEtBQUssRUFBRSxTQUFTLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUUxSyxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBZ0IsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDcEcsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hELE9BQU8sRUFBQyxRQUFRLEVBQUUsd0JBQXdCLEVBQUUsbUJBQW1CLEVBQUMsTUFBTSxTQUFTLENBQUM7QUFDaEYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLHNCQUFzQixFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXVDL0ksb0JBQW9CLEdBQUcsSUFBSTs7Ozs7QUFFL0IsU0FBUyx1QkFBdUIsQ0FBQyxDQUFVOztVQUNuQyxRQUFRLEdBQUcsb0JBQW9CO0lBQ3JDLG9CQUFvQixHQUFHLENBQUMsQ0FBQztJQUN6QixPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDOzs7Ozs7O01BT0ssVUFBVSxHQUFHLEdBQUc7O01BQ2hCLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQzs7Ozs7SUFHN0IsZUFBZSxHQUFHLENBQUM7Ozs7Ozs7Ozs7QUFVdkIsTUFBTSxVQUFVLFFBQVEsQ0FDcEIsYUFBcUIsRUFBRSxLQUFZLEVBQUUsSUFBNEM7SUFDbkYsU0FBUyxJQUFJLFdBQVcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxFQUFFLHVDQUF1QyxDQUFDLENBQUM7O1FBQzdGLEVBQUUsR0FDRixPQUFPLElBQUksS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUMsbUJBQUEsSUFBSSxFQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRXJGLHdGQUF3RjtJQUN4Rix1RkFBdUY7SUFDdkYsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO1FBQ2QsRUFBRSxHQUFHLENBQUMsbUJBQUEsSUFBSSxFQUFPLENBQUMsQ0FBQyxhQUFhLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQztLQUN2RDs7OztVQUlLLFFBQVEsR0FBRyxFQUFFLEdBQUcsVUFBVTs7Ozs7VUFLMUIsSUFBSSxHQUFHLENBQUMsSUFBSSxRQUFROzs7O1VBSXBCLEVBQUUsR0FBRyxRQUFRLEdBQUcsSUFBSTs7VUFDcEIsRUFBRSxHQUFHLFFBQVEsR0FBRyxJQUFJOztVQUNwQixFQUFFLEdBQUcsUUFBUSxHQUFHLElBQUk7O1VBQ3BCLEtBQUssR0FBRyxtQkFBQSxLQUFLLENBQUMsSUFBSSxFQUFZO0lBRXBDLElBQUksRUFBRSxFQUFFO1FBQ04sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ2hGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQ3JGO1NBQU07UUFDTCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDaEYsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztLQUNqRjtBQUNILENBQUM7Ozs7Ozs7O0FBU0QsTUFBTSxVQUFVLDhCQUE4QixDQUMxQyxLQUE0RCxFQUFFLFFBQWU7O1VBQ3pFLHFCQUFxQixHQUFHLGdCQUFnQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUM7SUFDL0QsSUFBSSxxQkFBcUIsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNoQyxPQUFPLHFCQUFxQixDQUFDO0tBQzlCOztVQUVLLEtBQUssR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDO0lBQzdCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLEtBQUssQ0FBQyxhQUFhLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQztRQUN0QyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFFLDRCQUE0QjtRQUM3RCxXQUFXLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUssa0NBQWtDO1FBQ25FLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5DLFNBQVMsSUFBSSxXQUFXLENBQ1AsS0FBSyxDQUFDLEtBQUssS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLEtBQUssd0JBQTJCLEVBQUUsSUFBSSxFQUNqRSw0Q0FBNEMsQ0FBQyxDQUFDO0tBQ2hFOztVQUVLLFNBQVMsR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDOztVQUN0RCxXQUFXLEdBQUcsc0JBQXNCLENBQUMsU0FBUyxDQUFDOztVQUMvQyxXQUFXLEdBQUcscUJBQXFCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQzs7VUFFeEQsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhO0lBRXpDLGtFQUFrRTtJQUNsRSwyREFBMkQ7SUFDM0QsSUFBSSxpQkFBaUIsQ0FBQyxTQUFTLENBQUMsRUFBRTs7Y0FDMUIsVUFBVSxHQUFHLG1CQUFBLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLEVBQU87UUFDakQsMEVBQTBFO1FBQzFFLHlFQUF5RTtRQUN6RSxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzFCLFFBQVEsQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsR0FBRyxVQUFVLENBQUMsV0FBVyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQzFGO0tBQ0Y7SUFFRCxRQUFRLENBQUMsYUFBYSxHQUFHLGVBQWUsQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUN0RCxPQUFPLGFBQWEsQ0FBQztBQUN2QixDQUFDOzs7Ozs7QUFFRCxTQUFTLFdBQVcsQ0FBQyxHQUFVLEVBQUUsTUFBb0I7SUFDbkQsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQzNDLENBQUM7Ozs7OztBQUdELE1BQU0sVUFBVSxnQkFBZ0IsQ0FBQyxLQUFZLEVBQUUsUUFBZTtJQUM1RCxJQUFJLEtBQUssQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDO1FBQzFCLDRGQUE0RjtRQUM1RixtRkFBbUY7UUFDbkYsQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxLQUFLLEtBQUssQ0FBQyxhQUFhLENBQUM7UUFDcEUsc0ZBQXNGO1FBQ3RGLHVEQUF1RDtRQUN2RCxRQUFRLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxlQUFlLENBQUMsSUFBSSxJQUFJLEVBQUU7UUFDM0QsT0FBTyxDQUFDLENBQUMsQ0FBQztLQUNYO1NBQU07UUFDTCxPQUFPLEtBQUssQ0FBQyxhQUFhLENBQUM7S0FDNUI7QUFDSCxDQUFDOzs7Ozs7Ozs7O0FBUUQsTUFBTSxVQUFVLHlCQUF5QixDQUFDLEtBQVksRUFBRSxJQUFXO0lBQ2pFLElBQUksS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNyRCxPQUFPLG1CQUFBLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxFQUFPLENBQUMsQ0FBRSxrQkFBa0I7S0FDOUQ7Ozs7O1FBS0csU0FBUyxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUM7O1FBQzNCLFVBQVUsR0FBRyxDQUFDO0lBQ2xCLE9BQU8sU0FBUyxJQUFJLFNBQVMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDbEQsSUFBSSxHQUFHLG1CQUFBLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxFQUFFLENBQUM7UUFDaEMsU0FBUyxHQUFHLG1CQUFBLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFDO1FBQzlCLFVBQVUsRUFBRSxDQUFDO0tBQ2Q7SUFFRCxPQUFPLFNBQVMsQ0FBQyxDQUFDO1FBQ2QsU0FBUyxDQUFDLGFBQWEsR0FBRyxDQUFDLFVBQVUsNEJBQWlELENBQUMsQ0FBQyxDQUFDO1FBQ3pGLG1CQUFBLENBQUMsQ0FBQyxFQUFPLENBQUM7QUFDaEIsQ0FBQzs7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSxrQkFBa0IsQ0FDOUIsYUFBcUIsRUFBRSxJQUFXLEVBQUUsS0FBcUM7SUFDM0UsUUFBUSxDQUFDLGFBQWEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDOUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFpQ0QsTUFBTSxVQUFVLG1CQUFtQixDQUFDLEtBQVksRUFBRSxnQkFBd0I7SUFDeEUsU0FBUyxJQUFJLHlCQUF5QixDQUNyQixLQUFLLCtEQUFxRSxDQUFDO0lBQzVGLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7O1VBQy9DLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSztJQUN6QixJQUFJLEtBQUssRUFBRTtRQUNULEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFOztrQkFDckMsUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDekIsSUFBSSxRQUFRLHVCQUErQjtnQkFBRSxNQUFNO1lBQ25ELElBQUksUUFBUSxJQUFJLGdCQUFnQixFQUFFO2dCQUNoQyxPQUFPLG1CQUFBLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQVUsQ0FBQzthQUMvQjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLElBQUksQ0FBQztBQUNkLENBQUM7Ozs7Ozs7Ozs7Ozs7OztBQWdCRCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLEtBQTRELEVBQUUsS0FBWSxFQUMxRSxLQUFpQyxFQUFFLFFBQXFCLFdBQVcsQ0FBQyxPQUFPLEVBQzNFLGFBQW1COztVQUNmLFNBQVMsR0FBRyxxQkFBcUIsQ0FBQyxLQUFLLENBQUM7SUFDOUMsK0ZBQStGO0lBQy9GLGtEQUFrRDtJQUNsRCxJQUFJLE9BQU8sU0FBUyxLQUFLLFVBQVUsRUFBRTs7Y0FDN0IseUJBQXlCLEdBQUcsd0JBQXdCLEVBQUU7O2NBQ3RELFNBQVMsR0FBRyxRQUFRLEVBQUU7UUFDNUIsbUJBQW1CLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xDLElBQUk7O2tCQUNJLEtBQUssR0FBRyxTQUFTLEVBQUU7WUFDekIsSUFBSSxLQUFLLElBQUksSUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLFFBQVEsQ0FBQyxFQUFFO2dCQUNwRCxNQUFNLElBQUksS0FBSyxDQUFDLG1CQUFtQixTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2FBQ3pEO2lCQUFNO2dCQUNMLE9BQU8sS0FBSyxDQUFDO2FBQ2Q7U0FDRjtnQkFBUztZQUNSLG1CQUFtQixDQUFDLHlCQUF5QixFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQzNEO0tBQ0Y7U0FBTSxJQUFJLE9BQU8sU0FBUyxJQUFJLFFBQVEsRUFBRTs7Ozs7WUFLbkMsYUFBYSxHQUFlLElBQUk7O1lBQ2hDLGFBQWEsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDOztZQUM5QyxjQUFjLEdBQTZCLGtCQUFrQjs7WUFDN0QsZ0JBQWdCLEdBQ2hCLEtBQUssR0FBRyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSTtRQUV6RSwrRkFBK0Y7UUFDL0YsdUJBQXVCO1FBQ3ZCLElBQUksYUFBYSxLQUFLLENBQUMsQ0FBQyxJQUFJLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxFQUFFO1lBQ3hELGNBQWMsR0FBRyxhQUFhLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLHlCQUF5QixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO2dCQUN6QyxLQUFLLENBQUMsYUFBYSxHQUFHLGVBQWUsQ0FBQyxDQUFDO1lBRS9FLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ3JDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUNwQjtpQkFBTTtnQkFDTCxhQUFhLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2dCQUM3QixhQUFhLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3ZELEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDdEQ7U0FDRjtRQUVELHVGQUF1RjtRQUN2RixtQkFBbUI7UUFDbkIsT0FBTyxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDM0IsY0FBYyxHQUFHLEtBQUssQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUM7OztrQkFHbEQsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7WUFDMUIsSUFBSSxhQUFhLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUU7Ozs7O3NCQUlqRCxRQUFRLEdBQVcsc0JBQXNCLENBQzNDLGFBQWEsRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsZ0JBQWdCLENBQUM7Z0JBQ3hFLElBQUksUUFBUSxLQUFLLFNBQVMsRUFBRTtvQkFDMUIsT0FBTyxRQUFRLENBQUM7aUJBQ2pCO2FBQ0Y7WUFDRCxJQUFJLGtCQUFrQixDQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLGFBQWEsR0FBRyxLQUFLLENBQUMsS0FBSyxnQkFBZ0IsQ0FBQztnQkFDekUsYUFBYSxDQUFDLFNBQVMsRUFBRSxhQUFhLEVBQUUsS0FBSyxDQUFDLEVBQUU7Z0JBQ2xELDBFQUEwRTtnQkFDMUUsK0NBQStDO2dCQUMvQyxhQUFhLEdBQUcsS0FBSyxDQUFDO2dCQUN0QixhQUFhLEdBQUcsc0JBQXNCLENBQUMsY0FBYyxDQUFDLENBQUM7Z0JBQ3ZELEtBQUssR0FBRyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDdEQ7aUJBQU07Z0JBQ0wseUZBQXlGO2dCQUN6RiwwRkFBMEY7Z0JBQzFGLFlBQVk7Z0JBQ1osYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3BCO1NBQ0Y7S0FDRjtJQUVELElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLElBQUksYUFBYSxLQUFLLFNBQVMsRUFBRTtRQUMvRCxvRUFBb0U7UUFDcEUsYUFBYSxHQUFHLElBQUksQ0FBQztLQUN0QjtJQUVELElBQUksQ0FBQyxLQUFLLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTs7Y0FDbkQsY0FBYyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDdEMsSUFBSSxjQUFjLEVBQUU7WUFDbEIsT0FBTyxjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxhQUFhLEVBQUUsS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUMvRTthQUFNO1lBQ0wsT0FBTyxrQkFBa0IsQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFLEtBQUssR0FBRyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7U0FDL0U7S0FDRjtJQUNELElBQUksS0FBSyxHQUFHLFdBQVcsQ0FBQyxRQUFRLEVBQUU7UUFDaEMsT0FBTyxhQUFhLENBQUM7S0FDdEI7U0FBTTtRQUNMLE1BQU0sSUFBSSxLQUFLLENBQUMsNEJBQTRCLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7S0FDbEU7QUFDSCxDQUFDOztNQUVLLFNBQVMsR0FBRyxFQUFFOzs7Ozs7Ozs7OztBQUVwQixTQUFTLHNCQUFzQixDQUMzQixhQUFxQixFQUFFLEtBQVksRUFBRSxLQUFpQyxFQUN0RSxhQUEyQixFQUFFLEtBQWtCLEVBQUUsZ0JBQThCOztVQUMzRSxZQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQzs7VUFDM0IsS0FBSyxHQUFHLG1CQUFBLFlBQVksQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxFQUFTOzs7O1VBR3pELHNCQUFzQixHQUFHLGFBQWEsSUFBSSxJQUFJLENBQUMsQ0FBQztRQUNsRCx5RkFBeUY7UUFDekYsNkZBQTZGO1FBQzdGLHdDQUF3QztRQUN4QywwQkFBMEI7UUFDMUIseUZBQXlGO1FBQ3pGLHNGQUFzRjtRQUN0RixpQkFBaUI7UUFDakIsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLElBQUksb0JBQW9CLENBQUMsQ0FBQyxDQUFDO1FBQzlDLDBGQUEwRjtRQUMxRix3RUFBd0U7UUFDeEUsbUZBQW1GO1FBQ25GLHdDQUF3QztRQUN4QywwRkFBMEY7UUFDMUYsMEJBQTBCO1FBQzFCLENBQUMsYUFBYSxJQUFJLFlBQVksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixDQUFDLENBQUM7Ozs7VUFJbkUsaUJBQWlCLEdBQUcsQ0FBQyxLQUFLLEdBQUcsV0FBVyxDQUFDLElBQUksQ0FBQyxJQUFJLGdCQUFnQixLQUFLLEtBQUs7O1VBRTVFLGFBQWEsR0FDZix5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxzQkFBc0IsRUFBRSxpQkFBaUIsQ0FBQztJQUM3RixJQUFJLGFBQWEsS0FBSyxJQUFJLEVBQUU7UUFDMUIsT0FBTyxpQkFBaUIsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxhQUFhLEVBQUUsbUJBQUEsS0FBSyxFQUFnQixDQUFDLENBQUM7S0FDMUY7U0FBTTtRQUNMLE9BQU8sU0FBUyxDQUFDO0tBQ2xCO0FBQ0gsQ0FBQzs7Ozs7Ozs7Ozs7O0FBWUQsTUFBTSxVQUFVLHlCQUF5QixDQUNyQyxLQUFZLEVBQUUsS0FBWSxFQUFFLEtBQWlDLEVBQUUsc0JBQStCLEVBQzlGLGlCQUFtQzs7VUFDL0IsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7O1VBQ3BCLG1CQUFtQixHQUFHLEtBQUssQ0FBQyxlQUFlOztVQUMzQyxZQUFZLEdBQUcsS0FBSyxDQUFDLElBQUk7O1VBRXpCLGdCQUFnQixHQUFHLG1CQUFtQixzQ0FBK0M7O1VBQ3JGLGVBQWUsR0FBRyxLQUFLLENBQUMsY0FBYzs7VUFDdEMsWUFBWSxHQUFHLEtBQUssQ0FBQyxZQUFZOztVQUNqQyxxQkFBcUIsR0FDdkIsbUJBQW1CLHVDQUFtRDs7VUFDcEUsYUFBYSxHQUNmLHNCQUFzQixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLENBQUMsZ0JBQWdCLEdBQUcscUJBQXFCOzs7VUFFbEYsUUFBUSxHQUFHLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsR0FBRyxxQkFBcUIsQ0FBQyxDQUFDLENBQUMsWUFBWTtJQUM1RixLQUFLLElBQUksQ0FBQyxHQUFHLGFBQWEsRUFBRSxDQUFDLEdBQUcsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFOztjQUN2QyxrQkFBa0IsR0FBRyxtQkFBQSxZQUFZLENBQUMsQ0FBQyxDQUFDLEVBQXFEO1FBQy9GLElBQUksQ0FBQyxHQUFHLGVBQWUsSUFBSSxLQUFLLEtBQUssa0JBQWtCO1lBQ25ELENBQUMsSUFBSSxlQUFlLElBQUksQ0FBQyxtQkFBQSxrQkFBa0IsRUFBcUIsQ0FBQyxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUU7WUFDcEYsT0FBTyxDQUFDLENBQUM7U0FDVjtLQUNGO0lBQ0QsSUFBSSxpQkFBaUIsRUFBRTs7Y0FDZixNQUFNLEdBQUcsbUJBQUEsWUFBWSxDQUFDLGVBQWUsQ0FBQyxFQUFxQjtRQUNqRSxJQUFJLE1BQU0sSUFBSSxjQUFjLENBQUMsTUFBTSxDQUFDLElBQUksTUFBTSxDQUFDLElBQUksS0FBSyxLQUFLLEVBQUU7WUFDN0QsT0FBTyxlQUFlLENBQUM7U0FDeEI7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQzs7Ozs7Ozs7Ozs7OztBQVNELE1BQU0sVUFBVSxpQkFBaUIsQ0FDN0IsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFhLEVBQUUsS0FBbUI7O1FBQzVELEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDO0lBQ3hCLElBQUksU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFOztjQUNkLE9BQU8sR0FBd0IsS0FBSztRQUMxQyxJQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7WUFDckIsTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsU0FBUyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztTQUNoRTs7Y0FDSyw0QkFBNEIsR0FBRyx1QkFBdUIsQ0FBQyxPQUFPLENBQUMsbUJBQW1CLENBQUM7UUFDekYsT0FBTyxDQUFDLFNBQVMsR0FBRyxJQUFJLENBQUM7O1lBQ3JCLDRCQUE0QjtRQUNoQyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7WUFDdEIsNEJBQTRCLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1NBQzVFOztjQUNLLHlCQUF5QixHQUFHLHdCQUF3QixFQUFFOztjQUN0RCxTQUFTLEdBQUcsUUFBUSxFQUFFO1FBQzVCLG1CQUFtQixDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsQyxJQUFJO1lBQ0YsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ25FO2dCQUFTO1lBQ1IsSUFBSSxPQUFPLENBQUMsVUFBVTtnQkFBRSx1QkFBdUIsQ0FBQyw0QkFBNEIsQ0FBQyxDQUFDO1lBQzlFLHVCQUF1QixDQUFDLDRCQUE0QixDQUFDLENBQUM7WUFDdEQsT0FBTyxDQUFDLFNBQVMsR0FBRyxLQUFLLENBQUM7WUFDMUIsbUJBQW1CLENBQUMseUJBQXlCLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDM0Q7S0FDRjtJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2YsQ0FBQzs7Ozs7Ozs7Ozs7O0FBYUQsTUFBTSxVQUFVLHFCQUFxQixDQUFDLEtBQTZDO0lBRWpGLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLHVCQUF1QixDQUFDLENBQUM7SUFDM0QsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDN0IsT0FBTyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUNqQzs7VUFDSyxPQUFPLEdBQXFCLENBQUMsbUJBQUEsS0FBSyxFQUFPLENBQUMsQ0FBQyxhQUFhLENBQUM7SUFDL0QsT0FBTyxPQUFPLE9BQU8sS0FBSyxRQUFRLENBQUMsQ0FBQyxDQUFDLE9BQU8sR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQztBQUN0RSxDQUFDOzs7Ozs7O0FBRUQsTUFBTSxVQUFVLGFBQWEsQ0FDekIsU0FBaUIsRUFBRSxhQUFxQixFQUFFLFlBQTJCOzs7OztVQUlqRSxJQUFJLEdBQUcsQ0FBQyxJQUFJLFNBQVM7O1VBQ3JCLEVBQUUsR0FBRyxTQUFTLEdBQUcsSUFBSTs7VUFDckIsRUFBRSxHQUFHLFNBQVMsR0FBRyxJQUFJOztVQUNyQixFQUFFLEdBQUcsU0FBUyxHQUFHLElBQUk7Ozs7O1FBS3ZCLEtBQWE7SUFFakIsSUFBSSxFQUFFLEVBQUU7UUFDTixLQUFLLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDMUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUN2RjtTQUFNO1FBQ0wsS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxDQUFDLENBQUMsQ0FBQztLQUNuRjtJQUVELDhGQUE4RjtJQUM5RixzQ0FBc0M7SUFDdEMsT0FBTyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDMUIsQ0FBQzs7Ozs7OztBQUdELFNBQVMsa0JBQWtCLENBQUMsS0FBa0IsRUFBRSxnQkFBeUI7SUFDdkUsT0FBTyxDQUFDLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxHQUFHLFdBQVcsQ0FBQyxJQUFJLElBQUksZ0JBQWdCLENBQUMsQ0FBQztBQUN4RixDQUFDOzs7O0FBRUQsTUFBTSxVQUFVLGNBQWM7O1VBQ3RCLEtBQUssR0FBRyxtQkFBQSx3QkFBd0IsRUFBRSxFQUF5RDtJQUNqRyxPQUFPLElBQUksWUFBWSxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUUsQ0FBQyxDQUFDO0FBQzdDLENBQUM7QUFFRCxNQUFNLE9BQU8sWUFBWTs7Ozs7SUFDdkIsWUFDWSxNQUF5RCxFQUFVLE1BQWE7UUFBaEYsV0FBTSxHQUFOLE1BQU0sQ0FBbUQ7UUFBVSxXQUFNLEdBQU4sTUFBTSxDQUFPO0lBQUcsQ0FBQzs7Ozs7O0lBRWhHLEdBQUcsQ0FBQyxLQUFVLEVBQUUsYUFBbUI7UUFDakMsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztJQUMxRixDQUFDO0NBQ0Y7Ozs7OztJQUxLLDhCQUFpRTs7Ozs7SUFBRSw4QkFBcUI7Ozs7Ozs7QUFPOUYsTUFBTSxVQUFVLFlBQVksQ0FBSSxJQUFlOztVQUN2QyxPQUFPLEdBQUcsbUJBQUEsSUFBSSxFQUFPOztVQUNyQixHQUFHLEdBQUcsZUFBZSxDQUFJLE9BQU8sQ0FBQyxJQUFJLGVBQWUsQ0FBSSxPQUFPLENBQUM7UUFDbEUsVUFBVSxDQUFJLE9BQU8sQ0FBQyxJQUFJLGdCQUFnQixDQUFJLE9BQU8sQ0FBQyxJQUFJLGNBQWMsQ0FBSSxPQUFPLENBQUM7SUFDeEYsSUFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxLQUFLLFNBQVMsRUFBRTtRQUNyQyxPQUFPLElBQUksQ0FBQztLQUNiO0lBQ0QsT0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDO0FBQ3JCLENBQUM7Ozs7OztBQUVELE1BQU0sVUFBVSxtQkFBbUIsQ0FBSSxJQUFlOztVQUM5QyxLQUFLLEdBQUcsbUJBQUEsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBVyxFQUFhOztVQUN0RSxPQUFPLEdBQUcsWUFBWSxDQUFJLEtBQUssQ0FBQztJQUN0QyxJQUFJLE9BQU8sS0FBSyxJQUFJLEVBQUU7UUFDcEIsT0FBTyxPQUFPLENBQUM7S0FDaEI7U0FBTTtRQUNMLDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtJbmplY3RGbGFncywgaW5qZWN0Um9vdExpbXBNb2RlLCBzZXRJbmplY3RJbXBsZW1lbnRhdGlvbn0gZnJvbSAnLi4vZGkvaW5qZWN0b3JfY29tcGF0aWJpbGl0eSc7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWQsIGFzc2VydEVxdWFsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOT19QQVJFTlRfSU5KRUNUT1IsIE5vZGVJbmplY3RvckZhY3RvcnksIFBBUkVOVF9JTkpFQ1RPUiwgUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uLCBSZWxhdGl2ZUluamVjdG9yTG9jYXRpb25GbGFncywgVE5PREUsIGlzRmFjdG9yeX0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVByb3ZpZGVySW5kZXhlcywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX1ZJRVcsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3LCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHtnZXRMVmlldywgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBzZXRUTm9kZUFuZFZpZXdEYXRhfSBmcm9tICcuL3N0YXRlJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXcsIGdldFBhcmVudEluamVjdG9ySW5kZXgsIGdldFBhcmVudEluamVjdG9yVmlldywgaGFzUGFyZW50SW5qZWN0b3IsIGlzQ29tcG9uZW50LCBpc0NvbXBvbmVudERlZiwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuXG5cbi8qKlxuICogRGVmaW5lcyBpZiB0aGUgY2FsbCB0byBgaW5qZWN0YCBzaG91bGQgaW5jbHVkZSBgdmlld1Byb3ZpZGVyc2AgaW4gaXRzIHJlc29sdXRpb24uXG4gKlxuICogVGhpcyBpcyBzZXQgdG8gdHJ1ZSB3aGVuIHdlIHRyeSB0byBpbnN0YW50aWF0ZSBhIGNvbXBvbmVudC4gVGhpcyB2YWx1ZSBpcyByZXNldCBpblxuICogYGdldE5vZGVJbmplY3RhYmxlYCB0byBhIHZhbHVlIHdoaWNoIG1hdGNoZXMgdGhlIGRlY2xhcmF0aW9uIGxvY2F0aW9uIG9mIHRoZSB0b2tlbiBhYm91dCB0byBiZVxuICogaW5zdGFudGlhdGVkLiBUaGlzIGlzIGRvbmUgc28gdGhhdCBpZiB3ZSBhcmUgaW5qZWN0aW5nIGEgdG9rZW4gd2hpY2ggd2FzIGRlY2xhcmVkIG91dHNpZGUgb2ZcbiAqIGB2aWV3UHJvdmlkZXJzYCB3ZSBkb24ndCBhY2NpZGVudGFsbHkgcHVsbCBgdmlld1Byb3ZpZGVyc2AgaW4uXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIEBJbmplY3RhYmxlKClcbiAqIGNsYXNzIE15U2VydmljZSB7XG4gKiAgIGNvbnN0cnVjdG9yKHB1YmxpYyB2YWx1ZTogU3RyaW5nKSB7fVxuICogfVxuICpcbiAqIEBDb21wb25lbnQoe1xuICogICBwcm92aWRlcnM6IFtcbiAqICAgICBNeVNlcnZpY2UsXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICdwcm92aWRlcnMnIH1cbiAqICAgXVxuICogICB2aWV3UHJvdmlkZXJzOiBbXG4gKiAgICAge3Byb3ZpZGU6IFN0cmluZywgdmFsdWU6ICd2aWV3UHJvdmlkZXJzJ31cbiAqICAgXVxuICogfSlcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IobXlTZXJ2aWNlOiBNeVNlcnZpY2UsIHZhbHVlOiBTdHJpbmcpIHtcbiAqICAgICAvLyBXZSBleHBlY3QgdGhhdCBDb21wb25lbnQgY2FuIHNlZSBpbnRvIGB2aWV3UHJvdmlkZXJzYC5cbiAqICAgICBleHBlY3QodmFsdWUpLnRvRXF1YWwoJ3ZpZXdQcm92aWRlcnMnKTtcbiAqICAgICAvLyBgTXlTZXJ2aWNlYCB3YXMgbm90IGRlY2xhcmVkIGluIGB2aWV3UHJvdmlkZXJzYCBoZW5jZSBpdCBjYW4ndCBzZWUgaXQuXG4gKiAgICAgZXhwZWN0KG15U2VydmljZS52YWx1ZSkudG9FcXVhbCgncHJvdmlkZXJzJyk7XG4gKiAgIH1cbiAqIH1cbiAqXG4gKiBgYGBcbiAqL1xubGV0IGluY2x1ZGVWaWV3UHJvdmlkZXJzID0gdHJ1ZTtcblxuZnVuY3Rpb24gc2V0SW5jbHVkZVZpZXdQcm92aWRlcnModjogYm9vbGVhbik6IGJvb2xlYW4ge1xuICBjb25zdCBvbGRWYWx1ZSA9IGluY2x1ZGVWaWV3UHJvdmlkZXJzO1xuICBpbmNsdWRlVmlld1Byb3ZpZGVycyA9IHY7XG4gIHJldHVybiBvbGRWYWx1ZTtcbn1cblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT58IHN0cmluZyk6IHZvaWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RXF1YWwodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MsIHRydWUsICdleHBlY3RlZCBmaXJzdFRlbXBsYXRlUGFzcyB0byBiZSB0cnVlJyk7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9XG4gICAgICB0eXBlb2YgdHlwZSAhPT0gJ3N0cmluZycgPyAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdIDogdHlwZS5jaGFyQ29kZUF0KDApIHx8IDA7XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG4gIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YSBhcyBudW1iZXJbXTtcblxuICBpZiAoYjcpIHtcbiAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgN10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDZdIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDVdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA0XSB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDNdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyAyXSB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAxXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4XSB8PSBtYXNrKSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIGhvc3RWaWV3IFZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXcpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBob3N0Vmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gaG9zdFZpZXcubGVuZ3RoO1xuICAgIGluc2VydEJsb29tKHRWaWV3LmRhdGEsIHROb2RlKTsgIC8vIGZvdW5kYXRpb24gZm9yIG5vZGUgYmxvb21cbiAgICBpbnNlcnRCbG9vbShob3N0VmlldywgbnVsbCk7ICAgICAvLyBmb3VuZGF0aW9uIGZvciBjdW11bGF0aXZlIGJsb29tXG4gICAgaW5zZXJ0Qmxvb20odFZpZXcuYmx1ZXByaW50LCBudWxsKTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnRFcXVhbChcbiAgICAgICAgICAgICAgICAgICAgIHROb2RlLmZsYWdzID09PSAwIHx8IHROb2RlLmZsYWdzID09PSBUTm9kZUZsYWdzLmlzQ29tcG9uZW50LCB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAgJ2V4cGVjdGVkIHROb2RlLmZsYWdzIHRvIG5vdCBiZSBpbml0aWFsaXplZCcpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBwYXJlbnRJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jKTtcbiAgY29uc3QgcGFyZW50TFZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jLCBob3N0Vmlldyk7XG5cbiAgY29uc3QgaW5qZWN0b3JJbmRleCA9IHROb2RlLmluamVjdG9ySW5kZXg7XG5cbiAgLy8gSWYgYSBwYXJlbnQgaW5qZWN0b3IgY2FuJ3QgYmUgZm91bmQsIGl0cyBsb2NhdGlvbiBpcyBzZXQgdG8gLTEuXG4gIC8vIEluIHRoYXQgY2FzZSwgd2UgZG9uJ3QgbmVlZCB0byBzZXQgdXAgYSBjdW11bGF0aXZlIGJsb29tXG4gIGlmIChoYXNQYXJlbnRJbmplY3RvcihwYXJlbnRMb2MpKSB7XG4gICAgY29uc3QgcGFyZW50RGF0YSA9IHBhcmVudExWaWV3W1RWSUVXXS5kYXRhIGFzIGFueTtcbiAgICAvLyBDcmVhdGVzIGEgY3VtdWxhdGl2ZSBibG9vbSBmaWx0ZXIgdGhhdCBtZXJnZXMgdGhlIHBhcmVudCdzIGJsb29tIGZpbHRlclxuICAgIC8vIGFuZCBpdHMgb3duIGN1bXVsYXRpdmUgYmxvb20gKHdoaWNoIGNvbnRhaW5zIHRva2VucyBmb3IgYWxsIGFuY2VzdG9ycylcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IDg7IGkrKykge1xuICAgICAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIGldID0gcGFyZW50TFZpZXdbcGFyZW50SW5kZXggKyBpXSB8IHBhcmVudERhdGFbcGFyZW50SW5kZXggKyBpXTtcbiAgICB9XG4gIH1cblxuICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIGluc2VydEJsb29tKGFycjogYW55W10sIGZvb3RlcjogVE5vZGUgfCBudWxsKTogdm9pZCB7XG4gIGFyci5wdXNoKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIGZvb3Rlcik7XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9ySW5kZXgodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXcpOiBudW1iZXIge1xuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIC8vIElmIHRoZSBpbmplY3RvciBpbmRleCBpcyB0aGUgc2FtZSBhcyBpdHMgcGFyZW50J3MgaW5qZWN0b3IgaW5kZXgsIHRoZW4gdGhlIGluZGV4IGhhcyBiZWVuXG4gICAgICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICAgICAgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkgfHxcbiAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5qZWN0b3IgaW5kZXggbWlnaHQgZXhpc3QgYnV0IHRoZSBwYXJlbnQgdmFsdWVzXG4gICAgICAvLyBtaWdodCBub3QgaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgeWV0IGZvciB0aGlzIGluc3RhbmNlXG4gICAgICBob3N0Vmlld1t0Tm9kZS5pbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKlxuICogUmV0dXJucyBhIGNvbWJpbmF0aW9uIG9mIG51bWJlciBvZiBgVmlld0RhdGFgIHdlIGhhdmUgdG8gZ28gdXAgYW5kIGluZGV4IGluIHRoYXQgYFZpZXdkYXRhYFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3KTogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggYXMgYW55OyAgLy8gVmlld09mZnNldCBpcyAwXG4gIH1cblxuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIHNvIHRoaXMgbG9vcCB3aWxsIGJlIHNraXBwZWQsIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0XG4gIC8vIHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWQgPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXTtcbiAgbGV0IHZpZXdPZmZzZXQgPSAxO1xuICB3aGlsZSAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS5pbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgIHZpZXcgPSB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdICE7XG4gICAgdmlld09mZnNldCsrO1xuICB9XG5cbiAgcmV0dXJuIGhvc3RUTm9kZSA/XG4gICAgICBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCB8ICh2aWV3T2Zmc2V0IDw8IFJlbGF0aXZlSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgOlxuICAgICAgLTEgYXMgYW55O1xufVxuXG4vKipcbiAqIE1ha2VzIGEgdHlwZSBvciBhbiBpbmplY3Rpb24gdG9rZW4gcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuXG4gKiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIHRva2VuIFRoZSB0eXBlIG9yIHRoZSBpbmplY3Rpb24gdG9rZW4gdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljSW5JbmplY3RvcihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIHZpZXc6IExWaWV3LCB0b2tlbjogSW5qZWN0aW9uVG9rZW48YW55PnwgVHlwZTxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHZpZXdbVFZJRVddLCB0b2tlbik7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZUltcGwodE5vZGU6IFROb2RlLCBhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8bnVsbCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBOb2RlSW5qZWN0b3JzID0+IE1vZHVsZUluamVjdG9yLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUaGUgTm9kZSB3aGVyZSB0aGUgc2VhcmNoIGZvciB0aGUgaW5qZWN0b3Igc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gbFZpZXcgVGhlIGBMVmlld2AgdGhhdCBjb250YWlucyB0aGUgYHROb2RlYFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHBhcmFtIG5vdEZvdW5kVmFsdWUgVGhlIHZhbHVlIHRvIHJldHVybiB3aGVuIHRoZSBpbmplY3Rpb24gZmxhZ3MgaXMgYEluamVjdEZsYWdzLk9wdGlvbmFsYFxuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yLCBgbnVsbGAgd2hlbiBub3QgZm91bmQsIG9yIGBub3RGb3VuZFZhbHVlYCBpZiBwcm92aWRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgbFZpZXc6IExWaWV3LFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCxcbiAgICBub3RGb3VuZFZhbHVlPzogYW55KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgLy8gSWYgdGhlIElEIHN0b3JlZCBoZXJlIGlzIGEgZnVuY3Rpb24sIHRoaXMgaXMgYSBzcGVjaWFsIG9iamVjdCBsaWtlIEVsZW1lbnRSZWYgb3IgVGVtcGxhdGVSZWZcbiAgLy8gc28ganVzdCBjYWxsIHRoZSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBpdC5cbiAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHtcbiAgICBjb25zdCBzYXZlUHJldmlvdXNPclBhcmVudFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gICAgY29uc3Qgc2F2ZUxWaWV3ID0gZ2V0TFZpZXcoKTtcbiAgICBzZXRUTm9kZUFuZFZpZXdEYXRhKHROb2RlLCBsVmlldyk7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHZhbHVlID0gYmxvb21IYXNoKCk7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCAmJiAhKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gcHJvdmlkZXIgZm9yICR7c3RyaW5naWZ5KHRva2VuKX0hYCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldFROb2RlQW5kVmlld0RhdGEoc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSwgc2F2ZUxWaWV3KTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodHlwZW9mIGJsb29tSGFzaCA9PSAnbnVtYmVyJykge1xuICAgIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgdG9rZW4gd2hpY2ggY291bGQgYmUgaW4gTm9kZUluamVjdG9yLlxuXG4gICAgLy8gQSByZWZlcmVuY2UgdG8gdGhlIHByZXZpb3VzIGluamVjdG9yIFRWaWV3IHRoYXQgd2FzIGZvdW5kIHdoaWxlIGNsaW1iaW5nIHRoZSBlbGVtZW50IGluamVjdG9yXG4gICAgLy8gdHJlZS4gVGhpcyBpcyB1c2VkIHRvIGtub3cgaWYgdmlld1Byb3ZpZGVycyBjYW4gYmUgYWNjZXNzZWQgb24gdGhlIGN1cnJlbnQgaW5qZWN0b3IuXG4gICAgbGV0IHByZXZpb3VzVFZpZXc6IFRWaWV3fG51bGwgPSBudWxsO1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgbFZpZXcpO1xuICAgIGxldCBwYXJlbnRMb2NhdGlvbjogUmVsYXRpdmVJbmplY3RvckxvY2F0aW9uID0gTk9fUEFSRU5UX0lOSkVDVE9SO1xuICAgIGxldCBob3N0VEVsZW1lbnROb2RlOiBUTm9kZXxudWxsID1cbiAgICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ID8gZmluZENvbXBvbmVudFZpZXcobFZpZXcpW0hPU1RfTk9ERV0gOiBudWxsO1xuXG4gICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3Rvciwgb3IgaWYgdGhlcmUgaXMgbm8gaW5qZWN0b3Igb24gdGhpcyBub2RlLCBzdGFydCBieSBzZWFyY2hpbmdcbiAgICAvLyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSB8fCBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgbFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcblxuICAgICAgaWYgKCFzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3MsIGZhbHNlKSkge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcmV2aW91c1RWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgICBpbmplY3RvckluZGV4ID0gZ2V0UGFyZW50SW5qZWN0b3JJbmRleChwYXJlbnRMb2NhdGlvbik7XG4gICAgICAgIGxWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBsVmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlXG4gICAgLy8gKmlzbid0KiBhIG1hdGNoLlxuICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgcGFyZW50TG9jYXRpb24gPSBsVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcblxuICAgICAgLy8gQ2hlY2sgdGhlIGN1cnJlbnQgaW5qZWN0b3IuIElmIGl0IG1hdGNoZXMsIHNlZSBpZiBpdCBjb250YWlucyB0b2tlbi5cbiAgICAgIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICAgICAgaWYgKGJsb29tSGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCB0Vmlldy5kYXRhKSkge1xuICAgICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2hcbiAgICAgICAgLy8gdGhlIHByb3ZpZGVycyBhbmQgZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldFxuICAgICAgICAvLyB0aGUgaW5zdGFuY2UuXG4gICAgICAgIGNvbnN0IGluc3RhbmNlOiBUfG51bGwgPSBzZWFyY2hUb2tlbnNPbkluamVjdG9yPFQ+KFxuICAgICAgICAgICAgaW5qZWN0b3JJbmRleCwgbFZpZXcsIHRva2VuLCBwcmV2aW91c1RWaWV3LCBmbGFncywgaG9zdFRFbGVtZW50Tm9kZSk7XG4gICAgICAgIGlmIChpbnN0YW5jZSAhPT0gTk9UX0ZPVU5EKSB7XG4gICAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoc2hvdWxkU2VhcmNoUGFyZW50KFxuICAgICAgICAgICAgICBmbGFncywgbFZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSA9PT0gaG9zdFRFbGVtZW50Tm9kZSkgJiZcbiAgICAgICAgICBibG9vbUhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgbFZpZXcpKSB7XG4gICAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICAgIHByZXZpb3VzVFZpZXcgPSB0VmlldztcbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IGdldFBhcmVudEluamVjdG9ySW5kZXgocGFyZW50TG9jYXRpb24pO1xuICAgICAgICBsVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgbFZpZXcpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gSWYgd2Ugc2hvdWxkIG5vdCBzZWFyY2ggcGFyZW50IE9SIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgZG9lcyBub3QgaGF2ZSB0aGVcbiAgICAgICAgLy8gYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSB3ZSBjYW4gZ2l2ZSB1cCBvbiB0cmF2ZXJzaW5nIHVwIHRvIGZpbmQgdGhlIHNwZWNpZmljXG4gICAgICAgIC8vIGluamVjdG9yLlxuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwgJiYgbm90Rm91bmRWYWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgLy8gVGhpcyBtdXN0IGJlIHNldCBvciB0aGUgTnVsbEluamVjdG9yIHdpbGwgdGhyb3cgZm9yIG9wdGlvbmFsIGRlcHNcbiAgICBub3RGb3VuZFZhbHVlID0gbnVsbDtcbiAgfVxuXG4gIGlmICgoZmxhZ3MgJiAoSW5qZWN0RmxhZ3MuU2VsZiB8IEluamVjdEZsYWdzLkhvc3QpKSA9PT0gMCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gbFZpZXdbSU5KRUNUT1JdO1xuICAgIGlmIChtb2R1bGVJbmplY3Rvcikge1xuICAgICAgcmV0dXJuIG1vZHVsZUluamVjdG9yLmdldCh0b2tlbiwgbm90Rm91bmRWYWx1ZSwgZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBpbmplY3RSb290TGltcE1vZGUodG9rZW4sIG5vdEZvdW5kVmFsdWUsIGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpO1xuICAgIH1cbiAgfVxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkge1xuICAgIHJldHVybiBub3RGb3VuZFZhbHVlO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcihgTm9kZUluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG4gIH1cbn1cblxuY29uc3QgTk9UX0ZPVU5EID0ge307XG5cbmZ1bmN0aW9uIHNlYXJjaFRva2Vuc09uSW5qZWN0b3I8VD4oXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBsVmlldzogTFZpZXcsIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBwcmV2aW91c1RWaWV3OiBUVmlldyB8IG51bGwsIGZsYWdzOiBJbmplY3RGbGFncywgaG9zdFRFbGVtZW50Tm9kZTogVE5vZGUgfCBudWxsKSB7XG4gIGNvbnN0IGN1cnJlbnRUVmlldyA9IGxWaWV3W1RWSUVXXTtcbiAgY29uc3QgdE5vZGUgPSBjdXJyZW50VFZpZXcuZGF0YVtpbmplY3RvckluZGV4ICsgVE5PREVdIGFzIFROb2RlO1xuICAvLyBGaXJzdCwgd2UgbmVlZCB0byBkZXRlcm1pbmUgaWYgdmlldyBwcm92aWRlcnMgY2FuIGJlIGFjY2Vzc2VkIGJ5IHRoZSBzdGFydGluZyBlbGVtZW50LlxuICAvLyBUaGVyZSBhcmUgdHdvIHBvc3NpYml0aWVzXG4gIGNvbnN0IGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPSBwcmV2aW91c1RWaWV3ID09IG51bGwgP1xuICAgICAgLy8gMSkgVGhpcyBpcyB0aGUgZmlyc3QgaW52b2NhdGlvbiBgcHJldmlvdXNUVmlldyA9PSBudWxsYCB3aGljaCBtZWFucyB0aGF0IHdlIGFyZSBhdCB0aGVcbiAgICAgIC8vIGBUTm9kZWAgb2Ygd2hlcmUgaW5qZWN0b3IgaXMgc3RhcnRpbmcgdG8gbG9vay4gSW4gc3VjaCBhIGNhc2UgdGhlIG9ubHkgdGltZSB3ZSBhcmUgYWxsb3dlZFxuICAgICAgLy8gdG8gbG9vayBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzIGlzIGlmOlxuICAgICAgLy8gLSB3ZSBhcmUgb24gYSBjb21wb25lbnRcbiAgICAgIC8vIC0gQU5EIHRoZSBpbmplY3RvciBzZXQgYGluY2x1ZGVWaWV3UHJvdmlkZXJzYCB0byB0cnVlIChpbXBseWluZyB0aGF0IHRoZSB0b2tlbiBjYW4gc2VlXG4gICAgICAvLyBWaWV3UHJvdmlkZXJzIGJlY2F1c2UgaXQgaXMgdGhlIENvbXBvbmVudCBvciBhIFNlcnZpY2Ugd2hpY2ggaXRzZWxmIHdhcyBkZWNsYXJlZCBpblxuICAgICAgLy8gVmlld1Byb3ZpZGVycylcbiAgICAgIChpc0NvbXBvbmVudCh0Tm9kZSkgJiYgaW5jbHVkZVZpZXdQcm92aWRlcnMpIDpcbiAgICAgIC8vIDIpIGBwcmV2aW91c1RWaWV3ICE9IG51bGxgIHdoaWNoIG1lYW5zIHRoYXQgd2UgYXJlIG5vdyB3YWxraW5nIGFjcm9zcyB0aGUgcGFyZW50IG5vZGVzLlxuICAgICAgLy8gSW4gc3VjaCBhIGNhc2Ugd2UgYXJlIG9ubHkgYWxsb3dlZCB0byBsb29rIGludG8gdGhlIFZpZXdQcm92aWRlcnMgaWY6XG4gICAgICAvLyAtIFdlIGp1c3QgY3Jvc3NlZCBmcm9tIGNoaWxkIFZpZXcgdG8gUGFyZW50IFZpZXcgYHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3YFxuICAgICAgLy8gLSBBTkQgdGhlIHBhcmVudCBUTm9kZSBpcyBhbiBFbGVtZW50LlxuICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHdlIGp1c3QgY2FtZSBmcm9tIHRoZSBDb21wb25lbnQncyBWaWV3IGFuZCB0aGVyZWZvcmUgYXJlIGFsbG93ZWQgdG8gc2VlXG4gICAgICAvLyBpbnRvIHRoZSBWaWV3UHJvdmlkZXJzLlxuICAgICAgKHByZXZpb3VzVFZpZXcgIT0gY3VycmVudFRWaWV3ICYmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkpO1xuXG4gIC8vIFRoaXMgc3BlY2lhbCBjYXNlIGhhcHBlbnMgd2hlbiB0aGVyZSBpcyBhIEBob3N0IG9uIHRoZSBpbmplY3QgYW5kIHdoZW4gd2UgYXJlIHNlYXJjaGluZ1xuICAvLyBvbiB0aGUgaG9zdCBlbGVtZW50IG5vZGUuXG4gIGNvbnN0IGlzSG9zdFNwZWNpYWxDYXNlID0gKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCkgJiYgaG9zdFRFbGVtZW50Tm9kZSA9PT0gdE5vZGU7XG5cbiAgY29uc3QgaW5qZWN0YWJsZUlkeCA9XG4gICAgICBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyKHROb2RlLCBsVmlldywgdG9rZW4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMsIGlzSG9zdFNwZWNpYWxDYXNlKTtcbiAgaWYgKGluamVjdGFibGVJZHggIT09IG51bGwpIHtcbiAgICByZXR1cm4gZ2V0Tm9kZUluamVjdGFibGUoY3VycmVudFRWaWV3LmRhdGEsIGxWaWV3LCBpbmplY3RhYmxlSWR4LCB0Tm9kZSBhcyBURWxlbWVudE5vZGUpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBOT1RfRk9VTkQ7XG4gIH1cbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgdGhlIGdpdmVuIHRva2VuIGFtb25nIHRoZSBub2RlJ3MgZGlyZWN0aXZlcyBhbmQgcHJvdmlkZXJzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBUTm9kZSBvbiB3aGljaCBkaXJlY3RpdmVzIGFyZSBwcmVzZW50LlxuICogQHBhcmFtIGxWaWV3IFRoZSB2aWV3IHdlIGFyZSBjdXJyZW50bHkgcHJvY2Vzc2luZ1xuICogQHBhcmFtIHRva2VuIFByb3ZpZGVyIHRva2VuIG9yIHR5cGUgb2YgYSBkaXJlY3RpdmUgdG8gbG9vayBmb3IuXG4gKiBAcGFyYW0gY2FuQWNjZXNzVmlld1Byb3ZpZGVycyBXaGV0aGVyIHZpZXcgcHJvdmlkZXJzIHNob3VsZCBiZSBjb25zaWRlcmVkLlxuICogQHBhcmFtIGlzSG9zdFNwZWNpYWxDYXNlIFdoZXRoZXIgdGhlIGhvc3Qgc3BlY2lhbCBjYXNlIGFwcGxpZXMuXG4gKiBAcmV0dXJucyBJbmRleCBvZiBhIGZvdW5kIGRpcmVjdGl2ZSBvciBwcm92aWRlciwgb3IgbnVsbCB3aGVuIG5vbmUgZm91bmQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBsb2NhdGVEaXJlY3RpdmVPclByb3ZpZGVyPFQ+KFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnM6IGJvb2xlYW4sXG4gICAgaXNIb3N0U3BlY2lhbENhc2U6IGJvb2xlYW4gfCBudW1iZXIpOiBudW1iZXJ8bnVsbCB7XG4gIGNvbnN0IHRWaWV3ID0gbFZpZXdbVFZJRVddO1xuICBjb25zdCBub2RlUHJvdmlkZXJJbmRleGVzID0gdE5vZGUucHJvdmlkZXJJbmRleGVzO1xuICBjb25zdCB0SW5qZWN0YWJsZXMgPSB0Vmlldy5kYXRhO1xuXG4gIGNvbnN0IGluamVjdGFibGVzU3RhcnQgPSBub2RlUHJvdmlkZXJJbmRleGVzICYgVE5vZGVQcm92aWRlckluZGV4ZXMuUHJvdmlkZXJzU3RhcnRJbmRleE1hc2s7XG4gIGNvbnN0IGRpcmVjdGl2ZXNTdGFydCA9IHROb2RlLmRpcmVjdGl2ZVN0YXJ0O1xuICBjb25zdCBkaXJlY3RpdmVFbmQgPSB0Tm9kZS5kaXJlY3RpdmVFbmQ7XG4gIGNvbnN0IGNwdFZpZXdQcm92aWRlcnNDb3VudCA9XG4gICAgICBub2RlUHJvdmlkZXJJbmRleGVzID4+IFROb2RlUHJvdmlkZXJJbmRleGVzLkNwdFZpZXdQcm92aWRlcnNDb3VudFNoaWZ0O1xuICBjb25zdCBzdGFydGluZ0luZGV4ID1cbiAgICAgIGNhbkFjY2Vzc1ZpZXdQcm92aWRlcnMgPyBpbmplY3RhYmxlc1N0YXJ0IDogaW5qZWN0YWJsZXNTdGFydCArIGNwdFZpZXdQcm92aWRlcnNDb3VudDtcbiAgLy8gV2hlbiB0aGUgaG9zdCBzcGVjaWFsIGNhc2UgYXBwbGllcywgb25seSB0aGUgdmlld1Byb3ZpZGVycyBhbmQgdGhlIGNvbXBvbmVudCBhcmUgdmlzaWJsZVxuICBjb25zdCBlbmRJbmRleCA9IGlzSG9zdFNwZWNpYWxDYXNlID8gaW5qZWN0YWJsZXNTdGFydCArIGNwdFZpZXdQcm92aWRlcnNDb3VudCA6IGRpcmVjdGl2ZUVuZDtcbiAgZm9yIChsZXQgaSA9IHN0YXJ0aW5nSW5kZXg7IGkgPCBlbmRJbmRleDsgaSsrKSB7XG4gICAgY29uc3QgcHJvdmlkZXJUb2tlbk9yRGVmID0gdEluamVjdGFibGVzW2ldIGFzIEluamVjdGlvblRva2VuPGFueT58IFR5cGU8YW55PnwgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgaWYgKGkgPCBkaXJlY3RpdmVzU3RhcnQgJiYgdG9rZW4gPT09IHByb3ZpZGVyVG9rZW5PckRlZiB8fFxuICAgICAgICBpID49IGRpcmVjdGl2ZXNTdGFydCAmJiAocHJvdmlkZXJUb2tlbk9yRGVmIGFzIERpcmVjdGl2ZURlZjxhbnk+KS50eXBlID09PSB0b2tlbikge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIGlmIChpc0hvc3RTcGVjaWFsQ2FzZSkge1xuICAgIGNvbnN0IGRpckRlZiA9IHRJbmplY3RhYmxlc1tkaXJlY3RpdmVzU3RhcnRdIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgIGlmIChkaXJEZWYgJiYgaXNDb21wb25lbnREZWYoZGlyRGVmKSAmJiBkaXJEZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgIHJldHVybiBkaXJlY3RpdmVzU3RhcnQ7XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiogUmV0cmlldmUgb3IgaW5zdGFudGlhdGUgdGhlIGluamVjdGFibGUgZnJvbSB0aGUgYGxEYXRhYCBhdCBwYXJ0aWN1bGFyIGBpbmRleGAuXG4qXG4qIFRoaXMgZnVuY3Rpb24gY2hlY2tzIHRvIHNlZSBpZiB0aGUgdmFsdWUgaGFzIGFscmVhZHkgYmVlbiBpbnN0YW50aWF0ZWQgYW5kIGlmIHNvIHJldHVybnMgdGhlXG4qIGNhY2hlZCBgaW5qZWN0YWJsZWAuIE90aGVyd2lzZSBpZiBpdCBkZXRlY3RzIHRoYXQgdGhlIHZhbHVlIGlzIHN0aWxsIGEgZmFjdG9yeSBpdFxuKiBpbnN0YW50aWF0ZXMgdGhlIGBpbmplY3RhYmxlYCBhbmQgY2FjaGVzIHRoZSB2YWx1ZS5cbiovXG5leHBvcnQgZnVuY3Rpb24gZ2V0Tm9kZUluamVjdGFibGUoXG4gICAgdERhdGE6IFREYXRhLCBsRGF0YTogTFZpZXcsIGluZGV4OiBudW1iZXIsIHROb2RlOiBURWxlbWVudE5vZGUpOiBhbnkge1xuICBsZXQgdmFsdWUgPSBsRGF0YVtpbmRleF07XG4gIGlmIChpc0ZhY3RvcnkodmFsdWUpKSB7XG4gICAgY29uc3QgZmFjdG9yeTogTm9kZUluamVjdG9yRmFjdG9yeSA9IHZhbHVlO1xuICAgIGlmIChmYWN0b3J5LnJlc29sdmluZykge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDaXJjdWxhciBkZXAgZm9yICR7c3RyaW5naWZ5KHREYXRhW2luZGV4XSl9YCk7XG4gICAgfVxuICAgIGNvbnN0IHByZXZpb3VzSW5jbHVkZVZpZXdQcm92aWRlcnMgPSBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhmYWN0b3J5LmNhblNlZVZpZXdQcm92aWRlcnMpO1xuICAgIGZhY3RvcnkucmVzb2x2aW5nID0gdHJ1ZTtcbiAgICBsZXQgcHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbjtcbiAgICBpZiAoZmFjdG9yeS5pbmplY3RJbXBsKSB7XG4gICAgICBwcmV2aW91c0luamVjdEltcGxlbWVudGF0aW9uID0gc2V0SW5qZWN0SW1wbGVtZW50YXRpb24oZmFjdG9yeS5pbmplY3RJbXBsKTtcbiAgICB9XG4gICAgY29uc3Qgc2F2ZVByZXZpb3VzT3JQYXJlbnRUTm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICAgIGNvbnN0IHNhdmVMVmlldyA9IGdldExWaWV3KCk7XG4gICAgc2V0VE5vZGVBbmRWaWV3RGF0YSh0Tm9kZSwgbERhdGEpO1xuICAgIHRyeSB7XG4gICAgICB2YWx1ZSA9IGxEYXRhW2luZGV4XSA9IGZhY3RvcnkuZmFjdG9yeShudWxsLCB0RGF0YSwgbERhdGEsIHROb2RlKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGZhY3RvcnkuaW5qZWN0SW1wbCkgc2V0SW5qZWN0SW1wbGVtZW50YXRpb24ocHJldmlvdXNJbmplY3RJbXBsZW1lbnRhdGlvbik7XG4gICAgICBzZXRJbmNsdWRlVmlld1Byb3ZpZGVycyhwcmV2aW91c0luY2x1ZGVWaWV3UHJvdmlkZXJzKTtcbiAgICAgIGZhY3RvcnkucmVzb2x2aW5nID0gZmFsc2U7XG4gICAgICBzZXRUTm9kZUFuZFZpZXdEYXRhKHNhdmVQcmV2aW91c09yUGFyZW50VE5vZGUsIHNhdmVMVmlldyk7XG4gICAgfVxuICB9XG4gIHJldHVybiB2YWx1ZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT58IHN0cmluZyk6IG51bWJlcnxcbiAgICBGdW5jdGlvbnx1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0b2tlbiwgJ3Rva2VuIG11c3QgYmUgZGVmaW5lZCcpO1xuICBpZiAodHlwZW9mIHRva2VuID09PSAnc3RyaW5nJykge1xuICAgIHJldHVybiB0b2tlbi5jaGFyQ29kZUF0KDApIHx8IDA7XG4gIH1cbiAgY29uc3QgdG9rZW5JZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNUb2tlbihcbiAgICBibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3IHwgVERhdGEpIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUhhc2g7XG4gIGNvbnN0IGI3ID0gYmxvb21IYXNoICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUhhc2ggJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tSGFzaCAmIDB4MjA7XG5cbiAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICBpZiAoYjcpIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA3XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA1XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNF0pO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDNdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAyXSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDFdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXhdKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgcmV0dXJuICEhKHZhbHVlICYgbWFzayk7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgZmxhZ3MgcHJldmVudCBwYXJlbnQgaW5qZWN0b3IgZnJvbSBiZWluZyBzZWFyY2hlZCBmb3IgdG9rZW5zICovXG5mdW5jdGlvbiBzaG91bGRTZWFyY2hQYXJlbnQoZmxhZ3M6IEluamVjdEZsYWdzLCBpc0ZpcnN0SG9zdFROb2RlOiBib29sZWFuKTogYm9vbGVhbnxudW1iZXIge1xuICByZXR1cm4gIShmbGFncyAmIEluamVjdEZsYWdzLlNlbGYpICYmICEoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmIGlzRmlyc3RIb3N0VE5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0SW5qZWN0b3IoKSB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBuZXcgTm9kZUluamVjdG9yKHROb2RlLCBnZXRMVmlldygpKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSwgcHJpdmF0ZSBfbFZpZXc6IExWaWV3KSB7fVxuXG4gIGdldCh0b2tlbjogYW55LCBub3RGb3VuZFZhbHVlPzogYW55KTogYW55IHtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9sVmlldywgdG9rZW4sIHVuZGVmaW5lZCwgbm90Rm91bmRWYWx1ZSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU6IFR5cGU8VD58IG51bGwpID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=