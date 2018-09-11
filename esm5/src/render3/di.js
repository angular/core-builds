/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
// We are temporarily importing the existing viewEngine_from core so we can be sure we are
// correctly implementing its interfaces for backwards compatibility.
import { ChangeDetectorRef as viewEngine_ChangeDetectorRef } from '../change_detection/change_detector_ref';
import { getInjectableDef, getInjectorDef } from '../di/defs';
import { NullInjector, inject, setCurrentInjector } from '../di/injector';
import { ElementRef as viewEngine_ElementRef } from '../linker/element_ref';
import { NgModuleRef as viewEngine_NgModuleRef } from '../linker/ng_module_factory';
import { TemplateRef as viewEngine_TemplateRef } from '../linker/template_ref';
import { ViewContainerRef as viewEngine_ViewContainerRef } from '../linker/view_container_ref';
import { Renderer2 } from '../render';
import { assertDefined, assertGreaterThan, assertLessThan } from './assert';
import { ComponentFactoryResolver } from './component_ref';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { addToViewTree, assertPreviousIsParent, createEmbeddedViewNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentNode, getPreviousOrParentTNode, getRenderer, isComponent, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
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
export function injectRenderer2() {
    return getOrCreateRenderer2(getOrCreateNodeInjector());
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
    var tNode = getPreviousOrParentTNode();
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
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
function getOrCreateRenderer2(di) {
    var renderer = di.node.view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return renderer;
    }
    else {
        throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
    }
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
    ngDevMode &&
        assertNodeOfPossibleTypes(node.tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
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
var ElementRef = /** @class */ (function (_super) {
    tslib_1.__extends(ElementRef, _super);
    function ElementRef() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    return ElementRef;
}(viewEngine_ElementRef));
/**
 * Creates a ViewContainerRef and stores it on the injector. Or, if the ViewContainerRef
 * already exists, retrieves the existing ViewContainerRef.
 *
 * @returns The ViewContainerRef instance to use
 */
export function getOrCreateContainerRef(di) {
    if (!di.viewContainerRef) {
        var vcRefHost = di.node;
        var hostTNode = vcRefHost.tNode;
        ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
        var hostParent = getParentLNode(vcRefHost);
        var lContainer = createLContainer(hostParent, vcRefHost.view, true);
        var comment = vcRefHost.view[RENDERER].createComment(ngDevMode ? 'container' : '');
        var lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, vcRefHost.nodeInjector, comment, lContainer);
        appendChild(hostParent, comment, vcRefHost.view);
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
        if (token === Renderer2) {
            return getOrCreateRenderer2(this._lInjector);
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
var ViewContainerRef = /** @class */ (function (_super) {
    tslib_1.__extends(ViewContainerRef, _super);
    function ViewContainerRef(_lContainerNode, _hostNode) {
        var _this = _super.call(this) || this;
        _this._lContainerNode = _lContainerNode;
        _this._hostNode = _hostNode;
        _this._viewRefs = [];
        return _this;
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
        addRemoveViewFromContainer(this._lContainerNode, lViewNode.data, true, beforeNode);
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
}(viewEngine_ViewContainerRef));
/**
 * Creates a TemplateRef and stores it on the injector. Or, if the TemplateRef already
 * exists, retrieves the existing TemplateRef.
 *
 * @param di The node injector where we should store a created TemplateRef
 * @returns The TemplateRef instance to use
 */
export function getOrCreateTemplateRef(di) {
    if (!di.templateRef) {
        var hostNode = di.node;
        var hostTNode = hostNode.tNode;
        ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(hostNode.view, getOrCreateElementRef(di), hostTNode.tViews, getRenderer(), hostNode.data[QUERIES]);
    }
    return di.templateRef;
}
export function getFactoryOf(type) {
    var typeAny = type;
    var def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
        getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
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
var TemplateRef = /** @class */ (function (_super) {
    tslib_1.__extends(TemplateRef, _super);
    function TemplateRef(_declarationParentView, elementRef, _tView, _renderer, _queries) {
        var _this = _super.call(this) || this;
        _this._declarationParentView = _declarationParentView;
        _this.elementRef = elementRef;
        _this._tView = _tView;
        _this._renderer = _renderer;
        _this._queries = _queries;
        return _this;
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
}(viewEngine_TemplateRef));
/**
 * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
 * `<ng-template>` element.
 */
export function templateRefExtractor(lNode) {
    return getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(lNode));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7QUFFSCwwRkFBMEY7QUFDMUYscUVBQXFFO0FBRXJFLE9BQU8sRUFBQyxpQkFBaUIsSUFBSSw0QkFBNEIsRUFBQyxNQUFNLHlDQUF5QyxDQUFDO0FBQzFHLE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxZQUFZLENBQUM7QUFFNUQsT0FBTyxFQUF3QixZQUFZLEVBQUUsTUFBTSxFQUFFLGtCQUFrQixFQUFDLE1BQU0sZ0JBQWdCLENBQUM7QUFHL0YsT0FBTyxFQUFDLFVBQVUsSUFBSSxxQkFBcUIsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzFFLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSw2QkFBNkIsQ0FBQztBQUNsRixPQUFPLEVBQUMsV0FBVyxJQUFJLHNCQUFzQixFQUFDLE1BQU0sd0JBQXdCLENBQUM7QUFDN0UsT0FBTyxFQUFDLGdCQUFnQixJQUFJLDJCQUEyQixFQUFDLE1BQU0sOEJBQThCLENBQUM7QUFFN0YsT0FBTyxFQUFDLFNBQVMsRUFBQyxNQUFNLFdBQVcsQ0FBQztBQUdwQyxPQUFPLEVBQUMsYUFBYSxFQUFFLGlCQUFpQixFQUFFLGNBQWMsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUMxRSxPQUFPLEVBQUMsd0JBQXdCLEVBQUMsTUFBTSxpQkFBaUIsQ0FBQztBQUN6RCxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSxzQkFBc0IsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUs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QkFBb0IsQ0FBQyxLQUF5QjtJQUM1RCxPQUFPLHNCQUFzQixDQUFDLDhCQUE4QixDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7QUFDdkUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7YWRkVG9WaWV3VHJlZSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZSwgY3JlYXRlTENvbnRhaW5lciwgY3JlYXRlTE5vZGVPYmplY3QsIGNyZWF0ZVROb2RlLCBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCBnZXRSZW5kZXJlciwgaXNDb21wb25lbnQsIHJlbmRlckVtYmVkZGVkVGVtcGxhdGUsIHJlc29sdmVEaXJlY3RpdmV9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7VklFV1N9IGZyb20gJy4vaW50ZXJmYWNlcy9jb250YWluZXInO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbCwgUmVuZGVyRmxhZ3N9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7TEluamVjdG9yfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIExDb250YWluZXJOb2RlLCBMRWxlbWVudENvbnRhaW5lck5vZGUsIExFbGVtZW50Tm9kZSwgTE5vZGUsIExOb2RlV2l0aExvY2FsUmVmcywgTFZpZXdOb2RlLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RJUkVDVElWRVMsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZ2V0Q2hpbGRMTm9kZSwgZ2V0UGFyZW50TE5vZGUsIGluc2VydFZpZXcsIHJlbW92ZVZpZXd9IGZyb20gJy4vbm9kZV9tYW5pcHVsYXRpb24nO1xuaW1wb3J0IHtWaWV3UmVmfSBmcm9tICcuL3ZpZXdfcmVmJztcblxuXG5cbi8qKlxuICogSWYgYSBkaXJlY3RpdmUgaXMgZGlQdWJsaWMsIGJsb29tQWRkIHNldHMgYSBwcm9wZXJ0eSBvbiB0aGUgdHlwZSB3aXRoIHRoaXMgY29uc3RhbnQgYXNcbiAqIHRoZSBrZXkgYW5kIHRoZSBkaXJlY3RpdmUncyB1bmlxdWUgSUQgYXMgdGhlIHZhbHVlLiBUaGlzIGFsbG93cyB1cyB0byBtYXAgZGlyZWN0aXZlcyB0byB0aGVpclxuICogYmxvb20gZmlsdGVyIGJpdCBmb3IgREkuXG4gKi9cbmNvbnN0IE5HX0VMRU1FTlRfSUQgPSAnX19OR19FTEVNRU5UX0lEX18nO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcbmNvbnN0IEJMT09NX01BU0sgPSBCTE9PTV9TSVpFIC0gMTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggdGhlIGRpcmVjdGl2ZSBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoaW5qZWN0b3I6IExJbmplY3RvciwgdHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgaWYgKGlkID09IG51bGwpIHtcbiAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgfVxuXG4gIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG5cbiAgaWYgKGI3KSB7XG4gICAgYjYgPyAoYjUgPyAoaW5qZWN0b3IuYmY3IHw9IG1hc2spIDogKGluamVjdG9yLmJmNiB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKGluamVjdG9yLmJmNSB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjQgfD0gbWFzaykpO1xuICB9IGVsc2Uge1xuICAgIGI2ID8gKGI1ID8gKGluamVjdG9yLmJmMyB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjIgfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/IChpbmplY3Rvci5iZjEgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYwIHw9IG1hc2spKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogTEluamVjdG9yIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTEVsZW1lbnRDb250YWluZXJOb2RlIHwgTENvbnRhaW5lck5vZGUpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSBub2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICBub2RlOiBMRWxlbWVudE5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGUgfCBMQ29udGFpbmVyTm9kZSk6IExJbmplY3RvciB7XG4gIGNvbnN0IG5vZGVJbmplY3RvciA9IG5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBwYXJlbnQgPSBnZXRQYXJlbnRMTm9kZShub2RlKTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnQgJiYgcGFyZW50Lm5vZGVJbmplY3RvcjtcbiAgaWYgKG5vZGVJbmplY3RvciAhPSBwYXJlbnRJbmplY3Rvcikge1xuICAgIHJldHVybiBub2RlSW5qZWN0b3IgITtcbiAgfVxuICByZXR1cm4gbm9kZS5ub2RlSW5qZWN0b3IgPSB7XG4gICAgcGFyZW50OiBwYXJlbnRJbmplY3RvcixcbiAgICBub2RlOiBub2RlLFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGwsXG4gIH07XG59XG5cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKiBPciwgaWYgaXQgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgaW5zdGFuY2UuXG4gKlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihcbiAgICBkaTogTEluamVjdG9yLCBjb250ZXh0OiBhbnkpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgaWYgKGRpLmNoYW5nZURldGVjdG9yUmVmKSByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgY29uc3QgY3VycmVudE5vZGUgPSBkaS5ub2RlO1xuICBpZiAoaXNDb21wb25lbnQoY3VycmVudE5vZGUudE5vZGUpKSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gbmV3IFZpZXdSZWYoY3VycmVudE5vZGUuZGF0YSBhcyBMVmlld0RhdGEsIGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50KSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID0gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGUudmlld1tIT1NUX05PREVdKTtcbiAgfVxuICByZXR1cm4gbnVsbCAhO1xufVxuXG4vKiogR2V0cyBvciBjcmVhdGVzIENoYW5nZURldGVjdG9yUmVmIGZvciB0aGUgY2xvc2VzdCBob3N0IGNvbXBvbmVudCAqL1xuZnVuY3Rpb24gZ2V0T3JDcmVhdGVIb3N0Q2hhbmdlRGV0ZWN0b3IoY3VycmVudE5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6XG4gICAgdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGNvbnN0IGhvc3ROb2RlID0gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKGN1cnJlbnROb2RlKTtcbiAgY29uc3QgaG9zdEluamVjdG9yID0gaG9zdE5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBleGlzdGluZ1JlZiA9IGhvc3RJbmplY3RvciAmJiBob3N0SW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcmV0dXJuIGV4aXN0aW5nUmVmID9cbiAgICAgIGV4aXN0aW5nUmVmIDpcbiAgICAgIG5ldyBWaWV3UmVmKFxuICAgICAgICAgIGhvc3ROb2RlLmRhdGEgYXMgTFZpZXdEYXRhLFxuICAgICAgICAgIGhvc3ROb2RlXG4gICAgICAgICAgICAgIC52aWV3W0RJUkVDVElWRVNdICFbaG9zdE5vZGUudE5vZGUuZmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnRdKTtcbn1cblxuXG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGRpOiBMSW5qZWN0b3IpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IGRpLm5vZGUudmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBJZiB0aGUgbm9kZSBpcyBhbiBlbWJlZGRlZCB2aWV3LCB0cmF2ZXJzZXMgdXAgdGhlIHZpZXcgdHJlZSB0byByZXR1cm4gdGhlIGNsb3Nlc3RcbiAqIGFuY2VzdG9yIHZpZXcgdGhhdCBpcyBhdHRhY2hlZCB0byBhIGNvbXBvbmVudC4gSWYgaXQncyBhbHJlYWR5IGEgY29tcG9uZW50IG5vZGUsXG4gKiByZXR1cm5zIGl0c2VsZi5cbiAqL1xuZnVuY3Rpb24gZ2V0Q2xvc2VzdENvbXBvbmVudEFuY2VzdG9yKG5vZGU6IExWaWV3Tm9kZSB8IExFbGVtZW50Tm9kZSk6IExFbGVtZW50Tm9kZSB7XG4gIHdoaWxlIChub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5WaWV3KSB7XG4gICAgbm9kZSA9IG5vZGUudmlld1tIT1NUX05PREVdO1xuICB9XG4gIHJldHVybiBub2RlIGFzIExFbGVtZW50Tm9kZTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogTG9vayBmb3IgdGhlIGluamVjdG9yIHByb3ZpZGluZyB0aGUgdG9rZW4gYnkgd2Fsa2luZyB1cCB0aGUgbm9kZSBpbmplY3RvciB0cmVlIGFuZCB0aGVuXG4gKiB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUuXG4gKlxuICogQHBhcmFtIG5vZGVJbmplY3RvciBOb2RlIGluamVjdG9yIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gdG9rZW4gVGhlIHRva2VuIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgbm9kZUluamVjdG9yOiBMSW5qZWN0b3IsIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPixcbiAgICBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0KHRva2VuKTtcblxuICAvLyBJZiB0aGUgdG9rZW4gaGFzIGEgYmxvb20gaGFzaCwgdGhlbiBpdCBpcyBhIGRpcmVjdGl2ZSB0aGF0IGlzIHB1YmxpYyB0byB0aGUgaW5qZWN0aW9uIHN5c3RlbVxuICAvLyAoZGlQdWJsaWMpIG90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG1vZHVsZSBpbmplY3Rvci5cbiAgaWYgKGJsb29tSGFzaCAhPT0gbnVsbCkge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBub2RlSW5qZWN0b3I7XG5cbiAgICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAgIC8vIEdldCB0aGUgY2xvc2VzdCBwb3RlbnRpYWwgbWF0Y2hpbmcgaW5qZWN0b3IgKHVwd2FyZHMgaW4gdGhlIGluamVjdG9yIHRyZWUpIHRoYXRcbiAgICAgIC8vICpwb3RlbnRpYWxseSogaGFzIHRoZSB0b2tlbi5cbiAgICAgIGluamVjdG9yID0gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihpbmplY3RvciwgYmxvb21IYXNoLCBmbGFncyk7XG5cbiAgICAgIC8vIElmIG5vIGluamVjdG9yIGlzIGZvdW5kLCB3ZSAqa25vdyogdGhhdCB0aGVyZSBpcyBubyBhbmNlc3RvciBpbmplY3RvciB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgLy8gdG9rZW4sIHNvIHdlIGFib3J0LlxuICAgICAgaWYgKCFpbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3Qgbm9kZSA9IGluamVjdG9yLm5vZGU7XG4gICAgICBjb25zdCBub2RlRmxhZ3MgPSBub2RlLnROb2RlLmZsYWdzO1xuICAgICAgY29uc3QgY291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICAgICAgaWYgKGNvdW50ICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgICAgICBjb25zdCBkZWZzID0gbm9kZS52aWV3W1RWSUVXXS5kaXJlY3RpdmVzICE7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGRlZmluaXRpb24gZm9yIHRoZSBkaXJlY3RpdmUgYXQgdGhpcyBpbmRleCBhbmQsIGlmIGl0IGlzIGluamVjdGFibGUgKGRpUHVibGljKSxcbiAgICAgICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlRGVmLnR5cGUgPT09IHRva2VuICYmIGRpcmVjdGl2ZURlZi5kaVB1YmxpYykge1xuICAgICAgICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSAqZGlkbid0KiBmaW5kIHRoZSBkaXJlY3RpdmUgZm9yIHRoZSB0b2tlbiBhbmQgd2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCBub2RlJ3NcbiAgICAgIC8vIGluamVjdG9yLCBpdCdzIHBvc3NpYmxlIHRoZSBkaXJlY3RpdmUgaXMgb24gdGhpcyBub2RlIGFuZCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cbiAgICAgIGxldCBpbnN0YW5jZTogVHxudWxsO1xuICAgICAgaWYgKGluamVjdG9yID09PSBub2RlSW5qZWN0b3IgJiZcbiAgICAgICAgICAoaW5zdGFuY2UgPSBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4obm9kZSwgdG9rZW4pKSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAvLyBJZiBmbGFncyBwZXJtaXQsIHRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgICBpbmplY3RvciA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvciA9IGluamVjdG9yLnBhcmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkudmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGZvcm1lckluamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKG1vZHVsZUluamVjdG9yKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q3VycmVudEluamVjdG9yKGZvcm1lckluamVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4obm9kZTogTE5vZGUsIHRva2VuOiBhbnkpOiBUfG51bGwge1xuICBjb25zdCBtYXRjaGVzID0gbm9kZS52aWV3W1RWSUVXXS5jdXJyZW50TWF0Y2hlcztcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVEaXJlY3RpdmUoZGVmLCBpICsgMSwgbWF0Y2hlcywgbm9kZS52aWV3W1RWSUVXXSk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlciB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGRpcmVjdGl2ZSBtaWdodCBiZSBwcm92aWRlZCBieSB0aGUgaW5qZWN0b3IuXG4gKlxuICogV2hlbiBhIGRpcmVjdGl2ZSBpcyBwdWJsaWMsIGl0IGlzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIgYW5kIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIFR5cGUuIFdoZW4gdGhlIGRpcmVjdGl2ZSBpc24ndCBwdWJsaWMgb3IgdGhlIHRva2VuIGlzIG5vdCBhIGRpcmVjdGl2ZSBgbnVsbGBcbiAqIGlzIHJldHVybmVkIGFzIHRoZSBub2RlIGluamVjdG9yIGNhbiBub3QgcG9zc2libHkgcHJvdmlkZSB0aGF0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgaW5qZWN0aW9uIHRva2VuXG4gKiBAcmV0dXJucyB0aGUgbWF0Y2hpbmcgYml0IHRvIGNoZWNrIGluIHRoZSBibG9vbSBmaWx0ZXIgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBpcyBub3Qga25vd24uXG4gKi9cbmZ1bmN0aW9uIGJsb29tSGFzaEJpdCh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogbnVtYmVyfG51bGwge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiBpZCA9PT0gJ251bWJlcicgPyBpZCAmIEJMT09NX01BU0sgOiBudWxsO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSBhIGNlcnRhaW4gZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGNvcnJlc3BvbmRzIHRvIGEgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLiBHaXZlbiB0aGUgYmxvb20gYml0IHRvXG4gKiBjaGVjayBhbmQgYSBzdGFydGluZyBpbmplY3RvciwgdGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdXAgaW5qZWN0b3JzIHVudGlsIGl0IGZpbmRzIGFuXG4gKiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgMSBmb3IgdGhhdCBiaXQgaW4gaXRzIGJsb29tIGZpbHRlci4gQSAxIGluZGljYXRlcyB0aGF0IHRoZVxuICogaW5qZWN0b3IgbWF5IGhhdmUgdGhhdCBkaXJlY3RpdmUuIEl0IG9ubHkgKm1heSogaGF2ZSB0aGUgZGlyZWN0aXZlIGJlY2F1c2UgZGlyZWN0aXZlcyBiZWdpblxuICogdG8gc2hhcmUgYmxvb20gZmlsdGVyIGJpdHMgYWZ0ZXIgdGhlIEJMT09NX1NJWkUgaXMgcmVhY2hlZCwgYW5kIGl0IGNvdWxkIGNvcnJlc3BvbmQgdG8gYVxuICogZGlmZmVyZW50IGRpcmVjdGl2ZSBzaGFyaW5nIHRoZSBiaXQuXG4gKlxuICogTm90ZTogV2UgY2FuIHNraXAgY2hlY2tpbmcgZnVydGhlciBpbmplY3RvcnMgdXAgdGhlIHRyZWUgaWYgYW4gaW5qZWN0b3IncyBjYmYgc3RydWN0dXJlXG4gKiBoYXMgYSAwIGZvciB0aGF0IGJsb29tIGJpdC4gU2luY2UgY2JmIGNvbnRhaW5zIHRoZSBtZXJnZWQgdmFsdWUgb2YgYWxsIHRoZSBwYXJlbnRcbiAqIGluamVjdG9ycywgYSAwIGluIHRoZSBibG9vbSBiaXQgaW5kaWNhdGVzIHRoYXQgdGhlIHBhcmVudHMgZGVmaW5pdGVseSBkbyBub3QgY29udGFpblxuICogdGhlIGRpcmVjdGl2ZSBhbmQgZG8gbm90IG5lZWQgdG8gYmUgY2hlY2tlZC5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIHN0YXJ0aW5nIG5vZGUgaW5qZWN0b3IgdG8gY2hlY2tcbiAqIEBwYXJhbSAgYmxvb21CaXQgVGhlIGJpdCB0byBjaGVjayBpbiBlYWNoIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiBAcGFyYW0gIGZsYWdzIFRoZSBpbmplY3Rpb24gZmxhZ3MgZm9yIHRoaXMgaW5qZWN0aW9uIHNpdGUgKGUuZy4gT3B0aW9uYWwgb3IgU2tpcFNlbGYpXG4gKiBAcmV0dXJucyBBbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgdGhlIGRpcmVjdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihcbiAgICBzdGFydEluamVjdG9yOiBMSW5qZWN0b3IsIGJsb29tQml0OiBudW1iZXIsIGZsYWdzOiBJbmplY3RGbGFncyk6IExJbmplY3RvcnxudWxsIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcbiAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcblxuICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmUgKmlzbid0KiBhXG4gIC8vIG1hdGNoLlxuICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID1cbiAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYgPyBzdGFydEluamVjdG9yLnBhcmVudCA6IHN0YXJ0SW5qZWN0b3I7XG5cbiAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gICAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gICAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICAgIGlmIChiNykge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmJmNyA6IGluamVjdG9yLmJmNikgOiAoYjUgPyBpbmplY3Rvci5iZjUgOiBpbmplY3Rvci5iZjQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuYmYzIDogaW5qZWN0b3IuYmYyKSA6IChiNSA/IGluamVjdG9yLmJmMSA6IGluamVjdG9yLmJmMCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAgIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gICAgaWYgKHZhbHVlICYgbWFzaykge1xuICAgICAgcmV0dXJuIGluamVjdG9yO1xuICAgIH1cblxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudCBpbmplY3RvciBkb2VzIG5vdCBoYXZlIHRoZSBkaXJlY3RpdmUsIGNoZWNrIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgYW5jZXN0b3JcbiAgICAvLyBpbmplY3RvcnMgKGNiZjAgLSBjYmY3KS4gVGhlc2UgZmlsdGVycyBjYXB0dXJlICphbGwqIGFuY2VzdG9yIGluamVjdG9ycy5cbiAgICBpZiAoYjcpIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5jYmY3IDogaW5qZWN0b3IuY2JmNikgOiAoYjUgPyBpbmplY3Rvci5jYmY1IDogaW5qZWN0b3IuY2JmNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5jYmYzIDogaW5qZWN0b3IuY2JmMikgOiAoYjUgPyBpbmplY3Rvci5jYmYxIDogaW5qZWN0b3IuY2JmMCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlIHVwIHRvXG4gICAgLy8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZSBjYW4gYWJvcnQuXG4gICAgaWYgKHZhbHVlICYgbWFzaykge1xuICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcoaW5qZWN0b3I6IExJbmplY3Rvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFpbmplY3Rvci5wYXJlbnQgJiYgaW5qZWN0b3IucGFyZW50Lm5vZGUudmlldyA9PT0gaW5qZWN0b3Iubm9kZS52aWV3O1xufVxuXG5leHBvcnQgY2xhc3MgUmVhZEZyb21JbmplY3RvckZuPFQ+IHtcbiAgY29uc3RydWN0b3IocmVhZG9ubHkgcmVhZDogKGluamVjdG9yOiBMSW5qZWN0b3IsIG5vZGU6IExOb2RlLCBkaXJlY3RpdmVJbmRleD86IG51bWJlcikgPT4gVCkge31cbn1cblxuLyoqXG4gKiBDcmVhdGVzIGFuIEVsZW1lbnRSZWYgZm9yIGEgZ2l2ZW4gbm9kZSBpbmplY3RvciBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci5cbiAqIE9yLCBpZiB0aGUgRWxlbWVudFJlZiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBFbGVtZW50UmVmLlxuICpcbiAqIEBwYXJhbSBkaSBUaGUgbm9kZSBpbmplY3RvciB3aGVyZSB3ZSBzaG91bGQgc3RvcmUgYSBjcmVhdGVkIEVsZW1lbnRSZWZcbiAqIEByZXR1cm5zIFRoZSBFbGVtZW50UmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpOiBMSW5qZWN0b3IpOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYge1xuICByZXR1cm4gZGkuZWxlbWVudFJlZiB8fCAoZGkuZWxlbWVudFJlZiA9IG5ldyBFbGVtZW50UmVmKGRpLm5vZGUubmF0aXZlKSk7XG59XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX1RFTVBMQVRFX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxhbnk+PihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9DT05UQUlORVJfUkVGID0gPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPj4oXG4gICAgbmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoaW5qZWN0b3IpKSBhcyBhbnkpO1xuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9FTEVNRU5UX1JFRiA9XG4gICAgPFF1ZXJ5UmVhZFR5cGU8dmlld0VuZ2luZV9FbGVtZW50UmVmPj4obmV3IFJlYWRGcm9tSW5qZWN0b3JGbjx2aWV3RW5naW5lX0VsZW1lbnRSZWY+KFxuICAgICAgICAoaW5qZWN0b3I6IExJbmplY3RvcikgPT4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRlJPTV9OT0RFID1cbiAgICAobmV3IFJlYWRGcm9tSW5qZWN0b3JGbjxhbnk+KChpbmplY3RvcjogTEluamVjdG9yLCBub2RlOiBMTm9kZSwgZGlyZWN0aXZlSWR4OiBudW1iZXIpID0+IHtcbiAgICAgIG5nRGV2TW9kZSAmJlxuICAgICAgICAgIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgIG5vZGUudE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gICAgICBpZiAoZGlyZWN0aXZlSWR4ID4gLTEpIHtcbiAgICAgICAgcmV0dXJuIG5vZGUudmlld1tESVJFQ1RJVkVTXSAhW2RpcmVjdGl2ZUlkeF07XG4gICAgICB9XG4gICAgICBpZiAobm9kZS50Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCBub2RlLnROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpO1xuICAgICAgfVxuICAgICAgaWYgKG5vZGUudE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZihpbmplY3Rvcik7XG4gICAgICB9XG4gICAgICBpZiAobmdEZXZNb2RlKSB7XG4gICAgICAgIC8vIHNob3VsZCBuZXZlciBoYXBwZW5cbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbmV4cGVjdGVkIG5vZGUgdHlwZTogJHtub2RlLnROb2RlLnR5cGV9YCk7XG4gICAgICB9XG4gICAgfSkgYXMgYW55IGFzIFF1ZXJ5UmVhZFR5cGU8YW55Pik7XG5cbi8qKiBBIHJlZiB0byBhIG5vZGUncyBuYXRpdmUgZWxlbWVudC4gKi9cbmNsYXNzIEVsZW1lbnRSZWYgZXh0ZW5kcyB2aWV3RW5naW5lX0VsZW1lbnRSZWYge31cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IHZjUmVmSG9zdCA9IGRpLm5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gdmNSZWZIb3N0LnROb2RlIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlO1xuXG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gICAgY29uc3QgaG9zdFBhcmVudCA9IGdldFBhcmVudExOb2RlKHZjUmVmSG9zdCkgITtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gY3JlYXRlTENvbnRhaW5lcihob3N0UGFyZW50LCB2Y1JlZkhvc3QudmlldywgdHJ1ZSk7XG4gICAgY29uc3QgY29tbWVudCA9IHZjUmVmSG9zdC52aWV3W1JFTkRFUkVSXS5jcmVhdGVDb21tZW50KG5nRGV2TW9kZSA/ICdjb250YWluZXInIDogJycpO1xuICAgIGNvbnN0IGxDb250YWluZXJOb2RlOiBMQ29udGFpbmVyTm9kZSA9IGNyZWF0ZUxOb2RlT2JqZWN0KFxuICAgICAgICBUTm9kZVR5cGUuQ29udGFpbmVyLCB2Y1JlZkhvc3QudmlldywgdmNSZWZIb3N0Lm5vZGVJbmplY3RvciwgY29tbWVudCwgbENvbnRhaW5lcik7XG4gICAgYXBwZW5kQ2hpbGQoaG9zdFBhcmVudCwgY29tbWVudCwgdmNSZWZIb3N0LnZpZXcpO1xuXG4gICAgaWYgKCFob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUpIHtcbiAgICAgIGhvc3RUTm9kZS5keW5hbWljQ29udGFpbmVyTm9kZSA9XG4gICAgICAgICAgY3JlYXRlVE5vZGUoVE5vZGVUeXBlLkNvbnRhaW5lciwgLTEsIG51bGwsIG51bGwsIGhvc3RUTm9kZSwgbnVsbCk7XG4gICAgfVxuXG4gICAgbENvbnRhaW5lck5vZGUudE5vZGUgPSBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGU7XG4gICAgdmNSZWZIb3N0LmR5bmFtaWNMQ29udGFpbmVyTm9kZSA9IGxDb250YWluZXJOb2RlO1xuXG4gICAgYWRkVG9WaWV3VHJlZSh2Y1JlZkhvc3QudmlldywgaG9zdFROb2RlLmluZGV4IGFzIG51bWJlciwgbENvbnRhaW5lcik7XG5cbiAgICBkaS52aWV3Q29udGFpbmVyUmVmID0gbmV3IFZpZXdDb250YWluZXJSZWYobENvbnRhaW5lck5vZGUsIHZjUmVmSG9zdCk7XG4gIH1cblxuICByZXR1cm4gZGkudmlld0NvbnRhaW5lclJlZjtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBfbEluamVjdG9yOiBMSW5qZWN0b3IpIHt9XG5cbiAgZ2V0KHRva2VuOiBhbnkpOiBhbnkge1xuICAgIGlmICh0b2tlbiA9PT0gdmlld0VuZ2luZV9UZW1wbGF0ZVJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWYodGhpcy5fbEluamVjdG9yKTtcbiAgICB9XG4gICAgaWYgKHRva2VuID09PSB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYpIHtcbiAgICAgIHJldHVybiBnZXRPckNyZWF0ZUNvbnRhaW5lclJlZih0aGlzLl9sSW5qZWN0b3IpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gPT09IHZpZXdFbmdpbmVfRWxlbWVudFJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZih0aGlzLl9sSW5qZWN0b3IpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gPT09IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYpIHtcbiAgICAgIHJldHVybiBnZXRPckNyZWF0ZUNoYW5nZURldGVjdG9yUmVmKHRoaXMuX2xJbmplY3RvciwgbnVsbCk7XG4gICAgfVxuICAgIGlmICh0b2tlbiA9PT0gUmVuZGVyZXIyKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodGhpcy5fbEluamVjdG9yKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX2xJbmplY3RvciwgdG9rZW4pO1xuICB9XG59XG5cbi8qKlxuICogQSByZWYgdG8gYSBjb250YWluZXIgdGhhdCBlbmFibGVzIGFkZGluZyBhbmQgcmVtb3Zpbmcgdmlld3MgZnJvbSB0aGF0IGNvbnRhaW5lclxuICogaW1wZXJhdGl2ZWx5LlxuICovXG5jbGFzcyBWaWV3Q29udGFpbmVyUmVmIGV4dGVuZHMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcHJpdmF0ZSBfdmlld1JlZnM6IHZpZXdFbmdpbmVfVmlld1JlZltdID0gW107XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9sQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0Tm9kZTogTEVsZW1lbnROb2RlfExFbGVtZW50Q29udGFpbmVyTm9kZXxMQ29udGFpbmVyTm9kZSkge1xuICAgIHN1cGVyKCk7XG4gIH1cblxuICBnZXQgZWxlbWVudCgpOiBFbGVtZW50UmVmIHtcbiAgICBjb25zdCBpbmplY3RvciA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZSh0aGlzLl9ob3N0Tm9kZSk7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3Rvcik7XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3Ige1xuICAgIGNvbnN0IGluamVjdG9yID0gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHRoaXMuX2hvc3ROb2RlKTtcbiAgICByZXR1cm4gbmV3IE5vZGVJbmplY3RvcihpbmplY3Rvcik7XG4gIH1cblxuICAvKiogQGRlcHJlY2F0ZWQgTm8gcmVwbGFjZW1lbnQgKi9cbiAgZ2V0IHBhcmVudEluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICBjb25zdCBwYXJlbnRMSW5qZWN0b3IgPSBnZXRQYXJlbnRMTm9kZSh0aGlzLl9ob3N0Tm9kZSkubm9kZUluamVjdG9yO1xuICAgIHJldHVybiBwYXJlbnRMSW5qZWN0b3IgPyBuZXcgTm9kZUluamVjdG9yKHBhcmVudExJbmplY3RvcikgOiBuZXcgTnVsbEluamVjdG9yKCk7XG4gIH1cblxuICBjbGVhcigpOiB2b2lkIHtcbiAgICBjb25zdCBsQ29udGFpbmVyID0gdGhpcy5fbENvbnRhaW5lck5vZGUuZGF0YTtcbiAgICB3aGlsZSAobENvbnRhaW5lcltWSUVXU10ubGVuZ3RoKSB7XG4gICAgICB0aGlzLnJlbW92ZSgwKTtcbiAgICB9XG4gIH1cblxuICBnZXQoaW5kZXg6IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzW2luZGV4XSB8fCBudWxsOyB9XG5cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIGNvbnN0IGxDb250YWluZXIgPSB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhO1xuICAgIHJldHVybiBsQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7XG4gIH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBUZW1wbGF0ZVJlZjxDPilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXdOb2RlID0gKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5fbFZpZXdOb2RlICE7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KHRoaXMuX2xDb250YWluZXJOb2RlLCBsVmlld05vZGUsIGFkanVzdGVkSWR4KTtcbiAgICBjb25zdCB2aWV3cyA9IHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdO1xuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBhZGp1c3RlZElkeCArIDEgPCB2aWV3cy5sZW5ndGggP1xuICAgICAgICAoZ2V0Q2hpbGRMTm9kZSh2aWV3c1thZGp1c3RlZElkeCArIDFdKSAhKS5uYXRpdmUgOlxuICAgICAgICB0aGlzLl9sQ29udGFpbmVyTm9kZS5uYXRpdmU7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIodGhpcy5fbENvbnRhaW5lck5vZGUsIGxWaWV3Tm9kZS5kYXRhLCB0cnVlLCBiZWZvcmVOb2RlKTtcblxuICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG5cbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIG1vdmUodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmLCBuZXdJbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBjb25zdCBpbmRleCA9IHRoaXMuaW5kZXhPZih2aWV3UmVmKTtcbiAgICB0aGlzLmRldGFjaChpbmRleCk7XG4gICAgdGhpcy5pbnNlcnQodmlld1JlZiwgdGhpcy5fYWRqdXN0SW5kZXgobmV3SW5kZXgpKTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxuXG4gIGluZGV4T2Yodmlld1JlZjogdmlld0VuZ2luZV9WaWV3UmVmKTogbnVtYmVyIHsgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLmluZGV4T2Yodmlld1JlZik7IH1cblxuICByZW1vdmUoaW5kZXg/OiBudW1iZXIpOiB2b2lkIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgcmVtb3ZlVmlldyh0aGlzLl9sQ29udGFpbmVyTm9kZSwgYWRqdXN0ZWRJZHgpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSk7XG4gIH1cblxuICBkZXRhY2goaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWZ8bnVsbCB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCwgLTEpO1xuICAgIGRldGFjaFZpZXcodGhpcy5fbENvbnRhaW5lck5vZGUsIGFkanVzdGVkSWR4KTtcbiAgICByZXR1cm4gdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKVswXSB8fCBudWxsO1xuICB9XG5cbiAgcHJpdmF0ZSBfYWRqdXN0SW5kZXgoaW5kZXg/OiBudW1iZXIsIHNoaWZ0OiBudW1iZXIgPSAwKSB7XG4gICAgaWYgKGluZGV4ID09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aGlzLl9sQ29udGFpbmVyTm9kZS5kYXRhW1ZJRVdTXS5sZW5ndGggKyBzaGlmdDtcbiAgICB9XG4gICAgaWYgKG5nRGV2TW9kZSkge1xuICAgICAgYXNzZXJ0R3JlYXRlclRoYW4oaW5kZXgsIC0xLCAnaW5kZXggbXVzdCBiZSBwb3NpdGl2ZScpO1xuICAgICAgLy8gKzEgYmVjYXVzZSBpdCdzIGxlZ2FsIHRvIGluc2VydCBhdCB0aGUgZW5kLlxuICAgICAgYXNzZXJ0TGVzc1RoYW4oaW5kZXgsIHRoaXMuX2xDb250YWluZXJOb2RlLmRhdGFbVklFV1NdLmxlbmd0aCArIDEgKyBzaGlmdCwgJ2luZGV4Jyk7XG4gICAgfVxuICAgIHJldHVybiBpbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSBUZW1wbGF0ZVJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBUZW1wbGF0ZVJlZiBhbHJlYWR5XG4gKiBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVGVtcGxhdGVSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgVGVtcGxhdGVSZWZcbiAqIEByZXR1cm5zIFRoZSBUZW1wbGF0ZVJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBpZiAoIWRpLnRlbXBsYXRlUmVmKSB7XG4gICAgY29uc3QgaG9zdE5vZGUgPSBkaS5ub2RlIGFzIExDb250YWluZXJOb2RlO1xuICAgIGNvbnN0IGhvc3RUTm9kZSA9IGhvc3ROb2RlLnROb2RlO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlVHlwZShob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIpO1xuICAgIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKGhvc3RUTm9kZS50Vmlld3MsICdUVmlldyBtdXN0IGJlIGFsbG9jYXRlZCcpO1xuICAgIGRpLnRlbXBsYXRlUmVmID0gbmV3IFRlbXBsYXRlUmVmPGFueT4oXG4gICAgICAgIGhvc3ROb2RlLnZpZXcsIGdldE9yQ3JlYXRlRWxlbWVudFJlZihkaSksIGhvc3RUTm9kZS50Vmlld3MgYXMgVFZpZXcsIGdldFJlbmRlcmVyKCksXG4gICAgICAgIGhvc3ROb2RlLmRhdGFbUVVFUklFU10pO1xuICB9XG4gIHJldHVybiBkaS50ZW1wbGF0ZVJlZjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU/OiBUeXBlPFQ+KSA9PiBUKXxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWY8VD4odHlwZUFueSkgfHwgZ2V0RGlyZWN0aXZlRGVmPFQ+KHR5cGVBbnkpIHx8XG4gICAgICBnZXRQaXBlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdGFibGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gIGlmICghZGVmIHx8IGRlZi5mYWN0b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGVmLmZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmhlcml0ZWRGYWN0b3J5PFQ+KHR5cGU6IFR5cGU8YW55Pik6ICh0eXBlOiBUeXBlPFQ+KSA9PiBUIHtcbiAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yIGFzIFR5cGU8YW55PjtcbiAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlPZjxUPihwcm90byk7XG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiAodCkgPT4gbmV3IHQoKTtcbiAgfVxufVxuXG5jbGFzcyBUZW1wbGF0ZVJlZjxUPiBleHRlbmRzIHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8VD4ge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2RlY2xhcmF0aW9uUGFyZW50VmlldzogTFZpZXdEYXRhLCByZWFkb25seSBlbGVtZW50UmVmOiB2aWV3RW5naW5lX0VsZW1lbnRSZWYsXG4gICAgICBwcml2YXRlIF90VmlldzogVFZpZXcsIHByaXZhdGUgX3JlbmRlcmVyOiBSZW5kZXJlcjMsIHByaXZhdGUgX3F1ZXJpZXM6IExRdWVyaWVzfG51bGwpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgY3JlYXRlRW1iZWRkZWRWaWV3KGNvbnRleHQ6IFQsIGNvbnRhaW5lck5vZGU/OiBMQ29udGFpbmVyTm9kZSwgaW5kZXg/OiBudW1iZXIpOlxuICAgICAgdmlld0VuZ2luZV9FbWJlZGRlZFZpZXdSZWY8VD4ge1xuICAgIGNvbnN0IHZpZXdOb2RlID0gY3JlYXRlRW1iZWRkZWRWaWV3Tm9kZShcbiAgICAgICAgdGhpcy5fdFZpZXcsIGNvbnRleHQsIHRoaXMuX2RlY2xhcmF0aW9uUGFyZW50VmlldywgdGhpcy5fcmVuZGVyZXIsIHRoaXMuX3F1ZXJpZXMpO1xuICAgIGlmIChjb250YWluZXJOb2RlKSB7XG4gICAgICBpbnNlcnRWaWV3KGNvbnRhaW5lck5vZGUsIHZpZXdOb2RlLCBpbmRleCAhKTtcbiAgICB9XG4gICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSh2aWV3Tm9kZSwgdGhpcy5fdFZpZXcsIGNvbnRleHQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKHZpZXdOb2RlLmRhdGEsIGNvbnRleHQpO1xuICAgIHZpZXdSZWYuX2xWaWV3Tm9kZSA9IHZpZXdOb2RlO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG59XG5cbi8qKlxuICogUmV0cmlldmVzIGBUZW1wbGF0ZVJlZmAgaW5zdGFuY2UgZnJvbSBgSW5qZWN0b3JgIHdoZW4gYSBsb2NhbCByZWZlcmVuY2UgaXMgcGxhY2VkIG9uIHRoZVxuICogYDxuZy10ZW1wbGF0ZT5gIGVsZW1lbnQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0ZW1wbGF0ZVJlZkV4dHJhY3RvcihsTm9kZTogTE5vZGVXaXRoTG9jYWxSZWZzKSB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShsTm9kZSkpO1xufVxuIl19