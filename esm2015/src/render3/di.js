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
import { addToViewTree, assertPreviousIsParent, createLContainer, createLNodeObject, createTView, getDirectiveInstance, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { insertView, removeView } from './node_manipulation';
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
    const /** @type {?} */ parentInjector = node.parent && node.parent.nodeInjector;
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
 * @param {?} attrName
 * @return {?}
 */
export function injectAttribute(attrName) {
    ngDevMode && assertPreviousIsParent();
    const /** @type {?} */ lElement = /** @type {?} */ (getPreviousOrParentNode());
    ngDevMode && assertNodeType(lElement, 3 /* Element */);
    const /** @type {?} */ tElement = /** @type {?} */ ((lElement.tNode));
    ngDevMode && assertNotNull(tElement, 'expecting tNode');
    const /** @type {?} */ attrs = tElement.attrs;
    if (attrs) {
        for (let /** @type {?} */ i = 0; i < attrs.length; i = i + 2) {
            if (attrs[i] == attrName) {
                return attrs[i + 1];
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
    if (isComponent(/** @type {?} */ ((currentNode.tNode)))) {
        return di.changeDetectorRef = createViewRef(/** @type {?} */ (currentNode.data), context);
    }
    else if (currentNode.type === 3 /* Element */) {
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
            .directives))[/** @type {?} */ ((hostNode.tNode)).flags >> 13 /* DirectiveStartingIndexShift */]);
}
/**
 * If the node is an embedded view, traverses up the view tree to return the closest
 * ancestor view that is attached to a component. If it's already a component node,
 * returns itself.
 * @param {?} node
 * @return {?}
 */
function getClosestComponentAncestor(node) {
    while (node.type === 2 /* View */) {
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
            const /** @type {?} */ nodeFlags = /** @type {?} */ ((node.tNode)).flags;
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
    return di.elementRef || (di.elementRef = new ElementRef(di.node.type === 0 /* Container */ ? null : di.node.native));
}
export const /** @type {?} */ QUERY_READ_TEMPLATE_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateTemplateRef(injector)))));
export const /** @type {?} */ QUERY_READ_CONTAINER_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateContainerRef(injector)))));
export const /** @type {?} */ QUERY_READ_ELEMENT_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateElementRef(injector)))));
export const /** @type {?} */ QUERY_READ_FROM_NODE = (/** @type {?} */ ((new ReadFromInjectorFn((injector, node, directiveIdx) => {
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */);
    if (directiveIdx > -1) {
        return /** @type {?} */ ((node.view.directives))[directiveIdx];
    }
    else if (node.type === 3 /* Element */) {
        return getOrCreateElementRef(injector);
    }
    else if (node.type === 0 /* Container */) {
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
        const /** @type {?} */ lContainer = createLContainer(/** @type {?} */ ((vcRefHost.parent)), vcRefHost.view);
        const /** @type {?} */ lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, /** @type {?} */ ((vcRefHost.parent)), undefined, lContainer, null);
        vcRefHost.dynamicLContainerNode = lContainerNode;
        addToViewTree(vcRefHost.view, lContainer);
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
        (/** @type {?} */ (lViewNode)).parent = this._lContainerNode;
        // If the view is dynamic (has a template), it needs to be counted both at the container
        // level and at the node above the container.
        if (lViewNode.data.template !== null) {
            // Increment the container view count.
            this._lContainerNode.data.dynamicViewCount++;
            // Look for the parent node and increment its dynamic view count.
            if (this._lContainerNode.parent !== null && this._lContainerNode.parent.data !== null) {
                ngDevMode && assertNodeOfPossibleTypes(this._lContainerNode.parent, 2 /* View */, 3 /* Element */);
                this._lContainerNode.parent.data.dynamicViewCount++;
            }
        }
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
        const /** @type {?} */ hostTNode = /** @type {?} */ ((hostNode.tNode));
        const /** @type {?} */ hostTView = hostNode.view.tView;
        if (!hostTNode.tViews) {
            hostTNode.tViews = createTView(hostTView.directiveRegistry, hostTView.pipeRegistry);
        }
        ngDevMode && assertNotNull(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), /** @type {?} */ (hostTNode.tViews), /** @type {?} */ ((hostNode.data.template)), getRenderer(), hostTView.directiveRegistry, hostTView.pipeRegistry);
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
     * @param {?} _directives
     * @param {?} _pipes
     */
    constructor(elementRef, _tView, _template, _renderer, _directives, _pipes) {
        this._tView = _tView;
        this._template = _template;
        this._renderer = _renderer;
        this._directives = _directives;
        this._pipes = _pipes;
        this.elementRef = elementRef;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        const /** @type {?} */ viewNode = renderEmbeddedTemplate(null, this._tView, this._template, context, this._renderer, this._directives, this._pipes);
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
    TemplateRef.prototype._directives;
    /** @type {?} */
    TemplateRef.prototype._pipes;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUF3QixNQUFNLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQVNqRixPQUFPLEVBQUMsaUJBQWlCLEVBQUUsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsYUFBYSxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFRMU8sT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNELE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQVcsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQzs7Ozs7O0FBU25GLHVCQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQzs7Ozs7O0FBTzFDLHVCQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7Ozs7QUFHdkIscUJBQUksZUFBZSxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7O0FBU3hCLE1BQU0sbUJBQW1CLFFBQW1CLEVBQUUsSUFBZTtJQUMzRCxxQkFBSSxFQUFFLEdBQXFCLG1CQUFDLElBQVcsRUFBQyxDQUFDLGFBQWEsQ0FBQyxDQUFDOzs7SUFJeEQsRUFBRSxDQUFDLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDLENB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QUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztLQUM5Qjs7Ozs7SUFFRCxrQkFBa0IsQ0FBQyxPQUFVO1FBQzNCLHVCQUFNLFFBQVEsR0FBRyxzQkFBc0IsQ0FDbkMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUMvRixNQUFNLENBQUMsY0FBYyxDQUFDLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDL0U7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBpbmplY3QsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFuLCBhc3NlcnROb3ROdWxsfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZUxOb2RlT2JqZWN0LCBjcmVhdGVUVmlldywgZ2V0RGlyZWN0aXZlSW5zdGFuY2UsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7TENvbnRhaW5lcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWYsIERpcmVjdGl2ZURlZkxpc3QsIFBpcGVEZWZMaXN0fSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7TENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExOb2RlVHlwZSwgTFZpZXdOb2RlLCBUTm9kZUZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge1F1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7aW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge25vdEltcGxlbWVudGVkLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiwgYWRkRGVzdHJveWFibGUsIGNyZWF0ZVZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cblxuLyoqXG4gKiBJZiBhIGRpcmVjdGl2ZSBpcyBkaVB1YmxpYywgYmxvb21BZGQgc2V0cyBhIHByb3BlcnR5IG9uIHRoZSBpbnN0YW5jZSB3aXRoIHRoaXMgY29uc3RhbnQgYXNcbiAqIHRoZSBrZXkgYW5kIHRoZSBkaXJlY3RpdmUncyB1bmlxdWUgSUQgYXMgdGhlIHZhbHVlLiBUaGlzIGFsbG93cyB1cyB0byBtYXAgZGlyZWN0aXZlcyB0byB0aGVpclxuICogYmxvb20gZmlsdGVyIGJpdCBmb3IgREkuXG4gKi9cbmNvbnN0IE5HX0VMRU1FTlRfSUQgPSAnX19OR19FTEVNRU5UX0lEX18nO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggdGhlIGRpcmVjdGl2ZSBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoaW5qZWN0b3I6IExJbmplY3RvciwgdHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIC8vIFRoaXMgbWVhbnMgdGhhdCBhZnRlciAyNTUsIHNvbWUgZGlyZWN0aXZlcyB3aWxsIHNoYXJlIHNsb3RzLCBsZWFkaW5nIHRvIHNvbWUgZmFsc2UgcG9zaXRpdmVzXG4gIC8vIHdoZW4gY2hlY2tpbmcgZm9yIGEgZGlyZWN0aXZlJ3MgcHJlc2VuY2UuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJSBCTE9PTV9TSVpFO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgIC8vIFRoZW4gdXNlIHRoZSBtYXNrIHRvIGZsaXAgb24gdGhlIGJpdCAoMC0zMSkgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgaW4gdGhhdCBidWNrZXRcbiAgICBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyAoaW5qZWN0b3IuYmYwIHw9IG1hc2spIDogKGluamVjdG9yLmJmMSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IChpbmplY3Rvci5iZjIgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYzIHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IChpbmplY3Rvci5iZjQgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY1IHw9IG1hc2spKSA6XG4gICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyAoaW5qZWN0b3IuYmY2IHw9IG1hc2spIDogKGluamVjdG9yLmJmNyB8PSBtYXNrKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IExJbmplY3RvciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIG5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKG5vZGU6IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTogTEluamVjdG9yIHtcbiAgY29uc3Qgbm9kZUluamVjdG9yID0gbm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IHBhcmVudEluamVjdG9yID0gbm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQubm9kZUluamVjdG9yO1xuICBpZiAobm9kZUluamVjdG9yICE9IHBhcmVudEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5vZGVJbmplY3RvciAhO1xuICB9XG4gIHJldHVybiBub2RlLm5vZGVJbmplY3RvciA9IHtcbiAgICBwYXJlbnQ6IHBhcmVudEluamVjdG9yLFxuICAgIG5vZGU6IG5vZGUsXG4gICAgYmYwOiAwLFxuICAgIGJmMTogMCxcbiAgICBiZjI6IDAsXG4gICAgYmYzOiAwLFxuICAgIGJmNDogMCxcbiAgICBiZjU6IDAsXG4gICAgYmY2OiAwLFxuICAgIGJmNzogMCxcbiAgICBjYmYwOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjAgfCBwYXJlbnRJbmplY3Rvci5iZjAsXG4gICAgY2JmMTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYxIHwgcGFyZW50SW5qZWN0b3IuYmYxLFxuICAgIGNiZjI6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMiB8IHBhcmVudEluamVjdG9yLmJmMixcbiAgICBjYmYzOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjMgfCBwYXJlbnRJbmplY3Rvci5iZjMsXG4gICAgY2JmNDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY0IHwgcGFyZW50SW5qZWN0b3IuYmY0LFxuICAgIGNiZjU6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNSB8IHBhcmVudEluamVjdG9yLmJmNSxcbiAgICBjYmY2OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjYgfCBwYXJlbnRJbmplY3Rvci5iZjYsXG4gICAgY2JmNzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY3IHwgcGFyZW50SW5qZWN0b3IuYmY3LFxuICAgIHRlbXBsYXRlUmVmOiBudWxsLFxuICAgIHZpZXdDb250YWluZXJSZWY6IG51bGwsXG4gICAgZWxlbWVudFJlZjogbnVsbCxcbiAgICBjaGFuZ2VEZXRlY3RvclJlZjogbnVsbFxuICB9O1xufVxuXG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljSW5JbmplY3RvcihkaTogTEluamVjdG9yLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGRpLCBkZWYudHlwZSk7XG59XG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWMoZGVmOiBEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogSWYgbm90IGZvdW5kLCBpdCB3aWxsIHByb3BhZ2F0ZSB1cCB0byB0aGUgbmV4dCBwYXJlbnQgaW5qZWN0b3IgdW50aWwgdGhlIHRva2VuXG4gKiBpcyBmb3VuZCBvciB0aGUgdG9wIGlzIHJlYWNoZWQuXG4gKlxuICogVXNhZ2UgZXhhbXBsZSAoaW4gZmFjdG9yeSBmdW5jdGlvbik6XG4gKlxuICogY2xhc3MgU29tZURpcmVjdGl2ZSB7XG4gKiAgIGNvbnN0cnVjdG9yKGRpcmVjdGl2ZTogRGlyZWN0aXZlQSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0RpcmVjdGl2ZURlZiA9IGRlZmluZURpcmVjdGl2ZSh7XG4gKiAgICAgdHlwZTogU29tZURpcmVjdGl2ZSxcbiAqICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU29tZURpcmVjdGl2ZShkaXJlY3RpdmVJbmplY3QoRGlyZWN0aXZlQSkpXG4gKiAgIH0pO1xuICogfVxuICpcbiAqIE5PVEU6IHVzZSBgZGlyZWN0aXZlSW5qZWN0YCB3aXRoIGBARGlyZWN0aXZlYCwgYEBDb21wb25lbnRgLCBhbmQgYEBQaXBlYC4gRm9yXG4gKiBhbGwgb3RoZXIgaW5qZWN0aW9uIHVzZSBgaW5qZWN0YCB3aGljaCBkb2VzIG5vdCB3YWxrIHRoZSBET00gcmVuZGVyIHRyZWUuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzLk9wdGlvbmFsKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KCk6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIG51bGwpO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWU6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBsRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUobEVsZW1lbnQsIExOb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgdEVsZW1lbnQgPSBsRWxlbWVudC50Tm9kZSAhO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbCh0RWxlbWVudCwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHRFbGVtZW50LmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBpZiAoYXR0cnNbaV0gPT0gYXR0ck5hbWUpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqIE9yLCBpZiBpdCBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBpbnN0YW5jZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKFxuICAgIGRpOiBMSW5qZWN0b3IsIGNvbnRleHQ6IGFueSk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoZGkuY2hhbmdlRGV0ZWN0b3JSZWYpIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICBjb25zdCBjdXJyZW50Tm9kZSA9IGRpLm5vZGU7XG4gIGlmIChpc0NvbXBvbmVudChjdXJyZW50Tm9kZS50Tm9kZSAhKSkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGNyZWF0ZVZpZXdSZWYoY3VycmVudE5vZGUuZGF0YSBhcyBMVmlldywgY29udGV4dCk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudHlwZSA9PT0gTE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZS52aWV3Lm5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTpcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3IoY3VycmVudE5vZGUpO1xuICBjb25zdCBob3N0SW5qZWN0b3IgPSBob3N0Tm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IGV4aXN0aW5nUmVmID0gaG9zdEluamVjdG9yICYmIGhvc3RJbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICByZXR1cm4gZXhpc3RpbmdSZWYgP1xuICAgICAgZXhpc3RpbmdSZWYgOlxuICAgICAgY3JlYXRlVmlld1JlZihcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhIGFzIExWaWV3LFxuICAgICAgICAgIGhvc3ROb2RlLnZpZXdcbiAgICAgICAgICAgICAgLmRpcmVjdGl2ZXMgIVtob3N0Tm9kZS50Tm9kZSAhLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0XSk7XG59XG5cbi8qKlxuICogSWYgdGhlIG5vZGUgaXMgYW4gZW1iZWRkZWQgdmlldywgdHJhdmVyc2VzIHVwIHRoZSB2aWV3IHRyZWUgdG8gcmV0dXJuIHRoZSBjbG9zZXN0XG4gKiBhbmNlc3RvciB2aWV3IHRoYXQgaXMgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuIElmIGl0J3MgYWxyZWFkeSBhIGNvbXBvbmVudCBub2RlLFxuICogcmV0dXJucyBpdHNlbGYuXG4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3Rvcihub2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOiBMRWxlbWVudE5vZGUge1xuICB3aGlsZSAobm9kZS50eXBlID09PSBMTm9kZVR5cGUuVmlldykge1xuICAgIG5vZGUgPSBub2RlLnZpZXcubm9kZTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBkaXJlY3RpdmUgdHlwZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSBhbmQgcmV0dXJuc1xuICogdGhhdCBpbnN0YW5jZSBpZiBmb3VuZC5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIGl0IGdldHMgdGhlIGJsb29tIGZpbHRlciBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgKHNlZSBibG9vbUhhc2hCaXQpLFxuICogY2hlY2tzIHRoYXQgYml0IGFnYWluc3QgdGhlIGJsb29tIGZpbHRlciBzdHJ1Y3R1cmUgdG8gaWRlbnRpZnkgYW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlXG4gKiB0aGUgZGlyZWN0aXZlIChzZWUgYmxvb21GaW5kUG9zc2libGVJbmplY3RvciksIHRoZW4gc2VhcmNoZXMgdGhlIGRpcmVjdGl2ZXMgb24gdGhhdCBpbmplY3RvclxuICogZm9yIGEgbWF0Y2guXG4gKlxuICogSWYgbm90IGZvdW5kLCBpdCB3aWxsIHByb3BhZ2F0ZSB1cCB0byB0aGUgbmV4dCBwYXJlbnQgaW5qZWN0b3IgdW50aWwgdGhlIHRva2VuXG4gKiBpcyBmb3VuZCBvciB0aGUgdG9wIGlzIHJlYWNoZWQuXG4gKlxuICogQHBhcmFtIGRpIE5vZGUgaW5qZWN0b3Igd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgZGlyZWN0aXZlIHR5cGUgdG8gc2VhcmNoIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFncyAoZS5nLiBDaGVja1BhcmVudClcbiAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIGRpOiBMSW5qZWN0b3IsIHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0KHRva2VuKTtcblxuICAvLyBJZiB0aGUgdG9rZW4gaGFzIGEgYmxvb20gaGFzaCwgdGhlbiBpdCBpcyBhIGRpcmVjdGl2ZSB0aGF0IGlzIHB1YmxpYyB0byB0aGUgaW5qZWN0aW9uIHN5c3RlbVxuICAvLyAoZGlQdWJsaWMpLiBJZiB0aGVyZSBpcyBubyBoYXNoLCBmYWxsIGJhY2sgdG8gdGhlIG1vZHVsZSBpbmplY3Rvci5cbiAgaWYgKGJsb29tSGFzaCA9PT0gbnVsbCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKS52aWV3LmluamVjdG9yO1xuICAgIGNvbnN0IGZvcm1lckluamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKG1vZHVsZUluamVjdG9yKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IoZm9ybWVySW5qZWN0b3IpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID0gZGk7XG5cbiAgICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAgIC8vIEdldCB0aGUgY2xvc2VzdCBwb3RlbnRpYWwgbWF0Y2hpbmcgaW5qZWN0b3IgKHVwd2FyZHMgaW4gdGhlIGluamVjdG9yIHRyZWUpIHRoYXRcbiAgICAgIC8vICpwb3RlbnRpYWxseSogaGFzIHRoZSB0b2tlbi5cbiAgICAgIGluamVjdG9yID0gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihpbmplY3RvciwgYmxvb21IYXNoLCBmbGFncyk7XG5cbiAgICAgIC8vIElmIG5vIGluamVjdG9yIGlzIGZvdW5kLCB3ZSAqa25vdyogdGhhdCB0aGVyZSBpcyBubyBhbmNlc3RvciBpbmplY3RvciB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgLy8gdG9rZW4sIHNvIHdlIGFib3J0LlxuICAgICAgaWYgKCFpbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3Qgbm9kZSA9IGluamVjdG9yLm5vZGU7XG4gICAgICBjb25zdCBub2RlRmxhZ3MgPSBub2RlLnROb2RlICEuZmxhZ3M7XG4gICAgICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgICBpZiAoY291bnQgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgICAgIGNvbnN0IGRlZnMgPSBub2RlLnZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGlyZWN0aXZlSW5zdGFuY2Uobm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXcudFZpZXcuY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBub2RlLnZpZXcudFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGRpcmVjdGl2ZSB0eXBlLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdGhlIGRpcmVjdGl2ZSBpcyBwcmVzZW50LlxuICpcbiAqIFdoZW4gdGhlIGRpcmVjdGl2ZSB3YXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciwgaXQgd2FzIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIGNsYXNzLiBTaW5jZSB0aGVyZSBhcmUgb25seSBCTE9PTV9TSVpFIHNsb3RzIHBlciBibG9vbSBmaWx0ZXIsIHRoZSBkaXJlY3RpdmUnc1xuICogSUQgbXVzdCBiZSBtb2R1bG8tZWQgYnkgQkxPT01fU0laRSB0byBnZXQgdGhlIGNvcnJlY3QgYmxvb20gYml0IChkaXJlY3RpdmVzIHNoYXJlIHNsb3RzIGFmdGVyXG4gKiBCTE9PTV9TSVpFIGlzIHJlYWNoZWQpLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdHlwZVxuICogQHJldHVybnMgVGhlIGJsb29tIGJpdCB0byBjaGVjayBmb3IgdGhlIGRpcmVjdGl2ZVxuICovXG5mdW5jdGlvbiBibG9vbUhhc2hCaXQodHlwZTogVHlwZTxhbnk+KTogbnVtYmVyfG51bGwge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSAnbnVtYmVyJyA/IGlkICUgQkxPT01fU0laRSA6IG51bGw7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIGEgY2VydGFpbiBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgY29ycmVzcG9uZHMgdG8gYSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuIEdpdmVuIHRoZSBibG9vbSBiaXQgdG9cbiAqIGNoZWNrIGFuZCBhIHN0YXJ0aW5nIGluamVjdG9yLCB0aGlzIGZ1bmN0aW9uIHRyYXZlcnNlcyB1cCBpbmplY3RvcnMgdW50aWwgaXQgZmluZHMgYW5cbiAqIGluamVjdG9yIHRoYXQgY29udGFpbnMgYSAxIGZvciB0aGF0IGJpdCBpbiBpdHMgYmxvb20gZmlsdGVyLiBBIDEgaW5kaWNhdGVzIHRoYXQgdGhlXG4gKiBpbmplY3RvciBtYXkgaGF2ZSB0aGF0IGRpcmVjdGl2ZS4gSXQgb25seSAqbWF5KiBoYXZlIHRoZSBkaXJlY3RpdmUgYmVjYXVzZSBkaXJlY3RpdmVzIGJlZ2luXG4gKiB0byBzaGFyZSBibG9vbSBmaWx0ZXIgYml0cyBhZnRlciB0aGUgQkxPT01fU0laRSBpcyByZWFjaGVkLCBhbmQgaXQgY291bGQgY29ycmVzcG9uZCB0byBhXG4gKiBkaWZmZXJlbnQgZGlyZWN0aXZlIHNoYXJpbmcgdGhlIGJpdC5cbiAqXG4gKiBOb3RlOiBXZSBjYW4gc2tpcCBjaGVja2luZyBmdXJ0aGVyIGluamVjdG9ycyB1cCB0aGUgdHJlZSBpZiBhbiBpbmplY3RvcidzIGNiZiBzdHJ1Y3R1cmVcbiAqIGhhcyBhIDAgZm9yIHRoYXQgYmxvb20gYml0LiBTaW5jZSBjYmYgY29udGFpbnMgdGhlIG1lcmdlZCB2YWx1ZSBvZiBhbGwgdGhlIHBhcmVudFxuICogaW5qZWN0b3JzLCBhIDAgaW4gdGhlIGJsb29tIGJpdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcGFyZW50cyBkZWZpbml0ZWx5IGRvIG5vdCBjb250YWluXG4gKiB0aGUgZGlyZWN0aXZlIGFuZCBkbyBub3QgbmVlZCB0byBiZSBjaGVja2VkLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgc3RhcnRpbmcgbm9kZSBpbmplY3RvciB0byBjaGVja1xuICogQHBhcmFtICBibG9vbUJpdCBUaGUgYml0IHRvIGNoZWNrIGluIGVhY2ggaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIEBwYXJhbSAgZmxhZ3MgVGhlIGluamVjdGlvbiBmbGFncyBmb3IgdGhpcyBpbmplY3Rpb24gc2l0ZSAoZS5nLiBPcHRpb25hbCBvciBTa2lwU2VsZilcbiAqIEByZXR1cm5zIEFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSB0aGUgZGlyZWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKFxuICAgIHN0YXJ0SW5qZWN0b3I6IExJbmplY3RvciwgYmxvb21CaXQ6IG51bWJlciwgZmxhZ3M6IEluamVjdEZsYWdzKTogTEluamVjdG9yfG51bGwge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZSAqaXNuJ3QqIGFcbiAgLy8gbWF0Y2guXG4gIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPVxuICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZiA/IHN0YXJ0SW5qZWN0b3IucGFyZW50ICEgOiBzdGFydEluamVjdG9yO1xuICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICAgIGxldCB2YWx1ZTogbnVtYmVyO1xuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5iZjAgOiBpbmplY3Rvci5iZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuYmYyIDogaW5qZWN0b3IuYmYzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IGluamVjdG9yLmJmNCA6IGluamVjdG9yLmJmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmJmNiA6IGluamVjdG9yLmJmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAgIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gICAgaWYgKCh2YWx1ZSAmIG1hc2spID09PSBtYXNrKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3I7XG4gICAgfSBlbHNlIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudCBpbmplY3RvciBkb2VzIG5vdCBoYXZlIHRoZSBkaXJlY3RpdmUsIGNoZWNrIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgYW5jZXN0b3JcbiAgICAvLyBpbmplY3RvcnMgKGNiZjAgLSBjYmY3KS4gVGhlc2UgZmlsdGVycyBjYXB0dXJlICphbGwqIGFuY2VzdG9yIGluamVjdG9ycy5cbiAgICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gaW5qZWN0b3IuY2JmMCA6IGluamVjdG9yLmNiZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuY2JmMiA6IGluamVjdG9yLmNiZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuY2JmNCA6IGluamVjdG9yLmNiZjUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyBpbmplY3Rvci5jYmY2IDogaW5qZWN0b3IuY2JmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlIHVwIHRvXG4gICAgLy8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZSBjYW4gYWJvcnQuXG4gICAgaW5qZWN0b3IgPSAodmFsdWUgJiBtYXNrKSA/IGluamVjdG9yLnBhcmVudCA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgYXJlIGluIHRoZSBzYW1lIGhvc3Qgdmlldy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzdXBwb3J0IEBIb3N0KCkgZGVjb3JhdG9ycy4gSWYgQEhvc3QoKSBpcyBzZXQsIHdlIHNob3VsZCBzdG9wIHNlYXJjaGluZyBvbmNlXG4gKiB0aGUgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgdmlldyBkb24ndCBtYXRjaCBiZWNhdXNlIGl0IG1lYW5zIHdlJ2QgY3Jvc3MgdGhlIHZpZXcgYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIHNhbWVIb3N0VmlldyhpbmplY3RvcjogTEluamVjdG9yKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWluamVjdG9yLnBhcmVudCAmJiBpbmplY3Rvci5wYXJlbnQubm9kZS52aWV3ID09PSBpbmplY3Rvci5ub2RlLnZpZXc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWFkRnJvbUluamVjdG9yRm48VD4ge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSByZWFkOiAoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUluZGV4PzogbnVtYmVyKSA9PiBUKSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmb3IgYSBnaXZlbiBub2RlIGluamVjdG9yIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgRWxlbWVudFJlZlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBkaS5lbGVtZW50UmVmIHx8IChkaS5lbGVtZW50UmVmID0gbmV3IEVsZW1lbnRSZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGkubm9kZS50eXBlID09PSBMTm9kZVR5cGUuQ29udGFpbmVyID8gbnVsbCA6IGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGUsIExOb2RlVHlwZS5Db250YWluZXIsIExOb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJZHhdO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnR5cGUgPT09IExOb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdmYWlsJyk7XG4gICAgfSkgYXMgYW55IGFzIFF1ZXJ5UmVhZFR5cGU8YW55Pik7XG5cbi8qKiBBIHJlZiB0byBhIG5vZGUncyBuYXRpdmUgZWxlbWVudC4gKi9cbmNsYXNzIEVsZW1lbnRSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZUVsZW1lbnQ6IGFueSkgeyB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVFbGVtZW50OyB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIWRpLnZpZXdDb250YWluZXJSZWYpIHtcbiAgICBjb25zdCB2Y1JlZkhvc3QgPSBkaS5ub2RlO1xuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModmNSZWZIb3N0LCBMTm9kZVR5cGUuQ29udGFpbmVyLCBMTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIodmNSZWZIb3N0LnBhcmVudCAhLCB2Y1JlZkhvc3Qudmlldyk7XG4gICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgICAgIExOb2RlVHlwZS5Db250YWluZXIsIHZjUmVmSG9zdC52aWV3LCB2Y1JlZkhvc3QucGFyZW50ICEsIHVuZGVmaW5lZCwgbENvbnRhaW5lciwgbnVsbCk7XG5cbiAgICB2Y1JlZkhvc3QuZHluYW1pY0xDb250YWluZXJOb2RlID0gbENvbnRhaW5lck5vZGU7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKHZjUmVmSG9zdC52aWV3LCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZXR1cm4gZGkudmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBBIHJlZiB0byBhIGNvbnRhaW5lciB0aGF0IGVuYWJsZXMgYWRkaW5nIGFuZCByZW1vdmluZyB2aWV3cyBmcm9tIHRoYXQgY29udGFpbmVyXG4gKiBpbXBlcmF0aXZlbHkuXG4gKi9cbmNsYXNzIFZpZXdDb250YWluZXJSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcbiAgZWxlbWVudDogdmlld0VuZ2luZV9FbGVtZW50UmVmO1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHBhcmVudEluamVjdG9yOiBJbmplY3RvcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUpIHt9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgd2hpbGUgKGxDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyLnZpZXdzLmxlbmd0aDtcbiAgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgaW5kZXgpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLl9sVmlld05vZGU7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICAvLyBpbnZhbGlkYXRlIGNhY2hlIG9mIG5leHQgc2libGluZyBSTm9kZSAod2UgZG8gc2ltaWxhciBvcGVyYXRpb24gaW4gdGhlIGNvbnRhaW5lclJlZnJlc2hFbmRcbiAgICAvLyBpbnN0cnVjdGlvbilcbiAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmUgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgKGxWaWV3Tm9kZSBhc3twYXJlbnQ6IExOb2RlfSkucGFyZW50ID0gdGhpcy5fbENvbnRhaW5lck5vZGU7XG5cbiAgICAvLyBJZiB0aGUgdmlldyBpcyBkeW5hbWljIChoYXMgYSB0ZW1wbGF0ZSksIGl0IG5lZWRzIHRvIGJlIGNvdW50ZWQgYm90aCBhdCB0aGUgY29udGFpbmVyXG4gICAgLy8gbGV2ZWwgYW5kIGF0IHRoZSBub2RlIGFib3ZlIHRoZSBjb250YWluZXIuXG4gICAgaWYgKGxWaWV3Tm9kZS5kYXRhLnRlbXBsYXRlICE9PSBudWxsKSB7XG4gICAgICAvLyBJbmNyZW1lbnQgdGhlIGNvbnRhaW5lciB2aWV3IGNvdW50LlxuICAgICAgdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YS5keW5hbWljVmlld0NvdW50Kys7XG5cbiAgICAgIC8vIExvb2sgZm9yIHRoZSBwYXJlbnQgbm9kZSBhbmQgaW5jcmVtZW50IGl0cyBkeW5hbWljIHZpZXcgY291bnQuXG4gICAgICBpZiAodGhpcy5fbENvbnRhaW5lck5vZGUucGFyZW50ICE9PSBudWxsICYmIHRoaXMuX2xDb250YWluZXJOb2RlLnBhcmVudC5kYXRhICE9PSBudWxsKSB7XG4gICAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuX2xDb250YWluZXJOb2RlLnBhcmVudCwgTE5vZGVUeXBlLlZpZXcsIExOb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgICAgdGhpcy5fbENvbnRhaW5lck5vZGUucGFyZW50LmRhdGEuZHluYW1pY1ZpZXdDb3VudCsrO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgdGhpcy5fYWRqdXN0SW5kZXgobmV3SW5kZXgpKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLmluZGV4T2Yodmlld1JlZik7IH1cblxuICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgLy8gVE9ETyhtbCk6IHByb3BlciBkZXN0cm95IG9mIHRoZSBWaWV3UmVmLCBpLmUuIHJlY3Vyc2l2ZWx5IGRlc3Ryb3kgdGhlIEx2aWV3Tm9kZSBhbmQgaXRzXG4gICAgLy8gY2hpbGRyZW4sIGRlbGV0ZSBET00gbm9kZXMgYW5kIFF1ZXJ5TGlzdCwgdHJpZ2dlciBob29rcyAob25EZXN0cm95KSwgZGVzdHJveSB0aGUgcmVuZGVyZXIsXG4gICAgLy8gZGV0YWNoIHByb2plY3RlZCBub2Rlc1xuICB9XG5cbiAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YS52aWV3cy5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGEudmlld3MubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBUZW1wbGF0ZVJlZlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIGlmICghZGkudGVtcGxhdGVSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZGkubm9kZSwgTE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3QgaG9zdE5vZGUgPSBkaS5ub2RlIGFzIExDb250YWluZXJOb2RlO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGhvc3ROb2RlLnROb2RlICE7XG4gICAgY29uc3QgaG9zdFRWaWV3ID0gaG9zdE5vZGUudmlldy50VmlldztcbiAgICBpZiAoIWhvc3RUTm9kZS50Vmlld3MpIHtcbiAgICAgIGhvc3RUTm9kZS50Vmlld3MgPSBjcmVhdGVUVmlldyhob3N0VFZpZXcuZGlyZWN0aXZlUmVnaXN0cnksIGhvc3RUVmlldy5waXBlUmVnaXN0cnkpO1xuICAgIH1cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICBkaS50ZW1wbGF0ZVJlZiA9IG5ldyBUZW1wbGF0ZVJlZjxhbnk+KFxuICAgICAgICBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGkpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LCBob3N0Tm9kZS5kYXRhLnRlbXBsYXRlICEsXG4gICAgICAgIGdldFJlbmRlcmVyKCksIGhvc3RUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgaG9zdFRWaWV3LnBpcGVSZWdpc3RyeSk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHByaXZhdGUgX3RWaWV3OiBUVmlldyxcbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICAgIHByaXZhdGUgX2RpcmVjdGl2ZXM6IERpcmVjdGl2ZURlZkxpc3R8bnVsbCwgcHJpdmF0ZSBfcGlwZXM6IFBpcGVEZWZMaXN0fG51bGwpIHtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPSByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKFxuICAgICAgICBudWxsLCB0aGlzLl90VmlldywgdGhpcy5fdGVtcGxhdGUsIGNvbnRleHQsIHRoaXMuX3JlbmRlcmVyLCB0aGlzLl9kaXJlY3RpdmVzLCB0aGlzLl9waXBlcyk7XG4gICAgcmV0dXJuIGFkZERlc3Ryb3lhYmxlKG5ldyBFbWJlZGRlZFZpZXdSZWYodmlld05vZGUsIHRoaXMuX3RlbXBsYXRlLCBjb250ZXh0KSk7XG4gIH1cbn1cbiJdfQ==