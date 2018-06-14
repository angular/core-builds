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
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { addToViewTree, assertPreviousIsParent, createLContainer, createLNodeObject, createTNode, getDirectiveInstance, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { VIEWS } from './interfaces/container';
import { DIRECTIVES, HOST_NODE, INJECTOR, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { appendChild, detachView, getParentLNode, insertView, removeView } from './node_manipulation';
import { notImplemented, stringify } from './util';
import { EmbeddedViewRef, ViewRef } from './view_ref';
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
    ngDevMode && assertDefined(tElement, 'expecting tNode');
    const /** @type {?} */ attrs = tElement.attrs;
    if (attrs) {
        for (let /** @type {?} */ i = 0; i < attrs.length; i = i + 2) {
            const /** @type {?} */ attrName = attrs[i];
            if (attrName === 1 /* SelectOnly */)
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
        return di.changeDetectorRef = new ViewRef(/** @type {?} */ (currentNode.data), context);
    }
    else if (currentNode.tNode.type === 3 /* Element */) {
        return di.changeDetectorRef = getOrCreateHostChangeDetector(currentNode.view[HOST_NODE]);
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
        new ViewRef(/** @type {?} */ (hostNode.data), /** @type {?} */ ((hostNode
            .view[DIRECTIVES]))[hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */]);
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
        node = node.view[HOST_NODE];
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
        const /** @type {?} */ moduleInjector = getPreviousOrParentNode().view[INJECTOR];
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
                const /** @type {?} */ defs = /** @type {?} */ ((node.view[TVIEW].directives));
                for (let /** @type {?} */ i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    const /** @type {?} */ directiveDef = /** @type {?} */ (defs[i]);
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return getDirectiveInstance(/** @type {?} */ ((node.view[DIRECTIVES]))[i]);
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
    const /** @type {?} */ matches = node.view[TVIEW].currentMatches;
    if (matches) {
        for (let /** @type {?} */ i = 0; i < matches.length; i += 2) {
            const /** @type {?} */ def = /** @type {?} */ (matches[i]);
            if (def.type === token) {
                return resolveDirective(def, i + 1, matches, node.view[TVIEW]);
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
    return di.elementRef || (di.elementRef = new ElementRef(di.node.native));
}
export const /** @type {?} */ QUERY_READ_TEMPLATE_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateTemplateRef(injector)))));
export const /** @type {?} */ QUERY_READ_CONTAINER_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateContainerRef(injector)))));
export const /** @type {?} */ QUERY_READ_ELEMENT_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateElementRef(injector)))));
export const /** @type {?} */ QUERY_READ_FROM_NODE = (/** @type {?} */ ((new ReadFromInjectorFn((injector, node, directiveIdx) => {
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */);
    if (directiveIdx > -1) {
        return /** @type {?} */ ((node.view[DIRECTIVES]))[directiveIdx];
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
        const /** @type {?} */ lContainer = createLContainer(hostParent, vcRefHost.view, true);
        const /** @type {?} */ comment = vcRefHost.view[RENDERER].createComment(ngDevMode ? 'container' : '');
        const /** @type {?} */ lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, comment, lContainer, null);
        appendChild(hostParent, comment, vcRefHost.view);
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
        while (lContainer[VIEWS].length) {
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
        return lContainer[VIEWS].length;
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
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        const /** @type {?} */ lViewNode = (/** @type {?} */ (viewRef))._lViewNode;
        const /** @type {?} */ adjustedIdx = this._adjustIndex(index);
        (/** @type {?} */ (viewRef)).attachToViewContainerRef(this);
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
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
        const /** @type {?} */ adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainerNode, adjustedIdx);
        this._viewRefs.splice(adjustedIdx, 1);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        const /** @type {?} */ adjustedIdx = this._adjustIndex(index, -1);
        detachView(this._lContainerNode, adjustedIdx);
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    }
    /**
     * @param {?=} index
     * @param {?=} shift
     * @return {?}
     */
    _adjustIndex(index, shift = 0) {
        if (index == null) {
            return this._lContainerNode.data[VIEWS].length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, 'index must be positive');
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this._lContainerNode.data[VIEWS].length + 1 + shift, 'index');
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
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), /** @type {?} */ (hostTNode.tViews), getRenderer(), hostNode.data[QUERIES]);
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
     * @param {?} _renderer
     * @param {?} _queries
     */
    constructor(elementRef, _tView, _renderer, _queries) {
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    createEmbeddedView(context) {
        const /** @type {?} */ viewNode = renderEmbeddedTemplate(null, this._tView, context, this._renderer, this._queries);
        return new EmbeddedViewRef(viewNode, /** @type {?} */ (((this._tView.template))), context);
    }
}
function TemplateRef_tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateRef.prototype.elementRef;
    /** @type {?} */
    TemplateRef.prototype._tView;
    /** @type {?} */
    TemplateRef.prototype._renderer;
    /** @type {?} */
    TemplateRef.prototype._queries;
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUF3QixNQUFNLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQVNqRixPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsYUFBYSxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFFLGlCQUFpQixFQUFFLFdBQVcsRUFBRSxvQkFBb0IsRUFBRSx1QkFBdUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLHNCQUFzQixFQUFFLGdCQUFnQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDMU8sT0FBTyxFQUFDLEtBQUssRUFBQyxNQUFNLHdCQUF3QixDQUFDO0FBTTdDLE9BQU8sRUFBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBYSxPQUFPLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzlHLE9BQU8sRUFBQyx5QkFBeUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFDeEUsT0FBTyxFQUFDLFdBQVcsRUFBRSxVQUFVLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUNwRyxPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFFLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQzs7Ozs7O0FBU3BELHVCQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQzs7Ozs7O0FBTzFDLHVCQUFNLFVBQVUsR0FBRyxHQUFHLENBQUM7Ozs7QUFHdkIscUJBQUksZUFBZSxHQUFHLENBQUMs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QixDQUFDLEVBQUUsQ0FBQyxvQkFBRSxTQUFTLENBQUMsTUFBZSxHQUFFLFdBQVcsRUFBRSxFQUNuRSxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7S0FDN0I7SUFDRCxPQUFPLEVBQUUsQ0FBQyxXQUFXLENBQUM7Q0FDdkI7Ozs7QUFFRDs7Ozs7OztJQUdFLFlBQ0ksVUFBaUMsRUFBVSxNQUFhLEVBQVUsU0FBb0IsRUFDOUU7UUFEbUMsV0FBTSxHQUFOLE1BQU0sQ0FBTztRQUFVLGNBQVMsR0FBVCxTQUFTLENBQVc7UUFDOUUsYUFBUSxHQUFSLFFBQVE7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7S0FDOUI7Ozs7O0lBRUQsa0JBQWtCLENBQUMsT0FBVTtRQUMzQix1QkFBTSxRQUFRLEdBQ1Ysc0JBQXNCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQ3RGLE9BQU8sSUFBSSxlQUFlLENBQUMsUUFBUSxzQkFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsS0FBMkIsT0FBTyxDQUFDLENBQUM7S0FDOUY7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBpbmplY3QsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZUxOb2RlT2JqZWN0LCBjcmVhdGVUTm9kZSwgZ2V0RGlyZWN0aXZlSW5zdGFuY2UsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7VklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFZpZXdOb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7RElSRUNUSVZFUywgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldFBhcmVudExOb2RlLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7bm90SW1wbGVtZW50ZWQsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogSWYgYSBkaXJlY3RpdmUgaXMgZGlQdWJsaWMsIGJsb29tQWRkIHNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgaW5zdGFuY2Ugd2l0aCB0aGlzIGNvbnN0YW50IGFzXG4gKiB0aGUga2V5IGFuZCB0aGUgZGlyZWN0aXZlJ3MgdW5pcXVlIElEIGFzIHRoZSB2YWx1ZS4gVGhpcyBhbGxvd3MgdXMgdG8gbWFwIGRpcmVjdGl2ZXMgdG8gdGhlaXJcbiAqIGJsb29tIGZpbHRlciBiaXQgZm9yIERJLlxuICovXG5jb25zdCBOR19FTEVNRU5UX0lEID0gJ19fTkdfRUxFTUVOVF9JRF9fJztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIHRoZSBkaXJlY3RpdmUgc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9yOiBMSW5qZWN0b3IsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICAvLyBUaGlzIG1lYW5zIHRoYXQgYWZ0ZXIgMjU1LCBzb21lIGRpcmVjdGl2ZXMgd2lsbCBzaGFyZSBzbG90cywgbGVhZGluZyB0byBzb21lIGZhbHNlIHBvc2l0aXZlc1xuICAvLyB3aGVuIGNoZWNraW5nIGZvciBhIGRpcmVjdGl2ZSdzIHByZXNlbmNlLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICUgQkxPT01fU0laRTtcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAvLyBUaGVuIHVzZSB0aGUgbWFzayB0byBmbGlwIG9uIHRoZSBiaXQgKDAtMzEpIGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIGluIHRoYXQgYnVja2V0XG4gICAgYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gKGluamVjdG9yLmJmMCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjEgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyAoaW5qZWN0b3IuYmYyIHw9IG1hc2spIDogKGluamVjdG9yLmJmMyB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyAoaW5qZWN0b3IuYmY0IHw9IG1hc2spIDogKGluamVjdG9yLmJmNSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gKGluamVjdG9yLmJmNiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjcgfD0gbWFzaykpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpOiBMSW5qZWN0b3Ige1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBub2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk6IExJbmplY3RvciB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IG5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnQgJiYgcGFyZW50Lm5vZGVJbmplY3RvcjtcbiAgaWYgKG5vZGVJbmplY3RvciAhPSBwYXJlbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBub2RlSW5qZWN0b3IgITtcbiAgfVxuICByZXR1cm4gbm9kZS5ub2RlSW5qZWN0b3IgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRJbmplY3RvcixcbiAgICBub2RlOiBub2RlLFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGxcbiAgfTtcbn1cblxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoZGk6IExJbmplY3RvciwgZGVmOiBEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIGRlZik7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBOT1RFOiB1c2UgYGRpcmVjdGl2ZUluamVjdGAgd2l0aCBgQERpcmVjdGl2ZWAsIGBAQ29tcG9uZW50YCwgYW5kIGBAUGlwZWAuIEZvclxuICogYWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgRE9NIHJlbmRlciB0cmVlLlxuICpcbiAqIEBwYXJhbSB0b2tlbiBUaGUgZGlyZWN0aXZlIHR5cGUgdG8gc2VhcmNoIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFncyAoZS5nLiBDaGVja1BhcmVudClcbiAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncy5PcHRpb25hbCk6IFR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICBjb25zdCBsRWxlbWVudCA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUobEVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgY29uc3QgdEVsZW1lbnQgPSBsRWxlbWVudC50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodEVsZW1lbnQsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0RWxlbWVudC5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKiBPciwgaWYgaXQgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgaW5zdGFuY2UuXG4gKlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihcbiAgICBkaTogTEluamVjdG9yLCBjb250ZXh0OiBhbnkpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgaWYgKGRpLmNoYW5nZURldGVjdG9yUmVmKSByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgY29uc3QgY3VycmVudE5vZGUgPSBkaS5ub2RlO1xuICBpZiAoaXNDb21wb25lbnQoY3VycmVudE5vZGUudE5vZGUpKSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFZpZXdSZWYoY3VycmVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsIGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGUudmlld1tIT1NUX05PREVdKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG4vKiogR2V0cyBvciBjcmVhdGVzIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY2xvc2VzdCBob3N0IGNvbXBvbmVudCAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6XG4gICAgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKGN1cnJlbnROb2RlKTtcbiAgY29uc3QgaG9zdEluamVjdG9yID0gaG9zdE5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBleGlzdGluZ1JlZiA9IGhvc3RJbmplY3RvciAmJiBob3N0SW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcmV0dXJuIGV4aXN0aW5nUmVmID9cbiAgICAgIGV4aXN0aW5nUmVmIDpcbiAgICAgIG5ldyBWaWV3UmVmKFxuICAgICAgICAgIGhvc3ROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLFxuICAgICAgICAgIGhvc3ROb2RlXG4gICAgICAgICAgICAgIC52aWV3W0RJUkVDVElWRVNdICFbaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnRdKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgbm9kZSBpcyBhbiBlbWJlZGRlZCB2aWV3LCB0cmF2ZXJzZXMgdXAgdGhlIHZpZXcgdHJlZSB0byByZXR1cm4gdGhlIGNsb3Nlc3RcbiAqIGFuY2VzdG9yIHZpZXcgdGhhdCBpcyBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC4gSWYgaXQncyBhbHJlYWR5IGEgY29tcG9uZW50IG5vZGUsXG4gKiByZXR1cm5zIGl0c2VsZi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKG5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6IExFbGVtZW50Tm9kZSB7XG4gIHdoaWxlIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbm9kZSA9IG5vZGUudmlld1tIT1NUX05PREVdO1xuICB9XG4gIHJldHVybiBub2RlIGFzIExFbGVtZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGRpcmVjdGl2ZSB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIFNwZWNpZmljYWxseSwgaXQgZ2V0cyB0aGUgYmxvb20gZmlsdGVyIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tSGFzaEJpdCksXG4gKiBjaGVja3MgdGhhdCBiaXQgYWdhaW5zdCB0aGUgYmxvb20gZmlsdGVyIHN0cnVjdHVyZSB0byBpZGVudGlmeSBhbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmVcbiAqIHRoZSBkaXJlY3RpdmUgKHNlZSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKSwgdGhlbiBzZWFyY2hlcyB0aGUgZGlyZWN0aXZlcyBvbiB0aGF0IGluamVjdG9yXG4gKiBmb3IgYSBtYXRjaC5cbiAqXG4gKiBJZiBub3QgZm91bmQsIGl0IHdpbGwgcHJvcGFnYXRlIHVwIHRvIHRoZSBuZXh0IHBhcmVudCBpbmplY3RvciB1bnRpbCB0aGUgdG9rZW5cbiAqIGlzIGZvdW5kIG9yIHRoZSB0b3AgaXMgcmVhY2hlZC5cbiAqXG4gKiBAcGFyYW0gZGkgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgZGk6IExJbmplY3RvciwgdG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXQodG9rZW4pO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykuIElmIHRoZXJlIGlzIG5vIGhhc2gsIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoID09PSBudWxsKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpLnZpZXdbSU5KRUNUT1JdO1xuICAgIGNvbnN0IGZvcm1lckluamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKG1vZHVsZUluamVjdG9yKTtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRDdXJyZW50SW5qZWN0b3IoZm9ybWVySW5qZWN0b3IpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID0gZGk7XG5cbiAgICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAgIC8vIEdldCB0aGUgY2xvc2VzdCBwb3RlbnRpYWwgbWF0Y2hpbmcgaW5qZWN0b3IgKHVwd2FyZHMgaW4gdGhlIGluamVjdG9yIHRyZWUpIHRoYXRcbiAgICAgIC8vICpwb3RlbnRpYWxseSogaGFzIHRoZSB0b2tlbi5cbiAgICAgIGluamVjdG9yID0gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihpbmplY3RvciwgYmxvb21IYXNoLCBmbGFncyk7XG5cbiAgICAgIC8vIElmIG5vIGluamVjdG9yIGlzIGZvdW5kLCB3ZSAqa25vdyogdGhhdCB0aGVyZSBpcyBubyBhbmNlc3RvciBpbmplY3RvciB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgLy8gdG9rZW4sIHNvIHdlIGFib3J0LlxuICAgICAgaWYgKCFpbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3Qgbm9kZSA9IGluamVjdG9yLm5vZGU7XG4gICAgICBjb25zdCBub2RlRmxhZ3MgPSBub2RlLnROb2RlLmZsYWdzO1xuICAgICAgY29uc3QgY291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICAgICAgaWYgKGNvdW50ICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgICAgICBjb25zdCBkZWZzID0gbm9kZS52aWV3W1RWSUVXXS5kaXJlY3RpdmVzICE7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGRlZmluaXRpb24gZm9yIHRoZSBkaXJlY3RpdmUgYXQgdGhpcyBpbmRleCBhbmQsIGlmIGl0IGlzIGluamVjdGFibGUgKGRpUHVibGljKSxcbiAgICAgICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXREaXJlY3RpdmVJbnN0YW5jZShub2RlLnZpZXdbRElSRUNUSVZFU10gIVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXdbVFZJRVddLmN1cnJlbnRNYXRjaGVzO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVEaXJlY3RpdmUoZGVmLCBpICsgMSwgbWF0Y2hlcywgbm9kZS52aWV3W1RWSUVXXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgZGlyZWN0aXZlIHR5cGUsIHRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0aGUgZGlyZWN0aXZlIGlzIHByZXNlbnQuXG4gKlxuICogV2hlbiB0aGUgZGlyZWN0aXZlIHdhcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyLCBpdCB3YXMgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgY2xhc3MuIFNpbmNlIHRoZXJlIGFyZSBvbmx5IEJMT09NX1NJWkUgc2xvdHMgcGVyIGJsb29tIGZpbHRlciwgdGhlIGRpcmVjdGl2ZSdzXG4gKiBJRCBtdXN0IGJlIG1vZHVsby1lZCBieSBCTE9PTV9TSVpFIHRvIGdldCB0aGUgY29ycmVjdCBibG9vbSBiaXQgKGRpcmVjdGl2ZXMgc2hhcmUgc2xvdHMgYWZ0ZXJcbiAqIEJMT09NX1NJWkUgaXMgcmVhY2hlZCkuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0eXBlXG4gKiBAcmV0dXJucyBUaGUgYmxvb20gYml0IHRvIGNoZWNrIGZvciB0aGUgZGlyZWN0aXZlXG4gKi9cbmZ1bmN0aW9uIGJsb29tSGFzaEJpdCh0eXBlOiBUeXBlPGFueT4pOiBudW1iZXJ8bnVsbCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgJSBCTE9PTV9TSVpFIDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2xvc2VzdCBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgYSBjZXJ0YWluIGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBjb3JyZXNwb25kcyB0byBhIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci4gR2l2ZW4gdGhlIGJsb29tIGJpdCB0b1xuICogY2hlY2sgYW5kIGEgc3RhcnRpbmcgaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gdHJhdmVyc2VzIHVwIGluamVjdG9ycyB1bnRpbCBpdCBmaW5kcyBhblxuICogaW5qZWN0b3IgdGhhdCBjb250YWlucyBhIDEgZm9yIHRoYXQgYml0IGluIGl0cyBibG9vbSBmaWx0ZXIuIEEgMSBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAqIGluamVjdG9yIG1heSBoYXZlIHRoYXQgZGlyZWN0aXZlLiBJdCBvbmx5ICptYXkqIGhhdmUgdGhlIGRpcmVjdGl2ZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYmVnaW5cbiAqIHRvIHNoYXJlIGJsb29tIGZpbHRlciBiaXRzIGFmdGVyIHRoZSBCTE9PTV9TSVpFIGlzIHJlYWNoZWQsIGFuZCBpdCBjb3VsZCBjb3JyZXNwb25kIHRvIGFcbiAqIGRpZmZlcmVudCBkaXJlY3RpdmUgc2hhcmluZyB0aGUgYml0LlxuICpcbiAqIE5vdGU6IFdlIGNhbiBza2lwIGNoZWNraW5nIGZ1cnRoZXIgaW5qZWN0b3JzIHVwIHRoZSB0cmVlIGlmIGFuIGluamVjdG9yJ3MgY2JmIHN0cnVjdHVyZVxuICogaGFzIGEgMCBmb3IgdGhhdCBibG9vbSBiaXQuIFNpbmNlIGNiZiBjb250YWlucyB0aGUgbWVyZ2VkIHZhbHVlIG9mIGFsbCB0aGUgcGFyZW50XG4gKiBpbmplY3RvcnMsIGEgMCBpbiB0aGUgYmxvb20gYml0IGluZGljYXRlcyB0aGF0IHRoZSBwYXJlbnRzIGRlZmluaXRlbHkgZG8gbm90IGNvbnRhaW5cbiAqIHRoZSBkaXJlY3RpdmUgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIGNoZWNrZWQuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBzdGFydGluZyBub2RlIGluamVjdG9yIHRvIGNoZWNrXG4gKiBAcGFyYW0gIGJsb29tQml0IFRoZSBiaXQgdG8gY2hlY2sgaW4gZWFjaCBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogQHBhcmFtICBmbGFncyBUaGUgaW5qZWN0aW9uIGZsYWdzIGZvciB0aGlzIGluamVjdGlvbiBzaXRlIChlLmcuIE9wdGlvbmFsIG9yIFNraXBTZWxmKVxuICogQHJldHVybnMgQW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIHRoZSBkaXJlY3RpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoXG4gICAgc3RhcnRJbmplY3RvcjogTEluamVjdG9yLCBibG9vbUJpdDogbnVtYmVyLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBMSW5qZWN0b3J8bnVsbCB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlICppc24ndCogYVxuICAvLyBtYXRjaC5cbiAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9XG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmID8gc3RhcnRJbmplY3Rvci5wYXJlbnQgISA6IHN0YXJ0SW5qZWN0b3I7XG4gIHdoaWxlIChpbmplY3Rvcikge1xuICAgIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAgIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAgIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG4gICAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IGluamVjdG9yLmJmMCA6IGluamVjdG9yLmJmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5iZjIgOiBpbmplY3Rvci5iZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuYmY0IDogaW5qZWN0b3IuYmY1KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gaW5qZWN0b3IuYmY2IDogaW5qZWN0b3IuYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gICAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgICBpZiAoKHZhbHVlICYgbWFzaykgPT09IG1hc2spIHtcbiAgICAgIHJldHVybiBpbmplY3RvcjtcbiAgICB9IGVsc2UgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGluamVjdG9yIGRvZXMgbm90IGhhdmUgdGhlIGRpcmVjdGl2ZSwgY2hlY2sgdGhlIGJsb29tIGZpbHRlcnMgZm9yIHRoZSBhbmNlc3RvclxuICAgIC8vIGluamVjdG9ycyAoY2JmMCAtIGNiZjcpLiBUaGVzZSBmaWx0ZXJzIGNhcHR1cmUgKmFsbCogYW5jZXN0b3IgaW5qZWN0b3JzLlxuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5jYmYwIDogaW5qZWN0b3IuY2JmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5jYmYyIDogaW5qZWN0b3IuY2JmMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyBpbmplY3Rvci5jYmY0IDogaW5qZWN0b3IuY2JmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmNiZjYgOiBpbmplY3Rvci5jYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSwgdHJhdmVyc2UgdXAgdG9cbiAgICAvLyBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlIGNhbiBhYm9ydC5cbiAgICBpbmplY3RvciA9ICh2YWx1ZSAmIG1hc2spID8gaW5qZWN0b3IucGFyZW50IDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBpbmplY3RvciBhbmQgaXRzIHBhcmVudCBhcmUgaW4gdGhlIHNhbWUgaG9zdCB2aWV3LlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHN1cHBvcnQgQEhvc3QoKSBkZWNvcmF0b3JzLiBJZiBASG9zdCgpIGlzIHNldCwgd2Ugc2hvdWxkIHN0b3Agc2VhcmNoaW5nIG9uY2VcbiAqIHRoZSBpbmplY3RvciBhbmQgaXRzIHBhcmVudCB2aWV3IGRvbid0IG1hdGNoIGJlY2F1c2UgaXQgbWVhbnMgd2UnZCBjcm9zcyB0aGUgdmlldyBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gc2FtZUhvc3RWaWV3KGluamVjdG9yOiBMSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaW5qZWN0b3IucGFyZW50ICYmIGluamVjdG9yLnBhcmVudC5ub2RlLnZpZXcgPT09IGluamVjdG9yLm5vZGUudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSW5kZXg/OiBudW1iZXIpID0+IFQpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZvciBhIGdpdmVuIG5vZGUgaW5qZWN0b3IgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBFbGVtZW50UmVmXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGRpLmVsZW1lbnRSZWYgfHwgKGRpLmVsZW1lbnRSZWYgPSBuZXcgRWxlbWVudFJlZihkaS5ub2RlLm5hdGl2ZSkpO1xufVxuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9URU1QTEFURV9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfQ09OVEFJTkVSX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRUxFTUVOVF9SRUYgPVxuICAgIDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfRWxlbWVudFJlZj4+KG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9FbGVtZW50UmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0ZST01fTk9ERSA9XG4gICAgKG5ldyBSZWFkRnJvbUluamVjdG9yRm48YW55PigoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUlkeDogbnVtYmVyKSA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICBpZiAoZGlyZWN0aXZlSWR4ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKTtcbiAgICB9KSBhcyBhbnkgYXMgUXVlcnlSZWFkVHlwZTxhbnk+KTtcblxuLyoqIEEgcmVmIHRvIGEgbm9kZSdzIG5hdGl2ZSBlbGVtZW50LiAqL1xuY2xhc3MgRWxlbWVudFJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh2Y1JlZkhvc3QsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBjb25zdCBob3N0UGFyZW50ID0gZ2V0UGFyZW50TE5vZGUodmNSZWZIb3N0KSAhO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGhvc3RQYXJlbnQsIHZjUmVmSG9zdC52aWV3LCB0cnVlKTtcbiAgICBjb25zdCBjb21tZW50ID0gdmNSZWZIb3N0LnZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgICAgIFROb2RlVHlwZS5Db250YWluZXIsIHZjUmVmSG9zdC52aWV3LCBob3N0UGFyZW50LCBjb21tZW50LCBsQ29udGFpbmVyLCBudWxsKTtcbiAgICBhcHBlbmRDaGlsZChob3N0UGFyZW50LCBjb21tZW50LCB2Y1JlZkhvc3Qudmlldyk7XG5cblxuICAgIGlmICh2Y1JlZkhvc3QucXVlcmllcykge1xuICAgICAgbENvbnRhaW5lck5vZGUucXVlcmllcyA9IHZjUmVmSG9zdC5xdWVyaWVzLmNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID0gY3JlYXRlVE5vZGUoVE5vZGVUeXBlLkNvbnRhaW5lciwgLTEsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIGxDb250YWluZXJOb2RlLnROb2RlID0gaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlO1xuICAgIHZjUmVmSG9zdC5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcblxuICAgIGFkZFRvVmlld1RyZWUodmNSZWZIb3N0LnZpZXcsIGhvc3RUTm9kZS5pbmRleCBhcyBudW1iZXIsIGxDb250YWluZXIpO1xuXG4gICAgZGkudmlld0NvbnRhaW5lclJlZiA9IG5ldyBWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXJOb2RlKTtcbiAgfVxuXG4gIHJldHVybiBkaS52aWV3Q29udGFpbmVyUmVmO1xufVxuXG4vKipcbiAqIEEgcmVmIHRvIGEgY29udGFpbmVyIHRoYXQgZW5hYmxlcyBhZGRpbmcgYW5kIHJlbW92aW5nIHZpZXdzIGZyb20gdGhhdCBjb250YWluZXJcbiAqIGltcGVyYXRpdmVseS5cbiAqL1xuY2xhc3MgVmlld0NvbnRhaW5lclJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIHByaXZhdGUgX3ZpZXdSZWZzOiB2aWV3RW5naW5lX1ZpZXdSZWZbXSA9IFtdO1xuICBlbGVtZW50OiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSkge31cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICB3aGlsZSAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3Qgdmlld1JlZiA9IHRlbXBsYXRlUmVmLmNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0IHx8IDxhbnk+e30pO1xuICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIGluZGV4KTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGNyZWF0ZUNvbXBvbmVudDxDPihcbiAgICAgIGNvbXBvbmVudEZhY3Rvcnk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeTxDPiwgaW5kZXg/OiBudW1iZXJ8dW5kZWZpbmVkLFxuICAgICAgaW5qZWN0b3I/OiBJbmplY3Rvcnx1bmRlZmluZWQsIHByb2plY3RhYmxlTm9kZXM/OiBhbnlbXVtdfHVuZGVmaW5lZCxcbiAgICAgIG5nTW9kdWxlPzogdmlld0VuZ2luZV9OZ01vZHVsZVJlZjxhbnk+fHVuZGVmaW5lZCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmPEM+IHtcbiAgICB0aHJvdyBub3RJbXBsZW1lbnRlZCgpO1xuICB9XG5cbiAgaW5zZXJ0KHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGlmICh2aWV3UmVmLmRlc3Ryb3llZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5zZXJ0IGEgZGVzdHJveWVkIFZpZXcgaW4gYSBWaWV3Q29udGFpbmVyIScpO1xuICAgIH1cbiAgICBjb25zdCBsVmlld05vZGUgPSAodmlld1JlZiBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuX2xWaWV3Tm9kZTtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcblxuICAgICh2aWV3UmVmIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcblxuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgdGhpcy5fYWRqdXN0SW5kZXgobmV3SW5kZXgpKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLmluZGV4T2Yodmlld1JlZik7IH1cblxuICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSk7XG4gIH1cblxuICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgVGVtcGxhdGVSZWZcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIWRpLnRlbXBsYXRlUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGRpLm5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gZGkubm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBob3N0Tm9kZS50Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICBkaS50ZW1wbGF0ZVJlZiA9IG5ldyBUZW1wbGF0ZVJlZjxhbnk+KFxuICAgICAgICBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGkpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LCBnZXRSZW5kZXJlcigpLFxuICAgICAgICBob3N0Tm9kZS5kYXRhW1FVRVJJRVNdKTtcbiAgfVxuICByZXR1cm4gZGkudGVtcGxhdGVSZWY7XG59XG5cbmNsYXNzIFRlbXBsYXRlUmVmPFQ+IGltcGxlbWVudHMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIHJlYWRvbmx5IGVsZW1lbnRSZWY6IHZpZXdFbmdpbmVfRWxlbWVudFJlZjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGVsZW1lbnRSZWY6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiwgcHJpdmF0ZSBfdFZpZXc6IFRWaWV3LCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgICAgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCkge1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCk6IHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPFQ+IHtcbiAgICBjb25zdCB2aWV3Tm9kZSA9XG4gICAgICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUobnVsbCwgdGhpcy5fdFZpZXcsIGNvbnRleHQsIHRoaXMuX3JlbmRlcmVyLCB0aGlzLl9xdWVyaWVzKTtcbiAgICByZXR1cm4gbmV3IEVtYmVkZGVkVmlld1JlZih2aWV3Tm9kZSwgdGhpcy5fdFZpZXcudGVtcGxhdGUgIWFzIENvbXBvbmVudFRlbXBsYXRlPFQ+LCBjb250ZXh0KTtcbiAgfVxufVxuIl19