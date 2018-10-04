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
    var existingInjectorIndex = getInjectorIndex(tNode, hostView);
    if (existingInjectorIndex !== -1) {
        return existingInjectorIndex;
    }
    var tView = hostView[TVIEW];
    if (tView.firstTemplatePass) {
        // TODO(kara): Store node injector with host bindings for that node (see VIEW_DATA.md)
        tNode.injectorIndex = hostView.length;
        tView.blueprint.push(0, 0, 0, 0, 0, 0, 0, 0, null); // foundation for cumulative bloom
        tView.data.push(0, 0, 0, 0, 0, 0, 0, 0, tNode); // foundation for node bloom
        tView.hostBindingStartIndex += INJECTOR_SIZE;
    }
    var parentLoc = getParentInjectorLocation(tNode, hostView);
    var parentIndex = parentLoc & 32767 /* InjectorIndexMask */;
    var parentView = getParentInjectorView(parentLoc, hostView);
    var parentData = parentView[TVIEW].data;
    var injectorIndex = tNode.injectorIndex;
    for (var i = 0; i < PARENT_INJECTOR; i++) {
        var bloomIndex = parentIndex + i;
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
export function getOrCreateInjectable(startInjectorIndex, hostView, token, flags) {
    if (flags === void 0) { flags = 0 /* Default */; }
    var bloomHash = bloomHashBitOrFactory(token);
    // If the ID stored here is a function, this is a special object like ElementRef or TemplateRef
    // so just call the factory function to create it.
    if (typeof bloomHash === 'function')
        return bloomHash();
    // If the token has a bloom hash, then it is a directive that is public to the injection system
    // (diPublic) otherwise fall back to the module injector.
    if (bloomHash != null) {
        var injectorIndex = startInjectorIndex;
        var injectorView = hostView;
        if (flags & 4 /* SkipSelf */) {
            var parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
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
                    var parentLocation_1 = injectorView[injectorIndex + PARENT_INJECTOR];
                    injectorIndex = parentLocation_1 & 32767 /* InjectorIndexMask */;
                    injectorView = getParentInjectorView(parentLocation_1, injectorView);
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
            var parentLocation = injectorView[injectorIndex + PARENT_INJECTOR];
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
                return resolveDirective(def, i + 1, matches, hostTView);
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
        var defs = injectorView[TVIEW].directives;
        for (var i = start; i < end; i++) {
            // Get the definition for the directive at this index and, if it is injectable (diPublic),
            // and matches the given token, return the directive instance.
            var directiveDef = defs[i];
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
/**
 * Checks whether the current injector and its parent are in the same host view.
 *
 * This is necessary to support @Host() decorators. If @Host() is set, we should stop searching once
 * the injector and its parent view don't match because it means we'd cross the view boundary.
 */
function sameHostView(parentLocation) {
    return !!parentLocation && (parentLocation >> 15 /* ViewOffsetShift */) === 0;
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
        return getOrCreateInjectable(this._injectorIndex, this._hostView, token);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb3JlL3NyYy9yZW5kZXIzL2RpLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQUVILDBGQUEwRjtBQUMxRixxRUFBcUU7QUFFckUsT0FBTyxFQUFDLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLFlBQVksQ0FBQztBQUU1RCxPQUFPLEVBQXNDLE1BQU0sRUFBRSxrQkFBa0IsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBQy9GLE9BQU8sRUFBQyxTQUFTLEVBQUMsTUFBTSxXQUFXLENBQUM7QUFHcEMsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsZUFBZSxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUMsTUFBTSxjQUFjLENBQUM7QUFDMUUsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLFVBQVUsQ0FBQztBQUN2QyxPQUFPLEVBQUMsWUFBWSxFQUFFLHNCQUFzQixFQUFFLHdCQUF3QixFQUFFLGdCQUFnQixFQUFFLGNBQWMsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBRWhJLE9BQU8sRUFBQyxhQUFhLEVBQXlCLGVBQWUsRUFBRSxLQUFLLEdBQUUsTUFBTSx1QkFBdUIsQ0FBQztBQUVwRyxPQUFPLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSx1QkFBdUIsQ0FBQztBQUMzRCxPQUFPLEVBQUMsZ0JBQWdCLEVBQUUsVUFBVSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQXFCLFFBQVEsRUFBUyxLQUFLLEVBQVEsTUFBTSxtQkFBbUIsQ0FBQztBQUN0SSxPQUFPLEVBQUMseUJBQXlCLEVBQUMsTUFBTSxlQUFlLENBQUM7QUFFeEQ7Ozs7R0FJRztBQUNILElBQU0sVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUN2QixJQUFNLFVBQVUsR0FBRyxVQUFVLEdBQUcsQ0FBQyxDQUFDO0FB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LyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG4vLyBXZSBhcmUgdGVtcG9yYXJpbHkgaW1wb3J0aW5nIHRoZSBleGlzdGluZyB2aWV3RW5naW5lX2Zyb20gY29yZSBzbyB3ZSBjYW4gYmUgc3VyZSB3ZSBhcmVcbi8vIGNvcnJlY3RseSBpbXBsZW1lbnRpbmcgaXRzIGludGVyZmFjZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5LlxuXG5pbXBvcnQge2dldEluamVjdGFibGVEZWYsIGdldEluamVjdG9yRGVmfSBmcm9tICcuLi9kaS9kZWZzJztcbmltcG9ydCB7SW5qZWN0aW9uVG9rZW59IGZyb20gJy4uL2RpL2luamVjdGlvbl90b2tlbic7XG5pbXBvcnQge0luamVjdEZsYWdzLCBJbmplY3RvciwgTnVsbEluamVjdG9yLCBpbmplY3QsIHNldEN1cnJlbnRJbmplY3Rvcn0gZnJvbSAnLi4vZGkvaW5qZWN0b3InO1xuaW1wb3J0IHtSZW5kZXJlcjJ9IGZyb20gJy4uL3JlbmRlcic7XG5pbXBvcnQge1R5cGV9IGZyb20gJy4uL3R5cGUnO1xuXG5pbXBvcnQge2Fzc2VydERlZmluZWR9IGZyb20gJy4vYXNzZXJ0JztcbmltcG9ydCB7Z2V0Q29tcG9uZW50RGVmLCBnZXREaXJlY3RpdmVEZWYsIGdldFBpcGVEZWZ9IGZyb20gJy4vZGVmaW5pdGlvbic7XG5pbXBvcnQge05HX0VMRU1FTlRfSUR9IGZyb20gJy4vZmllbGRzJztcbmltcG9ydCB7X2dldFZpZXdEYXRhLCBhc3NlcnRQcmV2aW91c0lzUGFyZW50LCBnZXRQcmV2aW91c09yUGFyZW50VE5vZGUsIHJlc29sdmVEaXJlY3RpdmUsIHNldEVudmlyb25tZW50fSBmcm9tICcuL2luc3RydWN0aW9ucyc7XG5pbXBvcnQge0RpcmVjdGl2ZURlZn0gZnJvbSAnLi9pbnRlcmZhY2VzL2RlZmluaXRpb24nO1xuaW1wb3J0IHtJTkpFQ1RPUl9TSVpFLCBJbmplY3RvckxvY2F0aW9uRmxhZ3MsIFBBUkVOVF9JTkpFQ1RPUiwgVE5PREUsfSBmcm9tICcuL2ludGVyZmFjZXMvaW5qZWN0b3InO1xuaW1wb3J0IHtBdHRyaWJ1dGVNYXJrZXIsIFRDb250YWluZXJOb2RlLCBURWxlbWVudENvbnRhaW5lck5vZGUsIFRFbGVtZW50Tm9kZSwgVE5vZGUsIFROb2RlRmxhZ3MsIFROb2RlVHlwZX0gZnJvbSAnLi9pbnRlcmZhY2VzL25vZGUnO1xuaW1wb3J0IHtpc1Byb2NlZHVyYWxSZW5kZXJlcn0gZnJvbSAnLi9pbnRlcmZhY2VzL3JlbmRlcmVyJztcbmltcG9ydCB7REVDTEFSQVRJT05fVklFVywgRElSRUNUSVZFUywgSE9TVF9OT0RFLCBJTkpFQ1RPUiwgTFZpZXdEYXRhLCBQQVJFTlQsIFJFTkRFUkVSLCBURGF0YSwgVFZJRVcsIFRWaWV3fSBmcm9tICcuL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge2Fzc2VydE5vZGVPZlBvc3NpYmxlVHlwZXN9IGZyb20gJy4vbm9kZV9hc3NlcnQnO1xuXG4vKipcbiAqIFRoZSBudW1iZXIgb2Ygc2xvdHMgaW4gZWFjaCBibG9vbSBmaWx0ZXIgKHVzZWQgYnkgREkpLiBUaGUgbGFyZ2VyIHRoaXMgbnVtYmVyLCB0aGUgZmV3ZXJcbiAqIGRpcmVjdGl2ZXMgdGhhdCB3aWxsIHNoYXJlIHNsb3RzLCBhbmQgdGh1cywgdGhlIGZld2VyIGZhbHNlIHBvc2l0aXZlcyB3aGVuIGNoZWNraW5nIGZvclxuICogdGhlIGV4aXN0ZW5jZSBvZiBhIGRpcmVjdGl2ZS5cbiAqL1xuY29uc3QgQkxPT01fU0laRSA9IDI1NjtcbmNvbnN0IEJMT09NX01BU0sgPSBCTE9PTV9TSVpFIC0gMTtcblxuLyoqIENvdW50ZXIgdXNlZCB0byBnZW5lcmF0ZSB1bmlxdWUgSURzIGZvciBkaXJlY3RpdmVzLiAqL1xubGV0IG5leHROZ0VsZW1lbnRJZCA9IDA7XG5cbi8qKlxuICogUmVnaXN0ZXJzIHRoaXMgZGlyZWN0aXZlIGFzIHByZXNlbnQgaW4gaXRzIG5vZGUncyBpbmplY3RvciBieSBmbGlwcGluZyB0aGUgZGlyZWN0aXZlJ3NcbiAqIGNvcnJlc3BvbmRpbmcgYml0IGluIHRoZSBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gaW5qZWN0b3JJbmRleCBUaGUgaW5kZXggb2YgdGhlIG5vZGUgaW5qZWN0b3Igd2hlcmUgdGhpcyB0b2tlbiBzaG91bGQgYmUgcmVnaXN0ZXJlZFxuICogQHBhcmFtIHRWaWV3IFRoZSBUVmlldyBmb3IgdGhlIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyc1xuICogQHBhcmFtIHR5cGUgVGhlIGRpcmVjdGl2ZSB0b2tlbiB0byByZWdpc3RlclxuICovXG5leHBvcnQgZnVuY3Rpb24gYmxvb21BZGQoaW5qZWN0b3JJbmRleDogbnVtYmVyLCB0VmlldzogVFZpZXcsIHR5cGU6IFR5cGU8YW55Pik6IHZvaWQge1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICBsZXQgaWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodHlwZSBhcyBhbnkpW05HX0VMRU1FTlRfSURdO1xuXG4gICAgLy8gU2V0IGEgdW5pcXVlIElEIG9uIHRoZSBkaXJlY3RpdmUgdHlwZSwgc28gaWYgc29tZXRoaW5nIHRyaWVzIHRvIGluamVjdCB0aGUgZGlyZWN0aXZlLFxuICAgIC8vIHdlIGNhbiBlYXNpbHkgcmV0cmlldmUgdGhlIElEIGFuZCBoYXNoIGl0IGludG8gdGhlIGJsb29tIGJpdCB0aGF0IHNob3VsZCBiZSBjaGVja2VkLlxuICAgIGlmIChpZCA9PSBudWxsKSB7XG4gICAgICBpZCA9ICh0eXBlIGFzIGFueSlbTkdfRUxFTUVOVF9JRF0gPSBuZXh0TmdFbGVtZW50SWQrKztcbiAgICB9XG5cbiAgICAvLyBXZSBvbmx5IGhhdmUgQkxPT01fU0laRSAoMjU2KSBzbG90cyBpbiBvdXIgYmxvb20gZmlsdGVyICg4IGJ1Y2tldHMgKiAzMiBiaXRzIGVhY2gpLFxuICAgIC8vIHNvIGFsbCB1bmlxdWUgSURzIG11c3QgYmUgbW9kdWxvLWVkIGludG8gYSBudW1iZXIgZnJvbSAwIC0gMjU1IHRvIGZpdCBpbnRvIHRoZSBmaWx0ZXIuXG4gICAgY29uc3QgYmxvb21CaXQgPSBpZCAmIEJMT09NX01BU0s7XG5cbiAgICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlLlxuICAgIC8vIEpTIGJpdCBvcGVyYXRpb25zIGFyZSAzMiBiaXRzLCBzbyB0aGlzIHdpbGwgYmUgYSBudW1iZXIgYmV0d2VlbiAyXjAgYW5kIDJeMzEsIGNvcnJlc3BvbmRpbmdcbiAgICAvLyB0byBiaXQgcG9zaXRpb25zIDAgLSAzMSBpbiBhIDMyIGJpdCBpbnRlZ2VyLlxuICAgIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tQml0O1xuXG4gICAgLy8gVXNlIHRoZSByYXcgYmxvb21CaXQgbnVtYmVyIHRvIGRldGVybWluZSB3aGljaCBibG9vbSBmaWx0ZXIgYnVja2V0IHdlIHNob3VsZCBjaGVja1xuICAgIC8vIGUuZzogYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGNcbiAgICBjb25zdCBiNyA9IGJsb29tQml0ICYgMHg4MDtcbiAgICBjb25zdCBiNiA9IGJsb29tQml0ICYgMHg0MDtcbiAgICBjb25zdCBiNSA9IGJsb29tQml0ICYgMHgyMDtcbiAgICBjb25zdCB0RGF0YSA9IHRWaWV3LmRhdGEgYXMgbnVtYmVyW107XG5cbiAgICBpZiAoYjcpIHtcbiAgICAgIGI2ID8gKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA3XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNl0gfD0gbWFzaykpIDpcbiAgICAgICAgICAgKGI1ID8gKHREYXRhW2luamVjdG9ySW5kZXggKyA1XSB8PSBtYXNrKSA6ICh0RGF0YVtpbmplY3RvckluZGV4ICsgNF0gfD0gbWFzaykpO1xuICAgIH0gZWxzZSB7XG4gICAgICBiNiA/IChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgM10gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleCArIDJdIHw9IG1hc2spKSA6XG4gICAgICAgICAgIChiNSA/ICh0RGF0YVtpbmplY3RvckluZGV4ICsgMV0gfD0gbWFzaykgOiAodERhdGFbaW5qZWN0b3JJbmRleF0gfD0gbWFzaykpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3JDcmVhdGVOb2RlSW5qZWN0b3IoKTogbnVtYmVyIHtcbiAgbmdEZXZNb2RlICYmIGFzc2VydFByZXZpb3VzSXNQYXJlbnQoKTtcbiAgcmV0dXJuIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICAgIGdldFByZXZpb3VzT3JQYXJlbnRUTm9kZSgpIGFzIFRFbGVtZW50Tm9kZSB8IFRFbGVtZW50Q29udGFpbmVyTm9kZSB8IFRDb250YWluZXJOb2RlLFxuICAgICAgX2dldFZpZXdEYXRhKCkpO1xufVxuXG4vKipcbiAqIENyZWF0ZXMgKG9yIGdldHMgYW4gZXhpc3RpbmcpIGluamVjdG9yIGZvciBhIGdpdmVuIGVsZW1lbnQgb3IgY29udGFpbmVyLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSBmb3Igd2hpY2ggYW4gaW5qZWN0b3Igc2hvdWxkIGJlIHJldHJpZXZlZCAvIGNyZWF0ZWQuXG4gKiBAcGFyYW0gaG9zdFZpZXcgVmlldyB3aGVyZSB0aGUgbm9kZSBpcyBzdG9yZWRcbiAqIEByZXR1cm5zIE5vZGUgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlTm9kZUluamVjdG9yRm9yTm9kZShcbiAgICB0Tm9kZTogVEVsZW1lbnROb2RlIHwgVENvbnRhaW5lck5vZGUgfCBURWxlbWVudENvbnRhaW5lck5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBudW1iZXIge1xuICBjb25zdCBleGlzdGluZ0luamVjdG9ySW5kZXggPSBnZXRJbmplY3RvckluZGV4KHROb2RlLCBob3N0Vmlldyk7XG4gIGlmIChleGlzdGluZ0luamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgcmV0dXJuIGV4aXN0aW5nSW5qZWN0b3JJbmRleDtcbiAgfVxuXG4gIGNvbnN0IHRWaWV3ID0gaG9zdFZpZXdbVFZJRVddO1xuICBpZiAodFZpZXcuZmlyc3RUZW1wbGF0ZVBhc3MpIHtcbiAgICAvLyBUT0RPKGthcmEpOiBTdG9yZSBub2RlIGluamVjdG9yIHdpdGggaG9zdCBiaW5kaW5ncyBmb3IgdGhhdCBub2RlIChzZWUgVklFV19EQVRBLm1kKVxuICAgIHROb2RlLmluamVjdG9ySW5kZXggPSBob3N0Vmlldy5sZW5ndGg7XG4gICAgdFZpZXcuYmx1ZXByaW50LnB1c2goMCwgMCwgMCwgMCwgMCwgMCwgMCwgMCwgbnVsbCk7ICAvLyBmb3VuZGF0aW9uIGZvciBjdW11bGF0aXZlIGJsb29tXG4gICAgdFZpZXcuZGF0YS5wdXNoKDAsIDAsIDAsIDAsIDAsIDAsIDAsIDAsIHROb2RlKTsgICAgICAvLyBmb3VuZGF0aW9uIGZvciBub2RlIGJsb29tXG4gICAgdFZpZXcuaG9zdEJpbmRpbmdTdGFydEluZGV4ICs9IElOSkVDVE9SX1NJWkU7XG4gIH1cblxuICBjb25zdCBwYXJlbnRMb2MgPSBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlLCBob3N0Vmlldyk7XG4gIGNvbnN0IHBhcmVudEluZGV4ID0gcGFyZW50TG9jICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICBjb25zdCBwYXJlbnRWaWV3OiBMVmlld0RhdGEgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jLCBob3N0Vmlldyk7XG5cbiAgY29uc3QgcGFyZW50RGF0YSA9IHBhcmVudFZpZXdbVFZJRVddLmRhdGEgYXMgYW55O1xuICBjb25zdCBpbmplY3RvckluZGV4ID0gdE5vZGUuaW5qZWN0b3JJbmRleDtcblxuICBmb3IgKGxldCBpID0gMDsgaSA8IFBBUkVOVF9JTkpFQ1RPUjsgaSsrKSB7XG4gICAgY29uc3QgYmxvb21JbmRleCA9IHBhcmVudEluZGV4ICsgaTtcbiAgICBob3N0Vmlld1tpbmplY3RvckluZGV4ICsgaV0gPVxuICAgICAgICBwYXJlbnRMb2MgPT09IC0xID8gMCA6IHBhcmVudFZpZXdbYmxvb21JbmRleF0gfCBwYXJlbnREYXRhW2Jsb29tSW5kZXhdO1xuICB9XG5cbiAgaG9zdFZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl0gPSBwYXJlbnRMb2M7XG4gIHJldHVybiBpbmplY3RvckluZGV4O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0SW5qZWN0b3JJbmRleCh0Tm9kZTogVE5vZGUsIGhvc3RWaWV3OiBMVmlld0RhdGEpOiBudW1iZXIge1xuICBpZiAodE5vZGUuaW5qZWN0b3JJbmRleCA9PT0gLTEgfHxcbiAgICAgIC8vIElmIHRoZSBpbmplY3RvciBpbmRleCBpcyB0aGUgc2FtZSBhcyBpdHMgcGFyZW50J3MgaW5qZWN0b3IgaW5kZXgsIHRoZW4gdGhlIGluZGV4IGhhcyBiZWVuXG4gICAgICAvLyBjb3BpZWQgZG93biBmcm9tIHRoZSBwYXJlbnQgbm9kZS4gTm8gaW5qZWN0b3IgaGFzIGJlZW4gY3JlYXRlZCB5ZXQgb24gdGhpcyBub2RlLlxuICAgICAgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCA9PT0gdE5vZGUuaW5qZWN0b3JJbmRleCkgfHxcbiAgICAgIC8vIEFmdGVyIHRoZSBmaXJzdCB0ZW1wbGF0ZSBwYXNzLCB0aGUgaW5qZWN0b3IgaW5kZXggbWlnaHQgZXhpc3QgYnV0IHRoZSBwYXJlbnQgdmFsdWVzXG4gICAgICAvLyBtaWdodCBub3QgaGF2ZSBiZWVuIGNhbGN1bGF0ZWQgeWV0IGZvciB0aGlzIGluc3RhbmNlXG4gICAgICBob3N0Vmlld1t0Tm9kZS5pbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXSA9PSBudWxsKSB7XG4gICAgcmV0dXJuIC0xO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB0Tm9kZS5pbmplY3RvckluZGV4O1xuICB9XG59XG5cbi8qKlxuICogRmluZHMgdGhlIGluZGV4IG9mIHRoZSBwYXJlbnQgaW5qZWN0b3IsIHdpdGggYSB2aWV3IG9mZnNldCBpZiBhcHBsaWNhYmxlLiBVc2VkIHRvIHNldCB0aGVcbiAqIHBhcmVudCBpbmplY3RvciBpbml0aWFsbHkuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRQYXJlbnRJbmplY3RvckxvY2F0aW9uKHROb2RlOiBUTm9kZSwgdmlldzogTFZpZXdEYXRhKTogbnVtYmVyIHtcbiAgaWYgKHROb2RlLnBhcmVudCAmJiB0Tm9kZS5wYXJlbnQuaW5qZWN0b3JJbmRleCAhPT0gLTEpIHtcbiAgICByZXR1cm4gdE5vZGUucGFyZW50LmluamVjdG9ySW5kZXg7ICAvLyB2aWV3IG9mZnNldCBpcyAwXG4gIH1cblxuICAvLyBGb3IgbW9zdCBjYXNlcywgdGhlIHBhcmVudCBpbmplY3RvciBpbmRleCBjYW4gYmUgZm91bmQgb24gdGhlIGhvc3Qgbm9kZSAoZS5nLiBmb3IgY29tcG9uZW50XG4gIC8vIG9yIGNvbnRhaW5lciksIHNvIHRoaXMgbG9vcCB3aWxsIGJlIHNraXBwZWQsIGJ1dCB3ZSBtdXN0IGtlZXAgdGhlIGxvb3AgaGVyZSB0byBzdXBwb3J0XG4gIC8vIHRoZSByYXJlciBjYXNlIG9mIGRlZXBseSBuZXN0ZWQgPG5nLXRlbXBsYXRlPiB0YWdzIG9yIGlubGluZSB2aWV3cy5cbiAgbGV0IGhvc3RUTm9kZSA9IHZpZXdbSE9TVF9OT0RFXTtcbiAgbGV0IHZpZXdPZmZzZXQgPSAxO1xuICB3aGlsZSAoaG9zdFROb2RlICYmIGhvc3RUTm9kZS5pbmplY3RvckluZGV4ID09PSAtMSkge1xuICAgIHZpZXcgPSB2aWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgaG9zdFROb2RlID0gdmlld1tIT1NUX05PREVdICE7XG4gICAgdmlld09mZnNldCsrO1xuICB9XG4gIHJldHVybiBob3N0VE5vZGUgP1xuICAgICAgaG9zdFROb2RlLmluamVjdG9ySW5kZXggfCAodmlld09mZnNldCA8PCBJbmplY3RvckxvY2F0aW9uRmxhZ3MuVmlld09mZnNldFNoaWZ0KSA6XG4gICAgICAtMTtcbn1cblxuLyoqXG4gKiBVbndyYXBzIGEgcGFyZW50IGluamVjdG9yIGxvY2F0aW9uIG51bWJlciB0byBmaW5kIHRoZSB2aWV3IG9mZnNldCBmcm9tIHRoZSBjdXJyZW50IGluamVjdG9yLFxuICogdGhlbiB3YWxrcyB1cCB0aGUgZGVjbGFyYXRpb24gdmlldyB0cmVlIHVudGlsIHRoZSB2aWV3IGlzIGZvdW5kIHRoYXQgY29udGFpbnMgdGhlIHBhcmVudFxuICogaW5qZWN0b3IuXG4gKlxuICogQHBhcmFtIGxvY2F0aW9uIFRoZSBsb2NhdGlvbiBvZiB0aGUgcGFyZW50IGluamVjdG9yLCB3aGljaCBjb250YWlucyB0aGUgdmlldyBvZmZzZXRcbiAqIEBwYXJhbSBzdGFydFZpZXcgVGhlIExWaWV3RGF0YSBpbnN0YW5jZSBmcm9tIHdoaWNoIHRvIHN0YXJ0IHdhbGtpbmcgdXAgdGhlIHZpZXcgdHJlZVxuICogQHJldHVybnMgVGhlIExWaWV3RGF0YSBpbnN0YW5jZSB0aGF0IGNvbnRhaW5zIHRoZSBwYXJlbnQgaW5qZWN0b3JcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFBhcmVudEluamVjdG9yVmlldyhsb2NhdGlvbjogbnVtYmVyLCBzdGFydFZpZXc6IExWaWV3RGF0YSk6IExWaWV3RGF0YSB7XG4gIGxldCB2aWV3T2Zmc2V0ID0gbG9jYXRpb24gPj4gSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdDtcbiAgbGV0IHBhcmVudFZpZXcgPSBzdGFydFZpZXc7XG4gIC8vIEZvciBtb3N0IGNhc2VzLCB0aGUgcGFyZW50IGluamVjdG9yIGNhbiBiZSBmb3VuZCBvbiB0aGUgaG9zdCBub2RlIChlLmcuIGZvciBjb21wb25lbnRcbiAgLy8gb3IgY29udGFpbmVyKSwgYnV0IHdlIG11c3Qga2VlcCB0aGUgbG9vcCBoZXJlIHRvIHN1cHBvcnQgdGhlIHJhcmVyIGNhc2Ugb2YgZGVlcGx5IG5lc3RlZFxuICAvLyA8bmctdGVtcGxhdGU+IHRhZ3Mgb3IgaW5saW5lIHZpZXdzLCB3aGVyZSB0aGUgcGFyZW50IGluamVjdG9yIG1pZ2h0IGxpdmUgbWFueSB2aWV3c1xuICAvLyBhYm92ZSB0aGUgY2hpbGQgaW5qZWN0b3IuXG4gIHdoaWxlICh2aWV3T2Zmc2V0ID4gMCkge1xuICAgIHBhcmVudFZpZXcgPSBwYXJlbnRWaWV3W0RFQ0xBUkFUSU9OX1ZJRVddICE7XG4gICAgdmlld09mZnNldC0tO1xuICB9XG4gIHJldHVybiBwYXJlbnRWaWV3O1xufVxuXG4vKipcbiAqIE1ha2VzIGEgZGlyZWN0aXZlIHB1YmxpYyB0byB0aGUgREkgc3lzdGVtIGJ5IGFkZGluZyBpdCB0byBhbiBpbmplY3RvcidzIGJsb29tIGZpbHRlci5cbiAqXG4gKiBAcGFyYW0gZGkgVGhlIG5vZGUgaW5qZWN0b3IgaW4gd2hpY2ggYSBkaXJlY3RpdmUgd2lsbCBiZSBhZGRlZFxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpY0luSW5qZWN0b3IoXG4gICAgaW5qZWN0b3JJbmRleDogbnVtYmVyLCB2aWV3OiBMVmlld0RhdGEsIGRlZjogRGlyZWN0aXZlRGVmPGFueT4pOiB2b2lkIHtcbiAgYmxvb21BZGQoaW5qZWN0b3JJbmRleCwgdmlld1tUVklFV10sIGRlZi50eXBlKTtcbn1cblxuLyoqXG4gKiBNYWtlcyBhIGRpcmVjdGl2ZSBwdWJsaWMgdG8gdGhlIERJIHN5c3RlbSBieSBhZGRpbmcgaXQgdG8gYW4gaW5qZWN0b3IncyBibG9vbSBmaWx0ZXIuXG4gKlxuICogQHBhcmFtIGRlZiBUaGUgZGVmaW5pdGlvbiBvZiB0aGUgZGlyZWN0aXZlIHRvIGJlIG1hZGUgcHVibGljXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkaVB1YmxpYyhkZWY6IERpcmVjdGl2ZURlZjxhbnk+KTogdm9pZCB7XG4gIGRpUHVibGljSW5JbmplY3RvcihnZXRPckNyZWF0ZU5vZGVJbmplY3RvcigpLCBfZ2V0Vmlld0RhdGEoKSwgZGVmKTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiB0b2tlbiBmcm9tIHRoZSBpbmplY3RvcnMuXG4gKlxuICogYGRpcmVjdGl2ZUluamVjdGAgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBmb3IgZGlyZWN0aXZlLCBjb21wb25lbnQgYW5kIHBpcGUgZmFjdG9yaWVzLlxuICogIEFsbCBvdGhlciBpbmplY3Rpb24gdXNlIGBpbmplY3RgIHdoaWNoIGRvZXMgbm90IHdhbGsgdGhlIG5vZGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBVc2FnZSBleGFtcGxlIChpbiBmYWN0b3J5IGZ1bmN0aW9uKTpcbiAqXG4gKiBjbGFzcyBTb21lRGlyZWN0aXZlIHtcbiAqICAgY29uc3RydWN0b3IoZGlyZWN0aXZlOiBEaXJlY3RpdmVBKSB7fVxuICpcbiAqICAgc3RhdGljIG5nRGlyZWN0aXZlRGVmID0gZGVmaW5lRGlyZWN0aXZlKHtcbiAqICAgICB0eXBlOiBTb21lRGlyZWN0aXZlLFxuICogICAgIGZhY3Rvcnk6ICgpID0+IG5ldyBTb21lRGlyZWN0aXZlKGRpcmVjdGl2ZUluamVjdChEaXJlY3RpdmVBKSlcbiAqICAgfSk7XG4gKiB9XG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSB0eXBlIG9yIHRva2VuIHRvIGluamVjdFxuICogQHBhcmFtIGZsYWdzIEluamVjdGlvbiBmbGFnc1xuICogQHJldHVybnMgdGhlIHZhbHVlIGZyb20gdGhlIGluamVjdG9yIG9yIGBudWxsYCB3aGVuIG5vdCBmb3VuZFxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPik6IFQ7XG5leHBvcnQgZnVuY3Rpb24gZGlyZWN0aXZlSW5qZWN0PFQ+KHRva2VuOiBUeXBlPFQ+fCBJbmplY3Rpb25Ub2tlbjxUPiwgZmxhZ3M6IEluamVjdEZsYWdzKTogVDtcbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3RpdmVJbmplY3Q8VD4oXG4gICAgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LCBmbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICByZXR1cm4gZ2V0T3JDcmVhdGVJbmplY3RhYmxlPFQ+KGdldE9yQ3JlYXRlTm9kZUluamVjdG9yKCksIF9nZXRWaWV3RGF0YSgpLCB0b2tlbiwgZmxhZ3MpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0UmVuZGVyZXIyKCk6IFJlbmRlcmVyMiB7XG4gIHJldHVybiBnZXRPckNyZWF0ZVJlbmRlcmVyMihfZ2V0Vmlld0RhdGEoKSk7XG59XG4vKipcbiAqIEluamVjdCBzdGF0aWMgYXR0cmlidXRlIHZhbHVlIGludG8gZGlyZWN0aXZlIGNvbnN0cnVjdG9yLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIHVzZWQgd2l0aCBgZmFjdG9yeWAgZnVuY3Rpb25zIHdoaWNoIGFyZSBnZW5lcmF0ZWQgYXMgcGFydCBvZlxuICogYGRlZmluZURpcmVjdGl2ZWAgb3IgYGRlZmluZUNvbXBvbmVudGAuIFRoZSBtZXRob2QgcmV0cmlldmVzIHRoZSBzdGF0aWMgdmFsdWVcbiAqIG9mIGFuIGF0dHJpYnV0ZS4gKER5bmFtaWMgYXR0cmlidXRlcyBhcmUgbm90IHN1cHBvcnRlZCBzaW5jZSB0aGV5IGFyZSBub3QgcmVzb2x2ZWRcbiAqICBhdCB0aGUgdGltZSBvZiBpbmplY3Rpb24gYW5kIGNhbiBjaGFuZ2Ugb3ZlciB0aW1lLilcbiAqXG4gKiAjIEV4YW1wbGVcbiAqIEdpdmVuOlxuICogYGBgXG4gKiBAQ29tcG9uZW50KC4uLilcbiAqIGNsYXNzIE15Q29tcG9uZW50IHtcbiAqICAgY29uc3RydWN0b3IoQEF0dHJpYnV0ZSgndGl0bGUnKSB0aXRsZTogc3RyaW5nKSB7IC4uLiB9XG4gKiB9XG4gKiBgYGBcbiAqIFdoZW4gaW5zdGFudGlhdGVkIHdpdGhcbiAqIGBgYFxuICogPG15LWNvbXBvbmVudCB0aXRsZT1cIkhlbGxvXCI+PC9teS1jb21wb25lbnQ+XG4gKiBgYGBcbiAqXG4gKiBUaGVuIGZhY3RvcnkgbWV0aG9kIGdlbmVyYXRlZCBpczpcbiAqIGBgYFxuICogTXlDb21wb25lbnQubmdDb21wb25lbnREZWYgPSBkZWZpbmVDb21wb25lbnQoe1xuICogICBmYWN0b3J5OiAoKSA9PiBuZXcgTXlDb21wb25lbnQoaW5qZWN0QXR0cmlidXRlKCd0aXRsZScpKVxuICogICAuLi5cbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBAZXhwZXJpbWVudGFsXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3RBdHRyaWJ1dGUoYXR0ck5hbWVUb0luamVjdDogc3RyaW5nKTogc3RyaW5nfHVuZGVmaW5lZCB7XG4gIGNvbnN0IHROb2RlID0gZ2V0UHJldmlvdXNPclBhcmVudFROb2RlKCk7XG4gIG5nRGV2TW9kZSAmJiBhc3NlcnROb2RlT2ZQb3NzaWJsZVR5cGVzKFxuICAgICAgICAgICAgICAgICAgIHROb2RlLCBUTm9kZVR5cGUuQ29udGFpbmVyLCBUTm9kZVR5cGUuRWxlbWVudCwgVE5vZGVUeXBlLkVsZW1lbnRDb250YWluZXIpO1xuICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RGVmaW5lZCh0Tm9kZSwgJ2V4cGVjdGluZyB0Tm9kZScpO1xuICBjb25zdCBhdHRycyA9IHROb2RlLmF0dHJzO1xuICBpZiAoYXR0cnMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGF0dHJzLmxlbmd0aDsgaSA9IGkgKyAyKSB7XG4gICAgICBjb25zdCBhdHRyTmFtZSA9IGF0dHJzW2ldO1xuICAgICAgaWYgKGF0dHJOYW1lID09PSBBdHRyaWJ1dGVNYXJrZXIuU2VsZWN0T25seSkgYnJlYWs7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gYXR0ck5hbWVUb0luamVjdCkge1xuICAgICAgICByZXR1cm4gYXR0cnNbaSArIDFdIGFzIHN0cmluZztcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVuZGVmaW5lZDtcbn1cblxuZnVuY3Rpb24gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodmlldzogTFZpZXdEYXRhKTogUmVuZGVyZXIyIHtcbiAgY29uc3QgcmVuZGVyZXIgPSB2aWV3W1JFTkRFUkVSXTtcbiAgaWYgKGlzUHJvY2VkdXJhbFJlbmRlcmVyKHJlbmRlcmVyKSkge1xuICAgIHJldHVybiByZW5kZXJlciBhcyBSZW5kZXJlcjI7XG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgaW5qZWN0IFJlbmRlcmVyMiB3aGVuIHRoZSBhcHBsaWNhdGlvbiB1c2VzIFJlbmRlcmVyMyEnKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIHZhbHVlIGFzc29jaWF0ZWQgdG8gdGhlIGdpdmVuIHRva2VuIGZyb20gdGhlIGluamVjdG9ycy5cbiAqXG4gKiBMb29rIGZvciB0aGUgaW5qZWN0b3IgcHJvdmlkaW5nIHRoZSB0b2tlbiBieSB3YWxraW5nIHVwIHRoZSBub2RlIGluamVjdG9yIHRyZWUgYW5kIHRoZW5cbiAqIHRoZSBtb2R1bGUgaW5qZWN0b3IgdHJlZS5cbiAqXG4gKiBAcGFyYW0gbm9kZUluamVjdG9yIE5vZGUgaW5qZWN0b3Igd2hlcmUgdGhlIHNlYXJjaCBzaG91bGQgc3RhcnRcbiAqIEBwYXJhbSB0b2tlbiBUaGUgdG9rZW4gdG8gbG9vayBmb3JcbiAqIEBwYXJhbSBmbGFncyBJbmplY3Rpb24gZmxhZ3NcbiAqIEByZXR1cm5zIHRoZSB2YWx1ZSBmcm9tIHRoZSBpbmplY3RvciBvciBgbnVsbGAgd2hlbiBub3QgZm91bmRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9yQ3JlYXRlSW5qZWN0YWJsZTxUPihcbiAgICBzdGFydEluamVjdG9ySW5kZXg6IG51bWJlciwgaG9zdFZpZXc6IExWaWV3RGF0YSwgdG9rZW46IFR5cGU8VD58IEluamVjdGlvblRva2VuPFQ+LFxuICAgIGZsYWdzOiBJbmplY3RGbGFncyA9IEluamVjdEZsYWdzLkRlZmF1bHQpOiBUfG51bGwge1xuICBjb25zdCBibG9vbUhhc2ggPSBibG9vbUhhc2hCaXRPckZhY3RvcnkodG9rZW4pO1xuICAvLyBJZiB0aGUgSUQgc3RvcmVkIGhlcmUgaXMgYSBmdW5jdGlvbiwgdGhpcyBpcyBhIHNwZWNpYWwgb2JqZWN0IGxpa2UgRWxlbWVudFJlZiBvciBUZW1wbGF0ZVJlZlxuICAvLyBzbyBqdXN0IGNhbGwgdGhlIGZhY3RvcnkgZnVuY3Rpb24gdG8gY3JlYXRlIGl0LlxuICBpZiAodHlwZW9mIGJsb29tSGFzaCA9PT0gJ2Z1bmN0aW9uJykgcmV0dXJuIGJsb29tSGFzaCgpO1xuXG4gIC8vIElmIHRoZSB0b2tlbiBoYXMgYSBibG9vbSBoYXNoLCB0aGVuIGl0IGlzIGEgZGlyZWN0aXZlIHRoYXQgaXMgcHVibGljIHRvIHRoZSBpbmplY3Rpb24gc3lzdGVtXG4gIC8vIChkaVB1YmxpYykgb3RoZXJ3aXNlIGZhbGwgYmFjayB0byB0aGUgbW9kdWxlIGluamVjdG9yLlxuICBpZiAoYmxvb21IYXNoICE9IG51bGwpIHtcbiAgICBsZXQgaW5qZWN0b3JJbmRleCA9IHN0YXJ0SW5qZWN0b3JJbmRleDtcbiAgICBsZXQgaW5qZWN0b3JWaWV3ID0gaG9zdFZpZXc7XG5cbiAgICBpZiAoZmxhZ3MgJiBJbmplY3RGbGFncy5Ta2lwU2VsZikge1xuICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG4gICAgICBpbmplY3RvckluZGV4ID0gcGFyZW50TG9jYXRpb24gJiBJbmplY3RvckxvY2F0aW9uRmxhZ3MuSW5qZWN0b3JJbmRleE1hc2s7XG4gICAgICBpbmplY3RvclZpZXcgPSBnZXRQYXJlbnRJbmplY3RvclZpZXcocGFyZW50TG9jYXRpb24sIGluamVjdG9yVmlldyk7XG4gICAgfVxuXG4gICAgd2hpbGUgKGluamVjdG9ySW5kZXggIT09IC0xKSB7XG4gICAgICAvLyBUcmF2ZXJzZSB1cCB0aGUgaW5qZWN0b3IgdHJlZSB1bnRpbCB3ZSBmaW5kIGEgcG90ZW50aWFsIG1hdGNoIG9yIHVudGlsIHdlIGtub3cgdGhlcmVcbiAgICAgIC8vICppc24ndCogYSBtYXRjaC4gT3V0ZXIgbG9vcCBpcyBuZWNlc3NhcnkgaW4gY2FzZSB3ZSBnZXQgYSBmYWxzZSBwb3NpdGl2ZSBpbmplY3Rvci5cbiAgICAgIHdoaWxlIChpbmplY3RvckluZGV4ICE9PSAtMSkge1xuICAgICAgICAvLyBDaGVjayB0aGUgY3VycmVudCBpbmplY3Rvci4gSWYgaXQgbWF0Y2hlcywgc3RvcCBzZWFyY2hpbmcgZm9yIGFuIGluamVjdG9yLlxuICAgICAgICBpZiAoaW5qZWN0b3JIYXNUb2tlbihibG9vbUhhc2gsIGluamVjdG9ySW5kZXgsIGluamVjdG9yVmlld1tUVklFV10uZGF0YSkpIHtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChmbGFncyAmIEluamVjdEZsYWdzLlNlbGYgfHxcbiAgICAgICAgICAgIGZsYWdzICYgSW5qZWN0RmxhZ3MuSG9zdCAmJlxuICAgICAgICAgICAgICAgICFzYW1lSG9zdFZpZXcoaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyBQQVJFTlRfSU5KRUNUT1JdKSkge1xuICAgICAgICAgIGluamVjdG9ySW5kZXggPSAtMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZSBhbmNlc3RvciBibG9vbSBmaWx0ZXIgdmFsdWUgaGFzIHRoZSBiaXQgY29ycmVzcG9uZGluZyB0byB0aGUgZGlyZWN0aXZlLCB0cmF2ZXJzZVxuICAgICAgICAvLyB1cCB0byBmaW5kIHRoZSBzcGVjaWZpYyBpbmplY3Rvci4gSWYgdGhlIGFuY2VzdG9yIGJsb29tIGZpbHRlciBkb2VzIG5vdCBoYXZlIHRoZSBiaXQsIHdlXG4gICAgICAgIC8vIGNhbiBhYm9ydC5cbiAgICAgICAgaWYgKGluamVjdG9ySGFzVG9rZW4oYmxvb21IYXNoLCBpbmplY3RvckluZGV4LCBpbmplY3RvclZpZXcpKSB7XG4gICAgICAgICAgY29uc3QgcGFyZW50TG9jYXRpb24gPSBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIFBBUkVOVF9JTkpFQ1RPUl07XG4gICAgICAgICAgaW5qZWN0b3JJbmRleCA9IHBhcmVudExvY2F0aW9uICYgSW5qZWN0b3JMb2NhdGlvbkZsYWdzLkluamVjdG9ySW5kZXhNYXNrO1xuICAgICAgICAgIGluamVjdG9yVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgaW5qZWN0b3JWaWV3KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpbmplY3RvckluZGV4ID0gLTE7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgbm8gaW5qZWN0b3IgaXMgZm91bmQsIHdlICprbm93KiB0aGF0IHRoZXJlIGlzIG5vIGFuY2VzdG9yIGluamVjdG9yIHRoYXQgY29udGFpbnMgdGhlXG4gICAgICAvLyB0b2tlbiwgc28gd2UgYWJvcnQuXG4gICAgICBpZiAoaW5qZWN0b3JJbmRleCA9PT0gLTEpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIC8vIEF0IHRoaXMgcG9pbnQsIHdlIGhhdmUgYW4gaW5qZWN0b3Igd2hpY2ggKm1heSogY29udGFpbiB0aGUgdG9rZW4sIHNvIHdlIHN0ZXAgdGhyb3VnaCB0aGVcbiAgICAgIC8vIGRpcmVjdGl2ZXMgYXNzb2NpYXRlZCB3aXRoIHRoZSBpbmplY3RvcidzIGNvcnJlc3BvbmRpbmcgbm9kZSB0byBnZXQgdGhlIGRpcmVjdGl2ZSBpbnN0YW5jZS5cbiAgICAgIGxldCBpbnN0YW5jZTogVHxudWxsO1xuICAgICAgaWYgKGluc3RhbmNlID0gc2VhcmNoRGlyZWN0aXZlc09uSW5qZWN0b3I8VD4oaW5qZWN0b3JJbmRleCwgaW5qZWN0b3JWaWV3LCB0b2tlbikpIHtcbiAgICAgICAgcmV0dXJuIGluc3RhbmNlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiB3ZSAqZGlkbid0KiBmaW5kIHRoZSBkaXJlY3RpdmUgZm9yIHRoZSB0b2tlbiBhbmQgd2UgYXJlIHNlYXJjaGluZyB0aGUgY3VycmVudCBub2RlJ3NcbiAgICAgIC8vIGluamVjdG9yLCBpdCdzIHBvc3NpYmxlIHRoZSBkaXJlY3RpdmUgaXMgb24gdGhpcyBub2RlIGFuZCBoYXNuJ3QgYmVlbiBjcmVhdGVkIHlldC5cbiAgICAgIGlmIChpbmplY3RvckluZGV4ID09PSBzdGFydEluamVjdG9ySW5kZXggJiYgaG9zdFZpZXcgPT09IGluamVjdG9yVmlldyAmJlxuICAgICAgICAgIChpbnN0YW5jZSA9IHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPih0b2tlbiwgaW5qZWN0b3JWaWV3W1RWSUVXXSkpKSB7XG4gICAgICAgIHJldHVybiBpbnN0YW5jZTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIGRlZiB3YXNuJ3QgZm91bmQgYW55d2hlcmUgb24gdGhpcyBub2RlLCBzbyBpdCB3YXMgYSBmYWxzZSBwb3NpdGl2ZS5cbiAgICAgIC8vIFRyYXZlcnNlIHVwIHRoZSB0cmVlIGFuZCBjb250aW51ZSBzZWFyY2hpbmcuXG4gICAgICBjb25zdCBwYXJlbnRMb2NhdGlvbiA9IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgUEFSRU5UX0lOSkVDVE9SXTtcbiAgICAgIGluamVjdG9ySW5kZXggPSBwYXJlbnRMb2NhdGlvbiAmIEluamVjdG9yTG9jYXRpb25GbGFncy5JbmplY3RvckluZGV4TWFzaztcbiAgICAgIGluamVjdG9yVmlldyA9IGdldFBhcmVudEluamVjdG9yVmlldyhwYXJlbnRMb2NhdGlvbiwgaW5qZWN0b3JWaWV3KTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBtb2R1bGVJbmplY3RvciA9IGhvc3RWaWV3W0lOSkVDVE9SXTtcbiAgY29uc3QgZm9ybWVySW5qZWN0b3IgPSBzZXRDdXJyZW50SW5qZWN0b3IobW9kdWxlSW5qZWN0b3IpO1xuICB0cnkge1xuICAgIHJldHVybiBpbmplY3QodG9rZW4sIGZsYWdzKTtcbiAgfSBmaW5hbGx5IHtcbiAgICBzZXRDdXJyZW50SW5qZWN0b3IoZm9ybWVySW5qZWN0b3IpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNlYXJjaE1hdGNoZXNRdWV1ZWRGb3JDcmVhdGlvbjxUPih0b2tlbjogYW55LCBob3N0VFZpZXc6IFRWaWV3KTogVHxudWxsIHtcbiAgY29uc3QgbWF0Y2hlcyA9IGhvc3RUVmlldy5jdXJyZW50TWF0Y2hlcztcbiAgaWYgKG1hdGNoZXMpIHtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IG1hdGNoZXMubGVuZ3RoOyBpICs9IDIpIHtcbiAgICAgIGNvbnN0IGRlZiA9IG1hdGNoZXNbaV0gYXMgRGlyZWN0aXZlRGVmPGFueT47XG4gICAgICBpZiAoZGVmLnR5cGUgPT09IHRva2VuKSB7XG4gICAgICAgIHJldHVybiByZXNvbHZlRGlyZWN0aXZlKGRlZiwgaSArIDEsIG1hdGNoZXMsIGhvc3RUVmlldyk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZWFyY2hEaXJlY3RpdmVzT25JbmplY3RvcjxUPihcbiAgICBpbmplY3RvckluZGV4OiBudW1iZXIsIGluamVjdG9yVmlldzogTFZpZXdEYXRhLCB0b2tlbjogVHlwZTxUPnwgSW5qZWN0aW9uVG9rZW48VD4pIHtcbiAgY29uc3QgdE5vZGUgPSBpbmplY3RvclZpZXdbVFZJRVddLmRhdGFbaW5qZWN0b3JJbmRleCArIFROT0RFXSBhcyBUTm9kZTtcbiAgY29uc3Qgbm9kZUZsYWdzID0gdE5vZGUuZmxhZ3M7XG4gIGNvbnN0IGNvdW50ID0gbm9kZUZsYWdzICYgVE5vZGVGbGFncy5EaXJlY3RpdmVDb3VudE1hc2s7XG5cbiAgaWYgKGNvdW50ICE9PSAwKSB7XG4gICAgY29uc3Qgc3RhcnQgPSBub2RlRmxhZ3MgPj4gVE5vZGVGbGFncy5EaXJlY3RpdmVTdGFydGluZ0luZGV4U2hpZnQ7XG4gICAgY29uc3QgZW5kID0gc3RhcnQgKyBjb3VudDtcbiAgICBjb25zdCBkZWZzID0gaW5qZWN0b3JWaWV3W1RWSUVXXS5kaXJlY3RpdmVzICE7XG5cbiAgICBmb3IgKGxldCBpID0gc3RhcnQ7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgLy8gR2V0IHRoZSBkZWZpbml0aW9uIGZvciB0aGUgZGlyZWN0aXZlIGF0IHRoaXMgaW5kZXggYW5kLCBpZiBpdCBpcyBpbmplY3RhYmxlIChkaVB1YmxpYyksXG4gICAgICAvLyBhbmQgbWF0Y2hlcyB0aGUgZ2l2ZW4gdG9rZW4sIHJldHVybiB0aGUgZGlyZWN0aXZlIGluc3RhbmNlLlxuICAgICAgY29uc3QgZGlyZWN0aXZlRGVmID0gZGVmc1tpXSBhcyBEaXJlY3RpdmVEZWY8YW55PjtcbiAgICAgIGlmIChkaXJlY3RpdmVEZWYudHlwZSA9PT0gdG9rZW4gJiYgZGlyZWN0aXZlRGVmLmRpUHVibGljKSB7XG4gICAgICAgIHJldHVybiBpbmplY3RvclZpZXdbRElSRUNUSVZFU10gIVtpXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgYml0IGluIGFuIGluamVjdG9yJ3MgYmxvb20gZmlsdGVyIHRoYXQgc2hvdWxkIGJlIHVzZWQgdG8gZGV0ZXJtaW5lIHdoZXRoZXIgb3Igbm90XG4gKiB0aGUgZGlyZWN0aXZlIG1pZ2h0IGJlIHByb3ZpZGVkIGJ5IHRoZSBpbmplY3Rvci5cbiAqXG4gKiBXaGVuIGEgZGlyZWN0aXZlIGlzIHB1YmxpYywgaXQgaXMgYWRkZWQgdG8gdGhlIGJsb29tIGZpbHRlciBhbmQgZ2l2ZW4gYSB1bmlxdWUgSUQgdGhhdCBjYW4gYmVcbiAqIHJldHJpZXZlZCBvbiB0aGUgVHlwZS4gV2hlbiB0aGUgZGlyZWN0aXZlIGlzbid0IHB1YmxpYyBvciB0aGUgdG9rZW4gaXMgbm90IGEgZGlyZWN0aXZlIGBudWxsYFxuICogaXMgcmV0dXJuZWQgYXMgdGhlIG5vZGUgaW5qZWN0b3IgY2FuIG5vdCBwb3NzaWJseSBwcm92aWRlIHRoYXQgdG9rZW4uXG4gKlxuICogQHBhcmFtIHRva2VuIHRoZSBpbmplY3Rpb24gdG9rZW5cbiAqIEByZXR1cm5zIHRoZSBtYXRjaGluZyBiaXQgdG8gY2hlY2sgaW4gdGhlIGJsb29tIGZpbHRlciBvciBgbnVsbGAgaWYgdGhlIHRva2VuIGlzIG5vdCBrbm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJsb29tSGFzaEJpdE9yRmFjdG9yeSh0b2tlbjogVHlwZTxhbnk+fCBJbmplY3Rpb25Ub2tlbjxhbnk+KTogbnVtYmVyfEZ1bmN0aW9ufFxuICAgIHVuZGVmaW5lZCB7XG4gIGNvbnN0IHRva2VuSWQ6IG51bWJlcnx1bmRlZmluZWQgPSAodG9rZW4gYXMgYW55KVtOR19FTEVNRU5UX0lEXTtcbiAgcmV0dXJuIHR5cGVvZiB0b2tlbklkID09PSAnbnVtYmVyJyA/IHRva2VuSWQgJiBCTE9PTV9NQVNLIDogdG9rZW5JZDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluamVjdG9ySGFzVG9rZW4oXG4gICAgYmxvb21IYXNoOiBudW1iZXIsIGluamVjdG9ySW5kZXg6IG51bWJlciwgaW5qZWN0b3JWaWV3OiBMVmlld0RhdGEgfCBURGF0YSkge1xuICAvLyBDcmVhdGUgYSBtYXNrIHRoYXQgdGFyZ2V0cyB0aGUgc3BlY2lmaWMgYml0IGFzc29jaWF0ZWQgd2l0aCB0aGUgZGlyZWN0aXZlIHdlJ3JlIGxvb2tpbmcgZm9yLlxuICAvLyBKUyBiaXQgb3BlcmF0aW9ucyBhcmUgMzIgYml0cywgc28gdGhpcyB3aWxsIGJlIGEgbnVtYmVyIGJldHdlZW4gMl4wIGFuZCAyXjMxLCBjb3JyZXNwb25kaW5nXG4gIC8vIHRvIGJpdCBwb3NpdGlvbnMgMCAtIDMxIGluIGEgMzIgYml0IGludGVnZXIuXG4gIGNvbnN0IG1hc2sgPSAxIDw8IGJsb29tSGFzaDtcbiAgY29uc3QgYjcgPSBibG9vbUhhc2ggJiAweDgwO1xuICBjb25zdCBiNiA9IGJsb29tSGFzaCAmIDB4NDA7XG4gIGNvbnN0IGI1ID0gYmxvb21IYXNoICYgMHgyMDtcblxuICAvLyBPdXIgYmxvb20gZmlsdGVyIHNpemUgaXMgMjU2IGJpdHMsIHdoaWNoIGlzIGVpZ2h0IDMyLWJpdCBibG9vbSBmaWx0ZXIgYnVja2V0czpcbiAgLy8gYmYwID0gWzAgLSAzMV0sIGJmMSA9IFszMiAtIDYzXSwgYmYyID0gWzY0IC0gOTVdLCBiZjMgPSBbOTYgLSAxMjddLCBldGMuXG4gIC8vIEdldCB0aGUgYmxvb20gZmlsdGVyIHZhbHVlIGZyb20gdGhlIGFwcHJvcHJpYXRlIGJ1Y2tldCBiYXNlZCBvbiB0aGUgZGlyZWN0aXZlJ3MgYmxvb21CaXQuXG4gIGxldCB2YWx1ZTogbnVtYmVyO1xuXG4gIGlmIChiNykge1xuICAgIHZhbHVlID0gYjYgPyAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDddIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA2XSkgOlxuICAgICAgICAgICAgICAgICAoYjUgPyBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDVdIDogaW5qZWN0b3JWaWV3W2luamVjdG9ySW5kZXggKyA0XSk7XG4gIH0gZWxzZSB7XG4gICAgdmFsdWUgPSBiNiA/IChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgM10gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleCArIDJdKSA6XG4gICAgICAgICAgICAgICAgIChiNSA/IGluamVjdG9yVmlld1tpbmplY3RvckluZGV4ICsgMV0gOiBpbmplY3RvclZpZXdbaW5qZWN0b3JJbmRleF0pO1xuICB9XG5cbiAgLy8gSWYgdGhlIGJsb29tIGZpbHRlciB2YWx1ZSBoYXMgdGhlIGJpdCBjb3JyZXNwb25kaW5nIHRvIHRoZSBkaXJlY3RpdmUncyBibG9vbUJpdCBmbGlwcGVkIG9uLFxuICAvLyB0aGlzIGluamVjdG9yIGlzIGEgcG90ZW50aWFsIG1hdGNoLlxuICByZXR1cm4gISEodmFsdWUgJiBtYXNrKTtcbn1cblxuXG4vKipcbiAqIENoZWNrcyB3aGV0aGVyIHRoZSBjdXJyZW50IGluamVjdG9yIGFuZCBpdHMgcGFyZW50IGFyZSBpbiB0aGUgc2FtZSBob3N0IHZpZXcuXG4gKlxuICogVGhpcyBpcyBuZWNlc3NhcnkgdG8gc3VwcG9ydCBASG9zdCgpIGRlY29yYXRvcnMuIElmIEBIb3N0KCkgaXMgc2V0LCB3ZSBzaG91bGQgc3RvcCBzZWFyY2hpbmcgb25jZVxuICogdGhlIGluamVjdG9yIGFuZCBpdHMgcGFyZW50IHZpZXcgZG9uJ3QgbWF0Y2ggYmVjYXVzZSBpdCBtZWFucyB3ZSdkIGNyb3NzIHRoZSB2aWV3IGJvdW5kYXJ5LlxuICovXG5mdW5jdGlvbiBzYW1lSG9zdFZpZXcocGFyZW50TG9jYXRpb246IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gISFwYXJlbnRMb2NhdGlvbiAmJiAocGFyZW50TG9jYXRpb24gPj4gSW5qZWN0b3JMb2NhdGlvbkZsYWdzLlZpZXdPZmZzZXRTaGlmdCkgPT09IDA7XG59XG5cbmV4cG9ydCBjbGFzcyBOb2RlSW5qZWN0b3IgaW1wbGVtZW50cyBJbmplY3RvciB7XG4gIHByaXZhdGUgX2luamVjdG9ySW5kZXg6IG51bWJlcjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgX3ROb2RlOiBURWxlbWVudE5vZGV8VENvbnRhaW5lck5vZGV8VEVsZW1lbnRDb250YWluZXJOb2RlLFxuICAgICAgcHJpdmF0ZSBfaG9zdFZpZXc6IExWaWV3RGF0YSkge1xuICAgIHRoaXMuX2luamVjdG9ySW5kZXggPSBnZXRPckNyZWF0ZU5vZGVJbmplY3RvckZvck5vZGUoX3ROb2RlLCBfaG9zdFZpZXcpO1xuICB9XG5cbiAgZ2V0KHRva2VuOiBhbnkpOiBhbnkge1xuICAgIGlmICh0b2tlbiA9PT0gUmVuZGVyZXIyKSB7XG4gICAgICByZXR1cm4gZ2V0T3JDcmVhdGVSZW5kZXJlcjIodGhpcy5faG9zdFZpZXcpO1xuICAgIH1cblxuICAgIHNldEVudmlyb25tZW50KHRoaXMuX3ROb2RlLCB0aGlzLl9ob3N0Vmlldyk7XG4gICAgcmV0dXJuIGdldE9yQ3JlYXRlSW5qZWN0YWJsZSh0aGlzLl9pbmplY3RvckluZGV4LCB0aGlzLl9ob3N0VmlldywgdG9rZW4pO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gZ2V0RmFjdG9yeU9mPFQ+KHR5cGU6IFR5cGU8YW55Pik6ICgodHlwZT86IFR5cGU8VD4pID0+IFQpfG51bGwge1xuICBjb25zdCB0eXBlQW55ID0gdHlwZSBhcyBhbnk7XG4gIGNvbnN0IGRlZiA9IGdldENvbXBvbmVudERlZjxUPih0eXBlQW55KSB8fCBnZXREaXJlY3RpdmVEZWY8VD4odHlwZUFueSkgfHxcbiAgICAgIGdldFBpcGVEZWY8VD4odHlwZUFueSkgfHwgZ2V0SW5qZWN0YWJsZURlZjxUPih0eXBlQW55KSB8fCBnZXRJbmplY3RvckRlZjxUPih0eXBlQW55KTtcbiAgaWYgKCFkZWYgfHwgZGVmLmZhY3RvcnkgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBkZWYuZmFjdG9yeTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEluaGVyaXRlZEZhY3Rvcnk8VD4odHlwZTogVHlwZTxhbnk+KTogKHR5cGU6IFR5cGU8VD4pID0+IFQge1xuICBjb25zdCBwcm90byA9IE9iamVjdC5nZXRQcm90b3R5cGVPZih0eXBlLnByb3RvdHlwZSkuY29uc3RydWN0b3IgYXMgVHlwZTxhbnk+O1xuICBjb25zdCBmYWN0b3J5ID0gZ2V0RmFjdG9yeU9mPFQ+KHByb3RvKTtcbiAgaWYgKGZhY3RvcnkgIT09IG51bGwpIHtcbiAgICByZXR1cm4gZmFjdG9yeTtcbiAgfSBlbHNlIHtcbiAgICAvLyBUaGVyZSBpcyBubyBmYWN0b3J5IGRlZmluZWQuIEVpdGhlciB0aGlzIHdhcyBpbXByb3BlciB1c2FnZSBvZiBpbmhlcml0YW5jZVxuICAgIC8vIChubyBBbmd1bGFyIGRlY29yYXRvciBvbiB0aGUgc3VwZXJjbGFzcykgb3IgdGhlcmUgaXMgbm8gY29uc3RydWN0b3IgYXQgYWxsXG4gICAgLy8gaW4gdGhlIGluaGVyaXRhbmNlIGNoYWluLiBTaW5jZSB0aGUgdHdvIGNhc2VzIGNhbm5vdCBiZSBkaXN0aW5ndWlzaGVkLCB0aGVcbiAgICAvLyBsYXR0ZXIgaGFzIHRvIGJlIGFzc3VtZWQuXG4gICAgcmV0dXJuICh0KSA9PiBuZXcgdCgpO1xuICB9XG59XG4iXX0=