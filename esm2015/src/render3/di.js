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
import { getInjectableDef, getInjectorDef } from '../di/defs';
import { inject, setCurrentInjector } from '../di/injector';
import { Renderer2 } from '../render';
import { assertDefined } from './assert';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { NG_ELEMENT_ID } from './fields';
import { _getViewData, assertPreviousIsParent, getPreviousOrParentTNode, resolveDirective, setEnvironment } from './instructions';
import { isProceduralRenderer } from './interfaces/renderer';
import { DECLARATION_VIEW, DIRECTIVES, HOST_NODE, INJECTOR, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
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
    return getOrCreateNodeInjectorForNode(/** @type {?} */ (getPreviousOrParentTNode()), _getViewData());
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param {?} tNode for which an injector should be retrieved / created.
 * @param {?} hostView View where the node is stored
 * @return {?} Node injector
 */
export function getOrCreateNodeInjectorForNode(tNode, hostView) {
    /** @type {?} */
    const injector = getInjector(tNode, hostView);
    if (injector)
        return injector;
    /** @type {?} */
    const tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        // TODO(kara): Store node injector with host bindings for that node (see VIEW_DATA.md)
        tNode.injectorIndex = hostView.length;
        tView.blueprint.push(null);
        tView.hostBindingStartIndex++;
    }
    /** @type {?} */
    const parentInjector = getParentInjector(tNode, hostView);
    return hostView[tNode.injectorIndex] = {
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
    };
}
/**
 * @param {?} tNode
 * @param {?} view
 * @return {?}
 */
export function getInjector(tNode, view) {
    // If the injector index is the same as its parent's injector index, then the index has been
    // copied down from the parent node. No injector has been created yet on this node.
    if (tNode.injectorIndex === -1 ||
        tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) {
        return null;
    }
    else {
        return view[tNode.injectorIndex];
    }
}
/**
 * @param {?} tNode
 * @param {?} view
 * @return {?}
 */
export function getParentInjector(tNode, view) {
    if (tNode.parent && tNode.parent.injectorIndex !== -1) {
        return view[tNode.parent.injectorIndex];
    }
    /** @type {?} */
    let hostTNode = view[HOST_NODE];
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = /** @type {?} */ ((view[DECLARATION_VIEW]));
        hostTNode = /** @type {?} */ ((view[HOST_NODE]));
    }
    return hostTNode ? /** @type {?} */ ((view[DECLARATION_VIEW]))[hostTNode.injectorIndex] : null;
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
    const bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function')
        return bloomHash();
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash != null) {
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
function bloomHashBitOrFactory(token) {
    /** @type {?} */
    const tokenId = (/** @type {?} */ (token))[NG_ELEMENT_ID] || null;
    return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
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
        if (token === Renderer2) {
            return getOrCreateRenderer2(this._lInjector);
        }
        setEnvironment(this._lInjector.tNode, this._lInjector.view);
        return getOrCreateInjectable(this._lInjector, token);
    }
}
if (false) {
    /** @type {?} */
    NodeInjector.prototype._lInjector;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBV0EsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXNDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSWhJLE9BQU8sRUFBQyxvQkFBb0IsRUFBQyxNQUFNLHVCQUF1QixDQUFDO0FBQzNELE9BQU8sRUFBQyxnQkFBZ0IsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBYSxRQUFRLEVBQUUsS0FBSyxFQUFRLE1BQU0sbUJBQW1CLENBQUM7QUFDdkgsT0FBTyxFQUFDLHlCQUF5QixFQUFDLE1BQU0sZUFBZSxDQUFDOzs7Ozs7QUFPeEQsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDOztBQUN2QixNQUFNLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDOzs7O0FBR2xDLElBQUksZUFBZSxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7O0FBU3hCLE1BQU0sVUFBVSxRQUFRLENBQUMsUUFBbUIsRUFBRSxJQUFlOztJQUMzRCxJQUFJLEVBQUUsR0FBcUIsbUJBQUMsSUFBVyxFQUFDLENBQUMsYUFBYSxDQUFDLENBQUM7OztJQUl4RCxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUU7UUFDZCxFQUFFLEdBQUcsbUJBQUMsSUFBVyxFQUFDLENBQUMsYUFBYSxDQUFDLEdBQUcsZUFBZSxFQUFFLENBQUM7S0FDdkQ7O0lBSUQsTUFBTSxRQUFRLEdBQUcsRUFBRSxHQUFHLFVBQVUsQ0FBQzs7SUFLakMsTUFBTSxJQUFJLEdBQUcsQ0FBQyxJQUFJLFFBQVEsQ0FBQzs7SUFJM0IsTUFBTSxFQUFFLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQzs7SUFDM0IsTUFBTSxFQUFFLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQzs7SUFDM0IsTUFBTSxFQUFFLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQztJQUUzQixJQUFJLEVBQUUsRUFBRTtRQUNOLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUN4RCxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQztLQUM3RDtTQUFNO1FBQ0wsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3hELENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO0tBQzdEO0NBQ0Y7Ozs7QUFFRCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RDLE9BQU8sOEJBQThCLG1CQUNqQyx3QkFBd0IsRUFBMkQsR0FDbkYsWUFBWSxFQUFFLENBQUMsQ0FBQztDQUNyQjs7Ozs7Ozs7QUFTRCxNQUFNLFVBQVUsOEJBQThCLENBQzFDLEtBQTRELEVBQUUsUUFBbUI7O0lBQ25GLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDOUMsSUFBSSxRQUFRO1FBQUUsT0FBTyxRQUFRLENBQUM7O0lBRTlCLE1BQU0sS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5QixJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTs7UUFFM0IsS0FBSyxDQUFDLGFBQWEsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDO1FBQ3RDLEtBQUssQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQzNCLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO0tBQy9COztJQUVELE1BQU0sY0FBYyxHQUFHLGlCQUFpQixDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUMxRCxPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLEdBQUc7UUFDckMsTUFBTSxFQUFFLGNBQWM7UUFDdEIsS0FBSyxFQUFFLEtBQUs7UUFDWixJQUFJLEVBQUUsUUFBUTtRQUNkLEdBQUcsRUFBRSxDQUFDO1FBQ04sR0FBRyxFQUFFLENBQUM7UUFDTixHQUFHLEVBQUUsQ0FBQztRQUNOLEdBQUcsRUFBRSxDQUFDO1FBQ04sR0FBRyxFQUFFLENBQUM7UUFDTixHQUFHLEVBQUUsQ0FBQztRQUNOLEdBQUcsRUFBRSxDQUFDO1FBQ04sR0FBRyxFQUFFLENBQUM7UUFDTixJQUFJLEVBQUUsY0FBYyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxHQUFHO1FBQzNFLElBQUksRUFBRSxjQUFjLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUc7UUFDM0UsSUFBSSxFQUFFLGNBQWMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsR0FBRztRQUMzRSxJQUFJLEVBQUUsY0FBYyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxHQUFHO1FBQzNFLElBQUksRUFBRSxjQUFjLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUc7UUFDM0UsSUFBSSxFQUFFLGNBQWMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLElBQUksR0FBRyxjQUFjLENBQUMsR0FBRztRQUMzRSxJQUFJLEVBQUUsY0FBYyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHLGNBQWMsQ0FBQyxHQUFHO1FBQzNFLElBQUksRUFBRSxjQUFjLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDLEdBQUc7S0FDNUUsQ0FBQztDQUNIOzs7Ozs7QUFFRCxNQUFNLFVBQVUsV0FBVyxDQUFDLEtBQVksRUFBRSxJQUFlOzs7SUFHdkQsSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQztRQUMxQixLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FB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QUNwRCxNQUFNLEtBQUsscUJBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBd0IsRUFBQzs7SUFDN0UsTUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFJLEtBQUssQ0FBQyxDQUFDO0lBQ3ZDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixPQUFPLE9BQU8sQ0FBQztLQUNoQjtTQUFNOzs7OztRQUtMLE9BQU8sQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7S0FDdkI7Q0FDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge19nZXRWaWV3RGF0YSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCByZXNvbHZlRGlyZWN0aXZlLCBzZXRFbnZpcm9ubWVudH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZJbnRlcm5hbH0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtMSW5qZWN0b3J9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBESVJFQ1RJVkVTLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIFJFTkRFUkVSLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuY29uc3QgQkxPT01fTUFTSyA9IEJMT09NX1NJWkUgLSAxO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvciBUaGUgbm9kZSBpbmplY3RvciBpbiB3aGljaCB0aGUgZGlyZWN0aXZlIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChpbmplY3RvcjogTEluamVjdG9yLCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICBpZiAoaWQgPT0gbnVsbCkge1xuICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICB9XG5cbiAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgY29uc3QgYmxvb21CaXQgPSBpZCAmIEJMT09NX01BU0s7XG5cbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcblxuICBpZiAoYjcpIHtcbiAgICBiNiA/IChiNSA/IChpbmplY3Rvci5iZjcgfD0gbWFzaykgOiAoaW5qZWN0b3IuYmY2IHw9IG1hc2spKSA6XG4gICAgICAgICAoYjUgPyAoaW5qZWN0b3IuYmY1IHw9IG1hc2spIDogKGluamVjdG9yLmJmNCB8PSBtYXNrKSk7XG4gIH0gZWxzZSB7XG4gICAgYjYgPyAoYjUgPyAoaW5qZWN0b3IuYmYzIHw9IG1hc2spIDogKGluamVjdG9yLmJmMiB8PSBtYXNrKSkgOlxuICAgICAgICAgKGI1ID8gKGluamVjdG9yLmJmMSB8PSBtYXNrKSA6IChpbmplY3Rvci5iZjAgfD0gbWFzaykpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpOiBMSW5qZWN0b3Ige1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCgpO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGUsXG4gICAgICBfZ2V0Vmlld0RhdGEoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBob3N0VmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSk6IExJbmplY3RvciB7XG4gIGNvbnN0IGluamVjdG9yID0gZ2V0SW5qZWN0b3IodE5vZGUsIGhvc3RWaWV3KTtcbiAgaWYgKGluamVjdG9yKSByZXR1cm4gaW5qZWN0b3I7XG5cbiAgY29uc3QgdFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIC8vIFRPRE8oa2FyYSk6IFN0b3JlIG5vZGUgaW5qZWN0b3Igd2l0aCBob3N0IGJpbmRpbmdzIGZvciB0aGF0IG5vZGUgKHNlZSBWSUVXX0RBVEEubWQpXG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGhvc3RWaWV3Lmxlbmd0aDtcbiAgICB0Vmlldy5ibHVlcHJpbnQucHVzaChudWxsKTtcbiAgICB0Vmlldy5ob3N0QmluZGluZ1N0YXJ0SW5kZXgrKztcbiAgfVxuXG4gIGNvbnN0IHBhcmVudEluamVjdG9yID0gZ2V0UGFyZW50SW5qZWN0b3IodE5vZGUsIGhvc3RWaWV3KTtcbiAgcmV0dXJuIGhvc3RWaWV3W3ROb2RlLmluamVjdG9ySW5kZXhdID0ge1xuICAgIHBhcmVudDogcGFyZW50SW5qZWN0b3IsXG4gICAgdE5vZGU6IHROb2RlLFxuICAgIHZpZXc6IGhvc3RWaWV3LFxuICAgIGJmMDogMCxcbiAgICBiZjE6IDAsXG4gICAgYmYyOiAwLFxuICAgIGJmMzogMCxcbiAgICBiZjQ6IDAsXG4gICAgYmY1OiAwLFxuICAgIGJmNjogMCxcbiAgICBiZjc6IDAsXG4gICAgY2JmMDogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYwIHwgcGFyZW50SW5qZWN0b3IuYmYwLFxuICAgIGNiZjE6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmMSB8IHBhcmVudEluamVjdG9yLmJmMSxcbiAgICBjYmYyOiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjIgfCBwYXJlbnRJbmplY3Rvci5iZjIsXG4gICAgY2JmMzogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmYzIHwgcGFyZW50SW5qZWN0b3IuYmYzLFxuICAgIGNiZjQ6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNCB8IHBhcmVudEluamVjdG9yLmJmNCxcbiAgICBjYmY1OiBwYXJlbnRJbmplY3RvciA9PSBudWxsID8gMCA6IHBhcmVudEluamVjdG9yLmNiZjUgfCBwYXJlbnRJbmplY3Rvci5iZjUsXG4gICAgY2JmNjogcGFyZW50SW5qZWN0b3IgPT0gbnVsbCA/IDAgOiBwYXJlbnRJbmplY3Rvci5jYmY2IHwgcGFyZW50SW5qZWN0b3IuYmY2LFxuICAgIGNiZjc6IHBhcmVudEluamVjdG9yID09IG51bGwgPyAwIDogcGFyZW50SW5qZWN0b3IuY2JmNyB8IHBhcmVudEluamVjdG9yLmJmNyxcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9yKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXdEYXRhKTogTEluamVjdG9yfG51bGwge1xuICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkge1xuICAgIHJldHVybiBudWxsO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2aWV3W3ROb2RlLmluamVjdG9ySW5kZXhdO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3Rvcih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3RGF0YSk6IExJbmplY3RvciB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHZpZXdbdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXhdO1xuICB9XG5cbiAgLy8gRm9yIG1vc3QgY2FzZXMsIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggY2FuIGJlIGZvdW5kIG9uIHRoZSBob3N0IG5vZGUgKGUuZy4gZm9yIGNvbXBvbmVudFxuICAvLyBvciBjb250YWluZXIpLCBzbyB0aGlzIGxvb3Agd2lsbCBiZSBza2lwcGVkLCBidXQgd2UgbXVzdCBrZWVwIHRoZSBsb29wIGhlcmUgdG8gc3VwcG9ydFxuICAvLyB0aGUgcmFyZXIgY2FzZSBvZiBkZWVwbHkgbmVzdGVkIDxuZy10ZW1wbGF0ZT4gdGFncy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXTtcbiAgd2hpbGUgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICB2aWV3ID0gdmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSAhO1xuICB9XG4gIHJldHVybiBob3N0VE5vZGUgPyB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICFbaG9zdFROb2RlLmluamVjdG9ySW5kZXhdIDogbnVsbDtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKGRpOiBMSW5qZWN0b3IsIGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBibG9vbUFkZChkaSwgZGVmLnR5cGUpO1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGVmIFRoZSBkZWZpbml0aW9uIG9mIHRoZSBkaXJlY3RpdmUgdG8gYmUgbWFkZSBwdWJsaWNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpUHVibGljKGRlZjogRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIHRva2VuLCBmbGFncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCkpO1xufVxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKGRpOiBMSW5qZWN0b3IpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IGRpLnZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIG5vZGVJbmplY3RvcjogTEluamVjdG9yLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbik7XG4gIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnZnVuY3Rpb24nKSByZXR1cm4gYmxvb21IYXNoKCk7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKSBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggIT0gbnVsbCkge1xuICAgIGxldCBpbmplY3RvcjogTEluamVjdG9yfG51bGwgPSBub2RlSW5qZWN0b3I7XG5cbiAgICB3aGlsZSAoaW5qZWN0b3IpIHtcbiAgICAgIC8vIEdldCB0aGUgY2xvc2VzdCBwb3RlbnRpYWwgbWF0Y2hpbmcgaW5qZWN0b3IgKHVwd2FyZHMgaW4gdGhlIGluamVjdG9yIHRyZWUpIHRoYXRcbiAgICAgIC8vICpwb3RlbnRpYWxseSogaGFzIHRoZSB0b2tlbi5cbiAgICAgIGluamVjdG9yID0gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihpbmplY3RvciwgYmxvb21IYXNoLCBmbGFncyk7XG5cbiAgICAgIC8vIElmIG5vIGluamVjdG9yIGlzIGZvdW5kLCB3ZSAqa25vdyogdGhhdCB0aGVyZSBpcyBubyBhbmNlc3RvciBpbmplY3RvciB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgLy8gdG9rZW4sIHNvIHdlIGFib3J0LlxuICAgICAgaWYgKCFpbmplY3Rvcikge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3QgdE5vZGUgPSBpbmplY3Rvci50Tm9kZTtcbiAgICAgIGNvbnN0IGluamVjdG9yVmlldyA9IGluamVjdG9yLnZpZXc7XG4gICAgICBjb25zdCBub2RlRmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgICAgIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgICAgIGlmIChjb3VudCAhPT0gMCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICAgICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICAgICAgY29uc3QgZGVmcyA9IGluamVjdG9yVmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuXG4gICAgICAgIGZvciAobGV0IGkgPSBzdGFydDsgaSA8IGVuZDsgaSsrKSB7XG4gICAgICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgICAgICBjb25zdCBkaXJlY3RpdmVEZWYgPSBkZWZzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICAgICAgaWYgKGRpcmVjdGl2ZURlZi50eXBlID09PSB0b2tlbiAmJiBkaXJlY3RpdmVEZWYuZGlQdWJsaWMpIHtcbiAgICAgICAgICAgIHJldHVybiBpbmplY3RvclZpZXdbRElSRUNUSVZFU10gIVtpXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgKmRpZG4ndCogZmluZCB0aGUgZGlyZWN0aXZlIGZvciB0aGUgdG9rZW4gYW5kIHdlIGFyZSBzZWFyY2hpbmcgdGhlIGN1cnJlbnQgbm9kZSdzXG4gICAgICAvLyBpbmplY3RvciwgaXQncyBwb3NzaWJsZSB0aGUgZGlyZWN0aXZlIGlzIG9uIHRoaXMgbm9kZSBhbmQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG4gICAgICBsZXQgaW5zdGFuY2U6IFR8bnVsbDtcbiAgICAgIGlmIChpbmplY3RvciA9PT0gbm9kZUluamVjdG9yICYmXG4gICAgICAgICAgKGluc3RhbmNlID0gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KHRva2VuLCBpbmplY3RvclZpZXdbVFZJRVddKSkpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgLy8gSWYgZmxhZ3MgcGVybWl0LCB0cmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fCBmbGFncyAmIEluamVjdEZsYWdzLkhvc3QgJiYgIXNhbWVIb3N0VmlldyhpbmplY3RvcikpIHtcbiAgICAgICAgaW5qZWN0b3IgPSBudWxsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBub2RlSW5qZWN0b3Iudmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGZvcm1lckluamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKG1vZHVsZUluamVjdG9yKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q3VycmVudEluamVjdG9yKGZvcm1lckluamVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4odG9rZW46IGFueSwgaG9zdFRWaWV3OiBUVmlldyk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBob3N0VFZpZXcuY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZkludGVybmFsPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlRGlyZWN0aXZlKGRlZiwgaSArIDEsIG1hdGNoZXMsIGhvc3RUVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlciB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGRpcmVjdGl2ZSBtaWdodCBiZSBwcm92aWRlZCBieSB0aGUgaW5qZWN0b3IuXG4gKlxuICogV2hlbiBhIGRpcmVjdGl2ZSBpcyBwdWJsaWMsIGl0IGlzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIgYW5kIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIFR5cGUuIFdoZW4gdGhlIGRpcmVjdGl2ZSBpc24ndCBwdWJsaWMgb3IgdGhlIHRva2VuIGlzIG5vdCBhIGRpcmVjdGl2ZSBgbnVsbGBcbiAqIGlzIHJldHVybmVkIGFzIHRoZSBub2RlIGluamVjdG9yIGNhbiBub3QgcG9zc2libHkgcHJvdmlkZSB0aGF0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgaW5qZWN0aW9uIHRva2VuXG4gKiBAcmV0dXJucyB0aGUgbWF0Y2hpbmcgYml0IHRvIGNoZWNrIGluIHRoZSBibG9vbSBmaWx0ZXIgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBpcyBub3Qga25vd24uXG4gKi9cbmZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogbnVtYmVyfEZ1bmN0aW9ufHVuZGVmaW5lZCB7XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXSB8fCBudWxsO1xuICByZXR1cm4gdHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBjbG9zZXN0IGluamVjdG9yIHRoYXQgbWlnaHQgaGF2ZSBhIGNlcnRhaW4gZGlyZWN0aXZlLlxuICpcbiAqIEVhY2ggZGlyZWN0aXZlIGNvcnJlc3BvbmRzIHRvIGEgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLiBHaXZlbiB0aGUgYmxvb20gYml0IHRvXG4gKiBjaGVjayBhbmQgYSBzdGFydGluZyBpbmplY3RvciwgdGhpcyBmdW5jdGlvbiB0cmF2ZXJzZXMgdXAgaW5qZWN0b3JzIHVudGlsIGl0IGZpbmRzIGFuXG4gKiBpbmplY3RvciB0aGF0IGNvbnRhaW5zIGEgMSBmb3IgdGhhdCBiaXQgaW4gaXRzIGJsb29tIGZpbHRlci4gQSAxIGluZGljYXRlcyB0aGF0IHRoZVxuICogaW5qZWN0b3IgbWF5IGhhdmUgdGhhdCBkaXJlY3RpdmUuIEl0IG9ubHkgKm1heSogaGF2ZSB0aGUgZGlyZWN0aXZlIGJlY2F1c2UgZGlyZWN0aXZlcyBiZWdpblxuICogdG8gc2hhcmUgYmxvb20gZmlsdGVyIGJpdHMgYWZ0ZXIgdGhlIEJMT09NX1NJWkUgaXMgcmVhY2hlZCwgYW5kIGl0IGNvdWxkIGNvcnJlc3BvbmQgdG8gYVxuICogZGlmZmVyZW50IGRpcmVjdGl2ZSBzaGFyaW5nIHRoZSBiaXQuXG4gKlxuICogTm90ZTogV2UgY2FuIHNraXAgY2hlY2tpbmcgZnVydGhlciBpbmplY3RvcnMgdXAgdGhlIHRyZWUgaWYgYW4gaW5qZWN0b3IncyBjYmYgc3RydWN0dXJlXG4gKiBoYXMgYSAwIGZvciB0aGF0IGJsb29tIGJpdC4gU2luY2UgY2JmIGNvbnRhaW5zIHRoZSBtZXJnZWQgdmFsdWUgb2YgYWxsIHRoZSBwYXJlbnRcbiAqIGluamVjdG9ycywgYSAwIGluIHRoZSBibG9vbSBiaXQgaW5kaWNhdGVzIHRoYXQgdGhlIHBhcmVudHMgZGVmaW5pdGVseSBkbyBub3QgY29udGFpblxuICogdGhlIGRpcmVjdGl2ZSBhbmQgZG8gbm90IG5lZWQgdG8gYmUgY2hlY2tlZC5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3IgVGhlIHN0YXJ0aW5nIG5vZGUgaW5qZWN0b3IgdG8gY2hlY2tcbiAqIEBwYXJhbSAgYmxvb21CaXQgVGhlIGJpdCB0byBjaGVjayBpbiBlYWNoIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyXG4gKiBAcGFyYW0gIGZsYWdzIFRoZSBpbmplY3Rpb24gZmxhZ3MgZm9yIHRoaXMgaW5qZWN0aW9uIHNpdGUgKGUuZy4gT3B0aW9uYWwgb3IgU2tpcFNlbGYpXG4gKiBAcmV0dXJucyBBbiBpbmplY3RvciB0aGF0IG1pZ2h0IGhhdmUgdGhlIGRpcmVjdGl2ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21GaW5kUG9zc2libGVJbmplY3RvcihcbiAgICBzdGFydEluamVjdG9yOiBMSW5qZWN0b3IsIGJsb29tQml0OiBudW1iZXIsIGZsYWdzOiBJbmplY3RGbGFncyk6IExJbmplY3RvcnxudWxsIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcbiAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcblxuICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmUgKmlzbid0KiBhXG4gIC8vIG1hdGNoLlxuICBsZXQgaW5qZWN0b3I6IExJbmplY3RvcnxudWxsID1cbiAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYgPyBzdGFydEluamVjdG9yLnBhcmVudCA6IHN0YXJ0SW5qZWN0b3I7XG5cbiAgd2hpbGUgKGluamVjdG9yKSB7XG4gICAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gICAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gICAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICAgIGlmIChiNykge1xuICAgICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yLmJmNyA6IGluamVjdG9yLmJmNikgOiAoYjUgPyBpbmplY3Rvci5iZjUgOiBpbmplY3Rvci5iZjQpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3IuYmYzIDogaW5qZWN0b3IuYmYyKSA6IChiNSA/IGluamVjdG9yLmJmMSA6IGluamVjdG9yLmJmMCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAgIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gICAgaWYgKHZhbHVlICYgbWFzaykge1xuICAgICAgcmV0dXJuIGluamVjdG9yO1xuICAgIH1cblxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHwgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmICFzYW1lSG9zdFZpZXcoaW5qZWN0b3IpKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBJZiB0aGUgY3VycmVudCBpbmplY3RvciBkb2VzIG5vdCBoYXZlIHRoZSBkaXJlY3RpdmUsIGNoZWNrIHRoZSBibG9vbSBmaWx0ZXJzIGZvciB0aGUgYW5jZXN0b3JcbiAgICAvLyBpbmplY3RvcnMgKGNiZjAgLSBjYmY3KS4gVGhlc2UgZmlsdGVycyBjYXB0dXJlICphbGwqIGFuY2VzdG9yIGluamVjdG9ycy5cbiAgICBpZiAoYjcpIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5jYmY3IDogaW5qZWN0b3IuY2JmNikgOiAoYjUgPyBpbmplY3Rvci5jYmY1IDogaW5qZWN0b3IuY2JmNCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3Rvci5jYmYzIDogaW5qZWN0b3IuY2JmMikgOiAoYjUgPyBpbmplY3Rvci5jYmYxIDogaW5qZWN0b3IuY2JmMCk7XG4gICAgfVxuXG4gICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlIHVwIHRvXG4gICAgLy8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZSBjYW4gYWJvcnQuXG4gICAgaWYgKHZhbHVlICYgbWFzaykge1xuICAgICAgaW5qZWN0b3IgPSBpbmplY3Rvci5wYXJlbnQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcoaW5qZWN0b3I6IExJbmplY3Rvcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFpbmplY3Rvci5wYXJlbnQgJiYgaW5qZWN0b3IucGFyZW50LnZpZXcgPT09IGluamVjdG9yLnZpZXc7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgX2xJbmplY3RvcjogTEluamVjdG9yKSB7fVxuXG4gIGdldCh0b2tlbjogYW55KTogYW55IHtcbiAgICBpZiAodG9rZW4gPT09IFJlbmRlcmVyMikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHRoaXMuX2xJbmplY3Rvcik7XG4gICAgfVxuXG4gICAgc2V0RW52aXJvbm1lbnQodGhpcy5fbEluamVjdG9yLnROb2RlLCB0aGlzLl9sSW5qZWN0b3Iudmlldyk7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSh0aGlzLl9sSW5qZWN0b3IsIHRva2VuKTtcbiAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIGdldEZhY3RvcnlPZjxUPih0eXBlOiBUeXBlPGFueT4pOiAoKHR5cGU/OiBUeXBlPFQ+KSA9PiBUKXxudWxsIHtcbiAgY29uc3QgdHlwZUFueSA9IHR5cGUgYXMgYW55O1xuICBjb25zdCBkZWYgPSBnZXRDb21wb25lbnREZWY8VD4odHlwZUFueSkgfHwgZ2V0RGlyZWN0aXZlRGVmPFQ+KHR5cGVBbnkpIHx8XG4gICAgICBnZXRQaXBlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdGFibGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0b3JEZWY8VD4odHlwZUFueSk7XG4gIGlmICghZGVmIHx8IGRlZi5mYWN0b3J5ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGVmLmZhY3Rvcnk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRJbmhlcml0ZWRGYWN0b3J5PFQ+KHR5cGU6IFR5cGU8YW55Pik6ICh0eXBlOiBUeXBlPFQ+KSA9PiBUIHtcbiAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodHlwZS5wcm90b3R5cGUpLmNvbnN0cnVjdG9yIGFzIFR5cGU8YW55PjtcbiAgY29uc3QgZmFjdG9yeSA9IGdldEZhY3RvcnlPZjxUPihwcm90byk7XG4gIGlmIChmYWN0b3J5ICE9PSBudWxsKSB7XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH0gZWxzZSB7XG4gICAgLy8gVGhlcmUgaXMgbm8gZmFjdG9yeSBkZWZpbmVkLiBFaXRoZXIgdGhpcyB3YXMgaW1wcm9wZXIgdXNhZ2Ugb2YgaW5oZXJpdGFuY2VcbiAgICAvLyAobm8gQW5ndWxhciBkZWNvcmF0b3Igb24gdGhlIHN1cGVyY2xhc3MpIG9yIHRoZXJlIGlzIG5vIGNvbnN0cnVjdG9yIGF0IGFsbFxuICAgIC8vIGluIHRoZSBpbmhlcml0YW5jZSBjaGFpbi4gU2luY2UgdGhlIHR3byBjYXNlcyBjYW5ub3QgYmUgZGlzdGluZ3Vpc2hlZCwgdGhlXG4gICAgLy8gbGF0dGVyIGhhcyB0byBiZSBhc3N1bWVkLlxuICAgIHJldHVybiAodCkgPT4gbmV3IHQoKTtcbiAgfVxufVxuIl19