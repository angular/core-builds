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
import { assertLessThan, assertNotNull } from './assert';
import { addToViewTree, assertPreviousIsParent, createLContainer, createLNodeObject, getDirectiveInstance, getPreviousOrParentNode, getRenderer, isComponent, renderEmbeddedTemplate } from './instructions';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { insertView, removeView } from './node_manipulation';
import { notImplemented, stringify } from './util';
import { EmbeddedViewRef, addDestroyable, createViewRef } from './view_ref';
/**
 * If a directive is diPublic, bloomAdd sets a property on the instance with this constant as
 * the key and the directive's unique ID as the value. This allows us to map directives to their
 * bloom filter bit for DI.
 */
var /** @type {?} */ NG_ELEMENT_ID = '__NG_ELEMENT_ID__';
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
var /** @type {?} */ BLOOM_SIZE = 256;
/**
 * Counter used to generate unique IDs for directives.
 */
var /** @type {?} */ nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param {?} injector The node injector in which the directive should be registered
 * @param {?} type The directive to register
 * @return {?}
 */
export function bloomAdd(injector, type) {
    var /** @type {?} */ id = (/** @type {?} */ (type))[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = (/** @type {?} */ (type))[NG_ELEMENT_ID] = nextNgElementId++;
    }
    // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
    // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
    // This means that after 255, some directives will share slots, leading to some false positives
    // when checking for a directive's presence.
    var /** @type {?} */ bloomBit = id % BLOOM_SIZE;
    // Create a mask that targets the specific bit associated with the directive.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var /** @type {?} */ mask = 1 << bloomBit;
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
    var /** @type {?} */ nodeInjector = node.nodeInjector;
    var /** @type {?} */ parentInjector = node.parent && node.parent.nodeInjector;
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
        injector: null,
        templateRef: null,
        viewContainerRef: null,
        elementRef: null,
        changeDetectorRef: null
    };
}
/** @enum {number} */
var InjectFlags = {
    /** Dependency is not required. Null will be injected if there is no provider for the dependency.
         */
    Optional: 1,
    /** When resolving a dependency, include the node that is requesting injection. */
    CheckSelf: 2,
    /** When resolving a dependency, include ancestors of the node requesting injection. */
    CheckParent: 4,
    /** Default injection options: required, checks both self and ancestors. */
    Default: 6,
};
export { InjectFlags };
/**
 * Constructs an injection error with the given text and token.
 *
 * @param {?} text The text of the error
 * @param {?} token The token associated with the error
 * @return {?} The error that was created
 */
function createInjectionError(text, token) {
    return new Error("ElementInjector: " + text + " [" + stringify(token) + "]");
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
 * Searches for an instance of the given type up the injector tree and returns
 * that instance if found.
 *
 * If not found, it will propagate up to the next parent injector until the token
 * is found or the top is reached.
 *
 * Usage example (in factory function):
 *
 * class SomeDirective {
 *   constructor(directive: DirectiveA) {}
 *
 *   static ngDirectiveDef = defineDirective({
 *     type: SomeDirective,
 *     factory: () => new SomeDirective(directiveInject(DirectiveA))
 *   });
 * }
 *
 * NOTE: use `directiveInject` with `\@Directive`, `\@Component`, and `\@Pipe`. For
 * all other injection use `inject` which does not walk the DOM render tree.
 *
 * @template T
 * @param {?} token The directive type to search for
 * @param {?=} flags Injection flags (e.g. CheckParent)
 * @param {?=} defaultValue
 * @return {?} The instance found
 */
export function directiveInject(token, flags, defaultValue) {
    return getOrCreateInjectable(getOrCreateNodeInjector(), token, flags, defaultValue);
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
    var /** @type {?} */ lElement = /** @type {?} */ (getPreviousOrParentNode());
    ngDevMode && assertNodeType(lElement, 3 /* Element */);
    var /** @type {?} */ tElement = /** @type {?} */ ((lElement.tNode));
    ngDevMode && assertNotNull(tElement, 'expecting tNode');
    var /** @type {?} */ attrs = tElement.attrs;
    if (attrs) {
        for (var /** @type {?} */ i = 0; i < attrs.length; i = i + 2) {
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
    var /** @type {?} */ currentNode = di.node;
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
    var /** @type {?} */ hostNode = getClosestComponentAncestor(currentNode);
    var /** @type {?} */ hostInjector = hostNode.nodeInjector;
    var /** @type {?} */ existingRef = hostInjector && hostInjector.changeDetectorRef;
    return existingRef ?
        existingRef :
        createViewRef(/** @type {?} */ (hostNode.data), /** @type {?} */ ((hostNode.view.directives))[/** @type {?} */ ((hostNode.tNode)).flags >> 13 /* INDX_SHIFT */]);
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
 * @param {?=} defaultValue
 * @return {?} The instance found
 */
export function getOrCreateInjectable(di, token, flags, defaultValue) {
    var /** @type {?} */ bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic). If there is no hash, fall back to the module injector.
    if (bloomHash === null) {
        var /** @type {?} */ moduleInjector = di.injector;
        if (!moduleInjector) {
            if (defaultValue != null) {
                return defaultValue;
            }
            throw createInjectionError('NotFound', token);
        }
        moduleInjector.get(token);
    }
    else {
        var /** @type {?} */ injector = di;
        while (injector) {
            // Get the closest potential matching injector (upwards in the injector tree) that
            // *potentially* has the token.
            injector = bloomFindPossibleInjector(injector, bloomHash);
            // If no injector is found, we *know* that there is no ancestor injector that contains the
            // token, so we abort.
            if (!injector) {
                break;
            }
            // At this point, we have an injector which *may* contain the token, so we step through the
            // directives associated with the injector's corresponding node to get the directive instance.
            var /** @type {?} */ node = injector.node;
            // The size of the node's directive's list is stored in certain bits of the node's flags,
            // so exact it with a mask and shift it back such that the bits reflect the real value.
            var /** @type {?} */ flags_1 = /** @type {?} */ ((node.tNode)).flags;
            var /** @type {?} */ size = (flags_1 & 8190 /* SIZE_MASK */) >> 1 /* SIZE_SHIFT */;
            if (size !== 0) {
                // The start index of the directives list is also part of the node's flags, but there is
                // nothing to the "left" of it so it doesn't need a mask.
                var /** @type {?} */ start = flags_1 >> 13 /* INDX_SHIFT */;
                var /** @type {?} */ defs = /** @type {?} */ ((node.view.tView.directives));
                for (var /** @type {?} */ i = start, /** @type {?} */ ii = start + size; i < ii; i++) {
                    // Get the definition for the directive at this index and, if it is injectable (diPublic),
                    // and matches the given token, return the directive instance.
                    var /** @type {?} */ directiveDef = /** @type {?} */ (defs[i]);
                    if (directiveDef.diPublic && directiveDef.type == token) {
                        return getDirectiveInstance(/** @type {?} */ ((node.view.directives))[i]);
                    }
                }
            }
            // If we *didn't* find the directive for the token from the candidate injector, we had a false
            // positive. Traverse up the tree and continue.
            injector = injector.parent;
        }
    }
    // No directive was found for the given token.
    // TODO: implement optional, check-self, and check-parent.
    throw createInjectionError('Not found', token);
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
    var /** @type {?} */ id = (/** @type {?} */ (type))[NG_ELEMENT_ID];
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
 * @return {?} An injector that might have the directive
 */
export function bloomFindPossibleInjector(startInjector, bloomBit) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var /** @type {?} */ mask = 1 << bloomBit;
    // Traverse up the injector tree until we find a potential match or until we know there *isn't* a
    // match.
    var /** @type {?} */ injector = startInjector;
    while (injector) {
        // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
        // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
        // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
        var /** @type {?} */ value = void 0;
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
 * @template T
 */
var /**
 * @template T
 */
ReadFromInjectorFn = /** @class */ (function () {
    function ReadFromInjectorFn(read) {
        this.read = read;
    }
    return ReadFromInjectorFn;
}());
/**
 * @template T
 */
export { ReadFromInjectorFn };
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
export var /** @type {?} */ QUERY_READ_TEMPLATE_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn(function (injector) { return getOrCreateTemplateRef(injector); }))));
export var /** @type {?} */ QUERY_READ_CONTAINER_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn(function (injector) { return getOrCreateContainerRef(injector); }))));
export var /** @type {?} */ QUERY_READ_ELEMENT_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn(function (injector) { return getOrCreateElementRef(injector); }))));
export var /** @type {?} */ QUERY_READ_FROM_NODE = (/** @type {?} */ ((new ReadFromInjectorFn(function (injector, node, directiveIdx) {
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
var /**
 * A ref to a node's native element.
 */
ElementRef = /** @class */ (function () {
    function ElementRef(nativeElement) {
        this.nativeElement = nativeElement;
    }
    return ElementRef;
}());
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
        var /** @type {?} */ vcRefHost = di.node;
        ngDevMode && assertNodeOfPossibleTypes(vcRefHost, 0 /* Container */, 3 /* Element */);
        var /** @type {?} */ lContainer = createLContainer(/** @type {?} */ ((vcRefHost.parent)), vcRefHost.view, undefined, vcRefHost);
        var /** @type {?} */ lContainerNode = createLNodeObject(0 /* Container */, vcRefHost.view, /** @type {?} */ ((vcRefHost.parent)), undefined, lContainer, null);
        addToViewTree(vcRefHost.view, lContainer);
        di.viewContainerRef = new ViewContainerRef(lContainerNode);
    }
    return di.viewContainerRef;
}
/**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
var /**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
ViewContainerRef = /** @class */ (function () {
    function ViewContainerRef(_lContainerNode) {
        this._lContainerNode = _lContainerNode;
        this._viewRefs = [];
    }
    /**
     * @return {?}
     */
    ViewContainerRef.prototype.clear = /**
     * @return {?}
     */
    function () {
        var /** @type {?} */ lContainer = this._lContainerNode.data;
        while (lContainer.views.length) {
            this.remove(0);
        }
    };
    /**
     * @param {?} index
     * @return {?}
     */
    ViewContainerRef.prototype.get = /**
     * @param {?} index
     * @return {?}
     */
    function (index) { return this._viewRefs[index] || null; };
    Object.defineProperty(ViewContainerRef.prototype, "length", {
        get: /**
         * @return {?}
         */
        function () {
            var /** @type {?} */ lContainer = this._lContainerNode.data;
            return lContainer.views.length;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.createEmbeddedView = /**
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    function (templateRef, context, index) {
        var /** @type {?} */ viewRef = templateRef.createEmbeddedView(context || /** @type {?} */ ({}));
        this.insert(viewRef, index);
        return viewRef;
    };
    /**
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModule
     * @return {?}
     */
    ViewContainerRef.prototype.createComponent = /**
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModule
     * @return {?}
     */
    function (componentFactory, index, injector, projectableNodes, ngModule) {
        throw notImplemented();
    };
    /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.insert = /**
     * @param {?} viewRef
     * @param {?=} index
     * @return {?}
     */
    function (viewRef, index) {
        var /** @type {?} */ lViewNode = (/** @type {?} */ (viewRef))._lViewNode;
        var /** @type {?} */ adjustedIdx = this._adjustAndAssertIndex(index);
        insertView(this._lContainerNode, lViewNode, adjustedIdx);
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
    };
    /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    ViewContainerRef.prototype.move = /**
     * @param {?} viewRef
     * @param {?} currentIndex
     * @return {?}
     */
    function (viewRef, currentIndex) {
        throw notImplemented();
    };
    /**
     * @param {?} viewRef
     * @return {?}
     */
    ViewContainerRef.prototype.indexOf = /**
     * @param {?} viewRef
     * @return {?}
     */
    function (viewRef) { throw notImplemented(); };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.remove = /**
     * @param {?=} index
     * @return {?}
     */
    function (index) {
        var /** @type {?} */ adjustedIdx = this._adjustAndAssertIndex(index);
        removeView(this._lContainerNode, adjustedIdx);
        this._viewRefs.splice(adjustedIdx, 1);
    };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype.detach = /**
     * @param {?=} index
     * @return {?}
     */
    function (index) { throw notImplemented(); };
    /**
     * @param {?=} index
     * @return {?}
     */
    ViewContainerRef.prototype._adjustAndAssertIndex = /**
     * @param {?=} index
     * @return {?}
     */
    function (index) {
        if (index == null) {
            index = this._lContainerNode.data.views.length;
        }
        else {
            // +1 because it's legal to insert at the end.
            ngDevMode && assertLessThan(index, this._lContainerNode.data.views.length + 1, 'index');
        }
        return index;
    };
    return ViewContainerRef;
}());
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
    ngDevMode && assertNodeType(di.node, 0 /* Container */);
    var /** @type {?} */ data = (/** @type {?} */ (di.node)).data;
    return di.templateRef || (di.templateRef = new TemplateRef(getOrCreateElementRef(di), /** @type {?} */ ((data.template)), getRenderer()));
}
/**
 * @template T
 */
var /**
 * @template T
 */
TemplateRef = /** @class */ (function () {
    function TemplateRef(elementRef, template, _renderer) {
        this._renderer = _renderer;
        this.elementRef = elementRef;
        this._template = template;
    }
    /**
     * @param {?} context
     * @return {?}
     */
    TemplateRef.prototype.createEmbeddedView = /**
     * @param {?} context
     * @return {?}
     */
    function (context) {
        var /** @type {?} */ viewNode = renderEmbeddedTemplate(null, this._template, context, this._renderer);
        return addDestroyable(new EmbeddedViewRef(viewNode, this._template, context));
    };
    return TemplateRef;
}());
function TemplateRef_tsickle_Closure_declarations() {
    /** @type {?} */
    TemplateRef.prototype.elementRef;
    /** @type {?} */
    TemplateRef.prototype._template;
    /** @type {?} */
    TemplateRef.prototype._renderer;
}
//# sourceMappingURL=di.js.map