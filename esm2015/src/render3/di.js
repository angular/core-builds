/**
 * @fileoverview added by tsickle
 * @suppress {checkTypes,extraRequire,uselessCode} checked by tsc
 */
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
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
import { _getViewData, addToViewTree, assertPreviousIsParent, createEmbeddedViewAndNode, createLContainer, createLNodeObject, createTNode, getPreviousOrParentNode, getPreviousOrParentTNode, getRenderer, renderEmbeddedTemplate, resolveDirective } from './instructions';
import { RENDER_PARENT, VIEWS } from './interfaces/container';
import { isProceduralRenderer } from './interfaces/renderer';
import { CONTEXT, DIRECTIVES, HOST_NODE, INJECTOR, QUERIES, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes, assertNodeType } from './node_assert';
import { addRemoveViewFromContainer, appendChild, detachView, findComponentView, getBeforeNodeForView, getHostElementNode, getParentLNode, getParentOrContainerNode, getRenderParent, insertView, removeView } from './node_manipulation';
import { getLNode, isComponent } from './util';
import { ViewRef } from './view_ref';
/** *
 * If a directive is diPublic, bloomAdd sets a property on the type with this constant as
 * the key and the directive's unique ID as the value. This allows us to map directives to their
 * bloom filter bit for DI.
  @type {?} */
const NG_ELEMENT_ID = '__NG_ELEMENT_ID__';
/** *
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
  @type {?} */
const BLOOM_SIZE = 256;
/** @type {?} */
const BLOOM_MASK = BLOOM_SIZE - 1;
/** *
 * Counter used to generate unique IDs for directives.
  @type {?} */
let nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param {?} injector The node injector in which the directive should be registered
 * @param {?} type The directive to register
 * @return {?}
 */
export function bloomAdd(injector, type) {
    /** @type {?} */
    let id = (/** @type {?} */ (type))[NG_ELEMENT_ID];
    // Set a unique ID on the directive type, so if something tries to inject the directive,
    // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
    if (id == null) {
        id = (/** @type {?} */ (type))[NG_ELEMENT_ID] = nextNgElementId++;
    }
    /** @type {?} */
    const bloomBit = id & BLOOM_MASK;
    /** @type {?} */
    const mask = 1 << bloomBit;
    /** @type {?} */
    const b7 = bloomBit & 0x80;
    /** @type {?} */
    const b6 = bloomBit & 0x40;
    /** @type {?} */
    const b5 = bloomBit & 0x20;
    if (b7) {
        b6 ? (b5 ? (injector.bf7 |= mask) : (injector.bf6 |= mask)) :
            (b5 ? (injector.bf5 |= mask) : (injector.bf4 |= mask));
    }
    else {
        b6 ? (b5 ? (injector.bf3 |= mask) : (injector.bf2 |= mask)) :
            (b5 ? (injector.bf1 |= mask) : (injector.bf0 |= mask));
    }
}
/**
 * @return {?}
 */
export function getOrCreateNodeInjector() {
    ngDevMode && assertPreviousIsParent();
    return getOrCreateNodeInjectorForNode(/** @type {?} */ (getPreviousOrParentNode()), /** @type {?} */ (getPreviousOrParentTNode()), _getViewData());
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param {?} node for which an injector should be retrieved / created.
 * @param {?} tNode for which an injector should be retrieved / created.
 * @param {?} hostView View where the node is stored
 * @return {?} Node injector
 */
export function getOrCreateNodeInjectorForNode(node, tNode, hostView) {
    /** @type {?} */
    const nodeInjector = node.nodeInjector;
    /** @type {?} */
    const parentLNode = getParentOrContainerNode(tNode, hostView);
    /** @type {?} */
    const parentInjector = parentLNode && parentLNode.nodeInjector;
    if (nodeInjector != parentInjector) {
        return /** @type {?} */ ((nodeInjector));
    }
    return node.nodeInjector = {
        parent: parentInjector,
        tNode: tNode,
        view: hostView,
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
 * Creates a ComponentFactoryResolver and stores it on the injector. Or, if the
 * ComponentFactoryResolver
 * already exists, retrieves the existing ComponentFactoryResolver.
 *
 * @return {?} The ComponentFactoryResolver instance to use
 */
export function injectComponentFactoryResolver() {
    return componentFactoryResolver;
}
/** @type {?} */
const componentFactoryResolver = new ComponentFactoryResolver();
/**
 * @return {?}
 */
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
    /** @type {?} */
    const tNode = getPreviousOrParentTNode();
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    /** @type {?} */
    const attrs = tNode.attrs;
    if (attrs) {
        for (let i = 0; i < attrs.length; i = i + 2) {
            /** @type {?} */
            const attrName = attrs[i];
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
    /** @type {?} */
    const currentTNode = di.tNode;
    if (isComponent(currentTNode)) {
        return di.changeDetectorRef =
            new ViewRef(/** @type {?} */ (getLNode(currentTNode, di.view).data), context);
    }
    else if (currentTNode.type === 3 /* Element */) {
        return di.changeDetectorRef = getOrCreateHostChangeDetector(di.view);
    }
    return /** @type {?} */ ((null));
}
/**
 * Gets or creates ChangeDetectorRef for the closest host component
 * @param {?} currentView
 * @return {?}
 */
function getOrCreateHostChangeDetector(currentView) {
    /** @type {?} */
    const hostComponentView = findComponentView(currentView);
    /** @type {?} */
    const hostNode = /** @type {?} */ ((getHostElementNode(hostComponentView)));
    /** @type {?} */
    const hostInjector = hostNode.nodeInjector;
    /** @type {?} */
    const existingRef = hostInjector && hostInjector.changeDetectorRef;
    return existingRef ? existingRef : new ViewRef(hostComponentView, hostComponentView[CONTEXT]);
}
/**
 * @param {?} di
 * @return {?}
 */
function getOrCreateRenderer2(di) {
    /** @type {?} */
    const renderer = di.view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return /** @type {?} */ (renderer);
    }
    else {
        throw new Error('Cannot inject Renderer2 when the application uses Renderer3!');
    }
}
/**
 * Returns the value associated to the given token from the injectors.
 *
 * Look for the injector providing the token by walking up the node injector tree and then
 * the module injector tree.
 *
 * @template T
 * @param {?} nodeInjector Node injector where the search should start
 * @param {?} token The token to look for
 * @param {?=} flags Injection flags
 * @return {?} the value from the injector or `null` when not found
 */
export function getOrCreateInjectable(nodeInjector, token, flags = 0 /* Default */) {
    /** @type {?} */
    const bloomHash = bloomHashBit(token);
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash !== null) {
        /** @type {?} */
        let injector = nodeInjector;
        while (injector) {
            // Get the closest potential matching injector (upwards in the injector tree) that
            // *potentially* has the token.
            injector = bloomFindPossibleInjector(injector, bloomHash, flags);
            // If no injector is found, we *know* that there is no ancestor injector that contains the
            // token, so we abort.
            if (!injector) {
                break;
            }
            /** @type {?} */
            const tNode = injector.tNode;
            /** @type {?} */
            const injectorView = injector.view;
            /** @type {?} */
            const nodeFlags = tNode.flags;
            /** @type {?} */
            const count = nodeFlags & 4095 /* DirectiveCountMask */;
            if (count !== 0) {
                /** @type {?} */
                const start = nodeFlags >> 15 /* DirectiveStartingIndexShift */;
                /** @type {?} */
                const end = start + count;
                /** @type {?} */
                const defs = /** @type {?} */ ((injectorView[TVIEW].directives));
                for (let i = start; i < end; i++) {
                    /** @type {?} */
                    const directiveDef = /** @type {?} */ (defs[i]);
                    if (directiveDef.type === token && directiveDef.diPublic) {
                        return /** @type {?} */ ((injectorView[DIRECTIVES]))[i];
                    }
                }
            }
            /** @type {?} */
            let instance;
            if (injector === nodeInjector &&
                (instance = searchMatchesQueuedForCreation(token, injectorView[TVIEW]))) {
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
    /** @type {?} */
    const moduleInjector = nodeInjector.view[INJECTOR];
    /** @type {?} */
    const formerInjector = setCurrentInjector(moduleInjector);
    try {
        return inject(token, flags);
    }
    finally {
        setCurrentInjector(formerInjector);
    }
}
/**
 * @template T
 * @param {?} token
 * @param {?} hostTView
 * @return {?}
 */
function searchMatchesQueuedForCreation(token, hostTView) {
    /** @type {?} */
    const matches = hostTView.currentMatches;
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            /** @type {?} */
            const def = /** @type {?} */ (matches[i]);
            if (def.type === token) {
                return resolveDirective(def, i + 1, matches, hostTView);
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
 * @param {?} token the injection token
 * @return {?} the matching bit to check in the bloom filter or `null` if the token is not known.
 */
function bloomHashBit(token) {
    /** @type {?} */
    let id = (/** @type {?} */ (token))[NG_ELEMENT_ID];
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
 * @param {?} startInjector
 * @param {?} bloomBit The bit to check in each injector's bloom filter
 * @param {?} flags The injection flags for this injection site (e.g. Optional or SkipSelf)
 * @return {?} An injector that might have the directive
 */
export function bloomFindPossibleInjector(startInjector, bloomBit, flags) {
    /** @type {?} */
    const mask = 1 << bloomBit;
    /** @type {?} */
    const b7 = bloomBit & 0x80;
    /** @type {?} */
    const b6 = bloomBit & 0x40;
    /** @type {?} */
    const b5 = bloomBit & 0x20;
    /** @type {?} */
    let injector = flags & 4 /* SkipSelf */ ? startInjector.parent : startInjector;
    while (injector) {
        /** @type {?} */
        let value;
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
 * This is necessary to support \@Host() decorators. If \@Host() is set, we should stop searching once
 * the injector and its parent view don't match because it means we'd cross the view boundary.
 * @param {?} injector
 * @return {?}
 */
function sameHostView(injector) {
    return !!injector.parent && injector.parent.view === injector.view;
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
if (false) {
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
    return di.elementRef || (di.elementRef = new ElementRef(getLNode(di.tNode, di.view).native));
}
/** @type {?} */
export const QUERY_READ_TEMPLATE_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateTemplateRef(injector)))));
/** @type {?} */
export const QUERY_READ_CONTAINER_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateContainerRef(injector)))));
/** @type {?} */
export const QUERY_READ_ELEMENT_REF = /** @type {?} */ ((/** @type {?} */ (new ReadFromInjectorFn((injector) => getOrCreateElementRef(injector)))));
/** @type {?} */
export const QUERY_READ_FROM_NODE = (/** @type {?} */ ((new ReadFromInjectorFn((injector, tNode, directiveIdx) => {
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    if (directiveIdx > -1) {
        return /** @type {?} */ ((injector.view[DIRECTIVES]))[directiveIdx];
    }
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        return getOrCreateElementRef(injector);
    }
    if (tNode.type === 0 /* Container */) {
        return getOrCreateTemplateRef(injector);
    }
    if (ngDevMode) {
        // should never happen
        throw new Error(`Unexpected node type: ${tNode.type}`);
    }
}))));
/**
 * A ref to a node's native element.
 */
class ElementRef extends viewEngine_ElementRef {
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
        /** @type {?} */
        const hostLNode = /** @type {?} */ (getPreviousOrParentNode());
        /** @type {?} */
        const hostTNode = /** @type {?} */ (getPreviousOrParentTNode());
        ngDevMode && assertNodeOfPossibleTypes(hostTNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
        /** @type {?} */
        const hostView = di.view;
        /** @type {?} */
        const lContainer = createLContainer(hostView, true);
        /** @type {?} */
        const comment = hostView[RENDERER].createComment(ngDevMode ? 'container' : '');
        /** @type {?} */
        const lContainerNode = createLNodeObject(0 /* Container */, hostLNode.nodeInjector, comment, lContainer);
        lContainer[RENDER_PARENT] = getRenderParent(hostTNode, hostView);
        appendChild(comment, hostTNode, hostView);
        if (!hostTNode.dynamicContainerNode) {
            hostTNode.dynamicContainerNode =
                createTNode(0 /* Container */, -1, null, null, hostTNode, null);
        }
        hostLNode.dynamicLContainerNode = lContainerNode;
        addToViewTree(hostView, /** @type {?} */ (hostTNode.index), lContainer);
        di.viewContainerRef = new ViewContainerRef(lContainer, /** @type {?} */ (hostTNode.dynamicContainerNode), hostTNode, hostView);
    }
    return di.viewContainerRef;
}
export class NodeInjector {
    /**
     * @param {?} _lInjector
     */
    constructor(_lInjector) {
        this._lInjector = _lInjector;
    }
    /**
     * @param {?} token
     * @return {?}
     */
    get(token) {
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
    }
}
if (false) {
    /** @type {?} */
    NodeInjector.prototype._lInjector;
}
/**
 * A ref to a container that enables adding and removing views from that container
 * imperatively.
 */
class ViewContainerRef extends viewEngine_ViewContainerRef {
    /**
     * @param {?} _lContainer
     * @param {?} _tContainerNode
     * @param {?} _hostTNode
     * @param {?} _hostView
     */
    constructor(_lContainer, _tContainerNode, _hostTNode, _hostView) {
        super();
        this._lContainer = _lContainer;
        this._tContainerNode = _tContainerNode;
        this._hostTNode = _hostTNode;
        this._hostView = _hostView;
        this._viewRefs = [];
    }
    /**
     * @return {?}
     */
    get element() {
        /** @type {?} */
        const injector = getOrCreateNodeInjectorForNode(this._getHostNode(), this._hostTNode, this._hostView);
        return getOrCreateElementRef(injector);
    }
    /**
     * @return {?}
     */
    get injector() {
        /** @type {?} */
        const injector = getOrCreateNodeInjectorForNode(this._getHostNode(), this._hostTNode, this._hostView);
        return new NodeInjector(injector);
    }
    /**
     * @deprecated No replacement
     * @return {?}
     */
    get parentInjector() {
        /** @type {?} */
        const parentLInjector = /** @type {?} */ ((getParentLNode(this._hostTNode, this._hostView))).nodeInjector;
        return parentLInjector ? new NodeInjector(parentLInjector) : new NullInjector();
    }
    /**
     * @return {?}
     */
    clear() {
        while (this._lContainer[VIEWS].length) {
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
    get length() { return this._lContainer[VIEWS].length; }
    /**
     * @template C
     * @param {?} templateRef
     * @param {?=} context
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(templateRef, context, index) {
        /** @type {?} */
        const adjustedIdx = this._adjustIndex(index);
        /** @type {?} */
        const viewRef = (/** @type {?} */ (templateRef))
            .createEmbeddedView(context || /** @type {?} */ ({}), this._lContainer, this._tContainerNode, this._hostView, adjustedIdx);
        (/** @type {?} */ (viewRef)).attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    }
    /**
     * @template C
     * @param {?} componentFactory
     * @param {?=} index
     * @param {?=} injector
     * @param {?=} projectableNodes
     * @param {?=} ngModuleRef
     * @return {?}
     */
    createComponent(componentFactory, index, injector, projectableNodes, ngModuleRef) {
        /** @type {?} */
        const contextInjector = injector || this.parentInjector;
        if (!ngModuleRef && contextInjector) {
            ngModuleRef = contextInjector.get(viewEngine_NgModuleRef, null);
        }
        /** @type {?} */
        const componentRef = componentFactory.create(contextInjector, projectableNodes, undefined, ngModuleRef);
        this.insert(componentRef.hostView, index);
        return componentRef;
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
        /** @type {?} */
        const lView = /** @type {?} */ (((/** @type {?} */ (viewRef))._view));
        /** @type {?} */
        const adjustedIdx = this._adjustIndex(index);
        insertView(lView, this._lContainer, this._hostView, adjustedIdx, /** @type {?} */ ((this._tContainerNode.parent)).index);
        /** @type {?} */
        const container = /** @type {?} */ ((this._getHostNode().dynamicLContainerNode));
        /** @type {?} */
        const beforeNode = getBeforeNodeForView(adjustedIdx, this._lContainer[VIEWS], container);
        addRemoveViewFromContainer(lView, true, beforeNode);
        (/** @type {?} */ (viewRef)).attachToViewContainerRef(this);
        this._viewRefs.splice(adjustedIdx, 0, viewRef);
        return viewRef;
    }
    /**
     * @param {?} viewRef
     * @param {?} newIndex
     * @return {?}
     */
    move(viewRef, newIndex) {
        /** @type {?} */
        const index = this.indexOf(viewRef);
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
        /** @type {?} */
        const adjustedIdx = this._adjustIndex(index, -1);
        removeView(this._lContainer, /** @type {?} */ (this._tContainerNode), adjustedIdx);
        this._viewRefs.splice(adjustedIdx, 1);
    }
    /**
     * @param {?=} index
     * @return {?}
     */
    detach(index) {
        /** @type {?} */
        const adjustedIdx = this._adjustIndex(index, -1);
        detachView(this._lContainer, adjustedIdx, !!this._tContainerNode.detached);
        return this._viewRefs.splice(adjustedIdx, 1)[0] || null;
    }
    /**
     * @param {?=} index
     * @param {?=} shift
     * @return {?}
     */
    _adjustIndex(index, shift = 0) {
        if (index == null) {
            return this._lContainer[VIEWS].length + shift;
        }
        if (ngDevMode) {
            assertGreaterThan(index, -1, 'index must be positive');
            // +1 because it's legal to insert at the end.
            assertLessThan(index, this._lContainer[VIEWS].length + 1 + shift, 'index');
        }
        return index;
    }
    /**
     * @return {?}
     */
    _getHostNode() { return getLNode(this._hostTNode, this._hostView); }
}
if (false) {
    /** @type {?} */
    ViewContainerRef.prototype._viewRefs;
    /** @type {?} */
    ViewContainerRef.prototype._lContainer;
    /** @type {?} */
    ViewContainerRef.prototype._tContainerNode;
    /** @type {?} */
    ViewContainerRef.prototype._hostTNode;
    /** @type {?} */
    ViewContainerRef.prototype._hostView;
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
        /** @type {?} */
        const hostNode = /** @type {?} */ (getPreviousOrParentNode());
        /** @type {?} */
        const hostTNode = /** @type {?} */ (getPreviousOrParentTNode());
        ngDevMode && assertNodeType(hostTNode, 0 /* Container */);
        ngDevMode && assertDefined(hostTNode.tViews, 'TView must be allocated');
        di.templateRef = new TemplateRef(di.view, getOrCreateElementRef(di), /** @type {?} */ (hostTNode.tViews), getRenderer(), /** @type {?} */ ((hostNode.data))[QUERIES]);
    }
    return di.templateRef;
}
/**
 * @template T
 * @param {?} type
 * @return {?}
 */
export function getFactoryOf(type) {
    /** @type {?} */
    const typeAny = /** @type {?} */ (type);
    /** @type {?} */
    const def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
        getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
/**
 * @template T
 * @param {?} type
 * @return {?}
 */
export function getInheritedFactory(type) {
    /** @type {?} */
    const proto = /** @type {?} */ (Object.getPrototypeOf(type.prototype).constructor);
    /** @type {?} */
    const factory = getFactoryOf(proto);
    if (factory !== null) {
        return factory;
    }
    else {
        // There is no factory defined. Either this was improper usage of inheritance
        // (no Angular decorator on the superclass) or there is no constructor at all
        // in the inheritance chain. Since the two cases cannot be distinguished, the
        // latter has to be assumed.
        return (t) => new t();
    }
}
/**
 * @template T
 */
class TemplateRef extends viewEngine_TemplateRef {
    /**
     * @param {?} _declarationParentView
     * @param {?} elementRef
     * @param {?} _tView
     * @param {?} _renderer
     * @param {?} _queries
     */
    constructor(_declarationParentView, elementRef, _tView, _renderer, _queries) {
        super();
        this._declarationParentView = _declarationParentView;
        this.elementRef = elementRef;
        this._tView = _tView;
        this._renderer = _renderer;
        this._queries = _queries;
    }
    /**
     * @param {?} context
     * @param {?=} container
     * @param {?=} tContainerNode
     * @param {?=} hostView
     * @param {?=} index
     * @return {?}
     */
    createEmbeddedView(context, container, tContainerNode, hostView, index) {
        /** @type {?} */
        const lView = createEmbeddedViewAndNode(this._tView, context, this._declarationParentView, this._renderer, this._queries);
        if (container) {
            insertView(lView, container, /** @type {?} */ ((hostView)), /** @type {?} */ ((index)), /** @type {?} */ ((/** @type {?} */ ((tContainerNode)).parent)).index);
        }
        renderEmbeddedTemplate(lView, this._tView, context, 1 /* Create */);
        /** @type {?} */
        const viewRef = new ViewRef(lView, context);
        viewRef._tViewNode = /** @type {?} */ (lView[HOST_NODE]);
        return viewRef;
    }
}
if (false) {
    /** @type {?} */
    TemplateRef.prototype._declarationParentView;
    /** @type {?} */
    TemplateRef.prototype.elementRef;
    /** @type {?} */
    TemplateRef.prototype._tView;
    /** @type {?} */
    TemplateRef.prototype._renderer;
    /** @type {?} */
    TemplateRef.prototype._queries;
}
/**
 * Retrieves `TemplateRef` instance from `Injector` when a local reference is placed on the
 * `<ng-template>` element.
 * @param {?} tNode
 * @param {?} currentView
 * @return {?}
 */
export function templateRefExtractor(tNode, currentView) {
    /** @type {?} */
    const lNode = /** @type {?} */ (getLNode(tNode, currentView));
    return getOrCreateTemplateRef(getOrCreateNodeInjectorForNode(lNode, tNode, currentView));
}

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUFDLGlCQUFpQixJQUFJLDRCQUE0QixFQUFDLE1BQU0seUNBQXlDLENBQUM7QUFDMUcsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXdCLFlBQVksRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUcvRixPQUFPLEVBQUMsVUFBVSxJQUFJLHFCQUFxQixFQUFDLE1BQU0sdUJBQXVCLENBQUM7QUFDMUUsT0FBTyxFQUFDLFdBQVcsSUFBSSxzQkFBc0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQ2xGLE9BQU8sRUFBQyxXQUFXLElBQUksc0JBQXNCLEVBQUMsTUFBTSx3QkFBd0IsQ0FBQztBQUM3RSxPQUFPLEVBQUMsZ0JBQWdCLElBQUksMkJBQTJCLEVBQUMsTUFBTSw4QkFBOEIsQ0FBQztBQUU3RixPQUFPLEVBQUMsU0FBUyxFQUFDLE1BQU0sV0FBVyxDQUFDO0FBR3BDLE9BQU8sRUFBQyxhQUFhLEVBQUUsaUJBQWlCLEVBQUUsY0FBYyxFQUFDLE1BQU0sVUFBVSxDQUFDO0FBQzFFLE9BQU8sRUFBQyx3QkFBd0IsRUFBQyxNQUFNLGlCQUFpQixDQUFDO0FBQ3pELE9BQU8sRUFBQyxlQUFlLEVBQUUsZUFBZSxFQUFFLFVBQVUsRUFBQyxNQUFNLGNBQWMsQ0FBQztBQUMxRSxPQUFPLEVBQUMsWUFBWSxFQUFFLGFBQWEsRUFBRSxzQkFBc0IsRUFBRSx5QkFBeUIsRUFBRSxnQkFBZ0IsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUUsdUJBQXVCLEVBQUUsd0JBQXdCLEVBQUUsV0FBVyxFQUFlLHNCQUFzQixFQUFFLGdCQUFnQixF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QUUsRUFBRTtZQUNOLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEY7YUFBTTtZQUNMLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdEY7OztRQUlELElBQUksS0FBSyxHQUFHLElBQUksRUFBRTtZQUNoQixPQUFPLFFBQVEsQ0FBQztTQUNqQjtRQUVELElBQUksS0FBSyxlQUFtQixJQUFJLEtBQUssZUFBbUIsSUFBSSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUNuRixPQUFPLElBQUksQ0FBQztTQUNiOzs7UUFJRCxJQUFJLEVBQUUsRUFBRTtZQUNOLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDMUY7YUFBTTtZQUNMLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMs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LEtBQXFCLEVBQUUsV0FBc0I7O0lBRWhGLE1BQU0sS0FBSyxxQkFBRyxRQUFRLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBbUIsRUFBQztJQUM3RCxPQUFPLHNCQUFzQixDQUFDLDhCQUE4QixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsV0FBVyxDQUFDLENBQUMsQ0FBQztDQUMxRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtDaGFuZ2VEZXRlY3RvclJlZiBhcyB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmfSBmcm9tICcuLi9jaGFuZ2VfZGV0ZWN0aW9uL2NoYW5nZV9kZXRlY3Rvcl9yZWYnO1xuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeSBhcyB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3RvcnksIENvbXBvbmVudFJlZiBhcyB2aWV3RW5naW5lX0NvbXBvbmVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2NvbXBvbmVudF9mYWN0b3J5JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFzIHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuLi9saW5rZXIvY29tcG9uZW50X2ZhY3RvcnlfcmVzb2x2ZXInO1xuaW1wb3J0IHtFbGVtZW50UmVmIGFzIHZpZXdFbmdpbmVfRWxlbWVudFJlZn0gZnJvbSAnLi4vbGlua2VyL2VsZW1lbnRfcmVmJztcbmltcG9ydCB7TmdNb2R1bGVSZWYgYXMgdmlld0VuZ2luZV9OZ01vZHVsZVJlZn0gZnJvbSAnLi4vbGlua2VyL25nX21vZHVsZV9mYWN0b3J5JztcbmltcG9ydCB7VGVtcGxhdGVSZWYgYXMgdmlld0VuZ2luZV9UZW1wbGF0ZVJlZn0gZnJvbSAnLi4vbGlua2VyL3RlbXBsYXRlX3JlZic7XG5pbXBvcnQge1ZpZXdDb250YWluZXJSZWYgYXMgdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmfSBmcm9tICcuLi9saW5rZXIvdmlld19jb250YWluZXJfcmVmJztcbmltcG9ydCB7RW1iZWRkZWRWaWV3UmVmIGFzIHZpZXdFbmdpbmVfRW1iZWRkZWRWaWV3UmVmLCBWaWV3UmVmIGFzIHZpZXdFbmdpbmVfVmlld1JlZn0gZnJvbSAnLi4vbGlua2VyL3ZpZXdfcmVmJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkLCBhc3NlcnRHcmVhdGVyVGhhbiwgYXNzZXJ0TGVzc1RoYW59IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyfSBmcm9tICcuL2NvbXBvbmVudF9yZWYnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7X2dldFZpZXdEYXRhLCBhZGRUb1ZpZXdUcmVlLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlLCBjcmVhdGVMQ29udGFpbmVyLCBjcmVhdGVMTm9kZU9iamVjdCwgY3JlYXRlVE5vZGUsIGdldFByZXZpb3VzT3JQYXJlbnROb2RlLCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIGdldFJlbmRlcmVyLCBsb2FkRWxlbWVudCwgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZSwgcmVzb2x2ZURpcmVjdGl2ZX0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtMQ29udGFpbmVyLCBSRU5ERVJfUEFSRU5ULCBWSUVXU30gZnJvbSAnLi9pbnRlcmZhY2VzL2NvbnRhaW5lcic7XG5pbXBvcnQge0RpcmVjdGl2ZURlZkludGVybmFsLCBSZW5kZXJGbGFnc30gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgTENvbnRhaW5lck5vZGUsIExFbGVtZW50Q29udGFpbmVyTm9kZSwgTEVsZW1lbnROb2RlLCBMTm9kZSwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlLCBUVmlld05vZGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7TFF1ZXJpZXMsIFF1ZXJ5UmVhZFR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9xdWVyeSc7XG5pbXBvcnQge1JlbmRlcmVyMywgaXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0NPTlRFWFQsIERJUkVDVElWRVMsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgUVVFUklFUywgUkVOREVSRVIsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzLCBhc3NlcnROb2RlVHlwZX0gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5pbXBvcnQge2FkZFJlbW92ZVZpZXdGcm9tQ29udGFpbmVyLCBhcHBlbmRDaGlsZCwgZGV0YWNoVmlldywgZmluZENvbXBvbmVudFZpZXcsIGdldEJlZm9yZU5vZGVGb3JWaWV3LCBnZXRIb3N0RWxlbWVudE5vZGUsIGdldFBhcmVudExOb2RlLCBnZXRQYXJlbnRPckNvbnRhaW5lck5vZGUsIGdldFJlbmRlclBhcmVudCwgaW5zZXJ0VmlldywgcmVtb3ZlVmlld30gZnJvbSAnLi9ub2RlX21hbmlwdWxhdGlvbic7XG5pbXBvcnQge2dldExOb2RlLCBpc0NvbXBvbmVudH0gZnJvbSAnLi91dGlsJztcbmltcG9ydCB7Vmlld1JlZn0gZnJvbSAnLi92aWV3X3JlZic7XG5cblxuXG4vKipcbiAqIElmIGEgZGlyZWN0aXZlIGlzIGRpUHVibGljLCBibG9vbUFkZCBzZXRzIGEgcHJvcGVydHkgb24gdGhlIHR5cGUgd2l0aCB0aGlzIGNvbnN0YW50IGFzXG4gKiB0aGUga2V5IGFuZCB0aGUgZGlyZWN0aXZlJ3MgdW5pcXVlIElEIGFzIHRoZSB2YWx1ZS4gVGhpcyBhbGxvd3MgdXMgdG8gbWFwIGRpcmVjdGl2ZXMgdG8gdGhlaXJcbiAqIGJsb29tIGZpbHRlciBiaXQgZm9yIERJLlxuICovXG5jb25zdCBOR19FTEVNRU5UX0lEID0gJ19fTkdfRUxFTUVOVF9JRF9fJztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9yIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIHRoZSBkaXJlY3RpdmUgc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9yOiBMSW5qZWN0b3IsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gIGlmIChpZCA9PSBudWxsKSB7XG4gICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gIH1cblxuICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuXG4gIGlmIChiNykge1xuICAgIGI2ID8gKGI1ID8gKGluamVjdG9yLmJmNyB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjYgfD0gbWFzaykpIDpcbiAgICAgICAgIChiNSA/IChpbmplY3Rvci5iZjUgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY0IHw9IG1hc2spKTtcbiAgfSBlbHNlIHtcbiAgICBiNiA/IChiNSA/IChpbmplY3Rvci5iZjMgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmYyIHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAoaW5qZWN0b3IuYmYxIHw9IG1hc2spIDogKGluamVjdG9yLmJmMCB8PSBtYXNrKSk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IExJbmplY3RvciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50Tm9kZSgpIGFzIExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGUsXG4gICAgICBfZ2V0Vmlld0RhdGEoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIG5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBob3N0VmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIG5vZGU6IExFbGVtZW50Tm9kZSB8IExFbGVtZW50Q29udGFpbmVyTm9kZSB8IExDb250YWluZXJOb2RlLFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSk6IExJbmplY3RvciB7XG4gIC8vIFRPRE86IHJlbW92ZSBMTm9kZSBhcmcgd2hlbiBub2RlSW5qZWN0b3IgcmVmYWN0b3IgaXMgZG9uZVxuICBjb25zdCBub2RlSW5qZWN0b3IgPSBub2RlLm5vZGVJbmplY3RvcjtcbiAgY29uc3QgcGFyZW50TE5vZGUgPSBnZXRQYXJlbnRPckNvbnRhaW5lck5vZGUodE5vZGUsIGhvc3RWaWV3KTtcbiAgY29uc3QgcGFyZW50SW5qZWN0b3IgPSBwYXJlbnRMTm9kZSAmJiBwYXJlbnRMTm9kZS5ub2RlSW5qZWN0b3I7XG4gIGlmIChub2RlSW5qZWN0b3IgIT0gcGFyZW50SW5qZWN0b3IpIHtcbiAgICByZXR1cm4gbm9kZUluamVjdG9yICE7XG4gIH1cbiAgcmV0dXJuIG5vZGUubm9kZUluamVjdG9yID0ge1xuICAgIHBhcmVudDogcGFyZW50SW5qZWN0b3IsXG4gICAgdE5vZGU6IHROb2RlLFxuICAgIHZpZXc6IGhvc3RWaWV3LFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgICB0ZW1wbGF0ZVJlZjogbnVsbCxcbiAgICB2aWV3Q29udGFpbmVyUmVmOiBudWxsLFxuICAgIGVsZW1lbnRSZWY6IG51bGwsXG4gICAgY2hhbmdlRGV0ZWN0b3JSZWY6IG51bGwsXG4gIH07XG59XG5cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhbiBFbGVtZW50UmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RFbGVtZW50UmVmKCk6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVGVtcGxhdGVSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RUZW1wbGF0ZVJlZjxUPigpOiB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlVGVtcGxhdGVSZWY8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdDb250YWluZXJSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IuIE9yLCBpZiB0aGUgVmlld0NvbnRhaW5lclJlZlxuICogYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgVmlld0NvbnRhaW5lclJlZi5cbiAqXG4gKiBAcmV0dXJucyBUaGUgVmlld0NvbnRhaW5lclJlZiBpbnN0YW5jZSB0byB1c2VcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFZpZXdDb250YWluZXJSZWYoKTogdmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuXG4vKiogUmV0dXJucyBhIENoYW5nZURldGVjdG9yUmVmIChhLmsuYS4gYSBWaWV3UmVmKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdENoYW5nZURldGVjdG9yUmVmKCk6IHZpZXdFbmdpbmVfQ2hhbmdlRGV0ZWN0b3JSZWYge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBudWxsKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlXG4gKiBDb21wb25lbnRGYWN0b3J5UmVzb2x2ZXJcbiAqIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIENvbXBvbmVudEZhY3RvcnlSZXNvbHZlci5cbiAqXG4gKiBAcmV0dXJucyBUaGUgQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0Q29tcG9uZW50RmFjdG9yeVJlc29sdmVyKCk6IHZpZXdFbmdpbmVfQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyIHtcbiAgcmV0dXJuIGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjtcbn1cbmNvbnN0IGNvbXBvbmVudEZhY3RvcnlSZXNvbHZlcjogQ29tcG9uZW50RmFjdG9yeVJlc29sdmVyID0gbmV3IENvbXBvbmVudEZhY3RvcnlSZXNvbHZlcigpO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFZpZXdSZWYgYW5kIHN0b3JlcyBpdCBvbiB0aGUgaW5qZWN0b3IgYXMgQ2hhbmdlRGV0ZWN0b3JSZWYgKHB1YmxpYyBhbGlhcykuXG4gKiBPciwgaWYgaXQgYWxyZWFkeSBleGlzdHMsIHJldHJpZXZlcyB0aGUgZXhpc3RpbmcgaW5zdGFuY2UuXG4gKlxuICogQHJldHVybnMgVGhlIENoYW5nZURldGVjdG9yUmVmIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDaGFuZ2VEZXRlY3RvclJlZihcbiAgICBkaTogTEluamVjdG9yLCBjb250ZXh0OiBhbnkpOiB2aWV3RW5naW5lX0NoYW5nZURldGVjdG9yUmVmIHtcbiAgaWYgKGRpLmNoYW5nZURldGVjdG9yUmVmKSByZXR1cm4gZGkuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgY29uc3QgY3VycmVudFROb2RlID0gZGkudE5vZGU7XG4gIGlmIChpc0NvbXBvbmVudChjdXJyZW50VE5vZGUpKSB7XG4gICAgcmV0dXJuIGRpLmNoYW5nZURldGVjdG9yUmVmID1cbiAgICAgICAgICAgICAgIG5ldyBWaWV3UmVmKGdldExOb2RlKGN1cnJlbnRUTm9kZSwgZGkudmlldykuZGF0YSBhcyBMVmlld0RhdGEsIGNvbnRleHQpO1xuICB9IGVsc2UgaWYgKGN1cnJlbnRUTm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCkge1xuICAgIHJldHVybiBkaS5jaGFuZ2VEZXRlY3RvclJlZiA9IGdldE9yQ3JlYXRlSG9zdENoYW5nZURldGVjdG9yKGRpLnZpZXcpO1xuICB9XG4gIHJldHVybiBudWxsICE7XG59XG5cbi8qKiBHZXRzIG9yIGNyZWF0ZXMgQ2hhbmdlRGV0ZWN0b3JSZWYgZm9yIHRoZSBjbG9zZXN0IGhvc3QgY29tcG9uZW50ICovXG5mdW5jdGlvbiBnZXRPckNyZWF0ZUhvc3RDaGFuZ2VEZXRlY3RvcihjdXJyZW50VmlldzogTFZpZXdEYXRhKTogdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZiB7XG4gIGNvbnN0IGhvc3RDb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcoY3VycmVudFZpZXcpO1xuICBjb25zdCBob3N0Tm9kZSA9IGdldEhvc3RFbGVtZW50Tm9kZShob3N0Q29tcG9uZW50VmlldykgITtcbiAgY29uc3QgaG9zdEluamVjdG9yID0gaG9zdE5vZGUubm9kZUluamVjdG9yO1xuICBjb25zdCBleGlzdGluZ1JlZiA9IGhvc3RJbmplY3RvciAmJiBob3N0SW5qZWN0b3IuY2hhbmdlRGV0ZWN0b3JSZWY7XG5cbiAgcmV0dXJuIGV4aXN0aW5nUmVmID8gZXhpc3RpbmdSZWYgOiBuZXcgVmlld1JlZihob3N0Q29tcG9uZW50VmlldywgaG9zdENvbXBvbmVudFZpZXdbQ09OVEVYVF0pO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMihkaTogTEluamVjdG9yKTogUmVuZGVyZXIyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSBkaS52aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlciBhcyBSZW5kZXJlcjI7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5qZWN0IFJlbmRlcmVyMiB3aGVuIHRoZSBhcHBsaWNhdGlvbiB1c2VzIFJlbmRlcmVyMyEnKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBMb29rIGZvciB0aGUgaW5qZWN0b3IgcHJvdmlkaW5nIHRoZSB0b2tlbiBieSB3YWxraW5nIHVwIHRoZSBub2RlIGluamVjdG9yIHRyZWUgYW5kIHRoZW5cbiAqIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBAcGFyYW0gbm9kZUluamVjdG9yIE5vZGUgaW5qZWN0b3Igd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciBgbnVsbGAgd2hlbiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICBub2RlSW5qZWN0b3I6IExJbmplY3RvciwgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LFxuICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXQodG9rZW4pO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykgb3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoICE9PSBudWxsKSB7XG4gICAgbGV0IGluamVjdG9yOiBMSW5qZWN0b3J8bnVsbCA9IG5vZGVJbmplY3RvcjtcblxuICAgIHdoaWxlIChpbmplY3Rvcikge1xuICAgICAgLy8gR2V0IHRoZSBjbG9zZXN0IHBvdGVudGlhbCBtYXRjaGluZyBpbmplY3RvciAodXB3YXJkcyBpbiB0aGUgaW5qZWN0b3IgdHJlZSkgdGhhdFxuICAgICAgLy8gKnBvdGVudGlhbGx5KiBoYXMgdGhlIHRva2VuLlxuICAgICAgaW5qZWN0b3IgPSBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKGluamVjdG9yLCBibG9vbUhhc2gsIGZsYWdzKTtcblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBjb25zdCB0Tm9kZSA9IGluamVjdG9yLnROb2RlO1xuICAgICAgY29uc3QgaW5qZWN0b3JWaWV3ID0gaW5qZWN0b3IudmlldztcbiAgICAgIGNvbnN0IG5vZGVGbGFncyA9IHROb2RlLmZsYWdzO1xuICAgICAgY29uc3QgY291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICAgICAgaWYgKGNvdW50ICE9PSAwKSB7XG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgICAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgICAgICBjb25zdCBkZWZzID0gaW5qZWN0b3JWaWV3W1RWSUVXXS5kaXJlY3RpdmVzICE7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgICAvLyBHZXQgdGhlIGRlZmluaXRpb24gZm9yIHRoZSBkaXJlY3RpdmUgYXQgdGhpcyBpbmRleCBhbmQsIGlmIGl0IGlzIGluamVjdGFibGUgKGRpUHVibGljKSxcbiAgICAgICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgICAgICBpZiAoZGlyZWN0aXZlRGVmLnR5cGUgPT09IHRva2VuICYmIGRpcmVjdGl2ZURlZi5kaVB1YmxpYykge1xuICAgICAgICAgICAgcmV0dXJuIGluamVjdG9yVmlld1tESVJFQ1RJVkVTXSAhW2ldO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSAqZGlkbid0KiBmaW5kIHRoZSBkaXJlY3RpdmUgZm9yIHRoZSB0b2tlbiBhbmQgd2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCBub2RlJ3NcbiAgICAgIC8vIGluamVjdG9yLCBpdCdzIHBvc3NpYmxlIHRoZSBkaXJlY3RpdmUgaXMgb24gdGhpcyBub2RlIGFuZCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cbiAgICAgIGxldCBpbnN0YW5jZTogVHxudWxsO1xuICAgICAgaWYgKGluamVjdG9yID09PSBub2RlSW5qZWN0b3IgJiZcbiAgICAgICAgICAoaW5zdGFuY2UgPSBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4odG9rZW4sIGluamVjdG9yVmlld1tUVklFV10pKSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAvLyBJZiBmbGFncyBwZXJtaXQsIHRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8IGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAhc2FtZUhvc3RWaWV3KGluamVjdG9yKSkge1xuICAgICAgICBpbmplY3RvciA9IG51bGw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvciA9IGluamVjdG9yLnBhcmVudDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBtb2R1bGVJbmplY3RvciA9IG5vZGVJbmplY3Rvci52aWV3W0lOSkVDVE9SXTtcbiAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICB0cnkge1xuICAgIHJldHVybiBpbmplY3QodG9rZW4sIGZsYWdzKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDdXJyZW50SW5qZWN0b3IoZm9ybWVySW5qZWN0b3IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPih0b2tlbjogYW55LCBob3N0VFZpZXc6IFRWaWV3KTogVHxudWxsIHtcbiAgY29uc3QgbWF0Y2hlcyA9IGhvc3RUVmlldy5jdXJyZW50TWF0Y2hlcztcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVEaXJlY3RpdmUoZGVmLCBpICsgMSwgbWF0Y2hlcywgaG9zdFRWaWV3KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqL1xuZnVuY3Rpb24gYmxvb21IYXNoQml0KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiBudW1iZXJ8bnVsbCB7XG4gIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIGlkID09PSAnbnVtYmVyJyA/IGlkICYgQkxPT01fTUFTSyA6IG51bGw7XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGNsb3Nlc3QgaW5qZWN0b3IgdGhhdCBtaWdodCBoYXZlIGEgY2VydGFpbiBkaXJlY3RpdmUuXG4gKlxuICogRWFjaCBkaXJlY3RpdmUgY29ycmVzcG9uZHMgdG8gYSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuIEdpdmVuIHRoZSBibG9vbSBiaXQgdG9cbiAqIGNoZWNrIGFuZCBhIHN0YXJ0aW5nIGluamVjdG9yLCB0aGlzIGZ1bmN0aW9uIHRyYXZlcnNlcyB1cCBpbmplY3RvcnMgdW50aWwgaXQgZmluZHMgYW5cbiAqIGluamVjdG9yIHRoYXQgY29udGFpbnMgYSAxIGZvciB0aGF0IGJpdCBpbiBpdHMgYmxvb20gZmlsdGVyLiBBIDEgaW5kaWNhdGVzIHRoYXQgdGhlXG4gKiBpbmplY3RvciBtYXkgaGF2ZSB0aGF0IGRpcmVjdGl2ZS4gSXQgb25seSAqbWF5KiBoYXZlIHRoZSBkaXJlY3RpdmUgYmVjYXVzZSBkaXJlY3RpdmVzIGJlZ2luXG4gKiB0byBzaGFyZSBibG9vbSBmaWx0ZXIgYml0cyBhZnRlciB0aGUgQkxPT01fU0laRSBpcyByZWFjaGVkLCBhbmQgaXQgY291bGQgY29ycmVzcG9uZCB0byBhXG4gKiBkaWZmZXJlbnQgZGlyZWN0aXZlIHNoYXJpbmcgdGhlIGJpdC5cbiAqXG4gKiBOb3RlOiBXZSBjYW4gc2tpcCBjaGVja2luZyBmdXJ0aGVyIGluamVjdG9ycyB1cCB0aGUgdHJlZSBpZiBhbiBpbmplY3RvcidzIGNiZiBzdHJ1Y3R1cmVcbiAqIGhhcyBhIDAgZm9yIHRoYXQgYmxvb20gYml0LiBTaW5jZSBjYmYgY29udGFpbnMgdGhlIG1lcmdlZCB2YWx1ZSBvZiBhbGwgdGhlIHBhcmVudFxuICogaW5qZWN0b3JzLCBhIDAgaW4gdGhlIGJsb29tIGJpdCBpbmRpY2F0ZXMgdGhhdCB0aGUgcGFyZW50cyBkZWZpbml0ZWx5IGRvIG5vdCBjb250YWluXG4gKiB0aGUgZGlyZWN0aXZlIGFuZCBkbyBub3QgbmVlZCB0byBiZSBjaGVja2VkLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgc3RhcnRpbmcgbm9kZSBpbmplY3RvciB0byBjaGVja1xuICogQHBhcmFtICBibG9vbUJpdCBUaGUgYml0IHRvIGNoZWNrIGluIGVhY2ggaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJcbiAqIEBwYXJhbSAgZmxhZ3MgVGhlIGluamVjdGlvbiBmbGFncyBmb3IgdGhpcyBpbmplY3Rpb24gc2l0ZSAoZS5nLiBPcHRpb25hbCBvciBTa2lwU2VsZilcbiAqIEByZXR1cm5zIEFuIGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSB0aGUgZGlyZWN0aXZlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUZpbmRQb3NzaWJsZUluamVjdG9yKFxuICAgIHN0YXJ0SW5qZWN0b3I6IExJbmplY3RvciwgYmxvb21CaXQ6IG51bWJlciwgZmxhZ3M6IEluamVjdEZsYWdzKTogTEluamVjdG9yfG51bGwge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuXG4gIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZSAqaXNuJ3QqIGFcbiAgLy8gbWF0Y2guXG4gIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPVxuICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZiA/IHN0YXJ0SW5qZWN0b3IucGFyZW50IDogc3RhcnRJbmplY3RvcjtcblxuICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICAgIGxldCB2YWx1ZTogbnVtYmVyO1xuXG4gICAgaWYgKGI3KSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuYmY3IDogaW5qZWN0b3IuYmY2KSA6IChiNSA/IGluamVjdG9yLmJmNSA6IGluamVjdG9yLmJmNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5iZjMgOiBpbmplY3Rvci5iZjIpIDogKGI1ID8gaW5qZWN0b3IuYmYxIDogaW5qZWN0b3IuYmYwKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gICAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgICBpZiAodmFsdWUgJiBtYXNrKSB7XG4gICAgICByZXR1cm4gaW5qZWN0b3I7XG4gICAgfVxuXG4gICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIC8vIElmIHRoZSBjdXJyZW50IGluamVjdG9yIGRvZXMgbm90IGhhdmUgdGhlIGRpcmVjdGl2ZSwgY2hlY2sgdGhlIGJsb29tIGZpbHRlcnMgZm9yIHRoZSBhbmNlc3RvclxuICAgIC8vIGluamVjdG9ycyAoY2JmMCAtIGNiZjcpLiBUaGVzZSBmaWx0ZXJzIGNhcHR1cmUgKmFsbCogYW5jZXN0b3IgaW5qZWN0b3JzLlxuICAgIGlmIChiNykge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmNiZjcgOiBpbmplY3Rvci5jYmY2KSA6IChiNSA/IGluamVjdG9yLmNiZjUgOiBpbmplY3Rvci5jYmY0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmNiZjMgOiBpbmplY3Rvci5jYmYyKSA6IChiNSA/IGluamVjdG9yLmNiZjEgOiBpbmplY3Rvci5jYmYwKTtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSwgdHJhdmVyc2UgdXAgdG9cbiAgICAvLyBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlIGNhbiBhYm9ydC5cbiAgICBpZiAodmFsdWUgJiBtYXNrKSB7XG4gICAgICBpbmplY3RvciA9IGluamVjdG9yLnBhcmVudDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQ2hlY2tzIHdoZXRoZXIgdGhlIGN1cnJlbnQgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgYXJlIGluIHRoZSBzYW1lIGhvc3Qgdmlldy5cbiAqXG4gKiBUaGlzIGlzIG5lY2Vzc2FyeSB0byBzdXBwb3J0IEBIb3N0KCkgZGVjb3JhdG9ycy4gSWYgQEhvc3QoKSBpcyBzZXQsIHdlIHNob3VsZCBzdG9wIHNlYXJjaGluZyBvbmNlXG4gKiB0aGUgaW5qZWN0b3IgYW5kIGl0cyBwYXJlbnQgdmlldyBkb24ndCBtYXRjaCBiZWNhdXNlIGl0IG1lYW5zIHdlJ2QgY3Jvc3MgdGhlIHZpZXcgYm91bmRhcnkuXG4gKi9cbmZ1bmN0aW9uIHNhbWVIb3N0VmlldyhpbmplY3RvcjogTEluamVjdG9yKTogYm9vbGVhbiB7XG4gIHJldHVybiAhIWluamVjdG9yLnBhcmVudCAmJiBpbmplY3Rvci5wYXJlbnQudmlldyA9PT0gaW5qZWN0b3Iudmlldztcbn1cblxuZXhwb3J0IGNsYXNzIFJlYWRGcm9tSW5qZWN0b3JGbjxUPiB7XG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHJlYWQ6IChpbmplY3RvcjogTEluamVjdG9yLCB0Tm9kZTogVE5vZGUsIGRpcmVjdGl2ZUluZGV4PzogbnVtYmVyKSA9PiBUKSB7fVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYW4gRWxlbWVudFJlZiBmb3IgYSBnaXZlbiBub2RlIGluamVjdG9yIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLlxuICogT3IsIGlmIHRoZSBFbGVtZW50UmVmIGFscmVhZHkgZXhpc3RzLCByZXRyaWV2ZXMgdGhlIGV4aXN0aW5nIEVsZW1lbnRSZWYuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIHdoZXJlIHdlIHNob3VsZCBzdG9yZSBhIGNyZWF0ZWQgRWxlbWVudFJlZlxuICogQHJldHVybnMgVGhlIEVsZW1lbnRSZWYgaW5zdGFuY2UgdG8gdXNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfRWxlbWVudFJlZiB7XG4gIHJldHVybiBkaS5lbGVtZW50UmVmIHx8IChkaS5lbGVtZW50UmVmID0gbmV3IEVsZW1lbnRSZWYoZ2V0TE5vZGUoZGkudE5vZGUsIGRpLnZpZXcpLm5hdGl2ZSkpO1xufVxuXG5leHBvcnQgY29uc3QgUVVFUllfUkVBRF9URU1QTEFURV9SRUYgPSA8UXVlcnlSZWFkVHlwZTx2aWV3RW5naW5lX1RlbXBsYXRlUmVmPGFueT4+PihcbiAgICBuZXcgUmVhZEZyb21JbmplY3RvckZuPHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8YW55Pj4oXG4gICAgICAgIChpbmplY3RvcjogTEluamVjdG9yKSA9PiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfQ09OVEFJTkVSX1JFRiA9IDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZj4+KFxuICAgIG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9WaWV3Q29udGFpbmVyUmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKGluamVjdG9yKSkgYXMgYW55KTtcblxuZXhwb3J0IGNvbnN0IFFVRVJZX1JFQURfRUxFTUVOVF9SRUYgPVxuICAgIDxRdWVyeVJlYWRUeXBlPHZpZXdFbmdpbmVfRWxlbWVudFJlZj4+KG5ldyBSZWFkRnJvbUluamVjdG9yRm48dmlld0VuZ2luZV9FbGVtZW50UmVmPihcbiAgICAgICAgKGluamVjdG9yOiBMSW5qZWN0b3IpID0+IGdldE9yQ3JlYXRlRWxlbWVudFJlZihpbmplY3RvcikpIGFzIGFueSk7XG5cbmV4cG9ydCBjb25zdCBRVUVSWV9SRUFEX0ZST01fTk9ERSA9XG4gICAgKG5ldyBSZWFkRnJvbUluamVjdG9yRm48YW55PigoaW5qZWN0b3I6IExJbmplY3RvciwgdE5vZGU6IFROb2RlLCBkaXJlY3RpdmVJZHg6IG51bWJlcikgPT4ge1xuICAgICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICAgICAgaWYgKGRpcmVjdGl2ZUlkeCA+IC0xKSB7XG4gICAgICAgIHJldHVybiBpbmplY3Rvci52aWV3W0RJUkVDVElWRVNdICFbZGlyZWN0aXZlSWR4XTtcbiAgICAgIH1cbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudCB8fCB0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcikge1xuICAgICAgICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGluamVjdG9yKTtcbiAgICAgIH1cbiAgICAgIGlmICh0Tm9kZS50eXBlID09PSBUTm9kZVR5cGUuQ29udGFpbmVyKSB7XG4gICAgICAgIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGluamVjdG9yKTtcbiAgICAgIH1cbiAgICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgICAgLy8gc2hvdWxkIG5ldmVyIGhhcHBlblxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgbm9kZSB0eXBlOiAke3ROb2RlLnR5cGV9YCk7XG4gICAgICB9XG4gICAgfSkgYXMgYW55IGFzIFF1ZXJ5UmVhZFR5cGU8YW55Pik7XG5cbi8qKiBBIHJlZiB0byBhIG5vZGUncyBuYXRpdmUgZWxlbWVudC4gKi9cbmNsYXNzIEVsZW1lbnRSZWYgZXh0ZW5kcyB2aWV3RW5naW5lX0VsZW1lbnRSZWYge31cblxuLyoqXG4gKiBDcmVhdGVzIGEgVmlld0NvbnRhaW5lclJlZiBhbmQgc3RvcmVzIGl0IG9uIHRoZSBpbmplY3Rvci4gT3IsIGlmIHRoZSBWaWV3Q29udGFpbmVyUmVmXG4gKiBhbHJlYWR5IGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBWaWV3Q29udGFpbmVyUmVmLlxuICpcbiAqIEByZXR1cm5zIFRoZSBWaWV3Q29udGFpbmVyUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVDb250YWluZXJSZWYoZGk6IExJbmplY3Rvcik6IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZiB7XG4gIGlmICghZGkudmlld0NvbnRhaW5lclJlZikge1xuICAgIGNvbnN0IGhvc3RMTm9kZSA9XG4gICAgICAgIGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTEVsZW1lbnROb2RlIHwgTENvbnRhaW5lck5vZGUgfCBMRWxlbWVudENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgICBob3N0VE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG5cbiAgICBjb25zdCBob3N0VmlldyA9IGRpLnZpZXc7XG4gICAgY29uc3QgbENvbnRhaW5lciA9IGNyZWF0ZUxDb250YWluZXIoaG9zdFZpZXcsIHRydWUpO1xuICAgIGNvbnN0IGNvbW1lbnQgPSBob3N0Vmlld1tSRU5ERVJFUl0uY3JlYXRlQ29tbWVudChuZ0Rldk1vZGUgPyAnY29udGFpbmVyJyA6ICcnKTtcbiAgICBjb25zdCBsQ29udGFpbmVyTm9kZTogTENvbnRhaW5lck5vZGUgPVxuICAgICAgICBjcmVhdGVMTm9kZU9iamVjdChUTm9kZVR5cGUuQ29udGFpbmVyLCBob3N0TE5vZGUubm9kZUluamVjdG9yLCBjb21tZW50LCBsQ29udGFpbmVyKTtcblxuICAgIGxDb250YWluZXJbUkVOREVSX1BBUkVOVF0gPSBnZXRSZW5kZXJQYXJlbnQoaG9zdFROb2RlLCBob3N0Vmlldyk7XG5cbiAgICBhcHBlbmRDaGlsZChjb21tZW50LCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcblxuICAgIGlmICghaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlKSB7XG4gICAgICBob3N0VE5vZGUuZHluYW1pY0NvbnRhaW5lck5vZGUgPVxuICAgICAgICAgIGNyZWF0ZVROb2RlKFROb2RlVHlwZS5Db250YWluZXIsIC0xLCBudWxsLCBudWxsLCBob3N0VE5vZGUsIG51bGwpO1xuICAgIH1cblxuICAgIGhvc3RMTm9kZS5keW5hbWljTENvbnRhaW5lck5vZGUgPSBsQ29udGFpbmVyTm9kZTtcbiAgICBhZGRUb1ZpZXdUcmVlKGhvc3RWaWV3LCBob3N0VE5vZGUuaW5kZXggYXMgbnVtYmVyLCBsQ29udGFpbmVyKTtcblxuICAgIGRpLnZpZXdDb250YWluZXJSZWYgPSBuZXcgVmlld0NvbnRhaW5lclJlZihcbiAgICAgICAgbENvbnRhaW5lciwgaG9zdFROb2RlLmR5bmFtaWNDb250YWluZXJOb2RlIGFzIFRDb250YWluZXJOb2RlLCBob3N0VE5vZGUsIGhvc3RWaWV3KTtcbiAgfVxuXG4gIHJldHVybiBkaS52aWV3Q29udGFpbmVyUmVmO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9sSW5qZWN0b3I6IExJbmplY3Rvcikge31cblxuICBnZXQodG9rZW46IGFueSk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSB2aWV3RW5naW5lX1RlbXBsYXRlUmVmKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZih0aGlzLl9sSW5qZWN0b3IpO1xuICAgIH1cbiAgICBpZiAodG9rZW4gPT09IHZpZXdFbmdpbmVfVmlld0NvbnRhaW5lclJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlQ29udGFpbmVyUmVmKHRoaXMuX2xJbmplY3Rvcik7XG4gICAgfVxuICAgIGlmICh0b2tlbiA9PT0gdmlld0VuZ2luZV9FbGVtZW50UmVmKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVFbGVtZW50UmVmKHRoaXMuX2xJbmplY3Rvcik7XG4gICAgfVxuICAgIGlmICh0b2tlbiA9PT0gdmlld0VuZ2luZV9DaGFuZ2VEZXRlY3RvclJlZikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlQ2hhbmdlRGV0ZWN0b3JSZWYodGhpcy5fbEluamVjdG9yLCBudWxsKTtcbiAgICB9XG4gICAgaWYgKHRva2VuID09PSBSZW5kZXJlcjIpIHtcbiAgICAgIHJldHVybiBnZXRPckNyZWF0ZVJlbmRlcmVyMih0aGlzLl9sSW5qZWN0b3IpO1xuICAgIH1cblxuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUodGhpcy5fbEluamVjdG9yLCB0b2tlbik7XG4gIH1cbn1cblxuLyoqXG4gKiBBIHJlZiB0byBhIGNvbnRhaW5lciB0aGF0IGVuYWJsZXMgYWRkaW5nIGFuZCByZW1vdmluZyB2aWV3cyBmcm9tIHRoYXQgY29udGFpbmVyXG4gKiBpbXBlcmF0aXZlbHkuXG4gKi9cbmNsYXNzIFZpZXdDb250YWluZXJSZWYgZXh0ZW5kcyB2aWV3RW5naW5lX1ZpZXdDb250YWluZXJSZWYge1xuICBwcml2YXRlIF92aWV3UmVmczogdmlld0VuZ2luZV9WaWV3UmVmW10gPSBbXTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX2xDb250YWluZXI6IExDb250YWluZXIsIHByaXZhdGUgX3RDb250YWluZXJOb2RlOiBUQ29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RUTm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlld0RhdGEpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgZ2V0IGVsZW1lbnQoKTogRWxlbWVudFJlZiB7XG4gICAgLy8gVE9ETzogUmVtb3ZlIExOb2RlIGxvb2t1cCB3aGVuIHJlbW92aW5nIExOb2RlLm5vZGVJbmplY3RvclxuICAgIGNvbnN0IGluamVjdG9yID1cbiAgICAgICAgZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKHRoaXMuX2dldEhvc3ROb2RlKCksIHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUVsZW1lbnRSZWYoaW5qZWN0b3IpO1xuICB9XG5cbiAgZ2V0IGluamVjdG9yKCk6IEluamVjdG9yIHtcbiAgICAvLyBUT0RPOiBSZW1vdmUgTE5vZGUgbG9va3VwIHdoZW4gcmVtb3ZpbmcgTE5vZGUubm9kZUluamVjdG9yXG4gICAgY29uc3QgaW5qZWN0b3IgPVxuICAgICAgICBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUodGhpcy5fZ2V0SG9zdE5vZGUoKSwgdGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgcmV0dXJuIG5ldyBOb2RlSW5qZWN0b3IoaW5qZWN0b3IpO1xuICB9XG5cbiAgLyoqIEBkZXByZWNhdGVkIE5vIHJlcGxhY2VtZW50ICovXG4gIGdldCBwYXJlbnRJbmplY3RvcigpOiBJbmplY3RvciB7XG4gICAgY29uc3QgcGFyZW50TEluamVjdG9yID0gZ2V0UGFyZW50TE5vZGUodGhpcy5faG9zdFROb2RlLCB0aGlzLl9ob3N0VmlldykgIS5ub2RlSW5qZWN0b3I7XG4gICAgcmV0dXJuIHBhcmVudExJbmplY3RvciA/IG5ldyBOb2RlSW5qZWN0b3IocGFyZW50TEluamVjdG9yKSA6IG5ldyBOdWxsSW5qZWN0b3IoKTtcbiAgfVxuXG4gIGNsZWFyKCk6IHZvaWQge1xuICAgIHdoaWxlICh0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGgpIHtcbiAgICAgIHRoaXMucmVtb3ZlKDApO1xuICAgIH1cbiAgfVxuXG4gIGdldChpbmRleDogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmfG51bGwgeyByZXR1cm4gdGhpcy5fdmlld1JlZnNbaW5kZXhdIHx8IG51bGw7IH1cblxuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7IHJldHVybiB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGg7IH1cblxuICBjcmVhdGVFbWJlZGRlZFZpZXc8Qz4odGVtcGxhdGVSZWY6IHZpZXdFbmdpbmVfVGVtcGxhdGVSZWY8Qz4sIGNvbnRleHQ/OiBDLCBpbmRleD86IG51bWJlcik6XG4gICAgICB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxDPiB7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG4gICAgY29uc3Qgdmlld1JlZiA9ICh0ZW1wbGF0ZVJlZiBhcyBUZW1wbGF0ZVJlZjxDPilcbiAgICAgICAgICAgICAgICAgICAgICAgIC5jcmVhdGVFbWJlZGRlZFZpZXcoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dCB8fCA8YW55Pnt9LCB0aGlzLl9sQ29udGFpbmVyLCB0aGlzLl90Q29udGFpbmVyTm9kZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9ob3N0VmlldywgYWRqdXN0ZWRJZHgpO1xuICAgICh2aWV3UmVmIGFzIFZpZXdSZWY8YW55PikuYXR0YWNoVG9WaWV3Q29udGFpbmVyUmVmKHRoaXMpO1xuICAgIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMCwgdmlld1JlZik7XG4gICAgcmV0dXJuIHZpZXdSZWY7XG4gIH1cblxuICBjcmVhdGVDb21wb25lbnQ8Qz4oXG4gICAgICBjb21wb25lbnRGYWN0b3J5OiB2aWV3RW5naW5lX0NvbXBvbmVudEZhY3Rvcnk8Qz4sIGluZGV4PzogbnVtYmVyfHVuZGVmaW5lZCxcbiAgICAgIGluamVjdG9yPzogSW5qZWN0b3J8dW5kZWZpbmVkLCBwcm9qZWN0YWJsZU5vZGVzPzogYW55W11bXXx1bmRlZmluZWQsXG4gICAgICBuZ01vZHVsZVJlZj86IHZpZXdFbmdpbmVfTmdNb2R1bGVSZWY8YW55Pnx1bmRlZmluZWQpOiB2aWV3RW5naW5lX0NvbXBvbmVudFJlZjxDPiB7XG4gICAgY29uc3QgY29udGV4dEluamVjdG9yID0gaW5qZWN0b3IgfHwgdGhpcy5wYXJlbnRJbmplY3RvcjtcbiAgICBpZiAoIW5nTW9kdWxlUmVmICYmIGNvbnRleHRJbmplY3Rvcikge1xuICAgICAgbmdNb2R1bGVSZWYgPSBjb250ZXh0SW5qZWN0b3IuZ2V0KHZpZXdFbmdpbmVfTmdNb2R1bGVSZWYsIG51bGwpO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbXBvbmVudFJlZiA9XG4gICAgICAgIGNvbXBvbmVudEZhY3RvcnkuY3JlYXRlKGNvbnRleHRJbmplY3RvciwgcHJvamVjdGFibGVOb2RlcywgdW5kZWZpbmVkLCBuZ01vZHVsZVJlZik7XG4gICAgdGhpcy5pbnNlcnQoY29tcG9uZW50UmVmLmhvc3RWaWV3LCBpbmRleCk7XG4gICAgcmV0dXJuIGNvbXBvbmVudFJlZjtcbiAgfVxuXG4gIGluc2VydCh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIGluZGV4PzogbnVtYmVyKTogdmlld0VuZ2luZV9WaWV3UmVmIHtcbiAgICBpZiAodmlld1JlZi5kZXN0cm95ZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluc2VydCBhIGRlc3Ryb3llZCBWaWV3IGluIGEgVmlld0NvbnRhaW5lciEnKTtcbiAgICB9XG4gICAgY29uc3QgbFZpZXcgPSAodmlld1JlZiBhcyBWaWV3UmVmPGFueT4pLl92aWV3ICE7XG4gICAgY29uc3QgYWRqdXN0ZWRJZHggPSB0aGlzLl9hZGp1c3RJbmRleChpbmRleCk7XG5cbiAgICBpbnNlcnRWaWV3KFxuICAgICAgICBsVmlldywgdGhpcy5fbENvbnRhaW5lciwgdGhpcy5faG9zdFZpZXcsIGFkanVzdGVkSWR4LCB0aGlzLl90Q29udGFpbmVyTm9kZS5wYXJlbnQgIS5pbmRleCk7XG5cbiAgICBjb25zdCBjb250YWluZXIgPSB0aGlzLl9nZXRIb3N0Tm9kZSgpLmR5bmFtaWNMQ29udGFpbmVyTm9kZSAhO1xuICAgIGNvbnN0IGJlZm9yZU5vZGUgPSBnZXRCZWZvcmVOb2RlRm9yVmlldyhhZGp1c3RlZElkeCwgdGhpcy5fbENvbnRhaW5lcltWSUVXU10sIGNvbnRhaW5lcik7XG4gICAgYWRkUmVtb3ZlVmlld0Zyb21Db250YWluZXIobFZpZXcsIHRydWUsIGJlZm9yZU5vZGUpO1xuXG4gICAgKHZpZXdSZWYgYXMgVmlld1JlZjxhbnk+KS5hdHRhY2hUb1ZpZXdDb250YWluZXJSZWYodGhpcyk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAwLCB2aWV3UmVmKTtcblxuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgbW92ZSh2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYsIG5ld0luZGV4OiBudW1iZXIpOiB2aWV3RW5naW5lX1ZpZXdSZWYge1xuICAgIGNvbnN0IGluZGV4ID0gdGhpcy5pbmRleE9mKHZpZXdSZWYpO1xuICAgIHRoaXMuZGV0YWNoKGluZGV4KTtcbiAgICB0aGlzLmluc2VydCh2aWV3UmVmLCB0aGlzLl9hZGp1c3RJbmRleChuZXdJbmRleCkpO1xuICAgIHJldHVybiB2aWV3UmVmO1xuICB9XG5cbiAgaW5kZXhPZih2aWV3UmVmOiB2aWV3RW5naW5lX1ZpZXdSZWYpOiBudW1iZXIgeyByZXR1cm4gdGhpcy5fdmlld1JlZnMuaW5kZXhPZih2aWV3UmVmKTsgfVxuXG4gIHJlbW92ZShpbmRleD86IG51bWJlcik6IHZvaWQge1xuICAgIGNvbnN0IGFkanVzdGVkSWR4ID0gdGhpcy5fYWRqdXN0SW5kZXgoaW5kZXgsIC0xKTtcbiAgICByZW1vdmVWaWV3KHRoaXMuX2xDb250YWluZXIsIHRoaXMuX3RDb250YWluZXJOb2RlIGFzIFRDb250YWluZXJOb2RlLCBhZGp1c3RlZElkeCk7XG4gICAgdGhpcy5fdmlld1JlZnMuc3BsaWNlKGFkanVzdGVkSWR4LCAxKTtcbiAgfVxuXG4gIGRldGFjaChpbmRleD86IG51bWJlcik6IHZpZXdFbmdpbmVfVmlld1JlZnxudWxsIHtcbiAgICBjb25zdCBhZGp1c3RlZElkeCA9IHRoaXMuX2FkanVzdEluZGV4KGluZGV4LCAtMSk7XG4gICAgZGV0YWNoVmlldyh0aGlzLl9sQ29udGFpbmVyLCBhZGp1c3RlZElkeCwgISF0aGlzLl90Q29udGFpbmVyTm9kZS5kZXRhY2hlZCk7XG4gICAgcmV0dXJuIHRoaXMuX3ZpZXdSZWZzLnNwbGljZShhZGp1c3RlZElkeCwgMSlbMF0gfHwgbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgX2FkanVzdEluZGV4KGluZGV4PzogbnVtYmVyLCBzaGlmdDogbnVtYmVyID0gMCkge1xuICAgIGlmIChpbmRleCA9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbENvbnRhaW5lcltWSUVXU10ubGVuZ3RoICsgc2hpZnQ7XG4gICAgfVxuICAgIGlmIChuZ0Rldk1vZGUpIHtcbiAgICAgIGFzc2VydEdyZWF0ZXJUaGFuKGluZGV4LCAtMSwgJ2luZGV4IG11c3QgYmUgcG9zaXRpdmUnKTtcbiAgICAgIC8vICsxIGJlY2F1c2UgaXQncyBsZWdhbCB0byBpbnNlcnQgYXQgdGhlIGVuZC5cbiAgICAgIGFzc2VydExlc3NUaGFuKGluZGV4LCB0aGlzLl9sQ29udGFpbmVyW1ZJRVdTXS5sZW5ndGggKyAxICsgc2hpZnQsICdpbmRleCcpO1xuICAgIH1cbiAgICByZXR1cm4gaW5kZXg7XG4gIH1cblxuICBwcml2YXRlIF9nZXRIb3N0Tm9kZSgpIHsgcmV0dXJuIGdldExOb2RlKHRoaXMuX2hvc3RUTm9kZSwgdGhpcy5faG9zdFZpZXcpOyB9XG59XG5cbi8qKlxuICogQ3JlYXRlcyBhIFRlbXBsYXRlUmVmIGFuZCBzdG9yZXMgaXQgb24gdGhlIGluamVjdG9yLiBPciwgaWYgdGhlIFRlbXBsYXRlUmVmIGFscmVhZHlcbiAqIGV4aXN0cywgcmV0cmlldmVzIHRoZSBleGlzdGluZyBUZW1wbGF0ZVJlZi5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgd2Ugc2hvdWxkIHN0b3JlIGEgY3JlYXRlZCBUZW1wbGF0ZVJlZlxuICogQHJldHVybnMgVGhlIFRlbXBsYXRlUmVmIGluc3RhbmNlIHRvIHVzZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVUZW1wbGF0ZVJlZjxUPihkaTogTEluamVjdG9yKTogdmlld0VuZ2luZV9UZW1wbGF0ZVJlZjxUPiB7XG4gIGlmICghZGkudGVtcGxhdGVSZWYpIHtcbiAgICBjb25zdCBob3N0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnROb2RlKCkgYXMgTENvbnRhaW5lck5vZGU7XG4gICAgY29uc3QgaG9zdFROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVENvbnRhaW5lck5vZGU7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVUeXBlKGhvc3RUTm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lcik7XG4gICAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQoaG9zdFROb2RlLnRWaWV3cywgJ1RWaWV3IG11c3QgYmUgYWxsb2NhdGVkJyk7XG4gICAgZGkudGVtcGxhdGVSZWYgPSBuZXcgVGVtcGxhdGVSZWY8YW55PihcbiAgICAgICAgZGkudmlldywgZ2V0T3JDcmVhdGVFbGVtZW50UmVmKGRpKSwgaG9zdFROb2RlLnRWaWV3cyBhcyBUVmlldywgZ2V0UmVuZGVyZXIoKSxcbiAgICAgICAgaG9zdE5vZGUuZGF0YSAhW1FVRVJJRVNdKTtcbiAgfVxuICByZXR1cm4gZGkudGVtcGxhdGVSZWY7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlPzogVHlwZTxUPikgPT4gVCl8bnVsbCB7XG4gIGNvbnN0IHR5cGVBbnkgPSB0eXBlIGFzIGFueTtcbiAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmPFQ+KHR5cGVBbnkpIHx8IGdldERpcmVjdGl2ZURlZjxUPih0eXBlQW55KSB8fFxuICAgICAgZ2V0UGlwZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RhYmxlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdG9yRGVmPFQ+KHR5cGVBbnkpO1xuICBpZiAoIWRlZiB8fCBkZWYuZmFjdG9yeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGRlZi5mYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5oZXJpdGVkRmFjdG9yeTxUPih0eXBlOiBUeXBlPGFueT4pOiAodHlwZTogVHlwZTxUPikgPT4gVCB7XG4gIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvciBhcyBUeXBlPGFueT47XG4gIGNvbnN0IGZhY3RvcnkgPSBnZXRGYWN0b3J5T2Y8VD4ocHJvdG8pO1xuICBpZiAoZmFjdG9yeSAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWN0b3J5O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZXJlIGlzIG5vIGZhY3RvcnkgZGVmaW5lZC4gRWl0aGVyIHRoaXMgd2FzIGltcHJvcGVyIHVzYWdlIG9mIGluaGVyaXRhbmNlXG4gICAgLy8gKG5vIEFuZ3VsYXIgZGVjb3JhdG9yIG9uIHRoZSBzdXBlcmNsYXNzKSBvciB0aGVyZSBpcyBubyBjb25zdHJ1Y3RvciBhdCBhbGxcbiAgICAvLyBpbiB0aGUgaW5oZXJpdGFuY2UgY2hhaW4uIFNpbmNlIHRoZSB0d28gY2FzZXMgY2Fubm90IGJlIGRpc3Rpbmd1aXNoZWQsIHRoZVxuICAgIC8vIGxhdHRlciBoYXMgdG8gYmUgYXNzdW1lZC5cbiAgICByZXR1cm4gKHQpID0+IG5ldyB0KCk7XG4gIH1cbn1cblxuY2xhc3MgVGVtcGxhdGVSZWY8VD4gZXh0ZW5kcyB2aWV3RW5naW5lX1RlbXBsYXRlUmVmPFQ+IHtcbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF9kZWNsYXJhdGlvblBhcmVudFZpZXc6IExWaWV3RGF0YSwgcmVhZG9ubHkgZWxlbWVudFJlZjogdmlld0VuZ2luZV9FbGVtZW50UmVmLFxuICAgICAgcHJpdmF0ZSBfdFZpZXc6IFRWaWV3LCBwcml2YXRlIF9yZW5kZXJlcjogUmVuZGVyZXIzLCBwcml2YXRlIF9xdWVyaWVzOiBMUXVlcmllc3xudWxsKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGNyZWF0ZUVtYmVkZGVkVmlldyhcbiAgICAgIGNvbnRleHQ6IFQsIGNvbnRhaW5lcj86IExDb250YWluZXIsIHRDb250YWluZXJOb2RlPzogVENvbnRhaW5lck5vZGUsIGhvc3RWaWV3PzogTFZpZXdEYXRhLFxuICAgICAgaW5kZXg/OiBudW1iZXIpOiB2aWV3RW5naW5lX0VtYmVkZGVkVmlld1JlZjxUPiB7XG4gICAgY29uc3QgbFZpZXcgPSBjcmVhdGVFbWJlZGRlZFZpZXdBbmROb2RlKFxuICAgICAgICB0aGlzLl90VmlldywgY29udGV4dCwgdGhpcy5fZGVjbGFyYXRpb25QYXJlbnRWaWV3LCB0aGlzLl9yZW5kZXJlciwgdGhpcy5fcXVlcmllcyk7XG4gICAgaWYgKGNvbnRhaW5lcikge1xuICAgICAgaW5zZXJ0VmlldyhsVmlldywgY29udGFpbmVyLCBob3N0VmlldyAhLCBpbmRleCAhLCB0Q29udGFpbmVyTm9kZSAhLnBhcmVudCAhLmluZGV4KTtcbiAgICB9XG4gICAgcmVuZGVyRW1iZWRkZWRUZW1wbGF0ZShsVmlldywgdGhpcy5fdFZpZXcsIGNvbnRleHQsIFJlbmRlckZsYWdzLkNyZWF0ZSk7XG4gICAgY29uc3Qgdmlld1JlZiA9IG5ldyBWaWV3UmVmKGxWaWV3LCBjb250ZXh0KTtcbiAgICB2aWV3UmVmLl90Vmlld05vZGUgPSBsVmlld1tIT1NUX05PREVdIGFzIFRWaWV3Tm9kZTtcbiAgICByZXR1cm4gdmlld1JlZjtcbiAgfVxufVxuXG4vKipcbiAqIFJldHJpZXZlcyBgVGVtcGxhdGVSZWZgIGluc3RhbmNlIGZyb20gYEluamVjdG9yYCB3aGVuIGEgbG9jYWwgcmVmZXJlbmNlIGlzIHBsYWNlZCBvbiB0aGVcbiAqIGA8bmctdGVtcGxhdGU+YCBlbGVtZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gdGVtcGxhdGVSZWZFeHRyYWN0b3IodE5vZGU6IFRDb250YWluZXJOb2RlLCBjdXJyZW50VmlldzogTFZpZXdEYXRhKSB7XG4gIC8vIFRPRE86IHJlbW92ZSB0aGlzIGxvb2t1cCB3aXRoIHJlbW92aW5nIExOb2RlLm5vZGVJbmplY3RvclxuICBjb25zdCBsTm9kZSA9IGdldExOb2RlKHROb2RlLCBjdXJyZW50VmlldykgYXMgTENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBnZXRPckNyZWF0ZVRlbXBsYXRlUmVmKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShsTm9kZSwgdE5vZGUsIGN1cnJlbnRWaWV3KSk7XG59XG4iXX0=