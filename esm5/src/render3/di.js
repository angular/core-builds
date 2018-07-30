/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { inject, setCurrentInjector } from '../di/injector';
import * as viewEngine from '../linker';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { ComponentFactoryResolver } from './component_ref';
import { addToViewTree, assertPreviousIsParent, createEmbeddedViewNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { VIEWS } from './interfaces/container';
import { DIRECTIVES, HOST_NODE, INJECTOR, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, getChildLNode, getParentLNode, insertView, removeView } from './node_manipulation';
import { ViewRef } from './view_ref';
/**
 * If a directive is diPublic, bloomAdd sets a property on the type with this constant as
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
var BLOOM_MASK = BLOOM_SIZE - 1;
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
    var bloomBit = id & BLOOM_MASK;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var mask = 1 << bloomBit;
    // Use the raw bloomBit number to determine which bloom filter bucket we should check
    // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
    var b7 = bloomBit & 0x80;
    var b6 = bloomBit & 0x40;
    var b5 = bloomBit & 0x20;
    if (b7) {
        b6 ? (b5 ? (injector.bf7 |= mask) : (injector.bf6 |= mask)) :
            (b5 ? (injector.bf5 |= mask) : (injector.bf4 |= mask));
    }
    else {
        b6 ? (b5 ? (injector.bf3 |= mask) : (injector.bf2 |= mask)) :
            (b5 ? (injector.bf1 |= mask) : (injector.bf0 |= mask));
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
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @returns The ComponentFactoryResolver instance to use
 */
export function injectComponentFactoryResolver() {
    return componentFactoryResolver;
}
var componentFactoryResolver = new ComponentFactoryResolver();
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
 * Returns the value associated to the given token from the injectors.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @param nodeInjector Node injector where the search should start
 * @param token The token to look for
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export function getOrCreateInjectable(nodeInjector, token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash !== null) {
        var injector = nodeInjector;
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
                var start = nodeFlags >> 14 /* DirectiveStartingIndexShift */;
                var end = start + count;
                var defs = node.view[TVIEW].directives;
                for (var i = start; i < end; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    var directiveDef = defs[i];
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return node.view[DIRECTIVES][i];
                    }
                }
            }
            // If we *didn't* find the directive for the token and we are searching the current node's
            // injector, it's possible the directive is on this node and hasn't been created yet.
            var instance = void 0;
            if (injector === nodeInjector &&
                (instance = searchMatchesQueuedForCreation(node, token))) {
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
    var moduleInjector = getPreviousOrParentNode().view[INJECTOR];
    var formerInjector = setCurrentInjector(moduleInjector);
    try {
        return inject(token, flags);
    }
    finally {
        setCurrentInjector(formerInjector);
    }
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
 * Returns the bit in an injector's bloom filter that should be used to determine whether or not
 * the directive might be provided by the injector.
 *
 * When a directive is public, it is added to the bloom filter and given a unique ID that can be
 * retrieved on the Type. When the directive isn't public or the token is not a directive `null`
 * is returned as the node injector can not possibly provide that token.
 *
 * @param token the injection token
 * @returns the matching bit to check in the bloom filter or `null` if the token is not known.
 */
function bloomHashBit(token) {
    var id = token[NG_ELEMENT_ID];
    return typeof id === 'number' ? id & BLOOM_MASK : null;
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
    var b7 = bloomBit & 0x80;
    var b6 = bloomBit & 0x40;
    var b5 = bloomBit & 0x20;
    // Traverse up the injector tree until we find a potential match or until we know there *isn't* a
    // match.
    var injector = flags & 4 /* SkipSelf */ ? startInjector.parent : startInjector;
    while (injector) {
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        var value = void 0;
        if (b7) {
            value = b6 ? (b5 ? injector.bf7 : injector.bf6) : (b5 ? injector.bf5 : injector.bf4);
        }
        else {
            value = b6 ? (b5 ? injector.bf3 : injector.bf2) : (b5 ? injector.bf1 : injector.bf0);
        }
        // If the bloom filter value has the bit corresponding to the directive's bloomBit flipped on,
        // this injector is a potential match.
        if (value & mask) {
            return injector;
        }
        if (flags & 2 /* Self */ || flags & 1 /* Host */ && !sameHostView(injector)) {
            return null;
        }
        // If the current injector does not have the directive, check the bloom filters for the ancestor
        // injectors (cbf0 - cbf7). These filters capture *all* ancestor injectors.
        if (b7) {
            value = b6 ? (b5 ? injector.cbf7 : injector.cbf6) : (b5 ? injector.cbf5 : injector.cbf4);
        }
        else {
            value = b6 ? (b5 ? injector.cbf3 : injector.cbf2) : (b5 ? injector.cbf1 : injector.cbf0);
        }
        // If the ancestor bloom filter value has the bit corresponding to the directive, traverse up to
        // find the specific injector. If the ancestor bloom filter does not have the bit, we can abort.
        if (value & mask) {
            injector = injector.parent;
        }
        else {
            return null;
        }
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
    ViewContainerRef.prototype.createComponent = function (componentFactory, index, injector, projectableNodes, ngModuleRef) {
        var contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && contextInjector) {
            ngModuleRef = contextInjector.get(viewEngine.NgModuleRef);
        }
        var componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
    };
    ViewContainerRef.prototype.insert = function (viewRef, index) {
        if (viewRef.destroyed) {
            throw new Error('Cannot insert a destroyed View in a ViewContainer!');
        }
        var lViewNode = viewRef._lViewNode;
        var adjustedIdx = this._adjustIndex(index);
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
        detachView(this._lContainerNode, adjustedIdx);
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
        di.templateRef = new TemplateRef(hostNode.view, getOrCreateElementRef(di), hostTNode.tViews, getRenderer(), hostNode.data[QUERIES]);
    }
    return di.templateRef;
}
var TemplateRef = /** @class */ (function () {
    function TemplateRef(_declarationParentView, elementRef, _tView, _renderer, _queries) {
        this._declarationParentView = _declarationParentView;
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
        this.elementRef = elementRef;
    }
    TemplateRef.prototype.createEmbeddedView = function (context, containerNode, index) {
        var viewNode = createEmbeddedViewNode(this._tView, context, this._declarationParentView, this._renderer, this._queries);
        if (containerNode) {
            insertView(containerNode, viewNode, index);
        }
        renderEmbeddedTemplate(viewNode, this._tView, context, 1 /* Create */);
        var viewRef = new ViewRef(viewNode.data, context);
        viewRef._lViewNode = viewNode;
        return viewRef;
    };
    return TemplateRef;
}());

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU9ILE9BQU8sRUFBd0IsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFDakYsT0FBTyxLQUFLLFVBQVUsTUFBTSxXQUFXLENBQUM7QUFHeEMsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVPLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQU03QyxPQUFPLEVBQW1CLFVBQVUsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFhLE9BQU8sRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDaEksT0FBTyxFQUFDLHlCQUF5QixFQUFFLGNBQWMsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUN4RSxPQUFPLEVBQUMsMEJBQTBCLEVBQUUsV0FBVyxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUMsTUFBTSxxQkFBcUIsQ0FBQztBQUMvSSxPQUFPLEVBQUMsT0FBTyxFQUFDLE1BQU0sWUFBWSxDQUFDO0FBSW5DOzs7O0dBSUc7QUFDSCxJQUFNLGFBQWEsR0FBRyxtQkFBbUIsQ0FBQztBQUUx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Q3BFLE1BQWEsRUFBVSxTQUFvQixFQUFVLFFBQXVCO1FBRDVFLDJCQUFzQixHQUF0QixzQkFBc0IsQ0FBVztRQUNqQyxXQUFNLEdBQU4sTUFBTSxDQUFPO1FBQVUsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUFVLGFBQVEsR0FBUixRQUFRLENBQWU7UUFDdEYsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7SUFDL0IsQ0FBQztJQUVELHdDQUFrQixHQUFsQixVQUFtQixPQUFVLEVBQUUsYUFBOEIsRUFBRSxLQUFjO1FBRTNFLElBQU0sUUFBUSxHQUFHLHNCQUFzQixDQUNuQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsc0JBQXNCLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEYsSUFBSSxhQUFhLEVBQUU7WUFDakIsVUFBVSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsS0FBTyxDQUFDLENBQUM7U0FDOUM7UUFDRCxzQkFBc0IsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE1BQU0sRUFBRSxPQUFPLGlCQUFxQixDQUFDO1FBQzNFLElBQU0sT0FBTyxHQUFHLElBQUksT0FBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDcEQsT0FBTyxDQUFDLFVBQVUsR0FBRyxRQUFRLENBQUM7UUFDOUIsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUNILGtCQUFDO0FBQUQsQ0FBQyxBQXJCRCxJQXFCQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBpbmplY3QsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0ICogYXMgdmlld0VuZ2luZSBmcm9tICcuLi9saW5rZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHthZGRUb1ZpZXdUcmVlLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBjcmVhdGVFbWJlZGRlZFZpZXdOb2RlLCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVMTm9kZU9iamVjdCwgY3JlYXRlVE5vZGUsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7VklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbCwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIExDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMVmlld05vZGUsIFRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtMUXVlcmllcywgUXVlcnlSZWFkVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL3F1ZXJ5JztcbmltcG9ydCB7UmVuZGVyZXIzfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBESVJFQ1RJVkVTLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIFFVRVJJRVMsIFJFTkRFUkVSLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcywgYXNzZXJ0Tm9kZVR5cGV9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuaW1wb3J0IHthZGRSZW1vdmVWaWV3RnJvbUNvbnRhaW5lciwgYXBwZW5kQ2hpbGQsIGRldGFjaFZpZXcsIGdldENoaWxkTE5vZGUsIGdldFBhcmVudExOb2RlLCBpbnNlcnRWaWV3LCByZW1vdmVWaWV3fSBmcm9tICcuL25vZGVfbWFuaXB1bGF0aW9uJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIElmIGEgZGlyZWN0aXZlIGlzIGRpUHVibGljLCBibG9vbUFkZCBzZXRzIGEgcHJvcGVydHkgb24gdGhlIHR5cGUgd2l0aCB0aGlzIGNvbnN0YW50IGFzXG4gKiB0aGUga2V5IGFuZCB0aGUgZGlyZWN0aXZlJ3MgdW5pcXVlIElEIGFzIHRoZSB2YWx1ZS4gVGhpcyBhbGxvd3MgdXMgdG8gbWFwIGRpcmVjdGl2ZXMgdG8gdGhlaXJcbiAqIGJsb29tIGZpbHRlciBiaXQgZm9yIERJLlxuICovXG5jb25zdCBOR19FTEVNRU5UX0lEID0gJ19fTkdfRUxFTUVOVF9JRF9fJztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIHRoZSBkaXJlY3RpdmUgc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9yOiBMSW5qZWN0b3IsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuXG4gIGlmIChiNykge1xuICAgIGI2ID8gKGI1ID8gKGluamVjdG9yLmJmNyB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjYgfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/IChpbmplY3Rvci5iZjUgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY0IHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBiNiA/IChiNSA/IChpbmplY3Rvci5iZjMgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYyIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAoaW5qZWN0b3IuYmYxIHw9IG1hc2spIDogKGluamVjdG9yLmJmMCB8PSBtYXNrKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IExJbmplY3RvciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKSBhcyBMRWxlbWVudE5vZGUgfCBMQ29udGFpbmVyTm9kZSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIG5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKG5vZGU6IExFbGVtZW50Tm9kZSB8IExDb250YWluZXJOb2RlKTogTEluamVjdG9yIHtcbiAgY29uc3Qgbm9kZUluamVjdG9yID0gbm9kZS5ub2RlSW5qZWN0b3I7XG4gIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudExOb2RlKG5vZGUpO1xuICBjb25zdCBwYXJlbnRJbmplY3RvciA9IHBhcmVudCAmJiBwYXJlbnQubm9kZUluamVjdG9yO1xuICBpZiAobm9kZUluamVjdG9yICE9IHBhcmVudEluamVjdG9yKSB7XG4gICAgcmV0dXJuIG5vZGVJbmplY3RvciAhO1xuICB9XG4gIHJldHVybiBub2RlLm5vZGVJbmplY3RvciA9IHtcbiAgICBwYXJlbnQ6IHBhcmVudEluamVjdG9yLFxuICAgIG5vZGU6IG5vZGUsXG4gICAgYmYwOiAwLFxuICAgIGJmMTogMCxcbiAgICBiZjI6IDAsXG4gICAgYmYzOiAwLFxuICAgIGJmNDogMCxcbiAgICBiZjU6IDAsXG4gICAgYmY2OiAwLFxuICAgIGJmNzogMCxcbiAgICBjYmYwOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjAgfCBwYXJlbnRJbmplY3Rvci5iZjAsXG4gICAgY2JmMTogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYxIHwgcGFyZW50SW5qZWN0b3IuYmYxLFxuICAgIGNiZjI6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMiB8IHBhcmVudEluamVjdG9yLmJmMixcbiAgICBjYmYzOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjMgfCBwYXJlbnRJbmplY3Rvci5iZjMsXG4gICAgY2JmNDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY0IHwgcGFyZW50SW5qZWN0b3IuYmY0LFxuICAgIGNiZjU6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNSB8IHBhcmVudEluamVjdG9yLmJmNSxcbiAgICBjYmY2OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjYgfCBwYXJlbnRJbmplY3Rvci5iZjYsXG4gICAgY2JmNzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY3IHwgcGFyZW50SW5qZWN0b3IuYmY3LFxuICAgIHRlbXBsYXRlUmVmOiBudWxsLFxuICAgIHZpZXdDb250YWluZXJSZWY6IG51bGwsXG4gICAgZWxlbWVudFJlZjogbnVsbCxcbiAgICBjaGFuZ2VEZXRlY3RvclJlZjogbnVsbCxcbiAgfTtcbn1cblxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoZGk6IExJbmplY3RvciwgZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGRpLCBkZWYudHlwZSk7XG59XG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWMoZGVmOiBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+KTogdm9pZCB7XG4gIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBkZWYpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBgZGlyZWN0aXZlSW5qZWN0YCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBkaXJlY3RpdmUsIGNvbXBvbmVudCBhbmQgcGlwZSBmYWN0b3JpZXMuXG4gKiAgQWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgbm9kZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIHR5cGUgb3IgdG9rZW4gdG8gaW5qZWN0XG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEVsZW1lbnRSZWYoKTogdmlld0VuZ2luZS5FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFRlbXBsYXRlUmVmPFQ+KCk6IHZpZXdFbmdpbmUuVGVtcGxhdGVSZWY8VD4ge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Vmlld0NvbnRhaW5lclJlZigpOiB2aWV3RW5naW5lLlZpZXdDb250YWluZXJSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKiBSZXR1cm5zIGEgQ2hhbmdlRGV0ZWN0b3JSZWYgKGEuay5hLiBhIFZpZXdSZWYpICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q2hhbmdlRGV0ZWN0b3JSZWYoKTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIG51bGwpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGVcbiAqIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlclxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIoKTogdmlld0VuZ2luZS5Db21wb25lbnRGYWN0b3J5UmVzb2x2ZXIge1xuICByZXR1cm4gY29tcG9uZW50RmFjdG9yeVJlc29sdmVyO1xufVxuY29uc3QgY29tcG9uZW50RmFjdG9yeVJlc29sdmVyOiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXIgPSBuZXcgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk7XG5cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgY29uc3QgbEVsZW1lbnQgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGxFbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gIGNvbnN0IHRFbGVtZW50ID0gbEVsZW1lbnQudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHRFbGVtZW50LCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdEVsZW1lbnQuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICogT3IsIGlmIGl0IGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIGluc3RhbmNlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoXG4gICAgZGk6IExJbmplY3RvciwgY29udGV4dDogYW55KTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChkaS5jaGFuZ2VEZXRlY3RvclJlZikgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIGNvbnN0IGN1cnJlbnROb2RlID0gZGkubm9kZTtcbiAgaWYgKGlzQ29tcG9uZW50KGN1cnJlbnROb2RlLnROb2RlKSkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmKGN1cnJlbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLCBjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlLnZpZXdbSE9TVF9OT0RFXSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuLyoqIEdldHMgb3IgY3JlYXRlcyBDaGFuZ2VEZXRlY3RvclJlZiBmb3IgdGhlIGNsb3Nlc3QgaG9zdCBjb21wb25lbnQgKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOlxuICAgIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3RvcihjdXJyZW50Tm9kZSk7XG4gIGNvbnN0IGhvc3RJbmplY3RvciA9IGhvc3ROb2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgZXhpc3RpbmdSZWYgPSBob3N0SW5qZWN0b3IgJiYgaG9zdEluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIHJldHVybiBleGlzdGluZ1JlZiA/XG4gICAgICBleGlzdGluZ1JlZiA6XG4gICAgICBuZXcgVmlld1JlZihcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSxcbiAgICAgICAgICBob3N0Tm9kZVxuICAgICAgICAgICAgICAudmlld1tESVJFQ1RJVkVTXSAhW2hvc3ROb2RlLnROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0XSk7XG59XG5cbi8qKlxuICogSWYgdGhlIG5vZGUgaXMgYW4gZW1iZWRkZWQgdmlldywgdHJhdmVyc2VzIHVwIHRoZSB2aWV3IHRyZWUgdG8gcmV0dXJuIHRoZSBjbG9zZXN0XG4gKiBhbmNlc3RvciB2aWV3IHRoYXQgaXMgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuIElmIGl0J3MgYWxyZWFkeSBhIGNvbXBvbmVudCBub2RlLFxuICogcmV0dXJucyBpdHNlbGYuXG4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3Rvcihub2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOiBMRWxlbWVudE5vZGUge1xuICB3aGlsZSAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5vZGUgPSBub2RlLnZpZXdbSE9TVF9OT0RFXTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIG5vZGVJbmplY3RvcjogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdCh0b2tlbik7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKSBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggIT09IG51bGwpIHtcbiAgICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID0gbm9kZUluamVjdG9yO1xuXG4gICAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgICAvLyBHZXQgdGhlIGNsb3Nlc3QgcG90ZW50aWFsIG1hdGNoaW5nIGluamVjdG9yICh1cHdhcmRzIGluIHRoZSBpbmplY3RvciB0cmVlKSB0aGF0XG4gICAgICAvLyAqcG90ZW50aWFsbHkqIGhhcyB0aGUgdG9rZW4uXG4gICAgICBpbmplY3RvciA9IGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoaW5qZWN0b3IsIGJsb29tSGFzaCwgZmxhZ3MpO1xuXG4gICAgICAvLyBJZiBubyBpbmplY3RvciBpcyBmb3VuZCwgd2UgKmtub3cqIHRoYXQgdGhlcmUgaXMgbm8gYW5jZXN0b3IgaW5qZWN0b3IgdGhhdCBjb250YWlucyB0aGVcbiAgICAgIC8vIHRva2VuLCBzbyB3ZSBhYm9ydC5cbiAgICAgIGlmICghaW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IG5vZGUgPSBpbmplY3Rvci5ub2RlO1xuICAgICAgY29uc3Qgbm9kZUZsYWdzID0gbm9kZS50Tm9kZS5mbGFncztcbiAgICAgIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICAgICAgY29uc3QgZGVmcyA9IG5vZGUudmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnZpZXdbRElSRUNUSVZFU10gIVtpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgKmRpZG4ndCogZmluZCB0aGUgZGlyZWN0aXZlIGZvciB0aGUgdG9rZW4gYW5kIHdlIGFyZSBzZWFyY2hpbmcgdGhlIGN1cnJlbnQgbm9kZSdzXG4gICAgICAvLyBpbmplY3RvciwgaXQncyBwb3NzaWJsZSB0aGUgZGlyZWN0aXZlIGlzIG9uIHRoaXMgbm9kZSBhbmQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG4gICAgICBsZXQgaW5zdGFuY2U6IFR8bnVsbDtcbiAgICAgIGlmIChpbmplY3RvciA9PT0gbm9kZUluamVjdG9yICYmXG4gICAgICAgICAgKGluc3RhbmNlID0gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGUsIHRva2VuKSkpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgLy8gSWYgZmxhZ3MgcGVybWl0LCB0cmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgICAgaW5qZWN0b3IgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpLnZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGU6IExOb2RlLCB0b2tlbjogYW55KTogVHxudWxsIHtcbiAgY29uc3QgbWF0Y2hlcyA9IG5vZGUudmlld1tUVklFV10uY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlRGlyZWN0aXZlKGRlZiwgaSArIDEsIG1hdGNoZXMsIG5vZGUudmlld1tUVklFV10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICovXG5mdW5jdGlvbiBibG9vbUhhc2hCaXQodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6IG51bWJlcnxudWxsIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgJiBCTE9PTV9NQVNLIDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2xvc2VzdCBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgYSBjZXJ0YWluIGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBjb3JyZXNwb25kcyB0byBhIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci4gR2l2ZW4gdGhlIGJsb29tIGJpdCB0b1xuICogY2hlY2sgYW5kIGEgc3RhcnRpbmcgaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gdHJhdmVyc2VzIHVwIGluamVjdG9ycyB1bnRpbCBpdCBmaW5kcyBhblxuICogaW5qZWN0b3IgdGhhdCBjb250YWlucyBhIDEgZm9yIHRoYXQgYml0IGluIGl0cyBibG9vbSBmaWx0ZXIuIEEgMSBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAqIGluamVjdG9yIG1heSBoYXZlIHRoYXQgZGlyZWN0aXZlLiBJdCBvbmx5ICptYXkqIGhhdmUgdGhlIGRpcmVjdGl2ZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYmVnaW5cbiAqIHRvIHNoYXJlIGJsb29tIGZpbHRlciBiaXRzIGFmdGVyIHRoZSBCTE9PTV9TSVpFIGlzIHJlYWNoZWQsIGFuZCBpdCBjb3VsZCBjb3JyZXNwb25kIHRvIGFcbiAqIGRpZmZlcmVudCBkaXJlY3RpdmUgc2hhcmluZyB0aGUgYml0LlxuICpcbiAqIE5vdGU6IFdlIGNhbiBza2lwIGNoZWNraW5nIGZ1cnRoZXIgaW5qZWN0b3JzIHVwIHRoZSB0cmVlIGlmIGFuIGluamVjdG9yJ3MgY2JmIHN0cnVjdHVyZVxuICogaGFzIGEgMCBmb3IgdGhhdCBibG9vbSBiaXQuIFNpbmNlIGNiZiBjb250YWlucyB0aGUgbWVyZ2VkIHZhbHVlIG9mIGFsbCB0aGUgcGFyZW50XG4gKiBpbmplY3RvcnMsIGEgMCBpbiB0aGUgYmxvb20gYml0IGluZGljYXRlcyB0aGF0IHRoZSBwYXJlbnRzIGRlZmluaXRlbHkgZG8gbm90IGNvbnRhaW5cbiAqIHRoZSBkaXJlY3RpdmUgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIGNoZWNrZWQuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBzdGFydGluZyBub2RlIGluamVjdG9yIHRvIGNoZWNrXG4gKiBAcGFyYW0gIGJsb29tQml0IFRoZSBiaXQgdG8gY2hlY2sgaW4gZWFjaCBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogQHBhcmFtICBmbGFncyBUaGUgaW5qZWN0aW9uIGZsYWdzIGZvciB0aGlzIGluamVjdGlvbiBzaXRlIChlLmcuIE9wdGlvbmFsIG9yIFNraXBTZWxmKVxuICogQHJldHVybnMgQW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIHRoZSBkaXJlY3RpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoXG4gICAgc3RhcnRJbmplY3RvcjogTEluamVjdG9yLCBibG9vbUJpdDogbnVtYmVyLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBMSW5qZWN0b3J8bnVsbCB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG5cbiAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlICppc24ndCogYVxuICAvLyBtYXRjaC5cbiAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9XG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmID8gc3RhcnRJbmplY3Rvci5wYXJlbnQgOiBzdGFydEluamVjdG9yO1xuXG4gIHdoaWxlIChpbmplY3Rvcikge1xuICAgIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAgIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAgIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgICBpZiAoYjcpIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5iZjcgOiBpbmplY3Rvci5iZjYpIDogKGI1ID8gaW5qZWN0b3IuYmY1IDogaW5qZWN0b3IuYmY0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmJmMyA6IGluamVjdG9yLmJmMikgOiAoYjUgPyBpbmplY3Rvci5iZjEgOiBpbmplY3Rvci5iZjApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICAgIGlmICh2YWx1ZSAmIG1hc2spIHtcbiAgICAgIHJldHVybiBpbmplY3RvcjtcbiAgICB9XG5cbiAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5qZWN0b3IgZG9lcyBub3QgaGF2ZSB0aGUgZGlyZWN0aXZlLCBjaGVjayB0aGUgYmxvb20gZmlsdGVycyBmb3IgdGhlIGFuY2VzdG9yXG4gICAgLy8gaW5qZWN0b3JzIChjYmYwIC0gY2JmNykuIFRoZXNlIGZpbHRlcnMgY2FwdHVyZSAqYWxsKiBhbmNlc3RvciBpbmplY3RvcnMuXG4gICAgaWYgKGI3KSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuY2JmNyA6IGluamVjdG9yLmNiZjYpIDogKGI1ID8gaW5qZWN0b3IuY2JmNSA6IGluamVjdG9yLmNiZjQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuY2JmMyA6IGluamVjdG9yLmNiZjIpIDogKGI1ID8gaW5qZWN0b3IuY2JmMSA6IGluamVjdG9yLmNiZjApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZSB1cCB0b1xuICAgIC8vIGZpbmQgdGhlIHNwZWNpZmljIGluamVjdG9yLiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIGRvZXMgbm90IGhhdmUgdGhlIGJpdCwgd2UgY2FuIGFib3J0LlxuICAgIGlmICh2YWx1ZSAmIG1hc2spIHtcbiAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBpbmplY3RvciBhbmQgaXRzIHBhcmVudCBhcmUgaW4gdGhlIHNhbWUgaG9zdCB2aWV3LlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHN1cHBvcnQgQEhvc3QoKSBkZWNvcmF0b3JzLiBJZiBASG9zdCgpIGlzIHNldCwgd2Ugc2hvdWxkIHN0b3Agc2VhcmNoaW5nIG9uY2VcbiAqIHRoZSBpbmplY3RvciBhbmQgaXRzIHBhcmVudCB2aWV3IGRvbid0IG1hdGNoIGJlY2F1c2UgaXQgbWVhbnMgd2UnZCBjcm9zcyB0aGUgdmlldyBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gc2FtZUhvc3RWaWV3KGluamVjdG9yOiBMSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaW5qZWN0b3IucGFyZW50ICYmIGluamVjdG9yLnBhcmVudC5ub2RlLnZpZXcgPT09IGluamVjdG9yLm5vZGUudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSW5kZXg/OiBudW1iZXIpID0+IFQpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZvciBhIGdpdmVuIG5vZGUgaW5qZWN0b3IgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBFbGVtZW50UmVmXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZS5FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGRpLmVsZW1lbnRSZWYgfHwgKGRpLmVsZW1lbnRSZWYgPSBuZXcgRWxlbWVudFJlZihkaS5ub2RlLm5hdGl2ZSkpO1xufVxuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9URU1QTEFURV9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lLlRlbXBsYXRlUmVmPGFueT4+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmUuVGVtcGxhdGVSZWY8YW55Pj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfQ09OVEFJTkVSX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmUuVmlld0NvbnRhaW5lclJlZj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZS5WaWV3Q29udGFpbmVyUmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRUxFTUVOVF9SRUYgPVxuICAgIDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmUuRWxlbWVudFJlZj4+KG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZS5FbGVtZW50UmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0ZST01fTk9ERSA9XG4gICAgKG5ldyBSZWFkRnJvbUluamVjdG9yRm48YW55PigoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUlkeDogbnVtYmVyKSA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCk7XG4gICAgICBpZiAoZGlyZWN0aXZlSWR4ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnQpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gICAgICB9IGVsc2UgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZhaWwnKTtcbiAgICB9KSBhcyBhbnkgYXMgUXVlcnlSZWFkVHlwZTxhbnk+KTtcblxuLyoqIEEgcmVmIHRvIGEgbm9kZSdzIG5hdGl2ZSBlbGVtZW50LiAqL1xuY2xhc3MgRWxlbWVudFJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmUuRWxlbWVudFJlZiB7XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmUuVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyh2Y1JlZkhvc3QsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50KTtcbiAgICBjb25zdCBob3N0UGFyZW50ID0gZ2V0UGFyZW50TE5vZGUodmNSZWZIb3N0KSAhO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGhvc3RQYXJlbnQsIHZjUmVmSG9zdC52aWV3LCB0cnVlKTtcbiAgICBjb25zdCBjb21tZW50ID0gdmNSZWZIb3N0LnZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID0gY3JlYXRlTE5vZGVPYmplY3QoXG4gICAgICAgIFROb2RlVHlwZS5Db250YWluZXIsIHZjUmVmSG9zdC52aWV3LCBob3N0UGFyZW50LCBjb21tZW50LCBsQ29udGFpbmVyLCBudWxsKTtcbiAgICBhcHBlbmRDaGlsZChob3N0UGFyZW50LCBjb21tZW50LCB2Y1JlZkhvc3Qudmlldyk7XG5cblxuICAgIGlmICh2Y1JlZkhvc3QucXVlcmllcykge1xuICAgICAgbENvbnRhaW5lck5vZGUucXVlcmllcyA9IHZjUmVmSG9zdC5xdWVyaWVzLmNvbnRhaW5lcigpO1xuICAgIH1cblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID1cbiAgICAgICAgICBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCAtMSwgbnVsbCwgbnVsbCwgaG9zdFROb2RlLCBudWxsKTtcbiAgICB9XG5cbiAgICBsQ29udGFpbmVyTm9kZS50Tm9kZSA9IGhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZTtcbiAgICB2Y1JlZkhvc3QuZHluYW1pY0xDb250YWluZXJOb2RlID0gbENvbnRhaW5lck5vZGU7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKHZjUmVmSG9zdC52aWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyTm9kZSk7XG4gIH1cblxuICByZXR1cm4gZGkudmlld0NvbnRhaW5lclJlZjtcbn1cblxuLyoqXG4gKiBBIHJlZiB0byBhIGNvbnRhaW5lciB0aGF0IGVuYWJsZXMgYWRkaW5nIGFuZCByZW1vdmluZyB2aWV3cyBmcm9tIHRoYXQgY29udGFpbmVyXG4gKiBpbXBlcmF0aXZlbHkuXG4gKi9cbmNsYXNzIFZpZXdDb250YWluZXJSZWYgaW1wbGVtZW50cyB2aWV3RW5naW5lLlZpZXdDb250YWluZXJSZWYge1xuICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZS5WaWV3UmVmW10gPSBbXTtcbiAgLy8gVE9ETyhpc3N1ZS8yNDU3MSk6IHJlbW92ZSAnIScuXG4gIGVsZW1lbnQgITogdmlld0VuZ2luZS5FbGVtZW50UmVmO1xuICAvLyBUT0RPKGlzc3VlLzI0NTcxKTogcmVtb3ZlICchJy5cbiAgaW5qZWN0b3IgITogSW5qZWN0b3I7XG4gIC8vIFRPRE8oaXNzdWUvMjQ1NzEpOiByZW1vdmUgJyEnLlxuICBwYXJlbnRJbmplY3RvciAhOiBJbmplY3RvcjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUpIHt9XG5cbiAgY2xlYXIoKTogdm9pZCB7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGE7XG4gICAgd2hpbGUgKGxDb250YWluZXJbVklFV1NdLmxlbmd0aCkge1xuICAgICAgdGhpcy5yZW1vdmUoMCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0KGluZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lLlZpZXdSZWZ8bnVsbCB7IHJldHVybiB0aGlzLl92aWV3UmVmc1tpbmRleF0gfHwgbnVsbDsgfVxuXG4gIGdldCBsZW5ndGgoKTogbnVtYmVyIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICByZXR1cm4gbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3PEM+KHRlbXBsYXRlUmVmOiB2aWV3RW5naW5lLlRlbXBsYXRlUmVmPEM+LCBjb250ZXh0PzogQywgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZS5FbWJlZGRlZFZpZXdSZWY8Qz4ge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuICAgIGNvbnN0IHZpZXdSZWYgPSAodGVtcGxhdGVSZWYgYXMgVGVtcGxhdGVSZWY8Qz4pXG4gICAgICAgICAgICAgICAgICAgICAgICAuY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQgfHwgPGFueT57fSwgdGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgY3JlYXRlQ29tcG9uZW50PEM+KFxuICAgICAgY29tcG9uZW50RmFjdG9yeTogdmlld0VuZ2luZS5Db21wb25lbnRGYWN0b3J5PEM+LCBpbmRleD86IG51bWJlcnx1bmRlZmluZWQsXG4gICAgICBpbmplY3Rvcj86IEluamVjdG9yfHVuZGVmaW5lZCwgcHJvamVjdGFibGVOb2Rlcz86IGFueVtdW118dW5kZWZpbmVkLFxuICAgICAgbmdNb2R1bGVSZWY/OiB2aWV3RW5naW5lLk5nTW9kdWxlUmVmPGFueT58dW5kZWZpbmVkKTogdmlld0VuZ2luZS5Db21wb25lbnRSZWY8Qz4ge1xuICAgIGNvbnN0IGNvbnRleHRJbmplY3RvciA9IGluamVjdG9yIHx8IHRoaXMucGFyZW50SW5qZWN0b3I7XG4gICAgaWYgKCFuZ01vZHVsZVJlZiAmJiBjb250ZXh0SW5qZWN0b3IpIHtcbiAgICAgIG5nTW9kdWxlUmVmID0gY29udGV4dEluamVjdG9yLmdldCh2aWV3RW5naW5lLk5nTW9kdWxlUmVmKTtcbiAgICB9XG5cbiAgICBjb25zdCBjb21wb25lbnRSZWYgPVxuICAgICAgICBjb21wb25lbnRGYWN0b3J5LmNyZWF0ZShjb250ZXh0SW5qZWN0b3IsIHByb2plY3RhYmxlTm9kZXMsIHVuZGVmaW5lZCwgbmdNb2R1bGVSZWYpO1xuICAgIHRoaXMuaW5zZXJ0KGNvbXBvbmVudFJlZi5ob3N0VmlldywgaW5kZXgpO1xuICAgIHJldHVybiBjb21wb25lbnRSZWY7XG4gIH1cblxuICBpbnNlcnQodmlld1JlZjogdmlld0VuZ2luZS5WaWV3UmVmLCBpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmUuVmlld1JlZiB7XG4gICAgaWYgKHZpZXdSZWYuZGVzdHJveWVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbnNlcnQgYSBkZXN0cm95ZWQgVmlldyBpbiBhIFZpZXdDb250YWluZXIhJyk7XG4gICAgfVxuICAgIGNvbnN0IGxWaWV3Tm9kZSA9ICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuX2xWaWV3Tm9kZSAhO1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgpO1xuXG4gICAgaW5zZXJ0Vmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgbFZpZXdOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgY29uc3Qgdmlld3MgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXTtcbiAgICBjb25zdCBiZWZvcmVOb2RlID0gYWRqdXN0ZWRJZHggKyAxIDwgdmlld3MubGVuZ3RoID9cbiAgICAgICAgKGdldENoaWxkTE5vZGUodmlld3NbYWRqdXN0ZWRJZHggKyAxXSkgISkubmF0aXZlIDpcbiAgICAgICAgdGhpcy5fbENvbnRhaW5lck5vZGUubmF0aXZlO1xuICAgIGFkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyKHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lLlZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lLlZpZXdSZWYge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lLlZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmUuVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHJldHVybiB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpWzBdIHx8IG51bGw7XG4gIH1cblxuICBwcml2YXRlIF9hZGp1c3RJbmRleChpbmRleD86IG51bWJlciwgc2hpZnQ6IG51bWJlciA9IDApIHtcbiAgICBpZiAoaW5kZXggPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdLmxlbmd0aCArIHNoaWZ0O1xuICAgIH1cbiAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICBhc3NlcnRHcmVhdGVyVGhhbihpbmRleCwgLTEsICdpbmRleCBtdXN0IGJlIHBvc2l0aXZlJyk7XG4gICAgICAvLyArMSBiZWNhdXNlIGl0J3MgbGVnYWwgdG8gaW5zZXJ0IGF0IHRoZSBlbmQuXG4gICAgICBhc3NlcnRMZXNzVGhhbihpbmRleCwgdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YVtWSUVXU10ubGVuZ3RoICsgMSArIHNoaWZ0LCAnaW5kZXgnKTtcbiAgICB9XG4gICAgcmV0dXJuIGluZGV4O1xuICB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBUZW1wbGF0ZVJlZlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZS5UZW1wbGF0ZVJlZjxUPiB7XG4gIGlmICghZGkudGVtcGxhdGVSZWYpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZVR5cGUoZGkubm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgY29uc3QgaG9zdE5vZGUgPSBkaS5ub2RlIGFzIExDb250YWluZXJOb2RlO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGhvc3ROb2RlLnROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIGRpLnRlbXBsYXRlUmVmID0gbmV3IFRlbXBsYXRlUmVmPGFueT4oXG4gICAgICAgIGhvc3ROb2RlLnZpZXcsIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaSksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsIGdldFJlbmRlcmVyKCksXG4gICAgICAgIGhvc3ROb2RlLmRhdGFbUVVFUklFU10pO1xuICB9XG4gIHJldHVybiBkaS50ZW1wbGF0ZVJlZjtcbn1cblxuY2xhc3MgVGVtcGxhdGVSZWY8VD4gaW1wbGVtZW50cyB2aWV3RW5naW5lLlRlbXBsYXRlUmVmPFQ+IHtcbiAgcmVhZG9ubHkgZWxlbWVudFJlZjogdmlld0VuZ2luZS5FbGVtZW50UmVmO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIGVsZW1lbnRSZWY6IHZpZXdFbmdpbmUuRWxlbWVudFJlZixcbiAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCkge1xuICAgIHRoaXMuZWxlbWVudFJlZiA9IGVsZW1lbnRSZWY7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCwgY29udGFpbmVyTm9kZT86IExDb250YWluZXJOb2RlLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lLkVtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPSBjcmVhdGVFbWJlZGRlZFZpZXdOb2RlKFxuICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyTm9kZSwgdmlld05vZGUsIGluZGV4ICEpO1xuICAgIH1cbiAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKHZpZXdOb2RlLCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICBjb25zdCB2aWV3UmVmID0gbmV3IFZpZXdSZWYodmlld05vZGUuZGF0YSwgY29udGV4dCk7XG4gICAgdmlld1JlZi5fbFZpZXdOb2RlID0gdmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cbn1cbiJdfQ==