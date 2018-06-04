/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, setCurrentInjector } from '../di/injector';
import { assertGreaterThan, assertLessThan, assertNotNull } from './assert';
import { addToViewTree, assertPreviousIsParent, createLContainer, createLNodeObject, createTNode, createTView, getDirectiveInstance, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { getParentLNode, insertView, removeView } from './node_manipulation';
import { notImplemented, stringify } from './util';
import { EmbeddedViewRef, addDestroyable, createViewRef } from './view_ref';
/**
 * If a directive is diPublic, bloomAdd sets a property on the instance with this constant as
 * the key and the directive's unique ID as the value. This allows us to map directives to their
 * bloom filter bit for DI.
 */
const /** @type {?} */ NG_ELEMENT_ID = '__NG_ELEMENT_ID__';
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
const /** @type {?} */ BLOOM_SIZE = 256;
/**
 * Counter used to generate unique IDs for directives.
 */
let /** @type {?} */ nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param {?} injector The node injector in which the directive should be registered
 * @param {?} type The directive to register
 * @return {?}
 */
export function bloomAdd(injector, type) {
    let /** @type {?} */ id = (/** @type {?} */ (type))[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = (/** @type {?} */ (type))[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    // This means that after 255, some directives will share slots, leading to some false positives
    // when checking for a directive's presence.
    const /** @type {?} */ bloomBit = id % BLOOM_SIZE;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const /** @type {?} */ mask = 1 << bloomBit;
    // Use the raw bloomBit number to determine which bloom filter bucket we should check
    // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
    if (bloomBit < 128) {
        // Then use the mask to flip on the bit (0-31) associated with the directive in that bucket
        bloomBit < 64 ? (bloomBit < 32 ? (injector.bf0 |= mask) : (injector.bf1 |= mask)) :
            (bloomBit < 96 ? (injector.bf2 |= mask) : (injector.bf3 |= mask));
    }
    else {
        bloomBit < 192 ? (bloomBit < 160 ? (injector.bf4 |= mask) : (injector.bf5 |= mask)) :
            (bloomBit < 224 ? (injector.bf6 |= mask) : (injector.bf7 |= mask));
    }
}
/**
 * @return {?}
 */
export function getOrCreateNodeInjector() {
    ngDevMode && assertPreviousIsParent();
    return getOrCreateNodeInjectorForNode(/** @type {?} */ (getPreviousOrParentNode()));
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param {?} node for which an injector should be retrieved / created.
 * @return {?} Node injector
 */
export function getOrCreateNodeInjectorForNode(node) {
    const /** @type {?} */ nodeInjector = node.nodeInjector;
    const /** @type {?} */ parent = getParentLNode(node);
    const /** @type {?} */ parentInjector = parent && parent.nodeInjector;
    if (nodeInjector != parentInjector) {
        return /** @type {?} */ ((nodeInjector));
    }
    return node.nodeInjector = {
        parent: parentInjector,
        node: node,
        bf0: 0,
        bf1: 0,
        bf2: 0,
        bf3: 0,
        bf4: 0,
        bf5: 0,
        bf6: 0,
        bf7: 0,
        cbf0: parentInjector == null ? 0 : parentInjector.cbf0 | parentInjector.bf0,
        cbf1: parentInjector == null ? 0 : parentInjector.cbf1 | parentInjector.bf1,
        cbf2: parentInjector == null ? 0 : parentInjector.cbf2 | parentInjector.bf2,
        cbf3: parentInjector == null ? 0 : parentInjector.cbf3 | parentInjector.bf3,
        cbf4: parentInjector == null ? 0 : parentInjector.cbf4 | parentInjector.bf4,
        cbf5: parentInjector == null ? 0 : parentInjector.cbf5 | parentInjector.bf5,
        cbf6: parentInjector == null ? 0 : parentInjector.cbf6 | parentInjector.bf6,
        cbf7: parentInjector == null ? 0 : parentInjector.cbf7 | parentInjector.bf7,
        templateRef: null,
        viewContainerRef: null,
        elementRef: null,
        changeDetectorRef: null
    };
}
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param {?} di The node injector in which a directive will be added
 * @param {?} def The definition of the directive to be made public
 * @return {?}
 */
export function diPublicInInjector(di, def) {
    bloomAdd(di, def.type);
}
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param {?} def The definition of the directive to be made public
 * @return {?}
 */
export function diPublic(def) {
    diPublicInInjector(getOrCreateNodeInjector(), def);
}
/**
 * @template T
 * @param {?} token
 * @param {?=} flags
 * @return {?}
 */
export function directiveInject(token, flags = 0 /* Default */) {
    return getOrCreateInjectable(getOrCreateNodeInjector(), token, flags);
}
/**
 * Creates an ElementRef and stores it on the injector.
 * Or, if the ElementRef already exists, retrieves the existing ElementRef.
 *
 * @return {?} The ElementRef instance to use
 */
export function injectElementRef() {
    return getOrCreateElementRef(getOrCreateNodeInjector());
}
/**
 * Creates a TemplateRef and stores it on the injector. Or, if the TemplateRef already
 * exists, retrieves the existing TemplateRef.
 *
 * @template T
 * @return {?} The TemplateRef instance to use
 */
export function injectTemplateRef() {
    return getOrCreateTemplateRef(getOrCreateNodeInjector());
}
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @return {?} The ViewContainerRef instance to use
 */
export function injectViewContainerRef() {
    return getOrCreateContainerRef(getOrCreateNodeInjector());
}
/**
 * Returns a ChangeDetectorRef (a.k.a. a ViewRef)
 * @return {?}
 */
export function injectChangeDetectorRef() {
    return getOrCreateChangeDetectorRef(getOrCreateNodeInjector(), null);
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
 * \@experimental
 * @param {?} attrNameToInject
 * @return {?}
 */
export function injectAttribute(attrNameToInject) {
    ngDevMode && assertPreviousIsParent();
    const /** @type {?} */ lElement = /** @type {?} */ (getPreviousOrParentNode());
    ngDevMode && assertNodeType(lElement, 3 /* Element */);
    const /** @type {?} */ tElement = lElement.tNode;
    ngDevMode && assertNotNull(tElement, 'expecting tNode');
    const /** @type {?} */ attrs = tElement.attrs;
    if (attrs) {
        for (let /** @type {?} */ i = 0; i < attrs.length; i = i + 2) {
            const /** @type {?} */ attrName = attrs[i];
            if (attrName === 1 /* SELECT_ONLY */)
                break;
            if (attrName == attrNameToInject) {
                return /** @type {?} */ (attrs[i + 1]);
            }
        }
    }
    return undefined;
}
/**
 * Creates a ViewRef and stores it on the injector as ChangeDetectorRef (public alias).
 * Or, if it already exists, retrieves the existing instance.
 *
 * @param {?} di
 * @param {?} context
 * @return {?} The ChangeDetectorRef to use
 */
export function getOrCreateChangeDetectorRef(di, context) {
    if (di.changeDetectorRef)
        return di.changeDetectorRef;
    const /** @type {?} */ currentNode = di.node;
    if (isComponent(currentNode.tNode)) {
        return di.changeDetectorRef = createViewRef(/** @type {?} */ (currentNode.data), context);
    }
    else if (currentNode.tNode.type === 3 /* Element */) {
        return di.changeDetectorRef = getOrCreateHostChangeDetector(currentNode.view.node);
    }
    return /** @type {?} */ ((null));
}
/**
 * Gets or creates ChangeDetectorRef for the closest host component
 * @param {?} currentNode
 * @return {?}
 */
function getOrCreateHostChangeDetector(currentNode) {
    const /** @type {?} */ hostNode = getClosestComponentAncestor(currentNode);
    const /** @type {?} */ hostInjector = hostNode.nodeInjector;
    const /** @type {?} */ existingRef = hostInjector && hostInjector.changeDetectorRef;
    return existingRef ?
        existingRef :
        createViewRef(/** @type {?} */ (hostNode.data), /** @type {?} */ ((hostNode.view
            .directives))[hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */]);
}
/**
 * If the node is an embedded view, traverses up the view tree to return the closest
 * ancestor view that is attached to a component. If it's already a component node,
 * returns itself.
 * @param {?} node
 * @return {?}
 */
function getClosestComponentAncestor(node) {
    while (node.tNode.type === 2 /* View */) {
        node = node.view.node;
    }
    return /** @type {?} */ (node);
}
/**
 * Searches for an instance of the given directive type up the injector tree and returns
 * that instance if found.
 *
 * Specifically, it gets the bloom filter bit associated with the directive (see bloomHashBit),
 * checks that bit against the bloom filter structure to identify an injector that might have
 * the directive (see bloomFindPossibleInjector), then searches the directives on that injector
 * for a match.
 *
 * If not found, it will propagate up to the next parent injector until the token
 * is found or the top is reached.
 *
 * @template T
 * @param {?} di Node injector where the search should start
 * @param {?} token The directive type to search for
 * @param {?=} flags Injection flags (e.g. CheckParent)
 * @return {?} The instance found
 */
export function getOrCreateInjectable(di, token, flags = 0 /* Default */) {
    const /** @type {?} */ bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic). If there is no hash, fall back to the module injector.
    if (bloomHash === null) {
        const /** @type {?} */ moduleInjector = getPreviousOrParentNode().view.injector;
        const /** @type {?} */ formerInjector = setCurrentInjector(moduleInjector);
        try {
            return inject(token, flags);
        }
        finally {
            setCurrentInjector(formerInjector);
        }
    }
    else {
        let /** @type {?} */ injector = di;
        while (injector) {
            // Get the closest potential matching injector (upwards in the injector tree) that
            // *potentially* has the token.
            injector = bloomFindPossibleInjector(injector, bloomHash, flags);
            // If no injector is found, we *know* that there is no ancestor injector that contains the
            // token, so we abort.
            if (!injector) {
                break;
            }
            // At this point, we have an injector which *may* contain the token, so we step through the
            // directives associated with the injector's corresponding node to get the directive instance.
            const /** @type {?} */ node = injector.node;
            const /** @type {?} */ nodeFlags = node.tNode.flags;
            const /** @type {?} */ count = nodeFlags & 4095 /* DirectiveCountMask */;
            if (count !== 0) {
                const /** @type {?} */ start = nodeFlags >> 13 /* DirectiveStartingIndexShift */;
                const /** @type {?} */ end = start + count;
                const /** @type {?} */ defs = /** @type {?} */ ((node.view.tView.directives));
                for (let /** @type {?} */ i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    const /** @type {?} */ directiveDef = /** @type {?} */ (defs[i]);
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return getDirectiveInstance(/** @type {?} */ ((node.view.directives))[i]);
                    }
                }
            }
            // If we *didn't* find the directive for the token and we are searching the current node's
            // injector, it's possible the directive is on this node and hasn't been created yet.
            let /** @type {?} */ instance;
            if (injector === di && (instance = searchMatchesQueuedForCreation(node, token))) {
                return instance;
            }
            // The def wasn't found anywhere on this node, so it was a false positive.
            // If flags permit, traverse up the tree and continue searching.
            if (flags & 2 /* Self */ || flags & 1 /* Host */ && !sameHostView(injector)) {
                injector = null;
            }
            else {
                injector = injector.parent;
            }
        }
    }
    // No directive was found for the given token.
    if (flags & 8 /* Optional */)
        return null;
    throw new Error(`Injector: NOT_FOUND [${stringify(token)}]`);
}
/**
 * @template T
 * @param {?} node
 * @param {?} token
 * @return {?}
 */
function searchMatchesQueuedForCreation(node, token) {
    const /** @type {?} */ matches = node.view.tView.currentMatches;
    if (matches) {
        for (let /** @type {?} */ i = 0; i < matches.length; i += 2) {
            const /** @type {?} */ def = /** @type {?} */ (matches[i]);
            if (def.type === token) {
                return resolveDirective(def, i + 1, matches, node.view.tView);
            }
        }
    }
    return null;
}
/**
 * Given a directive type, this function returns the bit in an injector's bloom filter
 * that should be used to determine whether or not the directive is present.
 *
 * When the directive was added to the bloom filter, it was given a unique ID that can be
 * retrieved on the class. Since there are only BLOOM_SIZE slots per bloom filter, the directive's
 * ID must be modulo-ed by BLOOM_SIZE to get the correct bloom bit (directives share slots after
 * BLOOM_SIZE is reached).
 *
 * @param {?} type The directive type
 * @return {?} The bloom bit to check for the directive
 */
function bloomHashBit(type) {
    let /** @type {?} */ id = (/** @type {?} */ (type))[NG_ELEMENT_ID];
    return typeof id === 'number' ? id % BLOOM_SIZE : null;
}
/**
 * Finds the closest injector that might have a certain directive.
 *
 * Each directive corresponds to a bit in an injector's bloom filter. Given the bloom bit to
 * check and a starting injector, this function traverses up injectors until it finds an
 * injector that contains a 1 for that bit in its bloom filter. A 1 indicates that the
 * injector may have that directive. It only *may* have the directive because directives begin
 * to share bloom filter bits after the BLOOM_SIZE is reached, and it could correspond to a
 * different directive sharing the bit.
 *
 * Note: We can skip checking further injectors up the tree if an injector's cbf structure
 * has a 0 for that bloom bit. Since cbf contains the merged value of all the parent
 * injectors, a 0 in the bloom bit indicates that the parents definitely do not contain
 * the directive and do not need to be checked.
 *
 * @param {?} startInjector
 * @param {?} bloomBit The bit to check in each injector's bloom filter
 * @param {?} flags The injection flags for this injection site (e.g. Optional or SkipSelf)
 * @return {?} An injector that might have the directive
 */
export function bloomFindPossibleInjector(startInjector, bloomBit, flags) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const /** @type {?} */ mask = 1 << bloomBit;
    // Traverse up the injector tree until we find a potential match or until we know there *isn't* a
    // match.
    let /** @type {?} */ injector = flags & 4 /* SkipSelf */ ? /** @type {?} */ ((startInjector.parent)) : startInjector;
    while (injector) {
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        let /** @type {?} */ value;
        if (bloomBit < 128) {
            value = bloomBit < 64 ? (bloomBit < 32 ? injector.bf0 : injector.bf1) :
                (bloomBit < 96 ? injector.bf2 : injector.bf3);
        }
        else {
            value = bloomBit < 192 ? (bloomBit < 160 ? injector.bf4 : injector.bf5) :
                (bloomBit < 224 ? injector.bf6 : injector.bf7);
        }
        // If the bloom filter value has the bit corresponding to the directive's bloomBit flipped on,
        // this injector is a potential match.
        if ((value & mask) === mask) {
            return injector;
        }
        else if (flags & 2 /* Self */ || flags & 1 /* Host */ && !sameHostView(injector)) {
            return null;
        }
        // If the current injector does not have the directive, check the bloom filters for the ancestor
        // injectors (cbf0 - cbf7). These filters capture *all* ancestor injectors.
        if (bloomBit < 128) {
            value = bloomBit < 64 ? (bloomBit < 32 ? injector.cbf0 : injector.cbf1) :
                (bloomBit < 96 ? injector.cbf2 : injector.cbf3);
        }
        else {
            value = bloomBit < 192 ? (bloomBit < 160 ? injector.cbf4 : injector.cbf5) :
                (bloomBit < 224 ? injector.cbf6 : injector.cbf7);
        }
        // If the ancestor bloom filter value has the bit corresponding to the directive, traverse up to
        // find the specific injector. If the ancestor bloom filter does not have the bit, we can abort.
        injector = (value & mask) ? injector.parent : null;
    }
    return null;
}
/**
 * Checks whether the current injector and its parent are in the same host view.
 *
 * This is necessary to support \@Host() decorators. If \@Host() is set, we should stop searching once
 * the injector and its parent view don't match because it means we'd cross the view boundary.
 * @param {?} injector
 * @return {?}
 */
function sameHostView(injector) {
    return !!injector.parent && injector.parent.node.view === injector.node.view;
}
/**
 * @template T
 */
export class ReadFromInjectorFn {
    /**
     * @param {?} read
     */
    constructor(read) {
        this.read = read;
    }
}
function ReadFromInjectorFn_tsickle_Closure_declarations() {
    /** @type {?} */
    ReadFromInjectorFn.prototype.read;
}
/**
 * Creates an ElementRef for a given node injector and stores it on the injector.
 * Or, if the ElementRef already exists, retrieves the existing ElementRef.
 *
 * @param {?} di The node injector where we should store a created ElementRef
 * @return {?} The ElementRef instance to use
 */
export function getOrCreateElementRef(di) {
    return di.elementRef || (di.elementRef = new ElementRef(di.node.tNode.type === 0 /* Container */ ? null : di.node.native));
}
export const /** @type {?} */ QUERY_READ_TEMPLATE_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateTemplateRef(injector)))));
export const /** @type {?} */ QUERY_READ_CONTAINER_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateContainerRef(injector)))));
export const /** @type {?} */ QUERY_READ_ELEMENT_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateElementRef(injector)))));
export const /** @type {?} */ QUERY_READ_FROM_NODE = (/** @type {?} */ ((new ReadFromInjectorFn((injector, node, directiveIdx) => {
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */);
    if (directiveIdx > -1) {
        return /** @type {?} */ ((node.view.directives))[directiveIdx];
    }
    else if (node.tNode.type === 3 /* Element */) {
        return getOrCreateElementRef(injector);
    }
    else if (node.tNode.type === 0 /* Container */) {
        return getOrCreateTemplateRef(injector);
    }
    throw new Error('fail');
}))));
/**
 * A ref to a node's native element.
 */
class ElementRef {
    /**
     * @param {?} nativeElement
     */
    constructor(nativeElement) { this.nativeElement = nativeElement; }
}
function ElementRef_tsickle_Closure_declarations() {
    /** @type {?} */
    ElementRef.prototype.nativeElement;
}
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @param {?} di
 * @return {?} The ViewContainerRef instance to use
 */
export function getOrCreateContainerRef(di) {
    if (!di.viewContainerRef) {
        const /** @type {?} */ vcRefHost = di.node;
        ngDevMode && assertNodeOfPossibleTypes(vcRefHost, 0 /* Container */, 3 /* Element */);
        const /** @type {?} */ hostParent = /** @type {?} */ ((getParentLNode(vcRefHost)));
        const /** @type {?} */ lContainer = createLContainer(hostParent, vcRefHost.view, undefined, true);
        const /** @type {?} */ lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, undefined, lContainer, null);
        if (vcRefHost.queries) {
            lContainerNode.queries = vcRefHost.queries.container();
        }
        const /** @type {?} */ hostTNode = vcRefHost.tNode;
        if (!hostTNode.dynamicContainerNode) {
            hostTNode.dynamicContainerNode = createTNode(0 /* Container */, -1, null, null, null, null);
        }
        lContainerNode.tNode = hostTNode.dynamicContainerNode;
        vcRefHost.dynamicLContainerNode = lContainerNode;
        addToViewTree(vcRefHost.view, /** @type {?} */ (hostTNode.index), lContainer);
        di.viewContainerRef = new ViewContainerRef(lContainerNode);
    }
    return di.viewContainerRef;
}
/**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
class ViewContainerRef {
    /**
     * @param {?} _lContainerNode
     */
    constructor(_lContainerNode) {
        this._lContainerNode = _lContainerNode;
        this._viewRefs = [];
    }
    /**
     * @return {?}
     */
    clear() {
        const /** @type {?} */ lContainer = this._lContainerNode.data;
        while (lContainer.views.length) {
            this.remove(0);
        }
    }
    /**
     * @param {?} index
     * @return {?}
     */
    get(index) { return this._viewRefs[index] || null; }
    /**
     * @return {?}
     */
    get length() {
        const /** @type {?} */ lContainer = this._lContainerNode.data;
        return lContainer.views.length;
    }
    /**
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) {
        const /** @type {?} */ viewRef = templateRef.createEmbeddedView(context || /** @type {?} */ ({}));
        this.insert(viewRef, index);
        return viewRef;
    }
    /**
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModule
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes, ngModule) {
        throw notImplemented();
    }
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    insert(viewRef, index) {
        const /** @type {?} */ lViewNode = (/** @type {?} */ (viewRef))._lViewNode;
        const /** @type {?} */ adjustedIdx = this._adjustIndex(index);
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
        // invalidate cache of next sibling RNode (we do similar operation in the containerRefreshEnd
        // instruction)
        this._lContainerNode.native = undefined;
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @param {?} newIndex
     * @return {?}
     */
    move(viewRef, newIndex) {
        const /** @type {?} */ index = this.indexOf(viewRef);
        this.detach(index);
        this.insert(viewRef, this._adjustIndex(newIndex));
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @return {?}
     */
    indexOf(viewRef) { return this._viewRefs.indexOf(viewRef); }
    /**
     * @param {?=} index
     * @return {?}
     */
    remove(index) {
        this.detach(index);
        // TODO(ml): proper destroy of the ViewRef, i.e. recursively destroy the LviewNode and its
        // children, delete DOM nodes and QueryList, trigger hooks (onDestroy), destroy the renderer,
        // detach projected nodes
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        const /** @type {?} */ adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainerNode, adjustedIdx);
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    }
    /**
     * @param {?=} index
     * @param {?=} shift
     * @return {?}
     */
    _adjustIndex(index, shift = 0) {
        if (index == null) {
            return this._lContainerNode.data.views.length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, 'index must be positive');
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this._lContainerNode.data.views.length + 1 + shift, 'index');
        }
        return index;
    }
}
function ViewContainerRef_tsickle_Closure_declarations() {
    /** @type {?} */
    ViewContainerRef.prototype._viewRefs;
    /** @type {?} */
    ViewContainerRef.prototype.element;
    /** @type {?} */
    ViewContainerRef.prototype.injector;
    /** @type {?} */
    ViewContainerRef.prototype.parentInjector;
    /** @type {?} */
    ViewContainerRef.prototype._lContainerNode;
}
/**
 * Creates a TemplateRef and stores it on the injector. Or, if the TemplateRef already
 * exists, retrieves the existing TemplateRef.
 *
 * @template T
 * @param {?} di The node injector where we should store a created TemplateRef
 * @return {?} The TemplateRef instance to use
 */
export function getOrCreateTemplateRef(di) {
    if (!di.templateRef) {
        ngDevMode && assertNodeType(di.node, 0 /* Container */);
        const /** @type {?} */ hostNode = /** @type {?} */ (di.node);
        const /** @type {?} */ hostTNode = hostNode.tNode;
        const /** @type {?} */ hostTView = hostNode.view.tView;
        if (!hostTNode.tViews) {
            hostTNode.tViews = createTView(-1, hostTView.directiveRegistry, hostTView.pipeRegistry);
        }
        ngDevMode && assertNotNull(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), /** @type {?} */ (hostTNode.tViews), /** @type {?} */ ((hostNode.data.template)), getRenderer(), hostNode.data.queries);
    }
    return di.templateRef;
}
/**
 * @template T
 */
class TemplateRef {
    /**
     * @param {?} elementRef
     * @param {?} _tView
     * @param {?} _template
     * @param {?} _renderer
     * @param {?} _queries
     */
    constructor(elementRef, _tView, _template, _renderer, _queries) {
        this._tView = _tView;
        this._template = _template;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        const /** @type {?} */ viewNode = renderEmbeddedTemplate(null, this._tView, this._template, context, this._renderer, this._queries);
        return addDestroyable(new EmbeddedViewRef(viewNode, this._template, context));
    }
}
function TemplateRef_tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateRef.prototype.elementRef;
    /** @type {?} */
    TemplateRef.prototype._tView;
    /** @type {?} */
    TemplateRef.prototype._template;
    /** @type {?} */
    TemplateRef.prototype._renderer;
    /** @type {?} */
    TemplateRef.prototype._queries;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUF3QixNQUFNLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQVNqRixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsYUFBYSxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBT3ZQLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLGNBQWMsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFDLE1BQU0scUJBQXFCLENBQUM7QUFDM0UsT0FBTyxFQUFDLGNBQWMsRUFBRSxTQUFTLEVBQUMsTUFBTSxRQUFRLENBQUM7QUFDakQsT0FBTyxFQUFDLGVBQWUsRUFBVyxjQUFjLEVBQUUsYUFBYSxFQUFDLE1BQU0sWUFBWSxDQUFDOzs7Ozs7QUFTbkYsdUJBQU0sYUFBYSxHQUFHLG1CQUFtQixDQUFDOzs7Ozs7QUFPMUMsdUJBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQzs7OztBQUd2QixxQkFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDOzs7Ozs7Ozs7QUFTeEIsTUFBTSxtQkFBbUIsUUFBbUIsRUFBRSxJQUFlO0lBQzNELHFCQUFJLEVBQUUsR0FBcUIsbUJBQUMsSUFBVyxFQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7OztJQUl4RCxJQUFJLEVBQUUsSUFBSSxJQUFJLEVB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QUFVLEdBQUcsVUFBVSxDQUFDO0tBQzlCOzs7OztJQUVELGtCQUFrQixDQUFDLE9BQVU7UUFDM0IsdUJBQU0sUUFBUSxHQUFHLHNCQUFzQixDQUNuQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRSxPQUFPLGNBQWMsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQy9FO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiBhcyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiBhcyB2aWV3RW5naW5lX1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVMTm9kZU9iamVjdCwgY3JlYXRlVE5vZGUsIGNyZWF0ZVRWaWV3LCBnZXREaXJlY3RpdmVJbnN0YW5jZSwgZ2V0UHJldmlvdXNPclBhcmVudE5vZGUsIGdldFJlbmRlcmVyLCBpc0NvbXBvbmVudCwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSwgcmVzb2x2ZURpcmVjdGl2ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFZpZXdOb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7Z2V0UGFyZW50TE5vZGUsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtub3RJbXBsZW1lbnRlZCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYsIGFkZERlc3Ryb3lhYmxlLCBjcmVhdGVWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogSWYgYSBkaXJlY3RpdmUgaXMgZGlQdWJsaWMsIGJsb29tQWRkIHNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgaW5zdGFuY2Ugd2l0aCB0aGlzIGNvbnN0YW50IGFzXG4gKiB0aGUga2V5IGFuZCB0aGUgZGlyZWN0aXZlJ3MgdW5pcXVlIElEIGFzIHRoZSB2YWx1ZS4gVGhpcyBhbGxvd3MgdXMgdG8gbWFwIGRpcmVjdGl2ZXMgdG8gdGhlaXJcbiAqIGJsb29tIGZpbHRlciBiaXQgZm9yIERJLlxuICovXG5jb25zdCBOR19FTEVNRU5UX0lEID0gJ19fTkdfRUxFTUVOVF9JRF9fJztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIHRoZSBkaXJlY3RpdmUgc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9yOiBMSW5qZWN0b3IsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICAvLyBUaGlzIG1lYW5zIHRoYXQgYWZ0ZXIgMjU1LCBzb21lIGRpcmVjdGl2ZXMgd2lsbCBzaGFyZSBzbG90cywgbGVhZGluZyB0byBzb21lIGZhbHNlIHBvc2l0aXZlc1xuICAvLyB3aGVuIGNoZWNraW5nIGZvciBhIGRpcmVjdGl2ZSdzIHByZXNlbmNlLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICUgQkxPT01fU0laRTtcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAvLyBUaGVuIHVzZSB0aGUgbWFzayB0byBmbGlwIG9uIHRoZSBiaXQgKDAtMzEpIGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIGluIHRoYXQgYnVja2V0XG4gICAgYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gKGluamVjdG9yLmJmMCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjEgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyAoaW5qZWN0b3IuYmYyIHw9IG1hc2spIDogKGluamVjdG9yLmJmMyB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyAoaW5qZWN0b3IuYmY0IHw9IG1hc2spIDogKGluamVjdG9yLmJmNSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gKGluamVjdG9yLmJmNiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjcgfD0gbWFzaykpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpOiBMSW5qZWN0b3Ige1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBub2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk6IExJbmplY3RvciB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IG5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnQgJiYgcGFyZW50Lm5vZGVJbmplY3RvcjtcbiAgaWYgKG5vZGVJbmplY3RvciAhPSBwYXJlbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBub2RlSW5qZWN0b3IgITtcbiAgfVxuICByZXR1cm4gbm9kZS5ub2RlSW5qZWN0b3IgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRJbmplY3RvcixcbiAgICBub2RlOiBub2RlLFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGxcbiAgfTtcbn1cblxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoZGk6IExJbmplY3RvciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIGRlZik7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBOT1RFOiB1c2UgYGRpcmVjdGl2ZUluamVjdGAgd2l0aCBgQERpcmVjdGl2ZWAsIGBAQ29tcG9uZW50YCwgYW5kIGBAUGlwZWAuIEZvclxuICogYWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgRE9NIHJlbmRlciB0cmVlLlxuICpcbiAqIEBwYXJhbSB0b2tlbiBUaGUgZGlyZWN0aXZlIHR5cGUgdG8gc2VhcmNoIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFncyAoZS5nLiBDaGVja1BhcmVudClcbiAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncy5PcHRpb25hbCk6IFR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBsRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUobEVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgdEVsZW1lbnQgPSBsRWxlbWVudC50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwodEVsZW1lbnQsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0RWxlbWVudC5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNFTEVDVF9PTkxZKSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICogT3IsIGlmIGl0IGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIGluc3RhbmNlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoXG4gICAgZGk6IExJbmplY3RvciwgY29udGV4dDogYW55KTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChkaS5jaGFuZ2VEZXRlY3RvclJlZikgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIGNvbnN0IGN1cnJlbnROb2RlID0gZGkubm9kZTtcbiAgaWYgKGlzQ29tcG9uZW50KGN1cnJlbnROb2RlLnROb2RlKSkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGNyZWF0ZVZpZXdSZWYoY3VycmVudE5vZGUuZGF0YSBhcyBMVmlldywgY29udGV4dCk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZS52aWV3Lm5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTpcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3IoY3VycmVudE5vZGUpO1xuICBjb25zdCBob3N0SW5qZWN0b3IgPSBob3N0Tm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IGV4aXN0aW5nUmVmID0gaG9zdEluamVjdG9yICYmIGhvc3RJbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICByZXR1cm4gZXhpc3RpbmdSZWYgP1xuICAgICAgZXhpc3RpbmdSZWYgOlxuICAgICAgY3JlYXRlVmlld1JlZihcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhIGFzIExWaWV3LFxuICAgICAgICAgIGhvc3ROb2RlLnZpZXdcbiAgICAgICAgICAgICAgLmRpcmVjdGl2ZXMgIVtob3N0Tm9kZS50Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdF0pO1xufVxuXG4vKipcbiAqIElmIHRoZSBub2RlIGlzIGFuIGVtYmVkZGVkIHZpZXcsIHRyYXZlcnNlcyB1cCB0aGUgdmlldyB0cmVlIHRvIHJldHVybiB0aGUgY2xvc2VzdFxuICogYW5jZXN0b3IgdmlldyB0aGF0IGlzIGF0dGFjaGVkIHRvIGEgY29tcG9uZW50LiBJZiBpdCdzIGFscmVhZHkgYSBjb21wb25lbnQgbm9kZSxcbiAqIHJldHVybnMgaXRzZWxmLlxuICovXG5mdW5jdGlvbiBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3Iobm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTogTEVsZW1lbnROb2RlIHtcbiAgd2hpbGUgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBub2RlID0gbm9kZS52aWV3Lm5vZGU7XG4gIH1cbiAgcmV0dXJuIG5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gZGlyZWN0aXZlIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogU3BlY2lmaWNhbGx5LCBpdCBnZXRzIHRoZSBibG9vbSBmaWx0ZXIgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIChzZWUgYmxvb21IYXNoQml0KSxcbiAqIGNoZWNrcyB0aGF0IGJpdCBhZ2FpbnN0IHRoZSBibG9vbSBmaWx0ZXIgc3RydWN0dXJlIHRvIGlkZW50aWZ5IGFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZVxuICogdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IpLCB0aGVuIHNlYXJjaGVzIHRoZSBkaXJlY3RpdmVzIG9uIHRoYXQgaW5qZWN0b3JcbiAqIGZvciBhIG1hdGNoLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIEBwYXJhbSBkaSBOb2RlIGluamVjdG9yIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gdG9rZW4gVGhlIGRpcmVjdGl2ZSB0eXBlIHRvIHNlYXJjaCBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3MgKGUuZy4gQ2hlY2tQYXJlbnQpXG4gKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICBkaTogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdCh0b2tlbik7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKS4gSWYgdGhlcmUgaXMgbm8gaGFzaCwgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggPT09IG51bGwpIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkudmlldy5pbmplY3RvcjtcbiAgICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBpbmplY3QodG9rZW4sIGZsYWdzKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKGZvcm1lckluamVjdG9yKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9IGRpO1xuXG4gICAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgICAvLyBHZXQgdGhlIGNsb3Nlc3QgcG90ZW50aWFsIG1hdGNoaW5nIGluamVjdG9yICh1cHdhcmRzIGluIHRoZSBpbmplY3RvciB0cmVlKSB0aGF0XG4gICAgICAvLyAqcG90ZW50aWFsbHkqIGhhcyB0aGUgdG9rZW4uXG4gICAgICBpbmplY3RvciA9IGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoaW5qZWN0b3IsIGJsb29tSGFzaCwgZmxhZ3MpO1xuXG4gICAgICAvLyBJZiBubyBpbmplY3RvciBpcyBmb3VuZCwgd2UgKmtub3cqIHRoYXQgdGhlcmUgaXMgbm8gYW5jZXN0b3IgaW5qZWN0b3IgdGhhdCBjb250YWlucyB0aGVcbiAgICAgIC8vIHRva2VuLCBzbyB3ZSBhYm9ydC5cbiAgICAgIGlmICghaW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IG5vZGUgPSBpbmplY3Rvci5ub2RlO1xuICAgICAgY29uc3Qgbm9kZUZsYWdzID0gbm9kZS50Tm9kZS5mbGFncztcbiAgICAgIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICAgICAgY29uc3QgZGVmcyA9IG5vZGUudmlldy50Vmlldy5kaXJlY3RpdmVzICE7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGRlZmluaXRpb24gZm9yIHRoZSBkaXJlY3RpdmUgYXQgdGhpcyBpbmRleCBhbmQsIGlmIGl0IGlzIGluamVjdGFibGUgKGRpUHVibGljKSxcbiAgICAgICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXREaXJlY3RpdmVJbnN0YW5jZShub2RlLnZpZXcuZGlyZWN0aXZlcyAhW2ldKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgKmRpZG4ndCogZmluZCB0aGUgZGlyZWN0aXZlIGZvciB0aGUgdG9rZW4gYW5kIHdlIGFyZSBzZWFyY2hpbmcgdGhlIGN1cnJlbnQgbm9kZSdzXG4gICAgICAvLyBpbmplY3RvciwgaXQncyBwb3NzaWJsZSB0aGUgZGlyZWN0aXZlIGlzIG9uIHRoaXMgbm9kZSBhbmQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG4gICAgICBsZXQgaW5zdGFuY2U6IFR8bnVsbDtcbiAgICAgIGlmIChpbmplY3RvciA9PT0gZGkgJiYgKGluc3RhbmNlID0gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGUsIHRva2VuKSkpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgLy8gSWYgZmxhZ3MgcGVybWl0LCB0cmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgICAgaW5qZWN0b3IgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gTm8gZGlyZWN0aXZlIHdhcyBmb3VuZCBmb3IgdGhlIGdpdmVuIHRva2VuLlxuICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5PcHRpb25hbCkgcmV0dXJuIG51bGw7XG4gIHRocm93IG5ldyBFcnJvcihgSW5qZWN0b3I6IE5PVF9GT1VORCBbJHtzdHJpbmdpZnkodG9rZW4pfV1gKTtcbn1cblxuZnVuY3Rpb24gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGU6IExOb2RlLCB0b2tlbjogYW55KTogVHxudWxsIHtcbiAgY29uc3QgbWF0Y2hlcyA9IG5vZGUudmlldy50Vmlldy5jdXJyZW50TWF0Y2hlcztcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlRGlyZWN0aXZlKGRlZiwgaSArIDEsIG1hdGNoZXMsIG5vZGUudmlldy50Vmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgZGlyZWN0aXZlIHR5cGUsIHRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0aGUgZGlyZWN0aXZlIGlzIHByZXNlbnQuXG4gKlxuICogV2hlbiB0aGUgZGlyZWN0aXZlIHdhcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyLCBpdCB3YXMgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgY2xhc3MuIFNpbmNlIHRoZXJlIGFyZSBvbmx5IEJMT09NX1NJWkUgc2xvdHMgcGVyIGJsb29tIGZpbHRlciwgdGhlIGRpcmVjdGl2ZSdzXG4gKiBJRCBtdXN0IGJlIG1vZHVsby1lZCBieSBCTE9PTV9TSVpFIHRvIGdldCB0aGUgY29ycmVjdCBibG9vbSBiaXQgKGRpcmVjdGl2ZXMgc2hhcmUgc2xvdHMgYWZ0ZXJcbiAqIEJMT09NX1NJWkUgaXMgcmVhY2hlZCkuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0eXBlXG4gKiBAcmV0dXJucyBUaGUgYmxvb20gYml0IHRvIGNoZWNrIGZvciB0aGUgZGlyZWN0aXZlXG4gKi9cbmZ1bmN0aW9uIGJsb29tSGFzaEJpdCh0eXBlOiBUeXBlPGFueT4pOiBudW1iZXJ8bnVsbCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgJSBCTE9PTV9TSVpFIDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2xvc2VzdCBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgYSBjZXJ0YWluIGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBjb3JyZXNwb25kcyB0byBhIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci4gR2l2ZW4gdGhlIGJsb29tIGJpdCB0b1xuICogY2hlY2sgYW5kIGEgc3RhcnRpbmcgaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gdHJhdmVyc2VzIHVwIGluamVjdG9ycyB1bnRpbCBpdCBmaW5kcyBhblxuICogaW5qZWN0b3IgdGhhdCBjb250YWlucyBhIDEgZm9yIHRoYXQgYml0IGluIGl0cyBibG9vbSBmaWx0ZXIuIEEgMSBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAqIGluamVjdG9yIG1heSBoYXZlIHRoYXQgZGlyZWN0aXZlLiBJdCBvbmx5ICptYXkqIGhhdmUgdGhlIGRpcmVjdGl2ZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYmVnaW5cbiAqIHRvIHNoYXJlIGJsb29tIGZpbHRlciBiaXRzIGFmdGVyIHRoZSBCTE9PTV9TSVpFIGlzIHJlYWNoZWQsIGFuZCBpdCBjb3VsZCBjb3JyZXNwb25kIHRvIGFcbiAqIGRpZmZlcmVudCBkaXJlY3RpdmUgc2hhcmluZyB0aGUgYml0LlxuICpcbiAqIE5vdGU6IFdlIGNhbiBza2lwIGNoZWNraW5nIGZ1cnRoZXIgaW5qZWN0b3JzIHVwIHRoZSB0cmVlIGlmIGFuIGluamVjdG9yJ3MgY2JmIHN0cnVjdHVyZVxuICogaGFzIGEgMCBmb3IgdGhhdCBibG9vbSBiaXQuIFNpbmNlIGNiZiBjb250YWlucyB0aGUgbWVyZ2VkIHZhbHVlIG9mIGFsbCB0aGUgcGFyZW50XG4gKiBpbmplY3RvcnMsIGEgMCBpbiB0aGUgYmxvb20gYml0IGluZGljYXRlcyB0aGF0IHRoZSBwYXJlbnRzIGRlZmluaXRlbHkgZG8gbm90IGNvbnRhaW5cbiAqIHRoZSBkaXJlY3RpdmUgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIGNoZWNrZWQuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBzdGFydGluZyBub2RlIGluamVjdG9yIHRvIGNoZWNrXG4gKiBAcGFyYW0gIGJsb29tQml0IFRoZSBiaXQgdG8gY2hlY2sgaW4gZWFjaCBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogQHBhcmFtICBmbGFncyBUaGUgaW5qZWN0aW9uIGZsYWdzIGZvciB0aGlzIGluamVjdGlvbiBzaXRlIChlLmcuIE9wdGlvbmFsIG9yIFNraXBTZWxmKVxuICogQHJldHVybnMgQW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIHRoZSBkaXJlY3RpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoXG4gICAgc3RhcnRJbmplY3RvcjogTEluamVjdG9yLCBibG9vbUJpdDogbnVtYmVyLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBMSW5qZWN0b3J8bnVsbCB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlICppc24ndCogYVxuICAvLyBtYXRjaC5cbiAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9XG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmID8gc3RhcnRJbmplY3Rvci5wYXJlbnQgISA6IHN0YXJ0SW5qZWN0b3I7XG4gIHdoaWxlIChpbmplY3Rvcikge1xuICAgIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAgIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAgIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG4gICAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IGluamVjdG9yLmJmMCA6IGluamVjdG9yLmJmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5iZjIgOiBpbmplY3Rvci5iZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuYmY0IDogaW5qZWN0b3IuYmY1KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gaW5qZWN0b3IuYmY2IDogaW5qZWN0b3IuYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gICAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgICBpZiAoKHZhbHVlICYgbWFzaykgPT09IG1hc2spIHtcbiAgICAgIHJldHVybiBpbmplY3RvcjtcbiAgICB9IGVsc2UgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGluamVjdG9yIGRvZXMgbm90IGhhdmUgdGhlIGRpcmVjdGl2ZSwgY2hlY2sgdGhlIGJsb29tIGZpbHRlcnMgZm9yIHRoZSBhbmNlc3RvclxuICAgIC8vIGluamVjdG9ycyAoY2JmMCAtIGNiZjcpLiBUaGVzZSBmaWx0ZXJzIGNhcHR1cmUgKmFsbCogYW5jZXN0b3IgaW5qZWN0b3JzLlxuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5jYmYwIDogaW5qZWN0b3IuY2JmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5jYmYyIDogaW5qZWN0b3IuY2JmMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyBpbmplY3Rvci5jYmY0IDogaW5qZWN0b3IuY2JmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmNiZjYgOiBpbmplY3Rvci5jYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSwgdHJhdmVyc2UgdXAgdG9cbiAgICAvLyBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlIGNhbiBhYm9ydC5cbiAgICBpbmplY3RvciA9ICh2YWx1ZSAmIG1hc2spID8gaW5qZWN0b3IucGFyZW50IDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBpbmplY3RvciBhbmQgaXRzIHBhcmVudCBhcmUgaW4gdGhlIHNhbWUgaG9zdCB2aWV3LlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHN1cHBvcnQgQEhvc3QoKSBkZWNvcmF0b3JzLiBJZiBASG9zdCgpIGlzIHNldCwgd2Ugc2hvdWxkIHN0b3Agc2VhcmNoaW5nIG9uY2VcbiAqIHRoZSBpbmplY3RvciBhbmQgaXRzIHBhcmVudCB2aWV3IGRvbid0IG1hdGNoIGJlY2F1c2UgaXQgbWVhbnMgd2UnZCBjcm9zcyB0aGUgdmlldyBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gc2FtZUhvc3RWaWV3KGluamVjdG9yOiBMSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaW5qZWN0b3IucGFyZW50ICYmIGluamVjdG9yLnBhcmVudC5ub2RlLnZpZXcgPT09IGluamVjdG9yLm5vZGUudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSW5kZXg/OiBudW1iZXIpID0+IFQpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZvciBhIGdpdmVuIG5vZGUgaW5qZWN0b3IgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBFbGVtZW50UmVmXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGRpLmVsZW1lbnRSZWYgfHwgKGRpLmVsZW1lbnRSZWYgPSBuZXcgRWxlbWVudFJlZihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkaS5ub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIgPyBudWxsIDogZGkubm9kZS5uYXRpdmUpKTtcbn1cblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfVEVNUExBVEVfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+Pj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0NPTlRBSU5FUl9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0VMRU1FTlRfUkVGID1cbiAgICA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX0VsZW1lbnRSZWY+PihuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfRWxlbWVudFJlZj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9GUk9NX05PREUgPVxuICAgIChuZXcgUmVhZEZyb21JbmplY3RvckZuPGFueT4oKGluamVjdG9yOiBMSW5qZWN0b3IsIG5vZGU6IExOb2RlLCBkaXJlY3RpdmVJZHg6IG51bWJlcikgPT4ge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMobm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUlkeCA+IC0xKSB7XG4gICAgICAgIHJldHVybiBub2RlLnZpZXcuZGlyZWN0aXZlcyAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKTtcbiAgICB9KSBhcyBhbnkgYXMgUXVlcnlSZWFkVHlwZTxhbnk+KTtcblxuLyoqIEEgcmVmIHRvIGEgbm9kZSdzIG5hdGl2ZSBlbGVtZW50LiAqL1xuY2xhc3MgRWxlbWVudFJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh2Y1JlZkhvc3QsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBjb25zdCBob3N0UGFyZW50ID0gZ2V0UGFyZW50TE5vZGUodmNSZWZIb3N0KSAhO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGhvc3RQYXJlbnQsIHZjUmVmSG9zdC52aWV3LCB1bmRlZmluZWQsIHRydWUpO1xuICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgICAgICBUTm9kZVR5cGUuQ29udGFpbmVyLCB2Y1JlZkhvc3QudmlldywgaG9zdFBhcmVudCwgdW5kZWZpbmVkLCBsQ29udGFpbmVyLCBudWxsKTtcblxuXG4gICAgaWYgKHZjUmVmSG9zdC5xdWVyaWVzKSB7XG4gICAgICBsQ29udGFpbmVyTm9kZS5xdWVyaWVzID0gdmNSZWZIb3N0LnF1ZXJpZXMuY29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFROb2RlID0gdmNSZWZIb3N0LnROb2RlO1xuICAgIGlmICghaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSB7XG4gICAgICBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPSBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCAtMSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgbENvbnRhaW5lck5vZGUudE5vZGUgPSBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGU7XG4gICAgdmNSZWZIb3N0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSA9IGxDb250YWluZXJOb2RlO1xuXG4gICAgYWRkVG9WaWV3VHJlZSh2Y1JlZkhvc3QudmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG5cbiAgICBkaS52aWV3Q29udGFpbmVyUmVmID0gbmV3IFZpZXdDb250YWluZXJSZWYobENvbnRhaW5lck5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGRpLnZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogQSByZWYgdG8gYSBjb250YWluZXIgdGhhdCBlbmFibGVzIGFkZGluZyBhbmQgcmVtb3Zpbmcgdmlld3MgZnJvbSB0aGF0IGNvbnRhaW5lclxuICogaW1wZXJhdGl2ZWx5LlxuICovXG5jbGFzcyBWaWV3Q29udGFpbmVyUmVmIGltcGxlbWVudHMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG4gIGVsZW1lbnQ6IHZpZXdFbmdpbmVfRWxlbWVudFJlZjtcbiAgaW5qZWN0b3I6IEluamVjdG9yO1xuICBwYXJlbnRJbmplY3RvcjogSW5qZWN0b3I7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlKSB7fVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHdoaWxlIChsQ29udGFpbmVyLnZpZXdzLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW1vdmUoMCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KGluZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7IHJldHVybiB0aGlzLl92aWV3UmVmc1tpbmRleF0gfHwgbnVsbDsgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICByZXR1cm4gbENvbnRhaW5lci52aWV3cy5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3Qgdmlld1JlZiA9IHRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0IHx8IDxhbnk+e30pO1xuICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIGluZGV4KTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICB0aHJvdyBub3RJbXBsZW1lbnRlZCgpO1xuICB9XG5cbiAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGNvbnN0IGxWaWV3Tm9kZSA9ICh2aWV3UmVmIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5fbFZpZXdOb2RlO1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgaW5zZXJ0Vmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgbFZpZXdOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgLy8gaW52YWxpZGF0ZSBjYWNoZSBvZiBuZXh0IHNpYmxpbmcgUk5vZGUgKHdlIGRvIHNpbWlsYXIgb3BlcmF0aW9uIGluIHRoZSBjb250YWluZXJSZWZyZXNoRW5kXG4gICAgLy8gaW5zdHJ1Y3Rpb24pXG4gICAgdGhpcy5fbENvbnRhaW5lck5vZGUubmF0aXZlID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICAvLyBUT0RPKG1sKTogcHJvcGVyIGRlc3Ryb3kgb2YgdGhlIFZpZXdSZWYsIGkuZS4gcmVjdXJzaXZlbHkgZGVzdHJveSB0aGUgTHZpZXdOb2RlIGFuZCBpdHNcbiAgICAvLyBjaGlsZHJlbiwgZGVsZXRlIERPTSBub2RlcyBhbmQgUXVlcnlMaXN0LCB0cmlnZ2VyIGhvb2tzIChvbkRlc3Ryb3kpLCBkZXN0cm95IHRoZSByZW5kZXJlcixcbiAgICAvLyBkZXRhY2ggcHJvamVjdGVkIG5vZGVzXG4gIH1cblxuICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhLnZpZXdzLmxlbmd0aCArIHNoaWZ0O1xuICAgIH1cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdpbmRleCBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YS52aWV3cy5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIFRlbXBsYXRlUmVmXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgaWYgKCFkaS50ZW1wbGF0ZVJlZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShkaS5ub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBob3N0Tm9kZSA9IGRpLm5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gaG9zdE5vZGUudE5vZGU7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdE5vZGUudmlldy50VmlldztcbiAgICBpZiAoIWhvc3RUTm9kZS50Vmlld3MpIHtcbiAgICAgIGhvc3RUTm9kZS50Vmlld3MgPSBjcmVhdGVUVmlldygtMSwgaG9zdFRWaWV3LmRpcmVjdGl2ZVJlZ2lzdHJ5LCBob3N0VFZpZXcucGlwZVJlZ2lzdHJ5KTtcbiAgICB9XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vdE51bGwoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgZGkudGVtcGxhdGVSZWYgPSBuZXcgVGVtcGxhdGVSZWY8YW55PihcbiAgICAgICAgZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpKSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldywgaG9zdE5vZGUuZGF0YS50ZW1wbGF0ZSAhLFxuICAgICAgICBnZXRSZW5kZXJlcigpLCBob3N0Tm9kZS5kYXRhLnF1ZXJpZXMpO1xuICB9XG4gIHJldHVybiBkaS50ZW1wbGF0ZVJlZjtcbn1cblxuY2xhc3MgVGVtcGxhdGVSZWY8VD4gaW1wbGVtZW50cyB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmVhZG9ubHkgZWxlbWVudFJlZjogdmlld0VuZ2luZV9FbGVtZW50UmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZWxlbWVudFJlZjogdmlld0VuZ2luZV9FbGVtZW50UmVmLCBwcml2YXRlIF90VmlldzogVFZpZXcsXG4gICAgICBwcml2YXRlIF90ZW1wbGF0ZTogQ29tcG9uZW50VGVtcGxhdGU8VD4sIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjMsXG4gICAgICBwcml2YXRlIF9xdWVyaWVzOiBMUXVlcmllc3xudWxsKSB7XG4gICAgdGhpcy5lbGVtZW50UmVmID0gZWxlbWVudFJlZjtcbiAgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0OiBUKTogdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgIGNvbnN0IHZpZXdOb2RlID0gcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShcbiAgICAgICAgbnVsbCwgdGhpcy5fdFZpZXcsIHRoaXMuX3RlbXBsYXRlLCBjb250ZXh0LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgcmV0dXJuIGFkZERlc3Ryb3lhYmxlKG5ldyBFbWJlZGRlZFZpZXdSZWYodmlld05vZGUsIHRoaXMuX3RlbXBsYXRlLCBjb250ZXh0KSk7XG4gIH1cbn1cbiJdfQ==