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
import { _getViewData, assertPreviousIsParent, getPreviousOrParentTNode, resolveDirective, setEnvironment } from './instructions';
import { INJECTOR_SIZE, PARENT_INJECTOR, TNODE, } from './interfaces/injector';
import { isProceduralRenderer } from './interfaces/renderer';
import { DECLARATION_VIEW, DIRECTIVES, HOST_NODE, INJECTOR, RENDERER, TVIEW } from './interfaces/view';
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
    ngDevMode && assertPreviousIsParent();
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
        // TODO(kara): Store node injector with host bindings for that node (see VIEW_DATA.md)
        tNode.injectorIndex = hostView.length;
        tView.blueprint.push(0, 0, 0, 0, 0, 0, 0, 0, null); // foundation for cumulative bloom
        tView.data.push(0, 0, 0, 0, 0, 0, 0, 0, tNode); // foundation for node bloom
        tView.hostBindingStartIndex += INJECTOR_SIZE;
    }
    const parentLoc = getParentInjectorLocation(tNode, hostView);
    const parentIndex = parentLoc & 32767 /* InjectorIndexMask */;
    const parentView = getParentInjectorView(parentLoc, hostView);
    const parentData = parentView[TVIEW].data;
    const injectorIndex = tNode.injectorIndex;
    for (let i = 0; i < PARENT_INJECTOR; i++) {
        const bloomIndex = parentIndex + i;
        hostView[injectorIndex + i] =
            parentLoc === -1 ? 0 : parentView[bloomIndex] | parentData[bloomIndex];
    }
    hostView[injectorIndex + PARENT_INJECTOR] = parentLoc;
    return injectorIndex;
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
    return getOrCreateInjectable(getOrCreateNodeInjector(), _getViewData(), token, flags);
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
export function getOrCreateInjectable(startInjectorIndex, hostView, token, flags = 0 /* Default */) {
    const bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function')
        return bloomHash();
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash != null) {
        let injectorIndex = startInjectorIndex;
        let injectorView = hostView;
        if (flags & 4 /* SkipSelf */) {
            const parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
            injectorIndex = parentLocation & 32767 /* InjectorIndexMask */;
            injectorView = getParentInjectorView(parentLocation, injectorView);
        }
        while (injectorIndex !== -1) {
            // Traverse up the injector tree until we find a potential match or until we know there
            // *isn't* a match. Outer loop is necessary in case we get a false positive injector.
            while (injectorIndex !== -1) {
                // Check the current injector. If it matches, stop searching for an injector.
                if (injectorHasToken(bloomHash, injectorIndex, injectorView[TVIEW].data)) {
                    break;
                }
                if (flags & 2 /* Self */ ||
                    flags & 1 /* Host */ &&
                        !sameHostView(injectorView[injectorIndex + PARENT_INJECTOR])) {
                    injectorIndex = -1;
                    break;
                }
                // If the ancestor bloom filter value has the bit corresponding to the directive, traverse
                // up to find the specific injector. If the ancestor bloom filter does not have the bit, we
                // can abort.
                if (injectorHasToken(bloomHash, injectorIndex, injectorView)) {
                    const parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
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
            const parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
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
                return resolveDirective(def, i + 1, matches, hostTView);
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
        const defs = injectorView[TVIEW].directives;
        for (let i = start; i < end; i++) {
            // Get the definition for the directive at this index and, if it is injectable (diPublic),
            // and matches the given token, return the directive instance.
            const directiveDef = defs[i];
            if (directiveDef.type === token && directiveDef.diPublic) {
                return injectorView[DIRECTIVES][i];
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
/**
 * Checks whether the current injector and its parent are in the same host view.
 *
 * This is necessary to support @Host() decorators. If @Host() is set, we should stop searching once
 * the injector and its parent view don't match because it means we'd cross the view boundary.
 */
function sameHostView(parentLocation) {
    return !!parentLocation && (parentLocation >> 15 /* ViewOffsetShift */) === 0;
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
        return getOrCreateInjectable(this._injectorIndex, this._hostView, token);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBGQUEwRjtBQUMxRixxRUFBcUU7QUFFckUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXNDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhJLE9BQU8sRUFBQyxhQUFhLEVBQXlCLGVBQWUsRUFBRSxLQUFLLEdBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVwRyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXFCLFFBQVEsRUFBUyxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUN0SSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFeEQ7Ozs7R0FJRztBQUNILE1BQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixNQUFNLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FBRWxDLDBEQUEwRDtBQUMxRCxJQUFJLGVBQWUsR0FBRyxDQUFDLENBQUM7QUFFeEI7Ozs7Ozs7R0FPRztBQUNILE1BQU0sVUFBVSxRQUFRLENBQUMsYUFBcUIsRUFBRSxLQUFZLEVBQUUsSUFBZTtJQUMzRSxJQUFJLEtBQUssQ0FBQyxpQkFBaUIsRUFBRTtRQUMzQixJQUFJLEVBQUUsR0FBc0IsSUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXhELHdGQUF3RjtRQUN4Rix1RkFBdUY7UUFDdkYsSUFBSSxFQUFFLElBQUksSUFBSSxFQUFFO1lBQ2QsRUFBRSxHQUFJLElBQVksQ0FBQyxhQUFhLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQztTQUN2RDtRQUVELHNGQUFzRjtRQUN0Rix5RkFBeUY7UUFDekYsTUFBTSxRQUFRLEdBQUcsRUFBRSxHQUFHLFVBQVUsQ0FBQztRQUVqQyw2RUFBNkU7UUFDN0UsOEZBQThGO1FBQzlGLCtDQUErQztRQUMvQyxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksUUFBUSxDQUFDO1FBRTNCLHFGQUFxRjtRQUNyRiwrRUFBK0U7UUFDL0UsTUFBTSxFQUFFLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQztRQUMzQixNQUFNLEVBQUUsR0FBRyxRQUFRLEdBQUcsSUFBSSxDQUFDO1FBQzNCLE1BQU0sRUFBRSxHQUFHLFFBQVEsR0FBRyxJQUFJLENBQUM7UUFDM0IsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLElBQWdCLENBQUM7UUFFckMsSUFBSSxFQUFFLEVBQUU7WUFDTixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ3JGO2FBQU07WUFDTCxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hGLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDakY7S0FDRjtBQUNILENBQUM7QUFFRCxNQUFNLFVBQVUsdUJBQXVCO0lBQ3JDLFNBQVMsSUFBSSxzQkFBc0IsRUFBRSxDQUFDO0lBQ3RDLE9BQU8sOEJBQThCLENBQ2pDLHdCQUF3QixFQUEyRCxFQUNuRixZQUFZLEVBQUUsQ0FBQyxDQUFDO0FBQ3RCLENBQUM7QUFFRDs7Ozs7O0dBTUc7QUFDSCxNQUFNLFVBQVUsOEJBQThCLENBQzFDLEtBQTRELEVBQUUsUUFBbUI7SUFDbkYsTUFBTSxxQkFBcUIsR0FBRyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDaEUsSUFBSSxxQkFBcUIsS0FBSyxDQUFDLENBQUMsRUFBRTtRQUNoQyxPQUFPLHFCQUFxQixDQUFDO0tBQzlCO0lBRUQsTUFBTSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzlCLElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFO1FBQzNCLHNGQUFzRjtRQUN0RixLQUFLLENBQUMsYUFBYSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7UUFDdEMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFFLGtDQUFrQztRQUN2RixLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQU0sNEJBQTRCO1FBQ2pGLEtBQUssQ0FBQyxxQkFBcUIsSUFBSSxhQUFhLENBQUM7S0FDOUM7SUFFRCxNQUFNLFNBQVMsR0FBRyx5QkFBeUIsQ0FBQyxLQUFLLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFDN0QsTUFBTSxXQUFXLEdBQUcsU0FBUyxnQ0FBMEMsQ0FBQztJQUN4RSxNQUFNLFVBQVUsR0FBYyxxQkFBcUIsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLENBQUM7SUFFekUsTUFBTSxVQUFVLEdBQUcsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQVcsQ0FBQztJQUNqRCxNQUFNLGFBQWEsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDO0lBRTFDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxlQUFlLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDeEMsTUFBTSxVQUFVLEdBQUcsV0FBVyxHQUFHLENBQUMsQ0FBQztRQUNuQyxRQUFRLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQztZQUN2QixTQUFTLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUM1RTtJQUVELFFBQVEsQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLEdBQUcsU0FBUyxDQUFDO0lBQ3RELE9BQU8sYUFBYSxDQUFDO0FBQ3ZCLENBQUM7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLFFBQW1CO0lBQ2hFLElBQUksS0FBSyxDQUFDLGFBQWEsS0FBSyxDQUFDLENBQUM7UUFDMUIsNEZBQTRGO1FBQzVGLG1GQUFtRjtRQUNuRixDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLEtBQUssS0FBSyxDQUFDLGFBQWEsQ0FBQztRQUNwRSxzRkFBc0Y7UUFDdEYsdURBQXVEO1FBQ3ZELFFBQVEsQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLGVBQWUsQ0FBQyxJQUFJLElBQUksRUFBRTtRQUMzRCxPQUFPLENBQUMsQ0FBQyxDQUFDO0tBQ1g7U0FBTTtRQUNMLE9BQU8sS0FBSyxDQUFDLGFBQWEsQ0FBQztLQUM1QjtBQUNILENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLFVBQVUseUJBQXlCLENBQUMsS0FBWSxFQUFFLElBQWU7SUFDckUsSUFBSSxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFO1FBQ3JELE9BQU8sS0FBSyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBRSxtQkFBbUI7S0FDeEQ7SUFFRCw4RkFBOEY7SUFDOUYseUZBQXlGO0lBQ3pGLHNFQUFzRTtJQUN0RSxJQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDaEMsSUFBSSxVQUFVLEdBQUcsQ0FBQyxDQUFDO0lBQ25CLE9BQU8sU0FBUyxJQUFJLFNBQVMsQ0FBQyxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7UUFDbEQsSUFBSSxHQUFHLElBQUksQ0FBQyxnQkFBZ0IsQ0FBRyxDQUFDO1FBQ2hDLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFHLENBQUM7UUFDOUIsVUFBVSxFQUFFLENBQUM7S0FDZDtJQUNELE9BQU8sU0FBUyxDQUFDLENBQUM7UUFDZCxTQUFTLENBQUMsYUFBYSxHQUFHLENBQUMsVUFBVSw0QkFBeUMsQ0FBQyxDQUFDLENBQUM7UUFDakYsQ0FBQyxDQUFDLENBQUM7QUFDVCxDQUFDO0FBRUQ7Ozs7Ozs7O0dBUUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUMsUUFBZ0IsRUFBRSxTQUFvQjtJQUMxRSxJQUFJLFVBQVUsR0FBRyxRQUFRLDRCQUF5QyxDQUFDO0lBQ25FLElBQUksVUFBVSxHQUFHLFNBQVMsQ0FBQztJQUMzQix3RkFBd0Y7SUFDeEYsMkZBQTJGO0lBQzNGLHNGQUFzRjtJQUN0Riw0QkFBNEI7SUFDNUIsT0FBTyxVQUFVLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLFVBQVUsR0FBRyxVQUFVLENBQUMsZ0JBQWdCLENBQUcsQ0FBQztRQUM1QyxVQUFVLEVBQUUsQ0FBQztLQUNkO0lBQ0QsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsTUFBTSxVQUFVLGtCQUFrQixDQUM5QixhQUFxQixFQUFFLElBQWUsRUFBRSxHQUE4QjtJQUN4RSxRQUFRLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDakQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFNLFVBQVUsUUFBUSxDQUFDLEdBQThCO0lBQ3JELGtCQUFrQixDQUFDLHVCQUF1QixFQUFFLEVBQUUsWUFBWSxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDckUsQ0FBQztBQXlCRCxNQUFNLFVBQVUsZUFBZSxDQUMzQixLQUFpQyxFQUFFLEtBQUssa0JBQXNCO0lBQ2hFLE9BQU8scUJBQXFCLENBQUksdUJBQXVCLEVBQUUsRUFBRSxZQUFZLEVBQUUsRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDM0YsQ0FBQztBQUVELE1BQU0sVUFBVSxlQUFlO0lBQzdCLE9BQU8sb0JBQW9CLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztBQUM5QyxDQUFDO0FBQ0Q7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQThCRztBQUNILE1BQU0sVUFBVSxlQUFlLENBQUMsZ0JBQXdCO0lBQ3RELE1BQU0sS0FBSyxHQUFHLHdCQUF3QixFQUFFLENBQUM7SUFDekMsU0FBUyxJQUFJLHlCQUF5QixDQUNyQixLQUFLLCtEQUFxRSxDQUFDO0lBQzVGLFNBQVMsSUFBSSxhQUFhLENBQUMsS0FBSyxFQUFFLGlCQUFpQixDQUFDLENBQUM7SUFDckQsTUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQztJQUMxQixJQUFJLEtBQUssRUFBRTtRQUNULEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQzNDLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxQixJQUFJLFFBQVEsdUJBQStCO2dCQUFFLE1BQU07WUFDbkQsSUFBSSxRQUFRLElBQUksZ0JBQWdCLEVBQUU7Z0JBQ2hDLE9BQU8sS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQVcsQ0FBQzthQUMvQjtTQUNGO0tBQ0Y7SUFDRCxPQUFPLFNBQVMsQ0FBQztBQUNuQixDQUFDO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxJQUFlO0lBQzNDLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNoQyxJQUFJLG9CQUFvQixDQUFDLFFBQVEsQ0FBQyxFQUFFO1FBQ2xDLE9BQU8sUUFBcUIsQ0FBQztLQUM5QjtTQUFNO1FBQ0wsTUFBTSxJQUFJLEtBQUssQ0FBQyw4REFBOEQsQ0FBQyxDQUFDO0tBQ2pGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQ2pDLGtCQUEwQixFQUFFLFFBQW1CLEVBQUUsS0FBaUMsRUFDbEYsdUJBQXdDO0lBQzFDLE1BQU0sU0FBUyxHQUFHLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLCtGQUErRjtJQUMvRixrREFBa0Q7SUFDbEQsSUFBSSxPQUFPLFNBQVMsS0FBSyxVQUFVO1FBQUUsT0FBTyxTQUFTLEVBQUUsQ0FBQztJQUV4RCwrRkFBK0Y7SUFDL0YseURBQXlEO0lBQ3pELElBQUksU0FBUyxJQUFJLElBQUksRUFBRTtRQUNyQixJQUFJLGFBQWEsR0FBRyxrQkFBa0IsQ0FBQztRQUN2QyxJQUFJLFlBQVksR0FBRyxRQUFRLENBQUM7UUFFNUIsSUFBSSxLQUFLLG1CQUF1QixFQUFFO1lBQ2hDLE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDckUsYUFBYSxHQUFHLGNBQWMsZ0NBQTBDLENBQUM7WUFDekUsWUFBWSxHQUFHLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNwRTtRQUVELE9BQU8sYUFBYSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQzNCLHVGQUF1RjtZQUN2RixxRkFBcUY7WUFDckYsT0FBTyxhQUFhLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQzNCLDZFQUE2RTtnQkFDN0UsSUFBSSxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxFQUFFLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDeEUsTUFBTTtpQkFDUDtnQkFFRCxJQUFJLEtBQUssZUFBbUI7b0JBQ3hCLEtBQUssZUFBbUI7d0JBQ3BCLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUMsRUFBRTtvQkFDcEUsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNuQixNQUFNO2lCQUNQO2dCQUVELDBGQUEwRjtnQkFDMUYsMkZBQTJGO2dCQUMzRixhQUFhO2dCQUNiLElBQUksZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGFBQWEsRUFBRSxZQUFZLENBQUMsRUFBRTtvQkFDNUQsTUFBTSxjQUFjLEdBQUcsWUFBWSxDQUFDLGFBQWEsR0FBRyxlQUFlLENBQUMsQ0FBQztvQkFDckUsYUFBYSxHQUFHLGNBQWMsZ0NBQTBDLENBQUM7b0JBQ3pFLFlBQVksR0FBRyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsWUFBWSxDQUFDLENBQUM7aUJBQ3BFO3FCQUFNO29CQUNMLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQztvQkFDbkIsTUFBTTtpQkFDUDthQUNGO1lBRUQsMEZBQTBGO1lBQzFGLHNCQUFzQjtZQUN0QixJQUFJLGFBQWEsS0FBSyxDQUFDLENBQUMsRUFBRTtnQkFDeEIsTUFBTTthQUNQO1lBRUQsMkZBQTJGO1lBQzNGLDhGQUE4RjtZQUM5RixJQUFJLFFBQWdCLENBQUM7WUFDckIsSUFBSSxRQUFRLEdBQUcsMEJBQTBCLENBQUksYUFBYSxFQUFFLFlBQVksRUFBRSxLQUFLLENBQUMsRUFBRTtnQkFDaEYsT0FBTyxRQUFRLENBQUM7YUFDakI7WUFFRCwwRkFBMEY7WUFDMUYscUZBQXFGO1lBQ3JGLElBQUksYUFBYSxLQUFLLGtCQUFrQixJQUFJLFFBQVEsS0FBSyxZQUFZO2dCQUNqRSxDQUFDLFFBQVEsR0FBRyw4QkFBOEIsQ0FBSSxLQUFLLEVBQUUsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDOUUsT0FBTyxRQUFRLENBQUM7YUFDakI7WUFFRCwwRUFBMEU7WUFDMUUsK0NBQStDO1lBQy9DLE1BQU0sY0FBYyxHQUFHLFlBQVksQ0FBQyxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUM7WUFDckUsYUFBYSxHQUFHLGNBQWMsZ0NBQTBDLENBQUM7WUFDekUsWUFBWSxHQUFHLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxZQUFZLENBQUMsQ0FBQztTQUNwRTtLQUNGO0lBRUQsTUFBTSxjQUFjLEdBQUcsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQzFDLE1BQU0sY0FBYyxHQUFHLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0lBQzFELElBQUk7UUFDRixPQUFPLE1BQU0sQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDN0I7WUFBUztRQUNSLGtCQUFrQixDQUFDLGNBQWMsQ0FBQyxDQUFDO0tBQ3BDO0FBQ0gsQ0FBQztBQUVELFNBQVMsOEJBQThCLENBQUksS0FBVSxFQUFFLFNBQWdCO0lBQ3JFLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQyxjQUFjLENBQUM7SUFDekMsSUFBSSxPQUFPLEVBQUU7UUFDWCxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQzFDLE1BQU0sR0FBRyxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQThCLENBQUM7WUFDcEQsSUFBSSxHQUFHLENBQUMsSUFBSSxLQUFLLEtBQUssRUFBRTtnQkFDdEIsT0FBTyxnQkFBZ0IsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUM7YUFDekQ7U0FDRjtLQUNGO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQsU0FBUywwQkFBMEIsQ0FDL0IsYUFBcUIsRUFBRSxZQUF1QixFQUFFLEtBQWlDO0lBQ25GLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBVSxDQUFDO0lBQ3ZFLE1BQU0sU0FBUyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUM7SUFDOUIsTUFBTSxLQUFLLEdBQUcsU0FBUyxnQ0FBZ0MsQ0FBQztJQUV4RCxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7UUFDZixNQUFNLEtBQUssR0FBRyxTQUFTLHdDQUEwQyxDQUFDO1FBQ2xFLE1BQU0sR0FBRyxHQUFHLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDMUIsTUFBTSxJQUFJLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVksQ0FBQztRQUU5QyxLQUFLLElBQUksQ0FBQyxHQUFHLEtBQUssRUFBRSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ2hDLDBGQUEwRjtZQUMxRiw4REFBOEQ7WUFDOUQsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBOEIsQ0FBQztZQUMxRCxJQUFJLFlBQVksQ0FBQyxJQUFJLEtBQUssS0FBSyxJQUFJLFlBQVksQ0FBQyxRQUFRLEVBQUU7Z0JBQ3hELE9BQU8sWUFBWSxDQUFDLFVBQVUsQ0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQ3RDO1NBQ0Y7S0FDRjtJQUNELE9BQU8sSUFBSSxDQUFDO0FBQ2QsQ0FBQztBQUVEOzs7Ozs7Ozs7O0dBVUc7QUFDSCxNQUFNLFVBQVUscUJBQXFCLENBQUMsS0FBcUM7SUFFekUsTUFBTSxPQUFPLEdBQXNCLEtBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztJQUNoRSxPQUFPLE9BQU8sT0FBTyxLQUFLLFFBQVEsQ0FBQyxDQUFDLENBQUMsT0FBTyxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDO0FBQ3RFLENBQUM7QUFFRCxNQUFNLFVBQVUsZ0JBQWdCLENBQzVCLFNBQWlCLEVBQUUsYUFBcUIsRUFBRSxZQUErQjtJQUMzRSwrRkFBK0Y7SUFDL0YsOEZBQThGO0lBQzlGLCtDQUErQztJQUMvQyxNQUFNLElBQUksR0FBRyxDQUFDLElBQUksU0FBUyxDQUFDO0lBQzVCLE1BQU0sRUFBRSxHQUFHLFNBQVMsR0FBRyxJQUFJLENBQUM7SUFDNUIsTUFBTSxFQUFFLEdBQUcsU0FBUyxHQUFHLElBQUksQ0FBQztJQUM1QixNQUFNLEVBQUUsR0FBRyxTQUFTLEdBQUcsSUFBSSxDQUFDO0lBRTVCLGlGQUFpRjtJQUNqRiwyRUFBMkU7SUFDM0UsNEZBQTRGO0lBQzVGLElBQUksS0FBYSxDQUFDO0lBRWxCLElBQUksRUFBRSxFQUFFO1FBQ04sS0FBSyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksQ0FBQyxhQUFhLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkY7U0FBTTtRQUNMLEtBQUssR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUMxRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7S0FDbkY7SUFFRCw4RkFBOEY7SUFDOUYsc0NBQXNDO0lBQ3RDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDO0FBQzFCLENBQUM7QUFHRDs7Ozs7R0FLRztBQUNILFNBQVMsWUFBWSxDQUFDLGNBQXNCO0lBQzFDLE9BQU8sQ0FBQyxDQUFDLGNBQWMsSUFBSSxDQUFDLGNBQWMsNEJBQXlDLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0YsQ0FBQztBQUVELE1BQU0sT0FBTyxZQUFZO0lBR3ZCLFlBQ1ksTUFBeUQsRUFDekQsU0FBb0I7UUFEcEIsV0FBTSxHQUFOLE1BQU0sQ0FBbUQ7UUFDekQsY0FBUyxHQUFULFNBQVMsQ0FBVztRQUM5QixJQUFJLENBQUMsY0FBYyxHQUFHLDhCQUE4QixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztJQUMxRSxDQUFDO0lBRUQsR0FBRyxDQUFDLEtBQVU7UUFDWixJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDdkIsT0FBTyxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDN0M7UUFFRCxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDNUMsT0FBTyxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDM0UsQ0FBQztDQUNGO0FBQ0QsTUFBTSxVQUFVLFlBQVksQ0FBSSxJQUFlO0lBQzdDLE1BQU0sT0FBTyxHQUFHLElBQVcsQ0FBQztJQUM1QixNQUFNLEdBQUcsR0FBRyxlQUFlLENBQUksT0FBTyxDQUFDLElBQUksZUFBZSxDQUFJLE9BQU8sQ0FBQztRQUNsRSxVQUFVLENBQUksT0FBTyxDQUFDLElBQUksZ0JBQWdCLENBQUksT0FBTyxDQUFDLElBQUksY0FBYyxDQUFJLE9BQU8sQ0FBQyxDQUFDO0lBQ3pGLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sS0FBSyxTQUFTLEVBQUU7UUFDckMsT0FBTyxJQUFJLENBQUM7S0FDYjtJQUNELE9BQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQztBQUNyQixDQUFDO0FBRUQsTUFBTSxVQUFVLG1CQUFtQixDQUFJLElBQWU7SUFDcEQsTUFBTSxLQUFLLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsV0FBd0IsQ0FBQztJQUM3RSxNQUFNLE9BQU8sR0FBRyxZQUFZLENBQUksS0FBSyxDQUFDLENBQUM7SUFDdkMsSUFBSSxPQUFPLEtBQUssSUFBSSxFQUFFO1FBQ3BCLE9BQU8sT0FBTyxDQUFDO0tBQ2hCO1NBQU07UUFDTCw2RUFBNkU7UUFDN0UsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw0QkFBNEI7UUFDNUIsT0FBTyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUN2QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2RlZnMnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBOdWxsSW5qZWN0b3IsIGluamVjdCwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGEsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgcmVzb2x2ZURpcmVjdGl2ZSwgc2V0RW52aXJvbm1lbnR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmSW50ZXJuYWx9IGZyb20gJy4vaW50ZXJmYWNlcy9kZWZpbml0aW9uJztcbmltcG9ydCB7SU5KRUNUT1JfU0laRSwgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLCBQQVJFTlRfSU5KRUNUT1IsIFROT0RFLH0gZnJvbSAnLi9pbnRlcmZhY2VzL2luamVjdG9yJztcbmltcG9ydCB7QXR0cmlidXRlTWFya2VyLCBUQ29udGFpbmVyTm9kZSwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBURWxlbWVudE5vZGUsIFROb2RlLCBUTm9kZUZsYWdzLCBUTm9kZVR5cGV9IGZyb20gJy4vaW50ZXJmYWNlcy9ub2RlJztcbmltcG9ydCB7aXNQcm9jZWR1cmFsUmVuZGVyZXJ9IGZyb20gJy4vaW50ZXJmYWNlcy9yZW5kZXJlcic7XG5pbXBvcnQge0RFQ0xBUkFUSU9OX1ZJRVcsIERJUkVDVElWRVMsIEhPU1RfTk9ERSwgSU5KRUNUT1IsIExWaWV3RGF0YSwgUEFSRU5ULCBSRU5ERVJFUiwgVERhdGEsIFRWSUVXLCBUVmlld30gZnJvbSAnLi9pbnRlcmZhY2VzL3ZpZXcnO1xuaW1wb3J0IHthc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzfSBmcm9tICcuL25vZGVfYXNzZXJ0JztcblxuLyoqXG4gKiBUaGUgbnVtYmVyIG9mIHNsb3RzIGluIGVhY2ggYmxvb20gZmlsdGVyICh1c2VkIGJ5IERJKS4gVGhlIGxhcmdlciB0aGlzIG51bWJlciwgdGhlIGZld2VyXG4gKiBkaXJlY3RpdmVzIHRoYXQgd2lsbCBzaGFyZSBzbG90cywgYW5kIHRodXMsIHRoZSBmZXdlciBmYWxzZSBwb3NpdGl2ZXMgd2hlbiBjaGVja2luZyBmb3JcbiAqIHRoZSBleGlzdGVuY2Ugb2YgYSBkaXJlY3RpdmUuXG4gKi9cbmNvbnN0IEJMT09NX1NJWkUgPSAyNTY7XG5jb25zdCBCTE9PTV9NQVNLID0gQkxPT01fU0laRSAtIDE7XG5cbi8qKiBDb3VudGVyIHVzZWQgdG8gZ2VuZXJhdGUgdW5pcXVlIElEcyBmb3IgZGlyZWN0aXZlcy4gKi9cbmxldCBuZXh0TmdFbGVtZW50SWQgPSAwO1xuXG4vKipcbiAqIFJlZ2lzdGVycyB0aGlzIGRpcmVjdGl2ZSBhcyBwcmVzZW50IGluIGl0cyBub2RlJ3MgaW5qZWN0b3IgYnkgZmxpcHBpbmcgdGhlIGRpcmVjdGl2ZSdzXG4gKiBjb3JyZXNwb25kaW5nIGJpdCBpbiB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGluamVjdG9ySW5kZXggVGhlIGluZGV4IG9mIHRoZSBub2RlIGluamVjdG9yIHdoZXJlIHRoaXMgdG9rZW4gc2hvdWxkIGJlIHJlZ2lzdGVyZWRcbiAqIEBwYXJhbSB0VmlldyBUaGUgVFZpZXcgZm9yIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlcnNcbiAqIEBwYXJhbSB0eXBlIFRoZSBkaXJlY3RpdmUgdG9rZW4gdG8gcmVnaXN0ZXJcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tQWRkKGluamVjdG9ySW5kZXg6IG51bWJlciwgdFZpZXc6IFRWaWV3LCB0eXBlOiBUeXBlPGFueT4pOiB2b2lkIHtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgbGV0IGlkOiBudW1iZXJ8dW5kZWZpbmVkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcblxuICAgIC8vIFNldCBhIHVuaXF1ZSBJRCBvbiB0aGUgZGlyZWN0aXZlIHR5cGUsIHNvIGlmIHNvbWV0aGluZyB0cmllcyB0byBpbmplY3QgdGhlIGRpcmVjdGl2ZSxcbiAgICAvLyB3ZSBjYW4gZWFzaWx5IHJldHJpZXZlIHRoZSBJRCBhbmQgaGFzaCBpdCBpbnRvIHRoZSBibG9vbSBiaXQgdGhhdCBzaG91bGQgYmUgY2hlY2tlZC5cbiAgICBpZiAoaWQgPT0gbnVsbCkge1xuICAgICAgaWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdID0gbmV4dE5nRWxlbWVudElkKys7XG4gICAgfVxuXG4gICAgLy8gV2Ugb25seSBoYXZlIEJMT09NX1NJWkUgKDI1Nikgc2xvdHMgaW4gb3VyIGJsb29tIGZpbHRlciAoOCBidWNrZXRzICogMzIgYml0cyBlYWNoKSxcbiAgICAvLyBzbyBhbGwgdW5pcXVlIElEcyBtdXN0IGJlIG1vZHVsby1lZCBpbnRvIGEgbnVtYmVyIGZyb20gMCAtIDI1NSB0byBmaXQgaW50byB0aGUgZmlsdGVyLlxuICAgIGNvbnN0IGJsb29tQml0ID0gaWQgJiBCTE9PTV9NQVNLO1xuXG4gICAgLy8gQ3JlYXRlIGEgbWFzayB0aGF0IHRhcmdldHMgdGhlIHNwZWNpZmljIGJpdCBhc3NvY2lhdGVkIHdpdGggdGhlIGRpcmVjdGl2ZS5cbiAgICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gICAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgICBjb25zdCBtYXNrID0gMSA8PCBibG9vbUJpdDtcblxuICAgIC8vIFVzZSB0aGUgcmF3IGJsb29tQml0IG51bWJlciB0byBkZXRlcm1pbmUgd2hpY2ggYmxvb20gZmlsdGVyIGJ1Y2tldCB3ZSBzaG91bGQgY2hlY2tcbiAgICAvLyBlLmc6IGJmMCA9IFswIC0gMzFdLCBiZjEgPSBbMzIgLSA2M10sIGJmMiA9IFs2NCAtIDk1XSwgYmYzID0gWzk2IC0gMTI3XSwgZXRjXG4gICAgY29uc3QgYjcgPSBibG9vbUJpdCAmIDB4ODA7XG4gICAgY29uc3QgYjYgPSBibG9vbUJpdCAmIDB4NDA7XG4gICAgY29uc3QgYjUgPSBibG9vbUJpdCAmIDB4MjA7XG4gICAgY29uc3QgdERhdGEgPSB0Vmlldy5kYXRhIGFzIG51bWJlcltdO1xuXG4gICAgaWYgKGI3KSB7XG4gICAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgN10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDZdIHw9IG1hc2spKSA6XG4gICAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDRdIHw9IG1hc2spKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDNdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyAyXSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDFdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXhdIHw9IG1hc2spKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCk6IG51bWJlciB7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnRQcmV2aW91c0lzUGFyZW50KCk7XG4gIHJldHVybiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgICBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKSBhcyBURWxlbWVudE5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUgfCBUQ29udGFpbmVyTm9kZSxcbiAgICAgIF9nZXRWaWV3RGF0YSgpKTtcbn1cblxuLyoqXG4gKiBDcmVhdGVzIChvciBnZXRzIGFuIGV4aXN0aW5nKSBpbmplY3RvciBmb3IgYSBnaXZlbiBlbGVtZW50IG9yIGNvbnRhaW5lci5cbiAqXG4gKiBAcGFyYW0gdE5vZGUgZm9yIHdoaWNoIGFuIGluamVjdG9yIHNob3VsZCBiZSByZXRyaWV2ZWQgLyBjcmVhdGVkLlxuICogQHBhcmFtIGhvc3RWaWV3IFZpZXcgd2hlcmUgdGhlIG5vZGUgaXMgc3RvcmVkXG4gKiBAcmV0dXJucyBOb2RlIGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoXG4gICAgdE5vZGU6IFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgY29uc3QgZXhpc3RpbmdJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZSwgaG9zdFZpZXcpO1xuICBpZiAoZXhpc3RpbmdJbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgIHJldHVybiBleGlzdGluZ0luamVjdG9ySW5kZXg7XG4gIH1cblxuICBjb25zdCB0VmlldyA9IGhvc3RWaWV3W1RWSUVXXTtcbiAgaWYgKHRWaWV3LmZpcnN0VGVtcGxhdGVQYXNzKSB7XG4gICAgLy8gVE9ETyhrYXJhKTogU3RvcmUgbm9kZSBpbmplY3RvciB3aXRoIGhvc3QgYmluZGluZ3MgZm9yIHRoYXQgbm9kZSAoc2VlIFZJRVdfREFUQS5tZClcbiAgICB0Tm9kZS5pbmplY3RvckluZGV4ID0gaG9zdFZpZXcubGVuZ3RoO1xuICAgIHRWaWV3LmJsdWVwcmludC5wdXNoKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIG51bGwpOyAgLy8gZm91bmRhdGlvbiBmb3IgY3VtdWxhdGl2ZSBibG9vbVxuICAgIHRWaWV3LmRhdGEucHVzaCgwLCAwLCAwLCAwLCAwLCAwLCAwLCAwLCB0Tm9kZSk7ICAgICAgLy8gZm91bmRhdGlvbiBmb3Igbm9kZSBibG9vbVxuICAgIHRWaWV3Lmhvc3RCaW5kaW5nU3RhcnRJbmRleCArPSBJTkpFQ1RPUl9TSVpFO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBwYXJlbnRJbmRleCA9IHBhcmVudExvYyAmIEluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbiAgY29uc3QgcGFyZW50VmlldzogTFZpZXdEYXRhID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgaG9zdFZpZXcpO1xuXG4gIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhIGFzIGFueTtcbiAgY29uc3QgaW5qZWN0b3JJbmRleCA9IHROb2RlLmluamVjdG9ySW5kZXg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBQQVJFTlRfSU5KRUNUT1I7IGkrKykge1xuICAgIGNvbnN0IGJsb29tSW5kZXggPSBwYXJlbnRJbmRleCArIGk7XG4gICAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIGldID1cbiAgICAgICAgcGFyZW50TG9jID09PSAtMSA/IDAgOiBwYXJlbnRWaWV3W2Jsb29tSW5kZXhdIHwgcGFyZW50RGF0YVtibG9vbUluZGV4XTtcbiAgfVxuXG4gIGhvc3RWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdID0gcGFyZW50TG9jO1xuICByZXR1cm4gaW5qZWN0b3JJbmRleDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9ySW5kZXgodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgaG9zdFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3RGF0YSk6IG51bWJlciB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4OyAgLy8gdmlldyBvZmZzZXQgaXMgMFxuICB9XG5cbiAgLy8gRm9yIG1vc3QgY2FzZXMsIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggY2FuIGJlIGZvdW5kIG9uIHRoZSBob3N0IG5vZGUgKGUuZy4gZm9yIGNvbXBvbmVudFxuICAvLyBvciBjb250YWluZXIpLCBzbyB0aGlzIGxvb3Agd2lsbCBiZSBza2lwcGVkLCBidXQgd2UgbXVzdCBrZWVwIHRoZSBsb29wIGhlcmUgdG8gc3VwcG9ydFxuICAvLyB0aGUgcmFyZXIgY2FzZSBvZiBkZWVwbHkgbmVzdGVkIDxuZy10ZW1wbGF0ZT4gdGFncyBvciBpbmxpbmUgdmlld3MuXG4gIGxldCBob3N0VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV07XG4gIGxldCB2aWV3T2Zmc2V0ID0gMTtcbiAgd2hpbGUgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICB2aWV3ID0gdmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSAhO1xuICAgIHZpZXdPZmZzZXQrKztcbiAgfVxuICByZXR1cm4gaG9zdFROb2RlID9cbiAgICAgIGhvc3RUTm9kZS5pbmplY3RvckluZGV4IHwgKHZpZXdPZmZzZXQgPDwgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgOlxuICAgICAgLTE7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbiBudW1iZXIgdG8gZmluZCB0aGUgdmlldyBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBpbmplY3RvcixcbiAqIHRoZW4gd2Fsa3MgdXAgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSB1bnRpbCB0aGUgdmlldyBpcyBmb3VuZCB0aGF0IGNvbnRhaW5zIHRoZSBwYXJlbnRcbiAqIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBsb2NhdGlvbiBUaGUgbG9jYXRpb24gb2YgdGhlIHBhcmVudCBpbmplY3Rvciwgd2hpY2ggY29udGFpbnMgdGhlIHZpZXcgb2Zmc2V0XG4gKiBAcGFyYW0gc3RhcnRWaWV3IFRoZSBMVmlld0RhdGEgaW5zdGFuY2UgZnJvbSB3aGljaCB0byBzdGFydCB3YWxraW5nIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBMVmlld0RhdGEgaW5zdGFuY2UgdGhhdCBjb250YWlucyB0aGUgcGFyZW50IGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclZpZXcobG9jYXRpb246IG51bWJlciwgc3RhcnRWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICBsZXQgdmlld09mZnNldCA9IGxvY2F0aW9uID4+IEluamVjdG9yTG9jYXRpb25GbGFncy5WaWV3T2Zmc2V0U2hpZnQ7XG4gIGxldCBwYXJlbnRWaWV3ID0gc3RhcnRWaWV3O1xuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0IHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWRcbiAgLy8gPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cywgd2hlcmUgdGhlIHBhcmVudCBpbmplY3RvciBtaWdodCBsaXZlIG1hbnkgdmlld3NcbiAgLy8gYWJvdmUgdGhlIGNoaWxkIGluamVjdG9yLlxuICB3aGlsZSAodmlld09mZnNldCA+IDApIHtcbiAgICBwYXJlbnRWaWV3ID0gcGFyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIHZpZXdPZmZzZXQtLTtcbiAgfVxuICByZXR1cm4gcGFyZW50Vmlldztcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhLCBkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoaW5qZWN0b3JJbmRleCwgdmlld1tUVklFV10sIGRlZi50eXBlKTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpYyhkZWY6IERpcmVjdGl2ZURlZkludGVybmFsPGFueT4pOiB2b2lkIHtcbiAgZGlQdWJsaWNJbkluamVjdG9yKGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIF9nZXRWaWV3RGF0YSgpLCBkZWYpO1xufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBgZGlyZWN0aXZlSW5qZWN0YCBpcyBpbnRlbmRlZCB0byBiZSB1c2VkIGZvciBkaXJlY3RpdmUsIGNvbXBvbmVudCBhbmQgcGlwZSBmYWN0b3JpZXMuXG4gKiAgQWxsIG90aGVyIGluamVjdGlvbiB1c2UgYGluamVjdGAgd2hpY2ggZG9lcyBub3Qgd2FsayB0aGUgbm9kZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIFVzYWdlIGV4YW1wbGUgKGluIGZhY3RvcnkgZnVuY3Rpb24pOlxuICpcbiAqIGNsYXNzIFNvbWVEaXJlY3RpdmUge1xuICogICBjb25zdHJ1Y3RvcihkaXJlY3RpdmU6IERpcmVjdGl2ZUEpIHt9XG4gKlxuICogICBzdGF0aWMgbmdEaXJlY3RpdmVEZWYgPSBkZWZpbmVEaXJlY3RpdmUoe1xuICogICAgIHR5cGU6IFNvbWVEaXJlY3RpdmUsXG4gKiAgICAgZmFjdG9yeTogKCkgPT4gbmV3IFNvbWVEaXJlY3RpdmUoZGlyZWN0aXZlSW5qZWN0KERpcmVjdGl2ZUEpKVxuICogICB9KTtcbiAqIH1cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIHR5cGUgb3IgdG9rZW4gdG8gaW5qZWN0XG4gKiBAcGFyYW0gZmxhZ3MgSW5qZWN0aW9uIGZsYWdzXG4gKiBAcmV0dXJucyB0aGUgdmFsdWUgZnJvbSB0aGUgaW5qZWN0b3Igb3IgYG51bGxgIHdoZW4gbm90IGZvdW5kXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4odG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MpOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPihcbiAgICB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIHJldHVybiBnZXRPckNyZWF0ZUluamVjdGFibGU8VD4oZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgX2dldFZpZXdEYXRhKCksIHRva2VuLCBmbGFncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKF9nZXRWaWV3RGF0YSgpKTtcbn1cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIHN0YXJ0SW5qZWN0b3JJbmRleDogbnVtYmVyLCBob3N0VmlldzogTFZpZXdEYXRhLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sXG4gICAgZmxhZ3M6IEluamVjdEZsYWdzID0gSW5qZWN0RmxhZ3MuRGVmYXVsdCk6IFR8bnVsbCB7XG4gIGNvbnN0IGJsb29tSGFzaCA9IGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbik7XG4gIC8vIElmIHRoZSBJRCBzdG9yZWQgaGVyZSBpcyBhIGZ1bmN0aW9uLCB0aGlzIGlzIGEgc3BlY2lhbCBvYmplY3QgbGlrZSBFbGVtZW50UmVmIG9yIFRlbXBsYXRlUmVmXG4gIC8vIHNvIGp1c3QgY2FsbCB0aGUgZmFjdG9yeSBmdW5jdGlvbiB0byBjcmVhdGUgaXQuXG4gIGlmICh0eXBlb2YgYmxvb21IYXNoID09PSAnZnVuY3Rpb24nKSByZXR1cm4gYmxvb21IYXNoKCk7XG5cbiAgLy8gSWYgdGhlIHRva2VuIGhhcyBhIGJsb29tIGhhc2gsIHRoZW4gaXQgaXMgYSBkaXJlY3RpdmUgdGhhdCBpcyBwdWJsaWMgdG8gdGhlIGluamVjdGlvbiBzeXN0ZW1cbiAgLy8gKGRpUHVibGljKSBvdGhlcndpc2UgZmFsbCBiYWNrIHRvIHRoZSBtb2R1bGUgaW5qZWN0b3IuXG4gIGlmIChibG9vbUhhc2ggIT0gbnVsbCkge1xuICAgIGxldCBpbmplY3RvckluZGV4ID0gc3RhcnRJbmplY3RvckluZGV4O1xuICAgIGxldCBpbmplY3RvclZpZXcgPSBob3N0VmlldztcblxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmKSB7XG4gICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcbiAgICAgIGluamVjdG9ySW5kZXggPSBwYXJlbnRMb2NhdGlvbiAmIEluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbiAgICAgIGluamVjdG9yVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgaW5qZWN0b3JWaWV3KTtcbiAgICB9XG5cbiAgICB3aGlsZSAoaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSBpbmplY3RvciB0cmVlIHVudGlsIHdlIGZpbmQgYSBwb3RlbnRpYWwgbWF0Y2ggb3IgdW50aWwgd2Uga25vdyB0aGVyZVxuICAgICAgLy8gKmlzbid0KiBhIG1hdGNoLiBPdXRlciBsb29wIGlzIG5lY2Vzc2FyeSBpbiBjYXNlIHdlIGdldCBhIGZhbHNlIHBvc2l0aXZlIGluamVjdG9yLlxuICAgICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAgIC8vIENoZWNrIHRoZSBjdXJyZW50IGluamVjdG9yLiBJZiBpdCBtYXRjaGVzLCBzdG9wIHNlYXJjaGluZyBmb3IgYW4gaW5qZWN0b3IuXG4gICAgICAgIGlmIChpbmplY3Rvckhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgaW5qZWN0b3JWaWV3W1RWSUVXXS5kYXRhKSkge1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fFxuICAgICAgICAgICAgZmxhZ3MgJiBJbmplY3RGbGFncy5Ib3N0ICYmXG4gICAgICAgICAgICAgICAgIXNhbWVIb3N0VmlldyhpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0pKSB7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUsIHRyYXZlcnNlXG4gICAgICAgIC8vIHVwIHRvIGZpbmQgdGhlIHNwZWNpZmljIGluamVjdG9yLiBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIGRvZXMgbm90IGhhdmUgdGhlIGJpdCwgd2VcbiAgICAgICAgLy8gY2FuIGFib3J0LlxuICAgICAgICBpZiAoaW5qZWN0b3JIYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGluamVjdG9yVmlldykpIHtcbiAgICAgICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICAgICAgaW5qZWN0b3JWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBpbmplY3RvclZpZXcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBubyBpbmplY3RvciBpcyBmb3VuZCwgd2UgKmtub3cqIHRoYXQgdGhlcmUgaXMgbm8gYW5jZXN0b3IgaW5qZWN0b3IgdGhhdCBjb250YWlucyB0aGVcbiAgICAgIC8vIHRva2VuLCBzbyB3ZSBhYm9ydC5cbiAgICAgIGlmIChpbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gQXQgdGhpcyBwb2ludCwgd2UgaGF2ZSBhbiBpbmplY3RvciB3aGljaCAqbWF5KiBjb250YWluIHRoZSB0b2tlbiwgc28gd2Ugc3RlcCB0aHJvdWdoIHRoZVxuICAgICAgLy8gZGlyZWN0aXZlcyBhc3NvY2lhdGVkIHdpdGggdGhlIGluamVjdG9yJ3MgY29ycmVzcG9uZGluZyBub2RlIHRvIGdldCB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgbGV0IGluc3RhbmNlOiBUfG51bGw7XG4gICAgICBpZiAoaW5zdGFuY2UgPSBzZWFyY2hEaXJlY3RpdmVzT25JbmplY3RvcjxUPihpbmplY3RvckluZGV4LCBpbmplY3RvclZpZXcsIHRva2VuKSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHdlICpkaWRuJ3QqIGZpbmQgdGhlIGRpcmVjdGl2ZSBmb3IgdGhlIHRva2VuIGFuZCB3ZSBhcmUgc2VhcmNoaW5nIHRoZSBjdXJyZW50IG5vZGUnc1xuICAgICAgLy8gaW5qZWN0b3IsIGl0J3MgcG9zc2libGUgdGhlIGRpcmVjdGl2ZSBpcyBvbiB0aGlzIG5vZGUgYW5kIGhhc24ndCBiZWVuIGNyZWF0ZWQgeWV0LlxuICAgICAgaWYgKGluamVjdG9ySW5kZXggPT09IHN0YXJ0SW5qZWN0b3JJbmRleCAmJiBob3N0VmlldyA9PT0gaW5qZWN0b3JWaWV3ICYmXG4gICAgICAgICAgKGluc3RhbmNlID0gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KHRva2VuLCBpbmplY3RvclZpZXdbVFZJRVddKSkpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgZGVmIHdhc24ndCBmb3VuZCBhbnl3aGVyZSBvbiB0aGlzIG5vZGUsIHNvIGl0IHdhcyBhIGZhbHNlIHBvc2l0aXZlLlxuICAgICAgLy8gVHJhdmVyc2UgdXAgdGhlIHRyZWUgYW5kIGNvbnRpbnVlIHNlYXJjaGluZy5cbiAgICAgIGNvbnN0IHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuICAgICAgaW5qZWN0b3JJbmRleCA9IHBhcmVudExvY2F0aW9uICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICAgICAgaW5qZWN0b3JWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBpbmplY3RvclZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1vZHVsZUluamVjdG9yID0gaG9zdFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KHRva2VuOiBhbnksIGhvc3RUVmlldzogVFZpZXcpOiBUfG51bGwge1xuICBjb25zdCBtYXRjaGVzID0gaG9zdFRWaWV3LmN1cnJlbnRNYXRjaGVzO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWZJbnRlcm5hbDxhbnk+O1xuICAgICAgaWYgKGRlZi50eXBlID09PSB0b2tlbikge1xuICAgICAgICByZXR1cm4gcmVzb2x2ZURpcmVjdGl2ZShkZWYsIGkgKyAxLCBtYXRjaGVzLCBob3N0VFZpZXcpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gc2VhcmNoRGlyZWN0aXZlc09uSW5qZWN0b3I8VD4oXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3RGF0YSwgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+KSB7XG4gIGNvbnN0IHROb2RlID0gaW5qZWN0b3JWaWV3W1RWSUVXXS5kYXRhW2luamVjdG9ySW5kZXggKyBUTk9ERV0gYXMgVE5vZGU7XG4gIGNvbnN0IG5vZGVGbGFncyA9IHROb2RlLmZsYWdzO1xuICBjb25zdCBjb3VudCA9IG5vZGVGbGFncyAmIFROb2RlRmxhZ3MuRGlyZWN0aXZlQ291bnRNYXNrO1xuXG4gIGlmIChjb3VudCAhPT0gMCkge1xuICAgIGNvbnN0IHN0YXJ0ID0gbm9kZUZsYWdzID4+IFROb2RlRmxhZ3MuRGlyZWN0aXZlU3RhcnRpbmdJbmRleFNoaWZ0O1xuICAgIGNvbnN0IGVuZCA9IHN0YXJ0ICsgY291bnQ7XG4gICAgY29uc3QgZGVmcyA9IGluamVjdG9yVmlld1tUVklFV10uZGlyZWN0aXZlcyAhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIC8vIEdldCB0aGUgZGVmaW5pdGlvbiBmb3IgdGhlIGRpcmVjdGl2ZSBhdCB0aGlzIGluZGV4IGFuZCwgaWYgaXQgaXMgaW5qZWN0YWJsZSAoZGlQdWJsaWMpLFxuICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmSW50ZXJuYWw8YW55PjtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RvclZpZXdbRElSRUNUSVZFU10gIVtpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogbnVtYmVyfEZ1bmN0aW9ufFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJyA/IHRva2VuSWQgJiBCTE9PTV9NQVNLIDogdG9rZW5JZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdG9ySGFzVG9rZW4oXG4gICAgYmxvb21IYXNoOiBudW1iZXIsIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlld0RhdGEgfCBURGF0YSkge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tSGFzaDtcbiAgY29uc3QgYjcgPSBibG9vbUhhc2ggJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tSGFzaCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21IYXNoICYgMHgyMDtcblxuICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gIGxldCB2YWx1ZTogbnVtYmVyO1xuXG4gIGlmIChiNykge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDddIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA2XSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDVdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA0XSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgM10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDJdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleF0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICByZXR1cm4gISEodmFsdWUgJiBtYXNrKTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcocGFyZW50TG9jYXRpb246IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFwYXJlbnRMb2NhdGlvbiAmJiAocGFyZW50TG9jYXRpb24gPj4gSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgPT09IDA7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHByaXZhdGUgX2luamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge1xuICAgIHRoaXMuX2luamVjdG9ySW5kZXggPSBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoX3ROb2RlLCBfaG9zdFZpZXcpO1xuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnkpOiBhbnkge1xuICAgIGlmICh0b2tlbiA9PT0gUmVuZGVyZXIyKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodGhpcy5faG9zdFZpZXcpO1xuICAgIH1cblxuICAgIHNldEVudmlyb25tZW50KHRoaXMuX3ROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSh0aGlzLl9pbmplY3RvckluZGV4LCB0aGlzLl9ob3N0VmlldywgdG9rZW4pO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6ICgodHlwZT86IFR5cGU8VD4pID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=