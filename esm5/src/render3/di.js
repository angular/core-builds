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
import { detachView, getParentLNode, insertView, removeView } from './node_manipulation';
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
    ngDevMode && assertNotNull(tElement, 'expecting tNode');
    var attrs = tElement.attrs;
    if (attrs) {
        for (var i = 0; i < attrs.length; i = i + 2) {
            var attrName = attrs[i];
            if (attrName === 1 /* SELECT_ONLY */)
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
        return di.changeDetectorRef = getOrCreateHostChangeDetector(currentNode.view.node);
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
        new ViewRef(hostNode.data, hostNode.view
            .directives[hostNode.tNode.flags >> 13 /* DirectiveStartingIndexShift */]);
}
/**
 * If the node is an embedded view, traverses up the view tree to return the closest
 * ancestor view that is attached to a component. If it's already a component node,
 * returns itself.
 */
function getClosestComponentAncestor(node) {
    while (node.tNode.type === 2 /* View */) {
        node = node.view.node;
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
        var moduleInjector = getPreviousOrParentNode().view.injector;
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
                var defs = node.view.tView.directives;
                for (var i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    var directiveDef = defs[i];
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return getDirectiveInstance(node.view.directives[i]);
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
    var matches = node.view.tView.currentMatches;
    if (matches) {
        for (var i = 0; i < matches.length; i += 2) {
            var def = matches[i];
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
    return di.elementRef || (di.elementRef = new ElementRef(di.node.tNode.type === 0 /* Container */ ? null : di.node.native));
}
export var QUERY_READ_TEMPLATE_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateTemplateRef(injector); });
export var QUERY_READ_CONTAINER_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateContainerRef(injector); });
export var QUERY_READ_ELEMENT_REF = new ReadFromInjectorFn(function (injector) { return getOrCreateElementRef(injector); });
export var QUERY_READ_FROM_NODE = new ReadFromInjectorFn(function (injector, node, directiveIdx) {
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */);
    if (directiveIdx > -1) {
        return node.view.directives[directiveIdx];
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
        var lContainer = createLContainer(hostParent, vcRefHost.view, undefined, true);
        var lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, undefined, lContainer, null);
        if (vcRefHost.queries) {
            lContainerNode.queries = vcRefHost.queries.container();
        }
        var hostTNode = vcRefHost.tNode;
        if (!hostTNode.dynamicContainerNode) {
            hostTNode.dynamicContainerNode = createTNode(0 /* Container */, -1, null, null, null, null);
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
var ViewContainerRef = /** @class */ (function () {
    function ViewContainerRef(_lContainerNode) {
        this._lContainerNode = _lContainerNode;
        this._viewRefs = [];
    }
    ViewContainerRef.prototype.clear = function () {
        var lContainer = this._lContainerNode.data;
        while (lContainer.views.length) {
            this.remove(0);
        }
    };
    ViewContainerRef.prototype.get = function (index) { return this._viewRefs[index] || null; };
    Object.defineProperty(ViewContainerRef.prototype, "length", {
        get: function () {
            var lContainer = this._lContainerNode.data;
            return lContainer.views.length;
        },
        enumerable: true,
        configurable: true
    });
    ViewContainerRef.prototype.createEmbeddedView = function (templateRef, context, index) {
        var viewRef = templateRef.createEmbeddedView(context || {});
        this.insert(viewRef, index);
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
        viewRef.attachToViewContainerRef(this);
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
        // invalidate cache of next sibling RNode (we do similar operation in the containerRefreshEnd
        // instruction)
        this._lContainerNode.native = undefined;
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
        detachView(this._lContainerNode, adjustedIdx);
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    };
    ViewContainerRef.prototype._adjustIndex = function (index, shift) {
        if (shift === void 0) { shift = 0; }
        if (index == null) {
            return this._lContainerNode.data.views.length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, 'index must be positive');
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this._lContainerNode.data.views.length + 1 + shift, 'index');
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
        var hostTView = hostNode.view.tView;
        if (!hostTNode.tViews) {
            hostTNode.tViews = createTView(-1, hostNode.data.template, hostTView.directiveRegistry, hostTView.pipeRegistry);
        }
        ngDevMode && assertNotNull(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), hostTNode.tViews, getRenderer(), hostNode.data.queries);
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
    TemplateRef.prototype.createEmbeddedView = function (context) {
        var viewNode = renderEmbeddedTemplate(null, this._tView, context, this._renderer, this._queries);
        return new EmbeddedViewRef(viewNode, this._tView.template, context);
    };
    return TemplateRef;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUtILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFTakYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQU92UCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxVQUFVLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUN2RixPQUFPLEVBQUMsY0FBYyxFQUFFLFNBQVMsRUFBQyxNQUFNLFFBQVEsQ0FBQztBQUNqRCxPQUFPLEVBQUMsZUFBZSxFQUFFLE9BQU8sRUFBQyxNQUFNLFlBQVksQ0FBQztBQUlwRDs7OztHQUlHO0FBQ0gsSUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUM7QUFFMUM7Ozs7R0FJRztBQUNILElBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QiwwREFBMEQ7QUFDMUQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBRXhCOzs7Ozs7R0FNRztBQUNILE1BQU0sbUJBQW1CLFFBQW1CLEVBQUUsSUFBZTtJQUMzRCxJQUFJLEVBQUUsR0FBc0IsSUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFD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QztLQUNqRztJQUNELE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQztBQUN4QixDQUFDO0FBRUQ7SUFHRSxxQkFDSSxVQUFpQyxFQUFVLE1BQWEsRUFBVSxTQUFvQixFQUM5RSxRQUF1QjtRQURZLFdBQU0sR0FBTixNQUFNLENBQU87UUFBVSxjQUFTLEdBQVQsU0FBUyxDQUFXO1FBQzlFLGFBQVEsR0FBUixRQUFRLENBQWU7UUFDakMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELHdDQUFrQixHQUFsQixVQUFtQixPQUFVO1FBQzNCLElBQU0sUUFBUSxHQUNWLHNCQUFzQixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUN0RixPQUFPLElBQUksZUFBZSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQWlDLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDL0YsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQWRELElBY0MiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7RWxlbWVudFJlZiBhcyB2aWV3RW5naW5lX0VsZW1lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9lbGVtZW50X3JlZic7XG5pbXBvcnQge05nTW9kdWxlUmVmIGFzIHZpZXdFbmdpbmVfTmdNb2R1bGVSZWZ9IGZyb20gJy4uL2xpbmtlci9uZ19tb2R1bGVfZmFjdG9yeSc7XG5pbXBvcnQge1RlbXBsYXRlUmVmIGFzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWZ9IGZyb20gJy4uL2xpbmtlci90ZW1wbGF0ZV9yZWYnO1xuaW1wb3J0IHtWaWV3Q29udGFpbmVyUmVmIGFzIHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfY29udGFpbmVyX3JlZic7XG5pbXBvcnQge0VtYmVkZGVkVmlld1JlZiBhcyB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZiwgVmlld1JlZiBhcyB2aWV3RW5naW5lX1ZpZXdSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X3JlZic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydEdyZWF0ZXJUaGFuLCBhc3NlcnRMZXNzVGhhbiwgYXNzZXJ0Tm90TnVsbH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVMTm9kZU9iamVjdCwgY3JlYXRlVE5vZGUsIGNyZWF0ZVRWaWV3LCBnZXREaXJlY3RpdmVJbnN0YW5jZSwgZ2V0UHJldmlvdXNPclBhcmVudE5vZGUsIGdldFJlbmRlcmVyLCBpc0NvbXBvbmVudCwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSwgcmVzb2x2ZURpcmVjdGl2ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtDb21wb25lbnRUZW1wbGF0ZSwgRGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgTFZpZXdOb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyM30gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7TFZpZXcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMsIGFzc2VydE5vZGVUeXBlfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcbmltcG9ydCB7ZGV0YWNoVmlldywgZ2V0UGFyZW50TE5vZGUsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtub3RJbXBsZW1lbnRlZCwgc3RyaW5naWZ5fSBmcm9tICcuL3V0aWwnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWZ9IGZyb20gJy4vdmlld19yZWYnO1xuXG5cblxuLyoqXG4gKiBJZiBhIGRpcmVjdGl2ZSBpcyBkaVB1YmxpYywgYmxvb21BZGQgc2V0cyBhIHByb3BlcnR5IG9uIHRoZSBpbnN0YW5jZSB3aXRoIHRoaXMgY29uc3RhbnQgYXNcbiAqIHRoZSBrZXkgYW5kIHRoZSBkaXJlY3RpdmUncyB1bmlxdWUgSUQgYXMgdGhlIHZhbHVlLiBUaGlzIGFsbG93cyB1cyB0byBtYXAgZGlyZWN0aXZlcyB0byB0aGVpclxuICogYmxvb20gZmlsdGVyIGJpdCBmb3IgREkuXG4gKi9cbmNvbnN0IE5HX0VMRU1FTlRfSUQgPSAnX19OR19FTEVNRU5UX0lEX18nO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggdGhlIGRpcmVjdGl2ZSBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoaW5qZWN0b3I6IExJbmplY3RvciwgdHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIC8vIFRoaXMgbWVhbnMgdGhhdCBhZnRlciAyNTUsIHNvbWUgZGlyZWN0aXZlcyB3aWxsIHNoYXJlIHNsb3RzLCBsZWFkaW5nIHRvIHNvbWUgZmFsc2UgcG9zaXRpdmVzXG4gIC8vIHdoZW4gY2hlY2tpbmcgZm9yIGEgZGlyZWN0aXZlJ3MgcHJlc2VuY2UuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJSBCTE9PTV9TSVpFO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgIC8vIFRoZW4gdXNlIHRoZSBtYXNrIHRvIGZsaXAgb24gdGhlIGJpdCAoMC0zMSkgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgaW4gdGhhdCBidWNrZXRcbiAgICBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyAoaW5qZWN0b3IuYmYwIHw9IG1hc2spIDogKGluamVjdG9yLmJmMSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCA5NiA/IChpbmplY3Rvci5iZjIgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYzIHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IChpbmplY3Rvci5iZjQgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY1IHw9IG1hc2spKSA6XG4gICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyAoaW5qZWN0b3IuYmY2IHw9IG1hc2spIDogKGluamVjdG9yLmJmNyB8PSBtYXNrKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IExJbmplY3RvciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIG5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKG5vZGU6IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTogTEluamVjdG9yIHtcbiAgY29uc3Qgbm9kZUluamVjdG9yID0gbm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHBhcmVudCAmJiBwYXJlbnQubm9kZUluamVjdG9yO1xuICBpZiAobm9kZUluamVjdG9yICE9IHBhcmVudEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5vZGVJbmplY3RvciAhO1xuICB9XG4gIHJldHVybiBub2RlLm5vZGVJbmplY3RvciA9IHtcbiAgICBwYXJlbnQ6IHBhcmVudEluamVjdG9yLFxuICAgIG5vZGU6IG5vZGUsXG4gICAgYmYwOiAwLFxuICAgIGJmMTogMCxcbiAgICBiZjI6IDAsXG4gICAgYmYzOiAwLFxuICAgIGJmNDogMCxcbiAgICBiZjU6IDAsXG4gICAgYmY2OiAwLFxuICAgIGJmNzogMCxcbiAgICBjYmYwOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjAgfCBwYXJlbnRJbmplY3Rvci5iZjAsXG4gICAgY2JmMTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYxIHwgcGFyZW50SW5qZWN0b3IuYmYxLFxuICAgIGNiZjI6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMiB8IHBhcmVudEluamVjdG9yLmJmMixcbiAgICBjYmYzOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjMgfCBwYXJlbnRJbmplY3Rvci5iZjMsXG4gICAgY2JmNDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY0IHwgcGFyZW50SW5qZWN0b3IuYmY0LFxuICAgIGNiZjU6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNSB8IHBhcmVudEluamVjdG9yLmJmNSxcbiAgICBjYmY2OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjYgfCBwYXJlbnRJbmplY3Rvci5iZjYsXG4gICAgY2JmNzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY3IHwgcGFyZW50SW5qZWN0b3IuYmY3LFxuICAgIHRlbXBsYXRlUmVmOiBudWxsLFxuICAgIHZpZXdDb250YWluZXJSZWY6IG51bGwsXG4gICAgZWxlbWVudFJlZjogbnVsbCxcbiAgICBjaGFuZ2VEZXRlY3RvclJlZjogbnVsbFxuICB9O1xufVxuXG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCBhIGRpcmVjdGl2ZSB3aWxsIGJlIGFkZGVkXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljSW5JbmplY3RvcihkaTogTEluamVjdG9yLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGRpLCBkZWYudHlwZSk7XG59XG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWMoZGVmOiBEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIHR5cGUgdXAgdGhlIGluamVjdG9yIHRyZWUgYW5kIHJldHVybnNcbiAqIHRoYXQgaW5zdGFuY2UgaWYgZm91bmQuXG4gKlxuICogSWYgbm90IGZvdW5kLCBpdCB3aWxsIHByb3BhZ2F0ZSB1cCB0byB0aGUgbmV4dCBwYXJlbnQgaW5qZWN0b3IgdW50aWwgdGhlIHRva2VuXG4gKiBpcyBmb3VuZCBvciB0aGUgdG9wIGlzIHJlYWNoZWQuXG4gKlxuICogVXNhZ2UgZXhhbXBsZSAoaW4gZmFjdG9yeSBmdW5jdGlvbik6XG4gKlxuICogY2xhc3MgU29tZURpcmVjdGl2ZSB7XG4gKiAgIGNvbnN0cnVjdG9yKGRpcmVjdGl2ZTogRGlyZWN0aXZlQSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0RpcmVjdGl2ZURlZiA9IGRlZmluZURpcmVjdGl2ZSh7XG4gKiAgICAgdHlwZTogU29tZURpcmVjdGl2ZSxcbiAqICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU29tZURpcmVjdGl2ZShkaXJlY3RpdmVJbmplY3QoRGlyZWN0aXZlQSkpXG4gKiAgIH0pO1xuICogfVxuICpcbiAqIE5PVEU6IHVzZSBgZGlyZWN0aXZlSW5qZWN0YCB3aXRoIGBARGlyZWN0aXZlYCwgYEBDb21wb25lbnRgLCBhbmQgYEBQaXBlYC4gRm9yXG4gKiBhbGwgb3RoZXIgaW5qZWN0aW9uIHVzZSBgaW5qZWN0YCB3aGljaCBkb2VzIG5vdCB3YWxrIHRoZSBET00gcmVuZGVyIHRyZWUuXG4gKlxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzLk9wdGlvbmFsKTogVHxudWxsO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KCk6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIG51bGwpO1xufVxuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIGNvbnN0IGxFbGVtZW50ID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShsRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnQpO1xuICBjb25zdCB0RWxlbWVudCA9IGxFbGVtZW50LnROb2RlO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm90TnVsbCh0RWxlbWVudCwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHRFbGVtZW50LmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU0VMRUNUX09OTFkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKiBPciwgaWYgaXQgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgaW5zdGFuY2UuXG4gKlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihcbiAgICBkaTogTEluamVjdG9yLCBjb250ZXh0OiBhbnkpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgaWYgKGRpLmNoYW5nZURldGVjdG9yUmVmKSByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgY29uc3QgY3VycmVudE5vZGUgPSBkaS5ub2RlO1xuICBpZiAoaXNDb21wb25lbnQoY3VycmVudE5vZGUudE5vZGUpKSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFZpZXdSZWYoY3VycmVudE5vZGUuZGF0YSBhcyBMVmlldywgY29udGV4dCk7XG4gIH0gZWxzZSBpZiAoY3VycmVudE5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZS52aWV3Lm5vZGUpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50Tm9kZTogTFZpZXdOb2RlIHwgTEVsZW1lbnROb2RlKTpcbiAgICB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgY29uc3QgaG9zdE5vZGUgPSBnZXRDbG9zZXN0Q29tcG9uZW50QW5jZXN0b3IoY3VycmVudE5vZGUpO1xuICBjb25zdCBob3N0SW5qZWN0b3IgPSBob3N0Tm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IGV4aXN0aW5nUmVmID0gaG9zdEluamVjdG9yICYmIGhvc3RJbmplY3Rvci5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICByZXR1cm4gZXhpc3RpbmdSZWYgP1xuICAgICAgZXhpc3RpbmdSZWYgOlxuICAgICAgbmV3IFZpZXdSZWYoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSBhcyBMVmlldyxcbiAgICAgICAgICBob3N0Tm9kZS52aWV3XG4gICAgICAgICAgICAgIC5kaXJlY3RpdmVzICFbaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnRdKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgbm9kZSBpcyBhbiBlbWJlZGRlZCB2aWV3LCB0cmF2ZXJzZXMgdXAgdGhlIHZpZXcgdHJlZSB0byByZXR1cm4gdGhlIGNsb3Nlc3RcbiAqIGFuY2VzdG9yIHZpZXcgdGhhdCBpcyBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC4gSWYgaXQncyBhbHJlYWR5IGEgY29tcG9uZW50IG5vZGUsXG4gKiByZXR1cm5zIGl0c2VsZi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKG5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6IExFbGVtZW50Tm9kZSB7XG4gIHdoaWxlIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbm9kZSA9IG5vZGUudmlldy5ub2RlO1xuICB9XG4gIHJldHVybiBub2RlIGFzIExFbGVtZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGRpcmVjdGl2ZSB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIFNwZWNpZmljYWxseSwgaXQgZ2V0cyB0aGUgYmxvb20gZmlsdGVyIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tSGFzaEJpdCksXG4gKiBjaGVja3MgdGhhdCBiaXQgYWdhaW5zdCB0aGUgYmxvb20gZmlsdGVyIHN0cnVjdHVyZSB0byBpZGVudGlmeSBhbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmVcbiAqIHRoZSBkaXJlY3RpdmUgKHNlZSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKSwgdGhlbiBzZWFyY2hlcyB0aGUgZGlyZWN0aXZlcyBvbiB0aGF0IGluamVjdG9yXG4gKiBmb3IgYSBtYXRjaC5cbiAqXG4gKiBJZiBub3QgZm91bmQsIGl0IHdpbGwgcHJvcGFnYXRlIHVwIHRvIHRoZSBuZXh0IHBhcmVudCBpbmplY3RvciB1bnRpbCB0aGUgdG9rZW5cbiAqIGlzIGZvdW5kIG9yIHRoZSB0b3AgaXMgcmVhY2hlZC5cbiAqXG4gKiBAcGFyYW0gZGkgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgZGk6IExJbmplY3RvciwgdG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXQodG9rZW4pO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykuIElmIHRoZXJlIGlzIG5vIGhhc2gsIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoID09PSBudWxsKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpLnZpZXcuaW5qZWN0b3I7XG4gICAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBkaTtcblxuICAgIHdoaWxlIChpbmplY3Rvcikge1xuICAgICAgLy8gR2V0IHRoZSBjbG9zZXN0IHBvdGVudGlhbCBtYXRjaGluZyBpbmplY3RvciAodXB3YXJkcyBpbiB0aGUgaW5qZWN0b3IgdHJlZSkgdGhhdFxuICAgICAgLy8gKnBvdGVudGlhbGx5KiBoYXMgdGhlIHRva2VuLlxuICAgICAgaW5qZWN0b3IgPSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKGluamVjdG9yLCBibG9vbUhhc2gsIGZsYWdzKTtcblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBjb25zdCBub2RlID0gaW5qZWN0b3Iubm9kZTtcbiAgICAgIGNvbnN0IG5vZGVGbGFncyA9IG5vZGUudE5vZGUuZmxhZ3M7XG4gICAgICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgICBpZiAoY291bnQgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgICAgIGNvbnN0IGRlZnMgPSBub2RlLnZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGlyZWN0aXZlSW5zdGFuY2Uobm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXcudFZpZXcuY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBub2RlLnZpZXcudFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGRpcmVjdGl2ZSB0eXBlLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdGhlIGRpcmVjdGl2ZSBpcyBwcmVzZW50LlxuICpcbiAqIFdoZW4gdGhlIGRpcmVjdGl2ZSB3YXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciwgaXQgd2FzIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIGNsYXNzLiBTaW5jZSB0aGVyZSBhcmUgb25seSBCTE9PTV9TSVpFIHNsb3RzIHBlciBibG9vbSBmaWx0ZXIsIHRoZSBkaXJlY3RpdmUnc1xuICogSUQgbXVzdCBiZSBtb2R1bG8tZWQgYnkgQkxPT01fU0laRSB0byBnZXQgdGhlIGNvcnJlY3QgYmxvb20gYml0IChkaXJlY3RpdmVzIHNoYXJlIHNsb3RzIGFmdGVyXG4gKiBCTE9PTV9TSVpFIGlzIHJlYWNoZWQpLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdHlwZVxuICogQHJldHVybnMgVGhlIGJsb29tIGJpdCB0byBjaGVjayBmb3IgdGhlIGRpcmVjdGl2ZVxuICovXG5mdW5jdGlvbiBibG9vbUhhc2hCaXQodHlwZTogVHlwZTxhbnk+KTogbnVtYmVyfG51bGwge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSAnbnVtYmVyJyA/IGlkICUgQkxPT01fU0laRSA6IG51bGw7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIGEgY2VydGFpbiBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgY29ycmVzcG9uZHMgdG8gYSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuIEdpdmVuIHRoZSBibG9vbSBiaXQgdG9cbiAqIGNoZWNrIGFuZCBhIHN0YXJ0aW5nIGluamVjdG9yLCB0aGlzIGZ1bmN0aW9uIHRyYXZlcnNlcyB1cCBpbmplY3RvcnMgdW50aWwgaXQgZmluZHMgYW5cbiAqIGluamVjdG9yIHRoYXQgY29udGFpbnMgYSAxIGZvciB0aGF0IGJpdCBpbiBpdHMgYmxvb20gZmlsdGVyLiBBIDEgaW5kaWNhdGVzIHRoYXQgdGhlXG4gKiBpbmplY3RvciBtYXkgaGF2ZSB0aGF0IGRpcmVjdGl2ZS4gSXQgb25seSAqbWF5KiBoYXZlIHRoZSBkaXJlY3RpdmUgYmVjYXVzZSBkaXJlY3RpdmVzIGJlZ2luXG4gKiB0byBzaGFyZSBibG9vbSBmaWx0ZXIgYml0cyBhZnRlciB0aGUgQkxPT01fU0laRSBpcyByZWFjaGVkLCBhbmQgaXQgY291bGQgY29ycmVzcG9uZCB0byBhXG4gKiBkaWZmZXJlbnQgZGlyZWN0aXZlIHNoYXJpbmcgdGhlIGJpdC5cbiAqXG4gKiBOb3RlOiBXZSBjYW4gc2tpcCBjaGVja2luZyBmdXJ0aGVyIGluamVjdG9ycyB1cCB0aGUgdHJlZSBpZiBhbiBpbmplY3RvcidzIGNiZiBzdHJ1Y3R1cmVcbiAqIGhhcyBhIDAgZm9yIHRoYXQgYmxvb20gYml0LiBTaW5jZSBjYmYgY29udGFpbnMgdGhlIG1lcmdlZCB2YWx1ZSBvZiBhbGwgdGhlIHBhcmVudFxuICogaW5qZWN0b3JzLCBhIDAgaW4gdGhlIGJsb29tIGJpdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcGFyZW50cyBkZWZpbml0ZWx5IGRvIG5vdCBjb250YWluXG4gKiB0aGUgZGlyZWN0aXZlIGFuZCBkbyBub3QgbmVlZCB0byBiZSBjaGVja2VkLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgc3RhcnRpbmcgbm9kZSBpbmplY3RvciB0byBjaGVja1xuICogQHBhcmFtICBibG9vbUJpdCBUaGUgYml0IHRvIGNoZWNrIGluIGVhY2ggaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIEBwYXJhbSAgZmxhZ3MgVGhlIGluamVjdGlvbiBmbGFncyBmb3IgdGhpcyBpbmplY3Rpb24gc2l0ZSAoZS5nLiBPcHRpb25hbCBvciBTa2lwU2VsZilcbiAqIEByZXR1cm5zIEFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSB0aGUgZGlyZWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKFxuICAgIHN0YXJ0SW5qZWN0b3I6IExJbmplY3RvciwgYmxvb21CaXQ6IG51bWJlciwgZmxhZ3M6IEluamVjdEZsYWdzKTogTEluamVjdG9yfG51bGwge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZSAqaXNuJ3QqIGFcbiAgLy8gbWF0Y2guXG4gIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPVxuICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZiA/IHN0YXJ0SW5qZWN0b3IucGFyZW50ICEgOiBzdGFydEluamVjdG9yO1xuICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICAgIGxldCB2YWx1ZTogbnVtYmVyO1xuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5iZjAgOiBpbmplY3Rvci5iZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuYmYyIDogaW5qZWN0b3IuYmYzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IGluamVjdG9yLmJmNCA6IGluamVjdG9yLmJmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmJmNiA6IGluamVjdG9yLmJmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAgIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gICAgaWYgKCh2YWx1ZSAmIG1hc2spID09PSBtYXNrKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3I7XG4gICAgfSBlbHNlIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudCBpbmplY3RvciBkb2VzIG5vdCBoYXZlIHRoZSBkaXJlY3RpdmUsIGNoZWNrIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgYW5jZXN0b3JcbiAgICAvLyBpbmplY3RvcnMgKGNiZjAgLSBjYmY3KS4gVGhlc2UgZmlsdGVycyBjYXB0dXJlICphbGwqIGFuY2VzdG9yIGluamVjdG9ycy5cbiAgICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gaW5qZWN0b3IuY2JmMCA6IGluamVjdG9yLmNiZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuY2JmMiA6IGluamVjdG9yLmNiZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuY2JmNCA6IGluamVjdG9yLmNiZjUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyBpbmplY3Rvci5jYmY2IDogaW5qZWN0b3IuY2JmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlIHVwIHRvXG4gICAgLy8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZSBjYW4gYWJvcnQuXG4gICAgaW5qZWN0b3IgPSAodmFsdWUgJiBtYXNrKSA/IGluamVjdG9yLnBhcmVudCA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgYXJlIGluIHRoZSBzYW1lIGhvc3Qgdmlldy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzdXBwb3J0IEBIb3N0KCkgZGVjb3JhdG9ycy4gSWYgQEhvc3QoKSBpcyBzZXQsIHdlIHNob3VsZCBzdG9wIHNlYXJjaGluZyBvbmNlXG4gKiB0aGUgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgdmlldyBkb24ndCBtYXRjaCBiZWNhdXNlIGl0IG1lYW5zIHdlJ2QgY3Jvc3MgdGhlIHZpZXcgYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIHNhbWVIb3N0VmlldyhpbmplY3RvcjogTEluamVjdG9yKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWluamVjdG9yLnBhcmVudCAmJiBpbmplY3Rvci5wYXJlbnQubm9kZS52aWV3ID09PSBpbmplY3Rvci5ub2RlLnZpZXc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWFkRnJvbUluamVjdG9yRm48VD4ge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSByZWFkOiAoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUluZGV4PzogbnVtYmVyKSA9PiBUKSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmb3IgYSBnaXZlbiBub2RlIGluamVjdG9yIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgRWxlbWVudFJlZlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBkaS5lbGVtZW50UmVmIHx8IChkaS5lbGVtZW50UmVmID0gbmV3IEVsZW1lbnRSZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGkubm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyID8gbnVsbCA6IGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJZHhdO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdmYWlsJyk7XG4gICAgfSkgYXMgYW55IGFzIFF1ZXJ5UmVhZFR5cGU8YW55Pik7XG5cbi8qKiBBIHJlZiB0byBhIG5vZGUncyBuYXRpdmUgZWxlbWVudC4gKi9cbmNsYXNzIEVsZW1lbnRSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZUVsZW1lbnQ6IGFueSkgeyB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVFbGVtZW50OyB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIWRpLnZpZXdDb250YWluZXJSZWYpIHtcbiAgICBjb25zdCB2Y1JlZkhvc3QgPSBkaS5ub2RlO1xuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModmNSZWZIb3N0LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgY29uc3QgaG9zdFBhcmVudCA9IGdldFBhcmVudExOb2RlKHZjUmVmSG9zdCkgITtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihob3N0UGFyZW50LCB2Y1JlZkhvc3QudmlldywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdChcbiAgICAgICAgVE5vZGVUeXBlLkNvbnRhaW5lciwgdmNSZWZIb3N0LnZpZXcsIGhvc3RQYXJlbnQsIHVuZGVmaW5lZCwgbENvbnRhaW5lciwgbnVsbCk7XG5cblxuICAgIGlmICh2Y1JlZkhvc3QucXVlcmllcykge1xuICAgICAgbENvbnRhaW5lck5vZGUucXVlcmllcyA9IHZjUmVmSG9zdC5xdWVyaWVzLmNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID0gY3JlYXRlVE5vZGUoVE5vZGVUeXBlLkNvbnRhaW5lciwgLTEsIG51bGwsIG51bGwsIG51bGwsIG51bGwpO1xuICAgIH1cblxuICAgIGxDb250YWluZXJOb2RlLnROb2RlID0gaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlO1xuICAgIHZjUmVmSG9zdC5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcblxuICAgIGFkZFRvVmlld1RyZWUodmNSZWZIb3N0LnZpZXcsIGhvc3RUTm9kZS5pbmRleCBhcyBudW1iZXIsIGxDb250YWluZXIpO1xuXG4gICAgZGkudmlld0NvbnRhaW5lclJlZiA9IG5ldyBWaWV3Q29udGFpbmVyUmVmKGxDb250YWluZXJOb2RlKTtcbiAgfVxuXG4gIHJldHVybiBkaS52aWV3Q29udGFpbmVyUmVmO1xufVxuXG4vKipcbiAqIEEgcmVmIHRvIGEgY29udGFpbmVyIHRoYXQgZW5hYmxlcyBhZGRpbmcgYW5kIHJlbW92aW5nIHZpZXdzIGZyb20gdGhhdCBjb250YWluZXJcbiAqIGltcGVyYXRpdmVseS5cbiAqL1xuY2xhc3MgVmlld0NvbnRhaW5lclJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIHByaXZhdGUgX3ZpZXdSZWZzOiB2aWV3RW5naW5lX1ZpZXdSZWZbXSA9IFtdO1xuICBlbGVtZW50OiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG4gIGluamVjdG9yOiBJbmplY3RvcjtcbiAgcGFyZW50SW5qZWN0b3I6IEluamVjdG9yO1xuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSkge31cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICB3aGlsZSAobENvbnRhaW5lci52aWV3cy5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVtb3ZlKDApO1xuICAgIH1cbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwgeyByZXR1cm4gdGhpcy5fdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7IH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgcmV0dXJuIGxDb250YWluZXIudmlld3MubGVuZ3RoO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGNvbnN0IHZpZXdSZWYgPSB0ZW1wbGF0ZVJlZi5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCBpbmRleCk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZT86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgdGhyb3cgbm90SW1wbGVtZW50ZWQoKTtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLl9sVmlld05vZGU7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICAodmlld1JlZiBhcyBFbWJlZGRlZFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuXG4gICAgaW5zZXJ0Vmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgbFZpZXdOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgLy8gaW52YWxpZGF0ZSBjYWNoZSBvZiBuZXh0IHNpYmxpbmcgUk5vZGUgKHdlIGRvIHNpbWlsYXIgb3BlcmF0aW9uIGluIHRoZSBjb250YWluZXJSZWZyZXNoRW5kXG4gICAgLy8gaW5zdHJ1Y3Rpb24pXG4gICAgdGhpcy5fbENvbnRhaW5lck5vZGUubmF0aXZlID0gdW5kZWZpbmVkO1xuXG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGEudmlld3MubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhLnZpZXdzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgVGVtcGxhdGVSZWZcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIWRpLnRlbXBsYXRlUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGRpLm5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gZGkubm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBob3N0Tm9kZS50Tm9kZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0Tm9kZS52aWV3LnRWaWV3O1xuICAgIGlmICghaG9zdFROb2RlLnRWaWV3cykge1xuICAgICAgaG9zdFROb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KFxuICAgICAgICAgIC0xLCBob3N0Tm9kZS5kYXRhLnRlbXBsYXRlICEsIGhvc3RUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgaG9zdFRWaWV3LnBpcGVSZWdpc3RyeSk7XG4gICAgfVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIGRpLnRlbXBsYXRlUmVmID0gbmV3IFRlbXBsYXRlUmVmPGFueT4oXG4gICAgICAgIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaSksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsIGdldFJlbmRlcmVyKCksIGhvc3ROb2RlLmRhdGEucXVlcmllcyk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICAgIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwpIHtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPVxuICAgICAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKG51bGwsIHRoaXMuX3RWaWV3LCBjb250ZXh0LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgcmV0dXJuIG5ldyBFbWJlZGRlZFZpZXdSZWYodmlld05vZGUsIHRoaXMuX3RWaWV3LnRlbXBsYXRlICFhcyBDb21wb25lbnRUZW1wbGF0ZTxUPiwgY29udGV4dCk7XG4gIH1cbn1cbiJdfQ==