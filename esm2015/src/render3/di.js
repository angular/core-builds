/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
// We are temporarily importing the existing viewEngine_from core so we can be sure we are
// correctly implementing its interfaces for backwards compatibility.
import { getInjectableDef, getInjectorDef } from '../di/defs';
import { inject, setCurrentInjector } from '../di/injector';
import { Renderer2 } from '../render';
import { assertDefined } from './assert';
import { getComponentDef, getDirectiveDef, getPipeDef } from './definition';
import { NG_ELEMENT_ID } from './fields';
import { _getViewData, getPreviousOrParentTNode, resolveDirective, setEnvironment } from './instructions';
import { PARENT_INJECTOR, TNODE, } from './interfaces/injector';
import { isProceduralRenderer } from './interfaces/renderer';
import { DECLARATION_VIEW, HOST_NODE, INJECTOR, RENDERER, TVIEW } from './interfaces/view';
import { assertNodeOfPossibleTypes } from './node_assert';
/**
 * The number of slots in each bloom filter (used by DI). The larger this number, the fewer
 * directives that will share slots, and thus, the fewer false positives when checking for
 * the existence of a directive.
 */
const BLOOM_SIZE = 256;
const BLOOM_MASK = BLOOM_SIZE - 1;
/** Counter used to generate unique IDs for directives. */
let nextNgElementId = 0;
/**
 * Registers this directive as present in its node's injector by flipping the directive's
 * corresponding bit in the injector's bloom filter.
 *
 * @param injectorIndex The index of the node injector where this token should be registered
 * @param tView The TView for the injector's bloom filters
 * @param type The directive token to register
 */
export function bloomAdd(injectorIndex, tView, type) {
    if (tView.firstTemplatePass) {
        let id = type[NG_ELEMENT_ID];
        // Set a unique ID on the directive type, so if something tries to inject the directive,
        // we can easily retrieve the ID and hash it into the bloom bit that should be checked.
        if (id == null) {
            id = type[NG_ELEMENT_ID] = nextNgElementId++;
        }
        // We only have BLOOM_SIZE (256) slots in our bloom filter (8 buckets * 32 bits each),
        // so all unique IDs must be modulo-ed into a number from 0 - 255 to fit into the filter.
        const bloomBit = id & BLOOM_MASK;
        // Create a mask that targets the specific bit associated with the directive.
        // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
        // to bit positions 0 - 31 in a 32 bit integer.
        const mask = 1 << bloomBit;
        // Use the raw bloomBit number to determine which bloom filter bucket we should check
        // e.g: bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc
        const b7 = bloomBit & 0x80;
        const b6 = bloomBit & 0x40;
        const b5 = bloomBit & 0x20;
        const tData = tView.data;
        if (b7) {
            b6 ? (b5 ? (tData[injectorIndex + 7] |= mask) : (tData[injectorIndex + 6] |= mask)) :
                (b5 ? (tData[injectorIndex + 5] |= mask) : (tData[injectorIndex + 4] |= mask));
        }
        else {
            b6 ? (b5 ? (tData[injectorIndex + 3] |= mask) : (tData[injectorIndex + 2] |= mask)) :
                (b5 ? (tData[injectorIndex + 1] |= mask) : (tData[injectorIndex] |= mask));
        }
    }
}
export function getOrCreateNodeInjector() {
    return getOrCreateNodeInjectorForNode(getPreviousOrParentTNode(), _getViewData());
}
/**
 * Creates (or gets an existing) injector for a given element or container.
 *
 * @param tNode for which an injector should be retrieved / created.
 * @param hostView View where the node is stored
 * @returns Node injector
 */
export function getOrCreateNodeInjectorForNode(tNode, hostView) {
    const existingInjectorIndex = getInjectorIndex(tNode, hostView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    const tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        tNode.injectorIndex = hostView.length;
        setUpBloom(tView.data, tNode); // foundation for node bloom
        setUpBloom(hostView, null); // foundation for cumulative bloom
        setUpBloom(tView.blueprint, null);
    }
    const parentLoc = getParentInjectorLocation(tNode, hostView);
    const parentIndex = parentLoc & 32767 /* InjectorIndexMask */;
    const parentView = getParentInjectorView(parentLoc, hostView);
    const parentData = parentView[TVIEW].data;
    const injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (parentLoc !== -1) {
        for (let i = 0; i < PARENT_INJECTOR; i++) {
            const bloomIndex = parentIndex + i;
            // Creates a cumulative bloom filter that merges the parent's bloom filter
            // and its own cumulative bloom (which contains tokens for all ancestors)
            hostView[injectorIndex + i] = parentView[bloomIndex] | parentData[bloomIndex];
        }
    }
    hostView[injectorIndex + PARENT_INJECTOR] = parentLoc;
    return injectorIndex;
}
function setUpBloom(arr, footer) {
    arr.push(0, 0, 0, 0, 0, 0, 0, 0, footer);
}
export function getInjectorIndex(tNode, hostView) {
    if (tNode.injectorIndex === -1 ||
        // If the injector index is the same as its parent's injector index, then the index has been
        // copied down from the parent node. No injector has been created yet on this node.
        (tNode.parent && tNode.parent.injectorIndex === tNode.injectorIndex) ||
        // After the first template pass, the injector index might exist but the parent values
        // might not have been calculated yet for this instance
        hostView[tNode.injectorIndex + PARENT_INJECTOR] == null) {
        return -1;
    }
    else {
        return tNode.injectorIndex;
    }
}
/**
 * Finds the index of the parent injector, with a view offset if applicable. Used to set the
 * parent injector initially.
 */
export function getParentInjectorLocation(tNode, view) {
    if (tNode.parent && tNode.parent.injectorIndex !== -1) {
        return tNode.parent.injectorIndex; // view offset is 0
    }
    // For most cases, the parent injector index can be found on the host node (e.g. for component
    // or container), so this loop will be skipped, but we must keep the loop here to support
    // the rarer case of deeply nested <ng-template> tags or inline views.
    let hostTNode = view[HOST_NODE];
    let viewOffset = 1;
    while (hostTNode && hostTNode.injectorIndex === -1) {
        view = view[DECLARATION_VIEW];
        hostTNode = view[HOST_NODE];
        viewOffset++;
    }
    return hostTNode ?
        hostTNode.injectorIndex | (viewOffset << 15 /* ViewOffsetShift */) :
        -1;
}
/**
 * Unwraps a parent injector location number to find the view offset from the current injector,
 * then walks up the declaration view tree until the view is found that contains the parent
 * injector.
 *
 * @param location The location of the parent injector, which contains the view offset
 * @param startView The LViewData instance from which to start walking up the view tree
 * @returns The LViewData instance that contains the parent injector
 */
export function getParentInjectorView(location, startView) {
    let viewOffset = location >> 15 /* ViewOffsetShift */;
    let parentView = startView;
    // For most cases, the parent injector can be found on the host node (e.g. for component
    // or container), but we must keep the loop here to support the rarer case of deeply nested
    // <ng-template> tags or inline views, where the parent injector might live many views
    // above the child injector.
    while (viewOffset > 0) {
        parentView = parentView[DECLARATION_VIEW];
        viewOffset--;
    }
    return parentView;
}
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param di The node injector in which a directive will be added
 * @param def The definition of the directive to be made public
 */
export function diPublicInInjector(injectorIndex, view, def) {
    bloomAdd(injectorIndex, view[TVIEW], def.type);
}
/**
 * Makes a directive public to the DI system by adding it to an injector's bloom filter.
 *
 * @param def The definition of the directive to be made public
 */
export function diPublic(def) {
    diPublicInInjector(getOrCreateNodeInjector(), _getViewData(), def);
}
export function directiveInject(token, flags = 0 /* Default */) {
    const hostTNode = getPreviousOrParentTNode();
    return getOrCreateInjectable(hostTNode, _getViewData(), token, flags);
}
export function injectRenderer2() {
    return getOrCreateRenderer2(_getViewData());
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
    const tNode = getPreviousOrParentTNode();
    ngDevMode && assertNodeOfPossibleTypes(tNode, 0 /* Container */, 3 /* Element */, 4 /* ElementContainer */);
    ngDevMode && assertDefined(tNode, 'expecting tNode');
    const attrs = tNode.attrs;
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
function getOrCreateRenderer2(view) {
    const renderer = view[RENDERER];
    if (isProceduralRenderer(renderer)) {
        return renderer;
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
 * @param nodeInjector Node injector where the search should start
 * @param token The token to look for
 * @param flags Injection flags
 * @returns the value from the injector or `null` when not found
 */
export function getOrCreateInjectable(hostTNode, hostView, token, flags = 0 /* Default */) {
    const bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function')
        return bloomHash();
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash != null) {
        const startInjectorIndex = getInjectorIndex(hostTNode, hostView);
        let injectorIndex = startInjectorIndex;
        let injectorView = hostView;
        let parentLocation = -1;
        // If we should skip this injector or if an injector doesn't exist on this node (e.g. all
        // directives on this node are private), start by searching the parent injector.
        if (flags & 4 /* SkipSelf */ || injectorIndex === -1) {
            parentLocation = injectorIndex === -1 ? getParentInjectorLocation(hostTNode, hostView) :
                injectorView[injectorIndex + PARENT_INJECTOR];
            if (shouldNotSearchParent(flags, parentLocation)) {
                injectorIndex = -1;
            }
            else {
                injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
                injectorView = getParentInjectorView(parentLocation, injectorView);
            }
        }
        while (injectorIndex !== -1) {
            // Traverse up the injector tree until we find a potential match or until we know there
            // *isn't* a match. Outer loop is necessary in case we get a false positive injector.
            while (injectorIndex !== -1) {
                // Check the current injector. If it matches, stop searching for an injector.
                if (injectorHasToken(bloomHash, injectorIndex, injectorView[TVIEW].data)) {
                    break;
                }
                parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
                if (shouldNotSearchParent(flags, parentLocation)) {
                    injectorIndex = -1;
                    break;
                }
                // If the ancestor bloom filter value has the bit corresponding to the directive, traverse
                // up to find the specific injector. If the ancestor bloom filter does not have the bit, we
                // can abort.
                if (injectorHasToken(bloomHash, injectorIndex, injectorView)) {
                    injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
                    injectorView = getParentInjectorView(parentLocation, injectorView);
                }
                else {
                    injectorIndex = -1;
                    break;
                }
            }
            // If no injector is found, we *know* that there is no ancestor injector that contains the
            // token, so we abort.
            if (injectorIndex === -1) {
                break;
            }
            // At this point, we have an injector which *may* contain the token, so we step through the
            // directives associated with the injector's corresponding node to get the directive instance.
            let instance;
            if (instance = searchDirectivesOnInjector(injectorIndex, injectorView, token)) {
                return instance;
            }
            // If we *didn't* find the directive for the token and we are searching the current node's
            // injector, it's possible the directive is on this node and hasn't been created yet.
            if (injectorIndex === startInjectorIndex && hostView === injectorView &&
                (instance = searchMatchesQueuedForCreation(token, injectorView[TVIEW]))) {
                return instance;
            }
            // The def wasn't found anywhere on this node, so it was a false positive.
            // Traverse up the tree and continue searching.
            injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
            injectorView = getParentInjectorView(parentLocation, injectorView);
        }
    }
    const moduleInjector = hostView[INJECTOR];
    const formerInjector = setCurrentInjector(moduleInjector);
    try {
        return inject(token, flags);
    }
    finally {
        setCurrentInjector(formerInjector);
    }
}
function searchMatchesQueuedForCreation(token, hostTView) {
    const matches = hostTView.currentMatches;
    if (matches) {
        for (let i = 0; i < matches.length; i += 2) {
            const def = matches[i];
            if (def.type === token) {
                return resolveDirective(def, i + 1, matches);
            }
        }
    }
    return null;
}
function searchDirectivesOnInjector(injectorIndex, injectorView, token) {
    const tNode = injectorView[TVIEW].data[injectorIndex + TNODE];
    const nodeFlags = tNode.flags;
    const count = nodeFlags & 4095 /* DirectiveCountMask */;
    if (count !== 0) {
        const start = nodeFlags >> 15 /* DirectiveStartingIndexShift */;
        const end = start + count;
        const defs = injectorView[TVIEW].data;
        for (let i = start; i < end; i++) {
            // Get the definition for the directive at this index and, if it is injectable (diPublic),
            // and matches the given token, return the directive instance.
            const directiveDef = defs[i];
            if (directiveDef.type === token && directiveDef.diPublic) {
                return injectorView[i];
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
export function bloomHashBitOrFactory(token) {
    const tokenId = token[NG_ELEMENT_ID];
    return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
}
export function injectorHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    const mask = 1 << bloomHash;
    const b7 = bloomHash & 0x80;
    const b6 = bloomHash & 0x40;
    const b5 = bloomHash & 0x20;
    // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
    // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
    // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
    let value;
    if (b7) {
        value = b6 ? (b5 ? injectorView[injectorIndex + 7] : injectorView[injectorIndex + 6]) :
            (b5 ? injectorView[injectorIndex + 5] : injectorView[injectorIndex + 4]);
    }
    else {
        value = b6 ? (b5 ? injectorView[injectorIndex + 3] : injectorView[injectorIndex + 2]) :
            (b5 ? injectorView[injectorIndex + 1] : injectorView[injectorIndex]);
    }
    // If the bloom filter value has the bit corresponding to the directive's bloomBit flipped on,
    // this injector is a potential match.
    return !!(value & mask);
}
/** Returns true if flags prevent parent injector from being searched for tokens */
function shouldNotSearchParent(flags, parentLocation) {
    return flags & 2 /* Self */ ||
        (flags & 1 /* Host */ && (parentLocation >> 15 /* ViewOffsetShift */) > 0);
}
export class NodeInjector {
    constructor(_tNode, _hostView) {
        this._tNode = _tNode;
        this._hostView = _hostView;
        this._injectorIndex = getOrCreateNodeInjectorForNode(_tNode, _hostView);
    }
    get(token) {
        if (token === Renderer2) {
            return getOrCreateRenderer2(this._hostView);
        }
        setEnvironment(this._tNode, this._hostView);
        return getOrCreateInjectable(this._tNode, this._hostView, token);
    }
}
export function getFactoryOf(type) {
    const typeAny = type;
    const def = getComponentDef(typeAny) || getDirectiveDef(typeAny) ||
        getPipeDef(typeAny) || getInjectableDef(typeAny) || getInjectorDef(typeAny);
    if (!def || def.factory === undefined) {
        return null;
    }
    return def.factory;
}
export function getInheritedFactory(type) {
    const proto = Object.getPrototypeOf(type.prototype).constructor;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBGQUEwRjtBQUMxRixxRUFBcUU7QUFFckUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXNDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUEwQix3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoSSxPQUFPLEVBQXdCLGVBQWUsRUFBRSxLQUFLLEdBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBcUIsUUFBUSxFQUFTLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzFILE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4RDs7OztHQUlHO0FBQ0gsTUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLE1BQU0sVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFFbEMsMERBQTBEO0FBQzFELElBQUksZUFBZSxHQUFHLENBQUMsQ0FB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LDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDRCQUE0QjtRQUM1QixPQUFPLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO0tBQ3ZCO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuLy8gV2UgYXJlIHRlbXBvcmFyaWx5IGltcG9ydGluZyB0aGUgZXhpc3Rpbmcgdmlld0VuZ2luZV9mcm9tIGNvcmUgc28gd2UgY2FuIGJlIHN1cmUgd2UgYXJlXG4vLyBjb3JyZWN0bHkgaW1wbGVtZW50aW5nIGl0cyBpbnRlcmZhY2VzIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eS5cblxuaW1wb3J0IHtnZXRJbmplY3RhYmxlRGVmLCBnZXRJbmplY3RvckRlZn0gZnJvbSAnLi4vZGkvZGVmcyc7XG5pbXBvcnQge0luamVjdGlvblRva2VufSBmcm9tICcuLi9kaS9pbmplY3Rpb25fdG9rZW4nO1xuaW1wb3J0IHtJbmplY3RGbGFncywgSW5qZWN0b3IsIE51bGxJbmplY3RvciwgaW5qZWN0LCBzZXRDdXJyZW50SW5qZWN0b3J9IGZyb20gJy4uL2RpL2luamVjdG9yJztcbmltcG9ydCB7UmVuZGVyZXIyfSBmcm9tICcuLi9yZW5kZXInO1xuaW1wb3J0IHtUeXBlfSBmcm9tICcuLi90eXBlJztcblxuaW1wb3J0IHthc3NlcnREZWZpbmVkfSBmcm9tICcuL2Fzc2VydCc7XG5pbXBvcnQge2dldENvbXBvbmVudERlZiwgZ2V0RGlyZWN0aXZlRGVmLCBnZXRQaXBlRGVmfSBmcm9tICcuL2RlZmluaXRpb24nO1xuaW1wb3J0IHtOR19FTEVNRU5UX0lEfSBmcm9tICcuL2ZpZWxkcyc7XG5pbXBvcnQge19nZXRWaWV3RGF0YSwgYXNzZXJ0UHJldmlvdXNJc1BhcmVudCwgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlLCByZXNvbHZlRGlyZWN0aXZlLCBzZXRFbnZpcm9ubWVudH0gZnJvbSAnLi9pbnN0cnVjdGlvbnMnO1xuaW1wb3J0IHtEaXJlY3RpdmVEZWZ9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SW5qZWN0b3JMb2NhdGlvbkZsYWdzLCBQQVJFTlRfSU5KRUNUT1IsIFROT0RFLH0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX1ZJRVcsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgUEFSRU5ULCBSRU5ERVJFUiwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAgIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gICAgfVxuXG4gICAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICAgIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gICAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gICAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAgIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gICAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gICAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gICAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG4gICAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhIGFzIG51bWJlcltdO1xuXG4gICAgaWYgKGI3KSB7XG4gICAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgN10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDZdIHw9IG1hc2spKSA6XG4gICAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDRdIHw9IG1hc2spKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDNdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyAyXSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDFdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXhdIHw9IG1hc2spKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IG51bWJlciB7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZSxcbiAgICAgIF9nZXRWaWV3RGF0YSgpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIGhvc3RWaWV3IFZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgaG9zdFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgdE5vZGUuaW5qZWN0b3JJbmRleCA9IGhvc3RWaWV3Lmxlbmd0aDtcbiAgICBzZXRVcEJsb29tKHRWaWV3LmRhdGEsIHROb2RlKTsgIC8vIGZvdW5kYXRpb24gZm9yIG5vZGUgYmxvb21cbiAgICBzZXRVcEJsb29tKGhvc3RWaWV3LCBudWxsKTsgICAgIC8vIGZvdW5kYXRpb24gZm9yIGN1bXVsYXRpdmUgYmxvb21cbiAgICBzZXRVcEJsb29tKHRWaWV3LmJsdWVwcmludCwgbnVsbCk7XG4gIH1cblxuICBjb25zdCBwYXJlbnRMb2MgPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBob3N0Vmlldyk7XG4gIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50TG9jICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICBjb25zdCBwYXJlbnRWaWV3OiBMVmlld0RhdGEgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jLCBob3N0Vmlldyk7XG5cbiAgY29uc3QgcGFyZW50RGF0YSA9IHBhcmVudFZpZXdbVFZJRVddLmRhdGEgYXMgYW55O1xuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICAvLyBJZiBhIHBhcmVudCBpbmplY3RvciBjYW4ndCBiZSBmb3VuZCwgaXRzIGxvY2F0aW9uIGlzIHNldCB0byAtMS5cbiAgLy8gSW4gdGhhdCBjYXNlLCB3ZSBkb24ndCBuZWVkIHRvIHNldCB1cCBhIGN1bXVsYXRpdmUgYmxvb21cbiAgaWYgKHBhcmVudExvYyAhPT0gLTEpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IFBBUkVOVF9JTkpFQ1RPUjsgaSsrKSB7XG4gICAgICBjb25zdCBibG9vbUluZGV4ID0gcGFyZW50SW5kZXggKyBpO1xuICAgICAgLy8gQ3JlYXRlcyBhIGN1bXVsYXRpdmUgYmxvb20gZmlsdGVyIHRoYXQgbWVyZ2VzIHRoZSBwYXJlbnQncyBibG9vbSBmaWx0ZXJcbiAgICAgIC8vIGFuZCBpdHMgb3duIGN1bXVsYXRpdmUgYmxvb20gKHdoaWNoIGNvbnRhaW5zIHRva2VucyBmb3IgYWxsIGFuY2VzdG9ycylcbiAgICAgIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBpXSA9IHBhcmVudFZpZXdbYmxvb21JbmRleF0gfCBwYXJlbnREYXRhW2Jsb29tSW5kZXhdO1xuICAgIH1cbiAgfVxuXG4gIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdID0gcGFyZW50TG9jO1xuICByZXR1cm4gaW5qZWN0b3JJbmRleDtcbn1cblxuZnVuY3Rpb24gc2V0VXBCbG9vbShhcnI6IGFueVtdLCBmb290ZXI6IFROb2RlIHwgbnVsbCkge1xuICBhcnIucHVzaCgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCBmb290ZXIpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBudW1iZXIge1xuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIC8vIElmIHRoZSBpbmplY3RvciBpbmRleCBpcyB0aGUgc2FtZSBhcyBpdHMgcGFyZW50J3MgaW5qZWN0b3IgaW5kZXgsIHRoZW4gdGhlIGluZGV4IGhhcyBiZWVuXG4gICAgICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICAgICAgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkgfHxcbiAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5qZWN0b3IgaW5kZXggbWlnaHQgZXhpc3QgYnV0IHRoZSBwYXJlbnQgdmFsdWVzXG4gICAgICAvLyBtaWdodCBub3QgaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgeWV0IGZvciB0aGlzIGluc3RhbmNlXG4gICAgICBob3N0Vmlld1t0Tm9kZS5pbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXg7ICAvLyB2aWV3IG9mZnNldCBpcyAwXG4gIH1cblxuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIHNvIHRoaXMgbG9vcCB3aWxsIGJlIHNraXBwZWQsIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0XG4gIC8vIHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWQgPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXTtcbiAgbGV0IHZpZXdPZmZzZXQgPSAxO1xuICB3aGlsZSAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS5pbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgIHZpZXcgPSB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdICE7XG4gICAgdmlld09mZnNldCsrO1xuICB9XG4gIHJldHVybiBob3N0VE5vZGUgP1xuICAgICAgaG9zdFROb2RlLmluamVjdG9ySW5kZXggfCAodmlld09mZnNldCA8PCBJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSA6XG4gICAgICAtMTtcbn1cblxuLyoqXG4gKiBVbndyYXBzIGEgcGFyZW50IGluamVjdG9yIGxvY2F0aW9uIG51bWJlciB0byBmaW5kIHRoZSB2aWV3IG9mZnNldCBmcm9tIHRoZSBjdXJyZW50IGluamVjdG9yLFxuICogdGhlbiB3YWxrcyB1cCB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIHVudGlsIHRoZSB2aWV3IGlzIGZvdW5kIHRoYXQgY29udGFpbnMgdGhlIHBhcmVudFxuICogaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGxvY2F0aW9uIFRoZSBsb2NhdGlvbiBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aGljaCBjb250YWlucyB0aGUgdmlldyBvZmZzZXRcbiAqIEBwYXJhbSBzdGFydFZpZXcgVGhlIExWaWV3RGF0YSBpbnN0YW5jZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHdhbGtpbmcgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIExWaWV3RGF0YSBpbnN0YW5jZSB0aGF0IGNvbnRhaW5zIHRoZSBwYXJlbnQgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yVmlldyhsb2NhdGlvbjogbnVtYmVyLCBzdGFydFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIGxldCB2aWV3T2Zmc2V0ID0gbG9jYXRpb24gPj4gSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdDtcbiAgbGV0IHBhcmVudFZpZXcgPSBzdGFydFZpZXc7XG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnQgdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZFxuICAvLyA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLCB3aGVyZSB0aGUgcGFyZW50IGluamVjdG9yIG1pZ2h0IGxpdmUgbWFueSB2aWV3c1xuICAvLyBhYm92ZSB0aGUgY2hpbGQgaW5qZWN0b3IuXG4gIHdoaWxlICh2aWV3T2Zmc2V0ID4gMCkge1xuICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgdmlld09mZnNldC0tO1xuICB9XG4gIHJldHVybiBwYXJlbnRWaWV3O1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB2aWV3OiBMVmlld0RhdGEsIGRlZjogRGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoaW5qZWN0b3JJbmRleCwgdmlld1tUVklFV10sIGRlZi50eXBlKTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpYyhkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBfZ2V0Vmlld0RhdGEoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBob3N0VE5vZGUgPVxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGU7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oaG9zdFROb2RlLCBfZ2V0Vmlld0RhdGEoKSwgdG9rZW4sIGZsYWdzKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdFJlbmRlcmVyMigpOiBSZW5kZXJlcjIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIoX2dldFZpZXdEYXRhKCkpO1xufVxuLyoqXG4gKiBJbmplY3Qgc3RhdGljIGF0dHJpYnV0ZSB2YWx1ZSBpbnRvIGRpcmVjdGl2ZSBjb25zdHJ1Y3Rvci5cbiAqXG4gKiBUaGlzIG1ldGhvZCBpcyB1c2VkIHdpdGggYGZhY3RvcnlgIGZ1bmN0aW9ucyB3aGljaCBhcmUgZ2VuZXJhdGVkIGFzIHBhcnQgb2ZcbiAqIGBkZWZpbmVEaXJlY3RpdmVgIG9yIGBkZWZpbmVDb21wb25lbnRgLiBUaGUgbWV0aG9kIHJldHJpZXZlcyB0aGUgc3RhdGljIHZhbHVlXG4gKiBvZiBhbiBhdHRyaWJ1dGUuIChEeW5hbWljIGF0dHJpYnV0ZXMgYXJlIG5vdCBzdXBwb3J0ZWQgc2luY2UgdGhleSBhcmUgbm90IHJlc29sdmVkXG4gKiAgYXQgdGhlIHRpbWUgb2YgaW5qZWN0aW9uIGFuZCBjYW4gY2hhbmdlIG92ZXIgdGltZS4pXG4gKlxuICogIyBFeGFtcGxlXG4gKiBHaXZlbjpcbiAqIGBgYFxuICogQENvbXBvbmVudCguLi4pXG4gKiBjbGFzcyBNeUNvbXBvbmVudCB7XG4gKiAgIGNvbnN0cnVjdG9yKEBBdHRyaWJ1dGUoJ3RpdGxlJykgdGl0bGU6IHN0cmluZykgeyAuLi4gfVxuICogfVxuICogYGBgXG4gKiBXaGVuIGluc3RhbnRpYXRlZCB3aXRoXG4gKiBgYGBcbiAqIDxteS1jb21wb25lbnQgdGl0bGU9XCJIZWxsb1wiPjwvbXktY29tcG9uZW50PlxuICogYGBgXG4gKlxuICogVGhlbiBmYWN0b3J5IG1ldGhvZCBnZW5lcmF0ZWQgaXM6XG4gKiBgYGBcbiAqIE15Q29tcG9uZW50Lm5nQ29tcG9uZW50RGVmID0gZGVmaW5lQ29tcG9uZW50KHtcbiAqICAgZmFjdG9yeTogKCkgPT4gbmV3IE15Q29tcG9uZW50KGluamVjdEF0dHJpYnV0ZSgndGl0bGUnKSlcbiAqICAgLi4uXG4gKiB9KVxuICogYGBgXG4gKlxuICogQGV4cGVyaW1lbnRhbFxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXR0cmlidXRlKGF0dHJOYW1lVG9JbmplY3Q6IHN0cmluZyk6IHN0cmluZ3x1bmRlZmluZWQge1xuICBjb25zdCB0Tm9kZSA9IGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlcyhcbiAgICAgICAgICAgICAgICAgICB0Tm9kZSwgVE5vZGVUeXBlLkNvbnRhaW5lciwgVE5vZGVUeXBlLkVsZW1lbnQsIFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydERlZmluZWQodE5vZGUsICdleHBlY3RpbmcgdE5vZGUnKTtcbiAgY29uc3QgYXR0cnMgPSB0Tm9kZS5hdHRycztcbiAgaWYgKGF0dHJzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhdHRycy5sZW5ndGg7IGkgPSBpICsgMikge1xuICAgICAgY29uc3QgYXR0ck5hbWUgPSBhdHRyc1tpXTtcbiAgICAgIGlmIChhdHRyTmFtZSA9PT0gQXR0cmlidXRlTWFya2VyLlNlbGVjdE9ubHkpIGJyZWFrO1xuICAgICAgaWYgKGF0dHJOYW1lID09IGF0dHJOYW1lVG9JbmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGF0dHJzW2kgKyAxXSBhcyBzdHJpbmc7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiB1bmRlZmluZWQ7XG59XG5cbmZ1bmN0aW9uIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHZpZXc6IExWaWV3RGF0YSk6IFJlbmRlcmVyMiB7XG4gIGNvbnN0IHJlbmRlcmVyID0gdmlld1tSRU5ERVJFUl07XG4gIGlmIChpc1Byb2NlZHVyYWxSZW5kZXJlcihyZW5kZXJlcikpIHtcbiAgICByZXR1cm4gcmVuZGVyZXIgYXMgUmVuZGVyZXIyO1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBFcnJvcignQ2Fubm90IGluamVjdCBSZW5kZXJlcjIgd2hlbiB0aGUgYXBwbGljYXRpb24gdXNlcyBSZW5kZXJlcjMhJyk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogTG9vayBmb3IgdGhlIGluamVjdG9yIHByb3ZpZGluZyB0aGUgdG9rZW4gYnkgd2Fsa2luZyB1cCB0aGUgbm9kZSBpbmplY3RvciB0cmVlIGFuZCB0aGVuXG4gKiB0aGUgbW9kdWxlIGluamVjdG9yIHRyZWUuXG4gKlxuICogQHBhcmFtIG5vZGVJbmplY3RvciBOb2RlIGluamVjdG9yIHdoZXJlIHRoZSBzZWFyY2ggc2hvdWxkIHN0YXJ0XG4gKiBAcGFyYW0gdG9rZW4gVGhlIHRva2VuIHRvIGxvb2sgZm9yXG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oXG4gICAgaG9zdFROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSxcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW4pO1xuICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAvLyBzbyBqdXN0IGNhbGwgdGhlIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIGl0LlxuICBpZiAodHlwZW9mIGJsb29tSGFzaCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGJsb29tSGFzaCgpO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykgb3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoICE9IG51bGwpIHtcbiAgICBjb25zdCBzdGFydEluamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KGhvc3RUTm9kZSwgaG9zdFZpZXcpO1xuXG4gICAgbGV0IGluamVjdG9ySW5kZXggPSBzdGFydEluamVjdG9ySW5kZXg7XG4gICAgbGV0IGluamVjdG9yVmlldyA9IGhvc3RWaWV3O1xuICAgIGxldCBwYXJlbnRMb2NhdGlvbjogbnVtYmVyID0gLTE7XG5cbiAgICAvLyBJZiB3ZSBzaG91bGQgc2tpcCB0aGlzIGluamVjdG9yIG9yIGlmIGFuIGluamVjdG9yIGRvZXNuJ3QgZXhpc3Qgb24gdGhpcyBub2RlIChlLmcuIGFsbFxuICAgIC8vIGRpcmVjdGl2ZXMgb24gdGhpcyBub2RlIGFyZSBwcml2YXRlKSwgc3RhcnQgYnkgc2VhcmNoaW5nIHRoZSBwYXJlbnQgaW5qZWN0b3IuXG4gICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2tpcFNlbGYgfHwgaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICAgIHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JJbmRleCA9PT0gLTEgPyBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKGhvc3RUTm9kZSwgaG9zdFZpZXcpIDpcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG5cbiAgICAgIGlmIChzaG91bGROb3RTZWFyY2hQYXJlbnQoZmxhZ3MsIHBhcmVudExvY2F0aW9uKSkge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpbmplY3RvckluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICAgIGluamVjdG9yVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgaW5qZWN0b3JWaWV3KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB3aGlsZSAoaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZVxuICAgICAgLy8gKmlzbid0KiBhIG1hdGNoLiBPdXRlciBsb29wIGlzIG5lY2Vzc2FyeSBpbiBjYXNlIHdlIGdldCBhIGZhbHNlIHBvc2l0aXZlIGluamVjdG9yLlxuICAgICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IGluamVjdG9yLiBJZiBpdCBtYXRjaGVzLCBzdG9wIHNlYXJjaGluZyBmb3IgYW4gaW5qZWN0b3IuXG4gICAgICAgIGlmIChpbmplY3Rvckhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgaW5qZWN0b3JWaWV3W1RWSUVXXS5kYXRhKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgcGFyZW50TG9jYXRpb24gPSBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG4gICAgICAgIGlmIChzaG91bGROb3RTZWFyY2hQYXJlbnQoZmxhZ3MsIHBhcmVudExvY2F0aW9uKSkge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZVxuICAgICAgICAvLyB1cCB0byBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlXG4gICAgICAgIC8vIGNhbiBhYm9ydC5cbiAgICAgICAgaWYgKGluamVjdG9ySGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCBpbmplY3RvclZpZXcpKSB7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IHBhcmVudExvY2F0aW9uICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICAgICAgICAgIGluamVjdG9yVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgaW5qZWN0b3JWaWV3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGxldCBpbnN0YW5jZTogVHxudWxsO1xuICAgICAgaWYgKGluc3RhbmNlID0gc2VhcmNoRGlyZWN0aXZlc09uSW5qZWN0b3I8VD4oaW5qZWN0b3JJbmRleCwgaW5qZWN0b3JWaWV3LCB0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSAqZGlkbid0KiBmaW5kIHRoZSBkaXJlY3RpdmUgZm9yIHRoZSB0b2tlbiBhbmQgd2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCBub2RlJ3NcbiAgICAgIC8vIGluamVjdG9yLCBpdCdzIHBvc3NpYmxlIHRoZSBkaXJlY3RpdmUgaXMgb24gdGhpcyBub2RlIGFuZCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cbiAgICAgIGlmIChpbmplY3RvckluZGV4ID09PSBzdGFydEluamVjdG9ySW5kZXggJiYgaG9zdFZpZXcgPT09IGluamVjdG9yVmlldyAmJlxuICAgICAgICAgIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPih0b2tlbiwgaW5qZWN0b3JWaWV3W1RWSUVXXSkpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICBpbmplY3RvckluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICBpbmplY3RvclZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGluamVjdG9yVmlldyk7XG4gICAgfVxuICB9XG5cbiAgY29uc3QgbW9kdWxlSW5qZWN0b3IgPSBob3N0Vmlld1tJTkpFQ1RPUl07XG4gIGNvbnN0IGZvcm1lckluamVjdG9yID0gc2V0Q3VycmVudEluamVjdG9yKG1vZHVsZUluamVjdG9yKTtcbiAgdHJ5IHtcbiAgICByZXR1cm4gaW5qZWN0KHRva2VuLCBmbGFncyk7XG4gIH0gZmluYWxseSB7XG4gICAgc2V0Q3VycmVudEluamVjdG9yKGZvcm1lckluamVjdG9yKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4odG9rZW46IGFueSwgaG9zdFRWaWV3OiBUVmlldyk6IFR8bnVsbCB7XG4gIGNvbnN0IG1hdGNoZXMgPSBob3N0VFZpZXcuY3VycmVudE1hdGNoZXM7XG4gIGlmIChtYXRjaGVzKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBtYXRjaGVzLmxlbmd0aDsgaSArPSAyKSB7XG4gICAgICBjb25zdCBkZWYgPSBtYXRjaGVzW2ldIGFzIERpcmVjdGl2ZURlZjxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIHNlYXJjaERpcmVjdGl2ZXNPbkluamVjdG9yPFQ+KFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlld0RhdGEsIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPikge1xuICBjb25zdCB0Tm9kZSA9IGluamVjdG9yVmlld1tUVklFV10uZGF0YVtpbmplY3RvckluZGV4ICsgVE5PREVdIGFzIFROb2RlO1xuICBjb25zdCBub2RlRmxhZ3MgPSB0Tm9kZS5mbGFncztcbiAgY29uc3QgY291bnQgPSBub2RlRmxhZ3MgJiBUTm9kZUZsYWdzLkRpcmVjdGl2ZUNvdW50TWFzaztcblxuICBpZiAoY291bnQgIT09IDApIHtcbiAgICBjb25zdCBzdGFydCA9IG5vZGVGbGFncyA+PiBUTm9kZUZsYWdzLkRpcmVjdGl2ZVN0YXJ0aW5nSW5kZXhTaGlmdDtcbiAgICBjb25zdCBlbmQgPSBzdGFydCArIGNvdW50O1xuICAgIGNvbnN0IGRlZnMgPSBpbmplY3RvclZpZXdbVFZJRVddLmRhdGE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RvclZpZXdbaV07XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGJpdCBpbiBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlciB0aGF0IHNob3VsZCBiZSB1c2VkIHRvIGRldGVybWluZSB3aGV0aGVyIG9yIG5vdFxuICogdGhlIGRpcmVjdGl2ZSBtaWdodCBiZSBwcm92aWRlZCBieSB0aGUgaW5qZWN0b3IuXG4gKlxuICogV2hlbiBhIGRpcmVjdGl2ZSBpcyBwdWJsaWMsIGl0IGlzIGFkZGVkIHRvIHRoZSBibG9vbSBmaWx0ZXIgYW5kIGdpdmVuIGEgdW5pcXVlIElEIHRoYXQgY2FuIGJlXG4gKiByZXRyaWV2ZWQgb24gdGhlIFR5cGUuIFdoZW4gdGhlIGRpcmVjdGl2ZSBpc24ndCBwdWJsaWMgb3IgdGhlIHRva2VuIGlzIG5vdCBhIGRpcmVjdGl2ZSBgbnVsbGBcbiAqIGlzIHJldHVybmVkIGFzIHRoZSBub2RlIGluamVjdG9yIGNhbiBub3QgcG9zc2libHkgcHJvdmlkZSB0aGF0IHRva2VuLlxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgaW5qZWN0aW9uIHRva2VuXG4gKiBAcmV0dXJucyB0aGUgbWF0Y2hpbmcgYml0IHRvIGNoZWNrIGluIHRoZSBibG9vbSBmaWx0ZXIgb3IgYG51bGxgIGlmIHRoZSB0b2tlbiBpcyBub3Qga25vd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW46IFR5cGU8YW55PnwgSW5qZWN0aW9uVG9rZW48YW55Pik6IG51bWJlcnxGdW5jdGlvbnxcbiAgICB1bmRlZmluZWQge1xuICBjb25zdCB0b2tlbklkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHRva2VuIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG4gIHJldHVybiB0eXBlb2YgdG9rZW5JZCA9PT0gJ251bWJlcicgPyB0b2tlbklkICYgQkxPT01fTUFTSyA6IHRva2VuSWQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3Rvckhhc1Rva2VuKFxuICAgIGJsb29tSGFzaDogbnVtYmVyLCBpbmplY3RvckluZGV4OiBudW1iZXIsIGluamVjdG9yVmlldzogTFZpZXdEYXRhIHwgVERhdGEpIHtcbiAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZSB3ZSdyZSBsb29raW5nIGZvci5cbiAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUhhc2g7XG4gIGNvbnN0IGI3ID0gYmxvb21IYXNoICYgMHg4MDtcbiAgY29uc3QgYjYgPSBibG9vbUhhc2ggJiAweDQwO1xuICBjb25zdCBiNSA9IGJsb29tSGFzaCAmIDB4MjA7XG5cbiAgLy8gT3VyIGJsb29tIGZpbHRlciBzaXplIGlzIDI1NiBiaXRzLCB3aGljaCBpcyBlaWdodCAzMi1iaXQgYmxvb20gZmlsdGVyIGJ1Y2tldHM6XG4gIC8vIGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjLlxuICAvLyBHZXQgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBmcm9tIHRoZSBhcHByb3ByaWF0ZSBidWNrZXQgYmFzZWQgb24gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0LlxuICBsZXQgdmFsdWU6IG51bWJlcjtcblxuICBpZiAoYjcpIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA3XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA1XSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNF0pO1xuICB9IGVsc2Uge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDNdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAyXSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDFdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXhdKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQgZmxpcHBlZCBvbixcbiAgLy8gdGhpcyBpbmplY3RvciBpcyBhIHBvdGVudGlhbCBtYXRjaC5cbiAgcmV0dXJuICEhKHZhbHVlICYgbWFzayk7XG59XG5cbi8qKiBSZXR1cm5zIHRydWUgaWYgZmxhZ3MgcHJldmVudCBwYXJlbnQgaW5qZWN0b3IgZnJvbSBiZWluZyBzZWFyY2hlZCBmb3IgdG9rZW5zICovXG5mdW5jdGlvbiBzaG91bGROb3RTZWFyY2hQYXJlbnQoZmxhZ3M6IEluamVjdEZsYWdzLCBwYXJlbnRMb2NhdGlvbjogbnVtYmVyKTogYm9vbGVhbnxudW1iZXIge1xuICByZXR1cm4gZmxhZ3MgJiBJbmplY3RGbGFncy5TZWxmIHx8XG4gICAgICAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmIChwYXJlbnRMb2NhdGlvbiA+PiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSA+IDApO1xufVxuXG5leHBvcnQgY2xhc3MgTm9kZUluamVjdG9yIGltcGxlbWVudHMgSW5qZWN0b3Ige1xuICBwcml2YXRlIF9pbmplY3RvckluZGV4OiBudW1iZXI7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgICBwcml2YXRlIF90Tm9kZTogVEVsZW1lbnROb2RlfFRDb250YWluZXJOb2RlfFRFbGVtZW50Q29udGFpbmVyTm9kZSxcbiAgICAgIHByaXZhdGUgX2hvc3RWaWV3OiBMVmlld0RhdGEpIHtcbiAgICB0aGlzLl9pbmplY3RvckluZGV4ID0gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKF90Tm9kZSwgX2hvc3RWaWV3KTtcbiAgfVxuXG4gIGdldCh0b2tlbjogYW55KTogYW55IHtcbiAgICBpZiAodG9rZW4gPT09IFJlbmRlcmVyMikge1xuICAgICAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKHRoaXMuX2hvc3RWaWV3KTtcbiAgICB9XG5cbiAgICBzZXRFbnZpcm9ubWVudCh0aGlzLl90Tm9kZSwgdGhpcy5faG9zdFZpZXcpO1xuICAgIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGUodGhpcy5fdE5vZGUsIHRoaXMuX2hvc3RWaWV3LCB0b2tlbik7XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiBnZXRGYWN0b3J5T2Y8VD4odHlwZTogVHlwZTxhbnk+KTogKCh0eXBlPzogVHlwZTxUPikgPT4gVCl8bnVsbCB7XG4gIGNvbnN0IHR5cGVBbnkgPSB0eXBlIGFzIGFueTtcbiAgY29uc3QgZGVmID0gZ2V0Q29tcG9uZW50RGVmPFQ+KHR5cGVBbnkpIHx8IGdldERpcmVjdGl2ZURlZjxUPih0eXBlQW55KSB8fFxuICAgICAgZ2V0UGlwZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RhYmxlRGVmPFQ+KHR5cGVBbnkpIHx8IGdldEluamVjdG9yRGVmPFQ+KHR5cGVBbnkpO1xuICBpZiAoIWRlZiB8fCBkZWYuZmFjdG9yeSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGRlZi5mYWN0b3J5O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5oZXJpdGVkRmFjdG9yeTxUPih0eXBlOiBUeXBlPGFueT4pOiAodHlwZTogVHlwZTxUPikgPT4gVCB7XG4gIGNvbnN0IHByb3RvID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKHR5cGUucHJvdG90eXBlKS5jb25zdHJ1Y3RvciBhcyBUeXBlPGFueT47XG4gIGNvbnN0IGZhY3RvcnkgPSBnZXRGYWN0b3J5T2Y8VD4ocHJvdG8pO1xuICBpZiAoZmFjdG9yeSAhPT0gbnVsbCkge1xuICAgIHJldHVybiBmYWN0b3J5O1xuICB9IGVsc2Uge1xuICAgIC8vIFRoZXJlIGlzIG5vIGZhY3RvcnkgZGVmaW5lZC4gRWl0aGVyIHRoaXMgd2FzIGltcHJvcGVyIHVzYWdlIG9mIGluaGVyaXRhbmNlXG4gICAgLy8gKG5vIEFuZ3VsYXIgZGVjb3JhdG9yIG9uIHRoZSBzdXBlcmNsYXNzKSBvciB0aGVyZSBpcyBubyBjb25zdHJ1Y3RvciBhdCBhbGxcbiAgICAvLyBpbiB0aGUgaW5oZXJpdGFuY2UgY2hhaW4uIFNpbmNlIHRoZSB0d28gY2FzZXMgY2Fubm90IGJlIGRpc3Rpbmd1aXNoZWQsIHRoZVxuICAgIC8vIGxhdHRlciBoYXMgdG8gYmUgYXNzdW1lZC5cbiAgICByZXR1cm4gKHQpID0+IG5ldyB0KCk7XG4gIH1cbn1cbiJdfQ==