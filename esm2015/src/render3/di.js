/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, setCurrentInjector } from '../di/injector';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { ComponentFactoryResolver } from './component_ref';
import { addToViewTree, assertPreviousIsParent, createEmbeddedViewNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { VIEWS } from './interfaces/container';
import { DIRECTIVES, HOST_NODE, INJECTOR, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getChildLNode, getParentLNode, insertView, removeView } from './node_manipulation';
import { stringify } from './util';
import { ViewRef } from './view_ref';
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
        changeDetectorRef: null,
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
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @returns The ComponentFactoryResolver instance to use
 */
export function injectComponentFactoryResolver() {
    return componentFactoryResolver;
}
const componentFactoryResolver = new ComponentFactoryResolver();
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
            .view[DIRECTIVES][hostNode.tNode.flags >> 14 /* DirectiveStartingIndexShift */]);
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
                const start = nodeFlags >> 14 /* DirectiveStartingIndexShift */;
                const end = start + count;
                const defs = node.view[TVIEW].directives;
                for (let i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    const directiveDef = defs[i];
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return node.view[DIRECTIVES][i];
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
            hostTNode.dynamicContainerNode =
                createTNode(0 /* Container */, -1, null, null, hostTNode, null);
        }
        lContainerNode.tNode = hostTNode.dynamicContainerNode;
        vcRefHost.dynamicLContainerNode = lContainerNode;
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
    createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
        const contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && contextInjector) {
            ngModuleRef = contextInjector.get(viewEngine_NgModuleRef);
        }
        const componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    }
    insert(viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        const lViewNode = viewRef._lViewNode;
        const adjustedIdx = this._adjustIndex(index);
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
            insertView(containerNode, viewNode, index);
        }
        renderEmbeddedTemplate(viewNode, this._tView, context, 1 /* Create */);
        const viewRef = new ViewRef(viewNode.data, context);
        viewRef._lViewNode = viewNode;
        return viewRef;
    }
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUtILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFJakYsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBTWxGLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFFLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxhQUFhLEVBQUUsc0JBQXNCLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLEVBQUUsV0FBVyxFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUM1TyxPQUFPLEVBQUMsS0FBSyxFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFNN0MsT0FBTyxFQUFDLFVBQVUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFhLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDOUcsT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvSSxPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2pDLE9BQU8sRUFBQyxPQUFPLEVBQUMsTUFBTSxZQUFZLENBQUM7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YUFBUSxHQUFSLFFBQVEsQ0FBZTtRQUNqQyxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUMvQixDQUFDO0lBRUQsa0JBQWtCLENBQUMsT0FBVSxFQUFFLGFBQThCLEVBQUUsS0FBYztRQUUzRSxNQUFNLFFBQVEsR0FBRyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUM3RixJQUFJLGFBQWEsRUFBRTtZQUNqQixVQUFVLENBQUMsYUFBYSxFQUFFLFFBQVEsRUFBRSxLQUFPLENBQUMsQ0FBQztTQUM5QztRQUNELHNCQUFzQixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8saUJBQXFCLENBQUM7UUFDM0UsTUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRCxPQUFPLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztRQUM5QixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0NBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSwgZ2V0UmVuZGVyZXIsIGlzQ29tcG9uZW50LCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlLCByZXNvbHZlRGlyZWN0aXZlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1ZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWwsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFZpZXdOb2RlLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7RElSRUNUSVZFUywgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBnZXRDaGlsZExOb2RlLCBnZXRQYXJlbnRMTm9kZSwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge3N0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIElmIGEgZGlyZWN0aXZlIGlzIGRpUHVibGljLCBibG9vbUFkZCBzZXRzIGEgcHJvcGVydHkgb24gdGhlIGluc3RhbmNlIHdpdGggdGhpcyBjb25zdGFudCBhc1xuICogdGhlIGtleSBhbmQgdGhlIGRpcmVjdGl2ZSdzIHVuaXF1ZSBJRCBhcyB0aGUgdmFsdWUuIFRoaXMgYWxsb3dzIHVzIHRvIG1hcCBkaXJlY3RpdmVzIHRvIHRoZWlyXG4gKiBibG9vbSBmaWx0ZXIgYml0IGZvciBESS5cbiAqL1xuY29uc3QgTkdfRUxFTUVOVF9JRCA9ICdfX05HX0VMRU1FTlRfSURfXyc7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCB0aGUgZGlyZWN0aXZlIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChpbmplY3RvcjogTEluamVjdG9yLCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgLy8gVGhpcyBtZWFucyB0aGF0IGFmdGVyIDI1NSwgc29tZSBkaXJlY3RpdmVzIHdpbGwgc2hhcmUgc2xvdHMsIGxlYWRpbmcgdG8gc29tZSBmYWxzZSBwb3NpdGl2ZXNcbiAgLy8gd2hlbiBjaGVja2luZyBmb3IgYSBkaXJlY3RpdmUncyBwcmVzZW5jZS5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAlIEJMT09NX1NJWkU7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgLy8gVGhlbiB1c2UgdGhlIG1hc2sgdG8gZmxpcCBvbiB0aGUgYml0ICgwLTMxKSBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSBpbiB0aGF0IGJ1Y2tldFxuICAgIGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IChpbmplY3Rvci5iZjAgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYxIHw9IG1hc2spKSA6XG4gICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gKGluamVjdG9yLmJmMiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjMgfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gKGluamVjdG9yLmJmNCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjUgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IChpbmplY3Rvci5iZjYgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY3IHw9IG1hc2spKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogTEluamVjdG9yIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpOiBMSW5qZWN0b3Ige1xuICBjb25zdCBub2RlSW5qZWN0b3IgPSBub2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gIGNvbnN0IHBhcmVudEluamVjdG9yID0gcGFyZW50ICYmIHBhcmVudC5ub2RlSW5qZWN0b3I7XG4gIGlmIChub2RlSW5qZWN0b3IgIT0gcGFyZW50SW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbm9kZUluamVjdG9yICE7XG4gIH1cbiAgcmV0dXJuIG5vZGUubm9kZUluamVjdG9yID0ge1xuICAgIHBhcmVudDogcGFyZW50SW5qZWN0b3IsXG4gICAgbm9kZTogbm9kZSxcbiAgICBiZjA6IDAsXG4gICAgYmYxOiAwLFxuICAgIGJmMjogMCxcbiAgICBiZjM6IDAsXG4gICAgYmY0OiAwLFxuICAgIGJmNTogMCxcbiAgICBiZjY6IDAsXG4gICAgYmY3OiAwLFxuICAgIGNiZjA6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMCB8IHBhcmVudEluamVjdG9yLmJmMCxcbiAgICBjYmYxOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjEgfCBwYXJlbnRJbmplY3Rvci5iZjEsXG4gICAgY2JmMjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYyIHwgcGFyZW50SW5qZWN0b3IuYmYyLFxuICAgIGNiZjM6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMyB8IHBhcmVudEluamVjdG9yLmJmMyxcbiAgICBjYmY0OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjQgfCBwYXJlbnRJbmplY3Rvci5iZjQsXG4gICAgY2JmNTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY1IHwgcGFyZW50SW5qZWN0b3IuYmY1LFxuICAgIGNiZjY6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNiB8IHBhcmVudEluamVjdG9yLmJmNixcbiAgICBjYmY3OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjcgfCBwYXJlbnRJbmplY3Rvci5iZjcsXG4gICAgdGVtcGxhdGVSZWY6IG51bGwsXG4gICAgdmlld0NvbnRhaW5lclJlZjogbnVsbCxcbiAgICBlbGVtZW50UmVmOiBudWxsLFxuICAgIGNoYW5nZURldGVjdG9yUmVmOiBudWxsLFxuICB9O1xufVxuXG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljSW5JbmplY3RvcihkaTogTEluamVjdG9yLCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoZGksIGRlZi50eXBlKTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpYyhkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIGRlZik7XG59XG5cbi8qKlxuICogU2VhcmNoZXMgZm9yIGFuIGluc3RhbmNlIG9mIHRoZSBnaXZlbiB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBOT1RFOiB1c2UgYGRpcmVjdGl2ZUluamVjdGAgd2l0aCBgQERpcmVjdGl2ZWAsIGBAQ29tcG9uZW50YCwgYW5kIGBAUGlwZWAuIEZvclxuICogYWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgRE9NIHJlbmRlciB0cmVlLlxuICpcbiAqIEBwYXJhbSB0b2tlbiBUaGUgZGlyZWN0aXZlIHR5cGUgdG8gc2VhcmNoIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFncyAoZS5nLiBDaGVja1BhcmVudClcbiAqIEByZXR1cm5zIFRoZSBpbnN0YW5jZSBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncy5PcHRpb25hbCk6IFR8bnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIGNvbnN0IGxFbGVtZW50ID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCB0RWxlbWVudCA9IGxFbGVtZW50LnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0RWxlbWVudCwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHRFbGVtZW50LmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqIE9yLCBpZiBpdCBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBpbnN0YW5jZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKFxuICAgIGRpOiBMSW5qZWN0b3IsIGNvbnRleHQ6IGFueSk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoZGkuY2hhbmdlRGV0ZWN0b3JSZWYpIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICBjb25zdCBjdXJyZW50Tm9kZSA9IGRpLm5vZGU7XG4gIGlmIChpc0NvbXBvbmVudChjdXJyZW50Tm9kZS50Tm9kZSkpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgVmlld1JlZihjdXJyZW50Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSwgY29udGV4dCk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZS52aWV3W0hPU1RfTk9ERV0pO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTpcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3IoY3VycmVudE5vZGUpO1xuICBjb25zdCBob3N0SW5qZWN0b3IgPSBob3N0Tm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IGV4aXN0aW5nUmVmID0gaG9zdEluamVjdG9yICYmIGhvc3RJbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICByZXR1cm4gZXhpc3RpbmdSZWYgP1xuICAgICAgZXhpc3RpbmdSZWYgOlxuICAgICAgbmV3IFZpZXdSZWYoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsXG4gICAgICAgICAgaG9zdE5vZGVcbiAgICAgICAgICAgICAgLnZpZXdbRElSRUNUSVZFU10gIVtob3N0Tm9kZS50Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdF0pO1xufVxuXG4vKipcbiAqIElmIHRoZSBub2RlIGlzIGFuIGVtYmVkZGVkIHZpZXcsIHRyYXZlcnNlcyB1cCB0aGUgdmlldyB0cmVlIHRvIHJldHVybiB0aGUgY2xvc2VzdFxuICogYW5jZXN0b3IgdmlldyB0aGF0IGlzIGF0dGFjaGVkIHRvIGEgY29tcG9uZW50LiBJZiBpdCdzIGFscmVhZHkgYSBjb21wb25lbnQgbm9kZSxcbiAqIHJldHVybnMgaXRzZWxmLlxuICovXG5mdW5jdGlvbiBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3Iobm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTogTEVsZW1lbnROb2RlIHtcbiAgd2hpbGUgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBub2RlID0gbm9kZS52aWV3W0hPU1RfTk9ERV07XG4gIH1cbiAgcmV0dXJuIG5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gZGlyZWN0aXZlIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogU3BlY2lmaWNhbGx5LCBpdCBnZXRzIHRoZSBibG9vbSBmaWx0ZXIgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIChzZWUgYmxvb21IYXNoQml0KSxcbiAqIGNoZWNrcyB0aGF0IGJpdCBhZ2FpbnN0IHRoZSBibG9vbSBmaWx0ZXIgc3RydWN0dXJlIHRvIGlkZW50aWZ5IGFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZVxuICogdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IpLCB0aGVuIHNlYXJjaGVzIHRoZSBkaXJlY3RpdmVzIG9uIHRoYXQgaW5qZWN0b3JcbiAqIGZvciBhIG1hdGNoLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIEBwYXJhbSBkaSBOb2RlIGluamVjdG9yIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gdG9rZW4gVGhlIGRpcmVjdGl2ZSB0eXBlIHRvIHNlYXJjaCBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3MgKGUuZy4gQ2hlY2tQYXJlbnQpXG4gKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICBkaTogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdCh0b2tlbik7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKS4gSWYgdGhlcmUgaXMgbm8gaGFzaCwgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggPT09IG51bGwpIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkudmlld1tJTkpFQ1RPUl07XG4gICAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBkaTtcblxuICAgIHdoaWxlIChpbmplY3Rvcikge1xuICAgICAgLy8gR2V0IHRoZSBjbG9zZXN0IHBvdGVudGlhbCBtYXRjaGluZyBpbmplY3RvciAodXB3YXJkcyBpbiB0aGUgaW5qZWN0b3IgdHJlZSkgdGhhdFxuICAgICAgLy8gKnBvdGVudGlhbGx5KiBoYXMgdGhlIHRva2VuLlxuICAgICAgaW5qZWN0b3IgPSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKGluamVjdG9yLCBibG9vbUhhc2gsIGZsYWdzKTtcblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBjb25zdCBub2RlID0gaW5qZWN0b3Iubm9kZTtcbiAgICAgIGNvbnN0IG5vZGVGbGFncyA9IG5vZGUudE5vZGUuZmxhZ3M7XG4gICAgICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgICBpZiAoY291bnQgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgICAgIGNvbnN0IGRlZnMgPSBub2RlLnZpZXdbVFZJRVddLmRpcmVjdGl2ZXMgITtcblxuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgIC8vIEdldCB0aGUgZGVmaW5pdGlvbiBmb3IgdGhlIGRpcmVjdGl2ZSBhdCB0aGlzIGluZGV4IGFuZCwgaWYgaXQgaXMgaW5qZWN0YWJsZSAoZGlQdWJsaWMpLFxuICAgICAgICAgIC8vIGFuZCBtYXRjaGVzIHRoZSBnaXZlbiB0b2tlbiwgcmV0dXJuIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgICAgICByZXR1cm4gbm9kZS52aWV3W0RJUkVDVElWRVNdICFbaV07XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXdbVFZJRVddLmN1cnJlbnRNYXRjaGVzO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBub2RlLnZpZXdbVFZJRVddKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogR2l2ZW4gYSBkaXJlY3RpdmUgdHlwZSwgdGhpcyBmdW5jdGlvbiByZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90IHRoZSBkaXJlY3RpdmUgaXMgcHJlc2VudC5cbiAqXG4gKiBXaGVuIHRoZSBkaXJlY3RpdmUgd2FzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIsIGl0IHdhcyBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBjbGFzcy4gU2luY2UgdGhlcmUgYXJlIG9ubHkgQkxPT01fU0laRSBzbG90cyBwZXIgYmxvb20gZmlsdGVyLCB0aGUgZGlyZWN0aXZlJ3NcbiAqIElEIG11c3QgYmUgbW9kdWxvLWVkIGJ5IEJMT09NX1NJWkUgdG8gZ2V0IHRoZSBjb3JyZWN0IGJsb29tIGJpdCAoZGlyZWN0aXZlcyBzaGFyZSBzbG90cyBhZnRlclxuICogQkxPT01fU0laRSBpcyByZWFjaGVkKS5cbiAqXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHR5cGVcbiAqIEByZXR1cm5zIFRoZSBibG9vbSBiaXQgdG8gY2hlY2sgZm9yIHRoZSBkaXJlY3RpdmVcbiAqL1xuZnVuY3Rpb24gYmxvb21IYXNoQml0KHR5cGU6IFR5cGU8YW55Pik6IG51bWJlcnxudWxsIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gJ251bWJlcicgPyBpZCAlIEJMT09NX1NJWkUgOiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSBhIGNlcnRhaW4gZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGNvcnJlc3BvbmRzIHRvIGEgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLiBHaXZlbiB0aGUgYmxvb20gYml0IHRvXG4gKiBjaGVjayBhbmQgYSBzdGFydGluZyBpbmplY3RvciwgdGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdXAgaW5qZWN0b3JzIHVudGlsIGl0IGZpbmRzIGFuXG4gKiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgMSBmb3IgdGhhdCBiaXQgaW4gaXRzIGJsb29tIGZpbHRlci4gQSAxIGluZGljYXRlcyB0aGF0IHRoZVxuICogaW5qZWN0b3IgbWF5IGhhdmUgdGhhdCBkaXJlY3RpdmUuIEl0IG9ubHkgKm1heSogaGF2ZSB0aGUgZGlyZWN0aXZlIGJlY2F1c2UgZGlyZWN0aXZlcyBiZWdpblxuICogdG8gc2hhcmUgYmxvb20gZmlsdGVyIGJpdHMgYWZ0ZXIgdGhlIEJMT09NX1NJWkUgaXMgcmVhY2hlZCwgYW5kIGl0IGNvdWxkIGNvcnJlc3BvbmQgdG8gYVxuICogZGlmZmVyZW50IGRpcmVjdGl2ZSBzaGFyaW5nIHRoZSBiaXQuXG4gKlxuICogTm90ZTogV2UgY2FuIHNraXAgY2hlY2tpbmcgZnVydGhlciBpbmplY3RvcnMgdXAgdGhlIHRyZWUgaWYgYW4gaW5qZWN0b3IncyBjYmYgc3RydWN0dXJlXG4gKiBoYXMgYSAwIGZvciB0aGF0IGJsb29tIGJpdC4gU2luY2UgY2JmIGNvbnRhaW5zIHRoZSBtZXJnZWQgdmFsdWUgb2YgYWxsIHRoZSBwYXJlbnRcbiAqIGluamVjdG9ycywgYSAwIGluIHRoZSBibG9vbSBiaXQgaW5kaWNhdGVzIHRoYXQgdGhlIHBhcmVudHMgZGVmaW5pdGVseSBkbyBub3QgY29udGFpblxuICogdGhlIGRpcmVjdGl2ZSBhbmQgZG8gbm90IG5lZWQgdG8gYmUgY2hlY2tlZC5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIHN0YXJ0aW5nIG5vZGUgaW5qZWN0b3IgdG8gY2hlY2tcbiAqIEBwYXJhbSAgYmxvb21CaXQgVGhlIGJpdCB0byBjaGVjayBpbiBlYWNoIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiBAcGFyYW0gIGZsYWdzIFRoZSBpbmplY3Rpb24gZmxhZ3MgZm9yIHRoaXMgaW5qZWN0aW9uIHNpdGUgKGUuZy4gT3B0aW9uYWwgb3IgU2tpcFNlbGYpXG4gKiBAcmV0dXJucyBBbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgdGhlIGRpcmVjdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihcbiAgICBzdGFydEluamVjdG9yOiBMSW5qZWN0b3IsIGJsb29tQml0OiBudW1iZXIsIGZsYWdzOiBJbmplY3RGbGFncyk6IExJbmplY3RvcnxudWxsIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmUgKmlzbid0KiBhXG4gIC8vIG1hdGNoLlxuICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID1cbiAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYgPyBzdGFydEluamVjdG9yLnBhcmVudCAhIDogc3RhcnRJbmplY3RvcjtcbiAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gICAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gICAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgICBsZXQgdmFsdWU6IG51bWJlcjtcbiAgICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gaW5qZWN0b3IuYmYwIDogaW5qZWN0b3IuYmYxKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IGluamVjdG9yLmJmMiA6IGluamVjdG9yLmJmMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyBpbmplY3Rvci5iZjQgOiBpbmplY3Rvci5iZjUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyBpbmplY3Rvci5iZjYgOiBpbmplY3Rvci5iZjcpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICAgIGlmICgodmFsdWUgJiBtYXNrKSA9PT0gbWFzaykge1xuICAgICAgcmV0dXJuIGluamVjdG9yO1xuICAgIH0gZWxzZSBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5qZWN0b3IgZG9lcyBub3QgaGF2ZSB0aGUgZGlyZWN0aXZlLCBjaGVjayB0aGUgYmxvb20gZmlsdGVycyBmb3IgdGhlIGFuY2VzdG9yXG4gICAgLy8gaW5qZWN0b3JzIChjYmYwIC0gY2JmNykuIFRoZXNlIGZpbHRlcnMgY2FwdHVyZSAqYWxsKiBhbmNlc3RvciBpbmplY3RvcnMuXG4gICAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IGluamVjdG9yLmNiZjAgOiBpbmplY3Rvci5jYmYxKSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IGluamVjdG9yLmNiZjIgOiBpbmplY3Rvci5jYmYzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IGluamVjdG9yLmNiZjQgOiBpbmplY3Rvci5jYmY1KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gaW5qZWN0b3IuY2JmNiA6IGluamVjdG9yLmNiZjcpO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZSB1cCB0b1xuICAgIC8vIGZpbmQgdGhlIHNwZWNpZmljIGluamVjdG9yLiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIGRvZXMgbm90IGhhdmUgdGhlIGJpdCwgd2UgY2FuIGFib3J0LlxuICAgIGluamVjdG9yID0gKHZhbHVlICYgbWFzaykgPyBpbmplY3Rvci5wYXJlbnQgOiBudWxsO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcoaW5qZWN0b3I6IExJbmplY3Rvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFpbmplY3Rvci5wYXJlbnQgJiYgaW5qZWN0b3IucGFyZW50Lm5vZGUudmlldyA9PT0gaW5qZWN0b3Iubm9kZS52aWV3O1xufVxuXG5leHBvcnQgY2xhc3MgUmVhZEZyb21JbmplY3RvckZuPFQ+IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcmVhZDogKGluamVjdG9yOiBMSW5qZWN0b3IsIG5vZGU6IExOb2RlLCBkaXJlY3RpdmVJbmRleD86IG51bWJlcikgPT4gVCkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZm9yIGEgZ2l2ZW4gbm9kZSBpbmplY3RvciBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqIE9yLCBpZiB0aGUgRWxlbWVudFJlZiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBFbGVtZW50UmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIEVsZW1lbnRSZWZcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gZGkuZWxlbWVudFJlZiB8fCAoZGkuZWxlbWVudFJlZiA9IG5ldyBFbGVtZW50UmVmKGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3W0RJUkVDVElWRVNdICFbZGlyZWN0aXZlSWR4XTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKTtcbiAgICAgIH0gZWxzZSBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKTtcbiAgICAgIH1cbiAgICAgIHRocm93IG5ldyBFcnJvcignZmFpbCcpO1xuICAgIH0pIGFzIGFueSBhcyBRdWVyeVJlYWRUeXBlPGFueT4pO1xuXG4vKiogQSByZWYgdG8gYSBub2RlJ3MgbmF0aXZlIGVsZW1lbnQuICovXG5jbGFzcyBFbGVtZW50UmVmIGltcGxlbWVudHMgdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuICBjb25zdHJ1Y3RvcihuYXRpdmVFbGVtZW50OiBhbnkpIHsgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlRWxlbWVudDsgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgaWYgKCFkaS52aWV3Q29udGFpbmVyUmVmKSB7XG4gICAgY29uc3QgdmNSZWZIb3N0ID0gZGkubm9kZTtcblxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKHZjUmVmSG9zdCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICAgIGNvbnN0IGhvc3RQYXJlbnQgPSBnZXRQYXJlbnRMTm9kZSh2Y1JlZkhvc3QpICE7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoaG9zdFBhcmVudCwgdmNSZWZIb3N0LnZpZXcsIHRydWUpO1xuICAgIGNvbnN0IGNvbW1lbnQgPSB2Y1JlZkhvc3Qudmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdChcbiAgICAgICAgVE5vZGVUeXBlLkNvbnRhaW5lciwgdmNSZWZIb3N0LnZpZXcsIGhvc3RQYXJlbnQsIGNvbW1lbnQsIGxDb250YWluZXIsIG51bGwpO1xuICAgIGFwcGVuZENoaWxkKGhvc3RQYXJlbnQsIGNvbW1lbnQsIHZjUmVmSG9zdC52aWV3KTtcblxuXG4gICAgaWYgKHZjUmVmSG9zdC5xdWVyaWVzKSB7XG4gICAgICBsQ29udGFpbmVyTm9kZS5xdWVyaWVzID0gdmNSZWZIb3N0LnF1ZXJpZXMuY29udGFpbmVyKCk7XG4gICAgfVxuXG4gICAgY29uc3QgaG9zdFROb2RlID0gdmNSZWZIb3N0LnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlO1xuICAgIGlmICghaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSB7XG4gICAgICBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPVxuICAgICAgICAgIGNyZWF0ZVROb2RlKFROb2RlVHlwZS5Db250YWluZXIsIC0xLCBudWxsLCBudWxsLCBob3N0VE5vZGUsIG51bGwpO1xuICAgIH1cblxuICAgIGxDb250YWluZXJOb2RlLnROb2RlID0gaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlO1xuICAgIHZjUmVmSG9zdC5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcblxuICAgIGFkZFRvVmlld1RyZWUodmNSZWZIb3N0LnZpZXcsIGhvc3RUTm9kZS5pbmRleCBhcyBudW1iZXIsIGxDb250YWluZXIpO1xuXG4gICAgZGkudmlld0NvbnRhaW5lclJlZiA9IG5ldyBWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXJOb2RlKTtcbiAgfVxuXG4gIHJldHVybiBkaS52aWV3Q29udGFpbmVyUmVmO1xufVxuXG4vKipcbiAqIEEgcmVmIHRvIGEgY29udGFpbmVyIHRoYXQgZW5hYmxlcyBhZGRpbmcgYW5kIHJlbW92aW5nIHZpZXdzIGZyb20gdGhhdCBjb250YWluZXJcbiAqIGltcGVyYXRpdmVseS5cbiAqL1xuY2xhc3MgVmlld0NvbnRhaW5lclJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIHByaXZhdGUgX3ZpZXdSZWZzOiB2aWV3RW5naW5lX1ZpZXdSZWZbXSA9IFtdO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgZWxlbWVudCAhOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBpbmplY3RvciAhOiBJbmplY3RvcjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIHBhcmVudEluamVjdG9yICE6IEluamVjdG9yO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSkge31cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICB3aGlsZSAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBUZW1wbGF0ZVJlZjxDPilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fbFZpZXdOb2RlICE7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICBjb25zdCB2aWV3cyA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBhZGp1c3RlZElkeCArIDEgPCB2aWV3cy5sZW5ndGggP1xuICAgICAgICAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1thZGp1c3RlZElkeCArIDFdKSAhKS5uYXRpdmUgOlxuICAgICAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodGhpcy5fbENvbnRhaW5lck5vZGUsIGxWaWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICB9XG5cbiAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBjb25zdCBsVmlld05vZGUgPSBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YVtWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIFRlbXBsYXRlUmVmXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgaWYgKCFkaS50ZW1wbGF0ZVJlZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShkaS5ub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBob3N0Tm9kZSA9IGRpLm5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gaG9zdE5vZGUudE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgZGkudGVtcGxhdGVSZWYgPSBuZXcgVGVtcGxhdGVSZWY8YW55PihcbiAgICAgICAgZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpKSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldywgZ2V0UmVuZGVyZXIoKSxcbiAgICAgICAgaG9zdE5vZGUuZGF0YVtRVUVSSUVTXSk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICAgIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwpIHtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQsIGNvbnRhaW5lck5vZGU/OiBMQ29udGFpbmVyTm9kZSwgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgIGNvbnN0IHZpZXdOb2RlID0gY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSh0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fcmVuZGVyZXIsIHRoaXMuX3F1ZXJpZXMpO1xuICAgIGlmIChjb250YWluZXJOb2RlKSB7XG4gICAgICBpbnNlcnRWaWV3KGNvbnRhaW5lck5vZGUsIHZpZXdOb2RlLCBpbmRleCAhKTtcbiAgICB9XG4gICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSh2aWV3Tm9kZSwgdGhpcy5fdFZpZXcsIGNvbnRleHQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKHZpZXdOb2RlLmRhdGEsIGNvbnRleHQpO1xuICAgIHZpZXdSZWYuX2xWaWV3Tm9kZSA9IHZpZXdOb2RlO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG59XG4iXX0=