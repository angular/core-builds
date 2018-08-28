/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// We are temporarily importing the existing viewEngine_from core so we can be sure we are
// correctly implementing its interfaces for backwards compatibility.
import { ChangeDetectorRef as viewEngine_ChangeDetectorRef } from '../change_detection/change_detector_ref';
import { NullInjector, inject, setCurrentInjector } from '../di/injector';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { TemplateRef as viewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef as viewEngine_ViewContainerRef } from '../linker/view_container_ref';
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
    var lNode = getPreviousOrParentNode();
    ngDevMode && assertNodeOfPossibleTypes(lNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    var tNode = lNode.tNode;
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    var attrs = tNode.attrs;
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
            .view[DIRECTIVES][hostNode.tNode.flags >> 15 /* DirectiveStartingIndexShift */]);
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
                var start = nodeFlags >> 15 /* DirectiveStartingIndexShift */;
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
    ngDevMode && assertNodeOfPossibleTypes(node, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    if (directiveIdx > -1) {
        return node.view[DIRECTIVES][directiveIdx];
    }
    if (node.tNode.type === 3 /* Element */ || node.tNode.type === 4 /* ElementContainer */) {
        return getOrCreateElementRef(injector);
    }
    if (node.tNode.type === 0 /* Container */) {
        return getOrCreateTemplateRef(injector);
    }
    if (ngDevMode) {
        // should never happen
        throw new Error("Unexpected node type: " + node.tNode.type);
    }
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
        ngDevMode && assertNodeOfPossibleTypes(vcRefHost, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
        var hostParent = getParentLNode(vcRefHost);
        var lContainer = createLContainer(hostParent, vcRefHost.view, true);
        var comment = vcRefHost.view[RENDERER].createComment(ngDevMode ? 'container' : '');
        var lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, hostParent, comment, lContainer);
        appendChild(hostParent, comment, vcRefHost.view);
        var hostTNode = vcRefHost.tNode;
        if (!hostTNode.dynamicContainerNode) {
            hostTNode.dynamicContainerNode =
                createTNode(0 /* Container */, -1, null, null, hostTNode, null);
        }
        lContainerNode.tNode = hostTNode.dynamicContainerNode;
        vcRefHost.dynamicLContainerNode = lContainerNode;
        addToViewTree(vcRefHost.view, hostTNode.index, lContainer);
        di.viewContainerRef = new ViewContainerRef(lContainerNode, vcRefHost);
    }
    return di.viewContainerRef;
}
var NodeInjector = /** @class */ (function () {
    function NodeInjector(_lInjector) {
        this._lInjector = _lInjector;
    }
    NodeInjector.prototype.get = function (token) {
        if (token === viewEngine_TemplateRef) {
            return getOrCreateTemplateRef(this._lInjector);
        }
        if (token === viewEngine_ViewContainerRef) {
            return getOrCreateContainerRef(this._lInjector);
        }
        if (token === viewEngine_ElementRef) {
            return getOrCreateElementRef(this._lInjector);
        }
        if (token === viewEngine_ChangeDetectorRef) {
            return getOrCreateChangeDetectorRef(this._lInjector, null);
        }
        return getOrCreateInjectable(this._lInjector, token);
    };
    return NodeInjector;
}());
export { NodeInjector };
/**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
var ViewContainerRef = /** @class */ (function () {
    function ViewContainerRef(_lContainerNode, _hostNode) {
        this._lContainerNode = _lContainerNode;
        this._hostNode = _hostNode;
        this._viewRefs = [];
    }
    Object.defineProperty(ViewContainerRef.prototype, "element", {
        get: function () {
            var injector = getOrCreateNodeInjectorForNode(this._hostNode);
            return getOrCreateElementRef(injector);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef.prototype, "injector", {
        get: function () {
            var injector = getOrCreateNodeInjectorForNode(this._hostNode);
            return new NodeInjector(injector);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ViewContainerRef.prototype, "parentInjector", {
        /** @deprecated No replacement */
        get: function () {
            var parentLInjector = getParentLNode(this._hostNode).nodeInjector;
            return parentLInjector ? new NodeInjector(parentLInjector) : new NullInjector();
        },
        enumerable: true,
        configurable: true
    });
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
            ngModuleRef = contextInjector.get(viewEngine_NgModuleRef, null);
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
export function getFactoryOf(type) {
    var typeAny = type;
    var def = typeAny.ngComponentDef || typeAny.ngDirectiveDef || typeAny.ngPipeDef ||
        typeAny.ngInjectableDef || typeAny.ngInjectorDef;
    if (def === undefined || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
export function getInheritedFactory(type) {
    var proto = Object.getPrototypeOf(type.prototype).constructor;
    var factory = getFactoryOf(proto);
    if (factory !== null) {
        return factory;
    }
    else {
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return function (t) { return new t(); };
    }
}
var TemplateRef = /** @class */ (function () {
    function TemplateRef(_declarationParentView, elementRef, _tView, _renderer, _queries) {
        this._declarationParentView = _declarationParentView;
        this.elementRef = elementRef;
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
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
/**
 * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
 * `<ng-template>` element.
 */
export function templateRefExtractor(lNode) {
    return getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(lNode));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBGQUEwRjtBQUMxRixxRUFBcUU7QUFFckUsT0FBTyxFQUFDLGlCQUFpQixJQUFJLDRCQUE0QixFQUFDLE1BQU0seUNBQXlDLENBQUM7QUFFMUcsT0FBTyxFQUF3QixZQUFZLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0YsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNsRixPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDN0UsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFJN0YsT0FBTyxFQUFDLGFBQWEsRUFBRSxpQkFBaUIsRUFBRSxjQUFjLEVBQUMsTUFBTSxVQUFVLENBQUM7QUFDMUUsT0FBTyxFQUFDLHdCQUF3QixFQUFDLE1BQU0saUJBQWlCLENBQUM7QUFDekQsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsV0FBVyxFQUFFLFdBQVcsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQzVPLE9BQU8sRUFBQyxLQUFLLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQU03QyxPQUFPLEVBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQWEsT0FBTyxFQUFFLFFBQVEsRUFB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QUFFLE9BQU8saUJBQXFCLENBQUM7UUFDM0UsSUFBTSxPQUFPLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztRQUNwRCxPQUFPLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQztRQUM5QixPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBQ0gsa0JBQUM7QUFBRCxDQUFDLEFBakJELElBaUJDO0FBRUQ7OztHQUdHO0FBQ0gsTUFBTSxVQUFVLG9CQUFvQixDQUFDLEtBQXlCO0lBQzVELE9BQU8sc0JBQXNCLENBQUMsOEJBQThCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztBQUN2RSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge0NoYW5nZURldGVjdG9yUmVmIGFzIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWZ9IGZyb20gJy4uL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdG9yX3JlZic7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZCwgYXNzZXJ0R3JlYXRlclRoYW4sIGFzc2VydExlc3NUaGFufSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge0NvbXBvbmVudEZhY3RvcnlSZXNvbHZlcn0gZnJvbSAnLi9jb21wb25lbnRfcmVmJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSwgZ2V0UmVuZGVyZXIsIGlzQ29tcG9uZW50LCByZW5kZXJFbWJlZGRlZFRlbXBsYXRlLCByZXNvbHZlRGlyZWN0aXZlfSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge1ZJRVdTfSBmcm9tICcuL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWwsIFJlbmRlckZsYWdzfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0xJbmplY3Rvcn0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBMQ29udGFpbmVyTm9kZSwgTEVsZW1lbnRDb250YWluZXJOb2RlLCBMRWxlbWVudE5vZGUsIExOb2RlLCBMTm9kZVdpdGhMb2NhbFJlZnMsIExWaWV3Tm9kZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge0xRdWVyaWVzLCBRdWVyeVJlYWRUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvcXVlcnknO1xuaW1wb3J0IHtSZW5kZXJlcjN9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RJUkVDVElWRVMsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZ2V0Q2hpbGRMTm9kZSwgZ2V0UGFyZW50TE5vZGUsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogSWYgYSBkaXJlY3RpdmUgaXMgZGlQdWJsaWMsIGJsb29tQWRkIHNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgdHlwZSB3aXRoIHRoaXMgY29uc3RhbnQgYXNcbiAqIHRoZSBrZXkgYW5kIHRoZSBkaXJlY3RpdmUncyB1bmlxdWUgSUQgYXMgdGhlIHZhbHVlLiBUaGlzIGFsbG93cyB1cyB0byBtYXAgZGlyZWN0aXZlcyB0byB0aGVpclxuICogYmxvb20gZmlsdGVyIGJpdCBmb3IgREkuXG4gKi9cbmNvbnN0IE5HX0VMRU1FTlRfSUQgPSAnX19OR19FTEVNRU5UX0lEX18nO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcbmNvbnN0IEJMT09NX01BU0sgPSBCTE9PTV9TSVpFIC0gMTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggdGhlIGRpcmVjdGl2ZSBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoaW5qZWN0b3I6IExJbmplY3RvciwgdHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG5cbiAgaWYgKGI3KSB7XG4gICAgYjYgPyAoYjUgPyAoaW5qZWN0b3IuYmY3IHw9IG1hc2spIDogKGluamVjdG9yLmJmNiB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKGluamVjdG9yLmJmNSB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjQgfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGI2ID8gKGI1ID8gKGluamVjdG9yLmJmMyB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjIgfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/IChpbmplY3Rvci5iZjEgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYwIHw9IG1hc2spKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogTEluamVjdG9yIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTENvbnRhaW5lck5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBub2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMQ29udGFpbmVyTm9kZSk6IExJbmplY3RvciB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IG5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnQgJiYgcGFyZW50Lm5vZGVJbmplY3RvcjtcbiAgaWYgKG5vZGVJbmplY3RvciAhPSBwYXJlbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBub2RlSW5qZWN0b3IgITtcbiAgfVxuICByZXR1cm4gbm9kZS5ub2RlSW5qZWN0b3IgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRJbmplY3RvcixcbiAgICBub2RlOiBub2RlLFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGwsXG4gIH07XG59XG5cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIGNvbnN0IGxOb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgbE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIGNvbnN0IHROb2RlID0gbE5vZGUudE5vZGU7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBWaWV3UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yIGFzIENoYW5nZURldGVjdG9yUmVmIChwdWJsaWMgYWxpYXMpLlxuICogT3IsIGlmIGl0IGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIGluc3RhbmNlLlxuICpcbiAqIEByZXR1cm5zIFRoZSBDaGFuZ2VEZXRlY3RvclJlZiB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYoXG4gICAgZGk6IExJbmplY3RvciwgY29udGV4dDogYW55KTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGlmIChkaS5jaGFuZ2VEZXRlY3RvclJlZikgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIGNvbnN0IGN1cnJlbnROb2RlID0gZGkubm9kZTtcbiAgaWYgKGlzQ29tcG9uZW50KGN1cnJlbnROb2RlLnROb2RlKSkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IG5ldyBWaWV3UmVmKGN1cnJlbnROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLCBjb250ZXh0KTtcbiAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlLnZpZXdbSE9TVF9OT0RFXSk7XG4gIH1cbiAgcmV0dXJuIG51bGwgITtcbn1cblxuLyoqIEdldHMgb3IgY3JlYXRlcyBDaGFuZ2VEZXRlY3RvclJlZiBmb3IgdGhlIGNsb3Nlc3QgaG9zdCBjb21wb25lbnQgKi9cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGN1cnJlbnROb2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOlxuICAgIHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICBjb25zdCBob3N0Tm9kZSA9IGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3RvcihjdXJyZW50Tm9kZSk7XG4gIGNvbnN0IGhvc3RJbmplY3RvciA9IGhvc3ROb2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgZXhpc3RpbmdSZWYgPSBob3N0SW5qZWN0b3IgJiYgaG9zdEluamVjdG9yLmNoYW5nZURldGVjdG9yUmVmO1xuXG4gIHJldHVybiBleGlzdGluZ1JlZiA/XG4gICAgICBleGlzdGluZ1JlZiA6XG4gICAgICBuZXcgVmlld1JlZihcbiAgICAgICAgICBob3N0Tm9kZS5kYXRhIGFzIExWaWV3RGF0YSxcbiAgICAgICAgICBob3N0Tm9kZVxuICAgICAgICAgICAgICAudmlld1tESVJFQ1RJVkVTXSAhW2hvc3ROb2RlLnROb2RlLmZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0XSk7XG59XG5cbi8qKlxuICogSWYgdGhlIG5vZGUgaXMgYW4gZW1iZWRkZWQgdmlldywgdHJhdmVyc2VzIHVwIHRoZSB2aWV3IHRyZWUgdG8gcmV0dXJuIHRoZSBjbG9zZXN0XG4gKiBhbmNlc3RvciB2aWV3IHRoYXQgaXMgYXR0YWNoZWQgdG8gYSBjb21wb25lbnQuIElmIGl0J3MgYWxyZWFkeSBhIGNvbXBvbmVudCBub2RlLFxuICogcmV0dXJucyBpdHNlbGYuXG4gKi9cbmZ1bmN0aW9uIGdldENsb3Nlc3RDb21wb25lbnRBbmNlc3Rvcihub2RlOiBMVmlld05vZGUgfCBMRWxlbWVudE5vZGUpOiBMRWxlbWVudE5vZGUge1xuICB3aGlsZSAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuVmlldykge1xuICAgIG5vZGUgPSBub2RlLnZpZXdbSE9TVF9OT0RFXTtcbiAgfVxuICByZXR1cm4gbm9kZSBhcyBMRWxlbWVudE5vZGU7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIG5vZGVJbmplY3RvcjogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdCh0b2tlbik7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKSBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggIT09IG51bGwpIHtcbiAgICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID0gbm9kZUluamVjdG9yO1xuXG4gICAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgICAvLyBHZXQgdGhlIGNsb3Nlc3QgcG90ZW50aWFsIG1hdGNoaW5nIGluamVjdG9yICh1cHdhcmRzIGluIHRoZSBpbmplY3RvciB0cmVlKSB0aGF0XG4gICAgICAvLyAqcG90ZW50aWFsbHkqIGhhcyB0aGUgdG9rZW4uXG4gICAgICBpbmplY3RvciA9IGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoaW5qZWN0b3IsIGJsb29tSGFzaCwgZmxhZ3MpO1xuXG4gICAgICAvLyBJZiBubyBpbmplY3RvciBpcyBmb3VuZCwgd2UgKmtub3cqIHRoYXQgdGhlcmUgaXMgbm8gYW5jZXN0b3IgaW5qZWN0b3IgdGhhdCBjb250YWlucyB0aGVcbiAgICAgIC8vIHRva2VuLCBzbyB3ZSBhYm9ydC5cbiAgICAgIGlmICghaW5qZWN0b3IpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IG5vZGUgPSBpbmplY3Rvci5ub2RlO1xuICAgICAgY29uc3Qgbm9kZUZsYWdzID0gbm9kZS50Tm9kZS5mbGFncztcbiAgICAgIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICAgICAgY29uc3QgZGVmcyA9IG5vZGUudmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBub2RlLnZpZXdbRElSRUNUSVZFU10gIVtpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgKmRpZG4ndCogZmluZCB0aGUgZGlyZWN0aXZlIGZvciB0aGUgdG9rZW4gYW5kIHdlIGFyZSBzZWFyY2hpbmcgdGhlIGN1cnJlbnQgbm9kZSdzXG4gICAgICAvLyBpbmplY3RvciwgaXQncyBwb3NzaWJsZSB0aGUgZGlyZWN0aXZlIGlzIG9uIHRoaXMgbm9kZSBhbmQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG4gICAgICBsZXQgaW5zdGFuY2U6IFR8bnVsbDtcbiAgICAgIGlmIChpbmplY3RvciA9PT0gbm9kZUluamVjdG9yICYmXG4gICAgICAgICAgKGluc3RhbmNlID0gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGUsIHRva2VuKSkpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgLy8gSWYgZmxhZ3MgcGVybWl0LCB0cmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgICAgaW5qZWN0b3IgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpLnZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KG5vZGU6IExOb2RlLCB0b2tlbjogYW55KTogVHxudWxsIHtcbiAgY29uc3QgbWF0Y2hlcyA9IG5vZGUudmlld1tUVklFV10uY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlRGlyZWN0aXZlKGRlZiwgaSArIDEsIG1hdGNoZXMsIG5vZGUudmlld1tUVklFV10pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICovXG5mdW5jdGlvbiBibG9vbUhhc2hCaXQodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6IG51bWJlcnxudWxsIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgaWQgPT09ICdudW1iZXInID8gaWQgJiBCTE9PTV9NQVNLIDogbnVsbDtcbn1cblxuLyoqXG4gKiBGaW5kcyB0aGUgY2xvc2VzdCBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgYSBjZXJ0YWluIGRpcmVjdGl2ZS5cbiAqXG4gKiBFYWNoIGRpcmVjdGl2ZSBjb3JyZXNwb25kcyB0byBhIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci4gR2l2ZW4gdGhlIGJsb29tIGJpdCB0b1xuICogY2hlY2sgYW5kIGEgc3RhcnRpbmcgaW5qZWN0b3IsIHRoaXMgZnVuY3Rpb24gdHJhdmVyc2VzIHVwIGluamVjdG9ycyB1bnRpbCBpdCBmaW5kcyBhblxuICogaW5qZWN0b3IgdGhhdCBjb250YWlucyBhIDEgZm9yIHRoYXQgYml0IGluIGl0cyBibG9vbSBmaWx0ZXIuIEEgMSBpbmRpY2F0ZXMgdGhhdCB0aGVcbiAqIGluamVjdG9yIG1heSBoYXZlIHRoYXQgZGlyZWN0aXZlLiBJdCBvbmx5ICptYXkqIGhhdmUgdGhlIGRpcmVjdGl2ZSBiZWNhdXNlIGRpcmVjdGl2ZXMgYmVnaW5cbiAqIHRvIHNoYXJlIGJsb29tIGZpbHRlciBiaXRzIGFmdGVyIHRoZSBCTE9PTV9TSVpFIGlzIHJlYWNoZWQsIGFuZCBpdCBjb3VsZCBjb3JyZXNwb25kIHRvIGFcbiAqIGRpZmZlcmVudCBkaXJlY3RpdmUgc2hhcmluZyB0aGUgYml0LlxuICpcbiAqIE5vdGU6IFdlIGNhbiBza2lwIGNoZWNraW5nIGZ1cnRoZXIgaW5qZWN0b3JzIHVwIHRoZSB0cmVlIGlmIGFuIGluamVjdG9yJ3MgY2JmIHN0cnVjdHVyZVxuICogaGFzIGEgMCBmb3IgdGhhdCBibG9vbSBiaXQuIFNpbmNlIGNiZiBjb250YWlucyB0aGUgbWVyZ2VkIHZhbHVlIG9mIGFsbCB0aGUgcGFyZW50XG4gKiBpbmplY3RvcnMsIGEgMCBpbiB0aGUgYmxvb20gYml0IGluZGljYXRlcyB0aGF0IHRoZSBwYXJlbnRzIGRlZmluaXRlbHkgZG8gbm90IGNvbnRhaW5cbiAqIHRoZSBkaXJlY3RpdmUgYW5kIGRvIG5vdCBuZWVkIHRvIGJlIGNoZWNrZWQuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBzdGFydGluZyBub2RlIGluamVjdG9yIHRvIGNoZWNrXG4gKiBAcGFyYW0gIGJsb29tQml0IFRoZSBiaXQgdG8gY2hlY2sgaW4gZWFjaCBpbmplY3RvcidzIGJsb29tIGZpbHRlclxuICogQHBhcmFtICBmbGFncyBUaGUgaW5qZWN0aW9uIGZsYWdzIGZvciB0aGlzIGluamVjdGlvbiBzaXRlIChlLmcuIE9wdGlvbmFsIG9yIFNraXBTZWxmKVxuICogQHJldHVybnMgQW4gaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIHRoZSBkaXJlY3RpdmVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tRmluZFBvc3NpYmxlSW5qZWN0b3IoXG4gICAgc3RhcnRJbmplY3RvcjogTEluamVjdG9yLCBibG9vbUJpdDogbnVtYmVyLCBmbGFnczogSW5qZWN0RmxhZ3MpOiBMSW5qZWN0b3J8bnVsbCB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG5cbiAgLy8gVHJhdmVyc2UgdXAgdGhlIGluamVjdG9yIHRyZWUgdW50aWwgd2UgZmluZCBhIHBvdGVudGlhbCBtYXRjaCBvciB1bnRpbCB3ZSBrbm93IHRoZXJlICppc24ndCogYVxuICAvLyBtYXRjaC5cbiAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9XG4gICAgICBmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmID8gc3RhcnRJbmplY3Rvci5wYXJlbnQgOiBzdGFydEluamVjdG9yO1xuXG4gIHdoaWxlIChpbmplY3Rvcikge1xuICAgIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAgIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAgIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gICAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgICBpZiAoYjcpIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5iZjcgOiBpbmplY3Rvci5iZjYpIDogKGI1ID8gaW5qZWN0b3IuYmY1IDogaW5qZWN0b3IuYmY0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmJmMyA6IGluamVjdG9yLmJmMikgOiAoYjUgPyBpbmplY3Rvci5iZjEgOiBpbmplY3Rvci5iZjApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICAgIGlmICh2YWx1ZSAmIG1hc2spIHtcbiAgICAgIHJldHVybiBpbmplY3RvcjtcbiAgICB9XG5cbiAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGN1cnJlbnQgaW5qZWN0b3IgZG9lcyBub3QgaGF2ZSB0aGUgZGlyZWN0aXZlLCBjaGVjayB0aGUgYmxvb20gZmlsdGVycyBmb3IgdGhlIGFuY2VzdG9yXG4gICAgLy8gaW5qZWN0b3JzIChjYmYwIC0gY2JmNykuIFRoZXNlIGZpbHRlcnMgY2FwdHVyZSAqYWxsKiBhbmNlc3RvciBpbmplY3RvcnMuXG4gICAgaWYgKGI3KSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuY2JmNyA6IGluamVjdG9yLmNiZjYpIDogKGI1ID8gaW5qZWN0b3IuY2JmNSA6IGluamVjdG9yLmNiZjQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuY2JmMyA6IGluamVjdG9yLmNiZjIpIDogKGI1ID8gaW5qZWN0b3IuY2JmMSA6IGluamVjdG9yLmNiZjApO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZSB1cCB0b1xuICAgIC8vIGZpbmQgdGhlIHNwZWNpZmljIGluamVjdG9yLiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIGRvZXMgbm90IGhhdmUgdGhlIGJpdCwgd2UgY2FuIGFib3J0LlxuICAgIGlmICh2YWx1ZSAmIG1hc2spIHtcbiAgICAgIGluamVjdG9yID0gaW5qZWN0b3IucGFyZW50O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBDaGVja3Mgd2hldGhlciB0aGUgY3VycmVudCBpbmplY3RvciBhbmQgaXRzIHBhcmVudCBhcmUgaW4gdGhlIHNhbWUgaG9zdCB2aWV3LlxuICpcbiAqIFRoaXMgaXMgbmVjZXNzYXJ5IHRvIHN1cHBvcnQgQEhvc3QoKSBkZWNvcmF0b3JzLiBJZiBASG9zdCgpIGlzIHNldCwgd2Ugc2hvdWxkIHN0b3Agc2VhcmNoaW5nIG9uY2VcbiAqIHRoZSBpbmplY3RvciBhbmQgaXRzIHBhcmVudCB2aWV3IGRvbid0IG1hdGNoIGJlY2F1c2UgaXQgbWVhbnMgd2UnZCBjcm9zcyB0aGUgdmlldyBib3VuZGFyeS5cbiAqL1xuZnVuY3Rpb24gc2FtZUhvc3RWaWV3KGluamVjdG9yOiBMSW5qZWN0b3IpOiBib29sZWFuIHtcbiAgcmV0dXJuICEhaW5qZWN0b3IucGFyZW50ICYmIGluamVjdG9yLnBhcmVudC5ub2RlLnZpZXcgPT09IGluamVjdG9yLm5vZGUudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSW5kZXg/OiBudW1iZXIpID0+IFQpIHt9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGZvciBhIGdpdmVuIG5vZGUgaW5qZWN0b3IgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuXG4gKiBPciwgaWYgdGhlIEVsZW1lbnRSZWYgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgRWxlbWVudFJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBFbGVtZW50UmVmXG4gKiBAcmV0dXJucyBUaGUgRWxlbWVudFJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9FbGVtZW50UmVmIHtcbiAgcmV0dXJuIGRpLmVsZW1lbnRSZWYgfHwgKGRpLmVsZW1lbnRSZWYgPSBuZXcgRWxlbWVudFJlZihkaS5ub2RlLm5hdGl2ZSkpO1xufVxuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9URU1QTEFURV9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfQ09OVEFJTkVSX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRUxFTUVOVF9SRUYgPVxuICAgIDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfRWxlbWVudFJlZj4+KG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9FbGVtZW50UmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0ZST01fTk9ERSA9XG4gICAgKG5ldyBSZWFkRnJvbUluamVjdG9yRm48YW55PigoaW5qZWN0b3I6IExJbmplY3Rvciwgbm9kZTogTE5vZGUsIGRpcmVjdGl2ZUlkeDogbnVtYmVyKSA9PiB7XG4gICAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgICAgbm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgICAgIGlmIChkaXJlY3RpdmVJZHggPiAtMSkge1xuICAgICAgICByZXR1cm4gbm9kZS52aWV3W0RJUkVDVElWRVNdICFbZGlyZWN0aXZlSWR4XTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpIHtcbiAgICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgbm9kZSB0eXBlOiAke25vZGUudE5vZGUudHlwZX1gKTtcbiAgICAgIH1cbiAgICB9KSBhcyBhbnkgYXMgUXVlcnlSZWFkVHlwZTxhbnk+KTtcblxuLyoqIEEgcmVmIHRvIGEgbm9kZSdzIG5hdGl2ZSBlbGVtZW50LiAqL1xuY2xhc3MgRWxlbWVudFJlZiBpbXBsZW1lbnRzIHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgY29uc3RydWN0b3IobmF0aXZlRWxlbWVudDogYW55KSB7IHRoaXMubmF0aXZlRWxlbWVudCA9IG5hdGl2ZUVsZW1lbnQ7IH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG5cbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICAgIHZjUmVmSG9zdCwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgICBjb25zdCBob3N0UGFyZW50ID0gZ2V0UGFyZW50TE5vZGUodmNSZWZIb3N0KSAhO1xuICAgIGNvbnN0IGxDb250YWluZXIgPSBjcmVhdGVMQ29udGFpbmVyKGhvc3RQYXJlbnQsIHZjUmVmSG9zdC52aWV3LCB0cnVlKTtcbiAgICBjb25zdCBjb21tZW50ID0gdmNSZWZIb3N0LnZpZXdbUkVOREVSRVJdLmNyZWF0ZUNvbW1lbnQobmdEZXZNb2RlID8gJ2NvbnRhaW5lcicgOiAnJyk7XG4gICAgY29uc3QgbENvbnRhaW5lck5vZGU6IExDb250YWluZXJOb2RlID1cbiAgICAgICAgY3JlYXRlTE5vZGVPYmplY3QoVE5vZGVUeXBlLkNvbnRhaW5lciwgdmNSZWZIb3N0LnZpZXcsIGhvc3RQYXJlbnQsIGNvbW1lbnQsIGxDb250YWluZXIpO1xuICAgIGFwcGVuZENoaWxkKGhvc3RQYXJlbnQsIGNvbW1lbnQsIHZjUmVmSG9zdC52aWV3KTtcblxuICAgIGNvbnN0IGhvc3RUTm9kZSA9IHZjUmVmSG9zdC50Tm9kZSBhcyBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZTtcbiAgICBpZiAoIWhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSkge1xuICAgICAgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlID1cbiAgICAgICAgICBjcmVhdGVUTm9kZShUTm9kZVR5cGUuQ29udGFpbmVyLCAtMSwgbnVsbCwgbnVsbCwgaG9zdFROb2RlLCBudWxsKTtcbiAgICB9XG5cbiAgICBsQ29udGFpbmVyTm9kZS50Tm9kZSA9IGhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZTtcbiAgICB2Y1JlZkhvc3QuZHluYW1pY0xDb250YWluZXJOb2RlID0gbENvbnRhaW5lck5vZGU7XG5cbiAgICBhZGRUb1ZpZXdUcmVlKHZjUmVmSG9zdC52aWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihsQ29udGFpbmVyTm9kZSwgdmNSZWZIb3N0KTtcbiAgfVxuXG4gIHJldHVybiBkaS52aWV3Q29udGFpbmVyUmVmO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sSW5qZWN0b3I6IExJbmplY3Rvcikge31cblxuICBnZXQodG9rZW46IGFueSk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSB2aWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZih0aGlzLl9sSW5qZWN0b3IpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gPT09IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKHRoaXMuX2xJbmplY3Rvcik7XG4gICAgfVxuICAgIGlmICh0b2tlbiA9PT0gdmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKHRoaXMuX2xJbmplY3Rvcik7XG4gICAgfVxuICAgIGlmICh0b2tlbiA9PT0gdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYodGhpcy5fbEluamVjdG9yLCBudWxsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX2xJbmplY3RvciwgdG9rZW4pO1xuICB9XG59XG5cbi8qKlxuICogQSByZWYgdG8gYSBjb250YWluZXIgdGhhdCBlbmFibGVzIGFkZGluZyBhbmQgcmVtb3Zpbmcgdmlld3MgZnJvbSB0aGF0IGNvbnRhaW5lclxuICogaW1wZXJhdGl2ZWx5LlxuICovXG5jbGFzcyBWaWV3Q29udGFpbmVyUmVmIGltcGxlbWVudHMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0Tm9kZTogTEVsZW1lbnROb2RlfExFbGVtZW50Q29udGFpbmVyTm9kZXxMQ29udGFpbmVyTm9kZSkge31cblxuICBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmIHtcbiAgICBjb25zdCBpbmplY3RvciA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0aGlzLl9ob3N0Tm9kZSk7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGNvbnN0IGluamVjdG9yID0gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHRoaXMuX2hvc3ROb2RlKTtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihpbmplY3Rvcik7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBjb25zdCBwYXJlbnRMSW5qZWN0b3IgPSBnZXRQYXJlbnRMTm9kZSh0aGlzLl9ob3N0Tm9kZSkubm9kZUluamVjdG9yO1xuICAgIHJldHVybiBwYXJlbnRMSW5qZWN0b3IgPyBuZXcgTm9kZUluamVjdG9yKHBhcmVudExJbmplY3RvcikgOiBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICB3aGlsZSAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBUZW1wbGF0ZVJlZjxDPilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fbFZpZXdOb2RlICE7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICBjb25zdCB2aWV3cyA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBhZGp1c3RlZElkeCArIDEgPCB2aWV3cy5sZW5ndGggP1xuICAgICAgICAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1thZGp1c3RlZElkeCArIDFdKSAhKS5uYXRpdmUgOlxuICAgICAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodGhpcy5fbENvbnRhaW5lck5vZGUsIGxWaWV3Tm9kZSwgdHJ1ZSwgYmVmb3JlTm9kZSk7XG5cbiAgICAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLmF0dGFjaFRvVmlld0NvbnRhaW5lclJlZih0aGlzKTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDAsIHZpZXdSZWYpO1xuXG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBtb3ZlKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZiwgbmV3SW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZiB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmluZGV4T2Yodmlld1JlZik7XG4gICAgdGhpcy5kZXRhY2goaW5kZXgpO1xuICAgIHRoaXMuaW5zZXJ0KHZpZXdSZWYsIHRoaXMuX2FkanVzdEluZGV4KG5ld0luZGV4KSk7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBpbmRleE9mKHZpZXdSZWY6IHZpZXdFbmdpbmVfVmlld1JlZik6IG51bWJlciB7IHJldHVybiB0aGlzLl92aWV3UmVmcy5pbmRleE9mKHZpZXdSZWYpOyB9XG5cbiAgcmVtb3ZlKGluZGV4PzogbnVtYmVyKTogdm9pZCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIHJlbW92ZVZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICB0aGlzLl92aWV3UmVmcy5zcGxpY2UoYWRqdXN0ZWRJZHgsIDEpO1xuICB9XG5cbiAgZGV0YWNoKGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICBkZXRhY2hWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YVtWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgVGVtcGxhdGVSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVGVtcGxhdGVSZWYgYWxyZWFkeVxuICogZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIFRlbXBsYXRlUmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIFRlbXBsYXRlUmVmXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmPFQ+KGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgaWYgKCFkaS50ZW1wbGF0ZVJlZikge1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShkaS5ub2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyKTtcbiAgICBjb25zdCBob3N0Tm9kZSA9IGRpLm5vZGUgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gaG9zdE5vZGUudE5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgZGkudGVtcGxhdGVSZWYgPSBuZXcgVGVtcGxhdGVSZWY8YW55PihcbiAgICAgICAgaG9zdE5vZGUudmlldywgZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpKSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldywgZ2V0UmVuZGVyZXIoKSxcbiAgICAgICAgaG9zdE5vZGUuZGF0YVtRVUVSSUVTXSk7XG4gIH1cbiAgcmV0dXJuIGRpLnRlbXBsYXRlUmVmO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6ICgodHlwZT86IFR5cGU8VD4pID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IHR5cGVBbnkubmdDb21wb25lbnREZWYgfHwgdHlwZUFueS5uZ0RpcmVjdGl2ZURlZiB8fCB0eXBlQW55Lm5nUGlwZURlZiB8fFxuICAgICAgdHlwZUFueS5uZ0luamVjdGFibGVEZWYgfHwgdHlwZUFueS5uZ0luamVjdG9yRGVmO1xuICBpZiAoZGVmID09PSB1bmRlZmluZWQgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG5cbmNsYXNzIFRlbXBsYXRlUmVmPFQ+IGltcGxlbWVudHMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfZGVjbGFyYXRpb25QYXJlbnRWaWV3OiBMVmlld0RhdGEsIHJlYWRvbmx5IGVsZW1lbnRSZWY6IHZpZXdFbmdpbmVfRWxlbWVudFJlZixcbiAgICAgIHByaXZhdGUgX3RWaWV3OiBUVmlldywgcHJpdmF0ZSBfcmVuZGVyZXI6IFJlbmRlcmVyMywgcHJpdmF0ZSBfcXVlcmllczogTFF1ZXJpZXN8bnVsbCkge31cblxuICBjcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dDogVCwgY29udGFpbmVyTm9kZT86IExDb250YWluZXJOb2RlLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3Qgdmlld05vZGUgPSBjcmVhdGVFbWJlZGRlZFZpZXdOb2RlKFxuICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgaWYgKGNvbnRhaW5lck5vZGUpIHtcbiAgICAgIGluc2VydFZpZXcoY29udGFpbmVyTm9kZSwgdmlld05vZGUsIGluZGV4ICEpO1xuICAgIH1cbiAgICByZW5kZXJFbWJlZGRlZFRlbXBsYXRlKHZpZXdOb2RlLCB0aGlzLl90VmlldywgY29udGV4dCwgUmVuZGVyRmxhZ3MuQ3JlYXRlKTtcbiAgICBjb25zdCB2aWV3UmVmID0gbmV3IFZpZXdSZWYodmlld05vZGUuZGF0YSwgY29udGV4dCk7XG4gICAgdmlld1JlZi5fbFZpZXdOb2RlID0gdmlld05vZGU7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXRyaWV2ZXMgYFRlbXBsYXRlUmVmYCBpbnN0YW5jZSBmcm9tIGBJbmplY3RvcmAgd2hlbiBhIGxvY2FsIHJlZmVyZW5jZSBpcyBwbGFjZWQgb24gdGhlXG4gKiBgPG5nLXRlbXBsYXRlPmAgZWxlbWVudC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRlbXBsYXRlUmVmRXh0cmFjdG9yKGxOb2RlOiBMTm9kZVdpdGhMb2NhbFJlZnMpIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKGxOb2RlKSk7XG59Il19