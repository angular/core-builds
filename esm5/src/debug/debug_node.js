/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import * as tslib_1 from "tslib";
import { getViewComponent } from '../render3/global_utils_api';
import { CONTAINER_HEADER_OFFSET, NATIVE } from '../render3/interfaces/container';
import { isComponent, isLContainer } from '../render3/interfaces/type_checks';
import { PARENT, TVIEW, T_HOST } from '../render3/interfaces/view';
import { stylingMapToStringMap } from '../render3/styling_next/map_based_bindings';
import { NodeStylingDebug } from '../render3/styling_next/styling_debug';
import { isStylingContext } from '../render3/styling_next/util';
import { getComponent, getContext, getInjectionTokens, getInjector, getListeners, getLocalRefs, isBrowserEvents, loadLContext } from '../render3/util/discovery_utils';
import { INTERPOLATION_DELIMITER, renderStringify } from '../render3/util/misc_utils';
import { findComponentView } from '../render3/util/view_traversal_utils';
import { getComponentViewByIndex, getNativeByTNodeOrNull } from '../render3/util/view_utils';
import { assertDomNode } from '../util/assert';
/**
 * @publicApi
 */
var DebugEventListener = /** @class */ (function () {
    function DebugEventListener(name, callback) {
        this.name = name;
        this.callback = callback;
    }
    return DebugEventListener;
}());
export { DebugEventListener };
var DebugNode__PRE_R3__ = /** @class */ (function () {
    function DebugNode__PRE_R3__(nativeNode, parent, _debugContext) {
        this.listeners = [];
        this.parent = null;
        this._debugContext = _debugContext;
        this.nativeNode = nativeNode;
        if (parent && parent instanceof DebugElement__PRE_R3__) {
            parent.addChild(this);
        }
    }
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "injector", {
        get: function () { return this._debugContext.injector; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "componentInstance", {
        get: function () { return this._debugContext.component; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "context", {
        get: function () { return this._debugContext.context; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "references", {
        get: function () { return this._debugContext.references; },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__PRE_R3__.prototype, "providerTokens", {
        get: function () { return this._debugContext.providerTokens; },
        enumerable: true,
        configurable: true
    });
    return DebugNode__PRE_R3__;
}());
export { DebugNode__PRE_R3__ };
var DebugElement__PRE_R3__ = /** @class */ (function (_super) {
    tslib_1.__extends(DebugElement__PRE_R3__, _super);
    function DebugElement__PRE_R3__(nativeNode, parent, _debugContext) {
        var _this = _super.call(this, nativeNode, parent, _debugContext) || this;
        _this.properties = {};
        _this.attributes = {};
        _this.classes = {};
        _this.styles = {};
        _this.childNodes = [];
        _this.nativeElement = nativeNode;
        return _this;
    }
    DebugElement__PRE_R3__.prototype.addChild = function (child) {
        if (child) {
            this.childNodes.push(child);
            child.parent = this;
        }
    };
    DebugElement__PRE_R3__.prototype.removeChild = function (child) {
        var childIndex = this.childNodes.indexOf(child);
        if (childIndex !== -1) {
            child.parent = null;
            this.childNodes.splice(childIndex, 1);
        }
    };
    DebugElement__PRE_R3__.prototype.insertChildrenAfter = function (child, newChildren) {
        var _a;
        var _this = this;
        var siblingIndex = this.childNodes.indexOf(child);
        if (siblingIndex !== -1) {
            (_a = this.childNodes).splice.apply(_a, tslib_1.__spread([siblingIndex + 1, 0], newChildren));
            newChildren.forEach(function (c) {
                if (c.parent) {
                    c.parent.removeChild(c);
                }
                child.parent = _this;
            });
        }
    };
    DebugElement__PRE_R3__.prototype.insertBefore = function (refChild, newChild) {
        var refIndex = this.childNodes.indexOf(refChild);
        if (refIndex === -1) {
            this.addChild(newChild);
        }
        else {
            if (newChild.parent) {
                newChild.parent.removeChild(newChild);
            }
            newChild.parent = this;
            this.childNodes.splice(refIndex, 0, newChild);
        }
    };
    DebugElement__PRE_R3__.prototype.query = function (predicate) {
        var results = this.queryAll(predicate);
        return results[0] || null;
    };
    DebugElement__PRE_R3__.prototype.queryAll = function (predicate) {
        var matches = [];
        _queryElementChildren(this, predicate, matches);
        return matches;
    };
    DebugElement__PRE_R3__.prototype.queryAllNodes = function (predicate) {
        var matches = [];
        _queryNodeChildren(this, predicate, matches);
        return matches;
    };
    Object.defineProperty(DebugElement__PRE_R3__.prototype, "children", {
        get: function () {
            return this
                .childNodes //
                .filter(function (node) { return node instanceof DebugElement__PRE_R3__; });
        },
        enumerable: true,
        configurable: true
    });
    DebugElement__PRE_R3__.prototype.triggerEventHandler = function (eventName, eventObj) {
        this.listeners.forEach(function (listener) {
            if (listener.name == eventName) {
                listener.callback(eventObj);
            }
        });
    };
    return DebugElement__PRE_R3__;
}(DebugNode__PRE_R3__));
export { DebugElement__PRE_R3__ };
/**
 * @publicApi
 */
export function asNativeElements(debugEls) {
    return debugEls.map(function (el) { return el.nativeElement; });
}
function _queryElementChildren(element, predicate, matches) {
    element.childNodes.forEach(function (node) {
        if (node instanceof DebugElement__PRE_R3__) {
            if (predicate(node)) {
                matches.push(node);
            }
            _queryElementChildren(node, predicate, matches);
        }
    });
}
function _queryNodeChildren(parentNode, predicate, matches) {
    if (parentNode instanceof DebugElement__PRE_R3__) {
        parentNode.childNodes.forEach(function (node) {
            if (predicate(node)) {
                matches.push(node);
            }
            if (node instanceof DebugElement__PRE_R3__) {
                _queryNodeChildren(node, predicate, matches);
            }
        });
    }
}
var DebugNode__POST_R3__ = /** @class */ (function () {
    function DebugNode__POST_R3__(nativeNode) {
        this.nativeNode = nativeNode;
    }
    Object.defineProperty(DebugNode__POST_R3__.prototype, "parent", {
        get: function () {
            var parent = this.nativeNode.parentNode;
            return parent ? new DebugElement__POST_R3__(parent) : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "injector", {
        get: function () { return getInjector(this.nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "componentInstance", {
        get: function () {
            var nativeElement = this.nativeNode;
            return nativeElement &&
                (getComponent(nativeElement) || getViewComponent(nativeElement));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "context", {
        get: function () {
            return getComponent(this.nativeNode) || getContext(this.nativeNode);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "listeners", {
        get: function () {
            return getListeners(this.nativeNode).filter(isBrowserEvents);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "references", {
        get: function () { return getLocalRefs(this.nativeNode); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugNode__POST_R3__.prototype, "providerTokens", {
        get: function () { return getInjectionTokens(this.nativeNode); },
        enumerable: true,
        configurable: true
    });
    return DebugNode__POST_R3__;
}());
var DebugElement__POST_R3__ = /** @class */ (function (_super) {
    tslib_1.__extends(DebugElement__POST_R3__, _super);
    function DebugElement__POST_R3__(nativeNode) {
        var _this = this;
        ngDevMode && assertDomNode(nativeNode);
        _this = _super.call(this, nativeNode) || this;
        return _this;
    }
    Object.defineProperty(DebugElement__POST_R3__.prototype, "nativeElement", {
        get: function () {
            return this.nativeNode.nodeType == Node.ELEMENT_NODE ? this.nativeNode : null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "name", {
        get: function () {
            try {
                var context = loadLContext(this.nativeNode);
                var lView = context.lView;
                var tData = lView[TVIEW].data;
                var tNode = tData[context.nodeIndex];
                return tNode.tagName;
            }
            catch (e) {
                return this.nativeNode.nodeName;
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "properties", {
        /**
         *  Gets a map of property names to property values for an element.
         *
         *  This map includes:
         *  - Regular property bindings (e.g. `[id]="id"`)
         *  - Host property bindings (e.g. `host: { '[id]': "id" }`)
         *  - Interpolated property bindings (e.g. `id="{{ value }}")
         *
         *  It does not include:
         *  - input property bindings (e.g. `[myCustomInput]="value"`)
         *  - attribute bindings (e.g. `[attr.role]="menu"`)
         */
        get: function () {
            var context = loadLContext(this.nativeNode, false);
            if (context == null) {
                return {};
            }
            var lView = context.lView;
            var tData = lView[TVIEW].data;
            var tNode = tData[context.nodeIndex];
            var properties = collectPropertyBindings(tNode, lView, tData);
            var className = collectClassNames(this);
            if (className) {
                properties['className'] =
                    properties['className'] ? properties['className'] + (" " + className) : className;
            }
            return properties;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "attributes", {
        get: function () {
            var attributes = {};
            var element = this.nativeElement;
            if (!element) {
                return attributes;
            }
            var context = loadLContext(element, false);
            if (context == null) {
                return {};
            }
            var lView = context.lView;
            var tNodeAttrs = lView[TVIEW].data[context.nodeIndex].attrs;
            var lowercaseTNodeAttrs = [];
            // For debug nodes we take the element's attribute directly from the DOM since it allows us
            // to account for ones that weren't set via bindings (e.g. ViewEngine keeps track of the ones
            // that are set through `Renderer2`). The problem is that the browser will lowercase all names,
            // however since we have the attributes already on the TNode, we can preserve the case by going
            // through them once, adding them to the `attributes` map and putting their lower-cased name
            // into an array. Afterwards when we're going through the native DOM attributes, we can check
            // whether we haven't run into an attribute already through the TNode.
            if (tNodeAttrs) {
                var i = 0;
                while (i < tNodeAttrs.length) {
                    var attrName = tNodeAttrs[i];
                    // Stop as soon as we hit a marker. We only care about the regular attributes. Everything
                    // else will be handled below when we read the final attributes off the DOM.
                    if (typeof attrName !== 'string')
                        break;
                    var attrValue = tNodeAttrs[i + 1];
                    attributes[attrName] = attrValue;
                    lowercaseTNodeAttrs.push(attrName.toLowerCase());
                    i += 2;
                }
            }
            var eAttrs = element.attributes;
            for (var i = 0; i < eAttrs.length; i++) {
                var attr = eAttrs[i];
                // Make sure that we don't assign the same attribute both in its
                // case-sensitive form and the lower-cased one from the browser.
                if (lowercaseTNodeAttrs.indexOf(attr.name) === -1) {
                    attributes[attr.name] = attr.value;
                }
            }
            return attributes;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "styles", {
        get: function () {
            return _getStylingDebugInfo(this.nativeElement, false);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "classes", {
        get: function () {
            return _getStylingDebugInfo(this.nativeElement, true);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "childNodes", {
        get: function () {
            var childNodes = this.nativeNode.childNodes;
            var children = [];
            for (var i = 0; i < childNodes.length; i++) {
                var element = childNodes[i];
                children.push(getDebugNode__POST_R3__(element));
            }
            return children;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(DebugElement__POST_R3__.prototype, "children", {
        get: function () {
            var nativeElement = this.nativeElement;
            if (!nativeElement)
                return [];
            var childNodes = nativeElement.children;
            var children = [];
            for (var i = 0; i < childNodes.length; i++) {
                var element = childNodes[i];
                children.push(getDebugNode__POST_R3__(element));
            }
            return children;
        },
        enumerable: true,
        configurable: true
    });
    DebugElement__POST_R3__.prototype.query = function (predicate) {
        var results = this.queryAll(predicate);
        return results[0] || null;
    };
    DebugElement__POST_R3__.prototype.queryAll = function (predicate) {
        var matches = [];
        _queryAllR3(this, predicate, matches, true);
        return matches;
    };
    DebugElement__POST_R3__.prototype.queryAllNodes = function (predicate) {
        var matches = [];
        _queryAllR3(this, predicate, matches, false);
        return matches;
    };
    DebugElement__POST_R3__.prototype.triggerEventHandler = function (eventName, eventObj) {
        var node = this.nativeNode;
        var invokedListeners = [];
        this.listeners.forEach(function (listener) {
            if (listener.name === eventName) {
                var callback = listener.callback;
                callback(eventObj);
                invokedListeners.push(callback);
            }
        });
        // We need to check whether `eventListeners` exists, because it's something
        // that Zone.js only adds to `EventTarget` in browser environments.
        if (typeof node.eventListeners === 'function') {
            // Note that in Ivy we wrap event listeners with a call to `event.preventDefault` in some
            // cases. We use `Function` as a special token that gives us access to the actual event
            // listener.
            node.eventListeners(eventName).forEach(function (listener) {
                var unwrappedListener = listener(Function);
                return invokedListeners.indexOf(unwrappedListener) === -1 && unwrappedListener(eventObj);
            });
        }
    };
    return DebugElement__POST_R3__;
}(DebugNode__POST_R3__));
function _getStylingDebugInfo(element, isClassBased) {
    var context = loadLContext(element, false);
    if (!context) {
        return {};
    }
    var lView = context.lView;
    var tData = lView[TVIEW].data;
    var tNode = tData[context.nodeIndex];
    if (isClassBased) {
        return isStylingContext(tNode.classes) ?
            new NodeStylingDebug(tNode.classes, lView, true).values :
            stylingMapToStringMap(tNode.classes);
    }
    else {
        return isStylingContext(tNode.styles) ?
            new NodeStylingDebug(tNode.styles, lView, false).values :
            stylingMapToStringMap(tNode.styles);
    }
}
function _queryAllR3(parentElement, predicate, matches, elementsOnly) {
    var context = loadLContext(parentElement.nativeNode);
    var parentTNode = context.lView[TVIEW].data[context.nodeIndex];
    _queryNodeChildrenR3(parentTNode, context.lView, predicate, matches, elementsOnly, parentElement.nativeNode);
}
/**
 * Recursively match the current TNode against the predicate, and goes on with the next ones.
 *
 * @param tNode the current TNode
 * @param lView the LView of this TNode
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildrenR3(tNode, lView, predicate, matches, elementsOnly, rootNativeNode) {
    var e_1, _a;
    var nativeNode = getNativeByTNodeOrNull(tNode, lView);
    // For each type of TNode, specific logic is executed.
    if (tNode.type === 3 /* Element */ || tNode.type === 4 /* ElementContainer */) {
        // Case 1: the TNode is an element
        // The native node has to be checked.
        _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode);
        if (isComponent(tNode)) {
            // If the element is the host of a component, then all nodes in its view have to be processed.
            // Note: the component's content (tNode.child) will be processed from the insertion points.
            var componentView = getComponentViewByIndex(tNode.index, lView);
            if (componentView && componentView[TVIEW].firstChild) {
                _queryNodeChildrenR3(componentView[TVIEW].firstChild, componentView, predicate, matches, elementsOnly, rootNativeNode);
            }
        }
        else {
            if (tNode.child) {
                // Otherwise, its children have to be processed.
                _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
            }
            // We also have to query the DOM directly in order to catch elements inserted through
            // Renderer2. Note that this is __not__ optimal, because we're walking similar trees multiple
            // times. ViewEngine could do it more efficiently, because all the insertions go through
            // Renderer2, however that's not the case in Ivy. This approach is being used because:
            // 1. Matching the ViewEngine behavior would mean potentially introducing a depedency
            //    from `Renderer2` to Ivy which could bring Ivy code into ViewEngine.
            // 2. We would have to make `Renderer3` "know" about debug nodes.
            // 3. It allows us to capture nodes that were inserted directly via the DOM.
            nativeNode && _queryNativeNodeDescendants(nativeNode, predicate, matches, elementsOnly);
        }
        // In all cases, if a dynamic container exists for this node, each view inside it has to be
        // processed.
        var nodeOrContainer = lView[tNode.index];
        if (isLContainer(nodeOrContainer)) {
            _queryNodeChildrenInContainerR3(nodeOrContainer, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.type === 0 /* Container */) {
        // Case 2: the TNode is a container
        // The native node has to be checked.
        var lContainer = lView[tNode.index];
        _addQueryMatchR3(lContainer[NATIVE], predicate, matches, elementsOnly, rootNativeNode);
        // Each view inside the container has to be processed.
        _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode);
    }
    else if (tNode.type === 1 /* Projection */) {
        // Case 3: the TNode is a projection insertion point (i.e. a <ng-content>).
        // The nodes projected at this location all need to be processed.
        var componentView = findComponentView(lView);
        var componentHost = componentView[T_HOST];
        var head = componentHost.projection[tNode.projection];
        if (Array.isArray(head)) {
            try {
                for (var head_1 = tslib_1.__values(head), head_1_1 = head_1.next(); !head_1_1.done; head_1_1 = head_1.next()) {
                    var nativeNode_1 = head_1_1.value;
                    _addQueryMatchR3(nativeNode_1, predicate, matches, elementsOnly, rootNativeNode);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (head_1_1 && !head_1_1.done && (_a = head_1.return)) _a.call(head_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        else if (head) {
            var nextLView = componentView[PARENT];
            var nextTNode = nextLView[TVIEW].data[head.index];
            _queryNodeChildrenR3(nextTNode, nextLView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
    else if (tNode.child) {
        // Case 4: the TNode is a view.
        _queryNodeChildrenR3(tNode.child, lView, predicate, matches, elementsOnly, rootNativeNode);
    }
    // We don't want to go to the next sibling of the root node.
    if (rootNativeNode !== nativeNode) {
        // To determine the next node to be processed, we need to use the next or the projectionNext
        // link, depending on whether the current node has been projected.
        var nextTNode = (tNode.flags & 2 /* isProjected */) ? tNode.projectionNext : tNode.next;
        if (nextTNode) {
            _queryNodeChildrenR3(nextTNode, lView, predicate, matches, elementsOnly, rootNativeNode);
        }
    }
}
/**
 * Process all TNodes in a given container.
 *
 * @param lContainer the container to be processed
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _queryNodeChildrenInContainerR3(lContainer, predicate, matches, elementsOnly, rootNativeNode) {
    for (var i = CONTAINER_HEADER_OFFSET; i < lContainer.length; i++) {
        var childView = lContainer[i];
        _queryNodeChildrenR3(childView[TVIEW].node, childView, predicate, matches, elementsOnly, rootNativeNode);
    }
}
/**
 * Match the current native node against the predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 * @param rootNativeNode the root native node on which predicate should not be matched
 */
function _addQueryMatchR3(nativeNode, predicate, matches, elementsOnly, rootNativeNode) {
    if (rootNativeNode !== nativeNode) {
        var debugNode = getDebugNode(nativeNode);
        if (!debugNode) {
            return;
        }
        // Type of the "predicate and "matches" array are set based on the value of
        // the "elementsOnly" parameter. TypeScript is not able to properly infer these
        // types with generics, so we manually cast the parameters accordingly.
        if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
        else if (!elementsOnly && predicate(debugNode) &&
            matches.indexOf(debugNode) === -1) {
            matches.push(debugNode);
        }
    }
}
/**
 * Match all the descendants of a DOM node against a predicate.
 *
 * @param nativeNode the current native node
 * @param predicate the predicate to match
 * @param matches the list of positive matches
 * @param elementsOnly whether only elements should be searched
 */
function _queryNativeNodeDescendants(parentNode, predicate, matches, elementsOnly) {
    var nodes = parentNode.childNodes;
    var length = nodes.length;
    for (var i = 0; i < length; i++) {
        var node = nodes[i];
        var debugNode = getDebugNode(node);
        if (debugNode) {
            if (elementsOnly && debugNode instanceof DebugElement__POST_R3__ && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            else if (!elementsOnly && predicate(debugNode) &&
                matches.indexOf(debugNode) === -1) {
                matches.push(debugNode);
            }
            _queryNativeNodeDescendants(node, predicate, matches, elementsOnly);
        }
    }
}
/**
 * Iterates through the property bindings for a given node and generates
 * a map of property names to values. This map only contains property bindings
 * defined in templates, not in host bindings.
 */
function collectPropertyBindings(tNode, lView, tData) {
    var properties = {};
    var bindingIndexes = tNode.propertyBindings;
    if (bindingIndexes !== null) {
        for (var i = 0; i < bindingIndexes.length; i++) {
            var bindingIndex = bindingIndexes[i];
            var propMetadata = tData[bindingIndex];
            var metadataParts = propMetadata.split(INTERPOLATION_DELIMITER);
            var propertyName = metadataParts[0];
            if (metadataParts.length > 1) {
                var value = metadataParts[1];
                for (var j = 1; j < metadataParts.length - 1; j++) {
                    value += renderStringify(lView[bindingIndex + j - 1]) + metadataParts[j + 1];
                }
                properties[propertyName] = value;
            }
            else {
                properties[propertyName] = lView[bindingIndex];
            }
        }
    }
    return properties;
}
function collectClassNames(debugElement) {
    var e_2, _a;
    var classes = debugElement.classes;
    var output = '';
    try {
        for (var _b = tslib_1.__values(Object.keys(classes)), _c = _b.next(); !_c.done; _c = _b.next()) {
            var className = _c.value;
            if (classes[className]) {
                output = output ? output + (" " + className) : className;
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return output;
}
// Need to keep the nodes in a global Map so that multiple angular apps are supported.
var _nativeNodeToDebugNode = new Map();
function getDebugNode__PRE_R3__(nativeNode) {
    return _nativeNodeToDebugNode.get(nativeNode) || null;
}
var NG_DEBUG_PROPERTY = '__ng_debug__';
export function getDebugNode__POST_R3__(nativeNode) {
    if (nativeNode instanceof Node) {
        if (!(nativeNode.hasOwnProperty(NG_DEBUG_PROPERTY))) {
            nativeNode[NG_DEBUG_PROPERTY] = nativeNode.nodeType == Node.ELEMENT_NODE ?
                new DebugElement__POST_R3__(nativeNode) :
                new DebugNode__POST_R3__(nativeNode);
        }
        return nativeNode[NG_DEBUG_PROPERTY];
    }
    return null;
}
/**
 * @publicApi
 */
export var getDebugNode = getDebugNode__PRE_R3__;
export function getAllDebugNodes() {
    return Array.from(_nativeNodeToDebugNode.values());
}
export function indexDebugNode(node) {
    _nativeNodeToDebugNode.set(node.nativeNode, node);
}
export function removeDebugNodeFromIndex(node) {
    _nativeNodeToDebugNode.delete(node.nativeNode);
}
/**
 * @publicApi
 */
export var DebugNode = DebugNode__PRE_R3__;
/**
 * @publicApi
 */
export var DebugElement = DebugElement__PRE_R3__;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVidWdfbm9kZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvcmUvc3JjL2RlYnVnL2RlYnVnX25vZGUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7OztHQU1HOztBQUdILE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDZCQUE2QixDQUFDO0FBQzdELE9BQU8sRUFBQyx1QkFBdUIsRUFBYyxNQUFNLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUU1RixPQUFPLEVBQUMsV0FBVyxFQUFFLFlBQVksRUFBQyxNQUFNLG1DQUFtQyxDQUFDO0FBQzVFLE9BQU8sRUFBUSxNQUFNLEVBQVMsS0FBSyxFQUFFLE1BQU0sRUFBQyxNQUFNLDRCQUE0QixDQUFDO0FBRS9FLE9BQU8sRUFBQyxxQkFBcUIsRUFBQyxNQUFNLDRDQUE0QyxDQUFDO0FBQ2pGLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLHVDQUF1QyxDQUFDO0FBQ3ZFLE9BQU8sRUFBQyxnQkFBZ0IsRUFBQyxNQUFNLDhCQUE4QixDQUFDO0FBQzlELE9BQU8sRUFBQyxZQUFZLEVBQUUsVUFBVSxFQUFFLGtCQUFrQixFQUFFLFdBQVcsRUFBRSxZQUFZLEVBQUUsWUFBWSxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQUMsTUFBTSxpQ0FBaUMsQ0FBQztBQUNySyxPQUFPLEVBQUMsdUJBQXVCLEVBQUUsZUFBZSxFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDcEYsT0FBTyxFQUFDLGlCQUFpQixFQUFDLE1BQU0sc0NBQXNDLENBQUM7QUFDdkUsT0FBTyxFQUFDLHVCQUF1QixFQUFFLHNCQUFzQixFQUFDLE1BQU0sNEJBQTRCLENBQUM7QUFDM0YsT0FBTyxFQUFDLGFBQWEsRUFBQyxNQUFNLGdCQUFnQixDQUFDO0FBSzdDOztHQUVHO0FBQ0g7SUFDRSw0QkFBbUIsSUFBWSxFQUFTLFFBQWtCO1FBQXZDLFNBQUksR0FBSixJQUFJLENBQVE7UUFBUyxhQUFRLEdBQVIsUUFBUSxDQUFVO0lBQUcsQ0FBQztJQUNoRSx5QkFBQztBQUFELENBQUMsQUFGRCxJQUVDOztBQWVEO0lBTUUsNkJBQVksVUFBZSxFQUFFLE1BQXNCLEVBQUUsYUFBMkI7UUFMdkUsY0FBUyxHQUF5QixFQUFFLENBQUM7UUFDckMsV0FBTSxHQUFzQixJQUFJLENBQUM7UUFLeEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxhQUFhLENBQUM7UUFDbkMsSUFBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUM7UUFDN0IsSUFBSSxNQUFNLElBQUksTUFBTSxZQUFZLHNCQUFzQixFQUFFO1lBQ3RELE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDdkI7SUFDSCxDQUFDO0lBRUQsc0JBQUkseUNBQVE7YUFBWixjQUEyQixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFaEUsc0JBQUksa0RBQWlCO2FBQXJCLGNBQStCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVyRSxzQkFBSSx3Q0FBTzthQUFYLGNBQXFCLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUV6RCxzQkFBSSwyQ0FBVTthQUFkLGNBQXlDLE9BQU8sSUFBSSxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVoRixzQkFBSSwrQ0FBYzthQUFsQixjQUE4QixPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDM0UsMEJBQUM7QUFBRCxDQUFDLEFBdkJELElBdUJDOztBQW9CRDtJQUE0QyxrREFBbUI7SUFTN0QsZ0NBQVksVUFBZSxFQUFFLE1BQVcsRUFBRSxhQUEyQjtRQUFyRSxZQUNFLGtCQUFNLFVBQVUsRUFBRSxNQUFNLEVBQUUsYUFBYSxDQUFDLFNBRXpDO1FBVlEsZ0JBQVUsR0FBeUIsRUFBRSxDQUFDO1FBQ3RDLGdCQUFVLEdBQW1DLEVBQUUsQ0FBQztRQUNoRCxhQUFPLEdBQTZCLEVBQUUsQ0FBQztRQUN2QyxZQUFNLEdBQW1DLEVBQUUsQ0FBQztRQUM1QyxnQkFBVSxHQUFnQixFQUFFLENBQUM7UUFLcEMsS0FBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUM7O0lBQ2xDLENBQUM7SUFFRCx5Q0FBUSxHQUFSLFVBQVMsS0FBZ0I7UUFDdkIsSUFBSSxLQUFLLEVBQUU7WUFDVCxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUMzQixLQUE0QixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7U0FDN0M7SUFDSCxDQUFDO0lBRUQsNENBQVcsR0FBWCxVQUFZLEtBQWdCO1FBQzFCLElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2xELElBQUksVUFBVSxLQUFLLENBQUMsQ0FBQyxFQUFFO1lBQ3BCLEtBQW1DLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztZQUNuRCxJQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUFDLENBQUM7U0FDdkM7SUFDSCxDQUFDO0lBRUQsb0RBQW1CLEdBQW5CLFVBQW9CLEtBQWdCLEVBQUUsV0FBd0I7O1FBQTlELGlCQVdDO1FBVkMsSUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDcEQsSUFBSSxZQUFZLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDdkIsQ0FBQSxLQUFBLElBQUksQ0FBQyxVQUFVLENBQUEsQ0FBQyxNQUFNLDZCQUFDLFlBQVksR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFLLFdBQVcsR0FBRTtZQUM1RCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQztnQkFDbkIsSUFBSSxDQUFDLENBQUMsTUFBTSxFQUFFO29CQUNYLENBQUMsQ0FBQyxNQUFpQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDckQ7Z0JBQ0EsS0FBNEIsQ0FBQyxNQUFNLEdBQUcsS0FBSSxDQUFDO1lBQzlDLENBQUMsQ0FBQyxDQUFDO1NBQ0o7SUFDSCxDQUFDO0lBRUQsNkNBQVksR0FBWixVQUFhLFFBQW1CLEVBQUUsUUFBbUI7UUFDbkQsSUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkQsSUFBSSxRQUFRLEtBQUssQ0FBQyxDQUFDLEVBQUU7WUFDbkIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztTQUN6QjthQUFNO1lBQ0wsSUFBSSxRQUFRLENBQUMsTUFBTSxFQUFFO2dCQUNsQixRQUFRLENBQUMsTUFBaUMsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDbkU7WUFDQSxRQUErQixDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUM7WUFDL0MsSUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxRQUFRLENBQUMsQ0FBQztTQUMvQztJQUNILENBQUM7SUFFRCxzQ0FBSyxHQUFMLFVBQU0sU0FBa0M7UUFDdEMsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN6QyxPQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUM7SUFDNUIsQ0FBQztJQUVELHlDQUFRLEdBQVIsVUFBUyxTQUFrQztRQUN6QyxJQUFNLE9BQU8sR0FBbUIsRUFBRSxDQUFDO1FBQ25DLHFCQUFxQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDaEQsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELDhDQUFhLEdBQWIsVUFBYyxTQUErQjtRQUMzQyxJQUFNLE9BQU8sR0FBZ0IsRUFBRSxDQUFDO1FBQ2hDLGtCQUFrQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0MsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELHNCQUFJLDRDQUFRO2FBQVo7WUFDRSxPQUFPLElBQUk7aUJBQ04sVUFBVSxDQUFFLEVBQUU7aUJBQ2QsTUFBTSxDQUFDLFVBQUMsSUFBSSxJQUFLLE9BQUEsSUFBSSxZQUFZLHNCQUFzQixFQUF0QyxDQUFzQyxDQUFtQixDQUFDO1FBQ2xGLENBQUM7OztPQUFBO0lBRUQsb0RBQW1CLEdBQW5CLFVBQW9CLFNBQWlCLEVBQUUsUUFBYTtRQUNsRCxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQVE7WUFDOUIsSUFBSSxRQUFRLENBQUMsSUFBSSxJQUFJLFNBQVMsRUFBRTtnQkFDOUIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUM3QjtRQUNILENBQUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUNILDZCQUFDO0FBQUQsQ0FBQyxBQXJGRCxDQUE0QyxtQkFBbUIsR0FxRjlEOztBQUVEOztHQUVHO0FBQ0gsTUFBTSxVQUFVLGdCQUFnQixDQUFDLFFBQXdCO0lBQ3ZELE9BQU8sUUFBUSxDQUFDLEdBQUcsQ0FBQyxVQUFDLEVBQUUsSUFBSyxPQUFBLEVBQUUsQ0FBQyxhQUFhLEVBQWhCLENBQWdCLENBQUMsQ0FBQztBQUNoRCxDQUFDO0FBRUQsU0FBUyxxQkFBcUIsQ0FDMUIsT0FBcUIsRUFBRSxTQUFrQyxFQUFFLE9BQXVCO0lBQ3BGLE9BQU8sQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSTtRQUM3QixJQUFJLElBQUksWUFBWSxzQkFBc0IsRUFBRTtZQUMxQyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNwQjtZQUNELHFCQUFxQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDakQ7SUFDSCxDQUFDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFFRCxTQUFTLGtCQUFrQixDQUN2QixVQUFxQixFQUFFLFNBQStCLEVBQUUsT0FBb0I7SUFDOUUsSUFBSSxVQUFVLFlBQVksc0JBQXNCLEVBQUU7UUFDaEQsVUFBVSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsVUFBQSxJQUFJO1lBQ2hDLElBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUNuQixPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ3BCO1lBQ0QsSUFBSSxJQUFJLFlBQVksc0JBQXNCLEVBQUU7Z0JBQzFDLGtCQUFrQixDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDOUM7UUFDSCxDQUFDLENBQUMsQ0FBQztLQUNKO0FBQ0gsQ0FBQztBQUNEO0lBR0UsOEJBQVksVUFBZ0I7UUFBSSxJQUFJLENBQUMsVUFBVSxHQUFHLFVBQVUsQ0FBQztJQUFDLENBQUM7SUFFL0Qsc0JBQUksd0NBQU07YUFBVjtZQUNFLElBQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBcUIsQ0FBQztZQUNyRCxPQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBQzdELENBQUM7OztPQUFBO0lBRUQsc0JBQUksMENBQVE7YUFBWixjQUEyQixPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7T0FBQTtJQUVqRSxzQkFBSSxtREFBaUI7YUFBckI7WUFDRSxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1lBQ3RDLE9BQU8sYUFBYTtnQkFDaEIsQ0FBQyxZQUFZLENBQUMsYUFBd0IsQ0FBQyxJQUFJLGdCQUFnQixDQUFDLGFBQWEsQ0FBQyxDQUFDLENBQUM7UUFDbEYsQ0FBQzs7O09BQUE7SUFDRCxzQkFBSSx5Q0FBTzthQUFYO1lBQ0UsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQXFCLENBQUMsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLFVBQXFCLENBQUMsQ0FBQztRQUM1RixDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDJDQUFTO2FBQWI7WUFDRSxPQUFPLFlBQVksQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUMxRSxDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDRDQUFVO2FBQWQsY0FBMEMsT0FBTyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFFakYsc0JBQUksZ0RBQWM7YUFBbEIsY0FBOEIsT0FBTyxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsVUFBcUIsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7O09BQUE7SUFDeEYsMkJBQUM7QUFBRCxDQUFDLEFBNUJELElBNEJDO0FBRUQ7SUFBc0MsbURBQW9CO0lBQ3hELGlDQUFZLFVBQW1CO1FBQS9CLGlCQUdDO1FBRkMsU0FBUyxJQUFJLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUN2QyxRQUFBLGtCQUFNLFVBQVUsQ0FBQyxTQUFDOztJQUNwQixDQUFDO0lBRUQsc0JBQUksa0RBQWE7YUFBakI7WUFDRSxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxVQUFxQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7UUFDM0YsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSx5Q0FBSTthQUFSO1lBQ0UsSUFBSTtnQkFDRixJQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBRyxDQUFDO2dCQUNoRCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO2dCQUM1QixJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUNoQyxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVSxDQUFDO2dCQUNoRCxPQUFPLEtBQUssQ0FBQyxPQUFTLENBQUM7YUFDeEI7WUFBQyxPQUFPLENBQUMsRUFBRTtnQkFDVixPQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO2FBQ2pDO1FBQ0gsQ0FBQzs7O09BQUE7SUFjRCxzQkFBSSwrQ0FBVTtRQVpkOzs7Ozs7Ozs7OztXQVdHO2FBQ0g7WUFDRSxJQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyRCxJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7Z0JBQ25CLE9BQU8sRUFBRSxDQUFDO2FBQ1g7WUFFRCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzVCLElBQU0sS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDaEMsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVUsQ0FBQztZQUVoRCxJQUFNLFVBQVUsR0FBRyx1QkFBdUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ2hFLElBQU0sU0FBUyxHQUFHLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO1lBRTFDLElBQUksU0FBUyxFQUFFO2dCQUNiLFVBQVUsQ0FBQyxXQUFXLENBQUM7b0JBQ25CLFVBQVUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FBQyxJQUFHLE1BQUksU0FBVyxDQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzthQUNyRjtZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ3BCLENBQUM7OztPQUFBO0lBRUQsc0JBQUksK0NBQVU7YUFBZDtZQUNFLElBQU0sVUFBVSxHQUFvQyxFQUFFLENBQUM7WUFDdkQsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQztZQUVuQyxJQUFJLENBQUMsT0FBTyxFQUFFO2dCQUNaLE9BQU8sVUFBVSxDQUFDO2FBQ25CO1lBRUQsSUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztZQUM3QyxJQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7Z0JBQ25CLE9BQU8sRUFBRSxDQUFDO2FBQ1g7WUFFRCxJQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDO1lBQzVCLElBQU0sVUFBVSxHQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVyxDQUFDLEtBQUssQ0FBQztZQUN6RSxJQUFNLG1CQUFtQixHQUFhLEVBQUUsQ0FBQztZQUV6QywyRkFBMkY7WUFDM0YsNkZBQTZGO1lBQzdGLCtGQUErRjtZQUMvRiwrRkFBK0Y7WUFDL0YsNEZBQTRGO1lBQzVGLDZGQUE2RjtZQUM3RixzRUFBc0U7WUFDdEUsSUFBSSxVQUFVLEVBQUU7Z0JBQ2QsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO2dCQUNWLE9BQU8sQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUU7b0JBQzVCLElBQU0sUUFBUSxHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztvQkFFL0IseUZBQXlGO29CQUN6Riw0RUFBNEU7b0JBQzVFLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUTt3QkFBRSxNQUFNO29CQUV4QyxJQUFNLFNBQVMsR0FBRyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO29CQUNwQyxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsU0FBbUIsQ0FBQztvQkFDM0MsbUJBQW1CLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDO29CQUVqRCxDQUFDLElBQUksQ0FBQyxDQUFDO2lCQUNSO2FBQ0Y7WUFFRCxJQUFNLE1BQU0sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO1lBQ2xDLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUN0QyxJQUFNLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3ZCLGdFQUFnRTtnQkFDaEUsZ0VBQWdFO2dCQUNoRSxJQUFJLG1CQUFtQixDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7b0JBQ2pELFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztpQkFDcEM7YUFDRjtZQUVELE9BQU8sVUFBVSxDQUFDO1FBQ3BCLENBQUM7OztPQUFBO0lBRUQsc0JBQUksMkNBQU07YUFBVjtZQUNFLE9BQU8sb0JBQW9CLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN6RCxDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDRDQUFPO2FBQVg7WUFDRSxPQUFPLG9CQUFvQixDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDeEQsQ0FBQzs7O09BQUE7SUFFRCxzQkFBSSwrQ0FBVTthQUFkO1lBQ0UsSUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUM7WUFDOUMsSUFBTSxRQUFRLEdBQWdCLEVBQUUsQ0FBQztZQUNqQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUMsSUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDakQ7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDOzs7T0FBQTtJQUVELHNCQUFJLDZDQUFRO2FBQVo7WUFDRSxJQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDO1lBQ3pDLElBQUksQ0FBQyxhQUFhO2dCQUFFLE9BQU8sRUFBRSxDQUFDO1lBQzlCLElBQU0sVUFBVSxHQUFHLGFBQWEsQ0FBQyxRQUFRLENBQUM7WUFDMUMsSUFBTSxRQUFRLEdBQW1CLEVBQUUsQ0FBQztZQUNwQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtnQkFDMUMsSUFBTSxPQUFPLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM5QixRQUFRLENBQUMsSUFBSSxDQUFDLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7YUFDakQ7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDOzs7T0FBQTtJQUVELHVDQUFLLEdBQUwsVUFBTSxTQUFrQztRQUN0QyxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3pDLE9BQU8sT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQztJQUM1QixDQUFDO0lBRUQsMENBQVEsR0FBUixVQUFTLFNBQWtDO1FBQ3pDLElBQU0sT0FBTyxHQUFtQixFQUFFLENBQUM7UUFDbkMsV0FBVyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzVDLE9BQU8sT0FBTyxDQUFDO0lBQ2pCLENBQUM7SUFFRCwrQ0FBYSxHQUFiLFVBQWMsU0FBK0I7UUFDM0MsSUFBTSxPQUFPLEdBQWdCLEVBQUUsQ0FBQztRQUNoQyxXQUFXLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDN0MsT0FBTyxPQUFPLENBQUM7SUFDakIsQ0FBQztJQUVELHFEQUFtQixHQUFuQixVQUFvQixTQUFpQixFQUFFLFFBQWE7UUFDbEQsSUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQWlCLENBQUM7UUFDcEMsSUFBTSxnQkFBZ0IsR0FBZSxFQUFFLENBQUM7UUFFeEMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQSxRQUFRO1lBQzdCLElBQUksUUFBUSxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUU7Z0JBQy9CLElBQU0sUUFBUSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7Z0JBQ25DLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDbkIsZ0JBQWdCLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO2FBQ2pDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCwyRUFBMkU7UUFDM0UsbUVBQW1FO1FBQ25FLElBQUksT0FBTyxJQUFJLENBQUMsY0FBYyxLQUFLLFVBQVUsRUFBRTtZQUM3Qyx5RkFBeUY7WUFDekYsdUZBQXVGO1lBQ3ZGLFlBQVk7WUFDWixJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLFFBQWtCO2dCQUN4RCxJQUFNLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDN0MsT0FBTyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxpQkFBaUIsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUMzRixDQUFDLENBQUMsQ0FBQztTQUNKO0lBQ0gsQ0FBQztJQUNILDhCQUFDO0FBQUQsQ0FBQyxBQXBMRCxDQUFzQyxvQkFBb0IsR0FvTHpEO0FBRUQsU0FBUyxvQkFBb0IsQ0FBQyxPQUFZLEVBQUUsWUFBcUI7SUFDL0QsSUFBTSxPQUFPLEdBQUcsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztJQUM3QyxJQUFJLENBQUMsT0FBTyxFQUFFO1FBQ1osT0FBTyxFQUFFLENBQUM7S0FDWDtJQUVELElBQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUM7SUFDNUIsSUFBTSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQztJQUNoQyxJQUFNLEtBQUssR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBVSxDQUFDO0lBQ2hELElBQUksWUFBWSxFQUFFO1FBQ2hCLE9BQU8sZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUM7WUFDcEMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsT0FBMEIsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDNUUscUJBQXFCLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQzFDO1NBQU07UUFDTCxPQUFPLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ25DLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLE1BQXlCLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1lBQzVFLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztLQUN6QztBQUNILENBQUM7QUFnQkQsU0FBUyxXQUFXLENBQ2hCLGFBQTJCLEVBQUUsU0FBd0QsRUFDckYsT0FBcUMsRUFBRSxZQUFxQjtJQUM5RCxJQUFNLE9BQU8sR0FBRyxZQUFZLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBRyxDQUFDO0lBQ3pELElBQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQVUsQ0FBQztJQUMxRSxvQkFBb0IsQ0FDaEIsV0FBVyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlGLENBQUM7QUFFRDs7Ozs7Ozs7O0dBU0c7QUFDSCxTQUFTLG9CQUFvQixDQUN6QixLQUFZLEVBQUUsS0FBWSxFQUFFLFNBQXdELEVBQ3BGLE9BQXFDLEVBQUUsWUFBcUIsRUFBRSxjQUFtQjs7SUFDbkYsSUFBTSxVQUFVLEdBQUcsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQ3hELHNEQUFzRDtJQUN0RCxJQUFJLEtBQUssQ0FBQyxJQUFJLG9CQUFzQixJQUFJLEtBQUssQ0FBQyxJQUFJLDZCQUErQixFQUFFO1FBQ2pGLGtDQUFrQztRQUNsQyxxQ0FBcUM7UUFDckMsZ0JBQWdCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQy9FLElBQUksV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQ3RCLDhGQUE4RjtZQUM5RiwyRkFBMkY7WUFDM0YsSUFBTSxhQUFhLEdBQUcsdUJBQXVCLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNsRSxJQUFJLGFBQWEsSUFBSSxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxFQUFFO2dCQUNwRCxvQkFBb0IsQ0FDaEIsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVksRUFBRSxhQUFhLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQ2xGLGNBQWMsQ0FBQyxDQUFDO2FBQ3JCO1NBQ0Y7YUFBTTtZQUNMLElBQUksS0FBSyxDQUFDLEtBQUssRUFBRTtnQkFDZixnREFBZ0Q7Z0JBQ2hELG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2FBQzVGO1lBRUQscUZBQXFGO1lBQ3JGLDZGQUE2RjtZQUM3Rix3RkFBd0Y7WUFDeEYsc0ZBQXNGO1lBQ3RGLHFGQUFxRjtZQUNyRix5RUFBeUU7WUFDekUsaUVBQWlFO1lBQ2pFLDRFQUE0RTtZQUM1RSxVQUFVLElBQUksMkJBQTJCLENBQUMsVUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDekY7UUFDRCwyRkFBMkY7UUFDM0YsYUFBYTtRQUNiLElBQU0sZUFBZSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDM0MsSUFBSSxZQUFZLENBQUMsZUFBZSxDQUFDLEVBQUU7WUFDakMsK0JBQStCLENBQzNCLGVBQWUsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztTQUN4RTtLQUNGO1NBQU0sSUFBSSxLQUFLLENBQUMsSUFBSSxzQkFBd0IsRUFBRTtRQUM3QyxtQ0FBbUM7UUFDbkMscUNBQXFDO1FBQ3JDLElBQU0sVUFBVSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDdEMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1FBQ3ZGLHNEQUFzRDtRQUN0RCwrQkFBK0IsQ0FBQyxVQUFVLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDL0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLHVCQUF5QixFQUFFO1FBQzlDLDJFQUEyRTtRQUMzRSxpRUFBaUU7UUFDakUsSUFBTSxhQUFhLEdBQUcsaUJBQWlCLENBQUMsS0FBTyxDQUFDLENBQUM7UUFDakQsSUFBTSxhQUFhLEdBQUcsYUFBYSxDQUFDLE1BQU0sQ0FBaUIsQ0FBQztRQUM1RCxJQUFNLElBQUksR0FDTCxhQUFhLENBQUMsVUFBOEIsQ0FBQyxLQUFLLENBQUMsVUFBb0IsQ0FBQyxDQUFDO1FBRTlFLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTs7Z0JBQ3ZCLEtBQXVCLElBQUEsU0FBQSxpQkFBQSxJQUFJLENBQUEsMEJBQUEsNENBQUU7b0JBQXhCLElBQUksWUFBVSxpQkFBQTtvQkFDakIsZ0JBQWdCLENBQUMsWUFBVSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO2lCQUNoRjs7Ozs7Ozs7O1NBQ0Y7YUFBTSxJQUFJLElBQUksRUFBRTtZQUNmLElBQU0sU0FBUyxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQVcsQ0FBQztZQUNsRCxJQUFNLFNBQVMsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQVUsQ0FBQztZQUM3RCxvQkFBb0IsQ0FBQyxTQUFTLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO1NBQzlGO0tBQ0Y7U0FBTSxJQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUU7UUFDdEIsK0JBQStCO1FBQy9CLG9CQUFvQixDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxFQUFFLGNBQWMsQ0FBQyxDQUFDO0tBQzVGO0lBRUQsNERBQTREO0lBQzVELElBQUksY0FBYyxLQUFLLFVBQVUsRUFBRTtRQUNqQyw0RkFBNEY7UUFDNUYsa0VBQWtFO1FBQ2xFLElBQU0sU0FBUyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssc0JBQXlCLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQztRQUM3RixJQUFJLFNBQVMsRUFBRTtZQUNiLG9CQUFvQixDQUFDLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLE9BQU8sRUFBRSxZQUFZLEVBQUUsY0FBYyxDQUFDLENBQUM7U0FDMUY7S0FDRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsK0JBQStCLENBQ3BDLFVBQXNCLEVBQUUsU0FBd0QsRUFDaEYsT0FBcUMsRUFBRSxZQUFxQixFQUFFLGNBQW1CO0lBQ25GLEtBQUssSUFBSSxDQUFDLEdBQUcsdUJBQXVCLEVBQUUsQ0FBQyxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7UUFDaEUsSUFBTSxTQUFTLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2hDLG9CQUFvQixDQUNoQixTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsSUFBTSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQztLQUMzRjtBQUNILENBQUM7QUFFRDs7Ozs7Ozs7R0FRRztBQUNILFNBQVMsZ0JBQWdCLENBQ3JCLFVBQWUsRUFBRSxTQUF3RCxFQUN6RSxPQUFxQyxFQUFFLFlBQXFCLEVBQUUsY0FBbUI7SUFDbkYsSUFBSSxjQUFjLEtBQUssVUFBVSxFQUFFO1FBQ2pDLElBQU0sU0FBUyxHQUFHLFlBQVksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMzQyxJQUFJLENBQUMsU0FBUyxFQUFFO1lBQ2QsT0FBTztTQUNSO1FBQ0QsMkVBQTJFO1FBQzNFLCtFQUErRTtRQUMvRSx1RUFBdUU7UUFDdkUsSUFBSSxZQUFZLElBQUksU0FBUyxZQUFZLHVCQUF1QixJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUM7WUFDcEYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNyQyxPQUFPLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQ3pCO2FBQU0sSUFDSCxDQUFDLFlBQVksSUFBSyxTQUFrQyxDQUFDLFNBQVMsQ0FBQztZQUM5RCxPQUF1QixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRTtZQUNyRCxPQUF1QixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMxQztLQUNGO0FBQ0gsQ0FBQztBQUVEOzs7Ozs7O0dBT0c7QUFDSCxTQUFTLDJCQUEyQixDQUNoQyxVQUFlLEVBQUUsU0FBd0QsRUFDekUsT0FBcUMsRUFBRSxZQUFxQjtJQUM5RCxJQUFNLEtBQUssR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFDO0lBQ3BDLElBQU0sTUFBTSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7SUFFNUIsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtRQUMvQixJQUFNLElBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsSUFBTSxTQUFTLEdBQUcsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBRXJDLElBQUksU0FBUyxFQUFFO1lBQ2IsSUFBSSxZQUFZLElBQUksU0FBUyxZQUFZLHVCQUF1QixJQUFJLFNBQVMsQ0FBQyxTQUFTLENBQUM7Z0JBQ3BGLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JDLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7YUFDekI7aUJBQU0sSUFDSCxDQUFDLFlBQVksSUFBSyxTQUFrQyxDQUFDLFNBQVMsQ0FBQztnQkFDOUQsT0FBdUIsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUU7Z0JBQ3JELE9BQXVCLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO2FBQzFDO1lBRUQsMkJBQTJCLENBQUMsSUFBSSxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsWUFBWSxDQUFDLENBQUM7U0FDckU7S0FDRjtBQUNILENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsS0FBWSxFQUFFLEtBQVksRUFBRSxLQUFZO0lBQzFDLElBQU0sVUFBVSxHQUE0QixFQUFFLENBQUM7SUFDL0MsSUFBSSxjQUFjLEdBQUcsS0FBSyxDQUFDLGdCQUFnQixDQUFDO0lBRTVDLElBQUksY0FBYyxLQUFLLElBQUksRUFBRTtRQUMzQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsY0FBYyxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUM5QyxJQUFNLFlBQVksR0FBRyxjQUFjLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdkMsSUFBTSxZQUFZLEdBQUcsS0FBSyxDQUFDLFlBQVksQ0FBVyxDQUFDO1lBQ25ELElBQU0sYUFBYSxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUMsQ0FBQztZQUNsRSxJQUFNLFlBQVksR0FBRyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDdEMsSUFBSSxhQUFhLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtnQkFDNUIsSUFBSSxLQUFLLEdBQUcsYUFBYSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUM3QixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsYUFBYSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7b0JBQ2pELEtBQUssSUFBSSxlQUFlLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxhQUFhLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2lCQUM5RTtnQkFDRCxVQUFVLENBQUMsWUFBWSxDQUFDLEdBQUcsS0FBSyxDQUFDO2FBQ2xDO2lCQUFNO2dCQUNMLFVBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxLQUFLLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDaEQ7U0FDRjtLQUNGO0lBRUQsT0FBTyxVQUFVLENBQUM7QUFDcEIsQ0FBQztBQUdELFNBQVMsaUJBQWlCLENBQUMsWUFBcUM7O0lBQzlELElBQU0sT0FBTyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUM7SUFDckMsSUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztRQUVoQixLQUF3QixJQUFBLEtBQUEsaUJBQUEsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQSxnQkFBQSw0QkFBRTtZQUF6QyxJQUFNLFNBQVMsV0FBQTtZQUNsQixJQUFJLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDdEIsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsTUFBTSxJQUFHLE1BQUksU0FBVyxDQUFBLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzthQUN4RDtTQUNGOzs7Ozs7Ozs7SUFFRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBR0Qsc0ZBQXNGO0FBQ3RGLElBQU0sc0JBQXNCLEdBQUcsSUFBSSxHQUFHLEVBQWtCLENBQUM7QUFFekQsU0FBUyxzQkFBc0IsQ0FBQyxVQUFlO0lBQzdDLE9BQU8sc0JBQXNCLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQztBQUN4RCxDQUFDO0FBRUQsSUFBTSxpQkFBaUIsR0FBRyxjQUFjLENBQUM7QUFLekMsTUFBTSxVQUFVLHVCQUF1QixDQUFDLFVBQWU7SUFDckQsSUFBSSxVQUFVLFlBQVksSUFBSSxFQUFFO1FBQzlCLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxFQUFFO1lBQ2xELFVBQWtCLENBQUMsaUJBQWlCLENBQUMsR0FBRyxVQUFVLENBQUMsUUFBUSxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQztnQkFDL0UsSUFBSSx1QkFBdUIsQ0FBQyxVQUFxQixDQUFDLENBQUMsQ0FBQztnQkFDcEQsSUFBSSxvQkFBb0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztTQUMxQztRQUNELE9BQVEsVUFBa0IsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQy9DO0lBQ0QsT0FBTyxJQUFJLENBQUM7QUFDZCxDQUFDO0FBRUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxZQUFZLEdBQTBDLHNCQUFzQixDQUFDO0FBRTFGLE1BQU0sVUFBVSxnQkFBZ0I7SUFDOUIsT0FBTyxLQUFLLENBQUMsSUFBSSxDQUFDLHNCQUFzQixDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7QUFDckQsQ0FBQztBQUVELE1BQU0sVUFBVSxjQUFjLENBQUMsSUFBZTtJQUM1QyxzQkFBc0IsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNwRCxDQUFDO0FBRUQsTUFBTSxVQUFVLHdCQUF3QixDQUFDLElBQWU7SUFDdEQsc0JBQXNCLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNqRCxDQUFDO0FBVUQ7O0dBRUc7QUFDSCxNQUFNLENBQUMsSUFBTSxTQUFTLEdBQXNDLG1CQUFtQixDQUFDO0FBRWhGOztHQUVHO0FBQ0gsTUFBTSxDQUFDLElBQU0sWUFBWSxHQUF5QyxzQkFBc0IsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtJbmplY3Rvcn0gZnJvbSAnLi4vZGknO1xuaW1wb3J0IHtnZXRWaWV3Q29tcG9uZW50fSBmcm9tICcuLi9yZW5kZXIzL2dsb2JhbF91dGlsc19hcGknO1xuaW1wb3J0IHtDT05UQUlORVJfSEVBREVSX09GRlNFVCwgTENvbnRhaW5lciwgTkFUSVZFfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvY29udGFpbmVyJztcbmltcG9ydCB7VEVsZW1lbnROb2RlLCBUTm9kZSwgVE5vZGVGbGFncywgVE5vZGVUeXBlfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvbm9kZSc7XG5pbXBvcnQge2lzQ29tcG9uZW50LCBpc0xDb250YWluZXJ9IGZyb20gJy4uL3JlbmRlcjMvaW50ZXJmYWNlcy90eXBlX2NoZWNrcyc7XG5pbXBvcnQge0xWaWV3LCBQQVJFTlQsIFREYXRhLCBUVklFVywgVF9IT1NUfSBmcm9tICcuLi9yZW5kZXIzL2ludGVyZmFjZXMvdmlldyc7XG5pbXBvcnQge1RTdHlsaW5nQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvaW50ZXJmYWNlcyc7XG5pbXBvcnQge3N0eWxpbmdNYXBUb1N0cmluZ01hcH0gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvbWFwX2Jhc2VkX2JpbmRpbmdzJztcbmltcG9ydCB7Tm9kZVN0eWxpbmdEZWJ1Z30gZnJvbSAnLi4vcmVuZGVyMy9zdHlsaW5nX25leHQvc3R5bGluZ19kZWJ1Zyc7XG5pbXBvcnQge2lzU3R5bGluZ0NvbnRleHR9IGZyb20gJy4uL3JlbmRlcjMvc3R5bGluZ19uZXh0L3V0aWwnO1xuaW1wb3J0IHtnZXRDb21wb25lbnQsIGdldENvbnRleHQsIGdldEluamVjdGlvblRva2VucywgZ2V0SW5qZWN0b3IsIGdldExpc3RlbmVycywgZ2V0TG9jYWxSZWZzLCBpc0Jyb3dzZXJFdmVudHMsIGxvYWRMQ29udGV4dH0gZnJvbSAnLi4vcmVuZGVyMy91dGlsL2Rpc2NvdmVyeV91dGlscyc7XG5pbXBvcnQge0lOVEVSUE9MQVRJT05fREVMSU1JVEVSLCByZW5kZXJTdHJpbmdpZnl9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC9taXNjX3V0aWxzJztcbmltcG9ydCB7ZmluZENvbXBvbmVudFZpZXd9IGZyb20gJy4uL3JlbmRlcjMvdXRpbC92aWV3X3RyYXZlcnNhbF91dGlscyc7XG5pbXBvcnQge2dldENvbXBvbmVudFZpZXdCeUluZGV4LCBnZXROYXRpdmVCeVROb2RlT3JOdWxsfSBmcm9tICcuLi9yZW5kZXIzL3V0aWwvdmlld191dGlscyc7XG5pbXBvcnQge2Fzc2VydERvbU5vZGV9IGZyb20gJy4uL3V0aWwvYXNzZXJ0JztcbmltcG9ydCB7RGVidWdDb250ZXh0fSBmcm9tICcuLi92aWV3L2luZGV4JztcblxuXG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY2xhc3MgRGVidWdFdmVudExpc3RlbmVyIHtcbiAgY29uc3RydWN0b3IocHVibGljIG5hbWU6IHN0cmluZywgcHVibGljIGNhbGxiYWNrOiBGdW5jdGlvbikge31cbn1cblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVidWdOb2RlIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXTtcbiAgcmVhZG9ubHkgcGFyZW50OiBEZWJ1Z0VsZW1lbnR8bnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICByZWFkb25seSBpbmplY3RvcjogSW5qZWN0b3I7XG4gIHJlYWRvbmx5IGNvbXBvbmVudEluc3RhbmNlOiBhbnk7XG4gIHJlYWRvbmx5IGNvbnRleHQ6IGFueTtcbiAgcmVhZG9ubHkgcmVmZXJlbmNlczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IHByb3ZpZGVyVG9rZW5zOiBhbnlbXTtcbn1cbmV4cG9ydCBjbGFzcyBEZWJ1Z05vZGVfX1BSRV9SM19fIHtcbiAgcmVhZG9ubHkgbGlzdGVuZXJzOiBEZWJ1Z0V2ZW50TGlzdGVuZXJbXSA9IFtdO1xuICByZWFkb25seSBwYXJlbnQ6IERlYnVnRWxlbWVudHxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgbmF0aXZlTm9kZTogYW55O1xuICBwcml2YXRlIHJlYWRvbmx5IF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dDtcblxuICBjb25zdHJ1Y3RvcihuYXRpdmVOb2RlOiBhbnksIHBhcmVudDogRGVidWdOb2RlfG51bGwsIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHRoaXMuX2RlYnVnQ29udGV4dCA9IF9kZWJ1Z0NvbnRleHQ7XG4gICAgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTtcbiAgICBpZiAocGFyZW50ICYmIHBhcmVudCBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIHBhcmVudC5hZGRDaGlsZCh0aGlzKTtcbiAgICB9XG4gIH1cblxuICBnZXQgaW5qZWN0b3IoKTogSW5qZWN0b3IgeyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LmluamVjdG9yOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7IHJldHVybiB0aGlzLl9kZWJ1Z0NvbnRleHQuY29tcG9uZW50OyB9XG5cbiAgZ2V0IGNvbnRleHQoKTogYW55IHsgcmV0dXJuIHRoaXMuX2RlYnVnQ29udGV4dC5jb250ZXh0OyB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueX0geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnJlZmVyZW5jZXM7IH1cblxuICBnZXQgcHJvdmlkZXJUb2tlbnMoKTogYW55W10geyByZXR1cm4gdGhpcy5fZGVidWdDb250ZXh0LnByb3ZpZGVyVG9rZW5zOyB9XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgaW50ZXJmYWNlIERlYnVnRWxlbWVudCBleHRlbmRzIERlYnVnTm9kZSB7XG4gIHJlYWRvbmx5IG5hbWU6IHN0cmluZztcbiAgcmVhZG9ubHkgcHJvcGVydGllczoge1trZXk6IHN0cmluZ106IGFueX07XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2xhc3Nlczoge1trZXk6IHN0cmluZ106IGJvb2xlYW59O1xuICByZWFkb25seSBzdHlsZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW107XG4gIHJlYWRvbmx5IG5hdGl2ZUVsZW1lbnQ6IGFueTtcbiAgcmVhZG9ubHkgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdO1xuXG4gIHF1ZXJ5KHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnQ7XG4gIHF1ZXJ5QWxsKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4pOiBEZWJ1Z0VsZW1lbnRbXTtcbiAgcXVlcnlBbGxOb2RlcyhwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z05vZGU+KTogRGVidWdOb2RlW107XG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpOiB2b2lkO1xufVxuZXhwb3J0IGNsYXNzIERlYnVnRWxlbWVudF9fUFJFX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BSRV9SM19fIGltcGxlbWVudHMgRGVidWdFbGVtZW50IHtcbiAgcmVhZG9ubHkgbmFtZSAhOiBzdHJpbmc7XG4gIHJlYWRvbmx5IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBhbnl9ID0ge307XG4gIHJlYWRvbmx5IGF0dHJpYnV0ZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmcgfCBudWxsfSA9IHt9O1xuICByZWFkb25seSBjbGFzc2VzOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbn0gPSB7fTtcbiAgcmVhZG9ubHkgc3R5bGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbH0gPSB7fTtcbiAgcmVhZG9ubHkgY2hpbGROb2RlczogRGVidWdOb2RlW10gPSBbXTtcbiAgcmVhZG9ubHkgbmF0aXZlRWxlbWVudDogYW55O1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IGFueSwgcGFyZW50OiBhbnksIF9kZWJ1Z0NvbnRleHQ6IERlYnVnQ29udGV4dCkge1xuICAgIHN1cGVyKG5hdGl2ZU5vZGUsIHBhcmVudCwgX2RlYnVnQ29udGV4dCk7XG4gICAgdGhpcy5uYXRpdmVFbGVtZW50ID0gbmF0aXZlTm9kZTtcbiAgfVxuXG4gIGFkZENoaWxkKGNoaWxkOiBEZWJ1Z05vZGUpIHtcbiAgICBpZiAoY2hpbGQpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5wdXNoKGNoaWxkKTtcbiAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlQ2hpbGQoY2hpbGQ6IERlYnVnTm9kZSkge1xuICAgIGNvbnN0IGNoaWxkSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKGNoaWxkSW5kZXggIT09IC0xKSB7XG4gICAgICAoY2hpbGQgYXN7cGFyZW50OiBEZWJ1Z05vZGUgfCBudWxsfSkucGFyZW50ID0gbnVsbDtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UoY2hpbGRJbmRleCwgMSk7XG4gICAgfVxuICB9XG5cbiAgaW5zZXJ0Q2hpbGRyZW5BZnRlcihjaGlsZDogRGVidWdOb2RlLCBuZXdDaGlsZHJlbjogRGVidWdOb2RlW10pIHtcbiAgICBjb25zdCBzaWJsaW5nSW5kZXggPSB0aGlzLmNoaWxkTm9kZXMuaW5kZXhPZihjaGlsZCk7XG4gICAgaWYgKHNpYmxpbmdJbmRleCAhPT0gLTEpIHtcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2Uoc2libGluZ0luZGV4ICsgMSwgMCwgLi4ubmV3Q2hpbGRyZW4pO1xuICAgICAgbmV3Q2hpbGRyZW4uZm9yRWFjaChjID0+IHtcbiAgICAgICAgaWYgKGMucGFyZW50KSB7XG4gICAgICAgICAgKGMucGFyZW50IGFzIERlYnVnRWxlbWVudF9fUFJFX1IzX18pLnJlbW92ZUNoaWxkKGMpO1xuICAgICAgICB9XG4gICAgICAgIChjaGlsZCBhc3twYXJlbnQ6IERlYnVnTm9kZX0pLnBhcmVudCA9IHRoaXM7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBpbnNlcnRCZWZvcmUocmVmQ2hpbGQ6IERlYnVnTm9kZSwgbmV3Q2hpbGQ6IERlYnVnTm9kZSk6IHZvaWQge1xuICAgIGNvbnN0IHJlZkluZGV4ID0gdGhpcy5jaGlsZE5vZGVzLmluZGV4T2YocmVmQ2hpbGQpO1xuICAgIGlmIChyZWZJbmRleCA9PT0gLTEpIHtcbiAgICAgIHRoaXMuYWRkQ2hpbGQobmV3Q2hpbGQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAobmV3Q2hpbGQucGFyZW50KSB7XG4gICAgICAgIChuZXdDaGlsZC5wYXJlbnQgYXMgRGVidWdFbGVtZW50X19QUkVfUjNfXykucmVtb3ZlQ2hpbGQobmV3Q2hpbGQpO1xuICAgICAgfVxuICAgICAgKG5ld0NoaWxkIGFze3BhcmVudDogRGVidWdOb2RlfSkucGFyZW50ID0gdGhpcztcbiAgICAgIHRoaXMuY2hpbGROb2Rlcy5zcGxpY2UocmVmSW5kZXgsIDAsIG5ld0NoaWxkKTtcbiAgICB9XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH1cblxuICBxdWVyeUFsbE5vZGVzKHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4pOiBEZWJ1Z05vZGVbXSB7XG4gICAgY29uc3QgbWF0Y2hlczogRGVidWdOb2RlW10gPSBbXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW4odGhpcywgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIGdldCBjaGlsZHJlbigpOiBEZWJ1Z0VsZW1lbnRbXSB7XG4gICAgcmV0dXJuIHRoaXNcbiAgICAgICAgLmNoaWxkTm9kZXMgIC8vXG4gICAgICAgIC5maWx0ZXIoKG5vZGUpID0+IG5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSBhcyBEZWJ1Z0VsZW1lbnRbXTtcbiAgfVxuXG4gIHRyaWdnZXJFdmVudEhhbmRsZXIoZXZlbnROYW1lOiBzdHJpbmcsIGV2ZW50T2JqOiBhbnkpIHtcbiAgICB0aGlzLmxpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT0gZXZlbnROYW1lKSB7XG4gICAgICAgIGxpc3RlbmVyLmNhbGxiYWNrKGV2ZW50T2JqKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzTmF0aXZlRWxlbWVudHMoZGVidWdFbHM6IERlYnVnRWxlbWVudFtdKTogYW55IHtcbiAgcmV0dXJuIGRlYnVnRWxzLm1hcCgoZWwpID0+IGVsLm5hdGl2ZUVsZW1lbnQpO1xufVxuXG5mdW5jdGlvbiBfcXVlcnlFbGVtZW50Q2hpbGRyZW4oXG4gICAgZWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+LCBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSkge1xuICBlbGVtZW50LmNoaWxkTm9kZXMuZm9yRWFjaChub2RlID0+IHtcbiAgICBpZiAobm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUFJFX1IzX18pIHtcbiAgICAgIGlmIChwcmVkaWNhdGUobm9kZSkpIHtcbiAgICAgICAgbWF0Y2hlcy5wdXNoKG5vZGUpO1xuICAgICAgfVxuICAgICAgX3F1ZXJ5RWxlbWVudENoaWxkcmVuKG5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcyk7XG4gICAgfVxuICB9KTtcbn1cblxuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuKFxuICAgIHBhcmVudE5vZGU6IERlYnVnTm9kZSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPiwgbWF0Y2hlczogRGVidWdOb2RlW10pIHtcbiAgaWYgKHBhcmVudE5vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BSRV9SM19fKSB7XG4gICAgcGFyZW50Tm9kZS5jaGlsZE5vZGVzLmZvckVhY2gobm9kZSA9PiB7XG4gICAgICBpZiAocHJlZGljYXRlKG5vZGUpKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChub2RlKTtcbiAgICAgIH1cbiAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgRGVidWdFbGVtZW50X19QUkVfUjNfXykge1xuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW4obm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxufVxuY2xhc3MgRGVidWdOb2RlX19QT1NUX1IzX18gaW1wbGVtZW50cyBEZWJ1Z05vZGUge1xuICByZWFkb25seSBuYXRpdmVOb2RlOiBOb2RlO1xuXG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IE5vZGUpIHsgdGhpcy5uYXRpdmVOb2RlID0gbmF0aXZlTm9kZTsgfVxuXG4gIGdldCBwYXJlbnQoKTogRGVidWdFbGVtZW50fG51bGwge1xuICAgIGNvbnN0IHBhcmVudCA9IHRoaXMubmF0aXZlTm9kZS5wYXJlbnROb2RlIGFzIEVsZW1lbnQ7XG4gICAgcmV0dXJuIHBhcmVudCA/IG5ldyBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyhwYXJlbnQpIDogbnVsbDtcbiAgfVxuXG4gIGdldCBpbmplY3RvcigpOiBJbmplY3RvciB7IHJldHVybiBnZXRJbmplY3Rvcih0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IGNvbXBvbmVudEluc3RhbmNlKCk6IGFueSB7XG4gICAgY29uc3QgbmF0aXZlRWxlbWVudCA9IHRoaXMubmF0aXZlTm9kZTtcbiAgICByZXR1cm4gbmF0aXZlRWxlbWVudCAmJlxuICAgICAgICAoZ2V0Q29tcG9uZW50KG5hdGl2ZUVsZW1lbnQgYXMgRWxlbWVudCkgfHwgZ2V0Vmlld0NvbXBvbmVudChuYXRpdmVFbGVtZW50KSk7XG4gIH1cbiAgZ2V0IGNvbnRleHQoKTogYW55IHtcbiAgICByZXR1cm4gZ2V0Q29tcG9uZW50KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KSB8fCBnZXRDb250ZXh0KHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50KTtcbiAgfVxuXG4gIGdldCBsaXN0ZW5lcnMoKTogRGVidWdFdmVudExpc3RlbmVyW10ge1xuICAgIHJldHVybiBnZXRMaXN0ZW5lcnModGhpcy5uYXRpdmVOb2RlIGFzIEVsZW1lbnQpLmZpbHRlcihpc0Jyb3dzZXJFdmVudHMpO1xuICB9XG5cbiAgZ2V0IHJlZmVyZW5jZXMoKToge1trZXk6IHN0cmluZ106IGFueTt9IHsgcmV0dXJuIGdldExvY2FsUmVmcyh0aGlzLm5hdGl2ZU5vZGUpOyB9XG5cbiAgZ2V0IHByb3ZpZGVyVG9rZW5zKCk6IGFueVtdIHsgcmV0dXJuIGdldEluamVjdGlvblRva2Vucyh0aGlzLm5hdGl2ZU5vZGUgYXMgRWxlbWVudCk7IH1cbn1cblxuY2xhc3MgRGVidWdFbGVtZW50X19QT1NUX1IzX18gZXh0ZW5kcyBEZWJ1Z05vZGVfX1BPU1RfUjNfXyBpbXBsZW1lbnRzIERlYnVnRWxlbWVudCB7XG4gIGNvbnN0cnVjdG9yKG5hdGl2ZU5vZGU6IEVsZW1lbnQpIHtcbiAgICBuZ0Rldk1vZGUgJiYgYXNzZXJ0RG9tTm9kZShuYXRpdmVOb2RlKTtcbiAgICBzdXBlcihuYXRpdmVOb2RlKTtcbiAgfVxuXG4gIGdldCBuYXRpdmVFbGVtZW50KCk6IEVsZW1lbnR8bnVsbCB7XG4gICAgcmV0dXJuIHRoaXMubmF0aXZlTm9kZS5ub2RlVHlwZSA9PSBOb2RlLkVMRU1FTlRfTk9ERSA/IHRoaXMubmF0aXZlTm9kZSBhcyBFbGVtZW50IDogbnVsbDtcbiAgfVxuXG4gIGdldCBuYW1lKCk6IHN0cmluZyB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlKSAhO1xuICAgICAgY29uc3QgbFZpZXcgPSBjb250ZXh0LmxWaWV3O1xuICAgICAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuICAgICAgcmV0dXJuIHROb2RlLnRhZ05hbWUgITtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICByZXR1cm4gdGhpcy5uYXRpdmVOb2RlLm5vZGVOYW1lO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiAgR2V0cyBhIG1hcCBvZiBwcm9wZXJ0eSBuYW1lcyB0byBwcm9wZXJ0eSB2YWx1ZXMgZm9yIGFuIGVsZW1lbnQuXG4gICAqXG4gICAqICBUaGlzIG1hcCBpbmNsdWRlczpcbiAgICogIC0gUmVndWxhciBwcm9wZXJ0eSBiaW5kaW5ncyAoZS5nLiBgW2lkXT1cImlkXCJgKVxuICAgKiAgLSBIb3N0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBob3N0OiB7ICdbaWRdJzogXCJpZFwiIH1gKVxuICAgKiAgLSBJbnRlcnBvbGF0ZWQgcHJvcGVydHkgYmluZGluZ3MgKGUuZy4gYGlkPVwie3sgdmFsdWUgfX1cIilcbiAgICpcbiAgICogIEl0IGRvZXMgbm90IGluY2x1ZGU6XG4gICAqICAtIGlucHV0IHByb3BlcnR5IGJpbmRpbmdzIChlLmcuIGBbbXlDdXN0b21JbnB1dF09XCJ2YWx1ZVwiYClcbiAgICogIC0gYXR0cmlidXRlIGJpbmRpbmdzIChlLmcuIGBbYXR0ci5yb2xlXT1cIm1lbnVcImApXG4gICAqL1xuICBnZXQgcHJvcGVydGllcygpOiB7W2tleTogc3RyaW5nXTogYW55O30ge1xuICAgIGNvbnN0IGNvbnRleHQgPSBsb2FkTENvbnRleHQodGhpcy5uYXRpdmVOb2RlLCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0RGF0YSA9IGxWaWV3W1RWSUVXXS5kYXRhO1xuICAgIGNvbnN0IHROb2RlID0gdERhdGFbY29udGV4dC5ub2RlSW5kZXhdIGFzIFROb2RlO1xuXG4gICAgY29uc3QgcHJvcGVydGllcyA9IGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKHROb2RlLCBsVmlldywgdERhdGEpO1xuICAgIGNvbnN0IGNsYXNzTmFtZSA9IGNvbGxlY3RDbGFzc05hbWVzKHRoaXMpO1xuXG4gICAgaWYgKGNsYXNzTmFtZSkge1xuICAgICAgcHJvcGVydGllc1snY2xhc3NOYW1lJ10gPVxuICAgICAgICAgIHByb3BlcnRpZXNbJ2NsYXNzTmFtZSddID8gcHJvcGVydGllc1snY2xhc3NOYW1lJ10gKyBgICR7Y2xhc3NOYW1lfWAgOiBjbGFzc05hbWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIHByb3BlcnRpZXM7XG4gIH1cblxuICBnZXQgYXR0cmlidXRlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICBjb25zdCBhdHRyaWJ1dGVzOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9ID0ge307XG4gICAgY29uc3QgZWxlbWVudCA9IHRoaXMubmF0aXZlRWxlbWVudDtcblxuICAgIGlmICghZWxlbWVudCkge1xuICAgICAgcmV0dXJuIGF0dHJpYnV0ZXM7XG4gICAgfVxuXG4gICAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gICAgaWYgKGNvbnRleHQgPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHt9O1xuICAgIH1cblxuICAgIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgICBjb25zdCB0Tm9kZUF0dHJzID0gKGxWaWV3W1RWSUVXXS5kYXRhW2NvbnRleHQubm9kZUluZGV4XSBhcyBUTm9kZSkuYXR0cnM7XG4gICAgY29uc3QgbG93ZXJjYXNlVE5vZGVBdHRyczogc3RyaW5nW10gPSBbXTtcblxuICAgIC8vIEZvciBkZWJ1ZyBub2RlcyB3ZSB0YWtlIHRoZSBlbGVtZW50J3MgYXR0cmlidXRlIGRpcmVjdGx5IGZyb20gdGhlIERPTSBzaW5jZSBpdCBhbGxvd3MgdXNcbiAgICAvLyB0byBhY2NvdW50IGZvciBvbmVzIHRoYXQgd2VyZW4ndCBzZXQgdmlhIGJpbmRpbmdzIChlLmcuIFZpZXdFbmdpbmUga2VlcHMgdHJhY2sgb2YgdGhlIG9uZXNcbiAgICAvLyB0aGF0IGFyZSBzZXQgdGhyb3VnaCBgUmVuZGVyZXIyYCkuIFRoZSBwcm9ibGVtIGlzIHRoYXQgdGhlIGJyb3dzZXIgd2lsbCBsb3dlcmNhc2UgYWxsIG5hbWVzLFxuICAgIC8vIGhvd2V2ZXIgc2luY2Ugd2UgaGF2ZSB0aGUgYXR0cmlidXRlcyBhbHJlYWR5IG9uIHRoZSBUTm9kZSwgd2UgY2FuIHByZXNlcnZlIHRoZSBjYXNlIGJ5IGdvaW5nXG4gICAgLy8gdGhyb3VnaCB0aGVtIG9uY2UsIGFkZGluZyB0aGVtIHRvIHRoZSBgYXR0cmlidXRlc2AgbWFwIGFuZCBwdXR0aW5nIHRoZWlyIGxvd2VyLWNhc2VkIG5hbWVcbiAgICAvLyBpbnRvIGFuIGFycmF5LiBBZnRlcndhcmRzIHdoZW4gd2UncmUgZ29pbmcgdGhyb3VnaCB0aGUgbmF0aXZlIERPTSBhdHRyaWJ1dGVzLCB3ZSBjYW4gY2hlY2tcbiAgICAvLyB3aGV0aGVyIHdlIGhhdmVuJ3QgcnVuIGludG8gYW4gYXR0cmlidXRlIGFscmVhZHkgdGhyb3VnaCB0aGUgVE5vZGUuXG4gICAgaWYgKHROb2RlQXR0cnMpIHtcbiAgICAgIGxldCBpID0gMDtcbiAgICAgIHdoaWxlIChpIDwgdE5vZGVBdHRycy5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgYXR0ck5hbWUgPSB0Tm9kZUF0dHJzW2ldO1xuXG4gICAgICAgIC8vIFN0b3AgYXMgc29vbiBhcyB3ZSBoaXQgYSBtYXJrZXIuIFdlIG9ubHkgY2FyZSBhYm91dCB0aGUgcmVndWxhciBhdHRyaWJ1dGVzLiBFdmVyeXRoaW5nXG4gICAgICAgIC8vIGVsc2Ugd2lsbCBiZSBoYW5kbGVkIGJlbG93IHdoZW4gd2UgcmVhZCB0aGUgZmluYWwgYXR0cmlidXRlcyBvZmYgdGhlIERPTS5cbiAgICAgICAgaWYgKHR5cGVvZiBhdHRyTmFtZSAhPT0gJ3N0cmluZycpIGJyZWFrO1xuXG4gICAgICAgIGNvbnN0IGF0dHJWYWx1ZSA9IHROb2RlQXR0cnNbaSArIDFdO1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHJOYW1lXSA9IGF0dHJWYWx1ZSBhcyBzdHJpbmc7XG4gICAgICAgIGxvd2VyY2FzZVROb2RlQXR0cnMucHVzaChhdHRyTmFtZS50b0xvd2VyQ2FzZSgpKTtcblxuICAgICAgICBpICs9IDI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgZUF0dHJzID0gZWxlbWVudC5hdHRyaWJ1dGVzO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZUF0dHJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBhdHRyID0gZUF0dHJzW2ldO1xuICAgICAgLy8gTWFrZSBzdXJlIHRoYXQgd2UgZG9uJ3QgYXNzaWduIHRoZSBzYW1lIGF0dHJpYnV0ZSBib3RoIGluIGl0c1xuICAgICAgLy8gY2FzZS1zZW5zaXRpdmUgZm9ybSBhbmQgdGhlIGxvd2VyLWNhc2VkIG9uZSBmcm9tIHRoZSBicm93c2VyLlxuICAgICAgaWYgKGxvd2VyY2FzZVROb2RlQXR0cnMuaW5kZXhPZihhdHRyLm5hbWUpID09PSAtMSkge1xuICAgICAgICBhdHRyaWJ1dGVzW2F0dHIubmFtZV0gPSBhdHRyLnZhbHVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBhdHRyaWJ1dGVzO1xuICB9XG5cbiAgZ2V0IHN0eWxlcygpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nIHwgbnVsbDt9IHtcbiAgICByZXR1cm4gX2dldFN0eWxpbmdEZWJ1Z0luZm8odGhpcy5uYXRpdmVFbGVtZW50LCBmYWxzZSk7XG4gIH1cblxuICBnZXQgY2xhc3NlcygpOiB7W2tleTogc3RyaW5nXTogYm9vbGVhbjt9IHtcbiAgICByZXR1cm4gX2dldFN0eWxpbmdEZWJ1Z0luZm8odGhpcy5uYXRpdmVFbGVtZW50LCB0cnVlKTtcbiAgfVxuXG4gIGdldCBjaGlsZE5vZGVzKCk6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBjaGlsZE5vZGVzID0gdGhpcy5uYXRpdmVOb2RlLmNoaWxkTm9kZXM7XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnTm9kZVtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBnZXQgY2hpbGRyZW4oKTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG5hdGl2ZUVsZW1lbnQgPSB0aGlzLm5hdGl2ZUVsZW1lbnQ7XG4gICAgaWYgKCFuYXRpdmVFbGVtZW50KSByZXR1cm4gW107XG4gICAgY29uc3QgY2hpbGROb2RlcyA9IG5hdGl2ZUVsZW1lbnQuY2hpbGRyZW47XG4gICAgY29uc3QgY2hpbGRyZW46IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjaGlsZE5vZGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gY2hpbGROb2Rlc1tpXTtcbiAgICAgIGNoaWxkcmVuLnB1c2goZ2V0RGVidWdOb2RlX19QT1NUX1IzX18oZWxlbWVudCkpO1xuICAgIH1cbiAgICByZXR1cm4gY2hpbGRyZW47XG4gIH1cblxuICBxdWVyeShwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50IHtcbiAgICBjb25zdCByZXN1bHRzID0gdGhpcy5xdWVyeUFsbChwcmVkaWNhdGUpO1xuICAgIHJldHVybiByZXN1bHRzWzBdIHx8IG51bGw7XG4gIH1cblxuICBxdWVyeUFsbChwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+KTogRGVidWdFbGVtZW50W10ge1xuICAgIGNvbnN0IG1hdGNoZXM6IERlYnVnRWxlbWVudFtdID0gW107XG4gICAgX3F1ZXJ5QWxsUjModGhpcywgcHJlZGljYXRlLCBtYXRjaGVzLCB0cnVlKTtcbiAgICByZXR1cm4gbWF0Y2hlcztcbiAgfVxuXG4gIHF1ZXJ5QWxsTm9kZXMocHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdOb2RlPik6IERlYnVnTm9kZVtdIHtcbiAgICBjb25zdCBtYXRjaGVzOiBEZWJ1Z05vZGVbXSA9IFtdO1xuICAgIF9xdWVyeUFsbFIzKHRoaXMsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZmFsc2UpO1xuICAgIHJldHVybiBtYXRjaGVzO1xuICB9XG5cbiAgdHJpZ2dlckV2ZW50SGFuZGxlcihldmVudE5hbWU6IHN0cmluZywgZXZlbnRPYmo6IGFueSk6IHZvaWQge1xuICAgIGNvbnN0IG5vZGUgPSB0aGlzLm5hdGl2ZU5vZGUgYXMgYW55O1xuICAgIGNvbnN0IGludm9rZWRMaXN0ZW5lcnM6IEZ1bmN0aW9uW10gPSBbXTtcblxuICAgIHRoaXMubGlzdGVuZXJzLmZvckVhY2gobGlzdGVuZXIgPT4ge1xuICAgICAgaWYgKGxpc3RlbmVyLm5hbWUgPT09IGV2ZW50TmFtZSkge1xuICAgICAgICBjb25zdCBjYWxsYmFjayA9IGxpc3RlbmVyLmNhbGxiYWNrO1xuICAgICAgICBjYWxsYmFjayhldmVudE9iaik7XG4gICAgICAgIGludm9rZWRMaXN0ZW5lcnMucHVzaChjYWxsYmFjayk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBXZSBuZWVkIHRvIGNoZWNrIHdoZXRoZXIgYGV2ZW50TGlzdGVuZXJzYCBleGlzdHMsIGJlY2F1c2UgaXQncyBzb21ldGhpbmdcbiAgICAvLyB0aGF0IFpvbmUuanMgb25seSBhZGRzIHRvIGBFdmVudFRhcmdldGAgaW4gYnJvd3NlciBlbnZpcm9ubWVudHMuXG4gICAgaWYgKHR5cGVvZiBub2RlLmV2ZW50TGlzdGVuZXJzID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAvLyBOb3RlIHRoYXQgaW4gSXZ5IHdlIHdyYXAgZXZlbnQgbGlzdGVuZXJzIHdpdGggYSBjYWxsIHRvIGBldmVudC5wcmV2ZW50RGVmYXVsdGAgaW4gc29tZVxuICAgICAgLy8gY2FzZXMuIFdlIHVzZSBgRnVuY3Rpb25gIGFzIGEgc3BlY2lhbCB0b2tlbiB0aGF0IGdpdmVzIHVzIGFjY2VzcyB0byB0aGUgYWN0dWFsIGV2ZW50XG4gICAgICAvLyBsaXN0ZW5lci5cbiAgICAgIG5vZGUuZXZlbnRMaXN0ZW5lcnMoZXZlbnROYW1lKS5mb3JFYWNoKChsaXN0ZW5lcjogRnVuY3Rpb24pID0+IHtcbiAgICAgICAgY29uc3QgdW53cmFwcGVkTGlzdGVuZXIgPSBsaXN0ZW5lcihGdW5jdGlvbik7XG4gICAgICAgIHJldHVybiBpbnZva2VkTGlzdGVuZXJzLmluZGV4T2YodW53cmFwcGVkTGlzdGVuZXIpID09PSAtMSAmJiB1bndyYXBwZWRMaXN0ZW5lcihldmVudE9iaik7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gX2dldFN0eWxpbmdEZWJ1Z0luZm8oZWxlbWVudDogYW55LCBpc0NsYXNzQmFzZWQ6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChlbGVtZW50LCBmYWxzZSk7XG4gIGlmICghY29udGV4dCkge1xuICAgIHJldHVybiB7fTtcbiAgfVxuXG4gIGNvbnN0IGxWaWV3ID0gY29udGV4dC5sVmlldztcbiAgY29uc3QgdERhdGEgPSBsVmlld1tUVklFV10uZGF0YTtcbiAgY29uc3QgdE5vZGUgPSB0RGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIGlmIChpc0NsYXNzQmFzZWQpIHtcbiAgICByZXR1cm4gaXNTdHlsaW5nQ29udGV4dCh0Tm9kZS5jbGFzc2VzKSA/XG4gICAgICAgIG5ldyBOb2RlU3R5bGluZ0RlYnVnKHROb2RlLmNsYXNzZXMgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldywgdHJ1ZSkudmFsdWVzIDpcbiAgICAgICAgc3R5bGluZ01hcFRvU3RyaW5nTWFwKHROb2RlLmNsYXNzZXMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBpc1N0eWxpbmdDb250ZXh0KHROb2RlLnN0eWxlcykgP1xuICAgICAgICBuZXcgTm9kZVN0eWxpbmdEZWJ1Zyh0Tm9kZS5zdHlsZXMgYXMgVFN0eWxpbmdDb250ZXh0LCBsVmlldywgZmFsc2UpLnZhbHVlcyA6XG4gICAgICAgIHN0eWxpbmdNYXBUb1N0cmluZ01hcCh0Tm9kZS5zdHlsZXMpO1xuICB9XG59XG5cbi8qKlxuICogV2FsayB0aGUgVE5vZGUgdHJlZSB0byBmaW5kIG1hdGNoZXMgZm9yIHRoZSBwcmVkaWNhdGUuXG4gKlxuICogQHBhcmFtIHBhcmVudEVsZW1lbnQgdGhlIGVsZW1lbnQgZnJvbSB3aGljaCB0aGUgd2FsayBpcyBzdGFydGVkXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD4sIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdLFxuICAgIGVsZW1lbnRzT25seTogdHJ1ZSk6IHZvaWQ7XG5mdW5jdGlvbiBfcXVlcnlBbGxSMyhcbiAgICBwYXJlbnRFbGVtZW50OiBEZWJ1Z0VsZW1lbnQsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnTm9kZT4sIG1hdGNoZXM6IERlYnVnTm9kZVtdLFxuICAgIGVsZW1lbnRzT25seTogZmFsc2UpOiB2b2lkO1xuZnVuY3Rpb24gX3F1ZXJ5QWxsUjMoXG4gICAgcGFyZW50RWxlbWVudDogRGVidWdFbGVtZW50LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4pIHtcbiAgY29uc3QgY29udGV4dCA9IGxvYWRMQ29udGV4dChwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpICE7XG4gIGNvbnN0IHBhcmVudFROb2RlID0gY29udGV4dC5sVmlld1tUVklFV10uZGF0YVtjb250ZXh0Lm5vZGVJbmRleF0gYXMgVE5vZGU7XG4gIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgcGFyZW50VE5vZGUsIGNvbnRleHQubFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCBwYXJlbnRFbGVtZW50Lm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIFJlY3Vyc2l2ZWx5IG1hdGNoIHRoZSBjdXJyZW50IFROb2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZSwgYW5kIGdvZXMgb24gd2l0aCB0aGUgbmV4dCBvbmVzLlxuICpcbiAqIEBwYXJhbSB0Tm9kZSB0aGUgY3VycmVudCBUTm9kZVxuICogQHBhcmFtIGxWaWV3IHRoZSBMVmlldyBvZiB0aGlzIFROb2RlXG4gKiBAcGFyYW0gcHJlZGljYXRlIHRoZSBwcmVkaWNhdGUgdG8gbWF0Y2hcbiAqIEBwYXJhbSBtYXRjaGVzIHRoZSBsaXN0IG9mIHBvc2l0aXZlIG1hdGNoZXNcbiAqIEBwYXJhbSBlbGVtZW50c09ubHkgd2hldGhlciBvbmx5IGVsZW1lbnRzIHNob3VsZCBiZSBzZWFyY2hlZFxuICogQHBhcmFtIHJvb3ROYXRpdmVOb2RlIHRoZSByb290IG5hdGl2ZSBub2RlIG9uIHdoaWNoIHByZWRpY2F0ZSBzaG91bGQgbm90IGJlIG1hdGNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMoXG4gICAgdE5vZGU6IFROb2RlLCBsVmlldzogTFZpZXcsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBjb25zdCBuYXRpdmVOb2RlID0gZ2V0TmF0aXZlQnlUTm9kZU9yTnVsbCh0Tm9kZSwgbFZpZXcpO1xuICAvLyBGb3IgZWFjaCB0eXBlIG9mIFROb2RlLCBzcGVjaWZpYyBsb2dpYyBpcyBleGVjdXRlZC5cbiAgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50IHx8IHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5FbGVtZW50Q29udGFpbmVyKSB7XG4gICAgLy8gQ2FzZSAxOiB0aGUgVE5vZGUgaXMgYW4gZWxlbWVudFxuICAgIC8vIFRoZSBuYXRpdmUgbm9kZSBoYXMgdG8gYmUgY2hlY2tlZC5cbiAgICBfYWRkUXVlcnlNYXRjaFIzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgaWYgKGlzQ29tcG9uZW50KHROb2RlKSkge1xuICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgaXMgdGhlIGhvc3Qgb2YgYSBjb21wb25lbnQsIHRoZW4gYWxsIG5vZGVzIGluIGl0cyB2aWV3IGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgLy8gTm90ZTogdGhlIGNvbXBvbmVudCdzIGNvbnRlbnQgKHROb2RlLmNoaWxkKSB3aWxsIGJlIHByb2Nlc3NlZCBmcm9tIHRoZSBpbnNlcnRpb24gcG9pbnRzLlxuICAgICAgY29uc3QgY29tcG9uZW50VmlldyA9IGdldENvbXBvbmVudFZpZXdCeUluZGV4KHROb2RlLmluZGV4LCBsVmlldyk7XG4gICAgICBpZiAoY29tcG9uZW50VmlldyAmJiBjb21wb25lbnRWaWV3W1RWSUVXXS5maXJzdENoaWxkKSB7XG4gICAgICAgIF9xdWVyeU5vZGVDaGlsZHJlblIzKFxuICAgICAgICAgICAgY29tcG9uZW50Vmlld1tUVklFV10uZmlyc3RDaGlsZCAhLCBjb21wb25lbnRWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSxcbiAgICAgICAgICAgIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHROb2RlLmNoaWxkKSB7XG4gICAgICAgIC8vIE90aGVyd2lzZSwgaXRzIGNoaWxkcmVuIGhhdmUgdG8gYmUgcHJvY2Vzc2VkLlxuICAgICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyh0Tm9kZS5jaGlsZCwgbFZpZXcsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIFdlIGFsc28gaGF2ZSB0byBxdWVyeSB0aGUgRE9NIGRpcmVjdGx5IGluIG9yZGVyIHRvIGNhdGNoIGVsZW1lbnRzIGluc2VydGVkIHRocm91Z2hcbiAgICAgIC8vIFJlbmRlcmVyMi4gTm90ZSB0aGF0IHRoaXMgaXMgX19ub3RfXyBvcHRpbWFsLCBiZWNhdXNlIHdlJ3JlIHdhbGtpbmcgc2ltaWxhciB0cmVlcyBtdWx0aXBsZVxuICAgICAgLy8gdGltZXMuIFZpZXdFbmdpbmUgY291bGQgZG8gaXQgbW9yZSBlZmZpY2llbnRseSwgYmVjYXVzZSBhbGwgdGhlIGluc2VydGlvbnMgZ28gdGhyb3VnaFxuICAgICAgLy8gUmVuZGVyZXIyLCBob3dldmVyIHRoYXQncyBub3QgdGhlIGNhc2UgaW4gSXZ5LiBUaGlzIGFwcHJvYWNoIGlzIGJlaW5nIHVzZWQgYmVjYXVzZTpcbiAgICAgIC8vIDEuIE1hdGNoaW5nIHRoZSBWaWV3RW5naW5lIGJlaGF2aW9yIHdvdWxkIG1lYW4gcG90ZW50aWFsbHkgaW50cm9kdWNpbmcgYSBkZXBlZGVuY3lcbiAgICAgIC8vICAgIGZyb20gYFJlbmRlcmVyMmAgdG8gSXZ5IHdoaWNoIGNvdWxkIGJyaW5nIEl2eSBjb2RlIGludG8gVmlld0VuZ2luZS5cbiAgICAgIC8vIDIuIFdlIHdvdWxkIGhhdmUgdG8gbWFrZSBgUmVuZGVyZXIzYCBcImtub3dcIiBhYm91dCBkZWJ1ZyBub2Rlcy5cbiAgICAgIC8vIDMuIEl0IGFsbG93cyB1cyB0byBjYXB0dXJlIG5vZGVzIHRoYXQgd2VyZSBpbnNlcnRlZCBkaXJlY3RseSB2aWEgdGhlIERPTS5cbiAgICAgIG5hdGl2ZU5vZGUgJiYgX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKG5hdGl2ZU5vZGUsIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5KTtcbiAgICB9XG4gICAgLy8gSW4gYWxsIGNhc2VzLCBpZiBhIGR5bmFtaWMgY29udGFpbmVyIGV4aXN0cyBmb3IgdGhpcyBub2RlLCBlYWNoIHZpZXcgaW5zaWRlIGl0IGhhcyB0byBiZVxuICAgIC8vIHByb2Nlc3NlZC5cbiAgICBjb25zdCBub2RlT3JDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgaWYgKGlzTENvbnRhaW5lcihub2RlT3JDb250YWluZXIpKSB7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgICAgICAgIG5vZGVPckNvbnRhaW5lciwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUudHlwZSA9PT0gVE5vZGVUeXBlLkNvbnRhaW5lcikge1xuICAgIC8vIENhc2UgMjogdGhlIFROb2RlIGlzIGEgY29udGFpbmVyXG4gICAgLy8gVGhlIG5hdGl2ZSBub2RlIGhhcyB0byBiZSBjaGVja2VkLlxuICAgIGNvbnN0IGxDb250YWluZXIgPSBsVmlld1t0Tm9kZS5pbmRleF07XG4gICAgX2FkZFF1ZXJ5TWF0Y2hSMyhsQ29udGFpbmVyW05BVElWRV0sIHByZWRpY2F0ZSwgbWF0Y2hlcywgZWxlbWVudHNPbmx5LCByb290TmF0aXZlTm9kZSk7XG4gICAgLy8gRWFjaCB2aWV3IGluc2lkZSB0aGUgY29udGFpbmVyIGhhcyB0byBiZSBwcm9jZXNzZWQuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuSW5Db250YWluZXJSMyhsQ29udGFpbmVyLCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9IGVsc2UgaWYgKHROb2RlLnR5cGUgPT09IFROb2RlVHlwZS5Qcm9qZWN0aW9uKSB7XG4gICAgLy8gQ2FzZSAzOiB0aGUgVE5vZGUgaXMgYSBwcm9qZWN0aW9uIGluc2VydGlvbiBwb2ludCAoaS5lLiBhIDxuZy1jb250ZW50PikuXG4gICAgLy8gVGhlIG5vZGVzIHByb2plY3RlZCBhdCB0aGlzIGxvY2F0aW9uIGFsbCBuZWVkIHRvIGJlIHByb2Nlc3NlZC5cbiAgICBjb25zdCBjb21wb25lbnRWaWV3ID0gZmluZENvbXBvbmVudFZpZXcobFZpZXcgISk7XG4gICAgY29uc3QgY29tcG9uZW50SG9zdCA9IGNvbXBvbmVudFZpZXdbVF9IT1NUXSBhcyBURWxlbWVudE5vZGU7XG4gICAgY29uc3QgaGVhZDogVE5vZGV8bnVsbCA9XG4gICAgICAgIChjb21wb25lbnRIb3N0LnByb2plY3Rpb24gYXMoVE5vZGUgfCBudWxsKVtdKVt0Tm9kZS5wcm9qZWN0aW9uIGFzIG51bWJlcl07XG5cbiAgICBpZiAoQXJyYXkuaXNBcnJheShoZWFkKSkge1xuICAgICAgZm9yIChsZXQgbmF0aXZlTm9kZSBvZiBoZWFkKSB7XG4gICAgICAgIF9hZGRRdWVyeU1hdGNoUjMobmF0aXZlTm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGhlYWQpIHtcbiAgICAgIGNvbnN0IG5leHRMVmlldyA9IGNvbXBvbmVudFZpZXdbUEFSRU5UXSAhYXMgTFZpZXc7XG4gICAgICBjb25zdCBuZXh0VE5vZGUgPSBuZXh0TFZpZXdbVFZJRVddLmRhdGFbaGVhZC5pbmRleF0gYXMgVE5vZGU7XG4gICAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhuZXh0VE5vZGUsIG5leHRMVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAodE5vZGUuY2hpbGQpIHtcbiAgICAvLyBDYXNlIDQ6IHRoZSBUTm9kZSBpcyBhIHZpZXcuXG4gICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjModE5vZGUuY2hpbGQsIGxWaWV3LCBwcmVkaWNhdGUsIG1hdGNoZXMsIGVsZW1lbnRzT25seSwgcm9vdE5hdGl2ZU5vZGUpO1xuICB9XG5cbiAgLy8gV2UgZG9uJ3Qgd2FudCB0byBnbyB0byB0aGUgbmV4dCBzaWJsaW5nIG9mIHRoZSByb290IG5vZGUuXG4gIGlmIChyb290TmF0aXZlTm9kZSAhPT0gbmF0aXZlTm9kZSkge1xuICAgIC8vIFRvIGRldGVybWluZSB0aGUgbmV4dCBub2RlIHRvIGJlIHByb2Nlc3NlZCwgd2UgbmVlZCB0byB1c2UgdGhlIG5leHQgb3IgdGhlIHByb2plY3Rpb25OZXh0XG4gICAgLy8gbGluaywgZGVwZW5kaW5nIG9uIHdoZXRoZXIgdGhlIGN1cnJlbnQgbm9kZSBoYXMgYmVlbiBwcm9qZWN0ZWQuXG4gICAgY29uc3QgbmV4dFROb2RlID0gKHROb2RlLmZsYWdzICYgVE5vZGVGbGFncy5pc1Byb2plY3RlZCkgPyB0Tm9kZS5wcm9qZWN0aW9uTmV4dCA6IHROb2RlLm5leHQ7XG4gICAgaWYgKG5leHRUTm9kZSkge1xuICAgICAgX3F1ZXJ5Tm9kZUNoaWxkcmVuUjMobmV4dFROb2RlLCBsVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBQcm9jZXNzIGFsbCBUTm9kZXMgaW4gYSBnaXZlbiBjb250YWluZXIuXG4gKlxuICogQHBhcmFtIGxDb250YWluZXIgdGhlIGNvbnRhaW5lciB0byBiZSBwcm9jZXNzZWRcbiAqIEBwYXJhbSBwcmVkaWNhdGUgdGhlIHByZWRpY2F0ZSB0byBtYXRjaFxuICogQHBhcmFtIG1hdGNoZXMgdGhlIGxpc3Qgb2YgcG9zaXRpdmUgbWF0Y2hlc1xuICogQHBhcmFtIGVsZW1lbnRzT25seSB3aGV0aGVyIG9ubHkgZWxlbWVudHMgc2hvdWxkIGJlIHNlYXJjaGVkXG4gKiBAcGFyYW0gcm9vdE5hdGl2ZU5vZGUgdGhlIHJvb3QgbmF0aXZlIG5vZGUgb24gd2hpY2ggcHJlZGljYXRlIHNob3VsZCBub3QgYmUgbWF0Y2hlZFxuICovXG5mdW5jdGlvbiBfcXVlcnlOb2RlQ2hpbGRyZW5JbkNvbnRhaW5lclIzKFxuICAgIGxDb250YWluZXI6IExDb250YWluZXIsIHByZWRpY2F0ZTogUHJlZGljYXRlPERlYnVnRWxlbWVudD58IFByZWRpY2F0ZTxEZWJ1Z05vZGU+LFxuICAgIG1hdGNoZXM6IERlYnVnRWxlbWVudFtdIHwgRGVidWdOb2RlW10sIGVsZW1lbnRzT25seTogYm9vbGVhbiwgcm9vdE5hdGl2ZU5vZGU6IGFueSkge1xuICBmb3IgKGxldCBpID0gQ09OVEFJTkVSX0hFQURFUl9PRkZTRVQ7IGkgPCBsQ29udGFpbmVyLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGRWaWV3ID0gbENvbnRhaW5lcltpXTtcbiAgICBfcXVlcnlOb2RlQ2hpbGRyZW5SMyhcbiAgICAgICAgY2hpbGRWaWV3W1RWSUVXXS5ub2RlICEsIGNoaWxkVmlldywgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHksIHJvb3ROYXRpdmVOb2RlKTtcbiAgfVxufVxuXG4vKipcbiAqIE1hdGNoIHRoZSBjdXJyZW50IG5hdGl2ZSBub2RlIGFnYWluc3QgdGhlIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqIEBwYXJhbSByb290TmF0aXZlTm9kZSB0aGUgcm9vdCBuYXRpdmUgbm9kZSBvbiB3aGljaCBwcmVkaWNhdGUgc2hvdWxkIG5vdCBiZSBtYXRjaGVkXG4gKi9cbmZ1bmN0aW9uIF9hZGRRdWVyeU1hdGNoUjMoXG4gICAgbmF0aXZlTm9kZTogYW55LCBwcmVkaWNhdGU6IFByZWRpY2F0ZTxEZWJ1Z0VsZW1lbnQ+fCBQcmVkaWNhdGU8RGVidWdOb2RlPixcbiAgICBtYXRjaGVzOiBEZWJ1Z0VsZW1lbnRbXSB8IERlYnVnTm9kZVtdLCBlbGVtZW50c09ubHk6IGJvb2xlYW4sIHJvb3ROYXRpdmVOb2RlOiBhbnkpIHtcbiAgaWYgKHJvb3ROYXRpdmVOb2RlICE9PSBuYXRpdmVOb2RlKSB7XG4gICAgY29uc3QgZGVidWdOb2RlID0gZ2V0RGVidWdOb2RlKG5hdGl2ZU5vZGUpO1xuICAgIGlmICghZGVidWdOb2RlKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIFR5cGUgb2YgdGhlIFwicHJlZGljYXRlIGFuZCBcIm1hdGNoZXNcIiBhcnJheSBhcmUgc2V0IGJhc2VkIG9uIHRoZSB2YWx1ZSBvZlxuICAgIC8vIHRoZSBcImVsZW1lbnRzT25seVwiIHBhcmFtZXRlci4gVHlwZVNjcmlwdCBpcyBub3QgYWJsZSB0byBwcm9wZXJseSBpbmZlciB0aGVzZVxuICAgIC8vIHR5cGVzIHdpdGggZ2VuZXJpY3MsIHNvIHdlIG1hbnVhbGx5IGNhc3QgdGhlIHBhcmFtZXRlcnMgYWNjb3JkaW5nbHkuXG4gICAgaWYgKGVsZW1lbnRzT25seSAmJiBkZWJ1Z05vZGUgaW5zdGFuY2VvZiBEZWJ1Z0VsZW1lbnRfX1BPU1RfUjNfXyAmJiBwcmVkaWNhdGUoZGVidWdOb2RlKSAmJlxuICAgICAgICBtYXRjaGVzLmluZGV4T2YoZGVidWdOb2RlKSA9PT0gLTEpIHtcbiAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICFlbGVtZW50c09ubHkgJiYgKHByZWRpY2F0ZSBhcyBQcmVkaWNhdGU8RGVidWdOb2RlPikoZGVidWdOb2RlKSAmJlxuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgKG1hdGNoZXMgYXMgRGVidWdOb2RlW10pLnB1c2goZGVidWdOb2RlKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBNYXRjaCBhbGwgdGhlIGRlc2NlbmRhbnRzIG9mIGEgRE9NIG5vZGUgYWdhaW5zdCBhIHByZWRpY2F0ZS5cbiAqXG4gKiBAcGFyYW0gbmF0aXZlTm9kZSB0aGUgY3VycmVudCBuYXRpdmUgbm9kZVxuICogQHBhcmFtIHByZWRpY2F0ZSB0aGUgcHJlZGljYXRlIHRvIG1hdGNoXG4gKiBAcGFyYW0gbWF0Y2hlcyB0aGUgbGlzdCBvZiBwb3NpdGl2ZSBtYXRjaGVzXG4gKiBAcGFyYW0gZWxlbWVudHNPbmx5IHdoZXRoZXIgb25seSBlbGVtZW50cyBzaG91bGQgYmUgc2VhcmNoZWRcbiAqL1xuZnVuY3Rpb24gX3F1ZXJ5TmF0aXZlTm9kZURlc2NlbmRhbnRzKFxuICAgIHBhcmVudE5vZGU6IGFueSwgcHJlZGljYXRlOiBQcmVkaWNhdGU8RGVidWdFbGVtZW50PnwgUHJlZGljYXRlPERlYnVnTm9kZT4sXG4gICAgbWF0Y2hlczogRGVidWdFbGVtZW50W10gfCBEZWJ1Z05vZGVbXSwgZWxlbWVudHNPbmx5OiBib29sZWFuKSB7XG4gIGNvbnN0IG5vZGVzID0gcGFyZW50Tm9kZS5jaGlsZE5vZGVzO1xuICBjb25zdCBsZW5ndGggPSBub2Rlcy5sZW5ndGg7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IG5vZGUgPSBub2Rlc1tpXTtcbiAgICBjb25zdCBkZWJ1Z05vZGUgPSBnZXREZWJ1Z05vZGUobm9kZSk7XG5cbiAgICBpZiAoZGVidWdOb2RlKSB7XG4gICAgICBpZiAoZWxlbWVudHNPbmx5ICYmIGRlYnVnTm9kZSBpbnN0YW5jZW9mIERlYnVnRWxlbWVudF9fUE9TVF9SM19fICYmIHByZWRpY2F0ZShkZWJ1Z05vZGUpICYmXG4gICAgICAgICAgbWF0Y2hlcy5pbmRleE9mKGRlYnVnTm9kZSkgPT09IC0xKSB7XG4gICAgICAgIG1hdGNoZXMucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAhZWxlbWVudHNPbmx5ICYmIChwcmVkaWNhdGUgYXMgUHJlZGljYXRlPERlYnVnTm9kZT4pKGRlYnVnTm9kZSkgJiZcbiAgICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkuaW5kZXhPZihkZWJ1Z05vZGUpID09PSAtMSkge1xuICAgICAgICAobWF0Y2hlcyBhcyBEZWJ1Z05vZGVbXSkucHVzaChkZWJ1Z05vZGUpO1xuICAgICAgfVxuXG4gICAgICBfcXVlcnlOYXRpdmVOb2RlRGVzY2VuZGFudHMobm9kZSwgcHJlZGljYXRlLCBtYXRjaGVzLCBlbGVtZW50c09ubHkpO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEl0ZXJhdGVzIHRocm91Z2ggdGhlIHByb3BlcnR5IGJpbmRpbmdzIGZvciBhIGdpdmVuIG5vZGUgYW5kIGdlbmVyYXRlc1xuICogYSBtYXAgb2YgcHJvcGVydHkgbmFtZXMgdG8gdmFsdWVzLiBUaGlzIG1hcCBvbmx5IGNvbnRhaW5zIHByb3BlcnR5IGJpbmRpbmdzXG4gKiBkZWZpbmVkIGluIHRlbXBsYXRlcywgbm90IGluIGhvc3QgYmluZGluZ3MuXG4gKi9cbmZ1bmN0aW9uIGNvbGxlY3RQcm9wZXJ0eUJpbmRpbmdzKFxuICAgIHROb2RlOiBUTm9kZSwgbFZpZXc6IExWaWV3LCB0RGF0YTogVERhdGEpOiB7W2tleTogc3RyaW5nXTogc3RyaW5nfSB7XG4gIGNvbnN0IHByb3BlcnRpZXM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmd9ID0ge307XG4gIGxldCBiaW5kaW5nSW5kZXhlcyA9IHROb2RlLnByb3BlcnR5QmluZGluZ3M7XG5cbiAgaWYgKGJpbmRpbmdJbmRleGVzICE9PSBudWxsKSB7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBiaW5kaW5nSW5kZXhlcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgYmluZGluZ0luZGV4ID0gYmluZGluZ0luZGV4ZXNbaV07XG4gICAgICBjb25zdCBwcm9wTWV0YWRhdGEgPSB0RGF0YVtiaW5kaW5nSW5kZXhdIGFzIHN0cmluZztcbiAgICAgIGNvbnN0IG1ldGFkYXRhUGFydHMgPSBwcm9wTWV0YWRhdGEuc3BsaXQoSU5URVJQT0xBVElPTl9ERUxJTUlURVIpO1xuICAgICAgY29uc3QgcHJvcGVydHlOYW1lID0gbWV0YWRhdGFQYXJ0c1swXTtcbiAgICAgIGlmIChtZXRhZGF0YVBhcnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgbGV0IHZhbHVlID0gbWV0YWRhdGFQYXJ0c1sxXTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDE7IGogPCBtZXRhZGF0YVBhcnRzLmxlbmd0aCAtIDE7IGorKykge1xuICAgICAgICAgIHZhbHVlICs9IHJlbmRlclN0cmluZ2lmeShsVmlld1tiaW5kaW5nSW5kZXggKyBqIC0gMV0pICsgbWV0YWRhdGFQYXJ0c1tqICsgMV07XG4gICAgICAgIH1cbiAgICAgICAgcHJvcGVydGllc1twcm9wZXJ0eU5hbWVdID0gdmFsdWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBwcm9wZXJ0aWVzW3Byb3BlcnR5TmFtZV0gPSBsVmlld1tiaW5kaW5nSW5kZXhdO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwcm9wZXJ0aWVzO1xufVxuXG5cbmZ1bmN0aW9uIGNvbGxlY3RDbGFzc05hbWVzKGRlYnVnRWxlbWVudDogRGVidWdFbGVtZW50X19QT1NUX1IzX18pOiBzdHJpbmcge1xuICBjb25zdCBjbGFzc2VzID0gZGVidWdFbGVtZW50LmNsYXNzZXM7XG4gIGxldCBvdXRwdXQgPSAnJztcblxuICBmb3IgKGNvbnN0IGNsYXNzTmFtZSBvZiBPYmplY3Qua2V5cyhjbGFzc2VzKSkge1xuICAgIGlmIChjbGFzc2VzW2NsYXNzTmFtZV0pIHtcbiAgICAgIG91dHB1dCA9IG91dHB1dCA/IG91dHB1dCArIGAgJHtjbGFzc05hbWV9YCA6IGNsYXNzTmFtZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3V0cHV0O1xufVxuXG5cbi8vIE5lZWQgdG8ga2VlcCB0aGUgbm9kZXMgaW4gYSBnbG9iYWwgTWFwIHNvIHRoYXQgbXVsdGlwbGUgYW5ndWxhciBhcHBzIGFyZSBzdXBwb3J0ZWQuXG5jb25zdCBfbmF0aXZlTm9kZVRvRGVidWdOb2RlID0gbmV3IE1hcDxhbnksIERlYnVnTm9kZT4oKTtcblxuZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QUkVfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIHJldHVybiBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmdldChuYXRpdmVOb2RlKSB8fCBudWxsO1xufVxuXG5jb25zdCBOR19ERUJVR19QUk9QRVJUWSA9ICdfX25nX2RlYnVnX18nO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGVidWdOb2RlX19QT1NUX1IzX18obmF0aXZlTm9kZTogRWxlbWVudCk6IERlYnVnRWxlbWVudF9fUE9TVF9SM19fO1xuZXhwb3J0IGZ1bmN0aW9uIGdldERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGU6IE5vZGUpOiBEZWJ1Z05vZGVfX1BPU1RfUjNfXztcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBudWxsKTogbnVsbDtcbmV4cG9ydCBmdW5jdGlvbiBnZXREZWJ1Z05vZGVfX1BPU1RfUjNfXyhuYXRpdmVOb2RlOiBhbnkpOiBEZWJ1Z05vZGV8bnVsbCB7XG4gIGlmIChuYXRpdmVOb2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgIGlmICghKG5hdGl2ZU5vZGUuaGFzT3duUHJvcGVydHkoTkdfREVCVUdfUFJPUEVSVFkpKSkge1xuICAgICAgKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV0gPSBuYXRpdmVOb2RlLm5vZGVUeXBlID09IE5vZGUuRUxFTUVOVF9OT0RFID9cbiAgICAgICAgICBuZXcgRGVidWdFbGVtZW50X19QT1NUX1IzX18obmF0aXZlTm9kZSBhcyBFbGVtZW50KSA6XG4gICAgICAgICAgbmV3IERlYnVnTm9kZV9fUE9TVF9SM19fKG5hdGl2ZU5vZGUpO1xuICAgIH1cbiAgICByZXR1cm4gKG5hdGl2ZU5vZGUgYXMgYW55KVtOR19ERUJVR19QUk9QRVJUWV07XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQHB1YmxpY0FwaVxuICovXG5leHBvcnQgY29uc3QgZ2V0RGVidWdOb2RlOiAobmF0aXZlTm9kZTogYW55KSA9PiBEZWJ1Z05vZGUgfCBudWxsID0gZ2V0RGVidWdOb2RlX19QUkVfUjNfXztcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFsbERlYnVnTm9kZXMoKTogRGVidWdOb2RlW10ge1xuICByZXR1cm4gQXJyYXkuZnJvbShfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnZhbHVlcygpKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluZGV4RGVidWdOb2RlKG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLnNldChub2RlLm5hdGl2ZU5vZGUsIG5vZGUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmVtb3ZlRGVidWdOb2RlRnJvbUluZGV4KG5vZGU6IERlYnVnTm9kZSkge1xuICBfbmF0aXZlTm9kZVRvRGVidWdOb2RlLmRlbGV0ZShub2RlLm5hdGl2ZU5vZGUpO1xufVxuXG4vKipcbiAqIEEgYm9vbGVhbi12YWx1ZWQgZnVuY3Rpb24gb3ZlciBhIHZhbHVlLCBwb3NzaWJseSBpbmNsdWRpbmcgY29udGV4dCBpbmZvcm1hdGlvblxuICogcmVnYXJkaW5nIHRoYXQgdmFsdWUncyBwb3NpdGlvbiBpbiBhbiBhcnJheS5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUHJlZGljYXRlPFQ+IHsgKHZhbHVlOiBUKTogYm9vbGVhbjsgfVxuXG4vKipcbiAqIEBwdWJsaWNBcGlcbiAqL1xuZXhwb3J0IGNvbnN0IERlYnVnTm9kZToge25ldyAoLi4uYXJnczogYW55W10pOiBEZWJ1Z05vZGV9ID0gRGVidWdOb2RlX19QUkVfUjNfXztcblxuLyoqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBjb25zdCBEZWJ1Z0VsZW1lbnQ6IHtuZXcgKC4uLmFyZ3M6IGFueVtdKTogRGVidWdFbGVtZW50fSA9IERlYnVnRWxlbWVudF9fUFJFX1IzX187XG4iXX0=