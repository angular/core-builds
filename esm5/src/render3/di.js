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
var BLOOM_SIZE = 256;
var BLOOM_MASK = BLOOM_SIZE - 1;
/** Counter used to generate unique IDs for directives. */
var nextNgElementId = 0;
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
        var tData = tView.data;
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
    var existingInjectorIndex = getInjectorIndex(tNode, hostView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    var tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        tNode.injectorIndex = hostView.length;
        setUpBloom(tView.data, tNode); // foundation for node bloom
        setUpBloom(hostView, null); // foundation for cumulative bloom
        setUpBloom(tView.blueprint, null);
    }
    var parentLoc = getParentInjectorLocation(tNode, hostView);
    var parentIndex = parentLoc & 32767 /* InjectorIndexMask */;
    var parentView = getParentInjectorView(parentLoc, hostView);
    var parentData = parentView[TVIEW].data;
    var injectorIndex = tNode.injectorIndex;
    // If a parent injector can't be found, its location is set to -1.
    // In that case, we don't need to set up a cumulative bloom
    if (parentLoc !== -1) {
        for (var i = 0; i < PARENT_INJECTOR; i++) {
            var bloomIndex = parentIndex + i;
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
    var hostTNode = view[HOST_NODE];
    var viewOffset = 1;
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
    var viewOffset = location >> 15 /* ViewOffsetShift */;
    var parentView = startView;
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
export function directiveInject(token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var hostTNode = getPreviousOrParentTNode();
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
function getOrCreateRenderer2(view) {
    var renderer = view[RENDERER];
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
export function getOrCreateInjectable(hostTNode, hostView, token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function')
        return bloomHash();
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash != null) {
        var startInjectorIndex = getInjectorIndex(hostTNode, hostView);
        var injectorIndex = startInjectorIndex;
        var injectorView = hostView;
        var parentLocation = -1;
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
            var instance = void 0;
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
    var moduleInjector = hostView[INJECTOR];
    var formerInjector = setCurrentInjector(moduleInjector);
    try {
        return inject(token, flags);
    }
    finally {
        setCurrentInjector(formerInjector);
    }
}
function searchMatchesQueuedForCreation(token, hostTView) {
    var matches = hostTView.currentMatches;
    if (matches) {
        for (var i = 0; i < matches.length; i += 2) {
            var def = matches[i];
            if (def.type === token) {
                return resolveDirective(def, i + 1, matches);
            }
        }
    }
    return null;
}
function searchDirectivesOnInjector(injectorIndex, injectorView, token) {
    var tNode = injectorView[TVIEW].data[injectorIndex + TNODE];
    var nodeFlags = tNode.flags;
    var count = nodeFlags & 4095 /* DirectiveCountMask */;
    if (count !== 0) {
        var start = nodeFlags >> 15 /* DirectiveStartingIndexShift */;
        var end = start + count;
        var defs = injectorView[TVIEW].data;
        for (var i = start; i < end; i++) {
            // Get the definition for the directive at this index and, if it is injectable (diPublic),
            // and matches the given token, return the directive instance.
            var directiveDef = defs[i];
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
    var tokenId = token[NG_ELEMENT_ID];
    return typeof tokenId === 'number' ? tokenId & BLOOM_MASK : tokenId;
}
export function injectorHasToken(bloomHash, injectorIndex, injectorView) {
    // Create a mask that targets the specific bit associated with the directive we're looking for.
    // JS bit operations are 32 bits, so this will be a number between 2^0 and 2^31, corresponding
    // to bit positions 0 - 31 in a 32 bit integer.
    var mask = 1 << bloomHash;
    var b7 = bloomHash & 0x80;
    var b6 = bloomHash & 0x40;
    var b5 = bloomHash & 0x20;
    // Our bloom filter size is 256 bits, which is eight 32-bit bloom filter buckets:
    // bf0 = [0 - 31], bf1 = [32 - 63], bf2 = [64 - 95], bf3 = [96 - 127], etc.
    // Get the bloom filter value from the appropriate bucket based on the directive's bloomBit.
    var value;
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
var NodeInjector = /** @class */ (function () {
    function NodeInjector(_tNode, _hostView) {
        this._tNode = _tNode;
        this._hostView = _hostView;
        this._injectorIndex = getOrCreateNodeInjectorForNode(_tNode, _hostView);
    }
    NodeInjector.prototype.get = function (token) {
        if (token === Renderer2) {
            return getOrCreateRenderer2(this._hostView);
        }
        setEnvironment(this._tNode, this._hostView);
        return getOrCreateInjectable(this._tNode, this._hostView, token);
    };
    return NodeInjector;
}());
export { NodeInjector };
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBGQUEwRjtBQUMxRixxRUFBcUU7QUFFckUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXNDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUEwQix3QkFBd0IsRUFBRSxnQkFBZ0IsRUFBRSxjQUFjLEVBQUMsTUFBTSxnQkFBZ0IsQ0FBQztBQUVoSSxPQUFPLEVBQXdCLGVBQWUsRUFBRSxLQUFLLEdBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVyRixPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBcUIsUUFBUSxFQUFTLEtBQUssRUFBUSxNQUFNLG1CQUFtQixDQUFDO0FBQzFILE9BQU8sRUFBQyx5QkFBeUIsRUFBQyxNQUFNLGVBQWUsQ0FBQztBQUV4RDs7OztHQUlHO0FBQ0gsSUFBTSxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQ3ZCLElBQU0sVUFBVSxHQUFHLFVBQVUsR0FBRyxDQUFDLENBQUM7QUFFbEMsMERBQTBEO0FBQzFELElBQUksZUFBZSxHQUFH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QyxDQUFDO0lBQ3ZDLElBQUksT0FBTyxLQUFLLElBQUksRUFBRTtRQUNwQixPQUFPLE9BQU8sQ0FBQztLQUNoQjtTQUFNO1FBQ0wsNkVBQTZFO1FBQzdFLDZFQUE2RTtRQUM3RSw2RUFBNkU7UUFDN0UsNEJBQTRCO1FBQzVCLE9BQU8sVUFBQyxDQUFDLElBQUssT0FBQSxJQUFJLENBQUMsRUFBRSxFQUFQLENBQU8sQ0FBQztLQUN2QjtBQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbi8vIFdlIGFyZSB0ZW1wb3JhcmlseSBpbXBvcnRpbmcgdGhlIGV4aXN0aW5nIHZpZXdFbmdpbmVfZnJvbSBjb3JlIHNvIHdlIGNhbiBiZSBzdXJlIHdlIGFyZVxuLy8gY29ycmVjdGx5IGltcGxlbWVudGluZyBpdHMgaW50ZXJmYWNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHkuXG5cbmltcG9ydCB7Z2V0SW5qZWN0YWJsZURlZiwgZ2V0SW5qZWN0b3JEZWZ9IGZyb20gJy4uL2RpL2RlZnMnO1xuaW1wb3J0IHtJbmplY3Rpb25Ub2tlbn0gZnJvbSAnLi4vZGkvaW5qZWN0aW9uX3Rva2VuJztcbmltcG9ydCB7SW5qZWN0RmxhZ3MsIEluamVjdG9yLCBOdWxsSW5qZWN0b3IsIGluamVjdCwgc2V0Q3VycmVudEluamVjdG9yfSBmcm9tICcuLi9kaS9pbmplY3Rvcic7XG5pbXBvcnQge1JlbmRlcmVyMn0gZnJvbSAnLi4vcmVuZGVyJztcbmltcG9ydCB7VHlwZX0gZnJvbSAnLi4vdHlwZSc7XG5cbmltcG9ydCB7YXNzZXJ0RGVmaW5lZH0gZnJvbSAnLi9hc3NlcnQnO1xuaW1wb3J0IHtnZXRDb21wb25lbnREZWYsIGdldERpcmVjdGl2ZURlZiwgZ2V0UGlwZURlZn0gZnJvbSAnLi9kZWZpbml0aW9uJztcbmltcG9ydCB7TkdfRUxFTUVOVF9JRH0gZnJvbSAnLi9maWVsZHMnO1xuaW1wb3J0IHtfZ2V0Vmlld0RhdGEsIGFzc2VydFByZXZpb3VzSXNQYXJlbnQsIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSwgcmVzb2x2ZURpcmVjdGl2ZSwgc2V0RW52aXJvbm1lbnR9IGZyb20gJy4vaW5zdHJ1Y3Rpb25zJztcbmltcG9ydCB7RGlyZWN0aXZlRGVmfSBmcm9tICcuL2ludGVyZmFjZXMvZGVmaW5pdGlvbic7XG5pbXBvcnQge0luamVjdG9yTG9jYXRpb25GbGFncywgUEFSRU5UX0lOSkVDVE9SLCBUTk9ERSx9IGZyb20gJy4vaW50ZXJmYWNlcy9pbmplY3Rvcic7XG5pbXBvcnQge0F0dHJpYnV0ZU1hcmtlciwgVENvbnRhaW5lck5vZGUsIFRFbGVtZW50Q29udGFpbmVyTm9kZSwgVEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzUHJvY2VkdXJhbFJlbmRlcmVyfSBmcm9tICcuL2ludGVyZmFjZXMvcmVuZGVyZXInO1xuaW1wb3J0IHtERUNMQVJBVElPTl9WSUVXLCBIT1NUX05PREUsIElOSkVDVE9SLCBMVmlld0RhdGEsIFBBUkVOVCwgUkVOREVSRVIsIFREYXRhLCBUVklFVywgVFZpZXd9IGZyb20gJy4vaW50ZXJmYWNlcy92aWV3JztcbmltcG9ydCB7YXNzZXJ0Tm9kZU9mUG9zc2libGVUeXBlc30gZnJvbSAnLi9ub2RlX2Fzc2VydCc7XG5cbi8qKlxuICogVGhlIG51bWJlciBvZiBzbG90cyBpbiBlYWNoIGJsb29tIGZpbHRlciAodXNlZCBieSBESSkuIFRoZSBsYXJnZXIgdGhpcyBudW1iZXIsIHRoZSBmZXdlclxuICogZGlyZWN0aXZlcyB0aGF0IHdpbGwgc2hhcmUgc2xvdHMsIGFuZCB0aHVzLCB0aGUgZmV3ZXIgZmFsc2UgcG9zaXRpdmVzIHdoZW4gY2hlY2tpbmcgZm9yXG4gKiB0aGUgZXhpc3RlbmNlIG9mIGEgZGlyZWN0aXZlLlxuICovXG5jb25zdCBCTE9PTV9TSVpFID0gMjU2O1xuY29uc3QgQkxPT01fTUFTSyA9IEJMT09NX1NJWkUgLSAxO1xuXG4vKiogQ291bnRlciB1c2VkIHRvIGdlbmVyYXRlIHVuaXF1ZSBJRHMgZm9yIGRpcmVjdGl2ZXMuICovXG5sZXQgbmV4dE5nRWxlbWVudElkID0gMDtcblxuLyoqXG4gKiBSZWdpc3RlcnMgdGhpcyBkaXJlY3RpdmUgYXMgcHJlc2VudCBpbiBpdHMgbm9kZSdzIGluamVjdG9yIGJ5IGZsaXBwaW5nIHRoZSBkaXJlY3RpdmUnc1xuICogY29ycmVzcG9uZGluZyBiaXQgaW4gdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBpbmplY3RvckluZGV4IFRoZSBpbmRleCBvZiB0aGUgbm9kZSBpbmplY3RvciB3aGVyZSB0aGlzIHRva2VuIHNob3VsZCBiZSByZWdpc3RlcmVkXG4gKiBAcGFyYW0gdFZpZXcgVGhlIFRWaWV3IGZvciB0aGUgaW5qZWN0b3IncyBibG9vbSBmaWx0ZXJzXG4gKiBAcGFyYW0gdHlwZSBUaGUgZGlyZWN0aXZlIHRva2VuIHRvIHJlZ2lzdGVyXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBibG9vbUFkZChpbmplY3RvckluZGV4OiBudW1iZXIsIHRWaWV3OiBUVmlldywgdHlwZTogVHlwZTxhbnk+KTogdm9pZCB7XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIGxldCBpZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF07XG5cbiAgICAvLyBTZXQgYSB1bmlxdWUgSUQgb24gdGhlIGRpcmVjdGl2ZSB0eXBlLCBzbyBpZiBzb21ldGhpbmcgdHJpZXMgdG8gaW5qZWN0IHRoZSBkaXJlY3RpdmUsXG4gICAgLy8gd2UgY2FuIGVhc2lseSByZXRyaWV2ZSB0aGUgSUQgYW5kIGhhc2ggaXQgaW50byB0aGUgYmxvb20gYml0IHRoYXQgc2hvdWxkIGJlIGNoZWNrZWQuXG4gICAgaWYgKGlkID09IG51bGwpIHtcbiAgICAgIGlkID0gKHR5cGUgYXMgYW55KVtOR19FTEVNRU5UX0lEXSA9IG5leHROZ0VsZW1lbnRJZCsrO1xuICAgIH1cblxuICAgIC8vIFdlIG9ubHkgaGF2ZSBCTE9PTV9TSVpFICgyNTYpIHNsb3RzIGluIG91ciBibG9vbSBmaWx0ZXIgKDggYnVja2V0cyAqIDMyIGJpdHMgZWFjaCksXG4gICAgLy8gc28gYWxsIHVuaXF1ZSBJRHMgbXVzdCBiZSBtb2R1bG8tZWQgaW50byBhIG51bWJlciBmcm9tIDAgLSAyNTUgdG8gZml0IGludG8gdGhlIGZpbHRlci5cbiAgICBjb25zdCBibG9vbUJpdCA9IGlkICYgQkxPT01fTUFTSztcblxuICAgIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUuXG4gICAgLy8gSlMgYml0IG9wZXJhdGlvbnMgYXJlIDMyIGJpdHMsIHNvIHRoaXMgd2lsbCBiZSBhIG51bWJlciBiZXR3ZWVuIDJeMCBhbmQgMl4zMSwgY29ycmVzcG9uZGluZ1xuICAgIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gICAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21CaXQ7XG5cbiAgICAvLyBVc2UgdGhlIHJhdyBibG9vbUJpdCBudW1iZXIgdG8gZGV0ZXJtaW5lIHdoaWNoIGJsb29tIGZpbHRlciBidWNrZXQgd2Ugc2hvdWxkIGNoZWNrXG4gICAgLy8gZS5nOiBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Y1xuICAgIGNvbnN0IGI3ID0gYmxvb21CaXQgJiAweDgwO1xuICAgIGNvbnN0IGI2ID0gYmxvb21CaXQgJiAweDQwO1xuICAgIGNvbnN0IGI1ID0gYmxvb21CaXQgJiAweDIwO1xuICAgIGNvbnN0IHREYXRhID0gdFZpZXcuZGF0YSBhcyBudW1iZXJbXTtcblxuICAgIGlmIChiNykge1xuICAgICAgYjYgPyAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDddIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA2XSB8PSBtYXNrKSkgOlxuICAgICAgICAgICAoYjUgPyAodERhdGFbaW5qZWN0b3JJbmRleCArIDVdIHw9IG1hc2spIDogKHREYXRhW2luamVjdG9ySW5kZXggKyA0XSB8PSBtYXNrKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAzXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMl0gfD0gbWFzaykpIDpcbiAgICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyAxXSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4XSB8PSBtYXNrKSk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpOiBudW1iZXIge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgICAgZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCkgYXMgVEVsZW1lbnROb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlIHwgVENvbnRhaW5lck5vZGUsXG4gICAgICBfZ2V0Vmlld0RhdGEoKSk7XG59XG5cbi8qKlxuICogQ3JlYXRlcyAob3IgZ2V0cyBhbiBleGlzdGluZykgaW5qZWN0b3IgZm9yIGEgZ2l2ZW4gZWxlbWVudCBvciBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIHROb2RlIGZvciB3aGljaCBhbiBpbmplY3RvciBzaG91bGQgYmUgcmV0cmlldmVkIC8gY3JlYXRlZC5cbiAqIEBwYXJhbSBob3N0VmlldyBWaWV3IHdoZXJlIHRoZSBub2RlIGlzIHN0b3JlZFxuICogQHJldHVybnMgTm9kZSBpbmplY3RvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3JGb3JOb2RlKFxuICAgIHROb2RlOiBURWxlbWVudE5vZGUgfCBUQ29udGFpbmVyTm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSwgaG9zdFZpZXc6IExWaWV3RGF0YSk6IG51bWJlciB7XG4gIGNvbnN0IGV4aXN0aW5nSW5qZWN0b3JJbmRleCA9IGdldEluamVjdG9ySW5kZXgodE5vZGUsIGhvc3RWaWV3KTtcbiAgaWYgKGV4aXN0aW5nSW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gZXhpc3RpbmdJbmplY3RvckluZGV4O1xuICB9XG5cbiAgY29uc3QgdFZpZXcgPSBob3N0Vmlld1tUVklFV107XG4gIGlmICh0Vmlldy5maXJzdFRlbXBsYXRlUGFzcykge1xuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBob3N0Vmlldy5sZW5ndGg7XG4gICAgc2V0VXBCbG9vbSh0Vmlldy5kYXRhLCB0Tm9kZSk7ICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgc2V0VXBCbG9vbShob3N0VmlldywgbnVsbCk7ICAgICAvLyBmb3VuZGF0aW9uIGZvciBjdW11bGF0aXZlIGJsb29tXG4gICAgc2V0VXBCbG9vbSh0Vmlldy5ibHVlcHJpbnQsIG51bGwpO1xuICB9XG5cbiAgY29uc3QgcGFyZW50TG9jID0gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZSwgaG9zdFZpZXcpO1xuICBjb25zdCBwYXJlbnRJbmRleCA9IHBhcmVudExvYyAmIEluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbiAgY29uc3QgcGFyZW50VmlldzogTFZpZXdEYXRhID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvYywgaG9zdFZpZXcpO1xuXG4gIGNvbnN0IHBhcmVudERhdGEgPSBwYXJlbnRWaWV3W1RWSUVXXS5kYXRhIGFzIGFueTtcbiAgY29uc3QgaW5qZWN0b3JJbmRleCA9IHROb2RlLmluamVjdG9ySW5kZXg7XG5cbiAgLy8gSWYgYSBwYXJlbnQgaW5qZWN0b3IgY2FuJ3QgYmUgZm91bmQsIGl0cyBsb2NhdGlvbiBpcyBzZXQgdG8gLTEuXG4gIC8vIEluIHRoYXQgY2FzZSwgd2UgZG9uJ3QgbmVlZCB0byBzZXQgdXAgYSBjdW11bGF0aXZlIGJsb29tXG4gIGlmIChwYXJlbnRMb2MgIT09IC0xKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBQQVJFTlRfSU5KRUNUT1I7IGkrKykge1xuICAgICAgY29uc3QgYmxvb21JbmRleCA9IHBhcmVudEluZGV4ICsgaTtcbiAgICAgIC8vIENyZWF0ZXMgYSBjdW11bGF0aXZlIGJsb29tIGZpbHRlciB0aGF0IG1lcmdlcyB0aGUgcGFyZW50J3MgYmxvb20gZmlsdGVyXG4gICAgICAvLyBhbmQgaXRzIG93biBjdW11bGF0aXZlIGJsb29tICh3aGljaCBjb250YWlucyB0b2tlbnMgZm9yIGFsbCBhbmNlc3RvcnMpXG4gICAgICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgaV0gPSBwYXJlbnRWaWV3W2Jsb29tSW5kZXhdIHwgcGFyZW50RGF0YVtibG9vbUluZGV4XTtcbiAgICB9XG4gIH1cblxuICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9IHBhcmVudExvYztcbiAgcmV0dXJuIGluamVjdG9ySW5kZXg7XG59XG5cbmZ1bmN0aW9uIHNldFVwQmxvb20oYXJyOiBhbnlbXSwgZm9vdGVyOiBUTm9kZSB8IG51bGwpIHtcbiAgYXJyLnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgZm9vdGVyKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluamVjdG9ySW5kZXgodE5vZGU6IFROb2RlLCBob3N0VmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLmluamVjdG9ySW5kZXggPT09IC0xIHx8XG4gICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaW5kZXggaXMgdGhlIHNhbWUgYXMgaXRzIHBhcmVudCdzIGluamVjdG9yIGluZGV4LCB0aGVuIHRoZSBpbmRleCBoYXMgYmVlblxuICAgICAgLy8gY29waWVkIGRvd24gZnJvbSB0aGUgcGFyZW50IG5vZGUuIE5vIGluamVjdG9yIGhhcyBiZWVuIGNyZWF0ZWQgeWV0IG9uIHRoaXMgbm9kZS5cbiAgICAgICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggPT09IHROb2RlLmluamVjdG9ySW5kZXgpIHx8XG4gICAgICAvLyBBZnRlciB0aGUgZmlyc3QgdGVtcGxhdGUgcGFzcywgdGhlIGluamVjdG9yIGluZGV4IG1pZ2h0IGV4aXN0IGJ1dCB0aGUgcGFyZW50IHZhbHVlc1xuICAgICAgLy8gbWlnaHQgbm90IGhhdmUgYmVlbiBjYWxjdWxhdGVkIHlldCBmb3IgdGhpcyBpbnN0YW5jZVxuICAgICAgaG9zdFZpZXdbdE5vZGUuaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPT0gbnVsbCkge1xuICAgIHJldHVybiAtMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdE5vZGUuaW5qZWN0b3JJbmRleDtcbiAgfVxufVxuXG4vKipcbiAqIEZpbmRzIHRoZSBpbmRleCBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aXRoIGEgdmlldyBvZmZzZXQgaWYgYXBwbGljYWJsZS4gVXNlZCB0byBzZXQgdGhlXG4gKiBwYXJlbnQgaW5qZWN0b3IgaW5pdGlhbGx5LlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbih0Tm9kZTogVE5vZGUsIHZpZXc6IExWaWV3RGF0YSk6IG51bWJlciB7XG4gIGlmICh0Tm9kZS5wYXJlbnQgJiYgdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIHROb2RlLnBhcmVudC5pbmplY3RvckluZGV4OyAgLy8gdmlldyBvZmZzZXQgaXMgMFxuICB9XG5cbiAgLy8gRm9yIG1vc3QgY2FzZXMsIHRoZSBwYXJlbnQgaW5qZWN0b3IgaW5kZXggY2FuIGJlIGZvdW5kIG9uIHRoZSBob3N0IG5vZGUgKGUuZy4gZm9yIGNvbXBvbmVudFxuICAvLyBvciBjb250YWluZXIpLCBzbyB0aGlzIGxvb3Agd2lsbCBiZSBza2lwcGVkLCBidXQgd2UgbXVzdCBrZWVwIHRoZSBsb29wIGhlcmUgdG8gc3VwcG9ydFxuICAvLyB0aGUgcmFyZXIgY2FzZSBvZiBkZWVwbHkgbmVzdGVkIDxuZy10ZW1wbGF0ZT4gdGFncyBvciBpbmxpbmUgdmlld3MuXG4gIGxldCBob3N0VE5vZGUgPSB2aWV3W0hPU1RfTk9ERV07XG4gIGxldCB2aWV3T2Zmc2V0ID0gMTtcbiAgd2hpbGUgKGhvc3RUTm9kZSAmJiBob3N0VE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICB2aWV3ID0gdmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXSAhO1xuICAgIHZpZXdPZmZzZXQrKztcbiAgfVxuICByZXR1cm4gaG9zdFROb2RlID9cbiAgICAgIGhvc3RUTm9kZS5pbmplY3RvckluZGV4IHwgKHZpZXdPZmZzZXQgPDwgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgOlxuICAgICAgLTE7XG59XG5cbi8qKlxuICogVW53cmFwcyBhIHBhcmVudCBpbmplY3RvciBsb2NhdGlvbiBudW1iZXIgdG8gZmluZCB0aGUgdmlldyBvZmZzZXQgZnJvbSB0aGUgY3VycmVudCBpbmplY3RvcixcbiAqIHRoZW4gd2Fsa3MgdXAgdGhlIGRlY2xhcmF0aW9uIHZpZXcgdHJlZSB1bnRpbCB0aGUgdmlldyBpcyBmb3VuZCB0aGF0IGNvbnRhaW5zIHRoZSBwYXJlbnRcbiAqIGluamVjdG9yLlxuICpcbiAqIEBwYXJhbSBsb2NhdGlvbiBUaGUgbG9jYXRpb24gb2YgdGhlIHBhcmVudCBpbmplY3Rvciwgd2hpY2ggY29udGFpbnMgdGhlIHZpZXcgb2Zmc2V0XG4gKiBAcGFyYW0gc3RhcnRWaWV3IFRoZSBMVmlld0RhdGEgaW5zdGFuY2UgZnJvbSB3aGljaCB0byBzdGFydCB3YWxraW5nIHVwIHRoZSB2aWV3IHRyZWVcbiAqIEByZXR1cm5zIFRoZSBMVmlld0RhdGEgaW5zdGFuY2UgdGhhdCBjb250YWlucyB0aGUgcGFyZW50IGluamVjdG9yXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvclZpZXcobG9jYXRpb246IG51bWJlciwgc3RhcnRWaWV3OiBMVmlld0RhdGEpOiBMVmlld0RhdGEge1xuICBsZXQgdmlld09mZnNldCA9IGxvY2F0aW9uID4+IEluamVjdG9yTG9jYXRpb25GbGFncy5WaWV3T2Zmc2V0U2hpZnQ7XG4gIGxldCBwYXJlbnRWaWV3ID0gc3RhcnRWaWV3O1xuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0IHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWRcbiAgLy8gPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cywgd2hlcmUgdGhlIHBhcmVudCBpbmplY3RvciBtaWdodCBsaXZlIG1hbnkgdmlld3NcbiAgLy8gYWJvdmUgdGhlIGNoaWxkIGluamVjdG9yLlxuICB3aGlsZSAodmlld09mZnNldCA+IDApIHtcbiAgICBwYXJlbnRWaWV3ID0gcGFyZW50Vmlld1tERUNMQVJBVElPTl9WSUVXXSAhO1xuICAgIHZpZXdPZmZzZXQtLTtcbiAgfVxuICByZXR1cm4gcGFyZW50Vmlldztcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRpIFRoZSBub2RlIGluamVjdG9yIGluIHdoaWNoIGEgZGlyZWN0aXZlIHdpbGwgYmUgYWRkZWRcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWNJbkluamVjdG9yKFxuICAgIGluamVjdG9ySW5kZXg6IG51bWJlciwgdmlldzogTFZpZXdEYXRhLCBkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGJsb29tQWRkKGluamVjdG9ySW5kZXgsIHZpZXdbVFZJRVddLCBkZWYudHlwZSk7XG59XG5cbi8qKlxuICogTWFrZXMgYSBkaXJlY3RpdmUgcHVibGljIHRvIHRoZSBESSBzeXN0ZW0gYnkgYWRkaW5nIGl0IHRvIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyLlxuICpcbiAqIEBwYXJhbSBkZWYgVGhlIGRlZmluaXRpb24gb2YgdGhlIGRpcmVjdGl2ZSB0byBiZSBtYWRlIHB1YmxpY1xuICovXG5leHBvcnQgZnVuY3Rpb24gZGlQdWJsaWMoZGVmOiBEaXJlY3RpdmVEZWY8YW55Pik6IHZvaWQge1xuICBkaVB1YmxpY0luSW5qZWN0b3IoZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKSwgX2dldFZpZXdEYXRhKCksIGRlZik7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIGBkaXJlY3RpdmVJbmplY3RgIGlzIGludGVuZGVkIHRvIGJlIHVzZWQgZm9yIGRpcmVjdGl2ZSwgY29tcG9uZW50IGFuZCBwaXBlIGZhY3Rvcmllcy5cbiAqICBBbGwgb3RoZXIgaW5qZWN0aW9uIHVzZSBgaW5qZWN0YCB3aGljaCBkb2VzIG5vdCB3YWxrIHRoZSBub2RlIGluamVjdG9yIHRyZWUuXG4gKlxuICogVXNhZ2UgZXhhbXBsZSAoaW4gZmFjdG9yeSBmdW5jdGlvbik6XG4gKlxuICogY2xhc3MgU29tZURpcmVjdGl2ZSB7XG4gKiAgIGNvbnN0cnVjdG9yKGRpcmVjdGl2ZTogRGlyZWN0aXZlQSkge31cbiAqXG4gKiAgIHN0YXRpYyBuZ0RpcmVjdGl2ZURlZiA9IGRlZmluZURpcmVjdGl2ZSh7XG4gKiAgICAgdHlwZTogU29tZURpcmVjdGl2ZSxcbiAqICAgICBmYWN0b3J5OiAoKSA9PiBuZXcgU29tZURpcmVjdGl2ZShkaXJlY3RpdmVJbmplY3QoRGlyZWN0aXZlQSkpXG4gKiAgIH0pO1xuICogfVxuICpcbiAqIEBwYXJhbSB0b2tlbiB0aGUgdHlwZSBvciB0b2tlbiB0byBpbmplY3RcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciBgbnVsbGAgd2hlbiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pOiBUO1xuZXhwb3J0IGZ1bmN0aW9uIGRpcmVjdGl2ZUluamVjdDxUPih0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4sIGZsYWdzOiBJbmplY3RGbGFncyk6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KFxuICAgIHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgY29uc3QgaG9zdFROb2RlID1cbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRDb250YWluZXJOb2RlIHwgVEVsZW1lbnRDb250YWluZXJOb2RlO1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGhvc3RUTm9kZSwgX2dldFZpZXdEYXRhKCksIHRva2VuLCBmbGFncyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RSZW5kZXJlcjIoKTogUmVuZGVyZXIyIHtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlUmVuZGVyZXIyKF9nZXRWaWV3RGF0YSgpKTtcbn1cbi8qKlxuICogSW5qZWN0IHN0YXRpYyBhdHRyaWJ1dGUgdmFsdWUgaW50byBkaXJlY3RpdmUgY29uc3RydWN0b3IuXG4gKlxuICogVGhpcyBtZXRob2QgaXMgdXNlZCB3aXRoIGBmYWN0b3J5YCBmdW5jdGlvbnMgd2hpY2ggYXJlIGdlbmVyYXRlZCBhcyBwYXJ0IG9mXG4gKiBgZGVmaW5lRGlyZWN0aXZlYCBvciBgZGVmaW5lQ29tcG9uZW50YC4gVGhlIG1ldGhvZCByZXRyaWV2ZXMgdGhlIHN0YXRpYyB2YWx1ZVxuICogb2YgYW4gYXR0cmlidXRlLiAoRHluYW1pYyBhdHRyaWJ1dGVzIGFyZSBub3Qgc3VwcG9ydGVkIHNpbmNlIHRoZXkgYXJlIG5vdCByZXNvbHZlZFxuICogIGF0IHRoZSB0aW1lIG9mIGluamVjdGlvbiBhbmQgY2FuIGNoYW5nZSBvdmVyIHRpbWUuKVxuICpcbiAqICMgRXhhbXBsZVxuICogR2l2ZW46XG4gKiBgYGBcbiAqIEBDb21wb25lbnQoLi4uKVxuICogY2xhc3MgTXlDb21wb25lbnQge1xuICogICBjb25zdHJ1Y3RvcihAQXR0cmlidXRlKCd0aXRsZScpIHRpdGxlOiBzdHJpbmcpIHsgLi4uIH1cbiAqIH1cbiAqIGBgYFxuICogV2hlbiBpbnN0YW50aWF0ZWQgd2l0aFxuICogYGBgXG4gKiA8bXktY29tcG9uZW50IHRpdGxlPVwiSGVsbG9cIj48L215LWNvbXBvbmVudD5cbiAqIGBgYFxuICpcbiAqIFRoZW4gZmFjdG9yeSBtZXRob2QgZ2VuZXJhdGVkIGlzOlxuICogYGBgXG4gKiBNeUNvbXBvbmVudC5uZ0NvbXBvbmVudERlZiA9IGRlZmluZUNvbXBvbmVudCh7XG4gKiAgIGZhY3Rvcnk6ICgpID0+IG5ldyBNeUNvbXBvbmVudChpbmplY3RBdHRyaWJ1dGUoJ3RpdGxlJykpXG4gKiAgIC4uLlxuICogfSlcbiAqIGBgYFxuICpcbiAqIEBleHBlcmltZW50YWxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGluamVjdEF0dHJpYnV0ZShhdHRyTmFtZVRvSW5qZWN0OiBzdHJpbmcpOiBzdHJpbmd8dW5kZWZpbmVkIHtcbiAgY29uc3QgdE5vZGUgPSBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUoKTtcbiAgbmdEZXZNb2RlICYmIGFzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXMoXG4gICAgICAgICAgICAgICAgICAgdE5vZGUsIFROb2RlVHlwZS5Db250YWluZXIsIFROb2RlVHlwZS5FbGVtZW50LCBUTm9kZVR5cGUuRWxlbWVudENvbnRhaW5lcik7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnREZWZpbmVkKHROb2RlLCAnZXhwZWN0aW5nIHROb2RlJyk7XG4gIGNvbnN0IGF0dHJzID0gdE5vZGUuYXR0cnM7XG4gIGlmIChhdHRycykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpID0gaSArIDIpIHtcbiAgICAgIGNvbnN0IGF0dHJOYW1lID0gYXR0cnNbaV07XG4gICAgICBpZiAoYXR0ck5hbWUgPT09IEF0dHJpYnV0ZU1hcmtlci5TZWxlY3RPbmx5KSBicmVhaztcbiAgICAgIGlmIChhdHRyTmFtZSA9PSBhdHRyTmFtZVRvSW5qZWN0KSB7XG4gICAgICAgIHJldHVybiBhdHRyc1tpICsgMV0gYXMgc3RyaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gdW5kZWZpbmVkO1xufVxuXG5mdW5jdGlvbiBnZXRPckNyZWF0ZVJlbmRlcmVyMih2aWV3OiBMVmlld0RhdGEpOiBSZW5kZXJlcjIge1xuICBjb25zdCByZW5kZXJlciA9IHZpZXdbUkVOREVSRVJdO1xuICBpZiAoaXNQcm9jZWR1cmFsUmVuZGVyZXIocmVuZGVyZXIpKSB7XG4gICAgcmV0dXJuIHJlbmRlcmVyIGFzIFJlbmRlcmVyMjtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBpbmplY3QgUmVuZGVyZXIyIHdoZW4gdGhlIGFwcGxpY2F0aW9uIHVzZXMgUmVuZGVyZXIzIScpO1xuICB9XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgdmFsdWUgYXNzb2NpYXRlZCB0byB0aGUgZ2l2ZW4gdG9rZW4gZnJvbSB0aGUgaW5qZWN0b3JzLlxuICpcbiAqIExvb2sgZm9yIHRoZSBpbmplY3RvciBwcm92aWRpbmcgdGhlIHRva2VuIGJ5IHdhbGtpbmcgdXAgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZSBhbmQgdGhlblxuICogdGhlIG1vZHVsZSBpbmplY3RvciB0cmVlLlxuICpcbiAqIEBwYXJhbSBub2RlSW5qZWN0b3IgTm9kZSBpbmplY3RvciB3aGVyZSB0aGUgc2VhcmNoIHNob3VsZCBzdGFydFxuICogQHBhcmFtIHRva2VuIFRoZSB0b2tlbiB0byBsb29rIGZvclxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KFxuICAgIGhvc3RUTm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEsXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFnczogSW5qZWN0RmxhZ3MgPSBJbmplY3RGbGFncy5EZWZhdWx0KTogVHxudWxsIHtcbiAgY29uc3QgYmxvb21IYXNoID0gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuKTtcbiAgLy8gSWYgdGhlIElEIHN0b3JlZCBoZXJlIGlzIGEgZnVuY3Rpb24sIHRoaXMgaXMgYSBzcGVjaWFsIG9iamVjdCBsaWtlIEVsZW1lbnRSZWYgb3IgVGVtcGxhdGVSZWZcbiAgLy8gc28ganVzdCBjYWxsIHRoZSBmYWN0b3J5IGZ1bmN0aW9uIHRvIGNyZWF0ZSBpdC5cbiAgaWYgKHR5cGVvZiBibG9vbUhhc2ggPT09ICdmdW5jdGlvbicpIHJldHVybiBibG9vbUhhc2goKTtcblxuICAvLyBJZiB0aGUgdG9rZW4gaGFzIGEgYmxvb20gaGFzaCwgdGhlbiBpdCBpcyBhIGRpcmVjdGl2ZSB0aGF0IGlzIHB1YmxpYyB0byB0aGUgaW5qZWN0aW9uIHN5c3RlbVxuICAvLyAoZGlQdWJsaWMpIG90aGVyd2lzZSBmYWxsIGJhY2sgdG8gdGhlIG1vZHVsZSBpbmplY3Rvci5cbiAgaWYgKGJsb29tSGFzaCAhPSBudWxsKSB7XG4gICAgY29uc3Qgc3RhcnRJbmplY3RvckluZGV4ID0gZ2V0SW5qZWN0b3JJbmRleChob3N0VE5vZGUsIGhvc3RWaWV3KTtcblxuICAgIGxldCBpbmplY3RvckluZGV4ID0gc3RhcnRJbmplY3RvckluZGV4O1xuICAgIGxldCBpbmplY3RvclZpZXcgPSBob3N0VmlldztcbiAgICBsZXQgcGFyZW50TG9jYXRpb246IG51bWJlciA9IC0xO1xuXG4gICAgLy8gSWYgd2Ugc2hvdWxkIHNraXAgdGhpcyBpbmplY3RvciBvciBpZiBhbiBpbmplY3RvciBkb2Vzbid0IGV4aXN0IG9uIHRoaXMgbm9kZSAoZS5nLiBhbGxcbiAgICAvLyBkaXJlY3RpdmVzIG9uIHRoaXMgbm9kZSBhcmUgcHJpdmF0ZSksIHN0YXJ0IGJ5IHNlYXJjaGluZyB0aGUgcGFyZW50IGluamVjdG9yLlxuICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNraXBTZWxmIHx8IGluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgICBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9ySW5kZXggPT09IC0xID8gZ2V0UGFyZW50SW5qZWN0b3JMb2NhdGlvbihob3N0VE5vZGUsIGhvc3RWaWV3KSA6XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuXG4gICAgICBpZiAoc2hvdWxkTm90U2VhcmNoUGFyZW50KGZsYWdzLCBwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaW5qZWN0b3JJbmRleCA9IHBhcmVudExvY2F0aW9uICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICAgICAgICBpbmplY3RvclZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGluamVjdG9yVmlldyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmVcbiAgICAgIC8vICppc24ndCogYSBtYXRjaC4gT3V0ZXIgbG9vcCBpcyBuZWNlc3NhcnkgaW4gY2FzZSB3ZSBnZXQgYSBmYWxzZSBwb3NpdGl2ZSBpbmplY3Rvci5cbiAgICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgICAvLyBDaGVjayB0aGUgY3VycmVudCBpbmplY3Rvci4gSWYgaXQgbWF0Y2hlcywgc3RvcCBzZWFyY2hpbmcgZm9yIGFuIGluamVjdG9yLlxuICAgICAgICBpZiAoaW5qZWN0b3JIYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGluamVjdG9yVmlld1tUVklFV10uZGF0YSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIHBhcmVudExvY2F0aW9uID0gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdO1xuICAgICAgICBpZiAoc2hvdWxkTm90U2VhcmNoUGFyZW50KGZsYWdzLCBwYXJlbnRMb2NhdGlvbikpIHtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGUgYW5jZXN0b3IgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSwgdHJhdmVyc2VcbiAgICAgICAgLy8gdXAgdG8gZmluZCB0aGUgc3BlY2lmaWMgaW5qZWN0b3IuIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgZG9lcyBub3QgaGF2ZSB0aGUgYml0LCB3ZVxuICAgICAgICAvLyBjYW4gYWJvcnQuXG4gICAgICAgIGlmIChpbmplY3Rvckhhc1Rva2VuKGJsb29tSGFzaCwgaW5qZWN0b3JJbmRleCwgaW5qZWN0b3JWaWV3KSkge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSBwYXJlbnRMb2NhdGlvbiAmIEluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbiAgICAgICAgICBpbmplY3RvclZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGluamVjdG9yVmlldyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IC0xO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIG5vIGluamVjdG9yIGlzIGZvdW5kLCB3ZSAqa25vdyogdGhhdCB0aGVyZSBpcyBubyBhbmNlc3RvciBpbmplY3RvciB0aGF0IGNvbnRhaW5zIHRoZVxuICAgICAgLy8gdG9rZW4sIHNvIHdlIGFib3J0LlxuICAgICAgaWYgKGluamVjdG9ySW5kZXggPT09IC0xKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBBdCB0aGlzIHBvaW50LCB3ZSBoYXZlIGFuIGluamVjdG9yIHdoaWNoICptYXkqIGNvbnRhaW4gdGhlIHRva2VuLCBzbyB3ZSBzdGVwIHRocm91Z2ggdGhlXG4gICAgICAvLyBkaXJlY3RpdmVzIGFzc29jaWF0ZWQgd2l0aCB0aGUgaW5qZWN0b3IncyBjb3JyZXNwb25kaW5nIG5vZGUgdG8gZ2V0IHRoZSBkaXJlY3RpdmUgaW5zdGFuY2UuXG4gICAgICBsZXQgaW5zdGFuY2U6IFR8bnVsbDtcbiAgICAgIGlmIChpbnN0YW5jZSA9IHNlYXJjaERpcmVjdGl2ZXNPbkluamVjdG9yPFQ+KGluamVjdG9ySW5kZXgsIGluamVjdG9yVmlldywgdG9rZW4pKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgd2UgKmRpZG4ndCogZmluZCB0aGUgZGlyZWN0aXZlIGZvciB0aGUgdG9rZW4gYW5kIHdlIGFyZSBzZWFyY2hpbmcgdGhlIGN1cnJlbnQgbm9kZSdzXG4gICAgICAvLyBpbmplY3RvciwgaXQncyBwb3NzaWJsZSB0aGUgZGlyZWN0aXZlIGlzIG9uIHRoaXMgbm9kZSBhbmQgaGFzbid0IGJlZW4gY3JlYXRlZCB5ZXQuXG4gICAgICBpZiAoaW5qZWN0b3JJbmRleCA9PT0gc3RhcnRJbmplY3RvckluZGV4ICYmIGhvc3RWaWV3ID09PSBpbmplY3RvclZpZXcgJiZcbiAgICAgICAgICAoaW5zdGFuY2UgPSBzZWFyY2hNYXRjaGVzUXVldWVkRm9yQ3JlYXRpb248VD4odG9rZW4sIGluamVjdG9yVmlld1tUVklFV10pKSkge1xuICAgICAgICByZXR1cm4gaW5zdGFuY2U7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBkZWYgd2Fzbid0IGZvdW5kIGFueXdoZXJlIG9uIHRoaXMgbm9kZSwgc28gaXQgd2FzIGEgZmFsc2UgcG9zaXRpdmUuXG4gICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgdHJlZSBhbmQgY29udGludWUgc2VhcmNoaW5nLlxuICAgICAgaW5qZWN0b3JJbmRleCA9IHBhcmVudExvY2F0aW9uICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICAgICAgaW5qZWN0b3JWaWV3ID0gZ2V0UGFyZW50SW5qZWN0b3JWaWV3KHBhcmVudExvY2F0aW9uLCBpbmplY3RvclZpZXcpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG1vZHVsZUluamVjdG9yID0gaG9zdFZpZXdbSU5KRUNUT1JdO1xuICBjb25zdCBmb3JtZXJJbmplY3RvciA9IHNldEN1cnJlbnRJbmplY3Rvcihtb2R1bGVJbmplY3Rvcik7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGluamVjdCh0b2tlbiwgZmxhZ3MpO1xuICB9IGZpbmFsbHkge1xuICAgIHNldEN1cnJlbnRJbmplY3Rvcihmb3JtZXJJbmplY3Rvcik7XG4gIH1cbn1cblxuZnVuY3Rpb24gc2VhcmNoTWF0Y2hlc1F1ZXVlZEZvckNyZWF0aW9uPFQ+KHRva2VuOiBhbnksIGhvc3RUVmlldzogVFZpZXcpOiBUfG51bGwge1xuICBjb25zdCBtYXRjaGVzID0gaG9zdFRWaWV3LmN1cnJlbnRNYXRjaGVzO1xuICBpZiAobWF0Y2hlcykge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbWF0Y2hlcy5sZW5ndGg7IGkgKz0gMikge1xuICAgICAgY29uc3QgZGVmID0gbWF0Y2hlc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkZWYudHlwZSA9PT0gdG9rZW4pIHtcbiAgICAgICAgcmV0dXJuIHJlc29sdmVEaXJlY3RpdmUoZGVmLCBpICsgMSwgbWF0Y2hlcyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZWFyY2hEaXJlY3RpdmVzT25JbmplY3RvcjxUPihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIGluamVjdG9yVmlldzogTFZpZXdEYXRhLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pIHtcbiAgY29uc3QgdE5vZGUgPSBpbmplY3RvclZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSBhcyBUTm9kZTtcbiAgY29uc3Qgbm9kZUZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgaWYgKGNvdW50ICE9PSAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBjb25zdCBkZWZzID0gaW5qZWN0b3JWaWV3W1RWSUVXXS5kYXRhO1xuXG4gICAgZm9yIChsZXQgaSA9IHN0YXJ0OyBpIDwgZW5kOyBpKyspIHtcbiAgICAgIC8vIEdldCB0aGUgZGVmaW5pdGlvbiBmb3IgdGhlIGRpcmVjdGl2ZSBhdCB0aGlzIGluZGV4IGFuZCwgaWYgaXQgaXMgaW5qZWN0YWJsZSAoZGlQdWJsaWMpLFxuICAgICAgLy8gYW5kIG1hdGNoZXMgdGhlIGdpdmVuIHRva2VuLCByZXR1cm4gdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGNvbnN0IGRpcmVjdGl2ZURlZiA9IGRlZnNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGlyZWN0aXZlRGVmLnR5cGUgPT09IHRva2VuICYmIGRpcmVjdGl2ZURlZi5kaVB1YmxpYykge1xuICAgICAgICByZXR1cm4gaW5qZWN0b3JWaWV3W2ldO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBiaXQgaW4gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIgdGhhdCBzaG91bGQgYmUgdXNlZCB0byBkZXRlcm1pbmUgd2hldGhlciBvciBub3RcbiAqIHRoZSBkaXJlY3RpdmUgbWlnaHQgYmUgcHJvdmlkZWQgYnkgdGhlIGluamVjdG9yLlxuICpcbiAqIFdoZW4gYSBkaXJlY3RpdmUgaXMgcHVibGljLCBpdCBpcyBhZGRlZCB0byB0aGUgYmxvb20gZmlsdGVyIGFuZCBnaXZlbiBhIHVuaXF1ZSBJRCB0aGF0IGNhbiBiZVxuICogcmV0cmlldmVkIG9uIHRoZSBUeXBlLiBXaGVuIHRoZSBkaXJlY3RpdmUgaXNuJ3QgcHVibGljIG9yIHRoZSB0b2tlbiBpcyBub3QgYSBkaXJlY3RpdmUgYG51bGxgXG4gKiBpcyByZXR1cm5lZCBhcyB0aGUgbm9kZSBpbmplY3RvciBjYW4gbm90IHBvc3NpYmx5IHByb3ZpZGUgdGhhdCB0b2tlbi5cbiAqXG4gKiBAcGFyYW0gdG9rZW4gdGhlIGluamVjdGlvbiB0b2tlblxuICogQHJldHVybnMgdGhlIG1hdGNoaW5nIGJpdCB0byBjaGVjayBpbiB0aGUgYmxvb20gZmlsdGVyIG9yIGBudWxsYCBpZiB0aGUgdG9rZW4gaXMgbm90IGtub3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21IYXNoQml0T3JGYWN0b3J5KHRva2VuOiBUeXBlPGFueT58IEluamVjdGlvblRva2VuPGFueT4pOiBudW1iZXJ8RnVuY3Rpb258XG4gICAgdW5kZWZpbmVkIHtcbiAgY29uc3QgdG9rZW5JZDogbnVtYmVyfHVuZGVmaW5lZCA9ICh0b2tlbiBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuICByZXR1cm4gdHlwZW9mIHRva2VuSWQgPT09ICdudW1iZXInID8gdG9rZW5JZCAmIEJMT09NX01BU0sgOiB0b2tlbklkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0b3JIYXNUb2tlbihcbiAgICBibG9vbUhhc2g6IG51bWJlciwgaW5qZWN0b3JJbmRleDogbnVtYmVyLCBpbmplY3RvclZpZXc6IExWaWV3RGF0YSB8IFREYXRhKSB7XG4gIC8vIENyZWF0ZSBhIG1hc2sgdGhhdCB0YXJnZXRzIHRoZSBzcGVjaWZpYyBiaXQgYXNzb2NpYXRlZCB3aXRoIHRoZSBkaXJlY3RpdmUgd2UncmUgbG9va2luZyBmb3IuXG4gIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgLy8gdG8gYml0IHBvc2l0aW9ucyAwIC0gMzEgaW4gYSAzMiBiaXQgaW50ZWdlci5cbiAgY29uc3QgbWFzayA9IDEgPDwgYmxvb21IYXNoO1xuICBjb25zdCBiNyA9IGJsb29tSGFzaCAmIDB4ODA7XG4gIGNvbnN0IGI2ID0gYmxvb21IYXNoICYgMHg0MDtcbiAgY29uc3QgYjUgPSBibG9vbUhhc2ggJiAweDIwO1xuXG4gIC8vIE91ciBibG9vbSBmaWx0ZXIgc2l6ZSBpcyAyNTYgYml0cywgd2hpY2ggaXMgZWlnaHQgMzItYml0IGJsb29tIGZpbHRlciBidWNrZXRzOlxuICAvLyBiZjAgPSBbMCAtIDMxXSwgYmYxID0gWzMyIC0gNjNdLCBiZjIgPSBbNjQgLSA5NV0sIGJmMyA9IFs5NiAtIDEyN10sIGV0Yy5cbiAgLy8gR2V0IHRoZSBibG9vbSBmaWx0ZXIgdmFsdWUgZnJvbSB0aGUgYXBwcm9wcmlhdGUgYnVja2V0IGJhc2VkIG9uIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdC5cbiAgbGV0IHZhbHVlOiBudW1iZXI7XG5cbiAgaWYgKGI3KSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgN10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDZdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgNV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDRdKTtcbiAgfSBlbHNlIHtcbiAgICB2YWx1ZSA9IGI2ID8gKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAzXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMl0pIDpcbiAgICAgICAgICAgICAgICAgKGI1ID8gaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyAxXSA6IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4XSk7XG4gIH1cblxuICAvLyBJZiB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGhhcyB0aGUgYml0IGNvcnJlc3BvbmRpbmcgdG8gdGhlIGRpcmVjdGl2ZSdzIGJsb29tQml0IGZsaXBwZWQgb24sXG4gIC8vIHRoaXMgaW5qZWN0b3IgaXMgYSBwb3RlbnRpYWwgbWF0Y2guXG4gIHJldHVybiAhISh2YWx1ZSAmIG1hc2spO1xufVxuXG4vKiogUmV0dXJucyB0cnVlIGlmIGZsYWdzIHByZXZlbnQgcGFyZW50IGluamVjdG9yIGZyb20gYmVpbmcgc2VhcmNoZWQgZm9yIHRva2VucyAqL1xuZnVuY3Rpb24gc2hvdWxkTm90U2VhcmNoUGFyZW50KGZsYWdzOiBJbmplY3RGbGFncywgcGFyZW50TG9jYXRpb246IG51bWJlcik6IGJvb2xlYW58bnVtYmVyIHtcbiAgcmV0dXJuIGZsYWdzICYgSW5qZWN0RmxhZ3MuU2VsZiB8fFxuICAgICAgKGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJiAocGFyZW50TG9jYXRpb24gPj4gSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgPiAwKTtcbn1cblxuZXhwb3J0IGNsYXNzIE5vZGVJbmplY3RvciBpbXBsZW1lbnRzIEluamVjdG9yIHtcbiAgcHJpdmF0ZSBfaW5qZWN0b3JJbmRleDogbnVtYmVyO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcHJpdmF0ZSBfdE5vZGU6IFRFbGVtZW50Tm9kZXxUQ29udGFpbmVyTm9kZXxURWxlbWVudENvbnRhaW5lck5vZGUsXG4gICAgICBwcml2YXRlIF9ob3N0VmlldzogTFZpZXdEYXRhKSB7XG4gICAgdGhpcy5faW5qZWN0b3JJbmRleCA9IGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShfdE5vZGUsIF9ob3N0Vmlldyk7XG4gIH1cblxuICBnZXQodG9rZW46IGFueSk6IGFueSB7XG4gICAgaWYgKHRva2VuID09PSBSZW5kZXJlcjIpIHtcbiAgICAgIHJldHVybiBnZXRPckNyZWF0ZVJlbmRlcmVyMih0aGlzLl9ob3N0Vmlldyk7XG4gICAgfVxuXG4gICAgc2V0RW52aXJvbm1lbnQodGhpcy5fdE5vZGUsIHRoaXMuX2hvc3RWaWV3KTtcbiAgICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlKHRoaXMuX3ROb2RlLCB0aGlzLl9ob3N0VmlldywgdG9rZW4pO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6ICgodHlwZT86IFR5cGU8VD4pID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=