/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, setCurrentInjector } from '../di/injector';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { addToViewTree, assertPreviousIsParent, createEmbeddedViewNode, createLContainer, createLNodeObject, createTNode, getDirectiveInstance, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { VIEWS } from './interfaces/container';
import { DIRECTIVES, HOST_NODE, INJECTOR, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getChildLNode, getParentLNode, insertView, removeView } from './node_manipulation';
import { notImplemented, stringify } from './util';
import { EmbeddedViewRef, ViewRef } from './view_ref';
/**
 * If a directive is diPublic, bloomAdd sets a property on the instance with this constant as
 * the key and the directive's unique ID as the value. This allows us to map directives to their
 * bloom filter bit for DI.
 */
const NG_ELEMENT_ID = '__NG_ELEMENT_ID__';
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
const BLOOM_SIZE = 256;
/** Counter used to generate unique IDs for directives. */
let nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injector The node injector in which the directive should be registered
 * @param type The directive to register
 */
export function bloomAdd(injector, type) {
    let id = type[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = type[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    // This means that after 255, some directives will share slots, leading to some false positives
    // when checking for a directive's presence.
    const bloomBit = id % BLOOM_SIZE;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomBit;
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
export function getOrCreateNodeInjector() {
    ngDevMode && assertPreviousIsParent();
    return getOrCreateNodeInjectorForNode(getPreviousOrParentNode());
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param node for which an injector should be retrieved / created.
 * @returns Node injector
 */
export function getOrCreateNodeInjectorForNode(node) {
    const nodeInjector = node.nodeInjector;
    const parent = getParentLNode(node);
    const parentInjector = parent && parent.nodeInjector;
    if (nodeInjector != parentInjector) {
        return nodeInjector;
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
 * @param di The node injector in which a directive will be added
 * @param def The definition of the directive to be made public
 */
export function diPublicInInjector(di, def) {
    bloomAdd(di, def.type);
}
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param def The definition of the directive to be made public
 */
export function diPublic(def) {
    diPublicInInjector(getOrCreateNodeInjector(), def);
}
export function directiveInject(token, flags = 0 /* Default */) {
    return getOrCreateInjectable(getOrCreateNodeInjector(), token, flags);
}
/**
 * Creates an ElementRef and stores it on the injector.
 * Or, if the ElementRef already exists, retrieves the existing ElementRef.
 *
 * @returns The ElementRef instance to use
 */
export function injectElementRef() {
    return getOrCreateElementRef(getOrCreateNodeInjector());
}
/**
 * Creates a TemplateRef and stores it on the injector. Or, if the TemplateRef already
 * exists, retrieves the existing TemplateRef.
 *
 * @returns The TemplateRef instance to use
 */
export function injectTemplateRef() {
    return getOrCreateTemplateRef(getOrCreateNodeInjector());
}
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function injectViewContainerRef() {
    return getOrCreateContainerRef(getOrCreateNodeInjector());
}
/** Returns a ChangeDetectorRef (a.k.a. a ViewRef) */
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
 * MyComponent.ngComponentDef = defineComponent({
 *   factory: () => new MyComponent(injectAttribute('title'))
 *   ...
 * })
 * ```
 *
 * @experimental
 */
export function injectAttribute(attrNameToInject) {
    ngDevMode && assertPreviousIsParent();
    const lElement = getPreviousOrParentNode();
    ngDevMode && assertNodeType(lElement, 3 /* Element */);
    const tElement = lElement.tNode;
    ngDevMode && assertDefined(tElement, 'expecting tNode');
    const attrs = tElement.attrs;
    if (attrs) {
        for (let i = 0; i < attrs.length; i = i + 2) {
            const attrName = attrs[i];
            if (attrName === 1 /* SelectOnly */)
                break;
            if (attrName == attrNameToInject) {
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
 * @returns The ChangeDetectorRef to use
 */
export function getOrCreateChangeDetectorRef(di, context) {
    if (di.changeDetectorRef)
        return di.changeDetectorRef;
    const currentNode = di.node;
    if (isComponent(currentNode.tNode)) {
        return di.changeDetectorRef = new ViewRef(currentNode.data, context);
    }
    else if (currentNode.tNode.type === 3 /* Element */) {
        return di.changeDetectorRef = getOrCreateHostChangeDetector(currentNode.view[HOST_NODE]);
    }
    return null;
}
/** Gets or creates ChangeDetectorRef for the closest host component */
function getOrCreateHostChangeDetector(currentNode) {
    const hostNode = getClosestComponentAncestor(currentNode);
    const hostInjector = hostNode.nodeInjector;
    const existingRef = hostInjector && hostInjector.changeDetectorRef;
    return existingRef ?
        existingRef :
        new ViewRef(hostNode.data, hostNode
            .view[DIRECTIVES][hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */]);
}
/**
 * If the node is an embedded view, traverses up the view tree to return the closest
 * ancestor view that is attached to a component. If it's already a component node,
 * returns itself.
 */
function getClosestComponentAncestor(node) {
    while (node.tNode.type === 2 /* View */) {
        node = node.view[HOST_NODE];
    }
    return node;
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
 * @param di Node injector where the search should start
 * @param token The directive type to search for
 * @param flags Injection flags (e.g. CheckParent)
 * @returns The instance found
 */
export function getOrCreateInjectable(di, token, flags = 0 /* Default */) {
    const bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic). If there is no hash, fall back to the module injector.
    if (bloomHash === null) {
        const moduleInjector = getPreviousOrParentNode().view[INJECTOR];
        const formerInjector = setCurrentInjector(moduleInjector);
        try {
            return inject(token, flags);
        }
        finally {
            setCurrentInjector(formerInjector);
        }
    }
    else {
        let injector = di;
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
            const node = injector.node;
            const nodeFlags = node.tNode.flags;
            const count = nodeFlags & 4095 /* DirectiveCountMask */;
            if (count !== 0) {
                const start = nodeFlags >> 13 /* DirectiveStartingIndexShift */;
                const end = start + count;
                const defs = node.view[TVIEW].directives;
                for (let i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    const directiveDef = defs[i];
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return getDirectiveInstance(node.view[DIRECTIVES][i]);
                    }
                }
            }
            // If we *didn't* find the directive for the token and we are searching the current node's
            // injector, it's possible the directive is on this node and hasn't been created yet.
            let instance;
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
function searchMatchesQueuedForCreation(node, token) {
    const matches = node.view[TVIEW].currentMatches;
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            const def = matches[i];
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
 * @param type The directive type
 * @returns The bloom bit to check for the directive
 */
function bloomHashBit(type) {
    let id = type[NG_ELEMENT_ID];
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
 * @param injector The starting node injector to check
 * @param  bloomBit The bit to check in each injector's bloom filter
 * @param  flags The injection flags for this injection site (e.g. Optional or SkipSelf)
 * @returns An injector that might have the directive
 */
export function bloomFindPossibleInjector(startInjector, bloomBit, flags) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomBit;
    // Traverse up the injector tree until we find a potential match or until we know there *isn't* a
    // match.
    let injector = flags & 4 /* SkipSelf */ ? startInjector.parent : startInjector;
    while (injector) {
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        let value;
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
 * This is necessary to support @Host() decorators. If @Host() is set, we should stop searching once
 * the injector and its parent view don't match because it means we'd cross the view boundary.
 */
function sameHostView(injector) {
    return !!injector.parent && injector.parent.node.view === injector.node.view;
}
export class ReadFromInjectorFn {
    constructor(read) {
        this.read = read;
    }
}
/**
 * Creates an ElementRef for a given node injector and stores it on the injector.
 * Or, if the ElementRef already exists, retrieves the existing ElementRef.
 *
 * @param di The node injector where we should store a created ElementRef
 * @returns The ElementRef instance to use
 */
export function getOrCreateElementRef(di) {
    return di.elementRef || (di.elementRef = new ElementRef(di.node.native));
}
export const QUERY_READ_TEMPLATE_REF = new ReadFromInjectorFn((injector) => getOrCreateTemplateRef(injector));
export const QUERY_READ_CONTAINER_REF = new ReadFromInjectorFn((injector) => getOrCreateContainerRef(injector));
export const QUERY_READ_ELEMENT_REF = new ReadFromInjectorFn((injector) => getOrCreateElementRef(injector));
export const QUERY_READ_FROM_NODE = new ReadFromInjectorFn((injector, node, directiveIdx) => {
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */);
    if (directiveIdx > -1) {
        return node.view[DIRECTIVES][directiveIdx];
    }
    else if (node.tNode.type === 3 /* Element */) {
        return getOrCreateElementRef(injector);
    }
    else if (node.tNode.type === 0 /* Container */) {
        return getOrCreateTemplateRef(injector);
    }
    throw new Error('fail');
});
/** A ref to a node's native element. */
class ElementRef {
    constructor(nativeElement) { this.nativeElement = nativeElement; }
}
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function getOrCreateContainerRef(di) {
    if (!di.viewContainerRef) {
        const vcRefHost = di.node;
        ngDevMode && assertNodeOfPossibleTypes(vcRefHost, 0 /* Container */, 3 /* Element */);
        const hostParent = getParentLNode(vcRefHost);
        const lContainer = createLContainer(hostParent, vcRefHost.view, true);
        const comment = vcRefHost.view[RENDERER].createComment(ngDevMode ? 'container' : '');
        const lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, comment, lContainer, null);
        appendChild(hostParent, comment, vcRefHost.view);
        if (vcRefHost.queries) {
            lContainerNode.queries = vcRefHost.queries.container();
        }
        const hostTNode = vcRefHost.tNode;
        if (!hostTNode.dynamicContainerNode) {
            hostTNode.dynamicContainerNode = createTNode(0 /* Container */, -1, null, null, null, null);
        }
        lContainerNode.tNode = hostTNode.dynamicContainerNode;
        vcRefHost.dynamicLContainerNode = lContainerNode;
        lContainerNode.dynamicParent = vcRefHost;
        addToViewTree(vcRefHost.view, hostTNode.index, lContainer);
        di.viewContainerRef = new ViewContainerRef(lContainerNode);
    }
    return di.viewContainerRef;
}
/**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
class ViewContainerRef {
    constructor(_lContainerNode) {
        this._lContainerNode = _lContainerNode;
        this._viewRefs = [];
    }
    clear() {
        const lContainer = this._lContainerNode.data;
        while (lContainer[VIEWS].length) {
            this.remove(0);
        }
    }
    get(index) { return this._viewRefs[index] || null; }
    get length() {
        const lContainer = this._lContainerNode.data;
        return lContainer[VIEWS].length;
    }
    createEmbeddedView(templateRef, context, index) {
        const adjustedIdx = this._adjustIndex(index);
        const viewRef = templateRef
            .createEmbeddedView(context || {}, this._lContainerNode, adjustedIdx);
        viewRef.attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    }
    createComponent(componentFactory, index, injector, projectableNodes, ngModule) {
        throw notImplemented();
    }
    insert(viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        const lViewNode = viewRef._lViewNode;
        const adjustedIdx = this._adjustIndex(index);
        lViewNode.dynamicParent = this._lContainerNode;
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
        const views = this._lContainerNode.data[VIEWS];
        const beforeNode = adjustedIdx + 1 < views.length ?
            (getChildLNode(views[adjustedIdx + 1])).native :
            this._lContainerNode.native;
        addRemoveViewFromContainer(this._lContainerNode, lViewNode, true, beforeNode);
        viewRef.attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    }
    move(viewRef, newIndex) {
        const index = this.indexOf(viewRef);
        this.detach(index);
        this.insert(viewRef, this._adjustIndex(newIndex));
        return viewRef;
    }
    indexOf(viewRef) { return this._viewRefs.indexOf(viewRef); }
    remove(index) {
        const adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainerNode, adjustedIdx);
        this._viewRefs.splice(adjustedIdx, 1);
    }
    detach(index) {
        const adjustedIdx = this._adjustIndex(index, -1);
        const lViewNode = detachView(this._lContainerNode, adjustedIdx);
        lViewNode.dynamicParent = null;
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    }
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
/**
 * Creates a TemplateRef and stores it on the injector. Or, if the TemplateRef already
 * exists, retrieves the existing TemplateRef.
 *
 * @param di The node injector where we should store a created TemplateRef
 * @returns The TemplateRef instance to use
 */
export function getOrCreateTemplateRef(di) {
    if (!di.templateRef) {
        ngDevMode && assertNodeType(di.node, 0 /* Container */);
        const hostNode = di.node;
        const hostTNode = hostNode.tNode;
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), hostTNode.tViews, getRenderer(), hostNode.data[QUERIES]);
    }
    return di.templateRef;
}
class TemplateRef {
    constructor(elementRef, _tView, _renderer, _queries) {
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    createEmbeddedView(context, containerNode, index) {
        const viewNode = createEmbeddedViewNode(this._tView, context, this._renderer, this._queries);
        if (containerNode) {
            viewNode.dynamicParent = containerNode;
            insertView(containerNode, viewNode, index);
        }
        renderEmbeddedTemplate(viewNode, this._tView, context, 1 /* Create */);
        return new EmbeddedViewRef(viewNode, this._tView.template, context);
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUtILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFTakYsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2xRLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQU03QyxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM5RyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9JLE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQUUsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBSXBEOzs7O0dBSUc7QUFDSCxNQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUUxQzs7OztHQUlHO0FBQ0gsTUFB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O1FBQ0Qsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxpQkFBcUIsQ0FBQztRQUMzRSxPQUFPLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0YsQ0FBQztDQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIGluamVjdCwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgdmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyB2aWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBnZXREaXJlY3RpdmVJbnN0YW5jZSwgZ2V0UHJldmlvdXNPclBhcmVudE5vZGUsIGdldFJlbmRlcmVyLCBpc0NvbXBvbmVudCwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSwgcmVzb2x2ZURpcmVjdGl2ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0NvbXBvbmVudFRlbXBsYXRlLCBEaXJlY3RpdmVEZWZJbnRlcm5hbCwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIExDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMVmlld05vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgUXVlcnlSZWFkVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UmVuZGVyZXIzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtESVJFQ1RJVkVTLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldENoaWxkTE5vZGUsIGdldFBhcmVudExOb2RlLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7bm90SW1wbGVtZW50ZWQsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogSWYgYSBkaXJlY3RpdmUgaXMgZGlQdWJsaWMsIGJsb29tQWRkIHNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgaW5zdGFuY2Ugd2l0aCB0aGlzIGNvbnN0YW50IGFzXG4gKiB0aGUga2V5IGFuZCB0aGUgZGlyZWN0aXZlJ3MgdW5pcXVlIElEIGFzIHRoZSB2YWx1ZS4gVGhpcyBhbGxvd3MgdXMgdG8gbWFwIGRpcmVjdGl2ZXMgdG8gdGhlaXJcbiAqIGJsb29tIGZpbHRlciBiaXQgZm9yIERJLlxuICovXG5jb25zdCBOR19FTEVNRU5UX0lEID0gJ19fTkdfRUxFTUVOVF9JRF9fJztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIHRoZSBkaXJlY3RpdmUgc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9yOiBMSW5qZWN0b3IsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICAvLyBUaGlzIG1lYW5zIHRoYXQgYWZ0ZXIgMjU1LCBzb21lIGRpcmVjdGl2ZXMgd2lsbCBzaGFyZSBzbG90cywgbGVhZGluZyB0byBzb21lIGZhbHNlIHBvc2l0aXZlc1xuICAvLyB3aGVuIGNoZWNraW5nIGZvciBhIGRpcmVjdGl2ZSdzIHByZXNlbmNlLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICUgQkxPT01fU0laRTtcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAvLyBUaGVuIHVzZSB0aGUgbWFzayB0byBmbGlwIG9uIHRoZSBiaXQgKDAtMzEpIGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIGluIHRoYXQgYnVja2V0XG4gICAgYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gKGluamVjdG9yLmJmMCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjEgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyAoaW5qZWN0b3IuYmYyIHw9IG1hc2spIDogKGluamVjdG9yLmJmMyB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyAoaW5qZWN0b3IuYmY0IHw9IG1hc2spIDogKGluamVjdG9yLmJmNSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gKGluamVjdG9yLmJmNiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjcgfD0gbWFzaykpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpOiBMSW5qZWN0b3Ige1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBub2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShub2RlOiBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk6IExJbmplY3RvciB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IG5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnQgJiYgcGFyZW50Lm5vZGVJbmplY3RvcjtcbiAgaWYgKG5vZGVJbmplY3RvciAhPSBwYXJlbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBub2RlSW5qZWN0b3IgITtcbiAgfVxuICByZXR1cm4gbm9kZS5ub2RlSW5qZWN0b3IgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRJbmplY3RvcixcbiAgICBub2RlOiBub2RlLFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGxcbiAgfTtcbn1cblxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoZGk6IExJbmplY3RvciwgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGRpLCBkZWYudHlwZSk7XG59XG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWMoZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBkZWYpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gdHlwZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSBhbmQgcmV0dXJuc1xuICogdGhhdCBpbnN0YW5jZSBpZiBmb3VuZC5cbiAqXG4gKiBJZiBub3QgZm91bmQsIGl0IHdpbGwgcHJvcGFnYXRlIHVwIHRvIHRoZSBuZXh0IHBhcmVudCBpbmplY3RvciB1bnRpbCB0aGUgdG9rZW5cbiAqIGlzIGZvdW5kIG9yIHRoZSB0b3AgaXMgcmVhY2hlZC5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogTk9URTogdXNlIGBkaXJlY3RpdmVJbmplY3RgIHdpdGggYEBEaXJlY3RpdmVgLCBgQENvbXBvbmVudGAsIGFuZCBgQFBpcGVgLiBGb3JcbiAqIGFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIERPTSByZW5kZXIgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gVGhlIGRpcmVjdGl2ZSB0eXBlIHRvIHNlYXJjaCBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3MgKGUuZy4gQ2hlY2tQYXJlbnQpXG4gKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MuT3B0aW9uYWwpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCB0b2tlbiwgZmxhZ3MpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqIE9yLCBpZiB0aGUgRWxlbWVudFJlZiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBFbGVtZW50UmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZigpOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oKTogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKCk6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZigpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgbnVsbCk7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgbEVsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxFbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIGNvbnN0IHRFbGVtZW50ID0gbEVsZW1lbnQudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRFbGVtZW50LCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdEVsZW1lbnQuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICogT3IsIGlmIGl0IGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIGluc3RhbmNlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoXG4gICAgZGk6IExJbmplY3RvciwgY29udGV4dDogYW55KTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChkaS5jaGFuZ2VEZXRlY3RvclJlZikgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIGNvbnN0IGN1cnJlbnROb2RlID0gZGkubm9kZTtcbiAgaWYgKGlzQ29tcG9uZW50KGN1cnJlbnROb2RlLnROb2RlKSkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmKGN1cnJlbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLCBjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlLnZpZXdbSE9TVF9OT0RFXSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuLyoqIEdldHMgb3IgY3JlYXRlcyBDaGFuZ2VEZXRlY3RvclJlZiBmb3IgdGhlIGNsb3Nlc3QgaG9zdCBjb21wb25lbnQgKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOlxuICAgIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3RvcihjdXJyZW50Tm9kZSk7XG4gIGNvbnN0IGhvc3RJbmplY3RvciA9IGhvc3ROb2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgZXhpc3RpbmdSZWYgPSBob3N0SW5qZWN0b3IgJiYgaG9zdEluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIHJldHVybiBleGlzdGluZ1JlZiA/XG4gICAgICBleGlzdGluZ1JlZiA6XG4gICAgICBuZXcgVmlld1JlZihcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSxcbiAgICAgICAgICBob3N0Tm9kZVxuICAgICAgICAgICAgICAudmlld1tESVJFQ1RJVkVTXSAhW2hvc3ROb2RlLnROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0XSk7XG59XG5cbi8qKlxuICogSWYgdGhlIG5vZGUgaXMgYW4gZW1iZWRkZWQgdmlldywgdHJhdmVyc2VzIHVwIHRoZSB2aWV3IHRyZWUgdG8gcmV0dXJuIHRoZSBjbG9zZXN0XG4gKiBhbmNlc3RvciB2aWV3IHRoYXQgaXMgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuIElmIGl0J3MgYWxyZWFkeSBhIGNvbXBvbmVudCBub2RlLFxuICogcmV0dXJucyBpdHNlbGYuXG4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3Rvcihub2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOiBMRWxlbWVudE5vZGUge1xuICB3aGlsZSAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5vZGUgPSBub2RlLnZpZXdbSE9TVF9OT0RFXTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiBkaXJlY3RpdmUgdHlwZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSBhbmQgcmV0dXJuc1xuICogdGhhdCBpbnN0YW5jZSBpZiBmb3VuZC5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIGl0IGdldHMgdGhlIGJsb29tIGZpbHRlciBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgKHNlZSBibG9vbUhhc2hCaXQpLFxuICogY2hlY2tzIHRoYXQgYml0IGFnYWluc3QgdGhlIGJsb29tIGZpbHRlciBzdHJ1Y3R1cmUgdG8gaWRlbnRpZnkgYW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlXG4gKiB0aGUgZGlyZWN0aXZlIChzZWUgYmxvb21GaW5kUG9zc2libGVJbmplY3RvciksIHRoZW4gc2VhcmNoZXMgdGhlIGRpcmVjdGl2ZXMgb24gdGhhdCBpbmplY3RvclxuICogZm9yIGEgbWF0Y2guXG4gKlxuICogSWYgbm90IGZvdW5kLCBpdCB3aWxsIHByb3BhZ2F0ZSB1cCB0byB0aGUgbmV4dCBwYXJlbnQgaW5qZWN0b3IgdW50aWwgdGhlIHRva2VuXG4gKiBpcyBmb3VuZCBvciB0aGUgdG9wIGlzIHJlYWNoZWQuXG4gKlxuICogQHBhcmFtIGRpIE5vZGUgaW5qZWN0b3Igd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgZGlyZWN0aXZlIHR5cGUgdG8gc2VhcmNoIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFncyAoZS5nLiBDaGVja1BhcmVudClcbiAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIGRpOiBMSW5qZWN0b3IsIHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0KHRva2VuKTtcblxuICAvLyBJZiB0aGUgdG9rZW4gaGFzIGEgYmxvb20gaGFzaCwgdGhlbiBpdCBpcyBhIGRpcmVjdGl2ZSB0aGF0IGlzIHB1YmxpYyB0byB0aGUgaW5qZWN0aW9uIHN5c3RlbVxuICAvLyAoZGlQdWJsaWMpLiBJZiB0aGVyZSBpcyBubyBoYXNoLCBmYWxsIGJhY2sgdG8gdGhlIG1vZHVsZSBpbmplY3Rvci5cbiAgaWYgKGJsb29tSGFzaCA9PT0gbnVsbCkge1xuICAgIGNvbnN0IG1vZHVsZUluamVjdG9yID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKS52aWV3W0lOSkVDVE9SXTtcbiAgICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBpbmplY3QodG9rZW4sIGZsYWdzKTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgc2V0Q3VycmVudEluamVjdG9yKGZvcm1lckluamVjdG9yKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9IGRpO1xuXG4gICAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgICAvLyBHZXQgdGhlIGNsb3Nlc3QgcG90ZW50aWFsIG1hdGNoaW5nIGluamVjdG9yICh1cHdhcmRzIGluIHRoZSBpbmplY3RvciB0cmVlKSB0aGF0XG4gICAgICAvLyAqcG90ZW50aWFsbHkqIGhhcyB0aGUgdG9rZW4uXG4gICAgICBpbmplY3RvciA9IGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoaW5qZWN0b3IsIGJsb29tSGFzaCwgZmxhZ3MpO1xuXG4gICAgICAvLyBJZiBubyBpbmplY3RvciBpcyBmb3VuZCwgd2UgKmtub3cqIHRoYXQgdGhlcmUgaXMgbm8gYW5jZXN0b3IgaW5qZWN0b3IgdGhhdCBjb250YWlucyB0aGVcbiAgICAgIC8vIHRva2VuLCBzbyB3ZSBhYm9ydC5cbiAgICAgIGlmICghaW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IG5vZGUgPSBpbmplY3Rvci5ub2RlO1xuICAgICAgY29uc3Qgbm9kZUZsYWdzID0gbm9kZS50Tm9kZS5mbGFncztcbiAgICAgIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICAgICAgY29uc3QgZGVmcyA9IG5vZGUudmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBnZXREaXJlY3RpdmVJbnN0YW5jZShub2RlLnZpZXdbRElSRUNUSVZFU10gIVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXdbVFZJRVddLmN1cnJlbnRNYXRjaGVzO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBub2RlLnZpZXdbVFZJRVddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogR2l2ZW4gYSBkaXJlY3RpdmUgdHlwZSwgdGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRoZSBkaXJlY3RpdmUgaXMgcHJlc2VudC5cbiAqXG4gKiBXaGVuIHRoZSBkaXJlY3RpdmUgd2FzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIsIGl0IHdhcyBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBjbGFzcy4gU2luY2UgdGhlcmUgYXJlIG9ubHkgQkxPT01fU0laRSBzbG90cyBwZXIgYmxvb20gZmlsdGVyLCB0aGUgZGlyZWN0aXZlJ3NcbiAqIElEIG11c3QgYmUgbW9kdWxvLWVkIGJ5IEJMT09NX1NJWkUgdG8gZ2V0IHRoZSBjb3JyZWN0IGJsb29tIGJpdCAoZGlyZWN0aXZlcyBzaGFyZSBzbG90cyBhZnRlclxuICogQkxPT01fU0laRSBpcyByZWFjaGVkKS5cbiAqXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHR5cGVcbiAqIEByZXR1cm5zIFRoZSBibG9vbSBiaXQgdG8gY2hlY2sgZm9yIHRoZSBkaXJlY3RpdmVcbiAqL1xuZnVuY3Rpb24gYmxvb21IYXNoQml0KHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxudWxsIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gJ251bWJlcicgPyBpZCAlIEJMT09NX1NJWkUgOiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSBhIGNlcnRhaW4gZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGNvcnJlc3BvbmRzIHRvIGEgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLiBHaXZlbiB0aGUgYmxvb20gYml0IHRvXG4gKiBjaGVjayBhbmQgYSBzdGFydGluZyBpbmplY3RvciwgdGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdXAgaW5qZWN0b3JzIHVudGlsIGl0IGZpbmRzIGFuXG4gKiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgMSBmb3IgdGhhdCBiaXQgaW4gaXRzIGJsb29tIGZpbHRlci4gQSAxIGluZGljYXRlcyB0aGF0IHRoZVxuICogaW5qZWN0b3IgbWF5IGhhdmUgdGhhdCBkaXJlY3RpdmUuIEl0IG9ubHkgKm1heSogaGF2ZSB0aGUgZGlyZWN0aXZlIGJlY2F1c2UgZGlyZWN0aXZlcyBiZWdpblxuICogdG8gc2hhcmUgYmxvb20gZmlsdGVyIGJpdHMgYWZ0ZXIgdGhlIEJMT09NX1NJWkUgaXMgcmVhY2hlZCwgYW5kIGl0IGNvdWxkIGNvcnJlc3BvbmQgdG8gYVxuICogZGlmZmVyZW50IGRpcmVjdGl2ZSBzaGFyaW5nIHRoZSBiaXQuXG4gKlxuICogTm90ZTogV2UgY2FuIHNraXAgY2hlY2tpbmcgZnVydGhlciBpbmplY3RvcnMgdXAgdGhlIHRyZWUgaWYgYW4gaW5qZWN0b3IncyBjYmYgc3RydWN0dXJlXG4gKiBoYXMgYSAwIGZvciB0aGF0IGJsb29tIGJpdC4gU2luY2UgY2JmIGNvbnRhaW5zIHRoZSBtZXJnZWQgdmFsdWUgb2YgYWxsIHRoZSBwYXJlbnRcbiAqIGluamVjdG9ycywgYSAwIGluIHRoZSBibG9vbSBiaXQgaW5kaWNhdGVzIHRoYXQgdGhlIHBhcmVudHMgZGVmaW5pdGVseSBkbyBub3QgY29udGFpblxuICogdGhlIGRpcmVjdGl2ZSBhbmQgZG8gbm90IG5lZWQgdG8gYmUgY2hlY2tlZC5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIHN0YXJ0aW5nIG5vZGUgaW5qZWN0b3IgdG8gY2hlY2tcbiAqIEBwYXJhbSAgYmxvb21CaXQgVGhlIGJpdCB0byBjaGVjayBpbiBlYWNoIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiBAcGFyYW0gIGZsYWdzIFRoZSBpbmplY3Rpb24gZmxhZ3MgZm9yIHRoaXMgaW5qZWN0aW9uIHNpdGUgKGUuZy4gT3B0aW9uYWwgb3IgU2tpcFNlbGYpXG4gKiBAcmV0dXJucyBBbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgdGhlIGRpcmVjdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihcbiAgICBzdGFydEluamVjdG9yOiBMSW5qZWN0b3IsIGJsb29tQml0OiBudW1iZXIsIGZsYWdzOiBJbmplY3RGbGFncyk6IExJbmplY3RvcnxudWxsIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmUgKmlzbid0KiBhXG4gIC8vIG1hdGNoLlxuICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID1cbiAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYgPyBzdGFydEluamVjdG9yLnBhcmVudCAhIDogc3RhcnRJbmplY3RvcjtcbiAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gICAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gICAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgICBsZXQgdmFsdWU6IG51bWJlcjtcbiAgICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gaW5qZWN0b3IuYmYwIDogaW5qZWN0b3IuYmYxKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IGluamVjdG9yLmJmMiA6IGluamVjdG9yLmJmMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyBpbmplY3Rvci5iZjQgOiBpbmplY3Rvci5iZjUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyBpbmplY3Rvci5iZjYgOiBpbmplY3Rvci5iZjcpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICAgIGlmICgodmFsdWUgJiBtYXNrKSA9PT0gbWFzaykge1xuICAgICAgcmV0dXJuIGluamVjdG9yO1xuICAgIH0gZWxzZSBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5qZWN0b3IgZG9lcyBub3QgaGF2ZSB0aGUgZGlyZWN0aXZlLCBjaGVjayB0aGUgYmxvb20gZmlsdGVycyBmb3IgdGhlIGFuY2VzdG9yXG4gICAgLy8gaW5qZWN0b3JzIChjYmYwIC0gY2JmNykuIFRoZXNlIGZpbHRlcnMgY2FwdHVyZSAqYWxsKiBhbmNlc3RvciBpbmplY3RvcnMuXG4gICAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IGluamVjdG9yLmNiZjAgOiBpbmplY3Rvci5jYmYxKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IGluamVjdG9yLmNiZjIgOiBpbmplY3Rvci5jYmYzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IGluamVjdG9yLmNiZjQgOiBpbmplY3Rvci5jYmY1KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gaW5qZWN0b3IuY2JmNiA6IGluamVjdG9yLmNiZjcpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZSB1cCB0b1xuICAgIC8vIGZpbmQgdGhlIHNwZWNpZmljIGluamVjdG9yLiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIGRvZXMgbm90IGhhdmUgdGhlIGJpdCwgd2UgY2FuIGFib3J0LlxuICAgIGluamVjdG9yID0gKHZhbHVlICYgbWFzaykgPyBpbmplY3Rvci5wYXJlbnQgOiBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcoaW5qZWN0b3I6IExJbmplY3Rvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFpbmplY3Rvci5wYXJlbnQgJiYgaW5qZWN0b3IucGFyZW50Lm5vZGUudmlldyA9PT0gaW5qZWN0b3Iubm9kZS52aWV3O1xufVxuXG5leHBvcnQgY2xhc3MgUmVhZEZyb21JbmplY3RvckZuPFQ+IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcmVhZDogKGluamVjdG9yOiBMSW5qZWN0b3IsIG5vZGU6IExOb2RlLCBkaXJlY3RpdmVJbmRleD86IG51bWJlcikgPT4gVCkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZm9yIGEgZ2l2ZW4gbm9kZSBpbmplY3RvciBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqIE9yLCBpZiB0aGUgRWxlbWVudFJlZiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBFbGVtZW50UmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIEVsZW1lbnRSZWZcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gZGkuZWxlbWVudFJlZiB8fCAoZGkuZWxlbWVudFJlZiA9IG5ldyBFbGVtZW50UmVmKGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3W0RJUkVDVElWRVNdICFbZGlyZWN0aXZlSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignZmFpbCcpO1xuICAgIH0pIGFzIGFueSBhcyBRdWVyeVJlYWRUeXBlPGFueT4pO1xuXG4vKiogQSByZWYgdG8gYSBub2RlJ3MgbmF0aXZlIGVsZW1lbnQuICovXG5jbGFzcyBFbGVtZW50UmVmIGltcGxlbWVudHMgdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICBjb25zdHJ1Y3RvcihuYXRpdmVFbGVtZW50OiBhbnkpIHsgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlRWxlbWVudDsgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFkaS52aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgY29uc3QgdmNSZWZIb3N0ID0gZGkubm9kZTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHZjUmVmSG9zdCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIGNvbnN0IGhvc3RQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZSh2Y1JlZkhvc3QpICE7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoaG9zdFBhcmVudCwgdmNSZWZIb3N0LnZpZXcsIHRydWUpO1xuICAgIGNvbnN0IGNvbW1lbnQgPSB2Y1JlZkhvc3Qudmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdChcbiAgICAgICAgVE5vZGVUeXBlLkNvbnRhaW5lciwgdmNSZWZIb3N0LnZpZXcsIGhvc3RQYXJlbnQsIGNvbW1lbnQsIGxDb250YWluZXIsIG51bGwpO1xuICAgIGFwcGVuZENoaWxkKGhvc3RQYXJlbnQsIGNvbW1lbnQsIHZjUmVmSG9zdC52aWV3KTtcblxuXG4gICAgaWYgKHZjUmVmSG9zdC5xdWVyaWVzKSB7XG4gICAgICBsQ29udGFpbmVyTm9kZS5xdWVyaWVzID0gdmNSZWZIb3N0LnF1ZXJpZXMuY29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFROb2RlID0gdmNSZWZIb3N0LnROb2RlO1xuICAgIGlmICghaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSB7XG4gICAgICBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPSBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCAtMSwgbnVsbCwgbnVsbCwgbnVsbCwgbnVsbCk7XG4gICAgfVxuXG4gICAgbENvbnRhaW5lck5vZGUudE5vZGUgPSBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGU7XG4gICAgdmNSZWZIb3N0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSA9IGxDb250YWluZXJOb2RlO1xuICAgIGxDb250YWluZXJOb2RlLmR5bmFtaWNQYXJlbnQgPSB2Y1JlZkhvc3Q7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKHZjUmVmSG9zdC52aWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZXR1cm4gZGkudmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBBIHJlZiB0byBhIGNvbnRhaW5lciB0aGF0IGVuYWJsZXMgYWRkaW5nIGFuZCByZW1vdmluZyB2aWV3cyBmcm9tIHRoYXQgY29udGFpbmVyXG4gKiBpbXBlcmF0aXZlbHkuXG4gKi9cbmNsYXNzIFZpZXdDb250YWluZXJSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGVsZW1lbnQgITogdmlld0VuZ2luZV9FbGVtZW50UmVmO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgaW5qZWN0b3IgITogSW5qZWN0b3I7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwYXJlbnRJbmplY3RvciAhOiBJbmplY3RvcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUpIHt9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgd2hpbGUgKGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW1vdmUoMCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KGluZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7IHJldHVybiB0aGlzLl92aWV3UmVmc1tpbmRleF0gfHwgbnVsbDsgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICByZXR1cm4gbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuICAgIGNvbnN0IHZpZXdSZWYgPSAodGVtcGxhdGVSZWYgYXMgVGVtcGxhdGVSZWY8Qz4pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSwgdGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICAodmlld1JlZiBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgdGhyb3cgbm90SW1wbGVtZW50ZWQoKTtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLl9sVmlld05vZGU7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBsVmlld05vZGUuZHluYW1pY1BhcmVudCA9IHRoaXMuX2xDb250YWluZXJOb2RlO1xuICAgIGluc2VydFZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGxWaWV3Tm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIGNvbnN0IHZpZXdzID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YVtWSUVXU107XG4gICAgY29uc3QgYmVmb3JlTm9kZSA9IGFkanVzdGVkSWR4ICsgMSA8IHZpZXdzLmxlbmd0aCA/XG4gICAgICAgIChnZXRDaGlsZExOb2RlKHZpZXdzW2FkanVzdGVkSWR4ICsgMV0pICEpLm5hdGl2ZSA6XG4gICAgICAgIHRoaXMuX2xDb250YWluZXJOb2RlLm5hdGl2ZTtcbiAgICBhZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lcih0aGlzLl9sQ29udGFpbmVyTm9kZSwgbFZpZXdOb2RlLCB0cnVlLCBiZWZvcmVOb2RlKTtcblxuICAgICh2aWV3UmVmIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgY29uc3QgbFZpZXdOb2RlID0gZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIGxWaWV3Tm9kZS5keW5hbWljUGFyZW50ID0gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgVGVtcGxhdGVSZWZcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIWRpLnRlbXBsYXRlUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGRpLm5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gZGkubm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBob3N0Tm9kZS50Tm9kZTtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZChob3N0VE5vZGUudFZpZXdzLCAnVFZpZXcgbXVzdCBiZSBhbGxvY2F0ZWQnKTtcbiAgICBkaS50ZW1wbGF0ZVJlZiA9IG5ldyBUZW1wbGF0ZVJlZjxhbnk+KFxuICAgICAgICBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGkpLCBob3N0VE5vZGUudFZpZXdzIGFzIFRWaWV3LCBnZXRSZW5kZXJlcigpLFxuICAgICAgICBob3N0Tm9kZS5kYXRhW1FVRVJJRVNdKTtcbiAgfVxuICByZXR1cm4gZGkudGVtcGxhdGVSZWY7XG59XG5cbmNsYXNzIFRlbXBsYXRlUmVmPFQ+IGltcGxlbWVudHMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIHJlYWRvbmx5IGVsZW1lbnRSZWY6IHZpZXdFbmdpbmVfRWxlbWVudFJlZjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIGVsZW1lbnRSZWY6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiwgcHJpdmF0ZSBfdFZpZXc6IFRWaWV3LCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIzLFxuICAgICAgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCkge1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCwgY29udGFpbmVyTm9kZT86IExDb250YWluZXJOb2RlLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPSBjcmVhdGVFbWJlZGRlZFZpZXdOb2RlKHRoaXMuX3RWaWV3LCBjb250ZXh0LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICAgIHZpZXdOb2RlLmR5bmFtaWNQYXJlbnQgPSBjb250YWluZXJOb2RlO1xuICAgICAgaW5zZXJ0Vmlldyhjb250YWluZXJOb2RlLCB2aWV3Tm9kZSwgaW5kZXggISk7XG4gICAgfVxuICAgIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUodmlld05vZGUsIHRoaXMuX3RWaWV3LCBjb250ZXh0LCBSZW5kZXJGbGFncy5DcmVhdGUpO1xuICAgIHJldHVybiBuZXcgRW1iZWRkZWRWaWV3UmVmKHZpZXdOb2RlLCB0aGlzLl90Vmlldy50ZW1wbGF0ZSAhYXMgQ29tcG9uZW50VGVtcGxhdGU8VD4sIGNvbnRleHQpO1xuICB9XG59XG4iXX0=