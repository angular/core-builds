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
        return di.changeDetectorRef = createViewRef(currentNode.data, context);
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
        createViewRef(hostNode.data, hostNode.view
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
            hostTNode.dynamicContainerNode =
                createTNode(0 /* Container */, null, null, null, null, null);
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
        var lViewNode = viewRef._lViewNode;
        var adjustedIdx = this._adjustIndex(index);
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
        this.detach(index);
        // TODO(ml): proper destroy of the ViewRef, i.e. recursively destroy the LviewNode and its
        // children, delete DOM nodes and QueryList, trigger hooks (onDestroy), destroy the renderer,
        // detach projected nodes
    };
    ViewContainerRef.prototype.detach = function (index) {
        var adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainerNode, adjustedIdx);
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
            hostTNode.tViews = createTView(hostTView.directiveRegistry, hostTView.pipeRegistry);
        }
        ngDevMode && assertNotNull(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(getOrCreateElementRef(di), hostTNode.tViews, hostNode.data.template, getRenderer(), hostNode.queries);
    }
    return di.templateRef;
}
var TemplateRef = /** @class */ (function () {
    function TemplateRef(elementRef, _tView, _template, _renderer, _queries) {
        this._tView = _tView;
        this._template = _template;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    TemplateRef.prototype.createEmbeddedView = function (context) {
        var viewNode = renderEmbeddedTemplate(null, this._tView, this._template, context, this._renderer, this._queries);
        return addDestroyable(new EmbeddedViewRef(viewNode, this._template, context));
    };
    return TemplateRef;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUtILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFTakYsT0FBTyxFQUFDLGlCQUFpQixFQUFFLGNBQWMsRUFBRSxhQUFhLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsV0FBVyxFQUFFLG9CQUFvQixFQUFFLHVCQUF1QixFQUFFLFdBQVcsRUFBRSxXQUFXLEVBQUUsc0JBQXNCLEVBQUUsZ0JBQWdCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQU92UCxPQUFPLEVBQUMseUJBQXlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sZUFBZSxDQUFDO0FBQ3hFLE9BQU8sRUFBQyxjQUFjLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBQyxNQUFNLHFCQUFxQixDQUFDO0FBQzNFLE9BQU8sRUFBQyxjQUFjLEVBQUUsU0FBUyxFQUFDLE1BQU0sUUFBUSxDQUFDO0FBQ2pELE9BQU8sRUFBQyxlQUFlLEVBQVcsY0FBYyxFQUFFLGFBQWEsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUluRjs7OztHQUlHO0FBQ0gsSUFBTSxhQUFhLEdBQUcsbUJBQW1CLENBQUM7QUFFMUM7Ozs7R0FJRztBQUNILElBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUV2QiwwREFBMEQ7QUFDMUQsSUFBSSxlQUFlLEdBQUcsQ0FBQyxDQUFDO0FBRXhCOzs7Ozs7R0FNRztBQUNILE1BQU0sbUJBQW1CLFFBQW1CLEVBQUUsSUFBZTtJQUMzRCxJQUFJLEVBQUUsR0FBc0IsSUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFD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QztJQUVELHdDQUFrQixHQUFsQixVQUFtQixPQUFVO1FBQzNCLElBQU0sUUFBUSxHQUFHLHNCQUFzQixDQUNuQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMvRSxPQUFPLGNBQWMsQ0FBQyxJQUFJLGVBQWUsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0lBQ2hGLENBQUM7SUFDSCxrQkFBQztBQUFELENBQUMsQUFmRCxJQWVDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIGluamVjdCwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnkgYXMgdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5LCBDb21wb25lbnRSZWYgYXMgdmlld0VuZ2luZV9Db21wb25lbnRSZWZ9IGZyb20gJy4uL2xpbmtlci9jb21wb25lbnRfZmFjdG9yeSc7XG5pbXBvcnQge0VsZW1lbnRSZWYgYXMgdmlld0VuZ2luZV9FbGVtZW50UmVmfSBmcm9tICcuLi9saW5rZXIvZWxlbWVudF9yZWYnO1xuaW1wb3J0IHtOZ01vZHVsZVJlZiBhcyB2aWV3RW5naW5lX05nTW9kdWxlUmVmfSBmcm9tICcuLi9saW5rZXIvbmdfbW9kdWxlX2ZhY3RvcnknO1xuaW1wb3J0IHtUZW1wbGF0ZVJlZiBhcyB2aWV3RW5naW5lX1RlbXBsYXRlUmVmfSBmcm9tICcuLi9saW5rZXIvdGVtcGxhdGVfcmVmJztcbmltcG9ydCB7Vmlld0NvbnRhaW5lclJlZiBhcyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWZ9IGZyb20gJy4uL2xpbmtlci92aWV3X2NvbnRhaW5lcl9yZWYnO1xuaW1wb3J0IHtFbWJlZGRlZFZpZXdSZWYgYXMgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWYsIFZpZXdSZWYgYXMgdmlld0VuZ2luZV9WaWV3UmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19yZWYnO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW4sIGFzc2VydE5vdE51bGx9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBjcmVhdGVUVmlldywgZ2V0RGlyZWN0aXZlSW5zdGFuY2UsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7Q29tcG9uZW50VGVtcGxhdGUsIERpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgTENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExWaWV3Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBRdWVyeVJlYWRUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSZW5kZXJlcjN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0xWaWV3LCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2dldFBhcmVudExOb2RlLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7bm90SW1wbGVtZW50ZWQsIHN0cmluZ2lmeX0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmLCBhZGREZXN0cm95YWJsZSwgY3JlYXRlVmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIElmIGEgZGlyZWN0aXZlIGlzIGRpUHVibGljLCBibG9vbUFkZCBzZXRzIGEgcHJvcGVydHkgb24gdGhlIGluc3RhbmNlIHdpdGggdGhpcyBjb25zdGFudCBhc1xuICogdGhlIGtleSBhbmQgdGhlIGRpcmVjdGl2ZSdzIHVuaXF1ZSBJRCBhcyB0aGUgdmFsdWUuIFRoaXMgYWxsb3dzIHVzIHRvIG1hcCBkaXJlY3RpdmVzIHRvIHRoZWlyXG4gKiBibG9vbSBmaWx0ZXIgYml0IGZvciBESS5cbiAqL1xuY29uc3QgTkdfRUxFTUVOVF9JRCA9ICdfX05HX0VMRU1FTlRfSURfXyc7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCB0aGUgZGlyZWN0aXZlIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChpbmplY3RvcjogTEluamVjdG9yLCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgLy8gVGhpcyBtZWFucyB0aGF0IGFmdGVyIDI1NSwgc29tZSBkaXJlY3RpdmVzIHdpbGwgc2hhcmUgc2xvdHMsIGxlYWRpbmcgdG8gc29tZSBmYWxzZSBwb3NpdGl2ZXNcbiAgLy8gd2hlbiBjaGVja2luZyBmb3IgYSBkaXJlY3RpdmUncyBwcmVzZW5jZS5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAlIEJMT09NX1NJWkU7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgaWYgKGJsb29tQml0IDwgMTI4KSB7XG4gICAgLy8gVGhlbiB1c2UgdGhlIG1hc2sgdG8gZmxpcCBvbiB0aGUgYml0ICgwLTMxKSBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSBpbiB0aGF0IGJ1Y2tldFxuICAgIGJsb29tQml0IDwgNjQgPyAoYmxvb21CaXQgPCAzMiA/IChpbmplY3Rvci5iZjAgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYxIHw9IG1hc2spKSA6XG4gICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gKGluamVjdG9yLmJmMiB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjMgfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gKGluamVjdG9yLmJmNCB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjUgfD0gbWFzaykpIDpcbiAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IChpbmplY3Rvci5iZjYgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY3IHw9IG1hc2spKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogTEluamVjdG9yIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gbm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUobm9kZTogTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUpOiBMSW5qZWN0b3Ige1xuICBjb25zdCBub2RlSW5qZWN0b3IgPSBub2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgcGFyZW50ID0gZ2V0UGFyZW50TE5vZGUobm9kZSk7XG4gIGNvbnN0IHBhcmVudEluamVjdG9yID0gcGFyZW50ICYmIHBhcmVudC5ub2RlSW5qZWN0b3I7XG4gIGlmIChub2RlSW5qZWN0b3IgIT0gcGFyZW50SW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbm9kZUluamVjdG9yICE7XG4gIH1cbiAgcmV0dXJuIG5vZGUubm9kZUluamVjdG9yID0ge1xuICAgIHBhcmVudDogcGFyZW50SW5qZWN0b3IsXG4gICAgbm9kZTogbm9kZSxcbiAgICBiZjA6IDAsXG4gICAgYmYxOiAwLFxuICAgIGJmMjogMCxcbiAgICBiZjM6IDAsXG4gICAgYmY0OiAwLFxuICAgIGJmNTogMCxcbiAgICBiZjY6IDAsXG4gICAgYmY3OiAwLFxuICAgIGNiZjA6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMCB8IHBhcmVudEluamVjdG9yLmJmMCxcbiAgICBjYmYxOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjEgfCBwYXJlbnRJbmplY3Rvci5iZjEsXG4gICAgY2JmMjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYyIHwgcGFyZW50SW5qZWN0b3IuYmYyLFxuICAgIGNiZjM6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMyB8IHBhcmVudEluamVjdG9yLmJmMyxcbiAgICBjYmY0OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjQgfCBwYXJlbnRJbmplY3Rvci5iZjQsXG4gICAgY2JmNTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY1IHwgcGFyZW50SW5qZWN0b3IuYmY1LFxuICAgIGNiZjY6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNiB8IHBhcmVudEluamVjdG9yLmJmNixcbiAgICBjYmY3OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjcgfCBwYXJlbnRJbmplY3Rvci5iZjcsXG4gICAgdGVtcGxhdGVSZWY6IG51bGwsXG4gICAgdmlld0NvbnRhaW5lclJlZjogbnVsbCxcbiAgICBlbGVtZW50UmVmOiBudWxsLFxuICAgIGNoYW5nZURldGVjdG9yUmVmOiBudWxsXG4gIH07XG59XG5cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoZGksIGRlZi50eXBlKTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpYyhkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBkZWYpO1xufVxuXG4vKipcbiAqIFNlYXJjaGVzIGZvciBhbiBpbnN0YW5jZSBvZiB0aGUgZ2l2ZW4gdHlwZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSBhbmQgcmV0dXJuc1xuICogdGhhdCBpbnN0YW5jZSBpZiBmb3VuZC5cbiAqXG4gKiBJZiBub3QgZm91bmQsIGl0IHdpbGwgcHJvcGFnYXRlIHVwIHRvIHRoZSBuZXh0IHBhcmVudCBpbmplY3RvciB1bnRpbCB0aGUgdG9rZW5cbiAqIGlzIGZvdW5kIG9yIHRoZSB0b3AgaXMgcmVhY2hlZC5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogTk9URTogdXNlIGBkaXJlY3RpdmVJbmplY3RgIHdpdGggYEBEaXJlY3RpdmVgLCBgQENvbXBvbmVudGAsIGFuZCBgQFBpcGVgLiBGb3JcbiAqIGFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIERPTSByZW5kZXIgdHJlZS5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gVGhlIGRpcmVjdGl2ZSB0eXBlIHRvIHNlYXJjaCBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3MgKGUuZy4gQ2hlY2tQYXJlbnQpXG4gKiBAcmV0dXJucyBUaGUgaW5zdGFuY2UgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MuT3B0aW9uYWwpOiBUfG51bGw7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCB0b2tlbiwgZmxhZ3MpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqIE9yLCBpZiB0aGUgRWxlbWVudFJlZiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBFbGVtZW50UmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0RWxlbWVudFJlZigpOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0VGVtcGxhdGVSZWY8VD4oKTogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3Q29udGFpbmVyUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFZpZXdDb250YWluZXJSZWZcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFZpZXdDb250YWluZXJSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIFZpZXdDb250YWluZXJSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RWaWV3Q29udGFpbmVyUmVmKCk6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqIFJldHVybnMgYSBDaGFuZ2VEZXRlY3RvclJlZiAoYS5rLmEuIGEgVmlld1JlZikgKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDaGFuZ2VEZXRlY3RvclJlZigpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgbnVsbCk7XG59XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgbEVsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxFbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIGNvbnN0IHRFbGVtZW50ID0gbEVsZW1lbnQudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKHRFbGVtZW50LCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdEVsZW1lbnQuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TRUxFQ1RfT05MWSkgYnJlYWs7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld1JlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3RvciBhcyBDaGFuZ2VEZXRlY3RvclJlZiAocHVibGljIGFsaWFzKS5cbiAqIE9yLCBpZiBpdCBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBpbnN0YW5jZS5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ2hhbmdlRGV0ZWN0b3JSZWYgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKFxuICAgIGRpOiBMSW5qZWN0b3IsIGNvbnRleHQ6IGFueSk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBpZiAoZGkuY2hhbmdlRGV0ZWN0b3JSZWYpIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZjtcblxuICBjb25zdCBjdXJyZW50Tm9kZSA9IGRpLm5vZGU7XG4gIGlmIChpc0NvbXBvbmVudChjdXJyZW50Tm9kZS50Tm9kZSkpIHtcbiAgICByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWYgPSBjcmVhdGVWaWV3UmVmKGN1cnJlbnROb2RlLmRhdGEgYXMgTFZpZXcsIGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGUudmlldy5ub2RlKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG4vKiogR2V0cyBvciBjcmVhdGVzIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY2xvc2VzdCBob3N0IGNvbXBvbmVudCAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6XG4gICAgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKGN1cnJlbnROb2RlKTtcbiAgY29uc3QgaG9zdEluamVjdG9yID0gaG9zdE5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBleGlzdGluZ1JlZiA9IGhvc3RJbmplY3RvciAmJiBob3N0SW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcmV0dXJuIGV4aXN0aW5nUmVmID9cbiAgICAgIGV4aXN0aW5nUmVmIDpcbiAgICAgIGNyZWF0ZVZpZXdSZWYoXG4gICAgICAgICAgaG9zdE5vZGUuZGF0YSBhcyBMVmlldyxcbiAgICAgICAgICBob3N0Tm9kZS52aWV3XG4gICAgICAgICAgICAgIC5kaXJlY3RpdmVzICFbaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnRdKTtcbn1cblxuLyoqXG4gKiBJZiB0aGUgbm9kZSBpcyBhbiBlbWJlZGRlZCB2aWV3LCB0cmF2ZXJzZXMgdXAgdGhlIHZpZXcgdHJlZSB0byByZXR1cm4gdGhlIGNsb3Nlc3RcbiAqIGFuY2VzdG9yIHZpZXcgdGhhdCBpcyBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC4gSWYgaXQncyBhbHJlYWR5IGEgY29tcG9uZW50IG5vZGUsXG4gKiByZXR1cm5zIGl0c2VsZi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKG5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6IExFbGVtZW50Tm9kZSB7XG4gIHdoaWxlIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbm9kZSA9IG5vZGUudmlldy5ub2RlO1xuICB9XG4gIHJldHVybiBub2RlIGFzIExFbGVtZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBTZWFyY2hlcyBmb3IgYW4gaW5zdGFuY2Ugb2YgdGhlIGdpdmVuIGRpcmVjdGl2ZSB0eXBlIHVwIHRoZSBpbmplY3RvciB0cmVlIGFuZCByZXR1cm5zXG4gKiB0aGF0IGluc3RhbmNlIGlmIGZvdW5kLlxuICpcbiAqIFNwZWNpZmljYWxseSwgaXQgZ2V0cyB0aGUgYmxvb20gZmlsdGVyIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSAoc2VlIGJsb29tSGFzaEJpdCksXG4gKiBjaGVja3MgdGhhdCBiaXQgYWdhaW5zdCB0aGUgYmxvb20gZmlsdGVyIHN0cnVjdHVyZSB0byBpZGVudGlmeSBhbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmVcbiAqIHRoZSBkaXJlY3RpdmUgKHNlZSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKSwgdGhlbiBzZWFyY2hlcyB0aGUgZGlyZWN0aXZlcyBvbiB0aGF0IGluamVjdG9yXG4gKiBmb3IgYSBtYXRjaC5cbiAqXG4gKiBJZiBub3QgZm91bmQsIGl0IHdpbGwgcHJvcGFnYXRlIHVwIHRvIHRoZSBuZXh0IHBhcmVudCBpbmplY3RvciB1bnRpbCB0aGUgdG9rZW5cbiAqIGlzIGZvdW5kIG9yIHRoZSB0b3AgaXMgcmVhY2hlZC5cbiAqXG4gKiBAcGFyYW0gZGkgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSBkaXJlY3RpdmUgdHlwZSB0byBzZWFyY2ggZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzIChlLmcuIENoZWNrUGFyZW50KVxuICogQHJldHVybnMgVGhlIGluc3RhbmNlIGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgZGk6IExJbmplY3RvciwgdG9rZW46IFR5cGU8VD4sIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXQodG9rZW4pO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykuIElmIHRoZXJlIGlzIG5vIGhhc2gsIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoID09PSBudWxsKSB7XG4gICAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpLnZpZXcuaW5qZWN0b3I7XG4gICAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBkaTtcblxuICAgIHdoaWxlIChpbmplY3Rvcikge1xuICAgICAgLy8gR2V0IHRoZSBjbG9zZXN0IHBvdGVudGlhbCBtYXRjaGluZyBpbmplY3RvciAodXB3YXJkcyBpbiB0aGUgaW5qZWN0b3IgdHJlZSkgdGhhdFxuICAgICAgLy8gKnBvdGVudGlhbGx5KiBoYXMgdGhlIHRva2VuLlxuICAgICAgaW5qZWN0b3IgPSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKGluamVjdG9yLCBibG9vbUhhc2gsIGZsYWdzKTtcblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBjb25zdCBub2RlID0gaW5qZWN0b3Iubm9kZTtcbiAgICAgIGNvbnN0IG5vZGVGbGFncyA9IG5vZGUudE5vZGUuZmxhZ3M7XG4gICAgICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gICAgICBpZiAoY291bnQgIT09IDApIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgICAgIGNvbnN0IGRlZnMgPSBub2RlLnZpZXcudFZpZXcuZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RGlyZWN0aXZlSW5zdGFuY2Uobm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtpXSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5qZWN0b3IgPT09IGRpICYmIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlLCB0b2tlbikpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIElmIGZsYWdzIHBlcm1pdCwgdHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICAgIGluamVjdG9yID0gbnVsbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIE5vIGRpcmVjdGl2ZSB3YXMgZm91bmQgZm9yIHRoZSBnaXZlbiB0b2tlbi5cbiAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuT3B0aW9uYWwpIHJldHVybiBudWxsO1xuICB0aHJvdyBuZXcgRXJyb3IoYEluamVjdG9yOiBOT1RfRk9VTkQgWyR7c3RyaW5naWZ5KHRva2VuKX1dYCk7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPihub2RlOiBMTm9kZSwgdG9rZW46IGFueSk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBub2RlLnZpZXcudFZpZXcuY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBub2RlLnZpZXcudFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBHaXZlbiBhIGRpcmVjdGl2ZSB0eXBlLCB0aGlzIGZ1bmN0aW9uIHJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3QgdGhlIGRpcmVjdGl2ZSBpcyBwcmVzZW50LlxuICpcbiAqIFdoZW4gdGhlIGRpcmVjdGl2ZSB3YXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciwgaXQgd2FzIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIGNsYXNzLiBTaW5jZSB0aGVyZSBhcmUgb25seSBCTE9PTV9TSVpFIHNsb3RzIHBlciBibG9vbSBmaWx0ZXIsIHRoZSBkaXJlY3RpdmUnc1xuICogSUQgbXVzdCBiZSBtb2R1bG8tZWQgYnkgQkxPT01fU0laRSB0byBnZXQgdGhlIGNvcnJlY3QgYmxvb20gYml0IChkaXJlY3RpdmVzIHNoYXJlIHNsb3RzIGFmdGVyXG4gKiBCTE9PTV9TSVpFIGlzIHJlYWNoZWQpLlxuICpcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdHlwZVxuICogQHJldHVybnMgVGhlIGJsb29tIGJpdCB0byBjaGVjayBmb3IgdGhlIGRpcmVjdGl2ZVxuICovXG5mdW5jdGlvbiBibG9vbUhhc2hCaXQodHlwZTogVHlwZTxhbnk+KTogbnVtYmVyfG51bGwge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSAnbnVtYmVyJyA/IGlkICUgQkxPT01fU0laRSA6IG51bGw7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIGEgY2VydGFpbiBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgY29ycmVzcG9uZHMgdG8gYSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuIEdpdmVuIHRoZSBibG9vbSBiaXQgdG9cbiAqIGNoZWNrIGFuZCBhIHN0YXJ0aW5nIGluamVjdG9yLCB0aGlzIGZ1bmN0aW9uIHRyYXZlcnNlcyB1cCBpbmplY3RvcnMgdW50aWwgaXQgZmluZHMgYW5cbiAqIGluamVjdG9yIHRoYXQgY29udGFpbnMgYSAxIGZvciB0aGF0IGJpdCBpbiBpdHMgYmxvb20gZmlsdGVyLiBBIDEgaW5kaWNhdGVzIHRoYXQgdGhlXG4gKiBpbmplY3RvciBtYXkgaGF2ZSB0aGF0IGRpcmVjdGl2ZS4gSXQgb25seSAqbWF5KiBoYXZlIHRoZSBkaXJlY3RpdmUgYmVjYXVzZSBkaXJlY3RpdmVzIGJlZ2luXG4gKiB0byBzaGFyZSBibG9vbSBmaWx0ZXIgYml0cyBhZnRlciB0aGUgQkxPT01fU0laRSBpcyByZWFjaGVkLCBhbmQgaXQgY291bGQgY29ycmVzcG9uZCB0byBhXG4gKiBkaWZmZXJlbnQgZGlyZWN0aXZlIHNoYXJpbmcgdGhlIGJpdC5cbiAqXG4gKiBOb3RlOiBXZSBjYW4gc2tpcCBjaGVja2luZyBmdXJ0aGVyIGluamVjdG9ycyB1cCB0aGUgdHJlZSBpZiBhbiBpbmplY3RvcidzIGNiZiBzdHJ1Y3R1cmVcbiAqIGhhcyBhIDAgZm9yIHRoYXQgYmxvb20gYml0LiBTaW5jZSBjYmYgY29udGFpbnMgdGhlIG1lcmdlZCB2YWx1ZSBvZiBhbGwgdGhlIHBhcmVudFxuICogaW5qZWN0b3JzLCBhIDAgaW4gdGhlIGJsb29tIGJpdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcGFyZW50cyBkZWZpbml0ZWx5IGRvIG5vdCBjb250YWluXG4gKiB0aGUgZGlyZWN0aXZlIGFuZCBkbyBub3QgbmVlZCB0byBiZSBjaGVja2VkLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgc3RhcnRpbmcgbm9kZSBpbmplY3RvciB0byBjaGVja1xuICogQHBhcmFtICBibG9vbUJpdCBUaGUgYml0IHRvIGNoZWNrIGluIGVhY2ggaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIEBwYXJhbSAgZmxhZ3MgVGhlIGluamVjdGlvbiBmbGFncyBmb3IgdGhpcyBpbmplY3Rpb24gc2l0ZSAoZS5nLiBPcHRpb25hbCBvciBTa2lwU2VsZilcbiAqIEByZXR1cm5zIEFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSB0aGUgZGlyZWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKFxuICAgIHN0YXJ0SW5qZWN0b3I6IExJbmplY3RvciwgYmxvb21CaXQ6IG51bWJlciwgZmxhZ3M6IEluamVjdEZsYWdzKTogTEluamVjdG9yfG51bGwge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZSAqaXNuJ3QqIGFcbiAgLy8gbWF0Y2guXG4gIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPVxuICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZiA/IHN0YXJ0SW5qZWN0b3IucGFyZW50ICEgOiBzdGFydEluamVjdG9yO1xuICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICAgIGxldCB2YWx1ZTogbnVtYmVyO1xuICAgIGlmIChibG9vbUJpdCA8IDEyOCkge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDY0ID8gKGJsb29tQml0IDwgMzIgPyBpbmplY3Rvci5iZjAgOiBpbmplY3Rvci5iZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuYmYyIDogaW5qZWN0b3IuYmYzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBibG9vbUJpdCA8IDE5MiA/IChibG9vbUJpdCA8IDE2MCA/IGluamVjdG9yLmJmNCA6IGluamVjdG9yLmJmNSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDIyNCA/IGluamVjdG9yLmJmNiA6IGluamVjdG9yLmJmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAgIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gICAgaWYgKCh2YWx1ZSAmIG1hc2spID09PSBtYXNrKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3I7XG4gICAgfSBlbHNlIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudCBpbmplY3RvciBkb2VzIG5vdCBoYXZlIHRoZSBkaXJlY3RpdmUsIGNoZWNrIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgYW5jZXN0b3JcbiAgICAvLyBpbmplY3RvcnMgKGNiZjAgLSBjYmY3KS4gVGhlc2UgZmlsdGVycyBjYXB0dXJlICphbGwqIGFuY2VzdG9yIGluamVjdG9ycy5cbiAgICBpZiAoYmxvb21CaXQgPCAxMjgpIHtcbiAgICAgIHZhbHVlID0gYmxvb21CaXQgPCA2NCA/IChibG9vbUJpdCA8IDMyID8gaW5qZWN0b3IuY2JmMCA6IGluamVjdG9yLmNiZjEpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChibG9vbUJpdCA8IDk2ID8gaW5qZWN0b3IuY2JmMiA6IGluamVjdG9yLmNiZjMpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGJsb29tQml0IDwgMTkyID8gKGJsb29tQml0IDwgMTYwID8gaW5qZWN0b3IuY2JmNCA6IGluamVjdG9yLmNiZjUpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoYmxvb21CaXQgPCAyMjQgPyBpbmplY3Rvci5jYmY2IDogaW5qZWN0b3IuY2JmNyk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlIHVwIHRvXG4gICAgLy8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZSBjYW4gYWJvcnQuXG4gICAgaW5qZWN0b3IgPSAodmFsdWUgJiBtYXNrKSA/IGluamVjdG9yLnBhcmVudCA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgYXJlIGluIHRoZSBzYW1lIGhvc3Qgdmlldy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzdXBwb3J0IEBIb3N0KCkgZGVjb3JhdG9ycy4gSWYgQEhvc3QoKSBpcyBzZXQsIHdlIHNob3VsZCBzdG9wIHNlYXJjaGluZyBvbmNlXG4gKiB0aGUgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgdmlldyBkb24ndCBtYXRjaCBiZWNhdXNlIGl0IG1lYW5zIHdlJ2QgY3Jvc3MgdGhlIHZpZXcgYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIHNhbWVIb3N0VmlldyhpbmplY3RvcjogTEluamVjdG9yKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWluamVjdG9yLnBhcmVudCAmJiBpbmplY3Rvci5wYXJlbnQubm9kZS52aWV3ID09PSBpbmplY3Rvci5ub2RlLnZpZXc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZWFkRnJvbUluamVjdG9yRm48VD4ge1xuICBjb25zdHJ1Y3RvcihyZWFkb25seSByZWFkOiAoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUluZGV4PzogbnVtYmVyKSA9PiBUKSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmb3IgYSBnaXZlbiBub2RlIGluamVjdG9yIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgRWxlbWVudFJlZlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBkaS5lbGVtZW50UmVmIHx8IChkaS5lbGVtZW50UmVmID0gbmV3IEVsZW1lbnRSZWYoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGkubm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyID8gbnVsbCA6IGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKG5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3LmRpcmVjdGl2ZXMgIVtkaXJlY3RpdmVJZHhdO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpO1xuICAgICAgfSBlbHNlIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Db250YWluZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpO1xuICAgICAgfVxuICAgICAgdGhyb3cgbmV3IEVycm9yKCdmYWlsJyk7XG4gICAgfSkgYXMgYW55IGFzIFF1ZXJ5UmVhZFR5cGU8YW55Pik7XG5cbi8qKiBBIHJlZiB0byBhIG5vZGUncyBuYXRpdmUgZWxlbWVudC4gKi9cbmNsYXNzIEVsZW1lbnRSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZWFkb25seSBuYXRpdmVFbGVtZW50OiBhbnk7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZUVsZW1lbnQ6IGFueSkgeyB0aGlzLm5hdGl2ZUVsZW1lbnQgPSBuYXRpdmVFbGVtZW50OyB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBpZiAoIWRpLnZpZXdDb250YWluZXJSZWYpIHtcbiAgICBjb25zdCB2Y1JlZkhvc3QgPSBkaS5ub2RlO1xuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXModmNSZWZIb3N0LCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgY29uc3QgaG9zdFBhcmVudCA9IGdldFBhcmVudExOb2RlKHZjUmVmSG9zdCkgITtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihob3N0UGFyZW50LCB2Y1JlZkhvc3QudmlldywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPSBjcmVhdGVMTm9kZU9iamVjdChcbiAgICAgICAgVE5vZGVUeXBlLkNvbnRhaW5lciwgdmNSZWZIb3N0LnZpZXcsIGhvc3RQYXJlbnQsIHVuZGVmaW5lZCwgbENvbnRhaW5lciwgbnVsbCk7XG5cblxuICAgIGlmICh2Y1JlZkhvc3QucXVlcmllcykge1xuICAgICAgbENvbnRhaW5lck5vZGUucXVlcmllcyA9IHZjUmVmSG9zdC5xdWVyaWVzLmNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID1cbiAgICAgICAgICBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCBudWxsLCBudWxsLCBudWxsLCBudWxsLCBudWxsKTtcbiAgICB9XG5cbiAgICBsQ29udGFpbmVyTm9kZS50Tm9kZSA9IGhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZTtcbiAgICB2Y1JlZkhvc3QuZHluYW1pY0xDb250YWluZXJOb2RlID0gbENvbnRhaW5lck5vZGU7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKHZjUmVmSG9zdC52aWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZXR1cm4gZGkudmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBBIHJlZiB0byBhIGNvbnRhaW5lciB0aGF0IGVuYWJsZXMgYWRkaW5nIGFuZCByZW1vdmluZyB2aWV3cyBmcm9tIHRoYXQgY29udGFpbmVyXG4gKiBpbXBlcmF0aXZlbHkuXG4gKi9cbmNsYXNzIFZpZXdDb250YWluZXJSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcbiAgZWxlbWVudDogdmlld0VuZ2luZV9FbGVtZW50UmVmO1xuICBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHBhcmVudEluamVjdG9yOiBJbmplY3RvcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUpIHt9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgd2hpbGUgKGxDb250YWluZXIudmlld3MubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyLnZpZXdzLmxlbmd0aDtcbiAgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldzxDPih0ZW1wbGF0ZVJlZjogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxDPiwgY29udGV4dD86IEMsIGluZGV4PzogbnVtYmVyKTpcbiAgICAgIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmPEM+IHtcbiAgICBjb25zdCB2aWV3UmVmID0gdGVtcGxhdGVSZWYuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgaW5kZXgpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZV9Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgbmdNb2R1bGU/OiB2aWV3RW5naW5lX05nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZV9Db21wb25lbnRSZWY8Qz4ge1xuICAgIHRocm93IG5vdEltcGxlbWVudGVkKCk7XG4gIH1cblxuICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgRW1iZWRkZWRWaWV3UmVmPGFueT4pLl9sVmlld05vZGU7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICAvLyBpbnZhbGlkYXRlIGNhY2hlIG9mIG5leHQgc2libGluZyBSTm9kZSAod2UgZG8gc2ltaWxhciBvcGVyYXRpb24gaW4gdGhlIGNvbnRhaW5lclJlZnJlc2hFbmRcbiAgICAvLyBpbnN0cnVjdGlvbilcbiAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmUgPSB1bmRlZmluZWQ7XG5cbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgIC8vIFRPRE8obWwpOiBwcm9wZXIgZGVzdHJveSBvZiB0aGUgVmlld1JlZiwgaS5lLiByZWN1cnNpdmVseSBkZXN0cm95IHRoZSBMdmlld05vZGUgYW5kIGl0c1xuICAgIC8vIGNoaWxkcmVuLCBkZWxldGUgRE9NIG5vZGVzIGFuZCBRdWVyeUxpc3QsIHRyaWdnZXIgaG9va3MgKG9uRGVzdHJveSksIGRlc3Ryb3kgdGhlIHJlbmRlcmVyLFxuICAgIC8vIGRldGFjaCBwcm9qZWN0ZWQgbm9kZXNcbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGEudmlld3MubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhLnZpZXdzLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgVGVtcGxhdGVSZWZcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIWRpLnRlbXBsYXRlUmVmKSB7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGRpLm5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIGNvbnN0IGhvc3ROb2RlID0gZGkubm9kZSBhcyBMQ29udGFpbmVyTm9kZTtcbiAgICBjb25zdCBob3N0VE5vZGUgPSBob3N0Tm9kZS50Tm9kZTtcbiAgICBjb25zdCBob3N0VFZpZXcgPSBob3N0Tm9kZS52aWV3LnRWaWV3O1xuICAgIGlmICghaG9zdFROb2RlLnRWaWV3cykge1xuICAgICAgaG9zdFROb2RlLnRWaWV3cyA9IGNyZWF0ZVRWaWV3KGhvc3RUVmlldy5kaXJlY3RpdmVSZWdpc3RyeSwgaG9zdFRWaWV3LnBpcGVSZWdpc3RyeSk7XG4gICAgfVxuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb3ROdWxsKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIGRpLnRlbXBsYXRlUmVmID0gbmV3IFRlbXBsYXRlUmVmPGFueT4oXG4gICAgICAgIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaSksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsIGhvc3ROb2RlLmRhdGEudGVtcGxhdGUgISxcbiAgICAgICAgZ2V0UmVuZGVyZXIoKSwgaG9zdE5vZGUucXVlcmllcyk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWY7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsIHByaXZhdGUgX3RWaWV3OiBUVmlldyxcbiAgICAgIHByaXZhdGUgX3RlbXBsYXRlOiBDb21wb25lbnRUZW1wbGF0ZTxUPiwgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMyxcbiAgICAgIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwpIHtcbiAgICB0aGlzLmVsZW1lbnRSZWYgPSBlbGVtZW50UmVmO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPSByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKFxuICAgICAgICBudWxsLCB0aGlzLl90VmlldywgdGhpcy5fdGVtcGxhdGUsIGNvbnRleHQsIHRoaXMuX3JlbmRlcmVyLCB0aGlzLl9xdWVyaWVzKTtcbiAgICByZXR1cm4gYWRkRGVzdHJveWFibGUobmV3IEVtYmVkZGVkVmlld1JlZih2aWV3Tm9kZSwgdGhpcy5fdGVtcGxhdGUsIGNvbnRleHQpKTtcbiAgfVxufVxuIl19