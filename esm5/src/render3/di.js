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
var NG_ELEMENT_ID = '__NG_ELEMENT_ID__';
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
var BLOOM_SIZE = 256;
/** Counter used to generate unique IDs for directives. */
var nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injector The node injector in which the directive should be registered
 * @param type The directive to register
 */
export function bloomAdd(injector, type) {
    var id = type[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = type[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    // This means that after 255, some directives will share slots, leading to some false positives
    // when checking for a directive's presence.
    var bloomBit = id % BLOOM_SIZE;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var mask = 1 << bloomBit;
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
    var nodeInjector = node.nodeInjector;
    var parent = getParentLNode(node);
    var parentInjector = parent && parent.nodeInjector;
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
export function directiveInject(token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
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
    var lElement = getPreviousOrParentNode();
    ngDevMode && assertNodeType(lElement, 3 /* Element */);
    var tElement = lElement.tNode;
    ngDevMode && assertDefined(tElement, 'expecting tNode');
    var attrs = tElement.attrs;
    if (attrs) {
        for (var i = 0; i < attrs.length; i = i + 2) {
            var attrName = attrs[i];
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
    var currentNode = di.node;
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
    var hostNode = getClosestComponentAncestor(currentNode);
    var hostInjector = hostNode.nodeInjector;
    var existingRef = hostInjector && hostInjector.changeDetectorRef;
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
export function getOrCreateInjectable(di, token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic). If there is no hash, fall back to the module injector.
    if (bloomHash === null) {
        var moduleInjector = getPreviousOrParentNode().view[INJECTOR];
        var formerInjector = setCurrentInjector(moduleInjector);
        try {
            return inject(token, flags);
        }
        finally {
            setCurrentInjector(formerInjector);
        }
    }
    else {
        var injector = di;
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
            var node = injector.node;
            var nodeFlags = node.tNode.flags;
            var count = nodeFlags & 4095 /* DirectiveCountMask */;
            if (count !== 0) {
                var start = nodeFlags >> 13 /* DirectiveStartingIndexShift */;
                var end = start + count;
                var defs = node.view[TVIEW].directives;
                for (var i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    var directiveDef = defs[i];
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return getDirectiveInstance(node.view[DIRECTIVES][i]);
                    }
                }
            }
            // If we *didn't* find the directive for the token and we are searching the current node's
            // injector, it's possible the directive is on this node and hasn't been created yet.
            var instance = void 0;
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
    throw new Error("Injector: NOT_FOUND [" + stringify(token) + "]");
}
function searchMatchesQueuedForCreation(node, token) {
    var matches = node.view[TVIEW].currentMatches;
    if (matches) {
        for (var i = 0; i < matches.length; i += 2) {
            var def = matches[i];
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
    var id = type[NG_ELEMENT_ID];
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
    var mask = 1 << bloomBit;
    // Traverse up the injector tree until we find a potential match or until we know there *isn't* a
    // match.
    var injector = flags & 4 /* SkipSelf */ ? startInjector.parent : startInjector;
    while (injector) {
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        var value = void 0;
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
var ReadFromInjectorFn = /** @class */ (function () {
    function ReadFromInjectorFn(read) {
        this.read = read;
    }
    return ReadFromInjectorFn;
}());
export { ReadFromInjectorFn };
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
export var QUERY_READ_TEMPLATE_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateTemplateRef(injector); });
export var QUERY_READ_CONTAINER_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateContainerRef(injector); });
export var QUERY_READ_ELEMENT_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateElementRef(injector); });
export var QUERY_READ_FROM_NODE = new ReadFromInjectorFn(function (injector, node, directiveIdx) {
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
var ElementRef = /** @class */ (function () {
    function ElementRef(nativeElement) {
        this.nativeElement = nativeElement;
    }
    return ElementRef;
}());
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function getOrCreateContainerRef(di) {
    if (!di.viewContainerRef) {
        var vcRefHost = di.node;
        ngDevMode && assertNodeOfPossibleTypes(vcRefHost, 0 /* Container */, 3 /* Element */);
        var hostParent = getParentLNode(vcRefHost);
        var lContainer = createLContainer(hostParent, vcRefHost.view, true);
        var comment = vcRefHost.view[RENDERER].createComment(ngDevMode ? 'container' : '');
        var lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, comment, lContainer, null);
        appendChild(hostParent, comment, vcRefHost.view);
        if (vcRefHost.queries) {
            lContainerNode.queries = vcRefHost.queries.container();
        }
        var hostTNode = vcRefHost.tNode;
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
var ViewContainerRef = /** @class */ (function () {
    function ViewContainerRef(_lContainerNode) {
        this._lContainerNode = _lContainerNode;
        this._viewRefs = [];
    }
    ViewContainerRef.prototype.clear = function () {
        var lContainer = this._lContainerNode.data;
        while (lContainer[VIEWS].length) {
            this.remove(0);
        }
    };
    ViewContainerRef.prototype.get = function (index) { return this._viewRefs[index] || null; };
    Object.defineProperty(ViewContainerRef.prototype, "length", {
        get: function () {
            var lContainer = this._lContainerNode.data;
            return lContainer[VIEWS].length;
        },
        enumerable: true,
        configurable: true
    });
    ViewContainerRef.prototype.createEmbeddedView = function (templateRef, context, index) {
        var adjustedIdx = this._adjustIndex(index);
        var viewRef = templateRef
            .createEmbeddedView(context || {}, this._lContainerNode, adjustedIdx);
        viewRef.attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    };
    ViewContainerRef.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModule) {
        throw notImplemented();
    };
    ViewContainerRef.prototype.insert = function (viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        var lViewNode = viewRef._lViewNode;
        var adjustedIdx = this._adjustIndex(index);
        lViewNode.dynamicParent = this._lContainerNode;
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
        var views = this._lContainerNode.data[VIEWS];
        var beforeNode = adjustedIdx + 1 < views.length ?
            (getChildLNode(views[adjustedIdx + 1])).native :
            this._lContainerNode.native;
        addRemoveViewFromContainer(this._lContainerNode, lViewNode, true, beforeNode);
        viewRef.attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    };
    ViewContainerRef.prototype.move = function (viewRef, newIndex) {
        var index = this.indexOf(viewRef);
        this.detach(index);
        this.insert(viewRef, this._adjustIndex(newIndex));
        return viewRef;
    };
    ViewContainerRef.prototype.indexOf = function (viewRef) { return this._viewRefs.indexOf(viewRef); };
    ViewContainerRef.prototype.remove = function (index) {
        var adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainerNode, adjustedIdx);
        this._viewRefs.splice(adjustedIdx, 1);
    };
    ViewContainerRef.prototype.detach = function (index) {
        var adjustedIdx = this._adjustIndex(index, -1);
        var lViewNode = detachView(this._lContainerNode, adjustedIdx);
        lViewNode.dynamicParent = null;
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    };
    ViewContainerRef.prototype._adjustIndex = function (index, shift) {
        if (shift === void 0) { shift = 0; }
        if (index == null) {
            return this._lContainerNode.data[VIEWS].length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, 'index must be positive');
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this._lContainerNode.data[VIEWS].length + 1 + shift, 'index');
        }
        return index;
    };
    return ViewContainerRef;
}());
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
        var hostNode = di.node;
        var hostTNode = hostNode.tNode;
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), hostTNode.tViews, getRenderer(), hostNode.data[QUERIES]);
    }
    return di.templateRef;
}
var TemplateRef = /** @class */ (function () {
    function TemplateRef(elementRef, _tView, _renderer, _queries) {
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    TemplateRef.prototype.createEmbeddedView = function (context, containerNode, index) {
        var viewNode = createEmbeddedViewNode(this._tView, context, this._renderer, this._queries);
        if (containerNode) {
            viewNode.dynamicParent = containerNode;
            insertView(containerNode, viewNode, index);
        }
        renderEmbeddedTemplate(viewNode, this._tView, context, 1 /* Create */);
        return new EmbeddedViewRef(viewNode, this._tView.template, context);
    };
    return TemplateRef;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUtILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFTakYsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsb0JBQW9CLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQ2xRLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQU03QyxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFBRSxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUM5RyxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQywwQkFBMEIsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLGFBQWEsRUFBRSxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQy9JLE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQUUsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBSXBEOzs7O0dBSUc7QUFDSCxJQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUUxQzs7OztHQUlH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QUFtQixPQUFVLEVBQUUsYUFBOEIsRUFBRSxLQUFjO1FBRTNFLElBQU0sUUFBUSxHQUFHLHNCQUFzQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBQzdGLElBQUksYUFBYSxFQUFFO1lBQ2pCLFFBQVEsQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ3ZDLFVBQVUsQ0FBQyxhQUFhLEVBQUUsUUFBUSxFQUFFLEtBQU8sQ0FBQyxDQUFDO1NBQzlDO1FBQ0Qsc0JBQXNCLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxpQkFBcUIsQ0FBQztRQUMzRSxPQUFPLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQW5CRCxJQW1CQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cbmltcG9ydCB7Q2hhbmdlRGV0ZWN0b3JSZWYgYXMgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZn0gZnJvbSAnLi4vY2hhbmdlX2RldGVjdGlvbi9jaGFuZ2VfZGV0ZWN0b3JfcmVmJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBpbmplY3QsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtDb21wb25lbnRGYWN0b3J5IGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeSwgQ29tcG9uZW50UmVmIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50UmVmfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnknO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2FkZFRvVmlld1RyZWUsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGNyZWF0ZUVtYmVkZGVkVmlld05vZGUsIGNyZWF0ZUxDb250YWluZXIsIGNyZWF0ZUxOb2RlT2JqZWN0LCBjcmVhdGVUTm9kZSwgZ2V0RGlyZWN0aXZlSW5zdGFuY2UsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7VklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmSW50ZXJuYWwsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFZpZXdOb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7RElSRUNUSVZFUywgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBRVUVSSUVTLCBSRU5ERVJFUiwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7YWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIsIGFwcGVuZENoaWxkLCBkZXRhY2hWaWV3LCBnZXRDaGlsZExOb2RlLCBnZXRQYXJlbnRMTm9kZSwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge25vdEltcGxlbWVudGVkLCBzdHJpbmdpZnl9IGZyb20gJy4vdXRpbCc7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIElmIGEgZGlyZWN0aXZlIGlzIGRpUHVibGljLCBibG9vbUFkZCBzZXRzIGEgcHJvcGVydHkgb24gdGhlIGluc3RhbmNlIHdpdGggdGhpcyBjb25zdGFudCBhc1xuICogdGhlIGtleSBhbmQgdGhlIGRpcmVjdGl2ZSdzIHVuaXF1ZSBJRCBhcyB0aGUgdmFsdWUuIFRoaXMgYWxsb3dzIHVzIHRvIG1hcCBkaXJlY3RpdmVzIHRvIHRoZWlyXG4gKiBibG9vbSBmaWx0ZXIgYml0IGZvciBESS5cbiAqL1xuY29uc3QgTkdfRUxFTUVOVF9JRCA9ICdfX05HX0VMRU1FTlRfSURfXyc7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCB0aGUgZGlyZWN0aXZlIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChpbmplY3RvcjogTEluamVjdG9yLCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgLy8gVGhpcyBtZWFucyB0aGF0IGFmdGVyIDI1NSwgc29tZSBkaXJlY3RpdmVzIHdpbGwgc2hhcmUgc2xvdHMsIGxlYWRpbmcgdG8gc29tZSBmYWxzZSBwb3NpdGl2ZXNcbiAgLy8gd2hlbiBjaGVja2luZyBmb3IgYSBkaXJlY3RpdmUncyBwcmVzZW5jZS5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAlIEJMT09NX1NJWkU7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgLy8gVGhlbiB1c2UgdGhlIG1hc2sgdG8gZmxpcCBvbiB0aGUgYml0ICgwLTMxKSBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSBpbiB0aGF0IGJ1Y2tldFxuICAgIGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IChpbmplY3Rvci5iZjAgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYxIHw9IG1hc2spKSA6XG4gICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gKGluamVjdG9yLmJmMiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjMgfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gKGluamVjdG9yLmJmNCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjUgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IChpbmplY3Rvci5iZjYgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY3IHw9IG1hc2spKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogTEluamVjdG9yIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpOiBMSW5qZWN0b3Ige1xuICBjb25zdCBub2RlSW5qZWN0b3IgPSBub2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gIGNvbnN0IHBhcmVudEluamVjdG9yID0gcGFyZW50ICYmIHBhcmVudC5ub2RlSW5qZWN0b3I7XG4gIGlmIChub2RlSW5qZWN0b3IgIT0gcGFyZW50SW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbm9kZUluamVjdG9yICE7XG4gIH1cbiAgcmV0dXJuIG5vZGUubm9kZUluamVjdG9yID0ge1xuICAgIHBhcmVudDogcGFyZW50SW5qZWN0b3IsXG4gICAgbm9kZTogbm9kZSxcbiAgICBiZjA6IDAsXG4gICAgYmYxOiAwLFxuICAgIGJmMjogMCxcbiAgICBiZjM6IDAsXG4gICAgYmY0OiAwLFxuICAgIGJmNTogMCxcbiAgICBiZjY6IDAsXG4gICAgYmY3OiAwLFxuICAgIGNiZjA6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMCB8IHBhcmVudEluamVjdG9yLmJmMCxcbiAgICBjYmYxOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjEgfCBwYXJlbnRJbmplY3Rvci5iZjEsXG4gICAgY2JmMjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYyIHwgcGFyZW50SW5qZWN0b3IuYmYyLFxuICAgIGNiZjM6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMyB8IHBhcmVudEluamVjdG9yLmJmMyxcbiAgICBjYmY0OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjQgfCBwYXJlbnRJbmplY3Rvci5iZjQsXG4gICAgY2JmNTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY1IHwgcGFyZW50SW5qZWN0b3IuYmY1LFxuICAgIGNiZjY6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNiB8IHBhcmVudEluamVjdG9yLmJmNixcbiAgICBjYmY3OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjcgfCBwYXJlbnRJbmplY3Rvci5iZjcsXG4gICAgdGVtcGxhdGVSZWY6IG51bGwsXG4gICAgdmlld0NvbnRhaW5lclJlZjogbnVsbCxcbiAgICBlbGVtZW50UmVmOiBudWxsLFxuICAgIGNoYW5nZURldGVjdG9yUmVmOiBudWxsXG4gIH07XG59XG5cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogSWYgbm90IGZvdW5kLCBpdCB3aWxsIHByb3BhZ2F0ZSB1cCB0byB0aGUgbmV4dCBwYXJlbnQgaW5qZWN0b3IgdW50aWwgdGhlIHRva2VuXG4gKiBpcyBmb3VuZCBvciB0aGUgdG9wIGlzIHJlYWNoZWQuXG4gKlxuICogVXNhZ2UgZXhhbXBsZSAoaW4gZmFjdG9yeSBmdW5jdGlvbik6XG4gKlxuICogY2xhc3MgU29tZURpcmVjdGl2ZSB7XG4gKiAgIGNvbnN0cnVjdG9yKGRpcmVjdGl2ZTogRGlyZWN0aXZlQSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0RpcmVjdGl2ZURlZiA9IGRlZmluZURpcmVjdGl2ZSh7XG4gKiAgICAgdHlwZTogU29tZURpcmVjdGl2ZSxcbiAqICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU29tZURpcmVjdGl2ZShkaXJlY3RpdmVJbmplY3QoRGlyZWN0aXZlQSkpXG4gKiAgIH0pO1xuICogfVxuICpcbiAqIE5PVEU6IHVzZSBgZGlyZWN0aXZlSW5qZWN0YCB3aXRoIGBARGlyZWN0aXZlYCwgYEBDb21wb25lbnRgLCBhbmQgYEBQaXBlYC4gRm9yXG4gKiBhbGwgb3RoZXIgaW5qZWN0aW9uIHVzZSBgaW5qZWN0YCB3aGljaCBkb2VzIG5vdCB3YWxrIHRoZSBET00gcmVuZGVyIHRyZWUuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzLk9wdGlvbmFsKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KCk6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIG51bGwpO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIGNvbnN0IGxFbGVtZW50ID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCB0RWxlbWVudCA9IGxFbGVtZW50LnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0RWxlbWVudCwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHRFbGVtZW50LmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqIE9yLCBpZiBpdCBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBpbnN0YW5jZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKFxuICAgIGRpOiBMSW5qZWN0b3IsIGNvbnRleHQ6IGFueSk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoZGkuY2hhbmdlRGV0ZWN0b3JSZWYpIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICBjb25zdCBjdXJyZW50Tm9kZSA9IGRpLm5vZGU7XG4gIGlmIChpc0NvbXBvbmVudChjdXJyZW50Tm9kZS50Tm9kZSkpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBuZXcgVmlld1JlZihjdXJyZW50Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSwgY29udGV4dCk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZS52aWV3W0hPU1RfTk9ERV0pO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTpcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3IoY3VycmVudE5vZGUpO1xuICBjb25zdCBob3N0SW5qZWN0b3IgPSBob3N0Tm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IGV4aXN0aW5nUmVmID0gaG9zdEluamVjdG9yICYmIGhvc3RJbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICByZXR1cm4gZXhpc3RpbmdSZWYgP1xuICAgICAgZXhpc3RpbmdSZWYgOlxuICAgICAgbmV3IFZpZXdSZWYoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsXG4gICAgICAgICAgaG9zdE5vZGVcbiAgICAgICAgICAgICAgLnZpZXdbRElSRUNUSVZFU10gIVtob3N0Tm9kZS50Tm9kZS5mbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdF0pO1xufVxuXG4vKipcbiAqIElmIHRoZSBub2RlIGlzIGFuIGVtYmVkZGVkIHZpZXcsIHRyYXZlcnNlcyB1cCB0aGUgdmlldyB0cmVlIHRvIHJldHVybiB0aGUgY2xvc2VzdFxuICogYW5jZXN0b3IgdmlldyB0aGF0IGlzIGF0dGFjaGVkIHRvIGEgY29tcG9uZW50LiBJZiBpdCdzIGFscmVhZHkgYSBjb21wb25lbnQgbm9kZSxcbiAqIHJldHVybnMgaXRzZWxmLlxuICovXG5mdW5jdGlvbiBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3Iobm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTogTEVsZW1lbnROb2RlIHtcbiAgd2hpbGUgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLlZpZXcpIHtcbiAgICBub2RlID0gbm9kZS52aWV3W0hPU1RfTk9ERV07XG4gIH1cbiAgcmV0dXJuIG5vZGUgYXMgTEVsZW1lbnROb2RlO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gZGlyZWN0aXZlIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogU3BlY2lmaWNhbGx5LCBpdCBnZXRzIHRoZSBibG9vbSBmaWx0ZXIgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIChzZWUgYmxvb21IYXNoQml0KSxcbiAqIGNoZWNrcyB0aGF0IGJpdCBhZ2FpbnN0IHRoZSBibG9vbSBmaWx0ZXIgc3RydWN0dXJlIHRvIGlkZW50aWZ5IGFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZVxuICogdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IpLCB0aGVuIHNlYXJjaGVzIHRoZSBkaXJlY3RpdmVzIG9uIHRoYXQgaW5qZWN0b3JcbiAqIGZvciBhIG1hdGNoLlxuICpcbiAqIElmIG5vdCBmb3VuZCwgaXQgd2lsbCBwcm9wYWdhdGUgdXAgdG8gdGhlIG5leHQgcGFyZW50IGluamVjdG9yIHVudGlsIHRoZSB0b2tlblxuICogaXMgZm91bmQgb3IgdGhlIHRvcCBpcyByZWFjaGVkLlxuICpcbiAqIEBwYXJhbSBkaSBOb2RlIGluamVjdG9yIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gdG9rZW4gVGhlIGRpcmVjdGl2ZSB0eXBlIHRvIHNlYXJjaCBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3MgKGUuZy4gQ2hlY2tQYXJlbnQpXG4gKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICBkaTogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdCh0b2tlbik7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKS4gSWYgdGhlcmUgaXMgbm8gaGFzaCwgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggPT09IG51bGwpIHtcbiAgICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkudmlld1tJTkpFQ1RPUl07XG4gICAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBkaTtcblxuICAgIHdoaWxlIChpbmplY3Rvcikge1xuICAgICAgLy8gR2V0IHRoZSBjbG9zZXN0IHBvdGVudGlhbCBtYXRjaGluZyBpbmplY3RvciAodXB3YXJkcyBpbiB0aGUgaW5qZWN0b3IgdHJlZSkgdGhhdFxuICAgICAgLy8gKnBvdGVudGlhbGx5KiBoYXMgdGhlIHRva2VuLlxuICAgICAgaW5qZWN0b3IgPSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKGluamVjdG9yLCBibG9vbUhhc2gsIGZsYWdzKTtcblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBjb25zdCBub2RlID0gaW5qZWN0b3Iubm9kZTtcbiAgICAgIGNvbnN0IG5vZGVGbGFncyA9IG5vZGUudE5vZGUuZmxhZ3M7XG4gICAgICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgICBpZiAoY291bnQgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgICAgIGNvbnN0IGRlZnMgPSBub2RlLnZpZXdbVFZJRVddLmRpcmVjdGl2ZXMgITtcblxuICAgICAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICAgIC8vIEdldCB0aGUgZGVmaW5pdGlvbiBmb3IgdGhlIGRpcmVjdGl2ZSBhdCB0aGlzIGluZGV4IGFuZCwgaWYgaXQgaXMgaW5qZWN0YWJsZSAoZGlQdWJsaWMpLFxuICAgICAgICAgIC8vIGFuZCBtYXRjaGVzIHRoZSBnaXZlbiB0b2tlbiwgcmV0dXJuIHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGlyZWN0aXZlSW5zdGFuY2Uobm9kZS52aWV3W0RJUkVDVElWRVNdICFbaV0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSAqZGlkbid0KiBmaW5kIHRoZSBkaXJlY3RpdmUgZm9yIHRoZSB0b2tlbiBhbmQgd2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCBub2RlJ3NcbiAgICAgIC8vIGluamVjdG9yLCBpdCdzIHBvc3NpYmxlIHRoZSBkaXJlY3RpdmUgaXMgb24gdGhpcyBub2RlIGFuZCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cbiAgICAgIGxldCBpbnN0YW5jZTogVHxudWxsO1xuICAgICAgaWYgKGluamVjdG9yID09PSBkaSAmJiAoaW5zdGFuY2UgPSBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4obm9kZSwgdG9rZW4pKSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAvLyBJZiBmbGFncyBwZXJtaXQsIHRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgICBpbmplY3RvciA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvciA9IGluamVjdG9yLnBhcmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBObyBkaXJlY3RpdmUgd2FzIGZvdW5kIGZvciB0aGUgZ2l2ZW4gdG9rZW4uXG4gIGlmIChmbGFncyAmIEluamVjdEZsYWdzLk9wdGlvbmFsKSByZXR1cm4gbnVsbDtcbiAgdGhyb3cgbmV3IEVycm9yKGBJbmplY3RvcjogTk9UX0ZPVU5EIFske3N0cmluZ2lmeSh0b2tlbil9XWApO1xufVxuXG5mdW5jdGlvbiBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4obm9kZTogTE5vZGUsIHRva2VuOiBhbnkpOiBUfG51bGwge1xuICBjb25zdCBtYXRjaGVzID0gbm9kZS52aWV3W1RWSUVXXS5jdXJyZW50TWF0Y2hlcztcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVEaXJlY3RpdmUoZGVmLCBpICsgMSwgbWF0Y2hlcywgbm9kZS52aWV3W1RWSUVXXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIEdpdmVuIGEgZGlyZWN0aXZlIHR5cGUsIHRoaXMgZnVuY3Rpb24gcmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdCB0aGUgZGlyZWN0aXZlIGlzIHByZXNlbnQuXG4gKlxuICogV2hlbiB0aGUgZGlyZWN0aXZlIHdhcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyLCBpdCB3YXMgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgY2xhc3MuIFNpbmNlIHRoZXJlIGFyZSBvbmx5IEJMT09NX1NJWkUgc2xvdHMgcGVyIGJsb29tIGZpbHRlciwgdGhlIGRpcmVjdGl2ZSdzXG4gKiBJRCBtdXN0IGJlIG1vZHVsby1lZCBieSBCTE9PTV9TSVpFIHRvIGdldCB0aGUgY29ycmVjdCBibG9vbSBiaXQgKGRpcmVjdGl2ZXMgc2hhcmUgc2xvdHMgYWZ0ZXJcbiAqIEJMT09NX1NJWkUgaXMgcmVhY2hlZCkuXG4gKlxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0eXBlXG4gKiBAcmV0dXJucyBUaGUgYmxvb20gYml0IHRvIGNoZWNrIGZvciB0aGUgZGlyZWN0aXZlXG4gKi9cbmZ1bmN0aW9uIGJsb29tSGFzaEJpdCh0eXBlOiBUeXBlPGFueT4pOiBudW1iZXJ8bnVsbCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgJSBCTE9PTV9TSVpFIDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2xvc2VzdCBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgYSBjZXJ0YWluIGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBjb3JyZXNwb25kcyB0byBhIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci4gR2l2ZW4gdGhlIGJsb29tIGJpdCB0b1xuICogY2hlY2sgYW5kIGEgc3RhcnRpbmcgaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gdHJhdmVyc2VzIHVwIGluamVjdG9ycyB1bnRpbCBpdCBmaW5kcyBhblxuICogaW5qZWN0b3IgdGhhdCBjb250YWlucyBhIDEgZm9yIHRoYXQgYml0IGluIGl0cyBibG9vbSBmaWx0ZXIuIEEgMSBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAqIGluamVjdG9yIG1heSBoYXZlIHRoYXQgZGlyZWN0aXZlLiBJdCBvbmx5ICptYXkqIGhhdmUgdGhlIGRpcmVjdGl2ZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYmVnaW5cbiAqIHRvIHNoYXJlIGJsb29tIGZpbHRlciBiaXRzIGFmdGVyIHRoZSBCTE9PTV9TSVpFIGlzIHJlYWNoZWQsIGFuZCBpdCBjb3VsZCBjb3JyZXNwb25kIHRvIGFcbiAqIGRpZmZlcmVudCBkaXJlY3RpdmUgc2hhcmluZyB0aGUgYml0LlxuICpcbiAqIE5vdGU6IFdlIGNhbiBza2lwIGNoZWNraW5nIGZ1cnRoZXIgaW5qZWN0b3JzIHVwIHRoZSB0cmVlIGlmIGFuIGluamVjdG9yJ3MgY2JmIHN0cnVjdHVyZVxuICogaGFzIGEgMCBmb3IgdGhhdCBibG9vbSBiaXQuIFNpbmNlIGNiZiBjb250YWlucyB0aGUgbWVyZ2VkIHZhbHVlIG9mIGFsbCB0aGUgcGFyZW50XG4gKiBpbmplY3RvcnMsIGEgMCBpbiB0aGUgYmxvb20gYml0IGluZGljYXRlcyB0aGF0IHRoZSBwYXJlbnRzIGRlZmluaXRlbHkgZG8gbm90IGNvbnRhaW5cbiAqIHRoZSBkaXJlY3RpdmUgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIGNoZWNrZWQuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBzdGFydGluZyBub2RlIGluamVjdG9yIHRvIGNoZWNrXG4gKiBAcGFyYW0gIGJsb29tQml0IFRoZSBiaXQgdG8gY2hlY2sgaW4gZWFjaCBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogQHBhcmFtICBmbGFncyBUaGUgaW5qZWN0aW9uIGZsYWdzIGZvciB0aGlzIGluamVjdGlvbiBzaXRlIChlLmcuIE9wdGlvbmFsIG9yIFNraXBTZWxmKVxuICogQHJldHVybnMgQW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIHRoZSBkaXJlY3RpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoXG4gICAgc3RhcnRJbmplY3RvcjogTEluamVjdG9yLCBibG9vbUJpdDogbnVtYmVyLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBMSW5qZWN0b3J8bnVsbCB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlICppc24ndCogYVxuICAvLyBtYXRjaC5cbiAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9XG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmID8gc3RhcnRJbmplY3Rvci5wYXJlbnQgISA6IHN0YXJ0SW5qZWN0b3I7XG4gIHdoaWxlIChpbmplY3Rvcikge1xuICAgIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAgIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAgIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG4gICAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IGluamVjdG9yLmJmMCA6IGluamVjdG9yLmJmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5iZjIgOiBpbmplY3Rvci5iZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuYmY0IDogaW5qZWN0b3IuYmY1KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgMjI0ID8gaW5qZWN0b3IuYmY2IDogaW5qZWN0b3IuYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gICAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgICBpZiAoKHZhbHVlICYgbWFzaykgPT09IG1hc2spIHtcbiAgICAgIHJldHVybiBpbmplY3RvcjtcbiAgICB9IGVsc2UgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGluamVjdG9yIGRvZXMgbm90IGhhdmUgdGhlIGRpcmVjdGl2ZSwgY2hlY2sgdGhlIGJsb29tIGZpbHRlcnMgZm9yIHRoZSBhbmNlc3RvclxuICAgIC8vIGluamVjdG9ycyAoY2JmMCAtIGNiZjcpLiBUaGVzZSBmaWx0ZXJzIGNhcHR1cmUgKmFsbCogYW5jZXN0b3IgaW5qZWN0b3JzLlxuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5jYmYwIDogaW5qZWN0b3IuY2JmMSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGJsb29tQml0IDwgOTYgPyBpbmplY3Rvci5jYmYyIDogaW5qZWN0b3IuY2JmMyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCAxOTIgPyAoYmxvb21CaXQgPCAxNjAgPyBpbmplY3Rvci5jYmY0IDogaW5qZWN0b3IuY2JmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmNiZjYgOiBpbmplY3Rvci5jYmY3KTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSwgdHJhdmVyc2UgdXAgdG9cbiAgICAvLyBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlIGNhbiBhYm9ydC5cbiAgICBpbmplY3RvciA9ICh2YWx1ZSAmIG1hc2spID8gaW5qZWN0b3IucGFyZW50IDogbnVsbDtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBpbmplY3RvciBhbmQgaXRzIHBhcmVudCBhcmUgaW4gdGhlIHNhbWUgaG9zdCB2aWV3LlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHN1cHBvcnQgQEhvc3QoKSBkZWNvcmF0b3JzLiBJZiBASG9zdCgpIGlzIHNldCwgd2Ugc2hvdWxkIHN0b3Agc2VhcmNoaW5nIG9uY2VcbiAqIHRoZSBpbmplY3RvciBhbmQgaXRzIHBhcmVudCB2aWV3IGRvbid0IG1hdGNoIGJlY2F1c2UgaXQgbWVhbnMgd2UnZCBjcm9zcyB0aGUgdmlldyBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gc2FtZUhvc3RWaWV3KGluamVjdG9yOiBMSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaW5qZWN0b3IucGFyZW50ICYmIGluamVjdG9yLnBhcmVudC5ub2RlLnZpZXcgPT09IGluamVjdG9yLm5vZGUudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSW5kZXg/OiBudW1iZXIpID0+IFQpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZvciBhIGdpdmVuIG5vZGUgaW5qZWN0b3IgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBFbGVtZW50UmVmXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGRpLmVsZW1lbnRSZWYgfHwgKGRpLmVsZW1lbnRSZWYgPSBuZXcgRWxlbWVudFJlZihkaS5ub2RlLm5hdGl2ZSkpO1xufVxuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9URU1QTEFURV9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfQ09OVEFJTkVSX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRUxFTUVOVF9SRUYgPVxuICAgIDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfRWxlbWVudFJlZj4+KG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9FbGVtZW50UmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0ZST01fTk9ERSA9XG4gICAgKG5ldyBSZWFkRnJvbUluamVjdG9yRm48YW55PigoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUlkeDogbnVtYmVyKSA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICBpZiAoZGlyZWN0aXZlSWR4ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKTtcbiAgICB9KSBhcyBhbnkgYXMgUXVlcnlSZWFkVHlwZTxhbnk+KTtcblxuLyoqIEEgcmVmIHRvIGEgbm9kZSdzIG5hdGl2ZSBlbGVtZW50LiAqL1xuY2xhc3MgRWxlbWVudFJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh2Y1JlZkhvc3QsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBjb25zdCBob3N0UGFyZW50ID0gZ2V0UGFyZW50TE5vZGUodmNSZWZIb3N0KSAhO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGhvc3RQYXJlbnQsIHZjUmVmSG9zdC52aWV3LCB0cnVlKTtcbiAgICBjb25zdCBjb21tZW50ID0gdmNSZWZIb3N0LnZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgICAgIFROb2RlVHlwZS5Db250YWluZXIsIHZjUmVmSG9zdC52aWV3LCBob3N0UGFyZW50LCBjb21tZW50LCBsQ29udGFpbmVyLCBudWxsKTtcbiAgICBhcHBlbmRDaGlsZChob3N0UGFyZW50LCBjb21tZW50LCB2Y1JlZkhvc3Qudmlldyk7XG5cblxuICAgIGlmICh2Y1JlZkhvc3QucXVlcmllcykge1xuICAgICAgbENvbnRhaW5lck5vZGUucXVlcmllcyA9IHZjUmVmSG9zdC5xdWVyaWVzLmNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID0gY3JlYXRlVE5vZGUoVE5vZGVUeXBlLkNvbnRhaW5lciwgLTEsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIGxDb250YWluZXJOb2RlLnROb2RlID0gaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlO1xuICAgIHZjUmVmSG9zdC5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcbiAgICBsQ29udGFpbmVyTm9kZS5keW5hbWljUGFyZW50ID0gdmNSZWZIb3N0O1xuXG4gICAgYWRkVG9WaWV3VHJlZSh2Y1JlZkhvc3QudmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG5cbiAgICBkaS52aWV3Q29udGFpbmVyUmVmID0gbmV3IFZpZXdDb250YWluZXJSZWYobENvbnRhaW5lck5vZGUpO1xuICB9XG5cbiAgcmV0dXJuIGRpLnZpZXdDb250YWluZXJSZWY7XG59XG5cbi8qKlxuICogQSByZWYgdG8gYSBjb250YWluZXIgdGhhdCBlbmFibGVzIGFkZGluZyBhbmQgcmVtb3Zpbmcgdmlld3MgZnJvbSB0aGF0IGNvbnRhaW5lclxuICogaW1wZXJhdGl2ZWx5LlxuICovXG5jbGFzcyBWaWV3Q29udGFpbmVyUmVmIGltcGxlbWVudHMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBlbGVtZW50ICE6IHZpZXdFbmdpbmVfRWxlbWVudFJlZjtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGluamVjdG9yICE6IEluamVjdG9yO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgcGFyZW50SW5qZWN0b3IgITogSW5qZWN0b3I7XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlKSB7fVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHdoaWxlIChsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVtb3ZlKDApO1xuICAgIH1cbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwgeyByZXR1cm4gdGhpcy5fdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7IH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgcmV0dXJuIGxDb250YWluZXJbVklFV1NdLmxlbmd0aDtcbiAgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4KTtcbiAgICBjb25zdCB2aWV3UmVmID0gKHRlbXBsYXRlUmVmIGFzIFRlbXBsYXRlUmVmPEM+KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmNyZWF0ZUVtYmVkZGVkVmlldyhjb250ZXh0IHx8IDxhbnk+e30sIHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgKHZpZXdSZWYgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIGNvbnN0IGxWaWV3Tm9kZSA9ICh2aWV3UmVmIGFzIEVtYmVkZGVkVmlld1JlZjxhbnk+KS5fbFZpZXdOb2RlO1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgbFZpZXdOb2RlLmR5bmFtaWNQYXJlbnQgPSB0aGlzLl9sQ29udGFpbmVyTm9kZTtcbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICBjb25zdCB2aWV3cyA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBhZGp1c3RlZElkeCArIDEgPCB2aWV3cy5sZW5ndGggP1xuICAgICAgICAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1thZGp1c3RlZElkeCArIDFdKSAhKS5uYXRpdmUgOlxuICAgICAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodGhpcy5fbENvbnRhaW5lck5vZGUsIGxWaWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAodmlld1JlZiBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgdGhpcy5fYWRqdXN0SW5kZXgobmV3SW5kZXgpKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLmluZGV4T2Yodmlld1JlZik7IH1cblxuICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSk7XG4gIH1cblxuICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGNvbnN0IGxWaWV3Tm9kZSA9IGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICBsVmlld05vZGUuZHluYW1pY1BhcmVudCA9IG51bGw7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YVtWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIFRlbXBsYXRlUmVmXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgaWYgKCFkaS50ZW1wbGF0ZVJlZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShkaS5ub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBob3N0Tm9kZSA9IGRpLm5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gaG9zdE5vZGUudE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgZGkudGVtcGxhdGVSZWYgPSBuZXcgVGVtcGxhdGVSZWY8YW55PihcbiAgICAgICAgZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpKSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldywgZ2V0UmVuZGVyZXIoKSxcbiAgICAgICAgaG9zdE5vZGUuZGF0YVtRVUVSSUVTXSk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICAgIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwpIHtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQsIGNvbnRhaW5lck5vZGU/OiBMQ29udGFpbmVyTm9kZSwgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgIGNvbnN0IHZpZXdOb2RlID0gY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSh0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fcmVuZGVyZXIsIHRoaXMuX3F1ZXJpZXMpO1xuICAgIGlmIChjb250YWluZXJOb2RlKSB7XG4gICAgICB2aWV3Tm9kZS5keW5hbWljUGFyZW50ID0gY29udGFpbmVyTm9kZTtcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyTm9kZSwgdmlld05vZGUsIGluZGV4ICEpO1xuICAgIH1cbiAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKHZpZXdOb2RlLCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICByZXR1cm4gbmV3IEVtYmVkZGVkVmlld1JlZih2aWV3Tm9kZSwgdGhpcy5fdFZpZXcudGVtcGxhdGUgIWFzIENvbXBvbmVudFRlbXBsYXRlPFQ+LCBjb250ZXh0KTtcbiAgfVxufVxuIl19